import React from 'react';
import './VitruvianV1.css';

/**
 * VitruvianV1 - LED Işıklandırmalı V1 Çizimi
 * - Neon LED Post-Processing Işıltısı
 * - Yüksek Parlaklıkta Çekirdek + Neon LED Aurası
 */
export default function VitruvianV1({ className = '', led = true, color = 'cyan', size }) {
  const style = size ? { width: size, height: size } : {};
  const imageSrc = color === 'red' ? '/vitruvian-v1-led-red.png' : '/vitruvian-v1-led-cyan.png';

  return (
    <div className={`vitruvian-v1-container ${led ? 'led-fx' : ''} ${className}`} style={style}>
      <img
        src={imageSrc}
        alt="Vitruvian Man featuring V1 with LED neon glow"
        className="vitruvian-v1-img"
      />
    </div>
  );
}
