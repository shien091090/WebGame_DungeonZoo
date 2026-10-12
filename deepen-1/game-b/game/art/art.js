/* 彈反引爆秀 — 美術(全部 Canvas 2D 幾何繪製, 無外部資源)
 * 全域物件 window.Art; 每個函式自己 save/restore。
 * 座標一律為物件中心(drawButton 為左上角), 與 interface.json 一致。
 */
(function () {
  'use strict';

  var W = 720, H = 1280;

  var C = {
    bg: '#15131c',
    hudBg: '#0e0c14', hudLine: '#3a3450',
    panel: '#221e2c', panelHi: '#2e2840', panelLine: '#4a4262',
    text: '#f2ecdf', textDim: '#a59fb5', outline: '#0b0a10',
    // 馴獸師(玩家)
    tamer: '#f4ead2', tamerCoat: '#7a4e2e', tamerHat: '#4e3220',
    shield: '#ffffff',
    rope: '#e2b866',
    // 四種魔物 = 四種元素(色相 10° / 77° / 202° / 270°, 灰階 136 / 222 / 179 / 96)
    fire: '#ff5a3a', water: '#6cc8ff', thunder: '#d0ff58', stone: '#8c30e8',
    fireLt: '#ffc08a', waterLt: '#d4f0ff', thunderLt: '#f4ffc8', stoneLt: '#d8b8ff',
    fireDk: '#8a2414', waterDk: '#1e5a8a', thunderDk: '#5a7a10', stoneDk: '#3e1270',
    // 玩家動作
    whip: '#fff1c8', whistle: '#c8ffd8',
    // 怒氣 / 失控
    rageCalm: '#8a93a8', ragePerform: '#f4ead2', redLine: '#ff2e88',
    // 資源
    gold: '#ffcc33', goldDk: '#8a6210', heart: '#ff6f7d', rep: '#ffffff', repDown: '#ff8a8a',
    // 地下城地板(依區)
    crag: '#2c3122', ruins: '#2a2534', lava: '#33221d', pond: '#1c2836', hall: '#25242b',
    wall: '#0c0b10', wallEdge: '#3d3a4a', pillar: '#4a4658', pillarHi: '#6a6680',
    lavaTile: '#b8361a', lavaHi: '#ff8a2a', waterTile: '#1d4f8f', waterHi: '#5f9fe0',
    // 表演場
    arenaFloor: '#3a3226', arenaLine: '#4c4232', stands: '#241b17', standsRow: '#33271f',
    fenceWood: '#a8794a', fenceDk: '#5a3c22',
  };

  var ZONE_SPECIES = { crag: 'thunder', ruins: 'stone', lava: 'fire', pond: 'water' };
  var SPECIES_NAME = { fire: '火蜥蜴', water: '水母', thunder: '雷鳥', stone: '石像鬼' };
  var PERK_NAME = { fire: '鞭範圍', water: '哨範圍', thunder: '彈反', stone: '心' };
  var FACE = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];

  function now() {
    return (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) / 1000;
  }
  var SPECIES = { fire: 1, water: 1, thunder: 1, stone: 1 };
  // 表外的種類 / 元素一律退回 fire
  function spOf(v) { return SPECIES[v] ? v : 'fire'; }
  function S(s) { return (s && typeof s === 'object') ? s : {}; }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function num(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; }
  function faceVec(f) {
    var v = FACE[((num(f, 0) % 8) + 8) % 8];
    var l = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    return [v[0] / l, v[1] / l];
  }
  function faceAngle(f) { return (num(f, 0) * 45 - 90) * Math.PI / 180; }
  function font(px, bold) { return (bold === false ? '' : 'bold ') + px + 'px "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif'; }
  function textW(ctx, s) {
    var m = ctx.measureText ? ctx.measureText(s) : null;
    return (m && typeof m.width === 'number') ? m.width : String(s).length * 12;
  }
  function rrect(ctx, x, y, w, h, r) {
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
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); }
  // 有深色描邊的字(任何底色都讀得到)
  function outText(ctx, s, x, y, px, color, align, stroke) {
    ctx.font = font(px);
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, px / 5);
    ctx.strokeStyle = stroke || C.outline;
    ctx.strokeText(s, x, y);
    ctx.fillStyle = color || C.text;
    ctx.fillText(s, x, y);
  }
  function star(ctx, x, y, r, inner) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var rr = (i % 2) ? r * (inner || 0.45) : r;
      var px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
  }
  function heartPath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.4, y + s * 0.1, x - s * 0.9, y - s * 0.95, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.9, y - s * 0.95, x + s * 1.4, y + s * 0.1, x, y + s * 0.9);
    ctx.closePath();
  }
  function coin(ctx, x, y, r) {
    circle(ctx, x, y, r);
    ctx.fillStyle = C.gold; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r / 4); ctx.strokeStyle = C.goldDk; ctx.stroke();
    circle(ctx, x, y, r * 0.5);
    ctx.lineWidth = Math.max(1, r / 6); ctx.strokeStyle = C.goldDk; ctx.stroke();
  }
  function arrowHead(ctx, x, y, ang, s, color) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.7, -s * 0.7); ctx.lineTo(-s * 0.3, 0); ctx.lineTo(-s * 0.7, s * 0.7); ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = C.outline; ctx.stroke();
    ctx.restore();
  }

  // ───────────────────────── 魔物本體(地下城、表演場、HUD、說明頁共用) ─────────────────────────
  // mono: 有值時所有填色換成這一色(受擊閃白用)
  function paintSpecies(ctx, sp, dir, mono) {
    sp = spOf(sp);
    var main = mono || C[sp] || C.fire;
    var lt = mono || C[sp + 'Lt'] || C.fireLt;
    var dk = mono ? mono : C.outline;
    var t = now();
    ctx.save();
    ctx.scale(dir === -1 ? -1 : 1, 1);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (sp === 'water') {
      // 水母: 鐘形頂 + 波浪觸手
      ctx.lineWidth = 3.5;
      for (var i = 0; i < 4; i++) {
        var tx = -12 + i * 8;
        ctx.beginPath(); ctx.moveTo(tx, 6);
        for (var k = 1; k <= 4; k++) ctx.lineTo(tx + Math.sin(t * 5 + i + k) * 3, 6 + k * 5.5);
        ctx.strokeStyle = dk; ctx.lineWidth = 6; ctx.stroke();
        ctx.strokeStyle = lt; ctx.lineWidth = 3; ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 4, 22, Math.PI, 0);
      for (var s = 0; s < 4; s++) ctx.arc(16.5 - s * 11, 4, 5.5, 0, Math.PI);
      ctx.closePath();
      ctx.fillStyle = main; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = dk; ctx.stroke();
      if (!mono) {
        ctx.beginPath(); ctx.arc(0, 4, 15, Math.PI * 1.15, Math.PI * 1.55);
        ctx.strokeStyle = lt; ctx.lineWidth = 3; ctx.stroke();
      }
      eye(ctx, -7, -3, mono); eye(ctx, 7, -3, mono);
    } else if (sp === 'thunder') {
      // 雷鳥: 鋸齒翅膀(閃電)+ 圓身 + 尖喙
      var wing = [[-6, -4], [-32, -16], [-25, -7], [-31, 0], [-20, 0], [-23, 7], [-6, 7]];
      for (var m = -1; m <= 1; m += 2) {
        ctx.beginPath();
        for (var p = 0; p < wing.length; p++) {
          var wx = wing[p][0] * m, wy = wing[p][1];
          if (p) ctx.lineTo(wx, wy); else ctx.moveTo(wx, wy);
        }
        ctx.closePath();
        ctx.fillStyle = main; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = dk; ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(-5, 12); ctx.lineTo(0, 21); ctx.lineTo(5, 12); ctx.closePath();
      ctx.fillStyle = main; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = dk; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 3, 13, 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = main; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = dk; ctx.stroke();
      circle(ctx, 4, -11, 9);
      ctx.fillStyle = main; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = dk; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(11, -14); ctx.lineTo(20, -10); ctx.lineTo(11, -7); ctx.closePath();
      ctx.fillStyle = mono || '#3a3a20'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -19); ctx.lineTo(4, -23); ctx.lineTo(3, -19); ctx.lineTo(8, -22);
      ctx.strokeStyle = lt; ctx.lineWidth = 2.5; ctx.stroke();
      if (!mono) { ctx.beginPath(); ctx.ellipse(-2, 6, 7, 5, 0, 0, Math.PI * 2); ctx.fillStyle = lt; ctx.fill(); }
      eye(ctx, 6, -12, mono);
    } else if (sp === 'stone') {
      // 石像鬼: 方塊身 + 雙角 + 小翅 + 發光眼
      for (var n = -1; n <= 1; n += 2) {
        ctx.beginPath(); ctx.moveTo(20 * n, -8); ctx.lineTo(32 * n, -16); ctx.lineTo(30 * n, 2); ctx.lineTo(20 * n, 7); ctx.closePath();
        ctx.fillStyle = main; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = mono || C.stoneLt; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-14 * n, -17); ctx.lineTo(-10 * n, -28); ctx.lineTo(-5 * n, -17); ctx.closePath();
        ctx.fillStyle = lt; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = dk; ctx.stroke();
      }
      rrect(ctx, -20, -18, 40, 38, 7);
      ctx.fillStyle = main; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = mono || C.stoneLt; ctx.stroke();
      rrect(ctx, -16, 20, 11, 4, 2); ctx.fillStyle = lt; ctx.fill();
      rrect(ctx, 5, 20, 11, 4, 2); ctx.fillStyle = lt; ctx.fill();
      if (!mono) {
        ctx.beginPath(); ctx.moveTo(-12, 5); ctx.lineTo(-6, 10); ctx.lineTo(-9, 16);
        ctx.moveTo(10, -14); ctx.lineTo(7, -9);
        ctx.strokeStyle = C.stoneDk; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.fillStyle = mono || '#ffffff';
      rrect(ctx, -11, -9, 8, 5, 2); ctx.fill();
      rrect(ctx, 3, -9, 8, 5, 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-7, 6); ctx.lineTo(7, 6); ctx.strokeStyle = dk; ctx.lineWidth = 2.5; ctx.stroke();
    } else {
      // 火蜥蜴: 長身 + 尾巴 + 背上火冠
      ctx.beginPath(); ctx.moveTo(-14, 3); ctx.quadraticCurveTo(-29, 5, -32, -8);
      ctx.strokeStyle = dk; ctx.lineWidth = 10; ctx.stroke();
      ctx.strokeStyle = main; ctx.lineWidth = 6; ctx.stroke();
      ctx.fillStyle = main;
      rrect(ctx, -14, 9, 6, 9, 2); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = dk; ctx.stroke();
      rrect(ctx, 6, 9, 6, 9, 2); ctx.fill(); ctx.stroke();
      var fl = [[-11, -9], [-2, -12], [7, -10]];
      for (var q = 0; q < 3; q++) {
        var fx = fl[q][0], fy = fl[q][1], fh = 8 + Math.sin(t * 9 + q * 2) * 1.5;
        ctx.beginPath(); ctx.moveTo(fx - 4, fy + 4); ctx.quadraticCurveTo(fx - 3, fy - fh * 0.5, fx, fy - fh);
        ctx.quadraticCurveTo(fx + 3, fy - fh * 0.5, fx + 4, fy + 4); ctx.closePath();
        ctx.fillStyle = lt; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = dk; ctx.stroke();
      }
      ctx.beginPath(); ctx.ellipse(0, 2, 20, 11, 0, 0, Math.PI * 2);
      ctx.fillStyle = main; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = dk; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(18, -2, 11, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = main; ctx.fill(); ctx.stroke();
      if (!mono) { ctx.beginPath(); ctx.ellipse(-1, 6, 13, 4, 0, 0, Math.PI * 2); ctx.fillStyle = lt; ctx.fill(); }
      eye(ctx, 21, -4, mono);
    }
    ctx.restore();
  }
  function eye(ctx, x, y, mono) {
    circle(ctx, x, y, 3.2); ctx.fillStyle = mono || '#ffffff'; ctx.fill();
    if (!mono) { circle(ctx, x + 0.8, y, 1.6); ctx.fillStyle = C.outline; ctx.fill(); }
  }

  // 怒氣條: 50 門檻刻度、80~99 紅線區(粉紅斜紋)、填色依所在區換色
  function rageBar(ctx, cx, cy, w, h, rage) {
    rage = clamp(num(rage, 0), 0, 100);
    var x0 = cx - w / 2, y0 = cy - h / 2;
    rrect(ctx, x0 - 2, y0 - 2, w + 4, h + 4, 3);
    ctx.fillStyle = C.outline; ctx.fill();
    ctx.fillStyle = '#2a2632'; ctx.fillRect(x0, y0, w, h);
    // 紅線區底(常駐)
    var rx0 = x0 + w * 0.8, rx1 = x0 + w * 0.99;
    ctx.save();
    ctx.beginPath(); ctx.rect(rx0, y0, rx1 - rx0, h); ctx.clip();
    ctx.fillStyle = 'rgba(255,46,136,0.35)'; ctx.fillRect(rx0, y0, rx1 - rx0, h);
    ctx.strokeStyle = 'rgba(255,46,136,0.9)'; ctx.lineWidth = Math.max(1.5, h / 6);
    for (var sx = rx0 - h; sx < rx1 + h; sx += h * 0.7) { ctx.beginPath(); ctx.moveTo(sx, y0 + h); ctx.lineTo(sx + h, y0); ctx.stroke(); }
    ctx.restore();
    // 填色
    var col = rage >= 100 ? ((Math.floor(now() * 8) % 2) ? '#ffffff' : C.redLine)
      : rage >= 80 ? C.redLine : rage >= 50 ? C.ragePerform : C.rageCalm;
    if (rage > 0) { ctx.fillStyle = col; ctx.fillRect(x0, y0, w * rage / 100, h); }
    // 紅線區邊框 + 50 門檻刻度
    ctx.strokeStyle = C.redLine; ctx.lineWidth = Math.max(1.5, h / 7);
    ctx.strokeRect(rx0, y0, rx1 - rx0, h);
    var tx = x0 + w * 0.5;
    ctx.beginPath(); ctx.moveTo(tx, y0 - 3); ctx.lineTo(tx, y0 + h + 3);
    ctx.strokeStyle = C.outline; ctx.lineWidth = Math.max(3, h / 3); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.5, h / 7); ctx.stroke();
  }

  // 圓環進度(從正上方順時針)
  function ringProgress(ctx, x, y, r, lw, p, color, track) {
    circle(ctx, x, y, r);
    ctx.strokeStyle = C.outline; ctx.lineWidth = lw + 4; ctx.stroke();
    ctx.strokeStyle = track || 'rgba(255,255,255,0.18)'; ctx.lineWidth = lw; ctx.stroke();
    if (p > 0) {
      ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(p, 0, 1));
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'butt'; ctx.stroke();
    }
  }

  function keycap(ctx, x, y, label, w) {
    ctx.save();
    w = w || 34;
    rrect(ctx, x - w / 2, y - 17, w, 34, 6);
    ctx.fillStyle = C.outline; ctx.fill();
    rrect(ctx, x - w / 2 + 2, y - 15, w - 4, 28, 5);
    ctx.fillStyle = C.text; ctx.fill();
    ctx.font = font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = C.outline; ctx.fillText(label, x, y - 1);
    ctx.restore();
  }

  // ───────────────────────── 匯出 ─────────────────────────
  var Art = {
    canvas: { width: W, height: H },
    palette: C,

    drawBackground: function (ctx) {
      ctx.save();
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },

    // 60×60 地格
    drawTile: function (ctx, s) {
      var x = num(s.x, 0) - 30, y = num(s.y, 0) - 30;
      ctx.save();
      var kind = s.kind, zone = s.zone || 'hall';
      if (kind === 'wall') {
        ctx.fillStyle = C.wall; ctx.fillRect(x, y, 60, 60);
        ctx.strokeStyle = C.wallEdge; ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, 58, 58);
        ctx.beginPath(); ctx.moveTo(x + 2, y + 30); ctx.lineTo(x + 58, y + 30);
        ctx.moveTo(x + 30, y + 2); ctx.lineTo(x + 30, y + 30);
        ctx.moveTo(x + 15, y + 30); ctx.lineTo(x + 15, y + 58);
        ctx.moveTo(x + 45, y + 30); ctx.lineTo(x + 45, y + 58);
        ctx.strokeStyle = 'rgba(61,58,74,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      } else if (kind === 'pillar') {
        ctx.fillStyle = C[zone] || C.hall; ctx.fillRect(x, y, 60, 60);
        // 石柱 = 整格擋路(邊界 = 判定)
        rrect(ctx, x + 1, y + 1, 58, 58, 10);
        ctx.fillStyle = C.pillar; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = C.outline; ctx.stroke();
        circle(ctx, x + 30, y + 27, 19); ctx.fillStyle = C.pillarHi; ctx.fill();
        circle(ctx, x + 30, y + 27, 12); ctx.strokeStyle = C.pillar; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 4, y + 50, 52, 7);
      } else if (kind === 'lava') {
        ctx.fillStyle = C.lavaTile; ctx.fillRect(x, y, 60, 60);
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 18); ctx.lineTo(x + 20, y + 24); ctx.lineTo(x + 30, y + 14); ctx.lineTo(x + 48, y + 22); ctx.lineTo(x + 57, y + 12);
        ctx.moveTo(x + 6, y + 44); ctx.lineTo(x + 24, y + 38); ctx.lineTo(x + 36, y + 48); ctx.lineTo(x + 55, y + 42);
        ctx.strokeStyle = C.lavaHi; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();
        circle(ctx, x + 16, y + 32, 3.5); ctx.fillStyle = '#ffd08a'; ctx.fill();
        circle(ctx, x + 44, y + 32, 2.5); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, 59, 59);
      } else if (kind === 'water') {
        ctx.fillStyle = C.waterTile; ctx.fillRect(x, y, 60, 60);
        ctx.strokeStyle = C.waterHi; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        for (var r = 0; r < 3; r++) {
          var wy = y + 14 + r * 16, ox = (r % 2) * 10;
          ctx.beginPath(); ctx.moveTo(x + 8 + ox, wy);
          ctx.quadraticCurveTo(x + 15 + ox, wy - 5, x + 22 + ox, wy);
          ctx.quadraticCurveTo(x + 29 + ox, wy + 5, x + 36 + ox, wy);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, 59, 59);
      } else {
        ctx.fillStyle = C[zone] || C.hall; ctx.fillRect(x, y, 60, 60);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, 59, 59);
        circle(ctx, x + 18, y + 40, 1.5); ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill();
        circle(ctx, x + 42, y + 20, 1.5); ctx.fill();
        if (s.nest) {
          var sp = spOf(ZONE_SPECIES[zone]);
          ctx.setLineDash([6, 5]);
          circle(ctx, x + 30, y + 30, 24);
          ctx.strokeStyle = C[sp]; ctx.globalAlpha = 0.55; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 0.4;
          for (var d = 0; d < 3; d++) { circle(ctx, x + 22 + d * 8, y + 32 + (d % 2) * 4, 3); ctx.fillStyle = C[sp]; ctx.fill(); }
        }
      }
      ctx.restore();
    },

    // 馴獸師 64×64(身體圓半徑 18 = 判定半徑)
    drawTamer: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0);
      var fv = faceVec(s.facing), t = now();
      ctx.save();
      ctx.translate(x, y);
      if (s.blink && (Math.floor(t * 12) % 2)) ctx.globalAlpha = 0.35;
      ctx.beginPath(); ctx.ellipse(0, 18, 16, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      var stunned = num(s.stunLeft, 0) > 0;
      if (s.rolling) {
        // 翻滾: 縮成一顆球 + 身後三條速度線
        ctx.strokeStyle = C.whip; ctx.lineCap = 'round'; ctx.lineWidth = 3;
        var px = -fv[1], py = fv[0];
        for (var i = -1; i <= 1; i++) {
          ctx.globalAlpha *= 1;
          ctx.beginPath();
          ctx.moveTo(-fv[0] * 18 + px * i * 9, -fv[1] * 18 + py * i * 9);
          ctx.lineTo(-fv[0] * 30 + px * i * 9, -fv[1] * 30 + py * i * 9);
          ctx.stroke();
        }
        circle(ctx, 0, 0, 16);
        ctx.fillStyle = C.tamerCoat; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.outline; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 10, t * 18, t * 18 + Math.PI * 1.2);
        ctx.strokeStyle = C.tamer; ctx.lineWidth = 4; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 10, t * 18 + Math.PI, t * 18 + Math.PI * 1.5);
        ctx.strokeStyle = C.tamerHat; ctx.lineWidth = 4; ctx.stroke();
      } else {
        // 身體
        circle(ctx, 0, 0, 18);
        ctx.fillStyle = stunned ? '#9a96a4' : C.tamer; ctx.fill();
        ctx.save(); ctx.clip();
        ctx.fillStyle = stunned ? '#5a5560' : C.tamerCoat; ctx.fillRect(-18, 5, 36, 14);
        ctx.restore();
        circle(ctx, 0, 0, 18);
        ctx.lineWidth = 2.5; ctx.strokeStyle = C.outline; ctx.stroke();
        // 帽子
        ctx.beginPath(); ctx.ellipse(0, -12, 17, 4.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = C.tamerHat; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
        rrect(ctx, -9, -25, 18, 13, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.rope; ctx.fillRect(-9, -16, 18, 3);
        // 眼睛(看向面向)
        if (stunned) {
          ctx.strokeStyle = C.outline; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-3, -1); ctx.moveTo(-3, -6); ctx.lineTo(-8, -1);
          ctx.moveTo(3, -6); ctx.lineTo(8, -1); ctx.moveTo(8, -6); ctx.lineTo(3, -1); ctx.stroke();
        } else {
          ctx.fillStyle = C.outline;
          circle(ctx, -5 + fv[0] * 3, -3 + fv[1] * 2, 2.4); ctx.fill();
          circle(ctx, 5 + fv[0] * 3, -3 + fv[1] * 2, 2.4); ctx.fill();
        }
        // 面向箭頭
        ctx.save();
        ctx.rotate(Math.atan2(fv[1], fv[0]));
        ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(22, -6); ctx.lineTo(22, 6); ctx.closePath();
        ctx.fillStyle = C.whip; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.outline; ctx.stroke();
        ctx.restore();
        // 套索中: 手上一圈繩
        if (s.lassoing) {
          circle(ctx, -fv[1] * 15 + fv[0] * 6, fv[0] * 15 + fv[1] * 6, 6);
          ctx.strokeStyle = C.outline; ctx.lineWidth = 5; ctx.stroke();
          ctx.strokeStyle = C.rope; ctx.lineWidth = 3; ctx.stroke();
        }
        // 暈眩: 頭頂繞圈的三顆小星 + 剩餘弧
        if (stunned) {
          var sp = num(s.stunLeft, 0) / Math.max(0.01, num(s.stunDur, 1.5));
          for (var k = 0; k < 3; k++) {
            var a = t * 5 + k * Math.PI * 2 / 3;
            star(ctx, Math.cos(a) * 13, -25 + Math.sin(a) * 2.5, 4, 0.45);
            ctx.fillStyle = '#e0d8ff'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = C.outline; ctx.stroke();
          }
          ctx.beginPath(); ctx.arc(0, 0, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(sp, 0, 1));
          ctx.strokeStyle = 'rgba(224,216,255,0.8)'; ctx.lineWidth = 2.5; ctx.stroke();
        }
      }
      // 舉盾: 全方位護泡 + 外圈剩餘時機弧
      var pl = num(s.parryLeft, 0);
      if (pl > 0) {
        var pp = clamp(pl / Math.max(0.01, num(s.parryDur, 0.2)), 0, 1);
        circle(ctx, 0, 0, 26);
        ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fill();
        ctx.strokeStyle = C.outline; ctx.lineWidth = 6; ctx.stroke();
        ctx.strokeStyle = C.shield; ctx.lineWidth = 3.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pp);
        ctx.strokeStyle = C.shield; ctx.lineWidth = 3; ctx.lineCap = 'butt'; ctx.stroke();
      }
      ctx.restore();
    },

    // 地下城野生魔物 90×90
    drawWildMonster: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), sp = spOf(s.species), t = now();
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath(); ctx.ellipse(0, 26, 22, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      // 施法預備: 身後元素色光暈
      if (s.casting) {
        var g = ctx.createRadialGradient ? ctx.createRadialGradient(0, 0, 10, 0, 0, 40) : null;
        if (g && g.addColorStop) {
          g.addColorStop(0, C[sp]); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalAlpha = 0.55 + 0.3 * Math.sin(t * 20);
          circle(ctx, 0, 0, 40); ctx.fillStyle = g; ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      // 殘血(可套): 外圈一圈繩色虛線
      if (s.weak && !s.lassoed) {
        ctx.save();
        ctx.rotate(t * 1.5);
        ctx.setLineDash([9, 6]);
        circle(ctx, 0, 0, 37);
        ctx.strokeStyle = C.outline; ctx.lineWidth = 5; ctx.stroke();
        ctx.strokeStyle = C.rope; ctx.lineWidth = 3; ctx.stroke();
        ctx.restore();
      }
      var sx = s.lassoed ? Math.sin(t * 40) * 2 : 0;
      ctx.translate(sx, 0);
      paintSpecies(ctx, sp, s.dir, null);
      if (s.hit) { ctx.globalAlpha = 0.75; paintSpecies(ctx, sp, s.dir, '#ffffff'); ctx.globalAlpha = 1; }
      // 被套住: 身上綁一圈繩
      if (s.lassoed) {
        ctx.beginPath(); ctx.ellipse(0, 4, 26, 7, 0, 0, Math.PI * 2);
        ctx.strokeStyle = C.outline; ctx.lineWidth = 7; ctx.stroke();
        ctx.strokeStyle = C.rope; ctx.lineWidth = 4; ctx.stroke();
        circle(ctx, -24, 6, 4); ctx.fillStyle = C.rope; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.outline; ctx.stroke();
      }
      ctx.translate(-sx, 0);
      // 殘血: 頭旁暈眩螺旋
      if (s.weak) {
        ctx.beginPath();
        for (var i = 0; i < 18; i++) {
          var a = t * 6 + i * 0.6, r = 1 + i * 0.35;
          var px = 27 + Math.cos(a) * r, py = -27 + Math.sin(a) * r;
          if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.strokeStyle = C.outline; ctx.lineWidth = 4; ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
      }
      // 血條(30% 刻度 = 可套門檻)
      var hp = clamp(num(s.hp, 1) / Math.max(1, num(s.maxHp, 1)), 0, 1);
      ctx.fillStyle = C.outline; ctx.fillRect(-29, -43, 58, 8);
      ctx.fillStyle = '#3a3444'; ctx.fillRect(-27, -41, 54, 4);
      ctx.fillStyle = s.weak ? C.rope : C.tamer;
      ctx.fillRect(-27, -41, 54 * hp, 4);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-27 + 54 * 0.3 - 1, -43, 2, 8);
      ctx.restore();
    },

    drawLasso: function (ctx, s) {
      var x1 = num(s.x1, 0), y1 = num(s.y1, 0), x2 = num(s.x2, 0), y2 = num(s.y2, 0);
      var tight = clamp(num(s.len, 0) / Math.max(1, num(s.maxLen, 220)), 0, 1.2);
      ctx.save();
      // 繩: 鬆時下垂, 越接近最大長度越直; 0.8 以上變粉紅警示並閃
      var mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + (1 - Math.min(1, tight)) * 40;
      var warn = tight >= 0.8;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2);
      ctx.strokeStyle = C.outline; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.stroke();
      ctx.strokeStyle = warn && (Math.floor(now() * 10) % 2) ? C.redLine : C.rope;
      ctx.lineWidth = warn ? 3 : 4; ctx.stroke();
      // 繞圈進度環(粗) + 時限環(細, 剩餘)
      var p = clamp(num(s.progress, 0), 0, 1);
      ringProgress(ctx, x2, y2, 42, 6, p, C.rope);
      var left = clamp(1 - num(s.t, 0) / Math.max(0.01, num(s.limit, 5)), 0, 1);
      ctx.beginPath(); ctx.arc(x2, y2, 49, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left);
      ctx.strokeStyle = C.outline; ctx.lineWidth = 5; ctx.stroke();
      ctx.strokeStyle = left < 0.3 ? C.redLine : '#ffffff'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.restore();
    },

    drawHazard: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), kind = s.kind, ph = s.phase, t = now();
      var p = num(s.dur, 0) > 0 ? clamp(num(s.t, 0) / s.dur, 0, 1) : 0;
      var el = kind === 'firering' ? 'fire' : kind === 'waterball' ? 'water' : kind === 'thunder' ? 'thunder' : 'stone';
      var col = C[el];
      ctx.save();
      if (kind === 'waterball') {
        var a = num(s.angle, 0), dx = Math.cos(a), dy = Math.sin(a);
        for (var i = 2; i >= 1; i--) {
          circle(ctx, x - dx * i * 12, y - dy * i * 12, 12 - i * 3);
          ctx.fillStyle = 'rgba(108,200,255,' + (0.45 - i * 0.15) + ')'; ctx.fill();
        }
        circle(ctx, x, y, 12);
        ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.outline; ctx.stroke();
        circle(ctx, x - 3, y - 4, 4); ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.restore(); return;
      }
      if (kind === 'quake') {
        var r = num(s.radius, 0);
        if (ph === 'warn') {
          ctx.setLineDash([6, 5]);
          circle(ctx, x, y, 22 + p * 8); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
          ctx.setLineDash([]);
        } else {
          var ri = Math.max(0, r - 15), ro = r + 15;
          ctx.beginPath(); ctx.arc(x, y, ro, 0, Math.PI * 2); ctx.arc(x, y, ri, 0, Math.PI * 2, true);
          ctx.fillStyle = 'rgba(140,48,232,0.55)'; ctx.fill();
          circle(ctx, x, y, ro); ctx.strokeStyle = C.outline; ctx.lineWidth = 4; ctx.stroke();
          ctx.strokeStyle = C.stoneLt; ctx.lineWidth = 2; ctx.stroke();
          if (ri > 0) { circle(ctx, x, y, ri); ctx.strokeStyle = C.stoneLt; ctx.lineWidth = 2; ctx.stroke(); }
          // 碎石
          var n = Math.max(6, Math.floor(r / 12));
          for (var k = 0; k < n; k++) {
            var aa = k * Math.PI * 2 / n + r * 0.01;
            var bx = x + Math.cos(aa) * r, by = y + Math.sin(aa) * r;
            ctx.fillStyle = C.stoneLt; ctx.fillRect(bx - 3, by - 3, 6, 6);
          }
        }
        ctx.restore(); return;
      }
      var R = num(s.radius, kind === 'thunder' ? 70 : 120);
      if (ph === 'warn') {
        // 預警: 虛線圈 + 由中心長大的填色, 填滿 = 生效
        circle(ctx, x, y, R);
        ctx.fillStyle = kind === 'thunder' ? 'rgba(208,255,88,0.10)' : 'rgba(255,90,58,0.10)'; ctx.fill();
        circle(ctx, x, y, R * p);
        ctx.fillStyle = kind === 'thunder' ? 'rgba(208,255,88,0.32)' : 'rgba(255,90,58,0.32)'; ctx.fill();
        ctx.setLineDash([10, 7]);
        circle(ctx, x, y, R); ctx.strokeStyle = C.outline; ctx.lineWidth = 5; ctx.stroke();
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
        ctx.setLineDash([]);
        if (kind === 'thunder') {
          ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x + 12, y); ctx.moveTo(x, y - 12); ctx.lineTo(x, y + 12);
          ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke();
        }
      } else if (kind === 'thunder') {
        var al = 1 - p * 0.8;
        ctx.globalAlpha = al;
        circle(ctx, x, y, R); ctx.fillStyle = 'rgba(208,255,88,0.55)'; ctx.fill();
        ctx.strokeStyle = C.outline; ctx.lineWidth = 5; ctx.stroke();
        ctx.strokeStyle = C.thunderLt; ctx.lineWidth = 3; ctx.stroke();
        var top = y - R * 1.7;
        ctx.beginPath(); ctx.moveTo(x + 6, top); ctx.lineTo(x - 10, y - R * 0.9); ctx.lineTo(x + 8, y - R * 0.7);
        ctx.lineTo(x - 6, y - R * 0.2); ctx.lineTo(x + 4, y - R * 0.25); ctx.lineTo(x, y);
        ctx.strokeStyle = C.outline; ctx.lineWidth = 9; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.strokeStyle = C.thunder; ctx.lineWidth = 5; ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
      } else {
        // 火圈生效: 實心火盤 + 邊緣火舌
        circle(ctx, x, y, R); ctx.fillStyle = 'rgba(255,90,58,0.42)'; ctx.fill();
        ctx.beginPath();
        var m = 24;
        for (var j = 0; j <= m; j++) {
          var ang = j * Math.PI * 2 / m;
          var rr = R + ((j % 2) ? -6 : 0) + Math.sin(t * 14 + j) * 2;
          var fx = x + Math.cos(ang) * rr, fy = y + Math.sin(ang) * rr;
          if (j) ctx.lineTo(fx, fy); else ctx.moveTo(fx, fy);
        }
        ctx.closePath();
        ctx.strokeStyle = C.outline; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.strokeStyle = C.fireLt; ctx.lineWidth = 3; ctx.stroke();
        circle(ctx, x, y, R * 0.6); ctx.strokeStyle = 'rgba(255,192,138,0.6)'; ctx.lineWidth = 3; ctx.stroke();
      }
      ctx.restore();
    },

    drawWhipCrack: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), r = num(s.radius, 110);
      var p = clamp(num(s.t, 0) / Math.max(0.01, num(s.dur, 0.25)), 0, 1);
      if (p >= 1) return;
      ctx.save();
      ctx.globalAlpha = 1 - p * 0.8;
      var a0, a1;
      if (s.shape === 'arc') { var fa = faceAngle(s.facing); a0 = fa - Math.PI / 3; a1 = fa + Math.PI / 3; }
      else { a0 = 0; a1 = Math.PI * 2; }
      ctx.beginPath();
      if (s.shape === 'arc') ctx.moveTo(x, y);
      ctx.arc(x, y, r, a0, a1);
      if (s.shape === 'arc') ctx.closePath();
      ctx.fillStyle = 'rgba(255,241,200,0.16)'; ctx.fill();
      // 外緣: 一道鞭痕掃過 + 外凸小尖
      var sweep = a0 + (a1 - a0) * Math.min(1, p * 2.2);
      ctx.beginPath(); ctx.arc(x, y, r, a0, sweep);
      ctx.strokeStyle = C.outline; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.stroke();
      ctx.strokeStyle = C.whip; ctx.lineWidth = 4.5; ctx.stroke();
      var n = s.shape === 'arc' ? 5 : 12;
      ctx.beginPath();
      for (var i = 0; i <= n; i++) {
        var a = a0 + (a1 - a0) * i / n;
        if (a > sweep) break;
        ctx.moveTo(x + Math.cos(a) * (r - 2), y + Math.sin(a) * (r - 2));
        ctx.lineTo(x + Math.cos(a + 0.05) * (r - 12), y + Math.sin(a + 0.05) * (r - 12));
      }
      ctx.strokeStyle = C.whip; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    },

    drawWhistleWave: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), r = num(s.radius, 140);
      var p = clamp(num(s.t, 0) / Math.max(0.01, num(s.dur, 0.25)), 0, 1);
      if (p >= 1) return;
      ctx.save();
      circle(ctx, x, y, r); ctx.fillStyle = 'rgba(200,255,216,' + (0.12 * (1 - p)) + ')'; ctx.fill();
      // 三圈柔和波浪環(哨音), 範圍邊界一圈實線
      for (var k = 0; k < 3; k++) {
        var rr = r * clamp(0.4 + 0.6 * p + k * 0.2 - 0.4, 0.15, 1);
        ctx.beginPath();
        for (var i = 0; i <= 48; i++) {
          var a = i * Math.PI * 2 / 48;
          var w = rr + Math.sin(a * 8 + k) * 3;
          var px = x + Math.cos(a) * w, py = y + Math.sin(a) * w;
          if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.globalAlpha = (1 - p) * (1 - k * 0.25);
        ctx.strokeStyle = C.whistle; ctx.lineWidth = 3 - k * 0.6; ctx.stroke();
      }
      ctx.globalAlpha = 1 - p * 0.7;
      circle(ctx, x, y, r); ctx.strokeStyle = C.outline; ctx.lineWidth = 5; ctx.stroke();
      ctx.strokeStyle = C.whistle; ctx.lineWidth = 2.5; ctx.stroke();
      outText(ctx, '♪', x + r * 0.55, y - r * 0.55 - p * 10, 22, C.whistle);
      outText(ctx, '♪', x - r * 0.6, y - r * 0.35 - p * 14, 18, C.whistle);
      ctx.restore();
    },

    // 120×120 彈反閃光
    drawParryFlash: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0);
      var p = clamp(num(s.t, 0) / Math.max(0.01, num(s.dur, 0.25)), 0, 1);
      if (p >= 1) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = 1 - p;
      circle(ctx, 0, 0, 20 + p * 24); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
      ctx.rotate(p * 0.6);
      var L = 34 + p * 22;
      for (var i = 0; i < 8; i++) {
        var a = i * Math.PI / 4, l = (i % 2) ? L * 0.7 : L;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a - 0.12) * 14, Math.sin(a - 0.12) * 14);
        ctx.lineTo(Math.cos(a) * l, Math.sin(a) * l);
        ctx.lineTo(Math.cos(a + 0.12) * 14, Math.sin(a + 0.12) * 14);
        ctx.closePath();
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = C.outline; ctx.stroke();
      }
      ctx.restore();
    },

    // 反射衝擊波: 元素色粗環 + 白色前緣 + 往外箭頭; 全範圍白虛線(馴獸師放出, 與魔物技能區分)
    drawReflectWave: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), R = num(s.radius, 160), el = spOf(s.element);
      var p = clamp(num(s.t, 0) / Math.max(0.01, num(s.dur, 0.4)), 0, 1);
      var r = R * (1 - Math.pow(1 - p, 2));
      var col = C[el] || C.fire;
      ctx.save();
      ctx.globalAlpha = p > 0.75 ? (1 - p) / 0.25 : 1;
      ctx.setLineDash([8, 8]);
      circle(ctx, x, y, R); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.setLineDash([]);
      circle(ctx, x, y, r); ctx.fillStyle = col; ctx.globalAlpha *= 0.14; ctx.fill();
      ctx.globalAlpha = p > 0.75 ? (1 - p) / 0.25 : 1;
      circle(ctx, x, y, Math.max(0, r - 8));
      ctx.strokeStyle = C.outline; ctx.lineWidth = 16; ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.stroke();
      circle(ctx, x, y, r); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
      for (var i = 0; i < 8; i++) {
        var a = i * Math.PI / 4 + Math.PI / 8;
        arrowHead(ctx, x + Math.cos(a) * (r + 8), y + Math.sin(a) * (r + 8), a, 7, '#ffffff');
      }
      ctx.restore();
    },

    // 表演場底: 觀眾席上下兩側、場地沙地
    drawShowArena: function (ctx) {
      ctx.save();
      ctx.fillStyle = C.wall; ctx.fillRect(0, 120, W, H - 120);
      // 觀眾席
      var stands = [[130, 250], [1020, 1140]];
      for (var i = 0; i < 2; i++) {
        var y0 = stands[i][0], y1 = stands[i][1];
        ctx.fillStyle = C.stands; ctx.fillRect(60, y0, 600, y1 - y0);
        ctx.fillStyle = C.standsRow;
        for (var r = 0; r < 3; r++) ctx.fillRect(60, y0 + 30 + r * 34, 600, 6);
        ctx.strokeStyle = C.panelLine; ctx.lineWidth = 2; ctx.strokeRect(60, y0, 600, y1 - y0);
      }
      // 場地
      ctx.fillStyle = C.arenaFloor; ctx.fillRect(60, 270, 600, 730);
      ctx.strokeStyle = C.arenaLine; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(360, 635, 240, 300, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(360, 635, 90, 110, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#5a4e3a'; ctx.lineWidth = 3; ctx.strokeRect(60, 270, 600, 730);
      // 圍欄帶底(圍欄由 drawFence 畫)
      ctx.fillStyle = '#1a1512'; ctx.fillRect(60, 250, 600, 20); ctx.fillRect(60, 1000, 600, 20);
      ctx.restore();
    },

    // 表演場魔物 100×100(本體與地下城同一套畫法)
    drawShowMonster: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), sp = spOf(s.species), t = now();
      var mode = s.mode || 'roam';
      var wild = mode === 'charge' || mode === 'loose';
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath(); ctx.ellipse(0, 28, 24, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      // 失控: 粉紅鋸齒怒氣外圈
      if (wild) {
        ctx.beginPath();
        var n = 16;
        for (var i = 0; i <= n * 2; i++) {
          var a = i * Math.PI / n + t * 2;
          var rr = (i % 2) ? 34 : 42;
          if (i) ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,46,136,0.28)'; ctx.fill();
        ctx.strokeStyle = C.redLine; ctx.lineWidth = 2.5; ctx.stroke();
      }
      // 表演中: 元素色光暈 + 上竄星點
      if (s.performing && !wild) {
        var g = ctx.createRadialGradient ? ctx.createRadialGradient(0, 0, 12, 0, 0, 44) : null;
        if (g && g.addColorStop) {
          g.addColorStop(0, C[sp]); g.addColorStop(1, 'rgba(0,0,0,0)');
          circle(ctx, 0, 0, 44); ctx.fillStyle = g; ctx.fill();
        }
        for (var k = 0; k < 4; k++) {
          var ph = (t * 1.6 + k / 4) % 1;
          star(ctx, -24 + k * 16, 26 - ph * 50, 4, 0.4);
          ctx.globalAlpha = 1 - ph; ctx.fillStyle = C[sp + 'Lt']; ctx.fill(); ctx.globalAlpha = 1;
        }
      }
      var bob = s.performing ? -3 : 0;
      var shake = wild ? Math.sin(t * 30) * 2 : 0;
      ctx.translate(shake, bob);
      paintSpecies(ctx, sp, s.dir, null);
      // fx: 點燃 / 澆熄 / 安撫(長在本體)
      var fx = s.fx || 'none';
      var fp = clamp(num(s.fxT, 0) / Math.max(0.01, num(s.fxDur, 0.5)), 0, 1);
      if (fx !== 'none' && fp < 1) {
        var al = 1 - fp;
        ctx.globalAlpha = al * 0.45;
        if (fx === 'ignited') paintSpecies(ctx, sp, s.dir, '#ffffff');
        ctx.globalAlpha = al;
        if (fx === 'ignited') {
          for (var q = 0; q < 6; q++) {
            var qa = q * Math.PI / 3 + 0.3;
            var d0 = 22 + fp * 12;
            ctx.beginPath();
            ctx.moveTo(Math.cos(qa) * d0, Math.sin(qa) * d0);
            ctx.lineTo(Math.cos(qa) * (d0 + 8), Math.sin(qa) * (d0 + 8));
            ctx.strokeStyle = C.outline; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.stroke();
          }
          arrowHead(ctx, 30, -10 - fp * 8, -Math.PI / 2, 8, C.redLine);
        } else if (fx === 'doused') {
          for (var w = 0; w < 4; w++) {
            var dx = -18 + w * 12, dy = -14 + fp * 26 + (w % 2) * 6;
            ctx.beginPath(); ctx.moveTo(dx, dy - 7); ctx.quadraticCurveTo(dx + 5, dy, dx, dy + 4); ctx.quadraticCurveTo(dx - 5, dy, dx, dy - 7);
            ctx.fillStyle = C.water; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = C.outline; ctx.stroke();
          }
          arrowHead(ctx, 30, 2 + fp * 8, Math.PI / 2, 8, C.water);
        } else if (fx === 'calmed') {
          circle(ctx, 0, 0, 34 + fp * 4);
          ctx.strokeStyle = C.whistle; ctx.lineWidth = 3; ctx.stroke();
          outText(ctx, '♪', 26, -18 - fp * 8, 18, C.whistle);
          arrowHead(ctx, -32, 2 + fp * 8, Math.PI / 2, 8, C.whistle);
        }
        ctx.globalAlpha = 1;
      }
      ctx.translate(-shake, -bob);
      if (wild) {
        // 頭上: 制伏進度(三個哨音點 + 分數)
        var sb = clamp(Math.floor(num(s.subdue, 0)), 0, 3);
        rrect(ctx, -46, -50, 92, 17, 8); ctx.fillStyle = 'rgba(11,10,16,0.85)'; ctx.fill();
        for (var u = 0; u < 3; u++) {
          circle(ctx, -34 + u * 15, -41.5, 5.5);
          ctx.fillStyle = u < sb ? C.whistle : '#3a3444'; ctx.fill();
          ctx.lineWidth = 1.5; ctx.strokeStyle = C.whistle; ctx.stroke();
        }
        outText(ctx, sb + '/3', 22, -41.5, 16, C.whistle);
        // 撞欄進度
        var cp = clamp(num(s.chargeT, 0) / Math.max(0.01, num(s.chargeDur, 1.5)), 0, 1);
        if (mode === 'charge' && cp > 0) {
          ctx.beginPath(); ctx.arc(0, 0, 46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cp);
          ctx.strokeStyle = C.outline; ctx.lineWidth = 6; ctx.stroke();
          ctx.strokeStyle = C.redLine; ctx.lineWidth = 3; ctx.stroke();
        }
      } else {
        rageBar(ctx, 0, -43, 80, 9, s.rage);
      }
      ctx.restore();
    },

    // 100×16 圍欄
    drawFence: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0);
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = C.fenceDk;
      ctx.fillRect(-49, -8, 6, 16); ctx.fillRect(43, -8, 6, 16);
      if (!s.broken) {
        ctx.fillStyle = C.fenceWood;
        ctx.fillRect(-46, -6, 92, 5); ctx.fillRect(-46, 2, 92, 5);
        ctx.strokeStyle = C.outline; ctx.lineWidth = 1.5;
        ctx.strokeRect(-46, -6, 92, 5); ctx.strokeRect(-46, 2, 92, 5);
        ctx.fillStyle = C.fenceDk; ctx.fillRect(-2, -8, 4, 16);
      } else {
        // 破: 斷成兩截往外歪 + 中間粉紅缺口
        ctx.fillStyle = 'rgba(255,46,136,0.35)'; ctx.fillRect(-14, -8, 28, 16);
        var pieces = [[-30, -3.5, 0.16], [-30, 4.5, -0.1], [30, -3.5, -0.16], [30, 4.5, 0.1]];
        for (var i = 0; i < 4; i++) {
          ctx.save(); ctx.translate(pieces[i][0], pieces[i][1]); ctx.rotate(pieces[i][2]);
          ctx.beginPath(); ctx.moveTo(-16, -2.5); ctx.lineTo(14, -2.5); ctx.lineTo(17, 0); ctx.lineTo(13, 2.5); ctx.lineTo(-16, 2.5); ctx.closePath();
          ctx.fillStyle = C.fenceWood; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = C.outline; ctx.stroke();
          ctx.restore();
        }
        ctx.strokeStyle = C.redLine; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(6, 6); ctx.moveTo(6, -6); ctx.lineTo(-6, 6); ctx.stroke();
      }
      ctx.restore();
    },

    // 60×90 觀眾
    drawVisitor: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), seat = Math.abs(Math.floor(num(s.seat, 0)));
      var shirts = ['#7a6f8f', '#6f8a7a', '#8f7a6a', '#6a7a8f', '#8a6f7f', '#7f8a6a'];
      ctx.save();
      ctx.translate(x, y);
      // 座椅
      rrect(ctx, -24, 30, 48, 12, 3); ctx.fillStyle = '#4a3a2c'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = C.outline; ctx.stroke();
      if (s.mode === 'empty') {
        rrect(ctx, -18, -8, 36, 38, 6);
        ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(165,159,181,0.4)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
        ctx.restore(); return;
      }
      var scared = s.mode === 'scared';
      var t = now();
      if (scared) ctx.translate(Math.sin(t * 30) * 2, -2);
      var shirt = shirts[seat % shirts.length];
      // 身體
      rrect(ctx, -14, -6, 28, 34, 8); ctx.fillStyle = scared ? '#9a96a4' : shirt; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = C.outline; ctx.stroke();
      // 手
      ctx.strokeStyle = scared ? '#9a96a4' : shirt; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath();
      if (scared) { ctx.moveTo(-12, 0); ctx.lineTo(-22, -26); ctx.moveTo(12, 0); ctx.lineTo(22, -26); }
      else { ctx.moveTo(-12, 2); ctx.lineTo(-16, 20); ctx.moveTo(12, 2); ctx.lineTo(16, 20); }
      ctx.stroke();
      // 頭
      circle(ctx, 0, -20, 11); ctx.fillStyle = '#e8cfb0'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.outline; ctx.stroke();
      ctx.fillStyle = C.outline;
      if (scared) {
        circle(ctx, -4, -22, 2.2); ctx.fill(); circle(ctx, 4, -22, 2.2); ctx.fill();
        circle(ctx, 0, -15, 3); ctx.fill();
        outText(ctx, '!', 20, -33, 18, C.redLine);
      } else {
        circle(ctx, -4, -21, 1.8); ctx.fill(); circle(ctx, 4, -21, 1.8); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -17, 4, 0.2, Math.PI - 0.2); ctx.strokeStyle = C.outline; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.restore();
    },

    // 每段開始前的標題卡(全畫面)。「按 Z 開始」由美術畫, RD 不要再畫
    drawTitleCard: function (ctx, s) {
      var day = num(s.day, 1), show = s.stage === 'show';
      ctx.save();
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      rrect(ctx, 90, 380, 540, 480, 24); ctx.fillStyle = C.panel; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = C.panelLine; ctx.stroke();
      outText(ctx, '第 ' + day + ' 天', 360, 460, 44, C.text);
      outText(ctx, show ? '表演場' : '地下城', 360, 540, 64, show ? C.ragePerform : C.rope);
      // 小圖示
      ctx.save(); ctx.translate(360, 670);
      if (show) {
        ctx.beginPath(); ctx.ellipse(0, 0, 110, 50, 0, 0, Math.PI * 2);
        ctx.fillStyle = C.arenaFloor; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.fenceWood; ctx.stroke();
        ctx.save(); ctx.translate(-40, -6); ctx.scale(0.8, 0.8); paintSpecies(ctx, 'fire', 1, null); ctx.restore();
        ctx.save(); ctx.translate(40, -6); ctx.scale(0.8, 0.8); paintSpecies(ctx, 'water', -1, null); ctx.restore();
      } else {
        for (var i = -2; i <= 2; i++) {
          ctx.fillStyle = i === 0 ? C.hall : (i < 0 ? C.lava : C.pond);
          ctx.fillRect(i * 44 - 22, -30, 44, 60);
        }
        ctx.strokeStyle = C.wallEdge; ctx.lineWidth = 3; ctx.strokeRect(-110, -30, 220, 60);
        ctx.save(); ctx.scale(0.8, 0.8); paintSpecies(ctx, 'thunder', 1, null); ctx.restore();
      }
      ctx.restore();
      outText(ctx, '按 Z 開始', 360, 800, 28, C.text);
      ctx.restore();
    },

    // 600×140 商店項目
    drawShopItem: function (ctx, s) {
      var x = num(s.x, 360), y = num(s.y, 300);
      var info = {
        whipPower: ['鞭力', '每鞭傷害 +1'],
        ropeBag: ['繩袋', '每天捕獸繩 +1'],
        armor: ['護甲', '心 +1'],
        silverWhistle: ['銀哨', '吹哨冷卻 −0.4 秒'],
      }[s.item] || [String(s.item), ''];
      var ok = !!s.affordable, sel = !!s.selected;
      ctx.save();
      ctx.translate(x, y);
      rrect(ctx, -298, -68, 596, 136, 16);
      ctx.fillStyle = sel ? C.panelHi : C.panel; ctx.fill();
      ctx.lineWidth = sel ? 5 : 2; ctx.strokeStyle = sel ? C.gold : C.panelLine; ctx.stroke();
      if (sel) arrowHead(ctx, -276, 0, 0, 12, C.gold);
      // 圖示
      ctx.save(); ctx.translate(-205, 0);
      circle(ctx, 0, 0, 44); ctx.fillStyle = '#1a1722'; ctx.fill();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (s.item === 'whipPower') {
        ctx.beginPath(); ctx.moveTo(-22, 22); ctx.lineTo(-10, 10);
        ctx.strokeStyle = C.tamerHat; ctx.lineWidth = 8; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-10, 10); ctx.bezierCurveTo(10, -10, 30, 0, 18, -22);
        ctx.strokeStyle = C.whip; ctx.lineWidth = 4; ctx.stroke();
      } else if (s.item === 'ropeBag') {
        for (var i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, 0, 24 - i * 7, 16 - i * 4, 0, 0, Math.PI * 2); ctx.strokeStyle = C.rope; ctx.lineWidth = 4; ctx.stroke(); }
      } else if (s.item === 'armor') {
        heartPath(ctx, 0, 2, 22); ctx.fillStyle = C.heart; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.outline; ctx.stroke();
        outText(ctx, '+', 0, 0, 24, C.text);
      } else {
        rrect(ctx, -22, -10, 32, 20, 8); ctx.fillStyle = '#d8dce6'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.outline; ctx.stroke();
        circle(ctx, 4, 0, 12); ctx.fillStyle = '#d8dce6'; ctx.fill(); ctx.stroke();
        circle(ctx, 4, 0, 4); ctx.fillStyle = C.outline; ctx.fill();
        outText(ctx, '♪', 26, -16, 20, C.whistle);
      }
      ctx.restore();
      outText(ctx, info[0], -140, -22, 34, C.text, 'left');
      outText(ctx, 'Lv ' + num(s.level, 0), -140 + 90, -22, 22, C.textDim, 'left');
      outText(ctx, info[1], -140, 24, 22, C.textDim, 'left');
      // 價格
      ctx.globalAlpha = ok ? 1 : 0.55;
      coin(ctx, 168, 0, 15);
      outText(ctx, String(num(s.cost, 0)), 192, 0, 34, ok ? C.gold : C.repDown, 'left');
      ctx.globalAlpha = 1;
      if (!ok) outText(ctx, '金幣不足', 220, 40, 17, C.repDown);
      ctx.restore();
    },

    drawButton: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), w = num(s.w, 200), h = num(s.h, 80), sel = !!s.selected;
      ctx.save();
      rrect(ctx, x, y, w, h, 18);
      ctx.fillStyle = sel ? C.gold : C.panel; ctx.fill();
      ctx.lineWidth = sel ? 5 : 2.5; ctx.strokeStyle = sel ? '#ffffff' : C.panelLine; ctx.stroke();
      outText(ctx, String(s.label == null ? '' : s.label), x + w / 2, y + h / 2, 34, sel ? C.outline : C.text, 'center', sel ? C.gold : C.outline);
      if (sel) arrowHead(ctx, x + 30, y + h / 2, 0, 12, C.outline);
      ctx.restore();
    },

    drawFloatText: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), kind = s.kind || 'gold';
      var p = clamp(num(s.t, 0) / Math.max(0.01, num(s.dur, 1)), 0, 1);
      if (p >= 1) return;
      var txt = String(s.text == null ? '' : s.text);
      var sty = {
        gold: [22, C.gold, C.outline, 'coin'],
        redGold: [30, C.gold, C.redLine, 'coin'],
        repUp: [20, C.rep, C.outline, 'star'],
        repDown: [20, C.repDown, C.outline, 'down'],
        capture: [32, '#ffffff', C.tamerHat, 'rope'],
        perk: [26, C.rope, C.outline, ''],
        parry: [30, '#ffffff', C.outline, 'parry'],
      }[kind] || [20, C.text, C.outline, ''];
      ctx.save();
      var yy = y - 44 * p;
      var pop = p < 0.12 ? 0.7 + p * 2.5 : 1;
      ctx.globalAlpha = p > 0.6 ? (1 - p) / 0.4 : 1;
      ctx.translate(x, yy); ctx.scale(pop, pop);
      ctx.font = font(sty[0]);
      var tw = textW(ctx, txt);
      var ix = -tw / 2 - sty[0] * 0.55;
      if (sty[3] === 'coin') coin(ctx, ix, 0, sty[0] * 0.38);
      else if (sty[3] === 'star') { star(ctx, ix, 0, sty[0] * 0.45, 0.45); ctx.fillStyle = C.rep; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.outline; ctx.stroke(); }
      else if (sty[3] === 'down') arrowHead(ctx, ix, 0, Math.PI / 2, sty[0] * 0.4, C.repDown);
      var off = sty[3] ? sty[0] * 0.2 : 0;
      ctx.font = font(sty[0]); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = kind === 'redGold' ? 7 : Math.max(4, sty[0] / 5);
      ctx.strokeStyle = sty[2]; ctx.strokeText(txt, off, 0);
      if (kind === 'redGold') { ctx.lineWidth = 3; ctx.strokeStyle = C.outline; ctx.strokeText(txt, off, 0); }
      ctx.fillStyle = sty[1]; ctx.fillText(txt, off, 0);
      ctx.restore();
    },

    // 結算(全畫面)。「按 Z 重來」由美術畫, RD 不要再畫
    drawResultPanel: function (ctx, s) {
      var stars = clamp(Math.floor(num(s.stars, 0)), 0, 3);
      ctx.save();
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      rrect(ctx, 60, 140, 600, 1000, 28); ctx.fillStyle = C.panel; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = C.panelLine; ctx.stroke();
      outText(ctx, '三天結算', 360, 220, 44, C.text);
      for (var i = 0; i < 3; i++) {
        star(ctx, 240 + i * 120, 340, 46, 0.45);
        ctx.fillStyle = i < stars ? C.gold : '#3a3444'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = C.outline; ctx.stroke();
      }
      var rows = [['名聲', String(num(s.rep, 0)), C.rep], ['賺得金幣', String(num(s.goldEarned, 0)), C.gold], ['彈反反射', num(s.reflects, 0) + ' 次', '#ffffff']];
      for (var r = 0; r < 3; r++) {
        var ry = 470 + r * 80;
        rrect(ctx, 110, ry - 32, 500, 64, 12); ctx.fillStyle = C.panelHi; ctx.fill();
        outText(ctx, rows[r][0], 140, ry, 28, C.textDim, 'left');
        outText(ctx, rows[r][1], 580, ry, 34, rows[r][2], 'right');
      }
      outText(ctx, '陣容與收服加成', 360, 735, 24, C.textDim);
      drawRosterRow(ctx, 360 - 1.5 * 130, 820, 130, 1.2, s.roster, s.perks, true);
      outText(ctx, '按 Z 重來', 360, 1060, 30, C.text);
      ctx.restore();
    },

    drawHud: function (ctx, s) {
      var ph = s.phase;
      if (ph === 'guide' || ph === 'title' || ph === 'result') return;
      ctx.save();
      ctx.fillStyle = C.hudBg; ctx.fillRect(0, 0, W, 120);
      ctx.fillStyle = C.hudLine; ctx.fillRect(0, 118, W, 2);
      var stage = ph === 'dungeon' ? '地下城' : ph === 'show' ? '表演場' : '商店';
      outText(ctx, '第 ' + num(s.day, 1) + ' 天', 16, 22, 20, C.textDim, 'left');
      outText(ctx, stage, 16, 50, 26, ph === 'show' ? C.ragePerform : ph === 'dungeon' ? C.rope : C.gold, 'left');
      // 金幣 / 名聲(固定右上)
      coin(ctx, 470, 30, 13);
      outText(ctx, String(num(s.gold, 0)), 490, 30, 28, C.gold, 'left');
      star(ctx, 600, 30, 14, 0.45); ctx.fillStyle = C.rep; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.outline; ctx.stroke();
      outText(ctx, String(num(s.rep, 0)), 620, 30, 28, C.rep, 'left');
      if (ph === 'dungeon' || ph === 'show') {
        // 時間: 大數字 + 細條
        var tl = Math.max(0, num(s.timeLeft, 0)), tm = Math.max(1, num(s.timeMax, 60));
        var low = tl <= 10;
        outText(ctx, String(Math.ceil(tl)), 170, 30, 34, low ? C.redLine : C.text, 'left');
        ctx.fillStyle = '#2a2632'; ctx.fillRect(230, 26, 200, 8);
        ctx.fillStyle = low ? C.redLine : C.text; ctx.fillRect(230, 26, 200 * clamp(tl / tm, 0, 1), 8);
        // 第二列(y 62~118): 左 x16~395 = 心 / 繩(地下城)或訊息(表演場); 陣容 x405~560; 冷卻鍵 x570~702
        if (ph === 'dungeon') {
          var mh = Math.max(0, Math.floor(num(s.maxHearts, 5))), hh = Math.floor(num(s.hearts, 0));
          var hg = mh > 0 ? Math.min(28, 236 / mh) : 28;
          for (var i = 0; i < mh; i++) {
            var hx = 30 + i * hg;
            heartPath(ctx, hx, 86, Math.min(11, hg * 0.42));
            ctx.fillStyle = i < hh ? C.heart : '#3a3444'; ctx.fill();
            ctx.lineWidth = 2; ctx.strokeStyle = C.outline; ctx.stroke();
          }
          var rm = Math.max(0, Math.floor(num(s.ropeMax, 3))), rp = Math.floor(num(s.ropes, 0));
          var rg = rm > 0 ? Math.min(26, 110 / rm) : 26;
          for (var j = 0; j < rm; j++) {
            var cx = 288 + j * rg, rr = Math.min(10, rg * 0.4);
            ctx.beginPath(); ctx.ellipse(cx, 86, rr, rr * 0.8, 0, 0, Math.PI * 2);
            ctx.strokeStyle = C.outline; ctx.lineWidth = 6; ctx.stroke();
            ctx.strokeStyle = j < rp ? C.rope : '#4a4458'; ctx.lineWidth = 3; ctx.stroke();
            ctx.beginPath(); ctx.ellipse(cx, 86, rr * 0.5, rr * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
          }
          cdKey(ctx, 600, 92, 'X', '翻滾', s.rollCd, s.rollCdMax);
        } else {
          cdKey(ctx, 600, 92, 'X', '吹哨', s.whistleCd, s.whistleCdMax);
          if (s.message) {
            ctx.font = font(22);
            var mw = Math.min(380, textW(ctx, String(s.message)) + 32);
            rrect(ctx, 16, 70, mw, 40, 20);
            ctx.fillStyle = 'rgba(255,46,136,0.22)'; ctx.fill();
            ctx.lineWidth = 2.5; ctx.strokeStyle = C.redLine; ctx.stroke();
            outText(ctx, String(s.message), 16 + mw / 2, 90, 22, C.text);
          }
        }
        cdKey(ctx, 672, 92, 'C', '彈反', s.parryCd, s.parryCdMax);
        drawRosterRow(ctx, 425, 80, 38, 0.45, s.roster, s.perks, false);
        // 地下城訊息: 畫面最下緣(馴獸師固定在畫面 y≈820, 下緣不壓路線)
        if (ph === 'dungeon' && s.message) {
          ctx.font = font(22);
          var dw = Math.min(680, textW(ctx, String(s.message)) + 32);
          rrect(ctx, 360 - dw / 2, 1222, dw, 40, 20);
          ctx.fillStyle = 'rgba(11,10,16,0.88)'; ctx.fill();
          ctx.lineWidth = 2.5; ctx.strokeStyle = C.redLine; ctx.stroke();
          outText(ctx, String(s.message), 360, 1242, 22, C.text);
        }
      } else if (ph === 'shop') {
        drawRosterRow(ctx, 425, 80, 38, 0.45, s.roster, s.perks, false);
        if (s.message) outText(ctx, String(s.message), 200, 90, 20, C.text);
      }
      ctx.restore();
    },

    // 說明頁示意圖: 只畫在 (x, y, w, h) 框內; 標題、說明文字、頁碼、翻頁提示由 RD 畫
    drawGuidePage: function (ctx, s) {
      var bx = num(s.x, 0), by = num(s.y, 0), bw = num(s.w, 600), bh = num(s.h, 480);
      var VW = 600, VH = 480;
      var sc = Math.min(bw / VW, bh / VH);
      ctx.save();
      ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
      ctx.translate(bx + (bw - VW * sc) / 2, by + (bh - VH * sc) / 2);
      ctx.scale(sc, sc);
      ctx.beginPath(); ctx.rect(0, 0, VW, VH); ctx.clip();
      var page = Math.floor(num(s.page, 0));
      (GUIDE[page] || GUIDE[0])(ctx);
      ctx.restore();
    },
  };

  // 陣容列: 四種魔物小圖(不在陣容 = 暗剪影)+ 下方三個加成點(亮幾個 = 幾級)
  // x0 = 第一隻中心, gap = 間距; big = 結算版(大圖 + 加成名)
  function drawRosterRow(ctx, x0, cy, gap, scale, roster, perks, big) {
    var have = {};
    if (roster && roster.length) for (var i = 0; i < roster.length; i++) {
      var it = roster[i];
      if (it) have[typeof it === 'string' ? it : it.species] = true;
    }
    perks = perks || {};
    var order = ['fire', 'water', 'thunder', 'stone'];
    ctx.save();
    for (var k = 0; k < 4; k++) {
      var sp = order[k], px = x0 + k * gap;
      ctx.save();
      ctx.translate(px, cy);
      ctx.scale(scale, scale);
      if (have[sp]) paintSpecies(ctx, sp, 1, null);
      else { ctx.globalAlpha = 0.6; paintSpecies(ctx, sp, 1, '#3a3444'); }
      ctx.restore();
      var lv = clamp(Math.floor(num(perks[sp], 0)), 0, 3);
      var dy = big ? cy + 50 : cy + 21, dr = big ? 7 : 3.5, dg = big ? 18 : 9;
      for (var d = 0; d < 3; d++) {
        circle(ctx, px - dg + d * dg, dy, dr);
        ctx.fillStyle = d < lv ? C[sp] : '#2a2632'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = d < lv ? C.outline : '#5a5468'; ctx.stroke();
      }
      if (big) {
        outText(ctx, SPECIES_NAME[sp], px, cy + 80, 18, have[sp] ? C.text : C.textDim);
        outText(ctx, PERK_NAME[sp] + ' Lv' + lv, px, cy + 106, 17, C.textDim);
      }
    }
    ctx.restore();
  }

  function cdKey(ctx, x, y, key, label, cd, cdMax) {
    var p = clamp(num(cd, 0) / Math.max(0.01, num(cdMax, 1)), 0, 1);
    ctx.save();
    rrect(ctx, x - 30, y - 30, 60, 46, 8);
    ctx.fillStyle = C.outline; ctx.fill();
    rrect(ctx, x - 28, y - 28, 56, 42, 7);
    ctx.fillStyle = p > 0 ? 'rgba(244,234,210,0.4)' : C.text; ctx.fill();
    if (p > 0) {
      ctx.save(); rrect(ctx, x - 28, y - 28, 56, 42, 7); ctx.clip();
      ctx.fillStyle = 'rgba(11,10,16,0.75)'; ctx.fillRect(x - 28, y - 28, 56, 42 * p);
      ctx.restore();
      ctx.setLineDash([4, 3]); rrect(ctx, x - 28, y - 28, 56, 42, 7);
      ctx.strokeStyle = C.textDim; ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.font = font(20); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = p > 0 ? C.text : C.outline; ctx.fillText(key, x, y - 16);
    ctx.font = font(17); ctx.fillText(label, x, y + 2);
    ctx.restore();
  }

  // ───────────────────────── 說明頁示意圖(虛擬 600×480) ─────────────────────────
  function gTiles(ctx, zoneFn) {
    for (var r = 0; r < 8; r++) for (var c = 0; c < 10; c++) {
      var z = zoneFn(c, r);
      Art.drawTile(ctx, { x: c * 60 + 30, y: r * 60 + 30, kind: z === 'wall' ? 'wall' : 'floor', zone: z === 'wall' ? 'hall' : z, nest: false });
    }
  }
  function gArena(ctx) {
    ctx.fillStyle = C.arenaFloor; ctx.fillRect(0, 0, 600, 480);
    ctx.strokeStyle = C.arenaLine; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(300, 240, 260, 210, 0, 0, Math.PI * 2); ctx.stroke();
  }
  function gLabel(ctx, txt, x, y, color) { outText(ctx, txt, x, y, 18, color || C.text); }
  function gArrow(ctx, x0, y0, x1, y1, color, dashed) {
    ctx.save();
    if (dashed) ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    ctx.strokeStyle = C.outline; ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
    ctx.setLineDash([]);
    arrowHead(ctx, x1, y1, Math.atan2(y1 - y0, x1 - x0), 9, color);
    ctx.restore();
  }
  function arrowKeys(ctx, x, y) {
    var k = 22;
    var pos = [[0, -1, '↑'], [-1, 0, '←'], [0, 0, '↓'], [1, 0, '→']];
    for (var i = 0; i < 4; i++) {
      var px = x + pos[i][0] * (k + 2), py = y + pos[i][1] * (k + 2);
      rrect(ctx, px - k / 2, py - k / 2, k, k, 4); ctx.fillStyle = C.outline; ctx.fill();
      rrect(ctx, px - k / 2 + 1.5, py - k / 2 + 1.5, k - 3, k - 3, 3); ctx.fillStyle = C.text; ctx.fill();
      ctx.font = font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.outline;
      ctx.fillText(pos[i][2], px, py);
    }
  }
  function upDown(ctx, x, y, up) {
    var col = up ? C.redLine : C.whistle;
    for (var i = 0; i < 2; i++) arrowHead(ctx, x, y + (up ? -i * 9 : i * 9), up ? -Math.PI / 2 : Math.PI / 2, 7, col);
  }

  var GUIDE = [
    // 第 1 頁 地下城: 揮鞭 / 翻滾穿火圈 / 彈反水彈
    function (ctx) {
      gTiles(ctx, function (c, r) { if (r === 0) return 'wall'; if (c >= 6) return 'pond'; if (r >= 4) return 'lava'; return 'hall'; });
      // A: 朝右揮鞭打中火蜥蜴
      Art.drawWhipCrack(ctx, { x: 100, y: 140, shape: 'arc', facing: 2, radius: 110, t: 0.08, dur: 0.25 });
      Art.drawWildMonster(ctx, { x: 190, y: 140, species: 'fire', hp: 6, maxHp: 10, hit: true, weak: false, lassoed: false, casting: false, dir: -1 });
      Art.drawTamer(ctx, { x: 100, y: 140, facing: 2, rolling: false, parryLeft: 0, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
      arrowKeys(ctx, 40, 150);
      keycap(ctx, 100, 200, 'Z');
      // B: 翻滾穿過火圈(殘影 → 翻滾中)
      Art.drawHazard(ctx, { x: 210, y: 340, kind: 'firering', phase: 'active', radius: 120, t: 0.1, dur: 0.5, angle: 0 });
      Art.drawWildMonster(ctx, { x: 210, y: 330, species: 'fire', hp: 10, maxHp: 10, hit: false, weak: false, lassoed: false, casting: false, dir: 1 });
      ctx.save(); ctx.globalAlpha = 0.4;
      Art.drawTamer(ctx, { x: 45, y: 420, facing: 2, rolling: false, parryLeft: 0, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
      ctx.restore();
      ctx.save(); ctx.setLineDash([5, 6]);
      ctx.beginPath(); ctx.moveTo(75, 420); ctx.lineTo(178, 420); ctx.strokeStyle = 'rgba(255,241,200,0.8)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
      Art.drawTamer(ctx, { x: 210, y: 420, facing: 2, rolling: true, parryLeft: 0, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
      keycap(ctx, 120, 452, 'X');
      // C: 舉盾彈反水彈, 反擊回水母
      var jx = 500, jy = 110, tx = 480, ty = 330;
      var ang = Math.atan2(ty - jy, tx - jx);
      Art.drawWildMonster(ctx, { x: jx, y: jy, species: 'water', hp: 5, maxHp: 7, hit: true, weak: false, lassoed: false, casting: false, dir: -1 });
      for (var k = -1; k <= 1; k += 2) {
        var a2 = ang + k * 10 * Math.PI / 180;
        Art.drawHazard(ctx, { x: jx + Math.cos(a2) * 195, y: jy + Math.sin(a2) * 195, kind: 'waterball', phase: 'active', radius: 12, t: 0, dur: 0, angle: a2 });
      }
      Art.drawTamer(ctx, { x: tx, y: ty, facing: 0, rolling: false, parryLeft: 0.14, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
      Art.drawHazard(ctx, { x: tx + Math.cos(ang + Math.PI) * 30, y: ty + Math.sin(ang + Math.PI) * 30, kind: 'waterball', phase: 'active', radius: 12, t: 0, dur: 0, angle: ang });
      Art.drawParryFlash(ctx, { x: tx + Math.cos(ang + Math.PI) * 28, y: ty + Math.sin(ang + Math.PI) * 28, t: 0.06, dur: 0.25 });
      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.moveTo(512, 290); ctx.quadraticCurveTo(560, 220, 520, 160);
      ctx.strokeStyle = C.outline; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
      arrowHead(ctx, 520, 160, Math.atan2(160 - 220, 520 - 560), 9, '#ffffff');
      keycap(ctx, 540, 370, 'C');
    },
    // 第 2 頁 收服: 殘血 + 套索 + 繞圈半圈; 角落: 滿圈收走
    function (ctx) {
      gTiles(ctx, function (c, r) { return r === 0 ? 'wall' : 'ruins'; });
      var mx = 300, my = 240, R = 130;
      // 繞圈路線: 走過的半圈實線, 剩下半圈虛線 + 箭頭
      ctx.save();
      ctx.beginPath(); ctx.arc(mx, my, R, 0, -Math.PI, true);
      ctx.strokeStyle = C.outline; ctx.lineWidth = 7; ctx.stroke(); ctx.strokeStyle = C.rope; ctx.lineWidth = 3.5; ctx.stroke();
      ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.arc(mx, my, R, Math.PI, Math.PI * 1.9, true);
      ctx.strokeStyle = 'rgba(226,184,102,0.75)'; ctx.lineWidth = 3.5; ctx.stroke();
      ctx.restore();
      var ea = Math.PI * 0.1 * -1 + Math.PI * 2; // 箭頭位置(右下)
      arrowHead(ctx, mx + Math.cos(Math.PI * 0.1) * R, my + Math.sin(Math.PI * 0.1) * R, Math.PI * 0.1 - Math.PI / 2, 10, C.rope);
      void ea;
      Art.drawLasso(ctx, { x1: mx - R, y1: my, x2: mx, y2: my, progress: 0.5, t: 2, limit: 5, len: R, maxLen: 220 });
      Art.drawWildMonster(ctx, { x: mx, y: my, species: 'stone', hp: 3, maxHp: 16, hit: false, weak: true, lassoed: true, casting: false, dir: 1 });
      Art.drawTamer(ctx, { x: mx - R, y: my, facing: 4, rolling: false, parryLeft: 0, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: true });
      // 角落小圖: 進度環滿 → 收走
      rrect(ctx, 450, 345, 140, 125, 14); ctx.fillStyle = 'rgba(11,10,16,0.85)'; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = C.panelLine; ctx.stroke();
      ctx.save(); ctx.translate(520, 405); ctx.scale(0.75, 0.75);
      ctx.globalAlpha = 0.45; paintSpecies(ctx, 'stone', 1, null); ctx.globalAlpha = 1;
      ringProgress(ctx, 0, 0, 42, 6, 1, C.rope);
      ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-5, 14); ctx.lineTo(20, -14);
      ctx.strokeStyle = C.outline; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.stroke();
      ctx.restore();
      gLabel(ctx, '收服!', 520, 455, '#ffffff');
    },
    // 第 3 頁 表演: 左鞭(怒氣上、表演、金幣) / 右哨(怒氣下)
    function (ctx) {
      gArena(ctx);
      ctx.fillStyle = 'rgba(11,10,16,0.6)'; ctx.fillRect(298, 0, 4, 480);
      // 左
      Art.drawWhipCrack(ctx, { x: 150, y: 280, shape: 'circle', facing: 0, radius: 110, t: 0.1, dur: 0.25 });
      Art.drawShowMonster(ctx, { x: 95, y: 205, species: 'water', rage: 70, mode: 'roam', performing: true, fx: 'none', fxT: 0, fxDur: 0.5, subdue: 0, chargeT: 0, chargeDur: 1.5, dir: 1 });
      Art.drawShowMonster(ctx, { x: 215, y: 335, species: 'thunder', rage: 62, mode: 'roam', performing: false, fx: 'none', fxT: 0, fxDur: 0.5, subdue: 0, chargeT: 0, chargeDur: 1.5, dir: -1 });
      var wa = Math.atan2(280 - 205, 150 - 95);
      for (var i = -1; i <= 1; i++) {
        var a = wa + i * 10 * Math.PI / 180;
        Art.drawHazard(ctx, { x: 95 + Math.cos(a) * 52, y: 205 + Math.sin(a) * 52, kind: 'waterball', phase: 'active', radius: 12, t: 0, dur: 0, angle: a });
      }
      Art.drawTamer(ctx, { x: 150, y: 280, facing: 4, rolling: false, parryLeft: 0, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
      upDown(ctx, 147, 165, true); upDown(ctx, 267, 295, true);
      Art.drawFloatText(ctx, { x: 95, y: 130, text: '+3', kind: 'gold', t: 0.25, dur: 1 });
      keycap(ctx, 150, 345, 'Z');
      // 右
      Art.drawWhistleWave(ctx, { x: 450, y: 280, radius: 140, t: 0.12, dur: 0.25 });
      Art.drawShowMonster(ctx, { x: 395, y: 205, species: 'stone', rage: 28, mode: 'roam', performing: false, fx: 'calmed', fxT: 0.1, fxDur: 0.5, subdue: 0, chargeT: 0, chargeDur: 1.5, dir: 1 });
      Art.drawShowMonster(ctx, { x: 520, y: 345, species: 'fire', rage: 30, mode: 'roam', performing: false, fx: 'calmed', fxT: 0.1, fxDur: 0.5, subdue: 0, chargeT: 0, chargeDur: 1.5, dir: -1 });
      Art.drawTamer(ctx, { x: 450, y: 280, facing: 4, rolling: false, parryLeft: 0, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
      upDown(ctx, 447, 155, false); upDown(ctx, 572, 295, false);
      keycap(ctx, 440, 345, 'X');
    },
    // 第 4 頁 反射: 舉盾擋落雷 → 反射波 → 圈內三隻點燃
    function (ctx) {
      gArena(ctx);
      var tx = 300, ty = 250;
      Art.drawShowMonster(ctx, { x: 530, y: 410, species: 'thunder', rage: 60, mode: 'roam', performing: true, fx: 'none', fxT: 0, fxDur: 0.5, subdue: 0, chargeT: 0, chargeDur: 1.5, dir: -1 });
      Art.drawReflectWave(ctx, { x: tx, y: ty, element: 'thunder', radius: 160, t: 0.3, dur: 0.4 });
      var ms = [['fire', 185, 185, 66, 1], ['water', 415, 190, 58, -1], ['stone', 300, 380, 55, 1]];
      for (var i = 0; i < 3; i++) {
        Art.drawShowMonster(ctx, { x: ms[i][1], y: ms[i][2], species: ms[i][0], rage: ms[i][3], mode: 'roam', performing: false, fx: 'ignited', fxT: 0.12, fxDur: 0.5, subdue: 0, chargeT: 0, chargeDur: 1.5, dir: ms[i][4] });
        upDown(ctx, ms[i][1] + 52, ms[i][2] - 40, true);
      }
      Art.drawHazard(ctx, { x: tx, y: ty, kind: 'thunder', phase: 'active', radius: 70, t: 0.02, dur: 0.2, angle: 0 });
      Art.drawTamer(ctx, { x: tx, y: ty, facing: 4, rolling: false, parryLeft: 0.15, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
      Art.drawParryFlash(ctx, { x: tx, y: ty, t: 0.05, dur: 0.25 });
      keycap(ctx, 352, 270, 'C');
    },
    // 第 5 頁 拿捏: 怒氣條 → 紅線金幣 / 滿了失控撞欄
    function (ctx) {
      gArena(ctx);
      // 觀眾席(下方)
      ctx.fillStyle = C.stands; ctx.fillRect(250, 290, 350, 120);
      ctx.fillStyle = C.standsRow; ctx.fillRect(250, 340, 350, 5); ctx.fillRect(250, 375, 350, 5);
      // 怒氣條
      var bx0 = 50, bw = 420;
      rageBar(ctx, bx0 + bw / 2, 120, bw, 30, 92);
      // 紅線區金幣
      var cs = [[400, 70], [425, 50], [450, 78], [390, 40], [440, 25], [415, 88], [462, 45]];
      for (var i = 0; i < cs.length; i++) coin(ctx, cs[i][0], cs[i][1], 11);
      gLabel(ctx, '×2', 500, 55, C.gold);
      // 最右端(滿)接到失控魔物
      ctx.save(); ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.moveTo(bx0 + bw + 4, 120); ctx.lineTo(520, 120); ctx.lineTo(520, 250);
      ctx.strokeStyle = C.outline; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = C.redLine; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
      arrowHead(ctx, 520, 252, Math.PI / 2, 9, C.redLine);
      for (var f = 0; f < 3; f++) Art.drawFence(ctx, { x: 300 + f * 100, y: 290, side: 'bottom', broken: f === 2 });
      Art.drawVisitor(ctx, { x: 300, y: 350, seat: 6, mode: 'watch' });
      Art.drawVisitor(ctx, { x: 420, y: 350, seat: 7, mode: 'scared' });
      Art.drawShowMonster(ctx, { x: 520, y: 345, species: 'fire', rage: 100, mode: 'loose', performing: false, fx: 'none', fxT: 0, fxDur: 0.5, subdue: 0, chargeT: 0, chargeDur: 1.5, dir: -1 });
      // 打叉
      ctx.save(); ctx.translate(580, 300);
      ctx.beginPath(); ctx.moveTo(-14, -14); ctx.lineTo(14, 14); ctx.moveTo(14, -14); ctx.lineTo(-14, 14);
      ctx.strokeStyle = C.outline; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.stroke();
      ctx.strokeStyle = C.redLine; ctx.lineWidth = 6; ctx.stroke();
      ctx.restore();
      // 左下: 一般表演對照(怒氣中段, 金幣少)
      Art.drawShowMonster(ctx, { x: 150, y: 290, species: 'thunder', rage: 60, mode: 'roam', performing: true, fx: 'none', fxT: 0, fxDur: 0.5, subdue: 0, chargeT: 0, chargeDur: 1.5, dir: 1 });
      coin(ctx, 200, 225, 11);
      // 流程
      gLabel(ctx, '地下城 → 表演場 → 商店   × 3 天 → ★', 300, 452, C.textDim);
    },
  ];

  // state 為 null / 非物件時當成空物件, 各欄位再各自退回預設
  Object.keys(Art).forEach(function (k) {
    var f = Art[k];
    if (typeof f !== 'function' || k === 'drawBackground' || k === 'drawShowArena') return;
    Art[k] = function (ctx, s) { return f.call(Art, ctx, S(s)); };
  });

  window.Art = Art;
})();
