export const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'while', 'for',
  'async', 'await', 'class', 'constructor', 'new', 'try', 'catch', 'throw',
  'break', 'super', 'true', 'false', 'null', 'undefined', 'extends'
]);

export const SCRAMBLE_CHARS = '!@#$%^&*<>[]{}0123456789ABCDEFλΩΞ';
export const CHAR_W = 6.6;
export const tokenCache = new Map();

export function renderCodeLine(ctx, text, x, y, isTyping, now, termW) {
  const trimmed = text.trim();

  // 0. NOSTALJIK ANLATI / NARRATIVE SATIRLARI (:: ...)
  if (trimmed.startsWith('::')) {
    ctx.font = 'italic 10.5px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.75)';
    ctx.fillText(':: ', x, y);
    const nx = x + ctx.measureText(':: ').width;

    if (trimmed.includes('Pepsi')) {
      ctx.fillStyle = '#ffbb55';
    } else {
      ctx.fillStyle = 'rgba(225, 240, 255, 0.92)';
    }
    ctx.fillText(text.replace(/^::\s*/, ''), nx, y);
    if (isTyping) {
      const curX = nx + ctx.measureText(text.replace(/^::\s*/, '')).width;
      ctx.fillStyle = trimmed.includes('Pepsi') ? '#ffbb55' : '#00f0ff';
      ctx.fillRect(curX + 2, y - 9, 6, 12);
    }
    return;
  }

  // 0.5 KULLANICI DIYALOG / KOMUT ISTEMI (> ...)
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

  // 1. TERS RENKLI VURGU BANNERLARI (█ ...)
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
    } else if (
      trimmed.includes('PANIC') ||
      trimmed.includes('FATAL') ||
      trimmed.includes('OOM') ||
      trimmed.includes('COREDUMP') ||
      trimmed.includes('HALTED') ||
      trimmed.includes('SANITY')
    ) {
      bg = '#ff1122'; fg = '#ffffff';
    }

    ctx.fillStyle = bg;
    ctx.fillRect(x - 2, y - 10, Math.min(tw + 12, (termW || 280)), 13);
    ctx.fillStyle = fg;
    ctx.fillText(bannerText, x + 3, y);
    return;
  }

  // 2. HATA VE COKUS SATIRLARI
  if (
    trimmed.startsWith('Uncaught') ||
    trimmed.startsWith('TypeError') ||
    trimmed.startsWith('SyntaxError') ||
    trimmed.startsWith('RangeError') ||
    trimmed.startsWith('Error:') ||
    trimmed.startsWith('FATAL:') ||
    trimmed.startsWith('[FATAL]') ||
    trimmed.startsWith('[PANIC]') ||
    trimmed.startsWith('[CRIT]') ||
    trimmed.startsWith('[OVERVOLT]') ||
    trimmed.startsWith('[OVERHEAT]') ||
    trimmed.startsWith('[HARDWARE]') ||
    trimmed.startsWith('KERNEL PANIC:')
  ) {
    const jitter = Math.sin(now * 0.08) > 0.6 ? 2.5 : 0;
    ctx.fillStyle = '#ff2233';
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.fillText(text, x + jitter, y);
    return;
  }

  // 2.5 REGISTER TRACE SATIRLARI (RAX:, RCX:, CR0:)
  if (trimmed.startsWith('RAX:') || trimmed.startsWith('RCX:') || trimmed.startsWith('RSI:') || trimmed.startsWith('RIP:') || trimmed.startsWith('CR0:')) {
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(255, 90, 100, 0.9)';
    ctx.fillText(text, x, y);
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

  // 5. HEX MEMORY DUMP SATIRLARI (0x7FFF... / 0xDEAD...)
  if (trimmed.startsWith('0x7FFF') || trimmed.startsWith('0xDEAD')) {
    const pipeIdx = text.indexOf('|');
    const addrEnd = text.indexOf(':');
    ctx.font = '10px "Share Tech Mono", monospace';
    if (addrEnd !== -1 && pipeIdx !== -1) {
      const addr = text.slice(0, addrEnd + 1);
      const hexBytes = text.slice(addrEnd + 1, pipeIdx);
      const ascii = text.slice(pipeIdx);

      ctx.fillStyle = trimmed.startsWith('0xDEAD') ? '#ff3344' : '#00f0ff';
      ctx.fillText(addr, x, y);
      const ax = x + ctx.measureText(addr + ' ').width;

      ctx.fillStyle = '#ffbb33';
      ctx.fillText(hexBytes, ax, y);
      const hx = ax + ctx.measureText(hexBytes).width;

      ctx.fillStyle = trimmed.includes('PEPSI') ? '#ff3344' : '#39ff14';
      ctx.fillText(ascii, hx, y);
      return;
    }
  }

  // 6. x86_64 DISASSEMBLY SATIRLARI
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

  // 7. BITSTREAM VE PARITY DUZELTME SATIRLARI
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

  // 8. AUDIO DSP VE FFT SPEKTRUMU
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

  // 9. AG VE PROTOKOL ILETISIMI
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

  // 10. SISTEM VE ENERJI SATIRLARI
  if (trimmed.startsWith('[PWR]') || trimmed.startsWith('[SYS]') || trimmed.startsWith('[OPT]')) {
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 10.5px "Share Tech Mono", monospace';
    ctx.fillText(text, x, y);
    return;
  }

  // 11. DALGA BICIMLERI VE SPARKLINE
  if (trimmed.includes('∿∿∿')) {
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(text, x, y);
    return;
  }

  // 12. KUTULU ASCII AGAC VE SEMA BLOKLARI
  if (trimmed.startsWith('┌') || trimmed.startsWith('├') || trimmed.startsWith('│') || trimmed.startsWith('└')) {
    ctx.font = '11px "Share Tech Mono", monospace';
    const parts = text.split(/(\[[^\]]+\])/g);
    let bx = x;
    parts.forEach((p) => {
      if (p.startsWith('[')) {
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

  // 13. UYARI SATIRLARI
  if (trimmed.startsWith('[WARN]') || trimmed.startsWith('Warning:')) {
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.fillText(text, x, y);
    return;
  }

  // 14. BASARI / TEST SATIRLARI
  if (trimmed.startsWith('[OK]') || trimmed.startsWith('PASS') || trimmed.startsWith('RECOVERED:')) {
    ctx.fillStyle = '#39ff14';
    ctx.font = 'bold 11px "Share Tech Mono", monospace';
    ctx.fillText(text, x, y);
    return;
  }

  // 15. SHELL KOMUTLARI
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

  // 16. YORUM SATIRLARI
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

  // 17. TELEMETRI / JSON / HEAP SATIRLARI
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

  // 18. STANDART JAVASCRIPT KODLARI (Onbellekli Tokenizer)
  let parsedTokens = tokenCache.get(text);
  if (!parsedTokens) {
    const tokens = text.split(/([a-zA-Z0-9_$]+|'[^']*'|"[^"]*"|`[^`]*`|\s+|[^\s\w])/g);
    parsedTokens = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (!token) continue;
      let fill = 'rgba(215, 240, 255, 0.78)';
      let font = '11px "Share Tech Mono", monospace';
      if (JS_KEYWORDS.has(token)) {
        fill = '#00f0ff'; font = 'bold 11px "Share Tech Mono", monospace';
      } else if (token.startsWith("'") || token.startsWith('"') || token.startsWith('`')) {
        fill = '#ffbb33';
      } else if (/^\d+$/.test(token)) {
        fill = '#39ff14';
      } else if (/[{}()[\]]/.test(token)) {
        fill = '#ffffff'; font = 'bold 11px "Share Tech Mono", monospace';
      } else if (/[=><!+\-*/&|:;.,]/.test(token)) {
        fill = 'rgba(0, 240, 255, 0.75)';
      }
      parsedTokens.push({ token, fill, font, w: token.length * CHAR_W });
    }

    // Yalnizca tamamlanmis, statik satirlari onbellege al (daktilo ara durumlarini ve scramble'i onbellege alma)
    if (!isTyping) {
      if (tokenCache.size > 160) {
        // Kademeli LRU tahliyesi: En eski 30 anahtari sil (ani GC patlamasini onler)
        let removed = 0;
        for (const key of tokenCache.keys()) {
          tokenCache.delete(key);
          if (++removed >= 30) break;
        }
      }
      tokenCache.set(text, parsedTokens);
    }
  }

  let curX = x;
  for (let i = 0; i < parsedTokens.length; i++) {
    const item = parsedTokens[i];
    ctx.fillStyle = item.fill;
    ctx.font = item.font;
    ctx.fillText(item.token, curX, y);
    curX += item.w;
  }

  if (isTyping) {
    if (Math.floor(now * 0.005) % 2 === 0) {
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(curX + 2, y - 9, 6, 12);
    }
  }
}

export function drawNeonBrackets(ctx, x, y, w, h, bLen = 34, bThick = 4, color = '#ff2222', glowColor = 'rgba(255, 34, 34, 0.95)') {
  const arm = Math.min(bLen, Math.floor(h * 0.35), Math.floor(w * 0.35));
  
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = bThick;
  ctx.lineCap = 'square';
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 16;

  // Sol Ust (┌)
  ctx.beginPath();
  ctx.moveTo(x, y + arm); ctx.lineTo(x, y); ctx.lineTo(x + arm, y);
  ctx.stroke();

  // Sag Ust (┐)
  ctx.beginPath();
  ctx.moveTo(x + w - arm, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + arm);
  ctx.stroke();

  // Sol Alt (└)
  ctx.beginPath();
  ctx.moveTo(x, y + h - arm); ctx.lineTo(x, y + h); ctx.lineTo(x + arm, y + h);
  ctx.stroke();

  // Sag Alt (┘)
  ctx.beginPath();
  ctx.moveTo(x + w - arm, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - arm);
  ctx.stroke();

  // Ikinci gecis: Ic akkor cekirdek
  ctx.strokeStyle = '#ff9999';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 4;

  ctx.beginPath();
  ctx.moveTo(x, y + arm); ctx.lineTo(x, y); ctx.lineTo(x + arm, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w - arm, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + arm);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y + h - arm); ctx.lineTo(x, y + h); ctx.lineTo(x + arm, y + h);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w - arm, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - arm);
  ctx.stroke();

  ctx.restore();
}

