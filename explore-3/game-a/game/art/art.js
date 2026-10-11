// 怒火連鎖馴獸場 — 美術(Canvas 2D 幾何繪製, 無外部資源)
// 全域物件 window.Art; 所有 x,y 為物件中心(drawButton 為左上角)
(function () {
  'use strict';

  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC","Heiti TC",sans-serif';

  var palette = {
    bg: '#120f18',
    hudBg: '#0c0a11',
    hudLine: '#3a3346',
    text: '#f4efe6',
    textDim: '#a49cb2',
    ink: '#0d0b12',          // 深色描邊 / 襯底
    player: '#3fcf6e',       // 馴獸師 = 玩家方 / 玩家可做的事(收服、制伏、可按)
    playerDark: '#1f7a3e',
    skin: '#f2c79a',
    whip: '#fff1cf',         // 甩鞭範圍(奶白, 不填色)
    rope: '#c8955a',
    // 魔物種類色(也是牠技能的色)
    fire: '#ff5a36',
    water: '#46b4ff',
    thunder: '#ffd83f',
    stone: '#b29ae6',
    // 地形
    wall: '#1c1923',
    wallTop: '#2e2a38',
    pillar: '#6f6a7c',
    lava: '#ff6a1a',
    lavaHot: '#ffc23a',
    water2: '#1d4a86',
    zoneCrag: '#323b4b',
    zoneRuins: '#4a4233',
    zoneLava: '#432b2a',
    zonePond: '#25403f',
    zoneHall: '#302d36',
    // 表演場
    sand: '#6b5640',
    sandLine: '#7d6750',
    stand: '#3a2836',
    standRow: '#4a3344',
    fenceWood: '#a8784a',
    fenceDark: '#5a3c22',
    // 讀數
    gold: '#ffcf3a',
    rep: '#ff74cf',
    danger: '#ff3b3b',
    heart: '#ff4a5e',
    rageCalm: '#8fa3bd',
    rageHot: '#ffa53a',
    rageMax: '#ff3b3b',
    hpBar: '#f0ebe0',
    btn: '#f3dfa8',
    btnText: '#2a1d10',
    card: '#262030',
  };

  var SPECIES_NAME = { fire: '火蜥蜴', water: '水母', thunder: '雷鳥', stone: '石像鬼' };
  var ZONE_FLOOR = { crag: palette.zoneCrag, ruins: palette.zoneRuins, lava: palette.zoneLava, pond: palette.zonePond, hall: palette.zoneHall };
  var ZONE_SPECIES = { crag: 'thunder', ruins: 'stone', lava: 'fire', pond: 'water', hall: null };
  var HAZARD_COLOR = { firering: palette.fire, waterball: '#8fe0ff', thunder: palette.thunder, quake: palette.stone };
  var HAZARD_WARN = { firering: 0.5, thunder: 0.8, quake: 0, waterball: 0 };
  var SHIRTS = ['#7d8aa8', '#a07d9a', '#7da08a', '#a8987d', '#8a7da8', '#a88a7d'];

  function now() { return (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) / 1000; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }

  // ---------- 共用小工具 ----------
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

  function txt(ctx, s, x, y, o) {
    o = o || {};
    var size = o.size || 20;
    ctx.font = (o.weight || 'bold') + ' ' + size + 'px ' + FONT;
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.base || 'middle';
    if (o.stroke !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = o.strokeW || Math.max(3, size / 5);
      ctx.strokeStyle = o.strokeColor || palette.ink;
      ctx.strokeText(String(s), x, y);
    }
    ctx.fillStyle = o.color || palette.text;
    ctx.fillText(String(s), x, y);
  }

  function starPath(ctx, cx, cy, r) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var rad = i % 2 === 0 ? r : r * 0.45;
      var px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function drawStar(ctx, cx, cy, r, filled) {
    starPath(ctx, cx, cy, r);
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1.5, r * 0.28);
    ctx.strokeStyle = palette.ink;
    ctx.stroke();
    ctx.fillStyle = filled ? palette.gold : '#3a3446';
    ctx.fill();
  }

  function heartPath(ctx, cx, cy, s) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.9);
    ctx.bezierCurveTo(cx - s * 1.3, cy, cx - s * 0.9, cy - s * 1.0, cx, cy - s * 0.35);
    ctx.bezierCurveTo(cx + s * 0.9, cy - s * 1.0, cx + s * 1.3, cy, cx, cy + s * 0.9);
    ctx.closePath();
  }

  function coinIcon(ctx, cx, cy, r) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = palette.gold; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.22); ctx.strokeStyle = palette.ink; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(1, r * 0.14); ctx.strokeStyle = '#b8861a'; ctx.stroke();
  }

  function repIcon(ctx, cx, cy, r) {
    // 名聲: 洋紅菱形徽章 + 白色小星
    ctx.beginPath();
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath();
    ctx.fillStyle = palette.rep; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.2); ctx.strokeStyle = palette.ink; ctx.stroke();
    starPath(ctx, cx, cy, r * 0.5); ctx.fillStyle = '#fff'; ctx.fill();
  }

  function ropeIcon(ctx, cx, cy, r, filled) {
    ctx.lineCap = 'round';
    if (filled) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.lineWidth = r * 0.7; ctx.strokeStyle = palette.ink; ctx.stroke();
      ctx.lineWidth = r * 0.42; ctx.strokeStyle = palette.rope; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
      ctx.lineWidth = r * 0.3; ctx.strokeStyle = palette.rope; ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.setLineDash([3, 3]); ctx.lineWidth = 2; ctx.strokeStyle = '#5a5266'; ctx.stroke(); ctx.setLineDash([]);
    }
  }

  function checkBadge(ctx, cx, cy, r) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = palette.player; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = palette.ink; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - r * 0.45, cy); ctx.lineTo(cx - r * 0.1, cy + r * 0.38); ctx.lineTo(cx + r * 0.5, cy - r * 0.35);
    ctx.lineWidth = r * 0.28; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#fff'; ctx.stroke();
  }

  function crossBadge(ctx, cx, cy, r) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = palette.danger; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = palette.ink; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.4, cy - r * 0.4); ctx.lineTo(cx + r * 0.4, cy + r * 0.4);
    ctx.moveTo(cx + r * 0.4, cy - r * 0.4); ctx.lineTo(cx - r * 0.4, cy + r * 0.4);
    ctx.lineWidth = r * 0.28; ctx.lineCap = 'round'; ctx.strokeStyle = '#fff'; ctx.stroke();
  }

  function shadow(ctx, y, rx, ry) {
    ctx.beginPath(); ctx.ellipse(0, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
  }

  function mix(hex, other, k) {
    var a = parseInt(hex.slice(1), 16), b = parseInt(other.slice(1), 16);
    var r = Math.round(((a >> 16) & 255) * (1 - k) + ((b >> 16) & 255) * k);
    var g = Math.round(((a >> 8) & 255) * (1 - k) + ((b >> 8) & 255) * k);
    var bl = Math.round((a & 255) * (1 - k) + (b & 255) * k);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }

  // ---------- 魔物本體(四種外形, 原點為身體中心, 半徑約 r) ----------
  // o: { dir, mood: 'calm'|'angry'|'weak'|'loose', flash, pale }
  function eyes(ctx, ex, ey, s, dir, mood) {
    var sep = s * 1.3;
    var pts = [ex - sep / 2 + dir * s * 0.3, ex + sep / 2 + dir * s * 0.3];
    for (var i = 0; i < 2; i++) {
      var px = pts[i];
      if (mood === 'weak') {
        ctx.beginPath(); ctx.arc(px, ey, s * 0.45, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.lineWidth = Math.max(1.5, s * 0.25); ctx.strokeStyle = palette.ink; ctx.lineCap = 'round'; ctx.stroke();
        continue;
      }
      ctx.beginPath(); ctx.arc(px, ey, s * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = mood === 'loose' ? '#ffe0e0' : '#fff'; ctx.fill();
      ctx.lineWidth = Math.max(1, s * 0.15); ctx.strokeStyle = palette.ink; ctx.stroke();
      ctx.beginPath(); ctx.arc(px + dir * s * 0.15, ey + s * 0.05, s * 0.26, 0, Math.PI * 2);
      ctx.fillStyle = mood === 'loose' ? palette.danger : palette.ink; ctx.fill();
      if (mood === 'angry' || mood === 'loose') {
        var inner = (i === 0) ? 1 : -1; // 眉毛往內下壓
        ctx.beginPath();
        ctx.moveTo(px - s * 0.6 * inner, ey - s * 0.85);
        ctx.lineTo(px + s * 0.5 * inner, ey - s * 0.45);
        ctx.lineWidth = Math.max(2, s * 0.3); ctx.lineCap = 'round'; ctx.strokeStyle = palette.ink; ctx.stroke();
      }
    }
  }

  function bodyColor(species, o) {
    var c = palette[species] || '#999';
    if (o.flash) return '#ffffff';
    if (o.pale) return mix(c, '#8a8494', 0.55);
    return c;
  }

  function drawSpeciesBody(ctx, species, r, o) {
    o = o || {};
    var dir = o.dir === -1 ? -1 : 1;
    var c = bodyColor(species, o);
    var dark = o.flash ? '#e8e8e8' : mix(c, '#000000', 0.35);
    var light = o.flash ? '#ffffff' : mix(c, '#ffffff', 0.45);
    var mood = o.mood || 'calm';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    var OL = Math.max(2, r * 0.11);

    if (species === 'fire') {
      // 尾巴 + 尾火
      ctx.beginPath();
      ctx.moveTo(-dir * r * 0.6, r * 0.2);
      ctx.quadraticCurveTo(-dir * r * 1.1, r * 0.25, -dir * r * 0.95, -r * 0.3);
      ctx.lineWidth = r * 0.3 + OL * 2; ctx.strokeStyle = palette.ink; ctx.stroke();
      ctx.lineWidth = r * 0.3; ctx.strokeStyle = c; ctx.stroke();
      ctx.beginPath();
      var fx = -dir * r * 0.95, fy = -r * 0.42;
      ctx.moveTo(fx, fy - r * 0.38);
      ctx.quadraticCurveTo(fx + r * 0.25, fy, fx, fy + r * 0.14);
      ctx.quadraticCurveTo(fx - r * 0.25, fy, fx, fy - r * 0.38);
      ctx.fillStyle = o.flash ? '#fff' : palette.lavaHot; ctx.fill();
      ctx.lineWidth = OL * 0.8; ctx.strokeStyle = palette.ink; ctx.stroke();
      // 腳
      ctx.fillStyle = dark;
      [-0.5, -0.15, 0.2, 0.5].forEach(function (k) {
        ctx.beginPath(); ctx.ellipse(k * r, r * 0.62, r * 0.13, r * 0.12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = OL * 0.7; ctx.strokeStyle = palette.ink; ctx.stroke();
      });
      // 身體
      ctx.beginPath(); ctx.ellipse(0, r * 0.2, r * 0.78, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = OL; ctx.strokeStyle = palette.ink; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, r * 0.38, r * 0.55, r * 0.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = light; ctx.fill();
      ctx.fillStyle = dark;
      [[-0.3, 0.02], [0.05, -0.05], [-0.05, 0.15]].forEach(function (p) {
        ctx.beginPath(); ctx.arc(p[0] * r * dir, p[1] * r, r * 0.08, 0, Math.PI * 2); ctx.fill();
      });
      // 頭
      ctx.beginPath(); ctx.arc(dir * r * 0.55, -r * 0.18, r * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = OL; ctx.strokeStyle = palette.ink; ctx.stroke();
      eyes(ctx, dir * r * 0.6, -r * 0.26, r * 0.22, dir, mood);
    } else if (species === 'water') {
      // 觸手
      for (var i = 0; i < 4; i++) {
        var tx = (-0.45 + i * 0.3) * r;
        ctx.beginPath(); ctx.moveTo(tx, r * 0.15);
        ctx.quadraticCurveTo(tx + r * 0.15, r * 0.45, tx, r * 0.6);
        ctx.quadraticCurveTo(tx - r * 0.15, r * 0.75, tx, r * 0.9);
        ctx.lineWidth = r * 0.13 + OL * 1.6; ctx.strokeStyle = palette.ink; ctx.stroke();
        ctx.lineWidth = r * 0.13; ctx.strokeStyle = dark; ctx.stroke();
      }
      // 傘
      ctx.beginPath();
      ctx.moveTo(-r * 0.85, r * 0.2);
      ctx.bezierCurveTo(-r * 0.9, -r * 0.95, r * 0.9, -r * 0.95, r * 0.85, r * 0.2);
      for (var k = 0; k < 4; k++) {
        var x0 = r * 0.85 - k * r * 0.425;
        ctx.quadraticCurveTo(x0 - r * 0.21, r * 0.38, x0 - r * 0.425, r * 0.2);
      }
      ctx.closePath();
      ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = OL; ctx.strokeStyle = palette.ink; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.4, r * 0.22, r * 0.12, -0.5, 0, Math.PI * 2);
      ctx.fillStyle = light; ctx.fill();
      eyes(ctx, 0, -r * 0.05, r * 0.22, dir, mood);
    } else if (species === 'thunder') {
      // 尾羽
      ctx.beginPath();
      ctx.moveTo(-dir * r * 0.55, r * 0.0);
      ctx.lineTo(-dir * r * 1.0, -r * 0.25);
      ctx.lineTo(-dir * r * 0.85, r * 0.1);
      ctx.lineTo(-dir * r * 1.0, r * 0.35);
      ctx.lineTo(-dir * r * 0.55, r * 0.3);
      ctx.closePath();
      ctx.fillStyle = dark; ctx.fill(); ctx.lineWidth = OL; ctx.strokeStyle = palette.ink; ctx.stroke();
      // 冠羽(閃電鋸齒)
      ctx.beginPath();
      ctx.moveTo(-r * 0.25, -r * 0.6);
      ctx.lineTo(-r * 0.15, -r * 0.98);
      ctx.lineTo(r * 0.0, -r * 0.72);
      ctx.lineTo(r * 0.12, -r * 1.0);
      ctx.lineTo(r * 0.25, -r * 0.6);
      ctx.closePath();
      ctx.fillStyle = o.flash ? '#fff' : '#4a6cff'; ctx.fill(); ctx.lineWidth = OL * 0.8; ctx.strokeStyle = palette.ink; ctx.stroke();
      // 腳
      ctx.beginPath(); ctx.moveTo(-r * 0.2, r * 0.6); ctx.lineTo(-r * 0.2, r * 0.85); ctx.moveTo(r * 0.2, r * 0.6); ctx.lineTo(r * 0.2, r * 0.85);
      ctx.lineWidth = OL * 1.2; ctx.strokeStyle = '#e88a2a'; ctx.stroke();
      // 身體
      ctx.beginPath(); ctx.arc(0, r * 0.05, r * 0.68, 0, Math.PI * 2);
      ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = OL; ctx.strokeStyle = palette.ink; ctx.stroke();
      // 翅
      ctx.beginPath(); ctx.ellipse(-dir * r * 0.15, r * 0.2, r * 0.38, r * 0.24, dir * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = dark; ctx.fill(); ctx.lineWidth = OL * 0.8; ctx.strokeStyle = palette.ink; ctx.stroke();
      // 喙
      ctx.beginPath(); ctx.moveTo(dir * r * 0.6, -r * 0.12); ctx.lineTo(dir * r * 0.95, -r * 0.02); ctx.lineTo(dir * r * 0.6, r * 0.1); ctx.closePath();
      ctx.fillStyle = '#ff9a2a'; ctx.fill(); ctx.lineWidth = OL * 0.8; ctx.strokeStyle = palette.ink; ctx.stroke();
      eyes(ctx, dir * r * 0.18, -r * 0.18, r * 0.22, dir, mood);
    } else { // stone 石像鬼
      // 翅膀
      for (var sd = -1; sd <= 1; sd += 2) {
        ctx.beginPath();
        ctx.moveTo(sd * r * 0.5, -r * 0.2);
        ctx.lineTo(sd * r * 0.98, -r * 0.55);
        ctx.lineTo(sd * r * 0.9, -r * 0.1);
        ctx.lineTo(sd * r * 0.98, r * 0.15);
        ctx.lineTo(sd * r * 0.55, r * 0.2);
        ctx.closePath();
        ctx.fillStyle = dark; ctx.fill(); ctx.lineWidth = OL; ctx.strokeStyle = palette.ink; ctx.stroke();
      }
      // 角
      for (var sh = -1; sh <= 1; sh += 2) {
        ctx.beginPath(); ctx.moveTo(sh * r * 0.35, -r * 0.55); ctx.lineTo(sh * r * 0.5, -r * 0.92); ctx.lineTo(sh * r * 0.15, -r * 0.6); ctx.closePath();
        ctx.fillStyle = light; ctx.fill(); ctx.lineWidth = OL * 0.8; ctx.strokeStyle = palette.ink; ctx.stroke();
      }
      // 身體(方墩)
      rr(ctx, -r * 0.6, -r * 0.62, r * 1.2, r * 1.42, r * 0.28);
      ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = OL; ctx.strokeStyle = palette.ink; ctx.stroke();
      // 裂紋
      ctx.beginPath(); ctx.moveTo(-r * 0.35, r * 0.25); ctx.lineTo(-r * 0.15, r * 0.4); ctx.lineTo(-r * 0.25, r * 0.6);
      ctx.moveTo(r * 0.3, r * 0.1); ctx.lineTo(r * 0.4, r * 0.35);
      ctx.lineWidth = OL * 0.6; ctx.strokeStyle = dark; ctx.stroke();
      // 腳
      ctx.fillStyle = dark;
      rr(ctx, -r * 0.5, r * 0.72, r * 0.35, r * 0.18, r * 0.06); ctx.fill();
      rr(ctx, r * 0.15, r * 0.72, r * 0.35, r * 0.18, r * 0.06); ctx.fill();
      eyes(ctx, 0, -r * 0.2, r * 0.22, dir, mood);
      // 嘴
      ctx.beginPath(); ctx.moveTo(-r * 0.2, r * 0.12); ctx.lineTo(r * 0.2, r * 0.12);
      ctx.lineWidth = OL * 0.8; ctx.strokeStyle = palette.ink; ctx.stroke();
    }
  }

  // ---------- 背景 ----------
  function drawBackground(ctx) {
    ctx.save();
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, 720, 1280);
    ctx.restore();
  }

  // ---------- 地圖格 ----------
  function drawTile(ctx, s) {
    ctx.save();
    var x = num(s.x, 30) - 30, y = num(s.y, 30) - 30;
    var kind = s.kind || 'floor';
    var zone = s.zone || 'hall';
    var floor = ZONE_FLOOR[zone] || palette.zoneHall;
    var seed = ((Math.floor(x / 60) * 73856093) ^ (Math.floor(y / 60) * 19349663)) >>> 0;
    function rnd(i) { var v = Math.sin(seed * 0.0001 + i * 12.9898) * 43758.5453; return v - Math.floor(v); }

    if (kind === 'wall') {
      ctx.fillStyle = palette.wall; ctx.fillRect(x, y, 60, 60);
      ctx.fillStyle = palette.wallTop; ctx.fillRect(x, y, 60, 8);
      ctx.strokeStyle = '#121017'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + 30); ctx.lineTo(x + 60, y + 30);
      ctx.moveTo(x + 30, y + 8); ctx.lineTo(x + 30, y + 30);
      ctx.moveTo(x + 15, y + 30); ctx.lineTo(x + 15, y + 60);
      ctx.moveTo(x + 45, y + 30); ctx.lineTo(x + 45, y + 60);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // 地板底(含石柱、巢穴底)
    if (kind === 'lava') {
      ctx.fillStyle = palette.lava; ctx.fillRect(x, y, 60, 60);
      var p = 0.5 + 0.5 * Math.sin(now() * 3 + seed % 7);
      ctx.fillStyle = 'rgba(255,214,90,' + (0.35 + 0.35 * p).toFixed(2) + ')';
      ctx.beginPath(); ctx.ellipse(x + 20 + rnd(1) * 20, y + 22 + rnd(2) * 16, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 15 + rnd(3) * 30, y + 40 + rnd(4) * 10, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8a2a0e'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 12 + rnd(5) * 10); ctx.lineTo(x + 22, y + 18 + rnd(6) * 8); ctx.lineTo(x + 34, y + 8);
      ctx.moveTo(x + 40, y + 52); ctx.lineTo(x + 52, y + 36 + rnd(7) * 8);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (kind === 'water') {
      ctx.fillStyle = palette.water2; ctx.fillRect(x, y, 60, 60);
      ctx.strokeStyle = 'rgba(150,200,255,0.45)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      var ph = now() * 1.5 + rnd(1) * 6;
      for (var w = 0; w < 3; w++) {
        var wy = y + 14 + w * 16, wx = x + 8 + ((w * 17 + Math.sin(ph + w) * 4) % 20);
        ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 7, wy - 5, wx + 14, wy); ctx.quadraticCurveTo(wx + 21, wy + 5, wx + 28, wy); ctx.stroke();
      }
      ctx.restore();
      return;
    }

    ctx.fillStyle = floor; ctx.fillRect(x, y, 60, 60);
    // 區域紋理(低對比)
    var line = mix(floor, '#000000', 0.25), hi = mix(floor, '#ffffff', 0.08);
    ctx.lineWidth = 1.5; ctx.strokeStyle = line; ctx.lineCap = 'round';
    ctx.beginPath();
    if (zone === 'crag') {
      ctx.moveTo(x + 8 + rnd(1) * 10, y + 10 + rnd(2) * 10); ctx.lineTo(x + 24 + rnd(3) * 8, y + 22 + rnd(4) * 8); ctx.lineTo(x + 30 + rnd(5) * 10, y + 40);
      ctx.moveTo(x + 40, y + 12 + rnd(6) * 10); ctx.lineTo(x + 52, y + 26);
    } else if (zone === 'ruins') {
      ctx.rect(x + 2, y + 2, 26, 26); ctx.rect(x + 32, y + 2, 26, 26); ctx.rect(x + 2, y + 32, 26, 26); ctx.rect(x + 32, y + 32, 26, 26);
    } else if (zone === 'lava') {
      ctx.moveTo(x + 6, y + 50); ctx.lineTo(x + 26, y + 44 + rnd(1) * 8); ctx.lineTo(x + 54, y + 52);
    } else if (zone === 'pond') {
      ctx.arc(x + 20 + rnd(1) * 20, y + 20 + rnd(2) * 20, 6, 0, Math.PI * 2);
    } else {
      ctx.moveTo(x, y + 59); ctx.lineTo(x + 60, y + 59); ctx.moveTo(x + 59, y); ctx.lineTo(x + 59, y + 60);
    }
    ctx.stroke();
    if (zone === 'lava') {
      ctx.fillStyle = 'rgba(255,120,40,0.35)';
      ctx.beginPath(); ctx.arc(x + 10 + rnd(8) * 40, y + 10 + rnd(9) * 30, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = hi; ctx.fillRect(x, y, 60, 2);

    if (s.nest) {
      var sp = ZONE_SPECIES[zone];
      var nc = sp ? palette[sp] : '#c8b48a';
      ctx.beginPath(); ctx.ellipse(x + 30, y + 34, 24, 15, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
      ctx.setLineDash([5, 4]); ctx.lineWidth = 4; ctx.strokeStyle = '#b89a5e'; ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.ellipse(x + 30, y + 34, 24, 15, 0, 0, Math.PI * 2);
      ctx.lineWidth = 1.5; ctx.strokeStyle = nc; ctx.globalAlpha = 0.7; ctx.stroke(); ctx.globalAlpha = 1;
    }

    if (kind === 'pillar') {
      ctx.beginPath(); ctx.ellipse(x + 30, y + 46, 24, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
      ctx.beginPath(); ctx.arc(x + 30, y + 30, 25, 0, Math.PI * 2);
      ctx.fillStyle = palette.pillar; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = palette.ink; ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 30, y + 30, 16, 0, Math.PI * 2);
      ctx.fillStyle = mix(palette.pillar, '#ffffff', 0.18); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 25, y + 24, 5, 0, Math.PI * 2);
      ctx.fillStyle = mix(palette.pillar, '#ffffff', 0.4); ctx.fill();
    }
    ctx.restore();
  }

  // ---------- 馴獸師 ----------
  function tamerBody(ctx, dir, stunned) {
    // 斗篷
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.quadraticCurveTo(17, -4, 17, 18);
    ctx.lineTo(-17, 18);
    ctx.quadraticCurveTo(-17, -4, 0, -8);
    ctx.closePath();
    ctx.fillStyle = stunned ? mix(palette.player, '#8a8494', 0.5) : palette.player; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = palette.ink; ctx.stroke();
    ctx.fillStyle = palette.playerDark; ctx.fillRect(-17, 12, 34, 4);
    // 鞭子(握在前手, 捲起)
    ctx.beginPath(); ctx.arc(dir * 15, 6, 6, 0, Math.PI * 2);
    ctx.lineWidth = 5; ctx.strokeStyle = palette.ink; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#a0682e'; ctx.stroke();
    // 頭
    ctx.beginPath(); ctx.arc(0, -14, 10, 0, Math.PI * 2);
    ctx.fillStyle = palette.skin; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = palette.ink; ctx.stroke();
    // 帽子
    ctx.beginPath(); ctx.ellipse(0, -21, 15, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#7a4a24'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
    rr(ctx, -8, -31, 16, 10, 3); ctx.fill(); ctx.stroke();
    // 眼
    if (stunned) {
      ctx.lineWidth = 2; ctx.strokeStyle = palette.ink;
      for (var i = -1; i <= 1; i += 2) {
        var ex = dir * 3 + i * 4;
        ctx.beginPath(); ctx.moveTo(ex - 2, -15); ctx.lineTo(ex + 2, -11); ctx.moveTo(ex + 2, -15); ctx.lineTo(ex - 2, -11); ctx.stroke();
      }
    } else {
      ctx.fillStyle = palette.ink;
      ctx.beginPath(); ctx.arc(dir * 3 - 3, -13, 1.8, 0, Math.PI * 2); ctx.arc(dir * 3 + 4, -13, 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawTamer(ctx, s) {
    ctx.save();
    ctx.translate(num(s.x, 0), num(s.y, 0));
    var dir = s.dir === -1 ? -1 : 1;
    var t = now();
    if (s.blink && Math.floor(t * 12) % 2 === 0) ctx.globalAlpha = 0.35;
    shadow(ctx, 20, 18, 6);
    // 玩家方標記: 腳下綠色實線環(判定半徑 18)
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(63,207,110,0.55)'; ctx.stroke();
    tamerBody(ctx, dir, !!s.stunned);
    if (s.stunned) {
      for (var i = 0; i < 3; i++) {
        var a = t * 5 + i * Math.PI * 2 / 3;
        drawStar(ctx, Math.cos(a) * 15, -25 + Math.sin(a) * 2, 4.5, true);
      }
    }
    ctx.globalAlpha = 1;
    var sp = clamp(num(s.subdueProgress, 0), 0, 1);
    if (sp > 0) {
      ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(13,11,18,0.75)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 28, -Math.PI / 2, -Math.PI / 2 + sp * Math.PI * 2);
      ctx.lineWidth = 4; ctx.strokeStyle = palette.player; ctx.lineCap = 'round'; ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 地下城野生魔物 ----------
  function drawWildMonster(ctx, s) {
    ctx.save();
    ctx.translate(num(s.x, 0), num(s.y, 0));
    var species = s.species || 'fire';
    var dir = s.dir === -1 ? -1 : 1;
    var t = now();
    var maxHp = Math.max(1, num(s.maxHp, 1));
    var ratio = clamp(num(s.hp, maxHp) / maxHp, 0, 1);
    var weak = !!s.weak;

    shadow(ctx, 32, 24, 6);
    if (s.casting && !weak) {
      var p = 0.5 + 0.5 * Math.sin(t * 18);
      ctx.beginPath(); ctx.arc(0, 4, 34 + p * 3, 0, Math.PI * 2);
      ctx.fillStyle = palette[species]; ctx.globalAlpha = 0.25 + p * 0.2; ctx.fill(); ctx.globalAlpha = 1;
      ctx.lineWidth = 3; ctx.strokeStyle = palette[species]; ctx.stroke();
    }
    if (weak) {
      // 可收服: 玩家色虛線環, 慢轉
      ctx.save();
      ctx.rotate(t * 1.2);
      ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.setLineDash([8, 6]); ctx.lineWidth = 6; ctx.strokeStyle = palette.ink; ctx.stroke();
      ctx.lineWidth = 3.5; ctx.strokeStyle = palette.player; ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }
    ctx.save();
    ctx.translate(0, 4 + (weak ? 3 : 0));
    drawSpeciesBody(ctx, species, 28, { dir: dir, mood: weak ? 'weak' : (s.casting ? 'angry' : 'calm'), flash: !!s.hit, pale: weak });
    if (weak) {
      // 汗滴
      ctx.beginPath(); ctx.moveTo(-dir * 18, -22); ctx.quadraticCurveTo(-dir * 23, -14, -dir * 18, -11); ctx.quadraticCurveTo(-dir * 13, -14, -dir * 18, -22);
      ctx.fillStyle = '#bfe6ff'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = palette.ink; ctx.stroke();
    }
    ctx.restore();

    // 血條(頂端, 在 90 框內)
    var bw = 56, bx = -28, by = -43;
    rr(ctx, bx - 2, by - 2, bw + 4, 10, 4); ctx.fillStyle = palette.ink; ctx.fill();
    ctx.fillStyle = '#3a3446'; ctx.fillRect(bx, by, bw, 6);
    ctx.fillStyle = weak ? palette.player : palette.hpBar; ctx.fillRect(bx, by, bw * ratio, 6);
    // 30% 刻度
    ctx.fillStyle = palette.ink; ctx.fillRect(bx + bw * 0.3 - 1, by, 2, 6);
    ctx.restore();
  }

  // ---------- 技能 ----------
  function drawHazard(ctx, s) {
    ctx.save();
    ctx.translate(num(s.x, 0), num(s.y, 0));
    var kind = s.kind || 'firering';
    var col = HAZARD_COLOR[kind] || palette.danger;
    var t = Math.max(0, num(s.t, 0));
    var warn = s.phase === 'warn';
    var R = Math.max(0, num(s.radius, kind === 'firering' ? 120 : kind === 'thunder' ? 70 : 0));

    if (kind === 'waterball') {
      var ang = num(s.angle, 0);
      ctx.rotate(ang);
      // 尾跡(在球後方)
      var g = ctx.createLinearGradient(-34, 0, 0, 0);
      g.addColorStop(0, 'rgba(143,224,255,0)'); g.addColorStop(1, 'rgba(143,224,255,0.55)');
      ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-4, -9); ctx.lineTo(-4, 9); ctx.closePath();
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fillStyle = palette.water; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = palette.ink; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
      ctx.lineWidth = 2; ctx.strokeStyle = '#e8f8ff'; ctx.stroke();
      ctx.beginPath(); ctx.arc(3, -4, 3.5, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.restore();
      return;
    }

    if (kind === 'quake') {
      var outer = R, inner = Math.max(0, R - 30);
      if (outer <= 0) { ctx.restore(); return; }
      ctx.beginPath(); ctx.arc(0, 0, outer, 0, Math.PI * 2); ctx.arc(0, 0, inner, 0, Math.PI * 2, true);
      ctx.fillStyle = col; ctx.globalAlpha = warn ? 0.18 : 0.55; ctx.fill('evenodd'); ctx.globalAlpha = 1;
      if (warn) ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.arc(0, 0, outer - 2, 0, Math.PI * 2);
      ctx.lineWidth = 5; ctx.strokeStyle = palette.ink; ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = warn ? col : '#ffffff'; ctx.stroke();
      if (inner > 2) {
        ctx.beginPath(); ctx.arc(0, 0, inner + 1, 0, Math.PI * 2);
        ctx.lineWidth = 2; ctx.strokeStyle = mix(col, '#000000', 0.3); ctx.stroke();
      }
      ctx.setLineDash([]);
      // 碎石(在環帶內)
      if (!warn && outer > 20) {
        ctx.fillStyle = mix(col, '#000000', 0.45);
        for (var i = 0; i < 10; i++) {
          var a = i * Math.PI / 5 + 0.3;
          var rr2 = (inner + outer) / 2;
          ctx.fillRect(Math.cos(a) * rr2 - 3, Math.sin(a) * rr2 - 3, 6, 6);
        }
      }
      ctx.restore();
      return;
    }

    if (R <= 0) { ctx.restore(); return; }
    var wd = HAZARD_WARN[kind] || 0.5;
    if (warn) {
      var k = clamp(t / wd, 0, 1);
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(13,11,18,0.22)'; ctx.fill();
      // 由中心長大的填色, 長滿 = 生效
      ctx.beginPath(); ctx.arc(0, 0, R * k, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.globalAlpha = 0.3; ctx.fill(); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(0, 0, R - 2, 0, Math.PI * 2);
      ctx.lineWidth = 5; ctx.strokeStyle = palette.ink; ctx.stroke();
      ctx.setLineDash([12, 8]); ctx.lineDashOffset = -t * 40;
      ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke(); ctx.setLineDash([]);
      if (kind === 'thunder') {
        // 準星
        ctx.beginPath();
        ctx.moveTo(-R * 0.35, 0); ctx.lineTo(R * 0.35, 0); ctx.moveTo(0, -R * 0.35); ctx.lineTo(0, R * 0.35);
        ctx.lineWidth = 4; ctx.strokeStyle = palette.ink; ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // 生效
    var flick = 0.5 + 0.5 * Math.sin(now() * 30);
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = col; ctx.globalAlpha = 0.5 + 0.1 * flick; ctx.fill(); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(0, 0, R - 2, 0, Math.PI * 2);
    ctx.lineWidth = 5; ctx.strokeStyle = palette.ink; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    if (kind === 'firering') {
      // 內緣火舌(朝內, 在圓內)
      var n = Math.max(10, Math.round(R / 8));
      ctx.beginPath();
      for (var j = 0; j < n; j++) {
        var a0 = j / n * Math.PI * 2, a1 = (j + 0.5) / n * Math.PI * 2, a2 = (j + 1) / n * Math.PI * 2;
        var depth = R * (0.18 + 0.08 * Math.sin(now() * 12 + j));
        ctx.moveTo(Math.cos(a0) * (R - 3), Math.sin(a0) * (R - 3));
        ctx.lineTo(Math.cos(a1) * (R - 3 - depth), Math.sin(a1) * (R - 3 - depth));
        ctx.lineTo(Math.cos(a2) * (R - 3), Math.sin(a2) * (R - 3));
      }
      ctx.fillStyle = palette.lavaHot; ctx.fill();
    } else if (kind === 'thunder') {
      ctx.beginPath();
      ctx.moveTo(-R * 0.15, -R * 0.95);
      ctx.lineTo(R * 0.2, -R * 0.3);
      ctx.lineTo(-R * 0.1, -R * 0.2);
      ctx.lineTo(R * 0.15, R * 0.5);
      ctx.lineTo(-R * 0.25, -R * 0.05);
      ctx.lineTo(R * 0.02, -R * 0.12);
      ctx.closePath();
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = palette.ink; ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 甩鞭範圍 ----------
  function drawWhipCrack(ctx, s) {
    ctx.save();
    ctx.translate(num(s.x, 0), num(s.y, 0));
    var R = Math.max(1, num(s.radius, 110));
    var t = Math.max(0, num(s.t, 0));
    var life = 0.3;
    var a = clamp(1 - t / life, 0, 1);
    if (a <= 0) { ctx.restore(); return; }
    ctx.globalAlpha = a;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,241,207,0.08)'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, R - 1.5, 0, Math.PI * 2);
    ctx.lineWidth = 4; ctx.strokeStyle = palette.ink; ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = palette.whip; ctx.stroke();
    // 掃過的鞭梢弧(順時針一圈)
    var k = clamp(t / 0.15, 0, 1);
    var end = -Math.PI / 2 + k * Math.PI * 2;
    ctx.beginPath(); ctx.arc(0, 0, R - 4, end - 1.1, end);
    ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.strokeStyle = palette.whip; ctx.stroke();
    // 鞭梢爆點
    var bx = Math.cos(end) * (R - 4), by = Math.sin(end) * (R - 4);
    ctx.beginPath();
    for (var i = 0; i < 4; i++) {
      var aa = i * Math.PI / 2 + Math.PI / 4;
      ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(aa) * 7, by + Math.sin(aa) * 7);
    }
    ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }

  // ---------- 表演場 ----------
  function drawShowArena(ctx) {
    ctx.save();
    ctx.fillStyle = '#18121c'; ctx.fillRect(0, 0, 720, 1280);
    // 觀眾席(上 130~250, 下 1020~1140)
    [[130, 250], [1020, 1140]].forEach(function (b) {
      ctx.fillStyle = palette.stand; ctx.fillRect(20, b[0], 680, b[1] - b[0]);
      ctx.fillStyle = palette.standRow;
      for (var ry = b[0] + 20; ry < b[1]; ry += 40) ctx.fillRect(20, ry, 680, 8);
      ctx.lineWidth = 2; ctx.strokeStyle = '#2a1c28'; ctx.strokeRect(20, b[0], 680, b[1] - b[0]);
    });
    // 場地 x 60~660, y 270~1000
    ctx.fillStyle = palette.sand; ctx.fillRect(60, 270, 600, 730);
    ctx.strokeStyle = palette.sandLine; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(360, 635, 220, 260, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(360, 635, 80, 95, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 6; ctx.strokeStyle = '#3e2f22'; ctx.strokeRect(60, 270, 600, 730);
    ctx.restore();
  }

  function rageColor(rage) {
    if (rage >= 100) return palette.rageMax;
    if (rage >= 50) return palette.rageHot;
    return palette.rageCalm;
  }

  function drawShowMonster(ctx, s) {
    ctx.save();
    ctx.translate(num(s.x, 0), num(s.y, 0));
    var species = s.species || 'fire';
    var dir = s.dir === -1 ? -1 : 1;
    var rage = clamp(num(s.rage, 0), 0, 100);
    var mode = s.mode || 'roam';
    var loose = mode === 'charge' || mode === 'loose';
    var star = clamp(Math.round(num(s.star, 1)), 1, 3);
    var t = now();
    var bodyY = 8;

    shadow(ctx, bodyY + 30, 26, 7);

    if (loose) {
      // 失控: 紅色鋸齒外圈(在 100 框內)
      var pulse = 0.5 + 0.5 * Math.sin(t * 14);
      ctx.beginPath();
      var n = 14;
      for (var i = 0; i <= n * 2; i++) {
        var a = i / (n * 2) * Math.PI * 2 + t * 2;
        var rad = i % 2 === 0 ? 41 : 33;
        var px = Math.cos(a) * rad, py = bodyY + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,59,59,' + (0.25 + 0.2 * pulse).toFixed(2) + ')'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = palette.danger; ctx.stroke();
      if (mode === 'charge') {
        // 衝刺煙塵(身後)
        ctx.fillStyle = 'rgba(220,200,180,0.6)';
        for (var d = 0; d < 3; d++) {
          ctx.beginPath(); ctx.arc(-dir * (30 + d * 6), bodyY + 22 - d * 8, 6 - d, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else if (s.performing) {
      // 表演: 種類色光芒(外擴)
      ctx.beginPath(); ctx.arc(0, bodyY, 38, 0, Math.PI * 2);
      ctx.fillStyle = palette[species]; ctx.globalAlpha = 0.3; ctx.fill(); ctx.globalAlpha = 1;
      ctx.beginPath();
      for (var r2 = 0; r2 < 8; r2++) {
        var aa = r2 * Math.PI / 4 + t * 3;
        ctx.moveTo(Math.cos(aa) * 34, bodyY + Math.sin(aa) * 34);
        ctx.lineTo(Math.cos(aa) * 41, bodyY + Math.sin(aa) * 41);
      }
      ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.strokeStyle = palette.ink; ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = palette[species]; ctx.stroke();
    }

    // 被點燃 / 被澆熄(長在身上: 腳下火焰 / 頭上水滴)
    var fx = s.fx || 'none';
    if (!loose && fx === 'ignited') {
      for (var f = -2; f <= 2; f++) {
        var fx0 = f * 12, fy0 = bodyY + 30, fh = 16 + 6 * Math.sin(t * 20 + f);
        ctx.beginPath(); ctx.moveTo(fx0 - 7, fy0); ctx.quadraticCurveTo(fx0 - 5, fy0 - fh * 0.6, fx0, fy0 - fh); ctx.quadraticCurveTo(fx0 + 5, fy0 - fh * 0.6, fx0 + 7, fy0); ctx.closePath();
        ctx.fillStyle = palette.rageHot; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = palette.ink; ctx.stroke();
      }
    }

    ctx.save();
    ctx.translate(0, bodyY);
    var mood = loose ? 'loose' : (rage >= 50 ? 'angry' : 'calm');
    drawSpeciesBody(ctx, species, 30, { dir: dir, mood: mood });
    ctx.restore();

    if (!loose && fx === 'doused') {
      for (var w = -1; w <= 1; w++) {
        var wx = w * 16, wy = bodyY - 14 + ((t * 60 + (w + 1) * 7) % 22);
        ctx.beginPath(); ctx.moveTo(wx, wy - 8); ctx.quadraticCurveTo(wx + 6, wy, wx, wy + 4); ctx.quadraticCurveTo(wx - 6, wy, wx, wy - 8);
        ctx.fillStyle = '#8fe0ff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = palette.ink; ctx.stroke();
      }
    }
    // 快爆了(怒氣 ≥ 80 且未失控): 頭頂冒煙預告
    if (!loose && rage >= 80) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (var sm = 0; sm < 2; sm++) {
        var ph = (t * 1.5 + sm * 0.5) % 1;
        ctx.beginPath(); ctx.arc((sm ? 1 : -1) * 18, -16 - ph * 10, 4 + ph * 3, 0, Math.PI * 2); ctx.fill();
      }
    }

    // 怒氣條(頂端)
    var bw = 72, bx = -36, by = -48;
    rr(ctx, bx - 2, by - 2, bw + 4, 12, 5); ctx.fillStyle = palette.ink; ctx.fill();
    ctx.fillStyle = '#3a3446'; ctx.fillRect(bx, by, bw, 8);
    var rc = rageColor(rage);
    if (rage >= 100 && Math.floor(t * 8) % 2 === 0) rc = '#ffffff';
    ctx.fillStyle = rc; ctx.fillRect(bx, by, bw * rage / 100, 8);
    // 50 門檻刻度
    ctx.fillStyle = '#ffffff'; ctx.fillRect(bx + bw * 0.5 - 1, by - 2, 2, 12);
    // 星級(條下方)
    for (var st = 0; st < star; st++) {
      drawStar(ctx, (st - (star - 1) / 2) * 13, -30, 6, true);
    }
    ctx.restore();
  }

  // ---------- 圍欄 ----------
  function drawFence(ctx, s) {
    ctx.save();
    ctx.translate(num(s.x, 0), num(s.y, 0));
    if (!s.broken) {
      ctx.fillStyle = palette.ink; ctx.fillRect(-50, -6, 100, 12);
      ctx.fillStyle = palette.fenceWood; ctx.fillRect(-49, -4, 98, 8);
      ctx.fillStyle = mix(palette.fenceWood, '#ffffff', 0.25); ctx.fillRect(-49, -4, 98, 2);
      for (var i = -2; i <= 2; i++) {
        rr(ctx, i * 22 - 4, -8, 8, 16, 2);
        ctx.fillStyle = palette.fenceDark; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = palette.ink; ctx.stroke();
      }
    } else {
      // 破損: 中段缺口, 兩端斷木 + 紅色裂痕
      [-1, 1].forEach(function (sd) {
        ctx.beginPath();
        ctx.moveTo(sd * 50, -5); ctx.lineTo(sd * 22, -5); ctx.lineTo(sd * 14, 0); ctx.lineTo(sd * 20, 5); ctx.lineTo(sd * 50, 5); ctx.closePath();
        ctx.fillStyle = mix(palette.fenceWood, '#000000', 0.25); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = palette.ink; ctx.stroke();
        rr(ctx, sd * 40 - 4, -8, 8, 16, 2);
        ctx.fillStyle = palette.fenceDark; ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(-12, -6); ctx.lineTo(-4, 6); ctx.moveTo(12, -6); ctx.lineTo(4, 6);
      ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = palette.danger; ctx.stroke();
      ctx.fillStyle = '#c8a070';
      ctx.fillRect(-6, -2, 4, 3); ctx.fillRect(3, 1, 5, 3);
    }
    ctx.restore();
  }

  // ---------- 觀眾 ----------
  function drawVisitor(ctx, s) {
    ctx.save();
    ctx.translate(num(s.x, 0), num(s.y, 0));
    var seat = Math.abs(Math.round(num(s.seat, 0)));
    var mode = s.mode || 'watch';
    var t = now();
    // 座椅(常駐)
    rr(ctx, -24, 26, 48, 14, 4);
    ctx.fillStyle = '#5a3f52'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = palette.ink; ctx.stroke();
    if (mode === 'empty') {
      rr(ctx, -16, -30, 32, 54, 10);
      ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(200,190,210,0.35)'; ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      return;
    }
    var shirt = SHIRTS[seat % SHIRTS.length];
    var scared = mode === 'scared';
    var lean = scared ? Math.sin(t * 30) * 2 : 0;
    var bob = scared ? 0 : Math.max(0, Math.sin(t * 4 + seat)) * -3;
    ctx.translate(lean, bob);
    // 手
    ctx.lineCap = 'round'; ctx.lineWidth = 6;
    ctx.beginPath();
    if (scared) { ctx.moveTo(-12, -2); ctx.lineTo(-20, -28); ctx.moveTo(12, -2); ctx.lineTo(20, -28); }
    else { ctx.moveTo(-12, 2); ctx.lineTo(-20, 14); ctx.moveTo(12, 2); ctx.lineTo(20, 14); }
    ctx.strokeStyle = palette.ink; ctx.lineWidth = 8; ctx.stroke();
    ctx.strokeStyle = shirt; ctx.lineWidth = 5; ctx.stroke();
    // 身體
    rr(ctx, -14, -6, 28, 34, 9);
    ctx.fillStyle = scared ? mix(shirt, '#ffffff', 0.3) : shirt; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = palette.ink; ctx.stroke();
    // 頭
    ctx.beginPath(); ctx.arc(0, -18, 11, 0, Math.PI * 2);
    ctx.fillStyle = scared ? '#f4ddd0' : '#e8b88a'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = palette.ink;
    if (scared) {
      ctx.beginPath(); ctx.arc(-4, -20, 2, 0, Math.PI * 2); ctx.arc(4, -20, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -13, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
      // 驚嚇線
      ctx.beginPath(); ctx.moveTo(-17, -36); ctx.lineTo(-13, -31); ctx.moveTo(0, -40); ctx.lineTo(0, -34); ctx.moveTo(17, -36); ctx.lineTo(13, -31);
      ctx.lineWidth = 2.5; ctx.strokeStyle = palette.danger; ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(-4, -19, 1.6, 0, Math.PI * 2); ctx.arc(4, -19, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -15, 4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = 1.8; ctx.strokeStyle = palette.ink; ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 標題卡 ----------
  function drawTitleCard(ctx, s) {
    ctx.save();
    var show = s.stage === 'show';
    var day = Math.round(num(s.day, 1));
    var t = now();
    ctx.fillStyle = show ? '#2a1420' : '#121522'; ctx.fillRect(0, 0, 720, 1280);
    if (show) {
      // 布幕條紋 + 聚光
      for (var i = 0; i < 12; i++) {
        ctx.fillStyle = i % 2 ? '#3a1828' : '#4a1e30';
        ctx.fillRect(i * 60, 0, 60, 1280);
      }
      var g = ctx.createRadialGradient(360, 620, 40, 360, 620, 420);
      g.addColorStop(0, 'rgba(255,220,150,0.35)'); g.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 720, 1280);
    } else {
      // 石拱門
      ctx.fillStyle = '#1c1923';
      ctx.beginPath(); ctx.moveTo(150, 900); ctx.lineTo(150, 520); ctx.arc(360, 520, 210, Math.PI, 0); ctx.lineTo(570, 900); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#07060a';
      ctx.beginPath(); ctx.moveTo(210, 900); ctx.lineTo(210, 540); ctx.arc(360, 540, 150, Math.PI, 0); ctx.lineTo(510, 900); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#3a3446'; ctx.lineWidth = 4;
      for (var k = 0; k < 7; k++) {
        var a = Math.PI + k * Math.PI / 6;
        ctx.beginPath(); ctx.moveTo(360 + Math.cos(a) * 150, 540 + Math.sin(a) * 150); ctx.lineTo(360 + Math.cos(a) * 210, 520 + Math.sin(a) * 210); ctx.stroke();
      }
    }
    // 天數進度點
    for (var d = 1; d <= 3; d++) {
      var cx = 360 + (d - 2) * 60;
      ctx.beginPath(); ctx.arc(cx, 330, 14, 0, Math.PI * 2);
      ctx.fillStyle = d < day ? '#8a8494' : d === day ? palette.gold : '#2e2a38'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = palette.ink; ctx.stroke();
    }
    txt(ctx, '第 ' + day + ' 天', 360, 420, { size: 60, color: palette.text, strokeW: 8 });
    txt(ctx, show ? '表演場' : '地下城', 360, 560, { size: 104, color: show ? palette.gold : '#9fc4ff', strokeW: 12 });
    var a2 = 0.6 + 0.4 * Math.sin(t * 4);
    ctx.globalAlpha = a2;
    txt(ctx, '點畫面開始', 360, 1000, { size: 36, color: palette.text, strokeW: 6 });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ---------- 按鈕 ----------
  function drawButton(ctx, s) {
    ctx.save();
    var x = num(s.x, 0), y = num(s.y, 0), w = num(s.w, 200), h = num(s.h, 80);
    var on = s.enabled !== false;
    if (on) {
      rr(ctx, x, y + 6, w, h, 18); ctx.fillStyle = '#8a6a30'; ctx.fill();
      rr(ctx, x, y, w, h, 18); ctx.fillStyle = palette.btn; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = palette.ink; ctx.stroke();
      txt(ctx, s.label || '', x + w / 2, y + h / 2, { size: Math.round(Math.min(h * 0.45, 44)), color: palette.btnText, stroke: false });
    } else {
      rr(ctx, x, y, w, h, 18); ctx.fillStyle = '#2a2630'; ctx.fill();
      ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.strokeStyle = '#5a5266'; ctx.stroke(); ctx.setLineDash([]);
      txt(ctx, s.label || '', x + w / 2, y + h / 2, { size: Math.round(Math.min(h * 0.45, 44)), color: '#6e6878', stroke: false });
    }
    ctx.restore();
  }

  // ---------- 商店項目 ----------
  var SHOP = {
    whipPower: { name: '鞭力', desc: '每鞭扣血 +1' },
    ropeBag: { name: '繩袋', desc: '捕獸繩 +1' },
    armor: { name: '護甲', desc: '心數 +1' },
    longWhip: { name: '長鞭', desc: '甩鞭範圍變大' },
  };

  function shopIcon(ctx, item) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (item === 'ropeBag') { ropeIcon(ctx, 0, 0, 20, true); return; }
    if (item === 'armor') {
      heartPath(ctx, 0, 2, 20); ctx.fillStyle = palette.heart; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = palette.ink; ctx.stroke();
      return;
    }
    // 鞭子
    ctx.beginPath(); ctx.moveTo(-16, 18); ctx.lineTo(-6, 6);
    ctx.lineWidth = 9; ctx.strokeStyle = palette.ink; ctx.stroke();
    ctx.lineWidth = 6; ctx.strokeStyle = '#7a4a24'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, 6);
    if (item === 'longWhip') ctx.bezierCurveTo(10, -20, 30, -6, 22, 14);
    else ctx.bezierCurveTo(6, -10, 18, -6, 14, 8);
    ctx.lineWidth = 5; ctx.strokeStyle = palette.ink; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = palette.whip; ctx.stroke();
    if (item === 'longWhip') {
      ctx.beginPath(); ctx.arc(0, 0, 30, -0.9, 0.9);
      ctx.setLineDash([4, 4]); ctx.lineWidth = 2; ctx.strokeStyle = palette.whip; ctx.stroke(); ctx.setLineDash([]);
    } else {
      // 力量: 爆點
      ctx.beginPath();
      for (var i = 0; i < 4; i++) { var a = i * Math.PI / 2 + 0.5; ctx.moveTo(16, -8); ctx.lineTo(16 + Math.cos(a) * 8, -8 + Math.sin(a) * 8); }
      ctx.lineWidth = 2.5; ctx.strokeStyle = palette.gold; ctx.stroke();
    }
  }

  function drawShopItem(ctx, s) {
    ctx.save();
    ctx.translate(num(s.x, 360), num(s.y, 300));
    var info = SHOP[s.item] || { name: String(s.item || ''), desc: '' };
    var ok = !!s.affordable;
    rr(ctx, -300, -70, 600, 140, 18);
    ctx.fillStyle = ok ? palette.card : '#1c1922'; ctx.fill();
    ctx.lineWidth = ok ? 4 : 2; ctx.strokeStyle = ok ? palette.btn : '#3a3446'; ctx.stroke();
    // 圖示
    ctx.beginPath(); ctx.arc(-225, 0, 46, 0, Math.PI * 2);
    ctx.fillStyle = ok ? '#3a3248' : '#26222c'; ctx.fill();
    ctx.save(); ctx.translate(-225, 0); ctx.scale(1.25, 1.25);
    if (!ok) ctx.globalAlpha = 0.5;
    shopIcon(ctx, s.item); ctx.restore();
    txt(ctx, info.name, -160, -26, { size: 34, align: 'left', color: ok ? palette.text : '#7a7484', stroke: false });
    txt(ctx, info.desc, -160, 14, { size: 22, align: 'left', color: ok ? palette.textDim : '#5e5868', stroke: false, weight: 'normal' });
    var lv = Math.max(0, Math.round(num(s.level, 0)));
    txt(ctx, '已買 ' + lv + ' 次', -160, 46, { size: 18, align: 'left', color: ok ? palette.textDim : '#5e5868', stroke: false, weight: 'normal' });
    // 價格
    rr(ctx, 150, -30, 130, 60, 30);
    ctx.fillStyle = ok ? palette.btn : '#2a2630'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = palette.ink; ctx.stroke();
    coinIcon(ctx, 178, 0, 13);
    txt(ctx, Math.round(num(s.cost, 0)), 238, 1, { size: 30, color: ok ? palette.btnText : '#ff6a6a', stroke: false });
    if (!ok) txt(ctx, '金幣不足', 215, 48, { size: 18, color: '#ff6a6a', stroke: false });
    ctx.restore();
  }

  // ---------- 飄字 ----------
  function drawFloatText(ctx, s) {
    ctx.save();
    var t = Math.max(0, num(s.t, 0));
    var life = 1.0;
    if (t >= life) { ctx.restore(); return; }
    var kind = s.kind || 'gold';
    var a = t < 0.6 ? 1 : clamp(1 - (t - 0.6) / 0.4, 0, 1);
    var pop = t < 0.12 ? 0.6 + t / 0.12 * 0.5 : t < 0.22 ? 1.1 - (t - 0.12) / 0.1 * 0.1 : 1;
    ctx.translate(num(s.x, 0), num(s.y, 0) - 50 * Math.min(t, 0.8));
    ctx.scale(pop, pop);
    ctx.globalAlpha = a;
    var text = String(s.text == null ? '' : s.text);
    if (kind === 'starUp') {
      ctx.font = 'bold 34px ' + FONT;
      var w = ctx.measureText(text).width;
      drawStar(ctx, -w / 2 - 20, 0, 13, true);
      drawStar(ctx, w / 2 + 20, 0, 13, true);
      txt(ctx, text, 0, 0, { size: 34, color: '#fff7a8', strokeW: 7 });
    } else {
      var col = kind === 'repUp' ? palette.rep : kind === 'repDown' ? palette.danger : palette.gold;
      ctx.font = 'bold 28px ' + FONT;
      var w2 = ctx.measureText(text).width;
      var ix = -w2 / 2 - 14;
      if (kind === 'gold') coinIcon(ctx, ix, 0, 11);
      else repIcon(ctx, ix, 0, 12);
      txt(ctx, text, 6, 0, { size: 28, color: col, strokeW: 6 });
    }
    ctx.restore();
  }

  // ---------- 結算 ----------
  function drawResultPanel(ctx, s) {
    ctx.save();
    ctx.fillStyle = '#16111e'; ctx.fillRect(0, 0, 720, 1280);
    var g = ctx.createRadialGradient(360, 330, 20, 360, 330, 360);
    g.addColorStop(0, 'rgba(255,207,58,0.18)'); g.addColorStop(1, 'rgba(255,207,58,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 720, 720);
    txt(ctx, '三天落幕', 360, 170, { size: 48, color: palette.text, strokeW: 7 });
    var stars = clamp(Math.round(num(s.stars, 0)), 0, 3);
    for (var i = 0; i < 3; i++) drawStar(ctx, 360 + (i - 1) * 150, 330 + (i === 1 ? -20 : 0), 62, i < stars);
    txt(ctx, '評星門檻 名聲 60 / 150 / 260', 360, 450, { size: 20, color: palette.textDim, stroke: false, weight: 'normal' });
    // 名聲 / 金幣
    rr(ctx, 110, 500, 500, 190, 20); ctx.fillStyle = palette.card; ctx.fill();
    repIcon(ctx, 190, 555, 20);
    txt(ctx, '總名聲', 230, 555, { size: 30, align: 'left', color: palette.textDim, stroke: false });
    txt(ctx, Math.round(num(s.rep, 0)), 570, 555, { size: 44, align: 'right', color: palette.rep, stroke: false });
    coinIcon(ctx, 190, 635, 18);
    txt(ctx, '累計金幣', 230, 635, { size: 30, align: 'left', color: palette.textDim, stroke: false });
    txt(ctx, Math.round(num(s.goldEarned, 0)), 570, 635, { size: 44, align: 'right', color: palette.gold, stroke: false });
    // 陣容
    txt(ctx, '陣容', 360, 750, { size: 30, color: palette.textDim, stroke: false });
    var roster = Array.isArray(s.roster) ? s.roster : [];
    var n = roster.length;
    for (var k = 0; k < n; k++) {
      var cx = 360 + (k - (n - 1) / 2) * 150;
      ctx.save(); ctx.translate(cx, 850);
      ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI * 2); ctx.fillStyle = palette.card; ctx.fill();
      drawSpeciesBody(ctx, roster[k].species, 38, { dir: 1, mood: 'calm' });
      ctx.restore();
      var st = clamp(Math.round(num(roster[k].star, 1)), 1, 3);
      for (var j = 0; j < st; j++) drawStar(ctx, cx + (j - (st - 1) / 2) * 26, 935, 11, true);
      txt(ctx, SPECIES_NAME[roster[k].species] || '', cx, 970, { size: 22, color: palette.text, stroke: false });
    }
    var a = 0.6 + 0.4 * Math.sin(now() * 4);
    ctx.globalAlpha = a;
    txt(ctx, '點畫面重來', 360, 1130, { size: 36, color: palette.text, strokeW: 6 });
    ctx.restore();
  }

  // ---------- HUD ----------
  function drawHud(ctx, s) {
    var phase = s.phase;
    if (phase === 'guide' || phase === 'title' || phase === 'result') return;
    ctx.save();
    ctx.fillStyle = palette.hudBg; ctx.fillRect(0, 0, 720, 120);
    ctx.fillStyle = palette.hudLine; ctx.fillRect(0, 118, 720, 2);
    var day = Math.round(num(s.day, 1));
    var stageName = phase === 'dungeon' ? '地下城' : phase === 'show' ? '表演場' : phase === 'shop' ? '商店' : '';
    txt(ctx, '第 ' + day + ' 天  ' + stageName, 20, 24, { size: 22, align: 'left', color: palette.textDim, stroke: false });
    // 金幣 / 名聲(右上)
    coinIcon(ctx, 486, 24, 12);
    txt(ctx, Math.round(num(s.gold, 0)), 504, 25, { size: 26, align: 'left', color: palette.gold, stroke: false });
    repIcon(ctx, 600, 24, 13);
    txt(ctx, Math.round(num(s.rep, 0)), 619, 25, { size: 26, align: 'left', color: palette.rep, stroke: false });

    // 計時(中央大字)
    if (phase === 'dungeon' || phase === 'show') {
      var tl = Math.max(0, num(s.timeLeft, 0));
      var sec = Math.ceil(tl);
      var low = tl <= 10;
      txt(ctx, sec, 360, 46, { size: 54, color: low ? '#ff8a5a' : palette.text, strokeW: 6 });
    }

    // 心 + 繩(地下城)
    if (phase === 'dungeon') {
      var mh = Math.max(0, Math.round(num(s.maxHearts, 5))), h = Math.round(num(s.hearts, mh));
      for (var i = 0; i < mh; i++) {
        heartPath(ctx, 32 + i * 28, 62, 11);
        if (i < h) { ctx.fillStyle = palette.heart; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = palette.ink; ctx.stroke(); }
        else { ctx.lineWidth = 2; ctx.strokeStyle = '#5a5266'; ctx.stroke(); }
      }
      var rm = Math.max(0, Math.round(num(s.ropeMax, 3))), rp = Math.round(num(s.ropes, rm));
      for (var j = 0; j < rm; j++) ropeIcon(ctx, 32 + j * 26, 100, 9, j < rp);
    }

    // 陣容(右側第二列)
    if (phase === 'dungeon' || phase === 'show' || phase === 'shop') {
      var roster = Array.isArray(s.roster) ? s.roster : [];
      for (var k = 0; k < roster.length && k < 4; k++) {
        var cx = 690 - (roster.length - 1 - k) * 44;
        ctx.save(); ctx.translate(cx, 64);
        drawSpeciesBody(ctx, roster[k].species, 13, { dir: -1, mood: 'calm' });
        ctx.restore();
        var st = clamp(Math.round(num(roster[k].star, 1)), 1, 3);
        for (var q = 0; q < st; q++) drawStar(ctx, cx + (q - (st - 1) / 2) * 11, 88, 4.5, true);
      }
    }

    // 訊息列(中下)
    var msg = s.message ? String(s.message) : '';
    var sp = clamp(num(s.subdueProgress, 0), 0, 1);
    if (msg) {
      var bx = 180, bw = 360, by = 86, bh = 28;
      rr(ctx, bx, by, bw, bh, 14);
      ctx.fillStyle = sp > 0 || /制伏/.test(msg) ? '#3a1416' : '#241f2c'; ctx.fill();
      if (sp > 0) {
        ctx.save(); rr(ctx, bx, by, bw, bh, 14); ctx.clip();
        ctx.fillStyle = palette.playerDark; ctx.fillRect(bx, by, bw * sp, bh);
        ctx.restore();
      }
      rr(ctx, bx, by, bw, bh, 14);
      ctx.lineWidth = 2; ctx.strokeStyle = /制伏/.test(msg) ? palette.danger : palette.hudLine; ctx.stroke();
      txt(ctx, msg, 360, by + bh / 2 + 1, { size: 18, color: palette.text, strokeW: 4 });
    }
    ctx.restore();
  }

  // ---------- 說明頁示意圖 ----------
  var GDW = 640, GDH = 520;

  function arrowHead(ctx, x, y, ang, size, color) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - Math.cos(ang - 0.45) * size, y - Math.sin(ang - 0.45) * size);
    ctx.lineTo(x - Math.cos(ang + 0.45) * size, y - Math.sin(ang + 0.45) * size);
    ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = palette.ink; ctx.stroke();
  }

  function cursorIcon(ctx, x, y) {
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x, y + 30); ctx.lineTo(x + 8, y + 23); ctx.lineTo(x + 14, y + 35); ctx.lineTo(x + 19, y + 33); ctx.lineTo(x + 13, y + 21); ctx.lineTo(x + 23, y + 21); ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = palette.ink; ctx.lineJoin = 'round'; ctx.stroke();
  }

  function label(ctx, s, x, y, col) {
    txt(ctx, s, x, y, { size: 22, color: col || palette.text, strokeW: 5 });
  }

  function guidePage0(ctx) {
    var map = [
      '##########',
      '#L...#####',
      '#LL.f....#',
      '#.......##',
      '#........#',
      '##.......#',
      '#........#',
      '##########',
    ];
    var ox = 20, oy = 20;
    for (var r = 0; r < map.length; r++) {
      for (var c = 0; c < map[r].length; c++) {
        var ch = map[r][c];
        var kind = ch === '#' ? 'wall' : ch === 'L' ? 'lava' : 'floor';
        var zone = (c < 6 && r < 5) ? 'lava' : 'hall';
        drawTile(ctx, { x: ox + c * 60 + 30, y: oy + r * 60 + 30, kind: kind, zone: zone, nest: ch === 'f' });
      }
    }
    var S = { x: ox + 300, y: oy + 210 }, T = { x: ox + 520, y: oy + 400 }, C = { x: ox + 100, y: oy + 240 };
    drawHazard(ctx, { x: S.x, y: S.y, kind: 'firering', phase: 'warn', radius: 120, t: 0.3, angle: 0 });
    drawWildMonster(ctx, { x: S.x, y: S.y, species: 'fire', hp: 10, maxHp: 10, hit: false, weak: false, casting: true, dir: 1 });
    // 繞路虛線箭頭
    ctx.save();
    var ctrl = { x: ox + 260, y: oy + 470 };
    ctx.beginPath(); ctx.moveTo(T.x - 20, T.y + 4); ctx.quadraticCurveTo(ctrl.x, ctrl.y, C.x + 14, C.y + 40);
    ctx.setLineDash([12, 9]); ctx.lineWidth = 7; ctx.strokeStyle = palette.ink; ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = palette.player; ctx.stroke(); ctx.setLineDash([]);
    var ang = Math.atan2((C.y + 40) - ctrl.y, (C.x + 14) - ctrl.x);
    arrowHead(ctx, C.x + 14, C.y + 40, ang, 18, palette.player);
    ctx.restore();
    drawTamer(ctx, { x: T.x, y: T.y, stunned: false, blink: false, subdueProgress: 0, dir: -1 });
    cursorIcon(ctx, C.x, C.y);
    label(ctx, '你', T.x + 34, T.y - 30, palette.player);
    label(ctx, '火圈', S.x + 60, S.y - 128, palette.fire);
  }

  function guidePage1(ctx) {
    // 兩格底
    function panel(x0) {
      for (var r = 0; r < 8; r++) for (var c = 0; c < 5; c++) {
        drawTile(ctx, { x: x0 + c * 60 + 30, y: 20 + r * 60 + 30, kind: 'floor', zone: 'crag', nest: false });
      }
      ctx.lineWidth = 4; ctx.strokeStyle = palette.ink; ctx.strokeRect(x0, 20, 300, 480);
    }
    ctx.save();
    ctx.beginPath(); ctx.rect(10, 20, 300, 480); ctx.clip();
    panel(10);
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.rect(330, 20, 300, 480); ctx.clip();
    panel(330);
    ctx.restore();
    ctx.lineWidth = 4; ctx.strokeStyle = palette.ink; ctx.strokeRect(10, 20, 300, 480); ctx.strokeRect(330, 20, 300, 480);

    // 左: 抽打, 血條下降
    var T1 = { x: 120, y: 330 }, M1 = { x: 190, y: 250 };
    ctx.save(); ctx.beginPath(); ctx.rect(10, 20, 300, 480); ctx.clip();
    drawWhipCrack(ctx, { x: T1.x, y: T1.y, radius: 110, t: 0.08 });
    ctx.restore();
    drawWildMonster(ctx, { x: M1.x, y: M1.y, species: 'thunder', hp: 7, maxHp: 12, hit: true, weak: false, casting: false, dir: -1 });
    drawTamer(ctx, { x: T1.x, y: T1.y, stunned: false, blink: false, subdueProgress: 0, dir: 1 });
    // 血條旁的下降箭頭
    ctx.save();
    ctx.beginPath(); ctx.moveTo(M1.x + 42, M1.y - 52); ctx.lineTo(M1.x + 42, M1.y - 34);
    ctx.lineWidth = 6; ctx.strokeStyle = palette.ink; ctx.lineCap = 'round'; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = palette.danger; ctx.stroke();
    arrowHead(ctx, M1.x + 42, M1.y - 28, Math.PI / 2, 12, palette.danger);
    ctx.restore();
    label(ctx, '你', T1.x - 36, T1.y + 34, palette.player);

    // 右: 虛弱 → 再一鞭收服
    var T2 = { x: 440, y: 330 }, M2 = { x: 515, y: 250 };
    ctx.save(); ctx.beginPath(); ctx.rect(330, 20, 300, 480); ctx.clip();
    drawWhipCrack(ctx, { x: T2.x, y: T2.y, radius: 110, t: 0.06 });
    ctx.restore();
    // 繩子(從馴獸師套到魔物)
    ctx.save();
    ctx.beginPath(); ctx.moveTo(T2.x + 12, T2.y - 4); ctx.quadraticCurveTo(T2.x + 70, T2.y - 10, M2.x - 6, M2.y + 30);
    ctx.lineWidth = 7; ctx.strokeStyle = palette.ink; ctx.lineCap = 'round'; ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = palette.rope; ctx.stroke();
    ctx.restore();
    drawWildMonster(ctx, { x: M2.x, y: M2.y, species: 'thunder', hp: 3, maxHp: 12, hit: false, weak: true, casting: false, dir: 1 });
    ctx.save();
    ctx.beginPath(); ctx.ellipse(M2.x, M2.y + 18, 30, 10, 0, 0, Math.PI * 2);
    ctx.lineWidth = 7; ctx.strokeStyle = palette.ink; ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = palette.rope; ctx.stroke();
    ctx.restore();
    drawTamer(ctx, { x: T2.x, y: T2.y, stunned: false, blink: false, subdueProgress: 0, dir: 1 });
    label(ctx, '虛弱', M2.x, M2.y - 70, palette.player);
    checkBadge(ctx, M2.x + 58, M2.y - 30, 20);

    // 中間箭頭
    arrowHead(ctx, 330, 260, 0, 22, palette.text);
  }

  function guidePage2(ctx) {
    ctx.fillStyle = palette.sand; ctx.fillRect(10, 20, 620, 480);
    ctx.strokeStyle = palette.sandLine; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(320, 260, 260, 200, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = '#3e2f22'; ctx.strokeRect(10, 20, 620, 480);
    var T = { x: 220, y: 340 }, M = { x: 290, y: 255 }, M2 = { x: 530, y: 410 };
    drawWhipCrack(ctx, { x: T.x, y: T.y, radius: 110, t: 0.1 });
    drawHazard(ctx, { x: M.x, y: M.y, kind: 'quake', phase: 'active', radius: 64, t: 0.3, angle: 0 });
    drawShowMonster(ctx, { x: M.x, y: M.y, species: 'stone', star: 1, rage: 66, mode: 'roam', performing: true, fx: 'none', dir: -1 });
    drawShowMonster(ctx, { x: M2.x, y: M2.y, species: 'water', star: 1, rage: 15, mode: 'roam', performing: false, fx: 'none', dir: -1 });
    drawTamer(ctx, { x: T.x, y: T.y, stunned: false, blink: false, subdueProgress: 0, dir: 1 });
    drawFloatText(ctx, { x: M.x + 80, y: M.y - 90, text: '+4', kind: 'gold', t: 0.3 });
    drawFloatText(ctx, { x: M.x + 90, y: M.y - 45, text: '+1', kind: 'repUp', t: 0.3 });
    label(ctx, '你', T.x - 40, T.y + 36, palette.player);
    label(ctx, '怒氣', M.x - 82, M.y - 44, palette.rageHot);
    label(ctx, '怒氣', M2.x - 82, M2.y - 44, palette.rageCalm);
  }

  function guidePage3(ctx) {
    // 觀眾席
    ctx.fillStyle = palette.stand; ctx.fillRect(10, 20, 620, 150);
    ctx.fillStyle = palette.standRow;
    for (var ry = 40; ry < 170; ry += 40) ctx.fillRect(10, ry, 620, 8);
    ctx.fillStyle = palette.sand; ctx.fillRect(10, 186, 620, 174);
    ctx.lineWidth = 4; ctx.strokeStyle = '#3e2f22'; ctx.strokeRect(10, 20, 620, 340);
    var xs = [120, 220, 320, 420, 520];
    for (var i = 0; i < xs.length; i++) {
      drawVisitor(ctx, { x: xs[i], y: 105, seat: i, mode: i === 2 ? 'scared' : 'watch' });
      drawFence(ctx, { x: xs[i], y: 178, side: 'top', broken: i === 2 });
    }
    drawShowMonster(ctx, { x: 320, y: 220, species: 'fire', star: 1, rage: 100, mode: 'charge', performing: false, fx: 'none', dir: 1 });
    crossBadge(ctx, 362, 64, 20);
    label(ctx, '滿', 386, 172, palette.danger);
    // 流程小字
    var steps = ['地下城', '表演場', '商店'];
    var bx = [110, 290, 470];
    for (var k = 0; k < 3; k++) {
      rr(ctx, bx[k] - 70, 392, 140, 50, 14);
      ctx.fillStyle = palette.card; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = palette.hudLine; ctx.stroke();
      txt(ctx, steps[k], bx[k], 418, { size: 24, color: palette.text, stroke: false });
      if (k < 2) arrowHead(ctx, bx[k] + 108, 417, 0, 16, palette.textDim);
    }
    txt(ctx, '× 3 天 → 評星', 290, 478, { size: 24, color: palette.textDim, stroke: false });
    for (var st = 0; st < 3; st++) drawStar(ctx, 410 + st * 26, 478, 10, true);
  }

  var GUIDE = [guidePage0, guidePage1, guidePage2, guidePage3];

  function drawGuidePage(ctx, s) {
    var page = Math.round(num(s.page, 0));
    var fn = GUIDE[page];
    if (!fn) return;
    var x = num(s.x, 0), y = num(s.y, 0), w = Math.max(1, num(s.w, GDW)), h = Math.max(1, num(s.h, GDH));
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    var k = Math.min(w / GDW, h / GDH);
    ctx.translate(x + (w - GDW * k) / 2, y + (h - GDH * k) / 2);
    ctx.scale(k, k);
    fn(ctx);
    ctx.restore();
  }

  window.Art = {
    canvas: { width: 720, height: 1280 },
    palette: palette,
    drawBackground: drawBackground,
    drawTile: drawTile,
    drawTamer: drawTamer,
    drawWildMonster: drawWildMonster,
    drawHazard: drawHazard,
    drawWhipCrack: drawWhipCrack,
    drawShowArena: drawShowArena,
    drawShowMonster: drawShowMonster,
    drawFence: drawFence,
    drawVisitor: drawVisitor,
    drawTitleCard: drawTitleCard,
    drawButton: drawButton,
    drawShopItem: drawShopItem,
    drawFloatText: drawFloatText,
    drawResultPanel: drawResultPanel,
    drawHud: drawHud,
    drawGuidePage: drawGuidePage,
  };
})();
