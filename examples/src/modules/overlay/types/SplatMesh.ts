class SplatMesh {
  private _splatData: unknown
  constructor(splatData: unknown) {
    this._splatData = splatData
  }

  static async fromGltfAsync() {}

  static async fromSpzAsync() {}

  static async fromSplatAsync() {}
}

export default SplatMesh
