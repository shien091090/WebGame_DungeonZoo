// 大場面動物園: 紅線邊緣 — 美術(Canvas 2D 幾何繪製, 無外部資源)
// 契約: interface.json。所有 x,y 為物件中心; drawButton 的 x,y 為左上角。
(function () {
  'use strict';

  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC","Heiti TC",sans-serif';

  var P = {
    bg: '#141826',
    hudBg: '#0d1019',
    panel: '#232a3d',
    panelHi: '#2f3852',
    text: '#f4f1e8',
    textDim: '#8d96ab',
    outline: '#0a0c14',
    // 魔物種類色(形狀為第一辨識通道, 色相為第二通道)
    fire: '#ff8a2a',
    water: '#3cc8e8',
    thunder: '#a970ff',
    stone: '#a4a196',
    // 怒氣條三段
    rageLow: '#6b7a99',
    rageShow: '#ffb02e',
    rageRed: '#ff3b3b',
    // 語意色
    danger: '#ff3b3b',     // 紅線區、失控、破損、逃脫魔物、名聲減少
    gold: '#ffd54a',       // 金幣
    rep: '#7dff9c',        // 名聲增加(星)
    hp: '#5ee07a',         // 血量條(玩家與魔物共用)
    net: '#f4e7c3',        // 捕獲網繩色
    netMode: '#8ff0ff',    // 丟網模式啟用中(按鈕亮起、瞄準框)
    warn: '#ff5ad1',       // 遊客拍玻璃預警
    calm: '#a8e4ff',       // 安撫
    select: '#fff3c4',     // 選中
    bigshow: '#ffd54a',    // 大場面(與金幣同色: 大場面 = 最賺)
    player: '#e8eef7',
    playerCape: '#4b6bd6',
    cageWall: '#1c2536',
    cageFrame: '#55607a',
    zooFloor: '#1b2433',
    path: '#3a3226',
    tray: '#3b2a1e',
    btn: '#ffe7a8',
    btnOff: '#3a4152'
  };

  var SPECIES_COLOR = { fire: P.fire, water: P.water, thunder: P.thunder, stone: P.stone };
  var SPECIES_DARK = { fire: '#a8461a', water: '#1f7f99', thunder: '#5d33a8', stone: '#5f5d56' };
  var SPECIES_LIGHT = { fire: '#ffd08a', water: '#b8f2ff', thunder: '#dcc4ff', stone: '#d6d3c8' };

  // ---------- 小工具 ----------
  function font(px, w) { return (w || 'bold') + ' ' + px + 'px ' + FONT; }
  function now() {
    return ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) / 1000;
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function num(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; }
  function hitAmt(h) {
    if (typeof h === 'number') return clamp(h / 0.3, 0, 1);
    return h ? 1 : 0;
  }
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
  function ell(ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2);
  }
  function circ(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); }
  // 帶深色描邊的文字(P10)
  function txt(ctx, s, x, y, px, color, align, base, lw) {
    ctx.font = font(px);
    ctx.textAlign = align || 'center';
    ctx.textBaseline = base || 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lw == null ? Math.max(3, px / 6) : lw;
    if (ctx.lineWidth > 0) { ctx.strokeStyle = P.outline; ctx.strokeText(String(s), x, y); }
    ctx.fillStyle = color;
    ctx.fillText(String(s), x, y);
  }
  function starPath(ctx, cx, cy, r, ri) {
    ri = ri || r * 0.45;
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var rad = i % 2 ? ri : r;
      var px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  function starIcon(ctx, cx, cy, r, fill) {
    starPath(ctx, cx, cy, r);
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = Math.max(2, r / 6); ctx.strokeStyle = P.outline; ctx.stroke();
  }
  function coinIcon(ctx, cx, cy, r) {
    circ(ctx, cx, cy, r);
    ctx.fillStyle = P.gold; ctx.fill();
    ctx.lineWidth = Math.max(2, r / 5); ctx.strokeStyle = '#8a6a10'; ctx.stroke();
    circ(ctx, cx, cy, r * 0.55);
    ctx.lineWidth = Math.max(1.5, r / 7); ctx.strokeStyle = '#c99a1a'; ctx.stroke();
  }
  function checkMark(ctx, cx, cy, s, color) {
    ctx.save();
    circ(ctx, cx, cy, s); ctx.fillStyle = color; ctx.fill();
    ctx.lineWidth = s * 0.16; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.5, cy + s * 0.02);
    ctx.lineTo(cx - s * 0.12, cy + s * 0.4);
    ctx.lineTo(cx + s * 0.52, cy - s * 0.38);
    ctx.lineWidth = s * 0.26; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.restore();
  }
  function crossMark(ctx, cx, cy, s, color) {
    ctx.save();
    circ(ctx, cx, cy, s); ctx.fillStyle = color; ctx.fill();
    ctx.lineWidth = s * 0.16; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.4, cy - s * 0.4); ctx.lineTo(cx + s * 0.4, cy + s * 0.4);
    ctx.moveTo(cx + s * 0.4, cy - s * 0.4); ctx.lineTo(cx - s * 0.4, cy + s * 0.4);
    ctx.lineWidth = s * 0.26; ctx.lineCap = 'round';
    ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.restore();
  }
  function flame(ctx, x, y, r, outer, inner) {
    ctx.beginPath();
    ctx.moveTo(x, y - r * 1.7);
    ctx.quadraticCurveTo(x + r * 1.1, y - r * 0.2, x, y + r);
    ctx.quadraticCurveTo(x - r * 1.1, y - r * 0.2, x, y - r * 1.7);
    ctx.fillStyle = outer || '#ff7a1a'; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.8);
    ctx.quadraticCurveTo(x + r * 0.55, y + r * 0.1, x, y + r * 0.7);
    ctx.quadraticCurveTo(x - r * 0.55, y + r * 0.1, x, y - r * 0.8);
    ctx.fillStyle = inner || '#ffe27a'; ctx.fill();
  }
  // 手指游標(說明頁用)
  function finger(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.35);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = P.outline; ctx.lineWidth = 3;
    rr(ctx, -7, 0, 14, 34, 7); ctx.fill(); ctx.stroke();
    rr(ctx, -14, 22, 32, 34, 10); ctx.fill(); ctx.stroke();
    ctx.restore();
    // 點擊漣漪
    ctx.save();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3 * s;
    for (var i = 0; i < 3; i++) {
      var a = -Math.PI / 2 - 0.9 + i * 0.6;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * 14 * s, y + Math.sin(a) * 14 * s);
      ctx.lineTo(x + Math.cos(a) * 24 * s, y + Math.sin(a) * 24 * s);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 魔物本體(共用於地下城、籠中、逃脫、候展、說明頁) ----------
  // 設計在 ±50 單位的方框內, size = 方框邊長像素; pose: idle | sleep | angry
  function eye(ctx, x, y, pose, r) {
    r = r || 5;
    if (pose === 'sleep') {
      ctx.beginPath(); ctx.arc(x, y - r * 0.2, r, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.lineWidth = 2.5; ctx.strokeStyle = P.outline; ctx.stroke();
      return;
    }
    circ(ctx, x, y, r); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = P.outline; ctx.stroke();
    circ(ctx, x + r * 0.2, y, r * 0.55);
    ctx.fillStyle = pose === 'angry' ? '#e0141e' : P.outline; ctx.fill();
    if (pose === 'angry') {
      ctx.beginPath();
      ctx.moveTo(x - r * 1.4, y - r * 1.9); ctx.lineTo(x + r * 1.3, y - r * 0.9);
      ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = P.outline; ctx.stroke();
    }
  }

  function lizard(ctx, pose) {
    var c = P.fire, dk = SPECIES_DARK.fire, lt = SPECIES_LIGHT.fire;
    if (pose === 'sleep') { ctx.translate(0, 10); ctx.scale(1.06, 0.78); }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // 尾巴 + 尾火
    ctx.beginPath(); ctx.moveTo(-24, 14); ctx.quadraticCurveTo(-50, 16, -44, -10);
    ctx.lineWidth = 13; ctx.strokeStyle = dk; ctx.stroke();
    ctx.lineWidth = 9; ctx.strokeStyle = c; ctx.stroke();
    flame(ctx, -44, -16, pose === 'sleep' ? 5 : (pose === 'angry' ? 13 : 9));
    // 腳
    ctx.fillStyle = dk;
    [-20, -7, 9, 21].forEach(function (lx) { rr(ctx, lx - 4, 22, 9, 15, 4); ctx.fill(); });
    // 身體
    ell(ctx, 0, 12, 34, 18); ctx.fillStyle = c; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = dk; ctx.stroke();
    ell(ctx, 2, 21, 22, 6); ctx.fillStyle = lt; ctx.fill();
    // 背上圓鰭
    ctx.fillStyle = '#ffcf3a';
    [[-16, -3], [-2, -6], [12, -4]].forEach(function (p) { circ(ctx, p[0], p[1], 5); ctx.fill(); });
    // 頭
    ell(ctx, 30, -4, 19, 15); ctx.fillStyle = c; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = dk; ctx.stroke();
    ell(ctx, 40, 2, 8, 4); ctx.fillStyle = lt; ctx.fill();
    eye(ctx, 34, -9, pose, 5.5);
  }

  function jelly(ctx, pose) {
    var c = P.water, dk = SPECIES_DARK.water, lt = SPECIES_LIGHT.water;
    var sleep = pose === 'sleep';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // 觸手
    ctx.strokeStyle = c; ctx.lineWidth = 4.5;
    [-24, -12, 0, 12, 24].forEach(function (tx, i) {
      ctx.beginPath();
      if (sleep) {
        ctx.moveTo(tx, 30); ctx.quadraticCurveTo(tx + 8, 40, tx + 14, 38);
      } else {
        var w = pose === 'angry' ? 9 : 6;
        ctx.moveTo(tx, 8);
        ctx.quadraticCurveTo(tx - w, 18 + (i % 2) * 3, tx, 28);
        ctx.quadraticCurveTo(tx + w, 37, tx, 46);
      }
      ctx.stroke();
    });
    ctx.save();
    if (sleep) { ctx.translate(0, 18); ctx.scale(1.1, 0.68); }
    // 傘
    ctx.beginPath();
    ctx.moveTo(-36, 6);
    ctx.bezierCurveTo(-36, -44, 36, -44, 36, 6);
    for (var i = 0; i < 6; i++) {
      var x0 = 36 - i * 12;
      ctx.quadraticCurveTo(x0 - 6, 14, x0 - 12, 6);
    }
    ctx.closePath();
    ctx.fillStyle = c; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = dk; ctx.stroke();
    ell(ctx, -14, -20, 9, 5, -0.5); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
    ell(ctx, 0, -2, 22, 5); ctx.fillStyle = lt; ctx.globalAlpha = 0.45; ctx.fill(); ctx.globalAlpha = 1;
    eye(ctx, -10, -10, pose, 5.5);
    eye(ctx, 12, -10, pose, 5.5);
    ctx.restore();
  }

  function bird(ctx, pose) {
    var c = P.thunder, dk = SPECIES_DARK.thunder, lt = SPECIES_LIGHT.thunder;
    var sleep = pose === 'sleep';
    if (sleep) { ctx.translate(0, 8); ctx.scale(1.05, 0.85); }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // 尾羽
    ctx.beginPath();
    ctx.moveTo(-24, 6); ctx.lineTo(-48, -6); ctx.lineTo(-42, 10); ctx.lineTo(-48, 24); ctx.lineTo(-22, 18);
    ctx.closePath(); ctx.fillStyle = dk; ctx.fill();
    // 腳
    ctx.strokeStyle = '#ffb84a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-7, 30); ctx.lineTo(-7, 42); ctx.moveTo(8, 30); ctx.lineTo(8, 42); ctx.stroke();
    // 身體
    circ(ctx, 0, 6, 29); ctx.fillStyle = c; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = dk; ctx.stroke();
    ell(ctx, 8, 14, 15, 12); ctx.fillStyle = lt; ctx.fill();
    // 翅膀(睡: 收起; 醒: 張開; 怒: 高舉)
    var wr = sleep ? -0.2 : (pose === 'angry' ? -1.2 : -0.7);
    ell(ctx, -10, 2, 24, 12, wr); ctx.fillStyle = dk; ctx.fill();
    // 頭
    circ(ctx, 15, -18, 16); ctx.fillStyle = c; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = dk; ctx.stroke();
    // 喙
    ctx.beginPath(); ctx.moveTo(29, -22); ctx.lineTo(43, -16); ctx.lineTo(29, -11); ctx.closePath();
    ctx.fillStyle = '#ffb84a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
    // 閃電頭冠
    ctx.beginPath(); ctx.moveTo(6, -31); ctx.lineTo(12, -44); ctx.lineTo(13, -36); ctx.lineTo(21, -49);
    ctx.lineWidth = 5; ctx.strokeStyle = '#fff27a'; ctx.stroke();
    eye(ctx, 19, -21, pose, 5);
  }

  function gargoyle(ctx, pose) {
    var c = P.stone, dk = SPECIES_DARK.stone, lt = SPECIES_LIGHT.stone;
    var sleep = pose === 'sleep';
    if (sleep) { ctx.translate(0, 9); ctx.scale(1.04, 0.82); }
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // 蝙蝠翼
    var lift = sleep ? 8 : (pose === 'angry' ? -8 : 0);
    ctx.fillStyle = dk;
    [-1, 1].forEach(function (sx) {
      ctx.beginPath();
      ctx.moveTo(sx * 22, -8);
      ctx.lineTo(sx * 48, -24 + lift);
      ctx.lineTo(sx * 42, -6 + lift);
      ctx.lineTo(sx * 49, 8 + lift);
      ctx.lineTo(sx * 22, 12);
      ctx.closePath(); ctx.fill();
    });
    // 腳
    rr(ctx, -22, 32, 16, 12, 4); ctx.fill(); rr(ctx, 6, 32, 16, 12, 4); ctx.fill();
    // 身
    rr(ctx, -26, -14, 52, 50, 12); ctx.fillStyle = c; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = dk; ctx.stroke();
    // 裂紋
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-4, 10); ctx.lineTo(-10, 20);
    ctx.moveTo(10, 4); ctx.lineTo(16, 14);
    ctx.lineWidth = 2; ctx.strokeStyle = dk; ctx.stroke();
    // 角(圓頭彎角)
    ctx.strokeStyle = lt; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-14, -36); ctx.quadraticCurveTo(-26, -44, -22, -54); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(14, -36); ctx.quadraticCurveTo(26, -44, 22, -54); ctx.stroke();
    // 頭
    rr(ctx, -22, -42, 44, 32, 10); ctx.fillStyle = c; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = dk; ctx.stroke();
    // 眼(石像鬼的眼睛發光)
    if (pose === 'sleep') {
      eye(ctx, -9, -26, 'sleep', 5); eye(ctx, 9, -26, 'sleep', 5);
    } else {
      var ec = pose === 'angry' ? '#ff3b3b' : '#ffcf5a';
      [-9, 9].forEach(function (ex) {
        rr(ctx, ex - 6, -30, 12, 7, 3); ctx.fillStyle = ec; ctx.fill();
      });
      if (pose === 'angry') {
        ctx.beginPath(); ctx.moveTo(-16, -38); ctx.lineTo(-3, -33); ctx.moveTo(16, -38); ctx.lineTo(3, -33);
        ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
      }
    }
    // 嘴
    ctx.beginPath(); ctx.moveTo(-8, -17); ctx.lineTo(8, -17);
    ctx.lineWidth = 2.5; ctx.strokeStyle = dk; ctx.stroke();
  }

  var BODY = { fire: lizard, water: jelly, thunder: bird, stone: gargoyle };

  // opts: { flash: 0~1, halo: 'red'|'gold'|null, steam: bool, zzz: bool }
  function creature(ctx, species, cx, cy, size, pose, opts) {
    opts = opts || {};
    var fn = BODY[species];
    if (!fn) return;
    ctx.save();
    ctx.translate(cx, cy);
    var k = size / 100;
    // 地影
    ell(ctx, 0, 44 * k, 34 * k, 7 * k); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    if (opts.halo) {
      var g = ctx.createRadialGradient(0, 0, 10 * k, 0, 0, 62 * k);
      var hc = opts.halo === 'gold' ? '255,213,74' : '255,59,59';
      g.addColorStop(0, 'rgba(' + hc + ',0.55)');
      g.addColorStop(1, 'rgba(' + hc + ',0)');
      circ(ctx, 0, 0, 62 * k); ctx.fillStyle = g; ctx.fill();
    }
    ctx.save();
    ctx.scale(k, k);
    fn(ctx, pose);
    ctx.restore();
    if (opts.flash > 0) {
      // 受擊: 白色衝擊星芒蓋在身上(不改變形狀, 物種仍可辨)
      ctx.save();
      ctx.globalAlpha = 0.85 * opts.flash;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5 * k; ctx.lineCap = 'round';
      for (var i = 0; i < 8; i++) {
        var a = i * Math.PI / 4 + 0.3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 22 * k, Math.sin(a) * 22 * k);
        ctx.lineTo(Math.cos(a) * 48 * k, Math.sin(a) * 48 * k);
        ctx.stroke();
      }
      circ(ctx, 0, 0, 30 * k); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
      ctx.restore();
    }
    if (opts.zzz) {
      var tz = now();
      for (var z = 0; z < 2; z++) {
        var ph = (tz * 0.6 + z * 0.5) % 1;
        ctx.globalAlpha = 1 - ph;
        txt(ctx, 'z', (30 + z * 12 + ph * 8) * k, (-30 - ph * 26 - z * 6) * k, Math.round((14 + z * 4) * k), '#c9d2e8', 'center', 'middle', 2);
      }
      ctx.globalAlpha = 1;
    }
    if (opts.steam) {
      var ts = now();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 4 * k; ctx.lineCap = 'round';
      [-1, 1].forEach(function (sx, j) {
        var ph2 = (ts * 1.6 + j * 0.5) % 1;
        ctx.globalAlpha = 1 - ph2;
        ctx.beginPath();
        var bx = sx * 30 * k, by = (-48 - ph2 * 16) * k;
        ctx.moveTo(bx, by + 10 * k);
        ctx.quadraticCurveTo(bx + sx * 8 * k, by + 4 * k, bx, by - 2 * k);
        ctx.quadraticCurveTo(bx - sx * 8 * k, by - 8 * k, bx, by - 14 * k);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // 血量條(玩家與魔物共用一種長相)
  function hpBar(ctx, cx, cy, w, h, hp, max, showNum) {
    var r = clamp(max > 0 ? hp / max : 0, 0, 1);
    rr(ctx, cx - w / 2 - 2, cy - h / 2 - 2, w + 4, h + 4, (h + 4) / 2);
    ctx.fillStyle = P.outline; ctx.fill();
    rr(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
    ctx.fillStyle = '#2a3142'; ctx.fill();
    if (r > 0) {
      rr(ctx, cx - w / 2, cy - h / 2, Math.max(h, w * r), h, h / 2);
      ctx.fillStyle = P.hp; ctx.fill();
    }
    if (showNum) txt(ctx, Math.max(0, Math.round(hp)) + '/' + Math.round(max), cx, cy + h / 2 + 12, 16, P.text, 'center', 'middle', 3);
  }

  // ---------- 場景 ----------
  var DAY_TINT = [
    { wall: '#3a2e28', brick: '#4a3a31', floor: '#2b231f', line: '#1e1815' },
    { wall: '#263240', brick: '#30404f', floor: '#1d2630', line: '#141b23' },
    { wall: '#2e2338', brick: '#3b2d47', floor: '#221a2a', line: '#17111d' }
  ];
  function paintDungeon(ctx, W, H, day, room, horizon) {
    var tint = DAY_TINT[clamp((day | 0) - 1, 0, 2)];
    ctx.fillStyle = tint.wall; ctx.fillRect(0, 0, W, horizon);
    // 磚牆
    ctx.strokeStyle = tint.line; ctx.lineWidth = 3;
    for (var row = 0, yy = 0; yy < horizon; row++, yy += 44) {
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke();
      for (var xx = (row % 2) * 45; xx < W; xx += 90) {
        ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, Math.min(horizon, yy + 44)); ctx.stroke();
      }
    }
    // 地板
    var g = ctx.createLinearGradient(0, horizon, 0, H);
    g.addColorStop(0, tint.brick); g.addColorStop(1, tint.floor);
    ctx.fillStyle = g; ctx.fillRect(0, horizon, W, H - horizon);
    ctx.strokeStyle = tint.line; ctx.lineWidth = 2;
    for (var i = 0; i < 6; i++) {
      var fy = horizon + Math.pow(i / 6, 1.6) * (H - horizon);
      ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(W, fy); ctx.stroke();
    }
    for (var j = -6; j <= 6; j++) {
      ctx.beginPath(); ctx.moveTo(W / 2 + j * 60, horizon); ctx.lineTo(W / 2 + j * 220, H); ctx.stroke();
    }
    // 牆腳暗帶
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, horizon - 8, W, 16);
    return tint;
  }

  // ---------- 怒氣條與倍率章 ----------
  function rageBar(ctx, x0, yc, w, h, rage) {
    rage = clamp(num(rage, 0), 0, 100);
    // 底: 三段暗色
    var segs = [[0, 40, '#2c3446'], [40, 80, '#4a3a1c'], [80, 100, '#5a1c22']];
    rr(ctx, x0 - 3, yc - h / 2 - 3, w + 6, h + 6, 6); ctx.fillStyle = P.outline; ctx.fill();
    segs.forEach(function (s) {
      ctx.fillStyle = s[2];
      ctx.fillRect(x0 + w * s[0] / 100, yc - h / 2, w * (s[1] - s[0]) / 100, h);
    });
    // 填色(依目前所在段)
    var col = rage >= 80 ? P.rageRed : (rage >= 40 ? P.rageShow : P.rageLow);
    if (rage > 0) { ctx.fillStyle = col; ctx.fillRect(x0, yc - h / 2, w * rage / 100, h); }
    // 40 刻度
    ctx.fillStyle = P.outline; ctx.fillRect(x0 + w * 0.4 - 1.5, yc - h / 2, 3, h);
    // 紅線(80): 全畫面唯一的紅色直線, 超出條上下
    var rx = x0 + w * 0.8;
    ctx.fillStyle = P.outline; ctx.fillRect(rx - 4, yc - h / 2 - 9, 8, h + 18);
    ctx.fillStyle = P.rageRed; ctx.fillRect(rx - 2, yc - h / 2 - 7, 4, h + 14);
  }
  function multBadge(ctx, cx, cy, r, tier, streak) {
    if (tier !== 'frenzy' && tier !== 'bigshow' && tier !== 'show') return;
    var mult, prog = 0, fill, tc = P.outline;
    if (tier === 'show') { mult = 1; fill = P.rageShow; }
    else {
      streak = Math.max(0, num(streak, 0));
      mult = streak < 4 ? 2 : (streak < 8 ? 3 : 4);
      prog = mult < 4 ? (streak % 4) / 4 : 1;
      fill = tier === 'bigshow' ? P.bigshow : P.rageRed;
      if (tier !== 'bigshow') tc = '#ffffff';
    }
    circ(ctx, cx, cy, r + 3); ctx.fillStyle = P.outline; ctx.fill();
    circ(ctx, cx, cy, r); ctx.fillStyle = fill; ctx.fill();
    if (tier !== 'show') {
      // 外環 = 離下一級倍率還有多遠(P17: 數字給倍率, 環給距下一級)
      ctx.beginPath(); ctx.arc(cx, cy, r + 7, 0, Math.PI * 2);
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, r + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog);
      ctx.strokeStyle = tier === 'bigshow' ? P.bigshow : '#ffffff'; ctx.stroke();
    }
    ctx.font = font(Math.round(r * 0.95));
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = tc; ctx.fillText('×' + mult, cx, cy + 1);
  }

  // 拍玻璃的手掌
  function palm(ctx, x, y, s, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = color; ctx.strokeStyle = P.outline; ctx.lineWidth = 2.5;
    [-9, -3, 3, 9].forEach(function (fx, i) {
      rr(ctx, fx - 2.6, -16 + Math.abs(i - 1.5) * 2, 5.2, 14, 2.6); ctx.fill(); ctx.stroke();
    });
    rr(ctx, -12, -6, 24, 18, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-14, 2, 4, 8, -0.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
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

    drawDungeonRoom: function (ctx, s) {
      s = s || {};
      ctx.save();
      paintDungeon(ctx, 720, 1280, num(s.day, 1), num(s.room, 1), 560);
      // 後方拱門(第 2 房門更深, 表示往裡走)
      var deep = num(s.room, 1) >= 2;
      ctx.fillStyle = deep ? '#07080c' : '#0e1016';
      ctx.beginPath();
      ctx.moveTo(300, 560); ctx.lineTo(300, 300); ctx.arc(360, 300, 60, Math.PI, 0); ctx.lineTo(420, 560);
      ctx.closePath(); ctx.fill();
      ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke();
      // 兩側火把(小、低飽和, 不和火蜥蜴搶)
      [70, 650].forEach(function (tx) {
        ctx.fillStyle = '#4a3a2a'; ctx.fillRect(tx - 5, 230, 10, 40);
        ctx.globalAlpha = 0.8; flame(ctx, tx, 222, 9, '#d86a2a', '#f3c46a'); ctx.globalAlpha = 1;
      });
      // 光照暈
      var g = ctx.createRadialGradient(360, 720, 60, 360, 720, 620);
      g.addColorStop(0, 'rgba(255,240,200,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = g; ctx.fillRect(0, 120, 720, 1160);
      // 按鈕底帶
      ctx.fillStyle = 'rgba(8,10,16,0.75)'; ctx.fillRect(0, 1150, 720, 130);
      ctx.restore();
    },

    drawZooGround: function (ctx) {
      ctx.save();
      // 籠子區地磚
      ctx.fillStyle = P.zooFloor; ctx.fillRect(0, 120, 720, 670);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 2;
      for (var x = 0; x <= 720; x += 60) { ctx.beginPath(); ctx.moveTo(x, 120); ctx.lineTo(x, 790); ctx.stroke(); }
      for (var y = 120; y <= 790; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(720, y); ctx.stroke(); }
      // 遊客步道
      ctx.fillStyle = P.path; ctx.fillRect(0, 790, 720, 220);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (var px = 0; px < 720; px += 48) ctx.fillRect(px, 900, 24, 6);
      // 欄杆(籠子區與步道分界)
      ctx.fillStyle = '#6b5a44'; ctx.fillRect(0, 786, 720, 8);
      for (var rx = 12; rx < 720; rx += 40) ctx.fillRect(rx, 770, 5, 18);
      // 候展區木架
      ctx.fillStyle = P.tray; ctx.fillRect(0, 1012, 720, 136);
      ctx.fillStyle = '#4f3827'; ctx.fillRect(0, 1012, 720, 8); ctx.fillRect(0, 1136, 720, 12);
      txt(ctx, '候展區', 14, 1030, 16, P.textDim, 'left', 'middle', 3);
      // 按鈕底帶
      ctx.fillStyle = '#0b0e16'; ctx.fillRect(0, 1148, 720, 132);
      ctx.restore();
    },

    drawPlayer: function (ctx, s) {
      s = s || {};
      var x = num(s.x, 360), y = num(s.y, 860);
      var hv = hitAmt(s.hit);
      ctx.save();
      var shake = hv > 0 ? Math.sin(now() * 70) * 6 * hv : 0;
      ctx.translate(x + shake, y);
      // 受擊紅閃(危險: 我被打)
      if (hv > 0) {
        var g = ctx.createRadialGradient(0, 0, 20, 0, 0, 80);
        g.addColorStop(0, 'rgba(255,59,59,' + (0.55 * hv) + ')'); g.addColorStop(1, 'rgba(255,59,59,0)');
        circ(ctx, 0, 0, 80); ctx.fillStyle = g; ctx.fill();
      }
      ell(ctx, 0, 52, 46, 10); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
      // 披風(背影, 面向魔物)
      ctx.beginPath(); ctx.moveTo(-26, -18); ctx.lineTo(26, -18); ctx.lineTo(34, 46); ctx.lineTo(-34, 46); ctx.closePath();
      ctx.fillStyle = P.playerCape; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
      // 網袋(背在左肩)
      circ(ctx, -34, 8, 16); ctx.fillStyle = '#7a6a48'; ctx.fill(); ctx.stroke();
      ctx.strokeStyle = P.net; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-46, 2); ctx.lineTo(-22, 14); ctx.moveTo(-46, 14); ctx.lineTo(-22, 2); ctx.stroke();
      // 身體
      rr(ctx, -22, -24, 44, 50, 14); ctx.fillStyle = P.player; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
      // 頭 + 頭盔
      circ(ctx, 0, -40, 20); ctx.fillStyle = '#f2c9a0'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -42, 21, Math.PI, 0); ctx.closePath();
      ctx.fillStyle = '#b9c3d6'; ctx.fill(); ctx.stroke();
      // 劍(右手舉起)
      ctx.save(); ctx.translate(30, -10); ctx.rotate(0.45);
      rr(ctx, -4, -62, 8, 58, 3); ctx.fillStyle = '#dfe7f2'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
      rr(ctx, -12, -6, 24, 6, 3); ctx.fillStyle = '#c9a23a'; ctx.fill(); ctx.stroke();
      rr(ctx, -3, 0, 6, 14, 2); ctx.fillStyle = '#6b4a2a'; ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.restore();
      // 血量條(不跟著震, 錨在框底)
      ctx.save();
      hpBar(ctx, x, y + 66, 120, 12, num(s.hp, 0), num(s.maxHp, 1), false);
      ctx.restore();
    },

    drawMonster: function (ctx, s) {
      s = s || {};
      var x = num(s.x, 360), y = num(s.y, 460);
      var hv = hitAmt(s.hit);
      ctx.save();
      if (s.aimNet) {
        // 丟網瞄準: 網色角框 + 慢轉虛線圈(丟網模式中每隻可點的魔物都有)
        var t = now();
        ctx.save(); ctx.translate(x, y);
        ctx.strokeStyle = P.netMode; ctx.lineWidth = 4; ctx.setLineDash([10, 8]);
        ctx.lineDashOffset = -t * 30;
        circ(ctx, 0, -6, 70); ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineWidth = 6; ctx.lineCap = 'round';
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
          ctx.beginPath();
          ctx.moveTo(c[0] * 76, c[1] * 56); ctx.lineTo(c[0] * 76, c[1] * 76); ctx.lineTo(c[0] * 56, c[1] * 76);
          ctx.stroke();
        });
        ctx.restore();
      }
      var shake = hv > 0 ? Math.sin(now() * 70) * 6 * hv : 0;
      creature(ctx, s.species, x + shake, y - 14, 116, hv > 0 ? 'angry' : 'idle', { flash: hv });
      hpBar(ctx, x, y + 52, 120, 12, num(s.hp, 0), num(s.maxHp, 1), true);
      ctx.restore();
    },

    drawNet: function (ctx, s) {
      s = s || {};
      var x = num(s.x, 0), y = num(s.y, 0), t = Math.max(0, num(s.t, 0));
      var res = s.result || 'flying';
      ctx.save();
      ctx.translate(x, y);
      if (res === 'flying') {
        var r = 22 + clamp(t / 0.35, 0, 1) * 50;
        ctx.rotate(t * 6);
        netDisc(ctx, r, 1);
      } else if (res === 'success') {
        // 收口成袋 + 勾
        var k = clamp(t / 0.25, 0, 1);
        var a = t > 0.9 ? clamp(1 - (t - 0.9) / 0.4, 0, 1) : 1;
        ctx.globalAlpha = a;
        ctx.beginPath(); ctx.arc(0, 10, 58 - k * 14, 0, Math.PI * 2);
        ctx.lineWidth = 6; ctx.strokeStyle = P.hp; ctx.globalAlpha = a * (1 - k * 0.6); ctx.stroke();
        ctx.globalAlpha = a;
        bag(ctx, 46 - k * 8);
        checkMark(ctx, 46, -46, 22, P.hp);
      } else {
        // 失敗: 網裂成兩半往下掉 + 叉
        var d = clamp(t / 0.6, 0, 1);
        var a2 = t > 0.8 ? clamp(1 - (t - 0.8) / 0.4, 0, 1) : 1;
        ctx.globalAlpha = a2;
        [-1, 1].forEach(function (sx) {
          ctx.save();
          ctx.translate(sx * (8 + d * 26), d * 40);
          ctx.rotate(sx * d * 0.6);
          ctx.beginPath(); ctx.rect(sx < 0 ? -80 : 0, -80, 80, 160); ctx.clip();
          netDisc(ctx, 60, 0.6, '#9aa0ab');
          ctx.restore();
        });
        crossMark(ctx, 46, -46, 22, '#9aa0ab');
      }
      ctx.restore();
    },

    drawCage: function (ctx, s) {
      s = s || {};
      var x = num(s.x, 0), y = num(s.y, 0);
      var tier = s.tier || 'none';
      var broken = !!s.broken;
      var has = !!s.species && !broken;
      var t = now();
      ctx.save();
      ctx.translate(x, y);
      // 外框底
      rr(ctx, -150, -140, 300, 280, 18); ctx.fillStyle = '#0f141f'; ctx.fill();
      // 內室(-140..140, -130..72)
      ctx.save();
      rr(ctx, -140, -130, 280, 202, 12); ctx.clip();
      var wg = ctx.createLinearGradient(0, -130, 0, 72);
      wg.addColorStop(0, '#26324a'); wg.addColorStop(1, P.cageWall);
      ctx.fillStyle = wg; ctx.fillRect(-140, -130, 280, 202);
      ctx.fillStyle = '#2f2a24'; ctx.fillRect(-140, 34, 280, 38);
      if (has && tier === 'bigshow') {
        // 大場面: 金色聚光
        ctx.save(); ctx.globalAlpha = 0.35 + 0.1 * Math.sin(t * 6);
        for (var i = 0; i < 8; i++) {
          var a = t * 0.8 + i * Math.PI / 4;
          ctx.beginPath(); ctx.moveTo(0, -30);
          ctx.arc(0, -30, 220, a, a + 0.22); ctx.closePath();
          ctx.fillStyle = P.bigshow; ctx.fill();
        }
        ctx.restore();
      }
      if (has) {
        var pose = tier === 'none' ? 'sleep' : (tier === 'show' ? 'idle' : 'angry');
        var jit = (tier === 'frenzy' || tier === 'bigshow') ? Math.sin(t * 40) * 2.5 : 0;
        creature(ctx, s.species, jit, -34, 140, pose, {
          halo: tier === 'bigshow' ? 'gold' : (tier === 'frenzy' ? 'red' : null),
          steam: tier === 'frenzy' || tier === 'bigshow',
          zzz: tier === 'none'
        });
      }
      if (broken) {
        // 破損: 碎玻璃 + 爪痕, 室內空
        ctx.strokeStyle = 'rgba(220,235,255,0.7)'; ctx.lineWidth = 3;
        var ox = 10, oy = -40;
        [[-130, -110], [120, -120], [130, 20], [-120, 40], [-40, -130], [60, 60], [-140, -30]].forEach(function (p) {
          ctx.beginPath(); ctx.moveTo(ox, oy);
          ctx.lineTo((ox + p[0]) / 2 + 10, (oy + p[1]) / 2 - 8); ctx.lineTo(p[0], p[1]); ctx.stroke();
        });
        circ(ctx, ox, oy, 12); ctx.stroke();
        ctx.fillStyle = 'rgba(220,235,255,0.55)';
        [[-80, 58, 1], [-30, 64, -1], [40, 60, 1], [90, 66, -1]].forEach(function (p) {
          ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + 14 * p[2], p[1] - 10); ctx.lineTo(p[0] + 20 * p[2], p[1] + 4);
          ctx.closePath(); ctx.fill();
        });
        // 爪痕
        ctx.strokeStyle = P.danger; ctx.lineWidth = 5; ctx.lineCap = 'round';
        for (var c = 0; c < 3; c++) {
          ctx.beginPath(); ctx.moveTo(-90 + c * 14, -90); ctx.lineTo(-60 + c * 14, -30); ctx.stroke();
        }
      }
      // 玻璃反光
      if (!broken) {
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.beginPath(); ctx.moveTo(-140, -40); ctx.lineTo(-60, -130); ctx.lineTo(-30, -130); ctx.lineTo(-140, -6); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(60, 72); ctx.lineTo(140, -20); ctx.lineTo(140, 2); ctx.lineTo(80, 72); ctx.closePath(); ctx.fill();
      }
      // 拍玻璃預警: 玻璃泛洋紅
      var warn = Math.max(0, num(s.warn, 0));
      if (has && warn > 0) {
        ctx.fillStyle = 'rgba(255,90,209,' + (0.10 + 0.10 * (Math.sin(t * 18) > 0 ? 1 : 0)) + ')';
        ctx.fillRect(-140, -130, 280, 202);
      }
      // 安撫: 淡藍波紋往外擴
      var cf = clamp(num(s.calmFlash, 0) / 0.3, 0, 1);
      if (has && cf > 0) {
        ctx.fillStyle = 'rgba(168,228,255,' + (0.28 * cf) + ')';
        ctx.fillRect(-140, -130, 280, 202);
        ctx.strokeStyle = P.calm; ctx.lineWidth = 6 * cf + 1;
        for (var w = 0; w < 2; w++) {
          circ(ctx, 0, -34, 30 + (1 - cf) * 120 + w * 34); ctx.globalAlpha = cf; ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore(); // 內室 clip
      // 框
      var frameCol = P.cageFrame, frameW = 8;
      if (has && tier === 'frenzy') { frameCol = P.danger; frameW = 8 + 3 * (0.5 + 0.5 * Math.sin(t * 10)); }
      if (has && tier === 'bigshow') { frameCol = P.bigshow; frameW = 10; }
      if (broken) {
        ctx.setLineDash([18, 10]);
        rr(ctx, -146, -136, 292, 272, 16); ctx.lineWidth = 6; ctx.strokeStyle = P.danger; ctx.stroke();
        ctx.setLineDash([]);
      } else {
        rr(ctx, -146, -136, 292, 272, 16); ctx.lineWidth = frameW; ctx.strokeStyle = frameCol; ctx.stroke();
      }
      // 內框分隔線(內室 / 讀數槽)
      ctx.fillStyle = '#0f141f'; ctx.fillRect(-140, 72, 280, 6);
      // 讀數槽(怒氣條 + 倍率章)
      rr(ctx, -140, 80, 280, 52, 10); ctx.fillStyle = '#121826'; ctx.fill();
      if (has) {
        rageBar(ctx, -126, 106, 186, 20, s.rage);
        multBadge(ctx, 104, 106, 19, tier, s.streak);
      } else if (broken) {
        txt(ctx, '破損', 0, 106, 22, P.danger, 'center', 'middle', 4);
      }
      // 大場面字牌(籠頂)
      if (has && tier === 'bigshow') {
        var pop = 1 + 0.05 * Math.sin(t * 8);
        ctx.save(); ctx.translate(0, -116); ctx.scale(pop, pop);
        rr(ctx, -74, -20, 148, 40, 20); ctx.fillStyle = P.bigshow; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.font = font(26); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = P.outline; ctx.fillText('大場面', 0, 1);
        ctx.restore();
      }
      // 拍玻璃預警圖示(左上角): 手掌 + 倒數環
      if (has && warn > 0) {
        var wr = clamp(warn / 1.5, 0, 1);
        var cx = -108, cy = -98;
        circ(ctx, cx, cy, 26); ctx.fillStyle = 'rgba(10,12,20,0.85)'; ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * wr);
        ctx.lineWidth = 6; ctx.strokeStyle = P.warn; ctx.stroke();
        var bump = Math.sin(t * 18) > 0 ? 1.08 : 0.94;
        palm(ctx, cx, cy + 2, bump, P.warn);
      }
      // 選中
      if (s.selected) {
        ctx.setLineDash([14, 8]); ctx.lineDashOffset = -t * 24;
        rr(ctx, -147, -137, 294, 274, 16); ctx.lineWidth = 6; ctx.strokeStyle = P.select; ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    },

    drawShowEffect: function (ctx, s) {
      s = s || {};
      var tier = s.tier || 'show';
      if (tier === 'none') return;
      var x = num(s.x, 0), y = num(s.y, 0), t = Math.max(0, num(s.t, 0));
      var lvl = tier === 'bigshow' ? 3 : (tier === 'frenzy' ? 2 : 1);
      var life = 1.0;
      var a = t < 0.7 ? 1 : clamp(1 - (t - 0.7) / 0.35, 0, 1);
      if (a <= 0) return;
      var p = clamp(t / life, 0, 1);
      ctx.save();
      ctx.translate(x, y);
      // 只畫在內室, 不蓋讀數槽(怒氣條是決策資訊)
      rr(ctx, -140, -130, 280, 202, 12); ctx.clip();
      ctx.globalAlpha = a;
      var col = SPECIES_COLOR[s.species] || '#ffffff';
      var lt = SPECIES_LIGHT[s.species] || '#ffffff';
      var cy = -34;
      var n = lvl === 1 ? 3 : (lvl === 2 ? 6 : 9);
      var reach = 60 + lvl * 25;
      if (s.species === 'fire') {
        for (var i = 0; i < n; i++) {
          var ang = -Math.PI / 2 + (i - (n - 1) / 2) * (1.9 / n);
          var d = 30 + p * reach;
          flame(ctx, Math.cos(ang) * d, cy + Math.sin(ang) * d, 8 + lvl * 4, lvl >= 2 ? '#ff5a1a' : '#ff8a2a', '#ffe27a');
        }
        if (lvl >= 2) { circ(ctx, 0, cy, 30 + p * reach); ctx.lineWidth = 4 * lvl; ctx.strokeStyle = col; ctx.stroke(); }
      } else if (s.species === 'water') {
        for (var j = 0; j < n; j++) {
          var side = j % 2 ? 1 : -1, k2 = (Math.floor(j / 2) + 1);
          var dx = side * (20 + k2 * 22) * p;
          var dy = -Math.sin(p * Math.PI) * (50 + lvl * 20 + k2 * 6);
          circ(ctx, dx, cy + 10 + dy, 6 + lvl * 2); ctx.fillStyle = lt; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.stroke();
        }
        // 泡泡上升
        for (var b = 0; b < n; b++) {
          var bx = ((b * 53) % 220) - 110, by = 60 - ((p * 160 + b * 37) % 180);
          circ(ctx, bx, by, 4 + (b % 3) * 3); ctx.lineWidth = 2; ctx.strokeStyle = lt; ctx.stroke();
        }
        if (lvl >= 2) { ell(ctx, 0, 50, 40 + p * reach, 10 + p * 8); ctx.lineWidth = 3 * lvl; ctx.strokeStyle = col; ctx.stroke(); }
      } else if (s.species === 'thunder') {
        var flick = Math.floor(t * 20) % 2;
        for (var m = 0; m < Math.ceil(n / 1.5); m++) {
          var lx = (m - (Math.ceil(n / 1.5) - 1) / 2) * 46 + (flick ? 6 : -6);
          ctx.beginPath(); ctx.moveTo(lx, -130);
          var yy = -130;
          for (var q = 0; q < 5; q++) { yy += 22; ctx.lineTo(lx + (q % 2 ? 14 : -14), yy); }
          ctx.lineTo(lx * 0.3, cy);
          ctx.lineWidth = 3 + lvl * 2; ctx.strokeStyle = '#fff27a'; ctx.stroke();
          ctx.lineWidth = 1.5 + lvl; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        }
        if (flick) { ctx.fillStyle = 'rgba(220,196,255,' + (0.12 * lvl) + ')'; ctx.fillRect(-140, -130, 280, 202); }
      } else if (s.species === 'stone') {
        // 落石 + 地面震波(圓石, 不用尖刺)
        for (var r = 0; r < n; r++) {
          var rx = (r - (n - 1) / 2) * (220 / n);
          var ry = -130 + p * 170 + (r % 3) * 10;
          rr(ctx, rx - 10 - lvl * 2, Math.min(ry, 40), 20 + lvl * 4, 16 + lvl * 3, 6);
          ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = SPECIES_DARK.stone; ctx.stroke();
        }
        ell(ctx, 0, 52, 40 + p * reach * 1.2, 8 + p * 10); ctx.lineWidth = 3 + lvl * 2; ctx.strokeStyle = lt; ctx.stroke();
      }
      if (lvl === 3) {
        // 大場面: 金色星屑環
        for (var g = 0; g < 10; g++) {
          var ga = g * Math.PI / 5 + p * 2;
          var gd = 40 + p * 110;
          starPath(ctx, Math.cos(ga) * gd, cy + Math.sin(ga) * gd * 0.8, 9);
          ctx.fillStyle = P.bigshow; ctx.fill();
        }
      }
      ctx.restore();
    },

    drawLooseMonster: function (ctx, s) {
      s = s || {};
      var x = num(s.x, 0), y = num(s.y, 0);
      var left = clamp(Math.round(num(s.hitsLeft, 3)), 0, 3);
      var hv = hitAmt(s.hit);
      var t = now();
      ctx.save();
      ctx.translate(x, y);
      // 危險底圈
      circ(ctx, 0, 0, 58); ctx.fillStyle = 'rgba(255,59,59,' + (0.16 + 0.08 * Math.sin(t * 10)) + ')'; ctx.fill();
      // 外圈三段 = 剩幾下(長在物件外緣)
      for (var i = 0; i < 3; i++) {
        var a0 = -Math.PI / 2 + i * (Math.PI * 2 / 3) + 0.12;
        var a1 = a0 + Math.PI * 2 / 3 - 0.24;
        ctx.beginPath(); ctx.arc(0, 0, 54, a0, a1);
        ctx.lineWidth = 10; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 54, a0, a1);
        ctx.lineWidth = 6; ctx.strokeStyle = i < left ? P.danger : '#3a2a30'; ctx.stroke();
      }
      var shake = hv > 0 ? Math.sin(t * 70) * 5 * hv : 0;
      creature(ctx, s.species, shake, -2, 92, 'angry', { flash: hv });
      ctx.restore();
    },

    drawVisitor: function (ctx, s) {
      s = s || {};
      var x = num(s.x, 0), y = num(s.y, 0);
      var shirts = ['#c9b6e4', '#a8d5ba', '#f2c48d', '#9fc5e8', '#e6e6e6', '#d8c3a5'];
      var shirt = shirts[Math.abs(Math.floor(x / 7)) % shirts.length];
      ctx.save();
      ctx.translate(x, y);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ell(ctx, 0, 40, 20, 4); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      if (s.scared) {
        ctx.rotate(-0.18);
        ctx.globalAlpha = 0.9;
        // 跑步腿
        ctx.strokeStyle = '#3b4253'; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(-5, 18); ctx.lineTo(-16, 38); ctx.moveTo(5, 18); ctx.lineTo(14, 36); ctx.stroke();
        rr(ctx, -16, -14, 32, 36, 10); ctx.fillStyle = shirt; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = P.outline; ctx.stroke();
        // 雙手高舉
        ctx.strokeStyle = '#f2c9a0'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(-14, -8); ctx.lineTo(-24, -34); ctx.moveTo(14, -8); ctx.lineTo(24, -34); ctx.stroke();
        circ(ctx, 0, -28, 13); ctx.fillStyle = '#f2c9a0'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = P.outline; ctx.stroke();
        // 驚嚇臉
        circ(ctx, -4, -31, 2); circ(ctx, 4, -31, 2); ctx.fillStyle = P.outline;
        circ(ctx, -4, -31, 2); ctx.fill(); circ(ctx, 4, -31, 2); ctx.fill();
        ell(ctx, 0, -22, 3.5, 4.5); ctx.fill();
        // 汗滴
        ctx.fillStyle = '#9fdcff';
        ell(ctx, 18, -42, 3, 5); ctx.fill(); ell(ctx, -19, -44, 3, 5); ctx.fill();
      } else {
        ctx.strokeStyle = '#3b4253'; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(-6, 18); ctx.lineTo(-6, 38); ctx.moveTo(6, 18); ctx.lineTo(6, 38); ctx.stroke();
        rr(ctx, -16, -14, 32, 36, 10); ctx.fillStyle = shirt; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = P.outline; ctx.stroke();
        circ(ctx, 0, -28, 13); ctx.fillStyle = '#f2c9a0'; ctx.fill(); ctx.stroke();
        // 背影(朝籠子看), 只畫頭髮
        ctx.beginPath(); ctx.arc(0, -30, 13, Math.PI * 0.95, Math.PI * 2.05); ctx.closePath();
        ctx.fillStyle = '#4a3a30'; ctx.fill();
      }
      ctx.restore();
    },

    drawTrayMonster: function (ctx, s) {
      s = s || {};
      var x = num(s.x, 0), y = num(s.y, 0);
      var sel = !!s.selected;
      ctx.save();
      ctx.translate(x, y);
      // 底座
      ell(ctx, 0, 38, 42, 10); ctx.fillStyle = sel ? '#6b5236' : '#4f3b28'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = sel ? P.select : '#2a1e14'; ctx.stroke();
      if (sel) {
        circ(ctx, 0, -6, 48); ctx.fillStyle = 'rgba(255,243,196,0.16)'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = P.select; ctx.stroke();
      }
      creature(ctx, s.species, 0, sel ? -10 : -2, 76, 'idle', {});
      ctx.restore();
    },

    drawButton: function (ctx, s) {
      s = s || {};
      var x = num(s.x, 0), y = num(s.y, 0), w = num(s.w, 200), h = num(s.h, 80);
      var en = s.enabled !== false, act = !!s.active;
      var r = Math.min(18, h / 2);
      ctx.save();
      if (!en) {
        rr(ctx, x, y, w, h, r); ctx.fillStyle = P.btnOff; ctx.fill();
        ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.strokeStyle = '#5a6278'; ctx.stroke(); ctx.setLineDash([]);
        txt(ctx, s.label || '', x + w / 2, y + h / 2, Math.min(34, h * 0.42), '#7d8699', 'center', 'middle', 0);
      } else if (act) {
        // 啟用中(例: 丟網模式): 按下去 + 網色發光
        var t = now();
        rr(ctx, x - 6, y - 2, w + 12, h + 12, r + 6);
        ctx.fillStyle = 'rgba(143,240,255,' + (0.25 + 0.15 * Math.sin(t * 8)) + ')'; ctx.fill();
        rr(ctx, x, y + 6, w, h, r); ctx.fillStyle = P.netMode; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        txt(ctx, s.label || '', x + w / 2, y + 6 + h / 2, Math.min(34, h * 0.42), P.outline, 'center', 'middle', 0);
      } else {
        rr(ctx, x, y + 6, w, h, r); ctx.fillStyle = '#9a7a3a'; ctx.fill();
        rr(ctx, x, y, w, h, r); ctx.fillStyle = P.btn; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
        txt(ctx, s.label || '', x + w / 2, y + h / 2, Math.min(34, h * 0.42), P.outline, 'center', 'middle', 0);
      }
      ctx.restore();
    },

    drawShopItem: function (ctx, s) {
      s = s || {};
      var x = num(s.x, 360), y = num(s.y, 0);
      var info = {
        weapon: ['武器', '攻擊 +2'],
        armor: ['護甲', '血量上限 +15'],
        netBag: ['網袋', '網數上限 +1'],
        goodNet: ['好網', '捕獲率 +10%']
      }[s.item] || ['?', ''];
      var ok = !!s.affordable;
      ctx.save();
      ctx.translate(x, y);
      // 卡片
      rr(ctx, -300, -70, 600, 140, 18);
      ctx.fillStyle = ok ? P.panelHi : '#1b2030'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = ok ? '#6c7896' : '#2c3346'; ctx.stroke();
      ctx.globalAlpha = ok ? 1 : 0.5;
      // 圖示框
      rr(ctx, -284, -54, 108, 108, 14); ctx.fillStyle = '#121826'; ctx.fill();
      shopIcon(ctx, s.item, -230, 0);
      // 名稱 + 效果
      txt(ctx, info[0], -156, -22, 32, P.text, 'left', 'middle', 0);
      txt(ctx, info[1], -156, 22, 22, P.textDim, 'left', 'middle', 0);
      txt(ctx, 'Lv.' + Math.max(0, num(s.level, 0)), 40, -22, 20, P.textDim, 'left', 'middle', 0);
      ctx.globalAlpha = 1;
      // 價格章
      var cost = Math.round(num(s.cost, 0));
      if (ok) {
        rr(ctx, 110, -24 + 5, 170, 60, 14); ctx.fillStyle = '#9a7a3a'; ctx.fill();
        rr(ctx, 110, -24, 170, 60, 14); ctx.fillStyle = P.btn; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
        coinIcon(ctx, 142, 6, 14);
        txt(ctx, cost, 166, 6, 30, P.outline, 'left', 'middle', 0);
      } else {
        rr(ctx, 110, -20, 170, 60, 14); ctx.fillStyle = P.btnOff; ctx.fill();
        ctx.setLineDash([8, 6]); ctx.lineWidth = 3; ctx.strokeStyle = '#5a6278'; ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = 0.6; coinIcon(ctx, 142, 10, 14); ctx.globalAlpha = 1;
        txt(ctx, cost, 166, 10, 30, '#7d8699', 'left', 'middle', 0);
      }
      ctx.restore();
    },

    drawFloatText: function (ctx, s) {
      s = s || {};
      var t = Math.max(0, num(s.t, 0));
      var a = t < 0.7 ? 1 : clamp(1 - (t - 0.7) / 0.5, 0, 1);
      if (a <= 0) return;
      var text = String(s.text == null ? '' : s.text);
      var kind = s.kind || 'gold';
      var col, px = 30;
      if (kind === 'gold') col = P.gold;
      else if (kind === 'repUp') col = P.rep;
      else if (kind === 'repDown') { col = P.danger; px = 32; }
      else {
        // 怒氣: 減(安撫)用安撫藍, 加用怒氣紅
        col = /^[-−]/.test(text) ? P.calm : P.rageRed;
      }
      var pop = t < 0.12 ? 0.7 + 0.3 * (t / 0.12) * 1.15 : 1;
      var x = num(s.x, 0), y = num(s.y, 0) - t * 70;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(x, y); ctx.scale(pop, pop);
      ctx.font = font(px);
      var w = (ctx.measureText(text) || { width: 0 }).width || 0;
      var iconR = 13;
      var total = w + iconR * 2 + 6;
      var ix = -total / 2 + iconR;
      if (kind === 'gold') coinIcon(ctx, ix, 0, iconR);
      else if (kind === 'repUp') starIcon(ctx, ix, 0, iconR + 2, P.rep);
      else if (kind === 'repDown') starIcon(ctx, ix, 0, iconR + 2, P.danger);
      else {
        // 怒氣圖示: 小火苗(加)/ 水滴(減)
        if (col === P.calm) {
          ctx.beginPath(); ctx.moveTo(ix, -iconR); ctx.quadraticCurveTo(ix + iconR, iconR * 0.3, ix, iconR);
          ctx.quadraticCurveTo(ix - iconR, iconR * 0.3, ix, -iconR); ctx.fillStyle = P.calm; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
        } else {
          flame(ctx, ix, 3, 8, P.rageRed, '#ffb02e');
        }
      }
      txt(ctx, text, ix + iconR + 6, 1, px, col, 'left', 'middle', 6);
      ctx.restore();
    },

    drawResultPanel: function (ctx, s) {
      s = s || {};
      var stars = clamp(Math.round(num(s.stars, 0)), 0, 3);
      ctx.save();
      ctx.fillStyle = 'rgba(6,8,14,0.82)'; ctx.fillRect(0, 0, 720, 1280);
      rr(ctx, 60, 250, 600, 720, 28); ctx.fillStyle = P.panel; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = '#55607a'; ctx.stroke();
      txt(ctx, '三天結算', 360, 330, 48, P.text);
      for (var i = 0; i < 3; i++) {
        var sx = 240 + i * 120;
        starPath(ctx, sx, 470, 50);
        ctx.fillStyle = i < stars ? P.bigshow : '#2a3142'; ctx.fill();
        ctx.lineWidth = 5; ctx.strokeStyle = i < stars ? P.outline : '#3c455c'; ctx.stroke();
      }
      starIcon(ctx, 170, 620, 22, P.rep);
      txt(ctx, '總名聲', 204, 620, 30, P.textDim, 'left');
      txt(ctx, Math.round(num(s.rep, 0)), 560, 620, 48, P.text, 'right');
      coinIcon(ctx, 170, 720, 20);
      txt(ctx, '累計金幣', 204, 720, 30, P.textDim, 'left');
      txt(ctx, Math.round(num(s.goldEarned, 0)), 560, 720, 48, P.gold, 'right');
      txt(ctx, '一星 60・二星 120・三星 200', 360, 800, 20, P.textDim);
      var blink = 0.6 + 0.4 * Math.sin(now() * 4);
      ctx.globalAlpha = blink;
      txt(ctx, '點畫面重來', 360, 900, 30, P.select);
      ctx.restore();
    },

    drawHud: function (ctx, s) {
      s = s || {};
      var ph = s.phase || 'dungeon';
      if (ph === 'guide' || ph === 'result') return;
      ctx.save();
      ctx.fillStyle = P.hudBg; ctx.fillRect(0, 0, 720, 120);
      ctx.fillStyle = '#232a3d'; ctx.fillRect(0, 118, 720, 2);
      // 左: 天數 + 階段
      txt(ctx, '第 ' + num(s.day, 1) + ' / 3 天', 24, 38, 30, P.text, 'left', 'middle', 0);
      var phaseName = { dungeon: '地下城 第 ' + num(s.room, 1) + ' / 2 房', place: '擺放魔物', show: '開園中', shop: '商店' }[ph] || '';
      txt(ctx, phaseName, 24, 82, 22, P.textDim, 'left', 'middle', 0);
      // 右: 金幣 + 名聲(常駐固定位置)
      coinIcon(ctx, 530, 38, 15);
      txt(ctx, Math.round(num(s.gold, 0)), 556, 38, 30, P.gold, 'left', 'middle', 0);
      starIcon(ctx, 530, 84, 16, P.rep);
      txt(ctx, Math.round(num(s.rep, 0)), 556, 84, 30, P.text, 'left', 'middle', 0);
      // 中: 依階段
      if (ph === 'dungeon') {
        txt(ctx, 'HP', 262, 38, 20, P.textDim, 'left', 'middle', 0);
        hpBar(ctx, 390, 38, 170, 16, num(s.hp, 0), num(s.maxHp, 1), false);
        txt(ctx, Math.max(0, Math.round(num(s.hp, 0))) + '/' + Math.round(num(s.maxHp, 0)), 484, 38, 18, P.text, 'right', 'middle', 0);
        txt(ctx, '網', 262, 84, 20, P.textDim, 'left', 'middle', 0);
        var nets = Math.max(0, Math.round(num(s.nets, 0))), nmax = Math.max(nets, Math.round(num(s.netMax, 0)));
        if (nmax <= 7) {
          for (var i = 0; i < nmax; i++) netIcon(ctx, 306 + i * 30, 84, 12, i < nets);
        } else {
          netIcon(ctx, 306, 84, 12, nets > 0);
          txt(ctx, nets + ' / ' + nmax, 326, 84, 22, P.text, 'left', 'middle', 0);
        }
      } else if (ph === 'show') {
        var tl = Math.max(0, num(s.timeLeft, 0));
        var sec = Math.ceil(tl);
        txt(ctx, sec, 360, 52, 56, sec <= 10 ? P.danger : P.text, 'center', 'middle', 0);
        txt(ctx, '秒', 360, 96, 18, P.textDim, 'center', 'middle', 0);
      }
      // 提示訊息: HUD 下方膠囊(120~160 的空帶)
      if (s.message) {
        ctx.font = font(22);
        var mw = (ctx.measureText(String(s.message)) || { width: 200 }).width || 200;
        var bw = mw + 48;
        var urgent = /抓回/.test(String(s.message));
        rr(ctx, 360 - bw / 2, 124, bw, 34, 17);
        ctx.fillStyle = urgent ? 'rgba(90,20,28,0.92)' : 'rgba(35,42,61,0.92)'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = urgent ? P.danger : '#55607a'; ctx.stroke();
        txt(ctx, s.message, 360, 141, 22, urgent ? '#ffd0d0' : P.text, 'center', 'middle', 0);
      }
      ctx.restore();
    },

    // 說明頁示意圖: 只畫在 (x, y, w, h) 內; 文字與頁碼由 RD 畫
    drawGuidePage: function (ctx, s) {
      s = s || {};
      var page = Math.round(num(s.page, 0));
      var bx = num(s.x, 0), by = num(s.y, 0), bw = num(s.w, 640), bh = num(s.h, 640);
      var V = 640; // 虛擬方框 640×640, 等比縮放置中
      var k = Math.min(bw / V, bh / V);
      ctx.save();
      ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
      ctx.translate(bx + (bw - V * k) / 2, by + (bh - V * k) / 2);
      ctx.scale(k, k);
      rr(ctx, 0, 0, V, V, 24); ctx.fillStyle = '#10141f'; ctx.fill();
      ctx.save();
      rr(ctx, 0, 0, V, V, 24); ctx.clip();
      var pageFn = GUIDE[page];
      if (pageFn) pageFn(ctx, V);
      ctx.restore();
      ctx.restore();
    }
  };

  // ---------- 內部: 網、商店圖示 ----------
  function netDisc(ctx, r, alpha, color) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    circ(ctx, 0, 0, r); ctx.fillStyle = 'rgba(244,231,195,0.12)'; ctx.fill();
    ctx.save(); circ(ctx, 0, 0, r); ctx.clip();
    ctx.strokeStyle = color || P.net; ctx.lineWidth = 2.5;
    var step = Math.max(8, r / 4);
    for (var v = -r; v <= r; v += step) {
      ctx.beginPath(); ctx.moveTo(v, -r); ctx.lineTo(v + r * 0.3, r); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r, v); ctx.lineTo(r, v - r * 0.3); ctx.stroke();
    }
    ctx.restore();
    circ(ctx, 0, 0, r); ctx.lineWidth = 4; ctx.strokeStyle = color || P.net; ctx.stroke();
    ctx.fillStyle = '#8a7a5a';
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4;
      circ(ctx, Math.cos(a) * r, Math.sin(a) * r, 4.5); ctx.fill();
    }
    ctx.restore();
  }
  function bag(ctx, r) {
    ctx.beginPath();
    ctx.moveTo(-8, -r);
    ctx.quadraticCurveTo(-r * 1.1, -r * 0.4, -r * 0.8, r * 0.5);
    ctx.quadraticCurveTo(0, r * 1.15, r * 0.8, r * 0.5);
    ctx.quadraticCurveTo(r * 1.1, -r * 0.4, 8, -r);
    ctx.closePath();
    ctx.fillStyle = 'rgba(244,231,195,0.25)'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = P.net; ctx.lineWidth = 2.5;
    for (var v = -r * 1.2; v <= r * 1.2; v += 11) {
      ctx.beginPath(); ctx.moveTo(v, -r); ctx.lineTo(v + r * 0.6, r * 1.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(v, -r); ctx.lineTo(v - r * 0.6, r * 1.2); ctx.stroke();
    }
    ctx.restore();
    ctx.lineWidth = 4; ctx.strokeStyle = P.net; ctx.stroke();
    rr(ctx, -12, -r - 8, 24, 10, 4); ctx.fillStyle = '#8a7a5a'; ctx.fill();
  }
  function netIcon(ctx, cx, cy, r, full) {
    ctx.save(); ctx.translate(cx, cy);
    if (full) {
      netDisc(ctx, r, 1);
    } else {
      circ(ctx, 0, 0, r); ctx.setLineDash([4, 4]); ctx.lineWidth = 2; ctx.strokeStyle = '#4a5268'; ctx.stroke();
    }
    ctx.restore();
  }
  function shopIcon(ctx, item, cx, cy) {
    ctx.save(); ctx.translate(cx, cy);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = P.outline; ctx.lineWidth = 3;
    if (item === 'weapon') {
      ctx.rotate(0.7);
      rr(ctx, -5, -40, 10, 56, 4); ctx.fillStyle = '#dfe7f2'; ctx.fill(); ctx.stroke();
      rr(ctx, -16, 14, 32, 8, 4); ctx.fillStyle = '#c9a23a'; ctx.fill(); ctx.stroke();
      rr(ctx, -4, 22, 8, 18, 3); ctx.fillStyle = '#6b4a2a'; ctx.fill(); ctx.stroke();
    } else if (item === 'armor') {
      ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(30, -24); ctx.quadraticCurveTo(30, 18, 0, 38);
      ctx.quadraticCurveTo(-30, 18, -30, -24); ctx.closePath();
      ctx.fillStyle = '#9fb3d1'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(0, 26); ctx.lineWidth = 4; ctx.strokeStyle = '#5a6f90'; ctx.stroke();
    } else if (item === 'netBag') {
      bag(ctx, 30);
      txt(ctx, '+1', 26, 26, 22, P.text, 'center', 'middle', 4);
    } else if (item === 'goodNet') {
      netDisc(ctx, 32, 1);
      starIcon(ctx, 26, -26, 12, P.gold);
    }
    ctx.restore();
  }

  // ---------- 說明頁(虛擬 640×640) ----------
  function label(ctx, s, x, y, col) { txt(ctx, s, x, y, 24, col || P.text, 'center', 'middle', 5); }
  function arrowR(ctx, x0, y, x1, col) {
    ctx.save(); ctx.strokeStyle = col || P.text; ctx.fillStyle = col || P.text; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1 - 10, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 - 16, y - 12); ctx.lineTo(x1 - 16, y + 12); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function scaled(ctx, x, y, sc, fn) { ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); fn(); ctx.restore(); }

  var GUIDE = [
    // 0 目標: 籠中魔物表演、遊客圍觀、名聲往上跳; 角落「第 1~3 天」
    function (ctx, V) {
      ctx.fillStyle = P.zooFloor; ctx.fillRect(0, 0, V, 470);
      ctx.fillStyle = P.path; ctx.fillRect(0, 470, V, 170);
      ctx.fillStyle = '#6b5a44'; ctx.fillRect(0, 466, V, 8);
      // 迷你 HUD: 名聲
      rr(ctx, 400, 18, 220, 60, 14); ctx.fillStyle = P.hudBg; ctx.fill();
      starIcon(ctx, 432, 48, 16, P.rep);
      txt(ctx, '128', 458, 48, 30, P.text, 'left', 'middle', 0);
      Art.drawFloatText(ctx, { x: 560, y: 110, text: '+3', kind: 'repUp', t: 0.4 });
      // 角落: 第 1~3 天
      rr(ctx, 20, 18, 190, 60, 14); ctx.fillStyle = P.hudBg; ctx.fill();
      txt(ctx, '第 1~3 天', 115, 48, 28, P.text, 'center', 'middle', 0);
      // 兩個籠子
      scaled(ctx, 0, 0, 0.98, function () {
        Art.drawCage(ctx, { x: 168, y: 300, species: 'water', rage: 62, tier: 'show', streak: 0, warn: 0, calmFlash: 0, broken: false, selected: false });
        Art.drawShowEffect(ctx, { x: 168, y: 300, species: 'water', tier: 'show', t: 0.45 });
        Art.drawCage(ctx, { x: 485, y: 300, species: 'fire', rage: 88, tier: 'frenzy', streak: 5, warn: 0, calmFlash: 0, broken: false, selected: false });
        Art.drawShowEffect(ctx, { x: 485, y: 300, species: 'fire', tier: 'frenzy', t: 0.4 });
      });
      Art.drawFloatText(ctx, { x: 470, y: 220, text: '+15', kind: 'gold', t: 0.3 });
      // 遊客
      for (var i = 0; i < 6; i++) Art.drawVisitor(ctx, { x: 70 + i * 100, y: 560, scared: false });
    },
    // 1 地下城戰鬥: 三隻魔物, 手指點中間那隻, 受擊、血條減少; 下方玩家
    function (ctx, V) {
      paintDungeon(ctx, V, V, 1, 1, 300);
      scaled(ctx, 0, 0, 0.9, function () {
        Art.drawMonster(ctx, { x: 120, y: 220, species: 'water', hp: 8, maxHp: 8, hit: false, aimNet: false });
        Art.drawMonster(ctx, { x: 356, y: 220, species: 'fire', hp: 6, maxHp: 10, hit: 0.25, aimNet: false });
        Art.drawMonster(ctx, { x: 592, y: 220, species: 'stone', hp: 16, maxHp: 16, hit: false, aimNet: false });
        Art.drawPlayer(ctx, { x: 356, y: 560, hp: 38, maxHp: 40, hit: false });
      });
      finger(ctx, 368, 222, 1.1);
    },
    // 2 捕獲: 按鈕亮 → 網丟向殘血魔物 → 收進候展區; 對照滿血打叉 / 殘血打勾
    function (ctx, V) {
      paintDungeon(ctx, V, 330, 2, 1, 120);
      // 上排兩格
      Art.drawButton(ctx, { x: 30, y: 230, w: 200, h: 70, label: '捕獲網', enabled: true, active: true });
      finger(ctx, 150, 268, 0.8);
      scaled(ctx, 0, 0, 0.8, function () {
        Art.drawMonster(ctx, { x: 340, y: 150, species: 'thunder', hp: 2, maxHp: 12, hit: false, aimNet: true });
        Art.drawNet(ctx, { x: 340, y: 150, t: 0.2, result: 'flying' });
      });
      arrowR(ctx, 360, 160, 420);
      rr(ctx, 430, 70, 196, 180, 14); ctx.fillStyle = P.tray; ctx.fill();
      ctx.fillStyle = '#4f3827'; ctx.fillRect(430, 236, 196, 14);
      Art.drawTrayMonster(ctx, { x: 528, y: 170, species: 'thunder', selected: false });
      label(ctx, '候展區', 528, 96, P.textDim);
      // 分隔
      ctx.fillStyle = '#232a3d'; ctx.fillRect(0, 330, V, 6);
      // 下排對照
      scaled(ctx, 0, 0, 0.85, function () {
        Art.drawMonster(ctx, { x: 188, y: 520, species: 'stone', hp: 16, maxHp: 16, hit: false, aimNet: false });
        Art.drawNet(ctx, { x: 188, y: 520, t: 0.15, result: 'fail' });
        Art.drawMonster(ctx, { x: 565, y: 520, species: 'water', hp: 1, maxHp: 8, hit: false, aimNet: false });
        Art.drawNet(ctx, { x: 565, y: 520, t: 0.3, result: 'success' });
      });
      label(ctx, '滿血', 160, 370);
      label(ctx, '殘血', 480, 370);
    },
    // 3 怒氣與表演: 低怒氣趴著 vs 高怒氣放技能 + 金幣
    function (ctx, V) {
      ctx.fillStyle = P.zooFloor; ctx.fillRect(0, 0, V, V);
      scaled(ctx, 0, 0, 0.98, function () {
        Art.drawCage(ctx, { x: 168, y: 340, species: 'stone', rage: 20, tier: 'none', streak: 0, warn: 0, calmFlash: 0, broken: false, selected: false });
        Art.drawCage(ctx, { x: 485, y: 340, species: 'thunder', rage: 90, tier: 'bigshow', streak: 9, warn: 0, calmFlash: 0, broken: false, selected: false });
        Art.drawShowEffect(ctx, { x: 485, y: 340, species: 'thunder', tier: 'bigshow', t: 0.35 });
      });
      Art.drawFloatText(ctx, { x: 476, y: 150, text: '+32', kind: 'gold', t: 0.25 });
      label(ctx, '怒氣低', 165, 520, P.textDim);
      label(ctx, '怒氣高', 475, 520, P.rageRed);
    },
    // 4 安撫與失控: 左 點籠子怒氣降; 右 破籠, 魔物衝向遊客(打叉)
    function (ctx, V) {
      ctx.fillStyle = P.zooFloor; ctx.fillRect(0, 0, V, 420);
      ctx.fillStyle = P.path; ctx.fillRect(0, 420, V, 220);
      ctx.fillStyle = '#6b5a44'; ctx.fillRect(0, 416, V, 8);
      scaled(ctx, 0, 0, 0.98, function () {
        Art.drawCage(ctx, { x: 168, y: 230, species: 'fire', rage: 68, tier: 'show', streak: 0, warn: 0, calmFlash: 0.22, broken: false, selected: false });
        Art.drawCage(ctx, { x: 485, y: 230, species: 'water', rage: 100, tier: 'none', streak: 0, warn: 0, calmFlash: 0, broken: true, selected: false });
      });
      Art.drawFloatText(ctx, { x: 150, y: 320, text: '-15', kind: 'rage', t: 0.3 });
      finger(ctx, 200, 210, 1.0);
      // 怒氣下降箭頭(貼在怒氣條上)
      ctx.save(); ctx.fillStyle = P.calm;
      ctx.beginPath(); ctx.moveTo(110, 306); ctx.lineTo(126, 306); ctx.lineTo(118, 318); ctx.closePath(); ctx.fill();
      ctx.restore();
      // 逃脫魔物 → 遊客
      Art.drawLooseMonster(ctx, { x: 420, y: 500, species: 'water', hitsLeft: 3, hit: false });
      ctx.save(); ctx.setLineDash([10, 8]); ctx.strokeStyle = P.danger; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(470, 400); ctx.lineTo(440, 450); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
      arrowR(ctx, 480, 520, 530, P.danger);
      Art.drawVisitor(ctx, { x: 580, y: 530, scared: true });
      crossMark(ctx, 600, 470, 20, P.danger);
      Art.drawFloatText(ctx, { x: 560, y: 610, text: '-3', kind: 'repDown', t: 0.3 });
    }
  ];

  window.Art = Art;
})();
