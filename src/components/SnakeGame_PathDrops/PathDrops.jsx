import React, { useRef, useEffect } from 'react';

const CELL_W = 16;
const CELL_H = 16;

const DIRS = [
  { dr: -1, dc: 0, bit: 1, opp: 4, name: 'up' },
  { dr: 0, dc: 1, bit: 2, opp: 8, name: 'right' },
  { dr: 1, dc: 0, bit: 4, opp: 1, name: 'down' },
  { dr: 0, dc: -1, bit: 8, opp: 2, name: 'left' }
];

const BOLD_TEXTS = [
  'HALT', 'DENY', 'EDGE', 'VOID', 'LIMIT', 'FAULT', 'BLOCK', 'NULL',
  'SANCTUM', 'HERESY', 'LITANY', 'REQUIEM', 'VIGIL', 'MARTYR', 'CORPUS',
  'ABSOLVED', 'REMNANT', 'TRACE', 'DRIFT', 'DEAD', 'STATIC', 'BLEED',
  'SYS.FALL', 'VOID.EXE', 'MACHINE SIN', 'LOST ARK', 'PURGATORY', 'LIMBO',
  'SAFE ZONE', 'CHECKPOINT', 'SAVE STATE', 'ABSOLUTION', 'DORMANT', 'CACHE',
  'CORE.0', 'BUS.TX', 'PORT.4', 'SIGNAL.RX', 'GATE.IO', 'CLOCK.60'
];

