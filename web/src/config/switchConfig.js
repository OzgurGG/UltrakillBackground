/**
 * SWITCH - Tema, Yapılandırma ve Çift Yönlü İletişim Kanalı
 */

export const THEMES = {
  cyan: {
    id: 'cyan',
    name: 'Cyan Neon',
    primary: '#00f0ff',
    secondary: '#ff2233',
    glowPrimary: 'rgba(0, 240, 255, 0.85)',
    accent: '#ede8dc',
    vitruvianImg: './vitruvian-v1-white.png',
    bracketColor: '#ff2222',
    bracketGlow: 'rgba(255, 34, 34, 0.95)',
    hudBorder: 'rgba(0, 240, 255, 0.45)',
    hudBg: 'rgba(0, 18, 30, 0.75)',
  },
  red: {
    id: 'red',
    name: 'Blood Core',
    primary: '#ff2233',
    secondary: '#ff5533',
    glowPrimary: 'rgba(255, 34, 51, 0.85)',
    accent: '#ffdddd',
    vitruvianImg: './vitruvian-v1-white.png',
    bracketColor: '#ff1122',
    bracketGlow: 'rgba(255, 17, 34, 0.95)',
    hudBorder: 'rgba(255, 34, 51, 0.45)',
    hudBg: 'rgba(30, 5, 10, 0.75)',
  },
  amber: {
    id: 'amber',
    name: 'Retro Amber',
    primary: '#ffaa00',
    secondary: '#ff6600',
    glowPrimary: 'rgba(255, 170, 0, 0.85)',
    accent: '#ffeedd',
    vitruvianImg: './vitruvian-v1-white.png',
    bracketColor: '#ff8800',
    bracketGlow: 'rgba(255, 136, 0, 0.95)',
    hudBorder: 'rgba(255, 170, 0, 0.45)',
    hudBg: 'rgba(30, 20, 0, 0.75)',
  },
  green: {
    id: 'green',
    name: 'Matrix Green',
    primary: '#39ff14',
    secondary: '#00ff88',
    glowPrimary: 'rgba(57, 255, 20, 0.85)',
    accent: '#eeffee',
    vitruvianImg: './vitruvian-v1-white.png',
    bracketColor: '#00ff66',
    bracketGlow: 'rgba(0, 255, 102, 0.95)',
    hudBorder: 'rgba(57, 255, 20, 0.45)',
    hudBg: 'rgba(0, 28, 10, 0.75)',
  },
  purple: {
    id: 'purple',
    name: 'Synthwave Purple',
    primary: '#ff007f',
    secondary: '#00f0ff',
    glowPrimary: 'rgba(255, 0, 127, 0.85)',
    accent: '#ffffff',
    vitruvianImg: './vitruvian-v1-white.png',
    bracketColor: '#00f0ff',
    bracketGlow: 'rgba(0, 240, 255, 0.95)',
    hudBorder: 'rgba(255, 0, 127, 0.45)',
    hudBg: 'rgba(28, 0, 24, 0.75)',
  }
};

export function hexToRgb(hex) {
  if (!hex) return null;
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getEffectiveTheme(config) {
  const hex = config?.customColor;
  if (hex && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
    const rgb = hexToRgb(hex) || { r: 0, g: 240, b: 255 };
    return {
      id: 'custom',
      name: 'CUSTOM_HEX',
      primary: hex,
      secondary: '#ff2233',
      glowPrimary: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.85)`,
      accent: '#ede8dc',
      vitruvianImg: './vitruvian-v1-white.png',
      bracketColor: hex,
      bracketGlow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.95)`,
      hudBorder: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.45)`,
      hudBg: `rgba(${Math.floor(rgb.r * 0.1)}, ${Math.floor(rgb.g * 0.1)}, ${Math.floor(rgb.b * 0.15)}, 0.82)`,
    };
  }
  return THEMES[config?.theme] || THEMES.cyan;
}

export const DEFAULT_CONFIG = {
  theme: 'cyan',
  customColor: '#00f0ff',
  titleText: 'ULTRAKILL',
  topLeftTitle: 'ULTRAKILL',
  userName: 'V1',
  subText1: 'MANKIND IS DEAD. • BLOOD IS FUEL. • HELL IS FULL.',
  subText2: '// TARGET: ACQUIRED • REACTION_BIAS: 0.08ms • REFUEL_CYCLE: ACTIVE',
  showClock: true,
  crtCurvature: 0.08,
  crtPhosphorGrid: 0.22,
  crtVignette: 0.28,
  panelTitle: '// SPEC_SYS: V1_ANATOMICAL_MATRIX',
  fitToTaskbar: true,
  taskbarTheme: 'dark',
  codeBlur: 0.8,
  codeOpacity: 0.85
};

const STORAGE_KEY = 'switch_desktop_config';
const CHANNEL_NAME = 'switch_wallpaper_sync_channel';

// WebView2 pencereleri arasinda 0ms gecikmeli iletisim kanali
export const configChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel(CHANNEL_NAME)
  : null;

export function loadStoredConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    return { ...DEFAULT_CONFIG };
  }
}

let debounceTimer = null;

export function saveStoredConfig(cfg) {
  // 1. Canli arayuz icin 0ms gecikmeli BroadcastChannel
  try {
    if (configChannel) {
      configChannel.postMessage(cfg);
    }
  } catch (e) {}

  // 2. Diske yazma ve C# OS broadcast firtinasini onlemek icin 120ms debounce
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch (e) {}
    try {
      if (window.chrome && window.chrome.webview && window.chrome.webview.postMessage) {
        window.chrome.webview.postMessage(JSON.stringify(cfg));
      }
    } catch (e) {}
  }, 120);
}

export function saveStoredConfigImmediate(cfg) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    if (configChannel) {
      configChannel.postMessage(cfg);
    }
  } catch (e) {}
  try {
    if (window.chrome && window.chrome.webview && window.chrome.webview.postMessage) {
      window.chrome.webview.postMessage(JSON.stringify(cfg));
    }
  } catch (e) {}
}
