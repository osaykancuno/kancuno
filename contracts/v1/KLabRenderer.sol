// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title THE K.LAB art + renderer
/// @notice Draws a K1N1 on-chain: the design bytes → an SVG (the flat K of THE K.LAB, animated with
/// SMIL when the design has loops) → ERC-721 metadata JSON. Mirrors src/lib/lab/render.ts.
///
/// Design bytes, version 1 (see src/lib/lab/onchain.ts, which writes them):
///   0 version (1)        1 form (0 vector, 1 pixel)      2 flags (bit0 bg, 1 body, 2 head visible,
///                                                          3 body line, 4 head line, 5 head uses one fill)
///   3..10 bg fill        11..18 body fill               19..26 head fill
///         fill = kind (0 solid, 1 gradient, 2 pattern), colour a (3), colour b (3), param
///         gradient param = angle / 2; pattern param = pattern << 5 | scale × 2
///   27..47 the 7 head colours (3 bytes each)
///   48..53 fx: glow, glitch, pixel, grain, scan, depth (0..255)
///   54..55 seed            56..57 loops (bit per loop: pulse bounce float wave blink spin rain glitch scan)
///   58 loop period (tenths of a second)   59..60 yaw (int16, tenths of degree)   61 pitch   62 zoom × 100
///   63 name length (≤ 32), then the name (letters, digits, space and - _ . ' ! #)
///   K1N1 is always the clay K: form 0 only (the pixel form of the Lab is not minted)
/// @notice Shared by the two halves of the drawing: the design in a struct and number formatting.
abstract contract KLabSvg {
    bytes16 internal constant HEXD = "0123456789abcdef";

    struct K {
        bytes d;
        uint256 flags;
        uint256 loops;
        bytes dur; // the loop period, e.g. "2.4s"
        bytes defs;
        uint256 seed;
    }

    function _k(bytes memory d) internal pure returns (K memory k) {
        k.d = d;
        k.flags = uint8(d[2]);
        k.loops = (uint256(uint8(d[56])) << 8) | uint8(d[57]);
        k.dur = abi.encodePacked(_n(int256(uint256(uint8(d[58]))) * 10), "s");
        k.seed = (uint256(uint8(d[54])) << 8) | uint8(d[55]);
    }

    function _has(K memory k, uint256 bit) internal pure returns (bool) {
        return (k.loops & (1 << bit)) != 0;
    }
    function _anim(K memory k) internal pure returns (bytes memory) {
        return abi.encodePacked(' dur="', k.dur, '" repeatCount="indefinite"');
    }
    function _col(bytes memory d, uint256 o) internal pure returns (bytes memory s) {
        s = new bytes(7);
        s[0] = "#";
        for (uint256 i = 0; i < 3; i++) {
            uint8 v = uint8(d[o + i]);
            s[1 + i * 2] = HEXD[v >> 4];
            s[2 + i * 2] = HEXD[v & 15];
        }
    }
    // deterministic 0..9999 from the seed (glitch slices, rain)
    function _r(uint256 seed, uint256 i, uint256 salt) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(seed, i, salt))) % 10000;
    }
    function _u(uint256 v) internal pure returns (bytes memory s) {
        if (v == 0) return "0";
        uint256 len;
        for (uint256 t = v; t != 0; t /= 10) len++;
        s = new bytes(len);
        while (v != 0) {
            s[--len] = bytes1(uint8(48 + (v % 10)));
            v /= 10;
        }
    }
    // a number in hundredths → "12.34", "-0.5", "7"
    function _n(int256 v) internal pure returns (bytes memory) {
        bool neg = v < 0;
        uint256 a = uint256(neg ? -v : v);
        bytes memory s = _u(a / 100);
        uint256 f = a % 100;
        if (f != 0) {
            s = f % 10 == 0
                ? abi.encodePacked(s, ".", bytes1(uint8(48 + f / 10)))
                : abi.encodePacked(s, ".", bytes1(uint8(48 + f / 10)), bytes1(uint8(48 + (f % 10))));
        }
        return neg && a != 0 ? abi.encodePacked("-", s) : s;
    }
}

