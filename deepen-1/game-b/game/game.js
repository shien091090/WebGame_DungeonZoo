(function () {
'use strict';

var W = Art.canvas.width, H = Art.canvas.height;
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var pxRatio = 1;
function resize() {
  var dpr = window.devicePixelRatio || 1;
  var s = Math.min(window.innerWidth / W, window.innerHeight / H);
  if (!(s > 0)) s = 1;
  canvas.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
  pxRatio = dpr * s;
  canvas.width = Math.round(W * pxRatio);
  canvas.height = Math.round(H * pxRatio);
}
window.addEventListener('resize', resize);
resize();

// ---------- 常數 ----------
var TILE = 60, COLS = 12, ROWS = 30;
var MAP = [
  '############',
  '#..........#',
  '#..t....t..#',
  '#..........#',
  '#.o......o.#',
  '#..........#',
  '####..######',
  '#..........#',
  '#.g......g.#',
  '#..........#',
  '#..o....o..#',
  '#..........#',
  '######..####',
  '#LL......LL#',
  '#L.f....f..#',
  '#..........#',
  '#.L......L.#',
  '#LL......LL#',
  '####..######',
  '#..WW......#',
  '#.j....WW..#',
  '#......j...#',
  '#.WW.......#',
  '#..........#',
  '######..####',
  '#..........#',
  '#..........#',
  '#....S.....#',
  '#..........#',
  '############'
];
var SPECIES = ['fire', 'water', 'thunder', 'stone'];
var SP = {
  fire:    { hp: 10, interval: 2.4, haz: 'firering', whip: 25, decay: 4, gold: 5, rep: 1, perk: '鞭範圍↑', nestCh: 'f', zone: 'lava' },
  water:   { hp: 7,  interval: 1.6, haz: 'waterball', whip: 20, decay: 6, gold: 3, rep: 1, perk: '哨範圍↑', nestCh: 'j', zone: 'pond' },
  thunder: { hp: 12, interval: 2.6, haz: 'thunder', whip: 40, decay: 8, gold: 7, rep: 2, perk: '彈反↑', nestCh: 't', zone: 'crag' },
  stone:   { hp: 16, interval: 3.0, haz: 'quake', whip: 12, decay: 1, gold: 4, rep: 1, perk: '心↑', nestCh: 'g', zone: 'ruins' }
};
var ZONE_ROWS = [['crag', 1, 5], ['ruins', 7, 11], ['lava', 13, 17], ['pond', 19, 23]];
var ZONE_CENTER = { crag: [360, 210], ruins: [360, 570], lava: [360, 930], pond: [360, 1290] };
var DIRS = [[0, -1], [0.70711, -0.70711], [1, 0], [0.70711, 0.70711], [0, 1], [-0.70711, 0.70711], [-1, 0], [-0.70711, -0.70711]];
var FACE = { '0,-1': 0, '1,-1': 1, '1,0': 2, '1,1': 3, '0,1': 4, '-1,1': 5, '-1,0': 6, '-1,-1': 7 };
var SHOP_ITEMS = [
  { key: 'whipPower', up: 'whip', base: 50 },
  { key: 'ropeBag', up: 'rope', base: 40 },
  { key: 'armor', up: 'armor', base: 40 },
  { key: 'silverWhistle', up: 'silver', base: 50 }
];
var SHOP_Y = [300, 460, 620, 780];
var GUIDE = [
  { title: '地下城', lines: ['方向鍵走, Z 揮鞭,', 'X 翻滾, C 彈反'] },
  { title: '收服', lines: ['殘血時揮鞭套住,', '繞牠一圈'] },
  { title: '表演', lines: ['Z 讓牠生氣,', 'X 讓牠冷靜'] },
  { title: '反射', lines: ['表演中彈反,', '會震到身邊魔物'] },
  { title: '拿捏', lines: ['越氣越賺,', '滿了就失控'] }
];
var ARENA = { x0: 60, x1: 660, y0: 270, y1: 1000 };
var SEAT_X = [110, 210, 310, 410, 510, 610];
var FENCE_Y = { top: 255, bottom: 1010 };
var SEAT_Y = { top: 190, bottom: 1080 };

// ---------- 工具 ----------
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function rnd(a, b) { return a + Math.random() * (b - a); }
function dist(ax, ay, bx, by) { return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); }
function tileKind(c, r) {
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return 'wall';
  var ch = MAP[r].charAt(c);
  if (ch === '#') return 'wall';
  if (ch === 'o') return 'pillar';
  if (ch === 'L') return 'lava';
  if (ch === 'W') return 'water';
  return 'floor';
}
function tileZone(c, r) {
  if (c >= 1 && c <= 10) {
    for (var i = 0; i < ZONE_ROWS.length; i++) if (r >= ZONE_ROWS[i][1] && r <= ZONE_ROWS[i][2]) return ZONE_ROWS[i][0];
  }
  return 'hall';
}
function isSolid(k) { return k === 'wall' || k === 'pillar'; }
function isSolidM(k) { return k === 'wall' || k === 'pillar' || k === 'lava'; }
function circleHitsTile(x, y, r, pred) {
  var c0 = Math.floor((x - r) / TILE), c1 = Math.floor((x + r) / TILE);
  var r0 = Math.floor((y - r) / TILE), r1 = Math.floor((y + r) / TILE);
  for (var rr = r0; rr <= r1; rr++) for (var cc = c0; cc <= c1; cc++) {
    if (pred(tileKind(cc, rr))) {
      var px = clamp(x, cc * TILE, cc * TILE + TILE), py = clamp(y, rr * TILE, rr * TILE + TILE);
      if ((x - px) * (x - px) + (y - py) * (y - py) < r * r) return true;
    }
  }
  return false;
}
function tileAtPx(x, y) { return tileKind(Math.floor(x / TILE), Math.floor(y / TILE)); }
function normAng(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }

// ---------- 全域狀態 ----------
var G = { phase: 'guide', page: 1, guideReturn: null, stage: 'dungeon' };
var R;       // 整輪(三天)資料
var T;       // 馴獸師
var D;       // 地下城
var S;       // 表演場
var floats = [], effects = [];
var held = {}, pressed = {};

function resetRun() {
  R = {
    day: 1, gold: 0, rep: 0, goldEarned: 0, reflects: 0,
    roster: ['fire'],
    perks: { fire: 0, water: 0, thunder: 0, stone: 0 },
    ups: { whip: 0, rope: 0, armor: 0, silver: 0 },
    costs: { whip: 50, rope: 40, armor: 40, silver: 50 },
    hearts: 5, ropes: 3,
    shopSel: 0
  };
}
resetRun();
function whipPower() { return 2 + R.ups.whip; }
function maxHearts() { return 5 + R.ups.armor + R.perks.stone; }
function ropeMax() { return 3 + R.ups.rope; }
function whipR() { return 110 + 15 * R.perks.fire; }
function whistleR() { return 140 + 20 * R.perks.water; }
function parryDur() { return 0.2 + 0.05 * R.perks.thunder; }
function whistleCdMax() { return Math.max(0.8, 2 - 0.4 * R.ups.silver); }
function addGold(n) { R.gold += n; R.goldEarned += n; }
function addRep(n) { R.rep = Math.max(0, R.rep + n); }
function addFloat(x, y, text, kind, world) { floats.push({ x: x, y: y, text: text, kind: kind, t: 0, dur: 1, world: !!world }); }
function addEffect(type, x, y, extra, dur) {
  var e = { type: type, x: x, y: y, t: 0, dur: dur };
  for (var k in extra) e[k] = extra[k];
  effects.push(e);
}

function newTamer() {
  return { x: 330, y: 1650, facing: 0, rollT: 0, rollCd: 0, whipCd: 0, parryLeft: 0, parryCd: 0, stun: 0, inv: 0, whistleCd: 0 };
}
T = newTamer();

// ---------- 魔物技能(地下城與表演場共用) ----------
var hazards = [];
function spawnCast(owner, sp, aimX, aimY, mode) {
  var cast = { owner: owner, sp: sp, mode: mode, live: 0, hits: 0, red: false, hitSet: [], settled: false, tamerResolved: false };
  var kind = SP[sp].haz;
  function add(h) { h.cast = cast; h.owner = owner; h.dead = false; cast.live++; hazards.push(h); }
  if (kind === 'firering') add({ kind: kind, x: owner.x, y: owner.y, phase: 'warn', t: 0, dur: 0.5, radius: 120, angle: 0 });
  else if (kind === 'thunder') add({ kind: kind, x: aimX, y: aimY, phase: 'warn', t: 0, dur: 0.8, radius: 70, angle: 0 });
  else if (kind === 'quake') add({ kind: kind, x: owner.x, y: owner.y, phase: 'active', t: 0, dur: 1, radius: 0, angle: 0 });
  else {
    var a0 = Math.atan2(aimY - owner.y, aimX - owner.x);
    var offs = [-10, 0, 10];
    for (var i = 0; i < 3; i++) {
      var a = a0 + offs[i] * Math.PI / 180;
      add({ kind: kind, x: owner.x, y: owner.y, phase: 'active', t: 0, dur: 0, radius: 12, angle: a, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300 });
    }
  }
  return cast;
}
function tamerImmune() {
  return G.phase === 'dungeon' ? (T.rollT > 0 || T.inv > 0) : (T.inv > 0 || T.stun > 0);
}
function touchesTamer(h) {
  var d = dist(h.x, h.y, T.x, T.y);
  if (h.kind === 'firering') return h.phase === 'active' && d < 120 + 18;
  if (h.kind === 'quake') return Math.abs(d - h.radius) < 15 + 18;
  if (h.kind === 'thunder') return h.phase === 'active' && !h.fired && d < 70 + 18;
  return d < 12 + 18;
}
function touchesMonster(h, m) {
  var d = dist(h.x, h.y, m.x, m.y);
  if (h.kind === 'firering') return h.phase === 'active' && d < 120 + 30;
  if (h.kind === 'quake') return Math.abs(d - h.radius) < 15 + 30;
  if (h.kind === 'thunder') return h.phase === 'active' && !h.fired && d < 70 + 30;
  return d < 12 + 30;
}
function hazardKill(h) {
  if (h.dead) return;
  h.dead = true;
  h.cast.live--;
  if (h.cast.mode === 'show' && h.cast.live <= 0) settleCast(h.cast);
}
function updateHazards(dt) {
  var show = G.phase === 'show';
  for (var i = 0; i < hazards.length; i++) {
    var h = hazards[i];
    if (h.dead) continue;
    h.t += dt;
    var k = h.kind;
    if (k === 'firering' || k === 'quake') {
      var o = h.owner;
      if (o && !o.gone) { h.x = o.x; h.y = o.y; }
    }
    if (k === 'firering') {
      if (h.phase === 'warn' && h.t >= h.dur) { h.phase = 'active'; h.t = 0; h.dur = 0.5; }
      else if (h.phase === 'active' && h.t >= h.dur) { hazardKill(h); continue; }
    } else if (k === 'thunder') {
      if (h.phase === 'warn' && h.t >= h.dur) { h.phase = 'active'; h.t = 0; h.dur = 0.2; h.fired = false; h.justFired = true; }
      else if (h.phase === 'active' && h.t >= h.dur) { hazardKill(h); continue; }
    } else if (k === 'quake') {
      h.radius = 220 * Math.min(1, h.t / h.dur);
      if (h.t >= h.dur) { hazardKill(h); continue; }
    } else {
      h.x += h.vx * dt; h.y += h.vy * dt;
      if (show) {
        if (h.x < ARENA.x0 - 20 || h.x > ARENA.x1 + 20 || h.y < ARENA.y0 - 20 || h.y > ARENA.y1 + 20) { hazardKill(h); continue; }
      } else if (circleHitsTile(h.x, h.y, 6, isSolid)) { hazardKill(h); continue; }
    }
    // 打中馴獸師
    var cast = h.cast;
    if (!tamerImmune() && touchesTamer(h)) {
      if (cast.tamerResolved) {
        if (k === 'waterball') { hazardKill(h); continue; }
      } else {
        cast.tamerResolved = true;
        if (k === 'waterball') { /* 水彈命中後消失 */ }
        resolveTamerHit(h);
        if (k === 'waterball') { hazardKill(h); continue; }
      }
    }
    // 打中別的魔物(表演場)
    if (show) {
      var ms = S.monsters;
      for (var j = 0; j < ms.length; j++) {
        var m = ms[j];
        if (m === cast.owner || m.mode !== 'roam') continue;
        if (cast.hitSet.indexOf(m) >= 0) continue;
        if (touchesMonster(h, m)) {
          cast.hitSet.push(m); cast.hits++;
          if (k === 'waterball') addRage(m, -20, 'doused'); else addRage(m, 15, 'ignited');
        }
      }
    }
    if (k === 'thunder' && h.phase === 'active') h.fired = true;
  }
  var alive = [];
  for (var n = 0; n < hazards.length; n++) if (!hazards[n].dead) alive.push(hazards[n]);
  hazards = alive;
}
function resolveTamerHit(h) {
  var cast = h.cast;
  if (T.parryLeft > 0) {
    addEffect('parry', T.x, T.y, {}, 0.25);
    if (G.phase === 'dungeon') {
      var o = cast.owner;
      if (o && !o.gone) { o.hp = Math.max(1, o.hp - Math.min(whipPower(), Math.max(0, o.hp - 1))); o.hitT = 0.15; }
    } else {
      reflect(cast);
    }
  } else if (G.phase === 'dungeon') {
    hurtTamer();
  } else {
    T.stun = 1.5; T.inv = 3.5; T.parryLeft = 0;
    addRep(-2);
    addFloat(T.x, T.y - 40, '名聲 -2', 'repDown', false);
  }
}

// ---------- 地下城 ----------
function startDungeon() {
  G.phase = 'dungeon';
  var hpMul = 1 + 0.5 * (R.day - 1);
  D = { time: 60, nests: [], monsters: [], lasso: null, camY: 0, ended: false };
  for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
    var ch = MAP[r].charAt(c);
    for (var s = 0; s < SPECIES.length; s++) if (SP[SPECIES[s]].nestCh === ch) {
      var nest = { sp: SPECIES[s], x: c * TILE + 30, y: r * TILE + 30, mon: null, timer: 0, hpMul: hpMul };
      D.nests.push(nest);
      spawnWild(nest);
    }
  }
  T = newTamer();
  R.hearts = maxHearts();
  R.ropes = ropeMax();
  hazards = []; floats = []; effects = [];
}
function roomRect(zone) {
  for (var i = 0; i < ZONE_ROWS.length; i++) if (ZONE_ROWS[i][0] === zone) return { x0: 60, x1: 660, y0: ZONE_ROWS[i][1] * TILE, y1: (ZONE_ROWS[i][2] + 1) * TILE };
  return null;
}
function spawnWild(nest) {
  var sp = nest.sp;
  var hp = Math.round(SP[sp].hp * nest.hpMul);
  var m = { sp: sp, x: nest.x, y: nest.y, hp: hp, maxHp: hp, hitT: 0, lassoed: false, nest: nest, dir: 1,
    vx: 0, vy: 0, turnT: 0, castCd: rnd(0.4, 1) * SP[sp].interval, room: roomRect(SP[sp].zone), zone: SP[sp].zone, gone: false };
  nest.mon = m;
  D.monsters.push(m);
}
function removeWild(m) {
  m.gone = true;
  if (m.nest) { m.nest.mon = null; m.nest.timer = 8; }
  var a = [];
  for (var i = 0; i < D.monsters.length; i++) if (D.monsters[i] !== m) a.push(D.monsters[i]);
  D.monsters = a;
}
function isWeak(m) { return m.hp <= m.maxHp * 0.3; }
function wildBlocked(m, x, y) {
  if (x - 25 < m.room.x0 || x + 25 > m.room.x1 || y - 25 < m.room.y0 || y + 25 > m.room.y1) return true;
  return circleHitsTile(x, y, 25, isSolidM);
}
function breakLasso() {
  if (D && D.lasso) { D.lasso.mon.lassoed = false; D.lasso = null; }
}
function hurtTamer() {
  if (T.rollT > 0 || T.inv > 0) return false;
  R.hearts -= 1;
  T.inv = 1;
  breakLasso();
  return true;
}
function whipDungeon() {
  T.whipCd = 0.35;
  var f = DIRS[T.facing], r = whipR();
  addEffect('whip', T.x, T.y, { shape: 'arc', facing: T.facing, radius: r }, 0.25);
  var lassoDone = false;
  var list = D.monsters.slice();
  for (var i = 0; i < list.length; i++) {
    var m = list[i];
    var dx = m.x - T.x, dy = m.y - T.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d > r + 25) continue;
    if (d > 30 && (dx * f[0] + dy * f[1]) / d < 0.5) continue;
    if (isWeak(m) && R.ropes > 0 && !D.lasso && !lassoDone) {
      lassoDone = true;
      D.lasso = { mon: m, t: 0, sum: 0, last: Math.atan2(T.y - m.y, T.x - m.x), prog: 0 };
      m.lassoed = true;
    } else {
      m.hp -= whipPower();
      m.hitT = 0.15;
      if (m.hp <= 0) {
        addGold(4);
        if (D.lasso && D.lasso.mon === m) D.lasso = null;
        removeWild(m);
      }
    }
  }
}
function captureWild(m) {
  R.ropes -= 1;
  addFloat(m.x, m.y - 40, '收服!', 'capture', true);
  var sp = m.sp;
  D.lasso = null;
  removeWild(m);
  if (R.roster.indexOf(sp) < 0) R.roster.push(sp);
  else if (R.perks[sp] < 3) {
    R.perks[sp] += 1;
    if (sp === 'stone') R.hearts = Math.min(maxHearts(), R.hearts + 1);
    addFloat(T.x, T.y - 70, SP[sp].perk, 'perk', true);
  } else {
    addGold(20);
    addFloat(T.x, T.y - 70, '+20', 'gold', true);
  }
}
function moveTamer(dx, dy) {
  var nx = T.x + dx;
  if (!circleHitsTile(nx, T.y, 18, isSolid)) T.x = nx;
  var ny = T.y + dy;
  if (!circleHitsTile(T.x, ny, 18, isSolid)) T.y = ny;
}
function dirKeys() {
  var dx = (held.right ? 1 : 0) - (held.left ? 1 : 0);
  var dy = (held.down ? 1 : 0) - (held.up ? 1 : 0);
  return [dx, dy];
}
function tickTamerTimers(dt) {
  T.whipCd = Math.max(0, T.whipCd - dt);
  T.rollCd = Math.max(0, T.rollCd - dt);
  T.parryCd = Math.max(0, T.parryCd - dt);
  T.parryLeft = Math.max(0, T.parryLeft - dt);
  T.whistleCd = Math.max(0, T.whistleCd - dt);
  T.inv = Math.max(0, T.inv - dt);
  T.stun = Math.max(0, T.stun - dt);
}
function updateDungeon(dt) {
  D.time -= dt;
  tickTamerTimers(dt);
  // 操作
  if (pressed.c && T.parryCd <= 0) { T.parryLeft = parryDur(); T.parryCd = 0.6; }
  if (pressed.x && T.rollCd <= 0 && T.rollT <= 0) { T.rollT = 0.25; T.rollCd = 0.8; }
  if (pressed.z && T.whipCd <= 0 && T.rollT <= 0 && !D.lasso) whipDungeon();
  // 移動
  if (T.rollT > 0) {
    var f = DIRS[T.facing];
    var step = Math.min(dt, T.rollT);
    moveTamer(f[0] * 800 * step, f[1] * 800 * step);
    T.rollT -= dt;
  } else {
    var k = dirKeys();
    if (k[0] || k[1]) {
      var len = Math.sqrt(k[0] * k[0] + k[1] * k[1]);
      var sp = 320 * (tileAtPx(T.x, T.y) === 'water' ? 0.5 : 1);
      moveTamer(k[0] / len * sp * dt, k[1] / len * sp * dt);
      T.facing = FACE[k[0] + ',' + k[1]];
    }
  }
  // 熔岩
  if (T.rollT <= 0 && T.inv <= 0) {
    var lava = false, o = 10, pts = [[0, 0], [o, o], [-o, o], [o, -o], [-o, -o]];
    for (var i = 0; i < pts.length; i++) if (tileAtPx(T.x + pts[i][0], T.y + pts[i][1]) === 'lava') lava = true;
    if (lava) hurtTamer();
  }
  // 魔物
  for (var n = 0; n < D.nests.length; n++) {
    var ne = D.nests[n];
    if (!ne.mon) { ne.timer -= dt; if (ne.timer <= 0) spawnWild(ne); }
  }
  var ms = D.monsters.slice();
  for (var j = 0; j < ms.length; j++) updateWild(ms[j], dt);
  updateHazards(dt);
  // 套索
  var L = D.lasso;
  if (L) {
    L.t += dt;
    var ang = Math.atan2(T.y - L.mon.y, T.x - L.mon.x);
    L.sum += normAng(ang - L.last);
    L.last = ang;
    L.prog = Math.min(1, Math.abs(L.sum) / (2 * Math.PI));
    var dd = dist(T.x, T.y, L.mon.x, L.mon.y);
    if (L.prog >= 1) captureWild(L.mon);
    else if (L.t >= 5 || dd > 220) breakLasso();
  }
  D.camY = clamp(T.y - 700, 0, 640);
  if (R.hearts <= 0 || D.time <= 0) endDungeon();
}
function updateWild(m, dt) {
  if (m.gone) return;
  m.hitT = Math.max(0, m.hitT - dt);
  var cz = ZONE_CENTER[m.zone];
  if (m.lassoed) {
    var d = dist(m.x, m.y, cz[0], cz[1]);
    if (d > 5) {
      var s = Math.min(40 * dt, d);
      var nx = m.x + (cz[0] - m.x) / d * s, ny = m.y + (cz[1] - m.y) / d * s;
      if (!wildBlocked(m, nx, m.y)) m.x = nx;
      if (!wildBlocked(m, m.x, ny)) m.y = ny;
    }
    m.dir = T.x < m.x ? -1 : 1;
  } else {
    m.turnT -= dt;
    if (m.turnT <= 0) {
      var a = rnd(0, Math.PI * 2);
      m.vx = Math.cos(a) * 60; m.vy = Math.sin(a) * 60; m.turnT = rnd(2, 3);
    }
    var bx = m.x + m.vx * dt, by = m.y + m.vy * dt, blocked = false;
    if (!wildBlocked(m, bx, m.y)) m.x = bx; else { m.vx = -m.vx; blocked = true; }
    if (!wildBlocked(m, m.x, by)) m.y = by; else { m.vy = -m.vy; blocked = true; }
    if (blocked) m.turnT = Math.max(m.turnT, 0.5);
    if (m.vx < -1) m.dir = -1; else if (m.vx > 1) m.dir = 1;
  }
  m.castCd -= dt;
  if (m.castCd <= 0 && dist(m.x, m.y, T.x, T.y) < 400) {
    spawnCast(m, m.sp, T.x, T.y, 'dun');
    m.castCd = SP[m.sp].interval * (isWeak(m) ? 1.5 : 1);
  }
}
function endDungeon() {
  breakLasso();
  D.lasso = null;
  hazards = []; effects = []; floats = [];
  G.phase = 'title'; G.stage = 'show';
}

