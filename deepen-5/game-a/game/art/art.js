/* 導播台怪獸秀 — 美術 (deepen-5 / game-a)
 * 全部 Canvas 2D 幾何繪製, 不引外部資源。全域 window.Art, 非 ES module。
 * 每個函式自己 save / restore; 只畫, 不改狀態。
 */
(function () {
  'use strict';

  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';

  // ---------- 色票 ----------
  var PAL = {
    bg: '#17132a', bg2: '#0f0c1c',
    panel: '#2a2440', panel2: '#362f52', panelEdge: '#5a5080',
    text: '#f4f0ff', textDim: '#a79fc4', textMute: '#6e6790',
    outline: '#1b1426',
    select: '#ffffff',
    ignite: '#ff4a3d', calm: '#3d8bff', special: '#b25cff',
    catch: '#6dffa8',
    program: '#36c9d6',
    rule: '#e8b04a',
    gold: '#ffd23f', rep: '#ffe680',
    heart: '#ff5c7a',
    reflect: '#ffd23f',
    danger: '#ff7a2e',
    tamerCoat: '#2b3350', tamerHat: '#c8964a', tamerScarf: '#ffd23f', tamerSkin: '#f2c9a0',
    bunny: '#f3e6c4', cloud: '#bcdcf7', rat: '#f08a2a', turtle: '#4fb06a', hawk: '#d95fb2', rhino: '#98877a',
    arenaFloor: '#c9a46a', arenaLine: '#e8d2a0', stands: '#3a2f4a',
    mark: '#ff2e63'
  };

  var SP = {
    bunny:  { name: '蒲公英兔', body: PAL.bunny,  dark: '#a8884c', acc: '#ffd84a', eff: 'ignite' },
    cloud:  { name: '霧雨雲',   body: PAL.cloud,  dark: '#6f97c0', acc: '#ffffff', eff: 'calm' },
    rat:    { name: '爆竹鼠',   body: PAL.rat,    dark: '#9c4c10', acc: '#d8262b', eff: 'ignite' },
    turtle: { name: '磁石龜',   body: PAL.turtle, dark: '#25683a', acc: '#d4d8e0', eff: 'pull' },
    hawk:   { name: '隕星鷹',   body: PAL.hawk,   dark: '#7d2a66', acc: '#ffe680', eff: 'ignite' },
    rhino:  { name: '號角犀',   body: PAL.rhino,  dark: '#54473d', acc: '#f2e4c8', eff: 'push' }
  };
  var SP_KEYS = ['bunny', 'cloud', 'rat', 'turtle', 'hawk', 'rhino'];
  var EFF = {
    ignite: { name: '激怒', color: PAL.ignite },
    calm:   { name: '冷靜', color: PAL.calm },
    pull:   { name: '吸引', color: PAL.special },
    push:   { name: '擊退', color: PAL.special }
  };
  var HZ_EFF = { seed: 'ignite', rain: 'calm', cracker: 'ignite', magnet: 'pull', meteor: 'ignite', quake: 'push' };
  var PROG = {
    brawl:   { name: '混戰',     desc: '大家互相靠近' },
    scatter: { name: '散開',     desc: '大家互相遠離' },
    rest:    { name: '中場休息', desc: '全場慢慢冷靜' },
    cheer:   { name: '加油',     desc: '全場慢慢升溫' },
    photo:   { name: '大合照',   desc: '大家擠到中央' },
    allegro: { name: '快板',     desc: '大家表演得更勤' },
    parade:  { name: '遊行',     desc: '大家繞場一圈' },
    adagio:  { name: '慢板',     desc: '全場慢動作' }
  };
  var RULE = {
    calm:    { name: '冷靜鈴', desc: '當誰標記到 3, 那隻就冷靜' },
    pep:     { name: '打氣鈴', desc: '當誰怒氣掉到 50 下, 那隻就打起精神' },
    relay:   { name: '傳火令', desc: '當誰被激怒, 那隻就去撞最近的' },
    double:  { name: '連發令', desc: '當誰一招打中 2 隻以上, 那隻就再演一次' },
    shelter: { name: '避難令', desc: '當誰標記到 4, 那隻就躲開大家' }
  };
  var DUNGEON = {
    meadow: { name: '蒲公英草原', sp: ['bunny', 'cloud'] },
    mine:   { name: '爆竹礦坑',   sp: ['rat', 'turtle'] },
    temple: { name: '星墜神殿',   sp: ['hawk', 'rhino'] }
  };
  var TILE_PAL = {
    meadow: { floor: '#6fae4f', floor2: '#7dbd5a', wall: '#4b5d3c', wallTop: '#6c8257', wallDark: '#2c3824',
              slow: '#6b4a2e', slow2: '#8a6440', hurt: '#c0502a', nest: '#d9b86a' },
    mine:   { floor: '#76695c', floor2: '#827466', wall: '#3d322b', wallTop: '#5a4b40', wallDark: '#221b17',
              slow: '#2c2a2b', slow2: '#4a4648', hurt: '#c0502a', nest: '#c9a35a' },
    temple: { floor: '#8a80a6', floor2: '#978db3', wall: '#3d3558', wallTop: '#5b5180', wallDark: '#221d36',
              slow: '#c9a96b', slow2: '#e0c48a', hurt: '#c0502a', nest: '#e0c890' }
  };
  var WEAPON = {
    club: { name: '棍棒', desc: 'Z 敲擊 X 無' },
    sword: { name: '劍', desc: 'Z 斬擊可打回飛彈 X 擊暈' },
    spear: { name: '長槍', desc: 'Z 長刺 X 突進' },
    whip: { name: '長鞭', desc: 'Z 整圈抽打 X 擊飛' }
  };
  var UPG = {
    attack: { name: '攻擊力 +1', desc: '每次攻擊傷害 +1' },
    armor: { name: '護甲 心 +1', desc: '心上限 +1' },
    ropeBag: { name: '繩袋 捕獸繩 +1', desc: '每天捕獸繩 +1' }
  };

  // ---------- 工具 ----------
  function S(st) { return (st && typeof st === 'object') ? st : {}; }
  function num(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; }
  function pick(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function ratio(t, dur) { t = num(t, 0); dur = num(dur, 0); if (dur <= 0) return 0; return clamp(t / dur, 0, 1); }
  function str(v) { return typeof v === 'string' ? v : (v == null ? '' : String(v)); }
  function bool(v) { return v === true; }
  function spKey(v) { return SP[v] ? v : 'bunny'; }
  function effKey(v) { return EFF[v] ? v : ''; }
  function TAU() { return Math.PI * 2; }

  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
    ctx.lineTo(x + w, y + h - r);
    ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    ctx.lineTo(x + r, y + h);
    ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    ctx.lineTo(x, y + r);
    ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
    ctx.closePath();
  }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); }
  function setFont(ctx, size, weight) { ctx.font = (weight || 'bold') + ' ' + Math.round(size) + 'px ' + FONT; }
  function measure(ctx, s) {
    var m = ctx.measureText ? ctx.measureText(s) : null;
    return (m && typeof m.width === 'number') ? m.width : s.length * 12;
  }
  // 文字: o = { size, color, align, base, weight, stroke(false 或顏色), sw, maxW }
  function tx(ctx, s, x, y, o) {
    o = o || {};
    s = str(s);
    if (!s) return;
    var size = o.size || 16;
    setFont(ctx, size, o.weight);
    if (o.maxW) {
      var guard = 0;
      while (measure(ctx, s) > o.maxW && size > 9 && guard < 20) { size -= 1; setFont(ctx, size, o.weight); guard++; }
    }
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.base || 'middle';
    if (o.stroke !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = o.sw || Math.max(2.5, size / 4.5);
      ctx.strokeStyle = o.stroke || 'rgba(12,8,22,0.92)';
      ctx.strokeText(s, x, y);
    }
    ctx.fillStyle = o.color || PAL.text;
    ctx.fillText(s, x, y);
  }
  function arrow(ctx, x1, y1, x2, y2, color, w, head) {
    var a = Math.atan2(y2 - y1, x2 - x1);
    head = head || 12;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(12,8,22,0.85)'; ctx.lineWidth = w + 4;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * head * 0.6, y2 - Math.sin(a) * head * 0.6); ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * head * 0.6, y2 - Math.sin(a) * head * 0.6); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.5) * head, y2 - Math.sin(a - 0.5) * head);
    ctx.lineTo(x2 - Math.cos(a + 0.5) * head, y2 - Math.sin(a + 0.5) * head);
    ctx.closePath();
    ctx.fillStyle = color; ctx.strokeStyle = 'rgba(12,8,22,0.85)'; ctx.lineWidth = 2;
    ctx.stroke(); ctx.fill();
    ctx.restore();
  }
  function star(ctx, x, y, r, n, inner) {
    n = n || 5; inner = inner || 0.45;
    ctx.beginPath();
    for (var i = 0; i < n * 2; i++) {
      var rad = (i % 2 === 0) ? r : r * inner;
      var a = -Math.PI / 2 + i * Math.PI / n;
      if (i === 0) ctx.moveTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
      else ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath();
  }
  function hash(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

  // ---------- 小圖示 ----------
  function coin(ctx, x, y, r) {
    circle(ctx, x, y, r); ctx.fillStyle = PAL.gold; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.18); ctx.strokeStyle = '#8a6410'; ctx.stroke();
    circle(ctx, x, y, r * 0.55); ctx.strokeStyle = '#c99a1e'; ctx.lineWidth = Math.max(1, r * 0.14); ctx.stroke();
  }
  function repStar(ctx, x, y, r, filled) {
    star(ctx, x, y, r, 5, 0.48);
    ctx.fillStyle = filled === false ? 'rgba(255,255,255,0.08)' : PAL.rep; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.14); ctx.strokeStyle = filled === false ? PAL.textMute : '#9a7a1a'; ctx.stroke();
  }
  function heartPath(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.85);
    ctx.bezierCurveTo(x - r * 1.3, y - r * 0.1, x - r * 0.6, y - r * 1.05, x, y - r * 0.35);
    ctx.bezierCurveTo(x + r * 0.6, y - r * 1.05, x + r * 1.3, y - r * 0.1, x, y + r * 0.85);
    ctx.closePath();
  }
  function keycap(ctx, label, x, y, sz) {
    sz = sz || 30;
    ctx.save();
    rr(ctx, x - sz / 2, y - sz / 2 + 3, sz, sz, 6); ctx.fillStyle = '#6a6290'; ctx.fill();
    rr(ctx, x - sz / 2, y - sz / 2, sz, sz - 2, 6); ctx.fillStyle = '#f4f0ff'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
    tx(ctx, label, x, y - 1, { size: sz * 0.55, color: PAL.outline, stroke: false });
    ctx.restore();
  }
  function arrowKeys(ctx, x, y, sz) {
    keycap(ctx, '↑', x, y - sz - 2, sz);
    keycap(ctx, '←', x - sz - 2, y, sz);
    keycap(ctx, '↓', x, y, sz);
    keycap(ctx, '→', x + sz + 2, y, sz);
  }

  function programIcon(ctx, key, x, y, s, col) {
    // s = 半徑尺度 (約 12)
    col = col || PAL.program;
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = col; ctx.fillStyle = col;
    ctx.lineWidth = Math.max(1.6, s * 0.2);
    var k = PROG[key] ? key : '';
    if (k === 'brawl') {
      // 兩點往中間靠: 箭頭朝內
      ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(-s * 0.2, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(s * 0.2, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * 0.45, -s * 0.35); ctx.lineTo(-s * 0.1, 0); ctx.lineTo(-s * 0.45, s * 0.35); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.45, -s * 0.35); ctx.lineTo(s * 0.1, 0); ctx.lineTo(s * 0.45, s * 0.35); ctx.stroke();
    } else if (k === 'scatter') {
      ctx.beginPath(); ctx.moveTo(-s * 0.15, 0); ctx.lineTo(-s, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.15, 0); ctx.lineTo(s, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * 0.65, -s * 0.35); ctx.lineTo(-s, 0); ctx.lineTo(-s * 0.65, s * 0.35); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.65, -s * 0.35); ctx.lineTo(s, 0); ctx.lineTo(s * 0.65, s * 0.35); ctx.stroke();
    } else if (k === 'rest') {
      // 往下的水滴 + 下箭頭 (降溫, 冷靜藍)
      ctx.fillStyle = PAL.calm; ctx.strokeStyle = PAL.calm;
      ctx.beginPath(); ctx.moveTo(-s * 0.3, -s); ctx.quadraticCurveTo(-s * 0.85, -s * 0.1, -s * 0.3, s * 0.15); ctx.quadraticCurveTo(s * 0.25, -s * 0.1, -s * 0.3, -s); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * 0.5, -s * 0.8); ctx.lineTo(s * 0.5, s * 0.8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.15, s * 0.45); ctx.lineTo(s * 0.5, s * 0.85); ctx.lineTo(s * 0.85, s * 0.45); ctx.stroke();
    } else if (k === 'cheer') {
      // 火焰 + 上箭頭 (升溫, 激怒紅)
      ctx.fillStyle = PAL.ignite; ctx.strokeStyle = PAL.ignite;
      ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.9); ctx.quadraticCurveTo(-s * 0.95, s * 0.2, -s * 0.35, -s * 0.9); ctx.quadraticCurveTo(-s * 0.25, -s * 0.2, s * 0.05, -s * 0.3); ctx.quadraticCurveTo(s * 0.3, s * 0.5, -s * 0.3, s * 0.9); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * 0.55, s * 0.8); ctx.lineTo(s * 0.55, -s * 0.8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.2, -s * 0.45); ctx.lineTo(s * 0.55, -s * 0.85); ctx.lineTo(s * 0.9, -s * 0.45); ctx.stroke();
    } else if (k === 'photo') {
      // 中央一點, 四方箭頭朝它
      circle(ctx, 0, 0, s * 0.22); ctx.fill();
      for (var i = 0; i < 4; i++) {
        var a = i * Math.PI / 2 + Math.PI / 4;
        var cx = Math.cos(a), cy = Math.sin(a);
        ctx.beginPath(); ctx.moveTo(cx * s, cy * s); ctx.lineTo(cx * s * 0.45, cy * s * 0.45); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, s * 0.95, 0, Math.PI * 2); ctx.lineWidth = Math.max(1, s * 0.1); ctx.stroke();
    } else if (k === 'allegro') {
      // 雙前進箭 »
      for (var j = 0; j < 2; j++) {
        var ox = -s * 0.45 + j * s * 0.65;
        ctx.beginPath(); ctx.moveTo(ox - s * 0.25, -s * 0.7); ctx.lineTo(ox + s * 0.35, 0); ctx.lineTo(ox - s * 0.25, s * 0.7); ctx.stroke();
      }
    } else if (k === 'parade') {
      // 逆時針環箭
      ctx.beginPath(); ctx.arc(0, 0, s * 0.75, -Math.PI * 0.2, Math.PI * 1.45, true); ctx.stroke();
      var ea = Math.PI * 1.45, ex = Math.cos(ea) * s * 0.75, ey = Math.sin(ea) * s * 0.75;
      ctx.beginPath(); ctx.moveTo(ex - s * 0.4, ey - s * 0.05); ctx.lineTo(ex, ey); ctx.lineTo(ex + s * 0.05, ey + s * 0.42); ctx.stroke();
    } else if (k === 'adagio') {
      // 沙漏
      ctx.beginPath(); ctx.moveTo(-s * 0.6, -s * 0.85); ctx.lineTo(s * 0.6, -s * 0.85); ctx.lineTo(-s * 0.6, s * 0.85); ctx.lineTo(s * 0.6, s * 0.85); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.85); ctx.lineTo(0, s * 0.45); ctx.lineTo(s * 0.3, s * 0.85); ctx.closePath(); ctx.fill();
    } else if (key === 'clear') {
      ctx.strokeStyle = PAL.textDim;
      ctx.beginPath(); ctx.moveTo(-s * 0.6, -s * 0.6); ctx.lineTo(s * 0.6, s * 0.6); ctx.moveTo(s * 0.6, -s * 0.6); ctx.lineTo(-s * 0.6, s * 0.6); ctx.stroke();
    } else {
      // 自由: 虛線空圈
      ctx.strokeStyle = PAL.textMute;
      ctx.setLineDash([3, 3]);
      circle(ctx, 0, 0, s * 0.7); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function ruleIcon(ctx, key, x, y, s) {
    // s = 半徑尺度; 銅牌底 + 符號
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var k = RULE[key] ? key : '';
    if (!k) {
      ctx.setLineDash([3, 3]); ctx.strokeStyle = PAL.textMute; ctx.lineWidth = 2;
      rr(ctx, -s, -s, s * 2, s * 2, s * 0.35); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore(); return;
    }
    rr(ctx, -s, -s, s * 2, s * 2, s * 0.35);
    ctx.fillStyle = '#4a3418'; ctx.fill();
    ctx.lineWidth = Math.max(1.5, s * 0.12); ctx.strokeStyle = PAL.rule; ctx.stroke();
    var u = s * 0.7;
    if (k === 'calm' || k === 'pep') {
      var c = k === 'calm' ? PAL.calm : PAL.ignite;
      // 鈴
      ctx.beginPath();
      ctx.moveTo(-u * 0.8, u * 0.55);
      ctx.quadraticCurveTo(-u * 0.75, -u * 0.85, 0, -u * 0.85);
      ctx.quadraticCurveTo(u * 0.75, -u * 0.85, u * 0.8, u * 0.55);
      ctx.closePath();
      ctx.fillStyle = PAL.rule; ctx.fill();
      circle(ctx, 0, u * 0.75, u * 0.2); ctx.fill();
      // 方向記號: 冷靜 = 往下藍箭; 打氣 = 往上紅箭
      ctx.strokeStyle = c; ctx.lineWidth = Math.max(2, s * 0.2);
      if (k === 'calm') {
        ctx.beginPath(); ctx.moveTo(0, -u * 0.5); ctx.lineTo(0, u * 0.25); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-u * 0.3, 0); ctx.lineTo(0, u * 0.3); ctx.lineTo(u * 0.3, 0); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(0, u * 0.35); ctx.lineTo(0, -u * 0.45); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-u * 0.3, -u * 0.15); ctx.lineTo(0, -u * 0.5); ctx.lineTo(u * 0.3, -u * 0.15); ctx.stroke();
      }
    } else if (k === 'relay') {
      // 火把 + 往前衝的箭
      ctx.strokeStyle = PAL.rule; ctx.lineWidth = Math.max(2, s * 0.18);
      ctx.beginPath(); ctx.moveTo(-u * 0.7, u * 0.8); ctx.lineTo(-u * 0.2, -u * 0.05); ctx.stroke();
      ctx.fillStyle = PAL.ignite;
      ctx.beginPath(); ctx.moveTo(-u * 0.2, -u * 0.05); ctx.quadraticCurveTo(-u * 0.75, -u * 0.5, -u * 0.15, -u * 0.95); ctx.quadraticCurveTo(u * 0.2, -u * 0.4, -u * 0.2, -u * 0.05); ctx.fill();
      ctx.strokeStyle = PAL.text; ctx.lineWidth = Math.max(1.5, s * 0.14);
      ctx.beginPath(); ctx.moveTo(u * 0.05, u * 0.3); ctx.lineTo(u * 0.85, u * 0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(u * 0.55, u * 0.05); ctx.lineTo(u * 0.85, u * 0.3); ctx.lineTo(u * 0.55, u * 0.55); ctx.stroke();
    } else if (k === 'double') {
      // 兩個疊在一起的環 (再演一次)
      ctx.strokeStyle = PAL.rule; ctx.lineWidth = Math.max(2, s * 0.18);
      circle(ctx, -u * 0.3, 0, u * 0.5); ctx.stroke();
      circle(ctx, u * 0.3, 0, u * 0.5); ctx.stroke();
      ctx.fillStyle = PAL.text; circle(ctx, u * 0.3, 0, u * 0.15); ctx.fill();
    } else if (k === 'shelter') {
      // 盾牌
      ctx.beginPath();
      ctx.moveTo(0, -u * 0.9); ctx.lineTo(u * 0.75, -u * 0.55); ctx.quadraticCurveTo(u * 0.7, u * 0.5, 0, u * 0.95);
      ctx.quadraticCurveTo(-u * 0.7, u * 0.5, -u * 0.75, -u * 0.55); ctx.closePath();
      ctx.fillStyle = PAL.rule; ctx.fill();
      ctx.strokeStyle = '#4a3418'; ctx.lineWidth = Math.max(1.5, s * 0.12);
      ctx.beginPath(); ctx.moveTo(0, -u * 0.55); ctx.lineTo(0, u * 0.6); ctx.stroke();
    }
    ctx.restore();
  }

  function weaponIcon(ctx, w, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 4);
    ctx.lineCap = 'round';
    w = pick(w, ['club', 'sword', 'spear', 'whip'], 'club');
    drawWeaponShape(ctx, w, s);
    ctx.restore();
  }
  // 武器畫在 +x 方向, 從 -s*0.9 到 s
  function drawWeaponShape(ctx, w, s) {
    ctx.lineCap = 'round';
    if (w === 'club') {
      ctx.strokeStyle = PAL.outline; ctx.lineWidth = s * 0.42;
      ctx.beginPath(); ctx.moveTo(-s * 0.85, 0); ctx.lineTo(s * 0.75, 0); ctx.stroke();
      ctx.strokeStyle = '#a0682e'; ctx.lineWidth = s * 0.28;
      ctx.beginPath(); ctx.moveTo(-s * 0.85, 0); ctx.lineTo(s * 0.2, 0); ctx.stroke();
      ctx.lineWidth = s * 0.38; ctx.strokeStyle = '#a0682e';
      ctx.beginPath(); ctx.moveTo(s * 0.2, 0); ctx.lineTo(s * 0.72, 0); ctx.stroke();
    } else if (w === 'sword') {
      ctx.strokeStyle = PAL.outline; ctx.lineWidth = s * 0.3;
      ctx.beginPath(); ctx.moveTo(-s * 0.85, 0); ctx.lineTo(s * 0.9, 0); ctx.stroke();
      ctx.strokeStyle = '#dfe8f5'; ctx.lineWidth = s * 0.17;
      ctx.beginPath(); ctx.moveTo(-s * 0.3, 0); ctx.lineTo(s * 0.88, 0); ctx.stroke();
      ctx.strokeStyle = '#6a4a20'; ctx.lineWidth = s * 0.17;
      ctx.beginPath(); ctx.moveTo(-s * 0.85, 0); ctx.lineTo(-s * 0.4, 0); ctx.stroke();
      ctx.strokeStyle = PAL.gold; ctx.lineWidth = s * 0.14;
      ctx.beginPath(); ctx.moveTo(-s * 0.35, -s * 0.3); ctx.lineTo(-s * 0.35, s * 0.3); ctx.stroke();
    } else if (w === 'spear') {
      ctx.strokeStyle = PAL.outline; ctx.lineWidth = s * 0.22;
      ctx.beginPath(); ctx.moveTo(-s * 0.9, 0); ctx.lineTo(s * 0.6, 0); ctx.stroke();
      ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = s * 0.11;
      ctx.beginPath(); ctx.moveTo(-s * 0.9, 0); ctx.lineTo(s * 0.6, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(s * 0.5, -s * 0.22); ctx.lineTo(s * 0.5, s * 0.22); ctx.closePath();
      ctx.fillStyle = '#dfe8f5'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
    } else {
      ctx.strokeStyle = '#6a4a20'; ctx.lineWidth = s * 0.2;
      ctx.beginPath(); ctx.moveTo(-s * 0.85, 0); ctx.lineTo(-s * 0.35, 0); ctx.stroke();
      ctx.strokeStyle = '#c9884a'; ctx.lineWidth = s * 0.1;
      ctx.beginPath(); ctx.moveTo(-s * 0.35, 0);
      ctx.bezierCurveTo(s * 0.2, -s * 0.6, s * 0.7, s * 0.5, s * 0.9, -s * 0.1); ctx.stroke();
    }
  }

  // ---------- 魔物本體 ----------
  // 原點在中心, r = 身體半徑單位; o: { dir, white, angry, stunned, glow }
  function drawBody(ctx, key, r, o) {
    o = o || {};
    var sp = SP[spKey(key)];
    var dir = o.dir === -1 ? -1 : 1;
    var W = o.white;
    function f(c) { return W ? '#ffffff' : c; }
    var lw = Math.max(1.8, r * 0.09);
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = PAL.outline; ctx.lineWidth = lw;
    ctx.scale(dir, 1);
    var eye = [0.35, -0.08];
    var k = spKey(key);
    if (k === 'bunny') {
      for (var i = -1; i <= 1; i += 2) {
        ctx.beginPath(); ctx.ellipse(i * 0.3 * r, -0.72 * r, 0.19 * r, 0.47 * r, i * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = f(sp.body); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(i * 0.3 * r, -0.72 * r, 0.08 * r, 0.3 * r, i * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = f('#f2a7a0'); ctx.fill();
      }
      ctx.beginPath(); ctx.ellipse(0, 0.15 * r, 0.92 * r, 0.8 * r, 0, 0, Math.PI * 2);
      ctx.fillStyle = f(sp.body); ctx.fill(); ctx.stroke();
      // 蒲公英絨毛尾
      circle(ctx, -0.82 * r, 0.35 * r, 0.3 * r); ctx.fillStyle = f('#ffffff'); ctx.fill(); ctx.stroke();
      // 頭頂小黃花
      star(ctx, 0.05 * r, -0.45 * r, 0.2 * r, 6, 0.55); ctx.fillStyle = f(sp.acc); ctx.fill();
      eye = [0.42, 0.02];
    } else if (k === 'cloud') {
      var cs = [[-0.5, 0.18, 0.5], [0.5, 0.18, 0.5], [0, -0.22, 0.62], [-0.05, 0.3, 0.55]];
      ctx.fillStyle = f(sp.body);
      for (var c = 0; c < cs.length; c++) { circle(ctx, cs[c][0] * r, cs[c][1] * r, cs[c][2] * r); ctx.stroke(); }
      for (c = 0; c < cs.length; c++) { circle(ctx, cs[c][0] * r, cs[c][1] * r, cs[c][2] * r); ctx.fill(); }
      ctx.beginPath(); ctx.ellipse(0, 0.62 * r, 0.75 * r, 0.12 * r, 0, 0, Math.PI * 2); ctx.fillStyle = f(sp.dark); ctx.fill();
      eye = [0.32, 0.0];
    } else if (k === 'rat') {
      // 爆竹尾巴
      ctx.save();
      ctx.translate(-0.8 * r, 0.25 * r); ctx.rotate(-0.9);
      rr(ctx, -0.1 * r, -0.45 * r, 0.2 * r, 0.5 * r, 0.05 * r); ctx.fillStyle = f(sp.acc); ctx.fill(); ctx.stroke();
      ctx.restore();
      circle(ctx, -1.08 * r, -0.12 * r, 0.09 * r); ctx.fillStyle = f('#ffe14d'); ctx.fill();
      for (var e = -1; e <= 1; e += 2) {
        circle(ctx, (e * 0.38 - 0.05) * r, -0.6 * r, 0.27 * r); ctx.fillStyle = f(sp.body); ctx.fill(); ctx.stroke();
        circle(ctx, (e * 0.38 - 0.05) * r, -0.6 * r, 0.13 * r); ctx.fillStyle = f('#f6b8a0'); ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(1.12 * r, 0.12 * r);
      ctx.quadraticCurveTo(0.7 * r, -0.65 * r, -0.2 * r, -0.62 * r);
      ctx.quadraticCurveTo(-0.95 * r, -0.5 * r, -0.88 * r, 0.3 * r);
      ctx.quadraticCurveTo(-0.7 * r, 0.85 * r, 0.05 * r, 0.82 * r);
      ctx.quadraticCurveTo(0.75 * r, 0.75 * r, 1.12 * r, 0.12 * r);
      ctx.closePath();
      ctx.fillStyle = f(sp.body); ctx.fill(); ctx.stroke();
      circle(ctx, 1.08 * r, 0.1 * r, 0.1 * r); ctx.fillStyle = f('#3a2020'); ctx.fill();
      eye = [0.55, -0.12];
    } else if (k === 'turtle') {
      ctx.fillStyle = f('#8fcf8a');
      var legs = [-0.55, 0.45];
      for (var l = 0; l < 2; l++) { rr(ctx, legs[l] * r - 0.13 * r, 0.35 * r, 0.26 * r, 0.32 * r, 0.1 * r); ctx.fill(); ctx.stroke(); }
      circle(ctx, 0.95 * r, 0.12 * r, 0.3 * r); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0.25 * r, 0.95 * r, 0.82 * r, 0, Math.PI, Math.PI * 2); ctx.closePath();
      ctx.fillStyle = f(sp.body); ctx.fill(); ctx.stroke();
      rr(ctx, -1.0 * r, 0.18 * r, 2.0 * r, 0.22 * r, 0.1 * r); ctx.fillStyle = f(sp.dark); ctx.fill(); ctx.stroke();
      // 殼紋
      ctx.strokeStyle = W ? '#dddddd' : sp.dark; ctx.lineWidth = lw * 0.8;
      ctx.beginPath(); ctx.moveTo(-0.45 * r, 0.18 * r); ctx.lineTo(-0.3 * r, -0.3 * r); ctx.lineTo(0.3 * r, -0.3 * r); ctx.lineTo(0.45 * r, 0.18 * r); ctx.stroke();
      // 馬蹄磁鐵
      ctx.strokeStyle = W ? '#ffffff' : sp.acc; ctx.lineWidth = Math.max(2, r * 0.13);
      ctx.beginPath(); ctx.arc(0, -0.25 * r, 0.2 * r, Math.PI, 0, true); ctx.stroke();
      ctx.strokeStyle = PAL.outline;
      eye = [1.02, 0.04];
    } else if (k === 'hawk') {
      ctx.fillStyle = f(sp.body);
      ctx.beginPath();
      ctx.moveTo(-0.1 * r, -0.05 * r); ctx.lineTo(-1.12 * r, -0.62 * r); ctx.lineTo(-0.85 * r, 0.05 * r); ctx.lineTo(-1.0 * r, 0.12 * r); ctx.lineTo(-0.2 * r, 0.4 * r); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0.1 * r, -0.05 * r); ctx.lineTo(1.12 * r, -0.62 * r); ctx.lineTo(0.85 * r, 0.05 * r); ctx.lineTo(1.0 * r, 0.12 * r); ctx.lineTo(0.2 * r, 0.4 * r); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-0.25 * r, 0.6 * r); ctx.lineTo(0, 0.95 * r); ctx.lineTo(0.25 * r, 0.6 * r); ctx.closePath(); ctx.fillStyle = f(sp.dark); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0.15 * r, 0.4 * r, 0.6 * r, 0, 0, Math.PI * 2); ctx.fillStyle = f(sp.body); ctx.fill(); ctx.stroke();
      circle(ctx, 0.12 * r, -0.5 * r, 0.32 * r); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0.4 * r, -0.58 * r); ctx.lineTo(0.68 * r, -0.45 * r); ctx.lineTo(0.4 * r, -0.36 * r); ctx.closePath(); ctx.fillStyle = f('#ffc94a'); ctx.fill(); ctx.stroke();
      star(ctx, 0, 0.2 * r, 0.22 * r, 5, 0.45); ctx.fillStyle = f(sp.acc); ctx.fill();
      eye = [0.22, -0.55];
    } else { // rhino
      ctx.fillStyle = f(sp.dark);
      var lg = [-0.65, -0.25, 0.2, 0.55];
      for (var q = 0; q < 4; q++) { rr(ctx, lg[q] * r - 0.12 * r, 0.45 * r, 0.24 * r, 0.38 * r, 0.06 * r); ctx.fill(); ctx.stroke(); }
      rr(ctx, -0.98 * r, -0.5 * r, 1.65 * r, 1.08 * r, 0.42 * r); ctx.fillStyle = f(sp.body); ctx.fill(); ctx.stroke();
      // 角
      ctx.beginPath(); ctx.moveTo(0.82 * r, -0.2 * r); ctx.quadraticCurveTo(1.12 * r, -0.45 * r, 1.08 * r, -0.92 * r); ctx.quadraticCurveTo(0.85 * r, -0.55 * r, 0.62 * r, -0.4 * r); ctx.closePath();
      ctx.fillStyle = f(sp.acc); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0.62 * r, 0.02 * r, 0.42 * r, 0.36 * r, 0, 0, Math.PI * 2); ctx.fillStyle = f(sp.body); ctx.fill(); ctx.stroke();
      circle(ctx, 0.2 * r, -0.5 * r, 0.14 * r); ctx.fillStyle = f(sp.dark); ctx.fill(); ctx.stroke();
      eye = [0.62, -0.1];
    }
    // 眼睛
    if (!W) {
      var ex = eye[0] * r, ey = eye[1] * r, er = Math.max(2, r * 0.13);
      if (o.stunned) {
        ctx.strokeStyle = PAL.outline; ctx.lineWidth = Math.max(1.5, r * 0.07);
        ctx.beginPath(); ctx.moveTo(ex - er, ey - er); ctx.lineTo(ex + er, ey + er); ctx.moveTo(ex + er, ey - er); ctx.lineTo(ex - er, ey + er); ctx.stroke();
      } else {
        circle(ctx, ex, ey, er); ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.lineWidth = Math.max(1, r * 0.05); ctx.strokeStyle = PAL.outline; ctx.stroke();
        circle(ctx, ex + er * 0.3, ey, er * 0.55); ctx.fillStyle = PAL.outline; ctx.fill();
        if (o.angry) {
          ctx.strokeStyle = PAL.outline; ctx.lineWidth = Math.max(2, r * 0.1);
          ctx.beginPath(); ctx.moveTo(ex - er * 1.3, ey - er * 1.9); ctx.lineTo(ex + er * 1.3, ey - er * 1.0); ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  // 頭上的暈眩星星 (在框內)
  function stunStars(ctx, cx, cy, rad, n, phase) {
    for (var i = 0; i < n; i++) {
      var a = phase + i * Math.PI * 2 / n;
      var x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad * 0.35;
      star(ctx, x, y, 5, 5, 0.45);
      ctx.fillStyle = '#ffe14d'; ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = PAL.outline; ctx.stroke();
    }
  }

  // ---------- 背景 ----------
  function drawBackground(ctx) {
    ctx.save();
    var g = ctx.createLinearGradient(0, 0, 0, 720);
    g.addColorStop(0, '#221b3a'); g.addColorStop(1, PAL.bg2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
    ctx.globalAlpha = 0.05; ctx.fillStyle = '#ffffff';
    for (var i = 0; i < 40; i++) {
      var x = hash(i) * 1280, y = hash(i + 50) * 720;
      circle(ctx, x, y, 1 + hash(i + 99) * 2); ctx.fill();
    }
    ctx.restore();
  }

  // ---------- 地下城 ----------
  function drawTile(ctx, st) {
    st = S(st);
    var x = num(st.x, 0), y = num(st.y, 0);
    var dg = TILE_PAL[st.dungeon] ? st.dungeon : 'meadow';
    var tp = TILE_PAL[dg];
    var kind = pick(st.kind, ['wall', 'pillar', 'floor', 'hurt', 'slow'], 'floor');
    var L = x - 30, T = y - 30;
    var seed = Math.floor(x * 0.37 + y * 1.13);
    ctx.save();
    // 地板底 (牆以外都有)
    if (kind !== 'wall') {
      ctx.fillStyle = ((Math.floor((x + 3000) / 60) + Math.floor((y + 3000) / 60)) % 2) ? tp.floor : tp.floor2;
      ctx.fillRect(L, T, 60, 60);
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      if (dg === 'meadow') {
        for (var g = 0; g < 3; g++) {
          var gx = L + 8 + hash(seed + g) * 44, gy = T + 10 + hash(seed + g + 7) * 40;
          ctx.fillRect(gx, gy, 2, 6); ctx.fillRect(gx + 4, gy + 1, 2, 5);
        }
      } else if (dg === 'mine') {
        for (var m = 0; m < 3; m++) { circle(ctx, L + 8 + hash(seed + m) * 44, T + 8 + hash(seed + m + 5) * 44, 2 + hash(seed + m + 9) * 2); ctx.fill(); }
      } else {
        ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
        ctx.strokeRect(L + 2, T + 2, 56, 56);
      }
    }
    if (kind === 'wall') {
      ctx.fillStyle = tp.wallDark; ctx.fillRect(L, T, 60, 60);
      ctx.fillStyle = tp.wall; ctx.fillRect(L, T, 60, 48);
      ctx.fillStyle = tp.wallTop; ctx.fillRect(L, T, 60, 8);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(L, T + 26); ctx.lineTo(L + 60, T + 26);
      ctx.moveTo(L + 30, T + 8); ctx.lineTo(L + 30, T + 26); ctx.moveTo(L + 15, T + 26); ctx.lineTo(L + 15, T + 48); ctx.moveTo(L + 45, T + 26); ctx.lineTo(L + 45, T + 48);
      ctx.stroke();
    } else if (kind === 'pillar') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(x, y + 18, 24, 9, 0, 0, Math.PI * 2); ctx.fill();
      rr(ctx, x - 20, y - 26, 40, 46, 8); ctx.fillStyle = tp.wall; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, y - 20, 20, 7, 0, 0, Math.PI * 2); ctx.fillStyle = tp.wallTop; ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 8, y - 12); ctx.lineTo(x - 8, y + 16); ctx.moveTo(x + 6, y - 12); ctx.lineTo(x + 6, y + 16); ctx.stroke();
    } else if (kind === 'slow') {
      rr(ctx, L + 3, T + 3, 54, 54, 14); ctx.fillStyle = tp.slow; ctx.fill();
      ctx.strokeStyle = tp.slow2; ctx.lineWidth = 2.5;
      for (var s = 0; s < 2; s++) {
        ctx.beginPath(); ctx.ellipse(x + (s ? 9 : -10), y + (s ? 10 : -8), 11, 5, 0, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (kind === 'hurt') {
      // 危險地: 暗紅底 + 三簇火舌 (三張圖共用骨, 神殿火舌換星形)
      rr(ctx, L + 2, T + 2, 56, 56, 6); ctx.fillStyle = '#5a1e14'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#ff7a2e'; ctx.stroke();
      var fl = [[-14, 10], [12, 12], [0, -10]];
      for (var h = 0; h < 3; h++) {
        var fx = x + fl[h][0], fy = y + fl[h][1];
        if (dg === 'temple') {
          star(ctx, fx, fy - 4, 10, 4, 0.4); ctx.fillStyle = '#ff7a2e'; ctx.fill();
          star(ctx, fx, fy - 4, 5, 4, 0.4); ctx.fillStyle = '#ffe14d'; ctx.fill();
        } else {
          ctx.beginPath(); ctx.moveTo(fx - 8, fy + 6); ctx.quadraticCurveTo(fx - 9, fy - 6, fx, fy - 16); ctx.quadraticCurveTo(fx + 9, fy - 6, fx + 8, fy + 6); ctx.closePath();
          ctx.fillStyle = '#ff7a2e'; ctx.fill();
          ctx.beginPath(); ctx.moveTo(fx - 4, fy + 6); ctx.quadraticCurveTo(fx - 4, fy - 2, fx, fy - 8); ctx.quadraticCurveTo(fx + 4, fy - 2, fx + 4, fy + 6); ctx.closePath();
          ctx.fillStyle = '#ffe14d'; ctx.fill();
        }
      }
    }
    if (st.nest === true && kind !== 'wall' && kind !== 'pillar') {
      // 巢: 一圈枝條
      ctx.strokeStyle = tp.nest; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(x, y + 4, 22, 13, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(60,40,10,0.7)'; ctx.lineWidth = 1.5;
      for (var n = 0; n < 8; n++) {
        var a = n * Math.PI / 4;
        ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 18, y + 4 + Math.sin(a) * 10); ctx.lineTo(x + Math.cos(a + 0.4) * 25, y + 4 + Math.sin(a + 0.4) * 15); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawKeg(ctx, st) {
    st = S(st);
    var x = num(st.x, 0), y = num(st.y, 0);
    var mode = pick(st.mode, ['ok', 'fuse', 'gone'], 'ok');
    var p = ratio(st.fuseT, num(st.fuseDur, 0.6));
    ctx.save();
    if (mode === 'gone') {
      // 焦痕 + 碎木 (平面, 不立體, 不像桶)
      ctx.beginPath(); ctx.ellipse(x, y + 6, 24, 15, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(20,12,10,0.55)'; ctx.fill();
      ctx.strokeStyle = '#6a4424'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      var bits = [[-16, 0, 0.4], [10, 10, -0.7], [14, -6, 1.2], [-6, 14, 2.0]];
      for (var b = 0; b < bits.length; b++) {
        ctx.beginPath(); ctx.moveTo(x + bits[b][0] - Math.cos(bits[b][2]) * 5, y + bits[b][1] - Math.sin(bits[b][2]) * 5);
        ctx.lineTo(x + bits[b][0] + Math.cos(bits[b][2]) * 5, y + bits[b][1] + Math.sin(bits[b][2]) * 5); ctx.stroke();
      }
      ctx.restore(); return;
    }
    var shake = mode === 'fuse' ? Math.sin(p * 60) * (0.5 + p) : 0;
    ctx.translate(shake, 0);
    // 影子
    ctx.beginPath(); ctx.ellipse(x, y + 18, 20, 6, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
    // 桶身 (寬 44 = 判定直徑)
    ctx.beginPath();
    ctx.moveTo(x - 18, y - 20);
    ctx.quadraticCurveTo(x - 23, y, x - 18, y + 20);
    ctx.lineTo(x + 18, y + 20);
    ctx.quadraticCurveTo(x + 23, y, x + 18, y - 20);
    ctx.closePath();
    ctx.fillStyle = mode === 'fuse' ? (Math.floor(p * 8) % 2 ? '#ff4a3d' : '#a8552a') : '#a8552a';
    ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
    ctx.fillStyle = '#3a3a44';
    ctx.fillRect(x - 21, y - 12, 42, 5); ctx.fillRect(x - 21, y + 7, 42, 5);
    // 危險記號: 黑底白火焰
    circle(ctx, x, y - 1, 7); ctx.fillStyle = PAL.outline; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 3, y + 3); ctx.quadraticCurveTo(x - 4, y - 2, x, y - 6); ctx.quadraticCurveTo(x + 4, y - 2, x + 3, y + 3); ctx.closePath(); ctx.fillStyle = '#ffb340'; ctx.fill();
    // 引信
    var fuseLen = mode === 'fuse' ? 5 * (1 - p) : 5;
    ctx.strokeStyle = '#e8d2a0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 4, y - 20); ctx.lineTo(x + 4 + fuseLen * 0.5, y - 20 - fuseLen); ctx.stroke();
    if (mode === 'fuse') {
      var sx = x + 4 + fuseLen * 0.5, sy = y - 20 - fuseLen;
      star(ctx, sx, sy, 4 + p * 1.5, 6, 0.4); ctx.fillStyle = '#ffe14d'; ctx.fill();
      // 越接近爆炸, 外圈紅光越飽滿 (框內)
      ctx.lineWidth = 2 + p * 2; ctx.strokeStyle = 'rgba(255,74,61,' + (0.35 + p * 0.6).toFixed(2) + ')';
      circle(ctx, x, y, 23 + p * 3); ctx.stroke();
    }
    ctx.restore();
  }

  function drawFountain(ctx, st) {
    st = S(st);
    var x = num(st.x, 0), y = num(st.y, 0);
    var full = st.full !== false;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(x, y + 4, 27, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = full ? '#b9b2c8' : '#8a8478'; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y + 4, 20, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = full ? '#4fd6ff' : '#5a4a38'; ctx.fill();
    if (full) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x - 4, y + 2, 8, 3, 0, Math.PI, Math.PI * 2); ctx.stroke();
      // 噴水 + 小愛心
      ctx.strokeStyle = '#bff3ff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.quadraticCurveTo(x, y - 18, x - 10, y - 12); ctx.moveTo(x, y + 2); ctx.quadraticCurveTo(x, y - 18, x + 10, y - 12); ctx.stroke();
      heartPath(ctx, x, y - 20, 6); ctx.fillStyle = PAL.heart; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
    } else {
      ctx.strokeStyle = '#2e2418'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x - 3, y + 6); ctx.lineTo(x + 4, y + 1); ctx.lineTo(x + 12, y + 8); ctx.moveTo(x - 3, y + 6); ctx.lineTo(x - 5, y + 13); ctx.stroke();
    }
    ctx.restore();
  }

  var FACING = [-Math.PI / 2, -Math.PI / 4, 0, Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4, Math.PI, -Math.PI * 3 / 4];

  function drawTamer(ctx, st) {
    st = S(st);
    var x = num(st.x, 0), y = num(st.y, 0);
    var f = clamp(Math.round(num(st.facing, 2)), 0, 7);
    var a = FACING[f];
    var weapon = pick(st.weapon, ['club', 'sword', 'spear', 'whip'], 'club');
    ctx.save();
    if (st.dashing === true) {
      // 突進殘影 (框內, 身後)
      for (var i = 2; i >= 1; i--) {
        ctx.globalAlpha = 0.18 * (3 - i);
        circle(ctx, x - Math.cos(a) * i * 6, y - Math.sin(a) * i * 6, 17); ctx.fillStyle = '#ffffff'; ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (st.blink === true) ctx.globalAlpha = 0.45;
    // 影子
    ctx.beginPath(); ctx.ellipse(x, y + 14, 15, 5, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
    // 武器 (握在面向那側)
    var behind = Math.sin(a) < -0.1;
    function weaponNow() {
      ctx.save(); ctx.translate(x + Math.cos(a) * 10, y + Math.sin(a) * 10); ctx.rotate(a);
      ctx.translate(5, 0);
      drawWeaponShape(ctx, weapon, 13);
      ctx.restore();
    }
    if (behind) weaponNow();
    // 身體 (半徑 18 = 判定)
    circle(ctx, x, y, 18); ctx.fillStyle = PAL.tamerCoat; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
    // 圍巾
    ctx.beginPath(); ctx.arc(x, y, 12, 0.2, Math.PI - 0.2); ctx.lineWidth = 5; ctx.strokeStyle = PAL.tamerScarf; ctx.stroke();
    // 臉與面向: 臉偏向面向
    var fx = x + Math.cos(a) * 5, fy = y + Math.sin(a) * 4 - 3;
    circle(ctx, fx, fy, 9); ctx.fillStyle = PAL.tamerSkin; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
    // 帽子
    ctx.beginPath(); ctx.ellipse(x, y - 9, 15, 6, 0, 0, Math.PI * 2); ctx.fillStyle = PAL.tamerHat; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y - 13, 8, 6, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = PAL.tamerScarf; ctx.fillRect(x - 8, y - 14, 16, 2.5);
    if (Math.sin(a) > -0.6) {
      circle(ctx, fx + Math.cos(a) * 4 - 2, fy + 1, 1.6); ctx.fillStyle = PAL.outline; ctx.fill();
      circle(ctx, fx + Math.cos(a) * 4 + 3, fy + 1, 1.6); ctx.fill();
    }
    // 面向小三角 (身體邊緣)
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * 27, y + Math.sin(a) * 27);
    ctx.lineTo(x + Math.cos(a + 0.35) * 20, y + Math.sin(a + 0.35) * 20);
    ctx.lineTo(x + Math.cos(a - 0.35) * 20, y + Math.sin(a - 0.35) * 20);
    ctx.closePath(); ctx.fillStyle = PAL.tamerScarf; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
    if (!behind) weaponNow();
    if (st.lassoing === true) {
      // 腰間繩圈
      ctx.strokeStyle = '#d9b46a'; ctx.lineWidth = 2.5;
      circle(ctx, x - Math.cos(a) * 12, y + 8, 6); ctx.stroke();
    }
    if (st.dashing === true) {
      ctx.globalAlpha = 1;
      ctx.setLineDash([4, 3]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      circle(ctx, x, y, 21); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function wildBox(sp) { return sp === 'rhino' ? 45 : 36; }

  function drawWildMonster(ctx, st) {
    st = S(st);
    var x = num(st.x, 0), y = num(st.y, 0);
    var sp = spKey(st.species);
    var r = sp === 'rhino' ? 32 : 26;
    var dir = st.dir === -1 ? -1 : 1;
    var move = pick(st.move, ['walk', 'hop', 'fadeOut', 'fadeIn'], 'walk');
    var mp = ratio(st.moveT, num(st.moveDur, 0.3));
    var stunned = num(st.stunLeft, 0) > 0 || st.lassoed === true;
    var hop = move === 'hop' ? Math.sin(mp * Math.PI) * 4 : 0;
    var alpha = move === 'fadeOut' ? 1 - mp * 0.85 : (move === 'fadeIn' ? 0.15 + mp * 0.85 : 1);
    var eff = SP[sp].eff;
    ctx.save();
    // 影子
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.85, r * 0.85, r * 0.22, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fill();
    ctx.globalAlpha = alpha;
    // 施放預備: 本體外一圈技能效果色的粗光 (同 Hazard 顏色)
    if (st.casting === true && !stunned) {
      ctx.lineWidth = 4; ctx.strokeStyle = EFF[eff].color;
      circle(ctx, x, y - hop, r + 6); ctx.stroke();
      ctx.lineWidth = 1.5; ctx.strokeStyle = '#ffffff';
      circle(ctx, x, y - hop, r + 3.5); ctx.stroke();
    }
    // 殘血: 薄荷綠虛線圈 = 可以捕捉
    if (st.weak === true && !stunned) {
      ctx.setLineDash([6, 4]); ctx.lineWidth = 3; ctx.strokeStyle = PAL.catch;
      circle(ctx, x, y - hop, r + 7); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.save(); ctx.translate(x, y - hop);
    drawBody(ctx, sp, r, { dir: dir, white: st.hit === true, stunned: stunned });
    ctx.restore();
    if (st.weak === true) {
      // 虛弱記號: 頭側一滴汗 + 繃帶
      var wx = x - dir * r * 0.55, wy = y - hop - r * 0.15;
      ctx.beginPath(); ctx.moveTo(wx, wy - 7); ctx.quadraticCurveTo(wx - 5, wy + 1, wx, wy + 4); ctx.quadraticCurveTo(wx + 5, wy + 1, wx, wy - 7);
      ctx.fillStyle = '#bfe8ff'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
      ctx.save(); ctx.translate(x + dir * r * 0.15, y - hop + r * 0.35); ctx.rotate(-0.5 * dir);
      ctx.fillStyle = '#f4ead8'; ctx.fillRect(-8, -3, 16, 6); ctx.strokeRect(-8, -3, 16, 6);
      ctx.restore();
    }
    if (stunned) {
      var top = y - hop - (sp === 'rhino' ? 30 : 26);
      var sl = num(st.stunDur, 2) > 0 ? ratio(st.stunLeft, num(st.stunDur, 2)) : 1;
      stunStars(ctx, x, top, sp === 'rhino' ? 16 : 13, 3, (1 - sl) * 6 + (st.lassoed === true ? 1 : 0));
    }
    ctx.globalAlpha = 1;
    // 血條 (框外頭上)
    var hp = num(st.hp, 1), mx = Math.max(1, num(st.maxHp, 1));
    var pr = clamp(hp / mx, 0, 1);
    var by = y + (sp === 'rhino' ? -55 : -46);
    ctx.fillStyle = 'rgba(10,8,20,0.85)'; ctx.fillRect(x - 28, by - 3, 56, 6);
    ctx.fillStyle = st.weak === true ? PAL.catch : '#e8e4f0';
    ctx.fillRect(x - 27, by - 2, 54 * pr, 4);
    ctx.fillStyle = 'rgba(10,8,20,0.9)'; ctx.fillRect(x - 27 + 54 * 0.3 - 0.5, by - 3, 1.5, 6);
    ctx.restore();
  }

  function drawCaptureRing(ctx, st) {
    st = S(st);
    var x = num(st.x, 0), y = num(st.y, 0);
    var p = ratio(st.t, num(st.dur, 0.8));
    ctx.save();
    ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(10,8,20,0.75)';
    circle(ctx, x, y, 40); ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(109,255,168,0.25)';
    circle(ctx, x, y, 40); ctx.stroke();
    if (p > 0) {
      ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.strokeStyle = PAL.catch;
      ctx.beginPath(); ctx.arc(x, y, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p); ctx.stroke();
    }
    tx(ctx, '準備捕捉', x, y - 47, { size: 14, color: PAL.catch });
    ctx.restore();
  }

  function drawLasso(ctx, st) {
    st = S(st);
    var x1 = num(st.x1, 0), y1 = num(st.y1, 0), x2 = num(st.x2, 0), y2 = num(st.y2, 0);
    var prog = clamp(num(st.progress, 0), 0, 1);
    var tl = ratio(st.t, num(st.limit, 5));
    var ten = clamp(num(st.len, 0) / Math.max(1, num(st.maxLen, 220)), 0, 1.2);
    ctx.save();
    // 繩: 鬆時下垂, 越接近最大長度越直、轉紅
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + Math.max(0, 1 - ten) * 28;
    var col = ten >= 0.8 ? PAL.ignite : '#d9b46a';
    ctx.lineCap = 'round';
    ctx.strokeStyle = PAL.outline; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = ten >= 0.8 ? 3 : 3.5;
    if (ten >= 0.8) ctx.setLineDash([8, 5]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke();
    ctx.setLineDash([]);
    // 繞圈進度環 (魔物周圍)
    ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(10,8,20,0.7)'; circle(ctx, x2, y2, 46); ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(109,255,168,0.22)'; circle(ctx, x2, y2, 46); ctx.stroke();
    if (prog > 0) {
      ctx.strokeStyle = PAL.catch; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(x2, y2, 46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog); ctx.stroke();
    }
    // 時限: 外側細環, 剩餘量隨時間減少; 最後 30% 轉橘
    var left = 1 - tl;
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,8,20,0.6)'; circle(ctx, x2, y2, 54); ctx.stroke();
    if (left > 0) {
      ctx.strokeStyle = left < 0.3 ? PAL.danger : '#e8e4f0'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x2, y2, 54, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 技能 ----------
  function drawHazard(ctx, st) {
    st = S(st);
    var kind = pick(st.kind, ['seed', 'rain', 'cracker', 'magnet', 'meteor', 'quake'], 'seed');
    var phase = pick(st.phase, ['warn', 'active', 'fly'], kind === 'seed' || kind === 'magnet' ? 'fly' : 'warn');
    var x = num(st.x, 0), y = num(st.y, 0);
    var refl = st.reflected === true;
    var col = refl ? PAL.reflect : EFF[HZ_EFF[kind]].color;
    var p = ratio(st.t, num(st.dur, 1));
    var ang = num(st.angle, 0);
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (kind === 'seed' || kind === 'magnet') {
      var R = Math.max(2, num(st.radius, kind === 'seed' ? 10 : 20));
      if (kind === 'magnet' && !refl) {
        var PR = num(st.pullRadius, 0);
        if (PR > 0) {
          // 吸引範圍: 外緣虛線 + 往內流的 V 記號
          ctx.globalAlpha = 0.5;
          ctx.setLineDash([10, 8]); ctx.lineWidth = 2; ctx.strokeStyle = col;
          circle(ctx, x, y, PR); ctx.stroke(); ctx.setLineDash([]);
          ctx.globalAlpha = 0.65;
          ctx.lineWidth = 2.5;
          for (var i = 0; i < 6; i++) {
            var aa = i * Math.PI / 3 + p * 0.6;
            for (var j = 0; j < 2; j++) {
              var fr = ((1 - ((p * 4 + j * 0.5) % 1)) * (PR - R - 12)) + R + 12;
              var cx = x + Math.cos(aa) * fr, cy = y + Math.sin(aa) * fr;
              var ia = aa + Math.PI;
              ctx.beginPath();
              ctx.moveTo(cx + Math.cos(ia + 2.4) * 7, cy + Math.sin(ia + 2.4) * 7);
              ctx.lineTo(cx, cy);
              ctx.lineTo(cx + Math.cos(ia - 2.4) * 7, cy + Math.sin(ia - 2.4) * 7);
              ctx.stroke();
            }
          }
          ctx.globalAlpha = 1;
        }
      }
      // 尾跡 (身後)
      ctx.globalAlpha = 0.45; ctx.strokeStyle = col; ctx.lineWidth = R * 0.9;
      ctx.beginPath(); ctx.moveTo(x - Math.cos(ang) * R * 0.6, y - Math.sin(ang) * R * 0.6); ctx.lineTo(x - Math.cos(ang) * R * 2.4, y - Math.sin(ang) * R * 2.4); ctx.stroke();
      ctx.globalAlpha = 1;
      // 本體: 畫面邊緣 = 判定半徑
      circle(ctx, x, y, R); ctx.fillStyle = PAL.outline; ctx.fill();
      circle(ctx, x, y, R - 2.5); ctx.fillStyle = col; ctx.fill();
      if (kind === 'seed') {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
        for (var k = 0; k < 6; k++) {
          var sa = k * Math.PI / 3;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(sa) * (R - 3.5), y + Math.sin(sa) * (R - 3.5)); ctx.stroke();
        }
        circle(ctx, x, y, R * 0.28); ctx.fillStyle = '#ffffff'; ctx.fill();
      } else {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = R * 0.22;
        ctx.beginPath(); ctx.arc(x, y + R * 0.05, R * 0.42, Math.PI, 0, true); ctx.stroke();
        ctx.strokeStyle = PAL.outline; ctx.lineWidth = R * 0.12;
        ctx.beginPath(); ctx.moveTo(x - R * 0.55, y + R * 0.05); ctx.lineTo(x - R * 0.3, y + R * 0.05); ctx.moveTo(x + R * 0.3, y + R * 0.05); ctx.lineTo(x + R * 0.55, y + R * 0.05); ctx.stroke();
      }
      if (refl) {
        // 打回: 白邊 + 朝前的小箭頭 (在本體內)
        ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; circle(ctx, x, y, R - 1); ctx.stroke();
        ctx.fillStyle = PAL.outline;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(ang) * R * 0.75, y + Math.sin(ang) * R * 0.75);
        ctx.lineTo(x + Math.cos(ang + 2.5) * R * 0.5, y + Math.sin(ang + 2.5) * R * 0.5);
        ctx.lineTo(x + Math.cos(ang - 2.5) * R * 0.5, y + Math.sin(ang - 2.5) * R * 0.5);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore(); return;
    }
    if (kind === 'quake') {
      var Lq = Math.max(1, num(st.length, 520)), Wq = Math.max(1, num(st.width, 44));
      ctx.translate(x, y); ctx.rotate(ang);
      if (phase === 'warn') {
        ctx.fillStyle = 'rgba(10,8,20,0.25)'; ctx.fillRect(0, -Wq / 2, Lq, Wq);
        ctx.globalAlpha = 0.38; ctx.fillStyle = col; ctx.fillRect(0, -Wq / 2, Lq * p, Wq);
        ctx.globalAlpha = 1;
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,8,20,0.6)'; ctx.strokeRect(0, -Wq / 2, Lq, Wq);
        ctx.setLineDash([10, 7]); ctx.lineWidth = 2.5; ctx.strokeStyle = col; ctx.strokeRect(0, -Wq / 2, Lq, Wq); ctx.setLineDash([]);
        ctx.strokeStyle = col; ctx.lineWidth = 2.5;
        for (var c = 60; c < Lq; c += 80) {
          ctx.beginPath(); ctx.moveTo(c - 8, -Wq * 0.3); ctx.lineTo(c + 4, 0); ctx.lineTo(c - 8, Wq * 0.3); ctx.stroke();
        }
      } else {
        ctx.globalAlpha = 0.75 * (1 - p) + 0.15;
        ctx.fillStyle = col; ctx.fillRect(0, -Wq / 2, Lq, Wq);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, -Wq * 0.15, Lq, Wq * 0.3);
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.strokeRect(0, -Wq / 2, Lq, Wq);
      }
      ctx.restore(); return;
    }
    // rain / meteor / cracker: 圓形落點
    var Rr = Math.max(1, num(st.radius, kind === 'rain' ? 50 : (kind === 'meteor' ? 60 : 80)));
    if (phase === 'warn') {
      circle(ctx, x, y, Rr); ctx.fillStyle = 'rgba(10,8,20,0.22)'; ctx.fill();
      circle(ctx, x, y, Rr * p); ctx.globalAlpha = 0.4; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1;
      ctx.lineWidth = 4.5; ctx.strokeStyle = 'rgba(10,8,20,0.6)'; circle(ctx, x, y, Rr - 2); ctx.stroke();
      ctx.setLineDash([9, 6]); ctx.lineWidth = 2.5; ctx.strokeStyle = col; circle(ctx, x, y, Rr - 2); ctx.stroke(); ctx.setLineDash([]);
      // 中心記號
      if (kind === 'rain') {
        ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.quadraticCurveTo(x - 7, y + 2, x, y + 6); ctx.quadraticCurveTo(x + 7, y + 2, x, y - 9);
        ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
      } else if (kind === 'meteor') {
        star(ctx, x, y, 9, 4, 0.4); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
      } else {
        ctx.lineWidth = 2; ctx.strokeStyle = col;
        ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8); ctx.stroke();
        // 爆竹從 sx,sy 沿拋物線飛向 x,y
        var sx = num(st.sx, x), sy = num(st.sy, y);
        var d = Math.sqrt((x - sx) * (x - sx) + (y - sy) * (y - sy));
        var H = 50 + d * 0.25;
        ctx.globalAlpha = 0.5; ctx.setLineDash([3, 6]); ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        for (var s2 = 0; s2 <= 16; s2++) {
          var u = p + (1 - p) * s2 / 16;
          var px2 = sx + (x - sx) * u, py2 = sy + (y - sy) * u - H * 4 * u * (1 - u);
          if (s2 === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
        }
        ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        var fx = sx + (x - sx) * p, fy = sy + (y - sy) * p - H * 4 * p * (1 - p);
        ctx.save(); ctx.translate(fx, fy); ctx.rotate(p * 9);
        rr(ctx, -5, -11, 10, 22, 2); ctx.fillStyle = '#d8262b'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
        ctx.fillStyle = PAL.gold; ctx.fillRect(-5, -3, 10, 4);
        star(ctx, 0, -14, 5, 6, 0.4); ctx.fillStyle = '#ffe14d'; ctx.fill();
        ctx.restore();
      }
    } else {
      // active: 實心面, 0.2 秒淡出
      var aA = 1 - p;
      circle(ctx, x, y, Rr); ctx.globalAlpha = 0.55 * aA + 0.1; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1;
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,' + (0.9 * aA).toFixed(2) + ')'; circle(ctx, x, y, Rr - 1.5); ctx.stroke();
      ctx.globalAlpha = aA;
      if (kind === 'rain') {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
        for (var q = 0; q < 8; q++) {
          var qa = q * Math.PI / 4;
          ctx.beginPath(); ctx.moveTo(x + Math.cos(qa) * Rr * 0.3, y + Math.sin(qa) * Rr * 0.3); ctx.lineTo(x + Math.cos(qa) * Rr * 0.75, y + Math.sin(qa) * Rr * 0.75); ctx.stroke();
        }
      } else if (kind === 'meteor') {
        circle(ctx, x, y, Rr * 0.3); ctx.fillStyle = '#5a4a5a'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
        star(ctx, x, y, Rr * 0.75, 8, 0.45); ctx.lineWidth = 2; ctx.strokeStyle = '#ffe680'; ctx.stroke();
      } else {
        star(ctx, x, y, Rr * 0.92, 10, 0.5); ctx.fillStyle = '#ffe14d'; ctx.globalAlpha = 0.7 * aA; ctx.fill();
        ctx.globalAlpha = aA; star(ctx, x, y, Rr * 0.5, 10, 0.5); ctx.fillStyle = '#ffffff'; ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawBlast(ctx, st) {
    st = S(st);
    var x = num(st.x, 0), y = num(st.y, 0), R = Math.max(1, num(st.radius, 130));
    var p = ratio(st.t, num(st.dur, 0.3));
    ctx.save();
    var a = 1 - p;
    circle(ctx, x, y, R); ctx.globalAlpha = 0.5 * a + 0.1; ctx.fillStyle = PAL.danger; ctx.fill();
    circle(ctx, x, y, R * (0.35 + 0.5 * p)); ctx.globalAlpha = 0.8 * a; ctx.fillStyle = '#ffe14d'; ctx.fill();
    ctx.globalAlpha = a; ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; circle(ctx, x, y, R - 2); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#ffe14d';
    for (var i = 0; i < 10; i++) {
      var ang = i * Math.PI / 5 + 0.3;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * R * (0.4 + 0.3 * p), y + Math.sin(ang) * R * (0.4 + 0.3 * p)); ctx.lineTo(x + Math.cos(ang) * R * (0.6 + 0.35 * p), y + Math.sin(ang) * R * (0.6 + 0.35 * p)); ctx.stroke();
    }
    ctx.restore();
  }

  function drawWeaponFx(ctx, st) {
    st = S(st);
    var x = num(st.x, 0), y = num(st.y, 0);
    var shape = pick(st.shape, ['arc', 'circle', 'line', 'dash'], 'arc');
    var skill = st.move === 'skill';
    var col = skill ? PAL.gold : '#ffffff';
    var p = ratio(st.t, num(st.dur, 0.2));
    var ang = num(st.angle, 0), spread = num(st.spread, Math.PI / 2), R = Math.max(1, num(st.radius, 70));
    var a = 1 - p * 0.85;
    R = Math.max(4, R);
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (shape === 'arc') {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, R, ang - spread / 2, ang + spread / 2); ctx.closePath();
      ctx.globalAlpha = 0.3 * a; ctx.fillStyle = col; ctx.fill();
      ctx.globalAlpha = a; ctx.lineWidth = skill ? 6 : 4; ctx.strokeStyle = PAL.outline;
      ctx.beginPath(); ctx.arc(x, y, R - 3, ang - spread / 2, ang + spread / 2); ctx.stroke();
      ctx.lineWidth = skill ? 4 : 2.5; ctx.strokeStyle = col;
      ctx.beginPath(); ctx.arc(x, y, R - 3, ang - spread / 2, ang + spread / 2); ctx.stroke();
      // 揮動線: 從一側掃到另一側
      var sw = ang - spread / 2 + spread * Math.min(1, p * 1.6);
      ctx.lineWidth = 3; ctx.strokeStyle = col;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(sw) * 20, y + Math.sin(sw) * 20); ctx.lineTo(x + Math.cos(sw) * (R - 3), y + Math.sin(sw) * (R - 3)); ctx.stroke();
    } else if (shape === 'circle') {
      circle(ctx, x, y, R); ctx.globalAlpha = 0.22 * a; ctx.fillStyle = col; ctx.fill();
      ctx.globalAlpha = a; ctx.lineWidth = 5; ctx.strokeStyle = PAL.outline; circle(ctx, x, y, R - 3); ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = col; circle(ctx, x, y, R - 3); ctx.stroke();
    } else if (shape === 'line') {
      var L = Math.max(1, num(st.length, 170)), W = Math.max(1, num(st.width, 40));
      ctx.translate(x, y); ctx.rotate(ang);
      ctx.globalAlpha = 0.3 * a; ctx.fillStyle = col; ctx.fillRect(0, -W / 2, L, W);
      ctx.globalAlpha = a; ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.strokeRect(1.5, -W / 2 + 1.5, L - 3, W - 3);
      ctx.beginPath(); ctx.moveTo(L * 0.2, 0); ctx.lineTo(L * (0.4 + 0.6 * Math.min(1, p * 1.5)) - 2, 0); ctx.lineWidth = 5; ctx.stroke();
    } else {
      var Ld = Math.max(1, num(st.length, 220));
      ctx.translate(x, y); ctx.rotate(ang);
      for (var i = 0; i < 4; i++) {
        ctx.globalAlpha = a * (0.15 + i * 0.12);
        circle(ctx, Ld * (i / 4), 0, 16); ctx.fillStyle = col; ctx.fill();
      }
      ctx.globalAlpha = a; ctx.lineWidth = 3; ctx.strokeStyle = col;
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(Ld, -14); ctx.moveTo(0, 14); ctx.lineTo(Ld, 14); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 卡片類 UI ----------
  function selFrame(ctx, x, y, w, h, r) {
    ctx.save();
    rr(ctx, x - 4, y - 4, w + 8, h + 8, r + 4);
    ctx.lineWidth = 4; ctx.strokeStyle = PAL.select; ctx.stroke();
    rr(ctx, x - 8, y - 8, w + 16, h + 16, r + 8);
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.stroke();
    ctx.restore();
  }
  function selArrow(ctx, x, y) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 12, y - 9); ctx.lineTo(x - 12, y + 9); ctx.closePath();
    ctx.fillStyle = PAL.select; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
    ctx.restore();
  }
  function effTag(ctx, eff, x, y, h) {
    eff = effKey(eff);
    if (!eff) return;
    h = h || 24;
    var label = EFF[eff].name;
    var w = h * 2.4;
    ctx.save();
    rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = EFF[eff].color; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
    tx(ctx, label, x, y + 1, { size: h * 0.62, color: '#ffffff', stroke: 'rgba(0,0,0,0.5)', sw: 2.5 });
    ctx.restore();
  }

  function dungeonScene(ctx, dg, x, y, w, h) {
    var tp = TILE_PAL[dg];
    ctx.save();
    rr(ctx, x, y, w, h, 10); ctx.clip();
    ctx.fillStyle = tp.floor; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = tp.floor2;
    for (var i = 0; i < w / 30; i++) for (var j = 0; j < h / 30; j++) if ((i + j) % 2) ctx.fillRect(x + i * 30, y + j * 30, 30, 30);
    ctx.fillStyle = tp.wall; ctx.fillRect(x, y, w, 22);
    ctx.fillStyle = tp.wallTop; ctx.fillRect(x, y, w, 5);
    ctx.restore();
  }

  function drawDungeonCard(ctx, st) {
    st = S(st);
    var x = num(st.x, 640), y = num(st.y, 390);
    var dg = DUNGEON[st.dungeon] ? st.dungeon : 'meadow';
    var open = st.open === true;
    var L = x - 180, T = y - 220, W = 360, H = 440;
    ctx.save();
    rr(ctx, L, T, W, H, 18); ctx.fillStyle = open ? PAL.panel2 : '#211c33'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = open ? PAL.panelEdge : '#3a3454'; ctx.stroke();
    tx(ctx, DUNGEON[dg].name, x, T + 40, { size: 30, color: open ? PAL.text : PAL.textDim, stroke: false });
    dungeonScene(ctx, dg, L + 24, T + 72, W - 48, 200);
    var sps = DUNGEON[dg].sp;
    for (var i = 0; i < 2; i++) {
      var cx = L + 24 + (W - 48) * (i === 0 ? 0.28 : 0.72), cy = T + 185;
      ctx.save(); ctx.translate(cx, cy);
      if (!open) ctx.globalAlpha = 0.55;
      drawBody(ctx, sps[i], 40, { dir: i === 0 ? 1 : -1 });
      ctx.restore();
      tx(ctx, SP[sps[i]].name, cx, T + 300, { size: 20, color: open ? PAL.text : PAL.textDim, stroke: false });
      effTag(ctx, SP[sps[i]].eff, cx, T + 330, 22);
    }
    if (open) {
      tx(ctx, '已開放', x, T + 395, { size: 24, color: PAL.catch, stroke: false });
    } else {
      // 鎖
      ctx.save(); ctx.translate(x, T + 172);
      ctx.globalAlpha = 0.9;
      rr(ctx, -26, -6, 52, 40, 8); ctx.fillStyle = '#3a3454'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.outline; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -6, 16, Math.PI, 0); ctx.lineWidth = 7; ctx.strokeStyle = '#3a3454'; ctx.stroke();
      circle(ctx, 0, 12, 5); ctx.fillStyle = PAL.textDim; ctx.fill();
      ctx.restore();
      tx(ctx, '開放條件', x, T + 375, { size: 16, color: PAL.textDim, stroke: false });
      tx(ctx, str(st.condition), x, T + 405, { size: 20, color: PAL.text, stroke: false, maxW: W - 30 });
    }
    if (!open) { rr(ctx, L, T, W, H, 18); ctx.fillStyle = 'rgba(10,8,20,0.25)'; ctx.fill(); }
    if (st.selected === true) selFrame(ctx, L, T, W, H, 18);
    ctx.restore();
  }

  function drawSpeciesCard(ctx, st) {
    st = S(st);
    var x = num(st.x, 160), y = num(st.y, 230);
    var sp = spKey(st.species);
    var L = x - 90, T = y - 125, W = 180, H = 250;
    var on = Math.max(0, Math.round(num(st.onStage, 0))), own = Math.max(0, Math.round(num(st.owned, 0)));
    ctx.save();
    rr(ctx, L, T, W, H, 14); ctx.fillStyle = on > 0 ? PAL.panel2 : '#262038'; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.panelEdge; ctx.stroke();
    tx(ctx, SP[sp].name, x, T + 24, { size: 22, color: PAL.text, stroke: false });
    tx(ctx, 'Lv ' + clamp(Math.round(num(st.level, 0)), 0, 3), x, T + 50, { size: 16, color: PAL.rep, stroke: false });
    ctx.save(); ctx.translate(x, T + 105);
    if (on === 0) ctx.globalAlpha = 0.55;
    drawBody(ctx, sp, 34, { dir: 1 });
    ctx.restore();
    effTag(ctx, st.effect || SP[sp].eff, x, T + 160, 24);
    tx(ctx, '擁有 ' + own, x, T + 192, { size: 16, color: PAL.textDim, stroke: false });
    tx(ctx, '上場 ' + on, x, T + 222, { size: 24, color: on > 0 ? PAL.text : PAL.textMute, stroke: false });
    if (st.selected === true) selFrame(ctx, L, T, W, H, 14);
    ctx.restore();
  }

  function drawSpeciesInfo(ctx, st) {
    st = S(st);
    var x = num(st.x, 500), y = num(st.y, 490);
    var L = x - 400, T = y - 90;
    ctx.save();
    rr(ctx, L, T, 800, 180, 14); ctx.fillStyle = PAL.panel; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = PAL.panelEdge; ctx.stroke();
    var sp = SP[st.species] ? st.species : '';
    if (sp) {
      ctx.save(); ctx.translate(L + 50, T + 40); drawBody(ctx, sp, 20, { dir: 1 }); ctx.restore();
      tx(ctx, SP[sp].name, L + 86, T + 40, { size: 22, align: 'left', stroke: false });
    }
    tx(ctx, str(st.desc), L + (sp ? 210 : 30), T + 40, { size: 18, align: 'left', color: PAL.textDim, stroke: false, maxW: 420 });
    var tot = Math.round(num(st.total, 0)), tm = Math.round(num(st.totalMax, 20));
    tx(ctx, '上場 ' + tot + ' / ' + tm, L + 780, T + 40, { size: 22, align: 'right', color: tot >= tm ? PAL.rep : PAL.text, stroke: false });
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(L + 20, T + 70); ctx.lineTo(L + 780, T + 70); ctx.stroke();
    var lines = Array.isArray(st.lines) ? st.lines : [];
    for (var i = 0; i < Math.min(3, lines.length); i++) {
      tx(ctx, str(lines[i]), L + 30, T + 96 + i * 30, { size: i === 0 ? 20 : 18, align: 'left', color: i === 0 ? PAL.text : PAL.textDim, stroke: false, maxW: 740 });
    }
    ctx.restore();
  }

  function drawProgramRow(ctx, st) {
    st = S(st);
    var x = num(st.x, 0), y = num(st.y, 0);
    var style = st.style === 'mini' ? 'mini' : 'row';
    var key = PROG[st.program] ? st.program : '';
    var idx = clamp(Math.round(num(st.index, 0)), 0, 7);
    ctx.save();
    if (style === 'row') {
      var L = x - 300, T = y - 28;
      rr(ctx, L, T, 600, 56, 10); ctx.fillStyle = key ? PAL.panel2 : PAL.panel; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = key ? PAL.program : PAL.panelEdge; ctx.stroke();
      rr(ctx, L, T, 110, 56, 10); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
      tx(ctx, '第 ' + (idx + 1) + ' 段', L + 55, y + 1, { size: 20, color: PAL.textDim, stroke: false });
      programIcon(ctx, key, L + 150, y, 15);
      tx(ctx, key ? PROG[key].name : '自由', L + 182, y + 1, { size: 24, align: 'left', color: key ? PAL.text : PAL.textMute, stroke: false });
      if (key) tx(ctx, PROG[key].desc, L + 585, y + 1, { size: 16, align: 'right', color: PAL.textDim, stroke: false });
      if (st.selected === true) { selFrame(ctx, L, T, 600, 56, 10); selArrow(ctx, L - 10, y); }
    } else {
      var Lm = x - 70, Tm = y - 23;
      var active = st.active === true, done = st.done === true;
      rr(ctx, Lm, Tm, 140, 46, 8);
      ctx.fillStyle = active ? '#1d4a52' : (done ? '#1a1628' : PAL.panel); ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = done ? '#2c2640' : PAL.panelEdge; ctx.stroke();
      ctx.save();
      if (done) ctx.globalAlpha = 0.35;
      programIcon(ctx, key, x, y - (active ? 5 : 0), 13);
      ctx.restore();
      if (active) {
        var p = ratio(st.t, num(st.dur, 8));
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; rr(ctx, Lm + 10, Tm + 34, 120, 7, 3); ctx.fill();
        if (p > 0) { ctx.fillStyle = PAL.program; rr(ctx, Lm + 10, Tm + 34, Math.max(4, 120 * p), 7, 3); ctx.fill(); }
        rr(ctx, Lm + 2, Tm + 2, 136, 42, 7); ctx.lineWidth = 3.5; ctx.strokeStyle = PAL.select; ctx.stroke();
      }
      if (done) {
        ctx.strokeStyle = PAL.textMute; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(Lm + 110, y - 2); ctx.lineTo(Lm + 117, y + 6); ctx.lineTo(Lm + 130, y - 9); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawRuleSlot(ctx, st) {
    st = S(st);
    var x = num(st.x, 1000), y = num(st.y, 150);
    var key = RULE[st.rule] ? st.rule : '';
    var idx = clamp(Math.round(num(st.index, 0)), 0, 2);
    var L = x - 220, T = y - 45;
    ctx.save();
    rr(ctx, L, T, 440, 90, 12);
    ctx.fillStyle = key ? '#3a2c1c' : PAL.panel; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = key ? PAL.rule : PAL.panelEdge;
    if (!key) ctx.setLineDash([8, 6]);
    ctx.stroke(); ctx.setLineDash([]);
    tx(ctx, '場規 ' + (idx + 1), L + 16, T + 16, { size: 14, align: 'left', color: PAL.textDim, stroke: false });
    ruleIcon(ctx, key, L + 52, y + 8, 22);
    tx(ctx, key ? RULE[key].name : '空牌位', L + 90, y - 4, { size: 26, align: 'left', color: key ? PAL.text : PAL.textMute, stroke: false });
    if (key) tx(ctx, RULE[key].desc, L + 90, y + 26, { size: 15, align: 'left', color: PAL.textDim, stroke: false, maxW: 340 });
    if (st.selected === true) selFrame(ctx, L, T, 440, 90, 12);
    ctx.restore();
  }

  function drawPickerPanel(ctx, st) {
    st = S(st);
    var layer = st.layer === 'rule' ? 'rule' : 'program';
    var opts = Array.isArray(st.options) ? st.options : [];
    var n = opts.length;
    var sel = Math.round(num(st.index, 0));
    var L = 760, W = 460;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; rr(ctx, L + 6, 66, W, 50 + 52 * n, 12); ctx.fill();
    rr(ctx, L, 60, W, 50 + 52 * n, 12); ctx.fillStyle = '#1f1a33'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = layer === 'rule' ? PAL.rule : PAL.program; ctx.stroke();
    tx(ctx, layer === 'rule' ? '掛哪塊場規?' : '放哪個節目?', L + W / 2, 86, { size: 22, color: PAL.text, stroke: false });
    for (var i = 0; i < n; i++) {
      var o = S(opts[i]);
      var T = 110 + 52 * i;
      var dis = o.disabled === true;
      var key = str(o.key);
      if (i === sel) { rr(ctx, L + 6, T + 3, W - 12, 46, 8); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill(); }
      ctx.save();
      if (dis) ctx.globalAlpha = 0.35;
      if (layer === 'rule') {
        if (key === 'clear') programIcon(ctx, 'clear', L + 34, T + 26, 12);
        else ruleIcon(ctx, key, L + 34, T + 26, 15);
      } else {
        programIcon(ctx, key === 'clear' ? 'clear' : key, L + 34, T + 26, 13);
      }
      tx(ctx, str(o.name), L + 62, T + (o.desc ? 17 : 26), { size: 20, align: 'left', color: dis ? PAL.textMute : PAL.text, stroke: false, maxW: W - 80 });
      if (o.desc) tx(ctx, str(o.desc), L + 62, T + 38, { size: 14, align: 'left', color: PAL.textDim, stroke: false, maxW: W - 80 });
      ctx.restore();
      if (i === sel) {
        rr(ctx, L + 6, T + 3, W - 12, 46, 8); ctx.lineWidth = 3; ctx.strokeStyle = PAL.select; ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawRuleBadge(ctx, st) {
    st = S(st);
    var x = num(st.x, 1110), y = num(st.y, 25);
    var fd = num(st.flashDur, 0.3);
    var p = ratio(st.flashT, fd);
    var flashing = fd > 0 && num(st.flashT, fd) < fd;
    ctx.save();
    ruleIcon(ctx, st.rule, x, y, 18);
    if (flashing && RULE[st.rule]) {
      var a = 1 - p;
      rr(ctx, x - 19, y - 19, 38, 38, 7);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.55 * a).toFixed(2) + ')'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')'; ctx.stroke();
    }
    ctx.restore();
  }

  function drawBannerFx(ctx, st) {
    st = S(st);
    var x = num(st.x, 640), y = num(st.y, 180);
    var key = PROG[st.program] ? st.program : '';
    var p = ratio(st.t, num(st.dur, 0.8));
    var sc = p < 0.15 ? 0.7 + 0.3 * (p / 0.15) : 1;
    var a = p > 0.7 ? Math.max(0, 1 - (p - 0.7) / 0.3) : 1;
    var label = (key ? PROG[key].name : '自由') + '!';
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y); ctx.scale(sc, sc);
    rr(ctx, -150, -36, 300, 72, 36); ctx.fillStyle = 'rgba(16,40,46,0.88)'; ctx.fill();
    ctx.lineWidth = 3.5; ctx.strokeStyle = PAL.program; ctx.stroke();
    programIcon(ctx, key, -105, 0, 20);
    tx(ctx, label, 22, 2, { size: 42, color: '#ffffff', stroke: PAL.outline, sw: 6, maxW: 210 });
    ctx.restore();
  }

  function drawRuleFx(ctx, st) {
    st = S(st);
    var x = num(st.x, 0), y = num(st.y, 0);
    var key = RULE[st.rule] ? st.rule : '';
    var p = ratio(st.t, num(st.dur, 0.8));
    var a = p > 0.7 ? Math.max(0, 1 - (p - 0.7) / 0.3) : 1;
    var yy = y - 80 - p * 10;
    ctx.save();
    ctx.globalAlpha = a;
    rr(ctx, x - 62, yy - 15, 124, 30, 8); ctx.fillStyle = '#3a2c1c'; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.rule; ctx.stroke();
    ruleIcon(ctx, key, x - 44, yy, 10);
    tx(ctx, (key ? RULE[key].name : '') + '!', x + 10, yy + 1, { size: 18, color: '#ffffff', stroke: PAL.outline, sw: 3.5 });
    ctx.restore();
  }

  // ---------- 表演場 ----------
  function drawShowArena(ctx) {
    ctx.save();
    ctx.fillStyle = '#1a1428'; ctx.fillRect(0, 0, 1280, 720);
    // 觀眾席 (上 / 下): 階梯座位
    var bands = [[56, 136], [582, 662]];
    for (var b = 0; b < 2; b++) {
      var T = bands[b][0], B = bands[b][1];
      ctx.fillStyle = PAL.stands; ctx.fillRect(40, T, 1200, B - T);
      for (var r = 0; r < 3; r++) {
        ctx.fillStyle = r % 2 ? '#43375a' : '#4c3f66';
        ctx.fillRect(40, T + 10 + r * 23, 1200, 14);
      }
      ctx.lineWidth = 2; ctx.strokeStyle = '#2a2140'; ctx.strokeRect(40, T, 1200, B - T);
    }
    // 場地
    ctx.fillStyle = '#5a4428'; ctx.fillRect(56, 142, 1168, 428);
    ctx.fillStyle = PAL.arenaFloor; ctx.fillRect(60, 146, 1160, 420);
    // 沙地紋
    ctx.fillStyle = 'rgba(120,80,30,0.12)';
    for (var i = 0; i < 70; i++) { circle(ctx, 60 + hash(i + 3) * 1160, 146 + hash(i + 77) * 420, 2 + hash(i + 5) * 3); ctx.fill(); }
    // 中央圈 (大合照的中央點)
    ctx.strokeStyle = 'rgba(232,210,160,0.55)'; ctx.lineWidth = 3;
    circle(ctx, 640, 356, 120); ctx.stroke();
    circle(ctx, 640, 356, 6); ctx.fillStyle = 'rgba(232,210,160,0.7)'; ctx.fill();
    // 活動範圍提示 (極淡)
    ctx.setLineDash([6, 10]); ctx.strokeStyle = 'rgba(90,60,30,0.35)'; ctx.lineWidth = 2;
    ctx.strokeRect(76, 162, 1128, 388); ctx.setLineDash([]);
    // 下方節目表槽
    ctx.fillStyle = '#120e1e'; ctx.fillRect(0, 664, 1280, 56);
    ctx.restore();
  }

  function rageBar(ctx, x, y, rage, redLow, loose) {
    var L = x - 30, T = y - 4;
    ctx.fillStyle = 'rgba(10,8,20,0.9)'; ctx.fillRect(L - 1, T - 1, 62, 10);
    ctx.fillStyle = '#3a3448'; ctx.fillRect(L, T, 60, 8);
    // 紅區段底
    ctx.fillStyle = 'rgba(255,74,61,0.35)'; ctx.fillRect(L + 60 * redLow / 100, T, 60 * (1 - redLow / 100), 8);
    var p = clamp(rage / 100, 0, 1);
    ctx.fillStyle = loose ? PAL.ignite : (rage >= redLow ? PAL.ignite : (rage >= 50 ? '#ffb340' : '#8aa0b8'));
    ctx.fillRect(L, T + 1, 60 * p, 6);
    // 紅區下限線 + 50 門檻刻度
    ctx.fillStyle = '#ffffff'; ctx.fillRect(L + 60 * redLow / 100 - 0.75, T - 1, 1.5, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(L + 30 - 0.5, T + 4, 1, 4);
  }

  function drawShowMonster(ctx, st) {
    st = S(st);
    var x = num(st.x, 0), y = num(st.y, 0);
    var sp = spKey(st.species);
    var rh = sp === 'rhino';
    var r = rh ? 28 : 23;
    var half = rh ? 40 : 32;
    var dir = st.dir === -1 ? -1 : 1;
    var mode = pick(st.mode, ['roam', 'program', 'dash', 'shelter', 'knock', 'charge', 'loose'], 'roam');
    var move = pick(st.move, ['walk', 'hop', 'fadeOut', 'fadeIn'], 'walk');
    var mp = ratio(st.moveT, num(st.moveDur, 0.3));
    var rage = clamp(num(st.rage, 0), 0, 100), redLow = clamp(num(st.redLow, 80), 0, 100);
    var wild = mode === 'charge' || mode === 'loose';
    var fx = pick(st.fx, ['none', 'ignited', 'doused', 'pulled'], 'none');
    var fp = ratio(st.fxT, num(st.fxDur, 0.5));
    var hop = move === 'hop' ? Math.sin(mp * Math.PI) * 4 : 0;
    var alpha = move === 'fadeOut' ? 1 - mp * 0.85 : (move === 'fadeIn' ? 0.15 + mp * 0.85 : 1);
    if (mode === 'shelter') alpha *= 0.55;
    var shake = (mode === 'charge' && num(st.chargeT, 0) > 0) ? Math.sin(num(st.chargeT, 0) * 50) * 2 : 0;
    var by = y - hop;
    ctx.save();
    // 影子
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.88, r * 0.85, r * 0.22, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
    // 節目模式: 腳下青色橢圓 (低權重)
    if (mode === 'program') {
      ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.program; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.ellipse(x, y + r * 0.88, r * 1.0, r * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // 表演中: 效果色的實心光盤 + 外擴環 (框內)
    if (st.performing === true && !wild) {
      var pp = ratio(st.performT, num(st.performDur, 0.5));
      var ec = EFF[SP[sp].eff].color;
      circle(ctx, x, by, r + 2); ctx.globalAlpha = 0.35 * (1 - pp); ctx.fillStyle = ec; ctx.fill();
      ctx.globalAlpha = 1 - pp; ctx.lineWidth = 3; ctx.strokeStyle = ec; circle(ctx, x, by, r + 2 + 5 * pp); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // 傳火令衝刺: 身後火焰尾
    if (mode === 'dash') {
      ctx.fillStyle = PAL.ignite; ctx.globalAlpha = 0.7;
      for (var d = 0; d < 3; d++) {
        var ty = by - 10 + d * 10;
        ctx.beginPath(); ctx.moveTo(x - dir * r * 0.6, ty - 4); ctx.lineTo(x - dir * (half - 1), ty); ctx.lineTo(x - dir * r * 0.6, ty + 4); ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // 被推開: 紫色速度線
    if (mode === 'knock') {
      ctx.strokeStyle = PAL.special; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (var k = -1; k <= 1; k++) {
        ctx.beginPath(); ctx.moveTo(x - dir * (r + 1), by + k * 11); ctx.lineTo(x - dir * (half - 1), by + k * 11); ctx.stroke();
      }
    }
    // 失控 (衝欄 / 亂竄): 紅色鋸齒外圈
    if (wild) {
      ctx.beginPath();
      for (var z = 0; z < 16; z++) {
        var za = z * Math.PI / 8;
        var zr = z % 2 ? r + 3 : half - 1;
        var zx = x + shake + Math.cos(za) * zr, zy = by + Math.sin(za) * zr;
        if (z === 0) ctx.moveTo(zx, zy); else ctx.lineTo(zx, zy);
      }
      ctx.closePath(); ctx.fillStyle = 'rgba(255,74,61,0.35)'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = PAL.ignite; ctx.stroke();
    }
    ctx.globalAlpha = alpha;
    ctx.save(); ctx.translate(x + shake, by);
    if (mode === 'knock') ctx.rotate(-0.15 * dir);
    drawBody(ctx, sp, r, { dir: dir, angry: wild || rage >= redLow });
    ctx.restore();
    ctx.globalAlpha = 1;
    // 避難: 白虛線泡泡 (不受技能)
    if (mode === 'shelter') {
      ctx.setLineDash([6, 4]); ctx.lineWidth = 2.5; ctx.strokeStyle = '#ffffff';
      circle(ctx, x, by, half - 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.4)'; circle(ctx, x, by, half - 6); ctx.stroke();
    }
    // 撞欄進度: 紅弧 (圍欄還要多久破)
    if (mode === 'charge' && num(st.chargeT, 0) > 0) {
      var cp = ratio(st.chargeT, num(st.chargeDur, 1.5));
      ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(x, by, r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cp); ctx.stroke();
    }
    // 反應 0.5 秒: 點燃 = 往上竄的火舌; 澆熄 = 往下滴的水; 推拉 = 側邊漩渦
    if (fx !== 'none' && !wild) {
      var fa = 1 - fp;
      ctx.globalAlpha = Math.max(0, fa);
      if (fx === 'ignited') {
        for (var fi = -1; fi <= 1; fi++) {
          var fxx = x + fi * r * 0.55, fyy = by - r * 0.55 - fp * 6;
          ctx.beginPath(); ctx.moveTo(fxx - 5, fyy + 4); ctx.quadraticCurveTo(fxx - 6, fyy - 5, fxx, fyy - 12); ctx.quadraticCurveTo(fxx + 6, fyy - 5, fxx + 5, fyy + 4); ctx.closePath();
          ctx.fillStyle = PAL.ignite; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(fxx - 2, fyy + 3); ctx.quadraticCurveTo(fxx, fyy - 6, fxx + 2, fyy + 3); ctx.closePath(); ctx.fillStyle = '#ffe14d'; ctx.fill();
        }
      } else if (fx === 'doused') {
        for (var di = -1; di <= 1; di += 2) {
          for (var dj = 0; dj < 2; dj++) {
            var dx = x + di * (r * 0.75 + dj * 4), dy = by - r * 0.2 + dj * 12 + fp * 10;
            ctx.beginPath(); ctx.moveTo(dx, dy - 6); ctx.quadraticCurveTo(dx - 4, dy + 1, dx, dy + 4); ctx.quadraticCurveTo(dx + 4, dy + 1, dx, dy - 6);
            ctx.fillStyle = PAL.calm; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
          }
        }
      } else {
        ctx.lineWidth = 3; ctx.strokeStyle = PAL.special;
        for (var pi = -1; pi <= 1; pi += 2) {
          ctx.beginPath(); ctx.arc(x + pi * (r * 0.95), by, 6, pi > 0 ? -Math.PI * 0.8 + fp * 3 : Math.PI * 0.2 + fp * 3, pi > 0 ? Math.PI * 0.6 + fp * 3 : Math.PI * 1.6 + fp * 3); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }
    // 怒氣條 (框外頭上)
    var barY = y + (rh ? -52 : -44);
    rageBar(ctx, x, barY, wild ? 100 : rage, redLow, wild);
    // 失控標記 (怒氣條上方一排)
    var marks = clamp(Math.round(num(st.marks, 0)), 0, 4);
    if (!wild && marks > 0) {
      var my = y + (rh ? -64 : -56);
      var x0 = x - (marks - 1) * 11 / 2;
      var ml = ratio(st.markLeft, num(st.markDur, 4));
      for (var m = 0; m < marks; m++) {
        var mx = x0 + m * 11;
        circle(ctx, mx, my, 4.5); ctx.fillStyle = PAL.outline; ctx.fill();
        circle(ctx, mx, my, 3.5); ctx.fillStyle = PAL.mark; ctx.fill();
        if (m === marks - 1 && num(st.markDur, 0) > 0) {
          // 最後一顆: 剩餘時間扇形 (這顆還要多久消掉)
          ctx.beginPath(); ctx.moveTo(mx, my); ctx.arc(mx, my, 3.5, -Math.PI / 2 + Math.PI * 2 * ml, Math.PI * 1.5); ctx.closePath();
          ctx.fillStyle = 'rgba(30,20,40,0.85)'; ctx.fill();
        }
      }
    }
    // Lv
    tx(ctx, 'Lv ' + clamp(Math.round(num(st.level, 0)), 0, 3), x, y + (rh ? 48 : 40), { size: 11, color: PAL.rep, sw: 3 });
    ctx.restore();
  }

  function drawFence(ctx, st) {
    st = S(st);
    var x = num(st.x, 0), y = num(st.y, 0);
    var broken = st.broken === true;
    ctx.save();
    var L = x - 68, T = y - 7;
    if (!broken) {
      ctx.fillStyle = PAL.outline; ctx.fillRect(L, T, 136, 14);
      ctx.fillStyle = '#c08a4a'; ctx.fillRect(L + 1, T + 2, 134, 4); ctx.fillRect(L + 1, T + 8, 134, 4);
      ctx.fillStyle = '#7a5228';
      for (var i = 0; i < 4; i++) ctx.fillRect(L + 4 + i * 40, T, 8, 14);
    } else {
      ctx.fillStyle = '#7a5228'; ctx.fillRect(L + 4, T, 8, 14); ctx.fillRect(L + 124, T, 8, 14);
      ctx.save(); ctx.translate(L + 32, y); ctx.rotate(0.06);
      ctx.fillStyle = PAL.outline; ctx.fillRect(-26, -4, 52, 8); ctx.fillStyle = '#c08a4a'; ctx.fillRect(-25, -3, 50, 6);
      ctx.restore();
      ctx.save(); ctx.translate(L + 104, y); ctx.rotate(-0.07);
      ctx.fillStyle = PAL.outline; ctx.fillRect(-24, -4, 48, 8); ctx.fillStyle = '#c08a4a'; ctx.fillRect(-23, -3, 46, 6);
      ctx.restore();
      ctx.strokeStyle = '#e8d2a0'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(L + 62, T + 2); ctx.lineTo(L + 66, T + 12); ctx.moveTo(L + 72, T + 1); ctx.lineTo(L + 70, T + 13); ctx.stroke();
    }
    ctx.restore();
  }

  var VISITOR_COLS = ['#5fa8d3', '#e07a5f', '#81b29a', '#f2cc8f', '#9a8cff', '#ef8fb8', '#7ad3c8', '#d0a070'];
  function drawVisitor(ctx, st) {
    st = S(st);
    var x = num(st.x, 0), y = num(st.y, 0);
    var mode = pick(st.mode, ['watch', 'scared', 'empty'], 'watch');
    var col = VISITOR_COLS[Math.abs(Math.floor(x / 17)) % VISITOR_COLS.length];
    ctx.save();
    // 座椅
    rr(ctx, x - 22, y + 14, 44, 16, 4); ctx.fillStyle = '#5a4a72'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
    if (mode === 'empty') { ctx.restore(); return; }
    var sc = mode === 'scared';
    var ox = sc ? (x > 640 ? 8 : -8) : 0;
    // 身體
    rr(ctx, x - 13 + ox, y - 4, 26, 26, 10); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    // 頭
    circle(ctx, x + ox, y - 18, 11); ctx.fillStyle = PAL.tamerSkin; ctx.fill(); ctx.stroke();
    if (sc) {
      // 雙手舉高 + 驚嚇線
      ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 10 + ox, y); ctx.lineTo(x - 18 + ox, y - 26); ctx.moveTo(x + 10 + ox, y); ctx.lineTo(x + 18 + ox, y - 26); ctx.stroke();
      ctx.fillStyle = PAL.outline;
      circle(ctx, x - 4 + ox, y - 19, 2.2); ctx.fill(); circle(ctx, x + 4 + ox, y - 19, 2.2); ctx.fill();
      circle(ctx, x + ox, y - 12, 2.5); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 24, y - 34); ctx.lineTo(x - 19, y - 29); ctx.moveTo(x + 24, y - 34); ctx.lineTo(x + 19, y - 29); ctx.moveTo(x, y - 37); ctx.lineTo(x, y - 33); ctx.stroke();
    } else {
      ctx.fillStyle = PAL.outline;
      circle(ctx, x - 4, y - 19, 1.8); ctx.fill(); circle(ctx, x + 4, y - 19, 1.8); ctx.fill();
      ctx.strokeStyle = PAL.outline; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y - 16, 4, 0.2, Math.PI - 0.2); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 商店 ----------
  function drawShopTab(ctx, st) {
    st = S(st);
    var x = num(st.x, 640), y = num(st.y, 85);
    var tab = pick(st.tab, ['char', 'show', 'monster'], 'char');
    var cur = st.current === true;
    var name = { char: '角色', show: '表演', monster: '怪物' }[tab];
    ctx.save();
    rr(ctx, x - 110, y - 25, 220, 50, 12);
    ctx.fillStyle = cur ? PAL.panel2 : '#1f1a33'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = cur ? PAL.text : PAL.panelEdge; ctx.stroke();
    if (cur) { ctx.fillStyle = PAL.text; ctx.fillRect(x - 60, y + 18, 120, 4); }
    tx(ctx, name, x, y - 1, { size: 24, color: cur ? PAL.text : PAL.textDim, stroke: false });
    if (st.selected === true) selFrame(ctx, x - 110, y - 25, 220, 50, 12);
    ctx.restore();
  }

  function shopIcon(ctx, item, x, y) {
    if (WEAPON[item]) { weaponIcon(ctx, item, x, y, 26); return; }
    if (PROG[item]) { programIcon(ctx, item, x, y, 20); return; }
    if (RULE[item]) { ruleIcon(ctx, item, x, y, 22); return; }
    if (SP[item]) { ctx.save(); ctx.translate(x, y); drawBody(ctx, item, 24, { dir: 1 }); ctx.restore(); return; }
    ctx.save();
    if (item === 'attack') {
      weaponIcon(ctx, 'sword', x - 4, y + 2, 20);
      tx(ctx, '+', x + 16, y - 12, { size: 22, color: PAL.gold });
    } else if (item === 'armor') {
      heartPath(ctx, x, y, 18); ctx.fillStyle = PAL.heart; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.outline; ctx.stroke();
      tx(ctx, '+', x + 18, y - 14, { size: 22, color: PAL.gold });
    } else if (item === 'ropeBag') {
      ctx.lineWidth = 4; ctx.strokeStyle = '#d9b46a';
      circle(ctx, x, y, 15); ctx.stroke(); circle(ctx, x, y, 9); ctx.stroke();
      tx(ctx, '+', x + 18, y - 14, { size: 22, color: PAL.gold });
    }
    ctx.restore();
  }

  function drawShopItem(ctx, st) {
    st = S(st);
    var x = num(st.x, 220), y = num(st.y, 190);
    var item = str(st.item);
    var L = x - 190, T = y - 50;
    var locked = st.locked === true, maxed = st.maxed === true;
    var name = '', desc = '';
    if (WEAPON[item]) { name = WEAPON[item].name; desc = WEAPON[item].desc; }
    else if (UPG[item]) { name = UPG[item].name; desc = UPG[item].desc; }
    else if (PROG[item]) { name = PROG[item].name; desc = PROG[item].desc; }
    else if (RULE[item]) { name = RULE[item].name; desc = RULE[item].desc; }
    else if (SP[item]) { name = SP[item].name; desc = ''; }
    else name = item;
    var lv = Math.max(0, Math.round(num(st.level, 0)));
    var cost = Math.max(0, Math.round(num(st.cost, 0)));
    var aff = st.affordable === true;
    ctx.save();
    rr(ctx, L, T, 380, 100, 12);
    ctx.fillStyle = locked ? '#1a1628' : PAL.panel; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = st.equipped === true ? PAL.gold : PAL.panelEdge; ctx.stroke();
    ctx.save();
    if (locked) ctx.globalAlpha = 0.35;
    shopIcon(ctx, item, L + 48, y);
    ctx.restore();
    tx(ctx, name, L + 92, T + 28, { size: 21, align: 'left', color: locked ? PAL.textMute : PAL.text, stroke: false, maxW: 180 });
    if (SP[item]) {
      effTag(ctx, st.effect || SP[item].eff, L + 122, T + 62, 22);
      tx(ctx, 'Lv ' + clamp(lv, 0, 3), L + 172, T + 63, { size: 18, align: 'left', color: PAL.rep, stroke: false });
    } else {
      tx(ctx, desc, L + 92, T + 62, { size: 15, align: 'left', color: PAL.textDim, stroke: false, maxW: 190 });
      if (UPG[item] && lv > 0) tx(ctx, '已買 ' + lv, L + 92, T + 84, { size: 13, align: 'left', color: PAL.textDim, stroke: false });
    }
    // 右側: 價格或狀態
    var rs = '', rc = PAL.text;
    if (SP[item]) {
      if (locked) { rs = '未收服'; rc = PAL.textMute; }
      else if (maxed) { rs = '已滿級'; rc = PAL.rep; }
    } else if (WEAPON[item] && st.equipped === true) { rs = '裝備中'; rc = PAL.gold; }
    else if ((WEAPON[item] || PROG[item] || RULE[item]) && st.owned === true) { rs = '已擁有'; rc = PAL.catch; }
    if (rs) {
      tx(ctx, rs, L + 366, T + 30, { size: 18, align: 'right', color: rc, stroke: false });
    } else if (cost > 0) {
      coin(ctx, L + 300, T + 30, 9);
      tx(ctx, String(cost), L + 366, T + 31, { size: 22, align: 'right', color: aff ? PAL.gold : PAL.textMute, stroke: false });
    }
    if (st.selected === true) selFrame(ctx, L, T, 380, 100, 12);
    ctx.restore();
  }

  function drawShopDetail(ctx, st) {
    st = S(st);
    var x = num(st.x, 640), y = num(st.y, 570);
    var lines = Array.isArray(st.lines) ? st.lines : [];
    var n = Math.min(3, lines.length);
    ctx.save();
    rr(ctx, x - 540, y - 30, 1080, 60, 10); ctx.fillStyle = '#1f1a33'; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = PAL.panelEdge; ctx.stroke();
    var size = n <= 1 ? 22 : (n === 2 ? 18 : 15);
    var gap = n <= 1 ? 0 : (n === 2 ? 22 : 18);
    for (var i = 0; i < n; i++) {
      tx(ctx, str(lines[i]), x, y + (i - (n - 1) / 2) * gap, { size: size, color: i === 0 ? PAL.text : PAL.textDim, stroke: false, maxW: 1040 });
    }
    ctx.restore();
  }

  function drawButton(ctx, st) {
    st = S(st);
    var x = num(st.x, 0), y = num(st.y, 0), w = Math.max(10, num(st.w, 200)), h = Math.max(10, num(st.h, 60));
    var sel = st.selected === true;
    ctx.save();
    rr(ctx, x, y + 4, w, h, 12); ctx.fillStyle = '#0c0a16'; ctx.fill();
    rr(ctx, x, y, w, h, 12); ctx.fillStyle = sel ? '#4a4070' : PAL.panel2; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.panelEdge; ctx.stroke();
    tx(ctx, str(st.label), x + w / 2, y + h / 2, { size: Math.min(28, h * 0.42), color: PAL.text, stroke: false, maxW: w - 16 });
    if (sel) selFrame(ctx, x, y, w, h, 12);
    ctx.restore();
  }

  function drawFloatText(ctx, st) {
    st = S(st);
    var x = num(st.x, 0), y = num(st.y, 0);
    var kind = pick(st.kind, ['gold', 'redGold', 'chain', 'repDown', 'capture', 'heal'], 'gold');
    var p = ratio(st.t, num(st.dur, 1));
    var a = p > 0.6 ? 1 - (p - 0.6) / 0.4 : 1;
    var dy = kind === 'repDown' ? p * 20 : -p * 30;
    var size = { gold: 18, redGold: 24, chain: 22, repDown: 18, capture: 26, heal: 20 }[kind];
    var col = { gold: PAL.gold, redGold: PAL.gold, chain: '#ffffff', repDown: '#c8a8ff', capture: PAL.catch, heal: '#ffb0c4' }[kind];
    var stroke = { gold: PAL.outline, redGold: '#a01810', chain: '#b04010', repDown: PAL.outline, capture: '#0a3a20', heal: '#5a1028' }[kind];
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    var yy = y + dy;
    var s = str(st.text);
    if (kind === 'capture') {
      // 打勾
      setFont(ctx, size); var w = measure(ctx, s);
      var cx = x - w / 2 - 16;
      circle(ctx, cx, yy, 12); ctx.fillStyle = PAL.catch; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#0a3a20'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 6, yy); ctx.lineTo(cx - 1, yy + 5); ctx.lineTo(cx + 7, yy - 6); ctx.lineWidth = 3; ctx.strokeStyle = '#0a3a20'; ctx.stroke();
      tx(ctx, s, x + 6, yy, { size: size, color: col, stroke: stroke, sw: 5 });
    } else if (kind === 'heal') {
      setFont(ctx, size); var wh = measure(ctx, s);
      heartPath(ctx, x - wh / 2 - 14, yy, 9); ctx.fillStyle = PAL.heart; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
      tx(ctx, s, x + 4, yy, { size: size, color: col, stroke: stroke, sw: 4.5 });
    } else {
      tx(ctx, s, x, yy, { size: size, color: col, stroke: stroke, sw: kind === 'redGold' ? 6 : 4 });
    }
    ctx.restore();
  }

  function drawResultPanel(ctx, st) {
    st = S(st);
    var L = 240, T = 120, W = 800, H = 520;
    var stars = clamp(Math.round(num(st.stars, 0)), 0, 3);
    ctx.save();
    rr(ctx, L, T, W, H, 20); ctx.fillStyle = PAL.panel; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = PAL.panelEdge; ctx.stroke();
    tx(ctx, '五天結算', 640, T + 42, { size: 32, color: PAL.text, stroke: false });
    for (var i = 0; i < 3; i++) repStar(ctx, 560 + i * 80, T + 110, 32, i < stars);
    var rows = [
      ['總名聲', String(Math.round(num(st.rep, 0)))],
      ['累計賺得金幣', String(Math.round(num(st.goldEarned, 0)))],
      ['最長連鎖', String(Math.round(num(st.bestChain, 0))) + ' 段']
    ];
    for (var r = 0; r < rows.length; r++) {
      var yy = T + 182 + r * 40;
      tx(ctx, rows[r][0], L + 230, yy, { size: 22, align: 'left', color: PAL.textDim, stroke: false });
      tx(ctx, rows[r][1], L + 570, yy, { size: 26, align: 'right', color: r === 0 ? PAL.rep : (r === 1 ? PAL.gold : PAL.text), stroke: false });
    }
    tx(ctx, '怪物庫', 640, T + 315, { size: 20, color: PAL.textDim, stroke: false });
    var bank = Array.isArray(st.bank) ? st.bank : [];
    var n = Math.min(6, bank.length);
    var cw = 120, x0 = 640 - (n - 1) * cw / 2;
    for (var b = 0; b < n; b++) {
      var e = S(bank[b]);
      var sp = SP[e.species] ? e.species : 'bunny';
      var cx = x0 + b * cw;
      ctx.save(); ctx.translate(cx, T + 372); drawBody(ctx, sp, 22, { dir: 1 }); ctx.restore();
      tx(ctx, '×' + Math.max(0, Math.round(num(e.count, 0))), cx, T + 415, { size: 20, color: PAL.text, stroke: false });
      tx(ctx, 'Lv ' + clamp(Math.round(num(e.level, 0)), 0, 3), cx, T + 438, { size: 15, color: PAL.rep, stroke: false });
    }
    tx(ctx, '按 Z 重來', 640, T + 488, { size: 22, color: PAL.text, stroke: false });
    ctx.restore();
  }

  var PHASES = ['guide', 'select', 'dungeon', 'setup1', 'setup2', 'show', 'shop', 'result'];
  function drawHud(ctx, st) {
    st = S(st);
    var phase = pick(st.phase, PHASES, 'select');
    if (phase === 'guide') return; // 說明頁的字全歸 RD
    var dg = phase === 'dungeon';
    var H = dg ? 100 : 50;
    ctx.save();
    ctx.fillStyle = 'rgba(14,11,26,0.94)'; ctx.fillRect(0, 0, 1280, H);
    ctx.fillStyle = PAL.panelEdge; ctx.fillRect(0, H - 2, 1280, 2);
    var day = Math.round(num(st.day, 1)), dmax = Math.round(num(st.dayMax, 5));
    var cy = 25;
    tx(ctx, '第 ' + day + ' / ' + dmax + ' 天', 20, cy, { size: 20, align: 'left', stroke: false });
    coin(ctx, 170, cy, 10);
    tx(ctx, String(Math.round(num(st.gold, 0))), 186, cy + 1, { size: 21, align: 'left', color: PAL.gold, stroke: false });
    repStar(ctx, 282, cy, 11, true);
    tx(ctx, String(Math.round(num(st.rep, 0))), 298, cy + 1, { size: 21, align: 'left', color: PAL.rep, stroke: false });
    var tm = num(st.timeMax, 0);
    var tEnd = 560;
    if (tm > 0) {
      var tl = clamp(num(st.timeLeft, 0), 0, tm);
      var bx = 390, bw = 140;
      ctx.fillStyle = '#2c2640'; rr(ctx, bx, cy - 6, bw, 12, 6); ctx.fill();
      ctx.fillStyle = tl / tm < 0.2 ? PAL.danger : '#e8e4f0'; rr(ctx, bx, cy - 6, Math.max(6, bw * tl / tm), 12, 6); ctx.fill();
      tx(ctx, Math.ceil(tl) + ' 秒', bx + bw + 12, cy + 1, { size: 20, align: 'left', color: tl / tm < 0.2 ? PAL.danger : PAL.text, stroke: false });
      tEnd = 610;
    }
    var msg = str(st.message);
    if (dg) {
      var dn = DUNGEON[st.dungeon] ? DUNGEON[st.dungeon].name : '';
      tx(ctx, dn, tEnd + 20, cy + 1, { size: 20, align: 'left', color: PAL.textDim, stroke: false });
      // 第二列: 心 / 繩 / 武器 / X 冷卻 / 訊息
      var y2 = 70;
      var mh = clamp(Math.round(num(st.maxHearts, 6)), 0, 20), h = clamp(Math.round(num(st.hearts, 0)), 0, mh);
      for (var i = 0; i < mh; i++) {
        heartPath(ctx, 30 + i * 28, y2, 11);
        ctx.fillStyle = i < h ? PAL.heart : '#3a3448'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.outline; ctx.stroke();
      }
      var rx = 30 + mh * 28 + 20;
      ctx.lineWidth = 3.5; ctx.strokeStyle = '#d9b46a'; circle(ctx, rx, y2, 10); ctx.stroke(); circle(ctx, rx, y2, 5); ctx.stroke();
      tx(ctx, Math.round(num(st.ropes, 0)) + ' / ' + Math.round(num(st.ropeMax, 4)), rx + 18, y2 + 1, { size: 20, align: 'left', stroke: false });
      var wx = rx + 110;
      var wp = pick(st.weapon, ['club', 'sword', 'spear', 'whip'], 'club');
      rr(ctx, wx - 22, y2 - 20, 44, 40, 8); ctx.fillStyle = PAL.panel; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.panelEdge; ctx.stroke();
      weaponIcon(ctx, wp, wx, y2, 16);
      tx(ctx, WEAPON[wp].name, wx + 32, y2 + 1, { size: 18, align: 'left', stroke: false });
      var xm = num(st.xCdMax, 0);
      var kx = wx + 110;
      if (xm > 0) {
        var xl = clamp(num(st.xCdLeft, 0), 0, xm);
        keycap(ctx, 'X', kx, y2, 30);
        if (xl > 0) {
          ctx.beginPath(); ctx.moveTo(kx, y2); ctx.arc(kx, y2, 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (xl / xm)); ctx.closePath();
          ctx.fillStyle = 'rgba(14,11,26,0.7)'; ctx.fill();
        }
      }
      tx(ctx, msg, 1260, y2, { size: 22, align: 'right', color: PAL.text, stroke: false, maxW: 1260 - kx - 40 });
    } else {
      var right = phase === 'show' ? 1070 : 1260;
      tx(ctx, msg, right, cy + 1, { size: 20, align: 'right', color: PAL.textDim, stroke: false, maxW: right - tEnd - 20 });
    }
    ctx.restore();
  }

  // ---------- 說明頁示意圖 ----------
  function fitBox(ctx, st, VW, VH) {
    var x = num(st.x, 0), y = num(st.y, 0), w = Math.max(1, num(st.w, VW)), h = Math.max(1, num(st.h, VH));
    var s = Math.min(w / VW, h / VH);
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.translate(x + (w - VW * s) / 2, y + (h - VH * s) / 2);
    ctx.scale(s, s);
  }
  function label(ctx, s, x, y, col) { tx(ctx, s, x, y, { size: 18, color: col || PAL.text, sw: 4 }); }

  function guide1(ctx) {
    // 虛擬 800×400: 蒲公英草原一角
    for (var cx = 0; cx < 14; cx++) for (var cy = 0; cy < 7; cy++) {
      var kind = cy === 0 ? 'wall' : 'floor';
      if (cx === 11 && cy === 5) kind = 'slow';
      drawTile(ctx, { x: 30 + cx * 60, y: 30 + cy * 60, dungeon: 'meadow', kind: kind, nest: false });
    }
    var T = { x: 230, y: 290 }, B1 = { x: 290, y: 312 };
    var dirv = { x: 0.924, y: -0.383 };
    var B2 = { x: T.x + dirv.x * 330, y: T.y + dirv.y * 330 };
    // 種子環: 8 方向, 距離 110
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4;
      drawHazard(ctx, { x: B2.x + Math.cos(a) * 110, y: B2.y + Math.sin(a) * 110, kind: 'seed', phase: 'fly', radius: 10, angle: a, t: 1, dur: 4 });
    }
    drawWildMonster(ctx, { x: B2.x, y: B2.y, species: 'bunny', hp: 7, maxHp: 7, dir: -1, move: 'walk' });
    drawWildMonster(ctx, { x: B1.x, y: B1.y, species: 'bunny', hp: 5, maxHp: 7, hit: true, dir: -1, move: 'walk' });
    drawTamer(ctx, { x: T.x, y: T.y, facing: 2, weapon: 'club' });
    drawWeaponFx(ctx, { x: T.x, y: T.y, weapon: 'club', move: 'normal', shape: 'arc', angle: 0, spread: 100 * Math.PI / 180, radius: 70, t: 0.08, dur: 0.2 });
    // 移動箭頭: 沿 157.5° 方向的射線穿過 135° 與 180° 兩顆種子之間
    var s0 = 40, s1 = 330 - 62;
    arrow(ctx, T.x + dirv.x * s0, T.y + dirv.y * s0, T.x + dirv.x * s1, T.y + dirv.y * s1, '#ffffff', 5, 16);
    // 鍵帽貼在做那個動作的東西旁
    var mid = { x: T.x + dirv.x * 150, y: T.y + dirv.y * 150 };
    ctx.save(); ctx.translate(mid.x - 0.383 * 75, mid.y - 0.924 * 75 + 14); arrowKeys(ctx, 0, 0, 26); ctx.restore();
    keycap(ctx, 'Z', B1.x + 70, B1.y + 34, 32);
    keycap(ctx, 'X', T.x - 70, T.y + 10, 32);
    label(ctx, '武器技', T.x - 70, T.y + 44);
    label(ctx, '你', T.x - 6, T.y - 46);
  }

  function guide2(ctx) {
    // 虛擬 900×400: 左右兩格 + 角落小圖
    function cell(L) {
      rr(ctx, L, 10, 400, 330, 14); ctx.fillStyle = TILE_PAL.meadow.floor; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = PAL.panelEdge; ctx.stroke();
    }
    cell(20); cell(450);
    // 左: 站在殘血霧雨雲身上, 準備捕捉一半
    drawCaptureRing(ctx, { x: 220, y: 190, t: 0.4, dur: 0.8 });
    drawWildMonster(ctx, { x: 220, y: 190, species: 'cloud', hp: 2, maxHp: 7, weak: true, dir: 1, move: 'walk' });
    drawTamer(ctx, { x: 232, y: 214, facing: 7, weapon: 'club' });
    // 右: 套索 + 繞圈
    var M = { x: 650, y: 175 }, Tm = { x: 760, y: 245 };
    drawWildMonster(ctx, { x: M.x, y: M.y, species: 'cloud', hp: 2, maxHp: 7, weak: true, lassoed: true, stunLeft: 0, stunDur: 2, dir: 1, move: 'walk' });
    drawLasso(ctx, { x1: Tm.x, y1: Tm.y, x2: M.x, y2: M.y, progress: 0.5, t: 1.5, limit: 5, len: 130, maxLen: 220 });
    // 繞圈路線: 從馴獸師沿圓往前
    ctx.save();
    var R = Math.sqrt((Tm.x - M.x) * (Tm.x - M.x) + (Tm.y - M.y) * (Tm.y - M.y));
    var a0 = Math.atan2(Tm.y - M.y, Tm.x - M.x);
    ctx.setLineDash([10, 8]); ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(M.x, M.y, R, a0 + 0.3, a0 + 0.3 + Math.PI * 1.45); ctx.stroke(); ctx.setLineDash([]);
    var ae = a0 + 0.3 + Math.PI * 1.45;
    arrow(ctx, M.x + Math.cos(ae - 0.12) * R, M.y + Math.sin(ae - 0.12) * R, M.x + Math.cos(ae + 0.05) * R, M.y + Math.sin(ae + 0.05) * R, '#ffffff', 4, 16);
    ctx.restore();
    drawTamer(ctx, { x: Tm.x, y: Tm.y, facing: 3, weapon: 'club', lassoing: true });
    // 角落小圖: 收服!
    rr(ctx, 690, 290, 190, 90, 12); ctx.fillStyle = 'rgba(14,11,26,0.85)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.panelEdge; ctx.stroke();
    drawFloatText(ctx, { x: 785, y: 335, text: '收服!', kind: 'capture', t: 0, dur: 1 });
  }

  function guide3(ctx) {
    // 虛擬 1280×720: 布置第 2 步實際版面縮圖
    drawBackground(ctx);
    var prog = ['brawl', 'scatter', 'cheer', '', '', '', '', ''];
    for (var i = 0; i < 8; i++) drawProgramRow(ctx, { x: 360, y: 92 + 62 * i, style: 'row', index: i, program: prog[i], selected: i === 3, active: false, t: 0, dur: 8, done: false });
    var rules = ['calm', 'pep', ''];
    for (var k = 0; k < 3; k++) drawRuleSlot(ctx, { x: 1000, y: 150 + 110 * k, index: k, rule: rules[k], selected: false });
    drawButton(ctx, { x: 260, y: 590, w: 200, h: 70, label: '開演', selected: false });
  }

  function nearestAway(list, i) {
    var best = -1, bd = 1e9;
    for (var j = 0; j < list.length; j++) {
      if (j === i) continue;
      var d = Math.hypot(list[j][0] - list[i][0], list[j][1] - list[i][1]);
      if (d < bd) { bd = d; best = j; }
    }
    var dx = list[i][0] - list[best][0], dy = list[i][1] - list[best][1], l = Math.hypot(dx, dy) || 1;
    return [dx / l, dy / l];
  }

  function guide4(ctx) {
    // 虛擬 1280×720: 表演場縮圖, 剛按 Z 換到「散開」
    drawShowArena(ctx);
    var mons = [[560, 330, 'bunny'], [720, 320, 'cloud'], [640, 420, 'rat'], [500, 440, 'bunny'], [790, 430, 'cloud']];
    for (var i = 0; i < mons.length; i++) {
      var d = nearestAway(mons, i);
      drawShowMonster(ctx, { x: mons[i][0], y: mons[i][1], species: mons[i][2], level: 0, rage: 60, redLow: 80, marks: 0, mode: 'program', move: 'walk', dir: d[0] < 0 ? -1 : 1, fx: 'none' });
      arrow(ctx, mons[i][0] + d[0] * 38, mons[i][1] + d[1] * 38, mons[i][0] + d[0] * 95, mons[i][1] + d[1] * 95, '#ffffff', 5, 16);
    }
    for (var f = 0; f < 8; f++) {
      drawFence(ctx, { x: 165 + 136 * f, y: 140, side: 'top', broken: false });
      drawFence(ctx, { x: 165 + 136 * f, y: 572, side: 'bottom', broken: false });
      drawVisitor(ctx, { x: 165 + 136 * f, y: 95, side: 'top', mode: 'watch' });
      drawVisitor(ctx, { x: 165 + 136 * f, y: 622, side: 'bottom', mode: 'watch' });
    }
    drawBannerFx(ctx, { x: 640, y: 180, program: 'scatter', t: 0.3, dur: 0.8 });
    var prog = ['brawl', 'scatter', 'rest', 'cheer', '', '', '', ''];
    for (var k = 0; k < 8; k++) drawProgramRow(ctx, { x: 95 + 155 * k, y: 691, style: 'mini', index: k, program: prog[k], selected: false, active: k === 1, t: k === 1 ? 0.3 : 0, dur: 8, done: k === 0 });
    keycap(ctx, 'Z', 420, 610, 52);
    arrow(ctx, 392, 628, 300, 668, '#ffffff', 6, 20);
  }

  function guide5(ctx) {
    // 虛擬 1000×440
    rr(ctx, 10, 10, 980, 200, 14); ctx.fillStyle = PAL.arenaFloor; ctx.fill();
    rr(ctx, 10, 225, 980, 205, 14); ctx.fillStyle = PAL.arenaFloor; ctx.fill();
    // 上: 紅區表演, 飛出 ×2 金幣
    drawShowMonster(ctx, { x: 300, y: 130, species: 'rat', level: 0, rage: 88, redLow: 80, marks: 0, mode: 'roam', performing: true, performT: 0.15, performDur: 0.5, move: 'walk', dir: 1, fx: 'none' });
    drawFloatText(ctx, { x: 430, y: 80, text: '+8 ×2', kind: 'redGold', t: 0.2, dur: 1 });
    // 放大的怒氣條示意
    ctx.save(); ctx.translate(640, 120); ctx.scale(4, 4); rageBar(ctx, 0, 0, 88, 80, false); ctx.restore();
    label(ctx, '紅區', 640 + 4 * 27, 76, PAL.ignite);
    // 下: 4 個標記 → 衝圍欄 (打叉)
    drawShowMonster(ctx, { x: 220, y: 345, species: 'rat', level: 0, rage: 100, redLow: 80, marks: 4, markLeft: 3, markDur: 4, mode: 'roam', move: 'walk', dir: 1, fx: 'none' });
    arrow(ctx, 300, 345, 520, 345, '#ffffff', 6, 20);
    label(ctx, '再 +1', 410, 318);
    drawFence(ctx, { x: 740, y: 400, side: 'bottom', broken: false });
    drawVisitor(ctx, { x: 700, y: 410, side: 'bottom', mode: 'scared' });
    drawShowMonster(ctx, { x: 740, y: 340, species: 'rat', level: 0, rage: 100, redLow: 80, marks: 0, mode: 'charge', chargeT: 0.6, chargeDur: 1.5, move: 'walk', dir: 1, fx: 'none' });
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 16; ctx.strokeStyle = PAL.outline;
    ctx.beginPath(); ctx.moveTo(850, 270); ctx.lineTo(940, 380); ctx.moveTo(940, 270); ctx.lineTo(850, 380); ctx.stroke();
    ctx.lineWidth = 10; ctx.strokeStyle = PAL.ignite;
    ctx.beginPath(); ctx.moveTo(850, 270); ctx.lineTo(940, 380); ctx.moveTo(940, 270); ctx.lineTo(850, 380); ctx.stroke();
    ctx.restore();
  }

  function guide6(ctx) {
    // 虛擬 1000×440: 流程圈
    var C = { x: 380, y: 220 }, R = 150;
    var nodes = [
      { a: -Math.PI / 2, name: '地下城' },
      { a: 0, name: '布置' },
      { a: Math.PI / 2, name: '表演' },
      { a: Math.PI, name: '商店' }
    ];
    ctx.save();
    ctx.lineWidth = 6; ctx.strokeStyle = PAL.panelEdge;
    for (var i = 0; i < 4; i++) {
      var a0 = nodes[i].a + 0.42, a1 = nodes[i].a + Math.PI / 2 - 0.42;
      ctx.beginPath(); ctx.arc(C.x, C.y, R, a0, a1); ctx.stroke();
      arrow(ctx, C.x + Math.cos(a1 - 0.08) * R, C.y + Math.sin(a1 - 0.08) * R, C.x + Math.cos(a1) * R, C.y + Math.sin(a1) * R, '#ffffff', 4, 16);
    }
    for (var n = 0; n < 4; n++) {
      var nx = C.x + Math.cos(nodes[n].a) * R, ny = C.y + Math.sin(nodes[n].a) * R;
      rr(ctx, nx - 62, ny - 34, 124, 68, 12); ctx.fillStyle = PAL.panel2; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.panelEdge; ctx.stroke();
      if (n === 0) { ctx.save(); ctx.translate(nx - 32, ny); ctx.scale(0.7, 0.7); drawTamer(ctx, { x: 0, y: 0, facing: 2, weapon: 'club' }); ctx.restore(); }
      if (n === 1) programIcon(ctx, 'brawl', nx - 34, ny, 14);
      if (n === 2) { ctx.save(); ctx.translate(nx - 34, ny); drawBody(ctx, 'bunny', 17, { dir: 1 }); ctx.restore(); }
      if (n === 3) coin(ctx, nx - 34, ny, 13);
      tx(ctx, nodes[n].name, nx + 14, ny + 1, { size: 22, color: PAL.text, stroke: false });
    }
    tx(ctx, '×5 天', C.x, C.y, { size: 40, color: PAL.rep, sw: 6 });
    // 表演旁: 名聲往上加
    var sx = C.x + 100, sy = C.y + R + 4;
    repStar(ctx, sx, sy, 14, true);
    arrow(ctx, sx + 26, sy + 8, sx + 26, sy - 34, PAL.rep, 4, 12);
    label(ctx, '名聲', sx + 66, sy - 12, PAL.rep);
    // 終點: 結算星數
    arrow(ctx, C.x + R + 70, C.y, 700, C.y, '#ffffff', 5, 18);
    rr(ctx, 710, C.y - 70, 270, 140, 16); ctx.fillStyle = PAL.panel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.panelEdge; ctx.stroke();
    tx(ctx, '結算', 845, C.y - 40, { size: 22, color: PAL.textDim, stroke: false });
    for (var s = 0; s < 3; s++) repStar(ctx, 785 + s * 60, C.y + 20, 24, s < 2);
    ctx.restore();
  }

  var GUIDE = [
    [guide1, 800, 400], [guide2, 900, 400], [guide3, 1280, 720],
    [guide4, 1280, 720], [guide5, 1000, 440], [guide6, 1000, 440]
  ];
  function drawGuidePage(ctx, st) {
    st = S(st);
    var page = clamp(Math.round(num(st.page, 0)), 0, GUIDE.length - 1);
    var g = GUIDE[page];
    ctx.save();
    fitBox(ctx, st, g[1], g[2]);
    g[0](ctx);
    ctx.restore();
  }

  window.Art = {
    canvas: { width: 1280, height: 720 },
    palette: PAL,
    drawBackground: drawBackground,
    drawTile: drawTile,
    drawKeg: drawKeg,
    drawFountain: drawFountain,
    drawTamer: drawTamer,
    drawWildMonster: drawWildMonster,
    drawCaptureRing: drawCaptureRing,
    drawLasso: drawLasso,
    drawHazard: drawHazard,
    drawBlast: drawBlast,
    drawWeaponFx: drawWeaponFx,
    drawDungeonCard: drawDungeonCard,
    drawSpeciesCard: drawSpeciesCard,
    drawSpeciesInfo: drawSpeciesInfo,
    drawProgramRow: drawProgramRow,
    drawRuleSlot: drawRuleSlot,
    drawPickerPanel: drawPickerPanel,
    drawRuleBadge: drawRuleBadge,
    drawBannerFx: drawBannerFx,
    drawRuleFx: drawRuleFx,
    drawShowArena: drawShowArena,
    drawShowMonster: drawShowMonster,
    drawFence: drawFence,
    drawVisitor: drawVisitor,
    drawShopTab: drawShopTab,
    drawShopItem: drawShopItem,
    drawShopDetail: drawShopDetail,
    drawButton: drawButton,
    drawFloatText: drawFloatText,
    drawResultPanel: drawResultPanel,
    drawHud: drawHud,
    drawGuidePage: drawGuidePage
  };
})();
