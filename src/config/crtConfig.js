/**
 * CRT Monitör / Ekran Konfigürasyonu
 * Referans görseldeki kırmızı fosforlu bombeli terminal monitörü ayarları.
 */
export const crtConfig = {
  // Monitör Kasası Çerçevesi (true = Gerçek tüplü monitör kasası içinde, false = Tam ekran tüp camı)
  monitorFrame: true,

  // Fosfor Hücre Izgarası (Aperture Grille / Dot-Matrix) Yoğunluğu (0.0 = Kapalı, 0.45 = İdeal net ızgara)
  phosphorGrid: 0.45,

  // Tüp Köşe Kararması (Vignette derinliği)
  vignette: 0.88,

  // Bombeli Cam Yansıması (Sol üst cam ışıltısı)
  reflection: true,
};

export default crtConfig;
