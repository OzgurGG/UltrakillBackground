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
    function renderLoop() {
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


      // D. SAĞ YARI BÖLÜM: BÜYÜK ANATOMİ HUD PANELİ (LED ÇİZİM + ÇIKIŞ ÇİZGİLERİ + KOD BLOKLARI)
      const bodyH = Math.max(10, height - HEADER_HEIGHT);
      const padX = 24;
      const padY = 16;
      
      // Ekranı ikiye bölüyoruz: Sağ bölümün tamamını kaplayan panel
      const cardX = Math.round(width * 0.46);
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

        // 3. ANATOMİ ÇİZİMİNİN KONUMU (Sağ tarafta ferahça yerleşir)
        const vSize = Math.min(cardW * 0.58, cardH * 0.86, 560);
        const vX = cardX + cardW - vSize - 18;
        const vY = cardY + (cardH - vSize) / 2 + 12;

        if (vitruvianLedImg.complete && vitruvianLedImg.naturalWidth > 0) {
          sceneCtx.save();
          // Çift katmanlı LED neon post-processing yayılımı
          sceneCtx.shadowColor = 'rgba(0, 240, 255, 0.85)';
          sceneCtx.shadowBlur = 18;
          sceneCtx.globalCompositeOperation = 'screen';
          sceneCtx.drawImage(vitruvianLedImg, vX, vY, vSize, vSize);

          // Sıcak akkor beyaz çekirdek
          sceneCtx.shadowColor = 'rgba(255, 255, 255, 0.95)';
          sceneCtx.shadowBlur = 6;
          sceneCtx.drawImage(vitruvianLedImg, vX, vY, vSize, vSize);
          sceneCtx.restore();
        }

        // 4. ANATOMİ NOKTALARINDAN ÇIKAN ÇİZGİLER VE KOD BLOKLARI (Referans görseldeki gibi)
        // Çizgilerin çıktığı organ koordinatları (vX, vY, vSize'a bağıntılı)
        const callouts = [
          {
            label: '// 01. OPTIC_VISOR [MK.IV]',
            data: ['FOV: 180° STEREO // REFR: 240Hz', 'TARGET_ACQUISITION: 100% LOCK', 'SPECTRAL: UV / IR / THERMAL'],
            ox: vX + vSize * 0.495, // Kafa / Optik sensör
            oy: vY + vSize * 0.235,
            elbowY: cardY + 54,
            boxY: cardY + 44
          },
          {
            label: '// 02. WING_ARRAY [VECTOR-8]',
            data: ['THRUST: 4,400 N // DYNAMICS: 99.8%', 'DASH_CHARGE: [ III ] READY', 'AERO_STABILIZER: ACTIVE'],
            ox: vX + vSize * 0.325, // Üst Kanat Ucu
            oy: vY + vSize * 0.170,
            elbowY: cardY + 124,
            boxY: cardY + 114
          },
          {
            label: '// 03. REFUELLING_CORE [V1]',
            data: ['FUEL_SOURCE: FRESH_BLOOD', 'ABSORPTION: CONTACT_PLATING', 'CORE_TEMP: 382K // STABLE'],
            ox: vX + vSize * 0.495, // Göğüs Plakası / Çekirdek
            oy: vY + vSize * 0.380,
            elbowY: cardY + 194,
            boxY: cardY + 184
          },
          {
            label: '// 04. MANIPULATOR [FEEDBACKER]',
            data: ['ACTUATOR: HIGH_TORQUE_SERVO', 'PARRY_WINDOW: 0.18s ARMED', 'KINETIC_OUTPUT: MAXIMUM'],
            ox: vX + vSize * 0.180, // Sol Kol / Yumruk
            oy: vY + vSize * 0.340,
            elbowY: cardY + 264,
            boxY: cardY + 254
          },
          {
            label: '// 05. HYDRAULIC_STRUT [TITANIUM]',
            data: ['LOAD_CAPACITY: 12,000 N', 'GROUND_SLAM: CHARGED', 'PRESSURE: 340 BAR // NOMINAL'],
            ox: vX + vSize * 0.380, // Bacak / Hidrolik Eklem
            oy: vY + vSize * 0.690,
            elbowY: cardY + 334,
            boxY: cardY + 324
          }
        ];

        // Sol paneldeki yazı bloklarının X koordinatı ve genişliği
        const textBlockX = cardX + 20;
        const textBlockW = Math.max(160, vX - cardX - 38);

        callouts.forEach((c) => {
          // Lider Çizgisi: Noktadan açılı çıkıp yatay uzanan HUD kılavuz çizgisi
          const elbowX = Math.min(c.ox - 24, textBlockX + textBlockW + 18);

          sceneCtx.save();
          // Neon parıltılı lider çizgisi
          sceneCtx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
          sceneCtx.lineWidth = 1.2;
          sceneCtx.shadowColor = 'rgba(0, 240, 255, 0.8)';
          sceneCtx.shadowBlur = 6;

          sceneCtx.beginPath();
          sceneCtx.moveTo(c.ox, c.oy);
          sceneCtx.lineTo(elbowX, c.elbowY);
          sceneCtx.lineTo(textBlockX + textBlockW, c.elbowY);
          sceneCtx.stroke();

          // Başlangıç hedef noktası (Küçük hedef yuvarlağı)
          sceneCtx.beginPath();
          sceneCtx.arc(c.ox, c.oy, 2.5, 0, Math.PI * 2);
          sceneCtx.fillStyle = '#ffffff';
          sceneCtx.fill();
          sceneCtx.strokeStyle = '#00f0ff';
          sceneCtx.lineWidth = 1.5;
          sceneCtx.stroke();

          // Çizgi ucu küçük terminal karesi
          sceneCtx.fillStyle = '#00f0ff';
          sceneCtx.fillRect(textBlockX + textBlockW - 2, c.elbowY - 2, 4, 4);

          // Kod / Veri Yazı Bloğu
          sceneCtx.font = 'bold 10px "Share Tech Mono", monospace';
          sceneCtx.fillStyle = '#00f0ff';
          sceneCtx.shadowColor = 'rgba(0, 240, 255, 0.6)';
          sceneCtx.shadowBlur = 4;
          sceneCtx.fillText(c.label, textBlockX, c.boxY);
          sceneCtx.shadowBlur = 0;

          sceneCtx.font = '9px "Share Tech Mono", monospace';
          sceneCtx.fillStyle = 'rgba(215, 245, 255, 0.78)';
          c.data.forEach((lineText, li) => {
            sceneCtx.fillText(lineText, textBlockX, c.boxY + 12 + li * 10);
          });

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