/// @notice Fills of a K1N1: solid colours, gradients and patterns (as SVG paint + defs).
contract KLabArtFill is KLabSvg {
    bytes private constant SIN = hex"0000015d02ba0415057006c8081f09730ac40c120d5c0ea20fe311201257138814b315d816f6180d191c1a231b231c191d071dec1ec81f9a2062212021d4227d231c23af243824b52527258d25e72635267826af26d926f8270a2710";

    /// The fill at byte `o` of the design, for a part whose box is `box` (canvas units × 100)
    function paint(bytes calldata data, uint256 o, bytes calldata id, int256[4] calldata box) external pure returns (bytes memory p, bytes memory defs) {
        K memory k = _k(data);
        p = _paint(k, o, id, box);
        defs = k.defs;
    }

    // Head squares of the flat K (canvas units × 100), back row first
    // A fill at `o` in the design → an SVG paint (colour or url(#id)); gradients and patterns go to defs
    function _paint(K memory k, uint256 o, bytes memory id, int256[4] memory box) internal pure returns (bytes memory) {
        bytes memory d = k.d;
        uint256 kind = uint8(d[o]);
        bytes memory a = _col(d, o + 1);
        if (kind == 0) return a;
        bytes memory b = _col(d, o + 4);
        uint256 param = uint8(d[o + 7]);
        if (kind == 1) {
            uint256 ang = param * 2;
            int256 c = _sin(ang + 90);
            int256 s = _sin(ang);
            int256 cx = box[0] + box[2] / 2;
            int256 cy = box[1] + box[3] / 2;
            int256 half = (_abs(c) * box[2] + _abs(s) * box[3]) / 20000;
            int256 dx = (c * half) / 10000;
            int256 dy = (s * half) / 10000;
            k.defs = abi.encodePacked(k.defs,
                '<linearGradient id="', id, '" gradientUnits="userSpaceOnUse" x1="', _n(cx - dx), '" y1="', _n(cy - dy), '" x2="', _n(cx + dx), '" y2="', _n(cy + dy),
                '"><stop offset="0" stop-color="', a, '"/><stop offset="1" stop-color="', b, '"/></linearGradient>');
        } else {
            k.defs = abi.encodePacked(k.defs, _pattern(id, param, a, b, box));
        }
        return abi.encodePacked("url(#", id, ")");
    }

    function _pattern(bytes memory id, uint256 param, bytes memory a, bytes memory b, int256[4] memory box) private pure returns (bytes memory) {
        uint256 pat = param >> 5;
        int256 s = int256(param & 31) * 50; // the scale, in hundredths
        bytes memory S = _n(s);
        bytes memory base = abi.encodePacked('<rect width="', S, '" height="', S, '" fill="', a, '"/>');
        bytes memory body;
        int256 w = s;
        bytes memory tf;
        if (pat == 0) {
            body = abi.encodePacked(base, '<rect width="', _n(s / 2), '" height="', S, '" fill="', b, '"/>');
            tf = ' patternTransform="rotate(45)"';
        } else if (pat == 1) {
            body = abi.encodePacked(base, '<circle cx="', _n(s / 2), '" cy="', _n(s / 2), '" r="', _n((s * 22) / 100), '" fill="', b, '"/>');
        } else if (pat == 2) {
            w = s * 2;
            bytes memory W = _n(w);
            body = abi.encodePacked('<rect width="', W, '" height="', W, '" fill="', a, '"/><rect width="', S, '" height="', S, '" fill="', b, '"/><rect x="', S, '" y="', S, '" width="', S, '" height="', S, '" fill="', b, '"/>');
        } else if (pat == 3) {
            body = abi.encodePacked(base, '<rect width="', S, '" height="', _n((s * 35) / 100), '" fill="', b, '"/>');
        } else {
            int256 sw = (s * 8) / 100;
            body = abi.encodePacked(base, '<path d="M0 0H', S, 'M0 0V', S, '" stroke="', b, '" stroke-width="', _n(sw < 20 ? int256(20) : sw), '"/>');
        }
        return abi.encodePacked('<pattern id="', id, '" patternUnits="userSpaceOnUse" x="', _n(box[0]), '" y="', _n(box[1]), '" width="', _n(w), '" height="', _n(w), '"', tf, ">", body, "</pattern>");
    }

    // sin × 10000 for a whole even angle in degrees
    function _sin(uint256 a) private pure returns (int256) {
        a %= 360;
        if (a <= 90) return _t(a);
        if (a <= 180) return _t(180 - a);
        if (a <= 270) return -_t(a - 180);
        return -_t(360 - a);
    }

    function _t(uint256 a) private pure returns (int256) {
        uint256 i = (a / 2) * 2;
        return int256((uint256(uint8(SIN[i])) << 8) | uint8(SIN[i + 1]));
    }

    function _abs(int256 v) private pure returns (int256) {
        return v < 0 ? -v : v;
    }
}

