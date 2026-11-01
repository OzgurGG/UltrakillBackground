import React from 'react';
import './CyberpunkCard.css';
import VitruvianV1 from '../VitruvianV1/VitruvianV1';

/**
 * CyberpunkCard - 4 Köşeli Vizör Braketli Kare HUD Paneli
 * İçinde LED Işıklandırmalı Vitruvian V1 ve tam ekran CRT/Aperture Grille filtresi barındırır.
 */
export default function CyberpunkCard({ 
  title = "UNIT: V1 // LED_ANATOMY", 
  children, 
  className = '' 
}) {
  return (
    <div className={`reticle-card ${className}`}>
      {/* 4 Köşeyi Temsil Eden Keskin L-Braketleri */}
      <span className="reticle-corner reticle-tl"></span>
      <span className="reticle-corner reticle-tr"></span>
      <span className="reticle-corner reticle-bl"></span>
      <span className="reticle-corner reticle-br"></span>

      {/* Arka plan veri çizgileri */}
      <div className="reticle-bg-telemetry">
        <span>0x7F40 :: LOAD_SEC_01 [V1_KERNEL]</span>
        <span>TRACE.SYS.ACTIVE &gt;&gt; PROTO_ONLINE</span>
        <span>OPTIC.LED.PIPELINE &gt;&gt; EMISSION_100%</span>
        <span>BLOOD_IS_FUEL :: HELL_IS_FULL</span>
      </div>

      {/* Panel Başlığı */}
      <div className="reticle-header">
        <span className="reticle-title">{title}</span>
        <span className="reticle-dot"></span>
      </div>

      {/* İçerik Alanı: LED Anatomi Çizimi */}
      <div className="reticle-content">
        {children || <VitruvianV1 led={true} />}
      </div>

      {/* Bütün Karenin İçine Uygulanan Tam Ekran Filtre (Aperture Grille + Scanlines + Vignette) */}
      <div className="reticle-scanline-mask"></div>
    </div>
  );
}
