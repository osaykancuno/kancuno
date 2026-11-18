// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title THE K.LAB · K1N1
/// @author K4NCUN0 (kancuno.com)
/// @notice Every K1N1 is a K designed in THE K.LAB (kancuno.com/lab) and minted by its creator.
/// The design itself is stored on-chain (as contract bytecode, SSTORE2) and the artwork (an SVG,
/// animated when the design has loops) is drawn on-chain by the renderer. No IPFS, no server.
/// At most 8,362 K1N1, one per transaction, at a fixed price. The minter picks the number of their
/// K1N1 (#1 to #8362, any one still free), or lets the Lab pick one at random. Every K1N1 is a unique
/// combination of colours from the K1N1 palette (16 colours, clearly apart from each other):
/// a design with the same colours as one already minted cannot be minted again, whatever its
/// effects, loops, title or 3D viewing angle (see keyOf). No near-copies: there are no
/// "similar" colours to pick. And every K1N1 is the K itself, the clay character of kancuno.com:
/// its head and its X always show.
interface IKLabRenderer {
    function validate(bytes calldata data) external pure returns (bool);
    function tokenURI(uint256 id, bytes calldata data, string calldata site) external view returns (string memory);
    function contractURI(string calldata site) external view returns (string memory);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

contract KLab {
    string public constant name = "THE K.LAB";
    string public constant symbol = "K1N1";
    uint256 public constant MAX_SUPPLY = 8362;
    /// The K1N1 palette: yellow, ink, pink, purple, cream, grey, cyan, blue, green, red, orange,
    /// brown, tan, magenta, navy, lime (any two are at least ΔE2000 14 apart)
    bytes public constant PALETTE = hex"fbc5000f0d0afc98ca9559bbfff6dc7a74683ff2ff2f6bff27e07aff3b30ff7a1a6b3e26d9b38cff4fd81d2a6bc8f04a";

    address public owner;
    IKLabRenderer public renderer;
    bool public rendererLocked; // once locked, the artwork can never change
    bool public mintOpen = true;
    string public site = "https://www.kancuno.com";
    uint256 public totalSupply;
    uint256 public price = 0.0042 ether;

    address public royaltyReceiver;
    uint96 public royaltyBps; // EIP-2981, 0 by default, at most 10%

    mapping(uint256 => address) private _ownerOf;
    mapping(address => uint256) private _balanceOf;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;
    mapping(uint256 => address) private _design; // SSTORE2 pointer: the design bytes live in its code
    mapping(bytes32 => uint256) public tokenOfKey; // look → the K1N1 that has it (0 = free)
    mapping(uint256 => uint256) private _usedWords; // one bit per token number, 256 per word

    event Transfer(address indexed from, address indexed to, uint256 indexed id);
    event Approval(address indexed owner, address indexed spender, uint256 indexed id);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event MetadataUpdate(uint256 tokenId); // EIP-4906
    event BatchMetadataUpdate(uint256 fromTokenId, uint256 toTokenId); // EIP-4906
    event MintOpen(bool open);
    event PriceChanged(uint256 price);

    error NotOwner();
    error MintClosed();
    error BadDesign();
    error NoToken();
    error NotAuthorized();
    error WrongFrom();
    error ZeroAddress();
    error UnsafeRecipient();
    error Locked();
    error RoyaltyTooHigh();
    error WriteFailed();
    error AlreadyMinted(uint256 tokenId);
    error BadNumber(uint256 tokenId); // outside 1..MAX_SUPPLY
    error NumberTaken(uint256 tokenId);
    error OffPalette(uint256 offset);
    error NotAK(); // not the clay K with its head and its X // a visible colour that is not in the K1N1 palette (byte offset)
    error SoldOut();
    error WrongPrice();
    error WithdrawFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address renderer_, address owner_) {
        if (renderer_ == address(0) || owner_ == address(0)) revert ZeroAddress();
        owner = owner_;
        renderer = IKLabRenderer(renderer_);
        royaltyReceiver = owner_;
        emit OwnershipTransferred(address(0), owner_);
    }

    // ── Mint ───────────────────────────────────────────────────────────────