/// @notice The loops of a K1N1 drawing as SMIL: bounce, float and sway on the figure, the pixel
/// rain behind it, the scan band, scanlines and grain above it.
contract KLabArtMotion is KLabSvg {
    function loops(bytes calldata data) external pure returns (bytes memory open, bytes memory close, bytes memory rain, bytes memory overlays, bytes memory defs) {
        K memory k = _k(data);
        open = _motionOpen(k);
        close = _motionClose(k);
        if (_has(k, 6)) rain = _rain(k);
        overlays = _overlays(k);
        defs = k.defs;
    }

    // Bounce, float and sway as SMIL transforms on nested groups (they add up)
    function _motionOpen(K memory k) private pure returns (bytes memory m) {
        bytes memory spline = ' calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1"';
        if (_has(k, 1)) {
            m = abi.encodePacked(m, '<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -7;0 0" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.3 0.6 0.5 1;0.5 0 0.7 0.4"', _anim(k), "/>");
        }
        if (_has(k, 2)) {
            m = abi.encodePacked(m,
                '<g><animateTransform attributeName="transform" type="translate" values="0 0;0 2.5;0 0;0 -2.5;0 0" keyTimes="0;0.25;0.5;0.75;1"', spline, _anim(k), "/>",
                '<g><animateTransform attributeName="transform" type="rotate" values="2 50 50;0 50 50;-2 50 50;0 50 50;2 50 50" keyTimes="0;0.25;0.5;0.75;1"', spline, _anim(k), "/>");
        }
        if (_has(k, 5)) {
            m = abi.encodePacked(m, '<g><animateTransform attributeName="transform" type="rotate" values="0 50 50;8 50 50;0 50 50;-8 50 50;0 50 50" keyTimes="0;0.25;0.5;0.75;1"', spline, _anim(k), "/>");
        }
    }

    function _motionClose(K memory k) private pure returns (bytes memory m) {
        uint256 n = (_has(k, 1) ? 1 : 0) + (_has(k, 2) ? 2 : 0) + (_has(k, 5) ? 1 : 0);
        for (uint256 i = 0; i < n; i++) m = abi.encodePacked(m, "</g>");
    }

    function _rain(K memory k) private pure returns (bytes memory g) {
        bytes memory d = k.d;
        bytes[3] memory tones = [_col(d, 27 + 9), _col(d, 27 + 15), uint8(d[1]) == 1 ? bytes("#fbc500") : _col(d, 27)];
        uint256 period = uint256(uint8(d[58])) * 10; // hundredths of a second
        for (uint256 i = 0; i < 22; i++) {
            uint256 x = (_r(k.seed, i, 4) * 25 / 10000) * 4;
            uint256 sz = 2 + (_r(k.seed, i, 5) * 3) / 10000;
            uint256 speed = 1 + (_r(k.seed, i, 6) * 2) / 10000;
            int256 y0 = int256(_r(k.seed, i, 7) * 12000 / 10000) - 1000;
            int256 kt = ((11000 - y0) * 100) / 12000; // when it reaches the floor, in hundredths of the cycle
            bytes memory yy = _n(y0);
            g = abi.encodePacked(g,
                '<rect x="', _u(x), '" y="', yy, '" width="', _u(sz), '" height="', _u(sz), '" fill="', tones[i % 3], '" opacity="', _n(int256(35 + _r(k.seed, i, 8) * 50 / 10000)),
                '"><animate attributeName="y" values="', yy, ";110;-10;", yy, '" keyTimes="0;', _n(kt), ";", _n(kt), ';1" dur="', _n(int256(period / speed)), 's" repeatCount="indefinite"/></rect>');
        }
        g = abi.encodePacked("<g>", g, "</g>");
    }

    function _overlays(K memory k) private pure returns (bytes memory o) {
        bytes memory d = k.d;
        if (_has(k, 8)) {
            o = abi.encodePacked(
                '<rect x="0" y="-6" width="100" height="5" fill="#ffffff" opacity="0.07"><animate attributeName="y" values="-6;106"', _anim(k), '/></rect>',
                '<rect x="0" y="-2" width="100" height="0.5" fill="#ffffff" opacity="0.22"><animate attributeName="y" values="-2;110"', _anim(k), '/></rect>'
            );
        }
        uint256 scan = uint8(d[52]);
        if (scan != 0) {
            k.defs = abi.encodePacked(k.defs, '<pattern id="k-sl" patternUnits="userSpaceOnUse" width="2" height="1.6"><rect width="2" height="0.55" fill="#000000"/></pattern>');
            o = abi.encodePacked(o, '<rect width="100" height="100" fill="url(#k-sl)" opacity="', _n(int256((scan * 40) / 255)), '"/>');
        }
        uint256 grain = uint8(d[51]);
        if (grain != 0) {
            k.defs = abi.encodePacked(k.defs, '<filter id="k-gr" filterUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="', _u(k.seed % 1000), '"/><feColorMatrix type="saturate" values="0"/></filter>');
            o = abi.encodePacked(o, '<rect width="100" height="100" filter="url(#k-gr)" opacity="', _n(int256((grain * 45) / 255)), '" style="mix-blend-mode:overlay"/>');
        }
    }
}

