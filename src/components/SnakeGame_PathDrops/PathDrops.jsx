import React, { useRef, useEffect } from 'react';

const CELL_W = 14;
const CELL_H = 24;

const CHAR_MAP = {
  0: ' ', 1: '│', 2: '─', 3: '└', 4: '│',
  5: '│', 6: '┌', 7: '├', 8: '─',
  9: '┘', 10: '─', 11: '┴', 12: '┐',
  13: '┤', 14: '┬', 15: '┼'
};

const DECAY_CHARS = ['─', '╌', '╌', '·', '·', ' '];
const DECAY_CHARS_V = ['│', '╎', '╎', '·', '·', ' '];

const DIRS = [
  { dr: -1, dc: 0, bit: 1, opp: 4, name: 'up' },
  { dr: 0, dc: 1, bit: 2, opp: 8, name: 'right' },
  { dr: 1, dc: 0, bit: 4, opp: 1, name: 'down' },
  { dr: 0, dc: -1, bit: 8, opp: 2, name: 'left' }
];

const NODE_NAMES = [
  'render.fn', 'signal.rx', 'pulse.tx', 'trace.io', 'mesh.rs',
  'index.rx', 'event.loop', 'heap.alloc', 'stack.pop', 'fork.proc',
  'sync.gate', 'flux.wire', 'gate.logic', 'patch.diff', 'resolve.fn',
  'compile.sh', 'link.obj', 'gc.sweep', 'ref.count', 'drop.fn',
  'bind.ctx', 'emit.evt', 'parse.ast', 'eval.expr', 'exec.cmd',
];

const WALL_TEXTS = [
  'HALT', 'DENY', 'EDGE', 'VOID', 'LIMIT', 'FAULT', 'BLOCK', 'MISS', 'LOST', 'NULL',
  'SANCTUM', 'HERESY', 'LITANY', 'REQUIEM', 'VIGIL', 'MARTYR', 'NO MERCY', 'CORPUS',
  'ABSOLVED', 'REMNANT', '404', 'BOUNDARY', 'END OF LINE', 'REJECT', 'OVERFLOW',
];
const PATH_TEXTS = [
  'LOOP', 'TRACE', 'DRIFT', 'DEAD', 'STATIC', 'NOISE', 'BLEED', 'STALL', 'STRAY', 'GHOST',
  'NULL//GOD', 'SYS.FALL', 'VOID.EXE', 'CORRUPT', 'MACHINE SIN', 'THE FALL',
  'NO SIGNAL', 'LOST ARK', 'DEAD LOOP', 'PURGATORY', 'LIMBO', 'UNCLEAN',
  'SIGNAL//0', 'DEADEND', 'TRACE ERR', 'BAD ALLOC', 'OVERFLOW', 'REROUTE',
];
const STOP_TEXTS = [
  'IDLE', 'WAIT', 'HOLD', 'PARK', 'REST', 'PAUSE', 'SLEEP', 'QUEUE', 'CACHE', 'LATCH',
  'SANCTIFIED', 'MERCY.EXE', 'CHECKPOINT', 'SAVE STATE', 'ABSOLUTION',
  'THRESHOLD', 'DORMANT', 'STANDBY', 'HIBERNATE', 'BUFFERING', 'STANDBY',
  'SAFE ZONE', 'RECOVERY', 'SUSPEND', 'ARCHIVE',
];

const CONFIG = {
  drops: { max: 55, spawnInterval: [0.25, 0.65], speed: [4, 9] },
  fork: { chance: 0.055 },
  card: { stopChance: 0.004, pathCardChance: 0.45 },
  fade: { lifeBase: 8.0, intensityDecay: 0.055, decayStages: 5 },
  node: {
    buffer: 2,
    spawnChance: 0.17,
    maxNodes: 9,
    nodeLife: 22.0,
    nodeSpawnDrops: 3,
    nodeSpawnInterval: [1.4, 3.2],
  },
  scatter: { resetEvery: 12, resetChance: 0.52 },
};

