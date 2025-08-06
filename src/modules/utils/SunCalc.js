/*
 (c) 2011-2015, Vladimir Agafonkin
 SunCalc is a JavaScript library for calculating sun/moon position and light phases.
 https://github.com/mourner/suncalc
*/
const PI = Math.PI;
const sin = Math.sin;
const cos = Math.cos;
const tan = Math.tan;
const asin = Math.asin;
const atan = Math.atan2;
const acos = Math.acos;
const rad = PI / 180;
// sun calculations are based on http://aa.quae.nl/en/reken/zonpositie.html formulas
// date/time constants and conversions
const dayMs = 1000 * 60 * 60 * 24;
const J1970 = 2440588;
const J2000 = 2451545;
/**
 * Converts a Date object to Julian date
 * @param {Date} date - The date to convert
 * @returns {number} Julian date
 */
function toJulian(date) {
    return date.valueOf() / dayMs - 0.5 + J1970;
}
/**
 * Converts a Julian date to a Date object
 * @param {number} j - Julian date
 * @returns {Date} Converted date
 */
function fromJulian(j) {
    return new Date((j + 0.5 - J1970) * dayMs);
}
/**
 * Converts a Date to days since J2000 epoch
 * @param {Date} date - The date to convert
 * @returns {number} Days since J2000
 */
function toDays(date) {
    return toJulian(date) - J2000;
}
// general calculations for position
const e = rad * 23.4397; // obliquity of the Earth
/**
 * Calculates right ascension
 * @param {number} l - Ecliptic longitude in radians
 * @param {number} b - Ecliptic latitude in radians
 * @returns {number} Right ascension in radians
 */
function rightAscension(l, b) {
    return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l));
}
/**
 * Calculates declination
 * @param {number} l - Ecliptic longitude in radians
 * @param {number} b - Ecliptic latitude in radians
 * @returns {number} Declination in radians
 */
function declination(l, b) {
    return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l));
}
/**
 * Calculates azimuth
 * @param {number} H - Hour angle in radians
 * @param {number} phi - Latitude in radians
 * @param {number} dec - Declination in radians
 * @returns {number} Azimuth in radians
 */
function azimuth(H, phi, dec) {
    return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi));
}
/**
 * Calculates altitude
 * @param {number} H - Hour angle in radians
 * @param {number} phi - Latitude in radians
 * @param {number} dec - Declination in radians
 * @returns {number} Altitude in radians
 */
function altitude(H, phi, dec) {
    return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
}
/**
 * Calculates sidereal time
 * @param {number} d - Days since J2000
 * @param {number} lw - West longitude in radians
 * @returns {number} Sidereal time in radians
 */
function siderealTime(d, lw) {
    return rad * (280.16 + 360.9856235 * d) - lw;
}
/**
 * Calculates astronomical refraction
 * @param {number} h - Altitude in radians
 * @returns {number} Refraction correction in radians
 */
function astroRefraction(h) {
    if (h < 0)
        // the following formula works for positive altitudes only.
        h = 0; // if h = -0.08901179 a div/0 would occur.
    // formula 16.4 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
    // 1.02 / tan(h + 10.26 / (h + 5.10)) h in degrees, result in arc minutes -> converted to rad:
    return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
}
// general sun calculations
/**
 * Calculates solar mean anomaly
 * @param {number} d - Days since J2000
 * @returns {number} Solar mean anomaly in radians
 */
function solarMeanAnomaly(d) {
    return rad * (357.5291 + 0.98560028 * d);
}
/**
 * Calculates ecliptic longitude
 * @param {number} M - Solar mean anomaly in radians
 * @returns {number} Ecliptic longitude in radians
 */
function eclipticLongitude(M) {
    const C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)); // equation of center
    const P = rad * 102.9372; // perihelion of the Earth
    return M + C + P + PI;
}
/**
 * Calculates sun coordinates
 * @param {number} d - Days since J2000
 * @returns {{dec: number, ra: number}} Sun coordinates with declination and right ascension in radians
 */
