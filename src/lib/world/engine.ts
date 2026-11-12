// The 3D world: a warm yellow studio floor crossed by black beams, the K4NCUN0
// figure and a pool of small blocks, all morphing from chapter to chapter as the
// visitor scrolls. Plain three.js, driven by the Experience component: it calls
// update() every frame with the scroll position measured in chapters.

import {
  CatmullRomCurve3, Color, DirectionalLight, DynamicDrawUsage, Fog, HemisphereLight, InstancedMesh,
  MathUtils, Matrix4, Mesh, MeshStandardMaterial, NeutralToneMapping, Object3D,
  PCFShadowMap, PCFSoftShadowMap, PerspectiveCamera, Plane, PlaneGeometry, PMREMGenerator, Quaternion, Raycaster,
  Scene, ShadowMaterial, Vector2, Vector3, WebGLRenderer, type BufferGeometry,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { BAR_SIZE, CELL, CUBE_SIZE, POOL_SIZE, POOLS, buildChapters, hash, type PoolKey } from './formations'
import { PALETTE } from './palette'

export const CHAPTERS = 5

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3)
const smoother = (x: number) => x * x * x * (x * (x * 6 - 15) + 10)

export interface WorldOptions {
  reducedMotion: boolean
  lowPower: boolean
}

interface Pool {
  key: PoolKey
  mesh: InstancedMesh
  n: number
  delay: Float32Array     // stagger within a transition (0 … ~0.45)
  window: number          // share of the transition each piece takes
  lift: Float32Array      // arc height when travelling
  spin: number            // how much a piece tumbles in flight
  spinAxis: Vector3[]
  push: Vector3[]         // eased pointer repulsion
  pushable: boolean
  introDelay: Float32Array
  introFrom: Vector3[]    // offset the piece falls in from
}

export class World {
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera = new PerspectiveCamera(34, 1, 0.1, 160)
  private key: DirectionalLight
  private catcher: Mesh
  private chapters = buildChapters()
  private pools: Pool[] = []
  private camCurve: CatmullRomCurve3
  private targetCurve: CatmullRomCurve3
  private w = 1
  private h = 1
  private portrait = false

  private pointer = new Vector2()
  private pointerSmooth = new Vector2()
  private pointerActive = false
  private introStart = -1
  private introDone = false
  private reduced: boolean

  // Scratch objects (no allocations in the frame loop)
  private m = new Matrix4()
  private pA = new Vector3(); private pB = new Vector3(); private p = new Vector3()
  private qA = new Quaternion(); private qB = new Quaternion(); private q = new Quaternion(); private qSpin = new Quaternion()
  private sA = new Vector3(); private sB = new Vector3(); private s = new Vector3()
  private off = new Vector3(); private back = new Vector3(); private zero2 = new Vector2()
  private col = new Color()
  private ray = new Raycaster()
  private plane = new Plane()
  private hit = new Vector3()
  private camPos = new Vector3(); private camTarget = new Vector3()
  private right = new Vector3(); private up = new Vector3(); private fwd = new Vector3()
  private shift = new Vector2()

