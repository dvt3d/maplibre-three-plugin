// src/modules/scene/MapScene.ts
import {
  Group,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  EventDispatcher,
  Box3,
  Vector3 as Vector33,
  NormalBlending
} from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import "three/addons/postprocessing/Pass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

// src/modules/constants/index.ts
var WORLD_SIZE = 512 * 2e3;
var EARTH_RADIUS = 63710088e-1;
var EARTH_CIRCUMFERENCE = 2 * Math.PI * EARTH_RADIUS;
var DEG2RAD = Math.PI / 180;
var RAD2DEG = 180 / Math.PI;
var PROJECTION_WORLD_SIZE = WORLD_SIZE / EARTH_CIRCUMFERENCE;
var TILE_SIZE = 512;

// src/modules/utils/Util.ts
var Util = class {
  /**
   *
   * @param n
   * @param min
   * @param max
   * @returns {number}
   */
  static clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }
  /**
   *
   * @param fovy
   * @param aspect
   * @param near
   * @param far
   * @returns {number[]}
   */
  static makePerspectiveMatrix(fovy, aspect, near, far) {
    let f = 1 / Math.tan(fovy / 2);
    let nf = 1 / (near - far);
    return [
      f / aspect,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (far + near) * nf,
      -1,
      0,
      0,
      2 * far * near * nf,
      0
    ];
  }
  /**
   *
   * @param lng
   * @returns {number}
   */
  static mercatorXFromLng(lng) {
    return (180 + lng) / 360;
  }
  /**
   *
   * @param lat
   * @returns {number}
   */
  static mercatorYFromLat(lat) {
    return (180 - 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))) / 360;
  }
  /**
   *
   * @param transform
   * @param center
   * @param boundingSize
   * @returns {{center: (number|*)[], cameraHeight: number, zoom: number}}
   */
  static getViewInfo(transform, center, boundingSize) {
    const fovInRadians = transform.fov * DEG2RAD;
    const pitchInRadians = transform.pitch * DEG2RAD;
    let _center = null;
    if (Array.isArray(center)) {
      _center = { lng: center[0], lat: center[1], alt: center[2] || 0 };
    }
    if (typeof center === "string") {
      let arr = center.split(",");
      _center = { lng: +arr[0], lat: +arr[1], alt: +arr[2] || 0 };
    }
    const distance = Math.max(boundingSize.x, boundingSize.y, boundingSize.z) / (2 * Math.tan(fovInRadians / 2));
    const cameraHeight = distance * Math.cos(pitchInRadians) + _center.alt;
    const pixelAltitude = Math.abs(
      Math.cos(pitchInRadians) * transform.cameraToCenterDistance
    );
    const metersInWorldAtLat = EARTH_CIRCUMFERENCE * Math.abs(Math.cos(_center.lat * DEG2RAD));
    const worldSize = pixelAltitude / cameraHeight * metersInWorldAtLat;
    const zoom = Math.round(Math.log2(worldSize / transform.tileSize));
    return {
      center: [_center.lng, _center.lat],
      cameraHeight,
      zoom: Math.min(zoom, transform.maxZoom)
    };
  }
  /**
   *
   * @param transform
   * @param zoom
   * @param lat
   * @param pitch
   * @returns {number}
   */
  static getHeightByZoom(transform, zoom, lat, pitch) {
    const pixelAltitude = Math.abs(
      Math.cos(pitch * DEG2RAD) * transform.cameraToCenterDistance
    );
    const metersInWorldAtLat = EARTH_CIRCUMFERENCE * Math.abs(Math.cos(lat * DEG2RAD));
    const worldSize = Math.pow(2, zoom) * transform.tileSize;
    return pixelAltitude * metersInWorldAtLat / worldSize;
  }
  /**
   *
   * @param transform
   * @param height
   * @param lat
   * @param pitch
   * @returns {number}
   */
  static getZoomByHeight(transform, height, lat, pitch) {
    const pixelAltitude = Math.abs(
      Math.cos(pitch * DEG2RAD) * transform.cameraToCenterDistance
    );
    const metersInWorldAtLat = EARTH_CIRCUMFERENCE * Math.abs(Math.cos(lat * DEG2RAD));
    const worldSize = pixelAltitude / height * metersInWorldAtLat;
    return Math.round(Math.log2(worldSize / transform.tileSize));
  }
};
var Util_default = Util;

