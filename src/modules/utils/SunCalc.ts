/*
 (c) 2011-2015, Vladimir Agafonkin
 SunCalc is a JavaScript library for calculating sun/moon position and light phases.
 https://github.com/mourner/suncalc
*/

const PI = Math.PI
const sin = Math.sin
const cos = Math.cos
const tan = Math.tan
const asin = Math.asin
const atan = Math.atan2
const acos = Math.acos
const rad = PI / 180

// sun calculations are based on http://aa.quae.nl/en/reken/zonpositie.html formulas

// date/time constants and conversions

const dayMs = 1000 * 60 * 60 * 24
const J1970 = 2440588
const J2000 = 2451545

/**
 * Converts a Date object to Julian date
 * @param {Date} date - The date to convert
 * @returns {number} Julian date
 */
function toJulian(date: Date): number {
  return date.valueOf() / dayMs - 0.5 + J1970
}

/**
 * Converts a Julian date to a Date object
 * @param {number} j - Julian date
 * @returns {Date} Converted date
 */
function fromJulian(j: number): Date {
  return new Date((j + 0.5 - J1970) * dayMs)
}

/**
 * Converts a Date to days since J2000 epoch
 * @param {Date} date - The date to convert
 * @returns {number} Days since J2000
 */
function toDays(date: Date): number {
  return toJulian(date) - J2000
}

// general calculations for position

const e = rad * 23.4397 // obliquity of the Earth

/**
 * Calculates right ascension
 * @param {number} l - Ecliptic longitude in radians
 * @param {number} b - Ecliptic latitude in radians
 * @returns {number} Right ascension in radians
 */
function rightAscension(l: number, b: number): number {
  return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l))
}

/**
 * Calculates declination
 * @param {number} l - Ecliptic longitude in radians
 * @param {number} b - Ecliptic latitude in radians
 * @returns {number} Declination in radians
 */
function declination(l: number, b: number): number {
  return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l))
}

/**
 * Calculates azimuth
 * @param {number} H - Hour angle in radians
 * @param {number} phi - Latitude in radians
 * @param {number} dec - Declination in radians
 * @returns {number} Azimuth in radians
 */
function azimuth(H: number, phi: number, dec: number): number {
  return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi))
}

/**
 * Calculates altitude
 * @param {number} H - Hour angle in radians
 * @param {number} phi - Latitude in radians
 * @param {number} dec - Declination in radians
 * @returns {number} Altitude in radians
 */
function altitude(H: number, phi: number, dec: number): number {
  return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H))
}

/**
 * Calculates sidereal time
 * @param {number} d - Days since J2000
 * @param {number} lw - West longitude in radians
 * @returns {number} Sidereal time in radians
 */
function siderealTime(d: number, lw: number): number {
  return rad * (280.16 + 360.9856235 * d) - lw
}

/**
 * Calculates astronomical refraction
 * @param {number} h - Altitude in radians
 * @returns {number} Refraction correction in radians
 */
function astroRefraction(h: number): number {
  if (h < 0)
    // the following formula works for positive altitudes only.
    h = 0 // if h = -0.08901179 a div/0 would occur.

  // formula 16.4 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
  // 1.02 / tan(h + 10.26 / (h + 5.10)) h in degrees, result in arc minutes -> converted to rad:
  return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179))
}

// general sun calculations

/**
 * Calculates solar mean anomaly
 * @param {number} d - Days since J2000
 * @returns {number} Solar mean anomaly in radians
 */
function solarMeanAnomaly(d: number): number {
  return rad * (357.5291 + 0.98560028 * d)
}

/**
 * Calculates ecliptic longitude
 * @param {number} M - Solar mean anomaly in radians
 * @returns {number} Ecliptic longitude in radians
 */
function eclipticLongitude(M: number): number {
  const C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)) // equation of center
  const P = rad * 102.9372 // perihelion of the Earth

  return M + C + P + PI
}

/**
 * Calculates sun coordinates
 * @param {number} d - Days since J2000
 * @returns {{dec: number, ra: number}} Sun coordinates with declination and right ascension in radians
 */
function sunCoords(d: number): { dec: number, ra: number } {
  const M = solarMeanAnomaly(d)
  const L = eclipticLongitude(M)

  return {
    dec: declination(L, 0),
    ra: rightAscension(L, 0),
  }
}

