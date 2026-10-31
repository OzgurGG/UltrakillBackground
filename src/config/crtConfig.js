/**
 * CRT Monitör / Ekran Konfigürasyonu
 * Referans görseldeki kırmızı fosforlu bombeli terminal monitörü ayarları.
 */
export const crtConfig = {
  // Tüp Bombesi & Kavis Miktarı (0.0 = Düz, 0.15 = Doğal CRT kavis, 0.22 = Fotoğraftaki belirgin tüp bombesi)
  curvature: 0.20,

  // Monitör Kasası Çerçevesi (true = Gerçek tüplü monitör kasası içinde, false = Tam ekran tüp camı)
  monitorFrame: true,

  // Fosfor Hücre Izgarası (Aperture Grille / Dot-Matrix) Yoğunluğu (0.0 = Kapalı, 0.40 = İdeal net ızgara)
  phosphorGrid: 0.40,

  // Tüp Köşe Kararması (Vignette derinliği)
  vignette: 0.40,
};

export default crtConfig;
