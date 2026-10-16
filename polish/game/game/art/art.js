// 來馬戲團看一點大場面(打磨版第 5 輪)— 美術(Canvas 2D 幾何繪製, 無外部資源)
// 契約見 style.md / interface.json。全域物件 window.Art, 不用 ES module。
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

  // ───────────── 鍵帽 + 含鍵帽的一行字(本輪新增, 所有畫字的函式共用) ─────────────
  // 字串裡 [Z] [X] [C] [↑] [↓] [←] [→] 畫成鍵帽; 〔 〕(o.tagCol 有給時)畫成圓角標籤; 其他字照常畫
  // 鍵帽: 圓角方塊、淺色頂面、深色字、下緣一條較深的厚邊(像實體按鍵); 高 = 字高 + 6
  var KEY_ROT = { '↑': 0, '→': Math.PI / 2, '↓': Math.PI, '←': -Math.PI / 2, up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 };
  function keyCap(ctx, label, cx, cy, h, o) {
    o = o || {};
    var w = h, x = cx - w / 2, y = cy - h / 2, r = Math.max(3, h * 0.22), lip = Math.max(2.5, h * 0.16);
    ctx.save();
    rr(ctx, x, y, w, h, r); ctx.fillStyle = o.lit ? '#1f7a44' : '#7d879c'; ctx.fill();          // 厚邊(下緣)
    rr(ctx, x, y, w, h - lip, r); ctx.fillStyle = o.lit ? P.tutorOk : '#f2f4f9'; ctx.fill();   // 頂面
    rr(ctx, x, y, w, h, r); ctx.strokeStyle = '#1a2030'; ctx.lineWidth = Math.max(1.2, h * 0.06); ctx.stroke();
    var ink = o.lit ? '#ffffff' : '#1a2030', fy = cy - lip / 2;
    var rot = KEY_ROT[label];
    if (rot != null) {
      var k = (h - lip) / 34;
      ctx.translate(cx, fy); ctx.rotate(rot); ctx.scale(k * 1.15, k * 1.15);
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(8, 1.5); ctx.lineTo(3, 1.5); ctx.lineTo(3, 9); ctx.lineTo(-3, 9); ctx.lineTo(-3, 1.5); ctx.lineTo(-8, 1.5); ctx.closePath();
      ctx.fillStyle = ink; ctx.fill();
    } else {
      T(ctx, String(label), cx, fy + 0.5, { size: Math.max(8, Math.round((h - lip) * 0.66)), color: ink, stroke: false });
    }
    ctx.restore();
  }
  function richTokens(str, tags) {
    str = String(str == null ? '' : str);
    var toks = [], i = 0, buf = '';
    function flush() { if (buf) { toks.push({ k: 't', s: buf }); buf = ''; } }
    while (i < str.length) {
      var c = str[i];
      if (c === '[' && str[i + 2] === ']' && /[ZXC↑↓←→]/.test(str[i + 1])) { flush(); toks.push({ k: 'key', s: str[i + 1] }); i += 3; continue; }
      if (tags && c === '〔') { var j = str.indexOf('〕', i + 1); if (j < 0) j = str.length; flush(); toks.push({ k: 'tag', s: str.slice(i + 1, j) }); i = j + 1; continue; }
      buf += c; i++;
    }
    flush();
    return toks;
  }
  function richWidth(ctx, toks, size, weight) {
    ctx.save(); ctx.font = (weight || 'bold') + ' ' + size + 'px ' + FONT;
    var w = 0, kh = size + 6;
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (t.k === 'key') w += kh + 4;
      else if (t.k === 'tag') w += ctx.measureText(t.s).width + 18;
      else w += ctx.measureText(t.s).width;
    }
    ctx.restore();
    return w;
  }
  // o: size, color, align(center | left | right), maxW, stroke, tagCol, weight
  function richLine(ctx, str, x, y, o) {
    o = o || {};
    var toks = richTokens(str, !!o.tagCol);
    if (!toks.length) return 0;
    var size = o.size || 16;
    var w = richWidth(ctx, toks, size, o.weight);
    if (o.maxW && w > o.maxW && w > 0) {
      size = Math.max(9, Math.floor(size * o.maxW / w));
      w = richWidth(ctx, toks, size, o.weight);
      if (w > o.maxW) { size = Math.max(8, Math.floor(size * o.maxW / w)); w = richWidth(ctx, toks, size, o.weight); }
    }
    var al = o.align || 'center', cx = al === 'left' ? x : (al === 'right' ? x - w : x - w / 2), kh = size + 6;
    ctx.save(); ctx.font = (o.weight || 'bold') + ' ' + size + 'px ' + FONT;
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (t.k === 'key') { keyCap(ctx, t.s, cx + 2 + kh / 2, y, kh); cx += kh + 4; }
      else if (t.k === 'tag') {
        var tw = ctx.measureText(t.s).width + 18;
        rr(ctx, cx + 2, y - size * 0.68, tw - 4, size * 1.36, size * 0.5); ctx.fillStyle = o.tagCol; ctx.fill();
        ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5; ctx.stroke();
        T(ctx, t.s, cx + tw / 2, y + 1, { size: size, color: '#ffffff', strokeW: 2.5, weight: o.weight });
        cx += tw;
      } else {
        T(ctx, t.s, cx, y, { size: size, align: 'left', color: o.color || P.text, stroke: o.stroke, weight: o.weight, strokeColor: o.strokeColor });
        cx += ctx.measureText(t.s).width;
      }
    }
    ctx.restore();
    return w;
  }
  // 依空白斷成最多 maxLines 行(每行仍可含鍵帽), 每行各自置中 / 靠左
  function richLines(ctx, str, x, y, o) {
    o = o || {};
    var size = o.size || 16, maxW = o.maxW || 9999, maxLines = o.maxLines || 2, lh = o.lineH || (size + 8);
    var words = String(str == null ? '' : str).split(' '), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var test = cur ? cur + ' ' + words[i] : words[i];
      if (cur && richWidth(ctx, richTokens(test, !!o.tagCol), size) > maxW && lines.length < maxLines - 1) { lines.push(cur); cur = words[i]; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    var y0 = y - (lines.length - 1) * lh / 2;
    for (var k = 0; k < lines.length; k++) richLine(ctx, lines[k], x, y0 + k * lh, o);
    return lines.length;
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
    rep: '#9fd8ff',             // 名聲(星形圖示)
    sat: '#ffd6a8',             // 觀眾滿意度(笑臉圖示; 收場時換成金幣並加進名聲)
    heal: '#5cf0a0',            // 頭上心列的回血光點
    rageLow: '#8390aa', rageMid: '#ffb43a', rageRed: '#ff3b4a',
    ice: '#bfeaff',
    portal1: '#3fe0ff', portal2: '#ff7ad9',
    lily: '#8fe3a0', monkey: '#e8782c', beetle: '#2fb8a8', parrot: '#ec4f9c', penguin: '#3a5a9a', tanuki: '#a88a62',
    heart: '#ff5d7a',
    fruit: '#ff5d7a',           // 回血果子(本輪改: 和心同色 = 吃了回心; 另帶回血綠十字)
    bush: '#2f8a3e', bushHi: '#58c06a', // 草叢(圓葉叢, 無尖角)
    water: '#5ab4ff',           // 回復泉水
    hittable: 'rgba(255,210,74,0.8)', // 金色虛線 = 你打得到 / 打得破的場景物(裂牆、有果子的果樹)
    tutorBg: '#fff6e0', tutorInk: '#1a2030', tutorOk: '#2fb060' // 教學泡泡專用(明暗與全畫面面板反轉)
  };
  var PLACE = {
    dungeon: { name: '地下城', color: '#58b86a' },
    show: { name: '表演', color: '#e0a040' },
    shop: { name: '商店', color: '#7a9ae8' }
  };

  var SP = {
    lily: { name: '鈴蘭精', effect: 'calm' }, monkey: { name: '火柴猴', effect: 'ignite' },
    beetle: { name: '齒輪甲蟲', effect: 'ignite' }, parrot: { name: '標靶鸚鵡', effect: 'target' },
    penguin: { name: '冰柱企鵝', effect: 'freeze' }, tanuki: { name: '戲法狸', effect: 'warp' }
  };
  var SP_ORDER = ['lily', 'monkey', 'beetle', 'parrot', 'penguin', 'tanuki'];
  function spKey(s) { return SP[s] ? s : 'lily'; }
  var EFFECT = {
    ignite: { label: '生氣', color: P.ignite }, calm: { label: '冷靜', color: P.calm },
    target: { label: '標靶', color: P.special }, freeze: { label: '凍住', color: P.special }, warp: { label: '變走', color: P.special }
  };
  function effKey(e) { return EFFECT[e] ? e : ''; }
  var CUE = { wait: '過 6 秒', perf1: '有人表演', angry1: '任一怪物生氣', cold: '冷場', angry3: '三隻怪物生氣', mark3: '有人標記 3', chain3: '連鎖 3', multi3: '一招 3 隻', target1: '有人當標靶', half: '一半生氣', frozen1: '有人被凍住', gain30: '滿意度 +30' };
  var CUE_DESC = { wait: '上一個節目演完 6 秒後', perf1: '有任何一隻表演了', angry1: '有一隻生氣了', cold: '一半以上的魔物冷掉了', angry3: '場上同時有 3 隻生氣', mark3: '有一隻標記到 3 個', chain3: '出現連鎖 3 段的表演', multi3: '有一招打中 3 隻以上', target1: '有一隻正被當成標靶', half: '一半以上的魔物生氣了', frozen1: '有一隻被凍住了', gain30: '這列輪到後觀眾滿意度又多了 30' };
  var PROG = { all: '全體表演', spot: '聚光燈', ice: '冰水桶', pep: '加油棒', tutti: '大合奏', scatter: '散場', mob: '圍攻', lull: '安撫曲', bull: '標靶秀', still: '全場定格', shuffle: '魔術箱', cheer: '歡呼' };
  var PROG_DESC = { all: '大家立刻表演一次', spot: '最氣的那隻連演 3 次', ice: '讓所有生氣的怪物都冷靜一點', pep: '怒氣不到 50 的全部打氣', tutti: '生氣的怪物全部立刻表演', scatter: '大家互相遠離 3 秒', mob: '大家去圍最氣的那隻 3 秒', lull: '有標記的全部冷靜下來', bull: '最冷靜的那隻當標靶 4 秒', still: '全場凍住 1.5 秒', shuffle: '全場洗牌換位置', cheer: '5 秒內觀眾滿意度 ×1.5' };
  var DUN = {
    meadow: { name: '見習草地', sp: ['monkey'], color: '#9ad86a' },
    lake: { name: '鏡湖', sp: ['lily', 'monkey'], color: '#4fb3d9' },
    tower: { name: '齒輪鐘塔', sp: ['beetle', 'parrot'], color: '#d9a84f' },
    snow: { name: '雪境', sp: ['penguin', 'tanuki'], color: '#cfe8ff' }
  };
  function dunKey(d) { return DUN[d] ? d : 'lake'; }
  var WEAPON = { club: '棍棒', sword: '劍', spear: '長槍', rope: '捕捉繩' };
  function wpKey(w) { return WEAPON[w] ? w : 'club'; }
  var ITEM = {
    club: { name: '棍棒', desc: '[Z] 敲擊', kind: 'weapon' },
    sword: { name: '劍', desc: '[Z] 斬擊可打回飛彈 [X] 擊暈', kind: 'weapon' },
    spear: { name: '長槍', desc: '[Z] 長刺 [X] 突進', kind: 'weapon' },
    attack: { name: '攻擊力 +1', desc: '每次攻擊傷害 +1', kind: 'up' },
    armor: { name: '護甲 心 +1', desc: '心上限 +1', kind: 'up' },
    ropeBag: { name: '繩袋 捕捉繩 +1', desc: '每趟捕捉繩 +1', kind: 'up' }
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
      } else if (mode === 'happy') {
        // 吃果子: 瞇眼(往上彎的弧)
        ctx.strokeStyle = P.outline; ctx.lineWidth = Math.max(1.5, r * 0.5); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(x, y + r * 0.5, r * 0.9, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
      } else if (mode === 'shock') {
        // 嚇到僵住: 大白眼 + 小瞳孔
        circle(ctx, x, y, r * 1.15); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = Math.max(1, r * 0.25); ctx.stroke();
        circle(ctx, x, y, r * 0.28); ctx.fillStyle = P.outline; ctx.fill();
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
    } else if (key === 'angry1') {
      // 1 隻: 一團大火 + 底下 1 個圓點(angry3 = 三團小火; half = 半紅半灰的圓)
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.95);
      ctx.quadraticCurveTo(s * 0.7, -s * 0.05, 0, s * 0.45);
      ctx.quadraticCurveTo(-s * 0.7, -s * 0.05, 0, -s * 0.95);
      ctx.fillStyle = P.rageRed; ctx.fill(); ctx.lineWidth = Math.max(1, s * 0.12); ctx.stroke();
      oneDot(ctx, s, W);
    } else if (key === 'perf1') {
      // 有人表演: 一隻(灰點)+ 表演白環(同表演場的表演環)+ 底下 1 個圓點
      circle(ctx, 0, -s * 0.2, s * 0.26); ctx.fillStyle = '#8a94aa'; ctx.fill();
      ctx.lineWidth = Math.max(1.2, s * 0.13);
      ctx.beginPath(); ctx.arc(0, -s * 0.2, s * 0.58, -Math.PI * 0.95, -Math.PI * 0.05); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -s * 0.2, s * 0.58, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
      oneDot(ctx, s, W);
    } else if (key === 'target1') {
      // 有人當標靶: 紫準星(同場上的標靶記號)+ 底下 1 個圓點
      targetMark(ctx, 0, -s * 0.18, s * 0.55, Math.max(1.2, s * 0.14));
      oneDot(ctx, s, W);
    } else if (key === 'frozen1') {
      // 有人被凍住: 一顆冰塊包一隻 + 底下 1 個圓點(全場定格 = 大冰塊包三隻)
      rr(ctx, -s * 0.5, -s * 0.7, s * 1.0, s * 1.0, s * 0.16); ctx.fillStyle = 'rgba(170,226,255,0.55)'; ctx.fill();
      ctx.strokeStyle = '#e6f8ff'; ctx.lineWidth = Math.max(1.2, s * 0.12); ctx.stroke();
      circle(ctx, 0, -s * 0.2, s * 0.2); ctx.fillStyle = '#5a6478'; ctx.fill();
      oneDot(ctx, s, W);
    } else if (key === 'half') {
      // 一半生氣: 圓的左半紅(生氣)、右半灰
      ctx.beginPath(); ctx.moveTo(0, -s * 0.8); ctx.arc(0, 0, s * 0.8, -Math.PI / 2, Math.PI / 2, true); ctx.closePath(); ctx.fillStyle = P.rageRed; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -s * 0.8); ctx.arc(0, 0, s * 0.8, -Math.PI / 2, Math.PI / 2, false); ctx.closePath(); ctx.fillStyle = '#5a6478'; ctx.fill();
      circle(ctx, 0, 0, s * 0.8); ctx.lineWidth = Math.max(1.2, s * 0.12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -s * 0.8); ctx.lineTo(0, s * 0.8); ctx.stroke();
    } else if (key === 'gain30') {
      // 滿意度 +30: 滿意度笑臉 + 往上箭頭
      satFace(ctx, -s * 0.22, s * 0.1, s * 0.58);
      ctx.strokeStyle = W; ctx.lineWidth = Math.max(1.5, s * 0.16);
      ctx.beginPath(); ctx.moveTo(s * 0.68, s * 0.45); ctx.lineTo(s * 0.68, -s * 0.8); ctx.moveTo(s * 0.4, -s * 0.5); ctx.lineTo(s * 0.68, -s * 0.8); ctx.lineTo(s * 0.96, -s * 0.5); ctx.stroke();
    } else if (key === 'angry3') {
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
    } else {
      ctx.setLineDash([s * 0.3, s * 0.25]); rr(ctx, -s * 0.8, -s * 0.8, s * 1.6, s * 1.6, s * 0.2); ctx.globalAlpha *= 0.5; ctx.stroke();
    }
    ctx.restore();
  }
  // 「1 隻」記號: 圖示下方一個白點(angry1 / perf1 / target1 / frozen1 共用)
  function oneDot(ctx, s, col) { circle(ctx, 0, s * 0.82, s * 0.15); ctx.fillStyle = col; ctx.fill(); }
  // 標靶記號(場上、暗號、節目共用): 紫環 + 四向短線 + 白細環
  function targetMark(ctx, x, y, r, lw) {
    circle(ctx, x, y, r); ctx.strokeStyle = P.special; ctx.lineWidth = lw; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - r - lw); ctx.lineTo(x, y - r * 0.6); ctx.moveTo(x, y + r + lw); ctx.lineTo(x, y + r * 0.6);
    ctx.moveTo(x - r - lw, y); ctx.lineTo(x - r * 0.6, y); ctx.moveTo(x + r + lw, y); ctx.lineTo(x + r * 0.6, y); ctx.stroke();
    circle(ctx, x, y, r); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(0.8, lw * 0.35); ctx.stroke();
  }
  // 觀眾滿意度笑臉(HUD、飄字、結算、暗號 gain30、節目 cheer 共用)
  function satFace(ctx, x, y, r) {
    ctx.save();
    circle(ctx, x, y, r); ctx.fillStyle = P.sat; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = Math.max(1, r * 0.14); ctx.stroke();
    circle(ctx, x - r * 0.34, y - r * 0.22, r * 0.12); ctx.fillStyle = P.outline; ctx.fill();
    circle(ctx, x + r * 0.34, y - r * 0.22, r * 0.12); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y + r * 0.02, r * 0.5, Math.PI * 0.18, Math.PI * 0.82); ctx.strokeStyle = P.outline; ctx.lineWidth = Math.max(1, r * 0.16); ctx.lineCap = 'round'; ctx.stroke();
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
    } else if (key === 'all') {
      // 全體表演: 三隻(灰點)各帶表演白環 — 誰都演
      var pts = [[0, -s * 0.42], [-s * 0.52, s * 0.4], [s * 0.52, s * 0.4]];
      for (var pa = 0; pa < 3; pa++) {
        circle(ctx, pts[pa][0], pts[pa][1], s * 0.17); ctx.fillStyle = '#c8d0e0'; ctx.fill();
        circle(ctx, pts[pa][0], pts[pa][1], s * 0.33); ctx.strokeStyle = W; ctx.lineWidth = Math.max(1.2, s * 0.11); ctx.stroke();
      }
    } else if (key === 'bull') {
      // 標靶秀: 冷靜(藍)那隻套上紫準星
      circle(ctx, 0, 0, s * 0.3); ctx.fillStyle = P.calm; ctx.fill();
      targetMark(ctx, 0, 0, s * 0.62, Math.max(1.2, s * 0.15));
    } else if (key === 'still') {
      // 全場定格: 大冰塊包住三隻(有人被凍住 = 小冰塊包一隻)
      rr(ctx, -s * 0.9, -s * 0.7, s * 1.8, s * 1.4, s * 0.2); ctx.fillStyle = 'rgba(170,226,255,0.5)'; ctx.fill();
      ctx.strokeStyle = '#e6f8ff'; ctx.lineWidth = Math.max(1.5, s * 0.13); ctx.stroke();
      for (var si = -1; si <= 1; si++) { circle(ctx, si * s * 0.5, s * 0.08, s * 0.17); ctx.fillStyle = '#5a6478'; ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(-s * 0.72, -s * 0.52); ctx.lineTo(-s * 0.42, -s * 0.52); ctx.lineTo(-s * 0.72, -s * 0.2); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
    } else if (key === 'cheer') {
      // 歡呼: 滿意度笑臉 + 一圈放射短線(= 滿意度加乘)
      ctx.lineWidth = Math.max(1.3, s * 0.13);
      for (var ra = 0; ra < 8; ra++) {
        var an = ra * TAU / 8 - Math.PI / 8;
        ctx.beginPath(); ctx.moveTo(Math.cos(an) * s * 0.66, Math.sin(an) * s * 0.66); ctx.lineTo(Math.cos(an) * s * 0.95, Math.sin(an) * s * 0.95); ctx.stroke();
      }
      satFace(ctx, 0, 0, s * 0.52);
    } else if (key === 'tutti') {
      // 大合奏: 音符; 符頭是生氣紅(= 只有生氣的那幾隻演; 全體表演 = 三個灰點白環)
      ctx.fillStyle = P.rageRed;
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
    if (w === 'rope') { ropeCoil(ctx, x, y, s * 0.5); return; }
    ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 4); ctx.lineCap = 'round';
    paintWeapon(ctx, w, s / 26);
    ctx.restore();
  }
  // 捕捉繩圖示(一捲繩 + 垂下的繩頭小圈): 換武器視窗、HUD 武器框、馴獸師手上共用; r = 捲的半徑
  function ropeCoil(ctx, x, y, r) {
    ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var lw = Math.max(1.6, r * 0.24);
    function loops(col, w) {
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ell(ctx, -r * 0.12, 0, r * 0.82, r * 0.62, -0.25); ctx.stroke();
      ell(ctx, r * 0.05, -r * 0.04, r * 0.62, r * 0.46, -0.25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r * 0.55, r * 0.35); ctx.quadraticCurveTo(r * 0.95, r * 0.55, r * 0.8, r * 0.9); ctx.stroke();
      ell(ctx, r * 0.62, r * 1.02, r * 0.26, r * 0.16, 0.3); ctx.stroke();
    }
    loops(P.outline, lw + 2.2); loops(P.rope, lw);
    ctx.restore();
  }
  // 武器: 握把在原點, 朝 +x; k = 縮放
  function paintWeapon(ctx, w, k) {
    ctx.save(); ctx.scale(k, k);
    ctx.lineCap = 'round'; ctx.strokeStyle = P.outline;
    if (w === 'rope') {
      ropeCoil(ctx, 8, 0, 9);
    } else if (w === 'sword') {
      ctx.fillStyle = '#e6eef8'; ctx.beginPath(); ctx.moveTo(-6, -2.5); ctx.lineTo(18, -2.5); ctx.lineTo(24, 0); ctx.lineTo(18, 2.5); ctx.lineTo(-6, 2.5); ctx.closePath(); ctx.fill(); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#c9a24a'; ctx.fillRect(-7, -6, 3, 12); ctx.fillRect(-14, -1.8, 7, 3.6);
    } else if (w === 'spear') {
      ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(18, 0); ctx.stroke();
      ctx.fillStyle = '#e6eef8'; ctx.beginPath(); ctx.moveTo(16, -4.5); ctx.lineTo(25, 0); ctx.lineTo(16, 4.5); ctx.closePath(); ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.2; ctx.stroke();
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
  // 場所圖示(場所卡、日曆、總結算共用): 地下城 = 石拱洞口; 表演 = 圓頂帳篷; 商店 = 攤子 + 錢袋
  function placeIcon(ctx, place, x, y, s, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= (alpha == null ? 1 : alpha);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = P.outline; ctx.lineWidth = Math.max(1.5, s * 0.08);
    if (place === 'show') {
      ctx.beginPath(); ctx.moveTo(-s * 0.9, s * 0.7); ctx.lineTo(-s * 0.9, -s * 0.05);
      ctx.quadraticCurveTo(-s * 0.6, -s * 0.85, 0, -s * 0.85); ctx.quadraticCurveTo(s * 0.6, -s * 0.85, s * 0.9, -s * 0.05);
      ctx.lineTo(s * 0.9, s * 0.7); ctx.closePath(); ctx.fillStyle = '#f4ecdc'; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.fillStyle = '#e05a4a';
      for (var i = -2; i <= 2; i += 2) ctx.fillRect(i * s * 0.22 - s * 0.11, -s, s * 0.22, s * 1.8);
      ctx.restore(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * 0.28, s * 0.7); ctx.quadraticCurveTo(0, s * 0.05, s * 0.28, s * 0.7); ctx.closePath(); ctx.fillStyle = '#2a1f30'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -s * 0.85); ctx.lineTo(0, -s * 1.1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -s * 1.1); ctx.lineTo(s * 0.3, -s * 1.0); ctx.lineTo(0, -s * 0.92); ctx.closePath(); ctx.fillStyle = PLACE.show.color; ctx.fill();
    } else if (place === 'shop') {
      rr(ctx, -s * 0.85, -s * 0.2, s * 1.7, s * 0.9, s * 0.08); ctx.fillStyle = '#8a6a48'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s, -s * 0.2); ctx.lineTo(-s * 0.8, -s * 0.75); ctx.lineTo(s * 0.8, -s * 0.75); ctx.lineTo(s, -s * 0.2); ctx.closePath();
      ctx.fillStyle = PLACE.shop.color; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; for (var j = 0; j < 3; j++) ctx.fillRect(-s * 0.62 + j * s * 0.5, -s * 0.72, s * 0.22, s * 0.5);
      coinIcon(ctx, 0, s * 0.25, s * 0.28);
    } else { // dungeon
      ctx.beginPath(); ctx.moveTo(-s * 0.95, s * 0.75); ctx.lineTo(-s * 0.95, -s * 0.1); ctx.quadraticCurveTo(-s * 0.95, -s * 0.9, 0, -s * 0.9);
      ctx.quadraticCurveTo(s * 0.95, -s * 0.9, s * 0.95, -s * 0.1); ctx.lineTo(s * 0.95, s * 0.75); ctx.closePath();
      ctx.fillStyle = '#7a8796'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * 0.5, s * 0.75); ctx.lineTo(-s * 0.5, s * 0.05); ctx.quadraticCurveTo(-s * 0.5, -s * 0.45, 0, -s * 0.45);
      ctx.quadraticCurveTo(s * 0.5, -s * 0.45, s * 0.5, s * 0.05); ctx.lineTo(s * 0.5, s * 0.75); ctx.closePath();
      ctx.fillStyle = '#141018'; ctx.fill();
      circle(ctx, -s * 0.17, s * 0.15, s * 0.07); ctx.fillStyle = '#ffe14a'; ctx.fill();
      circle(ctx, s * 0.17, s * 0.15, s * 0.07); ctx.fill();
    }
    ctx.restore();
  }
  function coinIcon(ctx, x, y, r) {
    circle(ctx, x, y, r); ctx.fillStyle = P.gold; ctx.fill(); ctx.strokeStyle = '#8a5a10'; ctx.lineWidth = Math.max(1, r * 0.2); ctx.stroke();
    ctx.fillStyle = '#fff2a0'; ctx.fillRect(x - r * 0.15, y - r * 0.5, r * 0.3, r);
  }
  function repIcon(ctx, x, y, r) {
    starPath(ctx, x, y, r); ctx.fillStyle = P.rep; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = Math.max(1, r * 0.15); ctx.stroke();
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
  // scene: place | select | dungeon | dresult | setup1 | setup2 | sresult | shop | result
  var BG_TINT = { place: 'rgba(224,160,64,0.10)', select: 'rgba(88,184,106,0.10)', dungeon: 'rgba(0,0,0,0)', setup1: 'rgba(255,143,200,0.06)', setup2: 'rgba(90,209,230,0.06)', shop: 'rgba(122,154,232,0.10)' };
  function drawBackground(ctx, s) {
    var scene = S(s && s.scene, 'select');
    ctx.beginPath(); ctx.rect(0, 0, 1280, 720); ctx.clip();
    var g = ctx.createLinearGradient(0, 0, 0, 720);
    g.addColorStop(0, '#1a2030'); g.addColorStop(1, '#10131b');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
    var tint = BG_TINT[scene];
    if (tint) {
      var rg = ctx.createRadialGradient(640, 380, 60, 640, 380, 760);
      rg.addColorStop(0, tint); rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, 1280, 720);
    }
    ctx.save();
    ctx.globalAlpha = 0.06; ctx.strokeStyle = '#8fa0c8'; ctx.lineWidth = 1;
    for (var i = 0; i <= 1480; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - 200, 720); ctx.stroke(); }
    ctx.restore();
    // 結算畫面: 背景壓暗, 讓面板跳出來
    if (scene === 'dresult' || scene === 'sresult' || scene === 'result') {
      ctx.fillStyle = 'rgba(4,6,10,0.6)'; ctx.fillRect(0, 0, 1280, 720);
      var vg = ctx.createRadialGradient(640, 390, 200, 640, 390, 800);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, 1280, 720);
    }
  }

  // ───────────── 地下城: 地格 ─────────────
  var TILE_THEME = {
    meadow: { floor: '#3b5a2e', floor2: '#4a6e38', wall: '#7a6a52', wallTop: '#a8946e', wallDark: '#4e4232', pillar: '#8c7a5c' },
    lake: { floor: '#2a4436', floor2: '#30503f', wall: '#5d6f80', wallTop: '#8296aa', wallDark: '#3c4a58', pillar: '#7a8da0' },
    tower: { floor: '#3a3226', floor2: '#433a2c', wall: '#7a5236', wallTop: '#a0704a', wallDark: '#4e3422', pillar: '#6c7480' },
    snow: { floor: '#34465c', floor2: '#3c5068', wall: '#9fbdd6', wallTop: '#dceeff', wallDark: '#6a88a4', pillar: '#b8d4ea' }
  };
  function paintFloor(ctx, d, h) {
    var th = TILE_THEME[d];
    ctx.fillStyle = th.floor; ctx.fillRect(-h, -h, 2 * h, 2 * h);
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1; ctx.strokeRect(-h + 0.5, -h + 0.5, 2 * h - 1, 2 * h - 1);
    ctx.fillStyle = th.floor2;
    if (d === 'meadow') {
      // 草地: 幾撮圓頭小草(不用尖葉, 尖角留給危險)
      ctx.strokeStyle = th.floor2; ctx.lineWidth = 2; ctx.lineCap = 'round';
      var tufts = [[-0.45, 0.35], [0.4, -0.35], [0.5, 0.55]];
      for (var q = 0; q < 3; q++) { var tx = tufts[q][0] * h, ty = tufts[q][1] * h; ctx.beginPath(); ctx.moveTo(tx - 3, ty); ctx.quadraticCurveTo(tx - 3, ty - 5, tx - 1, ty - 6); ctx.moveTo(tx + 2, ty); ctx.quadraticCurveTo(tx + 2, ty - 6, tx + 4, ty - 7); ctx.stroke(); }
    } else if (d === 'lake') { ell(ctx, -h * 0.4, h * 0.3, h * 0.12, h * 0.05, 0); ctx.fill(); ell(ctx, h * 0.35, -h * 0.4, h * 0.1, h * 0.05, 0); ctx.fill(); }
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
    } else if (kind === 'bush') {
      // 草叢(可以走、能躲): 地板上一叢圓葉, 葉叢之間留暗縫 = 「鑽得進去」; 不用尖葉(尖角 = 危險)
      paintFloor(ctx, d, h);
      ctx.fillStyle = '#1c4a24'; rr(ctx, -h + 3, -h + 3, 2 * h - 6, 2 * h - 6, h * 0.3); ctx.fill();
      var blobs = [[-0.5, -0.5], [0.05, -0.6], [0.55, -0.45], [-0.6, 0.05], [0, 0], [0.58, 0.08], [-0.45, 0.55], [0.1, 0.6], [0.6, 0.6]];
      for (var b = 0; b < blobs.length; b++) {
        var bx2 = blobs[b][0] * h, by2 = blobs[b][1] * h;
        ell(ctx, bx2, by2, h * 0.32, h * 0.27, 0); ctx.fillStyle = P.bush; ctx.fill();
        ell(ctx, bx2 - h * 0.06, by2 - h * 0.08, h * 0.16, h * 0.1, -0.4); ctx.fillStyle = P.bushHi; ctx.fill();
      }
      ctx.strokeStyle = 'rgba(200,255,190,0.35)'; ctx.lineWidth = 1.5; rr(ctx, -h + 3, -h + 3, 2 * h - 6, 2 * h - 6, h * 0.3); ctx.stroke();
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
    if (['wall', 'pillar', 'floor', 'hurt', 'slow', 'bush'].indexOf(kind) < 0) kind = 'floor';
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

  // ───────────── 互動物件(鏡湖: 果樹 / 果子; 鐘塔: 爆炸桶 / 爆炸; 雪境: 回復泉) ─────────────
  // 回血果子(樹上 / 地上同一個長相): 心色圓果 + 葉 + 右上回血綠十字(= 吃了回心)
  function fruitShape(ctx, x, y, r) {
    circle(ctx, x, y, r); ctx.fillStyle = P.fruit; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.18); ctx.strokeStyle = P.outline; ctx.stroke();
    circle(ctx, x - r * 0.35, y - r * 0.35, r * 0.25); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
    ell(ctx, x - r * 0.3, y - r * 0.95, r * 0.45, r * 0.22, 0.5); ctx.fillStyle = '#5ad06a'; ctx.fill();
    // 回血十字
    var cx = x + r * 0.62, cy = y - r * 0.62, a = r * 0.42, b = r * 0.15;
    ctx.beginPath();
    ctx.moveTo(cx - b, cy - a); ctx.lineTo(cx + b, cy - a); ctx.lineTo(cx + b, cy - b); ctx.lineTo(cx + a, cy - b); ctx.lineTo(cx + a, cy + b); ctx.lineTo(cx + b, cy + b);
    ctx.lineTo(cx + b, cy + a); ctx.lineTo(cx - b, cy + a); ctx.lineTo(cx - b, cy + b); ctx.lineTo(cx - a, cy + b); ctx.lineTo(cx - a, cy - b); ctx.lineTo(cx - b, cy - b); ctx.closePath();
    ctx.fillStyle = P.heal; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = Math.max(1, r * 0.1); ctx.stroke();
  }
  function drawFruitTree(ctx, s) {
    var d = dunKey(s.dungeon), has = B(s.hasFruit);
    ctx.translate(N(s.x, 0), N(s.y, 0));
    ell(ctx, 0, 22, 24, 6, 0); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
    rr(ctx, -5, 4, 10, 22, 2); ctx.fillStyle = '#6a4024'; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 2; ctx.stroke();
    // 樹冠: 三團圓(比牆亮、圓 → 一眼分開「牆」與「能打的樹」)
    ctx.fillStyle = '#4fae52';
    circle(ctx, -12, -4, 14); ctx.fill(); circle(ctx, 12, -4, 14); ctx.fill(); circle(ctx, 0, -13, 15); ctx.fill();
    ctx.strokeStyle = P.outline; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(-12, -4, 14, 1.6, 4.3); ctx.stroke();
    ctx.beginPath(); ctx.arc(12, -4, 14, -1.2, 1.55); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -13, 15, 3.6, 5.85); ctx.stroke();
    circle(ctx, -14, -12, 3); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
    if (has) {
      // 有果子: 金色虛線圈(= 你打得到)+ 大果
      ctx.save(); ctx.setLineDash([3, 3]); circle(ctx, 0, -6, 15); ctx.strokeStyle = P.hittable; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore();
      fruitShape(ctx, 0, -5, 9);
    } else {
      // 沒果子: 只剩小綠芽
      circle(ctx, 0, -6, 3.5); ctx.fillStyle = '#9ae07a'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#2f6a2a'; ctx.stroke();
    }
  }
  // 地上的回血果子 30×30: 果子 + 淡綠光暈脈動(= 撿得到的回血道具); 沒有被吃的動畫(吃掉時 RD 直接不呼叫)
  function drawFruit(ctx, s) {
    ctx.translate(N(s.x, 0), N(s.y, 0));
    var pulse = 0.5 + 0.5 * Math.sin(now() / 260);
    circle(ctx, 0, 0, 14); ctx.fillStyle = 'rgba(92,240,160,' + (0.10 + 0.12 * pulse).toFixed(3) + ')'; ctx.fill();
    circle(ctx, 0, 0, 13.5); ctx.strokeStyle = 'rgba(92,240,160,' + (0.45 + 0.4 * pulse).toFixed(3) + ')'; ctx.lineWidth = 1.5; ctx.stroke();
    ell(ctx, 0, 10, 8, 2.5, 0); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    fruitShape(ctx, -1, 1, 8.5);
  }
  function drawKeg(ctx, s) {
    // 炸掉後 RD 不再呼叫(本輪拿掉 gone 焦痕); 表外 mode 一律畫成 ok
    var mode = S(s.mode, 'ok') === 'fuse' ? 'fuse' : 'ok';
    // 引信總長由 fuseDur 傳(本輪 1.0); 所有動畫都用 fuseT / fuseDur 比例, 不寫死秒數
    var p = mode === 'fuse' ? p01(s.fuseT, N(s.fuseDur, 1.0) || 1.0) : 0;
    var R = Math.max(1, N(s.radius, 130) || 130);
    ctx.translate(N(s.x, 0), N(s.y, 0));
    if (mode === 'fuse') {
      // 爆炸範圍預警(超出本體框, 範圍 260×260): 紅虛線圈 = 外緣 130, 紅色由中心長大, 長滿 = 爆炸
      ctx.save();
      circle(ctx, 0, 0, R); ctx.fillStyle = 'rgba(255,59,74,0.10)'; ctx.fill();
      circle(ctx, 0, 0, R * p); ctx.fillStyle = 'rgba(255,59,74,0.22)'; ctx.fill();
      ctx.setLineDash([12, 8]); ctx.lineDashOffset = -now() / 30;
      circle(ctx, 0, 0, R - 1.5); ctx.strokeStyle = P.danger; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    }
    var shake = mode === 'fuse' ? Math.sin(p * 60) * (0.5 + p) : 0;
    ctx.translate(shake, 0);
    ell(ctx, 0, 18, 20, 6, 0); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
    // 桶身(寬 44 = 判定直徑)
    ctx.beginPath(); ctx.moveTo(-18, -20); ctx.quadraticCurveTo(-23, 0, -18, 20); ctx.lineTo(18, 20); ctx.quadraticCurveTo(23, 0, 18, -20); ctx.closePath();
    ctx.fillStyle = mode === 'fuse' ? (Math.floor(p * 8) % 2 ? '#ff4a3d' : '#a8552a') : '#a8552a';
    ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(-21, -12, 42, 5); ctx.fillRect(-21, 7, 42, 5);
    // 危險記號: 黑底火焰
    circle(ctx, 0, -1, 7); ctx.fillStyle = P.outline; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-3, 3); ctx.quadraticCurveTo(-4, -2, 0, -6); ctx.quadraticCurveTo(4, -2, 3, 3); ctx.closePath(); ctx.fillStyle = '#ffb340'; ctx.fill();
    // 引信(燒短)
    var fuseLen = mode === 'fuse' ? 4 * (1 - p) : 4;
    ctx.strokeStyle = '#e8d2a0'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(4, -20); ctx.lineTo(4 + fuseLen * 0.5, -20 - fuseLen); ctx.stroke();
    if (mode === 'fuse') {
      starPath(ctx, 4 + fuseLen * 0.5, -20 - fuseLen, 3.5 + p * 1.5); ctx.fillStyle = '#ffe14d'; ctx.fill();
      circle(ctx, 0, 0, 24 + p * 2); ctx.strokeStyle = 'rgba(255,74,61,' + (0.35 + p * 0.6).toFixed(2) + ')'; ctx.lineWidth = 2 + p * 2; ctx.stroke();
    }
  }
  function drawBlast(ctx, s) {
    var R = Math.max(1, N(s.radius, 130) || 130), p = p01(s.t, N(s.dur, 0.3) || 0.3), a = 1 - p;
    ctx.translate(N(s.x, 0), N(s.y, 0));
    // 外緣 = 判定外緣 130
    ctx.save(); ctx.globalAlpha *= 0.5 * a + 0.1; circle(ctx, 0, 0, R); ctx.fillStyle = P.danger; ctx.fill(); ctx.restore();
    ctx.save(); ctx.globalAlpha *= 0.8 * a; circle(ctx, 0, 0, R * (0.35 + 0.5 * p)); ctx.fillStyle = '#ffe14d'; ctx.fill(); ctx.restore();
    ctx.globalAlpha *= a;
    circle(ctx, 0, 0, R - 2); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (var i = 0; i < 10; i++) {
      var ang = i * Math.PI / 5 + 0.3;
      ctx.beginPath(); ctx.moveTo(Math.cos(ang) * R * (0.4 + 0.3 * p), Math.sin(ang) * R * (0.4 + 0.3 * p)); ctx.lineTo(Math.cos(ang) * R * (0.6 + 0.35 * p), Math.sin(ang) * R * (0.6 + 0.35 * p)); ctx.stroke();
    }
    if (B(s.killer)) {
      // 致命的那次爆炸(倒下定格中): 不隨 t 淡掉, 外緣白 + 黃雙圈脈動(= 就是它)
      ctx.globalAlpha = 1;
      var kp = 0.5 + 0.5 * Math.sin(now() / 90);
      circle(ctx, 0, 0, R - 3); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.stroke();
      circle(ctx, 0, 0, R - 10); ctx.strokeStyle = 'rgba(255,225,77,' + (0.5 + 0.5 * kp).toFixed(2) + ')'; ctx.lineWidth = 4 + 3 * kp; ctx.stroke();
    }
  }
  function drawFountain(ctx, s) {
    var full = B(s.full);
    ctx.translate(N(s.x, 0), N(s.y, 0));
    ell(ctx, 0, 4, 27, 20, 0); ctx.fillStyle = full ? '#b9b2c8' : '#7a7468'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = P.outline; ctx.stroke();
    ell(ctx, 0, 4, 20, 14, 0); ctx.fillStyle = full ? P.water : '#4a3c2c'; ctx.fill();
    if (full) {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(-4, 6, 8, 3, 0, Math.PI, TAU); ctx.stroke();
      // 噴水 + 心(= 補心)
      ctx.strokeStyle = '#d8f0ff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(0, -16, -10, -10); ctx.moveTo(0, 2); ctx.quadraticCurveTo(0, -16, 10, -10); ctx.stroke();
      var bob = Math.sin(now() / 300) * 1.5;
      heartPath(ctx, 0, -19 + bob, 7); ctx.fillStyle = P.heart; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = P.outline; ctx.stroke();
    } else {
      // 乾掉: 泥色 + 裂紋, 沒有心
      ctx.strokeStyle = '#21180e'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-12, 2); ctx.lineTo(-3, 8); ctx.lineTo(4, 3); ctx.lineTo(12, 9); ctx.moveTo(-3, 8); ctx.lineTo(-5, 14); ctx.stroke();
    }
  }

  // ───────────── 出口(鏡湖 / 鐘塔 / 雪境各一) ─────────────
  // 60×60 格內: 地板 + 石砌拱門框 + 門洞裡往上的台階與外頭的天光 + 白色圓頭往上箭頭(= 往外走)
  // 和牆(整塊實心)、傳送陣(地上的環 + 點數)、草叢(圓葉)分開: 只有出口是「拱門 + 亮的門洞 + 箭頭」
  // armed false(剛選留下、還沒走開 150): 門洞變暗、箭頭變灰、門框不發光 → 看得出暫時不會再問
  var EXIT_SKY = '#ffeebb';
  function drawExit(ctx, s) {
    var d = dunKey(s.dungeon), armed = B(s.armed);
    var th = TILE_THEME[d], h = 30;
    ctx.translate(N(s.x, 0), N(s.y, 0));
    paintFloor(ctx, d, h);
    // 拱門框(石)
    ctx.beginPath(); ctx.moveTo(-26, 28); ctx.lineTo(-26, -6); ctx.quadraticCurveTo(-26, -28, 0, -28); ctx.quadraticCurveTo(26, -28, 26, -6); ctx.lineTo(26, 28); ctx.closePath();
    ctx.fillStyle = th.wall; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = th.wallTop; ctx.fillRect(-26, 22, 8, 6); ctx.fillRect(18, 22, 8, 6);
    // 門洞
    ctx.beginPath(); ctx.moveTo(-17, 28); ctx.lineTo(-17, -3); ctx.quadraticCurveTo(-17, -19, 0, -19); ctx.quadraticCurveTo(17, -19, 17, -3); ctx.lineTo(17, 28); ctx.closePath();
    ctx.save(); ctx.clip();
    if (armed) {
      var g = ctx.createLinearGradient(0, -19, 0, 28);
      g.addColorStop(0, EXIT_SKY); g.addColorStop(0.55, '#e8c070'); g.addColorStop(1, '#6a5030');
      ctx.fillStyle = g;
    } else ctx.fillStyle = '#2a2a32';
    ctx.fillRect(-17, -19, 34, 47);
    // 往上的台階(越上越窄、越亮)
    for (var k = 0; k < 4; k++) {
      var yy = 24 - k * 8, w = 30 - k * 5;
      ctx.fillStyle = armed ? 'rgba(80,56,30,' + (0.75 - k * 0.15).toFixed(2) + ')' : 'rgba(10,10,14,' + (0.7 - k * 0.12).toFixed(2) + ')';
      ctx.fillRect(-w / 2, yy - 3, w, 4);
    }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-17, 28); ctx.lineTo(-17, -3); ctx.quadraticCurveTo(-17, -19, 0, -19); ctx.quadraticCurveTo(17, -19, 17, -3); ctx.lineTo(17, 28);
    ctx.strokeStyle = armed ? '#fff6d8' : '#5a5a66'; ctx.lineWidth = 2; ctx.stroke();
    // 往外(往上)的圓頭箭頭
    var bob = armed ? Math.sin(now() / 260) * 2 : 0;
    ctx.save(); ctx.translate(0, bob);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = P.outline; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, -10); ctx.moveTo(-8, -2); ctx.lineTo(0, -10); ctx.lineTo(8, -2); ctx.stroke();
    ctx.strokeStyle = armed ? '#ffffff' : '#8a8e9a'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, -10); ctx.moveTo(-8, -2); ctx.lineTo(0, -10); ctx.lineTo(8, -2); ctx.stroke();
    ctx.restore();
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
  // 倒下後躺平的樣子(80×48 內, 以中心為準): 頭朝背後那側、身體壓扁成橫的、武器掉在旁邊、頭上轉小星星
  function paintLying(ctx, s) {
    var f = clamp(Math.floor(N(s.facing, 0)), 0, 7); if (!isFinite(f)) f = 0;
    var fx = Math.cos(-Math.PI / 2 + f * Math.PI / 4);
    var sgn = fx > 0.1 ? 1 : (fx < -0.1 ? -1 : 1); // 面向右 → 往後(左)倒, 頭在左
    ctx.save(); ctx.scale(sgn, 1);
    ell(ctx, 2, 14, 34, 7, 0); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    ctx.save(); ctx.translate(16, 13); ctx.rotate(0.25); paintWeapon(ctx, wpKey(s.weapon), 0.62); ctx.restore();
    ell(ctx, 6, 0, 22, 15, 0); ctx.fillStyle = P.tamer; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(6, 0, 21, 14, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
    circle(ctx, -22, 1, 10); ctx.fillStyle = '#f4d2a8'; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(-22, 1, 9.5, Math.PI * 0.5, Math.PI * 1.5); ctx.fillStyle = '#6a3e22'; ctx.fill();
    // 叉叉眼
    ctx.strokeStyle = P.outline; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    var ex = [[-20, -3], [-20, 5]];
    for (var i = 0; i < 2; i++) { var a = ex[i][0], b = ex[i][1]; ctx.beginPath(); ctx.moveTo(a - 2, b - 2); ctx.lineTo(a + 2, b + 2); ctx.moveTo(a + 2, b - 2); ctx.lineTo(a - 2, b + 2); ctx.stroke(); }
    ctx.restore();
    var tt = now() / 1000;
    for (var k = 0; k < 3; k++) {
      var an = tt * 4 + k * TAU / 3;
      starPath(ctx, sgn * -22 + Math.cos(an) * 10, -17 + Math.sin(an) * 2.5, 3.2);
      ctx.fillStyle = '#fff07a'; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1; ctx.stroke();
    }
  }
  function drawTamer(ctx, s) {
    ctx.translate(N(s.x, 0), N(s.y, 0));
    if (B(s.down)) {
      // 倒下動畫: 0~0.3 秒定格(站著、受擊閃白); 0.3~0.8 秒往後倒(站姿轉倒淡出、躺姿淡入); 之後躺平
      var dd = N(s.downDur, 1.5) > 0 ? N(s.downDur, 1.5) : 1.5, dt = clamp(N(s.downT, 0), 0, dd);
      var s2 = {}; for (var key in s) s2[key] = s[key]; s2.blink = false; s2.dashing = false;
      if (dt < 0.3) {
        paintTamer(ctx, s2);
        var fl = 0.55 + 0.35 * Math.sin(now() / 45);
        circle(ctx, 0, 0, 18); ctx.fillStyle = 'rgba(255,255,255,' + fl.toFixed(2) + ')'; ctx.fill();
        return;
      }
      var q = clamp((dt - 0.3) / 0.5, 0, 1), e = 1 - Math.pow(1 - q, 2);
      if (q < 1) {
        var f0 = clamp(Math.floor(N(s.facing, 0)), 0, 7); if (!isFinite(f0)) f0 = 0;
        var fxs = Math.cos(-Math.PI / 2 + f0 * Math.PI / 4), sg = fxs < -0.1 ? 1 : -1;
        ctx.save(); ctx.globalAlpha *= 1 - e; ctx.rotate(sg * e * Math.PI / 2 * 0.8); ctx.scale(1, 1 - 0.3 * e); paintTamer(ctx, s2); ctx.restore();
      }
      ctx.save(); ctx.globalAlpha *= e; paintLying(ctx, s2); ctx.restore();
      return;
    }
    var hid = B(s.hidden);
    ctx.save(); if (hid) ctx.globalAlpha *= 0.45; paintTamer(ctx, s); ctx.restore();
    if (hid) {
      // 躲在草叢: 身體半透明 + 前方蓋幾片圓葉; 白虛線圈 = 判定圓(半徑 18), 玩家仍看得到自己的位置
      var lv = [[-14, 12], [0, 15], [14, 12], [-8, 4], [9, 5]];
      for (var i = 0; i < lv.length; i++) { ell(ctx, lv[i][0], lv[i][1], 9, 7, 0); ctx.fillStyle = P.bush; ctx.fill(); ell(ctx, lv[i][0] - 2, lv[i][1] - 2, 4, 2.5, -0.4); ctx.fillStyle = P.bushHi; ctx.fill(); }
      ctx.save(); ctx.setLineDash([4, 3]); circle(ctx, 0, 0, 18); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    }
  }

  // ───────────── 頭上心列(馴獸師頭上, 平時半透明, 增減時轉不透明並播特效) ─────────────
  // 每顆心 14×13(heartPath s = 8.8 時約 13.2 × 12.8), 中心 = 槽位中心
  var HS = 8.8;
  function heartSlot(ctx, x, y, full, sc) {
    sc = sc == null ? 1 : sc;
    heartPath(ctx, x, y - 1, HS * sc);
    if (full) { ctx.fillStyle = P.heart; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5; ctx.stroke(); }
    else { ctx.fillStyle = 'rgba(16,20,30,0.85)'; ctx.fill(); ctx.strokeStyle = P.heart; ctx.lineWidth = 1.5; ctx.stroke(); }
  }
  function drawHeartBar(ctx, s) {
    var x = N(s.x, 0), y = N(s.y, 0);
    var mh = clamp(Math.floor(N(s.maxHearts, 6)), 0, 30), h = clamp(Math.floor(N(s.hearts, 0)), 0, mh);
    if (mh <= 0) return;
    var fx = S(s.fx, 'none'); if (fx !== 'hurt' && fx !== 'heal') fx = 'none';
    var dur = N(s.fxDur, 2) > 0 ? N(s.fxDur, 2) : 2, t = clamp(N(s.fxT, dur), 0, dur);
    var k15 = dur * 0.75; // 1.5 / 2.0
    var alpha = (fx === 'none' || t >= dur) ? 0.4 : (t < k15 ? 1 : 1 - 0.6 * (t - k15) / (dur - k15));
    var delta = fx === 'none' ? 0 : Math.max(0, Math.floor(N(s.delta, 0)));
    var gap = mh > 12 ? 13 : 16;
    if ((mh - 1) * gap + 14 > 200) gap = (200 - 14) / (mh - 1);
    var x0 = x - (mh - 1) * gap / 2;
    var shake = (fx === 'hurt' && t < 0.5) ? Math.sin(t * 70) * 3 * (1 - t / 0.5) : 0;
    ctx.globalAlpha *= alpha;
    for (var i = 0; i < mh; i++) {
      var hx = x0 + i * gap + shake;
      var full = i < h, sc = 1;
      if (fx === 'heal' && t < 0.6 && i >= h - delta && i < h) {
        // 補回的心依序從空變滿(每顆晚 0.12 秒, 變滿那一下彈一點)
        var fi = (t - (i - (h - delta)) * 0.12) / 0.15;
        if (fi < 0) full = false;
        else if (fi < 1) sc = 1 + 0.25 * Math.sin(Math.PI * fi);
      }
      heartSlot(ctx, hx, y, full, sc);
    }
    if (fx === 'hurt' && t < 0.5) {
      // 掉的那幾顆碎成紅色碎片往下噴(尖碎片 = 受傷, 危險語言)
      var q = t / 0.5;
      for (var j = h; j < Math.min(mh, h + delta); j++) {
        var cx = x0 + j * gap + shake;
        var shards = [[-5, -3, -0.6], [4, -3, 0.5], [-3, 3, -0.2], [3, 3, 0.3]];
        ctx.save(); ctx.globalAlpha *= 1 - q;
        for (var m = 0; m < 4; m++) {
          var sx = cx + shards[m][0] + shards[m][2] * 22 * q, sy = y + shards[m][1] + 18 * q * q + 4 * q;
          ctx.beginPath(); ctx.moveTo(sx - 3, sy - 2.5); ctx.lineTo(sx + 3.5, sy - 1); ctx.lineTo(sx - 0.5, sy + 3.5); ctx.closePath();
          ctx.fillStyle = P.danger; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1; ctx.stroke();
        }
        ctx.restore();
      }
    }
    if (fx === 'heal' && t < 0.6) {
      // 補回的心冒綠色小光點往上飄
      var q2 = t / 0.6;
      for (var g = Math.max(0, h - delta); g < h; g++) {
        var gx = x0 + g * gap;
        for (var p = 0; p < 3; p++) {
          var pq = clamp(q2 * 1.2 - p * 0.12, 0, 1);
          if (pq <= 0 || pq >= 1) continue;
          circle(ctx, gx + (p - 1) * 4, y - 6 - pq * 22, 2.2 * (1 - pq * 0.4));
          ctx.fillStyle = P.heal; ctx.fill();
        }
      }
    }
  }

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
    var wind = B(s.windup) && !stunned;
    var em = stunned ? 'dizzy' : (weak ? 'weak' : ((B(s.casting) || wind) ? 'angry' : 'normal'));
    // 掙脫抖動: 繩子打中沒虛弱的魔物 → 左右抖 0.4 秒
    var escD = N(s.escapeDur, 0.4) > 0 ? N(s.escapeDur, 0.4) : 0.4, escT = N(s.escapeT, escD), escaping = escT < escD && escT >= 0;
    var ep = escaping ? escT / escD : 1;
    if (escaping) ctx.translate(Math.sin(ep * Math.PI * 6) * 4 * (1 - ep), 0);
    paintSpecies(ctx, sp, R, { dir: dir, eyes: em });
    if (weak) { // 殘血: 本體蒙一層灰 + 破心(捕捉色)
      ctx.save(); ctx.globalAlpha *= 0.28; paintSpecies(ctx, sp, R, { dir: dir, flat: '#8a90a0' }); ctx.restore();
    }
    if (wind) {
      // 前搖: 身體閃暖亮色, 越接近放出越亮
      var wq = p01(s.windupT, s.windupDur);
      var wf = (0.18 + 0.5 * wq) * (0.7 + 0.3 * Math.sin(now() / 45));
      ctx.save(); ctx.globalAlpha *= clamp(wf, 0, 0.8); paintSpecies(ctx, sp, R, { dir: dir, flat: '#ffe9a0' }); ctx.restore();
    }
    if (B(s.hit)) { ctx.save(); ctx.globalAlpha *= 0.85; paintSpecies(ctx, sp, R, { dir: dir, flat: '#ffffff' }); ctx.restore(); }
    if (escaping) {
      // 「彈開」: 繩色短弧往外彈 + 三條白色迸線(都在本體框內, 半徑 ≤ R + 8)
      ctx.save(); ctx.globalAlpha *= 1 - ep; ctx.lineCap = 'round';
      var er = R * 0.9 + 7 * ep;
      for (var ea = 0; ea < 4; ea++) {
        var a0 = -Math.PI * 0.85 + ea * Math.PI * 0.55;
        ctx.beginPath(); ctx.arc(0, 0, er, a0, a0 + 0.45); ctx.strokeStyle = P.outline; ctx.lineWidth = 5; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, er, a0, a0 + 0.45); ctx.strokeStyle = P.rope; ctx.lineWidth = 3; ctx.stroke();
      }
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      for (var eb = 0; eb < 3; eb++) {
        var ab = -Math.PI / 2 + (eb - 1) * 0.6;
        ctx.beginPath(); ctx.moveTo(Math.cos(ab) * (R * 0.85), Math.sin(ab) * (R * 0.85)); ctx.lineTo(Math.cos(ab) * (R + 6), Math.sin(ab) * (R + 6)); ctx.stroke();
      }
      ctx.restore();
    }
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
    ctx.save();
    ctx.globalAlpha *= Math.max(0.4, mv.alpha);
    hpBar(ctx, x, y - (isT ? 55 : 46), s.hp, s.maxHp, B(s.weak));
    ctx.restore();
    var stunned = N(s.stunLeft, 0) > 0 || B(s.lassoed);
    if (B(s.windup) && !stunned) {
      var wq = p01(s.windupT, s.windupDur);
      // 朝瞄準方向的短箭頭(根部離中心 30、長 60、寬 16; 冰柱企鵝 aim 為 null 不畫)
      var aim = s.aim;
      if (typeof aim === 'number' && isFinite(aim) && sp !== 'penguin') {
        ctx.save(); ctx.translate(x, y); ctx.rotate(aim);
        ctx.globalAlpha *= 0.75 + 0.25 * Math.sin(now() / 60);
        ctx.beginPath(); ctx.moveTo(30, -3); ctx.lineTo(72, -3); ctx.lineTo(72, -8); ctx.lineTo(90, 0); ctx.lineTo(72, 8); ctx.lineTo(72, 3); ctx.lineTo(30, 3); ctx.closePath();
        ctx.lineJoin = 'round'; ctx.strokeStyle = P.outline; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = P.danger; ctx.fill();
        ctx.restore();
      }
      // 頭上「!」(20×24, 中心 (x, y − 64); 戲法狸 y − 73): 危險紅圓角牌 + 白色圓頭驚嘆號; 出現時由小彈到原大
      var my = y - (isT ? 73 : 64), ms = wq < 0.15 ? 0.5 + 0.5 * (wq / 0.15) : 1;
      ctx.save(); ctx.translate(x, my); ctx.scale(ms, ms);
      rr(ctx, -9, -11, 18, 22, 5.5); ctx.fillStyle = P.danger; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 2; ctx.stroke();
      rr(ctx, -2.2, -8.5, 4.4, 11, 2.2); ctx.fillStyle = '#ffffff'; ctx.fill();
      circle(ctx, 0, 6.5, 2.5); ctx.fill();
      ctx.restore();
    }
  }

  // ───────────── 丟出去的捕捉繩 / 套索 ─────────────
  // 繩: 從馴獸師手上(1)到繩頭(2)一條繩; 繩頭 = 張開的繩圈 32×32(out), 收回時繩圈收成小結(back)
  function drawRopeThrow(ctx, s) {
    var x1 = N(s.x1, 0), y1 = N(s.y1, 0), x2 = N(s.x2, 0), y2 = N(s.y2, 0);
    var back = S(s.phase, 'out') === 'back', p = p01(s.t, s.dur);
    var ang = Math.atan2(y2 - y1, x2 - x1) || 0;
    var mx = (x1 + x2) / 2 + Math.sin(ang) * 6, my = (y1 + y2) / 2 - Math.cos(ang) * 6;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.strokeStyle = 'rgba(10,13,20,0.8)'; ctx.lineWidth = 5.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.strokeStyle = P.rope; ctx.lineWidth = 3; ctx.stroke();
    var open = back ? 1 - p : 1;
    var rx = 4 + 7 * open, ry = 3.5 + 6.5 * open;
    ctx.save(); ctx.translate(x2, y2); ctx.rotate(ang);
    ell(ctx, rx * 0.2, 0, rx, ry, 0); ctx.strokeStyle = 'rgba(10,13,20,0.85)'; ctx.lineWidth = 6; ctx.stroke();
    ell(ctx, rx * 0.2, 0, rx, ry, 0); ctx.strokeStyle = P.rope; ctx.lineWidth = 3.2; ctx.stroke();
    circle(ctx, -rx * 0.55, 0, 3); ctx.fillStyle = P.rope; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.2; ctx.stroke();
    if (!back) {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-rx * 0.6 - 4, -ry - 1); ctx.lineTo(-rx * 0.6 - 2, -ry + 3); ctx.moveTo(-rx * 0.6 - 4, ry + 1); ctx.lineTo(-rx * 0.6 - 2, ry - 3); ctx.stroke();
    }
    ctx.restore();
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
      if (B(s.killer)) {
        // 致命的那一下(倒下定格中): 白 + 黃雙框脈動
        var kb = 0.5 + 0.5 * Math.sin(now() / 90);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.strokeRect(-2, -W / 2 - 2, L + 4, W + 4);
        ctx.strokeStyle = 'rgba(255,225,77,' + (0.5 + 0.5 * kb).toFixed(2) + ')'; ctx.lineWidth = 3 + 3 * kb; ctx.strokeRect(-7, -W / 2 - 7, L + 14, W + 14);
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
      // 直線火柴(本輪改): 不旋轉, 火頭朝飛行方向, 尾端兩條速度線(都在判定圓內)
      ctx.save(); ctx.rotate(ang);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-ri * 0.95, -ri * 0.38); ctx.lineTo(-ri * 0.45, -ri * 0.38); ctx.moveTo(-ri * 0.95, ri * 0.38); ctx.lineTo(-ri * 0.45, ri * 0.38); ctx.stroke();
      ctx.fillStyle = refl ? '#fff4c0' : '#e8d3a0'; ctx.fillRect(-ri * 0.8, -ri * 0.14, ri * 1.35, ri * 0.28);
      circle(ctx, ri * 0.58, 0, ri * 0.34); ctx.fillStyle = '#ff4a2a'; ctx.fill();
      circle(ctx, ri * 0.66, 0, ri * 0.16); ctx.fillStyle = '#ffe14a'; ctx.fill();
      ctx.restore();
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
    if (B(s.killer)) {
      // 致命的那一發(倒下定格中): 判定圓外加白 + 黃雙圈脈動
      var kp = 0.5 + 0.5 * Math.sin(now() / 90);
      circle(ctx, 0, 0, r + 3); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
      circle(ctx, 0, 0, r + 7 + 2 * kp); ctx.strokeStyle = 'rgba(255,225,77,' + (0.55 + 0.45 * kp).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.stroke();
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
    if (shape === 'line') {
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
    var spc = d === 'lake' ? 'bush' : (d === 'meadow' ? 'floor' : 'hurt'), slw = d === 'meadow' ? 'floor' : 'slow';
    var lay = [['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'], ['floor', 'floor', slw, 'floor', 'pillar', 'floor', spc, 'floor'], ['floor', 'floor', 'floor', 'floor', 'floor', slw, spc, 'floor']];
    for (var r = 0; r < 3; r++) for (var c = 0; c < 8; c++) { ctx.save(); ctx.translate(c * 40, r * 40 + 5); paintTile(ctx, d, lay[r][c], false, 20); ctx.restore(); }
    ctx.restore();
    ctx.save(); ctx.strokeStyle = P.line; ctx.lineWidth = 2; rr(ctx, -160, -138, 320, 130, 8); ctx.stroke(); ctx.restore();
    // 住的兩種魔物
    for (var i = 0; i < info.sp.length; i++) {
      var sp = info.sp[i], cx = info.sp.length === 1 ? 0 : (i === 0 ? -80 : 80);
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
  // 怪物庫的一格(一隻)104×110
  var ONSTAGE = '#9fe8ff'; // 上場: 淺青亮框 + 勾(金框保留給游標)
  function drawBankSlot(ctx, s) {
    var sp = spKey(s.species), on = B(s.onStage);
    var num = Math.max(0, Math.floor(N(s.num, 1)));
    ctx.translate(N(s.x, 0), N(s.y, 0));
    panel(ctx, -52, -55, 104, 110, 10, on ? P.panelHi : '#1c2130', on ? ONSTAGE : '#353d52');
    if (on) { rr(ctx, -50, -53, 100, 106, 9); ctx.strokeStyle = 'rgba(159,232,255,0.35)'; ctx.lineWidth = 2; ctx.stroke(); }
    // 頭像(效果標籤已拿掉, 頭像放大、往下移一點)
    circle(ctx, 0, -10, 29); ctx.fillStyle = '#141925'; ctx.fill();
    ctx.save(); ctx.translate(sp === 'tanuki' ? 7 : 0, -10); if (!on) ctx.globalAlpha *= 0.55;
    paintSpecies(ctx, sp, sp === 'tanuki' ? 20 : 24, {}); ctx.restore();
    // 上場勾(左上)
    if (on) {
      circle(ctx, -38, -41, 10); ctx.fillStyle = ONSTAGE; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.strokeStyle = '#10131b'; ctx.lineWidth = 2.8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-43, -41); ctx.lineTo(-39.5, -37); ctx.lineTo(-33, -45); ctx.stroke();
    }
    // 等級已移除: 只畫「N 號」(置中)
    T(ctx, num + ' 號', 0, 38, { size: 17, color: on ? P.text : P.textDim, maxW: 92 });
    if (B(s.selected)) selectFrame(ctx, -52, -55, 104, 110, 10);
  }
  // 布置第 1 步的說明面板 840×170
  // 攻擊說明: 〔 〕裡的字畫成效果色圓角標籤(不畫〔 〕), 其他字一般; 逐字斷行, 標籤不拆開
  function richDesc(ctx, str, x0, y0, maxW, size, lineH, maxLines, tagCol) {
    str = String(str == null ? '' : str);
    ctx.save(); ctx.font = 'bold ' + size + 'px ' + FONT;
    var toks = [], i = 0;
    while (i < str.length) {
      var c = str[i];
      if (c === '〔') {
        var j = str.indexOf('〕', i + 1);
        if (j < 0) j = str.length;
        toks.push({ tag: true, s: str.slice(i + 1, j) }); i = j + 1;
      } else { toks.push({ tag: false, s: c }); i++; }
    }
    var padX = 7, line = 0, cx = x0;
    for (var k = 0; k < toks.length; k++) {
      var tk = toks[k], w = ctx.measureText(tk.s).width + (tk.tag ? padX * 2 + 4 : 0);
      if (cx + w > x0 + maxW && cx > x0) { line++; cx = x0; if (!tk.tag && tk.s === ' ') continue; }
      if (line >= maxLines) break;
      var cy = y0 + line * lineH;
      if (tk.tag) {
        rr(ctx, cx + 2, cy - size * 0.68, w - 4, size * 1.36, size * 0.5); ctx.fillStyle = tagCol; ctx.fill();
        ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5; ctx.stroke();
        T(ctx, tk.s, cx + w / 2, cy + 1, { size: size, color: '#ffffff', strokeW: 2.5 });
      } else {
        T(ctx, tk.s, cx, cy, { size: size, align: 'left', color: '#d8e0ee', stroke: false });
      }
      cx += w;
    }
    ctx.restore();
  }
  var EFF_TAG = { ignite: P.ignite, calm: P.calm, target: P.special, freeze: P.special, warp: P.special };
  // 升級面板已拿掉, 整個面板都是介紹: 左側頭像 96(中心 (x−340, y)); 右側文字區 x−270 ~ x+400
  function drawMonsterInfo(ctx, s) {
    var sp = spKey(s.species);
    ctx.translate(N(s.x, 480), N(s.y, 555));
    panel(ctx, -420, -85, 840, 170, 12);
    circle(ctx, -340, 0, 48); ctx.fillStyle = '#141925'; ctx.fill(); ctx.strokeStyle = P.line; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.translate(-340 + (sp === 'tanuki' ? 9 : 0), 0); paintSpecies(ctx, sp, sp === 'tanuki' ? 30 : 36, {}); ctx.restore();
    T(ctx, SP[sp].name + ' ' + Math.max(0, Math.floor(N(s.num, 1))) + ' 號', -270, -52, { size: 26, align: 'left', maxW: 660 });
    var eff = effKey(S(s.effect, '')) || SP[sp].effect;
    richDesc(ctx, S(s.desc, ''), -270, -8, 660, 19, 30, 2, EFF_TAG[eff] || P.special);
    var tot = Math.max(0, Math.floor(N(s.total, 0))), mx = Math.max(1, Math.floor(N(s.totalMax, 20)));
    T(ctx, '上台 ' + tot + ' / ' + mx, -270, 58, { size: 20, align: 'left', color: tot >= mx ? P.select : P.text });
  }
  // 怪物庫捲動記號 40×14: 圓角小三角
  function drawScrollMark(ctx, s) {
    var up = S(s.dir, 'down') === 'up';
    ctx.translate(N(s.x, 0), N(s.y, 0));
    if (!up) ctx.scale(1, -1);
    ctx.beginPath(); ctx.moveTo(-15, 5); ctx.lineTo(0, -5); ctx.lineTo(15, 5); ctx.closePath();
    ctx.lineJoin = 'round'; ctx.fillStyle = '#c8d0e0'; ctx.fill(); ctx.strokeStyle = '#c8d0e0'; ctx.lineWidth = 3; ctx.stroke();
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
    if (B(s.locked)) {
      // 見習日鎖住的列: 整列暗 + 鎖頭 +「見習後開放」, 不畫暗號格 / 節目格內容
      var li = clamp(Math.floor(N(s.index, 0)), 0, 3);
      rr(ctx, -340, -32, 680, 64, 10); ctx.fillStyle = '#12151d'; ctx.fill();
      ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = '#2c3344'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      T(ctx, '第 ' + (li + 1) + ' 個', -295, 0, { size: 18, color: '#4e5668' });
      ctx.save(); ctx.translate(-40, 2);
      ctx.strokeStyle = '#7a8296'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(0, -7, 8, Math.PI, 0); ctx.stroke();
      rr(ctx, -11, -7, 22, 17, 4); ctx.fillStyle = '#7a8296'; ctx.fill();
      ctx.restore();
      T(ctx, '見習後開放', -18, 0, { size: 19, align: 'left', color: '#7a8296' });
      return;
    }
    ctx.save();
    if (!complete) ctx.globalAlpha *= 0.5;
    rr(ctx, -340, -32, 680, 64, 10); ctx.fillStyle = complete ? '#222a3c' : '#181c27'; ctx.fill();
    ctx.strokeStyle = complete ? P.line : '#2c3344'; ctx.lineWidth = 2; ctx.stroke();
    var idx = clamp(Math.floor(N(s.index, 0)), 0, 3);
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
    var n = Math.min(13, opts.length), idx = Math.floor(N(s.index, 0)), RH = 44;
    var accent = layer === 'cue' ? P.cue : P.program;
    var X = 760, W = 460, Y = 60;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 16;
    rr(ctx, X, Y, W, 50 + RH * n, 12); ctx.fillStyle = '#1e2536'; ctx.fill(); ctx.restore();
    rr(ctx, X, Y, W, 50 + RH * n, 12); ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); rr(ctx, X, Y, W, 50, 12); ctx.clip(); ctx.fillStyle = accent; ctx.globalAlpha = 0.28; ctx.fillRect(X, Y, W, 50); ctx.restore();
    T(ctx, layer === 'cue' ? '什麼時候?' : '演什麼?', X + 24, Y + 25, { size: 22, align: 'left', color: '#ffffff' });
    for (var i = 0; i < n; i++) {
      var o = opts[i] || {}, ry = 110 + RH * i, cy = ry + RH / 2;
      var key = S(o.key, '');
      if (i > 0) { ctx.fillStyle = '#2c3446'; ctx.fillRect(X + 12, ry, W - 24, 1); }
      if (key === 'clear') iconProg(ctx, 'clear', X + 32, cy, 12, 1);
      else if (layer === 'cue') iconCue(ctx, CUE[key] ? key : '', X + 32, cy, 13, 1);
      else iconProg(ctx, PROG[key] ? key : '', X + 32, cy, 13, 1);
      var desc = S(o.desc, '');
      if (desc) {
        T(ctx, S(o.name, ''), X + 58, cy - 9, { size: 17, align: 'left', maxW: 384 });
        T(ctx, desc, X + 58, cy + 11, { size: 13, align: 'left', color: P.textDim, maxW: 384 });
      } else T(ctx, S(o.name, ''), X + 58, cy, { size: 18, align: 'left', color: key === 'clear' ? P.textDim : P.text, maxW: 384 });
      if (i === idx) selectFrame(ctx, X + 4, ry + 1, W - 8, RH - 2, 8);
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
    var wild = mode === 'charge', stopped = mode === 'stopped';
    var tm = now() / 1000;
    var sx = 0;
    var lt = N(s.looseT, 0), dashing = wild && lt < 1.0;
    if (wild) sx = Math.sin(tm * 60) * (dashing ? 1 : 2);
    ell(ctx, 0, R * 0.95, R * 0.85, R * 0.2, 0); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    if (dashing) {
      // 衝刺中: 身後(與衝向相反的一側)三條速度線; 衝上側觀眾席 → 線在下方
      var upward = N(s.y, 400) < 356, sg = upward ? 1 : -1;
      ctx.strokeStyle = 'rgba(255,120,120,0.8)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (var sl = -1; sl <= 1; sl++) { ctx.beginPath(); ctx.moveTo(sl * 10, sg * 22); ctx.lineTo(sl * 10, sg * 31); ctx.stroke(); }
    }
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
    paintSpecies(ctx, sp, R, { dir: dir, eyes: wild ? 'angry' : (stopped ? 'shock' : (frozen ? 'weak' : 'normal')) });
    if (stopped) { ctx.save(); ctx.globalAlpha *= 0.3; paintSpecies(ctx, sp, R, { dir: dir, flat: '#8a90a0' }); ctx.restore(); }
    ctx.restore();
    if (stopped) {
      // 失控收場期間被嚇呆: 灰罩 + 大白眼 + 頭邊驚嘆號(畫成形狀, 不是字)
      ctx.strokeStyle = P.outline; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(21, -31); ctx.lineTo(21, -22); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(21, -31); ctx.lineTo(21, -22); ctx.stroke();
      circle(ctx, 21, -16, 2.6); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.2; ctx.stroke();
    }
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
    rageBar(ctx, x, y - (isT ? 52 : 44), s.rage, s.angryLow);
    if (mode !== 'charge') markRow(ctx, x, y - (isT ? 64 : 56), s.marks, s.markLeft, s.markDur);
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
  var MOODS = { quiet: 1, clap: 1, cheer: 1, frenzy: 1 };
  // 觀看中的觀眾(mode watch): 依熱度段 mood 做動作; 相位 = t × 頻率 + i × 0.37(16 人不整齊劃一)
  // 全部畫在 56×76 框內(x ±28、y −38~38): 頭頂最高 −35、舉手最高 −34
  function paintWatcher(ctx, s, top, col, idx) {
    var mood = MOODS[s.mood] ? s.mood : 'quiet';
    var t = Math.max(0, N(s.t, 0)), ph = idx * 0.37;
    var L = 0, hands = null, face = 'calm', fr = mood === 'frenzy';
    var side = (idx % 2 === 0) ? 1 : -1; // 沸騰時揮手的那一側(另一側冒驚嘆號)
    if (mood === 'quiet') {
      // 坐著看, 偶爾眨眼(每人約 2.6 秒眨一次, 錯開)
      if (((t / 2.6) + ph) % 1 < 0.06) face = 'blink';
    } else if (mood === 'clap') {
      // 拍手: 雙手在胸前開合, 合起那一下冒三條短線
      var cp = Math.abs(Math.sin(Math.PI * (t * 2.4 + ph)));
      var hy = top ? 9 : -2, gap = 2.5 + 7 * cp;
      hands = [[-gap, hy], [gap, hy]];
      face = 'smile';
      if (cp < 0.25) {
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, hy - 7); ctx.lineTo(0, hy - 11); ctx.moveTo(-5, hy - 6); ctx.lineTo(-8, hy - 9); ctx.moveTo(5, hy - 6); ctx.lineTo(8, hy - 9); ctx.stroke();
      }
    } else if (mood === 'cheer') {
      // 歡呼: 站起來舉雙手、身體跳動
      L = 5 + 4 * Math.abs(Math.sin(Math.PI * (t * 2 + ph)));
      var wv = Math.sin(TAU * (t * 1.5 + ph)) * 2;
      hands = [[-20 + wv, -19 - L], [20 + wv, -19 - L]];
      face = 'open';
    } else {
      // 沸騰: 跳得更高、更快, 一手大力揮; 另一側冒驚嘆號、臉頰掛汗珠、表情緊張
      L = 4 + 7 * Math.abs(Math.sin(Math.PI * (t * 3.2 + ph)));
      var wa = Math.sin(TAU * (t * 3 + ph)) * 5;
      hands = [[side * (19 + wa * 0.6), -19 - L + Math.abs(wa) * 0.4], [-side * 13, 2 - L]];
      face = 'tense';
    }
    ctx.save(); ctx.translate(0, -L);
    // 身體 + 頭
    ctx.beginPath(); ctx.moveTo(-18, 30); ctx.quadraticCurveTo(-18, 0, 0, 0); ctx.quadraticCurveTo(18, 0, 18, 30); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5; ctx.stroke();
    circle(ctx, 0, -12, 11); ctx.fillStyle = '#f4d2a8'; ctx.fill(); ctx.stroke();
    if (top) { // 面向場地(朝下): 看得到臉
      ctx.fillStyle = P.outline; ctx.strokeStyle = P.outline; ctx.lineCap = 'round';
      if (face === 'blink') {
        ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(-2, -12); ctx.moveTo(2, -12); ctx.lineTo(6, -12); ctx.stroke();
      } else if (face === 'tense') {
        // 緊張: 白眼大、瞳孔小 + 波浪嘴
        circle(ctx, -4, -13, 3); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 1; ctx.stroke();
        circle(ctx, 4, -13, 3); ctx.fill(); ctx.stroke();
        circle(ctx, -4, -13, 1.1); ctx.fillStyle = P.outline; ctx.fill(); circle(ctx, 4, -13, 1.1); ctx.fill();
        ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(-2, -7.5); ctx.lineTo(0, -6); ctx.lineTo(2, -7.5); ctx.lineTo(4, -6); ctx.stroke();
      } else {
        circle(ctx, -4, -12, 1.8); ctx.fill(); circle(ctx, 4, -12, 1.8); ctx.fill();
        if (face === 'smile') { ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, -9, 3.5, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); }
        else if (face === 'open') { ctx.beginPath(); ctx.arc(0, -8, 3.5, 0, Math.PI); ctx.closePath(); ctx.fill(); }
      }
    } else { // 背對鏡頭: 頭髮
      ctx.beginPath(); ctx.arc(0, -12, 11, Math.PI * 0.9, Math.PI * 2.1); ctx.fillStyle = '#4a3020'; ctx.fill();
    }
    ctx.restore();
    // 手臂 + 手(肩膀跟著身體高度)
    if (hands) {
      ctx.lineCap = 'round';
      for (var h = 0; h < 2; h++) {
        var sx = h === 0 ? -11 : 11, sy = 6 - L, hx = hands[h][0], hy2 = hands[h][1];
        ctx.strokeStyle = P.outline; ctx.lineWidth = 5.5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy2); ctx.stroke();
        ctx.strokeStyle = col; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy2); ctx.stroke();
        circle(ctx, hx, hy2, 3.5); ctx.fillStyle = '#f4d2a8'; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.2; ctx.stroke();
      }
    }
    if (fr) {
      // 汗珠(臉頰, 往下滑)
      var dq = ((t * 1.3 + ph) % 1);
      var dx = side * -14, dy = -16 - L + dq * 8;
      ctx.beginPath(); ctx.moveTo(dx, dy - 5); ctx.quadraticCurveTo(dx + 3.5, dy + 1, dx, dy + 3); ctx.quadraticCurveTo(dx - 3.5, dy + 1, dx, dy - 5); ctx.closePath();
      ctx.fillStyle = '#d8f0ff'; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.1; ctx.stroke();
      // 驚嘆號(圓頭, 不用尖角; 在頭的另一側, 框內上緣)
      var ex = -side * 21, ey = -33 + Math.sin(TAU * (t * 2 + ph)) * 1.2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = P.outline; ctx.lineWidth = 5.5; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex, ey + 9); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex, ey + 9); ctx.stroke();
      circle(ctx, ex, ey + 14, 2.3); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.1; ctx.stroke();
    }
  }
  function drawVisitor(ctx, s) {
    var x = N(s.x, 0), y = N(s.y, 0), top = S(s.side, 'top') !== 'bottom', mode = S(s.mode, 'watch');
    var si = Math.floor(N(s.i, -1));
    var idx = (si >= 0 && si < 8) ? si : Math.abs(Math.round((x - 165) / 136)) % 8;
    ctx.translate(x, y);
    // 座位
    rr(ctx, -24, 18, 48, 14, 4); ctx.fillStyle = '#4a3a50'; ctx.fill(); ctx.strokeStyle = '#2a2030'; ctx.lineWidth = 1.5; ctx.stroke();
    if (mode !== 'flee' && mode !== 'watch') return; // empty(或表外值): 只剩座椅
    var col = VIS_COL[idx];
    if (mode === 'watch') { paintWatcher(ctx, s, top, col, idx); return; }
    var scared = true;
    if (scared) {
      // 逃走: 往觀眾席外側(上側往上、下側往下)跑, 縮小淡出; 越接近 1 越看不到(全程留在 56×76 框內)
      var fp = p01(s.fleeT, N(s.fleeDur, 1.5) || 1.5);
      var out = top ? -1 : 1;
      ctx.globalAlpha *= Math.max(0, 1 - fp);
      ctx.translate(Math.sin(fp * 40) * 2 * (1 - fp), out * 8 * fp + 6 * fp);
      var sc = 1 - 0.65 * fp; ctx.translate(0, 8); ctx.scale(sc, sc); ctx.translate(0, -8);
      ctx.translate(0, -6);
      ctx.strokeStyle = '#f4d2a8'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-12, 2); ctx.lineTo(-20, -18); ctx.moveTo(12, 2); ctx.lineTo(20, -18); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(-18, 30); ctx.quadraticCurveTo(-18, 0, 0, 0); ctx.quadraticCurveTo(18, 0, 18, 30); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5; ctx.stroke();
    circle(ctx, 0, -12, 11); ctx.fillStyle = '#f4d2a8'; ctx.fill(); ctx.stroke();
    if (top) { // 面向場地(朝下): 看得到臉
      if (scared) {
        circle(ctx, -4, -13, 2.2); ctx.fillStyle = P.outline; ctx.fill(); circle(ctx, 4, -13, 2.2); ctx.fill();
        ell(ctx, 0, -6, 3, 3.5, 0); ctx.fill();
      } else { circle(ctx, -4, -12, 1.8); ctx.fillStyle = P.outline; ctx.fill(); circle(ctx, 4, -12, 1.8); ctx.fill(); }
    } else { // 背對鏡頭: 頭髮
      ctx.beginPath(); ctx.arc(0, -12, 11, Math.PI * 0.9, Math.PI * 2.1); ctx.fillStyle = '#4a3020'; ctx.fill();
    }
    if (scared) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-24, -26); ctx.lineTo(-19, -20); ctx.moveTo(24, -26); ctx.lineTo(19, -20); ctx.moveTo(0, -30); ctx.lineTo(0, -26); ctx.stroke();
    }
  }

  // ───────────── 失控收場 / 表演結算 / 地下城結算 ─────────────
  function jagged(ctx, x, y, r, n, inner, rot) {
    ctx.beginPath();
    for (var i = 0; i < n * 2; i++) { var a = rot + i * Math.PI / n, rad = (i % 2 === 0) ? r : r * inner; ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
    ctx.closePath();
  }
  function drawLooseFx(ctx, s) {
    var dur = N(s.dur, 2.5) || 2.5, tt = clamp(N(s.t, 0), 0, dur);
    var x = N(s.x, 640), y = N(s.y, 356), tm = now() / 1000;
    // 爆發特效(失控那隻身上, 160×160): 第 0 秒大吼外擴、全程紅鋸齒脈動、第 1.0 秒撞破圍欄再爆一次
    ctx.save();
    ctx.lineJoin = 'round';
    if (tt < 0.5) {
      var q = tt / 0.5;
      jagged(ctx, x, y, 30 + 45 * q, 14, 0.8, tm); ctx.strokeStyle = 'rgba(255,59,74,' + (1 - q * 0.7).toFixed(2) + ')'; ctx.lineWidth = 4; ctx.stroke();
    }
    if (tt >= 1.0 && tt < 1.5) {
      var q2 = (tt - 1.0) / 0.5;
      jagged(ctx, x, y, 30 + 45 * q2, 10, 0.7, -tm); ctx.fillStyle = 'rgba(255,225,77,' + (0.45 * (1 - q2)).toFixed(2) + ')'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,' + (1 - q2).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.stroke();
    }
    jagged(ctx, x, y, 42 + 3 * Math.sin(tm * 12), 12, 0.78, tm * 1.5); ctx.strokeStyle = 'rgba(255,59,74,0.65)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    // 「失控!」橫幅(固定 (640,300), 600×140): 前 0.15 秒由 0.8 倍長大, 最後 0.3 秒淡出
    var sc = tt < 0.15 ? 0.8 + 0.2 * (tt / 0.15) : 1;
    var a = tt > dur - 0.3 ? Math.max(0, (dur - tt) / 0.3) : 1;
    ctx.translate(640, 300); ctx.scale(sc, sc); ctx.globalAlpha *= a;
    ctx.beginPath();
    var W = 290, H = 56;
    ctx.moveTo(-W, -H);
    for (var i = 0; i <= 20; i++) ctx.lineTo(-W + i * (2 * W / 20), -H + (i % 2 ? -10 : 0));
    ctx.lineTo(W, H);
    for (var j = 0; j <= 20; j++) ctx.lineTo(W - j * (2 * W / 20), H + (j % 2 ? 10 : 0));
    ctx.closePath();
    ctx.fillStyle = 'rgba(120,10,20,0.88)'; ctx.fill(); ctx.strokeStyle = P.danger; ctx.lineWidth = 4; ctx.stroke();
    T(ctx, '失控!', 0, 2, { size: 76, color: '#ffffff', strokeColor: '#5a0008', strokeW: 10 });
  }
  // ───────────── 熱度表 / 沸騰警示(表演) ─────────────
  // 段色: 安靜灰藍 / 掌聲黃 / 歡呼橘 / 沸騰紅(沸騰 = 危險紅, 和失控同色系: 再往上就會出事)
  var TIER = {
    quiet: { name: '安靜', color: '#8fa3c0' }, clap: { name: '掌聲', color: '#f2e45a' },
    cheer: { name: '歡呼', color: '#ff9a3a' }, frenzy: { name: '沸騰!', color: P.danger }
  };
  // 420×42 以 (x,y) 為中心: 底板 396×34(換段彈跳最多 1.05 倍, 含沸騰時 3px 框線仍在 420×42 內)
  // 左「熱度」+ 大字「N%」, 中間橫條(50 / 75 / 90 刻度, 底下淡淡鋪 4 段色), 右邊段名
  function drawHeatMeter(ctx, s) {
    var tier = TIER[s.tier] ? s.tier : 'quiet', tc = TIER[tier].color;
    var heat = clamp(N(s.heat, 0), 0, 100), t = Math.max(0, N(s.t, 0));
    var td = N(s.tierDur, 0.4) > 0 ? N(s.tierDur, 0.4) : 0.4, tt = clamp(N(s.tierT, td), 0, td);
    var bq = tt < td ? Math.sin(Math.PI * tt / td) : 0;
    var fr = tier === 'frenzy', pulse = fr ? 0.5 - 0.5 * Math.cos(TAU * t / 0.8) : 0;
    ctx.translate(N(s.x, 640), N(s.y, 25));
    ctx.scale(1 + 0.05 * bq, 1 + 0.05 * bq);
    rr(ctx, -198, -17, 396, 34, 10); ctx.fillStyle = '#161b27'; ctx.fill();
    if (fr) { rr(ctx, -198, -17, 396, 34, 10); ctx.fillStyle = 'rgba(255,59,74,' + (0.28 * pulse).toFixed(3) + ')'; ctx.fill(); }
    rr(ctx, -198, -17, 396, 34, 10); ctx.strokeStyle = fr ? 'rgba(255,59,74,' + (0.5 + 0.5 * pulse).toFixed(3) + ')' : '#3a4256'; ctx.lineWidth = fr ? 2 + 1 * pulse : 1.5; ctx.stroke();
    T(ctx, '熱度', -188, 1, { size: 15, align: 'left', color: P.textDim });
    T(ctx, Math.round(heat) + '%', -150, 1, { size: 23, align: 'left', color: tc, maxW: 60 });
    // 橫條 x −84 ~ 52(136 寬; 本輪讓出右端給最高標記 4 格)
    var bx = -84, bw = 136, by = -6, bh = 12;
    var segs = [[0, 50, 'quiet'], [50, 75, 'clap'], [75, 90, 'cheer'], [90, 100, 'frenzy']];
    rr(ctx, bx - 2, by - 2, bw + 4, bh + 4, 4); ctx.fillStyle = '#0a0d14'; ctx.fill();
    ctx.save(); ctx.globalAlpha *= 0.22;
    for (var i = 0; i < 4; i++) {
      ctx.fillStyle = TIER[segs[i][2]].color;
      ctx.fillRect(bx + bw * segs[i][0] / 100, by, bw * (segs[i][1] - segs[i][0]) / 100, bh);
    }
    ctx.restore();
    if (heat > 0) { ctx.fillStyle = tc; ctx.fillRect(bx, by + 1, bw * heat / 100, bh - 2); }
    // 刻度 50 / 75 / 90(白, 上下突出)
    ctx.fillStyle = '#ffffff';
    for (var k = 0; k < 3; k++) { var tx = bx + bw * [50, 75, 90][k] / 100; ctx.fillRect(tx - 0.75, by - 4, 1.5, bh + 8); }
    rr(ctx, bx - 2, by - 2, bw + 4, bh + 4, 4); ctx.strokeStyle = 'rgba(230,236,248,0.55)'; ctx.lineWidth = 1; ctx.stroke();
    // 段名(換段時自己再多彈一點)
    ctx.save(); ctx.translate(92, 1); ctx.scale(1 + 0.2 * bq, 1 + 0.2 * bq);
    T(ctx, TIER[tier].name, 0, 0, { size: 21, color: tc, maxW: 54 });
    ctx.restore();
    // 最高標記(場上標記最多那隻): 細分隔線 + 4 顆圓點, 長相 = 魔物頭上的失控標記(橘點白邊), 同一本字典
    // 1~2 顆亮橘; ≥ 3 顆全部轉危險紅並閃(週期 0.5 秒, 讀 t); 沒亮的是暗底灰邊空位(空位本身在講「上限 4 格, 再一個就失控」)
    var mm = clamp(Math.floor(N(s.maxMarks, 0)), 0, 4), hot = mm >= 3;
    var blinkOn = hot ? ((t % 0.5) < 0.25) : true;
    ctx.fillStyle = '#3a4256'; ctx.fillRect(132, -11, 1.5, 22);
    for (var m = 0; m < 4; m++) {
      var mx = 149 + 13 * m;
      circle(ctx, mx, 1, 5);
      if (m < mm) {
        ctx.fillStyle = hot ? (blinkOn ? P.danger : '#7a1a24') : P.ignite; ctx.fill();
        ctx.strokeStyle = hot && !blinkOn ? '#ff9aa4' : '#ffffff'; ctx.lineWidth = 1.2; ctx.stroke();
      } else {
        ctx.fillStyle = '#0a0d14'; ctx.fill(); ctx.strokeStyle = 'rgba(230,236,248,0.35)'; ctx.lineWidth = 1; ctx.stroke();
      }
    }
  }
  // 表演時鐘(新): 48×48 圓, 中心 (x,y)。剩餘比例 = 從 12 點方向順時針張開的一塊扇形(時間越少扇形越小, 縮的方向是順時針);
  // 已過去的部分畫暗。正中間一塊深色圓墊 + 粗體秒數 ceil(timeLeft), 字壓在扇形之上也讀得到。
  // timeLeft ≤ 10: 扇形與數字轉紅。running 且剛跨過整數秒 0.15 秒內: 整個放大到 1.1 倍再回來(sin 曲線, 最大 53×53)
  function drawShowClock(ctx, s) {
    var tl = Math.max(0, N(s.timeLeft, 0)), tm = N(s.timeMax, 0);
    var f = tm > 0 ? clamp(tl / tm, 0, 1) : 0;
    var red = tl <= 10;
    var sec = Math.ceil(tl);
    var sc = 1;
    if (B(s.running) && tl > 0) { var since = sec - tl; if (since < 0.15) sc = 1 + 0.1 * Math.sin(Math.PI * since / 0.15); }
    ctx.translate(N(s.x, 900), N(s.y, 25)); ctx.scale(sc, sc);
    var R = 22, col = red ? P.danger : '#7ab0ff';
    // 鐘面底(已過去 = 暗)
    circle(ctx, 0, 0, R); ctx.fillStyle = '#0a0d14'; ctx.fill();
    circle(ctx, 0, 0, R - 2); ctx.fillStyle = '#1e2433'; ctx.fill();
    // 剩餘扇形
    if (f > 0) {
      ctx.beginPath(); ctx.moveTo(0, 0);
      if (f >= 1) ctx.arc(0, 0, R - 2, 0, TAU); else ctx.arc(0, 0, R - 2, -Math.PI / 2, -Math.PI / 2 + TAU * f, false);
      ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    }
    // 12 點起點短刻度
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-1, -R + 1, 2, 5);
    // 外框
    circle(ctx, 0, 0, R); ctx.strokeStyle = red ? '#ffd0d4' : 'rgba(230,236,248,0.8)'; ctx.lineWidth = 2; ctx.stroke();
    // 中央深色圓墊 + 秒數
    circle(ctx, 0, 0, 13); ctx.fillStyle = 'rgba(10,13,20,0.88)'; ctx.fill();
    T(ctx, String(sec), 0, 1, { size: sec >= 100 ? 14 : 18, color: red ? '#ff6b78' : '#ffffff', maxW: 24 });
  }
  // 沸騰警示: 畫面四周 40px 紅色脈動邊(由外往內淡出), 週期 0.8 秒; 不碰場地中央
  function drawHeatAlert(ctx, s) {
    var t = Math.max(0, N(s.t, 0));
    var a = 0.18 + 0.5 * (0.5 - 0.5 * Math.cos(TAU * t / 0.8));
    var E = 40, W = 1280, H = 720, c0 = 'rgba(255,59,74,' + a.toFixed(3) + ')', c1 = 'rgba(255,59,74,0)';
    var g;
    g = ctx.createLinearGradient(0, 0, 0, E); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fillRect(0, 0, W, E);
    g = ctx.createLinearGradient(0, H, 0, H - E); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fillRect(0, H - E, W, E);
    g = ctx.createLinearGradient(0, 0, E, 0); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fillRect(0, 0, E, H);
    g = ctx.createLinearGradient(W, 0, W - E, 0); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fillRect(W - E, 0, E, H);
    ctx.strokeStyle = 'rgba(255,59,74,' + Math.min(1, a + 0.2).toFixed(3) + ')'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, W - 4, H - 4);
  }
  function resultPanel(ctx, W, H) {
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 20;
    rr(ctx, -W / 2, -H / 2, W, H, 18); ctx.fillStyle = '#1e2536'; ctx.fill(); ctx.restore();
    rr(ctx, -W / 2 + 1.25, -H / 2 + 1.25, W - 2.5, H - 2.5, 17); ctx.strokeStyle = P.line; ctx.lineWidth = 2.5; ctx.stroke();
  }
  function pressZ(ctx, txt, x, y) {
    var on = (now() % 1000) < 700;
    ctx.save(); ctx.globalAlpha *= on ? 1 : 0.35;
    richLine(ctx, txt, x, y, { size: 22, color: P.select });
    ctx.restore();
  }
  function drawShowResult(ctx, s) {
    var loose = B(s.loose), tut = B(s.tutorial);
    var sat = Math.max(0, Math.round(N(s.sat, 0))), gold = Math.max(0, Math.round(N(s.gold, 0))), fg = Math.max(0, Math.round(N(s.fameGain, 0)));
    var td = N(s.tallyDur, 1.5), tT = N(s.tallyT, td);
    var done = td <= 0 || tT >= td;
    var tf = done ? 1 : clamp(tT / td, 0, 1);
    var shown = Math.round(gold * tf), shownF = Math.round(fg * tf);
    ctx.translate(640, 390);
    resultPanel(ctx, 760, 460);
    if (loose) {
      rr(ctx, -378, -228, 756, 92, 16); ctx.fillStyle = 'rgba(120,10,20,0.6)'; ctx.fill();
      T(ctx, (tut ? '見習 ' : '') + '失控! 表演提前結束', 0, -196, { size: 34, color: '#ff8a94', maxW: 700 });
      T(ctx, '剩 ' + Math.max(0, Math.floor(N(s.timeLeft, 0))) + ' 秒', 0, -158, { size: 18, color: '#ffc0c8' });
    } else {
      T(ctx, (tut ? '見習 ' : '') + '收場!', 0, -182, { size: 40, color: '#ffffff' });
    }
    // 觀眾滿意度 → 分岔成 金幣 與 名聲(兩個數字一起跳)
    satFace(ctx, -300, -100, 15);
    T(ctx, '觀眾滿意度', -276, -100, { size: 22, align: 'left', color: P.textDim });
    T(ctx, String(sat), 310, -100, { size: 34, align: 'right', color: P.sat });
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-300, -82); ctx.lineTo(-300, 26);
    ctx.moveTo(-300, -40); ctx.lineTo(-288, -40); ctx.moveTo(-293, -45); ctx.lineTo(-288, -40); ctx.lineTo(-293, -35);
    ctx.moveTo(-300, 26); ctx.lineTo(-288, 26); ctx.moveTo(-293, 21); ctx.lineTo(-288, 26); ctx.lineTo(-293, 31); ctx.stroke();
    var bump = done ? 1 : 1 + 0.06 * Math.abs(Math.sin(tT * 30));
    coinIcon(ctx, -270, -40, 14);
    T(ctx, '金幣', -248, -40, { size: 22, align: 'left', color: P.textDim });
    ctx.save(); ctx.translate(310, -40); ctx.scale(bump, bump);
    T(ctx, '+' + shown, 0, 0, { size: 40, align: 'right', color: P.gold });
    ctx.restore();
    repIcon(ctx, -270, 26, 14);
    T(ctx, '名聲', -248, 26, { size: 22, align: 'left', color: P.textDim });
    ctx.save(); ctx.translate(310, 26); ctx.scale(bump, bump);
    T(ctx, '+' + shownF, 0, 0, { size: 40, align: 'right', color: P.rep });
    ctx.restore();
    ctx.fillStyle = P.line; ctx.fillRect(-320, 66, 640, 2);
    T(ctx, '最長連鎖', -276, 104, { size: 22, align: 'left', color: P.textDim });
    T(ctx, String(Math.max(0, Math.floor(N(s.bestChain, 0)))), 310, 104, { size: 28, align: 'right', color: '#9ff0ff' });
    if (done) pressZ(ctx, '按 [Z] 繼續', 0, 180);
  }
  // 出口詢問框: 全畫面壓暗 + 面板 560×240 中心 (640,400) + 「離開」(520,470)「留下」(760,470) 各 180×56
  // 0~0.2 秒面板由 0.9 倍彈到 1(不超出 560×240 —— 縮放以面板中心為錨, 只縮不放)
  function drawExitPrompt(ctx, s) {
    var t = Math.max(0, N(s.t, 1)), choice = Math.floor(N(s.choice, 1)) === 0 ? 0 : 1;
    var q = clamp(t / 0.2, 0, 1), ease = 1 - Math.pow(1 - q, 3);
    ctx.fillStyle = 'rgba(4,6,10,' + (0.6 * (0.4 + 0.6 * ease)).toFixed(3) + ')'; ctx.fillRect(0, 0, 1280, 720);
    ctx.translate(640, 400); ctx.scale(0.9 + 0.1 * ease, 0.9 + 0.1 * ease); ctx.globalAlpha *= 0.3 + 0.7 * ease;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 18;
    rr(ctx, -280, -120, 560, 240, 18); ctx.fillStyle = '#1e2536'; ctx.fill(); ctx.restore();
    rr(ctx, -280, -120, 560, 240, 18); ctx.strokeStyle = P.line; ctx.lineWidth = 2.5; ctx.stroke();
    T(ctx, '是否離開地下城?', 0, -70, { size: 32, color: '#ffffff', maxW: 500 });
    T(ctx, '會直接進入結算', 0, -28, { size: 19, color: P.textDim });
    var lab = ['離開', '留下'];
    for (var i = 0; i < 2; i++) {
      var cx = i === 0 ? -120 : 120, cy = 70, sel = i === choice;
      rr(ctx, cx - 90, cy - 28, 180, 56, 12); ctx.fillStyle = sel ? P.select : '#2c3550'; ctx.fill();
      ctx.strokeStyle = sel ? '#fff2b0' : P.line; ctx.lineWidth = 2; ctx.stroke();
      T(ctx, lab[i], cx, cy + 1, { size: 24, color: sel ? '#10131b' : P.text, stroke: !sel });
      if (sel) selectFrame(ctx, cx - 90, cy - 28, 180, 56, 12);
    }
  }
  var DRES_TITLE = { time: ['時間到', '#ffffff'], down: ['倒下了', '#ff8a94'], exit: ['提早收工', '#c8e6ff'], tutorial: ['見習完成!', P.select] };
  function drawDungeonResult(ctx, s) {
    var tt = DRES_TITLE[s.reason] || DRES_TITLE.time;
    ctx.translate(640, 390);
    resultPanel(ctx, 760, 460);
    var cause = s.reason === 'down' ? S(s.cause, '') : '';
    if (cause) {
      // 倒下: 標題下方一行原因(〔 〕畫成危險紅標籤, 和倒下動畫的原因框同一個長相)
      T(ctx, tt[0], 0, -196, { size: 38, color: tt[1] });
      richLine(ctx, cause, 0, -155, { size: 20, color: '#ffd0d4', tagCol: P.danger, maxW: 680 });
    } else T(ctx, tt[0], 0, -186, { size: 40, color: tt[1] });
    T(ctx, '收服', -340, -132, { size: 20, align: 'left', color: P.textDim });
    var caps = Array.isArray(s.captures) ? s.captures : [];
    var n = Math.min(20, caps.length);
    if (n === 0) {
      T(ctx, '這趟沒有收服', 0, -60, { size: 22, color: P.textDim });
    } else {
      var rows = n > 10 ? 2 : 1;
      for (var i = 0; i < n; i++) {
        var row = i < 10 ? 0 : 1, inRow = row === 0 ? Math.min(10, n) : n - 10, col = row === 0 ? i : i - 10;
        var cx = (col - (inRow - 1) / 2) * 66, cy = rows === 1 ? -60 : (row === 0 ? -86 : -20);
        var sp = spKey(caps[i]);
        circle(ctx, cx, cy, 29); ctx.fillStyle = '#141925'; ctx.fill(); ctx.strokeStyle = P.capture; ctx.lineWidth = 2; ctx.stroke();
        ctx.save(); ctx.translate(cx + (sp === 'tanuki' ? 5 : 0), cy); paintSpecies(ctx, sp, sp === 'tanuki' ? 16 : 20, {}); ctx.restore();
      }
    }
    ctx.fillStyle = P.line; ctx.fillRect(-340, 34, 680, 2);
    T(ctx, '打倒 ' + Math.max(0, Math.floor(N(s.kills, 0))) + ' 隻', -170, 92, { size: 28 });
    coinIcon(ctx, 104, 92, 14);
    T(ctx, '金幣 +' + Math.max(0, Math.floor(N(s.gold, 0))), 126, 92, { size: 28, align: 'left', color: P.gold });
    pressZ(ctx, '按 [Z] 繼續', 0, 180);
  }

  // ───────────── 換武器視窗(本輪新增) ─────────────
  // 全畫面壓暗 + 面板 760×320 中心 (640,340); 標題 (640,210); 底部提示 (640,245); 卡片 160×190 中心 x = 640 + 180 ×(i − (n−1)/2)、y 380
  // 選中: 金框(游標) + 放大 1.08 倍(176×209 以內); 使用中: 卡頂萊姆小膠囊「使用中」; 捕捉繩用完: 卡片壓暗 +「用完了」
  function drawWeaponPicker(ctx, s) {
    var opts = (Array.isArray(s.options) ? s.options : []).slice(0, 4);
    var n = opts.length, idx = Math.floor(N(s.index, 0));
    var t = Math.max(0, N(s.t, 1)), q = clamp(t / 0.15, 0, 1), ease = 1 - Math.pow(1 - q, 3);
    ctx.fillStyle = 'rgba(4,6,10,' + (0.62 * (0.4 + 0.6 * ease)).toFixed(3) + ')'; ctx.fillRect(0, 0, 1280, 720);
    ctx.translate(640, 340); ctx.scale(0.9 + 0.1 * ease, 0.9 + 0.1 * ease); ctx.translate(-640, -340);
    ctx.globalAlpha *= 0.3 + 0.7 * ease;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 18;
    rr(ctx, 260, 180, 760, 320, 18); ctx.fillStyle = '#1e2536'; ctx.fill(); ctx.restore();
    rr(ctx, 261.25, 181.25, 757.5, 317.5, 17); ctx.strokeStyle = P.line; ctx.lineWidth = 2.5; ctx.stroke();
    T(ctx, '換武器', 640, 210, { size: 26, color: '#ffffff' });
    richLine(ctx, '[←][→] 選擇 [Z] 換上 [X] 取消', 640, 245, { size: 16, color: '#c8d0e0', maxW: 700 });
    for (var i = 0; i < n; i++) {
      var o = opts[i] || {}, key = o.key === 'rope' ? 'rope' : wpKey(o.key);
      var cx = 640 + 180 * (i - (n - 1) / 2), cy = 380, sel = i === idx;
      var dis = B(o.disabled), cur = B(o.current);
      ctx.save(); ctx.translate(cx, cy); if (sel) ctx.scale(1.08, 1.08);
      panel(ctx, -80, -95, 160, 190, 12, sel ? P.panelHi : '#232a3a', cur ? P.capture : P.line);
      ctx.save(); if (dis) ctx.globalAlpha *= 0.4;
      circle(ctx, 0, -36, 30); ctx.fillStyle = '#141925'; ctx.fill();
      if (key === 'rope') ropeCoil(ctx, -2, -40, 19);
      else iconWeapon(ctx, key, 0, -34, 40);
      T(ctx, S(o.name, WEAPON[key]), 0, 8, { size: 22, color: '#ffffff', maxW: 148 });
      richLines(ctx, S(o.line, ''), 0, key === 'rope' ? 46 : 38, { size: 15, color: '#c8d0e0', maxW: 148, maxLines: 2, lineH: 22 });
      ctx.restore();
      if (key === 'rope') {
        var rp = Math.max(0, Math.floor(N(o.ropes, 0))), rm = Math.max(0, Math.floor(N(o.ropeMax, 0)));
        if (dis || rp <= 0) T(ctx, '用完了', 0, 78, { size: 17, color: '#ff8a94' });
        else T(ctx, '剩 ' + rp + ' / ' + rm + ' 條', 0, 78, { size: 17, color: P.rope });
      }
      if (cur) {
        rr(ctx, -34, -90, 68, 20, 10); ctx.fillStyle = P.capture; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5; ctx.stroke();
        T(ctx, '使用中', 0, -79.5, { size: 13, color: '#10131b', stroke: false });
      }
      if (sel) selectFrame(ctx, -80, -95, 160, 190, 12);
      ctx.restore();
    }
  }

  // ───────────── 倒下動畫的暗角與原因框(本輪新增) ─────────────
  // 0~0.3 秒: 從馴獸師往外擴的白色衝擊環; 0.3~1.5 秒: 四周漸暗到 60%(馴獸師周圍半徑約 140 亮著), 原因框 0.3~0.5 秒彈出後停住
  function drawDownFx(ctx, s) {
    var x = N(s.x, 640), y = N(s.y, 410);
    var dur = N(s.dur, 1.5) > 0 ? N(s.dur, 1.5) : 1.5, t = clamp(N(s.t, 0), 0, dur);
    ctx.beginPath(); ctx.rect(0, 0, 1280, 720); ctx.clip();
    if (t < 0.3) {
      var q = t / 0.3;
      for (var k = 0; k < 2; k++) {
        var qq = clamp(q * 1.2 - k * 0.25, 0, 1);
        if (qq <= 0) continue;
        circle(ctx, x, y, 22 + 110 * qq); ctx.strokeStyle = 'rgba(255,255,255,' + (0.9 * (1 - qq)).toFixed(3) + ')'; ctx.lineWidth = 2 + 6 * (1 - qq); ctx.stroke();
      }
      return;
    }
    var dq = clamp((t - 0.3) / 0.4, 0, 1);
    var g = ctx.createRadialGradient(x, y, 110, x, y, 170);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,' + (0.6 * dq).toFixed(3) + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
    var cause = S(s.cause, '');
    if (!cause) return;
    var pq = clamp((t - 0.3) / 0.2, 0, 1), sc = 0.6 + 0.4 * (1 - Math.pow(1 - pq, 3));
    var bx = clamp(x, 140, 1140), by = (y - 96 < 140) ? y + 80 : y - 96;
    ctx.save(); ctx.translate(bx, by); ctx.scale(sc, sc); ctx.globalAlpha *= 0.3 + 0.7 * pq;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 10;
    rr(ctx, -139, -27, 278, 54, 12); ctx.fillStyle = '#1e2536'; ctx.fill(); ctx.restore();
    rr(ctx, -139, -27, 278, 54, 12); ctx.strokeStyle = P.danger; ctx.lineWidth = 2.5; ctx.stroke();
    richLine(ctx, cause, 0, 1, { size: 18, color: '#ffffff', tagCol: P.danger, maxW: 258 });
    ctx.restore();
  }

  // ───────────── 商店 ─────────────
  var TAB = { char: '角色', cue: '暗號', program: '節目' };
  var TAB_COL = { char: '#ffffff', cue: P.cue, program: P.program };
  function drawShopTab(ctx, s) {
    var tab = TAB[s.tab] ? s.tab : 'char', cur = B(s.current);
    ctx.translate(N(s.x, 0), N(s.y, 0));
    rr(ctx, -110, -25, 220, 50, 10); ctx.fillStyle = cur ? '#3a4766' : '#1e2434'; ctx.fill();
    ctx.strokeStyle = cur ? '#8aa0d0' : '#353d52'; ctx.lineWidth = 2; ctx.stroke();
    // 目前分頁: 底線(暗號頁青、節目頁粉, 和格子的暗號 / 節目色一致)
    if (cur) { ctx.fillStyle = TAB_COL[tab]; ctx.fillRect(-60, 17, 120, 4); }
    T(ctx, TAB[tab], 0, -1, { size: 22, color: cur ? '#ffffff' : P.textDim });
    if (B(s.selected)) selectFrame(ctx, -110, -25, 220, 50, 10);
  }
  function drawShopItem(ctx, s) {
    var item = S(s.item, '');
    ctx.translate(N(s.x, 0), N(s.y, 0));
    var isCue = !!CUE[item], isProg = !!PROG[item], it = ITEM[item];
    var locked = (isCue || isProg) && B(s.fameLocked);
    panel(ctx, -190, -45, 380, 90, 10, locked ? '#181c27' : P.panel, locked ? '#2c3344' : P.line);
    ctx.save(); if (locked) ctx.globalAlpha *= 0.4;
    // 圖示框 70×70
    rr(ctx, -182, -35, 70, 70, 8); ctx.fillStyle = '#161b27'; ctx.fill();
    var name = '', desc = '';
    if (isCue) { iconCue(ctx, item, -147, 0, 20, 1); name = CUE[item]; desc = CUE_DESC[item]; }
    else if (isProg) { iconProg(ctx, item, -147, 0, 20, 1); name = PROG[item]; desc = PROG_DESC[item]; }
    else if (it) {
      name = it.name; desc = it.desc;
      if (it.kind === 'weapon') iconWeapon(ctx, item, -150, 4, 30);
      else if (item === 'attack') { iconWeapon(ctx, 'sword', -152, 4, 26); T(ctx, '+1', -126, -20, { size: 15, color: P.select }); }
      else if (item === 'armor') { heartPath(ctx, -147, 0, 18); ctx.fillStyle = P.heart; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 2; ctx.stroke(); }
      else { ropeIcon(ctx, -147, 0, 23, true); }
    } else { name = item || '?'; }
    // 小標: 暗號(青)/ 節目(粉)
    if (isCue || isProg) {
      var tag = isCue ? '暗號' : '節目', tc = isCue ? P.cue : P.program;
      rr(ctx, -100, -37, 44, 21, 6); ctx.fillStyle = tc; ctx.fill();
      T(ctx, tag, -78, -26.5, { size: 13, color: '#10131b', stroke: false });
      T(ctx, name, -48, -26, { size: 20, align: 'left', maxW: 228 });
    } else T(ctx, name, -100, -26, { size: 20, align: 'left', maxW: 280 });
    if (desc) richLine(ctx, desc, -100, 3, { size: 15, align: 'left', color: '#c8d0e0', maxW: 280 });
    ctx.restore();
    // 右下: 價格 / 狀態 / 名聲門檻
    var cost = Math.max(0, Math.floor(N(s.cost, 0)));
    var status = '', scol = P.textDim;
    if (locked) {
      // 名聲未到: 整格暗 + 鎖頭 +「名聲 N 解鎖」(名聲色)
      ctx.save(); ctx.translate(-147, 0);
      ctx.strokeStyle = '#b8c0d0'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(0, -6, 8, Math.PI, 0); ctx.stroke();
      rr(ctx, -11, -6, 22, 17, 4); ctx.fillStyle = '#b8c0d0'; ctx.fill();
      ctx.restore();
      repIcon(ctx, 26, 29, 8);
      T(ctx, '名聲 ' + Math.max(0, Math.floor(N(s.fameReq, 0))) + ' 解鎖', 180, 29, { size: 17, align: 'right', color: P.rep });
    } else {
      if (it && it.kind === 'weapon') {
        if (B(s.equipped)) { status = '裝備中'; scol = P.select; }
        else if (B(s.owned) || item === 'club') status = '已擁有';
      } else if (isCue || isProg) {
        if (B(s.owned)) status = '已擁有';
      }
      if (status) T(ctx, status, 180, 29, { size: 17, align: 'right', color: scol });
      else {
        var aff = B(s.affordable);
        T(ctx, cost + ' 金', 180, 29, { size: 18, align: 'right', color: aff ? P.gold : '#ff7a7a' });
        if (it && it.kind === 'up' && N(s.level, 0) > 0) T(ctx, '已買 ' + Math.floor(N(s.level, 0)), -100, 29, { size: 14, align: 'left', color: P.textDim });
      }
    }
    if (B(s.selected)) selectFrame(ctx, -190, -45, 380, 90, 10);
  }
  function drawShopDetail(ctx, s) {
    ctx.translate(N(s.x, 640), N(s.y, 570));
    panel(ctx, -540, -35, 1080, 70, 10, '#1a2030', P.line);
    var lines = Array.isArray(s.lines) ? s.lines : [];
    var n = Math.min(3, lines.length);
    if (n === 0) return;
    var size = n === 1 ? 20 : (n === 2 ? 18 : 16), gap = n === 1 ? 0 : (n === 2 ? 26 : 20);
    if (n === 3) gap = 21;
    for (var i = 0; i < n; i++) richLine(ctx, String(lines[i]), 0, (i - (n - 1) / 2) * gap, { size: n === 3 ? 15 : size, color: i === 0 ? P.text : '#c8d0e0', maxW: 1040 });
  }
  function drawButton(ctx, s) {
    var x = N(s.x, 0), y = N(s.y, 0), w = Math.max(10, N(s.w, 200)), h = Math.max(10, N(s.h, 60)), sel = B(s.selected);
    rr(ctx, x, y, w, h, 12); ctx.fillStyle = sel ? P.select : '#2c3550'; ctx.fill();
    ctx.strokeStyle = sel ? '#fff2b0' : P.line; ctx.lineWidth = 2; ctx.stroke();
    T(ctx, S(s.label, ''), x + w / 2, y + h / 2 + 1, { size: Math.min(26, Math.round(h * 0.42)), color: sel ? '#10131b' : P.text, stroke: !sel, maxW: w - 16 });
  }
  var FT_COL = { gold: P.gold, sat: P.sat, angryFame: '#ffe0e4', chain: '#9ff0ff', capture: P.capture, heal: P.heart, unlock: '#ffffff', escape: '#fff3a0', hint: '#ffe0b0' };
  function drawFloatText(ctx, s) {
    var kind = FT_COL[s.kind] ? s.kind : 'gold';
    var p = p01(s.t, s.dur);
    var x = N(s.x, 0), y = N(s.y, 0);
    var txt = S(s.text, '');
    if (kind === 'hint') {
      // 擋下提示(本輪新增): 約 340×44 的小提示框停在原位、不往上飄; 琥珀警示框 + 左端圓頭驚嘆號; 前 10% 彈出、後 20% 淡出
      var ha = p < 0.8 ? 1 : 1 - (p - 0.8) / 0.2, hs = p < 0.1 ? 0.85 + 0.15 * (p / 0.1) : 1;
      ctx.globalAlpha *= ha; ctx.translate(x, y); ctx.scale(hs, hs);
      var hw = Math.min(296, richWidth(ctx, richTokens(txt, false), 18));
      var W = Math.max(200, Math.min(340, hw + 52));
      rr(ctx, -W / 2 + 1.25, -20.75, W - 2.5, 41.5, 12); ctx.fillStyle = 'rgba(40,26,12,0.94)'; ctx.fill(); ctx.strokeStyle = '#ffb43a'; ctx.lineWidth = 2.5; ctx.stroke();
      circle(ctx, -W / 2 + 20, 0, 10); ctx.fillStyle = '#ffb43a'; ctx.fill();
      rr(ctx, -W / 2 + 18.4, -6.5, 3.2, 8, 1.6); ctx.fillStyle = '#10131b'; ctx.fill(); circle(ctx, -W / 2 + 20, 5, 1.8); ctx.fill();
      richLine(ctx, txt, 14, 1, { size: 18, color: '#ffe0b0', maxW: W - 52 });
      return;
    }
    if (kind === 'escape') {
      // 掙脫了!(本輪新增): 黃白字、左右晃一下往上彈(滑稽, 不是懲罰)
      var ep = p, eA = ep < 0.6 ? 1 : 1 - (ep - 0.6) / 0.4;
      ctx.globalAlpha *= eA;
      ctx.translate(x, y - 26 * ep - Math.sin(Math.min(1, ep * 3) * Math.PI) * 6);
      ctx.rotate(Math.sin(ep * Math.PI * 5) * 0.12 * (1 - ep));
      T(ctx, txt, 0, 0, { size: 21, color: '#fff3a0', strokeColor: '#3a2a10', strokeW: 4 });
      return;
    }
    if (kind === 'unlock') {
      // 新地下城開放 / 新暗號節目上架: 畫面上方大膠囊, 前 10% 彈出、後 30% 淡出, 只上浮 8px
      var ua = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3, us = p < 0.1 ? 0.85 + 0.15 * (p / 0.1) : 1;
      ctx.globalAlpha *= ua; ctx.translate(x, y - 8 * p); ctx.scale(us, us);
      ctx.font = 'bold 26px ' + FONT; var uw = Math.min(900, ctx.measureText(txt).width);
      rr(ctx, -uw / 2 - 44, -24, uw + 88, 48, 24); ctx.fillStyle = 'rgba(16,20,30,0.92)'; ctx.fill(); ctx.strokeStyle = P.rep; ctx.lineWidth = 3; ctx.stroke();
      starPath(ctx, -uw / 2 - 20, 0, 12); ctx.fillStyle = P.rep; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5; ctx.stroke();
      starPath(ctx, uw / 2 + 20, 0, 12); ctx.fillStyle = P.rep; ctx.fill(); ctx.stroke();
      T(ctx, txt, 0, 1, { size: 26, color: '#ffffff', maxW: 900 });
      return;
    }
    var dy = -p * 32;
    var a = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
    ctx.globalAlpha *= a;
    var size = kind === 'chain' ? 22 : (kind === 'capture' ? 24 : (kind === 'angryFame' ? 22 : (kind === 'heal' ? 20 : 18)));
    if (kind === 'heal') {
      ctx.font = 'bold ' + size + 'px ' + FONT; var hw = ctx.measureText(txt).width;
      heartPath(ctx, x - hw / 2 - 14, y + dy, 9); ctx.fillStyle = P.heart; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5; ctx.stroke();
      T(ctx, txt, x + 6, y + dy, { size: size, color: '#ffb0c0' });
      return;
    }
    if (kind === 'angryFame') {
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
    ctx.translate(640, 390);
    resultPanel(ctx, 800, 560);
    T(ctx, '七天結算', 0, -244, { size: 32 });
    var stars = clamp(Math.floor(N(s.stars, 0)), 0, 3);
    for (var i = 0; i < 3; i++) {
      starPath(ctx, -90 + i * 90, -186, 30);
      ctx.fillStyle = i < stars ? P.select : '#2c3446'; ctx.fill(); ctx.strokeStyle = i < stars ? '#fff2b0' : '#465372'; ctx.lineWidth = 3; ctx.stroke();
    }
    var rows = [['總名聲', String(Math.floor(N(s.rep, 0))), P.rep], ['累計賺得金幣', String(Math.floor(N(s.goldEarned, 0))), P.gold], ['最長連鎖', Math.floor(N(s.bestChain, 0)) + ' 段', '#9ff0ff']];
    for (var r = 0; r < 3; r++) {
      var yy = -130 + r * 34;
      T(ctx, rows[r][0], -300, yy, { size: 20, align: 'left', color: P.textDim });
      T(ctx, rows[r][1], 300, yy, { size: 24, align: 'right', color: rows[r][2] });
    }
    ctx.fillStyle = P.line; ctx.fillRect(-340, -42, 680, 2);
    // 7 天行程(與日曆、場所卡同一套場所圖示): 一排 7 格(格 62×72、間距 84, 整排 x −283~283), 每格 = 天數 + 場所圖示
    T(ctx, '行程', -340, -18, { size: 18, align: 'left', color: P.textDim });
    var days = Array.isArray(s.days) ? s.days : [];
    for (var d = 0; d < 7; d++) {
      var dx = -252 + d * 84, pl = days[d] === 'show' ? 'show' : (days[d] === 'dungeon' ? 'dungeon' : '');
      rr(ctx, dx - 31, -2, 62, 72, 10); ctx.fillStyle = '#161b27'; ctx.fill(); ctx.strokeStyle = '#353d52'; ctx.lineWidth = 1.5; ctx.stroke();
      T(ctx, String(d + 1), dx, 13, { size: 15, color: P.textDim });
      if (pl) placeIcon(ctx, pl, dx, 46, 17, 1);
      else T(ctx, '—', dx, 46, { size: 18, color: P.textDim });
    }
    ctx.fillStyle = P.line; ctx.fillRect(-340, 86, 680, 2);
    T(ctx, '怪物庫', -340, 108, { size: 18, align: 'left', color: P.textDim });
    var bank = Array.isArray(s.bank) ? s.bank : [];
    var n = Math.min(6, bank.length);
    for (var k = 0; k < n; k++) {
      var b = bank[k] || {}, sp = spKey(b.species), cx = (k - (n - 1) / 2) * 110;
      circle(ctx, cx, 156, 30); ctx.fillStyle = '#161b27'; ctx.fill();
      ctx.save(); ctx.translate(cx + (sp === 'tanuki' ? 5 : 0), 156); paintSpecies(ctx, sp, sp === 'tanuki' ? 17 : 21, {}); ctx.restore();
      T(ctx, '×' + Math.max(0, Math.floor(N(b.count, 0))), cx, 202, { size: 20 });
    }
    if (n === 0) T(ctx, '—', 0, 156, { size: 20, color: P.textDim });
    pressZ(ctx, '按 [Z] 重來', 0, 248);
  }

  // ───────────── HUD ─────────────
  function timeBar(ctx, x, y, w, h, left, max) {
    var f = p01(left, max);
    rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = '#0a0d14'; ctx.fill();
    if (f > 0) { rr(ctx, x + 2, y + 2, Math.max(h - 4, (w - 4) * f), h - 4, (h - 4) / 2); ctx.fillStyle = f < 0.2 ? P.danger : '#7ab0ff'; ctx.fill(); }
    rr(ctx, x, y, w, h, h / 2); ctx.strokeStyle = 'rgba(230,236,248,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  // 地下城 HUD 收服列: 「收服」小字 (300,74) + 第 k 隻頭像 26×26 中心 (346 + 28k, 74), k = 0~9
  // > 10 隻: 前 9 個頭像 + 第 10 格「+N」; 空陣列: 第 0 格淡淡的空框
  // 收服那一刻新頭像彈一下: 介面沒有收服時刻欄位, 美術自己記住上一幀的長度, 變長時從 now() 起彈 0.3 秒(純畫面記憶, 不影響遊戲)
  var CAUGHT_MEM = { n: 0, at: -1e9 };
  function caughtRow(ctx, caught) {
    var n = caught.length, tm = now();
    if (n > CAUGHT_MEM.n) CAUGHT_MEM.at = tm;
    CAUGHT_MEM.n = n;
    var pq = (tm - CAUGHT_MEM.at) / 300;
    T(ctx, '收服', 300, 74, { size: 15, color: P.textDim });
    if (n === 0) {
      ctx.save(); ctx.setLineDash([3, 3]); rr(ctx, 333, 61, 26, 26, 7); ctx.strokeStyle = 'rgba(198,240,70,0.3)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
      return;
    }
    var heads = n > 10 ? 9 : n;
    for (var k = 0; k < heads; k++) {
      var cx = 346 + 28 * k, sp = spKey(caught[k]);
      // 最新那一隻(n ≤ 10 時是最後一個頭像)彈一下: 0.3 秒內放大到 1.0(不超出 26×26), 從 0.6 長大
      var sc = 1;
      if (k === n - 1 && pq < 1) sc = 0.6 + 0.4 * Math.sin(Math.PI / 2 * pq);
      ctx.save(); ctx.translate(cx, 74); ctx.scale(sc, sc);
      rr(ctx, -13, -13, 26, 26, 7); ctx.fillStyle = '#141925'; ctx.fill(); ctx.strokeStyle = P.capture; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.save(); ctx.translate(sp === 'tanuki' ? 3 : 0, 0); paintSpecies(ctx, sp, sp === 'tanuki' ? 7.5 : 9.5, {}); ctx.restore();
      if (k === n - 1 && pq < 1) { rr(ctx, -13, -13, 26, 26, 7); ctx.strokeStyle = 'rgba(255,255,255,' + (1 - pq).toFixed(2) + ')'; ctx.lineWidth = 2.5; ctx.stroke(); }
      ctx.restore();
    }
    if (n > 10) {
      var px = 346 + 28 * 9;
      rr(ctx, px - 13, 61, 26, 26, 7); ctx.fillStyle = '#1e2536'; ctx.fill(); ctx.strokeStyle = P.capture; ctx.lineWidth = 1.5; ctx.stroke();
      T(ctx, '+' + (n - 9), px, 74, { size: 13, color: P.capture, maxW: 24 });
    }
  }
  function drawHud(ctx, s) {
    var phase = S(s.phase, 'select');
    var dg = phase === 'dungeon';
    var H = dg ? 100 : 50;
    ctx.fillStyle = 'rgba(12,15,22,0.94)'; ctx.fillRect(0, 0, 1280, H);
    ctx.fillStyle = '#2c3446'; ctx.fillRect(0, H - 2, 1280, 2);
    var day = Math.floor(N(s.day, 1)), dmax = Math.floor(N(s.dayMax, 7));
    var show = phase === 'show';
    T(ctx, day <= 0 ? '見習日' : '第 ' + day + ' / ' + dmax + ' 天', 20, 25, { size: 20, align: 'left', color: day <= 0 ? P.select : P.text, maxW: show ? 118 : 136 });
    if (show) {
      // 觀眾滿意度(表演中累積, 收場換金幣並加進名聲); 整組不超過 x 420(中段 420~860 留給熱度表)
      satFace(ctx, 158, 25, 10);
      ctx.save(); ctx.font = 'bold 19px ' + FONT;
      var satTxt = '觀眾滿意度 ' + Math.max(0, Math.floor(N(s.sat, 0)));
      var sw = Math.min(140, ctx.measureText(satTxt).width); ctx.restore();
      T(ctx, satTxt, 174, 25, { size: 19, align: 'left', color: P.sat, maxW: 140 });
      var cl = N(s.cheerLeft, 0), cd = N(s.cheerDur, 5);
      if (cl > 0) {
        // 歡呼中: 「歡呼 ×1.5」膠囊 + 底下剩餘時間小條(圖形給剩多少, 不寫秒數)
        var hx = Math.min(174 + sw + 8, 322);
        rr(ctx, hx, 8, 92, 26, 13); ctx.fillStyle = 'rgba(255,214,168,0.18)'; ctx.fill(); ctx.strokeStyle = P.sat; ctx.lineWidth = 1.5; ctx.stroke();
        T(ctx, '歡呼 ×1.5', hx + 46, 21, { size: 15, color: P.sat, maxW: 84 });
        ctx.fillStyle = '#0a0d14'; ctx.fillRect(hx + 6, 38, 80, 5);
        ctx.fillStyle = P.sat; ctx.fillRect(hx + 6, 38, 80 * p01(cl, cd), 5);
      }
    }
    coinIcon(ctx, 1000, 25, 10);
    T(ctx, String(Math.floor(N(s.gold, 0))), 1016, 25, { size: 20, align: 'left', color: P.gold, maxW: 106 });
    repIcon(ctx, 1132, 25, 11);
    T(ctx, String(Math.floor(N(s.rep, 0))), 1148, 25, { size: 20, align: 'left', color: P.rep, maxW: 120 });
    var tmax = N(s.timeMax, 0), tl = N(s.timeLeft, 0);
    var msg = S(s.message, '');
    if (show) {
      // 表演: 倒數改由 drawShowClock 畫在 (900,25)(x 872~924 留給時鐘, 這裡不畫時間條與秒數, 就算有傳 timeLeft 也不畫);
      // message 小字靠左畫在 x 932~994
      // 字太長會先縮字(最小 9px), 仍超出就剪在 994, 不碰右邊的金幣
      if (msg) { ctx.save(); ctx.beginPath(); ctx.rect(932, 0, 62, 50); ctx.clip(); richLine(ctx, msg, 932, 25, { size: 14, align: 'left', color: P.textDim, maxW: 62 }); ctx.restore(); }
      return;
    }
    if (tmax > 0) {
      timeBar(ctx, 470, 16, 260, 18, tl, tmax);
      T(ctx, Math.ceil(Math.max(0, tl)) + ' 秒', 744, 25, { size: 19, align: 'left', color: tl / tmax < 0.2 ? '#ff8a8a' : P.text });
    }
    var dn = DUN[s.dungeon] ? DUN[s.dungeon].name : '';
    if (dg && dn) T(ctx, dn, 160, 25, { size: 20, align: 'left', color: DUN[s.dungeon].color, maxW: 300 });
    if (!dg) {
      if (msg) richLine(ctx, msg, tmax > 0 ? 880 : 640, 25, { size: 17, color: '#d8e0ee', maxW: tmax > 0 ? 200 : 600 });
      return;
    }
    // 第 2 行(心在馴獸師頭上): 捕捉繩列(只在手上是捕捉繩時; 第 k 條中心 (40 + 22k, 74))、收服列、武器框 x 634~814、按鍵提示 (1040, 74)
    var wp = wpKey(s.weapon);
    if (wp === 'rope') {
      var rm = Math.max(0, Math.floor(N(s.ropeMax, 3))), ro = clamp(Math.floor(N(s.ropes, 0)), 0, rm);
      for (var k = 0; k < Math.min(rm, 10); k++) ropeIcon(ctx, 40 + k * 22, 74, 10, k < ro);
    }
    caughtRow(ctx, Array.isArray(s.caught) ? s.caught : []);
    rr(ctx, 634, 56, 180, 36, 8); ctx.fillStyle = '#1a2030'; ctx.fill(); ctx.strokeStyle = wp === 'rope' ? P.rope : P.line; ctx.lineWidth = 1.5; ctx.stroke();
    if (wp === 'rope') ropeCoil(ctx, 653, 72, 9.5); else iconWeapon(ctx, wp, 654, 76, 22);
    T(ctx, WEAPON[wp], 674, 74, { size: 18, align: 'left', maxW: 96, color: wp === 'rope' ? P.rope : P.text });
    var xm = N(s.xCdMax, 0), xl = N(s.xCdLeft, 0);
    if (xm > 0 && wp !== 'rope') {
      // 有 X 技才畫 X 鍵帽(棍棒、捕捉繩整格不畫): 冷卻中鍵帽壓暗 + 深色扇形蓋住剩餘, 可用時亮
      var kx = 790, ky = 74;
      ctx.save(); if (xl > 0) ctx.globalAlpha *= 0.55; keyCap(ctx, 'X', kx, ky, 24); ctx.restore();
      if (xl > 0) { var f = p01(xl, xm); ctx.beginPath(); ctx.moveTo(kx, ky); ctx.arc(kx, ky, 11, -Math.PI / 2, -Math.PI / 2 + TAU * f); ctx.closePath(); ctx.fillStyle = 'rgba(10,13,20,0.7)'; ctx.fill(); }
    }
    // 訊息色: 捕捉相關 = 捕捉萊姆; 「爆炸桶要爆了 快跑!」= 危險紅(和預警圈同一個意思); 其他 = 淡白
    var mcol = msg.indexOf('爆炸桶') >= 0 ? '#ff6b78' : ((msg.indexOf('繞') >= 0 || msg.indexOf('丟繩') >= 0) ? P.capture : '#d8e0ee');
    if (msg) richLine(ctx, msg, 1040, 74, { size: 16, color: mcol, maxW: 440 });
  }

  // ───────────── 開始畫面 ─────────────
  function drawTitle(ctx, s) {
    var t = Math.max(0, N(s.t, 0));
    ctx.beginPath(); ctx.rect(0, 0, 1280, 720); ctx.clip(); // 遊行的魔物從畫面外走進來
    var g = ctx.createLinearGradient(0, 0, 0, 720);
    g.addColorStop(0, '#1c1630'); g.addColorStop(0.6, '#241a2e'); g.addColorStop(1, '#120e18');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
    // 兩道聚光燈慢慢擺(背景氣氛, 低不透明度)
    for (var k = 0; k < 2; k++) {
      var ox = k === 0 ? 300 : 980, sw = Math.sin(t * 0.6 + k * 2) * 0.25;
      ctx.save(); ctx.translate(ox, -20); ctx.rotate(sw + (k === 0 ? -0.15 : 0.15));
      ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(20, 0); ctx.lineTo(170, 560); ctx.lineTo(-170, 560); ctx.closePath();
      ctx.fillStyle = 'rgba(255,240,200,0.06)'; ctx.fill(); ctx.restore();
    }
    // 舞台
    ell(ctx, 640, 520, 620, 110, 0); ctx.fillStyle = '#2b2a35'; ctx.fill(); ctx.strokeStyle = '#4a4458'; ctx.lineWidth = 3; ctx.stroke();
    ell(ctx, 640, 520, 380, 64, 0); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 2; ctx.stroke();
    // 遊戲名
    ctx.save(); ctx.translate(640, 170);
    var bob = Math.sin(t * 1.6) * 3;
    T(ctx, '來馬戲團看一點大場面', 0, bob, { size: 74, color: '#ffe08a', strokeColor: '#3a1a10', strokeW: 12 });
    ctx.restore();
    for (var st = 0; st < 5; st++) {
      var sa = t * 1.2 + st * 1.3, sx = 300 + st * 170, sy = 92 + Math.sin(sa) * 6;
      starPath(ctx, sx, sy, 7 + 2 * Math.sin(sa * 1.7)); ctx.fillStyle = 'rgba(255,224,138,0.7)'; ctx.fill();
    }
    // 小場景: 魔物在舞台上走、火柴猴丟直線火柴(遊戲內畫法 + 規則上成立的狀態)
    var parade = ['monkey', 'lily', 'penguin', 'parrot', 'tanuki', 'beetle'];
    for (var i = 0; i < parade.length; i++) {
      var sp = parade[i];
      var x = ((t * 70 + i * 250) % 1500) - 110, y = 505 + (i % 2) * 22;
      var dy = 0;
      if (sp === 'monkey') { var hp = (t % 1.0) / 0.3; if (hp < 1) dy = -Math.sin(Math.PI * hp) * 8; }
      ell(ctx, x, y + 26, 22, 5, 0); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      ctx.save(); ctx.translate(x, y + dy); paintSpecies(ctx, sp, sp === 'tanuki' ? 25 : 26, { dir: 1 }); ctx.restore();
      if (sp === 'monkey') {
        var ct = t % 3;
        if (ct < 1.4) {
          window.Art.drawHazard(ctx, { x: x + 34 + ct * 200, y: y - 4, kind: 'match', phase: 'fly', radius: 14, angle: 0, t: ct, dur: 2.4, reflected: false, killer: false });
        }
      }
    }
    // 按 [Z] 開始(閃爍週期 1 秒; Z 畫成鍵帽)
    if ((t % 1) < 0.62) richLine(ctx, '按 [Z] 開始', 640, 636, { size: 36, color: '#ffffff' });
  }

  // ───────────── 日曆過場 ─────────────
  function dayLabel(d) { return d <= 0 ? '見習日' : '第 ' + d + ' 天'; }
  function calPage(ctx, label, hdr) {
    rr(ctx, -260, -170, 520, 340, 14); ctx.fillStyle = '#f6f0e4'; ctx.fill(); ctx.strokeStyle = '#6a5a48'; ctx.lineWidth = 3; ctx.stroke();
    ctx.save(); rr(ctx, -260, -170, 520, 340, 14); ctx.clip(); ctx.fillStyle = hdr; ctx.fillRect(-260, -170, 520, 64); ctx.restore();
    if (label) T(ctx, label, 0, 36, { size: 96, color: '#1a2030', stroke: false });
  }
  function drawCalendar(ctx, s) {
    var dmax = clamp(Math.floor(N(s.dayMax, 7)), 1, 10), day = clamp(Math.floor(N(s.day, 0)), 0, dmax);
    var t = Math.max(0, N(s.t, 0));
    var log = Array.isArray(s.log) ? s.log : [];
    var g = ctx.createLinearGradient(0, 0, 0, 720);
    g.addColorStop(0, '#1e1a24'); g.addColorStop(1, '#100d14');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
    // 桌面
    ctx.fillStyle = '#2a2018'; ctx.fillRect(0, 520, 1280, 200);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(0, 520, 1280, 3);
    // 桌曆
    ctx.save(); ctx.translate(640, 300);
    ctx.beginPath(); ctx.moveTo(-280, 170); ctx.lineTo(-240, 210); ctx.lineTo(240, 210); ctx.lineTo(280, 170); ctx.closePath(); ctx.fillStyle = '#4a3a2c'; ctx.fill();
    var hdr = '#3a4a78';
    var p = clamp(t / 0.6, 0, 1);
    var pop = t < 0.6 ? 0 : clamp((t - 0.6) / 0.2, 0, 1);
    // 新的一頁(今天)
    ctx.save();
    calPage(ctx, '', hdr);
    var sc = t < 0.6 ? 1 : 1.18 - 0.18 * pop;
    ctx.translate(0, 36); ctx.scale(sc, sc);
    T(ctx, dayLabel(day), 0, 0, { size: 96, color: day <= 0 ? '#b07a10' : '#1a2030', stroke: false });
    ctx.restore();
    // 舊的一頁往上翻走(0~0.6 秒)
    if (p < 1) {
      ctx.save();
      ctx.translate(0, -170); ctx.scale(1, 1 - p); ctx.translate(0, 170);
      ctx.globalAlpha *= 1 - p * 0.3;
      calPage(ctx, day >= 1 ? dayLabel(day - 1) : '', hdr);
      ctx.fillStyle = 'rgba(0,0,0,' + (0.35 * p).toFixed(2) + ')'; rr(ctx, -260, -170, 520, 340, 14); ctx.fill();
      ctx.restore();
    }
    // 頂端裝訂環
    for (var r = 0; r < 6; r++) {
      var rx = -200 + r * 80;
      rr(ctx, rx - 6, -188, 12, 34, 6); ctx.fillStyle = '#c8ccd4'; ctx.fill(); ctx.strokeStyle = '#4a4e58'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
    // 7 格天數排一排(格寬 92、間距 120, 中心 x 260~980, 整排 x 214~1026; 右側 (1150,610)「共 7 天」): 已過畫叉 + 那天去了哪; 今天亮起
    var n = dmax, gapC = Math.min(120, 860 / n), c0 = 620 - (n - 1) * gapC / 2;
    for (var i = 0; i < n; i++) {
      var cx = c0 + i * gapC, cy = 610;
      var isToday = i === day - 1, past = i < day - 1;
      var pl = log[i] === 'show' ? 'show' : (log[i] === 'dungeon' ? 'dungeon' : '');
      rr(ctx, cx - 46, cy - 42, 92, 84, 12);
      ctx.fillStyle = isToday ? '#3a3020' : (past ? '#1c1a22' : '#24222c'); ctx.fill();
      ctx.strokeStyle = isToday ? P.select : '#4a4458'; ctx.lineWidth = 2; ctx.stroke();
      T(ctx, String(i + 1), cx - 30, cy - 26, { size: 18, color: isToday ? P.select : (past ? '#6a6878' : P.textDim) });
      if (past) {
        if (pl) placeIcon(ctx, pl, cx + 4, cy + 6, 20, 0.75);
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx - 26, cy - 22); ctx.lineTo(cx + 30, cy + 30); ctx.moveTo(cx + 30, cy - 22); ctx.lineTo(cx - 26, cy + 30); ctx.stroke();
      }
      if (isToday) {
        var glow = t < 0.6 ? 0 : 0.6 + 0.4 * Math.sin((t - 0.6) * 6);
        ctx.save(); ctx.shadowColor = 'rgba(255,210,74,0.8)'; ctx.shadowBlur = 16 * glow;
        rr(ctx, cx - 44, cy - 40, 88, 80, 11); ctx.strokeStyle = P.select; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
        T(ctx, '今天', cx + 4, cy + 8, { size: 21, color: '#ffffff' });
      }
    }
    T(ctx, '共 ' + dmax + ' 天', 1150, 610, { size: 26, color: P.textDim });
  }

  // ───────────── 見習過場(見習草地 → 見習表演) ─────────────
  function drawIntermission(ctx, s) {
    var t = Math.max(0, N(s.t, 0)), ready = B(s.ready);
    var mons = (Array.isArray(s.monsters) ? s.monsters : []).slice(0, 6);
    ctx.beginPath(); ctx.rect(0, 0, 1280, 720); ctx.clip();
    var g = ctx.createLinearGradient(0, 0, 0, 720);
    g.addColorStop(0, '#1c1630'); g.addColorStop(0.6, '#241a2e'); g.addColorStop(1, '#120e18');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
    // 標題 + 一句話
    T(ctx, '見習表演', 640, 66, { size: 56, color: '#ffe08a', strokeColor: '#3a1a10', strokeW: 10 });
    T(ctx, '把剛抓到的火柴猴帶上台表演給觀眾看!', 640, 128, { size: 26, color: '#ffffff', maxW: 1100 });
    // 帳篷(和場所卡「表演」同一個圖示)+ 舞台
    ell(ctx, 640, 438, 360, 40, 0); ctx.fillStyle = '#2b2a35'; ctx.fill(); ctx.strokeStyle = '#4a4458'; ctx.lineWidth = 3; ctx.stroke();
    ell(ctx, 640, 438, 220, 22, 0); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 2; ctx.stroke();
    placeIcon(ctx, 'show', 640, 318, 132, 1);
    // 剛收服的魔物走向舞台(遊戲內畫法; 火柴猴每 1 秒跳一次), 到了之後輪流表演(白環)
    var n = mons.length;
    for (var i = 0; i < n; i++) {
      var sp = spKey(mons[i]);
      var tx = 640 - (n - 1) * 40 + i * 80, sx = -60 - (n - 1 - i) * 80;
      var x = Math.min(tx, sx + t * 220), arrived = x >= tx;
      var y = 430, dy = 0;
      var hp = ((t + i * 0.4) % 1.0) / 0.3;
      if (sp === 'monkey' && hp < 1) dy = -Math.sin(Math.PI * hp) * 8;
      ell(ctx, x, y + 24, 22, 5, 0); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      ctx.save(); ctx.translate(x, y + dy); paintSpecies(ctx, sp, sp === 'tanuki' ? 22 : 24, { dir: 1 }); ctx.restore();
      if (arrived) {
        var pc = ((t + i * 1.0) % 2.0) / 0.5;
        if (pc < 1) { circle(ctx, x, y + dy, 24 + 6 * pc); ctx.strokeStyle = 'rgba(255,255,255,' + (0.9 * (1 - pc)).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.stroke(); }
      }
    }
    // 三步圖解
    var steps = ['① 選 3 隻上台','② 排暗號節目單: 什麼時候 → 演什麼', '③ 開演, 看牠們表演賺觀眾滿意度'];
    for (var k = 0; k < 3; k++) {
      var px = 222 + k * 418, py = 568;
      panel(ctx, px - 198, py - 58, 396, 116, 14, '#232a3a', P.line);
      ctx.save(); ctx.translate(px, py - 22);
      if (k === 0) {
        // 怪物庫 3 格(3 隻全上台): 每格頭像 + 上台勾
        for (var q = -1; q <= 1; q++) {
          ctx.save(); ctx.translate(q * 74, 0);
          rr(ctx, -32, -26, 64, 52, 8); ctx.fillStyle = P.panelHi; ctx.fill(); ctx.strokeStyle = ONSTAGE; ctx.lineWidth = 2; ctx.stroke();
          ctx.save(); ctx.translate(4, 2); paintSpecies(ctx, 'monkey', 15, { dir: 1 }); ctx.restore();
          circle(ctx, -22, -16, 8); ctx.fillStyle = ONSTAGE; ctx.fill(); ctx.strokeStyle = P.outline; ctx.lineWidth = 1.2; ctx.stroke();
          ctx.strokeStyle = '#10131b'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-26, -16); ctx.lineTo(-23, -13); ctx.lineTo(-18, -19); ctx.stroke();
          ctx.restore();
        }
      } else if (k === 1) {
        // 暗號格 → 節目格
        cellBox(ctx, -62, 0, 96, 40, P.cue, true); iconCue(ctx, 'wait', -56, 0, 13, 1);
        T(ctx, '→', 0, 0, { size: 22, color: '#ffffff' });
        cellBox(ctx, 62, 0, 96, 40, P.program, true); iconProg(ctx, 'all', 68, 0, 13, 1);
      } else {
        // 表演白環 + 滿意度笑臉
        paintSpecies(ctx, 'monkey', 18, { dir: 1 });
        circle(ctx, 0, 0, 25); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5; ctx.stroke();
        satFace(ctx, 50, -6, 13);
        T(ctx, '+', 34, -14, { size: 16, color: P.sat });
      }
      ctx.restore();
      T(ctx, steps[k], px, py + 34, { size: 19, color: P.text, maxW: 372 });
    }
    // 按 Z 繼續(出現 0.6 秒後; 閃爍週期 1 秒)
    if (ready && (t % 1) < 0.62) richLine(ctx, '按 [Z] 繼續', 640, 674, { size: 28, color: '#ffffff' });
  }

  // ───────────── 今天去哪: 場所卡(大卡 440×440 地下城 / 表演; 小卡 260×300 商店), 全部依 w,h 縮放 ─────────────
  function drawPlaceCard(ctx, s) {
    var pl = PLACE[s.place] ? s.place : 'dungeon', info = PLACE[pl], sel = B(s.selected);
    var big0 = pl !== 'shop';
    var w = Math.max(120, N(s.w, big0 ? 440 : 260)), h = Math.max(140, N(s.h, big0 ? 440 : 300));
    var big = w >= 360;                       // 大卡 / 小卡的字級與插圖分檔
    var hw = w / 2, hh = h / 2, r = big ? 18 : 14;
    var band = Math.round(h * 0.19);          // 頂色帶高約 h 的 19%
    var nameSz = big ? 44 : 28, noteSz = big ? 22 : 16, iconS = big ? 100 : 56;
    var noteY = hh - h * 0.14;                // 小字在卡下緣上方約 h 的 14%
    var iconY = (-hh + band + noteY) / 2 - iconS * 0.1;
    ctx.translate(N(s.x, 0), N(s.y, 0));
    ctx.beginPath(); ctx.rect(-hw, -hh, w, h); ctx.clip(); // 畫面邊界 = 判定邊界
    panel(ctx, -hw + 1, -hh + 1, w - 2, h - 2, r, sel ? P.panelHi : P.panel, sel ? '#5a6a90' : P.line);
    ctx.save(); rr(ctx, -hw + 2, -hh + 2, w - 4, band - 4, r - 2); ctx.clip();
    ctx.fillStyle = info.color; ctx.globalAlpha = sel ? 0.95 : 0.6; ctx.fillRect(-hw, -hh, w, band); ctx.restore();
    T(ctx, info.name, 0, -hh + band / 2, { size: nameSz, color: '#ffffff', maxW: w - 30 });
    // 插圖
    var gr = Math.min(hw, (noteY - (-hh + band)) / 2) * 1.1;
    var rg = ctx.createRadialGradient(0, iconY, 10, 0, iconY, gr);
    rg.addColorStop(0, 'rgba(255,255,255,' + (sel ? 0.12 : 0.05) + ')'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg; ctx.fillRect(-hw + 8, -hh + band, w - 16, noteY - (-hh + band) - noteSz);
    ell(ctx, 0, iconY + iconS * 0.88, iconS * 1.3, iconS * 0.19, 0); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
    placeIcon(ctx, pl, 0, iconY, iconS, sel ? 1 : 0.75);
    if (pl === 'dungeon') { ctx.save(); ctx.translate(0, iconY + iconS * 0.7); ctx.globalAlpha *= sel ? 1 : 0.75; paintSpecies(ctx, 'monkey', 18 * iconS / 82, { dir: 1 }); ctx.restore(); }
    // 小字(要放得進 w − 40)
    var note = S(s.note, '');
    T(ctx, note, 0, noteY, { size: noteSz, color: sel ? '#ffffff' : '#c8d0e0', maxW: w - 40 });
    if (sel) selectFrame(ctx, -hw, -hh, w, h, r);
  }

  // ───────────── 新手教學泡泡(明暗與全畫面面板反轉: 淺紙底 + 深字; 只給教學用) ─────────────
  function tutorKey(ctx, key, x, y, pressed, hop) {
    ctx.save(); ctx.translate(x, y - hop);
    // 大鍵帽 34×34: 和文字裡的小鍵帽同一個長相(淺頂面 + 下緣厚邊); 按過的 = 綠頂面白箭頭 + 右上打勾
    // 每顆只畫一個符號: 方向鍵的箭頭由 keyCap 畫; circle 傳空字串給 keyCap(不畫字), 繞圈箭頭在下面另畫。不可再疊字母(polish-5 疊了「Z」→ 看起來像鍵疊在一起)
    keyCap(ctx, key === 'circle' ? '' : key, 0, 0, 34, { lit: pressed });
    var ink = pressed ? '#ffffff' : P.tutorInk;
    ctx.fillStyle = ink; ctx.strokeStyle = ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (key === 'circle') {
      ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -3, 8.5, -Math.PI * 0.35, Math.PI * 1.35); ctx.stroke();
      var ea = Math.PI * 1.35, ex = Math.cos(ea) * 9, ey = -1 + Math.sin(ea) * 9;
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(ea + Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-3, -5); ctx.lineTo(-3, 5); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    if (pressed) {
      // 右上小勾: 圓心 (10,-10) 半徑 6(含框線最遠到 16.75), 整個在鍵帽 34×34 框內
      circle(ctx, 10, -10, 6); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = P.tutorInk; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.strokeStyle = P.tutorOk; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(7, -10); ctx.lineTo(9.5, -7.5); ctx.lineTo(13, -12.5); ctx.stroke();
    }
    ctx.restore();
  }
  var KEY_OK = { up: 1, down: 1, left: 1, right: 1, circle: 1 }; // 本輪 z、x 不再出現在 keys(改寫在 text 的鍵帽標記)
  function drawTutorial(ctx, s) {
    var bx = N(s.bx, 640), by = N(s.by, 360), tx = N(s.x, bx), ty = N(s.y, by + 100);
    var up = S(s.side, 'up') !== 'down'; // up: 泡泡在目標上方, 尾巴朝下
    var done = S(s.phase, 'show') === 'done';
    var ap = p01(N(s.appearT, 0.25), N(s.appearDur, 0.25) || 0.25);
    if (N(s.appearDur, 0.25) <= 0) ap = 1;
    var dq = done ? p01(s.doneT, N(s.doneDur, 0.6) || 0.6) : 0;
    var keys = (Array.isArray(s.keys) ? s.keys : []).filter(function (k) { return KEY_OK[k]; }).slice(0, 6);
    var pressed = Array.isArray(s.pressed) ? s.pressed : [];
    var text = S(s.text, '');
    // 附註(note): 單行扁泡泡(338×38, 含 2px 框線剛好在 noteBubble 340×40 內)、顏色較淡(淡紙底 + 灰墨細框 + 灰字), 不畫按鍵;
    // RD 固定傳 bx,by = (186,26)、side up: 泡泡整個在 HUD 帶 y 6~46 內, 尾巴從下緣朝下指向繩列正中央, 根部 x 跟著尖端 x
    var note = S(s.kind, 'main') === 'note';
    var HW = note ? 169 : 158, HH = note ? 19 : 46;
    var INK = note ? '#5a6274' : P.tutorInk, BG = note ? 'rgba(255,250,236,0.92)' : P.tutorBg, LW = note ? 2 : 3;
    if (note) keys = [];
    // 彈出: 以尾巴根部為錨, 0.6 → 1 帶一點回彈
    var baseY = up ? by + HH + 2 : by - HH - 2;
    var sc = ap >= 1 ? 1 : 0.6 + 0.4 * (1 - Math.pow(1 - ap, 3)); // 不過衝: 全程不超出 320×96
    var alpha = done && dq > 0.65 ? Math.max(0, 1 - (dq - 0.65) / 0.35) : 1;
    ctx.globalAlpha *= alpha * (ap >= 1 ? 1 : 0.4 + 0.6 * ap);
    var TB = note ? HW - 22 : HW - 28; // 尾巴根部可移動範圍(主 bx ± 130; 附註 bx ± 147 → 附註根部 x 幾乎都直接等於尖端 x)
    ctx.translate(clamp(tx, bx - TB, bx + TB), baseY); ctx.scale(sc, sc); ctx.translate(-clamp(tx, bx - TB, bx + TB), -baseY);
    // 尾巴: 從泡泡邊緣指向目標(停在目標前 6px, 不蓋住目標)
    var tb = clamp(tx, bx - TB, bx + TB), tw0 = note ? 8 : 13;
    var dxv = tx - tb, dyv = ty - baseY, dl = Math.sqrt(dxv * dxv + dyv * dyv) || 1;
    var tipX = tx - dxv / dl * 6, tipY = ty - dyv / dl * 6;
    if ((up && tipY < baseY + 6) || (!up && tipY > baseY - 6)) { tipX = tb; tipY = baseY + (up ? 14 : -14); }
    function tail() { ctx.beginPath(); ctx.moveTo(tb - tw0, baseY + (up ? -3 : 3)); ctx.lineTo(tipX, tipY); ctx.lineTo(tb + tw0, baseY + (up ? -3 : 3)); ctx.closePath(); }
    ctx.lineJoin = 'round';
    tail(); ctx.fillStyle = BG; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = LW; ctx.stroke();
    // 泡泡本體(主 316×92 / 附註 296×56)
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,' + (note ? 0.3 : 0.45) + ')'; ctx.shadowBlur = note ? 6 : 10;
    rr(ctx, bx - HW, by - HH, HW * 2, HH * 2, note ? 10 : 16); ctx.fillStyle = BG; ctx.fill(); ctx.restore();
    rr(ctx, bx - HW, by - HH, HW * 2, HH * 2, note ? 10 : 16); ctx.strokeStyle = INK; ctx.lineWidth = LW; ctx.stroke();
    tail(); ctx.fillStyle = BG; ctx.fill(); // 蓋掉接縫
    if (done) { rr(ctx, bx - HW, by - HH, HW * 2, HH * 2, note ? 10 : 16); ctx.fillStyle = 'rgba(47,176,96,' + (0.18 * (1 - dq)).toFixed(2) + ')'; ctx.fill(); }
    // 文字 + 按鍵
    var hasK = keys.length > 0;
    // 附註完成時字往左讓 14px、縮到 270 寬, 讓右端的打勾章不壓字
    // 文字裡的 [Z] [C] [↓] [←][→] 等標記畫成小鍵帽, 和字同一行(附註不畫鍵帽: 照樣解析, 但 RD 給的附註文字沒有標記)
    richLine(ctx, text, note && done ? bx - 14 : bx, hasK ? by - 21 : by, { size: note ? 15 : 20, color: note ? '#3a4254' : P.tutorInk, stroke: false, maxW: note ? (done ? 270 : 318) : (done ? 250 : 296) });
    if (hasK) {
      // 一橫排、照陣列順序, 每顆 34×34、間距 12(4 顆整排 172 寬, 以 bx 為中心), 中心 y = by + 22
      var gap = 12, tw = keys.length * 34 + (keys.length - 1) * gap, k0 = bx - tw / 2 + 17;
      for (var i = 0; i < keys.length; i++) {
        var hop = 0;
        if (done) { var hq = (dq - i * 0.08) / 0.2; if (hq > 0 && hq < 1) hop = Math.sin(Math.PI * hq) * 6; }
        tutorKey(ctx, keys[i], k0 + i * (34 + gap), by + 22, pressed.indexOf(keys[i]) >= 0, hop);
      }
    }
    // 完成特效(通用): 右上打勾章由小變大 + 星星噴開
    if (done) {
      var cq = clamp(dq / 0.3, 0, 1), cs = (0.4 + 0.6 * cq + 0.15 * Math.sin(Math.PI * cq)) * (note ? 0.72 : 1);
      var stX = note ? bx + HW - 22 : bx + 132, stY = note ? by : by - 20;
      ctx.save(); ctx.translate(stX, stY); ctx.scale(cs, cs);
      circle(ctx, 0, 0, 17); ctx.fillStyle = P.tutorOk; ctx.fill(); ctx.strokeStyle = P.tutorInk; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-2, 6); ctx.lineTo(8, -6); ctx.stroke();
      ctx.restore();
      var sq = clamp((dq - 0.1) / 0.7, 0, 1);
      if (sq > 0 && sq < 1) {
        for (var k = 0; k < 6; k++) {
          var a = -Math.PI / 2 + k * TAU / 6, d = (note ? 14 : 18) + (note ? 16 : 26) * sq;
          var sx = clamp(stX + Math.cos(a) * d, bx - HW + 8, bx + HW - 4), sy = clamp(stY + Math.sin(a) * d, by - HH + 4, by + HH - 4);
          starPath(ctx, sx, sy, (note ? 4.5 : 6) * (1 - sq * 0.5)); ctx.fillStyle = P.select; ctx.fill(); ctx.strokeStyle = P.tutorInk; ctx.lineWidth = 1.2; ctx.stroke();
        }
      }
    }
  }


  // ───────────── 匯出 ─────────────
  window.Art = {
    canvas: { width: 1280, height: 720 },
    palette: P,
    drawBackground: wrap(drawBackground),
    drawTitle: wrap(drawTitle),
    drawCalendar: wrap(drawCalendar),
    drawIntermission: wrap(drawIntermission),
    drawPlaceCard: wrap(drawPlaceCard),
    drawTile: wrap(drawTile),
    drawFruitTree: wrap(drawFruitTree),
    drawFruit: wrap(drawFruit),
    drawKeg: wrap(drawKeg),
    drawFountain: wrap(drawFountain),
    drawPortal: wrap(drawPortal),
    drawCrackWall: wrap(drawCrackWall),
    drawExit: wrap(drawExit),
    drawExitPrompt: wrap(drawExitPrompt),
    drawTamer: wrap(drawTamer),
    drawHeartBar: wrap(drawHeartBar),
    drawWildMonster: wrap(drawWildMonster),
    drawWeaponPicker: wrap(drawWeaponPicker),
    drawDownFx: wrap(drawDownFx),
    drawRopeThrow: wrap(drawRopeThrow),
    drawLasso: wrap(drawLasso),
    drawHazard: wrap(drawHazard),
    drawBlast: wrap(drawBlast),
    drawWeaponFx: wrap(drawWeaponFx),
    drawDungeonCard: wrap(drawDungeonCard),
    drawDungeonResult: wrap(drawDungeonResult),
    drawBankSlot: wrap(drawBankSlot),
    drawMonsterInfo: wrap(drawMonsterInfo),
    drawScrollMark: wrap(drawScrollMark),
    drawCueRow: wrap(drawCueRow),
    drawPickerPanel: wrap(drawPickerPanel),
    drawBannerFx: wrap(drawBannerFx),
    drawShowArena: wrap(function (ctx) { drawShowArena(ctx); }),
    drawShowMonster: wrap(drawShowMonster),
    drawFence: wrap(drawFence),
    drawVisitor: wrap(drawVisitor),
    drawHeatMeter: wrap(drawHeatMeter),
    drawShowClock: wrap(drawShowClock),
    drawHeatAlert: wrap(drawHeatAlert),
    drawLooseFx: wrap(drawLooseFx),
    drawShowResult: wrap(drawShowResult),
    drawShopTab: wrap(drawShopTab),
    drawShopItem: wrap(drawShopItem),
    drawShopDetail: wrap(drawShopDetail),
    drawButton: wrap(drawButton),
    drawFloatText: wrap(drawFloatText),
    drawResultPanel: wrap(drawResultPanel),
    drawHud: wrap(drawHud),
    drawTutorial: wrap(drawTutorial)
  };
})();
