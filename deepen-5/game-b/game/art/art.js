// 暗號節目單 — 美術(Canvas 2D 幾何繪製, 無外部資源)
// 契約見 style.md。全域物件 window.Art, 不用 ES module。
(function () {
  'use strict';

  // ───────────── 基本工具 ─────────────
  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC","Heiti TC",sans-serif';
  var TAU = Math.PI * 2;
  function N(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; }
  function S(v, d) { return (typeof v === 'string') ? v : d; }
  function B(v) { return v === true; }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function p01(t, d) { t = N(t, 0); d = N(d, 0); return d > 0 ? clamp(t / d, 0, 1) : 0; }
  function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }
  function wrap(fn) {
    return function (ctx, s) {
      if (!ctx) return;
      ctx.save();
      try { fn(ctx, (s && typeof s === 'object') ? s : {}); } finally { ctx.restore(); }
    };
  }
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
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
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); }
  function ell(ctx, x, y, rx, ry, rot) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot || 0, 0, TAU); }
  // 文字: 一律帶深色描邊(P10)
  function T(ctx, str, x, y, o) {
    o = o || {};
    var size = o.size || 16;
    str = String(str == null ? '' : str);
    ctx.save();
    ctx.font = (o.weight || 'bold') + ' ' + size + 'px ' + FONT;
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.base || 'middle';
    if (o.maxW) {
      var w = ctx.measureText(str).width;
      if (w > o.maxW && w > 0) {
        size = Math.max(9, Math.floor(size * o.maxW / w));
        ctx.font = (o.weight || 'bold') + ' ' + size + 'px ' + FONT;
      }
    }
    if (o.stroke !== false) {
      ctx.lineJoin = 'round';
      ctx.strokeStyle = o.strokeColor || 'rgba(8,10,16,0.9)';
      ctx.lineWidth = o.strokeW || Math.max(2, size * 0.22);
      ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = o.color || P.text;
    ctx.fillText(str, x, y);
    ctx.restore();
  }
  // 依寬度斷行(逐字, 適合中文)
  function wrapLines(ctx, str, maxW, size) {
    str = String(str == null ? '' : str);
    ctx.save();
    ctx.font = 'bold ' + size + 'px ' + FONT;
    var out = [], line = '';
    for (var i = 0; i < str.length; i++) {
      var c = str[i];
      var test = line + c;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = c; } else line = test;
    }
    if (line) out.push(line);
    ctx.restore();
    return out;
  }

  // ───────────── 色票 ─────────────
  var P = {
    bg: '#141821', bg2: '#1c2230', panel: '#232a3a', panelHi: '#2f3a52', line: '#465372',
    text: '#eef2f8', textDim: '#9aa6bd', outline: '#0d1018',
    select: '#ffd24a',          // 選擇框 / 游標(全遊戲唯一)
    tamer: '#ffd24a',           // 馴獸師與他造成的東西(攻擊特效、打回去的投射物)
    capture: '#c6f046',         // 可捕捉 / 捕捉進度 / 收服
    rope: '#f0e2b8',
    danger: '#ff3b4a',          // 傷害地形、失控、紅區
    ignite: '#ff6a2c',          // 激怒(點燃)
    calm: '#3fa0ff',            // 冷靜(澆熄)
    special: '#b46cff',         // 特殊效果(標靶 / 凍結 / 變走)
    cue: '#5ad1e6',             // 暗號(條件)
    program: '#ff8fc8',         // 節目(全場效果)
    gold: '#ffc83a',            // 金幣
    rep: '#9fd8ff',             // 名聲
    rageLow: '#8390aa', rageMid: '#ffb43a', rageRed: '#ff3b4a',
    ice: '#bfeaff',
    portal1: '#3fe0ff', portal2: '#ff7ad9',
    lily: '#8fe3a0', monkey: '#e8782c', beetle: '#2fb8a8', parrot: '#ec4f9c', penguin: '#3a5a9a', tanuki: '#a88a62',
    heart: '#ff5d7a'
  };

  var SP = {
    lily: { name: '鈴蘭精', effect: 'calm' }, monkey: { name: '火柴猴', effect: 'ignite' },
    beetle: { name: '齒輪甲蟲', effect: 'ignite' }, parrot: { name: '標靶鸚鵡', effect: 'target' },
    penguin: { name: '冰柱企鵝', effect: 'freeze' }, tanuki: { name: '戲法狸', effect: 'warp' }
  };
  var SP_ORDER = ['lily', 'monkey', 'beetle', 'parrot', 'penguin', 'tanuki'];
  function spKey(s) { return SP[s] ? s : 'lily'; }
  var EFFECT = {
    ignite: { label: '激怒', color: P.ignite }, calm: { label: '冷靜', color: P.calm },
    target: { label: '標靶', color: P.special }, freeze: { label: '凍結', color: P.special }, warp: { label: '變走', color: P.special }
  };
  function effKey(e) { return EFFECT[e] ? e : ''; }
  var CUE = { wait: '過 6 秒', red3: '三隻進紅區', mark3: '有人標記 3', cold: '冷場', chain3: '連鎖 3', multi3: '一招 3 隻', loose: '有人失控' };
  var CUE_DESC = { wait: '上一個節目演完 6 秒後', red3: '場上同時有 3 隻在紅區', mark3: '有一隻標記到 3 個', cold: '一半以上的魔物冷掉了', chain3: '出現連鎖 3 段的表演', multi3: '有一招打中 3 隻以上', loose: '有一隻失控了' };
  var PROG = { ice: '冰水桶', pep: '加油棒', scatter: '散場', mob: '圍攻', tutti: '大合奏', lull: '安撫曲', spot: '聚光燈', shuffle: '魔術箱' };
  var PROG_DESC = { ice: '紅區又沒標記的全部冷靜一點', pep: '怒氣不到 50 的全部打氣', scatter: '大家互相遠離 3 秒', mob: '大家去圍最氣的那隻 3 秒', tutti: '紅區的全部立刻表演', lull: '有標記的全部冷靜下來', spot: '最氣的那隻連演 3 次', shuffle: '全場洗牌換位置' };
  var DUN = {
    lake: { name: '鏡湖', sp: ['lily', 'monkey'], color: '#4fb3d9' },
    tower: { name: '齒輪鐘塔', sp: ['beetle', 'parrot'], color: '#d9a84f' },
    snow: { name: '雪境', sp: ['penguin', 'tanuki'], color: '#cfe8ff' }
  };
  function dunKey(d) { return DUN[d] ? d : 'lake'; }
  var WEAPON = { club: '棍棒', sword: '劍', spear: '長槍', whip: '長鞭' };
  function wpKey(w) { return WEAPON[w] ? w : 'club'; }
  var ITEM = {
    club: { name: '棍棒', desc: 'Z 敲擊 X 無', kind: 'weapon' },
    sword: { name: '劍', desc: 'Z 斬擊可打回飛彈 X 擊暈', kind: 'weapon' },
    spear: { name: '長槍', desc: 'Z 長刺 X 突進', kind: 'weapon' },
    whip: { name: '長鞭', desc: 'Z 整圈抽打 X 擊飛', kind: 'weapon' },
    attack: { name: '攻擊力 +1', desc: '每次攻擊傷害 +1', kind: 'up' },
    armor: { name: '護甲 心 +1', desc: '心上限 +1', kind: 'up' },
    ropeBag: { name: '繩袋 捕獸繩 +1', desc: '每天捕獸繩 +1', kind: 'up' }
  };

  // ───────────── 魔物剪影(種類辨識主通道 = 剪影) ─────────────
  // 在 (0,0) 畫, 身體圓半徑 R; 配件最遠 1.15R(戲法狸尾巴 1.6R)
  function eyes(ctx, pts, r, mode, flat) {
    for (var i = 0; i < pts.length; i++) {
      var x = pts[i][0], y = pts[i][1];
      if (flat) { continue; }
      if (mode === 'weak') {
        ctx.strokeStyle = P.outline; ctx.lineWidth = Math.max(1.5, r * 0.55); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(x, y - r * 0.6, r * 1.1, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
      } else if (mode === 'dizzy') {
        ctx.strokeStyle = P.outline; ctx.lineWidth = Math.max(1.2, r * 0.4);
        ctx.beginPath();
        for (var k = 0; k <= 14; k++) { var a = k * 0.75, rad = r * 1.2 * k / 14; var px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad; if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
        ctx.stroke();
      } else {
        circle(ctx, x, y, r); ctx.fillStyle = '#ffffff'; ctx.fill();
        circle(ctx, x + r * 0.2, y + r * 0.1, r * 0.55); ctx.fillStyle = P.outline; ctx.fill();
        if (mode === 'angry') {
          ctx.strokeStyle = P.outline; ctx.lineWidth = Math.max(1.5, r * 0.5); ctx.lineCap = 'round';
          var sgn = (x < 0) ? 1 : -1;
          ctx.beginPath(); ctx.moveTo(x - r * 1.2 * sgn, y - r * 1.9); ctx.lineTo(x + r * 1.1 * sgn, y - r * 1.2); ctx.stroke();
        }
      }
    }
  }
  function paintSpecies(ctx, sp, R, o) {
    o = o || {};
    var flat = o.flat || null;
    function C(c) { return flat || c; }
    var em = o.eyes || 'normal';
    ctx.save();
    ctx.scale(o.dir === -1 ? -1 : 1, 1);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = flat ? flat : P.outline;
    ctx.lineWidth = Math.max(1.5, R * 0.08);
    var lw = ctx.lineWidth;
    if (sp === 'lily') {
      ctx.fillStyle = C('#45b865');
      ell(ctx, -0.36 * R, -0.72 * R, 0.36 * R, 0.17 * R, -0.6); ctx.fill(); ctx.stroke();
      ell(ctx, 0.36 * R, -0.76 * R, 0.36 * R, 0.17 * R, 0.6); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-0.92 * R, 0.5 * R);
      ctx.bezierCurveTo(-0.95 * R, -0.75 * R, 0.95 * R, -0.75 * R, 0.92 * R, 0.5 * R);
      var n = 4, x0 = 0.92 * R, step = (2 * x0) / n;
      for (var i = 0; i < n; i++) {
        var xa = x0 - step * i, xb = xa - step;
        ctx.quadraticCurveTo((xa + xb) / 2, 0.92 * R, xb, 0.5 * R);
      }
      ctx.closePath();
      ctx.fillStyle = C('#eaf8ee'); ctx.fill(); ctx.stroke();
      if (!flat) { ctx.strokeStyle = P.lily; ctx.lineWidth = lw * 1.4; ctx.beginPath(); ctx.moveTo(-0.7 * R, 0.42 * R); ctx.quadraticCurveTo(0, 0.6 * R, 0.7 * R, 0.42 * R); ctx.stroke(); }
      eyes(ctx, [[-0.3 * R, 0.02 * R], [0.3 * R, 0.02 * R]], R * 0.14, em, flat);
    } else if (sp === 'monkey') {
      ctx.strokeStyle = C('#a04e16'); ctx.lineWidth = R * 0.16; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(-0.82 * R, 0.42 * R, 0.28 * R, -0.3 * Math.PI, 1.2 * Math.PI); ctx.stroke();
      ctx.strokeStyle = flat ? flat : P.outline; ctx.lineWidth = lw;
      ctx.fillStyle = C(P.monkey);
      circle(ctx, -0.86 * R, -0.12 * R, 0.25 * R); ctx.fill(); ctx.stroke();
      circle(ctx, 0.86 * R, -0.12 * R, 0.25 * R); ctx.fill(); ctx.stroke();
      circle(ctx, 0, 0, 0.84 * R); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C('#f6c992'); ell(ctx, 0, 0.16 * R, 0.56 * R, 0.46 * R, 0); ctx.fill();
      // 手上的火柴
      ctx.save(); ctx.translate(0.72 * R, 0.55 * R); ctx.rotate(-0.7);
      ctx.fillStyle = C('#e8d3a0'); ctx.fillRect(-0.04 * R, -0.42 * R, 0.08 * R, 0.42 * R);
      circle(ctx, 0, -0.46 * R, 0.1 * R); ctx.fillStyle = C('#ff4a2a'); ctx.fill();
      ctx.restore();
      eyes(ctx, [[-0.24 * R, 0.0], [0.24 * R, 0.0]], R * 0.13, em, flat);
    } else if (sp === 'beetle') {
      ctx.fillStyle = C('#1f857a');
      ctx.beginPath();
      var teeth = 10;
      for (var k = 0; k < teeth * 2; k++) {
        var a0 = k * Math.PI / teeth, rr0 = (k % 2 === 0) ? 1.0 * R : 0.84 * R;
        var a1 = a0 + Math.PI / teeth;
        if (k === 0) ctx.moveTo(Math.cos(a0) * rr0, Math.sin(a0) * rr0);
        ctx.lineTo(Math.cos(a0) * rr0, Math.sin(a0) * rr0);
        ctx.lineTo(Math.cos(a1) * rr0, Math.sin(a1) * rr0);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      circle(ctx, 0, 0, 0.8 * R); ctx.fillStyle = C(P.beetle); ctx.fill(); ctx.stroke();
      if (!flat) {
        ctx.strokeStyle = '#17665e'; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(-0.1 * R, -0.78 * R); ctx.lineTo(-0.1 * R, 0.78 * R); ctx.stroke();
        circle(ctx, -0.45 * R, -0.25 * R, 0.14 * R); ctx.fillStyle = '#17665e'; ctx.fill();
        circle(ctx, -0.45 * R, 0.3 * R, 0.12 * R); ctx.fill();
      }
      ctx.strokeStyle = flat ? flat : P.outline;
      ctx.beginPath(); ctx.arc(0.52 * R, 0.05 * R, 0.42 * R, -Math.PI / 2, Math.PI / 2); ctx.closePath();
      ctx.fillStyle = C('#203a3a'); ctx.fill(); ctx.stroke();
      eyes(ctx, [[0.6 * R, -0.13 * R], [0.6 * R, 0.22 * R]], R * 0.11, em, flat);
    } else if (sp === 'parrot') {
      ctx.fillStyle = C('#b8327a');
      ell(ctx, -0.75 * R, 0.42 * R, 0.4 * R, 0.13 * R, 0.5); ctx.fill(); ctx.stroke();
      ell(ctx, -0.7 * R, 0.6 * R, 0.38 * R, 0.12 * R, 0.25); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C('#ffd34a');
      ell(ctx, -0.18 * R, -0.85 * R, 0.12 * R, 0.24 * R, -0.5); ctx.fill(); ctx.stroke();
      ell(ctx, 0.05 * R, -0.9 * R, 0.12 * R, 0.24 * R, 0); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C(P.parrot);
      ell(ctx, 0, 0.08 * R, 0.74 * R, 0.84 * R, 0); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C('#b8327a'); ell(ctx, -0.18 * R, 0.25 * R, 0.4 * R, 0.5 * R, -0.3); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0.6 * R, -0.3 * R); ctx.quadraticCurveTo(1.08 * R, -0.25 * R, 0.95 * R, 0.12 * R); ctx.quadraticCurveTo(0.8 * R, -0.05 * R, 0.62 * R, 0.05 * R); ctx.closePath();
      ctx.fillStyle = C('#ffd34a'); ctx.fill(); ctx.stroke();
      eyes(ctx, [[0.32 * R, -0.28 * R]], R * 0.15, em, flat);
    } else if (sp === 'penguin') {
      ctx.fillStyle = C('#ff9a3a');
      ell(ctx, -0.28 * R, 0.9 * R, 0.22 * R, 0.1 * R, 0); ctx.fill();
      ell(ctx, 0.28 * R, 0.9 * R, 0.22 * R, 0.1 * R, 0); ctx.fill();
      ctx.fillStyle = C('#22365e');
      ell(ctx, -0.78 * R, 0.15 * R, 0.17 * R, 0.4 * R, 0.25); ctx.fill(); ctx.stroke();
      ell(ctx, 0.78 * R, 0.15 * R, 0.17 * R, 0.4 * R, -0.25); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C(P.penguin); ell(ctx, 0, 0, 0.74 * R, 0.92 * R, 0); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C('#f2f6fb'); ell(ctx, 0.08 * R, 0.18 * R, 0.5 * R, 0.66 * R, 0); ctx.fill();
      ctx.fillStyle = C(P.ice); ell(ctx, 0, -0.84 * R, 0.36 * R, 0.14 * R, 0); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0.48 * R, -0.3 * R); ctx.lineTo(0.8 * R, -0.2 * R); ctx.lineTo(0.48 * R, -0.1 * R); ctx.closePath();
      ctx.fillStyle = C('#ff9a3a'); ctx.fill(); ctx.stroke();
      eyes(ctx, [[0.1 * R, -0.38 * R], [0.36 * R, -0.38 * R]], R * 0.11, em, flat);
    } else { // tanuki
      ctx.save(); ctx.translate(-1.02 * R, 0.25 * R); ctx.rotate(-0.35);
      ell(ctx, 0, 0, 0.5 * R, 0.3 * R, 0); ctx.fillStyle = C(P.tanuki); ctx.fill(); ctx.stroke();
      if (!flat) {
        ctx.save(); ell(ctx, 0, 0, 0.5 * R, 0.3 * R, 0); ctx.clip();
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(-0.25 * R, -0.4 * R, 0.12 * R, 0.8 * R);
        ctx.fillRect(0.05 * R, -0.4 * R, 0.12 * R, 0.8 * R);
        ctx.fillRect(-0.52 * R, -0.4 * R, 0.14 * R, 0.8 * R);
        ctx.restore();
      }
      ctx.restore();
      ctx.fillStyle = C('#4a3a2a');
      circle(ctx, -0.55 * R, -0.7 * R, 0.2 * R); ctx.fill(); ctx.stroke();
      circle(ctx, 0.55 * R, -0.7 * R, 0.2 * R); ctx.fill(); ctx.stroke();
      circle(ctx, 0, 0, 0.84 * R); ctx.fillStyle = C(P.tanuki); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C('#e6d4b4'); ell(ctx, 0, 0.38 * R, 0.46 * R, 0.36 * R, 0); ctx.fill();
      ctx.fillStyle = C('#3a2c20'); ell(ctx, 0, -0.08 * R, 0.62 * R, 0.22 * R, 0); ctx.fill();
      ctx.fillStyle = C('#59c06a');
      ell(ctx, 0.12 * R, -0.92 * R, 0.24 * R, 0.1 * R, -0.4); ctx.fill(); ctx.stroke();
      eyes(ctx, [[-0.26 * R, -0.08 * R], [0.26 * R, -0.08 * R]], R * 0.12, em, flat);
    }
    ctx.restore();
  }

  // ───────────── 圖示: 暗號 / 節目 / 武器 / 心 / 星 ─────────────
  function iconCue(ctx, key, x, y, s, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= (alpha == null ? 1 : alpha);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var W = '#f4f8ff';
    ctx.strokeStyle = W; ctx.lineWidth = Math.max(1.5, s * 0.16);
    if (key === 'wait') {
      circle(ctx, 0, 0, s * 0.85); ctx.fillStyle = 'rgba(90,209,230,0.25)'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * 0.55); ctx.moveTo(0, 0); ctx.lineTo(s * 0.42, s * 0.18); ctx.stroke();
    } else if (key === 'red3') {
      for (var i = -1; i <= 1; i++) {
        ctx.beginPath();
        var fx = i * s * 0.62, fy = s * 0.35;
        ctx.moveTo(fx, fy - s * 0.95);
        ctx.quadraticCurveTo(fx + s * 0.38, fy - s * 0.2, fx, fy + s * 0.25);
        ctx.quadraticCurveTo(fx - s * 0.38, fy - s * 0.2, fx, fy - s * 0.95);
        ctx.fillStyle = P.rageRed; ctx.fill(); ctx.lineWidth = Math.max(1, s * 0.1); ctx.stroke();
      }
    } else if (key === 'mark3') {
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-s * 0.9, s * 0.3, s * 1.8, s * 0.32);
      for (var j = -1; j <= 1; j++) { circle(ctx, j * s * 0.6, -s * 0.2, s * 0.26); ctx.fillStyle = P.ignite; ctx.fill(); ctx.lineWidth = Math.max(1, s * 0.1); ctx.stroke(); }
    } else if (key === 'cold') {
      rr(ctx, -s * 0.2, -s * 0.9, s * 0.4, s * 1.3, s * 0.2); ctx.stroke();
      circle(ctx, 0, s * 0.55, s * 0.32); ctx.fillStyle = P.calm; ctx.fill(); ctx.stroke();
      ctx.fillStyle = P.calm; ctx.fillRect(-s * 0.09, s * 0.05, s * 0.18, s * 0.3);
      ctx.beginPath(); ctx.moveTo(s * 0.62, -s * 0.5); ctx.lineTo(s * 0.62, s * 0.15); ctx.moveTo(s * 0.42, -s * 0.05); ctx.lineTo(s * 0.62, s * 0.18); ctx.lineTo(s * 0.82, -s * 0.05); ctx.stroke();
    } else if (key === 'chain3') {
      for (var c = -1; c <= 1; c++) { ell(ctx, c * s * 0.55, 0, s * 0.36, s * 0.24, 0); ctx.stroke(); }
    } else if (key === 'multi3') {
      circle(ctx, -s * 0.6, 0, s * 0.22); ctx.fillStyle = W; ctx.fill();
      ctx.beginPath();
      var tg = [[s * 0.65, -s * 0.6], [s * 0.75, 0], [s * 0.65, s * 0.6]];
      for (var q = 0; q < 3; q++) { ctx.moveTo(-s * 0.4, 0); ctx.lineTo(tg[q][0] - s * 0.2, tg[q][1] * 0.85); }
      ctx.stroke();
      for (q = 0; q < 3; q++) { circle(ctx, tg[q][0], tg[q][1], s * 0.2); ctx.fillStyle = P.cue; ctx.fill(); }
    } else if (key === 'loose') {
      ctx.strokeStyle = '#c99a6a'; ctx.lineWidth = Math.max(2, s * 0.22);
      ctx.beginPath(); ctx.moveTo(-s * 0.9, -s * 0.3); ctx.lineTo(-s * 0.15, -s * 0.3); ctx.lineTo(-s * 0.05, -s * 0.6);
      ctx.moveTo(s * 0.9, -s * 0.3); ctx.lineTo(s * 0.2, -s * 0.3); ctx.lineTo(s * 0.1, 0);
      ctx.moveTo(-s * 0.9, s * 0.35); ctx.lineTo(-s * 0.1, s * 0.35); ctx.moveTo(s * 0.9, s * 0.35); ctx.lineTo(s * 0.25, s * 0.35); ctx.stroke();
      ctx.strokeStyle = P.danger; ctx.lineWidth = Math.max(2, s * 0.2);
      ctx.beginPath(); ctx.moveTo(0, -s * 0.95); ctx.lineTo(0, s * 0.05); ctx.stroke();
      circle(ctx, 0, s * 0.5, s * 0.12); ctx.fillStyle = P.danger; ctx.fill();
    } else {
      ctx.setLineDash([s * 0.3, s * 0.25]); rr(ctx, -s * 0.8, -s * 0.8, s * 1.6, s * 1.6, s * 0.2); ctx.globalAlpha *= 0.5; ctx.stroke();
    }
    ctx.restore();
  }
  function iconProg(ctx, key, x, y, s, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= (alpha == null ? 1 : alpha);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var W = '#fff6fb';
    ctx.strokeStyle = W; ctx.lineWidth = Math.max(1.5, s * 0.16);
    function arrow(x0, y0, x1, y1) {
      var a = Math.atan2(y1 - y0, x1 - x0), h = s * 0.3;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
      ctx.moveTo(x1 - Math.cos(a - 0.6) * h, y1 - Math.sin(a - 0.6) * h); ctx.lineTo(x1, y1); ctx.lineTo(x1 - Math.cos(a + 0.6) * h, y1 - Math.sin(a + 0.6) * h);
      ctx.stroke();
    }
    if (key === 'ice') {
      ctx.beginPath(); ctx.moveTo(-s * 0.7, -s * 0.55); ctx.lineTo(s * 0.7, -s * 0.55); ctx.lineTo(s * 0.5, s * 0.25); ctx.lineTo(-s * 0.5, s * 0.25); ctx.closePath();
      ctx.fillStyle = 'rgba(63,160,255,0.45)'; ctx.fill(); ctx.stroke();
      for (var d = -1; d <= 1; d++) { ell(ctx, d * s * 0.42, s * 0.68, s * 0.1, s * 0.18, 0); ctx.fillStyle = P.calm; ctx.fill(); }
    } else if (key === 'pep') {
      ctx.strokeStyle = P.ignite; ctx.lineWidth = Math.max(2, s * 0.24);
      arrow(0, s * 0.8, 0, -s * 0.75);
      ctx.strokeStyle = W; ctx.lineWidth = Math.max(1.5, s * 0.14);
      arrow(-s * 0.6, s * 0.6, -s * 0.6, -s * 0.15); arrow(s * 0.6, s * 0.6, s * 0.6, -s * 0.15);
    } else if (key === 'scatter') {
      circle(ctx, 0, 0, s * 0.16); ctx.fillStyle = W; ctx.fill();
      arrow(s * 0.25, 0, s * 0.9, 0); arrow(-s * 0.25, 0, -s * 0.9, 0); arrow(0, s * 0.25, 0, s * 0.9); arrow(0, -s * 0.25, 0, -s * 0.9);
    } else if (key === 'mob') {
      circle(ctx, 0, 0, s * 0.24); ctx.fillStyle = P.rageRed; ctx.fill();
      arrow(s * 0.95, 0, s * 0.42, 0); arrow(-s * 0.95, 0, -s * 0.42, 0); arrow(0, s * 0.95, 0, s * 0.42); arrow(0, -s * 0.95, 0, -s * 0.42);
    } else if (key === 'tutti') {
      ctx.fillStyle = W;
      ell(ctx, -s * 0.45, s * 0.5, s * 0.25, s * 0.18, -0.3); ctx.fill();
      ell(ctx, s * 0.45, s * 0.3, s * 0.25, s * 0.18, -0.3); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-s * 0.23, s * 0.45); ctx.lineTo(-s * 0.23, -s * 0.7); ctx.lineTo(s * 0.67, -s * 0.9); ctx.lineTo(s * 0.67, s * 0.25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * 0.23, -s * 0.4); ctx.lineTo(s * 0.67, -s * 0.6); ctx.stroke();
    } else if (key === 'lull') {
      ctx.beginPath(); ctx.arc(-s * 0.1, 0, s * 0.75, 0.6 * Math.PI, 1.9 * Math.PI, false);
      ctx.quadraticCurveTo(-s * 0.05, -s * 0.1, -s * 0.1 + Math.cos(0.6 * Math.PI) * s * 0.75, Math.sin(0.6 * Math.PI) * s * 0.75);
      ctx.fillStyle = 'rgba(63,160,255,0.55)'; ctx.fill(); ctx.stroke();
      circle(ctx, s * 0.6, -s * 0.55, s * 0.1); ctx.fillStyle = W; ctx.fill();
    } else if (key === 'spot') {
      ctx.beginPath(); ctx.moveTo(-s * 0.18, -s * 0.9); ctx.lineTo(s * 0.18, -s * 0.9); ctx.lineTo(s * 0.75, s * 0.6); ctx.lineTo(-s * 0.75, s * 0.6); ctx.closePath();
      ctx.fillStyle = 'rgba(255,230,140,0.45)'; ctx.fill();
      ell(ctx, 0, s * 0.62, s * 0.75, s * 0.2, 0); ctx.stroke();
      circle(ctx, 0, s * 0.3, s * 0.2); ctx.fillStyle = P.rageRed; ctx.fill();
    } else if (key === 'shuffle') {
      rr(ctx, -s * 0.75, -s * 0.45, s * 1.5, s * 1.2, s * 0.15); ctx.fillStyle = 'rgba(180,108,255,0.35)'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * 0.75, -s * 0.45); ctx.lineTo(-s * 0.5, -s * 0.85); ctx.lineTo(s * 0.5, -s * 0.85); ctx.lineTo(s * 0.75, -s * 0.45); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, s * 0.1, s * 0.28, -Math.PI, 0.2 * Math.PI); ctx.stroke();
      circle(ctx, 0, s * 0.5, s * 0.06); ctx.fillStyle = W; ctx.fill();
    } else if (key === 'clear') {
      ctx.strokeStyle = P.textDim; ctx.lineWidth = Math.max(2, s * 0.2);
      ctx.beginPath(); ctx.moveTo(-s * 0.55, -s * 0.55); ctx.lineTo(s * 0.55, s * 0.55); ctx.moveTo(s * 0.55, -s * 0.55); ctx.lineTo(-s * 0.55, s * 0.55); ctx.stroke();
    } else {
      ctx.setLineDash([s * 0.3, s * 0.25]); rr(ctx, -s * 0.8, -s * 0.8, s * 1.6, s * 1.6, s * 0.2); ctx.globalAlpha *= 0.5; ctx.stroke();
    }
    ctx.restore();
  }
  function iconWeapon(ctx, w, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 4); ctx.lineCap = 'round';
    paintWeapon(ctx, w, s / 26);
    ctx.restore();
  }
  // 武器: 握把在原點, 朝 +x; k = 縮放
  function paintWeapon(ctx, w, k) {
    ctx.save(); ctx.scale(k, k);
    ctx.lineCap = 'round'; ctx.strokeStyle = P.outline;
    if (w === 'sword') {
      ctx.fillStyle = '#e6eef8'; ctx.beginPath(); ctx.moveTo(-6, -2.5); ctx.lineTo(18, -2.5); ctx.lineTo(24, 0); ctx.lineTo(18, 2.5); ctx.lineTo(-6, 2.5); ctx.closePath(); ctx.fill(); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#c9a24a'; ctx.fillRect(-7, -6, 3, 12); ctx.fillRect(-14, -1.8, 7, 3.6);
    } else if (w === 'spear') {
      ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(18, 0); ctx.stroke();
      ctx.fillStyle = '#e6eef8'; ctx.beginPath(); ctx.moveTo(16, -4.5); ctx.lineTo(25, 0); ctx.lineTo(16, 4.5); ctx.closePath(); ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.2; ctx.stroke();
    } else if (w === 'whip') {
      ctx.strokeStyle = '#6a3a1a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(0, 0); ctx.stroke();
      ctx.strokeStyle = '#c47a3a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(10, -10, 16, 10, 24, -2); ctx.stroke();
    } else {
      ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(14, 0); ctx.stroke();
      circle(ctx, 18, 0, 6); ctx.fillStyle = '#a06a38'; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.2; ctx.stroke();
    }
    ctx.restore();
  }
  function heartPath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.85);
    ctx.bezierCurveTo(x - s * 1.1, y + s * 0.1, x - s * 0.95, y - s * 0.85, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.95, y - s * 0.85, x + s * 1.1, y + s * 0.1, x, y + s * 0.85);
    ctx.closePath();
  }
  function starPath(ctx, x, y, r) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rad = (i % 2 === 0) ? r : r * 0.45;
      if (i === 0) ctx.moveTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); else ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath();
  }
  function ropeIcon(ctx, x, y, s, on) {
    ctx.save(); ctx.strokeStyle = on ? P.rope : 'rgba(240,226,184,0.25)'; ctx.lineWidth = Math.max(1.5, s * 0.22);
    ell(ctx, x, y, s * 0.8, s * 0.55, 0); ctx.stroke(); ell(ctx, x, y, s * 0.45, s * 0.3, 0); ctx.stroke();
    ctx.restore();
  }
  function coinIcon(ctx, x, y, r) {
    circle(ctx, x, y, r); ctx.fillStyle = P.gold; ctx.fill(); ctx.strokeStyle = '#8a5a10'; ctx.lineWidth = Math.max(1, r * 0.2); ctx.stroke();
    ctx.fillStyle = '#fff2a0'; ctx.fillRect(x - r * 0.15, y - r * 0.5, r * 0.3, r);
  }
  function repIcon(ctx, x, y, r) {
    starPath(ctx, x, y, r); ctx.fillStyle = P.rep; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = Math.max(1, r * 0.15); ctx.stroke();
  }
  function effectPill(ctx, eff, x, y, w, h) {
    var e = EFFECT[effKey(eff)];
    if (!e) return;
    rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = e.color; ctx.fill();
    ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5; ctx.stroke();
    T(ctx, e.label, x, y + 1, { size: Math.round(h * 0.62), color: '#ffffff', strokeW: 2.5 });
  }
  function selectFrame(ctx, x, y, w, h, r) {
    ctx.save();
    ctx.shadowColor = 'rgba(255,210,74,0.7)'; ctx.shadowBlur = 10;
    rr(ctx, x + 2, y + 2, w - 4, h - 4, r); ctx.strokeStyle = P.select; ctx.lineWidth = 4; ctx.stroke();
    ctx.restore();
  }
  function panel(ctx, x, y, w, h, r, fill, stroke) {
    rr(ctx, x, y, w, h, r); ctx.fillStyle = fill || P.panel; ctx.fill();
    ctx.strokeStyle = stroke || P.line; ctx.lineWidth = 2; ctx.stroke();
  }

  // ───────────── 怒氣條 / 標記 ─────────────
  function rageBar(ctx, cx, cy, rage, redLow) {
    var w = 60, h = 8, x = cx - w / 2, y = cy - h / 2;
    rage = clamp(N(rage, 0), 0, 100); redLow = clamp(N(redLow, 80), 0, 100);
    ctx.fillStyle = '#0a0d14'; ctx.fillRect(x, y, w, h);
    // 紅區底(暗紅) — 規則區常駐可見
    ctx.fillStyle = 'rgba(255,59,74,0.32)'; ctx.fillRect(x + w * redLow / 100, y, w * (1 - redLow / 100), h);
    var col = rage >= redLow ? P.rageRed : (rage >= 50 ? P.rageMid : P.rageLow);
    ctx.fillStyle = col; ctx.fillRect(x + 1, y + 1, Math.max(0, (w - 2) * rage / 100), h - 2);
    // 50 門檻刻度(白)、紅區下限刻度(紅, 往上下突出)
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x + w * 0.5 - 0.75, y, 1.5, h);
    ctx.fillStyle = P.rageRed; ctx.fillRect(x + w * redLow / 100 - 1, y - 2, 2, h + 4);
    ctx.strokeStyle = rage >= redLow ? '#ffd0d4' : 'rgba(230,236,248,0.7)'; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  function markRow(ctx, cx, cy, marks, markLeft, markDur) {
    marks = clamp(Math.floor(N(marks, 0)), 0, 4);
    if (marks <= 0) return;
    var x0 = cx - (marks - 1) * 11 / 2;
    for (var i = 0; i < marks; i++) {
      circle(ctx, x0 + i * 11, cy, 4); ctx.fillStyle = P.ignite; ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2; ctx.stroke();
    }
    // 最右那顆: 距離自動 −1 的剩餘(深色扇形吃掉的部分 = 已過)
    var f = p01(markLeft, markDur);
    var lx = x0 + (marks - 1) * 11;
    if (N(markDur, 0) > 0 && f < 1) {
      ctx.beginPath(); ctx.moveTo(lx, cy); ctx.arc(lx, cy, 3.2, -Math.PI / 2 + TAU * f, -Math.PI / 2 + TAU, false); ctx.closePath();
      ctx.fillStyle = 'rgba(10,13,20,0.75)'; ctx.fill();
    }
  }

  // ───────────── 背景 ─────────────
  function drawBackground(ctx) {
    ctx.save();
    var g = ctx.createLinearGradient(0, 0, 0, 720);
    g.addColorStop(0, '#1a2030'); g.addColorStop(1, '#10131b');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
    ctx.globalAlpha = 0.06; ctx.strokeStyle = '#8fa0c8'; ctx.lineWidth = 1;
    for (var i = 0; i <= 1280; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - 200, 720); ctx.stroke(); }
    ctx.restore();
  }

  // ───────────── 地下城: 地格 ─────────────
  var TILE_THEME = {
    lake: { floor: '#2a4436', floor2: '#30503f', wall: '#5d6f80', wallTop: '#8296aa', wallDark: '#3c4a58', pillar: '#7a8da0' },
    tower: { floor: '#3a3226', floor2: '#433a2c', wall: '#7a5236', wallTop: '#a0704a', wallDark: '#4e3422', pillar: '#6c7480' },
    snow: { floor: '#34465c', floor2: '#3c5068', wall: '#9fbdd6', wallTop: '#dceeff', wallDark: '#6a88a4', pillar: '#b8d4ea' }
  };
  function paintFloor(ctx, d, h) {
    var th = TILE_THEME[d];
    ctx.fillStyle = th.floor; ctx.fillRect(-h, -h, 2 * h, 2 * h);
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1; ctx.strokeRect(-h + 0.5, -h + 0.5, 2 * h - 1, 2 * h - 1);
    ctx.fillStyle = th.floor2;
    if (d === 'lake') { ell(ctx, -h * 0.4, h * 0.3, h * 0.12, h * 0.05, 0); ctx.fill(); ell(ctx, h * 0.35, -h * 0.4, h * 0.1, h * 0.05, 0); ctx.fill(); }
    else if (d === 'tower') { ctx.fillRect(-h + 1, -1, 2 * h - 2, 2); circle(ctx, -h * 0.75, -h * 0.75, h * 0.06); ctx.fill(); circle(ctx, h * 0.75, h * 0.75, h * 0.06); ctx.fill(); }
    else { circle(ctx, -h * 0.4, -h * 0.3, h * 0.05); ctx.fill(); circle(ctx, h * 0.45, h * 0.35, h * 0.04); ctx.fill(); }
  }
  function paintWall(ctx, d, h) {
    var th = TILE_THEME[d];
    ctx.fillStyle = th.wallDark; ctx.fillRect(-h, -h, 2 * h, 2 * h);
    ctx.fillStyle = th.wall; ctx.fillRect(-h, -h, 2 * h, 2 * h * 0.8);
    ctx.fillStyle = th.wallTop; ctx.fillRect(-h, -h, 2 * h, h * 0.18);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-h, -h * 0.2); ctx.lineTo(h, -h * 0.2); ctx.moveTo(0, -h * 0.82); ctx.lineTo(0, -h * 0.2); ctx.moveTo(-h * 0.5, -h * 0.2); ctx.lineTo(-h * 0.5, h * 0.6); ctx.moveTo(h * 0.5, -h * 0.2); ctx.lineTo(h * 0.5, h * 0.6); ctx.stroke();
  }
  function paintTile(ctx, d, kind, nest, h) {
    var th = TILE_THEME[d];
    if (kind === 'wall') { paintWall(ctx, d, h); }
    else if (kind === 'pillar') {
      paintFloor(ctx, d, h);
      ell(ctx, 0, h * 0.62, h * 0.7, h * 0.2, 0); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      rr(ctx, -h * 0.62, -h * 0.75, h * 1.24, h * 1.4, h * 0.3); ctx.fillStyle = th.pillar; ctx.fill();
      ctx.strokeStyle = P.outline; ctx.lineWidth = 2; ctx.stroke();
      ell(ctx, 0, -h * 0.62, h * 0.62, h * 0.2, 0); ctx.fillStyle = th.wallTop; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-h * 0.42, -h * 0.4, h * 0.16, h * 0.9);
    } else if (kind === 'hurt') {
      // 傷害地形: 三關共用 = 暗紅底 + 紅框; 外形依主題(鐘塔 齒輪刃 / 雪境 冰刺 / 其他 尖刺)
      ctx.fillStyle = '#3a1418'; ctx.fillRect(-h, -h, 2 * h, 2 * h);
      if (d === 'tower') {
        ctx.save(); var rot = (now() / 1000) * 3; ctx.rotate(rot);
        ctx.beginPath();
        for (var i = 0; i < 16; i++) { var a = i * TAU / 16; var r1 = h * 0.78, r2 = h * 0.58; ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.lineTo(Math.cos(a + TAU / 32) * r2, Math.sin(a + TAU / 32) * r2); }
        ctx.closePath(); ctx.fillStyle = '#c9ced6'; ctx.fill(); ctx.strokeStyle = P.danger; ctx.lineWidth = 2; ctx.stroke();
        circle(ctx, 0, 0, h * 0.18); ctx.fillStyle = '#5a1a20'; ctx.fill();
        ctx.restore();
      } else {
        var col = d === 'snow' ? '#d8f2ff' : '#d0d4dc';
        for (var r = 0; r < 2; r++) for (var c = 0; c < 3; c++) {
          var bx = -h * 0.66 + c * h * 0.66, by = -h * 0.2 + r * h * 0.8 - h * 0.15;
          ctx.beginPath(); ctx.moveTo(bx - h * 0.24, by + h * 0.25); ctx.lineTo(bx, by - h * 0.38); ctx.lineTo(bx + h * 0.24, by + h * 0.25); ctx.closePath();
          ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = P.danger; ctx.lineWidth = 1.5; ctx.stroke();
        }
      }
      ctx.strokeStyle = P.danger; ctx.lineWidth = 3; ctx.strokeRect(-h + 1.5, -h + 1.5, 2 * h - 3, 2 * h - 3);
    } else if (kind === 'slow') {
      // 減速地形: 三關共用 = 波浪紋; 底色依主題(淺灘 / 機油 / 雪堆)
      var base = d === 'tower' ? '#1e1a24' : (d === 'snow' ? '#c8d8e8' : '#3d7fa6');
      var wave = d === 'tower' ? 'rgba(180,120,255,0.55)' : (d === 'snow' ? 'rgba(90,120,160,0.6)' : 'rgba(200,240,255,0.6)');
      ctx.fillStyle = base; ctx.fillRect(-h, -h, 2 * h, 2 * h);
      if (d === 'snow') { ctx.fillStyle = '#eef6ff'; ell(ctx, -h * 0.35, h * 0.1, h * 0.45, h * 0.3, 0); ctx.fill(); ell(ctx, h * 0.4, -h * 0.25, h * 0.4, h * 0.26, 0); ctx.fill(); }
      ctx.strokeStyle = wave; ctx.lineWidth = 2;
      for (var k = 0; k < 3; k++) {
        var yy = -h * 0.6 + k * h * 0.6;
        ctx.beginPath(); ctx.moveTo(-h * 0.85, yy);
        for (var xx = -h * 0.85; xx <= h * 0.85; xx += h * 0.34) ctx.quadraticCurveTo(xx + h * 0.085, yy - h * 0.12, xx + h * 0.17, yy), ctx.quadraticCurveTo(xx + h * 0.255, yy + h * 0.12, xx + h * 0.34, yy);
        ctx.stroke();
      }
    } else {
      paintFloor(ctx, d, h);
    }
    if (nest && kind !== 'wall' && kind !== 'pillar') {
      ctx.save(); ctx.setLineDash([4, 3]); ell(ctx, 0, h * 0.2, h * 0.7, h * 0.42, 0);
      ctx.strokeStyle = 'rgba(232,206,150,0.75)'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      ctx.fillStyle = 'rgba(232,206,150,0.55)';
      ell(ctx, -h * 0.15, h * 0.2, h * 0.12, h * 0.15, 0); ctx.fill(); ell(ctx, h * 0.18, h * 0.24, h * 0.11, h * 0.14, 0); ctx.fill();
    }
  }
  function drawTile(ctx, s) {
    var d = dunKey(s.dungeon), kind = S(s.kind, 'floor');
    if (['wall', 'pillar', 'floor', 'hurt', 'slow'].indexOf(kind) < 0) kind = 'floor';
    ctx.translate(N(s.x, 0), N(s.y, 0));
    paintTile(ctx, d, kind, B(s.nest), 30);
  }

  function paintPortal(ctx, d, id, charge, cooling, h) {
    paintFloor(ctx, d, h);
    var col = id === 2 ? P.portal2 : P.portal1;
    ctx.globalAlpha = cooling ? 0.4 : 1;
    // 外圈: 1 號 = 圓環, 2 號 = 菱形環(形狀 + 顏色兩通道)
    ctx.lineWidth = 4; ctx.strokeStyle = cooling ? '#8090a8' : col;
    if (cooling) ctx.setLineDash([5, 4]);
    if (id === 2) { ctx.beginPath(); ctx.moveTo(0, -h * 0.9); ctx.lineTo(h * 0.9, 0); ctx.lineTo(0, h * 0.9); ctx.lineTo(-h * 0.9, 0); ctx.closePath(); }
    else circle(ctx, 0, 0, h * 0.78);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill(); ctx.stroke();
    ctx.setLineDash([]);
    // 啟動進度: 由中心長大的亮面, 填滿 = 傳送
    var c = clamp(N(charge, 0), 0, 1);
    if (c > 0 && !cooling) {
      ctx.fillStyle = col; ctx.globalAlpha = 0.55;
      if (id === 2) { var r2 = h * 0.85 * c; ctx.beginPath(); ctx.moveTo(0, -r2); ctx.lineTo(r2, 0); ctx.lineTo(0, r2); ctx.lineTo(-r2, 0); ctx.closePath(); ctx.fill(); }
      else { circle(ctx, 0, 0, h * 0.74 * c); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    // 點數: 1 點 / 2 點
    ctx.fillStyle = cooling ? '#8090a8' : '#ffffff';
    if (id === 2) { circle(ctx, -h * 0.2, 0, h * 0.12); ctx.fill(); circle(ctx, h * 0.2, 0, h * 0.12); ctx.fill(); }
    else { circle(ctx, 0, 0, h * 0.14); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  function drawPortal(ctx, s) {
    ctx.translate(N(s.x, 0), N(s.y, 0));
    paintPortal(ctx, dunKey(s.dungeon), N(s.id, 1) === 2 ? 2 : 1, s.charge, B(s.cooling), 30);
  }

  function paintCrack(ctx, d, cracks, h) {
    var th = TILE_THEME[d];
    // 打得破的牆: 比一般牆暖、亮一階的砌磚紋 + 金色虛線框(= 你能打的東西)
    ctx.fillStyle = th.wallDark; ctx.fillRect(-h, -h, 2 * h, 2 * h);
    ctx.fillStyle = '#9a8468'; ctx.fillRect(-h, -h, 2 * h, 2 * h * 0.8);
    ctx.fillStyle = '#c4ad8a'; ctx.fillRect(-h, -h, 2 * h, h * 0.18);
    ctx.strokeStyle = 'rgba(40,28,16,0.7)'; ctx.lineWidth = 1.5;
    for (var r = 0; r < 4; r++) {
      var yy = -h * 0.82 + r * h * 0.4;
      ctx.beginPath(); ctx.moveTo(-h, yy); ctx.lineTo(h, yy); ctx.stroke();
      for (var c = 0; c < 3; c++) { var xx = -h + (c + (r % 2 ? 0.5 : 0)) * h * 0.7; ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + h * 0.4); ctx.stroke(); }
    }
    ctx.save(); ctx.setLineDash([6, 4]); ctx.strokeStyle = 'rgba(255,210,74,0.75)'; ctx.lineWidth = 2;
    ctx.strokeRect(-h + 2, -h + 2, 2 * h - 4, 2 * h - 4); ctx.restore();
    cracks = clamp(Math.floor(N(cracks, 0)), 0, 2);
    ctx.strokeStyle = '#1a1008'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (cracks === 0) {
      ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.moveTo(-h * 0.1, -h * 0.5); ctx.lineTo(h * 0.05, -h * 0.2); ctx.lineTo(-h * 0.05, 0); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (cracks >= 1) {
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(-h * 0.2, -h * 0.85); ctx.lineTo(h * 0.1, -h * 0.4); ctx.lineTo(-h * 0.15, -h * 0.05); ctx.lineTo(h * 0.2, h * 0.35); ctx.lineTo(0, h * 0.75); ctx.stroke();
    }
    if (cracks >= 2) {
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(-h * 0.85, -h * 0.1); ctx.lineTo(-h * 0.4, h * 0.05); ctx.lineTo(-h * 0.15, -h * 0.05); ctx.lineTo(h * 0.4, -h * 0.3); ctx.lineTo(h * 0.85, -h * 0.15); ctx.stroke();
      ctx.fillStyle = '#1a1008';
      ctx.beginPath(); ctx.moveTo(-h * 0.15, -h * 0.05); ctx.lineTo(h * 0.12, -h * 0.25); ctx.lineTo(h * 0.15, h * 0.1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c4ad8a'; ctx.fillRect(h * 0.4, h * 0.65, h * 0.14, h * 0.14); ctx.fillRect(-h * 0.5, h * 0.7, h * 0.1, h * 0.1);
    }
  }
  function drawCrackWall(ctx, s) {
    ctx.translate(N(s.x, 0), N(s.y, 0));
    paintCrack(ctx, dunKey(s.dungeon), s.cracks, 30);
  }

  // ───────────── 馴獸師 ─────────────
  function paintTamer(ctx, s) {
    var f = clamp(Math.floor(N(s.facing, 0)), 0, 7);
    if (!isFinite(f)) f = 0;
    var ang = -Math.PI / 2 + f * Math.PI / 4;
    var wp = wpKey(s.weapon);
    if (B(s.blink) && Math.floor(now() / 100) % 2 === 0) ctx.globalAlpha *= 0.3;
    ell(ctx, 0, 14, 16, 5, 0); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    if (B(s.dashing)) {
      for (var i = 2; i >= 1; i--) {
        ctx.save(); ctx.globalAlpha *= 0.22 * (3 - i);
        circle(ctx, -Math.cos(ang) * 6 * i, -Math.sin(ang) * 6 * i, 18); ctx.fillStyle = '#bff4ff'; ctx.fill(); ctx.restore();
      }
    }
    ctx.save(); ctx.rotate(ang);
    ctx.save(); ctx.translate(6, 11); paintWeapon(ctx, wp, 1.0); ctx.restore();
    ctx.restore();
    circle(ctx, 0, 0, 18); ctx.fillStyle = P.tamer; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 2; ctx.stroke();
    // 披肩(白)讓身體方向可辨
    ctx.save(); ctx.rotate(ang);
    ctx.beginPath(); ctx.arc(0, 0, 17, Math.PI * 0.6, Math.PI * 1.4); ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    circle(ctx, 3, 0, 10); ctx.fillStyle = '#f4d2a8'; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5; ctx.stroke();
    circle(ctx, -1, 0, 8.5); ctx.fillStyle = '#6a3e22'; ctx.fill();
    circle(ctx, 11, 0, 2.2); ctx.fillStyle = P.outline; ctx.fill();
    if (B(s.lassoing)) { ctx.strokeStyle = P.capture; ctx.lineWidth = 2; ell(ctx, -8, -11, 5, 3.5, 0); ctx.stroke(); }
    ctx.restore();
    if (B(s.dashing)) { circle(ctx, 0, 0, 21); ctx.strokeStyle = '#bff4ff'; ctx.lineWidth = 2.5; ctx.stroke(); }
    if (B(s.slowed)) {
      ctx.save(); ctx.setLineDash([4, 3]); circle(ctx, 0, 0, 24); ctx.strokeStyle = P.ice; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.8;
      for (var k = 0; k < 3; k++) { var a = k * Math.PI / 3; ctx.beginPath(); ctx.moveTo(20 + Math.cos(a) * 6, -20 + Math.sin(a) * 6); ctx.lineTo(20 - Math.cos(a) * 6, -20 - Math.sin(a) * 6); ctx.stroke(); }
    }
  }
  function drawTamer(ctx, s) { ctx.translate(N(s.x, 0), N(s.y, 0)); paintTamer(ctx, s); }

  // ───────────── 野生魔物 ─────────────
  function brokenHeart(ctx, x, y, s) {
    heartPath(ctx, x, y, s); ctx.fillStyle = P.capture; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - s * 0.35); ctx.lineTo(x - s * 0.25, y); ctx.lineTo(x + s * 0.2, y + s * 0.25); ctx.lineTo(x, y + s * 0.8);
    ctx.strokeStyle = P.outline; ctx.lineWidth = 1.6; ctx.stroke();
  }
  function stunStars(ctx, y, rx, R) {
    var t = now() / 1000;
    for (var i = 0; i < 3; i++) {
      var a = t * 4 + i * TAU / 3;
      starPath(ctx, Math.cos(a) * rx, y + Math.sin(a) * 3, R);
      ctx.fillStyle = '#fff07a'; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1; ctx.stroke();
    }
  }
  function moveOffset(move, moveT, moveDur) {
    var p = p01(moveT, moveDur);
    var o = { dy: 0, alpha: 1, lean: 0, swoop: false };
    if (move === 'hop') o.dy = -Math.sin(Math.PI * p) * 5;
    else if (move === 'swoop') { o.lean = 0.25; o.swoop = true; }
    else if (move === 'fadeOut') o.alpha = 1 - 0.8 * p;
    else if (move === 'fadeIn') o.alpha = 0.2 + 0.8 * p;
    return o;
  }
  function paintWild(ctx, s, R, half) {
    var sp = spKey(s.species), dir = N(s.dir, 1) === -1 ? -1 : 1;
    var mv = moveOffset(S(s.move, 'walk'), s.moveT, s.moveDur);
    var stunned = N(s.stunLeft, 0) > 0 || B(s.lassoed);
    var weak = B(s.weak);
    ell(ctx, 0, R * 0.95, R * 0.8, R * 0.2, 0); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    ctx.save();
    ctx.globalAlpha *= mv.alpha;
    ctx.translate(0, mv.dy);
    if (mv.swoop) {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
      for (var i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-dir * R * 0.9, i * 8); ctx.lineTo(-dir * R * 1.25, i * 8); ctx.stroke(); }
      ctx.rotate(dir * mv.lean);
    }
    // 施法預備: 紅橘虛線環(會打到你的東西 = 危險)
    if (B(s.casting) && !stunned) {
      var pulse = 0.6 + 0.4 * Math.sin(now() / 80);
      ctx.save(); ctx.setLineDash([6, 4]); circle(ctx, 0, 0, R + 6); ctx.strokeStyle = 'rgba(255,90,60,' + pulse.toFixed(2) + ')'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    }
    var em = stunned ? 'dizzy' : (weak ? 'weak' : (B(s.casting) ? 'angry' : 'normal'));
    paintSpecies(ctx, sp, R, { dir: dir, eyes: em });
    if (weak) { // 殘血: 本體蒙一層灰 + 破心(捕捉色)
      ctx.save(); ctx.globalAlpha *= 0.28; paintSpecies(ctx, sp, R, { dir: dir, flat: '#8a90a0' }); ctx.restore();
    }
    if (B(s.hit)) { ctx.save(); ctx.globalAlpha *= 0.85; paintSpecies(ctx, sp, R, { dir: dir, flat: '#ffffff' }); ctx.restore(); }
    if (mv.alpha < 0.65) { ctx.save(); ctx.setLineDash([3, 3]); circle(ctx, 0, 0, R); ctx.strokeStyle = 'rgba(200,170,255,0.9)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); }
    if (B(s.lassoed)) { ell(ctx, 0, R * 0.2, R * 1.05, R * 0.45, 0); ctx.strokeStyle = P.rope; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.restore();
    if (weak) brokenHeart(ctx, R * 0.72, -R * 0.62, 7);
    if (stunned) stunStars(ctx, -R - 3, R * 0.6, 4);
  }
  function hpBar(ctx, cx, cy, hp, maxHp, weak) {
    var w = 56, h = 6, x = cx - w / 2, y = cy - h / 2;
    maxHp = Math.max(1, N(maxHp, 1)); hp = clamp(N(hp, 0), 0, maxHp);
    ctx.fillStyle = '#0a0d14'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = weak ? P.capture : '#e05a5a';
    ctx.fillRect(x + 1, y + 1, (w - 2) * hp / maxHp, h - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x + w * 0.3 - 0.5, y, 1, h);
    ctx.strokeStyle = weak ? P.capture : 'rgba(230,236,248,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  function drawWildMonster(ctx, s) {
    var sp = spKey(s.species), isT = sp === 'tanuki';
    var R = isT ? 27 : 26, half = isT ? 45 : 36;
    var x = N(s.x, 0), y = N(s.y, 0);
    ctx.save(); ctx.translate(x, y); paintWild(ctx, s, R, half); ctx.restore();
    var mv = moveOffset(S(s.move, 'walk'), s.moveT, s.moveDur);
    ctx.globalAlpha *= Math.max(0.4, mv.alpha);
    hpBar(ctx, x, y - (isT ? 55 : 46), s.hp, s.maxHp, B(s.weak));
  }

  // ───────────── 捕捉圈 / 套索 ─────────────
  function drawCaptureRing(ctx, s) {
    var x = N(s.x, 0), y = N(s.y, 0), p = p01(s.t, s.dur);
    ctx.translate(x, y);
    circle(ctx, 0, 0, 40); ctx.strokeStyle = 'rgba(10,13,20,0.8)'; ctx.lineWidth = 7; ctx.stroke();
    circle(ctx, 0, 0, 40); ctx.strokeStyle = 'rgba(198,240,70,0.25)'; ctx.lineWidth = 5; ctx.stroke();
    if (p > 0) { ctx.beginPath(); ctx.arc(0, 0, 40, -Math.PI / 2, -Math.PI / 2 + TAU * p); ctx.strokeStyle = P.capture; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke(); }
    T(ctx, '準備捕捉', 0, -47, { size: 14, color: P.capture });
  }
  function drawLasso(ctx, s) {
    var x1 = N(s.x1, 0), y1 = N(s.y1, 0), x2 = N(s.x2, 0), y2 = N(s.y2, 0);
    var prog = clamp(N(s.progress, 0), 0, 1);
    var tension = p01(s.len, s.maxLen);
    var timeLeft = 1 - p01(s.t, s.limit);
    // 繩: 越接近最大長度越紅、越細、越直(要斷了)
    var taut = tension > 0.75;
    var col = taut ? (tension > 0.9 ? P.danger : '#ffa040') : P.rope;
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + (1 - tension) * 22;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.strokeStyle = 'rgba(10,13,20,0.8)'; ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.strokeStyle = col; ctx.lineWidth = taut ? 2.5 : 3.5;
    if (tension > 0.9) ctx.setLineDash([6, 4]);
    ctx.stroke(); ctx.setLineDash([]);
    // 繞圈進度環(捕捉色)
    circle(ctx, x2, y2, 42); ctx.strokeStyle = 'rgba(10,13,20,0.8)'; ctx.lineWidth = 8; ctx.stroke();
    circle(ctx, x2, y2, 42); ctx.strokeStyle = 'rgba(198,240,70,0.22)'; ctx.lineWidth = 6; ctx.stroke();
    if (prog > 0) { ctx.beginPath(); ctx.arc(x2, y2, 42, -Math.PI / 2, -Math.PI / 2 + TAU * prog); ctx.strokeStyle = P.capture; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineCap = 'butt'; }
    // 時限: 外圈細白環, 剩餘越少越短; 最後 30% 轉紅
    ctx.beginPath(); ctx.arc(x2, y2, 49, -Math.PI / 2, -Math.PI / 2 + TAU * timeLeft);
    ctx.strokeStyle = timeLeft < 0.3 ? P.danger : 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5; ctx.stroke();
  }

  // ───────────── 技能(危險物) ─────────────
  var HZ_HALO = { pollen: P.calm, match: P.ignite, gear: P.ignite, feather: P.special, card: P.special, icebeam: P.special };
  function drawHazard(ctx, s) {
    var kind = S(s.kind, 'pollen'); if (!HZ_HALO[kind]) kind = 'pollen';
    var x = N(s.x, 0), y = N(s.y, 0), ang = N(s.angle, 0), t = N(s.t, 0);
    var phase = S(s.phase, kind === 'icebeam' ? 'warn' : 'fly');
    var p = p01(s.t, s.dur);
    if (kind === 'icebeam') {
      var L = Math.max(0, N(s.length, 460)) || 460, W = Math.max(0, N(s.width, 36)) || 36;
      ctx.translate(x, y); ctx.rotate(ang);
      if (phase === 'active') {
        ctx.globalAlpha *= 1 - 0.7 * p;
        ctx.fillStyle = 'rgba(190,234,255,0.85)'; ctx.fillRect(0, -W / 2, L, W);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, -W * 0.15, L, W * 0.3);
        ctx.strokeStyle = P.special; ctx.lineWidth = 3; ctx.strokeRect(1.5, -W / 2 + 1.5, L - 3, W - 3);
      } else {
        // 預警: 虛線框 + 由施放者往外長的填色, 填滿 = 生效
        ctx.fillStyle = 'rgba(180,108,255,0.14)'; ctx.fillRect(0, -W / 2, L, W);
        ctx.fillStyle = 'rgba(191,234,255,0.38)'; ctx.fillRect(0, -W / 2, L * p, W);
        ctx.save(); ctx.setLineDash([10, 6]); ctx.strokeStyle = P.special; ctx.lineWidth = 2.5; ctx.strokeRect(1.25, -W / 2 + 1.25, L - 2.5, W - 2.5); ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L, 0); ctx.stroke();
      }
      return;
    }
    var def = { pollen: 12, match: 14, gear: 10, feather: 12, card: 12 }[kind];
    var r = Math.max(2, N(s.radius, def) || def);
    var refl = B(s.reflected);
    ctx.translate(x, y);
    // 判定圓 = 畫面邊界: 深色底 + 效果色環(打回去的改馴獸師金)
    circle(ctx, 0, 0, r); ctx.fillStyle = 'rgba(10,13,20,0.55)'; ctx.fill();
    circle(ctx, 0, 0, r - 1.5); ctx.strokeStyle = refl ? P.tamer : HZ_HALO[kind]; ctx.lineWidth = refl ? 3 : 2.5; ctx.stroke();
    var spin = t * 10;
    var ri = r * 0.78;
    if (kind === 'pollen') {
      for (var i = 0; i < 5; i++) { var a = spin * 0.3 + i * TAU / 5; circle(ctx, Math.cos(a) * ri * 0.45, Math.sin(a) * ri * 0.45, ri * 0.4); ctx.fillStyle = refl ? '#fff4c0' : '#f4fbff'; ctx.fill(); }
      circle(ctx, 0, 0, ri * 0.35); ctx.fillStyle = '#ffe14a'; ctx.fill();
    } else if (kind === 'match') {
      ctx.save(); ctx.rotate(spin);
      ctx.fillStyle = '#e8d3a0'; ctx.fillRect(-ri * 0.9, -ri * 0.14, ri * 1.5, ri * 0.28);
      circle(ctx, ri * 0.62, 0, ri * 0.32); ctx.fillStyle = '#ff4a2a'; ctx.fill();
      circle(ctx, ri * 0.66, 0, ri * 0.15); ctx.fillStyle = '#ffe14a'; ctx.fill();
      ctx.restore();
      if (B(s.returning) && !refl) { ctx.save(); ctx.setLineDash([3, 3]); circle(ctx, 0, 0, r - 4.5); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); }
    } else if (kind === 'gear') {
      ctx.save(); ctx.rotate(spin);
      ctx.beginPath();
      for (var k = 0; k < 16; k++) { var a0 = k * TAU / 16, rr0 = (k % 2 === 0) ? ri : ri * 0.72; ctx.lineTo(Math.cos(a0) * rr0, Math.sin(a0) * rr0); ctx.lineTo(Math.cos(a0 + TAU / 16) * rr0, Math.sin(a0 + TAU / 16) * rr0); }
      ctx.closePath(); ctx.fillStyle = refl ? '#fff4c0' : '#9fe8de'; ctx.fill();
      circle(ctx, 0, 0, ri * 0.28); ctx.fillStyle = '#203a3a'; ctx.fill();
      ctx.restore();
    } else if (kind === 'feather') {
      ctx.save(); ctx.rotate(ang);
      ell(ctx, 0, 0, ri, ri * 0.38, 0); ctx.fillStyle = refl ? '#fff4c0' : P.parrot; ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-ri, 0); ctx.lineTo(ri * 0.8, 0); ctx.stroke();
      ctx.restore();
    } else { // card
      ctx.save(); ctx.rotate(spin * 0.8);
      rr(ctx, -ri * 0.55, -ri * 0.8, ri * 1.1, ri * 1.6, 2); ctx.fillStyle = refl ? '#fff4c0' : '#ffffff'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -ri * 0.42); ctx.lineTo(ri * 0.3, 0); ctx.lineTo(0, ri * 0.42); ctx.lineTo(-ri * 0.3, 0); ctx.closePath(); ctx.fillStyle = P.special; ctx.fill();
      ctx.restore();
    }
  }

  // ───────────── 武器特效(馴獸師造成的 = 金白) ─────────────
  function drawWeaponFx(ctx, s) {
    var x = N(s.x, 0), y = N(s.y, 0), ang = N(s.angle, 0);
    var p = p01(s.t, s.dur);
    var skill = S(s.move, 'normal') === 'skill';
    var shape = S(s.shape, 'arc');
    var col = skill ? 'rgba(255,207,63,' : 'rgba(255,246,220,';
    var alpha = 1 - p * p;
    ctx.translate(x, y);
    ctx.globalAlpha *= alpha;
    var r = Math.max(1, N(s.radius, 70));
    if (shape === 'circle') {
      circle(ctx, 0, 0, r); ctx.fillStyle = col + '0.18)'; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, r - 2, ang, ang + TAU * Math.min(1, p * 1.6 + 0.2)); ctx.strokeStyle = col + '1)'; ctx.lineWidth = skill ? 6 : 4; ctx.stroke();
    } else if (shape === 'line') {
      var L = Math.max(1, N(s.length, 170)), W = Math.max(1, N(s.width, 40));
      ctx.rotate(ang);
      ctx.fillStyle = col + '0.22)'; ctx.fillRect(0, -W / 2, L, W);
      var reach = L * Math.min(1, 0.3 + p * 1.6);
      ctx.fillStyle = col + '1)'; ctx.fillRect(0, -3, reach, 6);
      ctx.beginPath(); ctx.moveTo(reach, -W / 2 + 2); ctx.lineTo(reach, W / 2 - 2); ctx.strokeStyle = col + '1)'; ctx.lineWidth = 3; ctx.stroke();
    } else if (shape === 'dash') {
      var L2 = Math.max(1, N(s.length, 220));
      ctx.rotate(ang);
      for (var i = 0; i < 5; i++) { var w = 30 - i * 4; ctx.fillStyle = 'rgba(191,244,255,' + (0.35 - i * 0.06).toFixed(2) + ')'; ctx.fillRect(L2 * i / 5, -w / 2, L2 / 5, w); }
      ctx.strokeStyle = col + '1)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(L2, -12); ctx.moveTo(0, 12); ctx.lineTo(L2, 12); ctx.stroke();
    } else { // arc
      var sp = clamp(N(s.spread, Math.PI / 2), 0.05, TAU);
      var a0 = ang - sp / 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, a0, a0 + sp); ctx.closePath();
      ctx.fillStyle = col + '0.2)'; ctx.fill();
      var sweep = sp * Math.min(1, 0.25 + p * 1.8);
      ctx.beginPath(); ctx.arc(0, 0, r - (skill ? 3 : 2), a0, a0 + sweep); ctx.strokeStyle = col + '1)'; ctx.lineWidth = skill ? 6 : 4; ctx.lineCap = 'round'; ctx.stroke();
      if (skill) { ctx.beginPath(); ctx.arc(0, 0, r * 0.7, a0, a0 + sweep); ctx.lineWidth = 3; ctx.stroke(); }
    }
  }

  // ───────────── 地下城選擇卡 ─────────────
  function drawDungeonCard(ctx, s) {
    var d = dunKey(s.dungeon), info = DUN[d], open = B(s.open);
    ctx.translate(N(s.x, 0), N(s.y, 0));
    panel(ctx, -180, -220, 360, 440, 16, open ? P.panel : '#1b2030', open ? P.line : '#353d52');
    ctx.save(); rr(ctx, -178, -218, 356, 70, 14); ctx.clip();
    ctx.fillStyle = info.color; ctx.globalAlpha = open ? 0.9 : 0.3; ctx.fillRect(-180, -220, 360, 72); ctx.restore();
    T(ctx, info.name, 0, -184, { size: 32, color: open ? '#ffffff' : '#9aa6bd' });
    // 小景: 該地下城的地格
    ctx.save(); rr(ctx, -160, -138, 320, 130, 8); ctx.clip();
    ctx.translate(-160 + 20, -138 + 20);
    var lay = [['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'], ['floor', 'floor', 'slow', 'floor', 'pillar', 'floor', d === 'lake' ? 'floor' : 'hurt', 'floor'], ['floor', 'floor', 'floor', 'floor', 'floor', 'slow', 'floor', 'floor']];
    for (var r = 0; r < 3; r++) for (var c = 0; c < 8; c++) { ctx.save(); ctx.translate(c * 40, r * 40 + 5); paintTile(ctx, d, lay[r][c], false, 20); ctx.restore(); }
    ctx.restore();
    ctx.save(); ctx.strokeStyle = P.line; ctx.lineWidth = 2; rr(ctx, -160, -138, 320, 130, 8); ctx.stroke(); ctx.restore();
    // 住的兩種魔物
    for (var i = 0; i < 2; i++) {
      var sp = info.sp[i], cx = i === 0 ? -80 : 80;
      circle(ctx, cx, 50, 42); ctx.fillStyle = '#161b27'; ctx.fill(); ctx.strokeStyle = P.line; ctx.lineWidth = 2; ctx.stroke();
      ctx.save(); ctx.translate(cx + (sp === 'tanuki' ? 8 : 0), 50);
      if (!open) ctx.globalAlpha *= 0.45;
      paintSpecies(ctx, sp, sp === 'tanuki' ? 25 : 30, {});
      ctx.restore();
      T(ctx, SP[sp].name, cx, 110, { size: 17, color: open ? P.text : P.textDim });
    }
    // 開放狀態
    if (open) {
      ctx.strokeStyle = P.capture; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-52, 168); ctx.lineTo(-42, 178); ctx.lineTo(-24, 156); ctx.stroke();
      T(ctx, '已開放', 18, 168, { size: 24, color: '#ffffff' });
    } else {
      // 鎖頭
      ctx.save(); ctx.translate(0, 150);
      ctx.strokeStyle = '#b8c0d0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -8, 9, Math.PI, 0); ctx.stroke();
      rr(ctx, -13, -8, 26, 20, 4); ctx.fillStyle = '#b8c0d0'; ctx.fill();
      ctx.restore();
      var lines = wrapLines(ctx, S(s.condition, ''), 320, 17);
      for (var k = 0; k < Math.min(2, lines.length); k++) T(ctx, lines[k], 0, 182 + k * 22, { size: 17, color: '#ffc0a8', maxW: 330 });
    }
    if (B(s.selected)) selectFrame(ctx, -180, -220, 360, 440, 16);
  }

  // ───────────── 布置第 1 步 ─────────────
  function drawSpeciesCard(ctx, s) {
    var sp = spKey(s.species);
    var owned = Math.max(0, Math.floor(N(s.owned, 0))), on = Math.max(0, Math.floor(N(s.onStage, 0)));
    ctx.translate(N(s.x, 0), N(s.y, 0));
    panel(ctx, -90, -125, 180, 250, 12, on > 0 ? P.panelHi : P.panel, on > 0 ? '#5a6a90' : P.line);
    circle(ctx, 0, -62, 44); ctx.fillStyle = '#161b27'; ctx.fill();
    ctx.save(); ctx.translate(sp === 'tanuki' ? 10 : 0, -62); if (on === 0) ctx.globalAlpha *= 0.5;
    paintSpecies(ctx, sp, sp === 'tanuki' ? 27 : 32, {}); ctx.restore();
    T(ctx, SP[sp].name, 0, 4, { size: 20, maxW: 168 });
    T(ctx, 'Lv ' + clamp(Math.floor(N(s.level, 0)), 0, 3), 0, 30, { size: 15, color: P.textDim });
    var eff = effKey(S(s.effect, '')) || SP[sp].effect;
    effectPill(ctx, eff, 0, 58, 76, 26);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-84, 80, 168, 38);
    T(ctx, '擁有 ' + owned, -42, 99, { size: 15, color: P.textDim });
    T(ctx, '上場 ' + on, 42, 99, { size: 17, color: on > 0 ? P.select : P.textDim });
    if (B(s.selected)) selectFrame(ctx, -90, -125, 180, 250, 12);
  }
  function drawSpeciesInfo(ctx, s) {
    var sp = spKey(s.species);
    ctx.translate(N(s.x, 500), N(s.y, 490));
    panel(ctx, -400, -90, 800, 180, 12);
    T(ctx, SP[sp].name, -380, -60, { size: 24, align: 'left' });
    var dl = wrapLines(ctx, S(s.desc, ''), 400, 17);
    for (var i = 0; i < Math.min(2, dl.length); i++) T(ctx, dl[i], -380, -22 + i * 24, { size: 17, align: 'left', color: '#d8e0ee' });
    var tot = Math.max(0, Math.floor(N(s.total, 0))), mx = Math.max(1, Math.floor(N(s.totalMax, 20)));
    T(ctx, '上場 ' + tot + ' / ' + mx, -380, 58, { size: 24, align: 'left', color: tot >= mx ? P.select : P.text });
    ctx.fillStyle = P.line; ctx.fillRect(56, -72, 2, 144);
    var lines = Array.isArray(s.lines) ? s.lines : [];
    for (var k = 0; k < Math.min(3, lines.length); k++) T(ctx, S(String(lines[k]), ''), 80, -48 + k * 44, { size: k === 0 ? 19 : 17, align: 'left', color: k === 0 ? P.text : '#d8e0ee', maxW: 305 });
  }

  // ───────────── 暗號節目單一列 ─────────────
  function cellBox(ctx, x, y, w, h, accent, filled, dim) {
    rr(ctx, x - w / 2, y - h / 2, w, h, 8);
    ctx.fillStyle = filled ? '#2a3348' : '#1a1f2c'; ctx.fill();
    ctx.strokeStyle = filled ? accent : '#3a4256'; ctx.lineWidth = 2; ctx.stroke();
    if (filled) { ctx.fillStyle = accent; ctx.fillRect(x - w / 2 + 2, y - h / 2 + 6, 4, h - 12); }
  }
  function drawCueRow(ctx, s) {
    var x = N(s.x, 0), y = N(s.y, 0);
    var cue = CUE[s.cue] ? s.cue : '', prog = PROG[s.program] ? s.program : '';
    var complete = B(s.complete) && cue && prog;
    var style = S(s.style, 'row') === 'mini' ? 'mini' : 'row';
    ctx.translate(x, y);
    if (style === 'mini') {
      var cur = B(s.current), sw = B(s.switching);
      rr(ctx, -100, -23, 200, 46, 8); ctx.fillStyle = cur ? '#2c3550' : '#1c2130'; ctx.fill();
      ctx.strokeStyle = '#3a4256'; ctx.lineWidth = 1.5; ctx.stroke();
      var a = complete ? 1 : 0.35;
      if (cue) iconCue(ctx, cue, -55, -2, 14, a); else iconCue(ctx, '', -55, -2, 12, 1);
      if (prog) iconProg(ctx, prog, 55, -2, 14, a); else iconProg(ctx, '', 55, -2, 12, 1);
      if (sw && cur) {
        T(ctx, '…', 0, -6, { size: 26, color: '#ffffff' });
      } else {
        ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = '#d0d8e8'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-14, -2); ctx.lineTo(12, -2); ctx.moveTo(6, -7); ctx.lineTo(12, -2); ctx.lineTo(6, 3); ctx.stroke(); ctx.restore();
      }
      if (cur && !sw && cue === 'wait' && N(s.dur, 0) > 0) {
        var f = p01(s.t, s.dur);
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-92, 15, 184, 5);
        ctx.fillStyle = P.cue; ctx.fillRect(-92, 15, 184 * f, 5);
      }
      if (cur) selectFrame(ctx, -100, -23, 200, 46, 8);
      return;
    }
    // row
    ctx.save();
    if (!complete) ctx.globalAlpha *= 0.5;
    rr(ctx, -340, -32, 680, 64, 10); ctx.fillStyle = complete ? '#222a3c' : '#181c27'; ctx.fill();
    ctx.strokeStyle = complete ? P.line : '#2c3344'; ctx.lineWidth = 2; ctx.stroke();
    var idx = clamp(Math.floor(N(s.index, 0)), 0, 5);
    T(ctx, '第 ' + (idx + 1) + ' 個', -295, 0, { size: 18, color: complete ? P.text : P.textDim });
    cellBox(ctx, -100, 0, 280, 52, P.cue, !!cue);
    cellBox(ctx, 200, 0, 280, 52, P.program, !!prog);
    if (cue) {
      T(ctx, '當', -222, 0, { size: 15, color: P.cue });
      iconCue(ctx, cue, -186, 0, 15, 1);
      T(ctx, CUE[cue], -160, 0, { size: 21, align: 'left', maxW: 196 });
    } else T(ctx, '—', -100, 0, { size: 22, color: P.textDim });
    if (prog) {
      T(ctx, '演', 78, 0, { size: 15, color: P.program });
      iconProg(ctx, prog, 114, 0, 15, 1);
      T(ctx, PROG[prog], 140, 0, { size: 21, align: 'left', maxW: 196 });
    } else T(ctx, '—', 200, 0, { size: 22, color: P.textDim });
    ctx.strokeStyle = '#d0d8e8'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(42, 0); ctx.lineTo(56, 0); ctx.moveTo(51, -5); ctx.lineTo(56, 0); ctx.lineTo(51, 5); ctx.stroke();
    ctx.restore();
    var sel = Math.floor(N(s.selCell, -1));
    if (sel === 0) selectFrame(ctx, -240, -26, 280, 52, 8);
    else if (sel === 1) selectFrame(ctx, 60, -26, 280, 52, 8);
  }

  function drawPickerPanel(ctx, s) {
    var layer = S(s.layer, 'cue') === 'program' ? 'program' : 'cue';
    var opts = Array.isArray(s.options) ? s.options : [];
    var n = opts.length, idx = Math.floor(N(s.index, 0));
    var accent = layer === 'cue' ? P.cue : P.program;
    var X = 760, W = 460, Y = 60;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 16;
    rr(ctx, X, Y, W, 50 + 52 * n, 12); ctx.fillStyle = '#1e2536'; ctx.fill(); ctx.restore();
    rr(ctx, X, Y, W, 50 + 52 * n, 12); ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); rr(ctx, X, Y, W, 50, 12); ctx.clip(); ctx.fillStyle = accent; ctx.globalAlpha = 0.28; ctx.fillRect(X, Y, W, 50); ctx.restore();
    T(ctx, layer === 'cue' ? '什麼時候?' : '演什麼?', X + 24, Y + 25, { size: 22, align: 'left', color: '#ffffff' });
    for (var i = 0; i < n; i++) {
      var o = opts[i] || {}, ry = 110 + 52 * i, cy = ry + 26;
      var key = S(o.key, '');
      if (i > 0) { ctx.fillStyle = '#2c3446'; ctx.fillRect(X + 12, ry, W - 24, 1); }
      if (key === 'clear') iconProg(ctx, 'clear', X + 34, cy, 13, 1);
      else if (layer === 'cue') iconCue(ctx, CUE[key] ? key : '', X + 34, cy, 14, 1);
      else iconProg(ctx, PROG[key] ? key : '', X + 34, cy, 14, 1);
      var desc = S(o.desc, '');
      if (desc) {
        T(ctx, S(o.name, ''), X + 62, cy - 10, { size: 19, align: 'left', maxW: 380 });
        T(ctx, desc, X + 62, cy + 13, { size: 14, align: 'left', color: P.textDim, maxW: 380 });
      } else T(ctx, S(o.name, ''), X + 62, cy, { size: 19, align: 'left', color: key === 'clear' ? P.textDim : P.text, maxW: 380 });
      if (i === idx) selectFrame(ctx, X + 4, ry + 1, W - 8, 50, 8);
    }
  }

  // ───────────── 表演場 ─────────────
  function drawBannerFx(ctx, s) {
    var cue = CUE[s.cue] ? s.cue : '', prog = PROG[s.program] ? s.program : '';
    var p = p01(s.t, s.dur);
    var x = N(s.x, 640), y = N(s.y, 180);
    var a = p < 0.75 ? 1 : 1 - (p - 0.75) / 0.25;
    var sc = p < 0.12 ? 0.8 + 0.2 * (p / 0.12) : 1;
    ctx.translate(x, y); ctx.scale(sc, sc); ctx.globalAlpha *= a;
    var c1 = cue ? CUE[cue] : '?', c2 = prog ? PROG[prog] : '?';
    ctx.font = 'bold 26px ' + FONT;
    var w1 = ctx.measureText(c1).width, w2 = ctx.measureText(c2 + '!').width, wa = 44;
    var total = 34 + w1 + wa + 34 + w2 + 8;
    var W = total + 40, H = 50;
    rr(ctx, -W / 2, -H / 2, W, H, 25); ctx.fillStyle = 'rgba(16,20,30,0.88)'; ctx.fill();
    ctx.strokeStyle = P.select; ctx.lineWidth = 2.5; ctx.stroke();
    var cx = -total / 2;
    iconCue(ctx, cue, cx + 14, 0, 14, 1); cx += 34;
    T(ctx, c1, cx, 1, { size: 26, align: 'left', color: P.cue }); cx += w1;
    T(ctx, '→', cx + wa / 2, 0, { size: 26, color: '#ffffff' }); cx += wa;
    iconProg(ctx, prog, cx + 14, 0, 14, 1); cx += 34;
    T(ctx, c2 + '!', cx, 1, { size: 26, align: 'left', color: P.program });
  }

  function drawShowArena(ctx) {
    ctx.fillStyle = '#10131b'; ctx.fillRect(0, 0, 1280, 720);
    // 觀眾席(上 / 下): 階梯座位
    function stands(y0, y1, top) {
      var g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, top ? '#2a1f30' : '#3a2a3a'); g.addColorStop(1, top ? '#3a2a3a' : '#2a1f30');
      ctx.fillStyle = g; ctx.fillRect(40, y0, 1200, y1 - y0);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (var k = 1; k < 4; k++) ctx.fillRect(40, y0 + (y1 - y0) * k / 4, 1200, 2);
    }
    stands(56, 136, true); stands(582, 662, false);
    // 場地
    rr(ctx, 60, 146, 1160, 420, 18); ctx.fillStyle = '#2b2a35'; ctx.fill();
    ctx.save(); rr(ctx, 60, 146, 1160, 420, 18); ctx.clip();
    var g2 = ctx.createRadialGradient(640, 356, 40, 640, 356, 620);
    g2.addColorStop(0, 'rgba(255,240,200,0.10)'); g2.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = g2; ctx.fillRect(60, 146, 1160, 420);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 2;
    ell(ctx, 640, 356, 420, 160, 0); ctx.stroke(); ell(ctx, 640, 356, 220, 84, 0); ctx.stroke();
    ctx.restore();
    rr(ctx, 60, 146, 1160, 420, 18); ctx.strokeStyle = '#4a4458'; ctx.lineWidth = 3; ctx.stroke();
    // 縮小節目單底
    ctx.fillStyle = '#0c0f16'; ctx.fillRect(0, 666, 1280, 54);
  }

  function paintShowMonster(ctx, s, opt) {
    var sp = spKey(s.species), isT = sp === 'tanuki';
    var R = 24, half = isT ? 40 : 32;
    var dir = N(s.dir, 1) === -1 ? -1 : 1;
    var mode = S(s.mode, 'roam');
    var mv = moveOffset(S(s.move, 'walk'), s.moveT, s.moveDur);
    var frozen = N(s.frozenLeft, 0) > 0;
    var fx = S(s.fx, 'none'), fp = p01(s.fxT, s.fxDur);
    var wild = mode === 'charge' || mode === 'loose';
    var tm = now() / 1000;
    var sx = 0;
    if (wild && (mode === 'loose' || N(s.chargeT, 0) > 0)) sx = Math.sin(tm * 60) * 1.5;
    ell(ctx, 0, R * 0.95, R * 0.85, R * 0.2, 0); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    // 被節目帶著走(散場 / 圍攻) = 節目色地環; 圍攻目標 = 節目色雙實線環
    if (mode === 'program') { ctx.save(); ctx.setLineDash([5, 4]); ell(ctx, 0, R * 0.95, 29, 6, 0); ctx.strokeStyle = P.program; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore(); }
    if (mode === 'hold') { ell(ctx, 0, R * 0.95, 29, 6.5, 0); ctx.strokeStyle = P.program; ctx.lineWidth = 3; ctx.stroke(); ell(ctx, 0, R * 0.95, 20, 4, 0); ctx.lineWidth = 2; ctx.stroke(); }
    ctx.save();
    ctx.translate(sx, mv.dy);
    ctx.globalAlpha *= mv.alpha;
    if (wild) {
      // 失控: 紅色鋸齒外圈(危險)
      ctx.beginPath();
      for (var i = 0; i < 20; i++) { var a = i * TAU / 20 + tm * 2, rad = (i % 2 === 0) ? 29.5 : 25; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
      ctx.closePath(); ctx.fillStyle = 'rgba(255,59,74,0.35)'; ctx.fill(); ctx.strokeStyle = P.danger; ctx.lineWidth = 2.5; ctx.stroke();
    }
    var sc = 1;
    if (B(s.performing)) { var pp = p01(s.performT, s.performDur); sc = 1 + 0.06 * Math.sin(Math.PI * pp); }
    if (mv.swoop) { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; for (var q = -1; q <= 1; q++) { ctx.beginPath(); ctx.moveTo(-dir * R * 0.9, q * 7); ctx.lineTo(-dir * R * 1.25, q * 7); ctx.stroke(); } }
    ctx.save(); ctx.scale(sc, sc); if (mv.swoop) ctx.rotate(dir * 0.25);
    paintSpecies(ctx, sp, R, { dir: dir, eyes: wild ? 'angry' : (frozen ? 'weak' : 'normal') });
    ctx.restore();
    if (mv.alpha < 0.65) { ctx.save(); ctx.setLineDash([3, 3]); circle(ctx, 0, 0, R); ctx.strokeStyle = 'rgba(200,170,255,0.9)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); }
    ctx.restore();
    // 表演中: 白環由身體往外擴
    if (B(s.performing)) {
      var pp2 = p01(s.performT, s.performDur);
      circle(ctx, 0, 0, R + 6 * pp2); ctx.strokeStyle = 'rgba(255,255,255,' + (0.9 * (1 - pp2)).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.stroke();
    }
    // 凍結: 冰塊包住本體; 底部冰條 = 剩餘
    if (frozen) {
      rr(ctx, -28, -28, 56, 56, 8); ctx.fillStyle = 'rgba(170,226,255,0.42)'; ctx.fill();
      ctx.strokeStyle = '#e6f8ff'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.moveTo(-22, -22); ctx.lineTo(-10, -22); ctx.lineTo(-22, -6); ctx.closePath(); ctx.fill();
      var fl = p01(s.frozenLeft, s.frozenDur);
      ctx.fillStyle = 'rgba(10,13,20,0.6)'; ctx.fillRect(-22, 20, 44, 4);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-22, 20, 44 * fl, 4);
    }
    // 標靶: 紫色準星環(特殊效果色)
    if (B(s.target)) {
      circle(ctx, 0, 0, 28.5); ctx.strokeStyle = P.special; ctx.lineWidth = 3; ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(0, -31.5); ctx.lineTo(0, -24); ctx.moveTo(0, 31.5); ctx.lineTo(0, 24); ctx.moveTo(-31.5, 0); ctx.lineTo(-24, 0); ctx.moveTo(31.5, 0); ctx.lineTo(24, 0); ctx.stroke();
      circle(ctx, 0, 0, 28.5); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke();
    }
    // 反應 0.5 秒: 點燃 = 火舌往上竄 / 澆熄 = 水滴往下落 / 特殊 = 紫星繞圈
    if (fx === 'ignited') {
      for (var f = -1; f <= 1; f++) {
        var fh = 8 + 6 * Math.sin(Math.PI * Math.min(1, fp * 1.4)), bx = f * 11, by = -R + 4 - fp * 3;
        ctx.beginPath(); ctx.moveTo(bx, by - fh); ctx.quadraticCurveTo(bx + 6, by - 2, bx, by + 3); ctx.quadraticCurveTo(bx - 6, by - 2, bx, by - fh); ctx.closePath();
        ctx.fillStyle = P.ignite; ctx.fill(); ctx.strokeStyle = '#ffe14a'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,106,44,' + (0.9 * (1 - fp)).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, R + 2, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    } else if (fx === 'doused') {
      var drops = [[-20, 0], [-8, 0.25], [8, 0.1], [20, 0.35]];
      for (var dI = 0; dI < 4; dI++) {
        var dp = (fp + drops[dI][1]) % 1, dx = drops[dI][0], dy = -26 + dp * 42;
        ctx.beginPath(); ctx.moveTo(dx, dy - 6); ctx.quadraticCurveTo(dx + 4.5, dy + 1, dx, dy + 4); ctx.quadraticCurveTo(dx - 4.5, dy + 1, dx, dy - 6); ctx.closePath();
        ctx.fillStyle = P.calm; ctx.fill(); ctx.strokeStyle = '#d8ecff'; ctx.lineWidth = 1.2; ctx.stroke();
      }
    } else if (fx === 'special') {
      for (var k = 0; k < 4; k++) {
        var ak = fp * TAU + k * TAU / 4, rx = Math.cos(ak) * 26, ry = Math.sin(ak) * 26;
        ctx.beginPath(); ctx.moveTo(rx, ry - 5); ctx.lineTo(rx + 1.5, ry - 1.5); ctx.lineTo(rx + 5, ry); ctx.lineTo(rx + 1.5, ry + 1.5); ctx.lineTo(rx, ry + 5); ctx.lineTo(rx - 1.5, ry + 1.5); ctx.lineTo(rx - 5, ry); ctx.lineTo(rx - 1.5, ry - 1.5); ctx.closePath();
        ctx.fillStyle = P.special; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke();
      }
    }
  }
  function drawShowMonster(ctx, s) {
    var sp = spKey(s.species), isT = sp === 'tanuki';
    var x = N(s.x, 0), y = N(s.y, 0);
    var mode = S(s.mode, 'roam');
    ctx.save(); ctx.translate(x, y); paintShowMonster(ctx, s); ctx.restore();
    var mv = moveOffset(S(s.move, 'walk'), s.moveT, s.moveDur);
    ctx.globalAlpha *= Math.max(0.45, mv.alpha);
    rageBar(ctx, x, y - (isT ? 52 : 44), s.rage, s.redLow);
    if (mode !== 'charge' && mode !== 'loose') markRow(ctx, x, y - (isT ? 64 : 56), s.marks, s.markLeft, s.markDur);
    T(ctx, 'Lv ' + clamp(Math.floor(N(s.level, 0)), 0, 3), x, y + (isT ? 48 : 40), { size: 12, color: '#c8d0e0', strokeW: 2.5 });
  }

  function drawFence(ctx, s) {
    var top = S(s.side, 'top') !== 'bottom';
    ctx.translate(N(s.x, 0), N(s.y, 0));
    var wood = '#b88a5a', dark = '#6a4a2a';
    if (!B(s.broken)) {
      ctx.fillStyle = dark; ctx.fillRect(-68, -7, 6, 14); ctx.fillRect(62, -7, 6, 14);
      ctx.fillStyle = wood; ctx.fillRect(-64, -6, 128, 4); ctx.fillRect(-64, 2, 128, 4);
      ctx.strokeStyle = P.outline; ctx.lineWidth = 1; ctx.strokeRect(-64, -6, 128, 4); ctx.strokeRect(-64, 2, 128, 4);
    } else {
      ctx.fillStyle = dark; ctx.fillRect(-68, -7, 6, 14); ctx.fillRect(62, -7, 6, 14);
      ctx.save(); ctx.translate(-62, -2.5); ctx.rotate(top ? 0.04 : -0.04); ctx.fillStyle = wood; ctx.fillRect(0, -2, 46, 4); ctx.restore();
      ctx.save(); ctx.translate(62, 2.5); ctx.rotate(top ? 0.04 : -0.04); ctx.fillStyle = wood; ctx.fillRect(-46, -2, 46, 4); ctx.restore();
      ctx.save(); ctx.translate(-62, 3); ctx.rotate(top ? -0.03 : 0.03); ctx.fillStyle = wood; ctx.fillRect(0, -2, 30, 4); ctx.restore();
      ctx.save(); ctx.setLineDash([4, 3]); ctx.strokeStyle = P.danger; ctx.lineWidth = 2; ctx.strokeRect(-60, -6, 120, 12); ctx.restore();
    }
  }
  var VIS_COL = ['#e8a05a', '#7ab8e8', '#e87aa8', '#9ad87a', '#c8a0e8', '#e8d07a', '#7ae0d0', '#e88a7a'];
  function drawVisitor(ctx, s) {
    var x = N(s.x, 0), y = N(s.y, 0), top = S(s.side, 'top') !== 'bottom', mode = S(s.mode, 'watch');
    var idx = Math.abs(Math.round((x - 165) / 136)) % 8;
    ctx.translate(x, y);
    // 座位
    rr(ctx, -24, 18, 48, 14, 4); ctx.fillStyle = '#4a3a50'; ctx.fill(); ctx.strokeStyle = '#2a2030'; ctx.lineWidth = 1.5; ctx.stroke();
    if (mode === 'empty') return;
    var col = VIS_COL[idx];
    if (mode === 'scared') {
      ctx.globalAlpha *= 0.85;
      ctx.translate(top ? 0 : 0, -6);
      ctx.strokeStyle = '#f4d2a8'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-12, 2); ctx.lineTo(-20, -18); ctx.moveTo(12, 2); ctx.lineTo(20, -18); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(-18, 30); ctx.quadraticCurveTo(-18, 0, 0, 0); ctx.quadraticCurveTo(18, 0, 18, 30); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5; ctx.stroke();
    circle(ctx, 0, -12, 11); ctx.fillStyle = '#f4d2a8'; ctx.fill(); ctx.stroke();
    if (top) { // 面向場地(朝下): 看得到臉
      if (mode === 'scared') {
        circle(ctx, -4, -13, 2.2); ctx.fillStyle = P.outline; ctx.fill(); circle(ctx, 4, -13, 2.2); ctx.fill();
        ell(ctx, 0, -6, 3, 3.5, 0); ctx.fill();
      } else { circle(ctx, -4, -12, 1.8); ctx.fillStyle = P.outline; ctx.fill(); circle(ctx, 4, -12, 1.8); ctx.fill(); }
    } else { // 背對鏡頭: 頭髮
      ctx.beginPath(); ctx.arc(0, -12, 11, Math.PI * 0.9, Math.PI * 2.1); ctx.fillStyle = '#4a3020'; ctx.fill();
    }
    if (mode === 'scared') {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-24, -26); ctx.lineTo(-19, -20); ctx.moveTo(24, -26); ctx.lineTo(19, -20); ctx.moveTo(0, -30); ctx.lineTo(0, -26); ctx.stroke();
    }
  }

  // ───────────── 商店 ─────────────
  var TAB = { char: '角色', show: '表演', monster: '怪物' };
  function drawShopTab(ctx, s) {
    var tab = TAB[s.tab] ? s.tab : 'char', cur = B(s.current);
    ctx.translate(N(s.x, 0), N(s.y, 0));
    rr(ctx, -110, -25, 220, 50, 10); ctx.fillStyle = cur ? '#3a4766' : '#1e2434'; ctx.fill();
    ctx.strokeStyle = cur ? '#8aa0d0' : '#353d52'; ctx.lineWidth = 2; ctx.stroke();
    if (cur) { ctx.fillStyle = '#ffffff'; ctx.fillRect(-60, 17, 120, 4); }
    T(ctx, TAB[tab], 0, -1, { size: 22, color: cur ? '#ffffff' : P.textDim });
    if (B(s.selected)) selectFrame(ctx, -110, -25, 220, 50, 10);
  }
  function drawShopItem(ctx, s) {
    var item = S(s.item, '');
    ctx.translate(N(s.x, 0), N(s.y, 0));
    var isSp = !!SP[item], isCue = !!CUE[item], isProg = !!PROG[item], it = ITEM[item];
    var locked = isSp && B(s.locked);
    panel(ctx, -190, -50, 380, 100, 10, locked ? '#181c27' : P.panel, locked ? '#2c3344' : P.line);
    ctx.save(); if (locked) ctx.globalAlpha *= 0.45;
    // 圖示框
    rr(ctx, -180, -40, 80, 80, 8); ctx.fillStyle = '#161b27'; ctx.fill();
    var name = '', desc = '';
    if (isSp) {
      ctx.save(); ctx.translate(-140 + (item === 'tanuki' ? 7 : 0), 0); paintSpecies(ctx, item, item === 'tanuki' ? 22 : 27, {}); ctx.restore();
      name = SP[item].name;
    } else if (isCue) { iconCue(ctx, item, -140, 0, 22, 1); name = CUE[item]; desc = CUE_DESC[item]; }
    else if (isProg) { iconProg(ctx, item, -140, 0, 22, 1); name = PROG[item]; desc = PROG_DESC[item]; }
    else if (it) {
      name = it.name; desc = it.desc;
      if (it.kind === 'weapon') iconWeapon(ctx, item, -144, 4, 34);
      else if (item === 'attack') { iconWeapon(ctx, 'sword', -146, 4, 30); T(ctx, '+1', -118, -22, { size: 16, color: P.select }); }
      else if (item === 'armor') { heartPath(ctx, -140, 0, 20); ctx.fillStyle = P.heart; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 2; ctx.stroke(); }
      else { ropeIcon(ctx, -140, 0, 26, true); }
    } else { name = item || '?'; }
    // 小標: 暗號 / 節目
    if (isCue || isProg) {
      var tag = isCue ? '暗號' : '節目', tc = isCue ? P.cue : P.program;
      rr(ctx, -88, -42, 46, 22, 6); ctx.fillStyle = tc; ctx.fill();
      T(ctx, tag, -65, -31, { size: 13, color: '#10131b', stroke: false });
      T(ctx, name, -34, -30, { size: 21, align: 'left', maxW: 200 });
    } else T(ctx, name, -88, -30, { size: 21, align: 'left', maxW: 250 });
    if (isSp) {
      effectPill(ctx, effKey(S(s.effect, '')) || SP[item].effect, -56, 2, 62, 24);
      T(ctx, 'Lv ' + clamp(Math.floor(N(s.level, 0)), 0, 3), -10, 2, { size: 17, align: 'left', color: P.textDim });
    } else if (desc) T(ctx, desc, -88, 2, { size: 15, align: 'left', color: '#c8d0e0', maxW: 268 });
    ctx.restore();
    // 右下: 價格 / 狀態
    var cost = Math.max(0, Math.floor(N(s.cost, 0)));
    var status = '', scol = P.textDim;
    if (isSp) {
      if (locked) status = '未收服';
      else if (B(s.maxed)) { status = '已滿級'; scol = P.select; }
    } else if (it && it.kind === 'weapon') {
      if (B(s.equipped)) { status = '裝備中'; scol = P.select; }
      else if (B(s.owned) || item === 'club') status = '已擁有';
    } else if (isCue || isProg) {
      if (B(s.owned)) status = '已擁有';
    }
    if (status) T(ctx, status, 178, 32, { size: 18, align: 'right', color: scol });
    else {
      var aff = B(s.affordable);
      var txt = cost + ' 金';
      T(ctx, txt, 178, 32, { size: 19, align: 'right', color: aff ? P.gold : '#ff7a7a' });
      if (it && it.kind === 'up' && N(s.level, 0) > 0) T(ctx, '已買 ' + Math.floor(N(s.level, 0)), -88, 32, { size: 14, align: 'left', color: P.textDim });
    }
    if (B(s.selected)) selectFrame(ctx, -190, -50, 380, 100, 10);
  }
  function drawShopDetail(ctx, s) {
    ctx.translate(N(s.x, 640), N(s.y, 570));
    panel(ctx, -540, -30, 1080, 60, 10, '#1a2030', P.line);
    var lines = Array.isArray(s.lines) ? s.lines : [];
    var n = Math.min(3, lines.length);
    if (n === 0) return;
    var size = n === 1 ? 20 : (n === 2 ? 17 : 15), gap = n === 1 ? 0 : (n === 2 ? 22 : 18);
    for (var i = 0; i < n; i++) T(ctx, String(lines[i]), 0, (i - (n - 1) / 2) * gap, { size: size, color: i === 0 ? P.text : '#c8d0e0', maxW: 1040 });
  }
  function drawButton(ctx, s) {
    var x = N(s.x, 0), y = N(s.y, 0), w = Math.max(10, N(s.w, 200)), h = Math.max(10, N(s.h, 60)), sel = B(s.selected);
    rr(ctx, x, y, w, h, 12); ctx.fillStyle = sel ? P.select : '#2c3550'; ctx.fill();
    ctx.strokeStyle = sel ? '#fff2b0' : P.line; ctx.lineWidth = 2; ctx.stroke();
    T(ctx, S(s.label, ''), x + w / 2, y + h / 2 + 1, { size: Math.min(26, Math.round(h * 0.42)), color: sel ? '#10131b' : P.text, stroke: !sel, maxW: w - 16 });
  }
  var FT_COL = { gold: P.gold, redGold: '#ffd040', chain: '#9ff0ff', repDown: '#c8a8d8', capture: P.capture };
  function drawFloatText(ctx, s) {
    var kind = FT_COL[s.kind] ? s.kind : 'gold';
    var p = p01(s.t, s.dur);
    var x = N(s.x, 0), y = N(s.y, 0);
    var dy = kind === 'repDown' ? p * 20 : -p * 32;
    var a = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
    ctx.globalAlpha *= a;
    var size = kind === 'chain' ? 22 : (kind === 'capture' ? 24 : (kind === 'redGold' ? 22 : 18));
    var txt = S(s.text, '');
    if (kind === 'redGold') {
      ctx.font = 'bold ' + size + 'px ' + FONT; var w = ctx.measureText(txt).width;
      rr(ctx, x - w / 2 - 8, y + dy - size * 0.7, w + 16, size * 1.4, 8); ctx.fillStyle = 'rgba(160,20,30,0.75)'; ctx.fill();
      ctx.strokeStyle = P.rageRed; ctx.lineWidth = 2; ctx.stroke();
    }
    if (kind === 'capture') {
      ctx.font = 'bold ' + size + 'px ' + FONT; var w2 = ctx.measureText(txt).width;
      var cx = x - w2 / 2 - 16, cy = y + dy;
      circle(ctx, cx, cy, 11); ctx.fillStyle = P.capture; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = '#10131b'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - 5, cy); ctx.lineTo(cx - 1, cy + 4); ctx.lineTo(cx + 6, cy - 4); ctx.stroke();
      T(ctx, txt, x + 6, cy, { size: size, color: P.capture });
      return;
    }
    T(ctx, txt, x, y + dy, { size: size, color: FT_COL[kind] });
  }

  // ───────────── 結算 ─────────────
  function drawResultPanel(ctx, s) {
    ctx.translate(640, 380);
    panel(ctx, -400, -260, 800, 520, 18, '#1e2536', P.line);
    T(ctx, '五天結算', 0, -222, { size: 32 });
    var stars = clamp(Math.floor(N(s.stars, 0)), 0, 3);
    for (var i = 0; i < 3; i++) {
      starPath(ctx, -90 + i * 90, -150, 34);
      ctx.fillStyle = i < stars ? P.select : '#2c3446'; ctx.fill(); ctx.strokeStyle = i < stars ? '#fff2b0' : '#465372'; ctx.lineWidth = 3; ctx.stroke();
    }
    var rows = [['總名聲', String(Math.floor(N(s.rep, 0))), P.rep], ['累計賺得金幣', String(Math.floor(N(s.goldEarned, 0))), P.gold], ['最長連鎖', Math.floor(N(s.bestChain, 0)) + ' 段', '#9ff0ff']];
    for (var r = 0; r < 3; r++) {
      var yy = -80 + r * 42;
      T(ctx, rows[r][0], -300, yy, { size: 21, align: 'left', color: P.textDim });
      T(ctx, rows[r][1], 300, yy, { size: 24, align: 'right', color: rows[r][2] });
    }
    ctx.fillStyle = P.line; ctx.fillRect(-340, 52, 680, 2);
    T(ctx, '怪物庫', -300, 76, { size: 19, align: 'left', color: P.textDim });
    var bank = Array.isArray(s.bank) ? s.bank : [];
    var n = Math.min(6, bank.length);
    for (var k = 0; k < n; k++) {
      var b = bank[k] || {}, sp = spKey(b.species), cx = -275 + k * 110;
      circle(ctx, cx, 140, 34); ctx.fillStyle = '#161b27'; ctx.fill();
      ctx.save(); ctx.translate(cx + (sp === 'tanuki' ? 6 : 0), 140); paintSpecies(ctx, sp, sp === 'tanuki' ? 19 : 23, {}); ctx.restore();
      T(ctx, '×' + Math.max(0, Math.floor(N(b.count, 0))), cx + 22, 170, { size: 16 });
      T(ctx, 'Lv ' + clamp(Math.floor(N(b.level, 0)), 0, 3), cx, 194, { size: 14, color: P.textDim });
    }
    T(ctx, '按 Z 重來', 0, 234, { size: 22, color: P.select });
  }

  // ───────────── HUD ─────────────
  function timeBar(ctx, x, y, w, h, left, max) {
    var f = p01(left, max);
    rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = '#0a0d14'; ctx.fill();
    if (f > 0) { rr(ctx, x + 2, y + 2, Math.max(h - 4, (w - 4) * f), h - 4, (h - 4) / 2); ctx.fillStyle = f < 0.2 ? P.danger : '#7ab0ff'; ctx.fill(); }
    rr(ctx, x, y, w, h, h / 2); ctx.strokeStyle = 'rgba(230,236,248,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  function drawHud(ctx, s) {
    var phase = S(s.phase, 'select');
    if (phase === 'guide') return; // 說明頁的所有文字歸 RD, HUD 整個不畫
    var dg = phase === 'dungeon';
    var H = dg ? 100 : 50;
    ctx.fillStyle = 'rgba(12,15,22,0.94)'; ctx.fillRect(0, 0, 1280, H);
    ctx.fillStyle = '#2c3446'; ctx.fillRect(0, H - 2, 1280, 2);
    var day = Math.floor(N(s.day, 1)), dmax = Math.floor(N(s.dayMax, 5));
    T(ctx, '第 ' + day + ' / ' + dmax + ' 天', 20, 25, { size: 20, align: 'left' });
    coinIcon(ctx, 1000, 25, 10);
    T(ctx, String(Math.floor(N(s.gold, 0))), 1016, 25, { size: 20, align: 'left', color: P.gold });
    repIcon(ctx, 1132, 25, 11);
    T(ctx, String(Math.floor(N(s.rep, 0))), 1148, 25, { size: 20, align: 'left', color: P.rep });
    var tmax = N(s.timeMax, 0), tl = N(s.timeLeft, 0);
    if (tmax > 0) {
      timeBar(ctx, 470, 16, 260, 18, tl, tmax);
      T(ctx, Math.ceil(Math.max(0, tl)) + ' 秒', 744, 25, { size: 19, align: 'left', color: tl / tmax < 0.2 ? '#ff8a8a' : P.text });
    }
    var dn = DUN[s.dungeon] ? DUN[s.dungeon].name : '';
    if (dg && dn) T(ctx, dn, 160, 25, { size: 20, align: 'left', color: DUN[s.dungeon].color });
    var msg = S(s.message, '');
    if (!dg) {
      if (msg) T(ctx, msg, tmax > 0 ? 880 : 640, 25, { size: 17, color: '#d8e0ee', maxW: tmax > 0 ? 200 : 600 });
      return;
    }
    // 第 2 行: 心、繩、武器、X 冷卻、訊息
    var mh = Math.max(0, Math.floor(N(s.maxHearts, 6))), h = clamp(Math.floor(N(s.hearts, 0)), 0, mh);
    var step = mh > 10 ? 18 : 24;
    for (var i = 0; i < Math.min(mh, 14); i++) {
      heartPath(ctx, 30 + i * step, 74, 9);
      ctx.fillStyle = i < h ? P.heart : '#2c3446'; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5; ctx.stroke();
    }
    var rx = 30 + Math.min(mh, 14) * step + 20;
    var rm = Math.max(0, Math.floor(N(s.ropeMax, 4))), ro = clamp(Math.floor(N(s.ropes, 0)), 0, rm);
    for (var k = 0; k < Math.min(rm, 10); k++) ropeIcon(ctx, rx + k * 22, 74, 10, k < ro);
    var wx = 640;
    var wp = wpKey(s.weapon);
    rr(ctx, wx - 6, 56, 180, 36, 8); ctx.fillStyle = '#1a2030'; ctx.fill(); ctx.strokeStyle = P.line; ctx.lineWidth = 1.5; ctx.stroke();
    iconWeapon(ctx, wp, wx + 14, 76, 22);
    T(ctx, WEAPON[wp], wx + 34, 74, { size: 18, align: 'left' });
    var xm = N(s.xCdMax, 0), xl = N(s.xCdLeft, 0);
    var kx = wx + 140, ky = 74;
    rr(ctx, kx - 13, ky - 13, 26, 26, 5); ctx.fillStyle = xm > 0 ? (xl > 0 ? '#2a3040' : '#3a4766') : '#1a1f2a'; ctx.fill();
    ctx.strokeStyle = xm > 0 && xl <= 0 ? '#ffffff' : '#465372'; ctx.lineWidth = 1.5; ctx.stroke();
    if (xm > 0 && xl > 0) { var f = p01(xl, xm); ctx.beginPath(); ctx.moveTo(kx, ky); ctx.arc(kx, ky, 11, -Math.PI / 2, -Math.PI / 2 + TAU * f); ctx.closePath(); ctx.fillStyle = 'rgba(10,13,20,0.75)'; ctx.fill(); }
    T(ctx, 'X', kx, ky + 1, { size: 15, color: xm > 0 ? (xl > 0 ? P.textDim : '#ffffff') : '#465372' });
    if (msg) T(ctx, msg, 1040, 74, { size: 19, color: (msg.indexOf('繞') >= 0 || msg.indexOf('站住') >= 0) ? P.capture : '#d8e0ee', maxW: 440 });
  }

  // ───────────── 說明頁示意圖(只畫在框內, 不畫頁標題 / 說明文字) ─────────────
  function fit(ctx, s, vw, vh) {
    var x = N(s.x, 0), y = N(s.y, 0), w = Math.max(1, N(s.w, vw)), h = Math.max(1, N(s.h, vh));
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    var k = Math.min(w / vw, h / vh);
    ctx.translate(x + (w - vw * k) / 2, y + (h - vh * k) / 2);
    ctx.scale(k, k);
  }
  function keycap(ctx, label, x, y, w) {
    w = w || 36;
    rr(ctx, x - w / 2, y - 16, w, 32, 6); ctx.fillStyle = '#e8ecf4'; ctx.fill(); ctx.strokeStyle = '#6a7490'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#b8c0d0'; ctx.fillRect(x - w / 2 + 3, y + 10, w - 6, 3);
    T(ctx, label, x, y - 1, { size: 18, color: '#1a2030', stroke: false });
  }
  function arrowKeys(ctx, x, y) {
    var k = 22;
    function cap(cx, cy, rot) {
      rr(ctx, cx - k / 2, cy - k / 2, k, k, 4); ctx.fillStyle = '#e8ecf4'; ctx.fill(); ctx.strokeStyle = '#6a7490'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.beginPath(); ctx.moveTo(-4, 3); ctx.lineTo(0, -4); ctx.lineTo(4, 3); ctx.closePath(); ctx.fillStyle = '#1a2030'; ctx.fill(); ctx.restore();
    }
    cap(x, y - k - 1, 0); cap(x - k - 1, y, -Math.PI / 2); cap(x, y, Math.PI); cap(x + k + 1, y, Math.PI / 2);
  }
  function bigArrow(ctx, x0, y0, x1, y1, col, w) {
    var a = Math.atan2(y1 - y0, x1 - x0);
    ctx.strokeStyle = col; ctx.lineWidth = w || 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - Math.cos(a) * 8, y1 - Math.sin(a) * 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - Math.cos(a - 0.5) * 16, y1 - Math.sin(a - 0.5) * 16); ctx.lineTo(x1 - Math.cos(a + 0.5) * 16, y1 - Math.sin(a + 0.5) * 16); ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
  }
  function label(ctx, str, x, y, col) { T(ctx, str, x, y, { size: 16, color: col || '#ffffff' }); }
  function frameBox(ctx, x, y, w, h) { rr(ctx, x, y, w, h, 12); ctx.fillStyle = 'rgba(10,13,20,0.5)'; ctx.fill(); ctx.strokeStyle = P.line; ctx.lineWidth = 2; ctx.stroke(); }

  function guide1(ctx) {
    // 鏡湖一角: 13×7 格(上排牆)
    var VW = 800, VH = 440;
    ctx.save(); rr(ctx, 0, 0, VW, VH, 12); ctx.clip();
    for (var r = 0; r < 8; r++) for (var c = 0; c < 14; c++) {
      var kind = r === 0 ? 'wall' : 'floor';
      if (r === 5 && c === 11) kind = 'slow'; if (r === 5 && c === 12) kind = 'slow';
      if (r === 2 && c === 1) kind = 'pillar';
      ctx.save(); ctx.translate(c * 60 + 10, r * 60 - 10); paintTile(ctx, 'lake', kind, false, 30); ctx.restore();
    }
    ctx.restore();
    var tx = 330, ty = 290, lx = 330, ly = 95;
    // 鈴蘭精往下射三發扇形花粉(相鄰夾角 20°)
    var base = Math.atan2(ty - ly, tx - lx);
    for (var i = -1; i <= 1; i++) {
      var a = base + i * 20 * Math.PI / 180;
      ctx.save(); ctx.globalAlpha = 0.18; ctx.strokeStyle = P.calm; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + Math.cos(a) * 260, ly + Math.sin(a) * 260); ctx.stroke(); ctx.restore();
      window.Art.drawHazard(ctx, { x: lx + Math.cos(a) * 105, y: ly + Math.sin(a) * 105, kind: 'pollen', phase: 'fly', radius: 12, angle: a, t: 0.6, dur: 4 });
    }
    window.Art.drawWildMonster(ctx, { x: lx, y: ly, species: 'lily', hp: 7, maxHp: 7, dir: 1, move: 'walk' });
    // 馴獸師棍棒朝右敲中火柴猴
    window.Art.drawWildMonster(ctx, { x: 432, y: ty, species: 'monkey', hp: 5, maxHp: 7, hit: true, dir: -1, move: 'walk' });
    // 往左閃出花粉扇形
    ctx.save(); ctx.setLineDash([8, 6]); bigArrow(ctx, tx - 30, ty + 2, 160, ty + 2, '#ffffff', 4); ctx.restore();
    window.Art.drawTamer(ctx, { x: tx, y: ty, facing: 2, weapon: 'club' });
    window.Art.drawWeaponFx(ctx, { x: tx, y: ty, weapon: 'club', move: 'normal', shape: 'arc', angle: 0, spread: 100 * Math.PI / 180, radius: 70, t: 0.08, dur: 0.2 });
    // 鍵帽貼在做動作的物件旁
    arrowKeys(ctx, 175, 370);
    keycap(ctx, 'Z', 400, 370);
    label(ctx, '你', tx, ty - 40, P.tamer);
  }
  function guide2(ctx) {
    frameBox(ctx, 0, 0, 390, 420); frameBox(ctx, 410, 0, 390, 420);
    // 左: 準備捕捉, 進度一半
    window.Art.drawCaptureRing(ctx, { x: 195, y: 220, t: 0.4, dur: 0.8 });
    window.Art.drawWildMonster(ctx, { x: 195, y: 220, species: 'lily', hp: 2, maxHp: 7, weak: true, dir: 1, move: 'walk' });
    window.Art.drawTamer(ctx, { x: 205, y: 232, facing: 1, weapon: 'club' });
    // 右: 套索中, 繞圈進度一半
    var mx = 605, my = 230, R = 110;
    ctx.save(); ctx.setLineDash([7, 7]); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(mx, my, R, -Math.PI * 0.95, Math.PI * 0.55); ctx.stroke(); ctx.restore();
    var ea = Math.PI * 0.55;
    ctx.save(); ctx.translate(mx + Math.cos(ea) * R, my + Math.sin(ea) * R); ctx.rotate(ea + Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -8); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.restore();
    var ta = -Math.PI * 0.1, tx = mx + Math.cos(ta) * R, ty = my + Math.sin(ta) * R;
    window.Art.drawWildMonster(ctx, { x: mx, y: my, species: 'lily', hp: 2, maxHp: 7, weak: true, lassoed: true, stunLeft: 0, dir: 1, move: 'walk' });
    window.Art.drawLasso(ctx, { x1: tx, y1: ty, x2: mx, y2: my, progress: 0.5, t: 2, limit: 5, len: R, maxLen: 220 });
    window.Art.drawTamer(ctx, { x: tx, y: ty, facing: 4, weapon: 'club', lassoing: true });
    // 角落: 收服!
    rr(ctx, 650, 330, 140, 76, 10); ctx.fillStyle = 'rgba(10,13,20,0.7)'; ctx.fill(); ctx.strokeStyle = P.line; ctx.lineWidth = 1.5; ctx.stroke();
    window.Art.drawFloatText(ctx, { x: 720, y: 368, text: '收服!', kind: 'capture', t: 0, dur: 1 });
  }
  function arenaFloor(ctx, x, y, w, h) {
    rr(ctx, x, y, w, h, 14); ctx.fillStyle = '#2b2a35'; ctx.fill(); ctx.strokeStyle = '#4a4458'; ctx.lineWidth = 3; ctx.stroke();
  }
  function guide3(ctx) {
    // 上: 布置第 2 步的節目單(6 列, 只有前 3 列完整)
    var rows = [['wait', 'mob'], ['red3', 'ice'], ['cold', 'pep'], ['', ''], ['', ''], ['', '']];
    ctx.save(); ctx.translate(500, 30); ctx.scale(0.74, 0.74);
    for (var i = 0; i < 6; i++) window.Art.drawCueRow(ctx, { x: 0, y: i * 70, style: 'row', index: i, cue: rows[i][0], program: rows[i][1], complete: !!rows[i][0], selCell: -1, current: false, t: 0, dur: 0, switching: false });
    ctx.restore();
    // 小箭頭: 開演後
    bigArrow(ctx, 500, 318, 500, 342, '#ffffff', 4);
    // 下: 表演場縮圖
    arenaFloor(ctx, 40, 346, 920, 190);
    var ms = [['lily', 230, 455, 64, 'doused'], ['monkey', 400, 470, 70, 'doused'], ['lily', 580, 455, 62, 'doused'], ['monkey', 770, 470, 50, 'none']];
    for (var k = 0; k < 4; k++) {
      ctx.save(); ctx.translate(ms[k][1], ms[k][2]); ctx.scale(0.9, 0.9);
      window.Art.drawShowMonster(ctx, { x: 0, y: 0, species: ms[k][0], level: 0, rage: ms[k][3], redLow: 80, marks: 0, markLeft: 0, markDur: 4, mode: 'roam', fx: ms[k][4], fxT: 0.25, fxDur: 0.5, move: 'walk', dir: k % 2 ? -1 : 1, performT: 0, performDur: 0.5 });
      ctx.restore();
    }
    ctx.save(); ctx.translate(500, 368); ctx.scale(0.78, 0.78);
    window.Art.drawBannerFx(ctx, { x: 0, y: 0, cue: 'red3', program: 'ice', t: 0.3, dur: 0.8 });
    ctx.restore();
    // 最下方: 縮小節目單, 第 3 格框起來、換列等待「…」
    ctx.save(); ctx.translate(500, 566); ctx.scale(0.66, 0.66);
    for (var j = 0; j < 6; j++) window.Art.drawCueRow(ctx, { x: (j - 2.5) * 212, y: 0, style: 'mini', index: j, cue: rows[j][0], program: rows[j][1], complete: !!rows[j][0], selCell: -1, current: j === 2, t: 0, dur: 0, switching: j === 2 });
    ctx.restore();
  }
  function guide4(ctx) {
    // 上: 紅區中表演, 飛出 ×2 金幣
    frameBox(ctx, 0, 0, 800, 190);
    ctx.save(); ctx.translate(300, 110);
    window.Art.drawShowMonster(ctx, { x: 0, y: 0, species: 'monkey', level: 0, rage: 90, redLow: 80, marks: 0, markLeft: 0, markDur: 4, mode: 'roam', performing: true, performT: 0.2, performDur: 0.5, fx: 'none', move: 'walk', dir: 1 });
    ctx.restore();
    window.Art.drawHazard(ctx, { x: 380, y: 112, kind: 'match', phase: 'fly', radius: 14, angle: 0, t: 0.3, dur: 3 });
    window.Art.drawFloatText(ctx, { x: 470, y: 74, text: '+4 ×2', kind: 'redGold', t: 0.2, dur: 1 });
    // 紅區小標: 貼著怒氣條的紅段
    ctx.strokeStyle = P.rageRed; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(320, 66); ctx.lineTo(196, 50); ctx.stroke();
    label(ctx, '紅區', 170, 48, '#ff8a94');
    // 下: 4 個標記 → 衝圍欄(標記已沒有)
    frameBox(ctx, 0, 210, 800, 250);
    ctx.save(); ctx.translate(200, 330);
    window.Art.drawShowMonster(ctx, { x: 0, y: 0, species: 'monkey', level: 0, rage: 100, redLow: 80, marks: 4, markLeft: 3, markDur: 4, mode: 'roam', fx: 'none', move: 'walk', dir: 1 });
    ctx.restore();
    bigArrow(ctx, 260, 330, 420, 330, '#ffffff', 4);
    window.Art.drawFence(ctx, { x: 560, y: 412, side: 'bottom', broken: false });
    window.Art.drawVisitor(ctx, { x: 520, y: 446, side: 'bottom', mode: 'scared' });
    window.Art.drawVisitor(ctx, { x: 600, y: 446, side: 'bottom', mode: 'watch' });
    ctx.save(); ctx.translate(560, 362);
    window.Art.drawShowMonster(ctx, { x: 0, y: 0, species: 'monkey', level: 0, rage: 100, redLow: 80, marks: 0, markLeft: 0, markDur: 4, mode: 'charge', chargeT: 0.6, chargeDur: 1.5, fx: 'none', move: 'walk', dir: 1 });
    ctx.restore();
    // 打叉
    ctx.strokeStyle = P.danger; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(670, 290); ctx.lineTo(740, 360); ctx.moveTo(740, 290); ctx.lineTo(670, 360); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(670, 290); ctx.lineTo(740, 360); ctx.moveTo(740, 290); ctx.lineTo(670, 360); ctx.stroke();
  }
  function guide5(ctx) {
    var nodes = [['地下城', 400, 62], ['布置', 650, 210], ['表演', 400, 358], ['商店', 150, 210]];
    var cx = 400, cy = 210;
    // 圈狀流程箭頭(順時針)
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4;
    for (var i = 0; i < 4; i++) {
      var a0 = -Math.PI / 2 + i * Math.PI / 2 + 0.42, a1 = a0 + Math.PI / 2 - 0.84;
      ctx.beginPath(); ctx.ellipse(cx, cy, 250, 148, 0, a0, a1); ctx.stroke();
      var ex = cx + Math.cos(a1) * 250, ey = cy + Math.sin(a1) * 148;
      var ta = Math.atan2(Math.cos(a1) * 148, -Math.sin(a1) * 250);
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(ta); ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -8); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.restore();
    }
    for (var k = 0; k < 4; k++) {
      var nx = nodes[k][1], ny = nodes[k][2];
      rr(ctx, nx - 78, ny - 40, 156, 80, 14); ctx.fillStyle = '#232a3a'; ctx.fill(); ctx.strokeStyle = k === 2 ? P.select : P.line; ctx.lineWidth = 2.5; ctx.stroke();
      if (k === 0) { ctx.save(); ctx.translate(nx - 48, ny); paintTile(ctx, 'lake', 'wall', false, 18); ctx.restore(); }
      if (k === 1) { iconCue(ctx, 'red3', nx - 54, ny, 12, 1); iconProg(ctx, 'ice', nx - 26, ny, 12, 1); }
      if (k === 2) { ctx.save(); ctx.translate(nx - 46, ny); paintSpecies(ctx, 'monkey', 18, {}); ctx.restore(); }
      if (k === 3) coinIcon(ctx, nx - 48, ny, 14);
      T(ctx, nodes[k][0], nx + 18, ny, { size: 22 });
    }
    T(ctx, '×5 天', cx, cy, { size: 34, color: P.select });
    // 表演旁: 名聲往上加
    for (var s2 = 0; s2 < 3; s2++) { ctx.save(); ctx.globalAlpha = 1 - s2 * 0.28; repIcon(ctx, 502 + s2 * 16, 348 - s2 * 22, 9); ctx.restore(); }
    T(ctx, '+名聲', 540, 296, { size: 16, color: P.rep });
    // 終點: 結算星數
    bigArrow(ctx, 480, 392, 590, 404, P.select, 3);
    rr(ctx, 596, 376, 196, 58, 12); ctx.fillStyle = '#1e2536'; ctx.fill(); ctx.strokeStyle = P.select; ctx.lineWidth = 2; ctx.stroke();
    T(ctx, '結算', 632, 405, { size: 18 });
    for (var st = 0; st < 3; st++) { starPath(ctx, 690 + st * 32, 405, 13); ctx.fillStyle = st < 2 ? P.select : '#2c3446'; ctx.fill(); ctx.strokeStyle = '#465372'; ctx.lineWidth = 1.5; ctx.stroke(); }
  }
  var GUIDE = [[guide1, 800, 440], [guide2, 800, 420], [guide3, 1000, 590], [guide4, 800, 470], [guide5, 800, 440]];
  function drawGuidePage(ctx, s) {
    var pg = clamp(Math.floor(N(s.page, 0)), 0, GUIDE.length - 1);
    var g = GUIDE[pg];
    fit(ctx, s, g[1], g[2]);
    g[0](ctx);
  }

  // ───────────── 匯出 ─────────────
  window.Art = {
    canvas: { width: 1280, height: 720 },
    palette: P,
    drawBackground: function (ctx) { if (!ctx) return; ctx.save(); try { drawBackground(ctx); } finally { ctx.restore(); } },
    drawTile: wrap(drawTile),
    drawPortal: wrap(drawPortal),
    drawCrackWall: wrap(drawCrackWall),
    drawTamer: wrap(drawTamer),
    drawWildMonster: wrap(drawWildMonster),
    drawCaptureRing: wrap(drawCaptureRing),
    drawLasso: wrap(drawLasso),
    drawHazard: wrap(drawHazard),
    drawWeaponFx: wrap(drawWeaponFx),
    drawDungeonCard: wrap(drawDungeonCard),
    drawSpeciesCard: wrap(drawSpeciesCard),
    drawSpeciesInfo: wrap(drawSpeciesInfo),
    drawCueRow: wrap(drawCueRow),
    drawPickerPanel: wrap(drawPickerPanel),
    drawBannerFx: wrap(drawBannerFx),
    drawShowArena: function (ctx) { if (!ctx) return; ctx.save(); try { drawShowArena(ctx); } finally { ctx.restore(); } },
    drawShowMonster: wrap(drawShowMonster),
    drawFence: wrap(drawFence),
    drawVisitor: wrap(drawVisitor),
    drawShopTab: wrap(drawShopTab),
    drawShopItem: wrap(drawShopItem),
    drawShopDetail: wrap(drawShopDetail),
    drawButton: wrap(drawButton),
    drawFloatText: wrap(drawFloatText),
    drawResultPanel: wrap(drawResultPanel),
    drawHud: wrap(drawHud),
    drawGuidePage: wrap(drawGuidePage)
  };
})();
