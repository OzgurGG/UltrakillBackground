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
  uniform float uBloom;

  varying vec2 vUv;

  // Ekrana tam oturan kuresel fici egriligi (kenar siyahliklarini onler)
  vec2 curve(vec2 uv) {
    vec2 st = uv - 0.5;
    float r2 = dot(st, st);
    // Zoom kompanzasyonu: Kavisin kenarlarda siyah bosluk birakmasini engeller
    float zoom = 1.0 + 0.42 * uCurvature;
    st *= (1.0 + r2 * uCurvature) / zoom;
    return clamp(st + 0.5, 0.0, 1.0);
  }

  void main() {
    vec2 curvedUv = curve(vUv);

    // Kose mesafesi
    vec2 st = curvedUv - 0.5;
    float dist2 = dot(st, st);

    // Hafif optik cam dispersiyonu (kenarlarda mikro kromatik sapma)
    vec2 caOffset = st * dist2 * 0.0035;
    float rCh = texture2D(uScene, curvedUv + caOffset).r;
    float gCh = texture2D(uScene, curvedUv).g;
    float bCh = texture2D(uScene, curvedUv - caOffset).b;
    vec3 baseColor = vec3(rCh, gCh, bCh);

    // Post-Processing: 8-Noktali Optik Fosfor Bloom & Halasyon
    vec3 bloom = vec3(0.0);
    if (uBloom > 0.01) {
      vec2 texel = 1.0 / uResolution;
      vec2 bOffset = texel * 2.2;

      // Cevre piksellerden ornekler (Cross + Diagonal)
      vec3 s0 = texture2D(uScene, curvedUv + vec2(-bOffset.x, 0.0)).rgb;
      vec3 s1 = texture2D(uScene, curvedUv + vec2( bOffset.x, 0.0)).rgb;
      vec3 s2 = texture2D(uScene, curvedUv + vec2(0.0, -bOffset.y)).rgb;
      vec3 s3 = texture2D(uScene, curvedUv + vec2(0.0,  bOffset.y)).rgb;
      vec3 s4 = texture2D(uScene, curvedUv + vec2(-bOffset.x, -bOffset.y) * 0.707).rgb;
      vec3 s5 = texture2D(uScene, curvedUv + vec2( bOffset.x, -bOffset.y) * 0.707).rgb;
      vec3 s6 = texture2D(uScene, curvedUv + vec2(-bOffset.x,  bOffset.y) * 0.707).rgb;
      vec3 s7 = texture2D(uScene, curvedUv + vec2( bOffset.x,  bOffset.y) * 0.707).rgb;

      // Genis yari-capli yumusak halasyon
      vec2 wOffset = bOffset * 2.5;
      vec3 w0 = texture2D(uScene, curvedUv + vec2(-wOffset.x, 0.0)).rgb;
      vec3 w1 = texture2D(uScene, curvedUv + vec2( wOffset.x, 0.0)).rgb;
      vec3 w2 = texture2D(uScene, curvedUv + vec2(0.0, -wOffset.y)).rgb;
      vec3 w3 = texture2D(uScene, curvedUv + vec2(0.0,  wOffset.y)).rgb;

      vec3 nearBloom = (s0 + s1 + s2 + s3 + s4 + s5 + s6 + s7) * 0.125;
      vec3 wideBloom = (w0 + w1 + w2 + w3) * 0.25;

      // Parlak noktalarda fosfor doygunlugu (bright-pass vurgusu)
      nearBloom = pow(nearBloom, vec3(1.15)) * 1.25;
      wideBloom = pow(wideBloom, vec3(1.35)) * 0.85;

      bloom = nearBloom * 0.65 + wideBloom * 0.35;
    }

    vec3 color = baseColor + bloom * uBloom;

    // Ince mikro fosfor agi (2.5px)
    if (uPhosphorGrid > 0.01) {
      vec2 pix = curvedUv * uResolution;
      vec2 grid = fract(pix / 2.5);
      float mask = (grid.x < 0.28 || grid.y < 0.28) ? (1.0 - uPhosphorGrid) : 1.0;
      color *= mask;
    }

    // Yumusak kose derinligi (vignette)
    vec2 vCent = st * 2.0;
    float vig = 1.0 - dot(vCent, vCent) * (uVignette * 0.38);
    color *= clamp(vig, 0.55, 1.0);

    gl_FragColor = vec4(color, 1.0);
  }
`;