/**
 * Interface defining SunCalc methods
 */
interface ISunCalc {
  /**
   * Calculates sun position for a given date and latitude/longitude
   * @param {Date} date - The date to calculate sun position for
   * @param {number} lat - Latitude in degrees
   * @param {number} lng - Longitude in degrees
   * @returns {{azimuth: number, altitude: number}} Sun position with azimuth and altitude in radians
   */
  getPosition: (date: Date, lat: number, lng: number) => { azimuth: number, altitude: number }
  /**
   * Sun times configuration
   */
  times: Array<[number, string, string]>
  /**
   * Adds a custom time to the times config
   * @param {number} angle - The angle for the custom time
   * @param {string} riseName - Name for the rise time
   * @param {string} setName - Name for the set time
   */
  addTime: (angle: number, riseName: string, setName: string) => void
  /**
   * Calculates sun times for a given date, latitude/longitude, and observer height
   * @param {Date} date - The date to calculate sun times for
   * @param {number} lat - Latitude in degrees
   * @param {number} lng - Longitude in degrees
   * @param {number} height - Observer height in meters (default: 0)
   * @returns {Record<string, Date>} Object with sun times
   */
  getTimes: (date: Date, lat: number, lng: number, height: number) => Record<string, Date>
  /**
   * Calculates moon position for a given date and latitude/longitude
   * @param {Date} date - The date to calculate moon position for
   * @param {number} lat - Latitude in degrees
   * @param {number} lng - Longitude in degrees
   * @returns {IMoonPosition} Moon position information
   */
  getMoonPosition: (date: Date, lat: number, lng: number) => IMoonPosition
  /**
   * Calculates moon illumination parameters
   * @param {Date} date - The date to calculate moon illumination for
   * @returns {IMoonIllumination} Moon illumination information
   */
  getMoonIllumination: (date: Date) => IMoonIllumination
  /**
   * Calculates moon rise/set times
   * @param {Date} date - The date to calculate moon times for
   * @param {number} lat - Latitude in degrees
   * @param {number} lng - Longitude in degrees
   * @param {boolean} inUTC - Whether to use UTC time (default: false)
   * @returns {IMoonTimes} Moon times information
   */
  getMoonTimes: (date: Date, lat: number, lng: number, inUTC: boolean) => IMoonTimes
}

const SunCalc: ISunCalc = {} as ISunCalc

// calculates sun position for a given date and latitude/longitude

SunCalc.getPosition = function (date: Date, lat: number, lng: number): { azimuth: number, altitude: number } {
  const lw = rad * -lng
  const phi = rad * lat
  const d = toDays(date)
  const c = sunCoords(d)
  const H = siderealTime(d, lw) - c.ra

  return {
    azimuth: azimuth(H, phi, c.dec),
    altitude: altitude(H, phi, c.dec),
  }
}

// sun times configuration (angle, morning name, evening name)
const times = (SunCalc.times = [
  [-0.833, 'sunrise', 'sunset'],
  [-0.3, 'sunriseEnd', 'sunsetStart'],
  [-6, 'dawn', 'dusk'],
  [-12, 'nauticalDawn', 'nauticalDusk'],
  [-18, 'nightEnd', 'night'],
  [6, 'goldenHourEnd', 'goldenHour'],
])

// adds a custom time to the times config

SunCalc.addTime = function (angle: number, riseName: string, setName: string): void {
  times.push([angle, riseName, setName])
}

// calculations for sun times

const J0 = 0.0009

/**
 * Calculates julian cycle
 * @param {number} d - Days since J2000
 * @param {number} lw - West longitude in radians
 * @returns {number} Julian cycle
 */
function julianCycle(d: number, lw: number): number {
  return Math.round(d - J0 - lw / (2 * PI))
}

/**
 * Calculates approximate transit
 * @param {number} Ht - Hour angle in radians
 * @param {number} lw - West longitude in radians
 * @param {number} n - Julian cycle
 * @returns {number} Approximate transit
 */
function approxTransit(Ht: number, lw: number, n: number): number {
  return J0 + (Ht + lw) / (2 * PI) + n
}

/**
 * Calculates solar transit in Julian date
 * @param {number} ds - Approximate transit
 * @param {number} M - Solar mean anomaly in radians
 * @param {number} L - Ecliptic longitude in radians
 * @returns {number} Solar transit in Julian date
 */
