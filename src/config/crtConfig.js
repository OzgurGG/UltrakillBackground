/**
 * CRT Monitör / Ekran Konfigürasyonu
 * Doğal, temiz ve ekrana tam oturan CRT ayarları.
 */
export const crtConfig = {
  // Tüp Bombesi & Kavis (0.0 = Düz, 0.08 = Doğal & zarif tüp bombesi, 0.14 = Daha belirgin bombe)
  curvature: 0.08,

  // Fosfor Izgarası Yoğunluğu (0.0 = Kapalı, 0.22 = Net ve göz yormayan piksel ağı)
  phosphorGrid: 0.22,

  // Köşe Kararması (Vignette) (0.0 = Kapalı, 0.28 = Doğal köşe cam gölgesi)
  vignette: 0.28,

  // Fosfor Parlama & Halasyon (Bloom) (0.0 = Kapalı, 0.36 = Doğal optik fosfor halesi)
  bloom: 0.36,
};

export default crtConfig;
