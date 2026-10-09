// 大場面動物園: 連鎖大場面 — 美術(Canvas 2D 幾何繪製, 無外部資源)
// 契約: 見 style.md。所有座標為邏輯畫布 720×1280, x,y 為物件中心(drawButton 為左上角)。
(function () {
  'use strict';

  var W = 720, H = 1280;
  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC","Heiti TC",sans-serif';

  var palette = {
    bg: '#141826',
    hud: '#0c0f1c',
    panel: '#1f2538',
    panelHi: '#2b3350',
    line: '#4a5578',
    text: '#f3f1ea',
    textDim: '#9aa3c0',
    outline: '#0b0e1a',
    // 魔物四色(色相 30 / 282 / 216 / 126, 灰階 160 / 207 / 114 / 72)
    fire: '#ff8a1a',
    thunder: '#eab8ff',
    water: '#2f7cf0',
    stone: '#24602a',
    player: '#f2e2c0',
    hp: '#6fe08a',
    net: '#efe3c2',
    select: '#ffffff',
    chain: '#8ff0ff',
    calm: '#a8ffcf',
    gold: '#ffe14a',
    rep: '#ff86d6',
    rageLow: '#7d8bb0',
    rageHot: '#ff6a3a',
    danger: '#ff2d4a',
    success: '#5ef08a',
    cageInner: '#262d46',
    zooGrass: '#24302c',
    tray: '#3b2d22'
  };

  var SP = {
    fire: { body: '#ff8a1a', dark: '#b4520a', light: '#ffd08a', name: '火蜥蜴' },
    thunder: { body: '#eab8ff', dark: '#8a4fd0', light: '#fbefff', name: '雷鳥' },
    water: { body: '#2f7cf0', dark: '#163f8c', light: '#9cc4ff', name: '水母' },
    stone: { body: '#24602a', dark: '#123816', light: '#8fcf8f', name: '石像鬼' }
  };
  var ORDER = ['fire', 'thunder', 'water', 'stone'];

  // ---------- 小工具 ----------
  function f(px, bold) { return (bold === false ? '' : 'bold ') + px + 'px ' + FONT; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function num(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; }
  function rnd(i) { var s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function now() { return Date.now() / 1000; }
  function hex2rgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(a, b, t) {
    var A = hex2rgb(a), B = hex2rgb(b);
    return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')';
  }
  function rgba(h, a) { var A = hex2rgb(h); return 'rgba(' + A[0] + ',' + A[1] + ',' + A[2] + ',' + a + ')'; }
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function ell(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }
  function circ(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
  function poly(ctx, pts, sx) {
    sx = sx || 1;
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * sx, pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * sx, pts[i][1]);
    ctx.closePath();
  }
  function txt(ctx, s, x, y, px, color, opt) {
    opt = opt || {};
    ctx.font = f(px, opt.bold);
    ctx.textAlign = opt.align || 'center';
    ctx.textBaseline = opt.base || 'middle';
    if (opt.stroke !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = opt.lw || Math.max(3, px * 0.2);
      ctx.strokeStyle = opt.stroke || palette.outline;
      ctx.strokeText(String(s), x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(String(s), x, y);
  }
  function starPath(ctx, cx, cy, r1, r2, n) {
    n = n || 5;
    ctx.beginPath();
    for (var i = 0; i < n * 2; i++) {
      var r = i % 2 ? r2 : r1;
      var a = -Math.PI / 2 + i * Math.PI / n;
      var px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  function flamePath(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.quadraticCurveTo(x + w * 1.3, y - h * 0.2, x, y + w * 0.4);
    ctx.quadraticCurveTo(x - w * 1.3, y - h * 0.2, x, y - h);
    ctx.closePath();
  }

  // ---------- 共用圖示 ----------
  function coin(ctx, x, y, r) {
    ctx.save();
    circ(ctx, x, y, r); ctx.fillStyle = palette.gold; ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.18); ctx.strokeStyle = '#8a6a10'; ctx.stroke();
    circ(ctx, x, y, r * 0.55); ctx.lineWidth = Math.max(1.5, r * 0.12); ctx.strokeStyle = '#c9a020'; ctx.stroke();
    ctx.restore();
  }
  function repStar(ctx, x, y, r, color) {
    ctx.save();
    starPath(ctx, x, y, r, r * 0.45, 5);
    ctx.fillStyle = color || palette.rep; ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.16); ctx.strokeStyle = palette.outline; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
  }
  function angerMark(ctx, x, y, r, color) {
    // 怒氣符號: 四段折角的「十字青筋」
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round';
    for (var pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass ? (color || palette.rageHot) : palette.outline;
      ctx.lineWidth = pass ? r * 0.28 : r * 0.28 + 4;
      for (var i = 0; i < 4; i++) {
        ctx.save(); ctx.rotate(i * Math.PI / 2);
        ctx.beginPath(); ctx.moveTo(r * 0.25, -r); ctx.lineTo(r * 0.25, -r * 0.25); ctx.lineTo(r, -r * 0.25); ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }
  function checkBadge(ctx, x, y, r) {
    ctx.save();
    circ(ctx, x, y, r); ctx.fillStyle = palette.success; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = palette.outline; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - r * 0.45, y); ctx.lineTo(x - r * 0.1, y + r * 0.38); ctx.lineTo(x + r * 0.5, y - r * 0.35);
    ctx.lineWidth = r * 0.22; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = palette.outline; ctx.stroke();
    ctx.restore();
  }
  function crossBadge(ctx, x, y, r) {
    ctx.save();
    circ(ctx, x, y, r); ctx.fillStyle = palette.danger; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = palette.outline; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - r * 0.4, y - r * 0.4); ctx.lineTo(x + r * 0.4, y + r * 0.4);
    ctx.moveTo(x + r * 0.4, y - r * 0.4); ctx.lineTo(x - r * 0.4, y + r * 0.4);
    ctx.lineWidth = r * 0.22; ctx.lineCap = 'round'; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.restore();
  }
  function impact(ctx, x, y, r) {
    // 受擊 = 白色八角爆星(玩家與魔物共用)
    ctx.save();
    starPath(ctx, x, y, r, r * 0.42, 8);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = palette.outline; ctx.stroke();
    ctx.restore();
  }
  function hpBar(ctx, x, y, w, h, v, max) {
    var r = max > 0 ? clamp(v / max, 0, 1) : 0;
    ctx.save();
    rr(ctx, x - 2, y - 2, w + 4, h + 4, (h + 4) / 2); ctx.fillStyle = palette.outline; ctx.fill();
    rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = '#2a2f40'; ctx.fill();
    if (r > 0) { rr(ctx, x, y, Math.max(h, w * r), h, h / 2); ctx.fillStyle = palette.hp; ctx.fill(); }
    ctx.restore();
  }
  function netIcon(ctx, x, y, r, on) {
    ctx.save();
    var c = on ? palette.net : '#4a4f62';
    circ(ctx, x, y, r); ctx.fillStyle = on ? rgba(palette.net, 0.18) : 'rgba(0,0,0,0.2)'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = c; ctx.stroke();
    ctx.beginPath();
    for (var i = 0; i < 4; i++) {
      var a = i * Math.PI / 4;
      ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      ctx.lineTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
    }
    ctx.stroke();
    circ(ctx, x, y, r * 0.5); ctx.stroke();
    ctx.restore();
  }
  function hand(ctx, x, y, sc) {
    // 點擊手勢: 指尖在 (x, y)
    sc = sc || 1;
    ctx.save();
    ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.8;
    circ(ctx, x, y, 14 * sc); ctx.stroke();
    ctx.globalAlpha = 0.45;
    circ(ctx, x, y, 24 * sc); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.translate(x, y); ctx.rotate(-0.4); ctx.scale(sc, sc);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = palette.outline; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    rr(ctx, -14, 26, 36, 32, 11); ctx.fill(); ctx.stroke();
    rr(ctx, -7, 0, 14, 38, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, 30); ctx.lineTo(6, 30); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
    ctx.restore();
  }
  function arrow(ctx, x1, y1, x2, y2, color, lw) {
    ctx.save();
    var a = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw || 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * 10, y2 - Math.sin(a) * 10); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.5) * 16, y2 - Math.sin(a - 0.5) * 16);
    ctx.lineTo(x2 - Math.cos(a + 0.5) * 16, y2 - Math.sin(a + 0.5) * 16);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ---------- 魔物本體(全遊戲共用一套畫法) ----------
  // 本體在 100×100 單位框內設計, 依 size 縮放。mode: idle | sleep | perform | angry
  var EYES = {
    fire: [[17, -8], [31, -8]],
    thunder: [[-10, -2], [10, -2]],
    water: [[-11, -6], [11, -6]],
    stone: [[-10, -2], [10, -2]]
  };
  var BODY = {
    fire: function (ctx, b, d, l) {
      ctx.fillStyle = b;
      ctx.beginPath(); ctx.moveTo(-22, 8); ctx.quadraticCurveTo(-50, 12, -46, -16); ctx.quadraticCurveTo(-38, 6, -18, 24); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = d;
      ell(ctx, -18, 34, 7, 8); ctx.fill(); ctx.stroke();
      ell(ctx, 10, 34, 7, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = b; ell(ctx, -2, 16, 30, 19); ctx.fill(); ctx.stroke();
      ctx.fillStyle = l; ell(ctx, -2, 25, 20, 8); ctx.fill();
      ctx.fillStyle = b; circ(ctx, 24, -4, 19); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd86a';
      flamePath(ctx, -20, 0, 7, 18); ctx.fill(); ctx.stroke();
      flamePath(ctx, -6, -3, 7, 20); ctx.fill(); ctx.stroke();
      flamePath(ctx, 8, -1, 6, 16); ctx.fill(); ctx.stroke();
    },
    thunder: function (ctx, b, d, l) {
      ctx.fillStyle = d;
      var wing = [[18, -2], [48, -18], [40, -3], [52, 8], [36, 10], [42, 22], [18, 18]];
      poly(ctx, wing, 1); ctx.fill(); ctx.stroke();
      poly(ctx, wing, -1); ctx.fill(); ctx.stroke();
      ctx.fillStyle = b; circ(ctx, 0, 6, 27); ctx.fill(); ctx.stroke();
      ctx.fillStyle = l; ell(ctx, 0, 18, 15, 10); ctx.fill();
      ctx.fillStyle = d;
      poly(ctx, [[-3, -19], [5, -36], [1, -31], [9, -46], [-6, -28], [-1, -30], [-8, -19]]); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffb04a';
      poly(ctx, [[-6, 6], [6, 6], [0, 15]]); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, 32); ctx.lineTo(-10, 42); ctx.moveTo(8, 32); ctx.lineTo(10, 42); ctx.stroke();
    },
    water: function (ctx, b, d, l) {
      ctx.lineCap = 'round';
      for (var i = 0; i < 5; i++) {
        var x0 = -20 + i * 10;
        ctx.beginPath(); ctx.moveTo(x0, 6); ctx.quadraticCurveTo(x0 + 8, 22, x0, 30); ctx.quadraticCurveTo(x0 - 8, 38, x0 + 2, 46);
        ctx.lineWidth = 7; ctx.strokeStyle = '#0b0e1a'; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = l; ctx.stroke();
      }
      ctx.lineWidth = 3; ctx.strokeStyle = palette.outline;
      ctx.fillStyle = b;
      ctx.beginPath(); ctx.moveTo(-32, 8); ctx.arc(0, 8, 32, Math.PI, 0);
      ctx.quadraticCurveTo(24, 16, 16, 9); ctx.quadraticCurveTo(8, 16, 0, 9); ctx.quadraticCurveTo(-8, 16, -16, 9); ctx.quadraticCurveTo(-24, 16, -32, 8);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = rgba('#ffffff', 0.45); ell(ctx, -12, -12, 9, 6); ctx.fill();
      ctx.strokeStyle = l; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 8, 26, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.strokeStyle = palette.outline; ctx.lineWidth = 3;
    },
    stone: function (ctx, b, d, l) {
      ctx.fillStyle = d;
      var wing = [[20, -6], [48, -22], [44, -6], [52, 4], [40, 6], [44, 18], [22, 16]];
      poly(ctx, wing, 1); ctx.fill(); ctx.stroke();
      poly(ctx, wing, -1); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d8d0b0';
      poly(ctx, [[-18, -20], [-26, -40], [-8, -22]]); ctx.fill(); ctx.stroke();
      poly(ctx, [[18, -20], [26, -40], [8, -22]]); ctx.fill(); ctx.stroke();
      ctx.fillStyle = b; rr(ctx, -26, -22, 52, 58, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = l; rr(ctx, -14, 10, 28, 18, 6); ctx.fill();
      ctx.fillStyle = d;
      ell(ctx, -14, 39, 10, 6); ctx.fill(); ctx.stroke();
      ell(ctx, 14, 39, 10, 6); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = l; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-20, -16); ctx.lineTo(-12, -12); ctx.moveTo(20, -16); ctx.lineTo(12, -12); ctx.stroke();
      ctx.strokeStyle = palette.outline; ctx.lineWidth = 3;
    }
  };
  function eyes(ctx, sp, mode) {
    var pts = EYES[sp];
    var mid = (pts[0][0] + pts[1][0]) / 2;
    for (var i = 0; i < pts.length; i++) {
      var x = pts[i][0], y = pts[i][1];
      if (mode === 'sleep') {
        ctx.beginPath(); ctx.arc(x, y - 2, 5, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.lineWidth = 3; ctx.strokeStyle = palette.outline; ctx.stroke();
        continue;
      }
      circ(ctx, x, y, 6); ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = palette.outline; ctx.stroke();
      circ(ctx, x, y + (mode === 'perform' ? -1.5 : 0.5), 3.3);
      ctx.fillStyle = mode === 'angry' ? palette.danger : palette.outline; ctx.fill();
      if (mode === 'angry') {
        var left = x < mid;
        ctx.beginPath();
        ctx.moveTo(left ? x - 8 : x + 8, y - 12); ctx.lineTo(left ? x + 6 : x - 6, y - 7);
        ctx.lineWidth = 3.5; ctx.strokeStyle = palette.outline; ctx.stroke();
      }
    }
  }
  function creature(ctx, sp, cx, cy, size, mode, flash) {
    var C = SP[sp];
    if (!C) return;
    var b = C.body, d = C.dark, l = C.light;
    if (flash) { b = mix(C.body, '#ffffff', 0.65); d = mix(C.dark, '#ffffff', 0.55); l = '#ffffff'; }
    ctx.save();
    ctx.translate(cx, cy);
    var k = size / 100;
    ctx.scale(k, k);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, 0, 44, 36, 7); ctx.fill();
    if (mode === 'sleep') { ctx.translate(0, 16); ctx.scale(1.15, 0.72); }
    else if (mode === 'perform') { ctx.translate(0, -6); ctx.scale(1.06, 1.06); }
    ctx.lineWidth = 3; ctx.strokeStyle = palette.outline; ctx.lineJoin = 'round';
    BODY[sp](ctx, b, d, l);
    eyes(ctx, sp, mode);
    ctx.restore();
    if (mode === 'sleep') {
      var zx = cx + size * 0.3, zy = cy - size * 0.18;
      txt(ctx, 'z', zx, zy, Math.round(size * 0.14), '#c8d0ea', { lw: 3 });
      txt(ctx, 'z', zx + size * 0.1, zy - size * 0.12, Math.round(size * 0.11), '#c8d0ea', { lw: 3 });
    }
  }

  // ---------- 場景 ----------
  function drawBackground(ctx) {
    ctx.save();
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  var DUNGEON_TINT = [
    { wall: '#2a2f45', brick: '#1d2133', floor: '#1f222e' },
    { wall: '#32284a', brick: '#221a34', floor: '#221d2e' },
    { wall: '#42282c', brick: '#2e1a1e', floor: '#291d20' }
  ];
  function drawDungeonRoom(ctx, s) {
    s = s || {};
    var day = clamp(Math.round(num(s.day, 1)), 1, 3), room = num(s.room, 1);
    var T = DUNGEON_TINT[day - 1];
    ctx.save();
    ctx.fillStyle = T.wall; ctx.fillRect(0, 0, W, 560);
    ctx.strokeStyle = T.brick; ctx.lineWidth = 3;
    for (var row = 0; row * 40 < 560; row++) {
      var y0 = row * 40;
      ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(W, y0); ctx.stroke();
      var off = (row + room) % 2 ? 40 : 0;
      for (var bx = off; bx < W; bx += 80) { ctx.beginPath(); ctx.moveTo(bx, y0); ctx.lineTo(bx, y0 + 40); ctx.stroke(); }
    }
    // 房間差異: 第 1 房兩根內柱, 第 2 房邊柱 + 往下的階梯口
    ctx.fillStyle = T.brick;
    var cols = room === 2 ? [20, 700] : [250, 470];
    for (var i = 0; i < cols.length; i++) ctx.fillRect(cols[i] - 18, 120, 36, 440);
    if (room === 2) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      rr(ctx, 300, 210, 120, 150, 50); ctx.fill();
    }
    // 火把(低彩度、只在牆緣)
    var tx = [70, 650];
    for (var j = 0; j < 2; j++) {
      ctx.fillStyle = '#5a4030'; ctx.fillRect(tx[j] - 5, 300, 10, 40);
      var g = ctx.createRadialGradient(tx[j], 290, 4, tx[j], 290, 70);
      g.addColorStop(0, 'rgba(255,214,140,0.35)'); g.addColorStop(1, 'rgba(255,214,140,0)');
      ctx.fillStyle = g; circ(ctx, tx[j], 290, 70); ctx.fill();
      ctx.fillStyle = '#ffd88a'; flamePath(ctx, tx[j], 298, 7, 20); ctx.fill();
    }
    // 地板
    ctx.fillStyle = T.floor; ctx.fillRect(0, 560, W, 590);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 2;
    for (var k = -6; k <= 6; k++) { ctx.beginPath(); ctx.moveTo(360 + k * 40, 560); ctx.lineTo(360 + k * 130, 1150); ctx.stroke(); }
    for (var yy = 600; yy < 1150; yy += 70) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, 556, W, 8);
    ctx.fillStyle = '#10131f'; ctx.fillRect(0, 1150, W, 130);
    ctx.restore();
  }

  var CAGE_X = [130, 360, 590], CAGE_Y = [290, 570];
  function drawZooGround(ctx) {
    ctx.save();
    ctx.fillStyle = palette.zooGrass; ctx.fillRect(0, 120, W, 590);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 2;
    for (var y = 140; y < 710; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (var r = 0; r < 2; r++) for (var c = 0; c < 3; c++) { rr(ctx, CAGE_X[c] - 114, CAGE_Y[r] - 116, 228, 240, 16); ctx.fill(); }
    // 接力圖底帶
    ctx.fillStyle = '#161b2b'; ctx.fillRect(0, 712, W, 88);
    // 遊客區
    ctx.fillStyle = '#3e3628'; ctx.fillRect(0, 800, W, 212);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (var i = 0; i < 12; i++) { ell(ctx, 30 + i * 62, 900 + (i % 2) * 40, 18, 6); ctx.fill(); }
    ctx.strokeStyle = '#6a5a40'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 812); ctx.lineTo(W, 812); ctx.stroke();
    for (var p = 20; p < W; p += 70) { ctx.beginPath(); ctx.moveTo(p, 804); ctx.lineTo(p, 822); ctx.stroke(); }
    // 候展區架子
    ctx.fillStyle = palette.tray; ctx.fillRect(0, 1012, W, 138);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
    for (var yy = 1040; yy < 1150; yy += 36) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
    txt(ctx, '候展區', 12, 1026, 18, '#c9b89a', { align: 'left', lw: 3 });
    ctx.fillStyle = '#10131f'; ctx.fillRect(0, 1150, W, 130);
    ctx.restore();
  }

  // ---------- 地下城物件 ----------
  function drawPlayer(ctx, s) {
    if (!s) return;
    var hit = !!s.hit;
    var sx = hit ? Math.sin(now() * 60) * 5 : 0;
    var x = s.x + sx, y = s.y;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ell(ctx, s.x, y + 56, 46, 9); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = palette.outline; ctx.lineJoin = 'round';
    var cream = hit ? '#ffffff' : palette.player;
    // 背上的網
    netIcon(ctx, x - 36, y - 6, 20, true);
    // 腿
    ctx.fillStyle = '#5a4030';
    rr(ctx, x - 20, y + 30, 14, 24, 5); ctx.fill(); ctx.stroke();
    rr(ctx, x + 6, y + 30, 14, 24, 5); ctx.fill(); ctx.stroke();
    // 身體
    ctx.fillStyle = cream; rr(ctx, x - 26, y - 8, 52, 46, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a5530'; ctx.fillRect(x - 25, y + 16, 50, 7);
    // 劍
    ctx.save(); ctx.translate(x + 36, y + 10); ctx.rotate(-0.25);
    ctx.fillStyle = '#e6ecf5'; rr(ctx, -4, -52, 8, 46, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a5530'; rr(ctx, -11, -8, 22, 6, 2); ctx.fill(); ctx.stroke();
    rr(ctx, -3, -3, 6, 14, 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    // 頭 + 頭盔
    ctx.fillStyle = hit ? '#ffffff' : '#f6c99a'; circ(ctx, x, y - 30, 22); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c0c6d6';
    ctx.beginPath(); ctx.arc(x, y - 32, 24, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = palette.outline;
    circ(ctx, x - 8, y - 24, 3); ctx.fill(); circ(ctx, x + 8, y - 24, 3); ctx.fill();
    if (hit) impact(ctx, x + 30, y - 40, 22);
    hpBar(ctx, s.x - 60, y + 66, 120, 10, num(s.hp, 0), num(s.maxHp, 1));
    ctx.restore();
  }

  function reticle(ctx, x, y, r) {
    ctx.save();
    var a = now() * 1.5;
    ctx.translate(x, y); ctx.rotate(a);
    ctx.setLineDash([14, 10]);
    ctx.lineWidth = 7; ctx.strokeStyle = palette.outline; circ(ctx, 0, 0, r); ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = palette.net; circ(ctx, 0, 0, r); ctx.stroke();
    ctx.setLineDash([]);
    for (var i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(0, -r - 6); ctx.lineTo(0, -r + 12);
      ctx.lineWidth = 7; ctx.strokeStyle = palette.outline; ctx.stroke();
      ctx.lineWidth = 4; ctx.strokeStyle = palette.net; ctx.stroke();
    }
    ctx.restore();
  }

  function drawMonster(ctx, s) {
    if (!s || !SP[s.species]) return;
    var hit = !!s.hit;
    var sx = hit ? Math.sin(now() * 60) * 5 : 0;
    ctx.save();
    if (s.aimNet) reticle(ctx, s.x, s.y + 4, 62);
    creature(ctx, s.species, s.x + sx, s.y + 10, 128, 'idle', hit);
    if (hit) impact(ctx, s.x + 26, s.y - 18, 22);
    hpBar(ctx, s.x - 55, s.y - 76, 110, 12, num(s.hp, 0), num(s.maxHp, 1));
    ctx.restore();
  }

  function meshPath(ctx, x, y, r, rot) {
    ctx.beginPath();
    for (var i = 0; i < 8; i++) {
      var a = rot + i * Math.PI / 4;
      ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.moveTo(x + r * 0.55, y); ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
  }
  function mesh(ctx, x, y, r, rot) {
    meshPath(ctx, x, y, r, rot);
    ctx.lineWidth = 6; ctx.strokeStyle = palette.outline; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = palette.net; ctx.stroke();
    for (var i = 0; i < 8; i++) {
      var a = rot + i * Math.PI / 4 + Math.PI / 8;
      circ(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, 4);
      ctx.fillStyle = '#8a7a5a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = palette.outline; ctx.stroke();
    }
  }
  function drawNet(ctx, s) {
    if (!s) return;
    var t = Math.max(0, num(s.t, 0)), x = s.x, y = s.y;
    ctx.save();
    if (s.result === 'success') {
      var pop = 0.8 + 0.2 * clamp(t / 0.15, 0, 1);
      ctx.save();
      ctx.translate(x, y + 8); ctx.scale(pop, pop);
      ctx.beginPath();
      ctx.moveTo(0, -48); ctx.quadraticCurveTo(58, -40, 50, 14); ctx.quadraticCurveTo(40, 58, 0, 58);
      ctx.quadraticCurveTo(-40, 58, -50, 14); ctx.quadraticCurveTo(-58, -40, 0, -48); ctx.closePath();
      ctx.fillStyle = 'rgba(239,227,194,0.35)'; ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = palette.outline; ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = palette.net; ctx.stroke();
      ctx.save(); ctx.clip();
      ctx.beginPath();
      for (var d = -120; d < 120; d += 16) { ctx.moveTo(d, -60); ctx.lineTo(d + 120, 60); ctx.moveTo(d + 120, -60); ctx.lineTo(d, 60); }
      ctx.lineWidth = 2; ctx.strokeStyle = palette.net; ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#8a7a5a'; circ(ctx, 0, -50, 8); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = palette.outline; ctx.stroke();
      ctx.restore();
      checkBadge(ctx, x + 50, y - 50, 22);
    } else if (s.result === 'fail') {
      var a = clamp(1 - t / 0.8, 0, 1);
      ctx.globalAlpha = a;
      for (var side = -1; side <= 1; side += 2) {
        ctx.save();
        var tt = Math.min(t, 0.8);
        ctx.translate(side * (6 + 26 * tt), 12 * tt);
        ctx.beginPath();
        if (side < 0) ctx.rect(x - 80, y - 80, 80, 160); else ctx.rect(x, y - 80, 80, 160);
        ctx.clip();
        mesh(ctx, x, y, 42, side * tt);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      crossBadge(ctx, x + 50, y - 50, 22);
    } else {
      var sc = 0.55 + 0.45 * clamp(t / 0.25, 0, 1);
      mesh(ctx, x, y, 56 * sc, t * 5);
    }
    ctx.restore();
  }

  // ---------- 動物園物件 ----------
  function rageBar(ctx, x, y, w, h, rage, calm) {
    var r = clamp(num(rage, 0), 0, 100) / 100;
    ctx.save();
    rr(ctx, x - 3, y - 3, w + 6, h + 6, 6); ctx.fillStyle = palette.outline; ctx.fill();
    rr(ctx, x, y, w, h, 4); ctx.fillStyle = '#20243a'; ctx.fill();
    if (r > 0) {
      var col = r < 0.5 ? palette.rageLow : r < 0.8 ? palette.rageHot : palette.danger;
      if (r >= 0.8) ctx.globalAlpha = 0.65 + 0.35 * Math.abs(Math.sin(now() * 6));
      rr(ctx, x, y, Math.max(6, w * r), h, 4); ctx.fillStyle = col; ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (calm > 0) {
      rr(ctx, x, y, w, h, 4); ctx.fillStyle = rgba(palette.calm, 0.55 * clamp(calm / 0.3, 0, 1)); ctx.fill();
    }
    // 表演門檻 50 的刻度
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + w * 0.5 - 1.5, y - 5, 3, h + 10);
    ctx.restore();
  }
  function cageBars(ctx, L, T, broken) {
    ctx.save();
    ctx.lineCap = 'round';
    for (var i = 0; i < 5; i++) {
      var bx = L + 30 + i * 40;
      if (!broken) {
        ctx.beginPath(); ctx.moveTo(bx, T + 20); ctx.lineTo(bx, T + 202);
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(170,180,210,0.5)'; ctx.stroke();
        continue;
      }
      ctx.strokeStyle = palette.danger; ctx.lineWidth = 5;
      if (i === 2) {
        ctx.beginPath(); ctx.moveTo(bx, T + 20); ctx.lineTo(bx + 6, T + 60); ctx.moveTo(bx, T + 202); ctx.lineTo(bx - 6, T + 170); ctx.stroke();
      } else if (i === 1 || i === 3) {
        var dir = i === 1 ? -1 : 1;
        ctx.beginPath(); ctx.moveTo(bx, T + 20); ctx.quadraticCurveTo(bx + dir * 34, T + 110, bx, T + 202); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(bx, T + 20); ctx.lineTo(bx, T + 202); ctx.stroke();
      }
    }
    ctx.restore();
  }
  function drawCage(ctx, s) {
    if (!s) return;
    var x = s.x, y = s.y, L = x - 110, T = y - 120;
    var sp = SP[s.species] ? s.species : null;
    var step = Math.max(0, Math.round(num(s.chainStep, 0)));
    var broken = !!s.broken;
    var rage = num(s.rage, 0);
    var calm = clamp(num(s.calmFlash, 0), 0, 0.3);
    ctx.save();
    rr(ctx, L + 2, T + 2, 216, 236, 14); ctx.fillStyle = '#1a1f30'; ctx.fill();
    rr(ctx, L + 10, T + 18, 200, 186, 8);
    ctx.fillStyle = broken ? '#2c1a24' : (sp ? palette.cageInner : '#1c2133'); ctx.fill();
    if (sp && !broken && step > 0) {
      var g = ctx.createRadialGradient(x, y - 20, 10, x, y - 20, 120);
      g.addColorStop(0, rgba(SP[sp].body, 0.6)); g.addColorStop(1, rgba(SP[sp].body, 0));
      ctx.fillStyle = g; rr(ctx, L + 10, T + 18, 200, 186, 8); ctx.fill();
    } else if (sp && !broken && s.canShow) {
      // 可表演: 舞台聚光
      ctx.beginPath(); ctx.moveTo(x - 30, T + 18); ctx.lineTo(x + 30, T + 18); ctx.lineTo(x + 92, T + 196); ctx.lineTo(x - 92, T + 196); ctx.closePath();
      ctx.fillStyle = 'rgba(255,243,196,0.16)'; ctx.fill();
      ell(ctx, x, T + 186, 84, 14); ctx.fillStyle = 'rgba(255,243,196,0.28)'; ctx.fill();
    }
    rr(ctx, L + 10, T + 172, 200, 32, 6); ctx.fillStyle = broken ? '#3a2228' : '#3a3326'; ctx.fill();
    if (broken) {
      ctx.strokeStyle = rgba(palette.danger, 0.7); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(L + 40, T + 40); ctx.lineTo(L + 70, T + 80); ctx.lineTo(L + 58, T + 110); ctx.lineTo(L + 90, T + 150);
      ctx.moveTo(L + 180, T + 30); ctx.lineTo(L + 150, T + 70); ctx.lineTo(L + 168, T + 96); ctx.stroke();
      if (sp) { ctx.globalAlpha = 0.18; creature(ctx, sp, x, y - 14, 150, 'idle'); ctx.globalAlpha = 1; }
    }
    if (sp && !broken) {
      var mode = step > 0 ? 'perform' : (s.canShow ? 'idle' : 'sleep');
      if (step === 0 && rage >= 80) mode = 'angry';
      creature(ctx, sp, x, y - 14, 150, mode);
    }
    cageBars(ctx, L, T, broken);
    rr(ctx, L + 2, T + 2, 216, 18, 8); ctx.fillStyle = broken ? '#5a2a34' : '#3a4466'; ctx.fill();
    rr(ctx, L + 2, T + 202, 216, 36, 8); ctx.fillStyle = '#141828'; ctx.fill();
    if (sp && !broken) rageBar(ctx, x - 92, y + 94, 184, 16, rage, calm);
    // 外框
    rr(ctx, L + 3, T + 3, 214, 234, 14);
    if (broken) {
      ctx.setLineDash([12, 8]); ctx.lineWidth = 4; ctx.strokeStyle = palette.danger; ctx.stroke(); ctx.setLineDash([]);
    } else if (step > 0) {
      ctx.lineWidth = 6; ctx.strokeStyle = palette.chain; ctx.stroke();
    } else {
      ctx.lineWidth = 3; ctx.strokeStyle = s.canShow && sp ? '#d8cfa0' : palette.line; ctx.stroke();
    }
    // 安撫: 薄荷色往內收的環 + 往下的雙箭頭
    if (calm > 0 && sp && !broken) {
      var p = calm / 0.3;
      rr(ctx, L + 10, T + 18, 200, 186, 8); ctx.fillStyle = rgba(palette.calm, 0.25 * p); ctx.fill();
      circ(ctx, x, y - 14, 40 + 60 * p); ctx.lineWidth = 5; ctx.strokeStyle = rgba(palette.calm, 0.9); ctx.stroke();
      for (var c = 0; c < 2; c++) {
        var cy = y + 56 + c * 14;
        ctx.beginPath(); ctx.moveTo(x + 60, cy); ctx.lineTo(x + 74, cy + 10); ctx.lineTo(x + 88, cy);
        ctx.lineWidth = 7; ctx.strokeStyle = palette.outline; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = palette.calm; ctx.stroke();
      }
    }
    // 第幾棒
    if (step > 0 && sp && !broken) {
      circ(ctx, L + 28, T + 34, 22); ctx.fillStyle = palette.chain; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = palette.outline; ctx.stroke();
      txt(ctx, step, L + 28, T + 35, 26, palette.outline, { stroke: false });
    }
    // 選中(擺放的目標)
    if (s.selected) {
      rr(ctx, L + 4, T + 4, 212, 232, 14); ctx.lineWidth = 5; ctx.strokeStyle = palette.select; ctx.stroke();
      cornerBrackets(ctx, L + 4, T + 4, 212, 232, 30);
    }
    ctx.restore();
  }
  function cornerBrackets(ctx, x, y, w, h, len) {
    ctx.save();
    ctx.lineWidth = 8; ctx.strokeStyle = palette.select; ctx.lineCap = 'round';
    var c = [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]];
    for (var i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(c[i][0] + c[i][2] * len, c[i][1]); ctx.lineTo(c[i][0], c[i][1]); ctx.lineTo(c[i][0], c[i][1] + c[i][3] * len); ctx.stroke();
    }
    ctx.restore();
  }

  var EFFECT_DUR = 1.0;
  function drawShowEffect(ctx, s) {
    if (!s || !SP[s.species]) return;
    var t = Math.max(0, num(s.t, 0));
    if (t > EFFECT_DUR) return;
    var k = clamp(Math.round(num(s.chainStep, 1)), 1, 6);
    var x = s.x, y = s.y, L = x - 110, T = y - 120;
    var C = SP[s.species];
    var a = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
    ctx.save();
    rr(ctx, L, T, 220, 240, 14); ctx.clip();
    ctx.globalAlpha = a;
    // 共用: 外擴光環, 棒數越高越粗
    circ(ctx, x, y - 14, 30 + t * 150);
    ctx.lineWidth = 3 + k * 2; ctx.strokeStyle = rgba(C.light, 0.8); ctx.stroke();
    var i, n;
    if (s.species === 'fire') {
      n = 3 + k * 2;
      for (i = 0; i < n; i++) {
        var fx = x - 85 + rnd(i) * 170, fy = y + 70 - t * (120 + rnd(i + 9) * 90);
        var fs = (10 + k * 2) * (1 - t * 0.4);
        ctx.fillStyle = C.body; flamePath(ctx, fx, fy, fs * 0.7, fs * 1.8); ctx.fill();
        ctx.fillStyle = '#ffd86a'; flamePath(ctx, fx, fy, fs * 0.35, fs * 1.0); ctx.fill();
      }
    } else if (s.species === 'thunder') {
      n = 1 + Math.min(k, 4);
      for (i = 0; i < n; i++) {
        if (((t * 16 + i) | 0) % 2) continue;
        var bx = n === 1 ? x : x - 80 + (i / (n - 1)) * 160;
        ctx.beginPath(); ctx.moveTo(bx, T + 8);
        var segs = 6;
        for (var j = 1; j <= segs; j++) ctx.lineTo(bx + (j % 2 ? 1 : -1) * (10 + rnd(i * 7 + j) * 12), T + 8 + j * 30);
        ctx.lineWidth = 6 + k; ctx.strokeStyle = C.dark; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.lineWidth = 2.5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      }
    } else if (s.species === 'water') {
      n = 3 + k * 2;
      for (i = 0; i < n; i++) {
        var wx = x - 85 + rnd(i + 3) * 170, wy = y + 70 - t * (130 + rnd(i) * 60);
        var wr = 6 + rnd(i + 5) * 8 + k;
        circ(ctx, wx, wy, wr); ctx.fillStyle = rgba(C.light, 0.35); ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = C.light; ctx.stroke();
      }
      ell(ctx, x, y + 72, 20 + t * 110, 6 + t * 18); ctx.lineWidth = 3 + k; ctx.strokeStyle = C.light; ctx.stroke();
    } else {
      n = 3 + k * 2;
      for (i = 0; i < n; i++) {
        var ang = -Math.PI + rnd(i + 2) * Math.PI;
        var dist = t * (90 + rnd(i + 4) * 70);
        var sx2 = x + Math.cos(ang) * dist, sy2 = y + 40 + Math.sin(ang) * dist + t * t * 80;
        var sz = 10 + k * 2;
        ctx.save(); ctx.translate(sx2, sy2); ctx.rotate(t * 6 + i);
        ctx.fillStyle = i % 2 ? C.light : '#b8b0a0'; ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
        ctx.lineWidth = 2; ctx.strokeStyle = palette.outline; ctx.strokeRect(-sz / 2, -sz / 2, sz, sz);
        ctx.restore();
      }
      ctx.beginPath(); ctx.moveTo(L + 10, y + 74); ctx.lineTo(L + 210, y + 74);
      ctx.lineWidth = 4 + k * 1.5; ctx.strokeStyle = rgba(C.light, 0.9); ctx.stroke();
    }
    // 第 3 棒起: 金色星光(大場面預兆)
    if (k >= 3) {
      for (i = 0; i < k + 2; i++) {
        var aa = i * 2.4 + t * 3, rad = 60 + rnd(i) * 40;
        starPath(ctx, x + Math.cos(aa) * rad, y - 14 + Math.sin(aa) * rad, 9, 3.5, 4);
        ctx.fillStyle = palette.gold; ctx.fill();
      }
    }
    ctx.restore();
  }

  function qpt(p0, c, p1, u) {
    var m = 1 - u;
    return [m * m * p0[0] + 2 * m * u * c[0] + u * u * p1[0], m * m * p0[1] + 2 * m * u * c[1] + u * u * p1[1]];
  }
  function drawChainLink(ctx, s) {
    if (!s) return;
    var t = Math.max(0, num(s.t, 0));
    if (t > 1.0) return;
    var x1 = s.x1, y1 = s.y1, x2 = s.x2, y2 = s.y2;
    var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / len, uy = dy / len;
    var trim = Math.min(55, len * 0.3);
    var p0 = [x1 + ux * trim, y1 + uy * trim], p1 = [x2 - ux * trim, y2 - uy * trim];
    var c = [(p0[0] + p1[0]) / 2 + uy * 40, (p0[1] + p1[1]) / 2 - ux * 40];
    var k = clamp(Math.round(num(s.chainStep, 2)), 1, 6);
    var prog = clamp(t / 0.4, 0, 1);
    var a = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
    var lw = 6 + Math.min(k, 5) * 1.5;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(c[0], c[1], p1[0], p1[1]);
    ctx.setLineDash([8, 10]); ctx.lineWidth = 3; ctx.strokeStyle = rgba(palette.chain, 0.5); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(p0[0], p0[1]);
    var steps = 24, last = p0;
    for (var i = 1; i <= steps; i++) { var u = prog * i / steps; last = qpt(p0, c, p1, u); ctx.lineTo(last[0], last[1]); }
    ctx.lineWidth = lw + 5; ctx.strokeStyle = palette.outline; ctx.stroke();
    ctx.shadowColor = palette.chain; ctx.shadowBlur = 14;
    ctx.lineWidth = lw; ctx.strokeStyle = palette.chain; ctx.stroke();
    ctx.shadowBlur = 0;
    var prev = qpt(p0, c, p1, Math.max(0, prog - 0.05));
    var ang = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
    if (prog < 0.02) ang = Math.atan2(c[1] - p0[1], c[0] - p0[0]);
    ctx.translate(last[0], last[1]); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(lw + 10, 0); ctx.lineTo(-8, -lw - 6); ctx.lineTo(-8, lw + 6); ctx.closePath();
    ctx.fillStyle = palette.chain; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = palette.outline; ctx.stroke();
    ctx.restore();
  }

  function drawChainGuide(ctx, s) {
    if (!s) return;
    var x = s.x, y = s.y, act = SP[s.activeSpecies] ? s.activeSpecies : null;
    ctx.save();
    rr(ctx, x - 300, y - 35, 600, 70, 14); ctx.fillStyle = '#1b2034'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = palette.line; ctx.stroke();
    var seq = ['fire', 'thunder', 'water', 'stone', 'fire'];
    for (var i = 0; i < 4; i++) {
      var ax = x - 240 + i * 120;
      var lit = act && seq[i] === act;
      arrow(ctx, ax + 34, y, ax + 86, y, lit ? palette.chain : '#7a84a6', lit ? 6 : 4);
    }
    for (var j = 0; j < 5; j++) {
      var cx = x - 240 + j * 120, sp = seq[j];
      var on = act === sp;
      var last = j === 4;
      if (on) {
        circ(ctx, cx, y, 32); ctx.fillStyle = rgba(palette.chain, 0.28); ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = palette.chain; ctx.stroke();
      }
      if (last) {
        ctx.setLineDash([5, 5]); circ(ctx, cx, y, 30); ctx.lineWidth = 2; ctx.strokeStyle = '#7a84a6'; ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = on ? 1 : 0.55;
      }
      creature(ctx, sp, cx, y - 2, on ? 60 : 52, 'idle');
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawBigShowBanner(ctx, s) {
    s = s || {};
    var t = Math.max(0, num(s.t, 0));
    if (t > 1.8) return;
    var n = Math.max(0, Math.round(num(s.chainCount, 3)));
    // 放在遊客區帶(y 810~1000)正中, 不蓋籠子上的怒氣條與接力圖(見 style.md)
    var cx = 360, cy = 905;
    var sc = t < 0.15 ? 0.6 + (t / 0.15) * 0.55 : t < 0.3 ? 1.15 - (t - 0.15) / 0.15 * 0.15 : 1;
    var a = t < 1.3 ? 1 : 1 - (t - 1.3) / 0.5;
    ctx.save();
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.translate(cx, cy); ctx.scale(sc, sc);
    // 背後放射光
    ctx.save(); ctx.rotate(t * 0.8);
    for (var i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-18, -150); ctx.lineTo(18, -150); ctx.closePath();
      ctx.fillStyle = i % 2 ? 'rgba(255,225,74,0.18)' : 'rgba(255,134,214,0.18)'; ctx.fill();
    }
    ctx.restore();
    // 緞帶
    ctx.beginPath();
    ctx.moveTo(-250, -40); ctx.lineTo(250, -40); ctx.lineTo(228, 0); ctx.lineTo(250, 40); ctx.lineTo(-250, 40); ctx.lineTo(-228, 0); ctx.closePath();
    var g = ctx.createLinearGradient(0, -40, 0, 40);
    g.addColorStop(0, '#ff9ee0'); g.addColorStop(1, '#d4489e');
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = palette.outline; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = palette.gold; ctx.stroke();
    txt(ctx, '大場面!', -40, 0, 50, '#ffffff', { lw: 9 });
    txt(ctx, n + ' 連鎖', 150, 2, 32, palette.gold, { lw: 7 });
    ctx.restore();
  }

  function drawLooseMonster(ctx, s) {
    if (!s || !SP[s.species]) return;
    var hit = !!s.hit;
    var sx = hit ? Math.sin(now() * 60) * 4 : 0;
    var x = s.x, y = s.y;
    ctx.save();
    // 危險: 紅色鋸齒外圈(全遊戲只有逃脫魔物有)
    ctx.save(); ctx.translate(x, y - 8); ctx.rotate(now() * 1.2);
    starPath(ctx, 0, 0, 49, 39, 14);
    ctx.fillStyle = rgba(palette.danger, 0.2); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = palette.danger; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
    creature(ctx, s.species, x + sx, y - 10, 86, 'angry', hit);
    if (hit) impact(ctx, x + 24, y - 30, 18);
    var left = clamp(Math.round(num(s.hitsLeft, 3)), 0, 3);
    for (var i = 0; i < 3; i++) {
      var px = x - 22 + i * 22, py = y + 48;
      circ(ctx, px, py, 8);
      ctx.fillStyle = i < left ? '#ffffff' : 'rgba(40,20,30,0.8)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = i < left ? palette.danger : '#6a4a58'; ctx.stroke();
    }
    ctx.restore();
  }

  var SHIRTS = ['#e8c27a', '#9fc4e8', '#e8a0b4', '#b4d89f', '#d9c8ff', '#f0f0f0'];
  function drawVisitor(ctx, s) {
    if (!s) return;
    var x = s.x, y = s.y;
    var shirt = SHIRTS[Math.abs(Math.round(x / 37)) % SHIRTS.length];
    ctx.save();
    ctx.lineWidth = 3; ctx.strokeStyle = palette.outline; ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(ctx, x, y + 41, 20, 3); ctx.fill();
    if (s.scared) {
      ctx.translate(x, y + 40); ctx.rotate(0.12); ctx.translate(-x, -y - 40);
      ctx.globalAlpha = 0.85;
      shirt = mix(shirt, '#8090b0', 0.6);
    }
    ctx.fillStyle = '#3a3a50';
    rr(ctx, x - 13, y + 20, 10, 22, 4); ctx.fill(); ctx.stroke();
    rr(ctx, x + 3, y + 20, 10, 22, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = shirt; rr(ctx, x - 17, y - 14, 34, 38, 10); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    if (s.scared) { ctx.moveTo(x - 15, y - 8); ctx.lineTo(x - 21, y - 30); ctx.moveTo(x + 15, y - 8); ctx.lineTo(x + 19, y - 30); }
    else { ctx.moveTo(x - 15, y - 6); ctx.lineTo(x - 22, y + 12); ctx.moveTo(x + 15, y - 6); ctx.lineTo(x + 24, y - 20); }
    ctx.lineWidth = 6; ctx.stroke(); ctx.lineWidth = 3;
    ctx.fillStyle = s.scared ? '#d8dce8' : '#f6c99a';
    circ(ctx, x, y - 28, 13); ctx.fill(); ctx.stroke();
    ctx.fillStyle = palette.outline;
    if (s.scared) {
      circ(ctx, x - 5, y - 31, 2.5); ctx.fill(); circ(ctx, x + 5, y - 31, 2.5); ctx.fill();
      ell(ctx, x, y - 22, 3.5, 4.5); ctx.fill();
      ctx.fillStyle = '#9cc4ff'; flamePath(ctx, x + 16, y - 34, 3.5, 9); ctx.fill();
    } else {
      circ(ctx, x - 5, y - 30, 2); ctx.fill(); circ(ctx, x + 5, y - 30, 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y - 26, 5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
  }

  function drawTrayMonster(ctx, s) {
    if (!s || !SP[s.species]) return;
    var x = s.x, y = s.y, sel = !!s.selected;
    var lift = 0;
    ctx.save();
    rr(ctx, x - 46, y - 46 + lift, 92, 92, 14);
    ctx.fillStyle = sel ? '#3a4466' : '#2a2f45'; ctx.fill();
    ctx.lineWidth = sel ? 5 : 2; ctx.strokeStyle = sel ? palette.select : '#56607e'; ctx.stroke();
    creature(ctx, s.species, x, y - 4 + lift, 76, 'idle');
    if (sel) cornerBrackets(ctx, x - 45, y - 45, 90, 90, 18);
    ctx.restore();
  }

  // ---------- UI ----------
  function drawButton(ctx, s) {
    if (!s) return;
    var x = s.x, y = s.y, w = num(s.w, 200), h = num(s.h, 80);
    var en = s.enabled !== false, act = !!s.active;
    var px = Math.round(Math.min(h * 0.4, 34));
    ctx.save();
    if (act) {
      // 啟用中(丟網模式): 網色實心 + 外暈 + 網紋, 往下壓
      rr(ctx, x, y + 3, w, h - 3, 16);
      ctx.shadowColor = palette.net; ctx.shadowBlur = 18 + 8 * Math.abs(Math.sin(now() * 4));
      ctx.fillStyle = palette.net; ctx.fill(); ctx.shadowBlur = 0;
      ctx.lineWidth = 4; ctx.strokeStyle = palette.outline; ctx.stroke();
      ctx.save(); rr(ctx, x, y + 3, w, h - 3, 16); ctx.clip();
      ctx.beginPath();
      for (var d = -h; d < w + h; d += 18) { ctx.moveTo(x + d, y); ctx.lineTo(x + d + h, y + h); ctx.moveTo(x + d + h, y); ctx.lineTo(x + d, y + h); }
      ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(120,100,60,0.35)'; ctx.stroke();
      ctx.restore();
      txt(ctx, s.label || '', x + w / 2, y + h / 2 + 2, px, palette.outline, { stroke: false });
    } else if (en) {
      rr(ctx, x, y + 6, w, h - 6, 16); ctx.fillStyle = '#0a0d18'; ctx.fill();
      rr(ctx, x, y, w, h - 6, 16); ctx.fillStyle = '#3a4466'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = palette.text; ctx.stroke();
      txt(ctx, s.label || '', x + w / 2, y + (h - 6) / 2, px, palette.text);
    } else {
      rr(ctx, x, y + 6, w, h - 6, 16); ctx.fillStyle = '#1a1e2c'; ctx.fill();
      ctx.setLineDash([8, 6]); ctx.lineWidth = 2; ctx.strokeStyle = '#4a5068'; ctx.stroke(); ctx.setLineDash([]);
      txt(ctx, s.label || '', x + w / 2, y + 6 + (h - 6) / 2, px, '#5f6684', { stroke: false });
    }
    ctx.restore();
  }

  var ITEMS = {
    weapon: { name: '武器', desc: '攻擊 +2' },
    armor: { name: '護甲', desc: '血量上限 +15' },
    netBag: { name: '網袋', desc: '網數上限 +1' },
    goodNet: { name: '好網', desc: '捕獲率 +10%' }
  };
  function itemIcon(ctx, item, x, y) {
    ctx.save();
    ctx.lineWidth = 3; ctx.strokeStyle = palette.outline; ctx.lineJoin = 'round';
    if (item === 'weapon') {
      ctx.translate(x, y); ctx.rotate(0.7);
      ctx.fillStyle = '#e6ecf5'; rr(ctx, -6, -36, 12, 50, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c9a020'; rr(ctx, -18, 12, 36, 8, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#7a5530'; rr(ctx, -5, 20, 10, 18, 3); ctx.fill(); ctx.stroke();
    } else if (item === 'armor') {
      ctx.beginPath(); ctx.moveTo(x, y - 34); ctx.lineTo(x + 30, y - 24); ctx.quadraticCurveTo(x + 28, y + 18, x, y + 36);
      ctx.quadraticCurveTo(x - 28, y + 18, x - 30, y - 24); ctx.closePath();
      ctx.fillStyle = '#c0c6d6'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = palette.hp; ctx.fillRect(x - 4, y - 16, 8, 30); ctx.fillRect(x - 15, y - 5, 30, 8);
    } else if (item === 'netBag') {
      ctx.fillStyle = '#8a6a40'; rr(ctx, x - 28, y - 14, 56, 46, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#6a4f2e'; rr(ctx, x - 20, y - 26, 40, 16, 6); ctx.fill(); ctx.stroke();
      netIcon(ctx, x, y + 8, 14, true);
    } else {
      netIcon(ctx, x - 4, y + 4, 30, true);
      starPath(ctx, x + 24, y - 22, 14, 6, 4); ctx.fillStyle = palette.success; ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
  function drawShopItem(ctx, s) {
    if (!s) return;
    var x = s.x, y = s.y, L = x - 300, T = y - 70;
    var ok = !!s.affordable;
    var it = ITEMS[s.item] || { name: String(s.item || ''), desc: '' };
    ctx.save();
    rr(ctx, L + 2, T + 2, 596, 136, 18);
    ctx.fillStyle = ok ? '#2b3350' : '#191d2b'; ctx.fill();
    if (ok) { ctx.lineWidth = 3; ctx.strokeStyle = palette.text; ctx.stroke(); }
    else { ctx.setLineDash([10, 7]); ctx.lineWidth = 2; ctx.strokeStyle = '#4a5068'; ctx.stroke(); ctx.setLineDash([]); }
    rr(ctx, L + 18, T + 18, 104, 104, 14); ctx.fillStyle = ok ? '#1f2538' : '#141826'; ctx.fill();
    if (!ok) ctx.globalAlpha = 0.45;
    itemIcon(ctx, s.item, L + 70, T + 70);
    ctx.globalAlpha = 1;
    var tc = ok ? palette.text : '#6c7390';
    txt(ctx, it.name, L + 142, T + 46, 34, tc, { align: 'left', stroke: false });
    txt(ctx, it.desc, L + 142, T + 96, 24, ok ? '#c8cee4' : '#5a6080', { align: 'left', stroke: false, bold: false });
    var lv = Math.max(0, Math.round(num(s.level, 0)));
    if (lv > 0) txt(ctx, 'Lv.' + lv, L + 260, T + 46, 24, ok ? palette.chain : '#4a6070', { align: 'left', stroke: false });
    coin(ctx, L + 470, T + 70, 18);
    if (!ok) { ctx.fillStyle = 'rgba(25,29,43,0.5)'; circ(ctx, L + 470, T + 70, 19); ctx.fill(); }
    txt(ctx, Math.round(num(s.cost, 0)), L + 496, T + 72, 38, ok ? palette.gold : palette.danger, { align: 'left', stroke: false });
    ctx.restore();
  }

  var FLOAT_DUR = 1.0;
  function drawFloatText(ctx, s) {
    if (!s) return;
    var t = Math.max(0, num(s.t, 0));
    if (t > FLOAT_DUR) return;
    var kind = s.kind;
    var dy = kind === 'repDown' ? 24 * t : -50 * t;
    var a = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
    var col = kind === 'gold' ? palette.gold : kind === 'repUp' ? palette.rep : kind === 'repDown' ? palette.danger : palette.rageHot;
    var x = s.x, y = s.y + dy;
    var str = String(s.text == null ? '' : s.text);
    ctx.save();
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.font = f(30);
    var w = ctx.measureText(str).width;
    if (!(w > 0)) w = str.length * 18;
    var ix = x - w / 2 - 16;
    if (kind === 'gold') coin(ctx, ix, y, 13);
    else if (kind === 'repUp') repStar(ctx, ix, y, 15);
    else if (kind === 'repDown') {
      repStar(ctx, ix, y, 15, palette.danger);
      ctx.beginPath(); ctx.moveTo(ix - 2, y - 15); ctx.lineTo(ix + 3, y - 3); ctx.lineTo(ix - 3, y + 3); ctx.lineTo(ix + 2, y + 14);
      ctx.lineWidth = 3; ctx.strokeStyle = palette.outline; ctx.stroke();
    } else angerMark(ctx, ix, y, 12, palette.rageHot);
    txt(ctx, str, x + 8, y, 30, col, { lw: 6 });
    ctx.restore();
  }

  function drawResultPanel(ctx, s) {
    s = s || {};
    var stars = clamp(Math.round(num(s.stars, 0)), 0, 3);
    ctx.save();
    ctx.fillStyle = 'rgba(8,10,20,0.78)'; ctx.fillRect(0, 0, W, H);
    rr(ctx, 60, 250, 600, 760, 28); ctx.fillStyle = palette.panel; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = palette.text; ctx.stroke();
    txt(ctx, '三天結算', 360, 320, 48, palette.text);
    for (var i = 0; i < 3; i++) {
      var sx = 220 + i * 140, sy = 450;
      starPath(ctx, sx, sy, 54, 24, 5);
      if (i < stars) {
        ctx.shadowColor = palette.rep; ctx.shadowBlur = 18;
        ctx.fillStyle = palette.rep; ctx.fill(); ctx.shadowBlur = 0;
        ctx.lineWidth = 4; ctx.strokeStyle = palette.outline; ctx.stroke();
      } else {
        ctx.fillStyle = '#262c40'; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = '#4a5578'; ctx.stroke();
      }
    }
    var rows = [
      ['名聲', Math.round(num(s.rep, 0)), 'rep'],
      ['累計金幣', Math.round(num(s.goldEarned, 0)), 'gold'],
      ['最長連鎖', Math.round(num(s.bestChain, 0)), 'chain']
    ];
    for (var r = 0; r < rows.length; r++) {
      var ry = 590 + r * 100;
      rr(ctx, 100, ry - 40, 520, 80, 16); ctx.fillStyle = palette.panelHi; ctx.fill();
      if (rows[r][2] === 'rep') repStar(ctx, 146, ry, 22);
      else if (rows[r][2] === 'gold') coin(ctx, 146, ry, 20);
      else {
        ctx.lineWidth = 6; ctx.strokeStyle = palette.chain;
        circ(ctx, 136, ry, 12); ctx.stroke(); circ(ctx, 156, ry, 12); ctx.stroke();
      }
      txt(ctx, rows[r][0], 184, ry, 30, palette.textDim, { align: 'left', stroke: false });
      txt(ctx, rows[r][1], 590, ry, 44, rows[r][2] === 'rep' ? palette.rep : rows[r][2] === 'gold' ? palette.gold : palette.chain, { align: 'right', stroke: false });
    }
    ctx.globalAlpha = 0.6 + 0.4 * Math.abs(Math.sin(now() * 2.5));
    txt(ctx, '點畫面重來', 360, 940, 32, palette.text, { stroke: false });
    ctx.restore();
  }

  var PHASE_NAME = { dungeon: '地下城', place: '擺放', show: '開園中', shop: '商店' };
  function drawHud(ctx, s) {
    if (!s || s.phase === 'guide' || s.phase === 'result') return;
    var ph = s.phase;
    ctx.save();
    ctx.fillStyle = palette.hud; ctx.fillRect(0, 0, W, 120);
    ctx.fillStyle = '#2a3150'; ctx.fillRect(0, 118, W, 2);
    txt(ctx, '第 ' + Math.round(num(s.day, 1)) + ' 天', 20, 34, 32, palette.text, { align: 'left', stroke: false });
    var pn = PHASE_NAME[ph] || '';
    if (ph === 'dungeon') pn += '  ' + Math.round(num(s.room, 1)) + '/2 房';
    txt(ctx, pn, 150, 36, 24, palette.textDim, { align: 'left', stroke: false });
    coin(ctx, 432, 34, 16);
    txt(ctx, Math.round(num(s.gold, 0)), 456, 36, 30, palette.gold, { align: 'left', stroke: false });
    repStar(ctx, 578, 34, 18);
    txt(ctx, Math.round(num(s.rep, 0)), 602, 36, 30, palette.rep, { align: 'left', stroke: false });

    var msg = s.message ? String(s.message) : '';
    var msgX = 360, msgY = 90;
    if (ph === 'dungeon') {
      txt(ctx, '血', 20, 90, 22, palette.textDim, { align: 'left', stroke: false });
      hpBar(ctx, 50, 79, 240, 22, num(s.hp, 0), num(s.maxHp, 1));
      txt(ctx, Math.max(0, Math.round(num(s.hp, 0))) + '/' + Math.round(num(s.maxHp, 0)), 170, 91, 20, '#ffffff', { lw: 4 });
      var nm = Math.max(0, Math.round(num(s.netMax, 0))), nn = Math.max(0, Math.round(num(s.nets, 0)));
      txt(ctx, '網', 330, 90, 22, palette.textDim, { align: 'left', stroke: false });
      if (nm <= 10) {
        for (var i = 0; i < nm; i++) netIcon(ctx, 374 + i * 32, 90, 13, i < nn);
      } else {
        netIcon(ctx, 374, 90, 13, nn > 0);
        txt(ctx, nn + '/' + nm, 396, 91, 24, palette.net, { align: 'left', stroke: false });
      }
      msgY = 150;
    } else if (ph === 'show') {
      var tl = Math.max(0, Math.ceil(num(s.timeLeft, 0)));
      // 時鐘圖示
      circ(ctx, 36, 90, 16); ctx.lineWidth = 3; ctx.strokeStyle = palette.text; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(36, 90); ctx.lineTo(36, 80); ctx.moveTo(36, 90); ctx.lineTo(44, 94); ctx.stroke();
      txt(ctx, tl + ' 秒', 62, 91, 34, tl <= 10 ? palette.rageHot : palette.text, { align: 'left', stroke: false });
      msgX = 430;
    }
    if (msg) {
      var danger = msg.indexOf('抓回') >= 0;
      ctx.font = f(24);
      var mw = ctx.measureText(msg).width;
      if (!(mw > 0)) mw = msg.length * 24;
      var bw = Math.min(mw + 40, ph === 'show' ? 520 : 680);
      var bx = clamp(msgX - bw / 2, 10, W - 10 - bw);
      rr(ctx, bx, msgY - 22, bw, 44, 22);
      ctx.fillStyle = danger ? '#4a1420' : '#232a42'; ctx.fill();
      if (danger) ctx.globalAlpha = 0.7 + 0.3 * Math.abs(Math.sin(now() * 5));
      ctx.lineWidth = danger ? 4 : 2; ctx.strokeStyle = danger ? palette.danger : palette.line; ctx.stroke();
      ctx.globalAlpha = 1;
      txt(ctx, msg, bx + bw / 2, msgY + 1, 24, '#ffffff', { stroke: false });
    }
    ctx.restore();
  }

  // ---------- 說明頁示意圖(只畫在 x,y,w,h 框內; 標題 / 說明文字 / 頁碼由 RD 畫) ----------
  var GV_W = 600, GV_H = 480;
  function label(ctx, s, x, y, color) { txt(ctx, s, x, y, 22, color || palette.text, { lw: 5 }); }
  function scaled(ctx, cx, cy, k, fn) { ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-cx, -cy); fn(); ctx.restore(); }
  function miniDungeon(ctx, x, y, w, h) {
    ctx.save();
    rr(ctx, x, y, w, h, 12); ctx.clip();
    ctx.fillStyle = DUNGEON_TINT[0].wall; ctx.fillRect(x, y, w, h * 0.5);
    ctx.strokeStyle = DUNGEON_TINT[0].brick; ctx.lineWidth = 2;
    for (var r = 0; r * 30 < h * 0.5; r++) { ctx.beginPath(); ctx.moveTo(x, y + r * 30); ctx.lineTo(x + w, y + r * 30); ctx.stroke(); }
    ctx.fillStyle = DUNGEON_TINT[0].floor; ctx.fillRect(x, y + h * 0.5, w, h * 0.5);
    ctx.restore();
  }
  var GUIDE = [
    // 0 目標
    function (ctx) {
      rr(ctx, 0, 0, 600, 480, 16); ctx.fillStyle = palette.zooGrass; ctx.fill();
      ctx.fillStyle = '#3e3628'; ctx.fillRect(0, 350, 600, 130);
      drawCage(ctx, { x: 170, y: 210, species: 'fire', rage: 72, canShow: true, chainStep: 1, calmFlash: 0, broken: false, selected: false });
      drawShowEffect(ctx, { x: 170, y: 210, species: 'fire', chainStep: 1, t: 0.35 });
      drawCage(ctx, { x: 430, y: 210, species: 'water', rage: 64, canShow: true, chainStep: 1, calmFlash: 0, broken: false, selected: false });
      drawShowEffect(ctx, { x: 430, y: 210, species: 'water', chainStep: 1, t: 0.4 });
      for (var i = 0; i < 6; i++) drawVisitor(ctx, { x: 60 + i * 96, y: 415, scared: false });
      // 角落: 天數
      rr(ctx, 12, 12, 150, 48, 12); ctx.fillStyle = palette.hud; ctx.fill();
      txt(ctx, '第 1~3 天', 87, 37, 26, palette.text, { stroke: false });
      // 右上: 名聲讀數(HUD 同款)往上跳
      rr(ctx, 438, 12, 150, 48, 12); ctx.fillStyle = palette.hud; ctx.fill();
      repStar(ctx, 470, 36, 18);
      txt(ctx, '48', 520, 38, 30, palette.rep, { stroke: false });
      drawFloatText(ctx, { x: 520, y: 86, text: '+3', kind: 'repUp', t: 0.2 });
    },
    // 1 地下城戰鬥
    function (ctx) {
      miniDungeon(ctx, 0, 0, 600, 480);
      scaled(ctx, 0, 0, 0.8, function () {
        drawMonster(ctx, { x: 130, y: 190, species: 'fire', hp: 10, maxHp: 10, hit: false, aimNet: false });
        drawMonster(ctx, { x: 375, y: 190, species: 'thunder', hp: 6, maxHp: 12, hit: true, aimNet: false });
        drawMonster(ctx, { x: 620, y: 190, species: 'water', hp: 8, maxHp: 8, hit: false, aimNet: false });
        drawPlayer(ctx, { x: 375, y: 480, hp: 40, maxHp: 40, hit: false });
      });
      // 剛被扣掉的那段血(白色殘段)
      ctx.fillStyle = '#ffffff'; rr(ctx, 300 - 44 + 88 * 0.5, 91, 88 * (4 / 12), 9.6, 4); ctx.fill();
      hand(ctx, 312, 150, 1);
      label(ctx, '你', 380, 384);
    },
    // 2 捕獲
    function (ctx) {
      miniDungeon(ctx, 0, 0, 600, 250);
      drawButton(ctx, { x: 20, y: 70, w: 150, h: 70, label: '捕獲網', enabled: true, active: true });
      hand(ctx, 110, 112, 0.8);
      arrow(ctx, 180, 110, 220, 110, '#ffffff', 4);
      scaled(ctx, 320, 150, 0.62, function () {
        drawMonster(ctx, { x: 320, y: 150, species: 'stone', hp: 3, maxHp: 16, hit: false, aimNet: true });
      });
      drawNet(ctx, { x: 290, y: 60, t: 0.1, result: 'flying' });
      arrow(ctx, 390, 120, 430, 120, '#ffffff', 4);
      rr(ctx, 440, 60, 150, 130, 12); ctx.fillStyle = palette.tray; ctx.fill();
      drawTrayMonster(ctx, { x: 515, y: 120, species: 'stone', selected: false });
      label(ctx, '候展區', 515, 214);
      // 對照: 滿血 ✗ / 殘血 ✓
      ctx.fillStyle = '#1a1f30'; ctx.fillRect(0, 262, 600, 218);
      scaled(ctx, 160, 380, 0.7, function () {
        drawMonster(ctx, { x: 160, y: 380, species: 'fire', hp: 10, maxHp: 10, hit: false, aimNet: false });
        drawNet(ctx, { x: 160, y: 390, t: 0.15, result: 'fail' });
      });
      label(ctx, '滿血', 160, 460);
      scaled(ctx, 440, 380, 0.7, function () {
        drawMonster(ctx, { x: 440, y: 380, species: 'fire', hp: 2, maxHp: 10, hit: false, aimNet: false });
        drawNet(ctx, { x: 440, y: 390, t: 0.3, result: 'success' });
      });
      label(ctx, '殘血', 440, 460);
    },
    // 3 怒氣與表演
    function (ctx) {
      rr(ctx, 0, 0, 600, 480, 16); ctx.fillStyle = palette.zooGrass; ctx.fill();
      drawCage(ctx, { x: 160, y: 250, species: 'stone', rage: 25, canShow: false, chainStep: 0, calmFlash: 0, broken: false, selected: false });
      drawCage(ctx, { x: 440, y: 250, species: 'thunder', rage: 70, canShow: true, chainStep: 1, calmFlash: 0, broken: false, selected: false });
      drawShowEffect(ctx, { x: 440, y: 250, species: 'thunder', chainStep: 1, t: 0.3 });
      drawFloatText(ctx, { x: 440, y: 120, text: '+8', kind: 'gold', t: 0.25 });
      drawFloatText(ctx, { x: 440, y: 160, text: '+1', kind: 'repUp', t: 0.25 });
    },
    // 4 接力
    function (ctx) {
      rr(ctx, 0, 0, 600, 480, 16); ctx.fillStyle = palette.zooGrass; ctx.fill();
      drawChainGuide(ctx, { x: 300, y: 50, activeSpecies: 'thunder' });
      drawCage(ctx, { x: 185, y: 320, species: 'fire', rage: 62, canShow: true, chainStep: 1, calmFlash: 0, broken: false, selected: false });
      drawCage(ctx, { x: 415, y: 320, species: 'thunder', rage: 58, canShow: true, chainStep: 2, calmFlash: 0, broken: false, selected: false });
      drawShowEffect(ctx, { x: 185, y: 320, species: 'fire', chainStep: 1, t: 0.55 });
      drawShowEffect(ctx, { x: 415, y: 320, species: 'thunder', chainStep: 2, t: 0.15 });
      drawChainLink(ctx, { x1: 185, y1: 320, x2: 415, y2: 320, chainStep: 2, t: 0.45 });
    },
    // 5 安撫與失控
    function (ctx) {
      rr(ctx, 0, 0, 600, 480, 16); ctx.fillStyle = palette.zooGrass; ctx.fill();
      ctx.fillStyle = '#3e3628'; ctx.fillRect(300, 330, 300, 150);
      drawCage(ctx, { x: 150, y: 210, species: 'water', rage: 42, canShow: false, chainStep: 0, calmFlash: 0.2, broken: false, selected: false });
      drawFloatText(ctx, { x: 150, y: 70, text: '−30', kind: 'rage', t: 0.2 });
      hand(ctx, 120, 200, 1);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(299, 20, 2, 440);
      drawCage(ctx, { x: 450, y: 170, species: 'stone', rage: 100, canShow: true, chainStep: 0, calmFlash: 0, broken: true, selected: false });
      // 衝刺軌跡
      ctx.save(); ctx.setLineDash([6, 8]); ctx.lineWidth = 4; ctx.strokeStyle = rgba(palette.danger, 0.7);
      ctx.beginPath(); ctx.moveTo(430, 290); ctx.quadraticCurveTo(400, 330, 420, 360); ctx.stroke(); ctx.restore();
      drawLooseMonster(ctx, { x: 440, y: 400, species: 'stone', hitsLeft: 3, hit: false });
      drawVisitor(ctx, { x: 545, y: 405, scared: true });
      crossBadge(ctx, 560, 345, 16);
    }
  ];
  function drawGuidePage(ctx, s) {
    if (!s) return;
    var page = clamp(Math.round(num(s.page, 0)), 0, GUIDE.length - 1);
    var x = num(s.x, 0), y = num(s.y, 0), w = num(s.w, W), h = num(s.h, H);
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    var k = Math.min(w / GV_W, h / GV_H);
    ctx.translate(x + (w - GV_W * k) / 2, y + (h - GV_H * k) / 2);
    ctx.scale(k, k);
    GUIDE[page](ctx);
    ctx.restore();
  }

  window.Art = {
    canvas: { width: W, height: H },
    palette: palette,
    drawBackground: drawBackground,
    drawDungeonRoom: drawDungeonRoom,
    drawZooGround: drawZooGround,
    drawPlayer: drawPlayer,
    drawMonster: drawMonster,
    drawNet: drawNet,
    drawCage: drawCage,
    drawShowEffect: drawShowEffect,
    drawChainLink: drawChainLink,
    drawChainGuide: drawChainGuide,
    drawBigShowBanner: drawBigShowBanner,
    drawLooseMonster: drawLooseMonster,
    drawVisitor: drawVisitor,
    drawTrayMonster: drawTrayMonster,
    drawButton: drawButton,
    drawShopItem: drawShopItem,
    drawFloatText: drawFloatText,
    drawResultPanel: drawResultPanel,
    drawHud: drawHud,
    drawGuidePage: drawGuidePage
  };
})();