function solarTransitJ(ds: number, M: number, L: number): number {
  return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L)
}

/**
 * Calculates hour angle
 * @param {number} h - Altitude in radians
 * @param {number} phi - Latitude in radians
 * @param {number} d - Declination in radians
 * @returns {number} Hour angle in radians
 */
function hourAngle(h: number, phi: number, d: number): number {
  return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d)))
}

/**
 * Calculates observer angle
 * @param {number} height - Observer height in meters
 * @returns {number} Observer angle in radians
 */
function observerAngle(height: number): number {
  return (-2.076 * Math.sqrt(height)) / 60
}

// returns set time for the given sun altitude
/**
 * Calculates set time for the given sun altitude
 * @param {number} h - Altitude in radians
 * @param {number} lw - West longitude in radians
 * @param {number} phi - Latitude in radians
 * @param {number} dec - Declination in radians
 * @param {number} n - Julian cycle
 * @param {number} M - Solar mean anomaly in radians
 * @param {number} L - Ecliptic longitude in radians
 * @returns {number} Set time in Julian date
 */
function getSetJ(h: number, lw: number, phi: number, dec: number, n: number, M: number, L: number): number {
  const w = hourAngle(h, phi, dec)
  const a = approxTransit(w, lw, n)
  return solarTransitJ(a, M, L)
}

// calculates sun times for a given date, latitude/longitude, and, optionally,
// the observer height (in meters) relative to the horizon

SunCalc.getTimes = function (date: Date, lat: number, lng: number, height: number = 0): Record<string, Date> {
  const lw = rad * -lng
  const phi = rad * lat
  const dh = observerAngle(height)
  const d = toDays(date)
  const n = julianCycle(d, lw)
  const ds = approxTransit(0, lw, n)
  const M = solarMeanAnomaly(ds)
  const L = eclipticLongitude(M)
  const dec = declination(L, 0)
  const Jnoon = solarTransitJ(ds, M, L)
  let i: number
  let len: number
  let time: [number, string, string]
  let h0: number
  let Jset: number
  let Jrise: number

  const result: Record<string, Date> = {
    solarNoon: fromJulian(Jnoon),
    nadir: fromJulian(Jnoon - 0.5),
  }

  for (i = 0, len = times.length; i < len; i += 1) {
    time = times[i]
    h0 = (time[0] + dh) * rad

    Jset = getSetJ(h0, lw, phi, dec, n, M, L)
    Jrise = Jnoon - (Jset - Jnoon)

    result[time[1]] = fromJulian(Jrise)
    result[time[2]] = fromJulian(Jset)
  }

  return result
}

// moon calculations, based on http://aa.quae.nl/en/reken/hemelpositie.html formulas
/**
 * Interface for moon coordinates result
 */
interface MoonCoordsResult {
  /** Right ascension in radians */
  ra: number
  /** Declination in radians */
  dec: number
  /** Distance to the moon in km */
  dist: number
}

/**
 * Calculates moon coordinates
 * @param {number} d - Days since J2000
 * @returns {MoonCoordsResult} Moon coordinates and distance
 */
function moonCoords(d: number): MoonCoordsResult {
  // geocentric ecliptic coordinates of the moon

  const L = rad * (218.316 + 13.176396 * d) // ecliptic longitude
  const M = rad * (134.963 + 13.064993 * d) // mean anomaly
  const F = rad * (93.272 + 13.22935 * d) // mean distance
  const l = L + rad * 6.289 * sin(M) // longitude
  const b = rad * 5.128 * sin(F) // latitude
  const dt = 385001 - 20905 * cos(M) // distance to the moon in km

  return {
    ra: rightAscension(l, b),
    dec: declination(l, b),
    dist: dt,
  }
}

/**
 * Interface for moon position result
 */
interface IMoonPosition {
  /** Azimuth in radians */
  azimuth: number
  /** Altitude in radians */
  altitude: number
  /** Distance to the moon in km */
  distance: number
  /** Parallactic angle in radians */
  parallacticAngle: number
}

