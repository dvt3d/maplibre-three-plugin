import * as THREE from 'three'
import { BufferAttribute, BufferGeometry } from 'three'

const sortWorker = function (self) {
  let matrices = undefined

  const sortSplats = function sortSplats(threshold, matrices, view) {
    const vertexCount = matrices.length / 4
    let maxDepth = -Infinity
    let minDepth = Infinity
    let depthList = new Float32Array(vertexCount)
    let sizeList = new Int32Array(depthList.buffer)
    let validIndexList = new Int32Array(vertexCount)
    let validCount = 0
    for (let i = 0; i < vertexCount; i++) {
      // Sign of depth is reversed
      let depth =
        view[0] * matrices[i * 4 + 0] +
        view[1] * matrices[i * 4 + 1] +
        view[2] * matrices[i * 4 + 2] +
        view[3]

      // Skip behind of camera and small, transparent splat
      if (depth < 0 && matrices[i * 4 + 3] > threshold * depth) {
        depthList[validCount] = depth
        validIndexList[validCount] = i
        validCount++
        if (depth > maxDepth) maxDepth = depth
        if (depth < minDepth) minDepth = depth
      }
    }

    let depthInv = (256 * 256 - 1) / (maxDepth - minDepth)
    let counts = new Uint32Array(256 * 256)
    for (let i = 0; i < validCount; i++) {
      sizeList[i] = ((depthList[i] - minDepth) * depthInv) | 0
      counts[sizeList[i]]++
    }
    let starts = new Uint32Array(256 * 256)
    for (let i = 1; i < 256 * 256; i++)
      starts[i] = starts[i - 1] + counts[i - 1]
    let depthIndex = new Uint32Array(validCount)
    for (let i = 0; i < validCount; i++)
      depthIndex[starts[sizeList[i]]++] = validIndexList[i]

    return depthIndex
  }

  self.onmessage = (e) => {
    if (e.data.method == 'clear') {
      matrices = undefined
    }
    if (e.data.method == 'push') {
      const new_matrices = new Float32Array(e.data.matrices)
      if (matrices === undefined) {
        matrices = new_matrices
      } else {
        let resized = new Float32Array(matrices.length + new_matrices.length)
        resized.set(matrices)
        resized.set(new_matrices, matrices.length)
        matrices = resized
      }
    }
    if (e.data.method == 'sort') {
      if (matrices === undefined) {
        const sortedIndexes = new Uint32Array(1)
        self.postMessage({ sortedIndexes }, [sortedIndexes.buffer])
      } else {
        const view = new Float32Array(e.data.view)
        const sortedIndexes = sortSplats(
          e.data.threshold || -0.000001,
          matrices,
          view
        )
        self.postMessage({ sortedIndexes }, [sortedIndexes.buffer])
      }
    }
  }
}
const worker = new Worker(
  URL.createObjectURL(
    new Blob(['(', sortWorker.toString(), ')(self)'], {
      type: 'application/javascript',
    })
  )
)

const rowLength = 3 * 4 + 3 * 4 + 4 + 4