// src/modules/camera/CameraSync.ts
import { Matrix4, Vector3 } from "three";
var projectionMatrix = new Matrix4();
var cameraTranslateZ = new Matrix4();
var MAX_VALID_LATITUDE = 85.051129;
var CameraSync = class {
  _map;
  _world;
  _camera;
  _translateCenter;
  _worldSizeRatio;
  constructor(map, world, camera) {
    this._map = map;
    this._world = world;
    this._camera = camera;
    this._translateCenter = new Matrix4().makeTranslation(
      WORLD_SIZE / 2,
      -WORLD_SIZE / 2,
      0
    );
    this._worldSizeRatio = TILE_SIZE / WORLD_SIZE;
    this._map.on("move", () => {
      this.syncCamera(false);
    });
    this._map.on("resize", () => {
      this.syncCamera(true);
    });
  }
  /**
   *
   */
  syncCamera(updateProjectionMatrix) {
    const transform = this._map.transform;
    const pitchInRadians = transform.pitch * DEG2RAD;
    const bearingInRadians = transform.bearing * DEG2RAD;
    if (updateProjectionMatrix) {
      const fovInRadians = transform.fov * DEG2RAD;
      const centerOffset = transform.centerOffset || new Vector3();
      this._camera.aspect = transform.width / transform.height;
      projectionMatrix.elements = Util_default.makePerspectiveMatrix(
        fovInRadians,
        this._camera.aspect,
        transform.height / 50,
        transform.farZ
      );
      this._camera.projectionMatrix = projectionMatrix;
      this._camera.projectionMatrix.elements[8] = -centerOffset.x * 2 / transform.width;
      this._camera.projectionMatrix.elements[9] = centerOffset.y * 2 / transform.height;
    }
    cameraTranslateZ.makeTranslation(0, 0, transform.cameraToCenterDistance);
    const cameraWorldMatrix = new Matrix4().premultiply(cameraTranslateZ).premultiply(new Matrix4().makeRotationX(pitchInRadians)).premultiply(new Matrix4().makeRotationZ(-bearingInRadians));
    if (transform.elevation) {
      cameraWorldMatrix.elements[14] = transform.cameraToCenterDistance * Math.cos(pitchInRadians);
    }
    this._camera.matrixWorld.copy(cameraWorldMatrix);
    const zoomPow = transform.scale * this._worldSizeRatio;
    const scale = new Matrix4().makeScale(zoomPow, zoomPow, zoomPow);
    let x = transform.x;
    let y = transform.y;
    if (!x || !y) {
      const center = transform.center;
      const lat = Util_default.clamp(
        center.lat,
        -MAX_VALID_LATITUDE,
        MAX_VALID_LATITUDE
      );
      x = Util_default.mercatorXFromLng(center.lng) * transform.worldSize;
      y = Util_default.mercatorYFromLat(lat) * transform.worldSize;
    }
    const translateMap = new Matrix4().makeTranslation(-x, y, 0);
    const rotateMap = new Matrix4().makeRotationZ(Math.PI);
    this._world.matrix = new Matrix4().premultiply(rotateMap).premultiply(this._translateCenter).premultiply(scale).premultiply(translateMap);
  }
};
var CameraSync_default = CameraSync;

// src/modules/layer/ThreeLayer.ts
var ThreeLayer = class {
  _id;
  _mapScene;
  _cameraSync;
  constructor(id, mapScene) {
    this._id = id;
    this._mapScene = mapScene;
    this._cameraSync = new CameraSync_default(
      this._mapScene.map,
      this._mapScene.world,
      this._mapScene.camera
    );
  }
  get id() {
    return this._id;
  }
  get type() {
    return "custom";
  }
  get renderingMode() {
    return "3d";
  }
  onAdd() {
    this._cameraSync.syncCamera(true);
  }
  render() {
    this._mapScene.render();
  }
  onRemove() {
    this._cameraSync = null;
    this._mapScene = null;
  }
};
var ThreeLayer_default = ThreeLayer;

