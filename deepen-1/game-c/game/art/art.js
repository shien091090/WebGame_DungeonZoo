// 習性大招秀 — 美術(deepen-1 / game-c)
// 全域物件, 不用 ES module。全部 Canvas 2D 幾何繪製, 無外部資源。
// 函式名、參數、state 欄位照 interface.json; 說明見 style.md
(function () {
  'use strict';

  var PAL = {
    bg: '#120e18',
    hudBg: '#1c1626',
    hudLine: '#3a3048',
    text: '#f4eee2',
    textDim: '#a89cb8',
    outline: '#1b1424',
    // 種類色(色相 8 / 83 / 212 / 282, 灰階 115 / 192 / 155 / 72)
    fire: '#e8452c',
    thunder: '#a6e83a',
    water: '#5aa8ff',
    stone: '#6e2690',
    // 語意色
    tamer: '#f4ecd8',      // 馴獸師本體(無彩奶白)
    hat: '#7a4a26',
    rope: '#d9b26a',       // 套索 / 可套記號 / 捕獸繩
    gold: '#ffd23a',       // 金幣 / 大招(×2)
    rage: '#ff2d6f',       // 紅線區 / 失控 / 扣名聲
    calm: '#e8f6ff',       // 哨音 / 被安撫(波浪線)
    parry: '#bff8ff',      // 盾 / 彈反
    whip: '#fff6dc',       // 鞭擊
    heart: '#ff5a6e',
    rep: '#c9b6ff',        // 名聲(星)
    // 地形
    wall: '#2b2236', wallTop: '#4a3d5c',
    lava: '#ff6a1a', lavaHot: '#ffc43a',
    waterTile: '#1f5f9a', waterHi: '#5fb4ef',
    floorCrag: '#3a3640', floorRuins: '#4a4034', floorLava: '#3a2622', floorPond: '#26343e', floorHall: '#2e2a34',
    sand: '#c9a978', sandDark: '#b08f60', stands: '#3a2a3e', fence: '#a8743e'
  };

  var SP = {
    fire: { base: PAL.fire, light: '#ffb07a', dark: '#9a2414', name: '火蜥蜴' },
    water: { base: PAL.water, light: '#cfe8ff', dark: '#2a5fb0', name: '水母' },
    thunder: { base: PAL.thunder, light: '#e8ffb0', dark: '#5a8a14', name: '雷鳥' },
    stone: { base: PAL.stone, light: '#c79ae0', dark: '#3e1258', name: '石像鬼' }
  };
  var SPECIES = ['fire', 'water', 'thunder', 'stone'];
  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';

  function now() {
    return (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) / 1000;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }

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

  // 文字: 一律帶深色描邊(P10)
  function txt(ctx, s, x, y, size, color, align, weight, outline) {
    ctx.font = (weight || 'bold') + ' ' + size + 'px ' + FONT;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    if (outline !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(3, size * 0.18);
      ctx.strokeStyle = outline || 'rgba(15,10,20,0.95)';
      ctx.strokeText(String(s), x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(String(s), x, y);
  }

  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); }

  // 金幣小圖示
  function coin(ctx, x, y, r) {
    circle(ctx, x, y, r); ctx.fillStyle = PAL.gold; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.22); ctx.strokeStyle = '#8a6410'; ctx.stroke();
    circle(ctx, x, y, r * 0.5); ctx.strokeStyle = '#e0a820'; ctx.lineWidth = Math.max(1, r * 0.15); ctx.stroke();
  }
  function star(ctx, x, y, r, fill, stroke) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r;
      var px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.lineWidth = 2; ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function heart(ctx, x, y, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 1.3, y - r * 0.1, x - r * 0.6, y - r * 1.1, x, y - r * 0.35);
    ctx.bezierCurveTo(x + r * 0.6, y - r * 1.1, x + r * 1.3, y - r * 0.1, x, y + r * 0.9);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
  }
  // 捕獸繩圈(可套 / 繩數)
  function ropeLoop(ctx, x, y, r, filled) {
    ctx.lineWidth = Math.max(2, r * 0.35);
    ctx.strokeStyle = PAL.outline;
    circle(ctx, x, y, r); ctx.stroke();
    ctx.lineWidth = Math.max(1.5, r * 0.24);
    ctx.strokeStyle = filled ? PAL.rope : 'rgba(217,178,106,0.3)';
    ctx.setLineDash(filled ? [] : [3, 3]);
    circle(ctx, x, y, r); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x + r * 0.6, y + r * 0.6); ctx.lineTo(x + r * 1.15, y + r * 1.15); ctx.stroke();
  }
  function keycap(ctx, x, y, label, size) {
    size = size || 26;
    var w = Math.max(size, label.length * size * 0.42 + size * 0.5);
    rr(ctx, x - w / 2, y - size / 2, w, size, 5);
    ctx.fillStyle = '#efe6d4'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
    rr(ctx, x - w / 2, y + size / 2 - 5, w, 5, 3); ctx.fillStyle = '#b8ab94'; ctx.fill();
    txt(ctx, label, x, y - 1, Math.round(size * 0.55), PAL.outline, 'center', 'bold', false);
  }
  // 虛線框 + 由內長大的填色(預警字典)
  function warnDisk(ctx, x, y, r, p, color) {
    circle(ctx, x, y, r * clamp(p, 0, 1));
    ctx.globalAlpha = 0.28; ctx.fillStyle = color; ctx.fill(); ctx.globalAlpha = 1;
    ctx.setLineDash([10, 7]); ctx.lineWidth = 3; ctx.strokeStyle = color;
    circle(ctx, x, y, r - 1.5); ctx.stroke(); ctx.setLineDash([]);
  }

  // ============ 魔物本體(以原點為中心, 單位約半徑 30) ============
  function creature(ctx, sp, dir, flash, t) {
    var c = SP[sp] || SP.fire;
    var base = flash ? '#ffffff' : c.base, light = flash ? '#ffffff' : c.light, dark = flash ? '#e8e8e8' : c.dark;
    dir = dir === -1 ? -1 : 1;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = PAL.outline; ctx.lineWidth = 2.5;
    ctx.save();
    ctx.scale(dir, 1);
    if (sp === 'water') {
      // 水母: 半圓傘 + 波浪觸手
      var wv = Math.sin(t * 4) * 2;
      ctx.lineWidth = 3.5; ctx.strokeStyle = PAL.outline;
      for (var i = 0; i < 4; i++) {
        var tx = -12 + i * 8;
        ctx.beginPath(); ctx.moveTo(tx, 6);
        ctx.quadraticCurveTo(tx + 5 + wv, 14, tx, 19);
        ctx.quadraticCurveTo(tx - 5 - wv, 23, tx, 26);
        ctx.stroke();
      }
      ctx.lineWidth = 2; ctx.strokeStyle = light;
      for (i = 0; i < 4; i++) {
        tx = -12 + i * 8;
        ctx.beginPath(); ctx.moveTo(tx, 6);
        ctx.quadraticCurveTo(tx + 5 + wv, 14, tx, 19);
        ctx.quadraticCurveTo(tx - 5 - wv, 23, tx, 26);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-23, 4);
      ctx.arc(0, 2, 23, Math.PI, 0);
      ctx.quadraticCurveTo(17, 10, 11, 5);
      ctx.quadraticCurveTo(6, 10, 0, 5);
      ctx.quadraticCurveTo(-6, 10, -11, 5);
      ctx.quadraticCurveTo(-17, 10, -23, 4);
      ctx.closePath();
      ctx.fillStyle = base; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-8, -10, 6, 4, -0.5, 0, Math.PI * 2); ctx.fillStyle = light; ctx.fill();
      eye(ctx, 2, -4, 4.5); eye(ctx, 12, -4, 4.5);
    } else if (sp === 'thunder') {
      // 雷鳥: 圓身 + 張開雙翼 + 鋸齒冠
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-29, -20); ctx.lineTo(-24, -8); ctx.lineTo(-29, -2); ctx.lineTo(-22, 4); ctx.lineTo(-8, 10); ctx.closePath();
      ctx.fillStyle = dark; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-18, 12); ctx.lineTo(-28, 18); ctx.lineTo(-24, 10); ctx.closePath(); ctx.fillStyle = dark; ctx.fill(); ctx.stroke();
      circle(ctx, -2, 6, 16); ctx.fillStyle = base; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(1, 11, 9, 7, 0, 0, Math.PI * 2); ctx.fillStyle = light; ctx.fill();
      ctx.beginPath(); ctx.moveTo(4, -2); ctx.lineTo(20, -24); ctx.lineTo(16, -10); ctx.lineTo(24, -12); ctx.lineTo(12, 6); ctx.closePath();
      ctx.fillStyle = base; ctx.fill(); ctx.stroke();
      circle(ctx, 12, -10, 10); ctx.fillStyle = base; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6, -19); ctx.lineTo(9, -27); ctx.lineTo(12, -21); ctx.lineTo(15, -28); ctx.lineTo(17, -19); ctx.closePath();
      ctx.fillStyle = PAL.gold; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(20, -12); ctx.lineTo(29, -8); ctx.lineTo(20, -5); ctx.closePath(); ctx.fillStyle = '#ffb02a'; ctx.fill(); ctx.stroke();
      eye(ctx, 14, -11, 3.6);
      ctx.beginPath(); ctx.moveTo(-6, 21); ctx.lineTo(-6, 26); ctx.moveTo(3, 21); ctx.lineTo(3, 26); ctx.lineWidth = 3; ctx.stroke();
    } else if (sp === 'stone') {
      // 石像鬼: 方塊身 + 雙角 + 收起的翅 + 底座
      ctx.beginPath(); ctx.moveTo(-17, -4); ctx.lineTo(-30, -18); ctx.lineTo(-27, 2); ctx.lineTo(-30, 12); ctx.lineTo(-17, 10); ctx.closePath();
      ctx.fillStyle = dark; ctx.fill(); ctx.stroke();
      rr(ctx, -21, 19, 42, 7, 2); ctx.fillStyle = '#4a4252'; ctx.fill(); ctx.stroke();
      rr(ctx, -18, -14, 36, 34, 6); ctx.fillStyle = base; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-14, -13); ctx.lineTo(-17, -27); ctx.lineTo(-6, -14); ctx.closePath(); ctx.fillStyle = light; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6, -14); ctx.lineTo(17, -27); ctx.lineTo(14, -13); ctx.closePath(); ctx.fillStyle = light; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-10, 12); ctx.lineTo(-4, 6); ctx.lineTo(2, 12); ctx.moveTo(-14, -2); ctx.lineTo(-10, 2);
      ctx.strokeStyle = flash ? '#cccccc' : 'rgba(30,8,44,0.7)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = PAL.outline; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-2, -4); ctx.lineTo(16, -4); ctx.stroke();
      eye(ctx, 2, -1, 3.8, '#ffe07a'); eye(ctx, 12, -1, 3.8, '#ffe07a');
    } else {
      // 火蜥蜴: 長身 + 捲尾 + 背上火冠
      ctx.lineWidth = 8; ctx.strokeStyle = PAL.outline;
      ctx.beginPath(); ctx.moveTo(-18, 6); ctx.quadraticCurveTo(-34, 8, -30, -6); ctx.stroke();
      ctx.lineWidth = 4.5; ctx.strokeStyle = base;
      ctx.beginPath(); ctx.moveTo(-18, 6); ctx.quadraticCurveTo(-34, 8, -30, -6); ctx.stroke();
      ctx.strokeStyle = PAL.outline; ctx.lineWidth = 2.5;
      var lg = [[-12, 15], [-2, 16], [8, 15]];
      for (i = 0; i < lg.length; i++) { ctx.beginPath(); ctx.ellipse(lg[i][0], lg[i][1], 4, 5, 0, 0, Math.PI * 2); ctx.fillStyle = dark; ctx.fill(); ctx.stroke(); }
      ctx.beginPath(); ctx.ellipse(-3, 5, 20, 12, 0, 0, Math.PI * 2); ctx.fillStyle = base; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-3, 10, 13, 5, 0, 0, Math.PI * 2); ctx.fillStyle = light; ctx.fill();
      var fl = [[-12, -6], [-3, -8], [6, -6]];
      for (i = 0; i < fl.length; i++) {
        var fx = fl[i][0], fy = fl[i][1], fh = 7 + Math.sin(t * 9 + i) * 1.5;
        ctx.beginPath(); ctx.moveTo(fx - 4, fy + 2); ctx.quadraticCurveTo(fx - 3, fy - fh * 0.6, fx, fy - fh); ctx.quadraticCurveTo(fx + 3, fy - fh * 0.6, fx + 4, fy + 2); ctx.closePath();
        ctx.fillStyle = flash ? '#ffffff' : PAL.gold; ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke();
      }
      ctx.lineWidth = 2.5;
      circle(ctx, 18, -1, 11); ctx.fillStyle = base; ctx.fill(); ctx.stroke();
      eye(ctx, 21, -4, 4);
      ctx.beginPath(); ctx.moveTo(22, 4); ctx.lineTo(27, 3); ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
  }
  function eye(ctx, x, y, r, iris) {
    circle(ctx, x, y, r); ctx.fillStyle = iris || '#ffffff'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
    circle(ctx, x + r * 0.3, y, r * 0.5); ctx.fillStyle = PAL.outline; ctx.fill();
  }

  // 疊在魔物上的狀態外觀(野生 / 表演共用的部分)
  function weakMark(ctx, x, y) {
    // 可套記號: 虛線繩圈 + 下垂汗滴, 輕微閃
    var a = 0.65 + 0.35 * Math.sin(now() * 8);
    ctx.globalAlpha = a;
    circle(ctx, x, y, 9); ctx.fillStyle = 'rgba(20,14,28,0.85)'; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.rope; ctx.setLineDash([4, 3]);
    circle(ctx, x, y, 6); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // ============ Art ============
  var Art = {
    canvas: { width: 720, height: 1280 },
    palette: PAL,

    drawBackground: function (ctx) {
      ctx.save();
      ctx.fillStyle = PAL.bg;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.restore();
    },

    // ---------- 地圖格 60×60 ----------
    drawTile: function (ctx, s) {
      ctx.save();
      var x = num(s.x, 0) - 30, y = num(s.y, 0) - 30, kind = s.kind, zone = s.zone;
      var floorC = { crag: PAL.floorCrag, ruins: PAL.floorRuins, lava: PAL.floorLava, pond: PAL.floorPond, hall: PAL.floorHall }[zone] || PAL.floorHall;
      if (kind === 'wall') {
        ctx.fillStyle = PAL.wall; ctx.fillRect(x, y, 60, 60);
        ctx.fillStyle = PAL.wallTop; ctx.fillRect(x, y, 60, 12);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + 30); ctx.lineTo(x + 60, y + 30);
        ctx.moveTo(x, y + 46); ctx.lineTo(x + 60, y + 46);
        ctx.moveTo(x + 30, y + 12); ctx.lineTo(x + 30, y + 30);
        ctx.moveTo(x + 15, y + 30); ctx.lineTo(x + 15, y + 46);
        ctx.moveTo(x + 45, y + 30); ctx.lineTo(x + 45, y + 46);
        ctx.moveTo(x + 30, y + 46); ctx.lineTo(x + 30, y + 60);
        ctx.stroke();
        ctx.restore(); return;
      }
      // 地板底
      ctx.fillStyle = floorC; ctx.fillRect(x, y, 60, 60);
      ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1;
      if (zone === 'ruins') {
        ctx.strokeRect(x + 0.5, y + 0.5, 59, 59);
        ctx.beginPath(); ctx.moveTo(x + 30, y); ctx.lineTo(x + 30, y + 60); ctx.moveTo(x, y + 30); ctx.lineTo(x + 60, y + 30); ctx.stroke();
      } else if (zone === 'crag') {
        ctx.beginPath(); ctx.moveTo(x + 8, y + 14); ctx.lineTo(x + 22, y + 24); ctx.lineTo(x + 20, y + 40); ctx.moveTo(x + 40, y + 44); ctx.lineTo(x + 52, y + 36); ctx.stroke();
      } else if (zone === 'lava') {
        ctx.fillStyle = 'rgba(255,106,26,0.08)';
        ctx.beginPath(); ctx.arc(x + 18, y + 40, 6, 0, Math.PI * 2); ctx.arc(x + 44, y + 16, 4, 0, Math.PI * 2); ctx.fill();
      } else if (zone === 'pond') {
        ctx.strokeStyle = 'rgba(120,180,220,0.12)';
        ctx.beginPath(); ctx.moveTo(x + 10, y + 20); ctx.lineTo(x + 26, y + 20); ctx.moveTo(x + 34, y + 44); ctx.lineTo(x + 50, y + 44); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(x, y + 0.5); ctx.lineTo(x + 60, y + 0.5); ctx.stroke();
      }
      var t = now();
      if (kind === 'lava') {
        ctx.fillStyle = PAL.lava; ctx.fillRect(x, y, 60, 60);
        ctx.fillStyle = PAL.lavaHot;
        for (var i = 0; i < 3; i++) {
          var ph = (t * 0.7 + i * 0.37 + (x + y) * 0.013) % 1;
          circle(ctx, x + 12 + i * 18, y + 48 - ph * 34, 3 + ph * 4); ctx.globalAlpha = 1 - ph; ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#8a1e08'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y + 20); ctx.lineTo(x + 12, y + 14); ctx.lineTo(x + 24, y + 22); ctx.lineTo(x + 38, y + 12); ctx.lineTo(x + 50, y + 20); ctx.lineTo(x + 60, y + 14);
        ctx.stroke();
      } else if (kind === 'water') {
        ctx.fillStyle = PAL.waterTile; ctx.fillRect(x, y, 60, 60);
        ctx.strokeStyle = PAL.waterHi; ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
        var o = Math.sin(t * 2 + x * 0.05) * 4;
        ctx.beginPath();
        ctx.moveTo(x + 8 + o, y + 18); ctx.quadraticCurveTo(x + 16 + o, y + 13, x + 24 + o, y + 18);
        ctx.moveTo(x + 32 - o, y + 40); ctx.quadraticCurveTo(x + 40 - o, y + 35, x + 48 - o, y + 40);
        ctx.stroke(); ctx.globalAlpha = 1;
      } else if (kind === 'pillar') {
        ctx.beginPath(); ctx.ellipse(x + 30, y + 50, 22, 7, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
        rr(ctx, x + 10, y + 8, 40, 46, 6); ctx.fillStyle = PAL.wall; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
        rr(ctx, x + 8, y + 2, 44, 12, 4); ctx.fillStyle = PAL.wallTop; ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x + 16, y + 16, 6, 34);
      }
      if (s.nest && kind !== 'wall') {
        var sp = { crag: 'thunder', ruins: 'stone', lava: 'fire', pond: 'water' }[zone];
        ctx.lineWidth = 5; ctx.strokeStyle = '#6a4a2a';
        circle(ctx, x + 30, y + 32, 19); ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = '#9a7444'; ctx.setLineDash([5, 4]);
        circle(ctx, x + 30, y + 32, 19); ctx.stroke(); ctx.setLineDash([]);
        if (sp) {
          ctx.beginPath(); ctx.ellipse(x + 30, y + 32, 6, 8, 0, 0, Math.PI * 2);
          ctx.fillStyle = (SP[sp] || SP.fire).base; ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1;
        }
      }
      ctx.restore();
    },

    // ---------- 馴獸師 64×64(本體圓半徑 18 = 判定) ----------
    drawTamer: function (ctx, s) {
      ctx.save();
      var x = num(s.x, 0), y = num(s.y, 0), f = num(s.facing, 0) | 0;
      var ang = -Math.PI / 2 + f * Math.PI / 4, dx = Math.cos(ang), dy = Math.sin(ang);
      var t = now();
      var stun = num(s.stunLeft, 0) > 0, parry = num(s.parryLeft, 0) > 0;
      if (s.blink && Math.floor(t * 12) % 2 === 0) ctx.globalAlpha = 0.35;
      ctx.translate(x, y);
      // 腳下定位環
      ctx.beginPath(); ctx.ellipse(0, 14, 20, 7, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      if (s.rolling) {
        // 翻滾: 拖尾 + 壓扁身體
        for (var k = 2; k >= 1; k--) {
          circle(ctx, -dx * k * 6, -dy * k * 6, 15);
          ctx.fillStyle = 'rgba(244,236,216,' + (0.18 / k) + ')'; ctx.fill();
        }
        ctx.save(); ctx.rotate(ang + Math.PI / 2);
        ctx.beginPath(); ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
        ctx.fillStyle = PAL.tamer; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.outline; ctx.stroke();
        ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.hat;
        var sp = t * 20;
        ctx.beginPath(); ctx.arc(0, 0, 9, sp, sp + 2.4); ctx.stroke();
        ctx.restore();
        ctx.restore(); return;
      }
      // 本體
      circle(ctx, 0, 0, 18);
      ctx.fillStyle = stun ? '#c8c0b0' : PAL.tamer; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = PAL.outline; ctx.stroke();
      // 帽子
      ctx.beginPath(); ctx.ellipse(0, -7, 15, 5, 0, 0, Math.PI * 2); ctx.fillStyle = PAL.hat; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      rr(ctx, -8, -17, 16, 11, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d23a3a'; ctx.fillRect(-8, -9, 16, 3);
      // 臉(朝向)
      var ex = dx * 6, ey = dy * 3 + 3;
      if (stun) {
        ctx.strokeStyle = PAL.outline; ctx.lineWidth = 2;
        for (var e = -1; e <= 1; e += 2) {
          ctx.beginPath(); ctx.moveTo(ex + e * 5 - 2.5, ey - 2.5); ctx.lineTo(ex + e * 5 + 2.5, ey + 2.5);
          ctx.moveTo(ex + e * 5 + 2.5, ey - 2.5); ctx.lineTo(ex + e * 5 - 2.5, ey + 2.5); ctx.stroke();
        }
      } else if (f !== 0) {
        circle(ctx, ex - 4, ey, 2.4); ctx.fillStyle = PAL.outline; ctx.fill();
        circle(ctx, ex + 4, ey, 2.4); ctx.fill();
      }
      // 面向指示: 本體外的鞭柄 + 尖
      ctx.save(); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(20, -6); ctx.lineTo(29, 0); ctx.lineTo(20, 6); ctx.closePath();
      ctx.fillStyle = PAL.whip; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
      ctx.restore();
      // 套索中: 腰間繩圈
      if (s.lassoing) {
        ctx.lineWidth = 3; ctx.strokeStyle = PAL.rope;
        ctx.beginPath(); ctx.ellipse(-12, 10, 6, 4, 0.4, 0, Math.PI * 2); ctx.stroke();
      }
      // 舉盾: 面向側的弧形盾 + 剩餘時機(弧長)
      if (parry) {
        var p = clamp(num(s.parryLeft, 0) / num(s.parryDur, 0.2), 0, 1);
        ctx.save(); ctx.rotate(ang);
        ctx.lineCap = 'round';
        ctx.lineWidth = 9; ctx.strokeStyle = PAL.outline;
        ctx.beginPath(); ctx.arc(0, 0, 25, -1.1, 1.1); ctx.stroke();
        ctx.lineWidth = 5; ctx.strokeStyle = PAL.parry;
        ctx.beginPath(); ctx.arc(0, 0, 25, -1.1, 1.1); ctx.stroke();
        ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(0, 0, 25, -1.1 * p, 1.1 * p); ctx.stroke();
        ctx.restore();
      }
      // 暈眩: 頭上繞圈星星 + 剩餘弧
      if (stun) {
        var sl = clamp(num(s.stunLeft, 0) / num(s.stunDur, 1.5), 0, 1);
        for (var i = 0; i < 3; i++) {
          var a = t * 5 + i * Math.PI * 2 / 3;
          star(ctx, Math.cos(a) * 14, -22 + Math.sin(a) * 4, 5, PAL.gold, PAL.outline);
        }
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,210,58,0.8)';
        ctx.beginPath(); ctx.arc(0, 0, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sl); ctx.stroke();
      }
      ctx.restore();
    },

    // ---------- 野生魔物 90×90 ----------
    drawWildMonster: function (ctx, s) {
      ctx.save();
      var x = num(s.x, 0), y = num(s.y, 0), sp = SP[s.species] ? s.species : 'fire', dir = s.dir === -1 ? -1 : 1, t = now();
      var sx = 0;
      if (s.lassoed) sx = Math.sin(t * 40) * 2.5;
      ctx.translate(x + sx, y);
      ctx.beginPath(); ctx.ellipse(0, 26, 24, 6, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      if (s.dashing) {
        for (var k = 2; k >= 1; k--) {
          ctx.save(); ctx.translate(-dir * k * 6, 0); ctx.globalAlpha = 0.18 * (3 - k);
          creature(ctx, sp, dir, false, t); ctx.restore();
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-dir * 26, -6); ctx.lineTo(-dir * 40, -6); ctx.moveTo(-dir * 26, 8); ctx.lineTo(-dir * 42, 8); ctx.stroke();
      }
      // 施法預備: 種類色外光脈動
      if (s.casting) {
        var pa = 0.5 + 0.5 * Math.sin(t * 18);
        circle(ctx, 0, 0, 34 + pa * 4);
        ctx.fillStyle = SP[sp] ? SP[sp].base : PAL.fire; ctx.globalAlpha = 0.18 + 0.2 * pa; ctx.fill(); ctx.globalAlpha = 1;
      }
      creature(ctx, sp, dir, !!s.hit, t);
      if (s.weak && !s.lassoed) {
        ctx.globalAlpha = 0.3; ctx.fillStyle = '#2a1e3a';
        circle(ctx, 0, 0, 28); ctx.fill(); ctx.globalAlpha = 1;
      }
      // 被套住: 繩纏在身上
      if (s.lassoed) {
        ctx.lineWidth = 6; ctx.strokeStyle = PAL.outline;
        ctx.beginPath(); ctx.ellipse(0, 4, 26, 9, -0.25, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 3.5; ctx.strokeStyle = PAL.rope;
        ctx.beginPath(); ctx.ellipse(0, 4, 26, 9, -0.25, 0, Math.PI * 2); ctx.stroke();
      }
      // 施法預備的「!」
      if (s.casting) {
        rr(ctx, -dir * 34 - 6, -38, 12, 18, 4); ctx.fillStyle = PAL.rage; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
        txt(ctx, '!', -dir * 34, -29, 15, '#ffffff', 'center', 'bold', false);
      }
      // 血條
      var hp = clamp(num(s.hp, 1) / Math.max(1, num(s.maxHp, 1)), 0, 1);
      rr(ctx, -28, -44, 56, 7, 3); ctx.fillStyle = 'rgba(15,10,20,0.9)'; ctx.fill();
      rr(ctx, -27, -43, 54 * hp, 5, 2); ctx.fillStyle = s.weak ? PAL.rope : '#f4eee2'; ctx.fill();
      ctx.fillStyle = 'rgba(15,10,20,0.9)'; ctx.fillRect(-27 + 54 * 0.3 - 0.5, -43, 1.5, 5);
      if (s.weak && !s.lassoed) weakMark(ctx, dir * 33, -32);
      ctx.restore();
    },

    // ---------- 套索與繞圈進度 ----------
    drawLasso: function (ctx, s) {
      ctx.save();
      var x1 = num(s.x1, 0), y1 = num(s.y1, 0), x2 = num(s.x2, 0), y2 = num(s.y2, 0);
      var ten = clamp(num(s.len, 0) / Math.max(1, num(s.maxLen, 220)), 0, 1);
      var tl = clamp(1 - num(s.t, 0) / Math.max(0.01, num(s.limit, 5)), 0, 1);
      var prog = clamp(num(s.progress, 0), 0, 1);
      // 繩: 越鬆越下垂; 繃緊(> 0.8)變直、加粗、閃白
      var mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + (1 - ten) * 40;
      var taut = ten > 0.8, fl = taut ? 0.5 + 0.5 * Math.sin(now() * 30) : 0;
      ctx.lineCap = 'round';
      ctx.lineWidth = taut ? 8 : 6; ctx.strokeStyle = PAL.outline;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke();
      ctx.lineWidth = taut ? 4.5 : 3; ctx.strokeStyle = taut ? (fl > 0.5 ? '#ffffff' : PAL.rage) : PAL.rope;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke();
      // 進度環(粗, 繩色; 滿圈 = 收服)
      var R = 50;
      ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(15,10,20,0.75)';
      circle(ctx, x2, y2, R); ctx.stroke();
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(217,178,106,0.25)';
      circle(ctx, x2, y2, R); ctx.stroke();
      if (prog > 0) {
        ctx.lineWidth = 6; ctx.strokeStyle = prog >= 1 ? '#ffffff' : PAL.rope;
        ctx.beginPath(); ctx.arc(x2, y2, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog); ctx.stroke();
        var ea = -Math.PI / 2 + Math.PI * 2 * prog;
        circle(ctx, x2 + Math.cos(ea) * R, y2 + Math.sin(ea) * R, 5); ctx.fillStyle = '#ffffff'; ctx.fill();
      }
      // 時限: 外圈細虛線, 剩 30% 轉紅
      ctx.lineWidth = 2.5; ctx.setLineDash([4, 4]);
      ctx.strokeStyle = tl < 0.3 ? PAL.rage : 'rgba(244,238,226,0.7)';
      ctx.beginPath(); ctx.arc(x2, y2, R + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * tl); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    },

    // ---------- 技能 ----------
    drawHazard: function (ctx, s) {
      ctx.save();
      var x = num(s.x, 0), y = num(s.y, 0), r = Math.max(1, num(s.radius, 12)), kind = s.kind, big = !!s.big;
      var p = num(s.dur, 0) > 0 ? clamp(num(s.t, 0) / s.dur, 0, 1) : 0, t = now();
      var warn = s.phase === 'warn';
      if (kind === 'waterball') {
        var a = num(s.angle, 0), bx = Math.cos(a), by = Math.sin(a);
        ctx.lineCap = 'round';
        ctx.lineWidth = r * 1.2; ctx.strokeStyle = 'rgba(90,168,255,0.35)';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - bx * r * 2.4, y - by * r * 2.4); ctx.stroke();
        circle(ctx, x, y, r); ctx.fillStyle = PAL.water; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
        circle(ctx, x - r * 0.3, y - r * 0.3, r * 0.35); ctx.fillStyle = '#ffffff'; ctx.fill();
        if (big) { ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.gold; circle(ctx, x, y, r - 3); ctx.stroke(); }
        ctx.restore(); return;
      }
      var col = kind === 'firering' ? PAL.fire : kind === 'thunder' ? PAL.thunder : PAL.stone;
      if (kind === 'quake' && !warn) {
        // 震波: 外緣 = radius, 環寬 30(大招 40)
        var w = big ? 40 : 30, ri = Math.max(0, r - w);
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.arc(x, y, ri, 0, Math.PI * 2, true);
        ctx.fillStyle = 'rgba(160,80,210,0.55)'; ctx.fill('evenodd');
        ctx.lineWidth = 3; ctx.strokeStyle = '#e4c4ff'; circle(ctx, x, y, r - 1.5); ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; if (ri > 2) { circle(ctx, x, y, ri); ctx.stroke(); }
        // 碎石
        ctx.fillStyle = '#4a4252';
        for (var i = 0; i < 10; i++) {
          var aa = i * 0.628 + 0.3, rr2 = r - w / 2;
          ctx.fillRect(x + Math.cos(aa) * rr2 - 3, y + Math.sin(aa) * rr2 - 3, 6, 6);
        }
        if (big) { ctx.lineWidth = 3; ctx.strokeStyle = PAL.gold; circle(ctx, x, y, r - 5); ctx.stroke(); }
        ctx.restore(); return;
      }
      if (warn) {
        warnDisk(ctx, x, y, r, p, col);
        if (kind === 'thunder') {
          ctx.lineWidth = 2; ctx.strokeStyle = col;
          ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y); ctx.moveTo(x, y - 14); ctx.lineTo(x, y + 14); ctx.stroke();
        }
        if (kind === 'quake') {
          ctx.lineWidth = 2; ctx.strokeStyle = col;
          for (i = 0; i < 6; i++) {
            var qa = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(x + Math.cos(qa) * 10, y + Math.sin(qa) * 10);
            ctx.lineTo(x + Math.cos(qa + 0.2) * r * 0.5 * p, y + Math.sin(qa + 0.2) * r * 0.5 * p); ctx.stroke();
          }
        }
        if (big) { ctx.lineWidth = 3; ctx.strokeStyle = PAL.gold; ctx.setLineDash([10, 7]); circle(ctx, x, y, r - 6); ctx.stroke(); ctx.setLineDash([]); }
        ctx.restore(); return;
      }
      // 生效
      if (kind === 'firering') {
        circle(ctx, x, y, r); ctx.fillStyle = 'rgba(232,69,44,' + (0.5 - p * 0.15) + ')'; ctx.fill();
        circle(ctx, x, y, r * 0.6); ctx.fillStyle = 'rgba(255,196,58,0.25)'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = '#ffb07a'; circle(ctx, x, y, r - 2); ctx.stroke();
        var n = big ? 18 : 12;
        ctx.fillStyle = PAL.lavaHot;
        for (i = 0; i < n; i++) {
          var fa = i * Math.PI * 2 / n + t * 2, fh = 10 + Math.sin(t * 14 + i) * 4;
          var cx = x + Math.cos(fa) * (r - 4), cy = y + Math.sin(fa) * (r - 4);
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(fa + 1.57) * 5, cy + Math.sin(fa + 1.57) * 5);
          ctx.lineTo(cx - Math.cos(fa) * fh, cy - Math.sin(fa) * fh);
          ctx.lineTo(cx - Math.cos(fa + 1.57) * 5, cy - Math.sin(fa + 1.57) * 5); ctx.closePath(); ctx.fill();
        }
      } else if (kind === 'thunder') {
        var fade = 1 - p;
        circle(ctx, x, y, r); ctx.fillStyle = 'rgba(232,255,176,' + (0.65 * fade + 0.1) + ')'; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = PAL.thunder; circle(ctx, x, y, r - 1.5); ctx.stroke();
        ctx.lineJoin = 'miter';
        ctx.beginPath(); ctx.moveTo(x - 4, y - r - 40); ctx.lineTo(x + 10, y - r * 0.4); ctx.lineTo(x - 6, y - r * 0.2); ctx.lineTo(x + 4, y);
        ctx.lineWidth = 9; ctx.strokeStyle = PAL.outline; ctx.globalAlpha = fade; ctx.stroke();
        ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.globalAlpha = 1;
      } else {
        circle(ctx, x, y, r); ctx.fillStyle = 'rgba(160,80,210,0.4)'; ctx.fill();
      }
      if (big) {
        ctx.lineWidth = 4; ctx.strokeStyle = PAL.gold; circle(ctx, x, y, r - 7); ctx.stroke();
        ctx.lineWidth = 2; circle(ctx, x, y, r - 13); ctx.stroke();
      }
      ctx.restore();
    },

    // ---------- 揮鞭 ----------
    drawWhipCrack: function (ctx, s) {
      var dur = num(s.dur, 0.25) || 0.25, p = clamp(num(s.t, 0) / dur, 0, 1);
      if (num(s.t, 0) >= dur) return;
      ctx.save();
      var x = num(s.x, 0), y = num(s.y, 0), r = num(s.radius, 110), a = 1 - p;
      if (s.shape === 'circle') {
        circle(ctx, x, y, r); ctx.fillStyle = 'rgba(255,246,220,' + 0.18 * a + ')'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,246,220,' + a + ')';
        var sw = p * Math.PI * 2;
        ctx.beginPath(); ctx.arc(x, y, r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, p * 1.6)); ctx.stroke();
        ctx.lineWidth = 2; ctx.setLineDash([3, 6]); circle(ctx, x, y, r - 2); ctx.stroke(); ctx.setLineDash([]);
        void sw;
      } else {
        var c = -Math.PI / 2 + num(s.facing, 0) * Math.PI / 4, h = Math.PI / 3;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, c - h, c + h); ctx.closePath();
        ctx.fillStyle = 'rgba(255,246,220,' + 0.25 * a + ')'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,246,220,' + 0.6 * a + ')'; ctx.stroke();
        // 鞭身掃過
        var sa = c - h + 2 * h * Math.min(1, p * 1.5);
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + Math.cos(sa - 0.3) * r * 0.6, y + Math.sin(sa - 0.3) * r * 0.6, x + Math.cos(sa) * (r - 3), y + Math.sin(sa) * (r - 3));
        ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(27,20,36,' + a + ')'; ctx.stroke();
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,246,220,' + a + ')'; ctx.stroke();
        star(ctx, x + Math.cos(sa) * (r - 8), y + Math.sin(sa) * (r - 8), 7 * a + 2, 'rgba(255,255,255,' + a + ')');
      }
      ctx.restore();
    },

    // ---------- 哨音(波浪環 = 安撫) ----------
    drawWhistleWave: function (ctx, s) {
      var dur = num(s.dur, 0.25) || 0.25, p = clamp(num(s.t, 0) / dur, 0, 1);
      if (num(s.t, 0) >= dur) return;
      ctx.save();
      var x = num(s.x, 0), y = num(s.y, 0), r = num(s.radius, 140), a = 1 - p;
      circle(ctx, x, y, r); ctx.fillStyle = 'rgba(232,246,255,' + 0.12 * a + ')'; ctx.fill();
      for (var k = 0; k < 2; k++) {
        var rk = r * (k === 0 ? Math.min(1, 0.5 + p) : Math.min(1, 0.25 + p)) - 6;
        ctx.beginPath();
        for (var i = 0; i <= 72; i++) {
          var aa = i / 72 * Math.PI * 2, rw = rk + Math.sin(aa * 12) * 4;
          var px = x + Math.cos(aa) * rw, py = y + Math.sin(aa) * rw;
          if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.lineWidth = k === 0 ? 3 : 2; ctx.strokeStyle = 'rgba(232,246,255,' + a + ')'; ctx.stroke();
      }
      ctx.restore();
    },

    // ---------- 彈反閃光 120×120 ----------
    drawParryFlash: function (ctx, s) {
      var dur = num(s.dur, 0.25) || 0.25, p = clamp(num(s.t, 0) / dur, 0, 1);
      if (num(s.t, 0) >= dur) return;
      ctx.save();
      var x = num(s.x, 0), y = num(s.y, 0), a = 1 - p;
      ctx.translate(x, y);
      circle(ctx, 0, 0, 24 + p * 30); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(191,248,255,' + a + ')'; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,' + a + ')';
      for (var i = 0; i < 8; i++) {
        var aa = i * Math.PI / 4 + 0.2, l = i % 2 ? 40 : 58;
        ctx.beginPath();
        ctx.moveTo(Math.cos(aa - 0.12) * 18, Math.sin(aa - 0.12) * 18);
        ctx.lineTo(Math.cos(aa) * l, Math.sin(aa) * l);
        ctx.lineTo(Math.cos(aa + 0.12) * 18, Math.sin(aa + 0.12) * 18);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    },

    // ---------- 表演場(場地 + 觀眾席底 + 後台底) ----------
    drawShowArena: function (ctx) {
      ctx.save();
      // 觀眾席
      ctx.fillStyle = PAL.stands; ctx.fillRect(0, 130, 720, 120); ctx.fillRect(0, 1020, 720, 120);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (var i = 0; i < 6; i++) { ctx.fillRect(68 + i * 100, 140, 84, 100); ctx.fillRect(68 + i * 100, 1030, 84, 100); }
      // 場地外環
      ctx.fillStyle = '#2a2030'; ctx.fillRect(0, 250, 720, 770);
      // 沙地
      rr(ctx, 60, 270, 600, 730, 24); ctx.fillStyle = PAL.sand; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = PAL.sandDark; ctx.stroke();
      ctx.strokeStyle = 'rgba(140,110,70,0.35)'; ctx.lineWidth = 3;
      circle(ctx, 360, 635, 120); ctx.stroke();
      circle(ctx, 360, 635, 8); ctx.fillStyle = 'rgba(140,110,70,0.5)'; ctx.fill();
      // 後台
      ctx.fillStyle = '#1a1422'; ctx.fillRect(0, 1140, 720, 140);
      rr(ctx, 56, 1158, 608, 114, 10); ctx.fillStyle = '#251d30'; ctx.fill();
      ctx.save(); ctx.translate(30, 1215); ctx.rotate(-Math.PI / 2);
      txt(ctx, '後台', 0, 0, 16, PAL.textDim, 'center', 'bold');
      ctx.restore();
      ctx.restore();
    },

    // ---------- 表演魔物 100×100 ----------
    drawShowMonster: function (ctx, s) {
      ctx.save();
      var x = num(s.x, 0), y = num(s.y, 0), sp = SP[s.species] ? s.species : 'fire', dir = s.dir === -1 ? -1 : 1, t = now();
      var mode = s.mode || 'roam', rage = clamp(num(s.rage, 0), 0, 100);
      var wild = mode === 'charge' || mode === 'loose';
      var shake = 0;
      if (wild) shake = Math.sin(t * (num(s.chargeT, 0) > 0 ? 50 : 25)) * 2;
      ctx.translate(x + shake, y);
      ctx.beginPath(); ctx.ellipse(0, 22, 26, 6, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
      var scl = 0.95;
      if (mode === 'enter') {
        var ep = clamp(num(s.enterT, 0) / Math.max(0.01, num(s.enterDur, 0.5)), 0, 1);
        scl = 0.3 + 0.65 * ep;
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,' + (1 - ep) + ')';
        ctx.setLineDash([6, 5]); circle(ctx, 0, -4, 40 - ep * 6); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = 0.5 + 0.5 * ep;
      }
      // 失控 / 衝欄: 鋸齒怒紅外圈
      if (wild) {
        ctx.beginPath();
        for (var i = 0; i < 24; i++) {
          var a = i * Math.PI / 12 + t * 3, rr3 = i % 2 ? 31 : 40;
          var px = Math.cos(a) * rr3, py = -4 + Math.sin(a) * rr3;
          if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.closePath(); ctx.fillStyle = 'rgba(255,45,111,0.35)'; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.rage; ctx.stroke();
      }
      // 大招: 金色雙環
      if (s.big && !wild) {
        var bp = 0.5 + 0.5 * Math.sin(t * 10);
        circle(ctx, 0, -4, 36 + bp * 3); ctx.fillStyle = 'rgba(255,210,58,0.22)'; ctx.fill();
        ctx.lineWidth = 3.5; ctx.strokeStyle = PAL.gold; ctx.stroke();
        circle(ctx, 0, -4, 31); ctx.lineWidth = 2; ctx.stroke();
      }
      if (s.dashing) {
        for (var k = 2; k >= 1; k--) {
          ctx.save(); ctx.translate(-dir * k * 6, -4); ctx.scale(scl, scl); ctx.globalAlpha = 0.18 * (3 - k);
          creature(ctx, sp, dir, false, t); ctx.restore();
        }
      }
      // 表演中: 本體鼓起
      var pf = s.performing ? 1.08 : 1;
      ctx.save(); ctx.translate(0, -4); ctx.scale(scl * pf, scl * pf);
      creature(ctx, sp, dir, false, t);
      ctx.restore();
      ctx.globalAlpha = 1;
      // 本體上的 fx(長在本體)
      var fxp = clamp(num(s.fxT, 0) / Math.max(0.01, num(s.fxDur, 0.5)), 0, 1), fa = 1 - fxp;
      if (s.fx === 'ignited' && fxp < 1) {
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,140,40,' + fa + ')';
        circle(ctx, 0, -4, 30); ctx.stroke();
        ctx.fillStyle = 'rgba(255,196,58,' + fa + ')';
        for (i = 0; i < 3; i++) {
          var ux = -14 + i * 14, uy = -10 - fxp * 14;
          ctx.beginPath(); ctx.moveTo(ux - 5, uy + 5); ctx.lineTo(ux, uy - 2); ctx.lineTo(ux + 5, uy + 5); ctx.lineTo(ux, uy + 2); ctx.closePath(); ctx.fill();
        }
      } else if (s.fx === 'doused' && fxp < 1) {
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(90,168,255,' + fa + ')';
        circle(ctx, 0, -4, 30); ctx.stroke();
        ctx.fillStyle = 'rgba(207,232,255,' + fa + ')';
        for (i = 0; i < 3; i++) {
          var dx2 = -14 + i * 14, dy2 = -6 + fxp * 14;
          ctx.beginPath(); ctx.moveTo(dx2, dy2 - 6); ctx.quadraticCurveTo(dx2 + 5, dy2 + 2, dx2, dy2 + 4); ctx.quadraticCurveTo(dx2 - 5, dy2 + 2, dx2, dy2 - 6); ctx.fill();
        }
      } else if (s.fx === 'calmed' && fxp < 1) {
        ctx.beginPath();
        for (i = 0; i <= 48; i++) {
          var ca = i / 48 * Math.PI * 2, cr = 33 + Math.sin(ca * 10) * 3;
          var cx = Math.cos(ca) * cr, cy = -4 + Math.sin(ca) * cr;
          if (i) ctx.lineTo(cx, cy); else ctx.moveTo(cx, cy);
        }
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(232,246,255,' + fa + ')'; ctx.stroke();
      }
      // 表演瞬間: 種類色放射
      if (s.performing) {
        ctx.lineWidth = 3; ctx.strokeStyle = (SP[sp] || SP.fire).light; ctx.lineCap = 'round';
        for (i = 0; i < 8; i++) {
          var ra = i * Math.PI / 4 + 0.39;
          ctx.beginPath(); ctx.moveTo(Math.cos(ra) * 34, -4 + Math.sin(ra) * 34); ctx.lineTo(Math.cos(ra) * 42, -4 + Math.sin(ra) * 42); ctx.stroke();
        }
      }
      // 怒氣條(y 30~40, 寬 84)
      var bw = 84, bx = -42, by = 31, bh = 9;
      rr(ctx, bx - 2, by - 2, bw + 4, bh + 4, 4); ctx.fillStyle = 'rgba(15,10,20,0.92)'; ctx.fill();
      // 紅線段底紋(80~99)
      ctx.save(); ctx.beginPath(); ctx.rect(bx + bw * 0.8, by, bw * 0.19, bh); ctx.clip();
      ctx.fillStyle = 'rgba(255,45,111,0.35)'; ctx.fillRect(bx + bw * 0.8, by, bw * 0.19, bh);
      ctx.strokeStyle = 'rgba(255,45,111,0.8)'; ctx.lineWidth = 1.5;
      for (i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(bx + bw * 0.8 + i * 4, by + bh); ctx.lineTo(bx + bw * 0.8 + i * 4 + bh, by); ctx.stroke(); }
      ctx.restore();
      var fillC = rage >= 100 ? PAL.rage : rage >= 80 ? '#ff7a9e' : rage >= 50 ? '#ffffff' : '#8a8098';
      if (rage > 0) { ctx.fillStyle = fillC; ctx.fillRect(bx, by, bw * rage / 100, bh); }
      // 門檻 50 刻度
      ctx.fillStyle = PAL.outline; ctx.fillRect(bx + bw * 0.5 - 1, by - 2, 2, bh + 4);
      ctx.fillStyle = PAL.gold; ctx.fillRect(bx + bw * 0.5 - 0.5, by - 1, 1, bh + 2);
      // 紅線起點
      ctx.fillStyle = PAL.rage; ctx.fillRect(bx + bw * 0.8 - 1, by - 2, 2, bh + 4);
      // 頭上: 冷掉環 / 制伏進度
      if (wild) {
        var sub = clamp(num(s.subdue, 0), 0, 3) | 0;
        rr(ctx, -22, -50, 44, 18, 9); ctx.fillStyle = 'rgba(15,10,20,0.92)'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = PAL.calm; ctx.stroke();
        txt(ctx, sub + '/3', 0, -41, 13, PAL.calm, 'center', 'bold', false);
        if (mode === 'charge' && num(s.chargeT, 0) > 0) {
          var cp = clamp(num(s.chargeT, 0) / Math.max(0.01, num(s.chargeDur, 1.5)), 0, 1);
          ctx.lineWidth = 3; ctx.strokeStyle = PAL.rage;
          ctx.beginPath(); ctx.arc(30, -38, 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cp); ctx.stroke();
        }
      } else if (num(s.coolT, 0) > 0 && mode === 'roam') {
        var cp2 = clamp(num(s.coolT, 0) / Math.max(0.01, num(s.coolDur, 8)), 0, 1);
        circle(ctx, 0, -40, 9); ctx.fillStyle = 'rgba(15,10,20,0.85)'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(160,200,255,0.35)'; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = '#a0c8ff';
        ctx.beginPath(); ctx.arc(0, -40, 6.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cp2); ctx.stroke();
      }
      ctx.restore();
    },

    // ---------- 後台一格 70×100 ----------
    drawBenchSlot: function (ctx, s) {
      ctx.save();
      var x = num(s.x, 0), y = num(s.y, 0);
      ctx.translate(x, y);
      var more = num(s.more, 0);
      rr(ctx, -33, -48, 66, 96, 8);
      ctx.fillStyle = s.next ? '#3c2f4c' : '#2c2338'; ctx.fill();
      ctx.lineWidth = s.next ? 3 : 1.5; ctx.strokeStyle = s.next ? PAL.text : PAL.hudLine; ctx.stroke();
      if (more > 0) {
        txt(ctx, '+' + more, 0, 0, 22, PAL.textDim, 'center', 'bold');
      } else if (s.species) {
        ctx.save(); ctx.translate(0, 4); ctx.scale(0.85, 0.85);
        if (!s.next) ctx.globalAlpha = 0.75;
        creature(ctx, s.species, 1, false, 0);
        ctx.restore();
        if (s.next) {
          // 指向場地的小三角
          ctx.beginPath(); ctx.moveTo(0, -45); ctx.lineTo(7, -36); ctx.lineTo(-7, -36); ctx.closePath();
          ctx.fillStyle = PAL.text; ctx.fill();
        }
      }
      ctx.restore();
    },

    // ---------- 圍欄 100×16 ----------
    drawFence: function (ctx, s) {
      ctx.save();
      var x = num(s.x, 0), y = num(s.y, 0);
      ctx.translate(x, y);
      if (!s.broken) {
        ctx.fillStyle = PAL.fence; ctx.fillRect(-50, -5, 100, 6);
        ctx.fillStyle = '#7a5028'; ctx.fillRect(-50, 1, 100, 3);
        ctx.fillStyle = '#c89050';
        for (var i = 0; i < 3; i++) ctx.fillRect(-46 + i * 42, -8, 8, 16);
        ctx.lineWidth = 1.5; ctx.strokeStyle = PAL.outline;
        ctx.strokeRect(-49.5, -5, 99, 9);
      } else {
        // 破損: 斷成兩截往外翹, 中間怒紅缺口
        ctx.fillStyle = 'rgba(255,45,111,0.35)'; ctx.fillRect(-20, -8, 40, 16);
        ctx.save(); ctx.translate(-48, 0); ctx.rotate(-0.12);
        ctx.fillStyle = '#6a4a2a'; ctx.fillRect(0, -4, 26, 6); ctx.fillRect(0, -6, 7, 12);
        ctx.restore();
        ctx.save(); ctx.translate(48, 0); ctx.rotate(0.12);
        ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-26, -4, 26, 6); ctx.fillRect(-7, -6, 7, 12);
        ctx.restore();
        ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.rage;
        ctx.beginPath(); ctx.moveTo(-20, -7); ctx.lineTo(-14, 0); ctx.lineTo(-20, 7); ctx.moveTo(20, -7); ctx.lineTo(14, 0); ctx.lineTo(20, 7); ctx.stroke();
      }
      ctx.restore();
    },

    // ---------- 觀眾 60×90 ----------
    drawVisitor: function (ctx, s) {
      ctx.save();
      var x = num(s.x, 0), y = num(s.y, 0), seat = num(s.seat, 0) | 0, mode = s.mode || 'watch', t = now();
      ctx.translate(x, y);
      // 座椅
      rr(ctx, -24, 18, 48, 22, 4); ctx.fillStyle = '#4e3a56'; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
      if (mode === 'empty') {
        rr(ctx, -20, -10, 40, 30, 4); ctx.fillStyle = '#3e2e46'; ctx.fill(); ctx.stroke();
        ctx.restore(); return;
      }
      var shirts = ['#d0a060', '#7a9ab0', '#b07a9a', '#9ab07a', '#c08060', '#8a8ac0'];
      var shirt = shirts[seat % shirts.length];
      if (mode === 'scared') {
        ctx.save(); ctx.translate(Math.sin(t * 30) * 2, -4); ctx.rotate(0.18);
        rr(ctx, -14, -6, 28, 30, 8); ctx.fillStyle = '#8a8496'; ctx.fill(); ctx.stroke();
        circle(ctx, 0, -18, 12); ctx.fillStyle = '#e8d8c8'; ctx.fill(); ctx.stroke();
        // 驚嚇: 大眼 + O 嘴
        circle(ctx, -4, -20, 3); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
        circle(ctx, 4, -20, 3); ctx.fill(); ctx.stroke();
        circle(ctx, 0, -12, 2.5); ctx.fillStyle = PAL.outline; ctx.fill();
        // 舉手
        ctx.lineWidth = 4; ctx.strokeStyle = '#e8d8c8';
        ctx.beginPath(); ctx.moveTo(-12, -2); ctx.lineTo(-20, -24); ctx.moveTo(12, -2); ctx.lineTo(20, -24); ctx.stroke();
        ctx.restore();
        txt(ctx, '!', 22, -36, 18, PAL.rage, 'center', 'bold');
      } else {
        var bob = Math.sin(t * 3 + seat) * 1.5;
        rr(ctx, -14, -2 + bob, 28, 26, 8); ctx.fillStyle = shirt; ctx.fill(); ctx.stroke();
        circle(ctx, 0, -14 + bob, 11); ctx.fillStyle = '#e8d8c8'; ctx.fill(); ctx.stroke();
        circle(ctx, -4, -15 + bob, 1.8); ctx.fillStyle = PAL.outline; ctx.fill();
        circle(ctx, 4, -15 + bob, 1.8); ctx.fill();
      }
      ctx.restore();
    },

    // ---------- 標題卡(全畫面) ----------
    drawTitleCard: function (ctx, s) {
      ctx.save();
      var show = s.stage === 'show';
      ctx.fillStyle = 'rgba(12,8,18,0.92)'; ctx.fillRect(0, 0, 720, 1280);
      rr(ctx, 80, 420, 560, 380, 24); ctx.fillStyle = PAL.hudBg; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = show ? PAL.gold : PAL.rope; ctx.stroke();
      txt(ctx, '第 ' + num(s.day, 1) + ' 天', 360, 500, 34, PAL.textDim, 'center', 'bold');
      txt(ctx, show ? '表演場' : '地下城', 360, 580, 64, show ? PAL.gold : PAL.text, 'center', 'bold');
      // 小景: 地下城 = 四種魔物 / 表演場 = 圍欄 + 金幣
      var t = now();
      if (show) {
        for (var i = 0; i < 3; i++) coin(ctx, 300 + i * 60, 660 + Math.sin(t * 4 + i) * 4, 12);
      } else {
        for (i = 0; i < 4; i++) {
          ctx.save(); ctx.translate(240 + i * 80, 666); ctx.scale(0.75, 0.75); creature(ctx, SPECIES[i], 1, false, t); ctx.restore();
        }
      }
      var bl = 0.6 + 0.4 * Math.sin(t * 4);
      ctx.globalAlpha = bl;
      txt(ctx, '按', 300, 744, 24, PAL.text, 'center', 'bold');
      keycap(ctx, 340, 744, 'Z', 30);
      txt(ctx, '開始', 398, 744, 24, PAL.text, 'center', 'bold');
      ctx.restore();
    },

    // ---------- 商店項目 600×140 ----------
    drawShopItem: function (ctx, s) {
      ctx.save();
      var x = num(s.x, 360), y = num(s.y, 0), sel = !!s.selected, aff = !!s.affordable;
      var info = {
        whipPower: ['鞭力', '每鞭傷害 +1'],
        ropeBag: ['繩袋', '捕獸繩 +1'],
        armor: ['護甲', '心 +1'],
        silverWhistle: ['銀哨', '吹哨冷卻 −0.4 秒']
      }[s.item] || ['?', ''];
      ctx.translate(x, y);
      rr(ctx, -298, -68, 596, 136, 14);
      ctx.fillStyle = sel ? '#3a2e4a' : '#251d30'; ctx.fill();
      ctx.lineWidth = sel ? 5 : 2; ctx.strokeStyle = sel ? PAL.text : PAL.hudLine; ctx.stroke();
      if (sel) {
        ctx.beginPath(); ctx.moveTo(-292, -14); ctx.lineTo(-280, 0); ctx.lineTo(-292, 14); ctx.closePath(); ctx.fillStyle = PAL.text; ctx.fill();
      }
      // 圖示
      circle(ctx, -220, 0, 40); ctx.fillStyle = '#1a1422'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.hudLine; ctx.stroke();
      ctx.save(); ctx.translate(-220, 0);
      if (s.item === 'whipPower') {
        ctx.lineCap = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = PAL.outline;
        ctx.beginPath(); ctx.moveTo(-18, 18); ctx.quadraticCurveTo(-4, -26, 22, -12); ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = PAL.whip; ctx.stroke();
        ctx.fillStyle = PAL.hat; ctx.fillRect(-24, 12, 10, 14);
      } else if (s.item === 'ropeBag') {
        ropeLoop(ctx, -2, -2, 16, true);
      } else if (s.item === 'armor') {
        heart(ctx, 0, 2, 18, PAL.heart);
      } else {
        ctx.beginPath(); ctx.ellipse(-4, 4, 18, 11, 0, 0, Math.PI * 2); ctx.fillStyle = '#d8dde8'; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
        ctx.fillStyle = '#d8dde8'; ctx.fillRect(10, -4, 16, 8); ctx.strokeRect(10, -4, 16, 8);
        circle(ctx, -4, 4, 4); ctx.fillStyle = PAL.outline; ctx.fill();
      }
      ctx.restore();
      txt(ctx, info[0], -160, -22, 32, PAL.text, 'left', 'bold');
      txt(ctx, 'Lv ' + num(s.level, 0), -60, -22, 22, PAL.textDim, 'left', 'bold');
      txt(ctx, info[1], -160, 22, 22, PAL.textDim, 'left', 'normal');
      // 價格
      coin(ctx, 180, 0, 14);
      txt(ctx, String(num(s.cost, 0)), 204, 0, 32, aff ? PAL.gold : '#7a6e88', 'left', 'bold');
      if (!aff) {
        ctx.lineWidth = 3; ctx.strokeStyle = PAL.rage;
        ctx.beginPath(); ctx.moveTo(164, 18); ctx.lineTo(276, -18); ctx.stroke();
      }
      ctx.restore();
    },

    // ---------- 按鈕(x, y 左上角) ----------
    drawButton: function (ctx, s) {
      ctx.save();
      var x = num(s.x, 0), y = num(s.y, 0), w = num(s.w, 200), h = num(s.h, 80), sel = !!s.selected;
      rr(ctx, x + 2, y + 2, w - 4, h - 4, 16);
      ctx.fillStyle = sel ? PAL.gold : '#3a2e4a'; ctx.fill();
      ctx.lineWidth = sel ? 5 : 2; ctx.strokeStyle = sel ? PAL.text : PAL.hudLine; ctx.stroke();
      txt(ctx, s.label || '', x + w / 2, y + h / 2, 34, sel ? PAL.outline : PAL.text, 'center', 'bold', sel ? false : undefined);
      ctx.restore();
    },

    // ---------- 飄字 ----------
    drawFloatText: function (ctx, s) {
      var dur = num(s.dur, 1) || 1, p = clamp(num(s.t, 0) / dur, 0, 1);
      if (num(s.t, 0) >= dur) return;
      ctx.save();
      var x = num(s.x, 0), y = num(s.y, 0) - p * 40, kind = s.kind || 'gold';
      ctx.globalAlpha = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
      var st = {
        gold: [22, PAL.gold], bigGold: [32, PAL.gold], repUp: [20, PAL.rep], repDown: [22, PAL.rage],
        capture: [30, PAL.rope], parry: [26, PAL.parry], enter: [22, PAL.text], leave: [20, PAL.textDim]
      }[kind] || [22, PAL.text];
      var size = st[0];
      if (kind === 'bigGold' && p < 0.2) size = size * (1.3 - p * 1.5);
      ctx.font = 'bold ' + size + 'px ' + FONT;
      var w = ctx.measureText ? ctx.measureText(String(s.text || '')).width : 0;
      if (kind === 'gold' || kind === 'bigGold') coin(ctx, x - w / 2 - size * 0.55, y, size * 0.38);
      if (kind === 'repUp' || kind === 'repDown') star(ctx, x - w / 2 - size * 0.55, y, size * 0.45, st[1], PAL.outline);
      txt(ctx, s.text || '', x, y, size, st[1], 'center', 'bold', kind === 'bigGold' ? '#8a1030' : undefined);
      ctx.restore();
    },

    // ---------- 結算 ----------
    drawResultPanel: function (ctx, s) {
      ctx.save();
      ctx.fillStyle = 'rgba(12,8,18,0.94)'; ctx.fillRect(0, 0, 720, 1280);
      rr(ctx, 60, 180, 600, 900, 28); ctx.fillStyle = PAL.hudBg; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = PAL.gold; ctx.stroke();
      txt(ctx, '三天的表演結束', 360, 250, 36, PAL.text, 'center', 'bold');
      var n = clamp(num(s.stars, 0), 0, 3) | 0;
      for (var i = 0; i < 3; i++) star(ctx, 240 + i * 120, 360, 46, i < n ? PAL.gold : '#3a3048', PAL.outline);
      var rows = [['總名聲', num(s.rep, 0), PAL.rep], ['累計金幣', num(s.goldEarned, 0), PAL.gold], ['大招次數', num(s.bigCount, 0), PAL.rage]];
      for (i = 0; i < rows.length; i++) {
        var yy = 480 + i * 80;
        txt(ctx, rows[i][0], 140, yy, 28, PAL.textDim, 'left', 'bold');
        txt(ctx, rows[i][1], 580, yy, 40, rows[i][2], 'right', 'bold');
      }
      txt(ctx, '陣容', 140, 740, 28, PAL.textDim, 'left', 'bold');
      var rc = s.rosterCount || {};
      for (i = 0; i < 4; i++) {
        var cx = 165 + i * 130;
        ctx.save(); ctx.translate(cx, 820); ctx.scale(0.9, 0.9); creature(ctx, SPECIES[i], 1, false, 0); ctx.restore();
        txt(ctx, '×' + num(rc[SPECIES[i]], 0), cx, 878, 26, PAL.text, 'center', 'bold');
      }
      var bl = 0.6 + 0.4 * Math.sin(now() * 4);
      ctx.globalAlpha = bl;
      txt(ctx, '按', 300, 990, 26, PAL.text, 'center', 'bold');
      keycap(ctx, 340, 990, 'Z', 32);
      txt(ctx, '重來', 398, 990, 26, PAL.text, 'center', 'bold');
      ctx.restore();
    },

    // ---------- HUD(y 0~120) ----------
    drawHud: function (ctx, s) {
      var ph = s.phase || 'dungeon';
      if (ph === 'guide' || ph === 'title' || ph === 'result') return;
      ctx.save();
      ctx.fillStyle = PAL.hudBg; ctx.fillRect(0, 0, 720, 120);
      ctx.fillStyle = PAL.hudLine; ctx.fillRect(0, 118, 720, 2);
      var stageName = { dungeon: '地下城', show: '表演場', shop: '商店' }[ph] || '';
      txt(ctx, '第 ' + num(s.day, 1) + ' 天 ' + stageName, 20, 24, 22, PAL.text, 'left', 'bold');
      // 右上: 金幣 / 名聲
      coin(ctx, 520, 24, 11);
      txt(ctx, String(num(s.gold, 0)), 538, 24, 24, PAL.gold, 'left', 'bold');
      star(ctx, 622, 24, 12, PAL.rep, PAL.outline);
      txt(ctx, String(num(s.rep, 0)), 640, 24, 24, PAL.rep, 'left', 'bold');
      // 陣容小圖(各種類隻數)
      var rc = s.rosterCount || {}, rx = 20;
      for (var i = 0; i < 4; i++) {
        var c = num(rc[SPECIES[i]], 0);
        if (c <= 0) continue;
        circle(ctx, rx + 8, 54, 7); ctx.fillStyle = (SP[SPECIES[i]] || SP.fire).base; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
        txt(ctx, '×' + c, rx + 18, 54, 14, PAL.text, 'left', 'bold');
        rx += 50;
      }
      if (ph === 'dungeon' || ph === 'show') {
        // 時間條
        var tl = clamp(num(s.timeLeft, 0) / Math.max(1, num(s.timeMax, 60)), 0, 1);
        rr(ctx, 230, 14, 230, 20, 10); ctx.fillStyle = '#120e18'; ctx.fill();
        if (tl > 0) { rr(ctx, 232, 16, 226 * tl, 16, 8); ctx.fillStyle = tl < 0.17 ? PAL.rage : '#cfc4dc'; ctx.fill(); }
        txt(ctx, Math.ceil(num(s.timeLeft, 0)) + ' 秒', 470, 24, 18, PAL.text, 'left', 'bold');
      }
      if (ph === 'dungeon') {
        var mh = num(s.maxHearts, 5), hh = num(s.hearts, 0);
        for (i = 0; i < mh; i++) heart(ctx, 30 + i * 26, 82, 10, i < hh ? PAL.heart : '#3a3048');
        var rm = num(s.ropeMax, 3), ro = num(s.ropes, 0);
        for (i = 0; i < rm; i++) ropeLoop(ctx, 28 + i * 24, 104, 7, i < ro);
      }
      // 冷卻鍵
      function cd(cx, label, left, max) {
        var p = max > 0 ? clamp(left / max, 0, 1) : 0;
        circle(ctx, cx, 84, 20); ctx.fillStyle = p > 0 ? '#2a2234' : '#efe6d4'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
        if (p > 0) {
          ctx.beginPath(); ctx.moveTo(cx, 84); ctx.arc(cx, 84, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - p)); ctx.closePath();
          ctx.fillStyle = 'rgba(239,230,212,0.4)'; ctx.fill();
        }
        txt(ctx, label, cx, 84, 18, p > 0 ? PAL.textDim : PAL.outline, 'center', 'bold', false);
      }
      function cdLbl(cx, t) { txt(ctx, t, cx, 111, 12, PAL.textDim, 'center', 'bold'); }
      if (ph === 'dungeon') {
        cd(600, 'X', num(s.rollCd, 0), num(s.rollCdMax, 0.8)); cdLbl(600, '翻滾');
        cd(660, 'C', num(s.parryCd, 0), num(s.parryCdMax, 0.6)); cdLbl(660, '彈反');
      } else if (ph === 'show') {
        cd(600, 'X', num(s.whistleCd, 0), num(s.whistleCdMax, 2)); cdLbl(600, '吹哨');
        cd(660, 'C', num(s.parryCd, 0), num(s.parryCdMax, 0.6)); cdLbl(660, '彈反');
      }
      if (s.message) {
        ctx.font = 'bold 20px ' + FONT;
        var mw = (ctx.measureText ? ctx.measureText(String(s.message)).width : 200) + 32;
        mw = Math.min(mw, 330);
        rr(ctx, 380 - mw / 2, 70, mw, 34, 17); ctx.fillStyle = 'rgba(255,45,111,0.22)'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = PAL.rage; ctx.stroke();
        txt(ctx, s.message, 380, 87, 20, PAL.text, 'center', 'bold');
      }
      if (ph === 'shop') {
        txt(ctx, '強化', 360, 84, 30, PAL.text, 'center', 'bold');
        // 底部操作提示(美術畫, RD 不畫)
        keycap(ctx, 262, 1264, '↑↓', 24);
        txt(ctx, '選擇', 312, 1264, 18, PAL.textDim, 'center', 'bold');
        keycap(ctx, 382, 1264, 'Z', 24);
        txt(ctx, '確定', 428, 1264, 18, PAL.textDim, 'center', 'bold');
      }
      ctx.restore();
    },

    // ---------- 說明頁示意圖(只畫在 x,y,w,h 框內) ----------
    drawGuidePage: function (ctx, s) {
      var page = num(s.page, 0) | 0, X = num(s.x, 0), Y = num(s.y, 0), W = num(s.w, 600), H = num(s.h, 600);
      var VW = 600, VH = 560, k = Math.min(W / VW, H / VH);
      ctx.save();
      ctx.beginPath(); ctx.rect(X, Y, W, H); ctx.clip();
      ctx.translate(X + (W - VW * k) / 2, Y + (H - VH * k) / 2);
      ctx.scale(k, k);
      rr(ctx, 0, 0, VW, VH, 18); ctx.fillStyle = '#1a1422'; ctx.fill();
      var A = Art;
      if (page === 0) guide0(ctx, A);
      else if (page === 1) guide1(ctx, A);
      else if (page === 2) guide2(ctx, A);
      else guide3(ctx, A);
      ctx.restore();
    }
  };

  function label(ctx, s, x, y, color) { txt(ctx, s, x, y, 18, color || PAL.text, 'center', 'bold'); }
  function arrow(ctx, x1, y1, x2, y2, color, w) {
    ctx.lineCap = 'round'; ctx.lineWidth = w || 4; ctx.strokeStyle = color;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.5) * 14, y2 - Math.sin(a - 0.5) * 14);
    ctx.lineTo(x2 - Math.cos(a + 0.5) * 14, y2 - Math.sin(a + 0.5) * 14);
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }
  function floorPatch(ctx, A, cols, rows, ox, oy, zone, extra) {
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var kind = extra ? extra(c, r) : 'floor';
      A.drawTile(ctx, { x: ox + c * 60 + 30, y: oy + r * 60 + 30, kind: kind, zone: zone, nest: false });
    }
  }

  // 第 1 頁: 揮鞭打火蜥蜴 / 翻滾穿過火圈 / 舉盾彈反水彈
  function guide0(ctx, A) {
    floorPatch(ctx, A, 10, 9, 0, 20, 'lava', function (c, r) { return r === 0 ? 'wall' : 'floor'; });
    // 上: 揮鞭
    A.drawWhipCrack(ctx, { x: 120, y: 170, shape: 'arc', facing: 2, radius: 110, t: 0.08, dur: 0.25 });
    A.drawTamer(ctx, { x: 120, y: 170, facing: 2, rolling: false, parryLeft: 0, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
    A.drawWildMonster(ctx, { x: 205, y: 160, species: 'fire', hp: 6, maxHp: 10, hit: true, weak: false, lassoed: false, casting: false, dashing: false, dir: -1 });
    keycap(ctx, 120, 222, 'Z', 28);
    // 右上: 翻滾穿過火圈
    A.drawHazard(ctx, { x: 450, y: 180, kind: 'firering', big: false, phase: 'active', radius: 90, t: 0.1, dur: 0.5 });
    A.drawWildMonster(ctx, { x: 450, y: 180, species: 'fire', hp: 10, maxHp: 10, hit: false, weak: false, lassoed: false, casting: false, dashing: false, dir: -1 });
    ctx.globalAlpha = 0.35;
    A.drawTamer(ctx, { x: 345, y: 290, facing: 1, rolling: false, parryLeft: 0, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
    ctx.globalAlpha = 1;
    ctx.setLineDash([6, 6]); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(244,238,226,0.7)';
    ctx.beginPath(); ctx.moveTo(360, 275); ctx.lineTo(400, 235); ctx.stroke(); ctx.setLineDash([]);
    A.drawTamer(ctx, { x: 420, y: 215, facing: 1, rolling: true, parryLeft: 0, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
    keycap(ctx, 300, 300, 'X', 28);
    // 下: 舉盾彈反水彈
    A.drawWildMonster(ctx, { x: 470, y: 440, species: 'water', hp: 7, maxHp: 7, hit: true, weak: false, lassoed: false, casting: false, dashing: false, dir: -1 });
    A.drawTamer(ctx, { x: 200, y: 440, facing: 2, rolling: false, parryLeft: 0.15, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
    A.drawParryFlash(ctx, { x: 230, y: 440, t: 0.05, dur: 0.25 });
    A.drawHazard(ctx, { x: 245, y: 440, kind: 'waterball', big: false, phase: 'active', radius: 12, t: 0, dur: 0, angle: Math.PI });
    ctx.setLineDash([8, 6]);
    arrow(ctx, 280, 412, 420, 412, PAL.parry, 3);
    ctx.setLineDash([]);
    keycap(ctx, 200, 492, 'C', 28);
    // 方向鍵貼在中間馴獸師旁
    keycap(ctx, 60, 110, '←↑↓→', 26);
  }

  // 第 2 頁: 殘血魔物被套住、繞圈、進度環一半; 角落: 進度滿收服
  function guide1(ctx, A) {
    floorPatch(ctx, A, 7, 9, 0, 20, 'ruins');
    var mx = 210, my = 280;
    // 繞圈路線(虛線箭頭)
    ctx.setLineDash([8, 8]); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(244,238,226,0.75)';
    ctx.beginPath(); ctx.arc(mx, my, 130, Math.PI * 0.05, Math.PI * 1.9); ctx.stroke(); ctx.setLineDash([]);
    var ea = Math.PI * 1.9;
    arrow(ctx, mx + Math.cos(ea - 0.15) * 130, my + Math.sin(ea - 0.15) * 130, mx + Math.cos(ea) * 130, my + Math.sin(ea) * 130, 'rgba(244,238,226,0.9)', 3);
    A.drawWildMonster(ctx, { x: mx, y: my, species: 'stone', hp: 3, maxHp: 16, hit: false, weak: true, lassoed: true, casting: false, dashing: false, dir: 1 });
    var tx = mx + Math.cos(Math.PI) * 130, ty = my + Math.sin(Math.PI) * 130;
    A.drawLasso(ctx, { x1: tx, y1: ty, x2: mx, y2: my, progress: 0.5, t: 2, limit: 5, len: 130, maxLen: 220 });
    A.drawTamer(ctx, { x: tx, y: ty, facing: 0, rolling: false, parryLeft: 0, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: true });
    // 右側: 可套的殘血魔物(套索前)
    A.drawWildMonster(ctx, { x: 210, y: 500, species: 'fire', hp: 2, maxHp: 10, hit: false, weak: true, lassoed: false, casting: false, dashing: false, dir: 1 });
    label(ctx, '殘血', 290, 500, PAL.rope);
    // 角落小圖: 滿圈收服
    rr(ctx, 420, 300, 170, 200, 14); ctx.fillStyle = '#251d30'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.hudLine; ctx.stroke();
    ctx.save(); ctx.translate(505, 390); ctx.scale(0.8, 0.8); ctx.translate(-505, -390);
    A.drawLasso(ctx, { x1: 505, y1: 390, x2: 505, y2: 390, progress: 1, t: 4, limit: 5, len: 0, maxLen: 220 });
    ctx.globalAlpha = 0.45;
    A.drawWildMonster(ctx, { x: 505, y: 390, species: 'stone', hp: 3, maxHp: 16, hit: false, weak: true, lassoed: true, casting: false, dashing: false, dir: 1 });
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.lineWidth = 8; ctx.strokeStyle = PAL.outline; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(480, 392); ctx.lineTo(498, 410); ctx.lineTo(532, 368); ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    A.drawFloatText(ctx, { x: 505, y: 470, text: '收服!', kind: 'capture', t: 0, dur: 1 });
  }

  // 第 3 頁: 左 揮鞭 → 怒氣上、表演、金幣; 右 哨音 → 怒氣下
  function guide2(ctx, A) {
    rr(ctx, 10, 20, 285, 520, 16); ctx.fillStyle = PAL.sand; ctx.fill();
    rr(ctx, 305, 20, 285, 520, 16); ctx.fill();
    // 左
    A.drawWhipCrack(ctx, { x: 150, y: 380, shape: 'circle', facing: 0, radius: 110, t: 0.06, dur: 0.25 });
    A.drawHazard(ctx, { x: 150, y: 250, kind: 'firering', big: false, phase: 'active', radius: 90, t: 0.1, dur: 0.5 });
    A.drawShowMonster(ctx, { x: 150, y: 250, species: 'fire', rage: 70, mode: 'roam', performing: true, big: false, fx: 'none', fxT: 0, fxDur: 0.5, dashing: false, coolT: 0, coolDur: 8, enterT: 0, enterDur: 0.5, subdue: 0, chargeT: 0, chargeDur: 1.5, dir: 1 });
    A.drawTamer(ctx, { x: 150, y: 400, facing: 0, rolling: false, parryLeft: 0, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
    arrow(ctx, 210, 300, 210, 262, PAL.rage, 4);
    A.drawFloatText(ctx, { x: 150, y: 120, text: '+8', kind: 'gold', t: 0.1, dur: 1 });
    A.drawFloatText(ctx, { x: 230, y: 150, text: '+5', kind: 'gold', t: 0.3, dur: 1 });
    keycap(ctx, 150, 455, 'Z', 28);
    // 右
    A.drawWhistleWave(ctx, { x: 447, y: 380, radius: 140, t: 0.12, dur: 0.25 });
    A.drawShowMonster(ctx, { x: 447, y: 270, species: 'thunder', rage: 45, mode: 'roam', performing: false, big: false, fx: 'calmed', fxT: 0.1, fxDur: 0.5, dashing: false, coolT: 0, coolDur: 8, enterT: 0, enterDur: 0.5, subdue: 0, chargeT: 0, chargeDur: 1.5, dir: -1 });
    A.drawTamer(ctx, { x: 447, y: 400, facing: 0, rolling: false, parryLeft: 0, parryDur: 0.2, stunLeft: 0, stunDur: 1.5, blink: false, lassoing: false });
    arrow(ctx, 507, 262, 507, 300, PAL.calm, 4);
    keycap(ctx, 447, 455, 'X', 28);
  }

  // 第 4 頁: 怒氣條 → 紅線大招 → 全滿失控撞欄; 下方流程圖示
  function guide3(ctx, A) {
    // 大怒氣條
    var bx = 40, by = 230, bw = 520, bh = 30;
    rr(ctx, bx - 4, by - 4, bw + 8, bh + 8, 8); ctx.fillStyle = 'rgba(15,10,20,0.95)'; ctx.fill();
    var g = ctx.createLinearGradient ? ctx.createLinearGradient(bx, 0, bx + bw, 0) : null;
    if (g) { g.addColorStop(0, '#8a8098'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.8, '#ff7a9e'); g.addColorStop(1, PAL.rage); ctx.fillStyle = g; }
    else ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx, by, bw, bh);
    ctx.save(); ctx.beginPath(); ctx.rect(bx + bw * 0.8, by, bw * 0.19, bh); ctx.clip();
    ctx.strokeStyle = 'rgba(255,45,111,0.9)'; ctx.lineWidth = 3;
    for (var i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(bx + bw * 0.8 + i * 10 - 30, by + bh); ctx.lineTo(bx + bw * 0.8 + i * 10, by); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = PAL.gold; ctx.fillRect(bx + bw * 0.5 - 2, by - 8, 4, bh + 16);
    ctx.fillStyle = PAL.rage; ctx.fillRect(bx + bw * 0.8 - 2, by - 8, 4, bh + 16);
    // 紅線段 → 大招魔物(上方)
    var mx = bx + bw * 0.62;
    A.drawHazard(ctx, { x: mx, y: 120, kind: 'firering', big: true, phase: 'active', radius: 95, t: 0.1, dur: 0.5 });
    A.drawShowMonster(ctx, { x: mx, y: 120, species: 'fire', rage: 88, mode: 'roam', performing: true, big: true, fx: 'none', fxT: 0, fxDur: 0.5, dashing: false, coolT: 0, coolDur: 8, enterT: 0, enterDur: 0.5, subdue: 0, chargeT: 0, chargeDur: 1.5, dir: 1 });
    ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.strokeStyle = PAL.rage;
    ctx.beginPath(); ctx.moveTo(bx + bw * 0.89, by - 8); ctx.lineTo(mx + 40, 165); ctx.stroke(); ctx.setLineDash([]);
    for (i = 0; i < 6; i++) coin(ctx, mx + 110 + (i % 3) * 26, 50 + Math.floor(i / 3) * 30 + (i % 2) * 8, 11);
    A.drawFloatText(ctx, { x: mx + 140, y: 120, text: '大招 ×2', kind: 'bigGold', t: 0.3, dur: 1 });
    // 最右端 → 失控撞欄撲向觀眾
    ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.strokeStyle = PAL.rage;
    ctx.beginPath(); ctx.moveTo(bx + bw, by + bh + 6); ctx.lineTo(470, 370); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = PAL.stands; ctx.fillRect(330, 400, 260, 70);
    A.drawVisitor(ctx, { x: 375, y: 432, seat: 0, mode: 'scared' });
    A.drawVisitor(ctx, { x: 555, y: 432, seat: 1, mode: 'watch' });
    A.drawFence(ctx, { x: 420, y: 385, side: 'bottom', broken: true });
    A.drawFence(ctx, { x: 520, y: 385, side: 'bottom', broken: false });
    A.drawShowMonster(ctx, { x: 455, y: 425, species: 'thunder', rage: 100, mode: 'loose', performing: false, big: false, fx: 'none', fxT: 0, fxDur: 0.5, dashing: false, coolT: 0, coolDur: 8, enterT: 0, enterDur: 0.5, subdue: 0, chargeT: 0, chargeDur: 1.5, dir: -1 });
    A.drawFloatText(ctx, { x: 375, y: 360, text: '-3', kind: 'repDown', t: 0.2, dur: 1 });
    // 大叉
    ctx.lineCap = 'round'; ctx.lineWidth = 10; ctx.strokeStyle = PAL.outline;
    ctx.beginPath(); ctx.moveTo(370, 300); ctx.lineTo(406, 336); ctx.moveTo(406, 300); ctx.lineTo(370, 336); ctx.stroke();
    ctx.lineWidth = 6; ctx.strokeStyle = PAL.rage; ctx.stroke();
    // 下方流程: 地下城 → 表演場 → 商店, 三天後評星
    var fy = 515;
    rr(ctx, 30, fy - 26, 120, 52, 10); ctx.fillStyle = PAL.wall; ctx.fill(); label(ctx, '地下城', 90, fy);
    arrow(ctx, 158, fy, 192, fy, PAL.textDim, 3);
    rr(ctx, 200, fy - 26, 120, 52, 10); ctx.fillStyle = PAL.sandDark; ctx.fill(); label(ctx, '表演場', 260, fy);
    arrow(ctx, 328, fy, 362, fy, PAL.textDim, 3);
    rr(ctx, 370, fy - 26, 100, 52, 10); ctx.fillStyle = '#3a2e4a'; ctx.fill(); label(ctx, '商店', 420, fy);
    label(ctx, '×3 天', 512, fy - 14, PAL.textDim);
    star(ctx, 512, fy + 12, 12, PAL.gold, PAL.outline);
  }

  window.Art = Art;
})();
