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
    getPosition: (date: Date, lat: number, lng: number) => {
        azimuth: number;
        altitude: number;
    };
    /**
     * Sun times configuration
     */
    times: Array<[number, string, string]>;
    /**
     * Adds a custom time to the times config
     * @param {number} angle - The angle for the custom time
     * @param {string} riseName - Name for the rise time
     * @param {string} setName - Name for the set time
     */
    addTime: (angle: number, riseName: string, setName: string) => void;
    /**
     * Calculates sun times for a given date, latitude/longitude, and observer height
     * @param {Date} date - The date to calculate sun times for
     * @param {number} lat - Latitude in degrees
     * @param {number} lng - Longitude in degrees
     * @param {number} height - Observer height in meters (default: 0)
     * @returns {Record<string, Date>} Object with sun times
     */
    getTimes: (date: Date, lat: number, lng: number, height: number) => Record<string, Date>;
    /**
     * Calculates moon position for a given date and latitude/longitude
     * @param {Date} date - The date to calculate moon position for
     * @param {number} lat - Latitude in degrees
     * @param {number} lng - Longitude in degrees
     * @returns {IMoonPosition} Moon position information
     */
    getMoonPosition: (date: Date, lat: number, lng: number) => IMoonPosition;
    /**
     * Calculates moon illumination parameters
     * @param {Date} date - The date to calculate moon illumination for
     * @returns {IMoonIllumination} Moon illumination information
     */
    getMoonIllumination: (date: Date) => IMoonIllumination;
    /**
     * Calculates moon rise/set times
     * @param {Date} date - The date to calculate moon times for
     * @param {number} lat - Latitude in degrees
     * @param {number} lng - Longitude in degrees
     * @param {boolean} inUTC - Whether to use UTC time (default: false)
     * @returns {IMoonTimes} Moon times information
     */
    getMoonTimes: (date: Date, lat: number, lng: number, inUTC: boolean) => IMoonTimes;
}
declare const SunCalc: ISunCalc;
/**
 * Interface for moon position result
 */
interface IMoonPosition {
    /** Azimuth in radians */
    azimuth: number;
    /** Altitude in radians */
    altitude: number;
    /** Distance to the moon in km */
    distance: number;
    /** Parallactic angle in radians */
    parallacticAngle: number;
}
/**
 * Interface for moon illumination result
 */
interface IMoonIllumination {
    /** Illumination fraction (0-1) */
    fraction: number;
    /** Moon phase (0-1) */
    phase: number;
    /** Phase angle in radians */
    angle: number;
}
/**
 * Interface for moon times result
 */
interface IMoonTimes {
    /** Moon rise time */
    rise: Date;
    /** Moon set time */
    set: Date;
    /** Whether the moon is always up */
    alwaysUp?: boolean;
    /** Whether the moon is always down */
    alwaysDown?: boolean;
}
export default SunCalc;
