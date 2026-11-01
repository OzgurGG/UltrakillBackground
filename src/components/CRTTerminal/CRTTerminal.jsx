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


      // D. MERKEZ KARE PANEL (CYBERPUNK RETICLE CARD + LED ANATOMI + TAM FILTRE)
      const bodyH = Math.max(10, height - HEADER_HEIGHT);
      const cardSize = Math.min(width * 0.72, bodyH * 0.85, 520);
      const cardX = (width - cardSize) / 2;
      const cardY = HEADER_HEIGHT + (bodyH - cardSize) / 2;

      if (cardSize > 140) {
        // 1. Panel Zemin (Derin saf siyah cam zemin)
        sceneCtx.fillStyle = 'rgba(2, 2, 6, 0.92)';
        sceneCtx.fillRect(cardX, cardY, cardSize, cardSize);

        // 2. KARENİN İÇİNE TAM EKRAN FİLTRE (Aperture Grille, Scanline, Cam Vignette)
        sceneCtx.save();
        sceneCtx.beginPath();
        sceneCtx.rect(cardX, cardY, cardSize, cardSize);
        sceneCtx.clip();

        // Cam Köşe Vignette (İçbükey derinlik gölgesi)
        const vigGrad = sceneCtx.createRadialGradient(
          cardX + cardSize / 2, cardY + cardSize / 2, cardSize * 0.25,
          cardX + cardSize / 2, cardY + cardSize / 2, cardSize * 0.72
        );
        vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.78)');
        sceneCtx.fillStyle = vigGrad;
        sceneCtx.fillRect(cardX, cardY, cardSize, cardSize);

        // Yatay Scanlines ve Dikey Izgara (Referans görseldeki Trinitron fosfor ağı)
        sceneCtx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        for (let y = cardY; y < cardY + cardSize; y += 3) {
          sceneCtx.fillRect(cardX, y, cardSize, 1.2);
        }
        for (let x = cardX; x < cardX + cardSize; x += 3) {
          sceneCtx.fillRect(x, cardY, 1.2, cardSize);
        }

        // Arka Plan İnce Telemetri Verileri (Hafif cyan veri çizgileri)
        sceneCtx.font = '10px "Share Tech Mono", monospace';
        sceneCtx.fillStyle = 'rgba(0, 240, 255, 0.14)';
        const codeSnippets = [
          '0x7F40 :: LOAD_SEC_01 [V1_KERNEL]',
          'TRACE.SYS.ACTIVE >> PROTO_ONLINE',
          'OPTIC.LED.PIPELINE >> EMISSION_100%',
          'BLOOD_IS_FUEL :: HELL_IS_FULL'
        ];
        const lineSpacing = (cardSize - 40) / (codeSnippets.length + 1);
        for (let i = 0; i < codeSnippets.length; i++) {
          sceneCtx.fillText(codeSnippets[i], cardX + 20, cardY + 44 + i * lineSpacing);
        }

        // 3. LED ANATOMİ ÇİZİMİ (Neon LED Post-Processing Işıltısı)
        if (vitruvianLedImg.complete && vitruvianLedImg.naturalWidth > 0) {
          const imgPad = 24;
          const imgSize = cardSize - imgPad * 2;
          const imgX = cardX + imgPad;
          const imgY = cardY + imgPad + 6;

          sceneCtx.save();
          // Çok kademeli LED yayılımı (Bloom)
          sceneCtx.shadowColor = 'rgba(0, 240, 255, 0.85)';
          sceneCtx.shadowBlur = 18;
          sceneCtx.globalCompositeOperation = 'screen';
          sceneCtx.drawImage(vitruvianLedImg, imgX, imgY, imgSize, imgSize);

          // İkinci geçiş: Sıcak beyaz çekirdek yoğunluğu
          sceneCtx.shadowColor = 'rgba(255, 255, 255, 0.95)';
          sceneCtx.shadowBlur = 6;
          sceneCtx.drawImage(vitruvianLedImg, imgX, imgY, imgSize, imgSize);
          sceneCtx.restore();
        }

        sceneCtx.restore(); // clip sonu

        // 4. Panel Üst Başlık & Cyan Durum İmleri
        sceneCtx.font = 'bold 12px "Share Tech Mono", monospace';
        sceneCtx.fillStyle = '#00f0ff';
        sceneCtx.shadowColor = 'rgba(0, 240, 255, 0.7)';
        sceneCtx.shadowBlur = 6;
        sceneCtx.fillText('[ UNIT: V1 // LED_ANATOMY ]', cardX + 16, cardY + 22);
        sceneCtx.shadowBlur = 0;

        // Cyan LED aktiflik göstergesi
        sceneCtx.beginPath();
        sceneCtx.arc(cardX + cardSize - 20, cardY + 18, 4.5, 0, Math.PI * 2);
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
        sceneCtx.lineTo(cardX + cardSize - 14, cardY + 28);
        sceneCtx.stroke();

        // 5. 4 Köşe Keskin Parlak Kırmızı L-Braketleri (┌ ┐ └ ┘)
        const bLen = 32; // Braket kol uzunluğu
        const bThick = 4; // Braket et kalınlığı
        sceneCtx.strokeStyle = '#ff2222';
        sceneCtx.lineWidth = bThick;
        sceneCtx.lineCap = 'square';
        sceneCtx.shadowColor = 'rgba(255, 34, 34, 0.95)';
        sceneCtx.shadowBlur = 12;

        // Sol Üst (┌)
        sceneCtx.beginPath();
        sceneCtx.moveTo(cardX, cardY + bLen);
        sceneCtx.lineTo(cardX, cardY);
        sceneCtx.lineTo(cardX + bLen, cardY);
        sceneCtx.stroke();

        // Sağ Üst (┐)
        sceneCtx.beginPath();
        sceneCtx.moveTo(cardX + cardSize - bLen, cardY);
        sceneCtx.lineTo(cardX + cardSize, cardY);
        sceneCtx.lineTo(cardX + cardSize, cardY + bLen);
        sceneCtx.stroke();

        // Sol Alt (└)
        sceneCtx.beginPath();
        sceneCtx.moveTo(cardX, cardY + cardSize - bLen);
        sceneCtx.lineTo(cardX, cardY + cardSize);
        sceneCtx.lineTo(cardX + bLen, cardY + cardSize);
        sceneCtx.stroke();

        // Sağ Alt (┘)
        sceneCtx.beginPath();
        sceneCtx.moveTo(cardX + cardSize - bLen, cardY + cardSize);
        sceneCtx.lineTo(cardX + cardSize, cardY + cardSize);
        sceneCtx.lineTo(cardX + cardSize, cardY + cardSize - bLen);
        sceneCtx.stroke();

        // Shadow sıfırla
        sceneCtx.shadowBlur = 0;
        sceneCtx.shadowColor = 'transparent';
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