// ---------- 表演場 ----------
function startShow() {
  G.phase = 'show';
  S = { time: 50, monsters: [], fences: { top: [], bottom: [] }, visitors: [] };
  for (var i = 0; i < 6; i++) { S.fences.top.push(false); S.fences.bottom.push(false); }
  for (var v = 0; v < 12; v++) {
    var side = v < 6 ? 'top' : 'bottom';
    S.visitors.push({ seat: v, side: side, x: SEAT_X[v % 6], y: SEAT_Y[side], t: 99 });
  }
  for (var r = 0; r < R.roster.length; r++) {
    S.monsters.push({
      sp: R.roster[r], x: rnd(ARENA.x0 + 60, ARENA.x1 - 60), y: rnd(ARENA.y0 + 60, ARENA.y1 - 60),
      rage: 20, mode: 'roam', perfT: 0, pt: 0, fx: 'none', fxT: 0, subdue: 0, chargeT: 0, dir: 1,
      vx: 0, vy: 0, turnT: 0, side: 'top', fi: 0, arrived: false, ldx: 1, atk: 0, gone: false
    });
  }
  T = newTamer();
  T.x = 360; T.y = 635;
  hazards = []; floats = []; effects = [];
}
function addRage(m, d, fx) {
  if (m.mode !== 'roam') return false;
  m.rage = clamp(m.rage + d, 0, 100);
  m.fx = fx; m.fxT = 0;
  if (m.rage >= 100) startCharge(m);
  return true;
}
function startCharge(m) {
  m.mode = 'charge';
  m.rage = 100;
  m.side = m.y < (ARENA.y0 + ARENA.y1) / 2 ? 'top' : 'bottom';
  var best = -1, bd = 1e9, i;
  for (i = 0; i < 6; i++) {
    if (S.fences[m.side][i]) continue;
    var d = Math.abs(SEAT_X[i] - m.x);
    if (d < bd) { bd = d; best = i; }
  }
  if (best < 0) for (i = 0; i < 6; i++) { var d2 = Math.abs(SEAT_X[i] - m.x); if (d2 < bd) { bd = d2; best = i; } }
  m.fi = best; m.arrived = false; m.chargeT = 0; m.subdue = 0; m.atk = 0;
}
function interval(m) { return 3 - 2 * (clamp(m.rage, 50, 99) - 50) / 49; }
function performCast(m) {
  m.perfT = 0.5; m.pt = 0;
  var cast = spawnCast(m, m.sp, T.x, T.y, 'show');
  cast.red = m.rage >= 80 && m.rage <= 99;
  return cast;
}
function settleCast(cast) {
  if (cast.settled) return;
  cast.settled = true;
  var m = cast.owner, s = SP[cast.sp];
  var gold = Math.round(s.gold * (1 + 0.5 * cast.hits) * (cast.red ? 2 : 1) * (1 + R.rep / 100));
  addGold(gold);
  addRep(s.rep);
  addFloat(m.x, m.y - 50, '+' + gold + (cast.red ? ' 紅線 ×2' : ''), cast.red ? 'redGold' : 'gold', false);
}
function reflect(cast) {
  R.reflects += 1;
  addEffect('reflect', T.x, T.y, { element: cast.sp, radius: 160 }, 0.4);
  var delta = cast.sp === 'water' ? -20 : 15;
  var hit = [];
  for (var i = 0; i < S.monsters.length; i++) {
    var m = S.monsters[i];
    if (m.mode !== 'roam') continue;
    if (dist(T.x, T.y, m.x, m.y) <= 160 + 30) hit.push(m);
  }
  for (var j = 0; j < hit.length; j++) addRage(hit[j], delta, delta < 0 ? 'doused' : 'ignited');
  var gold = Math.round(hit.length * 2 * (1 + R.rep / 100));
  addGold(gold);
  addRep(1);
  for (var k = 0; k < hit.length; k++) {
    var h = hit[k];
    if (h.mode === 'roam' && h.rage >= 50 && h.rage <= 99) performCast(h);
  }
  addFloat(T.x, T.y - 50, '彈反 ×' + hit.length, 'parry', false);
}
function moveRoam(m, dt) {
  m.turnT -= dt;
  if (m.turnT <= 0) { var a = rnd(0, Math.PI * 2); m.vx = Math.cos(a) * 60; m.vy = Math.sin(a) * 60; m.turnT = rnd(2, 3); }
  m.x += m.vx * dt; m.y += m.vy * dt;
  var x0 = ARENA.x0 + 40, x1 = ARENA.x1 - 40, y0 = ARENA.y0 + 40, y1 = ARENA.y1 - 40;
  if (m.x < x0) { m.x = x0; m.vx = Math.abs(m.vx); }
  if (m.x > x1) { m.x = x1; m.vx = -Math.abs(m.vx); }
  if (m.y < y0) { m.y = y0; m.vy = Math.abs(m.vy); }
  if (m.y > y1) { m.y = y1; m.vy = -Math.abs(m.vy); }
  if (m.vx < -1) m.dir = -1; else if (m.vx > 1) m.dir = 1;
}
function recoverMonster(m) {
  if (m.mode === 'loose' || (m.mode === 'charge' && m.arrived)) { /* 圍欄只有破了才需要修 */ }
  S.fences[m.side][m.fi] = false;
  m.mode = 'roam'; m.x = 360; m.y = 635; m.rage = 30; m.subdue = 0; m.pt = 0; m.arrived = false; m.chargeT = 0;
  m.turnT = 0;
}
function updateShowMonster(m, dt) {
  m.fxT += dt;
  if (m.fx !== 'none' && m.fxT >= 0.5) m.fx = 'none';
  m.perfT = Math.max(0, m.perfT - dt);
  if (m.mode === 'roam') {
    moveRoam(m, dt);
    m.rage = Math.max(0, m.rage - SP[m.sp].decay * dt);
    if (m.rage < 50) m.pt = 0;
    else { m.pt += dt; if (m.pt >= interval(m)) performCast(m); }
  } else if (m.mode === 'charge') {
    var tx = SEAT_X[m.fi], ty = m.side === 'top' ? ARENA.y0 + 25 : ARENA.y1 - 30;
    if (!m.arrived) {
      var d = dist(m.x, m.y, tx, ty);
      var s = 160 * dt;
      if (d <= s) { m.x = tx; m.y = ty; m.arrived = true; m.chargeT = 0; }
      else { m.x += (tx - m.x) / d * s; m.y += (ty - m.y) / d * s; }
      if (tx < m.x) m.dir = -1; else m.dir = 1;
    } else {
      m.chargeT += dt;
      if (m.chargeT >= 1.5) {
        m.chargeT = 1.5;
        S.fences[m.side][m.fi] = true;
        m.mode = 'loose'; m.y = SEAT_Y[m.side]; m.ldx = 1; m.atk = 0;
      }
    }
  } else if (m.mode === 'loose') {
    m.x += m.ldx * 140 * dt;
    if (m.x > SEAT_X[5]) { m.x = SEAT_X[5]; m.ldx = -1; }
    if (m.x < SEAT_X[0]) { m.x = SEAT_X[0]; m.ldx = 1; }
    m.dir = m.ldx;
    m.atk += dt;
    if (m.atk >= 1.5) {
      m.atk = 0;
      var best = null, bd = 60;
      for (var i = 0; i < S.visitors.length; i++) {
        var v = S.visitors[i];
        if (v.side !== m.side || v.t < 99) continue;
        var dd = Math.abs(v.x - m.x);
        if (dd < bd) { bd = dd; best = v; }
      }
      if (best) {
        best.t = 0;
        addRep(-3);
        addFloat(m.x, m.y - 40, '名聲 -3', 'repDown', false);
      }
    }
  }
}
function updateShow(dt) {
  S.time -= dt;
  tickTamerTimers(dt);
  var stunned = T.stun > 0, i, m;
  if (!stunned) {
    if (pressed.c && T.parryCd <= 0) { T.parryLeft = parryDur(); T.parryCd = 0.6; }
    if (pressed.z && T.whipCd <= 0) {
      T.whipCd = 0.35;
      var r = whipR();
      addEffect('whip', T.x, T.y, { shape: 'circle', facing: T.facing, radius: r }, 0.25);
      for (i = 0; i < S.monsters.length; i++) {
        m = S.monsters[i];
        if (m.mode === 'roam' && dist(T.x, T.y, m.x, m.y) <= r + 30) addRage(m, SP[m.sp].whip, 'ignited');
      }
    }
    if (pressed.x && T.whistleCd <= 0) {
      T.whistleCd = whistleCdMax();
      var wr = whistleR();
      addEffect('whistle', T.x, T.y, { radius: wr }, 0.25);
      var toRecover = [];
      for (i = 0; i < S.monsters.length; i++) {
        m = S.monsters[i];
        if (dist(T.x, T.y, m.x, m.y) > wr + 30) continue;
        if (m.mode === 'roam') addRage(m, -30, 'calmed');
        else { m.subdue += 1; if (m.subdue >= 3) toRecover.push(m); }
      }
      for (i = 0; i < toRecover.length; i++) recoverMonster(toRecover[i]);
    }
  }
  var k = dirKeys();
  if (k[0] || k[1]) {
    var len = Math.sqrt(k[0] * k[0] + k[1] * k[1]);
    T.x = clamp(T.x + k[0] / len * 320 * dt, ARENA.x0 + 18, ARENA.x1 - 18);
    T.y = clamp(T.y + k[1] / len * 320 * dt, ARENA.y0 + 18, ARENA.y1 - 18);
    T.facing = FACE[k[0] + ',' + k[1]];
  }
  var ms = S.monsters.slice();
  for (i = 0; i < ms.length; i++) updateShowMonster(ms[i], dt);
  updateHazards(dt);
  for (i = 0; i < S.visitors.length; i++) { var v = S.visitors[i]; if (v.t < 99) { v.t += dt; if (v.t >= 4) v.t = 99; } }
  if (S.time <= 0) endShow();
}
function endShow() {
  for (var i = 0; i < hazards.length; i++) if (hazards[i].cast.mode === 'show') settleCast(hazards[i].cast);
  for (var j = 0; j < S.monsters.length; j++) {
    var m = S.monsters[j];
    if (m.mode !== 'roam') addRep(-5);
  }
  hazards = []; effects = []; floats = [];
  if (R.day >= 3) { G.phase = 'result'; }
  else { G.phase = 'shop'; R.shopSel = 0; }
}