/// @notice The effects of a K1N1 drawing on the figure: glow (pulsing with the pulse loop),
/// pixelate, the depth shadow and the glitch split and slices.
contract KLabArtFx is KLabSvg {
    struct Pieces {
        bytes defs; // filters and clips
        bytes filter; // the attribute that puts the glow/pixel filter on the figure
        bytes shadow; // the depth shadow layer
        bytes split; // the glitch RGB split attribute
        bytes slices; // glitch slices
    }

    function pieces(bytes calldata data) external pure returns (Pieces memory p) {
        K memory k = _k(data);
        bytes memory d = k.d;
        p.filter = _fxFilter(k);
        uint256 depth = uint8(d[53]);
        if (depth != 0) {
            k.defs = abi.encodePacked(k.defs, '<filter id="k-sh" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ', _n(int256(25 + (depth * 30) / 255)), ' 0"/></filter>');
            p.shadow = abi.encodePacked('<use href="#k-fig" transform="translate(', _n(int256((depth * 200) / 255)), " ", _n(int256((depth * 280) / 255)), ')" filter="url(#k-sh)"/>');
        }
        uint256 glitch = uint8(d[49]);
        if (glitch > 2) {
            bytes memory kk = _n(int256((glitch * 220) / 255));
            k.defs = abi.encodePacked(k.defs,
                '<filter id="k-sp" filterUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120" color-interpolation-filters="sRGB"><feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="kr"/><feOffset in="kr" dx="-', kk,
                '" result="kro"/><feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0" result="kc"/><feOffset in="kc" dx="', kk,
                '" result="kco"/><feBlend in="kro" in2="kco" mode="screen"/></filter>');
            p.split = ' filter="url(#k-sp)"';
            p.slices = _slices(k, glitch);
        }
        p.defs = k.defs;
    }

    function _slices(K memory k, uint256 glitch) private pure returns (bytes memory s) {
        for (uint256 i = 0; i < 4; i++) {
            int256 y = 2000 + int256(_r(k.seed, i, 1) * 6000 / 10000);
            int256 h = 150 + int256(_r(k.seed, i, 2) * 500 / 10000);
            int256 dx = ((int256(_r(k.seed, i, 3)) - 5000) * 1400 * int256(glitch)) / 255 / 10000;
            k.defs = abi.encodePacked(k.defs, '<clipPath id="k-c', _u(i), '"><rect x="0" y="', _n(y), '" width="100" height="', _n(h), '"/></clipPath>');
            s = abi.encodePacked(s, '<g clip-path="url(#k-c', _u(i), ')"><use href="#k-fig" transform="translate(', _n(dx), ' 0)"/></g>');
        }
    }

    // Glow (pulsing with the pulse loop) and pixelate, as one filter on the figure
    function _fxFilter(K memory k) private pure returns (bytes memory) {
        bytes memory d = k.d;
        uint256 pix = uint8(d[50]);
        uint256 glow = uint8(d[48]);
        bool pulse = _has(k, 0);
        if (pix == 0 && glow == 0 && !pulse) return "";
        bytes memory prims;
        bytes memory src = "SourceGraphic";
        if (pix != 0) {
            int256 B = 140 + int256((pix * 460) / 255);
            int256 f = (B * 3) / 10;
            prims = abi.encodePacked(
                '<feFlood x="', _n((B - f) / 2), '" y="', _n((B - f) / 2), '" width="', _n(f), '" height="', _n(f),
                '"/><feComposite width="', _n(B), '" height="', _n(B), '"/><feTile result="kt"/><feComposite in="SourceGraphic" in2="kt" operator="in"/><feMorphology operator="dilate" radius="', _n((B - f) / 2), '" result="kp"/>'
            );
            src = "kp";
        }
        if (glow != 0 || pulse) {
            uint256 g = glow != 0 ? glow : 153; // 0.6, as in the Lab
            prims = abi.encodePacked(prims,
                '<feGaussianBlur in="', src, '" stdDeviation="', _n(int256(40 + (g * 140) / 255)), '" result="kb1">', pulse ? _pulse(k, g, 140, 40) : bytes(""), "</feGaussianBlur>",
                '<feGaussianBlur in="', src, '" stdDeviation="', _n(int256(100 + (g * 450) / 255)), '" result="kb2">', pulse ? _pulse(k, g, 450, 100) : bytes(""), "</feGaussianBlur>",
                '<feMerge><feMergeNode in="kb2"/><feMergeNode in="kb1"/><feMergeNode in="', src, '"/></feMerge>');
        }
        k.defs = abi.encodePacked(k.defs, '<filter id="k-fx" filterUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120" color-interpolation-filters="sRGB">', prims, "</filter>");
        return ' filter="url(#k-fx)"';
    }

    // Pulse: the glow breathes between 30% and 100% of its strength
    function _pulse(K memory k, uint256 g, uint256 mul, uint256 base) private pure returns (bytes memory) {
        bytes memory lo = _n(int256(base + (g * mul * 3) / 2550));
        bytes memory hi = _n(int256(base + (g * mul) / 255));
        return abi.encodePacked('<animate attributeName="stdDeviation" values="', lo, ";", hi, ";", lo, '" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"', _anim(k), "/>");
    }
}

