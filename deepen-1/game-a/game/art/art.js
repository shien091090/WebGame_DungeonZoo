// 紅線連擊秀 — 美術(Canvas 2D 幾何繪製, 無外部資源)
// 全域物件 window.Art; 每個函式自己 save/restore。
(function () {
  'use strict';

  var P = {
    bg: '#121018',
    outline: '#1a1420',
    text: '#f4efe6',
    textDim: '#9a93a8',
    panel: '#1e1a28',
    panelHi: '#2c2638',
    // 物種色: 色相 11° / 76° / 210° / 271°, 灰階 111 / 205 / 161 / 78
    fire: '#e04420', fireDark: '#8a2410', fireHi: '#ffb040',
    thunder: '#c0f040', thunderDark: '#5e7a14', thunderHi: '#f4ffc0',
    water: '#60b0ff', waterDark: '#2a5a9a', waterHi: '#e0f2ff',
    stone: '#6a30a0', stoneDark: '#3a1660', stoneHi: '#b58ae0',
    tamerCoat: '#f2ecdc', tamerHat: '#8a5530', tamerHatHi: '#b87a48',
    gold: '#ffd23a', goldDark: '#8a6a10',
    rep: '#8fe8ff',
    danger: '#ff3a3a',
    redline: '#ff2a55',
    lasso: '#e0b060', lassoRing: '#ffd23a',
    whip: '#fff0b0',
    whistle: '#7ff5c8',
    parry: '#fffbe0',
    heart: '#ff5a6e',
    rageLow: '#7a86a8', rageMid: '#ffb02e',
    // 地形
    wall: '#18161f', wallTop: '#2f2c3a', wallEdge: '#4a4658',
    pillar: '#6b6878',
    lavaTile: '#c83a10', lavaGlow: '#ff8a20',
    waterTile: '#1c4a7a', waterWave: '#4a88c0',
    floorCrag: '#384050', floorRuins: '#4a4036', floorLava: '#3a2a2a', floorPond: '#2a4038', floorHall: '#2c2a33',
    arena: '#4a3c30', arenaLine: '#6a5844', stands: '#241e2c', seat: '#3a3046',
    fence: '#b88a50', fenceDark: '#6a4a28',
    star: '#ffd23a'
  };

  var SP = {
    fire: { c: P.fire, d: P.fireDark, h: P.fireHi, name: '火蜥蜴' },
    water: { c: P.water, d: P.waterDark, h: P.waterHi, name: '水母' },
    thunder: { c: P.thunder, d: P.thunderDark, h: P.thunderHi, name: '雷鳥' },
    stone: { c: P.stone, d: P.stoneDark, h: P.stoneHi, name: '石像鬼' }
  };
  var HAZ_SP = { firering: 'fire', waterball: 'water', thunder: 'thunder', quake: 'stone' };
  var ZONE_SP = { crag: 'thunder', ruins: 'stone', lava: 'fire', pond: 'water' };
  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';

  function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function num(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; }
  function font(sz, w) { return (w || 'bold') + ' ' + sz + 'px ' + FONT; }

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

  // 帶深色描邊的字(P10)
  function txt(ctx, s, x, y, sz, col, align, base, strokeW) {
    ctx.font = font(sz);
    ctx.textAlign = align || 'center';
    ctx.textBaseline = base || 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = strokeW == null ? Math.max(3, sz / 6) : strokeW;
    ctx.strokeStyle = P.outline;
    if (ctx.lineWidth > 0) ctx.strokeText(s, x, y);
    ctx.fillStyle = col;
    ctx.fillText(s, x, y);
  }

  function star(ctx, x, y, r, col, line) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var rr2 = i % 2 ? r * 0.45 : r;
      ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2);
    }
    ctx.closePath();
    if (col) { ctx.fillStyle = col; ctx.fill(); }
    if (line) { ctx.lineWidth = 2; ctx.strokeStyle = line; ctx.stroke(); }
  }

  function coin(ctx, x, y, r) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = P.gold; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
    ctx.strokeStyle = P.goldDark; ctx.lineWidth = 1.5; ctx.stroke();
  }

  function heartPath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.45);
    ctx.bezierCurveTo(x - s * 0.9, y - s * 0.1, x - s * 0.5, y - s * 0.7, x, y - s * 0.25);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 0.7, x + s * 0.9, y - s * 0.1, x, y + s * 0.45);
    ctx.closePath();
  }

  function keycap(ctx, x, y, w, h, label, cdRatio, dim) {
    // x,y 左上; cdRatio: 0 = 可用, 1 = 剛用掉
    ctx.save();
    rr(ctx, x, y + 3, w, h, 6); ctx.fillStyle = '#0a0810'; ctx.fill();
    rr(ctx, x, y, w, h, 6); ctx.fillStyle = dim ? '#3a3446' : '#e8e2d4'; ctx.fill();
    if (cdRatio > 0) {
      // 已恢復的部分維持本色(下方), 剩餘冷卻用深色蓋在上方
      ctx.save(); rr(ctx, x, y, w, h, 6); ctx.clip();
      ctx.fillStyle = '#2a2434';
      ctx.fillRect(x, y, w, h * clamp(cdRatio, 0, 1));
      ctx.restore();
    }
    rr(ctx, x, y, w, h, 6); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
    var fs = label.length > 1 ? Math.min(h * 0.5, w / label.length * 0.9) : h * 0.62;
    ctx.font = font(Math.round(fs));
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = (cdRatio > 0 || dim) ? '#8a8298' : '#1a1420';
    ctx.fillText(label, x + w / 2, y + h / 2 + 1);
    ctx.restore();
  }

  function arrowKeys(ctx, cx, cy, k) {
    k = k || 22;
    keycap(ctx, cx - k / 2, cy - k * 1.05, k, k, '↑', 0);
    keycap(ctx, cx - k * 1.55, cy + 0.05 * k, k, k, '←', 0);
    keycap(ctx, cx - k / 2, cy + 0.05 * k, k, k, '↓', 0);
    keycap(ctx, cx + k * 0.55, cy + 0.05 * k, k, k, '→', 0);
  }

  // ---------- 物種本體(地下城、表演場、HUD、結算共用) ----------
  // s: 基準半徑; dir: 1 朝右 / -1 朝左; o: { flash, eyes: 'normal'|'dizzy'|'angry', gray }
  function speciesBody(ctx, sp, s, dir, o) {
    o = o || {};
    var C = SP[sp] || SP.fire;
    var c = o.flash ? '#ffffff' : C.c, d = o.flash ? '#e8e8f0' : C.d, h = o.flash ? '#ffffff' : C.h;
    if (o.gray) { c = '#8a8494'; d = '#5a5464'; h = '#c8c2d0'; }
    var lw = Math.max(2, s * 0.09);
    ctx.save();
    ctx.scale(dir < 0 ? -1 : 1, 1);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = P.outline; ctx.lineWidth = lw;
    var eyeX, eyeY, eyeR = s * 0.13;
    if (sp === 'water') {
      // 水母: 圓頂 + 波浪裙 + 觸手
      ctx.beginPath();
      for (var i = 0; i < 4; i++) {
        var tx = -s * 0.5 + i * s * 0.33;
        ctx.moveTo(tx, s * 0.15);
        ctx.quadraticCurveTo(tx - s * 0.18, s * 0.5, tx + s * 0.05, s * 0.88);
      }
      ctx.lineWidth = lw * 1.6; ctx.strokeStyle = P.outline; ctx.stroke();
      ctx.lineWidth = lw * 0.8; ctx.strokeStyle = d; ctx.stroke();
      ctx.lineWidth = lw; ctx.strokeStyle = P.outline;
      ctx.beginPath();
      ctx.moveTo(-s * 0.85, s * 0.2);
      ctx.bezierCurveTo(-s * 0.9, -s * 0.95, s * 0.9, -s * 0.95, s * 0.85, s * 0.2);
      for (var j = 0; j < 5; j++) {
        var x0 = s * 0.85 - j * s * 0.34;
        ctx.quadraticCurveTo(x0 - s * 0.17, s * 0.42, x0 - s * 0.34, s * 0.2);
      }
      ctx.closePath();
      ctx.fillStyle = c; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-s * 0.3, -s * 0.45, s * 0.2, s * 0.1, -0.5, 0, Math.PI * 2);
      ctx.fillStyle = h; ctx.fill();
      eyeX = s * 0.25; eyeY = -s * 0.15;
    } else if (sp === 'thunder') {
      // 雷鳥: 圓身 + 三角翼 + 鋸齒冠 + 喙
      ctx.beginPath();
      ctx.moveTo(-s * 0.2, -s * 0.1); ctx.lineTo(-s * 0.95, -s * 0.75); ctx.lineTo(-s * 0.7, s * 0.2); ctx.closePath();
      ctx.fillStyle = d; ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.1, -s * 0.1); ctx.lineTo(s * 0.55, -s * 0.9); ctx.lineTo(s * 0.6, s * 0.1); ctx.closePath();
      ctx.fillStyle = d; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, s * 0.15, s * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = c; ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.2, -s * 0.4); ctx.lineTo(-s * 0.05, -s * 0.85); ctx.lineTo(s * 0.05, -s * 0.55); ctx.lineTo(s * 0.25, -s * 0.9); ctx.lineTo(s * 0.3, -s * 0.4);
      ctx.fillStyle = h; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.55, s * 0.05); ctx.lineTo(s * 0.92, s * 0.18); ctx.lineTo(s * 0.55, s * 0.32); ctx.closePath();
      ctx.fillStyle = P.gold; ctx.fill(); ctx.stroke();
      eyeX = s * 0.28; eyeY = s * 0.02;
    } else if (sp === 'stone') {
      // 石像鬼: 方塊身 + 角 + 小翼
      ctx.beginPath();
      ctx.moveTo(-s * 0.55, -s * 0.2); ctx.lineTo(-s * 0.95, -s * 0.55); ctx.lineTo(-s * 0.85, s * 0.1); ctx.closePath();
      ctx.moveTo(s * 0.55, -s * 0.2); ctx.lineTo(s * 0.95, -s * 0.55); ctx.lineTo(s * 0.85, s * 0.1); ctx.closePath();
      ctx.fillStyle = d; ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, -s * 0.55); ctx.lineTo(-s * 0.5, -s * 0.92); ctx.lineTo(-s * 0.18, -s * 0.6); ctx.closePath();
      ctx.moveTo(s * 0.4, -s * 0.55); ctx.lineTo(s * 0.5, -s * 0.92); ctx.lineTo(s * 0.18, -s * 0.6); ctx.closePath();
      ctx.fillStyle = h; ctx.fill(); ctx.stroke();
      rr(ctx, -s * 0.62, -s * 0.62, s * 1.24, s * 1.4, s * 0.18);
      ctx.fillStyle = c; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.35); ctx.lineTo(-s * 0.1, s * 0.5); ctx.lineTo(-s * 0.25, s * 0.68);
      ctx.strokeStyle = h; ctx.lineWidth = lw * 0.7; ctx.stroke();
      ctx.strokeStyle = P.outline; ctx.lineWidth = lw;
      eyeX = s * 0.22; eyeY = -s * 0.2;
    } else {
      // 火蜥蜴: 長身 + 捲尾火焰 + 腳
      ctx.beginPath();
      ctx.moveTo(-s * 0.6, s * 0.1);
      ctx.quadraticCurveTo(-s * 1.0, s * 0.1, -s * 0.9, -s * 0.35);
      ctx.lineWidth = lw * 3; ctx.strokeStyle = P.outline; ctx.stroke();
      ctx.lineWidth = lw * 1.6; ctx.strokeStyle = c; ctx.stroke();
      ctx.lineWidth = lw; ctx.strokeStyle = P.outline;
      ctx.beginPath();
      ctx.moveTo(-s * 0.9, -s * 0.3);
      ctx.quadraticCurveTo(-s * 1.0, -s * 0.6, -s * 0.85, -s * 0.85);
      ctx.quadraticCurveTo(-s * 0.72, -s * 0.6, -s * 0.7, -s * 0.4);
      ctx.closePath();
      ctx.fillStyle = h; ctx.fill(); ctx.stroke();
      for (var k = 0; k < 2; k++) {
        var lx = -s * 0.35 + k * s * 0.6;
        ctx.beginPath(); ctx.ellipse(lx, s * 0.42, s * 0.12, s * 0.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = d; ctx.fill(); ctx.stroke();
      }
      ctx.beginPath(); ctx.ellipse(-s * 0.05, s * 0.1, s * 0.65, s * 0.38, 0, 0, Math.PI * 2);
      ctx.fillStyle = c; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(s * 0.6, -s * 0.05, s * 0.32, s * 0.28, 0, 0, Math.PI * 2);
      ctx.fillStyle = c; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(-s * 0.2, 0, s * 0.08, 0, Math.PI * 2); ctx.arc(s * 0.1, 0.05 * s, s * 0.07, 0, Math.PI * 2);
      ctx.fillStyle = h; ctx.fill();
      eyeX = s * 0.68; eyeY = -s * 0.12;
    }
    // 眼
    var eyes = o.eyes || 'normal';
    if (eyes === 'dizzy') {
      ctx.beginPath();
      for (var a = 0; a < Math.PI * 3.2; a += 0.3) {
        var r0 = eyeR * 1.4 * a / (Math.PI * 3.2);
        ctx.lineTo(eyeX + Math.cos(a) * r0, eyeY + Math.sin(a) * r0);
      }
      ctx.lineWidth = Math.max(1.5, lw * 0.6); ctx.strokeStyle = P.outline; ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(eyeX, eyeY, eyeR * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.lineWidth = Math.max(1, lw * 0.5); ctx.strokeStyle = P.outline; ctx.stroke();
      ctx.beginPath(); ctx.arc(eyeX + eyeR * 0.35, eyeY, eyeR * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = eyes === 'angry' ? P.danger : P.outline; ctx.fill();
      if (eyes === 'angry') {
        ctx.beginPath(); ctx.moveTo(eyeX - eyeR * 1.4, eyeY - eyeR * 1.8); ctx.lineTo(eyeX + eyeR * 1.4, eyeY - eyeR * 0.9);
        ctx.lineWidth = lw; ctx.strokeStyle = P.outline; ctx.stroke();
      }
    }
    ctx.restore();
  }

  function shadow(ctx, x, y, rx, ry) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
  }

  function speciesIcon(ctx, sp, x, y, s, mastery) {
    ctx.save(); ctx.translate(x, y);
    speciesBody(ctx, sp, s, 1, {});
    ctx.restore();
    if (mastery != null) masteryPips(ctx, x, y + s * 1.05 + 4, mastery, Math.max(3, s * 0.2));
  }
  function masteryPips(ctx, x, y, m, r) {
    ctx.save();
    for (var i = 0; i < 3; i++) {
      var px = x + (i - 1) * r * 2.6;
      ctx.beginPath(); ctx.arc(px, y, r, 0, Math.PI * 2);
      ctx.fillStyle = i < m ? P.redline : '#3a3446'; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = P.outline; ctx.stroke();
    }
    ctx.restore();
  }

  function facingAngle(f) { return (num(f, 0) % 8) * Math.PI / 4 - Math.PI / 2; } // 0 上, 順時針

  // ================== 匯出 ==================
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
      var x = num(s.x, 0) - 30, y = num(s.y, 0) - 30, kind = s.kind, zone = s.zone;
      ctx.save();
      var floorCol = { crag: P.floorCrag, ruins: P.floorRuins, lava: P.floorLava, pond: P.floorPond, hall: P.floorHall }[zone] || P.floorHall;
      if (kind === 'wall') {
        ctx.fillStyle = P.wall; ctx.fillRect(x, y, 60, 60);
        ctx.fillStyle = P.wallTop; ctx.fillRect(x + 3, y + 3, 54, 40);
        ctx.fillStyle = P.wallEdge; ctx.fillRect(x + 3, y + 3, 54, 4);
        ctx.strokeStyle = P.wall; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + 3, y + 23); ctx.lineTo(x + 57, y + 23); ctx.moveTo(x + 30, y + 3); ctx.lineTo(x + 30, y + 23);
        ctx.moveTo(x + 15, y + 23); ctx.lineTo(x + 15, y + 43); ctx.moveTo(x + 45, y + 23); ctx.lineTo(x + 45, y + 43); ctx.stroke();
      } else {
        // 地板底
        ctx.fillStyle = floorCol; ctx.fillRect(x, y, 60, 60);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, 59, 59);
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 2;
        ctx.beginPath();
        if (zone === 'crag') { ctx.moveTo(x + 10, y + 14); ctx.lineTo(x + 22, y + 24); ctx.lineTo(x + 18, y + 36); ctx.moveTo(x + 40, y + 40); ctx.lineTo(x + 50, y + 48); }
        else if (zone === 'ruins') { ctx.rect(x + 6, y + 6, 22, 22); ctx.rect(x + 32, y + 32, 22, 22); }
        else if (zone === 'lava') { ctx.arc(x + 18, y + 40, 3, 0, 6.3); ctx.moveTo(x + 46, y + 16); ctx.arc(x + 43, y + 16, 3, 0, 6.3); }
        else if (zone === 'pond') { ctx.moveTo(x + 12, y + 20); ctx.quadraticCurveTo(x + 18, y + 14, x + 24, y + 20); ctx.moveTo(x + 36, y + 44); ctx.quadraticCurveTo(x + 42, y + 38, x + 48, y + 44); }
        ctx.stroke();
        if (kind === 'lava') {
          ctx.fillStyle = P.lavaTile; ctx.fillRect(x, y, 60, 60);
          ctx.fillStyle = P.lavaGlow;
          ctx.beginPath(); ctx.ellipse(x + 20, y + 22, 12, 8, 0.3, 0, 6.3); ctx.fill();
          ctx.beginPath(); ctx.ellipse(x + 42, y + 42, 10, 6, -0.4, 0, 6.3); ctx.fill();
          ctx.fillStyle = '#ffe080';
          ctx.beginPath(); ctx.arc(x + 20, y + 22, 3, 0, 6.3); ctx.arc(x + 44, y + 41, 2.5, 0, 6.3); ctx.fill();
          ctx.strokeStyle = '#6a1a08'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, 58, 58);
        } else if (kind === 'water') {
          ctx.fillStyle = P.waterTile; ctx.fillRect(x, y, 60, 60);
          ctx.strokeStyle = P.waterWave; ctx.lineWidth = 2.5;
          for (var w = 0; w < 3; w++) {
            var wy = y + 14 + w * 16;
            ctx.beginPath(); ctx.moveTo(x + 6, wy);
            ctx.quadraticCurveTo(x + 18, wy - 6, x + 30, wy); ctx.quadraticCurveTo(x + 42, wy + 6, x + 54, wy); ctx.stroke();
          }
        } else if (kind === 'pillar') {
          ctx.beginPath(); ctx.arc(x + 30, y + 33, 26, 0, 6.3); ctx.fillStyle = P.wall; ctx.fill();
          ctx.beginPath(); ctx.arc(x + 30, y + 30, 26, 0, 6.3); ctx.fillStyle = P.pillar; ctx.fill();
          ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
          ctx.beginPath(); ctx.arc(x + 30, y + 30, 17, 0, 6.3); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 3; ctx.stroke();
        }
        if (s.nest && kind !== 'wall') {
          var sp = ZONE_SP[zone];
          ctx.setLineDash([5, 5]); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(160,120,70,0.7)';
          ctx.beginPath(); ctx.arc(x + 30, y + 30, 22, 0, 6.3); ctx.stroke(); ctx.setLineDash([]);
          if (sp) {
            ctx.globalAlpha = 0.55; ctx.fillStyle = SP[sp].c;
            ctx.beginPath(); ctx.ellipse(x + 25, y + 31, 5, 7, -0.3, 0, 6.3); ctx.ellipse(x + 35, y + 30, 5, 7, 0.3, 0, 6.3); ctx.fill();
          }
        }
      }
      ctx.restore();
    },

    drawTamer: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0);
      var ang = facingAngle(s.facing);
      var t = now();
      ctx.save();
      ctx.translate(x, y);
      if (s.blink && Math.floor(t / 90) % 2 === 0) ctx.globalAlpha = 0.35;
      var stunned = num(s.stunLeft, 0) > 0;
      shadow(ctx, 0, 14, 18, 6);
      if (s.rolling) {
        // 翻滾: 縮成球 + 身後速度弧
        ctx.save(); ctx.rotate(ang);
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (var i = 0; i < 3; i++) {
          ctx.beginPath(); ctx.arc(-4 - i * 4, 0, 14 + i * 2, Math.PI * 0.72, Math.PI * 1.28); ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(0, 0, 16, 0, 6.3); ctx.fillStyle = P.tamerCoat; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 16, -0.6, 0.6); ctx.lineTo(0, 0); ctx.closePath(); ctx.fillStyle = P.tamerHat; ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, 16, 0, 6.3); ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.restore();
      } else {
        // 手 + 鞭柄朝面向
        var hx = Math.cos(ang) * 20, hy = Math.sin(ang) * 20;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(Math.cos(ang) * 10, Math.sin(ang) * 10); ctx.lineTo(hx, hy);
        ctx.lineWidth = 7; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = '#6a4020'; ctx.stroke();
        // 身體(判定圓半徑 18)
        ctx.beginPath(); ctx.arc(0, 0, 18, 0, 6.3);
        ctx.fillStyle = stunned ? '#b8b2c0' : P.tamerCoat; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
        // 帽子(俯視)
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, 6.3); ctx.fillStyle = P.tamerHat; ctx.fill();
        ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(-Math.cos(ang) * 2, -Math.sin(ang) * 2, 7, 0, 6.3); ctx.fillStyle = P.tamerHatHi; ctx.fill();
        // 面向鼻尖
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * 25, Math.sin(ang) * 25);
        ctx.lineTo(Math.cos(ang + 0.35) * 17, Math.sin(ang + 0.35) * 17);
        ctx.lineTo(Math.cos(ang - 0.35) * 17, Math.sin(ang - 0.35) * 17);
        ctx.closePath(); ctx.fillStyle = P.tamerCoat; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
        if (s.lassoing) {
          // 手上一圈繩結
          ctx.beginPath(); ctx.arc(hx, hy, 5, 0, 6.3); ctx.lineWidth = 3; ctx.strokeStyle = P.lasso; ctx.stroke();
        }
      }
      // 舉盾 = 彈反時機
      var pl = num(s.parryLeft, 0), pd = num(s.parryDur, 0.2) || 0.2;
      if (pl > 0) {
        var k = clamp(pl / pd, 0, 1);
        ctx.save(); ctx.rotate(ang);
        ctx.beginPath(); ctx.arc(0, 0, 27, -1.0, 1.0);
        ctx.lineCap = 'round';
        ctx.lineWidth = 9; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 6; ctx.strokeStyle = P.parry; ctx.stroke();
        ctx.globalAlpha *= 0.35 + 0.5 * k;
        ctx.beginPath(); ctx.arc(0, 0, 27, -1.0, 1.0); ctx.lineTo(0, 0); ctx.closePath();
        ctx.fillStyle = P.parry; ctx.fill();
        ctx.restore();
      }
      // 暈眩: 頭上轉圈星 + 剩餘環
      if (stunned) {
        var sd = num(s.stunDur, 1.5) || 1.5;
        ctx.beginPath(); ctx.arc(0, 0, 22, -Math.PI / 2, -Math.PI / 2 + 6.283 * clamp(s.stunLeft / sd, 0, 1));
        ctx.lineWidth = 3; ctx.strokeStyle = '#c8c2d0'; ctx.stroke();
        for (var j = 0; j < 3; j++) {
          var a = t / 300 + j * 2.094;
          star(ctx, Math.cos(a) * 14, -22 + Math.sin(a) * 4, 6, P.gold, P.outline);
        }
      }
      ctx.restore();
    },

    drawWildMonster: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), sp = s.species, dir = s.dir < 0 ? -1 : 1;
      var t = now();
      ctx.save();
      ctx.translate(x, y);
      var ox = 0;
      if (s.lassoed) ox = Math.sin(t / 45) * 2.5;
      shadow(ctx, ox, 34, 26, 7);
      // 施法預備: 物種色外光
      if (s.casting) {
        var pulse = 0.5 + 0.5 * Math.sin(t / 70);
        ctx.beginPath(); ctx.arc(ox, 4, 36, 0, 6.3);
        ctx.fillStyle = SP[sp] ? SP[sp].c : P.danger; ctx.globalAlpha = 0.25 + 0.25 * pulse; ctx.fill();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 3; ctx.strokeStyle = SP[sp] ? SP[sp].h : '#fff'; ctx.stroke();
      }
      // 殘血: 金色虛線旋轉環 = 可以套(與套索進度環同色)
      if (s.weak && !s.lassoed) {
        ctx.save(); ctx.rotate(t / 600);
        ctx.setLineDash([8, 7]); ctx.lineWidth = 3; ctx.strokeStyle = P.lassoRing;
        ctx.beginPath(); ctx.arc(0, 4, 38, 0, 6.3); ctx.stroke();
        ctx.restore();
      }
      ctx.save(); ctx.translate(ox, 4);
      speciesBody(ctx, sp, 30, dir, { eyes: s.weak ? 'dizzy' : 'normal' });
      if (s.hit) { ctx.globalAlpha = 0.75; speciesBody(ctx, sp, 30, dir, { flash: true }); ctx.globalAlpha = 1; }
      if (s.lassoed) {
        ctx.beginPath(); ctx.ellipse(0, 2, 30, 12, 0, 0, 6.3);
        ctx.lineWidth = 6; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 3.5; ctx.strokeStyle = P.lasso; ctx.stroke();
      }
      ctx.restore();
      // 殘血汗滴
      if (s.weak) {
        ctx.beginPath(); ctx.moveTo(26, -26); ctx.quadraticCurveTo(33, -16, 26, -12); ctx.quadraticCurveTo(19, -16, 26, -26);
        ctx.fillStyle = '#bfe4ff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
      }
      // 血條(30% 刻度 = 可套門檻)
      var maxHp = Math.max(1, num(s.maxHp, 1)), hp = clamp(num(s.hp, maxHp), 0, maxHp);
      var bw = 60, bx = -30, by = -43;
      rr(ctx, bx - 2, by - 2, bw + 4, 10, 4); ctx.fillStyle = P.outline; ctx.fill();
      ctx.fillStyle = '#3a3446'; ctx.fillRect(bx, by, bw, 6);
      ctx.fillStyle = s.weak ? P.lassoRing : '#ff6a5a'; ctx.fillRect(bx, by, bw * hp / maxHp, 6);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(bx + bw * 0.3 - 1, by - 2, 2, 10);
      if (s.casting) txt(ctx, '!', 33, -30, 22, SP[sp] ? SP[sp].h : '#fff', 'center', 'middle', 4);
      ctx.restore();
    },

    drawLasso: function (ctx, s) {
      var x1 = num(s.x1, 0), y1 = num(s.y1, 0), x2 = num(s.x2, 0), y2 = num(s.y2, 0);
      var tension = clamp(num(s.len, 0) / (num(s.maxLen, 220) || 220), 0, 1);
      var prog = clamp(num(s.progress, 0), 0, 1);
      var left = clamp(1 - num(s.t, 0) / (num(s.limit, 5) || 5), 0, 1);
      var t = now();
      ctx.save();
      // 繩: 鬆時下垂, 越接近最大長度越直、越紅、越粗
      var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      var sag = (1 - tension) * 40;
      if (tension > 0.8) { var j = Math.sin(t / 30) * 2 * (tension - 0.8) / 0.2; mx += j; my += j; }
      var col = tension > 0.8 ? '#ff6a40' : (tension > 0.6 ? '#f0a050' : P.lasso);
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my + sag, x2, y2);
      ctx.lineWidth = (tension > 0.8 ? 5 : 3.5) + 3; ctx.strokeStyle = P.outline; ctx.stroke();
      ctx.lineWidth = tension > 0.8 ? 5 : 3.5; ctx.strokeStyle = col; ctx.stroke();
      // 時限: 外圈細白弧, 最後 30% 變紅閃
      var low = left < 0.3;
      if (!low || Math.floor(t / 120) % 2 === 0) {
        ctx.beginPath(); ctx.arc(x2, y2 + 4, 62, -Math.PI / 2, -Math.PI / 2 + 6.283 * left);
        ctx.lineWidth = 3; ctx.strokeStyle = low ? P.danger : 'rgba(255,255,255,0.75)'; ctx.stroke();
      }
      // 繞圈進度: 粗金環
      ctx.beginPath(); ctx.arc(x2, y2 + 4, 52, 0, 6.283);
      ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(20,16,30,0.7)'; ctx.stroke();
      if (prog > 0) {
        ctx.beginPath(); ctx.arc(x2, y2 + 4, 52, -Math.PI / 2, -Math.PI / 2 + 6.283 * prog);
        ctx.lineWidth = 7; ctx.strokeStyle = P.lassoRing; ctx.stroke();
      }
      ctx.restore();
    },

    drawHazard: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), kind = s.kind, r = Math.max(0, num(s.radius, 0));
      var C = SP[HAZ_SP[kind]] || SP.fire;
      var dur = num(s.dur, 0), k = dur > 0 ? clamp(num(s.t, 0) / dur, 0, 1) : 1;
      var warn = s.phase === 'warn';
      ctx.save();
      if (kind === 'waterball') {
        var a = num(s.angle, 0);
        ctx.translate(x, y); ctx.rotate(a);
        ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-4, -9); ctx.lineTo(-4, 9); ctx.closePath();
        ctx.fillStyle = 'rgba(96,176,255,0.45)'; ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, 6.3);
        ctx.fillStyle = C.c; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.beginPath(); ctx.arc(3, -4, 4, 0, 6.3); ctx.fillStyle = C.h; ctx.fill();
        ctx.restore(); return;
      }
      if (kind === 'quake') {
        // 環帶: 半徑 radius ± 15
        var inner = Math.max(0, r - 15), outer = r + 15;
        ctx.beginPath(); ctx.arc(x, y, outer, 0, 6.3); ctx.arc(x, y, inner, 0, 6.3, true);
        ctx.fillStyle = warn ? 'rgba(106,48,160,0.25)' : 'rgba(106,48,160,0.6)'; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = P.outline;
        ctx.beginPath(); ctx.arc(x, y, outer, 0, 6.3); ctx.stroke();
        ctx.strokeStyle = C.h; ctx.lineWidth = 2; ctx.setLineDash(warn ? [8, 6] : []);
        ctx.beginPath(); ctx.arc(x, y, outer - 2, 0, 6.3); ctx.stroke();
        if (inner > 4) { ctx.beginPath(); ctx.arc(x, y, inner, 0, 6.3); ctx.stroke(); }
        // 碎石
        ctx.setLineDash([]); ctx.fillStyle = C.h;
        for (var q = 0; q < 10; q++) {
          var qa = q * 0.628 + r * 0.01;
          ctx.beginPath(); ctx.arc(x + Math.cos(qa) * r, y + Math.sin(qa) * r, 3.5, 0, 6.3); ctx.fill();
        }
        ctx.restore(); return;
      }
      // 火圈 / 落雷: 預警 = 虛線框 + 由中心長大的填色, 填滿 = 生效
      if (warn) {
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, r * k, 0, 6.3);
        ctx.fillStyle = C.c; ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1;
        ctx.lineWidth = 5; ctx.strokeStyle = P.outline;
        ctx.beginPath(); ctx.arc(x, y, r - 2, 0, 6.3); ctx.stroke();
        ctx.setLineDash([12, 8]); ctx.lineWidth = 3; ctx.strokeStyle = C.c; ctx.stroke(); ctx.setLineDash([]);
        if (kind === 'thunder') {
          ctx.lineWidth = 2; ctx.strokeStyle = C.h;
          ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y); ctx.moveTo(x, y - 14); ctx.lineTo(x, y + 14); ctx.stroke();
        }
      } else {
        var fade = kind === 'thunder' ? 1 - k * 0.7 : 1;
        ctx.globalAlpha = fade;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3);
        ctx.fillStyle = C.c; ctx.globalAlpha = 0.55 * fade; ctx.fill(); ctx.globalAlpha = fade;
        // 外緣鋸齒(危險)
        ctx.beginPath();
        var n = Math.max(16, Math.round(r / 6));
        for (var i = 0; i <= n * 2; i++) {
          var aa = i / (n * 2) * 6.283 + (kind === 'firering' ? now() / 400 : 0);
          var rad = i % 2 ? r - 10 : r - 1;
          ctx.lineTo(x + Math.cos(aa) * rad, y + Math.sin(aa) * rad);
        }
        ctx.closePath();
        ctx.lineWidth = 5; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 3; ctx.strokeStyle = C.h; ctx.stroke();
        if (kind === 'thunder') {
          ctx.beginPath(); ctx.moveTo(x - 4, y - r); ctx.lineTo(x + 10, y - r * 0.35); ctx.lineTo(x - 6, y - r * 0.2); ctx.lineTo(x + 6, y + r * 0.4);
          ctx.lineWidth = 9; ctx.strokeStyle = P.outline; ctx.stroke();
          ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        } else {
          ctx.fillStyle = C.h;
          for (var f = 0; f < 6; f++) {
            var fa = f * 1.047 + now() / 300;
            var fx = x + Math.cos(fa) * r * 0.6, fy = y + Math.sin(fa) * r * 0.6;
            ctx.beginPath(); ctx.moveTo(fx - 6, fy + 5); ctx.quadraticCurveTo(fx, fy - 14, fx + 6, fy + 5); ctx.closePath(); ctx.fill();
          }
        }
      }
      ctx.restore();
    },

    drawWhipCrack: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), r = num(s.radius, 110);
      var dur = num(s.dur, 0.25) || 0.25, k = clamp(num(s.t, 0) / dur, 0, 1);
      if (k >= 1) return;
      ctx.save();
      ctx.globalAlpha = 1 - k;
      if (s.shape === 'circle') {
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3);
        ctx.fillStyle = 'rgba(255,240,176,0.18)'; ctx.fill();
        ctx.lineWidth = 6; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 3.5; ctx.strokeStyle = P.whip; ctx.stroke();
        // 鞭梢劃一圈
        var sa = k * 6.283 - Math.PI / 2;
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + Math.cos(sa - 0.5) * r * 0.6, y + Math.sin(sa - 0.5) * r * 0.6, x + Math.cos(sa) * r, y + Math.sin(sa) * r);
        ctx.lineWidth = 3; ctx.strokeStyle = '#6a4020'; ctx.stroke();
      } else {
        var a = facingAngle(s.facing), h = Math.PI / 3;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, a - h, a + h); ctx.closePath();
        ctx.fillStyle = 'rgba(255,240,176,0.28)'; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, r, a - h, a + h);
        ctx.lineWidth = 6; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 3.5; ctx.strokeStyle = P.whip; ctx.stroke();
        var wa = a - h + 2 * h * k;
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + Math.cos(wa - 0.4) * r * 0.55, y + Math.sin(wa - 0.4) * r * 0.55, x + Math.cos(wa) * r, y + Math.sin(wa) * r);
        ctx.lineWidth = 3; ctx.strokeStyle = '#6a4020'; ctx.stroke();
        // 鞭梢爆點
        var tx = x + Math.cos(wa) * r, ty = y + Math.sin(wa) * r;
        ctx.beginPath(); ctx.arc(tx, ty, 6, 0, 6.3); ctx.fillStyle = '#ffffff'; ctx.fill();
      }
      ctx.restore();
    },

    drawWhistleWave: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), r = num(s.radius, 140);
      var dur = num(s.dur, 0.25) || 0.25, k = clamp(num(s.t, 0) / dur, 0, 1);
      if (k >= 1) return;
      ctx.save();
      ctx.globalAlpha = 1 - k * 0.8;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3);
      ctx.fillStyle = 'rgba(127,245,200,0.14)'; ctx.fill();
      // 波浪外緣(與鞭的直線外緣區分)
      ctx.beginPath();
      for (var i = 0; i <= 72; i++) {
        var a = i / 72 * 6.283;
        var rad = r - 4 + Math.sin(a * 12 + k * 6) * 4;
        ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.lineWidth = 6; ctx.strokeStyle = P.outline; ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = P.whistle; ctx.stroke();
      // 內部擴散的音波
      for (var j = 0; j < 2; j++) {
        var rr2 = r * clamp(k + j * 0.4, 0, 1) * 0.9;
        if (rr2 < 8) continue;
        ctx.beginPath(); ctx.arc(x, y, rr2, 0, 6.3);
        ctx.lineWidth = 2; ctx.strokeStyle = P.whistle; ctx.stroke();
      }
      ctx.restore();
    },

    drawParryFlash: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0);
      var dur = num(s.dur, 0.25) || 0.25, k = clamp(num(s.t, 0) / dur, 0, 1);
      if (k >= 1) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = 1 - k * 0.7;
      var R = 30 + 26 * k;
      ctx.beginPath();
      for (var i = 0; i < 16; i++) {
        var a = i * Math.PI / 8;
        var rad = i % 2 ? R * 0.4 : R;
        ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.fillStyle = P.parry; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = P.gold; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 22 + 30 * k, 0, 6.3);
      ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      ctx.restore();
    },

    // ---------- 表演場 ----------
    drawShowArena: function (ctx) {
      ctx.save();
      // 觀眾席
      [[130, 250], [1020, 1140]].forEach(function (b) {
        ctx.fillStyle = P.stands; ctx.fillRect(0, b[0], 720, b[1] - b[0]);
        ctx.fillStyle = P.seat;
        ctx.fillRect(40, b[0] + 70, 640, 14);
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(0, b[0], 720, 8);
      });
      // 場地
      ctx.fillStyle = P.arena; ctx.fillRect(60, 270, 600, 730);
      ctx.strokeStyle = P.arenaLine; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(360, 635, 120, 0, 6.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(60, 635); ctx.lineTo(660, 635); ctx.stroke();
      ctx.lineWidth = 4; ctx.strokeStyle = '#8a7458'; ctx.strokeRect(60, 270, 600, 730);
      ctx.restore();
    },

    drawShowMonster: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), sp = s.species, dir = s.dir < 0 ? -1 : 1;
      var mode = s.mode || 'roam';
      var rage = clamp(num(s.rage, 0), 0, 100), redLow = num(s.redLow, 80);
      var out = mode === 'charge' || mode === 'loose';
      var inRed = !out && rage >= redLow && rage < 100;
      var t = now();
      var C = SP[sp] || SP.fire;
      ctx.save();
      ctx.translate(x, y);
      var ox = 0;
      var chargeK = clamp(num(s.chargeT, 0) / (num(s.chargeDur, 1.5) || 1.5), 0, 1);
      if (mode === 'charge' && chargeK > 0) ox = Math.sin(t / 30) * 2;
      shadow(ctx, ox, 40, 26, 6);
      // 紅線區: 身上紅色外光(貼著物件)
      if (inRed) {
        ctx.beginPath(); ctx.arc(0, 10, 38, 0, 6.3);
        ctx.fillStyle = 'rgba(255,42,85,0.22)'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = P.redline; ctx.stroke();
        // 白細內線: 紅線色與火蜥蜴色相只差 23°、灰階相同, 靠明度再拉一條通道
        ctx.beginPath(); ctx.arc(0, 10, 34.5, 0, 6.3);
        ctx.lineWidth = 1.5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      }
      // 失控: 紅色鋸齒外圈
      if (out) {
        ctx.beginPath();
        for (var i = 0; i <= 28; i++) {
          var a = i / 28 * 6.283 + t / 500;
          var rad = i % 2 ? 32 : 39;
          ctx.lineTo(Math.cos(a) * rad, 10 + Math.sin(a) * rad);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,58,58,0.25)'; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = P.danger; ctx.stroke();
        if (mode === 'charge' && chargeK > 0) {
          // 撞欄進度: 白弧沿外圈填滿 = 圍欄破
          ctx.beginPath(); ctx.arc(0, 10, 36, -Math.PI / 2, -Math.PI / 2 + 6.283 * chargeK);
          ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        } else if (mode === 'charge') {
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
          for (var q = 0; q < 3; q++) {
            ctx.beginPath(); ctx.moveTo(-dir * 30, -2 + q * 12); ctx.lineTo(-dir * 40, -2 + q * 12); ctx.stroke();
          }
        }
      }
      // 表演中: 白色爆發環
      if (s.performing && !out) {
        ctx.beginPath();
        for (var p = 0; p < 16; p++) {
          var pa = p * Math.PI / 8;
          var pr = p % 2 ? 30 : 39;
          ctx.lineTo(Math.cos(pa) * pr, 10 + Math.sin(pa) * pr);
        }
        ctx.closePath();
        ctx.fillStyle = C.h; ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;
      }
      ctx.save(); ctx.translate(ox, 10);
      speciesBody(ctx, sp, 28, dir, { eyes: out || rage >= 95 ? 'angry' : 'normal' });
      ctx.restore();
      // 被技能影響
      var fxK = clamp(num(s.fxT, 0) / (num(s.fxDur, 0.5) || 0.5), 0, 1);
      if (s.fx && s.fx !== 'none' && fxK < 1) {
        ctx.globalAlpha = 1 - fxK;
        var rise = fxK * 10;
        if (s.fx === 'ignited') {
          for (var u = -1; u <= 1; u += 2) chevron(ctx, u * 32, 14 - rise, -1, '#ff8a30');
        } else if (s.fx === 'doused') {
          for (var v = -1; v <= 1; v += 2) chevron(ctx, v * 32, 2 + rise, 1, P.water);
        } else if (s.fx === 'calmed') {
          ctx.lineWidth = 3; ctx.strokeStyle = P.whistle;
          for (var w = 0; w < 2; w++) {
            ctx.beginPath(); ctx.arc(0, 10, 30 + w * 6, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
          }
          for (var w2 = -1; w2 <= 1; w2 += 2) chevron(ctx, w2 * 32, 2 + rise, 1, P.whistle);
        }
        ctx.globalAlpha = 1;
      }
      // 頂部: 怒氣條 或 制伏進度
      if (out) {
        var sub = clamp(Math.round(num(s.subdue, 0)), 0, 3);
        rr(ctx, -44, -50, 88, 20, 6); ctx.fillStyle = 'rgba(20,16,30,0.9)'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = P.danger; ctx.stroke();
        for (var m = 0; m < 3; m++) {
          ctx.beginPath(); ctx.arc(-30 + m * 16, -40, 5.5, 0, 6.3);
          ctx.fillStyle = m < sub ? P.whistle : '#3a3446'; ctx.fill();
          ctx.lineWidth = 1.5; ctx.strokeStyle = P.outline; ctx.stroke();
        }
        txt(ctx, sub + '/3', 24, -40, 16, P.text, 'center', 'middle', 3);
      } else {
        rageBar(ctx, -44, -48, 88, 12, rage, redLow);
      }
      ctx.restore();
    },

    drawFence: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0);
      ctx.save();
      ctx.translate(x, y);
      var L = -50, R = 50;
      function post(px) { ctx.fillStyle = P.fenceDark; ctx.fillRect(px - 4, -8, 8, 16); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.strokeRect(px - 4, -8, 8, 16); }
      if (!s.broken) {
        ctx.fillStyle = P.fence;
        ctx.fillRect(L + 2, -6, 96, 4); ctx.fillRect(L + 2, 2, 96, 4);
        ctx.lineWidth = 1.5; ctx.strokeStyle = P.outline;
        ctx.strokeRect(L + 2, -6, 96, 4); ctx.strokeRect(L + 2, 2, 96, 4);
        post(L + 5); post(0); post(R - 5);
      } else {
        // 破口: 斷木 + 紅色破口底
        ctx.fillStyle = 'rgba(255,58,58,0.35)'; ctx.fillRect(-28, -7, 56, 14);
        ctx.fillStyle = P.fence; ctx.lineWidth = 1.5; ctx.strokeStyle = P.outline;
        ctx.beginPath(); ctx.moveTo(L + 2, -6); ctx.lineTo(-24, -6); ctx.lineTo(-18, -4); ctx.lineTo(-26, -2); ctx.lineTo(L + 2, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(R - 2, 2); ctx.lineTo(22, 2); ctx.lineTo(16, 4); ctx.lineTo(24, 6); ctx.lineTo(R - 2, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(L + 2, 2); ctx.lineTo(-30, 2); ctx.lineTo(-34, 6); ctx.lineTo(L + 2, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
        post(L + 5); post(R - 5);
      }
      ctx.restore();
    },

    drawVisitor: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), seat = Math.round(num(s.seat, 0));
      var shirts = ['#8aa0c8', '#c89a7a', '#9ab88a', '#b88ab0', '#c8b87a', '#7ab0b0'];
      ctx.save();
      ctx.translate(x, y);
      // 座位
      rr(ctx, -20, 22, 40, 14, 4); ctx.fillStyle = P.seat; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
      ctx.fillStyle = P.seat; ctx.fillRect(-16, 36, 5, 8); ctx.fillRect(11, 36, 5, 8);
      if (s.mode === 'empty') { ctx.restore(); return; }
      var col = shirts[((seat % 6) + 6) % 6];
      if (s.mode === 'scared') {
        ctx.globalAlpha = 0.85;
        ctx.save(); ctx.rotate(0.25);
        rr(ctx, -12, -8, 24, 30, 8); ctx.fillStyle = '#d0ccd8'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineCap = 'round'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(-20, -24); ctx.moveTo(10, -4); ctx.lineTo(18, -26); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -20, 11, 0, 6.3); ctx.fillStyle = '#f0dcc8'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, -17, 3, 4, 0, 0, 6.3); ctx.fillStyle = P.outline; ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
        // 打叉: 這位被攻擊、離席
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-14, -40); ctx.lineTo(14, -12); ctx.moveTo(14, -40); ctx.lineTo(-14, -12);
        ctx.lineWidth = 7; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = P.danger; ctx.stroke();
      } else {
        rr(ctx, -12, -4, 24, 28, 8); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -16, 11, 0, 6.3); ctx.fillStyle = '#f0dcc8'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(-4, -17, 1.8, 0, 6.3); ctx.arc(4, -17, 1.8, 0, 6.3); ctx.fillStyle = P.outline; ctx.fill();
      }
      ctx.restore();
    },

    drawComboMeter: function (ctx, s) {
      var x = num(s.x, 360), y = num(s.y, 1210);
      var combo = Math.max(0, Math.round(num(s.combo, 0)));
      var mult = num(s.mult, 2);
      var left = clamp(num(s.left, 0) / (num(s.window, 4) || 4), 0, 1);
      var bk = s.broken ? clamp(num(s.brokenT, 0) / (num(s.brokenDur, 1.2) || 1.2), 0, 1) : 1;
      var breaking = s.broken && bk < 1;
      var active = combo > 0;
      var t = now();
      ctx.save();
      var sh = breaking ? Math.sin(t / 25) * 4 * (1 - bk) : 0;
      ctx.translate(x + sh, y);
      // 面板 600×120
      rr(ctx, -294, -58, 588, 116, 14);
      ctx.fillStyle = breaking ? '#3a1420' : P.panel; ctx.fill();
      ctx.lineWidth = active ? 4 : 2;
      ctx.strokeStyle = breaking ? P.danger : (active ? P.redline : '#4a4258'); ctx.stroke();
      // 左: 連擊數
      txt(ctx, '連擊', -270, -22, 20, active ? P.text : P.textDim, 'left');
      var big = 36 + Math.min(combo, 15) * 1.2;
      txt(ctx, String(combo), -170, -8, Math.round(big), breaking ? '#ff8a8a' : (active ? P.redline : P.textDim), 'center', 'middle', 6);
      if (breaking) {
        // 數字被一道裂痕劃過
        ctx.beginPath(); ctx.moveTo(-215, -40); ctx.lineTo(-180, -12); ctx.lineTo(-165, -20); ctx.lineTo(-125, 18);
        ctx.lineWidth = 7; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = P.danger; ctx.stroke();
      }
      // 右: 倍率(連擊越高越大越亮)
      var lvl = clamp((mult - 2) / 3, 0, 1);
      var mcol = active ? (mult >= 5 ? '#ffffff' : (lvl > 0.33 ? '#ffb02e' : P.gold)) : P.textDim;
      txt(ctx, '紅線倍率', 150, -28, 18, active ? P.text : P.textDim, 'center');
      txt(ctx, '×' + (Math.round(mult * 10) / 10), 150, 8, Math.round(32 + lvl * 14), mcol, 'center', 'middle', 6);
      if (active && mult >= 5) txt(ctx, '最高', 250, 8, 18, P.gold, 'center');
      // 下: 連擊計時條
      var bx = -270, bw = 540, by = 38;
      rr(ctx, bx - 2, by - 2, bw + 4, 14, 6); ctx.fillStyle = P.outline; ctx.fill();
      ctx.fillStyle = '#2a2434'; ctx.fillRect(bx, by, bw, 10);
      if (active) {
        ctx.fillStyle = left < 0.25 && Math.floor(t / 120) % 2 ? '#ffffff' : P.redline;
        ctx.fillRect(bx, by, bw * left, 10);
      }
      ctx.restore();
    },

    // ---------- 流程畫面 ----------
    drawTitleCard: function (ctx, s) {
      var day = Math.round(num(s.day, 1)), dun = s.stage !== 'show';
      ctx.save();
      ctx.fillStyle = 'rgba(12,10,18,0.94)'; ctx.fillRect(0, 0, 720, 1280);
      txt(ctx, '第 ' + day + ' 天', 360, 420, 72, P.text);
      // 圖示
      ctx.save(); ctx.translate(360, 600);
      if (dun) {
        ctx.fillStyle = P.wallTop; ctx.fillRect(-110, -90, 220, 170);
        ctx.beginPath(); ctx.moveTo(-50, 80); ctx.lineTo(-50, -10); ctx.arc(0, -10, 50, Math.PI, 0); ctx.lineTo(50, 80); ctx.closePath();
        ctx.fillStyle = '#05040a'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = P.outline; ctx.strokeRect(-110, -90, 220, 170);
        ctx.beginPath(); ctx.moveTo(-80, -40); ctx.lineTo(-80, -10); ctx.moveTo(80, -40); ctx.lineTo(80, -10); ctx.lineWidth = 6; ctx.strokeStyle = '#6a4020'; ctx.stroke();
        ctx.fillStyle = P.fireHi; ctx.beginPath(); ctx.arc(-80, -48, 9, 0, 6.3); ctx.arc(80, -48, 9, 0, 6.3); ctx.fill();
      } else {
        ctx.beginPath(); ctx.moveTo(-130, 70); ctx.lineTo(-130, -20); ctx.lineTo(0, -100); ctx.lineTo(130, -20); ctx.lineTo(130, 70); ctx.closePath();
        ctx.fillStyle = '#8a2a3a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = P.outline; ctx.stroke();
        for (var i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(0, -100); ctx.lineTo(i * 52, 70); ctx.strokeStyle = '#f0e0c0'; ctx.lineWidth = 3; ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(-40, 70); ctx.lineTo(0, 0); ctx.lineTo(40, 70); ctx.closePath(); ctx.fillStyle = '#05040a'; ctx.fill();
      }
      ctx.restore();
      txt(ctx, dun ? '地下城' : '表演場', 360, 760, 56, dun ? P.lassoRing : P.redline);
      txt(ctx, dun ? '打到殘血, 套住, 繞一圈' : '把魔物養在紅線上', 360, 830, 26, P.textDim);
      // 按 Z 開始(美術畫, RD 不要再畫)
      keycap(ctx, 250, 960, 56, 56, 'Z', 0);
      txt(ctx, '開始', 390, 990, 36, P.text, 'center');
      ctx.restore();
    },

    drawShopItem: function (ctx, s) {
      var x = num(s.x, 360), y = num(s.y, 300);
      var info = {
        whipPower: ['鞭力', '每鞭傷害 +1'],
        ropeBag: ['繩袋', '每天捕獸繩 +1'],
        armor: ['護甲', '心 +1'],
        silverWhistle: ['銀哨', '吹哨冷卻 −0.4 秒']
      }[s.item] || ['?', ''];
      var ok = !!s.affordable, sel = !!s.selected;
      ctx.save();
      ctx.translate(x, y);
      rr(ctx, -296, -66, 592, 132, 14);
      ctx.fillStyle = sel ? P.panelHi : P.panel; ctx.fill();
      ctx.lineWidth = sel ? 6 : 2; ctx.strokeStyle = sel ? P.gold : '#4a4258'; ctx.stroke();
      if (sel) { // 選擇框左側箭頭
        ctx.beginPath(); ctx.moveTo(-286, -14); ctx.lineTo(-270, 0); ctx.lineTo(-286, 14); ctx.closePath(); ctx.fillStyle = P.gold; ctx.fill();
      }
      ctx.globalAlpha = ok ? 1 : 0.5;
      // 圖示
      ctx.save(); ctx.translate(-205, 0);
      ctx.beginPath(); ctx.arc(0, 0, 44, 0, 6.3); ctx.fillStyle = '#14101c'; ctx.fill();
      shopIcon(ctx, s.item);
      ctx.restore();
      txt(ctx, info[0], -135, -24, 34, P.text, 'left');
      txt(ctx, info[1], -135, 22, 22, P.textDim, 'left');
      var lv = Math.round(num(s.level, 0));
      if (lv > 0) txt(ctx, '已買 ' + lv, 60, -24, 18, P.textDim, 'left');
      ctx.globalAlpha = 1;
      // 價格
      coin(ctx, 150, 0, 14);
      txt(ctx, String(Math.round(num(s.cost, 0))), 172, 0, 34, ok ? P.gold : '#ff7a7a', 'left');
      if (!ok && sel) txt(ctx, '金幣不足', 220, 40, 18, '#ff7a7a', 'center');
      ctx.restore();
    },

    drawButton: function (ctx, s) {
      var x = num(s.x, 0), y = num(s.y, 0), w = num(s.w, 200), h = num(s.h, 80);
      var sel = !!s.selected;
      ctx.save();
      rr(ctx, x, y + 4, w, h, 16); ctx.fillStyle = '#06040a'; ctx.fill();
      rr(ctx, x, y, w, h, 16);
      ctx.fillStyle = sel ? P.gold : P.panelHi; ctx.fill();
      ctx.lineWidth = sel ? 6 : 2; ctx.strokeStyle = sel ? '#ffffff' : '#4a4258'; ctx.stroke();
      ctx.font = font(Math.round(Math.min(h * 0.45, 40)));
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = sel ? P.outline : P.textDim;
      ctx.fillText(String(s.label == null ? '' : s.label), x + w / 2, y + h / 2 + 2);
      ctx.restore();
    },

    drawFloatText: function (ctx, s) {
      var dur = num(s.dur, s.kind === 'comboBreak' ? 1.2 : 1) || 1;
      var k = clamp(num(s.t, 0) / dur, 0, 1);
      if (k >= 1) return;
      var sty = {
        gold: [22, P.gold], redGold: [28, '#ffb02e'], repUp: [22, P.rep], repDown: [22, '#ff6a6a'],
        capture: [38, P.lassoRing], mastery: [30, P.redline], combo: [28, P.redline],
        comboBreak: [60, P.danger], parry: [26, P.parry]
      }[s.kind] || [22, P.text];
      var x = num(s.x, 0), y = num(s.y, 0) - k * (s.kind === 'comboBreak' ? 10 : 40);
      ctx.save();
      ctx.globalAlpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
      var sz = sty[0];
      if (k < 0.15) sz = sz * (1.25 - k / 0.15 * 0.25);
      if (s.kind === 'comboBreak') x += Math.sin(k * 60) * 6 * (1 - k);
      if (s.kind === 'redGold') {
        // 紅線金幣: 紅底小框強調倍率
        ctx.font = font(Math.round(sz));
        var w = ctx.measureText(String(s.text)).width;
        rr(ctx, x - w / 2 - 8, y - sz * 0.65, w + 16, sz * 1.3, 8);
        ctx.fillStyle = 'rgba(255,42,85,0.85)'; ctx.fill();
      }
      if (s.kind === 'comboBreak') {
        ctx.font = font(Math.round(sz));
        var w2 = ctx.measureText(String(s.text)).width;
        rr(ctx, x - w2 / 2 - 24, y - sz * 0.75, w2 + 48, sz * 1.5, 14);
        ctx.fillStyle = 'rgba(40,6,12,0.85)'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = P.danger; ctx.stroke();
      }
      txt(ctx, String(s.text == null ? '' : s.text), x, y, Math.round(sz), s.kind === 'redGold' ? '#fff4c0' : sty[1]);
      ctx.restore();
    },

    drawResultPanel: function (ctx, s) {
      ctx.save();
      ctx.fillStyle = 'rgba(12,10,18,0.96)'; ctx.fillRect(0, 0, 720, 1280);
      txt(ctx, '結算', 360, 150, 56, P.text);
      var stars = clamp(Math.round(num(s.stars, 0)), 0, 3);
      for (var i = 0; i < 3; i++) star(ctx, 220 + i * 140, 300, 56, i < stars ? P.star : '#3a3446', P.outline);
      var rows = [
        ['名聲', String(Math.round(num(s.rep, 0))), P.rep, 'rep'],
        ['累計金幣', String(Math.round(num(s.goldEarned, 0))), P.gold, 'gold'],
        ['最高連擊', String(Math.round(num(s.bestCombo, 0))), P.redline, 'combo']
      ];
      rows.forEach(function (r, j) {
        var ry = 460 + j * 110;
        rr(ctx, 90, ry - 44, 540, 88, 14); ctx.fillStyle = P.panel; ctx.fill();
        if (r[3] === 'rep') star(ctx, 140, ry, 20, P.rep, P.outline);
        else if (r[3] === 'gold') coin(ctx, 140, ry, 18);
        else txt(ctx, '連', 140, ry, 28, P.redline);
        txt(ctx, r[0], 180, ry, 30, P.text, 'left');
        txt(ctx, r[1], 600, ry, 44, r[2], 'right');
      });
      txt(ctx, '陣容', 360, 810, 28, P.textDim);
      var roster = Array.isArray(s.roster) ? s.roster : [];
      var n = roster.length, gap = 150;
      roster.forEach(function (m, k) {
        var cx = 360 + (k - (n - 1) / 2) * gap;
        rr(ctx, cx - 62, 845, 124, 150, 14); ctx.fillStyle = P.panel; ctx.fill();
        speciesIcon(ctx, m && m.species, cx, 905, 30, m ? num(m.mastery, 0) : 0);
        txt(ctx, (SP[m && m.species] || SP.fire).name, cx, 975, 20, P.text);
      });
      // 按 Z 重來(美術畫, RD 不要再畫)
      keycap(ctx, 250, 1110, 56, 56, 'Z', 0);
      txt(ctx, '重來', 390, 1140, 36, P.text);
      ctx.restore();
    },

    drawHud: function (ctx, s) {
      var ph = s.phase;
      if (ph !== 'dungeon' && ph !== 'show' && ph !== 'shop') return;
      ctx.save();
      ctx.fillStyle = '#0c0a12'; ctx.fillRect(0, 0, 720, 120);
      ctx.fillStyle = '#2a2434'; ctx.fillRect(0, 118, 720, 2);
      // 第一列: 天數階段 / 時間 / 金幣 / 名聲
      var stageName = ph === 'dungeon' ? '地下城' : (ph === 'show' ? '表演場' : '商店');
      txt(ctx, '第' + Math.round(num(s.day, 1)) + '天', 16, 32, 24, P.textDim, 'left');
      txt(ctx, stageName, 92, 32, 28, ph === 'show' ? P.redline : (ph === 'dungeon' ? P.lassoRing : P.gold), 'left');
      if (ph !== 'shop') {
        var tl = Math.max(0, num(s.timeLeft, 0));
        var urgent = tl <= 10;
        // 時鐘圖示
        ctx.beginPath(); ctx.arc(262, 32, 14, 0, 6.3); ctx.fillStyle = urgent ? P.danger : '#e8e2d4'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(262, 32); ctx.lineTo(262, 22); ctx.moveTo(262, 32); ctx.lineTo(269, 35); ctx.stroke();
        txt(ctx, String(Math.ceil(tl)), 286, 32, 32, urgent ? P.danger : P.text, 'left');
      }
      coin(ctx, 450, 32, 14);
      txt(ctx, String(Math.round(num(s.gold, 0))), 472, 32, 30, P.gold, 'left');
      star(ctx, 590, 32, 16, P.rep, P.outline);
      txt(ctx, String(Math.round(num(s.rep, 0))), 612, 32, 30, P.rep, 'left');
      // 第二列
      if (ph === 'dungeon') {
        var mh = Math.max(0, Math.round(num(s.maxHearts, 5))), hh = clamp(Math.round(num(s.hearts, 0)), 0, mh);
        var hs = Math.min(26, 240 / Math.max(1, mh));
        for (var i = 0; i < mh; i++) {
          heartPath(ctx, 28 + i * hs, 90, Math.min(24, hs * 0.95));
          ctx.fillStyle = i < hh ? P.heart : '#2a2434'; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
        }
        var rm = Math.max(0, Math.round(num(s.ropeMax, 3))), rp = clamp(Math.round(num(s.ropes, 0)), 0, rm);
        var rs = Math.min(22, 130 / Math.max(1, rm));
        for (var r = 0; r < rm; r++) ropeIcon(ctx, 280 + r * rs, 90, r < rp);
        var roster = Array.isArray(s.roster) ? s.roster : [];
        for (var k = 0; k < roster.length && k < 4; k++) {
          speciesIcon(ctx, roster[k] && roster[k].species, 432 + k * 34, 82, 11, roster[k] ? num(roster[k].mastery, 0) : 0);
        }
        cdKey(ctx, 572, 76, 'X', '翻滾', num(s.rollCd, 0), num(s.rollCdMax, 0.8));
        cdKey(ctx, 644, 76, 'C', '彈反', num(s.parryCd, 0), num(s.parryCdMax, 0.6));
        if (s.message) {
          // 地下城訊息放畫面底部, 不壓在玩家附近
          msgPill(ctx, 360, 1236, String(s.message));
        }
      } else if (ph === 'show') {
        if (s.message) msgPill(ctx, 284, 90, String(s.message), 520);
        cdKey(ctx, 572, 76, 'X', '吹哨', num(s.whistleCd, 0), num(s.whistleCdMax, 2));
        cdKey(ctx, 644, 76, 'C', '彈反', num(s.parryCd, 0), num(s.parryCdMax, 0.6));
      } else {
        // 商店底部提示(美術畫, RD 不要再畫)
        keycap(ctx, 214, 1250, 26, 26, '↑', 0); keycap(ctx, 244, 1250, 26, 26, '↓', 0);
        txt(ctx, '選擇', 278, 1263, 20, P.textDim, 'left');
        keycap(ctx, 380, 1250, 26, 26, 'Z', 0);
        txt(ctx, '確定', 414, 1263, 20, P.textDim, 'left');
      }
      ctx.restore();
    },

    drawGuidePage: function (ctx, s) {
      var bx = num(s.x, 0), by = num(s.y, 0), bw = num(s.w, 600), bh = num(s.h, 700);
      var RW = 600, RH = 700;
      var sc = Math.min(bw / RW, bh / RH);
      ctx.save();
      ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
      ctx.translate(bx + (bw - RW * sc) / 2, by + (bh - RH * sc) / 2);
      ctx.scale(sc, sc);
      var pg = Math.round(num(s.page, 0));
      if (pg === 0) guidePage0(ctx);
      else if (pg === 1) guidePage1(ctx);
      else if (pg === 2) guidePage2(ctx);
      else guidePage3(ctx);
      ctx.restore();
    }
  };

  // ---------- 小工具(需 Art 的) ----------
  function chevron(ctx, x, y, dirY, col) {
    // dirY -1 = 往上(怒氣升) / 1 = 往下(怒氣降)
    ctx.beginPath();
    ctx.moveTo(x - 7, y - dirY * 4); ctx.lineTo(x, y + dirY * 4); ctx.lineTo(x + 7, y - dirY * 4);
    ctx.moveTo(x - 7, y - dirY * 4 + dirY * -9); ctx.lineTo(x, y + dirY * 4 - dirY * 9); ctx.lineTo(x + 7, y - dirY * 4 - dirY * 9);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = 6; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.lineWidth = 3.5; ctx.strokeStyle = col; ctx.stroke();
  }

  function rageBar(ctx, x, y, w, h, rage, redLow) {
    ctx.save();
    rr(ctx, x - 2, y - 2, w + 4, h + 4, 5); ctx.fillStyle = P.outline; ctx.fill();
    ctx.fillStyle = '#2a2434'; ctx.fillRect(x, y, w, h);
    // 紅線區底色(redLow ~ 99)
    var rx = x + w * redLow / 100, rEnd = x + w * 0.99;
    ctx.fillStyle = 'rgba(255,42,85,0.35)'; ctx.fillRect(rx, y, rEnd - rx, h);
    // 填色
    var col = rage >= 100 ? P.danger : (rage >= redLow ? P.redline : (rage >= 50 ? P.rageMid : P.rageLow));
    ctx.fillStyle = col; ctx.fillRect(x, y, w * rage / 100, h);
    // 紅線區上下框線
    ctx.fillStyle = P.redline; ctx.fillRect(rx, y - 2, rEnd - rx, 2); ctx.fillRect(rx, y + h, rEnd - rx, 2);
    // 表演門檻 50 / 紅線下限刻度 / 失控格
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x + w * 0.5 - 1, y, 2, h);
    ctx.fillStyle = P.redline; ctx.fillRect(rx - 1.5, y - 2, 3, h + 4);
    ctx.fillStyle = '#000000'; ctx.fillRect(rEnd, y, x + w - rEnd, h);
    ctx.restore();
  }

  function ropeIcon(ctx, x, y, have) {
    ctx.beginPath(); ctx.ellipse(x, y, 8, 10, 0, 0, 6.3);
    ctx.lineWidth = 5; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = have ? P.lasso : '#3a3446'; ctx.stroke();
  }

  function cdKey(ctx, x, y, key, cap, cd, cdMax) {
    var r = cdMax > 0 ? clamp(cd / cdMax, 0, 1) : 0;
    keycap(ctx, x, y, 28, 28, key, r);
    txt(ctx, cap, x + 31, y + 14, 16, r > 0 ? P.textDim : P.text, 'left', 'middle', 3);
  }

  function msgPill(ctx, cx, cy, m, maxW) {
    ctx.save();
    ctx.font = font(22);
    var w = Math.min(maxW || 560, ctx.measureText(m).width + 32);
    rr(ctx, cx - w / 2, cy - 18, w, 36, 18);
    ctx.fillStyle = 'rgba(60,10,20,0.92)'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = P.danger; ctx.stroke();
    txt(ctx, m, cx, cy, 22, '#ffe0e0', 'center', 'middle', 3);
    ctx.restore();
  }

  function shopIcon(ctx, item) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (item === 'whipPower') {
      ctx.beginPath(); ctx.moveTo(-20, 22); ctx.lineTo(-6, 6);
      ctx.lineWidth = 9; ctx.strokeStyle = P.outline; ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = '#6a4020'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-6, 6); ctx.quadraticCurveTo(26, -4, 6, -18); ctx.quadraticCurveTo(-8, -28, 22, -26);
      ctx.lineWidth = 3; ctx.strokeStyle = P.whip; ctx.stroke();
      star(ctx, 24, -26, 8, '#ffffff', P.outline);
    } else if (item === 'ropeBag') {
      rr(ctx, -20, -6, 40, 30, 8); ctx.fillStyle = '#8a6a40'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
      ropeIcon(ctx, -6, -14, true); ropeIcon(ctx, 8, -12, true);
    } else if (item === 'armor') {
      ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(24, -16); ctx.lineTo(20, 10); ctx.lineTo(0, 26); ctx.lineTo(-20, 10); ctx.lineTo(-24, -16); ctx.closePath();
      ctx.fillStyle = '#8a92a8'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
      heartPath(ctx, 0, 2, 22); ctx.fillStyle = P.heart; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
    } else {
      ctx.beginPath(); ctx.ellipse(4, 4, 18, 13, 0, 0, 6.3); ctx.fillStyle = '#d8dce8'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
      rr(ctx, -26, -6, 18, 10, 3); ctx.fillStyle = '#d8dce8'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(8, 4, 5, 0, 6.3); ctx.fillStyle = P.outline; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = P.whistle;
      ctx.beginPath(); ctx.arc(4, 4, 28, -1.2, -0.4); ctx.stroke();
    }
  }

  function label(ctx, s, x, y, col) { txt(ctx, s, x, y, 20, col || P.text, 'center', 'middle', 4); }
  function arrow(ctx, x1, y1, x2, y2, col, dash) {
    ctx.save();
    ctx.setLineDash(dash ? [10, 7] : []);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.lineWidth = 6; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke();
    ctx.setLineDash([]);
    var a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.45) * 14, y2 - Math.sin(a - 0.45) * 14);
    ctx.lineTo(x2 - Math.cos(a + 0.45) * 14, y2 - Math.sin(a + 0.45) * 14);
    ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.restore();
  }
  function check(ctx, x, y, r) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fillStyle = '#2a8a50'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - r * 0.45, y); ctx.lineTo(x - r * 0.1, y + r * 0.4); ctx.lineTo(x + r * 0.5, y - r * 0.4);
    ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.lineCap = 'round'; ctx.stroke();
  }
  function cross(ctx, x, y, r) {
    ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r);
    ctx.lineCap = 'round'; ctx.lineWidth = 9; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = P.danger; ctx.stroke();
  }
  function tiles(ctx, cols, rows, zone, map) {
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var ch = map ? map[r][c] : '.';
      var kind = ch === '#' ? 'wall' : ch === 'L' ? 'lava' : ch === 'W' ? 'water' : ch === 'o' ? 'pillar' : 'floor';
      Art.drawTile(ctx, { x: c * 60 + 30, y: r * 60 + 30, kind: kind, zone: zone, nest: false });
    }
  }

  // ---------- 說明頁示意圖(參考座標 600×700) ----------
  function guidePage0(ctx) {
    var map = [
      '##########', '#........#', '#........#', '#........#', '#L.......#', '#L.......#',
      '#........#', '#........#', '#........#', '#........#', '#........#', '##########'
    ];
    tiles(ctx, 10, 12, 'lava', map);
    // A: 朝右揮鞭打中火蜥蜴; 方向鍵貼在馴獸師左側
    Art.drawWhipCrack(ctx, { x: 170, y: 130, shape: 'arc', facing: 2, radius: 110, t: 0.08, dur: 0.25 });
    Art.drawTamer(ctx, { x: 170, y: 130, facing: 2, rolling: false, parryLeft: 0, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
    Art.drawWildMonster(ctx, { x: 290, y: 120, species: 'fire', hp: 6, maxHp: 10, hit: true, weak: false, lassoed: false, casting: false, dir: -1 });
    keycap(ctx, 202, 64, 30, 30, 'Z', 0);
    arrowKeys(ctx, 92, 132, 22);
    // B: 翻滾穿過火圈(殘影 → 翻滾中 → 殘影)
    Art.drawHazard(ctx, { x: 330, y: 360, kind: 'firering', phase: 'active', radius: 120, t: 0.2, dur: 0.5, angle: 0 });
    Art.drawWildMonster(ctx, { x: 330, y: 380, species: 'fire', hp: 10, maxHp: 10, hit: false, weak: false, lassoed: false, casting: false, dir: 1 });
    ctx.save(); ctx.globalAlpha = 0.35;
    Art.drawTamer(ctx, { x: 150, y: 300, facing: 2, rolling: true, parryLeft: 0, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
    ctx.restore();
    Art.drawTamer(ctx, { x: 330, y: 290, facing: 2, rolling: true, parryLeft: 0, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
    ctx.save(); ctx.globalAlpha = 0.35;
    Art.drawTamer(ctx, { x: 500, y: 290, facing: 2, rolling: false, parryLeft: 0, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
    ctx.restore();
    arrow(ctx, 185, 300, 460, 290, '#ffffff', true);
    keycap(ctx, 316, 236, 30, 30, 'X', 0);
    // C: 舉盾彈反水彈, 反擊回水母
    Art.drawTamer(ctx, { x: 150, y: 590, facing: 2, rolling: false, parryLeft: 0.15, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
    Art.drawParryFlash(ctx, { x: 180, y: 590, t: 0.05, dur: 0.25 });
    Art.drawHazard(ctx, { x: 270, y: 560, kind: 'waterball', phase: 'active', radius: 12, t: 0, dur: 0, angle: Math.PI + 0.17 });
    Art.drawHazard(ctx, { x: 270, y: 622, kind: 'waterball', phase: 'active', radius: 12, t: 0, dur: 0, angle: Math.PI - 0.17 });
    Art.drawWildMonster(ctx, { x: 470, y: 590, species: 'water', hp: 5, maxHp: 7, hit: true, weak: false, lassoed: false, casting: false, dir: -1 });
    ctx.save();
    ctx.beginPath(); ctx.moveTo(200, 560); ctx.quadraticCurveTo(320, 500, 430, 560);
    ctx.setLineDash([10, 7]); ctx.lineWidth = 6; ctx.strokeStyle = P.outline; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = P.parry; ctx.stroke();
    ctx.restore();
    arrow(ctx, 420, 552, 432, 562, P.parry, false);
    label(ctx, '反擊', 320, 512, P.parry);
    keycap(ctx, 136, 640, 30, 30, 'C', 0);
  }

  function guidePage1(ctx) {
    tiles(ctx, 10, 12, 'ruins', null);
    var mx = 260, my = 320, R = 150;
    // 繞圈路線(虛線 + 箭頭)
    ctx.save();
    ctx.setLineDash([12, 9]); ctx.beginPath(); ctx.arc(mx, my + 4, R, 0, 6.3);
    ctx.lineWidth = 6; ctx.strokeStyle = P.outline; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.restore();
    for (var i = 0; i < 4; i++) {
      var a = i * Math.PI / 2 + 0.6;
      var ax = mx + Math.cos(a) * R, ay = my + 4 + Math.sin(a) * R;
      arrow(ctx, ax - Math.cos(a + Math.PI / 2) * 10, ay - Math.sin(a + Math.PI / 2) * 10, ax + Math.cos(a + Math.PI / 2) * 6, ay + Math.sin(a + Math.PI / 2) * 6, '#ffffff', false);
    }
    // 起點(右)→ 目前位置(左, 繞了半圈)
    var tx = mx - R, ty = my + 4;
    Art.drawLasso(ctx, { x1: tx, y1: ty, x2: mx, y2: my, progress: 0.5, t: 2, limit: 5, len: R, maxLen: 220 });
    Art.drawWildMonster(ctx, { x: mx, y: my, species: 'stone', hp: 3, maxHp: 16, hit: false, weak: true, lassoed: true, casting: false, dir: 1 });
    Art.drawTamer(ctx, { x: tx, y: ty, facing: 4, rolling: false, parryLeft: 0, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: true });
    label(ctx, '你', tx, ty - 44);
    label(ctx, '起點', mx + R, my - 30, P.textDim);
    keycap(ctx, mx + R - 15, my + 20, 30, 30, 'Z', 0);
    arrowKeys(ctx, tx - 0, ty + 60, 22);
    // 殘血對照(還沒套): 左上角
    // 角落小圖: 進度環填滿 → 收服打勾
    ctx.save();
    rr(ctx, 380, 480, 210, 210, 16); ctx.fillStyle = 'rgba(12,10,18,0.88)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = P.lassoRing; ctx.stroke();
    ctx.beginPath(); ctx.rect(380, 480, 210, 210); ctx.clip();
    ctx.translate(485, 585); ctx.scale(0.8, 0.8);
    Art.drawLasso(ctx, { x1: 0, y1: -60, x2: 0, y2: 0, progress: 1, t: 4, limit: 5, len: 60, maxLen: 220 });
    ctx.globalAlpha = 0.45;
    Art.drawWildMonster(ctx, { x: 0, y: 0, species: 'stone', hp: 3, maxHp: 16, hit: false, weak: true, lassoed: true, casting: false, dir: 1 });
    ctx.globalAlpha = 1;
    check(ctx, 0, 4, 26);
    ctx.restore();
  }

  function guidePage2(ctx) {
    // 表演場地面
    ctx.save();
    ctx.fillStyle = P.arena; ctx.fillRect(0, 0, 600, 700);
    ctx.strokeStyle = P.arenaLine; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(300, 20); ctx.lineTo(300, 680); ctx.stroke();
    ctx.restore();
    // 左: 揮鞭激怒 → 表演 → 金幣
    Art.drawWhipCrack(ctx, { x: 150, y: 420, shape: 'circle', facing: 0, radius: 110, t: 0.06, dur: 0.25 });
    Art.drawTamer(ctx, { x: 150, y: 420, facing: 0, rolling: false, parryLeft: 0, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
    Art.drawHazard(ctx, { x: 150, y: 220, kind: 'firering', phase: 'active', radius: 80, t: 0.2, dur: 0.5, angle: 0 });
    Art.drawShowMonster(ctx, { x: 150, y: 340, species: 'fire', mastery: 0, rage: 70, redLow: 80, mode: 'roam', performing: true, fx: 'ignited', fxT: 0.1, fxDur: 0.5, subdue: 0, chargeT: 0, chargeDur: 1.5, dir: 1 });
    chevron(ctx, 210, 296, -1, P.rageMid);
    Art.drawFloatText(ctx, { x: 230, y: 200, text: '+5', kind: 'gold', t: 0.1, dur: 1 });
    coin(ctx, 200, 170, 10); coin(ctx, 250, 150, 9);
    keycap(ctx, 176, 446, 30, 30, 'Z', 0);
    // 右: 吹哨安撫
    Art.drawWhistleWave(ctx, { x: 450, y: 420, radius: 120, t: 0.05, dur: 0.25 });
    Art.drawTamer(ctx, { x: 450, y: 420, facing: 0, rolling: false, parryLeft: 0, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
    Art.drawShowMonster(ctx, { x: 450, y: 340, species: 'thunder', mastery: 0, rage: 55, redLow: 80, mode: 'roam', performing: false, fx: 'calmed', fxT: 0.1, fxDur: 0.5, subdue: 0, chargeT: 0, chargeDur: 1.5, dir: -1 });
    chevron(ctx, 510, 282, 1, P.whistle);
    keycap(ctx, 476, 446, 30, 30, 'X', 0);
    arrowKeys(ctx, 300, 600, 24);
  }

  function guidePage3(ctx) {
    ctx.save();
    ctx.fillStyle = P.arena; ctx.fillRect(0, 0, 600, 250);
    ctx.fillStyle = P.stands; ctx.fillRect(0, 300, 600, 110);
    ctx.fillStyle = P.arena; ctx.fillRect(0, 418, 600, 120);
    ctx.restore();
    // 上: 兩隻都在紅線, 輪流表演 → 連擊 3 → 4
    Art.drawShowMonster(ctx, { x: 170, y: 100, species: 'fire', mastery: 0, rage: 86, redLow: 80, mode: 'roam', performing: false, fx: 'none', fxT: 0, fxDur: 0.5, subdue: 0, chargeT: 0, chargeDur: 1.5, dir: 1 });
    Art.drawShowMonster(ctx, { x: 430, y: 100, species: 'stone', mastery: 1, rage: 82, redLow: 75, mode: 'roam', performing: true, fx: 'none', fxT: 0, fxDur: 0.5, subdue: 0, chargeT: 0, chargeDur: 1.5, dir: -1 });
    Art.drawFloatText(ctx, { x: 430, y: 30, text: '連擊 4', kind: 'combo', t: 0.2, dur: 1 });
    ctx.save(); ctx.translate(140, 205); ctx.scale(0.42, 0.42);
    Art.drawComboMeter(ctx, { x: 0, y: 0, combo: 3, mult: 2.4, left: 1.5, window: 4, broken: false, brokenT: 0, brokenDur: 1.2 });
    ctx.restore();
    arrow(ctx, 275, 205, 320, 205, '#ffffff', false);
    ctx.save(); ctx.translate(460, 205); ctx.scale(0.42, 0.42);
    Art.drawComboMeter(ctx, { x: 0, y: 0, combo: 4, mult: 2.6, left: 4, window: 4, broken: false, brokenT: 0, brokenDur: 1.2 });
    ctx.restore();
    // 下: 怒氣滿 → 撞破圍欄、觀眾被嚇跑 → 連擊中斷
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(20, 268, 560, 2);
    ctx.restore();
    for (var i = 0; i < 6; i++) {
      Art.drawFence(ctx, { x: 50 + i * 100, y: 414, side: 'top', broken: i === 3 });
    }
    Art.drawVisitor(ctx, { x: 150, y: 350, seat: 1, mode: 'watch' });
    Art.drawVisitor(ctx, { x: 450, y: 350, seat: 4, mode: 'watch' });
    Art.drawVisitor(ctx, { x: 250, y: 350, seat: 2, mode: 'watch' });
    Art.drawVisitor(ctx, { x: 350, y: 350, seat: 3, mode: 'scared' });
    Art.drawShowMonster(ctx, { x: 360, y: 470, species: 'thunder', mastery: 0, rage: 100, redLow: 80, mode: 'charge', performing: false, fx: 'none', fxT: 0, fxDur: 0.5, subdue: 0, chargeT: 1.2, chargeDur: 1.5, dir: -1 });
    ctx.save(); ctx.translate(300, 590); ctx.scale(0.5, 0.5);
    Art.drawComboMeter(ctx, { x: 0, y: 0, combo: 0, mult: 2, left: 0, window: 4, broken: true, brokenT: 0.2, brokenDur: 1.2 });
    ctx.restore();
    // 流程: 地下城 → 表演場 → 商店, ×3 天 → 星
    var fy = 668;
    label(ctx, '地下城', 70, fy, P.lassoRing);
    arrow(ctx, 112, fy, 142, fy, P.textDim);
    label(ctx, '表演場', 190, fy, P.redline);
    arrow(ctx, 232, fy, 262, fy, P.textDim);
    label(ctx, '商店', 296, fy, P.gold);
    label(ctx, '×3 天', 370, fy, P.text);
    arrow(ctx, 412, fy, 442, fy, P.textDim);
    for (var k = 0; k < 3; k++) star(ctx, 470 + k * 36, fy, 15, P.star, P.outline);
  }

  window.Art = Art;
})();
