/* 魔物牧場 — 美術(Canvas 2D 幾何繪製, 無外部資源)
 * 全域物件 window.Art, 函式簽章照 interface.json。
 * 每個函式自己 save/restore; x,y 皆為物件中心(drawButton 為左上角)。
 */
(function () {
  'use strict';

  var P = {
    bg: '#0c0a10',
    hudBg: '#17131d',
    hudLine: '#3a3245',
    text: '#f4eee2',
    textDim: '#a99fb5',
    outline: '#140d1c',
    // 馴獸師與繩子(同一家族: 奶油白)
    tamer: '#f2e6c9',
    tamerHat: '#8a5a2b',
    rope: '#f3dfa8',
    ropeDark: '#4a3820',
    // 四種魔物(色相 17 / 79 / 211 / 272, 灰階 147 / 199 / 113 / 78)
    fire: '#ff6e36', fireLight: '#ffc27a', fireDark: '#a83a14',
    thunder: '#b4ec3c', thunderLight: '#eaffb0', thunderDark: '#5f8a12',
    water: '#1c84f0', waterLight: '#8cc8ff', waterDark: '#0e4a8c',
    stone: '#7a20c8', stoneLight: '#c08cf5', stoneDark: '#4a1280',
    // 字典色
    capture: '#3ddc6e', captureLight: '#b8ffd0',
    danger: '#ff3b5c',
    gold: '#ffd23f',
    repUp: '#ff8ad8',
    rageLow: '#cfc6b6', rageMid: '#ff9a1f', rageHigh: '#ff3b5c',
    // 地下城地形
    wall: '#120e14', wallTop: '#2a2230',
    floorCrag: '#3a3530', floorRuins: '#302a3a', floorLava: '#33201c', floorPond: '#1c2e33', floorHall: '#26252b',
    lava: '#4a140c', lavaGlow: '#ff7a1a',
    waterTile: '#17466e', waterRipple: '#3d78a8',
    pillar: '#5d5664', pillarBase: '#1c1720',
    // 牧場
    grass: '#2f4a2c', grassStripe: '#2a4228',
    stage: '#5a3f2a', stageLine: '#c89a5a',
    pond: '#1f4f7a', pondRim: '#9bc4e0',
    stand: '#2b2026', standRow: '#3b2c30', rail: '#5a4030',
    skin: '#f0c8a0'
  };
  var SHIRTS = ['#e0a0b0', '#a8c4e0', '#e0d090', '#b0dcc0', '#cdb0e0', '#e0c0a0'];
  var SPECIES_NAME = { fire: '火蜥蜴', water: '水母', thunder: '雷鳥', stone: '石像鬼' };
  var SPECIES_ORDER = ['fire', 'water', 'thunder', 'stone'];
  // 規格的預警長度(介面只傳經過秒數 t, 沒傳總長; 見 style.md)
  var WARN_DUR = { firering: 0.5, thunder: 0.8, quake: 0.5, waterball: 0.3 };
  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';

  // ---------- 小工具 ----------
  function now() {
    return (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) / 1000;
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function hash(x, y) {
    var n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
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
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
  function ellipse(ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
  }
  function fillStroke(ctx, fill, stroke, lw) {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 3; ctx.stroke(); }
  }
  // 帶深色描邊的文字(P10: 任何底色上可讀)
  function text(ctx, str, x, y, size, color, align, weight, outlineW) {
    ctx.font = (weight || 'bold') + ' ' + size + 'px ' + FONT;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    var ow = outlineW === undefined ? Math.max(3, size * 0.16) : outlineW;
    if (ow > 0) {
      ctx.strokeStyle = P.outline;
      ctx.lineWidth = ow;
      ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }
  function starPath(ctx, x, y, r, inner) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var rad = i % 2 ? r * (inner || 0.45) : r;
      var px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  function heartPath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.7, y - s * 1.1, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.7, y - s * 1.1, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
    ctx.closePath();
  }
  function coinIcon(ctx, x, y, r) {
    circle(ctx, x, y, r);
    fillStroke(ctx, P.gold, P.outline, 2);
    circle(ctx, x, y, r * 0.55);
    ctx.strokeStyle = '#b8901a'; ctx.lineWidth = Math.max(1.5, r * 0.2); ctx.stroke();
  }
  function repIcon(ctx, x, y, r, color) {
    starPath(ctx, x, y, r);
    fillStroke(ctx, color || P.repUp, P.outline, 2);
  }
  // 捕獸繩 / 捕捉記號(套索圈 + 繩尾)
  function lassoIcon(ctx, x, y, r, color, lw) {
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.moveTo(x + r * 0.7, y + r * 0.7);
    ctx.lineTo(x + r * 1.3, y + r * 1.4);
    ctx.strokeStyle = P.outline; ctx.lineWidth = (lw || 3) + 3; ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = lw || 3; ctx.stroke();
  }
  function arrow(ctx, x1, y1, x2, y2, color, w) {
    w = w || 6;
    var a = Math.atan2(y2 - y1, x2 - x1);
    var hl = w * 2.6;
    var bx = x2 - Math.cos(a) * hl, by = y2 - Math.sin(a) * hl;
    function path() {
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(bx, by);
    }
    function head() {
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(bx + Math.cos(a + Math.PI / 2) * w * 1.6, by + Math.sin(a + Math.PI / 2) * w * 1.6);
      ctx.lineTo(bx + Math.cos(a - Math.PI / 2) * w * 1.6, by + Math.sin(a - Math.PI / 2) * w * 1.6);
      ctx.closePath();
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    path(); ctx.strokeStyle = P.outline; ctx.lineWidth = w + 5; ctx.stroke();
    head(); ctx.lineWidth = 5; ctx.stroke();
    path(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
    head(); ctx.fillStyle = color; ctx.fill();
  }
  function checkMark(ctx, x, y, s, color) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x - s, y); ctx.lineTo(x - s * 0.3, y + s * 0.7); ctx.lineTo(x + s, y - s * 0.7);
    ctx.strokeStyle = P.outline; ctx.lineWidth = s * 0.55; ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.32; ctx.stroke();
  }
  function crossMark(ctx, x, y, s, color) {
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s);
    ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s);
    ctx.strokeStyle = P.outline; ctx.lineWidth = s * 0.55; ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.32; ctx.stroke();
  }
  function keycap(ctx, x, y, w, h, label, size) {
    rr(ctx, x - w / 2, y - h / 2 + 4, w, h, 8);
    ctx.fillStyle = '#6a6070'; ctx.fill();
    rr(ctx, x - w / 2, y - h / 2, w, h, 8);
    fillStroke(ctx, '#e8e2ee', P.outline, 2.5);
    ctx.font = 'bold ' + (size || 20) + 'px ' + FONT;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2a2230';
    ctx.fillText(label, x, y + 1);
  }
  function arrowKeys(ctx, x, y, s) {
    // 方向鍵圖示: 中心 (x,y), 每鍵 s
    var g = s + 4;
    var keys = [[0, -1, 0], [-1, 0, 3], [0, 0, 2], [1, 0, 1]];
    for (var i = 0; i < keys.length; i++) {
      var kx = x + keys[i][0] * g, ky = y + keys[i][1] * g + g / 2;
      keycap(ctx, kx, ky, s, s, '', 10);
      ctx.save();
      ctx.translate(kx, ky);
      ctx.rotate(keys[i][2] * Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.25); ctx.lineTo(s * 0.22, s * 0.12); ctx.lineTo(-s * 0.22, s * 0.12);
      ctx.closePath();
      ctx.fillStyle = '#2a2230'; ctx.fill();
      ctx.restore();
    }
  }

  // ---------- 魔物本體 ----------
  // o: { dir, white, eye:'n'|'angry'|'dizzy'|'scared', mouth, gray }
  // 本體範圍約 x ±42, y -27..31(以傳入原點為中心)
  function eye(ctx, x, y, r, mode, side) {
    if (mode === 'dizzy') {
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r);
      ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r);
      ctx.strokeStyle = P.outline; ctx.lineWidth = 2.5; ctx.stroke();
      return;
    }
    var er = mode === 'scared' ? r + 1.2 : r;
    circle(ctx, x, y, er);
    fillStroke(ctx, '#ffffff', P.outline, 1.6);
    var pr = mode === 'scared' ? er * 0.3 : er * 0.55;
    circle(ctx, x + er * 0.25, y, pr);
    ctx.fillStyle = mode === 'angry' ? '#c0102a' : P.outline;
    ctx.fill();
    if (mode === 'angry') {
      ctx.beginPath();
      // side: 1 = 臉前側的眼, -1 = 後側的眼; 眉毛往臉中心壓
      var s = side || 1;
      ctx.moveTo(x - r - 1, y - r - 4 + (s > 0 ? 0 : 3));
      ctx.lineTo(x + r + 1, y - r - 4 + (s > 0 ? 3 : 0));
      ctx.strokeStyle = P.outline; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
    }
  }
  function creature(ctx, sp, o) {
    o = o || {};
    var col = o.white ? '#ffffff' : (o.gray ? '#8a8490' : P[sp] || P.fire);
    var light = o.white ? '#ffffff' : (o.gray ? '#b4aeba' : P[sp + 'Light'] || '#ffffff');
    var dark = o.white ? '#e8e8e8' : (o.gray ? '#5a5560' : P[sp + 'Dark'] || P.outline);
    var OL = P.outline;
    var em = o.eye || 'n';
    ctx.save();
    ctx.scale(o.dir === -1 ? -1 : 1, 1);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (sp === 'fire') {
      ctx.beginPath(); ctx.moveTo(-14, 10); ctx.quadraticCurveTo(-30, 20, -37, 4);
      ctx.strokeStyle = OL; ctx.lineWidth = 12; ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.stroke();
      ellipse(ctx, -12, 19, 4.5, 5.5); fillStroke(ctx, col, OL, 2.5);
      ellipse(ctx, 7, 19, 4.5, 5.5); fillStroke(ctx, col, OL, 2.5);
      ellipse(ctx, -2, 8, 20, 12); fillStroke(ctx, col, OL, 3);
      circle(ctx, 18, 1, 11); fillStroke(ctx, col, OL, 3);
      ctx.fillStyle = light;
      circle(ctx, -13, 2, 3); ctx.fill();
      circle(ctx, -4, -1, 3.2); ctx.fill();
      circle(ctx, 5, 1, 2.5); ctx.fill();
      eye(ctx, 21, -2, 4, em, 1);
      if (o.mouth) { ellipse(ctx, 26, 6, 4, 3); ctx.fillStyle = OL; ctx.fill(); }
    } else if (sp === 'water') {
      var xs = [-14, -5, 5, 14];
      for (var i = 0; i < xs.length; i++) {
        var tx = xs[i];
        ctx.beginPath(); ctx.moveTo(tx, 6);
        ctx.quadraticCurveTo(tx - 5, 14, tx, 20);
        ctx.quadraticCurveTo(tx + 5, 25, tx, 30);
        ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.stroke();
        ctx.strokeStyle = light; ctx.lineWidth = 3.5; ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 2, 22, Math.PI, 0);
      ctx.lineTo(22, 7);
      ctx.quadraticCurveTo(16.5, 12, 11, 7);
      ctx.quadraticCurveTo(5.5, 12, 0, 7);
      ctx.quadraticCurveTo(-5.5, 12, -11, 7);
      ctx.quadraticCurveTo(-16.5, 12, -22, 7);
      ctx.closePath();
      fillStroke(ctx, col, OL, 3);
      ctx.globalAlpha *= 0.55;
      ellipse(ctx, -9, -9, 6, 4, -0.5); ctx.fillStyle = light; ctx.fill();
      ctx.globalAlpha /= 0.55;
      eye(ctx, -5, -1, 3.6, em, -1);
      eye(ctx, 9, -1, 3.6, em, 1);
      if (o.mouth) { ellipse(ctx, 3, 5, 3.5, 2.5); ctx.fillStyle = OL; ctx.fill(); }
    } else if (sp === 'thunder') {
      ellipse(ctx, -20, 1, 16, 8, -0.4); fillStroke(ctx, dark, OL, 3);
      ellipse(ctx, 18, 3, 15, 8, 0.4); fillStroke(ctx, col, OL, 3);
      ctx.beginPath(); ctx.moveTo(-12, 14); ctx.lineTo(-24, 22); ctx.lineTo(-18, 14);
      ctx.closePath(); fillStroke(ctx, dark, OL, 2.5);
      ctx.beginPath(); ctx.moveTo(-3, 19); ctx.lineTo(-3, 25); ctx.moveTo(4, 19); ctx.lineTo(4, 25);
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke();
      circle(ctx, 0, 4, 16); fillStroke(ctx, col, OL, 3);
      ctx.beginPath(); ctx.moveTo(-1, -11); ctx.lineTo(-7, -18); ctx.lineTo(0, -18); ctx.lineTo(-5, -26);
      ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.stroke();
      ctx.strokeStyle = light; ctx.lineWidth = 3.5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(12, -1); ctx.quadraticCurveTo(24, 2, 13, 7); ctx.closePath();
      fillStroke(ctx, '#ffb02e', OL, 2.5);
      eye(ctx, 6, -2, 4, em, 1);
      if (o.mouth) { ctx.beginPath(); ctx.moveTo(13, 3); ctx.lineTo(20, 3); ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke(); }
    } else { // stone
      for (var s = -1; s <= 1; s += 2) {
        ctx.beginPath();
        ctx.moveTo(s * 14, -4); ctx.lineTo(s * 34, -16); ctx.lineTo(s * 30, -4);
        ctx.lineTo(s * 36, 6); ctx.lineTo(s * 14, 10); ctx.closePath();
        fillStroke(ctx, dark, OL, 3);
      }
      for (s = -1; s <= 1; s += 2) {
        ctx.beginPath(); ctx.moveTo(s * 12, -12); ctx.lineTo(s * 16, -25); ctx.lineTo(s * 5, -14); ctx.closePath();
        fillStroke(ctx, '#d6c8e8', OL, 2.5);
      }
      rr(ctx, -13, 20, 9, 7, 3); fillStroke(ctx, dark, OL, 2.5);
      rr(ctx, 4, 20, 9, 7, 3); fillStroke(ctx, dark, OL, 2.5);
      rr(ctx, -18, -14, 36, 38, 10); fillStroke(ctx, col, OL, 3);
      rr(ctx, -17, -13, 34, 36, 9); ctx.strokeStyle = light; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.globalAlpha *= 0.5;
      rr(ctx, -10, 5, 20, 14, 6); ctx.fillStyle = light; ctx.fill();
      ctx.globalAlpha /= 0.5;
      eye(ctx, -6, -3, 3.8, em, -1);
      eye(ctx, 8, -3, 3.8, em, 1);
      if (o.mouth) { rr(ctx, -3, 6, 10, 5, 2); ctx.fillStyle = OL; ctx.fill(); }
    }
    ctx.restore();
  }

  // 馴獸師本體(判定圓半徑 18 = 身體圓)
  function tamerBody(ctx, facing, opt) {
    opt = opt || {};
    var a = -Math.PI / 2 + (facing || 0) * Math.PI / 4;
    var fx = Math.cos(a), fy = Math.sin(a);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ellipse(ctx, 0, 20, 18, 6); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
    // 身體: 半徑 18 實心圓(外緣 = 判定)
    circle(ctx, 0, 0, 16.5);
    fillStroke(ctx, opt.stunned ? '#b8b0a4' : P.tamer, P.outline, 3);
    // 面向: 帽簷朝面向方向
    ctx.beginPath();
    ctx.arc(fx * 4, fy * 4, 12, a - 1.1, a + 1.1);
    ctx.closePath();
    fillStroke(ctx, '#5c3a18', P.outline, 2);
    circle(ctx, -fx * 1.5, -fy * 1.5, 9.5);
    fillStroke(ctx, P.tamerHat, P.outline, 2.5);
    circle(ctx, -fx * 1.5, -fy * 1.5, 5);
    ctx.fillStyle = '#a8763c'; ctx.fill();
    // 鼻尖(面向方向的小圓)
    circle(ctx, fx * 15, fy * 15, 3.6);
    fillStroke(ctx, P.skin, P.outline, 2);
  }

  // ---------- 匯出 ----------
  var Art = {
    canvas: { width: 720, height: 1280 },
    palette: P,

    drawBackground: function (ctx) {
      ctx.save();
      ctx.fillStyle = P.bg;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.restore();
    },

    // ----- 地下城格子 -----
    drawTile: function (ctx, s) {
      ctx.save();
      var x = s.x - 30, y = s.y - 30;
      var zone = s.zone || 'hall';
      var floorCol = { crag: P.floorCrag, ruins: P.floorRuins, lava: P.floorLava, pond: P.floorPond, hall: P.floorHall }[zone] || P.floorHall;
      var hr = hash(Math.round(s.x), Math.round(s.y));
      ctx.beginPath(); ctx.rect(x, y, 60, 60); ctx.clip();
      var kind = s.kind || 'floor';
      if (kind === 'wall') {
        ctx.fillStyle = P.wall; ctx.fillRect(x, y, 60, 60);
        ctx.strokeStyle = P.wallTop; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + 20); ctx.lineTo(x + 60, y + 20);
        ctx.moveTo(x, y + 40); ctx.lineTo(x + 60, y + 40);
        ctx.moveTo(x + 30, y); ctx.lineTo(x + 30, y + 20);
        ctx.moveTo(x + 15, y + 20); ctx.lineTo(x + 15, y + 40);
        ctx.moveTo(x + 45, y + 20); ctx.lineTo(x + 45, y + 40);
        ctx.moveTo(x + 30, y + 40); ctx.lineTo(x + 30, y + 60);
        ctx.stroke();
      } else if (kind === 'pillar') {
        ctx.fillStyle = P.pillarBase; ctx.fillRect(x, y, 60, 60);
        circle(ctx, s.x, s.y + 3, 25); ctx.fillStyle = '#0a080c'; ctx.fill();
        circle(ctx, s.x, s.y, 24); fillStroke(ctx, P.pillar, P.outline, 3);
        circle(ctx, s.x, s.y, 16); ctx.strokeStyle = '#7a7282'; ctx.lineWidth = 2; ctx.stroke();
        ellipse(ctx, s.x - 8, s.y - 9, 6, 3.5, -0.6); ctx.fillStyle = '#8f879a'; ctx.fill();
      } else if (kind === 'lava') {
        ctx.fillStyle = P.lava; ctx.fillRect(x, y, 60, 60);
        var pulse = 0.75 + 0.25 * Math.sin(now() * 3 + hr * 6);
        ctx.strokeStyle = P.lavaGlow; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.globalAlpha = pulse;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 12 + hr * 10); ctx.lineTo(x + 22, y + 24); ctx.lineTo(x + 34, y + 14); ctx.lineTo(x + 56, y + 22 + hr * 8);
        ctx.moveTo(x + 22, y + 24); ctx.lineTo(x + 26, y + 44); ctx.lineTo(x + 10, y + 56);
        ctx.moveTo(x + 26, y + 44); ctx.lineTo(x + 50, y + 50);
        ctx.stroke();
        ctx.globalAlpha = 0.5 * pulse;
        circle(ctx, x + 40, y + 34, 5); ctx.fillStyle = '#ffb04a'; ctx.fill();
        ctx.globalAlpha = 1;
      } else if (kind === 'water') {
        ctx.fillStyle = P.waterTile; ctx.fillRect(x, y, 60, 60);
        ctx.strokeStyle = P.waterRipple; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        var off = (now() * 8 + hr * 30) % 30;
        for (var r = 0; r < 3; r++) {
          var ry = y + 10 + r * 20;
          ctx.beginPath();
          ctx.moveTo(x + ((off + r * 11) % 30) - 4, ry);
          ctx.quadraticCurveTo(x + ((off + r * 11) % 30) + 6, ry - 5, x + ((off + r * 11) % 30) + 16, ry);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = floorCol; ctx.fillRect(x, y, 60, 60);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 2;
        ctx.beginPath();
        if (zone === 'crag') {
          ctx.moveTo(x + 8 + hr * 20, y + 6); ctx.lineTo(x + 24, y + 26); ctx.lineTo(x + 18, y + 50);
          ctx.moveTo(x + 24, y + 26); ctx.lineTo(x + 50, y + 34 + hr * 10);
        } else if (zone === 'ruins') {
          ctx.rect(x + 4, y + 4, 52, 52);
          ctx.moveTo(x + 30, y + 4); ctx.lineTo(x + 30, y + 56);
        } else if (zone === 'lava') {
          circle(ctx, x + 14 + hr * 30, y + 16, 3); ctx.moveTo(x + 46, y + 44); ctx.arc(x + 44, y + 44, 2, 0, Math.PI * 2);
        } else if (zone === 'pond') {
          ctx.moveTo(x + 10, y + 40 - hr * 10); ctx.quadraticCurveTo(x + 20, y + 34, x + 30, y + 40);
        } else {
          ctx.moveTo(x, y + 30); ctx.lineTo(x + 60, y + 30);
        }
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, 59, 59);
      }
      if (s.nest) {
        var eggCol = { crag: P.thunderLight, ruins: P.stoneLight, lava: P.fireLight, pond: P.waterLight }[zone] || '#e0d8c8';
        ellipse(ctx, s.x, s.y + 4, 24, 14);
        ctx.strokeStyle = '#1a120c'; ctx.lineWidth = 9; ctx.stroke();
        ctx.strokeStyle = '#7a5530'; ctx.lineWidth = 5; ctx.stroke();
        ctx.strokeStyle = '#a07040'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (var k = 0; k < 8; k++) {
          var aa = k * Math.PI / 4;
          ctx.moveTo(s.x + Math.cos(aa) * 20, s.y + 4 + Math.sin(aa) * 11);
          ctx.lineTo(s.x + Math.cos(aa + 0.5) * 27, s.y + 4 + Math.sin(aa + 0.5) * 16);
        }
        ctx.stroke();
        ctx.globalAlpha = 0.7;
        ellipse(ctx, s.x - 7, s.y + 3, 5, 6.5); fillStroke(ctx, eggCol, P.outline, 1.5);
        ellipse(ctx, s.x + 6, s.y + 5, 5, 6.5); fillStroke(ctx, eggCol, P.outline, 1.5);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    },

    // ----- 馴獸師(64×64) -----
    drawTamer: function (ctx, s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      if (s.blink) {
        ctx.globalAlpha = Math.floor(now() * 12) % 2 ? 0.3 : 0.9;
      }
      var facing = s.facing || 0;
      var a = -Math.PI / 2 + facing * Math.PI / 4;
      tamerBody(ctx, facing, { stunned: s.stunned });
      if (s.barking && !s.stunned) {
        ctx.lineCap = 'round';
        for (var i = 0; i < 3; i++) {
          var rad = 20 + i * 4.5;
          ctx.beginPath();
          ctx.arc(0, 0, rad, a - 0.5 + i * 0.05, a + 0.5 - i * 0.05);
          ctx.strokeStyle = P.outline; ctx.lineWidth = 5; ctx.stroke();
          ctx.strokeStyle = '#fff8e0'; ctx.lineWidth = 2.5; ctx.stroke();
        }
      }
      if (s.stunned) {
        var t = now() * 4;
        for (var k = 0; k < 3; k++) {
          var aa = t + k * Math.PI * 2 / 3;
          var sx = Math.cos(aa) * 20, sy = -6 + Math.sin(aa) * 8;
          starPath(ctx, sx, sy, 6.5);
          fillStroke(ctx, P.gold, P.outline, 2);
        }
        // 暈眩: 鼻尖上方畫螺旋眼
        ctx.beginPath();
        for (var j = 0; j < 20; j++) {
          var ang = j * 0.6, rr2 = j * 0.35;
          var px = Math.cos(ang) * rr2, py = Math.sin(ang) * rr2;
          if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = P.outline; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.restore();
    },

    // ----- 繩子 -----
    drawRope: function (ctx, s) {
      var pts = s.points || [];
      if (pts.length < 2) return;
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.strokeStyle = P.outline; ctx.lineWidth = 9; ctx.stroke();
      // 由舊到新: 最舊的 1/4 淡出(會從這端被刪)
      var n = pts.length;
      for (var j = 1; j < n; j++) {
        var f = j / (n - 1);
        ctx.globalAlpha = f < 0.25 ? 0.35 + 0.65 * (f / 0.25) : 1;
        ctx.beginPath();
        ctx.moveTo(pts[j - 1].x, pts[j - 1].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.strokeStyle = P.rope; ctx.lineWidth = 5; ctx.stroke();
        if (j % 2 === 0) {
          var mx = (pts[j - 1].x + pts[j].x) / 2, my = (pts[j - 1].y + pts[j].y) / 2;
          var dx = pts[j].x - pts[j - 1].x, dy = pts[j].y - pts[j - 1].y;
          var L = Math.sqrt(dx * dx + dy * dy) || 1;
          ctx.beginPath();
          ctx.moveTo(mx - dy / L * 2.5 - dx / L * 2, my + dx / L * 2.5 - dy / L * 2);
          ctx.lineTo(mx + dy / L * 2.5 + dx / L * 2, my - dx / L * 2.5 + dy / L * 2);
          ctx.strokeStyle = '#b89a5a'; ctx.lineWidth = 1.5; ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      // 最舊端的繩頭
      circle(ctx, pts[0].x, pts[0].y, 3.5);
      fillStroke(ctx, '#b89a5a', P.outline, 2);
      ctx.restore();
    },

    // ----- 圍圈閃光(約 0.6 秒) -----
    drawLoopFlash: function (ctx, s) {
      var pts = s.points || [];
      if (pts.length < 3) return;
      var t = s.t || 0, D = 0.6;
      var a = clamp(1 - t / D, 0, 1);
      if (a <= 0) return;
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      var fill = s.captured ? P.capture : '#fff1c8';
      var edge = s.captured ? P.captureLight : '#ffffff';
      ctx.globalAlpha = 0.45 * a;
      ctx.fillStyle = fill; ctx.fill();
      ctx.globalAlpha = a;
      ctx.strokeStyle = P.outline; ctx.lineWidth = 10; ctx.stroke();
      ctx.strokeStyle = edge; ctx.lineWidth = s.captured ? 7 : 5; ctx.stroke();
      ctx.restore();
    },

    // ----- 繩子被切斷(約 0.5 秒) -----
    drawRopeCut: function (ctx, s) {
      var t = s.t || 0, D = 0.5;
      var p = clamp(t / D, 0, 1);
      if (p >= 1) return;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.globalAlpha = 1 - p;
      ctx.lineCap = 'round';
      var r0 = 6 + p * 22, r1 = 14 + p * 30;
      for (var i = 0; i < 6; i++) {
        var a = i * Math.PI / 3 + 0.3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
        ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.strokeStyle = P.outline; ctx.lineWidth = 6; ctx.stroke();
        ctx.strokeStyle = i % 2 ? '#ffffff' : P.danger; ctx.lineWidth = 3; ctx.stroke();
      }
      // 兩段斷繩頭往外飛
      for (var k = -1; k <= 1; k += 2) {
        var ox = k * (4 + p * 16);
        ctx.beginPath();
        ctx.moveTo(ox, -4 - p * 6); ctx.lineTo(ox + k * 3, 4 + p * 6);
        ctx.strokeStyle = P.outline; ctx.lineWidth = 8; ctx.stroke();
        ctx.strokeStyle = P.rope; ctx.lineWidth = 4; ctx.stroke();
      }
      crossMark(ctx, 0, 0, 7, P.danger);
      ctx.restore();
    },

    // ----- 野生魔物(90×90) -----
    drawWildMonster: function (ctx, s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      var sp = s.species || 'fire';
      var dir = s.dir === -1 ? -1 : 1;
      ellipse(ctx, 0, 30, 26, 6); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
      if (s.casting) {
        var pulse = 0.5 + 0.5 * Math.sin(now() * 18);
        circle(ctx, 0, 2, 39);
        ctx.fillStyle = P[sp]; ctx.globalAlpha = 0.15 + 0.15 * pulse; ctx.fill();
        ctx.globalAlpha = 1;
        ctx.setLineDash([7, 5]);
        ctx.strokeStyle = P[sp + 'Light']; ctx.lineWidth = 3; ctx.stroke();
        ctx.setLineDash([]);
      }
      creature(ctx, sp, {
        dir: dir, white: !!s.hit,
        eye: s.casting ? 'angry' : 'n', mouth: !!s.casting
      });
      // 血條(y 34~41), 30% 處刻度 = 殘血門檻
      var maxHp = s.maxHp || 1;
      var ratio = clamp((s.hp || 0) / maxHp, 0, 1);
      rr(ctx, -29, 33, 58, 9, 3); fillStroke(ctx, '#1a1420', P.outline, 2);
      if (ratio > 0) {
        rr(ctx, -27, 35, 54 * ratio, 5, 2);
        ctx.fillStyle = s.weak ? P.capture : '#e8e0d0'; ctx.fill();
      }
      ctx.beginPath(); ctx.moveTo(-27 + 54 * 0.3, 34); ctx.lineTo(-27 + 54 * 0.3, 41);
      ctx.strokeStyle = s.weak ? P.outline : '#6a6070'; ctx.lineWidth = 2; ctx.stroke();
      // 捕捉記號(殘血)
      if (s.weak) {
        circle(ctx, 0, -35, 9);
        ctx.fillStyle = 'rgba(20,13,28,0.7)'; ctx.fill();
        lassoIcon(ctx, -1, -36, 5.5, P.capture, 3);
      }
      ctx.restore();
    },

    // ----- 魔物技能 -----
    drawHazard: function (ctx, s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      var kind = s.kind, t = s.t || 0, warn = s.phase === 'warn';
      var r = s.radius || 0;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (kind === 'waterball') {
        var ang = s.angle || 0;
        var cx = Math.cos(ang), cy = Math.sin(ang);
        for (var i = 3; i >= 1; i--) {
          circle(ctx, -cx * i * 11, -cy * i * 11, 12 - i * 2.5);
          ctx.fillStyle = P.waterLight; ctx.globalAlpha = 0.45 - i * 0.1; ctx.fill();
        }
        ctx.globalAlpha = 1;
        circle(ctx, 0, 0, 10.5); fillStroke(ctx, P.water, P.outline, 3);
        circle(ctx, 0, 0, 12); ctx.strokeStyle = P.waterLight; ctx.lineWidth = 1; ctx.stroke();
        ellipse(ctx, -3, -4, 4, 2.5, -0.6); ctx.fillStyle = '#ffffff'; ctx.fill();
      } else if (kind === 'quake') {
        var outer = Math.max(r, 0.1), inner = Math.max(0, r - 30);
        ctx.beginPath();
        ctx.arc(0, 0, outer, 0, Math.PI * 2);
        if (inner > 0) ctx.arc(0, 0, inner, 0, Math.PI * 2, true);
        ctx.fillStyle = P.stone; ctx.globalAlpha = warn ? 0.2 : 0.55; ctx.fill('evenodd');
        ctx.globalAlpha = 1;
        circle(ctx, 0, 0, Math.max(0.1, outer - 2));
        ctx.strokeStyle = P.outline; ctx.lineWidth = 6; ctx.stroke();
        ctx.strokeStyle = P.stoneLight; ctx.lineWidth = 3;
        if (warn) ctx.setLineDash([10, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
        if (inner > 2) {
          circle(ctx, 0, 0, inner + 1);
          ctx.strokeStyle = P.stoneLight; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.7; ctx.stroke();
          ctx.globalAlpha = 1;
        }
        // 碎石
        var nRock = Math.max(4, Math.floor(outer / 14));
        for (var k = 0; k < nRock; k++) {
          var a2 = k * Math.PI * 2 / nRock;
          var rad = Math.max(0, outer - 15);
          rr(ctx, Math.cos(a2) * rad - 3, Math.sin(a2) * rad - 3, 6, 6, 1.5);
          fillStroke(ctx, '#d6c8e8', P.outline, 1.5);
        }
      } else {
        // firering / thunder: 預警 = 虛線框 + 由內長大的填色, 填滿 = 生效
        var isFire = kind === 'firering';
        var col = isFire ? P.fire : P.thunder;
        var light = isFire ? P.fireLight : P.thunderLight;
        if (!r) r = isFire ? 120 : 70;
        if (warn) {
          var p = clamp(t / (WARN_DUR[kind] || 0.5), 0, 1);
          circle(ctx, 0, 0, r);
          ctx.fillStyle = col; ctx.globalAlpha = 0.1; ctx.fill();
          circle(ctx, 0, 0, r * p);
          ctx.globalAlpha = 0.35; ctx.fill();
          ctx.globalAlpha = 1;
          circle(ctx, 0, 0, r - 1.5);
          ctx.strokeStyle = P.outline; ctx.lineWidth = 6; ctx.stroke();
          ctx.setLineDash([12, 8]);
          ctx.strokeStyle = light; ctx.lineWidth = 3; ctx.stroke();
          ctx.setLineDash([]);
          if (!isFire) {
            ctx.beginPath();
            ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.moveTo(0, -14); ctx.lineTo(0, 14);
            ctx.strokeStyle = P.outline; ctx.lineWidth = 6; ctx.stroke();
            ctx.strokeStyle = light; ctx.lineWidth = 3; ctx.stroke();
          }
        } else {
          var fl = 0.85 + 0.15 * Math.sin(now() * 30);
          var fade = isFire ? 1 : clamp(1 - t / 0.35, 0.25, 1);
          circle(ctx, 0, 0, r);
          ctx.fillStyle = col; ctx.globalAlpha = 0.5 * fl * fade; ctx.fill();
          ctx.globalAlpha = fade;
          circle(ctx, 0, 0, r - 5);
          ctx.strokeStyle = isFire ? '#ffb03a' : '#ffffff'; ctx.lineWidth = 10; ctx.stroke();
          circle(ctx, 0, 0, r - 11);
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
          if (isFire) {
            // 邊緣火舌(往內長, 外緣不超出判定半徑)
            var n = 16;
            for (var f = 0; f < n; f++) {
              var aa = f * Math.PI * 2 / n + now() * 1.5;
              var h = 10 + 6 * Math.sin(now() * 20 + f);
              ctx.beginPath();
              ctx.moveTo(Math.cos(aa - 0.12) * (r - 2), Math.sin(aa - 0.12) * (r - 2));
              ctx.lineTo(Math.cos(aa) * (r - 2 - h - 8), Math.sin(aa) * (r - 2 - h - 8));
              ctx.lineTo(Math.cos(aa + 0.12) * (r - 2), Math.sin(aa + 0.12) * (r - 2));
              ctx.fillStyle = P.gold; ctx.fill();
            }
          } else {
            // 落雷: 從上方打下的閃電
            ctx.beginPath();
            ctx.moveTo(-6, -r - 90); ctx.lineTo(10, -r - 40); ctx.lineTo(-8, -r); ctx.lineTo(8, -r * 0.4); ctx.lineTo(0, 0);
            ctx.strokeStyle = P.outline; ctx.lineWidth = 12; ctx.stroke();
            ctx.strokeStyle = P.thunderLight; ctx.lineWidth = 7; ctx.stroke();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
          }
        }
      }
      ctx.restore();
    },

    // ----- 牧場底圖 -----
    drawPasture: function (ctx) {
      ctx.save();
      ctx.fillStyle = '#1a1418'; ctx.fillRect(0, 120, 720, 1160);
      // 看台
      function stands(y0) {
        ctx.fillStyle = P.stand; ctx.fillRect(0, y0, 720, 120);
        ctx.fillStyle = P.standRow;
        for (var i = 0; i < 3; i++) ctx.fillRect(0, y0 + 14 + i * 38, 720, 12);
      }
      stands(130); stands(1020);
      // 欄杆(看台與牧場之間)
      function rail(y) {
        ctx.fillStyle = P.rail; ctx.fillRect(0, y, 720, 6);
        for (var x = 20; x < 720; x += 50) { ctx.fillRect(x, y - 4, 6, 14); }
      }
      rail(256); rail(1008);
      // 左右樹籬
      ctx.fillStyle = '#152018';
      ctx.fillRect(0, 262, 60, 746); ctx.fillRect(660, 262, 60, 746);
      ctx.fillStyle = '#1d2c20';
      for (var yy = 280; yy < 1000; yy += 40) {
        circle(ctx, 30, yy, 16); ctx.fill();
        circle(ctx, 690, yy + 20, 16); ctx.fill();
      }
      // 草地
      ctx.fillStyle = P.grass; ctx.fillRect(60, 270, 600, 730);
      ctx.fillStyle = P.grassStripe;
      for (var sx = 60; sx < 660; sx += 120) ctx.fillRect(sx, 270, 60, 730);
      // 舞台區(上 270~420, 下 850~1000)
      function stage(y0, edgeY) {
        ctx.fillStyle = P.stage; ctx.fillRect(60, y0, 600, 150);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (var x = 60; x <= 660; x += 40) { ctx.moveTo(x, y0); ctx.lineTo(x, y0 + 150); }
        ctx.stroke();
        // 舞台邊界線(畫在區內, 外緣 = 判定邊界)
        ctx.fillStyle = P.stageLine;
        ctx.fillRect(60, edgeY === y0 ? y0 : edgeY - 4, 600, 4);
        for (var fx = 90; fx < 660; fx += 60) {
          circle(ctx, fx, edgeY === y0 ? y0 + 12 : edgeY - 12, 4);
          ctx.fillStyle = '#ffe9a0'; ctx.fill();
        }
        ctx.globalAlpha = 0.45;
        text(ctx, '舞台', 76, edgeY === y0 ? y0 + 34 : edgeY - 34, 20, '#f0d8b0', 'left', 'bold', 0);
        ctx.globalAlpha = 1;
      }
      stage(270, 420);
      stage(850, 850);
      // 水池
      circle(ctx, 360, 635, 110); ctx.fillStyle = P.pond; ctx.fill();
      circle(ctx, 360, 635, 107); ctx.strokeStyle = P.pondRim; ctx.lineWidth = 6; ctx.stroke();
      ctx.strokeStyle = 'rgba(155,196,224,0.35)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      var tt = now() * 0.6;
      for (var k = 0; k < 3; k++) {
        var rad = ((tt + k / 3) % 1) * 80 + 10;
        ctx.globalAlpha = 1 - rad / 95;
        circle(ctx, 360, 635, rad); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // 下方空地
      ctx.fillStyle = '#120e12'; ctx.fillRect(0, 1140, 720, 140);
      ctx.restore();
    },

    // ----- 牧場魔物(90×90) -----
    drawShowMonster: function (ctx, s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      var sp = s.species || 'fire';
      var dir = s.dir === -1 ? -1 : 1;
      var mode = s.mode || 'roam';
      var rage = clamp(s.rage || 0, 0, 100);
      var t = now();
      var loose = mode === 'charge' || mode === 'loose' || mode === 'dazed';
      if (s.inStage) {
        ellipse(ctx, 0, 30, 34, 9); ctx.fillStyle = 'rgba(255,233,160,0.35)'; ctx.fill();
      }
      ellipse(ctx, 0, 30, 24, 6); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
      // 失控: 紅色鋸齒外圈(全場唯一的鋸齒 = 危險)
      if (loose) {
        var fl = mode === 'dazed' ? 0.45 : (Math.floor(t * 8) % 2 ? 1 : 0.65);
        ctx.beginPath();
        var n = 16;
        for (var i = 0; i <= n * 2; i++) {
          var a = i * Math.PI / n + (mode === 'dazed' ? 0 : t * 1.5);
          var rad = i % 2 ? 34 : 41;
          var px = Math.cos(a) * rad, py = 3 + Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.globalAlpha = fl * 0.2; ctx.fillStyle = P.danger; ctx.fill();
        ctx.globalAlpha = fl;
        ctx.strokeStyle = P.danger; ctx.lineWidth = 3; ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // 被點燃 / 被澆熄: 長在本體外緣的光暈
      if (s.fx === 'ignited') {
        circle(ctx, 0, 4, 33); ctx.fillStyle = 'rgba(255,140,40,0.3)'; ctx.fill();
        ctx.strokeStyle = '#ffb03a'; ctx.lineWidth = 3; ctx.stroke();
      } else if (s.fx === 'doused') {
        circle(ctx, 0, 4, 33); ctx.fillStyle = 'rgba(90,170,255,0.3)'; ctx.fill();
        ctx.strokeStyle = P.waterLight; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.stroke();
        ctx.setLineDash([]);
      }
      // 表演中: 放射光
      if (s.performing) {
        ctx.lineCap = 'round';
        for (var k = 0; k < 10; k++) {
          var ra = k * Math.PI / 5 + 0.3;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ra) * 31, 4 + Math.sin(ra) * 31);
          ctx.lineTo(Math.cos(ra) * 38, 4 + Math.sin(ra) * 38);
          ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = 4; ctx.stroke();
        }
      }
      // 本體
      ctx.save();
      ctx.translate(0, 4);
      var eyeMode = 'n';
      if (mode === 'flee') eyeMode = 'scared';
      else if (mode === 'charge' || mode === 'loose') eyeMode = 'angry';
      else if (mode === 'dazed') eyeMode = 'dizzy';
      else if (s.performing) eyeMode = 'angry';
      if (mode === 'pushed') ctx.scale(1.04, 0.92);
      if (mode === 'charge') ctx.translate(dir * 2, 0);
      creature(ctx, sp, { dir: dir, eye: eyeMode, mouth: s.performing || mode === 'loose' || mode === 'charge' });
      ctx.restore();
      // 模式小記號
      if (mode === 'flee') {
        ctx.beginPath();
        ctx.moveTo(-dir * 24, -22);
        ctx.quadraticCurveTo(-dir * 29, -14, -dir * 24, -12);
        ctx.quadraticCurveTo(-dir * 19, -14, -dir * 24, -22);
        fillStroke(ctx, P.waterLight, P.outline, 1.5);
      } else if (mode === 'pushed') {
        for (var m = 0; m < 3; m++) {
          circle(ctx, -dir * (30 + m * 4), 22 - m * 7, 4 - m);
          fillStroke(ctx, '#d8d0c4', P.outline, 1.5);
        }
      } else if (mode === 'dazed') {
        for (var d = 0; d < 3; d++) {
          var da = t * 5 + d * Math.PI * 2 / 3;
          starPath(ctx, Math.cos(da) * 18, -24 + Math.sin(da) * 5, 5);
          fillStroke(ctx, P.gold, P.outline, 1.5);
        }
      } else if (mode === 'charge' || mode === 'loose') {
        for (var q = -1; q <= 1; q += 2) {
          circle(ctx, q * 12, -28 - (t * 20 % 4), 3.5);
          ctx.fillStyle = 'rgba(240,240,240,0.7)'; ctx.fill();
        }
      }
      if (s.fx === 'ignited') {
        for (var g = -1; g <= 1; g++) {
          var fh = 9 + 3 * Math.sin(t * 20 + g);
          ctx.beginPath();
          ctx.moveTo(g * 12 - 4, -20);
          ctx.quadraticCurveTo(g * 12 - 3, -20 - fh * 0.6, g * 12, -20 - fh);
          ctx.quadraticCurveTo(g * 12 + 3, -20 - fh * 0.6, g * 12 + 4, -20);
          ctx.closePath();
          fillStroke(ctx, '#ffb03a', P.outline, 1.5);
        }
      } else if (s.fx === 'doused') {
        for (var w = -1; w <= 1; w++) {
          var dy = -24 + ((t * 40 + w * 5) % 14);
          ctx.beginPath();
          ctx.moveTo(w * 13, dy - 6);
          ctx.quadraticCurveTo(w * 13 + 4, dy + 1, w * 13, dy + 3);
          ctx.quadraticCurveTo(w * 13 - 4, dy + 1, w * 13, dy - 6);
          fillStroke(ctx, P.waterLight, P.outline, 1.5);
        }
      }
      // 怒氣條(y -44 ~ -36), 50 處刻度 = 表演門檻
      var bw = 64;
      rr(ctx, -bw / 2, -43, bw, 8, 3); fillStroke(ctx, '#1a1420', P.outline, 2);
      var rc = rage >= 85 ? P.rageHigh : (rage >= 50 ? P.rageMid : P.rageLow);
      var barA = 1;
      if (loose || rage >= 100) barA = Math.floor(t * 8) % 2 ? 1 : 0.55;
      else if (rage >= 85) barA = 0.75 + 0.25 * Math.sin(t * 14);
      if (rage > 0) {
        ctx.globalAlpha = barA;
        rr(ctx, -bw / 2 + 2, -41, (bw - 4) * rage / 100, 4, 2);
        ctx.fillStyle = rc; ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(0, -34);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    },

    // ----- 吠叫範圍(約 0.4 秒) -----
    drawBarkWave: function (ctx, s) {
      var t = s.t || 0, D = 0.4;
      var p = clamp(t / D, 0, 1);
      if (p >= 1) return;
      var R = s.radius || 180;
      ctx.save();
      ctx.translate(s.x, s.y);
      // 範圍邊界(外緣 = 吠叫半徑)
      circle(ctx, 0, 0, R - 1.5);
      ctx.globalAlpha = 0.6 * (1 - p);
      ctx.fillStyle = 'rgba(255,248,224,0.08)'; ctx.fill();
      ctx.setLineDash([10, 8]);
      ctx.strokeStyle = '#fff8e0'; ctx.lineWidth = 3; ctx.stroke();
      ctx.setLineDash([]);
      // 往外擴的斷弧(聲波)
      ctx.lineCap = 'round';
      for (var i = 0; i < 3; i++) {
        var rp = clamp(p * 1.2 - i * 0.12, 0, 1);
        if (rp <= 0) continue;
        var rad = 22 + (R - 26) * rp;
        ctx.globalAlpha = (1 - rp) * 0.9 + 0.1;
        for (var k = 0; k < 6; k++) {
          var a = k * Math.PI / 3 + i * 0.25;
          ctx.beginPath(); ctx.arc(0, 0, rad, a, a + 0.7);
          ctx.strokeStyle = P.outline; ctx.lineWidth = 7; ctx.stroke();
          ctx.strokeStyle = '#fff8e0'; ctx.lineWidth = 3.5; ctx.stroke();
        }
      }
      ctx.restore();
    },

    // ----- 觀眾(60×90) -----
    drawVisitor: function (ctx, s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      var mode = s.mode || 'watch';
      var seat = s.seat || 0;
      // 座椅
      rr(ctx, -24, 4, 48, 30, 6); fillStroke(ctx, '#3a2a2e', P.outline, 2);
      rr(ctx, -27, 26, 54, 14, 4); fillStroke(ctx, '#5a4245', P.outline, 2);
      if (mode === 'watch') {
        var bob = Math.sin(now() * 3 + seat) * 1.5;
        ctx.translate(0, bob);
        ctx.beginPath(); ctx.moveTo(-12, 4); ctx.lineTo(-17, 16); ctx.moveTo(12, 4); ctx.lineTo(17, 16);
        ctx.strokeStyle = P.outline; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke();
        ctx.strokeStyle = P.skin; ctx.lineWidth = 3; ctx.stroke();
        rr(ctx, -13, -6, 26, 32, 8); fillStroke(ctx, SHIRTS[seat % 6], P.outline, 2.5);
        circle(ctx, 0, -18, 11); fillStroke(ctx, P.skin, P.outline, 2.5);
        ctx.fillStyle = P.outline;
        circle(ctx, -4, -19, 1.8); ctx.fill();
        circle(ctx, 4, -19, 1.8); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -15, 4, 0.2, Math.PI - 0.2);
        ctx.lineWidth = 1.8; ctx.stroke();
      } else if (mode === 'scared') {
        ctx.translate(0, -6);
        ctx.beginPath(); ctx.moveTo(-11, -2); ctx.lineTo(-20, -28); ctx.moveTo(11, -2); ctx.lineTo(20, -28);
        ctx.strokeStyle = P.outline; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke();
        ctx.strokeStyle = '#e8e0f0'; ctx.lineWidth = 3; ctx.stroke();
        rr(ctx, -13, -6, 26, 32, 8); fillStroke(ctx, '#8a8094', P.outline, 2.5);
        circle(ctx, 0, -20, 11); fillStroke(ctx, '#e8e0f0', P.outline, 2.5);
        ctx.fillStyle = P.outline;
        circle(ctx, -4, -22, 2.4); ctx.fill();
        circle(ctx, 4, -22, 2.4); ctx.fill();
        ellipse(ctx, 0, -15, 3, 4); ctx.fill();
        text(ctx, '!', 19, -28, 18, P.danger, 'center', 'bold', 4);
      } else {
        // 空位: 只有椅子, 椅背上畫一條淡橫線
        ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.moveTo(-14, 16); ctx.lineTo(14, 16);
        ctx.strokeStyle = '#6a5458'; ctx.lineWidth = 2; ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    },

    // ----- 標題卡 -----
    drawTitleCard: function (ctx, s) {
      ctx.save();
      var dungeon = s.stage !== 'show';
      ctx.fillStyle = 'rgba(12,10,16,0.96)';
      ctx.fillRect(0, 0, 720, 1280);
      text(ctx, '第 ' + (s.day || 1) + ' 天', 360, 380, 56, P.text);
      text(ctx, dungeon ? '地下城' : '牧場', 360, 470, 84, dungeon ? P.rope : P.capture);
      text(ctx, dungeon ? '拖著繩子繞圈, 收服殘血的魔物' : '把魔物趕上舞台, 別讓牠們失控',
        360, 560, 26, P.textDim, 'center', 'bold', 0);
      // 小插圖
      ctx.save();
      ctx.translate(360, 760);
      if (dungeon) {
        ctx.beginPath(); ctx.arc(0, 0, 90, 0, Math.PI * 2);
        ctx.strokeStyle = P.outline; ctx.lineWidth = 9; ctx.stroke();
        ctx.strokeStyle = P.rope; ctx.lineWidth = 5; ctx.stroke();
        creature(ctx, 'fire', { dir: 1 });
        ctx.translate(0, 90);
        tamerBody(ctx, 6, {});
      } else {
        ellipse(ctx, 0, 34, 110, 18); ctx.fillStyle = 'rgba(255,233,160,0.25)'; ctx.fill();
        ctx.save(); ctx.translate(-70, 0); creature(ctx, 'water', { dir: 1 }); ctx.restore();
        ctx.save(); ctx.translate(0, -6); creature(ctx, 'fire', { dir: 1, eye: 'angry', mouth: true }); ctx.restore();
        ctx.save(); ctx.translate(70, 0); creature(ctx, 'thunder', { dir: -1 }); ctx.restore();
      }
      ctx.restore();
      var blink = 0.55 + 0.45 * Math.sin(now() * 4);
      ctx.globalAlpha = blink;
      text(ctx, '按空白鍵開始', 360, 1000, 34, P.text);
      ctx.restore();
    },

    // ----- 商店項目(600×140) -----
    drawShopItem: function (ctx, s) {
      ctx.save();
      var INFO = {
        longRope: ['長繩', '繩長上限 +250'],
        ropeBag: ['繩袋', '每天捕獸繩 +1'],
        squeeze: ['勒力', '圈住時多扣 1 血'],
        loudBark: ['大嗓門', '吠叫範圍 +40']
      };
      var info = INFO[s.item] || [String(s.item), ''];
      var x0 = s.x - 300, y0 = s.y - 70;
      rr(ctx, x0 + 2, y0 + 2, 596, 136, 16);
      fillStroke(ctx, s.selected ? '#2e2638' : '#1f1a26', s.selected ? P.gold : '#3a3245', s.selected ? 4 : 2);
      if (s.selected) {
        ctx.beginPath();
        ctx.moveTo(x0 + 12, s.y - 14); ctx.lineTo(x0 + 26, s.y); ctx.lineTo(x0 + 12, s.y + 14); ctx.closePath();
        ctx.fillStyle = P.gold; ctx.fill();
      }
      var dim = s.affordable ? 1 : 0.55;
      ctx.globalAlpha = dim;
      // 圖示
      var ix = x0 + 84, iy = s.y;
      circle(ctx, ix, iy, 42); fillStroke(ctx, '#2a2332', '#4a4058', 2);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (s.item === 'longRope') {
        ctx.beginPath();
        ctx.moveTo(ix - 28, iy + 10);
        ctx.bezierCurveTo(ix - 16, iy - 26, ix, iy + 26, ix + 12, iy - 6);
        ctx.quadraticCurveTo(ix + 20, iy - 24, ix + 28, iy - 10);
        ctx.strokeStyle = P.outline; ctx.lineWidth = 9; ctx.stroke();
        ctx.strokeStyle = P.rope; ctx.lineWidth = 5; ctx.stroke();
      } else if (s.item === 'ropeBag') {
        lassoIcon(ctx, ix - 4, iy - 4, 16, P.capture, 5);
      } else if (s.item === 'squeeze') {
        ctx.beginPath(); ctx.arc(ix, iy, 22, 0, Math.PI * 2);
        ctx.strokeStyle = P.outline; ctx.lineWidth = 9; ctx.stroke();
        ctx.strokeStyle = P.rope; ctx.lineWidth = 5; ctx.stroke();
        arrow(ctx, ix - 30, iy - 26, ix - 15, iy - 13, '#ffffff', 4);
        arrow(ctx, ix + 30, iy + 26, ix + 15, iy + 13, '#ffffff', 4);
      } else {
        circle(ctx, ix - 14, iy, 8); fillStroke(ctx, P.tamer, P.outline, 2.5);
        for (var i = 0; i < 3; i++) {
          ctx.beginPath(); ctx.arc(ix - 14, iy, 14 + i * 9, -0.6, 0.6);
          ctx.strokeStyle = P.outline; ctx.lineWidth = 6; ctx.stroke();
          ctx.strokeStyle = '#fff8e0'; ctx.lineWidth = 3; ctx.stroke();
        }
      }
      text(ctx, info[0], x0 + 150, s.y - 22, 34, P.text, 'left');
      text(ctx, info[1], x0 + 150, s.y + 24, 22, P.textDim, 'left', 'bold', 0);
      text(ctx, '已買 ' + (s.level || 0), x0 + 400, s.y - 22, 20, P.textDim, 'center', 'bold', 0);
      ctx.globalAlpha = 1;
      // 價格
      coinIcon(ctx, x0 + 470, s.y + 14, 14);
      text(ctx, String(s.cost), x0 + 572, s.y + 14, 34, s.affordable ? P.gold : P.danger, 'right');
      if (!s.affordable) text(ctx, '金幣不足', x0 + 572, s.y - 26, 18, P.danger, 'right', 'bold', 0);
      ctx.restore();
    },

    // ----- 按鈕(x,y 為左上角) -----
    drawButton: function (ctx, s) {
      ctx.save();
      var w = s.w || 400, h = s.h || 100;
      rr(ctx, s.x + 2, s.y + 2, w - 4, h - 4, 18);
      if (s.selected) {
        fillStroke(ctx, P.gold, '#ffffff', 4);
        text(ctx, s.label || '', s.x + w / 2, s.y + h / 2, 38, P.outline, 'center', 'bold', 0);
      } else {
        fillStroke(ctx, '#2a2332', '#4a4058', 3);
        text(ctx, s.label || '', s.x + w / 2, s.y + h / 2, 34, P.textDim, 'center', 'bold', 0);
      }
      ctx.restore();
    },

    // ----- 飄字(約 1 秒) -----
    drawFloatText: function (ctx, s) {
      var t = s.t || 0, D = 1.0;
      if (t >= D) return;
      ctx.save();
      var kind = s.kind || 'gold';
      var col = { gold: P.gold, repUp: P.repUp, repDown: P.danger, capture: P.capture }[kind] || P.text;
      var size = kind === 'capture' ? 36 : 26;
      var rise = kind === 'repDown' ? 10 * t : 40 * t;
      var a = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
      var pop = kind === 'capture' ? 1 + 0.25 * Math.max(0, 1 - t / 0.15) : 1;
      ctx.globalAlpha = clamp(a, 0, 1);
      ctx.translate(s.x, s.y - rise);
      ctx.scale(pop, pop);
      var str = String(s.text || '');
      ctx.font = 'bold ' + size + 'px ' + FONT;
      var w = ctx.measureText(str).width || str.length * size * 0.6;
      var ix = -w / 2 - size * 0.55;
      if (kind === 'gold') coinIcon(ctx, ix, 0, size * 0.36);
      else if (kind === 'repUp') repIcon(ctx, ix, 0, size * 0.42, P.repUp);
      else if (kind === 'repDown') repIcon(ctx, ix, 0, size * 0.42, P.danger);
      else if (kind === 'capture') lassoIcon(ctx, ix, -2, size * 0.26, P.capture, 3);
      text(ctx, str, 0, 0, size, col);
      ctx.restore();
    },

    // ----- 結算 -----
    drawResultPanel: function (ctx, s) {
      ctx.save();
      ctx.fillStyle = 'rgba(12,10,16,0.97)';
      ctx.fillRect(0, 0, 720, 1280);
      text(ctx, '三天結算', 360, 170, 56, P.text);
      var stars = clamp(s.stars || 0, 0, 3);
      for (var i = 0; i < 3; i++) {
        starPath(ctx, 200 + i * 160, 340, 62);
        fillStroke(ctx, i < stars ? P.gold : '#2a2332', i < stars ? '#ffffff' : '#4a4058', 4);
      }
      // 數值列
      function row(y, label, val, icon) {
        rr(ctx, 100, y - 40, 520, 80, 14); fillStroke(ctx, '#1f1a26', '#3a3245', 2);
        if (icon === 'rep') repIcon(ctx, 150, y, 20, P.repUp); else coinIcon(ctx, 150, y, 18);
        text(ctx, label, 190, y, 30, P.textDim, 'left', 'bold', 0);
        text(ctx, String(val), 580, y, 44, icon === 'rep' ? P.repUp : P.gold, 'right');
      }
      row(520, '總名聲', s.rep || 0, 'rep');
      row(620, '累計金幣', s.goldEarned || 0, 'gold');
      // 牧場魔物
      text(ctx, '牧場魔物', 360, 730, 30, P.textDim, 'center', 'bold', 0);
      var herd = s.herd || [];
      var cnt = { fire: 0, water: 0, thunder: 0, stone: 0 };
      for (var h = 0; h < herd.length; h++) if (cnt[herd[h]] !== undefined) cnt[herd[h]]++;
      for (var k = 0; k < 4; k++) {
        var sp = SPECIES_ORDER[k];
        var cx = 135 + k * 150;
        ctx.save();
        ctx.translate(cx, 830);
        if (!cnt[sp]) ctx.globalAlpha = 0.35;
        creature(ctx, sp, { dir: 1 });
        ctx.restore();
        text(ctx, '×' + cnt[sp], cx, 900, 32, cnt[sp] ? P.text : P.textDim);
      }
      var blink = 0.55 + 0.45 * Math.sin(now() * 4);
      ctx.globalAlpha = blink;
      text(ctx, '按空白鍵重來', 360, 1100, 34, P.text);
      ctx.restore();
    },

    // ----- HUD(y 0~120) -----
    drawHud: function (ctx, s) {
      var phase = s.phase;
      if (phase !== 'dungeon' && phase !== 'show' && phase !== 'shop') return;
      ctx.save();
      ctx.fillStyle = P.hudBg; ctx.fillRect(0, 0, 720, 120);
      ctx.fillStyle = P.hudLine; ctx.fillRect(0, 118, 720, 2);
      var label = phase === 'dungeon' ? '地下城' : (phase === 'show' ? '牧場' : '商店');
      // 第 1 列(y 6~60): 天數 / 階段 | 剩餘秒數 | 金幣 / 名聲
      text(ctx, '第 ' + (s.day || 1) + ' 天', 20, 20, 18, P.textDim, 'left', 'bold', 0);
      text(ctx, label, 20, 46, 28, P.text, 'left', 'bold', 0);
      coinIcon(ctx, 560, 20, 11);
      text(ctx, String(s.gold || 0), 700, 20, 24, P.gold, 'right');
      repIcon(ctx, 560, 48, 12, P.repUp);
      text(ctx, String(s.rep || 0), 700, 48, 24, P.repUp, 'right');
      if (phase === 'dungeon' || phase === 'show') {
        var tl = Math.max(0, Math.ceil(s.timeLeft || 0));
        text(ctx, String(tl), 360, 34, 46, tl <= 10 ? P.danger : P.text);
      }
      // 第 2 列(y 70~94)
      if (phase === 'dungeon') {
        var mh = s.maxHearts || 5;
        for (var i = 0; i < mh; i++) {
          heartPath(ctx, 30 + i * 28, 82, 10);
          fillStroke(ctx, i < (s.hearts || 0) ? P.danger : '#2a2332', P.outline, 2);
        }
        var rm = s.ropeMax || 3;
        for (var r = 0; r < rm; r++) {
          ctx.globalAlpha = r < (s.ropes || 0) ? 1 : 0.25;
          lassoIcon(ctx, 186 + r * 26, 80, 7, P.capture, 3);
        }
        ctx.globalAlpha = 1;
        var bx0 = 186 + rm * 26 + 24;
        text(ctx, '繩長', bx0, 82, 18, P.textDim, 'left', 'bold', 0);
        var ratio = clamp((s.ropeLen || 0) / (s.ropeLenMax || 1), 0, 1);
        rr(ctx, bx0 + 42, 75, 120, 14, 6); fillStroke(ctx, '#1a1420', P.outline, 2);
        if (ratio > 0) { rr(ctx, bx0 + 45, 78, 114 * ratio, 8, 3); ctx.fillStyle = P.rope; ctx.fill(); }
      } else if (phase === 'show') {
        ctx.globalAlpha = s.barkReady ? 1 : 0.4;
        keycap(ctx, 48, 80, 60, 26, '空白', 15);
        text(ctx, s.barkReady ? '吠叫' : '冷卻', 86, 82, 20, s.barkReady ? P.text : P.textDim, 'left', 'bold', 0);
        ctx.globalAlpha = 1;
      } else {
        text(ctx, '↑↓ 選擇   空白 確定', 360, 1262, 22, P.textDim, 'center', 'bold', 0);
      }
      // 牧場魔物數(第 2 列右側: 色點 + 數量)
      if (phase !== 'shop') {
        var herd = s.herd || [];
        var cnt = { fire: 0, water: 0, thunder: 0, stone: 0 };
        for (var h = 0; h < herd.length; h++) if (cnt[herd[h]] !== undefined) cnt[herd[h]]++;
        var list = [];
        for (var k = 0; k < 4; k++) if (cnt[SPECIES_ORDER[k]]) list.push(SPECIES_ORDER[k]);
        var startX = 700 - list.length * 46;
        for (var m = 0; m < list.length; m++) {
          var px = startX + m * 46 + 9;
          circle(ctx, px, 82, 8); fillStroke(ctx, P[list[m]], P.outline, 2);
          text(ctx, String(cnt[list[m]]), px + 12, 82, 19, P.text, 'left', 'bold', 3);
        }
      }
      // 第 3 列(y 97~117): 訊息(牧場時為紅底警示)
      if (s.message) {
        var msg = String(s.message);
        ctx.font = 'bold 19px ' + FONT;
        var mw = Math.min(700, (ctx.measureText(msg).width || msg.length * 19) + 28);
        rr(ctx, 360 - mw / 2, 97, mw, 20, 8);
        fillStroke(ctx, phase === 'show' ? 'rgba(150,20,44,0.95)' : '#2a2332', phase === 'show' ? P.danger : P.hudLine, 1.5);
        text(ctx, msg, 360, 107, 19, P.text, 'center', 'bold', 0);
      }
      ctx.restore();
    },

    // ----- 說明頁示意圖(只畫在 x,y,w,h 框內) -----
    drawGuidePage: function (ctx, s) {
      var VW = 600, VH = 640;
      var w = s.w || VW, h = s.h || VH;
      var sc = Math.min(w / VW, h / VH);
      ctx.save();
      ctx.beginPath(); ctx.rect(s.x, s.y, w, h); ctx.clip();
      ctx.translate(s.x + (w - VW * sc) / 2, s.y + (h - VH * sc) / 2);
      ctx.scale(sc, sc);
      var fn = GUIDE[s.page || 0];
      if (fn) fn(ctx);
      ctx.restore();
    }
  };

  // ---------- 說明頁(虛擬 600×640) ----------
  function floorPatch(ctx, x0, y0, cols, rows, zone, extra) {
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var k = extra && extra(c, r);
        Art.drawTile(ctx, { x: x0 + c * 60 + 30, y: y0 + r * 60 + 30, kind: k || 'floor', zone: zone, nest: false });
      }
    }
  }
  function loopPoints(cx, cy, R, a0, sweep, tailOut) {
    var pts = [];
    var step = 12 / R;
    for (var a = 0; a <= sweep; a += step) {
      var over = Math.max(0, a - (sweep - 0.7));
      var rad = R + over * tailOut;
      pts.push({ x: cx + Math.cos(a0 + a) * rad, y: cy + Math.sin(a0 + a) * rad });
    }
    return pts;
  }
  function label(ctx, str, x, y, color, size) {
    text(ctx, str, x, y, size || 24, color || P.text, 'center', 'bold');
  }
  function panelBg(ctx, x, y, w, h) {
    rr(ctx, x, y, w, h, 14);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
  }

  var GUIDE = [
    // 第 1 頁 圍圈
    function (ctx) {
      floorPatch(ctx, 0, 0, 10, 11, 'lava');
      var lead = [];
      for (var i = 0; i <= 10; i++) lead.push({ x: 70 + i * 13, y: 590 - i * 17 });
      var cx = 310, cy = 290, R = 140;
      // 繩尾從 a0+0.6 方向進來, 繞一圈後在 a0+0.6 附近往外穿過進場那段 → 頭尾交叉
      var le = lead[lead.length - 1];
      var a0 = Math.atan2(le.y - cy, le.x - cx) - 0.6;
      var loop = loopPoints(cx, cy, R, a0, Math.PI * 2 + 0.75, 70);
      var bridge = [];
      for (var b = 1; b < 8; b++) {
        var f = b / 8;
        bridge.push({ x: le.x + (loop[0].x - le.x) * f, y: le.y + (loop[0].y - le.y) * f });
      }
      var pts = lead.concat(bridge, loop);
      Art.drawLoopFlash(ctx, { points: loop, captured: false, t: 0.25 });
      Art.drawRope(ctx, { points: pts });
      Art.drawWildMonster(ctx, { x: cx, y: cy, species: 'fire', hp: 7, maxHp: 10, hit: true, weak: false, casting: false, dir: 1 });
      // 掉的那一截血
      rr(ctx, cx - 27 + 54 * 0.7, cy + 35, 54 * 0.3, 5, 2);
      ctx.fillStyle = P.danger; ctx.fill();
      label(ctx, '−3', cx + 50, cy + 40, P.danger, 22);
      var end = pts[pts.length - 1];
      Art.drawTamer(ctx, { x: end.x, y: end.y, facing: 5, stunned: false, blink: false, barking: false });
      label(ctx, '你', end.x - 34, end.y - 26, P.text, 22);
      // 交叉處標記
      arrowKeys(ctx, 520, 540, 34);
    },
    // 第 2 頁 收服
    function (ctx) {
      floorPatch(ctx, 0, 0, 10, 11, 'pond');
      ctx.fillStyle = 'rgba(12,10,16,0.35)'; ctx.fillRect(0, 0, 600, 640);
      ctx.fillStyle = P.hudLine; ctx.fillRect(298, 20, 4, 600);
      // 左: 殘血 → 收服
      var L = loopPoints(150, 300, 105, 0, Math.PI * 2, 0);
      Art.drawLoopFlash(ctx, { points: L, captured: true, t: 0.1 });
      ctx.save(); ctx.globalAlpha = 0.65;
      Art.drawWildMonster(ctx, { x: 150, y: 300, species: 'water', hp: 2, maxHp: 7, hit: false, weak: true, casting: false, dir: 1 });
      ctx.restore();
      checkMark(ctx, 150, 470, 26, P.capture);
      label(ctx, '收服', 150, 530, P.capture, 30);
      // 右: 滿血 → 只勒傷
      var Rp = loopPoints(450, 300, 105, 0, Math.PI * 2, 0);
      Art.drawLoopFlash(ctx, { points: Rp, captured: false, t: 0.1 });
      Art.drawWildMonster(ctx, { x: 450, y: 300, species: 'thunder', hp: 7, maxHp: 10, hit: true, weak: false, casting: false, dir: -1 });
      rr(ctx, 450 - 27 + 54 * 0.7, 335, 54 * 0.3, 5, 2);
      ctx.fillStyle = P.danger; ctx.fill();
      crossMark(ctx, 450, 470, 20, P.danger);
      label(ctx, '只勒傷', 450, 530, P.text, 30);
      label(ctx, '殘血', 150, 120, P.capture, 24);
      label(ctx, '滿血', 450, 120, P.text, 24);
    },
    // 第 3 頁 上舞台
    function (ctx) {
      ctx.fillStyle = P.stand; ctx.fillRect(0, 0, 600, 110);
      ctx.fillStyle = P.standRow; ctx.fillRect(0, 20, 600, 12); ctx.fillRect(0, 60, 600, 12);
      ctx.fillStyle = P.rail; ctx.fillRect(0, 108, 600, 6);
      for (var v = 0; v < 5; v++) Art.drawVisitor(ctx, { x: 60 + v * 120, y: 55, seat: v, mode: 'watch' });
      ctx.fillStyle = P.grass; ctx.fillRect(0, 114, 600, 526);
      ctx.fillStyle = P.stage; ctx.fillRect(0, 114, 600, 150);
      ctx.fillStyle = P.stageLine; ctx.fillRect(0, 260, 600, 4);
      for (var fx = 30; fx < 600; fx += 60) { circle(ctx, fx, 252, 4); ctx.fillStyle = '#ffe9a0'; ctx.fill(); }
      label(ctx, '舞台區', 60, 140, '#f0d8b0', 20);
      // 舞台上表演的魔物
      ctx.save(); ctx.beginPath(); ctx.rect(0, 114, 600, 526); ctx.clip();
      Art.drawHazard(ctx, { x: 200, y: 190, kind: 'firering', phase: 'active', radius: 110, t: 0.1, angle: 0 });
      ctx.restore();
      Art.drawShowMonster(ctx, { x: 200, y: 190, species: 'fire', rage: 80, mode: 'roam', inStage: true, performing: true, fx: 'none', dir: 1 });
      arrow(ctx, 244, 146, 244, 122, P.rageMid, 5);
      Art.drawFloatText(ctx, { x: 330, y: 160, text: '+5', kind: 'gold', t: 0.2 });
      // 草地上沒動作的魔物
      Art.drawShowMonster(ctx, { x: 110, y: 520, species: 'water', rage: 12, mode: 'roam', inStage: false, performing: false, fx: 'none', dir: 1 });
      // 被逼往舞台的魔物 + 馴獸師在背後
      Art.drawShowMonster(ctx, { x: 450, y: 380, species: 'thunder', rage: 30, mode: 'flee', inStage: false, performing: false, fx: 'none', dir: -1 });
      Art.drawTamer(ctx, { x: 470, y: 520, facing: 0, stunned: false, blink: false, barking: false });
      label(ctx, '你', 510, 548, P.text, 22);
      arrow(ctx, 450, 330, 450, 278, '#ffffff', 7);
      arrowKeys(ctx, 540, 556, 26);
    },
    // 第 4 頁 吠叫
    function (ctx) {
      ctx.fillStyle = P.grass; ctx.fillRect(0, 0, 600, 640);
      ctx.fillStyle = P.grassStripe;
      for (var sx = 0; sx < 600; sx += 120) ctx.fillRect(sx, 0, 60, 640);
      var tx = 280, ty = 330;
      Art.drawBarkWave(ctx, { x: tx, y: ty, radius: 180, t: 0.16 });
      circle(ctx, tx, ty, 178.5); ctx.setLineDash([10, 8]);
      ctx.strokeStyle = 'rgba(255,248,224,0.7)'; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
      Art.drawShowMonster(ctx, { x: 175, y: 250, species: 'fire', rage: 30, mode: 'pushed', inStage: false, performing: false, fx: 'none', dir: 1 });
      Art.drawShowMonster(ctx, { x: 390, y: 410, species: 'stone', rage: 25, mode: 'pushed', inStage: false, performing: false, fx: 'none', dir: -1 });
      arrow(ctx, 140, 215, 80, 150, '#ffffff', 7);
      arrow(ctx, 430, 450, 490, 510, '#ffffff', 7);
      // 範圍外: 沒被推
      Art.drawShowMonster(ctx, { x: 520, y: 100, species: 'water', rage: 20, mode: 'roam', inStage: false, performing: false, fx: 'none', dir: -1 });
      Art.drawTamer(ctx, { x: tx, y: ty, facing: 7, stunned: false, blink: false, barking: true });
      label(ctx, '你', tx, ty + 44, P.text, 22);
      keycap(ctx, 90, 590, 120, 44, '空白', 22);
    },
    // 第 5 頁 拿捏
    function (ctx) {
      // 左: 失控衝進看台
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, 290, 520); ctx.clip();
      ctx.fillStyle = P.grass; ctx.fillRect(0, 0, 290, 520);
      ctx.fillStyle = P.stand; ctx.fillRect(0, 0, 290, 200);
      ctx.fillStyle = P.standRow; ctx.fillRect(0, 30, 290, 12); ctx.fillRect(0, 100, 290, 12);
      ctx.fillStyle = P.rail; ctx.fillRect(0, 196, 290, 6);
      Art.drawVisitor(ctx, { x: 55, y: 110, seat: 0, mode: 'watch' });
      Art.drawVisitor(ctx, { x: 230, y: 110, seat: 1, mode: 'scared' });
      arrow(ctx, 140, 440, 140, 250, P.danger, 6);
      Art.drawShowMonster(ctx, { x: 150, y: 150, species: 'stone', rage: 100, mode: 'loose', inStage: false, performing: false, fx: 'none', dir: 1 });
      crossMark(ctx, 230, 40, 18, P.danger);
      ctx.restore();
      // 右: 水池消氣
      ctx.save();
      ctx.beginPath(); ctx.rect(310, 0, 290, 520); ctx.clip();
      ctx.fillStyle = P.grass; ctx.fillRect(310, 0, 290, 520);
      circle(ctx, 455, 300, 120); ctx.fillStyle = P.pond; ctx.fill();
      circle(ctx, 455, 300, 117); ctx.strokeStyle = P.pondRim; ctx.lineWidth = 6; ctx.stroke();
      Art.drawShowMonster(ctx, { x: 455, y: 300, species: 'fire', rage: 55, mode: 'roam', inStage: false, performing: false, fx: 'none', dir: -1 });
      arrow(ctx, 505, 240, 505, 268, P.waterLight, 5);
      label(ctx, '水池', 455, 450, P.pondRim, 24);
      ctx.restore();
      // 下: 流程
      var chips = [['地下城', P.rope], ['牧場', P.capture], ['商店', P.gold]];
      for (var c = 0; c < 3; c++) {
        var cx = 70 + c * 150;
        rr(ctx, cx - 55, 545, 110, 50, 12);
        fillStroke(ctx, '#1f1a26', chips[c][1], 3);
        text(ctx, chips[c][0], cx, 570, 24, chips[c][1]);
        if (c < 2) arrow(ctx, cx + 60, 570, cx + 88, 570, '#ffffff', 4);
      }
      text(ctx, '×3 天', 470, 570, 24, P.text, 'center');
      starPath(ctx, 555, 568, 22); fillStroke(ctx, P.gold, P.outline, 2.5);
    }
  ];

  window.Art = Art;
})();