  constructor(canvas: HTMLCanvasElement, opts: WorldOptions) {
    this.reduced = opts.reducedMotion
    const r = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    this.renderer = r
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.lowPower ? 1.3 : 1.75))
    r.shadowMap.enabled = true
    r.shadowMap.type = opts.lowPower ? PCFShadowMap : PCFSoftShadowMap
    r.toneMapping = NeutralToneMapping // keeps the brand colours true
    r.setClearColor(PALETTE.yellow)

    const scene = this.scene
    scene.background = new Color(PALETTE.yellow)
    scene.fog = new Fog(PALETTE.yellow, 28, 80)

    const pmrem = new PMREMGenerator(r)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environmentIntensity = 0.38
    pmrem.dispose()

    // Light: warm sky, yellow bounce from the floor, one soft key from the top left
    scene.add(new HemisphereLight(0xfff3d6, PALETTE.yellow, 0.85))
    const key = new DirectionalLight(0xfff8ec, 2.7)
    key.castShadow = true
    const map = 1024
    key.shadow.mapSize.set(map, map)
    Object.assign(key.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 60 })
    key.shadow.bias = -0.0004
    key.shadow.normalBias = 0.02
    scene.add(key, key.target)
    this.key = key

    // Floor: the yellow background itself; only a shadow catcher is drawn, and it
    // follows the focus (it only needs to cover the shadow frustum)
    const catcher = new Mesh(new PlaneGeometry(40, 40), new ShadowMaterial({ color: 0x5a3c00, opacity: 0.3 }))
    catcher.rotation.x = -Math.PI / 2
    catcher.position.y = 0.002
    catcher.receiveShadow = true
    scene.add(catcher)
    this.catcher = catcher

    // Beams: the diamond lattice of raised black bars from the artwork
    const ink = new MeshStandardMaterial({ color: PALETTE.ink, roughness: 0.5, metalness: 0 })
    const lines: { c: number; dir: 1 | -1 }[] = []
    for (let k = -8; k <= 4; k++) lines.push({ c: CELL / 2 + CELL * k, dir: 1 })   // x + z = c
    for (let k = -5; k <= 7; k++) lines.push({ c: CELL / 2 + CELL * k, dir: -1 })  // x - z = c
    const beams = new InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 2, 0.12), ink, lines.length)
    const o = new Object3D()
    const focus = new Vector3(0, 0, -14)
    lines.forEach(({ c, dir }, i) => {
      const p0 = dir === 1 ? new Vector3(c / 2, 0, c / 2) : new Vector3(c / 2, 0, -c / 2)
      const d = dir === 1 ? new Vector3(1, 0, -1).normalize() : new Vector3(1, 0, 1).normalize()
      const center = p0.clone().addScaledVector(d, focus.clone().sub(p0).dot(d))
      o.position.set(center.x, 0.15, center.z)
      o.rotation.set(0, dir === 1 ? Math.PI / 4 : -Math.PI / 4, 0)
      o.scale.set(120, 0.3, 0.44)
      o.updateMatrix()
      beams.setMatrixAt(i, o.matrix)
    })
    beams.castShadow = true
    beams.receiveShadow = true
    scene.add(beams)

    // Pieces: satin clay-like plastic, colour per instance
    const clay = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.52, metalness: 0 })
    const geos: Record<PoolKey, BufferGeometry> = {
      bars: new RoundedBoxGeometry(BAR_SIZE[0], BAR_SIZE[1], BAR_SIZE[2], 4, 0.1),
      cubes: new RoundedBoxGeometry(CUBE_SIZE[0], CUBE_SIZE[1], CUBE_SIZE[2], 4, 0.085),
      voxels: new RoundedBoxGeometry(1, 1, 1, 2, 0.14),
    }
    for (const key of POOLS) {
      const n = POOL_SIZE[key]
      const mesh = new InstancedMesh(geos[key], clay, n)
      mesh.instanceMatrix.setUsage(DynamicDrawUsage)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.frustumCulled = false
      for (let i = 0; i < n; i++) mesh.setColorAt(i, this.col.setHex(PALETTE.ink))
      mesh.instanceColor!.setUsage(DynamicDrawUsage)
      scene.add(mesh)

      const figure = key !== 'voxels'
      const seed = key === 'bars' ? 100 : key === 'cubes' ? 200 : 300
      const pool: Pool = {
        key, mesh, n,
        delay: new Float32Array(n),
        window: figure ? 0.78 : 0.58,
        lift: new Float32Array(n),
        spin: figure ? 0.5 : 2.4,
        spinAxis: [],
        push: [],
        pushable: !figure,
        introDelay: new Float32Array(n),
        introFrom: [],
      }
      for (let i = 0; i < n; i++) {
        const h = hash(seed + i * 1.37)
        pool.delay[i] = figure ? (key === 'bars' ? i * 0.04 : 0.06 + h * 0.14) : h * 0.42
        pool.lift[i] = figure ? 1.4 + h * 0.8 : 1.2 + hash(seed + i * 2.11) * 3.2
        pool.spinAxis.push(new Vector3(hash(seed + i + 0.3) - 0.5, hash(seed + i + 0.6) - 0.5, hash(seed + i + 0.9) - 0.5).normalize())
        pool.push.push(new Vector3())
        // Intro: the figure is placed piece by piece, from above: bars, then each row of the head
        pool.introDelay[i] = key === 'bars' ? i * 0.1 : key === 'cubes' ? 0.28 + [0, 0, 1, 1, 1, 2, 2][i] * 0.13 + (i % 2) * 0.04 : 0
        pool.introFrom.push(new Vector3((hash(seed + i * 7) - 0.5) * 1.5, 7 + hash(seed + i) * 3, (hash(seed + i * 9) - 0.5) * 1.5))
      }
      this.pools.push(pool)
    }

    this.camCurve = new CatmullRomCurve3(this.chapters.map(c => c.camPos), false, 'centripetal')
    this.targetCurve = new CatmullRomCurve3(this.chapters.map(c => c.camTarget), false, 'centripetal')
    this.camera.position.copy(this.chapters[0].camPos)
  }

  resize(w: number, h: number) {
    this.w = Math.max(1, w)
    this.h = Math.max(1, h)
    this.portrait = h > w * 1.05
    this.renderer.setSize(this.w, this.h, false)
    this.camera.aspect = this.w / this.h
    this.camera.fov = this.portrait ? 40 : 34
    this.camera.updateProjectionMatrix()
  }

  /** Compile shaders off the critical path so the first frames don't hitch. */
  async warmup() {
    try {
      await this.renderer.compileAsync(this.scene, this.camera)
    } catch {
      /* compileAsync is an optimisation only */
    }
  }

  /** Pointer in normalised device coords (-1..1). */
  setPointer(x: number, y: number, active: boolean) {
    this.pointer.set(x, y)
    this.pointerActive = active
  }

  startIntro(now: number) {
    if (this.introStart < 0) this.introStart = now
    if (this.reduced) this.introDone = true
  }

  /** s: scroll position in chapters, dt: seconds, now: seconds. */
  update(s: number, dt: number, now: number) {
    const last = CHAPTERS - 1
    s = MathUtils.clamp(s, 0, last)
    const seg = Math.min(Math.floor(s), last - 1)
    const f = s - seg
    const A = this.chapters[seg], B = this.chapters[seg + 1]
    const t = this.reduced ? 0 : now

    // Intro progress (0 = nothing placed yet, 1 = figure assembled)
    let intro = 1
    if (!this.introDone) {
      intro = this.introStart < 0 ? 0 : clamp01((now - this.introStart) / 1.9)
      if (intro >= 1) this.introDone = true
    }

    // ── Camera along the chapter path ──
    const fe = smoother(f)
    const camU = (seg + fe) / last
    this.camCurve.getPoint(camU, this.camPos)
    this.targetCurve.getPoint(camU, this.camTarget)
    if (this.portrait) {
      // Step back on tall screens so the shape fits the narrow view
      this.off.subVectors(this.camPos, this.camTarget).multiplyScalar(1.42)
      this.camPos.copy(this.camTarget).add(this.off)
    }
    if (!this.introDone) {
      // Slow settle while the figure is placed
      const k = 1 - easeOut(intro)
      this.off.subVectors(this.camPos, this.camTarget).multiplyScalar(1 + k * 0.22)
      this.camPos.copy(this.camTarget).add(this.off)
    }
    // Parallax from the pointer
    this.pointerSmooth.lerp(this.pointerActive && !this.reduced ? this.pointer : this.zero2, 1 - Math.exp(-dt * 3))
    this.fwd.subVectors(this.camTarget, this.camPos).normalize()
    this.right.crossVectors(this.fwd, this.camera.up).normalize()
    this.up.crossVectors(this.right, this.fwd)
    const dist = this.camPos.distanceTo(this.camTarget)
    this.camPos.addScaledVector(this.right, this.pointerSmooth.x * dist * 0.04)
    this.camPos.addScaledVector(this.up, this.pointerSmooth.y * dist * 0.028)
    this.camera.position.copy(this.camPos)
    this.camera.lookAt(this.camTarget)

    // Screen-space framing: shift the focus so the copy has room
    const sa = this.portrait ? A.shift.port : A.shift.land
    const sb = this.portrait ? B.shift.port : B.shift.land
    this.shift.set(MathUtils.lerp(sa[0], sb[0], fe), MathUtils.lerp(sa[1], sb[1], fe))
    this.camera.setViewOffset(this.w, this.h, -this.shift.x * this.w, this.shift.y * this.h, this.w, this.h)

    // Shadow frustum follows the focus; light from the top left as in the artwork
    this.key.position.set(this.camTarget.x - 7, 18, this.camTarget.z - 5)
    this.key.target.position.set(this.camTarget.x, 0, this.camTarget.z)
    this.key.target.updateMatrixWorld()
    this.catcher.position.set(this.camTarget.x, 0.002, this.camTarget.z)

    // Pointer hit on a plane through the focus, facing the camera
    let pointerHit = false
    if (this.pointerActive && !this.reduced && this.introDone) {
      this.ray.setFromCamera(this.pointer, this.camera)
      this.plane.setFromNormalAndCoplanarPoint(this.back.copy(this.fwd).negate(), this.camTarget)
      pointerHit = this.ray.ray.intersectPlane(this.plane, this.hit) !== null
    }

    const travel = A.center[0] !== B.center[0] || A.center[1] !== B.center[1]
    for (const pool of this.pools) {
      const PA = A.pools[pool.key], PB = B.pools[pool.key]
      const { mesh } = pool
      for (let i = 0; i < pool.n; i++) {
        const i3 = i * 3, i4 = i * 4
        const local = this.reduced ? (f < 0.5 ? 0 : 1) : easeInOut(clamp01((f - pool.delay[i]) / pool.window))

        this.pA.fromArray(PA.pos, i3); this.pB.fromArray(PB.pos, i3)
        A.idle(pool.key, i, t, this.off); this.pA.add(this.off)
        B.idle(pool.key, i, t, this.off); this.pB.add(this.off)
        this.p.lerpVectors(this.pA, this.pB, local)
        // Arc while travelling between places, a small hop otherwise
        const arc = Math.sin(Math.PI * local)
        this.p.y += arc * pool.lift[i] * (travel ? 1 : 0.22)

        this.qA.fromArray(PA.rot, i4); this.qB.fromArray(PB.rot, i4)
        this.q.slerpQuaternions(this.qA, this.qB, local)
        if (arc > 0.001 && travel) this.q.premultiply(this.qSpin.setFromAxisAngle(pool.spinAxis[i], arc * pool.spin))

        this.sA.fromArray(PA.scl, i3); this.sB.fromArray(PB.scl, i3)
        this.s.lerpVectors(this.sA, this.sB, local)

        // Pointer repulsion on the small blocks only: the figure stays intact
        if (pool.pushable) {
          const push = pool.push[i]
          this.off.set(0, 0, 0)
          if (pointerHit) {
            this.off.subVectors(this.p, this.hit)
            const d = this.off.length()
            const R = 1.9
            if (d < R && d > 1e-4) this.off.multiplyScalar((((R - d) / R) * 1.1) / d)
            else this.off.set(0, 0, 0)
          }
          push.lerp(this.off, 1 - Math.exp(-dt * 6))
          this.p.add(push)
        }

        // Intro: pieces drop into place one after the other
        if (!this.introDone) {
          const k = easeOut(clamp01((intro - pool.introDelay[i]) / 0.42))
          this.p.addScaledVector(pool.introFrom[i], 1 - k)
          this.s.multiplyScalar(k < 0.001 ? 0.0001 : 1)
          this.q.premultiply(this.qSpin.setFromAxisAngle(pool.spinAxis[i], (1 - k) * 0.8))
        }

        this.m.compose(this.p, this.q, this.s)
        mesh.setMatrixAt(i, this.m)
        this.col.setRGB(
          MathUtils.lerp(PA.col[i3], PB.col[i3], local),
          MathUtils.lerp(PA.col[i3 + 1], PB.col[i3 + 1], local),
          MathUtils.lerp(PA.col[i3 + 2], PB.col[i3 + 2], local),
        )
        mesh.setColorAt(i, this.col)
      }
      mesh.instanceMatrix.needsUpdate = true
      mesh.instanceColor!.needsUpdate = true
    }

    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.scene.traverse(obj => {
      if ((obj as InstancedMesh).isInstancedMesh) (obj as InstancedMesh).dispose()
      const mesh = obj as Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const mat = mesh.material
      if (Array.isArray(mat)) mat.forEach(m => m.dispose())
      else if (mat) mat.dispose()
    })
    this.scene.environment?.dispose()
    this.key.shadow.dispose()
    this.renderer.dispose()
  }
}

/** Returns null when WebGL is unavailable, so the page can fall back to the static logo. */
export function createWorld(canvas: HTMLCanvasElement, opts: WorldOptions): World | null {
  try {
    const probe = document.createElement('canvas')
    const gl = probe.getContext('webgl2') || probe.getContext('webgl')
    if (!gl) return null
    gl.getExtension('WEBGL_lose_context')?.loseContext() // free the probe context right away
    return new World(canvas, opts)
  } catch {
    return null
  }
}
