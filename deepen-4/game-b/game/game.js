/* 後台燈控怪獸秀 — 玩法驗證 Demo。邏輯與繪製分離: update 改狀態, render 呼叫 Art.drawXxx */
(function () {
'use strict';

// ================= 基本設定 =================
var W = 1280, H = 720;
if (typeof Art !== 'undefined' && Art.canvas) { W = Art.canvas.width; H = Art.canvas.height; }
var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
function fitCanvas() {
  var dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

// 美術沒有的圖形用佔位, 集中在這裡(目前沒有需要的)
var Placeholder = {};

var PI = Math.PI, TAU = Math.PI * 2;
function rand(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function normAng(a) { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; }
function dist(ax, ay, bx, by) { return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); }
function dirTo(ax, ay, bx, by) {
  var dx = bx - ax, dy = by - ay, d = Math.sqrt(dx * dx + dy * dy);
  if (d < 1) { var a = Math.random() * TAU; return { x: Math.cos(a), y: Math.sin(a), d: 0 }; }
  return { x: dx / d, y: dy / d, d: d };
}

// ================= 資料表 =================
var DAYS = 7;
var OFFX = 40, OFFY = 110;
var SPECIES = {
  cat:    { name: '炸毛貓', hp: 7,  skill: 'claw',      interval: 2.8, decl: 2,   gold: 2, rep: 1, kill: 3 },
  turtle: { name: '泡泡龜', hp: 8,  skill: 'bubble',    interval: 3.0, decl: 2.5, gold: 1, rep: 1, kill: 3 },
  boar:   { name: '熔岩豬', hp: 14, skill: 'lava',      interval: 2.6, decl: 2,   gold: 2, rep: 1, kill: 5 },
  monkey: { name: '溫泉猴', hp: 12, skill: 'splash',    interval: 2.2, decl: 3,   gold: 2, rep: 1, kill: 5 },
  fox:    { name: '流星狐', hp: 16, skill: 'beam',      interval: 2.6, decl: 3,   gold: 3, rep: 2, kill: 7 },
  owl:    { name: '月光鴞', hp: 18, skill: 'sleepwave', interval: 3.0, decl: 1.5, gold: 3, rep: 2, kill: 8 }
};
var NEST_SPECIES = { k: 'cat', u: 'turtle', p: 'boar', m: 'monkey', x: 'fox', w: 'owl' };
var DUNGEONS = [
  { id: 'bamboo', name: '竹林', left: 'cat', right: 'turtle', need: null, map: [
    '####################',
    '#.......#..#.......#',
    '#.k..o..#..#..u....#',
    '#....o..#..#....WW.#',
    '#..................#',
    '#..o...............#',
    '#.......#..#..o....#',
    '#.WW.k..#..#.....u.#',
    '#.......#.S#.......#',
    '####################'] },
  { id: 'volcano', name: '溫泉火山', left: 'boar', right: 'monkey', need: { gold: 60, species: 'turtle', n: 2 }, map: [
    '####################',
    '#.......#..#.......#',
    '#.p...L.#..#.WW..m.#',
    '#..L....#..#.WW....#',
    '#..................#',
    '#.....L.........o..#',
    '#.......#..#.......#',
    '#.L..p..#..#..m..W.#',
    '#.......#.S#.......#',
    '####################'] },
  { id: 'tower', name: '星空塔', left: 'fox', right: 'owl', need: { gold: 120, species: 'monkey', n: 2 }, map: [
    '####################',
    '#.......#..#.......#',
    '#.x.....#..#.....w.#',
    '#...o...#..#..L....#',
    '#.W................#',
    '#...............W..#',
    '#.L.....#..#...o...#',
    '#....x..#..#.w.....#',
    '#.......#.S#.......#',
    '####################'] }
];
var DEVICES = {
  spotlight:   { name: '聚光燈', hold: true,  range: 100, cost: 30 },
  mist:        { name: '冷霧',   hold: false, range: 120, cost: 30 },
  firecracker: { name: '爆竹',   hold: false, range: 120, cost: 25 },
  jar:         { name: '玻璃罩', hold: false, range: 100, cost: 35 },
  hook:        { name: '吊鉤',   hold: true,  range: 100, cost: 20 }
};
var DEVICE_ORDER = ['spotlight', 'mist', 'firecracker', 'jar', 'hook'];
var FACING_VEC = [
  { x: 0, y: -1 }, { x: 0.7071, y: -0.7071 }, { x: 1, y: 0 }, { x: 0.7071, y: 0.7071 },
  { x: 0, y: 1 }, { x: -0.7071, y: 0.7071 }, { x: -1, y: 0 }, { x: -0.7071, y: -0.7071 }
];
var DEG = PI / 180;
// 武器: z / x 的定義
var WEAPONS = {
  club:  { z: { shape: 'arc', spread: 100 * DEG, r: 70, dmg: 2, cd: 0.35 }, x: null },
  sword: { z: { shape: 'arc', spread: 120 * DEG, r: 80, dmg: 2, cd: 0.35, reflect: true },
           x: { kind: 'stun', shape: 'arc', spread: 120 * DEG, r: 80, cd: 3 } },
  spear: { z: { shape: 'line', len: 170, w: 40, dmg: 2, cd: 0.45 },
           x: { kind: 'dash', cd: 1.2, dmg: 3 } },
  whip:  { z: { shape: 'circle', r: 100, dmg: 1, cd: 0.4 },
           x: { kind: 'knock', shape: 'arc', spread: 100 * DEG, r: 170, dmg: 2, cd: 1.2 } }
};
var WEAPON_ORDER = ['club', 'sword', 'spear', 'whip'];
var MR = 24;          // 地下城魔物身體判定半徑(武器、打回的泡泡用)
var SHOW_BUBBLE_R = 26; // 表演場泡泡對魔物的身體判定半徑
var START_POS = [[300, 260], [980, 260], [300, 460], [980, 460]];
var SHOP_ITEMS = ['club', 'sword', 'spear', 'whip', 'attack', 'armor', 'ropeBag', 'firecracker', 'jar', 'hook'];
var SHOP_BASE = { club: 0, sword: 60, spear: 60, whip: 60, attack: 50, armor: 40, ropeBag: 40, firecracker: 40, jar: 40, hook: 50 };
var SHOP_DESC_NOTE = true;

// 地圖解析
function parseMap(d) {
  var tiles = [], nests = [], start = { x: 0, y: 0 };
  for (var r = 0; r < 10; r++) {
    var row = [];
    for (var c = 0; c < 20; c++) {
      var ch = d.map[r].charAt(c);
      var kind = 'floor';
      if (ch === '#') kind = 'wall'; else if (ch === 'o') kind = 'pillar';
      else if (ch === 'L') kind = 'hurt'; else if (ch === 'W') kind = 'slow';
      var room = (c >= 1 && c <= 7) ? 'left' : ((c >= 12 && c <= 18) ? 'right' : 'hall');
      var nest = false;
      if (NEST_SPECIES[ch]) {
        nest = true;
        nests.push({ species: NEST_SPECIES[ch], x: c * 60 + 30, y: r * 60 + 30, room: room, respawn: 0, mon: null });
      }
      if (ch === 'S') start = { x: c * 60 + 30, y: r * 60 + 30 };
      row.push({ kind: kind, room: room, nest: nest });
    }
    tiles.push(row);
  }
  return { tiles: tiles, nests: nests, start: start };
}
for (var di = 0; di < DUNGEONS.length; di++) DUNGEONS[di].parsed = parseMap(DUNGEONS[di]);

var ROOMS = {
  left:  { x0: 90, y0: 90, x1: 450, y1: 510 },
  right: { x0: 750, y0: 90, x1: 1110, y1: 510 }
};

// ================= 輸入(只用方向鍵 + Z、X) =================
var KEYMAP = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', KeyZ: 'z', KeyX: 'x' };
var KEYMAP2 = { z: 'z', Z: 'z', x: 'x', X: 'x' };
var held = {}, edge = {}, lock = {};
function down(k) { return !!held[k] && !lock[k]; }
function keyName(e) { return KEYMAP[e.code] || KEYMAP2[e.key] || null; }
window.addEventListener('keydown', function (e) {
  var k = keyName(e);
  if (!k) return;
  e.preventDefault();
  if (e.repeat) return;
  held[k] = true; lock[k] = false; edge[k] = true;
});
window.addEventListener('keyup', function (e) {
  var k = keyName(e);
  if (!k) return;
  e.preventDefault();
  held[k] = false; lock[k] = false;
});
window.addEventListener('blur', function () { held = {}; edge = {}; lock = {}; });
function clearEdges() { edge = {}; }

// ================= 全域狀態 =================
var S = null;       // 整局資料
var phase = 'guide';
var guidePage = 0;
var uid = 0;
var floats = [];
var DG = null;      // 地下城狀態
var SH = null;      // 表演場狀態
var SU = { cur: 0, step: 1 }; // 布置游標
var SELC = 0;       // 地下城選擇游標
var SHOPC = 0;      // 商店游標(0~9, 10 = 出發)
var RESULT = null;
var lastTs = 0;

function newGame() {
  S = {
    day: 1, gold: 30, rep: 0, goldEarned: 0, bestChain: 0,
    weapon: 'club', ownedW: { club: true },
    atk: 0, armor: 0, rope: 0,
    roster: { cat: 0, turtle: 0 }, order: ['cat', 'turtle'],
    picks: {},
    owned: { spotlight: true, mist: true },
    dev: { z: 'spotlight', x: 'mist' },
    open: [true, false, false],
    caps: { cat: 0, turtle: 0, boar: 0, monkey: 0, fox: 0, owl: 0 },
    price: { attack: 50, armor: 40, ropeBag: 40 },
    bought: { attack: 0, armor: 0, ropeBag: 0 }
  };
}
function lv(sp) { return S.roster[sp] === undefined ? 0 : S.roster[sp]; }
function maxHearts() { return 6 + S.armor + lv('turtle'); }
function maxRopes() { return 3 + S.rope; }
function tamerSpeed() { return 300 + 25 * lv('fox'); }

function go(p) {
  phase = p;
  edge = {};
  lock = {};
  for (var k in held) if (held[k]) lock[k] = true;
  floats = [];
}
function addFloat(x, y, text, kind) { floats.push({ x: x, y: y, text: text, kind: kind, t: 0, dur: 1 }); }
function updateFloats(dt) {
  for (var i = floats.length - 1; i >= 0; i--) { floats[i].t += dt; if (floats[i].t >= floats[i].dur) floats.splice(i, 1); }
}

// ================= 幾何 =================
function inArc(ox, oy, ang, spread, r, px, py, pr) {
  var dx = px - ox, dy = py - oy, d = Math.sqrt(dx * dx + dy * dy);
  if (d > r + pr) return false;
  if (d <= pr && pr > 0) return true;
  var a = normAng(Math.atan2(dy, dx) - ang);
  return Math.abs(a) <= spread / 2 + Math.asin(Math.min(1, pr / Math.max(d, 0.0001)));
}
function inRect(ox, oy, ang, len, w, px, py, pr) {
  var c = Math.cos(ang), s = Math.sin(ang);
  var lx = (px - ox) * c + (py - oy) * s, ly = -(px - ox) * s + (py - oy) * c;
  var cx = clamp(lx, 0, len), cy = clamp(ly, -w / 2, w / 2);
  return dist(lx, ly, cx, cy) <= pr;
}
function hazHit(h, px, py, pr) {
  switch (h.kind) {
    case 'claw': case 'splash': return inArc(h.x, h.y, h.angle, h.spread, h.radius, px, py, pr);
    case 'lava': return dist(h.x, h.y, px, py) <= h.radius + pr;
    case 'beam': return inRect(h.x, h.y, h.angle, h.length, h.width, px, py, pr);
    case 'sleepwave': return Math.abs(dist(h.x, h.y, px, py) - h.radius) <= 15 + pr;
    case 'bubble': return dist(h.x, h.y, px, py) <= 14 + pr;
  }
  return false;
}
function circleRect(x, y, r, rx, ry, rw, rh) {
  var cx = clamp(x, rx, rx + rw), cy = clamp(y, ry, ry + rh);
  return (x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r;
}

// ================= 地下城 =================
function curDungeon() { return DUNGEONS[DG.idx]; }
function tileAt(x, y) {
  var c = Math.floor(x / 60), r = Math.floor(y / 60);
  if (c < 0 || r < 0 || c > 19 || r > 9) return null;
  return DG.map.tiles[r][c];
}
function solidAt(c, r) {
  if (c < 0 || r < 0 || c > 19 || r > 9) return true;
  var k = DG.map.tiles[r][c].kind;
  return k === 'wall' || k === 'pillar';
}
function blockedAt(x, y, rad) {
  var c0 = Math.floor((x - rad) / 60), c1 = Math.floor((x + rad) / 60);
  var r0 = Math.floor((y - rad) / 60), r1 = Math.floor((y + rad) / 60);
  for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
    if (solidAt(c, r) && circleRect(x, y, rad, c * 60, r * 60, 60, 60)) return true;
  }
  return false;
}
// 移動馴獸師 dx,dy(分小步檢查, 可沿牆滑動); 回傳是否被擋
function tamerStep(dx, dy) {
  var T = DG.tamer, blocked = false;
  var len = Math.max(Math.abs(dx), Math.abs(dy)), n = Math.max(1, Math.ceil(len / 4));
  for (var i = 0; i < n; i++) {
    var sx = dx / n, sy = dy / n;
    if (sx !== 0) { if (!blockedAt(T.x + sx, T.y, 18)) T.x += sx; else blocked = true; }
    if (sy !== 0) { if (!blockedAt(T.x, T.y + sy, 18)) T.y += sy; else blocked = true; }
  }
  return blocked;
}

function startDungeon(idx) {
  var d = DUNGEONS[idx];
  DG = {
    idx: idx, map: d.parsed, time: 60,
    tamer: { x: d.parsed.start.x, y: d.parsed.start.y, facing: 0, hearts: maxHearts(), inv: 0, dash: null, cdZ: 0, cdX: 0 },
    monsters: [], hazards: [], fx: [], prep: null, lasso: null, ropes: maxRopes()
  };
  var nests = d.parsed.nests;
  for (var i = 0; i < nests.length; i++) { nests[i].respawn = 0; nests[i].mon = null; spawnWild(nests[i]); }
  go('dungeon');
}
function spawnWild(nest) {
  var sp = SPECIES[nest.species];
  var m = {
    id: ++uid, species: nest.species, x: nest.x, y: nest.y, hp: sp.hp, maxHp: sp.hp,
    room: ROOMS[nest.room], nest: nest, castCd: 0, near: false, hitT: 0, stun: 0, lassoed: false,
    move: 'walk', moveT: 0, moveDur: 0, dir: 1, kb: null, _wT: 0, _noCrouch: 0, _zS: 1, _zT: 0
  };
  nest.mon = m;
  DG.monsters.push(m);
}
function isWeak(m) { return m.hp <= m.maxHp * 0.3; }
function removeWild(m) {
  var i = DG.monsters.indexOf(m);
  if (i >= 0) DG.monsters.splice(i, 1);
  if (m.nest) { m.nest.mon = null; m.nest.respawn = 8; }
}
function cancelWarn(m) {
  for (var i = DG.hazards.length - 1; i >= 0; i--) {
    var h = DG.hazards[i];
    if (h.ownerId === m.id && h.phase === 'warn') DG.hazards.splice(i, 1);
  }
}
function isCasting(m) {
  for (var i = 0; i < DG.hazards.length; i++) if (DG.hazards[i].ownerId === m.id && DG.hazards[i].phase === 'warn') return true;
  return false;
}

// 生成技能 hazard(地下城與表演場共用); 回傳新增的 hazard 陣列
function castSkill(m, tx, ty, list, side, perf) {
  var sp = SPECIES[m.species], ang = Math.atan2(ty - m.y, tx - m.x), out = [];
  function mk(o) {
    var h = { kind: o.kind, phase: o.phase, x: o.x, y: o.y, angle: o.angle || 0, spread: o.spread || 0, radius: o.radius || 0,
      length: o.length || 0, width: o.width || 0, t: 0, dur: o.dur || 0, activeDur: o.activeDur || 0, reflected: false,
      ownerId: m.id, owner: m, side: side, hit: {}, perf: perf || null, chain: perf ? perf.chain : 1,
      vx: 0, vy: 0, judged: false, dead: false };
    if (perf) perf.open++;
    list.push(h); out.push(h);
    return h;
  }
  switch (sp.skill) {
    case 'claw': mk({ kind: 'claw', phase: 'warn', x: m.x, y: m.y, angle: ang, spread: 100 * DEG, radius: 110, dur: 0.8, activeDur: 0.3 }); break;
    case 'splash': mk({ kind: 'splash', phase: 'warn', x: m.x, y: m.y, angle: ang, spread: 90 * DEG, radius: 150, dur: 0.5, activeDur: 0.3 }); break;
    case 'lava': mk({ kind: 'lava', phase: 'warn', x: tx, y: ty, radius: 80, dur: 0.9, activeDur: 0.2 }); break;
    case 'beam': mk({ kind: 'beam', phase: 'warn', x: m.x, y: m.y, angle: ang, length: 400, width: 36, dur: 0.6, activeDur: 0.2 }); break;
    case 'sleepwave': mk({ kind: 'sleepwave', phase: 'active', x: m.x, y: m.y, radius: 0, dur: 1, activeDur: 1 }); break;
    case 'bubble':
      for (var i = -1; i <= 1; i++) {
        var a = ang + i * 25 * DEG;
        var h = mk({ kind: 'bubble', phase: 'fly', x: m.x, y: m.y, angle: a, radius: 14, dur: 0 });
        h.vx = Math.cos(a) * 160; h.vy = Math.sin(a) * 160;
      }
      break;
  }
  return out;
}

// ---- 地下城: 魔物移動(與表演場共用) ----
function moveMonster(m, dt, env) {
  var sp = m.species, mul = env.mul, dun = env.mode === 'dungeon';
  var far = dun && !env.near;
  var tg = far ? null : getTarget(m, env, dt);
  if (far && (m.move === 'crouch' || m.move === 'pounce')) { m.move = 'walk'; m.moveT = 0; m.moveDur = 0; }
  var hit = false, d;

  if (sp === 'boar') {
    if (m.move === 'rest') {
      m.moveT += dt;
      if (m.moveT >= 0.6) startCharge(m, env, tg);
      return;
    }
    if (m.move !== 'charge') startCharge(m, env, tg);
    m.x += m._cx * 200 * mul * dt; m.y += m._cy * 200 * mul * dt;
    if (m._cx !== 0) m.dir = m._cx > 0 ? 1 : -1;
    if (env.clamp(m)) { m.move = 'rest'; m.moveT = 0; m.moveDur = 0.6; }
    return;
  }
  if (!tg) { wander(m, dt, env, dun ? 40 : 50); return; }

  if (sp === 'cat') {
    if (m.move === 'crouch') {
      m.moveT += dt;
      if (m.moveT >= 0.8) {
        m._px = tg.x; m._py = tg.y; m._lastPounce = tg.id;
        m.move = 'pounce'; m.moveT = 0; m.moveDur = 0.3;
      }
      return;
    }
    if (m.move === 'pounce') {
      d = dirTo(m.x, m.y, m._px, m._py);
      var st = Math.min(500 * mul * dt, d.d);
      m.x += d.x * st; m.y += d.y * st;
      if (d.x !== 0) m.dir = d.x > 0 ? 1 : -1;
      hit = env.clamp(m);
      m.moveT += dt;
      if (d.d <= st + 0.01 || hit || m.moveT >= 0.3) { m.move = 'walk'; m.moveT = 0; m.moveDur = 0; m._noCrouch = 1; }
      return;
    }
    m._noCrouch = Math.max(0, m._noCrouch - dt);
    d = dirTo(m.x, m.y, tg.x, tg.y);
    m.x += d.x * 50 * mul * dt; m.y += d.y * 50 * mul * dt;
    if (d.x !== 0) m.dir = d.x > 0 ? 1 : -1;
    env.clamp(m);
    if (d.d <= 220 && m._noCrouch <= 0) { m.move = 'crouch'; m.moveT = 0; m.moveDur = 0.8; }
    return;
  }
  m.move = 'walk'; m.moveT = 0; m.moveDur = 0;
  if (sp === 'turtle') {
    d = dirTo(m.x, m.y, tg.x, tg.y);
    m.x += d.x * 40 * mul * dt; m.y += d.y * 40 * mul * dt;
    if (d.x !== 0) m.dir = d.x > 0 ? 1 : -1;
  } else if (sp === 'monkey') {
    d = dirTo(m.x, m.y, tg.x, tg.y);
    var hi = dun ? 140 : 110, lo = dun ? 100 : 70, v = 0;
    if (d.d > hi) v = 110 * mul; else if (d.d < lo) v = -80 * mul;
    m.x += d.x * v * dt; m.y += d.y * v * dt;
    if (d.x !== 0) m.dir = d.x > 0 ? 1 : -1;
  } else if (sp === 'fox') {
    m._zT += dt;
    if (m._zT >= 0.5) { m._zT -= 0.5; m._zS = -m._zS; }
    d = dirTo(m.x, m.y, tg.x, tg.y);
    var a = Math.atan2(d.y, d.x) + m._zS * 40 * DEG;
    m.x += Math.cos(a) * 160 * mul * dt; m.y += Math.sin(a) * 160 * mul * dt;
    if (Math.cos(a) !== 0) m.dir = Math.cos(a) > 0 ? 1 : -1;
  } else if (sp === 'owl') {
    var R = dun ? 180 : 120;
    var rx = m.x - tg.x, ry = m.y - tg.y, rd = Math.sqrt(rx * rx + ry * ry);
    if (rd < 1) { rx = 1; ry = 0; rd = 1; }
    var th = Math.atan2(ry, rx);
    var tx = -Math.sin(th) * 100, ty = Math.cos(th) * 100; // 順時針(畫面 y 向下, 角度增加)
    var rv = clamp((R - rd) * 2, -100, 100);
    var vx = tx + (rx / rd) * rv, vy = ty + (ry / rd) * rv;
    var vl = Math.sqrt(vx * vx + vy * vy);
    if (vl > 140) { vx = vx / vl * 140; vy = vy / vl * 140; }
    m.x += vx * mul * dt; m.y += vy * mul * dt;
    if (vx !== 0) m.dir = vx > 0 ? 1 : -1;
  }
  env.clamp(m);
}
function startCharge(m, env, tg) {
  var dx, dy;
  if (tg) { var d = dirTo(m.x, m.y, tg.x, tg.y); dx = d.x; dy = d.y; }
  else { var a = Math.random() * TAU; dx = Math.cos(a); dy = Math.sin(a); }
  if (env.mode === 'show') {
    var others = showOthers(m);
    if (others.length) { var o = others[Math.floor(Math.random() * others.length)]; var d2 = dirTo(m.x, m.y, o.x, o.y); dx = d2.x; dy = d2.y; }
  }
  m._cx = dx; m._cy = dy; m.move = 'charge'; m.moveT = 0; m.moveDur = 0;
}
function wander(m, dt, env, spd) {
  m._wT -= dt;
  if (m._wT <= 0 || m._wA === undefined) { m._wA = Math.random() * TAU; m._wT = rand(2, 3); }
  var cx = Math.cos(m._wA), cy = Math.sin(m._wA);
  m.x += cx * spd * env.mul * dt; m.y += cy * spd * env.mul * dt;
  if (cx !== 0) m.dir = cx > 0 ? 1 : -1;
  if (env.clamp(m)) m._wT = 0;
  if (m.move !== 'walk' && m.species !== 'boar') { m.move = 'walk'; m.moveT = 0; m.moveDur = 0; }
}
// 取得習性對象 {x,y,id}
function getTarget(m, env, dt) {
  if (env.mode === 'dungeon') return { x: DG.tamer.x, y: DG.tamer.y, id: -1 };
  var others = showOthers(m);
  if (!others.length) return null;
  var sp = m.species, t = null, i;
  function byId(id) { for (var j = 0; j < others.length; j++) if (others[j].id === id) return others[j]; return null; }
  function nearestOf(list) {
    var best = null, bd = 1e9;
    for (var j = 0; j < list.length; j++) { var dd = dist(m.x, m.y, list[j].x, list[j].y); if (dd < bd) { bd = dd; best = list[j]; } }
    return best;
  }
  if (sp === 'cat') {
    var list = others;
    if (others.length > 1 && m._lastPounce) {
      list = others.filter(function (o) { return o.id !== m._lastPounce; });
      if (!list.length) list = others;
    }
    t = nearestOf(list);
  } else if (sp === 'turtle') {
    m._pickT = (m._pickT === undefined ? 0 : m._pickT) - dt;
    t = byId(m._tid);
    if (!t || m._pickT <= 0) {
      var best = null;
      for (i = 0; i < others.length; i++) {
        var o = others[i];
        if (!best || o.rage > best.rage || (o.rage === best.rage && dist(m.x, m.y, o.x, o.y) < dist(m.x, m.y, best.x, best.y))) best = o;
      }
      t = best; m._tid = t.id; m._pickT = 2;
    }
  } else if (sp === 'monkey') {
    m._swT = (m._swT === undefined ? 0 : m._swT) - dt;
    t = byId(m._tid);
    if (!t) { t = nearestOf(others); m._tid = t.id; m._swT = 4; }
    else if (m._swT <= 0) {
      var rest = others.filter(function (o) { return o.id !== m._tid; });
      t = rest.length ? nearestOf(rest) : t;
      m._tid = t.id; m._swT = 4;
    }
  } else if (sp === 'fox') {
    m._tT = (m._tT === undefined ? 99 : m._tT) + dt;
    t = byId(m._tid);
    if (!t || m._tT >= 4 || dist(m.x, m.y, t.x, t.y) <= 80) {
      t = others[Math.floor(Math.random() * others.length)]; m._tid = t.id; m._tT = 0;
    }
  } else if (sp === 'owl') {
    m._tT = (m._tT === undefined ? 99 : m._tT) + dt;
    t = byId(m._tid);
    if (!t || m._tT >= 4) { t = others[Math.floor(Math.random() * others.length)]; m._tid = t.id; m._tT = 0; }
  } else if (sp === 'boar') {
    return others[0];
  }
  return t;
}

function dungeonClamp(m) {
  var r = m.room, ox = m.x, oy = m.y;
  m.x = clamp(m.x, r.x0, r.x1); m.y = clamp(m.y, r.y0, r.y1);
  return m.x !== ox || m.y !== oy;
}

// 攻擊 / 傷害
function damageWild(m, dmg) {
  if (m.lassoed) return;
  m.hp -= dmg; m.hitT = 0.1;
  if (DG.prep && DG.prep.m === m) DG.prep = null;
  if (m.hp <= 0) {
    var g = SPECIES[m.species].kill;
    S.gold += g; S.goldEarned += g;
    addFloat(m.x + OFFX, m.y + OFFY - 30, '+' + g, 'gold');
    removeWild(m);
  }
}
function stunWild(m) {
  if (m.lassoed) return;
  m.stun = 2; cancelWarn(m);
  if (DG.prep && DG.prep.m === m) DG.prep = null;
}
function tamerHit() {
  var T = DG.tamer;
  if (T.inv > 0 || T.dash) return;
  T.hearts -= 1; T.inv = 1.2;
  if (DG.lasso) breakLasso();
}
function breakLasso() {
  if (DG.lasso) { DG.lasso.m.lassoed = false; DG.lasso = null; }
}
function wildHitTest(sh, ox, oy, ang, m) {
  if (sh.shape === 'arc') return inArc(ox, oy, ang, sh.spread, sh.r, m.x, m.y, MR);
  if (sh.shape === 'circle') return dist(ox, oy, m.x, m.y) <= sh.r + MR;
  if (sh.shape === 'line') return inRect(ox, oy, ang, sh.len, sh.w, m.x, m.y, MR);
  return false;
}
function pushWeaponFx(weapon, move, shape, T, ang, sp, rad, len, wid, dur) {
  DG.fx.push({ weapon: weapon, move: move, shape: shape, x: T.x, y: T.y, angle: ang, spread: sp, radius: rad, length: len,
    width: wid, t: 0, dur: dur, follow: shape !== 'dash' });
}
function doAttackZ() {
  var T = DG.tamer, w = S.weapon, def = WEAPONS[w].z, f = FACING_VEC[T.facing], ang = Math.atan2(f.y, f.x);
  var bonus = 1 + 0.1 * lv('cat');
  var sh = { shape: def.shape, spread: def.spread, r: (def.r || 0) * bonus, len: (def.len || 0) * bonus, w: def.w };
  T.cdZ = def.cd;
  pushWeaponFx(w, 'normal', def.shape === 'line' ? 'line' : def.shape, T, ang, def.spread || 0, sh.r, sh.len, def.w || 0, 0.2);
  var ms = DG.monsters.slice();
  for (var i = 0; i < ms.length; i++) if (wildHitTest(sh, T.x, T.y, ang, ms[i])) damageWild(ms[i], def.dmg + S.atk);
  if (def.reflect) {
    for (var j = 0; j < DG.hazards.length; j++) {
      var h = DG.hazards[j];
      if (h.kind === 'bubble' && h.phase === 'fly' && !h.reflected && inArc(T.x, T.y, ang, def.spread, sh.r, h.x, h.y, 14)) {
        var o = h.owner && DG.monsters.indexOf(h.owner) >= 0 ? h.owner : null;
        var a = o ? Math.atan2(o.y - T.y, o.x - T.x) : Math.atan2(h.vy, h.vx) + PI;
        h.angle = a; h.vx = Math.cos(a) * 192; h.vy = Math.sin(a) * 192; h.reflected = true;
      }
    }
  }
}
function xCdMax() {
  var d = WEAPONS[S.weapon].x;
  if (!d) return 0;
  return d.cd * Math.max(0.1, 1 - 0.15 * lv('boar'));
}
function doAttackX() {
  var T = DG.tamer, w = S.weapon, def = WEAPONS[w].x;
  if (!def) return;
  var f = FACING_VEC[T.facing], ang = Math.atan2(f.y, f.x);
  T.cdX = xCdMax();
  var i, ms;
  if (def.kind === 'stun') {
    pushWeaponFx(w, 'skill', 'arc', T, ang, def.spread, def.r, 0, 0, 0.2);
    ms = DG.monsters.slice();
    for (i = 0; i < ms.length; i++) if (wildHitTest(def, T.x, T.y, ang, ms[i])) stunWild(ms[i]);
  } else if (def.kind === 'knock') {
    pushWeaponFx(w, 'skill', 'arc', T, ang, def.spread, def.r, 0, 0, 0.2);
    ms = DG.monsters.slice();
    for (i = 0; i < ms.length; i++) {
      var m = ms[i];
      if (wildHitTest(def, T.x, T.y, ang, m)) {
        var lasd = m.lassoed;
        damageWild(m, def.dmg + S.atk);
        if (!lasd && DG.monsters.indexOf(m) >= 0) {
          var d = dirTo(T.x, T.y, m.x, m.y);
          m.kb = { vx: d.x * 640, vy: d.y * 640, t: 0.25 };
          cancelWarn(m);
        }
      }
    }
  } else if (def.kind === 'dash') {
    pushWeaponFx(w, 'skill', 'dash', T, ang, 0, 0, 220, 0, 0.25);
    T.dash = { t: 0, dur: 0.25, ang: ang, hit: {}, sx: T.x, sy: T.y };
  }
}

function updateDungeon(dt) {
  var T = DG.tamer, i, m;
  DG.time -= dt;
  T.inv = Math.max(0, T.inv - dt);
  T.cdZ = Math.max(0, T.cdZ - dt);
  T.cdX = Math.max(0, T.cdX - dt);

  // --- 馴獸師移動 / 突進 ---
  if (T.dash) {
    var dd = T.dash, step = 220 * (Math.min(dt, dd.dur - dd.t) / dd.dur);
    var blk = tamerStep(Math.cos(dd.ang) * step, Math.sin(dd.ang) * step);
    for (i = 0; i < DG.monsters.length; i++) {
      m = DG.monsters[i];
      if (!dd.hit[m.id] && dist(T.x, T.y, m.x, m.y) <= MR + 18) { dd.hit[m.id] = true; damageWild(m, 3 + S.atk); }
    }
    dd.t += dt;
    if (dd.t >= dd.dur || blk) T.dash = null;
  } else {
    var vx = (held.right ? 1 : 0) - (held.left ? 1 : 0), vy = (held.down ? 1 : 0) - (held.up ? 1 : 0);
    if (vx !== 0 || vy !== 0) {
      var l = Math.sqrt(vx * vx + vy * vy), sp = tamerSpeed();
      var tl = tileAt(T.x, T.y);
      if (tl && tl.kind === 'slow') sp *= 0.5;
      tamerStep(vx / l * sp * dt, vy / l * sp * dt);
      var tbl = { '0,-1': 0, '1,-1': 1, '1,0': 2, '1,1': 3, '0,1': 4, '-1,1': 5, '-1,0': 6, '-1,-1': 7 };
      T.facing = tbl[vx + ',' + vy];
    }
    // 攻擊
    if (down('z') && T.cdZ <= 0) doAttackZ();
    if (down('x') && T.cdX <= 0 && WEAPONS[S.weapon].x) doAttackX();
  }

  // --- 傷害地形 ---
  var c0 = Math.floor((T.x - 18) / 60), c1 = Math.floor((T.x + 18) / 60), r0 = Math.floor((T.y - 18) / 60), r1 = Math.floor((T.y + 18) / 60);
  for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
    if (c < 0 || r < 0 || c > 19 || r > 9) continue;
    if (DG.map.tiles[r][c].kind === 'hurt' && circleRect(T.x, T.y, 18, c * 60, r * 60, 60, 60)) tamerHit();
  }

  // --- 魔物 ---
  var env = { mode: 'dungeon', mul: 1, near: false, clamp: dungeonClamp };
  for (i = 0; i < DG.monsters.length; i++) {
    m = DG.monsters[i];
    m.hitT = Math.max(0, m.hitT - dt);
    var d = dist(m.x, m.y, T.x, T.y), near = d < 300, wasNear = m.near;
    m.near = near;
    var sp0 = SPECIES[m.species];
    var wk = isWeak(m);
    if (near && !wasNear) m.castCd = sp0.interval * (wk ? 1.5 : 1);
    if (m.kb) {
      m.x += m.kb.vx * dt; m.y += m.kb.vy * dt; m.kb.t -= dt;
      var hitEdge = dungeonClamp(m);
      if (m.kb.t <= 0 || hitEdge) m.kb = null;
      continue;
    }
    if (m.stun > 0) { m.stun -= dt; if (m.stun < 0) m.stun = 0; continue; }
    if (m.lassoed) continue;
    env.mul = wk ? 0.5 : 1; env.near = near;
    moveMonster(m, dt, env);
    if (near) {
      m.castCd -= dt;
      if (m.castCd <= 0) {
        castSkill(m, T.x, T.y, DG.hazards, 'dungeon', null);
        m.castCd = sp0.interval * (wk ? 1.5 : 1);
      }
    }
  }

  // --- 巢穴再生 ---
  var nests = DG.map.nests;
  for (i = 0; i < nests.length; i++) {
    if (!nests[i].mon) { nests[i].respawn -= dt; if (nests[i].respawn <= 0) spawnWild(nests[i]); }
  }

  updateHazardsDungeon(dt);
  updateCapture(dt);

  // --- 特效 / 飄字 ---
  for (i = DG.fx.length - 1; i >= 0; i--) {
    var f = DG.fx[i]; f.t += dt;
    if (f.follow) { f.x = T.x; f.y = T.y; }
    if (f.t >= f.dur) DG.fx.splice(i, 1);
  }
  updateFloats(dt);

  if (DG.tamer.hearts <= 0 || DG.time <= 0) endDungeon();
}
function endDungeon() {
  DG.lasso = null; DG.prep = null;
  // 保險: 解除所有暈眩狀態不需要, 場景將丟棄
  SU = { cur: 'first', step: 1 };
  enterSetup1();
}

function updateHazardsDungeon(dt) {
  var T = DG.tamer;
  for (var i = DG.hazards.length - 1; i >= 0; i--) {
    var h = DG.hazards[i];
    if (h.phase === 'warn') {
      h.t += dt;
      if (h.t >= h.dur) { h.phase = 'active'; h.t = 0; h.dur = h.activeDur; }
    } else if (h.phase === 'active') {
      if (h.kind === 'sleepwave') h.radius = 220 * Math.min(1, h.t / h.dur);
      if (!(h.kind === 'lava' && h.judged)) {
        h.judged = true;
        if (!h.hit.tamer && hazHit(h, T.x, T.y, 18)) { h.hit.tamer = true; tamerHit(); }
      }
      h.t += dt;
      if (h.t >= h.dur) h.dead = true;
    } else { // fly
      h.x += h.vx * dt; h.y += h.vy * dt;
      if (solidAt(Math.floor(h.x / 60), Math.floor(h.y / 60))) { h.dead = true; }
      else if (h.reflected) {
        for (var j = 0; j < DG.monsters.length; j++) {
          var m = DG.monsters[j];
          if (dist(h.x, h.y, m.x, m.y) <= 14 + MR) { damageWild(m, 3 + S.atk); h.dead = true; break; }
        }
      } else if (!T.dash && dist(h.x, h.y, T.x, T.y) <= 14 + 18) {
        h.dead = true; tamerHit();
      }
    }
    if (h.dead) DG.hazards.splice(i, 1);
  }
}

function captureTime() { return Math.max(0.35, 0.8 - 0.15 * lv('monkey')); }
function updateCapture(dt) {
  var T = DG.tamer, i, m;
  if (DG.lasso) {
    var L = DG.lasso; m = L.m;
    L.t += dt;
    var ang = Math.atan2(T.y - m.y, T.x - m.x);
    L.sum += normAng(ang - L.lastAng); L.lastAng = ang;
    var dd = dist(T.x, T.y, m.x, m.y);
    if (Math.abs(L.sum) / TAU >= 1) { captureWild(m); return; }
    if (L.t >= L.limit || dd > 220) breakLasso();
    return;
  }
  var best = null, bd = 1e9;
  if (DG.ropes === undefined) DG.ropes = maxRopes();
  if (DG.ropes > 0) {
    for (i = 0; i < DG.monsters.length; i++) {
      m = DG.monsters[i];
      if (!isWeak(m) || m.lassoed) continue;
      var d = dist(T.x, T.y, m.x, m.y);
      if (d <= 40 && d < bd) { bd = d; best = m; }
    }
  }
  if (!best) { DG.prep = null; return; }
  if (!DG.prep || DG.prep.m !== best) DG.prep = { m: best, t: 0 };
  DG.prep.t += dt;
  if (DG.prep.t >= captureTime()) {
    best.lassoed = true; cancelWarn(best);
    DG.lasso = { m: best, sum: 0, lastAng: Math.atan2(T.y - best.y, T.x - best.x), t: 0, limit: 5 + lv('owl') };
    DG.prep = null;
  }
}
function captureWild(m) {
  var sp = m.species, hb = maxHearts();
  DG.ropes -= 1;
  DG.lasso = null;
  removeWild(m);
  S.caps[sp] += 1;
  var fx = m.x + OFFX, fy = m.y + OFFY - 30;
  addFloat(fx, fy, '收服!', 'capture');
  if (S.roster[sp] === undefined) { S.roster[sp] = 0; S.order.push(sp); }
  else if (S.roster[sp] < 3) { S.roster[sp] += 1; addFloat(fx, fy - 26, '等級 +1', 'levelUp'); }
  else { S.gold += 20; S.goldEarned += 20; addFloat(fx, fy - 26, '+20', 'coin20'); }
  var ha = maxHearts() - hb;
  if (ha > 0) DG.tamer.hearts += ha;
}

function dungeonMessage() {
  if (DG.lasso) return '繞牠一圈!';
  if (DG.prep) return '站住別動';
  return 'Z 攻擊 X 武器技';
}

// ================= 布置階段 =================
function enterSetup1() {
  go('setup1');
  var np = {};
  for (var i = 0; i < S.order.length; i++) if (S.picks[S.order[i]]) np[S.order[i]] = true;
  S.picks = np;
  SU = { cur: 0, step: 1, btn: false, selD: 0 };
}
function pickCount() { var n = 0; for (var k in S.picks) if (S.picks[k]) n++; return n; }
function updateSetup1() {
  var n = S.order.length;
  if (!SU.btn) {
    if (edge.left) SU.cur = Math.max(0, SU.cur - 1);
    if (edge.right) SU.cur = Math.min(n - 1, SU.cur + 1);
    if (edge.down) SU.btn = true;
    else if (edge.z) {
      var sp = S.order[SU.cur];
      if (S.picks[sp]) delete S.picks[sp];
      else if (pickCount() < 4) S.picks[sp] = true;
    }
  } else {
    if (edge.up) SU.btn = false;
    else if (edge.z && pickCount() >= 1) { enterSetup2(); }
  }
}
function enterSetup2() {
  go('setup2');
  SU = { step: 2, cur: 0, btn: false };
}
function ownedDevices() { return DEVICE_ORDER.filter(function (d) { return S.owned[d]; }); }
function equipDev(key, dev) {
  var other = key === 'z' ? 'x' : 'z';
  if (S.dev[other] === dev) S.dev[other] = S.dev[key];
  S.dev[key] = dev;
}
function updateSetup2() {
  var list = ownedDevices(), n = list.length;
  if (!SU.btn) {
    if (edge.left) SU.cur = Math.max(0, SU.cur - 1);
    if (edge.right) SU.cur = Math.min(n - 1, SU.cur + 1);
    if (edge.down) SU.btn = true;
    else if (edge.z) equipDev('z', list[SU.cur]);
    else if (edge.x) equipDev('x', list[SU.cur]);
  } else {
    if (edge.up) SU.btn = false;
    else if (edge.z) startShow();
    else if (edge.x) { SU = { cur: 0, step: 1, btn: false }; go('setup1'); }
  }
}

// ================= 表演場 =================
var FIELD = { x0: 60, x1: 1220, y0: 146, y1: 566 };
var ACT = { x0: 100, x1: 1180, y0: 186, y1: 526 };
function showClamp(m) {
  var ox = m.x, oy = m.y;
  m.x = clamp(m.x, ACT.x0, ACT.x1); m.y = clamp(m.y, ACT.y0, ACT.y1);
  return m.x !== ox || m.y !== oy;
}
function startShow() {
  var list = S.order.filter(function (sp) { return S.picks[sp]; });
  SH = {
    t: 45, T: 0, mons: [], hazards: [], fx: [], names: [], pending: [], pairCd: {}, perfs: [],
    cursor: { x: 640, y: 356, hooked: null },
    energy: 100,
    hold: { z: false, x: false }, cd: { z: 0, x: 0 },
    fences: { top: [], bottom: [] }, visitors: { top: [], bottom: [] }
  };
  for (var i = 0; i < 8; i++) {
    SH.fences.top.push({ x: 165 + 136 * i, y: 140, side: 'top', broken: false });
    SH.fences.bottom.push({ x: 165 + 136 * i, y: 572, side: 'bottom', broken: false });
    SH.visitors.top.push({ x: 165 + 136 * i, y: 95, side: 'top', mode: 'watch', t: 0 });
    SH.visitors.bottom.push({ x: 165 + 136 * i, y: 622, side: 'bottom', mode: 'watch', t: 0 });
  }
  for (i = 0; i < list.length; i++) {
    var sp = list[i], level = lv(sp);
    SH.mons.push({
      id: ++uid, species: sp, level: level, x: START_POS[i][0], y: START_POS[i][1],
      rage: 60, redLow: 80 - 5 * level, marks: 0, markLeft: 0, slow: false,
      mode: 'roam', performing: false, performT: 0, perfTimer: rand(0.5, 2),
      fx: 'none', fxT: 0, lit: false, jarT: 0, chargeT: 0, looseT: 0,
      move: 'walk', moveT: 0, moveDur: 0, dir: 1,
      relayPending: false, relayT: 0, relayChain: 1, lastRelay: -99, litT: 0,
      _wT: 0, _noCrouch: 0, _zS: 1, _zT: 0
    });
  }
  go('show');
}
function showOthers(m) {
  var out = [];
  for (var i = 0; i < SH.mons.length; i++) {
    var o = SH.mons[i];
    if (o !== m && (o.mode === 'roam' || o.mode === 'hooked')) out.push(o);
  }
  return out;
}
function affectable(m) { return m.mode === 'roam' || m.mode === 'hooked'; }
function perfInterval(rage) { return 4 - (clamp(rage, 50, 100) - 50) / 50 * 2.5; }

function addMark(m, d) {
  m.marks += d; m.markLeft = 4;
  if (m.marks >= 5) { startLoose(m); return; }
  if (m.marks <= 0) { m.marks = 0; m.slow = true; m.markLeft = 0; }
}
function igniteM(m, amt, kind, chain) {
  if (!affectable(m)) return;
  if (m.marks > 0) {
    if (kind === 'skill') addMark(m, 1);
  } else {
    m.rage = Math.min(100, m.rage + amt);
    if (m.rage >= 100) { m.marks = 1; m.markLeft = 4; m.slow = false; }
  }
  if (kind !== 'light' && affectable(m)) { m.fx = 'ignited'; m.fxT = 0; }
  if (kind === 'skill' && affectable(m)) {
    if (m.rage >= m.redLow && !m.relayPending && SH.T - m.lastRelay >= 1.5) {
      m.relayPending = true; m.relayT = 0.3; m.relayChain = chain + 1; m.lastRelay = SH.T;
    }
  }
}
function douseM(m, amt) {
  if (!affectable(m)) return;
  if (m.marks > 0) addMark(m, -1);
  else m.rage = Math.max(0, m.rage - amt);
  m.fx = 'doused'; m.fxT = 0;
}
function releaseHook(taunt) {
  var cur = SH.cursor, m = cur.hooked;
  if (!m) return;
  cur.hooked = null;
  if (m.mode === 'hooked') m.mode = 'roam';
  m.move = 'walk'; m.moveT = 0; m.moveDur = 0;
  if (taunt && affectable(m)) {
    for (var i = 0; i < SH.mons.length; i++) {
      var o = SH.mons[i];
      if (o === m || !affectable(o)) continue;
      if (dist(m.x, m.y, o.x, o.y) <= 80) {
        if (m.rage < 100) igniteM(m, 8, 'collide');
        if (o.rage < 100) igniteM(o, 8, 'collide');
        SH.pairCd[pairKey(m, o)] = 2;
      }
    }
  }
}
function pairKey(a, b) { return a.id < b.id ? a.id + '-' + b.id : b.id + '-' + a.id; }

function startLoose(m) {
  if (SH.cursor.hooked === m) releaseHook(false);
  m.mode = 'charge'; m.rage = 100; m.marks = 0; m.markLeft = 0; m.slow = false;
  m.chargeT = 0; m.looseT = 0; m.arrived = false; m.relayPending = false; m.performing = false;
  m.move = 'walk'; m.moveT = 0; m.moveDur = 0; m.fx = 'none';
  var side = m.y < 356 ? 'top' : 'bottom';
  var idx = clamp(Math.round((m.x - 165) / 136), 0, 7);
  m.fence = SH.fences[side][idx]; m.fenceSide = side; m.fenceIdx = idx;
}
function repChange(d) { S.rep = Math.max(0, S.rep + d); }

function perform(m, chain) {
  if (!affectable(m)) return;
  var others = showOthers(m), tg = null, bd = 1e9;
  for (var i = 0; i < others.length; i++) { var dd = dist(m.x, m.y, others[i].x, others[i].y); if (dd < bd) { bd = dd; tg = others[i]; } }
  var tx = tg ? tg.x : 640, ty = tg ? tg.y : 356;
  var lit = !!(spotActive() && dist(SH.cursor.x, SH.cursor.y, m.x, m.y) <= 100);
  var perf = { m: m, chain: chain, red: m.rage >= m.redLow, lit: lit, hits: 0, open: 0 };
  m.performing = true; m.performT = 0;
  m.perfTimer = perfInterval(m.rage);
  if (chain > S.bestChain) S.bestChain = chain;
  castSkill(m, tx, ty, SH.hazards, 'show', perf);
  for (var j = 0; j < SH.hazards.length; j++) if (SH.hazards[j].perf === perf) SH.hazards[j].chain = chain;
}
function settlePerf(perf) {
  var m = perf.m, sp = SPECIES[m.species];
  var g = sp.gold * (1 + 0.5 * perf.hits) * (perf.red ? 2 : 1) * (perf.lit ? 1.5 : 1) * (1 + 0.25 * (perf.chain - 1)) * Math.min(3, 1 + S.rep / 200);
  g = Math.max(1, Math.round(g));
  S.gold += g; S.goldEarned += g; repChange(sp.rep);
  var txt = '+' + g, kind = 'gold';
  if (perf.red) { txt += ' ×2'; kind = 'redGold'; }
  if (perf.lit) txt += ' 燈';
  if (perf.chain >= 2) { txt += ' 連鎖 ' + perf.chain; kind = 'chain'; }
  addFloat(m.x, m.y - 50, txt, kind);
}
function endHazard(h) {
  if (h.perf) { h.perf.open--; if (h.perf.open <= 0) settlePerf(h.perf); }
}
function skillHit(h, m) {
  if (h.perf) h.perf.hits++;
  switch (h.kind) {
    case 'claw': case 'lava': igniteM(m, 15, 'skill', h.chain); break;
    case 'beam': igniteM(m, 12, 'skill', h.chain); break;
    case 'splash': douseM(m, 20); break;
    case 'bubble': case 'sleepwave': douseM(m, 15); break;
  }
}
function showTarget(h, m) { return m !== h.owner && affectable(m); }
function updateHazardsShow(dt) {
  for (var i = SH.hazards.length - 1; i >= 0; i--) {
    var h = SH.hazards[i], j, m;
    if (h.phase === 'warn') {
      h.t += dt;
      if (h.t >= h.dur) { h.phase = 'active'; h.t = 0; h.dur = h.activeDur; }
    } else if (h.phase === 'active') {
      if (h.kind === 'sleepwave') h.radius = 220 * Math.min(1, h.t / h.dur);
      if (!(h.kind === 'lava' && h.judged)) {
        h.judged = true;
        for (j = 0; j < SH.mons.length; j++) {
          m = SH.mons[j];
          if (!showTarget(h, m) || h.hit[m.id]) continue;
          if (hazHit(h, m.x, m.y, 0)) { h.hit[m.id] = true; skillHit(h, m); }
        }
      }
      h.t += dt;
      if (h.t >= h.dur) h.dead = true;
    } else {
      h.x += h.vx * dt; h.y += h.vy * dt;
      if (h.x < FIELD.x0 || h.x > FIELD.x1 || h.y < FIELD.y0 || h.y > FIELD.y1) h.dead = true;
      else {
        for (j = 0; j < SH.mons.length; j++) {
          m = SH.mons[j];
          if (!showTarget(h, m)) continue;
          if (dist(h.x, h.y, m.x, m.y) <= 14 + SHOW_BUBBLE_R) { skillHit(h, m); h.dead = true; break; }
        }
      }
    }
    if (h.dead) { SH.hazards.splice(i, 1); endHazard(h); }
  }
}
function spotActive() { return SH.hold.z && S.dev.z === 'spotlight' || SH.hold.x && S.dev.x === 'spotlight'; }
function holdActiveAny() { return SH.hold.z || SH.hold.x; }
function addName(dev, x, y) { SH.names.push({ x: x, y: y, device: dev, t: 0, dur: 0.6 }); }

function nearestInRange(cur, range, filter) {
  var best = null, bd = 1e9;
  for (var i = 0; i < SH.mons.length; i++) {
    var m = SH.mons[i];
    if (!affectable(m) || (filter && !filter(m))) continue;
    var d = dist(cur.x, cur.y, m.x, m.y);
    if (d <= range && d < bd) { bd = d; best = m; }
  }
  return best;
}
function useDevice(key) {
  var dev = S.dev[key], cur = SH.cursor, def = DEVICES[dev];
  if (!def.hold) {
    if (SH.cd[key] > 0 || SH.energy < def.cost) return;
    if (dev === 'jar') {
      var jm = nearestInRange(cur, 100, function (m) { return m.mode !== 'jarred'; });
      if (!jm) return;
      SH.energy -= def.cost; SH.cd[key] = 0.5;
      if (SH.cursor.hooked === jm) releaseHook(false);
      jm.mode = 'jarred'; jm.jarT = 0; jm.relayPending = false;
      jm.move = 'walk'; jm.moveT = 0; jm.moveDur = 0;
      SH.fx.push({ kind: 'jarDrop', x: jm.x, y: jm.y, radius: 60, t: 0, dur: 0.3 });
    } else if (dev === 'mist') {
      SH.energy -= def.cost; SH.cd[key] = 0.5;
      SH.fx.push({ kind: 'mistWarn', x: cur.x, y: cur.y, radius: 120, t: 0, dur: 0.3, apply: 'mist' });
    } else if (dev === 'firecracker') {
      SH.energy -= def.cost; SH.cd[key] = 0.5;
      SH.fx.push({ kind: 'fireWarn', x: cur.x, y: cur.y, radius: 120, t: 0, dur: 0.8, apply: 'fire' });
    }
    addName(dev, cur.x, cur.y);
  } else {
    if (SH.energy <= 0) return;
    if (dev === 'hook') {
      var hm = nearestInRange(cur, 100, function (m) { return m.mode === 'roam'; });
      if (!hm) return;
      hm.mode = 'hooked'; cur.hooked = hm; hm.move = 'walk'; hm.moveT = 0; hm.moveDur = 0;
    }
    SH.hold[key] = true;
    addName(dev, cur.x, cur.y);
  }
}
function stopHold(key) {
  SH.hold[key] = false;
  if (S.dev[key] === 'hook') releaseHook(true);
}

function updateShow(dt) {
  var i, j, m, cur = SH.cursor;
  SH.T += dt; SH.t -= dt;
  SH.cd.z = Math.max(0, SH.cd.z - dt); SH.cd.x = Math.max(0, SH.cd.x - dt);

  // --- 準星 ---
  var vx = (held.right ? 1 : 0) - (held.left ? 1 : 0), vy = (held.down ? 1 : 0) - (held.up ? 1 : 0);
  var sp = cur.hooked ? 300 : 520;
  if (vx || vy) {
    var l = Math.sqrt(vx * vx + vy * vy);
    cur.x += vx / l * sp * dt; cur.y += vy / l * sp * dt;
  }
  cur.x = clamp(cur.x, FIELD.x0, FIELD.x1); cur.y = clamp(cur.y, FIELD.y0, FIELD.y1);

  // --- 器材輸入 ---
  var keys = ['z', 'x'];
  for (i = 0; i < 2; i++) {
    var k = keys[i], dev = S.dev[k], def = DEVICES[dev];
    if (edge[k]) useDevice(k);
    if (SH.hold[k] && !down(k)) stopHold(k);
  }
  // --- 按住型耗電 / 回充 ---
  if (holdActiveAny()) {
    var drain = 0;
    for (i = 0; i < 2; i++) if (SH.hold[keys[i]]) drain += DEVICES[S.dev[keys[i]]].cost;
    SH.energy -= drain * dt;
    if (SH.energy <= 0) { SH.energy = 0; for (i = 0; i < 2; i++) if (SH.hold[keys[i]]) stopHold(keys[i]); }
  } else {
    SH.energy = Math.min(100, SH.energy + 12 * dt);
  }

  // --- 吊鉤: 魔物跟準星 ---
  if (cur.hooked) { cur.hooked.x = clamp(cur.x, ACT.x0, ACT.x1); cur.hooked.y = clamp(cur.y, ACT.y0, ACT.y1); }

  // --- 聚光燈 ---
  for (i = 0; i < SH.mons.length; i++) SH.mons[i].lit = false;
  if (spotActive()) {
    for (i = 0; i < SH.mons.length; i++) {
      m = SH.mons[i];
      if (!affectable(m) || dist(cur.x, cur.y, m.x, m.y) > 100) { m.litT = 0; continue; }
      m.lit = true;
      if (m.marks > 0) {
        m.litT += dt;
        if (m.litT >= 1) { m.litT = 0; addMark(m, 1); }
      } else {
        m.litT = 0;
        igniteM(m, 20 * dt, 'light', 1);
      }
    }
  } else {
    for (i = 0; i < SH.mons.length; i++) SH.mons[i].litT = 0;
  }

  // --- 器材特效計時與生效 ---
  for (i = SH.fx.length - 1; i >= 0; i--) {
    var f = SH.fx[i]; f.t += dt;
    if (f.t >= f.dur) {
      SH.fx.splice(i, 1);
      if (f.apply === 'mist') {
        for (j = 0; j < SH.mons.length; j++) { m = SH.mons[j]; if (affectable(m) && dist(f.x, f.y, m.x, m.y) <= 120) douseM(m, 20); }
        SH.fx.push({ kind: 'mistBurst', x: f.x, y: f.y, radius: 120, t: 0, dur: 0.4 });
      } else if (f.apply === 'fire') {
        for (j = 0; j < SH.mons.length; j++) { m = SH.mons[j]; if (affectable(m) && dist(f.x, f.y, m.x, m.y) <= 120) igniteM(m, 15, 'skill', 1); }
        SH.fx.push({ kind: 'fireBurst', x: f.x, y: f.y, radius: 120, t: 0, dur: 0.3 });
      }
    }
  }
  for (i = SH.names.length - 1; i >= 0; i--) { SH.names[i].t += dt; if (SH.names[i].t >= SH.names[i].dur) SH.names.splice(i, 1); }

  // --- 魔物 ---
  var env = { mode: 'show', mul: 1, clamp: showClamp };
  for (i = 0; i < SH.mons.length; i++) {
    m = SH.mons[i];
    if (m.mode === 'jarred') {
      m.jarT += dt;
      if (m.jarT >= 3) { m.mode = 'roam'; m.jarT = 0; }
      continue;
    }
    if (m.mode === 'charge' || m.mode === 'loose') { updateLoose(m, dt); continue; }
    // 反應 / 表演動作計時
    if (m.fx !== 'none') { m.fxT += dt; if (m.fxT >= 0.5) { m.fx = 'none'; m.fxT = 0; } }
    if (m.performing) { m.performT += dt; if (m.performT >= 0.5) { m.performing = false; m.performT = 0; } }
    // 怒氣下降與標記遞減
    if (m.marks > 0) {
      m.rage = 100;
      m.markLeft -= dt;
      if (m.markLeft <= 0) addMark(m, -1);
    } else if (m.slow) {
      m.rage = Math.max(0, m.rage - 2 * dt);
      if (m.rage < m.redLow) m.slow = false;
    } else {
      m.rage = Math.max(0, m.rage - SPECIES[m.species].decl * dt);
    }
    if (m.mode === 'loose' || m.mode === 'charge') continue; // 剛好失控
    // 接演
    if (m.relayPending) {
      m.relayT -= dt;
      if (m.relayT <= 0) { m.relayPending = false; if (affectable(m)) perform(m, m.relayChain); }
    }
    // 定時表演
    if (affectable(m) && m.rage >= 50) {
      m.perfTimer -= dt;
      if (m.perfTimer <= 0) perform(m, 1);
    }
    // 移動
    if (m.mode === 'roam') moveMonster(m, dt, env);
  }

  // --- 相撞挑釁 ---
  for (var key in SH.pairCd) { SH.pairCd[key] -= dt; if (SH.pairCd[key] <= 0) delete SH.pairCd[key]; }
  for (i = 0; i < SH.mons.length; i++) for (j = i + 1; j < SH.mons.length; j++) {
    var a = SH.mons[i], b = SH.mons[j];
    if (!affectable(a) || !affectable(b)) continue;
    if (dist(a.x, a.y, b.x, b.y) <= 80) {
      var pk = pairKey(a, b);
      if (SH.pairCd[pk] > 0) continue;
      SH.pairCd[pk] = 2;
      if (a.rage < 100) igniteM(a, 8, 'collide');
      if (b.rage < 100) igniteM(b, 8, 'collide');
    }
  }

  updateHazardsShow(dt);

  // --- 觀眾 ---
  var sides = ['top', 'bottom'];
  for (i = 0; i < 2; i++) for (j = 0; j < 8; j++) {
    var v = SH.visitors[sides[i]][j];
    if (v.mode === 'scared') { v.t += dt; if (v.t >= 1) v.mode = 'empty'; }
    else if (v.mode === 'empty') { v.t += dt; if (v.t >= 4) { v.mode = 'watch'; v.t = 0; } }
  }
  updateFloats(dt);

  if (SH.t <= 0) endShow();
}
function updateLoose(m, dt) {
  var i;
  if (m.mode === 'charge') {
    var fx = m.fence.x, fy = m.fenceSide === 'top' ? m.fence.y + 30 : m.fence.y - 30;
    if (!m.arrived) {
      var d = dirTo(m.x, m.y, fx, fy), st = Math.min(160 * dt, d.d);
      m.x += d.x * st; m.y += d.y * st;
      if (d.x !== 0) m.dir = d.x > 0 ? 1 : -1;
      if (d.d <= st + 0.5) { m.arrived = true; m.chargeT = 0; }
      return;
    }
    m.chargeT += dt;
    if (m.chargeT >= 1.5 || m.fence.broken) {
      m.fence.broken = true;
      m.mode = 'loose'; m.looseT = 0; m.chargeT = 0;
      m.x = m.fence.x; m.y = m.fenceSide === 'top' ? 95 : 622;
      m.runDir = Math.random() < 0.5 ? -1 : 1; m.dir = m.runDir; m.atk = 0;
    }
    return;
  }
  // loose: 在觀眾席來回奔跑
  m.looseT += dt;
  m.x += m.runDir * 140 * dt;
  if (m.x < 165) { m.x = 165; m.runDir = 1; } else if (m.x > 1117) { m.x = 1117; m.runDir = -1; }
  m.dir = m.runDir;
  while (m.looseT >= 1.5 * (m.atk + 1) && m.atk < 4) {
    m.atk++;
    var vs = SH.visitors[m.fenceSide], best = null, bd = 1e9;
    for (i = 0; i < 8; i++) {
      if (vs[i].mode !== 'watch') continue;
      var dd = Math.abs(vs[i].x - m.x);
      if (dd < bd) { bd = dd; best = vs[i]; }
    }
    if (best) {
      best.mode = 'scared'; best.t = 0;
      repChange(-3);
      addFloat(best.x, best.y, '名聲 -3', 'repDown');
    }
  }
  if (m.looseT >= 6) {
    m.mode = 'roam'; m.x = 640; m.y = 356; m.rage = 30; m.marks = 0; m.markLeft = 0; m.slow = false;
    m.looseT = 0; m.perfTimer = rand(0.5, 2); m.relayPending = false; m.litT = 0;
    m.move = 'walk'; m.moveT = 0; m.moveDur = 0;
  }
}
function endShow() {
  var i;
  if (SH.cursor.hooked) releaseHook(false);
  for (i = 0; i < SH.mons.length; i++) {
    var m = SH.mons[i];
    if (m.mode === 'charge' || m.mode === 'loose') repChange(-5);
  }
  SH.hazards = [];
  if (S.day >= DAYS) {
    RESULT = {
      rep: S.rep, goldEarned: S.goldEarned, bestChain: S.bestChain,
      roster: S.order.map(function (sp) { return { species: sp, level: S.roster[sp] }; }),
      stars: S.rep >= 900 ? 3 : (S.rep >= 550 ? 2 : (S.rep >= 250 ? 1 : 0))
    };
    go('result');
  } else {
    SHOPC = 0;
    go('shop');
  }
}

// ================= 地下城選擇 =================
function condText(i) {
  var d = DUNGEONS[i];
  if (!d.need) return '';
  var sp = SPECIES[d.need.species].name;
  return '金幣 ' + d.need.gold + ' + 收服' + sp + ' ' + Math.min(S.caps[d.need.species], d.need.n) + '/' + d.need.n;
}
function updateSelect() {
  if (edge.left) SELC = Math.max(0, SELC - 1);
  if (edge.right) SELC = Math.min(2, SELC + 1);
  if (edge.up) { guidePage = 0; go('guide'); return; }
  if (edge.z) {
    var d = DUNGEONS[SELC];
    if (S.open[SELC]) startDungeon(SELC);
    else if (d.need && S.gold >= d.need.gold && S.caps[d.need.species] >= d.need.n) { S.gold -= d.need.gold; S.open[SELC] = true; }
  }
}

// ================= 商店 =================
function shopRC(i) { return { r: Math.floor(i / 3), c: i % 3 }; }
function shopCost(it) { return (it === 'attack' || it === 'armor' || it === 'ropeBag') ? S.price[it] : SHOP_BASE[it]; }
function updateShop() {
  var n = SHOP_ITEMS.length;
  if (SHOPC < n) {
    var rc = shopRC(SHOPC);
    if (edge.left && rc.c > 0) SHOPC--;
    else if (edge.right && rc.c < 2 && SHOPC + 1 < n) SHOPC++;
    else if (edge.up && rc.r > 0) SHOPC -= 3;
    else if (edge.down) { if (SHOPC + 3 < n) SHOPC += 3; else SHOPC = n; }
    else if (edge.z) buyItem(SHOP_ITEMS[SHOPC]);
  } else {
    if (edge.up) SHOPC = 9;
    else if (edge.z) { S.day++; go('select'); }
  }
}
function buyItem(it) {
  var cost = shopCost(it);
  if (WEAPONS[it]) {
    if (S.ownedW[it]) { S.weapon = it; return; }
    if (S.gold >= cost) { S.gold -= cost; S.ownedW[it] = true; S.weapon = it; }
  } else if (DEVICES[it]) {
    if (S.owned[it]) return;
    if (S.gold >= cost) { S.gold -= cost; S.owned[it] = true; }
  } else {
    if (S.gold < cost) return;
    S.gold -= cost; S.bought[it]++;
    S.price[it] = Math.round(S.price[it] * 1.5);
    if (it === 'attack') S.atk++; else if (it === 'armor') S.armor++; else S.rope++;
  }
}

// ================= 說明頁 =================
var GUIDE = [
  { title: '地下城', text: '方向鍵走, Z 攻擊, X 武器技' },
  { title: '收服', text: '殘血時站上去, 再繞牠一圈' },
  { title: '裝器材', text: '開演前, 挑兩樣器材裝上 Z、X' },
  { title: '表演中控場', text: '方向鍵移準星, 按 Z、X 用器材' },
  { title: '紅區', text: '紅區最賺, 標記滿 5 個就失控' },
  { title: '目標', text: '7 天內賺到越多名聲越好' }
];
var GUIDE_FRAME = { x: 140, y: 190, w: 1000, h: 430 }; // (x, y) 為左上角
function updateGuide() {
  if (edge.left) guidePage = Math.max(0, guidePage - 1);
  else if (edge.z || edge.right) {
    if (guidePage >= GUIDE.length - 1) { go('select'); }
    else guidePage++;
  }
}
function drawText(t, x, y, size, color, align) {
  ctx.font = 'bold ' + size + 'px "Microsoft JhengHei","PingFang TC",sans-serif';
  ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineJoin = 'round';
  ctx.strokeText(t, x, y);
  ctx.fillStyle = color || '#fff'; ctx.fillText(t, x, y);
}
function renderGuide() {
  Art.drawBackground(ctx, {});
  var g = GUIDE[guidePage], fr = GUIDE_FRAME;
  drawText('第 ' + (guidePage + 1) + ' 頁　' + g.title, W / 2, 85, 44, '#ffe9a8');
  drawText(g.text, W / 2, 142, 30, '#ffffff');
  Art.drawGuidePage(ctx, { page: guidePage + 1, x: fr.x, y: fr.y, w: fr.w, h: fr.h });
  drawText((guidePage + 1) + ' / ' + GUIDE.length, W / 2, 650, 24, '#cfd8ff');
  var hint = (guidePage > 0 ? '← 上一頁　' : '') + (guidePage >= GUIDE.length - 1 ? 'Z 開始遊戲' : 'Z 繼續');
  drawText(hint, W / 2, 688, 22, '#cfd8ff');
}

// ================= 主迴圈 =================
function update(dt) {
  switch (phase) {
    case 'guide': updateGuide(); break;
    case 'select': updateSelect(); break;
    case 'dungeon': updateDungeon(dt); break;
    case 'setup1': updateSetup1(); break;
    case 'setup2': updateSetup2(); break;
    case 'show': updateShow(dt); break;
    case 'shop': updateShop(); break;
    case 'result':
      if (edge.z) { newGame(); SELC = 0; go('select'); }
      break;
  }
}

function hudState() {
  var o = { phase: phase, day: S.day, dayMax: DAYS, gold: S.gold, rep: S.rep, hearts: 0, maxHearts: 0, ropes: 0, ropeMax: 0,
    weapon: S.weapon, xCdLeft: 0, xCdMax: 0, timeLeft: 0, timeMax: 0, dungeon: '', message: '' };
  switch (phase) {
    case 'guide': o.message = (guidePage > 0 ? '← 上一頁 ' : '') + 'Z 下一頁'; break;
    case 'select': o.message = '←→ 選擇 Z 進入 ↑ 說明'; break;
    case 'dungeon':
      o.hearts = Math.max(0, DG.tamer.hearts); o.maxHearts = maxHearts();
      o.ropes = DG.ropes; o.ropeMax = maxRopes();
      o.xCdMax = xCdMax(); o.xCdLeft = o.xCdMax ? Math.min(DG.tamer.cdX, o.xCdMax) : 0;
      o.timeLeft = Math.max(0, DG.time); o.timeMax = 60; o.dungeon = curDungeon().id;
      o.message = dungeonMessage(); break;
    case 'setup1': o.message = SU.btn ? 'Z 下一步 ↑ 回選卡' : '←→ 選 Z 上場/下場 ↓ 下一步'; break;
    case 'setup2': o.message = SU.btn ? 'Z 開演 X 回上一步' : '←→ 選器材 Z 裝到 Z 鍵 X 裝到 X 鍵 ↓ 開演'; break;
    case 'show': o.timeLeft = Math.max(0, SH.t); o.timeMax = 45; o.message = '方向鍵移準星 Z / X 用器材'; break;
    case 'shop': o.message = '方向鍵選擇 Z 購買/裝備'; break;
    case 'result': o.message = '按 Z 重來'; break;
  }
  return o;
}

function renderDungeon() {
  var d = curDungeon(), tiles = DG.map.tiles, i, r, c;
  Art.drawBackground(ctx, {});
  for (r = 0; r < 10; r++) for (c = 0; c < 20; c++) {
    var t = tiles[r][c];
    Art.drawTile(ctx, { x: c * 60 + 30 + OFFX, y: r * 60 + 30 + OFFY, dungeon: d.id, kind: t.kind, room: t.room, nest: t.nest });
  }
  for (i = 0; i < DG.hazards.length; i++) if (DG.hazards[i].phase !== 'fly') Art.drawHazard(ctx, hazState(DG.hazards[i], OFFX, OFFY));
  if (DG.prep) Art.drawCaptureRing(ctx, { x: DG.prep.m.x + OFFX, y: DG.prep.m.y + OFFY, t: DG.prep.t, dur: captureTime() });
  for (i = 0; i < DG.monsters.length; i++) {
    var m = DG.monsters[i];
    Art.drawWildMonster(ctx, {
      x: m.x + OFFX, y: m.y + OFFY, species: m.species, hp: m.hp, maxHp: m.maxHp, hit: m.hitT > 0, weak: isWeak(m),
      stunLeft: m.stun, stunDur: 2, lassoed: m.lassoed, casting: isCasting(m),
      move: m.move, moveT: m.moveT, moveDur: m.moveDur, dir: m.dir
    });
  }
  var T = DG.tamer;
  if (DG.lasso) {
    var L = DG.lasso;
    Art.drawLasso(ctx, { x1: T.x + OFFX, y1: T.y + OFFY, x2: L.m.x + OFFX, y2: L.m.y + OFFY, progress: Math.min(1, Math.abs(L.sum) / TAU),
      t: L.t, limit: L.limit, len: dist(T.x, T.y, L.m.x, L.m.y), maxLen: 220 });
  }
  Art.drawTamer(ctx, { x: T.x + OFFX, y: T.y + OFFY, facing: T.facing, weapon: S.weapon, dashing: !!T.dash, blink: T.inv > 0, lassoing: !!DG.lasso });
  for (i = 0; i < DG.fx.length; i++) {
    var f = DG.fx[i];
    Art.drawWeaponFx(ctx, { x: f.x + OFFX, y: f.y + OFFY, weapon: f.weapon, move: f.move, shape: f.shape, angle: f.angle, spread: f.spread,
      radius: f.radius, length: f.length, width: f.width, t: f.t, dur: f.dur });
  }
  for (i = 0; i < DG.hazards.length; i++) if (DG.hazards[i].phase === 'fly') Art.drawHazard(ctx, hazState(DG.hazards[i], OFFX, OFFY));
  drawFloats();
}
function hazState(h, ox, oy) {
  return { x: h.x + ox, y: h.y + oy, kind: h.kind, phase: h.phase, radius: h.radius, angle: h.angle, spread: h.spread,
    length: h.length, width: h.width, t: h.t, dur: h.phase === 'fly' ? 0 : h.dur, reflected: h.reflected };
}
function drawFloats() {
  for (var i = 0; i < floats.length; i++) {
    var f = floats[i];
    Art.drawFloatText(ctx, { x: f.x, y: f.y, text: f.text, kind: f.kind, t: f.t, dur: f.dur });
  }
}

function devState(key) {
  var dev = S.dev[key], def = DEVICES[dev];
  if (SH.hold[key]) return 'active';
  if (!def.hold && SH.cd[key] > 0) return 'cooldown';
  if (def.hold ? SH.energy <= 0 : SH.energy < def.cost) return 'lowPower';
  return 'ready';
}
function renderShow() {
  var i, f;
  Art.drawShowArena(ctx, {});
  for (i = 0; i < SH.fx.length; i++) {
    f = SH.fx[i];
    if (f.kind === 'fireWarn' || f.kind === 'mistWarn') Art.drawDeviceFx(ctx, { x: f.x, y: f.y, kind: f.kind, radius: f.radius, t: f.t, dur: f.dur });
  }
  for (i = 0; i < SH.hazards.length; i++) Art.drawHazard(ctx, hazState(SH.hazards[i], 0, 0));
  for (i = 0; i < SH.mons.length; i++) {
    var m = SH.mons[i];
    Art.drawShowMonster(ctx, {
      x: m.x, y: m.y, species: m.species, level: m.level, rage: m.rage, redLow: m.redLow,
      marks: m.marks, markLeft: m.marks > 0 ? Math.max(0, m.markLeft) : 0, markDur: 4,
      mode: m.mode, performing: m.performing, performT: m.performing ? m.performT : 0, performDur: 0.5,
      fx: m.fx, fxT: m.fx === 'none' ? 0 : m.fxT, fxDur: 0.5, lit: m.lit,
      jarT: m.mode === 'jarred' ? m.jarT : 0, jarDur: 3,
      chargeT: m.mode === 'charge' ? m.chargeT : 0, chargeDur: 1.5,
      looseT: m.mode === 'loose' ? m.looseT : 0, looseDur: 6,
      move: m.move, moveT: m.moveT, moveDur: m.moveDur, dir: m.dir
    });
  }
  var cur = SH.cursor;
  if (spotActive()) Art.drawDeviceFx(ctx, { x: cur.x, y: cur.y, kind: 'spot', radius: 100, t: 0, dur: 0 });
  if (cur.hooked) Art.drawDeviceFx(ctx, { x: cur.hooked.x, y: cur.hooked.y, kind: 'hookRope', radius: 0, t: 0, dur: 0 });
  for (i = 0; i < SH.fx.length; i++) {
    f = SH.fx[i];
    if (f.kind === 'mistBurst' || f.kind === 'fireBurst' || f.kind === 'jarDrop') Art.drawDeviceFx(ctx, { x: f.x, y: f.y, kind: f.kind, radius: f.radius, t: f.t, dur: f.dur });
  }
  var sides = ['top', 'bottom'], j;
  for (i = 0; i < 2; i++) for (j = 0; j < 8; j++) {
    var fe = SH.fences[sides[i]][j];
    Art.drawFence(ctx, { x: fe.x, y: fe.y, side: fe.side, broken: fe.broken });
    var v = SH.visitors[sides[i]][j];
    Art.drawVisitor(ctx, { x: v.x, y: v.y, side: v.side, mode: v.mode });
  }
  var holding = SH.hold.z ? 'z' : (SH.hold.x ? 'x' : '');
  Art.drawCursor(ctx, { x: cur.x, y: cur.y, zDevice: S.dev.z, xDevice: S.dev.x, zRange: DEVICES[S.dev.z].range, xRange: DEVICES[S.dev.x].range,
    holding: holding, hooking: !!cur.hooked });
  for (i = 0; i < SH.names.length; i++) {
    var n = SH.names[i];
    Art.drawDeviceName(ctx, { x: n.x, y: n.y, device: n.device, t: n.t, dur: n.dur });
  }
  drawFloats();
  Art.drawControlPanel(ctx, { x: 640, y: 691, energy: SH.energy, energyMax: 100, zDevice: S.dev.z, xDevice: S.dev.x,
    zState: devState('z'), xState: devState('x') });
}

function render() {
  var i;
  ctx.clearRect(0, 0, W, H);
  switch (phase) {
    case 'guide': renderGuide(); break;
    case 'select':
      Art.drawBackground(ctx, {});
      for (i = 0; i < 3; i++) {
        Art.drawDungeonCard(ctx, { x: 240 + 400 * i, y: 390, dungeon: DUNGEONS[i].id, open: S.open[i], condition: S.open[i] ? '' : condText(i), selected: SELC === i });
      }
      break;
    case 'dungeon': renderDungeon(); break;
    case 'setup1':
      Art.drawBackground(ctx, {});
      for (i = 0; i < S.order.length; i++) {
        var sp = S.order[i];
        Art.drawRosterCard(ctx, { x: 160 + 192 * i, y: 300, species: sp, level: S.roster[sp], picked: !!S.picks[sp], selected: !SU.btn && SU.cur === i });
      }
      Art.drawButton(ctx, { x: 540, y: 560, w: 200, h: 80, label: '下一步', selected: SU.btn });
      break;
    case 'setup2':
      Art.drawBackground(ctx, {});
      Art.drawDeviceSlot(ctx, { x: 440, y: 160, key: 'z', device: S.dev.z });
      Art.drawDeviceSlot(ctx, { x: 840, y: 160, key: 'x', device: S.dev.x });
      var list = ownedDevices();
      for (i = 0; i < list.length; i++) {
        var dv = list[i];
        Art.drawDeviceCard(ctx, { x: 200 + 220 * i, y: 420, device: dv, slot: S.dev.z === dv ? 'z' : (S.dev.x === dv ? 'x' : ''), selected: !SU.btn && SU.cur === i });
      }
      Art.drawButton(ctx, { x: 540, y: 600, w: 200, h: 80, label: '開演', selected: SU.btn });
      break;
    case 'show': renderShow(); break;
    case 'shop':
      Art.drawBackground(ctx, {});
      for (i = 0; i < SHOP_ITEMS.length; i++) {
        var it = SHOP_ITEMS[i], rc = shopRC(i), cost = shopCost(it);
        var owned = WEAPONS[it] ? !!S.ownedW[it] : (DEVICES[it] ? !!S.owned[it] : false);
        Art.drawShopItem(ctx, { x: 220 + 420 * rc.c, y: 140 + 115 * rc.r, item: it, cost: cost,
          level: S.bought[it] || 0, owned: owned, equipped: !!WEAPONS[it] && S.weapon === it,
          affordable: S.gold >= cost, selected: SHOPC === i });
      }
      Art.drawButton(ctx, { x: 540, y: 610, w: 200, h: 70, label: '出發', selected: SHOPC === SHOP_ITEMS.length });
      break;
    case 'result':
      Art.drawBackground(ctx, {});
      Art.drawResultPanel(ctx, RESULT);
      break;
  }
  Art.drawHud(ctx, hudState());
}

function frame(ts) {
  requestAnimationFrame(frame);
  var dt = lastTs ? (ts - lastTs) / 1000 : 0;
  lastTs = ts;
  if (dt > 1 / 30) dt = 1 / 30;
  if (dt < 0) dt = 0;
  try { update(dt); render(); } catch (e) { console.error(e); }
  clearEdges();
}

newGame();
requestAnimationFrame(frame);
})();
