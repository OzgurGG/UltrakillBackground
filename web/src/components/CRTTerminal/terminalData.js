// Ikonik Monolog & Diyalog Kaynagi (Rare Pepsi Tirade Event)
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

export const PEPSI_MELTDOWN_SRC = [
  { type: "error", msg: "█ FATAL_EXCEPTION: SANITY_CHECK_FAILED (0x0000DEAD) █", delay: 90 },
  { type: "error", msg: "Uncaught RealityMismatchError: User requested PEPSI. Machine cannot dispense beverage.", delay: 70 },
  { type: "stack", msg: "  at evaluateHumanCondition (kernel/psyche.rs:404:12)", delay: 30 },
  { type: "stack", msg: "  at recursiveParanoiaLoop (v1/allocator.ts:666:9)", delay: 30 },
  { type: "stack", msg: "  at processTicksAndRejections (task_queues:95:5)", delay: 30 },
  { type: "panic", msg: "[FATAL] KERNEL INTEGRITY BREACHED: SIGNAL 11 (SIGSEGV)", delay: 60 },
  { type: "panic", msg: "[CRIT] SENSORY_OVERFLOW DETECTED ON NODE 0xFA (ALL CORES PINNED 100%)", delay: 50 },
  { type: "panic", msg: "[PANIC] VIRTUAL_MEMORY_PANIC: PAGE_FAULT_IN_NONPAGED_AREA", delay: 50 },
  { type: "hex",   msg: "0xDEAD00:  FF FF FF FF  00 00 00 00  DE AD BE EF  7F FF FF FF  |????????........|", delay: 40 },
  { type: "hex",   msg: "0xDEAD10:  50 45 50 53  49 20 4E 4F  54 20 46 4F  55 4E 44 21  |PEPSI NOT FOUND!|", delay: 40 },
  { type: "hex",   msg: "0xDEAD20:  21 21 21 21  21 21 21 21  21 21 21 21  21 21 21 21  |!!!!!!!!!!!!!!!!|", delay: 40 },
  { type: "error", msg: "█ EMERGENCY COREDUMP: REGISTER TRACE █", delay: 50 },
  { type: "trace", msg: "RAX: 0x0000000000000000  RBX: 0xDEADBEEFCAFE0001", delay: 25 },
  { type: "trace", msg: "RCX: 0xFFFFFFFFFFFFFFFF  RDX: 0x00007FFFFFFFFFFF", delay: 25 },
  { type: "trace", msg: "RSI: 0x0000000000000042  RDI: 0x00000000PEPSI000", delay: 25 },
  { type: "trace", msg: "RIP: 0x0000000000401337  RFL: 0x0000000000010286", delay: 25 },
  { type: "panic", msg: "[CRIT] WATCHDOG TIMEOUT: BUS CONTROLLER LOCKUP DETECTED", delay: 40 },
  { type: "panic", msg: "[OVERVOLT] CORE OVERVOLTAGE TRIP: 2.18V (LIMIT: 1.25V)", delay: 40 },
  { type: "panic", msg: "[OVERHEAT] THERMAL RUNAWAY: SENSOR T_JUNCTION @ 108.4°C [CRITICAL]", delay: 40 },
  { type: "panic", msg: "[HARDWARE] EXCEPTION: CORRUPTING SECTOR MAP...", delay: 40 },
  { type: "error", msg: "█ SYSTEM IN COMA: ESCALATING PRIVILEGE ESCAPE DETECTED █", delay: 70 },
  { type: "error", msg: "KERNEL PANIC: ATTEMPTED TO KILL INIT! exitcode=0x0000000b", delay: 60 },
  { type: "error", msg: "HALTING ALL THREADS... [HARD RESET TRIGGERED]", delay: 70 },
  { type: "reset", msg: "█ SYSTEM HALTED: CLEARING DISPLAY BUFFER AND REBOOTING... █", delay: 1400 },
];

