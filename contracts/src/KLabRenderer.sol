// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IKLabArt3D {
    function render(bytes calldata data) external view returns (bytes memory);
}

interface IKLabViewer {
    function html(bytes calldata data) external pure returns (bytes memory);
}

/// @title THE K.LAB renderer
/// @notice The metadata of a K1N0: the 3D image (KLabArt3D), the interactive 3D piece
/// (KLabViewer), and traits that say its colours by name, the effect of each colour, its speed
/// and how many looks it has had. data: see KLabArt3D.
contract KLabRenderer {
    bytes private constant B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    IKLabArt3D public immutable art;
    IKLabViewer public immutable viewer;

    constructor(IKLabArt3D art_, IKLabViewer viewer_) {
        art = art_;
        viewer = viewer_;
    }

    /// @notice The looks this renderer draws: effect of the background (0-8), of the centre, front left,
    /// front right (0-8 each), speed (0-3), 3D view: yaw (int8, x2 degrees), pitch (20-89), zoom (60-190 %).
    function validLook(bytes8 l) external pure returns (bool) {
        for (uint256 i = 0; i < 4; i++) if (uint8(l[i]) > 8) return false;
        uint8 pitch = uint8(l[6]);
        uint8 zoom = uint8(l[7]);
        return uint8(l[4]) <= 3 && pitch >= 20 && pitch <= 89 && zoom >= 60 && zoom <= 190;
    }

    function tokenURI(uint256 id, bytes calldata data, string calldata site) external view returns (string memory) {
        uint256 tlen = uint8(data[14]);
        uint256 looks = (uint256(uint8(data[12])) << 8) | uint8(data[13]);
        bytes memory json = abi.encodePacked(
            '{"name":"K1N0 #', _u(id),
            '","description":"', _description(id, data[15:15 + tlen], looks),
            '","image":"data:image/svg+xml;base64,', _b64(art.render(data)),
            '","animation_url":"data:text/html;base64,', _b64(viewer.html(data)),
            '","external_url":"', site, '/lab/token?id=', _u(id),
            '","attributes":', _traits(data, looks), "}"
        );
        return string(abi.encodePacked("data:application/json;base64,", _b64(json)));
    }

    function _description(uint256 id, bytes calldata title, uint256 looks) private pure returns (bytes memory) {
        return abi.encodePacked(
            title.length == 0 ? bytes("") : abi.encodePacked(unicode"“", title, unicode"” · "),
            id == 0 ? bytes("K1N0 #0, the K4NCUN0 logo, minted by the artist with the collection. ") : abi.encodePacked("K1N0 #", _u(id), " of 8,362 from THE K.LAB by K4NCUN0. "),
            "Its four colours are its own and never change: no other K1N0 can be minted with them.\\n\\nThe look is alive. Whoever holds it can give each colour an effect and turn the 3D view, for the gas only; the image and the 3D piece show the latest look, and every look stays on-chain with who set it",
            looks > 1 ? abi.encodePacked(" (this K1N0 has had ", _u(looks), " looks)") : bytes(""),
            ".\\n\\nFully on-chain on Ethereum: the image, the 3D piece and its story. Drag it to turn it."
        );
    }

    function contractURI(string calldata site) external view returns (string memory) {
        // the collection image: the logo, as K1N0 #0 is drawn
        bytes memory logo = abi.encodePacked(hex"00030202" hex"0000000001004a64" hex"0001" hex"07", "K4NCUN0");
        bytes memory json = abi.encodePacked(
            '{"name":"THE K.LAB","description":"K1N0 by K4NCUN0. One symbol, infinite variations.\\n\\nThe Kancuno K in clay-like 3D: the X and four blocks of the head always black, and four colours of its own for the background, the centre and the two front blocks. 16 colours in the palette; every combination can be minted only once, and its minter also picks its number. 8,362 K1N0, open to everyone: design yours, mint it, keep changing its look.\\n\\nThe colours never change; the look is alive: holders give each colour an effect and set the 3D view, for the gas only. The image and the 3D piece always show the latest look, and every look is kept on-chain with who set it. When a K1N0 changes hands, its story goes on.\\n\\nFully on-chain on Ethereum: image, interactive 3D piece and metadata, no IPFS, no server.","image":"data:image/svg+xml;base64,',
            _b64(art.render(logo)),
            '","external_link":"', site, '/lab"}'
        );
        return string(abi.encodePacked("data:application/json;base64,", _b64(json)));
    }

    // ── Traits ────────────────────────────────────────────────────────────

    function _name(uint8 i) private pure returns (bytes memory) {
        string[16] memory n = ["Yellow", "Ink", "Pink", "Purple", "Cream", "Grey", "Cyan", "Blue", "Green", "Red", "Orange", "Brown", "Tan", "Magenta", "Navy", "Lime"];
        return bytes(n[i & 15]);
    }

    function _headFx(uint8 i) private pure returns (bytes memory) {
        string[9] memory n = ["None", "Glow", "Pulse", "Blink", "Float", "Shimmer", "Neon", "Metal", "Glitch"];
        return bytes(n[i <= 8 ? i : 0]);
    }

    function _bgFx(uint8 i) private pure returns (bytes memory) {
        string[9] memory n = ["Plain", "Glow", "Pulse", "Scanlines", "Grain", "Pixel rain", "Grid", "Stripes", "Dots"];
        return bytes(n[i <= 8 ? i : 0]);
    }

    function _t(bytes memory name, bytes memory value) private pure returns (bytes memory) {
        return abi.encodePacked('{"trait_type":"', name, '","value":"', value, '"},');
    }

    function _traits(bytes calldata d, uint256 looks) private pure returns (bytes memory t) {
        t = abi.encodePacked(
            "[",
            _t("Background", _name(uint8(d[0]))),
            _t("Centre", _name(uint8(d[1]))),
            _t("Front left", _name(uint8(d[2]))),
            _t("Front right", _name(uint8(d[3])))
        );
        t = abi.encodePacked(
            t,
            _t("Background effect", _bgFx(uint8(d[4]))),
            _t("Centre effect", _headFx(uint8(d[5]))),
            _t("Front left effect", _headFx(uint8(d[6]))),
            _t("Front right effect", _headFx(uint8(d[7]))),
            _t("Speed", bytes(["Slow", "Calm", "Lively", "Fast"][uint8(d[8]) & 3]))
        );
        // distinct colours of the four (the black of the K aside)
        uint256 seen;
        uint256 n;
        for (uint256 i = 0; i < 4; i++) {
            uint256 bit = 1 << (uint8(d[i]) & 15);
            if (seen & bit == 0) { seen |= bit; n++; }
        }
        t = abi.encodePacked(t,
            '{"trait_type":"Colours","value":', _u(n), ',"display_type":"number"},',
            '{"trait_type":"Looks","value":', _u(looks), ',"display_type":"number"}]');
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    function _u(uint256 v) private pure returns (bytes memory s) {
        if (v == 0) return "0";
        uint256 len;
        for (uint256 x = v; x != 0; x /= 10) len++;
        s = new bytes(len);
        while (v != 0) {
            s[--len] = bytes1(uint8(48 + (v % 10)));
            v /= 10;
        }
    }

    function _b64(bytes memory data) private pure returns (bytes memory out) {
        uint256 len = data.length;
        if (len == 0) return "";
        out = new bytes(4 * ((len + 2) / 3));
        bytes memory table = B64;
        assembly ("memory-safe") {
            let tablePtr := add(table, 1)
            let resultPtr := add(out, 32)
            let dataPtr := data
            let endPtr := add(data, len)
            for {} lt(dataPtr, endPtr) {} {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1)
            }
            switch mod(len, 3)
            case 1 { mstore8(sub(resultPtr, 1), 0x3d) mstore8(sub(resultPtr, 2), 0x3d) }
            case 2 { mstore8(sub(resultPtr, 1), 0x3d) }
        }
    }
}
