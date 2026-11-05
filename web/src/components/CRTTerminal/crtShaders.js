export const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  precision highp float;
  uniform sampler2D uScene;
  uniform vec2 uResolution;
  uniform float uCurvature;
  uniform float uPhosphorGrid;
  uniform float uVignette;

  varying vec2 vUv;

  // Ekrana tam oturan kuresel fici egriligi (kenar siyahliklarini onler)
  vec2 curve(vec2 uv) {
    vec2 st = uv - 0.5;
    float r2 = dot(st, st);
    float zoom = 1.0 + 0.42 * uCurvature;
    st *= (1.0 + r2 * uCurvature) / zoom;
    return clamp(st + 0.5, 0.0, 1.0);
  }

  void main() {
    vec2 curvedUv = curve(vUv);

    // Tek doku okumasi - sifir GPU yuku, maksimum akicilik (60 FPS)
    vec3 color = texture2D(uScene, curvedUv).rgb;

    // Ince mikro fosfor agi (2.5px)
    if (uPhosphorGrid > 0.01) {
      vec2 pix = curvedUv * uResolution;
      vec2 grid = fract(pix / 2.5);
      float mask = (grid.x < 0.28 || grid.y < 0.28) ? (1.0 - uPhosphorGrid) : 1.0;
      color *= mask;
    }

    // Yumusak kose derinligi (vignette)
    vec2 st = (curvedUv - 0.5) * 2.0;
    float vig = 1.0 - dot(st, st) * (uVignette * 0.38);
    color *= clamp(vig, 0.55, 1.0);

    gl_FragColor = vec4(color, 1.0);
  }
`;