/// @notice The drawing of a K1N1: the clay K (its X and its 2-3-2 head) with its fills, effects and
/// loops from the other KLabArt* contracts, as one SVG. Mirrors src/lib/lab/render.ts.
/// (The drawing is split in four so every contract stays small enough for any Ethereum fork.)
contract KLabArt is KLabSvg {
    KLabArtFill public immutable fill;
    KLabArtFx public immutable fx;
    KLabArtMotion public immutable motion;

    constructor(KLabArtFill fill_, KLabArtFx fx_, KLabArtMotion motion_) {
        fill = fill_;
        fx = fx_;
        motion = motion_;
    }

    function _paint(K memory k, uint256 o, bytes memory id, int256[4] memory box) private view returns (bytes memory p) {
        bytes memory defs;
        (p, defs) = fill.paint(k.d, o, id, box);
        if (defs.length != 0) k.defs = abi.encodePacked(k.defs, defs);
    }

    function render(bytes memory d) public view returns (bytes memory) {
        K memory k = _k(d);
        KLabArtFx.Pieces memory p = fx.pieces(d);
        (bytes memory open, bytes memory close, bytes memory rain, bytes memory overlays, bytes memory mdefs) = motion.loops(d);
        bytes memory bg;
        if ((k.flags & 1) != 0) {
            bg = abi.encodePacked('<rect width="100" height="100" fill="', _paint(k, 3, "k-bg", [int256(0), 0, 10000, 10000]), '"/>');
        }
        bytes memory fig = _vector(k);
        bytes memory body = abi.encodePacked(
            bg, rain,
            "<g", p.filter, ">", open, p.shadow, "<g", p.split, '><g id="k-fig">', fig, "</g></g>", p.slices, close, "</g>",
            overlays
        );
        bytes memory defs = abi.encodePacked(k.defs, p.defs, mdefs);
        uint256 len = uint8(d[63]);
        bytes memory nm = new bytes(len);
        for (uint256 i = 0; i < len; i++) nm[i] = d[64 + i];
        return abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="1024" height="1024"><title>',
            len == 0 ? bytes("K1N1") : nm, unicode" · THE K.LAB</title>",
            defs.length == 0 ? bytes("") : abi.encodePacked("<defs>", defs, "</defs>"),
            body, "</svg>"
        );
    }

    // Head squares of the flat K (canvas units × 100), back row first
    // Head squares of the flat K (canvas units × 100), back row first
    function _hx(uint256 i) private pure returns (int256) {
        return [int256(3850), 5050, 3250, 4450, 5650, 3850, 5050][i];
    }

    function _hy(uint256 i) private pure returns (int256) {
        return [int256(2300), 2300, 3300, 3300, 3300, 4300, 4300][i];
    }

    function _vector(K memory k) private view returns (bytes memory fig) {
        uint256 flags = k.flags;
        if ((flags & 2) != 0) {
            bytes memory p = _paint(k, 11, "k-bd", [int256(3050), 2300, 3900, 5400]);
            bool line = (flags & 8) != 0;
            bytes memory attrs = line ? abi.encodePacked('fill="none" stroke="', p, '" stroke-width="1.4"') : abi.encodePacked('fill="', p, '"');
            fig = abi.encodePacked("<g>", _capsule(36, attrs, line), _capsule(-36, attrs, line), "</g>");
        }
        if ((flags & 4) != 0) {
            bool line = (flags & 16) != 0;
            bytes memory shared = (flags & 32) != 0 ? _paint(k, 19, "k-hd", [int256(3250), 2300, 3500, 3000]) : bytes("");
            bytes memory head;
            for (uint256 i = 0; i < 7; i++) head = abi.encodePacked(head, _square(k, i, line, shared));
            fig = abi.encodePacked(fig, "<g>", head, "</g>");
        }
    }

    function _capsule(int256 angle, bytes memory attrs, bool line) private pure returns (bytes memory) {
        int256 ins = line ? int256(70) : int256(0);
        int256 L = 4400 - ins * 2;
        int256 T = 775 - ins * 2;
        return abi.encodePacked(
            '<rect x="', _n(5000 - L / 2), '" y="', _n(6300 - T / 2), '" width="', _n(L), '" height="', _n(T), '" rx="', _n(T / 2),
            '" transform="rotate(', _n(angle * 100), ' 50 63)" ', attrs, "/>"
        );
    }

    function _square(K memory k, uint256 i, bool line, bytes memory shared) private view returns (bytes memory) {
        bytes memory p = shared.length != 0 ? shared : _col(k.d, 27 + i * 3);
        int256 ins = line ? int256(70) : int256(0);
        int256 x = _hx(i) + ins;
        int256 y = _hy(i) + ins;
        int256 w = 1100 - ins * 2;
        int256 h = 1000 - ins * 2;
        bytes memory attrs = line ? abi.encodePacked('fill="none" stroke="', p, '" stroke-width="1.4"') : abi.encodePacked('fill="', p, '"');
        bytes memory blink;
        if (_has(k, 4) && i >= 5) {
            // the front row blinks around the middle of the loop
            bytes memory hh = _n(h);
            bytes memory hl = _n(200 - ins * 2);
            bytes memory yy = _n(y);
            bytes memory yl = _n(y + 400);
            bytes memory kt = '" keyTimes="0;0.44;0.5;0.56;1"';
            blink = abi.encodePacked(
                '<animate attributeName="height" values="', hh, ";", hh, ";", hl, ";", hh, ";", hh, kt, _anim(k), "/>",
                '<animate attributeName="y" values="', yy, ";", yy, ";", yl, ";", yy, ";", yy, kt, _anim(k), "/>"
            );
        }
        bytes memory rect = abi.encodePacked('<rect x="', _n(x), '" y="', _n(y), '" width="', _n(w), '" height="', _n(h), '" ', attrs, blink.length == 0 ? bytes("/>") : abi.encodePacked(">", blink, "</rect>"));
        if (!_has(k, 3)) return rect;
        // head wave: each square rises and falls a seventh of a loop after the previous one
        uint256 period = uint8(k.d[58]); // tenths
        bytes memory begin = _n(-int256(((7 - i) * period * 10) / 7));
        return abi.encodePacked(
            '<g><animateTransform attributeName="transform" type="translate" values="0 0;0 1.4;0 0;0 -1.4;0 0" keyTimes="0;0.25;0.5;0.75;1" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1" begin="',
            begin, 's"', _anim(k), "/>", rect, "</g>"
        );
    }
}

