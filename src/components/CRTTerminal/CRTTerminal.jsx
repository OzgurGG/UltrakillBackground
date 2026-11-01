import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { LanyardManager } from '../../LanyardManager';
import { initPathDrops } from '../SnakeGame_PathDrops/PathDrops';
import { initCultStream } from '../Header/backgrounds/CultStream/CultStream';
import { crtConfig } from '../../config/crtConfig';
import './CRTTerminal.css';

/**
 * WebGL CRT Terminal Shader
 * 
 * - Ekrana tam oturan (zoom kompanzasyonlu) küresel kavis; kenarlarda siyah boşluk bırakmaz.
 * - Kenarlardaki kırmızı ışıklandırma / rim efekti tamamen kapatıldı.
 * - Header yüksekliği 115px'e büyütüldü; Lanyard alanı sağa ve aşağıya doğru ferahlatıldı.
 */

const HEADER_HEIGHT = 140;
const HEADER_LEFT_WIDTH = 360;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform sampler2D uScene;
  uniform vec2 uResolution;
  uniform float uCurvature;
  uniform float uPhosphorGrid;
  uniform float uVignette;

  varying vec2 vUv;

  // Ekrana tam oturan küresel fıçı eğriliği (kenar siyahlıklarını önler)
  vec2 curve(vec2 uv) {
    vec2 st = uv - 0.5;
    float r2 = dot(st, st);
    // Zoom kompanzasyonu: Kavisin kenarlarda siyah boşluk bırakmasını engeller
    float zoom = 1.0 + 0.42 * uCurvature;
    st *= (1.0 + r2 * uCurvature) / zoom;
    return clamp(st + 0.5, 0.0, 1.0);
  }

  void main() {
    vec2 curvedUv = curve(vUv);

    // Sahneden bükülmüş pikseli oku
    vec4 scene = texture2D(uScene, curvedUv);

    // Saf renkler ve saf siyah zemin (kırmızı tonlama wash filtresi kaldırıldı)
    vec3 color = scene.rgb;

    // İnce mikro fosfor ağı (2.5px)
    if (uPhosphorGrid > 0.01) {
      vec2 pix = curvedUv * uResolution;
      vec2 grid = fract(pix / 2.5);
      float mask = (grid.x < 0.28 || grid.y < 0.28) ? (1.0 - uPhosphorGrid) : 1.0;
      color *= mask;
    }

    // Yumuşak köşe derinliği (vignette)
    vec2 vCent = (curvedUv - 0.5) * 2.0;
    float vig = 1.0 - dot(vCent, vCent) * (uVignette * 0.4);
    color *= clamp(vig, 0.55, 1.0);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// İkonik Monolog & Diyalog Kaynağı (Kullanıcının Eski Dosyalarından)
const PEPSI_DIALOGUE_SRC = [
  { type: "narrate", msg: "I was staring at the screen.", delay: 150 },
  { type: "narrate", msg: "looking at the code, thinking about everything.", delay: 120 },
  { type: "narrate", msg: "but then again, thinking about nothing.", delay: 150 },
  { type: "narrate", msg: "and then the system prompted, and {user} didn't even notice.", delay: 120 },
  { type: "narrate", msg: "it requested input and {user} didn't type.", delay: 120 },
  { type: "narrate", msg: "and then the kernel started throwing errors:", delay: 150 },
  { type: "system", msg: "INPUT_REQUIRED! {USER}!", delay: 250 },
  { type: "narrate", msg: "and {user} goes:", delay: 100 },
  { type: "user", msg: "What? What's the matter?", delay: 150 },
  { type: "narrate", msg: "the system goes:", delay: 80 },
  { type: "system", msg: "IDLE_TIMEOUT. What's the matter with you?", delay: 150 },
  { type: "narrate", msg: "{user} typed:", delay: 80 },
  { type: "user", msg: "Nothing, I'm okay. I'm just thinking you know?", delay: 120 },
  { type: "user", msg: "Why don't you fetch me a Pepsi?", delay: 150 },
  { type: "narrate", msg: "the system goes:", delay: 80 },
  { type: "system", msg: "ERR_UNKNOWN_COMMAND! You're compromised!", delay: 200 },
  { type: "narrate", msg: "{user} goes:", delay: 80 },
  { type: "user", msg: "No, my code is clean, I'm not compromised,", delay: 100 },
  { type: "user", msg: "I'm just thinking, so why don't you fetch me a Pepsi?", delay: 120 },
  { type: "narrate", msg: "and the system goes:", delay: 80 },
  { type: "system", msg: "ACCESS_DENIED! You're crazy!", delay: 200 },
  { type: "narrate", msg: "all {user} wanted was a Pepsi.", delay: 300 },
  { type: "narrate", msg: "just one Pepsi.", delay: 350 },
  { type: "narrate", msg: "and the machine wouldn't give it to them.", delay: 300 },
  { type: "narrate", msg: "just one Pepsi.", delay: 400 },
];

function buildPepsiDialogue(username) {
  const u = username || "ozgur";
  const U = u.toUpperCase();
  return PEPSI_DIALOGUE_SRC.map((item) => {
    let raw = item.msg.replace(/\{user\}/g, u).replace(/\{USER\}/g, U);
    let line = raw;
    if (item.type === 'narrate') {
      line = `:: ${raw}`;
    } else if (item.type === 'user') {
      line = `> ${raw}`;
    } else if (item.type === 'system') {
      if (raw.startsWith('INPUT_REQUIRED') || raw.startsWith('ERR_') || raw.startsWith('ACCESS_')) {
        line = `█ ${raw} █`;
      } else {
        line = `⚠️ [SYS] ${raw}`;
      }
    }
    return {
      text: line,
      delay: item.delay
    };
  });
}

// Onlarca Farklı Teknik ve Karışık Akış: Gerçek JS, Hex Dökümleri, Hatalar, Git Diffleri, Gauges, Şemalar, Disasm, Bitstream, Audio DSP, Telemetri
const SCRIPT_EVENTS = [
  // 1. Teknik: Gerçek JavaScript Fonksiyonu (Nizamî Tab Girintili)
  {
    mode: 'type',
    lines: [
      "// --- [ENGINE] RECURSIVE BACKTRACKER MAZE ---",
      "const generateMaze = (grid, width, height) => {",
      "  const stack = [[0, 0]];",
      "  grid[0][0].visited = true;",
      "",
      "  while (stack.length > 0) {",
      "    const [cx, cy] = stack[stack.length - 1];",
      "    const neighbors = getUnvisited(grid, cx, cy);",
      "",
      "    if (neighbors.length > 0) {",
      "      const [nx, ny, dir] = pickRandom(neighbors);",
      "      removeWall(grid[cy][cx], dir);",
      "      grid[ny][nx].visited = true;",
      "      stack.push([nx, ny]);",
      "    } else {",
      "      stack.pop();",
      "    }",
      "  }",
      "  return grid;",
      "};"
    ]
  },
  // 2. Teknik: İkonik Pepsi & Sistem Monoloğu / Diyaloğu (Narrative Soliloquy)
  {
    mode: 'dialogue',
    getLines: (uName) => buildPepsiDialogue(uName)
  },
  // 2. Teknik: Canlı Hexadecimal Bellek Dökümü (Binary Memory Inspector)
  {
    mode: 'burst',
    lines: [
      "0x7FFF00:  4A 65 74 20  42 75 66 66  65 72 20 4F  4B 00 00 00  |Jet Buffer OK...|",
      "0x7FFF10:  E8 1A 02 00  00 48 8D 3D  A4 02 00 00  48 89 C7 E8  |.....H.=....H...|",
      "0x7FFF20:  01 00 00 00  48 83 C4 20  5D C3 90 90  90 90 90 90  |....H.. ].......|",
      "0x7FFF30:  55 48 89 E5  48 83 EC 10  C7 45 FC 00  00 00 00 8B  |UH..H....E......|"
    ]
  },
  // 3. Teknik: Ters Renkli Solid Banner + Fatal Crash & Stack Trace
  {
    mode: 'error',
    lines: [
      "█ FATAL EXCEPTION: CORRUPT_HEAP (0xDEADBEEF) █",
      "Uncaught TypeError: Cannot read properties of undefined (reading 'visited')",
      "  at carveMaze (PathDrops.jsx:420:19)",
      "  at runGenerationLoop (PathDrops.jsx:112:5)",
      "  at HTMLCanvasElement.<anonymous> (CRTTerminal.jsx:325:18)",
      "  at processTicksAndRejections (task_queues:95:5)",
      "⚠️ [WARN] Watchdog restarting corrupted worker thread...",
      "✓ [RECOVERY] Sandbox isolated. Core dumped to /tmp/core.941"
    ]
  },
  // 4. Teknik: İlerleme Göstergeleri ve ASCII Sparklines
  {
    mode: 'burst',
    lines: [
      "COMPILE [████████████████░░░░] 80% (32/40 modules)",
      "HEAP    [▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░] 52.4MB / 128MB  GC: 0.4ms",
      "BUFFERS [■■■■■■■■■■■■■■■■■■■□] 95% [STABLE] 60 FPS",
      "RECOIL  ∿∿∿∿∿  ▂▃▅▆▇ [DAMPENED]  THRUST: 4,400 N",
      "IOPS: 14,200/s │ Latency: 0.18ms │ DropRate: 0.00%"
    ]
  },
  // 5. Teknik: Git Diff Yaması (Yeşil Ekleme, Kırmızı Silme)
  {
    mode: 'diff',
    lines: [
      "diff --git a/kernel/allocator.ts b/kernel/allocator.ts",
      "@@ -18,6 +18,8 @@ class MemoryPool {",
      "-  const buffer = new Buffer(512); // deprecated",
      "+  const buffer = new SharedArrayBuffer(4096);",
      "+  Atomics.store(buffer, 0, 0x7F);",
      "+  buffer.growable = true;",
      "   this.pool = buffer;"
    ]
  },
  // 6. Teknik: Şifre Çözücü Karakter Scramble (Cyber Decryption)
  {
    mode: 'scramble',
    lines: [
      "// --- [DECRYPT] INCOMING SECURE PROTOCOL ---",
      "const handshake = await crypto.subtle.deriveKey(",
      "  { name: 'ECDH', public: peerPublicKey },",
      "  privateKey,",
      "  { name: 'AES-GCM', length: 256 },",
      "  false,",
      "  ['encrypt', 'decrypt']",
      ");",
      "✓ [SECURE] TLS_AES_256_GCM_SHA384 ESTABLISHED"
    ]
  },
  // 7. Teknik: x86_64 Makine Dili Analizörü (Disassembly)
  {
    mode: 'burst',
    lines: [
      "// --- [DISASM] /lib/v1_optics_core.so ---",
      "0x004010a0:  48 89 e5          mov    rbp, rsp",
      "0x004010a3:  48 83 ec 20       sub    rsp, 0x20",
      "0x004010a7:  e8 54 0f 00 00    call   init_bloom_pass",
      "0x004010ac:  85 c0             test   eax, eax",
      "0x004010ae:  75 1a             jne    0x004010ca <panic>",
      "0x004010b0:  b8 01 00 00 00    mov    eax, 0x1",
      "0x004010b5:  c9                leave",
      "0x004010b6:  c3                ret"
    ]
  },
  // 8. Teknik: Canlı Donanım & Sensör Telemetrisi
  {
    mode: 'burst',
    lines: [
      "┌──[ HARDWARE_TELEMETRY ]──────────────┐",
      "│ CORE TEMP: 48.2°C  [NOMINAL] ∿∿∿∿∿   │",
      "│ VCORE:     1.182V  [STABLE]          │",
      "│ CLOCK:     4.82GHz [BOOST]           │",
      "│ GPU LOAD:  [████████████░░░░] 74%    │",
      "│ VRAM:      6,144MB / 8,192MB         │",
      "│ JET_FAN:   4,200 RPM [SILENT]        │",
      "└──────────────────────────────────────┘"
    ]
  },
  // 9. Teknik: CultStream Asenkron Akış Fonksiyonu
  {
    mode: 'type',
    lines: [
      "// --- [STREAM] CULT_STREAM GLYPH PROCESSOR ---",
      "async function pipeStreamBuffer(streamReader) {",
      "  const buffer = new Uint8Array(2048);",
      "  let offset = 0;",
      "",
      "  try {",
      "    while (true) {",
      "      const { done, value } = await streamReader.read();",
      "      if (done) break;",
      "",
      "      for (let i = 0; i < value.length; i++) {",
      "        const charCode = value[i];",
      "        if (charCode >= 32 && charCode <= 126) {",
      "          renderMatrixColumn(String.fromCharCode(charCode), offset);",
      "        }",
      "        offset = (offset + 1) % 64;",
      "      }",
      "    }",
      "  } catch (err) {",
      "    console.warn('StreamPipeline::Interrupted', err);",
      "  }",
      "}"
    ]
  },
  // 10. Teknik: İkili Bitstream & Parity Hata Düzeltme
  {
    mode: 'burst',
    lines: [
      "BITSTREAM: 11010010 01001101 10101111 00100101 [CRC_OK]",
      "BITSTREAM: 00101011 11100010 01100101 11110001 [CRC_OK]",
      "BITSTREAM: 11110000 00001111 10100101 01011010 [PARITY_ERR ⚠️]",
      "⚡ [HAMMING] Auto-correcting single-bit syndrome...",
      "RECOVERED: 11110000 00001111 10100101 01011011 [FIXED ✓]"
    ]
  },
  // 11. Teknik: Kutulu ASCII Modül Ağacı ve Şema
  {
    mode: 'burst',
    lines: [
      "┌──[ V1_SUBSYSTEM_MAP ]────────────────┐",
      "├── src/kernel/memory.rs       [COMPILED]",
      "│   ├── heap_alloc (4096B)     [SHARED]  ",
      "│   └── garbage_collector.rs   [ACTIVE]  ",
      "├── src/maze/pathDrops.ts      [LINKED]  ",
      "│   └── unseal_cell(42, 18)    [VISITED] ",
      "└── src/stream/cultStream.wasm [OPTIMIZED]",
      "└──────────────────────────────────────┘"
    ]
  },
  // 12. Teknik: Ağ / WebSocket Protokol El Sıkışması
  {
    mode: 'burst',
    lines: [
      ">>> [NET] SYN_SENT [seq: 0x90A1F4, ack: 0]",
      "<<< [NET] SYN_ACK  [seq: 0x11B3E2, ack: 0x90A1F5, win: 65535]",
      ">>> [NET] ACK      [seq: 0x90A1F5, ack: 0x11B3E3] ESTABLISHED",
      "HTTP/2 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      "Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo="
    ]
  },
  // 13. Teknik: Hızlı Build / Vite Çıktı Patlaması
  {
    mode: 'burst',
    lines: [
      "$ vite build --mode production",
      "vite v6.4.5 building for production...",
      "transforming (38) modules...",
      "✓ 38 modules transformed in 184ms",
      "dist/assets/index-CrYYBDTP.js   775.5 kB │ gzip: 211.4 kB",
      "✓ built successfully in 2.14s"
    ]
  },
  // 14. Teknik: SyntaxError ve Otomatik İyileşme
  {
    mode: 'error',
    lines: [
      "█ SYNTAX ERROR: UNEXPECTED TOKEN █",
      "SyntaxError: Unexpected token '?' in JSON at position 148",
      "  at JSON.parse (<anonymous>)",
      "  at parseTelemetryStream (CultStream.jsx:88:22)",
      "  at WebSocket.onmessage (CRTTerminal.jsx:194:12)",
      "⚠️ [WARN] Dropping malformed telemetry packet [CRC: 0x9AF0]",
      "✓ Stream pipeline recovered. Resuming normal loop..."
    ]
  },
  // 15. Teknik: Optik Hedef Kitleme Telemetrisi (Scramble)
  {
    mode: 'scramble',
    lines: [
      "// --- [OPTICS] HUD TARGET ACQUISITION ---",
      "const target = scanAperture({ fov: 94.2, range: 450 });",
      "if (target.locked) {",
      "  engageThrusterVector(target.vector, 0.85);",
      "  calibrateReticle(target.distance);",
      "  // [LOCK] TARGET_ACQUIRED: (X:418, Y:912, Z:30)",
      "}"
    ]
  },
  // 16. Teknik: Audio FFT Spektrum & DSP Filtresi
  {
    mode: 'burst',
    lines: [
      "FFT_SPECTRUM: 60Hz ▅ 120Hz ▇ 250Hz █ 500Hz ▆ 1kHz ▄ 2kHz ▃ 4kHz ▂",
      "DSP_FILTER:   BiquadFilter [LowPass @ 1,400Hz, Q: 2.4] -> ENGAGED",
      "SAMPLE_RATE:  48,000 Hz │ LATENCY: 2.1ms │ CHANNELS: 2"
    ]
  },
  // 17. Teknik: CRT Shader Derleyici Fonksiyonu
  {
    mode: 'type',
    lines: [
      "// --- [SHADER] CRT POST-PROCESSING COMPOSITE ---",
      "const initCRTProgram = (gl, vertCode, fragCode) => {",
      "  const program = gl.createProgram();",
      "  const vs = compileShader(gl, gl.VERTEX_SHADER, vertCode);",
      "  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragCode);",
      "",
      "  gl.attachShader(program, vs);",
      "  gl.attachShader(program, fs);",
      "  gl.linkProgram(program);",
      "",
      "  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {",
      "    const info = gl.getProgramInfoLog(program);",
      "    throw new Error(`ShaderLinkFailure: ${info}`);",
      "  }",
      "  return program;",
      "};"
    ]
  },
  // 18. Teknik: Veritabanı & IndexedDB İşlemleri
  {
    mode: 'type',
    lines: [
      "// --- [DATABASE] PERSISTENT TRANSACTION ---",
      "const tx = db.transaction(['maze_nodes'], 'readwrite');",
      "const store = tx.objectStore('maze_nodes');",
      "const query = store.index('visited').getAll(IDBKeyRange.only(false));",
      "",
      "query.onsuccess = () => {",
      "  const pending = query.result;",
      "  console.log(`Unvisited frontiers: ${pending.length}`);",
      "  store.put({ id: 0x4B2, cell: [24, 18], cleared: true });",
      "};"
    ]
  },
  // 19. Teknik: Out-of-Memory Kernel Panic & Çöp Toplayıcı Süpürmesi
  {
    mode: 'error',
    lines: [
      "█ KERNEL PANIC: OUT_OF_MEMORY (ERR_OOM_382) █",
      "FATAL: JavaScript heap out of memory",
      "  at Array.map (<anonymous>)",
      "  at buildSubdivisionTree (PathDrops.jsx:512:14)",
      "  at HTMLCanvasElement.renderLoop (CRTTerminal.jsx:920:9)",
      "⚡ [SWEEP] Forcing generational garbage collection...",
      "⚡ [RECLAIM] 142.8 MB freed across 3 heap segments.",
      "✓ Memory pressure resolved: [████░░░░░░░░░░░░] 22% used"
    ]
  },
  // 20. Teknik: Test Paketi Çıktısı
  {
    mode: 'burst',
    lines: [
      "$ bun test --coverage --silent",
      "PASS test/maze_backtracker.test.js (6 tests, 6 passed)",
      "PASS test/cult_stream.test.js (12 tests, 12 passed)",
      "PASS test/crt_curvature.test.js (4 tests, 4 passed)",
      "✓ 22 tests passed in 48ms",
      "[SYS] Kernel state synchronized :: V1_READY"
    ]
  }
];

const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'while', 'for',
  'async', 'await', 'class', 'constructor', 'new', 'try', 'catch', 'throw',
  'break', 'super', 'true', 'false', 'null', 'undefined', 'extends'
]);

