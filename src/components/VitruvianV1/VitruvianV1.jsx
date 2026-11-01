import React from 'react';
import './VitruvianV1.css';

/**
 * VitruvianV1 - Arka plansız, beyaz çizgili ve diffuse parıltılı V1 Vitruvian Man Bileşeni
 */
export default function VitruvianV1({ className = '', glow = true, size }) {
  const style = size ? { width: size, height: size } : {};

  return (
    <div className={`vitruvian-v1-container ${glow ? 'diffuse-glow' : ''} ${className}`} style={style}>
      <img
        src="/vitruvian-v1-white.png"
        alt="Vitruvian Man featuring V1"
        className="vitruvian-v1-img"
      />
    </div>
  );
}

