const CustomOutputShader = {
  name: 'CustomOutputShader',

  uniforms: {
    tDiffuse: { value: null },
  },

  vertexShader: /* glsl */ `
		precision highp float;
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

  fragmentShader: /* glsl */ `
    precision highp float;
		uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
     vec4 color = texture2D(tDiffuse, vUv);
     color.rgb = pow(color.rgb, vec3(1.0/2.2));
     color.rgb *= color.a;
     gl_FragColor = color;
    }`,
}

export { CustomOutputShader }
