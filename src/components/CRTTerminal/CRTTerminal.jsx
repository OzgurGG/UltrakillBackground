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
 * Ekrandaki TÜM içeriği (Header, SWITCH logosu, Discord avatarı, Spotify sayacı,
 * CultStream matrix akışı ve PathDrops labirentini) tek bir doku olarak alır ve
 * referans fotoğraftaki gibi gerçek 3D fıçı bombesiyle (barrel curvature) büker.
 */

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

  vec2 curve(vec2 uv) {
    vec2 centered = uv - 0.5;
    float aspect = uResolution.x / uResolution.y;
    centered.x *= aspect;
    float r2 = dot(centered, centered);
    centered *= 1.0 + r2 * uCurvature;
    centered.x /= aspect;
    return centered + 0.5;
  }

  void main() {
    vec2 curvedUv = curve(vUv);

    // Kavis sınırlarının dışı: Monitör kasasının içi derin siyah
    if (curvedUv.x < 0.0 || curvedUv.x > 1.0 || curvedUv.y < 0.0 || curvedUv.y > 1.0) {
      gl_FragColor = vec4(0.012, 0.003, 0.003, 1.0);
      return;
    }

    // Bükülmüş koordinattan sahne pikselini oku
    vec4 scene = texture2D(uScene, curvedUv);

    // Kırmızı monokrom fosfor tonlaması (Referans fotoğraftaki o canlı kırmızı tonlar)
    float luma = dot(scene.rgb, vec3(0.299, 0.587, 0.114));
    vec3 phosphor = mix(
      vec3(0.04, 0.006, 0.006), // Derin katot camı tabanı
      vec3(1.0, 0.22, 0.15),   // Parlayan kırmızı fosfor
      luma
    );

    // Orijinal renk nüanslarını harmanla (yeşil/sarı durum simgesi için)
    vec3 color = mix(phosphor, scene.rgb * 1.25, 0.25);

    // Mikroskobik Fosfor Izgarası (Fotoğraftaki 3x3px geometrik dot-matrix ağı)
    if (uPhosphorGrid > 0.01) {
      vec2 pix = curvedUv * uResolution;
      vec2 grid = fract(pix / 3.0);
      float mask = (grid.x < 0.35 || grid.y < 0.35) ? (1.0 - uPhosphorGrid) : 1.0;
      color *= mask;
    }

    // Dışbükey Tüp Küresel Gölgelendirmesi (Vignette)
    vec2 vCent = (curvedUv - 0.5) * 2.0;
    float vig = 1.0 - dot(vCent, vCent) * uVignette;
    color *= clamp(vig, 0.0, 1.0);

    // Cam Kenar Işıması (Glass Rim Glow)
    float edgeDist = min(min(curvedUv.x, 1.0 - curvedUv.x), min(curvedUv.y, 1.0 - curvedUv.y));
    float rim = smoothstep(0.04, 0.0, edgeDist) * 0.15;
    color += vec3(rim * 0.8, rim * 0.1, rim * 0.1);

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

  // Profil verisi referansı (animasyon döngüsünde anlık erişim için)
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

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    // 1. Sahne Tuvali (Tüm arayüz buraya 2D olarak çizilir)
    const sceneCanvas = document.createElement('canvas');
    sceneCanvas.width = width * DPR;
    sceneCanvas.height = height * DPR;
    const sceneCtx = sceneCanvas.getContext('2d');
    sceneCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // 2. Alt Modül Tuvali: Labirent (PathDrops)
    const mazeCanvas = document.createElement('canvas');
    mazeCanvas.width = width * DPR;
    mazeCanvas.height = Math.max(10, height - 90) * DPR;
    mazeCanvas.style.width = width + 'px';
    mazeCanvas.style.height = Math.max(10, height - 90) + 'px';
    const destroyMaze = initPathDrops(mazeCanvas);

    // 3. Alt Modül Tuvali: Header Matrix Akışı (CultStream)
    const matrixCanvas = document.createElement('canvas');
    matrixCanvas.width = Math.max(10, width - 280) * DPR;
    matrixCanvas.height = 90 * DPR;
    matrixCanvas.style.width = Math.max(10, width - 280) + 'px';
    matrixCanvas.style.height = '90px';
    const destroyMatrix = initCultStream(matrixCanvas, 'back');

    // Discord Avatar Resmi
    const avatarImg = new Image();
    avatarImg.crossOrigin = 'anonymous';
    avatarImg.src = profilRef.current.avatarUrl;

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

    // Yeniden Boyutlandırma
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;

      renderer.setSize(width, height);
      material.uniforms.uResolution.value.set(width * DPR, height * DPR);

      sceneCanvas.width = width * DPR;
      sceneCanvas.height = height * DPR;
      sceneCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

      mazeCanvas.width = width * DPR;
      mazeCanvas.height = Math.max(10, height - 90) * DPR;
      mazeCanvas.style.width = width + 'px';
      mazeCanvas.style.height = Math.max(10, height - 90) + 'px';

      matrixCanvas.width = Math.max(10, width - 280) * DPR;
      matrixCanvas.height = 90 * DPR;
      matrixCanvas.style.width = Math.max(10, width - 280) + 'px';
      matrixCanvas.style.height = '90px';
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
      sceneCtx.fillStyle = '#070101';
      sceneCtx.fillRect(0, 0, width, height);

      // A. HEADER SAĞ: CultStream Matrix
      sceneCtx.drawImage(matrixCanvas, 280, 0, Math.max(10, width - 280), 90);

      // B. HEADER SOL PANEL
      sceneCtx.fillStyle = 'rgba(7, 1, 1, 0.9)';
      sceneCtx.fillRect(0, 0, 280, 90);

      // Discord Avatar
      sceneCtx.save();
      sceneCtx.beginPath();
      sceneCtx.arc(48, 38, 22, 0, Math.PI * 2);
      sceneCtx.clip();
      try {
        if (avatarImg.complete && avatarImg.naturalWidth > 0) {
          sceneCtx.drawImage(avatarImg, 26, 16, 44, 44);
        } else {
          sceneCtx.fillStyle = '#222';
          sceneCtx.fillRect(26, 16, 44, 44);
        }
      } catch (e) {}
      sceneCtx.restore();

      // Avatar Border
      sceneCtx.beginPath();
      sceneCtx.arc(48, 38, 22, 0, Math.PI * 2);
      sceneCtx.strokeStyle = '#8f1f1f';
      sceneCtx.lineWidth = 1.5;
      sceneCtx.stroke();

      // Durum Yuvarlağı
      let statusColor = '#747f8d';
      if (p.status === 'online') statusColor = '#43b581';
      else if (p.status === 'idle') statusColor = '#faa61a';
      else if (p.status === 'dnd') statusColor = '#f04747';

      sceneCtx.beginPath();
      sceneCtx.arc(66, 52, 6, 0, Math.PI * 2);
      sceneCtx.fillStyle = statusColor;
      sceneCtx.fill();
      sceneCtx.strokeStyle = '#070101';
      sceneCtx.lineWidth = 2;
      sceneCtx.stroke();

      // Logo: SWITCH
      sceneCtx.fillStyle = '#ff3b3b';
      sceneCtx.font = 'bold 30px "Share Tech Mono", monospace';
      sceneCtx.fillText('SWITCH', 86, 47);

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
        sceneCtx.font = '12px "Share Tech Mono", monospace';
        const musicLine = `${artist} - ${song}`;
        sceneCtx.fillText(musicLine.length > 28 ? musicLine.slice(0, 26) + '..' : musicLine, 24, 78);

        sceneCtx.fillStyle = '#aa3333';
        sceneCtx.font = '11px "Share Tech Mono", monospace';
        sceneCtx.fillText(`[${progressStr} / ${durationStr}]`, 200, 78);
      } else if (p.musicText) {
        sceneCtx.fillStyle = '#aa4444';
        sceneCtx.font = '11px "Share Tech Mono", monospace';
        sceneCtx.fillText(p.musicText, 24, 78);
      }

      // Header Dikey Ayırıcı Çizgi
      sceneCtx.strokeStyle = '#551010';
      sceneCtx.lineWidth = 1;
      sceneCtx.beginPath();
      sceneCtx.moveTo(280, 0);
      sceneCtx.lineTo(280, 90);
      sceneCtx.stroke();

      // Header Alt Yatay Çizgi
      sceneCtx.strokeStyle = '#881818';
      sceneCtx.lineWidth = 2;
      sceneCtx.beginPath();
      sceneCtx.moveTo(0, 90);
      sceneCtx.lineTo(width, 90);
      sceneCtx.stroke();

      // C. BODY ALANI: PathDrops Labirenti
      sceneCtx.drawImage(mazeCanvas, 0, 90, width, Math.max(10, height - 90));

      // --- THREE.JS WEBGL RENDER (BÜKÜM & CRT SHADER) ---
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
    <div className={`crt-terminal-wrapper ${crtConfig.monitorFrame ? 'has-casing' : 'full-screen'}`}>
      <div className="crt-monitor-bezel" ref={mountRef}>
        {/* WebGL Canvas buraya dinamik eklenir */}
      </div>
    </div>
  );
}