// src/modules/transform/SceneTransform.ts
import { Vector3 as Vector32 } from "three";
var SceneTransform = class {
  /**
   *
   * @returns {number}
   */
  static projectedMercatorUnitsPerMeter() {
    return this.projectedUnitsPerMeter(0);
  }
  /**
   *
   * @param lat
   * @returns {number}
   */
  static projectedUnitsPerMeter(lat) {
    return Math.abs(WORLD_SIZE / Math.cos(DEG2RAD * lat) / EARTH_CIRCUMFERENCE);
  }
  /**
   *
   * @param lng
   * @param lat
   * @param alt
   * @returns {Vector3}
   */
  static lngLatToVector3(lng, lat, alt) {
    let v = [0, 0, 0];
    if (Array.isArray(lng)) {
      v = [
        -EARTH_RADIUS * DEG2RAD * lng[0] * PROJECTION_WORLD_SIZE,
        -EARTH_RADIUS * Math.log(Math.tan(Math.PI * 0.25 + 0.5 * DEG2RAD * lng[1])) * PROJECTION_WORLD_SIZE
      ];
      if (!lng[2]) {
        v.push(0);
      } else {
        v.push(lng[2] * this.projectedUnitsPerMeter(lng[1]));
      }
    } else {
      v = [
        -EARTH_RADIUS * DEG2RAD * lng * PROJECTION_WORLD_SIZE,
        -EARTH_RADIUS * Math.log(Math.tan(Math.PI * 0.25 + 0.5 * DEG2RAD * (lat || 0))) * PROJECTION_WORLD_SIZE
      ];
      if (!alt) {
        v.push(0);
      } else {
        v.push(alt * this.projectedUnitsPerMeter(lat || 0));
      }
    }
    return new Vector32(v[0], v[1], v[2]);
  }
  /**
   *
   * @param v
   * @returns {number[]}
   */
  static vector3ToLngLat(v) {
    let result = [0, 0, 0];
    if (v) {
      result[0] = -v.x / (EARTH_RADIUS * DEG2RAD * PROJECTION_WORLD_SIZE);
      result[1] = 2 * (Math.atan(Math.exp(v.y / (PROJECTION_WORLD_SIZE * -EARTH_RADIUS))) - Math.PI / 4) / DEG2RAD;
      result[2] = v.z / this.projectedUnitsPerMeter(result[1]);
    }
    return result;
  }
};
var SceneTransform_default = SceneTransform;

