import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { initPathDrops } from '../SnakeGame_PathDrops/PathDrops';
import { initCultStream } from '../Header/backgrounds/CultStream/CultStream';
import { crtConfig } from '../../config/crtConfig';
import { vertexShader, fragmentShader } from './crtShaders';
import { buildFullPepsiMeltdown, REGULAR_EVENTS, PEPSI_DIALOGUE_SRC } from './terminalData';
import { renderCodeLine, drawNeonBrackets, SCRAMBLE_CHARS } from './terminalRenderer';
import './CRTTerminal.css';

export default function CRTTerminal() {
  const mountRef = useRef(null);

  // WebGL ve Kompozit Sahne Motoru
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const DPR = 1;

    // 1. Sahne Tuvali
    const sceneCanvas = document.createElement('canvas');
    sceneCanvas.width = width * DPR;
    sceneCanvas.height = height * DPR;
    const sceneCtx = sceneCanvas.getContext('2d');
    sceneCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // 2. Alt Modul Tuvali: Labirent (PathDrops) - Tam Ekran
    const mazeCanvas = document.createElement('canvas');
    mazeCanvas.width = width * DPR;
    mazeCanvas.height = height * DPR;
    mazeCanvas.style.width = width + 'px';
    mazeCanvas.style.height = height + 'px';
    const destroyMaze = initPathDrops(mazeCanvas);

    // 3. Alt Modul Tuvali: SWITCH Kutusu Arka Plan Matrix Akisi (CultStream)
    const matrixCanvas = document.createElement('canvas');
    let destroyMatrix = null;
    function setupMatrix(mw, mh) {
      if (destroyMatrix) destroyMatrix();
      matrixCanvas.width = Math.max(10, mw) * DPR;
      matrixCanvas.height = Math.max(10, mh) * DPR;
      matrixCanvas.style.width = Math.max(10, mw) + 'px';
      matrixCanvas.style.height = Math.max(10, mh) + 'px';
      destroyMatrix = initCultStream(matrixCanvas, 'back');
    }

    // Vitruvian V1 Optik Efektli Cizim
    const vitruvianLedImg = new Image();
    vitruvianLedImg.src = '/vitruvian-v1-led-cyan.png';

    const zineTextureImg = new Image();
    zineTextureImg.src = '/switch-zine-texture.png';

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

    // 1. Vitruvian Canvas (Cyan Bloom + Crisp White Core - 0ms per-frame CPU Blur)
    let cachedVitruvianCanvas = null;

    function bakeVitruvian() {
      if (!vitruvianLedImg.complete || vitruvianLedImg.naturalWidth === 0) return;
      const size = 1080;
      const pad = 44;
      const c = document.createElement('canvas');
      c.width = size + pad * 2;
      c.height = size + pad * 2;
      const cCtx = c.getContext('2d');
      cCtx.shadowColor = 'rgba(0, 240, 255, 0.88)';
      cCtx.shadowBlur = 18;
      cCtx.drawImage(vitruvianLedImg, pad, pad, size, size);
      cCtx.shadowColor = 'rgba(255, 255, 255, 0.95)';
      cCtx.shadowBlur = 6;
      cCtx.drawImage(vitruvianLedImg, pad, pad, size, size);
      cachedVitruvianCanvas = c;
    }
    vitruvianLedImg.onload = bakeVitruvian;
    if (vitruvianLedImg.complete && vitruvianLedImg.naturalWidth > 0) bakeVitruvian();

    // 2. Sag Kutu Neon Braketler Canvas (Tek seferlik cizim)
    let cachedRightBracketsCanvas = null;
    function bakeRightBrackets(bw, bh) {
      if (bw <= 50 || bh <= 50) return;
      const pad = 12;
      const c = document.createElement('canvas');
      c.width = bw + pad * 2;
      c.height = bh + pad * 2;
      const cCtx = c.getContext('2d');
      drawNeonBrackets(cCtx, pad, pad, bw, bh, 34, 4);
      cachedRightBracketsCanvas = c;
    }

    // 3. Ayrik Kod Terminal Tuvali (Event-Driven Text Buffer)
    const terminalCanvas = document.createElement('canvas');
    const terminalCtx = terminalCanvas.getContext('2d');
    let terminalDirty = true;
    let frameCounter = 0;

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
        uBloom: { value: crtConfig.bloom },
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

      const pX = 18, pY = 16;
      const bBoxH = height - pY * 2;
      const bBoxW = bBoxH;
      const bBoxX = width - pX - bBoxW;
      const bRectW = Math.max(50, (bBoxX - pX) - pX);
      const bRectH = Math.min(135, Math.max(88, Math.round(bBoxH * 0.18)));

      setupMatrix(bRectW, bRectH);
      bakeRightBrackets(bBoxW, bBoxH);

      const tW = Math.max(10, bBoxW - 32);
      const tH = Math.max(10, bBoxH - 36);
      terminalCanvas.width = tW;
      terminalCanvas.height = tH;
      terminalDirty = true;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // 5. Ana Cizim & Bukme Dongusu (60 FPS)
    let rafId;

    const typeState = {
      isTiradeActive: false,
      eventIdx: 0,
      lineIdx: 0,
      charIdx: 0,
      completedLines: [],
      pauseUntil: 0,
      eventsSinceTirade: 0,
      nextTiradeThreshold: 10 + Math.floor(Math.random() * 8)
    };

    function advanceNextEvent() {
      typeState.lineIdx = 0;
      typeState.charIdx = 0;
      typeState.eventsSinceTirade++;

      if (typeState.eventsSinceTirade >= typeState.nextTiradeThreshold) {
        typeState.isTiradeActive = true;
        typeState.eventsSinceTirade = 0;
        typeState.nextTiradeThreshold = 12 + Math.floor(Math.random() * 10);
      } else {
        typeState.eventIdx = (typeState.eventIdx + 1) % REGULAR_EVENTS.length;
      }
    }

    function renderLoop() {
      const now = performance.now();
      frameCounter++;

      // Dinamik Kod, Hata ve Burst Akis Guncellemesi
      const uName = "ozgur";
      let currentEvt;
      let currentLines;
      let tiradeItems = null;

      if (typeState.isTiradeActive) {
        tiradeItems = buildFullPepsiMeltdown(uName);
        currentLines = tiradeItems.map(d => d.text);
        currentEvt = { mode: 'tirade' };
      } else {
        currentEvt = REGULAR_EVENTS[typeState.eventIdx];
        currentLines = currentEvt.lines;
      }

      if (now >= typeState.pauseUntil) {
        terminalDirty = true;
        if (currentEvt.mode === 'tirade') {
          const item = tiradeItems[typeState.lineIdx] || { text: '', delay: 100, isMeltdown: false };
          const currentLine = item.text;
          const charSpeed = item.isMeltdown ? 6 : 3;
          typeState.charIdx = Math.min(currentLine.length, typeState.charIdx + charSpeed);

          if (typeState.charIdx >= currentLine.length) {
            typeState.completedLines.push(currentLine);
            typeState.lineIdx++;
            typeState.charIdx = 0;

            if (typeState.lineIdx >= tiradeItems.length) {
              typeState.completedLines = []; // Ekrani sifirla (CLEAR)
              typeState.lineIdx = 0;
              typeState.charIdx = 0;
              typeState.isTiradeActive = false;
              typeState.pauseUntil = now + 900;
              typeState.eventIdx = (typeState.eventIdx + 1) % REGULAR_EVENTS.length;
            } else {
              const isPreMeltdown = (typeState.lineIdx === PEPSI_DIALOGUE_SRC.length);
              if (isPreMeltdown) {
                typeState.pauseUntil = now + 1400;
              } else {
                typeState.pauseUntil = now + (item.isMeltdown ? Math.max(25, item.delay) : Math.max(70, Math.min(600, item.delay * 2)));
              }
            }
          }
        } else if (currentEvt.mode === 'burst') {
          const burstSize = Math.min(currentLines.length - typeState.lineIdx, 3 + Math.floor(Math.random() * 2));
          for (let b = 0; b < burstSize; b++) {
            typeState.completedLines.push(currentLines[typeState.lineIdx]);
            typeState.lineIdx++;
          }
          if (typeState.lineIdx >= currentLines.length) {
            typeState.pauseUntil = now + 900;
            advanceNextEvent();
          } else {
            typeState.pauseUntil = now + 40;
          }
        } else if (currentEvt.mode === 'error') {
          const errLine = currentLines[typeState.lineIdx] || '';
          typeState.completedLines.push(errLine);
          typeState.lineIdx++;
          if (typeState.lineIdx >= currentLines.length) {
            typeState.pauseUntil = now + 1600;
            advanceNextEvent();
          } else {
            typeState.pauseUntil = now + 90;
          }
        } else if (currentEvt.mode === 'scramble') {
          const currentLine = currentLines[typeState.lineIdx] || '';
          if (typeState.charIdx === 0) {
            const firstNonSpace = currentLine.search(/\S|$/);
            typeState.charIdx = firstNonSpace;
          }
          typeState.charIdx = Math.min(currentLine.length, typeState.charIdx + 3);

          if (typeState.charIdx >= currentLine.length) {
            typeState.completedLines.push(currentLine);
            typeState.lineIdx++;
            typeState.charIdx = 0;
            if (typeState.lineIdx >= currentLines.length) {
              typeState.pauseUntil = now + 900;
              advanceNextEvent();
            } else {
              typeState.pauseUntil = now + 50;
            }
          }
        } else {
          // type mode
          const currentLine = currentLines[typeState.lineIdx] || '';
          if (typeState.charIdx === 0) {
            const firstNonSpace = currentLine.search(/\S|$/);
            typeState.charIdx = firstNonSpace;
          }
          typeState.charIdx = Math.min(currentLine.length, typeState.charIdx + 2);

          if (typeState.charIdx >= currentLine.length) {
            typeState.completedLines.push(currentLine);
            typeState.lineIdx++;
            typeState.charIdx = 0;
            if (typeState.lineIdx >= currentLines.length) {
              typeState.pauseUntil = now + 900;
              advanceNextEvent();
            } else {
              typeState.pauseUntil = now + 50;
            }
          }
        }

        if (typeState.completedLines.length > 45 && !typeState.isTiradeActive) {
          typeState.completedLines = typeState.completedLines.slice(-30);
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

      // B. SOL TARAF: UST YATAY BASLIK BANNERI (Arkasinda Akan CultStream Matrix + SWITCH)
      const rectX = padX;
      const rectY = boxY;
      const rectW = Math.max(50, (boxX - padX) - rectX);
      const rectH = Math.min(135, Math.max(88, Math.round(boxH * 0.18)));

      if (rectW > 60 && rectH > 40) {
        sceneCtx.save();
        sceneCtx.beginPath();
        sceneCtx.rect(rectX, rectY, rectW, rectH);
        sceneCtx.clip();

        // 1. Koyu zemin
        sceneCtx.fillStyle = '#050608';
        sceneCtx.fillRect(rectX, rectY, rectW, rectH);

        // 2. Canli Akan Matrix Akisi (CultStream)
        if (matrixCanvas.width > 0 && matrixCanvas.height > 0) {
          sceneCtx.drawImage(matrixCanvas, rectX, rectY, rectW, rectH);
        }

        // 3. Yari saydam zine dokusu (vintage kagit greni)
        if (zineTextureImg.complete && zineTextureImg.naturalWidth > 0) {
          try {
            sceneCtx.save();
            sceneCtx.globalAlpha = 0.24;
            const pat = sceneCtx.createPattern(zineTextureImg, 'repeat');
            if (pat) {
              sceneCtx.fillStyle = pat;
              sceneCtx.fillRect(rectX, rectY, rectW, rectH);
            }
            sceneCtx.restore();
          } catch (e) {}
        }

        // 4. Koyu karartma katmani (metin okunabilirligi ve derinlik icin)
        sceneCtx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        sceneCtx.fillRect(rectX, rectY, rectW, rectH);

        // 5. 'SWITCH' Yazisi: VCR OSD Mono fontu ile akan matrix'in onunde parildar
        const titleSize = Math.max(34, Math.min(68, Math.floor(rectH * 0.44)));
        sceneCtx.font = `bold ${titleSize}px "VCR OSD Mono", "VCR OST Mono", monospace`;
        sceneCtx.textAlign = 'center';
        sceneCtx.textBaseline = 'middle';
        sceneCtx.fillStyle = '#ede8dc';
        sceneCtx.shadowColor = 'rgba(237, 232, 220, 0.85)';
        sceneCtx.shadowBlur = 12;
        sceneCtx.fillText('SWITCH', rectX + rectW / 2, rectY + rectH / 2);

        // 6. Kose kirmizi neon braketler
        drawNeonBrackets(sceneCtx, rectX, rectY, rectW, rectH, 22, 3);
        sceneCtx.restore();
      }

      // C. SAG TARAF: ANATOMI KARE PANELI
      if (boxW > 100 && boxH > 100) {
        sceneCtx.save();
        sceneCtx.beginPath();
        sceneCtx.rect(boxX, boxY, boxW, boxH);
        sceneCtx.clip();

        // 1. DONANIM HIZLANDIRMALI BUZLU CAM (Throttled 30 FPS Bilinear Blit)
        try {
          if (frameCounter % 2 === 0) {
            frostCtx.drawImage(
              mazeCanvas,
              boxX, boxY, boxW, boxH,
              0, 0, 96, 96
            );
          }
          sceneCtx.save();
          sceneCtx.imageSmoothingEnabled = true;
          sceneCtx.imageSmoothingQuality = 'medium';
          sceneCtx.drawImage(frostCanvas, 0, 0, 96, 96, boxX, boxY, boxW, boxH);
          sceneCtx.restore();
        } catch (e) {}

        // 2. YARI SAYDAM FUME CAM TINT & VIGNETTE
        sceneCtx.fillStyle = 'rgba(2, 6, 12, 0.58)';
        sceneCtx.fillRect(boxX, boxY, boxW, boxH);

        const vigGrad = sceneCtx.createRadialGradient(
          boxX + boxW / 2, boxY + boxH / 2, boxH * 0.2,
          boxX + boxW / 2, boxY + boxH / 2, boxH * 0.72
        );
        vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0.05)');
        vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.72)');
        sceneCtx.fillStyle = vigGrad;
        sceneCtx.fillRect(boxX, boxY, boxW, boxH);

        // Kenar parlamalari
        const specGrad = sceneCtx.createLinearGradient(boxX, boxY, boxX, boxY + 28);
        specGrad.addColorStop(0, 'rgba(0, 240, 255, 0.14)');
        specGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
        sceneCtx.fillStyle = specGrad;
        sceneCtx.fillRect(boxX, boxY, boxW, 28);

        const rimGrad = sceneCtx.createLinearGradient(boxX, boxY + boxH - 24, boxX, boxY + boxH);
        rimGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
        rimGrad.addColorStop(1, 'rgba(0, 240, 255, 0.08)');
        sceneCtx.fillStyle = rimGrad;
        sceneCtx.fillRect(boxX, boxY + boxH - 24, boxW, 24);

        // 3. JAVASCRIPT TYPEWRITER & BURST KOD TERMINALI (Event-Driven Offscreen Buffer)
        const termPadX = 16;
        const termPadY = 18;
        const termX = boxX + termPadX;
        const termY = boxY + termPadY;
        const termW = Math.max(10, boxW - termPadX * 2);
        const termH = Math.max(10, boxH - termPadY * 2);
        const lineH = 14;
        const maxVisible = Math.floor(termH / lineH);

        if (terminalCanvas.width !== termW || terminalCanvas.height !== termH) {
          terminalCanvas.width = termW;
          terminalCanvas.height = termH;
          terminalDirty = true;
        }

        const linesToRender = [...typeState.completedLines];
        if (typeState.lineIdx < currentLines.length) {
          const fullLine = currentLines[typeState.lineIdx];
          if (currentEvt.mode === 'type' || currentEvt.mode === 'tirade') {
            linesToRender.push(fullLine.slice(0, typeState.charIdx));
          } else if (currentEvt.mode === 'scramble') {
            let scrambledTail = '';
            const remaining = fullLine.length - typeState.charIdx;
            const scrambleCount = Math.min(remaining, 6);
            for (let s = 0; s < scrambleCount; s++) {
              scrambledTail += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            }
            linesToRender.push(fullLine.slice(0, typeState.charIdx) + scrambledTail);
          }
        }

        const startIdx = Math.max(0, linesToRender.length - maxVisible);
        const visibleLines = linesToRender.slice(startIdx);

        if (terminalDirty) {
          terminalCtx.clearRect(0, 0, termW, termH);
          visibleLines.forEach((text, li) => {
            const lY = li * lineH + 10;
            const isCurrent = (li === visibleLines.length - 1 && (currentEvt.mode === 'type' || currentEvt.mode === 'scramble' || currentEvt.mode === 'tirade'));
            renderCodeLine(terminalCtx, text, 0, lY, isCurrent, now, termW);
          });
          terminalDirty = false;
        }

        sceneCtx.drawImage(terminalCanvas, termX, termY);

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
        sceneCtx.fillStyle = 'rgba(0, 18, 30, 0.75)';
        sceneCtx.fillRect(chipX, chipY - 10, chipW, chipH);
        sceneCtx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
        sceneCtx.lineWidth = 1;
        sceneCtx.strokeRect(chipX, chipY - 10, chipW, chipH);

        const pulseAlpha = Math.sin(now * 0.007) * 0.4 + 0.6;
        sceneCtx.beginPath();
        sceneCtx.arc(chipX + 8, chipY - 2.5, 2.5, 0, Math.PI * 2);
        sceneCtx.fillStyle = `rgba(0, 240, 255, ${pulseAlpha})`;
        sceneCtx.fill();

        sceneCtx.font = '9px "Share Tech Mono", monospace';
        sceneCtx.fillStyle = '#00f0ff';
        const tickVal = Math.floor(now * 0.06) % 99999;
        sceneCtx.fillText(`TICK:${tickVal.toString().padStart(5, '0')}  SYS:60Hz`, chipX + 16, chipY);
        sceneCtx.restore();

        // 4. ANATOMI CIZIMI (Saf Cyan Fosfor Pariltisi - 0ms CPU Blur)
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

        // 4 KOSE PARLAK KIRMIZI L-BRAKETLERI
        if (cachedRightBracketsCanvas) {
          sceneCtx.drawImage(cachedRightBracketsCanvas, boxX - 12, boxY - 12);
        } else {
          drawNeonBrackets(sceneCtx, boxX, boxY, boxW, boxH, 34, 4);
        }
      }

      // --- THREE.JS WEBGL RENDER ---
      canvasTexture.needsUpdate = true;
      material.uniforms.uCurvature.value = crtConfig.curvature;
      material.uniforms.uPhosphorGrid.value = crtConfig.phosphorGrid;
      material.uniforms.uVignette.value = crtConfig.vignette;
      material.uniforms.uBloom.value = crtConfig.bloom;
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
      <span style={{ fontFamily: "VCR OSD Mono", position: "absolute", opacity: 0, pointerEvents: "none", top: -9999 }}>SWITCH</span>
    </div>
  );
}