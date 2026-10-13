// 失控邊緣秀 — 美術(Canvas 2D 幾何繪製, 無外部資源)
// 契約: window.Art, 函式名與 state 欄位照 interface.json; 每個函式自己 save/restore
(function () {
  'use strict';

  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC","Heiti TC",sans-serif';
  var TAU = Math.PI * 2;

  // ---------- 色票 ----------
  var palette = {
    bg: '#14101c',
    panel: '#231c30',
    panelHi: '#33294a',
    line: '#4a3f63',
    text: '#f4eee2',
    textDim: '#a89cbf',
    tamer: '#2c3e7a',      // 馴獸師外套
    tamerRim: '#ffc23a',   // 馴獸師金邊(玩家專屬色, 也是玩家攻擊 / 選取框)
    hat: '#f4ecd8',
    playerFx: '#ffffff',   // 普攻特效
    skillFx: '#ffc23a',    // 武器技特效
    reflected: '#ffc23a',  // 被打回的投射物外框
    select: '#ffc23a',     // 選擇框
    gold: '#ffd23f',
    rep: '#d6a8ff',        // 名聲星
    heart: '#ff5068',
    rope: '#d9a066',
    capture: '#7dffb0',    // 準備捕捉 / 收服
    lassoProg: '#ffc23a',  // 繞圈進度
    edge: '#ff3b6b',       // 紅區 / 失控標記 / 倍率(規則色, 只用在線、記號、字)
    ignite: '#ff8a1a',     // 升怒(點燃型、戰鼓)
    douse: '#59c8ff',      // 降怒(澆熄型、噴泉、安全閥)
    rageLow: '#8d97a8',    // 怒氣 < 50
    rageMid: '#f2b84b',    // 怒氣 50 ~ 紅區下限
    danger: '#ff3b3b',
    ok: '#6fe08a',
    gray: '#6b6478',
    fire: '#e0452a',
    water: '#2f7fe8',
    thunder: '#f0d020',
    spike: '#5fae3a',
    stone: '#8a62d0',
    ghost: '#a8f0e8'
  };

  var SPECIES = {
    fire:    { name: '火蜥蜴', main: '#e0452a', dark: '#6e1a0e', light: '#ffb070', accent: '#ffd23f' },
    water:   { name: '水母',   main: '#2f7fe8', dark: '#0f2f66', light: '#9fd0ff', accent: '#e8f6ff' },
    thunder: { name: '雷鳥',   main: '#f0d020', dark: '#5e4a00', light: '#fff5a0', accent: '#ffffff' },
    spike:   { name: '刺蝟',   main: '#5fae3a', dark: '#1f4410', light: '#b6e88a', accent: '#2d5a18' },
    stone:   { name: '石像鬼', main: '#8a62d0', dark: '#2e1c55', light: '#c9b0f5', accent: '#e9d8ff' },
    ghost:   { name: '幽靈',   main: '#a8f0e8', dark: '#2a6a66', light: '#ffffff', accent: '#2a3f55' }
  };
  var SPECIES_KEYS = ['fire', 'water', 'thunder', 'spike', 'stone', 'ghost'];
  var DUNGEONS = {
    cave:  { name: '濕熱洞窟', sp: ['fire', 'water'],
      floor: '#3b2a24', floor2: '#45322a', hall: '#2e221d', wall: '#1c1210', wallTop: '#5a3a2c', speck: '#53392d' },
    cliff: { name: '雷鳴崖', sp: ['thunder', 'spike'],
      floor: '#323c48', floor2: '#3a4553', hall: '#272f39', wall: '#141a22', wallTop: '#4d5c70', speck: '#45515f' },
    ruins: { name: '古代遺跡', sp: ['stone', 'ghost'],
      floor: '#3b3427', floor2: '#463e2e', hall: '#2d2820', wall: '#1d1810', wallTop: '#6a5a3c', speck: '#544a36' }
  };
  var WEAPONS = { club: '棍棒', sword: '劍', spear: '長槍', whip: '長鞭' };
  var GADGETS = { drum: '戰鼓', fountain: '噴泉', bait: '肉塊', valve: '安全閥' };
  var SHOP = {
    club:    { name: '棍棒', desc: 'Z 敲擊 X 無' },
    sword:   { name: '劍', desc: 'Z 斬擊可打回飛彈 X 擊暈' },
    spear:   { name: '長槍', desc: 'Z 長刺 X 突進' },
    whip:    { name: '長鞭', desc: 'Z 整圈抽打 X 擊飛' },
    attack:  { name: '攻擊力 +1', desc: '每次攻擊傷害 +1' },
    armor:   { name: '護甲 心 +1', desc: '地下城的心 +1' },
    ropeBag: { name: '繩袋 捕獸繩 +1', desc: '每天的捕獸繩 +1' }
  };

  // ---------- 正規化 ----------
  function N(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; }
  function S(v, d) { return (typeof v === 'string') ? v : (v === undefined || v === null ? d : String(v)); }
  function pick(v, obj, d) { return (typeof v === 'string' && Object.prototype.hasOwnProperty.call(obj, v)) ? v : d; }
  function oneOf(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function c01(v) { return clamp(N(v, 0), 0, 1); }
  function st(s) { return (s && typeof s === 'object') ? s : {}; }
  function spc(s) { return SPECIES[pick(s, SPECIES, 'fire')]; }
  function now() {
    if (typeof performance !== 'undefined' && performance && typeof performance.now === 'function') return performance.now();
    return Date.now();
  }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  // ---------- 繪圖小工具 ----------
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
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
  function txt(ctx, s, x, y, size, color, o) {
    o = o || {};
    ctx.font = (o.weight || 'bold') + ' ' + size + 'px ' + FONT;
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.base || 'middle';
    s = S(s, '');
    if (o.stroke !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = o.lw || Math.max(2, size / 5);
      ctx.strokeStyle = o.stroke || 'rgba(10,6,16,0.9)';
      if (o.max) ctx.strokeText(s, x, y, o.max); else ctx.strokeText(s, x, y);
    }
    ctx.fillStyle = color;
    if (o.max) ctx.fillText(s, x, y, o.max); else ctx.fillText(s, x, y);
  }
  function starPath(ctx, cx, cy, R, r, n) {
    n = n || 5;
    ctx.beginPath();
    for (var i = 0; i < n * 2; i++) {
      var a = -Math.PI / 2 + i * Math.PI / n;
      var rad = (i % 2 === 0) ? R : r;
      var px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  function coinIcon(ctx, x, y, r) {
    circle(ctx, x, y, r); ctx.fillStyle = palette.gold; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.22); ctx.strokeStyle = '#8a5a00'; ctx.stroke();
    circle(ctx, x, y, r * 0.5); ctx.strokeStyle = '#c08a10'; ctx.lineWidth = Math.max(1, r * 0.14); ctx.stroke();
  }
  function repIcon(ctx, x, y, r) {
    starPath(ctx, x, y, r, r * 0.45, 5); ctx.fillStyle = palette.rep; ctx.fill();
    ctx.lineWidth = Math.max(1.2, r * 0.16); ctx.strokeStyle = '#4a2a70'; ctx.stroke();
  }
  function heartIcon(ctx, x, y, s, full) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.42);
    ctx.bezierCurveTo(x - s * 0.9, y - s * 0.15, x - s * 0.45, y - s * 0.75, x, y - s * 0.3);
    ctx.bezierCurveTo(x + s * 0.45, y - s * 0.75, x + s * 0.9, y - s * 0.15, x, y + s * 0.42);
    ctx.closePath();
    ctx.fillStyle = full ? palette.heart : 'rgba(255,255,255,0.08)'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = full ? '#6a1020' : 'rgba(255,255,255,0.35)'; ctx.stroke();
  }
  function ropeIcon(ctx, x, y, r, full) {
    ctx.lineWidth = Math.max(2, r * 0.3);
    ctx.strokeStyle = full ? palette.rope : 'rgba(255,255,255,0.22)';
    circle(ctx, x, y, r); ctx.stroke();
    circle(ctx, x, y, r * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + r * 1.3, y + r * 0.9); ctx.stroke();
  }
  function lockIcon(ctx, x, y, s) {
    ctx.lineWidth = s * 0.16; ctx.strokeStyle = '#b8aecb';
    ctx.beginPath(); ctx.arc(x, y - s * 0.15, s * 0.3, Math.PI, 0); ctx.stroke();
    rr(ctx, x - s * 0.42, y - s * 0.15, s * 0.84, s * 0.62, s * 0.1); ctx.fillStyle = '#b8aecb'; ctx.fill();
    circle(ctx, x, y + s * 0.12, s * 0.09); ctx.fillStyle = '#2a2236'; ctx.fill();
  }
  function checkMark(ctx, x, y, s, color) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x - s * 0.12, y + s * 0.38); ctx.lineTo(x + s * 0.55, y - s * 0.4);
    ctx.lineWidth = s * 0.34; ctx.strokeStyle = '#0c1a10'; ctx.stroke();
    ctx.lineWidth = s * 0.2; ctx.strokeStyle = color || palette.ok; ctx.stroke();
  }
  function crossMark(ctx, x, y, s, color) {
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.45, y - s * 0.45); ctx.lineTo(x + s * 0.45, y + s * 0.45);
    ctx.moveTo(x + s * 0.45, y - s * 0.45); ctx.lineTo(x - s * 0.45, y + s * 0.45);
    ctx.lineWidth = s * 0.34; ctx.strokeStyle = '#1a0408'; ctx.stroke();
    ctx.lineWidth = s * 0.2; ctx.strokeStyle = color || palette.danger; ctx.stroke();
  }
  function selFrame(ctx, x, y, w, h, r) {
    // 選擇框: 金色粗框 + 外暗描(任何底上都讀得到)
    rr(ctx, x, y, w, h, r);
    ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = palette.select; ctx.stroke();
  }
  function arrowHead(ctx, x, y, ang, s, color) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.6, -s * 0.7); ctx.lineTo(-s * 0.3, 0); ctx.lineTo(-s * 0.6, s * 0.7); ctx.closePath();
    ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.stroke();
    ctx.restore();
  }
  function keycap(ctx, x, y, label, w) {
    w = w || 34;
    rr(ctx, x - w / 2, y - 15, w, 30, 6); ctx.fillStyle = '#e9e3d6'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#2a2236'; ctx.stroke();
    rr(ctx, x - w / 2, y + 9, w, 6, 3); ctx.fillStyle = '#b5ab98'; ctx.fill();
    txt(ctx, label, x, y - 1, 17, '#1c1626', { stroke: false });
  }

  // ---------- 魔物本體(以 0,0 為中心、朝右, R 為基準半徑) ----------
  function monsterBody(ctx, species, R, o) {
    o = o || {};
    var c = spc(species);
    var main = c.main, dark = c.dark, light = c.light, acc = c.accent;
    if (o.flash) { main = '#ffffff'; light = '#ffffff'; acc = '#ffffff'; dark = '#9a9aa8'; }
    if (o.gray) { main = '#7a7486'; light = '#a19bb0'; acc = '#9a94a8'; dark = '#3a3446'; }
    var eyeMode = o.eyes || 'normal'; // normal | dizzy | angry | tired
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    var sp = pick(species, SPECIES, 'fire');
    var lw = Math.max(1.5, R * 0.09);

    function eye(x, y, r) {
      if (eyeMode === 'dizzy') {
        ctx.beginPath();
        for (var i = 0; i <= 14; i++) {
          var a = i * 0.9, rad = r * (0.2 + i * 0.06);
          var px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.lineWidth = Math.max(1, r * 0.35); ctx.strokeStyle = '#1a1020'; ctx.stroke();
        return;
      }
      if (eyeMode === 'tired') {
        ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
        ctx.lineWidth = Math.max(1.2, r * 0.45); ctx.strokeStyle = '#1a1020'; ctx.stroke(); return;
      }
      circle(ctx, x, y, r); ctx.fillStyle = '#ffffff'; ctx.fill();
      circle(ctx, x + r * 0.25, y, r * 0.55); ctx.fillStyle = eyeMode === 'angry' ? '#c00018' : '#1a1020'; ctx.fill();
      if (eyeMode === 'angry') {
        ctx.beginPath(); ctx.moveTo(x - r * 1.2, y - r * 1.4); ctx.lineTo(x + r * 1.2, y - r * 0.7);
        ctx.lineWidth = Math.max(1.5, r * 0.5); ctx.strokeStyle = '#1a1020'; ctx.stroke();
      }
    }

    if (sp === 'fire') {
      // 尾巴
      ctx.beginPath(); ctx.moveTo(-R * 0.6, R * 0.05);
      ctx.quadraticCurveTo(-R * 1.25, R * 0.1, -R * 1.4, -R * 0.4);
      ctx.lineWidth = R * 0.32; ctx.strokeStyle = dark; ctx.stroke();
      ctx.lineWidth = R * 0.2; ctx.strokeStyle = main; ctx.stroke();
      // 腳
      ctx.fillStyle = dark;
      [[-0.45, 0.5], [0.4, 0.5], [-0.5, -0.45], [0.35, -0.48]].forEach(function (p) {
        ctx.beginPath(); ctx.ellipse(p[0] * R, p[1] * R, R * 0.17, R * 0.13, 0, 0, TAU); ctx.fill();
      });
      // 身體
      ctx.beginPath(); ctx.ellipse(-R * 0.05, 0, R * 0.85, R * 0.52, 0, 0, TAU);
      ctx.fillStyle = main; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = dark; ctx.stroke();
      // 背上火冠(圓頭火苗)
      for (var i = 0; i < 3; i++) {
        var fx = -R * 0.45 + i * R * 0.38, fy = -R * 0.5;
        ctx.beginPath();
        ctx.moveTo(fx - R * 0.13, fy + R * 0.08);
        ctx.quadraticCurveTo(fx - R * 0.12, fy - R * 0.22, fx, fy - R * 0.32);
        ctx.quadraticCurveTo(fx + R * 0.14, fy - R * 0.18, fx + R * 0.13, fy + R * 0.08);
        ctx.closePath(); ctx.fillStyle = acc; ctx.fill();
      }
      // 頭
      circle(ctx, R * 0.78, -R * 0.08, R * 0.42); ctx.fillStyle = main; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = dark; ctx.stroke();
      // 肚子亮帶
      ctx.beginPath(); ctx.ellipse(-R * 0.05, R * 0.18, R * 0.55, R * 0.18, 0, 0, TAU); ctx.fillStyle = light; ctx.globalAlpha *= 0.55; ctx.fill(); ctx.globalAlpha /= 0.55;
      eye(R * 0.9, -R * 0.2, R * 0.15);
    } else if (sp === 'water') {
      // 觸手
      ctx.lineWidth = R * 0.1; ctx.strokeStyle = o.flash ? '#ffffff' : light;
      for (var k = 0; k < 4; k++) {
        var tx = -R * 0.5 + k * R * 0.33;
        ctx.beginPath(); ctx.moveTo(tx, R * 0.2);
        ctx.quadraticCurveTo(tx + R * 0.15, R * 0.5, tx - R * 0.02, R * 0.72);
        ctx.quadraticCurveTo(tx - R * 0.15, R * 0.88, tx + R * 0.05, R * 0.98);
        ctx.stroke();
      }
      // 傘
      ctx.beginPath();
      ctx.moveTo(-R * 0.82, R * 0.2);
      ctx.bezierCurveTo(-R * 0.9, -R * 0.95, R * 0.9, -R * 0.95, R * 0.82, R * 0.2);
      for (var s2 = 0; s2 < 4; s2++) {
        var x0 = R * 0.82 - s2 * R * 0.41, x1 = x0 - R * 0.41;
        ctx.quadraticCurveTo((x0 + x1) / 2, R * 0.38, x1, R * 0.2);
      }
      ctx.closePath();
      ctx.fillStyle = main; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = dark; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-R * 0.3, -R * 0.4, R * 0.22, R * 0.12, -0.5, 0, TAU); ctx.fillStyle = light; ctx.fill();
      eye(-R * 0.18, -R * 0.08, R * 0.13); eye(R * 0.28, -R * 0.08, R * 0.13);
    } else if (sp === 'thunder') {
      var wingUp = o.wingUp || 0;
      // 尾羽
      ctx.beginPath(); ctx.moveTo(-R * 0.45, 0); ctx.lineTo(-R * 1.0, -R * 0.18); ctx.lineTo(-R * 0.85, R * 0.08); ctx.lineTo(-R * 1.0, R * 0.32); ctx.closePath();
      ctx.fillStyle = dark; ctx.fill();
      // 後翅
      ctx.beginPath(); ctx.moveTo(-R * 0.1, -R * 0.1);
      ctx.quadraticCurveTo(-R * 0.75, -R * (0.75 + wingUp * 0.15), -R * 0.95, -R * (0.35 + wingUp * 0.4));
      ctx.quadraticCurveTo(-R * 0.5, -R * 0.15, -R * 0.2, R * 0.15); ctx.closePath();
      ctx.fillStyle = dark; ctx.fill();
      // 身體
      circle(ctx, 0, 0, R * 0.55); ctx.fillStyle = main; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = dark; ctx.stroke();
      // 前翅
      ctx.beginPath(); ctx.moveTo(R * 0.05, -R * 0.05);
      ctx.quadraticCurveTo(-R * 0.45, -R * (0.95 + wingUp * 0.05), -R * 0.7, -R * (0.6 + wingUp * 0.3));
      ctx.quadraticCurveTo(-R * 0.35, -R * 0.2, -R * 0.15, R * 0.25); ctx.closePath();
      ctx.fillStyle = light; ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.strokeStyle = dark; ctx.stroke();
      // 喙
      ctx.beginPath(); ctx.moveTo(R * 0.48, -R * 0.12); ctx.lineTo(R * 0.92, R * 0.02); ctx.lineTo(R * 0.48, R * 0.15); ctx.closePath();
      ctx.fillStyle = '#ff9a2a'; ctx.fill(); ctx.lineWidth = lw * 0.7; ctx.strokeStyle = dark; ctx.stroke();
      // 閃電冠
      ctx.beginPath(); ctx.moveTo(R * 0.05, -R * 0.5); ctx.lineTo(R * 0.25, -R * 0.82); ctx.lineTo(R * 0.18, -R * 0.62); ctx.lineTo(R * 0.4, -R * 0.78); ctx.lineTo(R * 0.3, -R * 0.48); ctx.closePath();
      ctx.fillStyle = dark; ctx.fill();
      // 腳
      ctx.beginPath(); ctx.moveTo(-R * 0.1, R * 0.5); ctx.lineTo(-R * 0.12, R * 0.75); ctx.moveTo(R * 0.15, R * 0.5); ctx.lineTo(R * 0.17, R * 0.75);
      ctx.lineWidth = lw; ctx.strokeStyle = '#ff9a2a'; ctx.stroke();
      eye(R * 0.25, -R * 0.15, R * 0.14);
    } else if (sp === 'spike') {
      // 刺(背半圈)
      ctx.fillStyle = acc;
      for (var a = 0; a < 11; a++) {
        var ang = Math.PI * 0.72 + a * (Math.PI * 1.3 / 10);
        var bx = Math.cos(ang) * R * 0.62, by = Math.sin(ang) * R * 0.55;
        var px2 = Math.cos(ang) * R * 0.98, py2 = Math.sin(ang) * R * 0.9;
        var nx = -Math.sin(ang) * R * 0.14, ny = Math.cos(ang) * R * 0.14;
        ctx.beginPath(); ctx.moveTo(bx + nx, by + ny); ctx.lineTo(px2, py2); ctx.lineTo(bx - nx, by - ny); ctx.closePath(); ctx.fill();
      }
      // 身體
      ctx.beginPath(); ctx.ellipse(0, R * 0.05, R * 0.68, R * 0.58, 0, 0, TAU);
      ctx.fillStyle = main; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = dark; ctx.stroke();
      // 臉(淺色口鼻)
      ctx.beginPath(); ctx.ellipse(R * 0.5, R * 0.15, R * 0.3, R * 0.24, 0, 0, TAU); ctx.fillStyle = light; ctx.fill();
      circle(ctx, R * 0.78, R * 0.1, R * 0.08); ctx.fillStyle = '#1a1020'; ctx.fill();
      // 腳
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(-R * 0.3, R * 0.62, R * 0.13, R * 0.08, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(R * 0.25, R * 0.62, R * 0.13, R * 0.08, 0, 0, TAU); ctx.fill();
      eye(R * 0.38, -R * 0.1, R * 0.13);
    } else if (sp === 'stone') {
      // 摺翼
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.moveTo(-R * 0.55, -R * 0.35); ctx.lineTo(-R * 0.95, -R * 0.6); ctx.lineTo(-R * 0.9, R * 0.15); ctx.lineTo(-R * 0.55, R * 0.4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(R * 0.55, -R * 0.35); ctx.lineTo(R * 0.95, -R * 0.6); ctx.lineTo(R * 0.9, R * 0.15); ctx.lineTo(R * 0.55, R * 0.4); ctx.closePath(); ctx.fill();
      // 角
      ctx.beginPath(); ctx.moveTo(-R * 0.4, -R * 0.55); ctx.quadraticCurveTo(-R * 0.6, -R * 0.85, -R * 0.35, -R * 0.95); ctx.lineTo(-R * 0.2, -R * 0.6); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(R * 0.4, -R * 0.55); ctx.quadraticCurveTo(R * 0.6, -R * 0.85, R * 0.35, -R * 0.95); ctx.lineTo(R * 0.2, -R * 0.6); ctx.closePath(); ctx.fill();
      // 身體(方塊)
      rr(ctx, -R * 0.62, -R * 0.65, R * 1.24, R * 1.3, R * 0.22);
      ctx.fillStyle = main; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = dark; ctx.stroke();
      // 石紋
      ctx.beginPath(); ctx.moveTo(-R * 0.62, R * 0.15); ctx.lineTo(R * 0.62, R * 0.15); ctx.moveTo(-R * 0.1, R * 0.15); ctx.lineTo(-R * 0.1, R * 0.65);
      ctx.lineWidth = lw * 0.6; ctx.strokeStyle = dark; ctx.stroke();
      // 眼(發光)
      if (eyeMode === 'normal' || eyeMode === 'angry') {
        ctx.fillStyle = eyeMode === 'angry' ? '#ff4060' : acc;
        rr(ctx, -R * 0.38, -R * 0.32, R * 0.26, R * 0.14, R * 0.05); ctx.fill();
        rr(ctx, R * 0.12, -R * 0.32, R * 0.26, R * 0.14, R * 0.05); ctx.fill();
      } else { eye(-R * 0.25, -R * 0.25, R * 0.13); eye(R * 0.25, -R * 0.25, R * 0.13); }
      // 腳
      ctx.fillStyle = dark;
      rr(ctx, -R * 0.5, R * 0.6, R * 0.32, R * 0.2, R * 0.06); ctx.fill();
      rr(ctx, R * 0.18, R * 0.6, R * 0.32, R * 0.2, R * 0.06); ctx.fill();
    } else { // ghost
      var ga = ctx.globalAlpha;
      ctx.globalAlpha = ga * (o.flash ? 1 : 0.88);
      ctx.beginPath();
      ctx.moveTo(-R * 0.68, R * 0.62);
      ctx.lineTo(-R * 0.68, -R * 0.1);
      ctx.arc(0, -R * 0.1, R * 0.68, Math.PI, 0);
      ctx.lineTo(R * 0.68, R * 0.62);
      for (var w = 0; w < 3; w++) {
        var gx0 = R * 0.68 - w * R * 0.4533, gx1 = gx0 - R * 0.4533;
        ctx.quadraticCurveTo((gx0 + gx1) / 2, R * 0.95, gx1, R * 0.62);
      }
      ctx.closePath();
      ctx.fillStyle = main; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = dark; ctx.stroke();
      ctx.globalAlpha = ga;
      if (eyeMode === 'normal' || eyeMode === 'angry') {
        ctx.fillStyle = eyeMode === 'angry' ? '#c00018' : acc;
        ctx.beginPath(); ctx.ellipse(-R * 0.08, -R * 0.15, R * 0.11, R * 0.17, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(R * 0.3, -R * 0.15, R * 0.11, R * 0.17, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(R * 0.12, R * 0.18, R * 0.09, R * 0.06, 0, 0, TAU); ctx.fill();
      } else { eye(-R * 0.08, -R * 0.15, R * 0.13); eye(R * 0.3, -R * 0.15, R * 0.13); }
    }
  }

  // 暈眩星星(繞頭頂一圈)
  function stunStars(ctx, x, y, rx, n) {
    var t = now() / 600;
    for (var i = 0; i < (n || 3); i++) {
      var a = t + i * TAU / (n || 3);
      var sx = x + Math.cos(a) * rx, sy = y + Math.sin(a) * rx * 0.35;
      starPath(ctx, sx, sy, 5.5, 2.4, 5);
      ctx.fillStyle = '#fff36a'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#4a3a00'; ctx.stroke();
    }
  }
  // 虛弱記號: 冷汗水滴 + 頭上下彎弧
  function weakMark(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.quadraticCurveTo(x + s * 0.75, y + s * 0.1, x, y + s * 0.55);
    ctx.quadraticCurveTo(x - s * 0.75, y + s * 0.1, x, y - s);
    ctx.closePath();
    ctx.fillStyle = '#bfe6ff'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#1d4f7a'; ctx.stroke();
  }

  // ---------- 武器圖示(以握柄為原點朝右) ----------
  function weaponShape(ctx, weapon, len) {
    var w = pick(weapon, WEAPONS, 'club');
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (w === 'club') {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * 0.6, 0); ctx.lineWidth = len * 0.16; ctx.strokeStyle = '#6a4020'; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(len * 0.72, 0, len * 0.28, len * 0.17, 0, 0, TAU); ctx.fillStyle = '#9a6a3a'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#3a2210'; ctx.stroke();
    } else if (w === 'sword') {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * 0.22, 0); ctx.lineWidth = len * 0.12; ctx.strokeStyle = '#6a4020'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(len * 0.22, -len * 0.16); ctx.lineTo(len * 0.22, len * 0.16); ctx.lineWidth = len * 0.08; ctx.strokeStyle = '#c9a040'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(len * 0.25, -len * 0.07); ctx.lineTo(len * 0.88, -len * 0.05); ctx.lineTo(len, 0); ctx.lineTo(len * 0.88, len * 0.05); ctx.lineTo(len * 0.25, len * 0.07); ctx.closePath();
      ctx.fillStyle = '#e4ecf4'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#4a5868'; ctx.stroke();
    } else if (w === 'spear') {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * 0.8, 0); ctx.lineWidth = len * 0.07; ctx.strokeStyle = '#8a5a30'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(len * 0.76, -len * 0.09); ctx.lineTo(len, 0); ctx.lineTo(len * 0.76, len * 0.09); ctx.closePath();
      ctx.fillStyle = '#e4ecf4'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#4a5868'; ctx.stroke();
    } else { // whip
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * 0.25, 0); ctx.lineWidth = len * 0.12; ctx.strokeStyle = '#5a3418'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(len * 0.25, 0);
      ctx.bezierCurveTo(len * 0.55, -len * 0.3, len * 0.7, len * 0.3, len, -len * 0.05);
      ctx.lineWidth = len * 0.06; ctx.strokeStyle = '#a0603a'; ctx.stroke();
    }
  }

  // ---------- 機關本體(以 0,0 為中心, s = 半邊長 40 時的比例) ----------
  function gadgetShape(ctx, kind, s, fired, spent) {
    var k = pick(kind, GADGETS, 'drum');
    var u = s / 40;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // 底座(機關類別層: 方形底座, 有別於圓形 / 有臉的魔物)
    rr(ctx, -34 * u, 18 * u, 68 * u, 16 * u, 4 * u); ctx.fillStyle = '#2b2436'; ctx.fill();
    ctx.lineWidth = 2 * u; ctx.strokeStyle = '#7a6e8e'; ctx.stroke();
    var bump = fired ? -5 * u : 0;
    if (k === 'drum') {
      ctx.save(); ctx.translate(0, bump);
      rr(ctx, -24 * u, -12 * u, 48 * u, 32 * u, 6 * u); ctx.fillStyle = '#b8322a'; ctx.fill(); ctx.lineWidth = 2.5 * u; ctx.strokeStyle = '#4a0e0a'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-24 * u, -4 * u); ctx.lineTo(-8 * u, 12 * u); ctx.lineTo(8 * u, -4 * u); ctx.lineTo(24 * u, 12 * u); ctx.lineWidth = 2 * u; ctx.strokeStyle = '#ffd23f'; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, -12 * u, 24 * u, 8 * u, 0, 0, TAU); ctx.fillStyle = '#f0e0c0'; ctx.fill(); ctx.lineWidth = 2.5 * u; ctx.strokeStyle = '#4a0e0a'; ctx.stroke();
      ctx.restore();
      // 鼓棒
      var sa = fired ? 0.15 : -0.5;
      [[-1, 1], [1, -1]].forEach(function (d) {
        ctx.save(); ctx.translate(d[0] * 16 * u, -20 * u + bump * 0.4); ctx.rotate(d[0] * sa + (d[0] < 0 ? 0.6 : -0.6));
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -14 * u); ctx.lineWidth = 3 * u; ctx.strokeStyle = '#d9b080'; ctx.stroke();
        circle(ctx, 0, -15 * u, 3.5 * u); ctx.fillStyle = '#f4ecd8'; ctx.fill();
        ctx.restore();
      });
      if (fired) { // 升怒色的震動弧
        ctx.lineWidth = 3 * u; ctx.strokeStyle = palette.ignite;
        ctx.beginPath(); ctx.arc(0, -12 * u, 24 * u, -2.6, -2.0); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -12 * u, 24 * u, -1.1, -0.5); ctx.stroke();
      }
    } else if (k === 'fountain') {
      ctx.beginPath(); ctx.moveTo(-28 * u, 2 * u); ctx.lineTo(28 * u, 2 * u); ctx.lineTo(22 * u, 18 * u); ctx.lineTo(-22 * u, 18 * u); ctx.closePath();
      ctx.fillStyle = '#9aa6b8'; ctx.fill(); ctx.lineWidth = 2.5 * u; ctx.strokeStyle = '#2a3442'; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 2 * u, 26 * u, 6 * u, 0, 0, TAU); ctx.fillStyle = '#2f7fe8'; ctx.fill();
      rr(ctx, -4 * u, -14 * u, 8 * u, 16 * u, 2 * u); ctx.fillStyle = '#9aa6b8'; ctx.fill(); ctx.stroke();
      var jh = fired ? 22 : 12;
      ctx.beginPath(); ctx.moveTo(0, -14 * u); ctx.quadraticCurveTo(-14 * u, -(14 + jh) * u, -20 * u, -2 * u);
      ctx.moveTo(0, -14 * u); ctx.quadraticCurveTo(14 * u, -(14 + jh) * u, 20 * u, -2 * u);
      ctx.lineWidth = 3.5 * u; ctx.strokeStyle = palette.douse; ctx.stroke();
      if (fired) { circle(ctx, -24 * u, -26 * u, 3 * u); ctx.fillStyle = palette.douse; ctx.fill(); circle(ctx, 24 * u, -26 * u, 3 * u); ctx.fill(); }
    } else if (k === 'bait') {
      // 骨頭 + 肉
      ctx.beginPath(); ctx.moveTo(-22 * u, 10 * u); ctx.lineTo(22 * u, -6 * u); ctx.lineWidth = 6 * u; ctx.strokeStyle = '#f4ecd8'; ctx.stroke();
      circle(ctx, -24 * u, 14 * u, 4.5 * u); ctx.fillStyle = '#f4ecd8'; ctx.fill(); circle(ctx, -27 * u, 7 * u, 4.5 * u); ctx.fill();
      circle(ctx, 25 * u, -2 * u, 4.5 * u); ctx.fill(); circle(ctx, 22 * u, -10 * u, 4.5 * u); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 2 * u, 18 * u, 14 * u, -0.35, 0, TAU); ctx.fillStyle = '#c0504a'; ctx.fill();
      ctx.lineWidth = 2.5 * u; ctx.strokeStyle = '#5a1a16'; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-4 * u, -2 * u, 8 * u, 5 * u, -0.35, 0, TAU); ctx.fillStyle = '#e88a80'; ctx.fill();
      // 香味(圓點往上飄, 不用尖角)
      var tt = (now() / 900) % 1;
      for (var i = 0; i < 2; i++) {
        var p = (tt + i * 0.5) % 1;
        ctx.globalAlpha = 0.6 * (1 - p);
        circle(ctx, (-8 + i * 16) * u, (-18 - p * 16) * u, (2.5 + p * 2) * u); ctx.fillStyle = '#ffd0c0'; ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else { // valve 安全閥
      var col = spent ? '#6b6478' : '#d8e4ee';
      var rim = spent ? '#3a3446' : '#2a3442';
      // 管
      rr(ctx, -6 * u, 2 * u, 12 * u, 18 * u, 2 * u); ctx.fillStyle = spent ? '#4a4456' : '#7d8ea0'; ctx.fill();
      // 錶盤
      circle(ctx, 0, -10 * u, 20 * u); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3 * u; ctx.strokeStyle = rim; ctx.stroke();
      // 刻度: 4 格的位置一道降怒色弧(要啟動的那一段)
      if (!spent) {
        ctx.beginPath(); ctx.arc(0, -10 * u, 15 * u, -0.5, 0.6); ctx.lineWidth = 4 * u; ctx.strokeStyle = palette.douse; ctx.stroke();
      }
      var needle = spent ? Math.PI * 0.85 : (fired ? 0.1 : -Math.PI * 0.75);
      ctx.save(); ctx.translate(0, -10 * u); ctx.rotate(needle);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(14 * u, 0); ctx.lineWidth = 3 * u; ctx.strokeStyle = spent ? '#3a3446' : '#c0203a'; ctx.stroke();
      ctx.restore();
      circle(ctx, 0, -10 * u, 3 * u); ctx.fillStyle = rim; ctx.fill();
      if (fired && !spent) { // 洩壓蒸氣(圓團, 往上散)
        ctx.fillStyle = 'rgba(220,245,255,0.85)';
        circle(ctx, -18 * u, -30 * u, 7 * u); ctx.fill(); circle(ctx, -8 * u, -34 * u, 6 * u); ctx.fill(); circle(ctx, 16 * u, -31 * u, 7 * u); ctx.fill();
      }
      if (spent) { // 用過: 灰掉 + 斜線封條
        ctx.beginPath(); ctx.moveTo(-14 * u, -24 * u); ctx.lineTo(14 * u, 4 * u); ctx.lineWidth = 3 * u; ctx.strokeStyle = '#2a2436'; ctx.stroke();
      }
    }
  }

  // ---------- 怒氣條(ShowMonster 用) ----------
  function rageBar(ctx, x, y, w, h, rage, redLow, marks) {
    rage = clamp(N(rage, 0), 0, 100); redLow = clamp(N(redLow, 80), 0, 100);
    var x0 = x - w / 2, y0 = y - h / 2;
    rr(ctx, x0 - 2, y0 - 2, w + 4, h + 4, 4); ctx.fillStyle = 'rgba(8,4,12,0.9)'; ctx.fill();
    rr(ctx, x0, y0, w, h, 3); ctx.fillStyle = '#2e2838'; ctx.fill();
    // 紅區底(淡規則色)
    var rx = x0 + w * redLow / 100;
    ctx.fillStyle = 'rgba(255,59,107,0.22)'; ctx.fillRect(rx, y0, x0 + w - rx, h);
    // 填色
    var col = rage < 50 ? palette.rageLow : (rage < redLow ? palette.rageMid : palette.edge);
    var fw = w * rage / 100;
    if (fw > 0) { rr(ctx, x0, y0, Math.max(fw, 3), h, 3); ctx.fillStyle = col; ctx.fill(); }
    if (rage >= redLow) { // 紅區內夾白細線(明度分界, 與火蜥蜴本體色分開)
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(x0 + 1, y0 + h / 2 - 1, fw - 2, 2);
    }
    // 紅區上下緣規則色線
    ctx.fillStyle = palette.edge; ctx.fillRect(rx, y0 - 2, x0 + w - rx, 2); ctx.fillRect(rx, y0 + h, x0 + w - rx, 2);
    // 門檻 50 刻度與紅區起點刻度
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x0 + w * 0.5 - 1, y0 - 2, 2, h + 4);
    ctx.fillStyle = palette.edge; ctx.fillRect(rx - 1, y0 - 3, 2, h + 6);
  }

  // 失控標記: 5 格菱形, 已有的實心規則色, 第 5 格虛線(=失控)
  function markRow(ctx, x, y, marks, markLeft, markDur, burst) {
    var n = clamp(Math.round(N(marks, 0)), 0, 5);
    var sz = 6, gap = 14;
    for (var i = 0; i < 5; i++) {
      var cx = x + (i - 2) * gap;
      ctx.beginPath(); ctx.moveTo(cx, y - sz); ctx.lineTo(cx + sz, y); ctx.lineTo(cx, y + sz); ctx.lineTo(cx - sz, y); ctx.closePath();
      if (i < n) {
        ctx.fillStyle = burst ? '#ff1040' : palette.edge; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(10,6,16,0.75)'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = i === 4 ? palette.edge : 'rgba(255,255,255,0.45)';
        if (i === 4) ctx.setLineDash([2, 2]);
        ctx.stroke(); ctx.setLineDash([]);
      }
    }
    // 最新一顆的自動 −1 倒數(白弧沿菱形外圈收)
    if (!burst && n > 0 && n < 5) {
      var dur = Math.max(0.01, N(markDur, 4)), left = clamp(N(markLeft, 0), 0, dur);
      var cx2 = x + (n - 1 - 2) * gap;
      ctx.beginPath(); ctx.arc(cx2, y, sz + 1.2, -Math.PI / 2, -Math.PI / 2 + TAU * left / dur);
      ctx.lineWidth = 1.6; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    }
  }

  // ======================================================================
  var Art = {
    canvas: { width: 720, height: 1280 },
    palette: palette,

    drawBackground: function (ctx) {
      ctx.save();
      ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, 720, 1280);
      ctx.restore();
    },

    // ---------- 地下城格 ----------
    drawTile: function (ctx, state) {
      var s = st(state);
      var x = N(s.x, 30), y = N(s.y, 30);
      var D = DUNGEONS[pick(s.dungeon, DUNGEONS, 'cave')];
      var dk = pick(s.dungeon, DUNGEONS, 'cave');
      var kind = oneOf(s.kind, ['wall', 'pillar', 'floor', 'lava', 'water'], 'floor');
      var room = oneOf(s.room, ['top', 'bottom', 'hall'], 'hall');
      var x0 = x - 30, y0 = y - 30;
      var h = hash(Math.floor(x / 60) * 31 + Math.floor(y / 60) * 7);
      ctx.save();
      ctx.beginPath(); ctx.rect(x0, y0, 60, 60); ctx.clip();
      // 地板底(石柱、熔岩、水也先鋪)
      var fl = room === 'hall' ? D.hall : ((Math.floor(x / 60) + Math.floor(y / 60)) % 2 ? D.floor : D.floor2);
      ctx.fillStyle = fl; ctx.fillRect(x0, y0, 60, 60);
      if (kind === 'floor' || kind === 'pillar') {
        ctx.fillStyle = D.speck;
        if (dk === 'ruins') { // 石磚縫
          ctx.fillRect(x0, y0 + 29, 60, 2); ctx.fillRect(x0 + (h > 0.5 ? 20 : 38), y0, 2, 29); ctx.fillRect(x0 + (h > 0.5 ? 44 : 14), y0 + 31, 2, 29);
        } else if (dk === 'cliff') { // 岩紋
          ctx.fillRect(x0 + 8 + h * 20, y0 + 14, 14, 2); ctx.fillRect(x0 + 30 - h * 10, y0 + 42, 18, 2);
        } else { // 洞窟碎石
          circle(ctx, x0 + 12 + h * 30, y0 + 16, 3); ctx.fill(); circle(ctx, x0 + 44 - h * 20, y0 + 44, 2.5); ctx.fill();
        }
        if (room === 'hall') { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x0, y0, 60, 60); }
      }
      if (kind === 'wall') {
        ctx.fillStyle = D.wall; ctx.fillRect(x0, y0, 60, 60);
        ctx.fillStyle = D.wallTop; ctx.fillRect(x0, y0, 60, 10);
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x0 + 4, y0 + 18, 22, 14); ctx.fillRect(x0 + 32, y0 + 36, 24, 14);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(x0 + 1, y0 + 1, 58, 58);
      } else if (kind === 'pillar') {
        ctx.beginPath(); ctx.ellipse(x, y + 18, 24, 8, 0, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
        rr(ctx, x - 22, y - 26, 44, 50, 8); ctx.fillStyle = D.wallTop; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = D.wall; ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 4, y - 24, 16, 46);
        rr(ctx, x - 26, y - 28, 52, 10, 3); ctx.fillStyle = D.wallTop; ctx.fill(); ctx.stroke();
      } else if (kind === 'lava') {
        ctx.fillStyle = '#ff5a10'; ctx.fillRect(x0, y0, 60, 60);
        var pl = 0.5 + 0.5 * Math.sin(now() / 400 + h * 6);
        ctx.fillStyle = 'rgba(255,220,80,' + (0.35 + 0.35 * pl) + ')';
        circle(ctx, x - 8 + h * 10, y - 6, 12); ctx.fill(); circle(ctx, x + 14, y + 14, 8); ctx.fill();
        ctx.strokeStyle = '#5a1004'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x0 + 4, y0 + 20 + h * 10); ctx.lineTo(x0 + 26, y0 + 30); ctx.lineTo(x0 + 22, y0 + 52);
        ctx.moveTo(x0 + 26, y0 + 30); ctx.lineTo(x0 + 54, y0 + 24); ctx.stroke();
        ctx.strokeStyle = '#ffe070'; ctx.lineWidth = 2; ctx.strokeRect(x0 + 1, y0 + 1, 58, 58);
      } else if (kind === 'water') {
        ctx.fillStyle = '#1f5a96'; ctx.fillRect(x0, y0, 60, 60);
        ctx.strokeStyle = 'rgba(190,230,255,0.55)'; ctx.lineWidth = 2;
        var wo = (now() / 1200 + h) % 1 * 12;
        for (var r = 0; r < 3; r++) {
          var yy = y0 + 12 + r * 18;
          ctx.beginPath(); ctx.moveTo(x0 + 6 + wo, yy); ctx.quadraticCurveTo(x0 + 14 + wo, yy - 4, x0 + 22 + wo, yy); ctx.stroke();
        }
      }
      if (s.nest === true && (kind === 'floor')) {
        // 巢穴: 一圈小石頭 + 中央乾草
        ctx.beginPath(); ctx.ellipse(x, y + 4, 20, 13, 0, 0, TAU); ctx.fillStyle = '#6a5838'; ctx.fill();
        ctx.strokeStyle = '#a08850'; ctx.lineWidth = 2;
        for (var q = 0; q < 5; q++) { ctx.beginPath(); ctx.moveTo(x - 14 + q * 6, y - 2); ctx.lineTo(x - 8 + q * 5, y + 10); ctx.stroke(); }
        ctx.fillStyle = '#8a8478';
        for (var p = 0; p < 9; p++) { var a = p * TAU / 9; circle(ctx, x + Math.cos(a) * 24, y + 4 + Math.sin(a) * 16, 4); ctx.fill(); }
      }
      ctx.restore();
    },

    // ---------- 馴獸師 ----------
    drawTamer: function (ctx, state) {
      var s = st(state);
      var x = N(s.x, 360), y = N(s.y, 900);
      var f = clamp(Math.round(N(s.facing, 0)), 0, 7);
      var ang = f * Math.PI / 4 - Math.PI / 2;
      ctx.save();
      ctx.translate(x, y);
      if (s.blink === true && Math.floor(now() / 80) % 2 === 0) ctx.globalAlpha = 0.3;
      // 影
      ctx.beginPath(); ctx.ellipse(0, 6, 20, 9, 0, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      // 突進中: 白青外光環
      if (s.dashing === true) {
        circle(ctx, 0, 0, 25); ctx.fillStyle = 'rgba(200,240,255,0.35)'; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = '#e8f8ff'; ctx.stroke();
      }
      // 套索中: 背後一捲繩
      if (s.lassoing === true) {
        ctx.save(); ctx.rotate(ang + Math.PI);
        ctx.lineWidth = 3; ctx.strokeStyle = palette.rope;
        circle(ctx, 20, 0, 7); ctx.stroke(); circle(ctx, 20, 0, 3.5); ctx.stroke();
        ctx.restore();
      }
      // 武器(右手側, 朝面向)
      ctx.save(); ctx.rotate(ang);
      ctx.save(); ctx.translate(2, 12);
      weaponShape(ctx, s.weapon, 22);
      ctx.restore();
      ctx.restore();
      // 身體: 外套圓 = 判定圓(半徑 18), 金邊是玩家專屬
      circle(ctx, 0, 0, 18); ctx.fillStyle = palette.tamer; ctx.fill();
      ctx.lineWidth = 3.5; ctx.strokeStyle = palette.tamerRim; ctx.stroke();
      // 帽子(往面向偏) + 帽沿缺口指出面向
      ctx.save(); ctx.rotate(ang);
      circle(ctx, 2, 0, 11); ctx.fillStyle = palette.hat; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#6a5a3a'; ctx.stroke();
      ctx.beginPath(); ctx.arc(2, 0, 11, -0.6, 0.6); ctx.lineTo(2, 0); ctx.closePath(); ctx.fillStyle = '#f0b090'; ctx.fill();
      circle(ctx, 9, -3, 1.6); ctx.fillStyle = '#1a1020'; ctx.fill(); circle(ctx, 9, 3, 1.6); ctx.fill();
      ctx.beginPath(); ctx.arc(2, 0, 7, 0.9, Math.PI * 2 - 0.9); ctx.lineWidth = 2.5; ctx.strokeStyle = '#c0303a'; ctx.stroke();
      ctx.restore();
      ctx.restore();
    },

    // ---------- 野生魔物 ----------
    drawWildMonster: function (ctx, state) {
      var s = st(state);
      var sp = pick(s.species, SPECIES, 'fire');
      var x = N(s.x, 360), y = N(s.y, 400);
      var big = sp === 'stone';
      var half = big ? 55 : 45;
      var R = big ? 34 : 27;
      var dir = N(s.dir, 1) < 0 ? -1 : 1;
      var maxHp = Math.max(1, N(s.maxHp, 10)), hp = clamp(N(s.hp, maxHp), 0, maxHp);
      var stunLeft = Math.max(0, N(s.stunLeft, 0)), stunDur = Math.max(0.01, N(s.stunDur, 2));
      var lassoed = s.lassoed === true;
      var stunned = stunLeft > 0 || lassoed;
      var weak = s.weak === true;
      ctx.save();
      ctx.translate(x, y);
      // 影
      ctx.beginPath(); ctx.ellipse(0, R * 0.78, R * 0.85, R * 0.22, 0, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      // 施法預備: 本體外一圈種類色脈動光(不出界)
      if (s.casting === true && !stunned) {
        var pc = 0.5 + 0.5 * Math.sin(now() / 70);
        circle(ctx, 0, 0, R * 1.08 + pc * 3); ctx.fillStyle = 'rgba(255,255,255,' + (0.12 + 0.12 * pc) + ')'; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = spc(sp).light; ctx.stroke();
      }
      // 雷鳥急衝: 身後速度線
      if (s.dashing === true) {
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,245,160,0.8)';
        for (var i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-dir * R * 0.7, i * R * 0.35); ctx.lineTo(-dir * (half - 2), i * R * 0.35); ctx.stroke(); }
      }
      ctx.save();
      var by = 0;
      if (weak && !stunned) by = R * 0.06; // 殘血往下垂
      ctx.translate(0, by);
      ctx.scale(dir, 1);
      monsterBody(ctx, sp, R, {
        flash: s.hit === true && !lassoed,
        eyes: stunned ? 'dizzy' : (weak ? 'tired' : 'normal'),
        wingUp: s.dashing === true ? 1 : (sp === 'thunder' ? 0.5 + 0.5 * Math.sin(now() / 90) : 0)
      });
      ctx.restore();
      // 被套住: 頸上一圈繩
      if (lassoed) {
        ctx.beginPath(); ctx.ellipse(0, R * 0.05, R * 0.72, R * 0.26, 0, 0, TAU);
        ctx.lineWidth = 4; ctx.strokeStyle = '#3a2410'; ctx.stroke();
        ctx.lineWidth = 2.5; ctx.strokeStyle = palette.rope; ctx.stroke();
      }
      // 血條(頭頂; 30% 刻度 = 殘血線)
      var bw = big ? 60 : 50, bh = 6, bY = -half + 4;
      rr(ctx, -bw / 2 - 1.5, bY - 1.5, bw + 3, bh + 3, 3); ctx.fillStyle = 'rgba(8,4,12,0.9)'; ctx.fill();
      ctx.fillStyle = '#3a3242'; ctx.fillRect(-bw / 2, bY, bw, bh);
      var hpc = weak ? '#ff6a3a' : '#7ee07a';
      if (hp > 0) { ctx.fillStyle = hpc; ctx.fillRect(-bw / 2, bY, bw * hp / maxHp, bh); }
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-bw / 2 + bw * 0.3 - 1, bY - 1.5, 2, bh + 3);
      // 殘血: 冷汗水滴(頭側)
      if (weak) weakMark(ctx, dir * (R * 0.95), -R * 0.55, 8);
      // 暈眩: 頭頂星星 + 擊暈剩餘弧
      if (stunned) {
        stunStars(ctx, 0, -half + 20, R * 0.6, 3);
        if (stunLeft > 0 && !lassoed) {
          ctx.beginPath(); ctx.arc(0, 0, R + 4, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(stunLeft / stunDur, 0, 1));
          ctx.lineWidth = 3; ctx.strokeStyle = '#fff36a'; ctx.stroke();
        }
      }
      ctx.restore();
    },

    // ---------- 準備捕捉 ----------
    drawCaptureRing: function (ctx, state) {
      var s = st(state);
      var x = N(s.x, 360), y = N(s.y, 400);
      var dur = Math.max(0.01, N(s.dur, 0.8)), p = clamp(N(s.t, 0) / dur, 0, 1);
      ctx.save();
      ctx.translate(x, y);
      circle(ctx, 0, 0, 42); ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(8,4,12,0.75)'; ctx.stroke();
      ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(125,255,176,0.6)'; ctx.stroke(); ctx.setLineDash([]);
      if (p > 0) {
        ctx.beginPath(); ctx.arc(0, 0, 42, -Math.PI / 2, -Math.PI / 2 + TAU * p);
        ctx.lineWidth = 6; ctx.strokeStyle = palette.capture; ctx.stroke();
      }
      txt(ctx, '準備捕捉', 0, -52, 15, palette.capture, { lw: 4 });
      ctx.restore();
    },

    // ---------- 套索 ----------
    drawLasso: function (ctx, state) {
      var s = st(state);
      var x1 = N(s.x1, 360), y1 = N(s.y1, 900), x2 = N(s.x2, 360), y2 = N(s.y2, 700);
      var maxLen = Math.max(1, N(s.maxLen, 220));
      var tight = clamp(N(s.len, Math.hypot(x2 - x1, y2 - y1)) / maxLen, 0, 1.2);
      var prog = c01(s.progress);
      var limit = Math.max(0.01, N(s.limit, 5)), left = clamp(limit - N(s.t, 0), 0, limit);
      ctx.save();
      // 繩: 越鬆越下垂; 接近極限變紅變細
      var mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + (1 - Math.min(1, tight)) * 40;
      var col = tight < 0.75 ? palette.rope : (tight < 0.9 ? '#ff9a3a' : palette.danger);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2);
      ctx.lineCap = 'round';
      ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(30,16,6,0.85)'; ctx.stroke();
      ctx.lineWidth = tight < 0.9 ? 4 : 3; ctx.strokeStyle = col; ctx.stroke();
      if (tight >= 0.9 && Math.floor(now() / 120) % 2 === 0) {
        ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.setLineDash([4, 8]); ctx.stroke(); ctx.setLineDash([]);
      }
      // 繞圈進度環(魔物周圍)
      ctx.translate(x2, y2);
      circle(ctx, 0, 0, 52); ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(8,4,12,0.7)'; ctx.stroke();
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,194,58,0.22)'; ctx.stroke();
      if (prog > 0) {
        ctx.beginPath(); ctx.arc(0, 0, 52, -Math.PI / 2, -Math.PI / 2 + TAU * prog);
        ctx.lineWidth = 6; ctx.strokeStyle = palette.lassoProg; ctx.stroke();
      }
      // 套索時限: 外圈細白環(剩餘), 最後 1.5 秒轉紅閃
      var tl = left / limit;
      var warn = left < 1.5;
      ctx.beginPath(); ctx.arc(0, 0, 60, -Math.PI / 2, -Math.PI / 2 + TAU * tl);
      ctx.lineWidth = 3; ctx.strokeStyle = warn ? (Math.floor(now() / 150) % 2 ? palette.danger : '#ffffff') : 'rgba(255,255,255,0.85)'; ctx.stroke();
      // 繞圈方向提示: 進度環上兩個小箭頭
      for (var i = 0; i < 2; i++) {
        var a = -Math.PI / 2 + TAU * prog + i * Math.PI;
        arrowHead(ctx, Math.cos(a) * 52, Math.sin(a) * 52, a + Math.PI / 2, 6, '#fff3c0');
      }
      ctx.restore();
    },

    // ---------- 魔物技能 ----------
    drawHazard: function (ctx, state) {
      var s = st(state);
      var kind = oneOf(s.kind, ['firering', 'waterball', 'thunder', 'quake', 'spike', 'wisp'], 'firering');
      var phase = oneOf(s.phase, ['warn', 'active', 'fly'], kind === 'quake' ? 'active' : (['waterball', 'spike', 'wisp'].indexOf(kind) >= 0 ? 'fly' : 'warn'));
      var x = N(s.x, 360), y = N(s.y, 600);
      var defR = { firering: 120, thunder: 70, quake: 0, waterball: 12, spike: 10, wisp: 14 }[kind];
      var r = Math.max(0, N(s.radius, defR));
      var t = Math.max(0, N(s.t, 0));
      var durDef = { firering: phase === 'warn' ? 0.5 : 0.5, thunder: phase === 'warn' ? 0.8 : 0.2, quake: 1, waterball: 0, spike: 0, wisp: 3 }[kind];
      var dur = N(s.dur, durDef);
      var p = dur > 0 ? clamp(t / dur, 0, 1) : 0;
      var ang = N(s.angle, 0);
      var refl = s.reflected === true;
      ctx.save();
      ctx.translate(x, y);
      if (kind === 'firering' || kind === 'thunder') {
        var c = kind === 'firering' ? SPECIES.fire : SPECIES.thunder;
        if (phase === 'warn') {
          // 預警: 虛線外框 + 由中心長大的填色, 填滿 = 生效
          circle(ctx, 0, 0, r); ctx.fillStyle = kind === 'firering' ? 'rgba(224,69,42,0.12)' : 'rgba(240,208,32,0.12)'; ctx.fill();
          circle(ctx, 0, 0, r * p); ctx.fillStyle = kind === 'firering' ? 'rgba(224,69,42,0.38)' : 'rgba(240,208,32,0.38)'; ctx.fill();
          circle(ctx, 0, 0, r - 1.5); ctx.setLineDash([10, 7]); ctx.lineWidth = 3; ctx.strokeStyle = c.main; ctx.stroke(); ctx.setLineDash([]);
          if (kind === 'thunder') { // 準星
            ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.lineWidth = 2.5; ctx.strokeStyle = c.main; ctx.stroke();
          }
        } else { // active
          var al = kind === 'thunder' ? 1 - p : 1 - p * 0.5;
          ctx.globalAlpha = al;
          circle(ctx, 0, 0, r);
          ctx.fillStyle = kind === 'firering' ? 'rgba(255,110,30,0.75)' : 'rgba(255,250,170,0.85)'; ctx.fill();
          ctx.lineWidth = 4; ctx.strokeStyle = kind === 'firering' ? '#ffd23f' : '#ffffff';
          circle(ctx, 0, 0, r - 2); ctx.stroke();
          if (kind === 'firering') { // 火舌(圓頭)
            for (var i = 0; i < 10; i++) {
              var a = i * TAU / 10 + now() / 300;
              var fx = Math.cos(a) * r * 0.62, fy = Math.sin(a) * r * 0.62;
              ctx.beginPath(); ctx.ellipse(fx, fy, 12, 18, a + Math.PI / 2, 0, TAU); ctx.fillStyle = 'rgba(255,220,90,0.8)'; ctx.fill();
            }
          } else { // 雷柱
            ctx.beginPath(); ctx.moveTo(-6, -r); ctx.lineTo(8, -r * 0.3); ctx.lineTo(-4, -r * 0.2); ctx.lineTo(10, r * 0.6); ctx.lineTo(-10, -r * 0.05); ctx.lineTo(2, -r * 0.12); ctx.lineTo(-12, -r); ctx.closePath();
            ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#a08000'; ctx.stroke();
          }
        }
      } else if (kind === 'quake') {
        // radius = 環的中線半徑, 判定帶 [r−15, r+15]
        if (phase === 'warn') {
          circle(ctx, 0, 0, Math.max(4, r)); ctx.setLineDash([8, 6]); ctx.lineWidth = 3; ctx.strokeStyle = SPECIES.stone.main; ctx.stroke(); ctx.setLineDash([]);
        } else {
          var inner = Math.max(0, r - 15), outer = r + 15;
          ctx.beginPath(); ctx.arc(0, 0, outer, 0, TAU); if (inner > 0) ctx.arc(0, 0, inner, 0, TAU, true);
          ctx.fillStyle = 'rgba(138,98,208,0.7)'; ctx.fill('evenodd');
          ctx.lineWidth = 3; ctx.strokeStyle = SPECIES.stone.light; circle(ctx, 0, 0, outer - 1.5); ctx.stroke();
          if (inner > 2) { circle(ctx, 0, 0, inner + 1.5); ctx.strokeStyle = SPECIES.stone.dark; ctx.stroke(); }
          // 碎石點(在帶內)
          ctx.fillStyle = SPECIES.stone.dark;
          for (var j = 0; j < 12; j++) { var b = j * TAU / 12 + 0.2; circle(ctx, Math.cos(b) * r, Math.sin(b) * r, 3); ctx.fill(); }
        }
      } else if (kind === 'waterball' || kind === 'spike' || kind === 'wisp') {
        ctx.rotate(ang);
        var main = kind === 'waterball' ? SPECIES.water.main : (kind === 'spike' ? SPECIES.spike.main : '#7ff0ff');
        var al2 = kind === 'wisp' && dur > 0 ? clamp((1 - p) * 4, 0, 1) : 1;
        ctx.globalAlpha = al2;
        // 拖尾
        ctx.beginPath(); ctx.moveTo(-r * 3.2, 0); ctx.lineTo(0, -r * 0.8); ctx.lineTo(0, r * 0.8); ctx.closePath();
        ctx.fillStyle = refl ? 'rgba(255,194,58,0.45)' : (kind === 'waterball' ? 'rgba(160,210,255,0.45)' : kind === 'spike' ? 'rgba(180,230,140,0.4)' : 'rgba(170,250,255,0.45)');
        ctx.fill();
        if (kind === 'spike') {
          ctx.beginPath(); ctx.moveTo(r * 1.0, 0); ctx.lineTo(-r * 1.0, -r * 0.55); ctx.lineTo(-r * 0.6, 0); ctx.lineTo(-r * 1.0, r * 0.55); ctx.closePath();
          ctx.fillStyle = refl ? '#ffffff' : SPECIES.spike.accent; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = refl ? palette.reflected : '#c8f0a0'; ctx.stroke();
          circle(ctx, 0, 0, r); ctx.lineWidth = 1.5; ctx.strokeStyle = refl ? palette.reflected : 'rgba(200,240,160,0.6)'; ctx.stroke();
        } else {
          circle(ctx, 0, 0, r); ctx.fillStyle = refl ? '#ffffff' : main; ctx.fill();
          ctx.lineWidth = 2.5; ctx.strokeStyle = refl ? palette.reflected : (kind === 'waterball' ? '#0f2f66' : '#1a6a78'); ctx.stroke();
          if (kind === 'wisp') { circle(ctx, r * 0.15, 0, r * 0.5); ctx.fillStyle = refl ? palette.reflected : '#e8ffff'; ctx.fill(); }
          else { circle(ctx, -r * 0.3, -r * 0.3, r * 0.3); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill(); }
        }
        if (refl) { // 打回去的: 金邊外圈 + 前方小箭頭
          circle(ctx, 0, 0, r + 3); ctx.lineWidth = 2; ctx.strokeStyle = palette.reflected; ctx.stroke();
        }
      }
      ctx.restore();
    },

    // ---------- 武器特效 ----------
    drawWeaponFx: function (ctx, state) {
      var s = st(state);
      var x = N(s.x, 360), y = N(s.y, 900);
      var shape = oneOf(s.shape, ['arc', 'circle', 'line', 'dash'], 'arc');
      var skill = s.move === 'skill';
      var dur = Math.max(0.01, N(s.dur, 0.2)), p = clamp(N(s.t, 0) / dur, 0, 1);
      var ang = N(s.angle, 0), spread = clamp(N(s.spread, Math.PI / 2), 0, TAU);
      var radius = Math.max(0, N(s.radius, 70)), length = Math.max(0, N(s.length, 170)), width = Math.max(0, N(s.width, 40));
      var col = skill ? palette.skillFx : palette.playerFx;
      var stunSkill = skill && s.weapon === 'sword';
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = 1 - p * 0.85;
      if (shape === 'arc') {
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, radius, ang - spread / 2, ang + spread / 2); ctx.closePath();
        ctx.fillStyle = skill ? 'rgba(255,194,58,0.3)' : 'rgba(255,255,255,0.22)'; ctx.fill();
        // 揮擊前緣(隨 t 掃過)
        var sw = ang - spread / 2 + spread * Math.min(1, p * 1.6);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(sw) * radius, Math.sin(sw) * radius);
        ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, radius - 2, ang - spread / 2, ang + spread / 2);
        ctx.lineWidth = skill ? 5 : 4; ctx.strokeStyle = col; ctx.stroke();
        if (stunSkill) { // 擊暈斬: 外緣星星
          for (var i = 0; i < 3; i++) { var a = ang - spread / 3 + i * spread / 3; starPath(ctx, Math.cos(a) * radius * 0.75, Math.sin(a) * radius * 0.75, 7, 3); ctx.fillStyle = '#fff36a'; ctx.fill(); }
        }
      } else if (shape === 'circle') {
        circle(ctx, 0, 0, radius); ctx.fillStyle = skill ? 'rgba(255,194,58,0.22)' : 'rgba(255,255,255,0.16)'; ctx.fill();
        circle(ctx, 0, 0, radius - 2); ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
        var sa = p * TAU;
        ctx.beginPath(); ctx.arc(0, 0, radius - 2, sa, sa + 1.4); ctx.lineWidth = 7; ctx.stroke();
      } else if (shape === 'line') {
        ctx.rotate(ang);
        ctx.fillStyle = skill ? 'rgba(255,194,58,0.3)' : 'rgba(255,255,255,0.22)'; ctx.fillRect(0, -width / 2, length, width);
        ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.strokeRect(1.5, -width / 2 + 1.5, length - 3, width - 3);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(length * Math.min(1, 0.4 + p), 0); ctx.lineWidth = 5; ctx.stroke();
      } else { // dash 突進殘影
        ctx.rotate(ang);
        var g = ctx.createLinearGradient ? ctx.createLinearGradient(0, 0, length, 0) : null;
        if (g && g.addColorStop) { g.addColorStop(0, 'rgba(255,194,58,0)'); g.addColorStop(1, 'rgba(255,194,58,0.5)'); ctx.fillStyle = g; }
        else ctx.fillStyle = 'rgba(255,194,58,0.35)';
        rr(ctx, 0, -18, length, 36, 18); ctx.fill();
        for (var k = 1; k <= 3; k++) {
          circle(ctx, length * k / 4, 0, 18); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,194,58,' + (0.2 * k) + ')'; ctx.stroke();
        }
      }
      ctx.restore();
    },

    // ---------- 地下城選擇卡 ----------
    drawDungeonCard: function (ctx, state) {
      var s = st(state);
      var x = N(s.x, 360), y = N(s.y, 330);
      var dk = pick(s.dungeon, DUNGEONS, 'cave'), D = DUNGEONS[dk];
      var open = s.open === true;
      var x0 = x - 300, y0 = y - 130;
      ctx.save();
      rr(ctx, x0 + 4, y0 + 4, 592, 252, 16); ctx.fillStyle = open ? D.floor2 : '#1e1928'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = open ? D.wallTop : palette.line; ctx.stroke();
      // 上緣地形條(看出是哪種地下城)
      ctx.save(); rr(ctx, x0 + 4, y0 + 4, 592, 252, 16); ctx.clip();
      ctx.fillStyle = D.wall; ctx.fillRect(x0, y0, 600, 54);
      ctx.fillStyle = D.wallTop; ctx.fillRect(x0, y0 + 46, 600, 8);
      ctx.restore();
      txt(ctx, D.name, x0 + 28, y0 + 30, 30, palette.text, { align: 'left', lw: 5 });
      // 兩種魔物
      for (var i = 0; i < 2; i++) {
        var mx = x0 + 110 + i * 170, my = y0 + 150;
        ctx.save(); ctx.translate(mx, my);
        if (!open) ctx.globalAlpha = 0.55;
        monsterBody(ctx, D.sp[i], 34, { gray: !open });
        ctx.restore();
        txt(ctx, SPECIES[D.sp[i]].name, mx, y0 + 222, 18, open ? palette.text : palette.textDim, { lw: 4 });
      }
      // 右側: 已開放 / 條件
      if (open) {
        rr(ctx, x0 + 420, y0 + 120, 150, 54, 27); ctx.fillStyle = 'rgba(111,224,138,0.18)'; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = palette.ok; ctx.stroke();
        txt(ctx, '已開放', x0 + 495, y0 + 147, 22, palette.ok, { lw: 4 });
      } else {
        lockIcon(ctx, x0 + 495, y0 + 104, 40);
        txt(ctx, S(s.condition, ''), x0 + 495, y0 + 170, 17, palette.text, { lw: 4, max: 200 });
      }
      if (s.selected === true) selFrame(ctx, x0 + 4, y0 + 4, 592, 252, 16);
      ctx.restore();
    },

    // ---------- 陣容卡 ----------
    drawRosterCard: function (ctx, state) {
      var s = st(state);
      var x = N(s.x, 195), y = N(s.y, 300);
      var sp = pick(s.species, SPECIES, 'fire');
      var lv = clamp(Math.round(N(s.level, 0)), 0, 3);
      var picked = s.picked === true;
      var x0 = x - 150, y0 = y - 100;
      ctx.save();
      rr(ctx, x0 + 4, y0 + 4, 292, 192, 14); ctx.fillStyle = picked ? palette.panelHi : palette.panel; ctx.fill();
      ctx.lineWidth = picked ? 3 : 2; ctx.strokeStyle = picked ? SPECIES[sp].main : palette.line; ctx.stroke();
      ctx.save(); ctx.translate(x0 + 90, y0 + 104); if (!picked) ctx.globalAlpha = 0.75;
      monsterBody(ctx, sp, 40, {}); ctx.restore();
      txt(ctx, SPECIES[sp].name, x0 + 210, y0 + 62, 24, palette.text, { lw: 4 });
      txt(ctx, 'Lv ' + lv, x0 + 210, y0 + 100, 20, palette.textDim, { lw: 4 });
      if (picked) {
        rr(ctx, x0 + 160, y0 + 128, 100, 40, 20); ctx.fillStyle = palette.ok; ctx.fill();
        txt(ctx, '上場', x0 + 210, y0 + 148, 20, '#0c1a10', { stroke: false });
      } else {
        rr(ctx, x0 + 160, y0 + 128, 100, 40, 20); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
      }
      if (s.selected === true) selFrame(ctx, x0 + 4, y0 + 4, 292, 192, 14);
      ctx.restore();
    },

    // ---------- 布置格子框 ----------
    drawSetupCell: function (ctx, state) {
      var s = st(state);
      var x = N(s.x, 160), y = N(s.y, 360);
      ctx.save();
      rr(ctx, x - 96, y - 86, 192, 172, 10);
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.setLineDash([8, 6]); ctx.stroke(); ctx.setLineDash([]);
      if (s.selected === true) {
        // 游標: 金色四角括號 + 淡金底
        rr(ctx, x - 96, y - 86, 192, 172, 10); ctx.fillStyle = 'rgba(255,194,58,0.10)'; ctx.fill();
        var L = 34;
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (d) {
          var cx = x + d[0] * 96, cy = y + d[1] * 86;
          ctx.beginPath(); ctx.moveTo(cx, cy - d[1] * L); ctx.lineTo(cx, cy); ctx.lineTo(cx - d[0] * L, cy);
          ctx.lineCap = 'round'; ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.stroke();
          ctx.lineWidth = 5; ctx.strokeStyle = palette.select; ctx.stroke();
        });
      }
      ctx.restore();
    },

    // ---------- 選擇面板 ----------
    drawPickerPanel: function (ctx, state) {
      var s = st(state);
      var opts = Array.isArray(s.options) ? s.options : [];
      var idx = Math.round(N(s.index, 0));
      var n = opts.length;
      ctx.save();
      ctx.fillStyle = 'rgba(8,4,12,0.55)'; ctx.fillRect(0, 120, 720, 1160);
      rr(ctx, 120, 240, 480, 80 + 70 * n, 14); ctx.fillStyle = '#1b1526'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = palette.line; ctx.stroke();
      txt(ctx, '要放什麼?', 360, 280, 26, palette.text, { lw: 5 });
      for (var i = 0; i < n; i++) {
        var o = st(opts[i]);
        var type = oneOf(o.type, ['monster', 'gadget', 'clear'], 'clear');
        var aff = o.affordable !== false;
        var ry = 320 + 70 * i;
        rr(ctx, 128, ry + 4, 464, 62, 8); ctx.fillStyle = i === idx ? palette.panelHi : '#251e33'; ctx.fill();
        ctx.save();
        if (!aff) ctx.globalAlpha = 0.42;
        ctx.save(); ctx.translate(166, ry + 35);
        if (type === 'monster') monsterBody(ctx, o.key, 22, {});
        else if (type === 'gadget') gadgetShape(ctx, o.key, 22, false, false);
        else crossMark(ctx, 0, 0, 26, '#b8aecb');
        ctx.restore();
        var name = S(o.name, '');
        var desc = S(o.desc, '');
        if (desc) {
          txt(ctx, name, 204, ry + 24, 20, palette.text, { align: 'left', lw: 4, max: 280 });
          txt(ctx, desc, 204, ry + 50, 15, palette.textDim, { align: 'left', lw: 3, max: 290 });
        } else {
          txt(ctx, name, 204, ry + 35, 21, palette.text, { align: 'left', lw: 4, max: 280 });
        }
        var cost = N(o.cost, 0);
        if (type === 'gadget' || cost > 0) {
          coinIcon(ctx, 528, ry + 35, 10);
          txt(ctx, String(cost), 576, ry + 35, 20, aff ? palette.gold : palette.danger, { align: 'right', lw: 4 });
        }
        ctx.restore();
        if (i === idx) selFrame(ctx, 128, ry + 4, 464, 62, 8);
      }
      ctx.restore();
    },

    // ---------- 布置資訊列 ----------
    drawSetupInfo: function (ctx, state) {
      var s = st(state);
      var gold = Math.round(N(s.gold, 0)), placed = Math.round(N(s.placed, 0)), picked = Math.round(N(s.picked, 0));
      ctx.save();
      rr(ctx, 64, 1154, 392, 112, 12); ctx.fillStyle = palette.panel; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = palette.line; ctx.stroke();
      coinIcon(ctx, 98, 1190, 13);
      txt(ctx, '金幣 ' + gold, 120, 1190, 24, palette.gold, { align: 'left', lw: 4 });
      var done = picked > 0 && placed >= picked;
      txt(ctx, '已擺 ' + placed + ' / ' + picked, 84, 1236, 22, done ? palette.ok : palette.text, { align: 'left', lw: 4 });
      ctx.restore();
    },

    // ---------- 機關 ----------
    drawGadget: function (ctx, state) {
      var s = st(state);
      var x = N(s.x, 360), y = N(s.y, 600);
      var kind = pick(s.kind, GADGETS, 'drum');
      ctx.save(); ctx.translate(x, y);
      // 機關類別底: 菱形地墊(與魔物的橢圓影子分開)
      ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(38, 26); ctx.lineTo(0, 39); ctx.lineTo(-38, 26); ctx.closePath();
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
      gadgetShape(ctx, kind, 40, s.fired === true && kind !== 'bait', kind === 'valve' && s.spent === true);
      ctx.restore();
    },

    // ---------- 機關脈衝 ----------
    drawGadgetPulse: function (ctx, state) {
      var s = st(state);
      var x = N(s.x, 360), y = N(s.y, 600);
      var kind = pick(s.kind, GADGETS, 'drum');
      if (kind === 'bait') return;
      var R = Math.max(0, N(s.radius, kind === 'valve' ? 180 : 160));
      var dur = Math.max(0.01, N(s.dur, 0.4)), p = clamp(N(s.t, 0) / dur, 0, 1);
      ctx.save(); ctx.translate(x, y);
      var col = kind === 'drum' ? palette.ignite : palette.douse;
      // 範圍面: 極淡
      circle(ctx, 0, 0, R); ctx.fillStyle = kind === 'drum' ? 'rgba(255,138,26,0.08)' : 'rgba(89,200,255,0.08)'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.globalAlpha = 1 - p * 0.6;
      circle(ctx, 0, 0, R - 1); ctx.setLineDash([6, 6]); ctx.stroke(); ctx.setLineDash([]);
      if (kind === 'valve') {
        // 安全閥: 白環由外往內收(方向與戰鼓 / 噴泉相反)
        var rv = R * (1 - p * 0.75);
        circle(ctx, 0, 0, rv); ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke();
        for (var i = 0; i < 6; i++) { var a = i * TAU / 6; arrowHead(ctx, Math.cos(a) * Math.max(0, rv - 12), Math.sin(a) * Math.max(0, rv - 12), a + Math.PI, 8, '#ffffff'); }
      } else {
        var re = R * (0.2 + 0.8 * p);
        circle(ctx, 0, 0, re); ctx.lineWidth = 6; ctx.strokeStyle = col; ctx.stroke();
        for (var j = 0; j < 8; j++) {
          var b = j * TAU / 8 + 0.2, mx = Math.cos(b) * re, my = Math.sin(b) * re;
          if (kind === 'drum') { // 升怒: 圓頭上箭頭
            ctx.beginPath(); ctx.moveTo(mx, my + 6); ctx.lineTo(mx, my - 6); ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(mx - 5, my - 2); ctx.lineTo(mx, my - 8); ctx.lineTo(mx + 5, my - 2); ctx.stroke();
          } else { // 降怒: 水滴
            ctx.beginPath(); ctx.moveTo(mx, my - 7); ctx.quadraticCurveTo(mx + 5, my + 1, mx, my + 4); ctx.quadraticCurveTo(mx - 5, my + 1, mx, my - 7); ctx.fillStyle = col; ctx.fill();
          }
        }
      }
      ctx.restore();
    },

    // ---------- 表演場 ----------
    drawShowArena: function (ctx) {
      ctx.save();
      // 觀眾席(上 130~250、下 1020~1140)
      [[130, 120], [1020, 120]].forEach(function (b) {
        ctx.fillStyle = '#2a1626'; ctx.fillRect(0, b[0], 720, b[1]);
        ctx.fillStyle = '#3a1e32';
        for (var i = 0; i < 6; i++) { rr(ctx, 70 + i * 100, b[0] + 70, 80, 36, 6); ctx.fill(); } // 座位
        ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(0, b[0], 720, 6);
      });
      // 圍欄帶底
      ctx.fillStyle = '#1a1018'; ctx.fillRect(0, 250, 720, 20); ctx.fillRect(0, 990, 720, 30);
      // 場地 x 60~660、y 270~990
      ctx.fillStyle = '#4a3a2a'; ctx.fillRect(0, 270, 720, 720);
      ctx.fillStyle = '#6a5438'; ctx.fillRect(60, 270, 600, 720);
      ctx.strokeStyle = 'rgba(255,240,200,0.10)'; ctx.lineWidth = 4;
      circle(ctx, 360, 630, 220); ctx.stroke(); circle(ctx, 360, 630, 120); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (var k = 0; k < 40; k++) { circle(ctx, 70 + hash(k) * 580, 280 + hash(k + 99) * 700, 3); ctx.fill(); }
      ctx.lineWidth = 4; ctx.strokeStyle = '#2a1a10'; ctx.strokeRect(60, 270, 600, 720);
      ctx.restore();
    },

    // ---------- 表演場魔物 ----------
    drawShowMonster: function (ctx, state) {
      var s = st(state);
      var sp = pick(s.species, SPECIES, 'fire');
      var big = sp === 'stone';
      var half = big ? 60 : 50;
      var R = big ? 32 : 25;
      var x = N(s.x, 360), y = N(s.y, 630);
      var mode = oneOf(s.mode, ['roam', 'charge', 'loose'], 'roam');
      var crazy = mode !== 'roam';
      var dir = N(s.dir, 1) < 0 ? -1 : 1;
      var rage = clamp(N(s.rage, 40), 0, 100), redLow = clamp(N(s.redLow, 80), 0, 100);
      var marks = clamp(Math.round(N(s.marks, 0)), 0, 4);
      var mult = N(s.mult, 0);
      var lv = clamp(Math.round(N(s.level, 0)), 0, 3);
      var fx = oneOf(s.fx, ['none', 'ignited', 'doused'], 'none');
      var fxp = clamp(N(s.fxT, 0) / Math.max(0.01, N(s.fxDur, 0.5)), 0, 1);
      var pp = s.performing === true ? clamp(N(s.performT, 0) / Math.max(0.01, N(s.performDur, 0.5)), 0, 1) : -1;
      var bodyY = big ? -8 : -6;
      ctx.save();
      ctx.translate(x, y);
      // 失控: 規則色外光(唯一的實心規則色面)
      if (crazy) {
        var pz = 0.5 + 0.5 * Math.sin(now() / 90);
        circle(ctx, 0, bodyY, R * 1.35 + pz * 3); ctx.fillStyle = 'rgba(255,59,107,' + (0.25 + 0.15 * pz) + ')'; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = palette.edge; ctx.stroke();
        circle(ctx, 0, bodyY, R * 1.35 + pz * 3 - 3); ctx.lineWidth = 1.2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      }
      // 影
      ctx.beginPath(); ctx.ellipse(0, bodyY + R * 0.8, R * 0.85, R * 0.2, 0, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      // 表演中: 種類色光圈往外擴
      if (pp >= 0) {
        circle(ctx, 0, bodyY, R * (1.0 + 0.45 * pp)); ctx.lineWidth = 4 * (1 - pp) + 1; ctx.strokeStyle = SPECIES[sp].light; ctx.stroke();
      }
      // 雷鳥急衝 / 衝欄: 速度線
      if (s.dashing === true || mode === 'charge') {
        ctx.lineWidth = 3; ctx.strokeStyle = mode === 'charge' ? 'rgba(255,90,120,0.85)' : 'rgba(255,245,160,0.8)';
        for (var i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-dir * R * 0.8, bodyY + i * R * 0.35); ctx.lineTo(-dir * (half - 4), bodyY + i * R * 0.35); ctx.stroke(); }
      }
      // 本體
      ctx.save();
      var sc = pp >= 0 ? 1 + 0.14 * Math.sin(Math.PI * pp) : 1;
      var shake = 0;
      if (mode === 'charge' && N(s.chargeT, 0) > 0) shake = Math.sin(now() / 25) * 3;
      if (mode === 'loose') shake = Math.sin(now() / 60) * 2;
      ctx.translate(shake, bodyY - (mode === 'loose' ? Math.abs(Math.sin(now() / 110)) * 4 : 0));
      ctx.scale(dir * sc, sc);
      monsterBody(ctx, sp, R, {
        eyes: crazy ? 'angry' : 'normal',
        wingUp: s.dashing === true ? 1 : (sp === 'thunder' ? 0.5 + 0.5 * Math.sin(now() / 90) : 0)
      });
      ctx.restore();
      // 被點燃 / 被澆熄(長在本體外緣)
      if (fx !== 'none' && fxp < 1) {
        ctx.globalAlpha = 1 - fxp;
        if (fx === 'ignited') {
          for (var f = 0; f < 6; f++) {
            var a = -Math.PI / 2 + (f - 2.5) * 0.45, fr = R * 1.05;
            var fx0 = Math.cos(a) * fr, fy0 = bodyY + Math.sin(a) * fr - fxp * 6;
            ctx.beginPath(); ctx.ellipse(fx0, fy0, 4, 8, a + Math.PI / 2, 0, TAU); ctx.fillStyle = palette.ignite; ctx.fill();
          }
          circle(ctx, 0, bodyY, R * 1.1); ctx.lineWidth = 3; ctx.strokeStyle = palette.ignite; ctx.stroke();
        } else {
          for (var d = 0; d < 5; d++) {
            var dx = (d - 2) * R * 0.4, dy = bodyY - R * 0.9 + fxp * R * 0.9 + (d % 2) * 6;
            ctx.beginPath(); ctx.moveTo(dx, dy - 6); ctx.quadraticCurveTo(dx + 4, dy + 1, dx, dy + 4); ctx.quadraticCurveTo(dx - 4, dy + 1, dx, dy - 6);
            ctx.fillStyle = palette.douse; ctx.fill();
          }
          circle(ctx, 0, bodyY, R * 1.1); ctx.lineWidth = 3; ctx.strokeStyle = palette.douse; ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      // 失控標記列(頭上); 失控中 5 格全亮
      var topY = -half + 8;
      if (crazy) markRow(ctx, 0, topY, 5, 0, 4, true);
      else if (marks > 0) markRow(ctx, 0, topY, marks, s.markLeft, s.markDur, false);
      // 怒氣條
      var barY = half - 9;
      rageBar(ctx, 0, barY, 90, 12, crazy ? 100 : rage, redLow, marks);
      // Lv(左)與倍率(右), 條上方
      txt(ctx, 'Lv' + lv, -45, barY - 17, 13, palette.textDim, { align: 'left', lw: 3 });
      if (!crazy && mult > 0) {
        var m = clamp(mult, 2, 4);
        var size = Math.round(14 + (m - 2) * 4); // 14 ~ 22
        var lab = '×' + (Math.round(mult * 10) / 10);
        if (m >= 3.5) { var pl = 0.5 + 0.5 * Math.sin(now() / 100); size += Math.round(pl * 2); }
        txt(ctx, lab, 46, barY - 9 - size / 2, size, m >= 3 ? '#ffffff' : '#ffd0dc', { align: 'right', stroke: palette.edge, lw: m >= 3 ? 6 : 4 });
      }
      ctx.restore();
    },

    // ---------- 圍欄 ----------
    drawFence: function (ctx, state) {
      var s = st(state);
      var x = N(s.x, 110), y = N(s.y, 255);
      ctx.save(); ctx.translate(x, y);
      if (s.broken !== true) {
        ctx.fillStyle = '#8a5a30'; ctx.fillRect(-50, -6, 100, 4); ctx.fillRect(-50, 2, 100, 4);
        ctx.fillStyle = '#c08a50';
        for (var i = 0; i < 4; i++) { rr(ctx, -46 + i * 28, -8, 8, 16, 2); ctx.fill(); }
        ctx.lineWidth = 1; ctx.strokeStyle = '#3a2210'; ctx.strokeRect(-50, -6, 100, 4); ctx.strokeRect(-50, 2, 100, 4);
      } else {
        // 破損: 兩端殘樁 + 中段缺口 + 碎片
        ctx.fillStyle = '#6a4424';
        ctx.beginPath(); ctx.moveTo(-50, -6); ctx.lineTo(-24, -6); ctx.lineTo(-18, -1); ctx.lineTo(-26, 2); ctx.lineTo(-20, 6); ctx.lineTo(-50, 6); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(50, -6); ctx.lineTo(26, -6); ctx.lineTo(20, 0); ctx.lineTo(27, 3); ctx.lineTo(22, 6); ctx.lineTo(50, 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#c08a50'; rr(ctx, -46, -8, 8, 16, 2); ctx.fill(); rr(ctx, 38, -8, 8, 16, 2); ctx.fill();
        ctx.fillStyle = '#a07040';
        ctx.save(); ctx.translate(-6, -3); ctx.rotate(0.6); ctx.fillRect(-6, -1.5, 12, 3); ctx.restore();
        ctx.save(); ctx.translate(8, 4); ctx.rotate(-0.4); ctx.fillRect(-5, -1.5, 10, 3); ctx.restore();
        ctx.lineWidth = 2; ctx.strokeStyle = palette.edge; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(-18, 7); ctx.lineTo(18, 7); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.restore();
    },

    // ---------- 觀眾 ----------
    drawVisitor: function (ctx, state) {
      var s = st(state);
      var x = N(s.x, 110), y = N(s.y, 190);
      var mode = oneOf(s.mode, ['watch', 'scared', 'empty'], 'watch');
      var hues = ['#e07a5f', '#81b29a', '#f2cc8f', '#6d9dc5', '#c08ad8', '#e0a050'];
      var shirt = hues[Math.floor(hash(Math.round(x)) * 6) % 6];
      ctx.save(); ctx.translate(x, y);
      // 椅子
      rr(ctx, -26, 18, 52, 22, 5); ctx.fillStyle = '#4a2a3e'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#2a1424'; ctx.stroke();
      rr(ctx, -26, 38, 6, 6, 1); ctx.fill(); rr(ctx, 20, 38, 6, 6, 1); ctx.fill();
      if (mode === 'watch') {
        rr(ctx, -15, -6, 30, 30, 10); ctx.fillStyle = shirt; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.stroke();
        circle(ctx, 0, -18, 12); ctx.fillStyle = '#f0c8a0'; ctx.fill(); ctx.stroke();
        circle(ctx, -4, -19, 1.8); ctx.fillStyle = '#1a1020'; ctx.fill(); circle(ctx, 4, -19, 1.8); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -15, 4, 0.2, Math.PI - 0.2); ctx.lineWidth = 1.5; ctx.strokeStyle = '#1a1020'; ctx.stroke();
      } else if (mode === 'scared') {
        ctx.save(); ctx.rotate(-0.18);
        rr(ctx, -15, -8, 30, 28, 10); ctx.fillStyle = shirt; ctx.fill();
        // 舉手
        ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.strokeStyle = '#f0c8a0';
        ctx.beginPath(); ctx.moveTo(-13, -4); ctx.lineTo(-24, -26); ctx.moveTo(13, -4); ctx.lineTo(24, -26); ctx.stroke();
        circle(ctx, 0, -20, 12); ctx.fillStyle = '#d8e0f0'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.stroke();
        circle(ctx, -4, -22, 2.4); ctx.fillStyle = '#1a1020'; ctx.fill(); circle(ctx, 4, -22, 2.4); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, -14, 3, 4, 0, 0, TAU); ctx.fill();
        ctx.restore();
        // 驚嚇線(圓頭短線)
        ctx.lineWidth = 2.5; ctx.strokeStyle = '#ffffff'; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(18, -38); ctx.lineTo(22, -30); ctx.moveTo(-18, -38); ctx.lineTo(-22, -30); ctx.stroke();
      } else {
        // 空位: 椅背虛線
        rr(ctx, -20, -10, 40, 30, 8); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.restore();
    },

    // ---------- 商店項目 ----------
    drawShopItem: function (ctx, state) {
      var s = st(state);
      var x = N(s.x, 360), y = N(s.y, 200);
      var item = pick(s.item, SHOP, 'club');
      var info = SHOP[item];
      var isWeapon = !!WEAPONS[item];
      var owned = s.owned === true, eq = s.equipped === true, aff = s.affordable === true;
      var cost = Math.round(N(s.cost, 0)), lv = Math.round(N(s.level, 0));
      var x0 = x - 300, y0 = y - 55;
      ctx.save();
      rr(ctx, x0 + 3, y0 + 3, 594, 104, 12); ctx.fillStyle = eq ? palette.panelHi : palette.panel; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = palette.line; ctx.stroke();
      // 圖示
      ctx.save(); ctx.translate(x0 + 58, y0 + 55);
      circle(ctx, 0, 0, 36); ctx.fillStyle = '#16111f'; ctx.fill();
      if (isWeapon) { ctx.rotate(-Math.PI / 4); ctx.translate(-24, 0); weaponShape(ctx, item, 50); }
      else if (item === 'attack') { ctx.rotate(-Math.PI / 4); ctx.translate(-20, 0); weaponShape(ctx, 'sword', 40); }
      else if (item === 'armor') { heartIcon(ctx, 0, 2, 30, true); }
      else { ropeIcon(ctx, -2, 0, 16, true); }
      ctx.restore();
      if (item === 'attack') { txt(ctx, '+1', x0 + 80, y0 + 82, 16, palette.gold, { lw: 3 }); }
      // 名稱與說明
      txt(ctx, info.name, x0 + 112, y0 + 36, 24, palette.text, { align: 'left', lw: 4, max: 290 });
      txt(ctx, info.desc, x0 + 112, y0 + 74, 17, palette.textDim, { align: 'left', lw: 3, max: 300 });
      // 右側: 價格 / 已擁有 / 裝備中
      if (isWeapon && owned) {
        txt(ctx, '已擁有', x0 + 560, y0 + 36, 19, palette.textDim, { align: 'right', lw: 3 });
      } else {
        coinIcon(ctx, x0 + 470, y0 + 36, 12);
        txt(ctx, String(cost), x0 + 560, y0 + 36, 24, aff ? palette.gold : palette.danger, { align: 'right', lw: 4 });
      }
      if (isWeapon && eq) {
        rr(ctx, x0 + 462, y0 + 58, 100, 34, 17); ctx.fillStyle = palette.tamerRim; ctx.fill();
        txt(ctx, '裝備中', x0 + 512, y0 + 75, 17, '#1c1626', { stroke: false });
      } else if (!isWeapon && lv > 0) {
        txt(ctx, '已買 ' + lv + ' 次', x0 + 560, y0 + 76, 16, palette.textDim, { align: 'right', lw: 3 });
      }
      if (s.selected === true) selFrame(ctx, x0 + 3, y0 + 3, 594, 104, 12);
      ctx.restore();
    },

    // ---------- 按鈕 ----------
    drawButton: function (ctx, state) {
      var s = st(state);
      var x = N(s.x, 160), y = N(s.y, 1100), w = Math.max(10, N(s.w, 400)), h = Math.max(10, N(s.h, 100));
      var label = S(s.label, '');
      var sel = s.selected === true;
      var main = label === '開演' ? '#c0304a' : '#3a5a9a';
      ctx.save();
      rr(ctx, x + 3, y + 3, w - 6, h - 6, 14); ctx.fillStyle = sel ? main : '#2a2238'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = sel ? '#ffffff' : main; ctx.stroke();
      txt(ctx, label, x + w / 2, y + h / 2, Math.min(34, h * 0.4), sel ? '#ffffff' : palette.textDim, { lw: 5, max: w - 20 });
      if (sel) selFrame(ctx, x + 3, y + 3, w - 6, h - 6, 14);
      ctx.restore();
    },

    // ---------- 飄字 ----------
    drawFloatText: function (ctx, state) {
      var s = st(state);
      var kind = oneOf(s.kind, ['gold', 'redGold', 'repDown', 'capture', 'levelUp', 'coin20'], 'gold');
      var dur = Math.max(0.01, N(s.dur, 1)), p = clamp(N(s.t, 0) / dur, 0, 1);
      if (N(s.t, 0) >= dur) return;
      var x = N(s.x, 360), y = N(s.y, 600) - 40 * p;
      var alpha = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
      var cfg = {
        gold: { size: 22, color: palette.gold, stroke: '#3a2400', icon: 'coin' },
        redGold: { size: 28, color: '#ffffff', stroke: palette.edge, icon: 'coin' },
        repDown: { size: 24, color: palette.rep, stroke: '#2a0a20', icon: 'repX' },
        capture: { size: 30, color: palette.capture, stroke: '#0a2a14' },
        levelUp: { size: 26, color: '#8ff0ff', stroke: '#0a2a3a' },
        coin20: { size: 24, color: palette.gold, stroke: '#3a2400', icon: 'coin' }
      }[kind];
      var t = S(s.text, '');
      ctx.save();
      ctx.globalAlpha = alpha;
      var pop = p < 0.15 ? 0.7 + 2 * p : 1;
      ctx.translate(x, y); ctx.scale(pop, pop);
      ctx.font = 'bold ' + cfg.size + 'px ' + FONT;
      var w = ctx.measureText ? (ctx.measureText(t).width || 0) : 0;
      if (cfg.icon === 'coin') coinIcon(ctx, -w / 2 - cfg.size * 0.55, 0, cfg.size * 0.36);
      if (cfg.icon === 'repX') { repIcon(ctx, -w / 2 - cfg.size * 0.55, 0, cfg.size * 0.4); }
      txt(ctx, t, 0, 0, cfg.size, cfg.color, { stroke: cfg.stroke, lw: kind === 'redGold' ? 7 : 5 });
      ctx.restore();
    },

    // ---------- 結算 ----------
    drawResultPanel: function (ctx, state) {
      var s = st(state);
      var rep = Math.round(N(s.rep, 0)), g = Math.round(N(s.goldEarned, 0)), edge = Math.round(N(s.edgeShows, 0));
      var stars = clamp(Math.round(N(s.stars, 0)), 0, 3);
      var roster = Array.isArray(s.roster) ? s.roster : [];
      ctx.save();
      ctx.fillStyle = 'rgba(8,4,12,0.7)'; ctx.fillRect(0, 120, 720, 1160);
      rr(ctx, 60, 160, 600, 1000, 20); ctx.fillStyle = palette.panel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = palette.line; ctx.stroke();
      txt(ctx, '七天巡演結束', 360, 222, 38, palette.text, { lw: 6 });
      // 星數
      for (var i = 0; i < 3; i++) {
        var sx = 240 + i * 120, sy = 330;
        starPath(ctx, sx, sy, 46, 20, 5);
        ctx.fillStyle = i < stars ? palette.gold : '#3a3248'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = i < stars ? '#8a5a00' : '#5a5068'; ctx.stroke();
      }
      // 數字
      var rows = [['總名聲', rep, palette.rep, 'rep'], ['累計賺得金幣', g, palette.gold, 'coin'], ['邊緣表演次數', edge, palette.edge, 'mark']];
      for (var r = 0; r < 3; r++) {
        var ry = 450 + r * 80;
        rr(ctx, 100, ry - 32, 520, 64, 10); ctx.fillStyle = '#1b1526'; ctx.fill();
        if (rows[r][3] === 'rep') repIcon(ctx, 136, ry, 16);
        else if (rows[r][3] === 'coin') coinIcon(ctx, 136, ry, 15);
        else { ctx.beginPath(); ctx.moveTo(136, ry - 12); ctx.lineTo(148, ry); ctx.lineTo(136, ry + 12); ctx.lineTo(124, ry); ctx.closePath(); ctx.fillStyle = palette.edge; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); }
        txt(ctx, rows[r][0], 166, ry, 24, palette.text, { align: 'left', lw: 4 });
        txt(ctx, String(rows[r][1]), 596, ry, 32, rows[r][2], { align: 'right', lw: 5 });
      }
      // 陣容
      txt(ctx, '陣容', 360, 720, 24, palette.textDim, { lw: 4 });
      var n = Math.min(6, roster.length);
      for (var k = 0; k < n; k++) {
        var it = st(roster[k]);
        var col = k % 3, row = Math.floor(k / 3);
        var cx = 180 + col * 180, cy = 810 + row * 150;
        rr(ctx, cx - 80, cy - 62, 160, 130, 12); ctx.fillStyle = '#1b1526'; ctx.fill();
        ctx.save(); ctx.translate(cx, cy - 10); monsterBody(ctx, it.species, 30, {}); ctx.restore();
        txt(ctx, spc(it.species).name + ' Lv ' + clamp(Math.round(N(it.level, 0)), 0, 3), cx, cy + 46, 17, palette.text, { lw: 3, max: 150 });
      }
      txt(ctx, '按 Z 重來', 360, 1110, 30, palette.select, { lw: 6 });
      ctx.restore();
    },

    // ---------- HUD ----------
    drawHud: function (ctx, state) {
      var s = st(state);
      var phase = oneOf(s.phase, ['guide', 'select', 'dungeon', 'setup1', 'setup2', 'show', 'shop', 'result'], 'select');
      if (phase === 'guide') return;
      ctx.save();
      ctx.fillStyle = '#100c18'; ctx.fillRect(0, 0, 720, 120);
      ctx.fillStyle = palette.line; ctx.fillRect(0, 118, 720, 2);
      var day = Math.round(N(s.day, 1)), dayMax = Math.round(N(s.dayMax, 7));
      txt(ctx, '第 ' + day + ' / ' + dayMax + ' 天', 16, 26, 22, palette.text, { align: 'left', lw: 4 });
      var title = { select: '選地下城', dungeon: '', setup1: '選上場', setup2: '布置', show: '表演', shop: '商店', result: '結算' }[phase];
      if (phase === 'dungeon') title = DUNGEONS[pick(s.dungeon, DUNGEONS, 'cave')].name;
      txt(ctx, title, 360, 26, 24, palette.text, { lw: 4 });
      coinIcon(ctx, 520, 26, 11);
      txt(ctx, String(Math.round(N(s.gold, 0))), 538, 26, 22, palette.gold, { align: 'left', lw: 4 });
      repIcon(ctx, 624, 26, 12);
      txt(ctx, String(Math.round(N(s.rep, 0))), 642, 26, 22, palette.rep, { align: 'left', lw: 4 });
      // 第二列
      var timeMax = N(s.timeMax, 0), timeLeft = clamp(N(s.timeLeft, 0), 0, Math.max(0, timeMax));
      if (phase === 'dungeon') {
        var mh = Math.max(0, Math.round(N(s.maxHearts, 5))), hh = clamp(Math.round(N(s.hearts, mh)), 0, mh);
        var hs = mh > 8 ? Math.max(12, Math.floor(200 / mh)) : 22;
        for (var i = 0; i < Math.min(mh, 14); i++) heartIcon(ctx, 22 + i * (hs + 2), 64, hs * 0.9, i < hh);
        var rm = Math.max(0, Math.round(N(s.ropeMax, 3))), rp = clamp(Math.round(N(s.ropes, rm)), 0, rm);
        for (var j = 0; j < Math.min(rm, 8); j++) ropeIcon(ctx, 280 + j * 26, 64, 8, j < rp);
        // 武器 + X 冷卻
        var wx = 520, wy = 64;
        circle(ctx, wx, wy, 18); ctx.fillStyle = '#1b1526'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = palette.line; ctx.stroke();
        ctx.save(); ctx.translate(wx, wy); ctx.rotate(-Math.PI / 4); ctx.translate(-13, 0); weaponShape(ctx, s.weapon, 26); ctx.restore();
        var xm = N(s.xCdMax, 0), xl = clamp(N(s.xCdLeft, 0), 0, Math.max(0, xm));
        var kx = 566;
        rr(ctx, kx - 16, wy - 16, 32, 32, 6);
        if (xm <= 0) { ctx.fillStyle = '#2a2236'; ctx.fill(); txt(ctx, 'X', kx, wy, 18, '#5a5068', { stroke: false }); crossMark(ctx, kx, wy, 14, '#5a5068'); }
        else {
          var ready = xl <= 0;
          ctx.fillStyle = ready ? palette.skillFx : '#3a3248'; ctx.fill();
          if (!ready) { // 已恢復的部分用本色、剩餘深色
            ctx.save(); rr(ctx, kx - 16, wy - 16, 32, 32, 6); ctx.clip();
            ctx.fillStyle = 'rgba(255,194,58,0.45)'; ctx.fillRect(kx - 16, wy + 16 - 32 * (1 - xl / xm), 32, 32 * (1 - xl / xm));
            ctx.restore();
          }
          txt(ctx, 'X', kx, wy, 18, ready ? '#1c1626' : '#b8aecb', { stroke: false });
        }
      }
      if ((phase === 'dungeon' || phase === 'show') && timeMax > 0) {
        var bx = phase === 'dungeon' ? 600 : 160, bw = phase === 'dungeon' ? 100 : 400;
        rr(ctx, bx, 56, bw, 16, 8); ctx.fillStyle = '#2a2236'; ctx.fill();
        var fr = timeLeft / timeMax;
        if (fr > 0) { rr(ctx, bx, 56, Math.max(8, bw * fr), 16, 8); ctx.fillStyle = timeLeft <= 10 ? palette.danger : '#9fd0ff'; ctx.fill(); }
        txt(ctx, Math.ceil(timeLeft) + '', phase === 'dungeon' ? 650 : bx + bw + 30, phase === 'dungeon' ? 64 : 64, phase === 'dungeon' ? 13 : 22,
          '#ffffff', { lw: 3 });
      }
      // 訊息列
      var msg = S(s.message, '');
      if (msg) {
        rr(ctx, 60, 86, 600, 28, 14); ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill();
        txt(ctx, msg, 360, 100, 18, palette.text, { lw: 3, max: 580 });
      }
      ctx.restore();
    },

    // ---------- 說明頁示意圖 ----------
    drawGuidePage: function (ctx, state) {
      var s = st(state);
      var page = clamp(Math.round(N(s.page, 0)), 0, 4);
      var bx = N(s.x, 40), by = N(s.y, 300), bw = Math.max(1, N(s.w, 640)), bh = Math.max(1, N(s.h, 600));
      var VW = 640, VH = [420, 520, 560, 420, 480][page];
      var sc = Math.min(bw / VW, bh / VH);
      ctx.save();
      ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
      ctx.translate(bx + (bw - VW * sc) / 2, by + (bh - VH * sc) / 2);
      ctx.scale(sc, sc);
      GUIDE[page](ctx, VW, VH);
      ctx.restore();
    }
  };

  // ---------- 說明頁各頁(虛擬座標 VW × VH) ----------
  function panelBg(ctx, x, y, w, h) {
    rr(ctx, x, y, w, h, 12); ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.stroke();
  }
  function label(ctx, s, x, y, size) { txt(ctx, s, x, y, size || 18, palette.text, { lw: 4 }); }
  function curvedArrow(ctx, pts, color, w) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i + 1 < pts.length; i += 2) ctx.quadraticCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    ctx.lineCap = 'round';
    ctx.lineWidth = (w || 5) + 3; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.stroke();
    ctx.lineWidth = w || 5; ctx.strokeStyle = color; ctx.stroke();
    var a = pts[pts.length - 1], b = pts[pts.length - 2];
    arrowHead(ctx, a[0], a[1], Math.atan2(a[1] - b[1], a[0] - b[0]), 12, color);
  }

  var GUIDE = [
    // 第 1 頁 地下城: 棍棒朝右敲火蜥蜴; 火圈預警; 移動箭頭繞出火圈; 鍵帽貼在動作旁
    function (ctx, VW, VH) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, VW, 420); ctx.clip();
      for (var c = 0; c < 11; c++) for (var r = 0; r < 7; r++) {
        var kind = (r === 0 || c === 0) ? 'wall' : (c === 9 && r === 5 ? 'lava' : 'floor');
        Art.drawTile(ctx, { x: 30 + c * 60, y: 30 + r * 60, dungeon: 'cave', kind: kind, room: 'top', nest: (c === 8 && r === 2) });
      }
      ctx.restore();
      // 火圈預警(以火蜥蜴為中心)
      Art.drawHazard(ctx, { x: 360, y: 220, kind: 'firering', phase: 'warn', radius: 120, t: 0.3, dur: 0.5, angle: 0, reflected: false });
      Art.drawWildMonster(ctx, { x: 360, y: 220, species: 'fire', hp: 6, maxHp: 10, hit: true, weak: false, stunLeft: 0, stunDur: 2, lassoed: false, casting: true, dashing: false, dir: -1 });
      Art.drawWeaponFx(ctx, { x: 300, y: 220, weapon: 'club', move: 'normal', shape: 'arc', angle: 0, spread: 100 * Math.PI / 180, radius: 70, t: 0.06, dur: 0.2 });
      Art.drawTamer(ctx, { x: 300, y: 220, facing: 2, weapon: 'club', dashing: false, blink: false, lassoing: false });
      // 移動箭頭: 從馴獸師往左下繞出火圈
      curvedArrow(ctx, [[288, 250], [250, 340], [170, 360]], '#ffffff', 5);
      // 鍵帽(貼在動作旁)
      keycap(ctx, 150, 392, '↑↓←→', 78); label(ctx, '走', 150, 352, 18);
      keycap(ctx, 330, 124, 'Z'); label(ctx, '攻擊', 380, 124, 18);
      keycap(ctx, 236, 196, 'X'); label(ctx, '武器技', 236, 160, 16);
      label(ctx, '火圈預警', 520, 120, 16);
    },
    // 第 2 頁 收服
    function (ctx, VW, VH) {
      panelBg(ctx, 6, 6, 308, 380); panelBg(ctx, 326, 6, 308, 380);
      // 左: 站上殘血水母, 準備捕捉一半
      Art.drawWildMonster(ctx, { x: 160, y: 200, species: 'water', hp: 2, maxHp: 7, hit: false, weak: true, stunLeft: 0, stunDur: 2, lassoed: false, casting: false, dashing: false, dir: 1 });
      Art.drawTamer(ctx, { x: 172, y: 222, facing: 0, weapon: 'club', dashing: false, blink: false, lassoing: false });
      Art.drawCaptureRing(ctx, { x: 160, y: 200, t: 0.4, dur: 0.8 });
      label(ctx, '① 站上去', 160, 350, 20);
      // 右: 套索中, 繞圈一半
      var mx = 480, my = 190;
      ctx.save(); ctx.setLineDash([8, 7]);
      circle(ctx, mx, my, 105); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.stroke(); ctx.setLineDash([]); ctx.restore();
      Art.drawWildMonster(ctx, { x: mx, y: my, species: 'water', hp: 2, maxHp: 7, hit: false, weak: true, stunLeft: 0, stunDur: 2, lassoed: true, casting: false, dashing: false, dir: 1 });
      Art.drawLasso(ctx, { x1: mx, y1: my + 105, x2: mx, y2: my, progress: 0.5, t: 1.5, limit: 5, len: 105, maxLen: 220 });
      Art.drawTamer(ctx, { x: mx, y: my + 105, facing: 6, weapon: 'club', dashing: false, blink: false, lassoing: true });
      arrowHead(ctx, mx - 105, my, -Math.PI / 2, 14, '#ffffff');
      arrowHead(ctx, mx + 105, my, Math.PI / 2, 14, '#ffffff');
      label(ctx, '② 繞牠一圈', 480, 350, 20);
      // 角落: 環填滿 → 收服(打勾)
      panelBg(ctx, 220, 398, 200, 116);
      ctx.save(); ctx.translate(320, 456); ctx.scale(0.55, 0.55);
      ctx.globalAlpha = 0.35;
      Art.drawWildMonster(ctx, { x: 0, y: 0, species: 'water', hp: 2, maxHp: 7, weak: true, lassoed: true, stunLeft: 0, stunDur: 2, dir: 1 });
      ctx.globalAlpha = 1;
      circle(ctx, 0, 0, 52); ctx.lineWidth = 8; ctx.strokeStyle = palette.lassoProg; ctx.stroke();
      ctx.restore();
      checkMark(ctx, 320, 456, 40, palette.capture);
      txt(ctx, '收服!', 390, 488, 18, palette.capture, { lw: 4 });
    },
    // 第 3 頁 布置 → 開演
    function (ctx, VW, VH) {
      // 左: 布置畫面縮圖(真實座標 0~720 × 130~1280, 縮 0.42)
      var s1 = 0.42;
      ctx.save(); ctx.translate(4, 4); ctx.scale(s1, s1); ctx.translate(0, -130);
      ctx.beginPath(); ctx.rect(0, 130, 720, 1150); ctx.clip();
      ctx.fillStyle = palette.bg; ctx.fillRect(0, 130, 720, 1150);
      Art.drawShowArena(ctx);
      for (var i = 0; i < 6; i++) Art.drawFence(ctx, { x: 110 + i * 100, y: 255, side: 'top', broken: false });
      for (var j = 0; j < 6; j++) Art.drawFence(ctx, { x: 110 + j * 100, y: 1005, side: 'bottom', broken: false });
      for (var v = 0; v < 6; v++) { Art.drawVisitor(ctx, { x: 110 + v * 100, y: 190, side: 'top', mode: 'watch' }); Art.drawVisitor(ctx, { x: 110 + v * 100, y: 1080, side: 'bottom', mode: 'watch' }); }
      var cells = [];
      for (var r = 0; r < 4; r++) for (var c = 0; c < 3; c++) cells.push([160 + 200 * c, 360 + 180 * r]);
      var content = { 0: ['m', 'fire'], 4: ['m', 'water'], 2: ['g', 'drum'], 9: ['m', 'thunder'] };
      cells.forEach(function (p, k) {
        Art.drawSetupCell(ctx, { x: p[0], y: p[1], selected: k === 7 });
        var it = content[k];
        if (it && it[0] === 'm') Art.drawShowMonster(ctx, { x: p[0], y: p[1], species: it[1], level: 0, rage: 40, redLow: 80, mult: 0, marks: 0, markLeft: 0, markDur: 4, mode: 'roam', performing: false, fx: 'none', dir: 1 });
        if (it && it[0] === 'g') Art.drawGadget(ctx, { x: p[0], y: p[1], kind: it[1], fired: false, spent: false });
      });
      Art.drawSetupInfo(ctx, { gold: 45, placed: 3, picked: 4 });
      Art.drawButton(ctx, { x: 480, y: 1160, w: 180, h: 100, label: '開演', selected: false });
      ctx.restore();
      // 游標格(第 7 格: 欄 1 列 2)的位置 → 選擇面板
      var cx = 4 + 360 * s1, cy = 4 + (720 - 130) * s1;
      // 面板縮圖(真實 x 120~600, y 240~600 → 縮 0.4, 放右上)
      var ps = 0.4, px = 330, py = 10;
      ctx.save(); ctx.translate(px, py); ctx.scale(ps, ps); ctx.translate(-120, -240);
      ctx.beginPath(); ctx.rect(120, 240, 480, 430); ctx.clip();
      Art.drawPickerPanel(ctx, { index: 1, options: [
        { type: 'monster', key: 'spike', name: '刺蝟', cost: 0, desc: '', affordable: true },
        { type: 'gadget', key: 'drum', name: '戰鼓', cost: 15, desc: '每 3 秒讓周圍魔物生氣', affordable: true },
        { type: 'gadget', key: 'fountain', name: '噴泉', cost: 15, desc: '每 3 秒讓周圍魔物冷靜', affordable: true },
        { type: 'gadget', key: 'valve', name: '安全閥', cost: 20, desc: '周圍魔物快失控時自動降標記一次', affordable: true },
        { type: 'clear', key: '', name: '清空', cost: 0, desc: '', affordable: true }
      ] });
      ctx.restore();
      // 游標 → 面板 連線
      ctx.save(); ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(cx + 40, cy - 20); ctx.lineTo(px, py + 40); ctx.lineWidth = 2.5; ctx.strokeStyle = palette.select; ctx.stroke();
      ctx.restore();
      label(ctx, 'Z 開面板', 520, 196, 16);
      // 箭頭 → 開演後縮圖
      curvedArrow(ctx, [[400, 230], [400, 270], [430, 290]], '#ffffff', 5);
      label(ctx, '開演後', 520, 252, 18);
      var s2 = 0.32, ox = 405, oy = 280;
      ctx.save(); ctx.translate(ox, oy); ctx.scale(s2, s2); ctx.translate(-60, -250);
      ctx.beginPath(); ctx.rect(60, 250, 600, 770); ctx.clip();
      Art.drawShowArena(ctx);
      for (var f = 0; f < 6; f++) { Art.drawFence(ctx, { x: 110 + f * 100, y: 255, side: 'top', broken: false }); Art.drawFence(ctx, { x: 110 + f * 100, y: 1005, side: 'bottom', broken: false }); }
      Art.drawHazard(ctx, { x: 230, y: 420, kind: 'firering', phase: 'active', radius: 120, t: 0.1, dur: 0.5 });
      Art.drawGadget(ctx, { x: 560, y: 360, kind: 'drum', fired: true, spent: false });
      Art.drawShowMonster(ctx, { x: 230, y: 420, species: 'fire', level: 0, rage: 70, redLow: 80, mult: 0, marks: 0, mode: 'roam', performing: true, performT: 0.2, performDur: 0.5, fx: 'none', dir: 1 });
      Art.drawShowMonster(ctx, { x: 310, y: 490, species: 'water', level: 0, rage: 62, redLow: 80, mult: 0, marks: 0, mode: 'roam', performing: false, fx: 'ignited', fxT: 0.1, fxDur: 0.5, dir: -1 });
      Art.drawShowMonster(ctx, { x: 470, y: 760, species: 'thunder', level: 0, rage: 85, redLow: 80, mult: 2, marks: 0, mode: 'roam', performing: false, fx: 'none', dir: -1, dashing: true });
      Art.drawShowMonster(ctx, { x: 200, y: 880, species: 'spike', level: 0, rage: 45, redLow: 80, mult: 0, marks: 0, mode: 'roam', performing: false, fx: 'none', dir: 1 });
      ctx.restore();
      ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.strokeRect(ox, oy, 600 * s2, 770 * s2); ctx.restore();
    },
    // 第 4 頁 紅區: 標記 0 / 2 / 4 → ×2 / ×3 / ×4, 最右 5 個撞欄
    function (ctx, VW, VH) {
      var xs = [80, 230, 380];
      var mk = [0, 2, 4], ml = [2, 3, 4], gold = ['+10', '+15', '+20'];
      for (var i = 0; i < 3; i++) {
        var coins = i + 1;
        for (var c = 0; c < coins * 2; c++) coinIcon(ctx, xs[i] - (coins * 2 - 1) * 9 + c * 18, 110 - (c % 2) * 14, 9);
        Art.drawFloatText(ctx, { x: xs[i], y: 160, text: gold[i] + ' ×' + ml[i], kind: 'redGold', t: 0.3, dur: 1 });
        Art.drawShowMonster(ctx, { x: xs[i], y: 260, species: 'fire', level: 1, rage: mk[i] === 0 ? 90 : 100, redLow: 75, mult: ml[i], marks: mk[i], markLeft: 2.5, markDur: 4, mode: 'roam', performing: true, performT: 0.15, performDur: 0.5, fx: 'none', dir: 1 });
      }
      // 最右: 失控撞欄
      ctx.save(); ctx.beginPath(); ctx.rect(450, 20, 190, 380); ctx.clip();
      ctx.fillStyle = '#2a1626'; ctx.fillRect(450, 20, 190, 130);
      ctx.fillStyle = '#6a5438'; ctx.fillRect(450, 160, 190, 240);
      ctx.restore();
      // 5 個標記 → 失控: 撞破圍欄、在觀眾席亂竄攻擊觀眾
      Art.drawFence(ctx, { x: 545, y: 155, side: 'top', broken: true });
      Art.drawVisitor(ctx, { x: 495, y: 90, side: 'top', mode: 'scared' });
      Art.drawShowMonster(ctx, { x: 590, y: 88, species: 'fire', level: 1, rage: 100, redLow: 75, mult: 0, marks: 4, mode: 'loose', looseT: 1, looseDur: 6, performing: false, fx: 'none', dir: -1 });
      crossMark(ctx, 495, 66, 34, palette.danger);
      curvedArrow(ctx, [[545, 300], [560, 230], [565, 165]], palette.edge, 5);
      txt(ctx, '名聲 −3', 495, 190, 16, palette.rep, { lw: 4 });
      label(ctx, '失控', 545, 330, 20);
    },
    // 第 5 頁 目標: 流程圈 ×7 天
    function (ctx, VW, VH) {
      var cx = 230, cy = 240, R = 160;
      var nodes = [['地下城', -Math.PI / 2], ['布置', 0], ['表演', Math.PI / 2], ['商店', Math.PI]];
      ctx.save();
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      for (var i = 0; i < 4; i++) {
        var a0 = nodes[i][1] + 0.42, a1 = nodes[i][1] + Math.PI / 2 - 0.42;
        ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1); ctx.stroke();
        arrowHead(ctx, cx + Math.cos(a1) * R, cy + Math.sin(a1) * R, a1 + Math.PI / 2, 12, '#ffffff');
      }
      ctx.restore();
      for (var k = 0; k < 4; k++) {
        var nx = cx + Math.cos(nodes[k][1]) * R, ny = cy + Math.sin(nodes[k][1]) * R;
        circle(ctx, nx, ny, 50); ctx.fillStyle = palette.panel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = palette.line; ctx.stroke();
        ctx.save(); ctx.translate(nx, ny - 8);
        if (k === 0) { ctx.scale(0.75, 0.75); Art.drawTamer(ctx, { x: 0, y: 0, facing: 2, weapon: 'club' }); }
        else if (k === 1) { ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; for (var g = 0; g < 3; g++) for (var h = 0; h < 2; h++) ctx.strokeRect(-24 + g * 16, -18 + h * 16, 14, 14); }
        else if (k === 2) { monsterBody(ctx, 'fire', 22, {}); }
        else { coinIcon(ctx, 0, 0, 16); }
        ctx.restore();
        txt(ctx, nodes[k][0], nx, ny + 32, 17, palette.text, { lw: 4 });
      }
      txt(ctx, '×7 天', cx, cy, 34, palette.select, { lw: 6 });
      // 表演旁: 名聲星往上加
      var sx = cx + 80, sy = cy + R;
      for (var r = 0; r < 3; r++) { repIcon(ctx, sx + r * 22, sy - 20 - r * 22, 10); }
      txt(ctx, '+名聲', sx + 52, sy - 78, 16, palette.rep, { lw: 4 });
      // 終點: 結算星數
      curvedArrow(ctx, [[cx + R + 50, cy], [470, cy], [470, cy + 60]], palette.select, 5);
      panelBg(ctx, 420, 320, 200, 120);
      for (var t = 0; t < 3; t++) {
        starPath(ctx, 470 + t * 50, 365, 22, 10, 5); ctx.fillStyle = palette.gold; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#8a5a00'; ctx.stroke();
      }
      txt(ctx, '結算', 520, 415, 18, palette.text, { lw: 4 });
    }
  ];

  window.Art = Art;
})();
