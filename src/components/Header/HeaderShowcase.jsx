import React, { useMemo } from 'react';
import './HeaderShowcase.css';
import { getRandomBackground } from './backgrounds';

export default function HeaderShowcase() {
  const secim = useMemo(() => {
    return { bg: getRandomBackground() };
  }, []);

  const BackgroundComponent = secim.bg.component;

  return (
    <div className="showcase-konteyner">
      <div className="showcase-layer showcase-layer-back">
        <BackgroundComponent layer="back" />
      </div>

      <div className="showcase-layer showcase-layer-front">
        <BackgroundComponent layer="front" />
      </div>
    </div>
  );
}
