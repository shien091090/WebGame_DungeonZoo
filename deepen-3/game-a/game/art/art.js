/* 踩點地板秀 — 美術(Canvas 2D 幾何繪製, 無外部資源)
 * 全域 window.Art; 函式名 / 參數 / state 欄位照 interface.json。
 * 每個函式自己 save / restore。表外值一律正規化成預設(見 style.md)。
 */
(function () {
  'use strict';

  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC","Heiti TC",sans-serif';

  // ---------- 正規化小工具 ----------
  function N(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; }
  function C01(v) { v = N(v, 0); return v < 0 ? 0 : (v > 1 ? 1 : v); }
  function S(v, d) { if (typeof v === 'string') return v; if (v == null) return d || ''; return String(v); }
  function O(s) { return (s && typeof s === 'object') ? s : {}; }
  function E(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function ratio(t, dur) { dur = N(dur, 0); if (dur <= 0) return 0; return C01(N(t, 0) / dur); }
  function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }

  var SPECIES = ['fire', 'water', 'thunder', 'spike', 'stone', 'ghost'];
  function sp(v) { return E(v, SPECIES, 'fire'); }

  // ---------- 色票 ----------
  var P = {
    bg: '#17131f',
    ink: '#120e16',          // 生物外描
    text: '#ffffff',
    textDim: '#b9b0c8',
    panel: '#2a2336',
    panelHi: '#3a3150',
    select: '#ffffff',       // 選擇框 / 游標
    you: '#ff4fd8',          // 玩家這一方: 馴獸師披風、打回的投射物、捕捉 / 套索、武器技
    gold: '#ffd84a',
    rep: '#ffe9a6',
    rule: '#ff2f5a',         // 規則紅: 紅區、失控標記(只出現在線與記號)
    ignite: '#ffa424',       // 升怒回饋(往上竄)
    douse: '#8fdcff',        // 降怒回饋(往下滴)
    ok: '#7dff8a',
    bad: '#ff6b6b',
    // 種類色(本體 + 牠的技能)
    fire: '#e8432e', water: '#38c8e8', thunder: '#f2d61c', spike: '#4cb84a', stone: '#9a9aa6', ghost: '#8a6cf0',
    // 地板
    chili: '#5a2620', ice: '#2c5a74', spring: '#1f5550', stage: '#5a4024',
    arena: '#3e3328', stand: '#2b2230'
  };
  var SP = {
    fire:    { name: '火蜥蜴', c: P.fire,    d: '#7a1d12', l: '#ff9a7a' },
    water:   { name: '水母',   c: P.water,   d: '#136a80', l: '#b8f2ff' },
    thunder: { name: '雷鳥',   c: P.thunder, d: '#8a7408', l: '#fff6b0' },
    spike:   { name: '刺蝟',   c: P.spike,   d: '#1f5a1e', l: '#b6f0a8' },
    stone:   { name: '石像鬼', c: P.stone,   d: '#4a4a56', l: '#d8d8e0' },
    ghost:   { name: '幽靈',   c: P.ghost,   d: '#3e2a8a', l: '#cfc2ff' }
  };
  var DUNGEON = {
    cave:  { name: '濕熱洞窟', mons: ['fire', 'water'],   floor: '#3a2e28', floor2: '#43352d', hall: '#4a3c32', wall: '#6a3e2a', wallTop: '#8a5536', accent: '#ff7a3a' },
    cliff: { name: '雷鳴崖',   mons: ['thunder', 'spike'], floor: '#2c3340', floor2: '#323a48', hall: '#3a4252', wall: '#4a5568', wallTop: '#66748a', accent: '#a8c8ff' },
    ruins: { name: '古代遺跡', mons: ['stone', 'ghost'],   floor: '#36352a', floor2: '#3d3c30', hall: '#46443a', wall: '#6a6248', wallTop: '#8c8460', accent: '#d8c890' }
  };
  function dg(v) { return E(v, ['cave', 'cliff', 'ruins'], 'cave'); }
  var FLOOR = {
    chili:  { name: '辣椒田',   base: P.chili },
    ice:    { name: '冰池',     base: P.ice },
    spring: { name: '彈跳板',   base: P.spring },
    stage:  { name: '聚光舞台', base: P.stage }
  };
  var WEAPON = { club: '棍棒', sword: '劍', spear: '長槍', whip: '長鞭' };
  function wp(v) { return E(v, ['club', 'sword', 'spear', 'whip'], 'club'); }

  // ---------- 繪圖小工具 ----------
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
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); }
  function text(ctx, str, x, y, o) {
    o = o || {};
    var size = o.size || 18;
    ctx.font = (o.bold === false ? '' : 'bold ') + size + 'px ' + FONT;
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.base || 'middle';
    str = S(str, '');
    if (o.stroke !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = o.sw || Math.max(3, size / 5);
      ctx.strokeStyle = o.stroke || 'rgba(10,6,14,0.9)';
      if (o.max) ctx.strokeText(str, x, y, o.max); else ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = o.color || P.text;
    if (o.max) ctx.fillText(str, x, y, o.max); else ctx.fillText(str, x, y);
  }
  function star(ctx, x, y, r, pts) {
    pts = pts || 5;
    ctx.beginPath();
    for (var i = 0; i < pts * 2; i++) {
      var a = -Math.PI / 2 + i * Math.PI / pts;
      var rad = (i % 2 === 0) ? r : r * 0.45;
      var px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  function heart(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s * 0.9, y - s * 0.25, x - s * 0.45, y - s * 0.85, x, y - s * 0.38);
    ctx.bezierCurveTo(x + s * 0.45, y - s * 0.85, x + s * 0.9, y - s * 0.25, x, y + s * 0.35);
    ctx.closePath();
  }
  function coin(ctx, x, y, r) {
    circle(ctx, x, y, r); ctx.fillStyle = P.gold; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#8a6a10'; ctx.stroke();
    circle(ctx, x, y, r * 0.55); ctx.strokeStyle = '#b8901a'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  // 圓頭箭頭(功能性方向記號, 避開「一排朝上的尖」)
  function roundArrow(ctx, x1, y1, x2, y2, color, w) {
    var a = Math.atan2(y2 - y1, x2 - x1), h = w * 2.6;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = color; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2 - Math.cos(a - 0.6) * h, y2 - Math.sin(a - 0.6) * h);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a + 0.6) * h, y2 - Math.sin(a + 0.6) * h);
    ctx.stroke();
    ctx.restore();
  }
  function keycap(ctx, x, y, label, w) {
    w = w || 40;
    ctx.save();
    rr(ctx, x - w / 2, y - 18, w, 36, 7);
    ctx.fillStyle = '#f2eef8'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#4a4058'; ctx.stroke();
    rr(ctx, x - w / 2 + 3, y + 10, w - 6, 5, 2); ctx.fillStyle = '#cfc6dc'; ctx.fill();
    text(ctx, label, x, y - 1, { size: 18, color: '#2a2236', stroke: false });
    ctx.restore();
  }

  // ---------- 生物本體(遊戲內唯一畫法; 野生、表演場、卡片、說明頁共用) ----------
  // 原點為身體中心, r 為身體半徑; o: { dir, hit, angry, squash }
  function eye(ctx, x, y, r, dir, angry) {
    circle(ctx, x, y, r); ctx.fillStyle = '#ffffff'; ctx.fill();
    circle(ctx, x + dir * r * 0.35, y + r * 0.1, r * 0.55); ctx.fillStyle = '#120e16'; ctx.fill();
    if (angry) {
      ctx.beginPath(); ctx.moveTo(x - r * 1.2, y - r * 1.5 - dir * r * 0.4); ctx.lineTo(x + r * 1.2, y - r * 1.5 + dir * r * 0.4);
      ctx.lineWidth = Math.max(2, r * 0.5); ctx.strokeStyle = '#120e16'; ctx.lineCap = 'round'; ctx.stroke();
    }
  }
  function creature(ctx, species, r, o) {
    o = o || {};
    var k = SP[sp(species)], s = sp(species);
    var dir = (o.dir === -1) ? -1 : 1;
    ctx.save();
    if (o.squash) ctx.scale(1 + o.squash, 1 - o.squash);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(2, r * 0.1);
    ctx.strokeStyle = P.ink;
    ctx.save();
    ctx.scale(dir, 1);
    var bodyPath;
    if (s === 'fire') {
      // 尾巴
      ctx.beginPath(); ctx.moveTo(-r * 0.6, r * 0.1);
      ctx.quadraticCurveTo(-r * 1.0, r * 0.55, -r * 0.95, -r * 0.1);
      ctx.lineWidth = r * 0.28; ctx.strokeStyle = P.ink; ctx.stroke();
      ctx.lineWidth = r * 0.16; ctx.strokeStyle = k.c; ctx.stroke();
      ctx.lineWidth = Math.max(2, r * 0.1); ctx.strokeStyle = P.ink;
      // 背上火冠(圓頭三瓣)
      for (var i = 0; i < 3; i++) {
        circle(ctx, -r * 0.35 + i * r * 0.3, -r * 0.5, r * 0.17); ctx.fillStyle = '#ffb030'; ctx.fill(); ctx.stroke();
      }
      bodyPath = function () { ctx.beginPath(); ctx.ellipse(-r * 0.1, r * 0.05, r * 0.72, r * 0.52, 0, 0, Math.PI * 2); };
      bodyPath(); ctx.fillStyle = k.c; ctx.fill(); ctx.stroke();
      circle(ctx, r * 0.5, -r * 0.12, r * 0.4); ctx.fillStyle = k.c; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-r * 0.1, r * 0.25, r * 0.45, r * 0.2, 0, 0, Math.PI * 2); ctx.fillStyle = k.l; ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;
      // 腳
      ctx.fillStyle = k.d;
      circle(ctx, -r * 0.45, r * 0.55, r * 0.13); ctx.fill(); circle(ctx, r * 0.25, r * 0.55, r * 0.13); ctx.fill();
      eye(ctx, r * 0.6, -r * 0.22, r * 0.14, 1, o.angry);
    } else if (s === 'water') {
      // 觸手
      ctx.lineWidth = r * 0.12;
      for (var t = 0; t < 4; t++) {
        var tx = -r * 0.5 + t * r * 0.33;
        ctx.beginPath(); ctx.moveTo(tx, r * 0.1);
        ctx.quadraticCurveTo(tx + r * 0.18, r * 0.5, tx, r * 0.92);
        ctx.strokeStyle = P.ink; ctx.lineWidth = r * 0.2; ctx.stroke();
        ctx.strokeStyle = k.l; ctx.lineWidth = r * 0.1; ctx.stroke();
      }
      ctx.lineWidth = Math.max(2, r * 0.1); ctx.strokeStyle = P.ink;
      bodyPath = function () {
        ctx.beginPath();
        ctx.moveTo(-r * 0.85, r * 0.15);
        ctx.bezierCurveTo(-r * 0.95, -r * 0.95, r * 0.95, -r * 0.95, r * 0.85, r * 0.15);
        ctx.quadraticCurveTo(r * 0.6, r * 0.32, r * 0.42, r * 0.18);
        ctx.quadraticCurveTo(r * 0.2, r * 0.34, 0, r * 0.18);
        ctx.quadraticCurveTo(-r * 0.2, r * 0.34, -r * 0.42, r * 0.18);
        ctx.quadraticCurveTo(-r * 0.6, r * 0.32, -r * 0.85, r * 0.15);
        ctx.closePath();
      };
      bodyPath(); ctx.fillStyle = k.c; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.45, r * 0.22, r * 0.12, -0.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
      eye(ctx, -r * 0.05, -r * 0.15, r * 0.14, 1, o.angry); eye(ctx, r * 0.35, -r * 0.15, r * 0.14, 1, o.angry);
    } else if (s === 'thunder') {
      // 翅膀(圓角)
      ctx.fillStyle = k.d;
      ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.1); ctx.quadraticCurveTo(-r * 1.0, -r * 0.75, -r * 0.95, r * 0.2); ctx.quadraticCurveTo(-r * 0.6, r * 0.1, -r * 0.2, r * 0.25); ctx.closePath(); ctx.fill(); ctx.stroke();
      bodyPath = function () { circle(ctx, 0, r * 0.08, r * 0.7); };
      bodyPath(); ctx.fillStyle = k.c; ctx.fill(); ctx.stroke();
      // 頭冠
      ctx.beginPath(); ctx.moveTo(-r * 0.05, -r * 0.55); ctx.lineTo(r * 0.12, -r * 0.92); ctx.lineTo(r * 0.2, -r * 0.6); ctx.lineTo(r * 0.38, -r * 0.82); ctx.lineTo(r * 0.35, -r * 0.5); ctx.closePath();
      ctx.fillStyle = k.c; ctx.fill(); ctx.stroke();
      // 嘴
      ctx.beginPath(); ctx.moveTo(r * 0.6, -r * 0.05); ctx.lineTo(r * 0.98, r * 0.08); ctx.lineTo(r * 0.6, r * 0.22); ctx.closePath(); ctx.fillStyle = '#ff9a2a'; ctx.fill(); ctx.stroke();
      // 前翅
      ctx.beginPath(); ctx.moveTo(-r * 0.1, r * 0.05); ctx.quadraticCurveTo(-r * 0.3, r * 0.6, r * 0.25, r * 0.45); ctx.quadraticCurveTo(r * 0.05, r * 0.2, -r * 0.1, r * 0.05); ctx.fillStyle = k.l; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff9a2a'; circle(ctx, -r * 0.15, r * 0.78, r * 0.1); ctx.fill(); circle(ctx, r * 0.15, r * 0.78, r * 0.1); ctx.fill();
      eye(ctx, r * 0.32, -r * 0.15, r * 0.15, 1, o.angry);
    } else if (s === 'spike') {
      ctx.fillStyle = k.d;
      ctx.beginPath();
      var n = 14;
      for (var q = 0; q <= n; q++) {
        var a = Math.PI * 0.95 + q * (Math.PI * 1.1 / n);
        var rad = (q % 2 === 0) ? r * 0.98 : r * 0.68;
        var px = Math.cos(a) * rad, py = Math.sin(a) * rad * 0.95 + r * 0.05;
        if (q === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.lineTo(r * 0.5, r * 0.6); ctx.lineTo(-r * 0.7, r * 0.6); ctx.closePath();
      ctx.fill(); ctx.stroke();
      bodyPath = function () { ctx.beginPath(); ctx.ellipse(0, r * 0.12, r * 0.7, r * 0.55, 0, 0, Math.PI * 2); };
      bodyPath(); ctx.fillStyle = k.c; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(r * 0.42, r * 0.22, r * 0.38, r * 0.3, 0, 0, Math.PI * 2); ctx.fillStyle = '#e8d4a8'; ctx.fill(); ctx.stroke();
      circle(ctx, r * 0.8, r * 0.22, r * 0.08); ctx.fillStyle = P.ink; ctx.fill();
      eye(ctx, r * 0.35, r * 0.0, r * 0.12, 1, o.angry);
    } else if (s === 'stone') {
      // 角
      ctx.fillStyle = k.d;
      ctx.beginPath(); ctx.moveTo(-r * 0.55, -r * 0.55); ctx.lineTo(-r * 0.75, -r * 0.98); ctx.lineTo(-r * 0.25, -r * 0.68); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r * 0.55, -r * 0.55); ctx.lineTo(r * 0.75, -r * 0.98); ctx.lineTo(r * 0.25, -r * 0.68); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 翼
      ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.2); ctx.quadraticCurveTo(-r * 1.0, -r * 0.4, -r * 0.98, r * 0.2); ctx.quadraticCurveTo(-r * 0.85, r * 0.1, -r * 0.7, r * 0.25); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r * 0.7, -r * 0.2); ctx.quadraticCurveTo(r * 1.0, -r * 0.4, r * 0.98, r * 0.2); ctx.quadraticCurveTo(r * 0.85, r * 0.1, r * 0.7, r * 0.25); ctx.closePath(); ctx.fill(); ctx.stroke();
      bodyPath = function () { rr(ctx, -r * 0.72, -r * 0.7, r * 1.44, r * 1.5, r * 0.28); };
      bodyPath(); ctx.fillStyle = k.c; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.3, r * 0.2); ctx.lineTo(-r * 0.1, r * 0.4); ctx.lineTo(-r * 0.25, r * 0.6);
      ctx.lineWidth = Math.max(1.5, r * 0.05); ctx.strokeStyle = k.d; ctx.stroke();
      ctx.lineWidth = Math.max(2, r * 0.1); ctx.strokeStyle = P.ink;
      rr(ctx, -r * 0.5, -r * 0.35, r * 1.0, r * 0.32, r * 0.1); ctx.fillStyle = k.d; ctx.fill();
      // 石像鬼眼睛: 方形發亮
      ctx.fillStyle = o.angry ? '#ff5a5a' : '#ffe9a0';
      ctx.fillRect(-r * 0.4, -r * 0.28, r * 0.25, r * 0.18); ctx.fillRect(r * 0.15, -r * 0.28, r * 0.25, r * 0.18);
    } else { // ghost
      bodyPath = function () {
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, r * 0.75);
        ctx.lineTo(-r * 0.7, -r * 0.1);
        ctx.arc(0, -r * 0.1, r * 0.7, Math.PI, 0);
        ctx.lineTo(r * 0.7, r * 0.75);
        ctx.quadraticCurveTo(r * 0.52, r * 0.55, r * 0.35, r * 0.78);
        ctx.quadraticCurveTo(r * 0.18, r * 0.55, 0, r * 0.78);
        ctx.quadraticCurveTo(-r * 0.18, r * 0.55, -r * 0.35, r * 0.78);
        ctx.quadraticCurveTo(-r * 0.52, r * 0.55, -r * 0.7, r * 0.75);
        ctx.closePath();
      };
      bodyPath(); ctx.fillStyle = k.c; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.45, r * 0.18, r * 0.1, -0.6, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
      ctx.fillStyle = P.ink;
      ctx.beginPath(); ctx.ellipse(r * 0.0, -r * 0.12, r * 0.11, r * 0.18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(r * 0.35, -r * 0.12, r * 0.11, r * 0.18, 0, 0, Math.PI * 2); ctx.fill();
      if (o.angry) {
        ctx.beginPath(); ctx.moveTo(-r * 0.12, -r * 0.42); ctx.lineTo(r * 0.12, -r * 0.32); ctx.moveTo(r * 0.47, -r * 0.42); ctx.lineTo(r * 0.23, -r * 0.32);
        ctx.lineWidth = r * 0.08; ctx.stroke();
      }
    }
    // 受擊閃白: 疊在身體形狀上
    if (o.hit) {
      ctx.globalAlpha = 0.85; bodyPath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.globalAlpha = 1;
    }
    if (o.redTint) {
      ctx.globalAlpha = o.redTint; bodyPath(); ctx.fillStyle = P.rule; ctx.fill(); ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.restore();
  }
  function shadow(ctx, x, y, rx, ry, a) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,' + (a == null ? 0.35 : a) + ')'; ctx.fill();
  }

  // ---------- 武器小圖 ----------
  function weaponGlyph(ctx, w, x, y, s, ang) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(N(ang, 0));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (w === 'club') {
      ctx.lineWidth = s * 0.16; ctx.strokeStyle = P.ink;
      ctx.beginPath(); ctx.moveTo(-s * 0.4, 0); ctx.lineTo(s * 0.2, 0); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(s * 0.28, 0, s * 0.24, s * 0.16, 0, 0, Math.PI * 2); ctx.fillStyle = '#a0683a'; ctx.fill();
      ctx.lineWidth = 2; ctx.stroke();
      ctx.lineWidth = s * 0.09; ctx.strokeStyle = '#c08850'; ctx.beginPath(); ctx.moveTo(-s * 0.4, 0); ctx.lineTo(s * 0.1, 0); ctx.stroke();
    } else if (w === 'sword') {
      ctx.lineWidth = s * 0.15; ctx.strokeStyle = P.ink;
      ctx.beginPath(); ctx.moveTo(-s * 0.4, 0); ctx.lineTo(s * 0.48, 0); ctx.stroke();
      ctx.lineWidth = s * 0.08; ctx.strokeStyle = '#e8f0ff'; ctx.beginPath(); ctx.moveTo(-s * 0.15, 0); ctx.lineTo(s * 0.46, 0); ctx.stroke();
      ctx.lineWidth = s * 0.08; ctx.strokeStyle = '#d8a030'; ctx.beginPath(); ctx.moveTo(-s * 0.18, -s * 0.16); ctx.lineTo(-s * 0.18, s * 0.16); ctx.stroke();
    } else if (w === 'spear') {
      ctx.lineWidth = s * 0.12; ctx.strokeStyle = P.ink;
      ctx.beginPath(); ctx.moveTo(-s * 0.48, 0); ctx.lineTo(s * 0.3, 0); ctx.stroke();
      ctx.lineWidth = s * 0.06; ctx.strokeStyle = '#b07840'; ctx.beginPath(); ctx.moveTo(-s * 0.46, 0); ctx.lineTo(s * 0.3, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.5, 0); ctx.lineTo(s * 0.26, -s * 0.11); ctx.lineTo(s * 0.26, s * 0.11); ctx.closePath();
      ctx.fillStyle = '#e8f0ff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
    } else {
      ctx.lineWidth = s * 0.14; ctx.strokeStyle = P.ink;
      ctx.beginPath(); ctx.moveTo(-s * 0.4, 0); ctx.lineTo(-s * 0.15, 0); ctx.stroke();
      ctx.lineWidth = s * 0.07; ctx.strokeStyle = '#7a4a2a';
      ctx.beginPath(); ctx.moveTo(-s * 0.15, 0); ctx.bezierCurveTo(s * 0.2, -s * 0.4, s * 0.3, s * 0.35, s * 0.46, -s * 0.1); ctx.stroke();
      ctx.lineWidth = s * 0.09; ctx.strokeStyle = '#c08850'; ctx.beginPath(); ctx.moveTo(-s * 0.4, 0); ctx.lineTo(-s * 0.16, 0); ctx.stroke();
    }
    ctx.restore();
  }

  // ================= 匯出函式 =================

  function drawBackground(ctx) {
    ctx.save();
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, 720, 1280);
    ctx.restore();
  }

  // ---- 地下城地圖格 60×60 ----
  function drawTile(ctx, state) {
    var s = O(state), x = N(s.x, 0), y = N(s.y, 0);
    var d = DUNGEON[dg(s.dungeon)];
    var kind = E(s.kind, ['wall', 'pillar', 'floor', 'lava', 'water'], 'floor');
    var room = E(s.room, ['top', 'bottom', 'hall'], 'hall');
    var L = x - 30, T = y - 30;
    ctx.save();
    // 地面底
    var base = room === 'hall' ? d.hall : (((Math.floor(x / 60) + Math.floor(y / 60)) % 2 === 0) ? d.floor : d.floor2);
    ctx.fillStyle = base; ctx.fillRect(L, T, 60, 60);
    if (kind === 'floor') {
      if (room === 'hall') {
        // 走道: 斜紋鋪石, 與房間地面分得開
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(L, T + 30); ctx.lineTo(L + 30, T); ctx.moveTo(L + 30, T + 60); ctx.lineTo(L + 60, T + 30); ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        circle(ctx, L + 16, T + 20, 3); ctx.fill(); circle(ctx, L + 42, T + 44, 2.5); ctx.fill();
      }
      if (s.nest === true) {
        // 巢穴: 稻草圈 + 小石
        ctx.beginPath(); ctx.ellipse(x, y + 6, 24, 15, 0, 0, Math.PI * 2);
        ctx.lineWidth = 7; ctx.strokeStyle = '#7a6236'; ctx.stroke();
        ctx.lineWidth = 3; ctx.strokeStyle = '#c4a45e'; ctx.stroke();
        ctx.fillStyle = '#b8b0a0';
        circle(ctx, x - 20, y - 4, 3); ctx.fill(); circle(ctx, x + 22, y + 14, 3); ctx.fill(); circle(ctx, x + 4, y + 22, 2.5); ctx.fill();
      }
    } else if (kind === 'wall') {
      ctx.fillStyle = d.wall; ctx.fillRect(L, T, 60, 60);
      ctx.fillStyle = d.wallTop; ctx.fillRect(L, T, 60, 14);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(L, T + 37); ctx.lineTo(L + 60, T + 37); ctx.moveTo(L + 30, T + 14); ctx.lineTo(L + 30, T + 37); ctx.moveTo(L + 15, T + 37); ctx.lineTo(L + 15, T + 60); ctx.moveTo(L + 45, T + 37); ctx.lineTo(L + 45, T + 60); ctx.stroke();
    } else if (kind === 'pillar') {
      shadow(ctx, x + 4, y + 8, 26, 20, 0.4);
      circle(ctx, x, y + 4, 27); ctx.fillStyle = d.wall; ctx.fill();
      circle(ctx, x, y - 2, 24); ctx.fillStyle = d.wallTop; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.stroke();
      circle(ctx, x, y - 2, 13); ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2; ctx.stroke();
    } else if (kind === 'lava') {
      ctx.fillStyle = '#8a1e08'; ctx.fillRect(L, T, 60, 60);
      ctx.fillStyle = '#ff5a12'; rr(ctx, L + 3, T + 3, 54, 54, 10); ctx.fill();
      ctx.strokeStyle = '#ffd04a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(L + 10, T + 18); ctx.lineTo(L + 26, T + 26); ctx.lineTo(L + 22, T + 40); ctx.moveTo(L + 38, T + 10); ctx.lineTo(L + 44, T + 30); ctx.lineTo(L + 52, T + 36); ctx.moveTo(L + 30, T + 48); ctx.lineTo(L + 44, T + 50); ctx.stroke();
      // 危險外框: 深色鋸齒邊(熔岩 = 碰到就扣心)
      ctx.strokeStyle = 'rgba(40,0,0,0.75)'; ctx.lineWidth = 3; ctx.strokeRect(L + 1.5, T + 1.5, 57, 57);
    } else if (kind === 'water') {
      ctx.fillStyle = '#163e6a'; ctx.fillRect(L, T, 60, 60);
      ctx.strokeStyle = 'rgba(140,200,255,0.55)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (var i = 0; i < 3; i++) {
        var wy = T + 14 + i * 16;
        ctx.beginPath(); ctx.moveTo(L + 8, wy); ctx.quadraticCurveTo(L + 18, wy - 6, L + 28, wy); ctx.quadraticCurveTo(L + 38, wy + 6, L + 50, wy); ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---- 馴獸師 64×64 ----
  var FACING_ANG = [-Math.PI / 2, -Math.PI / 4, 0, Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4, Math.PI, -Math.PI * 3 / 4];
  function drawTamer(ctx, state) {
    var s = O(state), x = N(s.x, 0), y = N(s.y, 0);
    var f = Math.round(N(s.facing, 0)); f = ((f % 8) + 8) % 8;
    var ang = FACING_ANG[f];
    var w = wp(s.weapon);
    ctx.save();
    ctx.translate(x, y);
    if (s.blink === true) {
      ctx.globalAlpha = (Math.floor(now() / 90) % 2 === 0) ? 0.3 : 0.85;
    }
    if (s.dashing === true) {
      // 突進殘影(往後拖)
      for (var i = 2; i >= 1; i--) {
        var bx = -Math.cos(ang) * 6 * i, by = -Math.sin(ang) * 6 * i;
        circle(ctx, bx, by, 17); ctx.fillStyle = 'rgba(255,79,216,' + (0.18 * (3 - i)) + ')'; ctx.fill();
      }
    }
    shadow(ctx, 0, 14, 16, 6, 0.35);
    // 後手武器在背面(朝上時)
    var wx = Math.cos(ang) * 13, wy = Math.sin(ang) * 13 + 1;
    var back = Math.sin(ang) < -0.2;
    if (back) weaponGlyph(ctx, w, wx, wy, 26, ang);
    // 身體: 判定半徑 18 的圓
    circle(ctx, 0, 0, 18); ctx.fillStyle = '#f4e4cc'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = P.ink; ctx.stroke();
    // 帽子 + 披風色(玩家色)
    ctx.beginPath(); ctx.arc(0, -2, 18, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fillStyle = P.you; ctx.fill(); ctx.stroke();
    // 臉朝面向
    var fx = Math.cos(ang) * 7, fy = Math.sin(ang) * 5 + 3;
    if (Math.sin(ang) > -0.9) {
      ctx.fillStyle = P.ink;
      circle(ctx, fx - 4, fy, 2.4); ctx.fill(); circle(ctx, fx + 4, fy, 2.4); ctx.fill();
    }
    // 面向小三角(貼身體外緣, 圓頭)
    ctx.save(); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(22, -5); ctx.lineTo(28, 0); ctx.lineTo(22, 5); ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
    ctx.restore();
    if (!back) weaponGlyph(ctx, w, wx, wy, 26, ang);
    if (s.lassoing === true) {
      // 腰間繩圈
      ctx.beginPath(); ctx.ellipse(-12, 10, 7, 5, 0, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = '#e8c890'; ctx.stroke();
    }
    if (s.dashing === true) {
      circle(ctx, 0, 0, 21); ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    }
    ctx.restore();
  }

  // ---- 野生魔物 90×90(石像鬼 110×110) ----
  function stunStars(ctx, x, y, r, frac) {
    var n = 3, t = now() / 600;
    for (var i = 0; i < n; i++) {
      var a = t + i * Math.PI * 2 / n;
      var sx = x + Math.cos(a) * r, sy = y + Math.sin(a) * r * 0.35;
      ctx.globalAlpha = (i / n < frac + 0.01) ? 1 : 0.25;
      star(ctx, sx, sy, 6); ctx.fillStyle = '#fff4a0'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = P.ink; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function drawWildMonster(ctx, state) {
    var s = O(state), x = N(s.x, 0), y = N(s.y, 0), spc = sp(s.species);
    var half = spc === 'stone' ? 55 : 45;
    var R = spc === 'stone' ? 38 : 30;
    var dir = N(s.dir, 1) < 0 ? -1 : 1;
    var hp = Math.max(0, N(s.hp, 1)), maxHp = Math.max(1, N(s.maxHp, 1));
    var stunLeft = Math.max(0, N(s.stunLeft, 0)), stunDur = Math.max(0.01, N(s.stunDur, 2));
    var stunned = stunLeft > 0 || s.lassoed === true;
    ctx.save();
    var by = y + 6;
    shadow(ctx, x, y + half - 8, R * 0.9, 6, 0.35);
    if (s.casting === true && !stunned) {
      // 施法預備: 種類色虛線環在身邊轉
      ctx.save();
      ctx.setLineDash([8, 6]); ctx.lineDashOffset = -now() / 30;
      circle(ctx, x, by, R + 6); ctx.lineWidth = 4; ctx.strokeStyle = SP[spc].c; ctx.stroke();
      ctx.restore();
    }
    if (s.dashing === true) {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (var i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(x - dir * (R + 2), by + i * 12); ctx.lineTo(x - dir * (half - 2), by + i * 12); ctx.stroke();
      }
    }
    ctx.save(); ctx.translate(x, by);
    creature(ctx, spc, R, { dir: dir, hit: s.hit === true, squash: s.weak === true ? 0.06 : 0 });
    ctx.restore();
    if (s.lassoed === true) {
      ctx.beginPath(); ctx.ellipse(x, by + R * 0.2, R * 0.95, R * 0.35, 0, 0, Math.PI * 2);
      ctx.lineWidth = 6; ctx.strokeStyle = P.ink; ctx.stroke();
      ctx.lineWidth = 3.5; ctx.strokeStyle = '#e8c890'; ctx.stroke();
    }
    // 血條(頂端)
    var bw = 60, bx = x - bw / 2, bT = y - half + 1;
    rr(ctx, bx - 2, bT - 1, bw + 4, 9, 3); ctx.fillStyle = 'rgba(10,6,14,0.85)'; ctx.fill();
    var hr = C01(hp / maxHp);
    ctx.fillStyle = s.weak === true ? '#ff7a5a' : '#8cf07a';
    ctx.fillRect(bx, bT + 1, bw * hr, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(bx + bw * 0.3 - 1, bT, 2, 7);
    if (s.weak === true) {
      // 虛弱記號: 頭旁兩顆汗滴 + 血條閃
      var dx = x + dir * (R * 0.75), dy = by - R * 0.7;
      for (var k = 0; k < 2; k++) {
        var sx = dx + dir * k * 9, sy = dy + k * 9;
        ctx.beginPath(); ctx.moveTo(sx, sy - 7); ctx.quadraticCurveTo(sx + 5, sy, sx, sy + 4); ctx.quadraticCurveTo(sx - 5, sy, sx, sy - 7);
        ctx.fillStyle = '#d8f4ff'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = P.ink; ctx.stroke();
      }
    }
    if (stunned) {
      var frac = s.lassoed === true ? 1 : C01(stunLeft / stunDur);
      stunStars(ctx, x, y - half + 22, R * 0.75, frac);
    }
    ctx.restore();
  }

  // ---- 準備捕捉 120×120 ----
  function drawCaptureRing(ctx, state) {
    var s = O(state), x = N(s.x, 0), y = N(s.y, 0);
    var p = ratio(s.t, s.dur);
    ctx.save();
    circle(ctx, x, y + 4, 42); ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(10,6,14,0.75)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y + 4, 42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
    ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = P.you; ctx.stroke();
    text(ctx, '準備捕捉', x, y - 50, { size: 16, color: '#ffffff', stroke: P.you, sw: 4 });
    ctx.restore();
  }

  // ---- 套索 ----
  function drawLasso(ctx, state) {
    var s = O(state);
    var x1 = N(s.x1, 0), y1 = N(s.y1, 0), x2 = N(s.x2, 0), y2 = N(s.y2, 0);
    var prog = C01(s.progress);
    var limit = Math.max(0.01, N(s.limit, 5)), t = Math.max(0, N(s.t, 0));
    var k = C01(N(s.len, 0) / Math.max(1, N(s.maxLen, 220)));
    ctx.save();
    // 繩: 越長越直、越紅
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + (1 - k) * 28;
    var col = k < 0.7 ? '#e8c890' : (k < 0.9 ? '#ffa040' : P.rule);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.lineWidth = 7; ctx.strokeStyle = P.ink; ctx.stroke();
    if (k >= 0.9) { ctx.setLineDash([10, 6]); }
    ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
    ctx.setLineDash([]);
    // 繞圈進度環(半徑 52)
    circle(ctx, x2, y2, 52); ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(10,6,14,0.7)'; ctx.stroke();
    if (prog > 0) {
      ctx.beginPath(); ctx.arc(x2, y2, 52, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog);
      ctx.lineWidth = 7; ctx.strokeStyle = P.you; ctx.stroke();
    }
    // 時限: 外側細環往回縮, 剩 1.5 秒內變紅
    var left = Math.max(0, limit - t), lr = C01(left / limit);
    ctx.beginPath(); ctx.arc(x2, y2, 61, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lr);
    ctx.lineWidth = 3; ctx.strokeStyle = left < 1.5 ? P.rule : 'rgba(255,255,255,0.8)'; ctx.stroke();
    ctx.restore();
  }

  // ---- 魔物技能(地下城與表演場共用) ----
  var HZ_DEF = { firering: 120, waterball: 12, thunder: 70, quake: 0, spike: 10, wisp: 14 };
  var HZ_SP = { firering: 'fire', waterball: 'water', thunder: 'thunder', quake: 'stone', spike: 'spike', wisp: 'ghost' };
  function drawHazard(ctx, state) {
    var s = O(state), x = N(s.x, 0), y = N(s.y, 0);
    var kind = E(s.kind, ['firering', 'waterball', 'thunder', 'quake', 'spike', 'wisp'], 'firering');
    var phase = E(s.phase, ['warn', 'active', 'fly'], kind === 'firering' || kind === 'thunder' ? 'warn' : (kind === 'quake' ? 'active' : 'fly'));
    var r = Math.max(0, N(s.radius, HZ_DEF[kind]));
    var p = ratio(s.t, s.dur);
    var ang = N(s.angle, 0);
    var k = SP[HZ_SP[kind]];
    var refl = s.reflected === true;
    ctx.save();
    if (kind === 'firering' || kind === 'thunder') {
      if (phase === 'warn') {
        // 預警: 虛線外框 = 判定外緣; 填色由中心長大, 長滿 = 生效
        circle(ctx, x, y, r); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fill();
        circle(ctx, x, y, r * p); ctx.globalAlpha = 0.45; ctx.fillStyle = k.c; ctx.fill(); ctx.globalAlpha = 1;
        ctx.setLineDash([12, 8]);
        circle(ctx, x, y, r - 2); ctx.lineWidth = 4; ctx.strokeStyle = k.c; ctx.stroke();
        ctx.setLineDash([]);
        circle(ctx, x, y, r - 2); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.stroke();
      } else {
        var a = kind === 'thunder' ? (1 - p * 0.8) : (1 - Math.max(0, p - 0.6) / 0.4 * 0.6);
        ctx.globalAlpha = a;
        circle(ctx, x, y, r); ctx.fillStyle = kind === 'thunder' ? '#fff8c0' : k.c; ctx.globalAlpha = a * 0.75; ctx.fill();
        ctx.globalAlpha = a;
        // 內側邊: 火焰圓瓣 / 雷光
        if (kind === 'firering') {
          ctx.fillStyle = '#ffb030';
          for (var i = 0; i < 14; i++) {
            var aa = i / 14 * Math.PI * 2 + p * 2;
            circle(ctx, x + Math.cos(aa) * (r - 12), y + Math.sin(aa) * (r - 12), 10); ctx.fill();
          }
        } else {
          ctx.beginPath(); ctx.moveTo(x - 10, y - r * 0.85); ctx.lineTo(x + 12, y - r * 0.2); ctx.lineTo(x - 6, y - r * 0.1); ctx.lineTo(x + 10, y + r * 0.6);
          ctx.lineWidth = 9; ctx.strokeStyle = P.ink; ctx.lineJoin = 'round'; ctx.stroke();
          ctx.lineWidth = 5; ctx.strokeStyle = k.c; ctx.stroke();
        }
        circle(ctx, x, y, r - 2); ctx.lineWidth = 4; ctx.strokeStyle = kind === 'thunder' ? k.c : '#ffd04a'; ctx.stroke();
        circle(ctx, x, y, r - 0.5); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.stroke();
      }
    } else if (kind === 'quake') {
      // radius = 環中線; 判定帶 [radius-15, radius+15]
      var a2 = 1 - Math.max(0, p - 0.8) / 0.2 * 0.7;
      ctx.globalAlpha = a2;
      var inner = Math.max(0, r - 15), outer = r + 15;
      ctx.beginPath(); ctx.arc(x, y, outer, 0, Math.PI * 2); if (inner > 0) ctx.arc(x, y, inner, 0, Math.PI * 2, true);
      ctx.fillStyle = 'rgba(176,160,140,0.8)'; ctx.fill('evenodd');
      circle(ctx, x, y, outer - 1); ctx.lineWidth = 2.5; ctx.strokeStyle = P.ink; ctx.stroke();
      if (inner > 1) { circle(ctx, x, y, inner + 1); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(18,14,22,0.7)'; ctx.stroke(); }
      // 裂紋
      ctx.strokeStyle = '#5a5046'; ctx.lineWidth = 2;
      for (var c = 0; c < 10; c++) {
        var ca = c / 10 * Math.PI * 2 + 0.3;
        ctx.beginPath(); ctx.moveTo(x + Math.cos(ca) * (r - 8), y + Math.sin(ca) * (r - 8)); ctx.lineTo(x + Math.cos(ca + 0.04) * (r + 8), y + Math.sin(ca + 0.04) * (r + 8)); ctx.stroke();
      }
    } else {
      // 投射物: 圓 = 判定半徑; 打回的: 白芯 + 玩家色外框 + 玩家色尾
      var col = refl ? '#ffffff' : k.c;
      var edge = refl ? P.you : P.ink;
      var fade = 1;
      if (kind === 'wisp') { var dur = N(s.dur, 3), tt = N(s.t, 0); if (dur > 0 && dur - tt < 0.5) fade = Math.max(0.2, (dur - tt) / 0.5); }
      ctx.globalAlpha = fade;
      // 尾巴
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(0, -r * 0.7); ctx.lineTo(-r * 2.6, 0); ctx.lineTo(0, r * 0.7); ctx.closePath();
      ctx.globalAlpha = fade * 0.5; ctx.fillStyle = refl ? P.you : k.c; ctx.fill(); ctx.globalAlpha = fade;
      if (kind === 'spike') {
        ctx.beginPath(); ctx.moveTo(r, 0); ctx.lineTo(-r * 0.9, -r * 0.5); ctx.lineTo(-r * 0.6, 0); ctx.lineTo(-r * 0.9, r * 0.5); ctx.closePath();
        ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = refl ? 3 : 2; ctx.strokeStyle = edge; ctx.stroke();
      } else if (kind === 'wisp') {
        circle(ctx, 0, 0, r - 1); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = refl ? 3 : 2; ctx.strokeStyle = edge; ctx.stroke();
        circle(ctx, r * 0.15, 0, r * 0.45); ctx.fillStyle = refl ? P.you : '#e8e0ff'; ctx.fill();
      } else {
        circle(ctx, 0, 0, r - 1); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = refl ? 3 : 2; ctx.strokeStyle = edge; ctx.stroke();
        circle(ctx, r * 0.25, -r * 0.3, r * 0.3); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // ---- 武器攻擊特效 ----
  function drawWeaponFx(ctx, state) {
    var s = O(state), x = N(s.x, 0), y = N(s.y, 0);
    var shape = E(s.shape, ['arc', 'circle', 'line', 'dash'], 'arc');
    var skill = s.move === 'skill';
    var ang = N(s.angle, 0), spread = Math.max(0, N(s.spread, Math.PI / 2));
    var r = Math.max(0, N(s.radius, 70)), len = Math.max(0, N(s.length, 170)), wd = Math.max(0, N(s.width, 40));
    var p = ratio(s.t, s.dur);
    var a = 1 - p * 0.85;
    var edge = skill ? P.you : '#ffffff';
    ctx.save();
    ctx.globalAlpha = a;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (shape === 'arc') {
      var a0 = ang - spread / 2, a1 = ang + spread / 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, a0, a1); ctx.closePath();
      ctx.fillStyle = skill ? 'rgba(255,79,216,0.28)' : 'rgba(255,255,255,0.25)'; ctx.fill();
      // 掃過的前緣
      var sweep = a0 + (a1 - a0) * Math.min(1, p * 1.6);
      ctx.beginPath(); ctx.arc(x, y, Math.max(0, r - 4), a0, sweep);
      ctx.lineWidth = 8; ctx.strokeStyle = edge; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, Math.max(0, r - 1), a0, a1); ctx.closePath();
      ctx.lineWidth = 2; ctx.strokeStyle = skill ? P.you : 'rgba(255,255,255,0.8)'; ctx.stroke();
    } else if (shape === 'circle') {
      circle(ctx, x, y, r); ctx.fillStyle = skill ? 'rgba(255,79,216,0.2)' : 'rgba(255,255,255,0.18)'; ctx.fill();
      circle(ctx, x, y, r - 4); ctx.lineWidth = 8; ctx.strokeStyle = edge; ctx.stroke();
    } else if (shape === 'line') {
      ctx.translate(x, y); ctx.rotate(ang);
      ctx.fillStyle = skill ? 'rgba(255,79,216,0.3)' : 'rgba(255,255,255,0.28)';
      ctx.fillRect(0, -wd / 2, len, wd);
      ctx.lineWidth = 3; ctx.strokeStyle = edge; ctx.strokeRect(1.5, -wd / 2 + 1.5, Math.max(0, len - 3), Math.max(0, wd - 3));
      ctx.beginPath(); ctx.moveTo(len * Math.min(1, p * 1.5) * 0.2, 0); ctx.lineTo(len - 4, 0); ctx.lineWidth = 6; ctx.stroke();
    } else {
      // 突進殘影軌跡
      ctx.translate(x, y); ctx.rotate(ang);
      ctx.fillStyle = 'rgba(255,79,216,0.25)';
      rr(ctx, 0, -18, len, 36, 18); ctx.fill();
      for (var i = 0; i < 4; i++) {
        circle(ctx, len * i / 4, 0, 18); ctx.globalAlpha = a * (0.15 + i * 0.12); ctx.fillStyle = P.you; ctx.fill();
      }
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(len, -18); ctx.moveTo(0, 18); ctx.lineTo(len, 18);
      ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    }
    ctx.restore();
  }

  // ---- 地下城選擇卡 600×260 ----
  function drawDungeonCard(ctx, state) {
    var s = O(state), x = N(s.x, 360), y = N(s.y, 330);
    var key = dg(s.dungeon), d = DUNGEON[key];
    var open = s.open === true, sel = s.selected === true;
    var L = x - 300, T = y - 130;
    ctx.save();
    rr(ctx, L + 3, T + 3, 594, 254, 18); ctx.fillStyle = open ? '#2e2640' : '#1e1a26'; ctx.fill();
    // 左側主題色帶 = 地下城地面小景
    ctx.save(); rr(ctx, L + 3, T + 3, 594, 254, 18); ctx.clip();
    ctx.fillStyle = d.floor; ctx.fillRect(L, T, 230, 260);
    ctx.fillStyle = d.wall; ctx.fillRect(L, T, 230, 40);
    ctx.fillStyle = d.wallTop; ctx.fillRect(L, T, 230, 12);
    ctx.restore();
    // 兩種魔物
    for (var i = 0; i < 2; i++) {
      var mx = L + 70 + i * 95, my = T + 150;
      shadow(ctx, mx, my + 34, 30, 7, 0.4);
      ctx.save(); ctx.translate(mx, my); creature(ctx, d.mons[i], 34, { dir: 1 }); ctx.restore();
      text(ctx, SP[d.mons[i]].name, mx, T + 222, { size: 18 });
    }
    // 名稱與狀態
    text(ctx, d.name, L + 260, T + 52, { size: 36, align: 'left', color: open ? '#ffffff' : '#cfc6dc' });
    if (open) {
      rr(ctx, L + 260, T + 100, 120, 40, 10); ctx.fillStyle = '#2f6a3a'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = P.ok; ctx.stroke();
      text(ctx, '已開放', L + 320, T + 120, { size: 20, color: '#ffffff' });
    } else {
      // 鎖頭 + 條件
      var lx = L + 278, ly = T + 125;
      ctx.beginPath(); ctx.arc(lx, ly - 8, 10, Math.PI, 0); ctx.lineWidth = 4; ctx.strokeStyle = '#cfc6dc'; ctx.stroke();
      rr(ctx, lx - 14, ly - 8, 28, 22, 4); ctx.fillStyle = '#cfc6dc'; ctx.fill();
      text(ctx, '未開放', L + 300, T + 120, { size: 20, align: 'left', color: '#cfc6dc' });
      text(ctx, S(s.condition, ''), L + 260, T + 180, { size: 20, align: 'left', color: P.gold, max: 320 });
    }
    if (!open) {
      // 未開放: 魔物小景蓋暗
      ctx.save(); rr(ctx, L + 3, T + 3, 230, 254, 18); ctx.clip();
      ctx.fillStyle = 'rgba(14,10,20,0.55)'; ctx.fillRect(L, T, 233, 260); ctx.restore();
    }
    // 外框 / 選中
    rr(ctx, L + 3, T + 3, 594, 254, 18);
    if (sel) { ctx.lineWidth = 6; ctx.strokeStyle = P.select; ctx.stroke(); }
    else { ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.stroke(); }
    if (sel) {
      ctx.beginPath(); ctx.moveTo(L + 572, T + 112); ctx.lineTo(L + 588, T + 130); ctx.lineTo(L + 572, T + 148);
      ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = P.select; ctx.stroke();
    }
    ctx.restore();
  }

  // ---- 陣容卡 300×200 ----
  function levelPips(ctx, x, y, lv, size) {
    for (var i = 0; i < 3; i++) {
      star(ctx, x + i * size * 2.2, y, size);
      ctx.fillStyle = i < lv ? P.gold : 'rgba(255,255,255,0.15)'; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = P.ink; ctx.stroke();
    }
  }
  function drawRosterCard(ctx, state) {
    var s = O(state), x = N(s.x, 195), y = N(s.y, 300), spc = sp(s.species);
    var lv = Math.max(0, Math.min(3, Math.round(N(s.level, 0))));
    var picked = s.picked === true, sel = s.selected === true;
    var L = x - 150, T = y - 100;
    ctx.save();
    rr(ctx, L + 3, T + 3, 294, 194, 16);
    ctx.fillStyle = picked ? '#3a3150' : '#221d2c'; ctx.fill();
    shadow(ctx, L + 80, T + 150, 40, 8, 0.4);
    ctx.save(); ctx.translate(L + 80, T + 108); creature(ctx, spc, 42, { dir: 1 }); ctx.restore();
    if (!picked) { rr(ctx, L + 3, T + 3, 294, 194, 16); ctx.fillStyle = 'rgba(14,10,20,0.35)'; ctx.fill(); }
    text(ctx, SP[spc].name, L + 160, T + 46, { size: 26, align: 'left' });
    text(ctx, 'Lv ' + lv, L + 160, T + 88, { size: 22, align: 'left', color: P.gold });
    levelPips(ctx, L + 226, T + 88, lv, 8);
    if (picked) {
      rr(ctx, L + 160, T + 124, 100, 40, 10); ctx.fillStyle = P.you; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      text(ctx, '✓ 上場', L + 210, T + 144, { size: 20 });
    } else {
      rr(ctx, L + 160, T + 124, 100, 40, 10); ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.stroke(); ctx.setLineDash([]);
      text(ctx, '休息', L + 210, T + 144, { size: 18, color: P.textDim });
    }
    rr(ctx, L + 3, T + 3, 294, 194, 16);
    if (sel) { ctx.lineWidth = 6; ctx.strokeStyle = P.select; } else { ctx.lineWidth = 2; ctx.strokeStyle = picked ? P.you : 'rgba(255,255,255,0.18)'; }
    ctx.stroke();
    ctx.restore();
  }

  // ---- 布置格子框 200×180 ----
  function drawSetupCell(ctx, state) {
    var s = O(state), x = N(s.x, 160), y = N(s.y, 360);
    var L = x - 100, T = y - 90;
    ctx.save();
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
    ctx.strokeRect(L + 1, T + 1, 198, 178);
    ctx.setLineDash([]);
    if (s.selected === true) {
      ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(10,6,14,0.7)'; ctx.strokeRect(L + 6, T + 6, 188, 168);
      ctx.lineWidth = 5; ctx.strokeStyle = P.select; ctx.strokeRect(L + 6, T + 6, 188, 168);
      // 四角加粗括號
      ctx.lineWidth = 9; ctx.lineCap = 'round';
      var c = 26, l = L + 6, t = T + 6, r = L + 194, b = T + 174;
      ctx.beginPath();
      ctx.moveTo(l, t + c); ctx.lineTo(l, t); ctx.lineTo(l + c, t);
      ctx.moveTo(r - c, t); ctx.lineTo(r, t); ctx.lineTo(r, t + c);
      ctx.moveTo(r, b - c); ctx.lineTo(r, b); ctx.lineTo(r - c, b);
      ctx.moveTo(l + c, b); ctx.lineTo(l, b); ctx.lineTo(l, b - c);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---- 地板 200×180 ----
  function floorPattern(ctx, kind, L, T, fp) {
    // fp: 觸發反應進度 0~1(未觸發 -1)
    var cx = L + 100, cy = T + 90;
    var on = fp >= 0, pulse = on ? Math.sin(fp * Math.PI) : 0;
    ctx.fillStyle = FLOOR[kind].base; ctx.fillRect(L, T, 200, 180);
    if (kind === 'chili') {
      // 田壟 + 辣椒
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 6;
      for (var r = 0; r < 4; r++) { ctx.beginPath(); ctx.moveTo(L + 8, T + 26 + r * 44); ctx.lineTo(L + 192, T + 26 + r * 44); ctx.stroke(); }
      for (var rr2 = 0; rr2 < 4; rr2++) {
        for (var c = 0; c < 4; c++) {
          var px = L + 28 + c * 48 + (rr2 % 2) * 20, py = T + 22 + rr2 * 44;
          if (px > L + 186) continue;
          ctx.save(); ctx.translate(px, py); ctx.rotate(0.5 - pulse * 0.3);
          ctx.beginPath(); ctx.moveTo(-3, -8); ctx.quadraticCurveTo(9, -4, 3, 12); ctx.quadraticCurveTo(-6, 2, -3, -8);
          ctx.fillStyle = 'rgba(216,58,42,0.75)'; ctx.fill();
          ctx.beginPath(); ctx.moveTo(-3, -8); ctx.lineTo(-2, -13); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(90,170,60,0.8)'; ctx.stroke();
          ctx.restore();
        }
      }
      if (on) {
        // 觸發: 熱氣往上竄(圓頭火舌, 不用尖)
        ctx.globalAlpha = 1 - fp;
        ctx.fillStyle = 'rgba(255,90,40,0.35)'; ctx.fillRect(L, T, 200, 180);
        ctx.fillStyle = P.ignite;
        for (var f = 0; f < 6; f++) {
          var fx2 = L + 20 + f * 32, fy = T + 160 - fp * 120 - (f % 2) * 14;
          ctx.beginPath(); ctx.ellipse(fx2, Math.max(T + 14, fy), 10, 16, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    } else if (kind === 'ice') {
      ctx.fillStyle = 'rgba(168,228,255,0.18)';
      ctx.beginPath(); ctx.moveTo(L, T + 120); ctx.lineTo(L + 120, T); ctx.lineTo(L + 160, T); ctx.lineTo(L, T + 160); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(L + 90, T + 180); ctx.lineTo(L + 200, T + 70); ctx.lineTo(L + 200, T + 100); ctx.lineTo(L + 120, T + 180); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(200,240,255,0.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(L + 30, T + 40); ctx.lineTo(L + 70, T + 70); ctx.lineTo(L + 60, T + 110); ctx.moveTo(L + 70, T + 70); ctx.lineTo(L + 110, T + 64);
      ctx.moveTo(L + 140, T + 120); ctx.lineTo(L + 160, T + 150); ctx.moveTo(L + 140, T + 120); ctx.lineTo(L + 176, T + 112); ctx.stroke();
      // 雪花(六臂, 圓頭)
      ctx.lineCap = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(220,245,255,0.6)';
      for (var i = 0; i < 3; i++) {
        var a = i * Math.PI / 3;
        ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * 14, cy - Math.sin(a) * 14); ctx.lineTo(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14); ctx.stroke();
      }
      if (on) {
        ctx.globalAlpha = 1 - fp;
        ctx.fillStyle = 'rgba(220,245,255,0.45)'; ctx.fillRect(L, T, 200, 180);
        ctx.fillStyle = P.douse;
        for (var d = 0; d < 6; d++) {
          var dx = L + 22 + d * 31, dy = T + 18 + fp * 120 + (d % 2) * 14;
          ctx.beginPath(); ctx.moveTo(dx, Math.min(T + 160, dy) - 9); ctx.quadraticCurveTo(dx + 7, Math.min(T + 160, dy) + 2, dx, Math.min(T + 160, dy) + 7); ctx.quadraticCurveTo(dx - 7, Math.min(T + 160, dy) + 2, dx, Math.min(T + 160, dy) - 9); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    } else if (kind === 'spring') {
      // 彈簧墊: 同心圈 + 圓頭箭頭(朝外四向 = 彈出去)
      var sq = on ? 1 - pulse * 0.35 : 1;
      ctx.strokeStyle = 'rgba(127,224,200,0.55)'; ctx.lineWidth = 5;
      for (var k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(cx, cy, (28 + k * 18) * (k === 0 ? sq : 1), (22 + k * 15) * (k === 0 ? sq : 1), 0, 0, Math.PI * 2); ctx.stroke(); }
      circle(ctx, cx, cy, 14 * sq); ctx.fillStyle = 'rgba(127,224,200,0.7)'; ctx.fill();
      var arms = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var m = 0; m < 4; m++) {
        var ax = arms[m][0], ay = arms[m][1];
        roundArrow(ctx, cx + ax * 70, cy + ay * 60, cx + ax * 86, cy + ay * 74, 'rgba(127,224,200,0.6)', 4);
      }
      // 四角鉚釘
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      circle(ctx, L + 14, T + 14, 5); ctx.fill(); circle(ctx, L + 186, T + 14, 5); ctx.fill(); circle(ctx, L + 14, T + 166, 5); ctx.fill(); circle(ctx, L + 186, T + 166, 5); ctx.fill();
      if (on) {
        ctx.globalAlpha = 1 - fp;
        ctx.beginPath(); ctx.ellipse(cx, cy, 30 + fp * 60, 24 + fp * 52, 0, 0, Math.PI * 2);
        ctx.lineWidth = 8; ctx.strokeStyle = '#c8fff0'; ctx.stroke();
        ctx.globalAlpha = 1;
      }
    } else { // stage
      // 木地板 + 聚光圓 + 星
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
      for (var b = 1; b < 6; b++) { ctx.beginPath(); ctx.moveTo(L, T + b * 30); ctx.lineTo(L + 200, T + b * 30); ctx.stroke(); }
      var g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 86);
      g.addColorStop(0, 'rgba(255,216,106,' + (0.45 + pulse * 0.45) + ')'); g.addColorStop(1, 'rgba(255,216,106,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, 90, 80, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx, cy, 80, 70, 0, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,216,106,0.45)'; ctx.stroke();
      star(ctx, cx, cy, 22); ctx.fillStyle = 'rgba(255,216,106,0.6)'; ctx.fill();
      if (on) {
        ctx.globalAlpha = 1 - fp;
        ctx.fillStyle = 'rgba(255,240,180,0.35)';
        ctx.beginPath(); ctx.moveTo(cx - 30, T); ctx.lineTo(cx + 30, T); ctx.lineTo(cx + 96, T + 178); ctx.lineTo(cx - 96, T + 178); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    // 格邊: 細暗線, 讓相鄰兩格分得出
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2; ctx.strokeRect(L + 1, T + 1, 198, 178);
  }
  function drawFloorTile(ctx, state) {
    var s = O(state), x = N(s.x, 160), y = N(s.y, 360);
    var kind = E(s.kind, ['chili', 'ice', 'spring', 'stage'], 'chili');
    var fp = s.fired === true ? ratio(s.firedT, N(s.firedDur, 0.4) > 0 ? s.firedDur : 0.4) : -1;
    ctx.save();
    ctx.beginPath(); ctx.rect(x - 100, y - 90, 200, 180); ctx.clip();
    floorPattern(ctx, kind, x - 100, y - 90, fp);
    ctx.restore();
  }

  // ---- 選擇面板 ----
  function drawPickerPanel(ctx, state) {
    var s = O(state);
    var opts = Array.isArray(s.options) ? s.options : [];
    var idx = Math.round(N(s.index, 0));
    var L = 120, T = 240, W = 480, H = 80 + 70 * opts.length;
    ctx.save();
    rr(ctx, L, T, W, H, 16); ctx.fillStyle = 'rgba(30,24,42,0.97)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.stroke();
    text(ctx, '鋪什麼地板?', L + W / 2, T + 40, { size: 26 });
    for (var i = 0; i < opts.length; i++) {
      var o = O(opts[i]);
      var rT = T + 80 + 70 * i;
      var isFloor = o.type !== 'clear';
      var aff = o.affordable !== false;
      var sel = i === idx;
      rr(ctx, L + 8, rT + 4, W - 16, 62, 10);
      ctx.fillStyle = sel ? '#4a3f66' : 'rgba(255,255,255,0.05)'; ctx.fill();
      // 圖示
      if (isFloor) {
        var key = E(o.key, ['chili', 'ice', 'spring', 'stage'], 'chili');
        ctx.save(); ctx.beginPath(); rr(ctx, L + 18, rT + 10, 60, 50, 6); ctx.clip();
        ctx.translate(L + 18, rT + 10); ctx.scale(0.3, 0.2778);
        floorPattern(ctx, key, 0, 0, -1);
        ctx.restore();
        rr(ctx, L + 18, rT + 10, 60, 50, 6); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.stroke();
      } else {
        rr(ctx, L + 18, rT + 10, 60, 50, 6); ctx.setLineDash([5, 4]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke(); ctx.setLineDash([]);
      }
      var nameCol = aff ? '#ffffff' : '#7a7088';
      if (isFloor) {
        text(ctx, S(o.name, ''), L + 92, rT + 22, { size: 22, align: 'left', color: nameCol, max: 200 });
        text(ctx, S(o.desc, ''), L + 92, rT + 50, { size: 16, align: 'left', color: aff ? P.textDim : '#6a6078', max: 270, bold: false });
        coin(ctx, L + W - 94, rT + 24, 9);
        text(ctx, String(N(o.cost, 0)), L + W - 78, rT + 24, { size: 22, align: 'left', color: aff ? P.gold : '#7a7088' });
      } else {
        text(ctx, S(o.name, '清空'), L + 92, rT + 35, { size: 22, align: 'left', color: nameCol });
      }
      if (sel) {
        rr(ctx, L + 8, rT + 4, W - 16, 62, 10); ctx.lineWidth = 4; ctx.strokeStyle = P.select; ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---- 布置資訊列 400×120(x 60~460、y 1150~1270) ----
  function drawSetupInfo(ctx, state) {
    var s = O(state);
    var L = 60, T = 1150;
    ctx.save();
    rr(ctx, L + 2, T + 2, 396, 116, 14); ctx.fillStyle = P.panel; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.stroke();
    coin(ctx, L + 36, T + 40, 14);
    text(ctx, '金幣 ' + Math.round(N(s.gold, 0)), L + 60, T + 40, { size: 28, align: 'left', color: P.gold });
    // 小格子圖示
    ctx.strokeStyle = '#cfc6dc'; ctx.lineWidth = 2;
    for (var c = 0; c < 3; c++) for (var r = 0; r < 2; r++) ctx.strokeRect(L + 22 + c * 10, T + 72 + r * 10, 10, 10);
    text(ctx, '已鋪 ' + Math.max(0, Math.round(N(s.floors, 0))) + ' 格', L + 60, T + 84, { size: 22, align: 'left', color: '#ffffff' });
    ctx.restore();
  }

  // ---- 震地圈 ----
  function drawSlamFx(ctx, state) {
    var s = O(state), x = N(s.x, 0), y = N(s.y, 0);
    var R = Math.max(0, N(s.radius, 110));
    var p = ratio(s.t, N(s.dur, 0.4) > 0 ? s.dur : 0.4);
    ctx.save();
    // 最終範圍(判定外緣)淡虛線
    ctx.globalAlpha = 1 - p * 0.6;
    ctx.setLineDash([10, 7]); circle(ctx, x, y, R - 1.5); ctx.lineWidth = 3; ctx.strokeStyle = P.ignite; ctx.stroke(); ctx.setLineDash([]);
    // 外擴震波(外緣 ≤ R)
    var rr3 = R * (0.25 + 0.75 * p);
    circle(ctx, x, y, Math.max(0, rr3 - 4)); ctx.lineWidth = 8; ctx.strokeStyle = P.ink; ctx.globalAlpha = (1 - p) * 0.7; ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = P.ignite; ctx.globalAlpha = 1 - p; ctx.stroke();
    circle(ctx, x, y, rr3 * 0.7); ctx.fillStyle = 'rgba(255,164,36,0.18)'; ctx.fill();
    // 塵土圓點
    ctx.fillStyle = 'rgba(220,200,160,' + (0.8 * (1 - p)) + ')';
    for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2 + 0.2; circle(ctx, x + Math.cos(a) * rr3 * 0.85, y + Math.sin(a) * rr3 * 0.85 - p * 10, 5); ctx.fill(); }
    ctx.restore();
  }

  // ---- 表演場底 ----
  function drawShowArena(ctx) {
    ctx.save();
    // 觀眾席(上 130~250、下 1020~1140)
    function stand(T) {
      ctx.fillStyle = P.stand; ctx.fillRect(0, T, 720, 120);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (var i = 0; i < 3; i++) ctx.fillRect(20, T + 18 + i * 36, 680, 14);
    }
    stand(130); stand(1020);
    // 場外牆
    ctx.fillStyle = '#4a3a2c'; ctx.fillRect(0, 250, 720, 20); ctx.fillRect(0, 990, 720, 30);
    ctx.fillRect(0, 270, 60, 720); ctx.fillRect(660, 270, 60, 720);
    // 場地 x 60~660、y 270~990
    ctx.fillStyle = P.arena; ctx.fillRect(60, 270, 600, 720);
    ctx.strokeStyle = 'rgba(255,240,210,0.06)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(360, 630, 220, 260, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 4; ctx.strokeRect(62, 272, 596, 716);
    ctx.restore();
  }

  // ---- 表演場魔物 100×100(石像鬼 120×120), 怒氣條 90×12 ----
  function rageBar(ctx, cx, top, rage, redLow, mode) {
    var w = 90, h = 12, L = cx - w / 2;
    rr(ctx, L - 1, top - 1, w + 2, h + 2, 4); ctx.fillStyle = 'rgba(10,6,14,0.92)'; ctx.fill();
    // 紅區底(規則紅, 半透明)
    var rx = L + w * redLow / 100;
    ctx.fillStyle = 'rgba(255,47,90,0.35)'; ctx.fillRect(rx, top + 1, L + w - rx - 1, h - 2);
    // 怒氣
    var inRed = rage >= redLow;
    var fw = (w - 2) * C01(rage / 100);
    ctx.fillStyle = inRed ? P.rule : (rage >= 50 ? '#ffb43a' : '#e8e0d0');
    ctx.fillRect(L + 1, top + 2, fw, h - 4);
    // 50 門檻刻度
    ctx.fillStyle = '#ffffff'; ctx.fillRect(L + w * 0.5 - 1, top - 1, 2, h + 2);
    // 紅區下限: 紅線 + 白細芯
    ctx.fillStyle = P.rule; ctx.fillRect(rx - 2, top - 2, 4, h + 4);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(rx - 0.5, top, 1, h);
    if (inRed || mode === 'charge' || mode === 'loose') {
      rr(ctx, L - 1, top - 1, w + 2, h + 2, 4); ctx.lineWidth = 2; ctx.strokeStyle = P.rule; ctx.stroke();
    }
  }
  function markRow(ctx, cx, y, marks, left, dur) {
    // 5 格: 前 marks 格實心紅菱形, 其餘空框; 最後一顆實心的上面畫遞減倒數
    for (var i = 0; i < 5; i++) {
      var mx = cx - 32 + i * 16;
      ctx.beginPath(); ctx.moveTo(mx, y - 6); ctx.lineTo(mx + 6, y); ctx.lineTo(mx, y + 6); ctx.lineTo(mx - 6, y); ctx.closePath();
      if (i < marks) {
        ctx.fillStyle = P.rule; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(10,6,14,0.6)'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = i === 4 ? P.rule : 'rgba(255,255,255,0.45)'; ctx.stroke();
      }
    }
    if (marks > 0 && dur > 0) {
      var lx = cx - 32 + (marks - 1) * 16;
      var fr = C01(left / dur);
      ctx.beginPath(); ctx.moveTo(lx, y); ctx.arc(lx, y, 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fr); ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
    }
  }
  function drawShowMonster(ctx, state) {
    var s = O(state), x = N(s.x, 360), y = N(s.y, 630), spc = sp(s.species);
    var big = spc === 'stone';
    var half = big ? 60 : 50, R = big ? 32 : 26;
    var dir = N(s.dir, 1) < 0 ? -1 : 1;
    var mode = E(s.mode, ['roam', 'fly', 'charge', 'loose'], 'roam');
    var rage = Math.max(0, Math.min(100, N(s.rage, 0)));
    var redLow = Math.max(0, Math.min(100, N(s.redLow, 80)));
    var marks = Math.max(0, Math.min(4, Math.round(N(s.marks, 0))));
    var lv = Math.max(0, Math.min(3, Math.round(N(s.level, 0))));
    var fx = E(s.fx, ['none', 'ignited', 'doused'], 'none');
    var fxp = fx !== 'none' ? ratio(s.fxT, N(s.fxDur, 0.5) > 0 ? s.fxDur : 0.5) : 0;
    var wild = mode === 'charge' || mode === 'loose';
    var perf = s.performing === true;
    var pp = perf ? ratio(s.performT, N(s.performDur, 0.5) > 0 ? s.performDur : 0.5) : 0;
    var lift = 0;
    if (mode === 'fly') lift = 70 * Math.sin(Math.PI * ratio(s.flyT, N(s.flyDur, 0.4) > 0 ? s.flyDur : 0.4));
    var shake = 0;
    if (mode === 'charge' && N(s.chargeT, 0) > 0) shake = Math.sin(now() / 25) * 3;
    var hop = mode === 'loose' ? Math.abs(Math.sin(now() / 110)) * 5 : 0;
    var bodyY = y + 10;
    ctx.save();
    // 影子(地面位置)
    var shS = mode === 'fly' ? Math.max(0.45, 1 - lift / 110) : 1;
    shadow(ctx, x, y + half - 10, R * 1.0 * shS, 6 * shS, 0.4);
    ctx.save();
    ctx.translate(x + shake, bodyY - lift - hop);
    // 表演中: 身體下方種類色光盤 + 外擴一次
    if (perf) {
      ctx.globalAlpha = 1 - pp;
      circle(ctx, 0, 0, R + 6 + pp * 10); ctx.lineWidth = 4; ctx.strokeStyle = SP[spc].l; ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (wild) {
      // 失控: 紅色鋸齒外圈(危險)
      ctx.beginPath();
      for (var i = 0; i <= 16; i++) {
        var a = i / 16 * Math.PI * 2, rad = (i % 2 === 0) ? R + 12 : R + 5;
        var px = Math.cos(a) * rad, py = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fillStyle = 'rgba(255,47,90,0.35)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = P.rule; ctx.stroke();
    }
    var sc = perf ? 1 + 0.12 * Math.sin(pp * Math.PI) : 1;
    ctx.scale(sc, sc);
    creature(ctx, spc, R, { dir: dir, angry: rage >= redLow || wild, redTint: wild ? 0.25 : 0 });
    ctx.restore();
    // 急衝線
    if (s.dashing === true) {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (var j = -1; j <= 1; j++) { ctx.beginPath(); ctx.moveTo(x - dir * (R + 4), bodyY - lift + j * 11); ctx.lineTo(x - dir * (half - 2), bodyY - lift + j * 11); ctx.stroke(); }
    }
    // 升怒 / 降怒回饋(方向是主通道: 往上竄 vs 往下滴)
    if (fx === 'ignited') {
      ctx.globalAlpha = 1 - fxp * 0.8;
      for (var q = 0; q < 3; q++) {
        var ox = (q - 1) * (R * 0.8), oy = bodyY - lift - fxp * 26 - (q === 1 ? 6 : 0);
        roundArrow(ctx, x + ox, oy + 10, x + ox, oy - 6, P.ink, 7);
        roundArrow(ctx, x + ox, oy + 10, x + ox, oy - 6, P.ignite, 4);
      }
      ctx.globalAlpha = 1;
    } else if (fx === 'doused') {
      ctx.globalAlpha = 1 - fxp * 0.8;
      for (var w2 = 0; w2 < 3; w2++) {
        var dx = x + (w2 - 1) * (R * 0.8), dy = bodyY - lift - R * 0.4 + fxp * 26 + (w2 === 1 ? 6 : 0);
        ctx.beginPath(); ctx.moveTo(dx, dy - 9); ctx.quadraticCurveTo(dx + 7, dy + 2, dx, dy + 7); ctx.quadraticCurveTo(dx - 7, dy + 2, dx, dy - 9);
        ctx.fillStyle = P.douse; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // 怒氣條(框頂)與失控標記
    var barTop = y - half + 2 - lift;
    rageBar(ctx, x, barTop, wild ? 100 : rage, redLow, mode);
    if (!wild && marks > 0) markRow(ctx, x, barTop + 22, marks, N(s.markLeft, 0), N(s.markDur, 4));
    // Lv
    text(ctx, 'Lv ' + lv, x + half - 4, y + half - 9 - lift, { size: 16, align: 'right', color: P.gold, sw: 4 });
    ctx.restore();
  }

  // ---- 圍欄 100×16 ----
  function drawFence(ctx, state) {
    var s = O(state), x = N(s.x, 110), y = N(s.y, 255);
    var L = x - 50, T = y - 8;
    ctx.save();
    if (s.broken !== true) {
      ctx.fillStyle = '#8a5a32'; ctx.fillRect(L + 2, T + 3, 96, 4); ctx.fillRect(L + 2, T + 10, 96, 4);
      ctx.fillStyle = '#c08850'; ctx.fillRect(L + 2, T + 3, 96, 2); ctx.fillRect(L + 2, T + 10, 96, 2);
      ctx.fillStyle = '#5a3a22'; ctx.fillRect(L + 2, T, 8, 16); ctx.fillRect(L + 90, T, 8, 16); ctx.fillRect(L + 46, T, 8, 16);
    } else {
      // 破損: 中段缺口 + 斷口 + 紅色警示底
      ctx.fillStyle = 'rgba(255,47,90,0.3)'; ctx.fillRect(L, T, 100, 16);
      ctx.fillStyle = '#5a3a22'; ctx.fillRect(L + 2, T, 8, 16); ctx.fillRect(L + 90, T, 8, 16);
      ctx.fillStyle = '#8a5a32';
      ctx.beginPath(); ctx.moveTo(L + 2, T + 3); ctx.lineTo(L + 34, T + 3); ctx.lineTo(L + 28, T + 7); ctx.lineTo(L + 2, T + 7); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(L + 98, T + 10); ctx.lineTo(L + 66, T + 10); ctx.lineTo(L + 72, T + 14); ctx.lineTo(L + 98, T + 14); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.translate(L + 50, T + 10); ctx.rotate(0.6); ctx.fillRect(-10, -2, 20, 4); ctx.restore();
    }
    ctx.restore();
  }

  // ---- 觀眾 60×90 ----
  var SHIRTS = ['#c88a6a', '#7a8ab0', '#b07aa0', '#8aa07a', '#c0a870', '#7aa8a8'];
  function drawVisitor(ctx, state) {
    var s = O(state), x = N(s.x, 110), y = N(s.y, 190);
    var mode = E(s.mode, ['watch', 'scared', 'empty'], 'watch');
    var L = x - 30, T = y - 45;
    ctx.save();
    // 座位
    rr(ctx, L + 8, T + 58, 44, 28, 6); ctx.fillStyle = '#4a3c58'; ctx.fill();
    if (mode === 'empty') {
      rr(ctx, L + 8, T + 58, 44, 28, 6); ctx.setLineDash([4, 4]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.stroke(); ctx.setLineDash([]);
      ctx.restore(); return;
    }
    var shirt = SHIRTS[Math.abs(Math.round(x / 100)) % SHIRTS.length];
    var sx = 0;
    if (mode === 'scared') sx = Math.sin(now() / 40) * 2.5;
    ctx.translate(sx, 0);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // 身體
    rr(ctx, L + 16, T + 40, 28, 34, 10); ctx.fillStyle = mode === 'scared' ? '#8a8494' : shirt; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = P.ink; ctx.stroke();
    // 手
    ctx.lineWidth = 5; ctx.strokeStyle = '#e8cdb0';
    if (mode === 'scared') {
      ctx.beginPath(); ctx.moveTo(L + 18, T + 46); ctx.lineTo(L + 8, T + 22); ctx.moveTo(L + 42, T + 46); ctx.lineTo(L + 52, T + 22); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(L + 18, T + 48); ctx.lineTo(L + 10, T + 60); ctx.moveTo(L + 42, T + 48); ctx.lineTo(L + 50, T + 36); ctx.stroke();
    }
    // 頭
    circle(ctx, L + 30, T + 28, 13); ctx.fillStyle = mode === 'scared' ? '#dcd8e8' : '#f0d4b4'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = P.ink; ctx.stroke();
    ctx.fillStyle = P.ink;
    if (mode === 'scared') {
      circle(ctx, L + 25, T + 26, 2.5); ctx.fill(); circle(ctx, L + 35, T + 26, 2.5); ctx.fill();
      circle(ctx, L + 30, T + 34, 3.5); ctx.fill();
      // 驚嚇線
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(L + 12, T + 6); ctx.lineTo(L + 16, T + 12); ctx.moveTo(L + 30, T + 2); ctx.lineTo(L + 30, T + 9); ctx.moveTo(L + 48, T + 6); ctx.lineTo(L + 44, T + 12); ctx.stroke();
    } else {
      circle(ctx, L + 25, T + 27, 2); ctx.fill(); circle(ctx, L + 35, T + 27, 2); ctx.fill();
      ctx.beginPath(); ctx.arc(L + 30, T + 31, 4, 0.2, Math.PI - 0.2); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
    }
    ctx.restore();
  }

  // ---- 商店項目 600×110 ----
  var SHOP = {
    club:    { name: '棍棒', desc: 'Z 敲擊 X 無' },
    sword:   { name: '劍', desc: 'Z 斬擊可打回飛彈 X 擊暈' },
    spear:   { name: '長槍', desc: 'Z 長刺 X 突進' },
    whip:    { name: '長鞭', desc: 'Z 整圈抽打 X 擊飛' },
    attack:  { name: '攻擊力 +1', desc: '每次攻擊傷害 +1' },
    armor:   { name: '護甲 心 +1', desc: '地下城的心 +1' },
    ropeBag: { name: '繩袋 捕獸繩 +1', desc: '每天的捕獸繩 +1' }
  };
  function shopIcon(ctx, item, x, y) {
    if (item === 'club' || item === 'sword' || item === 'spear' || item === 'whip') {
      weaponGlyph(ctx, item, x, y, 62, -Math.PI / 4);
    } else if (item === 'attack') {
      weaponGlyph(ctx, 'sword', x - 4, y + 4, 50, -Math.PI / 4);
      roundArrow(ctx, x + 18, y + 12, x + 18, y - 14, P.ok, 4);
    } else if (item === 'armor') {
      heart(ctx, x, y + 4, 30); ctx.fillStyle = '#ff5a6e'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = P.ink; ctx.stroke();
      text(ctx, '+', x + 18, y - 14, { size: 22, color: P.ok });
    } else {
      ctx.beginPath(); ctx.ellipse(x, y, 20, 14, 0, 0, Math.PI * 2); ctx.lineWidth = 8; ctx.strokeStyle = P.ink; ctx.stroke();
      ctx.lineWidth = 5; ctx.strokeStyle = '#e8c890'; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, y, 11, 7, 0, 0, Math.PI * 2); ctx.lineWidth = 4; ctx.stroke();
      text(ctx, '+', x + 20, y - 14, { size: 22, color: P.ok });
    }
  }
  function drawShopItem(ctx, state) {
    var s = O(state), x = N(s.x, 360), y = N(s.y, 200);
    var item = E(s.item, ['club', 'sword', 'spear', 'whip', 'attack', 'armor', 'ropeBag'], 'club');
    var info = SHOP[item];
    var isWeapon = ['club', 'sword', 'spear', 'whip'].indexOf(item) >= 0;
    var owned = s.owned === true || item === 'club';
    var eq = s.equipped === true, aff = s.affordable !== false, sel = s.selected === true;
    var L = x - 300, T = y - 55;
    ctx.save();
    rr(ctx, L + 3, T + 3, 594, 104, 14); ctx.fillStyle = eq ? '#3a3150' : P.panel; ctx.fill();
    rr(ctx, L + 14, T + 15, 80, 80, 12); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
    shopIcon(ctx, item, L + 54, T + 55);
    text(ctx, info.name, L + 112, T + 36, { size: 26, align: 'left' });
    text(ctx, info.desc, L + 112, T + 76, { size: 18, align: 'left', color: P.textDim, bold: false, max: 300 });
    // 右側: 價格 / 已擁有 / 裝備中 / 已買次數
    if (isWeapon && owned) {
      text(ctx, '已擁有', L + 580, T + 36, { size: 20, align: 'right', color: P.textDim });
    } else {
      coin(ctx, L + 500, T + 36, 11);
      text(ctx, String(Math.round(N(s.cost, 0))), L + 580, T + 36, { size: 26, align: 'right', color: aff ? P.gold : '#8a6a6a' });
      if (!aff) text(ctx, '金幣不夠', L + 580, T + 78, { size: 16, align: 'right', color: P.bad, bold: false });
    }
    if (isWeapon && eq) {
      rr(ctx, L + 476, T + 60, 104, 34, 9); ctx.fillStyle = P.you; ctx.fill();
      text(ctx, '裝備中', L + 528, T + 77, { size: 18 });
    }
    if (!isWeapon) {
      var lv = Math.max(0, Math.round(N(s.level, 0)));
      if (lv > 0 && aff) text(ctx, '已買 ' + lv + ' 次', L + 580, T + 78, { size: 16, align: 'right', color: P.textDim, bold: false });
      else if (lv > 0) text(ctx, '已買 ' + lv + ' 次', L + 440, T + 36, { size: 16, align: 'right', color: P.textDim, bold: false });
    }
    rr(ctx, L + 3, T + 3, 594, 104, 14);
    if (sel) { ctx.lineWidth = 6; ctx.strokeStyle = P.select; } else { ctx.lineWidth = 2; ctx.strokeStyle = eq ? P.you : 'rgba(255,255,255,0.15)'; }
    ctx.stroke();
    ctx.restore();
  }

  // ---- 按鈕 ----
  function drawButton(ctx, state) {
    var s = O(state);
    var x = N(s.x, 0), y = N(s.y, 0), w = Math.max(0, N(s.w, 180)), h = Math.max(0, N(s.h, 100));
    var sel = s.selected === true;
    ctx.save();
    rr(ctx, x + 3, y + 3, Math.max(0, w - 6), Math.max(0, h - 6), 16);
    ctx.fillStyle = sel ? P.you : '#3a3150'; ctx.fill();
    ctx.lineWidth = sel ? 6 : 2; ctx.strokeStyle = sel ? P.select : 'rgba(255,255,255,0.3)'; ctx.stroke();
    text(ctx, S(s.label, ''), x + w / 2, y + h / 2, { size: Math.max(18, Math.min(36, h * 0.36)), color: '#ffffff', max: Math.max(10, w - 20) });
    ctx.restore();
  }

  // ---- 飄字 ----
  var FT = {
    gold:    { c: P.gold, s: 24, st: 'rgba(10,6,14,0.9)' },
    redGold: { c: P.gold, s: 30, st: P.rule },
    chain:   { c: '#ffffff', s: 30, st: P.you },
    repDown: { c: P.bad, s: 24, st: 'rgba(10,6,14,0.9)' },
    capture: { c: P.ok, s: 30, st: 'rgba(10,6,14,0.9)' },
    levelUp: { c: '#7fe7ff', s: 26, st: 'rgba(10,6,14,0.9)' },
    coin20:  { c: P.gold, s: 26, st: 'rgba(10,6,14,0.9)' }
  };
  function drawFloatText(ctx, state) {
    var s = O(state), x = N(s.x, 0), y = N(s.y, 0);
    var kind = E(s.kind, ['gold', 'redGold', 'chain', 'repDown', 'capture', 'levelUp', 'coin20'], 'gold');
    var k = FT[kind];
    var p = ratio(s.t, N(s.dur, 1) > 0 ? s.dur : 1);
    ctx.save();
    var yy = y - p * 40;
    ctx.globalAlpha = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
    var str = S(s.text, '');
    if (kind === 'capture') {
      text(ctx, '✓ ' + str, x, yy, { size: k.s, color: k.c, stroke: k.st, sw: 6 });
    } else {
      text(ctx, str, x, yy, { size: k.s, color: k.c, stroke: k.st, sw: kind === 'redGold' || kind === 'chain' ? 7 : 5 });
    }
    ctx.restore();
  }

  // ---- 結算 ----
  function drawResultPanel(ctx, state) {
    var s = O(state);
    var roster = Array.isArray(s.roster) ? s.roster : [];
    var stars = Math.max(0, Math.min(3, Math.round(N(s.stars, 0))));
    ctx.save();
    ctx.fillStyle = 'rgba(14,10,20,0.85)'; ctx.fillRect(0, 0, 720, 1280);
    rr(ctx, 60, 140, 600, 1000, 24); ctx.fillStyle = P.panel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.stroke();
    text(ctx, '七天結算', 360, 210, { size: 40 });
    for (var i = 0; i < 3; i++) {
      star(ctx, 240 + i * 120, 320, 46);
      ctx.fillStyle = i < stars ? P.gold : 'rgba(255,255,255,0.1)'; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = i < stars ? '#8a6a10' : 'rgba(255,255,255,0.3)'; ctx.stroke();
    }
    var rows = [['總名聲', String(Math.round(N(s.rep, 0))), P.rep], ['累計金幣', String(Math.round(N(s.goldEarned, 0))), P.gold], ['最長連鎖', Math.round(N(s.bestChain, 0)) + ' 段', '#ffffff']];
    for (var r = 0; r < 3; r++) {
      var yy = 440 + r * 80;
      rr(ctx, 100, yy - 30, 520, 60, 12); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
      text(ctx, rows[r][0], 130, yy, { size: 26, align: 'left', color: P.textDim });
      text(ctx, rows[r][1], 590, yy, { size: 34, align: 'right', color: rows[r][2] });
    }
    text(ctx, '陣容', 130, 700, { size: 26, align: 'left', color: P.textDim });
    var n = Math.min(6, roster.length);
    for (var j = 0; j < n; j++) {
      var it = O(roster[j]);
      var cx = 160 + (j % 3) * 200, cy = 790 + Math.floor(j / 3) * 150;
      shadow(ctx, cx, cy + 34, 30, 7, 0.4);
      ctx.save(); ctx.translate(cx, cy); creature(ctx, it.species, 34, { dir: 1 }); ctx.restore();
      text(ctx, SP[sp(it.species)].name + ' Lv ' + Math.max(0, Math.min(3, Math.round(N(it.level, 0)))), cx, cy + 58, { size: 20 });
    }
    text(ctx, '按 Z 重來', 360, 1090, { size: 28, color: '#ffffff', stroke: P.you, sw: 6 });
    ctx.restore();
  }

  // ---- HUD 0~120 ----
  function fmtTime(t) { t = Math.max(0, Math.ceil(N(t, 0))); return t + ' 秒'; }
  function drawHud(ctx, state) {
    var s = O(state);
    var phase = E(s.phase, ['guide', 'select', 'dungeon', 'setup1', 'setup2', 'show', 'shop', 'result'], 'select');
    if (phase === 'guide') return;
    ctx.save();
    ctx.fillStyle = '#0e0a14'; ctx.fillRect(0, 0, 720, 120);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(0, 118, 720, 2);
    // 第一列: 天數 / 地下城名 / 金幣 / 名聲
    var day = Math.round(N(s.day, 1)), dmax = Math.round(N(s.dayMax, 7));
    text(ctx, '第 ' + day + ' / ' + dmax + ' 天', 16, 26, { size: 22, align: 'left' });
    var dn = (s.dungeon && DUNGEON[s.dungeon]) ? DUNGEON[s.dungeon].name : '';
    if (dn) text(ctx, dn, 210, 26, { size: 20, align: 'left', color: DUNGEON[s.dungeon].accent });
    coin(ctx, 470, 26, 11);
    text(ctx, String(Math.round(N(s.gold, 0))), 488, 26, { size: 24, align: 'left', color: P.gold });
    star(ctx, 594, 26, 12); ctx.fillStyle = P.rep; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#8a6a10'; ctx.stroke();
    text(ctx, String(Math.round(N(s.rep, 0))), 612, 26, { size: 24, align: 'left', color: P.rep });
    // 第二列
    var tMax = N(s.timeMax, 0), tLeft = Math.max(0, N(s.timeLeft, 0));
    if (phase === 'dungeon') {
      var hearts = Math.max(0, Math.round(N(s.hearts, 0))), mh = Math.max(hearts, Math.round(N(s.maxHearts, 5)));
      mh = Math.min(mh, 12);
      for (var i = 0; i < mh; i++) {
        heart(ctx, 26 + i * 26, 64, 22); ctx.fillStyle = i < hearts ? '#ff5a6e' : 'rgba(255,255,255,0.12)'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
      }
      // 繩
      var ropes = Math.max(0, Math.round(N(s.ropes, 0))), rmax = Math.max(ropes, Math.round(N(s.ropeMax, 3)));
      rmax = Math.min(rmax, 8);
      var rx0 = 26 + mh * 26 + 14;
      for (var j = 0; j < rmax; j++) {
        ctx.beginPath(); ctx.ellipse(rx0 + j * 24, 64, 9, 7, 0, 0, Math.PI * 2);
        ctx.lineWidth = 4; ctx.strokeStyle = j < ropes ? '#e8c890' : 'rgba(255,255,255,0.15)'; ctx.stroke();
      }
      // 武器 + X 冷卻
      var w = wp(s.weapon), xm = N(s.xCdMax, 0), xl = Math.max(0, N(s.xCdLeft, 0));
      var wx = 470;
      rr(ctx, wx - 22, 44, 44, 40, 8); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
      weaponGlyph(ctx, w, wx, 64, 36, -Math.PI / 4);
      // X 鍵小方塊
      var kx = wx + 44;
      rr(ctx, kx - 16, 48, 32, 32, 6);
      if (xm <= 0) { ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill(); text(ctx, 'X', kx, 64, { size: 18, color: '#5a5068', stroke: false }); }
      else {
        var ready = xl <= 0;
        ctx.fillStyle = ready ? P.you : '#3a3150'; ctx.fill();
        if (!ready) {
          var fr = C01(xl / xm);
          ctx.save(); rr(ctx, kx - 16, 48, 32, 32, 6); ctx.clip();
          ctx.fillStyle = 'rgba(10,6,14,0.7)'; ctx.fillRect(kx - 16, 48, 32, 32 * fr); ctx.restore();
        }
        text(ctx, 'X', kx, 64, { size: 18, color: '#ffffff', stroke: false });
      }
    }
    if (tMax > 0) {
      var bx = phase === 'dungeon' ? 548 : 300, bw = 720 - 16 - bx;
      var fr2 = C01(tLeft / tMax);
      rr(ctx, bx, 54, bw, 20, 6); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();
      rr(ctx, bx, 54, Math.max(0, bw * fr2), 20, 6); ctx.fillStyle = tLeft <= 10 ? P.bad : '#8fd0ff'; ctx.fill();
      text(ctx, fmtTime(tLeft), bx + bw / 2, 64, { size: 16 });
    }
    // 第三列: 訊息(按鍵提示)
    var msg = S(s.message, '');
    if (msg) text(ctx, msg, 360, 101, { size: 20, color: '#ffffff', max: 690 });
    ctx.restore();
  }

  // ================= 說明頁 =================
  // 依介面「文字歸屬」: 說明頁全部文字(標題、說明、頁碼、翻頁提示)由美術畫。
  // 在 720×1280 的虛擬頁面上畫, 等比縮放置中到 (x, y, w, h)。
  var GUIDE = [
    { title: '地下城', body: '方向鍵走, Z 攻擊, X 武器技' },
    { title: '收服', body: '殘血時站上去, 再繞牠一圈' },
    { title: '鋪地板', body: '開演前鋪地板, 開演後只能看' },
    { title: '紅區', body: '紅區最賺, 標記滿 5 個就失控' },
    { title: '目標', body: '7 天內賺到越多名聲越好' }
  ];
  function frameBox(ctx, x, y, w, h) {
    rr(ctx, x, y, w, h, 16); ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.stroke();
  }
  function clipBox(ctx, x, y, w, h) { ctx.beginPath(); rr(ctx, x, y, w, h, 16); ctx.clip(); }
  function tag(ctx, str, x, y, col) { text(ctx, str, x, y, { size: 20, color: col || '#ffffff' }); }
  function bigCross(ctx, x, y, r) {
    ctx.save(); ctx.lineCap = 'round';
    ctx.lineWidth = 14; ctx.strokeStyle = P.ink;
    ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); ctx.stroke();
    ctx.lineWidth = 8; ctx.strokeStyle = P.bad; ctx.stroke();
    ctx.restore();
  }

  function guide0(ctx) {
    // 地下城一角
    frameBox(ctx, 40, 230, 640, 520);
    ctx.save(); clipBox(ctx, 40, 230, 640, 520);
    var map = ['##########', '#........#', '#........#', '#..LL....#', '#........#', '#........#', '#........#', '#........#'];
    ctx.translate(60, 240); ctx.scale(1.0, 1.0);
    for (var r = 0; r < map.length; r++) for (var c = 0; c < map[r].length; c++) {
      var ch = map[r][c];
      drawTile(ctx, { x: 30 + c * 60, y: 30 + r * 60, dungeon: 'cave', kind: ch === '#' ? 'wall' : (ch === 'L' ? 'lava' : 'floor'), room: 'top', nest: false });
    }
    // 火圈預警(右邊那隻火蜥蜴)
    drawHazard(ctx, { x: 420, y: 330, kind: 'firering', phase: 'warn', radius: 120, t: 0.3, dur: 0.5 });
    drawWildMonster(ctx, { x: 420, y: 330, species: 'fire', hp: 10, maxHp: 10, hit: false, weak: false, stunLeft: 0, stunDur: 2, lassoed: false, casting: true, dashing: false, dir: -1 });
    // 馴獸師敲中火蜥蜴
    drawWeaponFx(ctx, { x: 120, y: 160, weapon: 'club', move: 'normal', shape: 'arc', angle: 0, spread: 100 * Math.PI / 180, radius: 70, t: 0.08, dur: 0.2 });
    drawWildMonster(ctx, { x: 190, y: 160, species: 'fire', hp: 6, maxHp: 10, hit: true, weak: false, stunLeft: 0, stunDur: 2, lassoed: false, casting: false, dashing: false, dir: -1 });
    drawTamer(ctx, { x: 120, y: 160, facing: 2, weapon: 'club', dashing: false, blink: false, lassoing: false });
    // 移動箭頭: 繞開火圈
    ctx.save();
    ctx.setLineDash([12, 9]); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(110, 200); ctx.quadraticCurveTo(140, 450, 300, 470); ctx.quadraticCurveTo(470, 490, 560, 470);
    ctx.lineWidth = 9; ctx.strokeStyle = P.ink; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.restore();
    roundArrow(ctx, 545, 474, 566, 468, '#ffffff', 5);
    keycap(ctx, 120, 330, '方向鍵', 84);
    keycap(ctx, 190, 70, 'Z', 40);
    ctx.restore();
    // 下方小圖: X = 武器技(長槍突進)
    frameBox(ctx, 40, 780, 640, 300);
    ctx.save(); clipBox(ctx, 40, 780, 640, 300);
    for (var c2 = 0; c2 < 11; c2++) for (var r2 = 0; r2 < 5; r2++) drawTile(ctx, { x: 70 + c2 * 60, y: 810 + r2 * 60, dungeon: 'cave', kind: 'floor', room: 'hall', nest: false });
    drawWeaponFx(ctx, { x: 170, y: 930, weapon: 'spear', move: 'skill', shape: 'dash', angle: 0, length: 220, t: 0.05, dur: 0.25 });
    drawWildMonster(ctx, { x: 290, y: 930, species: 'water', hp: 4, maxHp: 7, hit: true, weak: false, stunLeft: 0, stunDur: 2, lassoed: false, casting: false, dashing: false, dir: -1 });
    drawTamer(ctx, { x: 390, y: 930, facing: 2, weapon: 'spear', dashing: true, blink: false, lassoing: false });
    keycap(ctx, 520, 930, 'X', 40);
    tag(ctx, '武器技(商店買武器)', 360, 1040, P.textDim);
    ctx.restore();
  }

  function guide1(ctx) {
    // 左: 準備捕捉
    frameBox(ctx, 30, 230, 320, 560);
    frameBox(ctx, 370, 230, 320, 560);
    ctx.save(); clipBox(ctx, 30, 230, 320, 560);
    for (var c = 0; c < 6; c++) for (var r = 0; r < 10; r++) drawTile(ctx, { x: 30 + c * 60, y: 230 + r * 60, dungeon: 'cave', kind: 'floor', room: 'bottom', nest: false });
    drawWildMonster(ctx, { x: 190, y: 470, species: 'water', hp: 2, maxHp: 7, hit: false, weak: true, stunLeft: 0, stunDur: 2, lassoed: false, casting: false, dashing: false, dir: 1 });
    drawTamer(ctx, { x: 204, y: 492, facing: 7, weapon: 'club', dashing: false, blink: false, lassoing: false });
    drawCaptureRing(ctx, { x: 190, y: 470, t: 0.4, dur: 0.8 });
    tag(ctx, '① 站上去等它填滿', 190, 720, P.textDim);
    ctx.restore();
    // 右: 套索繞圈
    ctx.save(); clipBox(ctx, 370, 230, 320, 560);
    for (var c2 = 0; c2 < 6; c2++) for (var r2 = 0; r2 < 10; r2++) drawTile(ctx, { x: 370 + c2 * 60, y: 230 + r2 * 60, dungeon: 'cave', kind: 'floor', room: 'bottom', nest: false });
    var mx = 530, my = 470;
    // 繞圈路線(箭頭)
    ctx.save(); ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.arc(mx, my, 100, Math.PI * 0.75, Math.PI * 2.25);
    ctx.lineWidth = 8; ctx.strokeStyle = P.ink; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.restore();
    var ea = Math.PI * 2.25;
    roundArrow(ctx, mx + Math.cos(ea - 0.15) * 100, my + Math.sin(ea - 0.15) * 100, mx + Math.cos(ea) * 100, my + Math.sin(ea) * 100, '#ffffff', 5);
    var ta = Math.PI * 0.75;
    var tx = mx + Math.cos(ta) * 100, ty = my + Math.sin(ta) * 100;
    drawLasso(ctx, { x1: tx, y1: ty, x2: mx, y2: my, progress: 0.5, t: 1.5, limit: 5, len: 100, maxLen: 220 });
    drawWildMonster(ctx, { x: mx, y: my, species: 'water', hp: 2, maxHp: 7, hit: false, weak: true, stunLeft: 0, stunDur: 2, lassoed: true, casting: false, dashing: false, dir: -1 });
    drawTamer(ctx, { x: tx, y: ty, facing: 1, weapon: 'club', dashing: false, blink: false, lassoing: true });
    tag(ctx, '② 繞牠一圈', 530, 720, P.textDim);
    ctx.restore();
    // 角落: 收服!
    frameBox(ctx, 210, 830, 300, 200);
    ctx.save(); clipBox(ctx, 210, 830, 300, 200);
    for (var c3 = 0; c3 < 5; c3++) for (var r3 = 0; r3 < 4; r3++) drawTile(ctx, { x: 240 + c3 * 60, y: 860 + r3 * 60, dungeon: 'cave', kind: 'floor', room: 'bottom', nest: false });
    drawTamer(ctx, { x: 360, y: 980, facing: 0, weapon: 'club', dashing: false, blink: false, lassoing: false });
    drawFloatText(ctx, { x: 360, y: 920, text: '收服!', kind: 'capture', t: 0.2, dur: 1 });
    ctx.restore();
  }

  function setupScene(ctx, cursor) {
    // 以遊戲座標畫布置第 2 步(只取 y 120~1280)
    drawShowArena(ctx);
    for (var c = 0; c < 3; c++) for (var r = 0; r < 4; r++) {
      var fx = 160 + 200 * c, fy = 360 + 180 * r;
      if (c === 1 && r === 1) drawFloorTile(ctx, { x: fx, y: fy, kind: 'chili', fired: false, firedT: 0, firedDur: 0.4 });
      if (c === 2 && r === 2) drawFloorTile(ctx, { x: fx, y: fy, kind: 'ice', fired: false, firedT: 0, firedDur: 0.4 });
    }
    for (var c2 = 0; c2 < 3; c2++) for (var r2 = 0; r2 < 4; r2++) {
      drawSetupCell(ctx, { x: 160 + 200 * c2, y: 360 + 180 * r2, selected: cursor && c2 === 1 && r2 === 2 });
    }
    drawShowMonster(ctx, showMon('fire', 160, 540, 60, 1));
    drawShowMonster(ctx, showMon('water', 560, 540, 60, -1));
    for (var i = 0; i < 6; i++) {
      drawFence(ctx, { x: 110 + 100 * i, y: 255, side: 'top', broken: false });
      drawFence(ctx, { x: 110 + 100 * i, y: 1005, side: 'bottom', broken: false });
      drawVisitor(ctx, { x: 110 + 100 * i, y: 190, side: 'top', mode: 'watch' });
      drawVisitor(ctx, { x: 110 + 100 * i, y: 1080, side: 'bottom', mode: 'watch' });
    }
  }
  function showMon(spc, x, y, rage, dir, extra) {
    var m = { x: x, y: y, species: spc, level: 0, rage: rage, redLow: 80, marks: 0, markLeft: 0, markDur: 4, mode: 'roam', performing: false, performT: 0, performDur: 0.5, fx: 'none', fxT: 0, fxDur: 0.5, flyT: 0, flyDur: 0.4, chargeT: 0, chargeDur: 1.5, looseT: 0, looseDur: 6, dashing: false, dir: dir };
    if (extra) for (var k in extra) m[k] = extra[k];
    return m;
  }
  function guide2(ctx) {
    // 上: 布置畫面縮圖(遊戲座標 y 120~1280, 縮 0.5)
    frameBox(ctx, 24, 222, 376, 596);
    ctx.save(); clipBox(ctx, 24, 222, 376, 596);
    ctx.translate(32, 230 - 120 * 0.5); ctx.scale(0.5, 0.5);
    setupScene(ctx, true);
    drawSetupInfo(ctx, { gold: 10, floors: 2 });
    drawButton(ctx, { x: 480, y: 1160, w: 180, h: 100, label: '開演', selected: false });
    ctx.restore();
    // 右: 打開的選擇面板(遊戲畫法, 縮 0.58)
    ctx.save();
    var ps = 0.58;
    ctx.translate(414 - 120 * ps, 240 - 240 * ps); ctx.scale(ps, ps);
    drawPickerPanel(ctx, { index: 0, options: [
      { type: 'floor', key: 'chili', name: '辣椒田', cost: 10, desc: '走進來的魔物會生氣', affordable: true },
      { type: 'floor', key: 'ice', name: '冰池', cost: 10, desc: '走進來的魔物會冷靜', affordable: true },
      { type: 'floor', key: 'spring', name: '彈跳板', cost: 15, desc: '把走進來的魔物彈去撞別隻', affordable: false },
      { type: 'floor', key: 'stage', name: '聚光舞台', cost: 20, desc: '走進來的魔物立刻表演', affordable: false },
      { type: 'clear', key: 'clear', name: '清空', cost: 0, desc: '', affordable: true }
    ] });
    ctx.restore();
    // 面板指向游標格(游標格中心在縮圖上的位置)
    var cx = 32 + 360 * 0.5, cy = 230 + (720 - 120) * 0.5;
    roundArrow(ctx, 430, 520, cx + 52, cy - 10, '#ffffff', 4);
    tag(ctx, '游標格按 Z', 552, 560, P.textDim);
    // 下: 開演後, 火蜥蜴走進辣椒田
    roundArrow(ctx, 212, 830, 260, 882, '#ffffff', 6);
    tag(ctx, '開演後', 330, 856, P.textDim);
    frameBox(ctx, 160, 900, 440, 300);
    ctx.save(); clipBox(ctx, 160, 900, 440, 300);
    var sc = 0.8;
    ctx.translate(380 - 330 * sc, 1050 - 540 * sc); ctx.scale(sc, sc);
    drawShowArena(ctx);
    drawFloorTile(ctx, { x: 360, y: 540, kind: 'chili', fired: true, firedT: 0.12, firedDur: 0.4 });
    drawSetupCell(ctx, { x: 160, y: 540, selected: false });
    drawSetupCell(ctx, { x: 360, y: 540, selected: false });
    drawSetupCell(ctx, { x: 560, y: 540, selected: false });
    drawShowMonster(ctx, showMon('fire', 278, 545, 75, 1, { fx: 'ignited', fxT: 0.12 }));
    // 走過來的路線
    ctx.save(); ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(170, 600); ctx.lineTo(240, 600); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.stroke(); ctx.restore();
    ctx.restore();
  }

  function guide3(ctx) {
    // 上: 紅區表演 ×2
    frameBox(ctx, 40, 230, 640, 380);
    ctx.save(); clipBox(ctx, 40, 230, 640, 380);
    ctx.fillStyle = P.arena; ctx.fillRect(40, 230, 640, 380);
    ctx.save(); ctx.translate(360, 450); ctx.scale(1.8, 1.8); ctx.translate(-360, -450);
    drawShowMonster(ctx, showMon('fire', 360, 450, 88, 1, { performing: true, performT: 0.15 }));
    ctx.restore();
    drawFloatText(ctx, { x: 360, y: 300, text: '+8 ×2', kind: 'redGold', t: 0.1, dur: 1 });
    // 指示: 紅區段(放大後怒氣條在 y 450 - 50*1.8 = 360)
    var barY = 450 - 50 * 1.8 + 6 * 1.8;
    var rx = 360 + (-45 + 90 * 0.8) * 1.8;
    roundArrow(ctx, 560, barY + 40, rx + 16, barY + 12, '#ffffff', 4);
    tag(ctx, '紅區', 590, barY + 56, P.rule);
    ctx.restore();
    // 下: 4 個標記 → 失控撞圍欄
    frameBox(ctx, 40, 640, 290, 440);
    frameBox(ctx, 390, 640, 290, 440);
    ctx.save(); clipBox(ctx, 40, 640, 290, 440);
    ctx.fillStyle = P.arena; ctx.fillRect(40, 640, 290, 440);
    ctx.save(); ctx.translate(185, 880); ctx.scale(1.6, 1.6); ctx.translate(-185, -880);
    drawShowMonster(ctx, showMon('stone', 185, 880, 100, 1, { marks: 4, markLeft: 2.5, markDur: 4 }));
    ctx.restore();
    tag(ctx, '標記 4 個', 185, 1040, P.textDim);
    ctx.restore();
    roundArrow(ctx, 336, 860, 384, 860, '#ffffff', 6);
    ctx.save(); clipBox(ctx, 390, 640, 290, 440);
    ctx.fillStyle = P.stand; ctx.fillRect(390, 640, 290, 120);
    ctx.fillStyle = P.arena; ctx.fillRect(390, 776, 290, 304);
    drawVisitor(ctx, { x: 470, y: 700, side: 'top', mode: 'scared' });
    drawVisitor(ctx, { x: 600, y: 700, side: 'top', mode: 'watch' });
    drawFence(ctx, { x: 470, y: 768, side: 'top', broken: false });
    drawFence(ctx, { x: 570, y: 768, side: 'top', broken: false });
    ctx.save(); ctx.translate(535, 900); ctx.scale(1.4, 1.4); ctx.translate(-535, -900);
    drawShowMonster(ctx, showMon('stone', 535, 900, 100, -1, { mode: 'charge', chargeT: 0.5 }));
    ctx.restore();
    roundArrow(ctx, 535, 830, 520, 790, P.rule, 5);
    bigCross(ctx, 640, 1036, 22);
    tag(ctx, '失控', 535, 1040, P.rule);
    ctx.restore();
  }

  function guide4(ctx) {
    var cx = 360, cy = 600, R = 230;
    var nodes = [
      { a: -Math.PI / 2, label: '地下城' },
      { a: 0, label: '布置' },
      { a: Math.PI / 2, label: '表演' },
      { a: Math.PI, label: '商店' }
    ];
    // 弧箭頭
    for (var i = 0; i < 4; i++) {
      var a0 = nodes[i].a + 0.42, a1 = nodes[i].a + Math.PI / 2 - 0.42;
      ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1);
      ctx.lineWidth = 10; ctx.strokeStyle = P.ink; ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      roundArrow(ctx, cx + Math.cos(a1 - 0.1) * R, cy + Math.sin(a1 - 0.1) * R, cx + Math.cos(a1) * R, cy + Math.sin(a1) * R, '#ffffff', 6);
    }
    for (var j = 0; j < 4; j++) {
      var nx = cx + Math.cos(nodes[j].a) * R, ny = cy + Math.sin(nodes[j].a) * R;
      rr(ctx, nx - 80, ny - 70, 160, 140, 18); ctx.fillStyle = P.panelHi; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.stroke();
      ctx.save();
      if (j === 0) drawTamer(ctx, { x: nx, y: ny - 14, facing: 4, weapon: 'club', dashing: false, blink: false, lassoing: false });
      else if (j === 1) { ctx.translate(nx - 40, ny - 50); ctx.scale(0.4, 0.4); floorPattern(ctx, 'chili', 0, 0, -1); }
      else if (j === 2) { ctx.translate(nx, ny - 12); creature(ctx, 'water', 30, { dir: 1 }); }
      else { coin(ctx, nx - 18, ny - 14, 18); coin(ctx, nx + 14, ny - 20, 18); }
      ctx.restore();
      text(ctx, nodes[j].label, nx, ny + 46, { size: 24 });
    }
    // 中央 ×7 天
    text(ctx, '×7 天', cx, cy, { size: 52, color: P.gold });
    // 表演旁: 名聲往上加
    var sx = cx + 120, sy = cy + R;
    for (var k = 0; k < 3; k++) {
      star(ctx, sx + 16 + k * 18, sy - 10 - k * 26, 12); ctx.fillStyle = P.rep; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#8a6a10'; ctx.stroke();
    }
    text(ctx, '+名聲', sx + 70, sy - 70, { size: 22, color: P.rep, align: 'left' });
    // 終點: 結算星數
    roundArrow(ctx, cx, cy + R + 76, cx, cy + R + 150, '#ffffff', 6);
    rr(ctx, cx - 180, cy + R + 158, 360, 150, 18); ctx.fillStyle = P.panel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.gold; ctx.stroke();
    text(ctx, '第 7 天後結算', cx, cy + R + 190, { size: 22, color: P.textDim });
    for (var q = 0; q < 3; q++) {
      star(ctx, cx - 80 + q * 80, cy + R + 255, 30);
      ctx.fillStyle = q < 2 ? P.gold : 'rgba(255,255,255,0.12)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = q < 2 ? '#8a6a10' : 'rgba(255,255,255,0.3)'; ctx.stroke();
    }
  }
  var GUIDE_FN = [guide0, guide1, guide2, guide3, guide4];

  function drawGuidePage(ctx, state) {
    var s = O(state);
    var page = Math.round(N(s.page, 0)); if (page < 0) page = 0; if (page > 4) page = 4;
    var bx = N(s.x, 0), by = N(s.y, 0), bw = Math.max(1, N(s.w, 720)), bh = Math.max(1, N(s.h, 1280));
    var sc = Math.min(bw / 720, bh / 1280);
    ctx.save();
    ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
    ctx.translate(bx + (bw - 720 * sc) / 2, by + (bh - 1280 * sc) / 2);
    ctx.scale(sc, sc);
    ctx.fillStyle = P.bg; ctx.fillRect(0, 0, 720, 1280);
    text(ctx, '踩點地板秀', 360, 52, { size: 26, color: P.textDim });
    text(ctx, GUIDE[page].title, 360, 112, { size: 48 });
    text(ctx, GUIDE[page].body, 360, 180, { size: 30, color: P.gold });
    ctx.save();
    GUIDE_FN[page](ctx);
    ctx.restore();
    // 頁碼點 + 翻頁提示
    for (var i = 0; i < 5; i++) {
      circle(ctx, 360 - 48 + i * 24, 1180, i === page ? 8 : 6);
      ctx.fillStyle = i === page ? '#ffffff' : 'rgba(255,255,255,0.25)'; ctx.fill();
    }
    text(ctx, (page + 1) + ' / 5', 560, 1180, { size: 20, color: P.textDim });
    keycap(ctx, 300, 1236, 'Z', 40);
    text(ctx, page === 4 ? '按 Z 開始' : '按 Z 繼續', 330, 1236, { size: 24, align: 'left' });
    ctx.restore();
  }

  window.Art = {
    canvas: { width: 720, height: 1280 },
    palette: {
      bg: P.bg, player: P.you, text: P.text, textDim: P.textDim, panel: P.panel, select: P.select,
      gold: P.gold, rep: P.rep, rule: P.rule, ignite: P.ignite, douse: P.douse, ok: P.ok, bad: P.bad,
      fire: P.fire, water: P.water, thunder: P.thunder, spike: P.spike, stone: P.stone, ghost: P.ghost,
      chili: P.chili, ice: P.ice, spring: P.spring, stage: P.stage, arena: P.arena, stand: P.stand
    },
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
    drawFloorTile: drawFloorTile,
    drawSlamFx: drawSlamFx,
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
