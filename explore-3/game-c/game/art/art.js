/* 魔物大遊行 — 美術(Canvas 2D 幾何繪製, 無外部資源)
 * 全域 window.Art; 每個函式自己 save/restore。
 * 座標皆為畫面座標; 物件 x,y 為中心(drawStand / drawButton 為左上角)。
 */
(function () {
  'use strict';

  var P = {
    bg: '#15121c',
    ink: '#120e16',
    hudBg: '#1a1622',
    hudLine: '#3a3346',
    text: '#f4f0fa',
    textDim: '#a49cb4',
    // 玩家(隊頭 / 圍圈)
    player: '#3fe0d0',
    playerDark: '#1f8a80',
    skin: '#f0c8a0',
    hat: '#4a3020',
    // 隊伍共用
    collar: '#ffcf3a',
    rope: '#c89a5a',
    ropeDark: '#8a6234',
    rageLow: '#e8e4f0',
    rageReady: '#ffb020',
    rageLoose: '#ff3b3b',
    rageTrack: 'rgba(10,8,14,0.6)',
    // 數值語意
    gold: '#ffd23a',
    rep: '#ff8ad8',
    repDown: '#ff4a4a',
    heart: '#ff4a4a',
    join: '#3fe0d0',
    // 地下城
    wall: '#0e0b12',
    wallTop: '#1c1724',
    wallEdge: '#2c2538',
    lava: '#3a2420', lavaMark: '#6a2c18',
    ruins: '#33333c', ruinsMark: '#45454f',
    forest: '#1e3226', forestMark: '#2c4a34',
    cave: '#262640', caveMark: '#363660',
    hall: '#2e2a26', hallMark: '#3a352f',
    // 魔物
    fire: '#ff6a2a', fireDark: '#b8401a', fireLight: '#ffb070',
    bat: '#a070ff', batDark: '#6a40c0', batLight: '#d0b8ff',
    mushroom: '#6ee05a', mushroomDark: '#3a9a30', mushroomLight: '#c8f5b0',
    stone: '#b8b0a0', stoneDark: '#7c7466', stoneLight: '#e0dacb',
    // 遊行
    grass: '#1c2a22', grassMark: '#24362b',
    plaza: '#3a3530', plazaMark: '#46403a', plazaEdge: '#6a5e50',
    standWood: '#5a3e2a', standRow: '#6e4c32', standRail: '#9a7650',
    water: '#2a6a9a', waterLight: '#7ec4ee', fountainStone: '#8a8478',
    // UI
    panel: '#241e2e', panelEdge: '#4a4058',
    btnOn: '#3fe0d0', btnOnText: '#0e2226', btnOff: '#2a2632', btnOffText: '#6a6478'
  };

  var SP = {
    fire: { main: P.fire, dark: P.fireDark, light: P.fireLight, name: '火蜥蜴' },
    bat: { main: P.bat, dark: P.batDark, light: P.batLight, name: '蝙蝠' },
    mushroom: { main: P.mushroom, dark: P.mushroomDark, light: P.mushroomLight, name: '蘑菇' },
    stone: { main: P.stone, dark: P.stoneDark, light: P.stoneLight, name: '石像鬼' }
  };
  var ZONE_SPECIES = { lava: 'fire', ruins: 'stone', forest: 'mushroom', cave: 'bat' };
  var HAZ_COLOR = { firecone: P.fire, batdash: P.bat, spore: P.mushroom, rockfall: P.stone };
  var HAZ_WARN = { firecone: 0.5, batdash: 0.6, spore: 0.4, rockfall: 1.0 };

  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';

  function now() {
    return (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) / 1000;
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function num(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; }
  function font(px, bold) { return (bold ? 'bold ' : '') + px + 'px ' + FONT; }

  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // 文字: 一律深色描邊(P10)
  function txt(ctx, str, x, y, px, color, align, bold, noOutline) {
    ctx.font = font(px, bold);
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    if (!noOutline) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(3, px * 0.2);
      ctx.strokeStyle = 'rgba(8,6,12,0.92)';
      ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  function starPath(ctx, cx, cy, r) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var rad = (i % 2) ? r * 0.45 : r;
      var px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  function heartPath(ctx, cx, cy, s) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.9);
    ctx.bezierCurveTo(cx - s * 1.3, cy + s * 0.05, cx - s * 0.9, cy - s * 1.0, cx, cy - s * 0.35);
    ctx.bezierCurveTo(cx + s * 0.9, cy - s * 1.0, cx + s * 1.3, cy + s * 0.05, cx, cy + s * 0.9);
    ctx.closePath();
  }
  function coinIcon(ctx, cx, cy, r) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = P.gold; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.strokeStyle = '#b88a10'; ctx.lineWidth = Math.max(1.5, r * 0.18); ctx.stroke();
  }
  function repIcon(ctx, cx, cy, r, color) {
    starPath(ctx, cx, cy, r);
    ctx.fillStyle = color || P.rep; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.lineJoin = 'round'; ctx.stroke();
  }
  function collarIcon(ctx, cx, cy, r, filled) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = r * 0.5;
    ctx.strokeStyle = filled ? P.collar : '#3a3346';
    ctx.stroke();
    if (filled) {
      ctx.beginPath(); ctx.arc(cx, cy + r, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = P.collar; ctx.fill();
    }
  }

  // ---------- 魔物本體(朝右, 中心 0,0, 半徑 R) ----------
  function eye(ctx, x, y, r, mood, side) {
    ctx.lineCap = 'round';
    if (mood === 'hurt') {
      ctx.strokeStyle = P.ink; ctx.lineWidth = r * 0.55;
      ctx.beginPath();
      ctx.moveTo(x - side * r * 0.8, y - r * 0.8); ctx.lineTo(x + side * r * 0.6, y); ctx.lineTo(x - side * r * 0.8, y + r * 0.8);
      ctx.stroke();
      return;
    }
    if (mood === 'dizzy') {
      ctx.strokeStyle = P.ink; ctx.lineWidth = r * 0.5;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.7, y - r * 0.7); ctx.lineTo(x + r * 0.7, y + r * 0.7);
      ctx.moveTo(x + r * 0.7, y - r * 0.7); ctx.lineTo(x - r * 0.7, y + r * 0.7);
      ctx.stroke();
      return;
    }
    if (mood === 'happy') {
      ctx.strokeStyle = P.ink; ctx.lineWidth = r * 0.55;
      ctx.beginPath(); ctx.arc(x, y + r * 0.3, r * 0.8, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      return;
    }
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.3, y, r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = mood === 'angry' ? '#c01818' : P.ink; ctx.fill();
    if (mood === 'angry') {
      ctx.strokeStyle = P.ink; ctx.lineWidth = r * 0.55;
      ctx.beginPath();
      ctx.moveTo(x + side * r * 1.1, y - r * 1.5); ctx.lineTo(x - side * r * 1.0, y - r * 0.8);
      ctx.stroke();
    }
  }

  // tint: 若給, 所有部件用同一色填(做閃白 / 染色疊層)
  function monsterBody(ctx, sp, R, mood, lw, tint) {
    var c = SP[sp] || SP.fire;
    function f(col) { return tint || col; }
    ctx.lineJoin = 'round';
    ctx.lineWidth = lw;
    ctx.strokeStyle = tint ? 'rgba(0,0,0,0)' : P.ink;
    var eyes = [];
    if (sp === 'bat') {
      for (var s = -1; s <= 1; s += 2) {
        ctx.beginPath();
        ctx.moveTo(s * R * 0.4, -R * 0.2);
        ctx.lineTo(s * R * 1.45, -R * 0.55);
        ctx.lineTo(s * R * 1.3, R * 0.15);
        ctx.quadraticCurveTo(s * R * 1.1, -R * 0.05, s * R * 0.95, R * 0.1);
        ctx.quadraticCurveTo(s * R * 0.8, R * 0.05, s * R * 0.55, R * 0.35);
        ctx.closePath();
        ctx.fillStyle = f(c.dark); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * R * 0.5, -R * 0.4);
        ctx.lineTo(s * R * 0.35, -R * 1.0);
        ctx.lineTo(s * R * 0.08, -R * 0.55);
        ctx.closePath();
        ctx.fillStyle = f(c.main); ctx.fill(); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, R * 0.68, 0, Math.PI * 2);
      ctx.fillStyle = f(c.main); ctx.fill(); ctx.stroke();
      if (!tint) {
        ctx.beginPath(); ctx.arc(R * 0.05, R * 0.25, R * 0.32, 0, Math.PI * 2);
        ctx.fillStyle = c.light; ctx.fill();
      }
      eyes = [[-R * 0.12, -R * 0.12], [R * 0.3, -R * 0.12]];
    } else if (sp === 'mushroom') {
      rr(ctx, -R * 0.5, -R * 0.12, R * 1.0, R * 0.97, R * 0.28);
      ctx.fillStyle = f('#f0e6cc'); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -R * 0.08, R * 1.05, R * 0.92, 0, Math.PI, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = f(c.main); ctx.fill(); ctx.stroke();
      if (!tint) {
        ctx.fillStyle = '#ffffff';
        [[-R * 0.5, -R * 0.42, R * 0.16], [R * 0.1, -R * 0.7, R * 0.18], [R * 0.6, -R * 0.35, R * 0.14]].forEach(function (d) {
          ctx.beginPath(); ctx.arc(d[0], d[1], d[2], 0, Math.PI * 2); ctx.fill();
        });
      }
      eyes = [[-R * 0.05, R * 0.32], [R * 0.3, R * 0.32]];
    } else if (sp === 'stone') {
      for (var t = -1; t <= 1; t += 2) {
        ctx.beginPath();
        ctx.moveTo(t * R * 0.75, -R * 0.3);
        ctx.lineTo(t * R * 1.15, -R * 0.62);
        ctx.lineTo(t * R * 1.05, R * 0.2);
        ctx.lineTo(t * R * 0.75, R * 0.25);
        ctx.closePath();
        ctx.fillStyle = f(c.dark); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(t * R * 0.62, -R * 0.55);
        ctx.lineTo(t * R * 0.76, -R * 1.05);
        ctx.lineTo(t * R * 0.28, -R * 0.62);
        ctx.closePath();
        ctx.fillStyle = f(c.dark); ctx.fill(); ctx.stroke();
      }
      rr(ctx, -R * 0.8, -R * 0.65, R * 1.6, R * 1.5, R * 0.2);
      ctx.fillStyle = f(c.main); ctx.fill(); ctx.stroke();
      if (!tint) {
        ctx.strokeStyle = c.dark; ctx.lineWidth = Math.max(1, lw * 0.6);
        ctx.beginPath();
        ctx.moveTo(-R * 0.5, R * 0.3); ctx.lineTo(-R * 0.25, R * 0.5); ctx.lineTo(-R * 0.35, R * 0.75);
        ctx.moveTo(R * 0.45, R * 0.4); ctx.lineTo(R * 0.6, R * 0.65);
        ctx.stroke();
      }
      eyes = [[-R * 0.05, -R * 0.15], [R * 0.38, -R * 0.15]];
    } else { // fire
      ctx.beginPath(); ctx.arc(-R * 0.82, R * 0.42, R * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = f(c.main); ctx.fill(); ctx.stroke();
      for (var i = 0; i < 3; i++) {
        var px = -R * 0.42 + i * R * 0.4;
        ctx.beginPath();
        ctx.moveTo(px - R * 0.22, -R * 0.5);
        ctx.quadraticCurveTo(px - R * 0.12, -R * 0.85, px + R * 0.05, -R * 1.08);
        ctx.quadraticCurveTo(px + R * 0.05, -R * 0.75, px + R * 0.22, -R * 0.5);
        ctx.closePath();
        ctx.fillStyle = f('#ffd080'); ctx.fill(); ctx.stroke();
      }
      ctx.beginPath(); ctx.ellipse(0, R * 0.08, R * 0.95, R * 0.8, 0, 0, Math.PI * 2);
      ctx.fillStyle = f(c.main); ctx.fill(); ctx.stroke();
      if (!tint) {
        ctx.beginPath(); ctx.ellipse(R * 0.1, R * 0.38, R * 0.55, R * 0.32, 0, 0, Math.PI * 2);
        ctx.fillStyle = c.light; ctx.fill();
      }
      eyes = [[R * 0.18, -R * 0.18], [R * 0.58, -R * 0.18]];
    }
    if (!tint) {
      var er = R * 0.18;
      eye(ctx, eyes[0][0], eyes[0][1], er, mood, -1);
      eye(ctx, eyes[1][0], eyes[1][1], er, mood, 1);
    }
  }

  function faceDir(angle) {
    var c = Math.cos(num(angle, 0));
    return c < -0.05 ? -1 : 1;
  }
  function shadow(ctx, y, rx, ry) {
    ctx.beginPath(); ctx.ellipse(0, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
  }
  function sparkle(ctx, x, y, s, color) {
    ctx.beginPath();
    ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y);
    ctx.quadraticCurveTo(x, y, x, y + s); ctx.quadraticCurveTo(x, y, x - s, y);
    ctx.quadraticCurveTo(x, y, x, y - s); ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
  }

  // ---------- 鼠標 / 箭頭(說明頁用) ----------
  function cursorIcon(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, 26); ctx.lineTo(7, 20); ctx.lineTo(12, 31); ctx.lineTo(17, 29);
    ctx.lineTo(12, 18); ctx.lineTo(20, 18); ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = P.ink; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
  }
  function arrowHead(ctx, x, y, ang, s, color) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.7, -s * 0.75); ctx.lineTo(-s * 0.7, s * 0.75); ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    ctx.restore();
  }

  // =====================================================================
  var Art = {
    canvas: { width: 720, height: 1280 },
    palette: P,

    drawBackground: function (ctx) {
      ctx.save();
      ctx.fillStyle = P.bg;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.restore();
    },

    // ---------- 地下城格子 80×80 ----------
    drawTile: function (ctx, s) {
      ctx.save();
      var x0 = s.x - 40, y0 = s.y - 40;
      if (s.kind === 'wall') {
        ctx.fillStyle = P.wall; ctx.fillRect(x0, y0, 80, 80);
        ctx.fillStyle = P.wallTop; ctx.fillRect(x0 + 3, y0 + 3, 74, 60);
        ctx.strokeStyle = P.wallEdge; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0 + 3, y0 + 23); ctx.lineTo(x0 + 77, y0 + 23);
        ctx.moveTo(x0 + 3, y0 + 43); ctx.lineTo(x0 + 77, y0 + 43);
        ctx.moveTo(x0 + 40, y0 + 3); ctx.lineTo(x0 + 40, y0 + 23);
        ctx.moveTo(x0 + 20, y0 + 23); ctx.lineTo(x0 + 20, y0 + 43);
        ctx.moveTo(x0 + 60, y0 + 23); ctx.lineTo(x0 + 60, y0 + 43);
        ctx.moveTo(x0 + 40, y0 + 43); ctx.lineTo(x0 + 40, y0 + 63);
        ctx.stroke();
        ctx.restore();
        return;
      }
      var zone = s.zone || 'hall';
      ctx.fillStyle = P[zone] || P.hall; ctx.fillRect(x0, y0, 80, 80);
      var mk = P[zone + 'Mark'] || P.hallMark;
      ctx.strokeStyle = mk; ctx.fillStyle = mk; ctx.lineWidth = 2;
      if (zone === 'lava') {
        ctx.beginPath();
        ctx.moveTo(x0 + 10, y0 + 22); ctx.lineTo(x0 + 28, y0 + 30); ctx.lineTo(x0 + 34, y0 + 50);
        ctx.moveTo(x0 + 52, y0 + 12); ctx.lineTo(x0 + 58, y0 + 34); ctx.lineTo(x0 + 72, y0 + 40);
        ctx.moveTo(x0 + 48, y0 + 62); ctx.lineTo(x0 + 66, y0 + 70);
        ctx.stroke();
      } else if (zone === 'ruins') {
        ctx.strokeRect(x0 + 4, y0 + 4, 34, 34); ctx.strokeRect(x0 + 42, y0 + 4, 34, 34);
        ctx.strokeRect(x0 + 4, y0 + 42, 34, 34); ctx.strokeRect(x0 + 42, y0 + 42, 34, 34);
      } else if (zone === 'forest') {
        [[16, 18], [54, 26], [30, 56], [66, 62], [12, 70]].forEach(function (p) {
          ctx.beginPath(); ctx.ellipse(x0 + p[0], y0 + p[1], 6, 3, 0.6, 0, Math.PI * 2); ctx.fill();
        });
      } else if (zone === 'cave') {
        [[18, 20, 3], [58, 16, 2], [40, 46, 4], [14, 62, 2], [64, 64, 3]].forEach(function (p) {
          ctx.beginPath(); ctx.arc(x0 + p[0], y0 + p[1], p[2], 0, Math.PI * 2); ctx.fill();
        });
      } else {
        ctx.beginPath();
        ctx.moveTo(x0, y0 + 26); ctx.lineTo(x0 + 80, y0 + 26);
        ctx.moveTo(x0, y0 + 53); ctx.lineTo(x0 + 80, y0 + 53);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 0.5, y0 + 0.5, 79, 79);
      if (s.nest) {
        var sp = ZONE_SPECIES[zone];
        var col = sp ? SP[sp].main : P.textDim;
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = col; ctx.lineWidth = 3;
        ctx.setLineDash([7, 6]);
        ctx.beginPath(); ctx.arc(s.x, s.y, 30, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (var i = 0; i < 6; i++) {
          var a = i * Math.PI / 3 + 0.3;
          ctx.moveTo(s.x + Math.cos(a) * 12, s.y + Math.sin(a) * 12);
          ctx.lineTo(s.x + Math.cos(a + 0.9) * 20, s.y + Math.sin(a + 0.9) * 20);
        }
        ctx.stroke();
      }
      ctx.restore();
    },

    // ---------- 隊頭 56×56(判定圓 16) ----------
    drawTamer: function (ctx, s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      var ang = num(s.angle, -Math.PI / 2);
      if (s.blink) {
        ctx.globalAlpha = (Math.floor(now() * 12) % 2) ? 0.3 : 0.95;
      }
      shadow(ctx, 13, 15, 5);
      // 前進方向指標
      ctx.save();
      ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(27, 0); ctx.lineTo(19, -7); ctx.lineTo(19, 7); ctx.closePath();
      ctx.fillStyle = P.player; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.restore();
      // 身體 = 判定圓
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fillStyle = P.player; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = P.ink; ctx.stroke();
      var f = faceDir(ang);
      ctx.scale(f, 1);
      ctx.beginPath(); ctx.arc(1, -1, 9, 0, Math.PI * 2);
      ctx.fillStyle = P.skin; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = P.ink;
      ctx.beginPath(); ctx.arc(3, -1, 1.6, 0, Math.PI * 2); ctx.arc(7, -1, 1.6, 0, Math.PI * 2); ctx.fill();
      // 帽子
      ctx.beginPath(); ctx.ellipse(0, -8, 15, 4.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = P.hat; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      rr(ctx, -8, -17, 16, 9, 3);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = P.player; ctx.fillRect(-7, -11, 14, 2.5);
      if (s.blink) {
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.restore();
    },

    // ---------- 隊伍魔物 52×52 ----------
    drawTrainMonster: function (ctx, s) {
      ctx.save();
      var R = 16;
      var t = now();
      var loose = s.mode === 'loose';
      var rage = clamp(num(s.rage, 0), 0, 100);
      ctx.translate(s.x, s.y);
      var sx = s.hitFx ? Math.sin(t * 60) * 1.2 : 0;
      shadow(ctx, R * 0.9, R * 0.8, R * 0.25);
      // 怒氣軌道
      ctx.beginPath(); ctx.arc(0, 0, 22.5, 0, Math.PI * 2);
      ctx.strokeStyle = P.rageTrack; ctx.lineWidth = 5; ctx.stroke();
      // 本體
      ctx.save();
      ctx.translate(sx, 0);
      ctx.scale(faceDir(s.angle), 1);
      var mood = loose ? 'angry' : (s.hitFx ? 'hurt' : (s.performing ? 'happy' : (rage >= 50 ? 'angry' : 'normal')));
      monsterBody(ctx, s.species, R, mood, 2);
      if (s.hitFx) {
        ctx.globalAlpha = 0.45 + 0.25 * Math.sin(t * 40);
        monsterBody(ctx, s.species, R, mood, 2, '#ffffff');
        ctx.globalAlpha = 1;
      } else if (loose) {
        ctx.globalAlpha = 0.3;
        monsterBody(ctx, s.species, R, mood, 2, P.rageLoose);
        ctx.globalAlpha = 1;
      } else if (s.performing) {
        ctx.globalAlpha = 0.3;
        monsterBody(ctx, s.species, R, mood, 2, '#fff2b0');
        ctx.globalAlpha = 1;
      }
      // 項圈(隊伍中 = 完整金環; 失控 = 斷開)
      ctx.lineCap = 'round';
      if (!loose) {
        ctx.beginPath(); ctx.ellipse(0, R * 0.2, R * 0.72, R * 0.42, 0, Math.PI * 0.12, Math.PI * 0.88);
        ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.stroke();
        ctx.strokeStyle = P.collar; ctx.lineWidth = 3.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, R * 0.62 + 1, 3, 0, Math.PI * 2);
        ctx.fillStyle = P.collar; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = P.ink; ctx.stroke();
      } else {
        ctx.strokeStyle = P.collar; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(0, R * 0.2, R * 0.72, R * 0.42, 0, Math.PI * 0.12, Math.PI * 0.38); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, R * 0.2, R * 0.72, R * 0.42, 0, Math.PI * 0.62, Math.PI * 0.88); ctx.stroke();
      }
      ctx.restore();
      // 怒氣弧
      var col = loose ? P.rageLoose : (rage >= 50 ? P.rageReady : P.rageLow);
      var lw = loose ? 5 : 4;
      if (loose) lw = 4 + 1.5 * (0.5 + 0.5 * Math.sin(t * 14));
      if (rage > 0) {
        ctx.beginPath();
        ctx.arc(0, 0, 22.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * rage / 100);
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'butt'; ctx.stroke();
      }
      if (s.hitFx) {
        ctx.beginPath(); ctx.arc(0, 0, 22.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.stroke();
      }
      // 50 刻度(表演門檻, 正下方)
      ctx.beginPath(); ctx.moveTo(0, 19); ctx.lineTo(0, 26);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.lineCap = 'butt'; ctx.stroke();
      if (s.performing && !loose) {
        var k = 0.6 + 0.4 * Math.sin(t * 20);
        sparkle(ctx, -19, -19, 5 * k + 1, P.gold);
        sparkle(ctx, 19, -19, 5 * k + 1, P.gold);
        sparkle(ctx, -19, 19, 4 * k + 1, P.gold);
        sparkle(ctx, 19, 19, 4 * k + 1, P.gold);
      }
      ctx.restore();
    },

    // ---------- 繩子一節 20×20 ----------
    drawRopeSegment: function (ctx, s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(num(s.angle, 0));
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 8; ctx.stroke();
      ctx.strokeStyle = (num(s.index, 0) % 2) ? P.ropeDark : P.rope; ctx.lineWidth = 5; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = P.rope; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = P.ink; ctx.stroke();
      ctx.restore();
    },

    // ---------- 野生魔物 80×80 ----------
    drawWildMonster: function (ctx, s) {
      ctx.save();
      var R = 24, t = now();
      ctx.translate(s.x, s.y);
      shadow(ctx, R * 0.9, R * 0.85, R * 0.28);
      var c = SP[s.species] || SP.fire;
      if (s.casting) {
        ctx.save();
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -t * 40;
        ctx.beginPath(); ctx.arc(0, 0, 33, 0, Math.PI * 2);
        ctx.strokeStyle = c.main; ctx.lineWidth = 3.5; ctx.stroke();
        ctx.restore();
      }
      ctx.save();
      ctx.scale(faceDir(s.angle), 1);
      var mood = s.stunned ? 'dizzy' : (s.hit ? 'hurt' : (s.casting ? 'angry' : 'normal'));
      monsterBody(ctx, s.species, R, mood, 3);
      if (s.hit) {
        ctx.globalAlpha = 0.6;
        monsterBody(ctx, s.species, R, mood, 3, '#ffffff');
        ctx.globalAlpha = 1;
      } else if (s.casting) {
        ctx.globalAlpha = 0.2 + 0.2 * Math.sin(t * 18);
        monsterBody(ctx, s.species, R, mood, 3, c.light);
        ctx.globalAlpha = 1;
      } else if (s.stunned) {
        ctx.globalAlpha = 0.35;
        monsterBody(ctx, s.species, R, mood, 3, '#8a8498');
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      if (s.stunned) {
        for (var i = 0; i < 3; i++) {
          var a = t * 5 + i * Math.PI * 2 / 3;
          var px = Math.cos(a) * 18, py = -27 + Math.sin(a) * 4;
          starPath(ctx, px, py, 5);
          ctx.fillStyle = '#ffe680'; ctx.fill();
          ctx.lineWidth = 1.2; ctx.strokeStyle = P.ink; ctx.stroke();
        }
      }
      // 體力格
      var mx = Math.max(1, Math.round(num(s.maxStamina, 1)));
      var st = clamp(Math.round(num(s.stamina, mx)), 0, mx);
      var pw = 9, ph = 7, gap = 3;
      if (mx > 5) { pw = Math.max(4, Math.floor((64 - gap * (mx - 1)) / mx)); }
      var tw = mx * pw + (mx - 1) * gap;
      var px0 = -tw / 2, py0 = -39;
      for (var j = 0; j < mx; j++) {
        ctx.fillStyle = j < st ? '#ffffff' : '#3a3346';
        ctx.fillRect(px0 + j * (pw + gap), py0, pw, ph);
        ctx.lineWidth = 1.5; ctx.strokeStyle = P.ink;
        ctx.strokeRect(px0 + j * (pw + gap), py0, pw, ph);
      }
      ctx.restore();
    },

    // ---------- 技能(預警 = 虛線框 + 由內長大的填色; 生效 = 實線框 + 滿填) ----------
    drawHazard: function (ctx, s) {
      ctx.save();
      var kind = s.kind, col = HAZ_COLOR[kind] || P.fire;
      var warn = s.phase === 'warn';
      var t = num(s.t, 0);
      var p = clamp(t / (HAZ_WARN[kind] || 0.5), 0, 1);
      var ang = num(s.angle, 0);
      ctx.translate(s.x, s.y);
      ctx.lineJoin = 'round';
      function edge(path) {
        path();
        if (warn) {
          ctx.setLineDash([12, 8]);
          ctx.lineDashOffset = -t * 50;
          ctx.strokeStyle = 'rgba(8,6,12,0.8)'; ctx.lineWidth = 6; ctx.stroke();
          ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = 'rgba(8,6,12,0.8)'; ctx.lineWidth = 7; ctx.stroke();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
        }
      }
      if (kind === 'firecone') {
        var L = num(s.radius, 220), half = Math.PI / 6;
        var wedge = function (r) {
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, ang - half, ang + half); ctx.closePath();
        };
        if (warn) {
          wedge(L); ctx.fillStyle = col; ctx.globalAlpha = 0.12; ctx.fill();
          wedge(L * p); ctx.globalAlpha = 0.3; ctx.fill();
          ctx.globalAlpha = 1;
          edge(function () { wedge(L); });
        } else {
          wedge(L); ctx.globalAlpha = 0.55; ctx.fillStyle = col; ctx.fill();
          wedge(L * 0.6); ctx.globalAlpha = 0.55; ctx.fillStyle = '#ffd080'; ctx.fill();
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = '#ffe9b0';
          for (var i = 0; i < 6; i++) {
            var fa = ang + (i / 5 - 0.5) * half * 1.6;
            var fr = L * (0.35 + 0.5 * ((t * 3 + i * 0.37) % 1));
            ctx.beginPath(); ctx.arc(Math.cos(fa) * fr, Math.sin(fa) * fr, 8 + (i % 3) * 3, 0, Math.PI * 2); ctx.fill();
          }
          ctx.globalAlpha = 1;
          edge(function () { wedge(L); });
        }
      } else if (kind === 'batdash') {
        var br = num(s.radius, 30);
        ctx.rotate(ang);
        if (warn) {
          var len = num(s.length, 320);
          var lane = function (l) { rr(ctx, -br, -br, l + br * 2, br * 2, br); };
          lane(len); ctx.fillStyle = col; ctx.globalAlpha = 0.12; ctx.fill();
          lane(len * p); ctx.globalAlpha = 0.3; ctx.fill();
          ctx.globalAlpha = 1;
          edge(function () { lane(len); });
          // 方向箭頭
          ctx.beginPath(); ctx.moveTo(len - 4, 0); ctx.lineTo(len - 26, -16); ctx.lineTo(len - 26, 16); ctx.closePath();
          ctx.fillStyle = col; ctx.fill();
        } else {
          // x,y = 衝刺中的身體中心; 身後拖尾
          var g = ctx.createLinearGradient(-120, 0, 0, 0);
          g.addColorStop(0, 'rgba(160,112,255,0)');
          g.addColorStop(1, 'rgba(160,112,255,0.55)');
          ctx.fillStyle = g;
          rr(ctx, -120, -br * 0.8, 120, br * 1.6, br * 0.8); ctx.fill();
          ctx.beginPath(); ctx.arc(0, 0, br, 0, Math.PI * 2);
          ctx.fillStyle = col; ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1;
          edge(function () { ctx.beginPath(); ctx.arc(0, 0, br, 0, Math.PI * 2); });
        }
      } else if (kind === 'spore') {
        var sr = num(s.radius, 90);
        var circ = function (r) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); };
        if (warn) {
          circ(sr); ctx.fillStyle = col; ctx.globalAlpha = 0.12; ctx.fill();
          circ(sr * p); ctx.globalAlpha = 0.3; ctx.fill();
          ctx.globalAlpha = 1;
          edge(function () { circ(sr); });
        } else {
          circ(sr); ctx.fillStyle = col; ctx.globalAlpha = 0.35; ctx.fill();
          ctx.globalAlpha = 0.45; ctx.fillStyle = P.mushroomLight;
          var puffs = [[-0.4, -0.3, 0.32], [0.35, -0.35, 0.28], [0.0, 0.1, 0.36], [-0.35, 0.4, 0.26], [0.42, 0.35, 0.27]];
          for (var k = 0; k < puffs.length; k++) {
            var dx = Math.sin(t * 1.5 + k) * 0.06, dy = Math.cos(t * 1.3 + k * 2) * 0.06;
            ctx.beginPath(); ctx.arc((puffs[k][0] + dx) * sr, (puffs[k][1] + dy) * sr, puffs[k][2] * sr, 0, Math.PI * 2); ctx.fill();
          }
          ctx.globalAlpha = 1;
          edge(function () { circ(sr); });
        }
      } else { // rockfall
        var rr2 = num(s.radius, 50);
        var circ2 = function (r) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); };
        if (warn) {
          circ2(rr2); ctx.fillStyle = col; ctx.globalAlpha = 0.12; ctx.fill();
          circ2(rr2 * p); ctx.fillStyle = 'rgba(10,8,14,1)'; ctx.globalAlpha = 0.45; ctx.fill();
          ctx.globalAlpha = 1;
          edge(function () { circ2(rr2); });
          // 正在落下的石頭(越接近落地越大)
          var rs = 8 + 12 * p;
          ctx.save(); ctx.translate(0, -(1 - p) * 40);
          ctx.beginPath();
          ctx.moveTo(-rs, -rs * 0.3); ctx.lineTo(-rs * 0.4, -rs); ctx.lineTo(rs * 0.6, -rs * 0.8);
          ctx.lineTo(rs, rs * 0.1); ctx.lineTo(rs * 0.3, rs * 0.9); ctx.lineTo(-rs * 0.7, rs * 0.6); ctx.closePath();
          ctx.fillStyle = P.stoneDark; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
          ctx.restore();
        } else {
          circ2(rr2); ctx.fillStyle = col; ctx.globalAlpha = 0.6; ctx.fill(); ctx.globalAlpha = 1;
          ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
          ctx.beginPath();
          for (var c2 = 0; c2 < 6; c2++) {
            var ca = c2 * Math.PI / 3 + 0.4;
            ctx.moveTo(Math.cos(ca) * 18, Math.sin(ca) * 18);
            ctx.lineTo(Math.cos(ca + 0.15) * rr2 * 0.85, Math.sin(ca + 0.15) * rr2 * 0.85);
          }
          ctx.stroke();
          var r3 = 20;
          ctx.beginPath();
          ctx.moveTo(-r3, -r3 * 0.3); ctx.lineTo(-r3 * 0.4, -r3); ctx.lineTo(r3 * 0.6, -r3 * 0.8);
          ctx.lineTo(r3, r3 * 0.1); ctx.lineTo(r3 * 0.3, r3 * 0.9); ctx.lineTo(-r3 * 0.7, r3 * 0.6); ctx.closePath();
          ctx.fillStyle = P.stoneDark; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = P.ink; ctx.stroke();
          edge(function () { circ2(rr2); });
        }
      }
      ctx.restore();
    },

    // ---------- 圍圈閃光 ----------
    drawLoopFx: function (ctx, s) {
      ctx.save();
      var pts = s.points || [];
      if (pts.length < 3) { ctx.restore(); return; }
      var a = clamp(1 - num(s.t, 0) / 0.6, 0, 1);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.globalAlpha = 0.35 * a; ctx.fillStyle = P.player; ctx.fill();
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.45 * a; ctx.strokeStyle = P.player; ctx.lineWidth = 14; ctx.stroke();
      ctx.globalAlpha = a; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
    },

    // ---------- 遊行園區(全畫面地面) ----------
    drawPark: function (ctx) {
      ctx.save();
      ctx.fillStyle = P.grass; ctx.fillRect(0, 120, 720, 1160);
      ctx.fillStyle = P.grassMark;
      for (var gy = 140; gy < 1280; gy += 46) {
        for (var gx = ((gy / 46) % 2) * 23 + 10; gx < 720; gx += 46) {
          ctx.fillRect(gx, gy, 3, 8);
        }
      }
      ctx.fillStyle = P.plaza; ctx.fillRect(90, 230, 540, 940);
      ctx.strokeStyle = P.plazaMark; ctx.lineWidth = 2;
      ctx.beginPath();
      for (var x = 90; x <= 630; x += 60) { ctx.moveTo(x, 230); ctx.lineTo(x, 1170); }
      for (var y = 230; y <= 1170; y += 60) { ctx.moveTo(90, y); ctx.lineTo(630, y); }
      ctx.stroke();
      ctx.strokeStyle = P.plazaEdge; ctx.lineWidth = 4;
      ctx.strokeRect(90, 230, 540, 940);
      ctx.restore();
    },

    // ---------- 噴水池 140×140(判定半徑 70 = 外緣) ----------
    drawFountain: function (ctx, s) {
      ctx.save();
      var t = now();
      ctx.translate(s.x, s.y);
      ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI * 2);
      ctx.fillStyle = P.fountainStone; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, 68, 0, Math.PI * 2);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 57, 0, Math.PI * 2);
      ctx.fillStyle = P.water; ctx.fill();
      ctx.strokeStyle = 'rgba(126,196,238,0.5)'; ctx.lineWidth = 2;
      for (var i = 0; i < 2; i++) {
        var r = 18 + ((t * 14 + i * 18) % 36);
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fillStyle = P.fountainStone; ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = P.waterLight; ctx.fill();
      ctx.restore();
    },

    // ---------- 看台(x,y 左上角) ----------
    drawStand: function (ctx, s) {
      ctx.save();
      var x = s.x, y = s.y, w = s.w, h = s.h, side = s.side, t = now();
      var horiz = (side === 'top' || side === 'bottom');
      ctx.fillStyle = P.standWood; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = P.standRow; ctx.lineWidth = 3;
      ctx.beginPath();
      if (horiz) {
        for (var yy = y + h / 3; yy < y + h - 2; yy += h / 3) { ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); }
      } else {
        for (var xx = x + w / 3; xx < x + w - 2; xx += w / 3) { ctx.moveTo(xx, y); ctx.lineTo(xx, y + h); }
      }
      ctx.stroke();
      // 面向廣場的欄杆
      ctx.fillStyle = P.standRail;
      if (side === 'top') ctx.fillRect(x, y + h - 6, w, 6);
      else if (side === 'bottom') ctx.fillRect(x, y, w, 6);
      else if (side === 'left') ctx.fillRect(x + w - 6, y, 6, h);
      else ctx.fillRect(x, y, 6, h);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      if (s.mood === 'cheer') {
        ctx.strokeStyle = P.gold; ctx.lineWidth = 4;
        ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
        var cols = [P.gold, P.rep, '#ffffff'];
        for (var i = 0; i < 14; i++) {
          var u = ((i * 0.618 + t * 0.6) % 1), v = ((i * 0.37 + t * 1.1) % 1);
          var cx = horiz ? x + u * w : x + v * w;
          var cy = horiz ? y + v * h : y + u * h;
          ctx.fillStyle = cols[i % 3];
          ctx.fillRect(cx - 2, cy - 2, 4, 4);
        }
      } else if (s.mood === 'attacked') {
        var k = 0.5 + 0.5 * Math.sin(t * 16);
        ctx.strokeStyle = P.repDown; ctx.lineWidth = 3 + 3 * k;
        ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
        ctx.fillStyle = 'rgba(255,59,59,' + (0.12 + 0.12 * k) + ')';
        ctx.fillRect(x, y, w, h);
      }
      ctx.restore();
    },

    // ---------- 觀眾 44×60 ----------
    drawVisitor: function (ctx, s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      var mode = s.mode || 'watch';
      if (mode === 'empty') {
        ctx.setLineDash([4, 4]);
        rr(ctx, -14, 4, 28, 18, 5);
        ctx.strokeStyle = 'rgba(200,190,210,0.5)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
        return;
      }
      var shirts = ['#d8d0c0', '#9ab0c8', '#c8a0a0', '#a8c0a0', '#c0b0d8'];
      var shirt = shirts[Math.abs(Math.round(s.x * 7 + s.y * 3)) % shirts.length];
      var t = now();
      if (mode === 'scared') {
        var away = (s.side === 'left') ? -1 : (s.side === 'right' ? 1 : (s.x % 2 < 1 ? -1 : 1));
        ctx.translate(Math.sin(t * 30) * 1.5, 0);
        ctx.rotate(0.18 * away);
        ctx.scale(0.9, 0.9);
        shirt = '#8a90a0';
      }
      var bob = mode === 'cheer' ? -Math.abs(Math.sin(t * 9)) * 2 : 0;
      ctx.translate(0, bob);
      ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      // 手
      ctx.beginPath();
      if (mode === 'cheer') {
        ctx.moveTo(-9, 2); ctx.lineTo(-16, -22);
        ctx.moveTo(9, 2); ctx.lineTo(16, -22);
      } else if (mode === 'scared') {
        ctx.moveTo(-9, 2); ctx.lineTo(-17, -10);
        ctx.moveTo(9, 2); ctx.lineTo(17, -10);
      } else {
        ctx.moveTo(-10, 2); ctx.lineTo(-13, 18);
        ctx.moveTo(10, 2); ctx.lineTo(13, 18);
      }
      ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.stroke();
      ctx.strokeStyle = P.skin; ctx.lineWidth = 3; ctx.stroke();
      rr(ctx, -11, -2, 22, 26, 7);
      ctx.fillStyle = shirt; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -12, 9, 0, Math.PI * 2);
      ctx.fillStyle = mode === 'scared' ? '#d8d4e0' : P.skin; ctx.fill(); ctx.stroke();
      ctx.fillStyle = P.ink;
      if (mode === 'cheer') {
        ctx.beginPath(); ctx.arc(0, -9, 3.5, 0, Math.PI); ctx.fill();
        ctx.beginPath(); ctx.arc(-3.5, -14, 1.4, 0, Math.PI * 2); ctx.arc(3.5, -14, 1.4, 0, Math.PI * 2); ctx.fill();
        sparkle(ctx, 0, -25, 2.5, P.gold);
      } else if (mode === 'scared') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(-3.5, -13, 2.6, 0, Math.PI * 2); ctx.arc(3.5, -13, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = P.ink;
        ctx.beginPath(); ctx.arc(-3.5, -13, 1.1, 0, Math.PI * 2); ctx.arc(3.5, -13, 1.1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, -7, 2, 2.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(12, -20); ctx.quadraticCurveTo(15, -15, 12, -13); ctx.quadraticCurveTo(9, -15, 12, -20);
        ctx.fillStyle = '#7ec4ee'; ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(-3.5, -13, 1.4, 0, Math.PI * 2); ctx.arc(3.5, -13, 1.4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    },

    // ---------- 標題卡(全畫面) ----------
    drawTitleCard: function (ctx, s) {
      ctx.save();
      var t = now();
      var dungeon = s.stage !== 'parade';
      ctx.fillStyle = 'rgba(12,10,18,0.94)'; ctx.fillRect(0, 0, 720, 1280);
      txt(ctx, '第 ' + num(s.day, 1) + ' 天', 360, 380, 44, P.textDim, 'center', true);
      txt(ctx, dungeon ? '地下城' : '遊行', 360, 480, 96, dungeon ? P.fireLight : P.rep, 'center', true);
      txt(ctx, dungeon ? '繞圈圍住魔物, 收進隊伍' : '帶隊經過看台, 讓魔物表演', 360, 580, 28, P.text, 'center', false);
      txt(ctx, '60 秒', 360, 630, 24, P.textDim, 'center', false);
      if (dungeon) {
        var sps = ['fire', 'stone', 'mushroom', 'bat'];
        for (var i = 0; i < 4; i++) {
          ctx.save(); ctx.translate(180 + i * 120, 770);
          shadow(ctx, 22, 20, 6);
          monsterBody(ctx, sps[i], 26, 'normal', 3);
          ctx.restore();
        }
      } else {
        // 隊伍走過看台
        ctx.fillStyle = P.standWood; ctx.fillRect(140, 700, 440, 40);
        ctx.fillStyle = P.standRail; ctx.fillRect(140, 734, 440, 6);
        for (var v = 0; v < 5; v++) {
          Art.drawVisitor(ctx, { x: 184 + v * 88, y: 708, side: 'top', mode: 'cheer' });
        }
        var row = ['fire', 'bat', 'mushroom', 'stone'];
        for (var m = 0; m < 4; m++) {
          Art.drawTrainMonster(ctx, { x: 440 - m * 56, y: 820, angle: 0, species: row[m], rage: 30 + m * 15, performing: false, hitFx: false, mode: 'line' });
        }
        Art.drawTamer(ctx, { x: 500, y: 820, angle: 0, blink: false });
      }
      var a = 0.55 + 0.45 * Math.sin(t * 4);
      ctx.globalAlpha = a;
      txt(ctx, '點畫面開始', 360, 1020, 36, P.text, 'center', true);
      ctx.restore();
    },

    // ---------- 按鈕(x,y 左上角) ----------
    drawButton: function (ctx, s) {
      ctx.save();
      var on = !!s.enabled;
      rr(ctx, s.x, s.y, s.w, s.h, 18);
      ctx.fillStyle = on ? P.btnOn : P.btnOff; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = on ? '#ffffff' : P.panelEdge; ctx.stroke();
      ctx.font = font(Math.min(40, Math.round(s.h * 0.4)), true);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = on ? P.btnOnText : P.btnOffText;
      ctx.fillText(String(s.label == null ? '' : s.label), s.x + s.w / 2, s.y + s.h / 2 + 1);
      ctx.restore();
    },

    // ---------- 商店項目 600×140(x,y 中心) ----------
    drawShopItem: function (ctx, s) {
      ctx.save();
      var on = !!s.affordable;
      var x0 = s.x - 300, y0 = s.y - 70;
      var info = {
        longRope: ['長繩', '繩子 +4 節'],
        collarBag: ['項圈袋', '每天項圈 +1'],
        armor: ['護甲', '心數 +1'],
        swiftFeet: ['快腿', '隊頭速度 +40']
      }[s.item] || [String(s.item), ''];
      rr(ctx, x0 + 2, y0 + 2, 596, 136, 16);
      ctx.fillStyle = on ? P.panel : '#1a1620'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = on ? P.player : P.panelEdge; ctx.stroke();
      ctx.globalAlpha = on ? 1 : 0.45;
      // 圖示
      rr(ctx, x0 + 20, y0 + 20, 100, 100, 14);
      ctx.fillStyle = '#2e2738'; ctx.fill();
      var ix = x0 + 70, iy = y0 + 70;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (s.item === 'longRope') {
        ctx.strokeStyle = P.ink; ctx.lineWidth = 9;
        ctx.beginPath(); ctx.arc(ix, iy, 26, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(ix, iy, 15, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = P.rope; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(ix, iy, 26, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(ix, iy, 15, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ix + 26, iy); ctx.quadraticCurveTo(ix + 40, iy + 20, ix + 34, iy + 38); ctx.stroke();
      } else if (s.item === 'collarBag') {
        collarIcon(ctx, ix - 12, iy - 6, 16, true);
        collarIcon(ctx, ix + 14, iy + 6, 16, true);
        txt(ctx, '+1', ix + 26, iy - 28, 22, '#ffffff', 'center', true);
      } else if (s.item === 'armor') {
        ctx.beginPath();
        ctx.moveTo(ix, iy - 38); ctx.lineTo(ix + 32, iy - 26); ctx.lineTo(ix + 28, iy + 10);
        ctx.quadraticCurveTo(ix + 18, iy + 32, ix, iy + 40); ctx.quadraticCurveTo(ix - 18, iy + 32, ix - 28, iy + 10);
        ctx.lineTo(ix - 32, iy - 26); ctx.closePath();
        ctx.fillStyle = '#6a7488'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.ink; ctx.stroke();
        heartPath(ctx, ix, iy, 16);
        ctx.fillStyle = P.heart; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(ix - 14, iy - 30); ctx.lineTo(ix + 6, iy - 30); ctx.lineTo(ix + 6, iy + 8);
        ctx.lineTo(ix + 30, iy + 14); ctx.lineTo(ix + 30, iy + 30); ctx.lineTo(ix - 14, iy + 30); ctx.closePath();
        ctx.fillStyle = P.player; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.ink; ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ix - 40, iy - 14); ctx.lineTo(ix - 22, iy - 14);
        ctx.moveTo(ix - 44, iy + 2); ctx.lineTo(ix - 22, iy + 2);
        ctx.moveTo(ix - 40, iy + 18); ctx.lineTo(ix - 22, iy + 18);
        ctx.stroke();
      }
      txt(ctx, info[0], x0 + 144, y0 + 48, 34, P.text, 'left', true);
      txt(ctx, info[1], x0 + 144, y0 + 94, 24, P.textDim, 'left', false);
      var lv = Math.max(0, Math.round(num(s.level, 0)));
      if (lv > 0) txt(ctx, '已買 ' + lv, x0 + 330, y0 + 48, 20, P.textDim, 'left', false);
      ctx.globalAlpha = 1;
      // 價格: 買不起時金額變紅
      var costStr = String(Math.round(num(s.cost, 0)));
      ctx.font = font(38, true);
      var cw = Math.min(150, ctx.measureText(costStr).width || costStr.length * 22);
      coinIcon(ctx, x0 + 576 - cw - 22, y0 + 70, 16);
      txt(ctx, costStr, x0 + 576, y0 + 71, 38, on ? P.gold : P.repDown, 'right', true);
      ctx.restore();
    },

    // ---------- 飄字 ----------
    drawFloatText: function (ctx, s) {
      ctx.save();
      var t = Math.max(0, num(s.t, 0));
      var a = t < 0.7 ? 1 : clamp(1 - (t - 0.7) / 0.5, 0, 1);
      var y = s.y - 50 * Math.min(t, 1);
      var col = { gold: P.gold, repUp: P.rep, repDown: P.repDown, join: P.join }[s.kind] || P.text;
      var px = s.kind === 'join' ? 32 : 28;
      var str = String(s.text == null ? '' : s.text);
      ctx.globalAlpha = a;
      ctx.font = font(px, true);
      var w = ctx.measureText(str).width || str.length * px;
      var hasIcon = s.kind === 'gold' || s.kind === 'repUp' || s.kind === 'repDown';
      var tx = hasIcon ? s.x + 14 : s.x;
      if (s.kind === 'gold') coinIcon(ctx, tx - w / 2 - 16, y, 11);
      else if (s.kind === 'repUp' || s.kind === 'repDown') repIcon(ctx, tx - w / 2 - 16, y, 13, col);
      txt(ctx, str, tx, y, px, col, 'center', true);
      ctx.restore();
    },

    // ---------- 結算畫面(全畫面) ----------
    drawResultPanel: function (ctx, s) {
      ctx.save();
      var t = now();
      ctx.fillStyle = P.bg; ctx.fillRect(0, 0, 720, 1280);
      txt(ctx, '三天結束', 360, 200, 56, P.text, 'center', true);
      var stars = clamp(Math.round(num(s.stars, 0)), 0, 3);
      var th = ['50', '120', '200'];
      for (var i = 0; i < 3; i++) {
        var cx = 210 + i * 150;
        starPath(ctx, cx, 380, 58);
        ctx.fillStyle = i < stars ? P.rep : '#2a2434'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = i < stars ? '#ffffff' : P.panelEdge; ctx.lineJoin = 'round'; ctx.stroke();
        txt(ctx, th[i], cx, 470, 22, P.textDim, 'center', false);
      }
      var rows = [
        ['名聲', String(Math.round(num(s.rep, 0))), P.rep, 'rep'],
        ['累計金幣', String(Math.round(num(s.goldEarned, 0))), P.gold, 'gold'],
        ['隊伍魔物', String(Math.round(num(s.trainCount, 0))) + ' 隻', P.collar, 'train']
      ];
      for (var r = 0; r < 3; r++) {
        var ry = 580 + r * 120;
        rr(ctx, 110, ry - 46, 500, 92, 16);
        ctx.fillStyle = P.panel; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.panelEdge; ctx.stroke();
        if (rows[r][3] === 'rep') repIcon(ctx, 160, ry, 20);
        else if (rows[r][3] === 'gold') coinIcon(ctx, 160, ry, 18);
        else collarIcon(ctx, 160, ry - 4, 14, true);
        txt(ctx, rows[r][0], 196, ry, 30, P.text, 'left', false);
        txt(ctx, rows[r][1], 580, ry, 44, rows[r][2], 'right', true);
      }
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 4);
      txt(ctx, '點畫面重來', 360, 1060, 36, P.text, 'center', true);
      ctx.restore();
    },

    // ---------- HUD(y 0~120) ----------
    drawHud: function (ctx, s) {
      ctx.save();
      var ph = s.phase;
      if (ph === 'guide' || ph === 'result') { ctx.restore(); return; }
      ctx.fillStyle = P.hudBg; ctx.fillRect(0, 0, 720, 120);
      ctx.fillStyle = P.hudLine; ctx.fillRect(0, 118, 720, 2);
      txt(ctx, '第 ' + num(s.day, 1) + ' 天', 20, 32, 28, P.text, 'left', true);
      var stageName = { dungeon: '地下城', parade: '遊行', shop: '商店', title: '' }[ph] || '';
      var stageCol = ph === 'dungeon' ? P.fireLight : (ph === 'parade' ? P.rep : P.player);
      if (stageName) txt(ctx, stageName, 130, 32, 24, stageCol, 'left', true);
      if (ph === 'dungeon' || ph === 'parade') {
        var tl = Math.max(0, Math.ceil(num(s.timeLeft, 0)));
        txt(ctx, String(tl), 360, 34, 46, tl <= 10 ? P.repDown : P.text, 'center', true);
      }
      coinIcon(ctx, 520, 32, 12);
      txt(ctx, String(Math.round(num(s.gold, 0))), 538, 33, 28, P.gold, 'left', true);
      repIcon(ctx, 636, 32, 14);
      txt(ctx, String(Math.round(num(s.rep, 0))), 654, 33, 28, P.rep, 'left', true);

      var trainStr = '隊伍 ' + num(s.trainCount, 0) + '/' + num(s.trainMax, 12);
      var msg = s.message ? String(s.message) : '';
      if (ph === 'dungeon') {
        var mh = Math.max(1, num(s.maxHearts, 4)), hh = clamp(num(s.hearts, mh), 0, mh);
        var hs = Math.min(28, 190 / mh);
        for (var i = 0; i < mh; i++) {
          heartPath(ctx, 32 + i * hs, 88, Math.min(11, hs * 0.42));
          ctx.fillStyle = i < hh ? P.heart : '#3a3346'; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = P.ink; ctx.stroke();
        }
        var cm = Math.max(1, num(s.collarMax, 3)), cc = clamp(num(s.collars, cm), 0, cm);
        var cs = Math.min(28, 130 / cm);
        for (var j = 0; j < cm; j++) collarIcon(ctx, 240 + j * cs, 86, Math.min(9, cs * 0.34), j < cc);
        txt(ctx, trainStr, 384, 88, 22, P.text, 'left', false);
        if (msg) txt(ctx, msg, 708, 88, 22, P.rageReady, 'right', true);
      } else if (ph === 'parade') {
        txt(ctx, trainStr, 20, 88, 22, P.text, 'left', false);
        if (msg) {
          ctx.font = font(26, true);
          var mw = (ctx.measureText(msg).width || msg.length * 26) + 40;
          var k = 0.5 + 0.5 * Math.sin(now() * 8);
          rr(ctx, 450 - mw / 2, 68, mw, 40, 20);
          ctx.fillStyle = 'rgba(255,59,59,' + (0.18 + 0.15 * k) + ')'; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = P.rageLoose; ctx.stroke();
          txt(ctx, msg, 450, 89, 26, '#ffffff', 'center', true);
        }
      } else {
        txt(ctx, trainStr, 20, 88, 22, P.text, 'left', false);
        if (msg) txt(ctx, msg, 708, 88, 22, P.textDim, 'right', false);
      }
      ctx.restore();
    },

    // ---------- 說明頁示意圖(只畫在 x,y,w,h 框內) ----------
    drawGuidePage: function (ctx, s) {
      ctx.save();
      ctx.beginPath(); ctx.rect(s.x, s.y, s.w, s.h); ctx.clip();
      var page = num(s.page, 0);
      var dims = [[640, 480], [320, 240], [660, 280], [640, 480]][page] || [640, 480];
      var sc = Math.min(s.w / dims[0], s.h / dims[1]);
      ctx.translate(s.x + (s.w - dims[0] * sc) / 2, s.y + (s.h - dims[1] * sc) / 2);
      ctx.scale(sc, sc);
      if (page === 0) guidePage1(ctx);
      else if (page === 1) guidePage2(ctx);
      else if (page === 2) guidePage3(ctx);
      else if (page === 3) guidePage4(ctx);
      ctx.restore();
    }
  };

  // ---------- 說明頁工具 ----------
  // 沿折線(由隊頭往後)放置; 回傳位置與前進方向(朝隊頭)
  function along(path, d) {
    for (var i = 0; i < path.length - 1; i++) {
      var a = path[i], b = path[i + 1];
      var L = Math.hypot(b.x - a.x, b.y - a.y);
      if (d <= L || i === path.length - 2) {
        var u = L > 0 ? Math.min(d / L, 1) : 0;
        return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, angle: Math.atan2(a.y - b.y, a.x - b.x) };
      }
      d -= L;
    }
    return { x: path[0].x, y: path[0].y, angle: 0 };
  }
  // 隊伍: [隊頭, 魔物..., 繩 10 節], 各節沿軌跡距離
  function trainLayout(species) {
    var out = [{ type: 'tamer', d: 0 }], d = 0;
    for (var i = 0; i < species.length; i++) { d += 46; out.push({ type: 'mon', sp: species[i], d: d }); }
    for (var k = 0; k < 10; k++) { d += 24; out.push({ type: 'rope', index: k, d: d }); }
    return out;
  }
  function drawTrainAt(ctx, items, posFn, extra) {
    extra = extra || {};
    // 由尾往頭畫, 隊頭在最上層
    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i], p = posFn(it.d);
      if (it.type === 'rope') Art.drawRopeSegment(ctx, { x: p.x, y: p.y, angle: p.angle, index: it.index });
      else if (it.type === 'mon') {
        var e = extra[it.sp] || {};
        Art.drawTrainMonster(ctx, { x: p.x, y: p.y, angle: p.angle, species: it.sp, rage: e.rage == null ? 20 : e.rage, performing: !!e.performing, hitFx: false, mode: 'line' });
      } else Art.drawTamer(ctx, { x: p.x, y: p.y, angle: p.angle, blink: false });
    }
  }
  function floorFill(ctx, w, h, zone) {
    for (var y = 0; y < h; y += 80) for (var x = 0; x < w; x += 80) {
      Art.drawTile(ctx, { x: x + 40, y: y + 40, kind: 'floor', zone: zone, nest: false });
    }
  }
  function label(ctx, str, x, y, color) { txt(ctx, str, x, y, 22, color || P.text, 'center', true); }

  // 圍成一圈的隊伍(順時針前進, 隊頭在頂端; 圓周 = 隊伍總長 + 8, 尾巴剛好碰到隊頭)
  function loopTrain(ctx, cx, cy, species) {
    var items = trainLayout(species);
    var L = items[items.length - 1].d;
    var r = (L + 8) / (Math.PI * 2);
    var th0 = -Math.PI / 2;
    var pos = function (d) {
      var th = th0 - d / r;
      return { x: cx + Math.cos(th) * r, y: cy + Math.sin(th) * r, angle: th + Math.PI / 2 };
    };
    var pts = [];
    for (var i = 0; i <= 28; i++) pts.push(pos(L * i / 28));
    return { items: items, pos: pos, pts: pts, r: r, head: pos(0), tail: pos(L) };
  }

  // 第 1 頁 帶隊: 走道轉角, 隊頭朝游標轉, 全隊沿同一路跟上
  function guidePage1(ctx) {
    var map = ['#####..#', '#####..#', '#####..#', '.......#', '.......#', '########'];
    for (var r = 0; r < 6; r++) for (var c = 0; c < 8; c++) {
      Art.drawTile(ctx, { x: c * 80 + 40, y: r * 80 + 40, kind: map[r][c] === '#' ? 'wall' : 'floor', zone: 'hall', nest: false });
    }
    var head = { x: 380, y: 320 };
    var path = [head, { x: 0, y: 320 }];
    // 軌跡(已走過) + 將走的路
    ctx.save();
    ctx.setLineDash([3, 9]); ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(63,224,208,0.45)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(60, 320); ctx.lineTo(head.x, head.y); ctx.stroke();
    ctx.setLineDash([14, 10]);
    ctx.strokeStyle = P.player; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(408, 320); ctx.quadraticCurveTo(480, 320, 480, 170); ctx.stroke();
    ctx.restore();
    arrowHead(ctx, 480, 160, -Math.PI / 2, 14, P.player);
    var items = trainLayout(['fire']);
    drawTrainAt(ctx, items, function (d) { return along(path, d); }, { fire: { rage: 20 } });
    cursorIcon(ctx, 478, 92, 1.3);
    label(ctx, '你', 380, 276);
    label(ctx, '游標', 540, 104);
  }

  // 第 2 頁 圍圈: 圈亮起, 圈中魔物少一格體力
  function guidePage2(ctx) {
    floorFill(ctx, 320, 240, 'ruins');
    var lp = loopTrain(ctx, 160, 128, ['fire', 'bat']);
    Art.drawLoopFx(ctx, { points: lp.pts, t: 0.1 });
    Art.drawWildMonster(ctx, { x: 160, y: 136, species: 'stone', stamina: 2, maxStamina: 3, casting: false, stunned: true, hit: false, angle: 0 });
    drawTrainAt(ctx, lp.items, lp.pos);
    // 碰到繩子的接觸點
    var cxp = (lp.head.x + lp.tail.x) / 2 + 10, cyp = (lp.head.y + lp.tail.y) / 2 - 12;
    sparkle(ctx, cxp, cyp, 9, '#ffffff');
    label(ctx, '碰到繩子', lp.head.x + 78, lp.head.y - 8);
  }

  // 第 3 頁 收服: 左 最後一格被圈住 / 右 戴項圈排到隊尾
  function guidePage3(ctx) {
    floorFill(ctx, 300, 280, 'forest');
    var lp = loopTrain(ctx, 150, 146, ['fire', 'bat']);
    Art.drawLoopFx(ctx, { points: lp.pts, t: 0.1 });
    Art.drawWildMonster(ctx, { x: 150, y: 154, species: 'mushroom', stamina: 1, maxStamina: 3, casting: false, stunned: false, hit: false, angle: 0 });
    drawTrainAt(ctx, lp.items, lp.pos);
    // 中間箭頭
    ctx.fillStyle = P.bg; ctx.fillRect(300, 0, 60, 280);
    ctx.save();
    ctx.strokeStyle = P.text; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(310, 140); ctx.lineTo(340, 140); ctx.stroke();
    ctx.restore();
    arrowHead(ctx, 346, 140, 0, 12, P.text);
    // 右格
    ctx.save(); ctx.translate(360, 0);
    floorFill(ctx, 300, 280, 'hall');
    var path = [{ x: 262, y: 80 }, { x: 40, y: 80 }, { x: 40, y: 200 }, { x: 290, y: 200 }];
    var items = trainLayout(['fire', 'bat', 'mushroom']);
    drawTrainAt(ctx, items, function (d) { return along(path, d); });
    var mp = along(path, 138);
    Art.drawFloatText(ctx, { x: mp.x, y: mp.y - 20, text: '加入!', kind: 'join', t: 0.3 });
    ctx.restore();
  }

  // 第 4 頁 遊行: 過半表演得金幣, 全滿脫隊衝看台
  function guidePage4(ctx) {
    ctx.fillStyle = P.grass; ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = P.plaza; ctx.fillRect(40, 110, 560, 270);
    ctx.strokeStyle = P.plazaEdge; ctx.lineWidth = 4; ctx.strokeRect(40, 110, 560, 270);
    Art.drawStand(ctx, { x: 100, y: 8, w: 440, h: 80, side: 'top', mood: 'cheer' });
    var vm = ['cheer', 'cheer', 'cheer', 'watch', 'scared'];
    for (var i = 0; i < 5; i++) Art.drawVisitor(ctx, { x: 100 + 440 * (i + 0.5) / 5, y: 46, side: 'top', mode: vm[i] });
    // 表演: 火蜥蜴噴火打到看台
    var fire = { x: 196, y: 300 };
    Art.drawHazard(ctx, { x: fire.x, y: fire.y, kind: 'firecone', phase: 'active', radius: 220, length: null, angle: -Math.PI / 2, t: 0.2 });
    // 隊伍向左走
    var path = [{ x: 150, y: 300 }, { x: 640, y: 300 }];
    var items = trainLayout(['fire', 'mushroom', 'stone']);
    drawTrainAt(ctx, items, function (d) { return along(path, d); }, { fire: { rage: 62, performing: true }, mushroom: { rage: 30 }, stone: { rage: 44 } });
    Art.drawFloatText(ctx, { x: 200, y: 140, text: '+5', kind: 'gold', t: 0.3 });
    label(ctx, '表演', 196, 352);
    // 脫隊: 怒氣全滿, 離開隊伍衝向看台
    ctx.save();
    ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(255,59,59,0.8)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(400, 296); ctx.lineTo(472, 176); ctx.stroke();
    ctx.restore();
    Art.drawTrainMonster(ctx, { x: 476, y: 150, angle: -1.2, species: 'bat', rage: 100, performing: false, hitFx: false, mode: 'loose' });
    // 打叉
    ctx.save();
    ctx.strokeStyle = P.ink; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(518, 196); ctx.lineTo(546, 224); ctx.moveTo(546, 196); ctx.lineTo(518, 224); ctx.stroke();
    ctx.strokeStyle = P.repDown; ctx.lineWidth = 6; ctx.stroke();
    ctx.restore();
    label(ctx, '脫隊', 586, 210, P.repDown);
    // 流程
    var chips = [['地下城', P.fireLight], ['遊行', P.rep], ['商店', P.player]];
    for (var c = 0; c < 3; c++) {
      var cx = 90 + c * 150;
      rr(ctx, cx - 52, 412, 104, 44, 14);
      ctx.fillStyle = P.panel; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = chips[c][1]; ctx.stroke();
      txt(ctx, chips[c][0], cx, 435, 22, chips[c][1], 'center', true, true);
      if (c < 2) arrowHead(ctx, cx + 75, 434, 0, 10, P.textDim);
    }
    txt(ctx, '× 3 天', 486, 434, 22, P.text, 'center', true);
    starPath(ctx, 552, 434, 17); ctx.fillStyle = P.rep; ctx.fill();
    txt(ctx, '評星', 600, 434, 22, P.rep, 'center', true);
  }

  window.Art = Art;
})();
