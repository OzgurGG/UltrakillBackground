import React from 'react';
import './Body.css';
import PathDrops from './backgrounds/PathDrops/PathDrops';

export default function Body({ children }) {
  return (
    <main className="body-container">
      {/* Background Effect Layer */}
      <div className="body-background">
        <PathDrops />
      </div>

      {/* Content Layer (Foreground) */}
      <div className="body-content">
        {children}
      </div>
    </main>
  );
}
