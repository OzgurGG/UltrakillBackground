import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { crtConfig } from '../../config/crtConfig';
import './CRTFilter.css';

/**
 * CRTFilter - Tüplü Televizyon (CRT Tube) Ekran Boğumu & Cam Filtresi
 * 
 * Sıfır hareket, sıfır animasyon.
 * Sadece ekranın o klasik tüplü TV cam bombesini/boğumunu (barrel curvature)
 * ve köşe kararmasını uygular.
 */

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec2 uResolution;
  uniform float uCurvature;
  uniform float uScanlines;
  uniform float uVignette;
  uniform float uGlow;

  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;

    // 1. EKRAN BOĞUMU (Tüplü TV Bombesi / Barrel Curvature)
    vec2 centered = uv - 0.5;
    float distSq = dot(centered, centered);
    uv = centered * (1.0 + distSq * uCurvature) + 0.5;

    // 2. Kavisli CRT Tarama Çizgileri
    float scanline = sin(uv.y * uResolution.y * 1.5) * uScanlines;

    // 3. Tüplü TV Köşe Karartması (Vignette)
    float vig = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
    float vignetteFactor = 1.0 - clamp(pow(16.0 * vig, uVignette), 0.0, 1.0);

    // 4. Kenar Cam Işıması
    float rimGlow = pow(distSq * 2.0, 3.0) * uGlow;

    vec3 color = vec3(rimGlow * 0.4, rimGlow * 0.08, rimGlow * 0.08) - vec3(scanline);
    float alpha = clamp(vignetteFactor * 0.75 + rimGlow * 0.5 + abs(scanline) * 0.4, 0.0, 0.9);

    gl_FragColor = vec4(color, alpha);
  }
`;

export default function CRTFilter() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(DPR);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uResolution: { value: new THREE.Vector2(window.innerWidth * DPR, window.innerHeight * DPR) },
        uCurvature: { value: crtConfig.curvature },
        uScanlines: { value: crtConfig.scanlineIntensity },
        uVignette: { value: crtConfig.vignette },
        uGlow: { value: crtConfig.glow },
      },
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    // Statik render (sürekli hareket eden döngü yok)
    renderer.render(scene, camera);

    // Sadece pencere boyutu değiştiğinde yeniden çiz
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      material.uniforms.uResolution.value.set(w * DPR, h * DPR);
      renderer.render(scene, camera);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      material.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="crt-filter-overlay" />;
}
