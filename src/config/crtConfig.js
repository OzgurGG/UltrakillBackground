/**
 * CRT Monitör / Ekran Konfigürasyonu
 * Görseldeki kırmızı fosforlu tüplü terminal ekranı ayarları.
 */
export const crtConfig = {
  // Monitör Kasası Çerçevesi (true = Monitör kasası içinde gösterir, false = Tam ekran tüp camı)
  monitorFrame: true,

  // Fosfor Hücre Izgarası (Aperture Grille / Dot-Matrix) Yoğunluğu (0.0 = Kapalı, 0.45 = İdeal net ızgara)
  phosphorGrid: 0.45,

  // Kırmızı Fosfor Parıltısı / Bloom (0.0 = Kapalı, 0.6 = Doğal katot ışıması)
  glow: 0.6,

  // Tüp Köşe Kararması (Vignette derinliği)
  vignette: 0.85,

  // Bombeli Cam Yansıması (Sol üst cam ışıltısı)
  reflection: true,
};

export default crtConfig;