const DROP_STATES = { ALIVE: 'alive', DYING: 'dying', DEAD: 'dead' };

function pathColor(intensity, age) {
  const base = Math.round(175 - age * 115);
  return `rgba(${base},${base},${base + 12},${Math.max(0.04, intensity * 0.52)})`;
}
function headColor() { return 'rgba(215,215,228,0.85)'; }
function glowColor() { return 'rgba(175,175,198,0.2)'; }
function nodeStroke(a) { return `rgba(155,150,168,${a})`; }
function nodeLabel(a) { return `rgba(195,190,208,${a})`; }
function cardBg(a) { return `rgba(7,7,11,${a})`; }
function cardBorder(a) { return `rgba(115,110,132,${a})`; }
function cardText(a) { return `rgba(175,170,192,${a})`; }

export function initPathDrops(cvs) {
  if (!cvs) return () => {};
    const ctx = cvs.getContext('2d');
    let raf, w, h, cols, rows;
    let grid = [], drops = [];
    const dirtySet = new Set();
    let nodes = [], nodeIdSeq = 0;
    let spawnTimer = 0.3;

    let currentFont = '';
    function setFont(f) { if (f !== currentFont) { ctx.font = f; currentFont = f; } }

    function makeCell() {
      return {
        val: 0, boxText: null, intensity: 0, life: 0,
        blocked: false, isCard: false,
        cardLabel: null, cardWCells: 0,
        cardOriginR: -1, cardOriginC: -1,
        age: 0, decayStage: 0, isHorizontal: true
      };
    }
    function markDirty(r, c) {
      if (r >= 0 && r < rows && c >= 0 && c < cols) dirtySet.add(r * cols + c);
    }
    function resetCell(cell, r, c) { Object.assign(cell, makeCell()); markDirty(r, c); }
    function clearCardRegion(oR, oC, cW, cH) {
      for (let i = -1; i <= cH; i++)
        for (let j = -1; j <= cW; j++) {
          const r = oR + i, c = oC + j;
          if (r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c].isCard)
            resetCell(grid[r][c], r, c);
        }
    }

    function inNode(r, c) {
      for (const n of nodes)
        if (n.active && r >= n.r && r < n.r + n.h && c >= n.c && c < n.c + n.w) return true;
      return false;
    }
    function inNodeBuf(r, c, buf) {
      for (const n of nodes)
        if (n.active && r >= n.r - buf && r < n.r + n.h + buf && c >= n.c - buf && c < n.c + n.w + buf) return true;
      return false;
    }

    function build() {
      const p = cvs.parentElement;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = p ? p.clientWidth : (cvs.style.width ? parseFloat(cvs.style.width) : (cvs.width ? cvs.width / dpr : 800));
      h = p ? p.clientHeight : (cvs.style.height ? parseFloat(cvs.style.height) : (cvs.height ? cvs.height / dpr : 600));
      if (!w || !h || isNaN(w) || isNaN(h)) { w = 800; h = 600; }
      cvs.width = w * dpr; cvs.height = h * dpr;
      cvs.style.width = w + 'px'; cvs.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.max(5, Math.ceil(w / CELL_W));
      rows = Math.max(5, Math.ceil(h / CELL_H));
      grid = Array.from({ length: rows }, () => Array.from({ length: cols }, makeCell));
      drops = []; nodes = []; dirtySet.clear();
    }
    build();
    let ro = null;
    if (cvs.parentElement) {
      ro = new ResizeObserver(build);
      ro.observe(cvs.parentElement);
    }

    let lastTime = performance.now();

    // Find the largest open area on screen to use as a wander target
    function findOpenTarget(fromR, fromC) {
      // Sample random cells, score by emptiness in neighbourhood
      let bestR = fromR, bestC = fromC, bestScore = -1;
      for (let attempt = 0; attempt < 18; attempt++) {
        const tr = Math.floor(Math.random() * rows);
        const tc = Math.floor(Math.random() * cols);
        if (inNodeBuf(tr, tc, 3)) continue;
        // Score: count empty cells in radius 5
        let score = 0;
        const rad = 6;
        for (let dr = -rad; dr <= rad; dr += 2)
          for (let dc = -rad; dc <= rad; dc += 2) {
            const nr = tr + dr, nc = tc + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
              !grid[nr][nc].blocked && grid[nr][nc].val === 0) score++;
          }
        // Prefer distance from origin
        const dist = Math.abs(tr - fromR) + Math.abs(tc - fromC);
        score += Math.floor(dist * 0.3);
        if (score > bestScore) { bestScore = score; bestR = tr; bestC = tc; }
      }
      return { r: bestR, c: bestC };
    }

    function spawnDrop(r, c, dir, targetR = -1, targetC = -1, fromNodeId = null) {
      if (r < 0 || r >= rows || c < 0 || c >= cols) return;
      if (grid[r][c].blocked) return;
      drops.push({
        r, c, dir,
        speed: CONFIG.drops.speed[0] + Math.random() * (CONFIG.drops.speed[1] - CONFIG.drops.speed[0]),
        moveTimer: 0,
        state: DROP_STATES.ALIVE,
        dyingTimer: 0,
        steps: 0,
        visitedDirs: new Set(),
        targetR, targetC,   // wander target (open space)
        fromNodeId,
        retargetTimer: 0,   // periodically re-find open space
      });
      const cell = grid[r][c];
      cell.intensity = 1.0; cell.life = CONFIG.fade.lifeBase;
      cell.blocked = true; cell.age = 0;
      markDirty(r, c);
    }

    function spawnFromRect(nr, nc, nw, nh, fromNodeId = null) {
      const edges = [];
      for (let dc = 0; dc < nw; dc++) {
        if (nr - 1 >= 0 && !inNodeBuf(nr - 1, nc + dc, 1) && !grid[nr - 1]?.[nc + dc]?.blocked)
          edges.push({ r: nr - 1, c: nc + dc, d: DIRS[0] });
        if (nr + nh < rows && !inNodeBuf(nr + nh, nc + dc, 1) && !grid[nr + nh]?.[nc + dc]?.blocked)
          edges.push({ r: nr + nh, c: nc + dc, d: DIRS[2] });
      }
      for (let dr = 0; dr < nh; dr++) {
        if (nc - 1 >= 0 && !inNodeBuf(nr + dr, nc - 1, 1) && !grid[nr + dr]?.[nc - 1]?.blocked)
          edges.push({ r: nr + dr, c: nc - 1, d: DIRS[3] });
        if (nc + nw < cols && !inNodeBuf(nr + dr, nc + nw, 1) && !grid[nr + dr]?.[nc + nw]?.blocked)
          edges.push({ r: nr + dr, c: nc + nw, d: DIRS[1] });
      }
      if (!edges.length) return;
      const e = edges[Math.floor(Math.random() * edges.length)];
      const tgt = findOpenTarget(e.r, e.c);
      spawnDrop(e.r, e.c, e.d, tgt.r, tgt.c, fromNodeId);
    }

    function trySpawnNode(nearR, nearC) {
      const active = nodes.filter(n => n.active);
      if (active.length >= CONFIG.node.maxNodes) return null;
      const nw = 7, nh = 3;
      for (let attempt = 0; attempt < 40; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 10 + Math.random() * 15;
        const tr = Math.floor(nearR + Math.sin(angle) * dist);
        const tc = Math.floor(nearC + Math.cos(angle) * dist);
        const cr = Math.max(1, Math.min(rows - nh - 1, tr));
        const cc = Math.max(1, Math.min(cols - nw - 1, tc));
        let ok = true;
        for (let i = -2; i <= nh + 1 && ok; i++)
          for (let j = -2; j <= nw + 1 && ok; j++)
            if (inNodeBuf(cr + i, cc + j, 2)) ok = false;
        if (!ok) continue;
        const node = {
          id: ++nodeIdSeq,
          label: NODE_NAMES[Math.floor(Math.random() * NODE_NAMES.length)],
          r: cr, c: cc, w: nw, h: nh,
          life: CONFIG.node.nodeLife,
          maxLife: CONFIG.node.nodeLife,
          pulse: 0, hitInt: 0,
          time: Math.random() * 10,
          borderAng: Math.random() * Math.PI * 2,
          spawnTimer: CONFIG.node.nodeSpawnInterval[0] +
            Math.random() * (CONFIG.node.nodeSpawnInterval[1] - CONFIG.node.nodeSpawnInterval[0]),
          active: true,
        };
        nodes.push(node);
        return node;
      }
      return null;
    }

    function selectNextMove(drop, validDirs, dt) {
      // Periodically retarget to a fresh open area
      drop.retargetTimer -= dt;
      if (drop.retargetTimer <= 0) {
        const tgt = findOpenTarget(drop.r, drop.c);
        drop.targetR = tgt.r; drop.targetC = tgt.c;
        drop.retargetTimer = 3.5 + Math.random() * 4.0;
      }

      const forceScatter =
        drop.steps > 0 &&
        drop.steps % CONFIG.scatter.resetEvery === 0 &&
        Math.random() < CONFIG.scatter.resetChance;
      if (forceScatter) {
        // On scatter, also retarget
        const tgt = findOpenTarget(drop.r, drop.c);
        drop.targetR = tgt.r; drop.targetC = tgt.c;
        return validDirs[Math.floor(Math.random() * validDirs.length)];
      }

      const weights = validDirs.map(v => {
        let wt = 1.0;
        if (v.d.name === drop.dir.name) wt *= 1.8;          // mild momentum
        if (v.d.dr === -drop.dir.dr && v.d.dc === -drop.dir.dc) wt *= 0.04; // no U-turn
        if (drop.visitedDirs.has(v.d.name)) wt *= 0.35;

        // Bias toward open-space target
        if (drop.targetR >= 0) {
          const cd = Math.abs(drop.r - drop.targetR) + Math.abs(drop.c - drop.targetC);
          const nd = Math.abs(v.nr - drop.targetR) + Math.abs(v.nc - drop.targetC);
          if (nd < cd) wt *= 2.8;
          else if (nd > cd) wt *= 0.45;
        }
        return wt;
      });
      const total = weights.reduce((a, b) => a + b, 0);
      let rand = Math.random() * total;
      for (let i = 0; i < validDirs.length; i++) { rand -= weights[i]; if (rand <= 0) return validDirs[i]; }
      return validDirs[validDirs.length - 1];
    }

    function placeCard(r, c, label) {
      const cardW = 4, cardH = 2;
      let cr = Math.max(1, Math.min(rows - cardH - 1, r));
      let cc = Math.max(1, Math.min(cols - cardW - 1, c));
      for (let i = -1; i <= cardH; i++)
        for (let j = -1; j <= cardW; j++) {
          const cr2 = cr + i, cc2 = cc + j;
          if (cr2 >= 0 && cr2 < rows && cc2 >= 0 && cc2 < cols)
            if (inNode(cr2, cc2) || grid[cr2][cc2].isCard) {
              if (!grid[r][c].isCard) {
                // fallback: small symbol only sometimes
                if (Math.random() < 0.5) {
                  const sym = ['·', '◦', '▪', '▫', '×', '○', '□', '△'];
                  const cell = grid[r][c];
                  cell.val = 0; cell.boxText = sym[Math.floor(Math.random() * sym.length)];
                  cell.blocked = true; cell.isCard = true;
                  cell.intensity = 1.0; cell.life = 5.0;
                  cell.cardOriginR = r; cell.cardOriginC = c;
                  markDirty(r, c);
                }
              }
              return;
            }
        }
      for (let i = -1; i <= cardH; i++)
        for (let j = -1; j <= cardW; j++) {
          const cr2 = cr + i, cc2 = cc + j;
          if (cr2 >= 0 && cr2 < rows && cc2 >= 0 && cc2 < cols) {
            const cell = grid[cr2][cc2];
            cell.val = 0; cell.boxText = null;
            cell.blocked = true; cell.isCard = true;
            cell.cardOriginR = cr; cell.cardOriginC = cc;
            cell.cardWCells = cardW;
            if (i >= 0 && i < cardH && j >= 0 && j < cardW) {
              cell.intensity = 1.0; cell.life = 7.0 + Math.random() * 2.0;
            } else { cell.intensity = 0.18; cell.life = 4.0; }
            markDirty(cr2, cc2);
          }
        }
      const sv = (row, col, val) => {
        if (row >= 0 && row < rows && col >= 0 && col < cols) { grid[row][col].val = val; markDirty(row, col); }
      };
      sv(cr, cc, 6); sv(cr, cc + 1, 10); sv(cr, cc + 2, 10); sv(cr, cc + 3, 12);
      sv(cr + 1, cc, 3); sv(cr + 1, cc + 1, 10); sv(cr + 1, cc + 2, 10); sv(cr + 1, cc + 3, 9);
      grid[cr][cc].cardLabel = label;
      grid[cr][cc].cardWCells = cardW;
      markDirty(cr, cc);
    }

    function drawSatNode(n) {
      const lifeRatio = Math.min(1, n.life / n.maxLife);
      const fadeIn = Math.min(1, (n.maxLife - n.life) * 1.2);
      const fadeOut = Math.min(1, n.life * 0.45);
      const alpha = Math.min(fadeIn, fadeOut) * 0.88;
      if (alpha <= 0) return;

      const total = Math.min(1.0, n.pulse + n.hitInt);
      const cxPx = n.c * CELL_W, cyPx = n.r * CELL_H;
      const cwPx = n.w * CELL_W, chPx = n.h * CELL_H;
      const cx = cxPx + cwPx / 2, cy = cyPx + chPx / 2;

      ctx.fillStyle = `rgba(6,6,9,${alpha * 0.88})`;
      ctx.fillRect(cxPx, cyPx, cwPx, chPx);
      ctx.strokeStyle = nodeStroke((0.32 + total * 0.28) * alpha);
      ctx.lineWidth = 1;
      ctx.strokeRect(cxPx, cyPx, cwPx, chPx);

      const tick = 5, drift = Math.sin(n.borderAng) * 1.4;
      const corners = [
        { x: cxPx, y: cyPx, sx: 1, sy: 1 },
        { x: cxPx + cwPx, y: cyPx, sx: -1, sy: 1 },
        { x: cxPx, y: cyPx + chPx, sx: 1, sy: -1 },
        { x: cxPx + cwPx, y: cyPx + chPx, sx: -1, sy: -1 },
      ];
      ctx.strokeStyle = nodeStroke((0.48 + total * 0.38) * alpha);
      ctx.lineWidth = 1;
      for (const { x, y, sx, sy } of corners) {
        const tx = x + sx * drift, ty = y + sy * drift;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + sx * tick, ty); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, ty + sy * tick); ctx.stroke();
      }

      setFont('bold 10px "Share Tech Mono",monospace');
      ctx.fillStyle = nodeLabel((0.42 + total * 0.32) * alpha);
      ctx.textAlign = 'center';
      ctx.fillText(n.label, cx, cy - 2);

      // Life bar
      const barW = (cwPx - 10) * lifeRatio;
      ctx.fillStyle = `rgba(75,73,88,${0.32 * alpha})`;
      ctx.fillRect(cxPx + 5, cyPx + chPx - 5, cwPx - 10, 2);
      ctx.fillStyle = `rgba(145,140,162,${0.55 * alpha})`;
      ctx.fillRect(cxPx + 5, cyPx + chPx - 5, barW, 2);

      if (n.hitInt > 0) {
        ctx.globalCompositeOperation = 'screen';
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, cwPx * 0.6);
        grd.addColorStop(0, `rgba(155,150,175,${n.hitInt * 0.1})`);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(cx - cwPx, cy - chPx, cwPx * 2, chPx * 2);
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    function loop(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (cols === 0 || rows === 0) { raf = requestAnimationFrame(loop); return; }

      // Update nodes
      for (let ni = nodes.length - 1; ni >= 0; ni--) {
        const n = nodes[ni]; if (!n.active) continue;
        n.time += dt; n.life -= dt;
        n.pulse = 0.14 + 0.07 * Math.sin(n.time * 0.85);
        n.borderAng = (n.borderAng + dt * 0.32) % (Math.PI * 2);
        if (n.hitInt > 0) n.hitInt = Math.max(0, n.hitInt - dt * 0.55);
        n.spawnTimer -= dt;
        if (n.spawnTimer <= 0 && drops.length < CONFIG.drops.max) {
          spawnFromRect(n.r, n.c, n.w, n.h, n.id);
          n.spawnTimer = CONFIG.node.nodeSpawnInterval[0] +
            Math.random() * (CONFIG.node.nodeSpawnInterval[1] - CONFIG.node.nodeSpawnInterval[0]);
        }
        if (n.life <= 0) { n.active = false; nodes.splice(ni, 1); }
      }

      // Random ambient spawns — spread across screen
      spawnTimer -= dt;
      if (spawnTimer <= 0 && drops.length < CONFIG.drops.max) {
        let attempts = 25;
        while (attempts-- > 0) {
          const r = Math.floor(Math.random() * rows);
          const c = Math.floor(Math.random() * cols);
          if (grid[r] && grid[r][c] && !inNodeBuf(r, c, CONFIG.node.buffer) &&
            grid[r][c].val === 0 && !grid[r][c].blocked) {
            const dir = DIRS[Math.floor(Math.random() * DIRS.length)];
            const tgt = findOpenTarget(r, c);
            spawnDrop(r, c, dir, tgt.r, tgt.c, null);
            break;
          }
        }
        spawnTimer = CONFIG.drops.spawnInterval[0] +
          Math.random() * (CONFIG.drops.spawnInterval[1] - CONFIG.drops.spawnInterval[0]);
      }

      // Update drops
      for (let i = drops.length - 1; i >= 0; i--) {
        const drop = drops[i];
        if (drop.state === DROP_STATES.DYING) {
          drop.dyingTimer -= dt;
          if (drop.dyingTimer <= 0) drop.state = DROP_STATES.DEAD;
          continue;
        }
        if (drop.state === DROP_STATES.DEAD) { drops.splice(i, 1); continue; }

        drop.moveTimer -= dt;
        if (drop.moveTimer > 0) continue;
        drop.moveTimer = 1.0 / drop.speed;

        const validDirs = [];
        for (const d of DIRS) {
          const nr = drop.r + d.dr, nc = drop.c + d.dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (grid[nr][nc].isCard) continue;
          if (inNode(nr, nc)) {
            const hn = nodes.find(n => n.active && nr >= n.r && nr < n.r + n.h && nc >= n.c && nc < n.c + n.w);
            if (hn) hn.hitInt = Math.min(1.0, hn.hitInt + 0.3);
            continue;
          }
          if (grid[nr][nc].val === 0 && !grid[nr][nc].blocked)
            validDirs.push({ d, nr, nc });
        }

        if (validDirs.length > 0) {
          const nextMove = selectNextMove(drop, validDirs, dt);
          drop.visitedDirs.add(nextMove.d.name);
          drop.steps++;

          // Fork
          if (validDirs.length > 1 && Math.random() < CONFIG.fork.chance &&
            drops.length < CONFIG.drops.max - 1) {
            const others = validDirs.filter(v => v.d.name !== nextMove.d.name);
            if (others.length > 0) {
              const fm = others[Math.floor(Math.random() * others.length)];
              const tgt = findOpenTarget(drop.r, drop.c);
              drops.push({
                r: drop.r, c: drop.c, dir: fm.d,
                speed: CONFIG.drops.speed[0] + Math.random() * (CONFIG.drops.speed[1] - CONFIG.drops.speed[0]),
                moveTimer: 0, state: DROP_STATES.ALIVE, dyingTimer: 0,
                steps: 0, visitedDirs: new Set(),
                targetR: tgt.r, targetC: tgt.c,
                fromNodeId: drop.fromNodeId,
                retargetTimer: 3.0 + Math.random() * 3.0,
              });
              grid[drop.r][drop.c].val |= fm.d.bit;
              grid[fm.nr][fm.nc].val |= fm.d.opp;
              grid[fm.nr][fm.nc].life = CONFIG.fade.lifeBase + Math.random() * 2;
              grid[fm.nr][fm.nc].blocked = true;
              grid[fm.nr][fm.nc].isHorizontal = fm.d.dc !== 0;
              markDirty(drop.r, drop.c); markDirty(fm.nr, fm.nc);
            }
          }

          grid[drop.r][drop.c].val |= nextMove.d.bit;
          const nc2 = grid[nextMove.nr][nextMove.nc];
          nc2.val |= nextMove.d.opp;
          nc2.life = CONFIG.fade.lifeBase + Math.random() * 2;
          nc2.intensity = 1.0;
          nc2.blocked = true;
          nc2.age = 0;
          nc2.decayStage = 0;
          nc2.isHorizontal = nextMove.d.dc !== 0;
          markDirty(drop.r, drop.c); markDirty(nextMove.nr, nextMove.nc);

          drop.r = nextMove.nr; drop.c = nextMove.nc; drop.dir = nextMove.d;

          if (Math.random() < CONFIG.card.stopChance) {
            drop.state = DROP_STATES.DYING; drop.dyingTimer = 0.1;
            placeCard(drop.r, drop.c, STOP_TEXTS[Math.floor(Math.random() * STOP_TEXTS.length)]);
          }

        } else {
          drop.state = DROP_STATES.DYING; drop.dyingTimer = 0.1;
          const fr = drop.r + drop.dir.dr, fc = drop.c + drop.dir.dc;
          const oob = fr < 0 || fr >= rows || fc < 0 || fc >= cols;
          const hNode = !oob && inNode(fr, fc);
          const hCard = !oob && !hNode && grid[fr][fc].isCard;

          if (oob || hNode) {
            if (Math.random() < CONFIG.node.spawnChance) {
              const nn = trySpawnNode(drop.r, drop.c);
              if (nn) {
                for (let k = 0; k < CONFIG.node.nodeSpawnDrops; k++)
                  if (drops.length < CONFIG.drops.max)
                    spawnFromRect(nn.r, nn.c, nn.w, nn.h, nn.id);
              } else {
                placeCard(drop.r, drop.c, WALL_TEXTS[Math.floor(Math.random() * WALL_TEXTS.length)]);
              }
            } else {
              placeCard(drop.r, drop.c, WALL_TEXTS[Math.floor(Math.random() * WALL_TEXTS.length)]);
            }
          } else if (hCard) {
            // Always place a card here too
            placeCard(drop.r, drop.c, PATH_TEXTS[Math.floor(Math.random() * PATH_TEXTS.length)]);
          } else {
            // Dead end on path — higher chance of card
            if (Math.random() < CONFIG.card.pathCardChance)
              placeCard(drop.r, drop.c, PATH_TEXTS[Math.floor(Math.random() * PATH_TEXTS.length)]);
            else {
              const cell = grid[drop.r][drop.c];
              cell.blocked = true; cell.isCard = true;
              markDirty(drop.r, drop.c);
            }
          }
        }
      }

      // Decay
      const toRemove = [];
      for (const key of dirtySet) {
        const r = Math.floor(key / cols), c = key % cols;
        if (r >= rows || c >= cols) { toRemove.push(key); continue; }
        const cell = grid[r][c];
        if (cell.intensity > 0) {
          if (cell.life > 0) {
            cell.life -= dt;
            cell.age = Math.min(1, cell.age + dt * 0.026);
          } else {
            const sl = 1.0 / CONFIG.fade.decayStages;
            cell.intensity -= dt * CONFIG.fade.intensityDecay;
            cell.decayStage = Math.min(CONFIG.fade.decayStages,
              Math.floor((1 - cell.intensity) / sl));
            cell.age = Math.min(1, cell.age + dt * 0.062);
            if (cell.intensity <= 0) {
              if (cell.isCard && cell.cardOriginR === r && cell.cardOriginC === c)
                clearCardRegion(r, c, cell.cardWCells || 0, 2);
              else resetCell(cell, r, c);
              toRemove.push(key);
            }
          }
        } else { toRemove.push(key); }
      }
      for (const key of toRemove) dirtySet.delete(key);

      // ── RENDER ─────────────────────────────────────────────────
      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

      // 1. Paths
      setFont('bold 15px "Share Tech Mono",monospace');
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          if (cell.intensity <= 0) continue;
          const px = c * CELL_W + CELL_W / 2, py = r * CELL_H + CELL_H / 2;
          if (cell.val > 0) {
            let char;
            if (cell.decayStage > 0 && !cell.isCard) {
              const arr = cell.isHorizontal ? DECAY_CHARS : DECAY_CHARS_V;
              char = arr[Math.min(cell.decayStage, arr.length - 1)];
            } else { char = CHAR_MAP[cell.val] || ' '; }
            ctx.fillStyle = pathColor(cell.intensity, cell.age);
            ctx.fillText(char, px, py);
          }
          if (cell.boxText) {
            ctx.fillStyle = `rgba(145,142,158,${cell.intensity * 0.68})`;
            ctx.fillText(cell.boxText, px, py);
          }
        }

      // 2. Live heads
      for (const drop of drops) {
        if (drop.state !== DROP_STATES.ALIVE) continue;
        const cell = grid[drop.r][drop.c];
        const char = CHAR_MAP[cell.val] || '█';
        const px = drop.c * CELL_W + CELL_W / 2, py = drop.r * CELL_H + CELL_H / 2;
        ctx.fillStyle = headColor();
        ctx.fillText(char, px, py);
        ctx.globalCompositeOperation = 'screen';
        const g = ctx.createRadialGradient(px, py, 0, px, py, 11);
        g.addColorStop(0, glowColor());
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(px - 11, py - 11, 22, 22);
        ctx.globalCompositeOperation = 'source-over';
      }

      // 3. Cards
      setFont('bold 11px "Share Tech Mono",monospace');
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          if (cell.intensity <= 0 || !cell.cardLabel) continue;
          const boxW = cell.cardWCells || 4;
          const px = c * CELL_W + (CELL_W * boxW) / 2;
          const py = r * CELL_H + (CELL_H * 2) / 2;
          const textW = ctx.measureText(cell.cardLabel).width;
          const cw = Math.max(CELL_W * boxW, textW + 18);
          const ch = CELL_H + 4;
          const sx = px - cw / 2, sy = py - ch / 2;
          ctx.fillStyle = cardBg(cell.intensity * 0.92);
          ctx.fillRect(sx, sy, cw, ch);
          ctx.strokeStyle = cardBorder(cell.intensity * 0.68);
          ctx.lineWidth = 1;
          ctx.strokeRect(sx, sy, cw, ch);
          ctx.strokeStyle = cardBorder(cell.intensity * 0.25);
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(px, sy + ch);
          ctx.lineTo(px, sy + ch + CELL_H * 0.38);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = cardText(cell.intensity);
          ctx.fillText(cell.cardLabel, px, py + 1);
        }

      // 4. Nodes
      for (const n of nodes) if (n.active) drawSatNode(n);

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