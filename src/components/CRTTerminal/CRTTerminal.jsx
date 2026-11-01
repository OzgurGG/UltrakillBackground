import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { LanyardManager } from '../../LanyardManager';
import { initPathDrops } from '../SnakeGame_PathDrops/PathDrops';
import { initCultStream } from '../Header/backgrounds/CultStream/CultStream';
import { crtConfig } from '../../config/crtConfig';
import { vertexShader, fragmentShader } from './crtShaders';
import { buildFullPepsiMeltdown, REGULAR_EVENTS, PEPSI_DIALOGUE_SRC } from './terminalData';
import { renderCodeLine, drawNeonBrackets, SCRAMBLE_CHARS } from './terminalRenderer';
import './CRTTerminal.css';

const HEADER_HEIGHT = 140;
const HEADER_LEFT_WIDTH = 360;

export default function CRTTerminal() {
  const mountRef = useRef(null);
  const [profil, setProfil] = useState({
    avatarUrl: "https://cdn.discordapp.com/embed/avatars/0.png",
    status: "offline",
    musicText: null,
    spotify: null,
    username: "ozgur"
  });

  const profilRef = useRef(profil);
  profilRef.current = profil;

  // Lanyard Baglantisi
  useEffect(() => {
    const manager = new LanyardManager("1092374832856961106", (canliVeri) => {
      if (canliVeri) setProfil(canliVeri);
    });
    manager.connect();
    return () => manager.disconnect();
  }, []);

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

    // 2. Alt Modul Tuvali: Labirent (PathDrops)
    const mazeCanvas = document.createElement('canvas');
    mazeCanvas.width = width * DPR;
    mazeCanvas.height = Math.max(10, height - HEADER_HEIGHT) * DPR;
    mazeCanvas.style.width = width + 'px';
    mazeCanvas.style.height = Math.max(10, height - HEADER_HEIGHT) + 'px';
    const destroyMaze = initPathDrops(mazeCanvas);

    // 3. Alt Modul Tuvali: Header Matrix Akisi (CultStream)
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

    // Vitruvian V1 Optik Efektli Cizim (Cyan & Kirmizi Alarm Halleri)
    const vitruvianLedImg = new Image();
    vitruvianLedImg.src = '/vitruvian-v1-led-cyan.png';

    const vitruvianRedImg = new Image();
    vitruvianRedImg.src = '/vitruvian-v1-led-red.png';

    const zineTextureImg = new Image();
    zineTextureImg.src = '/switch-zine-texture.png';

    // Goz Anomali Videosu (Hata / Meltdown aninda SWITCH arkasinda doner)
    const eyeVideo = document.createElement('video');
    eyeVideo.src = '/eye-anomaly.mp4';
    eyeVideo.muted = true;
    eyeVideo.playsInline = true;
    eyeVideo.preload = 'auto';
    eyeVideo.loop = true;

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

    // 1. Vitruvian Canvas (Cyan Bloom & Kirmizi Meltdown Alarm Halleri)
    let cachedVitruvianCanvas = null;
    let cachedVitruvianRedCanvas = null;

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

    function bakeVitruvianRed() {
      if (!vitruvianRedImg.complete || vitruvianRedImg.naturalWidth === 0) return;
      const size = 1080;
      const pad = 44;
      const c = document.createElement('canvas');
      c.width = size + pad * 2;
      c.height = size + pad * 2;
      const cCtx = c.getContext('2d');
      cCtx.shadowColor = 'rgba(255, 30, 30, 0.95)';
      cCtx.shadowBlur = 22;
      cCtx.drawImage(vitruvianRedImg, pad, pad, size, size);
      cCtx.shadowColor = 'rgba(255, 220, 220, 0.95)';
      cCtx.shadowBlur = 8;
      cCtx.drawImage(vitruvianRedImg, pad, pad, size, size);
      cachedVitruvianRedCanvas = c;
    }
    vitruvianRedImg.onload = bakeVitruvianRed;
    if (vitruvianRedImg.complete && vitruvianRedImg.naturalWidth > 0) bakeVitruvianRed();

    // 2. Sol Header Banner Canvas (Zine Doku + SWITCH + Kirmizi Braketler)
    let cachedBannerCanvas = null;
    function bakeBanner(bw, bh) {
      if (bw <= 60 || bh <= 40) return;
      const c = document.createElement('canvas');
      c.width = bw;
      c.height = bh;
      const cCtx = c.getContext('2d');

      cCtx.fillStyle = '#121316';
      cCtx.fillRect(0, 0, bw, bh);

      if (zineTextureImg.complete && zineTextureImg.naturalWidth > 0) {
        try {
          const pat = cCtx.createPattern(zineTextureImg, 'repeat');
          if (pat) {
            cCtx.fillStyle = pat;
            cCtx.fillRect(0, 0, bw, bh);
          }
        } catch (e) {}
      }

      const titleSize = Math.max(34, Math.min(68, Math.floor(bh * 0.44)));
      cCtx.save();
      cCtx.font = `bold ${titleSize}px "VCR OSD Mono", "VCR OST Mono", monospace`;
      cCtx.textAlign = 'center';
      cCtx.textBaseline = 'middle';
      cCtx.fillStyle = '#ede8dc';
      cCtx.shadowColor = 'rgba(237, 232, 220, 0.45)';
      cCtx.shadowBlur = 8;
      cCtx.fillText('SWITCH', bw / 2, bh / 2);
      cCtx.restore();

      drawNeonBrackets(cCtx, 0, 0, bw, bh, 22, 3);
      cachedBannerCanvas = c;
    }
    zineTextureImg.onload = () => {
      const bH = Math.max(10, height - HEADER_HEIGHT);
      const bBoxH = bH - 24;
      const bBoxW = bBoxH;
      const bBoxX = width - 18 - bBoxW;
      const bRectW = Math.max(50, (bBoxX - 18) - 18);
      const bRectH = Math.min(135, Math.max(88, Math.round(bBoxH * 0.20)));
      bakeBanner(bRectW, bRectH);
    };

    // 3. Sag Kutu Neon Braketler Canvas (Tek seferlik cizim)
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

    // 4. Ayrik Kod Terminal Tuvali (Event-Driven Text Buffer)
    const terminalCanvas = document.createElement('canvas');
    const terminalCtx = terminalCanvas.getContext('2d');
    let terminalDirty = true;
    let frameCounter = 0;

    // 5. Three.js Sahnesi ve WebGL Renderer
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
      mazeCanvas.height = Math.max(10, height - HEADER_HEIGHT) * DPR;
      mazeCanvas.style.width = width + 'px';
      mazeCanvas.style.height = Math.max(10, height - HEADER_HEIGHT) + 'px';

      matrixCanvas.width = Math.max(10, width - HEADER_LEFT_WIDTH) * DPR;
      matrixCanvas.height = HEADER_HEIGHT * DPR;
      matrixCanvas.style.width = Math.max(10, width - HEADER_LEFT_WIDTH) + 'px';
      matrixCanvas.style.height = HEADER_HEIGHT + 'px';

      const bH = Math.max(10, height - HEADER_HEIGHT);
      const pX = 18, pY = 12;
      const bBoxH = bH - pY * 2;
      const bBoxW = bBoxH;
      const bBoxX = width - pX - bBoxW;
      const bRectW = Math.max(50, (bBoxX - pX) - pX);
      const bRectH = Math.min(135, Math.max(88, Math.round(bBoxH * 0.20)));

      bakeBanner(bRectW, bRectH);
      bakeRightBrackets(bBoxW, bBoxH);

      const tW = Math.max(10, bBoxW - 32);
      const tH = Math.max(10, bBoxH - 36);
      terminalCanvas.width = tW;
      terminalCanvas.height = tH;
      terminalDirty = true;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // 6. Ana Cizim & Bukme Dongusu (60 FPS)
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
      const p = profilRef.current;
      if (avatarImg.src !== p.avatarUrl) {
        avatarImg.src = p.avatarUrl;
      }

      // Dinamik Kod, Hata ve Burst Akis Guncellemesi
      const uName = profilRef.current?.username || "ozgur";
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

      // Meltdown kontrolu: Tirad monologu bittikten sonra baslayan hata firtinasi (Clear oncesi)
      const isMeltdownActive = typeState.isTiradeActive && (typeState.lineIdx >= PEPSI_DIALOGUE_SRC.length);

      // Goz Anomali Videosu Yonetimi: Meltdown'da baslar, ekrana clear atildiginda durup sifirlanir
      if (isMeltdownActive) {
        if (eyeVideo.paused) {
          eyeVideo.currentTime = 0;
          eyeVideo.play().catch(() => {});
        }
      } else {
        if (!eyeVideo.paused) {
          eyeVideo.pause();
          eyeVideo.currentTime = 0;
        }
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
              if (!eyeVideo.paused) {
                eyeVideo.pause();
                eyeVideo.currentTime = 0;
              }
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
              typeState.pauseUntil = now + 1200;
              advanceNextEvent();
            } else {
              typeState.pauseUntil = now + 40;
            }
          }
        } else {
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
              typeState.pauseUntil = now + 1300;
              advanceNextEvent();
            } else {
              typeState.pauseUntil = now + 45;
            }
          }
        }

        if (typeState.completedLines.length > 45 && !typeState.isTiradeActive) {
          typeState.completedLines = typeState.completedLines.slice(-30);
        }
      }

      if (currentEvt.mode === 'scramble') {
        terminalDirty = true;
      }

      // --- 2D KOMPOZIT CIZIMI ---
      sceneCtx.fillStyle = '#000000';
      sceneCtx.fillRect(0, 0, width, height);

      // A. HEADER SAG: CultStream Matrix
      sceneCtx.drawImage(matrixCanvas, HEADER_LEFT_WIDTH, 0, Math.max(10, width - HEADER_LEFT_WIDTH), HEADER_HEIGHT);

      // B. HEADER SOL PANEL (LANYARD & LOGO)
      sceneCtx.fillStyle = 'rgba(0, 0, 0, 0.95)';
      sceneCtx.fillRect(0, 0, HEADER_LEFT_WIDTH, HEADER_HEIGHT);

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

      // Durum Yuvarlagi
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

      // Logo: SWITCH (Meltdown glitch etkisi)
      const headerGlitchX = isMeltdownActive ? Math.round((Math.random() - 0.5) * 5) : 0;
      sceneCtx.fillStyle = isMeltdownActive ? ((Math.random() < 0.25) ? '#ffffff' : '#ff1a1a') : '#ff3b3b';
      sceneCtx.font = 'bold 38px "Share Tech Mono", monospace';
      sceneCtx.fillText('SWITCH', avatarCenterX + 44 + headerGlitchX, avatarCenterY + 12);

      // Muzik / Spotify Bilgisi
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

      // Header Dikey & Yatay Ayirici Cizgiler
      sceneCtx.strokeStyle = '#441010';
      sceneCtx.lineWidth = 1;
      sceneCtx.beginPath();
      sceneCtx.moveTo(HEADER_LEFT_WIDTH, 0);
      sceneCtx.lineTo(HEADER_LEFT_WIDTH, HEADER_HEIGHT);
      sceneCtx.stroke();

      sceneCtx.strokeStyle = isMeltdownActive ? '#ff1414' : '#661414';
      sceneCtx.lineWidth = 2;
      sceneCtx.beginPath();
      sceneCtx.moveTo(0, HEADER_HEIGHT);
      sceneCtx.lineTo(width, HEADER_HEIGHT);
      sceneCtx.stroke();

      // C. BODY ALANI: PathDrops Labirenti
      sceneCtx.drawImage(mazeCanvas, 0, HEADER_HEIGHT, width, Math.max(10, height - HEADER_HEIGHT));

      const bodyH = Math.max(10, height - HEADER_HEIGHT);
      const padX = 18;
      const padY = 12;

      // Sag taraf: Anatomi panel boyutu
      const boxH = bodyH - padY * 2;
      const boxW = boxH;
      const boxX = width - padX - boxW;
      const boxY = HEADER_HEIGHT + padY;

      // D1. SOL TARAF: UST YATAY BASLIK BANNERI (Meltdown'da Goz Videosu + SWITCH)
      const rectX = padX;
      const rectY = boxY;
      const rectW = Math.max(50, (boxX - padX) - rectX);
      const rectH = Math.min(135, Math.max(88, Math.round(boxH * 0.20)));

      if (rectW > 60 && rectH > 40) {
        if (isMeltdownActive && eyeVideo.readyState >= 2) {
          sceneCtx.save();
          sceneCtx.beginPath();
          sceneCtx.rect(rectX, rectY, rectW, rectH);
          sceneCtx.clip();

          // 1. Goz Videosu (Goz acilisi video dokusu)
          const vw = eyeVideo.videoWidth || 720;
          const vh = eyeVideo.videoHeight || 480;
          const scale = Math.max(rectW / vw, rectH / vh);
          const dw = vw * scale;
          const dh = vh * scale;
          const dx = rectX + (rectW - dw) / 2;
          const dy = rectY + (rectH - dh) / 2;
          sceneCtx.drawImage(eyeVideo, dx, dy, dw, dh);

          // 2. Hafif karartma ve kontrast katmani
          sceneCtx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          sceneCtx.fillRect(rectX, rectY, rectW, rectH);

          // 3. 'SWITCH' Yazisi: VCR OSD Mono fontu ile gozun onunde stabil, net ve parildayarak durur
          const fontSize = Math.min(Math.round(rectH * 0.42), Math.round(rectW * 0.16));
          sceneCtx.font = `bold ${fontSize}px "VCR OSD Mono", monospace`;
          sceneCtx.textAlign = 'center';
          sceneCtx.textBaseline = 'middle';
          sceneCtx.fillStyle = '#ede8dc';
          sceneCtx.shadowColor = 'rgba(237, 232, 220, 0.75)';
          sceneCtx.shadowBlur = 10;
          sceneCtx.fillText('SWITCH', rectX + rectW / 2, rectY + rectH / 2);

          // 4. Kose kirmizi neon braketler (SWITCH kutusu tamamen stabil ve net kalir)
          drawNeonBrackets(sceneCtx, rectX, rectY, rectW, rectH, 22, 3);
          sceneCtx.restore();
        } else {
          if (cachedBannerCanvas) {
            sceneCtx.drawImage(cachedBannerCanvas, rectX, rectY);
          } else {
            sceneCtx.fillStyle = '#121316';
            sceneCtx.fillRect(rectX, rectY, rectW, rectH);
          }
        }
      }

      // D2. SAG TARAF: ANATOMI KARE PANELI
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
              boxX, Math.max(0, boxY - HEADER_HEIGHT), boxW, boxH,
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
        if (isMeltdownActive) {
          sceneCtx.fillStyle = 'rgba(40, 4, 8, 0.88)';
          sceneCtx.fillRect(chipX, chipY - 10, chipW, chipH);
          sceneCtx.strokeStyle = '#ff2222';
          sceneCtx.lineWidth = 1;
          sceneCtx.strokeRect(chipX, chipY - 10, chipW, chipH);

          const pulseAlert = Math.sin(now * 0.02) * 0.4 + 0.6;
          sceneCtx.beginPath();
          sceneCtx.arc(chipX + 8, chipY - 2.5, 2.5, 0, Math.PI * 2);
          sceneCtx.fillStyle = `rgba(255, 30, 30, ${pulseAlert})`;
          sceneCtx.fill();

          sceneCtx.font = 'bold 9px "Share Tech Mono", monospace';
          sceneCtx.fillStyle = '#ff3333';
          sceneCtx.fillText(`[ANOMALY: 0xDEAD]  ERR_PANIC`, chipX + 16, chipY);
        } else {
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
        }
        sceneCtx.restore();

        // 4. ANATOMI CIZIMI (Meltdown aninda kirmizi alarm + optik jitter)
        const vSize = Math.round(boxH * 1.076);
        const vY = Math.round(boxY - vSize * (32 / 1080));
        const vX = Math.round(boxX + boxW - vSize * (1036 / 1080));

        const vitruvianToDraw = isMeltdownActive
          ? (cachedVitruvianRedCanvas || cachedVitruvianCanvas)
          : cachedVitruvianCanvas;

        if (vitruvianToDraw) {
          const vPad = Math.round(vSize * (44 / 1080));
          const vGlitchX = isMeltdownActive ? Math.round((Math.random() - 0.5) * 8) : 0;
          sceneCtx.save();
          sceneCtx.globalCompositeOperation = 'screen';
          sceneCtx.drawImage(
            vitruvianToDraw,
            vX - vPad + vGlitchX, vY - vPad,
            vSize + vPad * 2, vSize + vPad * 2
          );

          if (isMeltdownActive && Math.random() < 0.35) {
            sceneCtx.globalAlpha = 0.55;
            sceneCtx.drawImage(
              vitruvianToDraw,
              vX - vPad - 6, vY - vPad,
              vSize + vPad * 2, vSize + vPad * 2
            );
          }
          sceneCtx.restore();
        }

        // 5. Meltdown Yatay Scanline Yirtilmalari (Glitch Tears)
        if (isMeltdownActive && Math.random() < 0.45) {
          const tearY = boxY + Math.random() * (boxH - 24);
          const tearH = 3 + Math.random() * 14;
          const tearShift = Math.round((Math.random() - 0.5) * 24);
          try {
            sceneCtx.drawImage(
              sceneCanvas,
              boxX, tearY, boxW, tearH,
              boxX + tearShift, tearY, boxW, tearH
            );
            sceneCtx.fillStyle = 'rgba(255, 30, 50, 0.16)';
            sceneCtx.fillRect(boxX, tearY, boxW, tearH);
          } catch (e) {}
        }

        sceneCtx.restore(); // clip sonu

        // 4 KOSE PARLAK KIRMIZI L-BRAKETLERI
        if (isMeltdownActive && Math.random() < 0.28) {
          drawNeonBrackets(sceneCtx, boxX, boxY, boxW, boxH, 34, 4, '#ffffff', 'rgba(255, 255, 255, 0.95)');
        } else if (cachedRightBracketsCanvas) {
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
      renderer.render(scene, camera);

      rafId = requestAnimationFrame(renderLoop);
    }

    rafId = requestAnimationFrame(renderLoop);

    // Hizli onizleme ve test icin klavye kisayolu (Ctrl + Shift + E)
    const triggerMeltdownTest = () => {
      typeState.isTiradeActive = true;
      typeState.lineIdx = PEPSI_DIALOGUE_SRC.length;
      typeState.charIdx = 0;
      typeState.pauseUntil = 0;
      terminalDirty = true;
    };
    window.__triggerMeltdown = triggerMeltdownTest;

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyE') {
        triggerMeltdownTest();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      delete window.__triggerMeltdown;
      if (!eyeVideo.paused) {
        eyeVideo.pause();
      }
      eyeVideo.src = '';
      
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
