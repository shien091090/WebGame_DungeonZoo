/* 怪獸節目表 — 玩法驗證 Demo。只用方向鍵 + Z、X。
   邏輯(update*)與繪製(render*)分離; 繪製一律呼叫 Art.drawXxx。 */

var CW = Art.canvas.width, CH = Art.canvas.height;
var OFFY = 130; // 地下城: 畫面 y = 世界 y + 130
var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');

/* 需要但 Art 沒有的圖形集中在這裡(目前沒有) */
var Placeholder = {};

/* ================= 常數與資料 ================= */
var DAY_MAX = 7;
var SP = {
  fire:    { name: '火蜥蜴', hp: 10, interval: 2.4, kill: 4, decay: 2,   gold: 2, rep: 1, bonus: '烈火' },
  water:   { name: '水母',   hp: 7,  interval: 1.6, kill: 4, decay: 3,   gold: 1, rep: 1, bonus: '柔水' },
  thunder: { name: '雷鳥',   hp: 14, interval: 2.6, kill: 6, decay: 4,   gold: 3, rep: 2, bonus: '迅雷' },
  spike:   { name: '刺蝟',   hp: 12, interval: 2.2, kill: 6, decay: 2.5, gold: 2, rep: 1, bonus: '尖刺' },
  stone:   { name: '石像鬼', hp: 22, interval: 3.0, kill: 8, decay: 0.5, gold: 3, rep: 2, bonus: '石膚' },
  ghost:   { name: '幽靈',   hp: 16, interval: 2.8, kill: 8, decay: 1.5, gold: 3, rep: 2, bonus: '幽影' }
};
var NEST_SP = { f: 'fire', j: 'water', t: 'thunder', h: 'spike', g: 'stone', p: 'ghost' };

var COMMON_ROWS = [
  '#####..#####',
  '#..........#',
  '#..........#',
  '#....S.....#',
  '#..........#',
  '#..........#',
  '############'
];
var DUNGEONS = [
  { id: 'cave', name: '濕熱洞窟', sp: ['fire', 'water'], unlock: null,
    rows: ['############', '#LL......LL#', '#L..f..f..L#', '#..........#', '#.L......L.#', '#..........#',
           '#####..#####', '#..WW......#', '#.j....WW..#', '#......j...#', '#.WW.......#', '#.....WW...#'] },
  { id: 'cliff', name: '雷鳴崖', sp: ['thunder', 'spike'], unlock: { gold: 60, sp: 'water', n: 2 },
    rows: ['############', '#..t....t..#', '#.o......o.#', '#..........#', '#.o......o.#', '#..........#',
           '#####..#####', '#..........#', '#.h......h.#', '#...oo.....#', '#.......oo.#', '#..........#'] },
  { id: 'ruins', name: '古代遺跡', sp: ['stone', 'ghost'], unlock: { gold: 120, sp: 'spike', n: 2 },
    rows: ['############', '#..........#', '#.g..o...g.#', '#....L.....#', '#.o......o.#', '#..........#',
           '#####..#####', '#..........#', '#.p..oo..p.#', '#..........#', '#.L......L.#', '#..........#'] }
];
var CARDS = [
  { key: 'provoke', name: '激將',     cost: 0, desc: '點名的魔物大怒' },
  { key: 'chill',   name: '冰鎮',     cost: 0, desc: '點名的魔物冷靜下來' },
  { key: 'rampage', name: '橫衝直撞', cost: 0, desc: '點名的魔物一路撞開別隻' },
  { key: 'rally',   name: '集合',     cost: 0, desc: '全場其他魔物跑到點名的魔物身邊' },
  { key: 'encore',  name: '安可',     cost: 0, desc: '點名的魔物連演 3 次' }
];
function cardDef(k) { for (var i = 0; i < CARDS.length; i++) if (CARDS[i].key === k) return CARDS[i]; return null; }

var WEAPONS = {
  club:  { name: '棍棒', zCd: 0.35, zDmg: 2, price: 0 },
  sword: { name: '劍',   zCd: 0.35, zDmg: 2, price: 60 },
  spear: { name: '長槍', zCd: 0.45, zDmg: 2, price: 60 },
  whip:  { name: '長鞭', zCd: 0.4,  zDmg: 1, price: 60 }
};
var X_CD = { club: 0, sword: 3, spear: 1.2, whip: 1.2 };
var SHOP_ITEMS = ['club', 'sword', 'spear', 'whip', 'attack', 'armor', 'ropeBag'];
var GUIDE_TITLES = ['地下城', '收服', '排節目', '紅區', '目標'];
var GUIDE_TEXTS = ['方向鍵走, Z 攻擊, X 武器技', '殘血時站上去, 再繞牠一圈', '排好節目表, 時間到就點名', '紅區最賺, 標記滿 5 個就失控', '7 天內賺到越多名聲越好'];

var TAMER_R = 18, MON_R = 30; // 判定半徑(魔物為估計值: 圖大小 90)
var ROOMS = { top: { x0: 60, x1: 660, y0: 60, y1: 360 }, bottom: { x0: 60, x1: 660, y0: 420, y1: 720 } };
var ARENA = { x0: 100, x1: 620, y0: 310, y1: 950 };
var FACE_TABLE = { '0,-1': 0, '1,-1': 1, '1,0': 2, '1,1': 3, '0,1': 4, '-1,1': 5, '-1,0': 6, '-1,-1': 7 };