// src/modules/scene/MapScene.ts
var DEF_OPTS = {
  scene: null,
  camera: null,
  renderer: null,
  preserveDrawingBuffer: false,
  renderLoop: null,
  enablePostProcessing: false
};
var DEF_LAYER_ID = "map_scene_layer";
var MapScene = class {
  _map;
  _options;
  _canvas;
  _scene;
  _camera;
  _renderer;
  _lights;
  _world;
  _composer;
  _renderPass;
  _customOutPass;
  _event;
  constructor(map, options = {}) {
    if (!map) {
      throw "missing  map";
    }
    this._map = map;
    this._options = {
      ...DEF_OPTS,
      ...options
    };
    this._canvas = map.getCanvas();
    this._scene = this._options.scene || new Scene();
    this._camera = this._options.camera || new PerspectiveCamera(
      this._map.transform.fov,
      this._map.transform.width / this._map.transform.height,
      1e-3,
      1e21
    );
    this._camera.matrixAutoUpdate = false;
    this._renderer = this._options.renderer || new WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: this._options.preserveDrawingBuffer,
      canvas: this._canvas,
      context: this._canvas.getContext("webgl2")
    });
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(this._canvas.clientWidth, this._canvas.clientHeight);
    this._renderer.autoClear = false;
    this._lights = new Group();
    this._lights.name = "lights";
    this._scene.add(this._lights);
    this._world = new Group();
    this._world.name = "world";
    this._world.userData = {
      isWorld: true,
      name: "world"
    };
    this._world.position.set(WORLD_SIZE / 2, WORLD_SIZE / 2, 0);
    this._world.matrixAutoUpdate = false;
    this._scene.add(this._world);
    if (this._options.enablePostProcessing) {
      this._composer = new EffectComposer(this._renderer);
      this._composer.setSize(
        this._canvas.clientWidth,
        this._canvas.clientHeight
      );
      this._composer.renderTarget1.depthBuffer = true;
      this._composer.renderTarget2.depthBuffer = true;
      this._renderPass = new RenderPass(this._scene, this._camera);
      this._renderer.setClearColor(0, 0);
      this._composer.addPass(this._renderPass);
      this._customOutPass = new OutputPass();
      this._customOutPass.renderToScreen = true;
      this._customOutPass.material.transparent = true;
      this._customOutPass.material.blending = NormalBlending;
      this._customOutPass.clear = false;
      this._composer.addPass(this._customOutPass);
    }
    this._map.on("render", this._onMapRender.bind(this));
    this._event = new EventDispatcher();
  }
  get map() {
    return this._map;
  }
  get canvas() {
    return this._canvas;
  }
  get camera() {
    return this._camera;
  }
  get scene() {
    return this._scene;
  }
  get lights() {
    return this._lights;
  }
  get world() {
    return this._world;
  }
  get renderer() {
    return this._renderer;
  }
  get composer() {
    return this._composer;
  }
  get renderPass() {
    return this._renderPass;
  }
  get customOutPass() {
    return this._customOutPass;
  }
  /**
   *
   * @private
   */
  _onMapRender() {
    if (!this._map.getLayer(DEF_LAYER_ID)) {
      this._map.addLayer(new ThreeLayer_default(DEF_LAYER_ID, this));
    }
  }
  /**
   *
   * @returns {MapScene}
   */
  render() {
    if (this._options.renderLoop) {
      this._options.renderLoop(this);
    } else {
      const frameState = {
        center: this._map.getCenter(),
        scene: this._scene,
        camera: this._camera,
        renderer: this._renderer
      };
      this._event.dispatchEvent({
        type: "preReset",
        frameState
      });
      this.renderer.resetState();
      this._event.dispatchEvent({
        type: "postReset",
        frameState
      });
      this._event.dispatchEvent({
        type: "preRender",
        frameState
      });
      if (this._composer) {
        this._composer.render();
      } else {
        this._renderer.render(this._scene, this._camera);
      }
      this._event.dispatchEvent({
        type: "postRender",
        frameState
      });
    }
    return this;
  }
  /**
   *
   * @param light
   * @returns {MapScene}
   */
  addLight(light) {
    this._lights.add(light.delegate || light);
    return this;
  }
  /**
   *
   * @param light
   */
  removeLight(light) {
    this._lights.remove(light.delegate || light);
    return this;
  }
  /**
   *
   * @param object
   * @returns {MapScene}
   */
  addObject(object) {
    let obj = "delegate" in object ? object.delegate : object;
    this._world.add(obj);
    return this;
  }
  /**
   *
   * @param object
   * @returns {MapScene}
   */
  removeObject(object) {
    let obj = "delegate" in object ? object.delegate : object;
    this._world.remove(obj);
    obj.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
      if (child.texture) child.texture.dispose();
    });
    return this;
  }
  /**
   *
   * @returns {{position: *[], heading: *, pitch}}
   */
  getViewPosition() {
    const transform = this._map.transform;
    const center = transform.center;
    return {
      position: [
        center.lng,
        center.lat,
        Util_default.getHeightByZoom(
          transform,
          transform.zoom,
          center.lat,
          transform.pitch
        )
      ],
      heading: transform.bearing,
      pitch: transform.pitch
    };
  }
  /**
   *
   * @param target
   * @param completed
   * @param duration
   * @returns {MapScene}
   */
  flyTo(target, duration, completed) {
    if (target && target.position) {
      if (completed) {
        this._map.once("moveend", completed);
      }
      let size = target.size;
      if (!size) {
        size = new Vector33();
        new Box3().setFromObject(target.delegate || target, true).getSize(size);
      }
      const viewInfo = Util_default.getViewInfo(
        this._map.transform,
        SceneTransform_default.vector3ToLngLat(target.position),
        size
      );
      this._map.flyTo({
        center: viewInfo.center,
        zoom: viewInfo.zoom,
        duration: (duration || 3) * 1e3
      });
    }
    return this;
  }
  /**
   *
   * @param target
   * @param completed
   * @returns {MapScene}
   */
  zoomTo(target, completed) {
    return this.flyTo(target, 0, completed);
  }
  /**
   *
   * @returns {MapScene}
   */
  flyToPosition(position, hpr = [0, 0, 0], completed, duration = 3) {
    if (completed) {
      this._map.once("moveend", completed);
    }
    this._map.flyTo({
      center: [position[0], position[1]],
      zoom: Util_default.getZoomByHeight(
        this._map.transform,
        position[2],
        position[1],
        hpr[1] || 0
      ),
      bearing: hpr[0],
      pitch: hpr[1],
      duration: duration * 1e3
    });
    return this;
  }
  /**
   *
   * @returns {MapScene}
   */
  zoomToPosition(position, hpr = [0, 0, 0], completed) {
    return this.flyToPosition(position, hpr, completed, 0);
  }
  /**
   *
   * @param type
   * @param callback
   * @returns {MapScene}
   */
  on(type, callback) {
    this._event.addEventListener(type, callback);
    return this;
  }
  /**
   *
   * @param type
   * @param callback
   * @returns {MapScene}
   */
  off(type, callback) {
    this._event.removeEventListener(type, callback);
    return this;
  }
  /**
   *
   * @param beforeId
   * @returns {MapScene}
   */
  layerBeforeTo(beforeId) {
    this._map.moveLayer(DEF_LAYER_ID, beforeId);
    return this;
  }
  /**
   * @param pass
   * @returns {MapScene}
   */
  addPass(pass) {
    if (!this._options.enablePostProcessing || !pass || !this._composer) {
      return this;
    }
    const outPass = this._customOutPass;
    if (this._composer.passes.includes(pass)) {
      return this;
    }
    const outIndex = outPass ? this._composer.passes.indexOf(outPass) : -1;
    if (outIndex >= 0) {
      this._composer.insertPass(pass, outIndex);
    } else {
      this._composer.addPass(pass);
    }
    return this;
  }
  /**
   *
   * @param pass
   * @returns {MapScene}
   */
  removePass(pass) {
    if (!this._options.enablePostProcessing || !pass || !this._composer) {
      return this;
    }
    this._composer.removePass(pass);
    return this;
  }
};

