import React, { useState, useEffect, useMemo } from 'react';
import './CRTScreen.css';
import { crtConfig } from '../../config/crtConfig';

/**
 * CRTScreen - Sayfanın Tamamını Tüplü Televizyona (CRT Tube) Dönüştüren Kapsayıcı
 * 
 * - DOM içeriğini (Header, metinler, animasyonlar) optik olarak tüp şeklinde büker (Barrel Distortion).
 * - İnce fosfor tarama çizgileri (scanlines) ve RGB alt piksel ızgarası (aperture grille) uygular.
 * - Katot tüpü köşe kararması (vignette), bombeli cam yansıması ve analog tarama bandı ekler.
 * - crtConfig üzerinden tüm ayarlar anlık olarak değiştirilebilir.
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

        // Fıçı/Tüp kavis formülü: köşelere doğru pikseller dışarı açılır
        const dispX = nx * r2;
        const dispY = ny * r2;

        const r = Math.max(0, Math.min(255, Math.round(128 - dispX * 127)));
        const g = Math.max(0, Math.min(255, Math.round(128 - dispY * 127)));

        const idx = (y * size + x) * 4;
        data[idx] = r;       // R kanalı: Yatay yer değiştirme
        data[idx + 1] = g;   // G kanalı: Dikey yer değiştirme
        data[idx + 2] = 128; // B kanalı: Boş
        data[idx + 3] = 255; // Alpha
      }
    }

    ctx.putImageData(imgData, 0, 0);
    setMapUrl(canvas.toDataURL());
  }, []);

  // Dinamik CSS Değişkenleri
  const cssVariables = useMemo(() => {
    return {
      '--crt-scanlines': crtConfig.scanlines,
      '--crt-rgb-mask': crtConfig.rgbMask,
      '--crt-vignette': crtConfig.vignette,
    };
  }, []);

  // İçeriğe uygulanacak optik filtreler (Bükme + Katot Fosfor Parlaması)
  const contentFilter = useMemo(() => {
    const filters = [];
    if (crtConfig.curvature > 0 && mapUrl) {
      filters.push('url(#crt-barrel-filter)');
    }
    if (crtConfig.glow > 0) {
      filters.push(`contrast(${1 + crtConfig.glow * 0.06})`);
      filters.push(`brightness(${1 + crtConfig.glow * 0.08})`);
      filters.push(`drop-shadow(0 0 ${Math.round(crtConfig.glow * 2)}px rgba(255, 120, 120, ${crtConfig.glow * 0.25}))`);
    }
    return filters.length > 0 ? filters.join(' ') : undefined;
  }, [mapUrl]);

  return (
    <div
      className={`crt-tv-container ${crtConfig.tvBezel ? 'has-bezel' : 'full-screen'}`}
      style={cssVariables}
    >
      {/* SVG Küresel Optik Bükme Filtresi */}
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

      {/* TV Kasası */}
      <div className="crt-chassis">
        {/* Tüplü Cam Ekran */}
        <div className="crt-screen">
          {/* Ekrandaki Tüm Bileşenler (Header ve İçerik) */}
          <div className="crt-content" style={{ filter: contentFilter }}>
            {children}
          </div>

          {/* 1. RGB Alt Piksel Izgarası */}
          {crtConfig.rgbMask > 0 && <div className="crt-layer crt-rgb-mask" />}

          {/* 2. İnce Yatay Tarama Çizgileri */}
          {crtConfig.scanlines > 0 && <div className="crt-layer crt-scanlines" />}

          {/* 3. Dikey Tarama Bandı (Humbar) */}
          {crtConfig.scanlineRoll && <div className="crt-layer crt-beam-roll" />}

          {/* 4. Tüp Köşe Kararması */}
          {crtConfig.vignette > 0 && <div className="crt-layer crt-vignette" />}

          {/* 5. Bombeli Cam Yansıma Işığı */}
          {crtConfig.glassReflection && <div className="crt-layer crt-glass-reflection" />}

          {/* 6. 60Hz Mikro Titreşim */}
          {crtConfig.flicker && <div className="crt-layer crt-flicker" />}
        </div>
      </div>
    </div>
  );
}