const SplatLoader = {
  initGL: async function (numVertexes) {
    this.object.frustumCulled = false

    let gl = this.renderer.getContext()
    let mexTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
    this.maxVertexes = mexTextureSize * mexTextureSize

    if (numVertexes > this.maxVertexes) {
      console.warn('numVertexes limited to ', this.maxVertexes, numVertexes)
      numVertexes = this.maxVertexes
    }
    this.bufferTextureWidth = mexTextureSize
    this.bufferTextureHeight =
      Math.floor((numVertexes - 1) / mexTextureSize) + 1
    this.centerAndScaleData = new Float32Array(
      this.bufferTextureWidth * this.bufferTextureHeight * 4
    )
    this.covAndColorData = new Uint32Array(
      this.bufferTextureWidth * this.bufferTextureHeight * 4
    )
    this.centerAndScaleTexture = new THREE.DataTexture(
      this.centerAndScaleData,
      this.bufferTextureWidth,
      this.bufferTextureHeight,
      THREE.RGBAFormat,
      THREE.FloatType
    )
    this.centerAndScaleTexture.needsUpdate = true
    this.covAndColorTexture = new THREE.DataTexture(
      this.covAndColorData,
      this.bufferTextureWidth,
      this.bufferTextureHeight,
      THREE.RGBAIntegerFormat,
      THREE.UnsignedIntType
    )
    this.covAndColorTexture.internalFormat = 'RGBA32UI'
    this.covAndColorTexture.needsUpdate = true

    let splatIndexArray = new Uint32Array(
      this.bufferTextureWidth * this.bufferTextureHeight
    )
    const splatIndexes = new THREE.InstancedBufferAttribute(
      splatIndexArray,
      1,
      false
    )
    splatIndexes.setUsage(THREE.DynamicDrawUsage)
    const baseGeometry = new BufferGeometry()
    const positions = new BufferAttribute(
      new Float32Array([
        -2.0, -2.0, 0.0, 2.0, 2.0, 0.0, -2.0, 2.0, 0.0, 2.0, -2.0, 0.0, 2.0,
        2.0, 0.0, -2.0, -2.0, 0.0,
      ]),
      3
    )
    baseGeometry.setAttribute('position', positions)
    const geometry = new THREE.InstancedBufferGeometry().copy(baseGeometry)
    geometry.setAttribute('splatIndex', splatIndexes)
    geometry.instanceCount = 1

    const material = new THREE.ShaderMaterial({
      uniforms: {
        viewport: { value: new Float32Array([1980, 1080]) }, // Dummy. will be overwritten
        focal: { value: 1000.0 }, // Dummy. will be overwritten
        centerAndScaleTexture: { value: this.centerAndScaleTexture },
        covAndColorTexture: { value: this.covAndColorTexture },
        gsProjectionMatrix: { value: null },
        gsModelViewMatrix: { value: null },
      },
      vertexShader: `
				precision highp sampler2D;
				precision highp usampler2D;

				out vec4 vColor;
				out vec2 vPosition;
				uniform vec2 viewport;
				uniform float focal;
				uniform mat4 gsProjectionMatrix;
				uniform mat4 gsModelViewMatrix;

				attribute uint splatIndex;
				uniform sampler2D centerAndScaleTexture;
				uniform usampler2D covAndColorTexture;

				vec2 unpackInt16(in uint value) {
					int v = int(value);
					int v0 = v >> 16;
					int v1 = (v & 0xFFFF);
					if((v & 0x8000) != 0)
						v1 |= 0xFFFF0000;
					return vec2(float(v1), float(v0));
				}

				void main () {
					ivec2 texSize = textureSize(centerAndScaleTexture, 0);
					ivec2 texPos = ivec2(splatIndex%uint(texSize.x), splatIndex/uint(texSize.x));
					vec4 centerAndScaleData = texelFetch(centerAndScaleTexture, texPos, 0);

					vec4 center = vec4(centerAndScaleData.xyz, 1);
					vec4 camspace = gsModelViewMatrix * center;
					vec4 pos2d = gsProjectionMatrix * camspace;

					float bounds = 1.2 * pos2d.w;
					if (pos2d.z < -pos2d.w || pos2d.x < -bounds || pos2d.x > bounds
						|| pos2d.y < -bounds || pos2d.y > bounds) {
						gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
						return;
					}

					uvec4 covAndColorData = texelFetch(covAndColorTexture, texPos, 0);
					vec2 cov3D_M11_M12 = unpackInt16(covAndColorData.x) * centerAndScaleData.w;
					vec2 cov3D_M13_M22 = unpackInt16(covAndColorData.y) * centerAndScaleData.w;
					vec2 cov3D_M23_M33 = unpackInt16(covAndColorData.z) * centerAndScaleData.w;
					mat3 Vrk = mat3(
						cov3D_M11_M12.x, cov3D_M11_M12.y, cov3D_M13_M22.x,
						cov3D_M11_M12.y, cov3D_M13_M22.y, cov3D_M23_M33.x,
						cov3D_M13_M22.x, cov3D_M23_M33.x, cov3D_M23_M33.y
					);

					mat3 J = mat3(
						focal / camspace.z, 0., -(focal * camspace.x) / (camspace.z * camspace.z), 
						0., -focal / camspace.z, (focal * camspace.y) / (camspace.z * camspace.z), 
						0., 0., 0.
					);

					mat3 W = transpose(mat3(gsModelViewMatrix));
					mat3 T = W * J;
					mat3 cov = transpose(T) * Vrk * T;

					vec2 vCenter = vec2(pos2d) / pos2d.w;

					float diagonal1 = cov[0][0] + 0.3;
					float offDiagonal = cov[0][1];
					float diagonal2 = cov[1][1] + 0.3;

					float mid = 0.5 * (diagonal1 + diagonal2);
					float radius = length(vec2((diagonal1 - diagonal2) / 2.0, offDiagonal));
					float lambda1 = mid + radius;
					float lambda2 = max(mid - radius, 0.1);
					vec2 diagonalVector = normalize(vec2(offDiagonal, lambda1 - diagonal1));
					vec2 v1 = min(sqrt(2.0 * lambda1), 1024.0) * diagonalVector;
					vec2 v2 = min(sqrt(2.0 * lambda2), 1024.0) * vec2(diagonalVector.y, -diagonalVector.x);

					uint colorUint = covAndColorData.w;
					vColor = vec4(
						float(colorUint & uint(0xFF)) / 255.0,
						float((colorUint >> uint(8)) & uint(0xFF)) / 255.0,
						float((colorUint >> uint(16)) & uint(0xFF)) / 255.0,
						float(colorUint >> uint(24)) / 255.0
					);
					vPosition = position.xy;

					gl_Position = vec4(
						vCenter 
							+ position.x * v2 / viewport * 2.0 
							+ position.y * v1 / viewport * 2.0, pos2d.z / pos2d.w, 1.0);
				}
				`,
      fragmentShader: `
				in vec4 vColor;
				in vec2 vPosition;

				void main () {
					float A = -dot(vPosition, vPosition);
					if (A < -4.0) discard;
					float B = exp(A) * vColor.a;
					gl_FragColor = vec4(vColor.rgb, B);
				}
			`,
      blending: THREE.CustomBlending,
      blendSrcAlpha: THREE.OneFactor,
      depthTest: true,
      depthWrite: false,
      transparent: true,
    })

    material.onBeforeRender = (
      renderer,
      scene,
      camera,
      geometry,
      object,
      group
    ) => {
      let material = object.material
      let projectionMatrix = this.getProjectionMatrix(camera)
      material.uniforms.gsProjectionMatrix.value = projectionMatrix
      material.uniforms.gsModelViewMatrix.value =
        this.getModelViewMatrix(camera)
      let viewport = new THREE.Vector4()
      renderer.getCurrentViewport(viewport)
      const focal = (viewport.w / 2.0) * Math.abs(projectionMatrix.elements[5])
      material.uniforms.viewport.value[0] = viewport.z
      material.uniforms.viewport.value[1] = viewport.w
      material.uniforms.focal.value = focal
    }

    const mesh = new THREE.Mesh(geometry, material)
    mesh.frustumCulled = false
    this.object.add(mesh)

    worker.onmessage = (e) => {
      let indexes = new Uint32Array(e.data.sortedIndexes)
      mesh.geometry.attributes.splatIndex.set(indexes)
      mesh.geometry.attributes.splatIndex.needsUpdate = true
      mesh.geometry.instanceCount = indexes.length
      this.isSortting = false
    }
    this.isSortting = false
  },

  load: function (src, object, renderer, camera) {
    this.camera = camera
    this.object = object
    this.renderer = renderer
    this.loadedVertexCount = 0

    fetch(src).then(async (res) => {
      worker.postMessage({ method: 'clear' })
      const reader = res.body.getReader()
      const totalBytes = parseInt(res.headers.get('Content-Length') || 0)
      if (totalBytes) {
        let numVertexes = Math.floor(totalBytes / rowLength)
        await this.initGL(numVertexes)
      }
      let leftover = new Uint8Array(0) // 存残余字节
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          const { value, done } = await reader.read()
          if (done) {
            break
          }
          // 存储上一次多余的字节和这一次读取到字节
          const buffer = new Uint8Array(leftover.length + value.length)
          buffer.set(leftover, 0)
          buffer.set(value, leftover.length)
          // 计算出合并的高斯数量
          const vertexCount = Math.floor(buffer.length / rowLength)
          if (vertexCount) {
            const vertexBytes = vertexCount * rowLength
            const vertexData = buffer.subarray(0, vertexBytes) // 保证处理的数据为 N * rowLength
            this.pushDataBuffer(vertexData.buffer, vertexCount)
          }
          // 更新leftover，存储多出来的数字节，字节长度可能不足 rowLength，需要存储下来，用于下一次计算
          leftover = buffer.subarray(
            buffer.length - (buffer.length % rowLength)
          )
        } catch (error) {
          console.error(error)
          break
        }
      }
      if (leftover.length) {
        const vertexCount = Math.floor(leftover.length / rowLength)
        if (vertexCount) {
          this.pushDataBuffer(leftover.buffer, vertexCount)
        }
      }
    })
  },

  pushDataBuffer: function (buffer, vertexCount) {
    if (this.loadedVertexCount + vertexCount > this.maxVertexes) {
      console.log('vertexCount limited to ', this.maxVertexes, vertexCount)
      vertexCount = this.maxVertexes - this.loadedVertexCount
    }
    if (vertexCount <= 0) {
      return
    }

    let u_buffer = new Uint8Array(buffer)
    let f_buffer = new Float32Array(buffer)
    let matrices = new Float32Array(vertexCount * 4)

    const covAndColorData_uint8 = new Uint8Array(this.covAndColorData.buffer)

    const covAndColorData_int16 = new Int16Array(this.covAndColorData.buffer)

    for (let i = 0; i < vertexCount; i++) {
      let quat = new THREE.Quaternion(
        (u_buffer[32 * i + 28 + 1] - 128) / 128.0,
        (u_buffer[32 * i + 28 + 2] - 128) / 128.0,
        -(u_buffer[32 * i + 28 + 3] - 128) / 128.0,
        (u_buffer[32 * i + 28 + 0] - 128) / 128.0
      )
      let center = new THREE.Vector3(
        f_buffer[8 * i + 0],
        f_buffer[8 * i + 1],
        -f_buffer[8 * i + 2]
      )
      let scale = new THREE.Vector3(
        f_buffer[8 * i + 3 + 0],
        f_buffer[8 * i + 3 + 1],
        f_buffer[8 * i + 3 + 2]
      )

      let mtx = new THREE.Matrix4()
      mtx.makeRotationFromQuaternion(quat)
      mtx.transpose()
      mtx.scale(scale)
      let mtx_t = mtx.clone()
      mtx.transpose()
      mtx.premultiply(mtx_t)
      mtx.setPosition(center)

      let cov_indexes = [0, 1, 2, 5, 6, 10]
      let max_value = 0.0
      for (let j = 0; j < cov_indexes.length; j++) {
        if (Math.abs(mtx.elements[cov_indexes[j]]) > max_value) {
          max_value = Math.abs(mtx.elements[cov_indexes[j]])
        }
      }

      let destOffset = this.loadedVertexCount * 4 + i * 4
      this.centerAndScaleData[destOffset + 0] = center.x
      this.centerAndScaleData[destOffset + 1] = center.y
      this.centerAndScaleData[destOffset + 2] = center.z
      this.centerAndScaleData[destOffset + 3] = max_value / 32767.0

      destOffset = this.loadedVertexCount * 8 + i * 4 * 2
      for (let j = 0; j < cov_indexes.length; j++) {
        covAndColorData_int16[destOffset + j] = parseInt(
          (mtx.elements[cov_indexes[j]] * 32767.0) / max_value
        )
      }

      // RGBA
      destOffset = this.loadedVertexCount * 16 + (i * 4 + 3) * 4
      covAndColorData_uint8[destOffset + 0] = u_buffer[32 * i + 24 + 0]
      covAndColorData_uint8[destOffset + 1] = u_buffer[32 * i + 24 + 1]
      covAndColorData_uint8[destOffset + 2] = u_buffer[32 * i + 24 + 2]
      covAndColorData_uint8[destOffset + 3] = u_buffer[32 * i + 24 + 3]

      // Store scale and transparent to remove splat in sorting process
      matrices[i * 4 + 0] = mtx.elements[12]
      matrices[i * 4 + 1] = mtx.elements[13]
      matrices[i * 4 + 2] = mtx.elements[14]
      matrices[i * 4 + 3] =
        (Math.max(scale.x, scale.y, scale.z) * u_buffer[32 * i + 24 + 3]) /
        255.0
    }

    while (vertexCount > 0) {
      const xOffset = this.loadedVertexCount % this.bufferTextureWidth
      const yOffset = Math.floor(
        this.loadedVertexCount / this.bufferTextureWidth
      )

      // 每次填充的最大宽度
      const maxWidth = this.bufferTextureWidth - xOffset
      // 这一行能放多少个顶点
      const width = Math.min(vertexCount, maxWidth)
      // 如果剩余顶点超过一行，就填满一行，否则只填剩余顶点
      const height = Math.ceil(width / this.bufferTextureWidth) || 1

      const pixelsToWrite = width * height

      const dstOffset = (yOffset * this.bufferTextureWidth + xOffset) * 4
      const srcOffset = this.loadedVertexCount * 4
      const copyLength = pixelsToWrite * 4

      this.centerAndScaleTexture.image.data.set(
        this.centerAndScaleData.subarray(srcOffset, srcOffset + copyLength),
        dstOffset
      )

      this.covAndColorTexture.image.data.set(
        this.covAndColorData.subarray(srcOffset, srcOffset + copyLength),
        dstOffset
      )

      this.loadedVertexCount += pixelsToWrite
      vertexCount -= pixelsToWrite
    }

    this.centerAndScaleTexture.needsUpdate = true
    this.covAndColorTexture.needsUpdate = true

    worker.postMessage(
      {
        method: 'push',
        matrices: matrices.buffer,
      },
      [matrices.buffer]
    )
  },

  tick: function () {
    if (!this.isSortting) {
      let camera_mtx = this.getModelViewMatrix().elements
      let view = new Float32Array([
        camera_mtx[2],
        camera_mtx[6],
        camera_mtx[10],
        camera_mtx[14],
      ])
      worker.postMessage(
        {
          method: 'sort',
          view: view.buffer,
        },
        [view.buffer]
      )
      this.isSortting = true
    }
  },

  getProjectionMatrix: function (camera) {
    if (!camera) {
      camera = this.camera
    }
    let mtx = camera.projectionMatrix.clone()
    mtx.elements[4] *= -1
    mtx.elements[5] *= -1
    mtx.elements[6] *= -1
    mtx.elements[7] *= -1
    return mtx
  },

  getModelViewMatrix: function (camera) {
    if (!camera) {
      camera = this.camera
    }
    const viewMatrix = camera.matrixWorld.clone()
    viewMatrix.elements[1] *= -1.0
    viewMatrix.elements[4] *= -1.0
    viewMatrix.elements[6] *= -1.0
    viewMatrix.elements[9] *= -1.0
    viewMatrix.elements[13] *= -1.0
    const mtx = this.object.matrixWorld.clone()
    mtx.invert()
    mtx.elements[1] *= -1.0
    mtx.elements[4] *= -1.0
    mtx.elements[6] *= -1.0
    mtx.elements[9] *= -1.0
    mtx.elements[13] *= -1.0
    mtx.multiply(viewMatrix)
    mtx.invert()
    return mtx
  },
}

export default SplatLoader
