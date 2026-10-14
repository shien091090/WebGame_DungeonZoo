/* 伸縮擂台秀 — 美術繪製模組(Canvas 2D 幾何繪製, 無外部資源)
 * 全域物件 window.Art; 函式只負責「給我狀態, 我畫出來」。
 * 規格與 state 欄位見 game/art/style.md。
 */
(function () {
  'use strict';

  // ───────────────────────── 色票 ─────────────────────────
  const P = {
    bg: '#1b1726', bgDeep: '#120f1a',
    panel: '#2a2438', panel2: '#352e47', panelHi: '#463c5e', panelLine: '#5a4f78',
    text: '#f4f0ff', textDim: '#a99fc4', textDark: '#16121f', outline: '#0d0a12',
    select: '#ffffff',
    danger: '#ff3b3b',
    gold: '#ffd23a', rep: '#8fd8ff',
    capture: '#8cf06a', rope: '#f2e3c0', ropeDark: '#8a6a3a',
    ignite: '#ff4d3a', calm: '#39a8ff', special: '#c46cff',
    redZone: '#ff3b3b', rageLow: '#8a9bb5', rageMid: '#ffb347',
    mark: '#ff3b3b',
    arena: '#4fd1c5', arenaDark: '#1f5f5a', offField: '#0a0810',
    chant: '#b4a6ff', chantDark: '#3a3266',
    call: '#f0e0b0', callDark: '#5a4a2a',
    encore: '#ff6ad5', warm: '#ffe14d',
    tamer: '#2f4a8a', tamerHat: '#f2e3c0', tamerSkin: '#f0c8a0',
    fxNormal: '#ffffff', fxSkill: '#fff2a8',
    reflect: '#ffffff',
    showFloor: '#3b3247', stands: '#241e30', seat: '#3a2f4c', fence: '#a7774a', fenceDark: '#4a2e18',
    bee: '#f5c518', slug: '#6fe0b0', shrimp: '#ff7a33', urchin: '#9a6ae0', eel: '#3355ee', bear: '#e6f2fa',
    fruit: '#ff8ad0', tree: '#3f8a4a',
  };

  const SPECIES = {
    bee: { name: '蜜蜂球', c: P.bee, d: '#7a5600', eff: 'ignite' },
    slug: { name: '薄荷蛞蝓', c: P.slug, d: '#23735a', eff: 'calm' },
    shrimp: { name: '火山蝦', c: P.shrimp, d: '#7a240a', eff: 'fuse' },
    urchin: { name: '海膽球', c: P.urchin, d: '#3a1e66', eff: 'slime' },
    eel: { name: '雷電鰻', c: P.eel, d: '#121f66', eff: 'chainIgnite' },
    bear: { name: '冰雹熊', c: P.bear, d: '#5f7f99', eff: 'calm' },
  };
  const SPECIES_ORDER = ['bee', 'slug', 'shrimp', 'urchin', 'eel', 'bear'];
  const EFFECTS = {
    ignite: { label: '激怒', c: P.ignite },
    calm: { label: '冷靜', c: P.calm },
    fuse: { label: '引信', c: P.special },
    slime: { label: '黏液', c: P.special },
    chainIgnite: { label: '激怒', c: P.ignite, sub: '連鎖電' },
  };
  const CARDS = {
    shrink: { name: '縮場', cat: 'arena', desc: '擂台縮一階' },
    widen: { name: '放場', cat: 'arena', desc: '擂台放寬一階' },
    cage: { name: '擂台賽', cat: 'arena', desc: '擂台瞬間縮到最窄 5 秒' },
    provoke: { name: '激將', cat: 'call', accent: P.ignite, desc: '點名的那種全部大怒' },
    chill: { name: '冰鎮', cat: 'call', accent: P.calm, desc: '點名的那種全部冷靜' },
    encore: { name: '安可', cat: 'call', accent: P.encore, desc: '點名的那種全部立刻表演' },
    warmup: { name: '熱身操', cat: 'call', accent: P.warm, desc: '點名的那種跑得更快' },
  };
  const CHANTS = {
    alarm: { name: '警鈴', desc: '當 3 隻帶標記, 擂台就放寬' },
    gong: { name: '鑼聲', desc: '當一半冷掉, 擂台就縮緊' },
    brigade: { name: '滅火隊', desc: '當有誰標記到 4, 帶標記的全部少一個' },
    salute: { name: '慶功炮', desc: '當出現連鎖 4 段, 沒進紅區的全部升溫' },
    clear: { name: '清場鈴', desc: '當有誰失控, 擂台全開、全場降溫' },
  };
  const DUNGEONS = {
    candy: { name: '糖果森林', mons: ['bee', 'slug'], head: '#d9579a',
      floor: '#4d3a52', floor2: '#56425c', wall: '#24452e', wall2: '#e58ab8', rock: '#8c7a8f',
      slow: '#c98a2e', slow2: '#f0b850', hurt: '#3a2a2a', hurt2: '#ff7040', bush: '#4fae5a', bush2: '#2f7a3c' },
    coast: { name: '熔岩海岸', mons: ['shrimp', 'urchin'], head: '#e0672a',
      floor: '#5a4a3a', floor2: '#635240', wall: '#2e2622', wall2: '#5a4a40', rock: '#7a6a60',
      slow: '#3e5566', slow2: '#7aa0b8', hurt: '#1e1614', hurt2: '#ff6a1a', bush: '#4f9e5a', bush2: '#2c6a38' },
    plateau: { name: '雷雲高原', mons: ['eel', 'bear'], head: '#5a6ad8',
      floor: '#424a5e', floor2: '#4a5368', wall: '#232838', wall2: '#5a6480', rock: '#8a92a8',
      slow: '#4e4630', slow2: '#7a6a40', hurt: '#2a2a36', hurt2: '#ffe14d', bush: '#5aa86a', bush2: '#2f6a44' },
  };
  const WEAPONS = {
    club: { name: '棍棒', desc: 'Z 敲擊 X 無' },
    sword: { name: '劍', desc: 'Z 斬擊可打回飛彈 X 擊暈' },
    spear: { name: '長槍', desc: 'Z 長刺 X 突進' },
    whip: { name: '長鞭', desc: 'Z 整圈抽打 X 擊飛' },
  };
  const UPGRADES = {
    attack: { name: '攻擊力 +1', desc: '每次攻擊傷害 +1' },
    armor: { name: '護甲 心 +1', desc: '心上限 +1' },
    ropeBag: { name: '繩袋 捕獸繩 +1', desc: '每天捕獸繩 +1' },
  };

  // ───────────────────────── 小工具 ─────────────────────────
  const TAU = Math.PI * 2;
  const FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';
  function n(v, d) { v = Number(v); return isFinite(v) ? v : (d === undefined ? 0 : d); }
  function c01(v) { v = n(v, 0); return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ratio(a, b) { b = n(b, 0); return b > 0 ? c01(n(a, 0) / b) : 0; }
  function str(v) { return (v === undefined || v === null) ? '' : String(v); }
  function obj(s) { return (s && typeof s === 'object') ? s : {}; }
  function pick(v, table, def) { return Object.prototype.hasOwnProperty.call(table, v) ? v : def; }
  function sp(v) { return pick(v, SPECIES, 'bee'); }
  function now() {
    const t = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    return t / 1000;
  }
  function font(size, bold) { return (bold ? 'bold ' : '') + Math.round(size) + 'px ' + FONT; }
  function tw(ctx, s) {
    try { const m = ctx.measureText(String(s)); if (m && typeof m.width === 'number' && isFinite(m.width)) return m.width; } catch (e) { /* 假 ctx */ }
    return String(s).length * 12;
  }
  function text(ctx, s, x, y, size, color, align, bold, outlineW) {
    ctx.font = font(size, bold);
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    if (outlineW) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = outlineW;
      ctx.strokeStyle = P.outline;
      ctx.strokeText(String(s), x, y);
    }
    ctx.fillStyle = color || P.text;
    ctx.fillText(String(s), x, y);
  }
  // 依寬度斷行(中文逐字)
  function wrap(ctx, s, maxW, size, bold) {
    ctx.font = font(size, bold);
    const out = []; let line = '';
    for (const ch of String(s)) {
      if (tw(ctx, line + ch) > maxW && line) { out.push(line); line = ch; } else line += ch;
    }
    if (line) out.push(line);
    return out;
  }
  // 縮字直到放得下
  function fitText(ctx, s, x, y, maxW, size, color, align, bold, outlineW) {
    let sz = size;
    ctx.font = font(sz, bold);
    while (sz > 10 && tw(ctx, s) > maxW) { sz -= 1; ctx.font = font(sz, bold); }
    text(ctx, s, x, y, sz, color, align, bold, outlineW);
  }
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); }
  function starPath(ctx, x, y, R, r, k) {
    k = k || 5; ctx.beginPath();
    for (let i = 0; i < k * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / k; const rad = i % 2 ? r : R;
      const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
  }
  // 選中框: 全遊戲同一個長相(白色 3px 內框 + 內側亮邊)
  function selFrame(ctx, x, y, w, h, r) {
    ctx.save();
    ctx.lineWidth = 4; ctx.strokeStyle = P.select;
    rr(ctx, x + 2, y + 2, w - 4, h - 4, r); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(140,230,255,0.8)';
    rr(ctx, x + 6, y + 6, w - 12, h - 12, Math.max(0, r - 4)); ctx.stroke();
    ctx.restore();
  }
  function panelBox(ctx, x, y, w, h, fill, line, r) {
    rr(ctx, x + 1, y + 1, w - 2, h - 2, r === undefined ? 10 : r); // 描邊收在框內
    ctx.fillStyle = fill || P.panel; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = line || P.panelLine; ctx.stroke();
  }
  function coin(ctx, x, y, r) {
    circle(ctx, x, y, r); ctx.fillStyle = P.gold; ctx.fill();
    ctx.lineWidth = Math.max(1, r * 0.25); ctx.strokeStyle = '#8a6400'; ctx.stroke();
    circle(ctx, x, y, r * 0.45); ctx.strokeStyle = 'rgba(138,100,0,0.7)'; ctx.lineWidth = 1; ctx.stroke();
  }
  function repStar(ctx, x, y, r) {
    starPath(ctx, x, y, r, r * 0.45); ctx.fillStyle = P.rep; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#1f4a66'; ctx.stroke();
  }
  function heart(ctx, x, y, s, full) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s * 0.9, y - s * 0.2, x - s * 0.45, y - s * 0.8, x, y - s * 0.3);
    ctx.bezierCurveTo(x + s * 0.45, y - s * 0.8, x + s * 0.9, y - s * 0.2, x, y + s * 0.35);
    ctx.closePath();
    ctx.fillStyle = full ? '#ff4d6d' : '#3a2a3a'; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = full ? '#7a1a2a' : '#6a5a7a'; ctx.stroke();
  }
  function arrow(ctx, x1, y1, x2, y2, color, w, head) {
    const a = Math.atan2(y2 - y1, x2 - x1); head = head || 14;
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w || 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * head * 0.6, y2 - Math.sin(a) * head * 0.6); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.45) * head, y2 - Math.sin(a - 0.45) * head);
    ctx.lineTo(x2 - Math.cos(a + 0.45) * head, y2 - Math.sin(a + 0.45) * head);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function shortLabel(ctx, s, x, y, color) { // 說明頁物件旁的短標籤
    ctx.save();
    ctx.font = font(15, true);
    const w = tw(ctx, s) + 14;
    rr(ctx, x - w / 2, y - 12, w, 24, 12);
    ctx.fillStyle = 'rgba(13,10,18,0.85)'; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = color || P.textDim; ctx.stroke();
    text(ctx, s, x, y + 1, 15, color || P.text, 'center', true);
    ctx.restore();
  }
  function keycap(ctx, s, x, y) {
    ctx.save();
    ctx.font = font(16, true);
    const w = Math.max(30, tw(ctx, s) + 16);
    rr(ctx, x - w / 2, y - 14, w, 30, 6); ctx.fillStyle = '#d8d2e8'; ctx.fill();
    rr(ctx, x - w / 2, y - 16, w, 28, 6); ctx.fillStyle = '#f7f4ff'; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#5a5070'; ctx.stroke();
    text(ctx, s, x, y - 2, 16, P.textDark, 'center', true);
    ctx.restore();
  }

  // ───────────────────────── 魔物本體(地下城、表演場、卡片共用) ─────────────────────────
  // r = 本體半徑; 所有附件都收在 1.3r 內。opt.flat: 整隻塗成單色(受擊閃白用)
  function eye(ctx, x, y, s, dir) {
    circle(ctx, x, y, s); ctx.fillStyle = '#ffffff'; ctx.fill();
    circle(ctx, x + dir * s * 0.35, y, s * 0.55); ctx.fillStyle = '#16121f'; ctx.fill();
  }
  function speciesBody(ctx, species, x, y, r, dir, opt) {
    opt = opt || {};
    const S = SPECIES[species] || SPECIES.bee;
    const flat = opt.flat;
    const c = flat || S.c, d = flat || S.d;
    dir = dir < 0 ? -1 : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.strokeStyle = flat ? flat : P.outline;
    if (species === 'bee') {
      // 翅膀
      ctx.fillStyle = flat || 'rgba(235,250,255,0.85)';
      ctx.beginPath(); ctx.ellipse(-dir * r * 0.3, -r * 0.74, r * 0.42, r * 0.26, -dir * 0.5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(dir * r * 0.15, -r * 0.8, r * 0.36, r * 0.22, dir * 0.3, 0, TAU); ctx.fill(); ctx.stroke();
      // 尾針
      ctx.fillStyle = d;
      ctx.beginPath(); ctx.moveTo(-dir * r * 0.9, -r * 0.15); ctx.lineTo(-dir * r * 1.17, 0); ctx.lineTo(-dir * r * 0.9, r * 0.15); ctx.closePath(); ctx.fill(); ctx.stroke();
      circle(ctx, 0, 0, r); ctx.fillStyle = c; ctx.fill();
      if (!flat) {
        ctx.save(); circle(ctx, 0, 0, r); ctx.clip();
        ctx.fillStyle = '#2a1e10';
        ctx.fillRect(-r * 0.45, -r, r * 0.2, r * 2); ctx.fillRect(-r * 0.05, -r, r * 0.2, r * 2);
        ctx.restore();
      }
      circle(ctx, 0, 0, r); ctx.stroke();
      if (!flat) eye(ctx, dir * r * 0.5, -r * 0.15, r * 0.22, dir);
    } else if (species === 'slug') {
      // 觸角
      ctx.strokeStyle = flat || d; ctx.lineWidth = Math.max(2, r * 0.1);
      ctx.beginPath(); ctx.moveTo(dir * r * 0.5, -r * 0.3); ctx.lineTo(dir * r * 0.7, -r * 0.95); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(dir * r * 0.25, -r * 0.35); ctx.lineTo(dir * r * 0.3, -r * 1.0); ctx.stroke();
      ctx.strokeStyle = flat ? flat : P.outline; ctx.lineWidth = Math.max(1.5, r * 0.08);
      circle(ctx, dir * r * 0.7, -r * 0.98, r * 0.15); ctx.fillStyle = flat || '#ffffff'; ctx.fill(); ctx.stroke();
      circle(ctx, dir * r * 0.3, -r * 1.03, r * 0.15); ctx.fill(); ctx.stroke();
      if (!flat) { circle(ctx, dir * r * 0.74, -r * 0.98, r * 0.07); circle(ctx, dir * r * 0.34, -r * 1.03, r * 0.07); ctx.fillStyle = '#16121f'; ctx.fill(); }
      ctx.beginPath(); ctx.ellipse(0, r * 0.15, r * 1.15, r * 0.72, 0, 0, TAU);
      ctx.fillStyle = c; ctx.fill(); ctx.stroke();
      if (!flat) {
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath(); ctx.ellipse(-dir * r * 0.2, -r * 0.15, r * 0.5, r * 0.18, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = d;
        circle(ctx, -dir * r * 0.55, r * 0.3, r * 0.13); ctx.fill();
        circle(ctx, -dir * r * 0.1, r * 0.45, r * 0.1); ctx.fill();
      }
    } else if (species === 'shrimp') {
      // 觸鬚
      ctx.strokeStyle = flat || d; ctx.lineWidth = Math.max(1.5, r * 0.07);
      ctx.beginPath(); ctx.moveTo(dir * r * 0.75, -r * 0.3); ctx.quadraticCurveTo(dir * r * 1.2, -r * 0.6, dir * r * 0.9, -r * 1.15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(dir * r * 0.65, -r * 0.35); ctx.quadraticCurveTo(dir * r * 0.8, -r * 0.9, dir * r * 0.4, -r * 1.1); ctx.stroke();
      ctx.strokeStyle = flat ? flat : P.outline; ctx.lineWidth = Math.max(1.5, r * 0.08);
      // 尾扇
      ctx.fillStyle = d;
      ctx.beginPath(); ctx.moveTo(-dir * r * 0.75, 0); ctx.lineTo(-dir * r * 1.17, -r * 0.5); ctx.lineTo(-dir * r * 1.05, 0); ctx.lineTo(-dir * r * 1.17, r * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 彎身
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.95, r * 0.68, dir * -0.15, 0, TAU);
      ctx.fillStyle = c; ctx.fill(); ctx.stroke();
      if (!flat) {
        ctx.strokeStyle = d; ctx.lineWidth = Math.max(1.5, r * 0.07);
        for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(-dir * r * 0.2 + i * dir * r * 0.32, 0, r * 0.62, -0.9, 0.9); ctx.stroke(); }
        ctx.fillStyle = '#3a1205';
        circle(ctx, -dir * r * 0.3, -r * 0.35, r * 0.08); ctx.fill();
        circle(ctx, dir * r * 0.05, r * 0.4, r * 0.07); ctx.fill();
        eye(ctx, dir * r * 0.62, -r * 0.18, r * 0.18, dir);
      }
    } else if (species === 'urchin') {
      ctx.fillStyle = d;
      const k = 14;
      ctx.beginPath();
      for (let i = 0; i < k; i++) {
        const a = i / k * TAU, a1 = a - 0.16, a2 = a + 0.16, L = i % 2 ? r * 1.0 : r * 1.22;
        ctx.moveTo(Math.cos(a1) * r * 0.6, Math.sin(a1) * r * 0.6);
        ctx.lineTo(Math.cos(a) * L, Math.sin(a) * L);
        ctx.lineTo(Math.cos(a2) * r * 0.6, Math.sin(a2) * r * 0.6);
      }
      ctx.fill(); ctx.stroke();
      circle(ctx, 0, 0, r * 0.72); ctx.fillStyle = c; ctx.fill(); ctx.stroke();
      if (!flat) {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        circle(ctx, -r * 0.22, -r * 0.25, r * 0.2); ctx.fill();
        eye(ctx, dir * r * 0.3, -r * 0.05, r * 0.16, dir);
        eye(ctx, dir * r * 0.0, -r * 0.08, r * 0.13, dir);
      }
    } else if (species === 'eel') {
      const pts = [];
      for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([(t * 2 - 1) * r * 0.88 * dir, Math.sin(t * Math.PI * 2) * r * 0.32]); }
      ctx.lineCap = 'round';
      ctx.strokeStyle = flat || P.outline; ctx.lineWidth = r * 0.72;
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
      ctx.strokeStyle = c; ctx.lineWidth = r * 0.56;
      ctx.stroke();
      if (!flat) {
        ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = Math.max(1.5, r * 0.08);
        ctx.beginPath();
        for (let i = 2; i <= 13; i++) { const p = pts[i]; ctx.lineTo(p[0], p[1] + (i % 2 ? -r * 0.1 : r * 0.1)); }
        ctx.stroke();
      }
      const hx = dir * r * 0.88, hy = 0;
      ctx.strokeStyle = flat || P.outline; ctx.lineWidth = Math.max(1.5, r * 0.08);
      circle(ctx, hx, hy, r * 0.36); ctx.fillStyle = c; ctx.fill(); ctx.stroke();
      if (!flat) eye(ctx, hx + dir * r * 0.08, hy - r * 0.08, r * 0.14, dir);
    } else { // bear
      ctx.fillStyle = c;
      circle(ctx, -r * 0.6, -r * 0.75, r * 0.3); ctx.fill(); ctx.stroke();
      circle(ctx, r * 0.6, -r * 0.75, r * 0.3); ctx.fill(); ctx.stroke();
      if (!flat) {
        ctx.fillStyle = '#9fc7e0';
        circle(ctx, -r * 0.6, -r * 0.75, r * 0.15); ctx.fill();
        circle(ctx, r * 0.6, -r * 0.75, r * 0.15); ctx.fill();
      }
      circle(ctx, 0, 0, r); ctx.fillStyle = c; ctx.fill(); ctx.stroke();
      if (!flat) {
        // 冰晶
        ctx.fillStyle = '#7fc4ef';
        ctx.beginPath(); ctx.moveTo(-r * 0.15, -r * 0.85); ctx.lineTo(-r * 0.05, -r * 0.6); ctx.lineTo(-r * 0.25, -r * 0.6); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(r * 0.1, -r * 0.9); ctx.lineTo(r * 0.22, -r * 0.62); ctx.lineTo(r * 0.0, -r * 0.62); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.ellipse(dir * r * 0.35, r * 0.25, r * 0.38, r * 0.28, 0, 0, TAU);
        ctx.fillStyle = '#c7dbe8'; ctx.fill();
        circle(ctx, dir * r * 0.55, r * 0.18, r * 0.1); ctx.fillStyle = '#16121f'; ctx.fill();
        eye(ctx, dir * r * 0.25, -r * 0.2, r * 0.13, dir);
        eye(ctx, dir * r * -0.15, -r * 0.2, r * 0.13, dir);
      }
    }
    ctx.restore();
  }
  function stunStars(ctx, x, y, r) {
    const t = now();
    for (let i = 0; i < 3; i++) {
      const a = t * 3 + i * TAU / 3;
      const sx = x + Math.cos(a) * r * 0.55, sy = y - r * 0.95 + Math.sin(a) * r * 0.16;
      starPath(ctx, sx, sy, r * 0.18, r * 0.08); ctx.fillStyle = '#ffe14d'; ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = P.outline; ctx.stroke();
    }
  }
  function shadow(ctx, x, y, rx, ry, a) {
    ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, TAU);
    ctx.fillStyle = 'rgba(0,0,0,' + (a === undefined ? 0.3 : a) + ')'; ctx.fill();
  }

  // ───────────────────────── 卡圖示 / 口令圖示 ─────────────────────────
  function cardIcon(ctx, key, cx, cy, s) {
    const C = CARDS[key];
    ctx.save();
    ctx.translate(cx, cy);
    const h = s / 2;
    rr(ctx, -h, -h, s, s, s * 0.18);
    if (!C) { ctx.fillStyle = '#3a3346'; ctx.fill(); ctx.strokeStyle = P.textDim; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); return; }
    const arenaCat = C.cat === 'arena';
    ctx.fillStyle = arenaCat ? P.arenaDark : P.call; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = arenaCat ? P.arena : P.callDark; ctx.stroke();
    const k = s / 40;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (key === 'shrink' || key === 'widen' || key === 'cage') {
      ctx.strokeStyle = P.arena; ctx.fillStyle = P.arena; ctx.lineWidth = 3 * k;
      // 兩道柵欄
      const wx = key === 'widen' ? 13 * k : key === 'cage' ? 4 * k : 7 * k;
      ctx.beginPath(); ctx.moveTo(-wx, -12 * k); ctx.lineTo(-wx, 12 * k); ctx.moveTo(wx, -12 * k); ctx.lineTo(wx, 12 * k); ctx.stroke();
      if (key === 'shrink') {
        arrow(ctx, -17 * k, 0, -10 * k, 0, '#ffffff', 2.5 * k, 6 * k); arrow(ctx, 17 * k, 0, 10 * k, 0, '#ffffff', 2.5 * k, 6 * k);
      } else if (key === 'widen') {
        arrow(ctx, -6 * k, 0, -18 * k, 0, '#ffffff', 2.5 * k, 6 * k); arrow(ctx, 6 * k, 0, 18 * k, 0, '#ffffff', 2.5 * k, 6 * k);
      } else {
        arrow(ctx, -17 * k, 0, -7 * k, 0, '#ffffff', 2.5 * k, 6 * k); arrow(ctx, 17 * k, 0, 7 * k, 0, '#ffffff', 2.5 * k, 6 * k);
        ctx.lineWidth = 1.5 * k; ctx.strokeStyle = '#ffffff';
        ctx.beginPath(); ctx.moveTo(-wx, -12 * k); ctx.lineTo(wx, -12 * k); ctx.moveTo(-wx, 12 * k); ctx.lineTo(wx, 12 * k); ctx.stroke();
        text(ctx, '5', 0, -15 * k + 1, 9 * k, '#ffffff', 'center', true);
      }
    } else if (key === 'provoke') {
      ctx.fillStyle = P.ignite; ctx.strokeStyle = '#5a1008'; ctx.lineWidth = 1.5 * k;
      ctx.beginPath(); ctx.moveTo(0, -14 * k);
      ctx.bezierCurveTo(10 * k, -4 * k, 12 * k, 4 * k, 8 * k, 10 * k);
      ctx.quadraticCurveTo(0, 15 * k, -8 * k, 10 * k);
      ctx.bezierCurveTo(-12 * k, 4 * k, -6 * k, -2 * k, -2 * k, -4 * k);
      ctx.quadraticCurveTo(-3 * k, -10 * k, 0, -14 * k);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.ellipse(0, 6 * k, 4 * k, 6 * k, 0, 0, TAU); ctx.fill();
    } else if (key === 'chill') {
      ctx.strokeStyle = P.calm; ctx.lineWidth = 3 * k;
      for (let i = 0; i < 3; i++) {
        const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * -13 * k, Math.sin(a) * -13 * k); ctx.lineTo(Math.cos(a) * 13 * k, Math.sin(a) * 13 * k); ctx.stroke();
      }
      circle(ctx, 0, 0, 3.5 * k); ctx.fillStyle = '#ffffff'; ctx.fill();
    } else if (key === 'encore') {
      starPath(ctx, 0, 0, 13 * k, 6 * k); ctx.fillStyle = P.encore; ctx.fill(); ctx.lineWidth = 1.5 * k; ctx.strokeStyle = '#5a1048'; ctx.stroke();
      ctx.strokeStyle = '#5a1048'; ctx.lineWidth = 2 * k;
      ctx.beginPath(); ctx.arc(0, 0, 16 * k, -0.5, 1.2); ctx.stroke();
    } else if (key === 'warmup') {
      ctx.strokeStyle = '#5a4a2a'; ctx.lineWidth = 3 * k;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-15 * k, i * 8 * k); ctx.lineTo(-3 * k - Math.abs(i) * 3 * k, i * 8 * k); ctx.stroke(); }
      ctx.fillStyle = P.warm; ctx.strokeStyle = '#5a4a2a'; ctx.lineWidth = 1.5 * k;
      ctx.beginPath(); ctx.moveTo(0, -11 * k); ctx.lineTo(14 * k, 0); ctx.lineTo(0, 11 * k); ctx.lineTo(3 * k, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
  function chantIcon(ctx, key, cx, cy, s) {
    ctx.save();
    ctx.translate(cx, cy);
    const k = s / 40, h = s / 2;
    rr(ctx, -h, -h, s, s, s * 0.5 * 0.5);
    ctx.fillStyle = P.chantDark; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = P.chant; ctx.stroke();
    ctx.fillStyle = P.chant; ctx.strokeStyle = P.chant; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (key === 'alarm') {
      ctx.beginPath(); ctx.moveTo(-10 * k, 8 * k); ctx.quadraticCurveTo(-10 * k, -12 * k, 0, -12 * k); ctx.quadraticCurveTo(10 * k, -12 * k, 10 * k, 8 * k); ctx.closePath(); ctx.fill();
      ctx.fillRect(-13 * k, 7 * k, 26 * k, 3 * k);
      circle(ctx, 0, 12 * k, 3 * k); ctx.fill();
      ctx.lineWidth = 2 * k;
      ctx.beginPath(); ctx.arc(0, -2 * k, 16 * k, -2.6, -2.1); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -2 * k, 16 * k, -1.05, -0.55); ctx.stroke();
    } else if (key === 'gong') {
      ctx.lineWidth = 2 * k;
      ctx.beginPath(); ctx.moveTo(-14 * k, -14 * k); ctx.lineTo(14 * k, -14 * k); ctx.stroke();
      circle(ctx, 0, 2 * k, 11 * k); ctx.fill();
      circle(ctx, 0, 2 * k, 5 * k); ctx.fillStyle = P.chantDark; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-6 * k, -14 * k); ctx.lineTo(-4 * k, -8 * k); ctx.moveTo(6 * k, -14 * k); ctx.lineTo(4 * k, -8 * k); ctx.stroke();
    } else if (key === 'brigade') {
      ctx.beginPath(); ctx.moveTo(-11 * k, -8 * k); ctx.lineTo(11 * k, -8 * k); ctx.lineTo(8 * k, 12 * k); ctx.lineTo(-8 * k, 12 * k); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.arc(0, -8 * k, 9 * k, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = P.calm;
      ctx.beginPath(); ctx.ellipse(0, -2 * k, 8 * k, 3 * k, 0, 0, TAU); ctx.fill();
    } else if (key === 'salute') {
      ctx.save(); ctx.rotate(-0.6);
      ctx.fillRect(-12 * k, -5 * k, 22 * k, 10 * k);
      ctx.restore();
      circle(ctx, -6 * k, 9 * k, 6 * k); ctx.fill();
      starPath(ctx, 10 * k, -10 * k, 6 * k, 2.5 * k); ctx.fillStyle = '#ffffff'; ctx.fill();
    } else if (key === 'clear') {
      // 手搖鈴 + 往外的波
      ctx.save(); ctx.rotate(0.35);
      ctx.beginPath(); ctx.moveTo(-8 * k, 4 * k); ctx.quadraticCurveTo(-8 * k, -10 * k, 0, -10 * k); ctx.quadraticCurveTo(8 * k, -10 * k, 8 * k, 4 * k); ctx.closePath(); ctx.fill();
      ctx.fillRect(-2 * k, 4 * k, 4 * k, 10 * k);
      ctx.restore();
      ctx.lineWidth = 2 * k;
      ctx.beginPath(); ctx.moveTo(-15 * k, -6 * k); ctx.lineTo(-15 * k, 6 * k); ctx.moveTo(15 * k, -6 * k); ctx.lineTo(15 * k, 6 * k); ctx.stroke();
      arrow(ctx, -11 * k, 12 * k, -17 * k, 12 * k, P.chant, 1.5 * k, 4 * k);
      arrow(ctx, 11 * k, 12 * k, 17 * k, 12 * k, P.chant, 1.5 * k, 4 * k);
    } else {
      ctx.lineWidth = 2; ctx.setLineDash([4, 3]); circle(ctx, 0, 0, 12 * k); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  }
  function clearIcon(ctx, cx, cy, s) {
    ctx.save(); ctx.translate(cx, cy);
    rr(ctx, -s / 2, -s / 2, s, s, s * 0.18); ctx.fillStyle = '#3a3346'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = P.textDim; ctx.stroke();
    ctx.strokeStyle = '#ff8a8a'; ctx.lineWidth = s * 0.08; ctx.lineCap = 'round';
    const k = s * 0.22;
    ctx.beginPath(); ctx.moveTo(-k, -k); ctx.lineTo(k, k); ctx.moveTo(k, -k); ctx.lineTo(-k, k); ctx.stroke();
    ctx.restore();
  }
  function speciesHead(ctx, species, cx, cy, r) {
    ctx.save();
    circle(ctx, cx, cy, r * 1.35); ctx.fillStyle = 'rgba(13,10,18,0.55)'; ctx.fill();
    speciesBody(ctx, sp(species), cx, cy + r * 0.08, r * 0.9, 1);
    ctx.restore();
  }
  function effectTag(ctx, effect, x, y, size) {
    const E = EFFECTS[effect];
    if (!E) return 0;
    ctx.save();
    size = size || 14;
    ctx.font = font(size, true);
    const w = tw(ctx, E.label) + size;
    rr(ctx, x, y - size * 0.75, w, size * 1.5, size * 0.75);
    ctx.fillStyle = E.c; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = P.outline; ctx.stroke();
    text(ctx, E.label, x + w / 2, y + 1, size, '#ffffff', 'center', true, 3);
    let tot = w;
    if (E.sub) {
      text(ctx, E.sub, x + w + 6, y + 1, size * 0.8, '#ffe14d', 'left', true, 3);
      tot += 6 + tw(ctx, E.sub);
    }
    ctx.restore();
    return tot;
  }

  // ───────────────────────── 背景 / 地下城 ─────────────────────────
  function drawBackground(ctx) {
    ctx.save();
    ctx.fillStyle = P.bg; ctx.fillRect(0, 0, 1280, 720);
    const g = ctx.createRadialGradient(640, 380, 120, 640, 380, 820);
    g.addColorStop(0, 'rgba(70,56,100,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
    ctx.restore();
  }

  function hash(x, y) { const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); }

  function drawTile(ctx, state) {
    const s = obj(state);
    const x = n(s.x), y = n(s.y);
    const D = DUNGEONS[pick(s.dungeon, DUNGEONS, 'candy')];
    const kind = pick(s.kind, { wall: 1, pillar: 1, floor: 1, hurt: 1, slow: 1, bush: 1 }, 'floor');
    const L = x - 30, T = y - 30;
    const hv = hash(Math.round(x), Math.round(y));
    ctx.save();
    // 地板底
    ctx.fillStyle = hv > 0.5 ? D.floor : D.floor2; ctx.fillRect(L, T, 60, 60);
    if (kind === 'floor' || kind === 'bush' || kind === 'pillar') {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      circle(ctx, L + 12 + hv * 30, T + 15 + hv * 20, 3); ctx.fill();
      circle(ctx, L + 40 - hv * 20, T + 44, 2); ctx.fill();
    }
    if (kind === 'wall') {
      ctx.fillStyle = D.wall; ctx.fillRect(L, T, 60, 60);
      // 樹冠團
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      circle(ctx, x - 11, y - 10, 17); ctx.fill(); circle(ctx, x + 12, y + 6, 17); ctx.fill();
      ctx.fillStyle = D.wall2;
      circle(ctx, x - 14 + hv * 6, y - 14, 4); ctx.fill(); circle(ctx, x + 12, y + 10 - hv * 8, 3.5); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2; ctx.strokeRect(L + 1, T + 1, 58, 58);
    } else if (kind === 'pillar') {
      ctx.beginPath();
      ctx.moveTo(L + 8, y + 18); ctx.lineTo(L + 4, y - 4); ctx.lineTo(L + 18, T + 6); ctx.lineTo(L + 42, T + 4); ctx.lineTo(L + 56, y - 2); ctx.lineTo(L + 52, y + 22); ctx.closePath();
      ctx.fillStyle = D.rock; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(L + 18, T + 10); ctx.lineTo(L + 40, T + 8); ctx.lineTo(L + 30, y - 4); ctx.closePath(); ctx.fill();
    } else if (kind === 'hurt') {
      ctx.fillStyle = D.hurt; ctx.fillRect(L, T, 60, 60);
      ctx.strokeStyle = D.hurt2; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(L + 8, T + 14); ctx.lineTo(x - 4, y - 2); ctx.lineTo(x + 6, y + 4); ctx.lineTo(L + 52, T + 50);
      ctx.moveTo(x - 4, y - 2); ctx.lineTo(x - 2, T + 52); ctx.moveTo(x + 6, y + 4); ctx.lineTo(L + 50, T + 10); ctx.stroke();
      // 危險共通記號: 紅色虛線框
      ctx.setLineDash([7, 5]); ctx.strokeStyle = P.danger; ctx.lineWidth = 3;
      ctx.strokeRect(L + 2.5, T + 2.5, 55, 55); ctx.setLineDash([]);
    } else if (kind === 'slow') {
      ctx.fillStyle = D.slow; ctx.fillRect(L, T, 60, 60);
      ctx.strokeStyle = D.slow2; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x - 8, y - 6, 14, 6, 0, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x + 10, y + 12, 10, 4, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; circle(ctx, x - 14, y - 9, 2.5); ctx.fill();
    } else if (kind === 'bush') {
      // 草叢: 葉叢鋪滿格, 邊緣葉尖, 讀成「能鑽進去」
      ctx.fillStyle = D.bush2; ctx.fillRect(L, T, 60, 60);
      for (let i = 0; i < 9; i++) {
        const bx = L + 10 + (i % 3) * 20, by = T + 10 + Math.floor(i / 3) * 20;
        ctx.fillStyle = D.bush;
        ctx.beginPath(); ctx.moveTo(bx - 9, by + 8); ctx.lineTo(bx - 5, by - 9); ctx.lineTo(bx, by + 2); ctx.lineTo(bx + 4, by - 10); ctx.lineTo(bx + 9, by + 8); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(200,255,190,0.35)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(L + 1, T + 1, 58, 58);
    }
    if (s.nest === true) {
      ctx.strokeStyle = '#a07a50'; ctx.lineWidth = 4;
      circle(ctx, x, y + 4, 20); ctx.stroke();
      ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const a = i * 1.05; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 15, y + 4 + Math.sin(a) * 15); ctx.lineTo(x + Math.cos(a + 0.6) * 24, y + 4 + Math.sin(a + 0.6) * 24); ctx.stroke(); }
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; circle(ctx, x, y + 4, 14); ctx.fill();
    }
    ctx.restore();
  }

  function fruitShape(ctx, x, y, r) {
    circle(ctx, x, y, r); ctx.fillStyle = P.fruit; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.18); ctx.strokeStyle = '#5a1040'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; circle(ctx, x - r * 0.35, y - r * 0.35, r * 0.25); ctx.fill();
    ctx.fillStyle = '#5ad06a';
    ctx.beginPath(); ctx.ellipse(x + r * 0.35, y - r * 1.0, r * 0.45, r * 0.22, -0.5, 0, TAU); ctx.fill();
  }

  function drawFruitTree(ctx, state) {
    const s = obj(state);
    const x = n(s.x), y = n(s.y);
    const D = DUNGEONS[pick(s.dungeon, DUNGEONS, 'candy')];
    ctx.save();
    shadow(ctx, x, y + 22, 24, 6, 0.3);
    ctx.fillStyle = '#6a4024'; ctx.fillRect(x - 5, y + 4, 10, 22);
    ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.strokeRect(x - 5, y + 4, 10, 22);
    // 樹冠(比密林亮、圓, 一眼分開「牆」與「能打的樹」)
    ctx.fillStyle = P.tree;
    circle(ctx, x - 12, y - 4, 14); ctx.fill(); circle(ctx, x + 12, y - 4, 14); ctx.fill(); circle(ctx, x, y - 13, 15); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = P.outline;
    ctx.beginPath(); ctx.arc(x - 12, y - 4, 14, 1.6, 4.3); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 12, y - 4, 14, -1.2, 1.55); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y - 13, 15, 3.6, 5.85); ctx.stroke();
    ctx.fillStyle = D.wall2; ctx.globalAlpha = 0.5;
    circle(ctx, x - 16, y - 12, 3); ctx.fill(); circle(ctx, x + 14, y - 2, 3); ctx.fill();
    ctx.globalAlpha = 1;
    if (s.hasFruit === true) {
      // 光圈 + 大果: 「打得落」
      ctx.strokeStyle = 'rgba(255,240,200,0.9)'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]);
      circle(ctx, x, y - 6, 14); ctx.stroke(); ctx.setLineDash([]);
      fruitShape(ctx, x, y - 4, 9);
    } else {
      // 只剩小綠芽
      ctx.fillStyle = '#9ae07a'; circle(ctx, x, y - 6, 3.5); ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = '#2f6a2a'; ctx.stroke();
    }
    ctx.restore();
  }

  function drawFruit(ctx, state) {
    const s = obj(state);
    const x = n(s.x), y = n(s.y);
    const eating = s.eating === true;
    const p = eating ? ratio(s.eatT, n(s.eatDur, 3) || 3) : 0;
    ctx.save();
    shadow(ctx, x, y + 11, 11, 3, 0.35);
    const r = 11 * (1 - p * 0.7);
    fruitShape(ctx, x, y + 1, Math.max(2, r));
    if (eating) {
      // 咬痕
      ctx.fillStyle = DUNGEONS[pick(s.dungeon, DUNGEONS, 'candy')].floor;
      circle(ctx, x + r * 0.9, y + 1 - r * 0.2, r * 0.45); ctx.fill();
      circle(ctx, x + r * 0.7, y + 1 + r * 0.45, r * 0.35); ctx.fill();
      // 剩餘量環
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 14, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - p)); ctx.stroke();
    }
    ctx.restore();
  }

  // 面向 0~7 → 角度(0 朝右, 順時針)
  function facingAngle(f) { f = Math.round(n(f, 0)) % 8; if (f < 0) f += 8; return (f - 2) * Math.PI / 4; }

  function weaponShape(ctx, weapon, len) {
    // 沿 +x 方向畫, 從 0 到 len
    ctx.lineCap = 'round';
    if (weapon === 'sword') {
      ctx.fillStyle = '#dfe6f0'; ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(4, -3); ctx.lineTo(len - 4, -3); ctx.lineTo(len, 0); ctx.lineTo(len - 4, 3); ctx.lineTo(4, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c99a3a'; ctx.fillRect(2, -6, 3, 12);
    } else if (weapon === 'spear') {
      ctx.strokeStyle = '#7a5030'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len - 6, 0); ctx.stroke();
      ctx.fillStyle = '#dfe6f0';
      ctx.beginPath(); ctx.moveTo(len - 8, -4); ctx.lineTo(len, 0); ctx.lineTo(len - 8, 4); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = P.outline; ctx.stroke();
    } else if (weapon === 'whip') {
      ctx.strokeStyle = '#7a4a24'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -8, len * 0.7, 0); ctx.quadraticCurveTo(len * 0.85, 6, len, 2); ctx.stroke();
    } else { // club
      ctx.strokeStyle = P.outline; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(len - 3, 0); ctx.stroke();
      ctx.strokeStyle = '#a0683a'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(len - 3, 0); ctx.stroke();
      ctx.fillStyle = '#a0683a'; circle(ctx, len - 4, 0, 5); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = P.outline; ctx.stroke();
    }
  }

  function drawTamer(ctx, state) {
    const s = obj(state);
    const x = n(s.x), y = n(s.y);
    const a = facingAngle(s.facing);
    const weapon = pick(s.weapon, WEAPONS, 'club');
    const t = now();
    ctx.save();
    let alpha = 1;
    if (s.blink === true) alpha = (Math.floor(t * 12) % 2) ? 0.25 : 0.9;
    if (s.hidden === true) alpha = Math.min(alpha, 0.5);
    // 黏液(減速): 腳下紫色黏灘
    if (s.slowed === true) {
      ctx.fillStyle = 'rgba(196,108,255,0.55)';
      ctx.beginPath(); ctx.ellipse(x, y + 10, 26, 12, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = P.special; ctx.lineWidth = 2; ctx.stroke();
    }
    shadow(ctx, x, y + 15, 16, 5, 0.35);
    if (s.dashing === true) {
      // 突進: 身後殘影 + 白色外光(無敵)
      for (let i = 1; i <= 2; i++) {
        ctx.globalAlpha = 0.25 / i;
        circle(ctx, x - Math.cos(a) * 6 * i, y - Math.sin(a) * 6 * i, 18); ctx.fillStyle = '#bcd0ff'; ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = alpha;
    // 武器(朝面向伸出, 收在 32 內)
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.translate(10, 9);
    weaponShape(ctx, weapon, weapon === 'spear' ? 20 : 19);
    ctx.restore();
    // 身體(判定圓 r18 = 外框)
    circle(ctx, x, y, 18); ctx.fillStyle = P.tamer; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = s.dashing === true ? '#ffffff' : P.outline; ctx.stroke();
    // 帽子(朝面向偏一點, 帽簷指向前方)
    const hx = x + Math.cos(a) * 3, hy = y + Math.sin(a) * 3;
    circle(ctx, hx, hy, 12); ctx.fillStyle = P.tamerHat; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#6a5030'; ctx.stroke();
    circle(ctx, hx, hy, 6); ctx.fillStyle = '#c9a060'; ctx.fill();
    // 面向箭頭(帽簷前方的小三角)
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = P.tamerHat; ctx.strokeStyle = '#6a5030'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(14, -6); ctx.lineTo(22, 0); ctx.lineTo(14, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (s.lassoing === true) {
      ctx.strokeStyle = P.rope; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(x - Math.cos(a) * 10, y - Math.sin(a) * 10 + 4, 7, 4, 0, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (s.hidden === true) {
      // 躲藏: 草葉蓋在身上, 但白虛線圈保住位置
      ctx.fillStyle = 'rgba(79,174,90,0.85)';
      for (let i = 0; i < 5; i++) {
        const bx = x - 16 + i * 8, by = y + 12;
        ctx.beginPath(); ctx.moveTo(bx - 4, by + 4); ctx.lineTo(bx, by - 14 - (i % 2) * 5); ctx.lineTo(bx + 4, by + 4); ctx.closePath(); ctx.fill();
      }
      ctx.setLineDash([5, 4]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      circle(ctx, x, y, 18); ctx.stroke(); ctx.setLineDash([]);
    }
    if (s.slowed === true) {
      ctx.fillStyle = P.special;
      for (let i = 0; i < 3; i++) {
        const dx = -10 + i * 10, dl = 4 + ((t * 6 + i) % 3) * 2;
        ctx.beginPath(); ctx.ellipse(x + dx, y + 18 + dl / 2, 2.5, dl / 2 + 1, 0, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawWildMonster(ctx, state) {
    const s = obj(state);
    const species = sp(s.species);
    const x = n(s.x), y = n(s.y);
    const big = species === 'bear';
    const half = big ? 45 : 36;
    const r = big ? 34 : 27;
    const dir = n(s.dir, 1) < 0 ? -1 : 1;
    const move = pick(s.move, { walk: 1, hop: 1, dash: 1, eat: 1 }, 'walk');
    const mp = ratio(s.moveT, s.moveDur);
    const t = now();
    ctx.save();
    let lift = 0, bob = 0;
    if (move === 'hop') lift = Math.sin(mp * Math.PI) * 3;
    else if (move === 'walk' && !(s.lassoed === true || n(s.stunLeft) > 0)) bob = Math.sin(t * 8 + x * 0.05) * 1.2;
    shadow(ctx, x, y + r * 0.95, r * 0.8 * (1 - lift / 20), r * 0.18, 0.32);
    if (move === 'dash') {
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x - dir * (r + 8), y + i * 12); ctx.lineTo(x - dir * (half - 1), y + i * 12); ctx.stroke(); }
    }
    // 殘血: 可捕捉的綠色虛線圈(捕捉字典色)
    if (s.weak === true) {
      ctx.setLineDash([6, 4]); ctx.lineDashOffset = -t * 20;
      ctx.strokeStyle = P.capture; ctx.lineWidth = 3;
      circle(ctx, x, y, half - 2); ctx.stroke(); ctx.setLineDash([]);
    }
    // 施法預備: 紅色脈動外圈(危險)
    if (s.casting === true) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 20);
      ctx.strokeStyle = 'rgba(255,59,59,' + (0.55 + 0.45 * pulse) + ')'; ctx.lineWidth = 4;
      circle(ctx, x, y - lift + bob, r * 1.08); ctx.stroke();
    }
    const by = y - lift + bob;
    if (move === 'dash') { ctx.save(); ctx.translate(x, by); ctx.rotate(dir * 0.15); speciesBody(ctx, species, 0, 0, r, dir); ctx.restore(); }
    else speciesBody(ctx, species, x, by, r, dir);
    if (s.hit === true) { ctx.globalAlpha = 0.75; speciesBody(ctx, species, x, by, r, dir, { flat: '#ffffff' }); ctx.globalAlpha = 1; }
    if (move === 'eat') {
      // 嘴邊碎屑
      ctx.fillStyle = P.fruit;
      for (let i = 0; i < 3; i++) { circle(ctx, x + dir * (r * 0.8 + i * 4), by + r * 0.3 + Math.sin(t * 10 + i) * 3, 2); ctx.fill(); }
    }
    if (s.weak === true) {
      // 汗滴(框內)
      const dx = x - dir * r * 0.75, dy = by - r * 0.55;
      ctx.fillStyle = '#bfe6ff'; ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(dx, dy - 7); ctx.quadraticCurveTo(dx + 5, dy, dx, dy + 4); ctx.quadraticCurveTo(dx - 5, dy, dx, dy - 7); ctx.fill(); ctx.stroke();
    }
    if (s.lassoed === true || n(s.stunLeft) > 0) stunStars(ctx, x, y, r);
    // 血條(框外頭上)
    const hy = y - (big ? 55 : 46);
    const hp = ratio(s.hp, s.maxHp);
    ctx.fillStyle = P.outline; ctx.fillRect(x - 28, hy - 3, 56, 6);
    ctx.fillStyle = s.weak === true ? P.capture : '#eeeeee';
    ctx.fillRect(x - 27, hy - 2, 54 * hp, 4);
    ctx.fillStyle = P.capture; ctx.fillRect(x - 27 + 54 * 0.3 - 0.5, hy - 3, 1.5, 6);
    ctx.restore();
  }

  function drawCaptureRing(ctx, state) {
    const s = obj(state);
    const x = n(s.x), y = n(s.y);
    const p = ratio(s.t, s.dur);
    ctx.save();
    ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(13,10,18,0.75)';
    circle(ctx, x, y, 44); ctx.stroke();
    ctx.lineWidth = 6; ctx.strokeStyle = P.capture; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, 44, -Math.PI / 2, -Math.PI / 2 + TAU * p); ctx.stroke();
    text(ctx, '準備捕捉', x, y - 46, 14, P.capture, 'center', true, 4);
    ctx.restore();
  }

  function drawLasso(ctx, state) {
    const s = obj(state);
    const x1 = n(s.x1), y1 = n(s.y1), x2 = n(s.x2), y2 = n(s.y2);
    const tight = ratio(s.len, n(s.maxLen, 220) || 220);
    const left = 1 - ratio(s.t, s.limit);
    const prog = c01(s.progress);
    ctx.save();
    // 繩: 鬆時下垂, 越接近最大長度越直且轉紅
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + (1 - tight) * 26;
    const strain = tight > 0.8 ? (tight - 0.8) / 0.2 : 0;
    ctx.lineCap = 'round';
    ctx.strokeStyle = P.outline; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke();
    ctx.strokeStyle = strain > 0 ? 'rgb(255,' + Math.round(227 - 160 * strain) + ',' + Math.round(192 - 150 * strain) + ')' : P.rope;
    ctx.lineWidth = 3.5; ctx.stroke();
    ctx.setLineDash([4, 5]); ctx.strokeStyle = P.ropeDark; ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
    // 繞圈進度環(魔物周圍, 捕捉字典色)
    ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(13,10,18,0.7)';
    circle(ctx, x2, y2, 50); ctx.stroke();
    ctx.lineWidth = 7; ctx.strokeStyle = P.capture;
    ctx.beginPath(); ctx.arc(x2, y2, 50, -Math.PI / 2, -Math.PI / 2 + TAU * prog); ctx.stroke();
    // 時限: 外側細環, 剩餘越少越紅
    ctx.lineWidth = 3;
    ctx.strokeStyle = left < 0.3 ? P.danger : 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(x2, y2, 57, -Math.PI / 2, -Math.PI / 2 + TAU * left); ctx.stroke();
    // 套在魔物身上的圈
    ctx.strokeStyle = P.rope; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x2, y2 + 8, 22, 8, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  // ───────────────────────── 技能 / 攻擊特效 ─────────────────────────
  const HAZ_COLOR = { sting: P.bee, bubble: P.slug, ember: P.shrimp, spine: P.urchin, arc: '#bfe8ff', hail: '#cfeaff', boom: '#ff7a33' };

  function drawHazard(ctx, state) {
    const s = obj(state);
    const kind = pick(s.kind, HAZ_COLOR, 'sting');
    const phase = pick(s.phase, { warn: 1, active: 1, fly: 1 }, kind === 'boom' ? 'active' : (kind === 'hail' || kind === 'arc') ? 'warn' : 'fly');
    const x = n(s.x), y = n(s.y);
    const p = ratio(s.t, s.dur);
    const a = n(s.angle);
    const t = now();
    const refl = s.reflected === true;
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (kind === 'sting' || kind === 'bubble' || kind === 'ember' || kind === 'spine') {
      const R = Math.max(2, n(s.radius, { sting: 8, bubble: 22, ember: 14, spine: 10 }[kind]));
      const col = HAZ_COLOR[kind];
      // 判定圓 = 畫面邊界: 深色襯底圈
      circle(ctx, x, y, R); ctx.fillStyle = refl ? 'rgba(255,255,255,0.35)' : 'rgba(13,10,18,0.55)'; ctx.fill();
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      if (kind === 'sting') {
        ctx.fillStyle = col; ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(R, 0); ctx.lineTo(-R * 0.8, -R * 0.45); ctx.lineTo(-R * 0.6, 0); ctx.lineTo(-R * 0.8, R * 0.45); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#2a1e10'; ctx.beginPath(); ctx.moveTo(R, 0); ctx.lineTo(R * 0.4, -R * 0.2); ctx.lineTo(R * 0.4, R * 0.2); ctx.closePath(); ctx.fill();
      } else if (kind === 'bubble') {
        circle(ctx, 0, 0, R * 0.92); ctx.fillStyle = 'rgba(111,224,176,0.45)'; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = '#d8fff0'; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; circle(ctx, -R * 0.35, -R * 0.35, R * 0.2); ctx.fill();
      } else if (kind === 'ember') {
        ctx.fillStyle = 'rgba(255,122,51,0.45)';
        ctx.beginPath(); ctx.moveTo(-R * 0.2, -R * 0.7); ctx.lineTo(-R * 1.0, 0); ctx.lineTo(-R * 0.2, R * 0.7); ctx.closePath(); ctx.fill();
        circle(ctx, 0, 0, R * 0.85); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
        circle(ctx, R * 0.1, 0, R * 0.42); ctx.fillStyle = '#ffe14d'; ctx.fill();
      } else {
        ctx.fillStyle = col; ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(R, 0); ctx.lineTo(-R * 0.7, -R * 0.4); ctx.lineTo(-R * 0.9, 0); ctx.lineTo(-R * 0.7, R * 0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e0b8ff'; circle(ctx, -R * 0.5, 0, R * 0.22); ctx.fill();
      }
      ctx.restore();
      if (refl) {
        // 被打回: 白色雙環(玩家放出去的長相)
        ctx.lineWidth = 2.5; ctx.strokeStyle = P.reflect; circle(ctx, x, y, R - 1.25); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.strokeStyle = P.rope; circle(ctx, x, y, Math.max(1, R - 4)); ctx.stroke();
      } else {
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(13,10,18,0.9)'; circle(ctx, x, y, R - 0.75); ctx.stroke();
      }
    } else if (kind === 'hail') {
      const R = Math.max(4, n(s.radius, 55));
      if (phase === 'warn') {
        // 字典: 虛線框 + 由內長大的填色, 填滿 = 落下
        circle(ctx, x, y, R * p); ctx.fillStyle = 'rgba(160,215,255,0.35)'; ctx.fill();
        ctx.setLineDash([8, 6]);
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(13,10,18,0.8)'; circle(ctx, x, y, R - 2); ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = '#dff2ff'; ctx.stroke();
        ctx.setLineDash([]);
      } else {
        circle(ctx, x, y, R - 1.5); ctx.fillStyle = 'rgba(200,235,255,' + (0.75 * (1 - p * 0.6)) + ')'; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#5f7f99'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
          const ang = i * 1.1 + 0.4, d = R * (0.2 + (i % 3) * 0.22);
          const cx = x + Math.cos(ang) * d, cy = y + Math.sin(ang) * d;
          ctx.beginPath(); ctx.moveTo(cx, cy - 7); ctx.lineTo(cx + 6, cy); ctx.lineTo(cx, cy + 7); ctx.lineTo(cx - 6, cy); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      }
    } else if (kind === 'arc') {
      if (phase === 'warn') {
        const tx = n(s.tx), ty = n(s.ty);
        const on = (Math.floor(t * 16) % 2) === 0;
        ctx.setLineDash([10, 6]); ctx.lineDashOffset = -t * 60;
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(13,10,18,0.7)';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = on ? '#ffe14d' : '#bfe8ff'; ctx.stroke();
        ctx.setLineDash([]);
        // 鎖定點(地下城: 離此點 40 內才中)
        ctx.lineWidth = 2; ctx.strokeStyle = P.danger;
        circle(ctx, tx, ty, 40 * (1 - p * 0.15) + 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx - 8, ty); ctx.lineTo(tx + 8, ty); ctx.moveTo(tx, ty - 8); ctx.lineTo(tx, ty + 8); ctx.stroke();
      } else {
        const pts = Array.isArray(s.points) ? s.points.filter(q => q && isFinite(Number(q.x)) && isFinite(Number(q.y))) : [];
        if (pts.length >= 2) {
          const fade = 1 - p * 0.6;
          const zig = [];
          for (let i = 0; i < pts.length - 1; i++) {
            const ax = Number(pts[i].x), ay = Number(pts[i].y), bx = Number(pts[i + 1].x), by = Number(pts[i + 1].y);
            const segs = 6, nx = -(by - ay), ny = bx - ax, L = Math.hypot(nx, ny) || 1;
            for (let k = 0; k <= segs; k++) {
              const f = k / segs, off = (k === 0 || k === segs) ? 0 : (hash(i * 7 + k, Math.floor(t * 30)) - 0.5) * 22;
              zig.push([ax + (bx - ax) * f + nx / L * off, ay + (by - ay) * f + ny / L * off]);
            }
          }
          ctx.globalAlpha = fade;
          ctx.beginPath(); zig.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
          ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(80,140,255,0.45)'; ctx.stroke();
          ctx.lineWidth = 4; ctx.strokeStyle = '#ffe14d'; ctx.stroke();
          ctx.lineWidth = 1.5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
          for (let i = 1; i < pts.length; i++) {
            circle(ctx, Number(pts[i].x), Number(pts[i].y), 10); ctx.lineWidth = 2.5; ctx.strokeStyle = '#ffe14d'; ctx.stroke();
          }
        }
      }
    } else { // boom
      const R = Math.max(4, n(s.radius, 110));
      const rr2 = R * (0.55 + 0.45 * p);
      circle(ctx, x, y, rr2); ctx.fillStyle = 'rgba(255,90,40,' + (0.45 * (1 - p)) + ')'; ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,170,60,' + (1 - p * 0.7) + ')'; ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,' + (1 - p) + ')'; circle(ctx, x, y, rr2 - 4); ctx.stroke();
      // 外緣(判定範圍)淡虛線
      ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,122,51,0.7)'; circle(ctx, x, y, R - 1); ctx.stroke(); ctx.setLineDash([]);
      starPath(ctx, x, y, 26 * (1 - p * 0.5), 12 * (1 - p * 0.5), 8); ctx.fillStyle = 'rgba(255,225,77,' + (1 - p) + ')'; ctx.fill();
    }
    ctx.restore();
  }

  function drawWeaponFx(ctx, state) {
    const s = obj(state);
    const x = n(s.x), y = n(s.y);
    const shape = pick(s.shape, { arc: 1, circle: 1, line: 1, dash: 1 }, 'arc');
    const skill = s.move === 'skill';
    const p = ratio(s.t, s.dur);
    const a = n(s.angle);
    const col = skill ? P.fxSkill : P.fxNormal;
    const fade = 1 - p;
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (shape === 'arc') {
      const R = Math.max(1, n(s.radius, 70)), sp2 = n(s.spread, Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, R, a - sp2 / 2, a + sp2 / 2); ctx.closePath();
      ctx.fillStyle = skill ? 'rgba(255,242,168,' + 0.35 * fade + ')' : 'rgba(255,255,255,' + 0.28 * fade + ')'; ctx.fill();
      // 掃過的前緣
      const sweep = a - sp2 / 2 + sp2 * Math.min(1, p * 1.6);
      ctx.beginPath(); ctx.arc(x, y, R - 2, a - sp2 / 2, sweep);
      ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.globalAlpha = fade; ctx.stroke();
      if (skill && s.weapon === 'sword') {
        for (let i = 0; i < 3; i++) {
          const aa = a - sp2 / 3 + i * sp2 / 3;
          starPath(ctx, x + Math.cos(aa) * R * 0.7, y + Math.sin(aa) * R * 0.7, 7, 3); ctx.fillStyle = '#ffe14d'; ctx.fill();
        }
      }
    } else if (shape === 'circle') {
      const R = Math.max(1, n(s.radius, 100));
      circle(ctx, x, y, R); ctx.fillStyle = 'rgba(255,255,255,' + 0.2 * fade + ')'; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, R - 2, 0, TAU * Math.min(1, p * 1.6));
      ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.globalAlpha = fade; ctx.stroke();
    } else if (shape === 'line') {
      const L = Math.max(1, n(s.length, 170)), Wd = Math.max(1, n(s.width, 40));
      ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = 'rgba(255,255,255,' + 0.28 * fade + ')'; ctx.fillRect(0, -Wd / 2, L, Wd);
      ctx.globalAlpha = fade;
      ctx.strokeStyle = col; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L * Math.min(1, 0.4 + p * 1.5), 0); ctx.stroke();
      ctx.strokeRect(1, -Wd / 2 + 1, L - 2, Wd - 2);
    } else { // dash
      const L = Math.max(1, n(s.length, 220));
      ctx.translate(x, y); ctx.rotate(a);
      const g = ctx.createLinearGradient(0, 0, L, 0);
      g.addColorStop(0, 'rgba(188,208,255,0)'); g.addColorStop(1, 'rgba(255,255,255,' + 0.6 * fade + ')');
      ctx.fillStyle = g; ctx.fillRect(0, -18, L, 36);
      ctx.strokeStyle = 'rgba(255,255,255,' + fade + ')'; ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(L * 0.2, i * 12); ctx.lineTo(L * 0.95, i * 12); ctx.stroke(); }
    }
    ctx.restore();
  }

  // ───────────────────────── 地下城選擇 / 布置 ─────────────────────────
  function drawDungeonCard(ctx, state) {
    const s = obj(state);
    const x = n(s.x), y = n(s.y);
    const key = pick(s.dungeon, DUNGEONS, 'candy');
    const D = DUNGEONS[key];
    const open = s.open === true;
    const L = x - 180, T = y - 220;
    ctx.save();
    panelBox(ctx, L, T, 360, 440, open ? P.panel2 : '#211c2c', open ? P.panelLine : '#3a3348', 16);
    // 標頭色帶
    ctx.save(); rr(ctx, L, T, 360, 90, 16); ctx.clip();
    ctx.fillStyle = open ? D.head : '#3a3348'; ctx.fillRect(L, T, 360, 90);
    ctx.restore();
    text(ctx, D.name, x, T + 46, 34, open ? '#ffffff' : P.textDim, 'center', true, open ? 5 : 0);
    // 地景小圖
    ctx.save(); rr(ctx, L + 20, T + 105, 320, 150, 10); ctx.clip();
    ctx.fillStyle = D.floor; ctx.fillRect(L + 20, T + 105, 320, 150);
    ctx.fillStyle = D.wall; ctx.fillRect(L + 20, T + 105, 320, 26);
    ctx.fillStyle = D.bush; for (let i = 0; i < 4; i++) { ctx.fillRect(L + 40 + i * 14, T + 220, 10, 22); }
    if (!open) ctx.globalAlpha = 0.45;
    speciesBody(ctx, D.mons[0], x - 70, y - 30, 32, 1);
    speciesBody(ctx, D.mons[1], x + 70, y - 30, key === 'plateau' ? 34 : 30, -1);
    ctx.restore();
    // 住的魔物名
    text(ctx, SPECIES[D.mons[0]].name + '、' + SPECIES[D.mons[1]].name, x, T + 285, 20, open ? P.text : P.textDim, 'center', true);
    if (open) {
      rr(ctx, x - 70, T + 330, 140, 44, 22); ctx.fillStyle = 'rgba(140,240,106,0.18)'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = P.capture; ctx.stroke();
      text(ctx, '已開放', x, T + 352, 22, P.capture, 'center', true);
    } else {
      // 鎖頭 + 條件
      ctx.fillStyle = P.textDim; ctx.strokeStyle = P.textDim; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, T + 322, 10, Math.PI, 0); ctx.stroke();
      rr(ctx, x - 15, T + 322, 30, 22, 4); ctx.fill();
      const lines = wrap(ctx, str(s.condition), 320, 18, true).slice(0, 3);
      lines.forEach((ln, i) => text(ctx, ln, x, T + 372 + i * 24, 18, '#ffd9a0', 'center', true));
    }
    if (s.selected === true) selFrame(ctx, L, T, 360, 440, 16);
    ctx.restore();
  }

  function drawSpeciesCard(ctx, state) {
    const s = obj(state);
    const x = n(s.x), y = n(s.y);
    const species = sp(s.species);
    const S = SPECIES[species];
    const L = x - 90, T = y - 125;
    const effect = pick(s.effect, EFFECTS, S.eff);
    const owned = Math.max(0, Math.round(n(s.owned))), on = Math.max(0, Math.round(n(s.onStage)));
    ctx.save();
    panelBox(ctx, L, T, 180, 250, P.panel2, P.panelLine, 12);
    // 頭像區
    rr(ctx, L + 12, T + 12, 156, 96, 8); ctx.fillStyle = 'rgba(13,10,18,0.45)'; ctx.fill();
    speciesBody(ctx, species, x, T + 62, species === 'bear' ? 32 : 30, 1);
    text(ctx, 'Lv ' + Math.max(0, Math.round(n(s.level))), L + 140, T + 24, 14, '#ffe9a0', 'center', true, 3);
    fitText(ctx, S.name, x, T + 126, 160, 20, P.text, 'center', true);
    // 效果標籤
    ctx.font = font(14, true);
    const tagW = tw(ctx, EFFECTS[effect].label) + 14 + (EFFECTS[effect].sub ? 6 + tw(ctx, EFFECTS[effect].sub) * 0.8 : 0);
    effectTag(ctx, effect, x - tagW / 2, T + 154, 14);
    text(ctx, '擁有 ' + owned, x, T + 186, 16, P.textDim, 'center', true);
    // 上場數 + 點點
    text(ctx, '上場 ' + on, x, T + 210, 18, on > 0 ? P.text : P.textDim, 'center', true);
    const pips = Math.min(owned, 10);
    for (let i = 0; i < pips; i++) {
      const px = x - (pips - 1) * 7 + i * 14;
      circle(ctx, px, T + 233, 4.5); ctx.fillStyle = i < on ? P.capture : '#3a3346'; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = P.outline; ctx.stroke();
    }
    if (s.selected === true) selFrame(ctx, L, T, 180, 250, 12);
    ctx.restore();
  }

  function drawSpeciesInfo(ctx, state) {
    const s = obj(state);
    const x = n(s.x, 500), y = n(s.y, 490);
    const L = x - 400, T = y - 90;
    const species = sp(s.species);
    ctx.save();
    panelBox(ctx, L, T, 800, 180, P.panel, P.panelLine, 12);
    speciesHead(ctx, species, L + 46, T + 44, 22);
    text(ctx, SPECIES[species].name, L + 84, T + 30, 22, P.text, 'left', true);
    const dl = wrap(ctx, str(s.desc), 470, 17).slice(0, 2);
    dl.forEach((ln, i) => text(ctx, ln, L + 84, T + 60 + i * 22, 17, P.textDim, 'left'));
    // 上場總數
    const total = Math.round(n(s.total)), max = Math.round(n(s.totalMax, 20));
    rr(ctx, L + 590, T + 16, 194, 54, 10); ctx.fillStyle = 'rgba(13,10,18,0.5)'; ctx.fill();
    text(ctx, '上場 ' + total + ' / ' + max, L + 687, T + 43, 22, total >= max ? '#ffb347' : P.text, 'center', true);
    // 升級面板
    ctx.strokeStyle = P.panelLine; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(L + 20, T + 100); ctx.lineTo(L + 780, T + 100); ctx.stroke();
    const lines = Array.isArray(s.lines) ? s.lines.slice(0, 3) : [];
    lines.forEach((ln, i) => text(ctx, str(ln), L + 24, T + 118 + i * 24, i === 0 ? 18 : 16, i === 0 ? '#ffe9a0' : P.text, 'left', i === 0));
    ctx.restore();
  }

  function drawTimelineSlot(ctx, state) {
    const s = obj(state);
    const x = n(s.x), y = n(s.y);
    const mini = s.style === 'mini';
    const card = pick(s.card, CARDS, '');
    const C = CARDS[card];
    const slot = Math.max(0, Math.round(n(s.slot)));
    const target = SPECIES[s.target] ? s.target : '';
    const invalid = s.invalid === true;
    ctx.save();
    if (!mini) {
      const L = x - 300, T = y - 26;
      panelBox(ctx, L, T, 600, 52, C ? P.panel2 : P.panel, P.panelLine, 8);
      text(ctx, (slot * 5) + '~' + (slot * 5 + 5) + ' 秒', L + 16, y, 17, P.textDim, 'left', true);
      if (C) {
        cardIcon(ctx, card, L + 150, y, 38);
        text(ctx, C.name, L + 180, y, 21, P.text, 'left', true);
        if (C.cat === 'arena') {
          rr(ctx, L + 300, y - 14, 64, 28, 14); ctx.fillStyle = P.arenaDark; ctx.fill();
          ctx.lineWidth = 1.5; ctx.strokeStyle = P.arena; ctx.stroke();
          text(ctx, '擂台', L + 332, y + 1, 16, P.arena, 'center', true);
        } else if (target) {
          speciesHead(ctx, target, L + 318, y, 13);
          text(ctx, SPECIES[target].name, L + 340, y, 19, P.text, 'left', true);
        } else {
          text(ctx, '—', L + 318, y, 19, P.textDim, 'left', true);
        }
      } else {
        text(ctx, '—', L + 180, y, 21, P.textDim, 'left', true);
      }
      if (invalid) {
        rr(ctx, L, T, 600, 52, 8); ctx.fillStyle = 'rgba(10,8,16,0.6)'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,138,138,0.8)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(L + 140, y); ctx.lineTo(L + 480, y); ctx.stroke();
        text(ctx, '未上場', L + 540, y, 16, '#ff9a9a', 'center', true);
      }
      if (s.selected === true) selFrame(ctx, L, T, 600, 52, 8);
    } else {
      const L = x - 65, T = y - 23;
      const active = s.active === true, done = s.done === true;
      if (done) ctx.globalAlpha = 0.35;
      panelBox(ctx, L, T, 130, 46, active ? P.panelHi : P.panel, active ? '#ffffff' : P.panelLine, 6);
      if (C) {
        if (C.cat === 'arena') cardIcon(ctx, card, x, y, 34);
        else { cardIcon(ctx, card, x - 20, y, 34); if (target) speciesHead(ctx, target, x + 24, y, 12); }
      } else {
        ctx.strokeStyle = P.panelLine; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (invalid && !done) { rr(ctx, L, T, 130, 46, 6); ctx.fillStyle = 'rgba(10,8,16,0.55)'; ctx.fill(); }
      if (active) {
        ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; rr(ctx, L + 2, T + 2, 126, 42, 6); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawChantSlot(ctx, state) {
    const s = obj(state);
    const x = n(s.x), y = n(s.y);
    const key = pick(s.chant, CHANTS, '');
    const L = x - 220, T = y - 45;
    const idx = Math.max(0, Math.round(n(s.index)));
    ctx.save();
    if (key) {
      panelBox(ctx, L, T, 440, 90, P.panel2, P.chant, 12);
      chantIcon(ctx, key, L + 52, y + 6, 54);
      text(ctx, CHANTS[key].name, L + 96, y - 8, 24, P.text, 'left', true);
      fitText(ctx, CHANTS[key].desc, L + 96, y + 22, 330, 15, P.textDim, 'left');
    } else {
      rr(ctx, L + 1, T + 1, 438, 88, 12); ctx.fillStyle = 'rgba(42,36,56,0.6)'; ctx.fill();
      ctx.setLineDash([8, 6]); ctx.lineWidth = 2; ctx.strokeStyle = P.panelLine; ctx.stroke(); ctx.setLineDash([]);
      text(ctx, '空牌位', x, y + 4, 22, P.textDim, 'center', true);
    }
    text(ctx, '口令 ' + (idx + 1), L + 14, T + 14, 13, P.chant, 'left', true);
    if (s.selected === true) selFrame(ctx, L, T, 440, 90, 12);
    ctx.restore();
  }

  function drawPickerPanel(ctx, state) {
    const s = obj(state);
    const layer = pick(s.layer, { card: 1, target: 1, chant: 1 }, 'card');
    const opts = Array.isArray(s.options) ? s.options.map(obj) : [];
    const idx = Math.round(n(s.index));
    const L = 760, Wd = 460;
    ctx.save();
    const H = 50 + 52 * opts.length;
    // 外陰影 + 面板
    rr(ctx, L + 1.5, 61.5, Wd - 3, H - 3, 10); ctx.fillStyle = '#211c2e'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#8a7fb0'; ctx.stroke();
    ctx.save(); rr(ctx, L, 60, Wd, 50, 10); ctx.clip(); ctx.fillStyle = '#3a3152'; ctx.fillRect(L, 60, Wd, 50); ctx.restore();
    text(ctx, { card: '放哪張卡?', target: '點名誰?', chant: '掛哪塊口令?' }[layer], L + 20, 85, 22, P.text, 'left', true);
    opts.forEach((o, i) => {
      const T = 110 + 52 * i, cy = T + 26;
      const dis = o.disabled === true;
      ctx.save();
      if (dis) ctx.globalAlpha = 0.35;
      if (i === idx) { ctx.fillStyle = P.panelHi; ctx.fillRect(L + 4, T + 2, Wd - 8, 48); }
      const k = str(o.key);
      if (k === 'clear') clearIcon(ctx, L + 32, cy, 34);
      else if (layer === 'target') speciesHead(ctx, k, L + 32, cy, 14);
      else if (layer === 'chant') chantIcon(ctx, k, L + 32, cy, 34);
      else cardIcon(ctx, k, L + 32, cy, 34);
      const desc = str(o.desc);
      if (desc) {
        text(ctx, str(o.name), L + 62, cy - 10, 18, P.text, 'left', true);
        fitText(ctx, desc, L + 62, cy + 12, Wd - 80, 13, P.textDim, 'left');
      } else {
        text(ctx, str(o.name), L + 62, cy, 19, P.text, 'left', true);
      }
      if (dis) text(ctx, '已掛', L + Wd - 20, cy, 13, P.textDim, 'right', true);
      ctx.restore();
      if (i < opts.length - 1) { ctx.strokeStyle = 'rgba(90,79,120,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L + 12, T + 52); ctx.lineTo(L + Wd - 12, T + 52); ctx.stroke(); }
      if (i === idx) selFrame(ctx, L + 2, T, Wd - 4, 52, 6);
    });
    ctx.restore();
  }

  // ───────────────────────── 表演場 ─────────────────────────
  function drawChantBadge(ctx, state) {
    const s = obj(state);
    const x = n(s.x), y = n(s.y);
    const key = pick(s.chant, CHANTS, '');
    const cd = ratio(s.cdLeft, s.cdDur);
    const fl = ratio(s.flashT, s.flashDur);
    const flashing = n(s.flashDur) > 0 && n(s.flashT) < n(s.flashDur);
    ctx.save();
    if (!key) {
      rr(ctx, x - 19, y - 19, 38, 38, 9.5); ctx.setLineDash([4, 3]); ctx.strokeStyle = P.panelLine; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
      ctx.restore(); return;
    }
    chantIcon(ctx, key, x, y, 38);
    if (cd > 0) {
      // 剩餘冷卻 = 深色扇形(順時針從 12 點), 已恢復的一塊保持本色
      ctx.save(); rr(ctx, x - 19, y - 19, 38, 38, 9.5); ctx.clip();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 30, -Math.PI / 2, -Math.PI / 2 + TAU * cd); ctx.closePath();
      ctx.fillStyle = 'rgba(8,6,14,0.72)'; ctx.fill();
      ctx.restore();
      ctx.setLineDash([4, 3]); ctx.lineWidth = 2; ctx.strokeStyle = P.textDim;
      rr(ctx, x - 19, y - 19, 38, 38, 9.5); ctx.stroke(); ctx.setLineDash([]);
    } else {
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#ffffff'; rr(ctx, x - 19, y - 19, 38, 38, 9.5); ctx.stroke();
    }
    if (flashing) {
      rr(ctx, x - 20, y - 20, 40, 40, 10); ctx.fillStyle = 'rgba(255,255,255,' + (0.85 * (1 - fl)) + ')'; ctx.fill();
    }
    ctx.restore();
  }

  function drawBannerFx(ctx, state) {
    const s = obj(state);
    const x = n(s.x, 640), y = n(s.y, 180);
    const kind = s.kind === 'chant' ? 'chant' : 'card';
    const p = ratio(s.t, s.dur);
    if (n(s.dur) > 0 && n(s.t) >= n(s.dur)) return;
    const meta = kind === 'chant' ? CHANTS[s.key] : CARDS[s.key];
    const name = meta ? meta.name : str(s.key);
    const a = p < 0.12 ? p / 0.12 : p > 0.7 ? (1 - p) / 0.3 : 1;
    const sc = p < 0.12 ? 0.8 + 0.2 * (p / 0.12) : 1;
    const col = kind === 'chant' ? P.chant : P.arena;
    ctx.save();
    ctx.globalAlpha = c01(a);
    ctx.translate(x, y); ctx.scale(sc, sc);
    ctx.font = font(32, true);
    const w = tw(ctx, name + '!') + 110;
    rr(ctx, -w / 2, -28, w, 56, 28); ctx.fillStyle = 'rgba(13,10,18,0.82)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke();
    if (kind === 'chant') chantIcon(ctx, s.key, -w / 2 + 34, 0, 38); else cardIcon(ctx, s.key, -w / 2 + 34, 0, 38);
    text(ctx, name + '!', 22, 1, 32, '#ffffff', 'center', true, 5);
    ctx.restore();
  }

  function drawCardFx(ctx, state) {
    const s = obj(state);
    const x = n(s.x), y = n(s.y);
    if (n(s.dur) > 0 && n(s.t) >= n(s.dur)) return;
    const p = ratio(s.t, s.dur);
    const C = CARDS[s.card];
    const name = C ? C.name : str(s.card);
    const col = C && C.accent ? C.accent : P.call;
    ctx.save();
    ctx.globalAlpha = p > 0.65 ? (1 - p) / 0.35 : 1;
    const ty = y - 80 - p * 10;
    ctx.font = font(18, true);
    const w = tw(ctx, name + '!') + 18;
    rr(ctx, x - w / 2, ty - 13, w, 26, 13); ctx.fillStyle = 'rgba(13,10,18,0.8)'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.stroke();
    text(ctx, name + '!', x, ty + 1, 18, col, 'center', true);
    ctx.restore();
  }

  function drawArenaWall(ctx, state) {
    const s = obj(state);
    const left = s.side !== 'right';
    const x = n(s.x, left ? 60 : 1220), y = n(s.y, 356);
    const t = now();
    ctx.save();
    // 場外區域(柵欄外側到場地邊)
    const ox1 = left ? 60 : x, ox2 = left ? x : 1220;
    if (ox2 - ox1 > 0.5) {
      ctx.fillStyle = P.offField; ctx.fillRect(ox1, 146, ox2 - ox1, 420);
      ctx.save(); ctx.beginPath(); ctx.rect(ox1, 146, ox2 - ox1, 420); ctx.clip();
      ctx.strokeStyle = 'rgba(79,209,197,0.12)'; ctx.lineWidth = 6;
      for (let k = -420; k < 1300; k += 26) { ctx.beginPath(); ctx.moveTo(k, 566); ctx.lineTo(k + 420, 146); ctx.stroke(); }
      ctx.restore();
    }
    // 柵欄本體 24×420
    const L = x - 12, T = y - 210;
    ctx.fillStyle = P.arenaDark; ctx.fillRect(L, T, 24, 420);
    ctx.strokeStyle = P.outline; ctx.lineWidth = 2; ctx.strokeRect(L + 1, T + 1, 22, 418);
    ctx.fillStyle = P.arena;
    for (let i = 0; i < 11; i++) ctx.fillRect(L + 3, T + 4 + i * 38.6, 18, 8);
    ctx.fillRect(L + 9, T, 6, 420);
    if (s.moving === true) {
      // 移動中: 亮邊 + 沿柵欄流動的亮點
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(L + 1, T + 1, 22, 418);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < 6; i++) {
        const yy = T + ((t * 160 + i * 70) % 420);
        ctx.fillRect(L + 4, yy, 16, 4);
      }
    }
    ctx.restore();
  }

  function drawShowArena(ctx) {
    ctx.save();
    ctx.fillStyle = P.bgDeep; ctx.fillRect(0, 0, 1280, 720);
    // 觀眾席
    ctx.fillStyle = P.stands; ctx.fillRect(0, 56, 1280, 80); ctx.fillRect(0, 582, 1280, 80);
    ctx.fillStyle = P.seat;
    for (let i = 0; i < 8; i++) {
      const cx = 165 + 136 * i;
      rr(ctx, cx - 50, 70, 100, 52, 8); ctx.fill();
      rr(ctx, cx - 50, 596, 100, 52, 8); ctx.fill();
    }
    // 場地
    ctx.fillStyle = P.showFloor; ctx.fillRect(60, 146, 1160, 420);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 2;
    for (let yy = 176; yy < 566; yy += 40) { ctx.beginPath(); ctx.moveTo(60, yy); ctx.lineTo(1220, yy); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 3;
    circle(ctx, 640, 356, 60); ctx.stroke();
    ctx.strokeStyle = P.panelLine; ctx.lineWidth = 3; ctx.strokeRect(60, 146, 1160, 420);
    // 柵欄停靠刻度(寬 / 中 / 窄)
    [60, 260, 440, 840, 1020, 1220].forEach((sx) => {
      ctx.fillStyle = P.arena; ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.moveTo(sx - 7, 146); ctx.lineTo(sx + 7, 146); ctx.lineTo(sx, 156); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sx - 7, 566); ctx.lineTo(sx + 7, 566); ctx.lineTo(sx, 556); ctx.closePath(); ctx.fill();
    });
    ctx.globalAlpha = 1;
    // 縮小節目表底
    ctx.fillStyle = '#16121f'; ctx.fillRect(0, 664, 1280, 56);
    ctx.restore();
  }

  function rageColor(rage, redLow) { return rage >= redLow ? P.redZone : rage >= 50 ? P.rageMid : P.rageLow; }

  function drawShowMonster(ctx, state) {
    const s = obj(state);
    const species = sp(s.species);
    const x = n(s.x), y = n(s.y);
    const big = species === 'bear';
    const r = big ? 26 : 24;
    const dir = n(s.dir, 1) < 0 ? -1 : 1;
    const mode = pick(s.mode, { roam: 1, charge: 1, loose: 1 }, 'roam');
    const rage = Math.max(0, Math.min(100, n(s.rage)));
    const redLow = Math.max(0, Math.min(100, n(s.redLow, 80)));
    const marks = Math.max(0, Math.min(4, Math.round(n(s.marks))));
    const move = pick(s.move, { walk: 1, hop: 1, dash: 1 }, 'walk');
    const mp = ratio(s.moveT, s.moveDur);
    const t = now();
    const angry = mode !== 'roam';
    ctx.save();
    let lift = 0;
    if (move === 'hop') lift = Math.sin(mp * Math.PI) * 2;
    let shake = 0;
    if (mode === 'charge' && n(s.chargeT) > 0) shake = Math.sin(t * 60) * 1;
    const bx = x + shake, by = y - lift;
    shadow(ctx, x, y + r * 0.95, r * 0.85, r * 0.2, 0.35);
    if (angry) {
      // 失控: 紅色脈動氣場 + 蒸氣
      const pu = 0.5 + 0.5 * Math.sin(t * 14);
      circle(ctx, bx, by, r * 1.16); ctx.fillStyle = 'rgba(255,40,40,' + (0.25 + 0.2 * pu) + ')'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,59,59,0.95)'; ctx.stroke();
    }
    if (s.warm === true) {
      ctx.strokeStyle = P.warm; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) { const o = (t * 40 + i * 7) % 8; ctx.beginPath(); ctx.moveTo(bx - dir * (r * 0.95 + o * 0.3), by + i * 10); ctx.lineTo(bx - dir * (r * 1.2), by + i * 10); ctx.stroke(); }
    }
    if (move === 'dash') {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2.5;
      for (let i = -1; i <= 1; i += 2) { ctx.beginPath(); ctx.moveTo(bx - dir * r, by + i * 9); ctx.lineTo(bx - dir * r * 1.22, by + i * 9); ctx.stroke(); }
    }
    let sc = 1;
    if (s.performing === true) sc = 1 + 0.03 * Math.sin(ratio(s.performT, s.performDur) * Math.PI);
    ctx.save(); ctx.translate(bx, by); ctx.scale(sc, sc);
    speciesBody(ctx, species, 0, 0, r, dir);
    if (angry) { ctx.globalAlpha = 0.28; speciesBody(ctx, species, 0, 0, r, dir, { flat: '#ff2020' }); ctx.globalAlpha = 1; }
    ctx.restore();
    // 黏液(特殊): 紫色黏團罩住下半身
    if (n(s.slimeLeft) > 0) {
      const sl = ratio(s.slimeLeft, s.slimeDur);
      ctx.fillStyle = 'rgba(196,108,255,0.75)'; ctx.strokeStyle = '#4a1a6a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx - r * 1.05, by + r * 0.15);
      ctx.quadraticCurveTo(bx, by - r * 0.25, bx + r * 1.05, by + r * 0.15);
      ctx.lineTo(bx + r * 0.8, by + r * 0.7); ctx.lineTo(bx - r * 0.8, by + r * 0.7); ctx.closePath(); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const dx = bx + (i - 1) * r * 0.55, dl = r * 0.25 * (0.4 + sl * 0.6);
        ctx.beginPath(); ctx.ellipse(dx, by + r * 0.7 + dl * 0.5, 3, dl * 0.6 + 1, 0, 0, TAU); ctx.fill();
      }
    }
    // 引信: 越燒越短
    if (n(s.fuseLeft) > 0) {
      const fl = ratio(s.fuseLeft, s.fuseDur);
      const sx0 = bx + dir * r * 0.35, sy0 = by - r * 0.6;
      const len = r * 0.1 + r * 0.4 * fl;
      const ex = sx0 + dir * len * 0.55, ey = sy0 - len * 0.85;
      ctx.strokeStyle = '#2a1e10'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.quadraticCurveTo(sx0 + dir * len * 0.6, sy0 - len * 0.3, ex, ey); ctx.stroke();
      ctx.strokeStyle = P.special; ctx.lineWidth = 2; ctx.stroke();
      const fp = 0.6 + 0.4 * Math.sin(t * 30);
      starPath(ctx, ex, ey, 3 * fp + 3, 2, 6); ctx.fillStyle = '#ffe14d'; ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = '#ff4d3a'; ctx.stroke();
    }
    // 表演中: 外緣放射線
    if (s.performing === true) {
      const pp = ratio(s.performT, s.performDur);
      ctx.strokeStyle = 'rgba(255,255,255,' + (1 - pp) + ')'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8 + pp;
        ctx.beginPath(); ctx.moveTo(bx + Math.cos(a) * r * 1.08, by + Math.sin(a) * r * 1.08); ctx.lineTo(bx + Math.cos(a) * r * 1.18, by + Math.sin(a) * r * 1.18); ctx.stroke();
      }
    }
    // 反應: 點燃 = 往上竄的火舌; 澆熄 = 往下滴的水滴; 特殊 = 紫色螺旋
    const fx = pick(s.fx, { none: 1, ignited: 1, doused: 1, special: 1 }, 'none');
    if (fx !== 'none' && !(n(s.fxDur) > 0 && n(s.fxT) >= n(s.fxDur))) {
      const fp = ratio(s.fxT, s.fxDur);
      if (fx === 'ignited') {
        for (let i = -1; i <= 1; i++) {
          const fxx = bx + i * r * 0.5, base = by - r * 0.5 - fp * r * 0.15, h = r * (0.38 + (i === 0 ? 0.1 : 0)) * (1 - fp * 0.4);
          ctx.beginPath(); ctx.moveTo(fxx - 6, base); ctx.quadraticCurveTo(fxx - 5, base - h * 0.6, fxx, base - h); ctx.quadraticCurveTo(fxx + 5, base - h * 0.6, fxx + 6, base); ctx.closePath();
          ctx.fillStyle = P.ignite; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
          ctx.beginPath(); ctx.ellipse(fxx, base - 3, 2.5, 4, 0, 0, TAU); ctx.fillStyle = '#ffe14d'; ctx.fill();
        }
      } else if (fx === 'doused') {
        for (let i = -1; i <= 1; i++) {
          const dx = bx + i * r * 0.55, dy = by - r * 0.92 + fp * r * 1.2 + Math.abs(i) * 4;
          ctx.beginPath(); ctx.moveTo(dx, dy - 7); ctx.quadraticCurveTo(dx + 5, dy, dx, dy + 4); ctx.quadraticCurveTo(dx - 5, dy, dx, dy - 7);
          ctx.fillStyle = P.calm; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        }
      } else {
        ctx.strokeStyle = P.special; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i <= 30; i++) { const a = i * 0.4 + fp * 6, rad = r * (0.5 + i / 30 * 0.75); const px = bx + Math.cos(a) * rad, py = by + Math.sin(a) * rad * 0.6; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.globalAlpha = 1 - fp * 0.5; ctx.stroke(); ctx.globalAlpha = 1;
      }
    }
    // 怒氣條(框外頭上)
    const ry = y - (big ? 52 : 44);
    ctx.fillStyle = P.outline; ctx.fillRect(x - 31, ry - 5, 62, 10);
    ctx.fillStyle = '#241c2c'; ctx.fillRect(x - 30, ry - 4, 60, 8);
    ctx.fillStyle = 'rgba(255,59,59,0.28)'; ctx.fillRect(x - 30 + 60 * redLow / 100, ry - 4, 60 * (1 - redLow / 100), 8);
    ctx.fillStyle = rageColor(rage, redLow); ctx.fillRect(x - 30, ry - 4, 60 * rage / 100, 8);
    // 紅區起點(紅線) 與 表演門檻 50(白刻度)
    ctx.fillStyle = P.redZone; ctx.fillRect(x - 30 + 60 * redLow / 100 - 1, ry - 5, 2, 10);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 0.75, ry - 4, 1.5, 8);
    // 失控標記: 一排紅點, 最右一顆畫成「還剩多久 −1」的餅
    if (marks > 0 && !angry) {
      const my = y - (big ? 64 : 56);
      const left = ratio(s.markLeft, s.markDur);
      for (let i = 0; i < marks; i++) {
        const mx = x - (marks - 1) * 5.5 + i * 11;
        circle(ctx, mx, my, 4.5); ctx.fillStyle = P.outline; ctx.fill();
        if (i === marks - 1 && n(s.markDur) > 0) {
          ctx.beginPath(); ctx.moveTo(mx, my); ctx.arc(mx, my, 3.5, -Math.PI / 2, -Math.PI / 2 + TAU * left); ctx.closePath();
          ctx.fillStyle = P.mark; ctx.fill();
          ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,59,59,0.6)'; circle(ctx, mx, my, 3.5); ctx.stroke();
        } else { circle(ctx, mx, my, 3.5); ctx.fillStyle = P.mark; ctx.fill(); }
      }
    }
    // Lv(框外腳下)
    text(ctx, 'Lv ' + Math.max(0, Math.round(n(s.level))), x, y + (big ? 48 : 40), 11, '#ffe9a0', 'center', true, 3);
    ctx.restore();
  }

  function drawFence(ctx, state) {
    const s = obj(state);
    const x = n(s.x), y = n(s.y);
    ctx.save();
    if (s.broken === true) {
      ctx.fillStyle = P.fence; ctx.strokeStyle = P.outline; ctx.lineWidth = 2;
      ctx.save(); ctx.translate(x - 40, y); ctx.rotate(-0.06); rr(ctx, -26, -4, 48, 8, 3); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(x + 40, y); ctx.rotate(0.06); rr(ctx, -22, -4, 48, 8, 3); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.fillStyle = '#ff7a5a';
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - 12 + i * 8, y - 2); ctx.lineTo(x - 9 + i * 8, y + 6); ctx.lineTo(x - 6 + i * 8, y - 3); ctx.closePath(); ctx.fill(); }
    } else {
      ctx.fillStyle = P.fenceDark; ctx.fillRect(x - 68, y - 7, 136, 14);
      ctx.fillStyle = P.fence; ctx.fillRect(x - 66, y - 5, 132, 4); ctx.fillRect(x - 66, y + 2, 132, 3);
      for (let i = 0; i < 5; i++) { ctx.fillStyle = '#c9925e'; ctx.fillRect(x - 64 + i * 31.5, y - 7, 6, 14); }
      ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5; ctx.strokeRect(x - 67.25, y - 6.25, 134.5, 12.5);
    }
    ctx.restore();
  }

  const VIS_COLORS = ['#e07a5f', '#81b29a', '#f2cc8f', '#7aa0e0', '#c08ad8', '#e0a0b8'];
  function drawVisitor(ctx, state) {
    const s = obj(state);
    const x = n(s.x), y = n(s.y);
    const mode = pick(s.mode, { watch: 1, scared: 1, empty: 1 }, 'watch');
    const col = VIS_COLORS[Math.abs(Math.round(x / 136)) % VIS_COLORS.length];
    const t = now();
    ctx.save();
    // 座椅
    rr(ctx, x - 24, y + 14, 48, 22, 5); ctx.fillStyle = '#4a3d60'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = P.outline; ctx.stroke();
    if (mode === 'empty') { ctx.restore(); return; }
    if (mode === 'watch') {
      const bob = Math.sin(t * 3 + x) * 1.5;
      rr(ctx, x - 15, y - 6 + bob, 30, 32, 10); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
      circle(ctx, x, y - 18 + bob, 12); ctx.fillStyle = P.tamerSkin; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#16121f'; circle(ctx, x - 4, y - 19 + bob, 1.8); ctx.fill(); circle(ctx, x + 4, y - 19 + bob, 1.8); ctx.fill();
    } else {
      // 嚇跑: 傾斜、雙手舉起、半透明、驚嚇線
      ctx.globalAlpha = 0.85;
      ctx.translate(x, y); ctx.rotate(Math.sin(t * 20) * 0.12);
      ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5;
      ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(-18, -22); ctx.moveTo(10, -2); ctx.lineTo(18, -22); ctx.stroke();
      rr(ctx, -13, -4, 26, 28, 9); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = P.outline; ctx.stroke();
      circle(ctx, 0, -16, 11); ctx.fillStyle = '#ffe0e0'; ctx.fill(); ctx.stroke();
      circle(ctx, 0, -12, 3); ctx.fillStyle = '#16121f'; ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-23, -26); ctx.lineTo(-19, -31); ctx.moveTo(23, -26); ctx.lineTo(19, -31); ctx.moveTo(0, -29); ctx.lineTo(0, -33); ctx.stroke();
    }
    ctx.restore();
  }

  // ───────────────────────── 商店 / 按鈕 / 飄字 / 結算 ─────────────────────────
  function drawShopTab(ctx, state) {
    const s = obj(state);
    const x = n(s.x), y = n(s.y);
    const tab = pick(s.tab, { char: 1, show: 1, monster: 1 }, 'char');
    const cur = s.current === true;
    ctx.save();
    panelBox(ctx, x - 110, y - 25, 220, 50, cur ? '#5a4c80' : P.panel, cur ? '#c8b8ff' : P.panelLine, 10);
    text(ctx, { char: '角色', show: '表演', monster: '怪物' }[tab], x, y + 1, 22, cur ? '#ffffff' : P.textDim, 'center', true);
    if (s.selected === true) selFrame(ctx, x - 110, y - 25, 220, 50, 10);
    ctx.restore();
  }

  function shopItemIcon(ctx, item, cx, cy) {
    if (WEAPONS[item]) {
      ctx.save(); ctx.translate(cx - 22, cy + 12); ctx.rotate(-0.6); weaponShape(ctx, item, 50); ctx.restore();
    } else if (item === 'attack') {
      ctx.save(); ctx.translate(cx - 20, cy + 10); ctx.rotate(-0.6); weaponShape(ctx, 'sword', 44); ctx.restore();
      text(ctx, '+1', cx + 14, cy - 12, 16, '#ffe9a0', 'center', true, 3);
    } else if (item === 'armor') {
      heart(ctx, cx, cy + 2, 20, true); text(ctx, '+1', cx + 16, cy - 14, 16, '#ffe9a0', 'center', true, 3);
    } else if (item === 'ropeBag') {
      ctx.strokeStyle = P.rope; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(cx, cy, 16, 10, 0, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, cy + 4, 13, 8, 0, 0, TAU); ctx.stroke();
      text(ctx, '+1', cx + 16, cy - 14, 16, '#ffe9a0', 'center', true, 3);
    } else if (CARDS[item]) cardIcon(ctx, item, cx, cy, 46);
    else if (CHANTS[item]) chantIcon(ctx, item, cx, cy, 46);
    else if (SPECIES[item]) speciesHead(ctx, item, cx, cy, 20);
  }

  function drawShopItem(ctx, state) {
    const s = obj(state);
    const x = n(s.x), y = n(s.y);
    const item = str(s.item);
    const L = x - 190, T = y - 50;
    const locked = s.locked === true;
    const affordable = s.affordable === true;
    let name = item, desc = '', tag = '';
    if (WEAPONS[item]) { name = WEAPONS[item].name; desc = WEAPONS[item].desc; }
    else if (UPGRADES[item]) { name = UPGRADES[item].name; desc = UPGRADES[item].desc; }
    else if (CARDS[item]) { name = CARDS[item].name; desc = CARDS[item].desc; tag = '節目'; }
    else if (CHANTS[item]) { name = CHANTS[item].name; desc = CHANTS[item].desc; tag = '口令'; }
    else if (SPECIES[item]) { name = SPECIES[item].name; }
    ctx.save();
    panelBox(ctx, L, T, 380, 100, s.equipped === true ? '#2f4a3a' : P.panel2, s.equipped === true ? P.capture : P.panelLine, 10);
    if (locked) ctx.globalAlpha = 0.4;
    rr(ctx, L + 10, T + 14, 72, 72, 10); ctx.fillStyle = 'rgba(13,10,18,0.45)'; ctx.fill();
    shopItemIcon(ctx, item, L + 46, T + 50);
    let nx = L + 96;
    if (tag) {
      ctx.font = font(12, true);
      const tw2 = tw(ctx, tag) + 12;
      rr(ctx, nx, T + 16, tw2, 20, 10); ctx.fillStyle = tag === '口令' ? P.chantDark : P.arenaDark; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = tag === '口令' ? P.chant : P.arena; ctx.stroke();
      text(ctx, tag, nx + tw2 / 2, T + 27, 12, tag === '口令' ? P.chant : P.arena, 'center', true);
      nx += tw2 + 8;
    }
    fitText(ctx, name, nx, T + 27, L + 370 - nx - 90, 20, P.text, 'left', true);
    if (SPECIES[item]) {
      const ew = effectTag(ctx, pick(s.effect, EFFECTS, SPECIES[item].eff), L + 96, T + 58, 13);
      text(ctx, 'Lv ' + Math.max(0, Math.round(n(s.level))), L + 96 + ew + 12, T + 58, 16, '#ffe9a0', 'left', true);
    } else {
      fitText(ctx, desc, L + 96, T + 58, 270, 14, P.textDim, 'left');
      if (UPGRADES[item] && n(s.level) > 0) text(ctx, '已買 ' + Math.round(n(s.level)), L + 96, T + 82, 13, P.textDim, 'left', true);
    }
    ctx.globalAlpha = 1;
    // 價格 / 狀態(右上)
    let status = '', scol = P.text;
    if (SPECIES[item]) {
      if (locked) { status = '未收服'; scol = P.textDim; }
      else if (s.maxed === true) { status = '已滿級'; scol = P.capture; }
    } else if (WEAPONS[item]) {
      if (s.equipped === true) { status = '裝備中'; scol = P.capture; }
      else if (s.owned === true || item === 'club') { status = '已擁有'; scol = P.textDim; }
    } else if ((CARDS[item] || CHANTS[item]) && s.owned === true) { status = '已擁有'; scol = P.textDim; }
    if (status) {
      text(ctx, status, L + 366, T + 27, 17, scol, 'right', true);
    } else {
      const cost = Math.max(0, Math.round(n(s.cost)));
      ctx.font = font(18, true);
      const cw = tw(ctx, cost + ' 金');
      coin(ctx, L + 366 - cw - 12, T + 27, 8);
      text(ctx, cost + ' 金', L + 366, T + 28, 18, affordable ? P.gold : '#8a7a90', 'right', true);
      if (SPECIES[item]) text(ctx, '升級', L + 366, T + 82, 13, P.textDim, 'right', true);
    }
    if (s.selected === true) selFrame(ctx, L, T, 380, 100, 10);
    ctx.restore();
  }

  function drawShopDetail(ctx, state) {
    const s = obj(state);
    const x = n(s.x, 640), y = n(s.y, 570);
    const lines = Array.isArray(s.lines) ? s.lines.slice(0, 3) : [];
    ctx.save();
    panelBox(ctx, x - 540, y - 30, 1080, 60, P.panel, P.panelLine, 10);
    const lh = lines.length >= 3 ? 18 : 24;
    const sz = lines.length >= 3 ? 15 : 18;
    lines.forEach((ln, i) => fitText(ctx, str(ln), x, y - (lines.length - 1) * lh / 2 + i * lh, 1040, sz, i === 0 ? P.text : P.textDim, 'center', i === 0));
    ctx.restore();
  }

  function drawButton(ctx, state) {
    const s = obj(state);
    const x = n(s.x), y = n(s.y), w = Math.max(10, n(s.w, 200)), h = Math.max(10, n(s.h, 70));
    const sel = s.selected === true;
    ctx.save();
    panelBox(ctx, x, y, w, h, sel ? '#5a4c80' : P.panel2, sel ? '#c8b8ff' : P.panelLine, 12);
    fitText(ctx, str(s.label), x + w / 2, y + h / 2 + 1, w - 16, Math.min(26, h * 0.42), sel ? '#ffffff' : P.text, 'center', true);
    if (sel) selFrame(ctx, x, y, w, h, 12);
    ctx.restore();
  }

  function drawFloatText(ctx, state) {
    const s = obj(state);
    const x = n(s.x), y = n(s.y);
    const kind = pick(s.kind, { gold: 1, redGold: 1, chain: 1, repDown: 1, capture: 1 }, 'gold');
    if (n(s.dur) > 0 && n(s.t) >= n(s.dur)) return;
    const p = ratio(s.t, s.dur);
    const msg = str(s.text);
    ctx.save();
    ctx.globalAlpha = p > 0.6 ? (1 - p) / 0.4 : 1;
    const yy = y - p * 32;
    if (kind === 'gold') {
      ctx.font = font(18, true); const w = tw(ctx, msg);
      coin(ctx, x - w / 2 - 10, yy, 7);
      text(ctx, msg, x + 4, yy, 18, P.gold, 'center', true, 4);
    } else if (kind === 'redGold') {
      ctx.font = font(23, true); const w = tw(ctx, msg);
      coin(ctx, x - w / 2 - 12, yy, 9);
      text(ctx, msg, x + 4, yy, 23, P.gold, 'center', true, 0);
      ctx.lineWidth = 5; ctx.strokeStyle = '#a01010'; ctx.strokeText(msg, x + 4, yy);
      text(ctx, msg, x + 4, yy, 23, '#ffe14d', 'center', true);
    } else if (kind === 'chain') {
      text(ctx, msg, x, yy, 22, '#ffffff', 'center', true, 5);
      ctx.lineWidth = 2; ctx.strokeStyle = P.gold; ctx.strokeText(msg, x, yy);
    } else if (kind === 'repDown') {
      ctx.font = font(18, true); const w = tw(ctx, msg);
      repStar(ctx, x - w / 2 - 10, yy, 7);
      text(ctx, msg, x + 4, yy, 18, '#ff8a8a', 'center', true, 4);
    } else {
      ctx.font = font(24, true); const w = tw(ctx, msg);
      text(ctx, msg, x + 12, yy, 24, P.capture, 'center', true, 5);
      const cx = x - w / 2 - 8;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = P.outline; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(cx - 9, yy); ctx.lineTo(cx - 3, yy + 7); ctx.lineTo(cx + 9, yy - 8); ctx.stroke();
      ctx.strokeStyle = P.capture; ctx.lineWidth = 4; ctx.stroke();
    }
    ctx.restore();
  }

  function drawResultPanel(ctx, state) {
    const s = obj(state);
    const cx = 640, cy = 380, L = 240, T = 120;
    const stars = Math.max(0, Math.min(3, Math.round(n(s.stars))));
    ctx.save();
    panelBox(ctx, L, T, 800, 520, P.panel, '#8a7fb0', 18);
    text(ctx, '結算', cx, T + 40, 32, P.text, 'center', true);
    for (let i = 0; i < 3; i++) {
      starPath(ctx, cx - 90 + i * 90, T + 108, 34, 15);
      ctx.fillStyle = i < stars ? P.rep : '#2e2840'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = i < stars ? '#ffffff' : P.panelLine; ctx.stroke();
    }
    const rows = [
      ['總名聲', Math.round(n(s.rep)), 'rep'],
      ['累計金幣', Math.round(n(s.goldEarned)), 'gold'],
      ['最長連鎖', Math.round(n(s.bestChain)) + ' 段', ''],
    ];
    rows.forEach((r, i) => {
      const yy = T + 178 + i * 40;
      text(ctx, r[0], L + 120, yy, 20, P.textDim, 'left', true);
      if (r[2] === 'rep') repStar(ctx, L + 330, yy, 10);
      if (r[2] === 'gold') coin(ctx, L + 330, yy, 9);
      text(ctx, String(r[1]), L + 350, yy, 24, P.text, 'left', true);
    });
    text(ctx, '怪物庫', L + 520, T + 178, 20, P.textDim, 'left', true);
    const bank = Array.isArray(s.bank) ? s.bank.map(obj) : [];
    bank.slice(0, 6).forEach((b, i) => {
      const yy = T + 214 + i * 36;
      speciesHead(ctx, b.species, L + 536, yy, 12);
      text(ctx, (SPECIES[b.species] ? SPECIES[b.species].name : str(b.species)) + ' ×' + Math.round(n(b.count)), L + 558, yy, 17, P.text, 'left', true);
      text(ctx, 'Lv ' + Math.round(n(b.level)), L + 760, yy, 15, '#ffe9a0', 'right', true);
    });
    rr(ctx, cx - 110, T + 448, 220, 48, 24); ctx.fillStyle = '#5a4c80'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#c8b8ff'; ctx.stroke();
    text(ctx, '按 Z 重來', cx, T + 473, 22, '#ffffff', 'center', true);
    ctx.restore();
  }

  // ───────────────────────── HUD ─────────────────────────
  function timerBar(ctx, x, y, w, left, max) {
    const p = ratio(left, max);
    rr(ctx, x, y - 9, w, 18, 9); ctx.fillStyle = '#16121f'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.panelLine; ctx.stroke();
    if (p > 0) { rr(ctx, x + 2, y - 7, (w - 4) * p, 14, 7); ctx.fillStyle = p < 0.2 ? '#ff8a5a' : '#c8b8ff'; ctx.fill(); }
    text(ctx, Math.ceil(Math.max(0, n(left))) + ' 秒', x + w + 10, y + 1, 18, p < 0.2 && p > 0 ? '#ff8a5a' : P.text, 'left', true);
  }

  function drawHud(ctx, state) {
    const s = obj(state);
    const phase = pick(s.phase, { guide: 1, select: 1, dungeon: 1, setup1: 1, setup2: 1, show: 1, shop: 1, result: 1 }, 'select');
    if (phase === 'guide') return; // 說明頁文字歸 RD, HUD 不畫
    const dungeon = phase === 'dungeon';
    const H = dungeon ? 100 : 50;
    ctx.save();
    ctx.fillStyle = '#100d17'; ctx.fillRect(0, 0, 1280, H);
    ctx.fillStyle = P.panelLine; ctx.fillRect(0, H - 2, 1280, 2);
    const day = Math.round(n(s.day, 1)), dayMax = Math.round(n(s.dayMax, 5));
    text(ctx, '第 ' + day + '/' + dayMax + ' 天', 16, 25, 20, P.text, 'left', true);
    coin(ctx, 150, 25, 10); text(ctx, String(Math.round(n(s.gold))), 166, 26, 20, P.gold, 'left', true);
    repStar(ctx, 258, 25, 11); text(ctx, String(Math.round(n(s.rep))), 274, 26, 20, P.rep, 'left', true);
    const msg = str(s.message);
    if (dungeon) {
      const D = DUNGEONS[s.dungeon];
      if (D) { rr(ctx, 350, 11, 120, 28, 14); ctx.fillStyle = D.head; ctx.fill(); text(ctx, D.name, 410, 26, 16, '#ffffff', 'center', true, 3); }
      timerBar(ctx, 490, 25, 300, s.timeLeft, s.timeMax);
      fitText(ctx, msg, 1264, 25, 380, 20, '#ffe9a0', 'right', true);
      // 第 2 列: 心、繩、武器
      const mh = Math.max(0, Math.min(20, Math.round(n(s.maxHearts, 6)))), hh = Math.max(0, Math.round(n(s.hearts)));
      for (let i = 0; i < mh; i++) heart(ctx, 26 + i * 26, 76, 22, i < hh);
      const rx = 40 + Math.max(mh, 6) * 26;
      const rm = Math.max(0, Math.min(20, Math.round(n(s.ropeMax, 4)))), rp = Math.max(0, Math.round(n(s.ropes)));
      text(ctx, '繩', rx, 76, 16, P.textDim, 'left', true);
      for (let i = 0; i < rm; i++) {
        ctx.lineWidth = 3.5; ctx.strokeStyle = i < rp ? P.rope : '#3a3346';
        ctx.beginPath(); ctx.ellipse(rx + 34 + i * 24, 76, 8, 10, 0, 0, TAU); ctx.stroke();
      }
      const wx = 900;
      const wk = pick(s.weapon, WEAPONS, 'club');
      rr(ctx, wx, 56, 44, 40, 8); ctx.fillStyle = P.panel2; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = P.panelLine; ctx.stroke();
      ctx.save(); ctx.translate(wx + 8, 86); ctx.rotate(-0.7); weaponShape(ctx, wk, 34); ctx.restore();
      text(ctx, WEAPONS[wk].name, wx + 54, 76, 18, P.text, 'left', true);
      const xMax = n(s.xCdMax);
      const kx = 1110;
      keycap(ctx, 'X', kx, 78);
      if (xMax <= 0) {
        text(ctx, '無', kx + 26, 76, 16, P.textDim, 'left', true);
      } else {
        const cl = ratio(s.xCdLeft, xMax);
        ctx.lineWidth = 5; ctx.strokeStyle = '#2a2438'; circle(ctx, kx + 48, 76, 13); ctx.stroke();
        ctx.strokeStyle = cl > 0 ? '#c8b8ff' : P.capture;
        ctx.beginPath(); ctx.arc(kx + 48, 76, 13, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - cl)); ctx.stroke();
        text(ctx, cl > 0 ? '' : 'OK', kx + 48, 77, 10, P.capture, 'center', true);
      }
    } else if (phase === 'show') {
      fitText(ctx, msg, 360, 25, 240, 18, '#ffe9a0', 'left', true);
      timerBar(ctx, 600, 25, 150, s.timeLeft, s.timeMax);
      const mul = n(s.arenaMul);
      if (mul > 0) {
        const lvl = mul >= 1.5 ? 2 : mul >= 1.25 ? 1 : 0;
        const label = '擂台 ×' + (Math.round(mul * 100) / 100);
        rr(ctx, 850, 8, 210, 34, 17); ctx.fillStyle = lvl ? P.arenaDark : '#241e30'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = lvl === 2 ? '#ffffff' : P.arena; ctx.stroke();
        text(ctx, label, 870, 26, 20, lvl ? '#ffffff' : P.arena, 'left', true);
        // 三階刻度: 亮幾格 = 擂台多窄
        for (let i = 0; i < 3; i++) {
          rr(ctx, 1000 + i * 17, 16, 12, 18, 3); ctx.fillStyle = i <= lvl ? P.arena : '#3a3346'; ctx.fill();
        }
      }
    } else {
      fitText(ctx, msg, 1264, 25, 860, 19, '#ffe9a0', 'right', true);
    }
    ctx.restore();
  }

  // ───────────────────────── 說明頁示意圖 ─────────────────────────
  function fitBox(ctx, bx, by, bw, bh, dw, dh) {
    const k = Math.max(0.01, Math.min(bw / dw, bh / dh));
    ctx.translate(bx + (bw - dw * k) / 2, by + (bh - dh * k) / 2);
    ctx.scale(k, k);
    ctx.beginPath(); ctx.rect(0, 0, dw, dh); ctx.clip();
  }
  function scaled(ctx, x, y, k, fn) { ctx.save(); ctx.translate(x, y); ctx.scale(k, k); fn(); ctx.restore(); }

  function guideTiles(ctx, cols, rows, ox, oy, map) {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const ch = (map[r] || '')[c] || '.';
      const kind = { '#': 'wall', 'o': 'pillar', 'G': 'bush', 'W': 'slow' }[ch] || 'floor';
      drawTile(ctx, { x: ox + c * 60 + 30, y: oy + r * 60 + 30, dungeon: 'candy', kind: kind, nest: ch === 'n' });
    }
  }

  function guidePage1(ctx) { // 1000×500
    guideTiles(ctx, 17, 9, 0, -20, [
      '#################', '#######..........', '##......Y........', '#..GG............', '#..GG............',
      '#................', '#.........W......', '##...............', '#################']);
    drawFruitTree(ctx, { x: 510, y: 130, dungeon: 'candy', hasFruit: true });
    const tx = 420, ty = 330;
    // 移動箭頭(往下側閃)
    arrow(ctx, tx - 50, ty - 20, tx - 50, ty + 70, '#ffffff', 5, 16);
    keycap(ctx, '↓', tx - 92, ty + 30); shortLabel(ctx, '走', tx - 92, ty + 66);
    // 蜂針: 三根依序瞄準發射當下的位置(他往下走, 先發的偏上)
    const bx = 820, by = 150;
    const aims = [[tx, ty - 90], [tx, ty - 45], [tx, ty]];
    const ages = [0.9, 0.75, 0.6];
    aims.forEach((am, i) => {
      const ang = Math.atan2(am[1] - by, am[0] - bx);
      ctx.save(); ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(245,197,24,0.45)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(am[0], am[1]); ctx.stroke(); ctx.restore();
      const d = 200 * ages[i] + 40;
      drawHazard(ctx, { x: bx + Math.cos(ang) * d, y: by + Math.sin(ang) * d, kind: 'sting', phase: 'fly', radius: 8, angle: ang, t: ages[i], dur: 4, points: [] });
    });
    drawWildMonster(ctx, { x: bx, y: by, species: 'bee', hp: 7, maxHp: 7, casting: true, move: 'walk', dir: -1 });
    // 馴獸師棍棒朝右敲中蜜蜂
    drawWildMonster(ctx, { x: tx + 62, y: ty, species: 'bee', hp: 5, maxHp: 7, hit: true, move: 'walk', dir: -1 });
    drawTamer(ctx, { x: tx, y: ty, facing: 2, weapon: 'club' });
    drawWeaponFx(ctx, { x: tx, y: ty, weapon: 'club', move: 'normal', shape: 'arc', angle: 0, spread: 100 * Math.PI / 180, radius: 70, t: 0.12, dur: 0.2 });
    keycap(ctx, 'Z', tx + 70, ty + 70); shortLabel(ctx, '攻擊', tx + 118, ty + 70);
    // 不畫 X 鍵帽: 圖中武器是棍棒, 規格裡棍棒的 X 無反應(X 的說明交給 RD 頁面文字)
  }

  function guidePage2(ctx) { // 1000×500
    // 左格
    ctx.save(); ctx.beginPath(); ctx.rect(10, 10, 480, 480); ctx.clip();
    guideTiles(ctx, 9, 9, 10, -10, ['#########', '#........', '#..GG....', '#........', '#........', '#........', '#....GG..', '#........', '#########']);
    const ax = 250, ay = 270;
    drawCaptureRing(ctx, { x: ax, y: ay, t: 0.4, dur: 0.8 });
    drawWildMonster(ctx, { x: ax, y: ay, species: 'slug', hp: 2, maxHp: 8, weak: true, move: 'walk', dir: 1 });
    drawTamer(ctx, { x: ax + 14, y: ay + 12, facing: 7, weapon: 'club' });
    ctx.restore();
    ctx.lineWidth = 3; ctx.strokeStyle = P.panelLine; ctx.strokeRect(10, 10, 480, 480);
    // 右格
    ctx.save(); ctx.beginPath(); ctx.rect(510, 10, 480, 480); ctx.clip();
    guideTiles(ctx, 9, 9, 510, -10, ['#########', '.........', '.........', '...G.....', '.........', '.........', '.........', '.....G...', '#########']);
    const bx = 740, by = 260;
    // 繞圈路線箭頭
    ctx.save(); ctx.setLineDash([10, 8]); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(bx, by, 120, -0.2, 4.3); ctx.stroke(); ctx.restore();
    const ea = 4.3;
    arrow(ctx, bx + Math.cos(ea - 0.15) * 120, by + Math.sin(ea - 0.15) * 120, bx + Math.cos(ea + 0.05) * 120, by + Math.sin(ea + 0.05) * 120, '#ffffff', 3, 18);
    const tx = bx + Math.cos(-0.2) * 120, ty = by + Math.sin(-0.2) * 120;
    drawWildMonster(ctx, { x: bx, y: by, species: 'slug', hp: 2, maxHp: 8, weak: true, lassoed: true, move: 'walk', dir: 1 });
    drawLasso(ctx, { x1: tx, y1: ty, x2: bx, y2: by, progress: 0.5, t: 2, limit: 5, len: 120, maxLen: 220 });
    drawTamer(ctx, { x: tx, y: ty, facing: 0, weapon: 'club', lassoing: true });
    // 角落小圖: 收服!
    rr(ctx, 840, 400, 140, 76, 10); ctx.fillStyle = 'rgba(13,10,18,0.8)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.panelLine; ctx.stroke();
    drawFloatText(ctx, { x: 910, y: 438, text: '收服!', kind: 'capture', t: 0, dur: 1 });
    ctx.restore();
    ctx.lineWidth = 3; ctx.strokeStyle = P.panelLine; ctx.strokeRect(510, 10, 480, 480);
  }

  function miniArena(ctx, px, py, narrow) { // 在 (px,py) 畫一個 440×210 的表演場縮圖
    const k = 440 / 1160;
    ctx.save();
    ctx.translate(px, py);
    ctx.beginPath(); ctx.rect(0, 0, 440, 420 * k); ctx.clip();
    ctx.scale(k, k); ctx.translate(-60, -146);
    drawShowArena(ctx);
    const lx = narrow ? 440 : 60, rx = narrow ? 840 : 1220;
    drawArenaWall(ctx, { x: lx, y: 356, side: 'left', moving: false });
    drawArenaWall(ctx, { x: rx, y: 356, side: 'right', moving: false });
    const M = 1.5;
    const mon = (m) => scaled(ctx, m.x, m.y, M, () => drawShowMonster(ctx, Object.assign({ level: 0, redLow: 80, marks: 0, mode: 'roam', move: 'walk', fx: 'none', fxT: 0, fxDur: 0.5 }, m, { x: 0, y: 0 })));
    if (!narrow) {
      mon({ x: 260, y: 250, species: 'bee', rage: 60, dir: 1 });
      mon({ x: 1000, y: 470, species: 'slug', rage: 60, dir: -1 });
      mon({ x: 1010, y: 240, species: 'bee', rage: 60, dir: -1 });
      mon({ x: 300, y: 470, species: 'slug', rage: 60, dir: 1 });
      scaled(ctx, 640, 340, M, () => drawHazard(ctx, { x: 0, y: 0, kind: 'sting', phase: 'fly', radius: 8, angle: 0.2, t: 1, dur: 4, points: [] }));
    } else {
      // 兩發正要打中(還差一點, 判定未到), 另兩隻身上是剛才被打中的反應 + 飛出的金幣
      mon({ x: 560, y: 260, species: 'bee', rage: 70, dir: 1 });
      mon({ x: 730, y: 290, species: 'slug', rage: 60, dir: -1 });
      mon({ x: 580, y: 450, species: 'slug', rage: 72, dir: 1, fx: 'ignited', fxT: 0.15 });
      mon({ x: 720, y: 460, species: 'bee', rage: 55, dir: -1, fx: 'doused', fxT: 0.15 });
      scaled(ctx, 668, 290, M, () => drawHazard(ctx, { x: 0, y: 0, kind: 'sting', phase: 'fly', radius: 8, angle: 0, t: 0.3, dur: 4, points: [] }));
      // 薄荷蛞蝓(730,290) 朝最近的蜜蜂(720,460) 吐兩顆泡泡(左右各偏 12°)
      const ba = Math.atan2(460 - 290, 720 - 730);
      [-0.21, 0.21].forEach((o) => scaled(ctx, 730 + Math.cos(ba + o) * 85, 290 + Math.sin(ba + o) * 85, M, () => drawHazard(ctx, { x: 0, y: 0, kind: 'bubble', phase: 'fly', radius: 22, angle: ba + o, t: 0.85, dur: 5, points: [] })));
      scaled(ctx, 650, 400, M, () => drawFloatText(ctx, { x: 0, y: 0, text: '+3', kind: 'gold', t: 0.1, dur: 1 }));
      scaled(ctx, 790, 400, M, () => drawFloatText(ctx, { x: 0, y: 0, text: '+2', kind: 'gold', t: 0.3, dur: 1 }));
    }
    ctx.restore();
    ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = P.panelLine; ctx.strokeRect(px, py, 440, 420 * k); ctx.restore();
    // HUD 角落的倍率(和遊戲內 HUD 同一個長相)
    ctx.save();
    const lbl = narrow ? '擂台 ×1.5' : '擂台 ×1';
    rr(ctx, px + 8, py - 44, 150, 34, 17); ctx.fillStyle = narrow ? P.arenaDark : '#241e30'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = narrow ? '#ffffff' : P.arena; ctx.stroke();
    text(ctx, lbl, px + 22, py - 26, 19, narrow ? '#ffffff' : P.arena, 'left', true);
    ctx.restore();
  }

  function guidePage3(ctx) { // 1000×500
    miniArena(ctx, 20, 170, false);
    miniArena(ctx, 540, 170, true);
    arrow(ctx, 466, 250, 528, 250, '#ffffff', 5, 18);
  }

  function guidePage4(ctx) { // 1280×720 原尺寸畫面
    drawBackground(ctx);
    const rows = { 0: ['shrink', ''], 2: ['provoke', 'bee'], 4: ['widen', ''] };
    for (let i = 0; i < 9; i++) {
      const r = rows[i] || ['', ''];
      drawTimelineSlot(ctx, { x: 360, y: 84 + 58 * i, style: 'row', slot: i, card: r[0], target: r[1], invalid: false, selected: false, active: false, done: false });
    }
    const ch = ['alarm', 'gong', ''];
    for (let k = 0; k < 3; k++) drawChantSlot(ctx, { x: 1000, y: 150 + 110 * k, index: k, chant: ch[k], selected: false });
    drawButton(ctx, { x: 260, y: 610, w: 200, h: 70, label: '開演', selected: false });
  }

  function guidePage5(ctx) { // 1000×500
    // 上: 紅區表演 → ×2
    const M = 1.7;
    scaled(ctx, 500, 120, M, () => drawShowMonster(ctx, { x: 0, y: 0, species: 'bee', level: 0, rage: 88, redLow: 80, marks: 0, mode: 'roam', performing: true, performT: 0.2, performDur: 0.5, fx: 'none', move: 'walk', dir: 1 }));
    scaled(ctx, 640, 70, M, () => drawFloatText(ctx, { x: 0, y: 0, text: '+4 ×2', kind: 'redGold', t: 0.15, dur: 1 }));
    ctx.strokeStyle = P.panelLine; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(40, 225); ctx.lineTo(960, 225); ctx.stroke();
    // 下左: 怒氣滿、4 個標記
    scaled(ctx, 230, 380, M, () => drawShowMonster(ctx, { x: 0, y: 0, species: 'bee', level: 0, rage: 100, redLow: 80, marks: 4, markLeft: 2.5, markDur: 4, mode: 'roam', fx: 'none', move: 'walk', dir: 1 }));
    arrow(ctx, 340, 380, 520, 380, '#ffffff', 5, 18);
    // 下右: 同一隻衝去撞圍欄(沒有標記)
    ctx.save();
    ctx.fillStyle = P.stands; ctx.fillRect(560, 250, 420, 70);
    scaled(ctx, 770, 284, 1, () => {
      drawVisitor(ctx, { x: -120, y: 0, side: 'top', mode: 'watch' });
      drawVisitor(ctx, { x: 0, y: 0, side: 'top', mode: 'watch' });
      drawVisitor(ctx, { x: 120, y: 0, side: 'top', mode: 'watch' });
    });
    drawFence(ctx, { x: 770, y: 332, side: 'top', broken: false });
    drawFence(ctx, { x: 634, y: 332, side: 'top', broken: false });
    drawFence(ctx, { x: 906, y: 332, side: 'top', broken: false });
    ctx.restore();
    scaled(ctx, 770, 400, M, () => drawShowMonster(ctx, { x: 0, y: 0, species: 'bee', level: 0, rage: 100, redLow: 80, marks: 0, mode: 'charge', chargeT: 0.6, chargeDur: 1.5, fx: 'none', move: 'walk', dir: 1 }));
    // 打叉
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = P.outline; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(880, 380); ctx.lineTo(940, 440); ctx.moveTo(940, 380); ctx.lineTo(880, 440); ctx.stroke();
    ctx.strokeStyle = P.danger; ctx.lineWidth = 8; ctx.stroke();
    ctx.restore();
  }

  function guidePage6(ctx) { // 1000×500
    const cx = 420, cy = 250, R = 170;
    const nodes = [
      { a: -Math.PI / 2, label: '地下城' }, { a: 0, label: '布置' },
      { a: Math.PI / 2, label: '表演' }, { a: Math.PI, label: '商店' }];
    // 環狀箭頭
    for (let i = 0; i < 4; i++) {
      const a1 = nodes[i].a + 0.38, a2 = nodes[(i + 1) % 4].a - 0.38 + (i === 3 ? TAU : 0);
      ctx.save(); ctx.strokeStyle = '#c8b8ff'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(cx, cy, R, a1, a2 - 0.08); ctx.stroke(); ctx.restore();
      arrow(ctx, cx + Math.cos(a2 - 0.12) * R, cy + Math.sin(a2 - 0.12) * R, cx + Math.cos(a2) * R, cy + Math.sin(a2) * R, '#c8b8ff', 5, 18);
    }
    nodes.forEach((nd, i) => {
      const x = cx + Math.cos(nd.a) * R, y = cy + Math.sin(nd.a) * R;
      circle(ctx, x, y, 48); ctx.fillStyle = P.panel2; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#c8b8ff'; ctx.stroke();
      if (i === 0) { drawTamer(ctx, { x: x - 12, y: y - 8, facing: 2, weapon: 'club' }); speciesBody(ctx, 'bee', x + 22, y - 4, 13, -1); }
      else if (i === 1) { cardIcon(ctx, 'shrink', x - 14, y - 10, 30); chantIcon(ctx, 'alarm', x + 16, y - 10, 30); }
      else if (i === 2) { ctx.fillStyle = P.showFloor; ctx.fillRect(x - 32, y - 28, 64, 34); ctx.fillStyle = P.arena; ctx.fillRect(x - 18, y - 28, 5, 34); ctx.fillRect(x + 13, y - 28, 5, 34); speciesBody(ctx, 'slug', x, y - 10, 9, 1); }
      else { coin(ctx, x - 10, y - 12, 13); coin(ctx, x + 12, y - 6, 11); }
      shortLabel(ctx, nd.label, x, y + 26);
    });
    text(ctx, '×5 天', cx, cy, 40, '#ffffff', 'center', true, 6);
    // 表演格旁: 名聲往上加
    const sx = cx + 90, sy = cy + R - 10;
    for (let i = 0; i < 3; i++) { repStar(ctx, sx + i * 22, sy - i * 22, 11); }
    arrow(ctx, sx + 66, sy - 30, sx + 80, sy - 70, P.rep, 4, 12);
    // 終點: 結算星數
    arrow(ctx, 690, 250, 760, 250, '#ffffff', 5, 18);
    rr(ctx, 770, 160, 210, 180, 14); ctx.fillStyle = P.panel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#8a7fb0'; ctx.stroke();
    shortLabel(ctx, '結算', 875, 195);
    for (let i = 0; i < 3; i++) { starPath(ctx, 820 + i * 55, 270, 24, 10); ctx.fillStyle = P.rep; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#ffffff'; ctx.stroke(); }
  }

  const GUIDE_PAGES = [
    [guidePage1, 1000, 500], [guidePage2, 1000, 500], [guidePage3, 1000, 500],
    [guidePage4, 1280, 720], [guidePage5, 1000, 500], [guidePage6, 1000, 500]];

  function drawGuidePage(ctx, state) {
    const s = obj(state);
    const page = Math.max(0, Math.min(GUIDE_PAGES.length - 1, Math.round(n(s.page))));
    const x = n(s.x), y = n(s.y), w = Math.max(10, n(s.w, 800)), h = Math.max(10, n(s.h, 400));
    const G = GUIDE_PAGES[page];
    ctx.save();
    rr(ctx, x, y, w, h, 12); ctx.fillStyle = P.bgDeep; ctx.fill();
    ctx.save();
    fitBox(ctx, x, y, w, h, G[1], G[2]);
    G[0](ctx);
    ctx.restore();
    rr(ctx, x + 1, y + 1, w - 2, h - 2, 12); ctx.lineWidth = 2; ctx.strokeStyle = P.panelLine; ctx.stroke();
    ctx.restore();
  }

  // ───────────────────────── 匯出 ─────────────────────────
  window.Art = {
    canvas: { width: 1280, height: 720 },
    palette: P,
    drawBackground, drawTile, drawFruitTree, drawFruit, drawTamer, drawWildMonster,
    drawCaptureRing, drawLasso, drawHazard, drawWeaponFx,
    drawDungeonCard, drawSpeciesCard, drawSpeciesInfo, drawTimelineSlot, drawChantSlot, drawPickerPanel,
    drawChantBadge, drawBannerFx, drawCardFx, drawArenaWall, drawShowArena, drawShowMonster,
    drawFence, drawVisitor, drawShopTab, drawShopItem, drawShopDetail, drawButton,
    drawFloatText, drawResultPanel, drawHud, drawGuidePage,
  };
})();
