import React, { useMemo } from 'react';
import './CRTFilter.css';
import { crtConfig } from '../../config/crtConfig';

/**
 * CRTFilter - Referans Görseldeki Bombeli Tüplü TV Monitörü
 * 
 * - Ekranın 4 kenarı da (üst, alt, sol, sağ) SVG clipPath ile gerçek bir tüplü TV gibi dışa doğru kavislenir (barrel bulge).
 * - Köşeler içeriye doğru çekilirken orta kısımlar dışa doğru kabarır.
 * - 3x3px net mikro fosfor ızgarası (dot-matrix) ve derin dışbükey cam gölgesi (vignette) içerir.
 * - Sıfır rastgele noise / sıfır hareketli parazit.
 */
export default function CRTFilter({ children }) {
  const cssVars = useMemo(() => ({
    '--crt-grid-opacity': crtConfig.phosphorGrid ?? 0.45,
    '--crt-vignette-opacity': crtConfig.vignette ?? 0.88,
  }), []);

  return (
    <div
      className={`crt-monitor-casing ${crtConfig.monitorFrame ? 'has-casing' : 'full-screen'}`}
      style={cssVars}
    >
      {/* Tüplü TV Fıçı Kavis Maskesi: 4 kenar da yay çizer */}
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <clipPath id="crt-tube-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0.03,0.05 Q 0.5,0.008 0.97,0.05 Q 0.992,0.5 0.97,0.95 Q 0.5,0.992 0.03,0.95 Q 0.008,0.5 0.03,0.05 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Monitör Kasası / Bezel */}
      <div className="crt-bezel-outer">
        {/* Bombeli Katot Tüpü Camı (Tüm kenarları kavisli tüplü ekran) */}
        <div className="crt-curved-screen">
          {/* İçerik Sahnesi (Header, Lanyard, Labirent) */}
          <div className="crt-content-stage">
            {children}
          </div>

          {/* 1. Mikroskobik Fosfor Hücre Izgarası (Görseldeki net CRT SCREEN piksel ağı) */}
          {crtConfig.phosphorGrid > 0 && <div className="crt-phosphor-grid" />}

          {/* 2. 3D Tüp Bombesi ve Köşe Kararması (Dışbükey Cam Derinliği) */}
          {crtConfig.vignette > 0 && <div className="crt-vignette-bulge" />}

          {/* 3. Bombeli Cam Yüzey Işıltısı */}
          {crtConfig.reflection && <div className="crt-glass-specular" />}
        </div>
      </div>
    </div>
  );
}
