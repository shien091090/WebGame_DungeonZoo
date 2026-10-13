/* 怪獸節目表 — 美術(Canvas 2D 幾何繪製, 無外部資源)
 * 全域 window.Art; 所有 x,y 為物件中心點(畫面座標), drawButton 例外(左上角)。
 * 每個函式自己 save/restore。表外值一律正規化成預設(見 style.md「表外值」)。
 */
(function () {
  'use strict';

  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC","Heiti TC",sans-serif';

  // ---------- 小工具 ----------
  function N(v, d) { v = Number(v); return isFinite(v) ? v : (d === undefined ? 0 : d); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function pick(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function S(v) { return (v === undefined || v === null) ? '' : String(v); }
  function O(v) { return (v && typeof v === 'object') ? v : {}; }
  function ratio(t, dur) { dur = N(dur, 0); if (dur <= 0) return 0; return clamp(N(t, 0) / dur, 0, 1); }
  function now() {
    return ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) / 1000;
  }
  var TAU = Math.PI * 2;

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

  // 文字: 一律帶深色描邊(P10); maxW 超過就縮字
  function text(ctx, str, x, y, o) {
    o = o || {};
    str = S(str);
    if (!str) return;
    var size = o.size || 20;
    var weight = o.weight || 'bold';
    ctx.font = weight + ' ' + size + 'px ' + FONT;
    if (o.maxW) {
      var w = ctx.measureText(str).width;
      if (w > o.maxW && w > 0) {
        size = Math.max(10, Math.floor(size * o.maxW / w));
        ctx.font = weight + ' ' + size + 'px ' + FONT;
      }
    }
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.base || 'middle';
    if (o.stroke !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = o.strokeW || Math.max(3, size * 0.22);
      ctx.strokeStyle = o.strokeColor || P.outline;
      ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = o.color || P.ink;
    ctx.fillText(str, x, y);
  }

  function star(ctx, x, y, r, pts) {
    pts = pts || 5;
    ctx.beginPath();
    for (var i = 0; i < pts * 2; i++) {
      var a = -Math.PI / 2 + i * Math.PI / pts;
      var rad = (i % 2 === 0) ? r : r * 0.45;
      var px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function arrowLine(ctx, pts, color, w, head) {
    if (!pts || pts.length < 2) return;
    head = head || 14;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (var pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass === 0 ? P.outline : color;
      ctx.lineWidth = pass === 0 ? w + 4 : w;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      if (pts.length === 3) ctx.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]);
      else if (pts.length === 4) ctx.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]);
      else ctx.lineTo(pts[1][0], pts[1][1]);
      ctx.stroke();
    }
    var e = pts[pts.length - 1], p = pts[pts.length - 2];
    var a = Math.atan2(e[1] - p[1], e[0] - p[0]);
    ctx.beginPath();
    ctx.moveTo(e[0] + Math.cos(a) * head * 0.6, e[1] + Math.sin(a) * head * 0.6);
    ctx.lineTo(e[0] + Math.cos(a + 2.5) * head, e[1] + Math.sin(a + 2.5) * head);
    ctx.lineTo(e[0] + Math.cos(a - 2.5) * head, e[1] + Math.sin(a - 2.5) * head);
    ctx.closePath();
    ctx.fillStyle = color; ctx.strokeStyle = P.outline; ctx.lineWidth = 2;
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // ---------- 色票 ----------
  var P = {
    bg: '#15121d', bg2: '#201b2c', panel: '#2a2440', panelHi: '#3a3258', panelLine: '#4d4470',
    ink: '#f6f0e4', inkDim: '#a69fba', outline: '#100c16', disabled: '#6b6680',
    cursor: '#ffe066',
    tamer: '#f3ead8', tamerAccent: '#2ec4b6', mine: '#2ec4b6',
    danger: '#ff3b3b', amber: '#f0b030', rageLow: '#9aa3b5',
    gold: '#ffd84a', rep: '#c9a0ff', heart: '#ff5577', rope: '#d9b27a', good: '#5ef08a',
    fire: '#ec4a2c', water: '#3a8ef0', thunder: '#f4d43a', spike: '#5fb83a', stone: '#9a98a6', ghost: '#b46ee8',
    provoke: '#e8503a', chill: '#7cc8f0', rampage: '#f08a24', rally: '#4fbf7a', encore: '#f0c53a',
    ignite: '#ffa53a', douse: '#8fdcff',
    sand: '#c9a873', sandDark: '#a88a5c', stands: '#3a2f4a', fence: '#8a5a32'
  };

  var SPECIES = {
    fire: { name: '火蜥蜴', body: P.fire, dark: '#8e2414', light: '#ffb347' },
    water: { name: '水母', body: P.water, dark: '#1c4f99', light: '#b8dcff' },
    thunder: { name: '雷鳥', body: P.thunder, dark: '#9c7d10', light: '#fff6b8' },
    spike: { name: '刺蝟', body: P.spike, dark: '#2f6a1a', light: '#d9f0b0' },
    stone: { name: '石像鬼', body: P.stone, dark: '#55535f', light: '#d6d4de' },
    ghost: { name: '幽靈', body: P.ghost, dark: '#6a3896', light: '#ecd4ff' }
  };
  var SPECIES_KEYS = ['fire', 'water', 'thunder', 'spike', 'stone', 'ghost'];
  function sp(k) { return SPECIES[pick(k, SPECIES_KEYS, 'fire')]; }
  function spKey(k) { return pick(k, SPECIES_KEYS, 'fire'); }

  var CARDS = {
    provoke: { name: '激將', color: P.provoke },
    chill: { name: '冰鎮', color: P.chill },
    rampage: { name: '橫衝直撞', color: P.rampage },
    rally: { name: '集合', color: P.rally },
    encore: { name: '安可', color: P.encore }
  };
  var CARD_KEYS = ['provoke', 'chill', 'rampage', 'rally', 'encore'];

  var DUNGEONS = {
    cave: { name: '濕熱洞窟', mons: ['fire', 'water'] },
    cliff: { name: '雷鳴崖', mons: ['thunder', 'spike'] },
    ruins: { name: '古代遺跡', mons: ['stone', 'ghost'] }
  };
  var DUNGEON_KEYS = ['cave', 'cliff', 'ruins'];

  var SKIN = {
    cave: { floor: '#3d2f29', floor2: '#43342d', hall: '#4a3a31', wall: '#1d1512', wallTop: '#33261f', wallEdge: '#55402f', pillar: '#6b5240' },
    cliff: { floor: '#2d3440', floor2: '#323a47', hall: '#38404e', wall: '#141922', wallTop: '#262e3b', wallEdge: '#465266', pillar: '#5b6678' },
    ruins: { floor: '#3e382b', floor2: '#443e30', hall: '#4b4434', wall: '#1c1912', wallTop: '#2f2a1e', wallEdge: '#5c523a', pillar: '#7a6e52' }
  };

  var WEAPONS = {
    club: { name: '棍棒', desc: 'Z 敲擊 X 無', color: '#b07a45' },
    sword: { name: '劍', desc: 'Z 斬擊可打回飛彈 X 擊暈', color: '#c8d6e8' },
    spear: { name: '長槍', desc: 'Z 長刺 X 突進', color: '#9fb0c0' },
    whip: { name: '長鞭', desc: 'Z 整圈抽打 X 擊飛', color: '#8a5530' }
  };
  var WEAPON_KEYS = ['club', 'sword', 'spear', 'whip'];

  var SHOP = {
    club: { name: '棍棒', desc: WEAPONS.club.desc },
    sword: { name: '劍', desc: WEAPONS.sword.desc },
    spear: { name: '長槍', desc: WEAPONS.spear.desc },
    whip: { name: '長鞭', desc: WEAPONS.whip.desc },
    attack: { name: '攻擊力 +1', desc: '武器傷害 +1' },
    armor: { name: '護甲', desc: '心 +1' },
    ropeBag: { name: '繩袋', desc: '捕獸繩 +1' }
  };
  var SHOP_KEYS = ['club', 'sword', 'spear', 'whip', 'attack', 'armor', 'ropeBag'];

  // ---------- 魔物本體(共用: 地下城、表演場、卡片、面板、說明頁) ----------
  // 原點 = 本體中心, r = 本體半徑。o: { dir, face: normal|angry|dizzy|weak, flash, flap, alpha }
  function colorsOf(key, flash) {
    var s = sp(key);
    if (flash) return { body: '#ffffff', dark: '#d8d8e0', light: '#ffffff' };
    return s;
  }

  function eyes(ctx, ex, ey, er, dir, face) {
    // 兩眼在 ex±, 朝 dir 偏
    var gap = er * 2.2;
    for (var i = -1; i <= 1; i += 2) {
      var cx = ex + i * gap * 0.5, cy = ey;
      if (face === 'dizzy') {
        ctx.strokeStyle = P.outline; ctx.lineWidth = Math.max(1.5, er * 0.45);
        ctx.beginPath();
        ctx.moveTo(cx - er, cy - er); ctx.lineTo(cx + er, cy + er);
        ctx.moveTo(cx + er, cy - er); ctx.lineTo(cx - er, cy + er);
        ctx.stroke();
        continue;
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(cx, cy, er, 0, TAU); ctx.fill();
      ctx.strokeStyle = P.outline; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = P.outline;
      ctx.beginPath(); ctx.arc(cx + dir * er * 0.35, cy + er * 0.1, er * 0.55, 0, TAU); ctx.fill();
      if (face === 'weak') { // 下垂眼皮
        ctx.fillStyle = 'rgba(40,30,60,0.85)';
        ctx.beginPath(); ctx.arc(cx, cy, er + 0.5, Math.PI, TAU); ctx.fill();
      }
      if (face === 'angry') { // 斜眉
        ctx.strokeStyle = P.outline; ctx.lineWidth = Math.max(2, er * 0.5); ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - i * er * 1.2, cy - er * 1.9);
        ctx.lineTo(cx + i * er * 0.9, cy - er * 1.0);
        ctx.stroke();
      }
    }
  }

  function outlineFill(ctx, fill, lw) {
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = lw || 2.5; ctx.strokeStyle = P.outline; ctx.stroke();
  }

  function creatureFire(ctx, r, c, dir, face) {
    // 尾巴
    ctx.lineCap = 'round';
    ctx.strokeStyle = P.outline; ctx.lineWidth = r * 0.34;
    ctx.beginPath(); ctx.moveTo(-dir * r * 0.4, r * 0.25);
    ctx.quadraticCurveTo(-dir * r * 1.0, r * 0.35, -dir * r * 0.88, -r * 0.3); ctx.stroke();
    ctx.strokeStyle = c.body; ctx.lineWidth = r * 0.22; ctx.stroke();
    // 腳
    ctx.fillStyle = c.dark;
    [-0.45, 0.35].forEach(function (fx) {
      ctx.beginPath(); ctx.ellipse(fx * r, r * 0.58, r * 0.16, r * 0.12, 0, 0, TAU); ctx.fill();
    });
    // 背上火冠
    ctx.fillStyle = c.light;
    for (var i = 0; i < 3; i++) {
      var bx = (-0.35 + i * 0.28) * r * dir;
      ctx.beginPath();
      ctx.moveTo(bx - r * 0.13, -r * 0.18);
      ctx.quadraticCurveTo(bx + dir * r * 0.05, -r * 0.62, bx + dir * r * 0.1, -r * 0.62);
      ctx.lineTo(bx + r * 0.13, -r * 0.18);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5; ctx.stroke();
    }
    // 身體
    ctx.beginPath(); ctx.ellipse(-dir * r * 0.05, r * 0.15, r * 0.66, r * 0.46, 0, 0, TAU);
    outlineFill(ctx, c.body);
    // 頭
    ctx.beginPath(); ctx.ellipse(dir * r * 0.5, -r * 0.08, r * 0.42, r * 0.36, 0, 0, TAU);
    outlineFill(ctx, c.body);
    // 肚斑
    ctx.fillStyle = c.light; ctx.globalAlpha *= 0.6;
    ctx.beginPath(); ctx.ellipse(-dir * r * 0.05, r * 0.3, r * 0.4, r * 0.18, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha /= 0.6;
    eyes(ctx, dir * r * 0.58, -r * 0.17, r * 0.12, dir, face);
  }

  function creatureWater(ctx, r, c, dir, face) {
    // 觸手
    ctx.lineCap = 'round';
    for (var i = 0; i < 4; i++) {
      var tx = (-0.45 + i * 0.3) * r;
      ctx.beginPath();
      ctx.moveTo(tx, r * 0.05);
      ctx.bezierCurveTo(tx - r * 0.15, r * 0.35, tx + r * 0.15, r * 0.55, tx - r * 0.05, r * 0.82);
      ctx.strokeStyle = P.outline; ctx.lineWidth = r * 0.17; ctx.stroke();
      ctx.strokeStyle = c.light; ctx.lineWidth = r * 0.09; ctx.stroke();
    }
    // 傘
    ctx.beginPath();
    ctx.moveTo(-r * 0.78, r * 0.1);
    ctx.bezierCurveTo(-r * 0.82, -r * 0.9, r * 0.82, -r * 0.9, r * 0.78, r * 0.1);
    for (var k = 0; k < 4; k++) {
      var x0 = r * 0.78 - k * r * 0.39;
      ctx.quadraticCurveTo(x0 - r * 0.195, r * 0.3, x0 - r * 0.39, r * 0.1);
    }
    ctx.closePath();
    outlineFill(ctx, c.body);
    ctx.fillStyle = c.light; ctx.globalAlpha *= 0.55;
    ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.42, r * 0.18, r * 0.1, -0.5, 0, TAU); ctx.fill();
    ctx.globalAlpha /= 0.55;
    eyes(ctx, dir * r * 0.08, -r * 0.18, r * 0.13, dir, face);
  }

  function creatureThunder(ctx, r, c, dir, face, flap) {
    var wing = Math.sin(flap || 0) * 0.35;
    // 翅膀
    for (var i = -1; i <= 1; i += 2) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.35, -r * 0.05);
      ctx.lineTo(i * r * 0.98, -r * (0.45 + wing));
      ctx.lineTo(i * r * 0.85, r * 0.05);
      ctx.lineTo(i * r * 0.98, r * 0.3);
      ctx.lineTo(i * r * 0.35, r * 0.3);
      ctx.closePath();
      outlineFill(ctx, c.dark, 2);
    }
    // 身體
    ctx.beginPath(); ctx.arc(0, r * 0.08, r * 0.58, 0, TAU);
    outlineFill(ctx, c.body);
    // 閃電冠
    ctx.beginPath();
    ctx.moveTo(-r * 0.1, -r * 0.45); ctx.lineTo(r * 0.12, -r * 0.88);
    ctx.lineTo(r * 0.05, -r * 0.62); ctx.lineTo(r * 0.28, -r * 0.7);
    ctx.lineTo(r * 0.12, -r * 0.42); ctx.closePath();
    outlineFill(ctx, c.light, 1.5);
    // 嘴
    ctx.beginPath();
    ctx.moveTo(dir * r * 0.45, r * 0.0); ctx.lineTo(dir * r * 0.82, r * 0.12); ctx.lineTo(dir * r * 0.45, r * 0.24);
    ctx.closePath(); outlineFill(ctx, '#f08a24', 1.5);
    eyes(ctx, dir * r * 0.15, -r * 0.1, r * 0.12, dir, face);
  }

  function creatureSpike(ctx, r, c, dir, face) {
    // 刺
    var n = 14;
    ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var a = i / n * TAU;
      var a1 = a - Math.PI / n, a2 = a + Math.PI / n;
      ctx.moveTo(Math.cos(a1) * r * 0.6, Math.sin(a1) * r * 0.6);
      ctx.lineTo(Math.cos(a) * r * 0.97, Math.sin(a) * r * 0.97);
      ctx.lineTo(Math.cos(a2) * r * 0.6, Math.sin(a2) * r * 0.6);
    }
    ctx.fillStyle = c.dark; ctx.fill();
    ctx.strokeStyle = P.outline; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.66, 0, TAU);
    outlineFill(ctx, c.body);
    // 臉
    ctx.beginPath(); ctx.ellipse(dir * r * 0.25, r * 0.12, r * 0.36, r * 0.3, 0, 0, TAU);
    ctx.fillStyle = c.light; ctx.fill();
    ctx.fillStyle = P.outline;
    ctx.beginPath(); ctx.arc(dir * r * 0.55, r * 0.15, r * 0.07, 0, TAU); ctx.fill();
    eyes(ctx, dir * r * 0.2, -r * 0.08, r * 0.11, dir, face);
  }

  function creatureStone(ctx, r, c, dir, face) {
    // 小翼
    for (var i = -1; i <= 1; i += 2) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.5, -r * 0.25);
      ctx.lineTo(i * r * 0.98, -r * 0.55);
      ctx.lineTo(i * r * 0.9, -r * 0.1);
      ctx.lineTo(i * r * 0.98, r * 0.2);
      ctx.lineTo(i * r * 0.5, r * 0.2);
      ctx.closePath(); outlineFill(ctx, c.dark, 2);
    }
    // 角
    for (var j = -1; j <= 1; j += 2) {
      ctx.beginPath();
      ctx.moveTo(j * r * 0.45, -r * 0.5); ctx.lineTo(j * r * 0.58, -r * 0.92); ctx.lineTo(j * r * 0.22, -r * 0.55);
      ctx.closePath(); outlineFill(ctx, c.light, 1.8);
    }
    // 方塊身體
    rr(ctx, -r * 0.62, -r * 0.62, r * 1.24, r * 1.3, r * 0.22);
    outlineFill(ctx, c.body, 3);
    // 裂紋
    ctx.strokeStyle = c.dark; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, r * 0.25); ctx.lineTo(-r * 0.2, r * 0.4); ctx.lineTo(-r * 0.25, r * 0.6);
    ctx.moveTo(r * 0.45, -r * 0.4); ctx.lineTo(r * 0.3, -r * 0.2);
    ctx.stroke();
    // 嘴
    ctx.fillStyle = c.dark; rr(ctx, -r * 0.28 + dir * r * 0.1, r * 0.22, r * 0.56, r * 0.14, 3); ctx.fill();
    eyes(ctx, dir * r * 0.1, -r * 0.15, r * 0.13, dir, face);
  }

  function creatureGhost(ctx, r, c, dir, face) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, r * 0.1);
    ctx.bezierCurveTo(-r * 0.75, -r * 0.95, r * 0.75, -r * 0.95, r * 0.7, r * 0.1);
    ctx.lineTo(r * 0.7, r * 0.7);
    for (var k = 0; k < 3; k++) {
      var x0 = r * 0.7 - k * r * 0.4667;
      ctx.quadraticCurveTo(x0 - r * 0.233, r * 0.45, x0 - r * 0.4667, r * 0.75);
    }
    ctx.closePath();
    outlineFill(ctx, c.body);
    ctx.fillStyle = c.light; ctx.globalAlpha *= 0.5;
    ctx.beginPath(); ctx.ellipse(-r * 0.28, -r * 0.4, r * 0.16, r * 0.1, -0.5, 0, TAU); ctx.fill();
    ctx.globalAlpha /= 0.5;
    eyes(ctx, dir * r * 0.1, -r * 0.15, r * 0.14, dir, face);
    ctx.fillStyle = c.dark;
    ctx.beginPath(); ctx.ellipse(dir * r * 0.12, r * 0.22, r * 0.12, r * 0.08, 0, 0, TAU); ctx.fill();
  }

  // 影子 + 本體
  function creature(ctx, key, r, o) {
    o = o || {};
    key = spKey(key);
    var dir = (N(o.dir, 1) < 0) ? -1 : 1;
    var c = colorsOf(key, o.flash);
    ctx.save();
    if (o.shadow !== false) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(0, r * 0.82, r * 0.7, r * 0.17, 0, 0, TAU); ctx.fill();
    }
    var face = o.face || 'normal';
    if (key === 'fire') creatureFire(ctx, r, c, dir, face);
    else if (key === 'water') creatureWater(ctx, r, c, dir, face);
    else if (key === 'thunder') creatureThunder(ctx, r, c, dir, face, o.flap);
    else if (key === 'spike') creatureSpike(ctx, r, c, dir, face);
    else if (key === 'stone') creatureStone(ctx, r, c, dir, face);
    else creatureGhost(ctx, r, c, dir, face);
    ctx.restore();
  }

  // 小頭像(卡片、面板、節目表): 圓底 + 本體
  function portrait(ctx, key, x, y, r, dim) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU);
    ctx.fillStyle = '#1a1626'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = sp(key).body; ctx.stroke();
    if (dim) ctx.globalAlpha *= 0.45;
    creature(ctx, key, r * 0.78, { shadow: false });
    ctx.restore();
  }

  // ---------- 節目卡圖示 ----------
  function cardIcon(ctx, card, x, y, s, dim) {
    var k = pick(card, CARD_KEYS, '');
    ctx.save();
    ctx.translate(x, y);
    if (dim) ctx.globalAlpha *= 0.4;
    if (!k) {
      ctx.setLineDash([4, 4]);
      rr(ctx, -s * 0.5, -s * 0.5, s, s, s * 0.18);
      ctx.strokeStyle = P.disabled; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      return;
    }
    var col = CARDS[k].color;
    rr(ctx, -s * 0.5, -s * 0.5, s, s, s * 0.18);
    ctx.fillStyle = col; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var u = s * 0.5;
    ctx.lineWidth = Math.max(2, s * 0.09);
    if (k === 'provoke') { // 粗上箭頭 + 怒紋
      ctx.beginPath();
      ctx.moveTo(0, -u * 0.7); ctx.lineTo(u * 0.5, -u * 0.05); ctx.lineTo(u * 0.2, -u * 0.05);
      ctx.lineTo(u * 0.2, u * 0.65); ctx.lineTo(-u * 0.2, u * 0.65); ctx.lineTo(-u * 0.2, -u * 0.05);
      ctx.lineTo(-u * 0.5, -u * 0.05); ctx.closePath(); ctx.fill();
    } else if (k === 'chill') { // 雪花
      for (var i = 0; i < 3; i++) {
        var a = i * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * u * 0.7, Math.sin(a) * u * 0.7);
        ctx.lineTo(-Math.cos(a) * u * 0.7, -Math.sin(a) * u * 0.7);
        ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, u * 0.18, 0, TAU); ctx.fill();
    } else if (k === 'rampage') { // >>
      for (var j = 0; j < 2; j++) {
        var ox = -u * 0.35 + j * u * 0.45;
        ctx.beginPath();
        ctx.moveTo(ox - u * 0.2, -u * 0.5); ctx.lineTo(ox + u * 0.25, 0); ctx.lineTo(ox - u * 0.2, u * 0.5);
        ctx.stroke();
      }
    } else if (k === 'rally') { // 四向內收箭頭 + 中心點
      ctx.beginPath(); ctx.arc(0, 0, u * 0.17, 0, TAU); ctx.fill();
      for (var q = 0; q < 4; q++) {
        var b = q * Math.PI / 2 + Math.PI / 4;
        var cx = Math.cos(b), cy = Math.sin(b);
        ctx.beginPath();
        ctx.moveTo(cx * u * 0.78, cy * u * 0.78); ctx.lineTo(cx * u * 0.38, cy * u * 0.38);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx * u * 0.38 + (-cy) * u * 0.14 + cx * u * 0.14, cy * u * 0.38 + cx * u * 0.14 + cy * u * 0.14);
        ctx.lineTo(cx * u * 0.38, cy * u * 0.38);
        ctx.lineTo(cx * u * 0.38 + cy * u * 0.14 + cx * u * 0.14, cy * u * 0.38 - cx * u * 0.14 + cy * u * 0.14);
        ctx.stroke();
      }
    } else { // encore: 星 + 3 點
      star(ctx, 0, -u * 0.12, u * 0.55); ctx.fill();
      for (var d = -1; d <= 1; d++) { ctx.beginPath(); ctx.arc(d * u * 0.32, u * 0.65, u * 0.1, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }

  // ---------- 武器圖示 ----------
  function weaponIcon(ctx, w, x, y, s) {
    w = pick(w, WEAPON_KEYS, 'club');
    ctx.save();
    ctx.translate(x, y); ctx.rotate(-Math.PI / 4);
    ctx.lineCap = 'round';
    var u = s * 0.5;
    function bar(len, wid, col) {
      ctx.strokeStyle = P.outline; ctx.lineWidth = wid + 3;
      ctx.beginPath(); ctx.moveTo(0, u * 0.9); ctx.lineTo(0, u * 0.9 - len); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = wid;
      ctx.beginPath(); ctx.moveTo(0, u * 0.9); ctx.lineTo(0, u * 0.9 - len); ctx.stroke();
    }
    if (w === 'club') {
      bar(u * 1.5, u * 0.22, '#7a5230');
      ctx.beginPath(); ctx.ellipse(0, -u * 0.45, u * 0.3, u * 0.45, 0, 0, TAU);
      outlineFill(ctx, WEAPONS.club.color, 2);
    } else if (w === 'sword') {
      bar(u * 0.5, u * 0.18, '#6b4a2a');
      ctx.fillStyle = '#d9a640'; ctx.fillRect(-u * 0.35, u * 0.36, u * 0.7, u * 0.12);
      ctx.beginPath(); ctx.moveTo(-u * 0.14, u * 0.36); ctx.lineTo(-u * 0.14, -u * 0.6);
      ctx.lineTo(0, -u * 0.9); ctx.lineTo(u * 0.14, -u * 0.6); ctx.lineTo(u * 0.14, u * 0.36); ctx.closePath();
      outlineFill(ctx, WEAPONS.sword.color, 2);
    } else if (w === 'spear') {
      bar(u * 1.5, u * 0.12, '#7a5230');
      ctx.beginPath(); ctx.moveTo(0, -u * 0.95); ctx.lineTo(u * 0.2, -u * 0.5); ctx.lineTo(-u * 0.2, -u * 0.5); ctx.closePath();
      outlineFill(ctx, WEAPONS.spear.color, 2);
    } else {
      bar(u * 0.45, u * 0.2, '#5a3a20');
      ctx.strokeStyle = P.outline; ctx.lineWidth = u * 0.16;
      ctx.beginPath(); ctx.moveTo(0, u * 0.45); ctx.bezierCurveTo(u * 0.8, 0, -u * 0.8, -u * 0.4, u * 0.3, -u * 0.9); ctx.stroke();
      ctx.strokeStyle = '#c08850'; ctx.lineWidth = u * 0.08; ctx.stroke();
    }
    ctx.restore();
  }

  function heartIcon(ctx, x, y, s, full) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(-s * 0.6, -s * 0.05, -s * 0.35, -s * 0.55, 0, -s * 0.22);
    ctx.bezierCurveTo(s * 0.35, -s * 0.55, s * 0.6, -s * 0.05, 0, s * 0.35);
    ctx.closePath();
    ctx.fillStyle = full ? P.heart : '#3a2a3a'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.restore();
  }

  function ropeIcon(ctx, x, y, s, full) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = P.outline; ctx.lineWidth = s * 0.22;
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.38, s * 0.3, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = full ? P.rope : '#4a4050'; ctx.lineWidth = s * 0.12; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.2, s * 0.15, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  function coinIcon(ctx, x, y, r) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = P.gold; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.strokeStyle = '#b8901a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  function repIcon(ctx, x, y, r) {
    ctx.save();
    star(ctx, x, y, r); ctx.fillStyle = P.rep; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.restore();
  }

  // 中性的「節目表」圖示(不屬任何一張卡)
  function stackIcon(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    rr(ctx, -s * 0.45, -s * 0.5, s * 0.9, s, s * 0.12);
    ctx.fillStyle = '#e8e2d4'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.fillStyle = '#6b6680';
    for (var i = 0; i < 3; i++) ctx.fillRect(-s * 0.3, -s * 0.3 + i * s * 0.25, s * 0.6, s * 0.1);
    ctx.restore();
  }

  function keycap(ctx, label, x, y, w) {
    w = w || 44;
    ctx.save();
    rr(ctx, x - w / 2, y - 22, w, 44, 8);
    ctx.fillStyle = '#e8e2d4'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.fillStyle = '#b9b2a2'; ctx.fillRect(x - w / 2 + 3, y + 14, w - 6, 5);
    text(ctx, label, x, y - 2, { size: 22, color: P.outline, stroke: false });
    ctx.restore();
  }

  function arrowKeys(ctx, x, y) {
    keycap(ctx, '↑', x, y - 24, 36);
    keycap(ctx, '←', x - 38, y + 22, 36);
    keycap(ctx, '↓', x, y + 22, 36);
    keycap(ctx, '→', x + 38, y + 22, 36);
  }

  // 選擇框(全遊戲同一個長相: 亮黃粗框 + 外暈)
  function cursorFrame(ctx, x, y, w, h, r) {
    ctx.save();
    var pulse = 0.6 + 0.4 * Math.sin(now() * 6);
    ctx.shadowColor = P.cursor; ctx.shadowBlur = 10 * pulse;
    rr(ctx, x + 2, y + 2, w - 4, h - 4, r);
    ctx.lineWidth = 4; ctx.strokeStyle = P.cursor; ctx.stroke();
    ctx.restore();
  }

  // ---------- Art ----------
  var Art = {
    canvas: { width: 720, height: 1280 },
    palette: P,

    drawBackground: function (ctx) {
      ctx.save();
      var g = ctx.createLinearGradient(0, 0, 0, 1280);
      g.addColorStop(0, P.bg2); g.addColorStop(1, P.bg);
      ctx.fillStyle = g; ctx.fillRect(0, 0, 720, 1280);
      ctx.fillStyle = '#0d0b13'; ctx.fillRect(0, 0, 720, 120);
      ctx.restore();
    },

    // ---------- 地下城 ----------
    drawTile: function (ctx, st) {
      st = O(st);
      var x = N(st.x), y = N(st.y);
      var dg = pick(st.dungeon, DUNGEON_KEYS, 'cave');
      var kind = pick(st.kind, ['wall', 'pillar', 'floor', 'lava', 'water'], 'floor');
      var room = pick(st.room, ['top', 'bottom', 'hall'], 'hall');
      var sk = SKIN[dg];
      var L = x - 30, T = y - 30;
      ctx.save();
      // 地板底(石柱、水、熔岩下面也先鋪)
      var checker = ((Math.floor(x / 60) + Math.floor(y / 60)) % 2 === 0);
      ctx.fillStyle = room === 'hall' ? sk.hall : (checker ? sk.floor : sk.floor2);
      ctx.fillRect(L, T, 60, 60);
      if (kind === 'floor' || kind === 'pillar') {
        ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1;
        ctx.strokeRect(L + 0.5, T + 0.5, 59, 59);
        if (dg === 'ruins') { // 石磚縫
          ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(L + 60, y); ctx.moveTo(x, T); ctx.lineTo(x, y);
          ctx.moveTo(L + 15, y); ctx.lineTo(L + 15, T + 60); ctx.stroke();
        } else if (dg === 'cliff') {
          ctx.beginPath(); ctx.moveTo(L + 10, T + 40); ctx.lineTo(L + 25, T + 32); ctx.lineTo(L + 32, T + 45); ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          ctx.beginPath(); ctx.arc(L + 18, T + 40, 4, 0, TAU); ctx.arc(L + 44, T + 18, 3, 0, TAU); ctx.fill();
        }
      }
      if (kind === 'wall') {
        ctx.fillStyle = sk.wall; ctx.fillRect(L, T, 60, 60);
        ctx.fillStyle = sk.wallTop; ctx.fillRect(L + 3, T + 3, 54, 40);
        ctx.fillStyle = sk.wallEdge; ctx.fillRect(L + 3, T + 3, 54, 4);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(L + 3, T + 23); ctx.lineTo(L + 57, T + 23); ctx.moveTo(x, T + 3); ctx.lineTo(x, T + 23);
        ctx.moveTo(L + 18, T + 23); ctx.lineTo(L + 18, T + 43); ctx.moveTo(L + 42, T + 23); ctx.lineTo(L + 42, T + 43); ctx.stroke();
      } else if (kind === 'pillar') {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(x + 4, y + 20, 24, 9, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = sk.wall; rr(ctx, L + 8, T + 14, 44, 40, 8); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x, T + 18, 24, 14, 0, 0, TAU);
        ctx.fillStyle = sk.pillar; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath(); ctx.ellipse(x - 7, T + 14, 9, 4, 0, 0, TAU); ctx.fill();
      } else if (kind === 'lava') {
        var gl = ctx.createRadialGradient(x, y, 4, x, y, 40);
        gl.addColorStop(0, '#ffb02e'); gl.addColorStop(1, '#d23a10');
        ctx.fillStyle = gl; ctx.fillRect(L + 2, T + 2, 56, 56);
        ctx.strokeStyle = '#6e1606'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(L + 6, T + 20); ctx.lineTo(L + 24, T + 28); ctx.lineTo(L + 30, T + 50);
        ctx.moveTo(L + 40, T + 6); ctx.lineTo(L + 36, T + 26); ctx.lineTo(L + 54, T + 38); ctx.stroke();
        var ph = now() * 2 + x * 0.1;
        ctx.fillStyle = '#ffe28a';
        ctx.beginPath(); ctx.arc(L + 16 + Math.sin(ph) * 2, T + 42, 3, 0, TAU); ctx.arc(L + 46, T + 16 + Math.cos(ph) * 2, 2.5, 0, TAU); ctx.fill();
        // 危險邊: 黑紅斜紋框
        ctx.strokeStyle = '#2a0a04'; ctx.lineWidth = 3; ctx.strokeRect(L + 1.5, T + 1.5, 57, 57);
      } else if (kind === 'water') {
        ctx.fillStyle = '#1d4f86'; ctx.fillRect(L, T, 60, 60);
        ctx.strokeStyle = 'rgba(160,210,255,0.45)'; ctx.lineWidth = 2;
        var wph = now() * 1.5 + y * 0.05;
        for (var i = 0; i < 3; i++) {
          var yy = T + 14 + i * 16 + Math.sin(wph + i) * 2;
          ctx.beginPath(); ctx.moveTo(L + 8, yy);
          ctx.quadraticCurveTo(L + 20, yy - 5, L + 30, yy); ctx.quadraticCurveTo(L + 40, yy + 5, L + 52, yy); ctx.stroke();
        }
      }
      if (st.nest && kind !== 'wall' && kind !== 'pillar') { // 巢: 草圈
        ctx.strokeStyle = '#a07a3a'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.ellipse(x, y + 4, 22, 13, 0, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#d2a85a'; ctx.lineWidth = 2;
        for (var k = 0; k < 8; k++) {
          var a = k / 8 * TAU;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(a) * 18, y + 4 + Math.sin(a) * 10);
          ctx.lineTo(x + Math.cos(a + 0.5) * 26, y + 4 + Math.sin(a + 0.5) * 15);
          ctx.stroke();
        }
      }
      ctx.restore();
    },

    drawTamer: function (ctx, st) {
      st = O(st);
      var x = N(st.x), y = N(st.y);
      var f = Math.round(N(st.facing, 0)); f = ((f % 8) + 8) % 8;
      var ang = -Math.PI / 2 + f * Math.PI / 4; // 0 上, 順時針
      var weapon = pick(st.weapon, WEAPON_KEYS, 'club');
      ctx.save();
      ctx.translate(x, y);
      if (st.blink) {
        var on = Math.floor(now() * 12) % 2 === 0;
        ctx.globalAlpha = on ? 0.35 : 0.85;
      }
      if (st.dashing) { // 突進: 無敵白外光 + 後方殘影
        ctx.save();
        ctx.globalAlpha *= 0.35;
        for (var i = 1; i <= 2; i++) {
          ctx.beginPath(); ctx.arc(-Math.cos(ang) * i * 5, -Math.sin(ang) * i * 5, 18, 0, TAU);
          ctx.fillStyle = P.mine; ctx.fill();
        }
        ctx.restore();
      }
      // 影子
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(0, 15, 16, 5, 0, 0, TAU); ctx.fill();
      // 武器(握在面向那側, 不超過 32)
      ctx.save();
      ctx.rotate(ang + Math.PI / 2);
      weaponIcon(ctx, weapon, 10, -12, 22);
      ctx.restore();
      // 身體(判定圓 r18 = 外框)
      ctx.beginPath(); ctx.arc(0, 0, 17, 0, TAU);
      ctx.fillStyle = P.tamer; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = P.outline; ctx.stroke();
      // 圍巾(玩家色)
      ctx.beginPath(); ctx.arc(0, 0, 17, ang + 2.2, ang + 4.1);
      ctx.lineWidth = 5; ctx.strokeStyle = P.mine; ctx.stroke();
      // 帽子
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU);
      ctx.fillStyle = '#5a4030'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
      // 面向鼻尖
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * 22, Math.sin(ang) * 22);
      ctx.lineTo(Math.cos(ang + 0.45) * 14, Math.sin(ang + 0.45) * 14);
      ctx.lineTo(Math.cos(ang - 0.45) * 14, Math.sin(ang - 0.45) * 14);
      ctx.closePath(); ctx.fillStyle = P.mine; ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
      if (st.lassoing) { // 手上一圈繩
        ropeIcon(ctx, -Math.cos(ang) * 4 + Math.cos(ang - Math.PI / 2) * 16, -Math.sin(ang) * 4 + Math.sin(ang - Math.PI / 2) * 16, 16, true);
      }
      if (st.dashing) {
        ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU);
        ctx.lineWidth = 2.5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      }
      ctx.restore();
    },

    drawWildMonster: function (ctx, st) {
      st = O(st);
      var key = spKey(st.species);
      var x = N(st.x), y = N(st.y);
      var r = key === 'stone' ? 38 : 30;
      var half = key === 'stone' ? 55 : 45;
      var dir = N(st.dir, 1) < 0 ? -1 : 1;
      var stunLeft = Math.max(0, N(st.stunLeft)), stunDur = N(st.stunDur, 2);
      var stunned = stunLeft > 0 || !!st.lassoed;
      var face = stunned ? 'dizzy' : (st.weak ? 'weak' : (st.casting ? 'angry' : 'normal'));
      var t = now();
      ctx.save();
      ctx.translate(x, y);
      // 急衝: 後方速度線
      if (st.dashing) {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (var i = -1; i <= 1; i++) {
          ctx.beginPath(); ctx.moveTo(-dir * (r + 2), i * 12); ctx.lineTo(-dir * (half - 2), i * 12); ctx.stroke();
        }
      }
      // 施法預警: 本體外一圈種類色脈動虛線
      if (st.casting && !stunned) {
        ctx.save();
        ctx.setLineDash([6, 5]);
        ctx.lineDashOffset = -t * 30;
        ctx.beginPath(); ctx.arc(0, 0, r + 6, 0, TAU);
        ctx.lineWidth = 3; ctx.strokeStyle = sp(key).light; ctx.stroke();
        ctx.restore();
      }
      creature(ctx, key, r, { dir: dir, face: face, flash: !!st.hit, flap: t * (st.dashing ? 30 : 12) });
      // 血條(本體下方), 30% 殘血刻度
      var hp = Math.max(0, N(st.hp)), mhp = Math.max(1, N(st.maxHp, 1));
      var fr = clamp(hp / mhp, 0, 1);
      var bw = r * 1.6, by = r + 6;
      ctx.fillStyle = '#1a1420'; rr(ctx, -bw / 2 - 2, by - 2, bw + 4, 8, 3); ctx.fill();
      ctx.fillStyle = st.weak ? '#ff6fa0' : '#7be07a';
      if (fr > 0) { rr(ctx, -bw / 2, by, bw * fr, 4, 2); ctx.fill(); }
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-bw / 2 + bw * 0.3 - 1, by - 2, 2, 8);
      // 殘血記號: 頭頂左上的裂心 + 汗滴
      if (st.weak) {
        var hx = -r * 0.85, hy = -r * 0.85;
        heartIcon(ctx, hx, hy, 18, true);
        ctx.strokeStyle = P.outline; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(hx, hy - 4); ctx.lineTo(hx - 3, hy); ctx.lineTo(hx + 2, hy + 2); ctx.lineTo(hx, hy + 6); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(r * 0.8, -r * 0.95);
        ctx.quadraticCurveTo(r * 0.98, -r * 0.6, r * 0.8, -r * 0.55);
        ctx.quadraticCurveTo(r * 0.62, -r * 0.6, r * 0.8, -r * 0.95);
        ctx.fillStyle = P.douse; ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
      }
      // 暈眩: 頭頂繞圈星星; 劍擊暈另畫剩餘弧
      if (stunned) {
        var sy = -r - 4;
        if (!st.lassoed && stunDur > 0) {
          var frac = clamp(stunLeft / stunDur, 0, 1);
          ctx.beginPath(); ctx.ellipse(0, sy, 20, 4, 0, -Math.PI / 2, -Math.PI / 2 + TAU * frac);
          ctx.lineWidth = 2; ctx.strokeStyle = P.cursor; ctx.stroke();
        }
        for (var s = 0; s < 3; s++) {
          var a = t * 4 + s * TAU / 3;
          star(ctx, Math.cos(a) * 18, sy + Math.sin(a) * 4, 5.5);
          ctx.fillStyle = '#fff36a'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = P.outline; ctx.stroke();
        }
      }
      ctx.restore();
    },

    drawCaptureRing: function (ctx, st) {
      st = O(st);
      var x = N(st.x), y = N(st.y);
      var p = ratio(st.t, st.dur);
      ctx.save();
      ctx.translate(x, y);
      var R = 42;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU);
      ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(16,12,22,0.75)'; ctx.stroke();
      if (p > 0) {
        ctx.beginPath(); ctx.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + TAU * p);
        ctx.lineWidth = 6; ctx.strokeStyle = P.mine; ctx.lineCap = 'round'; ctx.stroke();
      }
      text(ctx, '準備捕捉', 0, -R - 9, { size: 15, color: P.mine, maxW: 116 });
      ctx.restore();
    },

    drawLasso: function (ctx, st) {
      st = O(st);
      var x1 = N(st.x1), y1 = N(st.y1), x2 = N(st.x2), y2 = N(st.y2);
      var prog = clamp(N(st.progress), 0, 1);
      var tf = 1 - ratio(st.t, st.limit);      // 剩餘時間比例
      var tens = ratio(st.len, st.maxLen);     // 繃緊度
      ctx.save();
      // 繩: 越接近最大長度越直、越紅
      var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      var sag = (1 - tens) * 26;
      var col = tens > 0.85 ? P.danger : (tens > 0.65 ? P.amber : P.rope);
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my + sag, x2, y2);
      ctx.lineWidth = 6; ctx.strokeStyle = P.outline; ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke();
      if (tens > 0.85) {
        ctx.setLineDash([4, 6]);
        ctx.lineWidth = 1.5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        ctx.setLineDash([]);
      }
      // 繞圈進度環(魔物周圍)
      var R = 54;
      ctx.beginPath(); ctx.arc(x2, y2, R, 0, TAU);
      ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(16,12,22,0.7)'; ctx.stroke();
      if (prog > 0) {
        ctx.beginPath(); ctx.arc(x2, y2, R, -Math.PI / 2, -Math.PI / 2 + TAU * prog);
        ctx.lineWidth = 7; ctx.strokeStyle = P.mine; ctx.stroke();
      }
      // 時限: 環外細環, 剩餘越少越紅
      ctx.beginPath(); ctx.arc(x2, y2, R + 9, -Math.PI / 2, -Math.PI / 2 + TAU * tf);
      ctx.lineWidth = 3; ctx.strokeStyle = tf < 0.3 ? P.danger : '#e8e2d4'; ctx.stroke();
      // 繞行方向提示: 環上兩個小箭頭(朝順時針)
      for (var i = 0; i < 2; i++) {
        var a = now() * 1.5 + i * Math.PI;
        var ax = x2 + Math.cos(a) * R, ay = y2 + Math.sin(a) * R;
        var ta = a + Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(ax + Math.cos(ta) * 8, ay + Math.sin(ta) * 8);
        ctx.lineTo(ax + Math.cos(ta + 2.4) * 7, ay + Math.sin(ta + 2.4) * 7);
        ctx.lineTo(ax + Math.cos(ta - 2.4) * 7, ay + Math.sin(ta - 2.4) * 7);
        ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = P.outline; ctx.stroke();
      }
      ctx.restore();
    },

    drawHazard: function (ctx, st) {
      st = O(st);
      var kind = pick(st.kind, ['firering', 'waterball', 'thunder', 'quake', 'spike', 'wisp'], 'firering');
      var phase = pick(st.phase, ['warn', 'active', 'fly'], kind === 'waterball' || kind === 'spike' || kind === 'wisp' ? 'fly' : 'active');
      var x = N(st.x), y = N(st.y);
      var defR = { firering: 120, thunder: 70, quake: 0, waterball: 12, spike: 10, wisp: 14 }[kind];
      var R = Math.max(0, N(st.radius, defR));
      var p = ratio(st.t, st.dur);
      var ang = N(st.angle);
      var refl = !!st.reflected;
      ctx.save();
      ctx.translate(x, y);
      var colMap = { firering: P.fire, thunder: P.thunder, quake: '#c8b89a', waterball: P.water, spike: P.spike, wisp: P.ghost };
      var col = colMap[kind];

      if (kind === 'firering' || kind === 'thunder' || (kind === 'quake' && phase === 'warn')) {
        if (phase === 'warn') {
          // 預警: 虛線外框 + 由中心長大的填色, 填滿 = 生效
          ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU);
          ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
          ctx.save(); ctx.globalAlpha = 0.45;
          ctx.beginPath(); ctx.arc(0, 0, R * p, 0, TAU); ctx.fillStyle = col; ctx.fill();
          ctx.restore();
          ctx.setLineDash([10, 7]);
          ctx.beginPath(); ctx.arc(0, 0, R - 2, 0, TAU);
          ctx.lineWidth = 4; ctx.strokeStyle = P.outline; ctx.stroke();
          ctx.lineWidth = 2.5; ctx.strokeStyle = col; ctx.stroke();
          ctx.setLineDash([]);
          if (kind === 'thunder') { // 準星
            ctx.strokeStyle = col; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.moveTo(0, -14); ctx.lineTo(0, 14); ctx.stroke();
          }
        } else if (kind === 'firering') {
          var a1 = 1 - p * 0.6;
          ctx.globalAlpha = a1;
          var g = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R);
          g.addColorStop(0, '#ffd27a'); g.addColorStop(0.7, P.fire); g.addColorStop(1, '#a8200c');
          ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fillStyle = g; ctx.fill();
          ctx.lineWidth = 4; ctx.strokeStyle = '#5a1004'; ctx.stroke();
          // 火舌(在圓內)
          ctx.fillStyle = '#fff0b0';
          for (var i = 0; i < 10; i++) {
            var fa = i / 10 * TAU + now() * 2;
            var fx = Math.cos(fa) * R * 0.75, fy = Math.sin(fa) * R * 0.75;
            ctx.beginPath(); ctx.moveTo(fx - 6, fy + 6); ctx.quadraticCurveTo(fx, fy - 16, fx + 6, fy + 6); ctx.closePath(); ctx.fill();
          }
        } else { // 落雷 active
          ctx.globalAlpha = 1 - p;
          ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU);
          ctx.fillStyle = 'rgba(255,250,200,0.85)'; ctx.fill();
          ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-6, -R); ctx.lineTo(10, -R * 0.35); ctx.lineTo(-4, -R * 0.25); ctx.lineTo(8, R * 0.3);
          ctx.lineTo(-10, -R * 0.1); ctx.lineTo(2, -R * 0.2); ctx.lineTo(-14, -R * 0.75); ctx.closePath();
          ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#a08000'; ctx.stroke();
        }
      } else if (kind === 'quake') {
        // 震波: radius = 中線, 帶 = [R-15, R+15]
        var inner = Math.max(0, R - 15), outer = R + 15;
        ctx.globalAlpha = 1 - p * 0.3;
        ctx.beginPath(); ctx.arc(0, 0, outer, 0, TAU); ctx.arc(0, 0, inner, 0, TAU, true);
        ctx.fillStyle = '#b8a78a'; ctx.fill('evenodd');
        ctx.lineWidth = 3; ctx.strokeStyle = P.outline;
        ctx.beginPath(); ctx.arc(0, 0, outer, 0, TAU); ctx.stroke();
        if (inner > 0) { ctx.beginPath(); ctx.arc(0, 0, inner, 0, TAU); ctx.stroke(); }
        // 碎石裂紋
        ctx.strokeStyle = '#5a4e3c'; ctx.lineWidth = 2;
        for (var q = 0; q < 12; q++) {
          var qa = q / 12 * TAU;
          ctx.beginPath();
          ctx.moveTo(Math.cos(qa) * (R - 10), Math.sin(qa) * (R - 10));
          ctx.lineTo(Math.cos(qa + 0.05) * (R + 10), Math.sin(qa + 0.05) * (R + 10));
          ctx.stroke();
        }
      } else {
        // 投射物: 判定圓 = 本體圓; 被打回 = 玩家色(青)+ 白芯
        var bc = refl ? P.mine : col;
        var light = refl ? '#ffffff' : sp(kind === 'waterball' ? 'water' : kind === 'spike' ? 'spike' : 'ghost').light;
        var fade = (kind === 'wisp' && N(st.dur) > 0) ? (p > 0.8 ? 1 - (p - 0.8) / 0.2 * 0.6 : 1) : 1;
        ctx.globalAlpha = fade;
        ctx.rotate(ang);
        // 尾跡
        ctx.beginPath();
        ctx.moveTo(-R * 3, 0); ctx.lineTo(0, -R * 0.7); ctx.lineTo(0, R * 0.7); ctx.closePath();
        ctx.fillStyle = refl ? 'rgba(46,196,182,0.45)' : 'rgba(255,255,255,0.2)'; ctx.fill();
        if (kind === 'spike') {
          ctx.beginPath();
          ctx.moveTo(R * 1.0, 0); ctx.lineTo(-R * 0.9, -R * 0.55); ctx.lineTo(-R * 0.6, 0); ctx.lineTo(-R * 0.9, R * 0.55); ctx.closePath();
          ctx.fillStyle = bc; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
        } else if (kind === 'wisp') {
          ctx.beginPath();
          ctx.arc(0, 0, R, -Math.PI / 2, Math.PI / 2, false);
          ctx.quadraticCurveTo(-R * 1.4, R * 0.5, -R * 2.0, 0);
          ctx.quadraticCurveTo(-R * 1.4, -R * 0.5, 0, -R);
          ctx.closePath();
          ctx.fillStyle = bc; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
          ctx.beginPath(); ctx.arc(R * 0.1, 0, R * 0.45, 0, TAU); ctx.fillStyle = light; ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU);
          ctx.fillStyle = bc; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
          ctx.beginPath(); ctx.arc(R * 0.25, -R * 0.3, R * 0.35, 0, TAU); ctx.fillStyle = light; ctx.fill();
        }
        if (refl) {
          ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU);
          ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        }
      }
      ctx.restore();
    },

    drawWeaponFx: function (ctx, st) {
      st = O(st);
      var x = N(st.x), y = N(st.y);
      var weapon = pick(st.weapon, WEAPON_KEYS, 'club');
      var move = pick(st.move, ['normal', 'skill'], 'normal');
      var shape = pick(st.shape, ['arc', 'circle', 'line', 'dash'], 'arc');
      var ang = N(st.angle), spread = N(st.spread, Math.PI / 2), R = Math.max(0, N(st.radius, 70));
      var len = Math.max(0, N(st.length, 170)), wid = Math.max(0, N(st.width, 40));
      var p = ratio(st.t, st.dur);
      var alpha = 1 - p * 0.85;
      // 技能色: 劍擊暈 = 黃(暈眩星同色), 長鞭擊飛 = 白粗; 其餘 = 玩家青白
      var edge = (weapon === 'sword' && move === 'skill') ? P.cursor : '#ffffff';
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = alpha;
      if (shape === 'arc') {
        var a0 = ang - spread / 2, a1 = ang + spread / 2;
        // 掃過進度: 前緣從 a0 走到 a1
        var sweep = a0 + (a1 - a0) * Math.min(1, p * 2.2);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, a0, sweep); ctx.closePath();
        ctx.fillStyle = 'rgba(46,196,182,0.22)'; ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, R, a0, a1);
        ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(0, 0, R - 3, Math.max(a0, sweep - 0.7), sweep);
        ctx.lineWidth = move === 'skill' ? 6 : 4; ctx.lineCap = 'round'; ctx.strokeStyle = edge; ctx.stroke();
        if (weapon === 'sword' && move === 'skill') {
          for (var i = 0; i < 3; i++) {
            var sa = a0 + (a1 - a0) * (i + 0.5) / 3;
            star(ctx, Math.cos(sa) * R * 0.7, Math.sin(sa) * R * 0.7, 6);
            ctx.fillStyle = P.cursor; ctx.fill();
          }
        }
      } else if (shape === 'circle') {
        ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU);
        ctx.fillStyle = 'rgba(46,196,182,0.18)'; ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, R - 3, p * TAU * 1.5, p * TAU * 1.5 + 2.4);
        ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU);
        ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.stroke();
      } else if (shape === 'line') {
        ctx.rotate(ang);
        ctx.fillStyle = 'rgba(46,196,182,0.22)'; ctx.fillRect(0, -wid / 2, len, wid);
        ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.strokeRect(0, -wid / 2, len, wid);
        ctx.setLineDash([]);
        var tip = len * Math.min(1, p * 2.5);
        ctx.beginPath(); ctx.moveTo(Math.max(0, tip - 50), 0); ctx.lineTo(tip, 0);
        ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      } else { // dash 突進軌跡
        ctx.rotate(ang);
        for (var k = 0; k < 4; k++) {
          var kx = len * (k / 3) * Math.min(1, p * 1.5);
          ctx.globalAlpha = alpha * (0.25 + k * 0.15);
          ctx.beginPath(); ctx.arc(kx, 0, 18, 0, TAU);
          ctx.fillStyle = P.mine; ctx.fill();
        }
        ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(len, -18); ctx.moveTo(0, 18); ctx.lineTo(len, 18);
        ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      }
      ctx.restore();
    },

    // ---------- 選擇與布置 ----------
    drawDungeonCard: function (ctx, st) {
      st = O(st);
      var x = N(st.x), y = N(st.y);
      var dg = pick(st.dungeon, DUNGEON_KEYS, 'cave');
      var D = DUNGEONS[dg], sk = SKIN[dg];
      var open = !!st.open;
      var L = x - 300, T = y - 130;
      ctx.save();
      rr(ctx, L + 4, T + 4, 592, 252, 18);
      ctx.fillStyle = open ? sk.floor2 : '#211d2a'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = open ? sk.wallEdge : P.panelLine; ctx.stroke();
      // 上緣牆帶
      ctx.save(); rr(ctx, L + 4, T + 4, 592, 252, 18); ctx.clip();
      ctx.fillStyle = open ? sk.wallTop : '#2a2536'; ctx.fillRect(L, T, 600, 64);
      ctx.restore();
      text(ctx, D.name, L + 30, T + 36, { size: 34, align: 'left', color: open ? P.ink : P.inkDim });
      if (open) {
        text(ctx, '已開放', L + 570, T + 36, { size: 22, align: 'right', color: P.good });
      } else {
        // 鎖
        ctx.save(); ctx.translate(L + 556, T + 36);
        ctx.strokeStyle = P.inkDim; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, -6, 9, Math.PI, 0); ctx.stroke();
        rr(ctx, -13, -6, 26, 20, 4); ctx.fillStyle = P.inkDim; ctx.fill();
        ctx.restore();
      }
      // 兩種魔物
      for (var i = 0; i < 2; i++) {
        var mx = L + 110 + i * 190, my = T + 140;
        ctx.save();
        if (!open) ctx.globalAlpha = 0.55;
        portrait(ctx, D.mons[i], mx, my, 40);
        ctx.restore();
        text(ctx, sp(D.mons[i]).name, mx, my + 58, { size: 20, color: open ? P.ink : P.inkDim });
      }
      if (!open) {
        text(ctx, S(st.condition), L + 470, T + 150, { size: 20, color: P.amber, maxW: 220 });
      }
      if (st.selected) cursorFrame(ctx, L, T, 600, 260, 20);
      ctx.restore();
    },

    drawRosterCard: function (ctx, st) {
      st = O(st);
      var x = N(st.x), y = N(st.y);
      var key = spKey(st.species);
      var lv = clamp(Math.round(N(st.level)), 0, 3);
      var picked = !!st.picked;
      var L = x - 150, T = y - 100;
      ctx.save();
      rr(ctx, L + 4, T + 4, 292, 192, 16);
      ctx.fillStyle = picked ? '#2c3a3a' : P.panel; ctx.fill();
      ctx.lineWidth = picked ? 4 : 2; ctx.strokeStyle = picked ? P.mine : P.panelLine; ctx.stroke();
      ctx.save();
      if (!picked) ctx.globalAlpha = 0.7;
      ctx.translate(L + 80, T + 100);
      creature(ctx, key, 46, { dir: 1 });
      ctx.restore();
      text(ctx, sp(key).name, L + 210, T + 70, { size: 26, color: P.ink, maxW: 150 });
      text(ctx, 'Lv ' + lv, L + 210, T + 108, { size: 22, color: P.cursor });
      if (picked) {
        rr(ctx, L + 160, T + 132, 100, 38, 19);
        ctx.fillStyle = P.mine; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
        text(ctx, '上場', L + 210, T + 151, { size: 20, color: P.outline, stroke: false });
      }
      if (st.selected) cursorFrame(ctx, L, T, 300, 200, 18);
      ctx.restore();
    },

    drawPickerPanel: function (ctx, st) {
      st = O(st);
      var layer = pick(st.layer, ['card', 'target'], 'card');
      var opts = Array.isArray(st.options) ? st.options : [];
      var idx = Math.round(N(st.index));
      var L = 120, T = 240, W = 480, H = 80 + 70 * opts.length;
      ctx.save();
      ctx.fillStyle = 'rgba(8,6,12,0.55)'; ctx.fillRect(0, 120, 720, 1160); // 壓暗背後(面板開著 = 暫停選擇)
      rr(ctx, L, T, W, H, 16);
      ctx.fillStyle = P.panel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.panelLine; ctx.stroke();
      text(ctx, layer === 'card' ? '放哪張卡?' : '點名誰?', 360, T + 40, { size: 30, color: P.ink });
      for (var i = 0; i < opts.length; i++) {
        var o = O(opts[i]);
        var ry = T + 80 + 70 * i;
        var type = pick(o.type, ['card', 'monster', 'clear'], 'card');
        var ok = o.affordable !== false;
        ctx.save();
        rr(ctx, L + 8, ry + 4, W - 16, 62, 10);
        ctx.fillStyle = i === idx ? P.panelHi : '#231e35'; ctx.fill();
        if (!ok) ctx.globalAlpha = 0.45;
        if (type === 'card') {
          cardIcon(ctx, o.key, L + 46, ry + 35, 44);
          text(ctx, S(o.name), L + 82, ry + 22, { size: 22, align: 'left', color: P.ink, maxW: 260 });
          text(ctx, S(o.desc), L + 82, ry + 50, { size: 16, align: 'left', color: P.inkDim, weight: 'normal', maxW: 300 });
          coinIcon(ctx, L + W - 82, ry + 35, 10);
          text(ctx, S(N(o.cost)), L + W - 66, ry + 35, { size: 22, align: 'left', color: ok ? P.gold : P.danger });
        } else if (type === 'monster') {
          portrait(ctx, o.key, L + 46, ry + 35, 24);
          text(ctx, S(o.name), L + 82, ry + 35, { size: 24, align: 'left', color: P.ink, maxW: 360 });
        } else {
          ctx.save(); ctx.translate(L + 46, ry + 35);
          ctx.strokeStyle = P.inkDim; ctx.lineWidth = 4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(10, 10); ctx.moveTo(10, -10); ctx.lineTo(-10, 10); ctx.stroke();
          ctx.restore();
          text(ctx, S(o.name), L + 82, ry + 35, { size: 24, align: 'left', color: P.inkDim, maxW: 360 });
        }
        ctx.restore();
        if (i === idx) cursorFrame(ctx, L + 8, ry + 4, W - 16, 62, 10);
      }
      ctx.restore();
    },

    drawSetupInfo: function (ctx, st) {
      st = O(st);
      ctx.save();
      var L = 60, T = 1150;
      rr(ctx, L, T, 400, 120, 14);
      ctx.fillStyle = P.panel; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.panelLine; ctx.stroke();
      coinIcon(ctx, L + 36, T + 40, 14);
      text(ctx, '金幣 ' + Math.round(N(st.gold)), L + 60, T + 40, { size: 28, align: 'left', color: P.gold });
      stackIcon(ctx, L + 36, T + 86, 26);
      text(ctx, '已排 ' + clamp(Math.round(N(st.cards)), 0, 9) + ' 張', L + 60, T + 86, { size: 24, align: 'left', color: P.ink });
      ctx.restore();
    },

    drawTimelineSlot: function (ctx, st) {
      st = O(st);
      var x = N(st.x), y = N(st.y);
      var style = pick(st.style, ['row', 'mini'], 'row');
      var slot = clamp(Math.round(N(st.slot)), 0, 8);
      var card = pick(st.card, CARD_KEYS, '');
      var target = card ? pick(st.target, SPECIES_KEYS, '') : '';
      ctx.save();
      if (style === 'row') {
        var L = x - 300, T = y - 50;
        rr(ctx, L + 2, T + 2, 596, 96, 12);
        ctx.fillStyle = card ? '#2f2848' : '#221d31'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = P.panelLine; ctx.stroke();
        // 時段
        text(ctx, (slot * 5) + '~' + (slot * 5 + 5) + ' 秒', L + 24, y, { size: 22, align: 'left', color: P.inkDim });
        ctx.strokeStyle = P.panelLine; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(L + 140, T + 16); ctx.lineTo(L + 140, T + 84); ctx.stroke();
        if (card) {
          cardIcon(ctx, card, L + 186, y, 56);
          text(ctx, CARDS[card].name, L + 226, y, { size: 26, align: 'left', color: P.ink, maxW: 150 });
          if (target) {
            portrait(ctx, target, L + 430, y, 30);
            text(ctx, sp(target).name, L + 470, y, { size: 24, align: 'left', color: P.ink, maxW: 116 });
          }
        } else {
          text(ctx, '—', L + 340, y, { size: 30, color: P.disabled });
        }
        if (st.selected) cursorFrame(ctx, L, T, 600, 100, 14);
      } else {
        var Lm = x - 36, Tm = y - 50;
        var done = !!st.done, active = !!st.active;
        rr(ctx, Lm + 2, Tm + 2, 68, 96, 8);
        ctx.fillStyle = active ? '#3a3258' : '#1f1a2c'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = P.panelLine; ctx.stroke();
        if (card) {
          cardIcon(ctx, card, x, y - 18, 40, done && !active);
          if (target) portrait(ctx, target, x, y + 26, 17, done && !active);
        } else {
          ctx.fillStyle = P.disabled; ctx.fillRect(x - 10, y - 2, 20, 4);
        }
        if (done) { // 已過 / 已發動: 整格壓暗
          ctx.save(); rr(ctx, Lm + 2, Tm + 2, 68, 96, 8);
          ctx.fillStyle = active ? 'rgba(10,8,16,0.25)' : 'rgba(10,8,16,0.55)'; ctx.fill(); ctx.restore();
        }
        if (active) { // 進行中: 白粗框 + 下緣進行條記號
          rr(ctx, Lm + 2, Tm + 2, 68, 96, 8);
          ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x - 8, Tm + 2); ctx.lineTo(x + 8, Tm + 2); ctx.lineTo(x, Tm + 12); ctx.closePath();
          ctx.fillStyle = '#ffffff'; ctx.fill();
        }
      }
      ctx.restore();
    },

    drawCardFx: function (ctx, st) {
      st = O(st);
      var card = pick(st.card, CARD_KEYS, '');
      if (!card) return;
      var dur = N(st.dur, 0.8), t = N(st.t);
      if (dur <= 0) dur = 0.8;
      if (t >= dur || t < 0) return;
      var p = t / dur;
      var x = N(st.x), y = N(st.y);
      ctx.save();
      // 冒在怒氣條上方, 不蓋怒氣條(怒氣條在中心上方 50~60)
      var yy = y - 84 - p * 18;
      var sc = p < 0.15 ? 0.6 + p / 0.15 * 0.4 : 1;
      ctx.globalAlpha = p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1;
      ctx.translate(x, yy); ctx.scale(sc, sc);
      var label = CARDS[card].name + '!';
      ctx.font = 'bold 24px ' + FONT;
      var w = Math.max(80, ctx.measureText(label).width + 52);
      rr(ctx, -w / 2, -20, w, 40, 20);
      ctx.fillStyle = CARDS[card].color; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
      cardIcon(ctx, card, -w / 2 + 20, 0, 26);
      text(ctx, label, 14, 0, { size: 24, color: '#ffffff' });
      // 指向目標的尖角
      ctx.beginPath(); ctx.moveTo(-8, 19); ctx.lineTo(8, 19); ctx.lineTo(0, 30); ctx.closePath();
      ctx.fillStyle = CARDS[card].color; ctx.fill();
      ctx.restore();
    },

    // ---------- 表演場 ----------
    drawShowArena: function (ctx) {
      ctx.save();
      ctx.fillStyle = '#120f19'; ctx.fillRect(0, 120, 720, 1160);
      // 觀眾席
      [[130, 250], [1020, 1140]].forEach(function (b) {
        ctx.fillStyle = P.stands; ctx.fillRect(0, b[0], 720, b[1] - b[0]);
        ctx.fillStyle = '#2e2540';
        for (var i = 0; i < 3; i++) ctx.fillRect(0, b[0] + 12 + i * 38, 720, 6);
      });
      // 場地
      var g = ctx.createRadialGradient(360, 630, 60, 360, 630, 480);
      g.addColorStop(0, '#d2b27e'); g.addColorStop(1, P.sandDark);
      rr(ctx, 60, 270, 600, 720, 28); ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = '#5a4428'; ctx.stroke();
      // 活動範圍內縮 40 的淡線(魔物中心可到的邊界)
      ctx.setLineDash([10, 12]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(90,68,40,0.35)';
      rr(ctx, 100, 310, 520, 640, 18); ctx.stroke(); ctx.setLineDash([]);
      // 中央圓
      ctx.beginPath(); ctx.arc(360, 630, 90, 0, TAU);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(90,68,40,0.3)'; ctx.stroke();
      // 縮小節目表底
      rr(ctx, 4, 1152, 712, 116, 14); ctx.fillStyle = '#1a1526'; ctx.fill();
      ctx.restore();
    },

    drawShowMonster: function (ctx, st) {
      st = O(st);
      var key = spKey(st.species);
      var big = key === 'stone';
      var half = big ? 60 : 50;
      var r = big ? 34 : 28;
      var by = big ? 12 : 10; // 本體中心下移, 頭頂留給怒氣條
      var x = N(st.x), y = N(st.y);
      var dir = N(st.dir, 1) < 0 ? -1 : 1;
      var lv = clamp(Math.round(N(st.level)), 0, 3);
      var rage = clamp(N(st.rage), 0, 100);
      var redLow = clamp(N(st.redLow, 80), 0, 100);
      var marks = clamp(Math.round(N(st.marks)), 0, 4);
      var mode = pick(st.mode, ['roam', 'rampage', 'rally', 'hold', 'knock', 'charge', 'loose'], 'roam');
      var fx = pick(st.fx, ['none', 'ignited', 'doused'], 'none');
      var fxP = ratio(st.fxT, st.fxDur || 0.5);
      var perf = !!st.performing;
      var perfP = ratio(st.performT, st.performDur || 0.5);
      var wild = mode === 'charge' || mode === 'loose';
      var t = now();
      ctx.save();
      ctx.translate(x, y);

      // --- 地面記號(集合) ---
      if (mode === 'hold' || mode === 'rally') {
        ctx.save();
        ctx.beginPath(); ctx.ellipse(0, by + r * 0.82, r + 10, 9, 0, 0, TAU);
        if (mode === 'hold') { ctx.fillStyle = 'rgba(79,191,122,0.45)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.rally; ctx.stroke(); }
        else { ctx.setLineDash([5, 5]); ctx.lineWidth = 2.5; ctx.strokeStyle = P.rally; ctx.stroke(); }
        ctx.restore();
      }
      // --- 失控: 紅色鋸齒危險外圈(在 size 內) ---
      if (wild) {
        ctx.save();
        var jr = r + 6, n = 16;
        ctx.beginPath();
        for (var j = 0; j <= n * 2; j++) {
          var ja = j / (n * 2) * TAU + t * 2;
          var rad = (j % 2 === 0) ? jr + 5 : jr - 2;
          var px = Math.cos(ja) * rad, py = by + Math.sin(ja) * rad;
          if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,59,59,0.25)'; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = P.danger; ctx.stroke();
        ctx.restore();
      }
      // --- 表演: 外擴光環(紅區 = 金, 否則白) ---
      if (perf) {
        ctx.save();
        ctx.globalAlpha = 1 - perfP;
        ctx.beginPath(); ctx.arc(0, by, r + 2 + perfP * 6, 0, TAU);
        ctx.lineWidth = 5; ctx.strokeStyle = rage >= redLow ? P.gold : '#ffffff'; ctx.stroke();
        ctx.restore();
      }
      // --- 橫衝直撞: 身後橘色 >> ---
      if (mode === 'rampage') {
        ctx.save();
        ctx.strokeStyle = P.rampage; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (var k = 0; k < 2; k++) {
          var ox = -dir * (r + 4 + k * 9);
          ctx.beginPath();
          ctx.moveTo(ox - dir * 6, by - 10); ctx.lineTo(ox, by); ctx.lineTo(ox - dir * 6, by + 10);
          ctx.stroke();
        }
        ctx.restore();
      }

      // --- 本體 ---
      ctx.save();
      ctx.translate(0, by);
      var shake = 0;
      if (mode === 'charge' && N(st.chargeT) > 0) shake = Math.sin(t * 60) * 3;
      if (mode === 'knock') ctx.rotate(dir * -0.35);
      ctx.translate(shake, 0);
      var sc = perf ? 1 + Math.sin(perfP * Math.PI) * 0.1 : 1;
      ctx.scale(sc, sc);
      var face = wild || mode === 'rampage' || rage >= redLow ? 'angry' : 'normal';
      creature(ctx, key, r, { dir: dir, face: face, flap: t * (st.dashing ? 30 : 10) });
      if (wild) { // 紅色調
        ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, TAU); ctx.fillStyle = P.danger; ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      if (st.dashing) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (var d = -1; d <= 1; d++) {
          ctx.beginPath(); ctx.moveTo(-dir * (r + 2), by + d * 10); ctx.lineTo(-dir * (half - 2), by + d * 10); ctx.stroke();
        }
        ctx.restore();
      }
      if (mode === 'knock') { // 撞擊星
        ctx.save();
        star(ctx, -dir * (r * 0.7), by - r * 0.6, 10, 6);
        ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.restore();
      }

      // --- 點燃 / 澆熄: 方向相反(往上竄 / 往下滴), 帶深色襯邊 ---
      if (fx !== 'none' && fxP < 1) {
        ctx.save();
        ctx.globalAlpha = 1 - fxP * 0.7;
        for (var s = -1; s <= 1; s += 2) {
          var sx = s * (r + 6);
          if (fx === 'ignited') {
            for (var f = 0; f < 2; f++) {
              var fy = by + 4 - f * 16 - fxP * 14;
              ctx.beginPath();
              ctx.moveTo(sx - 6, fy + 8);
              ctx.quadraticCurveTo(sx - 6, fy - 4, sx, fy - 14);
              ctx.quadraticCurveTo(sx + 6, fy - 4, sx + 6, fy + 8);
              ctx.closePath();
              ctx.fillStyle = P.ignite; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = P.outline; ctx.stroke();
            }
          } else {
            for (var dd = 0; dd < 2; dd++) {
              var dy = by - 14 + dd * 16 + fxP * 14;
              ctx.beginPath();
              ctx.moveTo(sx, dy - 9);
              ctx.quadraticCurveTo(sx + 7, dy + 2, sx, dy + 6);
              ctx.quadraticCurveTo(sx - 7, dy + 2, sx, dy - 9);
              ctx.closePath();
              ctx.fillStyle = P.douse; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = P.outline; ctx.stroke();
            }
          }
        }
        ctx.restore();
      }

      // --- 怒氣條(頭頂, 90×12) ---
      var bw = 90, bh = 12, bx = -45, byTop = -half + 1;
      ctx.save();
      rr(ctx, bx, byTop, bw, bh, 4); ctx.fillStyle = '#1a1420'; ctx.fill();
      // 紅區底色(常駐標出 redLow~100)
      var rx = bx + bw * redLow / 100;
      ctx.fillStyle = 'rgba(255,59,59,0.35)'; ctx.fillRect(rx, byTop + 1, bx + bw - rx - 1, bh - 2);
      var fillW = bw * rage / 100;
      var fcol = rage >= redLow ? P.danger : (rage >= 50 ? P.amber : P.rageLow);
      if (fillW > 0) { ctx.fillStyle = fcol; ctx.fillRect(bx + 1, byTop + 2, Math.max(0, fillW - 2), bh - 4); }
      // 門檻 50 白刻度、紅區起點紅白雙線
      ctx.fillStyle = '#ffffff'; ctx.fillRect(bx + bw * 0.5 - 1, byTop, 2, bh);
      ctx.fillStyle = P.danger; ctx.fillRect(rx - 1.5, byTop, 3, bh);
      rr(ctx, bx, byTop, bw, bh, 4);
      ctx.lineWidth = 2; ctx.strokeStyle = (marks > 0 || wild) && Math.floor(t * 6) % 2 === 0 ? '#ffffff' : P.outline; ctx.stroke();
      ctx.restore();

      // --- 失控標記(怒氣條下方, 0~4 個) ---
      if (marks > 0 && !wild) {
        ctx.save();
        var ml = ratio(st.markLeft, st.markDur || 4);
        for (var m = 0; m < marks; m++) {
          var mx = -((marks - 1) * 14) / 2 + m * 14, my = byTop + bh + 9;
          ctx.beginPath(); ctx.moveTo(mx, my - 6); ctx.lineTo(mx + 6, my + 5); ctx.lineTo(mx - 6, my + 5); ctx.closePath();
          ctx.fillStyle = P.danger; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = P.outline; ctx.stroke();
          if (m === marks - 1) { // 最後一個: 下次 −1 的倒數, 剩多少就亮多少
            ctx.save(); ctx.clip();
            ctx.fillStyle = 'rgba(16,12,22,0.7)';
            ctx.fillRect(mx - 7, my - 7, 14, 13 * (1 - ml));
            ctx.restore();
          }
        }
        ctx.restore();
      }
      // --- 亂竄剩餘(本體下方細弧) ---
      if (mode === 'loose') {
        var lf = 1 - ratio(st.looseT, st.looseDur || 6);
        ctx.save();
        ctx.beginPath(); ctx.arc(0, by, r + 4, Math.PI * 0.25, Math.PI * 0.25 + Math.PI * 0.5 * lf);
        ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        ctx.restore();
      }
      // --- Lv(右下角) ---
      text(ctx, 'Lv' + lv, half - 2, half - 9, { size: 15, align: 'right', color: P.cursor });
      ctx.restore();
    },

    drawFence: function (ctx, st) {
      st = O(st);
      var x = N(st.x), y = N(st.y);
      var broken = !!st.broken;
      ctx.save();
      ctx.translate(x, y);
      if (!broken) {
        ctx.fillStyle = P.fence; ctx.fillRect(-50, -8, 100, 16);
        ctx.strokeStyle = P.outline; ctx.lineWidth = 2; ctx.strokeRect(-49, -7, 98, 14);
        ctx.fillStyle = '#b07a48'; ctx.fillRect(-48, -6, 96, 4);
        ctx.fillStyle = '#4a2e18';
        for (var i = -40; i <= 40; i += 20) ctx.fillRect(i - 2, -8, 4, 16);
      } else {
        // 斷成兩截, 中間空洞 + 紅色裂口
        [[-50, -16, -0.06], [16, 50, 0.06]].forEach(function (seg) {
          ctx.save();
          ctx.translate(seg[0] < 0 ? -48 : 48, 0); ctx.rotate(seg[2]);
          var w = seg[1] - seg[0];
          var sx = seg[0] < 0 ? 0 : -w;
          ctx.fillStyle = '#6a4426'; ctx.fillRect(sx, -4, w, 8);
          ctx.strokeStyle = P.outline; ctx.lineWidth = 2; ctx.strokeRect(sx, -4, w, 8);
          ctx.restore();
        });
        ctx.strokeStyle = P.danger; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-14, -5); ctx.lineTo(-6, 0); ctx.lineTo(-12, 5);
        ctx.moveTo(14, -5); ctx.lineTo(6, 0); ctx.lineTo(12, 5); ctx.stroke();
      }
      ctx.restore();
    },

    drawVisitor: function (ctx, st) {
      st = O(st);
      var x = N(st.x), y = N(st.y);
      var mode = pick(st.mode, ['watch', 'scared', 'empty'], 'watch');
      var side = pick(st.side, ['top', 'bottom'], 'top');
      var shirts = ['#e07a5f', '#81b29a', '#f2cc8f', '#6d9dc5', '#c77dff', '#f4a261'];
      var shirt = shirts[Math.abs(Math.round(x / 100)) % shirts.length];
      ctx.save();
      ctx.translate(x, y);
      // 座位(永遠在)
      rr(ctx, -26, 22, 52, 20, 5); ctx.fillStyle = '#4a3c60'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
      if (mode === 'empty') {
        ctx.setLineDash([4, 4]); ctx.strokeStyle = P.disabled;
        ctx.beginPath(); ctx.arc(0, -8, 14, 0, TAU); ctx.stroke();
        ctx.restore();
        return;
      }
      var face = side === 'top' ? 1 : -1; // 上排面向下(場地), 下排面向上
      if (mode === 'scared') {
        ctx.rotate(0.12 * (Math.round(x / 100) % 2 ? 1 : -1));
        ctx.translate(0, -3 + Math.sin(now() * 20) * 1.5);
      }
      // 身體
      rr(ctx, -15, 0, 30, 30, 10); ctx.fillStyle = mode === 'scared' ? '#8a8496' : shirt; ctx.fill();
      ctx.lineWidth = 2; ctx.stroke();
      // 手
      ctx.strokeStyle = P.outline; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath();
      if (mode === 'scared') { ctx.moveTo(-13, 4); ctx.lineTo(-22, -22); ctx.moveTo(13, 4); ctx.lineTo(22, -22); }
      else { ctx.moveTo(-13, 6); ctx.lineTo(-20, 18); ctx.moveTo(13, 6); ctx.lineTo(20, 18); }
      ctx.stroke();
      // 頭
      ctx.beginPath(); ctx.arc(0, -14, 14, 0, TAU);
      ctx.fillStyle = '#f1d3b3'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
      ctx.fillStyle = P.outline;
      if (mode === 'scared') {
        ctx.beginPath(); ctx.arc(-5, -16, 3, 0, TAU); ctx.arc(5, -16, 3, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, -7, 4, 5, 0, 0, TAU); ctx.fill();
        text(ctx, '!', 15, -28, { size: 17, color: P.danger });
      } else {
        ctx.beginPath(); ctx.arc(-5, -14 + face * 2, 2, 0, TAU); ctx.arc(5, -14 + face * 2, 2, 0, TAU); ctx.fill();
      }
      ctx.restore();
    },

    // ---------- 商店 / 按鈕 / 飄字 / 結算 ----------
    drawShopItem: function (ctx, st) {
      st = O(st);
      var x = N(st.x), y = N(st.y);
      var item = pick(st.item, SHOP_KEYS, 'attack');
      var info = SHOP[item];
      var isWeapon = WEAPON_KEYS.indexOf(item) >= 0;
      var owned = !!st.owned, eq = !!st.equipped, ok = !!st.affordable;
      var L = x - 300, T = y - 55;
      ctx.save();
      rr(ctx, L + 2, T + 2, 596, 106, 14);
      ctx.fillStyle = eq ? '#283a3a' : P.panel; ctx.fill();
      ctx.lineWidth = eq ? 3 : 2; ctx.strokeStyle = eq ? P.mine : P.panelLine; ctx.stroke();
      // 圖示
      ctx.save(); ctx.translate(L + 55, y);
      ctx.beginPath(); ctx.arc(0, 0, 36, 0, TAU); ctx.fillStyle = '#1a1626'; ctx.fill();
      if (isWeapon) weaponIcon(ctx, item, 0, 0, 52);
      else if (item === 'attack') { weaponIcon(ctx, 'sword', -4, 2, 44); text(ctx, '+', 18, -16, { size: 26, color: P.good }); }
      else if (item === 'armor') heartIcon(ctx, 0, 2, 44, true);
      else ropeIcon(ctx, 0, 0, 52, true);
      ctx.restore();
      text(ctx, info.name, L + 110, y - 20, { size: 26, align: 'left', color: P.ink, maxW: 260 });
      text(ctx, info.desc, L + 110, y + 20, { size: 18, align: 'left', color: P.inkDim, weight: 'normal', maxW: 300 });
      if (!isWeapon && N(st.level) > 0) {
        text(ctx, '已買 ' + Math.round(N(st.level)), L + 420, y - 22, { size: 16, align: 'center', color: P.inkDim });
      }
      // 右側: 價格 / 已擁有 / 裝備中
      if (isWeapon && owned) {
        if (eq) {
          rr(ctx, L + 470, y - 18, 110, 36, 18); ctx.fillStyle = P.mine; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
          text(ctx, '裝備中', L + 525, y, { size: 20, color: P.outline, stroke: false });
        } else {
          text(ctx, '已擁有', L + 525, y, { size: 22, color: P.ink });
        }
      } else {
        coinIcon(ctx, L + 490, y, 13);
        text(ctx, String(Math.round(N(st.cost))), L + 510, y, { size: 28, align: 'left', color: ok ? P.gold : P.danger });
      }
      if (st.selected) cursorFrame(ctx, L, T, 600, 110, 16);
      ctx.restore();
    },

    drawButton: function (ctx, st) {
      st = O(st);
      var x = N(st.x), y = N(st.y), w = Math.max(0, N(st.w, 200)), h = Math.max(0, N(st.h, 80));
      ctx.save();
      rr(ctx, x + 2, y + 2, w - 4, h - 4, Math.min(20, h / 3));
      ctx.fillStyle = st.selected ? P.mine : '#2c4a4a'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
      text(ctx, S(st.label), x + w / 2, y + h / 2, { size: Math.min(34, h * 0.4), color: st.selected ? P.outline : P.ink, stroke: !st.selected, maxW: w - 20 });
      if (st.selected) cursorFrame(ctx, x, y, w, h, Math.min(20, h / 3));
      ctx.restore();
    },

    drawFloatText: function (ctx, st) {
      st = O(st);
      var kind = pick(st.kind, ['gold', 'redGold', 'chain', 'repDown', 'capture', 'levelUp', 'coin20', 'fizzle'], 'gold');
      var dur = N(st.dur, 1); if (dur <= 0) dur = 1;
      var t = N(st.t);
      if (t < 0 || t >= dur) return;
      var p = t / dur;
      var x = N(st.x), y = N(st.y);
      var str = S(st.text);
      var cfg = {
        gold: { c: P.gold, s: 22, dy: -40 },
        redGold: { c: P.gold, s: 28, dy: -50, sc: P.danger },
        chain: { c: '#ffffff', s: 30, dy: -56, sc: '#c2410c' },
        repDown: { c: P.rep, s: 24, dy: 30 },
        capture: { c: P.good, s: 30, dy: -40 },
        levelUp: { c: P.mine, s: 26, dy: -44 },
        coin20: { c: P.gold, s: 26, dy: -40 },
        fizzle: { c: '#c8c4d4', s: 22, dy: -14 }
      }[kind];
      ctx.save();
      ctx.globalAlpha = p > 0.6 ? 1 - (p - 0.6) / 0.4 : 1;
      var ease = 1 - Math.pow(1 - p, 2);
      var xx = x + (kind === 'fizzle' ? Math.sin(p * 20) * 4 : 0);
      var yy = y + cfg.dy * ease;
      var pop = p < 0.12 ? 0.7 + p / 0.12 * 0.3 : 1;
      ctx.translate(xx, yy); ctx.scale(pop, pop);
      text(ctx, str, 0, 0, { size: cfg.s, color: cfg.c, strokeColor: cfg.sc || P.outline, strokeW: cfg.sc ? 7 : undefined });
      ctx.font = 'bold ' + cfg.s + 'px ' + FONT;
      var hw = ctx.measureText(str).width / 2;
      if (kind === 'capture') { // 打勾
        ctx.strokeStyle = P.outline; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-hw - 34, 0); ctx.lineTo(-hw - 24, 10); ctx.lineTo(-hw - 8, -12); ctx.stroke();
        ctx.strokeStyle = P.good; ctx.lineWidth = 4; ctx.stroke();
      } else if (kind === 'levelUp') {
        arrowLine(ctx, [[-hw - 18, 12], [-hw - 18, -12]], P.mine, 4, 12);
      } else if (kind === 'repDown') {
        repIcon(ctx, -hw - 16, 0, 11);
      } else if (kind === 'gold' || kind === 'redGold' || kind === 'coin20' || kind === 'chain') {
        coinIcon(ctx, -hw - 16, 0, 10);
      }
      ctx.restore();
    },

    drawResultPanel: function (ctx, st) {
      st = O(st);
      var roster = Array.isArray(st.roster) ? st.roster : [];
      var stars = clamp(Math.round(N(st.stars)), 0, 3);
      ctx.save();
      ctx.fillStyle = 'rgba(8,6,12,0.7)'; ctx.fillRect(0, 0, 720, 1280);
      rr(ctx, 60, 140, 600, 1000, 24);
      ctx.fillStyle = P.panel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.panelLine; ctx.stroke();
      text(ctx, '7 天結束', 360, 210, { size: 42, color: P.ink });
      // 星數
      for (var i = 0; i < 3; i++) {
        var sx = 240 + i * 120;
        star(ctx, sx, 320, 46);
        ctx.fillStyle = i < stars ? P.gold : '#2a2438'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = P.outline; ctx.stroke();
      }
      var rows = [
        ['名聲', Math.round(N(st.rep)), P.rep, 'rep'],
        ['賺得金幣', Math.round(N(st.goldEarned)), P.gold, 'gold'],
        ['最長連鎖', Math.round(N(st.bestChain)) + ' 段', P.ink, '']
      ];
      for (var r = 0; r < rows.length; r++) {
        var ry = 440 + r * 80;
        rr(ctx, 110, ry - 32, 500, 64, 12); ctx.fillStyle = '#231e35'; ctx.fill();
        if (rows[r][3] === 'rep') repIcon(ctx, 146, ry, 16);
        else if (rows[r][3] === 'gold') coinIcon(ctx, 146, ry, 14);
        text(ctx, rows[r][0], 176, ry, { size: 26, align: 'left', color: P.inkDim });
        text(ctx, String(rows[r][1]), 580, ry, { size: 34, align: 'right', color: rows[r][2] });
      }
      text(ctx, '陣容', 360, 708, { size: 24, color: P.inkDim });
      var n = Math.min(6, roster.length);
      for (var k = 0; k < n; k++) {
        var it = O(roster[k]);
        var col = k % 3, row = Math.floor(k / 3);
        var cx = 200 + col * 160, cy = 790 + row * 140;
        portrait(ctx, it.species, cx, cy, 42);
        text(ctx, sp(it.species).name + ' Lv' + clamp(Math.round(N(it.level)), 0, 3), cx, cy + 60, { size: 18, color: P.ink, maxW: 150 });
      }
      text(ctx, '按 Z 重來', 360, 1090, { size: 30, color: P.cursor });
      ctx.restore();
    },

    drawHud: function (ctx, st) {
      st = O(st);
      var phase = pick(st.phase, ['guide', 'select', 'dungeon', 'setup1', 'setup2', 'show', 'shop', 'result'], 'select');
      if (phase === 'guide' || phase === 'result') return; // 說明頁與結算的字都在各自面板裡
      ctx.save();
      ctx.fillStyle = '#0d0b13'; ctx.fillRect(0, 0, 720, 120);
      ctx.fillStyle = P.panelLine; ctx.fillRect(0, 118, 720, 2);
      // 第 1 列: 天數 / 金幣 / 名聲 / 計時
      var day = Math.round(N(st.day, 1)), dmax = Math.round(N(st.dayMax, 7));
      text(ctx, '第 ' + day + '/' + dmax + ' 天', 16, 24, { size: 22, align: 'left', color: P.ink });
      coinIcon(ctx, 182, 24, 12);
      text(ctx, String(Math.round(N(st.gold))), 200, 24, { size: 24, align: 'left', color: P.gold });
      repIcon(ctx, 312, 24, 13);
      text(ctx, String(Math.round(N(st.rep))), 330, 24, { size: 24, align: 'left', color: P.rep });
      var tmax = N(st.timeMax), tleft = Math.max(0, N(st.timeLeft));
      if (tmax > 0) {
        var low = tleft <= 10;
        text(ctx, Math.ceil(tleft) + ' 秒', 704, 24, { size: 26, align: 'right', color: low ? P.danger : P.ink });
        // 細時間條(HUD 底線上)
        ctx.fillStyle = low ? P.danger : '#6a6288';
        ctx.fillRect(0, 116, 720 * clamp(tleft / tmax, 0, 1), 4);
      }
      // 第 2 列(只在地下城): 心 / 繩 / 武器 + X 冷卻 / 地下城名
      if (phase === 'dungeon') {
        var mh = clamp(Math.round(N(st.maxHearts, 5)), 0, 99), h = clamp(Math.round(N(st.hearts)), 0, mh);
        var rx0;
        if (mh <= 8) {
          for (var i = 0; i < mh; i++) heartIcon(ctx, 26 + i * 28, 60, 24, i < h);
          rx0 = 40 + mh * 28;
        } else { // 心太多: 圖示 + 數字
          heartIcon(ctx, 26, 60, 24, h > 0);
          text(ctx, h + '/' + mh, 44, 60, { size: 22, align: 'left', color: P.heart });
          rx0 = 140;
        }
        var rmax = clamp(Math.round(N(st.ropeMax, 3)), 0, 99), rp = clamp(Math.round(N(st.ropes)), 0, rmax);
        if (rmax <= 5) {
          for (var k = 0; k < rmax; k++) ropeIcon(ctx, rx0 + k * 26, 60, 22, k < rp);
        } else {
          ropeIcon(ctx, rx0, 60, 22, rp > 0);
          text(ctx, rp + '/' + rmax, rx0 + 16, 60, { size: 22, align: 'left', color: P.rope });
        }
        // 武器 + X 冷卻
        var wx = 520, wy = 60;
        ctx.beginPath(); ctx.arc(wx, wy, 19, 0, TAU); ctx.fillStyle = '#1a1626'; ctx.fill();
        weaponIcon(ctx, st.weapon, wx, wy, 30);
        var xmax = N(st.xCdMax), xl = Math.max(0, N(st.xCdLeft));
        rr(ctx, wx + 26, wy - 16, 32, 32, 6);
        if (xmax <= 0) {
          ctx.fillStyle = '#2a2438'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.disabled; ctx.stroke();
          text(ctx, 'X', wx + 42, wy, { size: 18, color: P.disabled });
        } else {
          var ready = xl <= 0;
          ctx.fillStyle = ready ? P.mine : '#2a2438'; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
          if (!ready) { // 已恢復的部分由下往上填青
            var f = 1 - clamp(xl / xmax, 0, 1);
            ctx.save(); rr(ctx, wx + 26, wy - 16, 32, 32, 6); ctx.clip();
            ctx.fillStyle = 'rgba(46,196,182,0.45)'; ctx.fillRect(wx + 26, wy + 16 - 32 * f, 32, 32 * f);
            ctx.restore();
          }
          text(ctx, 'X', wx + 42, wy, { size: 18, color: ready ? P.outline : P.ink, stroke: !ready });
        }
        var dg = pick(st.dungeon, DUNGEON_KEYS, '');
        if (dg) text(ctx, DUNGEONS[dg].name, 704, 60, { size: 20, align: 'right', color: P.inkDim });
      }
      // 第 3 列: 訊息
      var msg = S(st.message);
      if (msg) {
        var important = msg.indexOf('站住') >= 0 || msg.indexOf('繞牠') >= 0;
        text(ctx, msg, 360, phase === 'dungeon' ? 96 : 76, { size: important ? 26 : 22, color: important ? P.mine : P.ink, maxW: 690 });
      }
      ctx.restore();
    },

    // ---------- 說明頁 ----------
    drawGuidePage: function (ctx, st) {
      st = O(st);
      var page = clamp(Math.round(N(st.page)), 0, 4);
      var bx = N(st.x), by = N(st.y), bw = N(st.w, 720), bh = N(st.h, 1280);
      if (bw <= 0 || bh <= 0) return;
      var s = Math.min(bw / 720, bh / 1280);
      ctx.save();
      ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
      ctx.translate(bx + (bw - 720 * s) / 2, by + (bh - 1280 * s) / 2);
      ctx.scale(s, s);
      Art.drawBackground(ctx);
      var titles = ['地下城', '收服', '排節目', '紅區', '目標'];
      var lines = ['方向鍵走, Z 攻擊, X 武器技', '殘血時站上去, 再繞牠一圈', '排好節目表, 時間到就點名', '紅區最賺, 標記滿 5 個就失控', '7 天內賺到越多名聲越好'];
      text(ctx, '怪獸節目表', 360, 48, { size: 26, color: P.inkDim });
      text(ctx, titles[page], 360, 112, { size: 46, color: P.ink });
      text(ctx, lines[page], 360, 178, { size: 28, color: P.cursor, maxW: 680 });
      ctx.save();
      GUIDE[page](ctx);
      ctx.restore();
      // 頁碼點
      for (var i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.arc(360 - 60 + i * 30, 1170, i === page ? 9 : 6, 0, TAU);
        ctx.fillStyle = i === page ? P.cursor : P.disabled; ctx.fill();
      }
      text(ctx, page === 4 ? '按 Z 開始' : '按 Z 繼續', 360, 1228, { size: 26, color: P.ink });
      ctx.restore();
    }
  };

  // ---------- 說明頁示意圖(參考座標 720×1280, 圖區 y 220~1140) ----------
  function sub(ctx, tx, ty, sc, fn) {
    ctx.save(); ctx.translate(tx, ty); ctx.scale(sc, sc); fn(); ctx.restore();
  }
  function tiles(ctx, dg, cols, rows, kindAt) {
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var k = kindAt ? kindAt(c, r) : 'floor';
      Art.drawTile(ctx, { x: c * 60 + 30, y: r * 60 + 30, dungeon: dg, kind: k, room: 'top', nest: false });
    }
  }
  function frame(ctx, x, y, w, h) {
    ctx.save(); rr(ctx, x, y, w, h, 16);
    ctx.lineWidth = 4; ctx.strokeStyle = P.panelLine; ctx.stroke(); ctx.restore();
  }
  function bigX(ctx, x, y, s) {
    ctx.save();
    ctx.lineCap = 'round';
    for (var pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass ? P.danger : P.outline; ctx.lineWidth = pass ? 9 : 15;
      ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke();
    }
    ctx.restore();
  }

  var GUIDE = [
    // 1 地下城
    function (ctx) {
      var ox = 60, oy = 280, sc = 1.0; // 10 × 13 格的局部 → 600×780
      sub(ctx, ox, oy, sc, function () {
        ctx.save(); rr(ctx, 0, 0, 600, 780, 18); ctx.clip();
        tiles(ctx, 'cave', 10, 13, function (c, r) {
          if (r === 0 || c === 0) return 'wall';
          if ((c === 8 || c === 9) && r === 11) return 'water';
          if (c === 9 && r === 1) return 'lava';
          return 'floor';
        });
        // 火圈預警: 施放的那隻火蜥蜴在中心
        Art.drawHazard(ctx, { x: 400, y: 230, kind: 'firering', phase: 'warn', radius: 120, t: 0.3, dur: 0.5 });
        Art.drawWildMonster(ctx, { x: 400, y: 230, species: 'fire', hp: 10, maxHp: 10, casting: true, dir: -1, stunLeft: 0, stunDur: 2 });
        // 馴獸師朝右敲中另一隻
        Art.drawWildMonster(ctx, { x: 245, y: 530, species: 'fire', hp: 6, maxHp: 10, hit: true, dir: -1, stunLeft: 0, stunDur: 2 });
        Art.drawWeaponFx(ctx, { x: 190, y: 530, weapon: 'club', move: 'normal', shape: 'arc', angle: 0, spread: 100 * Math.PI / 180, radius: 70, t: 0.12, dur: 0.2 });
        Art.drawTamer(ctx, { x: 190, y: 530, facing: 2, weapon: 'club' });
        // 移動箭頭繞開火圈(全程在半徑 120 外)
        arrowLine(ctx, [[160, 500], [120, 330], [200, 140], [300, 110]], P.mine, 6, 18);
        ctx.restore();
        frame(ctx, 0, 0, 600, 780);
      });
      // 鍵帽貼在動作旁
      arrowKeys(ctx, 110, 420);
      keycap(ctx, 'Z', 200, 745);
    },
    // 2 收服
    function (ctx) {
      // 左: 準備捕捉
      sub(ctx, 30, 280, 1, function () {
        ctx.save(); rr(ctx, 0, 0, 320, 440, 18); ctx.clip();
        tiles(ctx, 'cave', 6, 8);
        Art.drawWildMonster(ctx, { x: 160, y: 250, species: 'water', hp: 2, maxHp: 7, weak: true, dir: 1, stunLeft: 0, stunDur: 2 });
        Art.drawTamer(ctx, { x: 175, y: 275, facing: 0, weapon: 'club' });
        Art.drawCaptureRing(ctx, { x: 160, y: 250, t: 0.4, dur: 0.8 });
        ctx.restore();
        frame(ctx, 0, 0, 320, 440);
      });
      arrowLine(ctx, [[352, 500], [388, 500]], '#ffffff', 5, 14);
      // 右: 套索繞圈
      sub(ctx, 370, 280, 1, function () {
        ctx.save(); rr(ctx, 0, 0, 320, 440, 18); ctx.clip();
        tiles(ctx, 'cave', 6, 8);
        Art.drawWildMonster(ctx, { x: 160, y: 230, species: 'water', hp: 2, maxHp: 7, weak: true, lassoed: true, dir: 1, stunLeft: 0, stunDur: 2 });
        // 繞行路線(虛線圓 + 箭頭)
        ctx.save(); ctx.setLineDash([10, 8]);
        ctx.beginPath(); ctx.arc(160, 230, 110, -Math.PI * 0.1, Math.PI * 1.55);
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.stroke(); ctx.restore();
        var ea = Math.PI * 1.55;
        arrowLine(ctx, [[160 + Math.cos(ea - 0.15) * 110, 230 + Math.sin(ea - 0.15) * 110], [160 + Math.cos(ea) * 110, 230 + Math.sin(ea) * 110]], '#ffffff', 4, 18);
        Art.drawLasso(ctx, { x1: 160 + Math.cos(0.5) * 110, y1: 230 + Math.sin(0.5) * 110, x2: 160, y2: 230, progress: 0.5, t: 2, limit: 5, len: 110, maxLen: 220 });
        Art.drawTamer(ctx, { x: 160 + Math.cos(0.5) * 110, y: 230 + Math.sin(0.5) * 110, facing: 3, weapon: 'club', lassoing: true });
        ctx.restore();
        frame(ctx, 0, 0, 320, 440);
      });
      // 角落: 收服!
      sub(ctx, 210, 790, 1, function () {
        rr(ctx, 0, 0, 300, 220, 18); ctx.fillStyle = '#1d1828'; ctx.fill();
        frame(ctx, 0, 0, 300, 220);
        Art.drawFloatText(ctx, { x: 175, y: 150, text: '收服!', kind: 'capture', t: 0.3, dur: 1 });
        Art.drawTamer(ctx, { x: 150, y: 170, facing: 0, weapon: 'club' });
      });
    },
    // 3 排節目
    function (ctx) {
      // 上: 節目表(遊戲版位縮 0.45)
      sub(ctx, 28, 140, 0.45, function () {
        var rows = [
          { card: '', target: '' }, { card: 'rally', target: 'water' }, { card: '', target: '' },
          { card: 'provoke', target: 'fire' }, { card: '', target: '' }, { card: '', target: '' },
          { card: '', target: '' }, { card: '', target: '' }, { card: '', target: '' }
        ];
        for (var i = 0; i < 9; i++) {
          Art.drawTimelineSlot(ctx, { x: 360, y: 190 + 105 * i + 120, style: 'row', slot: i, card: rows[i].card, target: rows[i].target, selected: i === 4, active: false, done: false });
        }
        Art.drawButton(ctx, { x: 480, y: 1160 + 110, w: 180, h: 100, label: '開演', selected: false });
      });
      // 點名面板(縮 0.6, 貼在游標列右側)
      sub(ctx, 340, 380, 0.6, function () {
        ctx.save(); ctx.translate(-120, -240);
        ctx.beginPath(); ctx.rect(120, 240, 480, 80 + 70 * 3); ctx.clip();
        Art.drawPickerPanel(ctx, { layer: 'target', index: 0, options: [
          { type: 'monster', key: 'water', name: '水母', cost: 0, desc: '', affordable: true },
          { type: 'monster', key: 'fire', name: '火蜥蜴', cost: 0, desc: '', affordable: true },
          { type: 'monster', key: 'thunder', name: '雷鳥', cost: 0, desc: '', affordable: true }
        ] });
        ctx.restore();
      });
      arrowLine(ctx, [[200, 760], [200, 812]], '#ffffff', 5, 16);
      text(ctx, '開演', 250, 786, { size: 22, color: P.ink, align: 'left' });
      // 下: 表演場縮圖(5.5~6.3 秒那一刻)
      ctx.save();
      rr(ctx, 60, 820, 600, 230, 20);
      ctx.fillStyle = '#c9a873'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#5a4428'; ctx.stroke();
      ctx.restore();
      sub(ctx, 0, 0, 1, function () {
        var W = { x: 360, y: 960 }, F = { x: 180, y: 960 }, T = { x: 560, y: 960 };
        sub(ctx, F.x, F.y, 0.75, function () { Art.drawShowMonster(ctx, { x: 0, y: 0, species: 'fire', level: 0, rage: 62, redLow: 80, marks: 0, mode: 'rally', dir: 1 }); });
        sub(ctx, T.x, T.y, 0.75, function () { Art.drawShowMonster(ctx, { x: 0, y: 0, species: 'thunder', level: 0, rage: 55, redLow: 80, marks: 0, mode: 'rally', dir: -1 }); });
        sub(ctx, W.x, W.y, 0.75, function () {
          Art.drawShowMonster(ctx, { x: 0, y: 0, species: 'water', level: 0, rage: 58, redLow: 80, marks: 0, mode: 'hold', dir: 1 });
          Art.drawCardFx(ctx, { x: 0, y: 0, card: 'rally', t: 0.3, dur: 0.8 });
        });
        arrowLine(ctx, [[F.x + 48, F.y + 10], [W.x - 52, W.y + 10]], P.rally, 5, 16);
        arrowLine(ctx, [[T.x - 48, T.y + 10], [W.x + 52, W.y + 10]], P.rally, 5, 16);
      });
      // 縮小節目表
      sub(ctx, 0, 0, 1, function () {
        var cards = ['', 'rally', '', 'provoke', '', '', '', '', ''], tg = ['', 'water', '', 'fire', '', '', '', '', ''];
        for (var i = 0; i < 9; i++) {
          sub(ctx, 184 + 44 * i, 1100, 0.55, function () {
            Art.drawTimelineSlot(ctx, { x: 0, y: 0, style: 'mini', slot: i, card: cards[i], target: tg[i], selected: false, active: i === 1, done: i <= 1 });
          });
        }
      });
    },
    // 4 紅區
    function (ctx) {
      // 上: 紅區表演 ×2
      sub(ctx, 60, 230, 1, function () {
        rr(ctx, 0, 0, 600, 360, 20); ctx.fillStyle = '#c9a873'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#5a4428'; ctx.stroke();
        sub(ctx, 300, 210, 1.7, function () {
          Art.drawShowMonster(ctx, { x: 0, y: 0, species: 'fire', level: 1, rage: 90, redLow: 75, marks: 0, mode: 'roam', performing: true, performT: 0.2, performDur: 0.5, dir: 1 });
        });
        Art.drawFloatText(ctx, { x: 470, y: 160, text: '+4 ×2', kind: 'redGold', t: 0.25, dur: 1 });
        // 「紅區」標籤貼著怒氣條紅段
        var rx0 = 300 + 1.7 * (-45 + 90 * 0.75), rx1 = 300 + 1.7 * 45, yb = 210 + 1.7 * (-50);
        ctx.save(); ctx.strokeStyle = P.danger; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(rx0, yb - 8); ctx.lineTo(rx0, yb - 18); ctx.lineTo(rx1, yb - 18); ctx.lineTo(rx1, yb - 8); ctx.stroke();
        ctx.restore();
        text(ctx, '紅區', (rx0 + rx1) / 2, yb - 36, { size: 22, color: P.danger });
      });
      // 下: 4 個標記 → 衝圍欄
      sub(ctx, 60, 640, 1, function () {
        rr(ctx, 0, 0, 600, 460, 20); ctx.fillStyle = '#c9a873'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#5a4428'; ctx.stroke();
        // 右上: 觀眾席 + 圍欄
        rr(ctx, 330, 14, 256, 120, 12); ctx.fillStyle = P.stands; ctx.fill();
        Art.drawVisitor(ctx, { x: 400, y: 60, side: 'top', mode: 'watch' });
        Art.drawVisitor(ctx, { x: 510, y: 60, side: 'top', mode: 'scared' });
        Art.drawFence(ctx, { x: 400, y: 146, side: 'top', broken: false });
        Art.drawFence(ctx, { x: 510, y: 146, side: 'top', broken: false });
        sub(ctx, 140, 280, 1.4, function () {
          Art.drawShowMonster(ctx, { x: 0, y: 0, species: 'thunder', level: 0, rage: 100, redLow: 80, marks: 4, markLeft: 3, markDur: 4, mode: 'roam', dir: 1 });
        });
        arrowLine(ctx, [[230, 290], [380, 260]], '#ffffff', 6, 18);
        sub(ctx, 470, 210, 1.2, function () {
          Art.drawShowMonster(ctx, { x: 0, y: 0, species: 'thunder', level: 0, rage: 100, redLow: 80, marks: 0, mode: 'charge', chargeT: 0.6, chargeDur: 1.5, dir: 1 });
        });
        bigX(ctx, 470, 380, 26);
      });
    },
    // 5 目標
    function (ctx) {
      var cx = 360, cy = 610, R = 230;
      var nodes = [
        { a: -Math.PI / 2, label: '地下城' },
        { a: 0, label: '布置' },
        { a: Math.PI / 2, label: '表演' },
        { a: Math.PI, label: '商店' }
      ];
      // 圈上箭頭(順時針)
      for (var i = 0; i < 4; i++) {
        var a0 = nodes[i].a + 0.42, a1 = nodes[i].a + Math.PI / 2 - 0.42;
        var am = (a0 + a1) / 2;
        arrowLine(ctx, [[cx + Math.cos(a0) * R, cy + Math.sin(a0) * R], [cx + Math.cos(am) * R * 1.08, cy + Math.sin(am) * R * 1.08], [cx + Math.cos(a1) * R, cy + Math.sin(a1) * R]], '#ffffff', 5, 16);
      }
      nodes.forEach(function (n, i) {
        var nx = cx + Math.cos(n.a) * R, ny = cy + Math.sin(n.a) * R;
        rr(ctx, nx - 80, ny - 56, 160, 112, 16);
        ctx.fillStyle = P.panel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.panelLine; ctx.stroke();
        if (i === 0) { sub(ctx, nx - 30, ny - 44, 1, function () { Art.drawTile(ctx, { x: 30, y: 30, dungeon: 'cave', kind: 'wall', room: 'hall' }); }); }
        else if (i === 1) stackIcon(ctx, nx, ny - 16, 46);
        else if (i === 2) { sub(ctx, nx, ny - 14, 0.5, function () { creature(ctx, 'fire', 40, { dir: 1, face: 'angry' }); }); }
        else coinIcon(ctx, nx, ny - 16, 20);
        text(ctx, n.label, nx, ny + 34, { size: 24, color: P.ink });
      });
      text(ctx, '×7 天', cx, cy, { size: 52, color: P.cursor });
      // 表演旁名聲往上加
      var px = cx + 130, py = cy + R - 10;
      for (var k = 0; k < 3; k++) {
        repIcon(ctx, px + k * 18, py - k * 30, 12 + k * 2);
      }
      text(ctx, '+', px - 18, py - 4, { size: 26, color: P.rep });
      // 終點: 結算星數
      arrowLine(ctx, [[cx, cy + R + 60], [cx, cy + R + 100]], '#ffffff', 5, 16);
      rr(ctx, cx - 160, cy + R + 108, 320, 100, 18);
      ctx.fillStyle = P.panel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.panelLine; ctx.stroke();
      text(ctx, '結算', cx - 100, cy + R + 158, { size: 26, color: P.ink });
      for (var s = 0; s < 3; s++) {
        star(ctx, cx - 10 + s * 56, cy + R + 158, 24);
        ctx.fillStyle = P.gold; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
      }
    }
  ];

  if (typeof window !== 'undefined') window.Art = Art;
  else if (typeof globalThis !== 'undefined') globalThis.Art = Art;
})();