/* ================= 工具 ================= */
function rnd(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function dist(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }
function angNorm(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rad(deg) { return deg * Math.PI / 180; }

/* ================= 全域狀態 ================= */
var keys = {};
var presses = [];
var blockZ = false, blockX = false;

var G = null;      // 整場遊戲
var D = null;      // 地下城
var S = null;      // 布置
var W = null;      // 表演場
var floats = [];

function newGame() {
  G = {
    phase: 'select', day: 1, gold: 30, rep: 0, goldEarned: 0, bestChain: 0,
    weapon: 'club', owned: { club: true, sword: false, spear: false, whip: false },
    atk: 0, armor: 0, rope: 0,
    price: { attack: 50, armor: 40, ropeBag: 40 },
    roster: [{ sp: 'fire', lv: 0 }, { sp: 'water', lv: 0 }],
    caught: { fire: 0, water: 0, thunder: 0, spike: 0, stone: 0, ghost: 0 },
    open: { cave: true, cliff: false, ruins: false },
    selIdx: 0, shopIdx: 0,
    guidePage: 0, guideFrom: 'select', guideOpenedInGame: false,
    stars: 0
  };
  D = null; S = null; W = null; floats = [];
}
newGame();
G.phase = 'guide'; G.guidePage = 0; G.guideFrom = 'select'; G.guideOpenedInGame = false;

function lvOf(sp) { for (var i = 0; i < G.roster.length; i++) if (G.roster[i].sp === sp) return G.roster[i].lv; return -1; }
function lvBonus(sp) { var l = lvOf(sp); return l < 0 ? 0 : l; }
function maxHearts() { return 5 + G.armor + lvBonus('stone'); }
function ropeMax() { return 3 + G.rope; }
function tamerSpeed() { return 300 + 25 * lvBonus('thunder'); }
function redLowOf(sp) { return 80 - 5 * Math.max(0, lvOf(sp)); }
function captureTime() { return Math.max(0.35, 0.8 - 0.15 * lvBonus('water')); }
function lassoLimit() { return 5 + lvBonus('ghost'); }
function addGold(n) { G.gold += n; G.goldEarned += n; }
function addRep(n) { G.rep = Math.max(0, G.rep + n); }

function addFloat(x, y, text, kind) { floats.push({ x: x, y: y, text: text, kind: kind, t: 0, dur: 1 }); }
function updFloats(dt) {
  for (var i = floats.length - 1; i >= 0; i--) { floats[i].t += dt; if (floats[i].t >= floats[i].dur) floats.splice(i, 1); }
}

/* ================= 輸入(只有鍵盤: 方向鍵 + Z + X) ================= */
var KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyZ: 'z', KeyX: 'x', z: 'z', Z: 'z', x: 'x', X: 'x' };
function keyOf(e) { return KEYMAP[e.code] || KEYMAP[e.key] || null; }
window.addEventListener('keydown', function (e) {
  var k = keyOf(e);
  if (!k) return;
  e.preventDefault();
  if (e.repeat) return;
  if (!keys[k]) { keys[k] = true; presses.push(k); }
});
window.addEventListener('keyup', function (e) {
  var k = keyOf(e);
  if (!k) return;
  e.preventDefault();
  keys[k] = false;
  if (k === 'z') blockZ = false;
  if (k === 'x') blockX = false;
});
window.addEventListener('blur', function () { keys = {}; blockZ = false; blockX = false; });

/* ================= 畫布 ================= */
function fit() {
  var dpr = window.devicePixelRatio || 1;
  var s = Math.min(window.innerWidth / CW, window.innerHeight / CH);
  if (!(s > 0)) s = 1;
  var cssW = Math.floor(CW * s), cssH = Math.floor(CH * s);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  ctx.setTransform(canvas.width / CW, 0, 0, canvas.height / CH, 0, 0);
}
window.addEventListener('resize', fit);
fit();

/* ================= 地圖 ================= */
var MAP = null;
function buildMap(dun) {
  var rows = dun.rows.concat(COMMON_ROWS);
  var tiles = [], nests = [];
  for (var r = 0; r < 19; r++) {
    var line = [];
    for (var c = 0; c < 12; c++) {
      var ch = rows[r].charAt(c);
      var kind = 'floor', nest = false;
      if (ch === '#') kind = 'wall';
      else if (ch === 'o') kind = 'pillar';
      else if (ch === 'L') kind = 'lava';
      else if (ch === 'W') kind = 'water';
      else if (NEST_SP[ch]) { nest = true; nests.push({ col: c, row: r, sp: NEST_SP[ch], x: c * 60 + 30, y: r * 60 + 30, mon: null, respawn: 0 }); }
      var room = 'hall';
      if (c >= 1 && c <= 10 && r >= 1 && r <= 5) room = 'top';
      else if (c >= 1 && c <= 10 && r >= 7 && r <= 11) room = 'bottom';
      line.push({ kind: kind, room: room, nest: nest, col: c, row: r });
    }
    tiles.push(line);
  }
  return { tiles: tiles, nests: nests, dun: dun };
}
function tileAt(col, row) { if (col < 0 || col > 11 || row < 0 || row > 18) return null; return MAP.tiles[row][col]; }
function solidAt(x, y) { var t = tileAt(Math.floor(x / 60), Math.floor(y / 60)); return !t || t.kind === 'wall' || t.kind === 'pillar'; }
function circleHitsKind(x, y, r, kinds) {
  var c0 = Math.floor((x - r) / 60), c1 = Math.floor((x + r) / 60), r0 = Math.floor((y - r) / 60), r1 = Math.floor((y + r) / 60);
  for (var rr = r0; rr <= r1; rr++) for (var cc = c0; cc <= c1; cc++) {
    var t = tileAt(cc, rr);
    var k = t ? t.kind : 'wall';
    if (kinds.indexOf(k) < 0) continue;
    var nx = clamp(x, cc * 60, cc * 60 + 60), ny = clamp(y, rr * 60, rr * 60 + 60);
    var dx = x - nx, dy = y - ny;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}
var WALLS = ['wall', 'pillar'];

/* ================= 地下城 ================= */
function startDungeon(id) {
  var dun = null;
  for (var i = 0; i < DUNGEONS.length; i++) if (DUNGEONS[i].id === id) dun = DUNGEONS[i];
  MAP = buildMap(dun);
  D = {
    id: id, t: 0, x: 330, y: 930, facing: 0,
    hearts: maxHearts(), ropes: ropeMax(), invuln: 0,
    zCd: 0, xCd: 0, dash: null,
    mons: [], hazards: [], wfx: [], ring: null, lasso: null, ended: false
  };
  for (var n = 0; n < MAP.nests.length; n++) spawnWild(MAP.nests[n]);
  floats = [];
  presses = [];
  blockZ = !!keys.z; blockX = !!keys.x;
  G.phase = 'dungeon';
}

function spawnWild(nest) {
  var d = SP[nest.sp];
  var m = {
    sp: nest.sp, x: nest.x, y: nest.y, hp: d.hp, maxHp: d.hp, nest: nest,
    room: nest.row < 6 ? 'top' : 'bottom',
    hitT: 0, stun: 0, lassoed: false, dead: false, dir: 1,
    cd: d.interval * rnd(0.5, 1), rT: 0, rdx: 0, rdy: 0,
    knockT: 0, kvx: 0, kvy: 0,
    dashCd: 2, dashT: 0, ddx: 0, ddy: 0,
    rollT: 4, rollDx: 1, rollDy: 0, tpCd: 3
  };
  var a = rnd(0, Math.PI * 2);
  m.rollDx = Math.cos(a); m.rollDy = Math.sin(a);
  nest.mon = m;
  D.mons.push(m);
  return m;
}
function isWeak(m) { return m.hp <= m.maxHp * 0.3; }
function clampRoom(m) {
  var r = ROOMS[m.room];
  m.x = clamp(m.x, r.x0 + 30, r.x1 - 30);
  m.y = clamp(m.y, r.y0 + 30, r.y1 - 30);
}

function hurtTamer() {
  if (D.invuln > 0 || D.dash) return false;
  D.hearts -= 1;
  D.invuln = 1;
  if (D.lasso) breakLasso();
  if (D.ring) D.ring.t = 0;
  if (D.hearts <= 0) D.ended = true;
  return true;
}
function breakLasso() {
  if (!D.lasso) return;
  D.lasso.m.lassoed = false;
  D.lasso = null;
}
function cancelWarn(m) {
  for (var i = D.hazards.length - 1; i >= 0; i--) if (D.hazards[i].owner === m && D.hazards[i].phase === 'warn') D.hazards.splice(i, 1);
}
function hasWarn(m) {
  for (var i = 0; i < D.hazards.length; i++) if (D.hazards[i].owner === m && D.hazards[i].phase === 'warn') return true;
  return false;
}

function hitMonster(m, dmg) {
  if (m.dead || m.lassoed) return;
  m.hp -= dmg;
  m.hitT = 0.1;
  if (D.ring && D.ring.m === m) D.ring = null;
  if (m.hp <= 0) killWild(m);
}
function killWild(m) {
  m.dead = true;
  var i = D.mons.indexOf(m);
  if (i >= 0) D.mons.splice(i, 1);
  m.nest.mon = null; m.nest.respawn = 8;
  cancelWarn(m);
  addGold(SP[m.sp].kill);
  addFloat(m.x, m.y + OFFY, '+' + SP[m.sp].kill, 'gold');
  if (D.ring && D.ring.m === m) D.ring = null;
}

/* --- 魔物技能(地下城) --- */
function mkHazard(kind, x, y, o) {
  var h = { kind: kind, x: x, y: y, phase: 'warn', radius: 0, t: 0, dur: 0, angle: 0, reflected: false,
            owner: null, vx: 0, vy: 0, speed: 0, life: 0, hit: [], follow: false, perf: null, dead: false, homing: false };
  if (kind === 'firering') { h.radius = 120; h.dur = 0.5; h.follow = true; }
  else if (kind === 'thunder') { h.radius = 70; h.dur = 0.8; }
  else if (kind === 'quake') { h.phase = 'active'; h.radius = 0; h.dur = 1; h.follow = true; }
  else if (kind === 'waterball') { h.phase = 'fly'; h.radius = 12; h.speed = 300; }
  else if (kind === 'spike') { h.phase = 'fly'; h.radius = 10; h.speed = 260; }
  else if (kind === 'wisp') { h.phase = 'fly'; h.radius = 14; h.speed = 160; h.dur = 3; h.homing = true; }
  if (o) for (var k in o) h[k] = o[k];
  if (h.phase === 'fly') { h.vx = Math.cos(h.angle) * h.speed; h.vy = Math.sin(h.angle) * h.speed; }
  return h;
}
function wildCast(m, tx, ty) {
  var a = Math.atan2(ty - m.y, tx - m.x), hs = D.hazards, i;
  if (m.sp === 'fire') hs.push(mkHazard('firering', m.x, m.y, { owner: m }));
  else if (m.sp === 'water') { for (i = -1; i <= 1; i++) hs.push(mkHazard('waterball', m.x, m.y, { owner: m, angle: a + rad(20) * i })); }
  else if (m.sp === 'thunder') hs.push(mkHazard('thunder', tx, ty, { owner: m }));
  else if (m.sp === 'spike') { for (i = 0; i < 8; i++) hs.push(mkHazard('spike', m.x, m.y, { owner: m, angle: rad(45) * i })); }
  else if (m.sp === 'stone') hs.push(mkHazard('quake', m.x, m.y, { owner: m }));
  else if (m.sp === 'ghost') hs.push(mkHazard('wisp', m.x, m.y, { owner: m, angle: a }));
}

function randomWalk(m, speed, dt) {
  m.rT -= dt;
  if (m.rT <= 0) { var a = rnd(0, Math.PI * 2); m.rdx = Math.cos(a); m.rdy = Math.sin(a); m.rT = rnd(2, 3); }
  m.x += m.rdx * speed * dt; m.y += m.rdy * speed * dt;
  if (m.rdx !== 0) m.dir = m.rdx > 0 ? 1 : -1;
}
function updWild(m, dt) {
  if (m.hitT > 0) m.hitT -= dt;
  if (m.knockT > 0) {
    m.knockT -= dt; m.x += m.kvx * dt; m.y += m.kvy * dt; clampRoom(m);
    return;
  }
  if (m.stun > 0) { m.stun -= dt; return; }
  if (m.lassoed) return;
  var weak = isWeak(m), sm = weak ? 0.5 : 1;
  var d = dist(m.x, m.y, D.x, D.y);
  var far = d >= 320;
  var ang = Math.atan2(D.y - m.y, D.x - m.x);
  var sp = m.sp;
  if (sp === 'fire') {
    if (far) randomWalk(m, 40 * sm, dt);
    else if (d > 80) { m.x += Math.cos(ang) * 70 * sm * dt; m.y += Math.sin(ang) * 70 * sm * dt; m.dir = Math.cos(ang) >= 0 ? 1 : -1; }
  } else if (sp === 'water') {
    if (far) randomWalk(m, 40 * sm, dt);
    else {
      var rv = 0;
      if (d < 220) rv = -60; else if (d > 320) rv = 40;
      var tx = -Math.sin(ang), ty = Math.cos(ang); // 繞行方向(垂直於朝向)
      var vx = Math.cos(ang) * rv + tx * 40, vy = Math.sin(ang) * rv + ty * 40;
      m.x += vx * sm * dt; m.y += vy * sm * dt;
      if (vx !== 0) m.dir = vx > 0 ? 1 : -1;
    }
  } else if (sp === 'thunder') {
    if (m.dashT > 0) {
      m.dashT -= dt; m.x += m.ddx * 600 * sm * dt; m.y += m.ddy * 600 * sm * dt;
    } else {
      m.dashCd -= dt;
      if (m.dashCd <= 0) {
        var a2 = rnd(0, Math.PI * 2); m.ddx = Math.cos(a2); m.ddy = Math.sin(a2);
        m.dashT = 0.3; m.dashCd = 2; m.dir = m.ddx >= 0 ? 1 : -1;
      }
    }
  } else if (sp === 'spike') {
    m.rollT -= dt;
    if (m.rollT <= 0) { var a3 = rnd(0, Math.PI * 2); m.rollDx = Math.cos(a3); m.rollDy = Math.sin(a3); m.rollT = 4; }
    m.x += m.rollDx * 110 * sm * dt; m.y += m.rollDy * 110 * sm * dt;
    var r = ROOMS[m.room];
    if (m.x < r.x0 + 30) { m.x = r.x0 + 30; m.rollDx = Math.abs(m.rollDx); }
    if (m.x > r.x1 - 30) { m.x = r.x1 - 30; m.rollDx = -Math.abs(m.rollDx); }
    if (m.y < r.y0 + 30) { m.y = r.y0 + 30; m.rollDy = Math.abs(m.rollDy); }
    if (m.y > r.y1 - 30) { m.y = r.y1 - 30; m.rollDy = -Math.abs(m.rollDy); }
    m.dir = m.rollDx >= 0 ? 1 : -1;
  } else if (sp === 'stone') {
    if (far) randomWalk(m, 25 * sm, dt);
    else { m.x += Math.cos(ang) * 35 * sm * dt; m.y += Math.sin(ang) * 35 * sm * dt; m.dir = Math.cos(ang) >= 0 ? 1 : -1; }
  } else if (sp === 'ghost') {
    m.tpCd -= dt;
    if (m.tpCd <= 0) {
      m.tpCd = 3;
      var rr = ROOMS[m.room], tries = 0, nx = m.x, ny = m.y;
      while (tries++ < 40) {
        var col = Math.floor(rnd(rr.x0 / 60, rr.x1 / 60)), row = Math.floor(rnd(rr.y0 / 60, rr.y1 / 60));
        var t = tileAt(col, row);
        if (!t || t.kind !== 'floor') continue;
        var px = col * 60 + 30, py = row * 60 + 30;
        if (dist(px, py, D.x, D.y) >= 120) { nx = px; ny = py; break; }
      }
      m.x = nx; m.y = ny;
    }
  }
  clampRoom(m);
  // 施放
  m.cd -= dt;
  if (!far && m.cd <= 0) {
    wildCast(m, D.x, D.y);
    m.cd = SP[sp].interval * (weak ? 1.5 : 1);
  }
}

/* --- 武器 --- */
function faceAngle() { return rad(D.facing * 45 - 90); }
function inArc(px, py, ox, oy, ang, spread, radius, mr) {
  var d = dist(px, py, ox, oy);
  if (d <= mr) return true;
  if (d > radius + mr) return false;
  var half = spread / 2 + Math.asin(Math.min(1, mr / d));
  return Math.abs(angNorm(Math.atan2(py - oy, px - ox) - ang)) <= half;
}
function addWfx(o) { o.t = 0; o.x = D.x; o.y = D.y; D.wfx.push(o); }
function doZ() {
  var w = G.weapon, ang = faceAngle(), bonus = 1 + 0.1 * lvBonus('fire'), dmg = WEAPONS[w].zDmg + G.atk;
  var hits = [], i, m;
  if (w === 'club' || w === 'sword') {
    var spread = rad(w === 'club' ? 100 : 120), r = (w === 'club' ? 70 : 80) * bonus;
    addWfx({ weapon: w, move: 'normal', shape: 'arc', angle: ang, spread: spread, radius: r, length: 0, width: 0, dur: 0.2, follow: true });
    for (i = 0; i < D.mons.length; i++) { m = D.mons[i]; if (inArc(m.x, m.y, D.x, D.y, ang, spread, r, MON_R)) hits.push(m); }
    if (w === 'sword') {
      for (i = 0; i < D.hazards.length; i++) {
        var h = D.hazards[i];
        if (h.phase !== 'fly' || h.reflected) continue;
        if (inArc(h.x, h.y, D.x, D.y, ang, spread, r, h.radius)) reflectHazard(h);
      }
    }
  } else if (w === 'spear') {
    var len = 170 * bonus;
    addWfx({ weapon: w, move: 'normal', shape: 'line', angle: ang, spread: 0, radius: 0, length: len, width: 40, dur: 0.2, follow: true });
    var ca = Math.cos(ang), sa = Math.sin(ang);
    for (i = 0; i < D.mons.length; i++) {
      m = D.mons[i];
      var dx = m.x - D.x, dy = m.y - D.y, al = dx * ca + dy * sa, pe = -dx * sa + dy * ca;
      if (al >= -MON_R && al <= len + MON_R && Math.abs(pe) <= 20 + MON_R) hits.push(m);
    }
  } else if (w === 'whip') {
    var rw = 100 * bonus;
    addWfx({ weapon: w, move: 'normal', shape: 'circle', angle: ang, spread: 0, radius: rw, length: 0, width: 0, dur: 0.2, follow: true });
    for (i = 0; i < D.mons.length; i++) { m = D.mons[i]; if (dist(m.x, m.y, D.x, D.y) <= rw + MON_R) hits.push(m); }
  }
  for (i = 0; i < hits.length; i++) hitMonster(hits[i], dmg);
  D.zCd = WEAPONS[w].zCd;
}
function reflectHazard(h) {
  var o = h.owner, a;
  if (o && !o.dead && D.mons.indexOf(o) >= 0) a = Math.atan2(o.y - D.y, o.x - D.x);
  else a = Math.atan2(h.vy, h.vx) + Math.PI;
  h.angle = a; h.speed *= 1.2; h.vx = Math.cos(a) * h.speed; h.vy = Math.sin(a) * h.speed;
  h.reflected = true; h.homing = false;
}
function xCdMax() { return X_CD[G.weapon] * (G.weapon === 'club' ? 0 : (1 - 0.15 * lvBonus('spike'))); }
function doX() {
  var w = G.weapon;
  if (w === 'club' || D.xCd > 0) return;
  var ang = faceAngle(), i, m;
  if (w === 'sword') {
    var spread = rad(120);
    addWfx({ weapon: w, move: 'skill', shape: 'arc', angle: ang, spread: spread, radius: 80, length: 0, width: 0, dur: 0.2, follow: true });
    for (i = 0; i < D.mons.length; i++) {
      m = D.mons[i];
      if (inArc(m.x, m.y, D.x, D.y, ang, spread, 80, MON_R)) { m.stun = 2; cancelWarn(m); if (D.ring && D.ring.m === m) D.ring = null; }
    }
  } else if (w === 'spear') {
    D.dash = { t: 0, dx: Math.cos(ang), dy: Math.sin(ang), left: 220, hit: [], sx: D.x, sy: D.y };
    addWfx({ weapon: w, move: 'skill', shape: 'dash', angle: ang, spread: 0, radius: 0, length: 220, width: 0, dur: 0.25, follow: false });
  } else if (w === 'whip') {
    var sp2 = rad(100);
    addWfx({ weapon: w, move: 'skill', shape: 'arc', angle: ang, spread: sp2, radius: 170, length: 0, width: 0, dur: 0.2, follow: true });
    var list = D.mons.slice();
    for (i = 0; i < list.length; i++) {
      m = list[i];
      if (inArc(m.x, m.y, D.x, D.y, ang, sp2, 170, MON_R)) {
        var wasLassoed = m.lassoed;
        hitMonster(m, 2 + G.atk);
        if (!m.dead && !wasLassoed) {
          var ka = Math.atan2(m.y - D.y, m.x - D.x);
          m.knockT = 0.25; m.kvx = Math.cos(ka) * 640; m.kvy = Math.sin(ka) * 640; // 160 像素 / 0.25 秒
        }
      }
    }
  }
  D.xCd = xCdMax();
}

/* --- 馴獸師 --- */
function tamerTryMove(dx, dy) {
  var ox = D.x, oy = D.y;
  if (dx !== 0 && !circleHitsKind(D.x + dx, D.y, TAMER_R, WALLS)) D.x += dx;
  if (dy !== 0 && !circleHitsKind(D.x, D.y + dy, TAMER_R, WALLS)) D.y += dy;
  return dist(ox, oy, D.x, D.y);
}
function updTamer(dt) {
  if (D.invuln > 0) D.invuln -= dt;
  if (D.zCd > 0) D.zCd -= dt;
  if (D.xCd > 0) D.xCd -= dt;
  if (blockZ && !keys.z) blockZ = false;
  if (blockX && !keys.x) blockX = false;
  var i;
  if (D.dash) {
    var ds = D.dash;
    ds.t += dt;
    var step = Math.min(ds.left, 880 * dt);
    var moved = tamerTryMove(ds.dx * step, ds.dy * step);
    ds.left -= moved;
    for (i = 0; i < D.mons.length; i++) {
      var m = D.mons[i];
      if (ds.hit.indexOf(m) >= 0) continue;
      if (dist(m.x, m.y, D.x, D.y) <= MON_R + TAMER_R) { ds.hit.push(m); hitMonster(m, 3 + G.atk); }
    }
    if (ds.t >= 0.25 || ds.left <= 0.5 || moved < step * 0.5) D.dash = null;
    return;
  }
  var ix = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), iy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  if (ix !== 0 || iy !== 0) {
    D.facing = FACE_TABLE[ix + ',' + iy];
    var len = Math.sqrt(ix * ix + iy * iy);
    var spd = tamerSpeed();
    var tl = tileAt(Math.floor(D.x / 60), Math.floor(D.y / 60));
    if (tl && tl.kind === 'water') spd *= 0.5;
    tamerTryMove(ix / len * spd * dt, iy / len * spd * dt);
  }
  if (keys.z && !blockZ && D.zCd <= 0) doZ();
  if (keys.x && !blockX && D.xCd <= 0) doX();
}

/* --- 捕捉 --- */
function updCapture(dt) {
  var i;
  if (D.lasso) {
    var l = D.lasso, m = l.m;
    l.t += dt;
    var a = Math.atan2(D.y - m.y, D.x - m.x);
    l.sum += angNorm(a - l.last); l.last = a;
    var d = dist(D.x, D.y, m.x, m.y);
    if (Math.abs(l.sum) / (Math.PI * 2) >= 1) { captureDone(m); return; }
    if (l.t >= lassoLimit() || d > 220) breakLasso();
    return;
  }
  if (D.ropes <= 0) { D.ring = null; return; }
  var best = null, bd = 1e9;
  for (i = 0; i < D.mons.length; i++) {
    var w = D.mons[i];
    if (!isWeak(w)) continue;
    var dd = dist(D.x, D.y, w.x, w.y);
    if (dd <= 40 && dd < bd) { bd = dd; best = w; }
  }
  if (!best) { D.ring = null; return; }
  if (!D.ring || D.ring.m !== best) D.ring = { m: best, t: 0, dur: captureTime() };
  D.ring.dur = captureTime();
  D.ring.t += dt;
  if (D.ring.t >= D.ring.dur) {
    best.lassoed = true;
    cancelWarn(best);
    var a0 = Math.atan2(D.y - best.y, D.x - best.x);
    D.lasso = { m: best, t: 0, sum: 0, last: a0 };
    D.ring = null;
  }
}
function captureDone(m) {
  D.lasso = null;
  D.ropes -= 1;
  m.dead = true;
  var i = D.mons.indexOf(m);
  if (i >= 0) D.mons.splice(i, 1);
  m.nest.mon = null; m.nest.respawn = 8;
  cancelWarn(m);
  addFloat(m.x, m.y + OFFY, '收服!', 'capture');
  G.caught[m.sp] += 1;
  var lv = lvOf(m.sp);
  if (lv < 0) G.roster.push({ sp: m.sp, lv: 0 });
  else if (lv < 3) {
    for (var k = 0; k < G.roster.length; k++) if (G.roster[k].sp === m.sp) G.roster[k].lv += 1;
    if (m.sp === 'stone') D.hearts += 1;
    addFloat(m.x, m.y + OFFY - 40, '等級 +1', 'levelUp');
  } else {
    addGold(20);
    addFloat(m.x, m.y + OFFY - 40, '+20', 'coin20');
  }
}

/* --- 危害物(地下城與表演場共用) --- */
function hazardInDungeonWalls(h) { return solidAt(h.x, h.y); }

function updHazardsDungeon(dt) {
  var hs = D.hazards, i, j;
  for (i = 0; i < hs.length; i++) {
    var h = hs[i];
    h.t += dt;
    if (h.follow && h.owner && !h.owner.dead) { h.x = h.owner.x; h.y = h.owner.y; }
    if (h.kind === 'firering') {
      if (h.phase === 'warn') { if (h.t >= h.dur) { h.phase = 'active'; h.t = 0; h.dur = 0.5; } }
      if (h.phase === 'active') {
        if (h.hit.length === 0 && dist(D.x, D.y, h.x, h.y) <= h.radius + TAMER_R) { if (hurtTamer()) h.hit.push(1); }
        if (h.t >= h.dur) h.dead = true;
      }
    } else if (h.kind === 'thunder') {
      if (h.phase === 'warn') {
        if (h.t >= h.dur) {
          h.phase = 'active'; h.t = 0; h.dur = 0.2;
          if (dist(D.x, D.y, h.x, h.y) <= h.radius + TAMER_R) hurtTamer();
        }
      } else if (h.t >= h.dur) h.dead = true;
    } else if (h.kind === 'quake') {
      h.radius = 220 * Math.min(1, h.t / h.dur);
      if (h.hit.length === 0 && Math.abs(dist(D.x, D.y, h.x, h.y) - h.radius) <= 15 + TAMER_R) { if (hurtTamer()) h.hit.push(1); }
      if (h.t >= h.dur) h.dead = true;
    } else { // 投射物
      if (h.homing) {
        var want = Math.atan2(D.y - h.y, D.x - h.x), cur = Math.atan2(h.vy, h.vx);
        var df = angNorm(want - cur), mx = rad(120) * dt;
        cur += clamp(df, -mx, mx);
        h.angle = cur; h.vx = Math.cos(cur) * h.speed; h.vy = Math.sin(cur) * h.speed;
      }
      h.x += h.vx * dt; h.y += h.vy * dt;
      if (h.kind === 'wisp' && h.t >= 3) h.dead = true;
      if (hazardInDungeonWalls(h)) h.dead = true;
      if (!h.dead) {
        if (h.reflected) {
          for (j = 0; j < D.mons.length; j++) {
            var m = D.mons[j];
            if (dist(m.x, m.y, h.x, h.y) <= h.radius + MON_R) { hitMonster(m, 3 + G.atk); h.dead = true; break; }
          }
        } else if (dist(D.x, D.y, h.x, h.y) <= h.radius + TAMER_R) {
          if (hurtTamer()) h.dead = true;
        }
      }
    }
  }
  for (i = hs.length - 1; i >= 0; i--) if (hs[i].dead) hs.splice(i, 1);
}

function updDungeon(dt) {
  D.t += dt;
  updTamer(dt);
  var i;
  for (i = D.mons.length - 1; i >= 0; i--) updWild(D.mons[i], dt);
  updHazardsDungeon(dt);
  updCapture(dt);
  // 熔岩
  if (!D.dash && circleHitsKind(D.x, D.y, TAMER_R, ['lava'])) hurtTamer();
  // 再生
  for (i = 0; i < MAP.nests.length; i++) {
    var n = MAP.nests[i];
    if (!n.mon && n.respawn > 0) { n.respawn -= dt; if (n.respawn <= 0) spawnWild(n); }
  }
  for (i = D.wfx.length - 1; i >= 0; i--) {
    var f = D.wfx[i]; f.t += dt;
    if (f.follow) { f.x = D.x; f.y = D.y; }
    if (f.t >= f.dur) D.wfx.splice(i, 1);
  }
  updFloats(dt);
  if (D.hearts <= 0 || D.t >= 60) endDungeon();
}
function endDungeon() {
  breakLasso();
  D = null; floats = [];
  startSetup1();
}

/* ================= 布置 ================= */
function startSetup1() {
  S = { step: 1, cur: 0, picked: [], slots: [], panel: null };
  for (var i = 0; i < 9; i++) S.slots.push({ card: '', target: '' });
  G.phase = 'setup1';
}
function lineup() {
  var r = [];
  for (var i = 0; i < G.roster.length; i++) if (S.picked.indexOf(G.roster[i].sp) >= 0) r.push(G.roster[i]);
  return r;
}
function refundAll() {
  for (var i = 0; i < 9; i++) { if (S.slots[i].card) G.gold += cardDef(S.slots[i].card).cost; S.slots[i] = { card: '', target: '' }; }
}
function setup1Press(p) {
  var n = G.roster.length, cur = S.cur;
  if (p === 'x') { openGuide(); return; }
  if (p === 'left') { if (cur < n && cur % 2 === 1) S.cur = cur - 1; }
  else if (p === 'right') { if (cur < n && cur % 2 === 0 && cur + 1 < n) S.cur = cur + 1; }
  else if (p === 'up') { if (cur === n) S.cur = n - 1; else if (cur >= 2) S.cur = cur - 2; }
  else if (p === 'down') { if (cur < n) { S.cur = (cur + 2 < n) ? cur + 2 : n; } }
  else if (p === 'z') {
    if (cur < n) {
      var sp = G.roster[cur].sp, idx = S.picked.indexOf(sp);
      if (idx >= 0) S.picked.splice(idx, 1);
      else if (S.picked.length < 4) S.picked.push(sp);
    } else if (S.picked.length >= 1) {
      S.step = 2; S.cur = 0; S.panel = null; G.phase = 'setup2';
    }
  }
}
function pickerOptions() {
  var p = S.panel, opts = [], i;
  if (p.layer === 'card') {
    var refund = S.slots[S.cur].card ? cardDef(S.slots[S.cur].card).cost : 0;
    for (i = 0; i < CARDS.length; i++) opts.push({ type: 'card', key: CARDS[i].key, name: CARDS[i].name, cost: CARDS[i].cost, desc: CARDS[i].desc, affordable: G.gold + refund >= CARDS[i].cost });
    opts.push({ type: 'clear', key: 'clear', name: '清空', cost: 0, desc: '', affordable: true });
  } else {
    var lu = lineup();
    for (i = 0; i < lu.length; i++) opts.push({ type: 'monster', key: lu[i].sp, name: SP[lu[i].sp].name, cost: 0, desc: '', affordable: true });
  }
  return opts;
}
function clearSlot(i) {
  if (S.slots[i].card) G.gold += cardDef(S.slots[i].card).cost;
  S.slots[i] = { card: '', target: '' };
}
function setup2Press(p) {
  var pn = S.panel;
  if (pn) {
    var opts = pickerOptions();
    if (p === 'up') pn.index = (pn.index + opts.length - 1) % opts.length;
    else if (p === 'down') pn.index = (pn.index + 1) % opts.length;
    else if (p === 'x') {
      if (pn.layer === 'target') { S.panel = { layer: 'card', index: 0, card: '' }; }
      else S.panel = null;
    } else if (p === 'z') {
      var o = opts[pn.index];
      if (pn.layer === 'card') {
        if (o.type === 'clear') { clearSlot(S.cur); S.panel = null; }
        else if (o.affordable) S.panel = { layer: 'target', index: 0, card: o.key };
      } else {
        var cd = cardDef(pn.card);
        clearSlot(S.cur);
        G.gold -= cd.cost;
        S.slots[S.cur] = { card: cd.key, target: o.key };
        S.panel = null;
      }
    }
    return;
  }
  if (p === 'up') { if (S.cur > 0) S.cur -= 1; }
  else if (p === 'down') { if (S.cur < 9) S.cur += 1; }
  else if (p === 'z') {
    if (S.cur < 9) S.panel = { layer: 'card', index: 0, card: '' };
    else startShow();
  } else if (p === 'x') {
    if (S.cur < 9) clearSlot(S.cur);
    else { refundAll(); S.step = 1; S.cur = 0; G.phase = 'setup1'; }
  }
}
function countCards() { var n = 0; for (var i = 0; i < 9; i++) if (S.slots[i].card) n++; return n; }

/* ================= 表演場 ================= */
var START_POS = [[160, 540], [560, 540], [160, 720], [560, 720]];
function startShow() {
  var lu = lineup();
  W = { t: 0, mons: [], hazards: [], perfs: [], rallies: [], cardFx: [], fired: [], pair: {},
        fences: { top: [], bottom: [] }, vis: { top: [], bottom: [] } };
  for (var i = 0; i < 6; i++) {
    W.fences.top.push(false); W.fences.bottom.push(false);
    W.vis.top.push({ mode: 'watch', t: 0 }); W.vis.bottom.push({ mode: 'watch', t: 0 });
  }
  for (i = 0; i < 9; i++) W.fired.push(false);
  for (i = 0; i < lu.length; i++) {
    var sp = lu[i].sp, a = rnd(0, Math.PI * 2);
    W.mons.push({
      sp: sp, lv: lu[i].lv, redLow: redLowOf(sp), x: START_POS[i][0], y: START_POS[i][1],
      rage: 60, marks: 0, markLeft: 0, slowDecay: false,
      mode: 'roam', performing: false, performT: 0, perfTimer: rnd(0.5, 2),
      fx: 'none', fxT: 0.5, dir: 1, dashing: false,
      knockT: 0, kvx: 0, kvy: 0,
      rampT: 0, rtarget: null, rlast: null,
      encoreLeft: 0, encoreT: 0, relay: null, lastRelay: -99,
      chargeT: 0, arrived: false, tx: 0, ty: 0, side: 'top', seg: 0, looseT: 0, atkT: 0, ldir: 1,
      huntTarget: null, lastTouch: null, fleeT: 0, orbitC: null, orbitT: 0, dashCd: 2, dashLeft: 0, dashTarget: null,
      ddx: 0, ddy: 0, tpCd: 3, rollDx: Math.cos(a), rollDy: Math.sin(a), rollT: 4, rT: 0, rdx: 0, rdy: 0
    });
  }
  floats = [];
  presses = [];
  G.phase = 'show';
}
function isLoose(m) { return m.mode === 'charge' || m.mode === 'loose'; }
function othersOf(m) { var r = []; for (var i = 0; i < W.mons.length; i++) if (W.mons[i] !== m && !isLoose(W.mons[i])) r.push(W.mons[i]); return r; }
function nearestOf(m, list, exclude) {
  var best = null, bd = 1e9;
  for (var i = 0; i < list.length; i++) { if (list[i] === exclude) continue; var d = dist(m.x, m.y, list[i].x, list[i].y); if (d < bd) { bd = d; best = list[i]; } }
  return best;
}
function perfInterval(r) { return 4 - (clamp(r, 50, 100) - 50) / 50 * 2.5; }

/* --- 怒氣 --- */
function tryRelay(m, chain) {
  if (isLoose(m) || m.relay) return;
  if (m.rage >= m.redLow && W.t - m.lastRelay >= 1.5) { m.relay = { t: 0.3, chain: chain }; m.lastRelay = W.t; }
}
function igniteMon(m, delta, srcChain) {
  if (isLoose(m)) return;
  m.fx = 'ignited'; m.fxT = 0;
  if (m.marks > 0) {
    m.marks += 1; m.markLeft = 4;
    if (m.marks >= 5) goLoose(m);
  } else {
    m.rage = Math.min(100, m.rage + delta);
    if (m.rage >= 100) { m.marks = 1; m.markLeft = 4; m.slowDecay = false; }
  }
  if (srcChain && !isLoose(m)) tryRelay(m, srcChain + 1);
}
function douseMon(m, delta) {
  if (isLoose(m)) return;
  m.fx = 'doused'; m.fxT = 0;
  if (m.marks > 0) {
    m.marks -= 1; m.markLeft = 4;
    if (m.marks === 0) m.slowDecay = true;
  } else m.rage = Math.max(0, m.rage + delta);
}
function chillMon(m) {
  m.fx = 'doused'; m.fxT = 0;
  if (m.marks > 0) { m.marks = 0; m.rage = 70; m.slowDecay = true; }
  else m.rage = Math.max(0, m.rage - 30);
}
function goLoose(m) {
  m.marks = 0; m.markLeft = 0; m.rampT = 0; m.rtarget = null; m.encoreLeft = 0; m.relay = null; m.dashing = false;
  m.knockT = 0; m.fleeT = 0;
  for (var i = W.rallies.length - 1; i >= 0; i--) if (W.rallies[i].target === m) W.rallies.splice(i, 1);
  m.mode = 'charge'; m.arrived = false; m.chargeT = 0;
  m.side = m.y < 630 ? 'top' : 'bottom';
  m.seg = clamp(Math.round((m.x - 110) / 100), 0, 5);
  m.tx = 110 + 100 * m.seg;
  m.ty = m.side === 'top' ? 275 : 985;
}

/* --- 表演 --- */
function perform(m, chain) {
  if (isLoose(m)) return;
  var perf = { m: m, chain: chain, hits: 0, hitSet: [], open: 0, red: m.rage >= m.redLow };
  m.performing = true; m.performT = 0;
  m.perfTimer = perfInterval(m.rage);
  if (chain > G.bestChain) G.bestChain = chain;
  var others = othersOf(m), tgt = nearestOf(m, others, null);
  var tx = tgt ? tgt.x : 360, ty = tgt ? tgt.y : 630;
  var a = Math.atan2(ty - m.y, tx - m.x), hs = [], i;
  if (m.sp === 'fire') hs.push(mkHazard('firering', m.x, m.y, { owner: m }));
  else if (m.sp === 'water') { for (i = -1; i <= 1; i++) hs.push(mkHazard('waterball', m.x, m.y, { owner: m, angle: a + rad(20) * i })); }
  else if (m.sp === 'thunder') hs.push(mkHazard('thunder', tx, ty, { owner: m }));
  else if (m.sp === 'spike') { for (i = 0; i < 8; i++) hs.push(mkHazard('spike', m.x, m.y, { owner: m, angle: rad(45) * i })); }
  else if (m.sp === 'stone') hs.push(mkHazard('quake', m.x, m.y, { owner: m }));
  else if (m.sp === 'ghost') hs.push(mkHazard('wisp', m.x, m.y, { owner: m, angle: a }));
  for (i = 0; i < hs.length; i++) { hs[i].perf = perf; perf.open++; W.hazards.push(hs[i]); }
  W.perfs.push(perf);
}
function payPerf(perf) {
  if (perf.paid) return;
  perf.paid = true;
  var m = perf.m, d = SP[m.sp];
  var g = d.gold * (1 + 0.5 * perf.hits) * (perf.red ? 2 : 1) * (1 + 0.25 * (perf.chain - 1)) * Math.min(3, 1 + G.rep / 200);
  g = Math.max(1, Math.round(g));
  addGold(g); addRep(d.rep);
  var text = '+' + g, kind = 'gold';
  if (perf.red) { text += ' ×2'; kind = 'redGold'; }
  if (perf.chain >= 2) { text += ' 連鎖 ' + perf.chain; if (!perf.red) kind = 'chain'; }
  addFloat(m.x, m.y - 60, text, kind);
  var i = W.perfs.indexOf(perf);
  if (i >= 0) W.perfs.splice(i, 1);
}
function showHitMon(h, m) {
  var perf = h.perf;
  if (perf.hitSet.indexOf(m) >= 0) return false;
  perf.hitSet.push(m); perf.hits += 1;
  if (h.kind === 'waterball') douseMon(m, -20);
  else if (h.kind === 'wisp') douseMon(m, -15);
  else igniteMon(m, h.kind === 'spike' ? 10 : 15, perf.chain);
  return true;
}
function eligibleTarget(h, m) { return m !== h.owner && !isLoose(m); }
function updHazardsShow(dt) {
  var hs = W.hazards, i, j, m;
  for (i = 0; i < hs.length; i++) {
    var h = hs[i];
    h.t += dt;
    if (h.follow && h.owner) { h.x = h.owner.x; h.y = h.owner.y; }
    if (h.kind === 'firering') {
      if (h.phase === 'warn' && h.t >= h.dur) { h.phase = 'active'; h.t = 0; h.dur = 0.5; }
      if (h.phase === 'active') {
        for (j = 0; j < W.mons.length; j++) { m = W.mons[j]; if (eligibleTarget(h, m) && dist(m.x, m.y, h.x, h.y) <= h.radius + MON_R) showHitMon(h, m); }
        if (h.t >= h.dur) h.dead = true;
      }
    } else if (h.kind === 'thunder') {
      if (h.phase === 'warn') {
        if (h.t >= h.dur) {
          h.phase = 'active'; h.t = 0; h.dur = 0.2;
          for (j = 0; j < W.mons.length; j++) { m = W.mons[j]; if (eligibleTarget(h, m) && dist(m.x, m.y, h.x, h.y) <= h.radius + MON_R) showHitMon(h, m); }
        }
      } else if (h.t >= h.dur) h.dead = true;
    } else if (h.kind === 'quake') {
      h.radius = 220 * Math.min(1, h.t / h.dur);
      for (j = 0; j < W.mons.length; j++) { m = W.mons[j]; if (eligibleTarget(h, m) && Math.abs(dist(m.x, m.y, h.x, h.y) - h.radius) <= 15 + MON_R) showHitMon(h, m); }
      if (h.t >= h.dur) h.dead = true;
    } else {
      if (h.homing) {
        var cand = [];
        for (j = 0; j < W.mons.length; j++) if (eligibleTarget(h, W.mons[j])) cand.push(W.mons[j]);
        var tg = nearestOf(h, cand, null);
        if (tg) {
          var want = Math.atan2(tg.y - h.y, tg.x - h.x), cur = Math.atan2(h.vy, h.vx), mx = rad(120) * dt;
          cur += clamp(angNorm(want - cur), -mx, mx);
          h.angle = cur; h.vx = Math.cos(cur) * h.speed; h.vy = Math.sin(cur) * h.speed;
        }
      }
      h.x += h.vx * dt; h.y += h.vy * dt;
      if (h.kind === 'wisp' && h.t >= 3) h.dead = true;
      if (h.x < 60 || h.x > 660 || h.y < 270 || h.y > 990) h.dead = true;
      if (!h.dead) {
        for (j = 0; j < W.mons.length; j++) {
          m = W.mons[j];
          if (!eligibleTarget(h, m)) continue;
          if (h.perf.hitSet.indexOf(m) >= 0) continue;
          if (dist(m.x, m.y, h.x, h.y) <= h.radius + MON_R) { showHitMon(h, m); h.dead = true; break; }
        }
      }
    }
  }
  for (i = hs.length - 1; i >= 0; i--) {
    if (hs[i].dead) { var pf = hs[i].perf; hs.splice(i, 1); pf.open -= 1; if (pf.open <= 0) payPerf(pf); }
  }
}

/* --- 節目卡 --- */
function fireCard(i) {
  var slot = S.slots[i];
  W.fired[i] = true;
  if (!slot.card) return;
  var m = null;
  for (var k = 0; k < W.mons.length; k++) if (W.mons[k].sp === slot.target) m = W.mons[k];
  if (!m) return;
  if (isLoose(m)) { addFloat(m.x, m.y - 40, '沒反應', 'fizzle'); return; }
  W.cardFx.push({ m: m, card: slot.card, t: 0, dur: 0.8 });
  if (slot.card === 'provoke') igniteMon(m, 30, 0);
  else if (slot.card === 'chill') chillMon(m);
  else if (slot.card === 'rampage') { m.rampT = 5; m.rtarget = null; m.rlast = null; m.dashing = false; }
  else if (slot.card === 'rally') W.rallies.push({ target: m, t: 3 });
  else if (slot.card === 'encore') { perform(m, 1); m.encoreLeft = 2; m.encoreT = 1; }
}

/* --- 移動 --- */
function moveToward(m, tx, ty, speed, dt) {
  var d = dist(m.x, m.y, tx, ty);
  if (d < 1e-6) return;
  var s = Math.min(speed * dt, d);
  var dx = (tx - m.x) / d, dy = (ty - m.y) / d;
  m.x += dx * s; m.y += dy * s;
  if (Math.abs(dx) > 0.01) m.dir = dx > 0 ? 1 : -1;
}
function clampArena(m) { m.x = clamp(m.x, ARENA.x0, ARENA.x1); m.y = clamp(m.y, ARENA.y0, ARENA.y1); }
function walkRandom(m, speed, dt) {
  m.rT -= dt;
  if (m.rT <= 0) { var a = rnd(0, Math.PI * 2); m.rdx = Math.cos(a); m.rdy = Math.sin(a); m.rT = rnd(2, 3); }
  m.x += m.rdx * speed * dt; m.y += m.rdy * speed * dt;
  if (Math.abs(m.rdx) > 0.01) m.dir = m.rdx > 0 ? 1 : -1;
}
function rollMove(m, dt) {
  m.rollT -= dt;
  if (m.rollT <= 0) { var a = rnd(0, Math.PI * 2); m.rollDx = Math.cos(a); m.rollDy = Math.sin(a); m.rollT = 4; }
  m.x += m.rollDx * 110 * dt; m.y += m.rollDy * 110 * dt;
  if (m.x < ARENA.x0) { m.x = ARENA.x0; m.rollDx = Math.abs(m.rollDx); }
  if (m.x > ARENA.x1) { m.x = ARENA.x1; m.rollDx = -Math.abs(m.rollDx); }
  if (m.y < ARENA.y0) { m.y = ARENA.y0; m.rollDy = Math.abs(m.rollDy); }
  if (m.y > ARENA.y1) { m.y = ARENA.y1; m.rollDy = -Math.abs(m.rollDy); }
  m.dir = m.rollDx >= 0 ? 1 : -1;
}
function rallyOf(m) {
  for (var i = W.rallies.length - 1; i >= 0; i--) if (W.rallies[i].target !== m) return W.rallies[i];
  return null;
}
function isRallyTarget(m) { for (var i = 0; i < W.rallies.length; i++) if (W.rallies[i].target === m) return true; return false; }

function updRampage(m, dt) {
  m.rampT -= dt;
  var others = othersOf(m);
  if (!m.rtarget || isLoose(m.rtarget)) m.rtarget = nearestOf(m, others, m.rlast) || (others.length ? others[0] : null);
  if (!m.rtarget) return;
  moveToward(m, m.rtarget.x, m.rtarget.y, 160, dt);
  if (dist(m.x, m.y, m.rtarget.x, m.rtarget.y) <= 70) {
    var v = m.rtarget, a = Math.atan2(v.y - m.y, v.x - m.x);
    v.knockT = 0.2; v.kvx = Math.cos(a) * 500; v.kvy = Math.sin(a) * 500;
    W.pair[pairKey(m, v)] = W.t;
    m.rlast = v; m.rtarget = null;
    igniteMon(v, 10, 1);
  }
}
function pairKey(a, b) { var i = W.mons.indexOf(a), j = W.mons.indexOf(b); return i < j ? i + '_' + j : j + '_' + i; }

function updRoamShow(m, dt) {
  var others = othersOf(m), sp = m.sp, i;
  if (sp === 'spike') { rollMove(m, dt); return; }
  if (others.length === 0) { m.dashing = false; walkRandom(m, 50, dt); return; }
  if (sp === 'fire') {
    if (m.fleeT > 0) {
      m.fleeT -= dt;
      var lt = m.lastTouch;
      if (lt) { var d0 = dist(lt.x, lt.y, m.x, m.y) || 1; m.x += (m.x - lt.x) / d0 * 75 * dt; m.y += (m.y - lt.y) / d0 * 75 * dt; m.dir = (m.x - lt.x) >= 0 ? 1 : -1; }
      if (m.fleeT <= 0) m.lastTouch = null;
    } else {
      if (!m.huntTarget || isLoose(m.huntTarget)) {
        var cands = [];
        for (i = 0; i < others.length; i++) if (others[i] !== m.lastTouch) cands.push(others[i]);
        if (!cands.length) cands = others;
        m.huntTarget = pick(cands);
      }
      moveToward(m, m.huntTarget.x, m.huntTarget.y, 75, dt);
      if (dist(m.x, m.y, m.huntTarget.x, m.huntTarget.y) <= 70) {
        m.lastTouch = m.huntTarget; m.huntTarget = null;
        if (others.length === 1) m.fleeT = 1;
      }
    }
  } else if (sp === 'water') {
    m.orbitT -= dt;
    if (!m.orbitC || isLoose(m.orbitC) || m.orbitT <= 0) { m.orbitC = nearestOf(m, others, null); m.orbitT = 5; }
    var c = m.orbitC, a = Math.atan2(m.y - c.y, m.x - c.x), d = dist(m.x, m.y, c.x, c.y);
    var rs = clamp(200 - d, -70, 70);
    var vx = -Math.sin(a) * 70 + Math.cos(a) * rs, vy = Math.cos(a) * 70 + Math.sin(a) * rs;
    m.x += vx * dt; m.y += vy * dt;
    if (Math.abs(vx) > 0.01) m.dir = vx > 0 ? 1 : -1;
  } else if (sp === 'thunder') {
    if (m.dashLeft > 0) {
      m.dashLeft -= dt;
      var tg = m.dashTarget;
      if (tg && !isLoose(tg) && dist(m.x, m.y, tg.x, tg.y) > 20) {
        var dd = dist(m.x, m.y, tg.x, tg.y);
        var st = Math.min(600 * dt, dd);
        m.x += (tg.x - m.x) / dd * st; m.y += (tg.y - m.y) / dd * st;
        m.dir = (tg.x - m.x) >= 0 ? 1 : -1;
      } else m.dashLeft = 0;
      m.dashing = m.dashLeft > 0;
    } else {
      m.dashing = false;
      m.dashCd -= dt;
      if (m.dashCd <= 0) { m.dashCd = 2; m.dashTarget = pick(others); m.dashLeft = 0.3; m.dashing = true; }
    }
  } else if (sp === 'stone') {
    var nt = nearestOf(m, others, null);
    moveToward(m, nt.x, nt.y, 35, dt);
  } else if (sp === 'ghost') {
    m.tpCd -= dt;
    if (m.tpCd <= 0) {
      m.tpCd = 3;
      var t2 = pick(others), aa = rnd(0, Math.PI * 2);
      m.x = t2.x + Math.cos(aa) * 100; m.y = t2.y + Math.sin(aa) * 100;
    }
  }
}

function updShowMon(m, dt) {
  // 怒氣
  if (m.fxT < 0.5) m.fxT += dt;
  if (m.performing) { m.performT += dt; if (m.performT >= 0.5) { m.performing = false; m.performT = 0; } }
  if (isLoose(m)) { updLoose(m, dt); return; }
  if (m.marks > 0) {
    m.rage = 100; m.markLeft -= dt;
    if (m.markLeft <= 0) { m.marks -= 1; m.markLeft = 4; if (m.marks === 0) { m.slowDecay = true; m.markLeft = 0; } }
  } else if (m.slowDecay) {
    m.rage -= 2 * dt;
    if (m.rage < m.redLow) m.slowDecay = false;
  } else m.rage -= SP[m.sp].decay * dt;
  m.rage = clamp(m.rage, 0, 100);
  // 定時表演
  if (m.rage >= 50) {
    m.perfTimer = Math.min(m.perfTimer, perfInterval(m.rage));
    m.perfTimer -= dt;
    if (m.perfTimer <= 0) perform(m, 1);
  }
  // 安可
  if (m.encoreLeft > 0) {
    m.encoreT -= dt;
    if (m.encoreT <= 0) { perform(m, 1); m.encoreLeft -= 1; m.encoreT = 1; }
  }
  // 接演
  if (m.relay) {
    m.relay.t -= dt;
    if (m.relay.t <= 0) { var ch = m.relay.chain; m.relay = null; perform(m, ch); }
  }
  if (isLoose(m)) return;
  // 移動
  if (m.knockT > 0) {
    m.knockT -= dt; m.x += m.kvx * dt; m.y += m.kvy * dt; m.mode = 'knock'; m.dashing = false;
  } else if (m.rampT > 0) {
    m.mode = 'rampage'; m.dashing = false; updRampage(m, dt);
  } else if (isRallyTarget(m)) {
    m.mode = 'hold'; m.dashing = false;
  } else if (rallyOf(m)) {
    m.mode = 'rally'; m.dashing = false;
    var r = rallyOf(m).target;
    if (dist(m.x, m.y, r.x, r.y) > 70) moveToward(m, r.x, r.y, 130, dt);
  } else {
    m.mode = 'roam';
    updRoamShow(m, dt);
  }
  clampArena(m);
}
function updLoose(m, dt) {
  var f;
  if (m.mode === 'charge') {
    f = W.fences[m.side][m.seg];
    if (!m.arrived) {
      moveToward(m, m.tx, m.ty, 160, dt);
      if (dist(m.x, m.y, m.tx, m.ty) < 4) { m.arrived = true; m.chargeT = 0; }
    } else {
      m.chargeT += dt;
      if (f || m.chargeT >= 1.5) {
        W.fences[m.side][m.seg] = true;
        m.mode = 'loose'; m.looseT = 0; m.atkT = 0; m.chargeT = 0; m.ldir = Math.random() < 0.5 ? -1 : 1;
      }
    }
    return;
  }
  // loose
  m.looseT += dt; m.atkT += dt;
  var seatY = m.side === 'top' ? 190 : 1080;
  moveToward(m, m.x, seatY, 160, dt);
  m.x += m.ldir * 140 * dt;
  if (m.x < 110) { m.x = 110; m.ldir = 1; }
  if (m.x > 610) { m.x = 610; m.ldir = -1; }
  m.dir = m.ldir;
  if (m.atkT >= 1.5) {
    m.atkT -= 1.5;
    var vs = W.vis[m.side], best = -1, bd = 1e9;
    for (var i = 0; i < 6; i++) {
      if (vs[i].mode !== 'watch') continue;
      var d = Math.abs(110 + 100 * i - m.x);
      if (d < bd) { bd = d; best = i; }
    }
    if (best >= 0 && bd <= 100) {
      vs[best].mode = 'scared'; vs[best].t = 0;
      addRep(-3);
      addFloat(m.x, m.y + (m.side === 'top' ? 50 : -50), '名聲 −3', 'repDown');
    }
  }
  if (m.looseT >= 6) {
    m.mode = 'roam'; m.x = 360; m.y = 630; m.rage = 30; m.marks = 0; m.markLeft = 0; m.slowDecay = false;
    m.looseT = 0; m.fx = 'none'; m.fxT = 0.5;
  }
}

function updShow(dt) {
  W.t += dt;
  var i, j, m;
  for (i = 0; i < 9; i++) if (!W.fired[i] && W.t >= 5 * i + 0.5) fireCard(i);
  for (i = 0; i < W.mons.length; i++) updShowMon(W.mons[i], dt);
  for (i = W.rallies.length - 1; i >= 0; i--) {
    W.rallies[i].t -= dt;
    if (W.rallies[i].t <= 0 || isLoose(W.rallies[i].target)) W.rallies.splice(i, 1);
  }
  updHazardsShow(dt);
  // 相撞挑釁
  for (i = 0; i < W.mons.length; i++) for (j = i + 1; j < W.mons.length; j++) {
    var a = W.mons[i], b = W.mons[j];
    if (isLoose(a) || isLoose(b)) continue;
    if (dist(a.x, a.y, b.x, b.y) > 70) continue;
    var key = i + '_' + j;
    if (W.pair[key] !== undefined && W.t - W.pair[key] < 2) continue;
    W.pair[key] = W.t;
    if (a.rage < 100 && a.marks === 0) igniteMon(a, 8, 0);
    if (b.rage < 100 && b.marks === 0) igniteMon(b, 8, 0);
  }
  for (i = 0; i < W.mons.length; i++) if (!isLoose(W.mons[i])) clampArena(W.mons[i]);
  for (i = W.cardFx.length - 1; i >= 0; i--) { W.cardFx[i].t += dt; if (W.cardFx[i].t >= W.cardFx[i].dur) W.cardFx.splice(i, 1); }
  var sides = ['top', 'bottom'];
  for (i = 0; i < 2; i++) for (j = 0; j < 6; j++) {
    var v = W.vis[sides[i]][j];
    if (v.mode !== 'watch') { v.t += dt; v.mode = v.t >= 4 ? 'watch' : (v.t >= 1 ? 'empty' : 'scared'); }
  }
  updFloats(dt);
  if (W.t >= 45) endShow();
}
function endShow() {
  for (var i = 0; i < W.mons.length; i++) if (isLoose(W.mons[i])) addRep(-5);
  while (W.perfs.length) payPerf(W.perfs[0]);
  W = null; S = null; floats = [];
  presses = [];
  if (G.day >= DAY_MAX) { G.stars = G.rep >= 900 ? 3 : (G.rep >= 550 ? 2 : (G.rep >= 250 ? 1 : 0)); G.phase = 'result'; }
  else { G.phase = 'shop'; G.shopIdx = 0; }
}

/* ================= 地下城選擇 / 商店 / 結算 ================= */
function unlockMet(dun) {
  if (!dun.unlock) return true;
  return G.gold >= dun.unlock.gold && G.caught[dun.unlock.sp] >= dun.unlock.n;
}
function conditionText(dun) {
  if (G.open[dun.id] || !dun.unlock) return '';
  return '金幣 ' + dun.unlock.gold + ' + 收服' + SP[dun.unlock.sp].name + ' ' + Math.min(G.caught[dun.unlock.sp], dun.unlock.n) + '/' + dun.unlock.n;
}
function selectPress(p) {
  if (p === 'up') G.selIdx = Math.max(0, G.selIdx - 1);
  else if (p === 'down') G.selIdx = Math.min(2, G.selIdx + 1);
  else if (p === 'x') openGuide();
  else if (p === 'z') {
    var dun = DUNGEONS[G.selIdx];
    if (G.open[dun.id]) startDungeon(dun.id);
    else if (unlockMet(dun)) { G.gold -= dun.unlock.gold; G.open[dun.id] = true; }
  }
}
function itemPrice(it) { return WEAPONS[it] ? WEAPONS[it].price : G.price[it]; }
function shopPress(p) {
  if (p === 'up') G.shopIdx = Math.max(0, G.shopIdx - 1);
  else if (p === 'down') G.shopIdx = Math.min(7, G.shopIdx + 1);
  else if (p === 'x') openGuide();
  else if (p === 'z') {
    if (G.shopIdx === 7) { G.day += 1; G.selIdx = 0; G.phase = 'select'; return; }
    var it = SHOP_ITEMS[G.shopIdx];
    if (WEAPONS[it]) {
      if (G.owned[it]) G.weapon = it;
      else if (G.gold >= WEAPONS[it].price) { G.gold -= WEAPONS[it].price; G.owned[it] = true; G.weapon = it; }
    } else {
      var pr = G.price[it];
      if (G.gold >= pr) {
        G.gold -= pr; G.price[it] = Math.round(pr * 1.5);
        if (it === 'attack') G.atk += 1; else if (it === 'armor') G.armor += 1; else G.rope += 1;
      }
    }
  }
}
function resultPress(p) {
  if (p === 'z') { newGame(); presses = []; }
}

/* ================= 說明頁 ================= */
function openGuide() { G.guideFrom = G.phase; G.guidePage = 0; G.guideOpenedInGame = true; G.phase = 'guide'; }
function guidePress(p) {
  if (p === 'z' || p === 'right') {
    if (G.guidePage < 4) G.guidePage += 1;
    else if (p === 'z') closeGuide();
  } else if (p === 'left' || p === 'x') {
    if (G.guidePage > 0) G.guidePage -= 1;
    else if (G.guideOpenedInGame && p === 'x') closeGuide();
  }
}
function closeGuide() { G.phase = G.guideFrom || 'select'; G.guideOpenedInGame = false; presses = []; }

/* ================= 主更新 ================= */
function update(dt) {
  var ps = presses; presses = [];
  var i, ph;
  for (i = 0; i < ps.length; i++) {
    ph = G.phase;
    if (ph === 'guide') guidePress(ps[i]);
    else if (ph === 'select') selectPress(ps[i]);
    else if (ph === 'setup1') setup1Press(ps[i]);
    else if (ph === 'setup2') setup2Press(ps[i]);
    else if (ph === 'shop') shopPress(ps[i]);
    else if (ph === 'result') resultPress(ps[i]);
    if (G.phase !== ph) { presses = []; break; }
  }
  if (G.phase === 'dungeon') updDungeon(dt);
  else if (G.phase === 'show') updShow(dt);
}

/* ================= 繪製(只讀狀態) ================= */
function hudState(msg) {
  var ph = G.phase;
  var inD = ph === 'dungeon';
  var tl = 0, tm = 0;
  if (inD) { tl = Math.max(0, 60 - D.t); tm = 60; }
  else if (ph === 'show') { tl = Math.max(0, 45 - W.t); tm = 45; }
  return {
    phase: ph, day: G.day, dayMax: DAY_MAX, gold: G.gold, rep: G.rep,
    hearts: inD ? Math.max(0, D.hearts) : 0, maxHearts: inD ? maxHearts() : 0,
    ropes: inD ? D.ropes : 0, ropeMax: inD ? ropeMax() : 0,
    weapon: G.weapon, xCdLeft: inD ? Math.max(0, D.xCd) : 0, xCdMax: inD ? xCdMax() : 0,
    timeLeft: tl, timeMax: tm, dungeon: inD ? D.id : '', message: msg
  };
}
function drawFloats(offy) {
  for (var i = 0; i < floats.length; i++) {
    var f = floats[i];
    Art.drawFloatText(ctx, { x: f.x, y: f.y, text: f.text, kind: f.kind, t: f.t, dur: f.dur });
  }
}
function renderGuide() {
  Art.drawBackground(ctx, {});
  var pg = G.guidePage;
  var fr = { x: 60, y: 290, w: 600, h: 700 };
  if (Art.drawGuidePage) Art.drawGuidePage(ctx, { page: pg + 1, x: fr.x, y: fr.y, w: fr.w, h: fr.h });
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText('第 ' + (pg + 1) + ' 頁 ' + GUIDE_TITLES[pg], CW / 2, 175);
  ctx.font = '30px sans-serif';
  ctx.fillText(GUIDE_TEXTS[pg], CW / 2, 235);
  ctx.font = '28px sans-serif';
  ctx.fillText((pg + 1) + ' / 5', CW / 2, 1050);
  ctx.font = '24px sans-serif';
  ctx.fillText(pg < 4 ? '按 Z 繼續' : '按 Z 開始', CW / 2, 1110);
  ctx.fillText('← / X 上一頁', CW / 2, 1150);
  ctx.restore();
  Art.drawHud(ctx, hudState('Z 下一頁 X 上一頁'));
}
function renderSelect() {
  Art.drawBackground(ctx, {});
  for (var i = 0; i < 3; i++) {
    var d = DUNGEONS[i];
    Art.drawDungeonCard(ctx, { x: 360, y: 330 + 310 * i, dungeon: d.id, open: G.open[d.id], condition: conditionText(d), selected: G.selIdx === i });
  }
  Art.drawHud(ctx, hudState('↑↓ 選擇 Z 進入 X 說明'));
}
function renderDungeon() {
  Art.drawBackground(ctx, {});
  var r, c, i;
  for (r = 0; r < 19; r++) for (c = 0; c < 12; c++) {
    var t = MAP.tiles[r][c];
    Art.drawTile(ctx, { x: c * 60 + 30, y: r * 60 + 30 + OFFY, dungeon: D.id, kind: t.kind, room: t.room, nest: t.nest });
  }
  for (i = 0; i < D.mons.length; i++) {
    var m = D.mons[i];
    Art.drawWildMonster(ctx, { x: m.x, y: m.y + OFFY, species: m.sp, hp: m.hp, maxHp: m.maxHp, hit: m.hitT > 0, weak: isWeak(m),
      stunLeft: Math.max(0, m.stun), stunDur: 2, lassoed: m.lassoed, casting: hasWarn(m), dashing: m.dashT > 0, dir: m.dir });
  }
  if (D.ring) Art.drawCaptureRing(ctx, { x: D.ring.m.x, y: D.ring.m.y + OFFY, t: D.ring.t, dur: D.ring.dur });
  if (D.lasso) {
    var l = D.lasso;
    Art.drawLasso(ctx, { x1: D.x, y1: D.y + OFFY, x2: l.m.x, y2: l.m.y + OFFY, progress: Math.min(1, Math.abs(l.sum) / (Math.PI * 2)),
      t: l.t, limit: lassoLimit(), len: dist(D.x, D.y, l.m.x, l.m.y), maxLen: 220 });
  }
  Art.drawTamer(ctx, { x: D.x, y: D.y + OFFY, facing: D.facing, weapon: G.weapon, dashing: !!D.dash,
    blink: D.invuln > 0 && Math.floor(D.invuln * 10) % 2 === 0, lassoing: !!D.lasso });
  for (i = 0; i < D.hazards.length; i++) {
    var h = D.hazards[i];
    Art.drawHazard(ctx, { x: h.x, y: h.y + OFFY, kind: h.kind, phase: h.phase, radius: h.radius, t: h.t, dur: h.dur, angle: h.angle, reflected: h.reflected });
  }
  for (i = 0; i < D.wfx.length; i++) {
    var f = D.wfx[i];
    Art.drawWeaponFx(ctx, { x: f.x, y: f.y + OFFY, weapon: f.weapon, move: f.move, shape: f.shape, angle: f.angle, spread: f.spread,
      radius: f.radius, length: f.length, width: f.width, t: f.t, dur: f.dur });
  }
  drawFloats();
  var msg = 'Z 攻擊 X 武器技';
  if (D.lasso) msg = '繞牠一圈!'; else if (D.ring) msg = '站住別動';
  Art.drawHud(ctx, hudState(msg));
}
function renderSetup1() {
  Art.drawBackground(ctx, {});
  for (var i = 0; i < G.roster.length; i++) {
    var rc = G.roster[i];
    Art.drawRosterCard(ctx, { x: 195 + 330 * (i % 2), y: 300 + 230 * Math.floor(i / 2), species: rc.sp, level: rc.lv,
      picked: S.picked.indexOf(rc.sp) >= 0, selected: S.cur === i });
  }
  Art.drawButton(ctx, { x: 160, y: 1100, w: 400, h: 100, label: '下一步', selected: S.cur === G.roster.length });
  Art.drawHud(ctx, hudState('方向鍵選 Z 上場/下場 X 說明'));
}
function renderSetup2() {
  Art.drawBackground(ctx, {});
  var i;
  for (i = 0; i < 9; i++) {
    Art.drawTimelineSlot(ctx, { x: 360, y: 190 + 105 * i, style: 'row', slot: i, card: S.slots[i].card, target: S.slots[i].target,
      selected: S.cur === i, active: false, done: false });
  }
  Art.drawSetupInfo(ctx, { gold: G.gold, cards: countCards() });
  Art.drawButton(ctx, { x: 480, y: 1160, w: 180, h: 100, label: '開演', selected: S.cur === 9 });
  var msg = '↑↓ 選時段 Z 放卡 X 清空';
  if (S.panel) {
    Art.drawPickerPanel(ctx, { layer: S.panel.layer, options: pickerOptions(), index: S.panel.index });
    msg = S.panel.layer === 'card' ? '↑↓ 選 Z 確定 X 取消' : '↑↓ 選 Z 點名 X 回上一層';
  } else if (S.cur === 9) msg = 'Z 開演 X 回上一步';
  Art.drawHud(ctx, hudState(msg));
}
function renderShow() {
  Art.drawShowArena(ctx, {});
  var i, j, sides = ['top', 'bottom'];
  for (i = 0; i < W.hazards.length; i++) {
    var h = W.hazards[i];
    Art.drawHazard(ctx, { x: h.x, y: h.y, kind: h.kind, phase: h.phase, radius: h.radius, t: h.t, dur: h.dur, angle: h.angle, reflected: false });
  }
  for (i = 0; i < W.mons.length; i++) {
    var m = W.mons[i];
    Art.drawShowMonster(ctx, {
      x: m.x, y: m.y, species: m.sp, level: m.lv, rage: m.rage, redLow: m.redLow, marks: m.marks,
      markLeft: m.marks > 0 ? Math.max(0, m.markLeft) : 0, markDur: 4, mode: m.mode,
      performing: m.performing, performT: m.performing ? m.performT : 0, performDur: 0.5,
      fx: m.fxT < 0.5 ? m.fx : 'none', fxT: m.fxT < 0.5 ? m.fxT : 0, fxDur: 0.5,
      chargeT: (m.mode === 'charge' && m.arrived) ? m.chargeT : 0, chargeDur: 1.5,
      looseT: m.mode === 'loose' ? m.looseT : 0, looseDur: 6, dashing: m.dashing, dir: m.dir
    });
  }
  for (i = 0; i < W.cardFx.length; i++) {
    var cf = W.cardFx[i];
    Art.drawCardFx(ctx, { x: cf.m.x, y: cf.m.y, card: cf.card, t: cf.t, dur: cf.dur });
  }
  for (i = 0; i < 2; i++) for (j = 0; j < 6; j++) {
    var fy = i === 0 ? 255 : 1005, vy = i === 0 ? 190 : 1080;
    Art.drawFence(ctx, { x: 110 + 100 * j, y: fy, side: sides[i], broken: W.fences[sides[i]][j] });
    Art.drawVisitor(ctx, { x: 110 + 100 * j, y: vy, side: sides[i], mode: W.vis[sides[i]][j].mode });
  }
  var act = Math.min(8, Math.floor(W.t / 5));
  for (i = 0; i < 9; i++) {
    Art.drawTimelineSlot(ctx, { x: 40 + 80 * i, y: 1210, style: 'mini', slot: i, card: S.slots[i].card, target: S.slots[i].target,
      selected: false, active: i === act, done: W.fired[i] });
  }
  drawFloats();
  Art.drawHud(ctx, hudState('表演中…'));
}
function renderShop() {
  Art.drawBackground(ctx, {});
  for (var i = 0; i < 7; i++) {
    var it = SHOP_ITEMS[i], isW = !!WEAPONS[it];
    var lv = isW ? 0 : (it === 'attack' ? G.atk : (it === 'armor' ? G.armor : G.rope));
    var cost = isW ? WEAPONS[it].price : G.price[it];
    var owned = isW ? !!G.owned[it] : false;
    Art.drawShopItem(ctx, { x: 360, y: 200 + 125 * i, item: it, cost: cost, level: lv, owned: owned,
      equipped: isW && G.weapon === it, affordable: G.gold >= cost, selected: G.shopIdx === i });
  }
  Art.drawButton(ctx, { x: 160, y: 1110, w: 400, h: 100, label: '出發', selected: G.shopIdx === 7 });
  Art.drawHud(ctx, hudState('↑↓ 選擇 Z 購買/裝備 X 說明'));
}
function renderResult() {
  Art.drawBackground(ctx, {});
  var ro = [];
  for (var i = 0; i < G.roster.length; i++) ro.push({ species: G.roster[i].sp, level: G.roster[i].lv });
  Art.drawResultPanel(ctx, { rep: G.rep, goldEarned: G.goldEarned, bestChain: G.bestChain, roster: ro, stars: G.stars });
  Art.drawHud(ctx, hudState('按 Z 重來'));
}
function render() {
  ctx.clearRect(0, 0, CW, CH);
  var ph = G.phase;
  if (ph === 'guide') renderGuide();
  else if (ph === 'select') renderSelect();
  else if (ph === 'dungeon') renderDungeon();
  else if (ph === 'setup1') renderSetup1();
  else if (ph === 'setup2') renderSetup2();
  else if (ph === 'show') renderShow();
  else if (ph === 'shop') renderShop();
  else if (ph === 'result') renderResult();
}

/* ================= 主迴圈 ================= */
var lastTs = null;
function frame(ts) {
  var dt = 0;
  if (lastTs !== null) dt = Math.min(Math.max((ts - lastTs) / 1000, 0), 1 / 30);
  lastTs = ts;
  try { update(dt); render(); } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
