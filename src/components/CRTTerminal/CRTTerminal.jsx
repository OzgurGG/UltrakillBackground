import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { LanyardManager } from '../../LanyardManager';
import { initPathDrops } from '../SnakeGame_PathDrops/PathDrops';
import { initCultStream } from '../Header/backgrounds/CultStream/CultStream';
import { crtConfig } from '../../config/crtConfig';
import './CRTTerminal.css';

/**
 * WebGL CRT Terminal Shader
 * 
 * - Ekrana tam oturan (zoom kompanzasyonlu) küresel kavis; kenarlarda siyah boşluk bırakmaz.
 * - Kenarlardaki kırmızı ışıklandırma / rim efekti tamamen kapatıldı.
 * - Header yüksekliği 115px'e büyütüldü; Lanyard alanı sağa ve aşağıya doğru ferahlatıldı.
 */

const HEADER_HEIGHT = 140;
const HEADER_LEFT_WIDTH = 360;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform sampler2D uScene;
  uniform vec2 uResolution;
  uniform float uCurvature;
  uniform float uPhosphorGrid;
  uniform float uVignette;

  varying vec2 vUv;

  // Ekrana tam oturan küresel fıçı eğriliği (kenar siyahlıklarını önler)
  vec2 curve(vec2 uv) {
    vec2 st = uv - 0.5;
    float r2 = dot(st, st);
    // Zoom kompanzasyonu: Kavisin kenarlarda siyah boşluk bırakmasını engeller
    float zoom = 1.0 + 0.42 * uCurvature;
    st *= (1.0 + r2 * uCurvature) / zoom;
    return clamp(st + 0.5, 0.0, 1.0);
  }

  void main() {
    vec2 curvedUv = curve(vUv);

    // Sahneden bükülmüş pikseli oku
    vec4 scene = texture2D(uScene, curvedUv);

    // Saf renkler ve saf siyah zemin (kırmızı tonlama wash filtresi kaldırıldı)
    vec3 color = scene.rgb;

    // İnce mikro fosfor ağı (2.5px)
    if (uPhosphorGrid > 0.01) {
      vec2 pix = curvedUv * uResolution;
      vec2 grid = fract(pix / 2.5);
      float mask = (grid.x < 0.28 || grid.y < 0.28) ? (1.0 - uPhosphorGrid) : 1.0;
      color *= mask;
    }

    // Yumuşak köşe derinliği (vignette)
    vec2 vCent = (curvedUv - 0.5) * 2.0;
    float vig = 1.0 - dot(vCent, vCent) * (uVignette * 0.4);
    color *= clamp(vig, 0.55, 1.0);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Dinamik Kod, Hata ve Konsol Olay Akışları (Typewriter, Hata Crash ve Burst Dökümleri)
const SCRIPT_EVENTS = [
  // 1. Temiz JavaScript Fonksiyonu (Girintili Labirent Oluşturucu)
  {
    mode: 'type',
    lines: [
      "// --- [ENGINE] RECURSIVE BACKTRACKER MAZE ---",
      "const generateMaze = (grid, width, height) => {",
      "  const stack = [[0, 0]];",
      "  grid[0][0].visited = true;",
      "",
      "  while (stack.length > 0) {",
      "    const [cx, cy] = stack[stack.length - 1];",
      "    const neighbors = getUnvisited(grid, cx, cy);",
      "",
      "    if (neighbors.length > 0) {",
      "      const [nx, ny, dir] = pickRandom(neighbors);",
      "      removeWall(grid[cy][cx], dir);",
      "      grid[ny][nx].visited = true;",
      "      stack.push([nx, ny]);",
      "    } else {",
      "      stack.pop();",
      "    }",
      "  }",
      "  return grid;",
      "};"
    ]
  },
  // 2. Beklenmedik Runtime Hatası ve Stack Trace ("bazı yazılar hata versin")
  {
    mode: 'error',
    lines: [
      "Uncaught TypeError: Cannot read properties of undefined (reading 'visited')",
      "  at carveMaze (PathDrops.jsx:420:19)",
      "  at runGenerationLoop (PathDrops.jsx:112:5)",
      "  at HTMLCanvasElement.<anonymous> (CRTTerminal.jsx:325:18)",
      "[FATAL] Memory corruption detected at grid[cy][cx]",
      "⚠️ [WARN] Watchdog restarting corrupted worker thread..."
    ]
  },
  // 3. Hızlı Konsol / Build Dökümü ("bazen bunch of codes ekrana atılsın")
  {
    mode: 'burst',
    lines: [
      "$ vite build --mode production",
      "vite v6.4.5 building for production...",
      "transforming (38) modules...",
      "✓ 38 modules transformed in 184ms",
      "dist/assets/index-CrYYBDTP.js   775.5 kB │ gzip: 211.4 kB",
      "✓ built successfully in 2.14s"
    ]
  },
  // 4. CultStream Asenkron Veri Akış Fonksiyonu
  {
    mode: 'type',
    lines: [
      "// --- [STREAM] CULT_STREAM GLYPH PROCESSOR ---",
      "async function pipeStreamBuffer(streamReader) {",
      "  const buffer = new Uint8Array(2048);",
      "  let offset = 0;",
      "",
      "  try {",
      "    while (true) {",
      "      const { done, value } = await streamReader.read();",
      "      if (done) break;",
      "",
      "      for (let i = 0; i < value.length; i++) {",
      "        const charCode = value[i];",
      "        if (charCode >= 32 && charCode <= 126) {",
      "          renderMatrixColumn(String.fromCharCode(charCode), offset);",
      "        }",
      "        offset = (offset + 1) % 64;",
      "      }",
      "    }",
      "  } catch (err) {",
      "    console.warn('StreamPipeline::Interrupted', err);",
      "  }",
      "}"
    ]
  },
  // 5. Bellek Heap ve Garbage Collection Burst Dökümü
  {
    mode: 'burst',
    lines: [
      "[HEAP_ALLOC] 0x7FFF5FBFF840 :: PAGE_SIZE=4096B [OK]",
      "[V8::GC] Scavenge 24.2MB (32.0MB) -> 18.4MB (32.0MB) [0.82ms]",
      "[NET] WebSocket connected: wss://switch.dev/cultstream",
      "{\"status\": 200, \"ack\": true, \"latency_ms\": 14.2}",
      "[STREAM_POLL] Chunk 0x8F4A ingested -> 128 bytes flushed"
    ]
  },
  // 6. JSON / Sözdizimi Hatası ve Kurtarma ("bazı yazılar hata versin")
  {
    mode: 'error',
    lines: [
      "SyntaxError: Unexpected token '?' in JSON at position 148",
      "  at JSON.parse (<anonymous>)",
      "  at parseTelemetryStream (CultStream.jsx:88:22)",
      "  at WebSocket.onmessage (CRTTerminal.jsx:194:12)",
      "⚠️ [WARN] Dropping malformed telemetry packet [CRC: 0x9AF0]",
      "✓ Stream pipeline recovered. Resuming normal loop..."
    ]
  },
  // 7. WebGL CRT Shader Derleyici Fonksiyonu
  {
    mode: 'type',
    lines: [
      "// --- [SHADER] CRT POST-PROCESSING COMPOSITE ---",
      "const initCRTProgram = (gl, vertCode, fragCode) => {",
      "  const program = gl.createProgram();",
      "  const vs = compileShader(gl, gl.VERTEX_SHADER, vertCode);",
      "  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragCode);",
      "",
      "  gl.attachShader(program, vs);",
      "  gl.attachShader(program, fs);",
      "  gl.linkProgram(program);",
      "",
      "  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {",
      "    const info = gl.getProgramInfoLog(program);",
      "    throw new Error(`ShaderLinkFailure: ${info}`);",
      "  }",
      "  return program;",
      "};"
    ]
  },
  // 8. Test ve Sistem Çekirdek Burst Dökümü
  {
    mode: 'burst',
    lines: [
      "$ bun test --coverage --silent",
      "PASS test/maze_backtracker.test.js (6 tests, 6 passed)",
      "PASS test/cult_stream.test.js (12 tests, 12 passed)",
      "PASS test/crt_curvature.test.js (4 tests, 4 passed)",
      "✓ 22 tests passed in 48ms",
      "[SYS] Kernel state synchronized :: V1_READY"
    ]
  },
  // 9. V1 Alt Sistem Olay Çekirdeği Sınıfı
  {
    mode: 'type',
    lines: [
      "// --- [KERNEL] V1 SUBSYSTEM EVENT DISPATCHER ---",
      "class V1SubsystemKernel extends EventTarget {",
      "  constructor(config = {}) {",
      "    super();",
      "    this.state = 'ONLINE';",
      "    this.fuelIntake = 1.0;",
      "  }",
      "",
      "  dispatchAction(actionType, payload) {",
      "    if (this.state !== 'ONLINE') return;",
      "    const event = new CustomEvent(actionType, {",
      "      detail: {",
      "        timestamp: performance.now(),",
      "        data: payload",
      "      }",
      "    });",
      "    this.dispatchEvent(event);",
      "  }",
      "}"
    ]
  }
];

const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'while', 'for',
  'async', 'await', 'class', 'constructor', 'new', 'try', 'catch', 'throw',
  'break', 'super', 'true', 'false', 'null', 'undefined', 'extends'
]);

