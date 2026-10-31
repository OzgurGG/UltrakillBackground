import React from 'react';
import './Body.css';

export default function Body({ children }) {
  return (
    <main className="body-container">
      <div className="body-content">
        {children}
      </div>
    </main>
  );
}
