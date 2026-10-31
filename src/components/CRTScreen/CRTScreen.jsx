import React, { useState, useEffect, useMemo } from 'react';
import './CRTScreen.css';
import { crtConfig } from '../../config/crtConfig';

/**
 * CRTScreen - Yalnızca Küresel Tüp Bombesi (Barrel Curvature) Uygulayan Kapsayıcı
 * 
 * Tarama çizgileri, gezinen şerit, RGB ağı ve parlamalar kaldırılmıştır.
 * Yalnızca ekrandaki tüm öğelerin tüplü ekran gibi dışa doğru kavislenmesini sağlar.
 */
export default function CRTScreen({ children }) {
  const [mapUrl, setMapUrl] = useState('');

  // Küresel Tüp Bombesi (Barrel Distortion) için Displacement Haritası Üretimi
  useEffect(() => {
    if (crtConfig.curvature <= 0) {
      setMapUrl('');
      return;
    }

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    const half = size / 2;
    for (let y = 0; y < size; y++) {
      const ny = (y - half) / half; // -1 to 1
      for (let x = 0; x < size; x++) {
        const nx = (x - half) / half; // -1 to 1
        const r2 = nx * nx + ny * ny;

        // Fıçı/Tüp bombesi formülü: dış kenarlara doğru bükülme
        const dispX = nx * r2;
        const dispY = ny * r2;

        const r = Math.max(0, Math.min(255, Math.round(128 - dispX * 127)));
        const g = Math.max(0, Math.min(255, Math.round(128 - dispY * 127)));

        const idx = (y * size + x) * 4;
        data[idx] = r;       // R kanalı: Yatay bükülme
        data[idx + 1] = g;   // G kanalı: Dikey bükülme
        data[idx + 2] = 128; // B kanalı
        data[idx + 3] = 255; // Alpha
      }
    }

    ctx.putImageData(imgData, 0, 0);
    setMapUrl(canvas.toDataURL());
  }, []);

  const contentFilter = useMemo(() => {
    if (crtConfig.curvature > 0 && mapUrl) {
      return 'url(#crt-barrel-filter)';
    }
    return undefined;
  }, [mapUrl]);

  return (
    <div className="crt-tv-container">
      {/* SVG Küresel Bükme Filtresi */}
      {crtConfig.curvature > 0 && mapUrl && (
        <svg
          className="crt-svg-filter"
          width="0"
          height="0"
          style={{ position: 'absolute', pointerEvents: 'none' }}
        >
          <defs>
            <filter id="crt-barrel-filter" x="-5%" y="-5%" width="110%" height="110%">
              <feImage href={mapUrl} xlinkHref={mapUrl} result="dispMap" preserveAspectRatio="none" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="dispMap"
                scale={crtConfig.curvature}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}

      {/* Tüplü Ekran Alanı */}
      <div className="crt-screen">
        <div className="crt-content" style={{ filter: contentFilter }}>
          {children}
        </div>
      </div>
    </div>
  );
}
