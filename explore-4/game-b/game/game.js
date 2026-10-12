(function () {
'use strict';

// ============ 畫布 ============
var W = Art.canvas.width, H = Art.canvas.height;
var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var dpr = window.devicePixelRatio || 1;
canvas.width = Math.round(W * dpr);
canvas.height = Math.round(H * dpr);
function fit() {
  var s = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
}
window.addEventListener('resize', fit);
fit();

// ============ 常數 ============
var DAYS = 3, DUNGEON_TIME = 60, SHOW_TIME = 50;
var TAMER_SPEED = 320, TAMER_R = 18, GUARD_WIN = 0.25, SHIELD_CD = 0.6, INVULN = 1;
var ATTACK_DIST = 400, WALK_SPEED = 60, WEAK_RATIO = 0.3, NEST_RESPAWN = 8, DEFEAT_GOLD = 4;
var TILE = 60, COLS = 12, ROWS = 30, HUD_H = 120, VIEW_H = 1160;
var BASE_HP = { fire: 10, water: 7, thunder: 10, stone: 13 };
var CAST_INTERVAL = { fire: 2.4, thunder: 2.6, stone: 3, water: 1.6 };
var SPECIES_ZONE = { thunder: 'crag', stone: 'ruins', water: 'pond', fire: 'lava' };
var ROOM = { // 欄,列 範圍(含)
  crag: [1, 3, 1, 8], ruins: [8, 10, 1, 8], pond: [1, 5, 10, 13], lava: [6, 10, 10, 13]
};
var RAGE_RATE = { fire: 6, water: 4, thunder: 9, stone: 3 };
var PERF_GOLD = { fire: 5, water: 3, thunder: 7, stone: 4 };
var PERF_REP = { fire: 1, water: 1, thunder: 2, stone: 1 };
var RAGE_DELTA = { fire: 20, thunder: 25, stone: 10, water: -30 };
var PED = [[360, 405], [559, 520], [559, 750], [360, 865], [161, 750], [161, 520]];
var SEAT_X = [110, 210, 310, 410, 510, 610];
var SEAT_Y_UP = 190, SEAT_Y_DOWN = 1080;
var BTN_PREP = { x: 160, y: 1160, w: 400, h: 90 };
var BTN_SHOP = { x: 160, y: 1140, w: 400, h: 100 };
var SHOP_Y = [300, 460, 620, 780];
var SHOP_ITEMS = ['heavyShield', 'ropeBag', 'armor', 'snackPack'];
var SHOP_BASE = { heavyShield: 50, ropeBag: 40, armor: 40, snackPack: 30 };

var MAP = [
'############',
'#..........#',
'#.t......g.#',
'#..........#',
'#...#..#...#',
'#...#..#...#',
'#.t.#..#.g.#',
'#...#..#...#',
'#...#..#...#',
'#####..#####',
'#WW......LL#',
'#W.j....f.L#',
'#..........#',
'#WW.j..f.LL#',
'#####..#####',
'#..........#',
'#..o....o..#',
'#..........#',
'###......###',
'###......###',
'##........##',
'##........##',
'##...S....##',
'##........##',
'##........##',
'##........##',
'##........##',
'##........##',
'##........##',
'############'
];

// ============ 佔位圖形(目前無) ============
var Placeholder = {};

// ============ 地圖資料 ============
var KIND = [], NESTS = [], START = { x: 330, y: 1350 };
(function buildMap() {
  var nestSp = { t: 'thunder', g: 'stone', f: 'fire', j: 'water' };
  for (var r = 0; r < ROWS; r++) {
    KIND[r] = [];
    for (var c = 0; c < COLS; c++) {
      var ch = MAP[r].charAt(c), k = 'floor';
      if (ch === '#') k = 'wall';
      else if (ch === 'o') k = 'pillar';
      else if (ch === 'L') k = 'lava';
      else if (ch === 'W') k = 'water';
      else if (ch === 'S') START = { x: c * TILE + 30, y: r * TILE + 30 };
      else if (nestSp[ch]) NESTS.push({ c: c, r: r, species: nestSp[ch], mon: null, respawn: 0 });
      KIND[r][c] = k;
    }
  }
})();
function nestAt(c, r) {
  for (var i = 0; i < NESTS.length; i++) if (NESTS[i].c === c && NESTS[i].r === r) return true;
  return false;
}
function zoneOf(c, r) {
  for (var z in ROOM) {
    var a = ROOM[z];
    if (c >= a[0] && c <= a[1] && r >= a[2] && r <= a[3]) return z;
  }
  return 'hall';
}
function solidAt(c, r) {
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
  var k = KIND[r][c];
  return k === 'wall' || k === 'pillar';
}
function blocked(x, y, rad) {
  var c0 = Math.floor((x - rad) / TILE), c1 = Math.floor((x + rad) / TILE);
  var r0 = Math.floor((y - rad) / TILE), r1 = Math.floor((y + rad) / TILE);
  for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
    if (!solidAt(c, r)) continue;
    var nx = Math.max(c * TILE, Math.min(x, c * TILE + TILE));
    var ny = Math.max(r * TILE, Math.min(y, r * TILE + TILE));
    var dx = x - nx, dy = y - ny;
    if (dx * dx + dy * dy < rad * rad) return true;
  }
  return false;
}
function tileKindAt(x, y) {
  var c = Math.floor(x / TILE), r = Math.floor(y / TILE);
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return 'wall';
  return KIND[r][c];
}

// ============ 遊戲狀態 ============
var G; // 整局資料
var phase = 'guide';      // guide | title | dungeon | prep | show | shop | result
var guideBack = 'title';
var guidePage = 0;
var titleStage = 'dungeon';
var T = null;             // 地下城狀態
var S = null;             // 表演場狀態
var floats = [];
var prep = { cursor: 0, held: -1 };
var shopCursor = 0;
var keys = { left: false, right: false, up: false, down: false };

function newGame() {
  G = {
    day: 1, gold: 0, goldEarned: 0, rep: 0,
    hearts: 5, maxHearts: 5, ropes: 3, ropeMax: 3, snacks: 2,
    counter: 3, bestChain: 0,
    roster: [{ species: 'fire' }, null, { species: 'thunder' }, null, null, null],
    shop: { heavyShield: { level: 0, cost: 50 }, ropeBag: { level: 0, cost: 40 },
            armor: { level: 0, cost: 40 }, snackPack: { level: 0, cost: 30 } }
  };
  floats = [];
  T = null; S = null;
}
function setTitle(stage) { titleStage = stage; phase = 'title'; floats = []; }

function addFloat(x, y, text, kind, world) {
  floats.push({ x: x, y: y, text: text, kind: kind, t: 0, world: !!world });
}
function addRep(n) { G.rep = Math.max(0, G.rep + n); }
function rosterSpecies() {
  var a = [];
  for (var i = 0; i < 6; i++) a.push(G.roster[i] ? G.roster[i].species : null);
  return a;
}

// ============ 地下城 ============
function startDay() {
  G.hearts = G.maxHearts;
  G.ropes = G.ropeMax;
  T = {
    x: START.x, y: START.y, dir: 1,
    guardT: 0, shieldCd: 0, invuln: 0,
    time: DUNGEON_TIME, mons: [], hazards: [], flashes: [], camY: 0
  };
  for (var i = 0; i < NESTS.length; i++) {
    NESTS[i].mon = null; NESTS[i].respawn = 0;
    spawnMon(NESTS[i]);
  }
  floats = [];
  phase = 'dungeon';
}
function monMaxHp(sp) {
  return Math.round(BASE_HP[sp] * (1 + 0.5 * (G.day - 1)));
}
function spawnMon(n) {
  var hp = monMaxHp(n.species);
  var m = {
    species: n.species, nest: n, x: n.c * TILE + 30, y: n.r * TILE + 30,
    hp: hp, maxHp: hp, dir: 1, hitT: 0, castT: 0,
    castCd: CAST_INTERVAL[n.species] * (0.5 + Math.random() * 0.5),
    turnT: 0, vx: 0, vy: 0, dead: false
  };
  newDir(m);
  n.mon = m;
  T.mons.push(m);
}
function newDir(m) {
  var a = Math.random() * Math.PI * 2;
  m.vx = Math.cos(a) * WALK_SPEED; m.vy = Math.sin(a) * WALK_SPEED;
  if (m.vx !== 0) m.dir = m.vx < 0 ? -1 : 1;
  m.turnT = 2 + Math.random();
}
function roomRect(sp) {
  var a = ROOM[SPECIES_ZONE[sp]], mg = 30;
  return { x0: a[0] * TILE + mg, x1: (a[1] + 1) * TILE - mg, y0: a[2] * TILE + mg, y1: (a[3] + 1) * TILE - mg };
}
function camYOf() { return Math.max(0, Math.min(640, T.y - 700)); }

function tamerHurt() {
  G.hearts--;
  T.invuln = INVULN;
  if (G.hearts <= 0) endDungeon();
}
function endDungeon() {
  if (phase !== 'dungeon') return;
  prep.cursor = 0; prep.held = -1;
  floats = [];
  phase = 'prep';
}
function removeMon(m) {
  m.dead = true;
  m.nest.mon = null;
  m.nest.respawn = NEST_RESPAWN;
}
function addToRoster(sp) {
  for (var i = 0; i < 6; i++) {
    if (!G.roster[i]) { G.roster[i] = { species: sp }; return true; }
  }
  return false;
}
function parry(h) {
  var m = h.owner;
  var res = 'counter';
  if (m && !m.dead) {
    var weak = m.hp <= m.maxHp * WEAK_RATIO;
    if (weak && G.ropes > 0) {
      res = 'capture';
      G.ropes--;
      removeMon(m);
      if (!addToRoster(m.species)) {
        G.snacks += 2;
        addFloat(m.x, m.y - 40, '點心 +2', 'snack', true);
      }
    } else {
      m.hp -= G.counter;
      m.hitT = 0.3;
      if (m.hp <= 0) {
        removeMon(m);
        G.gold += DEFEAT_GOLD; G.goldEarned += DEFEAT_GOLD;
        addFloat(m.x, m.y - 40, '+' + DEFEAT_GOLD, 'gold', true);
      }
    }
    T.flashes.push({ x: T.x, y: T.y, tx: m.x, ty: m.y, result: res, t: 0 });
  } else {
    T.flashes.push({ x: T.x, y: T.y, tx: h.x, ty: h.y, result: res, t: 0 });
  }
}
// 技能打到馴獸師的那一刻
function hazardHit(h) {
  if (h.group.done) return false;
  if (T.guardT > 0) { parry(h); h.group.done = true; return true; }
  if (T.invuln <= 0) { tamerHurt(); h.group.done = true; return true; }
  return false;
}
function monCast(m) {
  var g = { done: false };
  if (m.species === 'fire') {
    T.hazards.push({ kind: 'firering', x: m.x, y: m.y, phase: 'warn', radius: 120, t: 0, angle: 0, owner: m, group: g });
    m.castT = 0.5;
  } else if (m.species === 'thunder') {
    T.hazards.push({ kind: 'thunder', x: T.x, y: T.y, phase: 'warn', radius: 70, t: 0, angle: 0, owner: m, group: g, struck: false });
    m.castT = 0.8;
  } else if (m.species === 'stone') {
    T.hazards.push({ kind: 'quake', x: m.x, y: m.y, phase: 'active', radius: 0, t: 0, angle: 0, owner: m, group: g });
    m.castT = 0.3;
  } else {
    var base = Math.atan2(T.y - m.y, T.x - m.x);
    var offs = [-10, 0, 10];
    for (var i = 0; i < 3; i++) {
      T.hazards.push({ kind: 'waterball', x: m.x, y: m.y, phase: 'active', radius: 12, t: 0,
        angle: base + offs[i] * Math.PI / 180, owner: m, group: g });
    }
    m.castT = 0.3;
  }
  if (T.x < m.x) m.dir = -1; else m.dir = 1;
}
function overlap(h, rad) {
  var dx = T.x - h.x, dy = T.y - h.y;
  var r = rad + TAMER_R;
  return dx * dx + dy * dy <= r * r;
}
function updateDungeon(dt) {
  T.time -= dt;
  // 馴獸師
  var dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  var dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  if (dx || dy) {
    var len = Math.sqrt(dx * dx + dy * dy);
    var sp = TAMER_SPEED * (tileKindAt(T.x, T.y) === 'water' ? 0.5 : 1);
    var mx = dx / len * sp * dt, my = dy / len * sp * dt;
    if (!blocked(T.x + mx, T.y, TAMER_R)) T.x += mx;
    if (!blocked(T.x, T.y + my, TAMER_R)) T.y += my;
    if (dx) T.dir = dx < 0 ? -1 : 1;
  }
  if (T.guardT > 0) T.guardT = Math.max(0, T.guardT - dt);
  if (T.shieldCd > 0) T.shieldCd = Math.max(0, T.shieldCd - dt);
  if (T.invuln > 0) T.invuln = Math.max(0, T.invuln - dt);
  if (tileKindAt(T.x, T.y) === 'lava' && T.invuln <= 0) tamerHurt();

  // 魔物
  for (var i = 0; i < T.mons.length; i++) {
    var m = T.mons[i];
    if (m.dead) continue;
    if (m.hitT > 0) m.hitT -= dt;
    if (m.castT > 0) m.castT -= dt;
    m.turnT -= dt;
    if (m.turnT <= 0) newDir(m);
    var rc = roomRect(m.species);
    var nx = m.x + m.vx * dt, ny = m.y + m.vy * dt;
    if (nx < rc.x0 || nx > rc.x1) { m.vx = -m.vx; nx = m.x; if (m.vx) m.dir = m.vx < 0 ? -1 : 1; }
    if (ny < rc.y0 || ny > rc.y1) { m.vy = -m.vy; ny = m.y; }
    m.x = Math.max(rc.x0 - 1, Math.min(rc.x1 + 1, nx));
    m.y = Math.max(rc.y0 - 1, Math.min(rc.y1 + 1, ny));
    var ddx = T.x - m.x, ddy = T.y - m.y;
    if (ddx * ddx + ddy * ddy < ATTACK_DIST * ATTACK_DIST) {
      m.castCd -= dt;
      if (m.castCd <= 0) { m.castCd = CAST_INTERVAL[m.species]; monCast(m); }
    }
  }
  T.mons = T.mons.filter(function (m) { return !m.dead; });
  // 巢穴再生
  for (var n = 0; n < NESTS.length; n++) {
    var ns = NESTS[n];
    if (!ns.mon) {
      ns.respawn -= dt;
      if (ns.respawn <= 0) spawnMon(ns);
    }
  }
  // 技能
  var keep = [];
  for (var k = 0; k < T.hazards.length; k++) {
    var h = T.hazards[k];
    h.t += dt;
    var alive = true;
    if (h.kind === 'firering') {
      if (h.t < 0.5) h.phase = 'warn';
      else {
        h.phase = 'active';
        if (overlap(h, h.radius)) hazardHit(h);
      }
      if (h.t >= 1.0) alive = false;
    } else if (h.kind === 'thunder') {
      if (h.t >= 0.8) {
        h.phase = 'active';
        if (!h.struck) { h.struck = true; if (overlap(h, h.radius)) hazardHit(h); }
      }
      if (h.t >= 1.05) alive = false;
    } else if (h.kind === 'quake') {
      h.radius = 220 * Math.min(1, h.t);
      var d = Math.sqrt((T.x - h.x) * (T.x - h.x) + (T.y - h.y) * (T.y - h.y));
      if (d + TAMER_R >= Math.max(0, h.radius - 30) && d - TAMER_R <= h.radius) hazardHit(h);
      if (h.t >= 1.0) alive = false;
    } else if (h.kind === 'waterball') {
      h.x += Math.cos(h.angle) * 300 * dt;
      h.y += Math.sin(h.angle) * 300 * dt;
      if (blocked(h.x, h.y, 2) || h.t > 3) alive = false;
      else if (!h.group.done && overlap(h, h.radius)) {
        if (hazardHit(h)) alive = false;
        else if (T.invuln > 0) alive = false; // 無敵期間被打中, 水彈消失
      }
    }
    if (alive) keep.push(h);
  }
  T.hazards = keep;
  // 彈反特效
  for (var f = 0; f < T.flashes.length; f++) T.flashes[f].t += dt;
  T.flashes = T.flashes.filter(function (x) { return x.t < 0.5; });
  T.camY = camYOf();

  if (phase === 'dungeon' && T.time <= 0) endDungeon();
}
function pressGuard() {
  if (T.shieldCd > 0) return;
  T.guardT = GUARD_WIN;
  T.shieldCd = SHIELD_CD;
}

// ============ 排位 ============
function prepPress() {
  var c = prep.cursor;
  if (c === 6) {
    prep.held = -1; // 放回原台座(陣容本來就沒動)
    setTitle('show');
    return;
  }
  if (prep.held < 0) {
    if (G.roster[c]) prep.held = c;
  } else {
    var a = prep.held, tmp = G.roster[a];
    G.roster[a] = G.roster[c];
    G.roster[c] = tmp;
    prep.held = -1;
  }
}

// ============ 表演場 ============
function startShow() {
  S = { time: SHOW_TIME, mons: [], haz: [], banner: null, nextChain: 1,
        visitors: [], cursor: 0, chains: {} };
  for (var i = 0; i < 6; i++) {
    var r = G.roster[i];
    S.mons[i] = r ? {
      species: r.species, rage: 20, mode: 'stand', x: PED[i][0], y: PED[i][1],
      perfT: 0, fx: 'none', fxT: 0, chainStep: 0, dir: PED[i][0] < 360 ? 1 : -1,
      queue: null, runT: 0, atkT: 0, side: 0, tgtX: 0
    } : null;
  }
  for (var s = 0; s < 12; s++) S.visitors.push({ mode: 'watch', t: 0 });
  floats = [];
  phase = 'show';
}
function pedTargets(sp, i) {
  var m6 = function (n) { return ((n % 6) + 6) % 6; };
  if (sp === 'fire') return [m6(i - 1), m6(i + 1)];
  if (sp === 'thunder') return [m6(i - 2), m6(i + 2)];
  if (sp === 'water') return [m6(i + 3)];
  var a = [];
  for (var j = 0; j < 6; j++) if (j !== i) a.push(j);
  return a;
}
function chainCheckEnd(ch) {
  if (ch.ended || ch.pending > 0) return;
  ch.ended = true;
  if (ch.count >= 2) S.banner = { count: ch.count, t: 0 };
  if (ch.count > G.bestChain) G.bestChain = ch.count;
}
function perform(i, ch, step) {
  var m = S.mons[i];
  var gold = Math.round(PERF_GOLD[m.species] * (m.rage / 50) * (1 + 0.5 * step) * (1 + G.rep / 100));
  G.gold += gold; G.goldEarned += gold;
  addFloat(PED[i][0], PED[i][1] - 70, '+' + gold, 'gold', false);
  addRep(PERF_REP[m.species]);
  addFloat(PED[i][0] + 40, PED[i][1] - 40, '名聲 +' + PERF_REP[m.species], 'repUp', false);
  m.rage = 10;
  m.perfT = 0.5;
  m.chainStep = step;
  ch.members[i] = true;
  ch.count++;
  // 技能視覺
  var sp = m.species, x = PED[i][0], y = PED[i][1];
  var tg = pedTargets(sp, i);
  if (sp === 'fire') S.haz.push({ kind: 'firering', x: x, y: y, phase: 'active', radius: 190, t: 0, angle: 0, life: 0.6 });
  else if (sp === 'stone') S.haz.push({ kind: 'quake', x: x, y: y, phase: 'active', radius: 0, t: 0, angle: 0, life: 0.8, quake: true });
  else if (sp === 'thunder') {
    for (var a = 0; a < tg.length; a++)
      S.haz.push({ kind: 'thunder', x: PED[tg[a]][0], y: PED[tg[a]][1], phase: 'active', radius: 70, t: 0, angle: 0,
        tx: PED[tg[a]][0], ty: PED[tg[a]][1], life: 0.5 });
  } else {
    var tx = PED[tg[0]][0], ty = PED[tg[0]][1];
    S.haz.push({ kind: 'waterball', x: x, y: y, sx: x, sy: y, phase: 'active', radius: 14, t: 0,
      angle: Math.atan2(ty - y, tx - x), tx: tx, ty: ty, life: 0.5, flight: true });
  }
  // 效果
  for (var b = 0; b < tg.length; b++) {
    var j = tg[b], t = S.mons[j];
    if (!t || t.mode !== 'stand') continue;
    var delta = RAGE_DELTA[sp];
    t.rage = Math.max(0, Math.min(100, t.rage + delta));
    t.fx = delta > 0 ? 'ignited' : 'doused';
    t.fxT = 0.5;
    if (t.rage >= 100) { runaway(j); continue; }
    if (t.rage >= 80 && !ch.members[j]) {
      ch.members[j] = true; // 已排入這一串, 不重複
      ch.pending++;
      t.queue = { t: 0.35, ch: ch, step: step + 1 };
    }
  }
}
function newChain() {
  var ch = { count: 0, pending: 0, members: {}, ended: false };
  return ch;
}
function runaway(i) {
  var m = S.mons[i];
  if (m.queue) { var ch = m.queue.ch; m.queue = null; ch.pending--; chainCheckEnd(ch); }
  m.rage = 100;
  m.mode = 'charge';
  m.runT = 0;
  m.side = (i === 5 || i === 0 || i === 1) ? -1 : 1; // -1 上, 1 下
  m.tgtX = Math.max(110, Math.min(610, m.x));
  m.perfT = 0;
  m.runDir = 1;
}
function returnHome(i, rage) {
  var m = S.mons[i];
  m.mode = 'stand';
  m.rage = rage;
  m.x = PED[i][0]; m.y = PED[i][1];
  m.runT = 0;
  m.dir = PED[i][0] < 360 ? 1 : -1;
}
function showClick() {
  var i = S.cursor, m = S.mons[i];
  if (!m) { addFloat(PED[i][0], PED[i][1] - 70, '還不夠氣', 'hint', false); return; }
  if (m.mode !== 'stand') return;
  if (m.rage < 40) { addFloat(PED[i][0], PED[i][1] - 70, '還不夠氣', 'hint', false); return; }
  var ch = newChain();
  perform(i, ch, 0);
  chainCheckEnd(ch);
}
function showFeed() {
  var i = S.cursor, m = S.mons[i];
  if (!m || G.snacks <= 0) return;
  G.snacks--;
  if (m.mode === 'stand') { m.rage = Math.max(0, m.rage - 40); m.fx = 'fed'; m.fxT = 0.5; }
  else { returnHome(i, 30); m.fx = 'fed'; m.fxT = 0.5; }
}
function visitorAttack(m) {
  var base = m.side < 0 ? 0 : 6, best = -1, bd = 1e9;
  for (var s = 0; s < 6; s++) {
    var v = S.visitors[base + s];
    if (v.mode !== 'watch') continue;
    var d = Math.abs(SEAT_X[s] - m.x);
    if (d < bd) { bd = d; best = base + s; }
  }
  if (best < 0 || bd > 110) return;
  var vv = S.visitors[best];
  vv.mode = 'scared'; vv.t = 0;
  addRep(-3);
  addFloat(SEAT_X[best - base], m.side < 0 ? SEAT_Y_UP : SEAT_Y_DOWN, '名聲 -3', 'repDown', false);
}
function updateShow(dt) {
  S.time -= dt;
  var i;
  for (i = 0; i < 6; i++) {
    var m = S.mons[i];
    if (!m) continue;
    if (m.fxT > 0) { m.fxT -= dt; if (m.fxT <= 0) m.fx = 'none'; }
    if (m.perfT > 0) m.perfT = Math.max(0, m.perfT - dt);
    if (m.mode === 'stand') {
      m.rage = Math.min(100, m.rage + RAGE_RATE[m.species] * dt);
      if (m.rage >= 100) { runaway(i); continue; }
      if (m.queue) {
        m.queue.t -= dt;
        if (m.queue.t <= 0) {
          var q = m.queue; m.queue = null;
          perform(i, q.ch, q.step);
          q.ch.pending--;
          chainCheckEnd(q.ch);
        }
      }
    } else {
      m.runT += dt;
      var rowY = m.side < 0 ? SEAT_Y_UP : SEAT_Y_DOWN;
      if (m.mode === 'charge') {
        var dx = m.tgtX - m.x, dy = rowY - m.y, d = Math.sqrt(dx * dx + dy * dy), st = 200 * dt;
        if (d <= st) { m.x = m.tgtX; m.y = rowY; m.mode = 'loose'; m.atkT = 1.5; }
        else { m.x += dx / d * st; m.y += dy / d * st; }
        if (dx) m.dir = dx < 0 ? -1 : 1;
      } else {
        m.x += m.runDir * 140 * dt;
        if (m.x >= 610) { m.x = 610; m.runDir = -1; }
        if (m.x <= 110) { m.x = 110; m.runDir = 1; }
        m.dir = m.runDir;
        m.atkT -= dt;
        if (m.atkT <= 0) { m.atkT += 1.5; visitorAttack(m); }
      }
      if (m.runT >= 8) returnHome(i, 0);
    }
  }
  // 觀眾
  for (i = 0; i < 12; i++) {
    var v = S.visitors[i];
    if (v.mode === 'watch') continue;
    v.t += dt;
    if (v.t >= 4) { v.mode = 'watch'; v.t = 0; }
    else if (v.t >= 0.8) v.mode = 'empty';
  }
  // 技能視覺
  for (i = 0; i < S.haz.length; i++) {
    var h = S.haz[i];
    h.t += dt;
    if (h.quake) h.radius = 500 * Math.min(1, h.t / 0.8);
    if (h.flight) {
      var p = Math.min(1, h.t / 0.5);
      h.x = h.sx + (h.tx - h.sx) * p; h.y = h.sy + (h.ty - h.sy) * p;
    }
  }
  S.haz = S.haz.filter(function (h) { return h.t < h.life; });
  if (S.banner) { S.banner.t += dt; if (S.banner.t > 1.6) S.banner = null; }

  if (S.time <= 0) endShow();
}
function endShow() {
  for (var i = 0; i < 6; i++) {
    var m = S.mons[i];
    if (m && m.mode !== 'stand') addRep(-5);
  }
  floats = [];
  S = null;
  if (G.day >= DAYS) phase = 'result';
  else { shopCursor = 0; phase = 'shop'; }
}
function anyLoose() {
  for (var i = 0; i < 6; i++) if (S.mons[i] && S.mons[i].mode !== 'stand') return true;
  return false;
}

// ============ 商店 ============
function shopPress() {
  if (shopCursor === 4) {
    G.day++;
    setTitle('dungeon');
    return;
  }
  var key = SHOP_ITEMS[shopCursor], it = G.shop[key];
  if (G.gold < it.cost) return;
  G.gold -= it.cost;
  it.level++;
  it.cost = Math.round(it.cost * 1.5);
  if (key === 'heavyShield') G.counter += 1;
  else if (key === 'ropeBag') G.ropeMax += 1;
  else if (key === 'armor') G.maxHearts += 1;
  else G.snacks += 2;
}

// ============ 說明頁 ============
var GUIDE = [
  { title: '彈反', text: '打到的那一刻按空白鍵' },
  { title: '收服', text: '殘血時再彈一次就收服' },
  { title: '點名表演', text: '←→ 選牠, 空白鍵表演' },
  { title: '拿捏', text: '越氣越賺, 滿了就失控' },
  { title: '點心', text: '↓ 餵點心, 馬上消氣' }
];
var GUIDE_FRAME = { x: 40, y: 300, w: 640, h: 660 };
function openGuide() {
  if (phase === 'guide') return;
  guideBack = phase; guidePage = 0; phase = 'guide';
}
function closeGuide() { phase = guideBack; }

// ============ 輸入(只有鍵盤) ============
function keyName(e) {
  var k = e.key;
  if (k === ' ' || k === 'Spacebar' || e.code === 'Space') return 'space';
  if (k === 'ArrowLeft') return 'left';
  if (k === 'ArrowRight') return 'right';
  if (k === 'ArrowUp') return 'up';
  if (k === 'ArrowDown') return 'down';
  if (k === 'h' || k === 'H') return 'help';
  return null;
}
window.addEventListener('keydown', function (e) {
  var k = keyName(e);
  if (!k) return;
  e.preventDefault();
  if (e.repeat) return;
  if (keys.hasOwnProperty(k)) keys[k] = true;
  if (k === 'help') { if (phase !== 'guide' && phase !== 'result') openGuide(); else if (phase === 'guide') closeGuide(); return; }
  if (phase === 'guide') {
    if (k === 'space') {
      if (guidePage < GUIDE.length - 1) guidePage++; else closeGuide();
    } else if (k === 'left') { if (guidePage > 0) guidePage--; }
    return;
  }
  if (phase === 'title') {
    if (k === 'space') {
      if (titleStage === 'dungeon') startDay(); else startShow();
    }
  } else if (phase === 'dungeon') {
    if (k === 'space') pressGuard();
  } else if (phase === 'prep') {
    if (k === 'left') prep.cursor = (prep.cursor + 6) % 7;
    else if (k === 'right') prep.cursor = (prep.cursor + 1) % 7;
    else if (k === 'space') prepPress();
  } else if (phase === 'show') {
    if (k === 'left') S.cursor = (S.cursor + 5) % 6;
    else if (k === 'right') S.cursor = (S.cursor + 1) % 6;
    else if (k === 'space') showClick();
    else if (k === 'down') showFeed();
  } else if (phase === 'shop') {
    if (k === 'up') shopCursor = (shopCursor + 4) % 5;
    else if (k === 'down') shopCursor = (shopCursor + 1) % 5;
    else if (k === 'space') shopPress();
  } else if (phase === 'result') {
    if (k === 'space') { newGame(); setTitle('dungeon'); }
  }
});
window.addEventListener('keyup', function (e) {
  var k = keyName(e);
  if (!k) return;
  e.preventDefault();
  if (keys.hasOwnProperty(k)) keys[k] = false;
});
window.addEventListener('blur', function () {
  keys.left = keys.right = keys.up = keys.down = false;
});

// ============ 繪製 ============
var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';
function txt(s, x, y, size, color, align) {
  ctx.font = 'bold ' + size + 'px ' + FONT;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, size / 6);
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.strokeText(s, x, y);
  ctx.fillStyle = color || '#fff';
  ctx.fillText(s, x, y);
}
function hudState() {
  var left = 0, msg = '';
  if (phase === 'dungeon' && T) left = Math.max(0, T.time);
  if (phase === 'show' && S) {
    left = Math.max(0, S.time);
    if (anyLoose()) msg = '選牠的台座按 ↓ 餵點心叫回';
  }
  return {
    phase: phase, day: G.day, gold: G.gold, rep: G.rep,
    hearts: G.hearts, maxHearts: G.maxHearts, ropes: G.ropes, ropeMax: G.ropeMax,
    snacks: G.snacks, roster: rosterSpecies(), timeLeft: left, message: msg
  };
}
function drawFloats(camY) {
  for (var i = 0; i < floats.length; i++) {
    var f = floats[i];
    var y = f.world ? f.y - camY + HUD_H : f.y;
    Art.drawFloatText(ctx, { x: f.x, y: y, text: f.text, kind: f.kind, t: f.t });
  }
}
function drawDungeon() {
  var camY = T.camY;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, HUD_H, W, VIEW_H); ctx.clip();
  var r0 = Math.max(0, Math.floor(camY / TILE)), r1 = Math.min(ROWS - 1, Math.floor((camY + VIEW_H) / TILE));
  for (var r = r0; r <= r1; r++) for (var c = 0; c < COLS; c++) {
    Art.drawTile(ctx, { x: c * TILE + 30, y: r * TILE + 30 - camY + HUD_H, kind: KIND[r][c],
      zone: zoneOf(c, r), nest: nestAt(c, r) });
  }
  var i;
  for (i = 0; i < T.hazards.length; i++) {
    var h = T.hazards[i];
    Art.drawHazard(ctx, { x: h.x, y: h.y - camY + HUD_H, kind: h.kind, phase: h.phase, radius: h.radius,
      t: h.t, angle: h.angle, tx: 0, ty: 0 });
  }
  for (i = 0; i < T.mons.length; i++) {
    var m = T.mons[i];
    Art.drawWildMonster(ctx, { x: m.x, y: m.y - camY + HUD_H, species: m.species, hp: m.hp, maxHp: m.maxHp,
      hit: m.hitT > 0, weak: m.hp <= m.maxHp * WEAK_RATIO, casting: m.castT > 0, dir: m.dir });
  }
  Art.drawTamer(ctx, { x: T.x, y: T.y - camY + HUD_H, dir: T.dir, guarding: T.guardT > 0,
    shieldReady: T.shieldCd <= 0, blink: T.invuln > 0 && (Math.floor(T.invuln * 10) % 2 === 0) });
  for (i = 0; i < T.flashes.length; i++) {
    var f = T.flashes[i];
    Art.drawParryFlash(ctx, { x: f.x, y: f.y - camY + HUD_H, tx: f.tx, ty: f.ty - camY + HUD_H, result: f.result, t: f.t });
  }
  drawFloats(camY);
  ctx.restore();
}
function drawPeds(stage) {
  for (var i = 0; i < 6; i++) {
    var occ, held = false;
    if (stage === 'prep') {
      held = prep.held === i;
      occ = !!G.roster[i] && !held;
    } else {
      occ = !!S.mons[i] && S.mons[i].mode === 'stand';
    }
    Art.drawPedestal(ctx, { x: PED[i][0], y: PED[i][1], index: i, occupied: occ,
      selected: stage === 'prep' ? prep.cursor === i : S.cursor === i, heldFrom: held });
  }
}
function drawVisitors() {
  for (var s = 0; s < 12; s++) {
    var row = s < 6 ? SEAT_Y_UP : SEAT_Y_DOWN;
    Art.drawVisitor(ctx, { x: SEAT_X[s % 6], y: row, seat: s, mode: S.visitors[s].mode });
  }
}
function drawPrep() {
  Art.drawShowArena(ctx, { stage: 'prep' });
  drawPeds('prep');
  for (var i = 0; i < 6; i++) {
    var r = G.roster[i];
    if (!r || prep.held === i) continue;
    Art.drawShowMonster(ctx, { x: PED[i][0], y: PED[i][1], species: r.species, rage: 0, mode: 'stand',
      performing: false, fx: 'none', chainStep: 0, dir: PED[i][0] < 360 ? 1 : -1 });
  }
  if (prep.held >= 0) {
    var hx, hy;
    if (prep.cursor < 6) { hx = PED[prep.cursor][0]; hy = PED[prep.cursor][1] - 90; }
    else { hx = 360; hy = 1090; }
    Art.drawShowMonster(ctx, { x: hx, y: hy, species: G.roster[prep.held].species, rage: 0, mode: 'held',
      performing: false, fx: 'none', chainStep: 0, dir: 1 });
  }
  Art.drawButton(ctx, { x: BTN_PREP.x, y: BTN_PREP.y, w: BTN_PREP.w, h: BTN_PREP.h, label: '開演', selected: prep.cursor === 6 });
  txt('←→ 選擇  空白 拿起 / 放下', 360, 1268, 26, '#fff');
}
function drawShow() {
  Art.drawShowArena(ctx, { stage: 'show' });
  drawVisitors();
  drawPeds('show');
  var i, m;
  for (i = 0; i < 6; i++) {
    m = S.mons[i];
    if (!m || m.mode !== 'stand') continue;
    Art.drawShowMonster(ctx, { x: m.x, y: m.y, species: m.species, rage: m.rage, mode: 'stand',
      performing: m.perfT > 0, fx: m.fx, chainStep: m.chainStep, dir: m.dir });
  }
  for (i = 0; i < S.haz.length; i++) {
    var h = S.haz[i];
    Art.drawHazard(ctx, { x: h.x, y: h.y, kind: h.kind, phase: h.phase, radius: h.radius, t: h.t,
      angle: h.angle, tx: h.tx || 0, ty: h.ty || 0 });
  }
  for (i = 0; i < 6; i++) {
    m = S.mons[i];
    if (!m || m.mode === 'stand') continue;
    Art.drawShowMonster(ctx, { x: m.x, y: m.y, species: m.species, rage: m.rage, mode: m.mode,
      performing: false, fx: m.fx, chainStep: 0, dir: m.dir });
  }
  if (S.banner) Art.drawChainBanner(ctx, { count: S.banner.count, t: S.banner.t });
  drawFloats(0);
}
function drawShop() {
  for (var i = 0; i < 4; i++) {
    var key = SHOP_ITEMS[i], it = G.shop[key];
    Art.drawShopItem(ctx, { x: 360, y: SHOP_Y[i], item: key, level: it.level, cost: it.cost,
      affordable: G.gold >= it.cost, selected: shopCursor === i });
  }
  Art.drawButton(ctx, { x: BTN_SHOP.x, y: BTN_SHOP.y, w: BTN_SHOP.w, h: BTN_SHOP.h, label: '出發', selected: shopCursor === 4 });
  txt('↑↓ 選擇  空白 確定', 360, 1268, 26, '#fff');
}
function drawGuide() {
  var p = GUIDE[guidePage];
  txt(p.title, 360, 175, 56, '#ffd84a');
  txt(p.text, 360, 250, 36, '#fff');
  Art.drawGuidePage(ctx, { page: guidePage + 1, x: GUIDE_FRAME.x, y: GUIDE_FRAME.y, w: GUIDE_FRAME.w, h: GUIDE_FRAME.h });
  if (guidePage === GUIDE.length - 1) txt('地下城 → 排位 → 表演 → 商店, 三天後評星', 360, 995, 26, '#ddd');
  txt((guidePage + 1) + ' / ' + GUIDE.length, 360, 1060, 30, '#fff');
  txt(guidePage > 0 ? '← 上一頁' : '', 120, 1120, 26, '#ccc', 'center');
  txt(guidePage < GUIDE.length - 1 ? '空白鍵 下一頁' : '空白鍵 開始遊戲', 450, 1120, 26, '#ccc', 'center');
  txt(guidePage < GUIDE.length - 1 ? '按空白鍵繼續' : '按空白鍵開始', 360, 1190, 24, '#aaa');
}
function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  Art.drawBackground(ctx, {});
  if (phase === 'guide') {
    Art.drawHud(ctx, hudState());
    drawGuide();
    return;
  }
  if (phase === 'dungeon') drawDungeon();
  else if (phase === 'prep') drawPrep();
  else if (phase === 'show') drawShow();
  else if (phase === 'shop') drawShop();
  Art.drawHud(ctx, hudState());
  if (phase === 'title') {
    Art.drawTitleCard(ctx, { day: G.day, stage: titleStage });
    txt('按空白鍵開始', 360, 1000, 40, '#fff');
  } else if (phase === 'result') {
    Art.drawResultPanel(ctx, { rep: G.rep, goldEarned: G.goldEarned, roster: rosterSpecies(),
      bestChain: G.bestChain, stars: G.rep >= 260 ? 3 : G.rep >= 150 ? 2 : G.rep >= 60 ? 1 : 0 });
    txt('按空白鍵重來', 360, 1200, 36, '#fff');
  }
  if (phase !== 'dungeon' && phase !== 'show') txt('H 說明', 700, 1268, 18, '#aaa', 'right');
}

// ============ 主迴圈 ============
function update(dt) {
  for (var i = 0; i < floats.length; i++) floats[i].t += dt;
  floats = floats.filter(function (f) { return f.t < 1.2; });
  if (phase === 'dungeon') updateDungeon(dt);
  else if (phase === 'show') updateShow(dt);
}
var last = 0;
function frame(ts) {
  var dt = last ? (ts - last) / 1000 : 0;
  last = ts;
  if (dt > 1 / 30) dt = 1 / 30;
  try {
    update(dt);
    render();
  } catch (err) {
    console.error(err);
  }
  requestAnimationFrame(frame);
}

newGame();
setTitle('dungeon');
phase = 'guide'; guideBack = 'title'; guidePage = 0;
requestAnimationFrame(frame);
})();
