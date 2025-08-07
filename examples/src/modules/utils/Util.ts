/**
 * Utility class providing common utility functions
 * @Author: Caven
 * @Date: 2019-12-31 17:58:01
 */

const CHARS: string[]
  = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')

/**
 * Some code is borrowed from Leaflet
 * https://github.com/Leaflet/Leaflet/tree/master/src/core
 */
class Util {
  /**
   * Generates UUID
   * @param {string} [prefix] - UUID prefix
   * @returns {string} Generated UUID
   */
  static uuid(prefix: string = 'D'): string {
    const uuid: string[] = []
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-'
    uuid[14] = '4'
    let r: number
    for (let i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | (Math.random() * 16)
        uuid[i] = CHARS[i === 19 ? (r & 0x3) | 0x8 : r]
      }
    }
    return `${prefix}-${uuid.join('')}`
  }

  /**
   * Merges properties of source objects into destination object
   * @template T, U
   * @param {T} dest - Destination object
   * @param {...U[]} sources - Source objects
   * @returns {T & U} Merged object
   */
  static merge<T, U>(dest: T, ...sources: U[]): T & U {
    let i: string, j: number, len: number, src: U
    for (j = 0, len = sources.length; j < len; j++) {
      src = sources[j]
      for (i in src) {
        // eslint-disable-next-line ts/ban-ts-comment
        // @ts-expect-error
        (dest as any)[i] = src[i]
      }
    }
    return dest as T & U
  }

  /**
   * Trims string and splits on whitespace
   * @param {string} str - String to process
   * @returns {string[]} Array of parts
   */
  static splitWords(str: string): string[] {
    return this.trim(str).split(/\s+/)
  }

  /**
   * Merges options into object's options property
   * @template T
   * @param {any} obj - Object to set options for
   * @param {T} options - Options object
   * @returns {T} Merged options
   */
  static setOptions<T extends Record<string, any>>(obj: { options?: T }, options: T): T {
    if (!Object.prototype.hasOwnProperty.call(obj, 'options')) {
      obj.options = obj.options ? Object.create(obj.options) : {} as T
    }
    for (const i in options) {
      obj.options![i] = options[i]
    }
    return obj.options!
  }

  /**
   * Rounds number to specified decimal places
   * @param {number} num - Number to format
   * @param {number} [digits] - Number of decimal places
   * @returns {number} Formatted number
   */
  static formatNum(num: number, digits?: number): number {
    const pow = 10 ** (digits === undefined ? 6 : digits)
    return Math.round(num * pow) / pow
  }

  /**
   * Trims whitespace from both ends of string
   * Compatibility polyfill for String.prototype.trim
   * @param {string} str - String to trim
   * @returns {string} Trimmed string
   * @see https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
   */
  static trim(str: string): string {
    return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '')
  }

  /**
   * Data URI containing base64-encoded empty GIF image
   * Used to free memory from unused images on WebKit mobile devices
   * @returns {string} Empty GIF data URI
   */
  static emptyImageUrl(): string {
    return 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
  }

  /**
   * Checks if position object is valid
   * @param {any} position - Position object to check
   * @returns {boolean} Whether position is valid
   */
  static checkPosition(position: any): boolean {
    return (
      position !== null && typeof position === 'object'
      && Object.prototype.hasOwnProperty.call(position, '_lng')
      && Object.prototype.hasOwnProperty.call(position, '_lat')
      && Object.prototype.hasOwnProperty.call(position, '_alt')
    )
  }

  /**
   * Creates debounced function that delays execution
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  // eslint-disable-next-line ts/no-unsafe-function-type
  static debounce(fn: Function, delay: number): Function {
    let timer: number | null = null
    return function (this: any, ...args: any[]) {
      if (timer)
        clearTimeout(timer)
      timer = setTimeout(() => {
        fn.apply(this, args)
      }, delay) as unknown as number
    }
  }

  /**
   * Creates throttled function that limits execution frequency
   * @param {Function} fn - Function to throttle
   * @param {number} delay - Throttle delay in milliseconds
   * @returns {Function} Throttled function
   */
  // eslint-disable-next-line ts/no-unsafe-function-type
  static throttle(fn: Function, delay: number): Function {
    let valid = true
    return function (this: any, ...args: any[]) {
      if (!valid) {
        return false
      }
      valid = false
      setTimeout(() => {
        fn.apply(this, args)
        valid = true
      }, delay)
      return true
    }
  }

  /**
   * Converts data URL to Blob object
   * @param {string} dataUrl - Data URL
   * @returns {Blob} Converted Blob object
   */
  static dataURLtoBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',')
    const mimeMatch = arr[0].match(/:(.*?);/)
    if (!mimeMatch) {
      throw new Error('Invalid data URL format')
    }
    const mime = mimeMatch[1]
    const bStr = atob(arr[1])
    let len = bStr.length
    const u8Arr = new Uint8Array(len)
    while (len--) {
      u8Arr[len] = bStr.charCodeAt(len)
    }
    return new Blob([u8Arr], { type: mime })
  }

  /**
   * Checks if object is a Promise
   * @param {any} obj - Object to check
   * @returns {boolean} Whether object is a Promise
   */
  static isPromise(obj: any): obj is Promise<any> {
    return obj !== null && typeof obj === 'object' && typeof (obj as Promise<any>).then === 'function'
  }
}

export default Util