const SCRAMBLE_CHARS = '!@#$%^&*<>[]{}0123456789ABCDEFλΩΞ';

function renderCodeLine(ctx, text, x, y, isTyping, now, termW) {
  const trimmed = text.trim();

  // 0. NOSTALJİK ANLATI / NARRATIVE SATIRLARI (:: ...)
  if (trimmed.startsWith('::')) {
    ctx.font = 'italic 10.5px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.75)';
    ctx.fillText(':: ', x, y);
    const nx = x + ctx.measureText(':: ').width;

    if (trimmed.includes('Pepsi')) {
      // "all ozgur wanted was a Pepsi... just one Pepsi" satırlarında nostaljik kehribar parlaması
      ctx.fillStyle = '#ffbb55';
      ctx.shadowColor = 'rgba(255, 187, 85, 0.6)';
      ctx.shadowBlur = 6;
    } else {
      ctx.fillStyle = 'rgba(225, 240, 255, 0.92)';
      ctx.shadowBlur = 0;
    }
    ctx.fillText(text.replace(/^::\s*/, ''), nx, y);
    ctx.shadowBlur = 0;
    if (isTyping) {
      const curX = nx + ctx.measureText(text.replace(/^::\s*/, '')).width;
      ctx.fillStyle = trimmed.includes('Pepsi') ? '#ffbb55' : '#00f0ff';
      ctx.fillRect(curX + 2, y - 9, 6, 12);
    }
    return;
  }

  // 0.5 KULLANICI DİYALOG / KOMUT İSTEMİ (> ...)
  if (trimmed.startsWith('>') && !trimmed.startsWith('>>>')) {
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.fillStyle = '#39ff14';
    ctx.fillText('> ', x, y);
    const ux = x + ctx.measureText('> ').width;
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillText(text.replace(/^>\s*/, ''), ux, y);
    if (isTyping) {
      const curX = ux + ctx.measureText(text.replace(/^>\s*/, '')).width;
      ctx.fillStyle = '#39ff14';
      ctx.fillRect(curX + 2, y - 9, 6, 12);
    }
    return;
  }

  // 1. TERS RENKLİ VURGU BANNERLARI (█ ...)
  if (trimmed.startsWith('█')) {
    const bannerText = trimmed.replace(/█/g, '').trim();
    ctx.font = 'bold 10.5px "Share Tech Mono", monospace';
    const tw = ctx.measureText(bannerText).width;

    let bg = '#ff2233';
    let fg = '#ffffff';
    if (trimmed.includes('SYNTAX') || trimmed.includes('WARN')) {
      bg = '#ffaa00'; fg = '#000000';
    } else if (trimmed.includes('SECURE') || trimmed.includes('TARGET') || trimmed.includes('V1')) {
      bg = '#00f0ff'; fg = '#000000';
    } else if (trimmed.includes('PANIC') || trimmed.includes('FATAL') || trimmed.includes('OOM')) {
      bg = '#ff1122'; fg = '#ffffff';
    }

    ctx.fillStyle = bg;
    ctx.fillRect(x - 2, y - 10, Math.min(tw + 12, (termW || 280)), 13);
    ctx.fillStyle = fg;
    ctx.fillText(bannerText, x + 3, y);
    return;
  }

  // 2. HATA SATIRLARI (Uncaught, TypeError, SyntaxError, RangeError, FATAL, [PANIC])
  if (
    trimmed.startsWith('Uncaught') ||
    trimmed.startsWith('TypeError') ||
    trimmed.startsWith('SyntaxError') ||
    trimmed.startsWith('RangeError') ||
    trimmed.startsWith('Error:') ||
    trimmed.startsWith('FATAL:') ||
    trimmed.startsWith('[FATAL]') ||
    trimmed.startsWith('[PANIC]')
  ) {
    // CRT Glitch titremesi (Kritik hata anında 1-2px yatay jitter)
    const jitter = Math.sin(now * 0.08) > 0.65 ? 2.5 : 0;
    ctx.fillStyle = '#ff2233';
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.shadowColor = 'rgba(255, 34, 51, 0.7)';
    ctx.shadowBlur = 6;
    ctx.fillText(text, x + jitter, y);
    ctx.shadowBlur = 0;
    return;
  }

  // 3. STACK TRACE SATIRLARI ("  at ...")
  if (trimmed.startsWith('at ') || text.startsWith('  at ')) {
    ctx.fillStyle = 'rgba(255, 130, 130, 0.82)';
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillText(text, x, y);
    return;
  }

  // 4. GIT DIFF SATIRLARI (diff, @@, +, -)
  if (trimmed.startsWith('diff ') || trimmed.startsWith('index ')) {
    ctx.fillStyle = 'rgba(200, 235, 255, 0.75)';
    ctx.font = 'bold 10px "Share Tech Mono", monospace';
    ctx.fillText(text, x, y);
    return;
  }
  if (trimmed.startsWith('@@')) {
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 10.5px "Share Tech Mono", monospace';
    ctx.fillText(text, x, y);
    return;
  }
  if (trimmed.startsWith('+') && !trimmed.startsWith('++')) {
    ctx.fillStyle = 'rgba(57, 255, 20, 0.12)';
    ctx.fillRect(x - 2, y - 10, termW || 280, 13);
    ctx.fillStyle = '#39ff14';
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillText(text, x, y);
    return;
  }
  if (trimmed.startsWith('-') && !trimmed.startsWith('--')) {
    ctx.fillStyle = 'rgba(255, 40, 50, 0.12)';
    ctx.fillRect(x - 2, y - 10, termW || 280, 13);
    ctx.fillStyle = '#ff4455';
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillText(text, x, y);
    return;
  }

  // 5. HEX MEMORY DUMP SATIRLARI (0x7FFF...)
  if (trimmed.startsWith('0x7FFF')) {
    const pipeIdx = text.indexOf('|');
    const addrEnd = text.indexOf(':');
    ctx.font = '10px "Share Tech Mono", monospace';
    if (addrEnd !== -1 && pipeIdx !== -1) {
      const addr = text.slice(0, addrEnd + 1);
      const hexBytes = text.slice(addrEnd + 1, pipeIdx);
      const ascii = text.slice(pipeIdx);

      ctx.fillStyle = '#00f0ff';
      ctx.fillText(addr, x, y);
      const ax = x + ctx.measureText(addr + ' ').width;

      ctx.fillStyle = '#ffbb33';
      ctx.fillText(hexBytes, ax, y);
      const hx = ax + ctx.measureText(hexBytes).width;

      ctx.fillStyle = '#39ff14';
      ctx.fillText(ascii, hx, y);
      return;
    }
  }

  // 6. x86_64 DISASSEMBLY SATIRLARI (0x0040...:  48 89 e5  mov rbp, rsp)
  if (/^0x0040[0-9a-fA-F]{4}:/.test(trimmed)) {
    const addrEnd = text.indexOf(':');
    const rest = text.slice(addrEnd + 1).trim();
    const match = rest.match(/^((?:[0-9a-fA-F]{2}\s*){1,5})\s{2,}(.*)$/);
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(text.slice(0, addrEnd + 1), x, y);
    const ax = x + ctx.measureText(text.slice(0, addrEnd + 1) + '  ').width;

    if (match) {
      ctx.fillStyle = '#ffaa00';
      ctx.fillText(match[1].padEnd(14), ax, y);
      const mx = ax + ctx.measureText(match[1].padEnd(14) + ' ').width;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px "Share Tech Mono", monospace';
      ctx.fillText(match[2], mx, y);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillText(rest, ax, y);
    }
    return;
  }

  // 7. BITSTREAM VE PARITY DÜZELTME SATIRLARI (BITSTREAM: 1101...)
  if (trimmed.startsWith('BITSTREAM:')) {
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('BITSTREAM: ', x, y);
    const bx = x + ctx.measureText('BITSTREAM: ').width;

    const remainder = text.replace(/^BITSTREAM:\s*/, '');
    const parts = remainder.split(/(\[[^\]]+\])/);
    ctx.fillStyle = '#39ff14';
    ctx.fillText(parts[0] || '', bx, y);

    if (parts[1]) {
      const rx = bx + ctx.measureText(parts[0] || '').width;
      ctx.fillStyle = parts[1].includes('ERR') ? '#ff3344' : '#00f0ff';
      ctx.font = 'bold 10px "Share Tech Mono", monospace';
      ctx.fillText(parts[1], rx, y);
    }
    return;
  }

  // 8. AUDIO DSP VE FFT SPEKTRUMU (FFT_SPECTRUM:, DSP_FILTER:)
  if (trimmed.startsWith('FFT_SPECTRUM:') || trimmed.startsWith('DSP_FILTER:') || trimmed.startsWith('SAMPLE_RATE:')) {
    ctx.font = '10px "Share Tech Mono", monospace';
    if (trimmed.startsWith('FFT_SPECTRUM:')) {
      ctx.fillStyle = '#00f0ff';
      ctx.fillText('FFT: ', x, y);
      const fx = x + ctx.measureText('FFT: ').width;
      ctx.fillStyle = '#39ff14';
      ctx.fillText(text.replace('FFT_SPECTRUM: ', ''), fx, y);
    } else if (trimmed.startsWith('DSP_FILTER:')) {
      ctx.fillStyle = '#ffaa00';
      ctx.fillText(text, x, y);
    } else {
      ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
      ctx.fillText(text, x, y);
    }
    return;
  }

  // 9. AĞ VE PROTOKOL İLETİŞİMİ (>>>, <<<, HTTP/, Upgrade:)
  if (
    trimmed.startsWith('>>>') ||
    trimmed.startsWith('<<<') ||
    trimmed.startsWith('HTTP/') ||
    trimmed.startsWith('Upgrade:') ||
    trimmed.startsWith('Connection:') ||
    trimmed.startsWith('Sec-WebSocket')
  ) {
    ctx.font = '10px "Share Tech Mono", monospace';
    if (trimmed.startsWith('>>>')) {
      ctx.fillStyle = '#00f0ff';
    } else if (trimmed.startsWith('<<<')) {
      ctx.fillStyle = '#39ff14';
    } else if (trimmed.startsWith('HTTP/')) {
      ctx.fillStyle = '#ffbb33';
      ctx.font = 'bold 10px "Share Tech Mono", monospace';
    } else {
      ctx.fillStyle = 'rgba(180, 225, 255, 0.75)';
    }
    ctx.fillText(text, x, y);
    return;
  }

  // 10. ÇÖP TOPLAYICI & SİBER YILDIRIM SATIRLARI (⚡ ...)
  if (trimmed.startsWith('⚡')) {
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 10.5px "Share Tech Mono", monospace';
    ctx.fillText(text, x, y);
    return;
  }

  // 11. GÖSTERGE VE ASCII İLERLEME ÇUBUKLARI ([███, [▓▓▓, [■■■, ∿∿∿)
  if (trimmed.includes('[██') || trimmed.includes('[▓▓') || trimmed.includes('[■■') || trimmed.includes('∿∿∿')) {
    const parts = text.split(/(\[[█▓■░□]+\])/g);
    let gx = x;
    ctx.font = '11px "Share Tech Mono", monospace';
    parts.forEach((p) => {
      if (p.startsWith('[')) {
        ctx.fillStyle = '#39ff14';
        ctx.font = 'bold 11px "Share Tech Mono", monospace';
      } else if (p.includes('%') || p.includes('MB') || p.includes('FPS') || p.includes('4,400') || p.includes('RPM')) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px "Share Tech Mono", monospace';
      } else {
        ctx.fillStyle = '#00f0ff';
        ctx.font = 'bold 11px "Share Tech Mono", monospace';
      }
      ctx.fillText(p, gx, y);
      gx += ctx.measureText(p).width;
    });
    return;
  }

  // 12. KUTULU ASCII AĞAÇ VE ŞEMA BLOKLARI (┌, ├, │, └)
  if (trimmed.startsWith('┌') || trimmed.startsWith('├') || trimmed.startsWith('│') || trimmed.startsWith('└')) {
    ctx.font = '11px "Share Tech Mono", monospace';
    const parts = text.split(/(\[[^\]]+\])/g);
    let bx = x;
    parts.forEach((p) => {
      if (p.startsWith('[') && (p.includes('█') || p.includes('▓') || p.includes('■') || p.includes('░'))) {
        ctx.fillStyle = '#39ff14';
        ctx.font = 'bold 11px "Share Tech Mono", monospace';
      } else if (p.startsWith('[')) {
        ctx.fillStyle = (p.includes('ERR') || p.includes('CRIT'))
          ? '#ff3344'
          : (p.includes('LINK') || p.includes('COMP') || p.includes('OPT') || p.includes('NOM') || p.includes('STABLE') || p.includes('SILENT') || p.includes('BOOST')
            ? '#39ff14'
            : '#ffaa00');
        ctx.font = 'bold 10px "Share Tech Mono", monospace';
      } else {
        ctx.fillStyle = 'rgba(0, 240, 255, 0.78)';
        ctx.font = '11px "Share Tech Mono", monospace';
      }
      ctx.fillText(p, bx, y);
      bx += ctx.measureText(p).width;
    });
    return;
  }

  // 13. UYARI SATIRLARI (⚠️, [WARN], Warning:)
  if (trimmed.startsWith('⚠️') || trimmed.startsWith('[WARN]') || trimmed.startsWith('Warning:')) {
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.fillText(text, x, y);
    return;
  }

  // 14. BAŞARI / TEST SATIRLARI (✓, PASS, RECOVERED:)
  if (trimmed.startsWith('✓') || trimmed.startsWith('PASS') || trimmed.startsWith('RECOVERED:')) {
    ctx.fillStyle = '#39ff14';
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.fillText(text, x, y);
    return;
  }

  // 15. SHELL KOMUTLARI ($ ...)
  if (trimmed.startsWith('$')) {
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.fillText('$ ', x, y);
    const cmdX = x + ctx.measureText('$ ').width;
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillText(text.replace(/^\$\s*/, ''), cmdX, y);
    return;
  }

  // 16. YORUM SATIRLARI (// ...)
  if (trimmed.startsWith('//')) {
    ctx.fillStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillText(text, x, y);
    if (isTyping) {
      const curX = x + ctx.measureText(text).width;
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(curX + 2, y - 9, 6, 12);
    }
    return;
  }

  // 17. TELEMETRİ / JSON / HEAP SATIRLARI
  if (
    trimmed.startsWith('{') ||
    trimmed.startsWith('[HEAP') ||
    trimmed.startsWith('[V8') ||
    trimmed.startsWith('[NET') ||
    trimmed.startsWith('[STREAM') ||
    trimmed.startsWith('[SYS]')
  ) {
    ctx.fillStyle = 'rgba(160, 230, 255, 0.85)';
    ctx.font = '10.5px "Share Tech Mono", monospace';
    ctx.fillText(text, x, y);
    return;
  }

  // 18. STANDART JAVASCRIPT KODLARI (Sözdizimi renklendirmesi + tab girintisi)
  const tokens = text.split(/([a-zA-Z0-9_$]+|'[^']*'|"[^"]*"|`[^`]*`|\s+|[^\s\w])/g);
  let curX = x;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;

    if (JS_KEYWORDS.has(token)) {
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 11px "Share Tech Mono", monospace';
    } else if (token.startsWith("'") || token.startsWith('"') || token.startsWith('`')) {
      ctx.fillStyle = '#ffbb33';
      ctx.font = '11px "Share Tech Mono", monospace';
    } else if (/^\d+$/.test(token)) {
      ctx.fillStyle = '#39ff14';
      ctx.font = '11px "Share Tech Mono", monospace';
    } else if (/[{}()[\]]/.test(token)) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Share Tech Mono", monospace';
    } else if (/[=><!+\-*/&|:;.,]/.test(token)) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.75)';
      ctx.font = '11px "Share Tech Mono", monospace';
    } else {
      ctx.fillStyle = 'rgba(215, 240, 255, 0.78)';
      ctx.font = '11px "Share Tech Mono", monospace';
    }

    ctx.fillText(token, curX, y);
    curX += ctx.measureText(token).width;
  }

  if (isTyping) {
    if (Math.floor(now * 0.005) % 2 === 0) {
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(curX + 2, y - 9, 6, 12);
    }
  }
}

