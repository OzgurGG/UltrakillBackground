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

    function drawBadge(ctx, text, x, y, fg, bg) {
      ctx.save();
      ctx.font = 'bold 9px "Share Tech Mono", monospace';
      const tw = ctx.measureText(text).width;
      const pw = tw + 8;
      const ph = 13;
      const px = Math.round(x);
      const py = Math.round(y - 9.5);
      ctx.fillStyle = bg;
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = fg;
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, pw, ph);
      ctx.fillStyle = fg;
      ctx.fillText(text, px + 4, py + 9.5);
      ctx.restore();
      return pw;
    }

    function renderLoop() {
      const now = performance.now();
      const p = profilRef.current;
      if (avatarImg.src !== p.avatarUrl) {
        avatarImg.src = p.avatarUrl;
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


      // D. SAĞ YARI BÖLÜM: BÜYÜK ANATOMİ HUD PANELİ (BORDERLARA UZANAN DEV LED GÖRSEL + KUSURSUZ 45° KILAVUZLAR + ÇEŞİTLENDİRİLMİŞ TELEMETRİ)
      const bodyH = Math.max(10, height - HEADER_HEIGHT);
      const padX = 18;
      const padY = 12;
      
      // Ekranı ikiye bölüyoruz: Sağ bölümü kaplayan geniş panel (~60% genişlik)
      const cardX = Math.round(width * 0.40);
      const cardY = HEADER_HEIGHT + padY;
      const cardW = width - cardX - padX;
      const cardH = bodyH - padY * 2;

      if (cardW > 280 && cardH > 200) {
        // 1. Panel Zemin (Derin saf siyah cam zemin)
        sceneCtx.fillStyle = 'rgba(2, 2, 6, 0.94)';
        sceneCtx.fillRect(cardX, cardY, cardW, cardH);

        // 2. KARENİN İÇİNE TAM EKRAN FİLTRE (Aperture Grille, Scanline, Cam Vignette)
        sceneCtx.save();
        sceneCtx.beginPath();
        sceneCtx.rect(cardX, cardY, cardW, cardH);
        sceneCtx.clip();

        // Cam Köşe Vignette (İçbükey derinlik gölgesi)
        const vigGrad = sceneCtx.createRadialGradient(
          cardX + cardW / 2, cardY + cardH / 2, Math.min(cardW, cardH) * 0.25,
          cardX + cardW / 2, cardY + cardH / 2, Math.max(cardW, cardH) * 0.75
        );
        vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.82)');
        sceneCtx.fillStyle = vigGrad;
        sceneCtx.fillRect(cardX, cardY, cardW, cardH);

        // Yatay Scanlines ve Dikey Izgara (Referans görseldeki Trinitron fosfor ağı)
        sceneCtx.fillStyle = 'rgba(0, 0, 0, 0.26)';
        for (let y = cardY; y < cardY + cardH; y += 3) {
          sceneCtx.fillRect(cardX, y, cardW, 1.2);
        }
        for (let x = cardX; x < cardX + cardW; x += 3) {
          sceneCtx.fillRect(x, cardY, 1.2, cardH);
        }

        // 3. ANATOMİ ÇİZİMİNİN KONUMU (KÖŞELERE VE KENARLARA SIFIRA SIFIR DAYANMIŞ)
        // Kullanıcı isteği: "karakterimizi iyice köçşelere dayayıp sıfıra sıfır yapıp yani sağ üst ve alt köşeylerede sıfıra sıfır yapıp"
        const vSize = Math.round(cardH * 1.076);
        const vY = Math.round(cardY - vSize * (32 / 1080));
        const vX = Math.round(cardX + cardW - vSize * (1036 / 1080));

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

        // 4. SOL HUD TELEMETRİ BÖLÜMÜ
        const textLeft = cardX + 16;
        const textW = Math.max(180, Math.min(290, vX - cardX + 40));
        const textRight = textLeft + textW;

        const topY = cardY + 36;
        const bottomY = cardY + cardH - 18;
        const totalAvailH = bottomY - topY;

        // --- A. SPIDERWEB POLAR HEDEFLEME RADARI (Referans görseldeki üst-sol örümcek ağı radar reticle) ---
        const radarRadius = Math.min(32, Math.max(22, totalAvailH * 0.055));
        const rX = textLeft + radarRadius + 4;
        const rY = topY + radarRadius + 6;
        const rR = radarRadius;

        sceneCtx.save();
        sceneCtx.lineWidth = 1;

        // Eşmerkezli halkalar
        [0.33, 0.66, 1.0].forEach((ratio) => {
          sceneCtx.beginPath();
          sceneCtx.arc(rX, rY, rR * ratio, 0, Math.PI * 2);
          sceneCtx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
          sceneCtx.stroke();
        });

        // 8 kutupsal ışın (Spoke lines)
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          sceneCtx.beginPath();
          sceneCtx.moveTo(rX, rY);
          sceneCtx.lineTo(rX + Math.cos(a) * rR, rY + Math.sin(a) * rR);
          sceneCtx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
          sceneCtx.stroke();
        }
        // Dış örümcek ağı poligonu
        sceneCtx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.1; a += Math.PI / 4) {
          const wx = rX + Math.cos(a) * rR;
          const wy = rY + Math.sin(a) * rR;
          if (a === 0) sceneCtx.moveTo(wx, wy);
          else sceneCtx.lineTo(wx, wy);
        }
        sceneCtx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
        sceneCtx.stroke();

        // Dönen radar tarama çizgisi (Radar sweep line)
        const sweepAngle = (now * 0.0016) % (Math.PI * 2);
        sceneCtx.beginPath();
        sceneCtx.moveTo(rX, rY);
        sceneCtx.lineTo(rX + Math.cos(sweepAngle) * rR, rY + Math.sin(sweepAngle) * rR);
        sceneCtx.strokeStyle = 'rgba(0, 255, 220, 0.85)';
        sceneCtx.shadowColor = '#00f0ff';
        sceneCtx.shadowBlur = 6;
        sceneCtx.stroke();

        // Kilitlenmiş hedef pini (Target ping blip + yankı halkası)
        const pingAngle = 1.15;
        const pingDist = rR * 0.62;
        const pingX = rX + Math.cos(pingAngle) * pingDist;
        const pingY = rY + Math.sin(pingAngle) * pingDist;

        sceneCtx.beginPath();
        sceneCtx.arc(pingX, pingY, 2.5, 0, Math.PI * 2);
        sceneCtx.fillStyle = '#39ff14';
        sceneCtx.shadowColor = '#39ff14';
        sceneCtx.shadowBlur = 6;
        sceneCtx.fill();

        const echoR = 3 + (Math.sin(now * 0.008) * 0.5 + 0.5) * 6;
        sceneCtx.beginPath();
        sceneCtx.arc(pingX, pingY, echoR, 0, Math.PI * 2);
        sceneCtx.strokeStyle = 'rgba(57, 255, 20, 0.6)';
        sceneCtx.lineWidth = 1;
        sceneCtx.stroke();
        sceneCtx.restore();

        // Radar yanı telemetri verileri
        const radTextX = rX + rR + 14;
        sceneCtx.font = 'bold 10px "Share Tech Mono", monospace';
        sceneCtx.fillStyle = '#00f0ff';
        sceneCtx.fillText('POLAR RADAR // SCAN: 60Hz', radTextX, rY - 18);

        drawBadge(sceneCtx, '[ LOCKED ]', radTextX, rY - 4, '#39ff14', '#06240d');

        sceneCtx.font = '9px "Share Tech Mono", monospace';
        sceneCtx.fillStyle = '#ffffff';
        sceneCtx.fillText('AZ: 042.8°  EL: +14.2°', radTextX + 70, rY - 4);

        sceneCtx.fillStyle = 'rgba(180, 235, 255, 0.82)';
        sceneCtx.fillText('RNG: 1,840m  DOPPLER: -12.4m/s', radTextX, rY + 11);

        sceneCtx.font = '8px "Share Tech Mono", monospace';
        sceneCtx.fillStyle = 'rgba(120, 180, 210, 0.7)';
        sceneCtx.fillText('FREQ: 1420.4 MHz [UHF-CH4] // DUAL_BAND', radTextX, rY + 23);

        // --- B. ANATOMİ ORGAN ÇAĞRI NOKTALARI VE ÇEŞİTLENDİRİLMİŞ HUD BLOKLARI ---
        // Piksel centroidleri Sharp ile doğrulanmış birebir koordinatlardır:
        const callouts = [
          {
            title: '// 01. OPTIC_VISOR [MK.IV]',
            badgeText: '[ 240 FPS ]',
            badgeFg: '#00f0ff',
            badgeBg: '#002833',
            tag: '[01_OPTIC]',
            ox: vX + vSize * 0.4986, // V1 Optik Göz
            oy: vY + vSize * 0.2211,
            row1: 'FOV: 180° STEREO // REFR: 240Hz',
            row2: 'SPECTRAL: [ UV / IR / THERMAL ]',
            row3Type: 'bar',
            row3Label: 'ACQUISITION:  ',
            row3Bar: '[██████████] 100%',
            row3Color: '#39ff14'
          },
          {
            title: '// 02. WING_ARRAY [VECTOR-8]',
            badgeText: '[ 4,400 N ]',
            badgeFg: '#ffaa00',
            badgeBg: '#332000',
            tag: '[02_WING]',
            ox: vX + vSize * 0.3017, // Sol Üst Kanat Ucu
            oy: vY + vSize * 0.1233,
            row1: 'DASH CHARGES: [ ◼ ◼ ◼ ] READY',
            row2: 'VECTOR BIAS: -12.4° // GLIDE: OK',
            row3Type: 'bar',
            row3Label: 'STABILIZER:   ',
            row3Bar: '[████████░░] 84%',
            row3Color: '#ffaa00'
          },
          {
            title: '// 03. REFUELLING_CORE [V1]',
            badgeText: '[ FRESH BLOOD ]',
            badgeFg: '#ff3344',
            badgeBg: '#2b060a',
            tag: '[03_CORE]',
            ox: vX + vSize * 0.5012, // Göğüs Plakası / Kan Çekirdeği
            oy: vY + vSize * 0.3295,
            row1: 'ABSORPTION: CONTACT PLATING (99.4%)',
            row2: 'CORE TEMP: 382.4 K // STABLE',
            row3Type: 'bar',
            row3Label: 'HEMATO-RESERVE: ',
            row3Bar: '[████████████░░░░] 74%',
            row3Color: '#ff3344'
          },
          {
            title: '// 04. MANIPULATOR [FEEDBACKER]',
            badgeText: '[ PARRY: 0.18s ]',
            badgeFg: '#ffffff',
            badgeBg: '#003344',
            tag: '[04_HAND]',
            ox: vX + vSize * 0.1329, // Sol Dışa Açık El
            oy: vY + vSize * 0.3158,
            row1: 'SERVO TORQUE: 880 N·m // KINETIC MAX',
            row2: 'CAPACITOR: 1.20 MJ CHARGED',
            row3Type: 'text',
            row3Text: 'HEX: 0x7F40A9 :: PARRY_GATE_READY',
            row3Color: '#55ccaa'
          },
          {
            title: '// 05. HYDRAULIC_STRUT [MK.II]',
            badgeText: '[ 340 BAR ]',
            badgeFg: '#39ff14',
            badgeBg: '#06240d',
            tag: '[05_KNEE]',
            ox: vX + vSize * 0.4209, // Sol Diz / Hidrolik Eklem
            oy: vY + vSize * 0.6385,
            row1: 'LOAD CAPACITY: 14,000 N // TITANIUM',
            row2: 'GROUND SLAM: ARMED // DAMPING: 98%',
            row3Type: 'waveform',
            row3Label: 'RECOIL IMPULSE: ',
            row3Bar: ' ▂▃▅▆▇ [DAMPENED]',
            row3Color: '#00f0ff'
          }
        ];

        const modStartY = rY + rR + 14;
        const modAvailH = bottomY - modStartY;
        const modH = modAvailH / 5;

        callouts.forEach((c, i) => {
          const modBaseY = modStartY + i * modH;
          const headerY = modBaseY + 12;
          const lineY = headerY + 4;

          // 1. KUSURSUZ 45° CAD LİDER ÇİZGİSİ (Organ noktasından çıkar, 45° kırılır, başlık altı çizgiye bağlanır)
          // Kullanıcı isteği: Kırılma noktalarında nokta yok, çizgilerde animasyon yok
          const dy = c.oy - lineY;
          const elbowX = Math.max(textRight + 8, c.ox - Math.abs(dy));

          sceneCtx.save();
          sceneCtx.strokeStyle = 'rgba(0, 240, 255, 0.82)';
          sceneCtx.lineWidth = 1.2;
          sceneCtx.shadowColor = 'rgba(0, 240, 255, 0.7)';
          sceneCtx.shadowBlur = 5;

          sceneCtx.beginPath();
          sceneCtx.moveTo(c.ox, c.oy);
          sceneCtx.lineTo(elbowX, lineY);
          sceneCtx.lineTo(textLeft, lineY);
          sceneCtx.stroke();

          // 2. ORGAN ÇIKIŞ NOKTASINDA HEDEF RETICLE & ETİKET
          sceneCtx.beginPath();
          sceneCtx.arc(c.ox, c.oy, 2, 0, Math.PI * 2);
          sceneCtx.fillStyle = '#ffffff';
          sceneCtx.shadowColor = '#ffffff';
          sceneCtx.shadowBlur = 4;
          sceneCtx.fill();

          sceneCtx.beginPath();
          sceneCtx.arc(c.ox, c.oy, 4.5, 0, Math.PI * 2);
          sceneCtx.strokeStyle = '#00f0ff';
          sceneCtx.lineWidth = 1;
          sceneCtx.shadowColor = 'rgba(0, 240, 255, 0.8)';
          sceneCtx.shadowBlur = 6;
          sceneCtx.stroke();

          sceneCtx.beginPath();
          sceneCtx.moveTo(c.ox - 7, c.oy); sceneCtx.lineTo(c.ox - 4.5, c.oy);
          sceneCtx.moveTo(c.ox + 4.5, c.oy); sceneCtx.lineTo(c.ox + 7, c.oy);
          sceneCtx.moveTo(c.ox, c.oy - 7); sceneCtx.lineTo(c.ox, c.oy - 4.5);
          sceneCtx.moveTo(c.ox, c.oy + 4.5); sceneCtx.lineTo(c.ox, c.oy + 7);
          sceneCtx.stroke();

          sceneCtx.font = '8px "Share Tech Mono", monospace';
          sceneCtx.fillStyle = '#00f0ff';
          sceneCtx.shadowBlur = 0;
          sceneCtx.fillText(c.tag, c.ox + 9, c.oy + 3);

          // 4. KOD / TELEMETRİ YAZI BLOĞU (Çeşitlendirilmiş renkler, ölçüler, göstergeler)
          sceneCtx.font = 'bold 11px "Share Tech Mono", monospace';
          sceneCtx.fillStyle = '#00f0ff';
          sceneCtx.shadowColor = 'rgba(0, 240, 255, 0.6)';
          sceneCtx.shadowBlur = 4;
          sceneCtx.fillText(c.title, textLeft + 4, headerY);
          sceneCtx.shadowBlur = 0;

          // Başlık yanı durum rozeti (Status badge)
          const headerTw = sceneCtx.measureText(c.title).width;
          drawBadge(sceneCtx, c.badgeText, textLeft + headerTw + 12, headerY, c.badgeFg, c.badgeBg);

          // 1. Satır: Ana parametre
          sceneCtx.font = '9px "Share Tech Mono", monospace';
          sceneCtx.fillStyle = 'rgba(225, 245, 255, 0.9)';
          sceneCtx.fillText(c.row1, textLeft + 4, lineY + 12);

          // 2. Satır: Alt ölçüm
          sceneCtx.fillStyle = 'rgba(140, 205, 235, 0.8)';
          sceneCtx.fillText(c.row2, textLeft + 4, lineY + 23);

          // 3. Satır: Özel widget (Progress bar, hex dump veya waveform)
          if (c.row3Type === 'bar') {
            sceneCtx.fillStyle = 'rgba(160, 215, 245, 0.7)';
            sceneCtx.fillText(c.row3Label, textLeft + 4, lineY + 34);
            const labelW = sceneCtx.measureText(c.row3Label).width;
            sceneCtx.fillStyle = c.row3Color;
            sceneCtx.shadowColor = c.row3Color;
            sceneCtx.shadowBlur = 4;
            sceneCtx.fillText(c.row3Bar, textLeft + 4 + labelW, lineY + 34);
            sceneCtx.shadowBlur = 0;
          } else if (c.row3Type === 'waveform') {
            sceneCtx.fillStyle = 'rgba(160, 215, 245, 0.7)';
            sceneCtx.fillText(c.row3Label, textLeft + 4, lineY + 34);
            const labelW = sceneCtx.measureText(c.row3Label).width;
            sceneCtx.fillStyle = c.row3Color;
            sceneCtx.fillText(c.row3Bar, textLeft + 4 + labelW, lineY + 34);
          } else if (c.row3Type === 'text') {
            sceneCtx.fillStyle = c.row3Color;
            sceneCtx.fillText(c.row3Text, textLeft + 4, lineY + 34);
          }

          sceneCtx.restore();
        });

        sceneCtx.restore(); // clip sonu

        // 5. Panel Üst Başlık & Telemetri Çubuğu
        sceneCtx.font = 'bold 12px "Share Tech Mono", monospace';
        sceneCtx.fillStyle = '#00f0ff';
        sceneCtx.shadowColor = 'rgba(0, 240, 255, 0.7)';
        sceneCtx.shadowBlur = 6;
        sceneCtx.fillText('[ SPEC_SYS // V1_ANATOMICAL_ANALYSIS ]', cardX + 18, cardY + 22);
        sceneCtx.shadowBlur = 0;

        // Üst sağ koordinat / aktiflik
        sceneCtx.font = '10px "Share Tech Mono", monospace';
        sceneCtx.fillStyle = 'rgba(0, 240, 255, 0.65)';
        sceneCtx.fillText('HEURISTIC: ACTIVE // SCAN: 60Hz', cardX + cardW - 210, cardY + 22);

        // Cyan LED aktiflik göstergesi
        sceneCtx.beginPath();
        sceneCtx.arc(cardX + cardW - 18, cardY + 18, 4.5, 0, Math.PI * 2);
        sceneCtx.fillStyle = '#00f0ff';
        sceneCtx.shadowColor = '#00f0ff';
        sceneCtx.shadowBlur = 8;
        sceneCtx.fill();
        sceneCtx.shadowBlur = 0;

        // Başlık altı ayırıcı çizgi
        sceneCtx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
        sceneCtx.lineWidth = 1;
        sceneCtx.beginPath();
        sceneCtx.moveTo(cardX + 14, cardY + 28);
        sceneCtx.lineTo(cardX + cardW - 14, cardY + 28);
        sceneCtx.stroke();

        // 6. 4 KÖŞE PARLAK KIRMIZI L-BRAKETLERİ (AYNI NEON POST-PROCESSING EFEKTİ)
        const bLen = 34; // Braket kol uzunluğu
        const bThick = 4; // Braket kalınlığı
        
        // Çift katmanlı neon difüzyon (Anatomi çizgileriyle birebir aynı post-processing)
        sceneCtx.save();
        sceneCtx.strokeStyle = '#ff2222';
        sceneCtx.lineWidth = bThick;
        sceneCtx.lineCap = 'square';
        sceneCtx.shadowColor = 'rgba(255, 34, 34, 0.95)';
        sceneCtx.shadowBlur = 16;

        // Sol Üst (┌)
        sceneCtx.beginPath();
        sceneCtx.moveTo(cardX, cardY + bLen);
        sceneCtx.lineTo(cardX, cardY);
        sceneCtx.lineTo(cardX + bLen, cardY);
        sceneCtx.stroke();

        // Sağ Üst (┐)
        sceneCtx.beginPath();
        sceneCtx.moveTo(cardX + cardW - bLen, cardY);
        sceneCtx.lineTo(cardX + cardW, cardY);
        sceneCtx.lineTo(cardX + cardW, cardY + bLen);
        sceneCtx.stroke();

        // Sol Alt (└)
        sceneCtx.beginPath();
        sceneCtx.moveTo(cardX, cardY + cardH - bLen);
        sceneCtx.lineTo(cardX, cardY + cardH);
        sceneCtx.lineTo(cardX + bLen, cardY + cardH);
        sceneCtx.stroke();

        // Sağ Alt (┘)
        sceneCtx.beginPath();
        sceneCtx.moveTo(cardX + cardW - bLen, cardY + cardH);
        sceneCtx.lineTo(cardX + cardW, cardY + cardH);
        sceneCtx.lineTo(cardX + cardW, cardY + cardH - bLen);
        sceneCtx.stroke();

        // İkinci geçiş: İç beyaz akkor çekirdek (Gerçek neon tüp hissi)
        sceneCtx.strokeStyle = '#ff9999';
        sceneCtx.lineWidth = 1.5;
        sceneCtx.shadowColor = '#ffffff';
        sceneCtx.shadowBlur = 4;

        // Sol Üst (┌)
        sceneCtx.beginPath();
        sceneCtx.moveTo(cardX, cardY + bLen);
        sceneCtx.lineTo(cardX, cardY);
        sceneCtx.lineTo(cardX + bLen, cardY);
        sceneCtx.stroke();

        // Sağ Üst (┐)
        sceneCtx.beginPath();
        sceneCtx.moveTo(cardX + cardW - bLen, cardY);
        sceneCtx.lineTo(cardX + cardW, cardY);
        sceneCtx.lineTo(cardX + cardW, cardY + bLen);
        sceneCtx.stroke();

        // Sol Alt (└)
        sceneCtx.beginPath();
        sceneCtx.moveTo(cardX, cardY + cardH - bLen);
        sceneCtx.lineTo(cardX, cardY + cardH);
        sceneCtx.lineTo(cardX + bLen, cardY + cardH);
        sceneCtx.stroke();

        // Sağ Alt (┘)
        sceneCtx.beginPath();
        sceneCtx.moveTo(cardX + cardW - bLen, cardY + cardH);
        sceneCtx.lineTo(cardX + cardW, cardY + cardH);
        sceneCtx.lineTo(cardX + cardW, cardY + cardH - bLen);
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
