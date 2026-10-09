// 大場面動物園: 深入一層 — 美術(Canvas 2D 幾何, 零外部資源)
// 全域物件 window.Art, 不用 ES module。所有座標 x,y 為物件中心; drawButton 的 x,y 為左上角。
(function () {
  'use strict';

  var W = 720, H = 1280;

  var P = {
    bg: '#141824',
    hudBg: '#1b2131',
    hudLine: '#323b55',
    text: '#f2f4f8',
    textDim: '#9aa3b8',
    outline: '#0b0e16',
    gold: '#ffcc33',       // 金幣 / 一般表演怒氣段
    rep: '#ff8fd0',        // 名聲
    select: '#4fe3ff',     // 你選中的 / 你正在瞄準的 / 啟用中的模式
    calm: '#7cf5c0',       // 安撫
    danger: '#ff4a4a',     // 危險: 扣血、高怒氣、失控、名聲減少、失敗
    ok: '#5fe08a',         // 成功(勾)
    hp: '#5fd36a',         // 血條
    star: '#fff0a0',       // 魔物星級
    rageNone: '#7d8aa8',   // 怒氣 0~39
    rageShow: '#ffcc33',   // 怒氣 40~79
    rageFrenzy: '#ff4a4a', // 怒氣 80~99
    fire: '#ff8a2a',
    water: '#3c8cff',
    thunder: '#a46cff',
    stone: '#9aa0a8',
    player: '#d9b27a',
    playerArmor: '#c9d2e0',
    net: '#eadcb8',
    wall: '#3a3448',
    floor: '#4a4250',
    grass: '#35603a',
    sand: '#c9b07a',
    btn: '#2c3550',
    btnOff: '#1d2233',
    panel: '#232a3e'
  };

  var SPECIES_NAME = { fire: '火蜥蜴', water: '水母', thunder: '雷鳥', stone: '石像鬼' };

  // ---------- 小工具 ----------
  function now() {
    return (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) / 1000;
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function num(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; }
  function hex2rgb(h) {
    h = h.replace('#', '');
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  function mix(a, b, t) {
    var A = hex2rgb(a), B = hex2rgb(b);
    var r = Math.round(A[0] + (B[0] - A[0]) * t), g = Math.round(A[1] + (B[1] - A[1]) * t), bl = Math.round(A[2] + (B[2] - A[2]) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }
  function rgba(h, a) { var c = hex2rgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
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
  function starPath(ctx, cx, cy, r) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var rad = (i % 2 === 0) ? r : r * 0.45;
      var px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  function txt(ctx, s, x, y, size, color, align, outlineW) {
    ctx.font = 'bold ' + size + 'px "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    if (outlineW !== 0) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = outlineW || Math.max(3, size * 0.18);
      ctx.strokeStyle = P.outline;
      ctx.strokeText(s, x, y);
    }
    ctx.fillStyle = color || P.text;
    ctx.fillText(s, x, y);
  }
  // 星級: n 顆星水平置中
  function stars(ctx, cx, cy, n, r, color) {
    n = clamp(Math.round(num(n, 1)), 0, 3);
    var gap = r * 2.1;
    var x0 = cx - (n - 1) * gap / 2;
    for (var i = 0; i < n; i++) {
      starPath(ctx, x0 + i * gap, cy, r);
      ctx.fillStyle = color || P.star;
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, r * 0.28);
      ctx.strokeStyle = P.outline;
      ctx.stroke();
    }
  }
  function coin(ctx, x, y, r) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = P.gold; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.22); ctx.strokeStyle = '#7a5a00'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(1, r * 0.14); ctx.strokeStyle = '#b8860b'; ctx.stroke();
  }
  function crown(ctx, x, y, r) { // 名聲圖示
    ctx.beginPath();
    ctx.moveTo(x - r, y + r * 0.6);
    ctx.lineTo(x - r, y - r * 0.4);
    ctx.lineTo(x - r * 0.5, y + r * 0.05);
    ctx.lineTo(x, y - r * 0.7);
    ctx.lineTo(x + r * 0.5, y + r * 0.05);
    ctx.lineTo(x + r, y - r * 0.4);
    ctx.lineTo(x + r, y + r * 0.6);
    ctx.closePath();
    ctx.fillStyle = P.rep; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.2); ctx.strokeStyle = P.outline; ctx.lineJoin = 'round'; ctx.stroke();
  }
  function netIcon(ctx, x, y, r, filled) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = filled ? rgba(P.net, 0.25) : 'rgba(0,0,0,0.25)';
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.18);
    ctx.strokeStyle = filled ? P.net : '#4a5270';
    ctx.stroke();
    ctx.clip();
    ctx.lineWidth = Math.max(1, r * 0.12);
    for (var i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(x + i * r * 0.45 - r, y - r); ctx.lineTo(x + i * r * 0.45 + r, y + r); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + i * r * 0.45 + r, y - r); ctx.lineTo(x + i * r * 0.45 - r, y + r); ctx.stroke();
    }
    ctx.restore();
  }
  function checkMark(ctx, x, y, r) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = P.ok; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - r * 0.5, y + r * 0.02); ctx.lineTo(x - r * 0.12, y + r * 0.42); ctx.lineTo(x + r * 0.55, y - r * 0.38);
    ctx.lineWidth = r * 0.28; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  }
  function crossMark(ctx, x, y, r) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = P.danger; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - r * 0.42, y - r * 0.42); ctx.lineTo(x + r * 0.42, y + r * 0.42);
    ctx.moveTo(x + r * 0.42, y - r * 0.42); ctx.lineTo(x - r * 0.42, y + r * 0.42);
    ctx.lineWidth = r * 0.28; ctx.lineCap = 'round'; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  }
  function shakeOffset(on, amp) {
    if (!on) return [0, 0];
    var t = now() * 60;
    return [Math.sin(t * 1.7) * amp, Math.cos(t * 2.3) * amp * 0.6];
  }

  // ---------- 魔物本體(共用於地下城、籠子、候展、逃脫) ----------
  // mood: idle | sleep | angry | ko ; flash: 受擊變白比例 0~1
  function eyes(ctx, x, y, gap, er, mood) {
    for (var s = -1; s <= 1; s += 2) {
      var ex = x + s * gap / 2;
      if (mood === 'sleep') {
        ctx.beginPath(); ctx.arc(ex, y, er * 0.8, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.lineWidth = Math.max(2, er * 0.35); ctx.strokeStyle = P.outline; ctx.lineCap = 'round'; ctx.stroke();
      } else if (mood === 'ko') {
        ctx.beginPath();
        ctx.moveTo(ex - er * 0.7, y - er * 0.7); ctx.lineTo(ex + er * 0.7, y + er * 0.7);
        ctx.moveTo(ex + er * 0.7, y - er * 0.7); ctx.lineTo(ex - er * 0.7, y + er * 0.7);
        ctx.lineWidth = Math.max(2, er * 0.35); ctx.strokeStyle = P.outline; ctx.lineCap = 'round'; ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(ex, y, er, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.lineWidth = Math.max(1.5, er * 0.2); ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.beginPath(); ctx.arc(ex + s * er * 0.12, y + er * 0.1, er * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = P.outline; ctx.fill();
        if (mood === 'angry') {
          ctx.beginPath();
          ctx.moveTo(ex - er * 1.1 * s, y - er * 1.6);
          ctx.lineTo(ex + er * 0.9 * s, y - er * 0.85);
          ctx.lineWidth = Math.max(2.5, er * 0.45); ctx.strokeStyle = P.outline; ctx.lineCap = 'round'; ctx.stroke();
        }
      }
    }
  }

  function creature(ctx, sp, r, mood, flash) {
    // 原點為身體中心; 呼叫端負責 translate
    var base = P[sp] || P.stone;
    var body = flash > 0 ? mix(base, '#ffffff', 0.65 * flash) : base;
    if (mood === 'ko') body = mix(base, '#555a66', 0.6);
    var dark = mix(base, '#000000', 0.35);
    var light = mix(base, '#ffffff', 0.45);
    var lw = Math.max(2, r * 0.07);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = P.outline; ctx.lineWidth = lw;

    if (mood === 'sleep') { ctx.translate(0, r * 0.15); ctx.scale(1.08, 0.85); }
    if (mood === 'ko') { ctx.rotate(0.5); }

    // 影子
    ctx.beginPath(); ctx.ellipse(0, r * 0.95, r * 0.9, r * 0.18, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();

    if (sp === 'fire') {
      // 尾巴
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, r * 0.2);
      ctx.quadraticCurveTo(-r * 1.3, r * 0.3, -r * 1.15, -r * 0.35);
      ctx.lineWidth = r * 0.26; ctx.strokeStyle = P.outline; ctx.stroke();
      ctx.lineWidth = r * 0.16; ctx.strokeStyle = body; ctx.stroke();
      // 尾巴火焰
      ctx.beginPath();
      ctx.moveTo(-r * 1.15, -r * 0.3);
      ctx.quadraticCurveTo(-r * 1.45, -r * 0.6, -r * 1.15, -r * 0.95);
      ctx.quadraticCurveTo(-r * 0.9, -r * 0.6, -r * 1.15, -r * 0.3);
      ctx.fillStyle = '#ffd34a'; ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.strokeStyle = P.outline; ctx.stroke();
      // 腳
      ctx.fillStyle = dark;
      [-0.45, 0.35].forEach(function (fx) { rr(ctx, r * fx - r * 0.12, r * 0.45, r * 0.24, r * 0.4, r * 0.1); ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.stroke(); });
      // 身體
      ctx.beginPath(); ctx.ellipse(-r * 0.05, r * 0.25, r * 0.75, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = body; ctx.fill(); ctx.lineWidth = lw; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, r * 0.42, r * 0.45, r * 0.18, 0, 0, Math.PI * 2);
      ctx.fillStyle = light; ctx.fill();
      // 背刺(圓頭小鰭)
      ctx.fillStyle = '#ffd34a';
      [-0.4, -0.05, 0.3].forEach(function (fx) { ctx.beginPath(); ctx.arc(r * fx, -r * 0.18, r * 0.12, Math.PI, 0); ctx.fill(); });
      // 頭
      ctx.beginPath(); ctx.ellipse(r * 0.62, -r * 0.2, r * 0.48, r * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = body; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = P.outline; ctx.stroke();
      eyes(ctx, r * 0.66, -r * 0.3, r * 0.36, r * 0.15, mood);
    } else if (sp === 'water') {
      // 觸手
      ctx.lineWidth = r * 0.14;
      for (var i = 0; i < 5; i++) {
        var tx = -r * 0.6 + i * r * 0.3;
        ctx.beginPath(); ctx.moveTo(tx, r * 0.1);
        ctx.bezierCurveTo(tx - r * 0.2, r * 0.4, tx + r * 0.2, r * 0.6, tx, r * 0.9);
        ctx.strokeStyle = P.outline; ctx.lineWidth = r * 0.2; ctx.stroke();
        ctx.strokeStyle = light; ctx.lineWidth = r * 0.11; ctx.stroke();
      }
      // 傘
      ctx.beginPath();
      ctx.moveTo(-r * 0.9, r * 0.15);
      ctx.bezierCurveTo(-r * 0.95, -r * 1.0, r * 0.95, -r * 1.0, r * 0.9, r * 0.15);
      for (var k = 0; k < 6; k++) {
        var x1 = r * 0.9 - (k + 0.5) * r * 0.3, x2 = r * 0.9 - (k + 1) * r * 0.3;
        ctx.quadraticCurveTo(x1, r * 0.32, x2, r * 0.15);
      }
      ctx.closePath();
      ctx.fillStyle = body; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = P.outline; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.5, r * 0.18, r * 0.1, -0.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
      eyes(ctx, 0, -r * 0.2, r * 0.5, r * 0.17, mood);
    } else if (sp === 'thunder') {
      // 翅膀(鋸齒閃電邊)
      for (var s2 = -1; s2 <= 1; s2 += 2) {
        ctx.beginPath();
        ctx.moveTo(s2 * r * 0.45, -r * 0.2);
        ctx.lineTo(s2 * r * 1.25, -r * 0.55);
        ctx.lineTo(s2 * r * 1.0, -r * 0.15);
        ctx.lineTo(s2 * r * 1.3, -r * 0.05);
        ctx.lineTo(s2 * r * 0.95, r * 0.25);
        ctx.lineTo(s2 * r * 0.45, r * 0.3);
        ctx.closePath();
        ctx.fillStyle = dark; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = P.outline; ctx.stroke();
      }
      // 冠羽: 黃色閃電
      ctx.beginPath();
      ctx.moveTo(-r * 0.05, -r * 0.6);
      ctx.lineTo(r * 0.15, -r * 1.05);
      ctx.lineTo(r * 0.02, -r * 0.92);
      ctx.lineTo(r * 0.2, -r * 1.25);
      ctx.lineTo(-r * 0.2, -r * 0.85);
      ctx.lineTo(-r * 0.05, -r * 0.92);
      ctx.lineTo(-r * 0.22, -r * 0.62);
      ctx.closePath();
      ctx.fillStyle = '#ffe14a'; ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.stroke();
      // 身體
      ctx.beginPath(); ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
      ctx.fillStyle = body; ctx.fill(); ctx.lineWidth = lw; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, r * 0.3, r * 0.38, r * 0.25, 0, 0, Math.PI * 2);
      ctx.fillStyle = light; ctx.fill();
      // 腳
      ctx.lineWidth = lw; ctx.strokeStyle = '#ffb02e';
      [-0.22, 0.22].forEach(function (fx) { ctx.beginPath(); ctx.moveTo(r * fx, r * 0.65); ctx.lineTo(r * fx, r * 0.88); ctx.stroke(); });
      // 嘴
      ctx.beginPath(); ctx.moveTo(-r * 0.12, -r * 0.08); ctx.lineTo(r * 0.12, -r * 0.08); ctx.lineTo(0, r * 0.14); ctx.closePath();
      ctx.fillStyle = '#ffb02e'; ctx.fill(); ctx.lineWidth = lw * 0.7; ctx.strokeStyle = P.outline; ctx.stroke();
      eyes(ctx, 0, -r * 0.28, r * 0.42, r * 0.15, mood);
    } else { // stone
      // 蝙蝠翼
      for (var s3 = -1; s3 <= 1; s3 += 2) {
        ctx.beginPath();
        ctx.moveTo(s3 * r * 0.55, -r * 0.35);
        ctx.quadraticCurveTo(s3 * r * 1.35, -r * 0.75, s3 * r * 1.2, r * 0.15);
        ctx.quadraticCurveTo(s3 * r * 1.0, -r * 0.05, s3 * r * 0.9, r * 0.25);
        ctx.quadraticCurveTo(s3 * r * 0.75, r * 0.05, s3 * r * 0.55, r * 0.3);
        ctx.closePath();
        ctx.fillStyle = dark; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = P.outline; ctx.stroke();
      }
      // 角(圓鈍)
      for (var s4 = -1; s4 <= 1; s4 += 2) {
        ctx.beginPath();
        ctx.moveTo(s4 * r * 0.35, -r * 0.6);
        ctx.quadraticCurveTo(s4 * r * 0.55, -r * 0.95, s4 * r * 0.62, -r * 0.92);
        ctx.quadraticCurveTo(s4 * r * 0.6, -r * 0.7, s4 * r * 0.55, -r * 0.55);
        ctx.closePath();
        ctx.fillStyle = light; ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.stroke();
      }
      // 方塊身體
      rr(ctx, -r * 0.62, -r * 0.65, r * 1.24, r * 1.5, r * 0.22);
      ctx.fillStyle = body; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = P.outline; ctx.stroke();
      // 石紋
      ctx.beginPath();
      ctx.moveTo(-r * 0.62, r * 0.25); ctx.lineTo(r * 0.62, r * 0.25);
      ctx.moveTo(-r * 0.1, r * 0.25); ctx.lineTo(-r * 0.1, r * 0.85);
      ctx.lineWidth = lw * 0.6; ctx.strokeStyle = dark; ctx.stroke();
      // 嘴
      ctx.beginPath(); ctx.moveTo(-r * 0.2, r * 0.05); ctx.lineTo(r * 0.2, r * 0.05);
      ctx.lineWidth = lw * 0.8; ctx.strokeStyle = P.outline; ctx.stroke();
      eyes(ctx, 0, -r * 0.25, r * 0.5, r * 0.16, mood);
    }

    if (mood === 'sleep') {
      txt(ctx, 'z', r * 0.85, -r * 0.85, Math.max(12, r * 0.4), '#dfe6ff', 'center', 3);
      txt(ctx, 'z', r * 1.1, -r * 1.2, Math.max(10, r * 0.3), '#dfe6ff', 'center', 3);
    }
    if (mood === 'angry') {
      // 頭頂怒氣符號(十字青筋), 紅
      var ax = -r * 0.75, ay = -r * 0.8, a = r * 0.16;
      ctx.lineWidth = Math.max(2.5, r * 0.08); ctx.strokeStyle = P.danger; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ax - a, ay - a * 0.3); ctx.quadraticCurveTo(ax - a * 0.3, ay - a * 0.3, ax - a * 0.3, ay - a);
      ctx.moveTo(ax + a, ay - a * 0.3); ctx.quadraticCurveTo(ax + a * 0.3, ay - a * 0.3, ax + a * 0.3, ay - a);
      ctx.moveTo(ax - a, ay + a * 0.3); ctx.quadraticCurveTo(ax - a * 0.3, ay + a * 0.3, ax - a * 0.3, ay + a);
      ctx.moveTo(ax + a, ay + a * 0.3); ctx.quadraticCurveTo(ax + a * 0.3, ay + a * 0.3, ax + a * 0.3, ay + a);
      ctx.stroke();
    }
  }

  // 3★ 稀有光暈(畫在本體後面)
  function rareAura(ctx, r, star) {
    if (star < 3) return;
    var g = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.45);
    g.addColorStop(0, 'rgba(255,240,160,0.45)');
    g.addColorStop(1, 'rgba(255,240,160,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r * 1.45, 0, Math.PI * 2); ctx.fill();
  }

  // ---------- 血條幾何(地下城魔物; 說明頁也用) ----------
  var MBAR = { x: -62, y: 56, w: 92, h: 12 };
  function monsterBar(ctx, hp, maxHp) {
    var ratio = maxHp > 0 ? clamp(hp / maxHp, 0, 1) : 0;
    rr(ctx, MBAR.x - 2, MBAR.y - 2, MBAR.w + 4, MBAR.h + 4, 5);
    ctx.fillStyle = P.outline; ctx.fill();
    rr(ctx, MBAR.x, MBAR.y, MBAR.w, MBAR.h, 4);
    ctx.fillStyle = '#3a2228'; ctx.fill();
    if (ratio > 0) { rr(ctx, MBAR.x, MBAR.y, Math.max(4, MBAR.w * ratio), MBAR.h, 4); ctx.fillStyle = P.hp; ctx.fill(); }
    txt(ctx, String(Math.max(0, Math.round(hp))), MBAR.x + MBAR.w + 18, MBAR.y + MBAR.h / 2, 18, P.text, 'center', 4);
  }

  // ---------- 匯出函式 ----------
  function drawBackground(ctx) {
    ctx.save();
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawDungeonRoom(ctx, state) {
    state = state || {};
    var depth = Math.max(1, num(state.depth, 1));
    var dark = clamp(0.09 * (depth - 1), 0, 0.62);
    ctx.save();
    // 牆
    var wallTop = 120, wallBot = 360, floorBot = 1040;
    ctx.fillStyle = P.wall; ctx.fillRect(0, wallTop, W, wallBot - wallTop);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3;
    for (var row = 0; row < 6; row++) {
      var y = wallTop + row * 40;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      for (var col = 0; col < 10; col++) {
        var x = col * 80 + (row % 2 ? 40 : 0);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 40); ctx.stroke();
      }
    }
    // 拱門(往下一層的入口, 純場景)
    ctx.beginPath();
    ctx.moveTo(300, wallBot); ctx.lineTo(300, 250); ctx.arc(360, 250, 60, Math.PI, 0); ctx.lineTo(420, wallBot); ctx.closePath();
    ctx.fillStyle = '#0e0b14'; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = '#2a2436'; ctx.stroke();
    // 地板
    var fg = ctx.createLinearGradient(0, wallBot, 0, floorBot);
    fg.addColorStop(0, '#3a3342'); fg.addColorStop(1, P.floor);
    ctx.fillStyle = fg; ctx.fillRect(0, wallBot, W, floorBot - wallBot);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
    for (var i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(360 + i * 40, wallBot); ctx.lineTo(360 + i * 150, floorBot); ctx.stroke(); }
    for (var j = 1; j < 7; j++) { var fy = wallBot + Math.pow(j / 7, 1.4) * (floorBot - wallBot); ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(W, fy); ctx.stroke(); }
    // 火把
    [[70, 220], [650, 220]].forEach(function (p) {
      ctx.fillStyle = '#5a3a22'; ctx.fillRect(p[0] - 6, p[1], 12, 46);
      var fl = 1 - dark * 0.6;
      var g = ctx.createRadialGradient(p[0], p[1] - 6, 2, p[0], p[1] - 6, 90);
      g.addColorStop(0, 'rgba(255,170,60,' + (0.45 * fl) + ')'); g.addColorStop(1, 'rgba(255,170,60,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1] - 6, 90, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(p[0] - 10, p[1]); ctx.quadraticCurveTo(p[0], p[1] - 40, p[0] + 10, p[1]); ctx.closePath();
      ctx.fillStyle = '#ffb347'; ctx.fill();
    });
    // 越深越暗(暗紫), 四角更暗
    ctx.fillStyle = 'rgba(10,4,24,' + dark + ')';
    ctx.fillRect(0, wallTop, W, floorBot - wallTop);
    var vg = ctx.createRadialGradient(360, 620, 200, 360, 620, 700);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,' + (0.35 + dark * 0.5) + ')');
    ctx.fillStyle = vg; ctx.fillRect(0, wallTop, W, floorBot - wallTop);
    // 底部操作區
    ctx.fillStyle = '#161a26'; ctx.fillRect(0, floorBot, W, H - floorBot);
    ctx.fillStyle = P.hudLine; ctx.fillRect(0, floorBot, W, 3);
    ctx.restore();
  }

  function drawZooGround(ctx) {
    ctx.save();
    ctx.fillStyle = P.grass; ctx.fillRect(0, 120, W, H - 120);
    // 草地點綴
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (var i = 0; i < 40; i++) { var gx = (i * 137) % W, gy = 130 + (i * 89) % 660; ctx.fillRect(gx, gy, 6, 2); }
    // 籠子區底板
    rr(ctx, 14, 146, W - 28, 648, 18); ctx.fillStyle = '#4a7a44'; ctx.fill();
    // 遊客步道 800~1000
    ctx.fillStyle = P.sand; ctx.fillRect(0, 800, W, 200);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (var k = 0; k < 18; k++) ctx.fillRect((k * 53) % W, 820 + (k * 37) % 160, 18, 4);
    // 柵欄(遊客區上緣)
    ctx.fillStyle = '#8a5a34';
    ctx.fillRect(0, 798, W, 8);
    for (var f = 10; f < W; f += 40) { rr(ctx, f, 784, 10, 24, 3); ctx.fill(); }
    // 候展區 1020~1140
    rr(ctx, 14, 1012, W - 28, 136, 16); ctx.fillStyle = '#5a3e2a'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#3a2618'; ctx.stroke();
    txt(ctx, '候展區', 30, 1026, 17, '#e9d6b8', 'left', 3);
    // 按鈕區
    ctx.fillStyle = '#161a26'; ctx.fillRect(0, 1152, W, H - 1152);
    ctx.fillStyle = P.hudLine; ctx.fillRect(0, 1152, W, 3);
    ctx.restore();
  }

  function drawPlayer(ctx, state) {
    state = state || {};
    var hp = num(state.hp, 1), maxHp = Math.max(1, num(state.maxHp, 1));
    var down = hp <= 0;
    var low = !down && hp / maxHp <= 0.3;
    var hit = !!state.hit;
    var sh = shakeOffset(hit, 5);
    ctx.save();
    ctx.translate(num(state.x, 360) + sh[0], num(state.y, 860) + sh[1]);
    var flash = hit ? 0.7 : 0;
    var skin = mix('#f2c9a0', '#ff6060', flash * 0.6);
    var armor = down ? '#7a808c' : mix(P.playerArmor, '#ff6060', flash * 0.6);
    var tunic = down ? '#6a5a48' : mix(P.player, '#ff6060', flash * 0.6);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = P.outline; ctx.lineWidth = 4;

    // 影子
    ctx.beginPath(); ctx.ellipse(0, 66, 52, 12, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();

    if (down) { ctx.translate(0, 8); ctx.rotate(-Math.PI / 2 * 0.95); ctx.scale(0.88, 0.88); }

    // 低血量: 身後紅色脈動外光
    if (low) {
      var a = 0.35 + 0.25 * Math.sin(now() * 8);
      var g = ctx.createRadialGradient(0, 0, 20, 0, 0, 78);
      g.addColorStop(0, rgba(P.danger, 0)); g.addColorStop(0.6, rgba(P.danger, a)); g.addColorStop(1, rgba(P.danger, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 78, 0, Math.PI * 2); ctx.fill();
    }
    // 網袋(背後左側)
    netIcon(ctx, -40, 6, 20, !down);
    // 腳
    ctx.fillStyle = '#4a3a2c';
    rr(ctx, -24, 34, 18, 30, 6); ctx.fill(); ctx.stroke();
    rr(ctx, 6, 34, 18, 30, 6); ctx.fill(); ctx.stroke();
    // 身體
    rr(ctx, -30, -12, 60, 54, 14); ctx.fillStyle = tunic; ctx.fill(); ctx.stroke();
    rr(ctx, -30, -12, 60, 20, 10); ctx.fillStyle = armor; ctx.fill(); ctx.stroke();
    // 劍(右手, 朝上)
    ctx.save();
    ctx.translate(38, 10); ctx.rotate(down ? 0.9 : -0.25);
    ctx.fillStyle = '#e8eef8'; rr(ctx, -5, -62, 10, 58, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8a040'; rr(ctx, -14, -6, 28, 8, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6a4a2a'; rr(ctx, -4, 2, 8, 16, 3); ctx.fill(); ctx.stroke();
    ctx.restore();
    // 頭
    ctx.beginPath(); ctx.arc(0, -36, 24, 0, Math.PI * 2); ctx.fillStyle = skin; ctx.fill(); ctx.stroke();
    // 頭盔
    ctx.beginPath(); ctx.arc(0, -40, 26, Math.PI, 0); ctx.closePath(); ctx.fillStyle = armor; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -66); ctx.lineTo(0, -76); ctx.lineWidth = 6; ctx.strokeStyle = P.danger; ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = P.outline;
    // 臉
    if (down) {
      eyes(ctx, 0, -30, 18, 6, 'ko');
    } else {
      ctx.fillStyle = P.outline;
      ctx.beginPath(); ctx.arc(-8, -30, 3.5, 0, Math.PI * 2); ctx.arc(8, -30, 3.5, 0, Math.PI * 2); ctx.fill();
      if (low) { // 汗滴
        ctx.beginPath(); ctx.moveTo(22, -50); ctx.quadraticCurveTo(30, -38, 22, -34); ctx.quadraticCurveTo(14, -38, 22, -50);
        ctx.fillStyle = '#8fd0ff'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawMonster(ctx, state) {
    state = state || {};
    var hp = num(state.hp, 1), maxHp = Math.max(1, num(state.maxHp, 1));
    var star = clamp(Math.round(num(state.star, 1)), 1, 3);
    var hit = !!state.hit;
    var sh = shakeOffset(hit, 6);
    var mood = hp <= 0 ? 'ko' : 'idle';
    ctx.save();
    ctx.translate(num(state.x, 0), num(state.y, 0));
    // 瞄準框(捕獲網模式)
    if (state.aimNet && hp > 0) {
      var pulse = 0.65 + 0.35 * Math.sin(now() * 6);
      ctx.save();
      ctx.setLineDash([10, 8]);
      ctx.lineWidth = 4; ctx.strokeStyle = rgba(P.select, pulse);
      ctx.beginPath(); ctx.arc(0, -4, 66, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 6; ctx.strokeStyle = P.select;
      for (var q = 0; q < 4; q++) {
        var ang = Math.PI / 4 + q * Math.PI / 2;
        ctx.beginPath(); ctx.arc(0, -4, 72, ang - 0.22, ang + 0.22); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.translate(sh[0], sh[1] - 4);
    rareAura(ctx, 46, star);
    creature(ctx, state.species, 44, mood, hit ? 1 : 0);
    ctx.restore();
    // 星級(頭上)
    stars(ctx, 0, -68, star, 9);
    // 血條(腳下)
    monsterBar(ctx, hp, maxHp);
    ctx.restore();
  }

  function drawNet(ctx, state) {
    state = state || {};
    var t = Math.max(0, num(state.t, 0));
    var res = state.result || 'flying';
    ctx.save();
    ctx.translate(num(state.x, 0), num(state.y, 0));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    function mesh(r, rot, alpha) {
      ctx.save();
      ctx.rotate(rot);
      ctx.globalAlpha *= alpha;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(P.net, 0.12); ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = P.outline; ctx.stroke();
      ctx.lineWidth = 3.5; ctx.strokeStyle = P.net; ctx.stroke();
      ctx.save(); ctx.clip();
      ctx.lineWidth = 2.5; ctx.strokeStyle = P.net;
      for (var i = -4; i <= 4; i++) {
        var o = i * r * 0.28;
        ctx.beginPath(); ctx.moveTo(o - r, -r); ctx.lineTo(o + r, r); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(o + r, -r); ctx.lineTo(o - r, r); ctx.stroke();
      }
      ctx.restore();
      // 墜子
      ctx.fillStyle = '#8a6a40';
      for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3; ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 5, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    if (res === 'flying') {
      var r = 30 + 42 * clamp(t / 0.35, 0, 1);
      mesh(r, t * 8, 1);
    } else if (res === 'success') {
      // 網收緊成一包 + 綁繩 + 勾
      var k2 = clamp(t / 0.25, 0, 1);
      var rr2 = 72 - 18 * k2;
      mesh(rr2, 0.3, 1);
      ctx.beginPath(); ctx.moveTo(-14, -rr2 + 4); ctx.lineTo(0, -rr2 - 12); ctx.lineTo(14, -rr2 + 4);
      ctx.lineWidth = 5; ctx.strokeStyle = '#8a6a40'; ctx.stroke();
      var ring = 54 + 20 * clamp(t / 0.5, 0, 1);
      ctx.beginPath(); ctx.arc(0, 0, ring, 0, Math.PI * 2);
      ctx.lineWidth = 5; ctx.strokeStyle = rgba(P.ok, 1 - clamp(t / 0.8, 0, 1)); ctx.stroke();
      checkMark(ctx, 46, -46, 22);
    } else { // fail: 網碎成四塊往外飛 + 叉
      var d = 10 + 50 * clamp(t / 0.5, 0, 1);
      var al = 1 - clamp((t - 0.3) / 0.5, 0, 1);
      for (var p = 0; p < 4; p++) {
        var ang = Math.PI / 4 + p * Math.PI / 2;
        ctx.save();
        ctx.translate(Math.cos(ang) * d, Math.sin(ang) * d);
        ctx.rotate(ang + t * 4);
        ctx.globalAlpha = al;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 26, -0.6, 0.6); ctx.closePath();
        ctx.lineWidth = 3; ctx.strokeStyle = P.net; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6, -8); ctx.lineTo(20, 8); ctx.moveTo(6, 8); ctx.lineTo(20, -8); ctx.stroke();
        ctx.restore();
      }
      crossMark(ctx, 46, -46, 22);
    }
    ctx.restore();
  }

  // 籠子幾何(相對中心)
  var CAGE = { w: 300, h: 280, barY: 108, barH: 18, barX: -128, barW: 256 };
  function rageBar(ctx, rage, tier, calmFlash) {
    var ratio = clamp(num(rage, 0) / 100, 0, 1);
    var col = tier === 'frenzy' ? P.rageFrenzy : (tier === 'show' ? P.rageShow : P.rageNone);
    rr(ctx, CAGE.barX - 3, CAGE.barY - 3, CAGE.barW + 6, CAGE.barH + 6, 7);
    ctx.fillStyle = P.outline; ctx.fill();
    rr(ctx, CAGE.barX, CAGE.barY, CAGE.barW, CAGE.barH, 5);
    ctx.fillStyle = '#262c3c'; ctx.fill();
    // 兩段門檻背景: 40~79 淡金、80~99 淡紅
    ctx.fillStyle = rgba(P.rageShow, 0.18); ctx.fillRect(CAGE.barX + CAGE.barW * 0.4, CAGE.barY, CAGE.barW * 0.4, CAGE.barH);
    ctx.fillStyle = rgba(P.rageFrenzy, 0.22); ctx.fillRect(CAGE.barX + CAGE.barW * 0.8, CAGE.barY, CAGE.barW * 0.2, CAGE.barH);
    if (ratio > 0) {
      var fw = Math.max(5, CAGE.barW * ratio);
      rr(ctx, CAGE.barX, CAGE.barY, fw, CAGE.barH, 5);
      ctx.fillStyle = col; ctx.fill();
      if (tier === 'frenzy') {
        var a = 0.4 + 0.4 * Math.sin(now() * 10);
        ctx.fillStyle = 'rgba(255,255,255,' + (a * 0.5) + ')'; ctx.fill();
      }
    }
    // 門檻刻度 40 / 80
    ctx.fillStyle = '#ffffff';
    [0.4, 0.8].forEach(function (k) { ctx.fillRect(CAGE.barX + CAGE.barW * k - 1.5, CAGE.barY - 6, 3, CAGE.barH + 12); });
    // 失控端(100)小骷髏改用紅色破裂記號: 紅色缺口
    ctx.beginPath();
    var ex = CAGE.barX + CAGE.barW + 12, ey = CAGE.barY + CAGE.barH / 2;
    ctx.moveTo(ex - 6, ey - 9); ctx.lineTo(ex + 2, ey - 2); ctx.lineTo(ex - 4, ey + 1); ctx.lineTo(ex + 6, ey + 9);
    ctx.lineWidth = 3; ctx.strokeStyle = P.danger; ctx.stroke();
    if (calmFlash > 0) {
      var ca = clamp(calmFlash / 0.3, 0, 1);
      ctx.save();
      ctx.globalAlpha = ca;
      rr(ctx, CAGE.barX - 5, CAGE.barY - 5, CAGE.barW + 10, CAGE.barH + 10, 8);
      ctx.lineWidth = 4; ctx.strokeStyle = P.calm; ctx.stroke();
      // 往左的箭頭(怒氣下降)
      var hx = CAGE.barX + CAGE.barW * ratio;
      ctx.beginPath(); ctx.moveTo(hx + 4, CAGE.barY - 16); ctx.lineTo(hx - 14, CAGE.barY - 16);
      ctx.moveTo(hx - 6, CAGE.barY - 23); ctx.lineTo(hx - 14, CAGE.barY - 16); ctx.lineTo(hx - 6, CAGE.barY - 9);
      ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
      ctx.restore();
    }
  }

  function drawCage(ctx, state) {
    state = state || {};
    var sp = state.species || null;
    var star = clamp(Math.round(num(state.star, 1)), 1, 3);
    var tier = state.tier || 'none';
    var broken = !!state.broken;
    var calm = num(state.calmFlash, 0);
    var hw = CAGE.w / 2, hh = CAGE.h / 2;
    ctx.save();
    ctx.translate(num(state.x, 0), num(state.y, 0));
    var frenzy = sp && !broken && tier === 'frenzy';
    var sh = frenzy ? shakeOffset(true, 2) : [0, 0];

    // 選中: 青色外光框(畫在籠子邊界內)
    // 底座
    rr(ctx, -hw, -hh, CAGE.w, CAGE.h, 16);
    ctx.fillStyle = '#2a2f3e'; ctx.fill();
    // 內部地面
    rr(ctx, -hw + 10, -hh + 34, CAGE.w - 20, CAGE.h - 44, 10);
    ctx.fillStyle = broken ? '#3a2a2a' : (sp ? '#5a4a3a' : '#3a3a40'); ctx.fill();
    ctx.fillStyle = 'rgba(255,230,180,0.08)';
    rr(ctx, -hw + 10, 30, CAGE.w - 20, 60, 10); ctx.fill();

    // 頂牌(星級)
    rr(ctx, -hw + 8, -hh + 6, CAGE.w - 16, 24, 8);
    ctx.fillStyle = '#1b2030'; ctx.fill();

    if (!sp) {
      // 空籠: 虛線輪廓 + 「空」
      ctx.save();
      ctx.setLineDash([10, 8]);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(220,225,240,0.35)';
      ctx.beginPath(); ctx.arc(0, -4, 56, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      txt(ctx, '空', 0, -4, 28, 'rgba(220,225,240,0.55)', 'center', 0);
    } else if (broken) {
      // 逃走後的空位: 虛線剪影
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.translate(0, -6);
      creature(ctx, sp, 52, 'idle', 0);
      ctx.restore();
      stars(ctx, 0, -hh + 18, star, 8, 'rgba(255,240,160,0.4)');
    } else {
      // 魔物本體
      var mood = tier === 'frenzy' ? 'angry' : (tier === 'show' ? 'idle' : 'sleep');
      ctx.save();
      ctx.translate(sh[0], -8 + sh[1]);
      if (tier === 'frenzy') {
        var a = 0.25 + 0.2 * Math.sin(now() * 9);
        var g = ctx.createRadialGradient(0, 0, 30, 0, 0, 110);
        g.addColorStop(0, rgba(P.danger, a)); g.addColorStop(1, rgba(P.danger, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 110, 0, Math.PI * 2); ctx.fill();
      }
      rareAura(ctx, 56, star);
      creature(ctx, sp, 52, mood, 0);
      ctx.restore();
      stars(ctx, 0, -hh + 18, star, 9);
    }

    // 欄杆
    ctx.lineCap = 'round';
    var barCol = broken ? '#6a6a72' : (frenzy ? mix('#8a93a8', P.danger, 0.55) : '#8a93a8');
    for (var i = 0; i < 9; i++) {
      var bx = -hw + 22 + i * ((CAGE.w - 44) / 8);
      ctx.beginPath();
      if (broken && (i === 3 || i === 4 || i === 5)) {
        // 彎掉、斷掉的欄杆(中間開了一個洞)
        var dir = i === 3 ? -1 : (i === 5 ? 1 : 0);
        ctx.moveTo(bx, -hh + 32);
        ctx.quadraticCurveTo(bx + dir * 40, -30, bx + dir * 30 + (i === 4 ? 20 : 0), 0);
        ctx.moveTo(bx + dir * 14, 62); ctx.lineTo(bx, 96);
      } else {
        ctx.moveTo(bx, -hh + 32); ctx.lineTo(bx, 96);
      }
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke();
      ctx.lineWidth = 3.5; ctx.strokeStyle = barCol; ctx.stroke();
    }
    // 上下橫桿
    ctx.fillStyle = barCol;
    ctx.fillRect(-hw + 14, -hh + 30, CAGE.w - 28, 6);
    ctx.fillRect(-hw + 14, 94, CAGE.w - 28, 6);

    // 外框
    rr(ctx, -hw + 2, -hh + 2, CAGE.w - 4, CAGE.h - 4, 15);
    ctx.lineWidth = 4; ctx.strokeStyle = frenzy ? P.danger : '#0b0e16'; ctx.stroke();

    if (broken) {
      // 裂痕 + 紅色警示角
      ctx.beginPath();
      ctx.moveTo(-hw + 30, -hh + 40); ctx.lineTo(-hw + 60, -hh + 80); ctx.lineTo(-hw + 50, -hh + 110);
      ctx.moveTo(hw - 40, 70); ctx.lineTo(hw - 70, 40); ctx.lineTo(hw - 60, 10);
      ctx.lineWidth = 3; ctx.strokeStyle = '#1a1010'; ctx.stroke();
      ctx.save();
      ctx.setLineDash([16, 10]);
      rr(ctx, -hw + 4, -hh + 4, CAGE.w - 8, CAGE.h - 8, 14);
      ctx.lineWidth = 5; ctx.strokeStyle = P.danger; ctx.stroke();
      ctx.restore();
    } else if (sp) {
      rageBar(ctx, state.rage, tier, calm);
    }

    // 安撫: 薄荷色波紋從中央擴散
    if (sp && !broken && calm > 0) {
      var k = 1 - clamp(calm / 0.3, 0, 1);
      ctx.save();
      ctx.globalAlpha = clamp(calm / 0.3, 0, 1);
      for (var w2 = 0; w2 < 2; w2++) {
        ctx.beginPath(); ctx.arc(0, -8, 40 + (k + w2 * 0.4) * 70, 0, Math.PI * 2);
        ctx.lineWidth = 5 - w2 * 2; ctx.strokeStyle = P.calm; ctx.stroke();
      }
      ctx.restore();
    }

    if (state.selected) {
      ctx.save();
      ctx.shadowColor = P.select; ctx.shadowBlur = 16;
      rr(ctx, -hw + 4, -hh + 4, CAGE.w - 8, CAGE.h - 8, 14);
      ctx.lineWidth = 7; ctx.strokeStyle = P.select; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawShowEffect(ctx, state) {
    state = state || {};
    var t = Math.max(0, num(state.t, 0));
    var D = 1.2;
    if (t > D) return;
    var p = t / D;
    var big = state.tier === 'frenzy';
    var star = clamp(Math.round(num(state.star, 1)), 1, 3);
    var sc = big ? 1.35 : 1;
    var n = (big ? 10 : 6) + star * 2;
    var alpha = 1 - clamp((p - 0.6) / 0.4, 0, 1);
    var sp = state.species;
    ctx.save();
    ctx.translate(num(state.x, 0), num(state.y, 0));
    ctx.beginPath(); ctx.rect(-150, -140, 300, 280); ctx.clip();
    ctx.globalAlpha = alpha;
    ctx.translate(0, -8);
    var i, a, d;
    if (sp === 'fire') {
      for (i = 0; i < n; i++) {
        a = -Math.PI / 2 + (i / (n - 1) - 0.5) * 1.8;
        d = (30 + 90 * p) * sc;
        var fx = Math.cos(a) * d, fy = Math.sin(a) * d;
        var fr = (16 - 8 * p) * sc;
        ctx.beginPath(); ctx.moveTo(fx - fr * 0.6, fy + fr * 0.6);
        ctx.quadraticCurveTo(fx, fy - fr * 1.8, fx + fr * 0.6, fy + fr * 0.6);
        ctx.quadraticCurveTo(fx, fy + fr * 1.1, fx - fr * 0.6, fy + fr * 0.6);
        ctx.fillStyle = i % 2 ? '#ffd34a' : P.fire; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
      }
    } else if (sp === 'water') {
      for (i = 0; i < n; i++) {
        a = -Math.PI / 2 + (i / (n - 1) - 0.5) * 2.4;
        var v = (110 + (i % 3) * 20) * sc;
        var bx = Math.cos(a) * v * p, by = Math.sin(a) * v * p + 160 * p * p;
        var br = (7 + (i % 3) * 3) * (big ? 1.2 : 1);
        ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fillStyle = rgba('#9fd0ff', 0.8); ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = P.water; ctx.stroke();
      }
      ctx.beginPath(); ctx.ellipse(0, 60, 60 * sc * (0.5 + p), 14 * sc, 0, 0, Math.PI * 2);
      ctx.lineWidth = 4; ctx.strokeStyle = rgba('#9fd0ff', 0.8); ctx.stroke();
    } else if (sp === 'thunder') {
      var bolts = Math.max(3, Math.round(n / 2));
      for (i = 0; i < bolts; i++) {
        a = i / bolts * Math.PI * 2 + 0.3;
        var r0 = 40 * sc, r1 = (70 + 60 * p) * sc;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
        var segs = 4;
        for (var s = 1; s <= segs; s++) {
          var rr3 = r0 + (r1 - r0) * s / segs;
          var off = (s % 2 ? 0.18 : -0.18);
          ctx.lineTo(Math.cos(a + off) * rr3, Math.sin(a + off) * rr3);
        }
        ctx.lineWidth = big ? 8 : 6; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.lineWidth = big ? 4.5 : 3.5; ctx.strokeStyle = '#ffe14a'; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, 50 * sc * (0.6 + p * 0.6), 0, Math.PI * 2);
      ctx.lineWidth = 3; ctx.strokeStyle = rgba(P.thunder, 0.8); ctx.stroke();
    } else { // stone: 震波 + 碎石
      for (var rg = 0; rg < (big ? 3 : 2); rg++) {
        var rp = clamp(p * 1.3 - rg * 0.2, 0, 1);
        if (rp <= 0) continue;
        ctx.beginPath(); ctx.ellipse(0, 60, (40 + 100 * rp) * sc, (12 + 26 * rp) * sc, 0, 0, Math.PI * 2);
        ctx.lineWidth = 6 - rg; ctx.strokeStyle = rgba('#d8d0c0', 1 - rp); ctx.stroke();
      }
      for (i = 0; i < n; i++) {
        a = -Math.PI / 2 + (i / (n - 1) - 0.5) * 2.6;
        var v2 = (100 + (i % 3) * 25) * sc;
        var rx = Math.cos(a) * v2 * p, ry = Math.sin(a) * v2 * p + 200 * p * p + 40;
        ctx.save(); ctx.translate(rx, ry); ctx.rotate(i + p * 6);
        rr(ctx, -8, -6, 16, 12, 3); ctx.fillStyle = '#8a8478'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.restore();
      }
    }
    // 高怒氣: 外圈紅色衝擊環(與一般表演的差別第二通道)
    if (big) {
      ctx.beginPath(); ctx.arc(0, 0, 70 + 70 * p, 0, Math.PI * 2);
      ctx.lineWidth = 6; ctx.strokeStyle = rgba(P.rageFrenzy, 1 - p); ctx.stroke();
    }
    // 金幣噴出(數量隨星級與怒氣段)
    var coins = (big ? 4 : 2) + star;
    for (i = 0; i < coins; i++) {
      a = -Math.PI / 2 + (i / Math.max(1, coins - 1) - 0.5) * 1.6;
      var cv = 130;
      var cx = Math.cos(a) * cv * p * 0.9, cy = Math.sin(a) * cv * p + 120 * p * p - 30;
      coin(ctx, cx, cy, 9);
    }
    ctx.restore();
  }

  function drawLooseMonster(ctx, state) {
    state = state || {};
    var star = clamp(Math.round(num(state.star, 1)), 1, 3);
    var hits = clamp(Math.round(num(state.hitsLeft, 3)), 0, 3);
    var hit = !!state.hit;
    var sh = shakeOffset(hit, 5);
    ctx.save();
    ctx.translate(num(state.x, 0), num(state.y, 0));
    // 危險底圈: 紅色
    ctx.beginPath(); ctx.arc(0, 0, 56, 0, Math.PI * 2);
    ctx.fillStyle = rgba(P.danger, 0.22); ctx.fill();
    // 剩餘抓回次數: 三段環, 亮 = 還要點, 暗 = 已點
    ctx.lineCap = 'butt';
    for (var i = 0; i < 3; i++) {
      var a0 = -Math.PI / 2 + i * (Math.PI * 2 / 3) + 0.14;
      var a1 = a0 + Math.PI * 2 / 3 - 0.28;
      ctx.beginPath(); ctx.arc(0, 0, 54, a0, a1);
      ctx.lineWidth = 10; ctx.strokeStyle = P.outline; ctx.stroke();
      ctx.lineWidth = 6; ctx.strokeStyle = i < hits ? P.danger : '#3a3f50'; ctx.stroke();
    }
    ctx.save();
    ctx.translate(sh[0], sh[1] - 6);
    creature(ctx, state.species, 32, 'angry', hit ? 1 : 0);
    ctx.restore();
    stars(ctx, 0, 36, star, 6);
    ctx.restore();
  }

  function drawVisitor(ctx, state) {
    state = state || {};
    var x = num(state.x, 0), y = num(state.y, 0);
    var scared = !!state.scared;
    var hue = ['#e07a5f', '#3d85c6', '#81b29a', '#f2cc8f', '#b07cc6', '#6fa8dc'][Math.abs(Math.round(x / 37)) % 6];
    ctx.save();
    ctx.translate(x, y);
    ctx.lineJoin = 'round'; ctx.strokeStyle = P.outline; ctx.lineWidth = 3;
    if (scared) {
      ctx.globalAlpha = 0.75;
      ctx.translate(0, -6); ctx.rotate(-0.2);
    }
    // 影子
    ctx.beginPath(); ctx.ellipse(0, 40, 20, 5, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
    // 腿
    ctx.fillStyle = '#3a3a48';
    rr(ctx, -12, 18, 9, 22, 3); ctx.fill(); ctx.stroke();
    rr(ctx, 3, 18, 9, 22, 3); ctx.fill(); ctx.stroke();
    // 身體
    rr(ctx, -16, -10, 32, 32, 10); ctx.fillStyle = scared ? mix(hue, '#ffffff', 0.5) : hue; ctx.fill(); ctx.stroke();
    // 手
    ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.strokeStyle = '#f2c9a0';
    ctx.beginPath();
    if (scared) { ctx.moveTo(-14, -4); ctx.lineTo(-24, -22); ctx.moveTo(14, -4); ctx.lineTo(24, -22); }
    else { ctx.moveTo(-14, -2); ctx.lineTo(-20, 14); ctx.moveTo(14, -2); ctx.lineTo(20, 14); }
    ctx.stroke();
    // 頭
    ctx.lineWidth = 3; ctx.strokeStyle = P.outline;
    ctx.beginPath(); ctx.arc(0, -24, 13, 0, Math.PI * 2); ctx.fillStyle = '#f2c9a0'; ctx.fill(); ctx.stroke();
    if (scared) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(-5, -26, 4, 0, Math.PI * 2); ctx.arc(5, -26, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, -17, 3, 4, 0, 0, Math.PI * 2); ctx.fillStyle = P.outline; ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(-5, -26, 2, 0, Math.PI * 2); ctx.arc(5, -26, 2, 0, Math.PI * 2); ctx.fillStyle = P.outline; ctx.fill();
      ctx.beginPath(); ctx.arc(0, -21, 4, 0.1 * Math.PI, 0.9 * Math.PI); ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
    if (scared) {
      ctx.save();
      txt(ctx, '!', x + 20, y - 36, 22, P.danger, 'center', 4);
      ctx.restore();
    }
  }

  function drawTrayMonster(ctx, state) {
    state = state || {};
    var sel = !!state.selected;
    var star = clamp(Math.round(num(state.star, 1)), 1, 3);
    ctx.save();
    ctx.translate(num(state.x, 0), num(state.y, 0));
    // 底盤
    ctx.beginPath(); ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.fillStyle = sel ? '#2a4a5a' : '#3a2a1e'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.save();
    ctx.translate(0, sel ? -10 : -4);
    rareAura(ctx, 27, star);
    creature(ctx, state.species, 28, 'idle', 0);
    ctx.restore();
    stars(ctx, 0, 34, star, 6);
    if (sel) {
      ctx.save();
      ctx.shadowColor = P.select; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(0, 0, 46, 0, Math.PI * 2);
      ctx.lineWidth = 6; ctx.strokeStyle = P.select; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function buttonIcon(ctx, label, x, y, col) {
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (label === '重擊') {
      ctx.beginPath();
      for (var i = 0; i < 16; i++) { var a = i * Math.PI / 8, r = i % 2 ? 7 : 15; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    } else if (label === '輕擊') {
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 12, -0.8, 0.8); ctx.lineWidth = 2.5; ctx.strokeStyle = col; ctx.stroke();
    } else if (label === '捕獲網') {
      netIcon(ctx, x, y, 14, true);
    } else if (label === '深入一層') {
      ctx.beginPath(); ctx.moveTo(x, y - 13); ctx.lineTo(x, y + 11); ctx.moveTo(x - 9, y + 2); ctx.lineTo(x, y + 12); ctx.lineTo(x + 9, y + 2);
      ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
    } else if (label === '撤退回園') {
      ctx.beginPath(); ctx.moveTo(x - 13, y); ctx.lineTo(x, y - 12); ctx.lineTo(x + 13, y); ctx.moveTo(x - 9, y - 2); ctx.lineTo(x - 9, y + 12); ctx.lineTo(x + 9, y + 12); ctx.lineTo(x + 9, y - 2);
      ctx.lineWidth = 3.5; ctx.strokeStyle = col; ctx.stroke();
    } else if (label === '出發' || label === '開園') {
      ctx.beginPath(); ctx.moveTo(x - 10, y - 12); ctx.lineTo(x + 12, y); ctx.lineTo(x - 10, y + 12); ctx.closePath();
      ctx.fillStyle = col; ctx.fill();
    } else { ctx.restore(); return false; }
    ctx.restore();
    return true;
  }

  function drawButton(ctx, state) {
    state = state || {};
    var x = num(state.x, 0), y = num(state.y, 0), w = num(state.w, 200), h = num(state.h, 80);
    var label = String(state.label == null ? '' : state.label);
    var en = state.enabled !== false;
    var act = !!state.active;
    ctx.save();
    var fill = act ? P.select : (en ? P.btn : P.btnOff);
    var tcol = act ? '#0b1a24' : (en ? P.text : '#5c6580');
    if (act) { ctx.shadowColor = P.select; ctx.shadowBlur = 18; }
    rr(ctx, x, y, w, h, 16);
    ctx.fillStyle = fill; ctx.fill();
    ctx.shadowBlur = 0;
    if (en) {
      rr(ctx, x, y, w, h, 16);
      ctx.lineWidth = 4; ctx.strokeStyle = act ? '#ffffff' : '#5a6890'; ctx.stroke();
      if (!act) { rr(ctx, x + 4, y + 4, w - 8, h * 0.4, 12); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill(); }
    } else {
      ctx.setLineDash([10, 8]);
      rr(ctx, x + 2, y + 2, w - 4, h - 4, 15);
      ctx.lineWidth = 3; ctx.strokeStyle = '#3e4660'; ctx.stroke();
      ctx.setLineDash([]);
    }
    var size = Math.min(30, Math.max(18, h * 0.36));
    ctx.font = 'bold ' + size + 'px "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif';
    var tw = ctx.measureText(label).width;
    var iconW = 34;
    var cx = x + w / 2, cy = y + h / 2;
    var startX = cx - (tw + iconW) / 2;
    var hasIcon = buttonIcon(ctx, label, startX + 14, cy, tcol);
    if (hasIcon) txt(ctx, label, startX + iconW + tw / 2, cy, size, tcol, 'center', 0);
    else txt(ctx, label, cx, cy, size, tcol, 'center', 0);
    ctx.restore();
  }

  var SHOP = {
    weapon: { name: '武器', desc: '攻擊 +3' },
    armor: { name: '護甲', desc: '血量上限 +15' },
    netBag: { name: '網袋', desc: '網數上限 +1' },
    goodNet: { name: '好網', desc: '捕獲率 +10%' }
  };
  function shopIcon(ctx, item, x, y) {
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = P.outline; ctx.lineWidth = 4;
    if (item === 'weapon') {
      ctx.translate(x, y); ctx.rotate(-0.7);
      ctx.fillStyle = '#e8eef8'; rr(ctx, -6, -40, 12, 50, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c8a040'; rr(ctx, -18, 8, 36, 9, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#6a4a2a'; rr(ctx, -5, 16, 10, 18, 3); ctx.fill(); ctx.stroke();
    } else if (item === 'armor') {
      ctx.beginPath(); ctx.moveTo(x, y - 34); ctx.lineTo(x + 30, y - 22); ctx.quadraticCurveTo(x + 30, y + 18, x, y + 34);
      ctx.quadraticCurveTo(x - 30, y + 18, x - 30, y - 22); ctx.closePath();
      ctx.fillStyle = P.playerArmor; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - 20); ctx.lineTo(x, y + 20); ctx.moveTo(x - 14, y - 4); ctx.lineTo(x + 14, y - 4);
      ctx.lineWidth = 5; ctx.strokeStyle = P.hp; ctx.stroke();
    } else if (item === 'netBag') {
      rr(ctx, x - 26, y - 18, 52, 46, 14); ctx.fillStyle = '#8a6a40'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 16, y - 18); ctx.quadraticCurveTo(x, y - 40, x + 16, y - 18); ctx.stroke();
      netIcon(ctx, x, y + 6, 14, true);
    } else {
      netIcon(ctx, x - 4, y + 2, 28, true);
      ctx.fillStyle = P.ok;
      ctx.beginPath(); ctx.arc(x + 24, y - 22, 13, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 24, y - 30); ctx.lineTo(x + 24, y - 14); ctx.moveTo(x + 16, y - 22); ctx.lineTo(x + 32, y - 22);
      ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    }
    ctx.restore();
  }

  function drawShopItem(ctx, state) {
    state = state || {};
    var x = num(state.x, 360), y = num(state.y, 0);
    var info = SHOP[state.item] || { name: String(state.item || '?'), desc: '' };
    var can = !!state.affordable;
    var lv = Math.max(0, Math.round(num(state.level, 0)));
    var cost = Math.round(num(state.cost, 0));
    ctx.save();
    ctx.translate(x, y);
    rr(ctx, -300, -70, 600, 140, 18);
    ctx.fillStyle = can ? '#2a3350' : '#1c2132'; ctx.fill();
    if (can) { ctx.lineWidth = 4; ctx.strokeStyle = P.gold; ctx.stroke(); }
    else { ctx.save(); ctx.setLineDash([12, 8]); rr(ctx, -298, -68, 596, 136, 17); ctx.lineWidth = 3; ctx.strokeStyle = '#3e4660'; ctx.stroke(); ctx.restore(); }
    // 圖示底
    ctx.beginPath(); ctx.arc(-220, 0, 50, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
    ctx.save(); if (!can) ctx.globalAlpha = 0.5; shopIcon(ctx, state.item, -220, 0); ctx.restore();
    txt(ctx, info.name, -150, -24, 32, can ? P.text : P.textDim, 'left', 4);
    txt(ctx, info.desc, -150, 22, 22, can ? '#cfd6e6' : '#7a8296', 'left', 3);
    // 已買次數
    if (lv > 0) txt(ctx, '已買 ' + lv, 40, -24, 18, P.textDim, 'left', 3);
    // 價格
    coin(ctx, 150, 0, 16);
    txt(ctx, String(cost), 176, 0, 34, can ? P.gold : P.danger, 'left', 5);
    ctx.restore();
  }

  function drawFloatText(ctx, state) {
    state = state || {};
    var t = Math.max(0, num(state.t, 0));
    var kind = state.kind || 'damage';
    var text = String(state.text == null ? '' : state.text);
    var D = 1.0;
    if (t > D + 0.2) return;
    var alpha = 1 - clamp((t - 0.6) / 0.5, 0, 1);
    var dy, col, size = 28;
    if (kind === 'gold') { col = P.gold; dy = -60 * Math.min(t, 1); size = 30; }
    else if (kind === 'repUp') { col = P.rep; dy = -60 * Math.min(t, 1); size = 30; }
    else if (kind === 'repDown') { col = P.danger; dy = 40 * Math.min(t, 1); size = 30; }
    else if (kind === 'rage') {
      var down = /^[-−]/.test(text);
      col = down ? P.calm : P.rageFrenzy; dy = (down ? 30 : -40) * Math.min(t, 1); size = 26;
    } else { col = P.danger; dy = -50 * Math.min(t, 1); size = 34; }
    var pop = t < 0.12 ? 1 + (0.12 - t) * 3 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(num(state.x, 0), num(state.y, 0) + dy);
    ctx.scale(pop, pop);
    if (kind === 'gold') {
      ctx.font = 'bold ' + size + 'px sans-serif';
      var tw = ctx.measureText(text).width;
      coin(ctx, -tw / 2 - 14, 0, 12);
      txt(ctx, text, 6, 0, size, col, 'center', 5);
    } else if (kind === 'repUp' || kind === 'repDown') {
      ctx.font = 'bold ' + size + 'px sans-serif';
      var tw2 = ctx.measureText(text).width;
      crown(ctx, -tw2 / 2 - 14, 0, 12);
      txt(ctx, text, 6, 0, size, col, 'center', 5);
    } else {
      txt(ctx, text, 0, 0, size, col, 'center', 5);
    }
    ctx.restore();
  }

  function drawResultPanel(ctx, state) {
    state = state || {};
    var n = clamp(Math.round(num(state.stars, 0)), 0, 3);
    ctx.save();
    ctx.fillStyle = 'rgba(8,10,18,0.82)'; ctx.fillRect(0, 0, W, H);
    rr(ctx, 60, 180, 600, 880, 28); ctx.fillStyle = P.panel; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = P.hudLine; ctx.stroke();
    txt(ctx, '三天結算', 360, 250, 44, P.text, 'center', 6);
    // 評價星數(大)
    for (var i = 0; i < 3; i++) {
      var sx = 220 + i * 140, sy = 380;
      starPath(ctx, sx, sy, 56);
      ctx.fillStyle = i < n ? P.gold : '#2e3448'; ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = i < n ? '#7a5a00' : '#454d66'; ctx.stroke();
    }
    var rows = [
      ['總名聲', String(Math.round(num(state.rep, 0))), P.rep, 'rep'],
      ['累計金幣', String(Math.round(num(state.goldEarned, 0))), P.gold, 'gold'],
      ['最深層數', '第 ' + Math.round(num(state.maxDepth, 0)) + ' 層', P.text, ''],
      ['最高星級', '', P.star, 'star']
    ];
    rows.forEach(function (r, k) {
      var ry = 520 + k * 96;
      rr(ctx, 100, ry - 38, 520, 76, 14); ctx.fillStyle = '#1b2131'; ctx.fill();
      txt(ctx, r[0], 130, ry, 28, P.textDim, 'left', 0);
      if (r[3] === 'rep') crown(ctx, 450, ry, 14);
      if (r[3] === 'gold') coin(ctx, 450, ry, 14);
      if (r[3] === 'star') {
        var bs = Math.round(num(state.bestStar, 0));
        if (bs > 0) stars(ctx, 520, ry, bs, 15); else txt(ctx, '—', 590, ry, 34, P.textDim, 'right', 0);
      } else {
        txt(ctx, r[1], 590, ry, 36, r[2], 'right', 5);
      }
    });
    txt(ctx, '門檻 60 / 120 / 200 名聲', 360, 930, 20, P.textDim, 'center', 0);
    txt(ctx, '點畫面重來', 360, 1000, 30, P.text, 'center', 5);
    ctx.restore();
  }

  function hpBarHud(ctx, x, y, w, h, hp, maxHp) {
    var ratio = maxHp > 0 ? clamp(hp / maxHp, 0, 1) : 0;
    rr(ctx, x - 3, y - 3, w + 6, h + 6, 9); ctx.fillStyle = P.outline; ctx.fill();
    rr(ctx, x, y, w, h, 7); ctx.fillStyle = '#3a2228'; ctx.fill();
    if (ratio > 0) {
      rr(ctx, x, y, Math.max(8, w * ratio), h, 7);
      ctx.fillStyle = ratio <= 0.3 ? P.danger : P.hp; ctx.fill();
    }
    txt(ctx, Math.max(0, Math.round(hp)) + ' / ' + Math.round(maxHp), x + w / 2, y + h / 2 + 1, 20, '#ffffff', 'center', 4);
  }

  function drawHud(ctx, state) {
    state = state || {};
    var ph = state.phase || 'dungeon';
    if (ph === 'guide' || ph === 'result') return;
    ctx.save();
    ctx.fillStyle = P.hudBg; ctx.fillRect(0, 0, W, 120);
    ctx.fillStyle = P.hudLine; ctx.fillRect(0, 117, W, 3);
    var day = Math.round(num(state.day, 1));
    var gold = Math.round(num(state.gold, 0));
    // 第一列: 天數(左)、金幣(右)
    var title = '第 ' + day + ' 天';
    if (ph === 'dungeon' || ph === 'roomClear') title += '  ·  第 ' + Math.round(num(state.depth, 1)) + ' 層';
    else if (ph === 'place') title += '  ·  擺放';
    else if (ph === 'show') title += '  ·  開園中';
    else if (ph === 'shop') title += '  ·  商店';
    txt(ctx, title, 24, 36, 28, P.text, 'left', 0);
    coin(ctx, 560, 36, 15);
    txt(ctx, String(gold), 584, 36, 30, P.gold, 'left', 0);

    if (ph === 'dungeon' || ph === 'roomClear') {
      hpBarHud(ctx, 24, 72, 260, 28, num(state.hp, 0), num(state.maxHp, 1));
      // 網數: 圖示, 實 = 剩, 暗 = 用掉
      var nets = Math.round(num(state.nets, 0)), nmax = Math.round(num(state.netMax, 0));
      var nx = 316;
      var gap = nmax > 6 ? Math.max(18, 160 / nmax) : 30;
      for (var i = 0; i < nmax; i++) netIcon(ctx, nx + i * gap, 86, 12, i < nets);
      // 戰利品
      var loot = Math.round(num(state.loot, 0));
      txt(ctx, '戰利品', 560, 86, 20, P.textDim, 'left', 0);
      txt(ctx, '×' + loot, 636, 86, 30, P.text, 'left', 0);
    } else {
      crown(ctx, 38, 88, 15);
      txt(ctx, '名聲', 62, 88, 20, P.textDim, 'left', 0);
      txt(ctx, String(Math.round(num(state.rep, 0))), 112, 88, 32, P.rep, 'left', 0);
      if (ph === 'show') {
        var tl = Math.max(0, Math.ceil(num(state.timeLeft, 0)));
        txt(ctx, '剩', 560, 88, 20, P.textDim, 'left', 0);
        txt(ctx, tl + ' 秒', 594, 88, 32, tl <= 10 ? P.danger : P.text, 'left', 0);
      }
    }

    // 提示訊息(HUD 正下方, 不壓遊戲物件)
    var msg = state.message;
    if (msg) {
      msg = String(msg);
      var bad = /倒下|跑了/.test(msg);
      ctx.font = 'bold 22px "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif';
      var mw = ctx.measureText(msg).width + 40;
      rr(ctx, 360 - mw / 2, 124, mw, 32, 12);
      ctx.fillStyle = bad ? 'rgba(90,20,24,0.92)' : 'rgba(20,24,38,0.9)'; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = bad ? P.danger : '#5a6890'; ctx.stroke();
      txt(ctx, msg, 360, 140, 22, P.text, 'center', 0);
    }
    ctx.restore();
  }

  // ---------- 說明頁示意圖 ----------
  function cursor(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, 34); ctx.lineTo(9, 26); ctx.lineTo(16, 40); ctx.lineTo(22, 37); ctx.lineTo(15, 23); ctx.lineTo(26, 22); ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.restore();
  }
  function tag(ctx, s, x, y, col) {
    ctx.save();
    ctx.font = 'bold 20px "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif';
    var w = ctx.measureText(s).width + 20;
    rr(ctx, x - w / 2, y - 15, w, 30, 10);
    ctx.fillStyle = 'rgba(11,14,22,0.85)'; ctx.fill();
    txt(ctx, s, x, y, 20, col || P.text, 'center', 0);
    ctx.restore();
  }
  // 血條上「剛掉的那段」(說明頁專用, 沿用地下城血條幾何)
  function lostChunk(ctx, mx, my, hpAfter, lost, maxHp) {
    var x0 = mx + MBAR.x + MBAR.w * clamp(hpAfter / maxHp, 0, 1);
    var w = MBAR.w * clamp(lost / maxHp, 0, 1);
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(x0, my + MBAR.y, w, MBAR.h);
    ctx.lineWidth = 2; ctx.strokeStyle = P.danger; ctx.strokeRect(x0, my + MBAR.y, w, MBAR.h);
    ctx.restore();
  }
  function arrow(ctx, x1, y1, x2, y2, col) {
    ctx.save();
    var a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.setLineDash([12, 8]); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.5) * 18, y2 - Math.sin(a - 0.5) * 18);
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a + 0.5) * 18, y2 - Math.sin(a + 0.5) * 18);
    ctx.stroke();
    ctx.restore();
  }

  var GW = 640, GH = 560;
  var GUIDE = [
    // 0 目標: 籠中魔物表演、遊客圍觀、名聲往上跳; 角落「第 1~3 天」
    function (ctx) {
      rr(ctx, 0, 0, GW, GH, 20); ctx.fillStyle = P.grass; ctx.fill();
      ctx.fillStyle = P.sand; ctx.fillRect(0, 400, GW, 120);
      drawCage(ctx, { x: 165, y: 220, species: 'water', star: 1, rage: 55, tier: 'show', calmFlash: 0, broken: false, selected: false });
      drawShowEffect(ctx, { x: 165, y: 220, species: 'water', star: 1, tier: 'show', t: 0.45 });
      drawCage(ctx, { x: 475, y: 220, species: 'fire', star: 2, rage: 70, tier: 'show', calmFlash: 0, broken: false, selected: false });
      drawShowEffect(ctx, { x: 475, y: 220, species: 'fire', star: 2, tier: 'show', t: 0.4 });
      for (var i = 0; i < 6; i++) drawVisitor(ctx, { x: 70 + i * 100, y: 455, scared: false });
      // 名聲讀數 + 往上跳
      rr(ctx, 400, 14, 220, 52, 14); ctx.fillStyle = P.hudBg; ctx.fill();
      crown(ctx, 426, 40, 13);
      txt(ctx, '名聲', 446, 40, 20, P.textDim, 'left', 0);
      txt(ctx, '42', 500, 40, 30, P.rep, 'left', 0);
      drawFloatText(ctx, { x: 580, y: 40, text: '+2', kind: 'repUp', t: 0.35 });
      drawFloatText(ctx, { x: 220, y: 90, text: '+4', kind: 'gold', t: 0.3 });
      drawFloatText(ctx, { x: 530, y: 90, text: '+12', kind: 'gold', t: 0.3 });
      rr(ctx, 16, 14, 150, 52, 14); ctx.fillStyle = P.hudBg; ctx.fill();
      txt(ctx, '第 1~3 天', 91, 40, 24, P.text, 'center', 0);
    },
    // 1 地下城戰鬥: 重擊掉一大截、輕擊掉一小格
    function (ctx) {
      drawDungeonMini(ctx);
      drawMonster(ctx, { x: 170, y: 200, species: 'fire', star: 1, hp: 4, maxHp: 10, hit: false, aimNet: false });
      lostChunk(ctx, 170, 200, 4, 6, 10);
      drawFloatText(ctx, { x: 200, y: 110, text: '-6', kind: 'damage', t: 0.2 });
      cursor(ctx, 185, 200);
      drawMonster(ctx, { x: 470, y: 200, species: 'fire', star: 1, hp: 8, maxHp: 10, hit: false, aimNet: false });
      lostChunk(ctx, 470, 200, 8, 2, 10);
      drawFloatText(ctx, { x: 500, y: 110, text: '-2', kind: 'damage', t: 0.2 });
      cursor(ctx, 485, 200);
      drawButton(ctx, { x: 70, y: 420, w: 200, h: 84, label: '重擊', enabled: true, active: true });
      drawButton(ctx, { x: 370, y: 420, w: 200, h: 84, label: '輕擊', enabled: true, active: true });
      arrow(ctx, 170, 410, 170, 300, 'rgba(255,255,255,0.7)');
      arrow(ctx, 470, 410, 470, 300, 'rgba(255,255,255,0.7)');
    },
    // 2 捕獲: 滿血 ✗、殘血 ✓、打倒 ✗; 捕獲網按鈕亮
    function (ctx) {
      drawDungeonMini(ctx);
      drawMonster(ctx, { x: 110, y: 200, species: 'water', star: 1, hp: 8, maxHp: 8, hit: false, aimNet: true });
      drawNet(ctx, { x: 110, y: 196, t: 0.25, result: 'fail' });
      drawMonster(ctx, { x: 320, y: 200, species: 'water', star: 1, hp: 1, maxHp: 8, hit: false, aimNet: true });
      drawNet(ctx, { x: 320, y: 196, t: 0.3, result: 'success' });
      drawMonster(ctx, { x: 530, y: 200, species: 'water', star: 1, hp: 0, maxHp: 8, hit: false, aimNet: false });
      crossMark(ctx, 576, 150, 22);
      tag(ctx, '滿血', 110, 320);
      tag(ctx, '殘血', 320, 320);
      tag(ctx, '打倒', 530, 320);
      drawButton(ctx, { x: 210, y: 430, w: 220, h: 84, label: '捕獲網', enabled: true, active: true });
    },
    // 3 深入或撤退
    function (ctx) {
      rr(ctx, 0, 0, 320, 420, 18); ctx.fillStyle = '#1a1424'; ctx.fill();
      rr(ctx, 330, 0, 310, 420, 18); ctx.fillStyle = P.grass; ctx.fill();
      drawMonster(ctx, { x: 200, y: 110, species: 'thunder', star: 3, hp: 30, maxHp: 30, hit: false, aimNet: false });
      drawPlayer(ctx, { x: 95, y: 300, hp: 0, maxHp: 40, hit: false });
      // 散掉的戰利品
      drawTrayMonster(ctx, { x: 215, y: 300, species: 'fire', star: 1, selected: false });
      crossMark(ctx, 250, 268, 16);
      drawTrayMonster(ctx, { x: 255, y: 375, species: 'stone', star: 2, selected: false });
      crossMark(ctx, 290, 343, 16);
      // 撤退那側: 戰利品帶回
      drawTrayMonster(ctx, { x: 420, y: 230, species: 'fire', star: 1, selected: false });
      drawTrayMonster(ctx, { x: 550, y: 230, species: 'stone', star: 2, selected: false });
      checkMark(ctx, 485, 320, 22);
      drawButton(ctx, { x: 40, y: 452, w: 250, h: 84, label: '深入一層', enabled: true, active: false });
      drawButton(ctx, { x: 360, y: 452, w: 250, h: 84, label: '撤退回園', enabled: true, active: false });
    },
    // 4 怒氣與表演
    function (ctx) {
      rr(ctx, 0, 0, GW, GH, 20); ctx.fillStyle = P.grass; ctx.fill();
      drawCage(ctx, { x: 165, y: 260, species: 'stone', star: 1, rage: 20, tier: 'none', calmFlash: 0, broken: false, selected: false });
      drawCage(ctx, { x: 475, y: 260, species: 'fire', star: 1, rage: 88, tier: 'frenzy', calmFlash: 0, broken: false, selected: false });
      drawShowEffect(ctx, { x: 475, y: 260, species: 'fire', star: 1, tier: 'frenzy', t: 0.4 });
      drawFloatText(ctx, { x: 475, y: 90, text: '+12', kind: 'gold', t: 0.25 });
      tag(ctx, '怒氣低', 165, 440);
      tag(ctx, '怒氣高', 475, 440);
    },
    // 5 安撫與失控
    function (ctx) {
      rr(ctx, 0, 0, GW, GH, 20); ctx.fillStyle = P.grass; ctx.fill();
      ctx.fillStyle = P.sand; ctx.fillRect(330, 400, 310, 160);
      drawCage(ctx, { x: 165, y: 240, species: 'water', star: 1, rage: 50, tier: 'show', calmFlash: 0.2, broken: false, selected: false });
      drawFloatText(ctx, { x: 165, y: 330, text: '-25', kind: 'rage', t: 0.2 });
      cursor(ctx, 190, 230);
      drawCage(ctx, { x: 475, y: 170, species: 'thunder', star: 2, rage: 100, tier: 'frenzy', calmFlash: 0, broken: true, selected: false });
      drawLooseMonster(ctx, { x: 420, y: 430, species: 'thunder', star: 2, hitsLeft: 3, hit: false });
      drawVisitor(ctx, { x: 580, y: 470, scared: true });
      arrow(ctx, 470, 300, 430, 365, P.danger);
      arrow(ctx, 485, 440, 540, 460, P.danger);
      crossMark(ctx, 600, 410, 18);
    }
  ];
  function drawDungeonMini(ctx) {
    rr(ctx, 0, 0, GW, GH, 20); ctx.fillStyle = P.floor; ctx.fill();
    ctx.fillStyle = P.wall; ctx.fillRect(0, 0, GW, 80);
    rr(ctx, 0, 400, GW, 160, 0); ctx.fillStyle = '#161a26'; ctx.fill();
  }

  function drawGuidePage(ctx, state) {
    state = state || {};
    var page = clamp(Math.round(num(state.page, 0)), 0, GUIDE.length - 1);
    var x = num(state.x, 0), y = num(state.y, 0), w = num(state.w, W), h = num(state.h, H);
    var s = Math.min(w / GW, h / GH);
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.translate(x + (w - GW * s) / 2, y + (h - GH * s) / 2);
    ctx.scale(s, s);
    ctx.save();
    rr(ctx, 0, 0, GW, GH, 20); ctx.clip();
    GUIDE[page](ctx);
    ctx.restore();
    rr(ctx, 0, 0, GW, GH, 20);
    ctx.lineWidth = 4; ctx.strokeStyle = P.hudLine; ctx.stroke();
    ctx.restore();
  }

  window.Art = {
    canvas: { width: W, height: H },
    palette: P,
    drawBackground: drawBackground,
    drawDungeonRoom: drawDungeonRoom,
    drawZooGround: drawZooGround,
    drawPlayer: drawPlayer,
    drawMonster: drawMonster,
    drawNet: drawNet,
    drawCage: drawCage,
    drawShowEffect: drawShowEffect,
    drawLooseMonster: drawLooseMonster,
    drawVisitor: drawVisitor,
    drawTrayMonster: drawTrayMonster,
    drawButton: drawButton,
    drawShopItem: drawShopItem,
    drawFloatText: drawFloatText,
    drawResultPanel: drawResultPanel,
    drawHud: drawHud,
    drawGuidePage: drawGuidePage
  };
})();
