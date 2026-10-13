/* 踩點地板秀 — 玩法驗證 Demo。邏輯與繪製分離: update 改狀態, render 呼叫 Art.drawXxx */
(function () {
'use strict';

var CW = Art.canvas.width, CH = Art.canvas.height;
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var dpr = window.devicePixelRatio || 1;
canvas.width = Math.round(CW * dpr);
canvas.height = Math.round(CH * dpr);
canvas.style.aspectRatio = CW + '/' + CH;

/* ---------- 佔位圖形(目前無) ---------- */
var Placeholder = {};

/* ---------- 資料 ---------- */
var SPECIES = ['fire', 'water', 'thunder', 'spike', 'stone', 'ghost'];
var SP_NAME = { fire: '火蜥蜴', water: '水母', thunder: '雷鳥', spike: '刺蝟', stone: '石像鬼', ghost: '幽靈' };
var MAXHP = { fire: 10, water: 7, thunder: 14, spike: 12, stone: 22, ghost: 16 };
var CAST_INT = { fire: 2.4, water: 1.6, thunder: 2.6, spike: 2.2, stone: 3, ghost: 2.8 };
var KILL_GOLD = { fire: 4, water: 4, thunder: 6, spike: 6, stone: 8, ghost: 8 };
var DECAY = { fire: 2, water: 3, thunder: 4, spike: 2.5, stone: 0.5, ghost: 1.5 };
var SHOW_GOLD = { fire: 2, water: 1, thunder: 3, spike: 2, stone: 3, ghost: 3 };
var SHOW_REP = { fire: 1, water: 1, thunder: 2, spike: 1, stone: 2, ghost: 2 };
var MON_R = { fire: 30, water: 28, thunder: 30, spike: 30, stone: 42, ghost: 30 };
var SHOW_R = 28;
var TAMER_R = 18;

var DUNGEONS = {
  cave: { name: '濕熱洞窟', sp: ['fire', 'water'], rows: [
    '############', '#LL......LL#', '#L..f..f..L#', '#..........#', '#.L......L.#', '#..........#',
    '#####..#####', '#..WW......#', '#.j....WW..#', '#......j...#', '#.WW.......#', '#.....WW...#'] },
  cliff: { name: '雷鳴崖', sp: ['thunder', 'spike'], rows: [
    '############', '#..t....t..#', '#.o......o.#', '#..........#', '#.o......o.#', '#..........#',
    '#####..#####', '#..........#', '#.h......h.#', '#...oo.....#', '#.......oo.#', '#..........#'] },
  ruins: { name: '古代遺跡', sp: ['stone', 'ghost'], rows: [
    '############', '#..........#', '#.g..o...g.#', '#....L.....#', '#.o......o.#', '#..........#',
    '#####..#####', '#..........#', '#.p..oo..p.#', '#..........#', '#.L......L.#', '#..........#'] }
};
var SHARED_ROWS = ['#####..#####', '#..........#', '#..........#', '#....S.....#', '#..........#', '#..........#', '############'];
var DKEYS = ['cave', 'cliff', 'ruins'];
var LETTER_SP = { f: 'fire', j: 'water', t: 'thunder', h: 'spike', g: 'stone', p: 'ghost' };
var UNLOCK = { cliff: { gold: 60, sp: 'water', n: 2 }, ruins: { gold: 120, sp: 'spike', n: 2 } };

var WEAPONS = {
  club: { name: '棍棒', price: 0, zCd: 0.35, xCd: 0 },
  sword: { name: '劍', price: 60, zCd: 0.35, xCd: 3 },
  spear: { name: '長槍', price: 60, zCd: 0.45, xCd: 1.2 },
  whip: { name: '長鞭', price: 60, zCd: 0.4, xCd: 1.2 }
};
var WKEYS = ['club', 'sword', 'spear', 'whip'];

var FLOORS = [
  { key: 'chili', name: '辣椒田', cost: 10, desc: '走進來的魔物會生氣' },
  { key: 'ice', name: '冰池', cost: 10, desc: '走進來的魔物會冷靜' },
  { key: 'spring', name: '彈跳板', cost: 15, desc: '把走進來的魔物彈去撞別隻' },
  { key: 'stage', name: '聚光舞台', cost: 20, desc: '走進來的魔物立刻表演' }
];
var FLOOR_COST = { chili: 10, ice: 10, spring: 15, stage: 20 };
var OPEN_POS = [[160, 540], [560, 540], [160, 720], [560, 720]];
var GUIDE = [
  ['地下城', '方向鍵走, Z 攻擊, X 武器技'],
  ['收服', '殘血時站上去, 再繞牠一圈'],
  ['鋪地板', '開演前鋪地板, 開演後只能看'],
  ['紅區', '紅區最賺, 標記滿 5 個就失控'],
  ['目標', '7 天內賺到越多名聲越好']
];
var SHOP_ITEMS = ['club', 'sword', 'spear', 'whip', 'attack', 'armor', 'ropeBag'];
var SHOP_DESC_NAME = { attack: 'attack', armor: 'armor', ropeBag: 'ropeBag' };

/* ---------- 工具 ---------- */
function rnd(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function dist(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }
function normAng(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
var DEG = Math.PI / 180;

/* ---------- 輸入(只有方向鍵 + Z、X) ---------- */
var held = { up: false, down: false, left: false, right: false };
var pressQ = [];
var KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyZ: 'z', KeyX: 'x', z: 'z', Z: 'z', x: 'x', X: 'x' };
function keyName(e) { return KEYMAP[e.code] || KEYMAP[e.key] || null; }
window.addEventListener('keydown', function (e) {
  var k = keyName(e);
  if (!k) return;
  e.preventDefault();
  if (e.repeat) return;
  if (held.hasOwnProperty(k)) held[k] = true;
  pressQ.push(k);
});
window.addEventListener('keyup', function (e) {
  var k = keyName(e);
  if (!k) return;
  e.preventDefault();
  if (held.hasOwnProperty(k)) held[k] = false;
});
window.addEventListener('blur', function () {
  held.up = held.down = held.left = held.right = false;
});

/* ---------- 全域狀態 ---------- */
var G;
function newGame() {
  return {
    phase: 'guide', guidePage: 0, guideReturn: null,
    day: 1, gold: 30, rep: 0, goldEarned: 0, bestChain: 0,
    roster: [{ sp: 'fire', level: 0 }, { sp: 'water', level: 0 }],
    captured: { fire: 0, water: 0, thunder: 0, spike: 0, stone: 0, ghost: 0 },
    open: { cave: true, cliff: false, ruins: false },
    weapon: 'club', owned: { club: true, sword: false, spear: false, whip: false },
    atk: 0, armor: 0, bag: 0, price: { attack: 50, armor: 40, ropeBag: 40 },
    selCur: 0, picked: [], s1Cur: 0, s2Cur: 0, floors: [], panel: null, shopCur: 0,
    dg: null, show: null, floats: [], result: null
  };
}
G = newGame();

function levelOf(sp) {
  for (var i = 0; i < G.roster.length; i++) if (G.roster[i].sp === sp) return G.roster[i].level;
  return -1;
}
function bonus(sp) { return Math.max(0, levelOf(sp)); }
function addGold(n) { G.gold += n; G.goldEarned += n; }
function addFloat(x, y, text, kind) { G.floats.push({ x: x, y: y, text: text, kind: kind, t: 0, dur: 1 }); }
function setPhase(p) { G.phase = p; G.floats = []; }

/* =====================================================================
   地下城
   ===================================================================== */
var D; // 目前地下城狀態
var monId = 1;

function buildMap(key) {
  var rows = DUNGEONS[key].rows.concat(SHARED_ROWS);
  var tiles = [], nests = [], start = { x: 330, y: 930 };
  for (var r = 0; r < 19; r++) {
    var line = [];
    for (var c = 0; c < 12; c++) {
      var ch = rows[r].charAt(c), kind = 'floor', nest = false;
      if (ch === '#') kind = 'wall'; else if (ch === 'o') kind = 'pillar';
      else if (ch === 'L') kind = 'lava'; else if (ch === 'W') kind = 'water';
      var room = (r >= 1 && r <= 5 && c >= 1 && c <= 10) ? 'top' : ((r >= 7 && r <= 11 && c >= 1 && c <= 10) ? 'bottom' : 'hall');
      if (ch === 'S') start = { x: c * 60 + 30, y: r * 60 + 30 };
      if (LETTER_SP[ch]) {
        nest = true;
        nests.push({ sp: LETTER_SP[ch], x: c * 60 + 30, y: r * 60 + 30, room: room, mon: null, respawn: 0 });
      }
      line.push({ kind: kind, room: room, nest: nest });
    }
    tiles.push(line);
  }
  return { tiles: tiles, nests: nests, start: start };
}

function startDungeon(key) {
  var mp = buildMap(key);
  var maxHearts = 5 + G.armor + bonus('stone');
  D = {
    key: key, tiles: mp.tiles, nests: mp.nests, time: 60,
    tamer: { x: mp.start.x, y: mp.start.y, facing: 0, hearts: maxHearts, maxHearts: maxHearts, invul: 0, zCd: 0, xCd: 0, dash: null },
    ropes: 3 + G.bag, ropeMax: 3 + G.bag,
    mons: [], hz: [], fx: [], ring: null, lasso: null, done: false, started: false
  };
  for (var i = 0; i < D.nests.length; i++) spawnMon(D.nests[i]);
  setPhase('dungeon');
}

function spawnMon(nest) {
  var sp = nest.sp;
  var m = {
    id: monId++, sp: sp, nest: nest, room: nest.room, x: nest.x, y: nest.y,
    hp: MAXHP[sp], maxHp: MAXHP[sp], hit: 0, stun: 0, lassoed: false,
    castCd: rnd(0.8, CAST_INT[sp]), castFlash: 0, vx: 0, vy: 0, wdT: rnd(2, 3), dir: 1,
    dashT: 0, dashCd: rnd(0.5, 2), dvx: 0, dvy: 0, warpT: 3, rollT: 4, kb: null
  };
  if (sp === 'spike') { var a = rnd(0, 6.283); m.vx = Math.cos(a); m.vy = Math.sin(a); }
  nest.mon = m;
  D.mons.push(m);
  return m;
}

function isWeak(m) { return m.hp <= m.maxHp * 0.3; }

function roomBounds(m) {
  if (m.room === 'top') return { x0: 85, x1: 635, y0: 85, y1: 335 };
  return { x0: 85, x1: 635, y0: 445, y1: 695 };
}
function clampRoom(m) {
  var b = roomBounds(m);
  m.x = clamp(m.x, b.x0, b.x1); m.y = clamp(m.y, b.y0, b.y1);
}

function tileAt(c, r) {
  if (c < 0 || r < 0 || c >= 12 || r >= 19) return { kind: 'wall' };
  return D.tiles[r][c];
}
function circRect(cx, cy, r, rx, ry, rw, rh) {
  var nx = clamp(cx, rx, rx + rw), ny = clamp(cy, ry, ry + rh);
  var dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}
function blockedAt(x, y, r) {
  var c0 = Math.floor((x - r) / 60), c1 = Math.floor((x + r) / 60);
  var r0 = Math.floor((y - r) / 60), r1 = Math.floor((y + r) / 60);
  for (var rr = r0; rr <= r1; rr++) for (var cc = c0; cc <= c1; cc++) {
    var k = tileAt(cc, rr).kind;
    if ((k === 'wall' || k === 'pillar') && circRect(x, y, r, cc * 60, rr * 60, 60, 60)) return true;
  }
  return false;
}
function onLava(x, y, r) {
  var c0 = Math.floor((x - r) / 60), c1 = Math.floor((x + r) / 60);
  var r0 = Math.floor((y - r) / 60), r1 = Math.floor((y + r) / 60);
  for (var rr = r0; rr <= r1; rr++) for (var cc = c0; cc <= c1; cc++) {
    if (tileAt(cc, rr).kind === 'lava' && circRect(x, y, r, cc * 60, rr * 60, 60, 60)) return true;
  }
  return false;
}
function moveTamer(dx, dy) {
  var t = D.tamer, moved = false;
  if (dx !== 0 && !blockedAt(t.x + dx, t.y, TAMER_R)) { t.x += dx; moved = true; }
  if (dy !== 0 && !blockedAt(t.x, t.y + dy, TAMER_R)) { t.y += dy; moved = true; }
  return moved;
}
var FACE_VEC = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
function faceAngle(f) { return -Math.PI / 2 + f * Math.PI / 4; }
function faceFromInput(dx, dy) {
  for (var i = 0; i < 8; i++) if (FACE_VEC[i][0] === dx && FACE_VEC[i][1] === dy) return i;
  return -1;
}

/* ----- 魔物技能(地下城與表演場共用) ----- */
function mkH(kind, x, y, o) {
  var h = { kind: kind, x: x, y: y, phase: 'warn', t: 0, dur: 0.5, radius: 0, angle: 0, reflected: false, owner: null, rec: null,
    hitIds: [], speed: 0, life: 0, homing: false, target: null, dead: false, struck: false, act: 0.5 };
  for (var k in o) h[k] = o[k];
  return h;
}
function registerH(h, rec) {
  h.rec = rec;
  if (rec) rec.pending++;
  (G.phase === 'show' ? G.show.hz : D.hz).push(h);
}
function killH(h) {
  if (h.dead) return;
  h.dead = true;
  if (h.rec) { h.rec.pending--; if (h.rec.pending <= 0) awardRec(h.rec); }
}
function spawnSkill(owner, sp, tx, ty, rec, tgtRef) {
  var ox = owner.x, oy = owner.y, a, i;
  if (sp === 'fire') {
    registerH(mkH('firering', ox, oy, { radius: 120, dur: 0.5, act: 0.5, owner: owner }), rec);
  } else if (sp === 'water') {
    a = Math.atan2(ty - oy, tx - ox);
    for (i = -1; i <= 1; i++) {
      var an = a + i * 20 * DEG;
      registerH(mkH('waterball', ox, oy, { phase: 'fly', radius: 12, dur: 0, angle: an, speed: 300, owner: owner }), rec);
    }
  } else if (sp === 'thunder') {
    registerH(mkH('thunder', tx, ty, { radius: 70, dur: 0.8, act: 0.2, owner: owner }), rec);
  } else if (sp === 'spike') {
    for (i = 0; i < 8; i++) registerH(mkH('spike', ox, oy, { phase: 'fly', radius: 10, dur: 0, angle: i * Math.PI / 4, speed: 260, owner: owner }), rec);
  } else if (sp === 'stone') {
    registerH(mkH('quake', ox, oy, { phase: 'active', radius: 0, dur: 1, owner: owner }), rec);
  } else if (sp === 'ghost') {
    a = Math.atan2(ty - oy, tx - ox);
    registerH(mkH('wisp', ox, oy, { phase: 'fly', radius: 14, dur: 3, life: 3, angle: a, speed: 160, homing: true, target: tgtRef, owner: owner }), rec);
  }
}

function hitTamer() {
  var t = D.tamer;
  if (t.invul > 0 || t.dash) return false;
  t.hearts--; t.invul = 1;
  if (D.lasso) breakLasso();
  return true;
}

function updateHazards(dt) {
  var list = G.phase === 'show' ? G.show.hz : D.hz;
  var show = G.phase === 'show';
  for (var i = 0; i < list.length; i++) {
    var h = list[i];
    if (h.dead) continue;
    h.t += dt;
    if (h.kind === 'firering' || h.kind === 'thunder') {
      if (h.phase === 'warn' && h.t >= h.dur) {
        h.t -= h.dur; h.phase = 'active'; h.dur = h.act;
        if (h.kind === 'thunder') strikeCheck(h, show);
      }
      if (h.phase === 'active') {
        if (h.kind === 'firering') strikeCheck(h, show);
        if (h.t >= h.dur) killH(h);
      }
    } else if (h.kind === 'quake') {
      h.radius = 220 * Math.min(1, h.t / h.dur);
      strikeCheck(h, show);
      if (h.t >= h.dur) killH(h);
    } else { // 投射物
      if (h.kind === 'wisp') {
        if (h.homing) {
          var tg = homingPos(h, show);
          if (tg) {
            var da = normAng(Math.atan2(tg.y - h.y, tg.x - h.x) - h.angle);
            var mx = 120 * DEG * dt;
            h.angle += clamp(da, -mx, mx);
          }
        }
        if (h.t >= h.life) { killH(h); continue; }
      }
      h.x += Math.cos(h.angle) * h.speed * dt;
      h.y += Math.sin(h.angle) * h.speed * dt;
      if (show) {
        if (h.x < 60 || h.x > 660 || h.y < 270 || h.y > 990) { killH(h); continue; }
      } else if (blockedAt(h.x, h.y, 2) || h.x < 0 || h.x > 720 || h.y < 0 || h.y > 1140) { killH(h); continue; }
      projectileCheck(h, show);
    }
  }
  var out = [];
  for (i = 0; i < list.length; i++) if (!list[i].dead) out.push(list[i]);
  if (show) G.show.hz = out; else D.hz = out;
}
function homingPos(h, show) {
  if (!show) return D.tamer;
  var t = h.target;
  if (t && t.state === 'roam') return t;
  return null;
}
function areaHit(h, d, R) {
  if (h.kind === 'quake') return Math.abs(d - h.radius) <= 15 + R;
  return d <= h.radius + R;
}
function strikeCheck(h, show) {
  var i, m, d;
  if (!show) {
    var t = D.tamer;
    d = dist(h.x, h.y, t.x, t.y);
    if (h.hitIds.indexOf('T') < 0 && areaHit(h, d, TAMER_R)) {
      if (hitTamer()) h.hitIds.push('T');
    }
    return;
  }
  var ms = G.show.mons;
  for (i = 0; i < ms.length; i++) {
    m = ms[i];
    if (m === h.owner || m.state !== 'roam' || h.hitIds.indexOf(m.id) >= 0) continue;
    d = dist(h.x, h.y, m.x, m.y);
    if (areaHit(h, d, SHOW_R)) { h.hitIds.push(m.id); applyShowHit(h, m); }
  }
}
function projectileCheck(h, show) {
  var i, m, d;
  if (!show) {
    if (h.reflected) {
      for (i = 0; i < D.mons.length; i++) {
        m = D.mons[i];
        if (m.lassoed) continue;
        if (dist(h.x, h.y, m.x, m.y) <= h.radius + MON_R[m.sp]) {
          dmgMon(m, 3 + G.atk); killH(h); return;
        }
      }
      return;
    }
    var t = D.tamer;
    if (t.invul > 0 || t.dash) return;
    if (dist(h.x, h.y, t.x, t.y) <= h.radius + TAMER_R) { hitTamer(); killH(h); }
    return;
  }
  var ms = G.show.mons;
  for (i = 0; i < ms.length; i++) {
    m = ms[i];
    if (m === h.owner || m.state !== 'roam') continue;
    if (dist(h.x, h.y, m.x, m.y) <= h.radius + SHOW_R) {
      h.hitIds.push(m.id); applyShowHit(h, m); killH(h); return;
    }
  }
}

/* ----- 地下城: 傷害、擊倒、捕捉 ----- */
function dmgMon(m, dmg) {
  if (m.lassoed || dmg <= 0) return;
  m.hp -= dmg; m.hit = 0.1;
  if (D.ring && D.ring.mon === m) D.ring = null;
  if (m.hp <= 0) {
    addGold(KILL_GOLD[m.sp]);
    addFloat(m.x, m.y + 130 - 40, '+' + KILL_GOLD[m.sp], 'gold');
    removeMon(m);
  }
}
function removeMon(m) {
  var i = D.mons.indexOf(m);
  if (i >= 0) D.mons.splice(i, 1);
  if (m.nest) { m.nest.mon = null; m.nest.respawn = 8; }
  for (var k = 0; k < D.hz.length; k++) if (D.hz[k].owner === m && D.hz[k].phase === 'warn') killH(D.hz[k]);
  if (D.ring && D.ring.mon === m) D.ring = null;
  if (D.lasso && D.lasso.mon === m) D.lasso = null;
}
function cancelWarn(m) {
  for (var k = 0; k < D.hz.length; k++) if (D.hz[k].owner === m && D.hz[k].phase === 'warn') killH(D.hz[k]);
  m.castFlash = 0;
}
function breakLasso() {
  if (!D.lasso) return;
  D.lasso.mon.lassoed = false;
  D.lasso = null;
}
function capture(m) {
  var sp = m.sp;
  D.ropes--;
  addFloat(m.x, m.y + 130 - 40, '收服!', 'capture');
  G.captured[sp]++;
  var lv = levelOf(sp);
  if (lv < 0) G.roster.push({ sp: sp, level: 0 });
  else if (lv < 3) { for (var i = 0; i < G.roster.length; i++) if (G.roster[i].sp === sp) G.roster[i].level++; addFloat(m.x, m.y + 130 - 70, '等級 +1', 'levelUp'); }
  else { addGold(20); addFloat(m.x, m.y + 130 - 70, '+20', 'coin20'); }
  D.lasso = null;
  m.lassoed = false;
  removeMon(m);
}

/* ----- 武器 ----- */
function sectorHit(px, py, ang, spread, R, m) {
  var d = dist(px, py, m.x, m.y), mr = MON_R[m.sp];
  if (d > R + mr) return false;
  if (d < mr) return true;
  var da = Math.abs(normAng(Math.atan2(m.y - py, m.x - px) - ang));
  return da <= spread / 2 + Math.asin(Math.min(1, mr / d));
}
function lineHit(px, py, ang, len, wid, m) {
  var mr = MON_R[m.sp];
  var dx = m.x - px, dy = m.y - py, ca = Math.cos(ang), sa = Math.sin(ang);
  var along = dx * ca + dy * sa, perp = -dx * sa + dy * ca;
  return along >= -mr * 0.5 && along <= len + mr && Math.abs(perp) <= wid / 2 + mr * 0.7;
}
function addFx(o) {
  o.t = 0; o.angle = o.angle || 0; o.spread = o.spread || 0; o.radius = o.radius || 0; o.length = o.length || 0; o.width = o.width || 0;
  D.fx.push(o);
}
function atkDmg(base) { return base + G.atk; }

function doZ() {
  var t = D.tamer, w = G.weapon, a = faceAngle(t.facing), i, m;
  if (t.zCd > 0 || t.dash) return;
  t.zCd = WEAPONS[w].zCd;
  var fb = 1 + 0.1 * bonus('fire');
  var mons = D.mons.slice();
  if (w === 'club' || w === 'sword') {
    var spread = (w === 'club' ? 100 : 120) * DEG, R = (w === 'club' ? 70 : 80) * fb;
    addFx({ x: t.x, y: t.y, weapon: w, move: 'normal', shape: 'arc', angle: a, spread: spread, radius: R, dur: 0.2 });
    for (i = 0; i < mons.length; i++) if (sectorHit(t.x, t.y, a, spread, R, mons[i])) dmgMon(mons[i], atkDmg(2));
    if (w === 'sword') reflectIn(a, spread, R);
  } else if (w === 'spear') {
    var L = 170 * fb;
    addFx({ x: t.x, y: t.y, weapon: w, move: 'normal', shape: 'line', angle: a, length: L, width: 40, dur: 0.2 });
    for (i = 0; i < mons.length; i++) if (lineHit(t.x, t.y, a, L, 40, mons[i])) dmgMon(mons[i], atkDmg(2));
  } else if (w === 'whip') {
    var Rw = 100 * fb;
    addFx({ x: t.x, y: t.y, weapon: w, move: 'normal', shape: 'circle', radius: Rw, dur: 0.2 });
    for (i = 0; i < mons.length; i++) { m = mons[i]; if (dist(t.x, t.y, m.x, m.y) <= Rw + MON_R[m.sp]) dmgMon(m, atkDmg(1)); }
  }
}
function reflectIn(a, spread, R) {
  var t = D.tamer;
  for (var i = 0; i < D.hz.length; i++) {
    var h = D.hz[i];
    if (h.phase !== 'fly' || h.reflected || h.kind === 'firering') continue;
    var d = dist(t.x, t.y, h.x, h.y);
    if (d > R + h.radius) continue;
    if (d > 8 && Math.abs(normAng(Math.atan2(h.y - t.y, h.x - t.x) - a)) > spread / 2 + 0.15) continue;
    var ang;
    if (D.mons.indexOf(h.owner) >= 0) ang = Math.atan2(h.owner.y - t.y, h.owner.x - t.x);
    else ang = h.angle + Math.PI;
    h.angle = ang; h.speed *= 1.2; h.reflected = true; h.homing = false; h.hitIds = [];
  }
}
function doX() {
  var t = D.tamer, w = G.weapon, a = faceAngle(t.facing), i, m;
  if (w === 'club' || t.xCd > 0 || t.dash) return;
  var cdMul = Math.max(0, 1 - 0.15 * bonus('spike'));
  t.xCd = WEAPONS[w].xCd * cdMul;
  var mons = D.mons.slice();
  if (w === 'sword') {
    var sp = 120 * DEG;
    addFx({ x: t.x, y: t.y, weapon: w, move: 'skill', shape: 'arc', angle: a, spread: sp, radius: 80, dur: 0.2 });
    for (i = 0; i < mons.length; i++) {
      m = mons[i];
      if (m.lassoed) continue;
      if (sectorHit(t.x, t.y, a, sp, 80, m)) { m.stun = 2; cancelWarn(m); m.dashT = 0; }
    }
  } else if (w === 'spear') {
    var v = FACE_VEC[t.facing], l = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    t.dash = { t: 0, dur: 0.25, dx: v[0] / l, dy: v[1] / l, moved: 0, hit: [] };
    addFx({ x: t.x, y: t.y, weapon: w, move: 'skill', shape: 'dash', angle: a, length: 220, dur: 0.25 });
  } else if (w === 'whip') {
    var sp2 = 100 * DEG;
    addFx({ x: t.x, y: t.y, weapon: w, move: 'skill', shape: 'arc', angle: a, spread: sp2, radius: 170, dur: 0.2 });
    for (i = 0; i < mons.length; i++) {
      m = mons[i];
      if (m.lassoed) continue;
      if (sectorHit(t.x, t.y, a, sp2, 170, m)) {
        var kd = Math.atan2(m.y - t.y, m.x - t.x);
        if (dist(m.x, m.y, t.x, t.y) < 1) kd = a;
        dmgMon(m, atkDmg(2));
        if (D.mons.indexOf(m) >= 0) {
          var b = roomBounds(m);
          var tx = clamp(m.x + Math.cos(kd) * 160, b.x0, b.x1), ty = clamp(m.y + Math.sin(kd) * 160, b.y0, b.y1);
          m.kb = { t: 0, dur: 0.25, sx: m.x, sy: m.y, tx: tx, ty: ty };
        }
      }
    }
  }
}

/* ----- 地下城 AI ----- */
function monMove(m, vx, vy, spd, dt) {
  var l = Math.sqrt(vx * vx + vy * vy);
  if (l < 1e-6) return;
  m.x += vx / l * spd * dt; m.y += vy / l * spd * dt;
  if (Math.abs(vx) > 0.01) m.dir = vx > 0 ? 1 : -1;
}
function wander(m, spd, dt) {
  m.wdT -= dt;
  if (m.wdT <= 0) { m.wdT = rnd(2, 3); var a = rnd(0, 6.283); m.vx = Math.cos(a); m.vy = Math.sin(a); if (Math.random() < 0.2) { m.vx = 0; m.vy = 0; } }
  monMove(m, m.vx, m.vy, spd, dt);
}
function monGroundTiles(m) {
  var out = [], r0 = m.room === 'top' ? 1 : 7;
  for (var r = r0; r < r0 + 5; r++) for (var c = 1; c <= 10; c++) {
    var k = D.tiles[r][c].kind;
    if (k !== 'wall' && k !== 'pillar' && k !== 'lava') out.push([c * 60 + 30, r * 60 + 30]);
  }
  return out;
}
function updateMonDungeon(m, dt) {
  var t = D.tamer, sp = m.sp;
  if (m.hit > 0) m.hit -= dt;
  if (m.castFlash > 0) m.castFlash -= dt;
  if (m.stun > 0) { m.stun -= dt; }
  if (m.kb) {
    m.kb.t += dt;
    var k = Math.min(1, m.kb.t / m.kb.dur);
    m.x = m.kb.sx + (m.kb.tx - m.kb.sx) * k; m.y = m.kb.sy + (m.kb.ty - m.kb.sy) * k;
    if (m.kb.t >= m.kb.dur) m.kb = null;
    return;
  }
  if (m.lassoed || m.stun > 0) { m.dashT = 0; return; }
  var weak = isWeak(m), mul = weak ? 0.5 : 1;
  var d = dist(m.x, m.y, t.x, t.y), dx = t.x - m.x, dy = t.y - m.y;
  var far = d >= 320;
  if (far && (sp === 'fire' || sp === 'water' || sp === 'stone')) {
    wander(m, (sp === 'stone' ? 25 : 40) * mul, dt);
  } else if (sp === 'fire') {
    if (d > 80) monMove(m, dx, dy, 70 * mul, dt);
  } else if (sp === 'water') {
    if (d < 220) monMove(m, -dx, -dy, 60 * mul, dt);
    else if (d > 320) monMove(m, dx, dy, 40 * mul, dt);
    else monMove(m, -dy, dx, 40 * mul, dt);
  } else if (sp === 'thunder') {
    if (m.dashT > 0) { m.dashT -= dt; monMove(m, m.dvx, m.dvy, 600 * mul, dt); }
    else { m.dashCd -= dt; if (m.dashCd <= 0) { var a = rnd(0, 6.283); m.dvx = Math.cos(a); m.dvy = Math.sin(a); m.dashT = 0.3; m.dashCd = 2; } }
  } else if (sp === 'spike') {
    m.rollT -= dt;
    if (m.rollT <= 0) { m.rollT = 4; var a2 = rnd(0, 6.283); m.vx = Math.cos(a2); m.vy = Math.sin(a2); }
    monMove(m, m.vx, m.vy, 110 * mul, dt);
    var b = roomBounds(m);
    if (m.x < b.x0) { m.x = b.x0; m.vx = Math.abs(m.vx); } if (m.x > b.x1) { m.x = b.x1; m.vx = -Math.abs(m.vx); }
    if (m.y < b.y0) { m.y = b.y0; m.vy = Math.abs(m.vy); } if (m.y > b.y1) { m.y = b.y1; m.vy = -Math.abs(m.vy); }
  } else if (sp === 'stone') {
    monMove(m, dx, dy, 35 * mul, dt);
  } else if (sp === 'ghost') {
    m.warpT -= dt;
    if (m.warpT <= 0) {
      m.warpT = 3;
      var tiles = monGroundTiles(m), ok = [];
      for (var i = 0; i < tiles.length; i++) if (dist(tiles[i][0], tiles[i][1], t.x, t.y) >= 120) ok.push(tiles[i]);
      if (ok.length) { var p = pick(ok); m.x = p[0]; m.y = p[1]; }
    }
  }
  clampRoom(m);
  if (d < 320) {
    m.castCd -= dt;
    if (m.castCd <= 0) {
      m.castCd = CAST_INT[sp] * (weak ? 1.5 : 1);
      spawnSkill(m, sp, t.x, t.y, null, 'tamer');
      if (sp === 'water' || sp === 'spike' || sp === 'ghost') m.castFlash = 0.25;
    }
  }
}

function updateDungeon(dt) {
  var t = D.tamer, i;
  D.time -= dt;
  if (t.invul > 0) t.invul -= dt;
  if (t.zCd > 0) t.zCd -= dt;
  if (t.xCd > 0) t.xCd -= dt;
  // 輸入處理
  for (i = 0; i < pressQ.length; i++) {
    if (pressQ[i] === 'z') doZ();
    else if (pressQ[i] === 'x') doX();
  }
  // 移動
  if (t.dash) {
    var ds = t.dash, step = Math.min(dt, ds.dur - ds.t), dist0 = 220 / ds.dur * step, n = Math.ceil(dist0 / 10), blocked = false;
    for (i = 0; i < n; i++) {
      var sx = ds.dx * dist0 / n, sy = ds.dy * dist0 / n;
      if (!moveTamer(sx, sy)) { blocked = true; break; }
      for (var j = 0; j < D.mons.length; j++) {
        var m = D.mons[j];
        if (ds.hit.indexOf(m.id) < 0 && dist(m.x, m.y, t.x, t.y) <= TAMER_R + MON_R[m.sp]) { ds.hit.push(m.id); dmgMon(m, atkDmg(3)); }
      }
    }
    ds.t += dt;
    if (ds.t >= ds.dur || blocked) t.dash = null;
  } else {
    var ix = (held.right ? 1 : 0) - (held.left ? 1 : 0), iy = (held.down ? 1 : 0) - (held.up ? 1 : 0);
    if (ix || iy) {
      var f = faceFromInput(ix, iy); if (f >= 0) t.facing = f;
      var l = Math.sqrt(ix * ix + iy * iy);
      var spd = 300 + 25 * bonus('thunder');
      var tl = tileAt(Math.floor(t.x / 60), Math.floor(t.y / 60));
      if (tl.kind === 'water') spd *= 0.5;
      moveTamer(ix / l * spd * dt, iy / l * spd * dt);
    }
  }
  if (onLava(t.x, t.y, TAMER_R)) hitTamer();
  // 魔物
  var ms = D.mons.slice();
  for (i = 0; i < ms.length; i++) updateMonDungeon(ms[i], dt);
  for (i = 0; i < D.nests.length; i++) {
    var n = D.nests[i];
    if (!n.mon && n.respawn > 0) { n.respawn -= dt; if (n.respawn <= 0) spawnMon(n); }
  }
  updateHazards(dt);
  updateCapture(dt);
  for (i = D.fx.length - 1; i >= 0; i--) { D.fx[i].t += dt; if (D.fx[i].t >= D.fx[i].dur) D.fx.splice(i, 1); }
  if (D.time <= 0 || t.hearts <= 0) endDungeon();
}
function captureTime() { return Math.max(0.35, 0.8 - 0.15 * bonus('water')); }
function updateCapture(dt) {
  var t = D.tamer, i, m;
  if (D.lasso) {
    var L = D.lasso; m = L.mon;
    var ang = Math.atan2(t.y - m.y, t.x - m.x);
    L.sum += normAng(ang - L.last); L.last = ang;
    L.t += dt;
    var dd = dist(t.x, t.y, m.x, m.y);
    if (Math.abs(L.sum) / (2 * Math.PI) >= 1) capture(m);
    else if (L.t >= 5 + bonus('ghost') || dd > 220) breakLasso();
    return;
  }
  if (D.ropes <= 0) { D.ring = null; return; }
  var best = null, bd = 41;
  for (i = 0; i < D.mons.length; i++) {
    m = D.mons[i];
    if (!isWeak(m) || m.lassoed) continue;
    var d = dist(t.x, t.y, m.x, m.y);
    if (d <= 40 && d < bd) { bd = d; best = m; }
  }
  if (!best) { D.ring = null; return; }
  if (!D.ring || D.ring.mon !== best) D.ring = { mon: best, t: 0 };
  D.ring.t += dt;
  if (D.ring.t >= captureTime()) {
    D.ring = null;
    best.lassoed = true; cancelWarn(best); best.dashT = 0;
    D.lasso = { mon: best, t: 0, sum: 0, last: Math.atan2(t.y - best.y, t.x - best.x) };
  }
}
function endDungeon() {
  for (var i = 0; i < D.hz.length; i++) killH(D.hz[i]);
  D.hz = [];
  G.picked = []; G.s1Cur = 0;
  setPhase('setup1');
}

/* =====================================================================
   布置階段
   ===================================================================== */
function cellCenter(i) { return { x: 160 + 200 * (i % 3), y: 360 + 180 * Math.floor(i / 3) }; }
function cellOf(x, y) {
  var c = clamp(Math.floor((x - 60) / 200), 0, 2), r = clamp(Math.floor((y - 270) / 180), 0, 3);
  return r * 3 + c;
}
function floorsRefundAll() {
  for (var i = 0; i < 12; i++) if (G.floors[i]) { G.gold += FLOOR_COST[G.floors[i]]; G.floors[i] = null; }
}
function pickedRoster() {
  var out = [];
  for (var i = 0; i < G.roster.length; i++) if (G.picked.indexOf(G.roster[i].sp) >= 0) out.push(G.roster[i]);
  return out;
}
function makeShowMon(r, idx) {
  var p = OPEN_POS[idx];
  return {
    id: idx + 1, sp: r.sp, level: r.level, x: p[0], y: p[1], rage: 60, redLow: 80 - 5 * r.level,
    marks: 0, markT: 0, slow: false, state: 'roam', performT: 0.5, perfCd: rnd(0.5, 2),
    fx: 'none', fxT: 0, pend: null, lastRelay: -99, cell: cellOf(p[0], p[1]), lastTrig: {},
    dir: 1, dashing: false, dashT: 0, dashCd: rnd(0.5, 2), dvx: 0, dvy: 0,
    vx: 0, vy: 0, wdT: rnd(2, 3), rollT: 4, warpT: 3, hunt: null, lastTouch: null, awayT: 0,
    orbitT: 0, center: null, inIce: false, fly: null, chg: null, loose: null
  };
}
function enterSetup2() {
  var rs = pickedRoster();
  G.floors = []; for (var i = 0; i < 12; i++) G.floors.push(null);
  G.s2Cur = 0; G.panel = null;
  G.show = { mons: rs.map(makeShowMon), hz: [] };
  setPhase('setup2');
}

/* =====================================================================
   表演場
   ===================================================================== */
var S;
function startShow() {
  var rs = pickedRoster();
  var fb = { top: [], bottom: [] }, vis = { top: [], bottom: [] };
  for (var i = 0; i < 6; i++) {
    fb.top.push(false); fb.bottom.push(false);
    vis.top.push({ mode: 'watch', t: 0 }); vis.bottom.push({ mode: 'watch', t: 0 });
  }
  S = {
    t: 0, mons: rs.map(makeShowMon), hz: [], recs: [], broken: fb, vis: vis,
    floors: G.floors.slice(), floorFx: {}, slam: [], pairs: {}
  };
  G.show = S;
  setPhase('show');
}

function intervalOf(rage) {
  if (rage < 50) return 4;
  return 4 - (rage - 50) / 50 * 2.5;
}
function liveOthers(m) {
  var out = [], ms = S.mons;
  for (var i = 0; i < ms.length; i++) if (ms[i] !== m && ms[i].state === 'roam') out.push(ms[i]);
  return out;
}
function nearestOther(m) {
  var o = liveOthers(m), best = null, bd = 1e9;
  for (var i = 0; i < o.length; i++) { var d = dist(m.x, m.y, o[i].x, o[i].y); if (d < bd) { bd = d; best = o[i]; } }
  return best;
}

function perform(m, step) {
  if (m.state !== 'roam') return;
  m.performT = 0;
  m.perfCd = intervalOf(m.rage);
  var rec = { owner: m, sp: m.sp, step: step, red: m.rage >= m.redLow, stage: S.floors[cellOf(m.x, m.y)] === 'stage', hits: 0, pending: 0, done: false };
  S.recs.push(rec);
  if (step > G.bestChain) G.bestChain = step;
  var tg = nearestOther(m), tx = 360, ty = 630;
  if (tg) { tx = tg.x; ty = tg.y; }
  spawnSkill(m, m.sp, tx, ty, rec, tg);
  if (rec.pending === 0) awardRec(rec);
}
function awardRec(rec) {
  if (rec.done) return;
  rec.done = true;
  var g = SHOW_GOLD[rec.sp] * (1 + 0.5 * rec.hits) * (rec.red ? 2 : 1) * (1 + 0.25 * (rec.step - 1)) * (rec.stage ? 1.5 : 1) * Math.min(3, 1 + G.rep / 200);
  g = Math.max(1, Math.round(g));
  addGold(g);
  G.rep += SHOW_REP[rec.sp];
  var txt = '+' + g + (rec.red ? ' ×2' : ''), kind = rec.red ? 'redGold' : 'gold';
  if (rec.step >= 2) { txt += ' 連鎖 ' + rec.step; kind = 'chain'; }
  addFloat(rec.owner.x, rec.owner.y - 60, txt, kind);
}

function applyShowHit(h, m) {
  if (h.rec) h.rec.hits++;
  var k = h.kind, step = h.rec ? h.rec.step : 1;
  if (k === 'waterball') douse(m, 20);
  else if (k === 'wisp') douse(m, 15);
  else ignite(m, k === 'spike' ? 10 : 15, step);
}
function ignite(m, amt, relayStep) {
  m.fx = 'ignited'; m.fxT = 0;
  if (m.marks > 0) {
    m.marks++; m.markT = 0;
    if (m.marks >= 5) { runaway(m); return; }
  } else {
    m.rage = Math.min(100, m.rage + amt);
    if (m.rage >= 100) { m.rage = 100; m.marks = 1; m.markT = 0; m.slow = false; }
  }
  if (relayStep > 0 && m.state === 'roam' && m.rage >= m.redLow && !m.pend && S.t - m.lastRelay >= 1.5) {
    m.pend = { t: 0.3, step: relayStep + 1 };
  }
}
function douse(m, amt) {
  m.fx = 'doused'; m.fxT = 0;
  if (m.marks > 0) {
    m.marks--; m.markT = 0;
    if (m.marks === 0) m.slow = true;
  } else m.rage = Math.max(0, m.rage - amt);
}
function runaway(m) {
  m.marks = 0; m.markT = 0; m.slow = false; m.pend = null; m.dashing = false;
  var side = m.y < 630 ? 'top' : 'bottom';
  var seg = clamp(Math.floor((m.x - 60) / 100), 0, 5);
  m.state = 'charge';
  m.chg = { side: side, seg: seg, run: true, t: 0, tx: 110 + 100 * seg, ty: side === 'top' ? 300 : 960 };
}
function sFloorTrigger(m, ci) {
  var kind = S.floors[ci];
  S.floorFx[ci] = { t: 0 };
  m.lastTrig[ci] = S.t;
  if (kind === 'chili') ignite(m, 15, 0);
  else if (kind === 'ice') douse(m, 20);
  else if (kind === 'stage') { if (m.rage >= 50) perform(m, 1); }
  else if (kind === 'spring') startFly(m);
}
function startFly(m) {
  var tg = nearestOther(m), tx = 360, ty = 630;
  if (tg) { tx = tg.x; ty = tg.y; }
  var d = dist(m.x, m.y, tx, ty);
  if (d > 360) { tx = m.x + (tx - m.x) / d * 360; ty = m.y + (ty - m.y) / d * 360; }
  tx = clamp(tx, 100, 620); ty = clamp(ty, 310, 950);
  m.state = 'fly'; m.dashing = false;
  m.fly = { t: 0, sx: m.x, sy: m.y, tx: tx, ty: ty };
}
function landFly(m) {
  m.x = m.fly.tx; m.y = m.fly.ty; m.state = 'roam'; m.fly = null;
  S.slam.push({ x: m.x, y: m.y, t: 0, dur: 0.4 });
  var o = liveOthers(m);
  for (var i = 0; i < o.length; i++) if (dist(m.x, m.y, o[i].x, o[i].y) <= 110) ignite(o[i], 12, 1);
}

function showMove(m, vx, vy, spd, dt) {
  var l = Math.sqrt(vx * vx + vy * vy);
  if (l < 1e-6) return;
  m.x += vx / l * spd * dt; m.y += vy / l * spd * dt;
  if (Math.abs(vx) > 0.01) m.dir = vx > 0 ? 1 : -1;
}
function showWander(m, spd, dt) {
  m.wdT -= dt;
  if (m.wdT <= 0) { m.wdT = rnd(2, 3); var a = rnd(0, 6.283); m.vx = Math.cos(a); m.vy = Math.sin(a); }
  showMove(m, m.vx, m.vy, spd, dt);
}
function clampArena(m) { m.x = clamp(m.x, 100, 620); m.y = clamp(m.y, 310, 950); }

function moveShowMon(m, dt) {
  var others = liveOthers(m), ice = m.inIce ? 0.6 : 1, sp = m.sp, i, o;
  m.dashing = false;
  if (sp === 'spike') {
    m.rollT -= dt;
    if (m.rollT <= 0 || (m.vx === 0 && m.vy === 0)) { m.rollT = 4; var a = rnd(0, 6.283); m.vx = Math.cos(a); m.vy = Math.sin(a); }
    showMove(m, m.vx, m.vy, 110 * ice, dt);
    if (m.x < 100) { m.x = 100; m.vx = Math.abs(m.vx); } if (m.x > 620) { m.x = 620; m.vx = -Math.abs(m.vx); }
    if (m.y < 310) { m.y = 310; m.vy = Math.abs(m.vy); } if (m.y > 950) { m.y = 950; m.vy = -Math.abs(m.vy); }
    return;
  }
  if (sp === 'thunder') {
    if (m.dashT > 0) {
      m.dashing = true;
      m.dashT -= dt;
      var tg = m.hunt;
      showMove(m, m.dvx, m.dvy, 600, dt);
      if (tg && tg.state === 'roam' && dist(m.x, m.y, tg.x, tg.y) <= 25) m.dashT = 0;
    } else {
      m.dashCd -= dt;
      if (m.dashCd <= 0 && others.length) {
        o = pick(others); m.hunt = o; m.dashCd = 2; m.dashT = 0.3;
        var dd = dist(m.x, m.y, o.x, o.y) || 1;
        m.dvx = (o.x - m.x) / dd; m.dvy = (o.y - m.y) / dd;
      } else if (m.dashCd <= 0) m.dashCd = 2;
    }
    return;
  }
  if (sp === 'ghost') {
    m.warpT -= dt;
    if (m.warpT <= 0) {
      m.warpT = 3;
      if (others.length) { o = pick(others); var an = rnd(0, 6.283); m.x = o.x + Math.cos(an) * 100; m.y = o.y + Math.sin(an) * 100; }
    }
    if (!others.length) showWander(m, 50 * ice, dt);
    return;
  }
  if (!others.length) { showWander(m, 50 * ice, dt); return; }
  if (sp === 'fire') {
    if (m.awayT > 0) {
      m.awayT -= dt;
      if (m.lastTouch) showMove(m, m.x - m.lastTouch.x, m.y - m.lastTouch.y, 75 * ice, dt);
      return;
    }
    if (!m.hunt || m.hunt.state !== 'roam' || m.hunt === m) {
      var cand = others.filter(function (q) { return q !== m.lastTouch; });
      if (!cand.length) cand = others;
      m.hunt = pick(cand);
    }
    showMove(m, m.hunt.x - m.x, m.hunt.y - m.y, 75 * ice, dt);
    if (dist(m.x, m.y, m.hunt.x, m.hunt.y) <= 70) {
      m.lastTouch = m.hunt; m.hunt = null;
      if (others.length === 1) m.awayT = 1;
    }
  } else if (sp === 'water') {
    m.orbitT -= dt;
    if (m.orbitT <= 0 || !m.center || m.center.state !== 'roam' || m.center === m) { m.center = nearestOther(m); m.orbitT = 5; }
    var c = m.center, d = dist(m.x, m.y, c.x, c.y) || 1;
    var rx = (m.x - c.x) / d, ry = (m.y - c.y) / d;
    var vx = -ry * 70, vy = rx * 70;
    var rad = clamp(200 - d, -70, 70);
    vx += rx * rad; vy += ry * rad;
    showMove(m, vx, vy, Math.min(70, Math.sqrt(vx * vx + vy * vy)) * ice, dt);
  } else if (sp === 'stone') {
    var n = nearestOther(m);
    if (n) showMove(m, n.x - m.x, n.y - m.y, 35 * ice, dt);
  }
}

function updateShowMon(m, dt) {
  var i;
  if (m.fx !== 'none') { m.fxT += dt; if (m.fxT >= 0.5) { m.fx = 'none'; m.fxT = 0; } }
  if (m.performT < 0.5) m.performT += dt;
  if (m.state === 'fly') {
    m.fly.t += dt;
    var k = Math.min(1, m.fly.t / 0.4);
    m.x = m.fly.sx + (m.fly.tx - m.fly.sx) * k; m.y = m.fly.sy + (m.fly.ty - m.fly.sy) * k;
    if (m.fly.t >= 0.4) landFly(m);
    return;
  }
  if (m.state === 'charge') { updateCharge(m, dt); return; }
  if (m.state === 'loose') { updateLoose(m, dt); return; }
  // 怒氣
  if (m.marks > 0) {
    m.rage = 100;
    m.markT += dt;
    if (m.markT >= 4) { m.marks--; m.markT = 0; if (m.marks === 0) m.slow = true; }
  } else if (m.slow) {
    m.rage -= 2 * dt;
    if (m.rage < m.redLow) m.slow = false;
  } else {
    m.rage = Math.max(0, m.rage - DECAY[m.sp] * dt);
  }
  // 移動、地板
  m.inIce = S.floors[m.cell] === 'ice';
  moveShowMon(m, dt);
  clampArena(m);
  var ci = cellOf(m.x, m.y);
  if (ci !== m.cell) {
    m.cell = ci;
    if (S.floors[ci] && (m.lastTrig[ci] === undefined || S.t - m.lastTrig[ci] >= 2)) {
      sFloorTrigger(m, ci);
      if (m.state !== 'roam') return;
    }
  }
  // 接演
  if (m.pend) {
    m.pend.t -= dt;
    if (m.pend.t <= 0) { var st = m.pend.step; m.pend = null; m.lastRelay = S.t; perform(m, st); }
  }
  // 定時表演
  if (m.rage >= 50 && m.state === 'roam') {
    m.perfCd -= dt;
    if (m.perfCd <= 0) perform(m, 1);
  }
}
function updateCharge(m, dt) {
  var c = m.chg;
  if (c.run) {
    var d = dist(m.x, m.y, c.tx, c.ty);
    var s = 160 * dt;
    if (d <= s) { m.x = c.tx; m.y = c.ty; c.run = false; c.t = 0; }
    else { m.x += (c.tx - m.x) / d * s; m.y += (c.ty - m.y) / d * s; }
    if (c.run === false && S.broken[c.side][c.seg]) { toLoose(m); }
    return;
  }
  c.t += dt;
  if (c.t >= 1.5) { S.broken[c.side][c.seg] = true; toLoose(m); }
}
function toLoose(m) {
  var side = m.chg.side;
  m.state = 'loose'; m.chg = null;
  m.y = side === 'top' ? 190 : 1080;
  m.loose = { t: 0, side: side, dx: m.x < 360 ? 1 : -1, atk: 0 };
}
function updateLoose(m, dt) {
  var L = m.loose;
  L.t += dt; L.atk += dt;
  m.x += L.dx * 140 * dt; m.dir = L.dx;
  if (m.x < 80) { m.x = 80; L.dx = 1; } if (m.x > 640) { m.x = 640; L.dx = -1; }
  if (L.atk >= 1.5) {
    L.atk = 0;
    var row = S.vis[L.side], best = -1, bd = 1e9;
    for (var i = 0; i < 6; i++) {
      if (row[i].mode !== 'watch') continue;
      var d = Math.abs(110 + 100 * i - m.x);
      if (d < bd) { bd = d; best = i; }
    }
    if (best >= 0 && bd <= 100) {
      row[best].mode = 'scared'; row[best].t = 0;
      G.rep = Math.max(0, G.rep - 3);
      addFloat(m.x, m.y - 50, '名聲 −3', 'repDown');
    }
  }
  if (L.t >= 6) {
    m.state = 'roam'; m.loose = null; m.x = 360; m.y = 630; m.rage = 30; m.marks = 0; m.markT = 0; m.slow = false;
    m.cell = cellOf(m.x, m.y); m.pend = null;
  }
}

function updateShow(dt) {
  S.t += dt;
  var i, j, m, ms = S.mons;
  for (i = 0; i < ms.length; i++) updateShowMon(ms[i], dt);
  // 相撞挑釁
  for (i = 0; i < ms.length; i++) for (j = i + 1; j < ms.length; j++) {
    var a = ms[i], b = ms[j];
    if (a.state !== 'roam' || b.state !== 'roam') continue;
    if (dist(a.x, a.y, b.x, b.y) > 70) continue;
    var key = a.id + '-' + b.id;
    if (S.pairs[key] !== undefined && S.t - S.pairs[key] < 2) continue;
    S.pairs[key] = S.t;
    taunt(a); taunt(b);
  }
  updateHazards(dt);
  for (var k in S.floorFx) { S.floorFx[k].t += dt; if (S.floorFx[k].t >= 0.4) delete S.floorFx[k]; }
  for (i = S.slam.length - 1; i >= 0; i--) { S.slam[i].t += dt; if (S.slam[i].t >= 0.4) S.slam.splice(i, 1); }
  var sides = ['top', 'bottom'];
  for (i = 0; i < 2; i++) for (j = 0; j < 6; j++) {
    var v = S.vis[sides[i]][j];
    if (v.mode === 'scared' || v.mode === 'empty') {
      v.t += dt;
      if (v.t >= 4) { v.mode = 'watch'; v.t = 0; } else if (v.t >= 1) v.mode = 'empty';
    }
  }
  for (i = G.floats.length - 1; i >= 0; i--) { G.floats[i].t += dt; if (G.floats[i].t >= G.floats[i].dur) G.floats.splice(i, 1); }
  if (S.t >= 45) endShow();
}
function taunt(m) {
  if (m.rage >= 100) return;
  m.fx = 'ignited'; m.fxT = 0;
  m.rage = Math.min(100, m.rage + 8);
  if (m.rage >= 100) { m.rage = 100; m.marks = 1; m.markT = 0; m.slow = false; }
}
function endShow() {
  var i, m;
  for (i = 0; i < S.hz.length; i++) killH(S.hz[i]);
  S.hz = [];
  for (i = 0; i < S.mons.length; i++) {
    m = S.mons[i];
    if (m.state === 'charge' || m.state === 'loose') { G.rep = Math.max(0, G.rep - 5); }
  }
  G.rep = Math.max(0, G.rep);
  G.floors = [];
  if (G.day >= 7) {
    var stars = G.rep >= 900 ? 3 : (G.rep >= 550 ? 2 : (G.rep >= 250 ? 1 : 0));
    G.result = { rep: G.rep, goldEarned: G.goldEarned, bestChain: G.bestChain, roster: G.roster.map(function (r) { return { species: r.sp, level: r.level }; }), stars: stars };
    setPhase('result');
  } else { G.shopCur = 0; setPhase('shop'); }
}

/* =====================================================================
   選擇 / 布置 / 商店 的按鍵處理
   ===================================================================== */
function unlockInfo(key) {
  var u = UNLOCK[key];
  var ok = G.gold >= u.gold && G.captured[u.sp] >= u.n;
  return { ok: ok, text: '金幣 ' + u.gold + ' + 收服' + SP_NAME[u.sp] + ' ' + Math.min(G.captured[u.sp], u.n) + '/' + u.n };
}
function handleSelect(k) {
  if (k === 'up') G.selCur = (G.selCur + 2) % 3;
  else if (k === 'down') G.selCur = (G.selCur + 1) % 3;
  else if (k === 'z') {
    var key = DKEYS[G.selCur];
    if (G.open[key]) startDungeon(key);
    else { var u = unlockInfo(key); if (u.ok) { G.gold -= UNLOCK[key].gold; G.open[key] = true; } }
  } else if (k === 'x') openGuide('select');
}
function openGuide(ret) { G.guideReturn = ret; G.guidePage = 0; G.phase = 'guide'; }
function handleGuide(k) {
  if (k === 'z' || k === 'right') {
    if (G.guidePage < 4) G.guidePage++;
    else { var r = G.guideReturn; G.guideReturn = null; G.guidePage = 0; setPhase(r || 'select'); }
  } else if (k === 'left') { if (G.guidePage > 0) G.guidePage--; }
  else if (k === 'x' && G.guideReturn) { var r2 = G.guideReturn; G.guideReturn = null; G.guidePage = 0; setPhase(r2); }
}
function handleSetup1(k) {
  var n = G.roster.length, c = G.s1Cur;
  if (k === 'left') { if (c < n && c % 2 === 1) c--; }
  else if (k === 'right') { if (c < n - 1 && c % 2 === 0) c++; }
  else if (k === 'down') { if (c < n) c = (c + 2 < n) ? c + 2 : n; }
  else if (k === 'up') { if (c === n) c = n - 1; else if (c - 2 >= 0) c -= 2; }
  else if (k === 'z') {
    if (c < n) {
      var sp = G.roster[c].sp, i = G.picked.indexOf(sp);
      if (i >= 0) G.picked.splice(i, 1); else if (G.picked.length < 4) G.picked.push(sp);
    } else if (G.picked.length >= 1) { enterSetup2(); return; }
  }
  G.s1Cur = c;
}
function panelOptions(ci) {
  var cur = G.floors[ci], refund = cur ? FLOOR_COST[cur] : 0, out = [];
  for (var i = 0; i < FLOORS.length; i++) {
    var f = FLOORS[i];
    out.push({ type: 'floor', key: f.key, name: f.name, cost: f.cost, desc: f.desc, affordable: G.gold + refund >= f.cost });
  }
  out.push({ type: 'clear', key: 'clear', name: '清空', cost: 0, desc: '', affordable: true });
  return out;
}
function setFloor(ci, key) {
  var cur = G.floors[ci];
  if (cur) { G.gold += FLOOR_COST[cur]; G.floors[ci] = null; }
  if (key) { G.gold -= FLOOR_COST[key]; G.floors[ci] = key; }
}
function handleSetup2(k) {
  var cur = G.s2Cur;
  if (G.panel) {
    var opts = panelOptions(cur);
    if (k === 'up') G.panel.index = (G.panel.index + opts.length - 1) % opts.length;
    else if (k === 'down') G.panel.index = (G.panel.index + 1) % opts.length;
    else if (k === 'x') G.panel = null;
    else if (k === 'z') {
      var o = opts[G.panel.index];
      if (!o.affordable) return;
      if (o.type === 'clear') setFloor(cur, null); else setFloor(cur, o.key);
      G.panel = null;
    }
    return;
  }
  if (cur === 12) {
    if (k === 'up') G.s2Cur = 9;
    else if (k === 'z') startShow();
    else if (k === 'x') { floorsRefundAll(); G.show = null; setPhase('setup1'); }
    return;
  }
  var c = cur % 3, r = Math.floor(cur / 3);
  if (k === 'left') { if (c > 0) G.s2Cur--; }
  else if (k === 'right') { if (c < 2) G.s2Cur++; }
  else if (k === 'up') { if (r > 0) G.s2Cur -= 3; }
  else if (k === 'down') { if (r < 3) G.s2Cur += 3; else G.s2Cur = 12; }
  else if (k === 'z') G.panel = { index: 0 };
  else if (k === 'x') setFloor(cur, null);
}
function shopCost(item) {
  if (WEAPONS[item]) return WEAPONS[item].price;
  return G.price[item];
}
function handleShop(k) {
  var c = G.shopCur;
  if (k === 'up') G.shopCur = (c + 7) % 8;
  else if (k === 'down') G.shopCur = (c + 1) % 8;
  else if (k === 'x') openGuide('shop');
  else if (k === 'z') {
    if (c === 7) { G.day++; setPhase('select'); return; }
    var it = SHOP_ITEMS[c];
    if (WEAPONS[it]) {
      if (G.owned[it]) G.weapon = it;
      else if (G.gold >= WEAPONS[it].price) { G.gold -= WEAPONS[it].price; G.owned[it] = true; G.weapon = it; }
    } else {
      var p = G.price[it];
      if (G.gold >= p) {
        G.gold -= p;
        G.price[it] = Math.round(p * 1.5);
        if (it === 'attack') G.atk++; else if (it === 'armor') G.armor++; else G.bag++;
      }
    }
  }
}
function handleResult(k) {
  if (k === 'z') { G = newGame(); G.phase = 'select'; }
}

/* =====================================================================
   主更新
   ===================================================================== */
function update(dt) {
  var q = pressQ; pressQ = [];
  var ph = G.phase, i;
  if (ph === 'dungeon') {
    pressQ = q; // updateDungeon 內讀取
    updateDungeon(dt);
    pressQ = [];
    // 離開 dungeon 時沒用掉的按鍵丟掉(避免同幀轉場後被當成下一畫面的動作)
  } else if (ph === 'show') {
    updateShow(dt);
  } else {
    for (i = 0; i < q.length; i++) {
      var k = q[i];
      if (G.phase !== ph) break; // 同幀轉場後, 後面的鍵丟掉
      if (ph === 'guide') handleGuide(k);
      else if (ph === 'select') handleSelect(k);
      else if (ph === 'setup1') handleSetup1(k);
      else if (ph === 'setup2') handleSetup2(k);
      else if (ph === 'shop') handleShop(k);
      else if (ph === 'result') handleResult(k);
    }
    if (G.phase === 'setup2' && G.show) {
      // 布置畫面魔物靜止
    }
    for (i = G.floats.length - 1; i >= 0; i--) { G.floats[i].t += dt; if (G.floats[i].t >= G.floats[i].dur) G.floats.splice(i, 1); }
  }
  if (ph === 'dungeon') {
    for (i = G.floats.length - 1; i >= 0; i--) { G.floats[i].t += dt; if (G.floats[i].t >= G.floats[i].dur) G.floats.splice(i, 1); }
  }
}

/* =====================================================================
   繪製
   ===================================================================== */
function hudState(extra) {
  var h = {
    phase: G.phase, day: G.day, dayMax: 7, gold: G.gold, rep: G.rep, hearts: 0, maxHearts: 0, ropes: 0, ropeMax: 0,
    weapon: G.weapon, xCdLeft: 0, xCdMax: 0, timeLeft: 0, timeMax: 0, dungeon: '', message: ''
  };
  for (var k in extra) h[k] = extra[k];
  return h;
}
function drawFloats() {
  for (var i = 0; i < G.floats.length; i++) Art.drawFloatText(ctx, G.floats[i]);
}

function renderGuide() {
  Art.drawBackground(ctx, {});
  var p = G.guidePage;
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 54px sans-serif';
  ctx.fillText('第 ' + (p + 1) + ' 頁 ' + GUIDE[p][0], 360, 190);
  ctx.font = '36px sans-serif';
  ctx.fillText(GUIDE[p][1], 360, 260);
  ctx.restore();
  Art.drawGuidePage(ctx, { page: p + 1, x: 60, y: 320, w: 600, h: 700 });
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
  ctx.font = '30px sans-serif';
  ctx.fillText((p + 1) + ' / 5', 360, 1090);
  ctx.font = '26px sans-serif';
  ctx.fillText('按 Z 繼續' + (p > 0 ? '　← 上一頁' : ''), 360, 1150);
  ctx.restore();
}

function renderSelect() {
  Art.drawBackground(ctx, {});
  for (var i = 0; i < 3; i++) {
    var key = DKEYS[i], open = G.open[key];
    Art.drawDungeonCard(ctx, { x: 360, y: 330 + 310 * i, dungeon: key, open: open, condition: open ? '' : unlockInfo(key).text, selected: G.selCur === i });
  }
  Art.drawHud(ctx, hudState({ message: '↑↓ 選擇 Z 進入' }));
}

function renderDungeon() {
  Art.drawBackground(ctx, {});
  var r, c, i, m, h, t = D.tamer;
  for (r = 0; r < 19; r++) for (c = 0; c < 12; c++) {
    var tl = D.tiles[r][c];
    Art.drawTile(ctx, { x: c * 60 + 30, y: r * 60 + 30 + 130, dungeon: D.key, kind: tl.kind, room: tl.room, nest: tl.nest });
  }
  function hz(h) {
    Art.drawHazard(ctx, { x: h.x, y: h.y + 130, kind: h.kind, phase: h.phase, radius: h.radius, t: h.t, dur: h.dur, angle: h.angle, reflected: h.reflected });
  }
  for (i = 0; i < D.hz.length; i++) if (D.hz[i].phase !== 'fly') hz(D.hz[i]);
  for (i = 0; i < D.mons.length; i++) {
    m = D.mons[i];
    var warn = m.castFlash > 0;
    for (var k = 0; k < D.hz.length; k++) if (D.hz[k].owner === m && D.hz[k].phase === 'warn') warn = true;
    Art.drawWildMonster(ctx, {
      x: m.x, y: m.y + 130, species: m.sp, hp: m.hp, maxHp: m.maxHp, hit: m.hit > 0, weak: isWeak(m),
      stunLeft: Math.max(0, m.stun), stunDur: 2, lassoed: m.lassoed, casting: warn, dashing: m.dashT > 0, dir: m.dir
    });
  }
  if (D.ring) Art.drawCaptureRing(ctx, { x: D.ring.mon.x, y: D.ring.mon.y + 130, t: D.ring.t, dur: captureTime() });
  if (D.lasso) {
    var L = D.lasso;
    Art.drawLasso(ctx, { x1: t.x, y1: t.y + 130, x2: L.mon.x, y2: L.mon.y + 130, progress: Math.min(1, Math.abs(L.sum) / (2 * Math.PI)),
      t: L.t, limit: 5 + bonus('ghost'), len: dist(t.x, t.y, L.mon.x, L.mon.y), maxLen: 220 });
  }
  Art.drawTamer(ctx, { x: t.x, y: t.y + 130, facing: t.facing, weapon: G.weapon, dashing: !!t.dash, blink: t.invul > 0, lassoing: !!D.lasso });
  for (i = 0; i < D.hz.length; i++) if (D.hz[i].phase === 'fly') hz(D.hz[i]);
  for (i = 0; i < D.fx.length; i++) {
    var f = D.fx[i];
    Art.drawWeaponFx(ctx, { x: f.x, y: f.y + 130, weapon: f.weapon, move: f.move, shape: f.shape, angle: f.angle, spread: f.spread, radius: f.radius, length: f.length, width: f.width, t: f.t, dur: f.dur });
  }
  drawFloats();
  var msg = 'Z 攻擊 X 武器技';
  if (D.lasso) msg = '繞牠一圈!'; else if (D.ring) msg = '站住別動';
  var xmax = WEAPONS[G.weapon].xCd * Math.max(0, 1 - 0.15 * bonus('spike'));
  Art.drawHud(ctx, hudState({ hearts: t.hearts, maxHearts: t.maxHearts, ropes: D.ropes, ropeMax: D.ropeMax, xCdLeft: Math.max(0, t.xCd), xCdMax: G.weapon === 'club' ? 0 : xmax,
    timeLeft: Math.max(0, D.time), timeMax: 60, dungeon: D.key, message: msg }));
}

function showMonState(m) {
  var mode = m.state === 'roam' ? 'roam' : m.state;
  var st = {
    x: m.x, y: m.y, species: m.sp, level: m.level, rage: m.rage, redLow: m.redLow, marks: Math.min(4, m.marks),
    markLeft: m.marks > 0 ? Math.max(0, 4 - m.markT) : 0, markDur: 4, mode: mode,
    performing: m.performT < 0.5, performT: m.performT < 0.5 ? m.performT : 0, performDur: 0.5,
    fx: m.fx, fxT: m.fx === 'none' ? 0 : m.fxT, fxDur: 0.5, flyT: 0, flyDur: 0.4, chargeT: 0, chargeDur: 1.5, looseT: 0, looseDur: 6,
    dashing: m.dashing, dir: m.dir
  };
  if (m.state === 'fly') st.flyT = m.fly.t;
  if (m.state === 'charge') st.chargeT = m.chg.run ? 0 : m.chg.t;
  if (m.state === 'loose') st.looseT = m.loose.t;
  return st;
}
function renderArena(floors, floorFx, setup) {
  Art.drawShowArena(ctx, {});
  var i;
  for (i = 0; i < 12; i++) {
    if (!floors[i]) continue;
    var p = cellCenter(i), fx = floorFx && floorFx[i];
    Art.drawFloorTile(ctx, { x: p.x, y: p.y, kind: floors[i], fired: !!fx, firedT: fx ? fx.t : 0, firedDur: 0.4 });
  }
  if (setup) for (i = 0; i < 12; i++) { var q = cellCenter(i); Art.drawSetupCell(ctx, { x: q.x, y: q.y, selected: G.s2Cur === i && !G.panel }); }
}
function renderFencesVisitors(broken, vis) {
  var sides = ['top', 'bottom'], i, j;
  for (i = 0; i < 2; i++) for (j = 0; j < 6; j++) {
    var s = sides[i];
    Art.drawFence(ctx, { x: 110 + 100 * j, y: s === 'top' ? 255 : 1005, side: s, broken: !!(broken && broken[s][j]) });
  }
  for (i = 0; i < 2; i++) for (j = 0; j < 6; j++) {
    var s2 = sides[i];
    Art.drawVisitor(ctx, { x: 110 + 100 * j, y: s2 === 'top' ? 190 : 1080, side: s2, mode: vis ? vis[s2][j].mode : 'watch' });
  }
}

function renderShow() {
  renderArena(S.floors, S.floorFx, false);
  var i;
  for (i = 0; i < S.slam.length; i++) Art.drawSlamFx(ctx, { x: S.slam[i].x, y: S.slam[i].y, radius: 110, t: S.slam[i].t, dur: 0.4 });
  for (i = 0; i < S.hz.length; i++) {
    var h = S.hz[i];
    Art.drawHazard(ctx, { x: h.x, y: h.y, kind: h.kind, phase: h.phase, radius: h.radius, t: h.t, dur: h.dur, angle: h.angle, reflected: h.reflected });
  }
  for (i = 0; i < S.mons.length; i++) Art.drawShowMonster(ctx, showMonState(S.mons[i]));
  renderFencesVisitors(S.broken, S.vis);
  drawFloats();
  Art.drawHud(ctx, hudState({ timeLeft: Math.max(0, 45 - S.t), timeMax: 45, message: '表演中…' }));
}

function renderSetup1() {
  Art.drawBackground(ctx, {});
  var n = G.roster.length, i;
  for (i = 0; i < n; i++) {
    var r = G.roster[i];
    Art.drawRosterCard(ctx, { x: 195 + 330 * (i % 2), y: 300 + 230 * Math.floor(i / 2), species: r.sp, level: r.level, picked: G.picked.indexOf(r.sp) >= 0, selected: G.s1Cur === i });
  }
  Art.drawButton(ctx, { x: 160, y: 1100, w: 400, h: 100, label: '下一步', selected: G.s1Cur === n });
  Art.drawHud(ctx, hudState({ message: '方向鍵選 Z 上場/下場' }));
}

function renderSetup2() {
  renderArena(G.floors, null, true);
  var i, cnt = 0;
  for (i = 0; i < 12; i++) if (G.floors[i]) cnt++;
  for (i = 0; i < G.show.mons.length; i++) Art.drawShowMonster(ctx, showMonState(G.show.mons[i]));
  renderFencesVisitors(null, null);
  Art.drawSetupInfo(ctx, { x: 260, y: 1210, gold: G.gold, floors: cnt });
  Art.drawButton(ctx, { x: 480, y: 1160, w: 180, h: 100, label: '開演', selected: G.s2Cur === 12 });
  var msg = '方向鍵選格子 Z 鋪地板 X 清空';
  if (G.panel) {
    Art.drawPickerPanel(ctx, { options: panelOptions(G.s2Cur), index: G.panel.index });
    msg = '↑↓ 選 Z 確定 X 取消';
  } else if (G.s2Cur === 12) msg = 'Z 開演 X 回上一步';
  Art.drawHud(ctx, hudState({ message: msg }));
}

function renderShop() {
  Art.drawBackground(ctx, {});
  for (var i = 0; i < 7; i++) {
    var it = SHOP_ITEMS[i], isW = !!WEAPONS[it];
    var lv = it === 'attack' ? G.atk : (it === 'armor' ? G.armor : (it === 'ropeBag' ? G.bag : 0));
    var cost = shopCost(it);
    Art.drawShopItem(ctx, { x: 360, y: 200 + 125 * i, item: it, cost: cost, level: lv, owned: isW ? !!G.owned[it] : false,
      equipped: isW && G.weapon === it, affordable: G.gold >= cost, selected: G.shopCur === i });
  }
  Art.drawButton(ctx, { x: 160, y: 1110, w: 400, h: 100, label: '出發', selected: G.shopCur === 7 });
  Art.drawHud(ctx, hudState({ message: '↑↓ 選擇 Z 購買/裝備' }));
}

function renderResult() {
  Art.drawBackground(ctx, {});
  Art.drawResultPanel(ctx, G.result);
  Art.drawHud(ctx, hudState({ message: '' }));
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, CW, CH);
  switch (G.phase) {
    case 'guide': renderGuide(); Art.drawHud(ctx, hudState({ message: '' })); break;
    case 'select': renderSelect(); break;
    case 'dungeon': renderDungeon(); break;
    case 'setup1': renderSetup1(); break;
    case 'setup2': renderSetup2(); break;
    case 'show': renderShow(); break;
    case 'shop': renderShop(); break;
    case 'result': renderResult(); break;
  }
}

/* ---------- 主迴圈 ---------- */
var last = 0;
function frame(ts) {
  var dt = last ? (ts - last) / 1000 : 0;
  last = ts;
  if (dt > 1 / 30) dt = 1 / 30;
  try { update(dt); render(); } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

})();
