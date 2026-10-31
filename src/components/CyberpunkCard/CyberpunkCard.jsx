import React from 'react';
import './CyberpunkCard.css';

/**
 * CyberpunkCard - Saf Vizör Braketli Kart Çerçevesi
 * 
 * - Ekstra kutu border'ı YOKTUR.
 * - 4 köşedeki parlak kırmızı L-çizgileri (┌ ┐ └ ┘) kartın kendi sınırıdır.
 * - İçi boştur, sahte çizim ve dolgular kaldırılmıştır.
 */
export default function CyberpunkCard({ children }) {
  return (
    <div className="reticle-card">
      {/* 4 Köşeyi Temsil Eden Keskin L-Braketleri */}
      <span className="reticle-corner reticle-tl"></span>
      <span className="reticle-corner reticle-tr"></span>
      <span className="reticle-corner reticle-bl"></span>
      <span className="reticle-corner reticle-br"></span>

      {/* İçi Boş İçerik Yuvası */}
      <div className="reticle-content">
        {children}
      </div>
    </div>
  );
}
