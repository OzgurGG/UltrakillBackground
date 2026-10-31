import React, { useState, useEffect } from 'react';
import './Header.css';
import { LanyardManager } from '../../LanyardManager';
import HeaderShowcase from './HeaderShowcase';

export default function Header() {
  const [profil, setProfil] = useState({
    avatarUrl: "https://cdn.discordapp.com/embed/avatars/0.png",
    status: "offline",
    musicText: null
  });

  useEffect(() => {
    // Canlı WebSocket bağlantısını başlatıyoruz
    const manager = new LanyardManager("1092374832856961106", (canliVeri) => {
      if (canliVeri) {
        setProfil(canliVeri);
      }
    });

    manager.connect();

    // Bileşen kapandığında bağlantıyı güvenli kapat
    return () => manager.disconnect();
  }, []);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Saniyede bir güncellenen saat
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const renderMusic = () => {
    if (!profil.spotify && !profil.musicText) return null;

    // Eğer Spotify çalmıyorsa eski stil metni göster
    if (!profil.spotify) {
      return (
        <div className="muzik-alani-eski">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="muzik-ikon">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
          <span>{profil.musicText}</span>
        </div>
      );
    }

    const { artist, song, start, end, albumArt } = profil.spotify;

    let progressStr = "0:00";
    let durationStr = "0:00";
    let percent = 0;

    if (start && end) {
      const durationMs = end - start;
      const currentMs = Math.max(0, Math.min(now - start, durationMs));
      percent = (currentMs / durationMs) * 100;

      const curSec = Math.floor(currentMs / 1000);
      const durSec = Math.floor(durationMs / 1000);

      progressStr = `${Math.floor(curSec / 60)}:${(curSec % 60).toString().padStart(2, '0')}`;
      durationStr = `${Math.floor(durSec / 60)}:${(durSec % 60).toString().padStart(2, '0')}`;
    }

    return (
      <div className="muzik-alani-basit">
        <div className="muzik-basit-satir">{artist} - {song}</div>
        {start && end && (
          <div className="muzik-basit-zaman">[{progressStr} / {durationStr}]</div>
        )}
      </div>
    );
  };

  return (
    <header className="header">
      <div className="header-left">

        <div className="header-left-top">
          {/* Discord profil resmi ve aktiflik durumu */}
          <div className="avatar-konteyner">
            <img src={profil.avatarUrl} alt="Discord Avatar" className="avatar-resim" />
            <div className={`durum-yuvarlagi durum-${profil.status}`}></div>
          </div>

          {/* Logo */}
          <div className="logo">SWITCH</div>
        </div>

        {/* Müzik yazısı */}
        {renderMusic()}
      </div>

      {/* İki bölümü ayıran kalın çizgi */}
      <div className="header-separator"></div>

      <div className="header-right">
        <HeaderShowcase />
      </div>
    </header>
  );
}
