import React from 'react';
import './Body.css';
import PathDrops from '../SnakeGame_PathDrops/PathDrops';
import VitruvianV1 from '../VitruvianV1/VitruvianV1';

export default function Body({ children }) {
  return (
    <main className="body-container">
      {/* Arka Plan Maze Efekti */}
      <div className="body-background">
        <PathDrops />
      </div>

      {/* Merkez Vitruvian V1 Blueprint */}
      <div className="body-centerpiece">
        <VitruvianV1 />
      </div>

      {/* Ön Plan İçeriği */}
      {children && (
        <div className="body-content">
          {children}
        </div>
      )}
    </main>
  );
}

