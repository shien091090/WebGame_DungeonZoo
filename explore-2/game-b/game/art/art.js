/* 怪獸夜場節目單 — 美術(Canvas 2D 幾何繪製, 無外部資源)
 * 全域 window.Art; 每個函式自己 save/restore。
 * 函式與 state 欄位照 interface.json, 詳見 style.md。
 */
(function () {
  'use strict';

  var W = 720, H = 1280;
  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';

  // ---------- 色票 ----------
  var P = {
    bg: '#16142b', bgDeep: '#0e0c1e',
    panel: '#25223f', panelHi: '#36325e', line: '#4a4570',
    text: '#f4f0ff', textDim: '#a9a3c8', ink: '#120f22',
    select: '#fff3c4',          // 象牙白 = 選中 / 可點目標 / 可按按鈕
    gold: '#ffd23f',            // 金幣
    rep: '#ff7ac0',             // 名聲(星)
    hp: '#62dd78',              // 血量
    rageCalm: '#7f8db8',        // 怒氣 < 40: 演不起來
    rageReady: '#ffb43a',       // 怒氣 40~79: 能演
    rageHot: '#ff5a36',         // 怒氣 80~99: 大場面, 快爆
    danger: '#ff3b4e',          // 失控 / 破掉 / 買不起 / 名聲減
    ok: '#56e07a',              // 成功 / 捕獲
    flop: '#8a93a8',            // 冷場
    ally: '#4f8cff',            // 我方底座 / 英雄披風
    enemy: '#b0304e',           // 敵方底座
    calm: '#5ab8ff',            // 怒氣減少
    stageWall: '#24162e', curtain: '#8a1f3a', floor: '#6b4a30', crowd: '#2e2644',
    fire: '#ff7a2e', water: '#3fd6e8', thunder: '#a77bff', stone: '#9aa3ad',
    hero: '#d9dde8'
  };

  var SP = {
    fire:    { name: '火蜥蜴', color: P.fire,    dark: '#b8431a', light: '#ffc08a' },
    water:   { name: '水母',   color: P.water,   dark: '#1f8a9c', light: '#b8f4fb' },
    thunder: { name: '雷鳥',   color: P.thunder, dark: '#6440c0', light: '#d8c6ff' },
    stone:   { name: '石像鬼', color: P.stone,   dark: '#5d646d', light: '#d0d6dc' }
  };

  // ---------- 小工具 ----------
  function hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    var A = hex2rgb(a), B = hex2rgb(b);
    var r = Math.round(A[0] + (B[0] - A[0]) * t), g = Math.round(A[1] + (B[1] - A[1]) * t), bl = Math.round(A[2] + (B[2] - A[2]) * t);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
  }
  function rgba(hex, a) { var c = hex2rgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function num(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; }

  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r);
    c.lineTo(x + w, y + h - r); c.arcTo(x + w, y + h, x + w - r, y + h, r);
    c.lineTo(x + r, y + h); c.arcTo(x, y + h, x, y + h - r, r);
    c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r);
    c.closePath();
  }
  function ellipse(c, x, y, rx, ry) {
    c.beginPath();
    if (c.ellipse) c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    else { c.save(); c.translate(x, y); c.scale(rx, ry); c.arc(0, 0, 1, 0, Math.PI * 2); c.restore(); }
  }
  function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); }
  function poly(c, pts) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); }

  // 文字: 預設粗體 + 深色描邊(P10 不靠底色)
  function text(c, s, x, y, size, color, o) {
    o = o || {};
    c.font = (o.bold === false ? '' : 'bold ') + size + 'px ' + FONT;
    c.textAlign = o.align || 'center';
    c.textBaseline = o.base || 'middle';
    if (o.stroke !== false) {
      c.lineJoin = 'round';
      c.lineWidth = o.sw || Math.max(3, size * 0.2);
      c.strokeStyle = o.stroke || P.ink;
      c.strokeText(String(s), x, y);
    }
    c.fillStyle = color;
    c.fillText(String(s), x, y);
  }

  function star(c, x, y, r, fill, stroke, lw) {
    c.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r;
      var px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
      if (i) c.lineTo(px, py); else c.moveTo(px, py);
    }
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.lineWidth = lw || 2; c.strokeStyle = stroke; c.lineJoin = 'round'; c.stroke(); }
  }
  function coin(c, x, y, r) {
    circle(c, x, y, r); c.fillStyle = P.gold; c.fill();
    c.lineWidth = Math.max(2, r * 0.18); c.strokeStyle = '#8a5a00'; c.stroke();
    circle(c, x, y, r * 0.55); c.lineWidth = Math.max(1.5, r * 0.12); c.strokeStyle = '#c98a00'; c.stroke();
  }
  function check(c, x, y, s, color, lw) {
    c.beginPath(); c.moveTo(x - s, y); c.lineTo(x - s * 0.3, y + s * 0.7); c.lineTo(x + s, y - s * 0.7);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.lineWidth = lw + 4; c.strokeStyle = P.ink; c.stroke();
    c.lineWidth = lw; c.strokeStyle = color; c.stroke();
  }
  function cross(c, x, y, s, color, lw) {
    c.beginPath(); c.moveTo(x - s, y - s); c.lineTo(x + s, y + s); c.moveTo(x + s, y - s); c.lineTo(x - s, y + s);
    c.lineCap = 'round';
    c.lineWidth = lw + 4; c.strokeStyle = P.ink; c.stroke();
    c.lineWidth = lw; c.strokeStyle = color; c.stroke();
  }
  // 圓頭箭頭(不用尖刺語彙)
  function arrowLine(c, x1, y1, x2, y2, color, lw, cx, cy) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    var ang;
    c.beginPath(); c.moveTo(x1, y1);
    if (cx !== undefined) { c.quadraticCurveTo(cx, cy, x2, y2); ang = Math.atan2(y2 - cy, x2 - cx); }
    else { c.lineTo(x2, y2); ang = Math.atan2(y2 - y1, x2 - x1); }
    c.lineWidth = lw + 4; c.strokeStyle = P.ink; c.stroke();
    c.lineWidth = lw; c.strokeStyle = color; c.stroke();
    var L = lw * 3.2;
    c.beginPath();
    c.moveTo(x2 - Math.cos(ang - 0.6) * L, y2 - Math.sin(ang - 0.6) * L);
    c.lineTo(x2, y2);
    c.lineTo(x2 - Math.cos(ang + 0.6) * L, y2 - Math.sin(ang + 0.6) * L);
    c.lineWidth = lw + 4; c.strokeStyle = P.ink; c.stroke();
    c.lineWidth = lw; c.strokeStyle = color; c.stroke();
  }

  function rageColor(r) { return r >= 80 ? P.rageHot : r >= 40 ? P.rageReady : P.rageCalm; }

  // 血條: 單一綠色, 長度 = 剩餘比例
  function hpBar(c, x, y, w, h, hp, max) {
    var f = clamp(num(hp, 0) / Math.max(1, num(max, 1)), 0, 1);
    rr(c, x - 2, y - 2, w + 4, h + 4, (h + 4) / 2); c.fillStyle = P.ink; c.fill();
    rr(c, x, y, w, h, h / 2); c.fillStyle = '#2b3a33'; c.fill();
    if (f > 0) { rr(c, x, y, Math.max(h, w * f), h, h / 2); c.fillStyle = P.hp; c.fill(); }
  }
  // 怒氣條: 以 100 為滿; 40 / 80 兩道刻度; 填色依區段換; >=100 失控紅
  function rageBar(c, x, y, w, h, rage, ghost) {
    var r = clamp(num(rage, 0), 0, 100);
    rr(c, x - 2, y - 2, w + 4, h + 4, 4); c.fillStyle = P.ink; c.fill();
    rr(c, x, y, w, h, 3); c.fillStyle = '#2a2640'; c.fill();
    if (ghost !== undefined && ghost > r) { // 說明頁用: 變短前的長度(虛框)
      c.save(); c.setLineDash([4, 3]); c.lineWidth = 2; c.strokeStyle = P.textDim;
      c.strokeRect(x + w * r / 100, y + 1, w * (Math.min(ghost, 100) - r) / 100, h - 2); c.restore();
    }
    if (r > 0) {
      rr(c, x, y, Math.max(4, w * r / 100), h, 3);
      c.fillStyle = r >= 100 ? P.danger : rageColor(r); c.fill();
    }
    // 刻度 40 / 80
    c.fillStyle = P.select;
    c.fillRect(x + w * 0.4 - 1.5, y - 3, 3, h + 6);
    c.fillRect(x + w * 0.8 - 1.5, y - 3, 3, h + 6);
  }

  // ---------- 魔物本體 ----------
  // o: { face: normal|angry|wild|ko|sleepy, gray, flash, squash }
  function mon(c, sp, x, y, s, o) {
    var info = SP[sp]; if (!info) return;
    o = o || {};
    function tone(col) { return o.gray ? mix(col, '#6b7080', 0.78) : o.flash ? mix(col, '#ffffff', 0.6) : (o.cold ? mix(col, '#7f8db8', 0.45) : col); }
    var main = tone(info.color), dark = tone(info.dark), light = tone(info.light), yel = tone('#ffd23f');
    var ink = o.gray ? '#24262e' : P.ink;
    c.save();
    c.translate(x, y); c.scale(s, s * (o.squash || 1));
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = ink; c.lineWidth = 3;
    var eyes;
    if (sp === 'fire') {
      c.beginPath(); c.moveTo(-18, 14); c.quadraticCurveTo(-46, 10, -38, -16);
      c.lineWidth = 14; c.strokeStyle = ink; c.stroke();
      c.lineWidth = 8; c.strokeStyle = main; c.stroke();
      c.beginPath(); c.moveTo(-38, -40); c.quadraticCurveTo(-26, -24, -38, -14); c.quadraticCurveTo(-50, -24, -38, -40); c.closePath();
      c.fillStyle = yel; c.fill(); c.lineWidth = 2.5; c.strokeStyle = ink; c.stroke();
      c.lineWidth = 3;
      ellipse(c, -14, 30, 7, 5); c.fillStyle = dark; c.fill(); c.stroke();
      ellipse(c, 14, 30, 7, 5); c.fill(); c.stroke();
      ellipse(c, 0, 14, 28, 18); c.fillStyle = main; c.fill(); c.stroke();
      ellipse(c, 2, 21, 15, 7); c.fillStyle = light; c.fill();
      circle(c, 24, -4, 17); c.fillStyle = main; c.fill(); c.stroke();
      eyes = [[19, -8], [30, -8]];
    } else if (sp === 'water') {
      var tx = [-20, -7, 7, 20];
      for (var i = 0; i < 4; i++) {
        c.beginPath(); c.moveTo(tx[i], 6); c.quadraticCurveTo(tx[i] + 9, 20, tx[i], 26); c.quadraticCurveTo(tx[i] - 8, 32, tx[i] + 2, 40);
        c.lineWidth = 8; c.strokeStyle = ink; c.stroke();
        c.lineWidth = 4; c.strokeStyle = light; c.stroke();
      }
      c.lineWidth = 3; c.strokeStyle = ink;
      c.beginPath(); c.moveTo(-34, 8); c.bezierCurveTo(-36, -42, 36, -42, 34, 8);
      c.quadraticCurveTo(25, 14, 17, 8); c.quadraticCurveTo(8, 14, 0, 8); c.quadraticCurveTo(-8, 14, -17, 8); c.quadraticCurveTo(-25, 14, -34, 8);
      c.closePath(); c.fillStyle = main; c.fill(); c.stroke();
      circle(c, -16, -16, 5); c.fillStyle = light; c.fill();
      circle(c, 12, -22, 3); c.fill();
      eyes = [[-10, -4], [10, -4]];
    } else if (sp === 'thunder') {
      c.fillStyle = dark;
      poly(c, [-20, -4, -46, -18, -38, 2, -46, 14, -20, 14]); c.fill(); c.stroke();
      poly(c, [20, -4, 46, -18, 38, 2, 46, 14, 20, 14]); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-8, 28); c.lineTo(-8, 38); c.moveTo(8, 28); c.lineTo(8, 38); c.lineWidth = 4; c.strokeStyle = yel; c.stroke();
      c.lineWidth = 3; c.strokeStyle = ink;
      poly(c, [-9, -18, -3, -38, 1, -28, 8, -40, 9, -18]); c.fillStyle = yel; c.fill(); c.stroke();
      circle(c, 0, 4, 26); c.fillStyle = main; c.fill(); c.stroke();
      ellipse(c, 0, 16, 14, 8); c.fillStyle = light; c.fill();
      poly(c, [-7, 4, 7, 4, 0, 16]); c.fillStyle = yel; c.fill(); c.stroke();
      eyes = [[-10, -6], [10, -6]];
    } else { // stone
      c.fillStyle = dark;
      poly(c, [-20, -10, -46, -26, -40, -6, -48, 8, -20, 14]); c.fill(); c.stroke();
      poly(c, [20, -10, 46, -26, 40, -6, 48, 8, 20, 14]); c.fill(); c.stroke();
      poly(c, [-20, -22, -14, -40, -8, -22]); c.fill(); c.stroke();
      poly(c, [20, -22, 14, -40, 8, -22]); c.fill(); c.stroke();
      rr(c, -18, 26, 12, 10, 3); c.fill(); c.stroke();
      rr(c, 6, 26, 12, 10, 3); c.fill(); c.stroke();
      rr(c, -24, -24, 48, 52, 9); c.fillStyle = main; c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-14, 10); c.lineTo(-6, 16); c.lineTo(-10, 22); c.moveTo(12, 6); c.lineTo(6, 14);
      c.lineWidth = 2; c.strokeStyle = dark; c.stroke();
      eyes = [[-10, -8], [10, -8]];
    }
    face(c, eyes, o.face || 'normal', ink);
    c.restore();
  }
  function face(c, eyes, mode, ink) {
    c.lineCap = 'round';
    for (var i = 0; i < eyes.length; i++) {
      var ex = eyes[i][0], ey = eyes[i][1], side = i === 0 ? -1 : 1;
      if (mode === 'ko') {
        c.beginPath(); c.moveTo(ex - 4, ey - 4); c.lineTo(ex + 4, ey + 4); c.moveTo(ex + 4, ey - 4); c.lineTo(ex - 4, ey + 4);
        c.lineWidth = 2.5; c.strokeStyle = ink; c.stroke();
      } else if (mode === 'sleepy') {
        c.beginPath(); c.moveTo(ex - 4.5, ey); c.quadraticCurveTo(ex, ey + 3, ex + 4.5, ey);
        c.lineWidth = 2.5; c.strokeStyle = ink; c.stroke();
      } else {
        circle(c, ex, ey, 5); c.fillStyle = mode === 'wild' ? P.danger : '#ffffff'; c.fill();
        c.lineWidth = 1.5; c.strokeStyle = ink; c.stroke();
        circle(c, ex, ey + 0.5, mode === 'wild' ? 1.6 : 2.4); c.fillStyle = mode === 'angry' ? '#b0102a' : ink; c.fill();
        if (mode === 'angry' || mode === 'wild') {
          // 眉: 外高內低(左眼外側在左, 右眼外側在右)
          c.beginPath(); c.moveTo(ex + 6 * side, ey - 10); c.lineTo(ex - 5 * side, ey - 6);
          c.lineWidth = 2.8; c.strokeStyle = ink; c.stroke();
        }
      }
    }
  }

  // 英雄本體(以 (0,0) 為中心, 約 ±40 × −58..34)
  function heroBody(c, attacking, flash, gray) {
    function tone(col) { return gray ? mix(col, '#6b7080', 0.78) : flash ? mix(col, '#ffffff', 0.6) : col; }
    var ink = gray ? '#24262e' : P.ink;
    c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = ink; c.lineWidth = 3;
    poly(c, [-22, -6, 22, -6, 30, 32, -30, 32]); c.fillStyle = tone(P.ally); c.fill(); c.stroke();
    rr(c, -15, -8, 30, 34, 8); c.fillStyle = tone(P.hero); c.fill(); c.stroke();
    // 劍
    c.save();
    c.translate(22, 6); c.rotate(attacking ? 0.75 : 0);
    rr(c, -3, -44, 6, 40, 3); c.fillStyle = tone('#eef2ff'); c.fill(); c.stroke();
    rr(c, -10, -6, 20, 6, 3); c.fillStyle = tone(P.gold); c.fill(); c.stroke();
    rr(c, -3, 0, 6, 10, 2); c.fillStyle = tone('#7a4a2a'); c.fill(); c.stroke();
    c.restore();
    // 盾
    circle(c, -24, 10, 13); c.fillStyle = tone(P.ally); c.fill(); c.stroke();
    circle(c, -24, 10, 6); c.fillStyle = tone(P.gold); c.fill();
    // 頭 + 盔
    circle(c, 0, -26, 15); c.fillStyle = tone('#f2c79a'); c.fill(); c.stroke();
    c.beginPath(); c.arc(0, -28, 16, Math.PI, 0); c.closePath(); c.fillStyle = tone(P.hero); c.fill(); c.stroke();
    rr(c, -3, -50, 6, 10, 3); c.fillStyle = tone(P.gold); c.fill(); c.stroke();
    if (gray) face(c, [[-6, -22], [6, -22]], 'ko', ink);
    else { circle(c, -5, -22, 2.4); c.fillStyle = ink; c.fill(); circle(c, 5, -22, 2.4); c.fill(); }
  }

  // 捕獸籠本體(約 ±26 × −36..28)
  function cageBody(c, col, part) {
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = P.ink;
    var bars = [-16, -6, 4, 14];
    if (part !== 'right') {
      // 頂環 + 圓頂
      if (!part) { circle(c, 0, -30, 5); c.lineWidth = 6; c.stroke(); c.lineWidth = 3; c.strokeStyle = col; c.stroke(); }
    }
    c.beginPath();
    if (part === 'left') { c.arc(0, -4, 22, Math.PI, Math.PI * 1.5); }
    else if (part === 'right') { c.arc(0, -4, 22, Math.PI * 1.5, 0); }
    else { c.arc(0, -4, 22, Math.PI, 0); }
    c.lineWidth = 8; c.strokeStyle = P.ink; c.stroke(); c.lineWidth = 4; c.strokeStyle = col; c.stroke();
    c.beginPath();
    for (var i = 0; i < bars.length; i++) {
      var bx = bars[i];
      if (part === 'left' && bx > 0) continue;
      if (part === 'right' && bx < 0) continue;
      var top = -4 - Math.sqrt(Math.max(0, 22 * 22 - bx * bx));
      c.moveTo(bx, top + 2); c.lineTo(bx, 18);
    }
    if (!part || part === 'left') { c.moveTo(-22, -4); c.lineTo(-22, 18); }
    if (!part || part === 'right') { c.moveTo(22, -4); c.lineTo(22, 18); }
    c.lineWidth = 6; c.strokeStyle = P.ink; c.stroke(); c.lineWidth = 3; c.strokeStyle = col; c.stroke();
    var bx0 = part === 'right' ? 0 : -26, bw = part ? 26 : 52;
    rr(c, bx0, 16, bw, 10, 3); c.fillStyle = mix(col, '#000000', 0.35); c.fill(); c.lineWidth = 2.5; c.strokeStyle = P.ink; c.stroke();
  }

  // 指示用游標(說明頁)
  function pointer(c, x, y, s) {
    s = s || 1;
    c.save(); c.translate(x, y); c.scale(s, s);
    circle(c, 0, 0, 16); c.lineWidth = 3; c.strokeStyle = rgba(P.select, 0.9); c.stroke();
    circle(c, 0, 0, 26); c.lineWidth = 2; c.strokeStyle = rgba(P.select, 0.45); c.stroke();
    poly(c, [0, 0, 0, 34, 9, 26, 15, 40, 21, 37, 15, 24, 26, 23]);
    c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = 3; c.strokeStyle = P.ink; c.lineJoin = 'round'; c.stroke();
    c.restore();
  }

  function withT(c, x, y, s, fn) { c.save(); c.translate(x, y); c.scale(s, s); fn(); c.restore(); }

  // ---------- 匯出 ----------
  var Art = {
    canvas: { width: W, height: H },
    palette: P,
    species: SP,

    drawBackground: function (ctx) {
      var c = ctx; c.save();
      c.fillStyle = P.bg; c.fillRect(0, 0, W, H);
      var g = c.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 820);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.restore();
    },

    drawBattleField: function (ctx, s) {
      var c = ctx; s = s || {}; c.save();
      // 敵區(上): 地城磚牆 + 暗紫地面
      c.fillStyle = '#1d1630'; c.fillRect(0, 120, W, 180);
      c.strokeStyle = '#2c2346'; c.lineWidth = 2;
      for (var row = 0; row < 5; row++) {
        var yy = 120 + row * 36;
        c.beginPath(); c.moveTo(0, yy); c.lineTo(W, yy); c.stroke();
        for (var col = 0; col < 9; col++) {
          var xx = col * 90 + (row % 2 ? 45 : 0);
          c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, yy + 36); c.stroke();
        }
      }
      // 火把
      [[40, 210], [680, 210]].forEach(function (p) {
        rr(c, p[0] - 5, p[1], 10, 34, 3); c.fillStyle = '#5a3a24'; c.fill();
        var gg = c.createRadialGradient(p[0], p[1] - 6, 2, p[0], p[1] - 6, 40);
        gg.addColorStop(0, 'rgba(255,190,90,0.55)'); gg.addColorStop(1, 'rgba(255,190,90,0)');
        c.fillStyle = gg; circle(c, p[0], p[1] - 6, 40); c.fill();
        c.beginPath(); c.moveTo(p[0], p[1] - 22); c.quadraticCurveTo(p[0] + 9, p[1] - 6, p[0], p[1]); c.quadraticCurveTo(p[0] - 9, p[1] - 6, p[0], p[1] - 22);
        c.fillStyle = '#ffb43a'; c.fill();
      });
      c.fillStyle = '#231b3a'; c.fillRect(0, 300, W, 300);
      // 我方區(下): 偏藍石板
      c.fillStyle = '#1a2240'; c.fillRect(0, 600, W, 520);
      c.strokeStyle = '#222c52'; c.lineWidth = 2;
      for (var i = 0; i < 6; i++) { c.beginPath(); c.moveTo(0, 640 + i * 80); c.lineTo(W, 640 + i * 80); c.stroke(); }
      // 中線
      c.fillStyle = '#0f0c1e'; c.fillRect(0, 596, W, 8);
      c.fillStyle = '#141020'; c.fillRect(0, 1120, W, 160);
      // 場次: 3 扇門, 打過的打勾、目前的亮
      var b = num(s.battle, 1);
      text(c, '第 ' + b + ' / 3 場', 360, 146, 20, P.textDim);
      for (var k = 0; k < 3; k++) {
        var dx = 300 + k * 60, dy = 168;
        var cur = k + 1 === b, past = k + 1 < b;
        rr(c, dx - 16, dy, 32, 30, 8);
        c.fillStyle = cur ? '#6a4a8a' : past ? '#2e2a44' : '#221d36'; c.fill();
        c.lineWidth = cur ? 3 : 2; c.strokeStyle = cur ? P.select : P.line; c.stroke();
        if (past) check(c, dx, dy + 15, 8, P.ok, 3);
      }
      c.restore();
    },

    drawHero: function (ctx, s) {
      var c = ctx; s = s || {}; c.save();
      var x = num(s.x, 0), y = num(s.y, 0);
      // 我方底座
      ellipse(c, x, y + 32, 44, 9); c.fillStyle = rgba(P.ally, 0.35); c.fill(); c.lineWidth = 3; c.strokeStyle = P.ally; c.stroke();
      if (s.down) {
        withT(c, x, y + 8, 0.82, function () { c.rotate(-Math.PI / 2); heroBody(c, false, false, true); });
      } else {
        var dx = s.hit ? 4 : 0, dy = s.attacking ? -8 : 0;
        withT(c, x + dx, y - 6 + dy, 1, function () { heroBody(c, !!s.attacking, !!s.hit, false); });
      }
      hpBar(c, x - 52, y + 46, 104, 10, s.hp, s.maxHp);
      c.restore();
    },

    drawAllyMonster: function (ctx, s) {
      var c = ctx; s = s || {}; c.save();
      var x = num(s.x, 0), y = num(s.y, 0);
      ellipse(c, x, y + 26, 44, 9); c.fillStyle = rgba(P.ally, 0.35); c.fill(); c.lineWidth = 3; c.strokeStyle = P.ally; c.stroke();
      if (s.down) {
        mon(c, s.species, x, y + 8, 0.92, { gray: true, face: 'ko', squash: 0.6 });
      } else {
        var dx = s.hit ? 4 : 0, dy = s.attacking ? -8 : 0;
        mon(c, s.species, x + dx, y - 16 + dy, 0.92, { flash: !!s.hit });
      }
      hpBar(c, x - 52, y + 38, 104, 8, s.hp, s.maxHp);
      rageBar(c, x - 52, y + 54, 78, 12, s.rage);
      text(c, Math.round(num(s.rage, 0)), x + 34, y + 60, 18, rageColor(num(s.rage, 0)), { align: 'left' });
      c.restore();
    },

    drawEnemy: function (ctx, s) {
      var c = ctx; s = s || {}; c.save();
      var x = num(s.x, 0), y = num(s.y, 0);
      // 敵方底座: 鋸齒暗紅圈
      c.beginPath();
      for (var i = 0; i < 24; i++) {
        var a = i / 24 * Math.PI * 2, k = i % 2 ? 0.78 : 1;
        var px = x + Math.cos(a) * 56 * k, py = y + 58 + Math.sin(a) * 11 * k;
        if (i) c.lineTo(px, py); else c.moveTo(px, py);
      }
      c.closePath(); c.fillStyle = rgba(P.enemy, 0.55); c.fill(); c.lineWidth = 2.5; c.strokeStyle = P.enemy; c.stroke();
      var dx = s.hit ? 4 : 0, dy = s.attacking ? 8 : 0;
      mon(c, s.species, x + dx, y + 2 + dy, 1.08, { face: 'angry', flash: !!s.hit });
      hpBar(c, x - 56, y - 74, 112, 10, s.hp, s.maxHp);
      c.restore();
    },

    drawCage: function (ctx, s) {
      var c = ctx; s = s || {}; c.save();
      var x = num(s.x, 0), y = num(s.y, 0), t = num(s.t, 0);
      c.translate(x, y);
      if (s.result === 'caught') {
        var pulse = clamp(t / 0.25, 0, 1);
        circle(c, 0, 0, 30 + 6 * pulse); c.lineWidth = 4; c.strokeStyle = rgba(P.ok, 0.85); c.stroke();
        cageBody(c, P.gold);
        circle(c, 0, 4, 9); c.fillStyle = rgba('#ffffff', 0.35); c.fill(); // 籠內的身影
        circle(c, 24, -24, 13); c.fillStyle = P.ok; c.fill(); c.lineWidth = 2.5; c.strokeStyle = P.ink; c.stroke();
        check(c, 24, -24, 7, '#ffffff', 3);
      } else if (s.result === 'broken') {
        var d = clamp(t / 0.35, 0, 1) * 8;
        c.globalAlpha = t > 0.7 ? clamp(1 - (t - 0.7) / 0.5, 0, 1) : 1;
        withT(c, -d, d * 0.5, 1, function () { c.rotate(-0.25 * d / 8); cageBody(c, P.flop, 'left'); });
        withT(c, d, d * 0.5, 1, function () { c.rotate(0.25 * d / 8); cageBody(c, P.flop, 'right'); });
        cross(c, 0, 0, 14, P.danger, 6);
      } else {
        c.rotate(Math.sin(t * 14) * 0.3);
        cageBody(c, P.gold);
      }
      c.restore();
    },

    drawTeamCard: function (ctx, s) {
      var c = ctx; s = s || {}; c.save();
      var x = num(s.x, 0), y = num(s.y, 0), sel = !!s.selected, dis = !!s.disabled && !sel;
      if (dis) c.globalAlpha = 0.45;
      rr(c, x - 98, y - 108, 196, 216, 16);
      c.fillStyle = sel ? P.panelHi : P.panel; c.fill();
      c.lineWidth = sel ? 6 : 2; c.strokeStyle = sel ? P.select : P.line; c.stroke();
      if (sel) {
        rr(c, x - 56, y - 104, 112, 32, 10); c.fillStyle = P.select; c.fill();
        text(c, '出戰', x, y - 88, 22, P.ink, { stroke: false });
      } else if (dis) {
        text(c, '名額滿', x, y - 88, 18, P.textDim);
      }
      mon(c, s.species, x, y - 26, 0.95, {});
      var info = SP[s.species];
      text(c, info ? info.name : '', x, y + 28, 22, P.text);
      text(c, '血', x - 82, y + 56, 18, P.hp);
      hpBar(c, x - 66, y + 50, 96, 12, s.hp, s.maxHp);
      text(c, Math.round(num(s.hp, 0)) + '/' + Math.round(num(s.maxHp, 0)), x + 90, y + 56, 18, P.text, { align: 'right' });
      var rg = num(s.rage, 0);
      text(c, '怒', x - 82, y + 86, 18, rageColor(rg));
      rageBar(c, x - 66, y + 79, 96, 14, rg);
      text(c, Math.round(rg), x + 90, y + 86, 20, rageColor(rg), { align: 'right' });
      c.restore();
    },

    drawStage: function (ctx, s) {
      var c = ctx; s = s || {}; c.save();
      var mode = s.mode || 'idle', t = num(s.t, 0), sp = s.species;
      var Y0 = 130, Y1 = 560;
      c.beginPath(); c.rect(0, Y0, W, Y1 - Y0); c.clip();
      // 後牆
      var g = c.createLinearGradient(0, Y0, 0, 420);
      g.addColorStop(0, '#1a1024'); g.addColorStop(1, P.stageWall);
      c.fillStyle = g; c.fillRect(0, Y0, W, 300);
      // 舞台地板
      poly(c, [50, 420, 670, 420, 720, 480, 0, 480]); c.fillStyle = P.floor; c.fill();
      c.strokeStyle = '#4e3420'; c.lineWidth = 2;
      for (var i = 1; i < 4; i++) { c.beginPath(); c.moveTo(50 - i * 12, 420 + i * 15); c.lineTo(670 + i * 12, 420 + i * 15); c.stroke(); }
      // 聚光
      var lit = mode === 'perform' || mode === 'riot';
      if (mode !== 'idle') {
        var spotCol = mode === 'riot' ? P.danger : mode === 'flop' ? '#7f8db8' : (SP[sp] ? SP[sp].color : P.select);
        c.beginPath(); c.moveTo(330, Y0); c.lineTo(390, Y0); c.lineTo(500, 450); c.lineTo(220, 450); c.closePath();
        c.fillStyle = rgba(spotCol, lit ? 0.22 : 0.1); c.fill();
        ellipse(c, 360, 446, 140, 18); c.fillStyle = rgba(spotCol, lit ? 0.35 : 0.15); c.fill();
      }
      // 大場面: 金色光芒
      if (mode === 'perform' && s.bigShow) {
        c.save(); c.translate(360, 330); c.rotate(t * 0.6);
        for (var r = 0; r < 12; r++) {
          c.rotate(Math.PI / 6);
          poly(c, [-10, -60, 10, -60, 26, -230, -26, -230]); c.fillStyle = rgba(P.gold, 0.18); c.fill();
        }
        c.restore();
      }
      // 演出者
      if (SP[sp]) {
        if (mode === 'perform') {
          var bob = Math.abs(Math.sin(t * 5)) * -14;
          var gl = c.createRadialGradient(360, 330, 10, 360, 330, 130);
          gl.addColorStop(0, rgba(SP[sp].color, 0.45)); gl.addColorStop(1, rgba(SP[sp].color, 0));
          c.fillStyle = gl; circle(c, 360, 330, 130); c.fill();
          mon(c, sp, 360, 340 + bob, 1.9, {});
        } else if (mode === 'flop') {
          mon(c, sp, 360, 372, 1.5, { face: 'sleepy', cold: true, squash: 0.85 });
        } else if (mode === 'riot') {
          var lunge = Math.abs(Math.sin(t * 8)) * 18;
          c.beginPath();
          for (var k = 0; k < 28; k++) {
            var a = k / 28 * Math.PI * 2, rad = k % 2 ? 66 : 92;
            var px = 360 + Math.cos(a) * rad, py = 430 + lunge + Math.sin(a) * rad * 0.8;
            if (k) c.lineTo(px, py); else c.moveTo(px, py);
          }
          c.closePath(); c.fillStyle = rgba(P.danger, 0.35); c.fill(); c.lineWidth = 4; c.strokeStyle = P.danger; c.stroke();
          mon(c, sp, 360, 430 + lunge, 1.5, { face: 'wild' });
        }
      }
      // 簾幕
      var open = mode === 'idle' ? 240 : 86;
      c.fillStyle = P.curtain;
      c.beginPath(); c.moveTo(0, Y0); c.lineTo(open, Y0); c.quadraticCurveTo(open - 30, 300, open + 10, 470); c.lineTo(0, 470); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(W, Y0); c.lineTo(W - open, Y0); c.quadraticCurveTo(W - open + 30, 300, W - open - 10, 470); c.lineTo(W, 470); c.closePath(); c.fill();
      c.strokeStyle = '#5e1228'; c.lineWidth = 3;
      for (var f = 1; f < 4; f++) {
        c.beginPath(); c.moveTo(open * f / 4, Y0); c.lineTo(open * f / 4 - 6, 470); c.stroke();
        c.beginPath(); c.moveTo(W - open * f / 4, Y0); c.lineTo(W - open * f / 4 + 6, 470); c.stroke();
      }
      // 上簷
      c.fillStyle = '#6e1730'; c.fillRect(0, Y0, W, 26);
      c.beginPath();
      for (var v = 0; v < 12; v++) { c.moveTo(v * 60, Y0 + 26); c.quadraticCurveTo(v * 60 + 30, Y0 + 44, v * 60 + 60, Y0 + 26); }
      c.fill();
      c.fillStyle = P.gold; c.fillRect(0, Y0 + 24, W, 3);
      if (mode === 'idle') { c.fillStyle = 'rgba(8,6,16,0.35)'; c.fillRect(0, Y0, W, 350); }
      if (mode === 'flop') { c.fillStyle = 'rgba(60,90,150,0.22)'; c.fillRect(0, Y0, W, Y1 - Y0); }
      if (mode === 'riot') { c.fillStyle = rgba(P.danger, 0.10 + 0.08 * Math.sin(t * 12)); c.fillRect(0, Y0, W, Y1 - Y0); }
      // 觀眾
      for (var a2 = 0; a2 < 9; a2++) {
        var hx = 40 + a2 * 80, hy = 522;
        var jit = 0;
        if (mode === 'riot') { hx += Math.sin(t * 9 + a2 * 1.7) * 14 + (a2 < 4 ? -1 : 1) * Math.min(t, 1) * 18; jit = Math.abs(Math.sin(t * 11 + a2)) * -8; }
        hy += jit;
        var up = (mode === 'perform' && (s.bigShow || a2 % 2 === 0)) || mode === 'riot';
        if (up) {
          var wave = Math.sin(t * 8 + a2) * 5;
          c.beginPath(); c.moveTo(hx - 18, hy + 26); c.lineTo(hx - 26 + wave, hy - 14); c.moveTo(hx + 18, hy + 26); c.lineTo(hx + 26 - wave, hy - 14);
          c.lineWidth = 9; c.lineCap = 'round'; c.strokeStyle = '#3a3156'; c.stroke();
        }
        ellipse(c, hx, hy + 44, 32, 20); c.fillStyle = P.crowd; c.fill();
        circle(c, hx, hy, 20); c.fillStyle = '#3a3156'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#564a7e'; c.stroke();
        if (mode === 'flop') {
          ellipse(c, hx, hy + 6, 5, 7); c.fillStyle = P.ink; c.fill();
          if (a2 % 2 === 1) {
            var zt = (t * 0.8 + a2 * 0.3) % 1;
            c.globalAlpha = 1 - zt;
            text(c, 'z', hx + 18, hy - 24 - zt * 30, 22, '#c9d4ff', { stroke: P.ink });
            text(c, 'Z', hx + 30, hy - 44 - zt * 30, 26, '#c9d4ff', { stroke: P.ink });
            c.globalAlpha = 1;
          }
        } else if (mode === 'riot') {
          text(c, '!', hx, hy - 34, 30, P.danger);
          ellipse(c, hx, hy + 6, 4, 6); c.fillStyle = P.ink; c.fill();
        } else if (mode === 'perform') {
          c.beginPath(); c.arc(hx, hy + 3, 7, 0.15 * Math.PI, 0.85 * Math.PI); c.lineWidth = 3; c.strokeStyle = P.ink; c.stroke();
        }
      }
      // 大場面: 彩紙 + 字
      if (mode === 'perform' && s.bigShow) {
        var cols = [P.gold, P.rep, '#ffffff', P.water];
        for (var p = 0; p < 26; p++) {
          var px2 = (p * 97 + 40) % W, py2 = Y0 + ((p * 53 + t * 160) % 340);
          c.save(); c.translate(px2, py2); c.rotate(t * 4 + p);
          c.fillStyle = cols[p % 4]; c.fillRect(-5, -3, 10, 6); c.restore();
        }
        var sc = 1 + 0.15 * Math.max(0, 1 - t * 3);
        // 放在舞台前緣(y≈462), 讓出上簷下方給技能名牌, 兩者同一刻出現也不疊
        withT(c, 360, 462, sc, function () { text(c, '大場面!', 0, 0, 44, P.gold, { sw: 8 }); });
      }
      c.restore();
    },

    drawProgramSlot: function (ctx, s) {
      var c = ctx; s = s || {}; c.save();
      var x = num(s.x, 0), y = num(s.y, 0), sp = SP[s.species] ? s.species : null;
      var res = s.result || 'none', cur = !!s.current;
      rr(c, x - 36, y - 46, 72, 92, 10);
      c.fillStyle = cur ? '#4a3d1e' : res === 'flop' ? '#24232e' : P.panel; c.fill();
      if (!sp && !cur) {
        c.save(); c.setLineDash([7, 5]); c.lineWidth = 2; c.strokeStyle = P.line; c.stroke(); c.restore();
      } else {
        c.lineWidth = cur ? 5 : 2; c.strokeStyle = cur ? P.gold : P.line; c.stroke();
      }
      text(c, num(s.index, 0) + 1, x - 30, y - 34, 17, cur ? P.gold : P.textDim, { align: 'left' });
      if (sp) mon(c, sp, x, y - 2, 0.5, { gray: res === 'flop' });
      else text(c, s.selectedTarget ? '+' : '空', x, y - 2, s.selectedTarget ? 34 : 20, s.selectedTarget ? P.select : P.line, { stroke: false });
      if (cur) { poly(c, [x - 8, y - 44, x + 8, y - 44, x, y - 34]); c.fillStyle = P.gold; c.fill(); }
      var bonus = num(s.bonus, 1);
      if (bonus > 1) {
        rr(c, x + 2, y - 44, 32, 22, 6); c.fillStyle = P.gold; c.fill(); c.lineWidth = 2; c.strokeStyle = P.ink; c.stroke();
        text(c, '×' + bonus, x + 18, y - 33, 17, P.ink, { stroke: false });
      }
      if (res === 'success') {
        rr(c, x - 30, y + 22, 60, 20, 6); c.fillStyle = P.ok; c.fill();
        check(c, x, y + 32, 7, '#ffffff', 3);
      } else if (res === 'flop') {
        rr(c, x - 30, y + 22, 60, 20, 6); c.fillStyle = P.flop; c.fill();
        text(c, '冷場', x, y + 32, 17, P.ink, { stroke: false });
      }
      if (s.selectedTarget) {
        rr(c, x - 33, y - 43, 66, 86, 8);
        c.save(); c.setLineDash([8, 5]); c.lineWidth = 3; c.strokeStyle = P.select; c.stroke(); c.restore();
      }
      c.restore();
    },

    drawRosterCard: function (ctx, s) { rosterCard(ctx, s); },

    drawSkillEffect: function (ctx, s) {
      var c = ctx; s = s || {}; c.save();
      var t = num(s.t, 0), kind = s.kind;
      var a = t < 0.15 ? t / 0.15 : t > 1.2 ? clamp(1 - (t - 1.2) / 0.4, 0, 1) : 1;
      if (a <= 0) { c.restore(); return; }
      var cfg = {
        warmup: { name: '暖場', note: '下一格金幣 ×2', col: P.fire },
        hype:   { name: '炒熱', note: '後台怒氣 +20', col: P.rageHot },
        calm:   { name: '鎮定', note: '後台怒氣 −25', col: P.calm },
        finale: { name: '壓軸', note: '金幣再加成', col: P.gold }
      }[kind];
      if (!cfg) { c.restore(); return; }
      c.globalAlpha = a;
      // 區域演出: 長在被影響的區塊
      if (kind === 'warmup') {
        var sweep = clamp(t / 0.9, 0, 1) * W;
        var g = c.createLinearGradient(sweep - 200, 0, sweep, 0);
        g.addColorStop(0, rgba(P.fire, 0)); g.addColorStop(1, rgba(P.fire, 0.35));
        c.fillStyle = g; c.fillRect(Math.max(0, sweep - 200), 626, Math.min(200, sweep), 14);
        c.fillRect(Math.max(0, sweep - 200), 720, Math.min(200, sweep), 14);
      } else if (kind === 'hype' || kind === 'calm') {
        var up = kind === 'hype';
        for (var i = 0; i < 6; i++) {
          // 箭頭走在卡片欄距之間的縫(x = 20 / 190 / 360 / 530 / 700 附近), 不壓卡上的怒氣條
          var ax = 20 + i * 170, ph = ((t * 1.2 + i * 0.17) % 1);
          if (ax > 710) continue;
          var ay = up ? 1090 - ph * 270 : 820 + ph * 270;
          c.globalAlpha = a * 0.8 * (1 - ph);
          arrowLine(c, ax, up ? ay + 26 : ay - 26, ax, up ? ay - 26 : ay + 26, cfg.col, 5);
        }
        c.globalAlpha = a;
        c.fillStyle = rgba(cfg.col, 0.08); c.fillRect(0, 790, W, 330);
      } else if (kind === 'finale') {
        for (var r = 0; r < 3; r++) {
          var rp = clamp(t * 1.4 - r * 0.2, 0, 1);
          if (rp <= 0) continue;
          circle(c, 360, 330, 60 + rp * 160); c.lineWidth = 6 * (1 - rp) + 1; c.strokeStyle = rgba(P.gold, 1 - rp); c.stroke();
        }
      }
      // 名牌: 舞台上簷下方(事件當下無決策資訊的一帶)
      var bx = 200, by = 172;
      rr(c, bx, by, 320, 56, 14); c.fillStyle = rgba(P.ink, 0.88); c.fill();
      c.lineWidth = 4; c.strokeStyle = cfg.col; c.stroke();
      text(c, cfg.name, bx + 20, by + 28, 28, cfg.col, { align: 'left' });
      text(c, cfg.note, bx + 92, by + 29, 20, P.text, { align: 'left' });
      c.restore();
    },

    drawButton: function (ctx, s) {
      var c = ctx; s = s || {}; c.save();
      var x = num(s.x, 0), y = num(s.y, 0), w = num(s.w, 200), h = num(s.h, 80), en = !!s.enabled;
      if (en) {
        rr(c, x, y + 6, w, h - 6, 18); c.fillStyle = '#b8a670'; c.fill();
        rr(c, x, y, w, h - 6, 18); c.fillStyle = P.select; c.fill();
        c.lineWidth = 3; c.strokeStyle = P.ink; c.stroke();
        text(c, s.label || '', x + w / 2, y + (h - 6) / 2, 34, P.ink, { stroke: false });
      } else {
        rr(c, x, y + 6, w, h - 6, 18); c.fillStyle = '#2a2838'; c.fill();
        c.save(); c.setLineDash([10, 7]); c.lineWidth = 3; c.strokeStyle = '#4e4b62'; c.stroke(); c.restore();
        text(c, s.label || '', x + w / 2, y + 6 + (h - 6) / 2, 34, '#6c6884', { stroke: false });
      }
      c.restore();
    },

    drawShopItem: function (ctx, s) {
      var c = ctx; s = s || {}; c.save();
      var x = num(s.x, 0), y = num(s.y, 0), maxed = !!s.maxed, aff = !!s.affordable && !maxed;
      var info = {
        weapon:    { name: '武器', note: '英雄攻擊 +3' },
        cageBag:   { name: '籠袋', note: '每天籠子 +1' },
        goodCage:  { name: '好籠', note: '捕獲率 +10%' },
        extraSlot: { name: '加場', note: '節目格 +1(最多 8)' },
        teamSize:  { name: '隊伍', note: '出戰名額 +1(最多 3)' }
      }[s.item] || { name: '', note: '' };
      if (!aff) c.globalAlpha = maxed ? 0.5 : 0.75;
      rr(c, x - 298, y - 58, 596, 116, 16);
      c.fillStyle = aff ? P.panelHi : P.panel; c.fill();
      c.lineWidth = aff ? 4 : 2; c.strokeStyle = aff ? P.select : P.line; c.stroke();
      // 圖示
      circle(c, x - 240, y, 40); c.fillStyle = '#1b1830'; c.fill(); c.lineWidth = 2; c.strokeStyle = P.line; c.stroke();
      shopIcon(c, s.item, x - 240, y);
      text(c, info.name, x - 180, y - 20, 28, P.text, { align: 'left' });
      text(c, info.note, x - 180, y + 22, 20, P.textDim, { align: 'left', stroke: false });
      var lv = Math.round(num(s.level, 0));
      if (lv > 0) text(c, '已買 ' + lv, x - 84, y - 18, 18, P.textDim, { align: 'left', stroke: false });
      if (maxed) {
        rr(c, x + 160, y - 24, 110, 48, 10); c.lineWidth = 3; c.strokeStyle = P.textDim; c.stroke();
        text(c, '已滿', x + 215, y, 26, P.textDim, { stroke: false });
      } else {
        var col = aff ? P.gold : P.danger;
        coin(c, x + 150, y, 16);
        text(c, Math.round(num(s.cost, 0)), x + 272, y, 32, col, { align: 'right' });
      }
      c.restore();
    },

    drawFloatText: function (ctx, s) {
      var c = ctx; s = s || {}; c.save();
      var t = num(s.t, 0), x = num(s.x, 0), y = num(s.y, 0) - Math.min(t, 1.2) * 36;
      c.globalAlpha = t < 0.8 ? 1 : clamp(1 - (t - 0.8) / 0.5, 0, 1);
      if (c.globalAlpha <= 0) { c.restore(); return; }
      var k = s.kind, str = String(s.text === undefined ? '' : s.text);
      var col = k === 'gold' ? P.gold : k === 'repUp' ? P.rep : k === 'repDown' ? P.danger : k === 'rageUp' ? P.rageHot : P.calm;
      c.font = 'bold 26px ' + FONT;
      var tw = c.measureText ? c.measureText(str).width : str.length * 16;
      var ix = x - tw / 2 - 14;
      if (k === 'gold') coin(c, ix, y, 11);
      else if (k === 'repUp') star(c, ix, y, 13, P.rep, P.ink, 2.5);
      else if (k === 'repDown') star(c, ix, y, 13, '#6c6884', P.ink, 2.5);
      else if (k === 'rageUp') { poly(c, [ix - 9, y + 7, ix + 9, y + 7, ix, y - 10]); c.fillStyle = P.rageHot; c.fill(); c.lineWidth = 2.5; c.strokeStyle = P.ink; c.stroke(); }
      else { poly(c, [ix - 9, y - 7, ix + 9, y - 7, ix, y + 10]); c.fillStyle = P.calm; c.fill(); c.lineWidth = 2.5; c.strokeStyle = P.ink; c.stroke(); }
      text(c, str, x + 6, y, 26, col, { sw: 5 });
      c.restore();
    },

    drawResultPanel: function (ctx, s) {
      var c = ctx; s = s || {}; c.save();
      c.fillStyle = 'rgba(8,6,16,0.75)'; c.fillRect(0, 0, W, H);
      rr(c, 80, 300, 560, 640, 28); c.fillStyle = P.panel; c.fill(); c.lineWidth = 4; c.strokeStyle = P.gold; c.stroke();
      text(c, '三天落幕', 360, 370, 40, P.text);
      var st = clamp(Math.round(num(s.stars, 0)), 0, 3);
      for (var i = 0; i < 3; i++) {
        var on = i < st;
        star(c, 230 + i * 130, 490, on ? 56 : 50, on ? P.gold : '#2e2a44', on ? P.ink : P.line, on ? 4 : 3);
      }
      text(c, ['沒有星', '一星', '二星', '三星'][st], 360, 576, 26, st ? P.gold : P.textDim);
      star(c, 170, 660, 20, P.rep, P.ink, 3);
      text(c, '總名聲', 202, 660, 28, P.text, { align: 'left' });
      text(c, Math.round(num(s.rep, 0)), 560, 660, 40, P.rep, { align: 'right' });
      coin(c, 170, 736, 18);
      text(c, '賺得金幣', 202, 736, 28, P.text, { align: 'left' });
      text(c, Math.round(num(s.goldEarned, 0)), 560, 736, 40, P.gold, { align: 'right' });
      text(c, '星級門檻  名聲 30 / 60 / 100', 360, 806, 20, P.textDim, { stroke: false });
      text(c, '點畫面重來', 360, 890, 28, P.select);
      c.restore();
    },

    drawHud: function (ctx, s) {
      var c = ctx; s = s || {}; c.save();
      var ph = s.phase;
      if (ph === 'guide') { c.restore(); return; }
      c.fillStyle = '#1f1c38'; c.fillRect(0, 0, W, 120);
      c.fillStyle = P.line; c.fillRect(0, 118, W, 2);
      text(c, '第 ' + num(s.day, 1) + ' / 3 天', 24, 38, 26, P.text, { align: 'left' });
      coin(c, 300, 38, 15);
      text(c, Math.round(num(s.gold, 0)), 324, 38, 30, P.gold, { align: 'left' });
      star(c, 520, 38, 17, P.rep, P.ink, 2.5);
      text(c, Math.round(num(s.rep, 0)), 546, 38, 30, P.rep, { align: 'left' });
      var hint = '';
      if (ph === 'team') {
        text(c, '出戰 ' + num(s.teamCount, 0) + ' / ' + num(s.teamMax, 0), 24, 90, 24, P.select, { align: 'left' });
        hint = '點卡片帶牠出戰';
      } else if (ph === 'battle') {
        var cm = Math.max(0, Math.round(num(s.cageMax, 0))), cg = Math.round(num(s.cages, 0));
        for (var i = 0; i < cm; i++) {
          withT(c, 40 + i * 40, 92, 0.6, function () {
            if (i < cg) cageBody(c, P.gold);
            else { c.globalAlpha = 0.35; cageBody(c, P.flop); }
          });
        }
        hint = '點敵人丟籠';
      } else if (ph === 'program') {
        hint = '點魔物, 再點格子';
      } else if (ph === 'show') {
        text(c, '第 ' + (num(s.slotIndex, 0) + 1) + ' / ' + num(s.slotCount, 0) + ' 格', 24, 90, 24, P.gold, { align: 'left' });
        var f = clamp(num(s.slotTimeLeft, 0) / 4, 0, 1);
        circle(c, 190, 90, 14); c.fillStyle = '#2a2640'; c.fill();
        if (f > 0) { c.beginPath(); c.moveTo(190, 90); c.arc(190, 90, 14, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); c.closePath(); c.fillStyle = P.gold; c.fill(); }
        circle(c, 190, 90, 14); c.lineWidth = 2; c.strokeStyle = P.ink; c.stroke();
      } else if (ph === 'shop') {
        text(c, '商店', 24, 90, 24, P.select, { align: 'left' });
        hint = '點項目購買';
      }
      if (s.message) {
        c.font = 'bold 22px ' + FONT;
        var mw = (c.measureText ? c.measureText(String(s.message)).width : 100) + 32;
        rr(c, 700 - mw, 72, mw, 38, 19); c.fillStyle = rgba(P.danger, 0.25); c.fill(); c.lineWidth = 2; c.strokeStyle = P.danger; c.stroke();
        text(c, s.message, 700 - mw / 2, 91, 22, P.text);
      } else if (hint) {
        text(c, hint, 696, 91, 22, P.textDim, { align: 'right', stroke: false });
      }
      c.restore();
    },

    drawGuidePage: function (ctx, s) {
      var c = ctx; s = s || {}; c.save();
      var bx = num(s.x, 40), by = num(s.y, 200), bw = num(s.w, 640), bh = num(s.h, 640);
      c.beginPath(); c.rect(bx, by, bw, bh); c.clip();
      var k = Math.min(bw / 600, bh / 600);
      c.translate(bx + (bw - 600 * k) / 2, by + (bh - 600 * k) / 2);
      c.scale(k, k);
      var fn = GUIDE[num(s.page, 0)];
      if (fn) fn(c);
      c.restore();
    }
  };

  // ---------- 後台卡(含說明頁用的 ghost) ----------
  function rosterCard(c, s, ghost) {
    s = s || {}; c.save();
    var x = num(s.x, 0), y = num(s.y, 0), sel = !!s.selected, on = !!s.onStage, loose = !!s.loose;
    var rg = num(s.rage, 0);
    rr(c, x - 73, y - 78, 146, 156, 14);
    c.fillStyle = loose ? '#4a1626' : sel ? P.panelHi : on ? '#3a3020' : P.panel; c.fill();
    if (loose) {
      c.lineWidth = 4; c.strokeStyle = P.danger; c.stroke();
      // 內圈鋸齒 = 危險
      c.beginPath();
      for (var i = 0; i <= 12; i++) { c.lineTo(x - 66 + i * 11, y - 70 + (i % 2 ? 7 : 0)); }
      c.lineWidth = 2.5; c.stroke();
    } else {
      c.lineWidth = sel ? 6 : on ? 4 : 2; c.strokeStyle = sel ? P.select : on ? P.gold : P.line; c.stroke();
    }
    if (on && !loose) {
      poly(c, [x - 20, y - 76, x + 20, y - 76, x + 52, y + 8, x - 52, y + 8]); c.fillStyle = rgba(P.gold, 0.16); c.fill();
    }
    mon(c, s.species, x, y - 30, 0.76, { face: loose ? 'wild' : 'normal' });
    var info = SP[s.species];
    if (loose) text(c, '失控!', x, y + 18, 22, P.danger);
    else if (on) text(c, '台上', x, y + 18, 20, P.gold);
    else text(c, info ? info.name : '', x, y + 18, 19, P.text);
    rageBar(c, x - 62, y + 42, 90, 14, loose ? 100 : rg, ghost);
    text(c, loose ? '爆' : Math.round(rg), x + 66, y + 49, 20, loose ? P.danger : rageColor(rg), { align: 'right' });
    c.restore();
  }

  function shopIcon(c, item, x, y) {
    c.save(); c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round';
    if (item === 'weapon') {
      c.rotate(0.6);
      rr(c, -4, -30, 8, 40, 3); c.fillStyle = '#eef2ff'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = P.ink; c.stroke();
      rr(c, -13, 8, 26, 7, 3); c.fillStyle = P.gold; c.fill(); c.stroke();
      rr(c, -4, 15, 8, 12, 3); c.fillStyle = '#7a4a2a'; c.fill(); c.stroke();
    } else if (item === 'cageBag') {
      withT(c, -8, 4, 0.7, function () { cageBody(c, P.gold); });
      text(c, '+1', 16, -12, 20, P.ok);
    } else if (item === 'goodCage') {
      withT(c, -4, 6, 0.75, function () { cageBody(c, P.gold); });
      star(c, 20, -18, 11, P.gold, P.ink, 2);
    } else if (item === 'extraSlot') {
      rr(c, -24, -26, 26, 40, 6); c.fillStyle = P.panel; c.fill(); c.lineWidth = 2; c.strokeStyle = P.line; c.stroke();
      rr(c, -2, -20, 26, 40, 6); c.fillStyle = P.panelHi; c.fill(); c.strokeStyle = P.select; c.stroke();
      text(c, '+', 11, 0, 26, P.select, { stroke: false });
    } else if (item === 'teamSize') {
      circle(c, -12, -6, 10); c.fillStyle = P.ally; c.fill(); c.lineWidth = 2; c.strokeStyle = P.ink; c.stroke();
      circle(c, 10, -6, 10); c.fillStyle = P.fire; c.fill(); c.stroke();
      ellipse(c, -12, 16, 14, 8); c.fillStyle = P.ally; c.fill(); c.stroke();
      ellipse(c, 10, 16, 14, 8); c.fillStyle = P.fire; c.fill(); c.stroke();
      text(c, '+', 26, -22, 24, P.ok);
    }
    c.restore();
  }

  // 小舞台: 把 drawStage(720×430)縮進 (x,y) 起、寬 w 的框
  function miniStage(c, x, y, w, st) {
    var k = w / 720;
    c.save(); c.translate(x, y); c.scale(k, k); c.translate(0, -130);
    Art.drawStage(c, st);
    c.restore();
    c.save(); rr(c, x, y, w, 430 * k, 6); c.lineWidth = 2; c.strokeStyle = P.line; c.stroke(); c.restore();
  }
  function label(c, s, x, y, col, size) { text(c, s, x, y, size || 22, col || P.text); }

  // ---------- 說明頁示意圖(虛擬 600×600) ----------
  var GUIDE = [
    // 1 編隊
    function (c) {
      var base = { hp: 20, maxHp: 20, rage: 20, disabled: false };
      withT(c, 105, 210, 0.85, function () { Art.drawTeamCard(c, Object.assign({}, base, { x: 0, y: 0, species: 'water', hp: 16, maxHp: 16, selected: false })); });
      withT(c, 300, 210, 0.85, function () { Art.drawTeamCard(c, Object.assign({}, base, { x: 0, y: 0, species: 'fire', selected: true })); });
      withT(c, 495, 210, 0.85, function () { Art.drawTeamCard(c, Object.assign({}, base, { x: 0, y: 0, species: 'stone', hp: 30, maxHp: 30, selected: false })); });
      pointer(c, 318, 236, 1.1);
      Art.drawButton(c, { x: 170, y: 440, w: 260, h: 86, label: '出發', enabled: true });
    },
    // 2 戰鬥與捕獲
    function (c) {
      rr(c, 0, 0, 600, 270, 16); c.fillStyle = '#1d1730'; c.fill();
      c.fillStyle = '#1a2240'; c.fillRect(0, 140, 600, 130);
      withT(c, 200, 70, 0.62, function () { Art.drawEnemy(c, { x: 0, y: 0, species: 'thunder', hp: 18, maxHp: 18, attacking: true, hit: false }); });
      withT(c, 400, 70, 0.62, function () { Art.drawEnemy(c, { x: 0, y: 0, species: 'stone', hp: 20, maxHp: 30, attacking: false, hit: true }); });
      withT(c, 210, 205, 0.62, function () { Art.drawHero(c, { x: 0, y: 0, hp: 34, maxHp: 40, attacking: true, hit: false, down: false }); });
      withT(c, 360, 205, 0.62, function () { Art.drawAllyMonster(c, { x: 0, y: 0, species: 'fire', hp: 15, maxHp: 20, rage: 52, attacking: false, hit: false, down: false }); });
      c.save(); c.setLineDash([6, 6]);
      arrowLine(c, 230, 165, 380, 105, P.select, 3);
      arrowLine(c, 210, 110, 340, 168, P.danger, 3);
      c.restore();
      // 兩格對照
      for (var i = 0; i < 2; i++) {
        var px = i * 305;
        rr(c, px, 290, 295, 310, 16); c.fillStyle = '#1d1730'; c.fill(); c.lineWidth = 2; c.strokeStyle = P.line; c.stroke();
      }
      label(c, '血很少', 148, 318, P.textDim, 20);
      label(c, '滿血', 452, 318, P.textDim, 20);
      // 左: 捕獲成功
      c.save(); c.globalAlpha = 0.35;
      withT(c, 148, 430, 0.7, function () { Art.drawEnemy(c, { x: 0, y: 0, species: 'water', hp: 2, maxHp: 16, attacking: false, hit: false }); });
      c.restore();
      Art.drawCage(c, { x: 148, y: 440, result: 'caught', t: 0.4 });
      label(c, '收進籠子', 148, 560, P.ok, 22);
      // 右: 破掉
      withT(c, 452, 430, 0.7, function () { Art.drawEnemy(c, { x: 0, y: 0, species: 'water', hp: 16, maxHp: 16, attacking: false, hit: false }); });
      Art.drawCage(c, { x: 452, y: 470, result: 'broken', t: 0.3 });
      label(c, '籠子破掉', 452, 560, P.danger, 22);
      pointer(c, 160, 420, 0.8);
      pointer(c, 464, 420, 0.8);
    },
    // 3 排節目
    function (c) {
      var slots = [null, 'fire', null, null];
      for (var i = 0; i < 4; i++) {
        Art.drawProgramSlot(c, { x: 70 + i * 84, y: 130, index: i, species: slots[i], current: false, result: 'none', bonus: 1, selectedTarget: i !== 1 });
      }
      label(c, '節目表', 196, 50, P.textDim, 20);
      Art.drawButton(c, { x: 400, y: 92, w: 180, h: 80, label: '開演', enabled: true });
      withT(c, 110, 440, 0.95, function () { Art.drawRosterCard(c, { x: 0, y: 0, species: 'water', rage: 20, selected: false, onStage: false, loose: false }); });
      withT(c, 290, 440, 0.95, function () { Art.drawRosterCard(c, { x: 0, y: 0, species: 'fire', rage: 58, selected: true, onStage: false, loose: false }); });
      withT(c, 470, 440, 0.95, function () { Art.drawRosterCard(c, { x: 0, y: 0, species: 'thunder', rage: 44, selected: false, onStage: false, loose: false }); });
      label(c, '後台', 60, 330, P.textDim, 20);
      arrowLine(c, 290, 360, 160, 190, P.select, 5, 210, 300);
      pointer(c, 300, 450, 1);
      text(c, '1', 350, 448, 30, P.select);
      pointer(c, 160, 140, 1);
      text(c, '2', 214, 150, 30, P.select);
    },
    // 4 後台
    function (c) {
      var prog = ['fire', 'thunder', 'fire'];
      var perf = [{ sp: 'fire', from: 90, to: 55 }, { sp: 'thunder', from: 72, to: 37 }, { sp: 'fire', from: 67, to: 32 }];
      var wait = [32, 44, 56];
      for (var col = 0; col < 3; col++) {
        var cx = 100 + col * 200;
        if (col) { c.fillStyle = P.line; c.fillRect(cx - 101, 20, 2, 560); }
        for (var i = 0; i < 3; i++) {
          withT(c, cx - 50 + i * 50, 60, 0.6, function () {
            Art.drawProgramSlot(c, { x: 0, y: 0, index: i, species: prog[i], current: i === col, result: i < col ? 'success' : 'none', bonus: 1, selectedTarget: false });
          });
        }
        label(c, '台上', cx, 140, P.gold, 20);
        (function (p) {
          withT(c, cx, 240, 0.78, function () { rosterCard(c, { x: 0, y: 0, species: p.sp, rage: p.to, selected: false, onStage: true, loose: false }, p.from); });
        })(perf[col]);
        Art.drawFloatText(c, { x: cx + 6, y: 334, text: '−35', kind: 'rageDown', t: 0 });
        label(c, '後台', cx, 384, P.textDim, 20);
        (function (r) {
          withT(c, cx, 480, 0.78, function () { rosterCard(c, { x: 0, y: 0, species: 'water', rage: r, selected: false, onStage: false, loose: false }); });
        })(wait[col]);
        Art.drawFloatText(c, { x: cx + 6, y: 574, text: '+12', kind: 'rageUp', t: 0 });
      }
    },
    // 5 怒氣
    function (c) {
      var cases = [
        { rage: 25, loose: false, st: { mode: 'flop', species: 'fire', bigShow: false, t: 0.4 }, res: '冷場', col: P.flop },
        { rage: 70, loose: false, st: { mode: 'perform', species: 'fire', bigShow: false, t: 0.3 }, res: '成功', col: P.ok },
        { rage: 100, loose: true, st: { mode: 'riot', species: 'fire', bigShow: false, t: 0.5 }, res: '失控', col: P.danger }
      ];
      for (var i = 0; i < 3; i++) {
        var cx = 100 + i * 200, k = cases[i];
        withT(c, cx, 100, 0.85, function () { rosterCard(c, { x: 0, y: 0, species: 'fire', rage: k.rage, selected: false, onStage: false, loose: k.loose }); });
        arrowLine(c, cx, 180, cx, 222, P.textDim, 4);
        miniStage(c, cx - 94, 236, 188, k.st);
        if (i === 0) Art.drawFloatText(c, { x: cx, y: 400, text: '−1', kind: 'repDown', t: 0 });
        if (i === 1) {
          Art.drawFloatText(c, { x: cx, y: 400, text: '+8', kind: 'gold', t: 0 });
          Art.drawFloatText(c, { x: cx, y: 440, text: '+2', kind: 'repUp', t: 0 });
        }
        if (i === 2) {
          cross(c, cx + 50, 318, 18, P.danger, 6);
          Art.drawFloatText(c, { x: cx, y: 400, text: '−8', kind: 'repDown', t: 0 });
        }
        rr(c, cx - 50, 490, 100, 42, 12); c.fillStyle = rgba(k.col, 0.2); c.fill(); c.lineWidth = 3; c.strokeStyle = k.col; c.stroke();
        label(c, k.res, cx, 511, k.col, 24);
      }
    },
    // 6 一天的流程
    function (c) {
      // 演出擺在最右(0°), 結算從它往右接出
      var cx = 200, cy = 300, R = 165, A0 = Math.PI * 0.8, STEP = Math.PI * 2 / 5;
      var nodes = ['編隊', '地下城', '排節目', '演出', '商店'];
      var pos = [];
      for (var i = 0; i < 5; i++) {
        var a = A0 + i * STEP;
        pos.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
      }
      for (var j = 0; j < 5; j++) {
        var a1 = A0 + j * STEP + 0.37, a2 = A0 + (j + 1) * STEP - 0.37, am = (a1 + a2) / 2;
        arrowLine(c, cx + Math.cos(a1) * R, cy + Math.sin(a1) * R, cx + Math.cos(a2) * R, cy + Math.sin(a2) * R, P.textDim, 4,
          cx + Math.cos(am) * R * 1.12, cy + Math.sin(am) * R * 1.12);
      }
      for (var n = 0; n < 5; n++) {
        var p = pos[n];
        circle(c, p[0], p[1], 52); c.fillStyle = P.panel; c.fill(); c.lineWidth = 3; c.strokeStyle = P.line; c.stroke();
        flowIcon(c, n, p[0], p[1] - 10);
        label(c, nodes[n], p[0], p[1] + 32, P.text, 20);
      }
      label(c, '第 1~3 天', cx, cy - 8, P.select, 28);
      text(c, '每天一圈', cx, cy + 26, 18, P.textDim, { stroke: false });
      // 指向結算
      arrowLine(c, pos[3][0] + 56, pos[3][1], pos[3][0] + 92, pos[3][1], P.gold, 5);
      for (var s2 = 0; s2 < 3; s2++) star(c, 482 + s2 * 46, 300, 20, P.gold, P.ink, 3);
      label(c, '結算', 528, 252, P.gold, 26);
      text(c, '看名聲', 528, 344, 18, P.textDim, { stroke: false });
      text(c, '第 3 天演完', 528, 372, 18, P.textDim, { stroke: false });
    }
  ];

  function flowIcon(c, n, x, y) {
    if (n === 0) {
      rr(c, x - 16, y - 20, 32, 38, 6); c.fillStyle = P.panelHi; c.fill(); c.lineWidth = 3; c.strokeStyle = P.select; c.stroke();
      mon(c, 'fire', x, y - 2, 0.3, {});
    } else if (n === 1) {
      withT(c, x, y, 0.65, function () { cageBody(c, P.gold); });
    } else if (n === 2) {
      for (var i = 0; i < 3; i++) { rr(c, x - 26 + i * 18, y - 14, 16, 26, 4); c.fillStyle = i === 1 ? '#4a3d1e' : P.panelHi; c.fill(); c.lineWidth = 2; c.strokeStyle = i === 1 ? P.gold : P.line; c.stroke(); }
    } else if (n === 3) {
      poly(c, [x - 6, y - 22, x + 6, y - 22, x + 22, y + 14, x - 22, y + 14]); c.fillStyle = rgba(P.gold, 0.35); c.fill();
      star(c, x, y + 2, 11, P.rep, P.ink, 2);
    } else {
      coin(c, x, y, 16);
    }
  }

  window.Art = Art;
})();