export function initPathDrops(cvs) {
  if (!cvs) return () => {};
  const ctx = cvs.getContext('2d');
  let raf, w, h, cols, rows;
  let grid = [];
  let probes = [];
  let pulses = [];
  const dirtySet = new Set();
  let spawnTimer = 0.2;
  let pulseTimer = 0.4;

  function makeCell() {
    return {
      val: 0,           // baglanti bitmask: 1:up, 2:right, 4:down, 8:left
      isEtched: false,  // devreye donustu mu
      pulse: 0.0,       // uzerinden gecen anlik elektrik dalgasi (0..1)
      life: 0,          // devre omru
      blocked: false,
      isCard: false,
      cardLabel: null,
      cardW: 0,
      cardH: 0,
      cardOriginR: -1,
      cardOriginC: -1,
    };
  }

  function markDirty(r, c) {
    if (r >= 0 && r < rows && c >= 0 && c < cols) dirtySet.add(r * cols + c);
  }

  function resetCell(cell, r, c) {
    Object.assign(cell, makeCell());
    markDirty(r, c);
  }

  function build() {
    const p = cvs.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = p ? p.clientWidth : (cvs.style.width ? parseFloat(cvs.style.width) : (cvs.width ? cvs.width / dpr : 800));
    h = p ? p.clientHeight : (cvs.style.height ? parseFloat(cvs.style.height) : (cvs.height ? cvs.height / dpr : 600));
    if (!w || !h || isNaN(w) || isNaN(h)) { w = 800; h = 600; }
    cvs.width = w * dpr;
    cvs.height = h * dpr;
    cvs.style.width = w + 'px';
    cvs.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.max(5, Math.ceil(w / CELL_W));
    rows = Math.max(5, Math.ceil(h / CELL_H));
    grid = Array.from({ length: rows }, () => Array.from({ length: cols }, makeCell));
    probes = [];
    pulses = [];
    dirtySet.clear();
  }

  build();
  let ro = null;
  if (cvs.parentElement) {
    ro = new ResizeObserver(build);
    ro.observe(cvs.parentElement);
  }

  // 1. Yeni Devre Hatti Oyan Sonda (Probe)
  function spawnProbe(r, c, dir) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    if (grid[r][c].isCard) return;

    probes.push({
      r, c, dir,
      speed: 8 + Math.random() * 5,
      moveTimer: 0,
      stepsRemaining: 18 + Math.floor(Math.random() * 24),
      active: true,
    });

    const cell = grid[r][c];
    cell.isEtched = true;
    cell.pulse = 1.0;
    cell.life = 30.0 + Math.random() * 15.0; // Kalici PCB devre omru
    cell.blocked = true;
    markDirty(r, c);
  }

  // 2. Dogrudan Dikdortgen Endpoint (Temiz, Minimal, Kalin Yazili IC Modulu)
  function placeRectangle(r, c, label) {
    const cardW = 5;
    const cardH = 2;
    const cr = Math.max(1, Math.min(rows - cardH - 1, r));
    const cc = Math.max(1, Math.min(cols - cardW - 1, c));

    for (let i = -1; i <= cardH; i++) {
      for (let j = -1; j <= cardW; j++) {
        const nr = cr + i, nc = cc + j;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          if (grid[nr][nc].isCard) return;
        }
      }
    }

    for (let i = 0; i < cardH; i++) {
      for (let j = 0; j < cardW; j++) {
        const nr = cr + i, nc = cc + j;
        const cell = grid[nr][nc];
        cell.blocked = true;
        cell.isCard = true;
        cell.cardOriginR = cr;
        cell.cardOriginC = cc;
        cell.cardW = cardW;
        cell.cardH = cardH;
        cell.life = 35.0 + Math.random() * 15.0;
        markDirty(nr, nc);
      }
    }

    grid[cr][cc].cardLabel = label;
    markDirty(cr, cc);
  }

  // 3. Olusan Devre Uzerinden Hizla Akan Akim Sinyali (Pulse)
  function spawnPulseOnCircuit() {
    if (dirtySet.size === 0) return;
    const keys = Array.from(dirtySet);
    const key = keys[Math.floor(Math.random() * keys.length)];
    const r = Math.floor(key / cols), c = key % cols;
    const cell = grid[r]?.[c];
    if (!cell || !cell.isEtched || cell.val === 0 || cell.isCard) return;

    const available = [];
    for (const d of DIRS) {
      if (cell.val & d.bit) available.push(d);
    }
    if (available.length === 0) return;
    const dir = available[Math.floor(Math.random() * available.length)];

    pulses.push({
      r, c, dir,
      speed: 18 + Math.random() * 8, // Akim sinyali daha hizli kayar
      moveTimer: 0,
      stepsRemaining: 16 + Math.floor(Math.random() * 20),
      active: true,
    });
  }

  let lastTime = performance.now();

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (cols === 0 || rows === 0) { raf = requestAnimationFrame(loop); return; }

    // 1. Yeni Sonda Tetikleme (Haritada yeni devre izleri oymak icin)
    spawnTimer -= dt;
    if (spawnTimer <= 0 && probes.length < 14) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (grid[r] && grid[r][c] && !grid[r][c].blocked && !grid[r][c].isCard) {
        const dir = DIRS[Math.floor(Math.random() * DIRS.length)];
        spawnProbe(r, c, dir);
      }
      spawnTimer = 0.35 + Math.random() * 0.6;
    }

    // 2. Kurulu Devrelerde Elektrik Akimi (Pulse)
    pulseTimer -= dt;
    if (pulseTimer <= 0 && pulses.length < 18) {
      spawnPulseOnCircuit();
      pulseTimer = 0.2 + Math.random() * 0.3;
    }

    // 3. Sondalarin Ilerlemesi & Devreye Donusmesi (Path -> Solidified Circuit)
    for (let i = probes.length - 1; i >= 0; i--) {
      const probe = probes[i];
      if (!probe.active) { probes.splice(i, 1); continue; }

      probe.moveTimer -= dt;
      if (probe.moveTimer > 0) continue;
      probe.moveTimer = 1.0 / probe.speed;

      probe.stepsRemaining--;
      if (probe.stepsRemaining <= 0) {
        probe.active = false;
        placeRectangle(probe.r, probe.c, BOLD_TEXTS[Math.floor(Math.random() * BOLD_TEXTS.length)]);
        continue;
      }

      // Devre mimarisi ilerleme karari (%75 duz bus hatti, %25 90 derece dik donus)
      const valid = [];
      for (const d of DIRS) {
        const nr = probe.r + d.dr, nc = probe.c + d.dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (grid[nr][nc].isCard) continue;
        if (d.dr === -probe.dir.dr && d.dc === -probe.dir.dc) continue;

        let weight = 1.0;
        if (d.name === probe.dir.name) weight = 3.6;
        valid.push({ d, nr, nc, weight });
      }

      if (valid.length === 0) {
        probe.active = false;
        placeRectangle(probe.r, probe.c, BOLD_TEXTS[Math.floor(Math.random() * BOLD_TEXTS.length)]);
        continue;
      }

      let totalW = valid.reduce((sum, v) => sum + v.weight, 0);
      let rand = Math.random() * totalW;
      let chosen = valid[valid.length - 1];
      for (let j = 0; j < valid.length; j++) {
        rand -= valid[j].weight;
        if (rand <= 0) { chosen = valid[j]; break; }
      }

      // Devre baglantisini katilastir (Solidify into circuit trace)
      const currCell = grid[probe.r][probe.c];
      const nextCell = grid[chosen.nr][chosen.nc];

      currCell.val |= chosen.d.bit;
      currCell.isEtched = true;
      currCell.pulse = 1.0;
      currCell.life = 35.0;

      nextCell.val |= chosen.d.opp;
      nextCell.isEtched = true;
      nextCell.pulse = 1.0;
      nextCell.life = 35.0;
      nextCell.blocked = true;

      markDirty(probe.r, probe.c);
      markDirty(chosen.nr, chosen.nc);

      // Catallanan paralel devre yolu
      if (Math.random() < 0.05 && probes.length < 16 && valid.length > 1) {
        const alt = valid.find(v => v.d.name !== chosen.d.name);
        if (alt) {
          probes.push({
            r: probe.r, c: probe.c, dir: alt.d,
            speed: probe.speed,
            moveTimer: 0,
            stepsRemaining: 12 + Math.floor(Math.random() * 16),
            active: true,
          });
        }
      }

      probe.r = chosen.nr;
      probe.c = chosen.nc;
      probe.dir = chosen.d;
    }

    // 4. Akim Dalgalari (Pulses flowing through existing circuit tracks)
    for (let i = pulses.length - 1; i >= 0; i--) {
      const pulse = pulses[i];
      if (!pulse.active) { pulses.splice(i, 1); continue; }

      pulse.moveTimer -= dt;
      if (pulse.moveTimer > 0) continue;
      pulse.moveTimer = 1.0 / pulse.speed;

      pulse.stepsRemaining--;
      if (pulse.stepsRemaining <= 0) { pulse.active = false; continue; }

      const currCell = grid[pulse.r]?.[pulse.c];
      if (!currCell || currCell.val === 0) { pulse.active = false; continue; }

      currCell.pulse = 1.0;
      markDirty(pulse.r, pulse.c);

      const nextOptions = [];
      for (const d of DIRS) {
        if (currCell.val & d.bit) {
          const nr = pulse.r + d.dr, nc = pulse.c + d.dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            if (!(d.dr === -pulse.dir.dr && d.dc === -pulse.dir.dc)) {
              nextOptions.push({ d, nr, nc });
            }
          }
        }
      }

      if (nextOptions.length === 0) { pulse.active = false; continue; }
      const nextStep = nextOptions[Math.floor(Math.random() * nextOptions.length)];
      pulse.r = nextStep.nr;
      pulse.c = nextStep.nc;
      pulse.dir = nextStep.d;
    }

    // 5. Nabiz Sonumu ve Devre Yasami
    const toRemove = [];
    for (const key of dirtySet) {
      const r = Math.floor(key / cols), c = key % cols;
      if (r >= rows || c >= cols) { toRemove.push(key); continue; }
      const cell = grid[r][c];

      if (cell.pulse > 0) {
        cell.pulse = Math.max(0, cell.pulse - dt * 2.8);
      }

      if (cell.life > 0) {
        cell.life -= dt;
        if (cell.life <= 0) {
          if (cell.isCard && cell.cardOriginR === r && cell.cardOriginC === c) {
            for (let i = 0; i < cell.cardH; i++) {
              for (let j = 0; j < cell.cardW; j++) {
                const nr = r + i, nc = c + j;
                if (nr < rows && nc < cols) resetCell(grid[nr][nc], nr, nc);
              }
            }
          } else if (!cell.isCard) {
            resetCell(cell, r, c);
          }
          toRemove.push(key);
        }
      } else if (cell.val === 0 && !cell.isCard) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) dirtySet.delete(key);

    // ── RENDER (0ms GPU, 60 FPS Saf Vektor ve Minimal Dikdortgenler) ──────
    ctx.clearRect(0, 0, w, h);

    // A. BATCH 1: Kalici Kazinmis Devre Hatlari (Etched Circuit Traces - 1 Draw Call)
    ctx.strokeStyle = 'rgba(75, 90, 115, 0.42)'; // Mat arduvaz metalik PCB izi
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const key of dirtySet) {
      const r = Math.floor(key / cols), c = key % cols;
      const cell = grid[r][c];
      if (!cell.isEtched || cell.val === 0 || cell.isCard) continue;
      const cx = c * CELL_W + CELL_W / 2;
      const cy = r * CELL_H + CELL_H / 2;
      if (cell.val & 1) { ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - CELL_H / 2); }
      if (cell.val & 2) { ctx.moveTo(cx, cy); ctx.lineTo(cx + CELL_W / 2, cy); }
      if (cell.val & 4) { ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + CELL_H / 2); }
      if (cell.val & 8) { ctx.moveTo(cx, cy); ctx.lineTo(cx - CELL_W / 2, cy); }
    }
    ctx.stroke();

    // B. BATCH 2: Devre Boyunca Parlayan Elektrik Akimi (Luminous Current Surge)
    ctx.strokeStyle = 'rgba(215, 235, 255, 0.88)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const key of dirtySet) {
      const r = Math.floor(key / cols), c = key % cols;
      const cell = grid[r][c];
      if (cell.pulse <= 0.05 || cell.val === 0 || cell.isCard) continue;
      const cx = c * CELL_W + CELL_W / 2;
      const cy = r * CELL_H + CELL_H / 2;
      if (cell.val & 1) { ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - CELL_H / 2); }
      if (cell.val & 2) { ctx.moveTo(cx, cy); ctx.lineTo(cx + CELL_W / 2, cy); }
      if (cell.val & 4) { ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + CELL_H / 2); }
      if (cell.val & 8) { ctx.moveTo(cx, cy); ctx.lineTo(cx - CELL_W / 2, cy); }
    }
    ctx.stroke();

    // C. BATCH 3: Lehim Vias / Kavsak Noktalari (T ve 4 Yonlu Kesisimler)
    ctx.fillStyle = '#94a3b8';
    for (const key of dirtySet) {
      const r = Math.floor(key / cols), c = key % cols;
      const cell = grid[r][c];
      if (!cell.isEtched || cell.val === 0 || cell.isCard) continue;
      const conn = ((cell.val & 1) ? 1 : 0) + ((cell.val & 2) ? 1 : 0) + ((cell.val & 4) ? 1 : 0) + ((cell.val & 8) ? 1 : 0);
      if (conn >= 3) {
        const cx = c * CELL_W + CELL_W / 2;
        const cy = r * CELL_H + CELL_H / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // D. Sonda Basliklari (Canli Sinyal On Ucu)
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < probes.length; i++) {
      const p = probes[i];
      if (!p.active) continue;
      const px = p.c * CELL_W + CELL_W / 2;
      const py = p.r * CELL_H + CELL_H / 2;
      ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
    }

    // E. DOGRUDAN DIKDORTGEN ENDPOINTLER (Minimal, Net, Kalin Yazili IC Modulleri)
    const activeCards = [];
    for (const key of dirtySet) {
      const r = Math.floor(key / cols), c = key % cols;
      const cell = grid[r]?.[c];
      if (cell && cell.cardLabel && cell.cardOriginR === r && cell.cardOriginC === c) {
        activeCards.push({ r, c, cell });
      }
    }

    if (activeCards.length > 0) {
      ctx.font = 'bold 11px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < activeCards.length; i++) {
        const { r, c, cell } = activeCards[i];
        const textW = ctx.measureText(cell.cardLabel).width;
        const cw = Math.max(CELL_W * cell.cardW, Math.ceil(textW + 16));
        const ch = CELL_H * cell.cardH;
        const sx = c * CELL_W;
        const sy = r * CELL_H;

        // 1. Duz Koyu Dikdortgen Govde
        ctx.fillStyle = '#06070a';
        ctx.fillRect(sx, sy, cw, ch);

        // 2. Net 1px Dikdortgen Cerceve
        ctx.strokeStyle = 'rgba(160, 175, 195, 0.75)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + 0.5, sy + 0.5, cw - 1, ch - 1);

        // 3. Yan Pinler (Devre Karti Cip Bacaklari)
        ctx.fillStyle = '#64748b';
        ctx.fillRect(sx - 2, sy + Math.floor(ch / 2) - 1, 2, 2);
        ctx.fillRect(sx + cw, sy + Math.floor(ch / 2) - 1, 2, 2);

        // 4. Arkadaki Kalin Metin
        ctx.fillStyle = '#f1f5f9';
        ctx.fillText(cell.cardLabel, sx + cw / 2, sy + ch / 2);
      }
    }

    raf = requestAnimationFrame(loop);
  }

  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    if (ro) ro.disconnect();
  };
}

export default function PathDrops() {
  const canvasRef = useRef(null);
  useEffect(() => {
    return initPathDrops(canvasRef.current);
  }, []);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', backgroundColor: '#000000' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
    </div>
  );
}
