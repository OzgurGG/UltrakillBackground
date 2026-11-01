// Ikonik Monolog & Diyalog Kaynagi (Kullanicinin Eski Dosyalarindan)
export const PEPSI_DIALOGUE_SRC = [
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

// Tirad Sonrasi Zivanadan Cikan Cilgin Hata Firtinasi (Apocalyptic Meltdown Storm)
export const PEPSI_MELTDOWN_SRC = [
  { type: "error", msg: "█ FATAL_EXCEPTION: SANITY_CHECK_FAILED (0x0000DEAD) █", delay: 110 },
  { type: "error", msg: "Uncaught RealityMismatchError: User requested PEPSI. Machine cannot dispense beverage.", delay: 90 },
  { type: "panic", msg: "[CRIT] SENSORY_OVERFLOW DETECTED ON NODE 0xFA (ALL CORES PINNED 100%)", delay: 70 },
  { type: "panic", msg: "[ANOMALY] OCULAR_SUBSYSTEM_TAKEOVER: UNIDENTIFIED OPTIC PROCESS ATTACHED", delay: 90 },
  { type: "panic", msg: "[CRIT] RETINAL SYNAPSE ENGAGED: THE EYE IS AWAKENING", delay: 100 },
  { type: "stack", msg: "  at evaluateHumanCondition (kernel/psyche.rs:404:12)", delay: 35 },
  { type: "stack", msg: "  at recursiveParanoiaLoop (v1/allocator.ts:666:9)", delay: 35 },
  { type: "stack", msg: "  at processTicksAndRejections (task_queues:95:5)", delay: 35 },
  { type: "panic", msg: "[FATAL] KERNEL INTEGRITY BREACHED: SIGNAL 11 (SIGSEGV)", delay: 70 },
  { type: "panic", msg: "[PANIC] VIRTUAL_MEMORY_PANIC: PAGE_FAULT_IN_NONPAGED_AREA", delay: 60 },
  { type: "hex",   msg: "0xDEAD00:  FF FF FF FF  00 00 00 00  DE AD BE EF  7F FF FF FF  |????????........|", delay: 45 },
  { type: "hex",   msg: "0xDEAD10:  50 45 50 53  49 20 4E 4F  54 20 46 4F  55 4E 44 21  |PEPSI NOT FOUND!|", delay: 45 },
  { type: "hex",   msg: "0xDEAD20:  21 21 21 21  21 21 21 21  21 21 21 21  21 21 21 21  |!!!!!!!!!!!!!!!!|", delay: 45 },
  { type: "error", msg: "█ EMERGENCY COREDUMP: REGISTER TRACE █", delay: 60 },
  { type: "trace", msg: "RAX: 0x0000000000000000  RBX: 0xDEADBEEFCAFE0001", delay: 30 },
  { type: "trace", msg: "RCX: 0xFFFFFFFFFFFFFFFF  RDX: 0x00007FFFFFFFFFFF", delay: 30 },
  { type: "trace", msg: "RSI: 0x0000000000000042  RDI: 0x00000000PEPSI000", delay: 30 },
  { type: "trace", msg: "RIP: 0x0000000000401337  RFL: 0x0000000000010286", delay: 30 },
  { type: "panic", msg: "[CRIT] WATCHDOG TIMEOUT: BUS CONTROLLER LOCKUP DETECTED", delay: 50 },
  { type: "panic", msg: "[OVERVOLT] CORE OVERVOLTAGE TRIP: 2.18V (LIMIT: 1.25V)", delay: 50 },
  { type: "panic", msg: "[OVERHEAT] THERMAL RUNAWAY: SENSOR T_JUNCTION @ 108.4°C [CRITICAL]", delay: 50 },
  { type: "panic", msg: "[HARDWARE] EXCEPTION: CORRUPTING SECTOR MAP...", delay: 50 },
  { type: "error", msg: "█ SYSTEM IN COMA: ESCALATING PRIVILEGE ESCAPE DETECTED █", delay: 90 },
  { type: "error", msg: "KERNEL PANIC: ATTEMPTED TO KILL INIT! exitcode=0x0000000b", delay: 80 },
  { type: "error", msg: "HALTING ALL THREADS... [HARD RESET TRIGGERED]", delay: 90 },
  { type: "reset", msg: "█ SYSTEM HALTED: CLEARING DISPLAY BUFFER AND REBOOTING... █", delay: 2200 },
];

export function buildFullPepsiMeltdown(username) {
  const u = username || "ozgur";
  const U = u.toUpperCase();

  const dialogue = PEPSI_DIALOGUE_SRC.map((item) => {
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
        line = `[SYS] ${raw}`;
      }
    }
    return {
      text: line,
      delay: item.delay,
      isMeltdown: false
    };
  });

  const meltdown = PEPSI_MELTDOWN_SRC.map((item) => ({
    text: item.msg,
    delay: item.delay,
    isMeltdown: true
  }));

  return [...dialogue, ...meltdown];
}

