// 紅線馴獸場 — 美術(Canvas 2D 幾何繪製, 無外部資源)
// 契約: window.Art; 每個函式 (ctx, state), 自己 save/restore。
(function () {
  'use strict';

  var P = {
    bg: '#120e18',
    hudBg: '#1d1726',
    hudLine: '#3a3048',
    text: '#f4ecd8',
    textDim: '#a89cb8',
    outline: '#140f1a',
    // 種類色(色相兩兩 ≥ 60° 或飽和度大差; 灰階 196 / 141 / 98 / 57 四階)
    fire: '#ff6a1a',
    water: '#1f6fd0',
    thunder: '#e0aaff',
    stone: '#3e3833',
    stoneHi: '#8a8076',
    // 玩家與動作
    tamer: '#f4ecd8',
    tamerHat: '#7a4a2a',
    whip: '#fff0b8',
    whistle: '#9effd6',
    // 捕捉圈
    catchDim: '#1f4a1a',
    catchLit: '#6dff3a',
    // 怒氣
    rageLow: '#8aa0b8',
    rageShow: '#ffb000',
    rageRed: '#ff2a4a',
    // 經濟
    gold: '#ffd23a',
    rep: '#ff7ad9',
    heart: '#ff4d5e',
    // 地形
    wall: '#221c28',
    wallTop: '#3a3044',
    lava: '#ff5a1a',
    lavaCrust: '#7a1e08',
    waterTile: '#2a5fa8',
    floorCrag: '#5b6170',
    floorRuins: '#8a7a5e',
    floorLava: '#5a3b33',
    floorPond: '#3f5a50',
    floorHall: '#4e4a52',
    sand: '#b09a72',
    stands: '#3b2f45',
    fence: '#a0703c',
    tutorial: '#fff8e6'
  };

  var SPECIES_COLOR = { fire: P.fire, water: P.water, thunder: P.thunder, stone: P.stone };
  var ZONE_SPECIES = { crag: 'thunder', ruins: 'stone', lava: 'fire', pond: 'water' };
  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';

  // ---------- 小工具 ----------
  function rgba(hex, a) {
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  function lerpHex(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    var ca = [1, 3, 5].map(function (i) { return parseInt(a.slice(i, i + 2), 16); });
    var cb = [1, 3, 5].map(function (i) { return parseInt(b.slice(i, i + 2), 16); });
    return 'rgb(' + ca.map(function (v, i) { return Math.round(v + (cb[i] - v) * t); }).join(',') + ')';
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
  // 文字一律帶深色描邊(任何底色都可讀)
  function txt(ctx, s, x, y, size, color, align, opt) {
    opt = opt || {};
    ctx.font = (opt.weight || 'bold') + ' ' + size + 'px ' + FONT;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = opt.baseline || 'middle';
    if (opt.stroke !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = opt.strokeW || Math.max(3, size * 0.18);
      ctx.strokeStyle = opt.strokeColor || P.outline;
      ctx.strokeText(String(s), x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(String(s), x, y);
  }
  function starPath(ctx, x, y, r) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var rad = i % 2 === 0 ? r : r * 0.45;
      var px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  function star(ctx, x, y, r, filled) {
    starPath(ctx, x, y, r);
    ctx.lineWidth = 2;
    ctx.strokeStyle = P.outline;
    if (filled) { ctx.fillStyle = P.gold; ctx.fill(); }
    else { ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill(); }
    ctx.stroke();
  }
  function coin(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = P.gold;
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.2);
    ctx.strokeStyle = '#8a5a00';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(1, r * 0.14);
    ctx.strokeStyle = '#c89000';
    ctx.stroke();
  }
  function heartPath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.45);
    ctx.bezierCurveTo(x - s * 0.55, y + s * 0.05, x - s * 0.5, y - s * 0.45, x, y - s * 0.18);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 0.45, x + s * 0.55, y + s * 0.05, x, y + s * 0.45);
    ctx.closePath();
  }
  function heart(ctx, x, y, s, filled) {
    heartPath(ctx, x, y, s);
    ctx.fillStyle = filled ? P.heart : 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = filled ? P.outline : '#6a5a78';
    ctx.stroke();
  }
  function ropeIcon(ctx, x, y, s, filled) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = filled ? '#e8c48a' : '#4a4052';
    ctx.beginPath(); ctx.ellipse(x, y, s * 0.45, s * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y, s * 0.28, s * 0.18, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + s * 0.4, y + s * 0.1); ctx.lineTo(x + s * 0.5, y + s * 0.42); ctx.stroke();
  }
  function keycap(ctx, x, y, label, w) {
    w = w || 34;
    rr(ctx, x - w / 2, y - 16, w, 32, 6);
    ctx.fillStyle = '#f4ecd8'; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - w / 2 + 4, y + 11); ctx.lineTo(x + w / 2 - 4, y + 11);
    ctx.strokeStyle = '#b8ac98'; ctx.lineWidth = 2; ctx.stroke();
    txt(ctx, label, x, y - 1, 18, P.outline, 'center', { stroke: false });
  }
  function arrowKeys(ctx, x, y) {
    // 方向鍵圖示(十字四鍵, 緊湊)
    var s = 18;
    [[0, -1], [-1, 0], [1, 0], [0, 1]].forEach(function (d) {
      var cx = x + d[0] * (s + 1), cy = y + d[1] * (s + 1) * 0.5 + (d[1] === 0 ? s * 0.5 : (d[1] < 0 ? 0 : s * 0.5));
      rr(ctx, cx - s / 2, cy - s / 2, s, s, 3);
      ctx.fillStyle = '#f4ecd8'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
      ctx.beginPath();
      var a = Math.atan2(d[1], d[0]);
      ctx.moveTo(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5);
      ctx.lineTo(cx + Math.cos(a + 2.4) * 5, cy + Math.sin(a + 2.4) * 5);
      ctx.lineTo(cx + Math.cos(a - 2.4) * 5, cy + Math.sin(a - 2.4) * 5);
      ctx.closePath(); ctx.fillStyle = P.outline; ctx.fill();
    });
  }
  function bigCheck(ctx, x, y, s) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x - s * 0.12, y + s * 0.38); ctx.lineTo(x + s * 0.55, y - s * 0.4);
    ctx.lineWidth = s * 0.3; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.lineWidth = s * 0.17; ctx.strokeStyle = P.catchLit; ctx.stroke();
  }
  function bigCross(ctx, x, y, s) {
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.45, y - s * 0.45); ctx.lineTo(x + s * 0.45, y + s * 0.45);
    ctx.moveTo(x + s * 0.45, y - s * 0.45); ctx.lineTo(x - s * 0.45, y + s * 0.45);
    ctx.lineWidth = s * 0.3; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.lineWidth = s * 0.17; ctx.strokeStyle = P.rageRed; ctx.stroke();
  }
  function facingAngle(f) { return ((f || 0) * 45 - 90) * Math.PI / 180; }

  // ---------- 魔物本體(地下城 / 表演場 / 說明 / 結算共用) ----------
  // 原點為身體中心, R 為身體基準半徑; o: { dir, hit, casting, gray, angry }
  function monsterBody(ctx, sp, R, o) {
    o = o || {};
    var col = o.hit ? '#ffffff' : (o.gray ? '#6a6470' : (SPECIES_COLOR[sp] || P.fire));
    var dark = o.hit ? '#e8e8e8' : (o.gray ? '#4a4450' : lerpHex(SPECIES_COLOR[sp] || P.fire, '#000000', 0.35));
    var eye = o.angry || o.casting ? P.rageRed : '#ffffff';
    ctx.save();
    // 落影
    ctx.beginPath(); ctx.ellipse(0, R * 0.98, R * 0.85, R * 0.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    if (o.casting) {
      // 施法預備: 身後一圈種類色光盤
      ctx.beginPath(); ctx.arc(0, 0, R * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = rgba(SPECIES_COLOR[sp] || P.fire, 0.35); ctx.fill();
      ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.strokeStyle = SPECIES_COLOR[sp] || P.fire; ctx.stroke(); ctx.setLineDash([]);
    }
    if ((o.dir || 1) < 0) ctx.scale(-1, 1);
    ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    if (sp === 'fire') {
      // 尾巴 + 尾焰
      ctx.beginPath(); ctx.moveTo(-R * 0.55, R * 0.15);
      ctx.quadraticCurveTo(-R * 1.2, R * 0.1, -R * 1.05, -R * 0.4);
      ctx.lineWidth = R * 0.28; ctx.strokeStyle = P.outline; ctx.stroke();
      ctx.lineWidth = R * 0.16; ctx.strokeStyle = col; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-R * 1.05, -R * 0.85);
      ctx.quadraticCurveTo(-R * 0.82, -R * 0.45, -R * 1.05, -R * 0.35);
      ctx.quadraticCurveTo(-R * 1.28, -R * 0.45, -R * 1.05, -R * 0.85);
      ctx.fillStyle = o.hit ? '#ffffff' : '#ffd23a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
      // 腳
      ctx.lineWidth = 3;
      [-0.5, -0.1, 0.25, 0.55].forEach(function (lx) {
        ctx.beginPath(); ctx.ellipse(R * lx, R * 0.55, R * 0.13, R * 0.16, 0, 0, Math.PI * 2);
        ctx.fillStyle = dark; ctx.fill(); ctx.stroke();
      });
      // 身體
      ctx.beginPath(); ctx.ellipse(-R * 0.05, R * 0.15, R * 0.72, R * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill(); ctx.stroke();
      // 背斑
      ctx.fillStyle = dark;
      [-0.35, 0.05].forEach(function (sx) { ctx.beginPath(); ctx.arc(R * sx, R * 0.02, R * 0.1, 0, Math.PI * 2); ctx.fill(); });
      // 頭
      ctx.beginPath(); ctx.arc(R * 0.6, -R * 0.12, R * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(R * 0.72, -R * 0.24, R * 0.13, 0, Math.PI * 2); ctx.fillStyle = eye; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(R * 0.76, -R * 0.24, R * 0.06, 0, Math.PI * 2); ctx.fillStyle = P.outline; ctx.fill();
    } else if (sp === 'water') {
      // 觸手
      ctx.lineWidth = R * 0.12;
      [-0.5, -0.17, 0.17, 0.5].forEach(function (tx, i) {
        ctx.beginPath(); ctx.moveTo(R * tx, R * 0.05);
        ctx.quadraticCurveTo(R * (tx + (i % 2 ? 0.18 : -0.18)), R * 0.5, R * tx, R * 0.88);
        ctx.strokeStyle = P.outline; ctx.lineWidth = R * 0.2; ctx.stroke();
        ctx.strokeStyle = o.hit ? '#ffffff' : lerpHex(col, '#ffffff', 0.35); ctx.lineWidth = R * 0.1; ctx.stroke();
      });
      // 傘蓋
      ctx.lineWidth = 3; ctx.strokeStyle = P.outline;
      ctx.beginPath();
      ctx.moveTo(-R * 0.85, R * 0.08);
      ctx.arc(0, R * 0.08, R * 0.85, Math.PI, Math.PI * 2);
      for (var k = 0; k < 4; k++) {
        var x0 = R * 0.85 - k * R * 0.425;
        ctx.quadraticCurveTo(x0 - R * 0.21, R * 0.32, x0 - R * 0.425, R * 0.08);
      }
      ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-R * 0.35, -R * 0.38, R * 0.18, R * 0.1, -0.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
      [-0.05, 0.38].forEach(function (ex) {
        ctx.beginPath(); ctx.arc(R * ex, -R * 0.12, R * 0.12, 0, Math.PI * 2); ctx.fillStyle = eye; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(R * ex + R * 0.04, -R * 0.12, R * 0.05, 0, Math.PI * 2); ctx.fillStyle = P.outline; ctx.fill();
      });
    } else if (sp === 'thunder') {
      // 後翼
      ctx.beginPath(); ctx.moveTo(-R * 0.1, -R * 0.15); ctx.lineTo(-R * 1.05, -R * 0.8); ctx.lineTo(-R * 0.75, -R * 0.1); ctx.lineTo(-R * 1.0, R * 0.25); ctx.lineTo(-R * 0.2, R * 0.3); ctx.closePath();
      ctx.fillStyle = dark; ctx.fill(); ctx.stroke();
      // 身體
      ctx.beginPath(); ctx.arc(0, R * 0.08, R * 0.62, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
      // 腹
      ctx.beginPath(); ctx.ellipse(R * 0.1, R * 0.3, R * 0.32, R * 0.25, 0, 0, Math.PI * 2); ctx.fillStyle = o.hit ? '#ffffff' : '#f6e8ff'; ctx.fill();
      // 冠羽閃電(白黃)
      ctx.beginPath(); ctx.moveTo(-R * 0.05, -R * 0.5); ctx.lineTo(R * 0.12, -R * 0.95); ctx.lineTo(R * 0.12, -R * 0.68); ctx.lineTo(R * 0.32, -R * 0.82); ctx.lineTo(R * 0.25, -R * 0.45); ctx.closePath();
      ctx.fillStyle = o.hit ? '#ffffff' : '#fff6a0'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      // 喙
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(R * 0.55, -R * 0.08); ctx.lineTo(R * 0.98, R * 0.06); ctx.lineTo(R * 0.55, R * 0.2); ctx.closePath();
      ctx.fillStyle = o.hit ? '#ffffff' : '#ffb000'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(R * 0.3, -R * 0.12, R * 0.13, 0, Math.PI * 2); ctx.fillStyle = eye; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(R * 0.34, -R * 0.12, R * 0.06, 0, Math.PI * 2); ctx.fillStyle = P.outline; ctx.fill();
    } else {
      // 石像鬼: 方塊 + 角 + 小翼
      ctx.beginPath(); ctx.moveTo(-R * 0.78, -R * 0.2); ctx.lineTo(-R * 1.08, -R * 0.45); ctx.lineTo(-R * 0.95, R * 0.15); ctx.closePath();
      ctx.fillStyle = o.hit ? '#ffffff' : '#2a2622'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(R * 0.78, -R * 0.2); ctx.lineTo(R * 1.08, -R * 0.45); ctx.lineTo(R * 0.95, R * 0.15); ctx.closePath();
      ctx.fill(); ctx.stroke();
      [-1, 1].forEach(function (s) {
        ctx.beginPath(); ctx.moveTo(s * R * 0.62, -R * 0.62); ctx.lineTo(s * R * 0.78, -R * 1.02); ctx.lineTo(s * R * 0.32, -R * 0.62); ctx.closePath();
        ctx.fillStyle = o.hit ? '#ffffff' : P.stoneHi; ctx.fill(); ctx.stroke();
      });
      rr(ctx, -R * 0.8, -R * 0.65, R * 1.6, R * 1.45, R * 0.28);
      ctx.fillStyle = col; ctx.fill(); ctx.stroke();
      // 亮邊與裂紋(讓深色石身在暗地面上也有輪廓)
      ctx.beginPath(); ctx.moveTo(-R * 0.62, -R * 0.5); ctx.lineTo(R * 0.62, -R * 0.5);
      ctx.lineWidth = 2.5; ctx.strokeStyle = o.hit ? '#ffffff' : P.stoneHi; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-R * 0.45, R * 0.25); ctx.lineTo(-R * 0.2, R * 0.42); ctx.lineTo(-R * 0.32, R * 0.62);
      ctx.moveTo(R * 0.5, R * 0.1); ctx.lineTo(R * 0.3, R * 0.32);
      ctx.lineWidth = 2; ctx.stroke();
      [-0.3, 0.3].forEach(function (ex) {
        ctx.beginPath(); ctx.rect(R * ex - R * 0.14, -R * 0.25, R * 0.28, R * 0.14);
        ctx.fillStyle = o.angry || o.casting ? P.rageRed : '#fff6a0'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = P.outline; ctx.stroke();
      });
    }
    ctx.restore();
  }

  // 怒氣條(表演場魔物與說明頁共用)
  function rageColor(r) { return r >= 80 ? P.rageRed : (r >= 50 ? P.rageShow : P.rageLow); }
  function rageBar(ctx, x, y, w, h, rage) {
    rage = Math.max(0, Math.min(100, rage || 0));
    rr(ctx, x - 2, y - 2, w + 4, h + 4, 3); ctx.fillStyle = P.outline; ctx.fill();
    ctx.fillStyle = '#2c2434'; ctx.fillRect(x, y, w, h);
    // 紅線區底(80~99)
    ctx.fillStyle = rgba(P.rageRed, 0.35);
    ctx.fillRect(x + w * 0.8, y, w * 0.19, h);
    // 填色
    ctx.fillStyle = rageColor(rage);
    ctx.fillRect(x, y, w * rage / 100, h);
    // 紅線區上下框(紅線)
    ctx.fillStyle = P.rageRed;
    ctx.fillRect(x + w * 0.8, y - 2, w * 0.19, 2);
    ctx.fillRect(x + w * 0.8, y + h, w * 0.19, 2);
    // 50 表演門檻刻度
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + w * 0.5 - 1, y - 2, 2, h + 4);
    // 100 終點(失控)
    ctx.fillStyle = P.outline;
    ctx.fillRect(x + w * 0.99, y, w * 0.01 + 0.5, h);
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

    // 地下城一格(60×60, x,y 為中心)
    drawTile: function (ctx, s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      var floorCol = {
        crag: P.floorCrag, ruins: P.floorRuins, lava: P.floorLava, pond: P.floorPond, hall: P.floorHall
      }[s.zone] || P.floorHall;
      var k = s.kind;
      if (k === 'wall') {
        ctx.fillStyle = P.wall; ctx.fillRect(-30, -30, 60, 60);
        ctx.fillStyle = P.wallTop; ctx.fillRect(-30, -30, 60, 8);
        ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-30, -6); ctx.lineTo(30, -6); ctx.moveTo(-30, 14); ctx.lineTo(30, 14);
        ctx.moveTo(0, -22); ctx.lineTo(0, -6); ctx.moveTo(-15, -6); ctx.lineTo(-15, 14); ctx.moveTo(15, -6); ctx.lineTo(15, 14);
        ctx.moveTo(0, 14); ctx.lineTo(0, 30);
        ctx.stroke();
      } else {
        // 地板底
        var base = k === 'lava' ? P.lava : (k === 'water' ? P.waterTile : floorCol);
        ctx.fillStyle = base; ctx.fillRect(-30, -30, 60, 60);
        if (k === 'lava') {
          ctx.fillStyle = '#ffb000';
          ctx.beginPath(); ctx.arc(-10, -8, 6, 0, Math.PI * 2); ctx.arc(12, 12, 5, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = P.lavaCrust; ctx.lineWidth = 4; ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(-30, -20); ctx.lineTo(-14, -18); ctx.lineTo(-4, -28);
          ctx.moveTo(-28, 10); ctx.lineTo(-8, 4); ctx.lineTo(2, 18); ctx.lineTo(28, 22);
          ctx.moveTo(8, -6); ctx.lineTo(28, -12);
          ctx.stroke();
        } else if (k === 'water') {
          ctx.strokeStyle = 'rgba(200,230,255,0.55)'; ctx.lineWidth = 2.5;
          for (var wy = -16; wy <= 20; wy += 18) {
            ctx.beginPath();
            ctx.moveTo(-24, wy);
            ctx.quadraticCurveTo(-16, wy - 6, -8, wy); ctx.quadraticCurveTo(0, wy + 6, 8, wy); ctx.quadraticCurveTo(16, wy - 6, 24, wy);
            ctx.stroke();
          }
        } else {
          // 地板紋理(依區不同, 低對比)
          ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.5;
          ctx.strokeRect(-29, -29, 58, 58);
          ctx.fillStyle = 'rgba(255,255,255,0.07)';
          if (s.zone === 'crag') {
            ctx.beginPath(); ctx.arc(-12, 10, 4, 0, Math.PI * 2); ctx.arc(14, -12, 3, 0, Math.PI * 2); ctx.arc(8, 16, 2.5, 0, Math.PI * 2); ctx.fill();
          } else if (s.zone === 'ruins') {
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath(); ctx.moveTo(0, -29); ctx.lineTo(0, 29); ctx.moveTo(-29, 0); ctx.lineTo(29, 0); ctx.stroke();
          } else if (s.zone === 'lava') {
            ctx.fillStyle = 'rgba(255,90,26,0.12)';
            ctx.beginPath(); ctx.arc(10, 8, 6, 0, Math.PI * 2); ctx.fill();
          } else if (s.zone === 'pond') {
            ctx.fillStyle = 'rgba(160,220,170,0.12)';
            ctx.beginPath(); ctx.ellipse(-8, 6, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
          }
        }
        if (k === 'pillar') {
          ctx.beginPath(); ctx.ellipse(0, 18, 24, 8, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
          ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2);
          ctx.fillStyle = P.wallTop; ctx.fill();
          ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fillStyle = '#4c4058'; ctx.fill();
          ctx.beginPath(); ctx.arc(-6, -7, 6, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill();
        }
        if (s.nest) {
          var sc = SPECIES_COLOR[ZONE_SPECIES[s.zone]] || '#c8b890';
          ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(30,22,16,0.35)'; ctx.fill();
          ctx.setLineDash([6, 5]); ctx.lineWidth = 3; ctx.strokeStyle = rgba(sc === P.stone ? P.stoneHi : sc, 0.7); ctx.stroke(); ctx.setLineDash([]);
          ctx.strokeStyle = 'rgba(220,190,120,0.55)'; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-12, 4); ctx.lineTo(-2, -2); ctx.moveTo(-6, 10); ctx.lineTo(8, 4); ctx.moveTo(2, -10); ctx.lineTo(12, -4);
          ctx.stroke();
        }
      }
      ctx.restore();
    },

    // 馴獸師(判定半徑 18 = 身體圓外緣; 64×64 框)
    drawTamer: function (ctx, s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      var a = facingAngle(s.facing);
      var fx = Math.cos(a), fy = Math.sin(a);
      if (s.blink) {
        ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.setLineDash([5, 5]); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = 0.45;
      }
      // 落影
      ctx.beginPath(); ctx.ellipse(0, 14, 16, 5, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      if (s.rolling) {
        // 翻滾: 身後速度弧 + 身體縮成球、帽子飛到身側
        ctx.strokeStyle = 'rgba(255,240,184,0.8)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (var i = 0; i < 3; i++) {
          var off = (i - 1) * 9;
          var px = -fx * 20 + -fy * off, py = -fy * 20 + fx * off;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - fx * 10, py - fy * 10); ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(0, 0, 16.5, 0, Math.PI * 2);
        ctx.fillStyle = P.tamer; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 10, a + 0.5, a + 3.6);
        ctx.lineWidth = 3; ctx.strokeStyle = P.tamerHat; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 5, a + 2, a + 5);
        ctx.stroke();
      } else {
        // 拿鞭的手(朝面向)
        var hx = fx * 22, hy = fy * 22;
        ctx.beginPath(); ctx.moveTo(fx * 12, fy * 12); ctx.lineTo(hx, hy);
        ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = P.tamer; ctx.stroke();
        // 身體(判定圓)
        ctx.beginPath(); ctx.arc(0, 0, 16.5, 0, Math.PI * 2);
        ctx.fillStyle = s.stunned ? '#c8c0b0' : P.tamer; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
        // 帽子(俯視): 帽簷 + 帽頂, 帽頂偏向面向
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fillStyle = P.tamerHat; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.beginPath(); ctx.arc(-fx * 2, -fy * 2, 7, 0, Math.PI * 2); ctx.fillStyle = '#9a6238'; ctx.fill(); ctx.stroke();
        // 面向小三角(帽簷前緣)
        ctx.beginPath();
        ctx.moveTo(fx * 17, fy * 17);
        ctx.lineTo(fx * 10 - fy * 6, fy * 10 + fx * 6);
        ctx.lineTo(fx * 10 + fy * 6, fy * 10 - fx * 6);
        ctx.closePath(); ctx.fillStyle = P.outline; ctx.fill();
        // 鞭柄
        ctx.beginPath(); ctx.arc(hx, hy, 5, 0, Math.PI * 2); ctx.fillStyle = P.tamerHat; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(hx, hy);
        ctx.quadraticCurveTo(hx - fy * 8 + fx * 2, hy + fx * 8 + fy * 2, hx - fx * 6 - fy * 4, hy - fy * 6 + fx * 4);
        ctx.lineWidth = 2; ctx.strokeStyle = P.tamerHat; ctx.stroke();
      }
      if (s.stunned) {
        // 暈眩: 頭上 3 顆小星繞圈
        ctx.globalAlpha = 1;
        [[-14, -22], [0, -25], [14, -22]].forEach(function (p) {
          starPath(ctx, p[0], p[1], 5);
          ctx.fillStyle = '#fff6a0'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = P.outline; ctx.stroke();
        });
        ctx.beginPath(); ctx.ellipse(0, -20, 18, 5, 0, Math.PI * 0.05, Math.PI * 0.95);
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,246,160,0.8)'; ctx.stroke();
      }
      ctx.restore();
    },

    // 野生魔物(90×90)
    drawWildMonster: function (ctx, s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      var R = 25;
      monsterBody(ctx, s.species, R, { dir: s.dir, hit: s.hit, casting: s.casting });
      // 捕捉圈
      if (s.weak) {
        var p = Math.max(0, Math.min(1, s.pulse || 0));
        ctx.beginPath(); ctx.arc(0, 2, 36, 0, Math.PI * 2);
        if (s.green) {
          ctx.fillStyle = rgba(P.catchLit, 0.16); ctx.fill();
          ctx.lineWidth = 9; ctx.strokeStyle = P.outline; ctx.stroke();
          ctx.lineWidth = 6; ctx.strokeStyle = P.catchLit; ctx.stroke();
          // 準星四刻(往內)
          ctx.lineWidth = 4; ctx.lineCap = 'round';
          for (var q = 0; q < 4; q++) {
            var aa = Math.PI / 4 + q * Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(aa) * 36, 2 + Math.sin(aa) * 36);
            ctx.lineTo(Math.cos(aa) * 26, 2 + Math.sin(aa) * 26);
            ctx.strokeStyle = P.catchLit; ctx.stroke();
          }
        } else {
          ctx.lineWidth = 2 + 2 * p + 2; ctx.strokeStyle = P.outline; ctx.stroke();
          ctx.lineWidth = 2 + 2 * p; ctx.strokeStyle = lerpHex(P.catchDim, '#4fbf2a', p); ctx.stroke();
        }
      }
      // 血條(30% 殘血門檻刻度)
      var bw = 56, bx = -28, by = -44, bh = 6;
      var ratio = s.maxHp ? Math.max(0, Math.min(1, s.hp / s.maxHp)) : 0;
      rr(ctx, bx - 1.5, by - 1.5, bw + 3, bh + 3, 2); ctx.fillStyle = P.outline; ctx.fill();
      ctx.fillStyle = '#2c2434'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = rgba(P.catchLit, 0.25); ctx.fillRect(bx, by, bw * 0.3, bh);
      ctx.fillStyle = s.weak ? P.catchLit : '#f4ecd8';
      ctx.fillRect(bx, by, bw * ratio, bh);
      ctx.fillStyle = P.outline; ctx.fillRect(bx + bw * 0.3 - 1, by, 2, bh);
      ctx.restore();
    },

    // 魔物技能(地下城與表演場共用)
    // 危險字典: 預警 = 虛線外緣 + 由中心長大的填色(長滿 = 生效); 生效 = 實線粗外緣 + 斜紋
    drawHazard: function (ctx, s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      var t = s.t || 0;
      function hatch(r, col) {
        ctx.save();
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
        ctx.strokeStyle = col; ctx.lineWidth = 4;
        ctx.beginPath();
        for (var d = -r * 2; d < r * 2; d += 18) { ctx.moveTo(d - r, -r); ctx.lineTo(d + r, r); }
        ctx.stroke();
        ctx.restore();
      }
      function warnDisc(r, col, dur) {
        var f = Math.max(0, Math.min(1, t / dur));
        ctx.beginPath(); ctx.arc(0, 0, r * f, 0, Math.PI * 2);
        ctx.fillStyle = rgba(col, 0.3); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, r - 2, 0, Math.PI * 2);
        ctx.fillStyle = rgba(col, 0.08); ctx.fill();
        ctx.setLineDash([12, 8]);
        ctx.lineWidth = 6; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke();
        ctx.setLineDash([]);
      }
      function activeDisc(r, col) {
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = rgba(col, 0.42); ctx.fill();
        hatch(r, rgba(col, 0.55));
        ctx.beginPath(); ctx.arc(0, 0, r - 3, 0, Math.PI * 2);
        ctx.lineWidth = 9; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke();
      }
      var r = s.radius || 60;
      if (s.kind === 'firering') {
        if (s.phase === 'warn') warnDisc(r, P.fire, 0.5);
        else {
          activeDisc(r, P.fire);
          // 外緣火舌(向內, 不超出半徑)
          ctx.fillStyle = '#ffd23a';
          for (var i = 0; i < 12; i++) {
            var a = i * Math.PI / 6 + t * 4;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a - 0.12) * (r - 4), Math.sin(a - 0.12) * (r - 4));
            ctx.lineTo(Math.cos(a) * (r - 22), Math.sin(a) * (r - 22));
            ctx.lineTo(Math.cos(a + 0.12) * (r - 4), Math.sin(a + 0.12) * (r - 4));
            ctx.closePath(); ctx.fill();
          }
        }
      } else if (s.kind === 'thunder') {
        if (s.phase === 'warn') {
          warnDisc(r, P.thunder, 0.8);
          ctx.strokeStyle = P.thunder; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-r * 0.3, 0); ctx.lineTo(r * 0.3, 0); ctx.moveTo(0, -r * 0.3); ctx.lineTo(0, r * 0.3); ctx.stroke();
        } else {
          var fade = Math.max(0.35, 1 - t / 0.4);
          ctx.globalAlpha = fade;
          activeDisc(r, P.thunder);
          // 雷柱(畫在圓內)
          ctx.beginPath();
          ctx.moveTo(-r * 0.15, -r * 0.85); ctx.lineTo(r * 0.12, -r * 0.2); ctx.lineTo(-r * 0.08, -r * 0.15);
          ctx.lineTo(r * 0.18, r * 0.55); ctx.lineTo(-r * 0.2, -r * 0.02); ctx.lineTo(0, -r * 0.08); ctx.closePath();
          ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
        }
      } else if (s.kind === 'quake') {
        // 震波: 半徑 radius、環寬 30 的圓環(radius ± 15)
        var r0 = Math.max(0, r - 15), r1 = r + 15;
        ctx.beginPath(); ctx.arc(0, 0, r1, 0, Math.PI * 2); ctx.arc(0, 0, r0, 0, Math.PI * 2, true);
        ctx.fillStyle = rgba(P.stoneHi, 0.55); ctx.fill('evenodd');
        ctx.save();
        ctx.beginPath(); ctx.arc(0, 0, r1, 0, Math.PI * 2); ctx.arc(0, 0, r0, 0, Math.PI * 2, true); ctx.clip('evenodd');
        ctx.strokeStyle = 'rgba(30,26,22,0.6)'; ctx.lineWidth = 4;
        ctx.beginPath();
        for (var d = -r1 * 2; d < r1 * 2; d += 18) { ctx.moveTo(d - r1, -r1); ctx.lineTo(d + r1, r1); }
        ctx.stroke();
        ctx.restore();
        ctx.lineWidth = 5; ctx.strokeStyle = P.outline;
        ctx.beginPath(); ctx.arc(0, 0, r1 - 2.5, 0, Math.PI * 2); ctx.stroke();
        if (r0 > 3) { ctx.beginPath(); ctx.arc(0, 0, r0 + 2.5, 0, Math.PI * 2); ctx.stroke(); }
        ctx.lineWidth = 3; ctx.strokeStyle = '#d8ccbc';
        ctx.beginPath(); ctx.arc(0, 0, r1 - 2.5, 0, Math.PI * 2); ctx.stroke();
      } else if (s.kind === 'waterball') {
        // 水彈: 判定半徑 12
        var ang = s.angle || 0;
        ctx.rotate(ang);
        ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-6, -9); ctx.lineTo(-6, 9); ctx.closePath();
        ctx.fillStyle = rgba(P.water, 0.4); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
        ctx.fillStyle = '#5aa8ff'; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.beginPath(); ctx.arc(-3, -3, 3.5, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
      }
      ctx.restore();
    },

    // 揮鞭範圍(arc 扇形 120° / circle 整圈)
    drawWhipCrack: function (ctx, s) {
      var t = s.t || 0;
      var alpha = Math.max(0, 1 - t / 0.25);
      if (alpha <= 0) return;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.globalAlpha = alpha;
      var r = s.radius || 110;
      var grow = Math.min(1, 0.6 + t / 0.08 * 0.4);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      function crack(a, len) {
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 20, Math.sin(a) * 20);
        var n = 4;
        for (var i = 1; i <= n; i++) {
          var d = 20 + (len - 20) * i / n;
          var j = (i % 2 ? 0.09 : -0.09);
          ctx.lineTo(Math.cos(a + j) * d, Math.sin(a + j) * d);
        }
        ctx.lineWidth = 6; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 3; ctx.strokeStyle = P.whip; ctx.stroke();
      }
      if (s.shape === 'circle') {
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = rgba(P.whip, 0.16); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, r - 2.5, 0, Math.PI * 2);
        ctx.lineWidth = 7; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = P.whip; ctx.stroke();
        for (var i = 0; i < 8; i++) crack(i * Math.PI / 4 + 0.2, (r - 4) * grow);
      } else {
        var a = facingAngle(s.facing);
        var a0 = a - Math.PI / 3, a1 = a + Math.PI / 3;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, a0, a1); ctx.closePath();
        ctx.fillStyle = rgba(P.whip, 0.2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, r - 2.5, a0, a1);
        ctx.lineWidth = 7; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = P.whip; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a0) * r, Math.sin(a0) * r);
        ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
        ctx.lineWidth = 2; ctx.strokeStyle = rgba(P.whip, 0.6); ctx.stroke();
        [-0.65, 0, 0.65].forEach(function (o) { crack(a + o, (r - 4) * grow); });
      }
      ctx.restore();
    },

    // 吹哨範圍: 平滑波紋圈 + 音符(與鞭的鋸齒裂紋形狀相反)
    drawWhistleWave: function (ctx, s) {
      var t = s.t || 0;
      var alpha = Math.max(0, 1 - Math.max(0, t - 0.25) / 0.35);
      if (alpha <= 0) return;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.globalAlpha = alpha;
      var r = s.radius || 140;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(P.whistle, 0.12); ctx.fill();
      // 範圍外緣(實線 = 判定邊界)
      ctx.beginPath(); ctx.arc(0, 0, r - 2, 0, Math.PI * 2);
      ctx.lineWidth = 6; ctx.strokeStyle = P.outline; ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = P.whistle; ctx.stroke();
      // 往外擴的波紋(波浪線)
      for (var k = 0; k < 2; k++) {
        var f = Math.min(1, (t / 0.35) + k * 0.35) % 1.0001;
        var rr2 = Math.max(10, (r - 8) * (0.25 + 0.75 * f));
        ctx.beginPath();
        for (var i = 0; i <= 72; i++) {
          var a = i / 72 * Math.PI * 2;
          var w = rr2 + Math.sin(a * 12) * 3;
          if (i === 0) ctx.moveTo(Math.cos(a) * w, Math.sin(a) * w); else ctx.lineTo(Math.cos(a) * w, Math.sin(a) * w);
        }
        ctx.lineWidth = 2.5; ctx.strokeStyle = rgba(P.whistle, 0.8); ctx.stroke();
      }
      // 音符
      [[-0.7, 0.55], [0.9, 0.5], [2.6, 0.6]].forEach(function (n) {
        var nx = Math.cos(n[0]) * r * n[1], ny = Math.sin(n[0]) * r * n[1] - t * 20;
        ctx.beginPath(); ctx.ellipse(nx, ny, 6, 4.5, -0.4, 0, Math.PI * 2);
        ctx.fillStyle = P.whistle; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(nx + 5, ny - 2); ctx.lineTo(nx + 5, ny - 18); ctx.lineTo(nx + 11, ny - 14);
        ctx.lineWidth = 2.5; ctx.strokeStyle = P.whistle; ctx.stroke();
      });
      ctx.restore();
    },

    // 表演場底: 場地 x60~660 y270~1000; 觀眾席 130~250 / 1020~1140
    drawShowArena: function (ctx) {
      ctx.save();
      // 外牆
      ctx.fillStyle = '#1e1826'; ctx.fillRect(0, 120, 720, 1160);
      // 觀眾席(階梯)
      [[130, 1], [1020, -1]].forEach(function (st) {
        var y0 = st[0];
        ctx.fillStyle = P.stands; ctx.fillRect(20, y0, 680, 120);
        for (var i = 0; i < 4; i++) {
          ctx.fillStyle = i % 2 ? '#43364f' : '#4b3d58';
          ctx.fillRect(20, y0 + i * 30, 680, 30);
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
        ctx.strokeRect(20, y0, 680, 120);
        // 旗串
        for (var fx = 40; fx < 700; fx += 40) {
          ctx.beginPath();
          var fy = st[1] > 0 ? y0 + 2 : y0 + 118;
          ctx.moveTo(fx, fy); ctx.lineTo(fx + 20, fy); ctx.lineTo(fx + 10, fy + st[1] * 10); ctx.closePath();
          ctx.fillStyle = (fx / 40) % 2 ? 'rgba(255,122,217,0.35)' : 'rgba(255,210,58,0.35)'; ctx.fill();
        }
      });
      // 場地
      ctx.fillStyle = P.sand; ctx.fillRect(60, 270, 600, 730);
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      for (var y = 290; y < 1000; y += 40) {
        for (var x = 80 + (y / 40 % 2) * 20; x < 660; x += 60) {
          ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.beginPath(); ctx.arc(360, 635, 90, 0, Math.PI * 2);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.stroke();
      ctx.lineWidth = 5; ctx.strokeStyle = P.outline; ctx.strokeRect(60, 270, 600, 730);
      ctx.restore();
    },

    // 表演場魔物 + 怒氣條(100×100)
    drawShowMonster: function (ctx, s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      var R = 27;
      var mode = s.mode || 'roam';
      var out = mode === 'charge' || mode === 'loose';
      var col = SPECIES_COLOR[s.species] || P.fire;
      // 失控: 紅色怒圈(衝欄 = 虛線, 觀眾席失控 = 實線加粗)
      if (out) {
        ctx.beginPath(); ctx.arc(0, -4, 41, 0, Math.PI * 2);
        ctx.fillStyle = rgba(P.rageRed, 0.18); ctx.fill();
        if (mode === 'charge') ctx.setLineDash([10, 6]);
        ctx.lineWidth = mode === 'loose' ? 7 : 5; ctx.strokeStyle = P.rageRed; ctx.stroke();
        ctx.setLineDash([]);
      }
      // 表演中: 種類色爆發環 + 光芒
      if (s.performing && !out) {
        ctx.beginPath(); ctx.arc(0, -4, 40, 0, Math.PI * 2);
        ctx.lineWidth = 8; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 5; ctx.strokeStyle = s.species === 'stone' ? P.stoneHi : col; ctx.stroke();
        ctx.lineCap = 'round';
        for (var i = 0; i < 8; i++) {
          var a = i * Math.PI / 4;
          ctx.beginPath(); ctx.moveTo(Math.cos(a) * 33, -4 + Math.sin(a) * 33); ctx.lineTo(Math.cos(a) * 26, -4 + Math.sin(a) * 26);
          ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        }
      }
      // 剛被點燃 / 澆熄 / 哨音罩到: 長在身體外緣的光暈
      var fx = s.fx || 'none';
      if (fx !== 'none' && !out) {
        var fcol = fx === 'ignited' ? P.rageShow : (fx === 'doused' ? '#5aa8ff' : P.whistle);
        ctx.beginPath(); ctx.arc(0, -4, 33, 0, Math.PI * 2);
        ctx.fillStyle = rgba(fcol, 0.28); ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = fcol; ctx.stroke();
      }
      ctx.save(); ctx.translate(0, -4);
      monsterBody(ctx, s.species, R, { dir: s.dir, angry: out || (s.rage || 0) >= 80 });
      ctx.restore();
      // 怒氣升降箭頭(貼在身體右上)
      if (fx !== 'none' && !out) {
        var up = fx === 'ignited';
        var ac = fx === 'ignited' ? P.rageShow : (fx === 'doused' ? '#5aa8ff' : P.whistle);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (var c = 0; c < 2; c++) {
          var cy = (up ? -14 : -24) + c * 10;
          ctx.beginPath();
          if (up) { ctx.moveTo(32, cy + 5); ctx.lineTo(39, cy - 2); ctx.lineTo(46, cy + 5); }
          else { ctx.moveTo(32, cy - 5); ctx.lineTo(39, cy + 2); ctx.lineTo(46, cy - 5); }
          ctx.lineWidth = 7; ctx.strokeStyle = P.outline; ctx.stroke();
          ctx.lineWidth = 4; ctx.strokeStyle = ac; ctx.stroke();
        }
      }
      // 頭頂: 星級 或 制伏進度
      if (out) {
        var sub = Math.max(0, Math.min(3, s.subdue || 0));
        rr(ctx, -34, -50, 68, 22, 6);
        ctx.fillStyle = 'rgba(20,15,26,0.88)'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = P.whistle; ctx.stroke();
        txt(ctx, '制伏 ' + sub + '/3', 0, -39, 15, P.whistle, 'center', { stroke: false });
      } else {
        var st = Math.max(1, Math.min(3, s.star || 1));
        for (var k = 0; k < st; k++) star(ctx, (k - (st - 1) / 2) * 16, -42, 7, true);
      }
      // 怒氣條(50 門檻刻度、80~99 紅線區)
      rageBar(ctx, -42, 35, 84, 9, s.rage);
      ctx.restore();
    },

    // 圍欄(100×16)
    drawFence: function (ctx, s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      function planks(x0, x1) {
        ctx.fillStyle = P.fence;
        ctx.fillRect(x0, -6, x1 - x0, 12);
        ctx.fillStyle = '#c89050'; ctx.fillRect(x0, -6, x1 - x0, 3);
        ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.strokeRect(x0, -6, x1 - x0, 12);
      }
      if (!s.broken) {
        planks(-48, 48);
        ctx.fillStyle = '#5a3a1e';
        [-48, -16, 16, 40].forEach(function (px) { ctx.fillRect(px, -8, 8, 16); });
        ctx.lineWidth = 1.5; ctx.strokeStyle = P.outline;
        [-48, -16, 16, 40].forEach(function (px) { ctx.strokeRect(px, -8, 8, 16); });
      } else {
        // 破損: 中段斷開, 斷口鋸齒, 紅虛線標出缺口
        planks(-48, -24);
        planks(24, 48);
        ctx.fillStyle = P.fence; ctx.strokeStyle = P.outline; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-24, -6); ctx.lineTo(-16, -2); ctx.lineTo(-22, 2); ctx.lineTo(-15, 6); ctx.lineTo(-24, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(24, -6); ctx.lineTo(17, -3); ctx.lineTo(22, 1); ctx.lineTo(16, 6); ctx.lineTo(24, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.setLineDash([5, 4]); ctx.lineWidth = 2.5; ctx.strokeStyle = P.rageRed;
        ctx.strokeRect(-14, -7, 28, 14); ctx.setLineDash([]);
        ctx.fillStyle = '#c89050';
        [[-6, 2, 0.5], [6, -3, -0.6], [0, 4, 1.2]].forEach(function (sp) {
          ctx.save(); ctx.translate(sp[0], sp[1]); ctx.rotate(sp[2]); ctx.fillRect(-4, -1.5, 8, 3); ctx.restore();
        });
      }
      ctx.restore();
    },

    // 觀眾(60×90)
    drawVisitor: function (ctx, s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      var shirts = ['#8c7a9c', '#7a8c6c', '#9c8a6a', '#6a7c9c', '#9c6a7a', '#6a9c94'];
      var skin = ['#e8c8a0', '#c89a70', '#f0d8b8', '#a87850'];
      var seat = s.seat || 0;
      var shirt = shirts[seat % 6], sk = skin[seat % 4];
      // 座椅
      rr(ctx, -24, 26, 48, 16, 4); ctx.fillStyle = '#2a2232'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
      if (s.mode === 'empty') {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        rr(ctx, -20, 8, 40, 18, 4); ctx.fill();
        ctx.restore();
        return;
      }
      var scared = s.mode === 'scared';
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (scared) ctx.rotate(-0.12);
      // 手臂
      ctx.lineWidth = 6; ctx.strokeStyle = P.outline;
      ctx.beginPath();
      if (scared) { ctx.moveTo(-14, -2); ctx.lineTo(-22, -30); ctx.moveTo(14, -2); ctx.lineTo(22, -30); }
      else { ctx.moveTo(-15, 0); ctx.lineTo(-19, 18); ctx.moveTo(15, 0); ctx.lineTo(19, 18); }
      ctx.stroke();
      ctx.lineWidth = 3.5; ctx.strokeStyle = shirt; ctx.stroke();
      // 身體
      rr(ctx, -16, -8, 32, 36, 8);
      ctx.fillStyle = scared ? lerpHex(shirt, '#ffffff', 0.35) : shirt; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = P.outline; ctx.stroke();
      // 頭
      ctx.beginPath(); ctx.arc(0, -22, 13, 0, Math.PI * 2);
      ctx.fillStyle = scared ? '#f4f0e8' : sk; ctx.fill(); ctx.stroke();
      if (scared) {
        ctx.fillStyle = P.outline;
        ctx.beginPath(); ctx.arc(-5, -24, 2.5, 0, Math.PI * 2); ctx.arc(5, -24, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, -15, 3.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
        // 汗滴
        ctx.beginPath(); ctx.moveTo(17, -36); ctx.quadraticCurveTo(22, -28, 17, -26); ctx.quadraticCurveTo(12, -28, 17, -36);
        ctx.fillStyle = '#9ad0ff'; ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
      } else {
        ctx.fillStyle = P.outline;
        ctx.beginPath(); ctx.arc(-4.5, -23, 2, 0, Math.PI * 2); ctx.arc(4.5, -23, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -18, 4, 0.2, Math.PI - 0.2); ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.restore();
    },

    // 每段開始前的標題卡(全畫面)
    drawTitleCard: function (ctx, s) {
      ctx.save();
      ctx.fillStyle = 'rgba(18,14,24,0.94)';
      ctx.fillRect(0, 0, 720, 1280);
      var show = s.stage === 'show';
      // 天數進度(3 格)
      for (var d = 1; d <= 3; d++) {
        var x = 360 + (d - 2) * 70;
        ctx.beginPath(); ctx.arc(x, 330, 20, 0, Math.PI * 2);
        ctx.fillStyle = d < s.day ? '#6a5a78' : (d === s.day ? P.gold : 'rgba(255,255,255,0.06)');
        ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = d === s.day ? P.text : '#6a5a78'; ctx.stroke();
        txt(ctx, d, x, 331, 18, d === s.day ? P.outline : P.textDim, 'center', { stroke: false });
      }
      txt(ctx, '第 ' + (s.day || 1) + ' 天', 360, 450, 72, P.text);
      // 場景圖示
      ctx.save(); ctx.translate(360, 640);
      if (show) {
        // 帳篷
        ctx.beginPath(); ctx.moveTo(-110, 70); ctx.lineTo(0, -80); ctx.lineTo(110, 70); ctx.closePath();
        ctx.fillStyle = '#a03050'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-36, 70); ctx.lineTo(0, -80); ctx.lineTo(36, 70); ctx.closePath();
        ctx.fillStyle = '#f4ecd8'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-26, 70); ctx.quadraticCurveTo(0, 10, 26, 70); ctx.closePath();
        ctx.fillStyle = P.outline; ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, -80); ctx.lineTo(0, -112); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -112); ctx.lineTo(30, -102); ctx.lineTo(0, -92); ctx.closePath();
        ctx.fillStyle = P.gold; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      } else {
        // 洞口 + 火把
        ctx.beginPath(); ctx.moveTo(-120, 80); ctx.lineTo(-120, -10); ctx.arc(0, -10, 120, Math.PI, 0); ctx.lineTo(120, 80); ctx.closePath();
        ctx.fillStyle = P.wallTop; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-70, 80); ctx.lineTo(-70, 0); ctx.arc(0, 0, 70, Math.PI, 0); ctx.lineTo(70, 80); ctx.closePath();
        ctx.fillStyle = '#05030a'; ctx.fill(); ctx.stroke();
        [-95, 95].forEach(function (tx) {
          ctx.fillStyle = P.tamerHat; ctx.fillRect(tx - 5, 0, 10, 50);
          ctx.beginPath(); ctx.moveTo(tx, -36); ctx.quadraticCurveTo(tx + 16, -6, tx, 2); ctx.quadraticCurveTo(tx - 16, -6, tx, -36);
          ctx.fillStyle = P.fire; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
        });
      }
      ctx.restore();
      txt(ctx, show ? '表演場' : '地下城', 360, 820, 60, show ? P.rep : P.whip);
      txt(ctx, show ? '把魔物推進紅線, 別讓牠失控' : '打到殘血, 圈亮綠時揮鞭收服', 360, 900, 24, P.textDim);
      txt(ctx, '按 Z 開始', 360, 1080, 34, P.gold);
      ctx.restore();
    },

    // 商店強化項目(600×140, x,y 中心)
    drawShopItem: function (ctx, s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      var info = {
        whipPower: ['鞭力', '每鞭多扣 1 血'],
        ropeBag: ['繩袋', '捕獸繩 +1 條'],
        armor: ['護甲', '心 +1 顆'],
        silverWhistle: ['銀哨', '吹哨冷卻 −0.4 秒']
      }[s.item] || [String(s.item), ''];
      var ok = !!s.affordable;
      rr(ctx, -300, -70, 600, 140, 14);
      ctx.fillStyle = s.selected ? '#3a2e4a' : '#251d30'; ctx.fill();
      ctx.lineWidth = s.selected ? 6 : 3; ctx.strokeStyle = s.selected ? P.gold : P.hudLine; ctx.stroke();
      if (s.selected) {
        ctx.beginPath(); ctx.moveTo(-292, -16); ctx.lineTo(-276, 0); ctx.lineTo(-292, 16); ctx.closePath();
        ctx.fillStyle = P.gold; ctx.fill();
      }
      ctx.globalAlpha = ok ? 1 : 0.55;
      // 圖示
      ctx.save(); ctx.translate(-215, 0);
      rr(ctx, -50, -50, 100, 100, 12); ctx.fillStyle = '#1a1422'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.hudLine; ctx.stroke();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (s.item === 'whipPower') {
        ctx.beginPath(); ctx.moveTo(-28, 28); ctx.lineTo(-12, 12);
        ctx.lineWidth = 9; ctx.strokeStyle = P.tamerHat; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-12, 12); ctx.quadraticCurveTo(30, 20, 18, -10); ctx.quadraticCurveTo(8, -30, 30, -32);
        ctx.lineWidth = 4; ctx.strokeStyle = P.whip; ctx.stroke();
      } else if (s.item === 'ropeBag') {
        ctx.save(); ctx.scale(1.6, 1.6); ropeIcon(ctx, 0, 0, 40, true); ctx.restore();
      } else if (s.item === 'armor') {
        ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(30, -24); ctx.lineTo(26, 12); ctx.quadraticCurveTo(14, 30, 0, 38); ctx.quadraticCurveTo(-14, 30, -26, 12); ctx.lineTo(-30, -24); ctx.closePath();
        ctx.fillStyle = '#8a9ab0'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
        heart(ctx, 0, 0, 34, true);
      } else {
        ctx.beginPath(); ctx.ellipse(6, 6, 22, 18, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#d0d8e4'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.fillStyle = '#d0d8e4'; ctx.fillRect(-34, -10, 30, 14); ctx.strokeRect(-34, -10, 30, 14);
        ctx.beginPath(); ctx.arc(8, 4, 6, 0, Math.PI * 2); ctx.fillStyle = P.outline; ctx.fill();
        ctx.beginPath(); ctx.arc(28, -24, 8, -1.2, 1.2); ctx.lineWidth = 3; ctx.strokeStyle = P.whistle; ctx.stroke();
      }
      ctx.restore();
      txt(ctx, info[0], -145, -22, 34, P.text, 'left');
      txt(ctx, info[1], -145, 22, 22, P.textDim, 'left');
      txt(ctx, '已買 ' + (s.level || 0), 270, -32, 18, P.textDim, 'right');
      ctx.globalAlpha = 1;
      coin(ctx, 150, 18, 15);
      txt(ctx, s.cost, 270, 18, 36, ok ? P.gold : '#8a7a7a', 'right');
      if (!ok) txt(ctx, '金幣不足', 270, 50, 16, '#c87a7a', 'right');
      ctx.restore();
    },

    // 按鈕(x,y 為左上角)
    drawButton: function (ctx, s) {
      ctx.save();
      var w = s.w || 400, h = s.h || 100;
      rr(ctx, s.x, s.y, w, h, 16);
      ctx.fillStyle = s.selected ? P.gold : '#2a2236'; ctx.fill();
      ctx.lineWidth = s.selected ? 6 : 3; ctx.strokeStyle = s.selected ? P.text : P.hudLine; ctx.stroke();
      if (s.selected) {
        ctx.beginPath(); ctx.moveTo(s.x + 24, s.y + h / 2 - 14); ctx.lineTo(s.x + 42, s.y + h / 2); ctx.lineTo(s.x + 24, s.y + h / 2 + 14); ctx.closePath();
        ctx.fillStyle = P.outline; ctx.fill();
      }
      txt(ctx, s.label || '', s.x + w / 2, s.y + h / 2, 38, s.selected ? P.outline : P.textDim, 'center', { stroke: !s.selected ? true : false });
      ctx.restore();
    },

    // 飄字: t 0→1.2 秒上飄 + 淡出; 份量: 紅線金幣 > 升星 > 金幣 / 名聲
    drawFloatText: function (ctx, s) {
      var t = s.t || 0;
      var a = t < 0.7 ? 1 : Math.max(0, 1 - (t - 0.7) / 0.5);
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      var y = s.y - Math.min(t, 1) * 50;
      var k = s.kind || 'gold';
      var pop = t < 0.12 ? 0.7 + t / 0.12 * 0.3 : 1;
      ctx.translate(s.x, y); ctx.scale(pop, pop);
      if (k === 'redGold') {
        ctx.font = 'bold 34px ' + FONT;
        var w = ctx.measureText(String(s.text)).width;
        rr(ctx, -w / 2 - 36, -24, w + 52, 48, 12);
        ctx.fillStyle = 'rgba(20,15,26,0.85)'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = P.rageRed; ctx.stroke();
        coin(ctx, -w / 2 - 14, 0, 13);
        txt(ctx, s.text, 10, 0, 34, P.gold);
      } else if (k === 'gold') {
        ctx.font = 'bold 26px ' + FONT;
        var w2 = ctx.measureText(String(s.text)).width;
        coin(ctx, -w2 / 2 - 6, 0, 10);
        txt(ctx, s.text, 10, 0, 26, P.gold);
      } else if (k === 'starUp') {
        star(ctx, -46, 0, 14, true);
        txt(ctx, s.text, 10, 0, 32, '#ffffff', 'center', { strokeColor: '#8a5a00', strokeW: 6 });
      } else if (k === 'repDown') {
        txt(ctx, s.text, 0, 0, 24, '#c8a0b8', 'center');
        ctx.beginPath(); ctx.moveTo(-60, -8); ctx.lineTo(-52, 4); ctx.lineTo(-44, -8);
        ctx.lineWidth = 3; ctx.strokeStyle = '#c8a0b8'; ctx.stroke();
      } else {
        txt(ctx, s.text, 0, 0, 24, P.rep, 'center');
      }
      ctx.restore();
    },

    // 結算畫面(全畫面; 含「按 Z 重來」)
    drawResultPanel: function (ctx, s) {
      ctx.save();
      ctx.fillStyle = 'rgba(18,14,24,0.96)'; ctx.fillRect(0, 0, 720, 1280);
      txt(ctx, '三天表演結束', 360, 170, 50, P.text);
      var stars = Math.max(0, Math.min(3, s.stars || 0));
      for (var i = 0; i < 3; i++) star(ctx, 360 + (i - 1) * 110, 330, 46, i < stars);
      txt(ctx, '名聲 60 / 150 / 260 得 1 / 2 / 3 星', 360, 420, 18, P.textDim);
      txt(ctx, '總名聲', 200, 520, 30, P.textDim, 'left');
      txt(ctx, s.rep || 0, 520, 520, 48, P.rep, 'right');
      txt(ctx, '累計金幣', 200, 600, 30, P.textDim, 'left');
      coin(ctx, 400, 600, 16);
      txt(ctx, s.goldEarned || 0, 520, 600, 48, P.gold, 'right');
      txt(ctx, '陣容', 360, 700, 28, P.textDim);
      var ro = s.roster || [];
      var n = Math.max(1, ro.length);
      for (var j = 0; j < ro.length; j++) {
        var x = 360 + (j - (n - 1) / 2) * 150;
        ctx.save(); ctx.translate(x, 800);
        monsterBody(ctx, ro[j].species, 34, {});
        ctx.restore();
        var stN = ro[j].star || 1;
        for (var k = 0; k < stN; k++) star(ctx, x + (k - (stN - 1) / 2) * 22, 870, 9, true);
      }
      txt(ctx, '按 Z 重來', 360, 1100, 36, P.gold);
      ctx.restore();
    },

    // HUD(上方 0~120 兩列; 商店底部操作提示; 訊息橫幅在 HUD 下緣)
    drawHud: function (ctx, s) {
      var ph = s.phase;
      if (ph === 'guide' || ph === 'title' || ph === 'result') return;
      ctx.save();
      ctx.fillStyle = P.hudBg; ctx.fillRect(0, 0, 720, 120);
      ctx.fillStyle = P.hudLine; ctx.fillRect(0, 118, 720, 2);
      var stageName = ph === 'dungeon' ? '地下城' : (ph === 'show' ? '表演場' : '商店');
      txt(ctx, '第 ' + (s.day || 1) + ' 天', 16, 22, 22, P.textDim, 'left');
      txt(ctx, stageName, 16, 48, 24, ph === 'show' ? P.rep : (ph === 'dungeon' ? P.whip : P.gold), 'left');
      // 時間
      if (ph === 'dungeon' || ph === 'show') {
        var tl = Math.max(0, Math.ceil(s.timeLeft || 0));
        txt(ctx, tl, 300, 34, 44, tl <= 10 ? P.rageRed : P.text, 'center');
        txt(ctx, '秒', 340, 40, 18, P.textDim, 'left');
      }
      // 金幣與名聲
      coin(ctx, 470, 32, 13);
      txt(ctx, s.gold || 0, 490, 33, 30, P.gold, 'left');
      txt(ctx, '名聲', 600, 33, 18, P.textDim, 'left');
      txt(ctx, s.rep || 0, 704, 33, 30, P.rep, 'right');
      // 第二列
      var y2 = 90;
      var rx = 704;
      if (ph === 'dungeon') {
        var mh = Math.max(1, s.maxHearts || 5);
        var hs = Math.min(28, 230 / mh);
        for (var i = 0; i < mh; i++) heart(ctx, 28 + i * hs, y2, Math.min(26, hs), i < (s.hearts || 0));
        var rx0 = 28 + mh * hs + 8;
        var rm = Math.max(1, s.ropeMax || 3);
        var rs = Math.min(26, 150 / rm);
        for (var j = 0; j < rm; j++) ropeIcon(ctx, rx0 + j * rs, y2, Math.min(24, rs), j < (s.ropes || 0));
        pill(rx0 + rm * rs + 4, 'X 翻滾', s.rollReady, P.whip);
      } else if (ph === 'show') {
        pill(16, 'X 吹哨', s.whistleReady, P.whistle);
      }
      // 陣容(右側)
      if (ph !== 'shop') {
        var ro = s.roster || [];
        for (var r = ro.length - 1; r >= 0; r--) {
          var cx = rx - 20 - (ro.length - 1 - r) * 44;
          ctx.save(); ctx.translate(cx, y2 - 6);
          monsterBody(ctx, ro[r].species, 12, {});
          ctx.restore();
          var sn = ro[r].star || 1;
          for (var k = 0; k < sn; k++) {
            starPath(ctx, cx + (k - (sn - 1) / 2) * 11, y2 + 16, 5);
            ctx.fillStyle = P.gold; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = P.outline; ctx.stroke();
          }
        }
      }
      if (ph === 'shop') {
        txt(ctx, '↑↓ 選擇   Z 確定', 360, 1262, 22, P.textDim);
      }
      // 訊息橫幅(HUD 正下方)
      if (s.message) {
        ctx.font = 'bold 26px ' + FONT;
        var mw = ctx.measureText(String(s.message)).width + 48;
        rr(ctx, 360 - mw / 2, 128, mw, 42, 10);
        ctx.fillStyle = 'rgba(20,15,26,0.9)'; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = P.rageRed; ctx.stroke();
        txt(ctx, s.message, 360, 149, 26, P.text);
      }
      ctx.restore();

      function pill(x, label, ready, col) {
        ctx.save();
        rr(ctx, x, y2 - 17, 96, 34, 17);
        ctx.fillStyle = ready ? col : '#2a2236'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = ready ? P.outline : '#4a4052'; ctx.stroke();
        txt(ctx, label, x + 48, y2, 18, ready ? P.outline : '#6a5a78', 'center', { stroke: false });
        ctx.restore();
      }
    },

    // 說明頁示意圖(只畫在 x,y,w,h 框內; 標題 / 說明文字 / 頁碼 / 翻頁提示由 RD 畫)
    drawGuidePage: function (ctx, s) {
      var VW = 640, VH = 560;
      var sc = Math.min(s.w / VW, s.h / VH);
      ctx.save();
      ctx.beginPath(); ctx.rect(s.x, s.y, s.w, s.h); ctx.clip();
      ctx.translate(s.x + (s.w - VW * sc) / 2, s.y + (s.h - VH * sc) / 2);
      ctx.scale(sc, sc);
      var A = Art;
      function label(text, x, y, col) { txt(ctx, text, x, y, 20, col || P.text); }
      function panel(x, y, w, h) {
        rr(ctx, x, y, w, h, 12); ctx.fillStyle = '#1a1422'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = P.hudLine; ctx.stroke();
      }
      var page = s.page || 0;
      if (page === 0) {
        // 地下城一角: 上排牆, 其餘熔岩洞地板
        ctx.save(); ctx.beginPath(); rr(ctx, 20, 20, 600, 520, 12); ctx.clip();
        for (var cy = 0; cy < 9; cy++) for (var cx = 0; cx < 10; cx++) {
          A.drawTile(ctx, { x: 50 + cx * 60, y: 50 + cy * 60, kind: cy === 0 ? 'wall' : 'floor', zone: 'lava', nest: false });
        }
        ctx.restore();
        // 揮鞭打中火蜥蜴
        A.drawWhipCrack(ctx, { x: 170, y: 170, shape: 'arc', facing: 2, radius: 110, t: 0.04 });
        A.drawTamer(ctx, { x: 170, y: 170, facing: 2, rolling: false, stunned: false, blink: false });
        A.drawWildMonster(ctx, { x: 262, y: 170, species: 'fire', hp: 6, maxHp: 10, hit: true, weak: false, pulse: 0, green: false, casting: false, dir: -1 });
        // 血條掉的那一截(示意)
        ctx.fillStyle = rgba('#ffffff', 0.9); ctx.fillRect(262 - 28 + 56 * 0.6, 126, 56 * 0.2, 6);
        arrowKeys(ctx, 100, 100);
        keycap(ctx, 215, 108, 'Z');
        // 翻滾穿過火圈預警
        A.drawHazard(ctx, { x: 380, y: 400, kind: 'firering', phase: 'warn', radius: 110, t: 0.3, angle: 0 });
        A.drawWildMonster(ctx, { x: 380, y: 400, species: 'fire', hp: 10, maxHp: 10, hit: false, weak: false, pulse: 0, green: false, casting: true, dir: -1 });
        ctx.save(); ctx.globalAlpha = 0.3;
        A.drawTamer(ctx, { x: 220, y: 470, facing: 2, rolling: false, stunned: false, blink: false });
        A.drawTamer(ctx, { x: 330, y: 470, facing: 2, rolling: true, stunned: false, blink: false });
        A.drawTamer(ctx, { x: 430, y: 470, facing: 2, rolling: true, stunned: false, blink: false });
        ctx.restore();
        ctx.setLineDash([8, 6]); ctx.lineWidth = 3; ctx.strokeStyle = rgba(P.whip, 0.7);
        ctx.beginPath(); ctx.moveTo(240, 470); ctx.lineTo(525, 470); ctx.stroke(); ctx.setLineDash([]);
        A.drawTamer(ctx, { x: 545, y: 470, facing: 2, rolling: true, stunned: false, blink: false });
        keycap(ctx, 545, 418, 'X');
        label('你', 170, 222);
      } else if (page === 1) {
        panel(10, 10, 305, 540); panel(325, 10, 305, 540);
        // 左: 亮綠 → 收服
        A.drawWildMonster(ctx, { x: 162, y: 200, species: 'fire', hp: 1, maxHp: 10, hit: false, weak: true, pulse: 1, green: true, casting: false, dir: -1 });
        // 繩套
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.ellipse(162, 214, 30, 12, 0, 0, Math.PI * 2);
        ctx.lineWidth = 6; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 3.5; ctx.strokeStyle = '#e8c48a'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(162, 226); ctx.quadraticCurveTo(190, 300, 162, 360);
        ctx.lineWidth = 6; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 3.5; ctx.strokeStyle = '#e8c48a'; ctx.stroke();
        A.drawWhipCrack(ctx, { x: 162, y: 370, shape: 'arc', facing: 0, radius: 110, t: 0.04 });
        A.drawTamer(ctx, { x: 162, y: 370, facing: 0, rolling: false, stunned: false, blink: false });
        label('亮綠', 162, 130, P.catchLit);
        bigCheck(ctx, 162, 470, 70);
        // 右: 暗 → 打倒
        ctx.save(); ctx.translate(478, 210); ctx.globalAlpha = 0.5; ctx.rotate(Math.PI / 2 * 0.9);
        monsterBody(ctx, 'fire', 25, { dir: -1, gray: true });
        ctx.restore();
        ctx.beginPath(); ctx.arc(478, 202, 36, 0, Math.PI * 2);
        ctx.lineWidth = 4; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 2.5; ctx.strokeStyle = P.catchDim; ctx.stroke();
        ctx.fillStyle = 'rgba(200,190,180,0.35)';
        [[-34, 26, 10], [30, 30, 12], [0, 40, 9], [-20, -30, 8]].forEach(function (p) {
          ctx.beginPath(); ctx.arc(478 + p[0], 202 + p[1], p[2], 0, Math.PI * 2); ctx.fill();
        });
        A.drawWhipCrack(ctx, { x: 478, y: 370, shape: 'arc', facing: 0, radius: 110, t: 0.04 });
        A.drawTamer(ctx, { x: 478, y: 370, facing: 0, rolling: false, stunned: false, blink: false });
        label('暗', 478, 130, '#7aa070');
        bigCross(ctx, 478, 470, 70);
      } else if (page === 2) {
        panel(10, 10, 305, 540); panel(325, 10, 305, 540);
        [[10, 10], [325, 10]].forEach(function (pp) {
          ctx.fillStyle = P.sand; ctx.fillRect(pp[0] + 6, pp[1] + 6, 293, 528);
        });
        // 左: 鞭 → 怒氣上升、表演、金幣
        ctx.save(); ctx.translate(162, 330); ctx.scale(0.85, 0.85);
        A.drawHazard(ctx, { x: -60, y: -120, kind: 'firering', phase: 'active', radius: 75, t: 0.1, angle: 0 });
        A.drawWhipCrack(ctx, { x: 0, y: 0, shape: 'circle', facing: 0, radius: 110, t: 0.05 });
        A.drawTamer(ctx, { x: 0, y: 0, facing: 4, rolling: false, stunned: false, blink: false });
        A.drawShowMonster(ctx, { x: -60, y: -120 + 50, species: 'fire', star: 1, rage: 88, mode: 'roam', performing: true, fx: 'none', subdue: 0, dir: 1 });
        A.drawShowMonster(ctx, { x: 70, y: 40, species: 'water', star: 1, rage: 72, mode: 'roam', performing: false, fx: 'ignited', subdue: 0, dir: -1 });
        A.drawFloatText(ctx, { x: -60, y: -250, text: '+12', kind: 'redGold', t: 0.3 });
        coin(ctx, -130, -215, 11); coin(ctx, 10, -230, 11); coin(ctx, 20, -190, 9);
        ctx.restore();
        keycap(ctx, 70, 500, 'Z');
        // 右: 哨 → 怒氣下降
        ctx.save(); ctx.translate(478, 330); ctx.scale(0.85, 0.85);
        A.drawWhistleWave(ctx, { x: 0, y: 0, radius: 140, t: 0.15 });
        A.drawTamer(ctx, { x: 0, y: 0, facing: 4, rolling: false, stunned: false, blink: false });
        A.drawShowMonster(ctx, { x: -70, y: -80, species: 'thunder', star: 1, rage: 38, mode: 'roam', performing: false, fx: 'calmed', subdue: 0, dir: 1 });
        A.drawShowMonster(ctx, { x: 75, y: 70, species: 'stone', star: 2, rage: 45, mode: 'roam', performing: false, fx: 'calmed', subdue: 0, dir: -1 });
        ctx.restore();
        keycap(ctx, 385, 500, 'X');
      } else {
        // 怒氣條(放大版, 與魔物頭下的同一畫法)
        rageBar(ctx, 40, 90, 560, 36, 92);
        label('50', 40 + 560 * 0.5, 148, P.textDim);
        label('紅線', 40 + 560 * 0.895, 60, P.rageRed);
        // 紅線段旁大量金幣
        [[470, 30, 13], [500, 18, 11], [530, 34, 12], [560, 20, 10], [590, 40, 11], [455, 52, 9], [610, 58, 9], [515, 56, 8]].forEach(function (c) { coin(ctx, c[0], c[1], c[2]); });
        // 滿 100 → 失控
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(600, 130); ctx.quadraticCurveTo(620, 200, 520, 240);
        ctx.lineWidth = 7; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = P.rageRed; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(520, 240); ctx.lineTo(540, 224); ctx.lineTo(536, 248); ctx.closePath(); ctx.fillStyle = P.rageRed; ctx.fill();
        label('100', 610, 150, P.rageRed);
        // 觀眾席 + 破圍欄 + 失控魔物
        ctx.fillStyle = P.stands; ctx.fillRect(180, 190, 320, 100);
        ctx.fillStyle = P.sand; ctx.fillRect(180, 300, 320, 110);
        A.drawVisitor(ctx, { x: 260, y: 240, seat: 1, mode: 'scared' });
        A.drawVisitor(ctx, { x: 420, y: 240, seat: 3, mode: 'watch' });
        A.drawFence(ctx, { x: 240, y: 296, side: 'top', broken: false });
        A.drawFence(ctx, { x: 340, y: 296, side: 'top', broken: true });
        A.drawFence(ctx, { x: 440, y: 296, side: 'top', broken: false });
        A.drawShowMonster(ctx, { x: 340, y: 270, species: 'fire', star: 1, rage: 100, mode: 'loose', performing: false, fx: 'none', subdue: 0, dir: -1 });
        bigCross(ctx, 560, 340, 60);
        // 流程小圖
        var fy = 480;
        ctx.save(); ctx.translate(110, fy); ctx.scale(0.4, 0.4);
        ctx.beginPath(); ctx.moveTo(-60, 40); ctx.lineTo(-60, 0); ctx.arc(0, 0, 60, Math.PI, 0); ctx.lineTo(60, 40); ctx.closePath();
        ctx.fillStyle = P.wallTop; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.restore();
        label('地下城', 110, fy + 36, P.whip);
        label('→', 180, fy + 4, P.textDim);
        ctx.save(); ctx.translate(250, fy); ctx.scale(0.4, 0.4);
        ctx.beginPath(); ctx.moveTo(-60, 40); ctx.lineTo(0, -50); ctx.lineTo(60, 40); ctx.closePath();
        ctx.fillStyle = '#a03050'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.restore();
        label('表演場', 250, fy + 36, P.rep);
        label('→', 320, fy + 4, P.textDim);
        coin(ctx, 390, fy, 16);
        label('商店', 390, fy + 36, P.gold);
        label('× 3 天 →', 470, fy + 4, P.textDim);
        for (var si = 0; si < 3; si++) star(ctx, 545 + si * 30, fy, 12, true);
        label('評星', 575, fy + 36, P.gold);
      }
      ctx.restore();
    }
  };

  window.Art = Art;
})();
