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

// Pre-rendered radial glow sprite for high performance particle blit
const glowSprite = (typeof document !== 'undefined') ? (() => {
   const c = document.createElement('canvas');
   c.width = 32;
   c.height = 32;
   const gCtx = c.getContext('2d');
   const grad = gCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
   grad.addColorStop(0, 'rgba(255, 45, 30, 0.45)');
   grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
   gCtx.fillStyle = grad;
   gCtx.fillRect(0, 0, 32, 32);
   return c;
})() : null;

// Statik Renk Lookup Tablosu (Saniyede binlerce string olusumunu sifirlar)
const COLOR_LUT = [];
const HEAD_LUT = [];
for (let i = 0; i <= 100; i++) {
   const t = i / 100;
   const rColor = Math.floor(40 + t * 200);
   const gColor = Math.floor(5 + t * 20);
   const bColor = Math.floor(5 + t * 20);
   const alpha = Math.min(1.0, t * 1.2).toFixed(2);
   COLOR_LUT[i] = `rgba(${rColor}, ${gColor}, ${bColor}, ${alpha})`;

   const headAlpha = Math.min(1.0, t + 0.4).toFixed(2);
   HEAD_LUT[i] = `rgba(255, 60, 60, ${headAlpha})`;
}

export function initCultStream(cvs, layer = 'back', autoLoop = false) {
   if (!cvs) return () => {};
   const ctx = cvs.getContext('2d');
   let raf, w, h, cols, rows;
   let grid = [];
   let streams = [];
   const MAX_GLOW = 256;
   const glowPx = new Float32Array(MAX_GLOW);
   const glowPy = new Float32Array(MAX_GLOW);
   const glowIntensity = new Float32Array(MAX_GLOW);
   let glowCount = 0;

   function build() {
      const p = cvs.parentElement;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = p ? p.clientWidth : cvs.width;
      h = p ? p.clientHeight : cvs.height;
      if (!w || !h) { w = cvs.width || 400; h = cvs.height || 90; }
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
         const streamCount = layer === 'front'
            ? (Math.random() < 0.3 ? 1 : 0)
            : 2 + Math.floor(Math.random() * 3);
         for (let i = 0; i < streamCount; i++) {
            rowStreams.push(createStream(cols));
         }
         streams.push(rowStreams);
      }
   }

   function createStream(totalCols) {
      return {
         headPos: Math.random() * (totalCols + 40) - 10,
         speed: 8.0 + Math.random() * 12.0,
         trailLen: 8 + Math.random() * 15,
         opacity: 0.6 + Math.random() * 0.4
      };
   }

   build();
   let ro = null;
   if (cvs.parentElement) {
      ro = new ResizeObserver(build);
      ro.observe(cvs.parentElement);
   }

   let hiddenWordTimer = 5.0 + Math.random() * 10.0;

   function update(dt) {
      if (cols === 0 || rows === 0) return;

      // Stream güncelleme
      for (let r = 0; r < rows; r++) {
         for (const s of streams[r]) {
            s.headPos -= s.speed * dt;
            if (s.headPos + s.trailLen < -2) {
               s.headPos = cols + 2 + Math.random() * 20;
               s.speed = 8.0 + Math.random() * 12.0;
            }
         }
      }

      // Karakter mutasyonu
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

      // Gizli kelime
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
   }

   function draw() {
      if (layer === 'back') {
         ctx.fillStyle = '#000000';
         ctx.fillRect(0, 0, w, h);
      } else {
         ctx.clearRect(0, 0, w, h);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 14px monospace';

      // Çizim (Önceden ayrılmış Typed Array ile sıfır GC)
      glowCount = 0;
      for (let r = 0; r < rows; r++) {
         for (let c = 0; c < cols; c++) {
            const cell = grid[r][c];
            let maxIntensity = 0;
            let isHead = false;

            for (const s of streams[r]) {
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
                  if (intensity > maxIntensity) maxIntensity = intensity;
               }
            }

            if (maxIntensity < 0.02) continue;

            const px = c * CELL_W + CELL_W / 2;
            const py = r * CELL_H + CELL_H / 2;
            const lutIdx = Math.min(100, Math.max(0, Math.floor(maxIntensity * 100)));

            if (isHead) {
               ctx.fillStyle = HEAD_LUT[lutIdx];
               ctx.fillText(cell.char, px, py);
               if (glowCount < MAX_GLOW) {
                  glowPx[glowCount] = px;
                  glowPy[glowCount] = py;
                  glowIntensity[glowCount] = maxIntensity;
                  glowCount++;
               }
            } else {
               ctx.fillStyle = COLOR_LUT[lutIdx];
               ctx.fillText(cell.char, px, py);
            }
         }
      }

      if (glowCount > 0 && glowSprite) {
         ctx.globalCompositeOperation = 'screen';
         for (let i = 0; i < glowCount; i++) {
            ctx.globalAlpha = Math.min(1.0, glowIntensity[i]);
            ctx.drawImage(glowSprite, glowPx[i] - 16, glowPy[i] - 16);
         }
         ctx.globalAlpha = 1.0;
         ctx.globalCompositeOperation = 'source-over';
      }
   }

   let lastTime = performance.now();
   function internalLoop(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      update(dt);
      draw();
      raf = requestAnimationFrame(internalLoop);
   }

   if (autoLoop) {
      raf = requestAnimationFrame(internalLoop);
   }

   const controller = () => {
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
   };
   controller.update = update;
   controller.draw = draw;
   controller.resize = build;
   controller.destroy = controller;

   return controller;
}

export default function CultStream({ layer = 'back' }) {
   const canvasRef = useRef(null);

   useEffect(() => {
      return initCultStream(canvasRef.current, layer);
   }, [layer]);

   return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
}
