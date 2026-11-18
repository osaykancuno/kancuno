// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {KLabFaces} from "./KLabFaces.sol";

/// @title THE K.LAB · the K1N0 image
/// @notice Draws a K1N0 as an SVG: the clay K in 3D (faces projected once, see KLabFaces), lit
/// like on kancuno.com, in its four colours on a black K, with the effects of its current look
/// animated in SMIL. Pure: same data, same image.
///
/// data = colours (4: background, centre, front left, front right; the X and the four other blocks
/// of the head are always black) · look (8: effects of background, centre, front left, front right
/// centre, front · speed · yaw · pitch · zoom) · looks count (2) · title length (1) · title
/// @notice Colours and numbers shared by the two halves of the drawing.
abstract contract KLabArtBase {
    bytes internal constant PAL = hex"fbc5000f0d0afc98ca9559bbfff6dc7a74683ff2ff2f6bff27e07aff3b30ff7a1a6b3e26d9b38cff4fd81d2a6bc8f04a";
    bytes16 internal constant HEXD = "0123456789abcdef";

    struct S {
        uint8[7] col; // palette index per group: 0 background, 1 X, 2 (unused), 3 black blocks, 4 centre, 5 front left, 6 front right
        uint8[7] fx; // effect per group (the coloured blocks only; the black K has none)
        uint8 bgFx;
        bytes dur; // loop period, e.g. "2.4s"
        uint256 filters; // which shared filters the drawing needs
    }

    function _rgb(uint8 i) internal pure returns (uint256 r, uint256 g, uint256 b) {
        uint256 o = uint256(i) * 3;
        return (uint8(PAL[o]), uint8(PAL[o + 1]), uint8(PAL[o + 2]));
    }

    function _hex(uint256 r, uint256 g, uint256 b) internal pure returns (bytes memory s) {
        s = new bytes(7);
        s[0] = "#";
        uint256[3] memory c = [r > 255 ? 255 : r, g > 255 ? 255 : g, b > 255 ? 255 : b];
        for (uint256 i = 0; i < 3; i++) {
            s[1 + i * 2] = HEXD[c[i] >> 4];
            s[2 + i * 2] = HEXD[c[i] & 15];
        }
    }

    // A palette colour lit like the clay: shade 0-255 plus a little light from the room
    function _lit(uint8 i, uint256 shade) internal pure returns (bytes memory) {
        (uint256 r, uint256 g, uint256 b) = _rgb(i);
        return _hex(_l(r, shade), _l(g, shade), _l(b, shade));
    }

    function _l(uint256 v, uint256 s) internal pure returns (uint256) {
        return (v * s + ((255 - v) * s) / 10) / 255;
    }

    // the exact palette colour (the background, the pixel rain)
    function _exact(uint8 i) internal pure returns (bytes memory) {
        (uint256 r, uint256 g, uint256 b) = _rgb(i);
        return _hex(r, g, b);
    }

    function _mix(uint8 i, uint256 white) internal pure returns (bytes memory) {
        (uint256 r, uint256 g, uint256 b) = _rgb(i);
        return _hex(r + ((255 - r) * white) / 100, g + ((255 - g) * white) / 100, b + ((255 - b) * white) / 100);
    }

    function _dark(uint8 i) internal pure returns (bool) {
        (uint256 r, uint256 g, uint256 b) = _rgb(i);
        return (r * 2126 + g * 7152 + b * 722) / 10000 < 110;
    }

    function _u(uint256 v) internal pure returns (bytes memory s) {
        if (v == 0) return "0";
        uint256 n;
        for (uint256 t = v; t != 0; t /= 10) n++;
        s = new bytes(n);
        while (v != 0) {
            s[--n] = bytes1(uint8(48 + (v % 10)));
            v /= 10;
        }
    }

}