// ---------- 流程 ----------
function closeGuide() {
  if (G.guideReturn) { G.phase = G.guideReturn; G.guideReturn = null; }
  else { G.phase = 'title'; G.stage = 'dungeon'; }
}
function tick(dt) {
  if (pressed.h) {
    if (G.phase === 'guide') closeGuide();
    else { G.guideReturn = G.phase; G.phase = 'guide'; G.page = 1; }
    pressed = {};
    return;
  }
  var ph = G.phase;
  if (ph === 'guide') {
    if (pressed.left) G.page = Math.max(1, G.page - 1);
    else if (pressed.right) G.page = Math.min(GUIDE.length, G.page + 1);
    else if (pressed.z) { if (G.page < GUIDE.length) G.page++; else closeGuide(); }
  } else if (ph === 'title') {
    if (pressed.z) { if (G.stage === 'dungeon') startDungeon(); else startShow(); }
  } else if (ph === 'dungeon') {
    updateDungeon(dt);
  } else if (ph === 'show') {
    updateShow(dt);
  } else if (ph === 'shop') {
    if (pressed.up) R.shopSel = Math.max(0, R.shopSel - 1);
    else if (pressed.down) R.shopSel = Math.min(4, R.shopSel + 1);
    else if (pressed.z) {
      if (R.shopSel === 4) { R.day++; G.phase = 'title'; G.stage = 'dungeon'; }
      else {
        var it = SHOP_ITEMS[R.shopSel];
        if (R.gold >= R.costs[it.up]) {
          R.gold -= R.costs[it.up];
          R.costs[it.up] = Math.round(R.costs[it.up] * 1.5);
          R.ups[it.up] += 1;
        }
      }
    }
  } else if (ph === 'result') {
    if (pressed.z) { resetRun(); G.phase = 'title'; G.stage = 'dungeon'; }
  }
  // 特效與飄字
  for (var i = 0; i < effects.length; i++) effects[i].t += dt;
  effects = effects.filter(function (e) { return e.t < e.dur; });
  for (var j = 0; j < floats.length; j++) floats[j].t += dt;
  floats = floats.filter(function (f) { return f.t < f.dur; });
  pressed = {};
}

