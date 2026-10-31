import React, { useRef, useEffect } from 'react';

/**
 * CultStream — Pürüzsüz Sağdan Sola Yatay Matrix
 */

const CHARS = 'ABCDEF0123456789+-#@!ΔΩλΞΠΨΘΣ█▓▒░';
const HIDDEN_WORDS = ['AI', 'LAW', 'DEATH', 'SIN', 'CULT', 'VOID', 'NULL'];

function getRandomChar() {
   return CHARS[Math.floor(Math.random() * CHARS.length)];
}

const CELL_W = 14;
const CELL_H = 16;

export default function CultStream({ layer = 'back' }) {
   const canvasRef = useRef(null);

   useEffect(() => {
      const cvs = canvasRef.current;
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      let raf, w, h, cols, rows;
      let grid = [];
      let streams = [];

      function build() {
         const p = cvs.parentElement;
         if (!p) return;
         const dpr = Math.min(window.devicePixelRatio || 1, 2);
         w = p.clientWidth;
         h = p.clientHeight;
         cvs.width = w * dpr;
         cvs.height = h * dpr;
         cvs.style.width = w + 'px';
         cvs.style.height = h + 'px';
         ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

         cols = Math.ceil(w / CELL_W) + 2;
         rows = Math.ceil(h / CELL_H) + 1;

         // Grid
         grid = [];
         for (let r = 0; r < rows; r++) {
            const rowArr = [];
            for (let c = 0; c < cols; c++) {
               rowArr.push({
                  char: getRandomChar(),
                  mutateTimer: 3.0 + Math.random() * 8.0,
                  protected: false,
                  protectTimer: 0
               });
            }
            grid.push(rowArr);
         }

         // Streams (Sağdan sola akış)
         streams = [];
         for (let r = 0; r < rows; r++) {
            const rowStreams = [];
            // Arka planda yoğun, ön planda seyrek akış
            const streamCount = layer === 'front'
               ? (Math.random() < 0.3 ? 1 : 0) // %30 ihtimalle 1 akış
               : 2 + Math.floor(Math.random() * 3); // 2-4 arası akış
            for (let i = 0; i < streamCount; i++) {
               rowStreams.push(createStream(cols));
            }
            streams.push(rowStreams);
         }
      }

      function createStream(totalCols) {
         return {
            // Ekran yüklendiğinde boş kalmaması için ekranın her yerine rastgele dağıtıyoruz
            headPos: Math.random() * (totalCols + 40) - 10,
            speed: 5.0 + Math.random() * 10.0,
            trailLen: 8 + Math.random() * 15,
            opacity: 0.6 + Math.random() * 0.4
         };
      }

      build();
      const ro = new ResizeObserver(build);
      ro.observe(cvs.parentElement);

      let lastTime = performance.now();
      let hiddenWordTimer = 5.0 + Math.random() * 10.0;

      function loop(now) {
         const dt = Math.min((now - lastTime) / 1000, 0.05);
         lastTime = now;

         if (layer === 'back') {
            ctx.fillStyle = '#050202';
            ctx.fillRect(0, 0, w, h);
         } else {
            ctx.clearRect(0, 0, w, h);
         }

         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.font = 'bold 14px monospace';

         // === STREAM GÜNCELLEME (SAĞDAN SOLA) ===
         for (let r = 0; r < rows; r++) {
            for (const s of streams[r]) {
               // Sub-pixel smooth hareket (senin ilk isteğin, "text text atlamaması")
               s.headPos -= s.speed * dt;

               if (s.headPos + s.trailLen < -2) {
                  s.headPos = cols + 2 + Math.random() * 20;
                  s.speed = 5.0 + Math.random() * 10.0;
               }
            }
         }

         // === KARAKTER MUTASYONU ===
         for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
               const cell = grid[r][c];
               if (cell.protected) {
                  cell.protectTimer -= dt;
                  if (cell.protectTimer <= 0) cell.protected = false;
                  continue;
               }
               cell.mutateTimer -= dt;
               if (cell.mutateTimer <= 0) {
                  cell.char = getRandomChar();
                  cell.mutateTimer = 3.0 + Math.random() * 8.0;
               }
            }
         }

         // === GİZLİ KELİME ===
         hiddenWordTimer -= dt;
         if (hiddenWordTimer <= 0) {
            const word = HIDDEN_WORDS[Math.floor(Math.random() * HIDDEN_WORDS.length)];
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * Math.max(1, cols - word.length));
            if (c >= 0 && c + word.length < cols) {
               for (let i = 0; i < word.length; i++) {
                  grid[r][c + i].char = word[i];
                  grid[r][c + i].protected = true;
                  grid[r][c + i].protectTimer = 10.0 + Math.random() * 8.0;
               }
            }
            hiddenWordTimer = 8.0 + Math.random() * 15.0;
         }

         // === ÇİZİM ===
         const glowCells = [];

         for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
               const cell = grid[r][c];
               let maxIntensity = 0;
               let isHead = false;

               for (const s of streams[r]) {
                  // SAĞDAN SOLA olduğu için kafa pozisyonu c'den KÜÇÜKTÜR
                  // Mesafe = hücre pozisyonu - kafa pozisyonu
                  const dist = c - s.headPos;

                  if (dist > -0.5 && dist < s.trailLen) {
                     let intensity = 0;
                     if (dist < 1.0) {
                        intensity = s.opacity;
                        isHead = true;
                     } else {
                        const progress = dist / s.trailLen;
                        intensity = s.opacity * Math.pow(1.0 - progress, 1.8);
                     }
                     if (intensity > maxIntensity) {
                        maxIntensity = intensity;
                     }
                  }
               }

               if (maxIntensity < 0.02) continue;

               const px = c * CELL_W + CELL_W / 2;
               const py = r * CELL_H + CELL_H / 2;

               if (isHead) {
                  // İLK HARF ARTIK DEĞİŞİYOR:
                  // Eskisi gibi sadece "█" basmıyoruz, hücrenin mutasyona uğrayan kendi harfini basıyoruz.
                  ctx.fillStyle = `rgba(255, 60, 60, ${Math.min(1.0, maxIntensity + 0.4)})`;
                  ctx.fillText(cell.char, px, py);

                  glowCells.push({ px, py, intensity: maxIntensity });
               } else {
                  const rColor = Math.floor(40 + maxIntensity * 200);
                  const gColor = Math.floor(5 + maxIntensity * 20);
                  const bColor = Math.floor(5 + maxIntensity * 20);
                  ctx.fillStyle = `rgba(${rColor}, ${gColor}, ${bColor}, ${Math.min(1.0, maxIntensity * 1.2)})`;
                  ctx.fillText(cell.char, px, py);
               }
            }
         }

         // === GLOW EFEKTİ ===
         if (glowCells.length > 0) {
            ctx.globalCompositeOperation = 'screen';
            for (const g of glowCells) {
               const rad = 15;
               const gradient = ctx.createRadialGradient(g.px, g.py, 0, g.px, g.py, rad);
               gradient.addColorStop(0, `rgba(255, 30, 20, ${g.intensity * 0.4})`);
               gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
               ctx.fillStyle = gradient;
               ctx.fillRect(g.px - rad, g.py - rad, rad * 2, rad * 2);
            }
            ctx.globalCompositeOperation = 'source-over';
         }

         raf = requestAnimationFrame(loop);
      }

      raf = requestAnimationFrame(loop);
      return () => { cancelAnimationFrame(raf); ro.disconnect(); };
   }, []);

   return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
}
