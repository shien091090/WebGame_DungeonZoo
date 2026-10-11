// 幕間連鎖秀 — 美術(Canvas 2D 幾何繪製, 無外部資源)
// 全域物件 window.Art; 每個函式自己 save/restore
(function () {
  'use strict';

  var P = {
    bg: '#15131d',
    panel: '#232033',
    panelHi: '#2f2b45',
    line: '#0d0b14',
    text: '#f1eef8',
    textDim: '#a9a3bf',
    // 種類色(同一隻魔物在地下城本體、預警格、舞台、技能格、卡片全用同色)
    fire: '#ff4f3a',
    water: '#1f78e8',
    thunder: '#d4f03a',
    stone: '#d28cff',
    hero: '#f4f1ea',
    heroVisor: '#24304d',
    danger: '#ff2d55',     // 危險 / 失控 / 扣名聲, 一律配斜線紋
    ready: '#4ade80',      // 達門檻 / 可裝籠 / 成功
    gold: '#ffb627',
    rep: '#ff7ad9',
    rageUp: '#fff1c9',
    rageDown: '#7fb6d9',
    hp: '#ff6b81',
    cursor: '#ffffff',
    floor1: '#363b4f',
    floor2: '#47393f',
    wall: '#6b6880',
    wallTop: '#9591b0',
    stairs: '#d8c79a',
    board: '#5e3f2c',
    boardHi: '#7a5539',
    curtain: '#25366a',
    seat: '#1d1a2a',
    rageTrack: '#14121c',
    rageLow: '#9aa3bd'
  };

  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';
  function font(size, weight) { return (weight || 'bold') + ' ' + size + 'px ' + FONT; }

  var SPECIES = {
    fire:    { name: '火蜥蜴', wait: 15, ignite: 20, gold: 5 },
    water:   { name: '水母',   wait: 10, ignite: 20, gold: 3 },
    thunder: { name: '雷鳥',   wait: 25, ignite: 30, gold: 8 },
    stone:   { name: '石像鬼', wait: 5,  ignite: 10, gold: 6 }
  };
  var SHAPES = {
    fire: [[0, -1], [0, -2], [0, 1], [0, 2], [-1, 0], [-2, 0], [1, 0], [2, 0]],
    thunder: [[-1, -1], [1, -1], [-1, 1], [1, 1], [-2, -2], [2, -2], [-2, 2], [2, 2]],
    water: [[0, 1], [0, 2], [0, 3]],
    stone: [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]
  };
  function spColor(sp) { return P[sp] || '#cccccc'; }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function num(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; }

  // ---------- 基礎工具 ----------
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
  function text(ctx, s, x, y, size, color, align, outline) {
    ctx.font = font(size);
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    if (outline !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(3, size * 0.22);
      ctx.strokeStyle = 'rgba(10,8,16,0.9)';
      ctx.strokeText(String(s), x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(String(s), x, y);
  }
  // 斜線紋 = 危險(字典詞)
  function hatch(ctx, x, y, w, h, color, gap, lw) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw || 3;
    ctx.beginPath();
    for (var d = -h; d < w; d += gap) {
      ctx.moveTo(x + d, y + h);
      ctx.lineTo(x + d + h, y);
    }
    ctx.stroke();
    ctx.restore();
  }
  // 游標 = 白色四角括號(字典詞, 全遊戲共用)
  function brackets(ctx, cx, cy, w, h, len, lw) {
    var ins = lw / 2 + 2; // 含深色襯邊, 不出框
    var x0 = cx - w / 2 + ins, y0 = cy - h / 2 + ins;
    var x1 = cx + w / 2 - ins, y1 = cy + h / 2 - ins;
    ctx.save();
    ctx.lineCap = 'square';
    ctx.lineWidth = lw + 4;
    ctx.strokeStyle = 'rgba(10,8,16,0.85)';
    corners();
    ctx.lineWidth = lw;
    ctx.strokeStyle = P.cursor;
    corners();
    ctx.restore();
    function corners() {
      ctx.beginPath();
      ctx.moveTo(x0, y0 + len); ctx.lineTo(x0, y0); ctx.lineTo(x0 + len, y0);
      ctx.moveTo(x1 - len, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + len);
      ctx.moveTo(x1, y1 - len); ctx.lineTo(x1, y1); ctx.lineTo(x1 - len, y1);
      ctx.moveTo(x0 + len, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y1 - len);
      ctx.stroke();
    }
  }
  function star(ctx, cx, cy, ro, ri, n) {
    ctx.beginPath();
    for (var i = 0; i < n * 2; i++) {
      var r = i % 2 ? ri : ro;
      var a = -Math.PI / 2 + i * Math.PI / n;
      var px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  function heartPath(ctx, cx, cy, s) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.9);
    ctx.bezierCurveTo(cx - s * 1.3, cy, cx - s * 0.9, cy - s * 1.0, cx, cy - s * 0.35);
    ctx.bezierCurveTo(cx + s * 0.9, cy - s * 1.0, cx + s * 1.3, cy, cx, cy + s * 0.9);
    ctx.closePath();
  }
  function coin(ctx, cx, cy, r) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = P.gold; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.18); ctx.strokeStyle = '#7a4a00'; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = '#a86a00'; ctx.lineWidth = Math.max(1, r * 0.14); ctx.stroke();
  }
  function repStar(ctx, cx, cy, r, color) {
    star(ctx, cx, cy, r, r * 0.45, 5);
    ctx.fillStyle = color || P.rep; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.15); ctx.strokeStyle = P.line; ctx.stroke();
  }
  function cageIcon(ctx, cx, cy, s, color) {
    ctx.lineWidth = Math.max(1.5, s * 0.1);
    ctx.strokeStyle = color || '#d9d4ea';
    rr(ctx, cx - s * 0.5, cy - s * 0.4, s, s * 0.85, s * 0.12);
    ctx.stroke();
    ctx.beginPath();
    for (var i = 1; i < 4; i++) {
      var bx = cx - s * 0.5 + i * s / 4;
      ctx.moveTo(bx, cy - s * 0.4); ctx.lineTo(bx, cy + s * 0.45);
    }
    ctx.moveTo(cx - s * 0.18, cy - s * 0.4);
    ctx.quadraticCurveTo(cx, cy - s * 0.7, cx + s * 0.18, cy - s * 0.4);
    ctx.stroke();
  }
  function check(ctx, cx, cy, s, color) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.5, cy); ctx.lineTo(cx - s * 0.12, cy + s * 0.4); ctx.lineTo(cx + s * 0.55, cy - s * 0.42);
    ctx.lineWidth = s * 0.36; ctx.strokeStyle = P.line; ctx.stroke();
    ctx.lineWidth = s * 0.2; ctx.strokeStyle = color || P.ready; ctx.stroke();
  }
  function cross(ctx, cx, cy, s, color, lw) {
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - s, cy - s); ctx.lineTo(cx + s, cy + s);
    ctx.moveTo(cx + s, cy - s); ctx.lineTo(cx - s, cy + s);
    ctx.lineWidth = (lw || s * 0.4) + 3; ctx.strokeStyle = P.line; ctx.stroke();
    ctx.lineWidth = lw || s * 0.4; ctx.strokeStyle = color || P.danger; ctx.stroke();
  }
  function chevrons(ctx, cx, cy, s, up, color) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (var i = 0; i < 2; i++) {
      var yy = cy + (up ? -1 : 1) * (i * s * 0.55) - (up ? -1 : 1) * s * 0.25;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.5, yy + (up ? s * 0.28 : -s * 0.28));
      ctx.lineTo(cx, yy - (up ? s * 0.28 : -s * 0.28));
      ctx.lineTo(cx + s * 0.5, yy + (up ? s * 0.28 : -s * 0.28));
      ctx.lineWidth = s * 0.3 + 3; ctx.strokeStyle = P.line; ctx.stroke();
      ctx.lineWidth = s * 0.3; ctx.strokeStyle = color; ctx.stroke();
    }
  }

  // ---------- 魔物本體(各種類剪影不同; r = 外接半徑) ----------
  function speciesBody(ctx, sp, r, o) {
    o = o || {};
    var col = o.flash ? '#ffffff' : (o.dark ? '#4a3340' : spColor(sp));
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, r * 0.09);
    ctx.strokeStyle = P.line;
    ctx.fillStyle = col;
    if (sp === 'fire') {
      // 三簇火冠 + 圓胖身體 + 尾巴
      ctx.beginPath();
      [-0.42, 0, 0.42].forEach(function (fx, i) {
        var top = i === 1 ? -1 : -0.82;
        ctx.moveTo(r * (fx - 0.2), -r * 0.4);
        ctx.quadraticCurveTo(r * (fx - 0.12), -r * 0.75, r * fx, r * top);
        ctx.quadraticCurveTo(r * (fx + 0.12), -r * 0.75, r * (fx + 0.2), -r * 0.4);
      });
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(r * 0.55, r * 0.35);
      ctx.quadraticCurveTo(r * 1.0, r * 0.5, r * 0.96, r * 0.05);
      ctx.lineWidth = Math.max(3, r * 0.22); ctx.strokeStyle = P.line; ctx.stroke();
      ctx.lineWidth = Math.max(2, r * 0.13); ctx.strokeStyle = col; ctx.stroke();
      ctx.lineWidth = Math.max(2, r * 0.09); ctx.strokeStyle = P.line;
      ctx.beginPath(); ctx.ellipse(0, r * 0.12, r * 0.82, r * 0.68, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,230,160,0.55)';
      ctx.beginPath(); ctx.ellipse(0, r * 0.42, r * 0.45, r * 0.25, 0, 0, Math.PI * 2); ctx.fill();
    } else if (sp === 'water') {
      // 圓頂 + 波浪觸手
      ctx.beginPath();
      ctx.arc(0, -r * 0.05, r * 0.85, Math.PI, 0);
      ctx.quadraticCurveTo(r * 0.85, r * 0.2, r * 0.6, r * 0.2);
      ctx.lineTo(-r * 0.6, r * 0.2);
      ctx.quadraticCurveTo(-r * 0.85, r * 0.2, -r * 0.85, -r * 0.05);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.lineCap = 'round';
      [-0.5, -0.17, 0.17, 0.5].forEach(function (tx) {
        ctx.beginPath();
        ctx.moveTo(r * tx, r * 0.22);
        ctx.quadraticCurveTo(r * (tx - 0.14), r * 0.48, r * tx, r * 0.66);
        ctx.quadraticCurveTo(r * (tx + 0.14), r * 0.82, r * tx, r * 0.96);
        ctx.lineWidth = Math.max(4, r * 0.2); ctx.strokeStyle = P.line; ctx.stroke();
        ctx.lineWidth = Math.max(2, r * 0.11); ctx.strokeStyle = col; ctx.stroke();
      });
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.45, r * 0.18, r * 0.1, -0.6, 0, Math.PI * 2); ctx.fill();
    } else if (sp === 'thunder') {
      // 展翼 + 菱形身 + 鋸齒冠
      ctx.beginPath();
      ctx.moveTo(-r * 0.3, -r * 0.1); ctx.lineTo(-r * 1.0, -r * 0.45); ctx.lineTo(-r * 0.78, r * 0.05); ctx.lineTo(-r * 0.95, r * 0.15); ctx.lineTo(-r * 0.3, r * 0.3);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(r * 0.3, -r * 0.1); ctx.lineTo(r * 1.0, -r * 0.45); ctx.lineTo(r * 0.78, r * 0.05); ctx.lineTo(r * 0.95, r * 0.15); ctx.lineTo(r * 0.3, r * 0.3);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.2, -r * 0.62); ctx.lineTo(-r * 0.05, -r * 1.0); ctx.lineTo(r * 0.05, -r * 0.72); ctx.lineTo(r * 0.22, -r * 0.95); ctx.lineTo(r * 0.2, -r * 0.6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.72); ctx.lineTo(r * 0.52, 0); ctx.lineTo(0, r * 0.82); ctx.lineTo(-r * 0.52, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.1, r * 0.08); ctx.lineTo(r * 0.1, r * 0.08); ctx.lineTo(0, r * 0.28); ctx.closePath();
      ctx.fillStyle = '#ff9f1a'; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.05); ctx.stroke();
    } else {
      // 石像鬼: 方塊身 + 角 + 小翼
      ctx.beginPath();
      ctx.moveTo(-r * 0.62, -r * 0.45); ctx.lineTo(-r * 0.5, -r * 1.0); ctx.lineTo(-r * 0.25, -r * 0.58);
      ctx.moveTo(r * 0.62, -r * 0.45); ctx.lineTo(r * 0.5, -r * 1.0); ctx.lineTo(r * 0.25, -r * 0.58);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.66, -r * 0.2); ctx.lineTo(-r * 1.0, -r * 0.5); ctx.lineTo(-r * 0.92, r * 0.2); ctx.lineTo(-r * 0.66, r * 0.25);
      ctx.moveTo(r * 0.66, -r * 0.2); ctx.lineTo(r * 1.0, -r * 0.5); ctx.lineTo(r * 0.92, r * 0.2); ctx.lineTo(r * 0.66, r * 0.25);
      ctx.fill(); ctx.stroke();
      rr(ctx, -r * 0.7, -r * 0.62, r * 1.4, r * 1.5, r * 0.18);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(13,11,20,0.45)';
      ctx.lineWidth = Math.max(1.5, r * 0.06);
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, r * 0.35); ctx.lineTo(r * 0.7, r * 0.35);
      ctx.moveTo(0, r * 0.35); ctx.lineTo(0, r * 0.88);
      ctx.stroke();
    }
    // 眼睛
    var ey = sp === 'water' ? -r * 0.25 : (sp === 'stone' ? -r * 0.15 : -r * 0.08);
    var ex = r * 0.26, er = r * 0.15;
    if (o.eyes === 'daze') {
      ctx.strokeStyle = P.line; ctx.lineWidth = Math.max(1.5, r * 0.07);
      [-ex, ex].forEach(function (x) {
        ctx.beginPath();
        ctx.arc(x, ey, er, 0, Math.PI * 1.6);
        ctx.arc(x, ey, er * 0.45, Math.PI * 1.6, Math.PI * 3, false);
        ctx.stroke();
      });
    } else if (o.eyes === 'angry') {
      [-ex, ex].forEach(function (x, i) {
        ctx.beginPath(); ctx.arc(x, ey, er, 0, Math.PI * 2);
        ctx.fillStyle = '#ffe14d'; ctx.fill();
        ctx.beginPath(); ctx.arc(x, ey, er * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = P.line; ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x - er * 1.2, ey - er * (i ? 1.5 : 0.7));
        ctx.lineTo(x + er * 1.2, ey - er * (i ? 0.7 : 1.5));
        ctx.lineWidth = Math.max(2, r * 0.08); ctx.strokeStyle = P.line; ctx.stroke();
      });
    } else {
      [-ex, ex].forEach(function (x) {
        ctx.beginPath(); ctx.arc(x, ey, er, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.lineWidth = Math.max(1, r * 0.04); ctx.strokeStyle = P.line; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, ey + er * 0.15, er * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = P.line; ctx.fill();
      });
    }
    ctx.restore();
  }

  // 怒氣條: 刻度 = 門檻; 達門檻填綠; 100 端紅色斜紋端蓋
  function rageBar(ctx, x, y, w, h, rage, threshold, loose) {
    rage = clamp(num(rage, 0), 0, 100);
    threshold = clamp(num(threshold, 50), 0, 100);
    ctx.save();
    rr(ctx, x - 2, y - 2, w + 4, h + 4, 4);
    ctx.fillStyle = P.line; ctx.fill();
    ctx.fillStyle = P.rageTrack;
    ctx.fillRect(x, y, w, h);
    var fw = w * rage / 100;
    ctx.fillStyle = loose ? P.danger : (rage >= threshold ? P.ready : P.rageLow);
    ctx.fillRect(x, y, fw, h);
    if (loose) hatch(ctx, x, y, fw, h, 'rgba(0,0,0,0.45)', 7, 2.5);
    // 100 端蓋
    ctx.fillStyle = P.danger;
    ctx.fillRect(x + w - 3, y, 3, h);
    // 門檻刻度(凸出條外)
    var tx = x + w * threshold / 100;
    ctx.fillStyle = P.line;
    ctx.fillRect(tx - 3, y - 5, 6, h + 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(tx - 1.5, y - 4, 3, h + 8);
    ctx.restore();
  }

  function shapeGlyph(ctx, sp, cx, cy, cell) {
    var cells = SHAPES[sp] || [];
    var minR = sp === 'water' ? -1 : -2, maxR = sp === 'water' ? 3 : 2;
    var rows = maxR - minR + 1;
    var ox = cx - cell * 2.5, oy = cy - cell * rows / 2;
    ctx.save();
    for (var c = -2; c <= 2; c++) {
      for (var r = minR; r <= maxR; r++) {
        var px = ox + (c + 2) * cell, py = oy + (r - minR) * cell;
        var hit = cells.some(function (o) { return o[0] === c && o[1] === r; });
        ctx.fillStyle = hit ? spColor(sp) : 'rgba(255,255,255,0.08)';
        ctx.fillRect(px + 0.5, py + 0.5, cell - 1, cell - 1);
        if (c === 0 && r === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(px + cell / 2, py + cell / 2, cell * 0.32, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  function keycap(ctx, label, cx, cy, size) {
    size = size || 22;
    ctx.save();
    ctx.font = font(size);
    var w = Math.max(size * 1.8, ctx.measureText(label).width + size * 1.1);
    var h = size * 1.8;
    rr(ctx, cx - w / 2, cy - h / 2 + 4, w, h, 8);
    ctx.fillStyle = '#8c86a6'; ctx.fill();
    rr(ctx, cx - w / 2, cy - h / 2, w, h, 8);
    ctx.fillStyle = '#f3f0fb'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = P.line; ctx.stroke();
    text(ctx, label, cx, cy, size, '#1b1828', 'center', false);
    ctx.restore();
    return w;
  }
  function dashedArrow(ctx, x0, y0, x1, y1, color, lw) {
    ctx.save();
    lw = lw || 4;
    var a = Math.atan2(y1 - y0, x1 - x0);
    var hx = x1 - Math.cos(a) * lw * 3, hy = y1 - Math.sin(a) * lw * 3;
    ctx.setLineDash([lw * 2.2, lw * 1.6]);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(hx, hy);
    ctx.lineWidth = lw + 3; ctx.strokeStyle = P.line; ctx.stroke();
    ctx.lineWidth = lw; ctx.strokeStyle = color; ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - Math.cos(a - 0.45) * lw * 4.5, y1 - Math.sin(a - 0.45) * lw * 4.5);
    ctx.lineTo(x1 - Math.cos(a + 0.45) * lw * 4.5, y1 - Math.sin(a + 0.45) * lw * 4.5);
    ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = P.line; ctx.stroke();
    ctx.restore();
  }

  // ======================= 匯出函式 =======================
  var Art = {
    canvas: { width: 720, height: 1280 },
    palette: P,

    drawBackground: function (ctx) {
      ctx.save();
      ctx.fillStyle = P.bg;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.restore();
    },

    // ---------- 地下城 ----------
    drawTile: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0);
      var floorCol = s.floor === 2 ? P.floor2 : P.floor1;
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath(); ctx.rect(-40, -40, 80, 80); ctx.clip();
      if (s.kind === 'wall') {
        ctx.fillStyle = P.wall;
        ctx.fillRect(-40, -40, 80, 80);
        ctx.fillStyle = P.wallTop;
        ctx.fillRect(-40, -40, 80, 58);
        ctx.strokeStyle = 'rgba(13,11,20,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-40, -21); ctx.lineTo(40, -21);
        ctx.moveTo(-40, -2); ctx.lineTo(40, -2);
        ctx.moveTo(-10, -40); ctx.lineTo(-10, -21);
        ctx.moveTo(18, -21); ctx.lineTo(18, -2);
        ctx.moveTo(-22, -2); ctx.lineTo(-22, 18);
        ctx.stroke();
        ctx.strokeStyle = P.line; ctx.lineWidth = 3;
        ctx.strokeRect(-38.5, -38.5, 77, 77);
      } else {
        var odd = (Math.floor(x / 80) + Math.floor(y / 80)) % 2 === 0;
        ctx.fillStyle = floorCol;
        ctx.fillRect(-40, -40, 80, 80);
        if (odd) { ctx.fillStyle = 'rgba(255,255,255,0.035)'; ctx.fillRect(-40, -40, 80, 80); }
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
        ctx.strokeRect(-39, -39, 78, 78);
        if (s.kind === 'stairs') {
          // 往下的階梯 + 綠框(= 可前往)
          for (var i = 0; i < 4; i++) {
            var w = 60 - i * 12;
            ctx.fillStyle = i % 2 ? '#a8976c' : P.stairs;
            ctx.fillRect(-w / 2, -28 + i * 14, w, 14);
          }
          ctx.fillStyle = '#0c0a12';
          ctx.fillRect(-10, 28, 20, 8);
          ctx.lineWidth = 4; ctx.strokeStyle = P.ready;
          ctx.strokeRect(-36, -36, 72, 72);
        }
      }
      ctx.restore();
    },

    drawHero: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0);
      var ang = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[s.facing] || 0;
      ctx.save();
      ctx.translate(x, y);
      if (s.blink) ctx.globalAlpha = 0.3;
      // 移動中: 身後速度線
      if (s.moving) {
        ctx.save();
        ctx.rotate(ang);
        ctx.strokeStyle = 'rgba(244,241,234,0.55)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-26, -10); ctx.lineTo(-31, -10);
        ctx.moveTo(-27, 0); ctx.lineTo(-31, 0);
        ctx.moveTo(-26, 10); ctx.lineTo(-31, 10);
        ctx.stroke();
        ctx.restore();
      }
      // 身體(白色騎士圓)
      ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI * 2);
      ctx.fillStyle = P.hero; ctx.fill();
      ctx.lineWidth = 3.5; ctx.strokeStyle = P.line; ctx.stroke();
      ctx.save();
      ctx.rotate(ang);
      // 面罩(朝面向)
      ctx.beginPath(); ctx.arc(0, 0, 17, -0.75, 0.75);
      ctx.lineTo(Math.cos(0.75) * 6, Math.sin(0.75) * 6);
      ctx.lineTo(Math.cos(-0.75) * 6, Math.sin(-0.75) * 6);
      ctx.closePath();
      ctx.fillStyle = P.heroVisor; ctx.fill();
      ctx.fillStyle = '#9fe7ff';
      ctx.fillRect(10, -7, 4, 4); ctx.fillRect(10, 3, 4, 4);
      // 面向尖
      ctx.beginPath();
      ctx.moveTo(23, -6); ctx.lineTo(30, 0); ctx.lineTo(23, 6); ctx.closePath();
      ctx.fillStyle = P.hero; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.line; ctx.stroke();
      if (s.attacking) {
        // 揮劍弧: 只在面前半圈, 外緣 ≤ 31
        ctx.beginPath();
        ctx.arc(0, 0, 31, -1.1, 1.1);
        ctx.arc(0, 0, 24, 1.0, -1.0, true);
        ctx.closePath();
        ctx.fillStyle = 'rgba(200,240,255,0.9)'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = P.line; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(29, 0);
        ctx.lineWidth = 6; ctx.strokeStyle = P.line; ctx.lineCap = 'round'; ctx.stroke();
        ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      }
      ctx.restore();
      ctx.restore();
    },

    drawWildMonster: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), sp = s.species;
      var col = spColor(sp);
      ctx.save();
      ctx.translate(x, y);
      // 狀態圈: 施放中 = 種類色實線粗環; 暈眩 = 綠色虛線環(可裝籠)
      if (s.casting && !s.dazed) {
        ctx.beginPath(); ctx.arc(0, 0, 33, 0, Math.PI * 2);
        ctx.lineWidth = 6; ctx.strokeStyle = P.line; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
      }
      if (s.dazed) {
        ctx.beginPath(); ctx.arc(0, 0, 33, 0, Math.PI * 2);
        ctx.setLineDash([7, 5]);
        ctx.lineWidth = 4; ctx.strokeStyle = P.ready; ctx.stroke();
        ctx.setLineDash([]);
      }
      var jx = s.hit ? 2 : 0;
      ctx.save();
      ctx.translate(jx, -2);
      speciesBody(ctx, sp, 23, { eyes: s.dazed ? 'daze' : (s.casting ? 'angry' : 'normal') });
      if (s.hit) {
        ctx.globalAlpha = 0.65;
        speciesBody(ctx, sp, 23, { flash: true });
      }
      ctx.restore();
      if (s.dazed) {
        ctx.fillStyle = '#ffffff';
        [[-14, -25], [0, -29], [14, -25]].forEach(function (p) {
          star(ctx, p[0], p[1], 5, 2.2, 4);
          ctx.fill();
          ctx.lineWidth = 1.2; ctx.strokeStyle = P.line; ctx.stroke();
        });
      }
      // 疲憊點(上方 3 格): 實心 = 已撲空次數
      if (!s.dazed) {
        var tired = clamp(Math.round(num(s.tired, 0)), 0, 3);
        for (var i = 0; i < 3; i++) {
          var px = -11 + i * 11;
          ctx.beginPath(); ctx.arc(px, -31, 4, 0, Math.PI * 2);
          ctx.fillStyle = i < tired ? '#ffffff' : 'rgba(20,18,28,0.75)';
          ctx.fill();
          ctx.lineWidth = 1.5; ctx.strokeStyle = i < tired ? P.line : 'rgba(255,255,255,0.5)'; ctx.stroke();
        }
      }
      // 血條(下方)
      var maxHp = Math.max(1, Math.round(num(s.maxHp, 1)));
      var hp = clamp(Math.round(num(s.hp, maxHp)), 0, maxHp);
      var bw = 54, bh = 6, bx = -27, by = 27;
      ctx.fillStyle = P.line; ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
      var seg = bw / maxHp;
      for (var k = 0; k < maxHp; k++) {
        ctx.fillStyle = k < hp ? P.hp : '#3a2f3a';
        ctx.fillRect(bx + k * seg + 0.75, by, seg - 1.5, bh);
      }
      ctx.restore();
    },

    drawWarnTile: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), col = spColor(s.species), t = num(s.t, 0);
      ctx.save();
      ctx.translate(x, y);
      if (s.phase === 'strike') {
        var k = clamp(t / 0.2, 0, 1);
        ctx.fillStyle = col;
        ctx.fillRect(-40, -40, 80, 80);
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-30, -30, 60, 60);
        ctx.globalAlpha = 1;
        ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(-38, -38, 76, 76);
      } else {
        var p = clamp(t / 0.9, 0, 1);
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = col; ctx.fillRect(-40, -40, 80, 80);
        ctx.globalAlpha = 0.7;
        hatch(ctx, -40, -40, 80, 80, col, 14, 3);
        ctx.globalAlpha = 0.55;
        var g = 76 * p;
        ctx.fillStyle = col; ctx.fillRect(-g / 2, -g / 2, g, g);
        ctx.globalAlpha = 1;
        ctx.lineWidth = 4; ctx.strokeStyle = col;
        ctx.setLineDash([10, 6]);
        ctx.strokeRect(-38, -38, 76, 76);
        ctx.setLineDash([]);
      }
      ctx.restore();
    },

    drawCage: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), t = num(s.t, 0);
      ctx.save();
      ctx.translate(x, y);
      if (s.result === 'caught') {
        var k = clamp(t / 0.25, 0, 1);
        ctx.scale(0.7 + 0.3 * k, 0.7 + 0.3 * k);
        rr(ctx, -19, -16, 38, 35, 5);
        ctx.fillStyle = 'rgba(74,222,128,0.25)'; ctx.fill();
        cageIcon(ctx, 0, 3, 34, '#e8f6ec');
        check(ctx, 8, 9, 16, P.ready);
      } else if (s.result === 'broken') {
        var d = clamp(t / 0.4, 0, 1) * 6;
        ctx.globalAlpha = 1 - clamp(t / 0.6, 0, 1) * 0.6;
        ctx.save(); ctx.translate(-d, d * 0.5); ctx.rotate(-0.3);
        ctx.beginPath(); ctx.rect(-14, -12, 12, 24); ctx.clip();
        cageIcon(ctx, -2, 0, 26, '#bfb9d4'); ctx.restore();
        ctx.save(); ctx.translate(d, d * 0.5); ctx.rotate(0.3);
        ctx.beginPath(); ctx.rect(2, -12, 12, 24); ctx.clip();
        cageIcon(ctx, 2, 0, 26, '#bfb9d4'); ctx.restore();
        ctx.globalAlpha = 1;
        cross(ctx, 0, 0, 9, P.danger, 4);
      } else {
        ctx.rotate(t * 9);
        cageIcon(ctx, 0, 2, 30, '#f3f0fb');
      }
      ctx.restore();
    },

    // ---------- 夜場 ----------
    drawStage: function (ctx) {
      ctx.save();
      // 舞台後牆與布幕
      ctx.fillStyle = '#1a1830';
      ctx.fillRect(0, 120, 720, 520);
      ctx.fillStyle = P.curtain;
      for (var i = 0; i < 6; i++) {
        ctx.fillRect(i * 20, 120, 14, 520);
        ctx.fillRect(720 - 14 - i * 20, 120, 14, 520);
      }
      ctx.fillStyle = '#2f4482';
      ctx.fillRect(0, 120, 720, 16);
      // 舞台地板
      ctx.fillStyle = P.board;
      ctx.fillRect(120, 140, 480, 480);
      ctx.fillStyle = '#3f2a1d';
      ctx.fillRect(112, 620, 496, 14);
      // 觀眾席
      ctx.fillStyle = P.seat;
      ctx.fillRect(0, 640, 720, 120);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(120, 640, 480, 120);
      text(ctx, '觀眾', 60, 700, 18, P.textDim, 'center');
      // 後台
      text(ctx, '後台', 26, 777, 18, P.textDim, 'left');
      rr(ctx, 14, 790, 692, 322, 14);
      ctx.fillStyle = '#1e1b2b'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#34304a'; ctx.stroke();
      ctx.restore();
    },

    drawStageCell: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0);
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath(); ctx.rect(-80, -80, 160, 160); ctx.clip();
      ctx.fillStyle = (num(s.row, 0) + num(s.col, 0)) % 2 ? P.board : P.boardHi;
      ctx.fillRect(-80, -80, 160, 160);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (var i = -40; i <= 40; i += 40) { ctx.moveTo(-80, i); ctx.lineTo(80, i); }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(13,11,20,0.7)'; ctx.lineWidth = 3;
      ctx.strokeRect(-78.5, -78.5, 157, 157);
      if (s.preview && s.previewSpecies) {
        var col = spColor(s.previewSpecies);
        ctx.globalAlpha = 0.38;
        ctx.fillStyle = col; ctx.fillRect(-72, -72, 144, 144);
        ctx.globalAlpha = 1;
        ctx.setLineDash([14, 8]);
        ctx.lineWidth = 5; ctx.strokeStyle = col;
        ctx.strokeRect(-70, -70, 140, 140);
        ctx.setLineDash([]);
      }
      if (s.cursor) brackets(ctx, 0, 0, 156, 156, 36, 6);
      ctx.restore();
    },

    drawStageMonster: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), sp = s.species, col = spColor(sp);
      var mode = s.mode || 'idle';
      ctx.save();
      ctx.translate(x, y);
      if (s.selected) {
        rr(ctx, -63, -63, 126, 126, 16);
        ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
        ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      }
      if (mode === 'performing') {
        ctx.save();
        ctx.translate(0, -12);
        ctx.strokeStyle = col; ctx.lineCap = 'round';
        for (var i = 0; i < 12; i++) {
          var a = i * Math.PI / 6;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 43, Math.sin(a) * 43);
          ctx.lineTo(Math.cos(a) * 49, Math.sin(a) * 49);
          ctx.lineWidth = 7; ctx.strokeStyle = P.line; ctx.stroke();
          ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
        }
        ctx.restore();
      }
      if (mode === 'loose') {
        rr(ctx, -62, -62, 124, 124, 14);
        ctx.fillStyle = 'rgba(255,45,85,0.18)'; ctx.fill();
        hatch(ctx, -62, -62, 124, 124, 'rgba(255,45,85,0.45)', 16, 4);
      }
      ctx.save();
      ctx.translate(0, -12);
      var sc = mode === 'performing' ? 1.08 : 1;
      ctx.scale(sc, sc);
      speciesBody(ctx, sp, 38, {
        eyes: mode === 'loose' ? 'angry' : 'normal',
        dark: mode === 'loose'
      });
      if (mode === 'loose') {
        ctx.lineWidth = 4; ctx.strokeStyle = P.danger;
        ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.stroke();
      }
      if (mode === 'ignited') {
        ctx.globalAlpha = 0.45;
        speciesBody(ctx, sp, 38, { flash: true });
        ctx.globalAlpha = 1;
      }
      if (mode === 'doused') {
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#20384f';
        ctx.beginPath(); ctx.arc(0, 0, 38, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        speciesBody(ctx, sp, 30, {});
      }
      ctx.restore();
      if (mode === 'ignited') {
        chevrons(ctx, -52, -14, 16, true, P.rageUp);
        chevrons(ctx, 52, -14, 16, true, P.rageUp);
      }
      if (mode === 'doused') {
        chevrons(ctx, -52, -14, 16, false, P.rageDown);
        chevrons(ctx, 52, -14, 16, false, P.rageDown);
      }
      // 怒氣條 + 數字
      rageBar(ctx, -58, 42, 76, 12, s.rage, s.threshold, mode === 'loose');
      text(ctx, Math.round(num(s.rage, 0)), 61, 48, 22, mode === 'loose' ? P.danger : P.text, 'right');
      ctx.restore();
    },

    drawSkillTile: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), t = num(s.t, 0), col = spColor(s.species);
      // 觀眾區(中心 y 約 700)格高只有 120, 收進該欄
      var audience = y > 630;
      var hw = 72, hh = audience ? 56 : 72;
      var grow = 0.6 + 0.4 * clamp(t / 0.15, 0, 1);
      var fade = 1 - clamp((t - 0.5) / 0.3, 0, 1);
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = 0.85 * fade;
      ctx.fillStyle = col;
      ctx.fillRect(-hw * grow, -hh * grow, hw * 2 * grow, hh * 2 * grow);
      ctx.globalAlpha = fade * (1 - clamp(t / 0.25, 0, 1));
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-hw * 0.55, -hh * 0.55, hw * 1.1, hh * 1.1);
      ctx.globalAlpha = fade;
      ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(-hw * grow + 2, -hh * grow + 2, hw * 2 * grow - 4, hh * 2 * grow - 4);
      ctx.restore();
    },

    drawAudience: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), mood = s.mood || 'calm';
      var col = mood === 'cheer' ? '#ffd9a8' : (mood === 'scared' ? '#9fb8d6' : '#8b84a3');
      ctx.save();
      ctx.translate(x, y);
      if (mood === 'cheer') {
        ctx.fillStyle = 'rgba(255,182,39,0.16)'; ctx.fillRect(-80, -60, 160, 120);
      } else if (mood === 'scared') {
        ctx.fillStyle = 'rgba(255,45,85,0.14)'; ctx.fillRect(-80, -60, 160, 120);
      }
      var people = [[-48, 10], [0, 18], [48, 10]];
      people.forEach(function (p, i) {
        var px = p[0] + (mood === 'scared' ? 0 : 0), py = p[1] + (mood === 'cheer' ? -6 : 0);
        var lean = mood === 'scared' ? 6 : 0;
        // 肩
        ctx.beginPath();
        ctx.ellipse(px, py + 26, 22, 14, 0, Math.PI, 0);
        ctx.fillStyle = col; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = P.line; ctx.stroke();
        if (mood === 'cheer') {
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(px - 16, py + 18); ctx.lineTo(px - 24, py - 14);
          ctx.moveTo(px + 16, py + 18); ctx.lineTo(px + 24, py - 14);
          ctx.lineWidth = 8; ctx.strokeStyle = P.line; ctx.stroke();
          ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke();
        }
        // 頭
        ctx.beginPath(); ctx.arc(px, py - lean, 14, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = P.line; ctx.stroke();
        ctx.fillStyle = P.line;
        if (mood === 'scared') {
          ctx.beginPath(); ctx.arc(px - 5, py - lean - 3, 2.6, 0, Math.PI * 2); ctx.arc(px + 5, py - lean - 3, 2.6, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(px, py - lean + 6, 3.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
        } else if (mood === 'cheer') {
          ctx.lineWidth = 2; ctx.strokeStyle = P.line;
          ctx.beginPath(); ctx.arc(px - 5, py - 2, 3, Math.PI, 0); ctx.arc(px + 5, py - 2, 3, Math.PI, 0); ctx.stroke();
          ctx.beginPath(); ctx.arc(px, py + 3, 6, 0, Math.PI); ctx.closePath(); ctx.fill();
        } else {
          ctx.fillRect(px - 6, py - 3, 3, 3); ctx.fillRect(px + 3, py - 3, 3, 3);
          ctx.fillRect(px - 4, py + 5, 8, 2);
        }
      });
      if (mood === 'scared') {
        text(ctx, '!', -66, -36, 26, P.danger, 'center');
        text(ctx, '!', 66, -36, 26, P.danger, 'center');
      } else if (mood === 'cheer') {
        ctx.fillStyle = P.gold;
        [[-70, -44], [-24, -48], [24, -48], [70, -44]].forEach(function (p) {
          star(ctx, p[0], p[1], 7, 2.6, 4); ctx.fill();
        });
      }
      ctx.restore();
    },

    drawBackstageCard: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), sp = s.species, col = spColor(sp);
      var info = SPECIES[sp] || { name: '?', wait: 0, ignite: 0, gold: 0 };
      var shop = s.sellPrice !== null && s.sellPrice !== undefined;
      ctx.save();
      ctx.translate(x, y);
      rr(ctx, -60, -73, 120, 146, 10);
      ctx.fillStyle = s.selected ? '#3e3860' : P.panel; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#46405f'; ctx.stroke();
      // 頂部種類色帶
      ctx.save();
      rr(ctx, -60, -73, 120, 146, 10); ctx.clip();
      ctx.fillStyle = col; ctx.fillRect(-60, -73, 120, 6);
      ctx.restore();
      // 本體 + 形狀
      ctx.save(); ctx.translate(-28, -44); speciesBody(ctx, sp, 18, {}); ctx.restore();
      shapeGlyph(ctx, sp, 28, -44, 7);
      text(ctx, info.name, 0, -12, 17, P.text, 'center');
      if (shop) {
        text(ctx, '放生', 0, 16, 16, P.textDim, 'center');
        coin(ctx, -26, 44, 11);
        text(ctx, '+' + s.sellPrice, 12, 44, 24, P.gold, 'center');
      } else {
        rageBar(ctx, -50, 7, 70, 10, s.rage, s.threshold, s.loose);
        text(ctx, Math.round(num(s.rage, 0)), 41, 12, 19, s.loose ? P.danger : P.text, 'center');
        text(ctx, '後台 +' + info.wait, 0, 34, 15, P.textDim, 'center');
        if (sp === 'water') text(ctx, '技能 同伴−25', 0, 54, 15, P.rageDown, 'center');
        else text(ctx, '被點 +' + info.ignite, 0, 54, 15, P.textDim, 'center');
      }
      if (s.loose) {
        rr(ctx, -60, -73, 120, 146, 10);
        ctx.fillStyle = 'rgba(15,10,18,0.55)'; ctx.fill();
        hatch(ctx, -60, -73, 120, 146, 'rgba(255,45,85,0.4)', 16, 4);
        cross(ctx, 0, -30, 22, P.danger, 8);
        text(ctx, '失控', 0, 20, 22, P.danger, 'center');
      }
      if (s.selected) {
        rr(ctx, -59, -72, 118, 144, 10);
        ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      }
      if (s.cursor) brackets(ctx, 0, 0, 124, 150, 28, 5);
      ctx.restore();
    },

    drawButton: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), w = num(s.w, 200), h = num(s.h, 80);
      ctx.save();
      rr(ctx, x + 4, y + 6, w - 8, h - 8, 16);
      ctx.fillStyle = s.cursor ? '#6a5cc4' : '#3b3560'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = P.line; ctx.stroke();
      text(ctx, s.label || '', x + w / 2, y + h / 2 + 1, 32, s.cursor ? '#ffffff' : P.textDim, 'center');
      if (s.cursor) brackets(ctx, x + w / 2, y + h / 2, w, h, 26, 6);
      ctx.restore();
    },

    drawShopItem: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0);
      var meta = {
        sword: ['好劍', '攻擊力 +1'],
        cageBag: ['籠袋', '每天籠數 +1'],
        armor: ['護甲', '心數 +1'],
        encore: ['加演', '每晚幕數 +1(上限 6)']
      }[s.item] || [String(s.item), ''];
      var off = s.maxed || !s.affordable;
      ctx.save();
      ctx.translate(x, y);
      rr(ctx, -298, -38, 596, 76, 12);
      ctx.fillStyle = s.cursor ? P.panelHi : P.panel; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#46405f'; ctx.stroke();
      // 圖示
      ctx.save();
      ctx.translate(-256, 0);
      ctx.globalAlpha = off ? 0.5 : 1;
      if (s.item === 'sword') {
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = '#e6eef8'; ctx.fillRect(-4, -24, 8, 34);
        ctx.fillStyle = P.gold; ctx.fillRect(-12, 8, 24, 6); ctx.fillRect(-3, 14, 6, 10);
      } else if (s.item === 'cageBag') {
        cageIcon(ctx, 0, 2, 36, '#e6eef8');
      } else if (s.item === 'armor') {
        heartPath(ctx, 0, 0, 20); ctx.fillStyle = P.hp; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = P.line; ctx.stroke();
      } else {
        ctx.fillStyle = '#7a2a4a'; ctx.fillRect(-24, -22, 18, 44); ctx.fillRect(6, -22, 18, 44);
        repStar(ctx, 0, 0, 13, P.rep);
      }
      ctx.restore();
      text(ctx, meta[0], -214, -12, 26, off ? P.textDim : P.text, 'left');
      text(ctx, meta[1], -214, 18, 17, P.textDim, 'left');
      var lv = Math.round(num(s.level, 0));
      if (lv > 0) text(ctx, '已買 ' + lv, 70, 0, 18, P.textDim, 'center');
      if (s.maxed) {
        text(ctx, '已達上限', 220, 0, 22, P.textDim, 'center');
      } else {
        coin(ctx, 176, 0, 13);
        text(ctx, Math.round(num(s.cost, 0)), 234, 0, 28, s.affordable ? P.gold : P.danger, 'center');
        if (!s.affordable) text(ctx, '不足', 234, 26, 14, P.danger, 'center');
      }
      if (s.cursor) brackets(ctx, 0, 0, 600, 80, 26, 5);
      ctx.restore();
    },

    drawTitleCard: function (ctx, s) {
      var day = Math.round(num(s.day, 1));
      ctx.save();
      ctx.fillStyle = 'rgba(12,10,18,0.88)';
      ctx.fillRect(0, 0, 720, 1280);
      rr(ctx, 80, 380, 560, 480, 24);
      ctx.fillStyle = P.panel; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#4b4468'; ctx.stroke();
      text(ctx, '第 ' + day + ' 天', 360, 450, 34, P.textDim, 'center');
      if (s.stage === 'dungeon') {
        text(ctx, '地下城', 360, 540, 64, P.text, 'center');
        text(ctx, '2 層 · 共 70 秒', 360, 620, 26, P.textDim, 'center');
        ctx.save(); ctx.translate(250, 710); speciesBody(ctx, 'fire', 30, {}); ctx.restore();
        ctx.save(); ctx.translate(360, 710); speciesBody(ctx, 'thunder', 30, {}); ctx.restore();
        ctx.save(); ctx.translate(470, 710); speciesBody(ctx, 'water', 30, {}); ctx.restore();
      } else if (s.stage === 'show') {
        text(ctx, '夜場', 360, 540, 64, P.text, 'center');
        text(ctx, '排好站位, 開幕', 360, 620, 26, P.textDim, 'center');
        repStar(ctx, 300, 710, 28); repStar(ctx, 420, 710, 28);
      } else {
        text(ctx, '今晚小計', 360, 530, 52, P.text, 'center');
        coin(ctx, 230, 625, 20);
        text(ctx, '+' + Math.round(num(s.goldNight, 0)), 270, 625, 40, P.gold, 'left');
        var rn = Math.round(num(s.repNight, 0));
        repStar(ctx, 230, 705, 22, rn < 0 ? P.danger : P.rep);
        text(ctx, (rn >= 0 ? '+' : '') + rn, 270, 705, 40, rn < 0 ? P.danger : P.rep, 'left');
      }
      text(ctx, '空白鍵繼續', 360, 810, 24, P.text, 'center');
      ctx.restore();
    },

    drawFloatText: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), t = num(s.t, 0), kind = s.kind || 'gold';
      var life = kind === 'bigShow' ? 1.6 : 1.0;
      var a = 1 - clamp((t - life * 0.6) / (life * 0.4), 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      if (kind === 'bigShow') {
        var k = clamp(t / 0.2, 0, 1);
        var sc = 0.6 + 0.5 * k - 0.1 * clamp((t - 0.2) / 0.2, 0, 1);
        ctx.translate(x, y);
        ctx.scale(sc, sc);
        star(ctx, 0, 0, 120, 70, 12);
        ctx.fillStyle = P.gold; ctx.fill();
        ctx.lineWidth = 5; ctx.strokeStyle = P.line; ctx.stroke();
        text(ctx, s.text || '大場面!', 0, 0, 44, '#2a1300', 'center', false);
      } else {
        var dy = -48 * clamp(t / life, 0, 1);
        var color = { gold: P.gold, repUp: P.rep, repDown: P.danger, rageUp: P.rageUp, rageDown: P.rageDown }[kind] || P.text;
        var size = kind === 'repDown' ? 32 : 28;
        ctx.translate(x, y + dy);
        if (kind === 'repDown') ctx.translate(Math.sin(t * 40) * 3 * (1 - clamp(t / 0.4, 0, 1)), 0);
        ctx.font = font(size);
        var tw = ctx.measureText(String(s.text || '')).width;
        var ix = -tw / 2 - 18;
        if (kind === 'gold') coin(ctx, ix, 0, 12);
        else if (kind === 'repUp' || kind === 'repDown') repStar(ctx, ix, 0, 13, color);
        else chevrons(ctx, ix, 0, 14, kind === 'rageUp', color);
        text(ctx, s.text || '', 8, 0, size, color, 'center');
      }
      ctx.restore();
    },

    drawResultPanel: function (ctx, s) {
      var stars = clamp(Math.round(num(s.stars, 0)), 0, 3);
      ctx.save();
      ctx.fillStyle = 'rgba(12,10,18,0.92)';
      ctx.fillRect(0, 0, 720, 1280);
      rr(ctx, 60, 280, 600, 720, 28);
      ctx.fillStyle = P.panel; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#4b4468'; ctx.stroke();
      text(ctx, '三天公演結束', 360, 360, 44, P.text, 'center');
      for (var i = 0; i < 3; i++) {
        star(ctx, 220 + i * 140, 500, 56, 24, 5);
        ctx.fillStyle = i < stars ? P.gold : '#3a3550'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = P.line; ctx.stroke();
        text(ctx, '名聲 ' + [40, 100, 160][i], 220 + i * 140, 580, 17, i < stars ? P.gold : P.textDim, 'center');
      }
      repStar(ctx, 200, 680, 24);
      text(ctx, '總名聲', 240, 680, 26, P.textDim, 'left');
      text(ctx, Math.round(num(s.rep, 0)), 560, 680, 40, P.rep, 'right');
      coin(ctx, 200, 770, 20);
      text(ctx, '累計金幣', 240, 770, 26, P.textDim, 'left');
      text(ctx, Math.round(num(s.goldEarned, 0)), 560, 770, 40, P.gold, 'right');
      text(ctx, '空白鍵重來', 360, 920, 28, P.text, 'center');
      ctx.restore();
    },

    drawHud: function (ctx, s) {
      var phase = s.phase;
      if (phase === 'guide' || phase === 'title' || phase === 'result') {
        if (s.message) { ctx.save(); text(ctx, s.message, 360, 1250, 20, P.textDim, 'center'); ctx.restore(); }
        return;
      }
      ctx.save();
      var day = Math.round(num(s.day, 1));
      var H = phase === 'dungeon' ? 140 : 120;
      ctx.fillStyle = '#100e18';
      ctx.fillRect(0, 0, 720, H);
      ctx.fillStyle = '#2b2740';
      ctx.fillRect(0, H - 2, 720, 2);
      // 右上: 金幣(全階段同位)
      coin(ctx, 556, 32, 14);
      text(ctx, Math.round(num(s.gold, 0)), 578, 32, 26, P.gold, 'left');
      if (phase === 'dungeon') {
        text(ctx, '第 ' + day + ' 天 · 第 ' + Math.round(num(s.floor, 1)) + ' 層', 20, 32, 24, P.text, 'left');
        var tl = Math.max(0, num(s.timeLeft, 0));
        var low = tl <= 10;
        text(ctx, Math.ceil(tl), 360, 30, 34, low ? P.danger : P.text, 'center');
        ctx.fillStyle = '#2b2740'; ctx.fillRect(280, 52, 160, 6);
        ctx.fillStyle = low ? P.danger : '#d9d4ea'; ctx.fillRect(280, 52, 160 * clamp(tl / 70, 0, 1), 6);
        // 心
        var mh = Math.max(1, Math.round(num(s.maxHearts, 5))), hh = Math.round(num(s.hearts, 0));
        for (var i = 0; i < mh; i++) {
          heartPath(ctx, 32 + i * 30, 82, 11);
          ctx.fillStyle = i < hh ? P.hp : '#2f2838'; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = i < hh ? P.line : '#5a5070'; ctx.stroke();
        }
        // 籠
        var cm = Math.max(0, Math.round(num(s.cageMax, 3))), cc = Math.round(num(s.cages, 0));
        var cx0 = 400;
        for (var j = 0; j < cm; j++) cageIcon(ctx, cx0 + j * 30, 84, 22, j < cc ? '#f3f0fb' : '#4a4460');
        text(ctx, '名單 ' + Math.round(num(s.rosterCount, 0)) + '/' + Math.round(num(s.rosterMax, 10)), 700, 82, 20,
          num(s.rosterCount, 0) >= num(s.rosterMax, 10) ? P.danger : P.textDim, 'right');
        if (s.message) text(ctx, s.message, 360, 118, 18, P.textDim, 'center');
      } else {
        var label = phase === 'shop' ? '商店' : '夜場';
        text(ctx, '第 ' + day + ' 天 · ' + label, 20, 32, 24, P.text, 'left');
        if (phase === 'arrange' || phase === 'perform') {
          text(ctx, '第 ' + Math.round(num(s.act, 1)) + ' / ' + Math.round(num(s.actMax, 4)) + ' 幕', 360, 32, 26, P.text, 'center');
        }
        repStar(ctx, 556, 66, 13);
        text(ctx, Math.round(num(s.rep, 0)), 578, 66, 24, P.rep, 'left');
        if (s.message) text(ctx, s.message, 360, 100, 18, P.textDim, 'center');
      }
      ctx.restore();
    },

    // ---------- 說明頁示意圖(只畫在 x,y,w,h 框內) ----------
    drawGuidePage: function (ctx, s) {
      var bx = num(s.x, 0), by = num(s.y, 0), bw = num(s.w, 640), bh = num(s.h, 480);
      var RW = 640, RH = 480;
      var k = Math.min(bw / RW, bh / RH);
      ctx.save();
      ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
      ctx.translate(bx + (bw - RW * k) / 2, by + (bh - RH * k) / 2);
      ctx.scale(k, k);
      var page = Math.round(num(s.page, 0));
      if (GUIDE[page]) GUIDE[page](ctx);
      ctx.restore();
    }
  };

  // 在 (cx,cy) 以縮放 sc 呼叫遊戲內畫法
  function put(ctx, fn, st, cx, cy, sc) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);
    var o = {}; for (var key in st) o[key] = st[key];
    o.x = 0; o.y = 0;
    fn(ctx, o);
    ctx.restore();
  }
  function label(ctx, str, x, y, color) { text(ctx, str, x, y, 22, color || P.text, 'center'); }

  // 地圖格示意: 64px 一格
  function gridScene(ctx, cols, rows, ox, oy, floor) {
    for (var c = 0; c < cols; c++) for (var r = 0; r < rows; r++)
      put(ctx, Art.drawTile, { kind: 'floor', floor: floor || 1 }, ox + 32 + c * 64, oy + 32 + r * 64, 0.8);
  }
  function crossedHeart(ctx, cx, cy) {
    heartPath(ctx, cx, cy, 13);
    ctx.fillStyle = P.hp; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = P.line; ctx.stroke();
    cross(ctx, cx, cy, 12, P.danger, 4);
  }
  // 夜場座標 → 示意圖座標
  function nm(X, Y, sc, ox, oy) { return [ox + (X - 360) * sc, oy + (Y - 220) * sc]; }

  var GUIDE = [
    // 第 1 頁 地下城: 十字預警, 從十字裡走到十字外
    function (ctx) {
      var ox = 96, oy = 70, T = 64;
      gridScene(ctx, 7, 5, ox, oy, 1);
      function at(c, r) { return [ox + 32 + c * T, oy + 32 + r * T]; }
      SHAPES.fire.forEach(function (o) {
        var c = 3 + o[0], r = 2 + o[1];
        if (c < 0 || c > 6 || r < 0 || r > 4) return;
        var p = at(c, r);
        put(ctx, Art.drawWarnTile, { species: 'fire', phase: 'warn', t: 0.6 }, p[0], p[1], 0.8);
      });
      var m = at(3, 2);
      put(ctx, Art.drawWildMonster, { species: 'fire', hp: 3, maxHp: 3, tired: 0, dazed: false, casting: true, hit: false }, m[0], m[1], 0.8);
      var g = at(3, 3), h = at(4, 3);
      ctx.save(); ctx.globalAlpha = 0.35;
      put(ctx, Art.drawHero, { facing: 'right', moving: false, attacking: false, blink: false }, g[0], g[1], 0.8);
      ctx.restore();
      crossedHeart(ctx, g[0] + 20, g[1] - 20);
      dashedArrow(ctx, g[0] + 10, g[1], h[0] - 22, h[1], '#ffffff', 4);
      put(ctx, Art.drawHero, { facing: 'right', moving: true, attacking: false, blink: false }, h[0], h[1], 0.8);
      label(ctx, '你', h[0], h[1] + 46);
    },
    // 第 2 頁 收服: 撲空 1 → 2 → 3, 暈了裝籠
    function (ctx) {
      var T = 48;
      for (var i = 0; i < 3; i++) {
        var ox = 20 + i * 214, oy = 100;
        for (var c = 0; c < 3; c++) for (var r = 0; r < 4; r++)
          put(ctx, Art.drawTile, { kind: 'floor', floor: 1 }, ox + 24 + c * T, oy + 24 + r * T, 0.6);
        var mx = ox + 24 + T, my = oy + 24 + T;
        if (i < 2) {
          put(ctx, Art.drawWarnTile, { species: 'water', phase: 'strike', t: 0.05 }, mx, my + T, 0.6);
          put(ctx, Art.drawWildMonster, { species: 'water', hp: 2, maxHp: 2, tired: i + 1, dazed: false, casting: false, hit: false }, mx, my, 0.75);
          put(ctx, Art.drawHero, { facing: 'up', moving: false, attacking: false, blink: false }, mx + T, my + 2 * T, 0.6);
        } else {
          put(ctx, Art.drawWildMonster, { species: 'water', hp: 2, maxHp: 2, tired: 3, dazed: true, casting: false, hit: false }, mx, my, 0.75);
          put(ctx, Art.drawCage, { result: 'caught', t: 1 }, mx, my + 6, 0.9);
          put(ctx, Art.drawHero, { facing: 'up', moving: false, attacking: false, blink: false }, mx, my + T, 0.6);
          keycap(ctx, 'C', mx + T + 6, my + 2 * T + 10, 24);
        }
        label(ctx, ['撲空 1', '撲空 2', '撲空 3 → 暈'][i], ox + 72, oy + 4 * T + 34, i === 2 ? P.ready : P.text);
        if (i < 2) dashedArrow(ctx, ox + 160, oy + 2 * T, ox + 198, oy + 2 * T, P.textDim, 3);
      }
    },
    // 第 3 頁 揮劍與下樓
    function (ctx) {
      var ox = 96, oy = 60, T = 64;
      gridScene(ctx, 7, 5, ox, oy, 1);
      function at(c, r) { return [ox + 32 + c * T, oy + 32 + r * T]; }
      var st = at(5, 0);
      put(ctx, Art.drawTile, { kind: 'stairs', floor: 1 }, st[0], st[1], 0.8);
      dashedArrow(ctx, st[0] - 90, st[1] + 70, st[0] - 30, st[1] + 18, P.ready, 4);
      label(ctx, '樓梯', st[0] - 110, st[1] + 92, P.ready);
      var h = at(1, 3), m = at(2, 3);
      put(ctx, Art.drawHero, { facing: 'right', moving: false, attacking: true, blink: false }, h[0], h[1], 0.8);
      put(ctx, Art.drawWildMonster, { species: 'fire', hp: 2, maxHp: 3, tired: 0, dazed: false, casting: false, hit: true }, m[0], m[1], 0.8);
      label(ctx, '你', h[0], h[1] - 44);
      keycap(ctx, '空白', h[0] + 30, h[1] + 66, 22);
    },
    // 第 4 頁 排陣: 後台卡片選中 → 舞台中間格預覽形狀
    function (ctx) {
      var sc = 0.5, ox = 200, oy = 70;
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
        var p = nm(200 + c * 160, 220 + r * 160, sc, ox, oy);
        var pv = Math.abs(c - 1) === 1 && Math.abs(r - 1) === 1;
        put(ctx, Art.drawStageCell, { col: c, row: r, cursor: c === 1 && r === 1, preview: pv, previewSpecies: pv ? 'thunder' : null }, p[0], p[1], sc);
      }
      var a0 = nm(200, 700, sc, ox, oy);
      ctx.fillStyle = P.seat; ctx.fillRect(a0[0] - 40, a0[1] - 30, 240, 60);
      text(ctx, '觀眾', ox, a0[1], 18, P.textDim, 'center');
      var cardX = 520, cardY = 250;
      put(ctx, Art.drawBackstageCard, { species: 'thunder', rage: 40, threshold: 60, cursor: false, selected: true, loose: false, sellPrice: null }, cardX, cardY, 0.9);
      text(ctx, '後台', cardX, cardY - 84, 20, P.textDim, 'center');
      dashedArrow(ctx, cardX - 60, cardY - 10, ox + 34, oy + 80 - 4, '#ffffff', 4);
      keycap(ctx, '空白', 150, 430, 24);
      keycap(ctx, 'Enter', 390, 430, 24);
      text(ctx, '= 開幕', 490, 430, 24, P.text, 'center');
    },
    // 第 5 頁 開幕: 火十字點燃雷鳥 → 雷鳥斜角打到觀眾
    function (ctx) {
      var sc = 0.5, ox = 200, oy = 60;
      function cell(c, r) { return nm(200 + c * 160, 220 + r * 160, sc, ox, oy); }
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
        var p = cell(c, r);
        put(ctx, Art.drawStageCell, { col: c, row: r, cursor: false, preview: false, previewSpecies: null }, p[0], p[1], sc);
      }
      var aud = [0, 1, 2].map(function (c) { return nm(200 + c * 160, 700, sc, ox, oy); });
      // 火(1,1) 十字: 打到 (1,0)(0,1)(2,1)(1,2)(1,3=觀眾)
      [[1, 0], [0, 1], [1, 2]].forEach(function (q) { var p = cell(q[0], q[1]); put(ctx, Art.drawSkillTile, { species: 'fire', t: 0.45 }, p[0], p[1], sc); });
      var hitT = cell(2, 1);
      put(ctx, Art.drawSkillTile, { species: 'fire', t: 0.45 }, hitT[0], hitT[1], sc);
      // 雷鳥(2,1) 斜角: (1,0)(1,2)(0,3=觀眾 欄0)
      [[1, 0], [1, 2]].forEach(function (q) { var p = cell(q[0], q[1]); put(ctx, Art.drawSkillTile, { species: 'thunder', t: 0.2 }, p[0], p[1], sc); });
      put(ctx, Art.drawSkillTile, { species: 'fire', t: 0.45 }, aud[1][0], aud[1][1], sc);
      put(ctx, Art.drawSkillTile, { species: 'thunder', t: 0.2 }, aud[0][0], aud[0][1], sc);
      aud.forEach(function (p, i) {
        put(ctx, Art.drawAudience, { col: i, mood: i === 2 ? 'calm' : 'cheer' }, p[0], p[1], sc);
      });
      var f = cell(1, 1), th = cell(2, 1);
      put(ctx, Art.drawStageMonster, { species: 'fire', rage: 20, threshold: 50, mode: 'performing', selected: false }, f[0], f[1], sc);
      put(ctx, Art.drawStageMonster, { species: 'thunder', rage: 70, threshold: 60, mode: 'ignited', selected: false }, th[0], th[1], sc);
      text(ctx, '1', f[0] - 32, f[1] - 32, 24, P.fire, 'center');
      text(ctx, '2', th[0] + 32, th[1] - 32, 24, P.thunder, 'center');
      put(ctx, Art.drawFloatText, { text: '+30', kind: 'rageUp', t: 0.2 }, th[0], th[1] - 56, 0.8);
      put(ctx, Art.drawFloatText, { text: '+14', kind: 'gold', t: 0.3 }, aud[0][0], aud[0][1] - 38, 0.8);
      put(ctx, Art.drawFloatText, { text: '+11', kind: 'gold', t: 0.3 }, aud[1][0] + 10, aud[1][1] - 38, 0.8);
      // 角落: 失控卡
      put(ctx, Art.drawBackstageCard, { species: 'stone', rage: 100, threshold: 70, cursor: false, selected: false, loose: true, sellPrice: null }, 560, 150, 0.8);
      text(ctx, '後台', 560, 78, 18, P.textDim, 'center');
      // 底部流程
      var fy = 448, chips = ['地下城', '夜場 4 幕', '商店'], xs = [110, 270, 420];
      chips.forEach(function (c, i) {
        ctx.font = font(18);
        var w = ctx.measureText(c).width + 22;
        rr(ctx, xs[i] - w / 2, fy - 16, w, 32, 8);
        ctx.fillStyle = P.panelHi; ctx.fill();
        text(ctx, c, xs[i], fy, 18, P.text, 'center');
        if (i < 2) dashedArrow(ctx, xs[i] + w / 2 + 6, fy, xs[i + 1] - 44, fy, P.textDim, 2.5);
      });
      text(ctx, '× 3 天 → 評星', 548, fy, 18, P.gold, 'center');
    }
  ];

  window.Art = Art;
})();
