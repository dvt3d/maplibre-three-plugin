let wasm;

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let WASM_VECTOR_LEN = 0;

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedFloat32ArrayMemory0 = null;

function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getFloat32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

let cachedUint32ArrayMemory0 = null;

function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getUint32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}
/**
 * 从二进制 buffer（u8 + f32 混合布局）批量生成：centerScale、cov+color、positions
 * - u8buf: 原始字节（包含颜色/四元数等）
 * - f32buf: 同一 buffer 的 f32 视图（包含 center/scale）
 * - vertex_count: N
 * - out_center_scale: N*4 f32
 * - out_cov_color:   N*4 u32（3个协方差打包 + 1个RGBA）
 * - out_positions:   N*4 f32
 * @param {Uint8Array} u8buf
 * @param {Float32Array} f32buf
 * @param {number} vertex_count
 * @param {Float32Array} out_center_scale
 * @param {Uint32Array} out_cov_color
 * @param {Float32Array} out_positions
 */
export function process_splats_from_buffer(u8buf, f32buf, vertex_count, out_center_scale, out_cov_color, out_positions) {
    const ptr0 = passArray8ToWasm0(u8buf, wasm.__wbindgen_export_0);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF32ToWasm0(f32buf, wasm.__wbindgen_export_0);
    const len1 = WASM_VECTOR_LEN;
    var ptr2 = passArrayF32ToWasm0(out_center_scale, wasm.__wbindgen_export_0);
    var len2 = WASM_VECTOR_LEN;
    var ptr3 = passArray32ToWasm0(out_cov_color, wasm.__wbindgen_export_0);
    var len3 = WASM_VECTOR_LEN;
    var ptr4 = passArrayF32ToWasm0(out_positions, wasm.__wbindgen_export_0);
    var len4 = WASM_VECTOR_LEN;
    wasm.process_splats_from_buffer(ptr0, len0, ptr1, len1, vertex_count, ptr2, len2, addHeapObject(out_center_scale), ptr3, len3, addHeapObject(out_cov_color), ptr4, len4, addHeapObject(out_positions));
}

/**
 * 从 Three.js geometry attributes 批量生成（颜色输入为 u8：Uint8Array）
 * - positions: Float32Array(N*3)
 * - scales:    Float32Array(N*3)
 * - rotations: Float32Array(N*4)  (qx, qy, qz, qw)
 * - colors:    Uint8Array(N*4)    (r, g, b, a)  ← 注意这里是 u8！
 * @param {Float32Array} positions
 * @param {Float32Array} scales
 * @param {Float32Array} rotations
 * @param {Uint8Array} colors
 * @param {number} vertex_count
 * @param {Float32Array} out_center_scale
 * @param {Uint32Array} out_cov_color
 * @param {Float32Array} out_positions
 */
export function process_splats_from_geometry(positions, scales, rotations, colors, vertex_count, out_center_scale, out_cov_color, out_positions) {
    const ptr0 = passArrayF32ToWasm0(positions, wasm.__wbindgen_export_0);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF32ToWasm0(scales, wasm.__wbindgen_export_0);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passArrayF32ToWasm0(rotations, wasm.__wbindgen_export_0);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passArray8ToWasm0(colors, wasm.__wbindgen_export_0);
    const len3 = WASM_VECTOR_LEN;
    var ptr4 = passArrayF32ToWasm0(out_center_scale, wasm.__wbindgen_export_0);
    var len4 = WASM_VECTOR_LEN;
    var ptr5 = passArray32ToWasm0(out_cov_color, wasm.__wbindgen_export_0);
    var len5 = WASM_VECTOR_LEN;
    var ptr6 = passArrayF32ToWasm0(out_positions, wasm.__wbindgen_export_0);
    var len6 = WASM_VECTOR_LEN;
    wasm.process_splats_from_geometry(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, vertex_count, ptr4, len4, addHeapObject(out_center_scale), ptr5, len5, addHeapObject(out_cov_color), ptr6, len6, addHeapObject(out_positions));
}

/**
 * 从 SPZ 数据批量生成（与您的 JS 调用签名匹配）
 * - positions: Float32Array(N*3)
 * - scales:    Float32Array(N*3)
 * - rotations: Float32Array(N*4)  (qx,qy,qz,qw)
 * - colors:    Float32Array(N*3)  (r,g,b) ；支持 [0,1] 或 [0,255]
 * - alphas:    Float32Array(N)    支持 [0,1] 或 [0,255]
 * @param {Float32Array} positions
 * @param {Float32Array} scales
 * @param {Float32Array} rotations
 * @param {Float32Array} colors
 * @param {Float32Array} alphas
 * @param {number} vertex_count
 * @param {Float32Array} out_center_scale
 * @param {Uint32Array} out_cov_color
 * @param {Float32Array} out_positions
 */
export function process_splats_from_spz(positions, scales, rotations, colors, alphas, vertex_count, out_center_scale, out_cov_color, out_positions) {
    const ptr0 = passArrayF32ToWasm0(positions, wasm.__wbindgen_export_0);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF32ToWasm0(scales, wasm.__wbindgen_export_0);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passArrayF32ToWasm0(rotations, wasm.__wbindgen_export_0);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passArrayF32ToWasm0(colors, wasm.__wbindgen_export_0);
    const len3 = WASM_VECTOR_LEN;
    const ptr4 = passArrayF32ToWasm0(alphas, wasm.__wbindgen_export_0);
    const len4 = WASM_VECTOR_LEN;
    var ptr5 = passArrayF32ToWasm0(out_center_scale, wasm.__wbindgen_export_0);
    var len5 = WASM_VECTOR_LEN;
    var ptr6 = passArray32ToWasm0(out_cov_color, wasm.__wbindgen_export_0);
    var len6 = WASM_VECTOR_LEN;
    var ptr7 = passArrayF32ToWasm0(out_positions, wasm.__wbindgen_export_0);
    var len7 = WASM_VECTOR_LEN;
    wasm.process_splats_from_spz(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, vertex_count, ptr5, len5, addHeapObject(out_center_scale), ptr6, len6, addHeapObject(out_cov_color), ptr7, len7, addHeapObject(out_positions));
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}
/**
 * 对可见且通过阈值的 splat 进行深度排序（稳定计数排序）
 * 输入：
 * - positions: Float32Array(N*4)  — 由上面 process_* 生成的 [x,y,z,sizePacked]
 * - view:      Float32Array(至少4) — [v0, v1, v2, v3], depth = dot(view, [x,y,z,1])
 * - threshold: 与前端一致，常用 -0.0001
 * 输出：Uint32Array（Rust 侧 Vec<u32>），长度 = 有效可见 splat 数；元素为原索引
 * @param {Float32Array} positions
 * @param {Float32Array} view
 * @param {number} threshold
 * @returns {Uint32Array}
 */
export function sort_splats(positions, view, threshold) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF32ToWasm0(positions, wasm.__wbindgen_export_0);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(view, wasm.__wbindgen_export_0);
        const len1 = WASM_VECTOR_LEN;
        wasm.sort_splats(retptr, ptr0, len0, ptr1, len1, threshold);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v3 = getArrayU32FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export_1(r0, r1 * 4, 4);
        return v3;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_copy_to_typed_array = function(arg0, arg1, arg2) {
        new Uint8Array(getObject(arg2).buffer, getObject(arg2).byteOffset, getObject(arg2).byteLength).set(getArrayU8FromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedFloat32ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;



    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('wasm_splats_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