    /// @notice Mint your K as K1N1 #`id`: `data` is the design encoded by THE K.LAB (see the
    /// renderer's validate), `id` any free number from 1 to MAX_SUPPLY (see isAvailable, usedMap).
    function mint(bytes calldata data, uint256 id) external payable {
        if (!mintOpen) revert MintClosed();
        if (id == 0 || id > MAX_SUPPLY) revert BadNumber(id);
        if (_ownerOf[id] != address(0)) revert NumberTaken(id);
        if (totalSupply >= MAX_SUPPLY) revert SoldOut();
        if (msg.value != price) revert WrongPrice();
        if (!renderer.validate(data)) revert BadDesign();
        if (!isK(data)) revert NotAK();
        bytes32 key = keyOf(data);
        uint256 taken = tokenOfKey[key];
        if (taken != 0) revert AlreadyMinted(taken);
        unchecked {
            ++totalSupply;
            _balanceOf[msg.sender]++;
        }
        _usedWords[id >> 8] |= 1 << (id & 255);
        tokenOfKey[key] = id;
        _design[id] = _write(data);
        _ownerOf[id] = msg.sender;
        emit Transfer(address(0), msg.sender, id);
    }

    /// @notice The colour fingerprint of a design: every K1N1 has a unique combination of colours.
    /// Every visible colour must be one of the 16 of PALETTE, so two K1N1 can never differ by a
    /// shade: either a colour is the same or it is clearly another one. What counts, part by part:
    /// the background, the X and the seven head squares in order (or the head's one fill).
    /// Hidden parts count as "none"; a gradient or pattern counts
    /// as its two colours, in either order. Style (solid, neon, gradient angle, pattern), effects,
    /// loops, the title and the 3D view do not count.
    /// Lives here, not in the renderer, so uniqueness can never change with the renderer.
    function keyOf(bytes calldata d) public pure returns (bytes32) {
        if (d.length < 64) revert BadDesign();
        uint8 flags = uint8(d[2]);
        bytes memory bg = (flags & 1) != 0 ? _fillColours(d, 3) : bytes("-");
        bytes memory body = (flags & 2) != 0 ? _fillColours(d, 11) : bytes("-");
        bytes memory head;
        if ((flags & 4) == 0) head = "-";
        else if ((flags & 32) != 0) head = abi.encode("fill", _fillColours(d, 19));
        else {
            uint8[7] memory q;
            for (uint256 i = 0; i < 7; i++) q[i] = _ix(d, 27 + i * 3);
            head = abi.encode("cubes", q);
        }
        return keccak256(abi.encode("vector", bg, body, head)); // abi.encode: lengths make it unambiguous
    }

    // the palette number (1..16) of the colour at byte `o`; reverts for any other colour
    function _ix(bytes calldata d, uint256 o) private pure returns (uint8) {
        bytes memory P = PALETTE;
        for (uint256 i = 0; i < 16; i++) {
            if (P[i * 3] == d[o] && P[i * 3 + 1] == d[o + 1] && P[i * 3 + 2] == d[o + 2]) return uint8(i + 1);
        }
        revert OffPalette(o);
    }

    // a fill's colours: one for a solid, the two of a gradient or pattern in a fixed order
    function _fillColours(bytes calldata d, uint256 o) private pure returns (bytes memory) {
        uint8 a = _ix(d, o + 1);
        if (uint8(d[o]) == 0) return abi.encodePacked(a);
        uint8 b = _ix(d, o + 4);
        return a < b ? abi.encodePacked(a, b) : abi.encodePacked(b, a);
    }

    /// @notice True when the design is the clay K with its head and its X showing.
    function isK(bytes calldata d) public pure returns (bool) {
        return d.length >= 64 && uint8(d[1]) == 0 && (uint8(d[2]) & 6) == 6;
    }

    /// @notice 0 if this look is still free to mint, else the K1N1 that already has it.
    function mintedAs(bytes calldata data) external view returns (uint256) {
        return tokenOfKey[keyOf(data)];
    }

    /// @notice True when K1N1 #`id` exists and can still be minted.
    function isAvailable(uint256 id) external view returns (bool) {
        return id != 0 && id <= MAX_SUPPLY && _ownerOf[id] == address(0);
    }

    /// @notice Which numbers are taken, in one call: bit `id & 255` of word `id >> 8` (33 words).
    function usedMap() external view returns (uint256[] memory words) {
        words = new uint256[]((MAX_SUPPLY >> 8) + 1);
        for (uint256 i = 0; i < words.length; i++) words[i] = _usedWords[i];
    }

