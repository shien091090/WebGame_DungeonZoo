/* 怪獸夜場節目單 — 美術(Canvas 2D 幾何繪製, 無外部資源)
 * 全域 window.Art; 函式簽章照 interface.json, 說明見 style.md */
(function () {
  'use strict';

  var W = 1280, H = 720;
  var FONT = '"Microsoft JhengHei","微軟正黑體","PingFang TC","Noto Sans CJK TC","Noto Sans TC",sans-serif';
  function F(sz, b) { return (b === false ? '' : 'bold ') + Math.round(sz) + 'px ' + FONT; }

  var PAL = {
    bg: '#151225', bg2: '#1d1833', panel: '#262040', panelHi: '#342c56', line: '#4d4478',
    text: '#f4f0ff', textDim: '#a79fc4', outline: '#140f20',
    gold: '#ffd23f', rep: '#ff9ad5', select: '#ffe14a',
    danger: '#ff3b4e', ignite: '#ff7a2a', douse: '#38a8ff',
    player: '#ffffff', skill: '#ffd23f', ok: '#5ee08a',
    tamerCoat: '#f2efe6', tamerHat: '#2d3a8c', rope: '#e2b46e',
    spore: '#d65ce0', frog: '#4fd05a', mole: '#c8783a', tumble: '#e8cf4a', butterfly: '#5ad8f0', crab: '#7a7cf0',
    redZone: '#ff3b4e', rageMid: '#ffb03a', rageLow: '#7d8fb8', mark: '#ff3b4e',
    stage: '#2c2147', stands: '#221a38', fence: '#c89a5a', visitor: '#f0c9a0'
  };

  var SPECIES = ['spore', 'frog', 'mole', 'tumble', 'butterfly', 'crab'];
  var SPN = { spore: '菇菇球', frog: '露水蛙', mole: '鑽沙鼴', tumble: '風滾草', butterfly: '冰晶蝶', crab: '礦石蟹' };
  var DUNGEONS = ['forest', 'dune', 'mine'];
  var DUN = {
    forest: { name: '菇菇林', sp: ['spore', 'frog'] },
    dune: { name: '沙丘巢', sp: ['mole', 'tumble'] },
    mine: { name: '冰晶礦坑', sp: ['butterfly', 'crab'] }
  };
  var TH = {
    forest: { floor: '#2f4a2c', hall: '#3a5634', speck: '#40613a', wall: '#17251a', wallTop: '#2a4028', pillar: '#7d8a66', pillarHi: '#a9b68e', slow: '#5c4126', slowHi: '#7a5935', accent: '#7fe07a' },
    dune: { floor: '#a8844e', hall: '#b8945c', speck: '#95733f', wall: '#5e4224', wallTop: '#7f5c34', pillar: '#8c6a3e', pillarHi: '#b89060', slow: '#d9bf86', slowHi: '#f0dcae', accent: '#ffd27a' },
    mine: { floor: '#28304a', hall: '#323b58', speck: '#38425f', wall: '#11152a', wallTop: '#222a48', pillar: '#4f5b80', pillarHi: '#7d8bb5', slow: '#7cc6e8', slowHi: '#d8f3ff', accent: '#9fe6ff' }
  };
  var WEAPONS = ['club', 'sword', 'spear', 'whip'];
  var WPN = { club: '棍棒', sword: '劍', spear: '長槍', whip: '長鞭' };
  var CARDS = {
    provoke: { name: '激將', named: true, tone: 'ignite', desc: '點名的魔物大怒' },
    chill: { name: '冰鎮', named: true, tone: 'douse', desc: '點名的魔物冷靜下來' },
    rally: { name: '集合', named: true, tone: 'gold', desc: '全場其他魔物跑到點名的魔物身邊' },
    encore: { name: '安可', named: true, tone: 'gold', desc: '點名的魔物連演 3 次' },
    rampage: { name: '橫衝直撞', named: true, tone: 'ignite', desc: '點名的魔物一路撞開別隻' },
    confetti: { name: '彩帶砲', named: false, tone: 'ignite', desc: '彩帶砲轟向最擠的地方' },
    sprinkler: { name: '灑水車', named: false, tone: 'douse', desc: '灑水車沿最氣那隻的那一列開過去' },
    spin: { name: '旋轉舞台', named: false, tone: 'neutral', desc: '舞台轉起來, 全場捲向中央' },
    balloon: { name: '抽獎氣球', named: false, tone: 'mixed', desc: '三顆氣球隨機落下, 紅的點火藍的澆熄' }
  };
  var CARD_KEYS = Object.keys(CARDS);
  var TONE = { ignite: '#e8642a', douse: '#2f8fe0', gold: '#c99a1c', neutral: '#6f6a92', mixed: '#e8642a' };
  var SHOP = {
    club: { name: '棍棒', desc: 'Z 敲擊 X 無', type: 'weapon' },
    sword: { name: '劍', desc: 'Z 斬擊可打回飛彈 X 擊暈', type: 'weapon' },
    spear: { name: '長槍', desc: 'Z 長刺 X 突進', type: 'weapon' },
    whip: { name: '長鞭', desc: 'Z 整圈抽打 X 擊飛', type: 'weapon' },
    attack: { name: '攻擊力', desc: '攻擊力 +1', type: 'up' },
    armor: { name: '護甲', desc: '心 +1', type: 'up' },
    ropeBag: { name: '繩袋', desc: '捕獸繩 +1', type: 'up' }
  };
  CARD_KEYS.forEach(function (k) { if (k !== 'provoke' && k !== 'chill' && k !== 'rally' && k !== 'encore') SHOP[k] = { name: CARDS[k].name, desc: CARDS[k].desc, type: 'card' }; });
  var SHOP_KEYS = Object.keys(SHOP);

  // ---------- 正規化 ----------
  function st(s) { return s && typeof s === 'object' ? s : {}; }
  function N(v, d) { v = Number(v); return isFinite(v) ? v : (d === undefined ? 0 : d); }
  function S(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function T(v) { return v == null ? '' : String(v); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ratio(t, d) { t = N(t); d = N(d); return d > 0 ? clamp(t / d, 0, 1) : 0; }
  function now() { return (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) / 1000; }
  function sp0(v) { return S(v, SPECIES, 'spore'); }

  // ---------- 基本圖元 ----------
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
  }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); }
  function ell(ctx, x, y, rx, ry, rot) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot || 0, 0, Math.PI * 2); }
  function txt(ctx, s, x, y, o) {
    o = o || {}; s = T(s);
    var size = o.size || 16;
    ctx.font = F(size, o.bold);
    if (o.max) {
      var w = ctx.measureText(s).width;
      if (w > o.max && w > 0) { size = Math.max(9, size * o.max / w); ctx.font = F(size, o.bold); }
    }
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.base || 'middle';
    if (o.stroke !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = o.lw || Math.max(2.5, size / 4.5);
      ctx.strokeStyle = o.sc || 'rgba(10,6,20,0.92)';
      ctx.strokeText(s, x, y);
    }
    ctx.fillStyle = o.color || PAL.text;
    ctx.fillText(s, x, y);
  }
  // 依寬度把字切成多行(中文逐字)
  function wrap(ctx, s, maxW, size, bold) {
    ctx.font = F(size, bold); s = T(s);
    var lines = [], cur = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i), t = cur + c;
      if (cur && ctx.measureText(t).width > maxW) { lines.push(cur); cur = c === ' ' ? '' : c; } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function starPath(ctx, cx, cy, R, r, n) {
    n = n || 5; ctx.beginPath();
    for (var i = 0; i < n * 2; i++) {
      var a = -Math.PI / 2 + i * Math.PI / n, rad = i % 2 ? r : R;
      var px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
  }
  function heartPath(ctx, cx, cy, s) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.45);
    ctx.bezierCurveTo(cx - s * 0.62, cy + s * 0.02, cx - s * 0.5, cy - s * 0.5, cx, cy - s * 0.22);
    ctx.bezierCurveTo(cx + s * 0.5, cy - s * 0.5, cx + s * 0.62, cy + s * 0.02, cx, cy + s * 0.45);
    ctx.closePath();
  }
  function coin(ctx, x, y, r) {
    circle(ctx, x, y, r); ctx.fillStyle = PAL.gold; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#7a5a00'; ctx.stroke();
    circle(ctx, x, y, r * 0.55); ctx.strokeStyle = '#c99a1c'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  function repStar(ctx, x, y, r, fill) {
    starPath(ctx, x, y, r, r * 0.46); ctx.fillStyle = fill || PAL.rep; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
  }
  function arrow(ctx, x1, y1, x2, y2, o) {
    o = o || {}; var col = o.color || PAL.text, lw = o.lw || 4;
    var cx = o.cx, cy = o.cy, ang;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath(); ctx.moveTo(x1, y1);
    if (cx !== undefined) { ctx.quadraticCurveTo(cx, cy, x2, y2); ang = Math.atan2(y2 - cy, x2 - cx); }
    else { ctx.lineTo(x2, y2); ang = Math.atan2(y2 - y1, x2 - x1); }
    ctx.strokeStyle = PAL.outline; ctx.lineWidth = lw + 4; ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
    ctx.setLineDash([]);
    var hs = o.head || lw * 3.2;
    ctx.beginPath();
    ctx.moveTo(x2 + Math.cos(ang) * hs * 0.4, y2 + Math.sin(ang) * hs * 0.4);
    ctx.lineTo(x2 + Math.cos(ang + 2.5) * hs, y2 + Math.sin(ang + 2.5) * hs);
    ctx.lineTo(x2 + Math.cos(ang - 2.5) * hs, y2 + Math.sin(ang - 2.5) * hs);
    ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
    ctx.restore();
  }
  function keycap(ctx, label, x, y, w, dim) {
    w = w || 34; var h = 32;
    rr(ctx, x - w / 2, y - h / 2 + 3, w, h, 6); ctx.fillStyle = '#0b0815'; ctx.fill();
    rr(ctx, x - w / 2, y - h / 2, w, h - 3, 6); ctx.fillStyle = dim ? '#5c5672' : '#ece8f8'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
    if (label === '↑' || label === '↓' || label === '←' || label === '→') {
      var a = { '→': 0, '↓': Math.PI / 2, '←': Math.PI, '↑': -Math.PI / 2 }[label];
      ctx.save(); ctx.translate(x, y - 1.5); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-4, -6); ctx.lineTo(-4, 6); ctx.closePath();
      ctx.fillStyle = '#231c38'; ctx.fill(); ctx.restore();
    } else {
      txt(ctx, label, x, y - 1.5, { size: 17, color: '#231c38', stroke: false });
    }
  }
  function arrowKeys(ctx, x, y) {
    keycap(ctx, '↑', x, y - 18, 30); keycap(ctx, '←', x - 33, y + 17, 30); keycap(ctx, '↓', x, y + 17, 30); keycap(ctx, '→', x + 33, y + 17, 30);
  }
  function check(ctx, x, y, s, col) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x - s * 0.12, y + s * 0.38); ctx.lineTo(x + s * 0.55, y - s * 0.42);
    ctx.strokeStyle = PAL.outline; ctx.lineWidth = s * 0.34; ctx.stroke();
    ctx.strokeStyle = col || PAL.ok; ctx.lineWidth = s * 0.2; ctx.stroke(); ctx.restore();
  }
  function cross(ctx, x, y, s, col) {
    ctx.save(); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - s / 2, y - s / 2); ctx.lineTo(x + s / 2, y + s / 2); ctx.moveTo(x + s / 2, y - s / 2); ctx.lineTo(x - s / 2, y + s / 2);
    ctx.strokeStyle = PAL.outline; ctx.lineWidth = s * 0.3; ctx.stroke();
    ctx.strokeStyle = col || PAL.danger; ctx.lineWidth = s * 0.18; ctx.stroke(); ctx.restore();
  }
  function hash(a, b) { var h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); }

  // ---------- 魔物本體(原點為中心, 面向右, 畫在 s×s 內) ----------
  function paintSpecies(ctx, sp, s, o) {
    o = o || {};
    var fl = !!o.flash, an = o.anim || 0;
    function C(c) { return fl ? '#ffffff' : c; }
    var OL = PAL.outline, lw = Math.max(1.5, s * 0.03);
    ctx.lineWidth = lw; ctx.strokeStyle = OL; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    var R = s * 0.42, i;
    function fs(c) { ctx.fillStyle = C(c); ctx.fill(); ctx.stroke(); }
    function eye(x, y, r, px) {
      circle(ctx, x, y, r); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
      circle(ctx, x + r * (px || 0.3), y, r * 0.5); ctx.fillStyle = '#140f20'; ctx.fill();
    }
    if (sp === 'spore') {
      rr(ctx, -R * 0.42, -R * 0.05, R * 0.84, R * 0.9, R * 0.25); fs('#f3e6c8');
      ctx.beginPath(); ctx.ellipse(0, R * 0.05, R, R * 0.92, 0, Math.PI, 0); ctx.closePath(); fs(PAL.spore);
      ctx.fillStyle = C('#fff4fb');
      [[-0.45, -0.35, 0.15], [0.15, -0.62, 0.12], [0.55, -0.24, 0.13], [-0.05, -0.2, 0.08]].forEach(function (d) { circle(ctx, d[0] * R, d[1] * R, d[2] * R); ctx.fill(); });
      circle(ctx, R * 0.02, R * 0.38, R * 0.08); ctx.fillStyle = OL; ctx.fill();
      circle(ctx, R * 0.3, R * 0.38, R * 0.08); ctx.fill();
    } else if (sp === 'frog') {
      ell(ctx, -R * 0.5, R * 0.8, R * 0.28, R * 0.12); fs('#2f9a3a');
      ell(ctx, R * 0.5, R * 0.8, R * 0.28, R * 0.12); fs('#2f9a3a');
      ell(ctx, 0, R * 0.2, R * 0.95, R * 0.66); fs(PAL.frog);
      ell(ctx, R * 0.2, R * 0.38, R * 0.52, R * 0.34); ctx.fillStyle = C('#c8f5a8'); ctx.fill();
      eye(R * 0.02, -R * 0.38, R * 0.26, 0.35); eye(R * 0.6, -R * 0.38, R * 0.26, 0.35);
      ctx.beginPath(); ctx.arc(R * 0.35, R * 0.1, R * 0.3, 0.3, 1.5); ctx.stroke();
    } else if (sp === 'mole') {
      R = s * 0.4;
      ell(ctx, 0, R * 0.1, R * 0.9, R * 0.8); fs(PAL.mole);
      ell(ctx, R * 0.15, R * 0.35, R * 0.5, R * 0.42); ctx.fillStyle = C('#f0c79a'); ctx.fill();
      ell(ctx, R * 0.82, R * 0.02, R * 0.2, R * 0.15); fs('#ff9ab0');
      circle(ctx, R * 0.45, -R * 0.28, R * 0.09); ctx.fillStyle = OL; ctx.fill();
      ctx.strokeStyle = C('#ffffff'); ctx.lineWidth = lw * 1.2;
      for (i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(R * (0.45 + i * 0.13), R * 0.72); ctx.lineTo(R * (0.5 + i * 0.13), R * 0.92); ctx.stroke(); }
      ctx.strokeStyle = OL; ctx.lineWidth = lw;
    } else if (sp === 'tumble') {
      circle(ctx, 0, 0, R); fs(PAL.tumble);
      ctx.save(); ctx.rotate(o.roll || 0);
      ctx.strokeStyle = C('#9a7a1c'); ctx.lineWidth = lw * 0.9;
      for (i = 0; i < 6; i++) {
        ctx.beginPath(); ctx.ellipse(Math.cos(i * 1.1) * R * 0.25, Math.sin(i * 1.7) * R * 0.25, R * 0.6, R * 0.32, i * 0.9, 0, Math.PI * 1.6); ctx.stroke();
      }
      ctx.restore(); ctx.strokeStyle = OL; ctx.lineWidth = lw;
      eye(R * 0.05, -R * 0.12, R * 0.17, 0.4); eye(R * 0.5, -R * 0.12, R * 0.17, 0.4);
    } else if (sp === 'butterfly') {
      R = s * 0.44;
      var f = 0.55 + 0.45 * Math.abs(Math.sin(an * 9));
      ctx.save(); ctx.scale(f, 1);
      [-1, 1].forEach(function (k) {
        ell(ctx, k * R * 0.5, -R * 0.28, R * 0.48, R * 0.4, k * 0.45); fs(PAL.butterfly);
        ell(ctx, k * R * 0.38, R * 0.36, R * 0.34, R * 0.28, -k * 0.4); fs('#9fe9f7');
        circle(ctx, k * R * 0.55, -R * 0.32, R * 0.12); ctx.fillStyle = C('#ffffff'); ctx.fill();
      });
      ctx.restore();
      ell(ctx, 0, R * 0.05, R * 0.12, R * 0.55); fs('#2a2440');
      ctx.beginPath(); ctx.moveTo(-R * 0.04, -R * 0.45); ctx.lineTo(-R * 0.25, -R * 0.82); ctx.moveTo(R * 0.04, -R * 0.45); ctx.lineTo(R * 0.25, -R * 0.82); ctx.stroke();
      circle(ctx, -R * 0.25, -R * 0.84, R * 0.06); ctx.fillStyle = OL; ctx.fill(); circle(ctx, R * 0.25, -R * 0.84, R * 0.06); ctx.fill();
    } else { // crab
      for (i = 0; i < 3; i++) {
        [-1, 1].forEach(function (k) { ctx.beginPath(); ctx.moveTo(k * R * (0.35 + i * 0.15), R * 0.35); ctx.lineTo(k * R * (0.6 + i * 0.15), R * 0.8); ctx.lineWidth = lw * 1.6; ctx.strokeStyle = OL; ctx.stroke(); });
      }
      ctx.lineWidth = lw;
      [[-0.4, 0.2], [0.05, 0.28], [0.42, 0.18]].forEach(function (d) {
        ctx.beginPath(); ctx.moveTo((d[0] - 0.14) * R, -0.1 * R); ctx.lineTo(d[0] * R, -(0.4 + d[1]) * R); ctx.lineTo((d[0] + 0.14) * R, -0.1 * R); ctx.closePath(); fs('#c4c5ff');
      });
      ell(ctx, 0, R * 0.15, R * 0.75, R * 0.5); fs(PAL.crab);
      [-1, 1].forEach(function (k) {
        circle(ctx, k * R * 0.8, -R * 0.15, R * 0.26); fs('#9a9cff');
        ctx.beginPath(); ctx.moveTo(k * R * 0.8, -R * 0.15); ctx.lineTo(k * R * 1.04, -R * 0.3); ctx.stroke();
      });
      ctx.beginPath(); ctx.moveTo(-R * 0.18, 0); ctx.lineTo(-R * 0.2, -R * 0.2); ctx.moveTo(R * 0.18, 0); ctx.lineTo(R * 0.2, -R * 0.2); ctx.stroke();
      eye(-R * 0.2, -R * 0.25, R * 0.11, 0); eye(R * 0.2, -R * 0.25, R * 0.11, 0);
    }
  }
  // 小頭像(清單、面板、節目表用)
  function head(ctx, sp, x, y, s) {
    ctx.save(); ctx.translate(x, y); paintSpecies(ctx, sp0(sp), s, { anim: 0.3 }); ctx.restore();
  }
  function stunStars(ctx, y, box) {
    var t = now() * 3;
    for (var i = 0; i < 3; i++) {
      var a = t + i * 2.094;
      var px = Math.cos(a) * box * 0.24, py = y + Math.sin(a) * box * 0.05;
      starPath(ctx, px, py, box * 0.07, box * 0.03); ctx.fillStyle = '#fff36a'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
    }
  }
  function brokenHeart(ctx, x, y, s) {
    heartPath(ctx, x, y, s); ctx.fillStyle = '#ff5a8a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - s * 0.22); ctx.lineTo(x - s * 0.1, y); ctx.lineTo(x + s * 0.08, y + s * 0.12); ctx.lineTo(x, y + s * 0.42);
    ctx.lineWidth = 2.5; ctx.stroke();
  }
  function mound(ctx, box, p) {
    var wob = Math.sin(p * Math.PI * 6) * box * 0.02;
    ell(ctx, 0, box * 0.32, box * 0.4, box * 0.1); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, box * 0.3, box * 0.36 + wob, box * 0.26, 0, Math.PI, 0); ctx.closePath();
    ctx.fillStyle = '#7a5530'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, box * 0.3, box * 0.36 + wob, box * 0.26, 0, Math.PI * 1.15, Math.PI * 1.85);
    ctx.strokeStyle = PAL.mole; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#4e3418';
    for (var i = 0; i < 5; i++) { circle(ctx, (hash(i, 3) - 0.5) * box * 0.5, box * (0.16 + hash(i, 7) * 0.12), box * 0.025); ctx.fill(); }
  }

  // ---------- 背景 ----------
  function drawBackground(ctx) {
    ctx.save();
    ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, W, H);
    var g = ctx.createRadialGradient(640, 380, 80, 640, 380, 760);
    g.addColorStop(0, 'rgba(70,50,120,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // ---------- 地下城格 ----------
  function drawTile(ctx, s) {
    s = st(s); var x = N(s.x), y = N(s.y);
    var d = S(s.dungeon, DUNGEONS, 'forest'), th = TH[d];
    var kind = S(s.kind, ['wall', 'pillar', 'floor', 'hurt', 'slow'], 'floor');
    var room = S(s.room, ['left', 'right', 'hall'], 'hall');
    var x0 = x - 30, y0 = y - 30, i;
    ctx.save();
    if (kind === 'wall') {
      ctx.fillStyle = th.wall; ctx.fillRect(x0, y0, 60, 60);
      ctx.fillStyle = th.wallTop; ctx.fillRect(x0 + 2, y0 + 2, 56, 18);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, y0 + 30); ctx.lineTo(x0 + 60, y0 + 30); ctx.moveTo(x0 + 30, y0 + 30); ctx.lineTo(x0 + 30, y0 + 60); ctx.stroke();
      ctx.restore(); return;
    }
    ctx.fillStyle = room === 'hall' ? th.hall : th.floor; ctx.fillRect(x0, y0, 60, 60);
    ctx.fillStyle = th.speck;
    for (i = 0; i < 4; i++) { circle(ctx, x0 + 6 + hash(x + i, y) * 48, y0 + 6 + hash(y + i, x) * 48, 2 + hash(i, x + y) * 2); ctx.fill(); }
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, 59, 59);
    if (kind === 'slow') {
      if (d === 'forest') {
        rr(ctx, x0 + 1, y0 + 1, 58, 58, 14); ctx.fillStyle = th.slow; ctx.fill();
        ctx.strokeStyle = th.slowHi; ctx.lineWidth = 2;
        for (i = 0; i < 3; i++) { circle(ctx, x0 + 14 + i * 16, y0 + 18 + (i % 2) * 22, 4); ctx.stroke(); }
      } else if (d === 'dune') {
        ctx.fillStyle = th.slow; ctx.fillRect(x0 + 1, y0 + 1, 58, 58);
        ctx.strokeStyle = '#b0925a'; ctx.lineWidth = 2;
        for (i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x0 + 4, y0 + 10 + i * 14); ctx.quadraticCurveTo(x0 + 18, y0 + 4 + i * 14, x0 + 30, y0 + 10 + i * 14); ctx.quadraticCurveTo(x0 + 44, y0 + 16 + i * 14, x0 + 56, y0 + 10 + i * 14); ctx.stroke(); }
      } else {
        ctx.fillStyle = th.slow; ctx.fillRect(x0 + 1, y0 + 1, 58, 58);
        ctx.strokeStyle = th.slowHi; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x0 + 8, y0 + 34); ctx.lineTo(x0 + 30, y0 + 10); ctx.moveTo(x0 + 26, y0 + 52); ctx.lineTo(x0 + 52, y0 + 24); ctx.stroke();
      }
    } else if (kind === 'hurt') {
      ctx.fillStyle = 'rgba(255,59,78,0.22)'; ctx.fillRect(x0, y0, 60, 60);
      ctx.strokeStyle = PAL.danger; ctx.lineWidth = 3; ctx.setLineDash([7, 5]); ctx.strokeRect(x0 + 1.5, y0 + 1.5, 57, 57); ctx.setLineDash([]);
      ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline;
      if (d === 'mine') {
        [[-14, 18], [2, 24], [16, 16]].forEach(function (p) {
          ctx.beginPath(); ctx.moveTo(x + p[0] - 9, y + 20); ctx.lineTo(x + p[0], y + 20 - p[1] - 10); ctx.lineTo(x + p[0] + 9, y + 20); ctx.closePath();
          ctx.fillStyle = '#d8f3ff'; ctx.fill(); ctx.stroke();
        });
      } else if (d === 'dune') {
        rr(ctx, x - 7, y - 20, 14, 42, 7); ctx.fillStyle = '#3f8a3a'; ctx.fill(); ctx.stroke();
        rr(ctx, x - 20, y - 8, 10, 20, 5); ctx.fill(); ctx.stroke();
        rr(ctx, x + 10, y - 14, 10, 18, 5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        [[-3, -12], [3, -2], [-3, 8], [-15, 0], [15, -6]].forEach(function (p) { circle(ctx, x + p[0], y + p[1], 1.6); ctx.fill(); });
      } else {
        ctx.fillStyle = '#5a3a5a';
        for (i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - 20 + i * 14, y + 16); ctx.lineTo(x - 13 + i * 14, y - 14); ctx.lineTo(x - 6 + i * 14, y + 16); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      }
    } else if (kind === 'pillar') {
      ell(ctx, x + 3, y + 20, 24, 8); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      rr(ctx, x - 22, y - 26, 44, 48, 12); ctx.fillStyle = th.pillar; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
      rr(ctx, x - 22, y - 26, 44, 14, 7); ctx.fillStyle = th.pillarHi; ctx.fill(); ctx.stroke();
    }
    if (s.nest === true && kind !== 'wall') {
      circle(ctx, x, y, 17); ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill();
      ctx.fillStyle = th.accent;
      for (i = 0; i < 9; i++) { var a = i * 0.698; ell(ctx, x + Math.cos(a) * 22, y + Math.sin(a) * 22, 5, 2.4, a + 1.57); ctx.fill(); }
    }
    ctx.restore();
  }

  // ---------- 馴獸師 ----------
  function weaponShape(ctx, w, len) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    function line(x1, y1, x2, y2, lw, col) {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.strokeStyle = PAL.outline; ctx.lineWidth = lw + 3; ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
    }
    if (w === 'sword') {
      line(0, 0, len * 0.25, 0, 4, '#6b4a2a');
      line(len * 0.25, -len * 0.14, len * 0.25, len * 0.14, 3.5, PAL.gold);
      line(len * 0.28, 0, len, 0, 5, '#dfe8f2');
    } else if (w === 'spear') {
      line(-len * 0.1, 0, len * 0.82, 0, 3.5, '#a07a4a');
      ctx.beginPath(); ctx.moveTo(len, 0); ctx.lineTo(len * 0.76, -len * 0.09); ctx.lineTo(len * 0.76, len * 0.09); ctx.closePath();
      ctx.fillStyle = '#dfe8f2'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
    } else if (w === 'whip') {
      line(0, 0, len * 0.25, 0, 5, '#6b4a2a');
      ctx.beginPath(); ctx.moveTo(len * 0.25, 0); ctx.bezierCurveTo(len * 0.5, -len * 0.3, len * 0.7, len * 0.3, len, 0);
      ctx.strokeStyle = PAL.outline; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#c0703a'; ctx.lineWidth = 2.5; ctx.stroke();
    } else {
      line(0, 0, len * 0.6, 0, 5, '#8a5a2a');
      ell(ctx, len * 0.78, 0, len * 0.24, len * 0.15); ctx.fillStyle = '#a8703a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
    }
  }
  function drawTamer(ctx, s) {
    s = st(s); var x = N(s.x), y = N(s.y);
    var f = Math.round(N(s.facing, 0)) & 7;
    var w = S(s.weapon, WEAPONS, 'club');
    var ang = (f - 2) * Math.PI / 4;
    var right = !(f >= 5 && f <= 7);
    ctx.save(); ctx.translate(x, y);
    if (s.blink === true && Math.floor(now() * 12) % 2 === 0) ctx.globalAlpha = 0.35;
    // 影
    ell(ctx, 0, 24, 18, 6); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    if (s.dashing === true) {
      ctx.save(); ctx.rotate(ang);
      for (var k = 1; k <= 3; k++) { ell(ctx, -k * 7, 0, 16 - k * 2, 20 - k * 3); ctx.fillStyle = 'rgba(160,220,255,' + (0.45 - k * 0.12) + ')'; ctx.fill(); }
      ctx.restore();
      circle(ctx, 0, 0, 30); ctx.strokeStyle = 'rgba(160,220,255,0.9)'; ctx.lineWidth = 3; ctx.stroke();
    }
    var back = f === 0 || f === 1 || f === 7; // 朝上時武器畫在身後
    function weapon() { ctx.save(); ctx.translate(0, 2); ctx.rotate(ang); weaponShape(ctx, w, 28); ctx.restore(); }
    if (back) weapon();
    ctx.save(); if (!right) ctx.scale(-1, 1);
    ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.outline;
    rr(ctx, -9, 14, 7, 10, 3); ctx.fillStyle = '#3a3150'; ctx.fill(); ctx.stroke();
    rr(ctx, 2, 14, 7, 10, 3); ctx.fill(); ctx.stroke();
    rr(ctx, -12, -4, 24, 22, 7); ctx.fillStyle = PAL.tamerCoat; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c0392b'; ctx.fillRect(-12, -2, 24, 4);
    // 繩圈(套索中變亮)
    circle(ctx, -9, 9, 5.5); ctx.strokeStyle = PAL.outline; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = s.lassoing === true ? '#ffe08a' : PAL.rope; ctx.lineWidth = 2.5; ctx.stroke();
    circle(ctx, 0, -14, 11); ctx.fillStyle = '#f5c9a0'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
    if (f !== 0) { circle(ctx, 5, -14, 2); ctx.fillStyle = PAL.outline; ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(0, -21, 15, 4.5, 0, 0, Math.PI * 2); ctx.fillStyle = PAL.tamerHat; ctx.fill(); ctx.stroke();
    rr(ctx, -9, -31, 18, 11, 4); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (!back) weapon();
    ctx.restore();
  }

  // ---------- 野生魔物 ----------
  function drawWildMonster(ctx, s) {
    s = st(s); var sp = sp0(s.species), box = sp === 'crab' ? 110 : 80;
    var x = N(s.x), y = N(s.y), dir = N(s.dir, 1) < 0 ? -1 : 1;
    var move = S(s.move, ['walk', 'jump', 'burrow', 'roll'], 'walk');
    var p = ratio(s.moveT, s.moveDur);
    var hp = N(s.hp), mhp = Math.max(1, N(s.maxHp, 1));
    ctx.save(); ctx.translate(x, y);
    if (move === 'burrow') {
      mound(ctx, box, p);
      hpBar(ctx, box, hp, mhp, 0.4);
      ctx.restore(); return;
    }
    var lift = 0, sc = 0.92;
    if (move === 'jump') { lift = Math.sin(Math.PI * p) * box * 0.12; sc = 0.8; }
    ell(ctx, 0, box * 0.36, box * 0.3 * (1 - lift / box), box * 0.07); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    if (s.casting === true) {
      var pul = 0.5 + 0.5 * Math.sin(now() * 14);
      circle(ctx, 0, 0, box * 0.46); ctx.strokeStyle = 'rgba(255,59,78,' + (0.5 + 0.4 * pul) + ')'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.save(); ctx.translate(0, -lift); ctx.scale(dir * sc, sc);
    paintSpecies(ctx, sp, box, { flash: s.hit === true, anim: now(), roll: move === 'roll' ? now() * 6 : 0 });
    ctx.restore();
    if (s.lassoed === true) {
      ell(ctx, 0, box * 0.12, box * 0.4, box * 0.12); ctx.strokeStyle = PAL.outline; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = PAL.rope; ctx.lineWidth = 3; ctx.stroke();
    }
    if (N(s.stunLeft) > 0 || s.lassoed === true) stunStars(ctx, -box * 0.4, box);
    if (s.weak === true) brokenHeart(ctx, box * 0.34, -box * 0.32, box * 0.2);
    hpBar(ctx, box, hp, mhp, 1);
    ctx.restore();
  }
  function hpBar(ctx, box, hp, mhp, a) {
    var w = box * 0.7, h = 5, y0 = box / 2 - 8, r = clamp(hp / mhp, 0, 1);
    ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = 'rgba(10,6,20,0.85)'; ctx.fillRect(-w / 2 - 1, y0 - 1, w + 2, h + 2);
    ctx.fillStyle = r <= 0.3 ? '#ff5a8a' : '#7ee07a'; ctx.fillRect(-w / 2, y0, w * r, h);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-w / 2 + w * 0.3 - 0.75, y0 - 1, 1.5, h + 2);
    ctx.restore();
  }

  // ---------- 準備捕捉 ----------
  function drawCaptureRing(ctx, s) {
    s = st(s); var x = N(s.x), y = N(s.y), p = ratio(s.t, s.dur);
    ctx.save(); ctx.translate(x, y);
    circle(ctx, 0, 0, 38); ctx.strokeStyle = 'rgba(10,6,20,0.8)'; ctx.lineWidth = 9; ctx.stroke();
    circle(ctx, 0, 0, 38); ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 5; ctx.stroke();
    if (p > 0) { ctx.beginPath(); ctx.arc(0, 0, 38, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.strokeStyle = PAL.gold; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke(); }
    txt(ctx, '準備捕捉', 0, -46, { size: 14, color: PAL.gold });
    ctx.restore();
  }

  // ---------- 套索 ----------
  function drawLasso(ctx, s) {
    s = st(s);
    var x1 = N(s.x1), y1 = N(s.y1), x2 = N(s.x2), y2 = N(s.y2);
    var prog = clamp(N(s.progress), 0, 1);
    var tr = ratio(s.t, s.limit), left = Math.max(0, N(s.limit) - N(s.t));
    var k = N(s.maxLen) > 0 ? clamp(N(s.len) / N(s.maxLen), 0, 1.2) : 0;
    ctx.save();
    var dx = x2 - x1, dy = y2 - y1, d = Math.sqrt(dx * dx + dy * dy) || 1;
    var sag = Math.max(0, 0.8 - k) * 40;
    var mx = (x1 + x2) / 2 - dy / d * sag * 0.3, my = (y1 + y2) / 2 + sag;
    var taut = k > 0.85;
    var col = taut ? (Math.floor(now() * 8) % 2 ? '#ff6a4a' : '#ffd0a0') : PAL.rope;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.strokeStyle = PAL.outline; ctx.lineWidth = taut ? 7 : 6; ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = taut ? 4 : 3; ctx.stroke();
    // 繞圈進度環
    circle(ctx, x2, y2, 52); ctx.strokeStyle = 'rgba(10,6,20,0.75)'; ctx.lineWidth = 10; ctx.stroke();
    if (prog > 0) { ctx.beginPath(); ctx.arc(x2, y2, 52, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2); ctx.strokeStyle = PAL.gold; ctx.lineWidth = 7; ctx.stroke(); }
    // 時限細環(剩餘)
    var lc = left <= 1.5 ? PAL.danger : '#ffffff';
    ctx.beginPath(); ctx.arc(x2, y2, 44, -Math.PI / 2, -Math.PI / 2 + (1 - tr) * Math.PI * 2); ctx.strokeStyle = lc; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }

  // ---------- 技能 ----------
  var HZ = {
    spore: { col: PAL.spore, edge: PAL.ignite },
    bubble: { col: '#7fd0ff', edge: PAL.douse },
    spikes: { col: PAL.mole, edge: PAL.ignite },
    whirl: { col: PAL.tumble, edge: PAL.ignite },
    frost: { col: PAL.butterfly, edge: PAL.douse },
    claw: { col: PAL.crab, edge: PAL.ignite }
  };
  function hexA(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function drawHazard(ctx, s) {
    s = st(s);
    var kind = S(s.kind, Object.keys(HZ), 'spore'), hz = HZ[kind];
    var phase = S(s.phase, ['warn', 'active', 'fly'], kind === 'bubble' || kind === 'whirl' ? 'fly' : 'warn');
    var x = N(s.x), y = N(s.y), ang = N(s.angle), p = ratio(s.t, s.dur);
    var col = hz.col, edge = hz.edge;
    if (s.reflected === true) { col = '#ffffff'; edge = PAL.gold; }
    ctx.save(); ctx.translate(x, y);
    var warn = phase === 'warn';
    function finish(pathFn, growFn) {
      pathFn(); ctx.fillStyle = hexA(col, warn ? 0.12 : 0.5); ctx.fill();
      if (warn && growFn) { growFn(); ctx.fillStyle = hexA(col, 0.38); ctx.fill(); }
      pathFn(); ctx.lineWidth = 3; ctx.strokeStyle = edge; if (warn) ctx.setLineDash([10, 7]); ctx.stroke(); ctx.setLineDash([]);
    }
    if (kind === 'spore' || kind === 'frost') {
      var r = Math.max(0, N(s.radius, kind === 'spore' ? 110 : 140));
      finish(function () { circle(ctx, 0, 0, r - 1.5); }, function () { circle(ctx, 0, 0, r * p); });
      if (!warn) {
        ctx.fillStyle = kind === 'spore' ? 'rgba(255,220,250,0.7)' : 'rgba(235,252,255,0.85)';
        for (var i = 0; i < 9; i++) {
          var a = i * 0.7 + now(), rd = r * (0.25 + 0.6 * hash(i, 5));
          if (kind === 'spore') { circle(ctx, Math.cos(a) * rd, Math.sin(a) * rd, 4 + hash(i, 2) * 4); ctx.fill(); }
          else { starPath(ctx, Math.cos(a) * rd, Math.sin(a) * rd, 7, 2.5, 6); ctx.fill(); }
        }
      }
    } else if (kind === 'spikes') {
      var L = Math.max(0, N(s.length, 320)), Wd = Math.max(0, N(s.width, 50));
      ctx.rotate(ang);
      finish(function () { ctx.beginPath(); ctx.rect(0, -Wd / 2 + 1.5, L - 1.5, Wd - 3); }, function () { ctx.beginPath(); ctx.rect(0, -Wd / 2, L * p, Wd); });
      if (!warn) {
        ctx.fillStyle = '#f0d6b0'; ctx.strokeStyle = PAL.outline; ctx.lineWidth = 2;
        for (var j = 12; j < L - 10; j += 26) { ctx.beginPath(); ctx.moveTo(j - 9, Wd * 0.3); ctx.lineTo(j, -Wd * 0.38); ctx.lineTo(j + 9, Wd * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      }
    } else if (kind === 'claw') {
      var R = Math.max(0, N(s.radius, 160)), sp = N(s.spread, 2.094);
      finish(function () { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R - 1.5, ang - sp / 2, ang + sp / 2); ctx.closePath(); },
        function () { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R * p, ang - sp / 2, ang + sp / 2); ctx.closePath(); });
      if (!warn) {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        for (var c = -1; c <= 1; c++) { ctx.beginPath(); ctx.arc(0, 0, R * (0.55 + c * 0.15), ang - sp * 0.3, ang + sp * 0.3); ctx.stroke(); }
      }
    } else if (kind === 'bubble') {
      var br = Math.max(0, N(s.radius, 16));
      circle(ctx, 0, 0, br - 1); ctx.fillStyle = hexA(col, 0.75); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = edge; ctx.stroke();
      circle(ctx, -br * 0.3, -br * 0.3, br * 0.25); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
      chevron(ctx, ang, br * 0.5, s.reflected === true ? PAL.outline : '#ffffff');
    } else { // whirl
      var wr = Math.max(0, N(s.radius, 30)), rot = now() * 10;
      circle(ctx, 0, 0, wr - 1.5); ctx.fillStyle = hexA(col, 0.35); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = edge; ctx.stroke();
      ctx.strokeStyle = s.reflected === true ? PAL.gold : '#fff6c0'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (var q = 0; q < 3; q++) { ctx.beginPath(); ctx.arc(0, 0, wr * (0.3 + q * 0.2), rot + q * 2, rot + q * 2 + 3.2); ctx.stroke(); }
      chevron(ctx, ang, wr * 0.5, '#ffffff');
    }
    ctx.restore();
  }
  function chevron(ctx, ang, r, col) {
    ctx.save(); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(-r * 0.4, -r * 0.6); ctx.lineTo(r * 0.5, 0); ctx.lineTo(-r * 0.4, r * 0.6);
    ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
  }

  // ---------- 武器特效 ----------
  function drawWeaponFx(ctx, s) {
    s = st(s);
    var x = N(s.x), y = N(s.y), ang = N(s.angle), p = ratio(s.t, s.dur);
    var shape = S(s.shape, ['arc', 'circle', 'line', 'dash'], 'arc');
    var col = s.move === 'skill' ? PAL.skill : PAL.player;
    var a = 1 - p * 0.8;
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= a;
    if (shape === 'arc') {
      var R = Math.max(0, N(s.radius)), sp = N(s.spread, 1.745);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, ang - sp / 2, ang + sp / 2); ctx.closePath();
      ctx.fillStyle = hexA(col, 0.22); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, R - 2.5, ang - sp / 2, ang + sp / 2); ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.stroke();
      var sw = ang - sp / 2 + sp * Math.min(1, p * 2);
      ctx.beginPath(); ctx.moveTo(Math.cos(sw) * R * 0.3, Math.sin(sw) * R * 0.3); ctx.lineTo(Math.cos(sw) * (R - 2), Math.sin(sw) * (R - 2)); ctx.lineWidth = 3; ctx.stroke();
    } else if (shape === 'circle') {
      var cr = Math.max(0, N(s.radius));
      circle(ctx, 0, 0, cr); ctx.fillStyle = hexA(col, 0.16); ctx.fill();
      circle(ctx, 0, 0, cr - 2.5); ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.stroke();
    } else if (shape === 'line') {
      var L = Math.max(0, N(s.length)), Wd = Math.max(0, N(s.width));
      ctx.rotate(ang);
      ctx.beginPath(); ctx.rect(0, -Wd / 2, L, Wd); ctx.fillStyle = hexA(col, 0.22); ctx.fill();
      ctx.beginPath(); ctx.rect(1.5, -Wd / 2 + 1.5, L - 3, Wd - 3); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(L - 3, -Wd / 2 + 3); ctx.lineTo(L - 3, Wd / 2 - 3); ctx.lineWidth = 6; ctx.stroke();
    } else {
      var DL = Math.max(0, N(s.length)), dw = 36;
      ctx.rotate(ang);
      var g = ctx.createLinearGradient(0, 0, DL, 0);
      g.addColorStop(0, hexA(col, 0)); g.addColorStop(1, hexA(col, 0.45));
      ctx.fillStyle = g; ctx.fillRect(0, -dw / 2, DL, dw);
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (var i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(DL * 0.2, i * 11); ctx.lineTo(DL * 0.9, i * 11); ctx.stroke(); }
    }
    ctx.restore();
  }

  // ---------- 地下城選擇卡 ----------
  function lockIcon(ctx, x, y, s) {
    ctx.lineWidth = 3; ctx.strokeStyle = PAL.outline;
    ctx.beginPath(); ctx.arc(x, y - s * 0.2, s * 0.32, Math.PI, 0); ctx.strokeStyle = '#c8c2dc'; ctx.lineWidth = s * 0.12; ctx.stroke();
    rr(ctx, x - s * 0.45, y - s * 0.2, s * 0.9, s * 0.7, s * 0.1); ctx.fillStyle = '#c8c2dc'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
    circle(ctx, x, y + s * 0.12, s * 0.09); ctx.fillStyle = PAL.outline; ctx.fill();
  }
  function drawDungeonCard(ctx, s) {
    s = st(s); var x = N(s.x), y = N(s.y), d = S(s.dungeon, DUNGEONS, 'forest'), th = TH[d], info = DUN[d];
    var open = s.open === true, sel = s.selected === true;
    ctx.save(); ctx.translate(x, y);
    rr(ctx, -176, -216, 352, 432, 18); ctx.fillStyle = open ? PAL.panelHi : '#1e1a2e'; ctx.fill();
    // 圖區
    ctx.save(); rr(ctx, -156, -150, 312, 200, 12); ctx.clip();
    ctx.fillStyle = th.floor; ctx.fillRect(-156, -150, 312, 200);
    ctx.fillStyle = th.speck;
    for (var i = 0; i < 18; i++) { circle(ctx, -150 + hash(i, 1) * 300, -145 + hash(i, 2) * 190, 3); ctx.fill(); }
    ctx.fillStyle = th.wall; ctx.fillRect(-156, -150, 312, 28); ctx.fillStyle = th.wallTop; ctx.fillRect(-156, -150, 312, 12);
    ctx.restore();
    head(ctx, info.sp[0], -72, -40, 108);
    head(ctx, info.sp[1], 72, -40, 108);
    if (!open) { rr(ctx, -156, -150, 312, 200, 12); ctx.fillStyle = 'rgba(14,10,26,0.62)'; ctx.fill(); lockIcon(ctx, 0, -50, 54); }
    txt(ctx, info.name, 0, -183, { size: 30, color: open ? th.accent : '#c8c2dc' });
    txt(ctx, SPN[info.sp[0]], -72, 76, { size: 19, color: PAL.text });
    txt(ctx, SPN[info.sp[1]], 72, 76, { size: 19, color: PAL.text });
    if (open) {
      rr(ctx, -80, 118, 160, 48, 24); ctx.fillStyle = 'rgba(94,224,138,0.18)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.ok; ctx.stroke();
      txt(ctx, '已開放', 0, 142, { size: 22, color: PAL.ok });
    } else {
      var cond = T(s.condition), parts = cond.split('+');
      if (parts.length > 1) {
        txt(ctx, parts[0].trim(), 0, 126, { size: 19, color: '#e8e2f8', max: 320 });
        txt(ctx, '+ ' + parts.slice(1).join('+').trim(), 0, 158, { size: 19, color: '#e8e2f8', max: 320 });
      } else txt(ctx, cond, 0, 140, { size: 19, color: '#e8e2f8', max: 320 });
    }
    rr(ctx, -176, -216, 352, 432, 18);
    if (sel) { ctx.lineWidth = 7; ctx.strokeStyle = PAL.select; ctx.stroke(); }
    else { ctx.lineWidth = 2; ctx.strokeStyle = PAL.line; ctx.stroke(); }
    if (sel) { ctx.beginPath(); ctx.moveTo(-14, 196); ctx.lineTo(14, 196); ctx.lineTo(0, 182); ctx.closePath(); ctx.fillStyle = PAL.select; ctx.fill(); }
    ctx.restore();
  }

  // ---------- 布置第 1 步 魔物卡 ----------
  function drawRosterCard(ctx, s) {
    s = st(s); var x = N(s.x), y = N(s.y), sp = sp0(s.species), lv = clamp(Math.round(N(s.level)), 0, 3);
    var picked = s.picked === true, sel = s.selected === true;
    ctx.save(); ctx.translate(x, y);
    rr(ctx, -86, -116, 172, 232, 14); ctx.fillStyle = picked ? '#2f4a3c' : PAL.panel; ctx.fill();
    head(ctx, sp, 0, -34, 112);
    if (!picked) { rr(ctx, -86, -116, 172, 232, 14); ctx.fillStyle = 'rgba(14,10,26,0.35)'; ctx.fill(); }
    txt(ctx, SPN[sp], 0, 46, { size: 22 });
    txt(ctx, 'Lv ' + lv, 0, 76, { size: 18, color: PAL.gold });
    if (picked) {
      rr(ctx, -40, 92, 80, 18, 9); ctx.fillStyle = PAL.ok; ctx.fill();
      txt(ctx, '上場', 0, 101, { size: 14, color: '#10301c', stroke: false });
    }
    rr(ctx, -86, -116, 172, 232, 14);
    ctx.lineWidth = sel ? 6 : (picked ? 3 : 2); ctx.strokeStyle = sel ? PAL.select : (picked ? PAL.ok : PAL.line); ctx.stroke();
    ctx.restore();
  }

  // ---------- 節目卡圖示 ----------
  function cardIcon(ctx, card, x, y, r) {
    var c = CARDS[card]; if (!c) return;
    ctx.save(); ctx.translate(x, y);
    if (c.named) { circle(ctx, 0, 0, r); } else rr(ctx, -r, -r, r * 2, r * 2, r * 0.3);
    if (c.tone === 'mixed') {
      ctx.save(); ctx.clip();
      ctx.fillStyle = TONE.ignite; ctx.fillRect(-r, -r, r, r * 2); ctx.fillStyle = TONE.douse; ctx.fillRect(0, -r, r, r * 2);
      ctx.restore();
    } else { ctx.fillStyle = TONE[c.tone]; ctx.fill(); }
    if (c.named) circle(ctx, 0, 0, r); else rr(ctx, -r, -r, r * 2, r * 2, r * 0.3);
    ctx.lineWidth = Math.max(1.5, r * 0.12); ctx.strokeStyle = PAL.outline; ctx.stroke();
    var u = r * 0.62;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#ffffff'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.5, r * 0.14);
    if (card === 'provoke') {
      ctx.beginPath(); ctx.moveTo(0, u); ctx.bezierCurveTo(-u * 0.9, u * 0.8, -u * 0.8, -u * 0.1, -u * 0.1, -u);
      ctx.bezierCurveTo(-u * 0.05, -u * 0.4, u * 0.5, -u * 0.3, u * 0.3, -u * 0.75); ctx.bezierCurveTo(u * 0.9, -u * 0.2, u * 0.9, u * 0.8, 0, u); ctx.fill();
    } else if (card === 'chill') {
      for (var i = 0; i < 3; i++) { var a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * u, Math.sin(a) * u); ctx.lineTo(-Math.cos(a) * u, -Math.sin(a) * u); ctx.stroke(); }
    } else if (card === 'rally') {
      ctx.beginPath(); ctx.moveTo(-u * 0.5, u); ctx.lineTo(-u * 0.5, -u); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-u * 0.5, -u); ctx.lineTo(u * 0.8, -u * 0.55); ctx.lineTo(-u * 0.5, -u * 0.1); ctx.closePath(); ctx.fill();
    } else if (card === 'encore') {
      [[0, -0.5], [-0.55, 0.45], [0.55, 0.45]].forEach(function (d) { starPath(ctx, d[0] * u, d[1] * u, u * 0.45, u * 0.2); ctx.fill(); });
    } else if (card === 'rampage') {
      ctx.beginPath(); ctx.moveTo(u, 0); ctx.lineTo(0, -u * 0.7); ctx.lineTo(0, u * 0.7); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-u, -u * 0.4); ctx.lineTo(-u * 0.2, -u * 0.4); ctx.moveTo(-u, u * 0.4); ctx.lineTo(-u * 0.2, u * 0.4); ctx.stroke();
    } else if (card === 'confetti') {
      ctx.save(); ctx.rotate(-0.6); rr(ctx, -u * 0.9, -u * 0.32, u * 1.3, u * 0.64, u * 0.15); ctx.fill(); ctx.restore();
      [[0.6, -0.8], [0.9, -0.3], [0.3, -1]].forEach(function (d) { ctx.fillRect(d[0] * u - 2, d[1] * u - 2, 4, 4); });
    } else if (card === 'sprinkler') {
      ctx.beginPath(); ctx.moveTo(0, -u); ctx.bezierCurveTo(u * 0.8, 0, u * 0.6, u, 0, u); ctx.bezierCurveTo(-u * 0.6, u, -u * 0.8, 0, 0, -u); ctx.fill();
    } else if (card === 'spin') {
      ctx.beginPath(); ctx.arc(0, 0, u * 0.75, 0.4, Math.PI * 1.8); ctx.stroke();
      var ax = Math.cos(0.4) * u * 0.75, ay = Math.sin(0.4) * u * 0.75;
      ctx.beginPath(); ctx.moveTo(ax + u * 0.35, ay - u * 0.05); ctx.lineTo(ax - u * 0.05, ay + u * 0.4); ctx.lineTo(ax - u * 0.3, ay - u * 0.15); ctx.closePath(); ctx.fill();
    } else if (card === 'balloon') {
      ell(ctx, 0, -u * 0.25, u * 0.55, u * 0.7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, u * 0.45); ctx.quadraticCurveTo(u * 0.3, u * 0.7, 0, u); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 節目表時段 ----------
  function drawTimelineSlot(ctx, s) {
    s = st(s); var x = N(s.x), y = N(s.y), style = S(s.style, ['row', 'mini'], 'row');
    var slot = clamp(Math.round(N(s.slot)), 0, 8), card = CARDS[s.card] ? s.card : '';
    var tgt = SPECIES.indexOf(s.target) >= 0 ? s.target : '';
    var sel = s.selected === true;
    ctx.save(); ctx.translate(x, y);
    if (style === 'row') {
      rr(ctx, -318, -25, 636, 50, 10); ctx.fillStyle = sel ? PAL.panelHi : (card ? PAL.panel : 'rgba(38,32,64,0.6)'); ctx.fill();
      txt(ctx, (5 * slot) + '~' + (5 * slot + 5) + ' 秒', -296, 0, { size: 18, align: 'left', color: PAL.textDim });
      ctx.fillStyle = PAL.line; ctx.fillRect(-176, -16, 2, 32);
      if (card) {
        cardIcon(ctx, card, -144, 0, 17);
        txt(ctx, CARDS[card].name, -116, 0, { size: 20, align: 'left', max: 150 });
        if (CARDS[card].named) {
          if (tgt) { head(ctx, tgt, 92, 0, 42); txt(ctx, SPN[tgt], 120, 0, { size: 19, align: 'left' }); }
          else txt(ctx, '—', 120, 0, { size: 19, align: 'left', color: PAL.textDim });
        } else txt(ctx, '全場', 92, 0, { size: 19, align: 'left', color: '#d8d0f0' });
      } else txt(ctx, '—', -116, 0, { size: 20, align: 'left', color: PAL.textDim });
      rr(ctx, -318, -25, 636, 50, 10);
      ctx.lineWidth = sel ? 5 : 1.5; ctx.strokeStyle = sel ? PAL.select : PAL.line; ctx.stroke();
      if (sel) { ctx.beginPath(); ctx.moveTo(-314, -9); ctx.lineTo(-302, 0); ctx.lineTo(-314, 9); ctx.closePath(); ctx.fillStyle = PAL.select; ctx.fill(); }
    } else {
      var active = s.active === true, done = s.done === true;
      rr(ctx, -62, -20, 124, 40, 8); ctx.fillStyle = active ? PAL.panelHi : PAL.panel; ctx.fill();
      if (card) {
        if (CARDS[card].named) { cardIcon(ctx, card, -26, 0, 14); if (tgt) head(ctx, tgt, 26, 0, 34); }
        else cardIcon(ctx, card, 0, 0, 14);
      }
      if (done) { rr(ctx, -62, -20, 124, 40, 8); ctx.fillStyle = 'rgba(8,5,16,0.65)'; ctx.fill(); }
      rr(ctx, -62, -20, 124, 40, 8);
      ctx.lineWidth = active ? 4 : 1.5; ctx.strokeStyle = active ? PAL.select : PAL.line; ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 選擇面板(固定版位) ----------
  function drawPickerPanel(ctx, s) {
    s = st(s); var layer = S(s.layer, ['card', 'target'], 'card');
    var opts = Array.isArray(s.options) ? s.options : [];
    var idx = Math.round(N(s.index));
    var X = N(s.x, 760), Y = N(s.y, 60), Wd = 460;
    ctx.save();
    rr(ctx, X, Y, Wd, 50 + 52 * opts.length, 12); ctx.fillStyle = 'rgba(20,15,36,0.97)'; ctx.fill();
    rr(ctx, X, Y, Wd, 50, 12); ctx.fillStyle = PAL.panelHi; ctx.fill();
    txt(ctx, layer === 'card' ? '放哪張卡?' : '點名誰?', X + 20, Y + 25, { size: 22, align: 'left' });
    for (var i = 0; i < opts.length; i++) {
      var o = st(opts[i]), ry = Y + 50 + 52 * i, sel = i === idx;
      rr(ctx, X + 4, ry + 3, Wd - 8, 46, 8); ctx.fillStyle = sel ? '#3d3366' : 'rgba(38,32,64,0.7)'; ctx.fill();
      if (sel) { ctx.lineWidth = 4; ctx.strokeStyle = PAL.select; ctx.stroke(); }
      var type = S(o.type, ['card', 'monster', 'clear'], 'card');
      if (type === 'card' && CARDS[o.key]) {
        cardIcon(ctx, o.key, X + 32, ry + 26, 16);
        txt(ctx, T(o.name), X + 58, ry + 16, { size: 18, align: 'left', max: 380 });
        txt(ctx, T(o.desc), X + 58, ry + 37, { size: 13, align: 'left', color: PAL.textDim, bold: false, lw: 2.5, max: 390 });
      } else if (type === 'monster') {
        head(ctx, o.key, X + 34, ry + 26, 40);
        txt(ctx, T(o.name), X + 62, ry + 26, { size: 19, align: 'left', max: 380 });
      } else {
        cross(ctx, X + 32, ry + 26, 16, '#c8c2dc');
        txt(ctx, T(o.name), X + 58, ry + 26, { size: 19, align: 'left', max: 380 });
      }
    }
    rr(ctx, X, Y, Wd, 50 + 52 * opts.length, 12); ctx.lineWidth = 2; ctx.strokeStyle = PAL.line; ctx.stroke();
    ctx.restore();
  }

  // ---------- 布置資訊列 ----------
  function drawSetupInfo(ctx, s) {
    s = st(s); var x = N(s.x, 990), y = N(s.y, 670);
    ctx.save(); ctx.translate(x, y);
    rr(ctx, -228, -28, 456, 56, 10); ctx.fillStyle = PAL.panel; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = PAL.line; ctx.stroke();
    coin(ctx, -196, 0, 11);
    txt(ctx, '金幣 ' + Math.round(N(s.gold)), -178, 0, { size: 20, align: 'left', color: PAL.gold });
    txt(ctx, '已排 ' + clamp(Math.round(N(s.cards)), 0, 9) + ' 段', 30, 0, { size: 20, align: 'left' });
    ctx.restore();
  }

  // ---------- 卡發動浮字 ----------
  function drawCardFx(ctx, s) {
    s = st(s); var card = CARDS[s.card] ? s.card : ''; if (!card) return;
    var p = ratio(s.t, s.dur || 0.8); if (N(s.t) >= N(s.dur, 0.8) && N(s.dur, 0.8) > 0) return;
    var x = N(s.x), y = N(s.y), named = CARDS[card].named;
    var sc = p < 0.15 ? 0.6 + p / 0.15 * 0.5 : 1.1 - Math.min(0.1, (p - 0.15));
    var a = p > 0.75 ? 1 - (p - 0.75) / 0.25 : 1;
    ctx.save();
    ctx.translate(x, named ? y - 120 - p * 20 : y - p * 16);
    ctx.scale(sc, sc); ctx.globalAlpha *= a;
    var label = CARDS[card].name + '!';
    ctx.font = F(named ? 26 : 34);
    var w = ctx.measureText(label).width + (named ? 50 : 62), h = named ? 44 : 56;
    rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = 'rgba(14,10,26,0.88)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = TONE[CARDS[card].tone]; ctx.stroke();
    cardIcon(ctx, card, -w / 2 + h / 2, 0, h * 0.34);
    txt(ctx, label, h * 0.3, 0, { size: named ? 26 : 34, color: '#ffffff' });
    ctx.restore();
  }

  // ---------- 舞台裝置 ----------
  function drawStageDevice(ctx, s) {
    s = st(s); var x = N(s.x), y = N(s.y), dev = S(s.device, ['confettiL', 'confettiR', 'sprinkler', 'spin'], 'spin');
    var act = s.active === true, p = ratio(s.t, s.dur);
    ctx.save(); ctx.translate(x, y);
    if (dev === 'spin') {
      var rot = act ? -p * 3 * 50 * Math.PI / 180 : 0; // 逆時針
      circle(ctx, 0, 0, 178); ctx.fillStyle = act ? 'rgba(160,140,230,0.16)' : 'rgba(160,140,230,0.07)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = act ? 'rgba(220,210,255,0.85)' : 'rgba(200,190,240,0.3)'; ctx.stroke();
      circle(ctx, 0, 0, 110); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.save(); ctx.rotate(rot);
      for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 24, Math.sin(a) * 24); ctx.lineTo(Math.cos(a) * 176, Math.sin(a) * 176); ctx.stroke(); }
      ctx.restore();
      circle(ctx, 0, 0, 24); ctx.fillStyle = act ? 'rgba(220,210,255,0.5)' : 'rgba(200,190,240,0.18)'; ctx.fill();
      if (act) {
        ctx.save(); ctx.rotate(rot);
        for (var k = 0; k < 3; k++) {
          var a0 = k * 2.094;
          ctx.beginPath(); ctx.arc(0, 0, 150, a0, a0 + 1.2); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.stroke();
          var hx = Math.cos(a0) * 150, hy = Math.sin(a0) * 150, ta = a0 - Math.PI / 2;
          ctx.beginPath(); ctx.moveTo(hx + Math.cos(ta) * 14, hy + Math.sin(ta) * 14); ctx.lineTo(hx + Math.cos(a0) * 10, hy + Math.sin(a0) * 10); ctx.lineTo(hx - Math.cos(a0) * 10, hy - Math.sin(a0) * 10); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill();
        }
        ctx.restore();
      }
    } else if (dev === 'sprinkler') {
      rr(ctx, -28, -28, 56, 56, 6); ctx.setLineDash([6, 4]); ctx.lineWidth = 2; ctx.strokeStyle = act ? 'rgba(56,168,255,0.9)' : 'rgba(200,190,240,0.4)'; ctx.stroke(); ctx.setLineDash([]);
      if (!act) truck(ctx, 0, 0, 0.72, false);
    } else {
      var k2 = dev === 'confettiL' ? 1 : -1, recoil = act ? Math.sin(Math.min(1, p * 2) * Math.PI) * 6 : 0;
      ctx.scale(k2, 1);
      rr(ctx, -20, 22, 40, 20, 4); ctx.fillStyle = '#5a4a7a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, 22); ctx.lineTo(0, 6); ctx.lineTo(8, 22); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.translate(-recoil, 6); ctx.rotate(-0.45);
      rr(ctx, -20, -11, 40, 22, 6); ctx.fillStyle = act ? '#ff9a4a' : '#a07850'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = act ? '#ffd23f' : '#c8a070'; ctx.fillRect(0, -11, 5, 22);
      rr(ctx, 18, -13, 6, 26, 2); ctx.fillStyle = '#3a2e52'; ctx.fill(); ctx.stroke();
      ctx.restore();
      if (act && p < 0.7) {
        var cols = ['#ffd23f', '#ff7a2a', '#ff9ad5', '#ffffff'];
        for (var c = 0; c < 6; c++) { var aa = -0.45 + (hash(c, 9) - 0.5) * 0.9, rd = 18 + p * 16 + hash(c, 4) * 6; ctx.fillStyle = cols[c % 4]; ctx.fillRect(Math.cos(aa) * rd - 2, 6 + Math.sin(aa) * rd - 2 - 12, 4, 4); }
      }
    }
    ctx.restore();
  }
  function truck(ctx, x, y, k, water) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.outline;
    rr(ctx, -34, -18, 44, 30, 6); ctx.fillStyle = '#4aa8e8'; ctx.fill(); ctx.stroke();
    rr(ctx, 10, -10, 24, 22, 5); ctx.fillStyle = '#e8eef8'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9fd8ff'; ctx.fillRect(16, -6, 12, 8);
    circle(ctx, -22, 16, 7); ctx.fillStyle = '#222'; ctx.fill(); ctx.stroke();
    circle(ctx, 22, 16, 7); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // ---------- 裝置特效 ----------
  function drawDeviceFx(ctx, s) {
    s = st(s); var x = N(s.x), y = N(s.y);
    var kind = S(s.kind, ['confettiWarn', 'confettiBurst', 'sprinkler', 'balloonWarn', 'balloonBurst'], 'confettiWarn');
    var r = Math.max(0, N(s.radius, kind.indexOf('balloon') === 0 ? 110 : kind === 'sprinkler' ? 80 : 160));
    var p = ratio(s.t, s.dur);
    var colr = s.color === 'blue' ? PAL.douse : PAL.ignite;
    ctx.save();
    if (kind === 'confettiWarn' || kind === 'balloonWarn') {
      var c = kind === 'confettiWarn' ? PAL.ignite : colr;
      circle(ctx, x, y, r - 1.5); ctx.fillStyle = hexA(c, 0.1); ctx.fill();
      circle(ctx, x, y, r * p); ctx.fillStyle = hexA(c, 0.3); ctx.fill();
      circle(ctx, x, y, r - 1.5); ctx.lineWidth = 3; ctx.strokeStyle = c; ctx.setLineDash([12, 8]); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y); ctx.moveTo(x, y - 14); ctx.lineTo(x, y + 14); ctx.lineWidth = 2; ctx.stroke();
      if (kind === 'balloonWarn') {
        var by = y - (1 - p) * 300 - 34;
        ell(ctx, x, y, 24 * (0.4 + 0.6 * p), 7 * (0.4 + 0.6 * p)); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(x, by + 30); ctx.quadraticCurveTo(x + 8, by + 44, x, by + 56); ctx.strokeStyle = '#e8e2f8'; ctx.lineWidth = 2; ctx.stroke();
        ell(ctx, x, by, 24, 30); ctx.fillStyle = colr; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
        ell(ctx, x - 8, by - 10, 6, 9); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
      }
    } else if (kind === 'confettiBurst' || kind === 'balloonBurst') {
      var c2 = kind === 'confettiBurst' ? PAL.ignite : colr;
      var a = 1 - p;
      circle(ctx, x, y, r - 1.5); ctx.fillStyle = hexA(c2, 0.35 * a); ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = hexA(c2, a); ctx.stroke();
      var cols = kind === 'confettiBurst' ? ['#ffd23f', '#ff7a2a', '#ff9ad5', '#ffffff'] : [colr, '#ffffff'];
      for (var i = 0; i < 18; i++) {
        var ang = i * 0.349 + hash(i, 1), rd = r * (0.3 + 0.65 * p) * (0.6 + 0.4 * hash(i, 2));
        ctx.save(); ctx.translate(x + Math.cos(ang) * rd, y + Math.sin(ang) * rd); ctx.rotate(ang + p * 6);
        ctx.fillStyle = cols[i % cols.length]; ctx.globalAlpha *= a; ctx.fillRect(-5, -2.5, 10, 5); ctx.restore();
      }
    } else { // sprinkler
      ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(1220, y); ctx.setLineDash([14, 10]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(56,168,255,0.35)'; ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(56,168,255,0.06)'; ctx.fillRect(60, y - r, Math.max(0, x - 60), r * 2);
      var g = ctx.createLinearGradient(x - 26, 0, x + 26, 0);
      g.addColorStop(0, 'rgba(56,168,255,0)'); g.addColorStop(0.5, 'rgba(120,200,255,0.55)'); g.addColorStop(1, 'rgba(56,168,255,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 26, y - r, 52, r * 2);
      ctx.beginPath(); ctx.moveTo(x - 20, y - r + 1); ctx.lineTo(x + 20, y - r + 1); ctx.moveTo(x - 20, y + r - 1); ctx.lineTo(x + 20, y + r - 1); ctx.strokeStyle = PAL.douse; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#d8f0ff';
      var tt = now() * 3;
      for (var d = 0; d < 10; d++) { var fy = ((d / 10 + tt) % 1) * 2 - 1; circle(ctx, x + (hash(d, 3) - 0.5) * 36, y + fy * (r - 6), 2.5); ctx.fill(); }
      truck(ctx, x, y, 1, true);
    }
    ctx.restore();
  }

  // ---------- 表演場 ----------
  function drawShowArena(ctx) {
    ctx.save();
    ctx.fillStyle = '#120d22'; ctx.fillRect(0, 0, W, H);
    // 觀眾席
    ctx.fillStyle = PAL.stands; ctx.fillRect(0, 50, W, 96); ctx.fillRect(0, 566, W, 100);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 2;
    for (var r = 0; r < 3; r++) {
      ctx.beginPath(); ctx.moveTo(0, 70 + r * 26); ctx.lineTo(W, 70 + r * 26); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 594 + r * 26); ctx.lineTo(W, 594 + r * 26); ctx.stroke();
    }
    // 場地
    ctx.fillStyle = PAL.stage; ctx.fillRect(60, 146, 1160, 420);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2;
    for (var i = 1; i < 10; i++) { ctx.beginPath(); ctx.moveTo(60, 146 + i * 42); ctx.lineTo(1220, 146 + i * 42); ctx.stroke(); }
    var g = ctx.createRadialGradient(640, 356, 40, 640, 356, 640);
    g.addColorStop(0, 'rgba(255,220,160,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = g; ctx.fillRect(60, 146, 1160, 420);
    ctx.strokeStyle = '#6a5a9a'; ctx.lineWidth = 3; ctx.strokeRect(61.5, 147.5, 1157, 417);
    ctx.fillStyle = 'rgba(255,210,63,0.5)';
    for (var k = 0; k < 30; k++) { circle(ctx, 80 + k * 39.3, 150, 2); ctx.fill(); circle(ctx, 80 + k * 39.3, 562, 2); ctx.fill(); }
    // 縮小節目表帶
    ctx.fillStyle = '#0d0a19'; ctx.fillRect(0, 666, W, 54);
    ctx.restore();
  }

  // ---------- 表演場魔物 ----------
  function drawShowMonster(ctx, s) {
    s = st(s); var sp = sp0(s.species), box = sp === 'crab' ? 120 : 96;
    var x = N(s.x), y = N(s.y), dir = N(s.dir, 1) < 0 ? -1 : 1;
    var lv = clamp(Math.round(N(s.level)), 0, 3), rage = clamp(N(s.rage), 0, 100), redLow = clamp(N(s.redLow, 80), 0, 100);
    var marks = clamp(Math.round(N(s.marks)), 0, 4);
    var mode = S(s.mode, ['roam', 'rampage', 'rally', 'hold', 'spin', 'knock', 'charge', 'loose'], 'roam');
    var move = S(s.move, ['walk', 'jump', 'burrow', 'roll'], 'walk');
    var mp = ratio(s.moveT, s.moveDur);
    var fx = S(s.fx, ['none', 'ignited', 'doused'], 'none'), fp = ratio(s.fxT, s.fxDur || 0.5);
    var wild = mode === 'charge' || mode === 'loose';
    var tnow = now();
    ctx.save(); ctx.translate(x, y);
    if (move === 'burrow') {
      mound(ctx, box, mp);
    } else {
      var lift = 0, sc = 0.9;
      if (move === 'jump') { lift = Math.sin(Math.PI * mp) * box * 0.12; sc = 0.8; }
      ell(ctx, 0, box * 0.38, box * 0.3, box * 0.07); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      if (wild) {
        var pul = 0.5 + 0.5 * Math.sin(tnow * 16);
        circle(ctx, 0, 0, box * 0.47); ctx.fillStyle = 'rgba(255,59,78,' + (0.18 + 0.15 * pul) + ')'; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = PAL.danger; ctx.stroke();
      }
      if (mode === 'rampage' || mode === 'charge') {
        ctx.strokeStyle = mode === 'charge' ? PAL.danger : PAL.ignite; ctx.lineWidth = 4; ctx.lineCap = 'round';
        for (var i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-dir * box * 0.46, i * box * 0.15); ctx.lineTo(-dir * box * 0.3, i * box * 0.15); ctx.stroke(); }
      }
      if (s.performing === true) {
        var pp = ratio(s.performT, s.performDur || 0.5);
        circle(ctx, 0, 0, box * (0.3 + 0.17 * pp)); ctx.lineWidth = 4; ctx.strokeStyle = hexA(PAL[sp], 1 - pp); ctx.stroke();
        sc *= 1 + 0.08 * Math.sin(Math.PI * pp);
      }
      ctx.save(); ctx.translate(0, -lift);
      if (mode === 'knock') ctx.rotate(dir * 0.3);
      if (mode === 'charge' && N(s.chargeT) > 0) ctx.translate(Math.sin(tnow * 60) * 3, 0);
      ctx.scale(dir * sc, sc);
      paintSpecies(ctx, sp, box, { anim: tnow, roll: move === 'roll' ? tnow * 6 : 0 });
      ctx.restore();
      if (mode === 'hold') {
        ctx.lineWidth = 3; ctx.strokeStyle = PAL.outline;
        ctx.beginPath(); ctx.moveTo(-box * 0.38, box * 0.3); ctx.lineTo(-box * 0.38, -box * 0.42); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-box * 0.38, -box * 0.42); ctx.lineTo(-box * 0.12, -box * 0.33); ctx.lineTo(-box * 0.38, -box * 0.24); ctx.closePath(); ctx.fillStyle = PAL.gold; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      } else if (mode === 'rally') {
        ctx.strokeStyle = PAL.gold; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (var c = 0; c < 2; c++) { var cx = dir * box * (0.3 + c * 0.1); ctx.beginPath(); ctx.moveTo(cx - dir * 6, -box * 0.38); ctx.lineTo(cx, -box * 0.3); ctx.lineTo(cx - dir * 6, -box * 0.22); ctx.stroke(); }
      } else if (mode === 'spin') {
        ctx.strokeStyle = '#e6deff'; ctx.lineWidth = 3.5;
        for (var q = 0; q < 2; q++) { var a0 = -tnow * 4 + q * Math.PI; ctx.beginPath(); ctx.arc(0, 0, box * 0.44, a0, a0 + 1.6); ctx.stroke(); }
      } else if (mode === 'knock') {
        starPath(ctx, dir * box * 0.36, -box * 0.2, box * 0.1, box * 0.04, 6); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
      }
    }
    // 被點燃 / 被澆熄(長在本體上: 往上竄的火 / 往下滴的水)
    if (fx !== 'none' && fp < 1) {
      var fa = 1 - fp;
      ctx.save(); ctx.globalAlpha *= fa;
      if (fx === 'ignited') {
        [[-0.3, 0.1], [0.3, 0.05], [0, -0.15]].forEach(function (d, k) {
          var fy = box * (d[1] - fp * 0.22), fx0 = box * d[0], fs = box * (0.11 + 0.03 * k);
          ctx.beginPath(); ctx.moveTo(fx0, fy - fs * 1.6); ctx.quadraticCurveTo(fx0 + fs, fy, fx0, fy + fs * 0.6); ctx.quadraticCurveTo(fx0 - fs, fy, fx0, fy - fs * 1.6);
          ctx.fillStyle = PAL.ignite; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
          circle(ctx, fx0, fy, fs * 0.3); ctx.fillStyle = '#ffe08a'; ctx.fill();
        });
      } else {
        [[-0.28, -0.3], [0.25, -0.25], [0, -0.38]].forEach(function (d, k) {
          var dy = box * (d[1] + fp * 0.5), dx = box * d[0], ds = box * (0.07 + 0.015 * k);
          ctx.beginPath(); ctx.moveTo(dx, dy - ds * 1.4); ctx.quadraticCurveTo(dx + ds, dy, dx, dy + ds); ctx.quadraticCurveTo(dx - ds, dy, dx, dy - ds * 1.4);
          ctx.fillStyle = PAL.douse; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
        });
      }
      ctx.restore();
    }
    txt(ctx, 'Lv ' + lv, -box / 2 + 2, box / 2 - 9, { size: 13, align: 'left', color: PAL.gold, lw: 3 });
    // 怒氣條(頭上 90×12)
    var bw = 90, bh = 12, bx = -45, by = -box / 2 - 16;
    rr(ctx, bx - 1, by - 1, bw + 2, bh + 2, 4); ctx.fillStyle = 'rgba(10,6,20,0.92)'; ctx.fill();
    ctx.fillStyle = 'rgba(255,59,78,0.28)'; ctx.fillRect(bx + bw * redLow / 100, by, bw * (1 - redLow / 100), bh);
    var fc = rage >= redLow ? PAL.redZone : rage >= 50 ? PAL.rageMid : PAL.rageLow;
    if (wild) fc = Math.floor(tnow * 8) % 2 ? PAL.redZone : '#ffffff';
    ctx.fillStyle = fc; ctx.fillRect(bx, by + 2, bw * (wild ? 1 : rage / 100), bh - 4);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(bx + bw * 0.5 - 1, by - 1, 2, bh + 2);
    ctx.fillStyle = PAL.redZone; ctx.fillRect(bx + bw * redLow / 100 - 1, by - 2, 2, bh + 4);
    // 失控標記 / 失控進度
    if (wild) {
      var wp = mode === 'charge' ? ratio(s.chargeT, s.chargeDur || 1.5) : 1 - ratio(s.looseT, s.looseDur || 6);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, by + bh + 2, bw * wp, 2.5);
    } else if (marks > 0) {
      for (var m = 0; m < 4; m++) {
        var mx = -24 + m * 16, my = by - 11;
        ctx.beginPath(); ctx.moveTo(mx, my - 7); ctx.lineTo(mx + 6, my); ctx.lineTo(mx, my + 7); ctx.lineTo(mx - 6, my); ctx.closePath();
        ctx.fillStyle = m < marks ? PAL.mark : 'rgba(30,20,40,0.85)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = m < marks ? '#ffffff' : '#6a5a7a'; ctx.stroke();
      }
      var ml = ratio(s.markLeft, s.markDur || 4);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(-30, by - 2.5, 60 * ml, 2);
    }
    ctx.restore();
  }

  // ---------- 圍欄 / 觀眾 ----------
  function drawFence(ctx, s) {
    s = st(s); var x = N(s.x), y = N(s.y), broken = s.broken === true;
    ctx.save(); ctx.translate(x, y);
    ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.fillStyle = PAL.fence;
    if (!broken) {
      rr(ctx, -66, -6, 132, 5, 2); ctx.fill(); ctx.stroke();
      rr(ctx, -66, 2, 132, 4, 2); ctx.fill(); ctx.stroke();
      [-60, -20, 20, 60].forEach(function (px) { rr(ctx, px - 4, -7, 8, 14, 2); ctx.fillStyle = '#a07040'; ctx.fill(); ctx.stroke(); });
    } else {
      ctx.fillStyle = '#7a5a3a';
      ctx.beginPath(); ctx.moveTo(-66, -6); ctx.lineTo(-22, -6); ctx.lineTo(-14, -1); ctx.lineTo(-24, 6); ctx.lineTo(-66, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(66, -6); ctx.lineTo(24, -6); ctx.lineTo(16, 2); ctx.lineTo(26, 6); ctx.lineTo(66, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = PAL.danger; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(14, 0); ctx.stroke(); ctx.setLineDash([]);
      cross(ctx, 0, 0, 10, PAL.danger);
    }
    ctx.restore();
  }
  function drawVisitor(ctx, s) {
    s = st(s); var x = N(s.x), y = N(s.y), mode = S(s.mode, ['watch', 'scared', 'empty'], 'watch');
    var hue = Math.floor(hash(Math.round(x), 7) * 4), shirts = ['#5a7ad8', '#d87a5a', '#6ab87a', '#b07ad0'];
    ctx.save(); ctx.translate(x, y);
    ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline;
    rr(ctx, -22, -14, 44, 40, 6); ctx.fillStyle = '#3a2e58'; ctx.fill(); ctx.stroke();
    rr(ctx, -24, 22, 48, 10, 3); ctx.fillStyle = '#4a3c6c'; ctx.fill(); ctx.stroke();
    if (mode === 'watch') {
      rr(ctx, -13, -4, 26, 26, 8); ctx.fillStyle = shirts[hue]; ctx.fill(); ctx.stroke();
      circle(ctx, 0, -18, 11); ctx.fillStyle = PAL.visitor; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -17, 5, 0.3, Math.PI - 0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(12, 2); ctx.lineTo(18, -22); ctx.lineWidth = 4; ctx.strokeStyle = PAL.outline; ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#ffe14a'; ctx.stroke();
    } else if (mode === 'scared') {
      ctx.save(); ctx.translate(Math.sin(now() * 40) * 2, -2);
      rr(ctx, -13, -4, 26, 24, 8); ctx.fillStyle = shirts[hue]; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-20, -22); ctx.moveTo(12, 0); ctx.lineTo(20, -22); ctx.lineWidth = 4; ctx.stroke();
      circle(ctx, 0, -18, 11); ctx.fillStyle = '#cfe0ff'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      circle(ctx, 0, -14, 3.5); ctx.fillStyle = PAL.outline; ctx.fill();
      ctx.fillStyle = PAL.outline; ctx.fillRect(-5, -23, 2.5, 3); ctx.fillRect(3, -23, 2.5, 3);
      ctx.restore();
      ctx.fillStyle = PAL.danger; ctx.fillRect(18, -36, 4, 12); circle(ctx, 20, -20, 2.4); ctx.fill();
    }
    ctx.restore();
  }

  // ---------- 商店 ----------
  function shopIcon(ctx, item, x, y) {
    if (CARDS[item]) { cardIcon(ctx, item, x, y, 26); return; }
    ctx.save(); ctx.translate(x, y);
    if (WEAPONS.indexOf(item) >= 0) { ctx.rotate(-0.7); ctx.translate(-22, 0); weaponShape(ctx, item, 46); }
    else if (item === 'attack') {
      ctx.rotate(-0.7); ctx.translate(-20, 4); weaponShape(ctx, 'sword', 40); ctx.rotate(0.7);
      ctx.translate(30, -16); txt(ctx, '+', 0, 0, { size: 26, color: PAL.gold });
    } else if (item === 'armor') {
      ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(20, -16); ctx.lineTo(18, 6); ctx.quadraticCurveTo(10, 20, 0, 26); ctx.quadraticCurveTo(-10, 20, -18, 6); ctx.lineTo(-20, -16); ctx.closePath();
      ctx.fillStyle = '#8a9ac8'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
      heartPath(ctx, 0, 0, 22); ctx.fillStyle = '#ff5a7a'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
    } else {
      for (var i = 0; i < 3; i++) { ell(ctx, 0, -6 + i * 8, 20, 9); ctx.strokeStyle = PAL.outline; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = PAL.rope; ctx.lineWidth = 3.5; ctx.stroke(); }
    }
    ctx.restore();
  }
  function drawShopItem(ctx, s) {
    s = st(s); var x = N(s.x), y = N(s.y), item = S(s.item, SHOP_KEYS, 'club'), info = SHOP[item];
    var owned = s.owned === true, eq = s.equipped === true && info.type === 'weapon', aff = s.affordable === true, sel = s.selected === true;
    var lv = Math.max(0, Math.round(N(s.level)));
    var buyable = !owned && aff;
    ctx.save(); ctx.translate(x, y);
    rr(ctx, -188, -48, 376, 96, 12); ctx.fillStyle = eq ? '#2f4a3c' : PAL.panel; ctx.fill();
    rr(ctx, -180, -38, 76, 76, 10); ctx.fillStyle = 'rgba(10,6,20,0.5)'; ctx.fill();
    shopIcon(ctx, item, -142, 0);
    txt(ctx, info.name, -94, -24, { size: 20, align: 'left', max: 190 });
    var lines = wrap(ctx, info.desc, 196, 13, false).slice(0, 2);
    lines.forEach(function (ln, i) { txt(ctx, ln, -94, (lines.length > 1 ? 2 : 6) + i * 17, { size: 13, align: 'left', bold: false, color: '#cfc8e6', lw: 2.5 }); });
    if (info.type === 'up') txt(ctx, '已買 ' + lv, -94, 36, { size: 12, align: 'left', color: PAL.textDim, lw: 2.5 });
    if (owned || info.type === 'weapon' && item === 'club') {
      if (eq) {
        rr(ctx, 104, -14, 76, 28, 14); ctx.fillStyle = PAL.ok; ctx.fill();
        txt(ctx, '裝備中', 142, 0, { size: 15, color: '#10301c', stroke: false });
      } else txt(ctx, '已擁有', 178, 0, { size: 17, align: 'right', color: PAL.textDim });
    } else {
      coin(ctx, 112, 0, 9);
      txt(ctx, String(Math.round(N(s.cost))), 178, 0, { size: 22, align: 'right', color: aff ? PAL.gold : '#7d7690' });
    }
    if (!owned && !aff && !(item === 'club')) { rr(ctx, -188, -48, 376, 96, 12); ctx.fillStyle = 'rgba(10,6,20,0.35)'; ctx.fill(); }
    rr(ctx, -188, -48, 376, 96, 12);
    ctx.lineWidth = sel ? 5 : 1.5; ctx.strokeStyle = sel ? PAL.select : (buyable ? '#7a6aa8' : PAL.line); ctx.stroke();
    ctx.restore();
  }

  // ---------- 按鈕 ----------
  function drawButton(ctx, s) {
    s = st(s); var x = N(s.x), y = N(s.y), w = Math.max(0, N(s.w, 200)), h = Math.max(0, N(s.h, 70)), sel = s.selected === true;
    ctx.save();
    rr(ctx, x + 2, y + 2, w - 4, h - 4, 14); ctx.fillStyle = sel ? '#ffd23f' : PAL.panelHi; ctx.fill();
    ctx.lineWidth = sel ? 4 : 2; ctx.strokeStyle = sel ? '#ffffff' : PAL.line; ctx.stroke();
    txt(ctx, T(s.label), x + w / 2, y + h / 2, { size: 26, color: sel ? '#2a1a00' : PAL.text, stroke: !sel, max: w - 20 });
    ctx.restore();
  }

  // ---------- 飄字 ----------
  var FT = {
    gold: { c: PAL.gold, z: 20 }, redGold: { c: '#ff5a4a', z: 26 }, chain: { c: '#d9a8ff', z: 26 },
    repDown: { c: '#ff7a8a', z: 20 }, capture: { c: PAL.ok, z: 28 }, levelUp: { c: '#7fe8ff', z: 24 },
    coin20: { c: PAL.gold, z: 22 }, fizzle: { c: '#b8b2cc', z: 18 }
  };
  function drawFloatText(ctx, s) {
    s = st(s); var kind = S(s.kind, Object.keys(FT), 'gold'), ft = FT[kind];
    var dur = N(s.dur, 1); if (dur > 0 && N(s.t) >= dur) return;
    var p = ratio(s.t, dur || 1);
    var x = N(s.x), y = N(s.y) - p * 40;
    ctx.save(); ctx.globalAlpha *= p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1;
    var sc = p < 0.1 ? 0.7 + p * 3 : 1;
    ctx.translate(x, y); ctx.scale(sc, sc);
    if (kind === 'gold' || kind === 'redGold' || kind === 'coin20') {
      ctx.font = F(ft.z); var tw = ctx.measureText(T(s.text)).width;
      coin(ctx, -tw / 2 - 14, 0, ft.z * 0.38);
    }
    txt(ctx, T(s.text), 0, 0, { size: ft.z, color: ft.c, lw: 5 });
    ctx.restore();
  }

  // ---------- 結算 ----------
  function drawResultPanel(ctx, s) {
    s = st(s); var stars = clamp(Math.round(N(s.stars)), 0, 3);
    var roster = Array.isArray(s.roster) ? s.roster : [];
    ctx.save(); ctx.translate(640, 380);
    rr(ctx, -396, -256, 792, 512, 20); ctx.fillStyle = 'rgba(24,18,44,0.97)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.line; ctx.stroke();
    txt(ctx, '七天結算', 0, -222, { size: 30 });
    for (var i = 0; i < 3; i++) {
      starPath(ctx, -90 + i * 90, -158, 36, 16); ctx.fillStyle = i < stars ? PAL.gold : '#3a3354'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.outline; ctx.stroke();
    }
    var rows = [['總名聲', Math.round(N(s.rep)), PAL.rep], ['累計金幣', Math.round(N(s.goldEarned)), PAL.gold], ['最長連鎖', Math.round(N(s.bestChain)) + ' 段', '#d9a8ff']];
    rows.forEach(function (r, k) {
      var ry = -86 + k * 44;
      txt(ctx, r[0], -40, ry, { size: 22, align: 'right', color: PAL.textDim });
      txt(ctx, String(r[1]), 0, ry, { size: 26, align: 'left', color: r[2] });
    });
    txt(ctx, '陣容', 0, 58, { size: 18, color: PAL.textDim });
    var n = Math.min(6, roster.length), gap = 116;
    for (var j = 0; j < n; j++) {
      var r0 = st(roster[j]), rx = (j - (n - 1) / 2) * gap;
      head(ctx, r0.species, rx, 112, 66);
      txt(ctx, 'Lv ' + clamp(Math.round(N(r0.level)), 0, 3), rx, 160, { size: 15, color: PAL.gold });
    }
    txt(ctx, '按 Z 重來', 0, 222, { size: 24, color: PAL.select });
    ctx.restore();
  }

  // ---------- HUD ----------
  function drawHud(ctx, s) {
    s = st(s); var phase = S(s.phase, ['guide', 'select', 'dungeon', 'setup1', 'setup2', 'show', 'shop', 'result'], 'select');
    if (phase === 'guide') return; // 說明頁的字全歸 RD, HUD 不畫
    var dun = phase === 'dungeon', h = dun ? 100 : 50;
    ctx.save();
    ctx.fillStyle = 'rgba(12,9,24,0.94)'; ctx.fillRect(0, 0, W, h);
    ctx.fillStyle = PAL.line; ctx.fillRect(0, h - 2, W, 2);
    var ry = 25;
    txt(ctx, '第 ' + Math.round(N(s.day, 1)) + '/' + Math.round(N(s.dayMax, 7)) + ' 天', 20, ry, { size: 20, align: 'left' });
    coin(ctx, 158, ry, 10); txt(ctx, String(Math.round(N(s.gold))), 174, ry, { size: 20, align: 'left', color: PAL.gold });
    repStar(ctx, 268, ry, 11); txt(ctx, String(Math.round(N(s.rep))), 284, ry, { size: 20, align: 'left', color: PAL.rep });
    var tm = N(s.timeMax), tl = Math.max(0, N(s.timeLeft));
    function timer(cx) {
      var r = tm > 0 ? clamp(tl / tm, 0, 1) : 0, warn = tl <= 10;
      circle(ctx, cx, ry, 13); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx, ry); ctx.arc(cx, ry, 13, -Math.PI / 2, -Math.PI / 2 + r * Math.PI * 2); ctx.closePath(); ctx.fillStyle = warn ? PAL.danger : '#e8e2f8'; ctx.fill();
      circle(ctx, cx, ry, 13); ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
      txt(ctx, String(Math.ceil(tl)), cx + 22, ry, { size: 24, align: 'left', color: warn ? PAL.danger : PAL.text });
    }
    var msg = T(s.message);
    if (dun) {
      var d = S(s.dungeon, DUNGEONS, 'forest');
      txt(ctx, DUN[d].name, 640, ry, { size: 24, color: TH[d].accent });
      if (tm > 0) timer(1190);
      var y2 = 74, mh = Math.max(0, Math.round(N(s.maxHearts, 6))), hp = Math.max(0, Math.round(N(s.hearts)));
      var hx = 24;
      for (var i = 0; i < Math.min(mh, 14); i++) {
        heartPath(ctx, hx + i * 26, y2, 24); ctx.fillStyle = i < hp ? '#ff4a6a' : '#3a3150'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
      }
      var rx = hx + Math.max(6, Math.min(mh, 14)) * 26 + 18;
      var ropes = Math.max(0, Math.round(N(s.ropes))), rmax = Math.max(0, Math.round(N(s.ropeMax, 3)));
      for (var k = 0; k < Math.min(rmax, 10); k++) {
        circle(ctx, rx + k * 24, y2, 8); ctx.strokeStyle = PAL.outline; ctx.lineWidth = 6; ctx.stroke();
        ctx.strokeStyle = k < ropes ? PAL.rope : '#3a3150'; ctx.lineWidth = 3.5; ctx.stroke();
      }
      var wx = rx + Math.max(3, Math.min(rmax, 10)) * 24 + 24;
      var w = S(s.weapon, WEAPONS, 'club');
      ctx.save(); ctx.translate(wx, y2 + 6); ctx.rotate(-0.6); weaponShape(ctx, w, 30); ctx.restore();
      txt(ctx, WPN[w], wx + 30, y2, { size: 18, align: 'left' });
      var kx = wx + 30 + (w === 'club' ? 50 : w === 'sword' ? 32 : 50) + 18;
      var cdMax = N(s.xCdMax), cdL = Math.max(0, N(s.xCdLeft));
      keycap(ctx, 'X', kx, y2, 32, cdMax <= 0);
      if (cdMax <= 0) { ctx.beginPath(); ctx.moveTo(kx - 12, y2 + 11); ctx.lineTo(kx + 12, y2 - 13); ctx.strokeStyle = PAL.outline; ctx.lineWidth = 3; ctx.stroke(); }
      else if (cdL > 0) {
        var cr = clamp(cdL / cdMax, 0, 1);
        ctx.save(); rr(ctx, kx - 16, y2 - 16, 32, 29, 6); ctx.clip();
        ctx.beginPath(); ctx.moveTo(kx, y2 - 2); ctx.arc(kx, y2 - 2, 26, -Math.PI / 2, -Math.PI / 2 + cr * Math.PI * 2); ctx.closePath(); ctx.fillStyle = 'rgba(10,6,20,0.72)'; ctx.fill(); ctx.restore();
      }
      if (msg) {
        var hot = msg !== 'Z 攻擊 X 武器技';
        ctx.font = F(20); var mw = ctx.measureText(msg).width;
        if (hot) { rr(ctx, 1256 - mw - 20, y2 - 17, mw + 24, 34, 17); ctx.fillStyle = 'rgba(255,210,63,0.18)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.gold; ctx.stroke(); }
        txt(ctx, msg, 1256 - 2, y2, { size: 20, align: 'right', color: hot ? PAL.gold : PAL.text });
      }
    } else {
      if (tm > 0) timer(610);
      if (msg) txt(ctx, msg, 1260, ry, { size: 19, align: 'right', color: '#e8e2f8', max: 520 });
    }
    ctx.restore();
  }

  // ---------- 說明頁示意圖 ----------
  var VW = 1200, VH = 520;
  function tilesArea(ctx, x0, y0, cols, rows, d, extra) {
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var k = extra ? extra(c, r) : null;
      drawTile(ctx, { x: x0 + 30 + c * 60, y: y0 + 30 + r * 60, dungeon: d, kind: k || 'floor', room: 'left', nest: false });
    }
  }
  function frame(ctx, x, y, w, h) {
    rr(ctx, x, y, w, h, 14); ctx.lineWidth = 3; ctx.strokeStyle = PAL.line; ctx.stroke();
  }
  function label(ctx, s, x, y, col) { txt(ctx, s, x, y, { size: 18, color: col || PAL.text }); }
  function guide1(ctx) {
    ctx.save(); rr(ctx, 0, 0, VW, VH, 14); ctx.clip();
    tilesArea(ctx, 0, -20, 20, 10, 'forest', function (c, r) { if (r === 0) return 'wall'; if (c === 3 && r === 6) return 'pillar'; if ((c === 15 || c === 16) && (r === 2 || r === 3)) return 'slow'; return null; });
    var sx = 680, sy = 280, tx = 612, ty = 284;
    drawHazard(ctx, { x: sx, y: sy, kind: 'spore', phase: 'warn', radius: 110, t: 0.45, dur: 0.9 });
    drawWildMonster(ctx, { x: sx, y: sy, species: 'spore', hp: 5, maxHp: 7, hit: true, dir: -1, move: 'walk' });
    drawTamer(ctx, { x: tx, y: ty, facing: 2, weapon: 'club' });
    drawWeaponFx(ctx, { x: tx, y: ty, weapon: 'club', move: 'normal', shape: 'arc', angle: 0, spread: 1.745, radius: 70, t: 0.05, dur: 0.2 });
    arrow(ctx, tx - 14, ty + 30, 470, 440, { cx: 560, cy: 420, color: '#ffffff', lw: 5, dash: [12, 8] });
    arrowKeys(ctx, 400, 450);
    keycap(ctx, 'Z', 640, 196); keycap(ctx, 'X', 684, 196, 34, true);
    ctx.restore(); frame(ctx, 0, 0, VW, VH);
  }
  function guide2(ctx) {
    ctx.save(); rr(ctx, 0, 0, 580, VH, 14); ctx.clip();
    tilesArea(ctx, 0, -20, 10, 10, 'forest', function (c, r) { return r === 0 ? 'wall' : null; });
    var fx = 290, fy = 290;
    drawCaptureRing(ctx, { x: fx, y: fy, t: 0.4, dur: 0.8 });
    drawWildMonster(ctx, { x: fx, y: fy, species: 'frog', hp: 2, maxHp: 7, weak: true, dir: -1, move: 'walk' });
    drawTamer(ctx, { x: fx + 8, y: fy + 14, facing: 6, weapon: 'club' });
    ctx.restore(); frame(ctx, 0, 0, 580, VH);
    ctx.save(); rr(ctx, 620, 0, 580, VH, 14); ctx.clip();
    tilesArea(ctx, 620, -20, 10, 10, 'forest', function (c, r) { return r === 0 ? 'wall' : null; });
    var gx = 880, gy = 270, R = 115, ta = -0.5;
    var tx = gx + Math.cos(ta) * R, ty = gy + Math.sin(ta) * R;
    ctx.beginPath(); ctx.arc(gx, gy, R, ta + 0.35, ta + Math.PI * 1.75); ctx.setLineDash([10, 8]); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke(); ctx.setLineDash([]);
    var ea = ta + Math.PI * 1.75, ex = gx + Math.cos(ea) * R, ey = gy + Math.sin(ea) * R;
    arrow(ctx, gx + Math.cos(ea - 0.2) * R, gy + Math.sin(ea - 0.2) * R, ex, ey, { color: '#ffffff', lw: 4 });
    drawWildMonster(ctx, { x: gx, y: gy, species: 'frog', hp: 2, maxHp: 7, weak: true, lassoed: true, stunLeft: 0, dir: 1, move: 'walk' });
    drawLasso(ctx, { x1: tx, y1: ty, x2: gx, y2: gy, progress: 0.5, t: 2, limit: 5, len: R, maxLen: 220 });
    drawTamer(ctx, { x: tx, y: ty, facing: 3, weapon: 'club', lassoing: true });
    rr(ctx, 1010, 400, 170, 100, 12); ctx.fillStyle = 'rgba(14,10,26,0.85)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.line; ctx.stroke();
    drawFloatText(ctx, { x: 1110, y: 450, text: '收服!', kind: 'capture', t: 0.15, dur: 1 });
    check(ctx, 1040, 446, 26);
    ctx.restore(); frame(ctx, 620, 0, 580, VH);
  }
  function guide3(ctx) {
    // 左: 布置第 2 步(以遊戲座標 1280×720 畫, 取 x 60~1240、y 50~710 縮進來)
    var k1 = 0.6;
    ctx.save(); ctx.translate(6, 62); rr(ctx, 0, 0, 1180 * k1, 660 * k1, 12); ctx.clip();
    ctx.scale(k1, k1); ctx.translate(-60, -50);
    drawBackground(ctx);
    for (var i = 0; i < 9; i++) {
      var c = i === 1 ? 'provoke' : i === 3 ? 'chill' : '';
      drawTimelineSlot(ctx, { x: 400, y: 90 + 60 * i, style: 'row', slot: i, card: c, target: i === 1 ? 'spore' : i === 3 ? 'frog' : '', selected: i === 5, active: false, done: false });
    }
    drawButton(ctx, { x: 300, y: 620, w: 200, h: 70, label: '開演', selected: false });
    drawPickerPanel(ctx, { layer: 'target', index: 0, options: [{ type: 'monster', key: 'spore', name: '菇菇球', desc: '' }, { type: 'monster', key: 'frog', name: '露水蛙', desc: '' }] });
    ctx.restore(); frame(ctx, 6, 62, 1180 * k1, 660 * k1);
    arrow(ctx, 722, 258, 752, 258, { color: '#ffffff', lw: 5 });
    // 右: 開演後表演場(取 x 0~820、y 140~720)
    var k2 = 0.53;
    ctx.save(); ctx.translate(758, 104); rr(ctx, 0, 0, 820 * k2, 580 * k2, 12); ctx.clip();
    ctx.scale(k2, k2); ctx.translate(0, -140);
    drawShowArena(ctx);
    for (var f = 0; f < 5; f++) { drawFence(ctx, { x: 165 + 136 * f, y: 140, side: 'top', broken: false }); drawFence(ctx, { x: 165 + 136 * f, y: 572, side: 'bottom', broken: false }); drawVisitor(ctx, { x: 165 + 136 * f, y: 622, side: 'bottom', mode: 'watch' }); }
    drawShowMonster(ctx, { x: 300, y: 340, species: 'spore', level: 0, rage: 90, redLow: 80, marks: 0, mode: 'roam', fx: 'ignited', fxT: 0.15, fxDur: 0.5, dir: 1, move: 'walk', performT: 0, performDur: 0.5 });
    drawShowMonster(ctx, { x: 600, y: 440, species: 'frog', level: 0, rage: 58, redLow: 80, marks: 0, mode: 'roam', fx: 'none', dir: -1, move: 'walk' });
    drawCardFx(ctx, { x: 300, y: 340, card: 'provoke', t: 0.25, dur: 0.8 });
    for (var m = 0; m < 6; m++) {
      drawTimelineSlot(ctx, { x: 75 + 141 * m, y: 691, style: 'mini', slot: m, card: m === 1 ? 'provoke' : m === 3 ? 'chill' : '', target: m === 1 ? 'spore' : m === 3 ? 'frog' : '', selected: false, active: m === 1, done: m === 0 });
    }
    ctx.restore(); frame(ctx, 758, 104, 820 * k2, 580 * k2);
  }
  function guide4(ctx) {
    rr(ctx, 0, 0, VW, 230, 14); ctx.fillStyle = PAL.stage; ctx.fill(); frame(ctx, 0, 0, VW, 230);
    drawShowMonster(ctx, { x: 600, y: 140, species: 'spore', level: 0, rage: 88, redLow: 80, marks: 0, mode: 'roam', performing: true, performT: 0.2, performDur: 0.5, fx: 'none', dir: 1, move: 'walk' });
    drawFloatText(ctx, { x: 740, y: 96, text: '+6 ×2', kind: 'redGold', t: 0.2, dur: 1 });
    rr(ctx, 0, 250, VW, 270, 14); ctx.fillStyle = PAL.stage; ctx.fill();
    ctx.fillStyle = PAL.stands; ctx.fillRect(700, 250, 500, 90);
    drawVisitor(ctx, { x: 820, y: 292, side: 'top', mode: 'watch' });
    drawVisitor(ctx, { x: 956, y: 292, side: 'top', mode: 'watch' });
    drawFence(ctx, { x: 820, y: 344, side: 'top', broken: false });
    drawFence(ctx, { x: 956, y: 344, side: 'top', broken: false });
    drawShowMonster(ctx, { x: 300, y: 420, species: 'spore', level: 0, rage: 100, redLow: 80, marks: 4, markLeft: 2.5, markDur: 4, mode: 'roam', fx: 'none', dir: 1, move: 'walk' });
    arrow(ctx, 400, 420, 680, 430, { color: '#ffffff', lw: 5 });
    drawShowMonster(ctx, { x: 820, y: 432, species: 'spore', level: 0, rage: 100, redLow: 80, marks: 0, mode: 'charge', chargeT: 0.4, chargeDur: 1.5, fx: 'none', dir: 1, move: 'walk' });
    cross(ctx, 1080, 410, 64);
    frame(ctx, 0, 250, VW, 270);
  }
  function guide5(ctx) {
    var cx = 520, cy = 262, rx = 330, ry = 175;
    var nodes = [['地下城', 0], ['布置', 1], ['表演', 2], ['商店', 3]];
    var pos = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
    for (var i = 0; i < 4; i++) {
      var a0 = -Math.PI / 2 + i * Math.PI / 2 + 0.38, a1 = -Math.PI / 2 + (i + 1) * Math.PI / 2 - 0.38;
      var am = (a0 + a1) / 2;
      arrow(ctx, cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry, cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry,
        { cx: cx + Math.cos(am) * rx * 1.22, cy: cy + Math.sin(am) * ry * 1.22, color: '#cfc8e6', lw: 5 });
    }
    nodes.forEach(function (n, i) {
      var p = pos[i];
      rr(ctx, p[0] - 84, p[1] - 46, 168, 92, 16); ctx.fillStyle = i === 2 ? '#3d3366' : PAL.panel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = i === 2 ? PAL.gold : PAL.line; ctx.stroke();
      if (i === 0) drawTamer(ctx, { x: p[0] - 42, y: p[1], facing: 2, weapon: 'club' });
      else if (i === 1) cardIcon(ctx, 'provoke', p[0] - 42, p[1], 22);
      else if (i === 2) head(ctx, 'spore', p[0] - 42, p[1], 64);
      else coin(ctx, p[0] - 42, p[1], 20);
      label(ctx, n[0], p[0] + 26, p[1]);
    });
    txt(ctx, '×7 天', cx, cy, { size: 46, color: PAL.gold });
    // 表演 → 名聲往上加
    for (var s2 = 0; s2 < 3; s2++) repStar(ctx, cx + 118 + s2 * 18, cy + ry - 20 - s2 * 26, 11 - s2);
    // 第 7 天 → 結算星數
    arrow(ctx, cx + 92, cy + ry + 10, 920, cy + ry + 10, { color: PAL.gold, lw: 4, dash: [10, 7] });
    rr(ctx, 930, 360, 250, 134, 16); ctx.fillStyle = 'rgba(24,18,44,0.97)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.gold; ctx.stroke();
    label(ctx, '結算', 1055, 386, PAL.text);
    for (var k = 0; k < 3; k++) { starPath(ctx, 990 + k * 65, 446, 28, 12); ctx.fillStyle = k < 2 ? PAL.gold : '#3a3354'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.outline; ctx.stroke(); }
  }
  var GUIDES = [guide1, guide2, guide3, guide4, guide5];
  function drawGuidePage(ctx, s) {
    s = st(s); var page = clamp(Math.round(N(s.page)), 0, GUIDES.length - 1);
    var x = N(s.x), y = N(s.y), w = Math.max(1, N(s.w, VW)), h = Math.max(1, N(s.h, VH));
    var k = Math.min(w / VW, h / VH);
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.translate(x + (w - VW * k) / 2, y + (h - VH * k) / 2); ctx.scale(k, k);
    rr(ctx, 0, 0, VW, VH, 14); ctx.fillStyle = '#100c1e'; ctx.fill();
    GUIDES[page](ctx);
    ctx.restore();
  }

  window.Art = {
    canvas: { width: W, height: H },
    palette: PAL,
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
    drawTimelineSlot: drawTimelineSlot,
    drawPickerPanel: drawPickerPanel,
    drawSetupInfo: drawSetupInfo,
    drawCardFx: drawCardFx,
    drawStageDevice: drawStageDevice,
    drawDeviceFx: drawDeviceFx,
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
