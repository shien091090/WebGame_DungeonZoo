/* 連鎖總機 — 美術(Canvas 2D 幾何繪製, 無外部資源)
 * 全域 window.Art; 每個 draw 函式自己 save/restore。
 * 函式與 state 欄位照 interface.json, 說明見 style.md。
 */
(function () {
  'use strict';

  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC","Heiti TC",sans-serif';

  var P = {
    bg: '#14151b',
    hudBg: '#0c0d12',
    hudLine: '#2c2e3a',
    text: '#f2f2f5',
    textDim: '#9aa0ad',
    ink: '#0b0b10',
    // 地形
    wall: '#1a1b23',
    wallTop: '#2b2d39',
    wallEdge: '#41445a',
    floorHall: '#363944',
    floorCrag: '#463f33',
    floorRuins: '#363b4b',
    floorPond: '#2c3d46',
    floorLava: '#422c2a',
    water: '#1c4f78',
    waterHi: '#5b9cc8',
    lava: '#ff6a1a',
    lavaCrust: '#6e200e',
    lavaHi: '#ffd25a',
    pillar: '#6a6d7c',
    pillarTop: '#8b8e9e',
    nest: '#8a6a3e',
    // 物種(色相兩兩 >= 57°, 見 style.md)
    fire: '#ec4a2c',
    thunder: '#c6e02a',
    water_sp: '#3a86ff',
    stone: '#c060e0',
    // 語意色
    player: '#f4ead2',
    hat: '#6b4a2e',
    parry: '#ffffff',
    select: '#ffffff',
    capture: '#3fe08a',
    danger: '#ff3b30',
    gold: '#ffc83a',
    rep: '#ff7ad9',
    snack: '#d8955a',
    rageLow: '#8f97a8',
    rageMid: '#ffb21e',
    rageHigh: '#ff3b30',
    heart: '#ff4d6a',
    ok: '#3fe08a',
    stage: '#3a1f2e',
    stageRing: '#5a2e45',
    seat: '#2a2c38',
    seatTop: '#3a3d4c',
  };

  var SP = { fire: P.fire, thunder: P.thunder, water: P.water_sp, stone: P.stone };
  var SP_DARK = { fire: '#7a1e10', thunder: '#5c6a0c', water: '#123f8a', stone: '#5a2370' };
  var SP_LIGHT = { fire: '#ffb03a', thunder: '#f2ffa0', water: '#a8d0ff', stone: '#e8b8ff' };
  var SP_NAME = { fire: '火蜥蜴', thunder: '雷鳥', water: '水母', stone: '石像鬼' };
  var WARN_DUR = { firering: 0.5, thunder: 0.8, quake: 0.5, waterball: 0.3 };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() / 1000 : Date.now() / 1000; }
  function font(px, bold) { return (bold ? 'bold ' : '') + px + 'px ' + FONT; }

  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
    ctx.lineTo(x + w, y + h - r);
    ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    ctx.lineTo(x + r, y + h);
    ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    ctx.lineTo(x, y + r);
    ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
    ctx.closePath();
  }

  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }

  // 描邊文字(P10: 任何底色都讀得到)
  function text(ctx, s, x, y, px, color, align, bold, outline) {
    ctx.font = font(px, bold !== false);
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    if (outline !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(3, px * 0.18);
      ctx.strokeStyle = typeof outline === 'string' ? outline : 'rgba(8,8,12,0.9)';
      ctx.strokeText(s, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
  }

  // ---------- 小圖示(HUD、商店、說明頁共用, P3) ----------
  function iconHeart(ctx, x, y, s, filled, broken) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(-s * 0.6, -s * 0.05, -s * 0.45, -s * 0.55, 0, -s * 0.22);
    ctx.bezierCurveTo(s * 0.45, -s * 0.55, s * 0.6, -s * 0.05, 0, s * 0.35);
    ctx.closePath();
    if (filled) {
      ctx.fillStyle = P.heart; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = '#5a0f1e'; ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#6a6e7c'; ctx.stroke();
    }
    if (broken) {
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-1, -s * 0.2); ctx.lineTo(s * 0.08, 0); ctx.lineTo(-s * 0.08, s * 0.12); ctx.lineTo(0, s * 0.3); ctx.stroke();
    }
    ctx.restore();
  }

  function iconRope(ctx, x, y, s, active) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = active ? P.capture : '#4c5260';
    ctx.lineWidth = Math.max(2, s * 0.14);
    ctx.lineCap = 'round';
    circle(ctx, -s * 0.08, -s * 0.08, s * 0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 0.12, s * 0.14); ctx.quadraticCurveTo(s * 0.3, s * 0.22, s * 0.38, s * 0.4); ctx.stroke();
    ctx.restore();
  }

  function iconSnack(ctx, x, y, s, alpha) {
    // 骨頭肉: 一塊肉 + 骨柄
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha *= (alpha == null ? 1 : alpha);
    ctx.rotate(-0.6);
    ctx.fillStyle = '#f3ead8';
    circle(ctx, s * 0.42, -s * 0.07, s * 0.1); ctx.fill();
    circle(ctx, s * 0.42, s * 0.07, s * 0.1); ctx.fill();
    ctx.fillRect(s * 0.05, -s * 0.06, s * 0.38, s * 0.12);
    ctx.fillStyle = P.snack;
    ctx.beginPath(); ctx.ellipse(-s * 0.12, 0, s * 0.32, s * 0.26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#5a3416'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.ellipse(-s * 0.2, -s * 0.09, s * 0.12, s * 0.06, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function iconCoin(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    circle(ctx, 0, 0, s * 0.5); ctx.fillStyle = P.gold; ctx.fill();
    ctx.lineWidth = Math.max(1.5, s * 0.08); ctx.strokeStyle = '#7a5208'; ctx.stroke();
    circle(ctx, 0, 0, s * 0.3); ctx.strokeStyle = 'rgba(122,82,8,0.6)'; ctx.lineWidth = Math.max(1, s * 0.05); ctx.stroke();
    ctx.restore();
  }

  function starPath(ctx, x, y, r) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var rr = i % 2 ? r * 0.45 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  }

  function iconStar(ctx, x, y, s, color, empty) {
    ctx.save();
    starPath(ctx, x, y, s * 0.5);
    ctx.lineJoin = 'round';
    if (empty) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fill();
      ctx.lineWidth = Math.max(2, s * 0.06); ctx.strokeStyle = '#5c6070'; ctx.stroke();
    } else {
      ctx.fillStyle = color || P.rep; ctx.fill();
      ctx.lineWidth = Math.max(1.5, s * 0.05); ctx.strokeStyle = P.ink; ctx.stroke();
    }
    ctx.restore();
  }

  function iconShield(ctx, x, y, s, color, edge) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.5);
    ctx.quadraticCurveTo(s * 0.25, -s * 0.36, s * 0.42, -s * 0.38);
    ctx.quadraticCurveTo(s * 0.44, s * 0.18, 0, s * 0.5);
    ctx.quadraticCurveTo(-s * 0.44, s * 0.18, -s * 0.42, -s * 0.38);
    ctx.quadraticCurveTo(-s * 0.25, -s * 0.36, 0, -s * 0.5);
    ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    ctx.lineWidth = Math.max(1.5, s * 0.08); ctx.strokeStyle = edge || P.ink; ctx.stroke();
    ctx.restore();
  }

  function checkMark(ctx, x, y, r, ok) {
    ctx.save();
    circle(ctx, x, y, r);
    ctx.fillStyle = ok ? P.ok : P.danger; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = P.ink; ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = r * 0.28; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    if (ok) { ctx.moveTo(x - r * 0.45, y + r * 0.02); ctx.lineTo(x - r * 0.1, y + r * 0.38); ctx.lineTo(x + r * 0.5, y - r * 0.35); }
    else { ctx.moveTo(x - r * 0.38, y - r * 0.38); ctx.lineTo(x + r * 0.38, y + r * 0.38); ctx.moveTo(x + r * 0.38, y - r * 0.38); ctx.lineTo(x - r * 0.38, y + r * 0.38); }
    ctx.stroke();
    ctx.restore();
  }

  // 鍵帽(說明頁、HUD 操作提示共用)
  function keycap(ctx, x, y, label, w, h) {
    h = h || 34; w = w || Math.max(34, label.length * 18 + 14);
    ctx.save();
    rrect(ctx, x - w / 2, y - h / 2 + 3, w, h, 6); ctx.fillStyle = '#4a4e5e'; ctx.fill();
    rrect(ctx, x - w / 2, y - h / 2, w, h, 6); ctx.fillStyle = '#e9e9ef'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#1b1c24'; ctx.stroke();
    ctx.font = font(Math.round(h * 0.52), true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1b1c24'; ctx.fillText(label, x, y + 1);
    ctx.restore();
    return w;
  }

  // ---------- 魔物本體(地下城與表演場共用一套畫法) ----------
  // 原點 = 本體中心, r = 基準半徑, dir = 1 朝右 / -1 朝左
  function creature(ctx, sp, r, o) {
    o = o || {};
    var dir = o.dir === -1 ? -1 : 1;
    var col = SP[sp] || P.fire, dk = SP_DARK[sp] || '#333', lt = SP_LIGHT[sp] || '#fff';
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 14; }
    var outline = o.outline || P.ink;
    ctx.strokeStyle = outline; ctx.lineWidth = o.outlineW || 2.5;

    if (sp === 'fire') {
      // 尾巴
      ctx.beginPath();
      ctx.moveTo(-dir * r * 0.6, r * 0.05);
      ctx.quadraticCurveTo(-dir * r * 1.2, r * 0.3, -dir * r * 1.28, -r * 0.25);
      ctx.lineWidth = r * 0.42; ctx.strokeStyle = outline; ctx.stroke();
      ctx.lineWidth = r * 0.28; ctx.strokeStyle = col; ctx.stroke();
      ctx.lineWidth = o.outlineW || 2.5; ctx.strokeStyle = outline;
      // 腳
      ctx.fillStyle = dk;
      [-0.55, -0.15, 0.25, 0.6].forEach(function (k) {
        ctx.beginPath(); ctx.ellipse(dir * k * r, r * 0.55, r * 0.14, r * 0.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
      // 身體
      ctx.beginPath(); ctx.ellipse(0, r * 0.1, r * 0.92, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill(); ctx.stroke();
      // 背上火苗圓丘
      ctx.fillStyle = lt;
      [-0.45, 0, 0.45].forEach(function (k) { circle(ctx, dir * k * r, -r * 0.42, r * 0.17); ctx.fill(); });
      // 頭
      circle(ctx, dir * r * 0.82, -r * 0.18, r * 0.42); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
      eye(ctx, dir * r * 0.95, -r * 0.3, r * 0.15, o.angry, dir);
    } else if (sp === 'thunder') {
      // 翅膀
      ctx.fillStyle = dk;
      [-1, 1].forEach(function (s) {
        ctx.beginPath();
        ctx.moveTo(s * r * 0.4, -r * 0.05);
        ctx.lineTo(s * r * 1.28, -r * 0.85);
        ctx.lineTo(s * r * 1.05, -r * 0.2);
        ctx.lineTo(s * r * 1.2, r * 0.05);
        ctx.lineTo(s * r * 0.55, r * 0.35);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      // 身體
      circle(ctx, 0, r * 0.1, r * 0.7); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
      // 閃電冠羽
      ctx.beginPath();
      ctx.moveTo(-r * 0.2, -r * 0.5); ctx.lineTo(-r * 0.05, -r * 0.92); ctx.lineTo(r * 0.08, -r * 0.62); ctx.lineTo(r * 0.25, -r * 0.95); ctx.lineTo(r * 0.3, -r * 0.5);
      ctx.fillStyle = lt; ctx.fill(); ctx.stroke();
      // 喙
      ctx.beginPath(); ctx.moveTo(dir * r * 0.6, -r * 0.02); ctx.lineTo(dir * r * 1.0, r * 0.12); ctx.lineTo(dir * r * 0.6, r * 0.28); ctx.closePath();
      ctx.fillStyle = P.gold; ctx.fill(); ctx.stroke();
      eye(ctx, dir * r * 0.3, -r * 0.05, r * 0.16, o.angry, dir);
    } else if (sp === 'water') {
      // 觸手
      ctx.strokeStyle = col; ctx.lineWidth = r * 0.13;
      [-0.55, -0.2, 0.2, 0.55].forEach(function (k, i) {
        ctx.beginPath(); ctx.moveTo(k * r, r * 0.05);
        ctx.quadraticCurveTo(k * r + (i % 2 ? 1 : -1) * r * 0.22, r * 0.5, k * r, r * 0.95);
        ctx.stroke();
      });
      ctx.strokeStyle = outline; ctx.lineWidth = o.outlineW || 2.5;
      // 傘
      ctx.beginPath();
      ctx.arc(0, r * 0.05, r * 0.85, Math.PI, 0);
      for (var i = 0; i < 4; i++) {
        var x0 = r * 0.85 - i * r * 0.425;
        ctx.quadraticCurveTo(x0 - r * 0.21, r * 0.32, x0 - r * 0.425, r * 0.05);
      }
      ctx.closePath();
      ctx.fillStyle = col; ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.22, r * 0.12, -0.5, 0, Math.PI * 2); ctx.fill();
      eye(ctx, -r * 0.22 + dir * r * 0.1, -r * 0.12, r * 0.13, o.angry, dir);
      eye(ctx, r * 0.22 + dir * r * 0.1, -r * 0.12, r * 0.13, o.angry, dir);
    } else {
      // 石像鬼: 蝙蝠翼 + 方塊身 + 角
      ctx.fillStyle = dk;
      [-1, 1].forEach(function (s) {
        ctx.beginPath();
        ctx.moveTo(s * r * 0.6, -r * 0.3);
        ctx.quadraticCurveTo(s * r * 1.3, -r * 0.6, s * r * 1.2, r * 0.1);
        ctx.quadraticCurveTo(s * r * 1.0, -r * 0.05, s * r * 0.95, r * 0.25);
        ctx.quadraticCurveTo(s * r * 0.8, r * 0.1, s * r * 0.6, r * 0.3);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, -r * 0.5); ctx.lineTo(-r * 0.42, -r * 0.9); ctx.lineTo(-r * 0.22, -r * 0.55);
      ctx.moveTo(r * 0.5, -r * 0.5); ctx.lineTo(r * 0.42, -r * 0.9); ctx.lineTo(r * 0.22, -r * 0.55);
      ctx.fillStyle = lt; ctx.fill(); ctx.stroke();
      rrect(ctx, -r * 0.68, -r * 0.6, r * 1.36, r * 1.35, r * 0.25);
      ctx.fillStyle = col; ctx.fill(); ctx.stroke();
      // 石紋
      ctx.strokeStyle = dk; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-r * 0.5, r * 0.35); ctx.lineTo(r * 0.5, r * 0.35); ctx.moveTo(0, r * 0.35); ctx.lineTo(0, r * 0.7); ctx.stroke();
      eye(ctx, -r * 0.25 + dir * r * 0.08, -r * 0.15, r * 0.14, o.angry, dir);
      eye(ctx, r * 0.25 + dir * r * 0.08, -r * 0.15, r * 0.14, o.angry, dir);
    }
    ctx.restore();
    // 受擊白閃: 疊在本體上
    if (o.flash) {
      ctx.save();
      ctx.globalAlpha *= 0.65;
      ctx.fillStyle = '#ffffff';
      circle(ctx, 0, r * 0.05, r * 0.95); ctx.fill();
      ctx.restore();
    }
  }

  function eye(ctx, x, y, r, angry, dir) {
    ctx.save();
    circle(ctx, x, y, r); ctx.fillStyle = angry ? '#ffe0e0' : '#ffffff'; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = P.ink; ctx.stroke();
    circle(ctx, x + dir * r * 0.3, y, r * 0.5); ctx.fillStyle = angry ? P.danger : P.ink; ctx.fill();
    if (angry) {
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - r * 1.1, y - r * 1.3); ctx.lineTo(x + r * 1.1, y - r * 0.7); ctx.stroke();
    }
    ctx.restore();
  }

  // 失控的危險鋸齒圈(全畫面「鋸齒紅 = 失控 / 危險」)
  function dangerAura(ctx, cx, cy, r0, r1, n) {
    ctx.save();
    ctx.beginPath();
    for (var i = 0; i < n * 2; i++) {
      var a = i * Math.PI / n + now() * 1.5;
      var rr = i % 2 ? r0 : r1;
      ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,59,48,0.22)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = P.danger; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
  }

  // 怒氣條: 中心 (cx, cy), 寬 w; ghostFrom 給說明頁畫「掉了一截」
  function rageBar(ctx, cx, cy, w, rage, opts) {
    opts = opts || {};
    var h = 10, x0 = cx - w / 2, y0 = cy - h / 2;
    rage = clamp(rage || 0, 0, 100);
    var col = rage >= 80 ? P.rageHigh : rage >= 40 ? P.rageMid : P.rageLow;
    ctx.save();
    rrect(ctx, x0 - 2, y0 - 2, w + 4, h + 4, 4); ctx.fillStyle = P.ink; ctx.fill();
    rrect(ctx, x0, y0, w, h, 3); ctx.fillStyle = '#2a2c36'; ctx.fill();
    if (opts.ghostFrom != null && opts.ghostFrom > rage) {
      var gw = w * (clamp(opts.ghostFrom, 0, 100) - rage) / 100;
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect(x0 + w * rage / 100, y0, gw, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.setLineDash([3, 2]); ctx.lineWidth = 1.5;
      ctx.strokeRect(x0 + w * rage / 100, y0, gw, h); ctx.setLineDash([]);
    }
    if (rage > 0) { rrect(ctx, x0, y0, Math.max(4, w * rage / 100), h, 3); ctx.fillStyle = col; ctx.fill(); }
    if (rage >= 80 && rage < 100 && (Math.floor(now() * 4) % 2 === 0)) {
      rrect(ctx, x0, y0, w * rage / 100, h, 3); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
    }
    // 刻度: 40 點名門檻(白), 80 連鎖線(紅)
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(x0 + w * 0.4, y0 - 4); ctx.lineTo(x0 + w * 0.4, y0 + h + 4); ctx.stroke();
    ctx.strokeStyle = P.rageHigh;
    ctx.beginPath(); ctx.moveTo(x0 + w * 0.8, y0 - 4); ctx.lineTo(x0 + w * 0.8, y0 + h + 4); ctx.stroke();
    if (opts.edge) { rrect(ctx, x0 - 2, y0 - 2, w + 4, h + 4, 4); ctx.strokeStyle = opts.edge; ctx.lineWidth = 2.5; ctx.stroke(); }
    ctx.restore();
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

    // 地圖格 60x60, (x,y) 為格中心
    drawTile: function (ctx, s) {
      var x = s.x, y = s.y, h = 30;
      ctx.save();
      var floor = { crag: P.floorCrag, ruins: P.floorRuins, pond: P.floorPond, lava: P.floorLava, hall: P.floorHall }[s.zone] || P.floorHall;
      var kind = s.kind;
      if (kind === 'wall') {
        ctx.fillStyle = P.wall; ctx.fillRect(x - h, y - h, 60, 60);
        ctx.fillStyle = P.wallTop; ctx.fillRect(x - h + 3, y - h + 3, 54, 40);
        ctx.strokeStyle = P.wallEdge; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x - h + 3, y - 7); ctx.lineTo(x + h - 3, y - 7);
        ctx.moveTo(x, y - h + 3); ctx.lineTo(x, y - 7); ctx.stroke();
      } else {
        ctx.fillStyle = floor; ctx.fillRect(x - h, y - h, 60, 60);
        ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1;
        ctx.strokeRect(x - h + 0.5, y - h + 0.5, 59, 59);
        // 區域紋理(低對比, 只讓人分得出哪一區)
        if (s.zone === 'crag') {
          ctx.fillStyle = 'rgba(255,240,200,0.09)';
          circle(ctx, x - 12, y - 8, 4); ctx.fill(); circle(ctx, x + 14, y + 10, 3); ctx.fill(); circle(ctx, x + 4, y - 16, 2.5); ctx.fill();
        } else if (s.zone === 'ruins') {
          ctx.strokeStyle = 'rgba(200,210,255,0.09)';
          ctx.beginPath(); ctx.moveTo(x - h, y); ctx.lineTo(x + h, y); ctx.moveTo(x - 8, y - h); ctx.lineTo(x - 8, y); ctx.moveTo(x + 12, y); ctx.lineTo(x + 12, y + h); ctx.stroke();
        } else if (s.zone === 'pond') {
          ctx.strokeStyle = 'rgba(160,220,255,0.08)';
          ctx.beginPath(); ctx.arc(x, y + 6, 14, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
        } else if (s.zone === 'lava') {
          ctx.strokeStyle = 'rgba(255,120,60,0.12)';
          ctx.beginPath(); ctx.moveTo(x - 18, y - 14); ctx.lineTo(x - 4, y - 2); ctx.lineTo(x + 6, y + 16); ctx.stroke();
        }
        if (kind === 'water') {
          ctx.fillStyle = P.water; ctx.fillRect(x - h, y - h, 60, 60);
          ctx.strokeStyle = P.waterHi; ctx.lineWidth = 2; ctx.lineCap = 'round';
          var ph = (now() * 0.8 + (x + y) * 0.01) % 1;
          [[-14, -12], [8, 4], [-6, 18]].forEach(function (p, i) {
            var ox = p[0] + Math.sin((ph + i * 0.3) * Math.PI * 2) * 3;
            ctx.beginPath(); ctx.moveTo(x + ox - 8, y + p[1]); ctx.quadraticCurveTo(x + ox - 4, y + p[1] - 4, x + ox, y + p[1]); ctx.quadraticCurveTo(x + ox + 4, y + p[1] + 4, x + ox + 8, y + p[1]); ctx.stroke();
          });
        } else if (kind === 'lava') {
          ctx.fillStyle = P.lava; ctx.fillRect(x - h, y - h, 60, 60);
          var pulse = 0.5 + 0.5 * Math.sin(now() * 3 + x * 0.05);
          ctx.fillStyle = 'rgba(255,210,90,' + (0.25 + pulse * 0.3).toFixed(2) + ')';
          circle(ctx, x + 6, y - 4, 10); ctx.fill();
          ctx.fillStyle = P.lavaCrust;
          ctx.beginPath(); ctx.moveTo(x - 26, y - 22); ctx.lineTo(x - 10, y - 26); ctx.lineTo(x - 6, y - 12); ctx.lineTo(x - 22, y - 8); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(x + 10, y + 10); ctx.lineTo(x + 26, y + 8); ctx.lineTo(x + 24, y + 24); ctx.lineTo(x + 8, y + 24); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(x - 20, y + 14); ctx.lineTo(x - 8, y + 12); ctx.lineTo(x - 12, y + 24); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = P.lavaHi; ctx.lineWidth = 1.5; ctx.strokeRect(x - h + 1, y - h + 1, 58, 58);
        } else if (kind === 'pillar') {
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.beginPath(); ctx.ellipse(x + 3, y + 6, 24, 22, 0, 0, Math.PI * 2); ctx.fill();
          circle(ctx, x, y, 24); ctx.fillStyle = P.pillar; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
          circle(ctx, x - 2, y - 3, 17); ctx.fillStyle = P.pillarTop; ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5;
          circle(ctx, x - 2, y - 3, 10); ctx.stroke();
        }
        if (s.nest) {
          ctx.strokeStyle = P.nest; ctx.lineWidth = 3; ctx.lineCap = 'round';
          for (var i = 0; i < 10; i++) {
            var a = i * Math.PI / 5;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(a) * 16, y + 4 + Math.sin(a) * 10);
            ctx.lineTo(x + Math.cos(a + 0.5) * 22, y + 4 + Math.sin(a + 0.5) * 14);
            ctx.stroke();
          }
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.beginPath(); ctx.ellipse(x, y + 4, 13, 8, 0, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    },

    // 馴獸師 64x64, 判定半徑 18 = 身體圓
    drawTamer: function (ctx, s) {
      var dir = s.dir === -1 ? -1 : 1;
      ctx.save();
      ctx.translate(s.x, s.y);
      var blinkOff = s.blink && (Math.floor(now() * 10) % 2 === 0);
      if (s.blink) ctx.globalAlpha = blinkOff ? 0.3 : 0.85;
      // 影
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(0, 16, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
      // 背後的盾(不在彈反時機時)
      if (!s.guarding) {
        if (s.shieldReady) iconShield(ctx, -dir * 17, 4, 20, '#7fa8d8', P.ink);
        else {
          ctx.save(); ctx.globalAlpha *= 0.8;
          iconShield(ctx, -dir * 17, 4, 18, '#4a4e5c', '#24252e');
          ctx.restore();
        }
      }
      // 身體 = 判定圓 r18
      circle(ctx, 0, 0, 18); ctx.fillStyle = P.player; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = P.ink; ctx.stroke();
      // 背帶 + 繩圈
      ctx.strokeStyle = P.hat; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-12, -12); ctx.lineTo(12, 12); ctx.stroke();
      // 帽子
      ctx.fillStyle = P.hat;
      ctx.beginPath(); ctx.ellipse(0, -14, 20, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.stroke();
      rrect(ctx, -10, -27, 20, 14, 4); ctx.fill(); ctx.stroke();
      // 臉朝向
      circle(ctx, dir * 8, -4, 3); ctx.fillStyle = P.ink; ctx.fill();
      // 彈反時機: 全身白色護罩圈(任何方向都能彈) + 前方大盾
      if (s.guarding) {
        ctx.save();
        ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 12;
        circle(ctx, 0, 0, 28); ctx.lineWidth = 5; ctx.strokeStyle = P.parry; ctx.stroke();
        ctx.restore();
        circle(ctx, 0, 0, 28); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill();
        iconShield(ctx, dir * 16, 2, 26, '#dfeeff', P.ink);
      }
      ctx.restore();
    },

    // 野生魔物 90x90
    drawWildMonster: function (ctx, s) {
      var sp = s.species, dir = s.dir === -1 ? -1 : 1;
      ctx.save();
      ctx.translate(s.x + (s.hit ? (Math.floor(now() * 30) % 2 ? 2 : -2) : 0), s.y);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(0, 34, 26, 7, 0, 0, Math.PI * 2); ctx.fill();
      // 施法預備: 物種色光暈 + 下方色圈
      if (s.casting) {
        var pu = 0.5 + 0.5 * Math.sin(now() * 16);
        ctx.save();
        ctx.globalAlpha = 0.5 + pu * 0.5;
        ctx.beginPath(); ctx.ellipse(0, 30, 34, 10, 0, 0, Math.PI * 2);
        ctx.lineWidth = 3; ctx.strokeStyle = SP[sp]; ctx.stroke();
        ctx.restore();
      }
      ctx.save(); ctx.translate(0, 6);
      creature(ctx, sp, 26, { dir: dir, flash: s.hit, glow: s.casting ? SP[sp] : null, angry: s.casting });
      ctx.restore();
      // 血條: 30% 處的收服刻度; 殘血時填色換收服綠
      var w = 56, hy = -24, hp = clamp((s.hp || 0) / (s.maxHp || 1), 0, 1);
      rrect(ctx, -w / 2 - 2, hy - 2, w + 4, 9, 3); ctx.fillStyle = P.ink; ctx.fill();
      rrect(ctx, -w / 2, hy, w, 5, 2); ctx.fillStyle = '#2a2c36'; ctx.fill();
      if (hp > 0) { rrect(ctx, -w / 2, hy, Math.max(3, w * hp), 5, 2); ctx.fillStyle = s.weak ? P.capture : '#e8e8ee'; ctx.fill(); }
      ctx.strokeStyle = P.capture; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-w / 2 + w * 0.3, hy - 3); ctx.lineTo(-w / 2 + w * 0.3, hy + 8); ctx.stroke();
      // 捕捉記號(套索)
      if (s.weak) {
        var b = 1 + 0.12 * Math.sin(now() * 8);
        ctx.save();
        ctx.translate(0, -35); ctx.scale(b, b);
        circle(ctx, 0, 0, 8); ctx.fillStyle = 'rgba(63,224,138,0.25)'; ctx.fill();
        ctx.lineWidth = 3.5; ctx.strokeStyle = P.ink; ctx.stroke();
        ctx.lineWidth = 2.5; ctx.strokeStyle = P.capture; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6, 5); ctx.quadraticCurveTo(10, 8, 9, 2); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    },

    // 技能: 地下城與表演場共用
    drawHazard: function (ctx, s) {
      var kind = s.kind, t = s.t || 0;
      ctx.save();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (kind === 'firering') {
        var R = s.radius || 120;
        var col = P.fire;
        if (s.phase === 'warn') {
          var p = clamp(t / WARN_DUR.firering, 0, 1);
          circle(ctx, s.x, s.y, R * p); ctx.fillStyle = 'rgba(236,74,44,0.28)'; ctx.fill();
          ctx.setLineDash([12, 8]); circle(ctx, s.x, s.y, R - 2); ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
          ctx.setLineDash([]);
        } else {
          var g = ctx.createRadialGradient(s.x, s.y, R * 0.2, s.x, s.y, R);
          g.addColorStop(0, 'rgba(255,210,90,0.25)'); g.addColorStop(0.75, 'rgba(255,106,26,0.5)'); g.addColorStop(1, 'rgba(236,74,44,0.75)');
          circle(ctx, s.x, s.y, R); ctx.fillStyle = g; ctx.fill();
          // 邊緣火舌(圓丘, 不畫尖刺)
          var n = Math.max(10, Math.round(R / 10));
          ctx.fillStyle = P.lavaHi;
          for (var i = 0; i < n; i++) {
            var a = i * Math.PI * 2 / n + t * 2;
            var rr = R - 8 - 4 * Math.sin(t * 12 + i);
            circle(ctx, s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr, 5); ctx.fill();
          }
          circle(ctx, s.x, s.y, R - 2); ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
        }
      } else if (kind === 'thunder') {
        var cx = s.tx != null ? s.tx : s.x, cy = s.ty != null ? s.ty : s.y;
        var R2 = s.radius || 70;
        if (s.phase === 'warn') {
          var p2 = clamp(t / WARN_DUR.thunder, 0, 1);
          if (s.tx != null) {
            ctx.setLineDash([4, 8]); ctx.strokeStyle = 'rgba(198,224,42,0.55)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(cx, cy); ctx.stroke(); ctx.setLineDash([]);
          }
          circle(ctx, cx, cy, R2 * p2); ctx.fillStyle = 'rgba(198,224,42,0.3)'; ctx.fill();
          ctx.setLineDash([10, 7]); circle(ctx, cx, cy, R2 - 2); ctx.lineWidth = 4; ctx.strokeStyle = P.thunder; ctx.stroke(); ctx.setLineDash([]);
          ctx.strokeStyle = P.thunder; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy + 12); ctx.stroke();
        } else {
          var al = clamp(1 - t / 0.4, 0.2, 1);
          ctx.globalAlpha = al;
          circle(ctx, cx, cy, R2); ctx.fillStyle = 'rgba(242,255,160,0.55)'; ctx.fill();
          ctx.lineWidth = 4; ctx.strokeStyle = P.thunder; ctx.stroke();
          // 閃電(從上方劈下, 長度限在半徑 x3 內)
          var top = cy - R2 * 3;
          ctx.beginPath();
          ctx.moveTo(cx + 10, top);
          ctx.lineTo(cx - 14, top + R2 * 1.0);
          ctx.lineTo(cx + 8, top + R2 * 1.4);
          ctx.lineTo(cx - 10, top + R2 * 2.2);
          ctx.lineTo(cx + 4, top + R2 * 2.4);
          ctx.lineTo(cx, cy);
          ctx.lineWidth = 10; ctx.strokeStyle = P.thunder; ctx.stroke();
          ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        }
      } else if (kind === 'quake') {
        var R3 = s.radius != null ? s.radius : 0;
        if (s.phase === 'warn') {
          ctx.setLineDash([8, 6]); circle(ctx, s.x, s.y, 40); ctx.lineWidth = 3; ctx.strokeStyle = P.stone; ctx.stroke(); ctx.setLineDash([]);
        } else if (R3 > 0) {
          circle(ctx, s.x, s.y, R3); ctx.lineWidth = 30; ctx.strokeStyle = 'rgba(192,96,224,0.45)'; ctx.stroke();
          circle(ctx, s.x, s.y, R3 + 15); ctx.lineWidth = 3; ctx.strokeStyle = P.stone; ctx.stroke();
          circle(ctx, s.x, s.y, Math.max(0.5, R3 - 15)); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(232,184,255,0.8)'; ctx.stroke();
          // 碎石
          ctx.fillStyle = '#e8b8ff';
          for (var k = 0; k < 10; k++) {
            var a3 = k * Math.PI / 5 + 0.3;
            ctx.fillRect(s.x + Math.cos(a3) * R3 - 3, s.y + Math.sin(a3) * R3 - 3, 6, 6);
          }
        }
      } else if (kind === 'waterball') {
        var ang = s.angle || 0;
        ctx.translate(s.x, s.y); ctx.rotate(ang);
        ctx.fillStyle = 'rgba(58,134,255,0.35)';
        ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-6, -9); ctx.lineTo(-6, 9); ctx.closePath(); ctx.fill();
        circle(ctx, 0, 0, 12); ctx.fillStyle = P.water_sp; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = '#dbeaff'; ctx.stroke();
        circle(ctx, 3, -4, 3.5); ctx.fillStyle = '#ffffff'; ctx.fill();
      }
      ctx.restore();
    },

    // 彈反成功特效: counter = 白色鋸齒光束 + 爆星; capture = 收服綠的套索繩 + 目標套圈
    drawParryFlash: function (ctx, s) {
      var t = s.t || 0, life = 0.5;
      var al = clamp(1 - t / life, 0, 1);
      if (al <= 0) return;
      ctx.save();
      ctx.globalAlpha = al;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      var dx = s.tx - s.x, dy = s.ty - s.y, L = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / L, ny = dx / L;
      if (s.result === 'capture') {
        // 繩: 波浪線
        ctx.beginPath();
        for (var i = 0; i <= 24; i++) {
          var k = i / 24, w = Math.sin(k * Math.PI * 6) * 5 * (1 - k * 0.5);
          var px = s.x + dx * k + nx * w, py = s.y + dy * k + ny * w;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.lineWidth = 7; ctx.strokeStyle = P.ink; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = P.capture; ctx.stroke();
        // 目標套圈(收緊)
        var lr = 34 - 14 * clamp(t / 0.3, 0, 1);
        circle(ctx, s.tx, s.ty, lr); ctx.lineWidth = 7; ctx.strokeStyle = P.ink; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = P.capture; ctx.stroke();
        // 馴獸師身上的綠圈
        circle(ctx, s.x, s.y, 26 + t * 30); ctx.lineWidth = 3; ctx.strokeStyle = P.capture; ctx.stroke();
      } else {
        // 光束: 鋸齒白光
        ctx.beginPath(); ctx.moveTo(s.x, s.y);
        var seg = Math.max(4, Math.round(L / 30));
        for (var j = 1; j < seg; j++) {
          var kk = j / seg, off = (j % 2 ? 1 : -1) * 8;
          ctx.lineTo(s.x + dx * kk + nx * off, s.y + dy * kk + ny * off);
        }
        ctx.lineTo(s.tx, s.ty);
        ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.stroke();
        ctx.lineWidth = 3.5; ctx.strokeStyle = P.parry; ctx.stroke();
        // 馴獸師處爆星
        starPath(ctx, s.x, s.y, 30 + t * 30);
        ctx.lineWidth = 3; ctx.strokeStyle = P.parry; ctx.stroke();
        // 命中處白圈
        circle(ctx, s.tx, s.ty, 14 + t * 50); ctx.lineWidth = 4; ctx.strokeStyle = P.parry; ctx.stroke();
      }
      ctx.restore();
    },

    // 表演場 / 排位場地
    drawShowArena: function (ctx, s) {
      var show = s.stage === 'show';
      ctx.save();
      ctx.fillStyle = '#17121a'; ctx.fillRect(0, 120, 720, 1160);
      // 觀眾席看台(上 130~250, 下 1020~1140)
      [130, 1020].forEach(function (y0) {
        rrect(ctx, 30, y0, 660, 120, 14); ctx.fillStyle = '#211d29'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#3a3346'; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
        for (var r = 1; r < 3; r++) { ctx.beginPath(); ctx.moveTo(40, y0 + r * 40); ctx.lineTo(680, y0 + r * 40); ctx.stroke(); }
      });
      // 圓形舞台
      var cx = 360, cy = 635;
      if (show) {
        var g = ctx.createRadialGradient(cx, cy, 40, cx, cy, 330);
        g.addColorStop(0, '#4a2a3c'); g.addColorStop(1, '#2a1824');
        circle(ctx, cx, cy, 320); ctx.fillStyle = g; ctx.fill();
      } else {
        circle(ctx, cx, cy, 320); ctx.fillStyle = '#251b24'; ctx.fill();
      }
      ctx.lineWidth = 6; ctx.strokeStyle = show ? '#7a3f5c' : '#4a3344'; ctx.stroke();
      circle(ctx, cx, cy, 230); ctx.lineWidth = 2; ctx.setLineDash([6, 10]); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.stroke(); ctx.setLineDash([]);
      circle(ctx, cx, cy, 120); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fill();
      if (!show) text(ctx, '排位中', cx, cy, 26, 'rgba(255,255,255,0.22)', 'center', true, false);
      ctx.restore();
    },

    // 台座 120x120
    drawPedestal: function (ctx, s) {
      var x = s.x, y = s.y;
      ctx.save();
      // 台座盤
      circle(ctx, x, y + 4, 50); ctx.fillStyle = '#1a141c'; ctx.fill();
      circle(ctx, x, y, 50); ctx.fillStyle = s.occupied ? '#5a4a5e' : '#3a3240'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = s.occupied ? '#8a7690' : '#5a4e62'; ctx.stroke();
      circle(ctx, x, y, 40); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.stroke();
      if (!s.occupied) {
        ctx.setLineDash([6, 6]); circle(ctx, x, y, 30); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.stroke(); ctx.setLineDash([]);
        text(ctx, '空', x, y, 20, 'rgba(255,255,255,0.35)', 'center', true, false);
      }
      // 編號(左下角小字)
      text(ctx, String((s.index | 0) + 1), x - 46, y + 46, 17, P.textDim, 'center', true);
      // 拿起來源: 白虛線圓
      if (s.heldFrom) {
        ctx.setLineDash([8, 6]); circle(ctx, x, y, 56); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke(); ctx.setLineDash([]);
      }
      // 選中: 白色粗角框 + 外光
      if (s.selected) {
        ctx.save();
        ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10;
        ctx.strokeStyle = P.select; ctx.lineWidth = 5; ctx.lineCap = 'round';
        var h = 56, c = 22;
        ctx.beginPath();
        ctx.moveTo(x - h, y - h + c); ctx.lineTo(x - h, y - h); ctx.lineTo(x - h + c, y - h);
        ctx.moveTo(x + h - c, y - h); ctx.lineTo(x + h, y - h); ctx.lineTo(x + h, y - h + c);
        ctx.moveTo(x + h, y + h - c); ctx.lineTo(x + h, y + h); ctx.lineTo(x + h - c, y + h);
        ctx.moveTo(x - h + c, y + h); ctx.lineTo(x - h, y + h); ctx.lineTo(x - h, y + h - c);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    },

    // 表演場 / 排位的魔物 100x100(含怒氣條)
    drawShowMonster: function (ctx, s) {
      var sp = s.species, dir = s.dir === -1 ? -1 : 1, mode = s.mode || 'stand';
      var rage = clamp(s.rage || 0, 0, 100);
      var wild = mode === 'charge' || mode === 'loose';
      ctx.save();
      ctx.translate(s.x, s.y);
      var by = -4;
      if (wild) dangerAura(ctx, 0, by, 38, 46, 9);
      if (s.performing) {
        ctx.save();
        circle(ctx, 0, by, 44); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = SP[sp]; ctx.stroke();
        circle(ctx, 0, by, 38); ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        ctx.restore();
      }
      if (mode === 'held') {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath(); ctx.ellipse(0, 25, 24, 4, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.save();
      ctx.translate(0, by);
      if (mode === 'charge') ctx.rotate(dir * 0.18);
      if (s.performing) ctx.scale(1.06, 1.06);
      creature(ctx, sp, 28, {
        dir: dir, angry: wild || rage >= 80,
        outline: mode === 'held' ? '#ffffff' : null, outlineW: mode === 'held' ? 3.5 : null,
        glow: mode === 'held' ? '#ffffff' : null,
      });
      ctx.restore();
      // 被點燃 / 被澆熄 / 吃點心: 貼著本體與怒氣條外框
      var edge = null;
      if (s.fx === 'ignited') {
        edge = P.rageMid;
        ctx.fillStyle = P.rageMid; ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
        [-1, 1].forEach(function (sd) {
          ctx.beginPath();
          ctx.moveTo(sd * 38, 2); ctx.quadraticCurveTo(sd * 46, -8, sd * 40, -22);
          ctx.quadraticCurveTo(sd * 32, -10, sd * 38, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
        });
      } else if (s.fx === 'doused') {
        edge = P.water_sp;
        ctx.fillStyle = P.water_sp; ctx.strokeStyle = '#dbeaff'; ctx.lineWidth = 1.5;
        [[-38, -30], [38, -30], [30, -42]].forEach(function (p) {
          ctx.beginPath(); ctx.moveTo(p[0], p[1] - 6); ctx.quadraticCurveTo(p[0] + 5, p[1] + 2, p[0], p[1] + 4); ctx.quadraticCurveTo(p[0] - 5, p[1] + 2, p[0], p[1] - 6); ctx.fill(); ctx.stroke();
        });
      } else if (s.fx === 'fed') {
        edge = P.snack;
        iconSnack(ctx, dir * 34, -14, 26);
        ctx.fillStyle = P.snack;
        circle(ctx, dir * 24, 2, 2.5); ctx.fill(); circle(ctx, dir * 30, 8, 2); ctx.fill();
      }
      // 怒氣條
      rageBar(ctx, 0, 36, 84, rage, { edge: edge });
      // 連鎖序號
      if (s.performing && (s.chainStep | 0) >= 1) {
        text(ctx, '×' + ((s.chainStep | 0) + 1), 0, -40, 20, '#ffffff', 'center', true, P.rageMid);
      }
      ctx.restore();
    },

    // 觀眾 60x90(含座位)
    drawVisitor: function (ctx, s) {
      var x = s.x, y = s.y, mode = s.mode || 'watch';
      var shirts = ['#7d6b8f', '#6f8b7a', '#8f7d6b', '#6b7f8f', '#8f6b7a', '#7a8f6b'];
      var shirt = shirts[(s.seat | 0) % shirts.length];
      ctx.save();
      ctx.translate(x, y);
      // 座位
      rrect(ctx, -24, 18, 48, 22, 5); ctx.fillStyle = P.seat; ctx.fill();
      rrect(ctx, -24, 18, 48, 8, 4); ctx.fillStyle = P.seatTop; ctx.fill();
      if (mode === 'empty') {
        ctx.setLineDash([4, 5]); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2;
        circle(ctx, 0, -20, 10); ctx.stroke();
        rrect(ctx, -14, -8, 28, 26, 8); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        return;
      }
      if (mode === 'scared') {
        ctx.rotate(0.22);
        ctx.globalAlpha = 0.9;
        // 身體(變白)
        rrect(ctx, -13, -8, 26, 28, 9); ctx.fillStyle = '#b8bcc8'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
        ctx.strokeStyle = '#b8bcc8'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(-20, -30); ctx.moveTo(10, -4); ctx.lineTo(18, -32); ctx.stroke();
        circle(ctx, 0, -20, 11); ctx.fillStyle = '#e8e2d8'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
        circle(ctx, -4, -22, 2); ctx.fillStyle = P.ink; ctx.fill(); circle(ctx, 4, -22, 2); ctx.fill();
        circle(ctx, 0, -15, 3); ctx.fill();
        ctx.fillStyle = '#9fd0ff';
        ctx.beginPath(); ctx.moveTo(14, -34); ctx.quadraticCurveTo(19, -26, 14, -24); ctx.quadraticCurveTo(9, -26, 14, -34); ctx.fill();
        ctx.restore();
        return;
      }
      // watch
      rrect(ctx, -13, -8, 26, 28, 9); ctx.fillStyle = shirt; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
      circle(ctx, 0, -20, 11); ctx.fillStyle = '#e8c9a8'; ctx.fill(); ctx.stroke();
      circle(ctx, -4, -21, 1.8); ctx.fillStyle = P.ink; ctx.fill(); circle(ctx, 4, -21, 1.8); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -17, 4, 0.2, Math.PI - 0.2); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    },

    // 「連鎖 ×N」: 舞台中央(台座圈內空地), 約 2.2 秒自己淡出
    drawChainBanner: function (ctx, s) {
      var n = s.count | 0, t = s.t || 0;
      if (n < 2) return;
      var pop = t < 0.2 ? 0.6 + 0.4 * (t / 0.2) * 1.15 : (t < 0.3 ? 1.15 - 0.15 * ((t - 0.2) / 0.1) : 1);
      var al = t < 1.6 ? 1 : clamp(1 - (t - 1.6) / 0.6, 0, 1);
      if (al <= 0) return;
      var lvl = n >= 4 ? 2 : n === 3 ? 1 : 0;
      var col = [P.rageMid, '#ff7a2a', '#ff4fb0'][lvl];
      var px = [52, 62, 72][lvl];
      ctx.save();
      ctx.globalAlpha = al;
      ctx.translate(360, 635);
      ctx.scale(pop, pop);
      if (lvl >= 1) {
        ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
        var rays = lvl === 2 ? 16 : 10;
        for (var i = 0; i < rays; i++) {
          var a = i * Math.PI * 2 / rays + t * 0.8;
          ctx.beginPath(); ctx.moveTo(Math.cos(a) * 120, Math.sin(a) * 70); ctx.lineTo(Math.cos(a) * 150, Math.sin(a) * 92); ctx.stroke();
        }
      }
      rrect(ctx, -140, -48, 280, 96, 22);
      ctx.fillStyle = 'rgba(12,10,16,0.72)'; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
      text(ctx, '連鎖 ×' + n, 0, 2, px, '#ffffff', 'center', true, col);
      ctx.restore();
    },

    drawTitleCard: function (ctx, s) {
      var dun = s.stage === 'dungeon';
      ctx.save();
      ctx.fillStyle = 'rgba(8,8,12,0.88)'; ctx.fillRect(0, 0, 720, 1280);
      text(ctx, '第 ' + (s.day || 1) + ' 天', 360, 430, 40, P.textDim, 'center', true);
      text(ctx, dun ? '地下城' : '表演場', 360, 520, 84, '#ffffff', 'center', true);
      // 小景: 呼叫遊戲內畫法
      ctx.save();
      if (dun) {
        Art.drawTamer(ctx, { x: 300, y: 690, dir: 1, guarding: true, shieldReady: true, blink: false });
        Art.drawWildMonster(ctx, { x: 440, y: 680, species: 'water', hp: 7, maxHp: 7, hit: false, weak: false, casting: false, dir: -1 });
        Art.drawHazard(ctx, { x: 340, y: 688, kind: 'waterball', phase: 'active', angle: Math.PI, t: 0 });
      } else {
        Art.drawPedestal(ctx, { x: 360, y: 690, index: 0, occupied: true, selected: true, heldFrom: false });
        Art.drawShowMonster(ctx, { x: 360, y: 690, species: 'fire', rage: 70, mode: 'stand', performing: true, fx: 'none', chainStep: 0, dir: 1 });
      }
      ctx.restore();
      text(ctx, dun ? '彈反魔物的攻擊, 殘血時收服' : '把牠們養到夠氣, 點名引爆連鎖', 360, 820, 24, P.text, 'center', false);
      keycap(ctx, 270, 920, '空白', 84, 44);
      text(ctx, '開始', 360, 920, 30, '#ffffff', 'left', true);
      ctx.restore();
    },

    // 商店項目 600x140
    drawShopItem: function (ctx, s) {
      var x = s.x, y = s.y;
      var info = {
        heavyShield: { name: '重盾', desc: '反擊力 +1' },
        ropeBag: { name: '繩袋', desc: '每天捕獸繩 +1' },
        armor: { name: '護甲', desc: '心數 +1' },
        snackPack: { name: '點心包', desc: '點心 +2' },
      }[s.item] || { name: String(s.item), desc: '' };
      ctx.save();
      var x0 = x - 296, y0 = y - 66;
      ctx.globalAlpha = s.affordable ? 1 : 0.55;
      rrect(ctx, x0, y0, 592, 132, 16);
      ctx.fillStyle = s.selected ? '#2e3142' : '#1f2029'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#3a3d4c'; ctx.stroke();
      // 圖示
      circle(ctx, x0 + 70, y, 44); ctx.fillStyle = '#14151b'; ctx.fill();
      if (s.item === 'heavyShield') iconShield(ctx, x0 + 70, y, 56, '#dfeeff', P.ink);
      else if (s.item === 'ropeBag') iconRope(ctx, x0 + 70, y, 60, true);
      else if (s.item === 'armor') iconHeart(ctx, x0 + 70, y + 4, 62, true);
      else iconSnack(ctx, x0 + 70, y, 62);
      text(ctx, info.name, x0 + 136, y - 22, 32, '#ffffff', 'left', true);
      text(ctx, info.desc, x0 + 136, y + 22, 22, P.textDim, 'left', false, false);
      if ((s.level | 0) > 0) text(ctx, '已買 ' + (s.level | 0), x0 + 330, y - 22, 18, P.textDim, 'left', true, false);
      // 價格
      iconCoin(ctx, x0 + 450, y, 34);
      text(ctx, String(s.cost), x0 + 476, y + 1, 36, s.affordable ? P.gold : P.danger, 'left', true);
      ctx.globalAlpha = 1;
      if (s.selected) {
        ctx.save();
        ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10;
        rrect(ctx, x0, y0, 592, 132, 16); ctx.lineWidth = 5; ctx.strokeStyle = P.select; ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    },

    // 按鈕(x,y 為左上角)
    drawButton: function (ctx, s) {
      ctx.save();
      var x = s.x, y = s.y, w = s.w, h = s.h;
      rrect(ctx, x + 3, y + 3, w - 6, h - 6, 14);
      ctx.fillStyle = s.selected ? '#3d6b52' : '#23252f'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = s.selected ? '#5fa47c' : '#3a3d4c'; ctx.stroke();
      text(ctx, s.label || '', x + w / 2, y + h / 2, Math.min(40, Math.round(h * 0.42)), s.selected ? '#ffffff' : P.textDim, 'center', true);
      if (s.selected) {
        ctx.save();
        ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10;
        rrect(ctx, x + 3, y + 3, w - 6, h - 6, 14); ctx.lineWidth = 5; ctx.strokeStyle = P.select; ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    },

    // 飄字: 1 秒內上浮 40 並淡出
    drawFloatText: function (ctx, s) {
      var t = s.t || 0, life = 1.0;
      var al = clamp(1 - Math.max(0, t - 0.5) / (life - 0.5), 0, 1);
      if (al <= 0) return;
      var y = s.y - 40 * clamp(t / life, 0, 1);
      var kind = s.kind;
      ctx.save();
      ctx.globalAlpha = al;
      var str = String(s.text || '');
      if (kind === 'hint') {
        ctx.font = font(22, true);
        var w = ctx.measureText(str).width + 28;
        rrect(ctx, s.x - w / 2, y - 18, w, 36, 18); ctx.fillStyle = 'rgba(12,12,18,0.85)'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = P.textDim; ctx.stroke();
        text(ctx, str, s.x, y, 22, P.text, 'center', true, false);
      } else {
        var col = { gold: P.gold, repUp: P.rep, repDown: P.danger, snack: P.snack }[kind] || P.text;
        ctx.font = font(26, true);
        var tw = ctx.measureText(str).width;
        var ix = s.x - tw / 2 - 14;
        if (kind === 'gold') iconCoin(ctx, ix, y, 22);
        else if (kind === 'repUp') iconStar(ctx, ix, y, 24, P.rep);
        else if (kind === 'repDown') iconStar(ctx, ix, y, 24, P.danger);
        else if (kind === 'snack') iconSnack(ctx, ix, y, 26);
        text(ctx, str, s.x + 4, y, 26, col, 'center', true);
      }
      ctx.restore();
    },

    drawResultPanel: function (ctx, s) {
      ctx.save();
      ctx.fillStyle = 'rgba(8,8,12,0.92)'; ctx.fillRect(0, 0, 720, 1280);
      text(ctx, '三天巡演結束', 360, 200, 48, '#ffffff', 'center', true);
      var stars = clamp(s.stars | 0, 0, 3);
      for (var i = 0; i < 3; i++) iconStar(ctx, 220 + i * 140, 340, 110, P.gold, i >= stars);
      rrect(ctx, 80, 440, 560, 300, 20); ctx.fillStyle = '#1c1d26'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#33364a'; ctx.stroke();
      var rows = [
        ['名聲', String(s.rep | 0), P.rep],
        ['累計金幣', String(s.goldEarned | 0), P.gold],
        ['最長連鎖', '×' + (s.bestChain | 0), P.rageMid],
      ];
      rows.forEach(function (r, k) {
        var yy = 500 + k * 85;
        text(ctx, r[0], 130, yy, 30, P.textDim, 'left', true, false);
        text(ctx, r[1], 590, yy, 44, r[2], 'right', true);
      });
      iconStar(ctx, 400, 500, 34, P.rep);
      iconCoin(ctx, 400, 585, 32);
      text(ctx, '陣容', 360, 800, 26, P.textDim, 'center', true, false);
      var roster = s.roster || [];
      for (var j = 0; j < 6; j++) {
        var cx = 110 + j * 100, cy = 880;
        circle(ctx, cx, cy, 42); ctx.fillStyle = '#23252f'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#3a3d4c'; ctx.stroke();
        if (roster[j]) { ctx.save(); ctx.translate(cx, cy); creature(ctx, roster[j], 22, { dir: 1 }); ctx.restore(); }
        else text(ctx, '空', cx, cy, 20, '#4a4e5e', 'center', true, false);
      }
      keycap(ctx, 270, 1080, '空白', 84, 44);
      text(ctx, '重來', 360, 1080, 30, '#ffffff', 'left', true);
      ctx.restore();
    },

    drawHud: function (ctx, s) {
      var ph = s.phase;
      if (ph === 'guide' || ph === 'title' || ph === 'result') return;
      ctx.save();
      ctx.fillStyle = P.hudBg; ctx.fillRect(0, 0, 720, 120);
      ctx.strokeStyle = P.hudLine; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 119); ctx.lineTo(720, 119); ctx.stroke();
      var stageName = { dungeon: '地下城', prep: '排位', show: '表演場', shop: '商店' }[ph] || '';
      text(ctx, '第 ' + (s.day || 1) + ' 天 ' + stageName, 20, 28, 24, P.text, 'left', true);
      // 計時(地下城 / 表演場)
      if ((ph === 'dungeon' || ph === 'show') && s.timeLeft != null) {
        var tl = Math.max(0, Math.ceil(s.timeLeft));
        text(ctx, String(tl), 360, 30, 42, tl <= 10 ? P.danger : '#ffffff', 'center', true);
      }
      // 金幣 / 名聲
      iconCoin(ctx, 520, 28, 26);
      text(ctx, String(s.gold | 0), 540, 29, 26, P.gold, 'left', true);
      iconStar(ctx, 622, 28, 28, P.rep);
      text(ctx, String(s.rep | 0), 640, 29, 26, P.rep, 'left', true);
      // 第二列
      var y2 = 72;
      if (ph === 'dungeon' || ph === 'shop') {
        var mh = s.maxHearts | 0, hh = s.hearts | 0, rm = s.ropeMax | 0, rn = s.ropes | 0;
        // 強化後心 / 繩變多時等比壓縮間距, 不擠進右側陣容格(x 480 起)
        var need = mh * 30 + 18 + rm * 28 + 24 + 60;
        var k2 = Math.min(1, 440 / Math.max(1, need));
        var hs = 30 * k2, rs = 28 * k2;
        for (var i = 0; i < mh; i++) iconHeart(ctx, 32 + i * hs, y2, 26 * Math.max(0.8, k2), i < hh);
        var rx = 32 + mh * hs + 18 * k2;
        for (var j = 0; j < rm; j++) iconRope(ctx, rx + j * rs, y2, 26 * Math.max(0.8, k2), ph === 'shop' || j < rn);
        var sx = rx + rm * rs + 20 * k2;
        iconSnack(ctx, sx, y2, 30);
        text(ctx, '×' + (s.snacks | 0), sx + 18, y2 + 1, 22, P.snack, 'left', true);
      } else {
        iconSnack(ctx, 34, y2, 34);
        text(ctx, '點心 ×' + (s.snacks | 0), 56, y2 + 1, 24, P.snack, 'left', true);
      }
      // 陣容(地下城 / 商店): 6 小格
      if (ph === 'dungeon' || ph === 'shop') {
        var roster = s.roster || [];
        for (var k = 0; k < 6; k++) {
          var cx = 498 + k * 38;
          circle(ctx, cx, y2, 16); ctx.fillStyle = '#1e2029'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#3a3d4c'; ctx.stroke();
          if (roster[k]) { ctx.save(); ctx.translate(cx, y2); creature(ctx, roster[k], 10, { dir: 1, outlineW: 1.2 }); ctx.restore(); }
        }
      }
      // 訊息
      if (s.message) {
        ctx.font = font(19, true);
        var w = Math.min(700, ctx.measureText(s.message).width + 30);
        rrect(ctx, 360 - w / 2, 92, w, 26, 13); ctx.fillStyle = 'rgba(255,178,30,0.16)'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = P.rageMid; ctx.stroke();
        text(ctx, s.message, 360, 105, 19, '#ffe2a8', 'center', true, false);
      }
      // 底部操作提示(固定位置, 由 HUD 畫)
      if (ph === 'prep') {
        hintRow(ctx, 1264, [['←→', '選擇'], ['空白', '拿起 / 放下']], 24);
      } else if (ph === 'show') {
        hintRow(ctx, 1210, [['←→', '選台座'], ['空白', '表演'], ['↓', '餵點心']]);
      } else if (ph === 'shop') {
        hintRow(ctx, 1260, [['↑↓', '選擇'], ['空白', '確定']]);
      }
      ctx.restore();
    },

    // 說明頁示意圖(只畫在 x,y,w,h 框內; 標題、說明文字、頁碼由 RD 畫)
    drawGuidePage: function (ctx, s) {
      var VW = 600, VH = 600;
      var sc = Math.min(s.w / VW, s.h / VH);
      ctx.save();
      ctx.beginPath(); ctx.rect(s.x, s.y, s.w, s.h); ctx.clip();
      ctx.translate(s.x + (s.w - VW * sc) / 2, s.y + (s.h - VH * sc) / 2);
      ctx.scale(sc, sc);
      rrect(ctx, 0, 0, VW, VH, 18); ctx.fillStyle = '#1b1c24'; ctx.fill();
      var pg = GUIDE[s.page | 0];
      if (pg) pg(ctx);
      ctx.restore();
    },
  };

  function hintRow(ctx, y, items, kh) {
    kh = kh || 32;
    var fs = kh >= 30 ? 22 : 19;
    ctx.save();
    ctx.font = font(fs, true);
    var parts = items.map(function (it) {
      var kw = Math.max(40, it[0].length * 20 + 14);
      return { k: it[0], kw: kw, l: it[1], lw: ctx.measureText(it[1]).width };
    });
    var gap = 34, total = 0;
    parts.forEach(function (p, i) { total += p.kw + 10 + p.lw + (i ? gap : 0); });
    var x = 360 - total / 2;
    parts.forEach(function (p, i) {
      if (i) x += gap;
      keycap(ctx, x + p.kw / 2, y - 1, p.k, p.kw, kh);
      x += p.kw + 10;
      text(ctx, p.l, x, y + 1, fs, P.text, 'left', true, false);
      x += p.lw;
    });
    ctx.restore();
  }

  function label(ctx, s, x, y, col) { text(ctx, s, x, y, 24, col || P.text, 'center', true); }

  function miniFloor(ctx, x, y, w, h) {
    rrect(ctx, x, y, w, h, 12); ctx.fillStyle = P.floorHall; ctx.fill();
  }

  function arrowKeys(ctx, x, y) {
    keycap(ctx, x, y - 20, '↑', 34, 30);
    keycap(ctx, x - 38, y + 16, '←', 34, 30);
    keycap(ctx, x, y + 16, '↓', 34, 30);
    keycap(ctx, x + 38, y + 16, '→', 34, 30);
  }

  var GUIDE = [
    // 第 1 頁 彈反: 左 時機對 ✓ / 右 太早 ✗
    function (ctx) {
      miniFloor(ctx, 14, 14, 278, 480);
      miniFloor(ctx, 308, 14, 278, 480);
      // 左
      Art.drawWildMonster(ctx, { x: 150, y: 110, species: 'water', hp: 4, maxHp: 7, hit: true, weak: false, casting: false, dir: 1 });
      dotted(ctx, 150, 150, 150, 340);
      Art.drawTamer(ctx, { x: 150, y: 380, dir: 1, guarding: true, shieldReady: false, blink: false });
      Art.drawHazard(ctx, { x: 150, y: 350, kind: 'waterball', phase: 'active', angle: Math.PI / 2, t: 0 });
      Art.drawParryFlash(ctx, { x: 150, y: 380, tx: 150, ty: 116, result: 'counter', t: 0.08 });
      label(ctx, '打到時按', 150, 455);
      checkMark(ctx, 262, 44, 22, true);
      // 右
      Art.drawWildMonster(ctx, { x: 446, y: 110, species: 'water', hp: 7, maxHp: 7, hit: false, weak: false, casting: false, dir: 1 });
      dotted(ctx, 446, 150, 446, 340);
      Art.drawTamer(ctx, { x: 446, y: 380, dir: 1, guarding: false, shieldReady: false, blink: true });
      Art.drawHazard(ctx, { x: 446, y: 356, kind: 'waterball', phase: 'active', angle: Math.PI / 2, t: 0 });
      ctx.save();
      ctx.strokeStyle = P.danger; ctx.lineWidth = 3;
      starPath(ctx, 446, 362, 26); ctx.stroke();
      ctx.restore();
      label(ctx, '按太早', 446, 455);
      checkMark(ctx, 556, 44, 22, false);
      for (var i = 0; i < 5; i++) iconHeart(ctx, 330 + i * 32, 248 + 0, 26, i < 4, i === 4);
      // 角落鍵帽: 方向鍵 走
      arrowKeys(ctx, 70, 548);
      label(ctx, '走', 140, 564);
    },
    // 第 2 頁 收服
    function (ctx) {
      miniFloor(ctx, 14, 14, 572, 572);
      Art.drawHazard(ctx, { x: 360, y: 260, kind: 'firering', phase: 'active', radius: 180, t: 0.2 });
      Art.drawWildMonster(ctx, { x: 360, y: 260, species: 'fire', hp: 2, maxHp: 10, hit: false, weak: true, casting: false, dir: -1 });
      Art.drawTamer(ctx, { x: 240, y: 340, dir: 1, guarding: true, shieldReady: false, blink: false });
      Art.drawParryFlash(ctx, { x: 240, y: 340, tx: 360, ty: 266, result: 'capture', t: 0.12 });
      // 「殘血」短標籤貼著捕捉記號
      label(ctx, '殘血', 440, 222, P.capture);
      ctx.save(); ctx.strokeStyle = P.capture; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(412, 222); ctx.lineTo(376, 224); ctx.stroke(); ctx.restore();
      label(ctx, '收服!', 300, 500, P.capture);
      checkMark(ctx, 540, 520, 26, true);
    },
    // 第 3 頁 點名表演
    function (ctx) {
      var cx = 300, cy = 255, R = 170;
      circle(ctx, cx, cy, 240); ctx.fillStyle = '#2a1824'; ctx.fill();
      var roster = ['fire', null, 'thunder', 'water', null, 'stone'];
      var rages = [70, 0, 55, 30, 0, 62];
      for (var i = 0; i < 6; i++) {
        var a = -Math.PI / 2 + i * Math.PI / 3;
        var px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R;
        Art.drawPedestal(ctx, { x: px, y: py, index: i, occupied: !!roster[i], selected: i === 0, heldFrom: false });
        if (roster[i]) Art.drawShowMonster(ctx, { x: px, y: py, species: roster[i], rage: i === 0 ? 10 : rages[i], mode: 'stand', performing: i === 0, fx: 'none', chainStep: 0, dir: 1 });
      }
      Art.drawHazard(ctx, { x: cx, y: cy - R, kind: 'firering', phase: 'active', radius: 66, t: 0.1 });
      coinBurst(ctx, cx + 70, cy - R - 30, 3);
      Art.drawFloatText(ctx, { x: cx + 110, y: cy - R + 20, text: '+7', kind: 'gold', t: 0 });
      keycap(ctx, 190, 545, '←→', 70, 40);
      label(ctx, '選', 245, 546);
      keycap(ctx, 350, 545, '空白', 80, 40);
      label(ctx, '表演', 425, 546);
    },
    // 第 4 頁 拿捏: 低怒少賺 / 高怒多賺 / 滿了失控 ✗
    function (ctx) {
      var cols = [100, 300, 500];
      // 低
      Art.drawPedestal(ctx, { x: cols[0], y: 320, index: 0, occupied: true, selected: false, heldFrom: false });
      Art.drawShowMonster(ctx, { x: cols[0], y: 320, species: 'fire', rage: 45, mode: 'stand', performing: true, fx: 'none', chainStep: 0, dir: 1 });
      coinBurst(ctx, cols[0], 220, 1);
      Art.drawFloatText(ctx, { x: cols[0], y: 180, text: '+5', kind: 'gold', t: 0 });
      label(ctx, '少賺', cols[0], 440);
      // 高
      Art.drawPedestal(ctx, { x: cols[1], y: 320, index: 0, occupied: true, selected: false, heldFrom: false });
      Art.drawShowMonster(ctx, { x: cols[1], y: 320, species: 'fire', rage: 95, mode: 'stand', performing: true, fx: 'none', chainStep: 0, dir: 1 });
      coinBurst(ctx, cols[1], 215, 7);
      Art.drawFloatText(ctx, { x: cols[1], y: 150, text: '+10', kind: 'gold', t: 0 });
      label(ctx, '多賺', cols[1], 440);
      // 滿: 跳下台座撲向觀眾
      Art.drawVisitor(ctx, { x: cols[2], y: 75, seat: 2, mode: 'scared' });
      Art.drawPedestal(ctx, { x: cols[2], y: 320, index: 0, occupied: false, selected: false, heldFrom: false });
      dotted(ctx, cols[2], 270, cols[2], 215);
      Art.drawShowMonster(ctx, { x: cols[2], y: 175, species: 'fire', rage: 100, mode: 'charge', performing: false, fx: 'none', chainStep: 0, dir: 1 });
      label(ctx, '失控', cols[2], 440, P.danger);
      checkMark(ctx, 560, 500, 22, false);
      // 三欄之間的分隔
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(200, 40); ctx.lineTo(200, 470); ctx.moveTo(400, 40); ctx.lineTo(400, 470); ctx.stroke(); ctx.restore();
    },
    // 第 5 頁 點心
    function (ctx) {
      var px = 220, py = 230;
      Art.drawPedestal(ctx, { x: px, y: py, index: 0, occupied: true, selected: true, heldFrom: false });
      Art.drawShowMonster(ctx, { x: px, y: py, species: 'thunder', rage: 52, mode: 'stand', performing: false, fx: 'fed', chainStep: 0, dir: 1 });
      // 怒氣條掉的那一截(92 → 52)
      rageBar(ctx, px, py + 36, 84, 52, { ghostFrom: 92, edge: P.snack });
      // 點心飛進嘴
      ctx.save();
      ctx.setLineDash([5, 7]); ctx.strokeStyle = 'rgba(216,149,90,0.8)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(450, 110); ctx.quadraticCurveTo(360, 70, 270, 205); ctx.stroke();
      ctx.restore();
      iconSnack(ctx, 460, 112, 44);
      keycap(ctx, 460, 170, '↓', 40, 36);
      // 流程
      var steps = ['地下城', '排位', '表演', '商店'];
      for (var i = 0; i < 4; i++) {
        var bx = 30 + i * 140;
        rrect(ctx, bx, 420, 110, 52, 10); ctx.fillStyle = '#2a2c38'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#4a4e5e'; ctx.stroke();
        text(ctx, steps[i], bx + 55, 446, 22, P.text, 'center', true, false);
        if (i < 3) text(ctx, '→', bx + 125, 446, 24, P.textDim, 'center', true, false);
      }
      text(ctx, '×3 天', 210, 520, 26, P.text, 'center', true);
      text(ctx, '→', 290, 520, 26, P.textDim, 'center', true, false);
      for (var k = 0; k < 3; k++) iconStar(ctx, 340 + k * 40, 520, 34, P.gold);
    },
  ];

  function dotted(ctx, x1, y1, x2, y2) {
    ctx.save();
    ctx.setLineDash([3, 8]); ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }

  function coinBurst(ctx, x, y, n) {
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.5;
      var d = 26 + (i % 2) * 18;
      iconCoin(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6 + 20, 20);
    }
  }

  window.Art = Art;
})();
