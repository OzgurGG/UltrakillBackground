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

// Gerçek, temiz JavaScript kod blokları (Labirent, CultStream, CRT Shader, V1 Kernel)
const CODE_SNIPPETS = [
  [
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
  ],
  [
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
  ],
  [
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
  ],
  [
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
];

const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'while', 'for',
  'async', 'await', 'class', 'constructor', 'new', 'try', 'catch', 'throw',
  'break', 'super', 'true', 'false', 'null', 'undefined', 'extends'
]);

function renderCodeLine(ctx, text, x, y, isTyping, now) {
  if (text.trim().startsWith('//')) {
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

    // JavaScript Typewriter Motor Durumu
    const typeState = {
      snippetIdx: 0,
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

      // Typewriter Hızlı Kod Akış Güncellemesi
      const currentSnippet = CODE_SNIPPETS[typeState.snippetIdx];
      const currentLine = currentSnippet[typeState.lineIdx] || '';

      if (now >= typeState.pauseUntil) {
        // Satır başındaki tab/boşluk girintilerini anında tüket ve koda başla
        if (typeState.charIdx === 0) {
          const firstNonSpace = currentLine.search(/\S|$/);
          typeState.charIdx = firstNonSpace;
        }

        // Hızlı yazma: her karede 3 karakter ilerle (satır 0.15-0.25 saniyede tamamlanır)
        typeState.charIdx = Math.min(currentLine.length, typeState.charIdx + 3);

        if (typeState.charIdx >= currentLine.length) {
          // Satır tamamlandı
          typeState.completedLines.push(currentLine);
          typeState.lineIdx++;
          typeState.charIdx = 0;

          if (typeState.lineIdx >= currentSnippet.length) {
            // Fonksiyon tamamlandı: 1.5 saniye durakla
            typeState.pauseUntil = now + 1500;
            typeState.lineIdx = 0;
            typeState.snippetIdx = (typeState.snippetIdx + 1) % CODE_SNIPPETS.length;
            if (typeState.completedLines.length > 60) {
              typeState.completedLines = typeState.completedLines.slice(-30);
            }
          } else {
            // Satırlar arası ufak nefes alma süresi (~50ms)
            typeState.pauseUntil = now + 50;
          }
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
        // 1. Panel Zemin (Derin saf siyah cam zemin)
        sceneCtx.fillStyle = 'rgba(2, 2, 6, 0.94)';
        sceneCtx.fillRect(boxX, boxY, boxW, boxH);

        // 2. KARENİN İÇİNE TAM EKRAN FİLTRE (Aperture Grille, Scanline, Cam Vignette)
        sceneCtx.save();
        sceneCtx.beginPath();
        sceneCtx.rect(boxX, boxY, boxW, boxH);
        sceneCtx.clip();

        // Cam Köşe Vignette (İçbükey derinlik gölgesi)
        const vigGrad = sceneCtx.createRadialGradient(
          boxX + boxW / 2, boxY + boxH / 2, boxH * 0.25,
          boxX + boxW / 2, boxY + boxH / 2, boxH * 0.75
        );
        vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.82)');
        sceneCtx.fillStyle = vigGrad;
        sceneCtx.fillRect(boxX, boxY, boxW, boxH);

        // Yatay Scanlines ve Dikey Izgara (Trinitron fosfor ağı)
        sceneCtx.fillStyle = 'rgba(0, 0, 0, 0.26)';
        for (let y = boxY; y < boxY + boxH; y += 3) {
          sceneCtx.fillRect(boxX, y, boxW, 1.2);
        }
        for (let x = boxX; x < boxX + boxW; x += 3) {
          sceneCtx.fillRect(x, boxY, 1.2, boxH);
        }

        // 3. JAVASCRIPT TYPEWRITER KOD TERMİNALİ (Hızlı akan, tab girintili gerçek JS)
        const termPadX = 16;
        const termPadY = 18;
        const termX = boxX + termPadX;
        const termY = boxY + termPadY;
        const termH = boxH - termPadY * 2;
        const lineH = 14;
        const maxVisible = Math.floor(termH / lineH);

        const linesToRender = [...typeState.completedLines];
        if (typeState.lineIdx < currentSnippet.length) {
          linesToRender.push(currentLine.slice(0, typeState.charIdx));
        }

        const startIdx = Math.max(0, linesToRender.length - maxVisible);
        const visibleLines = linesToRender.slice(startIdx);

        sceneCtx.save();
        visibleLines.forEach((text, li) => {
          const lY = termY + li * lineH + 10;
          const isCurrent = (li === visibleLines.length - 1);
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