function renderCodeLine(ctx, text, x, y, isTyping, now) {
  const trimmed = text.trim();

  // 1. HATA SATIRLARI (Kırmızı vurgulu, stack trace veya fatal crash)
  if (
    trimmed.startsWith('Uncaught') ||
    trimmed.startsWith('TypeError') ||
    trimmed.startsWith('SyntaxError') ||
    trimmed.startsWith('RangeError') ||
    trimmed.startsWith('Error:') ||
    trimmed.startsWith('[FATAL]') ||
    trimmed.startsWith('[PANIC]')
  ) {
    ctx.fillStyle = '#ff2233';
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.shadowColor = 'rgba(255, 34, 51, 0.7)';
    ctx.shadowBlur = 6;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
    return;
  }

  // 2. STACK TRACE SATIRLARI ("  at ...")
  if (trimmed.startsWith('at ') || text.startsWith('  at ')) {
    ctx.fillStyle = 'rgba(255, 130, 130, 0.82)';
    ctx.font = '10.5px "Share Tech Mono", monospace';
    ctx.fillText(text, x, y);
    return;
  }

  // 3. UYARI SATIRLARI (⚠️, [WARN], Warning:)
  if (trimmed.startsWith('⚠️') || trimmed.startsWith('[WARN]') || trimmed.startsWith('Warning:')) {
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.fillText(text, x, y);
    return;
  }

  // 4. BAŞARI / TEST SATIRLARI (✓, PASS)
  if (trimmed.startsWith('✓') || trimmed.startsWith('PASS')) {
    ctx.fillStyle = '#39ff14';
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.fillText(text, x, y);
    return;
  }

  // 5. SHELL KOMUTLARI ($ ...)
  if (trimmed.startsWith('$')) {
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.fillText('$ ', x, y);
    const cmdX = x + ctx.measureText('$ ').width;
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillText(text.replace(/^\$\s*/, ''), cmdX, y);
    return;
  }

  // 6. YORUM SATIRLARI (// ...)
  if (trimmed.startsWith('//')) {
    ctx.fillStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillText(text, x, y);
    if (isTyping) {
      const curX = x + ctx.measureText(text).width;
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(curX + 2, y - 9, 6, 12);
    }
    return;
  }

  // 7. TELEMETRİ / JSON / HEAP SATIRLARI
  if (
    trimmed.startsWith('{') ||
    trimmed.startsWith('[HEAP') ||
    trimmed.startsWith('[V8') ||
    trimmed.startsWith('[NET') ||
    trimmed.startsWith('[STREAM') ||
    trimmed.startsWith('[SYS]')
  ) {
    ctx.fillStyle = 'rgba(160, 230, 255, 0.85)';
    ctx.font = '10.5px "Share Tech Mono", monospace';
    ctx.fillText(text, x, y);
    return;
  }

  // 8. STANDART JAVASCRIPT KODLARI (Sözdizimi renklendirmesi + tab girintisi)
  const tokens = text.split(/([a-zA-Z0-9_$]+|'[^']*'|"[^"]*"|`[^`]*`|\s+|[^\s\w])/g);
  let curX = x;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;

    if (JS_KEYWORDS.has(token)) {
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 11px "Share Tech Mono", monospace';
    } else if (token.startsWith("'") || token.startsWith('"') || token.startsWith('`')) {
      ctx.fillStyle = '#ffbb33';
      ctx.font = '11px "Share Tech Mono", monospace';
    } else if (/^\d+$/.test(token)) {
      ctx.fillStyle = '#39ff14';
      ctx.font = '11px "Share Tech Mono", monospace';
    } else if (/[{}()[\]]/.test(token)) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Share Tech Mono", monospace';
    } else if (/[=><!+\-*/&|:;.,]/.test(token)) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.75)';
      ctx.font = '11px "Share Tech Mono", monospace';
    } else {
      ctx.fillStyle = 'rgba(215, 240, 255, 0.78)';
      ctx.font = '11px "Share Tech Mono", monospace';
    }

    ctx.fillText(token, curX, y);
    curX += ctx.measureText(token).width;
  }

  if (isTyping) {
    if (Math.floor(now * 0.005) % 2 === 0) {
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(curX + 2, y - 9, 6, 12);
    }
  }
}

