import React from 'react';
import './Body.css';
import PathDrops from '../SnakeGame_PathDrops/PathDrops';

export default function Body({ children }) {
  return (
    <main className="body-container">
      {/* Arka Plan Maze Efekti */}
      <div className="body-background">
        <PathDrops />
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