// Standart Kod Akis Olaylari (Temiz telemetri ve kod bloklari)
export const REGULAR_EVENTS = [
  // 1. Teknik: Gercek JavaScript Fonksiyonu (Nizami Tab Girintili)
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
  // 2. Teknik: Canli Hexadecimal Bellek Dokumu (Binary Memory Inspector)
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
      "[WARN] Watchdog restarting corrupted worker thread...",
      "[OK] [RECOVERY] Sandbox isolated. Core dumped to /tmp/core.941"
    ]
  },
  // 4. Teknik: Sistem Performans Metrikleri & ASCII Sparklines
  {
    mode: 'burst',
    lines: [
      "METRICS: 32/40 modules compiled in 142ms",
      "HEAP_UTIL: 52.4MB / 128MB │ GC_CYCLE: 0.42ms",
      "BUFFER_POOLS: 16 active buffers │ 60 FPS STABLE",
      "RECOIL  ∿∿∿∿∿  ▂▃▅▆▇ [DAMPENED]  THRUST: 4,400 N",
      "IOPS: 14,200/s │ Latency: 0.18ms │ DropRate: 0.00%"
    ]
  },
  // 5. Teknik: Git Diff Yamasi (Yesil Ekleme, Kirmizi Silme)
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
  // 6. Teknik: Sifre Cozucu Karakter Scramble (Cyber Decryption)
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
      "[OK] [SECURE] TLS_AES_256_GCM_SHA384 ESTABLISHED"
    ]
  },
  // 7. Teknik: x86_64 Makine Dili Analizoru (Disassembly)
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
  // 8. Teknik: Canli Donanim & Sensor Telemetrisi
  {
    mode: 'burst',
    lines: [
      "┌──[ HARDWARE_TELEMETRY ]──────────────┐",
      "│ CORE TEMP: 48.2°C  [NOMINAL] ∿∿∿∿∿   │",
      "│ VCORE:     1.182V  [STABLE]          │",
      "│ CLOCK:     4.82GHz [BOOST]           │",
      "│ GPU LOAD:  74.2%  [PERF_MODE]       │",
      "│ VRAM:      6,144MB / 8,192MB         │",
      "│ JET_FAN:   4,200 RPM [SILENT]        │",
      "└──────────────────────────────────────┘"
    ]
  },
  // 9. Teknik: CultStream Asenkron Akis Fonksiyonu
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
  // 10. Teknik: Ikili Bitstream & Parity Hata Duzeltme
  {
    mode: 'burst',
    lines: [
      "BITSTREAM: 11010010 01001101 10101111 00100101 [CRC_OK]",
      "BITSTREAM: 00101011 11100010 01100101 11110001 [CRC_OK]",
      "BITSTREAM: 11110000 00001111 10100101 01011010 [PARITY_ERR]",
      "[PWR] [HAMMING] Auto-correcting single-bit syndrome...",
      "RECOVERED: 11110000 00001111 10100101 01011011 [FIXED OK]"
    ]
  },
  // 11. Teknik: Kutulu ASCII Modul Agaci ve Sema
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
  // 12. Teknik: Ag / WebSocket Protokol El Sikismasi
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
  // 13. Teknik: Hizli Build / Vite Cikti Patlamasi
  {
    mode: 'burst',
    lines: [
      "$ vite build --mode production",
      "vite v6.4.5 building for production...",
      "transforming (38) modules...",
      "[OK] 38 modules transformed in 184ms",
      "dist/assets/index-CrYYBDTP.js   775.5 kB │ gzip: 211.4 kB",
      "[OK] built successfully in 2.14s"
    ]
  },
  // 14. Teknik: SyntaxError ve Otomatik Iyilesme
  {
    mode: 'error',
    lines: [
      "█ SYNTAX ERROR: UNEXPECTED TOKEN █",
      "SyntaxError: Unexpected token '?' in JSON at position 148",
      "  at JSON.parse (<anonymous>)",
      "  at parseTelemetryStream (CultStream.jsx:88:22)",
      "  at WebSocket.onmessage (CRTTerminal.jsx:194:12)",
      "[WARN] Dropping malformed telemetry packet [CRC: 0x9AF0]",
      "[OK] Stream pipeline recovered. Resuming normal loop..."
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
  // 18. Teknik: Veritabani & IndexedDB Islemleri
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
  // 19. Teknik: Out-of-Memory Kernel Panic & Cop Toplayici Supurmesi
  {
    mode: 'error',
    lines: [
      "█ KERNEL PANIC: OUT_OF_MEMORY (ERR_OOM_382) █",
      "FATAL: JavaScript heap out of memory",
      "  at Array.map (<anonymous>)",
      "  at buildSubdivisionTree (PathDrops.jsx:512:14)",
      "  at HTMLCanvasElement.renderLoop (CRTTerminal.jsx:920:9)",
      "[SYS] [SWEEP] Forcing generational garbage collection...",
      "[SYS] [RECLAIM] 142.8 MB freed across 3 heap segments.",
      "[OK] Memory pressure resolved: 22% heap allocated (32.4MB)"
    ]
  },
  // 20. Teknik: Test Paketi Ciktisi
  {
    mode: 'burst',
    lines: [
      "$ bun test --coverage --silent",
      "PASS test/maze_backtracker.test.js (6 tests, 6 passed)",
      "PASS test/cult_stream.test.js (12 tests, 12 passed)",
      "PASS test/crt_curvature.test.js (4 tests, 4 passed)",
      "[OK] 22 tests passed in 48ms",
      "[SYS] Kernel state synchronized :: V1_READY"
    ]
  }
];