export default function CRTTerminal() {
  const mountRef = useRef(null);
  const [now, setNow] = useState(Date.now());
  const [profil, setProfil] = useState({
    avatarUrl: "https://cdn.discordapp.com/embed/avatars/0.png",
    status: "offline",
    musicText: null,
    spotify: null
  });

  const profilRef = useRef(profil);
  profilRef.current = profil;

  // Lanyard Bağlantısı
  useEffect(() => {
    const manager = new LanyardManager("1092374832856961106", (canliVeri) => {
      if (canliVeri) setProfil(canliVeri);
    });
    manager.connect();
    return () => manager.disconnect();
  }, []);

  // Spotify Canlı Süre Sayacı
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // WebGL ve Kompozit Sahne Motoru
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    // 1. Sahne Tuvali
    const sceneCanvas = document.createElement('canvas');
    sceneCanvas.width = width * DPR;
    sceneCanvas.height = height * DPR;
    const sceneCtx = sceneCanvas.getContext('2d');
    sceneCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // 2. Alt Modül Tuvali: Labirent (PathDrops)
    const mazeCanvas = document.createElement('canvas');
    mazeCanvas.width = width * DPR;
    mazeCanvas.height = Math.max(10, height - HEADER_HEIGHT) * DPR;
    mazeCanvas.style.width = width + 'px';
    mazeCanvas.style.height = Math.max(10, height - HEADER_HEIGHT) + 'px';
    const destroyMaze = initPathDrops(mazeCanvas);

    // 3. Alt Modül Tuvali: Header Matrix Akışı (CultStream)
    const matrixCanvas = document.createElement('canvas');
    matrixCanvas.width = Math.max(10, width - HEADER_LEFT_WIDTH) * DPR;
    matrixCanvas.height = HEADER_HEIGHT * DPR;
    matrixCanvas.style.width = Math.max(10, width - HEADER_LEFT_WIDTH) + 'px';
    matrixCanvas.style.height = HEADER_HEIGHT + 'px';
    const destroyMatrix = initCultStream(matrixCanvas, 'back');

    // Discord Avatar Resmi
    const avatarImg = new Image();
    avatarImg.crossOrigin = 'anonymous';
    avatarImg.src = profilRef.current.avatarUrl;

    // Vitruvian V1 Optik Efektli Çizim (Chromatic Aberration + Multi-Bloom + Aperture Grille)
    const vitruvianLedImg = new Image();
    vitruvianLedImg.src = '/vitruvian-v1-led-cyan.png';

    // 4. Three.js Sahnesi ve WebGL Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setPixelRatio(DPR);
    renderer.setSize(width, height);
    renderer.domElement.className = 'crt-webgl-canvas';
    container.appendChild(renderer.domElement);

    const canvasTexture = new THREE.CanvasTexture(sceneCanvas);
    canvasTexture.minFilter = THREE.LinearFilter;
    canvasTexture.magFilter = THREE.LinearFilter;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uScene: { value: canvasTexture },
        uResolution: { value: new THREE.Vector2(width * DPR, height * DPR) },
        uCurvature: { value: crtConfig.curvature },
        uPhosphorGrid: { value: crtConfig.phosphorGrid },
        uVignette: { value: crtConfig.vignette },
      },
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    // Pencere Boyutlandırma
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      renderer.setSize(width, height);
      material.uniforms.uResolution.value.set(width * DPR, height * DPR);

      sceneCanvas.width = width * DPR;
      sceneCanvas.height = height * DPR;
      sceneCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

      mazeCanvas.width = width * DPR;
      mazeCanvas.height = Math.max(10, height - HEADER_HEIGHT) * DPR;
      mazeCanvas.style.width = width + 'px';
      mazeCanvas.style.height = Math.max(10, height - HEADER_HEIGHT) + 'px';

      matrixCanvas.width = Math.max(10, width - HEADER_LEFT_WIDTH) * DPR;
      matrixCanvas.height = HEADER_HEIGHT * DPR;
      matrixCanvas.style.width = Math.max(10, width - HEADER_LEFT_WIDTH) + 'px';
      matrixCanvas.style.height = HEADER_HEIGHT + 'px';
    };

    window.addEventListener('resize', handleResize);

    // 5. Ana Çizim & Bükme Döngüsü (60 FPS)
    let rafId;

    // Dinamik Kod & Hata Motor Durumu
    const typeState = {
      eventIdx: 0,
      lineIdx: 0,
      charIdx: 0,
      completedLines: [],
      pauseUntil: 0
    };

    function renderLoop() {
      const now = performance.now();
      const p = profilRef.current;
      if (avatarImg.src !== p.avatarUrl) {
        avatarImg.src = p.avatarUrl;
      }

      // Dinamik Kod, Hata ve Burst Akış Güncellemesi
      const currentEvt = SCRIPT_EVENTS[typeState.eventIdx];
      const currentLines = currentEvt.lines;

      if (now >= typeState.pauseUntil) {
        if (currentEvt.mode === 'burst') {
          // BUNCH OF CODES: Bir anda 3-5 satır birden ekrana atılır!
          const burstSize = Math.min(currentLines.length - typeState.lineIdx, 3 + Math.floor(Math.random() * 2));
          for (let b = 0; b < burstSize; b++) {
            typeState.completedLines.push(currentLines[typeState.lineIdx]);
            typeState.lineIdx++;
          }
          if (typeState.lineIdx >= currentLines.length) {
            typeState.pauseUntil = now + 900;
            typeState.lineIdx = 0;
            typeState.charIdx = 0;
            typeState.eventIdx = (typeState.eventIdx + 1) % SCRIPT_EVENTS.length;
          } else {
            typeState.pauseUntil = now + 40; // Çok hızlı peş peşe burst
          }
        } else if (currentEvt.mode === 'error') {
          // HATA MODU: Kırmızı hata satırları dökülür, stack trace basılır
          const errLine = currentLines[typeState.lineIdx] || '';
          typeState.completedLines.push(errLine);
          typeState.lineIdx++;
          if (typeState.lineIdx >= currentLines.length) {
            typeState.pauseUntil = now + 1600; // Hatanın ekranda okunabilmesi için 1.6s durakla
            typeState.lineIdx = 0;
            typeState.charIdx = 0;
            typeState.eventIdx = (typeState.eventIdx + 1) % SCRIPT_EVENTS.length;
          } else {
            typeState.pauseUntil = now + 90; // Hata satırları hızlıca düşer
          }
        } else {
          // STANDART TYPEWRITER MODU: Hızlı daktilo (tab girintisi anında atlanır)
          const currentLine = currentLines[typeState.lineIdx] || '';

          if (typeState.charIdx === 0) {
            const firstNonSpace = currentLine.search(/\S|$/);
            typeState.charIdx = firstNonSpace;
          }

          // Satır içi hızlı yazma hızı (her karede 3 karakter)
          typeState.charIdx = Math.min(currentLine.length, typeState.charIdx + 3);

          if (typeState.charIdx >= currentLine.length) {
            typeState.completedLines.push(currentLine);
            typeState.lineIdx++;
            typeState.charIdx = 0;

            if (typeState.lineIdx >= currentLines.length) {
              typeState.pauseUntil = now + 1300;
              typeState.lineIdx = 0;
              typeState.eventIdx = (typeState.eventIdx + 1) % SCRIPT_EVENTS.length;
            } else {
              typeState.pauseUntil = now + 45;
            }
          }
        }

        // Buffer sınırını koru
        if (typeState.completedLines.length > 70) {
          typeState.completedLines = typeState.completedLines.slice(-35);
        }
      }

      // --- 2D KOMPOZİT ÇİZİMİ ---
      sceneCtx.fillStyle = '#000000';
      sceneCtx.fillRect(0, 0, width, height);

      // A. HEADER SAĞ: CultStream Matrix
      sceneCtx.drawImage(matrixCanvas, HEADER_LEFT_WIDTH, 0, Math.max(10, width - HEADER_LEFT_WIDTH), HEADER_HEIGHT);

      // B. HEADER SOL PANEL (LANYARD & LOGO)
      sceneCtx.fillStyle = 'rgba(0, 0, 0, 0.95)';
      sceneCtx.fillRect(0, 0, HEADER_LEFT_WIDTH, HEADER_HEIGHT);

      // Lanyard kısmı ferahlatıldı ve büyütüldü
      const avatarCenterX = 66;
      const avatarCenterY = 56;
      const avatarRadius = 30;

      // Discord Avatar
      sceneCtx.save();
      sceneCtx.beginPath();
      sceneCtx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
      sceneCtx.clip();
      try {
        if (avatarImg.complete && avatarImg.naturalWidth > 0) {
          sceneCtx.drawImage(avatarImg, avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        } else {
          sceneCtx.fillStyle = '#0a0a0a';
          sceneCtx.fillRect(avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        }
      } catch (e) {}
      sceneCtx.restore();

      // Avatar Border
      sceneCtx.beginPath();
      sceneCtx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
      sceneCtx.strokeStyle = '#8f1f1f';
      sceneCtx.lineWidth = 1.5;
      sceneCtx.stroke();

      // Durum Yuvarlağı
      let statusColor = '#747f8d';
      if (p.status === 'online') statusColor = '#43b581';
      else if (p.status === 'idle') statusColor = '#faa61a';
      else if (p.status === 'dnd') statusColor = '#f04747';

      sceneCtx.beginPath();
      sceneCtx.arc(avatarCenterX + 22, avatarCenterY + 20, 8, 0, Math.PI * 2);
      sceneCtx.fillStyle = statusColor;
      sceneCtx.fill();
      sceneCtx.strokeStyle = '#000000';
      sceneCtx.lineWidth = 2;
      sceneCtx.stroke();

      // Logo: SWITCH (Daha büyük ve net)
      sceneCtx.fillStyle = '#ff3b3b';
      sceneCtx.font = 'bold 38px "Share Tech Mono", monospace';
      sceneCtx.fillText('SWITCH', avatarCenterX + 44, avatarCenterY + 12);

      // Müzik / Spotify Bilgisi
      if (p.spotify) {
        const { artist, song, start, end } = p.spotify;
        let progressStr = "0:00";
        let durationStr = "0:00";
        if (start && end) {
          const durationMs = end - start;
          const currentMs = Math.max(0, Math.min(Date.now() - start, durationMs));
          const curSec = Math.floor(currentMs / 1000);
          const durSec = Math.floor(durationMs / 1000);
          progressStr = `${Math.floor(curSec / 60)}:${(curSec % 60).toString().padStart(2, '0')}`;
          durationStr = `${Math.floor(durSec / 60)}:${(durSec % 60).toString().padStart(2, '0')}`;
        }

        sceneCtx.fillStyle = '#ff9999';
        sceneCtx.font = 'bold 13px "Share Tech Mono", monospace';
        const musicLine = `${artist} - ${song}`;
        sceneCtx.fillText(musicLine.length > 30 ? musicLine.slice(0, 28) + '..' : musicLine, 36, 120);

        sceneCtx.fillStyle = '#aa3333';
        sceneCtx.font = '12px "Share Tech Mono", monospace';
        sceneCtx.fillText(`[${progressStr} / ${durationStr}]`, 245, 120);
      } else if (p.musicText) {
        sceneCtx.fillStyle = '#aa4444';
        sceneCtx.font = '12px "Share Tech Mono", monospace';
        sceneCtx.fillText(p.musicText, 36, 120);
      }

      // Header Dikey Ayırıcı Çizgi
      sceneCtx.strokeStyle = '#441010';
      sceneCtx.lineWidth = 1;
      sceneCtx.beginPath();
      sceneCtx.moveTo(HEADER_LEFT_WIDTH, 0);
      sceneCtx.lineTo(HEADER_LEFT_WIDTH, HEADER_HEIGHT);
      sceneCtx.stroke();

      // Header Alt Yatay Çizgi
      sceneCtx.strokeStyle = '#661414';
      sceneCtx.lineWidth = 2;
      sceneCtx.beginPath();
      sceneCtx.moveTo(0, HEADER_HEIGHT);
      sceneCtx.lineTo(width, HEADER_HEIGHT);
      sceneCtx.stroke();

      // C. BODY ALANI: PathDrops Labirenti (Tüm ekrana yayılır)
      sceneCtx.drawImage(mazeCanvas, 0, HEADER_HEIGHT, width, Math.max(10, height - HEADER_HEIGHT));


      // D. SAĞ TARAF: ANATOMİ ÇİZİMİNİN KENDİ BOYUTUNDAKİ KARE PANEL ("KAREMİZ")
      // Kullanıcı isteği: "karakteri direkt olduğu gibi bırak, karetmizi anatomi çiziminin boyutuna küçült ama antomi çizimini elleme aynı boyutta kalsın. üstteki yazıları sil, etrafındaki çizgi ve yazılarıda sil. başka bişey yapıcaz buna"
      const bodyH = Math.max(10, height - HEADER_HEIGHT);
      const padX = 18;
      const padY = 12;

      // Karemizin boyutu anatomi çiziminin boyutuyla birebir eşleşir (tam kare)
      const boxH = bodyH - padY * 2;
      const boxW = boxH;
      const boxX = width - padX - boxW;
      const boxY = HEADER_HEIGHT + padY;

      if (boxW > 100 && boxH > 100) {
        sceneCtx.save();
        sceneCtx.beginPath();
        sceneCtx.rect(boxX, boxY, boxW, boxH);
        sceneCtx.clip();

        // 1. BUZLU CAM / BLUR EFEKTİ (Arka plandaki mazeCanvas kutu içinde buzlu cam gibi bulanıklaşır)
        // Kullanıcı isteği: "arka plandaki siyah katmanı kaldır en arkaplan gözüksün. yada cam gibi böyle blurlşu bişey yap o daha iyi."
        sceneCtx.save();
        sceneCtx.filter = 'blur(6px) brightness(0.65)';
        sceneCtx.drawImage(
          mazeCanvas,
          boxX, boxY - HEADER_HEIGHT, boxW, boxH,
          boxX, boxY, boxW, boxH
        );
        sceneCtx.restore();

        // 2. YARI SAYDAM FÜME CAM TINT & VIGNETTE (Arka planı tamamen karartmaz, cam derinliği verir)
        sceneCtx.fillStyle = 'rgba(4, 8, 16, 0.52)';
        sceneCtx.fillRect(boxX, boxY, boxW, boxH);

        const vigGrad = sceneCtx.createRadialGradient(
          boxX + boxW / 2, boxY + boxH / 2, boxH * 0.25,
          boxX + boxW / 2, boxY + boxH / 2, boxH * 0.75
        );
        vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
        sceneCtx.fillStyle = vigGrad;
        sceneCtx.fillRect(boxX, boxY, boxW, boxH);

        // Üst kenar cam parlaması
        const specGrad = sceneCtx.createLinearGradient(boxX, boxY, boxX, boxY + 28);
        specGrad.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
        specGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
        sceneCtx.fillStyle = specGrad;
        sceneCtx.fillRect(boxX, boxY, boxW, 28);

        // İnce Trinitron fosfor ağı / scanlines
        sceneCtx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        for (let y = boxY; y < boxY + boxH; y += 3) {
          sceneCtx.fillRect(boxX, y, boxW, 1.2);
        }
        for (let x = boxX; x < boxX + boxW; x += 3) {
          sceneCtx.fillRect(x, boxY, 1.2, boxH);
        }

        // 3. JAVASCRIPT TYPEWRITER & BURST KOD TERMİNALİ (Hızlı akan, tab girintili, hatalar ve dökümler içeren)
        const termPadX = 16;
        const termPadY = 18;
        const termX = boxX + termPadX;
        const termY = boxY + termPadY;
        const termH = boxH - termPadY * 2;
        const lineH = 14;
        const maxVisible = Math.floor(termH / lineH);

        const linesToRender = [...typeState.completedLines];
        if (currentEvt.mode === 'type' && typeState.lineIdx < currentLines.length) {
          linesToRender.push(currentLines[typeState.lineIdx].slice(0, typeState.charIdx));
        }

        const startIdx = Math.max(0, linesToRender.length - maxVisible);
        const visibleLines = linesToRender.slice(startIdx);

        sceneCtx.save();
        visibleLines.forEach((text, li) => {
          const lY = termY + li * lineH + 10;
          const isCurrent = (li === visibleLines.length - 1 && currentEvt.mode === 'type');
          renderCodeLine(sceneCtx, text, termX, lY, isCurrent, now);
        });
        sceneCtx.restore();

        // 4. ANATOMİ ÇİZİMİ (Holografik neon çizim kodların üzerinde ışıldar)
        const vSize = Math.round(boxH * 1.076);
        const vY = Math.round(boxY - vSize * (32 / 1080));
        const vX = Math.round(boxX + boxW - vSize * (1036 / 1080));

        if (vitruvianLedImg.complete && vitruvianLedImg.naturalWidth > 0) {
          sceneCtx.save();
          // Çift katmanlı LED neon post-processing yayılımı (Elektrik cyan + akkor beyaz çekirdek)
          sceneCtx.shadowColor = 'rgba(0, 240, 255, 0.85)';
          sceneCtx.shadowBlur = 18;
          sceneCtx.globalCompositeOperation = 'screen';
          sceneCtx.drawImage(vitruvianLedImg, vX, vY, vSize, vSize);

          sceneCtx.shadowColor = 'rgba(255, 255, 255, 0.95)';
          sceneCtx.shadowBlur = 6;
          sceneCtx.drawImage(vitruvianLedImg, vX, vY, vSize, vSize);
          sceneCtx.restore();
        }

        sceneCtx.restore(); // clip sonu

        // 4. 4 KÖŞE PARLAK KIRMIZI L-BRAKETLERİ (KAREMİZİN KÖŞELERİNDE ÇİFT GEÇİŞLİ NEON EFEKTİ)
        const bLen = 34; // Braket kol uzunluğu
        const bThick = 4; // Braket kalınlığı
        
        sceneCtx.save();
        sceneCtx.strokeStyle = '#ff2222';
        sceneCtx.lineWidth = bThick;
        sceneCtx.lineCap = 'square';
        sceneCtx.shadowColor = 'rgba(255, 34, 34, 0.95)';
        sceneCtx.shadowBlur = 16;

        // Sol Üst (┌)
        sceneCtx.beginPath();
        sceneCtx.moveTo(boxX, boxY + bLen);
        sceneCtx.lineTo(boxX, boxY);
        sceneCtx.lineTo(boxX + bLen, boxY);
        sceneCtx.stroke();

        // Sağ Üst (┐)
        sceneCtx.beginPath();
        sceneCtx.moveTo(boxX + boxW - bLen, boxY);
        sceneCtx.lineTo(boxX + boxW, boxY);
        sceneCtx.lineTo(boxX + boxW, boxY + bLen);
        sceneCtx.stroke();

        // Sol Alt (└)
        sceneCtx.beginPath();
        sceneCtx.moveTo(boxX, boxY + boxH - bLen);
        sceneCtx.lineTo(boxX, boxY + boxH);
        sceneCtx.lineTo(boxX + bLen, boxY + boxH);
        sceneCtx.stroke();

        // Sağ Alt (┘)
        sceneCtx.beginPath();
        sceneCtx.moveTo(boxX + boxW - bLen, boxY + boxH);
        sceneCtx.lineTo(boxX + boxW, boxY + boxH);
        sceneCtx.lineTo(boxX + boxW, boxY + boxH - bLen);
        sceneCtx.stroke();

        // İkinci geçiş: İç beyaz akkor çekirdek (Gerçek neon tüp hissi)
        sceneCtx.strokeStyle = '#ff9999';
        sceneCtx.lineWidth = 1.5;
        sceneCtx.shadowColor = '#ffffff';
        sceneCtx.shadowBlur = 4;

        // Sol Üst (┌)
        sceneCtx.beginPath();
        sceneCtx.moveTo(boxX, boxY + bLen);
        sceneCtx.lineTo(boxX, boxY);
        sceneCtx.lineTo(boxX + bLen, boxY);
        sceneCtx.stroke();

        // Sağ Üst (┐)
        sceneCtx.beginPath();
        sceneCtx.moveTo(boxX + boxW - bLen, boxY);
        sceneCtx.lineTo(boxX + boxW, boxY);
        sceneCtx.lineTo(boxX + boxW, boxY + bLen);
        sceneCtx.stroke();

        // Sol Alt (└)
        sceneCtx.beginPath();
        sceneCtx.moveTo(boxX, boxY + boxH - bLen);
        sceneCtx.lineTo(boxX, boxY + boxH);
        sceneCtx.lineTo(boxX + bLen, boxY + boxH);
        sceneCtx.stroke();

        // Sağ Alt (┘)
        sceneCtx.beginPath();
        sceneCtx.moveTo(boxX + boxW - bLen, boxY + boxH);
        sceneCtx.lineTo(boxX + boxW, boxY + boxH);
        sceneCtx.lineTo(boxX + boxW, boxY + boxH - bLen);
        sceneCtx.stroke();

        sceneCtx.restore();
      }

      // --- THREE.JS WEBGL RENDER ---
      canvasTexture.needsUpdate = true;
      material.uniforms.uCurvature.value = crtConfig.curvature;
      material.uniforms.uPhosphorGrid.value = crtConfig.phosphorGrid;
      material.uniforms.uVignette.value = crtConfig.vignette;
      renderer.render(scene, camera);

      rafId = requestAnimationFrame(renderLoop);
    }

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      if (destroyMaze) destroyMaze();
      if (destroyMatrix) destroyMatrix();
      renderer.dispose();
      material.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="crt-terminal-wrapper">
      <div className="crt-monitor-bezel" ref={mountRef} />
    </div>
  );
}
