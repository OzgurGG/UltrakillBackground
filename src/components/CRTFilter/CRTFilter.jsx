import React from 'react';
import { crtConfig } from '../../config/crtConfig';
import './CRTFilter.css';

/**
 * Küresel Tüp Bombesi (Barrel Distortion) için Displacement Haritası Üretimi.
 * Modül yüklendiği anda senkron üretilir; böylece tarayıcı filtresi ilk renderda derlenir.
 */
function createBarrelMapDataUri(size = 128) {
  if (typeof document === 'undefined') return '';

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

      // Fıçı/Tüp bombesi formülü:
      // Kenarlardaki pikseller içeriye doğru örneklenerek dışa doğru küresel bombe oluşturulur.
      const dispX = -nx * r2;
      const dispY = -ny * r2;

      const r = Math.max(0, Math.min(255, Math.round(128 + dispX * 127)));
      const g = Math.max(0, Math.min(255, Math.round(128 + dispY * 127)));

      const idx = (y * size + x) * 4;
      data[idx] = r;       // R: Yatay bükme kanalı
      data[idx + 1] = g;   // G: Dikey bükme kanalı
      data[idx + 2] = 128; // B: Nötr
      data[idx + 3] = 255; // Alpha
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

// İlk render anında hazır olması için modül seviyesinde bir kez oluşturulur
const BARREL_MAP_DATA_URI = createBarrelMapDataUri(128);

/**
 * CRTFilter - Header, Lanyard ve tüm DOM elemanlarını tüplü TV gibi büken bileşen.
 * Boş bir overlay çizmek yerine {children} içine gelen her şeyi doğrudan büker.
 */
export default function CRTFilter({ children }) {
  const isCurved = crtConfig.curvature > 0 && BARREL_MAP_DATA_URI;

  return (
    <div className="crt-filter-wrapper">
      {/* SVG Küresel Optik Bükme Filtresi */}
      {isCurved && (
        <svg
          className="crt-svg-defs"
          width="0"
          height="0"
          style={{ position: 'absolute', pointerEvents: 'none' }}
        >
          <defs>
            <filter id="crt-barrel-lens" x="-10%" y="-10%" width="120%" height="120%">
              <feImage
                href={BARREL_MAP_DATA_URI}
                xlinkHref={BARREL_MAP_DATA_URI}
                result="barrelMap"
                preserveAspectRatio="none"
                x="-10%"
                y="-10%"
                width="120%"
                height="120%"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="barrelMap"
                scale={crtConfig.curvature}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}

      {/* Tüp Bombesinden DOĞRUDAN Etkilenen İçerik (Header, Lanyard, vs.) */}
      <div
        className="crt-screen-content"
        style={{
          filter: isCurved ? 'url(#crt-barrel-lens)' : undefined,
        }}
      >
        {children}
      </div>

      {/* Tüplü Televizyon Cam Çerçevesi (Köşe kavisi ve derin cam gölgesi) */}
      <div className="crt-tube-bezel" />
    </div>
  );
}
