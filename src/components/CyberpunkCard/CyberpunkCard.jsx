import React from 'react';
import './CyberpunkCard.css';
import VitruvianV1 from '../VitruvianV1/VitruvianV1';

/**
 * CyberpunkCard - 4 Köşeli Vizör Braketli Kare HUD Paneli
 * İçinde Optik Efektli (Bloom, Chromatic Aberration, Scanlines) Vitruvian V1 barındırır.
 */
export default function CyberpunkCard({ 
  title = "UNIT: V1 // VITRUVIAN", 
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

      {/* Arka plan amber veri akışı (Referans görseldeki turuncu kodlar) */}
      <div className="reticle-bg-telemetry">
        <span>0x7F40 :: LOAD_SEC_01</span>
        <span>TRACE.SYS.ACTIVE &gt;&gt; PROTO_ONLINE</span>
        <span>FEED_SRC: ULTRAKILL_REMNANT</span>
        <span>BLOOD_IS_FUEL :: HELL_IS_FULL</span>
      </div>

      {/* Panel Başlığı */}
      <div className="reticle-header">
        <span className="reticle-title">{title}</span>
        <span className="reticle-dot"></span>
      </div>

      {/* İçerik Alanı: Vitruvian V1 */}
      <div className="reticle-content">
        {children || <VitruvianV1 optic={true} />}
      </div>

      {/* CRT Izgara Tarama Katmanı */}
      <div className="reticle-scanline-mask"></div>
    </div>
  );
}