// src/modules/sun/Sun.ts
import { Group as Group2, DirectionalLight, HemisphereLight, Color } from "three";

// src/modules/utils/SunCalc.ts
var PI = Math.PI;
var sin = Math.sin;
var cos = Math.cos;
var tan = Math.tan;
var asin = Math.asin;
var atan = Math.atan2;
var acos = Math.acos;
var rad = PI / 180;
var dayMs = 1e3 * 60 * 60 * 24;
var J1970 = 2440588;
var J2000 = 2451545;
function toJulian(date) {
  return date.valueOf() / dayMs - 0.5 + J1970;
}
function fromJulian(j) {
  return new Date((j + 0.5 - J1970) * dayMs);
}
function toDays(date) {
  return toJulian(date) - J2000;
}
var e = rad * 23.4397;
function rightAscension(l, b) {
  return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l));
}
function declination(l, b) {
  return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l));
}
function azimuth(H, phi, dec) {
  return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi));
}
function altitude(H, phi, dec) {
  return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
}
function siderealTime(d, lw) {
  return rad * (280.16 + 360.9856235 * d) - lw;
}
function astroRefraction(h) {
  if (h < 0)
    h = 0;
  return 2967e-7 / Math.tan(h + 312536e-8 / (h + 0.08901179));
}
function solarMeanAnomaly(d) {
  return rad * (357.5291 + 0.98560028 * d);
}
function eclipticLongitude(M) {
  const C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 3e-4 * sin(3 * M));
  const P = rad * 102.9372;
  return M + C + P + PI;
}
function sunCoords(d) {
  const M = solarMeanAnomaly(d);
  const L = eclipticLongitude(M);
  return {
    dec: declination(L, 0),
    ra: rightAscension(L, 0)
  };
}
var SunCalc = {};
SunCalc.getPosition = function(date, lat, lng) {
  const lw = rad * -lng;
  const phi = rad * lat;
  const d = toDays(date);
  const c = sunCoords(d);
  const H = siderealTime(d, lw) - c.ra;
  return {
    azimuth: azimuth(H, phi, c.dec),
    altitude: altitude(H, phi, c.dec)
  };
};
var times = SunCalc.times = [
  [-0.833, "sunrise", "sunset"],
  [-0.3, "sunriseEnd", "sunsetStart"],
  [-6, "dawn", "dusk"],
  [-12, "nauticalDawn", "nauticalDusk"],
  [-18, "nightEnd", "night"],
  [6, "goldenHourEnd", "goldenHour"]
];
SunCalc.addTime = function(angle, riseName, setName) {
  times.push([angle, riseName, setName]);
};
var J0 = 9e-4;
function julianCycle(d, lw) {
  return Math.round(d - J0 - lw / (2 * PI));
}
function approxTransit(Ht, lw, n) {
  return J0 + (Ht + lw) / (2 * PI) + n;
}
function solarTransitJ(ds, M, L) {
  return J2000 + ds + 53e-4 * sin(M) - 69e-4 * sin(2 * L);
}
function hourAngle(h, phi, d) {
  return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d)));
}
function observerAngle(height) {
  return -2.076 * Math.sqrt(height) / 60;
}
function getSetJ(h, lw, phi, dec, n, M, L) {
  const w = hourAngle(h, phi, dec);
  const a = approxTransit(w, lw, n);
  return solarTransitJ(a, M, L);
}
SunCalc.getTimes = function(date, lat, lng, height = 0) {
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
    nadir: fromJulian(Jnoon - 0.5)
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
function moonCoords(d) {
  const L = rad * (218.316 + 13.176396 * d);
  const M = rad * (134.963 + 13.064993 * d);
  const F = rad * (93.272 + 13.22935 * d);
  const l = L + rad * 6.289 * sin(M);
  const b = rad * 5.128 * sin(F);
  const dt = 385001 - 20905 * cos(M);
  return {
    ra: rightAscension(l, b),
    dec: declination(l, b),
    dist: dt
  };
}
SunCalc.getMoonPosition = function(date, lat, lng) {
  const lw = rad * -lng;
  const phi = rad * lat;
  const d = toDays(date);
  const c = moonCoords(d);
  const H = siderealTime(d, lw) - c.ra;
  let h = altitude(H, phi, c.dec);
  const pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H));
  h = h + astroRefraction(h);
  return {
    azimuth: azimuth(H, phi, c.dec),
    altitude: h,
    distance: c.dist,
    parallacticAngle: pa
  };
};
SunCalc.getMoonIllumination = function(date) {
  const d = toDays(date || /* @__PURE__ */ new Date());
  const s = sunCoords(d);
  const m = moonCoords(d);
  const sdist = 149598e3;
  const phi = acos(
    sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra)
  );
  const inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi));
  const angle = atan(
    cos(s.dec) * sin(s.ra - m.ra),
    sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra)
  );
  return {
    fraction: (1 + cos(inc)) / 2,
    phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI,
    angle
  };
};
function hoursLater(date, h) {
  return new Date(date.valueOf() + h * dayMs / 24);
}
SunCalc.getMoonTimes = function(date, lat, lng, inUTC = false) {
  const t = new Date(date);
  if (inUTC)
    t.setUTCHours(0, 0, 0, 0);
  else t.setHours(0, 0, 0, 0);
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
      else set = i + x1;
    } else if (roots === 2) {
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
    result[ye > 0 ? "alwaysUp" : "alwaysDown"] = true;
  return result;
};
var SunCalc_default = SunCalc;

