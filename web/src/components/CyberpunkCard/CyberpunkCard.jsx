import React from 'react';
import './CyberpunkCard.css';
import VitruvianV1 from '../VitruvianV1/VitruvianV1';

const CALLOUTS = [
  {
    title: '// 01. OPTIC_VISOR [MK.IV]',
    desc: 'FOV: 180° STEREO // REFR: 240Hz',
    sub: 'TARGET_ACQUISITION: 100% LOCK'
  },
  {
    title: '// 02. WING_ARRAY [VECTOR-8]',
    desc: 'THRUST: 4,400 N // DYNAMICS: 99.8%',
    sub: 'DASH_CHARGE: [ III ] READY'
  },
  {
    title: '// 03. REFUELLING_CORE [V1]',
    desc: 'FUEL_SOURCE: FRESH_BLOOD',
    sub: 'ABSORPTION: CONTACT_PLATING'
  },
  {
    title: '// 04. MANIPULATOR [FEEDBACKER]',
    desc: 'ACTUATOR: HIGH_TORQUE_SERVO',
    sub: 'PARRY_WINDOW: 0.18s ARMED'
  },
  {
    title: '// 05. HYDRAULIC_STRUT [TITANIUM]',
    desc: 'LOAD_CAPACITY: 12,000 N',
    sub: 'GROUND_SLAM: CHARGED'
  }
];

export default function CyberpunkCard({ 
  title = "SPEC_SYS // V1_ANATOMICAL_ANALYSIS", 
  children, 
  className = '' 
}) {
  return (
    <div className={`reticle-card right-half-hud ${className}`}>
      {/* 4 Köşeyi Temsil Eden Keskin L-Braketleri (Neon Bloom Efektiyle) */}
      <span className="reticle-corner reticle-tl"></span>
      <span className="reticle-corner reticle-tr"></span>
      <span className="reticle-corner reticle-bl"></span>
      <span className="reticle-corner reticle-br"></span>

      {/* Panel Başlığı */}
      <div className="reticle-header">
        <span className="reticle-title">{title}</span>
        <div className="reticle-status-badge">
          <span>HEURISTIC: ACTIVE // SCAN: 60Hz</span>
          <span className="reticle-dot"></span>
        </div>
      </div>

      {/* İçerik Alanı: Sol tarafta Veri/Kod Blokları, Sağ tarafta LED Anatomi Çizimi */}
      <div className="reticle-content-split">
        <div className="reticle-callouts-col">
          {CALLOUTS.map((c, i) => (
            <div key={i} className="reticle-callout-item">
              <div className="callout-header">{c.title}</div>
              <div className="callout-text">{c.desc}</div>
              <div className="callout-sub">{c.sub}</div>
              <div className="callout-leader-line"></div>
            </div>
          ))}
        </div>

        <div className="reticle-figure-col">
          {children || <VitruvianV1 led={true} />}
        </div>
      </div>

      {/* Bütün Karenin İçine Uygulanan Tam Ekran Filtre (Aperture Grille + Scanlines + Vignette) */}
      <div className="reticle-scanline-mask"></div>
    </div>
  );
}
