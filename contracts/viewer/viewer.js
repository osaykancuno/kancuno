// THE K.LAB · K1N0 on-chain 3D piece. Embedded by KLabViewer in every token's animation_url,
// after `const D = "<data, hex>"`: colours (4: background, centre, front left, front right) ·
// look (8) · looks (2) · title. Plain WebGL: the clay K of kancuno.com (src/lib/world/figure.ts),
// the X and four head blocks black, the other colours each with the effect of its look. Drag to turn, wheel or pinch to zoom, double-click: the
// view of the look.
(() => {
  const b = new Uint8Array(D.length / 2)
  for (let i = 0; i < b.length; i++) b[i] = parseInt(D.substr(i * 2, 2), 16)
  const PAL = 'fbc5000f0d0afc98ca9559bbfff6dc7a74683ff2ff2f6bff27e07aff3b30ff7a1a6b3e26d9b38cff4fd81d2a6bc8f04a'
  const col = i => [0, 1, 2].map(k => parseInt(PAL.substr(i * 6 + k * 2, 2), 16) / 255)
  const BG = col(b[0]), INK = col(1), SLOT = [null, col(b[1]), col(b[2]), col(b[3])]
  const FX = [b[4], b[5], b[6], b[7]], PER = [4.8, 3.2, 2.4, 1.6][b[8] & 3]
  const yaw0 = ((b[9] << 24) >> 24) * 2, pitch0 = b[10] || 74, zoom0 = b[11] / 100 || 1
  let yaw = yaw0, pitch = pitch0, zoom = zoom0
  const C = document.getElementById('c')
  document.body.style.background = `rgb(${BG.map(v => v * 255 | 0)})`
  const gl = C.getContext('webgl', { antialias: true, stencil: true, premultipliedAlpha: false })
  if (!gl) { document.body.innerHTML = '<p style="font:14px sans-serif;padding:16px">WebGL is off in this browser.</p>'; return }

  // ── geometry: position, normal, local (-1..1), colour, slot (-1 black, 1 top, 2 centre, 3 front, -2 floor), rain phase
  const V = [], L = 14
  const F = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
  function box(cx, cy, cz, sx, sy, sz, ry, c, slot, rain) {
    const cs = Math.cos(ry), sn = Math.sin(ry), rot = (x, z) => [x * cs + z * sn, -x * sn + z * cs]
    for (const n of F) {
      const u = n[0] ? [0, 1, 0] : [1, 0, 0], v = n[1] ? [0, 0, 1] : n[2] ? [0, 1, 0] : [0, 0, 1]
      const k = (i, j) => {
        const l = [n[0] + u[0] * i + v[0] * j, n[1] + u[1] * i + v[1] * j, n[2] + u[2] * i + v[2] * j]
        const [x, z] = rot(l[0] * sx / 2, l[2] * sz / 2), [nx, nz] = rot(n[0], n[2])
        return [cx + x, cy + l[1] * sy / 2, cz + z, nx, n[1], nz, ...l, ...c, slot, rain]
      }
      const q = [k(-1, -1), k(1, -1), k(1, 1), k(-1, 1)]
      for (const i of [0, 1, 2, 0, 2, 3]) V.push(...q[i])
    }
  }
  const FC = 0.56, A = 47.5 * Math.PI / 180, P = 1.24, R = 0.82, Fr = 1.22, LV = [0.4, 0.5, 0.62]
  for (const a of [A, -A]) box(0, 0.35, FC, 3.62, 0.62, 1, a, INK, -1, 0)
  // the top row and the sides stay black; the centre and the two front blocks take the colours
  ;[[-P / 2, Fr + R * 2, 0, -1], [P / 2, Fr + R * 2, 0, -1], [-P, Fr + R, 1, -1], [0, Fr + R, 1, 1], [P, Fr + R, 1, -1], [-P / 2, Fr, 2, 2], [P / 2, Fr, 2, 3]]
    .forEach(([x, y, lv, s]) => box(x, LV[lv], -(y - FC), 1, 0.8, 1, 0, s > 0 ? SLOT[s] : INK, s, 0))
  const figN = V.length / L
  if (FX[0] === 5) for (let i = 0; i < 18; i++) {
    const h = Math.sin(i * 91.7 + b[0] * 7.3) * 43758.5, f = h - Math.floor(h)
    box((f - 0.5) * 9, 0, (((f * 7.13) % 1) - 0.5) * 7, 0.26, 0.26, 0.26, f * 3, SLOT[1 + (i % 3)], -3, 0.05 + ((f * 13.7) % 1))
  }
  const allN = V.length / L
  const e = 120 / 11.5
  for (const [x, z] of [[-e, -e], [e, -e], [e, e], [-e, -e], [e, e], [-e, e]]) V.push(x, 0, z, 0, 1, 0, 0, 1, 0, ...BG, -2, 0)

  // ── shaders ──
  const vs = `attribute vec3 p,n,l,c;attribute float s,r;uniform mat4 vp;uniform vec4 fx;uniform float t,sh;uniform vec3 ld;
varying vec3 vn,vl,vc,vw;varying float vs;
float ef(float s){return s<0.?0.:s<1.5?fx.y:s<2.5?fx.z:fx.w;}
void main(){vec3 q=p;float e=ef(s);
if(e==4.)q.y+=(.5-.5*cos(6.2832*(t-s*.12)))*.4;
if(e==8.)q.x+=step(.86,fract(sin(floor(t*14.+s)*43.1)*91.3))*.12;
if(r>0.)q.y+=6.5-fract(t+r)*7.;
vec4 w=vec4(q,1.);if(sh>.5){w.xyz-=ld*(w.y/ld.y);w.y=.003;}
vw=w.xyz;vn=n;vl=l;vc=c;vs=s;gl_Position=vp*w;}`
  const fs = `precision highp float;varying vec3 vn,vl,vc,vw;varying float vs;
uniform vec4 fx;uniform float t,sh;uniform vec3 ld,bg,eye,pat;uniform vec2 fog;
float ef(float s){return s<0.?0.:s<1.5?fx.y:s<2.5?fx.z:fx.w;}
float h2(vec2 q){return fract(sin(dot(q,vec2(12.9898,78.233)))*43758.5453);}
void main(){if(sh>.5){gl_FragColor=vec4(bg*.3,.45);return;}
vec3 k=vc;float pu=.5-.5*cos(6.2832*t);
if(abs(vs+2.)<.5){vec2 c=vw.xz*11.5;float B=fx.x;
 if(B==1.)k=mix(k,vec3(1.),.42*(1.-smoothstep(0.,60.,length(c))));
 if(B==2.)k=mix(k,vec3(1.),.2*pu);
 if(B==3.)k=mix(k,pat,.2*step(.5,fract(gl_FragCoord.y/3.)));
 if(B==4.)k+=(h2(floor(gl_FragCoord.xy))-.5)*.16;
 if(B==6.)k=mix(k,pat,.22*float(fract(c.x/6.)<.06||fract(c.y/6.)<.06));
 if(B==7.)k=mix(k,pat,.14*step(.5,fract((c.x+c.y)*.7071/6.)));
 if(B==8.)k=mix(k,pat,.16*step(length(fract(c/6.)-.5),.15));
}else{vec3 nn=normalize(vn);float d=max(dot(nn,ld),0.);float e=ef(vs);
 vec3 lit=k*(.5+.52*d)+(1.-k)*.1*(.5+.52*d);
 if(e==6.){vec3 m=step(vec3(.9),abs(vl));if(m.x+m.y+m.z>1.5)lit+=k*.6+.3;}
 if(e==7.){vec3 vdir=normalize(eye-vw);lit+=pow(max(dot(reflect(-ld,nn),vdir),0.),18.)*.7+vec3(.4)*smoothstep(.08,0.,abs(fract(t)*6.-3.-(vw.x-vw.z)));}
 if(e==1.)lit+=k*.45;
 if(e==2.)lit+=k*.7*pu;
 if(e==3.)lit*=1.-.85*(1.-smoothstep(0.,.06,abs(t-.5)));
 if(e==5.)lit+=vec3(.55)*smoothstep(.12,0.,abs(fract(t)*6.-3.-(vw.x+vw.z)));
 if(e==8.)lit.r+=.25*step(.8,fract(sin(floor(t*14.)*12.9)*437.5));
 k=lit;}
float f=smoothstep(fog.x,fog.y,distance(vw,eye));gl_FragColor=vec4(mix(k,bg,f),1.);}`
  const sp = (ty, src) => { const o = gl.createShader(ty); gl.shaderSource(o, src); gl.compileShader(o); return o }
  const pr = gl.createProgram()
  gl.attachShader(pr, sp(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sp(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr)
  const U = nm => gl.getUniformLocation(pr, nm)
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(V), gl.STATIC_DRAW)
  let o = 0
  for (const [nm, k] of [['p', 3], ['n', 3], ['l', 3], ['c', 3], ['s', 1], ['r', 1]]) {
    const at = gl.getAttribLocation(pr, nm); gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, k, gl.FLOAT, false, L * 4, o * 4); o += k
  }

  // ── camera ──
  const mul = (A, B) => { const r = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += A[k * 4 + j] * B[i * 4 + k]; r[i * 4 + j] = s } return r }
  const look = (e, tg) => {
    const z0 = e.map((v, i) => v - tg[i]), lz = Math.hypot(...z0), z = z0.map(v => v / lz)
    let x = [z[2], 0, -z[0]]; const lx = Math.hypot(...x) || 1; x = x.map(v => v / lx)
    const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]]
    const d = a => -(a[0] * e[0] + a[1] * e[1] + a[2] * e[2])
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, d(x), d(y), d(z), 1]
  }
  const per4 = (fv, a, n, f) => { const t = 1 / Math.tan(fv / 2); return [t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0] }
  const ldv = [-7, 18, -4.9], ll = Math.hypot(...ldv), LD = ldv.map(v => v / ll)
  const dark = BG[0] * .2126 + BG[1] * .7152 + BG[2] * .0722 < .43

  // ── interaction ──
  const pts = new Map(); let pinch = 0
  const clamp = () => { pitch = Math.max(20, Math.min(89, pitch)); zoom = Math.max(.6, Math.min(1.9, zoom)) }
  C.onpointerdown = ev => { C.setPointerCapture(ev.pointerId); pts.set(ev.pointerId, [ev.clientX, ev.clientY]); if (pts.size === 2) { const [a, c] = [...pts.values()]; pinch = Math.hypot(a[0] - c[0], a[1] - c[1]) } }
  C.onpointermove = ev => {
    const q = pts.get(ev.pointerId); if (!q) return
    if (pts.size === 1) { const k = 360 / Math.max(240, C.clientWidth); yaw -= (ev.clientX - q[0]) * k * .6; pitch += (ev.clientY - q[1]) * k * .4 }
    pts.set(ev.pointerId, [ev.clientX, ev.clientY])
    if (pts.size === 2) { const [a, c] = [...pts.values()]; const d = Math.hypot(a[0] - c[0], a[1] - c[1]); if (pinch) zoom *= d / pinch; pinch = d }
    clamp()
  }
  C.onpointerup = C.onpointercancel = ev => { pts.delete(ev.pointerId); pinch = 0 }
  C.onwheel = ev => { ev.preventDefault(); zoom *= Math.exp(-ev.deltaY * .0015); clamp() }
  C.ondblclick = () => { yaw = yaw0; pitch = pitch0; zoom = zoom0 }

  const t0 = performance.now()
  function frame(now) {
    requestAnimationFrame(frame)
    const dpr = Math.min(2, devicePixelRatio || 1), w = C.clientWidth * dpr | 0, h = C.clientHeight * dpr | 0
    if (C.width !== w || C.height !== h) { C.width = w; C.height = h }
    gl.viewport(0, 0, w, h)
    const t = ((now - t0) / 1000 / PER) % 1
    const r = 12.92 / zoom, yr = yaw * Math.PI / 180, pr2 = pitch * Math.PI / 180
    const eye = [r * Math.cos(pr2) * Math.sin(yr), r * Math.sin(pr2), .1 + r * Math.cos(pr2) * Math.cos(yr)]
    gl.uniformMatrix4fv(U('vp'), false, mul(per4(34 * Math.PI / 180, w / h, .1, 100), look(eye, [0, 0, .1])))
    gl.uniform4fv(U('fx'), FX); gl.uniform1f(U('t'), t); gl.uniform3fv(U('ld'), LD); gl.uniform3fv(U('bg'), BG); gl.uniform3fv(U('eye'), eye)
    gl.uniform3fv(U('pat'), dark ? [1, 1, 1] : [0, 0, 0]); gl.uniform2f(U('fog'), r + 5, r + 24)
    gl.clearColor(...BG, 1); gl.clearStencil(0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.uniform1f(U('sh'), 0); gl.drawArrays(gl.TRIANGLES, allN, 6) // floor
    gl.enable(gl.STENCIL_TEST); gl.stencilFunc(gl.EQUAL, 0, 255); gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR); gl.depthMask(false)
    gl.uniform1f(U('sh'), 1); gl.drawArrays(gl.TRIANGLES, 0, figN) // shadow, once per pixel
    gl.disable(gl.STENCIL_TEST); gl.depthMask(true)
    gl.uniform1f(U('sh'), 0); gl.drawArrays(gl.TRIANGLES, 0, allN)
  }
  requestAnimationFrame(frame)
})()
