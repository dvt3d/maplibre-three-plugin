import { unzipSync } from 'fflate'
import webpInit, { webp_decode_rgba } from '../../wasm/webp/webp.js'

const decodeMeans = (lo, hi, count) => {
  const xs = new Uint16Array(count)
  for (let i = 0; i < count; i++) {
    const o = i * 4
    xs[i] = lo[o + 0] | (hi[o + 0] << 8)
  }
  const ys = new Uint16Array(count)
  for (let i = 0; i < count; i++) {
    const o = i * 4
    ys[i] = lo[o + 1] | (hi[o + 1] << 8)
  }
  const zs = new Uint16Array(count)
  for (let i = 0; i < count; i++) {
    const o = i * 4
    zs[i] = lo[o + 2] | (hi[o + 2] << 8)
  }
  return { xs, ys, zs }
}

const invLogTransform = (v) => {
  const a = Math.abs(v)
  const e = Math.exp(a) - 1 // |x|
  return v < 0 ? -e : e
}

const unpackQuat = (px, py, pz, tag) => {
  const maxComp = tag - 252
  const a = (px / 255) * 2 - 1
  const b = (py / 255) * 2 - 1
  const c = (pz / 255) * 2 - 1
  const sqrt2 = Math.sqrt(2)
  const comps = [0, 0, 0, 0]
  const idx = [
    [1, 2, 3],
    [0, 2, 3],
    [0, 1, 3],
    [0, 1, 2],
  ][maxComp]
  comps[idx[0]] = a / sqrt2
  comps[idx[1]] = b / sqrt2
  comps[idx[2]] = c / sqrt2
  // reconstruct max component to make unit length with positive sign
  const t =
    1 -
    (comps[0] * comps[0] +
      comps[1] * comps[1] +
      comps[2] * comps[2] +
      comps[3] * comps[3])
  comps[maxComp] = Math.sqrt(Math.max(0, t))
  return comps
}

const sigmoidInv = (y) => {
  const e = Math.min(1 - 1e-6, Math.max(1e-6, y))
  return Math.log(e / (1 - e))
}

const column_names = [
  'x',
  'y',
  'z',
  'scale_0',
  'scale_1',
  'scale_2',
  'f_dc_0',
  'f_dc_1',
  'f_dc_2',
  'opacity',
  'rot_0',
  'rot_1',
  'rot_2',
  'rot_3',
]