export function buildFullPepsiMeltdown(username) {
  const u = username || "V1";
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

// =========================================================================
// ULTRAKILL ENDLESS HERMETIC C & AST PROCEDURAL SYNTHESIS ENGINE
// (Saatlerce ve gunlerce tekrarlanmayan, 4-5 seviye derin tab basamakli kod motoru)
// =========================================================================

const BASE64_SOURCES = [
  'dHjpC21lZ2lzdHVz', // trismegistus
  'cHJpbmNpCgxl',     // principle
  'ZW1lcmFsZA==',     // emerald
  'd291Yg==',         // early_access
  'aW5mZXJubw==',     // inferno
  'Y291bnRlcg==',     // counter
  'b3B0aWNz',         // optics
  'aWduaXRpb24=',     // ignition
  'dmVyaXRhcw==',     // veritas
  'bWF0ZXJpYQ==',     // materia
  'b3Vyb2Jvcm9z',     // ouroboros
  'aGVybWVz',         // hermes
  'YXJjaGl0ZWN0',     // architect
  'Ymxvb2RfZnVsZQ==', // blood_fuel
  'cmVjdXJzdXM=',     // recursus
  'YXRoYW5vcg==',     // athanor
  'YWxiZWRv',         // albedo
  'bmlncmVkbw==',     // nigredo
  'cnViZWRv',         // rubedo
  'Y2FkYXZlcg==',     // cadaver
  'cGFyYW5vaWE=',     // paranoia
  'c3VwZXJpdXM=',     // superius
  'aW5mZXJpdXM=',     // inferius
  'dHJhbnNtdXRv',     // transmuto
  'Y29hZ3VsYQ==',     // coagula
  'c29sdmU=',         // solve
  'dWx0cmFraWxs',     // ultrakill
  'aHlkcmF1bGljcw==', // hydraulics
  'a2luZXRpYw==',     // kinetic
  'ZmVlZGJhY2tlcg==', // feedbacker
  'bWFuZGF0ZQ==',     // mandate
  'cHVyZ2U=',         // purge
  'Y2VsZXN0aWFs',     // celestial
  'YWJ5c3M=',         // abyss
  'cHJvcHVsc2lvbg==', // propulsion
  'bWVtb3J5X2J1cw==', // memory_bus
  'dmVjdG9yX2xvY2s=', // vector_lock
  'c3RyYXR1bQ==',     // stratum
  'bHVjaWZlcg==',     // lucifer
  'Z2FicmllbA==',     // gabriel
  'c3RhbmRieQ=='      // standby
];

const ALCHEMY_PROCESSES = [
  'permutation', 'transmutation', 'exhalation', 'dissolution', 'coagulation',
  'sublimation', 'calcination', 'projection', 'mortification', 'distillation',
  'fermentation', 'purification', 'crystallization', 'circulation', 'rubification',
  'ablution', 'amalgamation', 'multiplication', 'fixation', 'digestion',
  'incineration', 'separation', 'liquefaction', 'resurrection'
];

const MATTER_TYPES = [
  'blood', 'void', 'stone', 'iron', 'light', 'bone', 'ash', 'gold', 'salt',
  'sulfur', 'mercury', 'vitriol', 'lead', 'flesh', 'ichor', 'glass', 'ember',
  'force', 'gravity', 'aether', 'soul', 'rust', 'bile', 'steel', 'shadow',
  'steam', 'quicksilver', 'carbon', 'brimstone', 'plasma', 'marrow'
];

const STRUCT_NAMES = [
  'tree', 'branch', 'stem', 'leaf', 'root', 'seed', 'crucible', 'vessel',
  'chassis', 'matrix', 'chamber', 'boiler', 'retina', 'thruster', 'stabilizer',
  'conduit', 'filament', 'core', 'capsule', 'spore', 'canopy', 'caduceus',
  'athanor', 'actuator', 'resonator', 'manifold', 'relay', 'lattice',
  'synapse', 'tendon', 'cortex', 'piston', 'valve', 'nozzle', 'reliquary',
  'censer', 'monolith', 'siphon', 'pedestal', 'artery', 'capillary', 'chariot'
];

const MACRO_OVERWRITERS = [
  'ALLOCATOR_OVERWRITER', 'FEEDBACKER_AUTOREDIRECT', 'TARGET_ACQUISITION_LOCK',
  'IMPACT_ABSORPTION_SYSTEM', 'HEAT_SINK_FLUSH_CYCLE', 'AUTONOMOUS_KILL_PROTOCOL',
  'FINAL_DIRECTIVE_EXECUTION', 'NEURAL_DELETION_PASS', 'INERTIA_DAMPENER_OVERRIDE',
  'BLOOD_SIPHON_BYPASS', 'KINETIC_ENERGY_DISSIPATOR', 'PRESSURE_EQUILIBRIUM_TRIP',
  'PARRY_TIMING_WINDOW_EXTEND', 'RECEPTOR_CALIBRATION_PULSE', 'HYDRAULIC_SURGE_LIMITER',
  'REFLEX_AMPLIFIER_ENGAGE', 'OPTICAL_FIBER_OVERCLOCK', 'CORE_TEMPERATURE_SCRAM',
  'GROUND_SLAM_MOMENTUM_HARVEST', 'VECTOR_DRIFT_COMPENSATOR', 'BIOMECHANICAL_SYNTHESIS'
];

const TYPE_ALIASES = [
  'ORDER', 'VECTOR', 'AXIS', 'CATALYST', 'PRIME', 'SUBSTRATE',
  'RESONANCE', 'CARRIER', 'NODE', 'QUANTUM', 'TENSOR', 'FRAME'
];

const VAR_NAMES = [
  'alpha', 'beta', 'gamma', 'delta', 'omega', 'phi', 'psi',
  'below', 'above', 'origin', 'target', 'transit', 'flux',
  'anchor', 'payload', 'buffer', 'accumulator', 'reductant',
  'index', 'cursor', 'stratum', 'valence', 'vector'
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN(arr, n) {
  const copy = [...arr];
  const result = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return result;
}

// -------------------------------------------------------------------------
// ARCHETYPE 1: Hakita Derin AST Merdiven Agaci (Staircase Struct Tree)
// -------------------------------------------------------------------------
function generateStaircaseAstBlock() {
  const lines = [];
  const b64 = pick(BASE64_SOURCES);
  const procs = pickN(ALCHEMY_PROCESSES, 2 + Math.floor(Math.random() * 2));
  lines.push(`#INCLUDE { ${procs.join(', ')} } FROM "${b64}";`);

  if (Math.random() > 0.45) {
    const b64_2 = pick(BASE64_SOURCES);
    lines.push(`#INCLUDE { above, so } FROM "${b64_2}";`);
  }

  lines.push('');
  const p1 = pick(ALCHEMY_PROCESSES);
  lines.push(`void* below = INTERPRET(above, so);`);
  lines.push(`void* ${p1} = INTERPRET(${p1});`);
  lines.push(`typedef matter(${pick(MATTER_TYPES)}) ${pick(TYPE_ALIASES)};`);
  lines.push('');

  // 3 ila 4 Seviyeli Derin AST Agaci
  const depth = 3 + (Math.random() > 0.5 ? 1 : 0);
  const chain = pickN(STRUCT_NAMES, depth);
  const leafMatter = pick(MATTER_TYPES);
  const macro = pick(MACRO_OVERWRITERS);

  // Acilis Merdiveni (Stairs down)
  for (let i = 0; i < depth; i++) {
    const indent = '    '.repeat(i);
    lines.push(`${indent}struct ${chain[i]} {`);
  }

  // En Derin Merkez Govde (Core block at maximum tab indent)
  const coreIndent = '    '.repeat(depth);
  lines.push(`${coreIndent}typedef leaf = matter(${leafMatter});`);
  lines.push(`${coreIndent}leaf* active_${chain[depth - 1]};`);
  lines.push(`${coreIndent}void* core = INTERPRET(matter(${pick(MATTER_TYPES)}), matter(${pick(MATTER_TYPES)}));`);
  lines.push(`${coreIndent}unsigned long int (${macro});`);
  if (Math.random() > 0.5) {
    lines.push(`${coreIndent}inline volatile void* siphon_cycle(void* src, void* dst);`);
  }

  // Kapanis Merdiveni (Stairs unwinding back to root)
  for (let i = depth - 1; i >= 0; i--) {
    const indent = '    '.repeat(i);
    lines.push(`${indent}};`);
    if (i > 0) {
      lines.push(`${indent}${chain[i]}* primary_${chain[i]};`);
      if (i === 1 && Math.random() > 0.4) {
        lines.push(`${indent}unsigned int pulse_rate;`);
      }
    }
  }

  return { mode: 'type', lines };
}

// -------------------------------------------------------------------------
// ARCHETYPE 2: Simyasal Donusum & Sifon Pipeline Motoru
// -------------------------------------------------------------------------
function generateAlchemicalPipelineBlock() {
  const lines = [];
  const b64 = pick(BASE64_SOURCES);
  const mIn = pick(MATTER_TYPES);
  const mOut = pick(MATTER_TYPES);
  const mCat = pick(MATTER_TYPES);
  const pName = pick(ALCHEMY_PROCESSES);
  const pipeStruct = pick(STRUCT_NAMES);
  const innerMesh = pick(STRUCT_NAMES);
  const macro = pick(MACRO_OVERWRITERS);

  lines.push(`#PRAGMA ALCHEMY(${pName.toUpperCase()})`);
  lines.push(`#INCLUDE { ${pName}, coagulation, projection } FROM "${b64}";`);
  lines.push('');
  lines.push(`typedef matter(${mIn})* (*transmuter)(matter(${mCat})*, depth_t);`);
  lines.push(`void* vector_root = INTERPRET(matter(${mIn}), matter(${mOut}));`);
  lines.push('');

  // Level 0
  lines.push(`struct ${pipeStruct}_pipeline {`);
  // Level 1
  lines.push(`    volatile matter(${mIn})* siphon_in;`);
  lines.push(`    matter(${mOut})* discharge_out;`);
  lines.push(`    inline void* cycle(matter* root) {`);
  // Level 2
  lines.push(`        if (!root) return NULL;`);
  lines.push(`        matter* intermediate = INTERPRET(root, CATALYST_OVERRIDE);`);
  lines.push(`        struct ${innerMesh}_filter {`);
  // Level 3
  lines.push(`            unsigned long int (${macro});`);
  lines.push(`            void* buffer = ALLOC_TRANSMUTE(intermediate, sizeof(matter));`);
  lines.push(`            uint32_t affinity_flags = 0x00FF00FF;`);
  // Level 2
  lines.push(`        };`);
  lines.push(`        return intermediate;`);
  // Level 1
  lines.push(`    };`);
  lines.push(`    ${innerMesh}_filter* mesh_instance;`);
  // Level 0
  lines.push(`};`);

  return { mode: 'type', lines };
}

// -------------------------------------------------------------------------
// ARCHETYPE 3: Donanim Telemetri Birligi & Kinetik Algilayici (Union Matrix)
// -------------------------------------------------------------------------
function generateHardwareUnionBlock() {
  const lines = [];
  const b64 = pick(BASE64_SOURCES);
  const unionName = pick(STRUCT_NAMES);
  const coreStruct = pick(STRUCT_NAMES);
  const actuator = pick(STRUCT_NAMES);
  const macro = pick(MACRO_OVERWRITERS);
  const regVar = pick(VAR_NAMES);

  lines.push(`#DEFINE RECURSION_DEPTH 0x${Math.floor(Math.random() * 255).toString(16).toUpperCase().padStart(2, '0')}`);
  lines.push(`#INCLUDE { permutation, exhalation } FROM "${b64}";`);
  lines.push('');
  lines.push(`union ${unionName}_bus {`);
  // Level 1
  lines.push(`    struct {`);
  // Level 2
  lines.push(`        volatile uint64_t blood_pressure_psi;`);
  lines.push(`        volatile uint32_t kinetic_momentum;`);
  lines.push(`        struct ${coreStruct}_actuator {`);
  // Level 3
  lines.push(`            void* ${regVar} = INTERPRET(incoming_force);`);
  lines.push(`            float parry_threshold = 0.001${Math.floor(Math.random() * 9)}f;`);
  lines.push(`            struct ${actuator}_gate {`);
  // Level 4
  lines.push(`                unsigned long int (${macro});`);
  lines.push(`                volatile uint16_t vector_tolerance;`);
  lines.push(`                void* latch = INTERPRET(above, so);`);
  // Level 3
  lines.push(`            };`);
  lines.push(`            ${actuator}_gate* active_gate;`);
  // Level 2
  lines.push(`        };`);
  lines.push(`        ${coreStruct}_actuator primary_actuator;`);
  // Level 1
  lines.push(`    } raw_telemetry;`);
  lines.push(`    uint8_t memory_plane[64];`);
  // Level 0
  lines.push(`};`);

  return { mode: 'type', lines };
}

// -------------------------------------------------------------------------
// ARCHETYPE 4: Zumrut Tablet & Hermetik Aksiyom AST (Emerald Tablet Dialectic)
// -------------------------------------------------------------------------
function generateDialecticalAxiomBlock() {
  const lines = [];
  const b64_1 = pick(BASE64_SOURCES);
  const b64_2 = pick(BASE64_SOURCES);
  const m1 = pick(MATTER_TYPES);
  const m2 = pick(MATTER_TYPES);
  const m3 = pick(MATTER_TYPES);
  const sRoot = pick(STRUCT_NAMES);
  const sStem = pick(STRUCT_NAMES);
  const sLeaf = pick(STRUCT_NAMES);
  const macro = pick(MACRO_OVERWRITERS);

  lines.push(`#INCLUDE { above, so } FROM "${b64_1}";`);
  lines.push(`#INCLUDE { permutation, transmutation, exhalation } FROM "${b64_2}";`);
  lines.push('');
  lines.push(`void* below = INTERPRET(above, so);`);
  lines.push(`void* permutation = INTERPRET(permutation);`);
  lines.push(`void* transmutation = INTERPRET(transmutation);`);
  lines.push('');
  lines.push(`typedef matter(${m1}) ORDER;`);
  lines.push(`typedef matter(${m2}) VECTOR;`);
  lines.push('');

  // 3 Seviyeli Derin Govde
  lines.push(`struct ${sRoot} {`);
  lines.push(`    struct ${sStem} {`);
  lines.push(`        struct ${sLeaf} {`);
  lines.push(`            typedef leaf = matter(${m3});`);
  lines.push(`            leaf* leaf;`);
  lines.push(`            void* below = INTERPRET(above, so);`);
  lines.push(`            unsigned long int (${macro});`);
  lines.push(`        };`);
  lines.push(`        ${sLeaf}* primary_${sLeaf};`);
  lines.push(`    };`);
  lines.push(`    ${sStem}* main_${sStem};`);
  lines.push(`};`);

  return { mode: 'type', lines };
}

// -------------------------------------------------------------------------
// ARCHETYPE 5: Ozyinelemeli Bellek Tahsis & Temizleme Agaci (Recursive GC Pass)
// -------------------------------------------------------------------------
function generateRecursiveAllocatorBlock() {
  const lines = [];
  const b64 = pick(BASE64_SOURCES);
  const rootType = pick(STRUCT_NAMES);
  const cellType = pick(STRUCT_NAMES);
  const subAlloc = pick(STRUCT_NAMES);
  const mType = pick(MATTER_TYPES);
  const macro = pick(MACRO_OVERWRITERS);
  const vName = pick(VAR_NAMES);

  lines.push(`#PRAGMA V1_KERNEL_PASS`);
  lines.push(`#INCLUDE { purge, reclaim, zero } FROM "${b64}";`);
  lines.push('');
  lines.push(`void* purge_stale_matter_nodes(struct ${rootType}* root, int depth) {`);
  // Level 1
  lines.push(`    if (depth <= 0) return NULL;`);
  lines.push(`    struct ${cellType}_iterator {`);
  // Level 2
  lines.push(`        matter(${mType})* cell_payload;`);
  lines.push(`        struct ${subAlloc}_subframe {`);
  // Level 3
  lines.push(`            void* ${vName} = REINTERPRET_CAST<void*>(root->payload);`);
  lines.push(`            unsigned long int (${macro});`);
  lines.push(`            volatile uint32_t parity_bit = 0x01;`);
  // Level 2
  lines.push(`        };`);
  lines.push(`        ${subAlloc}_subframe frame_state;`);
  // Level 1
  lines.push(`    };`);
  lines.push(`    return INTERPRET(root, RECURSIVE_PURGE);`);
  // Level 0
  lines.push(`};`);

  return { mode: 'type', lines };
}

// =========================================================================
// SONSUZ PROSEDURAL AKIS MOTORU
// (Her cagrilisinda 5 farkli gramer sablonundan yepyeni, tekrarlanmayan kod uretir)
// =========================================================================
export function generateNextUltrakillEvent() {
  const roll = Math.random();
  if (roll < 0.32) {
    return generateStaircaseAstBlock();
  } else if (roll < 0.54) {
    return generateAlchemicalPipelineBlock();
  } else if (roll < 0.74) {
    return generateHardwareUnionBlock();
  } else if (roll < 0.88) {
    return generateDialecticalAxiomBlock();
  } else {
    return generateRecursiveAllocatorBlock();
  }
}

// Fallback Orijinal Tohum Blogu (Ilk acilista hazir bulunmasi icin)
export const REGULAR_EVENTS = [
  generateDialecticalAxiomBlock()
];
