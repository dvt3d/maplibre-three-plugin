import Overlay from '../Overlay.js'
import Parse from '../../parse/Parse.js'
import { Mesh, Vector2, Vector3 } from 'three'

class GroupedLine extends Overlay {
  constructor(positions) {
    if (!positions || !positions.length) {
      throw 'positions length must be greater than 1'
    }
    super()
    this._positions = Parse.cleanPositions(positions)
    this._delegate = new Mesh()
    this._type = 'GroupedLine'
  }

  _intersect2d(pre, v_pre, next, v_next) {
    const denom = v_pre.clone().cross(v_next)
    if (Math.abs(denom) < 1e-6) return null
    const t = next.clone().sub(pre).cross(v_pre) / denom
    return pre.clone().add(v_pre.clone().multiplyScalar(t))
  }

  _computePositionAndIndex() {
    const { width, yOffset, miterLimit } = this._style

    const half_w = width * 0.5
    const count = this._positions.length

    const dirs = new Array(count - 1)
    const normals = new Array(count - 1)

    for (let i = 0; i < count - 1; i++) {
      const dir = new Vector2(
        this._positions[i + 1].x - this._positions[i].x,
        this._positions[i + 1].z - this._positions[i].z
      ).normalize()
      dirs[i] = dir
      normals[i] = new Vector2(-dir.y, dir.x)
    }

    const offset_point = (p, n, sign) =>
      new Vector3(
        p.x + sign * n.x * half_w,
        p.y + yOffset,
        p.z + sign * n.y * half_w
      )

    const join_point = (p, pre_dir, pre_n, current_dir, current_n, sign) => {
      const pre = new Vector2(
        p.x + sign * pre_n.x * half_w,
        p.z + sign * pre_n.y * half_w
      )
      const current = new Vector2(
        p.x + sign * current_n.x * half_w,
        p.z + sign * current_n.y * half_w
      )
      let intersect_p = this._intersect2d(
        pre,
        pre_dir.clone(),
        current,
        current_dir.clone()
      )

      if (!intersect_p) {
        const navg = pre_n
          .clone()
          .add(current_n)
          .multiplyScalar(sign)
          .normalize()
        intersect_p = new Vector2(p.x + navg.x * half_w, p.z + navg.y * half_w)
      }

      const dx = intersect_p.x - p.x
      const dz = intersect_p.y - p.z
      const dist = Math.hypot(dx, dz)
      const max_len = half_w * miterLimit
      if (dist > max_len) {
        const s = max_len / dist
        intersect_p.set(p.x + dx * s, p.z + dz * s)
      }
      return new Vector3(intersect_p.x, p.y + yOffset, intersect_p.y)
    }

    const left_side = new Array(count)
    const right_side = new Array(count)
    left_side[0] = offset_point(this._positions[0], normals[0], +1)
    right_side[0] = offset_point(this._positions[0], normals[0], -1)
    left_side[count - 1] = offset_point(
      this._positions[count - 1],
      normals[count - 2],
      +1
    )
    right_side[count - 1] = offset_point(
      this._positions[count - 1],
      normals[count - 2],
      -1
    )

    for (let i = 1; i < count - 1; i++) {
      const p = this._positions[i]
      let pre_dir = dirs[i - 1]
      let pre_n = normals[i - 1]
      let dir = dirs[i]
      let n = normals[i]
      left_side[i] = join_point(p, pre_dir, pre_n, dir, n, +1)
      right_side[i] = join_point(p, pre_dir, pre_n, dir, n, -1)
    }

    // 写入几何
    const position = new Float32Array(count * 2 * 3)
    const index = new Uint32Array((count - 1) * 6)
    for (let i = 0; i < count; i++) {
      const l = left_side[i],
        r = right_side[i]
      position.set([l.x, l.y, l.z], i * 6 + 0)
      position.set([r.x, r.y, r.z], i * 6 + 3)
    }
    let k = 0
    for (let i = 0; i < count - 1; i++) {
      const a = i * 2,
        b = a + 1,
        c = a + 3,
        d = a + 2
      index.set([a, b, c, a, c, d], k)
      k += 6
    }
  }

  setStyle(style) {}
}

export default GroupedLine