/// @notice The background of a K1N0 image and its effect (plain, glow, pulse, scanlines, grain,
/// pixel rain, grid, stripes, dots). Split from KLabArt3D so each contract stays small.
contract KLabArtBg is KLabArtBase {
    /// data: the first 9 bytes of the K1N0 data (colours, then the look up to its speed)
    function background(bytes calldata data) external pure returns (bytes memory) {
        S memory s;
        s.col = [uint8(data[0]), 1, 1, 1, uint8(data[1]), uint8(data[2]), uint8(data[3])];
        s.bgFx = uint8(data[4]);
        s.dur = [bytes("4.8s"), "3.2s", "2.4s", "1.6s"][uint8(data[8]) & 3];
        return _background(s);
    }

    function _background(S memory s) private pure returns (bytes memory o) {
        uint8 bg = s.col[0];
        uint8 fx = s.bgFx;
        bytes memory ink = _dark(bg) ? bytes("#ffffff") : bytes("#000000"); // patterns contrast with it
        if (fx == 1) {
            o = abi.encodePacked('<radialGradient id="kb" cx="50%" cy="46%" r="62%"><stop offset="0" stop-color="', _mix(bg, 42), '"/><stop offset="1" stop-color="', _exact(bg), '"/></radialGradient><rect width="100" height="100" fill="url(#kb)"/>');
        } else {
            o = abi.encodePacked('<rect width="100" height="100" fill="', _exact(bg), '"/>');
        }
        if (fx == 2) {
            o = abi.encodePacked(o, '<rect width="100" height="100" fill="#ffffff" opacity="0"><animate attributeName="opacity" values="0;0.2;0" dur="', s.dur, '" repeatCount="indefinite"/></rect>');
        } else if (fx == 3) {
            o = abi.encodePacked(o, '<pattern id="kl" patternUnits="userSpaceOnUse" width="2" height="1.6"><rect width="2" height="0.55" fill="', ink, '"/></pattern><rect width="100" height="100" fill="url(#kl)" opacity="0.2"/>');
        } else if (fx == 4) {
            o = abi.encodePacked(o, '<filter id="kn" x="0" y="0" width="100" height="100" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100" height="100" filter="url(#kn)" opacity="0.32" style="mix-blend-mode:overlay"/>');
        } else if (fx == 5) {
            o = abi.encodePacked(o, _rain(s, ink));
        } else if (fx >= 6) {
            bytes memory tile = fx == 6
                ? abi.encodePacked('<path d="M0 0H6M0 0V6" stroke="', ink, '" stroke-width="0.35"/>')
                : fx == 7
                    ? abi.encodePacked('<rect width="2.2" height="6" fill="', ink, '"/>')
                    : abi.encodePacked('<circle cx="3" cy="3" r="0.9" fill="', ink, '"/>');
            o = abi.encodePacked(o, '<pattern id="kp" patternUnits="userSpaceOnUse" width="6" height="6"', fx == 7 ? bytes(' patternTransform="rotate(45)"') : bytes(""), ">", tile, '</pattern><rect width="100" height="100" fill="url(#kp)" opacity="', fx == 6 ? bytes("0.22") : bytes("0.14"), '"/>');
        }
    }

    // Pixel rain behind the K, in the colours of the head
    function _rain(S memory s, bytes memory ink) private pure returns (bytes memory g) {
        uint8[3] memory tones = [s.col[4], s.col[5], s.col[6]];
        for (uint256 i = 0; i < 18; i++) {
            uint256 h = uint256(keccak256(abi.encodePacked(i, s.col[0], s.col[2], s.col[4], s.col[5])));
            uint256 x = (h % 24) * 4 + 2;
            uint256 y0 = (h >> 8) % 110;
            bytes memory yy = _u(y0);
            g = abi.encodePacked(g, '<rect x="', _u(x), '" y="', yy, '" width="2.4" height="2.4" fill="', i % 4 == 3 ? ink : _exact(tones[i % 3]), '" opacity="0.55"><animate attributeName="y" values="-6;104" dur="', s.dur,
                '" begin="-', _u((h >> 16) % 48), '00ms" repeatCount="indefinite"/></rect>');
        }
    }

}

