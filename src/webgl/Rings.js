import * as THREE from 'three'

const RINGS = [
  { radius: 1.5, tube: 0.014, gyro: [Math.PI / 2, 0, 0], axis: [0, 1, 0.2], speed: 0.32, orbit: 0.55 },
  { radius: 1.82, tube: 0.01, gyro: [0, Math.PI / 2, 0.35], axis: [1, 0, 0.3], speed: -0.24, orbit: -0.4 },
  { radius: 2.15, tube: 0.007, gyro: [Math.PI / 3, -Math.PI / 5, 0], axis: [0.3, 0.2, 1], speed: 0.18, orbit: 0.3 },
]

const _spin = new THREE.Quaternion()
const _gyro = new THREE.Quaternion()
const _flat = new THREE.Quaternion()

/**
 * Anéis de giroscópio cromados. `align` interpola cada anel entre a sua
 * orientação de giroscópio e a orientação "de frente para a câmera".
 */
export default class Rings {
  constructor() {
    this.group = new THREE.Group()
    this.items = []

    const material = new THREE.MeshPhysicalMaterial({
      color: 0xd9dce6,
      metalness: 1,
      roughness: 0.28,
      iridescence: 0.7,
      iridescenceIOR: 1.4,
      envMapIntensity: 1,
    })

    this.satelliteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })
    const satelliteGeometry = new THREE.SphereGeometry(0.045, 16, 16)

    RINGS.forEach((config) => {
      const pivot = new THREE.Group()
      const ring = new THREE.Mesh(new THREE.TorusGeometry(config.radius, config.tube, 16, 220), material)

      const orbit = new THREE.Group()
      const satellite = new THREE.Mesh(satelliteGeometry, this.satelliteMaterial)
      satellite.position.x = config.radius
      orbit.add(satellite)

      pivot.add(ring, orbit)
      this.group.add(pivot)

      this.items.push({
        config,
        pivot,
        orbit,
        base: new THREE.Quaternion().setFromEuler(new THREE.Euler(...config.gyro)),
        axis: new THREE.Vector3(...config.axis).normalize(),
        phase: 0,
      })
    })
  }

  /**
   * @param {number} time
   * @param {object} params
   * @param {THREE.Quaternion} params.parentQuaternion orientação do grupo pai (para alinhar à câmera)
   */
  update(time, delta, { align, spread, speed, parentQuaternion, satelliteColor }) {
    _flat.copy(parentQuaternion).invert()
    this.satelliteMaterial.color.copy(satelliteColor).multiplyScalar(2.2)

    this.items.forEach((item) => {
      item.phase += delta * item.config.speed * speed

      _spin.setFromAxisAngle(item.axis, item.phase)
      _gyro.copy(item.base).premultiply(_spin)

      item.pivot.quaternion.slerpQuaternions(_gyro, _flat, align)
      item.pivot.scale.setScalar(spread)
      item.orbit.rotation.z = time * item.config.orbit * (0.6 + speed * 0.4)
    })
  }
}
