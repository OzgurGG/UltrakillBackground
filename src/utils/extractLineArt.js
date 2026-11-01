/**
 * extractLineArt - Görseldeki Arka Planı Silip Çizgileri Beyaza Çeviren İşlemci
 * 
 * - Orijinal webp/parşömen kağıdı üzerindeki siyah çizimleri (mürekkep/karakalem) tespit eder.
 * - Kağıt dokusu ve zemin renklerini tamamen silip şeffaflaştırır (alpha = 0).
 * - Siyah çizgileri parlak beyaz (rgba(255,255,255,alpha)) çizgilerine dönüştürür.
 * - İsteğe bağlı diffuse / bloom yayılımı ekler.
 */
export function extractLineArtToCanvas(imageElement, options = {}) {
  const {
    threshold = 0.82,
    contrast = 0.85,
    glow = true,
    glowColor = 'rgba(255, 255, 255, 0.45)',
    glowBlur = 10,
    targetColor = [255, 255, 255]
  } = options;

  const w = imageElement.naturalWidth || imageElement.width || 1080;
  const h = imageElement.naturalHeight || imageElement.height || 1080;

  // 1. Orijinal çizim tuvali
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = w;
  srcCanvas.height = h;
  const srcCtx = srcCanvas.getContext('2d');
  srcCtx.drawImage(imageElement, 0, 0, w, h);

  const srcImgData = srcCtx.getImageData(0, 0, w, h);
  const data = srcImgData.data;

  // 2. Bulanık zemin referansı için küçük tuval (lokal zemin rengini yakalamak için)
  const blurCanvas = document.createElement('canvas');
  const smallW = Math.max(16, Math.floor(w / 16));
  const smallH = Math.max(16, Math.floor(h / 16));
  blurCanvas.width = smallW;
  blurCanvas.height = smallH;
  const blurCtx = blurCanvas.getContext('2d');
  blurCtx.drawImage(imageElement, 0, 0, smallW, smallH);

  // Küçük tuvali tekrar büyüterek pürüzsüz zemin parlaklığı elde ediyoruz
  const refCanvas = document.createElement('canvas');
  refCanvas.width = w;
  refCanvas.height = h;
  const refCtx = refCanvas.getContext('2d');
  refCtx.imageSmoothingEnabled = true;
  refCtx.drawImage(blurCanvas, 0, 0, w, h);
  const refData = refCtx.getImageData(0, 0, w, h).data;

  // 3. Çıkış Tuvali (Şeffaf zemin + Beyaz çizgiler)
  const outCanvas = document.createElement('canvas');
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext('2d');
  const outImgData = outCtx.createImageData(w, h);
  const outData = outImgData.data;

  const [tr, tg, tb] = targetColor;

  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    // Dış kenarlardaki tarama çizgilerini temizle (20px marjin)
    const x = i % w;
    const y = Math.floor(i / w);
    if (x < 20 || x >= w - 20 || y < 20 || y >= h - 20) {
      outData[idx] = tr;
      outData[idx + 1] = tg;
      outData[idx + 2] = tb;
      outData[idx + 3] = 0;
      continue;
    }

    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    const bgR = refData[idx];
    const bgG = refData[idx + 1];
    const bgB = refData[idx + 2];
    const bgLum = Math.max(1, 0.299 * bgR + 0.587 * bgG + 0.114 * bgB);

    const ratio = lum / bgLum;

    let ink = 0;
    if (ratio < threshold) {
      ink = (threshold - ratio) / (threshold * 0.6);
      ink = Math.min(1, Math.max(0, ink));
      ink = Math.pow(ink, contrast);
    }

    outData[idx] = tr;
    outData[idx + 1] = tg;
    outData[idx + 2] = tb;
    outData[idx + 3] = Math.round(ink * 255);
  }

  outCtx.putImageData(outImgData, 0, 0);

  // İsteğe bağlı diffuse parlama efekti (glow katmanı)
  if (glow) {
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = w;
    glowCanvas.height = h;
    const gCtx = glowCanvas.getContext('2d');
    gCtx.shadowColor = glowColor;
    gCtx.shadowBlur = glowBlur;
    gCtx.drawImage(outCanvas, 0, 0);
    gCtx.drawImage(outCanvas, 0, 0);
    return glowCanvas;
  }

  return outCanvas;
}
