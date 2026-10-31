import React, { useMemo } from 'react';
import './CRTFilter.css';
import { crtConfig } from '../../config/crtConfig';

/**
 * CRTFilter - Kırmızı Fosforlu Retro Monitör Efekti
 * 
 * - Rastgele gürültü (noise) veya hareketli çizgiler içermez.
 * - Referans görseldeki gibi temiz, net, geometrik mikro fosfor ızgarası (dot-matrix) uygular.
 * - Bombeli monitör kasası, köşe kararması ve kırmızı katot ışıması sağlar.
 */
export default function CRTFilter({ children }) {
  // CSS değişkenleri
  const cssVars = useMemo(() => ({
    '--crt-grid-opacity': crtConfig.phosphorGrid,
    '--crt-vignette-opacity': crtConfig.vignette,
  }), []);

  // İçeriğe uygulanan kırmızı fosfor ışıması (bloom)
  const viewportFilter = useMemo(() => {
    if (crtConfig.glow <= 0) return undefined;
    return `contrast(1.08) brightness(1.15) drop-shadow(0 0 2px rgba(255, 50, 50, ${crtConfig.glow * 0.7}))`;
  }, []);

  return (
    <div
      className={`crt-terminal-root ${crtConfig.monitorFrame ? 'has-frame' : 'full-screen'}`}
      style={cssVars}
    >
      {/* Monitör Kasası */}
      <div className="crt-monitor-casing">
        {/* Bombeli Tüp Camı */}
        <div className="crt-tube-glass">
          {/* Sayfa Elemanları (Header ve Labirent) */}
          <div className="crt-viewport" style={{ filter: viewportFilter }}>
            {children}
          </div>

          {/* 1. Mikroskobik Fosfor Hücre Izgarası (Görseldeki net CRT SCREEN ızgarası) */}
          {crtConfig.phosphorGrid > 0 && <div className="crt-phosphor-grid" />}

          {/* 2. Tüp Köşe Kararması */}
          {crtConfig.vignette > 0 && <div className="crt-vignette" />}

          {/* 3. Cam Yansıma Işığı */}
          {crtConfig.reflection && <div className="crt-glass-glare" />}
        </div>
      </div>
    </div>
  );
}