function sunCoords(d) {
    const M = solarMeanAnomaly(d);
    const L = eclipticLongitude(M);
    return {
        dec: declination(L, 0),
        ra: rightAscension(L, 0),
    };
}
const SunCalc = {};
// calculates sun position for a given date and latitude/longitude
SunCalc.getPosition = function (date, lat, lng) {
    const lw = rad * -lng;
    const phi = rad * lat;
    const d = toDays(date);
    const c = sunCoords(d);
    const H = siderealTime(d, lw) - c.ra;
    return {
        azimuth: azimuth(H, phi, c.dec),
        altitude: altitude(H, phi, c.dec),
    };
};
// sun times configuration (angle, morning name, evening name)
const times = (SunCalc.times = [
    [-0.833, 'sunrise', 'sunset'],
    [-0.3, 'sunriseEnd', 'sunsetStart'],
    [-6, 'dawn', 'dusk'],
    [-12, 'nauticalDawn', 'nauticalDusk'],
    [-18, 'nightEnd', 'night'],
    [6, 'goldenHourEnd', 'goldenHour'],
]);
// adds a custom time to the times config
SunCalc.addTime = function (angle, riseName, setName) {
    times.push([angle, riseName, setName]);
};
// calculations for sun times
const J0 = 0.0009;
/**
 * Calculates julian cycle
 * @param {number} d - Days since J2000
 * @param {number} lw - West longitude in radians
 * @returns {number} Julian cycle
 */
function julianCycle(d, lw) {
    return Math.round(d - J0 - lw / (2 * PI));
}
/**
 * Calculates approximate transit
 * @param {number} Ht - Hour angle in radians
 * @param {number} lw - West longitude in radians
 * @param {number} n - Julian cycle
 * @returns {number} Approximate transit
 */
function approxTransit(Ht, lw, n) {
    return J0 + (Ht + lw) / (2 * PI) + n;
}
/**
 * Calculates solar transit in Julian date
 * @param {number} ds - Approximate transit
 * @param {number} M - Solar mean anomaly in radians
 * @param {number} L - Ecliptic longitude in radians
 * @returns {number} Solar transit in Julian date
 */
function solarTransitJ(ds, M, L) {
    return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L);
}
/**
 * Calculates hour angle
 * @param {number} h - Altitude in radians
 * @param {number} phi - Latitude in radians
 * @param {number} d - Declination in radians
 * @returns {number} Hour angle in radians
 */
function hourAngle(h, phi, d) {
    return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d)));
}
/**
 * Calculates observer angle
 * @param {number} height - Observer height in meters
 * @returns {number} Observer angle in radians
 */