contract KLabArt3D is KLabArtBase {
    KLabArtBg public immutable bg;

    constructor(KLabArtBg bg_) {
        bg = bg_;
    }

    function render(bytes calldata data) external view returns (bytes memory) {
        S memory s;
        s.col = [uint8(data[0]), 1, 1, 1, uint8(data[1]), uint8(data[2]), uint8(data[3])];
        s.fx = [0, 0, 0, 0, uint8(data[5]), uint8(data[6]), uint8(data[7])];
        s.bgFx = uint8(data[4]);
        s.dur = [bytes("4.8s"), "3.2s", "2.4s", "1.6s"][uint8(data[8]) & 3];
        uint256 tlen = uint8(data[14]);

        bytes memory body = abi.encodePacked(bg.background(data[:9]), _shadow(s));
        for (uint256 g = 1; g <= 6; g++) if (g != 2) body = abi.encodePacked(body, _group(s, g));
        return abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="1024" height="1024"><title>',
            tlen == 0 ? bytes("K1N0") : bytes(data[15:15 + tlen]), unicode" · THE K.LAB</title><defs>",
            _filters(s), "</defs>", body, "</svg>"
        );
    }

    // ── Colours ───────────────────────────────────────────────────────────

    // ── Background ────────────────────────────────────────────────────────

    // ── The K ─────────────────────────────────────────────────────────────

    function _shadow(S memory s) private pure returns (bytes memory g) {
        (uint256 r, uint256 gg, uint256 b) = _rgb(s.col[0]);
        g = abi.encodePacked('<g fill="', _hex((r * 35) / 100, (gg * 35) / 100, (b * 35) / 100), '" opacity="0.5">');
        bytes memory F = KLabFaces.FACES;
        for (uint256 p = 0; p < F.length; ) {
            uint256 len = uint8(F[p + 2]);
            if (uint8(F[p]) == 0) g = abi.encodePacked(g, '<path d="', _slice(F, p + 3, len), '"/>');
            p += 3 + len;
        }
        g = abi.encodePacked(g, "</g>");
    }

    function _group(S memory s, uint256 grp) private pure returns (bytes memory g) {
        uint8 c = s.col[grp];
        uint8 fx = s.fx[grp];
        bytes memory F = KLabFaces.FACES;
        for (uint256 p = 0; p < F.length; ) {
            uint256 len = uint8(F[p + 2]);
            if (uint8(F[p]) == grp) g = abi.encodePacked(g, _face(c, fx, uint8(F[p + 1]), _slice(F, p + 3, len)));
            p += 3 + len;
        }
        return abi.encodePacked("<g", _groupAttrs(s, fx), ">", _groupAnim(s, fx, grp), g, "</g>");
    }

    function _face(uint8 c, uint8 fx, uint256 shade, bytes memory d) private pure returns (bytes memory) {
        // every effect keeps the exact palette colour of the block: effects add light and motion only
        bytes memory col = _lit(c, shade);
        if (fx == 6) {
            // neon: the light runs along the edges (and glows, filter kg)
            return abi.encodePacked('<path d="', d, '" fill="', col, '" stroke="', _mix(c, 35), '" stroke-width="0.7" stroke-linejoin="round"/>');
        }
        if (fx == 7) {
            // metal: a bright edge (and a glint that crosses it, filter km)
            return abi.encodePacked('<path d="', d, '" fill="', col, '" stroke="', _mix(c, 60), '" stroke-width="0.3" stroke-linejoin="round"/>');
        }
        return abi.encodePacked('<path d="', d, '" fill="', col, '" stroke="', col, '" stroke-width="0.35" stroke-linejoin="round"/>');
    }

    function _groupAttrs(S memory s, uint8 fx) private pure returns (bytes memory) {
        if (fx == 1 || fx == 6) { s.filters |= 1; return ' filter="url(#kg)"'; }
        if (fx == 2) { s.filters |= 2; return ' filter="url(#kq)"'; }
        if (fx == 5) { s.filters |= 4; return ' filter="url(#ks)"'; }
        if (fx == 8) { s.filters |= 8; return ' filter="url(#kx)"'; }
        if (fx == 7) { s.filters |= 16; return ' filter="url(#km)"'; }
        return "";
    }

    function _groupAnim(S memory s, uint8 fx, uint256 grp) private pure returns (bytes memory) {
        bytes memory t = abi.encodePacked(' dur="', s.dur, '" repeatCount="indefinite"');
        if (fx == 3) {
            return abi.encodePacked('<animate attributeName="opacity" values="1;1;0.12;1;1" keyTimes="0;0.44;0.5;0.56;1"', t, "/>");
        }
        if (fx == 4) {
            // float: the blocks of this colour rise and settle, each colour a little after the other
            return abi.encodePacked('<animateTransform attributeName="transform" type="translate" values="0 0;0 -2.6;0 0" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" begin="-', _u(grp * 3), '00ms"', t, "/>");
        }
        return "";
    }

    function _filters(S memory s) private pure returns (bytes memory f) {
        // the filters are only known after the groups are drawn: draw them first to set the flags
        for (uint256 g = 4; g <= 6; g++) _groupAttrs(s, s.fx[g]);
        bytes memory t = abi.encodePacked(' dur="', s.dur, '" repeatCount="indefinite"');
        if (s.filters & 1 != 0) {
            f = abi.encodePacked(f, '<filter id="kg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>');
        }
        if (s.filters & 2 != 0) {
            f = abi.encodePacked(f, '<filter id="kq" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.3" result="b"><animate attributeName="stdDeviation" values="0.3;2.6;0.3"', t, '/></feGaussianBlur><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>');
        }
        if (s.filters & 4 != 0) {
            bytes memory fn = abi.encodePacked('type="linear" slope="1"><animate attributeName="slope" values="1;1;1.75;1;1" keyTimes="0;0.35;0.5;0.65;1"', t, "/>");
            f = abi.encodePacked(f, '<filter id="ks"><feComponentTransfer><feFuncR ', fn, '</feFuncR><feFuncG ', fn, '</feFuncG><feFuncB ', fn, "</feFuncB></feComponentTransfer></filter>");
        }
        if (s.filters & 8 != 0) {
            f = abi.encodePacked(f, '<filter id="kx" x="-20%" y="-20%" width="140%" height="140%"><feOffset in="SourceGraphic" dx="0" result="o"><animate attributeName="dx" values="0;1.4;-1;0;0;0.8;0" calcMode="discrete"', t,
                '/></feOffset><feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.9 0" result="r"/><feOffset in="r" dx="-0.8" result="ro"/><feBlend in="o" in2="ro" mode="screen"/></filter>');
        }
        if (s.filters & 16 != 0) {
            // a white glint sweeping across: light added on top, the colour underneath unchanged
            f = abi.encodePacked(f, '<filter id="km" x="0" y="0" width="100" height="100" filterUnits="userSpaceOnUse"><feSpecularLighting in="SourceAlpha" surfaceScale="1" specularConstant="1.1" specularExponent="22" lighting-color="#ffffff" result="l"><fePointLight y="18" z="14" x="10"><animate attributeName="x" values="10;90;10"', t,
                '/></fePointLight></feSpecularLighting><feComposite in="l" in2="SourceAlpha" operator="in" result="m"/><feComposite in="SourceGraphic" in2="m" operator="arithmetic" k2="1" k3="0.55"/></filter>');
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    function _slice(bytes memory b, uint256 start, uint256 len) private pure returns (bytes memory out) {
        out = new bytes(len);
        for (uint256 i = 0; i < len; i++) out[i] = b[start + i];
    }

}