    /// @notice The design bytes of a K1N1, as minted.
    function designOf(uint256 id) public view returns (bytes memory data) {
        address p = _design[id];
        if (p == address(0)) revert NoToken();
        assembly ("memory-safe") {
            let size := sub(extcodesize(p), 1)
            data := mload(0x40)
            mstore(data, size)
            extcodecopy(p, add(data, 0x20), 1, size)
            mstore(0x40, add(add(data, 0x20), and(add(size, 31), not(31))))
        }
    }

    function tokenURI(uint256 id) external view returns (string memory) {
        return renderer.tokenURI(id, designOf(id), site);
    }

    function contractURI() external view returns (string memory) {
        return renderer.contractURI(site);
    }

    // SSTORE2: a contract whose code is 0x00 (STOP) followed by the data
    function _write(bytes calldata data) private returns (address p) {
        bytes memory code = abi.encodePacked(hex"63", uint32(data.length + 1), hex"80600e6000396000f3", hex"00", data);
        assembly ("memory-safe") {
            p := create(0, add(code, 0x20), mload(code))
        }
        if (p == address(0)) revert WriteFailed();
    }

    // ── ERC-721 ────────────────────────────────────────────────────────────

    function ownerOf(uint256 id) public view returns (address o) {
        o = _ownerOf[id];
        if (o == address(0)) revert NoToken();
    }

    function balanceOf(address o) external view returns (uint256) {
        if (o == address(0)) revert ZeroAddress();
        return _balanceOf[o];
    }

    function approve(address spender, uint256 id) external {
        address o = ownerOf(id);
        if (msg.sender != o && !isApprovedForAll[o][msg.sender]) revert NotAuthorized();
        getApproved[id] = spender;
        emit Approval(o, spender, id);
    }

    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(address from, address to, uint256 id) public {
        if (from != _ownerOf[id]) revert WrongFrom();
        if (to == address(0)) revert ZeroAddress();
        if (msg.sender != from && !isApprovedForAll[from][msg.sender] && msg.sender != getApproved[id]) revert NotAuthorized();
        unchecked {
            _balanceOf[from]--;
            _balanceOf[to]++;
        }
        _ownerOf[id] = to;
        delete getApproved[id];
        emit Transfer(from, to, id);
    }

    function safeTransferFrom(address from, address to, uint256 id) external {
        safeTransferFrom(from, to, id, "");
    }

    function safeTransferFrom(address from, address to, uint256 id, bytes memory data) public {
        transferFrom(from, to, id);
        if (to.code.length != 0 && IERC721Receiver(to).onERC721Received(msg.sender, from, id, data) != IERC721Receiver.onERC721Received.selector) {
            revert UnsafeRecipient();
        }
    }

    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == 0x01ffc9a7 // ERC-165
            || id == 0x80ac58cd // ERC-721
            || id == 0x5b5e139f // ERC-721 Metadata
            || id == 0x2a55205a // ERC-2981
            || id == 0x49064906; // ERC-4906
    }

    function royaltyInfo(uint256, uint256 salePrice) external view returns (address, uint256) {
        return (royaltyReceiver, (salePrice * royaltyBps) / 10_000);
    }

    // ── Owner ──────────────────────────────────────────────────────────────

    function setPrice(uint256 p) external onlyOwner {
        price = p;
        emit PriceChanged(p);
    }

    function withdraw() external onlyOwner {
        (bool ok, ) = payable(owner).call{value: address(this).balance}("");
        if (!ok) revert WithdrawFailed();
    }

    function setMintOpen(bool open) external onlyOwner {
        mintOpen = open;
        emit MintOpen(open);
    }

    function setRenderer(address r) external onlyOwner {
        if (rendererLocked) revert Locked();
        if (r == address(0)) revert ZeroAddress();
        renderer = IKLabRenderer(r);
        if (totalSupply != 0) emit BatchMetadataUpdate(1, totalSupply);
    }

    /// @notice Freeze the renderer forever: the artwork of every K1N1 can never change again.
    function lockRenderer() external onlyOwner {
        rendererLocked = true;
    }

    function setSite(string calldata s) external onlyOwner {
        site = s;
        if (totalSupply != 0) emit BatchMetadataUpdate(1, totalSupply);
    }

    function setRoyalty(address receiver, uint96 bps) external onlyOwner {
        if (bps > 1_000) revert RoyaltyTooHigh();
        if (receiver == address(0)) revert ZeroAddress();
        royaltyReceiver = receiver;
        royaltyBps = bps;
    }

    function transferOwnership(address to) external onlyOwner {
        emit OwnershipTransferred(owner, to);
        owner = to; // address(0) renounces
    }
}