function observerAngle(height) {
    return (-2.076 * Math.sqrt(height)) / 60;
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
function getSetJ(h, lw, phi, dec, n, M, L) {
    const w = hourAngle(h, phi, dec);
    const a = approxTransit(w, lw, n);
    return solarTransitJ(a, M, L);
}
// calculates sun times for a given date, latitude/longitude, and, optionally,
// the observer height (in meters) relative to the horizon
SunCalc.getTimes = function (date, lat, lng, height = 0) {
    const lw = rad * -lng;
    const phi = rad * lat;
    const dh = observerAngle(height);
    const d = toDays(date);
    const n = julianCycle(d, lw);
    const ds = approxTransit(0, lw, n);
    const M = solarMeanAnomaly(ds);
    const L = eclipticLongitude(M);
    const dec = declination(L, 0);
    const Jnoon = solarTransitJ(ds, M, L);
    let i;
    let len;
    let time;
    let h0;
    let Jset;
    let Jrise;
    const result = {
        solarNoon: fromJulian(Jnoon),
        nadir: fromJulian(Jnoon - 0.5),
    };
    for (i = 0, len = times.length; i < len; i += 1) {
        time = times[i];
        h0 = (time[0] + dh) * rad;
        Jset = getSetJ(h0, lw, phi, dec, n, M, L);
        Jrise = Jnoon - (Jset - Jnoon);
        result[time[1]] = fromJulian(Jrise);
        result[time[2]] = fromJulian(Jset);
    }
    return result;
};
/**
 * Calculates moon coordinates
 * @param {number} d - Days since J2000
 * @returns {MoonCoordsResult} Moon coordinates and distance
 */
function moonCoords(d) {
    // geocentric ecliptic coordinates of the moon
    const L = rad * (218.316 + 13.176396 * d); // ecliptic longitude
    const M = rad * (134.963 + 13.064993 * d); // mean anomaly
    const F = rad * (93.272 + 13.22935 * d); // mean distance
    const l = L + rad * 6.289 * sin(M); // longitude
    const b = rad * 5.128 * sin(F); // latitude
    const dt = 385001 - 20905 * cos(M); // distance to the moon in km
    return {
        ra: rightAscension(l, b),
        dec: declination(l, b),
        dist: dt,
    };
}
SunCalc.getMoonPosition = function (date, lat, lng) {
    const lw = rad * -lng;
    const phi = rad * lat;
    const d = toDays(date);
    const c = moonCoords(d);
    const H = siderealTime(d, lw) - c.ra;
    let h = altitude(H, phi, c.dec);
    // formula 14.1 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
    const pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H));
    h = h + astroRefraction(h); // altitude correction for refraction
    return {
        azimuth: azimuth(H, phi, c.dec),
        altitude: h,
        distance: c.dist,
        parallacticAngle: pa,
    };
};
// calculations for illumination parameters of the moon,
// based on http://idlastro.gsfc.nasa.gov/ftp/pro/astro/mphase.pro formulas and
// Chapter 48 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
SunCalc.getMoonIllumination = function (date) {
    const d = toDays(date || new Date());
    const s = sunCoords(d);
    const m = moonCoords(d);
    const sdist = 149598000; // distance from Earth to Sun in km
    const phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra));
    const inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi));
    const angle = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));
    return {
        fraction: (1 + cos(inc)) / 2,
        phase: 0.5 + (0.5 * inc * (angle < 0 ? -1 : 1)) / Math.PI,
        angle,
    };
};
/**
 * Calculates a date that is a specified number of hours later than the given date
 * @param {Date} date - The base date
 * @param {number} h - Number of hours to add
 * @returns {Date} New date with hours added
 */
function hoursLater(date, h) {
    return new Date(date.valueOf() + (h * dayMs) / 24);
}
SunCalc.getMoonTimes = function (date, lat, lng, inUTC = false) {
    const t = new Date(date);
    if (inUTC)
        t.setUTCHours(0, 0, 0, 0);
    else
        t.setHours(0, 0, 0, 0);
    const hc = 0.133 * rad;
    let h0 = SunCalc.getMoonPosition(t, lat, lng).altitude - hc;
    let h1;
    let h2;
    let rise;
    let set;
    let a;
    let b;
    let xe;
    let ye;
    let d;
    let roots;
    let x1;
    let x2;
    let dx;
    // go in 2-hour chunks, each time seeing if a 3-point quadratic curve crosses zero (which means rise or set)
    for (let i = 1; i <= 24; i += 2) {
        h1 = SunCalc.getMoonPosition(hoursLater(t, i), lat, lng).altitude - hc;
        h2 = SunCalc.getMoonPosition(hoursLater(t, i + 1), lat, lng).altitude - hc;
        a = (h0 + h2) / 2 - h1;
        b = (h2 - h0) / 2;
        xe = -b / (2 * a);
        ye = (a * xe + b) * xe + h1;
        d = b * b - 4 * a * h1;
        roots = 0;
        if (d >= 0) {
            dx = Math.sqrt(d) / (Math.abs(a) * 2);
            x1 = xe - dx;
            x2 = xe + dx;
            if (Math.abs(x1) <= 1)
                roots++;
            if (Math.abs(x2) <= 1)
                roots++;
            if (x1 < -1)
                x1 = x2;
        }
        if (roots === 1) {
            if (h0 < 0)
                rise = i + x1;
            else
                set = i + x1;
        }
        else if (roots === 2) {
            rise = i + (ye < 0 ? x2 : x1);
            set = i + (ye < 0 ? x1 : x2);
        }
        if (rise && set)
            break;
        h0 = h2;
    }
    const result = {};
    if (rise)
        result.rise = hoursLater(t, rise);
    if (set)
        result.set = hoursLater(t, set);
    if (!rise && !set)
        result[ye > 0 ? 'alwaysUp' : 'alwaysDown'] = true;
    return result;
};
export default SunCalc;
