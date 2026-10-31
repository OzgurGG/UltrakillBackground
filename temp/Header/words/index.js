/**
 * Kelime Havuzu (Word Pool)
 * 
 * HeaderShowcase, sayfa her yüklendiğinde bu havuzdan rastgele bir kelime seçer
 * ve header'ın sağ bölümünde büyük watermark olarak gösterir.
 * 
 * Kelimeler kısa, sert, tematik olmalı — retro/dark/code/faith teması.
 * Yeni kelime eklemek için sadece wordPool dizisine string ekle.
 */

// === KELİME HAVUZU ===
const wordPool = [
  'OVERWHELMING',
  'SACRIFICE',
  'PROTOCOL',
  'DOMINION',
  'TERMINAL',
  'MANIFEST',
  'OVERRIDE',
  'FRACTURE',
  'REBIRTH',
  'ANOMALY',
  'EXECUTE',
  'ABSOLVE',
  'DECRYPT',
  'GENESIS',
  'PARADOX',
  'VERDICT',
  'WITNESS',
  'PURGE',
  'WRATH',
  'EXILE',
  'SURGE',
  'ABYSS',
  'OMEGA',
  'ALPHA',
  'VOID',
];

/**
 * Havuzdan rastgele bir kelime seçer.
 * @returns {string}
 */
export function getRandomWord() {
  const index = Math.floor(Math.random() * wordPool.length);
  return wordPool[index];
}

export default wordPool;
