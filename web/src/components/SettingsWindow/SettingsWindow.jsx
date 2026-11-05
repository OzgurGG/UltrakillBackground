import React, { useState, useEffect } from 'react';
import { loadStoredConfig, saveStoredConfig, saveStoredConfigImmediate, getEffectiveTheme, DEFAULT_CONFIG } from '../../config/switchConfig';
import './SettingsWindow.css';

export default function SettingsWindow() {
  const [config, setConfig] = useState(() => loadStoredConfig());

  useEffect(() => {
    window.setSwitchConfig = (incoming) => {
      if (!incoming) return;
      setConfig((prev) => ({ ...prev, ...incoming }));
    };
    return () => {
      delete window.setSwitchConfig;
    };
  }, []);

  const effectiveTheme = getEffectiveTheme(config);
  const accentColor = effectiveTheme.primary;

  const updateField = (field, value) => {
    setConfig((prev) => {
      const next = { ...prev, [field]: value };
      saveStoredConfig(next);
      return next;
    });
  };

  const handleCustomColorChange = (hex) => {
    setConfig((prev) => {
      const next = { ...prev, customColor: hex, theme: 'custom' };
      saveStoredConfig(next);
      return next;
    });
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    saveStoredConfigImmediate(DEFAULT_CONFIG);
  };

  const handleClose = () => {
    window.close();
  };

  return (
    <div className="settings-root" style={{ '--accent': accentColor }}>
      <header className="settings-header">
        <h1>AYARLAR</h1>
      </header>

      <main className="settings-body">
        {/* RENK */}
        <section className="settings-section">
          <div className="section-title">RENK</div>
          <div className="settings-row">
            <span className="row-label">Tema Rengi</span>
            <div className="color-control">
              <input
                type="color"
                className="color-picker-input"
                value={accentColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
              />
              <input
                type="text"
                className="hex-input"
                maxLength={7}
                value={config.customColor || accentColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* KULLANICI */}
        <section className="settings-section">
          <div className="section-title">KULLANICI</div>
          <div className="settings-row">
            <span className="row-label">Sol Üst Bilgi</span>
            <button
              type="button"
              className={`toggle-btn ${config.showClock !== false ? 'active' : ''}`}
              onClick={() => updateField('showClock', config.showClock === false)}
            >
              {config.showClock !== false ? 'AÇIK' : 'KAPALI'}
            </button>
          </div>

          <div className="settings-row">
            <span className="row-label">Kullanıcı Adı</span>
            <input
              type="text"
              className="text-input"
              maxLength={16}
              value={config.userName || 'V1'}
              placeholder="V1"
              onChange={(e) => updateField('userName', e.target.value)}
            />
          </div>
        </section>

        {/* CRT EFEKTLERİ */}
        <section className="settings-section">
          <div className="section-title">CRT EFEKTLERİ</div>
          <div className="settings-row">
            <span className="row-label">Ekran Eğriliği</span>
            <div className="slider-control">
              <input
                type="range"
                min="0.0"
                max="0.14"
                step="0.01"
                value={config.crtCurvature ?? 0.08}
                onChange={(e) => updateField('crtCurvature', parseFloat(e.target.value))}
              />
              <span className="slider-value">{Math.round((config.crtCurvature ?? 0.08) * 100)}%</span>
            </div>
          </div>

          <div className="settings-row">
            <span className="row-label">Scanline Izgarası</span>
            <div className="slider-control">
              <input
                type="range"
                min="0.0"
                max="0.45"
                step="0.01"
                value={config.crtPhosphorGrid ?? 0.22}
                onChange={(e) => updateField('crtPhosphorGrid', parseFloat(e.target.value))}
              />
              <span className="slider-value">{Math.round((config.crtPhosphorGrid ?? 0.22) * 100)}%</span>
            </div>
          </div>

          <div className="settings-row">
            <span className="row-label">Yazı Bulanıklığı</span>
            <div className="slider-control">
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.1"
                value={config.codeBlur ?? 0.8}
                onChange={(e) => updateField('codeBlur', parseFloat(e.target.value))}
              />
              <span className="slider-value">{(config.codeBlur ?? 0.8).toFixed(1)}px</span>
            </div>
          </div>
        </section>

        {/* GÖREV ÇUBUĞU */}
        <section className="settings-section">
          <div className="section-title">GÖREV ÇUBUĞU</div>
          <div className="settings-row">
            <span className="row-label">Görev Çubuğuna Yasla</span>
            <button
              type="button"
              className={`toggle-btn ${config.fitToTaskbar !== false ? 'active' : ''}`}
              onClick={() => updateField('fitToTaskbar', config.fitToTaskbar === false)}
            >
              {config.fitToTaskbar !== false ? 'AÇIK' : 'KAPALI'}
            </button>
          </div>

          <div className="settings-row">
            <span className="row-label">Görev Çubuğu Teması</span>
            <div className="segmented-control">
              <button
                type="button"
                className={(config.taskbarTheme || 'dark') === 'dark' ? 'active' : ''}
                onClick={() => updateField('taskbarTheme', 'dark')}
              >
                Siyah
              </button>
              <button
                type="button"
                className={config.taskbarTheme === 'theme' ? 'active' : ''}
                onClick={() => updateField('taskbarTheme', 'theme')}
              >
                Tema
              </button>
              <button
                type="button"
                className={config.taskbarTheme === 'default' ? 'active' : ''}
                onClick={() => updateField('taskbarTheme', 'default')}
              >
                Varsayılan
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="settings-footer">
        <button type="button" className="btn-secondary" onClick={handleReset}>
          Varsayılana Sıfırla
        </button>
        <button type="button" className="btn-primary" onClick={handleClose}>
          Kapat
        </button>
      </footer>
    </div>
  );
}
