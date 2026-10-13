// 口令牌馴獸秀 — 美術繪圖層(Canvas 2D 幾何, 無外部資源)
// 只負責「給我狀態, 我畫出來」; 函式簽章與 state 欄位見 style.md
(function () {
  'use strict';
  var ROOT = typeof window !== 'undefined' ? window : globalThis;
  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC","Heiti TC",sans-serif';
  var TAU = Math.PI * 2;
  var D2R = Math.PI / 180;

  // ---------- 色票 ----------
  var PAL = {
    bg: '#171a26', panel: '#252a3d', panelHi: '#323852', panelLine: '#4a5274', hudBg: '#10121b',
    text: '#f3f0e4', textDim: '#9aa2bd', outline: '#14131c',
    select: '#ffe14d',
    danger: '#ff3b47',
    ignite: '#ffa62e', igniteCore: '#ffe27a',
    douse: '#4aa8ff', douseCore: '#cfe9ff',
    other: '#c3b2ff',
    gold: '#ffd23f', rep: '#fff0a0', capture: '#6cf08a', levelUp: '#6fe7ff', repDown: '#b9a6ff',
    player: '#3d6fe0', playerLight: '#a9c6ff', skin: '#ffd9b0', hat: '#6b4a2b', rope: '#d6a65c',
    rageLow: '#7d86a6', rageMid: '#ffa62e', rageRed: '#ff3b47',
    mouse: '#e6b93a', snail: '#6cc24a', puffer: '#39c6d6', octo: '#9b6be0', pumpkin: '#ee7a22', sheep: '#f4a6d0',
    field: '#2a3040', fieldLine: '#3a4357', stands: '#211d2e', seat: '#2e2840', fence: '#b98a52', fenceDark: '#6e4f2c',
    weapon: '#e8ecf5', weaponSkill: '#fff3a0', locked: '#5a5f72'
  };

  var SPECIES = ['mouse', 'snail', 'puffer', 'octo', 'pumpkin', 'sheep'];
  var SP_NAME = { mouse: '發條鼠', snail: '油壺蝸牛', puffer: '河豚', octo: '章魚', pumpkin: '南瓜燈', sheep: '棉花糖羊' };
  var TAGS = ['calm', 'cheer', 'relay', 'rescue', 'hype', 'encore', 'taunt'];
  var TAG_NAME = { calm: '冷靜鈴', cheer: '打氣鈴', relay: '傳火令', rescue: '滅火令', hype: '炒熱令', encore: '安可令', taunt: '嘲諷令' };
  var TAG_DESC = {
    calm: '當自己標記到 3, 就冷靜下來', cheer: '當自己怒氣掉到 50 以下, 就打起精神',
    relay: '當自己被點燃, 就衝去撞最近的一隻', rescue: '當別隻標記到 3, 就趕過去對牠表演',
    hype: '當自己進紅區, 就讓全場都氣起來', encore: '當自己一招打中 2 隻以上, 就再演一次',
    taunt: '當自己開始表演, 就把附近的叫過來'
  };
  var TAG_COL = { calm: PAL.douse, cheer: PAL.ignite, relay: PAL.ignite, rescue: PAL.douse, hype: PAL.ignite, encore: PAL.other, taunt: PAL.other };
  var DUNGEONS = ['workshop', 'reef', 'grave'];
  var DG_NAME = { workshop: '發條工坊', reef: '珊瑚海窟', grave: '南瓜墓園' };
  var DG_SP = { workshop: ['mouse', 'snail'], reef: ['puffer', 'octo'], grave: ['pumpkin', 'sheep'] };
  var THEME = {
    workshop: { floor: '#4a4036', floor2: '#453b31', hall: '#3a322a', wall: '#231d18', wallTop: '#3a3029', line: '#5c5044', accent: '#c9a24a' },
    reef: { floor: '#24485a', floor2: '#214252', hall: '#1b3644', wall: '#11202d', wallTop: '#1f3a4a', line: '#336174', accent: '#4fd0d8' },
    grave: { floor: '#3a3346', floor2: '#362f41', hall: '#2c2636', wall: '#19151f', wallTop: '#2a2433', line: '#4c425a', accent: '#b48cff' }
  };
  var WEAPONS = ['club', 'sword', 'spear', 'whip'];
  var WP_NAME = { club: '棍棒', sword: '劍', spear: '長槍', whip: '長鞭' };
  var SHOP = {
    club: ['棍棒', 'Z 敲擊 X 無'], sword: ['劍', 'Z 斬擊可打回飛彈 X 擊暈'], spear: ['長槍', 'Z 長刺 X 突進'],
    whip: ['長鞭', 'Z 整圈抽打 X 擊飛'], attack: ['攻擊力 +1', '每次攻擊傷害 +1'], armor: ['護甲', '心 +1'],
    ropeBag: ['繩袋', '捕獸繩 +1'], rescue: ['滅火令', TAG_DESC.rescue], hype: ['炒熱令', TAG_DESC.hype],
    encore: ['安可令', TAG_DESC.encore], taunt: ['嘲諷令', TAG_DESC.taunt]
  };

  // ---------- 正規化 ----------
  function S(s) { return (s && typeof s === 'object') ? s : {}; }
  function num(v, d) { v = Number(v); return isFinite(v) ? v : (d === undefined ? 0 : d); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function ratio(t, d) { t = num(t, 0); d = num(d, 0); return d > 0 ? clamp(t / d, 0, 1) : 0; }
  function pick(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function str(v) { return (typeof v === 'string' || typeof v === 'number') ? String(v) : ''; }
  function spOf(v) { return pick(v, SPECIES, 'mouse'); }
  function tagOf(v) { return pick(v, TAGS, ''); }
  function dgOf(v) { return pick(v, DUNGEONS, 'workshop'); }
  function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }

  // ---------- 基本形 ----------
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); }
  function ell(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, TAU); }
  function fs(ctx, fill, stroke, lw) {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
  }
  function text(ctx, t, x, y, size, color, align, stroke, maxW, weight) {
    t = str(t);
    if (!t) return;
    ctx.font = (weight || 'bold') + ' ' + size + 'px ' + FONT;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    if (stroke) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(3, size / 4);
      ctx.strokeStyle = stroke;
      if (maxW) ctx.strokeText(t, x, y, maxW); else ctx.strokeText(t, x, y);
    }
    ctx.fillStyle = color;
    if (maxW) ctx.fillText(t, x, y, maxW); else ctx.fillText(t, x, y);
  }
  function arrow(ctx, x1, y1, x2, y2, color, lw, head) {
    head = head || 12;
    var a = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw || 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * head * 0.6, y2 - Math.sin(a) * head * 0.6); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.5) * head, y2 - Math.sin(a - 0.5) * head);
    ctx.lineTo(x2 - Math.cos(a + 0.5) * head, y2 - Math.sin(a + 0.5) * head);
    ctx.closePath(); ctx.fill();
  }
  function star(ctx, x, y, R, r, n) {
    n = n || 5;
    ctx.beginPath();
    for (var i = 0; i < n * 2; i++) {
      var rad = i % 2 ? r : R, a = -Math.PI / 2 + i * Math.PI / n;
      if (i === 0) ctx.moveTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
      else ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath();
  }
  function heart(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.7, y - s * 1.1, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.7, y - s * 1.1, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
    ctx.closePath();
  }
  function coin(ctx, x, y, r) {
    circle(ctx, x, y, r); fs(ctx, PAL.gold, '#8a6a10', 2);
    circle(ctx, x, y, r * 0.55); fs(ctx, null, '#b8901c', 1.5);
  }
  function repStar(ctx, x, y, r) { star(ctx, x, y, r, r * 0.45); fs(ctx, PAL.rep, '#8a7a30', 1.5); }
  function ropeIcon(ctx, x, y, r, on) {
    ctx.lineWidth = 3; ctx.strokeStyle = on ? PAL.rope : '#4a4450';
    circle(ctx, x, y, r); ctx.stroke();
    circle(ctx, x, y, r * 0.5); ctx.stroke();
  }
  function flame(ctx, x, y, w, h, col, core) {
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.bezierCurveTo(x + w * 0.9, y - h * 0.45, x + w * 0.7, y, x, y);
    ctx.bezierCurveTo(x - w * 0.7, y, x - w * 0.9, y - h * 0.45, x, y - h);
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    if (core) {
      ctx.beginPath();
      ctx.moveTo(x, y - h * 0.55);
      ctx.bezierCurveTo(x + w * 0.45, y - h * 0.25, x + w * 0.35, y, x, y);
      ctx.bezierCurveTo(x - w * 0.35, y, x - w * 0.45, y - h * 0.25, x, y - h * 0.55);
      ctx.closePath(); ctx.fillStyle = core; ctx.fill();
    }
  }
  function drop(ctx, x, y, w, h, col) {
    ctx.beginPath();
    ctx.moveTo(x, y - h / 2);
    ctx.bezierCurveTo(x + w * 0.2, y - h * 0.2, x + w / 2, y, x + w / 2, y + h * 0.15);
    ctx.arc(x, y + h * 0.15, w / 2, 0, Math.PI);
    ctx.bezierCurveTo(x - w / 2, y, x - w * 0.2, y - h * 0.2, x, y - h / 2);
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  }

  // ---------- 魔物本體(以 (0,0) 為中心, 基準半徑約 32; 棉花糖羊約 42) ----------
  function body(ctx, sp, o) {
    o = o || {};
    var W = !!o.white;
    var K = function (c) { return W ? '#ffffff' : c; };
    var OL = W ? '#ffffff' : PAL.outline;
    var dir = o.dir === -1 ? -1 : 1;
    ctx.save();
    ctx.scale(dir, 1);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (sp === 'mouse') {
      ctx.strokeStyle = K('#8a6a2a'); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-22, 10); ctx.quadraticCurveTo(-36, 4, -30, -6); ctx.stroke();
      ell(ctx, -9, 22, 5, 3); fs(ctx, K('#5a4520'));
      ell(ctx, 9, 22, 5, 3); fs(ctx, K('#5a4520'));
      ell(ctx, 0, 6, 24, 16); fs(ctx, K(PAL.mouse), OL, 2.5);
      ctx.strokeStyle = K('#b08a24'); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(-14, 18); ctx.moveTo(-4, -9); ctx.lineTo(-4, 21); ctx.stroke();
      circle(ctx, 12, -11, 6.5); fs(ctx, K(PAL.mouse), OL, 2);
      circle(ctx, 12, -11, 3); fs(ctx, K('#f4a6a6'));
      circle(ctx, 24, -10, 6); fs(ctx, K(PAL.mouse), OL, 2);
      circle(ctx, 18, 1, 11); fs(ctx, K(PAL.mouse), OL, 2.5);
      circle(ctx, 22, -2, 2.4); fs(ctx, K('#1a1410'));
      circle(ctx, 29, 3, 2.6); fs(ctx, K('#e07a8a'));
      ctx.save();
      ctx.translate(-6, -9);
      ctx.rotate(num(o.windA, 0));
      ctx.fillStyle = K('#9aa0ae'); ctx.fillRect(-1.5, -12, 3, 12);
      ctx.strokeStyle = K('#c9ccd6'); ctx.lineWidth = 3;
      circle(ctx, -5, -15, 4.5); ctx.stroke();
      circle(ctx, 5, -15, 4.5); ctx.stroke();
      ctx.restore();
    } else if (sp === 'snail') {
      rr(ctx, -28, 10, 56, 12, 6); fs(ctx, K('#d8cfa8'), OL, 2.5);
      ctx.strokeStyle = K('#d8cfa8'); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(22, 4); ctx.lineTo(19, -13); ctx.moveTo(27, 5); ctx.lineTo(31, -11); ctx.stroke();
      circle(ctx, 19, -14, 3); fs(ctx, K('#1a1410'));
      circle(ctx, 31, -12, 3); fs(ctx, K('#1a1410'));
      circle(ctx, 23, 9, 8); fs(ctx, K('#d8cfa8'), OL, 2);
      ctx.strokeStyle = K('#7d828c'); ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(9, -26); ctx.stroke();
      circle(ctx, 10, -27, 2.2); fs(ctx, K('#151515'));
      circle(ctx, -4, -1, 17); fs(ctx, K(PAL.snail), OL, 2.5);
      ctx.strokeStyle = K('#3f7e2a'); ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var i = 0; i <= 40; i++) {
        var a = i * 0.36, rad = 13 - i * 0.3;
        var px = -4 + Math.cos(a) * rad, py = -1 + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else if (sp === 'puffer') {
      var inf = clamp(num(o.inflate, 0), 0, 1);
      var R = 20 + 8 * inf, sl = 3 + 6 * inf;
      ctx.fillStyle = K('#1f8f9c');
      for (var k = 0; k < 14; k++) {
        var aa = k * TAU / 14;
        ctx.beginPath();
        ctx.moveTo(Math.cos(aa - 0.12) * R, Math.sin(aa - 0.12) * R);
        ctx.lineTo(Math.cos(aa) * (R + sl), Math.sin(aa) * (R + sl));
        ctx.lineTo(Math.cos(aa + 0.12) * R, Math.sin(aa + 0.12) * R);
        ctx.closePath(); ctx.fill();
      }
      ctx.beginPath(); ctx.moveTo(-R + 2, 0); ctx.lineTo(-R - 7, -7); ctx.lineTo(-R - 7, 7); ctx.closePath();
      fs(ctx, K('#1f8f9c'), OL, 2);
      circle(ctx, 0, 0, R); fs(ctx, K(PAL.puffer), OL, 2.5);
      ell(ctx, 2, R * 0.38, R * 0.72, R * 0.42); fs(ctx, K('#c8f4f6'));
      circle(ctx, R * 0.42, -R * 0.3, 4.5); fs(ctx, K('#ffffff'), OL, 1.5);
      circle(ctx, R * 0.48, -R * 0.3, 2.2); fs(ctx, K('#111111'));
      circle(ctx, R - 3, R * 0.12, 3); fs(ctx, K('#ff9fae'), OL, 1.5);
    } else if (sp === 'octo') {
      ctx.strokeStyle = K(PAL.octo); ctx.lineWidth = 6;
      for (var t = 0; t < 5; t++) {
        var x0 = -14 + t * 7;
        ctx.beginPath(); ctx.moveTo(x0, 2);
        ctx.quadraticCurveTo(x0 * 1.3 + 6, 14, x0 * 1.5, 26); ctx.stroke();
      }
      ctx.fillStyle = K('#e3d2ff');
      for (var t2 = 0; t2 < 5; t2++) { circle(ctx, (-14 + t2 * 7) * 1.4, 20, 1.6); ctx.fill(); }
      ell(ctx, 0, -8, 19, 17); fs(ctx, K(PAL.octo), OL, 2.5);
      ell(ctx, -5, -15, 6, 4); fs(ctx, K('#c5a6f4'));
      circle(ctx, -6, -6, 4.8); fs(ctx, K('#ffffff'), OL, 1.5);
      circle(ctx, 8, -6, 4.8); fs(ctx, K('#ffffff'), OL, 1.5);
      circle(ctx, -4.5, -6, 2.3); fs(ctx, K('#111111'));
      circle(ctx, 9.5, -6, 2.3); fs(ctx, K('#111111'));
    } else if (sp === 'pumpkin') {
      rr(ctx, -3, -22, 6, 9, 2); fs(ctx, K('#4f8a2b'), OL, 1.5);
      ell(ctx, -11, 4, 11, 17); fs(ctx, K('#d86812'), OL, 2.5);
      ell(ctx, 11, 4, 11, 17); fs(ctx, K('#d86812'), OL, 2.5);
      ell(ctx, 0, 4, 12, 18); fs(ctx, K(PAL.pumpkin), OL, 2.5);
      var glow = K('#ffe27a');
      ctx.beginPath(); ctx.moveTo(-11, -1); ctx.lineTo(-3, -1); ctx.lineTo(-7, -9); ctx.closePath(); fs(ctx, glow, OL, 1.5);
      ctx.beginPath(); ctx.moveTo(3, -1); ctx.lineTo(11, -1); ctx.lineTo(7, -9); ctx.closePath(); fs(ctx, glow, OL, 1.5);
      ctx.beginPath();
      ctx.moveTo(-12, 7); ctx.lineTo(-6, 10); ctx.lineTo(-3, 7); ctx.lineTo(0, 11); ctx.lineTo(3, 7); ctx.lineTo(6, 10); ctx.lineTo(12, 7);
      ctx.quadraticCurveTo(0, 20, -12, 7); ctx.closePath(); fs(ctx, glow, OL, 1.5);
    } else { // sheep
      ctx.fillStyle = K('#4a3a4a');
      ctx.fillRect(-20, 16, 6, 16); ctx.fillRect(-6, 18, 6, 15); ctx.fillRect(8, 16, 6, 16);
      ctx.fillStyle = K(PAL.sheep); ctx.strokeStyle = OL; ctx.lineWidth = 2.5;
      for (var f = 0; f < 10; f++) {
        var fa = f * TAU / 10;
        circle(ctx, -4 + Math.cos(fa) * 24, Math.sin(fa) * 16, 11); ctx.stroke();
      }
      for (var f2 = 0; f2 < 10; f2++) {
        var fb = f2 * TAU / 10;
        circle(ctx, -4 + Math.cos(fb) * 24, Math.sin(fb) * 16, 11); ctx.fill();
      }
      ell(ctx, -4, 0, 26, 17); ctx.fill();
      ell(ctx, -10, -6, 9, 5); fs(ctx, K('#ffd8ec'));
      ell(ctx, 27, -5, 9, 11); fs(ctx, K('#5a4a5a'), OL, 2);
      ell(ctx, 20, -12, 5, 3); fs(ctx, K('#5a4a5a'));
      circle(ctx, 26, -17, 6); fs(ctx, K(PAL.sheep));
      circle(ctx, 30, -6, 2); fs(ctx, K('#ffffff'));
    }
    ctx.restore();
  }

  // 暈眩星星(剩餘比例 = 軌道弧長)
  function stunStars(ctx, y, rx, frac) {
    var t = now() / 400;
    ctx.strokeStyle = 'rgba(255,240,120,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, y, rx, rx * 0.3, 0, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(frac, 0.05, 1)); ctx.stroke();
    for (var i = 0; i < 3; i++) {
      var a = t + i * TAU / 3;
      star(ctx, Math.cos(a) * rx, y + Math.sin(a) * rx * 0.3, 5, 2.2);
      fs(ctx, '#fff27a', '#6a5a10', 1);
    }
  }

  // 特殊移動的附加畫法; 回傳本體的 y 位移
  function moveFx(ctx, sp, move, p, dir, s, bottom) {
    var lift = 0;
    if (move === 'dash') {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (var i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(-dir * 26 * s, i * 9 * s); ctx.lineTo(-dir * 37 * s, i * 9 * s); ctx.stroke();
      }
    } else if (move === 'stick') {
      ell(ctx, 0, bottom - 2 * s, 30 * s, 5 * s); fs(ctx, 'rgba(70,90,40,0.75)');
      ctx.strokeStyle = 'rgba(110,140,60,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-18 * s, bottom - 4 * s); ctx.lineTo(-20 * s, bottom + 3 * s);
      ctx.moveTo(14 * s, bottom - 4 * s); ctx.lineTo(16 * s, bottom + 4 * s); ctx.stroke();
    } else if (move === 'hop' && sp === 'pumpkin') {
      lift = Math.sin(Math.PI * p) * 12 * s;
      ell(ctx, 0, bottom - 2 * s, 20 * s * (1 - 0.3 * lift / (12 * s + 0.001)), 4 * s); fs(ctx, 'rgba(0,0,0,0.35)');
    } else if (move === 'wind') {
      ctx.strokeStyle = 'rgba(230,230,240,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(-dir * 6 * s, -24 * s, 9 * s, -Math.PI * 0.9, -Math.PI * 0.1); ctx.stroke();
    }
    return lift;
  }

  // ---------- 口令牌圖示(中心 (0,0), 尺寸 size) ----------
  function tagIcon(ctx, tag, size, colOverride) {
    tag = tagOf(tag);
    if (!tag) return;
    var c = colOverride || TAG_COL[tag];
    var k = size / 24;
    ctx.save();
    ctx.scale(k, k);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (tag === 'calm' || tag === 'cheer') {
      circle(ctx, 0, -9, 2.2); fs(ctx, c);
      ctx.beginPath();
      ctx.moveTo(-7, 4); ctx.quadraticCurveTo(-7, -8, 0, -8); ctx.quadraticCurveTo(7, -8, 7, 4);
      ctx.lineTo(9.5, 6.5); ctx.lineTo(-9.5, 6.5); ctx.closePath(); fs(ctx, c);
      circle(ctx, 0, 9, 2.3); fs(ctx, c);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2;
      ctx.beginPath();
      if (tag === 'calm') { ctx.moveTo(-3.5, -3); ctx.lineTo(0, 1); ctx.lineTo(3.5, -3); }
      else { ctx.moveTo(-3.5, 0); ctx.lineTo(0, -4); ctx.lineTo(3.5, 0); }
      ctx.stroke();
    } else if (tag === 'relay' || tag === 'rescue') {
      if (tag === 'relay') flame(ctx, -3, 4, 13, 18, c, '#fff1c0');
      else drop(ctx, -3, -3, 13, 17, c);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-1, 8); ctx.lineTo(9, 8); ctx.moveTo(5, 4); ctx.lineTo(9.5, 8); ctx.lineTo(5, 12); ctx.stroke();
    } else if (tag === 'hype') {
      ctx.beginPath(); ctx.moveTo(-9, -3); ctx.lineTo(-3, -3); ctx.lineTo(6, -9); ctx.lineTo(6, 9); ctx.lineTo(-3, 3); ctx.lineTo(-9, 3); ctx.closePath(); fs(ctx, c);
      ctx.strokeStyle = c; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(9, -7); ctx.lineTo(11, -10); ctx.moveTo(10, 0); ctx.lineTo(12.5, 0); ctx.moveTo(9, 7); ctx.lineTo(11, 10); ctx.stroke();
      ctx.fillStyle = c; ctx.fillRect(-7, 3, 3, 6);
    } else if (tag === 'encore') {
      ctx.strokeStyle = c; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(0, 0, 8, -Math.PI * 0.35, Math.PI * 1.45); ctx.stroke();
      var ex = Math.cos(-Math.PI * 0.35) * 8, ey = Math.sin(-Math.PI * 0.35) * 8;
      ctx.beginPath(); ctx.moveTo(ex + 5, ey - 4); ctx.lineTo(ex - 1, ey - 3); ctx.lineTo(ex + 2, ey + 4); ctx.closePath(); fs(ctx, c);
      star(ctx, 0, 0, 3.5, 1.6, 4); fs(ctx, c);
    } else { // taunt
      circle(ctx, 0, 0, 3.2); fs(ctx, c);
      ctx.strokeStyle = c; ctx.lineWidth = 2.4;
      for (var i = 0; i < 4; i++) {
        ctx.save(); ctx.rotate(i * Math.PI / 2);
        ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(0, -6); ctx.moveTo(-3, -8.5); ctx.lineTo(0, -5.5); ctx.lineTo(3, -8.5); ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // ---------- 武器圖示(朝 +x, 從 (0,0) 往前約 len) ----------
  function weaponShape(ctx, w, len) {
    var k = len / 28;
    ctx.save(); ctx.scale(k, k); ctx.lineCap = 'round';
    if (w === 'sword') {
      ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(6, 0); ctx.stroke();
      ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(6, -5); ctx.lineTo(6, 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(7, -2.5); ctx.lineTo(25, -1.5); ctx.lineTo(28, 0); ctx.lineTo(25, 1.5); ctx.lineTo(7, 2.5); ctx.closePath();
      fs(ctx, '#dfe8f5', '#2a2f3a', 1.2);
    } else if (w === 'spear') {
      ctx.strokeStyle = '#8a6438'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(21, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(20, -4); ctx.lineTo(28, 0); ctx.lineTo(20, 4); ctx.closePath(); fs(ctx, '#dfe8f5', '#2a2f3a', 1.2);
    } else if (w === 'whip') {
      ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(7, 0); ctx.stroke();
      ctx.strokeStyle = PAL.rope; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(7, 0); ctx.bezierCurveTo(16, -10, 22, 10, 28, -2); ctx.stroke();
    } else { // club
      ctx.strokeStyle = '#8a5a2c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, 0); ctx.stroke();
      ell(ctx, 21, 0, 7, 5); fs(ctx, '#a8703a', '#3a2412', 1.5);
    }
    ctx.restore();
  }

  // ---------- 卡片框 ----------
  function cardBox(ctx, x, y, w, h, selected, bg, line) {
    rr(ctx, x, y, w, h, 12); fs(ctx, bg || PAL.panel, line || PAL.panelLine, 2);
    if (selected) {
      rr(ctx, x + 3, y + 3, w - 6, h - 6, 10);
      ctx.strokeStyle = PAL.select; ctx.lineWidth = 5; ctx.stroke();
    }
  }

  // ---------- 怒氣條 ----------
  function rageBar(ctx, x, y, w, h, st) {
    var rage = clamp(num(st.rage, 0), 0, 100), red = clamp(num(st.redLow, 80), 0, 100);
    rr(ctx, x - 1.5, y - 1.5, w + 3, h + 3, 3); fs(ctx, '#0b0c12');
    rr(ctx, x, y, w, h, 2); fs(ctx, '#262a38');
    var rx = x + w * red / 100;
    ctx.fillStyle = 'rgba(255,59,71,0.28)'; ctx.fillRect(rx, y, x + w - rx, h);
    var fc = rage >= red ? PAL.rageRed : (rage >= 50 ? PAL.rageMid : PAL.rageLow);
    var mode = st.mode;
    if (mode === 'charge' || mode === 'loose') {
      var flick = (Math.floor(now() / 120) % 2) ? 1 : 0.6;
      ctx.globalAlpha = flick; ctx.fillStyle = PAL.rageRed; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
      var lp = mode === 'loose' ? 1 - ratio(st.looseT, st.looseDur || 6) : 1 - ratio(st.chargeT, st.chargeDur || 1.5);
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(x, y + h - 3, w * lp, 3);
    } else {
      ctx.fillStyle = fc; ctx.fillRect(x, y, w * rage / 100, h);
    }
    ctx.fillStyle = PAL.rageRed; ctx.fillRect(rx, y - 2, x + w - rx, 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x + w * 0.5 - 1, y - 2, 2, h + 4);
    ctx.fillStyle = '#ffd0d0'; ctx.fillRect(rx - 1, y - 1, 2, h + 2);
  }

  // =====================================================================
  var Art = {
    canvas: { width: 1280, height: 720 },
    palette: PAL,

    drawBackground: function (ctx) {
      ctx.save();
      ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, 1280, 720);
      ctx.strokeStyle = 'rgba(255,255,255,0.025)'; ctx.lineWidth = 1;
      for (var x = 0; x <= 1280; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 720); ctx.stroke(); }
      for (var y = 0; y <= 720; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1280, y); ctx.stroke(); }
      ctx.restore();
    },

    drawTile: function (ctx, s) {
      s = S(s);
      var x = num(s.x), y = num(s.y), dg = dgOf(s.dungeon), th = THEME[dg];
      var kind = pick(s.kind, ['wall', 'pillar', 'floor', 'hurt', 'slow'], 'floor');
      var room = pick(s.room, ['left', 'right', 'hall'], 'hall');
      var L = x - 30, T = y - 30;
      ctx.save();
      if (kind === 'wall') {
        ctx.fillStyle = th.wall; ctx.fillRect(L, T, 60, 60);
        ctx.fillStyle = th.wallTop; ctx.fillRect(L, T, 60, 14);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(L + 0.5, T + 0.5, 59, 59);
        if (dg === 'workshop') { circle(ctx, L + 10, T + 30, 2.5); fs(ctx, '#5a4c3e'); circle(ctx, L + 50, T + 30, 2.5); fs(ctx, '#5a4c3e'); }
        else if (dg === 'reef') { circle(ctx, L + 20, T + 38, 6); fs(ctx, '#2a4458'); circle(ctx, L + 42, T + 46, 4); fs(ctx, '#2a4458'); }
        else { ctx.strokeStyle = '#2c2634'; ctx.beginPath(); ctx.moveTo(L, T + 37); ctx.lineTo(L + 60, T + 37); ctx.moveTo(L + 30, T + 14); ctx.lineTo(L + 30, T + 37); ctx.stroke(); }
        ctx.restore(); return;
      }
      var chk = (Math.floor(x / 60) + Math.floor(y / 60)) % 2;
      ctx.fillStyle = room === 'hall' ? th.hall : (chk ? th.floor : th.floor2);
      ctx.fillRect(L, T, 60, 60);
      ctx.strokeStyle = th.line; ctx.globalAlpha = 0.45; ctx.lineWidth = 1;
      ctx.strokeRect(L + 0.5, T + 0.5, 59, 59);
      ctx.globalAlpha = 1;
      if (kind === 'pillar') {
        ell(ctx, x + 3, y + 22, 24, 6); fs(ctx, 'rgba(0,0,0,0.35)');
        if (dg === 'workshop') {
          rr(ctx, L + 7, T + 7, 46, 46, 6); fs(ctx, '#6b6f7a', PAL.outline, 3);
          circle(ctx, x, y, 12); fs(ctx, '#9aa0ae', PAL.outline, 2);
          circle(ctx, x, y, 4); fs(ctx, '#3a3e48');
        } else if (dg === 'reef') {
          ctx.beginPath(); ctx.moveTo(L + 8, T + 52); ctx.lineTo(L + 6, T + 24); ctx.lineTo(L + 20, T + 8); ctx.lineTo(L + 42, T + 9); ctx.lineTo(L + 54, T + 28); ctx.lineTo(L + 52, T + 52); ctx.closePath();
          fs(ctx, '#55687a', PAL.outline, 3);
          ctx.fillStyle = '#6e8396'; ctx.fillRect(L + 18, T + 16, 14, 6);
        } else {
          ctx.beginPath(); ctx.moveTo(L + 12, T + 54); ctx.lineTo(L + 12, T + 22); ctx.arc(x, T + 22, 18, Math.PI, 0); ctx.lineTo(L + 48, T + 54); ctx.closePath();
          fs(ctx, '#8a8698', PAL.outline, 3);
          ctx.strokeStyle = '#5a566a'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(x, T + 18); ctx.lineTo(x, T + 40); ctx.moveTo(x - 8, T + 26); ctx.lineTo(x + 8, T + 26); ctx.stroke();
        }
      } else if (kind === 'slow') {
        if (dg === 'reef') {
          ell(ctx, x, y + 4, 25, 20); fs(ctx, 'rgba(30,90,60,0.55)');
          ctx.strokeStyle = '#3fae5a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
          for (var i = 0; i < 4; i++) {
            var bx = L + 14 + i * 10;
            ctx.beginPath(); ctx.moveTo(bx, T + 52); ctx.quadraticCurveTo(bx + 7, T + 32, bx - 2, T + 12); ctx.stroke();
          }
        } else if (dg === 'grave') {
          ell(ctx, x, y + 2, 27, 22); fs(ctx, '#4a3a28');
          circle(ctx, x - 9, y - 4, 4); fs(ctx, null, '#6a553c', 2);
          circle(ctx, x + 10, y + 8, 3); fs(ctx, null, '#6a553c', 2);
        } else {
          ell(ctx, x, y + 2, 27, 21); fs(ctx, '#121010');
          ell(ctx, x - 8, y - 6, 9, 4); fs(ctx, 'rgba(140,120,200,0.35)');
        }
        ctx.strokeStyle = 'rgba(220,230,255,0.45)'; ctx.lineWidth = 2;
        for (var w = 0; w < 2; w++) {
          ctx.beginPath();
          for (var j = 0; j <= 8; j++) { var px = L + 12 + j * 4.5, py = y + 12 + w * 8 + Math.sin(j * 1.4) * 2.5; if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
          ctx.stroke();
        }
      } else if (kind === 'hurt') {
        ctx.setLineDash([6, 4]); ctx.strokeStyle = PAL.danger; ctx.lineWidth = 3;
        ctx.strokeRect(L + 3, T + 3, 54, 54); ctx.setLineDash([]);
        if (dg === 'grave') {
          flame(ctx, x - 9, y + 16, 14, 28, 'rgba(110,255,210,0.85)', '#e8fff8');
          flame(ctx, x + 10, y + 18, 11, 22, 'rgba(110,255,210,0.85)', '#e8fff8');
        } else {
          ctx.fillStyle = dg === 'reef' ? '#2a1838' : '#3a3a3a';
          for (var u = 0; u < 3; u++) {
            var ux = x - 13 + u * 13, uy = y + (u === 1 ? -4 : 8);
            ctx.strokeStyle = '#ff6b75'; ctx.lineWidth = 2;
            for (var v = 0; v < 10; v++) { var va = v * TAU / 10; ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux + Math.cos(va) * 12, uy + Math.sin(va) * 12); ctx.stroke(); }
            circle(ctx, ux, uy, 6.5); fs(ctx, dg === 'reef' ? '#4a2458' : '#4a4a4a', PAL.outline, 1.5);
          }
        }
      } else if (s.nest) {
        var sp = DG_SP[dg][room === 'right' ? 1 : 0];
        ctx.setLineDash([5, 4]); circle(ctx, x, y, 23); ctx.strokeStyle = PAL[sp]; ctx.globalAlpha = 0.75; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = PAL[sp]; ctx.globalAlpha = 0.5;
        for (var n = 0; n < 4; n++) { circle(ctx, x - 9 + (n % 2) * 18, y - 7 + Math.floor(n / 2) * 14, 3.5); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    },

    drawTamer: function (ctx, s) {
      s = S(s);
      var x = num(s.x), y = num(s.y), f = Math.round(num(s.facing, 0)) & 7;
      var weapon = pick(s.weapon, WEAPONS, 'club');
      var ang = f * Math.PI / 4 - Math.PI / 2;
      ctx.save();
      ctx.translate(x, y);
      if (s.blink && !s.dashing) ctx.globalAlpha = (Math.floor(now() / 90) % 2) ? 0.3 : 0.85;
      ctx.rotate(ang);
      if (s.dashing) {
        for (var i = 2; i >= 1; i--) {
          circle(ctx, -i * 7, 0, 14 - i); fs(ctx, 'rgba(169,198,255,' + (0.45 - i * 0.15) + ')');
        }
      }
      ctx.save(); ctx.translate(2, 13); weaponShape(ctx, weapon, 24); ctx.restore();
      circle(ctx, 0, 0, 18); fs(ctx, PAL.player, s.dashing ? '#ffffff' : PAL.outline, s.dashing ? 3.5 : 2.5);
      circle(ctx, 0, 0, 15.5); fs(ctx, null, PAL.playerLight, 1.5);
      circle(ctx, -3, 0, 9.5); fs(ctx, PAL.hat, PAL.outline, 1.5);
      circle(ctx, 6, 0, 7.5); fs(ctx, PAL.skin, PAL.outline, 1.5);
      circle(ctx, 9, -3, 1.6); fs(ctx, '#1a1410');
      circle(ctx, 9, 3, 1.6); fs(ctx, '#1a1410');
      if (s.lassoing) {
        ctx.strokeStyle = PAL.rope; ctx.lineWidth = 2.5;
        circle(ctx, -2, -13, 4.5); ctx.stroke();
        circle(ctx, -2, -13, 2); ctx.stroke();
      }
      ctx.restore();
    },

    drawWildMonster: function (ctx, s) {
      s = S(s);
      var sp = spOf(s.species), x = num(s.x), y = num(s.y);
      var big = sp === 'sheep', half = big ? 55 : 40, sc = big ? 1.15 : 1;
      var dir = num(s.dir, 1) < 0 ? -1 : 1;
      var move = pick(s.move, ['walk', 'wind', 'dash', 'stick', 'hop'], 'walk');
      var mp = ratio(s.moveT, s.moveDur);
      var stunned = num(s.stunLeft, 0) > 0 || !!s.lassoed;
      ctx.save();
      ctx.translate(x, y);
      var bottom = (big ? 34 : 24) * sc;
      var lift = moveFx(ctx, sp, move, mp, dir, sc, bottom);
      if (s.casting && !stunned) {
        var pul = 0.5 + 0.5 * Math.sin(now() / 80);
        ctx.setLineDash([6, 5]); circle(ctx, 0, 0, half - 3);
        ctx.strokeStyle = PAL[sp]; ctx.globalAlpha = 0.5 + 0.5 * pul; ctx.lineWidth = 3; ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
      }
      ctx.save();
      ctx.translate(0, -lift);
      ctx.scale(sc, sc);
      body(ctx, sp, { dir: dir, white: !!s.hit, inflate: (sp === 'puffer' && s.casting && !stunned) ? 1 : 0, windA: move === 'wind' ? mp * TAU * 3 : 0 });
      if (s.lassoed) {
        ell(ctx, 0, 6, big ? 30 : 24, 6); ctx.strokeStyle = PAL.rope; ctx.lineWidth = 4; ctx.stroke();
      }
      ctx.restore();
      if (stunned) {
        var frac = s.lassoed ? 1 : ratio(s.stunLeft, s.stunDur || 2);
        stunStars(ctx, -half + 9, 16 * sc, frac);
      }
      if (s.weak) {
        drop(ctx, -half + 10, -half + 14, 7, 11, '#e8f4ff');
        drop(ctx, -half + 20, -half + 8, 5, 8, '#e8f4ff');
      }
      var hp = num(s.hp, 0), mx = Math.max(1, num(s.maxHp, 1));
      var bw = 46, bx = -bw / 2, by = half - 8;
      rr(ctx, bx - 1.5, by - 1.5, bw + 3, 8, 2); fs(ctx, '#0b0c12');
      ctx.fillStyle = '#3a3e4c'; ctx.fillRect(bx, by, bw, 5);
      var weakBlink = s.weak && (Math.floor(now() / 200) % 2);
      ctx.fillStyle = s.weak ? (weakBlink ? '#b6ffc4' : PAL.capture) : '#e8e3d0';
      ctx.fillRect(bx, by, bw * clamp(hp / mx, 0, 1), 5);
      ctx.fillStyle = PAL.capture; ctx.fillRect(bx + bw * 0.3 - 1, by - 2, 2, 9);
      ctx.restore();
    },

    drawCaptureRing: function (ctx, s) {
      s = S(s);
      var x = num(s.x), y = num(s.y), p = ratio(s.t, s.dur);
      ctx.save();
      ctx.translate(x, y);
      circle(ctx, 0, 0, 49); ctx.strokeStyle = 'rgba(10,12,20,0.75)'; ctx.lineWidth = 10; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 49, -Math.PI / 2, -Math.PI / 2 + TAU * p);
      ctx.strokeStyle = PAL.capture; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.stroke();
      circle(ctx, 0, 0, 53.5); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
      rr(ctx, -40, -40, 80, 22, 11); fs(ctx, 'rgba(10,12,20,0.8)');
      text(ctx, '準備捕捉', 0, -29, 15, PAL.capture);
      ctx.restore();
    },

    drawLasso: function (ctx, s) {
      s = S(s);
      var x1 = num(s.x1), y1 = num(s.y1), x2 = num(s.x2), y2 = num(s.y2);
      var tension = ratio(s.len, s.maxLen || 220);
      var prog = clamp(num(s.progress, 0), 0, 1);
      var left = 1 - ratio(s.t, s.limit || 5);
      ctx.save();
      // 進度環(魔物周圍)
      circle(ctx, x2, y2, 58); ctx.strokeStyle = 'rgba(10,12,20,0.7)'; ctx.lineWidth = 10; ctx.stroke();
      ctx.beginPath(); ctx.arc(x2, y2, 58, -Math.PI / 2, -Math.PI / 2 + TAU * prog);
      ctx.strokeStyle = PAL.capture; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.stroke();
      // 時限(外圈細線, 剩餘比例)
      ctx.beginPath(); ctx.arc(x2, y2, 66, -Math.PI / 2, -Math.PI / 2 + TAU * left);
      ctx.strokeStyle = left < 0.3 ? PAL.danger : 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3; ctx.lineCap = 'butt'; ctx.stroke();
      // 繩
      var dx = x2 - x1, dy = y2 - y1, d = Math.sqrt(dx * dx + dy * dy) || 1;
      var sag = (1 - tension) * 26;
      var mx = (x1 + x2) / 2 + (-dy / d) * 0, my = (y1 + y2) / 2 + sag;
      var col = tension > 0.9 ? ((Math.floor(now() / 100) % 2) ? PAL.danger : '#ffffff') : (tension > 0.7 ? PAL.ignite : PAL.rope);
      ctx.strokeStyle = PAL.outline; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke();
      ctx.restore();
    },

    drawHazard: function (ctx, s) {
      s = S(s);
      var kind = pick(s.kind, ['spark', 'coolant', 'puff', 'ink', 'pumpkin', 'cotton'], 'spark');
      var phase = pick(s.phase, ['warn', 'active', 'fly'], kind === 'spark' || kind === 'ink' ? 'fly' : 'warn');
      var x = num(s.x), y = num(s.y), R = Math.max(0, num(s.radius, 0)), ang = num(s.angle, 0), spr = num(s.spread, 0);
      var p = ratio(s.t, s.dur);
      var SRC = { spark: 'mouse', coolant: 'snail', puff: 'puffer', ink: 'octo', pumpkin: 'pumpkin', cotton: 'sheep' };
      var col = PAL[SRC[kind]];
      ctx.save();
      ctx.translate(x, y);
      if (kind === 'spark' || kind === 'ink') {
        if (!R) R = kind === 'spark' ? 12 : 14;
        var refl = !!s.reflected;
        ctx.rotate(ang);
        var c1 = refl ? PAL.playerLight : (kind === 'spark' ? '#ffe27a' : '#3a2058');
        var c2 = refl ? PAL.player : col;
        ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.moveTo(-R * 3, 0); ctx.lineTo(-R * 0.3, -R * 0.75); ctx.lineTo(-R * 0.3, R * 0.75); ctx.closePath(); ctx.fillStyle = c2; ctx.fill();
        ctx.globalAlpha = 1;
        if (kind === 'spark') { star(ctx, 0, 0, R, R * 0.5, 6); fs(ctx, c2, PAL.outline, 2); circle(ctx, 0, 0, R * 0.42); fs(ctx, refl ? '#ffffff' : c1); }
        else { circle(ctx, 0, 0, R); fs(ctx, c2, PAL.outline, 2); circle(ctx, R * 0.25, -R * 0.25, R * 0.45); fs(ctx, refl ? '#ffffff' : c1); }
        if (refl) {
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
          circle(ctx, 0, 0, R - 1.25); ctx.stroke();
        }
        ctx.restore(); return;
      }
      var shape = function () {
        if (kind === 'coolant') { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, ang - spr / 2, ang + spr / 2); ctx.closePath(); }
        else circle(ctx, 0, 0, R);
      };
      var shapeR = function (r) {
        if (kind === 'coolant') { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, ang - spr / 2, ang + spr / 2); ctx.closePath(); }
        else circle(ctx, 0, 0, r);
      };
      if (phase === 'warn') {
        shape(); ctx.globalAlpha = 0.14; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1;
        shapeR(R * p); ctx.globalAlpha = 0.35; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1;
        ctx.save(); shape(); ctx.clip();
        shape(); ctx.setLineDash([10, 7]); ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.stroke(); ctx.setLineDash([]);
        ctx.restore();
        if (kind === 'pumpkin') {
          ctx.strokeStyle = col; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.moveTo(0, -14); ctx.lineTo(0, 14); ctx.stroke();
          ctx.save();
          var fall = (1 - p) * 90, k = 0.5 + 0.3 * p;
          ell(ctx, 0, 0, 14 * k * 1.4, 5 * k); fs(ctx, 'rgba(0,0,0,0.35)');
          ctx.translate(0, -fall - 6); ctx.scale(k, k);
          body(ctx, 'pumpkin', {});
          ctx.restore();
        }
      } else {
        var a = 1 - p * 0.6;
        ctx.save(); shape(); ctx.clip();
        shape(); ctx.globalAlpha = 0.62 * a; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = a;
        if (kind === 'coolant') {
          ctx.fillStyle = '#e4ffd0';
          for (var i = 0; i < 9; i++) {
            var da = ang - spr / 2 + spr * ((i * 0.37) % 1), dr = R * (0.3 + ((i * 0.53 + p) % 0.7));
            drop(ctx, Math.cos(da) * dr, Math.sin(da) * dr, 7, 11, '#e4ffd0');
          }
        } else if (kind === 'puff') {
          ctx.fillStyle = '#d8fbff';
          for (var j = 0; j < 20; j++) {
            var ja = j * TAU / 20;
            ctx.beginPath(); ctx.moveTo(Math.cos(ja - 0.07) * (R - 18), Math.sin(ja - 0.07) * (R - 18));
            ctx.lineTo(Math.cos(ja) * R, Math.sin(ja) * R);
            ctx.lineTo(Math.cos(ja + 0.07) * (R - 18), Math.sin(ja + 0.07) * (R - 18)); ctx.closePath(); ctx.fill();
          }
        } else if (kind === 'cotton') {
          ctx.fillStyle = 'rgba(255,240,250,0.8)';
          for (var c = 0; c < 14; c++) { var ca = c * TAU / 14; circle(ctx, Math.cos(ca) * (R - 16), Math.sin(ca) * (R - 16), 16); ctx.fill(); }
        } else if (kind === 'pumpkin') {
          circle(ctx, 0, 0, R * (0.4 + 0.6 * p)); ctx.fillStyle = 'rgba(255,240,170,0.9)'; ctx.fill();
          ctx.strokeStyle = '#fff6c8'; ctx.lineWidth = 4;
          for (var r2 = 0; r2 < 10; r2++) { var ra = r2 * TAU / 10; ctx.beginPath(); ctx.moveTo(Math.cos(ra) * R * 0.3, Math.sin(ra) * R * 0.3); ctx.lineTo(Math.cos(ra) * R * 0.95, Math.sin(ra) * R * 0.95); ctx.stroke(); }
        }
        shape(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    },

    drawTentacle: function (ctx, s) {
      s = S(s);
      var x1 = num(s.x1), y1 = num(s.y1), x2 = num(s.x2), y2 = num(s.y2), p = ratio(s.t, s.dur);
      var dx = x2 - x1, dy = y2 - y1, d = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / d, ny = dx / d;
      var wob = Math.sin(p * Math.PI * 3) * 14 * (1 - p);
      var cx = (x1 + x2) / 2 + nx * wob, cy = (y1 + y2) / 2 + ny * wob;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = PAL.outline; ctx.lineWidth = 13;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2); ctx.stroke();
      ctx.strokeStyle = PAL.octo; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2); ctx.stroke();
      ctx.fillStyle = '#e3d2ff';
      for (var i = 1; i < 6; i++) {
        var t = i / 6, u = 1 - t;
        var px = u * u * x1 + 2 * u * t * cx + t * t * x2, py = u * u * y1 + 2 * u * t * cy + t * t * y2;
        circle(ctx, px, py, 2.2); ctx.fill();
      }
      circle(ctx, x2, y2, 9); ctx.strokeStyle = PAL.octo; ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
    },

    drawWeaponFx: function (ctx, s) {
      s = S(s);
      var x = num(s.x), y = num(s.y), w = pick(s.weapon, WEAPONS, 'club');
      var skill = s.move === 'skill';
      var shape = pick(s.shape, ['arc', 'circle', 'line', 'dash'], 'arc');
      var ang = num(s.angle, 0), spr = num(s.spread, 0), R = Math.max(0, num(s.radius, 0));
      var len = Math.max(0, num(s.length, 0)), wd = Math.max(0, num(s.width, 0));
      var p = ratio(s.t, s.dur), a = 1 - p;
      var edge = skill ? PAL.weaponSkill : '#ffffff';
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = a;
      if (shape === 'arc') {
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, ang - spr / 2, ang + spr / 2); ctx.closePath();
        ctx.fillStyle = skill ? 'rgba(255,243,160,0.22)' : 'rgba(255,255,255,0.14)'; ctx.fill();
        var sw = Math.min(1, p * 2.5);
        ctx.beginPath(); ctx.arc(0, 0, Math.max(0, R - 3), ang - spr / 2, ang - spr / 2 + spr * sw);
        ctx.strokeStyle = edge; ctx.lineWidth = skill ? 6 : 4; ctx.lineCap = 'round'; ctx.stroke();
        if (skill && w === 'sword') {
          for (var i = 0; i < 3; i++) { var sa = ang - spr / 3 + i * spr / 3; star(ctx, Math.cos(sa) * R * 0.65, Math.sin(sa) * R * 0.65, 7, 3); fs(ctx, PAL.weaponSkill); }
        }
      } else if (shape === 'circle') {
        circle(ctx, 0, 0, R); ctx.fillStyle = 'rgba(255,220,150,0.12)'; ctx.fill();
        circle(ctx, 0, 0, Math.max(0, R - 2)); ctx.strokeStyle = edge; ctx.lineWidth = 4; ctx.stroke();
        ctx.setLineDash([14, 10]); ctx.lineDashOffset = -p * 60;
        circle(ctx, 0, 0, Math.max(0, R - 9)); ctx.strokeStyle = PAL.rope; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
      } else if (shape === 'line') {
        ctx.rotate(ang);
        ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(0, -wd / 2, len, wd);
        ctx.strokeStyle = edge; ctx.lineWidth = 3; ctx.strokeRect(0, -wd / 2 + 1.5, len - 1.5, Math.max(0, wd - 3));
        ctx.beginPath(); ctx.moveTo(len * 0.2, 0); ctx.lineTo(len - 2, 0); ctx.lineWidth = 4; ctx.stroke();
      } else {
        ctx.rotate(ang);
        ctx.fillStyle = 'rgba(169,198,255,0.3)'; ctx.fillRect(0, -18, len, 36);
        ctx.strokeStyle = edge; ctx.lineWidth = 3;
        for (var k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(len * 0.1, k * 11); ctx.lineTo(len, k * 11); ctx.stroke(); }
      }
      ctx.restore();
    },

    drawDungeonCard: function (ctx, s) {
      s = S(s);
      var x = num(s.x), y = num(s.y), dg = dgOf(s.dungeon), open = !!s.open, th = THEME[dg];
      var L = x - 180, T = y - 220;
      ctx.save();
      cardBox(ctx, L, T, 360, 440, false, open ? PAL.panel : '#1e2130', open ? th.accent : PAL.locked);
      rr(ctx, L + 12, T + 12, 336, 70, 8); fs(ctx, open ? th.wallTop : '#2a2d3a');
      text(ctx, DG_NAME[dg], x, T + 47, 32, open ? PAL.text : PAL.textDim, 'center', PAL.outline);
      var sps = DG_SP[dg];
      ctx.globalAlpha = open ? 1 : 0.45;
      for (var i = 0; i < 2; i++) {
        var px = x - 82 + i * 164, py = T + 180;
        circle(ctx, px, py, 60); fs(ctx, open ? th.floor : '#2a2d3a', open ? th.line : PAL.locked, 2);
        ctx.save(); ctx.translate(px, py); var k = sps[i] === 'sheep' ? 1.15 : 1.45; ctx.scale(k, k); body(ctx, sps[i], { dir: i ? -1 : 1 }); ctx.restore();
        text(ctx, SP_NAME[sps[i]], px, py + 82, 19, PAL.text, 'center');
      }
      ctx.globalAlpha = 1;
      if (open) {
        rr(ctx, x - 80, T + 330, 160, 46, 23); fs(ctx, 'rgba(108,240,138,0.18)', PAL.capture, 2);
        text(ctx, '已開放', x, T + 353, 22, PAL.capture);
      } else {
        // 鎖頭
        ctx.save(); ctx.translate(L + 318, T + 47);
        ctx.strokeStyle = PAL.textDim; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -6, 8, Math.PI, 0); ctx.stroke();
        rr(ctx, -12, -6, 24, 20, 4); fs(ctx, PAL.textDim);
        ctx.restore();
        rr(ctx, L + 20, T + 318, 320, 70, 10); fs(ctx, '#151722', PAL.locked, 2);
        text(ctx, '未開放', x, T + 337, 16, PAL.textDim);
        text(ctx, str(s.condition), x, T + 366, 18, PAL.text, 'center', null, 300);
      }
      if (s.selected) cardBox.call(null, ctx, L, T, 360, 440, true, 'rgba(0,0,0,0)', 'rgba(0,0,0,0)');
      ctx.restore();
    },

    drawRosterCard: function (ctx, s) {
      s = S(s);
      var x = num(s.x), y = num(s.y), sp = spOf(s.species), lv = clamp(Math.round(num(s.level, 0)), 0, 3), on = !!s.picked;
      var L = x - 90, T = y - 120;
      ctx.save();
      cardBox(ctx, L, T, 180, 240, false, on ? PAL.panelHi : PAL.panel, on ? PAL.capture : PAL.panelLine);
      ctx.globalAlpha = on ? 1 : 0.6;
      circle(ctx, x, T + 84, 50); fs(ctx, '#1c2030');
      ctx.save(); ctx.translate(x, T + 84); var k = sp === 'sheep' ? 1.05 : 1.3; ctx.scale(k, k); body(ctx, sp, {}); ctx.restore();
      ctx.globalAlpha = 1;
      text(ctx, SP_NAME[sp], x, T + 158, 20, PAL.text, 'center', null, 164);
      text(ctx, 'Lv ' + lv, x, T + 184, 16, PAL.textDim);
      if (on) {
        rr(ctx, x - 40, T + 200, 80, 28, 14); fs(ctx, PAL.capture);
        text(ctx, '上場', x, T + 214, 16, '#10301a');
      } else {
        rr(ctx, x - 40, T + 200, 80, 28, 14); fs(ctx, null, PAL.panelLine, 2);
        text(ctx, '休息', x, T + 214, 15, PAL.textDim);
      }
      if (s.selected) cardBox(ctx, L, T, 180, 240, true, 'rgba(0,0,0,0)', 'rgba(0,0,0,0)');
      ctx.restore();
    },

    drawSetupRow: function (ctx, s) {
      s = S(s);
      var x = num(s.x), y = num(s.y), sp = spOf(s.species), lv = clamp(Math.round(num(s.level, 0)), 0, 3);
      var L = x - 360, T = y - 55;
      ctx.save();
      rr(ctx, L, T, 720, 110, 12); fs(ctx, s.selected ? PAL.panelHi : PAL.panel, s.selected ? PAL.select : PAL.panelLine, s.selected ? 3 : 2);
      if (s.selected) { rr(ctx, L, T, 10, 110, 5); fs(ctx, PAL.select); }
      circle(ctx, L + 60, y, 42); fs(ctx, '#1c2030');
      ctx.save(); ctx.translate(L + 60, y); var k = sp === 'sheep' ? 0.85 : 1.05; ctx.scale(k, k); body(ctx, sp, {}); ctx.restore();
      text(ctx, SP_NAME[sp], L + 116, y - 12, 22, PAL.text, 'left', null, 150);
      text(ctx, 'Lv ' + lv, L + 116, y + 18, 16, PAL.textDim, 'left');
      ctx.restore();
    },

    drawTagSlot: function (ctx, s) {
      s = S(s);
      var x = num(s.x), y = num(s.y), tag = tagOf(s.tag);
      var L = x - 100, T = y - 40;
      ctx.save();
      if (tag) {
        rr(ctx, L, T, 200, 80, 10); fs(ctx, '#1c2030', TAG_COL[tag], 3);
        circle(ctx, L + 38, y, 24); fs(ctx, '#11131c', TAG_COL[tag], 2);
        ctx.save(); ctx.translate(L + 38, y); tagIcon(ctx, tag, 34); ctx.restore();
        text(ctx, TAG_NAME[tag], L + 74, y, 22, PAL.text, 'left', null, 118);
      } else {
        rr(ctx, L + 2, T + 2, 196, 76, 10); ctx.setLineDash([8, 6]); fs(ctx, 'rgba(0,0,0,0.2)', PAL.panelLine, 2.5); ctx.setLineDash([]);
        text(ctx, '空牌位', x, y, 19, PAL.textDim);
      }
      if (s.selected) { rr(ctx, L + 2.5, T + 2.5, 195, 75, 9); ctx.strokeStyle = PAL.select; ctx.lineWidth = 5; ctx.stroke(); }
      ctx.restore();
    },

    drawPickerPanel: function (ctx, s) {
      s = S(s);
      var opts = Array.isArray(s.options) ? s.options : [];
      var n = Math.min(8, opts.length), idx = Math.round(num(s.index, 0));
      var L = 820, T = 60, W = 420;
      ctx.save();
      rr(ctx, L - 4, T - 4, W + 8, 50 + 60 * n + 8, 12); fs(ctx, 'rgba(0,0,0,0.5)');
      rr(ctx, L, T, W, 50 + 60 * n, 10); fs(ctx, PAL.panel, PAL.panelLine, 2);
      rr(ctx, L, T, W, 50, 10); fs(ctx, PAL.panelHi);
      text(ctx, '掛哪塊牌?', L + 20, T + 25, 22, PAL.text, 'left');
      for (var i = 0; i < n; i++) {
        var o = S(opts[i]), rt = T + 50 + 60 * i, cy = rt + 30;
        var usable = o.usable !== false;
        var isRemove = o.type === 'remove';
        ctx.globalAlpha = usable ? 1 : 0.38;
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(L + 10, rt); ctx.lineTo(L + W - 10, rt); ctx.stroke();
        if (isRemove) {
          circle(ctx, L + 34, cy, 18); fs(ctx, '#11131c', PAL.textDim, 2);
          ctx.strokeStyle = PAL.textDim; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(L + 27, cy - 7); ctx.lineTo(L + 41, cy + 7); ctx.moveTo(L + 41, cy - 7); ctx.lineTo(L + 27, cy + 7); ctx.stroke();
          text(ctx, str(o.name) || '拿下', L + 64, cy, 20, PAL.text, 'left');
        } else {
          var tg = tagOf(o.key);
          circle(ctx, L + 34, cy, 18); fs(ctx, '#11131c', usable ? (TAG_COL[tg] || PAL.textDim) : PAL.locked, 2);
          ctx.save(); ctx.translate(L + 34, cy); tagIcon(ctx, tg, 26, usable ? null : PAL.textDim); ctx.restore();
          text(ctx, str(o.name) || TAG_NAME[tg] || '', L + 64, cy - 11, 19, PAL.text, 'left', null, 200);
          text(ctx, str(o.desc), L + 64, cy + 13, 13, PAL.textDim, 'left', null, 280, 'normal');
          text(ctx, '剩 ' + Math.max(0, Math.round(num(o.left, 0))), L + W - 18, cy - 11, 16, usable ? PAL.text : PAL.textDim, 'right');
        }
        ctx.globalAlpha = 1;
        if (i === idx) { rr(ctx, L + 4, rt + 3, W - 8, 54, 8); ctx.strokeStyle = PAL.select; ctx.lineWidth = 4; ctx.stroke(); }
      }
      ctx.restore();
    },

    drawTagBadge: function (ctx, s) {
      s = S(s);
      var x = num(s.x), y = num(s.y), tag = tagOf(s.tag);
      if (!tag) return;
      var cd = ratio(s.cdLeft, s.cdDur), ready = cd <= 0;
      var fl = num(s.flashT, 0), fd = num(s.flashDur, 0.3), flashing = fl > 0 && fl < fd;
      ctx.save();
      ctx.translate(x, y);
      rr(ctx, -14, -14, 28, 28, 6); fs(ctx, '#0d0f16');
      if (ready) {
        rr(ctx, -12.5, -12.5, 25, 25, 5); fs(ctx, '#20253a', TAG_COL[tag], 2.5);
        tagIcon(ctx, tag, 20);
      } else {
        rr(ctx, -12.5, -12.5, 25, 25, 5); ctx.save(); ctx.clip();
        ctx.globalAlpha = 0.4; ctx.fillStyle = TAG_COL[tag]; ctx.fillRect(-13, -13, 26, 26); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 20, -Math.PI / 2, -Math.PI / 2 + TAU * cd); ctx.closePath(); ctx.fillStyle = 'rgba(8,9,14,0.85)'; ctx.fill();
        ctx.restore();
        rr(ctx, -12.5, -12.5, 25, 25, 5); ctx.setLineDash([3, 3]); fs(ctx, null, '#5a6078', 1.5); ctx.setLineDash([]);
        tagIcon(ctx, tag, 18, '#d8dceb');
      }
      if (flashing) {
        var fa = 1 - fl / fd;
        ctx.globalAlpha = fa;
        rr(ctx, -12, -12, 24, 24, 5); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
        rr(ctx, -13, -13, 26, 26, 6); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.globalAlpha = 1;
        tagIcon(ctx, tag, 20);
      }
      ctx.restore();
    },

    drawTagFx: function (ctx, s) {
      s = S(s);
      var tag = tagOf(s.tag), dur = num(s.dur, 0.8) > 0 ? num(s.dur, 0.8) : 0.8, t = num(s.t, 0);
      if (!tag || t < 0 || t >= dur) return;
      var p = t / dur, x = num(s.x), y = num(s.y);
      var pop = p < 0.15 ? 0.7 + 2 * p : 1;
      var a = p > 0.7 ? (1 - p) / 0.3 : 1;
      ctx.save();
      ctx.translate(x, y - 74 - p * 14);
      ctx.scale(pop, pop);
      ctx.globalAlpha = a;
      ctx.font = 'bold 22px ' + FONT;
      var label = TAG_NAME[tag] + '!';
      var w = ctx.measureText ? (ctx.measureText(label).width || 80) : 80;
      if (!isFinite(w)) w = 80;
      var tw = w + 30;
      ctx.save(); ctx.translate(-tw / 2 + 11, 0); tagIcon(ctx, tag, 20); ctx.restore();
      text(ctx, label, -tw / 2 + 26, 0, 22, TAG_COL[tag], 'left', PAL.outline);
      ctx.restore();
    },

    drawShowArena: function (ctx) {
      ctx.save();
      ctx.fillStyle = PAL.field; ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = PAL.stands; ctx.fillRect(0, 50, 1280, 92); ctx.fillRect(0, 574, 1280, 92);
      ctx.fillStyle = PAL.seat;
      for (var i = 0; i < 8; i++) {
        var sx = 165 + 136 * i;
        rr(ctx, sx - 28, 108, 56, 14, 4); ctx.fill();
        rr(ctx, sx - 28, 634, 56, 14, 4); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 2;
      for (var r = 0; r < 3; r++) {
        ctx.beginPath(); ctx.moveTo(0, 64 + r * 24); ctx.lineTo(1280, 64 + r * 24); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 594 + r * 24); ctx.lineTo(1280, 594 + r * 24); ctx.stroke();
      }
      rr(ctx, 60, 146, 1160, 420, 18); fs(ctx, '#323a4c', PAL.fieldLine, 3);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 3;
      circle(ctx, 640, 356, 110); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(640, 150); ctx.lineTo(640, 562); ctx.stroke();
      ctx.restore();
    },

    drawShowMonster: function (ctx, s) {
      s = S(s);
      var sp = spOf(s.species), x = num(s.x), y = num(s.y);
      var big = sp === 'sheep', half = big ? 60 : 48, sc = big ? 1.1 : 1, by = big ? 10 : 8;
      var dir = num(s.dir, 1) < 0 ? -1 : 1;
      var mode = pick(s.mode, ['roam', 'relay', 'taunted', 'pulled', 'charge', 'loose'], 'roam');
      var wild = mode === 'charge' || mode === 'loose';
      var move = pick(s.move, ['walk', 'wind', 'dash', 'stick', 'hop'], 'walk');
      var mp = ratio(s.moveT, s.moveDur);
      var perf = !!s.performing && !wild, pp = ratio(s.performT, s.performDur || 0.5);
      var fx = pick(s.fx, ['none', 'ignited', 'doused'], 'none'), fp = ratio(s.fxT, s.fxDur || 0.5);
      if (fx !== 'none' && num(s.fxT, 0) >= num(s.fxDur, 0.5)) fx = 'none';
      var lv = clamp(Math.round(num(s.level, 0)), 0, 3);
      ctx.save();
      ctx.translate(x, y);
      var bottom = by + (big ? 34 : 24) * sc;
      if (perf) {
        ell(ctx, 0, half - 9, half - 8, 7); fs(ctx, 'rgba(255,226,122,0.4)', 'rgba(255,226,122,0.8)', 2);
      }
      if (wild) {
        var jt = now() / 60;
        ctx.beginPath();
        for (var i = 0; i < 18; i++) {
          var a = i * TAU / 18, rad = (i % 2 ? half - 14 : half - 4) + Math.sin(jt + i) * 1.5;
          var px = Math.cos(a) * rad, py = by + Math.sin(a) * rad * 0.78;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fillStyle = 'rgba(255,59,71,0.22)'; ctx.fill(); ctx.strokeStyle = PAL.danger; ctx.lineWidth = 3; ctx.stroke();
      }
      if (mode === 'taunted') {
        ctx.setLineDash([6, 5]); ctx.lineDashOffset = -now() / 40;
        circle(ctx, 0, by, half - 10); ctx.strokeStyle = PAL.other; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
      }
      if (mode === 'relay') {
        for (var f = 0; f < 3; f++) {
          ctx.save(); ctx.translate(-dir * (24 + f * 7), by + (f - 1) * 10); ctx.rotate(-dir * Math.PI / 2);
          flame(ctx, 0, 6, 10, 16 - f * 3, PAL.ignite, PAL.igniteCore); ctx.restore();
        }
      }
      var lift = moveFx(ctx, sp, wild ? 'walk' : move, mp, dir, sc, bottom);
      ctx.save();
      var shake = (mode === 'charge' && num(s.chargeT, 0) > 0) ? Math.sin(now() / 25) * 3 : 0;
      ctx.translate(shake, by - lift);
      var bump = perf ? 1 + 0.12 * Math.sin(Math.PI * pp) : 1;
      var squash = mode === 'pulled' ? 0.88 : 1;
      ctx.scale(sc * bump / squash, sc * bump * squash);
      body(ctx, sp, { dir: dir, inflate: (sp === 'puffer' && perf) ? 1 : 0, windA: move === 'wind' ? mp * TAU * 3 : 0 });
      ctx.restore();
      if (wild) {
        ctx.save(); ctx.translate(dir * 22, by - 18);
        ctx.strokeStyle = PAL.danger; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (var v = 0; v < 4; v++) { ctx.save(); ctx.rotate(v * Math.PI / 2); ctx.beginPath(); ctx.moveTo(2, -7); ctx.quadraticCurveTo(2, -2, 7, -2); ctx.stroke(); ctx.restore(); }
        ctx.restore();
      }
      if (perf) {
        for (var q = 0; q < 4; q++) {
          var qa = q * Math.PI / 2 + Math.PI / 4 + pp;
          star(ctx, Math.cos(qa) * (half - 12), by + Math.sin(qa) * (half - 18), 6, 2, 4); fs(ctx, '#fff3a0');
        }
      }
      if (fx === 'ignited') {
        ctx.globalAlpha = 1 - fp;
        circle(ctx, 0, by, 33 * sc); ctx.strokeStyle = PAL.ignite; ctx.lineWidth = 4; ctx.stroke();
        for (var g = 0; g < 5; g++) {
          var gx = (-24 + g * 12) * sc, gy = by - 16 * sc - fp * 10 - (g % 2) * 5;
          flame(ctx, gx, gy + 12, 9, 18 - (g % 2) * 5, PAL.ignite, PAL.igniteCore);
        }
        ctx.globalAlpha = 1;
      } else if (fx === 'doused') {
        ctx.globalAlpha = 1 - fp;
        circle(ctx, 0, by, 33 * sc); ctx.strokeStyle = PAL.douse; ctx.lineWidth = 4; ctx.stroke();
        for (var d = 0; d < 5; d++) {
          var dx = (-26 + d * 13) * sc, dy = by - 8 + fp * 26 + (d % 2) * 8;
          ctx.strokeStyle = PAL.outline; ctx.lineWidth = 1;
          drop(ctx, dx, dy, 8, 12, PAL.douse);
          drop(ctx, dx, dy + 1, 4, 5, PAL.douseCore);
        }
        ctx.globalAlpha = 1;
      }
      // 怒氣條與標記
      rageBar(ctx, -45, -half + 2.5, 90, 12, s);
      var marks = wild ? 0 : clamp(Math.round(num(s.marks, 0)), 0, 4);
      if (marks > 0) {
        var mw = 13, mx0 = -(marks * mw) / 2 + mw / 2;
        for (var m = 0; m < marks; m++) {
          var cx = mx0 + m * mw, cy = -half + 23;
          ctx.beginPath(); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx + 5.5, cy); ctx.lineTo(cx, cy + 6); ctx.lineTo(cx - 5.5, cy); ctx.closePath();
          fs(ctx, PAL.danger, '#ffffff', 1.5);
        }
        var ml = 1 - ratio(s.markLeft, s.markDur || 4);
        var lw = marks * mw;
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-lw / 2, -half + 31, lw, 2);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-lw / 2, -half + 31, lw * (1 - ml), 2);
      }
      text(ctx, 'Lv' + lv, -half + 2, half - 8, 12, PAL.textDim, 'left', PAL.outline);
      ctx.restore();
    },

    drawFence: function (ctx, s) {
      s = S(s);
      var x = num(s.x), y = num(s.y), broken = !!s.broken;
      var L = x - 68, T = y - 7;
      ctx.save();
      if (!broken) {
        rr(ctx, L + 2, T + 2, 132, 10, 3); fs(ctx, PAL.fence, PAL.fenceDark, 2);
        ctx.fillStyle = PAL.fenceDark;
        for (var i = 0; i < 4; i++) ctx.fillRect(L + 6 + i * 40, T, 6, 14);
      } else {
        rr(ctx, L + 2, T + 2, 44, 10, 3); fs(ctx, '#7a5a38', PAL.fenceDark, 2);
        rr(ctx, L + 90, T + 2, 44, 10, 3); fs(ctx, '#7a5a38', PAL.fenceDark, 2);
        ctx.fillStyle = PAL.fenceDark; ctx.fillRect(L + 6, T, 6, 14); ctx.fillRect(L + 124, T, 6, 14);
        ctx.fillStyle = '#c9a070';
        ctx.beginPath(); ctx.moveTo(L + 46, T + 2); ctx.lineTo(L + 54, T + 6); ctx.lineTo(L + 46, T + 12); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(L + 90, T + 2); ctx.lineTo(L + 82, T + 8); ctx.lineTo(L + 90, T + 12); ctx.closePath(); ctx.fill();
        ctx.save(); ctx.translate(x, y); ctx.rotate(0.5); ctx.fillStyle = '#7a5a38'; ctx.fillRect(-12, -2, 24, 4); ctx.restore();
        ctx.save(); ctx.translate(x - 4, y + 3); ctx.rotate(-0.4); ctx.fillStyle = '#7a5a38'; ctx.fillRect(-9, -2, 18, 4); ctx.restore();
      }
      ctx.restore();
    },

    drawVisitor: function (ctx, s) {
      s = S(s);
      var x = num(s.x), y = num(s.y), mode = pick(s.mode, ['watch', 'scared', 'empty'], 'watch');
      var shirts = ['#d9835b', '#6aa0d8', '#7cc47a', '#d8b45a', '#b08ad8', '#5bc0b0', '#d88ab0', '#9aa8c0'];
      var sh = shirts[Math.abs(Math.round(x / 136)) % shirts.length];
      ctx.save();
      ctx.translate(x, y);
      rr(ctx, -24, 22, 48, 14, 4); fs(ctx, '#3e3654', '#14121c', 1.5);
      if (mode === 'watch') {
        rr(ctx, -13, -8, 26, 30, 8); fs(ctx, sh, PAL.outline, 2);
        circle(ctx, 0, -20, 11); fs(ctx, PAL.skin, PAL.outline, 2);
        circle(ctx, -4, -21, 1.6); fs(ctx, '#1a1410'); circle(ctx, 4, -21, 1.6); fs(ctx, '#1a1410');
        ctx.beginPath(); ctx.arc(0, -17, 4, 0.2, Math.PI - 0.2); ctx.strokeStyle = '#1a1410'; ctx.lineWidth = 1.5; ctx.stroke();
      } else if (mode === 'scared') {
        ctx.save(); ctx.rotate(-0.25);
        ctx.strokeStyle = PAL.outline; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(-20, -24); ctx.moveTo(10, -4); ctx.lineTo(20, -24); ctx.stroke();
        ctx.strokeStyle = sh; ctx.lineWidth = 2.5; ctx.stroke();
        rr(ctx, -12, -8, 24, 28, 8); fs(ctx, sh, PAL.outline, 2);
        circle(ctx, 0, -20, 11); fs(ctx, '#e8e8f0', PAL.outline, 2);
        circle(ctx, -4, -22, 2.4); fs(ctx, '#ffffff', '#1a1410', 1); circle(ctx, 4, -22, 2.4); fs(ctx, '#ffffff', '#1a1410', 1);
        ell(ctx, 0, -15, 3, 3.5); fs(ctx, '#1a1410');
        ctx.restore();
        drop(ctx, 18, -30, 6, 9, '#cfe9ff');
      }
      ctx.restore();
    },

    drawShopItem: function (ctx, s) {
      s = S(s);
      var x = num(s.x), y = num(s.y);
      var item = pick(s.item, Object.keys(SHOP), 'attack');
      var owned = !!s.owned, eq = !!s.equipped, aff = !!s.affordable, lv = Math.max(0, Math.round(num(s.level, 0)));
      var L = x - 190, T = y - 50;
      var isW = WEAPONS.indexOf(item) >= 0, isT = TAGS.indexOf(item) >= 0;
      ctx.save();
      rr(ctx, L, T, 380, 100, 10); fs(ctx, eq ? '#26392e' : PAL.panel, eq ? PAL.capture : PAL.panelLine, 2);
      circle(ctx, L + 46, y, 32); fs(ctx, '#11131c', isT ? TAG_COL[item] : PAL.panelLine, 2);
      ctx.save(); ctx.translate(L + 46, y);
      if (isW) { ctx.rotate(-Math.PI / 4); ctx.translate(-18, 0); weaponShape(ctx, item, 38); }
      else if (isT) tagIcon(ctx, item, 38);
      else if (item === 'attack') { ctx.rotate(-Math.PI / 4); ctx.translate(-16, 0); weaponShape(ctx, 'sword', 32); text(ctx, '+', 14, -14, 20, PAL.capture, 'center', PAL.outline); }
      else if (item === 'armor') { heart(ctx, 0, 0, 14); fs(ctx, '#ff6b7a', PAL.outline, 2); text(ctx, '+', 16, -14, 20, PAL.capture, 'center', PAL.outline); }
      else { ropeIcon(ctx, 0, 0, 14, true); text(ctx, '+', 16, -14, 20, PAL.capture, 'center', PAL.outline); }
      ctx.restore();
      var nm = SHOP[item];
      text(ctx, nm[0], L + 92, y - 22, 21, PAL.text, 'left', null, 170);
      text(ctx, nm[1], L + 92, y + 8, 14, PAL.textDim, 'left', null, 270, 'normal');
      if ((isW || isT) && owned) {
        text(ctx, '已擁有', L + 362, y - 22, 16, PAL.textDim, 'right');
      } else if (item === 'club') {
        text(ctx, '已擁有', L + 362, y - 22, 16, PAL.textDim, 'right');
      } else {
        ctx.globalAlpha = aff ? 1 : 0.45;
        coin(ctx, L + 300, y - 22, 9);
        text(ctx, String(Math.max(0, Math.round(num(s.cost, 0)))), L + 314, y - 22, 20, aff ? PAL.gold : PAL.textDim, 'left');
        ctx.globalAlpha = 1;
      }
      if (eq) { rr(ctx, L + 282, y + 14, 84, 26, 13); fs(ctx, PAL.capture); text(ctx, '裝備中', L + 324, y + 27, 15, '#10301a'); }
      if (!isW && !isT && lv > 0) text(ctx, '已買 ' + lv + ' 次', L + 92, y + 32, 13, PAL.textDim, 'left', null, null, 'normal');
      if (s.selected) { rr(ctx, L + 2.5, T + 2.5, 375, 95, 9); ctx.strokeStyle = PAL.select; ctx.lineWidth = 5; ctx.stroke(); }
      ctx.restore();
    },

    drawButton: function (ctx, s) {
      s = S(s);
      var x = num(s.x), y = num(s.y), w = Math.max(10, num(s.w, 200)), h = Math.max(10, num(s.h, 70));
      ctx.save();
      rr(ctx, x, y, w, h, 14); fs(ctx, s.selected ? PAL.select : PAL.panelHi, s.selected ? '#ffffff' : PAL.panelLine, s.selected ? 3 : 2);
      text(ctx, str(s.label), x + w / 2, y + h / 2, Math.min(28, h * 0.42), s.selected ? '#2a2410' : PAL.text);
      ctx.restore();
    },

    drawFloatText: function (ctx, s) {
      s = S(s);
      var dur = num(s.dur, 1) > 0 ? num(s.dur, 1) : 1, t = num(s.t, 0);
      if (t < 0 || t >= dur) return;
      var p = t / dur, x = num(s.x), y = num(s.y);
      var kind = pick(s.kind, ['gold', 'redGold', 'chain', 'repDown', 'capture', 'levelUp', 'coin20'], 'gold');
      var ST = {
        gold: [20, PAL.gold, PAL.outline], redGold: [26, PAL.gold, '#a0101c'], chain: [26, PAL.ignite, PAL.outline],
        repDown: [20, PAL.repDown, PAL.outline], capture: [30, PAL.capture, PAL.outline], levelUp: [24, PAL.levelUp, PAL.outline], coin20: [24, PAL.gold, PAL.outline]
      }[kind];
      var dy = kind === 'repDown' ? p * 26 : -p * 34;
      var pop = p < 0.12 ? 0.75 + p * 2.1 : 1;
      ctx.save();
      ctx.globalAlpha = p > 0.6 ? (1 - p) / 0.4 : 1;
      ctx.translate(x, y + dy); ctx.scale(pop, pop);
      text(ctx, str(s.text), 0, 0, ST[0], ST[1], 'center', ST[2]);
      ctx.restore();
    },

    drawResultPanel: function (ctx, s) {
      s = S(s);
      var L = 240, T = 120, cx = 640;
      var stars = clamp(Math.round(num(s.stars, 0)), 0, 3);
      ctx.save();
      rr(ctx, L, T, 800, 520, 18); fs(ctx, PAL.panel, PAL.panelLine, 3);
      text(ctx, '七天結算', cx, T + 44, 32, PAL.text);
      for (var i = 0; i < 3; i++) {
        star(ctx, cx - 110 + i * 110, T + 120, 42, 18);
        fs(ctx, i < stars ? PAL.gold : '#1c2030', i < stars ? '#8a6a10' : PAL.panelLine, 3);
      }
      var rows = [['總名聲', Math.round(num(s.rep, 0))], ['累計賺得金幣', Math.round(num(s.goldEarned, 0))], ['最長連鎖', Math.round(num(s.bestChain, 0)) + ' 段']];
      for (var r = 0; r < 3; r++) {
        var ry = T + 205 + r * 46;
        if (r === 0) repStar(ctx, L + 210, ry, 11); else if (r === 1) coin(ctx, L + 210, ry, 10);
        else { ctx.save(); ctx.translate(L + 210, ry); tagIcon(ctx, 'encore', 22, PAL.ignite); ctx.restore(); }
        text(ctx, rows[r][0], L + 232, ry, 22, PAL.textDim, 'left');
        text(ctx, String(rows[r][1]), L + 590, ry, 26, PAL.text, 'right');
      }
      text(ctx, '陣容', L + 60, T + 360, 18, PAL.textDim, 'left');
      var ro = Array.isArray(s.roster) ? s.roster.slice(0, 6) : [];
      for (var k = 0; k < ro.length; k++) {
        var it = S(ro[k]), sp = spOf(it.species), px = cx - (ro.length - 1) * 62 + k * 124, py = T + 405;
        circle(ctx, px, py, 34); fs(ctx, '#1c2030');
        ctx.save(); ctx.translate(px, py); var sk = sp === 'sheep' ? 0.72 : 0.9; ctx.scale(sk, sk); body(ctx, sp, {}); ctx.restore();
        text(ctx, 'Lv ' + clamp(Math.round(num(it.level, 0)), 0, 3), px, py + 46, 15, PAL.text);
      }
      text(ctx, '按 Z 重來', cx, T + 492, 22, PAL.select);
      ctx.restore();
    },

    drawHud: function (ctx, s) {
      s = S(s);
      var phase = pick(s.phase, ['guide', 'select', 'dungeon', 'setup1', 'setup2', 'show', 'shop', 'result'], 'select');
      if (phase === 'guide') return;
      var H = phase === 'dungeon' ? 100 : 50;
      var day = Math.round(num(s.day, 1)), dm = Math.round(num(s.dayMax, 7));
      ctx.save();
      ctx.fillStyle = PAL.hudBg; ctx.fillRect(0, 0, 1280, H);
      ctx.fillStyle = PAL.panelLine; ctx.fillRect(0, H - 2, 1280, 2);
      var ry = phase === 'dungeon' ? 24 : 25;
      text(ctx, '第 ' + day + '/' + dm + ' 天', 20, ry, 20, PAL.text, 'left');
      var gx = phase === 'dungeon' ? 1060 : 150;
      coin(ctx, gx + 10, ry, 10); text(ctx, String(Math.round(num(s.gold, 0))), gx + 26, ry, 20, PAL.gold, 'left');
      repStar(ctx, gx + 110, ry, 11); text(ctx, String(Math.round(num(s.rep, 0))), gx + 126, ry, 20, PAL.rep, 'left');
      var tl = num(s.timeLeft, 0), tm = num(s.timeMax, 0);
      if (tm > 0) {
        var bx = phase === 'dungeon' ? 440 : 960, bw = phase === 'dungeon' ? 400 : 230, byy = ry - 7;
        rr(ctx, bx, byy, bw, 14, 7); fs(ctx, '#262a38');
        var tp = clamp(tl / tm, 0, 1);
        rr(ctx, bx, byy, Math.max(14, bw * tp), 14, 7); fs(ctx, tp < 0.2 ? PAL.ignite : PAL.playerLight);
        text(ctx, String(Math.ceil(Math.max(0, tl))), bx + bw + 14, ry, 20, tp < 0.2 ? PAL.ignite : PAL.text, 'left');
      }
      if (phase === 'dungeon') {
        var dg = pick(s.dungeon, DUNGEONS, '');
        if (dg) text(ctx, DG_NAME[dg], 150, ry, 20, THEME[dg].accent, 'left');
        var hearts = clamp(Math.round(num(s.hearts, 0)), 0, 30), mh = clamp(Math.round(num(s.maxHearts, 6)), 0, 30);
        for (var i = 0; i < mh; i++) { heart(ctx, 30 + i * 22, 66, 9); fs(ctx, i < hearts ? '#ff6b7a' : '#2e2a36', PAL.outline, 1.5); }
        var rp = clamp(Math.round(num(s.ropes, 0)), 0, 20), rm = clamp(Math.round(num(s.ropeMax, 3)), 0, 20);
        var rx0 = 40 + Math.max(mh, 6) * 22;
        for (var j = 0; j < rm; j++) ropeIcon(ctx, rx0 + j * 24, 66, 8, j < rp);
        // 武器 + X 冷卻
        var wp = pick(s.weapon, WEAPONS, 'club');
        ctx.save(); ctx.translate(1080, 66); ctx.rotate(-Math.PI / 4); ctx.translate(-14, 0); weaponShape(ctx, wp, 30); ctx.restore();
        text(ctx, WP_NAME[wp], 1106, 66, 18, PAL.text, 'left');
        var xm = num(s.xCdMax, 0), xl = num(s.xCdLeft, 0);
        rr(ctx, 1190, 50, 32, 32, 6); fs(ctx, '#20253a', xm > 0 ? (xl > 0 ? '#5a6078' : PAL.select) : '#3a3e4c', 2);
        if (xm > 0 && xl > 0) {
          ctx.save(); rr(ctx, 1190, 50, 32, 32, 6); ctx.clip();
          ctx.beginPath(); ctx.moveTo(1206, 66); ctx.arc(1206, 66, 26, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(xl / xm, 0, 1)); ctx.closePath();
          ctx.fillStyle = 'rgba(8,9,14,0.75)'; ctx.fill(); ctx.restore();
        }
        text(ctx, 'X', 1206, 66, 18, xm > 0 ? (xl > 0 ? PAL.textDim : PAL.select) : '#4a4e5c');
        if (xm <= 0) { ctx.strokeStyle = '#6a6e7c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(1194, 78); ctx.lineTo(1218, 54); ctx.stroke(); }
        text(ctx, str(s.message), 640, 70, 22, PAL.select, 'center', PAL.outline, 520);
      } else {
        var mxw = tm > 0 ? 520 : 640;
        text(ctx, str(s.message), tm > 0 ? 620 : 680, ry, 18, PAL.text, 'center', null, mxw, 'normal');
      }
      ctx.restore();
    },

    // ---------- 說明頁示意圖(只畫在 x,y,w,h 框內) ----------
    drawGuidePage: function (ctx, s) {
      s = S(s);
      var page = clamp(Math.round(num(s.page, 0)), 0, 4);
      var bx = num(s.x, 140), by = num(s.y, 120), bw = Math.max(10, num(s.w, 1000)), bh = Math.max(10, num(s.h, 460));
      var VW = 800, VH = 420, k = Math.min(bw / VW, bh / VH);
      ctx.save();
      ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
      ctx.translate(bx + (bw - VW * k) / 2, by + (bh - VH * k) / 2);
      ctx.scale(k, k);
      GUIDE[page](ctx);
      ctx.restore();
    }
  };

  // ---------- 說明頁內容(虛擬 800×420) ----------
  function miniField(ctx, x, y, w, h) {
    rr(ctx, x, y, w, h, 14); fs(ctx, '#323a4c', PAL.fieldLine, 3);
  }
  function keycap(ctx, x, y, label, w) {
    w = w || 40;
    rr(ctx, x - w / 2, y - 18, w, 36, 7); fs(ctx, '#e8e6dc', '#5a5a66', 2);
    rr(ctx, x - w / 2, y + 12, w, 6, 3); fs(ctx, '#b8b6ac');
    text(ctx, label, x, y - 2, 18, '#22222a');
  }
  function arrowKeys(ctx, x, y) {
    var u = 26;
    var pos = [[0, -1], [-1, 0], [0, 0], [1, 0]], ang = [-90, 180, 90, 0];
    for (var i = 0; i < 4; i++) {
      var px = x + pos[i][0] * (u + 3), py = y + pos[i][1] * (u + 3);
      rr(ctx, px - u / 2, py - u / 2, u, u, 5); fs(ctx, '#e8e6dc', '#5a5a66', 2);
      ctx.save(); ctx.translate(px, py); ctx.rotate(ang[i] * D2R);
      ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -6); ctx.lineTo(-4, 6); ctx.closePath(); fs(ctx, '#22222a'); ctx.restore();
    }
  }
  function tag(ctx, x, y, label, col) {
    text(ctx, label, x, y, 16, col || PAL.text, 'center', PAL.outline);
  }
  function bigX(ctx, x, y, r) {
    ctx.strokeStyle = PAL.outline; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); ctx.stroke();
    ctx.strokeStyle = PAL.danger; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); ctx.stroke();
  }

  var GUIDE = [
    // 第 1 頁 地下城
    function (ctx) {
      for (var c = 0; c < 14; c++) {
        for (var r = 0; r < 7; r++) {
          var kind = r === 0 ? 'wall' : 'floor';
          if (c === 11 && r === 5) kind = 'pillar';
          if ((c === 2 || c === 3) && r === 6) kind = 'slow';
          Art.drawTile(ctx, { x: -20 + c * 60 + 30, y: r * 60 + 30, dungeon: 'workshop', kind: kind, room: 'left', nest: c === 10 && r === 2 });
        }
      }
      var B = { x: 620, y: 200 };
      var dirs = [45, 135, 225, 315];
      for (var i = 0; i < 4; i++) {
        var a = dirs[i] * D2R, sx = B.x + Math.cos(a) * 78, sy = B.y + Math.sin(a) * 78;
        ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(255,226,122,0.55)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(B.x + Math.cos(a) * 230, B.y + Math.sin(a) * 230); ctx.stroke(); ctx.restore();
        Art.drawHazard(ctx, { x: sx, y: sy, kind: 'spark', phase: 'fly', radius: 12, angle: a });
      }
      Art.drawWildMonster(ctx, { x: B.x, y: B.y, species: 'mouse', hp: 7, maxHp: 7, dir: -1, move: 'walk' });
      var T = { x: 380, y: 200 };
      Art.drawWildMonster(ctx, { x: 448, y: 200, species: 'mouse', hp: 5, maxHp: 7, hit: true, dir: -1, move: 'walk' });
      Art.drawTamer(ctx, { x: T.x, y: T.y, facing: 2, weapon: 'club' });
      Art.drawWeaponFx(ctx, { x: T.x, y: T.y, weapon: 'club', move: 'normal', shape: 'arc', angle: 0, spread: 100 * D2R, radius: 70, t: 0.06, dur: 0.2 });
      ctx.save(); arrow(ctx, T.x - 26, T.y, T.x - 150, T.y, '#ffffff', 6, 18); ctx.restore();
      arrowKeys(ctx, T.x - 100, T.y + 75);
      keycap(ctx, T.x + 50, T.y - 78, 'Z');
      tag(ctx, T.x, T.y + 34, '你');
    },
    // 第 2 頁 收服
    function (ctx) {
      miniPanel(ctx, 0, 0, 390, 420, 'workshop');
      miniPanel(ctx, 410, 0, 390, 420, 'workshop');
      // 左: 準備捕捉
      Art.drawWildMonster(ctx, { x: 195, y: 220, species: 'snail', hp: 2, maxHp: 8, weak: true, dir: 1, move: 'walk' });
      Art.drawCaptureRing(ctx, { x: 195, y: 220, t: 0.4, dur: 0.8 });
      Art.drawTamer(ctx, { x: 207, y: 232, facing: 0, weapon: 'club' });
      // 右: 套索繞圈
      var C = { x: 605, y: 230 }, R = 120, a0 = -40 * D2R;
      ctx.save(); ctx.setLineDash([8, 7]); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(C.x, C.y, R, a0, a0 + 300 * D2R); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
      var ae = a0 + 300 * D2R;
      ctx.save(); ctx.translate(C.x + Math.cos(ae) * R, C.y + Math.sin(ae) * R); ctx.rotate(ae + Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -9); ctx.lineTo(-6, 9); ctx.closePath(); fs(ctx, '#ffffff'); ctx.restore();
      var tx = C.x + Math.cos(a0 + 180 * D2R) * R, ty = C.y + Math.sin(a0 + 180 * D2R) * R;
      Art.drawWildMonster(ctx, { x: C.x, y: C.y, species: 'snail', hp: 2, maxHp: 8, weak: true, lassoed: true, dir: -1, move: 'walk' });
      Art.drawLasso(ctx, { x1: tx, y1: ty, x2: C.x, y2: C.y, progress: 0.5, t: 1.5, limit: 5, len: R, maxLen: 220 });
      Art.drawTamer(ctx, { x: tx, y: ty, facing: 7, weapon: 'club', lassoing: true });
      // 角落: 收服!
      rr(ctx, 650, 330, 140, 76, 10); fs(ctx, 'rgba(10,12,20,0.75)', PAL.capture, 2);
      Art.drawFloatText(ctx, { x: 735, y: 368, text: '收服!', kind: 'capture', t: 0.15, dur: 1 });
      ctx.strokeStyle = PAL.capture; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(664, 366); ctx.lineTo(674, 378); ctx.lineTo(692, 352); ctx.stroke();
    },
    // 第 3 頁 掛口令牌
    function (ctx) {
      ctx.save();
      ctx.translate(-10, 0); ctx.scale(0.62, 0.62);
      // 原座標: 列中心 x 420, y 125 / 250; 牌位中心 x 470 / 700
      Art.drawSetupRow(ctx, { x: 420, y: 80, species: 'mouse', level: 0, selected: false });
      Art.drawTagSlot(ctx, { x: 470, y: 80, tag: 'calm' });
      Art.drawTagSlot(ctx, { x: 700, y: 80, tag: 'relay' });
      Art.drawSetupRow(ctx, { x: 420, y: 205, species: 'snail', level: 0, selected: true });
      Art.drawTagSlot(ctx, { x: 470, y: 205, tag: 'cheer' });
      Art.drawTagSlot(ctx, { x: 700, y: 205, tag: '', selected: true });
      ctx.restore();
      arrow(ctx, 520, 175, 600, 230, '#ffffff', 5, 16);
      miniField(ctx, 470, 220, 320, 196);
      var M = { x: 630, y: 330 };
      Art.drawShowMonster(ctx, { x: M.x, y: M.y, species: 'snail', level: 0, rage: 73, redLow: 80, marks: 0, markLeft: 0, markDur: 4, mode: 'roam', fx: 'ignited', fxT: 0.12, fxDur: 0.5, move: 'walk', dir: 1 });
      // 怒氣條剛從門檻下跳上來: 標出 48 → 73 這一段
      var bx = M.x - 45, byy = M.y - 48 + 2.5;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(bx + 90 * 0.48, byy - 1, 90 * 0.25, 14);
      arrow(ctx, bx + 90 * 0.48 - 14, byy + 26, bx + 90 * 0.73 + 4, byy + 26, '#ffffff', 3, 9);
      Art.drawTagBadge(ctx, { x: M.x - 18, y: M.y + 66, tag: 'cheer', cdLeft: 7.9, cdDur: 8, flashT: 0.1, flashDur: 0.3 });
      Art.drawTagFx(ctx, { x: M.x, y: M.y, tag: 'cheer', t: 0.2, dur: 0.8 });
    },
    // 第 4 頁 紅區
    function (ctx) {
      miniField(ctx, 10, 0, 780, 190);
      var A = { x: 300, y: 112 };
      Art.drawShowMonster(ctx, { x: A.x, y: A.y, species: 'pumpkin', level: 0, rage: 90, redLow: 80, marks: 0, mode: 'roam', performing: true, performT: 0.2, performDur: 0.5, fx: 'none', move: 'walk', dir: 1 });
      Art.drawFloatText(ctx, { x: A.x + 130, y: A.y - 20, text: '+6 ×2', kind: 'redGold', t: 0.1, dur: 1 });
      coin(ctx, A.x + 70, A.y - 22, 9);
      // 下: 4 個標記 → 衝欄
      miniField(ctx, 10, 205, 780, 215);
      var B = { x: 190, y: 330 };
      Art.drawShowMonster(ctx, { x: B.x, y: B.y, species: 'pumpkin', level: 0, rage: 100, redLow: 80, marks: 4, markLeft: 2.5, markDur: 4, mode: 'roam', fx: 'none', move: 'walk', dir: 1 });
      arrow(ctx, 270, 330, 420, 330, '#ffffff', 6, 18);
      ctx.save(); rr(ctx, 470, 205, 320, 60, 14); ctx.clip(); ctx.fillStyle = PAL.stands; ctx.fillRect(470, 205, 320, 60); ctx.restore();
      ctx.save(); ctx.translate(560, 236); ctx.scale(0.62, 0.62); Art.drawVisitor(ctx, { x: 0, y: 0, side: 'top', mode: 'scared' }); ctx.restore();
      ctx.save(); ctx.translate(690, 236); ctx.scale(0.62, 0.62); Art.drawVisitor(ctx, { x: 136, y: 0, side: 'top', mode: 'watch' }); ctx.restore();
      Art.drawFence(ctx, { x: 620, y: 272, side: 'top', broken: false });
      Art.drawShowMonster(ctx, { x: 620, y: 332, species: 'pumpkin', level: 0, rage: 100, redLow: 80, marks: 0, mode: 'charge', chargeT: 0.6, chargeDur: 1.5, fx: 'none', move: 'walk', dir: 1 });
      bigX(ctx, 730, 330, 26);
    },
    // 第 5 頁 目標
    function (ctx) {
      var C = { x: 300, y: 210 };
      var nodes = [
        { x: 300, y: 58, l: '地下城', c: THEME.workshop.accent },
        { x: 520, y: 210, l: '布置', c: PAL.other },
        { x: 300, y: 362, l: '表演', c: PAL.ignite },
        { x: 80, y: 210, l: '商店', c: PAL.gold }
      ];
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 4;
      for (var i = 0; i < 4; i++) {
        var a1 = (-90 + i * 90 + 24) * D2R, a2 = (-90 + (i + 1) * 90 - 24) * D2R;
        ctx.beginPath(); ctx.ellipse(C.x, C.y, 220, 152, 0, a1, a2); ctx.stroke();
        var ex = C.x + Math.cos(a2) * 220, ey = C.y + Math.sin(a2) * 152;
        var tx = -Math.sin(a2) * 220, ty = Math.cos(a2) * 152, tl = Math.sqrt(tx * tx + ty * ty);
        arrow(ctx, ex - tx / tl * 4, ey - ty / tl * 4, ex + tx / tl * 6, ey + ty / tl * 6, 'rgba(255,255,255,0.8)', 4, 16);
      }
      for (var j = 0; j < 4; j++) {
        var n = nodes[j];
        rr(ctx, n.x - 62, n.y - 26, 124, 52, 12); fs(ctx, PAL.panel, n.c, 3);
        text(ctx, n.l, n.x, n.y, 22, PAL.text);
      }
      text(ctx, '×7 天', C.x, C.y, 40, PAL.text, 'center', PAL.outline);
      for (var r = 0; r < 3; r++) repStar(ctx, 390 + r * 8, 352 - r * 26, 10);
      arrow(ctx, 404, 300, 404, 262, PAL.rep, 3, 10);
      arrow(ctx, 380, 380, 600, 380, '#ffffff', 5, 16);
      tag(ctx, 490, 402, '第 7 天');
      rr(ctx, 610, 320, 180, 96, 14); fs(ctx, PAL.panel, PAL.gold, 3);
      for (var s2 = 0; s2 < 3; s2++) { star(ctx, 650 + s2 * 50, 368, 20, 8.5); fs(ctx, s2 < 2 ? PAL.gold : '#1c2030', s2 < 2 ? '#8a6a10' : PAL.panelLine, 2); }
    }
  ];
  function miniPanel(ctx, x, y, w, h, dg) {
    ctx.save();
    rr(ctx, x, y, w, h, 12); ctx.clip();
    for (var c = 0; c < Math.ceil(w / 60) + 1; c++) {
      for (var r = 0; r < Math.ceil(h / 60) + 1; r++) {
        Art.drawTile(ctx, { x: x + c * 60 + 30, y: y + r * 60 + 30, dungeon: dg, kind: 'floor', room: 'right', nest: false });
      }
    }
    ctx.restore();
    rr(ctx, x, y, w, h, 12); fs(ctx, null, PAL.panelLine, 3);
  }

  ROOT.Art = Art;
})();