// src/modules/sun/Sun.ts
var Sun = class {
  _delegate;
  _sunLight;
  _hemiLight;
  _currentTime;
  constructor() {
    this._delegate = new Group2();
    this._delegate.name = "Sun";
    this._sunLight = new DirectionalLight(16777215, 1);
    this._hemiLight = new HemisphereLight(
      new Color(16777215),
      new Color(16777215),
      0.6
    );
    this._hemiLight.color.setHSL(0.661, 0.96, 0.12);
    this._hemiLight.groundColor.setHSL(0.11, 0.96, 0.14);
    this._hemiLight.position.set(0, 0, 50);
    this._delegate.add(this._sunLight);
    this._delegate.add(this._hemiLight);
    this._currentTime = (/* @__PURE__ */ new Date()).getTime();
  }
  get delegate() {
    return this._delegate;
  }
  set castShadow(castShadow) {
    this._sunLight.castShadow = castShadow;
  }
  get castShadow() {
    return this._sunLight.castShadow;
  }
  set currentTime(currentTime) {
    this._currentTime = currentTime;
  }
  get currentTime() {
    return this._currentTime;
  }
  get sunLight() {
    return this._sunLight;
  }
  get hemiLight() {
    return this._hemiLight;
  }
  /**
   *
   * @param shadow
   * @returns {Sun}
   */
  setShadow(shadow = {}) {
    this._sunLight.shadow.radius = shadow.radius || 2;
    this._sunLight.shadow.mapSize.width = shadow.mapSize ? shadow.mapSize[0] : 8192;
    this._sunLight.shadow.mapSize.height = shadow.mapSize ? shadow.mapSize[1] : 8192;
    this._sunLight.shadow.camera.top = this._sunLight.shadow.camera.right = shadow.topRight || 1e3;
    this._sunLight.shadow.camera.bottom = this._sunLight.shadow.camera.left = shadow.bottomLeft || -1e3;
    this._sunLight.shadow.camera.near = shadow.near || 1;
    this._sunLight.shadow.camera.far = shadow.far || 1e8;
    this._sunLight.shadow.camera.visible = true;
    return this;
  }
  /**
   *
   * @param frameState
   */
  update(frameState) {
    const WORLD_SIZE2 = 512 * 2e3;
    const date = new Date(this._currentTime || (/* @__PURE__ */ new Date()).getTime());
    const center = frameState.center;
    const sunPosition = SunCalc_default.getPosition(date, center.lat, center.lng);
    const altitude2 = sunPosition.altitude;
    const azimuth2 = Math.PI + sunPosition.azimuth;
    const radius = WORLD_SIZE2 / 2;
    const alt = Math.sin(altitude2);
    const altRadius = Math.cos(altitude2);
    const azCos = Math.cos(azimuth2) * altRadius;
    const azSin = Math.sin(azimuth2) * altRadius;
    this._sunLight.position.set(azSin, azCos, alt);
    this._sunLight.position.multiplyScalar(radius);
    this._sunLight.intensity = Math.max(alt, 0);
    this._hemiLight.intensity = Math.max(alt * 1, 0.1);
    this._sunLight.updateMatrixWorld();
  }
};
var Sun_default = Sun;

