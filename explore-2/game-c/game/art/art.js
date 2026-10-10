// 人潮閘門動物園 — 美術(Canvas 2D 幾何繪製, 無外部資源)
// 契約見 style.md。所有 x, y 皆為物件中心點。
(function () {
  'use strict';

  var W = 720, H = 1280;
  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';

  var P = {
    bg: '#15121c',
    hudBg: '#0e0b14',
    hudLine: '#3a3348',
    panel: '#221d2c',
    panelLine: '#4a4358',
    text: '#f2eef8',
    textDim: '#a59db5',
    outline: '#0c0a12',
    // 地下城
    floorA: '#2e2838', floorB: '#2a2434', floorLine: '#1d1824',
    wallTop: '#6a5e78', wallSide: '#3b3346', wallMortar: '#554a63',
    stairs: '#d9ccb0', stairsDark: '#8a7f6c',
    player: '#eef3ff', playerAccent: '#2ec4b6', playerCape: '#1f8f86',
    playerHurt: '#ff9a9a',
    trap: '#c8cbd6', trapBase: '#24202b',
    // 魔物種類
    fire: '#ff8a1f', water: '#3fb6ff', thunder: '#b57bff', stone: '#9b9aa6',
    // 語意色
    danger: '#ff3b4a',
    ok: '#5be37a',
    gold: '#ffd84a',
    rep: '#ff8ee0',
    select: '#ffffff',
    calm: '#8e9bb5',
    hot: '#ff6b6b',
    hpBar: '#e9e4f0',
    playerHp: '#9ff0e6',
    // 動物園
    grass: '#1d2a24', grassDot: '#24342c',
    plaza: '#4a4456', plazaLine: '#413b4c',
    view: '#544c60', viewLine: '#4a4356',
    path: '#3d3747',
    dirt: '#3e3429', dirtDot: '#4a3f32', rock: '#2a2420',
    fence: '#9a7650', fenceDark: '#5a4430',
    visitorPants: '#3a3446', skin: '#f0cfae'
  };

  var SPECIES = {
    fire: { main: P.fire, dark: '#a8500c', light: '#ffc08a' },
    water: { main: P.water, dark: '#1c6aa0', light: '#b9e8ff' },
    thunder: { main: P.thunder, dark: '#6a3fb0', light: '#e2ccff' },
    stone: { main: P.stone, dark: '#5c5b66', light: '#c6c5cf' }
  };
  var SHIRTS = ['#c9a27e', '#8fa3c4', '#b98fb0', '#9fb07f'];
  var HAIR = ['#4a3426', '#2a2a34', '#7a4a2a', '#3a2a3a'];

  // ---------- 小工具 ----------
  function font(px, bold) { return (bold === false ? '' : 'bold ') + px + 'px ' + FONT; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function num(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; }

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

  function txt(ctx, s, x, y, px, color, o) {
    o = o || {};
    ctx.font = font(px, o.bold);
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = 'middle';
    if (o.outline !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = o.ow || Math.max(3, px * 0.2);
      ctx.strokeStyle = o.oc || 'rgba(10,8,16,0.92)';
      ctx.strokeText(String(s), x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(String(s), x, y);
  }

  function dirAngle(d) {
    if (d === 'up') return -Math.PI / 2;
    if (d === 'down') return Math.PI / 2;
    if (d === 'left') return Math.PI;
    if (d === 'right') return 0;
    return null;
  }

  function star(ctx, cx, cy, r, fill, stroke, lw) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var rad = i % 2 === 0 ? r : r * 0.45;
      var px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.lineJoin = 'round'; ctx.stroke(); }
  }

  function coin(ctx, cx, cy, r) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = P.gold; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.22); ctx.strokeStyle = '#8a6a10'; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(1, r * 0.16); ctx.strokeStyle = '#c99a1a'; ctx.stroke();
  }

  function check(ctx, cx, cy, r, alpha) {
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = P.ok; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.5, cy + r * 0.02);
    ctx.lineTo(cx - r * 0.12, cy + r * 0.42);
    ctx.lineTo(cx + r * 0.55, cy - r * 0.38);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = r * 0.28; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function cross(ctx, cx, cy, r, alpha) {
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - r, cy - r); ctx.lineTo(cx + r, cy + r);
    ctx.moveTo(cx + r, cy - r); ctx.lineTo(cx - r, cy + r);
    ctx.lineWidth = r * 0.75; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.lineWidth = r * 0.42; ctx.strokeStyle = P.danger; ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // 箭頭(圓頭箭桿 + 兩翼), 方向角 a
  function arrow(ctx, x1, y1, x2, y2, color, lw, dashed) {
    var a = Math.atan2(y2 - y1, x2 - x1);
    var hl = lw * 3.2;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = color; ctx.lineWidth = lw;
    if (dashed) ctx.setLineDash([lw * 2.2, lw * 1.8]);
    ctx.beginPath(); ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - Math.cos(a) * hl * 0.6, y2 - Math.sin(a) * hl * 0.6); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.5) * hl, y2 - Math.sin(a - 0.5) * hl);
    ctx.lineTo(x2 - Math.cos(a + 0.5) * hl, y2 - Math.sin(a + 0.5) * hl);
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }

  // 鍵帽: glyph 為 'left'|'right'|'up'|'down' 或文字
  function keycap(ctx, cx, cy, w, h, glyph, border) {
    ctx.fillStyle = '#5a5368';
    rr(ctx, cx - w / 2, cy - h / 2 + 3, w, h - 3, 6); ctx.fill();
    ctx.fillStyle = '#f2eef8';
    rr(ctx, cx - w / 2, cy - h / 2, w, h - 4, 6); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = border || P.outline;
    rr(ctx, cx - w / 2, cy - h / 2, w, h - 4, 6); ctx.stroke();
    var a = dirAngle(glyph);
    var gy = cy - 2;
    if (a !== null) {
      var L = Math.min(w, h) * 0.28;
      ctx.save(); ctx.translate(cx, gy); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(L * 0.3, 0);
      ctx.lineWidth = Math.max(2, h * 0.11); ctx.lineCap = 'round'; ctx.strokeStyle = '#1a1622'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(L, 0); ctx.lineTo(L * 0.1, -L * 0.7); ctx.lineTo(L * 0.1, L * 0.7); ctx.closePath();
      ctx.fillStyle = '#1a1622'; ctx.fill();
      ctx.restore();
    } else {
      txt(ctx, glyph, cx, gy, Math.round(h * 0.42), '#1a1622', { outline: false });
    }
  }

  // ---------- 眼睛 ----------
  function eyes(ctx, pts, mode, r) {
    for (var i = 0; i < pts.length; i++) {
      var x = pts[i][0], y = pts[i][1];
      var side = (i === 0) ? -1 : 1;
      ctx.lineCap = 'round';
      if (mode === 'sleep') {
        ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
        ctx.lineWidth = 2.2; ctx.strokeStyle = P.outline; ctx.stroke();
      } else if (mode === 'tired') {
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI); ctx.closePath();
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y + r * 0.45, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = P.outline; ctx.fill();
        ctx.beginPath(); ctx.moveTo(x - r - 1, y); ctx.lineTo(x + r + 1, y);
        ctx.lineWidth = 2.2; ctx.strokeStyle = P.outline; ctx.stroke();
      } else if (mode === 'stun') {
        ctx.beginPath(); ctx.arc(x, y, r + 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.lineWidth = 1.6; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, r * 0.45, 0, Math.PI * 1.6); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y + 0.5, r * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = P.outline; ctx.fill();
        if (mode === 'angry') {
          ctx.beginPath();
          ctx.moveTo(x - side * r * 1.3, y - r - 3.5);
          ctx.lineTo(x + side * r * 1.1, y - r * 0.6);
          ctx.lineWidth = 2.6; ctx.strokeStyle = P.outline; ctx.stroke();
        }
      }
    }
  }

  // ---------- 魔物本體(單位座標, 外接約 ±34) ----------
  function speciesCols(sp, flash) {
    var c = SPECIES[sp] || SPECIES.fire;
    if (flash) return { main: '#ffffff', dark: '#ffb3b3', light: '#ffffff' };
    return c;
  }

  function monsterBody(ctx, sp, cols, eyeMode) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (sp === 'water') {
      for (var i = -15; i <= 15; i += 10) {
        ctx.beginPath(); ctx.moveTo(i, 4);
        ctx.quadraticCurveTo(i + 5, 14, i, 20);
        ctx.quadraticCurveTo(i - 5, 26, i, 30);
        ctx.lineWidth = 3.5; ctx.strokeStyle = cols.light; ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-26, 4);
      ctx.arc(0, 2, 26, Math.PI, 0);
      ctx.lineTo(26, 4);
      for (var k = 0; k < 4; k++) {
        var x0 = 26 - k * 13;
        ctx.quadraticCurveTo(x0 - 6.5, 11, x0 - 13, 4);
      }
      ctx.closePath();
      ctx.fillStyle = cols.main; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = cols.dark; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-9, -12, 7, 4, -0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
      eyes(ctx, [[-8, -6], [8, -6]], eyeMode, 4);
    } else if (sp === 'thunder') {
      ctx.fillStyle = cols.dark;
      ctx.beginPath(); ctx.moveTo(-14, -2); ctx.lineTo(-34, -16); ctx.lineTo(-28, 12); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(14, -2); ctx.lineTo(34, -16); ctx.lineTo(28, 12); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-6, 21); ctx.lineTo(-6, 28); ctx.moveTo(6, 21); ctx.lineTo(6, 28);
      ctx.lineWidth = 3; ctx.strokeStyle = cols.dark; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 4, 19, 0, Math.PI * 2);
      ctx.fillStyle = cols.main; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = cols.dark; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 11, 11, 7, 0, 0, Math.PI * 2);
      ctx.fillStyle = cols.light; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(4, -30); ctx.lineTo(-7, -16); ctx.lineTo(0, -16); ctx.lineTo(-5, -8);
      ctx.lineTo(8, -20); ctx.lineTo(1, -20); ctx.closePath();
      ctx.fillStyle = '#f6eaff'; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = cols.dark; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4, 5); ctx.lineTo(4, 5); ctx.lineTo(0, 11); ctx.closePath();
      ctx.fillStyle = '#f6eaff'; ctx.fill();
      eyes(ctx, [[-7, -2], [7, -2]], eyeMode, 4);
    } else if (sp === 'stone') {
      ctx.fillStyle = cols.dark;
      ctx.beginPath(); ctx.moveTo(-18, -6); ctx.lineTo(-34, -18); ctx.lineTo(-32, 4); ctx.lineTo(-20, 12); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(18, -6); ctx.lineTo(34, -18); ctx.lineTo(32, 4); ctx.lineTo(20, 12); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-18, -12); ctx.lineTo(-14, -28); ctx.lineTo(-8, -12); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(18, -12); ctx.lineTo(14, -28); ctx.lineTo(8, -12); ctx.closePath(); ctx.fill();
      ctx.fillRect(-16, 23, 10, 5); ctx.fillRect(6, 23, 10, 5);
      rr(ctx, -21, -14, 42, 39, 8);
      ctx.fillStyle = cols.main; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = cols.dark; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-12, 9); ctx.lineTo(-6, 15); ctx.lineTo(-10, 21);
      ctx.moveTo(10, 8); ctx.lineTo(13, 14);
      ctx.lineWidth = 1.5; ctx.strokeStyle = cols.dark; ctx.stroke();
      eyes(ctx, [[-8, -2], [8, -2]], eyeMode, 3.8);
    } else { // fire
      ctx.beginPath(); ctx.moveTo(-16, 10); ctx.quadraticCurveTo(-32, 12, -29, -4);
      ctx.lineWidth = 7; ctx.strokeStyle = cols.main; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-30, -24); ctx.quadraticCurveTo(-21, -12, -29, -3);
      ctx.quadraticCurveTo(-38, -12, -30, -24); ctx.closePath();
      ctx.fillStyle = cols === SPECIES.fire ? '#ffd04a' : cols.light; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = cols.dark; ctx.stroke();
      ctx.fillStyle = cols.dark;
      ctx.fillRect(-15, 15, 6, 10); ctx.fillRect(-3, 16, 6, 10); ctx.fillRect(9, 15, 6, 10);
      ctx.beginPath(); ctx.ellipse(0, 8, 20, 13, 0, 0, Math.PI * 2);
      ctx.fillStyle = cols.main; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = cols.dark; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(2, 13, 12, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = cols.light; ctx.fill();
      ctx.beginPath(); ctx.arc(14, -8, 13, 0, Math.PI * 2);
      ctx.fillStyle = cols.main; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = cols.dark; ctx.stroke();
      eyes(ctx, [[10, -11], [19, -11]], eyeMode, 3.4);
    }
  }

  function hpBar(ctx, cx, cy, w, h, ratio, color, tick) {
    ctx.fillStyle = '#120f18';
    rr(ctx, cx - w / 2 - 1.5, cy - h / 2 - 1.5, w + 3, h + 3, 3); ctx.fill();
    var fw = Math.max(0, Math.min(1, ratio)) * w;
    if (fw > 0) { ctx.fillStyle = color; rr(ctx, cx - w / 2, cy - h / 2, Math.max(fw, 2), h, 2); ctx.fill(); }
    if (tick) {
      ctx.beginPath(); ctx.moveTo(cx, cy - h / 2 - 1.5); ctx.lineTo(cx, cy + h / 2 + 1.5);
      ctx.lineWidth = 2; ctx.strokeStyle = '#6a6278'; ctx.stroke();
    }
  }

  // ---------- 地板格(共用, 說明頁也用) ----------
  function floorTiles(ctx, x0, y0, cols, rows, day, fl) {
    var tint = [[P.floorA, P.floorB], ['#2a2a3c', '#262638'], ['#342a30', '#30262c']][clamp((num(day, 1) | 0) - 1, 0, 2)];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      ctx.fillStyle = tint[(r + c) % 2];
      ctx.fillRect(x0 + c * 96, y0 + r * 96, 96, 96);
    }
    if (num(fl, 1) >= 2) { ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(x0, y0, cols * 96, rows * 96); }
    ctx.strokeStyle = P.floorLine; ctx.lineWidth = 2;
    ctx.beginPath();
    for (var c2 = 0; c2 <= cols; c2++) { ctx.moveTo(x0 + c2 * 96, y0); ctx.lineTo(x0 + c2 * 96, y0 + rows * 96); }
    for (var r2 = 0; r2 <= rows; r2++) { ctx.moveTo(x0, y0 + r2 * 96); ctx.lineTo(x0 + cols * 96, y0 + r2 * 96); }
    ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#4a4358';
    ctx.strokeRect(x0 - 1.5, y0 - 1.5, cols * 96 + 3, rows * 96 + 3);
  }

  // ---------- 匯出函式 ----------
  function drawBackground(ctx) {
    ctx.save();
    ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawDungeonFloor(ctx, s) {
    s = s || {};
    ctx.save();
    floorTiles(ctx, 24, 160, 7, 9, s.day, s.floor);
    ctx.restore();
  }

  function drawWall(ctx, s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.fillStyle = P.wallSide; ctx.fillRect(-48, -48, 96, 96);
    rr(ctx, -45, -46, 90, 78, 6); ctx.fillStyle = P.wallTop; ctx.fill();
    ctx.strokeStyle = P.wallMortar; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-45, -20); ctx.lineTo(45, -20);
    ctx.moveTo(-45, 6); ctx.lineTo(45, 6);
    ctx.moveTo(-8, -46); ctx.lineTo(-8, -20);
    ctx.moveTo(18, -20); ctx.lineTo(18, 6);
    ctx.moveTo(-22, -20); ctx.lineTo(-22, 6);
    ctx.moveTo(4, 6); ctx.lineTo(4, 32);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-40, -43); ctx.lineTo(40, -43);
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.stroke();
    ctx.restore();
  }

  function drawStairs(ctx, s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.fillStyle = '#141019'; ctx.fillRect(-46, -46, 92, 92);
    var shades = ['#6f6656', '#8f8572', '#b4a990', P.stairs];
    for (var i = 0; i < 4; i++) {
      var y = -40 + i * 20, inset = 14 - i * 4;
      ctx.fillStyle = shades[i];
      ctx.fillRect(-40 + inset, y, 80 - inset * 2, 15);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(-40 + inset, y + 12, 80 - inset * 2, 3);
    }
    ctx.lineWidth = 4; ctx.strokeStyle = P.ok;
    rr(ctx, -44, -44, 88, 88, 8); ctx.stroke();
    ctx.restore();
  }

  function drawPlayer(ctx, s) {
    var hp = num(s.hp, 1), maxHp = Math.max(1, num(s.maxHp, 1));
    var a = dirAngle(s.attackDir);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.save();
    var ox = 0, oy = 0;
    if (a !== null) { ox = Math.cos(a) * 4; oy = Math.sin(a) * 4; }
    if (s.hit) ox += (Math.floor(Date.now() / 40) % 2 ? 3 : -3);
    ctx.translate(ox, oy + 4);
    var body = s.hit ? P.playerHurt : P.player;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // 披風
    ctx.beginPath(); ctx.moveTo(-15, -6); ctx.lineTo(15, -6); ctx.lineTo(20, 24); ctx.lineTo(-20, 24); ctx.closePath();
    ctx.fillStyle = P.playerCape; ctx.fill();
    // 腳
    ctx.fillStyle = '#2b3a4a'; ctx.fillRect(-11, 20, 8, 7); ctx.fillRect(3, 20, 8, 7);
    // 身體
    rr(ctx, -15, -6, 30, 28, 9); ctx.fillStyle = body; ctx.fill();
    ctx.lineWidth = 2.2; ctx.strokeStyle = '#2b3a4a'; ctx.stroke();
    ctx.fillStyle = P.playerAccent; ctx.fillRect(-14, 9, 28, 4);
    // 頭盔
    ctx.beginPath(); ctx.arc(0, -16, 13, 0, Math.PI * 2);
    ctx.fillStyle = body; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3, -29); ctx.lineTo(3, -29); ctx.lineTo(0, -35); ctx.closePath();
    ctx.fillStyle = P.playerAccent; ctx.fill();
    rr(ctx, -9, -19, 18, 6, 3); ctx.fillStyle = '#1a2a36'; ctx.fill();
    ctx.fillStyle = P.playerAccent;
    ctx.fillRect(-6, -17, 3, 2); ctx.fillRect(3, -17, 3, 2);
    // 劍
    if (a === null) {
      ctx.beginPath(); ctx.moveTo(21, 10); ctx.lineTo(21, -22);
      ctx.lineWidth = 4; ctx.strokeStyle = '#dfe6f0'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(15, 10); ctx.lineTo(27, 10);
      ctx.lineWidth = 3; ctx.strokeStyle = '#8a96a8'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(21, 10); ctx.lineTo(21, 17);
      ctx.lineWidth = 3; ctx.strokeStyle = '#5a4430'; ctx.stroke();
    }
    ctx.restore();
    if (a !== null) {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(37, 0);
      ctx.lineWidth = 5; ctx.strokeStyle = '#dfe6f0'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(12, -6); ctx.lineTo(12, 6);
      ctx.lineWidth = 3; ctx.strokeStyle = '#8a96a8'; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 35, -0.7, 0.7);
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
      ctx.restore();
    }
    var ratio = hp / maxHp;
    hpBar(ctx, 0, -42, 60, 7, ratio, ratio <= 0.3 ? P.danger : P.playerHp, false);
    ctx.restore();
  }

  function drawMonster(ctx, s) {
    var hp = num(s.hp, 1), maxHp = Math.max(1, num(s.maxHp, 1));
    var a = dirAngle(s.attackDir);
    ctx.save();
    ctx.translate(s.x, s.y);
    // 疲憊: 腳下綠色虛線圈 = 可以被夾
    if (s.tired) {
      ctx.beginPath(); ctx.ellipse(0, 30, 32, 11, 0, 0, Math.PI * 2);
      ctx.setLineDash([7, 5]); ctx.lineWidth = 3.5; ctx.strokeStyle = P.ok; ctx.stroke(); ctx.setLineDash([]);
    }
    var ox = 0, oy = 0;
    if (a !== null) { ox = Math.cos(a) * 5; oy = Math.sin(a) * 5; }
    if (s.hit) ox += (Math.floor(Date.now() / 40) % 2 ? 3 : -3);
    ctx.save();
    ctx.translate(ox, oy + 6);
    var mode = s.stunned ? 'stun' : (s.tired ? 'tired' : (a !== null ? 'angry' : 'normal'));
    monsterBody(ctx, s.species, speciesCols(s.species, !!s.hit), mode);
    ctx.restore();
    // 暈住: 頭上三顆白星
    if (s.stunned) {
      star(ctx, -20, -30, 5, '#ffffff', P.outline, 1.5);
      star(ctx, 0, -33, 5, '#ffffff', P.outline, 1.5);
      star(ctx, 20, -30, 5, '#ffffff', P.outline, 1.5);
    }
    // 攻擊: 往目標方向的紅色爪痕(打到你)
    if (a !== null) {
      ctx.save();
      ctx.rotate(a);
      ctx.lineCap = 'round';
      for (var i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(30, i * 11 - 5); ctx.lineTo(44, i * 11 + 4);
        ctx.lineWidth = 6; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 3.5; ctx.strokeStyle = P.danger; ctx.stroke();
      }
      ctx.restore();
    }
    hpBar(ctx, 0, -42, 64, 7, hp / maxHp, s.tired ? P.ok : P.hpBar, true);
    ctx.restore();
  }

  function trapRing(ctx, r, closed) {
    if (closed) {
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.38, 0, 0, Math.PI * 2);
      ctx.fillStyle = P.trapBase; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = P.trap; ctx.stroke();
      ctx.beginPath();
      for (var i = 0; i <= 8; i++) {
        var x = -r * 0.8 + i * r * 0.2, y = (i % 2 ? -4 : 4);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.lineWidth = 2.5; ctx.stroke();
      return;
    }
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = P.trapBase; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = P.trap; ctx.stroke();
    ctx.fillStyle = P.trap;
    for (var k = 0; k < 10; k++) {
      var ang = k * Math.PI / 5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang - 0.17) * (r - 2), Math.sin(ang - 0.17) * (r - 2));
      ctx.lineTo(Math.cos(ang) * (r * 0.55), Math.sin(ang) * (r * 0.55));
      ctx.lineTo(Math.cos(ang + 0.17) * (r - 2), Math.sin(ang + 0.17) * (r - 2));
      ctx.closePath(); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#8b8f9c'; ctx.fill();
  }

  function drawTrap(ctx, s) {
    var t = Math.max(0, num(s.t, 0));
    var k = Math.min(1, t / 0.5);
    ctx.save();
    ctx.translate(s.x, s.y);
    if (s.mode === 'caught') {
      ctx.globalAlpha = 1 - k * 0.5;
      trapRing(ctx, 26, true);
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(0, 0, 26 + 16 * k, 0, Math.PI * 2);
      ctx.lineWidth = 4; ctx.strokeStyle = P.ok; ctx.globalAlpha = 1 - k; ctx.stroke();
      check(ctx, 0, -6, 18, 1 - k * 0.4);
    } else if (s.mode === 'broken') {
      ctx.globalAlpha = 1 - k * 0.6;
      for (var side = -1; side <= 1; side += 2) {
        ctx.save();
        ctx.translate(side * k * 14, k * 6);
        ctx.rotate(side * k * 0.6);
        ctx.beginPath();
        ctx.arc(0, 0, 24, side < 0 ? Math.PI / 2 : -Math.PI / 2, side < 0 ? Math.PI * 1.5 : Math.PI / 2);
        ctx.lineWidth = 5; ctx.strokeStyle = '#8b8f9c'; ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      cross(ctx, 0, 0, 14, 1 - k * 0.4);
    } else {
      trapRing(ctx, 24, false);
    }
    ctx.restore();
  }

  function entranceArch(ctx, cx, cy, sc) {
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(sc, sc);
    ctx.fillStyle = '#6a5e78';
    ctx.fillRect(-64, -40, 16, 64); ctx.fillRect(48, -40, 16, 64);
    ctx.beginPath(); ctx.moveTo(-70, -40); ctx.quadraticCurveTo(0, -78, 70, -40); ctx.lineTo(70, -30);
    ctx.quadraticCurveTo(0, -66, -70, -30); ctx.closePath(); ctx.fill();
    txt(ctx, '入口', 0, -12, 24, P.text);
    ctx.restore();
  }

  function drawZooMap(ctx) {
    ctx.save();
    ctx.fillStyle = P.grass; ctx.fillRect(0, 140, W, H - 140);
    ctx.fillStyle = P.grassDot;
    for (var i = 0; i < 90; i++) {
      var gx = (i * 157) % 700 + 10, gy = 150 + (i * 263) % 1120;
      ctx.fillRect(gx, gy, 4, 4);
    }
    // 出口小徑(展區之間往上)
    ctx.fillStyle = P.path;
    var gaps = [[2, 23], [237, 253], [467, 483], [697, 718]];
    for (var g = 0; g < gaps.length; g++) ctx.fillRect(gaps[g][0], 150, gaps[g][1] - gaps[g][0], 570);
    // 入口步道
    ctx.fillRect(320, 1000, 80, 160);
    // 閘門前後的步道
    var cx = [130, 360, 590];
    for (var z = 0; z < 3; z++) ctx.fillRect(cx[z] - 50, 720, 100, 80);
    // 觀賞區
    for (var z2 = 0; z2 < 3; z2++) {
      rr(ctx, cx[z2] - 104, 530, 208, 190, 10);
      ctx.fillStyle = P.view; ctx.fill();
      ctx.strokeStyle = P.viewLine; ctx.lineWidth = 2;
      ctx.beginPath();
      for (var yy = 568; yy < 720; yy += 38) { ctx.moveTo(cx[z2] - 100, yy); ctx.lineTo(cx[z2] + 100, yy); }
      ctx.stroke();
    }
    // 廣場
    rr(ctx, 30, 800, 660, 200, 16); ctx.fillStyle = P.plaza; ctx.fill();
    ctx.strokeStyle = P.plazaLine; ctx.lineWidth = 2;
    ctx.beginPath();
    for (var px = 80; px < 690; px += 50) { ctx.moveTo(px, 804); ctx.lineTo(px, 996); }
    for (var py = 850; py < 1000; py += 50) { ctx.moveTo(34, py); ctx.lineTo(686, py); }
    ctx.stroke();
    // 出口標記
    for (var e = 0; e < gaps.length; e++) {
      var ex = (gaps[e][0] + gaps[e][1]) / 2;
      ctx.globalAlpha = 0.6;
      arrow(ctx, ex, 176, ex, 158, P.textDim, 3, false);
      ctx.globalAlpha = 1;
    }
    entranceArch(ctx, 360, 1180, 1);
    ctx.restore();
  }

  function drawEnclosure(ctx, s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    rr(ctx, -104, -159, 208, 318, 10); ctx.fillStyle = P.dirt; ctx.fill();
    ctx.fillStyle = P.dirtDot;
    for (var i = 0; i < 22; i++) ctx.fillRect(-92 + (i * 53) % 180, -120 + (i * 97) % 250, 5, 3);
    // 後牆岩石
    ctx.fillStyle = P.rock;
    rr(ctx, -104, -159, 208, 26, 10); ctx.fill();
    for (var r = 0; r < 5; r++) { ctx.beginPath(); ctx.arc(-80 + r * 40, -134, 12, Math.PI, 0); ctx.fill(); }
    // 圍欄: 左右側柱 + 下緣柵欄
    ctx.lineCap = 'round';
    function post(px, py, h, tilt, col) {
      ctx.save(); ctx.translate(px, py); ctx.rotate(tilt || 0);
      ctx.fillStyle = col; ctx.fillRect(-4, -h, 8, h);
      ctx.strokeStyle = P.fenceDark; ctx.lineWidth = 1.5; ctx.strokeRect(-4, -h, 8, h);
      ctx.restore();
    }
    ctx.strokeStyle = P.fence; ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-98, -120); ctx.lineTo(-98, 150);
    ctx.moveTo(98, -120); ctx.lineTo(98, 150);
    if (s.broken) {
      ctx.moveTo(-98, 130); ctx.lineTo(-44, 130); ctx.moveTo(44, 130); ctx.lineTo(98, 130);
      ctx.moveTo(-98, 146); ctx.lineTo(-50, 146); ctx.moveTo(50, 146); ctx.lineTo(98, 146);
    } else {
      ctx.moveTo(-98, 130); ctx.lineTo(98, 130);
      ctx.moveTo(-98, 146); ctx.lineTo(98, 146);
    }
    ctx.stroke();
    for (var p = 0; p < 9; p++) {
      var px2 = -98 + p * 24.5;
      if (s.broken && Math.abs(px2) < 48) {
        if (Math.abs(px2) > 20) post(px2, 156, 12, px2 < 0 ? -0.5 : 0.5, P.danger);
        continue;
      }
      post(px2, 156, 34, 0, P.fence);
    }
    if (s.broken) {
      // 破口: 紅色鋸齒外框 = 危險
      ctx.beginPath();
      var n = 18;
      for (var j = 0; j <= n; j++) {
        var x = -100 + j * (200 / n), y = j % 2 ? -150 : -156;
        if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      for (var j2 = 0; j2 <= n; j2++) {
        var x2 = 100 - j2 * (200 / n), y2 = j2 % 2 ? 150 : 156;
        ctx.lineTo(x2, y2);
      }
      ctx.closePath();
      ctx.lineWidth = 4; ctx.strokeStyle = P.danger; ctx.stroke();
    }
    if (s.selected) {
      ctx.lineWidth = 6; ctx.strokeStyle = P.select;
      rr(ctx, -101, -156, 202, 312, 10); ctx.stroke();
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      rr(ctx, -93, -148, 186, 296, 8); ctx.stroke();
    }
    ctx.restore();
  }

  function drawZooMonster(ctx, s) {
    var rage = clamp(num(s.rage, 0), 0, 100);
    var loose = !!s.loose, perf = !!s.performing;
    var lying = !loose && !perf && rage < 40;
    ctx.save();
    ctx.translate(s.x, s.y);
    if (loose) {
      ctx.save();
      ctx.translate(Math.floor(Date.now() / 50) % 2 ? 2 : -2, 0);
      ctx.beginPath();
      for (var i = 0; i < 28; i++) {
        var a = i * Math.PI / 14, rad = i % 2 ? 31 : 40;
        var px = Math.cos(a) * rad, py = -6 + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,59,74,0.28)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = P.danger; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    if (lying) { ctx.translate(0, 8); ctx.scale(0.9, 0.6); }
    else { ctx.translate(loose ? (Math.floor(Date.now() / 50) % 2 ? 2 : -2) : 0, perf ? -14 : -6); ctx.scale(0.8, 0.8); }
    var mode = lying ? 'sleep' : ((loose || rage >= 80) ? 'angry' : 'normal');
    monsterBody(ctx, s.species, speciesCols(s.species, false), mode);
    ctx.restore();
    if (lying) txt(ctx, 'z', 28, -14, 18, P.textDim, { ow: 3 });
    if (perf) {
      coin(ctx, -38, -32, 6); coin(ctx, 38, -32, 6);
      coin(ctx, -36, 4, 5); coin(ctx, 36, 4, 5);
    }
    // 怒氣條: 白刻度 = 表演門檻 40
    var col = (loose || rage >= 100) ? P.danger : rage >= 80 ? P.hot : rage >= 40 ? P.gold : P.calm;
    ctx.fillStyle = '#120f18'; rr(ctx, -42, 33, 84, 12, 3); ctx.fill();
    var fw = rage / 100 * 80;
    if (fw > 0) { ctx.fillStyle = col; rr(ctx, -40, 35, Math.max(2, fw), 8, 2); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(-8, 31); ctx.lineTo(-8, 47);
    ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.restore();
  }

  var KEY_OF_ZONE = ['left', 'down', 'right'];

  function drawGate(ctx, s) {
    var key = KEY_OF_ZONE[clamp(num(s.zone, 0) | 0, 0, 2)];
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.fillStyle = '#5a5368';
    ctx.fillRect(-60, -20, 9, 40); ctx.fillRect(51, -20, 9, 40);
    if (s.open) {
      ctx.fillStyle = P.ok;
      ctx.beginPath(); ctx.moveTo(-51, -18); ctx.lineTo(-38, -12); ctx.lineTo(-38, 14); ctx.lineTo(-51, 18); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(51, -18); ctx.lineTo(38, -12); ctx.lineTo(38, 14); ctx.lineTo(51, 18); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = P.outline;
      ctx.beginPath(); ctx.moveTo(-51, -18); ctx.lineTo(-38, -12); ctx.lineTo(-38, 14); ctx.lineTo(-51, 18); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(51, -18); ctx.lineTo(38, -12); ctx.lineTo(38, 14); ctx.lineTo(51, 18); ctx.closePath(); ctx.stroke();
      keycap(ctx, 0, 0, 30, 34, key, P.ok);
    } else {
      ctx.save();
      rr(ctx, -51, -11, 102, 22, 4); ctx.clip();
      ctx.fillStyle = '#e4e0ea'; ctx.fillRect(-51, -11, 102, 22);
      ctx.fillStyle = '#4a4358';
      for (var i = -64; i < 46; i += 18) {
        ctx.beginPath(); ctx.moveTo(i, 11); ctx.lineTo(i + 9, 11); ctx.lineTo(i + 20, -11); ctx.lineTo(i + 11, -11); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      ctx.lineWidth = 2; ctx.strokeStyle = P.outline; rr(ctx, -51, -11, 102, 22, 4); ctx.stroke();
      keycap(ctx, 0, 0, 30, 34, key, '#8a8494');
    }
    ctx.restore();
  }

  function drawVisitor(ctx, s) {
    var v = clamp(num(s.variant, 0) | 0, 0, 3);
    var mode = s.mode || 'walk';
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var shirt = SHIRTS[v];
    if (mode === 'wait') ctx.globalAlpha = 0.9;
    // 腿
    ctx.fillStyle = P.visitorPants;
    if (mode === 'walk' || mode === 'scared') {
      ctx.save(); ctx.translate(-4, 12); ctx.rotate(0.3); ctx.fillRect(-3, 0, 6, 14); ctx.restore();
      ctx.save(); ctx.translate(4, 12); ctx.rotate(-0.3); ctx.fillRect(-3, 0, 6, 14); ctx.restore();
    } else {
      ctx.fillRect(-7, 12, 6, 14); ctx.fillRect(1, 12, 6, 14);
    }
    // 手
    ctx.strokeStyle = shirt; ctx.lineWidth = 5;
    ctx.beginPath();
    if (mode === 'scared') { ctx.moveTo(-8, -4); ctx.lineTo(-15, -20); ctx.moveTo(8, -4); ctx.lineTo(15, -20); }
    else if (mode === 'watch') { ctx.moveTo(-9, -3); ctx.lineTo(-13, 10); ctx.moveTo(9, -3); ctx.lineTo(13, 10); }
    else if (mode === 'walk') { ctx.moveTo(-9, -3); ctx.lineTo(-14, 9); ctx.moveTo(9, -3); ctx.lineTo(13, 8); }
    ctx.stroke();
    // 身
    rr(ctx, -9, -8, 18, 22, 6); ctx.fillStyle = shirt; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = P.outline; ctx.stroke();
    if (mode === 'wait') {
      ctx.beginPath(); ctx.moveTo(-9, 2); ctx.lineTo(9, 2);
      ctx.lineWidth = 5; ctx.strokeStyle = shirt; ctx.stroke();
      ctx.lineWidth = 1.2; ctx.strokeStyle = P.outline; ctx.stroke();
    }
    // 頭
    ctx.beginPath(); ctx.arc(0, -15, 8, 0, Math.PI * 2);
    ctx.fillStyle = mode === 'watch' ? HAIR[v] : P.skin; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = P.outline; ctx.stroke();
    if (mode !== 'watch') {
      ctx.beginPath(); ctx.arc(0, -17, 7.5, Math.PI * 1.05, Math.PI * 1.95);
      ctx.lineWidth = 3; ctx.strokeStyle = HAIR[v]; ctx.stroke();
      ctx.fillStyle = P.outline;
      ctx.fillRect(-4, -16, 2, 2); ctx.fillRect(2, -16, 2, 2);
      if (mode === 'scared') {
        ctx.beginPath(); ctx.arc(0, -11, 2, 0, Math.PI * 2); ctx.fill();
        txt(ctx, '!', 11, -6, 15, P.danger, { ow: 3 });
      }
    }
    if (mode === 'wait') {
      ctx.fillStyle = P.textDim;
      for (var d = -1; d <= 1; d++) { ctx.beginPath(); ctx.arc(d * 5, -25.6, 1.2, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
  }

  function drawTrayMonster(ctx, s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    rr(ctx, -43, -43, 86, 86, 10);
    ctx.fillStyle = s.first ? '#3c3550' : '#2a2534'; ctx.fill();
    ctx.lineWidth = s.first ? 4 : 2; ctx.strokeStyle = s.first ? P.select : P.panelLine; ctx.stroke();
    ctx.save();
    ctx.translate(0, 6); ctx.scale(0.74, 0.74);
    monsterBody(ctx, s.species, speciesCols(s.species, false), 'normal');
    ctx.restore();
    if (s.first) {
      ctx.beginPath(); ctx.arc(29, -29, 11, 0, Math.PI * 2);
      ctx.fillStyle = P.ok; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
      arrow(ctx, 29, -22, 29, -36, '#ffffff', 3, false);
    }
    ctx.restore();
  }

  var SHOP = {
    armor: { name: '鐵甲', desc: '血量上限 +4' },
    claw: { name: '利爪', desc: '攻擊 +1' },
    trapBag: { name: '夾袋', desc: '捕獸夾 +1' },
    promo: { name: '宣傳', desc: '遊客來得更快' }
  };

  function shopIcon(ctx, item, cx, cy, k) {
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(k, k);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (item === 'armor') {
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(26, -20); ctx.quadraticCurveTo(24, 16, 0, 32);
      ctx.quadraticCurveTo(-24, 16, -26, -20); ctx.closePath();
      ctx.fillStyle = '#b8c0d0'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#4a5468'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 14); ctx.moveTo(-12, 1); ctx.lineTo(12, 1);
      ctx.lineWidth = 6; ctx.strokeStyle = P.playerAccent; ctx.stroke();
    } else if (item === 'claw') {
      for (var i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(i * 14 - 6, -28); ctx.quadraticCurveTo(i * 14 + 12, -4, i * 14 - 2, 28);
        ctx.lineWidth = 9; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      }
    } else if (item === 'trapBag') {
      ctx.beginPath(); ctx.moveTo(-26, -6); ctx.lineTo(26, -6); ctx.lineTo(22, 30); ctx.lineTo(-22, 30); ctx.closePath();
      ctx.fillStyle = '#8a6a48'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.fenceDark; ctx.stroke();
      ctx.save(); ctx.translate(0, -16); trapRing(ctx, 15, false); ctx.restore();
    } else {
      ctx.beginPath(); ctx.moveTo(-24, -10); ctx.lineTo(6, -24); ctx.lineTo(6, 24); ctx.lineTo(-24, 10); ctx.closePath();
      ctx.fillStyle = P.rep; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#7a2a60'; ctx.stroke();
      ctx.fillStyle = '#7a2a60'; ctx.fillRect(-30, -10, 8, 20);
      ctx.beginPath();
      ctx.arc(8, 0, 16, -0.7, 0.7); ctx.moveTo(8 + Math.cos(-0.7) * 26, Math.sin(-0.7) * 26);
      ctx.arc(8, 0, 26, -0.7, 0.7);
      ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    }
    ctx.restore();
  }

  function drawShopItem(ctx, s) {
    var info = SHOP[s.item] || { name: String(s.item), desc: '' };
    var can = !!s.affordable;
    ctx.save();
    ctx.translate(s.x, s.y);
    rr(ctx, -298, -68, 596, 136, 16);
    ctx.fillStyle = s.selected ? '#352e45' : P.panel; ctx.fill();
    ctx.lineWidth = s.selected ? 5 : 2; ctx.strokeStyle = s.selected ? P.select : P.panelLine; ctx.stroke();
    if (s.selected) {
      ctx.beginPath(); ctx.moveTo(-286, -16); ctx.lineTo(-268, 0); ctx.lineTo(-286, 16); ctx.closePath();
      ctx.fillStyle = P.select; ctx.fill();
    }
    ctx.globalAlpha = can ? 1 : 0.5;
    rr(ctx, -258, -52, 104, 104, 12); ctx.fillStyle = '#16121e'; ctx.fill();
    shopIcon(ctx, s.item, -206, 0, 1.2);
    txt(ctx, info.name, -132, -22, 34, P.text, { align: 'left', outline: false });
    txt(ctx, 'Lv.' + num(s.level, 0), -132 + 80, -20, 22, P.textDim, { align: 'left', outline: false });
    txt(ctx, info.desc, -132, 22, 24, P.textDim, { align: 'left', bold: false, outline: false });
    ctx.globalAlpha = 1;
    coin(ctx, 150, can ? 0 : -14, 14);
    txt(ctx, String(num(s.cost, 0)), 172, can ? 0 : -14, 32, can ? P.gold : P.textDim, { align: 'left', outline: false });
    if (!can) txt(ctx, '金幣不足', 210, 24, 20, P.textDim, { outline: false });
    ctx.restore();
  }

  function drawFloatText(ctx, s) {
    var t = Math.max(0, num(s.t, 0));
    var kind = s.kind || 'gold';
    var dy = kind === 'repDown' ? 28 * Math.min(t, 1) : -44 * Math.min(t, 1);
    var alpha = 1 - clamp((t - 0.6) / 0.6, 0, 1);
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(s.x, s.y + dy);
    var str = String(s.text == null ? '' : s.text);
    var px = 28;
    ctx.font = font(px);
    var w = ctx.measureText(str).width;
    var iconX = -w / 2 - 14;
    if (kind === 'gold') coin(ctx, iconX, 0, 11);
    else star(ctx, iconX, 0, 13, kind === 'repDown' ? P.danger : P.rep, P.outline, 2);
    var col = kind === 'gold' ? P.gold : kind === 'repDown' ? P.danger : P.rep;
    txt(ctx, str, 6, 0, px, col, { ow: 6 });
    ctx.restore();
  }

  function drawResultPanel(ctx, s) {
    var stars = clamp(num(s.stars, 0) | 0, 0, 3);
    ctx.save();
    ctx.fillStyle = 'rgba(10,8,16,0.88)'; ctx.fillRect(0, 0, W, H);
    rr(ctx, 60, 200, 600, 820, 24); ctx.fillStyle = P.panel; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = P.panelLine; ctx.stroke();
    txt(ctx, '三天營業結算', 360, 290, 42, P.text);
    var th = [60, 150, 250];
    for (var i = 0; i < 3; i++) {
      var cx = 190 + i * 170;
      star(ctx, cx, 440, 62, i < stars ? P.rep : '#2e2838', i < stars ? '#ffffff' : '#5a5368', 4);
      txt(ctx, '名聲 ' + th[i], cx, 535, 22, i < stars ? P.text : P.textDim, { outline: false });
    }
    star(ctx, 210, 650, 24, P.rep, P.outline, 2);
    txt(ctx, '總名聲', 250, 650, 30, P.textDim, { align: 'left', outline: false });
    txt(ctx, String(num(s.rep, 0)), 560, 650, 48, P.rep, { align: 'right' });
    coin(ctx, 210, 750, 20);
    txt(ctx, '累計金幣', 250, 750, 30, P.textDim, { align: 'left', outline: false });
    txt(ctx, String(num(s.goldEarned, 0)), 560, 750, 48, P.gold, { align: 'right' });
    keycap(ctx, 280, 920, 110, 54, 'Enter');
    txt(ctx, '重來', 380, 916, 32, P.text, { align: 'left', outline: false });
    ctx.restore();
  }

  function pill(ctx, x, y, w, h, fill, stroke) {
    rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = stroke; ctx.stroke();
  }

  function drawHud(ctx, s) {
    var ph = s.phase;
    if (ph === 'guide' || ph === 'result') return;
    ctx.save();
    ctx.fillStyle = P.hudBg; ctx.fillRect(0, 0, W, 140);
    ctx.fillStyle = P.hudLine; ctx.fillRect(0, 138, W, 2);
    txt(ctx, '第 ' + num(s.day, 1) + ' 天', 24, 42, 32, P.text, { align: 'left', outline: false });
    var sub = ph === 'dungeon' ? ('地下城 · 第 ' + num(s.floor, 1) + ' 層') : ph === 'place' ? '擺放魔物' : ph === 'open' ? '開園中' : ph === 'shop' ? '商店' : '';
    txt(ctx, sub, 150, 44, 24, P.textDim, { align: 'left', outline: false });
    coin(ctx, 466, 42, 14);
    txt(ctx, String(num(s.gold, 0)), 488, 42, 30, P.gold, { align: 'left', outline: false });
    star(ctx, 600, 42, 16, P.rep, P.outline, 2);
    txt(ctx, String(num(s.rep, 0)), 622, 42, 30, P.rep, { align: 'left', outline: false });
    var msg = s.message ? String(s.message) : '';
    if (ph === 'dungeon') {
      var hp = num(s.hp, 0), mx = Math.max(1, num(s.maxHp, 1)), ratio = hp / mx;
      txt(ctx, '血', 24, 100, 26, P.textDim, { align: 'left', outline: false });
      ctx.fillStyle = '#2a2434'; rr(ctx, 60, 88, 260, 24, 6); ctx.fill();
      if (ratio > 0) { ctx.fillStyle = ratio <= 0.3 ? P.danger : P.playerHp; rr(ctx, 60, 88, Math.max(6, 260 * clamp(ratio, 0, 1)), 24, 6); ctx.fill(); }
      txt(ctx, hp + '/' + mx, 334, 100, 26, ratio <= 0.3 ? P.danger : P.text, { align: 'left', outline: false });
      txt(ctx, '夾', 440, 100, 26, P.textDim, { align: 'left', outline: false });
      var tm = Math.max(0, num(s.trapMax, 0) | 0), tr = num(s.traps, 0);
      var step = tm > 0 ? Math.min(32, 220 / tm) : 32;
      for (var i = 0; i < tm; i++) {
        ctx.save(); ctx.translate(486 + i * step, 100);
        if (i < tr) { trapRing(ctx, 12, false); }
        else { ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.lineWidth = 2.5; ctx.strokeStyle = '#4a4358'; ctx.stroke(); }
        ctx.restore();
      }
      if (msg) {
        pill(ctx, 60, 1060, 600, 60, P.panel, P.panelLine);
        txt(ctx, msg, 360, 1090, 28, P.text, { outline: false });
      }
      // 操作提示
      keycap(ctx, 150, 1180, 40, 42, 'up');
      keycap(ctx, 106, 1214, 40, 42, 'left'); keycap(ctx, 150, 1214, 40, 42, 'down'); keycap(ctx, 194, 1214, 40, 42, 'right');
      txt(ctx, '移動 / 撞魔物攻擊', 226, 1200, 24, P.textDim, { align: 'left', outline: false });
      keycap(ctx, 500, 1200, 72, 42, '空白');
      txt(ctx, '放夾子', 546, 1200, 24, P.textDim, { align: 'left', outline: false });
    } else if (ph === 'open') {
      var tl = Math.max(0, Math.ceil(num(s.timeLeft, 0)));
      txt(ctx, String(tl), 24, 100, 44, tl <= 10 ? P.danger : P.text, { align: 'left', outline: false });
      txt(ctx, '秒', 24 + String(tl).length * 26 + 6, 104, 24, P.textDim, { align: 'left', outline: false });
      if (msg) {
        pill(ctx, 160, 78, 536, 46, 'rgba(255,59,74,0.2)', P.danger);
        txt(ctx, msg, 428, 101, 26, '#ffd6da', { outline: false });
      }
      var pc = num(s.plazaCount, 0), pm = num(s.plazaMax, 12);
      var near = pc >= pm - 2;
      txt(ctx, '廣場 ' + pc + '/' + pm, 40, 1020, 24, near ? P.danger : P.textDim, { align: 'left' });
    } else {
      if (msg) {
        pill(ctx, 24, 78, 672, 46, P.panel, P.panelLine);
        txt(ctx, msg, 360, 101, 26, P.text, { outline: false });
      }
      if (ph === 'place') txt(ctx, '候展區', 24, 1024, 22, P.textDim, { align: 'left' });
    }
    ctx.restore();
  }

  // ---------- 說明頁示意圖 ----------
  var GV = { w: 640, h: 560 };

  function label(ctx, s, x, y, px, color) { txt(ctx, s, x, y, px || 24, color || P.text, { ow: 5 }); }

  function guide0(ctx) {
    var x0 = 80, y0 = 40;
    floorTiles(ctx, x0, y0, 5, 5, 1, 1);
    function c(col, row) { return { x: x0 + col * 96 + 48, y: y0 + row * 96 + 48 }; }
    var st = c(2, 0); drawStairs(ctx, st);
    drawWall(ctx, c(0, 2)); drawWall(ctx, c(4, 1));
    var pl = c(2, 3), mo = c(2, 2);
    drawMonster(ctx, { x: mo.x, y: mo.y, species: 'fire', hp: 4, maxHp: 6, tired: false, stunned: false, hit: true, attackDir: null });
    drawPlayer(ctx, { x: pl.x, y: pl.y, hp: 12, maxHp: 12, hit: false, attackDir: 'up' });
    // 四方向箭頭
    arrow(ctx, pl.x - 52, pl.y, pl.x - 84, pl.y, '#ffffff', 5, false);
    arrow(ctx, pl.x + 52, pl.y, pl.x + 84, pl.y, '#ffffff', 5, false);
    arrow(ctx, pl.x, pl.y + 52, pl.x, pl.y + 84, '#ffffff', 5, false);
    label(ctx, '你', pl.x, pl.y + 112 - 4, 26);
    label(ctx, '撞 = 攻擊', mo.x + 100, mo.y + 4, 24, '#ffffff');
    // 角落魔物也走一步
    var m2 = c(4, 3), m2b = c(3, 3);
    drawMonster(ctx, { x: m2.x, y: m2.y, species: 'water', hp: 4, maxHp: 4, tired: false, stunned: false, hit: false, attackDir: null });
    ctx.globalAlpha = 0.35;
    drawMonster(ctx, { x: m2b.x, y: m2b.y, species: 'water', hp: 4, maxHp: 4, tired: false, stunned: false, hit: false, attackDir: null });
    ctx.globalAlpha = 1;
    arrow(ctx, m2.x - 30, m2.y + 38, m2b.x + 30, m2b.y + 38, P.textDim, 4, true);
    label(ctx, '牠也走一步', m2.x - 40, m2.y + 70, 22, P.textDim);
    label(ctx, '樓梯', st.x + 92, st.y, 24, P.ok);
  }

  function guide1(ctx) {
    var S = 1.25;
    var panels = [
      { cx: 170, tired: true, hp: 2, mode: 'caught', tag: '夾住' },
      { cx: 470, tired: false, hp: 6, mode: 'broken', tag: '夾壞' }
    ];
    for (var i = 0; i < 2; i++) {
      var p = panels[i];
      ctx.save();
      ctx.translate(p.cx, 0); ctx.scale(S, S);
      floorTiles(ctx, -48, 30, 1, 3, 1, 1);
      var my = 78, ty = 270;
      if (p.mode === 'caught') {
        drawMonster(ctx, { x: 0, y: my, species: 'fire', hp: p.hp, maxHp: 6, tired: true, stunned: false, hit: false, attackDir: null });
        drawTrap(ctx, { x: 0, y: ty, mode: 'caught', t: 0.1 });
      } else {
        drawMonster(ctx, { x: 0, y: my, species: 'fire', hp: p.hp, maxHp: 6, tired: false, stunned: false, hit: false, attackDir: null });
        drawTrap(ctx, { x: 0, y: ty, mode: 'broken', t: 0.2 });
        drawMonster(ctx, { x: 0, y: ty, species: 'fire', hp: p.hp, maxHp: 6, tired: false, stunned: true, hit: false, attackDir: null });
      }
      arrow(ctx, 0, my + 52, 0, ty - 50, '#ffffff', 4, true);
      ctx.restore();
      label(ctx, p.tired ? '疲憊(血 ≤ 一半)' : '滿血', p.cx, 26, 24, p.tired ? P.ok : P.text);
      label(ctx, p.tag, p.cx, 470, 32, p.mode === 'caught' ? P.ok : P.danger);
    }
  }

  function guide2(ctx) {
    var xs = [130, 320, 510];
    for (var i = 0; i < 3; i++) {
      ctx.save(); ctx.translate(xs[i], 140); ctx.scale(0.5, 0.5);
      drawEnclosure(ctx, { x: 0, y: 0, zone: i, selected: i === 1, broken: false });
      if (i === 0) drawZooMonster(ctx, { x: 0, y: 0, species: 'stone', rage: 20, performing: false, loose: false });
      ctx.restore();
    }
    keycap(ctx, 236, 140, 40, 44, 'left');
    keycap(ctx, 404, 140, 40, 44, 'right');
    // 候展區
    rr(ctx, 120, 390, 460, 96, 14); ctx.fillStyle = '#1a1622'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = P.panelLine; ctx.stroke();
    drawTrayMonster(ctx, { x: 320, y: 438, species: 'thunder', first: true });
    drawTrayMonster(ctx, { x: 420, y: 438, species: 'water', first: false });
    drawTrayMonster(ctx, { x: 520, y: 438, species: 'fire', first: false });
    label(ctx, '候展區', 150 + 20, 438, 22, P.textDim);
    arrow(ctx, 340, 386, 340, 236, P.ok, 6, false);
    label(ctx, '↑ 放入', 400, 310, 26, P.ok);
    arrow(ctx, 296, 236, 296, 386, P.textDim, 4, true);
    label(ctx, '↓ 取回', 236, 310, 24, P.textDim);
    keycap(ctx, 300, 530, 96, 44, 'Enter');
    label(ctx, '開園', 384, 528, 26);
  }

  function guide3(ctx) {
    var xs = [120, 320, 520];
    ctx.fillStyle = P.grass; ctx.fillRect(0, 0, GV.w, GV.h);
    ctx.fillStyle = P.path;
    for (var i = 0; i < 3; i++) ctx.fillRect(xs[i] - 40, 140, 80, 120);
    ctx.fillRect(290, 420, 60, 80);
    for (var j = 0; j < 3; j++) { rr(ctx, xs[j] - 85, 30, 170, 110, 10); ctx.fillStyle = P.view; ctx.fill(); }
    rr(ctx, 30, 260, 580, 160, 16); ctx.fillStyle = P.plaza; ctx.fill();
    drawGate(ctx, { x: 120, y: 200, zone: 0, open: false });
    drawGate(ctx, { x: 320, y: 200, zone: 1, open: true });
    drawGate(ctx, { x: 520, y: 200, zone: 2, open: true });
    entranceArch(ctx, 320, 530, 0.85);
    arrow(ctx, 300, 330, 320, 232, P.ok, 5, true);
    arrow(ctx, 360, 330, 500, 232, P.ok, 5, true);
    var vs = [[200, 360, 0], [260, 300, 1], [420, 370, 2], [470, 310, 3], [320, 390, 1]];
    for (var k = 0; k < vs.length; k++) drawVisitor(ctx, { x: vs[k][0], y: vs[k][1], mode: 'walk', variant: vs[k][2] });
    drawVisitor(ctx, { x: 320, y: 120, mode: 'walk', variant: 2 });
    drawVisitor(ctx, { x: 290, y: 70, mode: 'watch', variant: 0 });
    drawVisitor(ctx, { x: 540, y: 110, mode: 'walk', variant: 3 });
    drawVisitor(ctx, { x: 500, y: 70, mode: 'watch', variant: 1 });
    label(ctx, '關', 120, 245, 24, P.textDim);
  }

  function guide4(ctx) {
    var xs = [110, 320, 530];
    var cfg = [
      { rage: 10, perf: false, loose: false, n: 0, tag: '沒人看' },
      { rage: 60, perf: true, loose: false, n: 2, tag: '幾個人看' },
      { rage: 100, perf: false, loose: true, n: 7, tag: '擠滿' }
    ];
    for (var i = 0; i < 3; i++) {
      var c = cfg[i];
      ctx.save(); ctx.translate(xs[i], 140); ctx.scale(0.6, 0.6);
      drawEnclosure(ctx, { x: 0, y: 0, zone: i, selected: false, broken: c.loose });
      ctx.restore();
      ctx.save(); ctx.translate(xs[i], 150); ctx.scale(0.9, 0.9);
      drawZooMonster(ctx, { x: 0, y: 0, species: 'fire', rage: c.rage, performing: c.perf, loose: c.loose });
      ctx.restore();
      rr(ctx, xs[i] - 92, 250, 184, 150, 10); ctx.fillStyle = P.view; ctx.fill();
      for (var v = 0; v < c.n; v++) {
        var vx = xs[i] - 64 + (v % 4) * 42, vy = 290 + Math.floor(v / 4) * 62;
        drawVisitor(ctx, { x: vx, y: vy, mode: 'watch', variant: v % 4 });
      }
      if (c.loose) {
        drawVisitor(ctx, { x: xs[i] - 40, y: 430, mode: 'scared', variant: 1 });
        drawVisitor(ctx, { x: xs[i] + 40, y: 430, mode: 'scared', variant: 2 });
        cross(ctx, xs[i] - 40, 430, 14, 1);
        cross(ctx, xs[i] + 40, 430, 14, 1);
      }
      label(ctx, c.tag, xs[i], 500, 28, c.loose ? P.danger : P.text);
    }
    drawFloatText(ctx, { x: 340, y: 64, text: '+6', kind: 'gold', t: 0.2 });
  }

  function guide5(ctx) {
    var nodes = [
      { x: 320, y: 80, t: '地下城' },
      { x: 530, y: 250, t: '擺放' },
      { x: 320, y: 420, t: '開園' },
      { x: 110, y: 250, t: '商店' }
    ];
    var links = [[0, 1], [1, 2], [2, 3], [3, 0]];
    for (var l = 0; l < links.length; l++) {
      var a = nodes[links[l][0]], b = nodes[links[l][1]];
      var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy);
      var ux = dx / len, uy = dy / len;
      arrow(ctx, a.x + ux * 110, a.y + uy * 62, b.x - ux * 110, b.y - uy * 62, P.textDim, 5, false);
    }
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      rr(ctx, n.x - 90, n.y - 50, 180, 100, 16); ctx.fillStyle = P.panel; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = P.panelLine; ctx.stroke();
      ctx.save(); ctx.translate(n.x - 46, n.y); ctx.scale(0.62, 0.62);
      if (i === 0) drawPlayer(ctx, { x: 0, y: 6, hp: 12, maxHp: 12, hit: false, attackDir: null });
      else if (i === 1) drawTrayMonster(ctx, { x: 0, y: 0, species: 'thunder', first: true });
      else if (i === 2) drawGate(ctx, { x: 0, y: 0, zone: 1, open: true });
      else shopIcon(ctx, 'claw', 0, 0, 1);
      ctx.restore();
      label(ctx, n.t, n.x + 30, n.y, 28);
    }
    label(ctx, '第 1~3 天', 320, 250, 30, P.text);
    // 第 3 天後 → 結算
    arrow(ctx, 412, 440, 520, 480, P.rep, 5, true);
    star(ctx, 560, 490, 34, P.rep, '#ffffff', 3);
    label(ctx, '結算', 560, 545, 24, P.rep);
  }

  var GUIDES = [guide0, guide1, guide2, guide3, guide4, guide5];

  function drawGuidePage(ctx, s) {
    var page = clamp(num(s.page, 0) | 0, 0, GUIDES.length - 1);
    var bx = num(s.x, 0), by = num(s.y, 0), bw = num(s.w, GV.w), bh = num(s.h, GV.h);
    var k = Math.min(bw / GV.w, bh / GV.h);
    ctx.save();
    ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
    ctx.translate(bx + (bw - GV.w * k) / 2, by + (bh - GV.h * k) / 2);
    ctx.scale(k, k);
    GUIDES[page](ctx);
    ctx.restore();
  }

  window.Art = {
    canvas: { width: W, height: H },
    palette: P,
    drawBackground: drawBackground,
    drawDungeonFloor: drawDungeonFloor,
    drawWall: drawWall,
    drawStairs: drawStairs,
    drawPlayer: drawPlayer,
    drawMonster: drawMonster,
    drawTrap: drawTrap,
    drawZooMap: drawZooMap,
    drawEnclosure: drawEnclosure,
    drawZooMonster: drawZooMonster,
    drawGate: drawGate,
    drawVisitor: drawVisitor,
    drawTrayMonster: drawTrayMonster,
    drawShopItem: drawShopItem,
    drawFloatText: drawFloatText,
    drawResultPanel: drawResultPanel,
    drawHud: drawHud,
    drawGuidePage: drawGuidePage
  };
})();