export default function CRTTerminal() {
  const mountRef = useRef(null);
  const [now, setNow] = useState(Date.now());
  const [profil, setProfil] = useState({
    avatarUrl: "https://cdn.discordapp.com/embed/avatars/0.png",
    status: "offline",
    musicText: null,
    spotify: null,
    username: "ozgur"
  });

  const profilRef = useRef(profil);
  profilRef.current = profil;

  // Lanyard Bağlantısı
  useEffect(() => {
    const manager = new LanyardManager("1092374832856961106", (canliVeri) => {
      if (canliVeri) setProfil(canliVeri);
    });
    manager.connect();
    return () => manager.disconnect();
  }, []);

  // Spotify Canlı Süre Sayacı
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // WebGL ve Kompozit Sahne Motoru
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    // 1. Sahne Tuvali
    const sceneCanvas = document.createElement('canvas');
    sceneCanvas.width = width * DPR;
    sceneCanvas.height = height * DPR;
    const sceneCtx = sceneCanvas.getContext('2d');
    sceneCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // 2. Alt Modül Tuvali: Labirent (PathDrops)
    const mazeCanvas = document.createElement('canvas');
    mazeCanvas.width = width * DPR;
    mazeCanvas.height = Math.max(10, height - HEADER_HEIGHT) * DPR;
    mazeCanvas.style.width = width + 'px';
    mazeCanvas.style.height = Math.max(10, height - HEADER_HEIGHT) + 'px';
    const destroyMaze = initPathDrops(mazeCanvas);

    // 3. Alt Modül Tuvali: Header Matrix Akışı (CultStream)
    const matrixCanvas = document.createElement('canvas');
    matrixCanvas.width = Math.max(10, width - HEADER_LEFT_WIDTH) * DPR;
    matrixCanvas.height = HEADER_HEIGHT * DPR;
    matrixCanvas.style.width = Math.max(10, width - HEADER_LEFT_WIDTH) + 'px';
    matrixCanvas.style.height = HEADER_HEIGHT + 'px';
    const destroyMatrix = initCultStream(matrixCanvas, 'back');

    // Discord Avatar Resmi
    const avatarImg = new Image();
    avatarImg.crossOrigin = 'anonymous';
    avatarImg.src = profilRef.current.avatarUrl;

    // Vitruvian V1 Optik Efektli Çizim (Chromatic Aberration + Multi-Bloom + Aperture Grille)
    const vitruvianLedImg = new Image();
    vitruvianLedImg.src = '/vitruvian-v1-led-cyan.png';

    // 4. Three.js Sahnesi ve WebGL Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setPixelRatio(DPR);
    renderer.setSize(width, height);
    renderer.domElement.className = 'crt-webgl-canvas';
    container.appendChild(renderer.domElement);

    const canvasTexture = new THREE.CanvasTexture(sceneCanvas);
    canvasTexture.minFilter = THREE.LinearFilter;
    canvasTexture.magFilter = THREE.LinearFilter;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uScene: { value: canvasTexture },
        uResolution: { value: new THREE.Vector2(width * DPR, height * DPR) },
        uCurvature: { value: crtConfig.curvature },
        uPhosphorGrid: { value: crtConfig.phosphorGrid },
        uVignette: { value: crtConfig.vignette },
      },
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    // Pencere Boyutlandırma
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      renderer.setSize(width, height);
      material.uniforms.uResolution.value.set(width * DPR, height * DPR);

      sceneCanvas.width = width * DPR;
      sceneCanvas.height = height * DPR;
      sceneCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

      mazeCanvas.width = width * DPR;
      mazeCanvas.height = Math.max(10, height - HEADER_HEIGHT) * DPR;
      mazeCanvas.style.width = width + 'px';
      mazeCanvas.style.height = Math.max(10, height - HEADER_HEIGHT) + 'px';

      matrixCanvas.width = Math.max(10, width - HEADER_LEFT_WIDTH) * DPR;
      matrixCanvas.height = HEADER_HEIGHT * DPR;
      matrixCanvas.style.width = Math.max(10, width - HEADER_LEFT_WIDTH) + 'px';
      matrixCanvas.style.height = HEADER_HEIGHT + 'px';
    };

    window.addEventListener('resize', handleResize);

    // 5. Ana Çizim & Bükme Döngüsü (60 FPS)
    let rafId;

    // Dinamik Kod & Hata Motor Durumu
    const typeState = {
      eventIdx: 0,
      lineIdx: 0,
      charIdx: 0,
      completedLines: [],
      pauseUntil: 0
    };

    function renderLoop() {
      const now = performance.now();
      const p = profilRef.current;
      if (avatarImg.src !== p.avatarUrl) {
        avatarImg.src = p.avatarUrl;
      }

      // Dinamik Kod, Hata ve Burst Akış Güncellemesi
      const currentEvt = SCRIPT_EVENTS[typeState.eventIdx];
      const uName = profilRef.current?.username || "ozgur";
      const dialogueItems = currentEvt.mode === 'dialogue' ? currentEvt.getLines(uName) : null;
      const currentLines = dialogueItems ? dialogueItems.map(d => d.text) : currentEvt.lines;

      if (now >= typeState.pauseUntil) {
        if (currentEvt.mode === 'burst') {
          // BUNCH OF CODES: Bir anda 3-5 satır birden ekrana atılır!
          const burstSize = Math.min(currentLines.length - typeState.lineIdx, 3 + Math.floor(Math.random() * 2));
          for (let b = 0; b < burstSize; b++) {
            typeState.completedLines.push(currentLines[typeState.lineIdx]);
            typeState.lineIdx++;
          }
          if (typeState.lineIdx >= currentLines.length) {
            typeState.pauseUntil = now + 900;
            typeState.lineIdx = 0;
            typeState.charIdx = 0;
            typeState.eventIdx = (typeState.eventIdx + 1) % SCRIPT_EVENTS.length;
          } else {
            typeState.pauseUntil = now + 40; // Çok hızlı peş peşe burst
          }
        } else if (currentEvt.mode === 'error') {
          // HATA MODU: Kırmızı hata satırları dökülür, stack trace basılır
          const errLine = currentLines[typeState.lineIdx] || '';
          typeState.completedLines.push(errLine);
          typeState.lineIdx++;
          if (typeState.lineIdx >= currentLines.length) {
            typeState.pauseUntil = now + 1600; // Hatanın ekranda okunabilmesi için 1.6s durakla
            typeState.lineIdx = 0;
            typeState.charIdx = 0;
            typeState.eventIdx = (typeState.eventIdx + 1) % SCRIPT_EVENTS.length;
          } else {
            typeState.pauseUntil = now + 90; // Hata satırları hızlıca düşer
          }
        } else if (currentEvt.mode === 'scramble') {
          // SİBER ŞİFRE ÇÖZÜCÜ (SCRAMBLE DECRYPT) MODU:
          // Her satır önce şifreli matris glifleri olarak belirir ve hızla karakter karakter çözülür
          const currentLine = currentLines[typeState.lineIdx] || '';
          if (typeState.charIdx === 0) {
            const firstNonSpace = currentLine.search(/\S|$/);
            typeState.charIdx = firstNonSpace;
          }
          typeState.charIdx = Math.min(currentLine.length, typeState.charIdx + 3);

          if (typeState.charIdx >= currentLine.length) {
            typeState.completedLines.push(currentLine);
            typeState.lineIdx++;
            typeState.charIdx = 0;
            if (typeState.lineIdx >= currentLines.length) {
              typeState.pauseUntil = now + 1200;
              typeState.lineIdx = 0;
              typeState.eventIdx = (typeState.eventIdx + 1) % SCRIPT_EVENTS.length;
            } else {
              typeState.pauseUntil = now + 40;
            }
          }
        } else if (currentEvt.mode === 'dialogue') {
          // İKONİK DİYALOG & MONOLOG MODU: Karakter bazlı doğal daktilo ve ritmik duraklamalar
          const item = dialogueItems[typeState.lineIdx] || { text: '', delay: 120 };
          const currentLine = item.text;

          typeState.charIdx = Math.min(currentLine.length, typeState.charIdx + 3);

          if (typeState.charIdx >= currentLine.length) {
            typeState.completedLines.push(currentLine);
            typeState.lineIdx++;
            typeState.charIdx = 0;

            if (typeState.lineIdx >= dialogueItems.length) {
              typeState.pauseUntil = now + 2800; // Monolog bitiminde 2.8s derin sessizlik
              typeState.lineIdx = 0;
              typeState.eventIdx = (typeState.eventIdx + 1) % SCRIPT_EVENTS.length;
            } else {
              // Dosyadaki delay değerine göre duygusal ve ritmik duraklama
              typeState.pauseUntil = now + Math.max(70, Math.min(700, item.delay * 2));
            }
          }
        } else {
          // STANDART TYPEWRITER MODU: Hızlı daktilo (tab girintisi anında atlanır)
          const currentLine = currentLines[typeState.lineIdx] || '';

          if (typeState.charIdx === 0) {
            const firstNonSpace = currentLine.search(/\S|$/);
            typeState.charIdx = firstNonSpace;
          }

          // Satır içi hızlı yazma hızı (her karede 3 karakter)
          typeState.charIdx = Math.min(currentLine.length, typeState.charIdx + 3);

          if (typeState.charIdx >= currentLine.length) {
            typeState.completedLines.push(currentLine);
            typeState.lineIdx++;
            typeState.charIdx = 0;

            if (typeState.lineIdx >= currentLines.length) {
              typeState.pauseUntil = now + 1300;
              typeState.lineIdx = 0;
              typeState.eventIdx = (typeState.eventIdx + 1) % SCRIPT_EVENTS.length;
            } else {
              typeState.pauseUntil = now + 45;
            }
          }
        }

        // Buffer sınırını koru
        if (typeState.completedLines.length > 70) {
          typeState.completedLines = typeState.completedLines.slice(-35);
        }
      }

      // --- 2D KOMPOZİT ÇİZİMİ ---
      sceneCtx.fillStyle = '#000000';
      sceneCtx.fillRect(0, 0, width, height);

      // A. HEADER SAĞ: CultStream Matrix
      sceneCtx.drawImage(matrixCanvas, HEADER_LEFT_WIDTH, 0, Math.max(10, width - HEADER_LEFT_WIDTH), HEADER_HEIGHT);

      // B. HEADER SOL PANEL (LANYARD & LOGO)
      sceneCtx.fillStyle = 'rgba(0, 0, 0, 0.95)';
      sceneCtx.fillRect(0, 0, HEADER_LEFT_WIDTH, HEADER_HEIGHT);

      // Lanyard kısmı ferahlatıldı ve büyütüldü
      const avatarCenterX = 66;
      const avatarCenterY = 56;
      const avatarRadius = 30;

      // Discord Avatar
      sceneCtx.save();
      sceneCtx.beginPath();
      sceneCtx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
      sceneCtx.clip();
      try {
        if (avatarImg.complete && avatarImg.naturalWidth > 0) {
          sceneCtx.drawImage(avatarImg, avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        } else {
          sceneCtx.fillStyle = '#0a0a0a';
          sceneCtx.fillRect(avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        }
      } catch (e) {}
      sceneCtx.restore();

      // Avatar Border
      sceneCtx.beginPath();
      sceneCtx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
      sceneCtx.strokeStyle = '#8f1f1f';
      sceneCtx.lineWidth = 1.5;
      sceneCtx.stroke();

      // Durum Yuvarlağı
      let statusColor = '#747f8d';
      if (p.status === 'online') statusColor = '#43b581';
      else if (p.status === 'idle') statusColor = '#faa61a';
      else if (p.status === 'dnd') statusColor = '#f04747';

      sceneCtx.beginPath();
      sceneCtx.arc(avatarCenterX + 22, avatarCenterY + 20, 8, 0, Math.PI * 2);
      sceneCtx.fillStyle = statusColor;
      sceneCtx.fill();
      sceneCtx.strokeStyle = '#000000';
      sceneCtx.lineWidth = 2;
      sceneCtx.stroke();

      // Logo: SWITCH (Daha büyük ve net)
      sceneCtx.fillStyle = '#ff3b3b';
      sceneCtx.font = 'bold 38px "Share Tech Mono", monospace';
      sceneCtx.fillText('SWITCH', avatarCenterX + 44, avatarCenterY + 12);

      // Müzik / Spotify Bilgisi
      if (p.spotify) {
        const { artist, song, start, end } = p.spotify;
        let progressStr = "0:00";
        let durationStr = "0:00";
        if (start && end) {
          const durationMs = end - start;
          const currentMs = Math.max(0, Math.min(Date.now() - start, durationMs));
          const curSec = Math.floor(currentMs / 1000);
          const durSec = Math.floor(durationMs / 1000);
          progressStr = `${Math.floor(curSec / 60)}:${(curSec % 60).toString().padStart(2, '0')}`;
          durationStr = `${Math.floor(durSec / 60)}:${(durSec % 60).toString().padStart(2, '0')}`;
        }

        sceneCtx.fillStyle = '#ff9999';
        sceneCtx.font = 'bold 13px "Share Tech Mono", monospace';
        const musicLine = `${artist} - ${song}`;
        sceneCtx.fillText(musicLine.length > 30 ? musicLine.slice(0, 28) + '..' : musicLine, 36, 120);

        sceneCtx.fillStyle = '#aa3333';
        sceneCtx.font = '12px "Share Tech Mono", monospace';
        sceneCtx.fillText(`[${progressStr} / ${durationStr}]`, 245, 120);
      } else if (p.musicText) {
        sceneCtx.fillStyle = '#aa4444';
        sceneCtx.font = '12px "Share Tech Mono", monospace';
        sceneCtx.fillText(p.musicText, 36, 120);
      }

      // Header Dikey Ayırıcı Çizgi
      sceneCtx.strokeStyle = '#441010';
      sceneCtx.lineWidth = 1;
      sceneCtx.beginPath();
      sceneCtx.moveTo(HEADER_LEFT_WIDTH, 0);
      sceneCtx.lineTo(HEADER_LEFT_WIDTH, HEADER_HEIGHT);
      sceneCtx.stroke();

      // Header Alt Yatay Çizgi
      sceneCtx.strokeStyle = '#661414';
      sceneCtx.lineWidth = 2;
      sceneCtx.beginPath();
      sceneCtx.moveTo(0, HEADER_HEIGHT);
      sceneCtx.lineTo(width, HEADER_HEIGHT);
      sceneCtx.stroke();

      // C. BODY ALANI: PathDrops Labirenti (Tüm ekrana yayılır)
      sceneCtx.drawImage(mazeCanvas, 0, HEADER_HEIGHT, width, Math.max(10, height - HEADER_HEIGHT));


      // D. SAĞ TARAF: ANATOMİ ÇİZİMİNİN KENDİ BOYUTUNDAKİ KARE PANEL ("KAREMİZ")
      // Kullanıcı isteği: "karakteri direkt olduğu gibi bırak, karetmizi anatomi çiziminin boyutuna küçült ama antomi çizimini elleme aynı boyutta kalsın. üstteki yazıları sil, etrafındaki çizgi ve yazılarıda sil. başka bişey yapıcaz buna"
      const bodyH = Math.max(10, height - HEADER_HEIGHT);
      const padX = 18;
      const padY = 12;

      // Karemizin boyutu anatomi çiziminin boyutuyla birebir eşleşir (tam kare)
      const boxH = bodyH - padY * 2;
      const boxW = boxH;
      const boxX = width - padX - boxW;
      const boxY = HEADER_HEIGHT + padY;

      if (boxW > 100 && boxH > 100) {
        sceneCtx.save();
        sceneCtx.beginPath();
        sceneCtx.rect(boxX, boxY, boxW, boxH);
        sceneCtx.clip();

        // 1. BUZLU CAM / BLUR EFEKTİ (Arka plandaki mazeCanvas kutu içinde buzlu cam gibi bulanıklaşır)
        // Kullanıcı isteği: "arka plandaki siyah katmanı kaldır en arkaplan gözüksün. yada cam gibi böyle blurlşu bişey yap o daha iyi."
        sceneCtx.save();
        sceneCtx.filter = 'blur(6px) brightness(0.65)';
        sceneCtx.drawImage(
          mazeCanvas,
          boxX, boxY - HEADER_HEIGHT, boxW, boxH,
          boxX, boxY, boxW, boxH
        );
        sceneCtx.restore();

        // 2. YARI SAYDAM FÜME CAM TINT & VIGNETTE (Arka planı tamamen karartmaz, cam derinliği verir)
        sceneCtx.fillStyle = 'rgba(4, 8, 16, 0.52)';
        sceneCtx.fillRect(boxX, boxY, boxW, boxH);

        const vigGrad = sceneCtx.createRadialGradient(
          boxX + boxW / 2, boxY + boxH / 2, boxH * 0.25,
          boxX + boxW / 2, boxY + boxH / 2, boxH * 0.75
        );
        vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
        sceneCtx.fillStyle = vigGrad;
        sceneCtx.fillRect(boxX, boxY, boxW, boxH);

        // Üst kenar cam parlaması
        const specGrad = sceneCtx.createLinearGradient(boxX, boxY, boxX, boxY + 28);
        specGrad.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
        specGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
        sceneCtx.fillStyle = specGrad;
        sceneCtx.fillRect(boxX, boxY, boxW, 28);

        // İnce Trinitron fosfor ağı / scanlines
        sceneCtx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        for (let y = boxY; y < boxY + boxH; y += 3) {
          sceneCtx.fillRect(boxX, y, boxW, 1.2);
        }
        for (let x = boxX; x < boxX + boxW; x += 3) {
          sceneCtx.fillRect(x, boxY, 1.2, boxH);
        }

        // 3. JAVASCRIPT TYPEWRITER & BURST KOD TERMİNALİ (Hızlı akan, tab girintili, onlarca teknik içeren)
        const termPadX = 16;
        const termPadY = 18;
        const termX = boxX + termPadX;
        const termY = boxY + termPadY;
        const termW = boxW - termPadX * 2;
        const termH = boxH - termPadY * 2;
        const lineH = 14;
        const maxVisible = Math.floor(termH / lineH);

        const linesToRender = [...typeState.completedLines];
        if (typeState.lineIdx < currentLines.length) {
          const fullLine = currentLines[typeState.lineIdx];
          if (currentEvt.mode === 'type' || currentEvt.mode === 'dialogue') {
            linesToRender.push(fullLine.slice(0, typeState.charIdx));
          } else if (currentEvt.mode === 'scramble') {
            let scrambledTail = '';
            const remaining = fullLine.length - typeState.charIdx;
            const scrambleCount = Math.min(remaining, 6);
            for (let s = 0; s < scrambleCount; s++) {
              scrambledTail += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            }
            linesToRender.push(fullLine.slice(0, typeState.charIdx) + scrambledTail);
          }
        }

        const startIdx = Math.max(0, linesToRender.length - maxVisible);
        const visibleLines = linesToRender.slice(startIdx);

        sceneCtx.save();
        visibleLines.forEach((text, li) => {
          const lY = termY + li * lineH + 10;
          const isCurrent = (li === visibleLines.length - 1 && (currentEvt.mode === 'type' || currentEvt.mode === 'scramble' || currentEvt.mode === 'dialogue'));
          renderCodeLine(sceneCtx, text, termX, lY, isCurrent, now, termW);
        });
        sceneCtx.restore();

        // 3.5 CANLI KÖŞE TELEMETRİ HUD ÇİPİ (TICK SAYACI, SİSTEM FREKANSI, SİNYAL LEDİ)
        const chipW = 144;
        const chipH = 15;
        const chipX = boxX + boxW - chipW - 14;
        const chipY = boxY + 14;

        sceneCtx.save();
        sceneCtx.fillStyle = 'rgba(0, 18, 30, 0.75)';
        sceneCtx.fillRect(chipX, chipY - 10, chipW, chipH);
        sceneCtx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
        sceneCtx.lineWidth = 1;
        sceneCtx.strokeRect(chipX, chipY - 10, chipW, chipH);

        const pulseAlpha = Math.sin(now * 0.007) * 0.4 + 0.6;
        sceneCtx.beginPath();
        sceneCtx.arc(chipX + 8, chipY - 2.5, 2.5, 0, Math.PI * 2);
        sceneCtx.fillStyle = `rgba(0, 240, 255, ${pulseAlpha})`;
        sceneCtx.shadowColor = '#00f0ff';
        sceneCtx.shadowBlur = 5;
        sceneCtx.fill();

        sceneCtx.font = '9px "Share Tech Mono", monospace';
        sceneCtx.fillStyle = '#00f0ff';
        sceneCtx.shadowBlur = 0;
        const tickVal = Math.floor(now * 0.06) % 99999;
        sceneCtx.fillText(`TICK:${tickVal.toString().padStart(5, '0')}  SYS:60Hz`, chipX + 16, chipY);
        sceneCtx.restore();

        // 4. ANATOMİ ÇİZİMİ (Holografik neon çizim kodların üzerinde ışıldar)
        const vSize = Math.round(boxH * 1.076);
        const vY = Math.round(boxY - vSize * (32 / 1080));
        const vX = Math.round(boxX + boxW - vSize * (1036 / 1080));

        if (vitruvianLedImg.complete && vitruvianLedImg.naturalWidth > 0) {
          sceneCtx.save();
          // Çift katmanlı LED neon post-processing yayılımı (Elektrik cyan + akkor beyaz çekirdek)
          sceneCtx.shadowColor = 'rgba(0, 240, 255, 0.85)';
          sceneCtx.shadowBlur = 18;
          sceneCtx.globalCompositeOperation = 'screen';
          sceneCtx.drawImage(vitruvianLedImg, vX, vY, vSize, vSize);

          sceneCtx.shadowColor = 'rgba(255, 255, 255, 0.95)';
          sceneCtx.shadowBlur = 6;
          sceneCtx.drawImage(vitruvianLedImg, vX, vY, vSize, vSize);
          sceneCtx.restore();
        }

        sceneCtx.restore(); // clip sonu

        // 4. 4 KÖŞE PARLAK KIRMIZI L-BRAKETLERİ (KAREMİZİN KÖŞELERİNDE ÇİFT GEÇİŞLİ NEON EFEKTİ)
        const bLen = 34; // Braket kol uzunluğu
        const bThick = 4; // Braket kalınlığı
        
        sceneCtx.save();
        sceneCtx.strokeStyle = '#ff2222';
        sceneCtx.lineWidth = bThick;
        sceneCtx.lineCap = 'square';
        sceneCtx.shadowColor = 'rgba(255, 34, 34, 0.95)';
        sceneCtx.shadowBlur = 16;

        // Sol Üst (┌)
        sceneCtx.beginPath();
        sceneCtx.moveTo(boxX, boxY + bLen);
        sceneCtx.lineTo(boxX, boxY);
        sceneCtx.lineTo(boxX + bLen, boxY);
        sceneCtx.stroke();

        // Sağ Üst (┐)
        sceneCtx.beginPath();
        sceneCtx.moveTo(boxX + boxW - bLen, boxY);
        sceneCtx.lineTo(boxX + boxW, boxY);
        sceneCtx.lineTo(boxX + boxW, boxY + bLen);
        sceneCtx.stroke();

        // Sol Alt (└)
        sceneCtx.beginPath();
        sceneCtx.moveTo(boxX, boxY + boxH - bLen);
        sceneCtx.lineTo(boxX, boxY + boxH);
        sceneCtx.lineTo(boxX + bLen, boxY + boxH);
        sceneCtx.stroke();

        // Sağ Alt (┘)
        sceneCtx.beginPath();
        sceneCtx.moveTo(boxX + boxW - bLen, boxY + boxH);
        sceneCtx.lineTo(boxX + boxW, boxY + boxH);
        sceneCtx.lineTo(boxX + boxW, boxY + boxH - bLen);
        sceneCtx.stroke();

        // İkinci geçiş: İç beyaz akkor çekirdek (Gerçek neon tüp hissi)
        sceneCtx.strokeStyle = '#ff9999';
        sceneCtx.lineWidth = 1.5;
        sceneCtx.shadowColor = '#ffffff';
        sceneCtx.shadowBlur = 4;

        // Sol Üst (┌)
        sceneCtx.beginPath();
        sceneCtx.moveTo(boxX, boxY + bLen);
        sceneCtx.lineTo(boxX, boxY);
        sceneCtx.lineTo(boxX + bLen, boxY);
        sceneCtx.stroke();

        // Sağ Üst (┐)
        sceneCtx.beginPath();
        sceneCtx.moveTo(boxX + boxW - bLen, boxY);
        sceneCtx.lineTo(boxX + boxW, boxY);
        sceneCtx.lineTo(boxX + boxW, boxY + bLen);
        sceneCtx.stroke();

        // Sol Alt (└)
        sceneCtx.beginPath();
        sceneCtx.moveTo(boxX, boxY + boxH - bLen);
        sceneCtx.lineTo(boxX, boxY + boxH);
        sceneCtx.lineTo(boxX + bLen, boxY + boxH);
        sceneCtx.stroke();

        // Sağ Alt (┘)
        sceneCtx.beginPath();
        sceneCtx.moveTo(boxX + boxW - bLen, boxY + boxH);
        sceneCtx.lineTo(boxX + boxW, boxY + boxH);
        sceneCtx.lineTo(boxX + boxW, boxY + boxH - bLen);
        sceneCtx.stroke();

        sceneCtx.restore();
      }

      // --- THREE.JS WEBGL RENDER ---
      canvasTexture.needsUpdate = true;
      material.uniforms.uCurvature.value = crtConfig.curvature;
      material.uniforms.uPhosphorGrid.value = crtConfig.phosphorGrid;
      material.uniforms.uVignette.value = crtConfig.vignette;
      renderer.render(scene, camera);

      rafId = requestAnimationFrame(renderLoop);
    }

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      if (destroyMaze) destroyMaze();
      if (destroyMatrix) destroyMatrix();
      renderer.dispose();
      material.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="crt-terminal-wrapper">
      <div className="crt-monitor-bezel" ref={mountRef} />
    </div>
  );
}