// src/modules/creator/Creator.ts
import { Group as Group3, Mesh, PlaneGeometry, ShadowMaterial } from "three";
var Creator = class {
  /**
   *
   * @param center
   * @param rotation
   * @param scale
   */
  static createRTCGroup(center, rotation, scale) {
    const group = new Group3();
    group.name = "rtc";
    group.position.copy(SceneTransform_default.lngLatToVector3(center));
    if (rotation) {
      group.rotation.set(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0);
    } else {
      group.rotation.set(Math.PI / 2, Math.PI, 0);
    }
    if (scale) {
      group.scale.set(scale[0] || 1, scale[1] || 1, scale[2] || 1);
    } else {
      let lat_scale = 1;
      if (Array.isArray(center)) {
        lat_scale = SceneTransform_default.projectedUnitsPerMeter(center[1]);
      }
      group.scale.set(lat_scale, lat_scale, lat_scale);
    }
    return group;
  }
  /**
   *
   * @param center
   * @param rotation
   * @param scale
   */
  static createMercatorRTCGroup(center, rotation, scale) {
    const group = new Group3();
    group.name = "rtc";
    group.position.copy(SceneTransform_default.lngLatToVector3(center));
    if (rotation) {
      group.rotation.set(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0);
    } else {
      group.rotation.set(Math.PI / 2, Math.PI, 0);
    }
    if (scale) {
      group.scale.set(scale[0] || 1, scale[1] || 1, scale[2] || 1);
    } else {
      let lat_scale = 1;
      let mercator_scale = SceneTransform_default.projectedMercatorUnitsPerMeter();
      if (Array.isArray(center)) {
        lat_scale = SceneTransform_default.projectedUnitsPerMeter(center[1]);
      }
      group.scale.set(mercator_scale, mercator_scale, lat_scale);
    }
    return group;
  }
  /**
   *
   * @param center
   * @param width
   * @param height
   * @returns {Mesh}
   */
  static createShadowGround(center, width, height) {
    const geo = new PlaneGeometry(width || 100, height || 100);
    const mat = new ShadowMaterial({
      opacity: 0.5,
      transparent: true
    });
    let mesh = new Mesh(geo, mat);
    mesh.position.copy(SceneTransform_default.lngLatToVector3(center));
    mesh.receiveShadow = true;
    mesh.name = "shadow-ground";
    return mesh;
  }
};
var Creator_default = Creator;
export {
  Creator_default as Creator,
  MapScene,
  SceneTransform_default as SceneTransform,
  Sun_default as Sun
};
