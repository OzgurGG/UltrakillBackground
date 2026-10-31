import React, { useMemo } from 'react';
import './HeaderShowcase.css';
import { getRandomBackground } from './backgrounds';
import { getRandomWord } from './words';

/**
 * HeaderShowcase - Ön Yükleyici Bileşeni
 * 
 * Sayfa her yüklendiğinde (F5):
 *   1. Arkaplan havuzundan rastgele bir arkaplan efekti seçer
 *   2. Kelime havuzundan rastgele bir kelime seçer
 *   3. İkisini birleştirip header'ın sağ bölümünde gösterir
 * 
 * useMemo ile seçimler component mount anında bir kez yapılır,
 * re-render'larda değişmez. Yeni seçim için sayfa yenilenmeli.
 */
export default function HeaderShowcase() {
  const secim = useMemo(() => {
    const bg = getRandomBackground();
    // Metin tamamen kaldırıldı, sadece görsel efekt kullanılacak
    return { bg };
  }, []);

  const BackgroundComponent = secim.bg.component;

  return (
    <div className="showcase-konteyner">
      {/* Seçilen arkaplan efekti (Arka Plan) */}
      <div className="showcase-layer showcase-layer-back">
        <BackgroundComponent layer="back" />
      </div>

      {/* Yazı kısmı kullanıcının isteği üzerine tamamen silindi */}

      {/* Seçilen arkaplan efekti (Ön Plan) */}
      <div className="showcase-layer showcase-layer-front">
        <BackgroundComponent layer="front" />
      </div>
    </div>
  );
}
