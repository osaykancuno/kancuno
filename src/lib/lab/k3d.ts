// The K in 3D: the same clay figure, light and camera as the home page (src/lib/world),
// built from a K design. Browser-only: import it dynamically (it pulls in three.js).
// Time-driven like render.ts: frame N of a loop is render(d, N / fps), so exports loop seamlessly.
import {
  BoxGeometry, CanvasTexture, ClampToEdgeWrapping, Color, DirectionalLight, Fog, Group, HemisphereLight, InstancedMesh, Matrix4,
  Mesh, MeshBasicMaterial, MeshStandardMaterial, NeutralToneMapping, Object3D, PCFSoftShadowMap,
  PerspectiveCamera, PlaneGeometry, PMREMGenerator, Quaternion, Raycaster, RepeatWrapping, Scene,
  ShadowMaterial, SRGBColorSpace, Vector2, Vector3, WebGLRenderer, type BufferGeometry, type Material, type Texture,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { CANVAS } from './base'
import type { Fill, KDesign, PartId } from './design'
import { CAM_DEFAULT, type Cam } from './orbit'
import { composeImage, loadedImage, loadImage, type KImage } from './image'
import { BAR_ANGLE, BAR_SIZE, BAR_Y, BODY_BOX3D, CUBE_SIZE, FIG_BOX3D, FLAT_CENTER, HEAD3D as HEAD, HEAD_BOX3D, LEVEL, S } from './layout3d'
import { isHex } from './validate'

// Camera: the home hero's view (0, 12.4, 3.65) -> (0, 0, 0.1), expressed as an orbit
const TARGET = new Vector3(0, 0, 0.1)
const DIST = Math.hypot(12.4, 3.55)

const FLOOR = 240 // canvas units of floor under the K (wide enough for low orbit views)
const TAU = Math.PI * 2
const hash = (k: number) => {
  const x = Math.sin(k * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
const col = (c: string) => new Color(isHex(c) ? c : '#000000')

// ── Fills → canvas textures (gradients and patterns, same look as the flat renderer) ──
function paintFill(fill: Fill, region: { x: number; y: number; w: number; h: number }, px: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = c.height = px
  const g = c.getContext('2d')!
  const k = px / region.w // texture px per canvas unit
  g.setTransform(k, 0, 0, px / region.h, -region.x * k, -region.y * (px / region.h))
  if (fill.kind === 'solid') {
    g.fillStyle = fill.a
    g.fillRect(region.x, region.y, region.w, region.h)
  } else if (fill.kind === 'gradient') {
    const a = (fill.angle * Math.PI) / 180
    const cx = region.x + region.w / 2
    const cy = region.y + region.h / 2
    const half = (Math.abs(Math.cos(a)) * region.w + Math.abs(Math.sin(a)) * region.h) / 2
    const lg = g.createLinearGradient(cx - Math.cos(a) * half, cy - Math.sin(a) * half, cx + Math.cos(a) * half, cy + Math.sin(a) * half)
    lg.addColorStop(0, fill.a)
    lg.addColorStop(1, fill.b)
    g.fillStyle = lg
    g.fillRect(region.x, region.y, region.w, region.h)
  } else {
    const s = fill.scale
    g.fillStyle = fill.a
    g.fillRect(region.x, region.y, region.w, region.h)
    g.fillStyle = fill.b
    g.strokeStyle = fill.b
    const x0 = Math.floor(region.x / s) * s - s * 2
    const y0 = Math.floor(region.y / s) * s - s * 2
    const x1 = region.x + region.w + s * 2
    const y1 = region.y + region.h + s * 2
    if (fill.pattern === 'stripes') {
      g.lineWidth = s / 2 / Math.SQRT2 * 1.4
      for (let d = x0 - (y1 - y0); d < x1; d += s * Math.SQRT2) {
        g.beginPath(); g.moveTo(d, y1); g.lineTo(d + (y1 - y0), y0); g.stroke()
      }
    } else {
      for (let y = y0; y < y1; y += s) {
        for (let x = x0; x < x1; x += s) {
          if (fill.pattern === 'dots') { g.beginPath(); g.arc(x + s / 2, y + s / 2, s * 0.22, 0, TAU); g.fill() }
          if (fill.pattern === 'checker' && (Math.round(x / s) + Math.round(y / s)) % 2 === 0) g.fillRect(x, y, s, s)
          if (fill.pattern === 'scan') g.fillRect(x, y, s, s * 0.35)
          if (fill.pattern === 'grid') { g.fillRect(x, y, s, Math.max(0.2, s * 0.08)); g.fillRect(x, y, Math.max(0.2, s * 0.08), s) }
        }
      }
    }
  }
  return c
}

const FX_SHADER = {
  uniforms: {
    tDiffuse: { value: null as Texture | null },
    uRes: { value: new Vector2(1, 1) },
    uPixel: { value: 0 },
    uGlitch: { value: 0 },
    uGrain: { value: 0 },
    uScan: { value: 0 },
    uBand: { value: -1 },
    uSeed: { value: 0 },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform vec2 uRes;
    uniform float uPixel, uGlitch, uGrain, uScan, uBand, uSeed;
    varying vec2 vUv;
    float h1(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
    float h2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 uv = vUv;
      if (uPixel > 0.0) { vec2 b = vec2(uPixel) / uRes; uv = (floor(uv / b) + 0.5) * b; }
      if (uGlitch > 0.0) {
        float band = floor(uv.y * 22.0);
        if (h1(band + uSeed) > 1.0 - uGlitch * 0.4) uv.x += (h1(band * 1.7 + uSeed) - 0.5) * 0.07 * uGlitch;
      }
      vec4 c = texture2D(tDiffuse, uv);
      if (uGlitch > 0.0) {
        float k = uGlitch * 0.005;
        c.r = texture2D(tDiffuse, uv + vec2(k, 0.0)).r;
        c.b = texture2D(tDiffuse, uv - vec2(k, 0.0)).b;
      }
      if (uScan > 0.0) c.rgb *= 1.0 - uScan * 0.28 * step(0.5, fract(gl_FragCoord.y / max(2.0, uRes.y / 260.0)));
      if (uBand >= 0.0) c.rgb += vec3(0.14) * smoothstep(0.035, 0.0, abs(uv.y - uBand));
      if (uGrain > 0.0) c.rgb += (h2(floor(gl_FragCoord.xy) + uSeed) - 0.5) * uGrain * 0.2;
      gl_FragColor = c;
    }`,
}

type Picked = PartId | 'pixels'

// Touch Field: the pointer pushes the blocks, with the home page's physics (radius 1.9, strength 1.1, ease 6)
export type TouchMode = 'push' | 'lift' | 'pull' | 'ripple'
export interface TouchOptions {
  mode: TouchMode
  radius: number // world units
  strength: number
  ease: number // how fast blocks follow and come back (1/s)
  parts: 'all' | 'head' | 'body'
  field: boolean // a voxel field around the K that makes way too
}
export const TOUCH_DEFAULT: TouchOptions = { mode: 'push', radius: 1.9, strength: 1.1, ease: 6, parts: 'all', field: true }

export class KRenderer {
  readonly canvas: HTMLCanvasElement
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera = new PerspectiveCamera(34, 1, 0.1, 100)
  private key: DirectionalLight
  private hemi: HemisphereLight
  private catcher: Mesh<PlaneGeometry, ShadowMaterial>
  private floor: Mesh<PlaneGeometry, MeshBasicMaterial>
  private composer: EffectComposer
  private bloom: UnrealBloomPass
  private fxPass: ShaderPass
  private size = 512
  private fog = new Fog(0xfbc500, 18, 40)

  // Built per design
  private built: KDesign | null = null
  private figure = new Group()
  private bars: Mesh[] = []
  private cubes: Mesh[] = []
  private edges: { mesh: InstancedMesh; base: Matrix4[]; owner: number[] } | null = null
  private voxels: InstancedMesh | null = null
  private rain: InstancedMesh | null = null
  private disposables: { dispose(): void }[] = []

  // Called when an asset (the Image Wrap picture) finished loading: render again
  onAsset: (() => void) | null = null

  // Await what a design needs before rendering it offscreen (exports, thumbnails)
  async prepare(d: KDesign) {
    if (d.img) await loadImage(d.img.src).catch(() => undefined)
  }

  // Touch Field state
  private touch: TouchOptions | null = null
  private hit = new Vector3()
  private hitOn = false
  private touchTime = 0
  private barOff = [new Vector3(), new Vector3()]
  private cubeOff = Array.from({ length: 7 }, () => new Vector3())
  private voxBase: Float32Array | null = null // xyz + scale per voxel
  private voxOff: Float32Array | null = null
  private field: { mesh: InstancedMesh; base: Float32Array; off: Float32Array } | null = null
  private tmpV = new Vector3()
  private tmpC = new Color()
  private scaleM = new Matrix4()
  private offs: number[] = new Array(7).fill(0)
  private squash: number[] = new Array(7).fill(1)

  // Shared geometry, like the home world
  private static barGeo: BufferGeometry
  private static cubeGeo: BufferGeometry
  private static voxelGeo: BufferGeometry
  private static thinGeo: BufferGeometry

  private o = new Object3D()
  private m = new Matrix4()
  private q = new Quaternion()
  private ray = new Raycaster()

  constructor(canvas?: HTMLCanvasElement) {
    this.canvas = canvas ?? document.createElement('canvas')
    const r = new WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, preserveDrawingBuffer: false })
    this.renderer = r
    r.setPixelRatio(1)
    r.shadowMap.enabled = true
    r.shadowMap.type = PCFSoftShadowMap
    r.toneMapping = NeutralToneMapping // keeps the brand colours true, as on the home page

    KRenderer.barGeo ??= new RoundedBoxGeometry(BAR_SIZE[0], BAR_SIZE[1], BAR_SIZE[2], 4, 0.1)
    KRenderer.cubeGeo ??= new RoundedBoxGeometry(CUBE_SIZE[0], CUBE_SIZE[1], CUBE_SIZE[2], 4, 0.085)
    KRenderer.voxelGeo ??= new RoundedBoxGeometry(1, 1, 1, 2, 0.14)
    KRenderer.thinGeo ??= new BoxGeometry(1, 1, 1)

    const scene = this.scene
    const pmrem = new PMREMGenerator(r)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environmentIntensity = 0.38
    pmrem.dispose()

    this.hemi = new HemisphereLight(0xfff3d6, 0xfbc500, 0.85)
    const key = new DirectionalLight(0xfff8ec, 2.7)
    key.position.set(-7, 18, -4.9)
    key.target.position.set(0, 0, 0)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 50 })
    key.shadow.bias = -0.0004
    key.shadow.normalBias = 0.02
    this.key = key
    scene.add(this.hemi, key, key.target)

    // The background is the floor: a flat plane for gradients/patterns, else the clear colour
    this.floor = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ toneMapped: false }))
    this.floor.rotation.x = -Math.PI / 2
    this.floor.scale.set(FLOOR / S, FLOOR / S, 1)
    this.floor.visible = false
    this.catcher = new Mesh(new PlaneGeometry(30, 30), new ShadowMaterial({ color: 0x5a3c00, opacity: 0.3 }))
    this.catcher.rotation.x = -Math.PI / 2
    this.catcher.position.y = 0.002
    this.catcher.receiveShadow = true
    scene.add(this.floor, this.catcher, this.figure)

    // Same framing as the home hero: seen from above, slightly from the front
    // (same direction as the home's (0, 15, 4.4) → (0, 0, 0.1), a little closer for a square frame)
    this.placeCamera(CAM_DEFAULT)
    scene.fog = this.fog

    this.composer = new EffectComposer(r)
    this.composer.addPass(new RenderPass(scene, this.camera))
    this.bloom = new UnrealBloomPass(new Vector2(512, 512), 0, 0.55, 1.0) // threshold 1: only emissive parts glow
    this.composer.addPass(this.bloom)
    this.fxPass = new ShaderPass(FX_SHADER)
    this.composer.addPass(this.fxPass)
    this.composer.addPass(new OutputPass())
    this.setSize(512)
  }

  setSize(px: number) {
    this.size = Math.max(16, Math.round(px))
    const sm = this.size > 700 ? 2048 : 1024 // small previews and thumbs do not need a 2K shadow map
    if (this.key.shadow.mapSize.x !== sm) {
      this.key.shadow.mapSize.set(sm, sm)
      this.key.shadow.map?.dispose()
      this.key.shadow.map = null
    }
    this.renderer.setSize(this.size, this.size, false)
    this.composer.setPixelRatio(1)
    this.composer.setSize(this.size, this.size)
    this.bloom.resolution.set(this.size, this.size)
    this.fxPass.uniforms.uRes.value.set(this.size, this.size)
  }

  // ── Build ───────────────────────────────────────────────────
  private track<T extends { dispose(): void }>(x: T): T {
    this.disposables.push(x)
    return x
  }

  private clearBuild() {
    this.figure.clear()
    if (this.rain) this.scene.remove(this.rain)
    this.disposables.forEach(x => x.dispose())
    this.disposables = []
    this.bars = []
    this.cubes = []
    this.edges = null
    this.voxels = null
    this.rain = null
    this.voxBase = null
    this.voxOff = null
    if (this.field) { this.scene.remove(this.field.mesh); this.field = null }
  }

  // A planar texture across a part's box (seen from above, like a print on the clay)
  private fillTexture(fill: Fill, region: { x: number; y: number; w: number; h: number }, repeat = false): Texture {
    const t = this.track(new CanvasTexture(paintFill(fill, region, 512)))
    t.colorSpace = SRGBColorSpace
    if (repeat) t.wrapS = t.wrapT = RepeatWrapping
    return t
  }

  private planarUV(geo: BufferGeometry, matrix: Matrix4, region: { x: number; y: number; w: number; h: number }): BufferGeometry {
    const g = this.track(geo.clone())
    const pos = g.attributes.position
    const uv = g.attributes.uv
    const v = new Vector3()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(matrix)
      const cx = CANVAS / 2 + v.x * S
      const cy = CANVAS / 2 + v.z * S
      uv.setXY(i, (cx - region.x) / region.w, 1 - (cy - region.y) / region.h)
    }
    uv.needsUpdate = true
    return g
  }

  private partMaterial(fill: Fill, colour: string | null, line: boolean, glow: number, region: { x: number; y: number; w: number; h: number }): { mat: MeshStandardMaterial; textured: boolean } {
    const textured = !colour && fill.kind !== 'solid'
    const base = colour ? col(colour) : fill.kind === 'solid' ? col(fill.a) : new Color(0xffffff)
    const mat = this.track(new MeshStandardMaterial({ color: base, roughness: 0.52, metalness: 0 }))
    if (textured) mat.map = this.fillTexture(fill, region)
    if (line) {
      // neon tube: a glassy body, the light lives in the edges
      mat.transparent = true
      mat.opacity = 0.16
      mat.depthWrite = false
      mat.emissive = base.clone()
      mat.emissiveIntensity = 0.25
    } else if (glow > 0) {
      // bright colours are already near the bloom threshold: scale the glow by how dark the colour is
      const lum = 0.2126 * base.r + 0.7152 * base.g + 0.0722 * base.b
      mat.emissive = base.clone()
      mat.emissiveIntensity = glow * (0.35 + 0.9 * (1 - Math.min(1, lum)))
      if (textured) mat.emissiveMap = mat.map
    }
    return { mat, textured }
  }

  private build(d: KDesign) {
    this.clearBuild()
    this.built = d
    const glow = d.fx.glow
    const edgeList: { m: Matrix4; size: [number, number, number]; color: Color; owner: number }[] = []
    const z = (y: number) => -(y - FLAT_CENTER)
    const figBox = { x: 28, y: 18, w: 44, h: 64 }
    const headBox = { x: 28, y: 18, w: 44, h: 34 }

    // Image Wrap: the picture on the targeted parts (vector form). Print = one picture across
    // the K seen from above (its region is the targeted parts' footprint); tile = on every block.
    const im = d.form === 'vector' && d.img ? d.img : null
    const pic = im ? loadedImage(im.src) : null
    if (im && !pic) loadImage(im.src).then(() => this.onAsset?.(), () => undefined)
    const wants = (p: 'head' | 'body') => !!pic && (im!.target === 'all' || im!.target === p)
    const printBox = im ? (im.target === 'head' ? HEAD_BOX3D : im.target === 'body' ? BODY_BOX3D : FIG_BOX3D) : FIG_BOX3D
    let printTex: Texture | null = null
    const imageTex = (o: KImage, w: number, h: number, under: string): Texture => {
      const t = this.track(new CanvasTexture(composeImage(pic!, o, w, h, under, [d.body.fill.a, d.head.cubes[3]])))
      t.colorSpace = SRGBColorSpace
      t.anisotropy = 4
      return t
    }
    const imageMaterial = (part: 'head' | 'body', under: string, w = 1, h = 1): MeshStandardMaterial => {
      const o = im!
      let map: Texture
      if (o.mode === 'print') {
        printTex ??= imageTex(o, 1024, (1024 * printBox.h) / printBox.w, under)
        map = printTex
      } else {
        map = imageTex(o, w >= h ? 512 : (512 * w) / h, h > w ? 512 : (512 * h) / w, under)
      }
      const mat = this.track(new MeshStandardMaterial({ color: 0xffffff, roughness: 0.52, metalness: 0, map }))
      if (glow > 0) { mat.emissive = new Color(0xffffff); mat.emissiveMap = map; mat.emissiveIntensity = glow * 0.5 }
      mat.userData.part = part
      return mat
    }

    if (d.form === 'pixel') {
      const size = d.grid.size
      const cell = CANVAS / size / S
      const cells = d.grid.cells.map((c, i) => ({ c, i })).filter(x => x.c && isHex(x.c))
      const mat = this.track(new MeshStandardMaterial({ color: 0xffffff, roughness: 0.52, metalness: 0 }))
      if (glow > 0) { mat.emissive = new Color(0xffffff); mat.emissiveIntensity = 0 }
      const mesh = this.track(new InstancedMesh(KRenderer.voxelGeo, mat, Math.max(1, cells.length)))
      mesh.count = cells.length
      const s = cell * (1 - d.grid.gap)
      const vb = new Float32Array(cells.length * 4)
      this.voxBase = vb
      this.voxOff = new Float32Array(cells.length * 3)
      cells.forEach(({ c, i }, n) => {
        const gx = i % size
        const gy = Math.floor(i / size)
        this.o.position.set(((gx + 0.5) * CANVAS / size - CANVAS / 2) / S, s / 2, ((gy + 0.5) * CANVAS / size - CANVAS / 2) / S)
        vb.set([this.o.position.x, this.o.position.y, this.o.position.z, s], n * 4)
        this.o.rotation.set(0, 0, 0)
        this.o.scale.set(s, s, s)
        this.o.updateMatrix()
        mesh.setMatrixAt(n, this.o.matrix)
        const cc = col(c)
        mesh.setColorAt(n, glow > 0 ? cc.multiplyScalar(1 + glow * 1.4) : cc)
      })
      mesh.castShadow = mesh.receiveShadow = true
      mesh.userData.part = 'pixels'
      this.voxels = mesh
      this.figure.add(mesh)
    } else {
      if (d.body.visible) {
        ;[BAR_ANGLE, -BAR_ANGLE].forEach((a, i) => {
          this.o.position.set(0, BAR_Y, z(0))
          this.o.rotation.set(0, a, 0)
          this.o.scale.set(1, 1, 1)
          this.o.updateMatrix()
          const pictured = wants('body')
          const { mat, textured } = pictured
            ? { mat: imageMaterial('body', d.body.fill.kind === 'solid' ? d.body.fill.a : '#0f0d0a', BAR_SIZE[0], BAR_SIZE[2]), textured: im!.mode === 'print' }
            : this.partMaterial(d.body.fill, null, d.body.line, glow, figBox)
          const region = pictured ? printBox : figBox
          const geo = textured ? this.planarUV(KRenderer.barGeo, this.o.matrix, region) : KRenderer.barGeo
          const line = d.body.line && !pictured
          const mesh = new Mesh(geo, mat)
          mesh.matrixAutoUpdate = false
          mesh.matrix.copy(this.o.matrix)
          mesh.userData = { part: 'body', base: this.o.matrix.clone(), i }
          mesh.castShadow = !line
          mesh.receiveShadow = true
          this.bars.push(mesh)
          this.figure.add(mesh)
          if (line) edgeList.push({ m: this.o.matrix.clone(), size: [...BAR_SIZE], color: mat.color.clone(), owner: 100 + i })
        })
      }
      if (d.head.visible) {
        HEAD.forEach((h, i) => {
          this.o.position.set(h.x, LEVEL[h.level], z(h.y))
          this.o.rotation.set(0, 0, 0)
          this.o.scale.set(1, 1, 1)
          this.o.updateMatrix()
          const colour = d.head.useFill ? null : d.head.cubes[i]
          const pictured = wants('head')
          const { mat, textured } = pictured
            ? { mat: imageMaterial('head', colour ?? (d.head.fill.kind === 'solid' ? d.head.fill.a : '#0f0d0a')), textured: im!.mode === 'print' }
            : this.partMaterial(d.head.fill, colour, d.head.line, glow, headBox)
          const region = pictured ? printBox : headBox
          const geo = textured ? this.planarUV(KRenderer.cubeGeo, this.o.matrix, region) : KRenderer.cubeGeo
          const line = d.head.line && !pictured
          const mesh = new Mesh(geo, mat)
          mesh.matrixAutoUpdate = false
          mesh.matrix.copy(this.o.matrix)
          mesh.userData = { part: 'head', base: this.o.matrix.clone(), i, row: h.level }
          mesh.castShadow = !line
          mesh.receiveShadow = true
          this.cubes.push(mesh)
          this.figure.add(mesh)
          if (line) edgeList.push({ m: this.o.matrix.clone(), size: [...CUBE_SIZE], color: mat.color.clone(), owner: i })
        })
      }
    }

    // Neon edges: 12 thin bars per box, bright enough for the bloom
    if (edgeList.length) {
      const mat = this.track(new MeshBasicMaterial({ color: 0xffffff, toneMapped: false }))
      const n = edgeList.length * 12
      const mesh = this.track(new InstancedMesh(KRenderer.thinGeo, mat, n))
      const base: Matrix4[] = []
      const owner: number[] = []
      const t = 0.055
      let k = 0
      const brightness = 1.6 + glow * 2.4
      for (const e of edgeList) {
        const [w, h, dd] = e.size
        const segs: [number, number, number, number, number, number][] = []
        for (const a of [-1, 1]) for (const b of [-1, 1]) {
          segs.push([0, (a * h) / 2, (b * dd) / 2, w + t, t, t])
          segs.push([(a * w) / 2, 0, (b * dd) / 2, t, h + t, t])
          segs.push([(a * w) / 2, (b * h) / 2, 0, t, t, dd + t])
        }
        for (const [x, y, zz, sx, sy, sz] of segs) {
          this.o.position.set(x, y, zz)
          this.o.rotation.set(0, 0, 0)
          this.o.scale.set(sx, sy, sz)
          this.o.updateMatrix()
          const m = e.m.clone().multiply(this.o.matrix)
          base.push(m)
          owner.push(e.owner)
          mesh.setMatrixAt(k, m)
          mesh.setColorAt(k, e.color.clone().multiplyScalar(brightness))
          k++
        }
      }
      mesh.frustumCulled = false
      this.edges = { mesh, base, owner }
      this.figure.add(mesh)
    }

    if (this.touch?.field) this.buildField(d)

    // Pixel rain: voxels falling onto the floor in the K's colours, around the figure, never through it
    if (d.anim.loops.includes('rain')) {
      const n = 30
      const mat = this.track(new MeshStandardMaterial({ color: 0xffffff, roughness: 0.52 }))
      const mesh = this.track(new InstancedMesh(KRenderer.voxelGeo, mat, n))
      const tones = [d.head.cubes[3], d.head.cubes[5], d.form === 'pixel' ? '#fbc500' : d.head.cubes[0]]
      for (let i = 0; i < n; i++) mesh.setColorAt(i, col(tones[i % 3]))
      mesh.castShadow = false // their shadows would dot the K itself
      mesh.frustumCulled = false
      this.rain = mesh
      this.scene.add(mesh)
    }
  }

  // A voxel field on the floor around the K (Touch Field), in ink with a few head colours
  private buildField(d: KDesign) {
    if (this.field) { this.scene.remove(this.field.mesh); this.field = null }
    const n = 22
    const step = 0.5
    const list: [number, number][] = []
    for (let gz = 0; gz < n; gz++) for (let gx = 0; gx < n; gx++) {
      const x = (gx - (n - 1) / 2) * step
      const zz = (gz - (n - 1) / 2) * step
      if (Math.abs(x) < 2.35 && zz > -3.35 && zz < 2.4) continue // leave the figure its space
      list.push([x, zz])
    }
    const mat = this.track(new MeshStandardMaterial({ color: 0xffffff, roughness: 0.52 }))
    const mesh = this.track(new InstancedMesh(KRenderer.voxelGeo, mat, list.length))
    const base = new Float32Array(list.length * 4)
    const ink = d.form === 'pixel' ? '#0f0d0a' : d.body.fill.a
    const tones = [d.head.cubes[3], d.head.cubes[5], d.head.cubes[0]]
    list.forEach(([x, zz], i) => {
      const sz = 0.3 + hash(i * 2.7) * 0.08
      base.set([x, sz / 2, zz, sz], i * 4)
      const r = hash(i * 9.1 + 5)
      mesh.setColorAt(i, col(r < 0.08 ? tones[0] : r < 0.16 ? tones[1] : r < 0.2 ? '#fbc500' : r < 0.6 ? ink : tones[2]))
    })
    mesh.castShadow = mesh.receiveShadow = true
    mesh.frustumCulled = false
    this.field = { mesh, base, off: new Float32Array(list.length * 3) }
    this.scene.add(mesh)
  }

  setTouch(opts: TouchOptions | null) {
    const fieldChanged = (opts?.field ?? false) !== (this.touch?.field ?? false)
    this.touch = opts
    if (fieldChanged) {
      if (opts?.field && this.built) this.buildField(this.built)
      else if (this.field) { this.scene.remove(this.field.mesh); this.field = null }
    }
  }

  // Pointer in client coordinates; the hit point is on a plane at the height of the blocks
  setPointer(clientX: number, clientY: number, active: boolean) {
    this.hitOn = false
    if (!active) return
    const r = this.canvas.getBoundingClientRect()
    const p = new Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
    this.ray.setFromCamera(p, this.camera)
    const ray = this.ray.ray
    if (Math.abs(ray.direction.y) < 1e-4) return
    const k = (0.6 - ray.origin.y) / ray.direction.y
    if (k <= 0) return
    this.hit.copy(ray.origin).addScaledVector(ray.direction, k)
    this.hitOn = true
  }

  // Pointer in normalised stage coordinates (-1..1), for the keyboard and the demo path
  setPointerNdc(x: number, y: number, active: boolean) {
    const r = this.canvas.getBoundingClientRect()
    this.setPointer(r.left + ((x + 1) / 2) * r.width, r.top + (1 - (y + 1) / 2) * r.height, active)
  }

  private touchTarget(x: number, z: number, out: Vector3) {
    out.set(0, 0, 0)
    const T = this.touch
    if (!T || !this.hitOn) return out
    const dx = x - this.hit.x
    const dz = z - this.hit.z
    const d = Math.hypot(dx, dz)
    const R = T.radius
    if (T.mode === 'ripple') {
      const fall = Math.max(0, 1 - d / (R * 2.2))
      out.y = Math.max(0, Math.sin(d * 3.2 - this.touchTime * 7)) * fall * T.strength * 0.55
      return out
    }
    if (d >= R) return out
    const f = (R - d) / R
    const ease = f * f * (3 - 2 * f)
    if (T.mode === 'lift') { out.y = ease * T.strength * 1.5; return out }
    const dir = d > 1e-4 ? 1 / d : 0
    const k = T.mode === 'pull' ? -Math.min(d, f * T.strength * 0.8) : f * T.strength * 1.1 // the home page's push
    out.set(dx * dir * k, ease * T.strength * (T.mode === 'pull' ? 0.35 : 0.45), dz * dir * k)
    return out
  }

  // Advance the touch physics by dt seconds (call once per frame before render)
  // Returns how much moved, so callers can skip frames once everything has settled.
  step(dt: number): number {
    const T = this.touch
    if (!T) return 0
    this.touchTime += dt
    let moved = 0
    const a = 1 - Math.exp(-dt * T.ease)
    const head = T.parts !== 'body'
    const body = T.parts !== 'head'
    const follow = (off: Vector3, x: number, z: number, on: boolean) => {
      if (on) this.touchTarget(x, z, this.tmpV)
      else this.tmpV.set(0, 0, 0)
      moved += off.distanceTo(this.tmpV) * a
      off.lerp(this.tmpV, a)
    }
    // each bar reacts around the point of the X nearest to the pointer, so both arms can move
    this.bars.forEach((b, i) => {
      const ang = i === 0 ? BAR_ANGLE : -BAR_ANGLE
      const ux = Math.cos(ang)
      const uz = -Math.sin(ang)
      const cz = FLAT_CENTER
      const tt = Math.max(-BAR_SIZE[0] / 2, Math.min(BAR_SIZE[0] / 2, (this.hit.x) * ux + (this.hit.z - cz) * uz))
      follow(this.barOff[i], tt * ux, cz + tt * uz, body)
    })
    this.cubes.forEach(c => {
      const i = c.userData.i as number
      const h = HEAD[i]
      follow(this.cubeOff[i], h.x, -(h.y - FLAT_CENTER), head)
    })
    const flow = (base: Float32Array, off: Float32Array) => {
      for (let i = 0, n = base.length / 4; i < n; i++) {
        this.touchTarget(base[i * 4], base[i * 4 + 2], this.tmpV)
        moved += (Math.abs(this.tmpV.x - off[i * 3]) + Math.abs(this.tmpV.y - off[i * 3 + 1]) + Math.abs(this.tmpV.z - off[i * 3 + 2])) * a
        off[i * 3] += (this.tmpV.x - off[i * 3]) * a
        off[i * 3 + 1] += (this.tmpV.y - off[i * 3 + 1]) * a
        off[i * 3 + 2] += (this.tmpV.z - off[i * 3 + 2]) * a
      }
    }
    if (this.voxBase && this.voxOff) flow(this.voxBase, this.voxOff)
    if (this.field) flow(this.field.base, this.field.off)
    return moved + (T.mode === 'ripple' && this.hitOn ? 1 : 0)
  }

  // ── Per frame ───────────────────────────────────────────────
  private camKey = ''
  private placeCamera(c: Cam) {
    const key = `${c.yaw}|${c.pitch}|${c.zoom}`
    if (key === this.camKey) return
    this.camKey = key
    const yaw = (c.yaw * Math.PI) / 180
    const pitch = (c.pitch * Math.PI) / 180
    const r = DIST / (c.zoom || 1)
    this.camera.position.set(
      TARGET.x + r * Math.cos(pitch) * Math.sin(yaw),
      TARGET.y + r * Math.sin(pitch),
      TARGET.z + r * Math.cos(pitch) * Math.cos(yaw),
    )
    this.camera.lookAt(TARGET)
    this.camera.updateMatrixWorld()
    // low views see the horizon: fade the floor into the background colour far away
    this.fog.near = r + 5
    this.fog.far = r + 24
  }

  // Only what changes the meshes rebuilds them; the floor, FX, motion and the camera are
  // applied per frame, so sliders and orbiting never rebuild geometry.
  private keyFor: KDesign | null = null
  private keyStr = ''
  private keyWaiting = false
  private builtKey = ''
  private keyOf(d: KDesign): string {
    const waiting = !!d.img && !loadedImage(d.img.src) // rebuild once the picture has decoded
    if (d === this.keyFor && waiting === this.keyWaiting && this.keyStr) return this.keyStr
    this.keyFor = d
    this.keyWaiting = waiting
    const img = d.img ? { ...d.img, src: d.img.src.length + d.img.src.slice(-48), ok: !waiting } : 0
    this.keyStr = JSON.stringify([d.form, d.body, d.head, d.fx.glow, d.anim.loops.includes('rain'), d.form === 'pixel' ? d.grid : 0, img])
    return this.keyStr
  }

  render(d: KDesign, t = 0, o: { selected?: PartId | null; cam?: Cam | null } = {}) {
    const bk = this.keyOf(d)
    if (bk !== this.builtKey || !this.built) { this.build(d); this.builtKey = bk }
    this.built = d
    this.placeCamera(o.cam ?? d.cam ?? CAM_DEFAULT)
    const has = (l: KDesign['anim']['loops'][number]) => d.anim.loops.includes(l)
    const P = d.anim.period > 0 ? d.anim.period : 1
    const ph = (((t % P) + P) % P) / P

    // Background / floor
    const scene = this.scene
    if (!d.bg.visible) {
      scene.background = null
      this.renderer.setClearColor(0x000000, 0)
      this.floor.visible = false
    } else if (d.bg.fill.kind === 'solid') {
      scene.background = col(d.bg.fill.a)
      this.floor.visible = false
    } else {
      scene.background = col(d.bg.fill.a)
      const key = JSON.stringify(d.bg.fill)
      if (this.floor.userData.key !== key) {
        this.floor.material.map?.dispose()
        const region = { x: CANVAS / 2 - FLOOR / 2, y: CANVAS / 2 - FLOOR / 2, w: FLOOR, h: FLOOR }
        const tex = new CanvasTexture(paintFill(d.bg.fill, region, 2048))
        tex.colorSpace = SRGBColorSpace
        tex.wrapS = tex.wrapT = ClampToEdgeWrapping
        tex.anisotropy = 4
        this.floor.material.map = tex
        this.floor.material.needsUpdate = true
        this.floor.userData.key = key
      }
      this.floor.visible = true
    }
    const bgc = d.bg.visible ? col(d.bg.fill.a) : this.tmpC.setHex(0xfbc500)
    this.hemi.groundColor.copy(bgc)
    this.fog.color.copy(bgc)
    scene.fog = d.bg.visible ? this.fog : null // a transparent canvas has no horizon to fade into
    this.catcher.material.color.copy(bgc).multiplyScalar(0.28)
    this.catcher.material.opacity = 0.22 + d.fx.depth * 0.38

    // Motion of the whole figure
    let lift = 0
    let tilt = 0
    let turn = 0
    if (has('bounce')) lift += Math.sin(Math.PI * ph) * 1.3
    if (has('float')) { lift += 0.3 + Math.sin(TAU * ph) * 0.3; tilt = Math.sin(TAU * ph + Math.PI / 2) * 0.05 }
    if (has('spin')) turn = ph * TAU // a full turn, seamless
    this.figure.position.set(0, lift, 0)
    this.figure.rotation.set(tilt, turn, 0)

    // Head wave and blink
    const offs = this.offs.fill(0)
    const squash = this.squash.fill(1)
    for (const c of this.cubes) {
      const i = c.userData.i as number
      if (has('wave')) offs[i] = Math.sin(TAU * (ph - i / 7)) * 0.14 + 0.14 // gentle: the head stays one figure
      if (has('blink') && c.userData.row === 2) squash[i] = 1 - 0.55 * Math.max(0, 1 - Math.abs(ph - 0.5) / 0.06) // narrows, never vanishes
      const to = this.cubeOff[i]
      this.m.makeTranslation(to.x, offs[i] + to.y, to.z).multiply(c.userData.base as Matrix4)
      if (squash[i] !== 1) this.m.multiply(this.scaleM.makeScale(1, squash[i], 1))
      c.matrix.copy(this.m)
      c.matrixWorldNeedsUpdate = true
    }
    for (const b of this.bars) {
      const to = this.barOff[b.userData.i as number]
      b.matrix.copy(this.m.makeTranslation(to.x, to.y, to.z).multiply(b.userData.base as Matrix4))
      b.matrixWorldNeedsUpdate = true
    }
    if (this.edges) {
      const { mesh, base, owner } = this.edges
      base.forEach((b, k) => {
        const i = owner[k]
        const to = i >= 100 ? this.barOff[i - 100] : this.cubeOff[i]
        this.m.makeTranslation(to.x, (i >= 100 ? 0 : offs[i]) + to.y, to.z).multiply(b)
        mesh.setMatrixAt(k, this.m)
      })
      mesh.instanceMatrix.needsUpdate = true
    }
    const placeAll = (mesh: InstancedMesh, base: Float32Array, off: Float32Array) => {
      for (let i = 0, n = base.length / 4; i < n; i++) {
        const sz = base[i * 4 + 3]
        this.o.position.set(base[i * 4] + off[i * 3], base[i * 4 + 1] + off[i * 3 + 1], base[i * 4 + 2] + off[i * 3 + 2])
        this.o.rotation.set(0, 0, 0)
        this.o.scale.set(sz, sz, sz)
        this.o.updateMatrix()
        mesh.setMatrixAt(i, this.o.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    }
    if (this.voxels && this.voxBase && this.voxOff && this.touch) placeAll(this.voxels, this.voxBase, this.voxOff)
    if (this.field) placeAll(this.field.mesh, this.field.base, this.field.off)

    // No selection tint on the clay: the brand colours (the ink above all) must read the same
    // on every part. The selected part shows in the Layers panel instead.

    // Rain
    if (this.rain) {
      for (let i = 0; i < this.rain.count; i++) {
        const sz = 0.18 + hash(i * 7.3 + 1) * 0.16
        const speed = 1 + Math.floor(hash(i * 3.1 + 2) * 2)
        const fall = (hash(i * 1.7 + 3) + ph * speed) % 1
        // keep a clear lane over the K (|x| < 2.6): the drops fall at its sides and behind it
        const side = hash(i + d.fx.seed) < 0.5 ? -1 : 1
        const x = side * (2.6 + hash(i * 2.9 + d.fx.seed) * 2.2)
        this.o.position.set(x, 9 - fall * 9 + sz / 2, (hash(i * 5.3 + 4) - 0.5) * 8)
        this.o.rotation.set(fall * 3, fall * 2, 0)
        this.o.scale.setScalar(sz)
        this.o.updateMatrix()
        this.rain.setMatrixAt(i, this.o.matrix)
      }
      this.rain.instanceMatrix.needsUpdate = true
    }

    // Post: bloom (glow, pulse) and the FX pass (pixel, glitch, grain, scanlines, scan band)
    let glow = d.fx.glow
    if (has('pulse')) glow = (glow || 0.6) * (0.3 + 0.7 * (0.5 - 0.5 * Math.cos(TAU * ph)))
    const neon = d.form === 'vector' && ((d.body.visible && d.body.line) || (d.head.visible && d.head.line))
    this.bloom.strength = neon ? Math.max(0.55, glow * 1.3) : glow * 0.75
    let glitch = d.fx.glitch
    let seed = d.fx.seed % 997
    if (has('glitch')) {
      const step = Math.floor(ph * 12)
      seed += step * 13
      glitch = hash(step + d.fx.seed) > 0.5 ? Math.max(glitch, 0.4) : glitch * 0.25
    }
    const u = this.fxPass.uniforms
    // at most ~3 pixels across a head block, so the K keeps its shape
    u.uPixel.value = d.fx.pixel > 0 ? Math.max(2, (this.size / 100) * (1 + d.fx.pixel * 2.6)) : 0
    u.uGlitch.value = glitch
    u.uGrain.value = d.fx.grain
    u.uScan.value = d.fx.scan
    u.uBand.value = has('scan') ? 1 - (ph * 1.12 - 0.06) : -1
    u.uSeed.value = seed

    this.bloom.enabled = this.bloom.strength > 0.001
    this.fxPass.enabled = u.uPixel.value > 0 || glitch > 0 || d.fx.grain > 0 || d.fx.scan > 0 || u.uBand.value >= 0
    this.composer.render()
  }

  // Which part is under a pointer position (client coords)
  pick(clientX: number, clientY: number): Picked | 'bg' {
    const r = this.canvas.getBoundingClientRect()
    const p = new Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
    this.ray.setFromCamera(p, this.camera)
    const hits = this.ray.intersectObjects(this.figure.children, false)
    for (const h of hits) {
      const part = h.object.userData.part as Picked | undefined
      if (part) return part
    }
    return 'bg'
  }

  toBlob(type = 'image/png'): Promise<Blob> {
    return new Promise((res, rej) => this.canvas.toBlob(b => (b ? res(b) : rej(new Error('Export failed.'))), type))
  }

  // The figure as a binary glTF (GLB): bars, head cubes or voxels with their colours
  async exportGLB(d: KDesign): Promise<Blob> {
    await this.prepare(d)
    this.render(d, 0)
    const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
    const out = new Group()
    out.name = d.name || 'K'
    this.figure.updateMatrixWorld(true)
    for (const child of this.figure.children) {
      const c = child.clone()
      c.matrixAutoUpdate = false
      c.matrix.copy(child.matrix)
      out.add(c)
    }
    const data = await new GLTFExporter().parseAsync(out, { binary: true })
    return new Blob([data as ArrayBuffer], { type: 'model/gltf-binary' })
  }

  dispose() {
    this.clearBuild()
    this.floor.material.map?.dispose()
    this.floor.geometry.dispose()
    this.floor.material.dispose()
    this.catcher.geometry.dispose()
    this.catcher.material.dispose()
    this.scene.environment?.dispose()
    this.composer.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }
}

// One offscreen renderer for thumbnails and exports (browsers cap the number of WebGL contexts)
let shared: KRenderer | null = null
let queue: Promise<unknown> = Promise.resolve()
export function withShared<T>(fn: (r: KRenderer) => Promise<T> | T): Promise<T> {
  const run = queue.then(() => fn((shared ??= new KRenderer())))
  queue = run.catch(() => undefined)
  return run
}

const thumbCache = new Map<string, string>()
export function renderThumb(d: KDesign, size: number): Promise<string> {
  const key = size + JSON.stringify(d)
  const hit = thumbCache.get(key)
  if (hit) return Promise.resolve(hit)
  return withShared(async r => {
    await r.prepare(d)
    r.setSize(size)
    r.render(d, 0)
    const url = r.canvas.toDataURL('image/png')
    if (thumbCache.size > 80) thumbCache.clear()
    thumbCache.set(key, url)
    return url
  })
}

export type { Material }