interface IKLabViewer {
    function html(bytes calldata d) external pure returns (bytes memory);
}

/// @title THE K.LAB renderer
/// @notice Validates K1N1 designs and turns them into ERC-721 metadata, with the artwork drawn by KLabArt.
contract KLabRenderer {
    bytes private constant B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    KLabArt public immutable art;
    IKLabViewer public immutable viewer;

    constructor(KLabArt art_, IKLabViewer viewer_) {
        art = art_;
        viewer = viewer_;
    }

    function render(bytes calldata data) external view returns (string memory) {
        return string(art.render(data));
    }

    // ── Validation ────────────────────────────────────────────────────────

    function validate(bytes calldata d) external pure returns (bool) {
        if (d.length < 64 || uint8(d[0]) != 1) return false;
        uint256 form = uint8(d[1]);
        if (form != 0 || uint8(d[2]) > 63) return false;
        for (uint256 f = 0; f < 3; f++) {
            uint256 o = 3 + f * 8;
            uint256 kind = uint8(d[o]);
            if (kind > 2) return false;
            uint256 p = uint8(d[o + 7]);
            bool same = d[o + 1] == d[o + 4] && d[o + 2] == d[o + 5] && d[o + 3] == d[o + 6];
            // one way to write each look: a solid has no second colour, a gradient or pattern has two
            if (kind == 0 && (p != 0 || d[o + 4] != 0 || d[o + 5] != 0 || d[o + 6] != 0)) return false;
            if (kind != 0 && same) return false;
            if (kind == 1 && p >= 180) return false;
            if (kind == 2 && ((p >> 5) > 4 || (p & 31) < 2)) return false;
        }
        if (((uint256(uint8(d[56])) << 8) | uint8(d[57])) > 0x1ff) return false;
        uint256 period = uint8(d[58]);
        if (period < 6 || period > 80) return false;
        if (uint8(d[61]) > 90 || uint8(d[62]) < 30 || uint8(d[62]) > 250) return false;
        uint256 len = uint8(d[63]);
        if (len > 32 || d.length < 64 + len) return false;
        for (uint256 i = 64; i < 64 + len; i++) {
            if (!_nameChar(uint8(d[i]))) return false;
        }
        return form == 0 && d.length == 64 + len; // K1N1 is the clay K: vector form only
    }

    function _nameChar(uint256 c) private pure returns (bool) {
        return (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a)
            || c == 0x20 || c == 0x2d || c == 0x5f || c == 0x2e || c == 0x27 || c == 0x21 || c == 0x23;
    }

    // ── Metadata ──────────────────────────────────────────────────────────

    function tokenURI(uint256 id, bytes calldata data, string calldata site) external view returns (string memory) {
        bytes memory d = data;
        bytes memory svg = art.render(d);
        bytes memory json = abi.encodePacked(
            '{"name":"K1N1 #', _u(id),
            '","description":"A K1N1 from THE K.LAB by K4NCUN0. One symbol, infinite variations: designed in the Lab, minted by its creator. The design and this artwork live fully on-chain on Ethereum.","image":"data:image/svg+xml;base64,',
            _b64(svg),
            '","animation_url":"data:text/html;base64,', _b64(viewer.html(data)),
            '","external_url":"', site, '/lab/token?id=', _u(id),
            '","attributes":', _traits(d), '}'
        );
        return string(abi.encodePacked("data:application/json;base64,", _b64(json)));
    }

    function contractURI(string calldata site) external view returns (string memory) {
        bytes memory json = abi.encodePacked(
            '{"name":"THE K.LAB","description":"K1N1: the Kancuno K, designed by anyone in THE K.LAB and minted by its creator. Free open edition, design and artwork fully on-chain on Ethereum.","image":"data:image/svg+xml;base64,',
            _b64(art.render(defaultDesign())),
            '","external_link":"', site, '/lab"}'
        );
        return string(abi.encodePacked("data:application/json;base64,", _b64(json)));
    }

    /// The original K (yellow, ink, purple and pink), used as the collection image
    function defaultDesign() public pure returns (bytes memory) {
        return hex"01000700fbc50000000000000f0d0a00000000000f0d0a000000000f0d0a0f0d0a0f0d0a9559bb0f0d0afc98cafc98ca00000000000020aa00001800004a640a4f726967696e616c204b";
    }

    function _traits(bytes memory d) private pure returns (bytes memory t) {
        uint256 flags = uint8(d[2]);
        uint256 len = uint8(d[63]);
        bytes memory nm = new bytes(len);
        for (uint256 i = 0; i < len; i++) nm[i] = d[64 + i];
        t = abi.encodePacked(
            '[{"trait_type":"Form","value":"Clay K',
            '"},{"trait_type":"Title","value":"', len == 0 ? bytes("Untitled") : nm,
            '"},{"trait_type":"Background","value":"', (flags & 1) == 0 ? bytes("None") : _kindName(uint8(d[3])),
            '"},{"trait_type":"Style","value":"', (flags & 24) != 0 ? bytes("Neon line") : bytes("Solid"), '"}'
        );
        string[6] memory fx = ["Glow", "Glitch", "Pixelate", "Grain", "Scanlines", "Depth"];
        for (uint256 i = 0; i < 6; i++) {
            if (uint8(d[48 + i]) != 0) t = abi.encodePacked(t, ',{"trait_type":"Effect","value":"', fx[i], '"}');
        }
        string[9] memory lp = ["Pulse", "Bounce", "Float", "Head wave", "Blink", "Sway", "Pixel rain", "Glitch", "Scan line"];
        uint256 loops = (uint256(uint8(d[56])) << 8) | uint8(d[57]);
        uint256 count;
        for (uint256 i = 0; i < 9; i++) {
            if (loops & (1 << i) != 0) {
                t = abi.encodePacked(t, ',{"trait_type":"Loop","value":"', lp[i], '"}');
                count++;
            }
        }
        t = abi.encodePacked(t, ',{"trait_type":"Animated","value":"', count == 0 ? bytes("No") : bytes("Yes"), '"}]');
    }

    function _kindName(uint256 k) private pure returns (bytes memory) {
        return k == 0 ? bytes("Solid") : k == 1 ? bytes("Gradient") : bytes("Pattern");
    }

    function _u(uint256 v) internal pure returns (bytes memory s) {
        if (v == 0) return "0";
        uint256 len;
        for (uint256 t = v; t != 0; t /= 10) len++;
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
