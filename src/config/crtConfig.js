/**
 * CRT Ekran Boğumu Konfigürasyonu
 * Değerleri buradan doğrudan değiştirebilirsin.
 */
export const crtConfig = {
  // EKRAN BOĞUMU (Tüplü TV Cam Bombesi / Fıçı Kavis Ayarı)
  curvature: 0.15,          // Boğum miktarı (0.0 = tamamen düz, 0.12 = klasik tüplü TV, 0.25 = aşırı boğum)
  vignette: 0.38,           // Ekran köşelerindeki tüp kararması (0.1 - 0.6)
  scanlineIntensity: 0.05,  // İnce kavisli CRT çizgisi (0.0 = kapalı, 0.05 = hafif tüplü TV)
  glow: 0.10,               // Tüplü ekran fosfor kenar ışıması
};

export default crtConfig;
