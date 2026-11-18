// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title THE K.LAB · K1N0
/// @author K4NCUN0 (kancuno.com)
/// @notice A K1N0 is the Kancuno K in clay-like 3D: the X and four blocks of the head always black,
/// and four colours of its own: the background, the centre block and the two front blocks
/// (the K4NCUN0 logo: yellow, purple, pink, pink). Every combination of the four
/// can be minted once (colours from a palette of 16). The minter picks the number of their K1N0
/// (#1 to #8362, or a free one at random); #0 is the K4NCUN0 logo, minted to the artist with the contract.
///
/// The look is alive: whoever holds a K1N0 can give each of its four colours an effect, set the
/// speed and the 3D view, for the gas only. Every look is kept on-chain with who set it and when,
/// so each K1N0 carries the story of its holders. Image, 3D piece and metadata are drawn on-chain.
///
/// Built to grow, never to change what is minted: the number, the four colours and every look
/// already set are permanent, and there will never be more than 8,362 K1N0 (plus #0). What can
/// evolve: the artwork and the effects a look may use (a new renderer, until it is locked), new
/// ways to mint the remaining numbers and new tools around the K1N0 (extensions approved by the
/// owner, until they are locked), and apps a holder lets set looks for them (look operators).
interface IKLabRenderer {
    function tokenURI(uint256 id, bytes calldata data, string calldata site) external view returns (string memory);
    function contractURI(string calldata site) external view returns (string memory);
    function validLook(bytes8 look) external view returns (bool);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

contract KLab {
    string public constant name = "THE K.LAB";
    string public constant symbol = "K1N0";
    uint256 public constant MAX_SUPPLY = 8362;
    uint256 public constant LOGO = 0; // K1N0 #0: the K4NCUN0 logo
    uint8 public constant INK = 1; // palette index of the black of the K

    /// The palette: yellow, ink, pink, purple, cream, grey, cyan, blue, green, red, orange, brown,
    /// tan, magenta, navy, lime (any two are at least ΔE2000 14 apart)
    bytes public constant PALETTE = hex"fbc5000f0d0afc98ca9559bbfff6dc7a74683ff2ff2f6bff27e07aff3b30ff7a1a6b3e26d9b38cff4fd81d2a6bc8f04a";

    /// The look of a new K1N0: no effects, normal speed, the front 3D view
    bytes8 public constant DEFAULT_LOOK = 0x0000000001004a64;

    address public owner;
    address public pendingOwner; // two-step hand-over: the new owner accepts
    IKLabRenderer public renderer;
    bool public rendererLocked; // once locked, the artwork can never change
    bool public extensionsLocked; // once locked, the list of extensions can never change
    bool public mintOpen; // closed until the owner opens it (setMintOpen) at the launch
    string public site = "https://www.kancuno.com";
    uint256 public totalSupply;
    uint256 public price = 0.0024 ether;

    address public royaltyReceiver;
    uint96 public royaltyBps; // EIP-2981, 0 by default, at most 10%

    mapping(uint256 => address) private _ownerOf;
    mapping(address => uint256) private _balanceOf;
    mapping(uint256 => address) private _approved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    // the K1N0 itself
    mapping(uint256 => bytes4) public coloursOf; // palette indices: background, centre, front left, front right
    mapping(uint256 => bytes32) private _title; // up to 32 characters, set at mint
    mapping(bytes4 => uint256) private _colourTaken; // colours → token id + 1 (0 = free)
    mapping(uint256 => uint256) private _usedWords; // one bit per token number

    // its looks: look (64 bits) | time (32 bits) | who set it (160 bits), oldest first
    mapping(uint256 => uint256[]) private _looks;

    /// Contracts the owner approved to extend the collection: mint free numbers through their own
    /// rules (same colour rules, same 8,362 cap) and ask marketplaces to refresh.
    mapping(address => bool) public isExtension;
    /// holder => app => whether the app may set the looks of the holder's K1N0 (looks only, never transfers)
    mapping(address => mapping(address => bool)) public isLookOperator;

    event Transfer(address indexed from, address indexed to, uint256 indexed id);
    event Approval(address indexed owner, address indexed spender, uint256 indexed id);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event MetadataUpdate(uint256 tokenId); // EIP-4906
    event BatchMetadataUpdate(uint256 fromTokenId, uint256 toTokenId); // EIP-4906
    event MintOpen(bool open);
    event PriceChanged(uint256 price);
    event LookSet(uint256 indexed id, uint256 indexed version, address indexed by, bytes8 look);
    event ExtensionSet(address indexed extension, bool enabled);
    event LookOperatorSet(address indexed holder, address indexed operator, bool enabled);
    event ContractURIUpdated(); // ERC-7572

    error NotOwner();
    error MintClosed();
    error WrongPrice();
    error BadNumber(uint256 tokenId);
    error NumberTaken(uint256 tokenId);
    error ColoursTaken(uint256 tokenId);
    error BadColours();
    error BadLook();
    error BadTitle();
    error NoToken();
    error NotAuthorized();
    error WrongFrom();
    error ZeroAddress();
    error UnsafeRecipient();
    error Locked();
    error RoyaltyTooHigh();
    error WithdrawFailed();
    error BadSite();
    error BadRenderer();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @param logoColours and logoTitle make K1N0 #0, minted to `owner_` with the contract
    constructor(address renderer_, address owner_, bytes4 logoColours, string memory logoTitle) {
        if (owner_ == address(0)) revert ZeroAddress();
        if (renderer_.code.length == 0) revert BadRenderer();
        owner = owner_;
        renderer = IKLabRenderer(renderer_);
        royaltyReceiver = owner_;
        emit OwnershipTransferred(address(0), owner_);
        _mint(owner_, LOGO, logoColours, logoTitle, DEFAULT_LOOK);
    }

    // ── Mint ───────────────────────────────────────────────────────────────

    /// @notice Mint K1N0 #`id` in `colours` (palette indices: background, centre, front left, front right).
    /// `title` is optional (letters, digits, space and - _ . ' ! #, 32 at most); `look` its first look.
    function mint(bytes4 colours, string calldata title, bytes8 look, uint256 id) external payable {
        if (!mintOpen) revert MintClosed();
        if (msg.value != price) revert WrongPrice();
        _mintPublic(msg.sender, id, colours, title, look);
    }

    /// @notice For extensions: mint K1N0 #`id` to `to` under the extension's own rules (an allowlist,
    /// a claim, another sale...). The K1N0 rules stay the same: #1 to #8362, unique colours.
    function extensionMint(address to, bytes4 colours, string calldata title, bytes8 look, uint256 id) external {
        if (!isExtension[msg.sender]) revert NotAuthorized();
        if (to == address(0)) revert ZeroAddress();
        _mintPublic(to, id, colours, title, look);
    }

    function _mintPublic(address to, uint256 id, bytes4 colours, string calldata title, bytes8 look) private {
        if (id == 0 || id > MAX_SUPPLY) revert BadNumber(id);
        if (_hasArtistName(bytes(title))) revert BadTitle(); // the name belongs to the logo, #0
        _mint(to, id, colours, title, look);
    }

    function _mint(address to, uint256 id, bytes4 colours, string memory title, bytes8 look) private {
        if (_ownerOf[id] != address(0)) revert NumberTaken(id);
        if (!validColours(colours)) revert BadColours();
        if (!validLook(look)) revert BadLook();
        uint256 taken = _colourTaken[colours];
        if (taken != 0) revert ColoursTaken(taken - 1);
        _colourTaken[colours] = id + 1;
        coloursOf[id] = colours;
        _title[id] = _titleBytes(title);
        _usedWords[id >> 8] |= 1 << (id & 255);
        unchecked {
            ++totalSupply;
            _balanceOf[to]++;
        }
        _ownerOf[id] = to;
        emit Transfer(address(0), to, id);
        _setLook(id, look, to);
    }

    /// @notice Four palette indices; the background is never black (the K is), and the coloured
    /// blocks stand out from the background.
    function validColours(bytes4 c) public pure returns (bool) {
        uint8 bg = uint8(c[0]);
        if (bg > 15 || bg == INK) return false;
        for (uint256 i = 1; i < 4; i++) {
            uint8 x = uint8(c[i]);
            if (x > 15 || x == bg) return false;
        }
        return true;
    }

    /// @notice A look (8 bytes: effect of the background, centre, front left, front right, speed,
    /// yaw, pitch, zoom). Which effects exist is up to the renderer, so new ones can come with a
    /// new renderer; looks already set stay as they are.
    function validLook(bytes8 l) public view returns (bool) {
        return renderer.validLook(l);
    }

    // "k4ncun0" anywhere in the title, in any case, with 4/a and 0/o read alike (K4NCUN0, KANCUNO...)
    function _hasArtistName(bytes calldata t) private pure returns (bool) {
        bytes7 artist = "kancuno";
        if (t.length < 7) return false;
        for (uint256 i = 0; i + 7 <= t.length; i++) {
            uint256 k;
            while (k < 7) {
                uint8 c = uint8(t[i + k]);
                if (c >= 0x41 && c <= 0x5a) c += 32;
                if (c == 0x34) c = 0x61; // 4 -> a
                if (c == 0x30) c = 0x6f; // 0 -> o
                if (c != uint8(artist[k])) break;
                k++;
            }
            if (k == 7) return true;
        }
        return false;
    }

    function _titleBytes(string memory t) private pure returns (bytes32 out) {
        bytes memory b = bytes(t);
        if (b.length > 32) revert BadTitle();
        for (uint256 i = 0; i < b.length; i++) {
            uint8 c = uint8(b[i]);
            bool ok = (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a)
                || c == 0x20 || c == 0x2d || c == 0x5f || c == 0x2e || c == 0x27 || c == 0x21 || c == 0x23;
            if (!ok) revert BadTitle();
        }
        if (b.length == 0) return bytes32(0);
        assembly ("memory-safe") {
            out := mload(add(b, 32))
        }
        if (b.length < 32) out &= bytes32(~(type(uint256).max >> (b.length * 8)));
    }

    // ── The look: changed by the holder, kept forever ─────────────────────

    /// @notice Give your K1N0 a new look (the holder, or an app the holder made a look operator). Gas only.
    /// Marketplaces approved to move a K1N0 cannot change its look.
    function setLook(uint256 id, bytes8 look) external {
        address o = ownerOf(id);
        if (msg.sender != o && !isLookOperator[o][msg.sender]) revert NotAuthorized();
        if (!validLook(look)) revert BadLook();
        _setLook(id, look, msg.sender);
    }

    /// @notice Let an app set the looks of your K1N0 (looks only: it can never move them). Any time, back too.
    function setLookOperator(address operator, bool enabled) external {
        isLookOperator[msg.sender][operator] = enabled;
        emit LookOperatorSet(msg.sender, operator, enabled);
    }

    function _setLook(uint256 id, bytes8 look, address by) private {
        _looks[id].push((uint256(uint64(look)) << 192) | (uint256(uint32(block.timestamp)) << 160) | uint256(uint160(by)));
        emit LookSet(id, _looks[id].length, by, look);
        emit MetadataUpdate(id);
    }

    function lookOf(uint256 id) public view returns (bytes8) {
        uint256[] storage v = _looks[id];
        if (v.length == 0) revert NoToken();
        return bytes8(uint64(v[v.length - 1] >> 192));
    }

    /// @notice How many looks this K1N0 has had (1 = the one it was minted with)
    function looksCount(uint256 id) public view returns (uint256) {
        return _looks[id].length;
    }

    /// @notice Look number `v` (1 = the first): the look, who set it and when
    function lookAt(uint256 id, uint256 v) external view returns (bytes8 look, address by, uint32 time) {
        if (v == 0 || v > _looks[id].length) revert NoToken();
        uint256 x = _looks[id][v - 1];
        return (bytes8(uint64(x >> 192)), address(uint160(x)), uint32(x >> 160));
    }

    function titleOf(uint256 id) public view returns (string memory) {
        bytes32 t = _title[id];
        uint256 n;
        while (n < 32 && t[n] != 0) n++;
        bytes memory out = new bytes(n);
        for (uint256 i = 0; i < n; i++) out[i] = t[i];
        return string(out);
    }

    /// @notice The data the renderer draws from: colours (4), look (8), number of looks (2), title
    function dataOf(uint256 id) public view returns (bytes memory) {
        if (_ownerOf[id] == address(0)) revert NoToken();
        bytes memory t = bytes(titleOf(id));
        uint256 n = looksCount(id);
        return abi.encodePacked(coloursOf[id], lookOf(id), uint16(n > 65535 ? 65535 : n), uint8(t.length), t);
    }

    function tokenURI(uint256 id) external view returns (string memory) {
        return renderer.tokenURI(id, dataOf(id), site);
    }

    function contractURI() external view returns (string memory) {
        return renderer.contractURI(site);
    }

    // ── Availability ───────────────────────────────────────────────────────

    /// @notice Whether these colours are taken, and by which K1N0
    function coloursTaken(bytes4 colours) external view returns (bool taken, uint256 id) {
        uint256 t = _colourTaken[colours];
        return (t != 0, t == 0 ? 0 : t - 1);
    }

    /// @notice True when K1N0 #`id` can still be minted (#1 to #8362)
    function isAvailable(uint256 id) external view returns (bool) {
        return id >= 1 && id <= MAX_SUPPLY && _ownerOf[id] == address(0);
    }

    /// @notice Which numbers are taken, in one call: bit `id & 255` of word `id >> 8` (33 words)
    function usedMap() external view returns (uint256[] memory words) {
        words = new uint256[]((MAX_SUPPLY >> 8) + 1);
        for (uint256 i = 0; i < words.length; i++) words[i] = _usedWords[i];
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

    function getApproved(uint256 id) external view returns (address) {
        ownerOf(id); // reverts for a token that does not exist
        return _approved[id];
    }

    function approve(address spender, uint256 id) external {
        address o = ownerOf(id);
        if (msg.sender != o && !isApprovedForAll[o][msg.sender]) revert NotAuthorized();
        _approved[id] = spender;
        emit Approval(o, spender, id);
    }

    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(address from, address to, uint256 id) public {
        if (from != _ownerOf[id]) revert WrongFrom();
        if (to == address(0)) revert ZeroAddress();
        if (msg.sender != from && !isApprovedForAll[from][msg.sender] && msg.sender != _approved[id]) revert NotAuthorized();
        unchecked {
            _balanceOf[from]--;
            _balanceOf[to]++;
        }
        _ownerOf[id] = to;
        delete _approved[id];
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
        return id == 0x01ffc9a7 || id == 0x80ac58cd || id == 0x5b5e139f || id == 0x2a55205a || id == 0x49064906;
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
        if (r.code.length == 0 || !IKLabRenderer(r).validLook(DEFAULT_LOOK)) revert BadRenderer();
        renderer = IKLabRenderer(r);
        emit BatchMetadataUpdate(0, MAX_SUPPLY);
        emit ContractURIUpdated();
    }

    /// @notice Freeze the renderer forever: the artwork of every K1N0 can never change again.
    function lockRenderer() external onlyOwner {
        rendererLocked = true;
    }

    /// @notice The site the metadata links to (a plain URL: quotes and backslashes would break the JSON).
    function setSite(string calldata s) external onlyOwner {
        bytes calldata b = bytes(s);
        for (uint256 i = 0; i < b.length; i++) if (b[i] == '"' || b[i] == "\\" || uint8(b[i]) < 0x20) revert BadSite();
        site = s;
        emit BatchMetadataUpdate(0, MAX_SUPPLY);
        emit ContractURIUpdated();
    }

    /// @notice Approve (or remove) an extension: a contract that mints free numbers under its own
    /// rules and can ask marketplaces to refresh. Every change is public (ExtensionSet). After
    /// lockExtensions no extension can be added, but one can still be removed.
    function setExtension(address extension, bool enabled) external onlyOwner {
        if (extensionsLocked && enabled) revert Locked();
        if (extension == address(0)) revert ZeroAddress();
        isExtension[extension] = enabled;
        emit ExtensionSet(extension, enabled);
    }

    /// @notice No new extension, ever (removing one stays possible).
    function lockExtensions() external onlyOwner {
        extensionsLocked = true;
    }

    /// @notice Ask marketplaces to read K1N0 #`from` to #`to` again (after something outside this
    /// contract that the renderer reads has changed). The owner or an extension.
    function refreshMetadata(uint256 from, uint256 to) external {
        if (msg.sender != owner && !isExtension[msg.sender]) revert NotAuthorized();
        if (from == to) emit MetadataUpdate(from);
        else emit BatchMetadataUpdate(from, to);
    }

    function setRoyalty(address receiver, uint96 bps) external onlyOwner {
        if (bps > 1_000) revert RoyaltyTooHigh();
        if (receiver == address(0)) revert ZeroAddress();
        royaltyReceiver = receiver;
        royaltyBps = bps;
    }

    /// @notice Offer the collection to another wallet; it becomes the owner when it accepts
    /// (acceptOwnership), so a typo can never lose it. Royalties follow if they went to the owner.
    function transferOwnership(address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        pendingOwner = to;
        emit OwnershipTransferStarted(owner, to);
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotAuthorized();
        if (royaltyReceiver == owner) royaltyReceiver = msg.sender;
        emit OwnershipTransferred(owner, msg.sender);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    /// @notice Give up the owner's controls for good (price, pause, withdraw, renderer, site, extensions).
    /// What the contract holds goes to the owner first, so nothing is stranded.
    function renounceOwnership() external onlyOwner {
        (bool ok, ) = payable(owner).call{value: address(this).balance}("");
        if (!ok) revert WithdrawFailed();
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
        pendingOwner = address(0);
    }
}
