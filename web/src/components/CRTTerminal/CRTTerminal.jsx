import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { initPathDrops } from '../SnakeGame_PathDrops/PathDrops';
import { crtConfig } from '../../config/crtConfig';
import { THEMES, getEffectiveTheme, loadStoredConfig, saveStoredConfig, configChannel } from '../../config/switchConfig';
import { vertexShader, fragmentShader } from './crtShaders';
import { buildFullPepsiMeltdown, generateNextUltrakillEvent, PEPSI_DIALOGUE_SRC } from './terminalData';
import { renderCodeLine, drawNeonBrackets, SCRAMBLE_CHARS } from './terminalRenderer';
import './CRTTerminal.css';

export default function CRTTerminal() {
  const mountRef = useRef(null);
  const [config, setConfig] = useState(() => loadStoredConfig());
  const configRef = useRef(config);
  configRef.current = config;

  // C# Programindan veya Ayarlar Penceresinden Gelen Canli Guncellemeleri Dinle
  useEffect(() => {
    const handleConfigUpdate = (incoming) => {
      if (!incoming) return;
      setConfig((prev) => ({ ...prev, ...incoming }));
    };

    if (configChannel) {
      configChannel.onmessage = (e) => {
        handleConfigUpdate(e.data);
      };
    }

    window.setSwitchConfig = (incoming) => {
      handleConfigUpdate(incoming);
    };

    return () => {
      delete window.setSwitchConfig;
      if (configChannel) {
        configChannel.onmessage = null;
      }
    };
  }, []);

  // WebGL ve Kompozit Sahne Motoru
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const DPR = 1;

    const initialTheme = getEffectiveTheme(configRef.current);
    let lastThemeKey = initialTheme.id + '_' + initialTheme.primary;

    // 1. Sahne Tuvali
    const sceneCanvas = document.createElement('canvas');
    sceneCanvas.width = width * DPR;
    sceneCanvas.height = height * DPR;
    const sceneCtx = sceneCanvas.getContext('2d');
    sceneCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // 2. Alt Modul Tuvali: Labirent (PathDrops) - Tek RAF Entegrasyonu
    const mazeCanvas = document.createElement('canvas');
    mazeCanvas.width = width * DPR;
    mazeCanvas.height = height * DPR;
    mazeCanvas.style.width = width + 'px';
    mazeCanvas.style.height = height + 'px';
    const mazeCtrl = initPathDrops(mazeCanvas, false);

    // Vitruvian V1 Optik Efektli Cizim
    const vitruvianLedImg = new Image();
    vitruvianLedImg.src = initialTheme.vitruvianImg;

    if (document.fonts) {
      document.fonts.load('64px "VCR OSD Mono"');
      document.fonts.load('64px "VCR OST Mono"');
    }

    // Donanim hizlandirmali buzlu cam buffer'i (60 FPS GPU downscale)
    const frostCanvas = document.createElement('canvas');
    frostCanvas.width = 96;
    frostCanvas.height = 96;
    const frostCtx = frostCanvas.getContext('2d');

    // Tek seferlik CRT scanline ve izgara deseni
    const scanPatternCanvas = document.createElement('canvas');
    scanPatternCanvas.width = 3;
    scanPatternCanvas.height = 3;
    const spCtx = scanPatternCanvas.getContext('2d');
    spCtx.fillStyle = 'rgba(0, 0, 0, 0.26)';
    spCtx.fillRect(0, 2, 3, 1);
    spCtx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    spCtx.fillRect(2, 0, 1, 3);
    let scanPattern = null;

    // 1. Vitruvian Canvas (Dinamik Neon Bloom + Crisp White Core)
    let cachedVitruvianCanvas = null;

    function bakeVitruvian(thm) {
      if (!vitruvianLedImg.complete || vitruvianLedImg.naturalWidth === 0) return;
      const curThm = thm || THEMES[configRef.current?.theme] || THEMES.cyan;
      const size = 1080;
      const pad = 44;
      const c = document.createElement('canvas');
      c.width = size + pad * 2;
      c.height = size + pad * 2;
      const cCtx = c.getContext('2d');

      // 1. Dis Neon Parilti Aurasi (Glow Aura)
      cCtx.shadowColor = curThm.glowPrimary || 'rgba(0, 240, 255, 0.88)';
      cCtx.shadowBlur = 22;
      cCtx.drawImage(vitruvianLedImg, pad, pad, size, size);

      // 2. Ic Neon Katmani
      cCtx.shadowColor = curThm.primary || 'rgba(0, 240, 255, 0.95)';
      cCtx.shadowBlur = 8;
      cCtx.drawImage(vitruvianLedImg, pad, pad, size, size);

      // 3. Hatlari temanin rengine boya (tint)
      cCtx.save();
      cCtx.globalCompositeOperation = 'source-in';
      cCtx.fillStyle = curThm.primary;
      cCtx.fillRect(0, 0, c.width, c.height);
      cCtx.restore();

      // 4. Net beyaz LED cekirdegi
      cCtx.save();
      cCtx.globalAlpha = 0.72;
      cCtx.drawImage(vitruvianLedImg, pad, pad, size, size);
      cCtx.restore();

      cachedVitruvianCanvas = c;
    }
    vitruvianLedImg.onload = () => {
      const curThm = THEMES[configRef.current?.theme] || THEMES.cyan;
      bakeVitruvian(curThm);
    };
    if (vitruvianLedImg.complete && vitruvianLedImg.naturalWidth > 0) bakeVitruvian(initialTheme);

    // 2. Sag Kutu Neon Braketler Canvas (Dinamik Renk)
    let cachedRightBracketsCanvas = null;
    let bakeDebounceTimer = null;
    function scheduleBake(thm, bw, bh) {
      if (bakeDebounceTimer) clearTimeout(bakeDebounceTimer);
      bakeDebounceTimer = setTimeout(() => {
        bakeDebounceTimer = null;
        bakeVitruvian(thm);
        bakeRightBrackets(bw, bh, thm);
      }, 50);
    }
    function bakeRightBrackets(bw, bh, thm) {
      if (bw <= 50 || bh <= 50) return;
      const curThm = thm || THEMES[configRef.current?.theme] || THEMES.cyan;
      const pad = 12;
      const c = document.createElement('canvas');
      c.width = bw + pad * 2;
      c.height = bh + pad * 2;
      const cCtx = c.getContext('2d');
      drawNeonBrackets(cCtx, pad, pad, bw, bh, 34, 4, curThm.bracketColor, curThm.bracketGlow);
      cachedRightBracketsCanvas = c;
    }

    // 2.6 Onbellekli Gradient Nesneleri (Resize sirasinda guncellenir)
    let cachedVigGrad = null;
    let cachedSpecGrad = null;
    let cachedRimGrad = null;

    // 3. Ayrik Kod Terminal Tuvali (Event-Driven Text Buffer)
    const terminalCanvas = document.createElement('canvas');
    const terminalCtx = terminalCanvas.getContext('2d');
    const blurredTerminalCanvas = document.createElement('canvas');
    const blurredTerminalCtx = blurredTerminalCanvas.getContext('2d');
    let terminalDirty = true;
    let lastAppliedBlur = -1;
    let frameCounter = 0;

    let lastTimeUpdate = 0;
    let cachedTimeStr = '';
    function getCachedTime(now) {
      if (now - lastTimeUpdate > 500) {
        lastTimeUpdate = now;
        const d = new Date();
        cachedTimeStr = d.toTimeString().split(' ')[0];
      }
      return cachedTimeStr;
    }

    // 4. Three.js Sahnesi ve WebGL Renderer (Ultra-Hafif Donanım Hattı)
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false, 
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(DPR);
    renderer.setSize(width, height);
    renderer.domElement.className = 'crt-webgl-canvas';
    container.appendChild(renderer.domElement);

    const canvasTexture = new THREE.CanvasTexture(sceneCanvas);
    canvasTexture.minFilter = THREE.LinearFilter;
    canvasTexture.magFilter = THREE.LinearFilter;
    canvasTexture.generateMipmaps = false;

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

    // Pencere Boyutlandirma
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      renderer.setSize(width, height);
      material.uniforms.uResolution.value.set(width * DPR, height * DPR);

      sceneCanvas.width = width * DPR;
      sceneCanvas.height = height * DPR;
      sceneCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

      mazeCanvas.width = width * DPR;
      mazeCanvas.height = height * DPR;
      mazeCanvas.style.width = width + 'px';
      mazeCanvas.style.height = height + 'px';
      if (mazeCtrl && mazeCtrl.resize) mazeCtrl.resize();

      const pX = 18, pY = 16;
      const bBoxH = height - pY * 2;
      const bBoxW = bBoxH;
      const bBoxX = width - pX - bBoxW;
      const bBoxY = pY;
      const currentThm = THEMES[configRef.current?.theme] || THEMES.cyan;
      bakeRightBrackets(bBoxW, bBoxH, currentThm);

      // Statik Gradient'lari Yalnizca Resize'da Hesapla
      cachedVigGrad = sceneCtx.createRadialGradient(
        bBoxX + bBoxW / 2, bBoxY + bBoxH / 2, bBoxH * 0.2,
        bBoxX + bBoxW / 2, bBoxY + bBoxH / 2, bBoxH * 0.72
      );
      cachedVigGrad.addColorStop(0, 'rgba(0, 0, 0, 0.05)');
      cachedVigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.72)');

      cachedSpecGrad = sceneCtx.createLinearGradient(bBoxX, bBoxY, bBoxX, bBoxY + 28);
      cachedSpecGrad.addColorStop(0, 'rgba(0, 240, 255, 0.14)');
      cachedSpecGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');

      cachedRimGrad = sceneCtx.createLinearGradient(bBoxX, bBoxY + bBoxH - 24, bBoxX, bBoxY + bBoxH);
      cachedRimGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
      cachedRimGrad.addColorStop(1, 'rgba(0, 240, 255, 0.08)');

      const tW = Math.max(10, bBoxW - 32);
      const tH = Math.max(10, bBoxH - 54);
      terminalCanvas.width = tW;
      terminalCanvas.height = tH;
      blurredTerminalCanvas.width = tW;
      blurredTerminalCanvas.height = tH;
      terminalDirty = true;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // 5. Ana Cizim & Bukme Dongusu (30 FPS Sabit Frame-Pacing: CPU ve GPU Tasarrufu)
    let rafId;
    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS; // ~33.33ms
    let lastRenderTime = performance.now();
    let lastFrameTime = performance.now();

    const typeState = {
      isTiradeActive: false,
      cachedTiradeItems: null,
      cachedTiradeLines: null,
      currentEvent: generateNextUltrakillEvent(),
      lineIdx: 0,
      charIdx: 0,
      completedLines: [],
      pauseUntil: 0,
      eventsSinceTirade: 0,
      nextTiradeThreshold: 12 + Math.floor(Math.random() * 8),
      lastConfigUser: configRef.current?.userName || 'ozgur'
    };

    function advanceNextEvent() {
      typeState.lineIdx = 0;
      typeState.charIdx = 0;
      typeState.eventsSinceTirade++;

      if (typeState.eventsSinceTirade >= typeState.nextTiradeThreshold) {
        typeState.isTiradeActive = true;
        typeState.eventsSinceTirade = 0;
        typeState.nextTiradeThreshold = 14 + Math.floor(Math.random() * 10);
        const curUser = configRef.current?.userName || "ozgur";
        typeState.cachedTiradeItems = buildFullPepsiMeltdown(curUser);
        typeState.cachedTiradeLines = typeState.cachedTiradeItems.map(d => d.text);
      } else {
        typeState.currentEvent = generateNextUltrakillEvent();
      }
    }

    const TIRADE_EVENT = { mode: 'tirade' };
    function renderLoop(timestamp) {
      rafId = requestAnimationFrame(renderLoop);

      const now = timestamp || performance.now();
      const elapsed = now - lastRenderTime;

      // 30 FPS Frame-Pacing: 60Hz/144Hz/165Hz ekranlarda fazlalik kareleri atla,
      // CPU raster ve GPU VRAM texture upload yukunu yariya/ucte bire dusur.
      if (elapsed < FRAME_INTERVAL - 3) {
        return;
      }
      lastRenderTime = now - (elapsed % FRAME_INTERVAL);

      const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
      lastFrameTime = now;
      frameCounter++;

      const cfg = configRef.current;
      const currentTheme = getEffectiveTheme(cfg);

      // A. SENKRONIZE SIMULASYON VE ALT TUVAL CIZIMI (Tek RAF Orkestratoru)
      if (mazeCtrl && mazeCtrl.update) {
        mazeCtrl.update(dt);
        mazeCtrl.draw();
      }

      // Dinamik Kod, Hata ve Burst Akis Guncellemesi
      const uName = cfg?.userName || "ozgur";
      if (typeState.lastConfigUser !== uName) {
        typeState.lastConfigUser = uName;
        typeState.cachedTiradeItems = null;
        typeState.cachedTiradeLines = null;
      }
      let currentEvt;
      let currentLines;
      let tiradeItems = null;

      if (typeState.isTiradeActive) {
        if (!typeState.cachedTiradeItems) {
          typeState.cachedTiradeItems = buildFullPepsiMeltdown(uName);
          typeState.cachedTiradeLines = typeState.cachedTiradeItems.map(d => d.text);
        }
        tiradeItems = typeState.cachedTiradeItems;
        currentLines = typeState.cachedTiradeLines;
        currentEvt = TIRADE_EVENT;
      } else {
        if (!typeState.currentEvent) {
          typeState.currentEvent = generateNextUltrakillEvent();
        }
        currentEvt = typeState.currentEvent;
        currentLines = currentEvt.lines;
      }

      if (now >= typeState.pauseUntil) {
        terminalDirty = true;
        if (currentEvt.mode === 'tirade') {
          const item = tiradeItems[typeState.lineIdx] || { text: '', delay: 100, isMeltdown: false };
          const currentLine = item.text;
          const charSpeed = item.isMeltdown ? 9 : 5;
          typeState.charIdx = Math.min(currentLine.length, typeState.charIdx + charSpeed);

          if (typeState.charIdx >= currentLine.length) {
            typeState.completedLines.push(currentLine);
            typeState.lineIdx++;
            typeState.charIdx = 0;

            if (typeState.lineIdx >= tiradeItems.length) {
              typeState.completedLines.length = 0; // Ekrani sifirla (CLEAR - in-place)
              typeState.lineIdx = 0;
              typeState.charIdx = 0;
              typeState.isTiradeActive = false;
              typeState.cachedTiradeItems = null;
              typeState.cachedTiradeLines = null;
              typeState.pauseUntil = now + 400;
              typeState.currentEvent = generateNextUltrakillEvent();
            } else {
              const isPreMeltdown = (typeState.lineIdx === PEPSI_DIALOGUE_SRC.length);
              if (isPreMeltdown) {
                typeState.pauseUntil = now + 650;
              } else {
                typeState.pauseUntil = now + (item.isMeltdown ? Math.max(15, item.delay * 0.6) : Math.max(40, item.delay * 0.75));
              }
            }
          }
        } else if (currentEvt.mode === 'burst') {
          const burstSize = Math.min(currentLines.length - typeState.lineIdx, 4 + Math.floor(Math.random() * 3));
          for (let b = 0; b < burstSize; b++) {
            typeState.completedLines.push(currentLines[typeState.lineIdx]);
            typeState.lineIdx++;
          }
          if (typeState.lineIdx >= currentLines.length) {
            typeState.pauseUntil = now + 320;
            advanceNextEvent();
          } else {
            typeState.pauseUntil = now + 25;
          }
        } else if (currentEvt.mode === 'error') {
          const errLine = currentLines[typeState.lineIdx] || '';
          typeState.completedLines.push(errLine);
          typeState.lineIdx++;
          if (typeState.lineIdx >= currentLines.length) {
            typeState.pauseUntil = now + 500;
            advanceNextEvent();
          } else {
            typeState.pauseUntil = now + 40;
          }
        } else if (currentEvt.mode === 'scramble') {
          const currentLine = currentLines[typeState.lineIdx] || '';
          if (typeState.charIdx === 0) {
            const firstNonSpace = currentLine.search(/\S|$/);
            typeState.charIdx = firstNonSpace;
          }
          typeState.charIdx = Math.min(currentLine.length, typeState.charIdx + 6);

          if (typeState.charIdx >= currentLine.length) {
            typeState.completedLines.push(currentLine);
            typeState.lineIdx++;
            typeState.charIdx = 0;
            if (typeState.lineIdx >= currentLines.length) {
              typeState.pauseUntil = now + 300;
              advanceNextEvent();
            } else {
              typeState.pauseUntil = now + 25;
            }
          }
        } else {
          // type mode
          const currentLine = currentLines[typeState.lineIdx] || '';
          if (typeState.charIdx === 0) {
            const firstNonSpace = currentLine.search(/\S|$/);
            typeState.charIdx = firstNonSpace;
          }
          typeState.charIdx = Math.min(currentLine.length, typeState.charIdx + 4);

          if (typeState.charIdx >= currentLine.length) {
            typeState.completedLines.push(currentLine);
            typeState.lineIdx++;
            typeState.charIdx = 0;
            if (typeState.lineIdx >= currentLines.length) {
              typeState.pauseUntil = now + 320;
              advanceNextEvent();
            } else {
              typeState.pauseUntil = now + 25;
            }
          }
        }

        if (typeState.completedLines.length > 45 && !typeState.isTiradeActive) {
          typeState.completedLines.splice(0, typeState.completedLines.length - 30);
        }
      }

      // --- 2D KOMPOZIT CIZIMI ---
      sceneCtx.fillStyle = '#000000';
      sceneCtx.fillRect(0, 0, width, height);

      // A. TAM EKRAN: PathDrops Labirenti
      sceneCtx.drawImage(mazeCanvas, 0, 0, width, height);

      const padX = 18;
      const padY = 16;

      // Sag taraf: Anatomi panel boyutu (Tam ekran yukseklik)
      const boxH = height - padY * 2;
      const boxW = boxH;
      const boxX = width - padX - boxW;
      const boxY = padY;

      // Dinamik Tema Degisimi Takibi (Ozel Hex ve Hazir Temalar)
      const currentThemeKey = currentTheme.id + '_' + currentTheme.primary;
      if (lastThemeKey !== currentThemeKey) {
        lastThemeKey = currentThemeKey;
        scheduleBake(currentTheme, boxW, boxH);
      }

      // B. SOL UST: OPERATOR KIMLIGI, CANLI DIJITAL SAAT & TELEMETRI KUTUSU
      if (cfg?.showClock !== false) {
        const topH = 46;
        const maxTopW = 360;
        const availW = boxX - padX * 2;
        const topW = Math.min(maxTopW, availW);

        if (topW > 140) {
          const topX = padX;
          const topY = padY;

          sceneCtx.save();
          // Panel arka plani ve cerceve
          sceneCtx.fillStyle = currentTheme.hudBg || 'rgba(0, 18, 30, 0.75)';
          sceneCtx.fillRect(topX, topY, topW, topH);
          sceneCtx.strokeStyle = currentTheme.hudBorder || 'rgba(0, 240, 255, 0.45)';
          sceneCtx.lineWidth = 1;
          sceneCtx.strokeRect(topX, topY, topW, topH);

          // Neon kose L-braketleri
          drawNeonBrackets(sceneCtx, topX, topY, topW, topH, 8, 2, currentTheme.bracketColor, currentTheme.bracketGlow);

          // Sol minik durum gosterge ledi (pulsing)
          const ledPulse = Math.sin(now * 0.005) * 0.35 + 0.65;
          sceneCtx.beginPath();
          sceneCtx.arc(topX + 12, topY + 16, 2.5, 0, Math.PI * 2);
          sceneCtx.fillStyle = currentTheme.primary;
          sceneCtx.globalAlpha = ledPulse;
          sceneCtx.fill();
          sceneCtx.globalAlpha = 1.0;

          // Logo / Operator Ismi
          sceneCtx.font = 'bold 11px "VCR OSD Mono", "Share Tech Mono", monospace';
          sceneCtx.fillStyle = currentTheme.primary;
          sceneCtx.shadowColor = currentTheme.glowPrimary;
          sceneCtx.shadowBlur = 4;
          const opName = (cfg?.userName || 'V1').toUpperCase();
          sceneCtx.fillText(opName, topX + 22, topY + 19);

          // Canli Saat
          sceneCtx.font = '10px "VCR OSD Mono", "Share Tech Mono", monospace';
          sceneCtx.fillStyle = currentTheme.accent || '#ede8dc';
          sceneCtx.shadowBlur = 0;
          const timeStr = getCachedTime(now);
          sceneCtx.fillText(`TIME: ${timeStr}`, topX + 22, topY + 36);
          sceneCtx.restore();
        }
      }

      // C. SAG TARAF: ANATOMI KARE PANELI
      if (boxW > 100 && boxH > 100) {
        sceneCtx.save();
        sceneCtx.beginPath();
        sceneCtx.rect(boxX, boxY, boxW, boxH);
        sceneCtx.clip();

        // 1. DONANIM HIZLANDIRMALI BUZLU CAM (Throttled 15 FPS)
        try {
          if (frameCounter % 4 === 0) {
            frostCtx.drawImage(
              mazeCanvas,
              boxX, boxY, boxW, boxH,
              0, 0, 96, 96
            );
          }
          sceneCtx.save();
          sceneCtx.imageSmoothingEnabled = true;
          sceneCtx.imageSmoothingQuality = 'low';
          sceneCtx.drawImage(frostCanvas, 0, 0, 96, 96, boxX, boxY, boxW, boxH);
          sceneCtx.restore();
        } catch (e) {}

        // 2. YARI SAYDAM FUME CAM TINT & VIGNETTE (Onbellekli Gradientler)
        sceneCtx.fillStyle = 'rgba(2, 6, 12, 0.58)';
        sceneCtx.fillRect(boxX, boxY, boxW, boxH);

        if (cachedVigGrad) {
          sceneCtx.fillStyle = cachedVigGrad;
          sceneCtx.fillRect(boxX, boxY, boxW, boxH);
        }

        // Kenar parlamalari
        if (cachedSpecGrad) {
          sceneCtx.fillStyle = cachedSpecGrad;
          sceneCtx.fillRect(boxX, boxY, boxW, 28);
        }

        if (cachedRimGrad) {
          sceneCtx.fillStyle = cachedRimGrad;
          sceneCtx.fillRect(boxX, boxY + boxH - 24, boxW, 24);
        }

        // 3. JAVASCRIPT TYPEWRITER & BURST KOD TERMINALI (Event-Driven Offscreen Buffer)
        const termPadX = 16;
        const termPadY = 36;
        const termX = boxX + termPadX;
        const termY = boxY + termPadY;
        const termW = Math.max(10, boxW - termPadX * 2);
        const termH = Math.max(10, boxH - termPadY - 18);
        const lineH = 16;
        const maxVisible = Math.floor(termH / lineH);

        if (terminalCanvas.width !== termW || terminalCanvas.height !== termH) {
          terminalCanvas.width = termW;
          terminalCanvas.height = termH;
          terminalDirty = true;
        }

        if (terminalDirty) {
          terminalCtx.clearRect(0, 0, termW, termH);

          const compCount = typeState.completedLines.length;
          const hasActiveTyping = (typeState.lineIdx < currentLines.length);
          const totalLineCount = compCount + (hasActiveTyping ? 1 : 0);
          const startIdx = Math.max(0, totalLineCount - maxVisible);

          let displayLineIdx = 0;
          for (let i = startIdx; i < totalLineCount; i++) {
            const lY = displayLineIdx * lineH + 10;
            if (i < compCount) {
              renderCodeLine(terminalCtx, typeState.completedLines[i], 0, lY, false, now, termW);
            } else {
              const fullLine = currentLines[typeState.lineIdx] || '';
              let activeText = fullLine.slice(0, typeState.charIdx);
              if (currentEvt.mode === 'scramble') {
                const remaining = fullLine.length - typeState.charIdx;
                const scrambleCount = Math.min(remaining, 6);
                let scrambledTail = '';
                for (let s = 0; s < scrambleCount; s++) {
                  scrambledTail += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
                }
                activeText += scrambledTail;
              }
              const isCurrent = (currentEvt.mode === 'type' || currentEvt.mode === 'scramble' || currentEvt.mode === 'tirade');
              renderCodeLine(terminalCtx, activeText, 0, lY, isCurrent, now, termW);
            }
            displayLineIdx++;
          }

          const blurAmount = (cfg?.codeBlur !== undefined) ? cfg.codeBlur : 0.8;
          if (blurredTerminalCanvas.width !== termW || blurredTerminalCanvas.height !== termH) {
            blurredTerminalCanvas.width = termW;
            blurredTerminalCanvas.height = termH;
          }
          blurredTerminalCtx.clearRect(0, 0, termW, termH);
          if (blurAmount > 0) {
            blurredTerminalCtx.filter = `blur(${blurAmount}px)`;
          } else {
            blurredTerminalCtx.filter = 'none';
          }
          blurredTerminalCtx.drawImage(terminalCanvas, 0, 0);
          blurredTerminalCtx.filter = 'none';
          lastAppliedBlur = blurAmount;

          terminalDirty = false;
        }

        // 3.0 PANEL BASLIGI & AYIRICI HIZALAMA CIZGISI
        sceneCtx.save();
        sceneCtx.font = 'bold 9px "Share Tech Mono", monospace';
        sceneCtx.fillStyle = currentTheme.glowPrimary;
        sceneCtx.shadowColor = currentTheme.primary;
        sceneCtx.shadowBlur = 4;
        sceneCtx.textAlign = 'left';
        sceneCtx.textBaseline = 'middle';
        sceneCtx.fillText('// V1_ANATOMICAL_MATRIX', boxX + 16, boxY + 16);

        sceneCtx.strokeStyle = currentTheme.hudBorder;
        sceneCtx.lineWidth = 1;
        sceneCtx.beginPath();
        sceneCtx.moveTo(boxX + 16, boxY + 28);
        sceneCtx.lineTo(boxX + boxW - 16, boxY + 28);
        sceneCtx.stroke();
        sceneCtx.restore();

        // 3.1 OPTIK YUMUSATILMIS TERMINAL METNI (Sifir GPU Filter Yuklu Dogrudan Blit)
        sceneCtx.save();
        const textOpacity = (cfg?.codeOpacity !== undefined) ? cfg.codeOpacity : 0.85;
        sceneCtx.globalAlpha = textOpacity;
        sceneCtx.drawImage(blurredTerminalCanvas, termX, termY);
        sceneCtx.restore();

        // 3.4 CRT TRINITRON FOSFOR AGI & SCANLINES
        if (!scanPattern) {
          try { scanPattern = sceneCtx.createPattern(scanPatternCanvas, 'repeat'); } catch (e) {}
        }
        if (scanPattern) {
          sceneCtx.fillStyle = scanPattern;
          sceneCtx.fillRect(boxX, boxY, boxW, boxH);
        }

        // 3.5 CANLI KOSE TELEMETRI HUD CIPI
        const chipW = 144;
        const chipH = 15;
        const chipX = boxX + boxW - chipW - 14;
        const chipY = boxY + 14;

        sceneCtx.save();
        sceneCtx.fillStyle = currentTheme.hudBg;
        sceneCtx.fillRect(chipX, chipY - 10, chipW, chipH);
        sceneCtx.strokeStyle = currentTheme.hudBorder;
        sceneCtx.lineWidth = 1;
        sceneCtx.strokeRect(chipX, chipY - 10, chipW, chipH);

        const pulseAlpha = Math.sin(now * 0.007) * 0.4 + 0.6;
        sceneCtx.beginPath();
        sceneCtx.arc(chipX + 8, chipY - 2.5, 2.5, 0, Math.PI * 2);
        sceneCtx.fillStyle = currentTheme.primary;
        sceneCtx.globalAlpha = pulseAlpha;
        sceneCtx.fill();
        sceneCtx.globalAlpha = 1.0;

        sceneCtx.font = '9px "Share Tech Mono", monospace';
        sceneCtx.fillStyle = currentTheme.primary;
        const tickVal = Math.floor(now * 0.06) % 99999;
        sceneCtx.fillText(`TICK:${tickVal.toString().padStart(5, '0')}  SYS:NOMINAL`, chipX + 16, chipY);
        sceneCtx.restore();

        // 4. ANATOMI CIZIMI (Dinamik Neon Fosfor Pariltisi - 0ms CPU Blur)
        const vSize = Math.round(boxH * 1.076);
        const vY = Math.round(boxY - vSize * (32 / 1080));
        const vX = Math.round(boxX + boxW - vSize * (1036 / 1080));

        if (cachedVitruvianCanvas) {
          const vPad = Math.round(vSize * (44 / 1080));
          sceneCtx.save();
          sceneCtx.globalCompositeOperation = 'screen';
          sceneCtx.drawImage(
            cachedVitruvianCanvas,
            vX - vPad, vY - vPad,
            vSize + vPad * 2, vSize + vPad * 2
          );
          sceneCtx.restore();
        }

        sceneCtx.restore(); // clip sonu

        // 4 KOSE PARLAK L-BRAKETLERI
        if (cachedRightBracketsCanvas) {
          sceneCtx.drawImage(cachedRightBracketsCanvas, boxX - 12, boxY - 12);
        } else {
          drawNeonBrackets(sceneCtx, boxX, boxY, boxW, boxH, 34, 4, currentTheme.bracketColor, currentTheme.bracketGlow);
        }
      }

      // --- THREE.JS WEBGL RENDER ---
      canvasTexture.needsUpdate = true;
      material.uniforms.uCurvature.value = (cfg?.crtCurvature !== undefined) ? cfg.crtCurvature : crtConfig.curvature;
      material.uniforms.uPhosphorGrid.value = (cfg?.crtPhosphorGrid !== undefined) ? cfg.crtPhosphorGrid : crtConfig.phosphorGrid;
      material.uniforms.uVignette.value = (cfg?.crtVignette !== undefined) ? cfg.crtVignette : crtConfig.vignette;
      renderer.render(scene, camera);
    }

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      if (mazeCtrl && mazeCtrl.destroy) mazeCtrl.destroy();

      // Three.js eksiksiz VRAM ve nesne temizligi
      scene.remove(quad);
      if (quad.geometry) quad.geometry.dispose();
      material.dispose();
      canvasTexture.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }

      // Event & Image referanslarini kes
      vitruvianLedImg.onload = null;

      // 2D Offscreen Canvas bitmap buffer'larini bellekten dusur
      const zeroCanvas = (c) => {
        if (!c) return;
        c.width = 0;
        c.height = 0;
      };
      zeroCanvas(sceneCanvas);
      zeroCanvas(mazeCanvas);
      zeroCanvas(frostCanvas);
      zeroCanvas(scanPatternCanvas);
      zeroCanvas(terminalCanvas);
      zeroCanvas(blurredTerminalCanvas);
      zeroCanvas(cachedVitruvianCanvas);
      zeroCanvas(cachedRightBracketsCanvas);
    };
  }, []);

  return (
    <div className="crt-terminal-wrapper">
      <div className="crt-monitor-bezel" ref={mountRef} />
      <span style={{ fontFamily: "VCR OSD Mono", position: "absolute", opacity: 0, pointerEvents: "none", top: -9999 }}>ULTRAKILL</span>
    </div>
  );
}