const parseSog = async (buffer) => {
  await webpInit()
  const files = unzipSync(buffer)
  const load = (name) => {
    return files[name]
  }
  // meta.json
  const metaBytes = load('meta.json')
  const meta = JSON.parse(new TextDecoder().decode(metaBytes))

  const count = meta.count

  // Prepare output columns
  const columns = column_names.map((item) => {
    return {
      name: item,
      data: new Float32Array(count),
    }
  })
  // means: two textures means_l and means_u
  const meansLoWebp = load(meta.means.files[0])
  const meansHiWebp = load(meta.means.files[1])

  const { rgba: lo, width, height } = webp_decode_rgba(meansLoWebp)
  const { rgba: hi } = webp_decode_rgba(meansHiWebp)
  const total = width * height
  if (total < count) throw new Error('SOG means texture too small for count')

  const { mins, maxs } = meta.means
  const { xs, ys, zs } = decodeMeans(lo, hi, count)
  const xCol = columns[0].data
  const yCol = columns[1].data
  const zCol = columns[2].data
  const xMin = mins[0],
    xScale = maxs[0] - mins[0] || 1
  const yMin = mins[1],
    yScale = maxs[1] - mins[1] || 1
  const zMin = mins[2],
    zScale = maxs[2] - mins[2] || 1
  for (let i = 0; i < count; i++) {
    const lx = xMin + xScale * (xs[i] / 65535)
    const ly = yMin + yScale * (ys[i] / 65535)
    const lz = zMin + zScale * (zs[i] / 65535)
    xCol[i] = invLogTransform(lx)
    yCol[i] = invLogTransform(ly)
    zCol[i] = invLogTransform(lz)
  }

  // quats
  const quatsWebp = load(meta.quats.files[0])
  const { rgba: qr, width: qw, height: qh } = webp_decode_rgba(quatsWebp)
  if (qw * qh < count) throw new Error('SOG quats texture too small for count')
  const r0 = columns[10].data
  const r1 = columns[11].data
  const r2 = columns[12].data
  const r3 = columns[13].data
  for (let i = 0; i < count; i++) {
    const o = i * 4
    const tag = qr[o + 3]
    if (tag < 252 || tag > 255) {
      // invalid tag, default identity
      r0[i] = 0
      r1[i] = 0
      r2[i] = 0
      r3[i] = 1
      continue
    }
    const [x, y, z, wq] = unpackQuat(qr[o], qr[o + 1], qr[o + 2], tag)
    r0[i] = x
    r1[i] = y
    r2[i] = z
    r3[i] = wq
  }
  // scales: labels + codebook
  const scalesWebp = load(meta.scales.files[0])
  const { rgba: sl, width: sw, height: sh } = webp_decode_rgba(scalesWebp)
  if (sw * sh < count) throw new Error('SOG scales texture too small for count')
  const sCode = new Float32Array(meta.scales.codebook)
  for (let i = 0; i < count; i++) {
    const o = i * 4
    columns[3].data[i] = sCode[sl[o]]
    columns[4].data[i] = sCode[sl[o + 1]]
    columns[5].data[i] = sCode[sl[o + 2]]
  }
  // colors + opacity: sh0.webp encodes 3 labels + opacity byte
  const sh0Webp = load(meta.sh0.files[0])
  const { rgba: c0, width: cw, height: ch } = webp_decode_rgba(sh0Webp)
  if (cw * ch < count) throw new Error('SOG sh0 texture too small for count')
  const cCode = new Float32Array(meta.sh0.codebook)
  const SH_C0 = 0.28209479177387814
  const dc0 = columns[6].data
  const dc1 = columns[7].data
  const dc2 = columns[8].data
  const opCol = columns[9].data
  for (let i = 0; i < count; i++) {
    const o = i * 4
    dc0[i] = cCode[c0[o + 0]]
    dc1[i] = cCode[c0[o + 1]]
    dc2[i] = cCode[c0[o + 2]]
    opCol[i] = sigmoidInv(c0[o + 3] / 255)
  }
  // Note: If present, SH higher bands (shN) are reconstructed into columns below.
  // Higher-order SH (optional)
  if (meta.shN) {
    const { bands, count: paletteCount } = meta.shN
    const shCoeffs = [0, 3, 8, 15][bands]
    if (shCoeffs > 0) {
      const codebook = new Float32Array(meta.shN.codebook)
      const centroidsWebp = await load(meta.shN.files[0])
      const labelsWebp = await load(meta.shN.files[1])
      const {
        rgba: centroidsRGBA,
        width: cW,
        height: cH,
      } = webp_decode_rgba(centroidsWebp)
      const { rgba: labelsRGBA } = webp_decode_rgba(labelsWebp)

      const baseIdx = columns.length
      for (let i = 0; i < shCoeffs * 3; i++) {
        columns.push({
          name: `f_rest_${i}`,
          data: new Float32Array(count),
        })
      }
      const stride = 4
      const getCentroidPixel = (centroidIndex, coeff) => {
        const cx = (centroidIndex % 64) * shCoeffs + coeff
        const cy = Math.floor(centroidIndex / 64)
        if (cx >= cW || cy >= cH) return [0, 0, 0]
        const idx = (cy * cW + cx) * stride
        return [
          centroidsRGBA[idx],
          centroidsRGBA[idx + 1],
          centroidsRGBA[idx + 2],
        ]
      }
      for (let i = 0; i < count; i++) {
        const o = i * 4
        const label = labelsRGBA[o] | (labelsRGBA[o + 1] << 8) // 16-bit palette index
        if (label >= paletteCount) continue // safety
        for (let j = 0; j < shCoeffs; j++) {
          const [lr, lg, lb] = getCentroidPixel(label, j)
          columns[baseIdx + j + shCoeffs * 0].data[i] = codebook[lr] ?? 0
          columns[baseIdx + j + shCoeffs * 1].data[i] = codebook[lg] ?? 0
          columns[baseIdx + j + shCoeffs * 2].data[i] = codebook[lb] ?? 0
        }
      }
    }
  }
  return { count, columns }
}
export { parseSog }