// ---------- 輸入(只有鍵盤) ----------
var KEYMAP = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', KeyZ: 'z', KeyX: 'x', KeyC: 'c', KeyH: 'h' };
window.addEventListener('keydown', function (e) {
  var n = KEYMAP[e.code];
  if (!n) return;
  e.preventDefault();
  if (e.repeat) return;
  held[n] = true;
  pressed[n] = true;
});
window.addEventListener('keyup', function (e) {
  var n = KEYMAP[e.code];
  if (!n) return;
  e.preventDefault();
  held[n] = false;
});
window.addEventListener('blur', function () { held = {}; });

// ---------- 繪製(依狀態呼叫 Art) ----------
function hudState(msg) {
  var ph = G.phase;
  var dun = ph === 'dungeon';
  var roster = R.roster.map(function (s) { return { species: s }; });
  return {
    phase: ph, day: R.day, gold: R.gold, rep: R.rep, hearts: R.hearts, maxHearts: maxHearts(),
    ropes: R.ropes, ropeMax: ropeMax(), roster: roster, perks: { fire: R.perks.fire, water: R.perks.water, thunder: R.perks.thunder, stone: R.perks.stone },
    timeLeft: dun ? Math.max(0, D.time) : (ph === 'show' ? Math.max(0, S.time) : 0),
    timeMax: dun ? 60 : (ph === 'show' ? 50 : 0),
    message: msg || '',
    rollCd: T.rollCd, rollCdMax: 0.8, parryCd: T.parryCd, parryCdMax: 0.6,
    whistleCd: T.whistleCd, whistleCdMax: whistleCdMax()
  };
}
function drawTamerAt(sy) {
  Art.drawTamer(ctx, {
    x: T.x, y: sy, facing: T.facing, rolling: T.rollT > 0, parryLeft: T.parryLeft, parryDur: parryDur(),
    stunLeft: T.stun, stunDur: 1.5, blink: T.inv > 0 && Math.floor(T.inv * 10) % 2 === 0,
    lassoing: !!(G.phase === 'dungeon' && D.lasso)
  });
}
function drawEffects(oy) {
  for (var i = 0; i < effects.length; i++) {
    var e = effects[i], y = e.y + oy;
    if (e.type === 'whip') Art.drawWhipCrack(ctx, { x: e.x, y: y, shape: e.shape, facing: e.facing, radius: e.radius, t: e.t, dur: e.dur });
    else if (e.type === 'whistle') Art.drawWhistleWave(ctx, { x: e.x, y: y, radius: e.radius, t: e.t, dur: e.dur });
    else if (e.type === 'parry') Art.drawParryFlash(ctx, { x: e.x, y: y, t: e.t, dur: e.dur });
    else if (e.type === 'reflect') Art.drawReflectWave(ctx, { x: e.x, y: y, element: e.element, radius: e.radius, t: e.t, dur: e.dur });
  }
}
function drawHazards(oy) {
  for (var i = 0; i < hazards.length; i++) {
    var h = hazards[i];
    Art.drawHazard(ctx, { x: h.x, y: h.y + oy, kind: h.kind, phase: h.phase, radius: h.radius, t: h.t, dur: h.dur, angle: h.angle });
  }
}
function drawFloats(oy) {
  for (var i = 0; i < floats.length; i++) {
    var f = floats[i];
    Art.drawFloatText(ctx, { x: f.x, y: f.y + (f.world ? oy : 0) - f.t * 40, text: f.text, kind: f.kind, t: f.t, dur: f.dur });
  }
}
function renderDungeon() {
  var cam = D.camY, oy = 120 - cam;
  Art.drawBackground(ctx, {});
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 120, W, H - 120); ctx.clip();
  var r0 = Math.max(0, Math.floor(cam / TILE)), r1 = Math.min(ROWS - 1, Math.floor((cam + 1160) / TILE));
  for (var r = r0; r <= r1; r++) for (var c = 0; c < COLS; c++) {
    var ch = MAP[r].charAt(c);
    Art.drawTile(ctx, { x: c * TILE + 30, y: r * TILE + 30 + oy, kind: tileKind(c, r), zone: tileZone(c, r), nest: 'tgfj'.indexOf(ch) >= 0 });
  }
  var i;
  for (i = 0; i < D.monsters.length; i++) {
    var m = D.monsters[i], casting = false;
    for (var q = 0; q < hazards.length; q++) if (hazards[q].owner === m && hazards[q].phase === 'warn') casting = true;
    Art.drawWildMonster(ctx, { x: m.x, y: m.y + oy, species: m.sp, hp: m.hp, maxHp: m.maxHp, hit: m.hitT > 0, weak: isWeak(m), lassoed: m.lassoed, casting: casting, dir: m.dir });
  }
  if (D.lasso) {
    var L = D.lasso;
    Art.drawLasso(ctx, { x1: T.x, y1: T.y + oy, x2: L.mon.x, y2: L.mon.y + oy, progress: L.prog, t: L.t, limit: 5, len: dist(T.x, T.y, L.mon.x, L.mon.y), maxLen: 220 });
  }
  drawHazards(oy);
  drawTamerAt(T.y + oy);
  drawEffects(oy);
  drawFloats(oy);
  ctx.restore();
  Art.drawHud(ctx, hudState(D.lasso ? '繞著魔物跑一圈!' : ''));
}
function renderShow() {
  Art.drawBackground(ctx, {});
  Art.drawShowArena(ctx, {});
  var i;
  for (i = 0; i < 6; i++) {
    Art.drawFence(ctx, { x: SEAT_X[i], y: FENCE_Y.top, side: 'top', broken: S.fences.top[i] });
    Art.drawFence(ctx, { x: SEAT_X[i], y: FENCE_Y.bottom, side: 'bottom', broken: S.fences.bottom[i] });
  }
  for (i = 0; i < S.visitors.length; i++) {
    var v = S.visitors[i], mode = v.t >= 99 ? 'watch' : (v.t < 0.8 ? 'scared' : 'empty');
    Art.drawVisitor(ctx, { x: v.x, y: v.y, seat: v.seat, mode: mode });
  }
  var loose = false;
  for (i = 0; i < S.monsters.length; i++) {
    var m = S.monsters[i];
    if (m.mode !== 'roam') loose = true;
    Art.drawShowMonster(ctx, {
      x: m.x, y: m.y, species: m.sp, rage: m.rage, mode: m.mode, performing: m.perfT > 0,
      fx: m.fx, fxT: m.fxT, fxDur: 0.5, subdue: m.subdue, chargeT: m.mode === 'charge' ? m.chargeT : (m.mode === 'loose' ? 1.5 : 0), chargeDur: 1.5, dir: m.dir
    });
  }
  drawHazards(0);
  drawTamerAt(T.y);
  drawEffects(0);
  drawFloats(0);
  Art.drawHud(ctx, hudState(loose ? '追上去吹哨 3 次' : ''));
}
function renderGuide() {
  Art.drawBackground(ctx, {});
  var pg = GUIDE[G.page - 1];
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText(pg.title, W / 2, 80);
  ctx.restore();
  Art.drawGuidePage(ctx, { page: G.page, x: 40, y: 150, w: 640, h: 760 });
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
  ctx.font = 'bold 40px sans-serif';
  for (var i = 0; i < pg.lines.length; i++) ctx.fillText(pg.lines[i], W / 2, 970 + i * 56);
  ctx.font = '28px sans-serif';
  ctx.fillText(G.page + ' / ' + GUIDE.length, W / 2, 1120);
  ctx.font = '26px sans-serif';
  ctx.fillText(G.page < GUIDE.length ? '按 Z 繼續　← 上一頁' : '按 Z 開始　← 上一頁', W / 2, 1200);
  ctx.restore();
}
function render() {
  ctx.setTransform(pxRatio, 0, 0, pxRatio, 0, 0);
  var ph = G.phase;
  if (ph === 'guide') renderGuide();
  else if (ph === 'title') {
    Art.drawBackground(ctx, {});
    Art.drawTitleCard(ctx, { day: R.day, stage: G.stage });
    Art.drawHud(ctx, hudState('按 Z 開始'));
  } else if (ph === 'dungeon') renderDungeon();
  else if (ph === 'show') renderShow();
  else if (ph === 'shop') {
    Art.drawBackground(ctx, {});
    for (var i = 0; i < 4; i++) {
      var it = SHOP_ITEMS[i], cost = R.costs[it.up];
      Art.drawShopItem(ctx, { x: 360, y: SHOP_Y[i], item: it.key, level: R.ups[it.up], cost: cost, affordable: R.gold >= cost, selected: R.shopSel === i });
    }
    Art.drawButton(ctx, { x: 160, y: 1140, w: 400, h: 100, label: '出發', selected: R.shopSel === 4 });
    Art.drawHud(ctx, hudState('↑↓ 選擇 Z 確定'));
  } else if (ph === 'result') {
    Art.drawBackground(ctx, {});
    var stars = R.rep >= 260 ? 3 : (R.rep >= 150 ? 2 : (R.rep >= 60 ? 1 : 0));
    Art.drawResultPanel(ctx, {
      rep: R.rep, goldEarned: R.goldEarned, reflects: R.reflects,
      roster: R.roster.map(function (s) { return { species: s }; }),
      perks: { fire: R.perks.fire, water: R.perks.water, thunder: R.perks.thunder, stone: R.perks.stone }, stars: stars
    });
    Art.drawHud(ctx, hudState('按 Z 重來'));
  }
}

// ---------- 主迴圈 ----------
var last = 0;
function frame(ts) {
  var dt = last ? (ts - last) / 1000 : 0;
  last = ts;
  dt = Math.min(Math.max(dt, 0), 1 / 30);
  try { tick(dt); render(); } catch (err) { console.error(err); pressed = {}; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
