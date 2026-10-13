// 連鎖機關秀 — 美術(Canvas 2D 幾何繪製, 零外部資源)
// 契約見 interface.json 與 style.md。所有 x,y 皆為物件中心(drawButton 例外: 左上角)。
(function () {
  'use strict';

  var W = 720, H = 1280;
  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';
  var TAU = Math.PI * 2;

  // ---------- 色票 ----------
  var palette = {
    bg: '#14161c',
    hudBg: '#0d0f14',
    panel: '#1f232d',
    panelHi: '#2a303c',
    text: '#f2f2f2',
    textDim: '#9aa3b2',
    ink: '#0b0c10',
    cursor: '#2ee6c8',      // 玩家游標 / 可操作 / 玩家造成的(選擇框、可捕捉、打回去的飛彈、武器技)
    gold: '#f5b82e',        // 金幣(圓形硬幣)
    rep: '#ff8fd0',         // 名聲(星形)
    rage: '#ff3048',        // 規則紅: 紅區、失控標記、失控、扣名聲(只用在線、條、記號, 不填魔物本體)
    ignite: '#ff7a1a',      // 升怒(點燃): 戰鼓、火藥桶、被點燃
    douse: '#4ac8ff',       // 降怒(澆熄): 噴泉、水車、被澆熄
    gongC: '#e8c860',       // 銅鑼聲波
    rope: '#d8b070',        // 繩子
    ok: '#5fd068',          // 已開放 / 上場 / 成功
    heart: '#ff4d6a',
    // 魔物種類色(本體與牠的技能)
    fire: '#e8452a',
    water: '#3a78e0',
    thunder: '#e8e030',
    spike: '#46b84a',
    stone: '#9a9488',
    ghost: '#b060e0',
    // 地形
    lava: '#d0501c',
    pool: '#2b5a7e',
    player: '#2ee6c8'
  };

  var SPECIES = {
    fire:    { name: '火蜥蜴', main: '#e8452a', dark: '#8a2414', light: '#ffb08a', skill: '火圈' },
    water:   { name: '水母',   main: '#3a78e0', dark: '#1c3f80', light: '#b8d4ff', skill: '水彈' },
    thunder: { name: '雷鳥',   main: '#e8e030', dark: '#8a8410', light: '#fffbb0', skill: '落雷' },
    spike:   { name: '刺蝟',   main: '#46b84a', dark: '#1f6624', light: '#b8f0b0', skill: '尖刺' },
    stone:   { name: '石像鬼', main: '#9a9488', dark: '#4e4a42', light: '#d8d2c4', skill: '震波' },
    ghost:   { name: '幽靈',   main: '#b060e0', dark: '#5a2a80', light: '#e8c8ff', skill: '鬼火' }
  };
  var GADGETS = {
    drum:     { name: '戰鼓', main: '#c0503a', dark: '#5a2418', fx: 'ignite', trig: false },
    fountain: { name: '噴泉', main: '#8aa4b8', dark: '#3a4a58', fx: 'douse', trig: false },
    bait:     { name: '肉塊', main: '#d06070', dark: '#6a2a34', fx: 'none', trig: false },
    keg:      { name: '火藥桶', main: '#8a5a30', dark: '#3a2410', fx: 'ignite', trig: true },
    wheel:    { name: '水車', main: '#6a8aa0', dark: '#2a3a48', fx: 'douse', trig: true },
    gong:     { name: '銅鑼', main: '#d8a838', dark: '#6a4a10', fx: 'gong', trig: true }
  };
  var DUNGEONS = {
    cave:  { name: '濕熱洞窟', sp: ['fire', 'water'],   floor: '#4a3a30', floor2: '#55443a', wall: '#2a1f1a', wallTop: '#5e4636', card: '#3a2a22' },
    cliff: { name: '雷鳴崖',   sp: ['thunder', 'spike'], floor: '#454c58', floor2: '#505865', wall: '#22262e', wallTop: '#4e5664', card: '#262c38' },
    ruins: { name: '古代遺跡', sp: ['stone', 'ghost'],   floor: '#565040', floor2: '#615a49', wall: '#2c2820', wallTop: '#6a5e46', card: '#332e24' }
  };
  var WEAPONS = {
    club:  { name: '棍棒', desc: 'Z 敲擊 X 無' },
    sword: { name: '劍',   desc: 'Z 斬擊可打回飛彈 X 擊暈' },
    spear: { name: '長槍', desc: 'Z 長刺 X 突進' },
    whip:  { name: '長鞭', desc: 'Z 整圈抽打 X 擊飛' }
  };
  var SHOP = {
    club: WEAPONS.club, sword: WEAPONS.sword, spear: WEAPONS.spear, whip: WEAPONS.whip,
    attack:  { name: '攻擊力 +1', desc: '每次攻擊傷害 +1' },
    armor:   { name: '護甲', desc: '心 +1' },
    ropeBag: { name: '繩袋', desc: '捕獸繩 +1' }
  };

  // ---------- 正規化 ----------
  function n(v, d) { v = Number(v); return isFinite(v) ? v : (d === undefined ? 0 : d); }
  function cl(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function s(v) { return (v === undefined || v === null) ? '' : String(v); }
  function pick(v, table, def) { return Object.prototype.hasOwnProperty.call(table, v) ? v : def; }
  function st(o) { return (o && typeof o === 'object') ? o : {}; }
  function ratio(t, d) { d = n(d); if (d <= 0) return 0; return cl(n(t) / d, 0, 1); }
  function now() { return Date.now() / 1000; }

  // ---------- 小工具 ----------
  function font(size, weight) { return (weight || 'bold') + ' ' + Math.round(size) + 'px ' + FONT; }
  function text(ctx, str, x, y, o) {
    o = o || {};
    ctx.font = font(o.size || 20, o.weight);
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.base || 'middle';
    var mw = o.maxW;
    if (o.stroke) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = o.strokeW || 4;
      ctx.strokeStyle = o.stroke;
      if (mw) ctx.strokeText(str, x, y, mw); else ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = o.color || palette.text;
    if (mw) ctx.fillText(str, x, y, mw); else ctx.fillText(str, x, y);
  }
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); }
  function star(ctx, x, y, r, ri, pts) {
    pts = pts || 5; ri = ri || r * 0.45;
    ctx.beginPath();
    for (var i = 0; i < pts * 2; i++) {
      var a = -Math.PI / 2 + i * Math.PI / pts, rad = (i % 2) ? ri : r;
      if (i === 0) ctx.moveTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
      else ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath();
  }
  function coin(ctx, x, y, r) {
    circle(ctx, x, y, r); ctx.fillStyle = palette.gold; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.18); ctx.strokeStyle = '#8a5a10'; ctx.stroke();
    circle(ctx, x, y, r * 0.5); ctx.strokeStyle = '#c88a18'; ctx.lineWidth = Math.max(1, r * 0.14); ctx.stroke();
  }
  function repStar(ctx, x, y, r, fill) {
    star(ctx, x, y, r, r * 0.45);
    ctx.fillStyle = fill === false ? 'rgba(0,0,0,0)' : palette.rep; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.14); ctx.strokeStyle = fill === false ? '#6a5a66' : '#7a2a5a'; ctx.stroke();
  }
  function heartPath(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 1.3, y - r * 0.1, x - r * 0.6, y - r * 1.1, x, y - r * 0.35);
    ctx.bezierCurveTo(x + r * 0.6, y - r * 1.1, x + r * 1.3, y - r * 0.1, x, y + r * 0.9);
    ctx.closePath();
  }
  function eye(ctx, x, y, r, dx) {
    circle(ctx, x, y, r); ctx.fillStyle = '#fff'; ctx.fill();
    circle(ctx, x + (dx || 0) * r * 0.35, y, r * 0.55); ctx.fillStyle = '#111'; ctx.fill();
  }
  function arrowHead(ctx, x, y, ang, sz) {
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(ang) * sz, y + Math.sin(ang) * sz);
    ctx.lineTo(x + Math.cos(ang + 2.5) * sz, y + Math.sin(ang + 2.5) * sz);
    ctx.lineTo(x + Math.cos(ang - 2.5) * sz, y + Math.sin(ang - 2.5) * sz);
    ctx.closePath();
  }
  function hexA(hex, a) {
    var h = hex.replace('#', '');
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + cl(a, 0, 1) + ')';
  }
  function checkMark(ctx, x, y, r, color) {
    circle(ctx, x, y, r); ctx.fillStyle = color || palette.ok; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = palette.ink; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - r * 0.5, y); ctx.lineTo(x - r * 0.1, y + r * 0.4); ctx.lineTo(x + r * 0.55, y - r * 0.45);
    ctx.lineWidth = Math.max(2, r * 0.28); ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.stroke();
  }
  function crossMark(ctx, x, y, r) {
    circle(ctx, x, y, r); ctx.fillStyle = palette.rage; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = palette.ink; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - r * 0.45, y - r * 0.45); ctx.lineTo(x + r * 0.45, y + r * 0.45);
    ctx.moveTo(x + r * 0.45, y - r * 0.45); ctx.lineTo(x - r * 0.45, y + r * 0.45);
    ctx.lineWidth = Math.max(2, r * 0.28); ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.stroke();
  }
  function selFrame(ctx, x, y, w, h, r) {
    // 選擇框: 全遊戲唯一長相 = 青綠粗框 + 外側深描
    rr(ctx, x, y, w, h, r);
    ctx.lineWidth = 7; ctx.strokeStyle = palette.ink; ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = palette.cursor; ctx.stroke();
  }
  function keycap(ctx, x, y, label, w) {
    w = w || 40;
    rr(ctx, x - w / 2, y - 18, w, 36, 7);
    ctx.fillStyle = '#e8e8e8'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#555'; ctx.stroke();
    text(ctx, label, x, y + 1, { size: 20, color: '#222' });
  }

  // ---------- 魔物本體(原點中心, 半徑 r 內, 朝右; dir 由呼叫端翻) ----------
  function bodyFire(ctx, r, c) {
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-0.45 * r, 0.05 * r);
    ctx.quadraticCurveTo(-0.9 * r, 0.1 * r, -0.88 * r, -0.3 * r);
    ctx.lineWidth = 0.17 * r; ctx.strokeStyle = c.dark; ctx.stroke();
    ctx.fillStyle = c.dark;
    [[-0.32, -0.4], [-0.32, 0.4], [0.28, -0.4], [0.28, 0.4]].forEach(function (p) {
      ctx.beginPath(); ctx.ellipse(p[0] * r, p[1] * r, 0.15 * r, 0.12 * r, 0, 0, TAU); ctx.fill();
    });
    ctx.beginPath(); ctx.ellipse(0, 0, 0.6 * r, 0.38 * r, 0, 0, TAU);
    ctx.fillStyle = c.main; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = c.dark; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0.02 * r, 0.12 * r, 0.42 * r, 0.14 * r, 0, 0, TAU);
    ctx.fillStyle = c.light; ctx.fill();
    // 背上火冠
    ctx.fillStyle = '#ffd040';
    for (var i = 0; i < 3; i++) {
      var bx = (-0.3 + i * 0.25) * r;
      ctx.beginPath(); ctx.moveTo(bx - 0.09 * r, -0.33 * r); ctx.lineTo(bx, -0.62 * r); ctx.lineTo(bx + 0.09 * r, -0.33 * r); ctx.closePath(); ctx.fill();
    }
    circle(ctx, 0.6 * r, -0.04 * r, 0.3 * r); ctx.fillStyle = c.main; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = c.dark; ctx.stroke();
    eye(ctx, 0.68 * r, -0.12 * r, 0.11 * r, 1);
  }
  function bodyWater(ctx, r, c) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = c.main; ctx.lineWidth = 0.09 * r;
    for (var i = 0; i < 5; i++) {
      var tx = (-0.44 + i * 0.22) * r;
      ctx.beginPath(); ctx.moveTo(tx, 0.05 * r);
      ctx.quadraticCurveTo(tx + 0.14 * r, 0.35 * r, tx, 0.55 * r);
      ctx.quadraticCurveTo(tx - 0.14 * r, 0.72 * r, tx + 0.02 * r, 0.86 * r);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, 0.05 * r, 0.68 * r, Math.PI, 0);
    ctx.quadraticCurveTo(0.5 * r, 0.22 * r, 0.34 * r, 0.12 * r);
    ctx.quadraticCurveTo(0.17 * r, 0.24 * r, 0, 0.12 * r);
    ctx.quadraticCurveTo(-0.17 * r, 0.24 * r, -0.34 * r, 0.12 * r);
    ctx.quadraticCurveTo(-0.5 * r, 0.22 * r, -0.68 * r, 0.05 * r);
    ctx.closePath();
    ctx.fillStyle = c.main; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = c.dark; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-0.25 * r, -0.35 * r, 0.18 * r, 0.1 * r, -0.5, 0, TAU); ctx.fillStyle = c.light; ctx.fill();
    eye(ctx, 0.08 * r, -0.18 * r, 0.11 * r, 1);
    eye(ctx, 0.36 * r, -0.18 * r, 0.11 * r, 1);
  }
  function bodyThunder(ctx, r, c) {
    ctx.fillStyle = c.dark;
    [-1, 1].forEach(function (sd) {
      ctx.beginPath();
      ctx.moveTo(-0.05 * r, sd * 0.2 * r);
      ctx.lineTo(-0.55 * r, sd * 0.92 * r);
      ctx.lineTo(-0.2 * r, sd * 0.7 * r);
      ctx.lineTo(0.15 * r, sd * 0.85 * r);
      ctx.lineTo(0.2 * r, sd * 0.25 * r);
      ctx.closePath(); ctx.fill();
    });
    // 尾羽
    ctx.beginPath(); ctx.moveTo(-0.35 * r, -0.15 * r); ctx.lineTo(-0.9 * r, -0.3 * r); ctx.lineTo(-0.75 * r, 0); ctx.lineTo(-0.9 * r, 0.3 * r); ctx.lineTo(-0.35 * r, 0.15 * r); ctx.closePath();
    ctx.fillStyle = c.main; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = c.dark; ctx.stroke();
    circle(ctx, 0, 0, 0.45 * r); ctx.fillStyle = c.main; ctx.fill(); ctx.stroke();
    // 喙
    ctx.beginPath(); ctx.moveTo(0.4 * r, -0.12 * r); ctx.lineTo(0.78 * r, 0); ctx.lineTo(0.4 * r, 0.12 * r); ctx.closePath();
    ctx.fillStyle = '#ff9a20'; ctx.fill(); ctx.stroke();
    // 頭冠閃電
    ctx.beginPath(); ctx.moveTo(-0.05 * r, -0.42 * r); ctx.lineTo(0.08 * r, -0.62 * r); ctx.lineTo(0, -0.62 * r); ctx.lineTo(0.12 * r, -0.82 * r);
    ctx.lineWidth = 0.07 * r; ctx.strokeStyle = c.dark; ctx.lineCap = 'round'; ctx.stroke();
    eye(ctx, 0.22 * r, -0.12 * r, 0.12 * r, 1);
  }
  function bodySpike(ctx, r, c) {
    var k = 16;
    ctx.beginPath();
    for (var i = 0; i < k * 2; i++) {
      var a = i * Math.PI / k, rad = (i % 2) ? 0.6 * r : 0.95 * r;
      if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad); else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fillStyle = c.dark; ctx.fill();
    circle(ctx, 0, 0, 0.62 * r); ctx.fillStyle = c.main; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = c.dark; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0.25 * r, 0.08 * r, 0.32 * r, 0.3 * r, 0, 0, TAU); ctx.fillStyle = c.light; ctx.fill();
    circle(ctx, 0.52 * r, 0.1 * r, 0.08 * r); ctx.fillStyle = '#222'; ctx.fill();
    eye(ctx, 0.3 * r, -0.08 * r, 0.1 * r, 1);
  }
  function bodyStone(ctx, r, c) {
    ctx.fillStyle = c.dark;
    [-1, 1].forEach(function (sd) {
      ctx.beginPath();
      ctx.moveTo(sd * 0.35 * r, -0.2 * r);
      ctx.lineTo(sd * 0.95 * r, -0.55 * r);
      ctx.lineTo(sd * 0.85 * r, -0.05 * r);
      ctx.lineTo(sd * 0.95 * r, 0.3 * r);
      ctx.lineTo(sd * 0.35 * r, 0.25 * r);
      ctx.closePath(); ctx.fill();
    });
    // 角
    ctx.fillStyle = c.light;
    [-1, 1].forEach(function (sd) {
      ctx.beginPath(); ctx.moveTo(sd * 0.18 * r, -0.5 * r); ctx.lineTo(sd * 0.38 * r, -0.92 * r); ctx.lineTo(sd * 0.4 * r, -0.45 * r); ctx.closePath(); ctx.fill();
    });
    rr(ctx, -0.48 * r, -0.55 * r, 0.96 * r, 1.3 * r, 0.18 * r);
    ctx.fillStyle = c.main; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = c.dark; ctx.stroke();
    // 石紋
    ctx.beginPath(); ctx.moveTo(-0.48 * r, 0.2 * r); ctx.lineTo(0.48 * r, 0.2 * r); ctx.moveTo(0, 0.2 * r); ctx.lineTo(0, 0.75 * r);
    ctx.lineWidth = 2; ctx.strokeStyle = c.dark; ctx.stroke();
    // 眼(方)
    ctx.fillStyle = '#fff';
    ctx.fillRect(-0.3 * r, -0.3 * r, 0.22 * r, 0.14 * r);
    ctx.fillRect(0.08 * r, -0.3 * r, 0.22 * r, 0.14 * r);
    ctx.fillStyle = '#111';
    ctx.fillRect(-0.18 * r, -0.28 * r, 0.09 * r, 0.1 * r);
    ctx.fillRect(0.2 * r, -0.28 * r, 0.09 * r, 0.1 * r);
  }
  function bodyGhost(ctx, r, c) {
    ctx.beginPath();
    ctx.arc(0, -0.2 * r, 0.66 * r, Math.PI, 0);
    ctx.lineTo(0.66 * r, 0.62 * r);
    ctx.quadraticCurveTo(0.55 * r, 0.9 * r, 0.33 * r, 0.62 * r);
    ctx.quadraticCurveTo(0.22 * r, 0.9 * r, 0, 0.62 * r);
    ctx.quadraticCurveTo(-0.22 * r, 0.9 * r, -0.33 * r, 0.62 * r);
    ctx.quadraticCurveTo(-0.55 * r, 0.9 * r, -0.66 * r, 0.62 * r);
    ctx.closePath();
    ctx.globalAlpha *= 0.92;
    ctx.fillStyle = c.main; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = c.dark; ctx.stroke();
    ctx.globalAlpha /= 0.92;
    ctx.beginPath(); ctx.ellipse(-0.3 * r, -0.5 * r, 0.14 * r, 0.08 * r, -0.6, 0, TAU); ctx.fillStyle = c.light; ctx.fill();
    ctx.fillStyle = '#1a0a28';
    ctx.beginPath(); ctx.ellipse(0.05 * r, -0.2 * r, 0.09 * r, 0.15 * r, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0.35 * r, -0.2 * r, 0.09 * r, 0.15 * r, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0.22 * r, 0.15 * r, 0.1 * r, 0.07 * r, 0, 0, TAU); ctx.fill();
  }
  var BODY = { fire: bodyFire, water: bodyWater, thunder: bodyThunder, spike: bodySpike, stone: bodyStone, ghost: bodyGhost };
  var WHITE = { main: '#ffffff', dark: '#d8d8d8', light: '#ffffff' };

  // 畫一隻魔物本體(含落影), 中心 (x,y), 外接半徑 r
  function monsterBody(ctx, sp, x, y, r, dir, opt) {
    opt = opt || {};
    sp = pick(sp, SPECIES, 'fire');
    ctx.save();
    ctx.translate(x, y);
    if (opt.shadow !== false) {
      ctx.beginPath(); ctx.ellipse(0, r * 0.8, r * 0.6, r * 0.14, 0, 0, TAU);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
    }
    if (opt.alpha !== undefined) ctx.globalAlpha *= opt.alpha;
    ctx.scale(dir < 0 ? -1 : 1, 1);
    BODY[sp](ctx, r, opt.white ? WHITE : SPECIES[sp]);
    ctx.restore();
  }

  function stunStars(ctx, x, y, rad, sz) {
    var t = now() * 3;
    for (var i = 0; i < 3; i++) {
      var a = t + i * TAU / 3;
      star(ctx, x + Math.cos(a) * rad, y + Math.sin(a) * rad * 0.4, sz, sz * 0.45);
      ctx.fillStyle = '#fff3a0'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#6a5a10'; ctx.stroke();
    }
  }

  // ---------- 背景 ----------
  function drawBackground(ctx) {
    ctx.save();
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // ---------- 地下城格 ----------
  function drawTile(ctx, state) {
    state = st(state);
    var x = n(state.x), y = n(state.y);
    var dg = DUNGEONS[pick(state.dungeon, DUNGEONS, 'cave')];
    var kind = pick(state.kind, { wall: 1, pillar: 1, floor: 1, lava: 1, water: 1 }, 'floor');
    var room = pick(state.room, { top: 1, bottom: 1, hall: 1 }, 'top');
    var L = x - 30, T = y - 30;
    ctx.save();
    if (kind === 'wall') {
      ctx.fillStyle = dg.wall; ctx.fillRect(L, T, 60, 60);
      ctx.fillStyle = dg.wallTop; ctx.fillRect(L, T, 60, 10);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(L, T + 35); ctx.lineTo(L + 60, T + 35); ctx.moveTo(L + 30, T + 10); ctx.lineTo(L + 30, T + 35); ctx.moveTo(L + 15, T + 35); ctx.lineTo(L + 15, T + 60); ctx.moveTo(L + 45, T + 35); ctx.lineTo(L + 45, T + 60); ctx.stroke();
    } else {
      // 地板底
      ctx.fillStyle = room === 'hall' ? dg.floor2 : dg.floor;
      ctx.fillRect(L, T, 60, 60);
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1;
      ctx.strokeRect(L + 0.5, T + 0.5, 59, 59);
      if (room === 'hall') {
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        circle(ctx, x - 12, y - 12, 3); ctx.fill(); circle(ctx, x + 12, y + 12, 3); ctx.fill();
      }
      if (kind === 'pillar') {
        ctx.beginPath(); ctx.ellipse(x, y + 18, 26, 10, 0, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
        circle(ctx, x, y, 27); ctx.fillStyle = dg.wall; ctx.fill();
        circle(ctx, x, y - 4, 23); ctx.fillStyle = dg.wallTop; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke();
        circle(ctx, x - 7, y - 10, 6); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill();
      } else if (kind === 'lava') {
        ctx.fillStyle = palette.lava; ctx.fillRect(L, T, 60, 60);
        ctx.fillStyle = '#ffb030';
        ctx.beginPath(); ctx.ellipse(x - 10, y - 8, 12, 6, 0.3, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 12, y + 12, 9, 5, -0.4, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#5a1a08'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(L + 4, T + 30); ctx.lineTo(x - 4, y + 4); ctx.lineTo(x + 8, y - 6); ctx.lineTo(L + 56, T + 22); ctx.stroke();
      } else if (kind === 'water') {
        ctx.fillStyle = palette.pool; ctx.fillRect(L, T, 60, 60);
        ctx.strokeStyle = 'rgba(200,230,255,0.35)'; ctx.lineWidth = 2;
        for (var i = 0; i < 3; i++) {
          var yy = T + 14 + i * 16;
          ctx.beginPath(); ctx.moveTo(L + 8, yy); ctx.quadraticCurveTo(L + 18, yy - 5, L + 28, yy); ctx.quadraticCurveTo(L + 38, yy + 5, L + 48, yy); ctx.stroke();
        }
      }
      if (state.nest && kind !== 'pillar') {
        ctx.beginPath(); ctx.ellipse(x, y + 4, 22, 13, 0, 0, TAU);
        ctx.lineWidth = 6; ctx.strokeStyle = '#8a7040'; ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = '#c8a860'; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x, y + 4, 14, 7, 0, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
      }
    }
    ctx.restore();
  }

  // ---------- 武器小圖(原點, 朝右) ----------
  function weaponShape(ctx, wp, sc) {
    sc = sc || 1;
    ctx.lineCap = 'round';
    if (wp === 'club') {
      ctx.lineWidth = 5 * sc; ctx.strokeStyle = '#7a4a20';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18 * sc, 0); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(20 * sc, 0, 7 * sc, 5 * sc, 0, 0, TAU); ctx.fillStyle = '#a06a30'; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = '#3a2008'; ctx.stroke();
    } else if (wp === 'sword') {
      ctx.lineWidth = 4 * sc; ctx.strokeStyle = '#6a4a20';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(6 * sc, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6 * sc, -6 * sc); ctx.lineTo(6 * sc, 6 * sc); ctx.lineWidth = 3 * sc; ctx.strokeStyle = '#d8b040'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(7 * sc, -3 * sc); ctx.lineTo(24 * sc, -2 * sc); ctx.lineTo(27 * sc, 0); ctx.lineTo(24 * sc, 2 * sc); ctx.lineTo(7 * sc, 3 * sc); ctx.closePath();
      ctx.fillStyle = '#e8eef4'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#4a5260'; ctx.stroke();
    } else if (wp === 'spear') {
      ctx.lineWidth = 3 * sc; ctx.strokeStyle = '#8a6030';
      ctx.beginPath(); ctx.moveTo(-6 * sc, 0); ctx.lineTo(20 * sc, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(19 * sc, -4 * sc); ctx.lineTo(28 * sc, 0); ctx.lineTo(19 * sc, 4 * sc); ctx.closePath();
      ctx.fillStyle = '#e8eef4'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#4a5260'; ctx.stroke();
    } else {
      ctx.lineWidth = 4 * sc; ctx.strokeStyle = '#6a4a20';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(7 * sc, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(7 * sc, 0); ctx.bezierCurveTo(22 * sc, -12 * sc, 26 * sc, 10 * sc, 14 * sc, 9 * sc);
      ctx.bezierCurveTo(6 * sc, 8 * sc, 14 * sc, -4 * sc, 22 * sc, 2 * sc);
      ctx.lineWidth = 2.5 * sc; ctx.strokeStyle = '#a0603a'; ctx.stroke();
    }
  }

  // ---------- 馴獸師 ----------
  var FACE = [-Math.PI / 2, -Math.PI / 4, 0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI, -3 * Math.PI / 4];
  function drawTamer(ctx, state) {
    state = st(state);
    var x = n(state.x), y = n(state.y);
    var f = cl(Math.round(n(state.facing, 0)), 0, 7);
    var ang = FACE[f];
    var wp = pick(state.weapon, WEAPONS, 'club');
    ctx.save();
    ctx.translate(x, y);
    if (state.dashing) {
      // 突進殘影(往面向反方向)
      for (var i = 1; i <= 2; i++) {
        circle(ctx, -Math.cos(ang) * i * 6, -Math.sin(ang) * i * 6, 18);
        ctx.fillStyle = hexA(palette.cursor, 0.25 / i); ctx.fill();
      }
    }
    var blinkOff = state.blink && (Math.floor(now() * 12) % 2 === 0);
    if (blinkOff) ctx.globalAlpha *= 0.35;
    // 落影
    ctx.beginPath(); ctx.ellipse(0, 14, 16, 6, 0, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    // 武器(握在面向那側)
    ctx.save(); ctx.rotate(ang); ctx.translate(0, 9); weaponShape(ctx, wp, 1); ctx.restore();
    // 身體 = 判定圓半徑 18
    circle(ctx, 0, 0, 18);
    ctx.fillStyle = palette.cursor; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = state.dashing ? '#ffffff' : palette.ink; ctx.stroke();
    // 帽子 / 頭(朝面向偏)
    circle(ctx, Math.cos(ang) * 4, Math.sin(ang) * 4, 11);
    ctx.fillStyle = '#f4d8b0'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = palette.ink; ctx.stroke();
    // 面向鼻尖(三角)
    ctx.save(); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(15, -6); ctx.lineTo(15, 6); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = palette.ink; ctx.stroke();
    ctx.restore();
    if (state.lassoing) {
      // 腰上繩圈發亮
      ctx.beginPath(); ctx.ellipse(-Math.cos(ang) * 10, -Math.sin(ang) * 10, 8, 5, 0, 0, TAU);
      ctx.lineWidth = 3; ctx.strokeStyle = palette.rope; ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 野生魔物 ----------
  function drawWildMonster(ctx, state) {
    state = st(state);
    var x = n(state.x), y = n(state.y);
    var sp = pick(state.species, SPECIES, 'fire');
    var half = sp === 'stone' ? 55 : 45;
    var r = sp === 'stone' ? 43 : 34;
    var dir = n(state.dir, 1) < 0 ? -1 : 1;
    var maxHp = Math.max(1, n(state.maxHp, 1));
    var hp = cl(n(state.hp, maxHp), 0, maxHp);
    var stunned = n(state.stunLeft) > 0 || !!state.lassoed;
    ctx.save();
    // 施放預警: 種類色外圈
    if (state.casting && !stunned) {
      var pulse = 0.5 + 0.5 * Math.sin(now() * 18);
      circle(ctx, x, y, r + 3);
      ctx.lineWidth = 4; ctx.strokeStyle = hexA(SPECIES[sp].main, 0.5 + 0.5 * pulse); ctx.stroke();
    }
    // 殘血 = 可捕捉: 青綠虛線圈(玩家可操作色)
    if (state.weak) {
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -now() * 20;
      circle(ctx, x, y, r + 7);
      ctx.lineWidth = 3; ctx.strokeStyle = palette.cursor; ctx.stroke();
      ctx.setLineDash([]);
    }
    if (state.dashing) {
      ctx.strokeStyle = hexA(SPECIES[sp].light, 0.8); ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (var i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(x - dir * (r - 6), y + i * 12); ctx.lineTo(x - dir * (half - 2), y + i * 12); ctx.stroke();
      }
    }
    monsterBody(ctx, sp, x, y, r, dir, { white: !!state.hit });
    if (state.lassoed) {
      ctx.beginPath(); ctx.ellipse(x, y + r * 0.1, r * 0.7, r * 0.35, 0, 0, TAU);
      ctx.lineWidth = 4; ctx.strokeStyle = palette.rope; ctx.stroke();
    }
    if (stunned) stunStars(ctx, x, y - r + 2, r * 0.45, 6);
    // 血條(30% 刻度 = 殘血門檻)
    var bw = r * 1.6, by = y + half - 7;
    rr(ctx, x - bw / 2 - 1, by - 1, bw + 2, 7, 3); ctx.fillStyle = palette.ink; ctx.fill();
    ctx.fillStyle = state.weak ? palette.cursor : '#e8e8e8';
    ctx.fillRect(x - bw / 2, by, bw * hp / maxHp, 5);
    ctx.fillStyle = '#ff6a6a'; ctx.fillRect(x - bw / 2 + bw * 0.3 - 1, by - 1, 2, 7);
    ctx.restore();
  }

  // ---------- 準備捕捉 ----------
  function drawCaptureRing(ctx, state) {
    state = st(state);
    var x = n(state.x), y = n(state.y);
    var p = ratio(state.t, state.dur);
    ctx.save();
    circle(ctx, x, y, 42); ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 42, -Math.PI / 2, -Math.PI / 2 + TAU * p);
    ctx.lineWidth = 6; ctx.strokeStyle = palette.cursor; ctx.lineCap = 'round'; ctx.stroke();
    rr(ctx, x - 42, y + 45, 84, 15, 6); ctx.fillStyle = 'rgba(10,12,16,0.85)'; ctx.fill();
    text(ctx, '準備捕捉', x, y + 53, { size: 14, color: palette.cursor });
    ctx.restore();
  }

  // ---------- 套索 ----------
  function drawLasso(ctx, state) {
    state = st(state);
    var x1 = n(state.x1), y1 = n(state.y1), x2 = n(state.x2), y2 = n(state.y2);
    var maxLen = Math.max(1, n(state.maxLen, 220));
    var len = n(state.len, Math.hypot(x2 - x1, y2 - y1));
    var k = cl(len / maxLen, 0, 1.2);
    var prog = cl(n(state.progress), 0, 1);
    var tl = 1 - ratio(state.t, state.limit);
    ctx.save();
    // 繩: 鬆時下垂, 繃緊時拉直變紅
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + Math.max(0, (0.7 - k)) * 70;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.lineCap = 'round';
    ctx.lineWidth = 7; ctx.strokeStyle = palette.ink; ctx.stroke();
    ctx.lineWidth = k > 0.8 ? 5 : 4;
    ctx.strokeStyle = k > 0.8 ? palette.rage : palette.rope;
    if (k > 0.8) ctx.setLineDash([10, 5]);
    ctx.stroke(); ctx.setLineDash([]);
    // 繞圈進度環(青綠, 玩家要完成的)
    circle(ctx, x2, y2, 52); ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x2, y2, 52, -Math.PI / 2, -Math.PI / 2 + TAU * prog);
    ctx.lineWidth = 6; ctx.strokeStyle = palette.cursor; ctx.stroke();
    // 時限環(外側細白, 剩 30% 轉紅)
    ctx.beginPath(); ctx.arc(x2, y2, 60, -Math.PI / 2, -Math.PI / 2 + TAU * tl);
    ctx.lineWidth = 3; ctx.strokeStyle = tl < 0.3 ? palette.rage : 'rgba(255,255,255,0.85)'; ctx.stroke();
    ctx.restore();
  }

  // ---------- 魔物技能 ----------
  var HZ_SP = { firering: 'fire', waterball: 'water', thunder: 'thunder', quake: 'stone', spike: 'spike', wisp: 'ghost' };
  function drawHazard(ctx, state) {
    state = st(state);
    var x = n(state.x), y = n(state.y);
    var kind = pick(state.kind, HZ_SP, 'firering');
    var phase = pick(state.phase, { warn: 1, active: 1, fly: 1 }, 'active');
    var c = SPECIES[HZ_SP[kind]];
    var R = Math.max(0, n(state.radius, 20));
    var p = ratio(state.t, state.dur);
    var ang = n(state.angle);
    var refl = !!state.reflected;
    ctx.save();
    if (kind === 'firering' || kind === 'thunder') {
      if (phase === 'warn') {
        // 字典: 虛線外框 + 由中心長大的填色, 填滿 = 生效
        circle(ctx, x, y, R * p); ctx.fillStyle = hexA(c.main, 0.28); ctx.fill();
        ctx.setLineDash([12, 8]);
        circle(ctx, x, y, R - 1.5); ctx.lineWidth = 3; ctx.strokeStyle = c.main; ctx.stroke();
        ctx.setLineDash([]);
        if (kind === 'thunder') {
          ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x + 12, y); ctx.moveTo(x, y - 12); ctx.lineTo(x, y + 12);
          ctx.lineWidth = 2; ctx.strokeStyle = c.main; ctx.stroke();
        }
      } else {
        var a = 1 - p * 0.6;
        circle(ctx, x, y, R); ctx.fillStyle = hexA(c.main, 0.5 * a); ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = hexA(c.light, a); ctx.stroke();
        if (kind === 'firering') {
          ctx.fillStyle = hexA('#ffd040', 0.8 * a);
          for (var i = 0; i < 12; i++) {
            var fa = i * TAU / 12 + p * 1.5;
            var fx = x + Math.cos(fa) * (R - 14), fy = y + Math.sin(fa) * (R - 14);
            ctx.beginPath(); ctx.moveTo(fx - 6, fy + 4); ctx.lineTo(fx, fy - 12); ctx.lineTo(fx + 6, fy + 4); ctx.closePath(); ctx.fill();
          }
        } else {
          circle(ctx, x, y, R * 0.5); ctx.fillStyle = hexA('#ffffff', 0.6 * a); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x + 6, y - R); ctx.lineTo(x - 8, y - R * 0.45); ctx.lineTo(x + 6, y - R * 0.35); ctx.lineTo(x - 4, y);
          ctx.lineWidth = 6; ctx.strokeStyle = hexA('#ffffff', a); ctx.lineJoin = 'round'; ctx.stroke();
          ctx.lineWidth = 3; ctx.strokeStyle = hexA(c.main, a); ctx.stroke();
        }
      }
    } else if (kind === 'quake') {
      // radius = 環中線; 判定帶 = [radius−15, radius+15]
      var ro = R + 15, ri = Math.max(0, R - 15);
      ctx.beginPath(); ctx.arc(x, y, ro, 0, TAU); ctx.arc(x, y, ri, 0, TAU, true);
      ctx.fillStyle = phase === 'warn' ? hexA(c.main, 0.25) : hexA(c.main, 0.7 * (1 - p * 0.4)); ctx.fill('evenodd');
      ctx.lineWidth = 2; ctx.strokeStyle = c.dark;
      circle(ctx, x, y, ro - 1); ctx.stroke();
      if (ri > 1) { circle(ctx, x, y, ri + 1); ctx.stroke(); }
      ctx.strokeStyle = hexA('#3a3020', 0.8); ctx.lineWidth = 2;
      for (var j = 0; j < 10; j++) {
        var qa = j * TAU / 10;
        ctx.beginPath(); ctx.moveTo(x + Math.cos(qa) * (ri + 4), y + Math.sin(qa) * (ri + 4));
        ctx.lineTo(x + Math.cos(qa + 0.05) * (R), y + Math.sin(qa + 0.05) * (R));
        ctx.lineTo(x + Math.cos(qa - 0.03) * (ro - 4), y + Math.sin(qa - 0.03) * (ro - 4)); ctx.stroke();
      }
    } else {
      // 投射物(畫面邊界 = 判定半徑)
      var main = refl ? '#ffffff' : c.main, edge = refl ? palette.cursor : c.dark;
      ctx.translate(x, y);
      if (kind === 'waterball') {
        circle(ctx, 0, 0, R - 1); ctx.fillStyle = main; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = edge; ctx.stroke();
        circle(ctx, -R * 0.3, -R * 0.3, R * 0.3); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
      } else if (kind === 'spike') {
        ctx.rotate(ang);
        ctx.beginPath(); ctx.moveTo(R, 0); ctx.lineTo(-R, -R * 0.45); ctx.lineTo(-R * 0.7, 0); ctx.lineTo(-R, R * 0.45); ctx.closePath();
        ctx.fillStyle = main; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = edge; ctx.stroke();
      } else {
        var fade = (n(state.dur) > 0 && p > 0.8) ? 1 - (p - 0.8) * 3 : 1;
        ctx.globalAlpha *= cl(fade, 0.3, 1);
        ctx.save(); ctx.rotate(ang);
        ctx.beginPath(); ctx.moveTo(-R * 0.2, -R * 0.7); ctx.quadraticCurveTo(-R * 1.8, 0, -R * 0.2, R * 0.7); ctx.closePath();
        ctx.fillStyle = hexA(refl ? '#ffffff' : c.light, 0.5); ctx.fill();
        ctx.restore();
        circle(ctx, 0, 0, R - 1); ctx.fillStyle = main; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = edge; ctx.stroke();
        circle(ctx, 0, 0, R * 0.45); ctx.fillStyle = refl ? palette.cursor : c.light; ctx.fill();
      }
      if (refl) {
        ctx.setLineDash([4, 3]);
        circle(ctx, 0, 0, R + 4); ctx.lineWidth = 2; ctx.strokeStyle = palette.cursor; ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }

  // ---------- 武器特效 ----------
  function drawWeaponFx(ctx, state) {
    state = st(state);
    var x = n(state.x), y = n(state.y);
    var wp = pick(state.weapon, WEAPONS, 'club');
    var skill = state.move === 'skill';
    var shape = pick(state.shape, { arc: 1, circle: 1, line: 1, dash: 1 }, 'arc');
    var ang = n(state.angle), spread = n(state.spread, Math.PI / 2);
    var R = Math.max(0, n(state.radius, 70));
    var len = Math.max(0, n(state.length, 100)), wid = Math.max(0, n(state.width, 40));
    var p = ratio(state.t, state.dur);
    var a = 1 - p;
    var col = skill ? palette.cursor : '#ffffff';
    ctx.save();
    if (shape === 'arc') {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, R, ang - spread / 2, ang + spread / 2); ctx.closePath();
      ctx.fillStyle = hexA(col, (skill ? 0.35 : 0.25) * a); ctx.fill();
      // 揮過的前緣(由一側掃到另一側)
      var sweep = ang - spread / 2 + spread * Math.min(1, p * 2.5);
      ctx.beginPath(); ctx.arc(x, y, Math.max(0, R - 3), ang - spread / 2, sweep);
      ctx.lineWidth = skill ? 7 : 5; ctx.strokeStyle = hexA(col, a); ctx.lineCap = 'round'; ctx.stroke();
      if (skill && wp === 'sword') {
        for (var i = 0; i < 3; i++) {
          var sa = ang - spread / 3 + i * spread / 3;
          star(ctx, x + Math.cos(sa) * (R - 14), y + Math.sin(sa) * (R - 14), 7, 3);
          ctx.fillStyle = hexA('#fff3a0', a); ctx.fill();
        }
      }
      if (skill && wp === 'whip') {
        ctx.strokeStyle = hexA(col, a); ctx.lineWidth = 3;
        for (var k = -1; k <= 1; k++) {
          var wa = ang + k * spread / 3;
          var ex = x + Math.cos(wa) * (R - 6), ey = y + Math.sin(wa) * (R - 6);
          ctx.beginPath(); ctx.moveTo(x + Math.cos(wa) * (R - 40), y + Math.sin(wa) * (R - 40)); ctx.lineTo(ex, ey); ctx.stroke();
          arrowHead(ctx, ex, ey, wa, 8); ctx.fillStyle = hexA(col, a); ctx.fill();
        }
      }
    } else if (shape === 'circle') {
      circle(ctx, x, y, R); ctx.fillStyle = hexA(col, 0.2 * a); ctx.fill();
      circle(ctx, x, y, R - 3); ctx.lineWidth = 5; ctx.strokeStyle = hexA(col, a); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, R * 0.75, p * 6, p * 6 + 2.4); ctx.lineWidth = 3; ctx.stroke();
    } else if (shape === 'line') {
      ctx.translate(x, y); ctx.rotate(ang);
      var reach = len * Math.min(1, 0.4 + p * 3);
      ctx.fillStyle = hexA(col, 0.25 * a); ctx.fillRect(0, -wid / 2, len, wid);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(reach - 4, 0);
      ctx.lineWidth = 6; ctx.strokeStyle = hexA(col, a); ctx.lineCap = 'round'; ctx.stroke();
      ctx.strokeStyle = hexA(col, 0.6 * a); ctx.lineWidth = 2; ctx.strokeRect(1, -wid / 2 + 1, len - 2, wid - 2);
    } else {
      ctx.translate(x, y); ctx.rotate(ang);
      for (var d = 0; d < 4; d++) {
        circle(ctx, len * d / 4, 0, 16); ctx.fillStyle = hexA(palette.cursor, 0.25 * a * (d + 1) / 4); ctx.fill();
      }
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(len, 0); ctx.lineTo(0, 12);
      ctx.strokeStyle = hexA(palette.cursor, 0.7 * a); ctx.lineWidth = 3; ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 地下城選擇卡 ----------
  function drawDungeonCard(ctx, state) {
    state = st(state);
    var x = n(state.x), y = n(state.y);
    var key = pick(state.dungeon, DUNGEONS, 'cave');
    var dg = DUNGEONS[key];
    var open = !!state.open;
    var L = x - 300, T = y - 130;
    ctx.save();
    rr(ctx, L + 4, T + 4, 592, 252, 18);
    ctx.fillStyle = open ? dg.card : '#1a1c22'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = open ? dg.wallTop : '#3a3e48'; ctx.stroke();
    // 地形條紋(縮圖)
    ctx.save(); rr(ctx, L + 4, T + 4, 592, 252, 18); ctx.clip();
    ctx.fillStyle = open ? dg.floor : '#22252c'; ctx.fillRect(L + 4, T + 186, 592, 70);
    ctx.restore();
    text(ctx, dg.name, L + 34, T + 50, { size: 38, align: 'left', color: open ? palette.text : palette.textDim });
    // 兩種魔物
    for (var i = 0; i < 2; i++) {
      var sx = L + 400 + i * 120, sy = T + 100;
      ctx.save();
      if (!open) ctx.globalAlpha *= 0.45;
      monsterBody(ctx, dg.sp[i], sx, sy, 38, 1);
      ctx.restore();
      text(ctx, SPECIES[dg.sp[i]].name, sx, T + 158, { size: 20, color: open ? palette.text : palette.textDim });
    }
    if (open) {
      rr(ctx, L + 34, T + 90, 116, 40, 20); ctx.fillStyle = palette.ok; ctx.fill();
      text(ctx, '已開放', L + 92, T + 111, { size: 22, color: palette.ink });
    } else {
      // 鎖頭
      var lx = L + 52, ly = T + 112;
      ctx.beginPath(); ctx.arc(lx, ly - 8, 12, Math.PI, 0); ctx.lineWidth = 5; ctx.strokeStyle = palette.textDim; ctx.stroke();
      rr(ctx, lx - 17, ly - 8, 34, 26, 4); ctx.fillStyle = palette.textDim; ctx.fill();
      text(ctx, '未開放', L + 80, T + 110, { size: 22, align: 'left', color: palette.textDim });
      text(ctx, s(state.condition), L + 34, T + 220, { size: 24, align: 'left', color: palette.gold, maxW: 540 });
    }
    if (state.selected) {
      selFrame(ctx, L + 3, T + 3, 594, 254, 18);
      ctx.beginPath(); ctx.moveTo(L + 12, y - 16); ctx.lineTo(L + 26, y); ctx.lineTo(L + 12, y + 16); ctx.closePath();
      ctx.fillStyle = palette.cursor; ctx.fill();
    }
    ctx.restore();
  }

  // ---------- 布置第 1 步: 魔物卡 ----------
  function levelPips(ctx, x, y, lv, r) {
    for (var i = 0; i < 3; i++) {
      circle(ctx, x + i * (r * 2.6), y, r);
      ctx.fillStyle = i < lv ? palette.text : 'rgba(255,255,255,0.12)'; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke();
    }
  }
  function drawRosterCard(ctx, state) {
    state = st(state);
    var x = n(state.x), y = n(state.y);
    var sp = pick(state.species, SPECIES, 'fire');
    var lv = cl(Math.round(n(state.level)), 0, 3);
    var L = x - 150, T = y - 100;
    ctx.save();
    rr(ctx, L + 4, T + 4, 292, 192, 14);
    ctx.fillStyle = state.picked ? '#24382c' : palette.panel; ctx.fill();
    ctx.lineWidth = state.picked ? 3 : 2; ctx.strokeStyle = state.picked ? palette.ok : '#3a3e48'; ctx.stroke();
    monsterBody(ctx, sp, L + 80, y + 4, sp === 'stone' ? 52 : 48, 1);
    text(ctx, SPECIES[sp].name, L + 210, T + 46, { size: 26 });
    text(ctx, 'Lv ' + lv, L + 210, T + 88, { size: 24, color: palette.textDim });
    levelPips(ctx, L + 184, T + 118, lv, 6);
    if (state.picked) {
      rr(ctx, L + 168, T + 142, 88, 36, 18); ctx.fillStyle = palette.ok; ctx.fill();
      text(ctx, '上場', L + 212, T + 161, { size: 22, color: palette.ink });
    }
    if (state.selected) selFrame(ctx, L + 3, T + 3, 294, 194, 14);
    ctx.restore();
  }

  // ---------- 布置第 2 步: 格子 ----------
  function drawSetupCell(ctx, state) {
    state = st(state);
    var x = n(state.x), y = n(state.y);
    ctx.save();
    rr(ctx, x - 96, y - 86, 192, 172, 10);
    ctx.setLineDash([8, 8]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.stroke(); ctx.setLineDash([]);
    if (state.selected) {
      rr(ctx, x - 96, y - 86, 192, 172, 10); ctx.fillStyle = hexA(palette.cursor, 0.14); ctx.fill();
      selFrame(ctx, x - 96, y - 86, 192, 172, 10);
    }
    ctx.restore();
  }

  // ---------- 機關本體(原點, r=30 判定圓) ----------
  function gadgetBody(ctx, kind, fired) {
    var g = GADGETS[kind];
    var tt = now();
    if (kind === 'drum') {
      var b = fired ? -3 : 0;
      ctx.beginPath(); ctx.ellipse(0, 12, 24, 9, 0, 0, TAU); ctx.fillStyle = g.dark; ctx.fill();
      ctx.fillStyle = g.main; ctx.fillRect(-24, -10 + b, 48, 22 - b);
      ctx.strokeStyle = '#f0d0a0'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-24, -6 + b); ctx.lineTo(-8, 10); ctx.lineTo(8, -6 + b); ctx.lineTo(24, 10); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, -10 + b, 24, 9, 0, 0, TAU); ctx.fillStyle = '#f4e4c4'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = g.dark; ctx.stroke();
      ctx.strokeStyle = '#6a4020'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-20, fired ? -14 : -26); ctx.lineTo(-6, -12 + b); ctx.moveTo(20, fired ? -14 : -26); ctx.lineTo(6, -12 + b); ctx.stroke();
    } else if (kind === 'fountain') {
      ctx.beginPath(); ctx.ellipse(0, 10, 28, 14, 0, 0, TAU); ctx.fillStyle = g.main; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = g.dark; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 8, 21, 9, 0, 0, TAU); ctx.fillStyle = palette.douse; ctx.fill();
      ctx.fillStyle = g.main; ctx.fillRect(-4, -10, 8, 18);
      var h = fired ? 28 : 18;
      ctx.strokeStyle = palette.douse; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, -h);
      ctx.moveTo(0, -12); ctx.quadraticCurveTo(-14, -h + 2, -16, 4);
      ctx.moveTo(0, -12); ctx.quadraticCurveTo(14, -h + 2, 16, 4); ctx.stroke();
    } else if (kind === 'bait') {
      ctx.strokeStyle = '#f0e8d8'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-24, 14); ctx.lineTo(24, -14); ctx.stroke();
      [[-24, 14], [24, -14]].forEach(function (p) {
        circle(ctx, p[0] - 3, p[1] - 2, 4); ctx.fillStyle = '#f0e8d8'; ctx.fill();
        circle(ctx, p[0] + 3, p[1] + 2, 4); ctx.fill();
      });
      ctx.beginPath(); ctx.ellipse(0, 0, 18, 13, -0.5, 0, TAU); ctx.fillStyle = g.main; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = g.dark; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-3, -3, 8, 5, -0.5, 0, TAU); ctx.fillStyle = '#f0a0a8'; ctx.fill();
    } else if (kind === 'keg') {
      ctx.beginPath(); ctx.ellipse(0, 0, 20, 25, 0, 0, TAU); ctx.fillStyle = g.main; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = g.dark; ctx.stroke();
      ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-19, -10); ctx.lineTo(19, -10); ctx.moveTo(-19, 10); ctx.lineTo(19, 10); ctx.stroke();
      rr(ctx, -9, -5, 18, 10, 2); ctx.fillStyle = '#1a1a1a'; ctx.fill();
      text(ctx, '火', 0, 0, { size: 9, color: palette.ignite });
      // 引信
      ctx.beginPath(); ctx.moveTo(4, -24); ctx.quadraticCurveTo(10, -28, 9, -27); ctx.lineWidth = 2; ctx.strokeStyle = '#ddd'; ctx.stroke();
      circle(ctx, 10, -27, 2.5); ctx.fillStyle = palette.ignite; ctx.fill();
      if (fired) {
        star(ctx, 0, 0, 28, 14, 8); ctx.fillStyle = hexA('#ffd040', 0.85); ctx.fill();
        circle(ctx, 0, 0, 10); ctx.fillStyle = '#ffffff'; ctx.fill();
      }
    } else if (kind === 'wheel') {
      var rot = fired ? tt * 10 : 0;
      ctx.fillStyle = g.dark; ctx.fillRect(-4, 0, 8, 28);
      ctx.save(); ctx.rotate(rot);
      for (var i = 0; i < 8; i++) {
        var a = i * TAU / 8;
        ctx.save(); ctx.rotate(a);
        ctx.fillStyle = palette.douse; ctx.fillRect(16, -5, 11, 10);
        ctx.strokeStyle = g.dark; ctx.lineWidth = 1.5; ctx.strokeRect(16, -5, 11, 10);
        ctx.restore();
      }
      circle(ctx, 0, 0, 17); ctx.lineWidth = 4; ctx.strokeStyle = g.main; ctx.stroke();
      ctx.beginPath(); for (var k = 0; k < 4; k++) { var ka = k * Math.PI / 4; ctx.moveTo(Math.cos(ka) * 17, Math.sin(ka) * 17); ctx.lineTo(-Math.cos(ka) * 17, -Math.sin(ka) * 17); }
      ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      circle(ctx, 0, 0, 5); ctx.fillStyle = g.dark; ctx.fill();
      if (fired) {
        ctx.fillStyle = palette.douse;
        for (var d = 0; d < 6; d++) {
          var da = d * TAU / 6 + 0.3;
          circle(ctx, Math.cos(da) * 24, Math.sin(da) * 24, 3); ctx.fill();
        }
      }
    } else {
      // 銅鑼: 木架 + 吊著的金盤
      ctx.strokeStyle = '#6a4a28'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-24, 26); ctx.lineTo(-24, -24); ctx.lineTo(24, -24); ctx.lineTo(24, 26); ctx.stroke();
      ctx.lineWidth = 1.5; ctx.strokeStyle = '#ccc';
      ctx.beginPath(); ctx.moveTo(-8, -24); ctx.lineTo(-6, -14); ctx.moveTo(8, -24); ctx.lineTo(6, -14); ctx.stroke();
      var jig = fired ? Math.sin(tt * 60) * 2 : 0;
      circle(ctx, jig, 2, 17); ctx.fillStyle = g.main; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = g.dark; ctx.stroke();
      circle(ctx, jig, 2, 7); ctx.fillStyle = '#f4d878'; ctx.fill();
      if (fired) {
        ctx.strokeStyle = palette.gongC; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, 2, 24, -0.6, 0.6); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 2, 24, Math.PI - 0.6, Math.PI + 0.6); ctx.stroke();
      }
    }
  }

  function drawGadget(ctx, state) {
    state = st(state);
    var x = n(state.x), y = n(state.y);
    var kind = pick(state.kind, GADGETS, 'drum');
    var g = GADGETS[kind];
    var armed = g.trig ? (state.armed !== false) : true;
    var fired = !!state.fired;
    var fxCol = g.fx === 'ignite' ? palette.ignite : g.fx === 'douse' ? palette.douse : palette.gongC;
    ctx.save();
    ctx.translate(x, y);
    // 底座陰影
    ctx.beginPath(); ctx.ellipse(0, 24, 24, 6, 0, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
    // 觸發型: 判定圓(半徑 30)畫成靶圈 = 「技能打這裡會觸發」
    if (g.trig) {
      circle(ctx, 0, 0, 29); ctx.fillStyle = armed ? hexA(fxCol, 0.16) : 'rgba(0,0,0,0.25)'; ctx.fill();
      ctx.setLineDash([6, 4]);
      circle(ctx, 0, 0, 29); ctx.lineWidth = 2; ctx.strokeStyle = armed ? fxCol : 'rgba(150,150,150,0.6)'; ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.save();
    if (!armed) ctx.globalAlpha *= 0.45;
    gadgetBody(ctx, kind, fired);
    ctx.restore();
    // 冷卻: 外圈 r 35, 已恢復段用效果色, 剩餘段深色
    if (g.trig && !armed) {
      var rem = ratio(state.cdLeft, state.cdDur);
      circle(ctx, 0, 0, 35); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 35, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - rem));
      ctx.lineWidth = 4; ctx.strokeStyle = fxCol; ctx.stroke();
    }
    ctx.restore();
  }

  function drawGadgetPulse(ctx, state) {
    state = st(state);
    var x = n(state.x), y = n(state.y);
    var kind = pick(state.kind, GADGETS, 'drum');
    if (kind === 'bait') return;
    var g = GADGETS[kind];
    var R = Math.max(0, n(state.radius, 160));
    var p = ratio(state.t, state.dur);
    var a = 1 - p;
    var col = g.fx === 'ignite' ? palette.ignite : g.fx === 'douse' ? palette.douse : palette.gongC;
    ctx.save();
    // 作用範圍(整段可見)
    ctx.setLineDash([10, 8]);
    circle(ctx, x, y, R - 1); ctx.lineWidth = 2; ctx.strokeStyle = hexA(col, 0.7 * a + 0.2); ctx.stroke();
    ctx.setLineDash([]);
    circle(ctx, x, y, R); ctx.fillStyle = hexA(col, 0.1 * a); ctx.fill();
    var cr = R * Math.min(1, 0.15 + p * 1.1);
    if (g.fx === 'gong') {
      for (var i = 0; i < 3; i++) {
        var rr2 = Math.min(R - 2, cr - i * 22);
        if (rr2 > 0) { circle(ctx, x, y, rr2); ctx.lineWidth = 4 - i; ctx.strokeStyle = hexA(col, a); ctx.stroke(); }
      }
    } else {
      circle(ctx, x, y, Math.min(R - 3, cr)); ctx.lineWidth = 6; ctx.strokeStyle = hexA(col, a); ctx.stroke();
      // 升 = 外擴箭頭朝上的火舌點; 降 = 水滴
      for (var k = 0; k < 8; k++) {
        var aa = k * TAU / 8;
        var px = x + Math.cos(aa) * Math.min(R - 10, cr), py = y + Math.sin(aa) * Math.min(R - 10, cr);
        if (g.fx === 'ignite') {
          ctx.beginPath(); ctx.moveTo(px - 5, py + 4); ctx.lineTo(px, py - 9); ctx.lineTo(px + 5, py + 4); ctx.closePath();
        } else {
          ctx.beginPath(); ctx.moveTo(px, py - 6); ctx.quadraticCurveTo(px + 5, py + 2, px, py + 5); ctx.quadraticCurveTo(px - 5, py + 2, px, py - 6);
        }
        ctx.fillStyle = hexA(col, a); ctx.fill();
      }
    }
    ctx.restore();
  }

  // ---------- 選擇面板 ----------
  function drawPickerPanel(ctx, state) {
    state = st(state);
    var opts = Array.isArray(state.options) ? state.options : [];
    var idx = Math.round(n(state.index));
    var L = 120, T = 240, Wd = 480;
    var Hh = 80 + 70 * opts.length;
    ctx.save();
    rr(ctx, L, T, Wd, Hh, 14);
    ctx.fillStyle = 'rgba(16,18,24,0.96)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#4a5060'; ctx.stroke();
    text(ctx, '要放什麼?', L + Wd / 2, T + 40, { size: 28 });
    for (var i = 0; i < opts.length; i++) {
      var o = st(opts[i]);
      var ry = T + 80 + 70 * i;
      var type = pick(o.type, { monster: 1, gadget: 1, clear: 1 }, 'clear');
      var can = o.affordable !== false;
      if (i === idx) { rr(ctx, L + 6, ry + 3, Wd - 12, 64, 10); ctx.fillStyle = hexA(palette.cursor, 0.12); ctx.fill(); }
      ctx.save();
      if (!can) ctx.globalAlpha *= 0.4;
      var ix = L + 44, iy = ry + 35;
      if (type === 'monster') {
        monsterBody(ctx, pick(o.key, SPECIES, 'fire'), ix, iy, 26, 1, { shadow: false });
      } else if (type === 'gadget') {
        ctx.save(); ctx.translate(ix, iy); ctx.scale(0.85, 0.85); gadgetBody(ctx, pick(o.key, GADGETS, 'drum'), false); ctx.restore();
      } else {
        circle(ctx, ix, iy, 20); ctx.lineWidth = 3; ctx.strokeStyle = palette.textDim; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ix - 9, iy - 9); ctx.lineTo(ix + 9, iy + 9); ctx.moveTo(ix + 9, iy - 9); ctx.lineTo(ix - 9, iy + 9); ctx.stroke();
      }
      var desc = s(o.desc);
      text(ctx, s(o.name), L + 84, desc ? ry + 22 : ry + 35, { size: 24, align: 'left' });
      if (desc) text(ctx, desc, L + 84, ry + 50, { size: 17, align: 'left', color: palette.textDim, weight: 'normal', maxW: 290 });
      var cost = n(o.cost);
      if (type === 'gadget' && cost > 0) {
        coin(ctx, L + Wd - 72, ry + 25, 10);
        text(ctx, String(cost), L + Wd - 22, ry + 25, { size: 22, align: 'right', color: can ? palette.gold : palette.rage });
      }
      ctx.restore();
      if (i === idx) selFrame(ctx, L + 6, ry + 3, Wd - 12, 64, 10);
    }
    ctx.restore();
  }

  // ---------- 布置資訊列 ----------
  function drawSetupInfo(ctx, state) {
    state = st(state);
    var L = 60, T = 1150;
    ctx.save();
    rr(ctx, L + 2, T + 2, 396, 116, 12); ctx.fillStyle = palette.panel; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#3a3e48'; ctx.stroke();
    coin(ctx, L + 34, T + 40, 14);
    text(ctx, '金幣 ' + Math.round(n(state.gold)), L + 58, T + 40, { size: 28, align: 'left', color: palette.gold });
    var pl = Math.round(n(state.placed)), pk = Math.round(n(state.picked));
    text(ctx, '已擺 ' + pl + ' / ' + pk, L + 22, T + 86, { size: 26, align: 'left', color: pl >= pk && pk > 0 ? palette.ok : palette.text });
    for (var i = 0; i < pk && i < 6; i++) {
      circle(ctx, L + 220 + i * 26, T + 86, 9);
      ctx.fillStyle = i < pl ? palette.ok : 'rgba(255,255,255,0.1)'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 表演場 ----------
  function drawShowArena(ctx) {
    ctx.save();
    ctx.fillStyle = '#1a1418'; ctx.fillRect(0, 120, W, H - 120);
    // 觀眾席(階梯紋)
    [[130, 250], [1020, 1140]].forEach(function (b) {
      ctx.fillStyle = '#3a2a30'; ctx.fillRect(40, b[0], 640, b[1] - b[0]);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
      for (var yy = b[0] + 30; yy < b[1]; yy += 30) { ctx.beginPath(); ctx.moveTo(40, yy); ctx.lineTo(680, yy); ctx.stroke(); }
    });
    // 場地
    ctx.fillStyle = '#7a6448'; ctx.fillRect(60, 270, 600, 720);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (var i = 0; i < 12; i++) { ctx.beginPath(); ctx.ellipse(120 + (i * 137) % 520, 320 + (i * 211) % 640, 22, 8, 0, 0, TAU); ctx.fill(); }
    circle(ctx, 360, 630, 90); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.stroke();
    ctx.lineWidth = 6; ctx.strokeStyle = '#4a3a28'; ctx.strokeRect(57, 267, 606, 726);
    ctx.restore();
  }

  // ---------- 怒氣條 + 失控標記 ----------
  function rageBar(ctx, x, y, rage, redLow, performing) {
    // (x,y) = 條中心; 90 × 12
    var L = x - 45, T = y - 6;
    var inRed = rage >= redLow;
    rr(ctx, L, T, 90, 12, 3); ctx.fillStyle = '#101216'; ctx.fill();
    // 紅區段底
    var rx = L + 90 * redLow / 100;
    ctx.fillStyle = hexA(palette.rage, 0.3); ctx.fillRect(rx, T, L + 90 - rx, 12);
    // 填色
    var fw = 90 * rage / 100;
    ctx.fillStyle = inRed ? palette.rage : (rage >= 50 ? '#f0e6d0' : '#7d8aa0');
    ctx.fillRect(L + 1, T + 2, Math.max(0, fw - 2), 8);
    if (inRed) { ctx.fillStyle = '#ffffff'; ctx.fillRect(L + 1, T + 5, Math.max(0, fw - 2), 2); }
    // 50 門檻刻度
    ctx.fillStyle = '#ffffff'; ctx.fillRect(L + 44, T, 2, 12);
    // 紅區框線
    ctx.lineWidth = 2; ctx.strokeStyle = palette.rage; ctx.strokeRect(rx, T + 1, L + 89 - rx, 10);
    rr(ctx, L, T, 90, 12, 3); ctx.lineWidth = 1.5; ctx.strokeStyle = inRed && performing ? '#ffffff' : 'rgba(0,0,0,0.8)'; ctx.stroke();
  }
  function markRow(ctx, x, y, marks, mLeft, mDur, five) {
    // 5 格: 實心紅菱 = 已有標記; 空格 = 灰點; 第 5 格紅圈 = 滿了就失控
    for (var i = 0; i < 5; i++) {
      var mx = x - 32 + i * 16;
      if (i < marks || five) {
        ctx.beginPath(); ctx.moveTo(mx, y - 6); ctx.lineTo(mx + 5, y); ctx.lineTo(mx, y + 6); ctx.lineTo(mx - 5, y); ctx.closePath();
        ctx.fillStyle = palette.rage; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      } else {
        circle(ctx, mx, y, 3); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
        if (i === 4) { circle(ctx, mx, y, 5.5); ctx.lineWidth = 1.5; ctx.strokeStyle = hexA(palette.rage, 0.8); ctx.stroke(); }
      }
    }
    if (!five && marks > 0 && mDur > 0) {
      var lx = x - 32 + (marks - 1) * 16;
      ctx.beginPath(); ctx.arc(lx, y, 7.5, -Math.PI / 2, -Math.PI / 2 + TAU * cl(mLeft / mDur, 0, 1));
      ctx.lineWidth = 1.5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    }
  }

  function drawShowMonster(ctx, state) {
    state = st(state);
    var x = n(state.x), y = n(state.y);
    var sp = pick(state.species, SPECIES, 'fire');
    var big = sp === 'stone';
    var half = big ? 60 : 50;
    var r = big ? 36 : 29;
    var by = y + (big ? 10 : 7); // 本體中心
    var lv = cl(Math.round(n(state.level)), 0, 3);
    var rage = cl(n(state.rage), 0, 100);
    var redLow = cl(n(state.redLow, 80), 0, 100);
    var marks = cl(Math.round(n(state.marks)), 0, 4);
    var mode = pick(state.mode, { roam: 1, charge: 1, loose: 1 }, 'roam');
    var dir = n(state.dir, 1) < 0 ? -1 : 1;
    var fx = pick(state.fx, { none: 1, ignited: 1, doused: 1 }, 'none');
    var fp = ratio(state.fxT, state.fxDur);
    var wild = mode !== 'roam';
    ctx.save();
    var jx = 0;
    if (mode === 'charge' && n(state.chargeT) > 0) jx = Math.sin(now() * 50) * 3;
    // 失控: 紅色鋸齒外圈
    if (wild) {
      ctx.beginPath();
      for (var i = 0; i < 24; i++) {
        var a = i * TAU / 24, rad = (i % 2) ? r + 4 : r + 11;
        var px = x + jx + Math.cos(a) * rad, py = by + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fillStyle = hexA(palette.rage, 0.35); ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = palette.rage; ctx.stroke();
    }
    // 表演: 種類色外擴環
    if (state.performing && !wild) {
      var pp = ratio(state.performT, state.performDur);
      circle(ctx, x, by, r + 2 + pp * (half - (by - y) - r - 4));
      ctx.lineWidth = 5 * (1 - pp) + 1; ctx.strokeStyle = hexA(SPECIES[sp].light, 1 - pp); ctx.stroke();
    }
    if (state.dashing) {
      ctx.strokeStyle = hexA(SPECIES[sp].light, 0.8); ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (var d = -1; d <= 1; d++) { ctx.beginPath(); ctx.moveTo(x - dir * (r - 4), by + d * 10); ctx.lineTo(x - dir * (half - 4), by + d * 10); ctx.stroke(); }
    }
    var bob = (state.performing && !wild) ? -3 * Math.sin(ratio(state.performT, state.performDur) * Math.PI) : 0;
    monsterBody(ctx, sp, x + jx, by + bob, r, dir);
    // 點燃 / 澆熄(本體上: 色調 + 方向相反的粒子)
    if (fx !== 'none' && fp < 1) {
      var a2 = 1 - fp;
      if (fx === 'ignited') {
        ctx.fillStyle = hexA(palette.ignite, a2);
        for (var f = 0; f < 3; f++) {
          var fx0 = x + (f - 1) * r * 0.6, fy0 = by - r * 0.2 - fp * 18;
          ctx.beginPath(); ctx.moveTo(fx0 - 5, fy0 + 6); ctx.quadraticCurveTo(fx0 - 4, fy0 - 4, fx0, fy0 - 12); ctx.quadraticCurveTo(fx0 + 4, fy0 - 4, fx0 + 5, fy0 + 6); ctx.closePath(); ctx.fill();
        }
        circle(ctx, x, by, r + 2); ctx.lineWidth = 3; ctx.strokeStyle = hexA(palette.ignite, a2); ctx.stroke();
      } else {
        ctx.fillStyle = hexA(palette.douse, a2);
        for (var q = 0; q < 3; q++) {
          var qx = x + (q - 1) * r * 0.6, qy = by - r * 0.4 + fp * 22;
          ctx.beginPath(); ctx.moveTo(qx, qy - 7); ctx.quadraticCurveTo(qx + 5, qy + 2, qx, qy + 5); ctx.quadraticCurveTo(qx - 5, qy + 2, qx, qy - 7); ctx.fill();
        }
        circle(ctx, x, by, r + 2); ctx.lineWidth = 3; ctx.strokeStyle = hexA(palette.douse, a2); ctx.stroke();
      }
    }
    // 頂部: 怒氣條 + 標記列
    var barY = y - half + 6;
    rageBar(ctx, x, barY, rage, redLow, !!state.performing);
    if (wild) {
      markRow(ctx, x, barY + 15, 5, 0, 0, true);
      // 亂竄剩餘(累倒倒數)
      if (mode === 'loose') {
        var lr = 1 - ratio(state.looseT, state.looseDur);
        ctx.beginPath(); ctx.arc(x, by, r + 12, -Math.PI / 2, -Math.PI / 2 + TAU * lr);
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.stroke();
      } else if (n(state.chargeT) > 0) {
        var cp = ratio(state.chargeT, state.chargeDur);
        ctx.beginPath(); ctx.arc(x, by, r + 12, -Math.PI / 2, -Math.PI / 2 + TAU * cp);
        ctx.lineWidth = 2; ctx.strokeStyle = palette.rage; ctx.stroke();
      }
    } else {
      markRow(ctx, x, barY + 15, marks, n(state.markLeft), n(state.markDur), false);
    }
    // Lv(右下角小字)
    text(ctx, 'Lv' + lv, x + half - 2, y + half - 8, { size: 15, align: 'right', stroke: palette.ink, strokeW: 3 });
    ctx.restore();
  }

  // ---------- 圍欄 ----------
  function drawFence(ctx, state) {
    state = st(state);
    var x = n(state.x), y = n(state.y);
    ctx.save();
    ctx.translate(x, y);
    if (!state.broken) {
      ctx.fillStyle = '#a07040'; ctx.fillRect(-48, -6, 96, 4); ctx.fillRect(-48, 2, 96, 4);
      ctx.fillStyle = '#6a4420';
      [-46, -16, 14, 44].forEach(function (px) { ctx.fillRect(px - 3, -8, 6, 16); });
    } else {
      ctx.fillStyle = '#a07040';
      ctx.fillRect(-48, -6, 26, 4); ctx.fillRect(-48, 2, 20, 4); ctx.fillRect(22, -6, 26, 4); ctx.fillRect(28, 2, 20, 4);
      ctx.fillStyle = '#6a4420';
      [-46, 44].forEach(function (px) { ctx.fillRect(px - 3, -8, 6, 16); });
      ctx.strokeStyle = palette.rage; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-14, -7); ctx.lineTo(-4, 0); ctx.lineTo(-12, 7); ctx.moveTo(14, -7); ctx.lineTo(4, 0); ctx.lineTo(12, 7); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 觀眾 ----------
  var VCOL = ['#e0a060', '#70a8e0', '#c080d0', '#80c880', '#e07878', '#d8c860'];
  function drawVisitor(ctx, state) {
    state = st(state);
    var x = n(state.x), y = n(state.y);
    var mode = pick(state.mode, { watch: 1, scared: 1, empty: 1 }, 'watch');
    var top = state.side !== 'bottom';
    var col = VCOL[Math.abs(Math.round(x / 100)) % VCOL.length];
    ctx.save();
    ctx.translate(x, y);
    // 座位
    rr(ctx, -24, 20, 48, 22, 6); ctx.fillStyle = '#5a3a44'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#2a1a20'; ctx.stroke();
    if (mode === 'empty') {
      rr(ctx, -20, 8, 40, 14, 5); ctx.fillStyle = '#4a2e36'; ctx.fill();
    } else if (mode === 'watch') {
      rr(ctx, -16, -8, 32, 34, 10); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = palette.ink; ctx.stroke();
      circle(ctx, 0, -22, 13); ctx.fillStyle = '#f4d8b0'; ctx.fill(); ctx.stroke();
      var ey = top ? -19 : -25;
      circle(ctx, -5, ey, 2); ctx.fillStyle = '#111'; ctx.fill(); circle(ctx, 5, ey, 2); ctx.fill();
    } else {
      // 嚇跑: 淡色、往外側跑、舉手, 頭上紅色驚嘆
      var off = top ? -6 : 6;
      ctx.globalAlpha *= 0.85;
      ctx.save(); ctx.translate(0, off); ctx.rotate(0.25);
      rr(ctx, -14, -6, 28, 30, 9); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = palette.ink; ctx.stroke();
      ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.strokeStyle = '#f4d8b0';
      ctx.beginPath(); ctx.moveTo(-12, -2); ctx.lineTo(-20, -18); ctx.moveTo(12, -2); ctx.lineTo(20, -18); ctx.stroke();
      circle(ctx, 0, -18, 12); ctx.fillStyle = '#f4d8b0'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = palette.ink; ctx.stroke();
      circle(ctx, 0, -14, 4); ctx.fillStyle = '#111'; ctx.fill();
      ctx.restore();
      ctx.globalAlpha /= 0.85;
      text(ctx, '!', 20, -30, { size: 24, color: palette.rage, stroke: palette.ink, strokeW: 3 });
    }
    ctx.restore();
  }

  // ---------- 商店 ----------
  function upgradeIcon(ctx, item, x, y) {
    if (item === 'attack') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 4); ctx.translate(-14, 0); weaponShape(ctx, 'sword', 1.1); ctx.restore();
      text(ctx, '+1', x + 16, y + 16, { size: 16, color: palette.ok, stroke: palette.ink, strokeW: 3 });
    } else if (item === 'armor') {
      heartPath(ctx, x, y, 18); ctx.fillStyle = palette.heart; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = palette.ink; ctx.stroke();
      text(ctx, '+1', x + 16, y + 16, { size: 16, color: palette.ok, stroke: palette.ink, strokeW: 3 });
    } else {
      ropeIcon(ctx, x, y, 16, true);
      text(ctx, '+1', x + 16, y + 16, { size: 16, color: palette.ok, stroke: palette.ink, strokeW: 3 });
    }
  }
  function ropeIcon(ctx, x, y, r, full) {
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, 0, 0, TAU);
    ctx.lineWidth = Math.max(2, r * 0.3); ctx.strokeStyle = full ? palette.rope : 'rgba(216,176,112,0.25)'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.55, r * 0.38, 0, 0, TAU); ctx.lineWidth = Math.max(1.5, r * 0.2); ctx.stroke();
  }
  function drawShopItem(ctx, state) {
    state = st(state);
    var x = n(state.x), y = n(state.y);
    var item = pick(state.item, SHOP, 'club');
    var info = SHOP[item];
    var isWeapon = !!WEAPONS[item];
    var owned = isWeapon && (state.owned || item === 'club');
    var can = state.affordable !== false;
    var L = x - 300, T = y - 55;
    ctx.save();
    rr(ctx, L + 3, T + 3, 594, 104, 12);
    ctx.fillStyle = state.equipped ? '#1f3530' : palette.panel; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#3a3e48'; ctx.stroke();
    ctx.save();
    if (!owned && !can) ctx.globalAlpha *= 0.45;
    if (isWeapon) { ctx.save(); ctx.translate(L + 32, y + 14); ctx.rotate(-Math.PI / 4); weaponShape(ctx, item, 1.4); ctx.restore(); }
    else upgradeIcon(ctx, item, L + 50, y);
    text(ctx, info.name, L + 100, y - 20, { size: 28, align: 'left' });
    text(ctx, info.desc, L + 100, y + 20, { size: 19, align: 'left', color: palette.textDim, weight: 'normal', maxW: 300 });
    ctx.restore();
    // 右側: 價格 / 已擁有 / 裝備中
    if (state.equipped) {
      rr(ctx, L + 470, T + 14, 112, 34, 17); ctx.fillStyle = palette.cursor; ctx.fill();
      text(ctx, '裝備中', L + 526, T + 32, { size: 20, color: palette.ink });
    }
    if (owned) {
      text(ctx, '已擁有', L + 580, y + 26, { size: 22, align: 'right', color: palette.ok });
    } else {
      coin(ctx, L + 470, y + (isWeapon ? 26 : 0), 12);
      text(ctx, String(Math.round(n(state.cost))), L + 580, y + (isWeapon ? 26 : 0), { size: 28, align: 'right', color: can ? palette.gold : palette.rage });
    }
    if (!isWeapon) {
      var lv = Math.max(0, Math.round(n(state.level)));
      text(ctx, '已買 ' + lv, L + 410, y, { size: 18, align: 'right', color: palette.textDim, weight: 'normal' });
    }
    if (state.selected) selFrame(ctx, L + 2, T + 2, 596, 106, 12);
    ctx.restore();
  }

  // ---------- 按鈕 ----------
  function drawButton(ctx, state) {
    state = st(state);
    var x = n(state.x), y = n(state.y), w = Math.max(0, n(state.w, 200)), h = Math.max(0, n(state.h, 80));
    ctx.save();
    rr(ctx, x + 3, y + 3, w - 6, h - 6, 14);
    ctx.fillStyle = state.selected ? '#1e4a44' : palette.panelHi; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#4a5060'; ctx.stroke();
    text(ctx, s(state.label), x + w / 2, y + h / 2 + 1, { size: Math.min(34, h * 0.4), maxW: w - 20 });
    if (state.selected) selFrame(ctx, x + 2, y + 2, w - 4, h - 4, 14);
    ctx.restore();
  }

  // ---------- 飄字 ----------
  var FT = {
    gold:    { col: '#f5b82e', size: 24, icon: 'coin' },
    redGold: { col: '#f5b82e', size: 30, icon: 'coin', ring: '#ff3048' },
    chain:   { col: '#ffffff', size: 32, icon: 'coin', ring: '#e8c860' },
    repDown: { col: '#ff3048', size: 24, icon: 'star' },
    capture: { col: '#2ee6c8', size: 30, icon: 'check' },
    levelUp: { col: '#5fd068', size: 28, icon: 'up' },
    coin20:  { col: '#f5b82e', size: 28, icon: 'coin' }
  };
  function drawFloatText(ctx, state) {
    state = st(state);
    var x = n(state.x), y = n(state.y);
    var k = FT[pick(state.kind, FT, 'gold')];
    var p = ratio(state.t, state.dur);
    var a = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
    var yy = y - p * 40;
    var str = s(state.text);
    ctx.save();
    ctx.globalAlpha *= cl(a, 0, 1);
    ctx.font = font(k.size);
    var mt = ctx.measureText ? ctx.measureText(str) : null;
    var tw = (mt && mt.width) ? mt.width : str.length * k.size * 0.6;
    if (!isFinite(tw)) tw = str.length * k.size * 0.6;
    if (k.ring) {
      rr(ctx, x - tw / 2 - 26, yy - k.size * 0.7, tw + 40, k.size * 1.4, k.size * 0.7);
      ctx.fillStyle = 'rgba(10,10,14,0.75)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = k.ring; ctx.stroke();
    }
    var ix = x - tw / 2 - 12;
    if (k.icon === 'coin') coin(ctx, ix, yy, k.size * 0.33);
    else if (k.icon === 'star') repStar(ctx, ix, yy, k.size * 0.38);
    else if (k.icon === 'check') checkMark(ctx, ix, yy, k.size * 0.36, palette.cursor);
    else { arrowHead(ctx, ix, yy - 2, -Math.PI / 2, k.size * 0.4); ctx.fillStyle = k.col; ctx.fill(); }
    text(ctx, str, x + 4, yy, { size: k.size, color: k.col, stroke: palette.ink, strokeW: 5 });
    ctx.restore();
  }

  // ---------- 結算 ----------
  function drawResultPanel(ctx, state) {
    state = st(state);
    var stars = cl(Math.round(n(state.stars)), 0, 3);
    var roster = Array.isArray(state.roster) ? state.roster : [];
    ctx.save();
    ctx.fillStyle = 'rgba(10,11,15,0.92)'; ctx.fillRect(0, 0, W, H);
    rr(ctx, 50, 130, 620, 1000, 24); ctx.fillStyle = palette.panel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#4a5060'; ctx.stroke();
    text(ctx, '七天巡演結束', 360, 200, { size: 42 });
    for (var i = 0; i < 3; i++) repStar(ctx, 240 + i * 120, 320, 46, i < stars);
    text(ctx, ['還沒拿到星', '一星', '二星', '三星'][stars], 360, 400, { size: 26, color: palette.rep });
    var rows = [
      ['star', '總名聲', Math.round(n(state.rep))],
      ['coin', '累計金幣', Math.round(n(state.goldEarned))],
      ['chain', '最長連鎖', Math.round(n(state.bestChain))]
    ];
    rows.forEach(function (r, j) {
      var ry = 480 + j * 72;
      if (r[0] === 'star') repStar(ctx, 140, ry, 18); else if (r[0] === 'coin') coin(ctx, 140, ry, 16);
      else { circle(ctx, 134, ry, 9); ctx.lineWidth = 4; ctx.strokeStyle = palette.gongC; ctx.stroke(); circle(ctx, 148, ry, 9); ctx.stroke(); }
      text(ctx, r[1], 180, ry, { size: 30, align: 'left' });
      text(ctx, String(r[2]), 580, ry, { size: 36, align: 'right', color: r[0] === 'star' ? palette.rep : r[0] === 'coin' ? palette.gold : palette.text });
    });
    text(ctx, '陣容', 360, 730, { size: 26, color: palette.textDim });
    var cols = Math.min(6, Math.max(1, roster.length));
    for (var k = 0; k < roster.length && k < 6; k++) {
      var rs = st(roster[k]);
      var cx = 360 + (k - (cols - 1) / 2) * 96;
      monsterBody(ctx, pick(rs.species, SPECIES, 'fire'), cx, 800, 36, 1);
      text(ctx, 'Lv' + cl(Math.round(n(rs.level)), 0, 3), cx, 858, { size: 20 });
    }
    text(ctx, '按 Z 重來', 360, 1040, { size: 32, color: palette.cursor });
    ctx.restore();
  }

  // ---------- HUD ----------
  var PHASE_TITLE = { select: '選擇地下城', setup1: '選上場魔物', setup2: '布置', show: '表演中', shop: '商店' };
  function drawHud(ctx, state) {
    state = st(state);
    var phase = pick(state.phase, { guide: 1, select: 1, dungeon: 1, setup1: 1, setup2: 1, show: 1, shop: 1, result: 1 }, 'select');
    if (phase === 'guide' || phase === 'result') return;
    ctx.save();
    ctx.fillStyle = palette.hudBg; ctx.fillRect(0, 0, W, 120);
    ctx.fillStyle = '#2a2e38'; ctx.fillRect(0, 118, W, 2);
    // 第一列: 天數 / 金幣 / 名聲 / 標題 / 計時
    text(ctx, '第 ' + Math.round(n(state.day, 1)) + '/' + Math.round(n(state.dayMax, 7)) + ' 天', 16, 28, { size: 24, align: 'left' });
    coin(ctx, 160, 28, 12);
    text(ctx, String(Math.round(n(state.gold))), 178, 28, { size: 24, align: 'left', color: palette.gold });
    repStar(ctx, 262, 28, 13);
    text(ctx, String(Math.round(n(state.rep))), 280, 28, { size: 24, align: 'left', color: palette.rep });
    var title = phase === 'dungeon' ? DUNGEONS[pick(state.dungeon, DUNGEONS, 'cave')].name : PHASE_TITLE[phase];
    text(ctx, title, 455, 28, { size: 24, color: palette.textDim });
    var tmax = n(state.timeMax);
    if (tmax > 0) {
      var tl = Math.max(0, n(state.timeLeft));
      var low = tl <= 10;
      text(ctx, String(Math.ceil(tl)), 704, 28, { size: 30, align: 'right', color: low ? palette.rage : palette.text });
      rr(ctx, 560, 50, 144, 8, 4); ctx.fillStyle = '#2a2e38'; ctx.fill();
      rr(ctx, 560, 50, 144 * cl(tl / tmax, 0, 1), 8, 4); ctx.fillStyle = low ? palette.rage : '#d0d4dc'; ctx.fill();
    }
    if (phase === 'dungeon') {
      // 心
      var mh = Math.max(0, Math.round(n(state.maxHearts, 5))), hh = cl(Math.round(n(state.hearts)), 0, mh);
      var sp = Math.min(28, 300 / Math.max(1, mh));
      for (var i = 0; i < mh && i < 30; i++) {
        heartPath(ctx, 26 + i * sp, 72, 11);
        ctx.fillStyle = i < hh ? palette.heart : 'rgba(255,255,255,0.1)'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = i < hh ? '#5a1020' : 'rgba(255,255,255,0.3)'; ctx.stroke();
      }
      // 繩
      var rm = Math.max(0, Math.round(n(state.ropeMax, 3))), rp = cl(Math.round(n(state.ropes)), 0, rm);
      var rsp = Math.min(30, 170 / Math.max(1, rm));
      for (var j = 0; j < rm && j < 20; j++) ropeIcon(ctx, 352 + j * rsp, 72, 11, j < rp);
      // 武器 + X 冷卻
      var wp = pick(state.weapon, WEAPONS, 'club');
      ctx.save(); ctx.translate(548, 80); ctx.rotate(-Math.PI / 4); weaponShape(ctx, wp, 1); ctx.restore();
      text(ctx, WEAPONS[wp].name, 590, 74, { size: 20, align: 'left' });
      var xm = n(state.xCdMax);
      if (xm > 0) {
        var xl = cl(n(state.xCdLeft), 0, xm);
        var ready = xl <= 0;
        circle(ctx, 688, 74, 15); ctx.fillStyle = ready ? palette.cursor : '#2a2e38'; ctx.fill();
        if (!ready) {
          ctx.beginPath(); ctx.moveTo(688, 74); ctx.arc(688, 74, 15, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - xl / xm)); ctx.closePath();
          ctx.fillStyle = hexA(palette.cursor, 0.45); ctx.fill();
        }
        text(ctx, 'X', 688, 75, { size: 18, color: ready ? palette.ink : palette.textDim });
      }
    }
    // 訊息列
    var msg = s(state.message);
    if (msg) {
      rr(ctx, 60, 93, 600, 24, 12); ctx.fillStyle = '#1c2028'; ctx.fill();
      text(ctx, msg, 360, 105, { size: 18, color: palette.cursor, maxW: 580 });
    }
    ctx.restore();
  }

  // ---------- 說明頁 ----------
  var GUIDE = [
    { title: '地下城', body: '方向鍵走, Z 攻擊, X 武器技' },
    { title: '收服', body: '殘血時站上去, 再繞牠一圈' },
    { title: '布置', body: '開演前擺好魔物與機關, 開演後只能看' },
    { title: '紅區', body: '紅區最賺, 標記滿 5 個就失控' },
    { title: '目標', body: '7 天內賺到越多名聲越好' }
  ];
  function label(ctx, str, x, y, col, size) {
    text(ctx, str, x, y, { size: size || 20, color: col || palette.text, stroke: palette.ink, strokeW: 4 });
  }
  function curveArrow(ctx, pts, col, w) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    ctx.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]);
    ctx.lineWidth = w || 4; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.setLineDash([10, 7]); ctx.stroke(); ctx.setLineDash([]);
    var ang = Math.atan2(pts[5] - pts[3], pts[4] - pts[2]);
    arrowHead(ctx, pts[4], pts[5], ang, 12); ctx.fillStyle = col; ctx.fill();
  }
  function tileGrid(ctx, dungeon, cols, rows, ox, oy, map) {
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var ch = map ? map[r][c] : '.';
      var kind = ch === '#' ? 'wall' : ch === 'L' ? 'lava' : ch === 'W' ? 'water' : 'floor';
      drawTile(ctx, { x: ox + c * 60 + 30, y: oy + r * 60 + 30, dungeon: dungeon, kind: kind, room: 'top', nest: false });
    }
  }

  function guide1(ctx) {
    // 虛擬框 600 × 700
    tileGrid(ctx, 'cave', 10, 7, 0, 0, [
      '##########', '#........#', '#........#', '#........#', '#.....L..#', '#........#', '##########'
    ]);
    // 火圈預警(右上), 中心火蜥蜴在施放
    drawHazard(ctx, { x: 420, y: 200, kind: 'firering', phase: 'warn', radius: 120, t: 0.3, dur: 0.5 });
    drawWildMonster(ctx, { x: 420, y: 200, species: 'fire', hp: 10, maxHp: 10, casting: true, dir: -1 });
    // 馴獸師朝右敲火蜥蜴
    drawWeaponFx(ctx, { x: 160, y: 430, weapon: 'club', move: 'normal', shape: 'arc', angle: 0, spread: 100 * Math.PI / 180, radius: 70, t: 0.08, dur: 0.2 });
    drawTamer(ctx, { x: 160, y: 430, facing: 2, weapon: 'club' });
    drawWildMonster(ctx, { x: 222, y: 430, species: 'fire', hp: 6, maxHp: 10, hit: true, dir: -1 });
    // 移動箭頭繞開火圈
    curveArrow(ctx, [140, 380, 170, 120, 270, 80], palette.cursor, 4);
    label(ctx, '避開', 240, 130, palette.fire, 20);
    // 鍵帽貼在動作旁
    keycap(ctx, 90, 300, '方向鍵', 76);
    keycap(ctx, 215, 520, 'Z', 40);
    keycap(ctx, 110, 520, 'X', 40);
    label(ctx, '武器技', 110, 560, palette.cursor, 18);
    label(ctx, '攻擊', 215, 560, '#ffffff', 18);
  }

  function guide2(ctx) {
    // 左格: 準備捕捉
    rr(ctx, 0, 0, 290, 360, 14); ctx.fillStyle = DUNGEONS.cave.floor; ctx.fill();
    drawWildMonster(ctx, { x: 145, y: 170, species: 'water', hp: 2, maxHp: 7, weak: true, dir: 1 });
    drawTamer(ctx, { x: 160, y: 190, facing: 0, weapon: 'club' });
    drawCaptureRing(ctx, { x: 145, y: 170, t: 0.4, dur: 0.8 });
    label(ctx, '① 站上去', 145, 36, palette.text, 22);
    label(ctx, '虛弱', 230, 105, palette.cursor, 18);
    // 右格: 套索繞圈
    rr(ctx, 310, 0, 290, 360, 14); ctx.fillStyle = DUNGEONS.cave.floor; ctx.fill();
    var mx = 455, my = 190;
    // 繞圈路線(順時針, 已走半圈)
    ctx.setLineDash([10, 7]); circle(ctx, mx, my, 100); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(46,230,200,0.45)'; ctx.stroke(); ctx.setLineDash([]);
    drawWildMonster(ctx, { x: mx, y: my, species: 'water', hp: 2, maxHp: 7, weak: true, lassoed: true, stunLeft: 0, stunDur: 2, dir: 1 });
    // 馴獸師在 (mx, my+100) 繞了半圈(從上方順時針到下方)
    drawLasso(ctx, { x1: mx, y1: my + 100, x2: mx, y2: my, progress: 0.5, t: 1.5, limit: 5, len: 100, maxLen: 220 });
    drawTamer(ctx, { x: mx, y: my + 100, facing: 6, weapon: 'club', lassoing: true });
    ctx.beginPath(); ctx.arc(mx, my, 100, Math.PI / 2 + 0.25, Math.PI - 0.1);
    ctx.lineWidth = 5; ctx.strokeStyle = palette.cursor; ctx.lineCap = 'round'; ctx.stroke();
    arrowHead(ctx, mx + Math.cos(Math.PI - 0.1) * 100, my + Math.sin(Math.PI - 0.1) * 100, Math.PI - 0.1 + Math.PI / 2, 12);
    ctx.fillStyle = palette.cursor; ctx.fill();
    label(ctx, '② 繞牠一圈', 455, 36, palette.text, 22);
    // 角落小圖: 繞滿 → 收服
    rr(ctx, 160, 390, 280, 200, 14); ctx.fillStyle = '#20242c'; ctx.fill();
    circle(ctx, 300, 480, 52); ctx.lineWidth = 6; ctx.strokeStyle = palette.cursor; ctx.stroke();
    ctx.save(); ctx.globalAlpha = 0.25; monsterBody(ctx, 'water', 300, 480, 34, 1, { shadow: false }); ctx.restore();
    checkMark(ctx, 300, 480, 24, palette.cursor);
    label(ctx, '收服!', 300, 565, palette.cursor, 22);
  }

  function guide3(ctx) {
    // 上: 布置畫面縮小(原座標 y 130~1280 → 0.5)
    ctx.save();
    ctx.translate(120, 0); ctx.scale(0.5, 0.5); ctx.translate(0, -130);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 130, 720, 1150); ctx.clip();
    drawShowArena(ctx);
    for (var r = 0; r < 4; r++) for (var c = 0; c < 3; c++) drawSetupCell(ctx, { x: 160 + 200 * c, y: 360 + 180 * r, selected: r === 3 && c === 2 });
    drawShowMonster(ctx, { x: 160, y: 720, species: 'fire', level: 0, rage: 40, redLow: 80, mode: 'roam', dir: 1 });
    drawShowMonster(ctx, { x: 360, y: 720, species: 'water', level: 1, rage: 40, redLow: 75, mode: 'roam', dir: 1 });
    drawGadget(ctx, { x: 160, y: 900, kind: 'drum', armed: true });
    drawShowMonster(ctx, { x: 360, y: 900, species: 'spike', level: 0, rage: 40, redLow: 80, mode: 'roam', dir: -1 });
    drawPickerPanel(ctx, { index: 1, options: [
      { type: 'monster', key: 'thunder', name: '雷鳥', cost: 0, desc: '', affordable: true },
      { type: 'gadget', key: 'keg', name: '火藥桶', cost: 10, desc: '被火、雷、震波、尖刺打中就爆炸', affordable: true },
      { type: 'gadget', key: 'gong', name: '銅鑼', cost: 20, desc: '被技能打中就讓周圍魔物立刻表演', affordable: false }
    ] });
    drawSetupInfo(ctx, { gold: 25, placed: 3, picked: 4 });
    drawButton(ctx, { x: 480, y: 1160, w: 180, h: 100, label: '開演', selected: false });
    ctx.restore();
    ctx.restore();
    // 箭頭往下
    ctx.beginPath(); ctx.moveTo(300, 590); ctx.lineTo(300, 640); ctx.lineWidth = 6; ctx.strokeStyle = palette.text; ctx.stroke();
    arrowHead(ctx, 300, 652, Math.PI / 2, 16); ctx.fillStyle = palette.text; ctx.fill();
    label(ctx, '開演', 350, 615, palette.text, 20);
    // 下: 開演後縮圖(場地 x 60~660, y 270~990 → 0.3)
    ctx.save();
    ctx.translate(210, 665); ctx.scale(0.3, 0.3); ctx.translate(-60, -270);
    ctx.save(); ctx.beginPath(); ctx.rect(60, 270, 600, 720); ctx.clip();
    drawShowArena(ctx);
    drawGadgetPulse(ctx, { x: 160, y: 900, kind: 'drum', radius: 160, t: 0.15, dur: 0.4 });
    drawGadget(ctx, { x: 160, y: 900, kind: 'drum', armed: true, fired: true });
    drawHazard(ctx, { x: 250, y: 650, kind: 'firering', phase: 'active', radius: 120, t: 0.1, dur: 0.5 });
    drawShowMonster(ctx, { x: 250, y: 650, species: 'fire', level: 0, rage: 70, redLow: 80, mode: 'roam', performing: true, performT: 0.2, performDur: 0.5, dir: 1 });
    drawShowMonster(ctx, { x: 470, y: 560, species: 'water', level: 1, rage: 55, redLow: 75, mode: 'roam', fx: 'ignited', fxT: 0.1, fxDur: 0.5, dir: -1 });
    drawShowMonster(ctx, { x: 330, y: 850, species: 'spike', level: 0, rage: 62, redLow: 80, mode: 'roam', dir: -1 });
    ctx.restore();
    ctx.lineWidth = 8; ctx.strokeStyle = '#4a5060'; ctx.strokeRect(60, 270, 600, 720);
    ctx.restore();
  }

  function guide4(ctx) {
    // 上: 紅區表演 → ×2
    rr(ctx, 0, 0, 600, 260, 14); ctx.fillStyle = '#2a2024'; ctx.fill();
    drawShowMonster(ctx, { x: 160, y: 150, species: 'thunder', level: 1, rage: 88, redLow: 75, marks: 0, mode: 'roam', performing: true, performT: 0.15, performDur: 0.5, dir: 1 });
    drawFloatText(ctx, { x: 160, y: 60, text: '+14 ×2', kind: 'redGold', t: 0.1, dur: 1 });
    // 怒氣條放大示意
    ctx.save(); ctx.translate(430, 150); ctx.scale(2.4, 2.4); rageBar(ctx, 0, 0, 88, 75, true); ctx.restore();
    label(ctx, '紅區', 511, 110, palette.rage, 22);
    label(ctx, '50', 430, 190, palette.text, 18);
    // 下左: 怒氣滿但標記 2 → 還在場上
    rr(ctx, 0, 290, 230, 330, 14); ctx.fillStyle = '#2a2024'; ctx.fill();
    drawShowMonster(ctx, { x: 115, y: 430, species: 'fire', level: 0, rage: 100, redLow: 80, marks: 2, markLeft: 2.5, markDur: 4, mode: 'roam', dir: 1 });
    checkMark(ctx, 115, 540, 20, palette.ok);
    label(ctx, '還在表演', 115, 585, palette.ok, 20);
    // 箭頭
    ctx.beginPath(); ctx.moveTo(240, 455); ctx.lineTo(275, 455); ctx.lineWidth = 5; ctx.strokeStyle = palette.text; ctx.stroke();
    arrowHead(ctx, 285, 455, 0, 12); ctx.fillStyle = palette.text; ctx.fill();
    label(ctx, '再升怒', 262, 425, palette.ignite, 16);
    // 下右: 5 標記 → 撞破圍欄撲向觀眾
    rr(ctx, 300, 290, 300, 330, 14); ctx.fillStyle = '#2a2024'; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(300, 290, 300, 330); ctx.clip();
    ctx.fillStyle = '#3a2a30'; ctx.fillRect(300, 290, 300, 110);
    drawVisitor(ctx, { x: 390, y: 340, side: 'top', mode: 'scared' });
    drawVisitor(ctx, { x: 500, y: 340, side: 'top', mode: 'watch' });
    drawFence(ctx, { x: 390, y: 405, side: 'top', broken: true });
    drawFence(ctx, { x: 500, y: 405, side: 'top', broken: false });
    ctx.fillStyle = '#7a6448'; ctx.fillRect(300, 414, 300, 206);
    drawShowMonster(ctx, { x: 400, y: 480, species: 'fire', level: 0, rage: 100, redLow: 80, marks: 0, mode: 'charge', chargeT: 1.2, chargeDur: 1.5, looseT: 0, looseDur: 6, dir: 1 });
    ctx.restore();
    crossMark(ctx, 450, 330, 18);
    label(ctx, '失控', 520, 585, palette.rage, 22);
    drawFloatText(ctx, { x: 520, y: 540, text: '名聲 -3', kind: 'repDown', t: 0.2, dur: 1 });
  }

  function guide5(ctx) {
    var cx = 300, cy = 300, R = 210;
    var nodes = [
      { a: -Math.PI / 2, name: '地下城' },
      { a: 0, name: '布置' },
      { a: Math.PI / 2, name: '表演' },
      { a: Math.PI, name: '商店' }
    ];
    // 圈箭頭
    for (var i = 0; i < 4; i++) {
      var a0 = nodes[i].a + 0.42, a1 = nodes[i].a + Math.PI / 2 - 0.42;
      ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1); ctx.lineWidth = 5; ctx.strokeStyle = palette.textDim; ctx.stroke();
      arrowHead(ctx, cx + Math.cos(a1) * R, cy + Math.sin(a1) * R, a1 + Math.PI / 2, 13); ctx.fillStyle = palette.textDim; ctx.fill();
    }
    nodes.forEach(function (nd, k) {
      var x = cx + Math.cos(nd.a) * R, y = cy + Math.sin(nd.a) * R;
      circle(ctx, x, y, 62); ctx.fillStyle = palette.panel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#4a5060'; ctx.stroke();
      if (k === 0) drawTamer(ctx, { x: x, y: y - 14, facing: 2, weapon: 'club' });
      else if (k === 1) { ctx.save(); ctx.translate(x, y - 14); ctx.scale(0.6, 0.6); gadgetBody(ctx, 'gong', false); ctx.restore(); }
      else if (k === 2) monsterBody(ctx, 'fire', x, y - 16, 24, 1);
      else coin(ctx, x, y - 14, 18);
      label(ctx, nd.name, x, y + 34, palette.text, 20);
    });
    text(ctx, '×7 天', cx, cy, { size: 44, color: palette.text });
    // 表演旁名聲星往上加
    var sx = cx + 110, sy = cy + R - 20;
    for (var j = 0; j < 3; j++) { ctx.save(); ctx.globalAlpha = 0.4 + j * 0.3; repStar(ctx, sx + j * 14, sy - j * 34, 14); ctx.restore(); }
    label(ctx, '+名聲', sx + 70, sy - 30, palette.rep, 20);
    // 終點: 結算星數
    rr(ctx, 120, 580, 360, 110, 16); ctx.fillStyle = palette.panel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = palette.rep; ctx.stroke();
    for (var k2 = 0; k2 < 3; k2++) repStar(ctx, 220 + k2 * 80, 620, 26, true);
    label(ctx, '結算', 300, 668, palette.text, 20);
    ctx.beginPath(); ctx.moveTo(cx - R * 0.72, cy + R * 0.72); ctx.quadraticCurveTo(120, 560, 150, 585); ctx.lineWidth = 4; ctx.strokeStyle = palette.rep; ctx.setLineDash([8, 6]); ctx.stroke(); ctx.setLineDash([]);
    arrowHead(ctx, 152, 588, 0.8, 11); ctx.fillStyle = palette.rep; ctx.fill();
    label(ctx, '第 7 天後', 90, 545, palette.rep, 18);
  }
  var GUIDE_DRAW = [guide1, guide2, guide3, guide4, guide5];
  var GUIDE_VIEW = [[600, 600], [600, 600], [600, 900], [600, 620], [600, 700]];

  function drawGuidePage(ctx, state) {
    state = st(state);
    var page = cl(Math.round(n(state.page)), 0, GUIDE.length - 1);
    var x = n(state.x, 0), y = n(state.y, 0), w = Math.max(1, n(state.w, W)), h = Math.max(1, n(state.h, H));
    var g = GUIDE[page];
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = palette.bg; ctx.fillRect(x, y, w, h);
    // 文字(依 interface.json: 說明頁全部文字由美術畫)
    var fs = Math.max(18, Math.min(48, w / 15));
    text(ctx, g.title, x + w / 2, y + h * 0.06, { size: fs * 1.1, color: palette.cursor });
    text(ctx, g.body, x + w / 2, y + h * 0.06 + fs * 1.4, { size: fs * 0.72, maxW: w - 40 });
    // 示意圖區
    var top = y + h * 0.06 + fs * 2.4, bottom = y + h - fs * 1.8;
    var vw = GUIDE_VIEW[page][0], vh = GUIDE_VIEW[page][1];
    var sc = Math.min((w - 40) / vw, Math.max(1, bottom - top) / vh);
    ctx.save();
    ctx.translate(x + (w - vw * sc) / 2, top + Math.max(0, (bottom - top - vh * sc) / 2));
    ctx.scale(sc, sc);
    ctx.beginPath(); ctx.rect(-10, -10, vw + 20, vh + 20); ctx.clip();
    GUIDE_DRAW[page](ctx);
    ctx.restore();
    // 頁碼 + 翻頁
    for (var i = 0; i < GUIDE.length; i++) {
      circle(ctx, x + w / 2 - 40 + i * 20, y + h - fs * 1.3, 5);
      ctx.fillStyle = i === page ? palette.cursor : 'rgba(255,255,255,0.25)'; ctx.fill();
    }
    text(ctx, page === GUIDE.length - 1 ? '按 Z 開始' : '按 Z 繼續', x + w / 2, y + h - fs * 0.6, { size: fs * 0.55, color: palette.textDim });
    ctx.restore();
  }

  window.Art = {
    canvas: { width: W, height: H },
    palette: palette,
    drawBackground: drawBackground,
    drawTile: drawTile,
    drawTamer: drawTamer,
    drawWildMonster: drawWildMonster,
    drawCaptureRing: drawCaptureRing,
    drawLasso: drawLasso,
    drawHazard: drawHazard,
    drawWeaponFx: drawWeaponFx,
    drawDungeonCard: drawDungeonCard,
    drawRosterCard: drawRosterCard,
    drawSetupCell: drawSetupCell,
    drawPickerPanel: drawPickerPanel,
    drawSetupInfo: drawSetupInfo,
    drawGadget: drawGadget,
    drawGadgetPulse: drawGadgetPulse,
    drawShowArena: drawShowArena,
    drawShowMonster: drawShowMonster,
    drawFence: drawFence,
    drawVisitor: drawVisitor,
    drawShopItem: drawShopItem,
    drawButton: drawButton,
    drawFloatText: drawFloatText,
    drawResultPanel: drawResultPanel,
    drawHud: drawHud,
    drawGuidePage: drawGuidePage
  };
})();
