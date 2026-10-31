/**
 * CRT Televizyon Ekran Konfigürasyonu
 * Ekrandaki tüplü TV efektlerini buradan kolayca özelleştirebilirsin.
 */
export const crtConfig = {
  // Tüp Bombesi & Kavis (0 = Düz, 15 = Hafif tüplü bombe, 28 = Klasik tüplü TV, 50 = Aşırı bombe)
  curvature: 25,

  // TV Çerçevesi / Kasası (false = Tam ekran tüp camı, true = Retro TV kasası içinde göster)
  tvBezel: false,

  // İnce Yatay CRT Tarama Çizgileri (0.0 = Kapalı, 0.35 = Doğal, 0.7 = Belirgin çizgiler)
  scanlines: 0.38,

  // Katot Işını Dikey Yenileme Şeridi (Ekrandan aşağı yavaşça süzülen tarama bandı)
  scanlineRoll: true,

  // RGB Fosfor Izgarası / Shadow Mask (Katot tüpündeki kırmızı, yeşil, mavi alt pikseller)
  rgbMask: 0.06,

  // Tüp Köşe Kararması / Vignette (0.0 = Düz, 0.5 = Doğal köşe düşüşü, 0.85 = Derin köşe karartması)
  vignette: 0.75,

  // Fosfor Parlaması / Glow Bloom (0.0 = Kapalı, 1.0 = Doğal katot ışıması, 2.0 = Güçlü parlama)
  glow: 1.0,

  // Bombeli Cam Yansıması (Tüplü camın sol üstündeki ortam ışığı yansıması)
  glassReflection: true,

  // 60Hz Katot Tüp Mikro-Titreşimi (Ekranın gerçek bir analog tüp gibi canlı hissettirmesi)
  flicker: true,
};

export default crtConfig;
