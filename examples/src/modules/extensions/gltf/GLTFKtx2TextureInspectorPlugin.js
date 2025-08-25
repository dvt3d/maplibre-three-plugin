class GLTFKtx2TextureInspectorPlugin {
  constructor(parse) {
    this.parse = parse
    this.name = 'ktx2_texture_inspector'
  }

  beforeRoot() {
    let textures = this.parse.json.textures
    let images = this.parse.json.images
    for (let i = 0; i < textures.length; i++) {
      let texture = textures[i]
      if (
        !texture.extensions &&
        images[texture.source] &&
        images[texture.source].mimeType.indexOf('ktx2') >= 0
      ) {
        texture.extensions = {
          KHR_texture_basisu: {
            source: texture.source,
          },
        }
      }
    }
  }
}

export default GLTFKtx2TextureInspectorPlugin
