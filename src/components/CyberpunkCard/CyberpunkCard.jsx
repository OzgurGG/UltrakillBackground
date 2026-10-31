import React from 'react';
import './CyberpunkCard.css';

/**
 * CyberpunkCard - Saf Vizör Braketli Kare Panel Çerçevesi
 * 
 * - 4 köşedeki parlak kırmızı L-çizgileri (┌ ┐ └ ┘) panelin sınırıdır.
 * - İçi boştur, sahte çizim ve dolgular kaldırılmıştır.
 */
export default function CyberpunkCard({ title, children, className = '' }) {
  return (
    <div className={`reticle-card ${className}`}>
      {/* 4 Köşeyi Temsil Eden Keskin L-Braketleri */}
      <span className="reticle-corner reticle-tl"></span>
      <span className="reticle-corner reticle-tr"></span>
      <span className="reticle-corner reticle-bl"></span>
      <span className="reticle-corner reticle-br"></span>

      {/* İsteğe bağlı başlık */}
      {title && (
        <div className="reticle-header">
          <span className="reticle-title">{title}</span>
        </div>
      )}

      {/* İçi İçerik Yuvası */}
      <div className="reticle-content">
        {children}
      </div>
    </div>
  );
}