SunCalc.getMoonPosition = function (date: Date, lat: number, lng: number): IMoonPosition {
  const lw = rad * -lng
  const phi = rad * lat
  const d = toDays(date)
  const c = moonCoords(d)
  const H = siderealTime(d, lw) - c.ra
  let h = altitude(H, phi, c.dec)
  // formula 14.1 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
  const pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H))

  h = h + astroRefraction(h) // altitude correction for refraction

  return {
    azimuth: azimuth(H, phi, c.dec),
    altitude: h,
    distance: c.dist,
    parallacticAngle: pa,
  }
}

/**
 * Interface for moon illumination result
 */
interface IMoonIllumination {
  /** Illumination fraction (0-1) */
  fraction: number
  /** Moon phase (0-1) */
  phase: number
  /** Phase angle in radians */
  angle: number
}

// calculations for illumination parameters of the moon,
// based on http://idlastro.gsfc.nasa.gov/ftp/pro/astro/mphase.pro formulas and
// Chapter 48 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.

SunCalc.getMoonIllumination = function (date: Date): IMoonIllumination {
  const d = toDays(date || new Date())
  const s = sunCoords(d)
  const m = moonCoords(d)
  const sdist = 149598000 // distance from Earth to Sun in km
  const phi = acos(
    sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra),
  )
  const inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi))
  const angle = atan(
    cos(s.dec) * sin(s.ra - m.ra),
    sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra),
  )

  return {
    fraction: (1 + cos(inc)) / 2,
    phase: 0.5 + (0.5 * inc * (angle < 0 ? -1 : 1)) / Math.PI,
    angle,
  }
}

/**
 * Calculates a date that is a specified number of hours later than the given date
 * @param {Date} date - The base date
 * @param {number} h - Number of hours to add
 * @returns {Date} New date with hours added
 */
function hoursLater(date: Date, h: number): Date {
  return new Date(date.valueOf() + (h * dayMs) / 24)
}

// calculations for moon rise/set times are based on http://www.stargazing.net/kepler/moonrise.html article
/**
 * Interface for moon times result
 */
interface IMoonTimes {
  /** Moon rise time */
  rise: Date
  /** Moon set time */
  set: Date
  /** Whether the moon is always up */
  alwaysUp?: boolean
  /** Whether the moon is always down */
  alwaysDown?: boolean
}

SunCalc.getMoonTimes = function (date: Date, lat: number, lng: number, inUTC: boolean = false): IMoonTimes {
  const t = new Date(date)
  if (inUTC)
    t.setUTCHours(0, 0, 0, 0)
  else t.setHours(0, 0, 0, 0)

  const hc = 0.133 * rad
  let h0 = SunCalc.getMoonPosition(t, lat, lng).altitude - hc
  let h1!: number
  let h2!: number
  let rise!: number
  let set!: number
  let a!: number
  let b!: number
  let xe!: number
  let ye!: number
  let d!: number
  let roots!: number
  let x1!: number
  let x2!: number
  let dx!: number

  // go in 2-hour chunks, each time seeing if a 3-point quadratic curve crosses zero (which means rise or set)
  for (let i = 1; i <= 24; i += 2) {
    h1 = SunCalc.getMoonPosition(hoursLater(t, i), lat, lng).altitude - hc
    h2 = SunCalc.getMoonPosition(hoursLater(t, i + 1), lat, lng).altitude - hc

    a = (h0 + h2) / 2 - h1
    b = (h2 - h0) / 2
    xe = -b / (2 * a)
    ye = (a * xe + b) * xe + h1
    d = b * b - 4 * a * h1
    roots = 0

    if (d >= 0) {
      dx = Math.sqrt(d) / (Math.abs(a) * 2)
      x1 = xe - dx
      x2 = xe + dx
      if (Math.abs(x1) <= 1)
        roots++
      if (Math.abs(x2) <= 1)
        roots++
      if (x1 < -1)
        x1 = x2
    }

    if (roots === 1) {
      if (h0 < 0)
        rise = i + x1
      else set = i + x1
    }
    else if (roots === 2) {
      rise = i + (ye < 0 ? x2 : x1)
      set = i + (ye < 0 ? x1 : x2)
    }

    if (rise && set)
      break

    h0 = h2
  }

  const result: IMoonTimes = {} as IMoonTimes

  if (rise)
    result.rise = hoursLater(t, rise)
  if (set)
    result.set = hoursLater(t, set)

  if (!rise && !set)
    result[ye > 0 ? 'alwaysUp' : 'alwaysDown'] = true

  return result
}

export default SunCalc
