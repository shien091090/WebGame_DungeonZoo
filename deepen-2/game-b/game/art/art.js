// 習性相性秀 — 美術(程式繪製, 零外部資源)
// 契約: interface.json。全域 window.Art, 每個函式自己 save / restore。
(function () {
  'use strict';

  // ---------- 色票 ----------
  var P = {
    bg: '#14121c',
    panel: '#221f2e',
    panel2: '#2e2a3e',
    panelHi: '#3a3550',
    line: '#4a4562',
    text: '#f4f0e6',
    textDim: '#a39fb5',
    ink: '#120f18',            // 物件外描
    tamerCoat: '#f4f0e6',
    tamerHat: '#2fd3c4',       // 馴獸師專屬色(帽、圍巾)
    playerFx: '#ffffff',       // 玩家造成的 = 白
    rope: '#d8b07a',
    fire: '#ff5a28', fireDark: '#a8301a', fireLight: '#ffb070',
    water: '#3d8bff', waterDark: '#1d4c9a', waterLight: '#a8ccff',
    thunder: '#ffd23c', thunderDark: '#a0801a', thunderLight: '#fff0a8',
    spike: '#58c93c', spikeDark: '#2c6e1e', spikeLight: '#b4ec98',
    stone: '#9a96a8', stoneDark: '#565266', stoneLight: '#d4d0e0',
    ghost: '#b46cff', ghostDark: '#6a34a8', ghostLight: '#e2c8ff',
    redZone: '#ff2d55',        // 紅區 / 失控標記 / 失控: 只用在線、條、記號
    ignite: '#ffb020',         // 被點燃(升怒): 琥珀, 向上的火舌
    douse: '#5fd8ff',          // 被澆熄(降怒): 青, 往下落的水滴
    boost: '#e9e4ff',          // 石像鬼加倍: 雙圈
    gold: '#ffc83a',
    heart: '#ff5d73',
    drum: '#a8452e', drumHead: '#f1dfb8',
    fountain: '#8d97a8', fountainWater: '#7fd6ff',
    bait: '#d97a6a', bone: '#f4efe2',
    wall: '#8a7a68', wallDark: '#5a4e42', wallLight: '#b8a690',
    arenaSand: '#c9a87a', arenaSandDark: '#b49064', stands: '#3a2e3e',
    lava: '#c8401a', lavaHot: '#ffb030', waterTile: '#1f4a78', waterWave: '#5aa0e0'
  };

  var THEME = {
    cave: { floorA: '#3d2c25', floorB: '#372720', hall: '#2e221d', wall: '#21150f', wallTop: '#4d3428', pillar: '#6a4a38', accent: '#ff7a3a' },
    cliff: { floorA: '#2c3442', floorB: '#28303d', hall: '#222834', wall: '#171c25', wallTop: '#3d4b5e', pillar: '#5a6a80', accent: '#ffd23c' },
    ruins: { floorA: '#3a3628', floorB: '#353122', hall: '#2c291d', wall: '#211e14', wallTop: '#5a5238', pillar: '#7a7058', accent: '#b46cff' }
  };
  var DUNGEON_NAME = { cave: '濕熱洞窟', cliff: '雷鳴崖', ruins: '古代遺跡' };
  var DUNGEON_MON = { cave: ['fire', 'water'], cliff: ['thunder', 'spike'], ruins: ['stone', 'ghost'] };

  var SPECIES = ['fire', 'water', 'thunder', 'spike', 'stone', 'ghost'];
  var SP_NAME = { fire: '火蜥蜴', water: '水母', thunder: '雷鳥', spike: '刺蝟', stone: '石像鬼', ghost: '幽靈' };
  var SP_HABIT = { fire: '會湊近戰鼓', water: '跟戰鼓保持距離', thunder: '往肉塊急衝', spike: '撞到東西會彈開', stone: '身邊的機關效果加倍', ghost: '會瞬移到噴泉旁' };
  var GADGET_NAME = { drum: '戰鼓', fountain: '噴泉', bait: '肉塊', wall: '矮牆' };

  // ---------- 工具 ----------
  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC","Heiti TC",sans-serif';
  function font(px, bold) { return (bold ? 'bold ' : '') + px + 'px ' + FONT; }
  function num(v, d) { v = Number(v); return isFinite(v) ? v : (d === undefined ? 0 : d); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function c01(v) { return clamp(num(v, 0), 0, 1); }
  function ratio(t, d) { d = num(d, 0); return d > 0 ? c01(num(t, 0) / d) : 0; }
  function str(v) { return (v === undefined || v === null) ? '' : String(v); }
  function S(st) { return (st && typeof st === 'object') ? st : {}; }
  function sp(v) { return SPECIES.indexOf(v) >= 0 ? v : 'fire'; }
  function dg(v) { return THEME[v] ? v : 'cave'; }
  function oneOf(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function dirOf(v) { return num(v, 1) < 0 ? -1 : 1; }
  function now() {
    if (typeof performance !== 'undefined' && performance.now) return performance.now() / 1000;
    return Date.now() / 1000;
  }
  function spColors(s) { s = sp(s); return { main: P[s], dark: P[s + 'Dark'], light: P[s + 'Light'] }; }
  var WHITE_C = { main: '#ffffff', dark: '#e8e8f0', light: '#ffffff' };

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
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); }
  function ellipse(ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot || 0, 0, Math.PI * 2);
  }
  // 描邊文字(P10: 任何底色都讀得到)
  function text(ctx, s, x, y, px, fill, opt) {
    opt = opt || {};
    ctx.font = font(px, opt.bold !== false);
    ctx.textAlign = opt.align || 'center';
    ctx.textBaseline = opt.base || 'middle';
    if (opt.stroke !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = opt.lw || Math.max(3, px * 0.22);
      ctx.strokeStyle = opt.strokeColor || P.ink;
      ctx.strokeText(s, x, y);
    }
    ctx.fillStyle = fill;
    ctx.fillText(s, x, y);
  }
  function plainText(ctx, s, x, y, px, fill, align, bold) {
    ctx.font = font(px, bold);
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = fill;
    ctx.fillText(s, x, y);
  }
  function arrowHead(ctx, x, y, ang, size, color) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(size, 0); ctx.lineTo(-size * 0.7, -size * 0.75); ctx.lineTo(-size * 0.35, 0); ctx.lineTo(-size * 0.7, size * 0.75);
    ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    ctx.restore();
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
  function heartPath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s * 0.1, y + s * 0.2, x - s * 0.5, y + s * 0.05, x - s * 0.5, y - s * 0.15);
    ctx.bezierCurveTo(x - s * 0.5, y - s * 0.42, x - s * 0.15, y - s * 0.45, x, y - s * 0.22);
    ctx.bezierCurveTo(x + s * 0.15, y - s * 0.45, x + s * 0.5, y - s * 0.42, x + s * 0.5, y - s * 0.15);
    ctx.bezierCurveTo(x + s * 0.5, y + s * 0.05, x + s * 0.1, y + s * 0.2, x, y + s * 0.35);
    ctx.closePath();
  }
  function coin(ctx, x, y, r) {
    circle(ctx, x, y, r); ctx.fillStyle = P.gold; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.18); ctx.strokeStyle = '#8a5a10'; ctx.stroke();
    circle(ctx, x, y, r * 0.5); ctx.strokeStyle = 'rgba(138,90,16,0.7)'; ctx.lineWidth = Math.max(1, r * 0.12); ctx.stroke();
  }

  // ---------- 魔物本體(六種剪影, 全部落在 [-R, R] 方框內) ----------
  function bodyFire(ctx, R, c) {
    ctx.beginPath(); // 尾
    ctx.moveTo(-0.3 * R, -0.05 * R);
    ctx.quadraticCurveTo(-0.75 * R, -0.1 * R, -0.98 * R, -0.35 * R);
    ctx.quadraticCurveTo(-0.72 * R, 0.18 * R, -0.25 * R, 0.22 * R);
    ctx.closePath(); ctx.fillStyle = c.main; ctx.fill(); ctx.stroke();
    // 腳
    ctx.fillStyle = c.dark;
    [-0.3, 0.2].forEach(function (lx) { ellipse(ctx, lx * R, 0.34 * R, 0.1 * R, 0.08 * R); ctx.fill(); ctx.stroke(); });
    // 背上的火冠(圓頭火舌)
    ctx.fillStyle = c.light;
    [[-0.25, 0.22], [0.0, 0.3], [0.22, 0.22]].forEach(function (f) {
      var fx = f[0] * R, h = f[1] * R;
      ctx.beginPath();
      ctx.moveTo(fx - 0.1 * R, -0.18 * R);
      ctx.quadraticCurveTo(fx - 0.1 * R, -0.18 * R - h * 0.8, fx + 0.02 * R, -0.18 * R - h);
      ctx.quadraticCurveTo(fx + 0.12 * R, -0.18 * R - h * 0.5, fx + 0.1 * R, -0.18 * R);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    });
    ellipse(ctx, -0.05 * R, 0.05 * R, 0.46 * R, 0.28 * R); ctx.fillStyle = c.main; ctx.fill(); ctx.stroke();
    ellipse(ctx, 0.52 * R, -0.08 * R, 0.32 * R, 0.25 * R); ctx.fill(); ctx.stroke();
    ellipse(ctx, -0.05 * R, 0.14 * R, 0.3 * R, 0.1 * R); ctx.fillStyle = c.light; ctx.fill();
  }
  function bodyWater(ctx, R, c) {
    ctx.strokeStyle = c.dark; ctx.lineCap = 'round';
    var lw = ctx.lineWidth;
    ctx.lineWidth = Math.max(2, R * 0.09);
    for (var i = 0; i < 4; i++) {
      var tx = (-0.42 + i * 0.28) * R;
      ctx.beginPath(); ctx.moveTo(tx, 0.1 * R);
      ctx.quadraticCurveTo(tx + 0.14 * R, 0.4 * R, tx, 0.6 * R);
      ctx.quadraticCurveTo(tx - 0.12 * R, 0.78 * R, tx + 0.04 * R, 0.92 * R);
      ctx.stroke();
    }
    ctx.lineWidth = lw; ctx.strokeStyle = P.ink;
    ctx.beginPath();
    ctx.moveTo(-0.72 * R, 0.12 * R);
    ctx.bezierCurveTo(-0.75 * R, -0.95 * R, 0.75 * R, -0.95 * R, 0.72 * R, 0.12 * R);
    for (var k = 0; k < 4; k++) {
      var x0 = 0.72 * R - k * 0.36 * R;
      ctx.quadraticCurveTo(x0 - 0.18 * R, 0.3 * R, x0 - 0.36 * R, 0.12 * R);
    }
    ctx.closePath(); ctx.fillStyle = c.main; ctx.fill(); ctx.stroke();
    ellipse(ctx, -0.28 * R, -0.42 * R, 0.16 * R, 0.1 * R, -0.5); ctx.fillStyle = c.light; ctx.fill();
  }
  function bodyThunder(ctx, R, c) {
    ctx.beginPath(); // 尾羽
    ctx.moveTo(-0.3 * R, 0.1 * R); ctx.lineTo(-0.95 * R, 0.15 * R); ctx.lineTo(-0.85 * R, 0.4 * R); ctx.lineTo(-0.3 * R, 0.35 * R);
    ctx.closePath(); ctx.fillStyle = c.dark; ctx.fill(); ctx.stroke();
    ellipse(ctx, -0.2 * R, -0.25 * R, 0.55 * R, 0.2 * R, -0.55); ctx.fillStyle = c.dark; ctx.fill(); ctx.stroke(); // 後翼
    circle(ctx, 0, 0.12 * R, 0.45 * R); ctx.fillStyle = c.main; ctx.fill(); ctx.stroke();
    ctx.beginPath(); // 冠(閃電形, 圓角收尾)
    ctx.moveTo(0.22 * R, -0.5 * R); ctx.lineTo(0.12 * R, -0.82 * R); ctx.lineTo(0.3 * R, -0.7 * R); ctx.lineTo(0.3 * R, -0.95 * R); ctx.lineTo(0.48 * R, -0.58 * R);
    ctx.closePath(); ctx.fillStyle = c.light; ctx.fill(); ctx.stroke();
    circle(ctx, 0.35 * R, -0.3 * R, 0.28 * R); ctx.fillStyle = c.main; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.58 * R, -0.36 * R); ctx.lineTo(0.92 * R, -0.26 * R); ctx.lineTo(0.58 * R, -0.18 * R); ctx.closePath();
    ctx.fillStyle = '#ff9a3a'; ctx.fill(); ctx.stroke();
    ellipse(ctx, -0.12 * R, 0.08 * R, 0.5 * R, 0.2 * R, -0.25); ctx.fillStyle = c.light; ctx.fill(); ctx.stroke(); // 前翼
    ctx.strokeStyle = c.dark; ctx.beginPath(); ctx.moveTo(-0.08 * R, 0.56 * R); ctx.lineTo(-0.12 * R, 0.72 * R); ctx.moveTo(0.12 * R, 0.56 * R); ctx.lineTo(0.14 * R, 0.72 * R); ctx.stroke();
    ctx.strokeStyle = P.ink;
  }
  function bodySpike(ctx, R, c) {
    ctx.fillStyle = c.dark;
    for (var i = 0; i <= 8; i++) {
      var a = Math.PI * (0.95 + i * 0.13);
      var a1 = a - 0.12, a2 = a + 0.12;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a1) * 0.5 * R, 0.1 * R + Math.sin(a1) * 0.45 * R);
      ctx.lineTo(Math.cos(a) * 0.93 * R, 0.1 * R + Math.sin(a) * 0.85 * R);
      ctx.lineTo(Math.cos(a2) * 0.5 * R, 0.1 * R + Math.sin(a2) * 0.45 * R);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ellipse(ctx, 0, 0.12 * R, 0.62 * R, 0.5 * R); ctx.fillStyle = c.main; ctx.fill(); ctx.stroke();
    ellipse(ctx, 0.55 * R, 0.25 * R, 0.28 * R, 0.2 * R); ctx.fillStyle = c.light; ctx.fill(); ctx.stroke();
    circle(ctx, 0.82 * R, 0.22 * R, 0.07 * R); ctx.fillStyle = P.ink; ctx.fill();
    ctx.fillStyle = c.dark; ellipse(ctx, -0.25 * R, 0.6 * R, 0.12 * R, 0.07 * R); ctx.fill(); ellipse(ctx, 0.25 * R, 0.6 * R, 0.12 * R, 0.07 * R); ctx.fill();
  }
  function bodyStone(ctx, R, c) {
    ctx.fillStyle = c.dark;
    [-1, 1].forEach(function (s) { // 翅
      ctx.beginPath();
      ctx.moveTo(s * 0.4 * R, -0.25 * R); ctx.lineTo(s * 0.98 * R, -0.6 * R); ctx.lineTo(s * 0.85 * R, -0.15 * R);
      ctx.lineTo(s * 0.98 * R, 0.15 * R); ctx.lineTo(s * 0.4 * R, 0.25 * R);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    });
    ctx.fillStyle = c.main;
    [-1, 1].forEach(function (s) { // 角
      ctx.beginPath(); ctx.moveTo(s * 0.38 * R, -0.42 * R); ctx.lineTo(s * 0.5 * R, -0.92 * R); ctx.lineTo(s * 0.14 * R, -0.5 * R); ctx.closePath();
      ctx.fillStyle = c.light; ctx.fill(); ctx.stroke();
    });
    rr(ctx, -0.5 * R, -0.5 * R, R, 1.25 * R, 0.18 * R); ctx.fillStyle = c.main; ctx.fill(); ctx.stroke();
    rr(ctx, -0.55 * R, 0.68 * R, 0.4 * R, 0.25 * R, 0.06 * R); ctx.fillStyle = c.dark; ctx.fill(); ctx.stroke();
    rr(ctx, 0.15 * R, 0.68 * R, 0.4 * R, 0.25 * R, 0.06 * R); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff3b0';
    rr(ctx, -0.32 * R, -0.25 * R, 0.22 * R, 0.08 * R, 0.03 * R); ctx.fill();
    rr(ctx, 0.1 * R, -0.25 * R, 0.22 * R, 0.08 * R, 0.03 * R); ctx.fill();
    ctx.strokeStyle = c.dark; ctx.beginPath(); ctx.moveTo(-0.2 * R, 0.1 * R); ctx.lineTo(0.2 * R, 0.1 * R);
    ctx.moveTo(-0.3 * R, 0.35 * R); ctx.lineTo(-0.15 * R, 0.5 * R); ctx.lineTo(-0.25 * R, 0.6 * R); ctx.stroke();
    ctx.strokeStyle = P.ink;
  }
  function bodyGhost(ctx, R, c, dir) {
    ctx.beginPath();
    ctx.moveTo(-0.58 * R, 0.78 * R);
    ctx.lineTo(-0.58 * R, -0.2 * R);
    ctx.arc(0, -0.2 * R, 0.58 * R, Math.PI, 0);
    ctx.lineTo(0.58 * R, 0.78 * R);
    for (var k = 0; k < 3; k++) {
      var x0 = 0.58 * R - k * 0.387 * R;
      ctx.quadraticCurveTo(x0 - 0.19 * R, 0.5 * R, x0 - 0.387 * R, 0.78 * R);
    }
    ctx.closePath();
    var a = ctx.globalAlpha; ctx.globalAlpha = a * 0.88;
    ctx.fillStyle = c.main; ctx.fill(); ctx.globalAlpha = a; ctx.stroke();
    ellipse(ctx, -0.25 * R, -0.45 * R, 0.14 * R, 0.09 * R, -0.6); ctx.fillStyle = c.light; ctx.fill();
  }
  function eyes(ctx, s, R, look) {
    // look: 'normal' | 'dizzy' | 'angry'
    var pos = {
      fire: [[0.6, -0.14]], water: [[-0.2, -0.22], [0.22, -0.22]], thunder: [[0.42, -0.36]],
      spike: [[0.42, 0.02]], stone: null, ghost: [[-0.12, -0.25], [0.24, -0.25]]
    }[s];
    if (!pos) return;
    pos.forEach(function (p) {
      var ex = p[0] * R, ey = p[1] * R, er = Math.max(2, 0.085 * R);
      if (look === 'dizzy') {
        ctx.strokeStyle = P.ink; ctx.lineWidth = Math.max(1.5, R * 0.05);
        ctx.beginPath(); ctx.moveTo(ex - er, ey - er); ctx.lineTo(ex + er, ey + er); ctx.moveTo(ex + er, ey - er); ctx.lineTo(ex - er, ey + er); ctx.stroke();
        return;
      }
      circle(ctx, ex, ey, er); ctx.fillStyle = '#fff'; ctx.fill();
      circle(ctx, ex + er * 0.3, ey, er * 0.55); ctx.fillStyle = P.ink; ctx.fill();
      if (look === 'angry') {
        ctx.strokeStyle = P.ink; ctx.lineWidth = Math.max(1.5, R * 0.06);
        ctx.beginPath(); ctx.moveTo(ex - er * 1.3, ey - er * 1.7); ctx.lineTo(ex + er * 1.3, ey - er * 0.9); ctx.stroke();
      }
    });
  }
  // o: { white, look, alpha }
  function speciesBody(ctx, s, R, dir, o) {
    o = o || {};
    s = sp(s);
    var c = o.white ? WHITE_C : spColors(s);
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.scale(dirOf(dir), 1);
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1.5, R * 0.07);
    ctx.strokeStyle = P.ink;
    if (s === 'fire') bodyFire(ctx, R, c);
    else if (s === 'water') bodyWater(ctx, R, c);
    else if (s === 'thunder') bodyThunder(ctx, R, c);
    else if (s === 'spike') bodySpike(ctx, R, c);
    else if (s === 'stone') bodyStone(ctx, R, c);
    else bodyGhost(ctx, R, c, dir);
    if (!o.white) eyes(ctx, s, R, o.look || 'normal');
    ctx.restore();
  }

  // 白色暈眩星(劍擊暈與被套索共用)
  function stunStars(ctx, cx, cy, rx, frac) {
    var t = now();
    for (var i = 0; i < 3; i++) {
      var a = t * 4 + i * Math.PI * 2 / 3;
      var x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * rx * 0.35;
      star(ctx, x, y, 5.5); ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = P.ink; ctx.stroke();
    }
    if (frac !== null && frac !== undefined) {
      ctx.beginPath(); ctx.ellipse(cx, cy, rx + 3, (rx + 3) * 0.35, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * c01(frac));
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.stroke();
    }
  }

  // ---------- 背景 / 地圖 ----------
  function drawBackground(ctx) {
    ctx.save();
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, 720, 1280);
    ctx.restore();
  }

  function drawTile(ctx, st) {
    st = S(st);
    var x = num(st.x), y = num(st.y), th = THEME[dg(st.dungeon)];
    var kind = oneOf(st.kind, ['wall', 'pillar', 'floor', 'lava', 'water'], 'floor');
    var room = oneOf(st.room, ['top', 'bottom', 'hall'], 'hall');
    ctx.save();
    ctx.translate(x - 30, y - 30);
    var checker = ((Math.floor(x / 60) + Math.floor(y / 60)) % 2) === 0;
    var floorCol = room === 'hall' ? th.hall : (checker ? th.floorA : th.floorB);
    if (kind === 'wall') {
      ctx.fillStyle = th.wall; ctx.fillRect(0, 0, 60, 60);
      ctx.fillStyle = th.wallTop; ctx.fillRect(0, 0, 60, 14);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(60, 30); ctx.moveTo(30, 14); ctx.lineTo(30, 30); ctx.moveTo(15, 30); ctx.lineTo(15, 60); ctx.moveTo(45, 30); ctx.lineTo(45, 60); ctx.stroke();
    } else {
      ctx.fillStyle = floorCol; ctx.fillRect(0, 0, 60, 60);
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, 59, 59);
      if (room === 'hall') {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        circle(ctx, 18, 20, 2); ctx.fill(); circle(ctx, 42, 40, 2); ctx.fill();
      }
      if (kind === 'pillar') {
        ellipse(ctx, 30, 40, 24, 10); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
        rr(ctx, 9, 8, 42, 40, 8); ctx.fillStyle = th.pillar; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = P.ink; ctx.stroke();
        ellipse(ctx, 30, 14, 19, 7); ctx.fillStyle = th.wallTop; ctx.fill(); ctx.stroke();
      } else if (kind === 'lava') {
        ctx.fillStyle = P.lava; ctx.fillRect(0, 0, 60, 60);
        var ph = now() * 1.5;
        ctx.strokeStyle = P.lavaHot; ctx.lineWidth = 3; ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.75 + 0.25 * Math.sin(ph + x * 0.05);
        ctx.beginPath(); ctx.moveTo(4, 14); ctx.lineTo(22, 22); ctx.lineTo(30, 10); ctx.lineTo(50, 18);
        ctx.moveTo(8, 44); ctx.lineTo(26, 36); ctx.lineTo(38, 50); ctx.lineTo(56, 40); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#5a1608'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, 58, 58);
      } else if (kind === 'water') {
        ctx.fillStyle = P.waterTile; ctx.fillRect(0, 0, 60, 60);
        var w = now() * 2;
        ctx.strokeStyle = P.waterWave; ctx.lineWidth = 2;
        for (var i = 0; i < 3; i++) {
          var yy = 12 + i * 18;
          ctx.beginPath();
          for (var xx = 4; xx <= 56; xx += 4) {
            var wy = yy + Math.sin(xx * 0.25 + w + i) * 2.5;
            if (xx === 4) ctx.moveTo(xx, wy); else ctx.lineTo(xx, wy);
          }
          ctx.stroke();
        }
      }
      if (st.nest === true && kind !== 'pillar') {
        ellipse(ctx, 30, 32, 24, 18); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
        ctx.setLineDash([5, 4]); ctx.lineWidth = 4; ctx.strokeStyle = '#a8865a'; ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = '#7a5e3a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(18, 30); ctx.lineTo(28, 36); ctx.moveTo(34, 28); ctx.lineTo(44, 34); ctx.moveTo(24, 40); ctx.lineTo(36, 40); ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------- 馴獸師 ----------
  var FACING_ANG = [-Math.PI / 2, -Math.PI / 4, 0, Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4, Math.PI, -Math.PI * 3 / 4];
  function weaponIcon(ctx, w, len) {
    // 沿 +x 方向畫, 從 0 到 len
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (w === 'sword') {
      ctx.strokeStyle = P.ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
      ctx.strokeStyle = '#e8eef8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(len - 1, 0); ctx.stroke();
      ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(4, -5); ctx.lineTo(4, 5); ctx.stroke();
    } else if (w === 'spear') {
      ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(len - 7, 0); ctx.stroke();
      ctx.strokeStyle = '#a07040'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(len - 7, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(len, 0); ctx.lineTo(len - 8, -4); ctx.lineTo(len - 8, 4); ctx.closePath();
      ctx.fillStyle = '#e8eef8'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = P.ink; ctx.stroke();
    } else if (w === 'whip') {
      ctx.strokeStyle = P.ink; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * 0.35, 0); ctx.stroke();
      ctx.strokeStyle = '#7a4a28'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * 0.35, 0);
      ctx.bezierCurveTo(len * 0.7, -8, len * 0.9, 6, len, 0); ctx.stroke();
    } else { // club
      ctx.strokeStyle = P.ink; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len - 4, 0); ctx.stroke();
      ctx.strokeStyle = '#9a6a3a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(len - 5, 0); ctx.stroke();
      circle(ctx, len - 5, 0, 5); ctx.fillStyle = '#9a6a3a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
    }
  }
  function tamerFigure(ctx, facing, weapon, lassoing) {
    var ang = FACING_ANG[facing];
    // 身體 = 判定圓 r18
    circle(ctx, 0, 0, 18); ctx.fillStyle = P.tamerCoat; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = P.ink; ctx.stroke();
    if (lassoing) {
      ctx.strokeStyle = P.rope; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(-Math.cos(ang) * 6, -Math.sin(ang) * 6 + 3, 7, 0, Math.PI * 2); ctx.stroke();
    }
    // 圍巾 / 帽(專屬色)
    circle(ctx, 0, 0, 11); ctx.fillStyle = P.tamerHat; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
    // 面向: 帽簷 + 武器
    ctx.save();
    ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(9, -8); ctx.quadraticCurveTo(19, 0, 9, 8); ctx.closePath();
    ctx.fillStyle = '#1e8f86'; ctx.fill(); ctx.stroke();
    ctx.translate(10, 12);
    ctx.rotate(-0.25);
    weaponIcon(ctx, weapon, weapon === 'spear' ? 19 : 17);
    ctx.restore();
  }
  function drawTamer(ctx, st) {
    st = S(st);
    var x = num(st.x), y = num(st.y);
    var facing = clamp(Math.round(num(st.facing, 0)), 0, 7);
    var weapon = oneOf(st.weapon, ['club', 'sword', 'spear', 'whip'], 'club');
    ctx.save();
    ctx.translate(x, y);
    var ang = FACING_ANG[facing];
    if (st.dashing === true) {
      for (var i = 2; i >= 1; i--) {
        ctx.globalAlpha = 0.18 * (3 - i);
        circle(ctx, -Math.cos(ang) * 7 * i, -Math.sin(ang) * 7 * i, 16 - i * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (st.blink === true) {
      var on = Math.floor(now() * 12) % 2 === 0;
      ctx.globalAlpha = on ? 0.3 : 0.75;
    }
    tamerFigure(ctx, facing, weapon, st.lassoing === true);
    if (st.dashing === true) {
      ctx.globalAlpha = 1;
      circle(ctx, 0, 0, 20); ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 野生魔物 ----------
  function drawWildMonster(ctx, st) {
    st = S(st);
    var s = sp(st.species);
    var x = num(st.x), y = num(st.y);
    var H = s === 'stone' ? 55 : 45, R = s === 'stone' ? 40 : 30;
    var dir = dirOf(st.dir);
    var maxHp = Math.max(1, num(st.maxHp, 1)), hp = clamp(num(st.hp, maxHp), 0, maxHp);
    var stunned = st.lassoed === true || num(st.stunLeft, 0) > 0;
    ctx.save();
    ctx.translate(x, y);
    // 殘血: 白虛線圈 = 捕捉範圍(中心距離 40)
    if (st.weak === true) {
      circle(ctx, 0, 0, 40);
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
      ctx.setLineDash([7, 6]); ctx.lineDashOffset = -now() * 20;
      ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke(); ctx.setLineDash([]);
    }
    // 施法預備: 本體後方種類色光暈
    if (st.casting === true && !stunned) {
      var pul = 0.5 + 0.5 * Math.sin(now() * 14);
      circle(ctx, 0, 2, R * (0.85 + 0.12 * pul)); ctx.fillStyle = P[s + 'Light']; ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1;
    }
    // 急衝
    if (st.dashing === true) {
      ctx.strokeStyle = 'rgba(255,240,168,0.8)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (var i = 0; i < 3; i++) {
        var ly = -12 + i * 12;
        ctx.beginPath(); ctx.moveTo(-dir * (R * 0.6), ly); ctx.lineTo(-dir * (H - 2), ly); ctx.stroke();
      }
    }
    ctx.save();
    ctx.translate(0, 2);
    var look = stunned ? 'dizzy' : 'normal';
    speciesBody(ctx, s, R, dir, { look: look, alpha: st.weak === true ? 0.82 : 1 });
    if (st.hit === true) speciesBody(ctx, s, R, dir, { white: true, alpha: 0.75 });
    if (st.lassoed === true) {
      ellipse(ctx, 0, R * 0.15, R * 0.75, R * 0.22); ctx.lineWidth = 4; ctx.strokeStyle = P.ink; ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = P.rope; ctx.stroke();
    }
    ctx.restore();
    // 殘血: 汗滴(虛弱記號)
    if (st.weak === true) {
      ctx.fillStyle = '#cfe8ff'; ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5;
      [[-R * 0.75, -R * 0.55], [R * 0.8, -R * 0.4]].forEach(function (d, k) {
        var dy = ((now() * 1.2 + k * 0.5) % 1) * 6;
        ctx.beginPath(); ctx.moveTo(d[0], d[1] - 6 + dy); ctx.quadraticCurveTo(d[0] + 5, d[1] + 2 + dy, d[0], d[1] + 4 + dy);
        ctx.quadraticCurveTo(d[0] - 5, d[1] + 2 + dy, d[0], d[1] - 6 + dy); ctx.fill(); ctx.stroke();
      });
    }
    // 暈眩星
    if (stunned) {
      var frac = st.lassoed === true ? null : ratio(st.stunLeft, num(st.stunDur, 2));
      stunStars(ctx, 0, -R - 2, R * 0.6, frac);
    }
    // 血條(底部)
    var bw = s === 'stone' ? 70 : 56;
    rr(ctx, -bw / 2, H - 8, bw, 7, 3); ctx.fillStyle = P.ink; ctx.fill();
    var fw = (bw - 2) * hp / maxHp;
    if (fw > 0) { rr(ctx, -bw / 2 + 1, H - 7, fw, 5, 2); ctx.fillStyle = st.weak === true ? '#ffffff' : '#8fe07a'; ctx.fill(); }
    // 30% 殘血門檻刻度
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-bw / 2 + 1 + (bw - 2) * 0.3 - 1, H - 8, 2, 7);
    ctx.restore();
  }

  // ---------- 捕捉 ----------
  function drawCaptureRing(ctx, st) {
    st = S(st);
    var x = num(st.x), y = num(st.y), p = ratio(st.t, st.dur);
    ctx.save();
    ctx.translate(x, y);
    circle(ctx, 0, 0, 40); ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(18,15,24,0.75)'; ctx.stroke();
    if (p > 0) {
      ctx.beginPath(); ctx.arc(0, 0, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
      ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    }
    text(ctx, '準備捕捉', 0, -51, 16, '#ffffff', { lw: 3 });
    ctx.restore();
  }

  function drawLasso(ctx, st) {
    st = S(st);
    var x1 = num(st.x1), y1 = num(st.y1), x2 = num(st.x2), y2 = num(st.y2);
    var maxLen = Math.max(1, num(st.maxLen, 220)), len = Math.max(0, num(st.len, 0));
    var tension = clamp(len / maxLen, 0, 1.2);
    var prog = c01(st.progress), tl = ratio(st.t, num(st.limit, 5));
    ctx.save();
    // 接近斷線: 畫出最大長度圈(規則可見)
    if (tension > 0.7) {
      circle(ctx, x2, y2, maxLen);
      ctx.setLineDash([10, 8]); ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,45,85,' + (0.25 + 0.5 * clamp((tension - 0.7) / 0.3, 0, 1)) + ')'; ctx.stroke(); ctx.setLineDash([]);
    }
    // 繩: 鬆時下垂, 繃緊時拉直變紅
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + 34 * clamp(1 - tension, 0, 1);
    var taut = tension > 0.85;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = P.ink; ctx.stroke();
    ctx.lineWidth = taut ? 2.5 : 3.5;
    ctx.strokeStyle = taut ? ((Math.floor(now() * 10) % 2) ? P.redZone : '#ff9a7a') : P.rope; ctx.stroke();
    // 繞圈進度環(魔物周圍)
    var RR = 50;
    circle(ctx, x2, y2, RR); ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(18,15,24,0.7)'; ctx.stroke();
    if (prog > 0) {
      ctx.beginPath(); ctx.arc(x2, y2, RR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog);
      ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    }
    // 套索時限: 繩中點的小餅圖(剩餘)
    var px = (x1 + 2 * mx + x2) / 4, py = (y1 + 2 * my + y2) / 4;
    var left = 1 - tl;
    circle(ctx, px, py, 11); ctx.fillStyle = P.ink; ctx.fill();
    if (left > 0) {
      ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, 8.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left); ctx.closePath();
      ctx.fillStyle = left < 0.3 ? P.redZone : P.rope; ctx.fill();
    }
    ctx.restore();
  }

  // ---------- 技能(地下城與表演場共用) ----------
  var HAZ_COLOR = { firering: 'fire', waterball: 'water', thunder: 'thunder', quake: 'stone', spike: 'spike', wisp: 'ghost' };
  function drawHazard(ctx, st) {
    st = S(st);
    var kind = oneOf(st.kind, ['firering', 'waterball', 'thunder', 'quake', 'spike', 'wisp'], 'firering');
    var phase = oneOf(st.phase, ['warn', 'active', 'fly'], kind === 'waterball' || kind === 'spike' || kind === 'wisp' ? 'fly' : 'warn');
    var x = num(st.x), y = num(st.y), r = Math.max(0, num(st.radius, 0));
    var p = ratio(st.t, st.dur), ang = num(st.angle, 0);
    var s = HAZ_COLOR[kind], col = P[s], dark = P[s + 'Dark'], light = P[s + 'Light'];
    var refl = st.reflected === true;
    ctx.save();
    ctx.translate(x, y);
    if (kind === 'firering' || kind === 'thunder') {
      if (phase === 'warn') {
        // 字典: 虛線框 + 由中心長大的填色, 填滿 = 生效
        circle(ctx, 0, 0, r); ctx.fillStyle = col; ctx.globalAlpha = 0.12; ctx.fill();
        circle(ctx, 0, 0, r * p); ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1;
        circle(ctx, 0, 0, r - 1.5); ctx.setLineDash([12, 8]); ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke(); ctx.setLineDash([]);
        circle(ctx, 0, 0, r - 4); ctx.lineWidth = 1; ctx.strokeStyle = P.ink; ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
      } else {
        var fade = 1 - p * 0.6;
        circle(ctx, 0, 0, r); ctx.fillStyle = col; ctx.globalAlpha = 0.6 * fade; ctx.fill();
        ctx.globalAlpha = fade;
        circle(ctx, 0, 0, r - 2); ctx.lineWidth = 4; ctx.strokeStyle = light; ctx.stroke();
        if (kind === 'firering') {
          ctx.fillStyle = light;
          for (var i = 0; i < 10; i++) {
            var a = i * Math.PI / 5 + now() * 2;
            var fx = Math.cos(a) * r * 0.7, fy = Math.sin(a) * r * 0.7;
            ctx.beginPath(); ctx.moveTo(fx - 7, fy + 6); ctx.quadraticCurveTo(fx - 6, fy - 8, fx, fy - 16); ctx.quadraticCurveTo(fx + 6, fy - 8, fx + 7, fy + 6); ctx.closePath(); ctx.fill();
          }
        } else {
          ctx.beginPath();
          ctx.moveTo(-8, -r); ctx.lineTo(6, -r * 0.35); ctx.lineTo(-4, -r * 0.3); ctx.lineTo(8, r * 0.4); ctx.lineTo(-10, -r * 0.1); ctx.lineTo(0, -r * 0.15); ctx.closePath();
          ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = dark; ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    } else if (kind === 'quake') {
      var inner = Math.max(0, r - 15), outer = r + 15;
      if (phase === 'warn') {
        circle(ctx, 0, 0, Math.max(0, r)); ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.strokeStyle = light; ctx.stroke(); ctx.setLineDash([]);
      } else {
        ctx.beginPath(); ctx.arc(0, 0, outer, 0, Math.PI * 2); ctx.arc(0, 0, inner, 0, Math.PI * 2, true);
        ctx.fillStyle = col; ctx.globalAlpha = 0.75 * (1 - p * 0.4); ctx.fill('evenodd'); ctx.globalAlpha = 1;
        circle(ctx, 0, 0, outer - 1.5); ctx.lineWidth = 3; ctx.strokeStyle = light; ctx.stroke();
        if (inner > 2) { circle(ctx, 0, 0, inner + 1); ctx.lineWidth = 2; ctx.strokeStyle = dark; ctx.stroke(); }
        // 碎石
        ctx.fillStyle = dark;
        for (var k = 0; k < 12; k++) {
          var qa = k * Math.PI / 6 + 0.2;
          rr(ctx, Math.cos(qa) * r - 3, Math.sin(qa) * r - 3, 6, 6, 1.5); ctx.fill();
        }
      }
    } else {
      // 投射物: 畫面邊界 = 判定半徑
      ctx.rotate(ang);
      var body = refl ? '#ffffff' : col, edge = refl ? col : P.ink;
      // 尾跡(在判定圓後方)
      ctx.globalAlpha = 0.45;
      ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.6); ctx.lineTo(-r * 2.6, 0); ctx.lineTo(-r * 0.2, r * 0.6); ctx.closePath();
      ctx.fillStyle = refl ? '#ffffff' : light; ctx.fill(); ctx.globalAlpha = 1;
      if (kind === 'spike') {
        ctx.beginPath(); ctx.moveTo(r, 0); ctx.lineTo(-r * 0.4, -r * 0.45); ctx.lineTo(-r, 0); ctx.lineTo(-r * 0.4, r * 0.45); ctx.closePath();
        ctx.fillStyle = body; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = edge; ctx.stroke();
      } else if (kind === 'wisp') {
        var life = 1 - p;
        ctx.globalAlpha = 0.5 + 0.5 * clamp(life * 3, 0, 1);
        circle(ctx, 0, 0, r - 1); ctx.fillStyle = body; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = edge; ctx.stroke();
        circle(ctx, r * 0.15, 0, r * 0.45); ctx.fillStyle = refl ? col : light; ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        circle(ctx, 0, 0, r - 1); ctx.fillStyle = body; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = edge; ctx.stroke();
        circle(ctx, r * 0.25, -r * 0.25, r * 0.3); ctx.fillStyle = refl ? col : light; ctx.fill();
      }
      if (refl) { circle(ctx, 0, 0, r); ctx.lineWidth = 1.5; ctx.strokeStyle = P.ink; ctx.stroke(); }
    }
    ctx.restore();
  }

  // ---------- 武器特效(玩家造成的 = 白) ----------
  function drawWeaponFx(ctx, st) {
    st = S(st);
    var x = num(st.x), y = num(st.y);
    var shape = oneOf(st.shape, ['arc', 'circle', 'line', 'dash'], 'arc');
    var skill = st.move === 'skill';
    var p = ratio(st.t, st.dur), ang = num(st.angle, 0);
    var spread = Math.max(0, num(st.spread, Math.PI / 2)), r = Math.max(0, num(st.radius, 70));
    var len = Math.max(0, num(st.length, 0)), wid = Math.max(0, num(st.width, 40));
    var a = 1 - p;
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round';
    if (shape === 'arc') {
      ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, -spread / 2, spread / 2); ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,' + (0.22 * a) + ')'; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, r - 3, -spread / 2, spread / 2);
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,' + a + ')'; ctx.stroke();
      if (skill) {
        ctx.beginPath(); ctx.arc(0, 0, r * 0.72, -spread / 2, spread / 2);
        ctx.lineWidth = 4; ctx.stroke();
      }
    } else if (shape === 'circle') {
      circle(ctx, 0, 0, r); ctx.fillStyle = 'rgba(255,255,255,' + (0.16 * a) + ')'; ctx.fill();
      circle(ctx, 0, 0, r - 3); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,' + a + ')'; ctx.stroke();
    } else if (shape === 'line') {
      ctx.rotate(ang);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.22 * a) + ')'; ctx.fillRect(0, -wid / 2, len, wid);
      ctx.strokeStyle = 'rgba(255,255,255,' + a + ')'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(len * 0.3, 0); ctx.lineTo(len - 2, 0); ctx.stroke();
      ctx.strokeRect(1.5, -wid / 2 + 1.5, Math.max(0, len - 3), Math.max(0, wid - 3));
    } else { // dash 突進殘影
      ctx.rotate(ang);
      for (var i = 0; i < 4; i++) {
        var f = i / 3;
        ctx.globalAlpha = a * (0.15 + 0.2 * f);
        circle(ctx, len * f, 0, 16); ctx.fillStyle = '#ffffff'; ctx.fill();
      }
      ctx.globalAlpha = a;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(len, -18); ctx.moveTo(0, 18); ctx.lineTo(len, 18); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 地下城選擇卡 ----------
  function selFrame(ctx, x, y, w, h, r) {
    rr(ctx, x - 5, y - 5, w + 10, h + 10, r + 4);
    ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    // 左側指示三角
    ctx.beginPath(); ctx.moveTo(x - 22, y + h / 2 - 12); ctx.lineTo(x - 8, y + h / 2); ctx.lineTo(x - 22, y + h / 2 + 12); ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill();
  }
  function padlock(ctx, x, y, s) {
    ctx.lineWidth = s * 0.14; ctx.strokeStyle = P.textDim;
    ctx.beginPath(); ctx.arc(x, y - s * 0.15, s * 0.3, Math.PI, 0); ctx.stroke();
    rr(ctx, x - s * 0.42, y - s * 0.15, s * 0.84, s * 0.6, s * 0.08); ctx.fillStyle = P.textDim; ctx.fill();
    circle(ctx, x, y + s * 0.12, s * 0.08); ctx.fillStyle = P.panel; ctx.fill();
  }
  function drawDungeonCard(ctx, st) {
    st = S(st);
    var d = dg(st.dungeon), th = THEME[d];
    var x = num(st.x) - 300, y = num(st.y) - 130, open = st.open === true;
    ctx.save();
    rr(ctx, x, y, 600, 260, 18); ctx.fillStyle = open ? P.panel2 : P.panel; ctx.fill();
    ctx.save(); rr(ctx, x, y, 600, 260, 18); ctx.clip();
    ctx.fillStyle = th.wallTop; ctx.globalAlpha = open ? 1 : 0.4; ctx.fillRect(x, y, 600, 64); ctx.globalAlpha = 1;
    ctx.restore();
    rr(ctx, x, y, 600, 260, 18); ctx.lineWidth = 2; ctx.strokeStyle = P.line; ctx.stroke();
    text(ctx, DUNGEON_NAME[d], x + 28, y + 33, 30, open ? P.text : P.textDim, { align: 'left' });
    if (open) {
      rr(ctx, x + 448, y + 14, 132, 38, 19); ctx.fillStyle = '#2b6e4a'; ctx.fill();
      plainText(ctx, '已開放', x + 514, y + 33, 20, '#d8ffe6', 'center', true);
    } else {
      padlock(ctx, x + 560, y + 34, 34);
    }
    var mons = DUNGEON_MON[d];
    for (var i = 0; i < 2; i++) {
      var cx = x + 110 + i * 190, cy = y + 150;
      circle(ctx, cx, cy, 48); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
      ctx.save(); ctx.translate(cx, cy);
      speciesBody(ctx, mons[i], 36, 1, { alpha: open ? 1 : 0.55 });
      ctx.restore();
      plainText(ctx, SP_NAME[mons[i]], cx, y + 222, 20, open ? P.text : P.textDim, 'center', true);
    }
    if (!open) {
      rr(ctx, x + 380, y + 92, 200, 120, 12); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
      plainText(ctx, '開放條件', x + 480, y + 116, 18, P.textDim, 'center', false);
      var cond = str(st.condition).split('+').map(function (q) { return q.trim(); }).filter(Boolean);
      cond.slice(0, 3).forEach(function (q, k) {
        plainText(ctx, q, x + 480, y + 148 + k * 30, 20, P.text, 'center', true);
      });
    }
    if (st.selected === true) selFrame(ctx, x, y, 600, 260, 18);
    ctx.restore();
  }

  // ---------- 布置第 1 步: 陣容卡 ----------
  function levelPips(ctx, x, y, lv, size) {
    for (var i = 0; i < 3; i++) {
      rr(ctx, x + i * (size + 4), y, size, size, 2);
      ctx.fillStyle = i < lv ? P.redZone : 'rgba(255,255,255,0.12)'; ctx.fill();
    }
  }
  function drawRosterCard(ctx, st) {
    st = S(st);
    var s = sp(st.species), lv = clamp(Math.round(num(st.level, 0)), 0, 3);
    var x = num(st.x) - 150, y = num(st.y) - 100, picked = st.picked === true;
    ctx.save();
    rr(ctx, x, y, 300, 200, 16); ctx.fillStyle = picked ? P.panelHi : P.panel; ctx.fill();
    ctx.lineWidth = picked ? 4 : 2; ctx.strokeStyle = picked ? P.tamerHat : P.line; ctx.stroke();
    circle(ctx, x + 70, y + 82, 50); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
    ctx.save(); ctx.translate(x + 70, y + 82); speciesBody(ctx, s, 40, 1); ctx.restore();
    text(ctx, SP_NAME[s], x + 136, y + 40, 26, P.text, { align: 'left' });
    plainText(ctx, 'Lv ' + lv, x + 138, y + 80, 20, P.textDim, 'left', true);
    if (picked) {
      rr(ctx, x + 206, y + 62, 80, 36, 18); ctx.fillStyle = P.tamerHat; ctx.fill();
      plainText(ctx, '上場', x + 246, y + 80, 20, P.ink, 'center', true);
    }
    rr(ctx, x + 12, y + 146, 276, 42, 10); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
    plainText(ctx, SP_HABIT[s], x + 150, y + 167, 20, P.text, 'center', true);
    if (st.selected === true) selFrame(ctx, x, y, 300, 200, 16);
    ctx.restore();
  }

  // ---------- 布置第 2 步 ----------
  function drawSetupCell(ctx, st) {
    st = S(st);
    var x = num(st.x) - 100, y = num(st.y) - 90;
    ctx.save();
    if (st.selected === true) {
      rr(ctx, x + 4, y + 4, 192, 172, 12); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = P.ink; rr(ctx, x + 8, y + 8, 184, 164, 9); ctx.stroke();
    } else {
      rr(ctx, x + 4, y + 4, 192, 172, 12);
      ctx.setLineDash([8, 6]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(40,28,20,0.55)'; ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function gadgetBody(ctx, kind, fired) {
    // 中心 (0,0), 落在 ±40 內(矮牆另計)
    var t = now();
    ctx.lineJoin = 'round'; ctx.strokeStyle = P.ink; ctx.lineWidth = 2.5;
    if (kind === 'drum') {
      var lift = fired ? -6 : 0;
      ctx.save(); ctx.translate(0, 4);
      ctx.beginPath(); ctx.moveTo(-28, -8); ctx.lineTo(-24, 26); ctx.quadraticCurveTo(0, 34, 24, 26); ctx.lineTo(28, -8); ctx.closePath();
      ctx.fillStyle = P.drum; ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#f1dfb8'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-26, 2); ctx.lineTo(-12, 22); ctx.lineTo(0, 2); ctx.lineTo(12, 22); ctx.lineTo(26, 2); ctx.stroke();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2.5;
      ellipse(ctx, 0, -8, 28, 10); ctx.fillStyle = fired ? '#fff4d8' : P.drumHead; ctx.fill(); ctx.stroke();
      ctx.lineCap = 'round';
      [-1, 1].forEach(function (s) {
        ctx.beginPath(); ctx.moveTo(s * 6, -14 + lift); ctx.lineTo(s * 22, -34 + lift);
        ctx.lineWidth = 6; ctx.strokeStyle = P.ink; ctx.stroke();
        ctx.lineWidth = 3.5; ctx.strokeStyle = '#e8c890'; ctx.stroke();
      });
      ctx.restore();
    } else if (kind === 'fountain') {
      ellipse(ctx, 0, 24, 34, 12); ctx.fillStyle = P.fountain; ctx.fill(); ctx.stroke();
      ellipse(ctx, 0, 21, 27, 8); ctx.fillStyle = P.fountainWater; ctx.fill();
      rr(ctx, -6, -4, 12, 26, 3); ctx.fillStyle = P.fountain; ctx.fill(); ctx.stroke();
      ellipse(ctx, 0, -4, 18, 6); ctx.fillStyle = P.fountain; ctx.fill(); ctx.stroke();
      var h = fired ? 28 : 20;
      ctx.strokeStyle = P.fountainWater; ctx.lineWidth = 3; ctx.lineCap = 'round';
      [-1, 0, 1].forEach(function (s) {
        ctx.beginPath(); ctx.moveTo(0, -8); ctx.quadraticCurveTo(s * 10, -8 - h, s * 16 + (s === 0 ? 0 : 0), -8 - h * (s === 0 ? 1 : 0.4)); ctx.stroke();
      });
      circle(ctx, 0, -8 - h, 4); ctx.fillStyle = '#ffffff'; ctx.fill();
    } else if (kind === 'bait') {
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(6, 4); ctx.lineTo(28, 22); ctx.lineWidth = 9; ctx.strokeStyle = P.ink; ctx.stroke();
      ctx.lineWidth = 6; ctx.strokeStyle = P.bone; ctx.stroke();
      circle(ctx, 30, 20, 5); ctx.fillStyle = P.bone; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
      circle(ctx, 26, 27, 5); ctx.fill(); ctx.stroke();
      ellipse(ctx, -6, -6, 26, 20, -0.6); ctx.fillStyle = P.bait; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
      ellipse(ctx, -12, -12, 10, 6, -0.6); ctx.fillStyle = '#f2a898'; ctx.fill();
    }
  }
  function drawGadget(ctx, st) {
    st = S(st);
    var kind = oneOf(st.kind, ['drum', 'fountain', 'bait', 'wall'], 'drum');
    var x = num(st.x), y = num(st.y);
    ctx.save();
    ctx.translate(x, y);
    if (kind === 'wall') {
      // 畫滿 160×140 = 判定範圍
      ctx.fillStyle = P.wallDark; ctx.fillRect(-80, -70, 160, 140);
      ctx.fillStyle = P.wall; ctx.fillRect(-80, -70, 160, 116);
      ctx.fillStyle = P.wallLight; ctx.fillRect(-80, -70, 160, 16);
      ctx.strokeStyle = P.wallDark; ctx.lineWidth = 2;
      for (var row = 0; row < 4; row++) {
        var yy = -54 + row * 25;
        ctx.beginPath(); ctx.moveTo(-80, yy); ctx.lineTo(80, yy); ctx.stroke();
        var off = (row % 2) ? 20 : 0;
        for (var bx = -80 + off + 40; bx < 80; bx += 40) {
          ctx.beginPath(); ctx.moveTo(bx, yy); ctx.lineTo(bx, Math.min(46, yy + 25)); ctx.stroke();
        }
      }
      ctx.lineWidth = 3; ctx.strokeStyle = P.ink; ctx.strokeRect(-78.5, -68.5, 157, 137);
    } else {
      ellipse(ctx, 0, 30, 32, 8); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
      if (st.boosted === true && kind !== 'bait') {
        // 加倍 = 雙圈(可數的疊加: 2 圈 = ×2)
        circle(ctx, 0, 0, 38); ctx.lineWidth = 3; ctx.strokeStyle = P.boost; ctx.stroke();
        circle(ctx, 0, 0, 33); ctx.lineWidth = 2; ctx.stroke();
      }
      if (st.fired === true && kind !== 'bait') {
        circle(ctx, 0, 0, 30); ctx.fillStyle = kind === 'drum' ? 'rgba(255,176,32,0.35)' : 'rgba(95,216,255,0.35)'; ctx.fill();
      }
      gadgetBody(ctx, kind, st.fired === true);
    }
    ctx.restore();
  }

  function drawGadgetPulse(ctx, st) {
    st = S(st);
    var kind = oneOf(st.kind, ['drum', 'fountain'], 'drum');
    var x = num(st.x), y = num(st.y), R = Math.max(0, num(st.radius, 160)), p = ratio(st.t, num(st.dur, 0.4));
    var boosted = st.boosted === true;
    var col = kind === 'drum' ? P.ignite : P.douse;
    ctx.save();
    ctx.translate(x, y);
    var a = 1 - p;
    circle(ctx, 0, 0, R); ctx.fillStyle = col; ctx.globalAlpha = 0.1 * a; ctx.fill();
    ctx.globalAlpha = 0.7 * a;
    circle(ctx, 0, 0, R - 1); ctx.setLineDash([10, 8]); ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.stroke(); ctx.setLineDash([]);
    var rings = boosted ? 2 : 1;
    for (var i = 0; i < rings; i++) {
      var q = clamp(p - i * 0.18, 0, 1);
      // 戰鼓: 往外擴(點燃); 噴泉: 往內收(澆熄)
      var rr2 = kind === 'drum' ? R * (0.15 + 0.85 * q) : R * (1 - 0.8 * q);
      ctx.globalAlpha = a;
      circle(ctx, 0, 0, Math.max(0, rr2 - 3)); ctx.lineWidth = boosted ? 6 : 5; ctx.strokeStyle = P.ink; ctx.stroke();
      ctx.lineWidth = boosted ? 4 : 3; ctx.strokeStyle = boosted ? P.boost : col; if (i === 1) ctx.strokeStyle = col; ctx.stroke();
    }
    if (kind === 'fountain') {
      ctx.fillStyle = col; ctx.globalAlpha = a;
      for (var k = 0; k < 10; k++) {
        var da = k * 0.628 + 0.3, dr = R * (0.3 + 0.55 * ((k * 37) % 10) / 10);
        var dx = Math.cos(da) * dr, dy = Math.sin(da) * dr * 0.9 + p * 14;
        ctx.beginPath(); ctx.moveTo(dx, dy - 6); ctx.quadraticCurveTo(dx + 4, dy + 1, dx, dy + 4); ctx.quadraticCurveTo(dx - 4, dy + 1, dx, dy - 6); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawBoostLink(ctx, st) {
    st = S(st);
    var x1 = num(st.x1), y1 = num(st.y1), x2 = num(st.x2), y2 = num(st.y2);
    var dx = x2 - x1, dy = y2 - y1, d = Math.sqrt(dx * dx + dy * dy);
    ctx.save();
    if (d > 1) {
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(18,15,24,0.6)'; ctx.stroke();
      ctx.setLineDash([10, 8]); ctx.lineDashOffset = -now() * 30;
      ctx.lineWidth = 2.5; ctx.strokeStyle = P.boost; ctx.stroke(); ctx.setLineDash([]);
      var ang = Math.atan2(dy, dx);
      var ph = (now() * 0.8) % 1;
      for (var i = 0; i < 2; i++) {
        var f = (ph + i * 0.5) % 1;
        if (f * d < 40 || f * d > d - 45) continue;
        arrowHead(ctx, x1 + dx * f, y1 + dy * f, ang, 7, P.boost);
      }
    }
    ctx.restore();
  }

  // ---------- 表演場 ----------
  function drawShowArena(ctx) {
    ctx.save();
    // 觀眾席
    [[130, 250], [1020, 1140]].forEach(function (r) {
      ctx.fillStyle = P.stands; ctx.fillRect(0, r[0], 720, r[1] - r[0]);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (var i = 0; i < 3; i++) ctx.fillRect(20, r[0] + 12 + i * 38, 680, 14);
    });
    // 場地
    ctx.fillStyle = '#2a2230'; ctx.fillRect(0, 250, 720, 770);
    rr(ctx, 60, 270, 600, 720, 24); ctx.fillStyle = P.arenaSand; ctx.fill();
    ctx.save(); rr(ctx, 60, 270, 600, 720, 24); ctx.clip();
    ctx.strokeStyle = P.arenaSandDark; ctx.lineWidth = 3;
    ellipse(ctx, 360, 630, 230, 300); ctx.stroke();
    ellipse(ctx, 360, 630, 60, 60); ctx.stroke();
    ctx.restore();
    rr(ctx, 60, 270, 600, 720, 24); ctx.lineWidth = 4; ctx.strokeStyle = '#6a4e36'; ctx.stroke();
    ctx.restore();
  }

  function markPip(ctx, x, y, s, state, frac) {
    // state: 0 空, 1 實
    ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath();
    ctx.fillStyle = state ? P.redZone : 'rgba(18,15,24,0.75)'; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = state ? P.ink : 'rgba(255,45,85,0.7)'; ctx.stroke();
    if (state && frac !== undefined && frac < 1) {
      // 遞減中的那一顆: 上方被吃掉的部分 = 剩餘時間少
      ctx.save();
      ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath(); ctx.clip();
      ctx.fillStyle = 'rgba(18,15,24,0.8)'; ctx.fillRect(x - s, y - s, 2 * s, 2 * s * (1 - c01(frac)));
      ctx.restore();
    }
  }
  function markRow(ctx, cx, cy, marks, frac) {
    for (var i = 0; i < 5; i++) {
      var filled = i < marks;
      markPip(ctx, cx - 32 + i * 16, cy, 6.5, filled ? 1 : 0, (filled && i === marks - 1) ? frac : undefined);
    }
  }
  function rageBar(ctx, cx, cy, rage, redLow, flash) {
    // 90×12, 中心 (cx, cy)
    var x = cx - 45, y = cy - 6, w = 90, h = 12;
    rr(ctx, x, y, w, h, 3); ctx.fillStyle = P.ink; ctx.fill();
    var iw = w - 4, ix = x + 2, iy = y + 2, ih = h - 4;
    // 紅區底(看得出紅區寬度)
    var rz = ix + iw * redLow / 100;
    ctx.fillStyle = 'rgba(255,45,85,0.3)'; ctx.fillRect(rz, iy, ix + iw - rz, ih);
    var fw = iw * rage / 100;
    var fill = rage >= redLow ? P.redZone : (rage >= 50 ? '#f4e8c8' : '#7a768a');
    if (flash) fill = (Math.floor(now() * 8) % 2) ? P.redZone : '#ffffff';
    if (fw > 0) { ctx.fillStyle = fill; ctx.fillRect(ix, iy, fw, ih); }
    if (rage >= redLow && !flash) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(ix, iy + ih / 2 - 0.5, fw, 1); }
    // 紅區外框線
    ctx.strokeStyle = P.redZone; ctx.lineWidth = 1.5; ctx.strokeRect(rz, y + 0.75, ix + iw - rz + 1.25, h - 1.5);
    // 表演門檻 50
    ctx.fillStyle = '#ffffff'; ctx.fillRect(ix + iw * 0.5 - 1, y - 1, 2, h + 2);
  }
  function drawShowMonster(ctx, st) {
    st = S(st);
    var s = sp(st.species);
    var x = num(st.x), y = num(st.y);
    var H = s === 'stone' ? 60 : 50, R = s === 'stone' ? 36 : 28;
    var dir = dirOf(st.dir);
    var lv = clamp(Math.round(num(st.level, 0)), 0, 3);
    var rage = clamp(num(st.rage, 0), 0, 100), redLow = clamp(num(st.redLow, 80), 0, 100);
    var marks = clamp(Math.round(num(st.marks, 0)), 0, 5);
    var mode = oneOf(st.mode, ['roam', 'charge', 'loose'], 'roam');
    var fx = oneOf(st.fx, ['none', 'ignited', 'doused'], 'none');
    var fxP = ratio(st.fxT, num(st.fxDur, 0.5));
    var perf = st.performing === true, perfP = ratio(st.performT, num(st.performDur, 0.5));
    var wild = mode !== 'roam';
    var bodyY = -4;
    ctx.save();
    ctx.translate(x, y);
    // 失控: 紅色外光 + 衝欄 / 亂竄
    if (wild) {
      var pul = 0.5 + 0.5 * Math.sin(now() * 12);
      circle(ctx, 0, bodyY, R + 8); ctx.fillStyle = 'rgba(255,45,85,' + (0.2 + 0.15 * pul) + ')'; ctx.fill();
      circle(ctx, 0, bodyY, R + 8); ctx.lineWidth = 3; ctx.strokeStyle = P.redZone; ctx.stroke();
      if (mode === 'charge') {
        var cp = ratio(st.chargeT, num(st.chargeDur, 1.5));
        if (cp <= 0) {
          ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
          for (var i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-dir * (R + 2), bodyY - 12 + i * 12); ctx.lineTo(-dir * (H - 4), bodyY - 12 + i * 12); ctx.stroke(); }
        } else {
          // 撞欄進度: 外圈白弧 = 圍欄快破了
          ctx.beginPath(); ctx.arc(0, bodyY, R + 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cp);
          ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        }
      } else {
        // 亂竄: 剩餘時間環(到 0 就累倒)
        var lp = 1 - ratio(st.looseT, num(st.looseDur, 6));
        ctx.beginPath(); ctx.arc(0, bodyY, R + 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lp);
        ctx.lineWidth = 4; ctx.strokeStyle = P.redZone; ctx.stroke();
      }
    }
    // 被點燃 / 被澆熄(長在本體外緣)
    if (fx !== 'none') {
      var fa = 1 - fxP;
      ctx.globalAlpha = fa;
      if (fx === 'ignited') {
        circle(ctx, 0, bodyY, R + 6); ctx.lineWidth = 7; ctx.strokeStyle = P.ink; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = P.ignite; ctx.stroke();
        ctx.fillStyle = P.ignite;
        [-1, 1].forEach(function (sd) {
          var fx0 = sd * (R + 6), fy0 = bodyY + 4 - fxP * 12;
          ctx.beginPath(); ctx.moveTo(fx0 - 6, fy0 + 8); ctx.quadraticCurveTo(fx0 - 6, fy0 - 6, fx0, fy0 - 16); ctx.quadraticCurveTo(fx0 + 6, fy0 - 6, fx0 + 6, fy0 + 8); ctx.closePath(); ctx.fill();
          ctx.lineWidth = 1.5; ctx.strokeStyle = P.ink; ctx.stroke();
        });
      } else {
        circle(ctx, 0, bodyY, R + 6); ctx.lineWidth = 7; ctx.strokeStyle = P.ink; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = P.douse; ctx.stroke();
        ctx.fillStyle = P.douse;
        [-1, 1].forEach(function (sd) {
          var dx = sd * (R + 6), dy = bodyY - 14 + fxP * 18;
          ctx.beginPath(); ctx.moveTo(dx, dy - 8); ctx.quadraticCurveTo(dx + 6, dy + 2, dx, dy + 6); ctx.quadraticCurveTo(dx - 6, dy + 2, dx, dy - 8); ctx.closePath(); ctx.fill();
          ctx.lineWidth = 1.5; ctx.strokeStyle = P.ink; ctx.stroke();
        });
      }
      ctx.globalAlpha = 1;
    }
    // 表演: 種類色光暈 + 白色外擴輪廓
    if (perf) {
      circle(ctx, 0, bodyY, R * (0.9 + 0.25 * perfP)); ctx.fillStyle = P[s + 'Light']; ctx.globalAlpha = 0.6 * (1 - perfP); ctx.fill(); ctx.globalAlpha = 1;
    }
    if (st.dashing === true && !wild) {
      ctx.strokeStyle = 'rgba(255,240,168,0.85)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (var j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(-dir * (R * 0.6), bodyY - 12 + j * 12); ctx.lineTo(-dir * (H - 4), bodyY - 12 + j * 12); ctx.stroke(); }
    }
    ctx.save();
    var jump = perf ? -Math.sin(perfP * Math.PI) * 5 : 0;
    var shake = (mode === 'charge' && ratio(st.chargeT, num(st.chargeDur, 1.5)) > 0) ? Math.sin(now() * 60) * 2 : 0;
    ctx.translate(shake, bodyY + jump);
    speciesBody(ctx, s, R, dir, { look: wild ? 'angry' : (marks > 0 ? 'angry' : 'normal') });
    ctx.restore();
    // Lv 徽章(右下角, 小)
    if (lv > 0) {
      rr(ctx, R - 14, bodyY + R - 18, 30, 18, 6); ctx.fillStyle = P.ink; ctx.fill();
      plainText(ctx, 'Lv' + lv, R + 1, bodyY + R - 9, 13, '#ffffff', 'center', true);
    }
    // 失控標記(頭上, 5 格: 滿 5 = 失控)
    if (!wild && marks > 0) {
      markRow(ctx, 0, -H + 7, Math.min(marks, 4), ratio(st.markLeft, num(st.markDur, 4)));
    }
    // 怒氣條(底部 90×12)
    rageBar(ctx, 0, H - 6, wild ? 100 : rage, redLow, wild || marks > 0);
    ctx.restore();
  }

  function drawFence(ctx, st) {
    st = S(st);
    var x = num(st.x) - 50, y = num(st.y) - 8;
    ctx.save();
    if (st.broken === true) {
      ctx.fillStyle = '#5a3e2a';
      ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x + 34, y + 2); ctx.lineTo(x + 26, y + 8); ctx.lineTo(x + 36, y + 14); ctx.lineTo(x, y + 14); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 100, y + 2); ctx.lineTo(x + 68, y + 2); ctx.lineTo(x + 74, y + 7); ctx.lineTo(x + 64, y + 14); ctx.lineTo(x + 100, y + 14); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
      ctx.fillStyle = P.redZone; ctx.fillRect(x + 44, y + 6, 12, 4);
      ctx.fillStyle = '#3a2618'; ctx.fillRect(x, y, 6, 16); ctx.fillRect(x + 94, y, 6, 16);
    } else {
      ctx.fillStyle = '#9a6a42'; ctx.fillRect(x, y + 2, 100, 12);
      ctx.fillStyle = '#c08a5a'; ctx.fillRect(x, y + 2, 100, 4);
      ctx.fillStyle = '#5a3e2a'; ctx.fillRect(x, y, 6, 16); ctx.fillRect(x + 47, y, 6, 16); ctx.fillRect(x + 94, y, 6, 16);
      ctx.lineWidth = 1.5; ctx.strokeStyle = P.ink; ctx.strokeRect(x + 0.75, y + 2.75, 98.5, 10.5);
    }
    ctx.restore();
  }

  var VISITOR_COLS = ['#c9a98a', '#a8b8c8', '#b8a8c8', '#c8c0a0', '#a0c0b0', '#c8a0a8'];
  function drawVisitor(ctx, st) {
    st = S(st);
    var x = num(st.x), y = num(st.y);
    var mode = oneOf(st.mode, ['watch', 'scared', 'empty'], 'watch');
    var col = VISITOR_COLS[Math.abs(Math.round(x / 100)) % 6];
    ctx.save();
    ctx.translate(x, y);
    // 座位
    rr(ctx, -26, 30, 52, 14, 4); ctx.fillStyle = '#5a4660'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
    if (mode === 'empty') {
      rr(ctx, -16, -30, 32, 58, 10); ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.stroke(); ctx.setLineDash([]);
    } else if (mode === 'scared') {
      var sh = Math.sin(now() * 40) * 2;
      ctx.translate(sh, -4);
      rr(ctx, -15, -6, 30, 34, 10); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
      ctx.lineCap = 'round'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-12, -2); ctx.lineTo(-22, -26); ctx.moveTo(12, -2); ctx.lineTo(22, -26); ctx.strokeStyle = P.ink; ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke();
      circle(ctx, 0, -22, 13); ctx.fillStyle = '#f0d0b0'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
      circle(ctx, -4, -24, 2.5); ctx.fillStyle = P.ink; ctx.fill(); circle(ctx, 4, -24, 2.5); ctx.fill();
      ellipse(ctx, 0, -16, 3, 4); ctx.fill();
      // 驚嚇記號
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-19, -37); ctx.lineTo(-14, -33); ctx.moveTo(19, -37); ctx.lineTo(14, -33); ctx.stroke();
    } else {
      rr(ctx, -15, -2, 30, 32, 10); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
      circle(ctx, 0, -16, 13); ctx.fillStyle = '#f0d0b0'; ctx.fill(); ctx.stroke();
      circle(ctx, -4, -17, 2); ctx.fillStyle = P.ink; ctx.fill(); circle(ctx, 4, -17, 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -12, 4, 0.2, Math.PI - 0.2); ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 布置: 選擇面板與資訊列 ----------
  function drawPickerPanel(ctx, st) {
    st = S(st);
    var opts = Array.isArray(st.options) ? st.options : [];
    var idx = Math.round(num(st.index, 0));
    var h = 80 + 70 * opts.length;
    ctx.save();
    rr(ctx, 120, 240, 480, h, 16); ctx.fillStyle = P.panel; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = P.line; ctx.stroke();
    text(ctx, '要放什麼?', 360, 280, 26, P.text);
    for (var i = 0; i < opts.length; i++) {
      var o = S(opts[i]);
      var ry = 320 + 70 * i;
      var type = oneOf(o.type, ['monster', 'gadget', 'clear'], 'clear');
      var ok = o.affordable !== false;
      if (i === idx) {
        rr(ctx, 128, ry + 4, 464, 62, 10); ctx.fillStyle = P.panelHi; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(140, ry + 69, 440, 1);
      }
      ctx.save();
      ctx.globalAlpha = ok ? 1 : 0.4;
      ctx.translate(170, ry + 35);
      if (type === 'monster') { speciesBody(ctx, o.key, 24, 1); }
      else if (type === 'gadget') {
        var gk = oneOf(o.key, ['drum', 'fountain', 'bait', 'wall'], 'drum');
        if (gk === 'wall') { ctx.scale(0.3, 0.3); drawGadget(ctx, { x: 0, y: 0, kind: 'wall' }); }
        else { ctx.scale(0.6, 0.6); gadgetBody(ctx, gk, false); }
      } else {
        ctx.strokeStyle = P.textDim; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-12, -12); ctx.lineTo(12, 12); ctx.moveTo(12, -12); ctx.lineTo(-12, 12); ctx.stroke();
      }
      ctx.restore();
      var name = str(o.name) || (type === 'clear' ? '清空' : '');
      var desc = str(o.desc);
      var fg = ok ? P.text : P.textDim;
      plainText(ctx, name, 210, desc ? ry + 24 : ry + 35, 22, fg, 'left', true);
      if (desc) plainText(ctx, desc, 210, ry + 50, 17, ok ? P.textDim : '#6e6a80', 'left', false);
      var cost = num(o.cost, 0);
      if (type === 'gadget' && cost > 0) {
        coin(ctx, 528, ry + 35, 10);
        plainText(ctx, String(cost), 544, ry + 35, 22, ok ? P.gold : '#8a7a5a', 'left', true);
      }
    }
    ctx.restore();
  }

  function drawSetupInfo(ctx, st) {
    st = S(st);
    var x = num(st.x, 260) - 200, y = num(st.y, 1210) - 60;
    var gold = num(st.gold, 0), placed = num(st.placed, 0), picked = num(st.picked, 0);
    ctx.save();
    rr(ctx, x, y, 400, 120, 14); ctx.fillStyle = P.panel; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.line; ctx.stroke();
    coin(ctx, x + 36, y + 38, 13);
    plainText(ctx, '金幣 ' + Math.round(gold), x + 58, y + 38, 26, P.gold, 'left', true);
    plainText(ctx, '已擺 ' + Math.round(placed) + ' / ' + Math.round(picked), x + 24, y + 84, 24, P.text, 'left', true);
    // 魔物擺放進度點
    for (var i = 0; i < clamp(Math.round(picked), 0, 6); i++) {
      circle(ctx, x + 200 + i * 26, y + 84, 9);
      ctx.fillStyle = i < placed ? P.tamerHat : 'rgba(255,255,255,0.12)'; ctx.fill();
    }
    ctx.restore();
  }

  // ---------- 商店 ----------
  var SHOP = {
    club: { name: '棍棒', desc: 'Z 敲擊  X 無', weapon: true },
    sword: { name: '劍', desc: 'Z 斬擊可打回飛彈  X 擊暈', weapon: true },
    spear: { name: '長槍', desc: 'Z 長刺  X 突進', weapon: true },
    whip: { name: '長鞭', desc: 'Z 整圈抽打  X 擊飛', weapon: true },
    attack: { name: '攻擊力 +1', desc: '每次攻擊傷害 +1' },
    armor: { name: '護甲', desc: '心 +1' },
    ropeBag: { name: '繩袋', desc: '捕獸繩 +1' }
  };
  function shopIcon(ctx, item) {
    if (SHOP[item].weapon) { ctx.rotate(-Math.PI / 4); ctx.translate(-22, 0); weaponIcon(ctx, item, 44); return; }
    if (item === 'attack') { ctx.rotate(-Math.PI / 4); ctx.translate(-20, 0); weaponIcon(ctx, 'sword', 40); return; }
    if (item === 'armor') { heartPath(ctx, 0, 2, 40); ctx.fillStyle = P.heart; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = P.ink; ctx.stroke(); return; }
    ctx.lineWidth = 5; ctx.strokeStyle = P.ink; circle(ctx, 0, 0, 16); ctx.stroke(); circle(ctx, 0, 0, 9); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = P.rope; circle(ctx, 0, 0, 16); ctx.stroke(); circle(ctx, 0, 0, 9); ctx.stroke();
  }
  function drawShopItem(ctx, st) {
    st = S(st);
    var item = SHOP[st.item] ? st.item : 'club';
    var info = SHOP[item];
    var x = num(st.x) - 300, y = num(st.y) - 55;
    var owned = st.owned === true, eq = st.equipped === true, ok = st.affordable === true;
    ctx.save();
    rr(ctx, x, y, 600, 110, 14); ctx.fillStyle = eq ? P.panelHi : P.panel; ctx.fill();
    ctx.lineWidth = eq ? 3 : 2; ctx.strokeStyle = eq ? P.tamerHat : P.line; ctx.stroke();
    circle(ctx, x + 56, y + 55, 34); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
    ctx.save(); ctx.translate(x + 56, y + 55); shopIcon(ctx, item); ctx.restore();
    plainText(ctx, info.name, x + 108, y + 36, 26, P.text, 'left', true);
    if (eq) {
      ctx.font = font(26, true); var nw = ctx.measureText(info.name).width;
      rr(ctx, x + 118 + nw, y + 20, 84, 32, 16); ctx.fillStyle = P.tamerHat; ctx.fill();
      plainText(ctx, '裝備中', x + 160 + nw, y + 36, 18, P.ink, 'center', true);
    }
    plainText(ctx, info.desc, x + 108, y + 76, 19, P.textDim, 'left', false);
    if (!info.weapon) {
      var lv = Math.max(0, Math.round(num(st.level, 0)));
      if (lv > 0) plainText(ctx, '已買 ' + lv + ' 次', x + 440, y + 80, 17, P.textDim, 'right', false);
    }
    if (owned && info.weapon) {
      plainText(ctx, '已擁有', x + 576, y + 55, 22, '#8fe0b0', 'right', true);
    } else {
      var cost = Math.round(num(st.cost, 0));
      ctx.font = font(26, true); var cw = ctx.measureText(String(cost)).width;
      coin(ctx, x + 576 - cw - 18, y + 55, 12);
      plainText(ctx, String(cost), x + 576, y + 55, 26, ok ? P.gold : '#8a7a5a', 'right', true);
      if (!ok) plainText(ctx, '金幣不足', x + 576, y + 86, 15, '#9a8a7a', 'right', false);
    }
    if (st.selected === true) selFrame(ctx, x, y, 600, 110, 14);
    ctx.restore();
  }

  function drawButton(ctx, st) {
    st = S(st);
    var x = num(st.x), y = num(st.y), w = Math.max(0, num(st.w, 400)), h = Math.max(0, num(st.h, 100));
    var label = str(st.label);
    ctx.save();
    var sel = st.selected === true;
    rr(ctx, x, y, w, h, 16); ctx.fillStyle = sel ? '#f4f0e6' : P.panel2; ctx.fill();
    ctx.lineWidth = sel ? 5 : 2; ctx.strokeStyle = sel ? '#ffffff' : P.line; ctx.stroke();
    if (sel) { rr(ctx, x + 5, y + 5, Math.max(0, w - 10), Math.max(0, h - 10), 12); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke(); }
    plainText(ctx, label, x + w / 2, y + h / 2, Math.min(34, Math.max(18, h * 0.34)), sel ? P.ink : P.text, 'center', true);
    ctx.restore();
  }

  // ---------- 飄字 ----------
  function drawFloatText(ctx, st) {
    st = S(st);
    var kind = oneOf(st.kind, ['gold', 'redGold', 'splash', 'repDown', 'capture', 'levelUp', 'coin20'], 'gold');
    var p = ratio(st.t, num(st.dur, 1));
    var x = num(st.x), y = num(st.y) - 40 * p;
    var a = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
    var s = str(st.text);
    ctx.save();
    ctx.globalAlpha = clamp(a, 0, 1);
    var cfg = {
      gold: [24, P.gold], redGold: [30, P.gold], splash: [26, P.gold], repDown: [24, '#ff8a98'],
      capture: [34, '#ffffff'], levelUp: [28, P.tamerHat], coin20: [26, P.gold]
    }[kind];
    if (kind === 'redGold') {
      ctx.font = font(cfg[0], true); var w = ctx.measureText(s).width;
      rr(ctx, x - w / 2 - 10, y - 22, w + 20, 44, 10); ctx.fillStyle = 'rgba(18,15,24,0.75)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = P.redZone; ctx.stroke();
    }
    if (kind === 'splash') {
      ctx.font = font(cfg[0], true); var w2 = ctx.measureText(s).width;
      rr(ctx, x - w2 / 2 - 10, y - 20, w2 + 20, 40, 10); ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    }
    text(ctx, s, x, y, cfg[0], cfg[1]);
    ctx.restore();
  }

  // ---------- 結算 ----------
  function bigStar(ctx, x, y, r, on) {
    star(ctx, x, y, r); ctx.fillStyle = on ? P.gold : 'rgba(255,255,255,0.08)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = on ? '#8a5a10' : 'rgba(255,255,255,0.3)'; ctx.stroke();
  }
  function drawResultPanel(ctx, st) {
    st = S(st);
    var stars = clamp(Math.round(num(st.stars, 0)), 0, 3);
    var roster = Array.isArray(st.roster) ? st.roster : [];
    ctx.save();
    ctx.fillStyle = 'rgba(10,8,14,0.75)'; ctx.fillRect(0, 0, 720, 1280);
    rr(ctx, 50, 170, 620, 980, 24); ctx.fillStyle = P.panel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.line; ctx.stroke();
    text(ctx, '七天結算', 360, 240, 40, P.text);
    for (var i = 0; i < 3; i++) bigStar(ctx, 220 + i * 140, 350, 52, i < stars);
    plainText(ctx, '名聲 200 / 450 / 800 各一星', 360, 430, 17, P.textDim, 'center', false);
    var rows = [['總名聲', String(Math.round(num(st.rep, 0)))], ['累計賺得金幣', String(Math.round(num(st.goldEarned, 0)))], ['單次表演最多打中', Math.round(num(st.bestHits, 0)) + ' 隻']];
    rows.forEach(function (r, k) {
      var ry = 500 + k * 80;
      rr(ctx, 90, ry - 30, 540, 60, 12); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
      plainText(ctx, r[0], 116, ry, 24, P.textDim, 'left', true);
      plainText(ctx, r[1], 604, ry, 32, k === 1 ? P.gold : P.text, 'right', true);
    });
    plainText(ctx, '陣容', 116, 762, 24, P.textDim, 'left', true);
    roster.slice(0, 6).forEach(function (m, k) {
      m = S(m);
      var cx = 150 + (k % 3) * 210, cy = 840 + Math.floor(k / 3) * 120;
      ctx.save(); ctx.translate(cx - 30, cy); speciesBody(ctx, m.species, 32, 1); ctx.restore();
      plainText(ctx, SP_NAME[sp(m.species)], cx + 10, cy - 14, 19, P.text, 'left', true);
      plainText(ctx, 'Lv ' + clamp(Math.round(num(m.level, 0)), 0, 3), cx + 10, cy + 16, 18, P.textDim, 'left', true);
    });
    text(ctx, '按 Z 重來', 360, 1100, 30, '#ffffff');
    ctx.restore();
  }

  // ---------- HUD ----------
  var PHASE_TITLE = { guide: '習性相性秀', select: '選擇地下城', dungeon: '', setup1: '選上場魔物', setup2: '布置表演場', show: '表演中', shop: '商店', result: '結算' };
  function drawHud(ctx, st) {
    st = S(st);
    var phase = oneOf(st.phase, ['guide', 'select', 'dungeon', 'setup1', 'setup2', 'show', 'shop', 'result'], 'select');
    ctx.save();
    ctx.fillStyle = '#0e0c14'; ctx.fillRect(0, 0, 720, 120);
    ctx.fillStyle = P.line; ctx.fillRect(0, 119, 720, 1);
    if (phase === 'guide') {
      text(ctx, '習性相性秀', 360, 60, 36, P.text);
      ctx.restore(); return;
    }
    var day = Math.round(num(st.day, 1)), dayMax = Math.round(num(st.dayMax, 7));
    // 第一列: 天數 / 畫面名 / 金幣 / 名聲
    rr(ctx, 12, 10, 138, 40, 10); ctx.fillStyle = P.panel2; ctx.fill();
    plainText(ctx, '第 ' + day + ' / ' + dayMax + ' 天', 81, 30, 21, P.text, 'center', true);
    var title = phase === 'dungeon' ? (DUNGEON_NAME[st.dungeon] || '') : PHASE_TITLE[phase];
    plainText(ctx, title, 166, 30, 22, phase === 'dungeon' && THEME[st.dungeon] ? THEME[st.dungeon].accent : P.textDim, 'left', true);
    coin(ctx, 470, 30, 12);
    plainText(ctx, String(Math.round(num(st.gold, 0))), 488, 30, 26, P.gold, 'left', true);
    star(ctx, 584, 30, 13); ctx.fillStyle = '#ffffff'; ctx.fill();
    plainText(ctx, String(Math.round(num(st.rep, 0))), 602, 30, 26, P.text, 'left', true);
    // 計時(地下城 / 表演場)
    var tMax = num(st.timeMax, 0);
    if ((phase === 'dungeon' || phase === 'show') && tMax > 0) {
      var tl = clamp(num(st.timeLeft, 0), 0, tMax);
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(12, 56, 696, 6);
      ctx.fillStyle = tl / tMax < 0.17 ? P.heart : '#d8d4e6'; ctx.fillRect(12, 56, 696 * tl / tMax, 6);
      plainText(ctx, Math.ceil(tl) + '', 440, 30, 24, '#d8d4e6', 'right', true);
    }
    var msg = str(st.message);
    if (phase === 'dungeon') {
      var hearts = Math.max(0, Math.round(num(st.hearts, 0))), mh = clamp(Math.round(num(st.maxHearts, 5)), 0, 12);
      for (var i = 0; i < mh; i++) {
        heartPath(ctx, 26 + i * 26, 82, 24);
        ctx.fillStyle = i < hearts ? P.heart : 'rgba(255,255,255,0.1)'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = P.ink; ctx.stroke();
      }
      var rx0 = 26 + mh * 26 + 14;
      var ropes = Math.max(0, Math.round(num(st.ropes, 0))), rmax = clamp(Math.round(num(st.ropeMax, 3)), 0, 10);
      for (var k = 0; k < rmax; k++) {
        circle(ctx, rx0 + k * 24, 82, 8); ctx.lineWidth = 4; ctx.strokeStyle = k < ropes ? P.rope : 'rgba(255,255,255,0.12)'; ctx.stroke();
      }
      // 武器 + X 冷卻
      var w = oneOf(st.weapon, ['club', 'sword', 'spear', 'whip'], 'club');
      var bx = 640, by = 70, bs = 64;
      rr(ctx, bx, by - 2, bs, 46, 10); ctx.fillStyle = P.panel2; ctx.fill();
      ctx.save(); ctx.translate(bx + 10, by + 21); weaponIcon(ctx, w, 30); ctx.restore();
      var xMax = num(st.xCdMax, 0);
      if (xMax > 0) {
        var cdl = clamp(num(st.xCdLeft, 0), 0, xMax);
        circle(ctx, bx + 52, by + 21, 10); ctx.fillStyle = cdl > 0 ? P.ink : P.tamerHat; ctx.fill();
        if (cdl > 0) {
          ctx.beginPath(); ctx.moveTo(bx + 52, by + 21); ctx.arc(bx + 52, by + 21, 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - cdl / xMax)); ctx.closePath();
          ctx.fillStyle = 'rgba(47,211,196,0.5)'; ctx.fill();
        }
        plainText(ctx, 'X', bx + 52, by + 21, 13, cdl > 0 ? '#ffffff' : P.ink, 'center', true);
      }
      if (msg) {
        var hot = msg.indexOf('站住') >= 0 || msg.indexOf('繞') >= 0;
        plainText(ctx, msg, 630, 108, 18, hot ? '#ffffff' : P.textDim, 'right', true);
      }
    } else if (phase !== 'result') {
      if (msg) plainText(ctx, msg, 360, 94, 22, P.text, 'center', true);
    }
    ctx.restore();
  }

  // ---------- 說明頁(畫在 x,y,w,h 框內; 設計空間 640×1000 等比縮放置中) ----------
  var GUIDE = [
    { title: '地下城', body: '方向鍵走, Z 攻擊, X 武器技' },
    { title: '收服', body: '殘血時站上去, 再繞牠一圈' },
    { title: '布置', body: '開演前擺好魔物與機關, 開演後只能看' },
    { title: '紅區', body: '紅區最賺, 標記滿 5 個就失控' },
    { title: '目標', body: '7 天內賺到越多名聲越好' }
  ];
  function keycap(ctx, x, y, label, w) {
    w = w || 40;
    rr(ctx, x - w / 2, y - 20, w, 40, 8); ctx.fillStyle = '#e8e4f0'; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = P.ink; ctx.stroke();
    ctx.fillStyle = '#b8b4c8'; ctx.fillRect(x - w / 2 + 3, y + 12, w - 6, 5);
    plainText(ctx, label, x, y - 2, 22, P.ink, 'center', true);
  }
  function arrowKeys(ctx, x, y) {
    var s = 26;
    [[0, -1, 0], [-1, 0, Math.PI], [0, 0, Math.PI / 2], [1, 0, 0]].forEach(function (k) {
      var kx = x + k[0] * (s + 3), ky = y + k[1] * (s + 3);
      rr(ctx, kx - s / 2, ky - s / 2, s, s, 5); ctx.fillStyle = '#e8e4f0'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
      var a = k[2]; if (k[1] === -1) a = -Math.PI / 2;
      arrowHead(ctx, kx, ky, a, 7, P.ink);
    });
  }
  function label(ctx, s, x, y, px, col, align) { text(ctx, s, x, y, px || 20, col || '#ffffff', { align: align || 'center' }); }
  function curvedArrow(ctx, pts, col, lw) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    ctx.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]);
    ctx.lineCap = 'round'; ctx.lineWidth = (lw || 5) + 3; ctx.strokeStyle = P.ink; ctx.stroke();
    ctx.lineWidth = lw || 5; ctx.strokeStyle = col; ctx.stroke();
    arrowHead(ctx, pts[4], pts[5], Math.atan2(pts[5] - pts[3], pts[4] - pts[2]), 13, col);
  }
  function scene(ctx, tx, ty, s, fn) { ctx.save(); ctx.translate(tx, ty); ctx.scale(s, s); fn(); ctx.restore(); }
  function framePanel(ctx, x, y, w, h) {
    rr(ctx, x, y, w, h, 14); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.line; ctx.stroke();
  }
  function floorPatch(ctx, x, y, cols, rows, d, walls) {
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var kind = 'floor';
      if (walls && (r === 0 || c === 0)) kind = 'wall';
      drawTile(ctx, { x: x + c * 60 + 30, y: y + r * 60 + 30, dungeon: d, kind: kind, room: 'top', nest: false });
    }
  }

  function guide1(ctx) {
    ctx.save(); rr(ctx, 20, 150, 600, 480, 14); ctx.clip();
    floorPatch(ctx, 20, 150, 10, 8, 'cave', true);
    drawTile(ctx, { x: 530, y: 570, dungeon: 'cave', kind: 'lava', room: 'top' });
    ctx.restore();
    framePanel(ctx, 20, 150, 600, 480);
    // 另一隻火蜥蜴正在放火圈(預警)
    drawHazard(ctx, { x: 450, y: 330, kind: 'firering', phase: 'warn', radius: 120, t: 0.3, dur: 0.5 });
    drawWildMonster(ctx, { x: 450, y: 330, species: 'fire', hp: 10, maxHp: 10, casting: true, dir: -1 });
    // 馴獸師朝右敲中火蜥蜴
    drawWeaponFx(ctx, { x: 200, y: 520, weapon: 'club', move: 'normal', shape: 'arc', angle: 0, spread: 100 * Math.PI / 180, radius: 70, t: 0.05, dur: 0.2 });
    drawWildMonster(ctx, { x: 262, y: 520, species: 'fire', hp: 6, maxHp: 10, hit: true, dir: -1 });
    drawTamer(ctx, { x: 200, y: 520, facing: 2, weapon: 'club' });
    // 移動箭頭繞開火圈
    curvedArrow(ctx, [186, 494, 150, 300, 300, 190], '#ffffff', 5);
    // 鍵帽貼在動作旁
    arrowKeys(ctx, 100, 330);
    label(ctx, '走', 100, 390, 22);
    keycap(ctx, 268, 590, 'Z'); label(ctx, '攻擊', 318, 590, 20, '#ffffff', 'left');
    keycap(ctx, 110, 590, 'X'); label(ctx, '武器技', 140, 590, 20, '#ffffff', 'left');
    label(ctx, '火圈預警: 快離開', 450, 470, 18, P.fireLight);
  }
  function guide2(ctx) {
    // 左: 準備捕捉
    framePanel(ctx, 10, 150, 305, 420);
    ctx.save(); rr(ctx, 10, 150, 305, 420, 14); ctx.clip(); floorPatch(ctx, 10, 150, 6, 7, 'cave', false); ctx.restore();
    framePanel(ctx, 10, 150, 305, 420);
    drawWildMonster(ctx, { x: 162, y: 340, species: 'water', hp: 2, maxHp: 7, weak: true, dir: 1 });
    drawTamer(ctx, { x: 174, y: 356, facing: 7, weapon: 'club' });
    drawCaptureRing(ctx, { x: 162, y: 340, t: 0.4, dur: 0.8 });
    label(ctx, '1 站上去', 162, 190, 24);
    label(ctx, '虛線圈 = 站進來', 162, 500, 18, P.textDim);
    // 右: 套索繞圈
    ctx.save(); rr(ctx, 325, 150, 305, 420, 14); ctx.clip(); floorPatch(ctx, 325, 150, 6, 7, 'cave', false); ctx.restore();
    framePanel(ctx, 325, 150, 305, 420);
    var mx = 477, my = 360;
    // 繞圈路線
    ctx.beginPath(); ctx.arc(mx, my, 100, -Math.PI * 0.2, Math.PI * 1.25);
    ctx.setLineDash([12, 8]); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.stroke(); ctx.setLineDash([]);
    arrowHead(ctx, mx + Math.cos(Math.PI * 1.25) * 100, my + Math.sin(Math.PI * 1.25) * 100, Math.PI * 1.25 + Math.PI / 2, 13, '#ffffff');
    var tx = mx + Math.cos(-Math.PI * 0.2) * 100, ty = my + Math.sin(-Math.PI * 0.2) * 100;
    drawLasso(ctx, { x1: tx, y1: ty, x2: mx, y2: my, progress: 0.5, t: 1.5, limit: 5, len: 100, maxLen: 220 });
    drawWildMonster(ctx, { x: mx, y: my, species: 'water', hp: 2, maxHp: 7, weak: true, lassoed: true, stunLeft: 0, stunDur: 2, dir: -1 });
    drawTamer(ctx, { x: tx, y: ty, facing: 4, weapon: 'club', lassoing: true });
    label(ctx, '2 繞牠一圈', 477, 190, 24);
    // 角落小圖: 收服
    framePanel(ctx, 200, 600, 240, 230);
    ctx.save();
    circle(ctx, 320, 715, 50); ctx.lineWidth = 7; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.translate(320, 715);
    speciesBody(ctx, 'water', 30, 1, { alpha: 0.25 });
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-6, 16); ctx.lineTo(24, -18);
    ctx.lineWidth = 12; ctx.strokeStyle = P.ink; ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = '#8fe07a'; ctx.stroke();
    ctx.restore();
    label(ctx, '收服!', 320, 640, 24);
    label(ctx, '圈滿', 320, 800, 18, P.textDim);
  }
  function guide3(ctx) {
    // A: 布置畫面 (遊戲座標 ×0.5)
    var monsters = [[0, 0, 'fire'], [2, 1, 'water'], [0, 3, 'stone']];
    scene(ctx, 10, 75, 0.5, function () {
      drawShowArena(ctx);
      for (var r = 0; r < 4; r++) for (var c = 0; c < 3; c++) {
        drawSetupCell(ctx, { x: 160 + 200 * c, y: 360 + 180 * r, selected: (c === 1 && r === 2) });
      }
      monsters.forEach(function (m) {
        drawShowMonster(ctx, { x: 160 + 200 * m[0], y: 360 + 180 * m[1], species: m[2], level: 0, rage: 40, redLow: 80, marks: 0, mode: 'roam', dir: 1 });
      });
      drawGadget(ctx, { x: 360, y: 360, kind: 'drum' });
      drawGadget(ctx, { x: 560, y: 900, kind: 'wall' });
      drawButton(ctx, { x: 480, y: 1160, w: 180, h: 100, label: '開演', selected: false });
      drawSetupInfo(ctx, { x: 260, y: 1210, gold: 40, placed: 3, picked: 3 });
    });
    label(ctx, '游標', 190, 435, 18);
    // 選擇面板(打開在游標格旁)
    scene(ctx, 268, 6, 0.6, function () {
      drawPickerPanel(ctx, {
        index: 1, options: [
          { type: 'gadget', key: 'drum', name: '戰鼓', cost: 15, desc: '每 3 秒讓周圍魔物生氣', affordable: true },
          { type: 'gadget', key: 'fountain', name: '噴泉', cost: 15, desc: '每 3 秒讓周圍魔物冷靜', affordable: true },
          { type: 'gadget', key: 'bait', name: '肉塊', cost: 10, desc: '把附近魔物吸過來', affordable: true },
          { type: 'gadget', key: 'wall', name: '矮牆', cost: 5, desc: '擋住魔物走路和飛彈', affordable: true },
          { type: 'clear', key: '', name: '清空', cost: 0, desc: '', affordable: true }
        ]
      });
    });
    // 箭頭: 開演 → 開演後縮圖
    curvedArrow(ctx, [340, 690, 380, 760, 420, 760], '#ffffff', 5);
    // B: 開演後縮圖 (×0.3)
    scene(ctx, 420, 600, 0.3, function () {
      drawShowArena(ctx);
      drawGadget(ctx, { x: 360, y: 360, kind: 'drum' });
      drawGadget(ctx, { x: 560, y: 900, kind: 'wall' });
      drawGadgetPulse(ctx, { x: 360, y: 360, kind: 'drum', radius: 160, t: 0.15, dur: 0.4 });
      drawHazard(ctx, { x: 300, y: 430, kind: 'firering', phase: 'active', radius: 120, t: 0.1, dur: 0.5 });
      drawShowMonster(ctx, { x: 300, y: 430, species: 'fire', level: 0, rage: 70, redLow: 80, mode: 'roam', performing: true, performT: 0.1, performDur: 0.5, dir: 1 });
      drawShowMonster(ctx, { x: 420, y: 520, species: 'water', level: 0, rage: 60, redLow: 80, mode: 'roam', fx: 'ignited', fxT: 0.1, fxDur: 0.5, dir: -1 });
      drawShowMonster(ctx, { x: 160, y: 900, species: 'stone', level: 0, rage: 52, redLow: 80, mode: 'roam', dir: 1 });
    });
    label(ctx, '開演後', 528, 580, 20);
  }
  function guide4(ctx) {
    // 上: 紅區表演 ×2
    framePanel(ctx, 20, 140, 600, 360);
    ctx.save(); rr(ctx, 20, 140, 600, 360, 14); ctx.clip(); ctx.fillStyle = P.arenaSand; ctx.fillRect(20, 140, 600, 360); ctx.restore();
    scene(ctx, 220, 340, 2, function () {
      drawShowMonster(ctx, { x: 0, y: 0, species: 'fire', level: 1, rage: 88, redLow: 75, marks: 0, mode: 'roam', performing: true, performT: 0.15, performDur: 0.5, dir: 1 });
    });
    drawFloatText(ctx, { x: 470, y: 280, text: '+10 ×2', kind: 'redGold', t: 0.1, dur: 1 });
    // 指出紅區段
    var rzX = 220 + (-45 + 2 + 86 * 0.75) * 2, rzY = 340 + 44 * 2;
    ctx.beginPath(); ctx.moveTo(rzX + 40, rzY + 42); ctx.lineTo(rzX + 30, rzY + 16);
    ctx.lineWidth = 4; ctx.strokeStyle = P.redZone; ctx.stroke();
    label(ctx, '紅區', rzX + 54, rzY + 52, 20, P.redZone, 'left');
    // 下: 標記滿 5 → 失控撞欄
    framePanel(ctx, 20, 530, 600, 400);
    ctx.save(); rr(ctx, 20, 530, 600, 400, 14); ctx.clip();
    ctx.fillStyle = P.arenaSand; ctx.fillRect(20, 530, 600, 400);
    ctx.fillStyle = P.stands; ctx.fillRect(340, 530, 280, 130);
    ctx.restore();
    framePanel(ctx, 20, 530, 600, 400);
    scene(ctx, 160, 790, 1.6, function () {
      drawShowMonster(ctx, { x: 0, y: 0, species: 'thunder', level: 0, rage: 100, redLow: 80, marks: 4, markLeft: 3, markDur: 4, mode: 'roam', dir: 1 });
      markRow(ctx, 0, -43, 5);
    });
    label(ctx, '5 個', 160, 690, 20, P.redZone);
    curvedArrow(ctx, [250, 780, 330, 760, 380, 700], '#ffffff', 5);
    // 撞破圍欄、衝進觀眾席
    scene(ctx, 0, 0, 1, function () {
      drawFence(ctx, { x: 420, y: 670, side: 'top', broken: true });
      drawFence(ctx, { x: 530, y: 670, side: 'top', broken: false });
      drawVisitor(ctx, { x: 520, y: 590, side: 'top', mode: 'scared' });
      drawShowMonster(ctx, { x: 440, y: 600, species: 'thunder', level: 0, rage: 100, redLow: 80, mode: 'loose', looseT: 1, looseDur: 6, dir: 1 });
    });
    // 打叉
    ctx.save(); ctx.translate(560, 790); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-26, -26); ctx.lineTo(26, 26); ctx.moveTo(26, -26); ctx.lineTo(-26, 26);
    ctx.lineWidth = 14; ctx.strokeStyle = P.ink; ctx.stroke(); ctx.lineWidth = 9; ctx.strokeStyle = P.redZone; ctx.stroke();
    ctx.restore();
    label(ctx, '失控: 名聲下降', 470, 870, 20, '#ff8a98');
  }
  function guide5(ctx) {
    var cx = 320, cy = 450, R = 200;
    var nodes = [['地下城', -Math.PI / 2], ['布置', 0], ['表演', Math.PI / 2], ['商店', Math.PI]];
    // 循環箭頭
    for (var i = 0; i < 4; i++) {
      var a0 = nodes[i][1] + 0.42, a1 = nodes[i][1] + Math.PI / 2 - 0.42;
      ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1);
      ctx.lineWidth = 9; ctx.strokeStyle = P.ink; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      arrowHead(ctx, cx + Math.cos(a1) * R, cy + Math.sin(a1) * R, a1 + Math.PI / 2, 14, '#ffffff');
    }
    nodes.forEach(function (n, k) {
      var nx = cx + Math.cos(n[1]) * R, ny = cy + Math.sin(n[1]) * R;
      circle(ctx, nx, ny, 64); ctx.fillStyle = P.panel2; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.line; ctx.stroke();
      ctx.save(); ctx.translate(nx, ny - 12);
      if (k === 0) drawTamer(ctx, { x: 0, y: 0, facing: 2, weapon: 'club' });
      else if (k === 1) { ctx.scale(0.7, 0.7); gadgetBody(ctx, 'drum', false); }
      else if (k === 2) speciesBody(ctx, 'fire', 26, 1);
      else { coin(ctx, 0, 0, 18); }
      ctx.restore();
      label(ctx, n[0], nx, ny + 36, 20);
    });
    text(ctx, '×7 天', cx, cy, 44, '#ffffff');
    // 表演旁名聲往上加
    var px = cx + 100, py = cy + R + 10;
    for (var j = 0; j < 3; j++) {
      star(ctx, px + 20 + j * 14, py - 10 - j * 26, 12); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
    }
    label(ctx, '+名聲', px + 100, py - 40, 20, '#ffffff');
    // 終點: 結算星數
    curvedArrow(ctx, [cx - 60, cy + R + 66, cx - 60, cy + R + 120, cx - 20, cy + R + 150], '#ffffff', 5);
    framePanel(ctx, 170, 800, 300, 120);
    label(ctx, '結算', 320, 826, 20, P.textDim);
    for (var s = 0; s < 3; s++) bigStar(ctx, 250 + s * 70, 875, 26, true);
  }
  function drawGuidePage(ctx, st) {
    st = S(st);
    var page = clamp(Math.round(num(st.page, 0)), 0, GUIDE.length - 1);
    var bx = num(st.x, 0), by = num(st.y, 0), bw = Math.max(1, num(st.w, 720)), bh = Math.max(1, num(st.h, 1280));
    var s = Math.min(bw / 640, bh / 1000);
    ctx.save();
    ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
    ctx.translate(bx + (bw - 640 * s) / 2, by + (bh - 1000 * s) / 2);
    ctx.scale(s, s);
    var g = GUIDE[page];
    text(ctx, g.title, 320, 44, 40, P.text);
    text(ctx, g.body, 320, 104, 26, '#ffe9b0');
    [guide1, guide2, guide3, guide4, guide5][page](ctx);
    plainText(ctx, (page + 1) + ' / ' + GUIDE.length, 600, 972, 20, P.textDim, 'right', true);
    text(ctx, page === GUIDE.length - 1 ? '按 Z 開始' : '按 Z 繼續', 320, 966, 24, '#ffffff');
    ctx.restore();
  }

  window.Art = {
    canvas: { width: 720, height: 1280 },
    palette: P,
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
    drawBoostLink: drawBoostLink,
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
