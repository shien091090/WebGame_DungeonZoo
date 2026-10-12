/* 紅線連擊秀 — 玩法驗證 Demo。邏輯與繪製分離: 每幀先 update 再 render(只呼叫 Art.drawXxx)。 */
(function () {
'use strict';

var CW = Art.canvas.width, CH = Art.canvas.height;
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');

/* ---------- 常數 ---------- */
var TS = 60, COLS = 12, ROWS = 30;
var MAPSTR = [
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
var NESTCH = { t: 'thunder', g: 'stone', f: 'fire', j: 'water' };
var ROOMS = {
  thunder: { x0: 60, x1: 660, y0: 60, y1: 360, cx: 360, cy: 210 },
  stone:   { x0: 60, x1: 660, y0: 420, y1: 720, cx: 360, cy: 570 },
  fire:    { x0: 60, x1: 660, y0: 780, y1: 1080, cx: 360, cy: 930 },
  water:   { x0: 60, x1: 660, y0: 1140, y1: 1440, cx: 360, cy: 1290 }
};
var SP = {
  fire:    { hp: 10, cast: 2.4, gold: 5, rep: 1, whip: 25, decay: 4 },
  water:   { hp: 7,  cast: 1.6, gold: 3, rep: 1, whip: 20, decay: 6 },
  thunder: { hp: 12, cast: 2.6, gold: 7, rep: 2, whip: 40, decay: 8 },
  stone:   { hp: 16, cast: 3.0, gold: 4, rep: 1, whip: 12, decay: 1 }
};
var SPECIES = ['fire', 'water', 'thunder', 'stone'];
var ITEMS = ['whipPower', 'ropeBag', 'armor', 'silverWhistle'];
var ITEM_BASE = { whipPower: 50, ropeBag: 40, armor: 40, silverWhistle: 50 };
var SHOP_Y = [300, 460, 620, 780];
var DAYS = 3;
var DIRV = [];
(function () {
  var r = Math.SQRT1_2;
  DIRV = [{ x: 0, y: -1 }, { x: r, y: -r }, { x: 1, y: 0 }, { x: r, y: r }, { x: 0, y: 1 }, { x: -r, y: r }, { x: -1, y: 0 }, { x: -r, y: -r }];
})();
var MR = 30;            // 魔物受擊半徑
var TR = 18;            // 馴獸師半徑
var FIELD = { x0: 60, x1: 660, y0: 270, y1: 1000 };
var SEAT_X = [110, 210, 310, 410, 510, 610];
var GUIDE = [
  { title: '地下城', text: '方向鍵走, Z 揮鞭, X 翻滾, C 彈反' },
  { title: '收服', text: '殘血時揮鞭套住, 繞牠一圈' },
  { title: '表演', text: 'Z 讓牠生氣, X 讓牠冷靜' },
  { title: '紅線', text: '紅線連著演越賺, 一失控就歸零' }
];
var FONT = '"Microsoft JhengHei", "PingFang TC", sans-serif';

/* ---------- 地圖資料 ---------- */
var KIND = [];      // KIND[r][c]
var NESTS = [];
(function () {
  for (var r = 0; r < ROWS; r++) {
    KIND[r] = [];
    for (var c = 0; c < COLS; c++) {
      var ch = MAPSTR[r].charAt(c), k = 'floor';
      if (ch === '#') k = 'wall'; else if (ch === 'o') k = 'pillar'; else if (ch === 'L') k = 'lava'; else if (ch === 'W') k = 'water';
      KIND[r][c] = k;
      if (NESTCH[ch]) NESTS.push({ c: c, r: r, sp: NESTCH[ch], x: c * TS + 30, y: r * TS + 30, mon: null, timer: 0 });
    }
  }
})();
function zoneOf(c, r) {
  if (c >= 1 && c <= 10) {
    if (r >= 1 && r <= 5) return 'crag';
    if (r >= 7 && r <= 11) return 'ruins';
    if (r >= 13 && r <= 17) return 'lava';
    if (r >= 19 && r <= 23) return 'pond';
  }
  return 'hall';
}
function isNestTile(c, r) { for (var i = 0; i < NESTS.length; i++) if (NESTS[i].c === c && NESTS[i].r === r) return true; return false; }
function tileKind(c, r) { if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return 'wall'; return KIND[r][c]; }
function solid(k) { return k === 'wall' || k === 'pillar'; }
function blocked(x, y, rad) {
  var c0 = Math.floor((x - rad) / TS), c1 = Math.floor((x + rad) / TS), r0 = Math.floor((y - rad) / TS), r1 = Math.floor((y + rad) / TS);
  for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
    if (!solid(tileKind(c, r))) continue;
    var px = Math.max(c * TS, Math.min(x, c * TS + TS)), py = Math.max(r * TS, Math.min(y, r * TS + TS));
    var dx = x - px, dy = y - py;
    if (dx * dx + dy * dy < rad * rad) return true;
  }
  return false;
}
function moveCircle(o, dx, dy, rad) {
  var n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 6));
  var sx = dx / n, sy = dy / n, hx = false, hy = false;
  for (var i = 0; i < n; i++) {
    if (sx !== 0) { if (!blocked(o.x + sx, o.y, rad)) o.x += sx; else hx = true; }
    if (sy !== 0) { if (!blocked(o.x, o.y + sy, rad)) o.y += sy; else hy = true; }
  }
  return { hx: hx, hy: hy };
}

/* ---------- 小工具 ---------- */
function rnd(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
function dirIndex(dx, dy) {
  if (dx === 0 && dy < 0) return 0; if (dx > 0 && dy < 0) return 1; if (dx > 0 && dy === 0) return 2; if (dx > 0 && dy > 0) return 3;
  if (dx === 0 && dy > 0) return 4; if (dx < 0 && dy > 0) return 5; if (dx < 0 && dy === 0) return 6; if (dx < 0 && dy < 0) return 7;
  return -1;
}
function normAng(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }

/* ---------- 遊戲狀態 ---------- */
var G, T, D, S;     // G 全局; T 馴獸師; D 地下城; S 表演場
var floats = [], effects = [], hazards = [], casts = [];
var held = {}, queue = [];
var guide = { open: true, page: 0, first: true };
var view = { oy: 0 };

function newGame() {
  G = {
    phase: 'title', stage: 'dungeon', sub: 'play', endT: 0,
    day: 1, gold: 0, goldEarned: 0, rep: 0, bestCombo: 0,
    roster: [{ species: 'fire', mastery: 0 }],
    up: { whipPower: 0, ropeBag: 0, armor: 0, silverWhistle: 0 },
    cost: { whipPower: 50, ropeBag: 40, armor: 40, silverWhistle: 50 },
    shopSel: 0
  };
  T = { x: 330, y: 1650, facing: 0, rollT: 0, rollCd: 0, rollDir: 0, whipCd: 0, parryT: 0, parryCd: 0, stunT: 0, invulnT: 0, hearts: 5, whistleCd: 0 };
  D = null; S = null;
  clearWorld();
  enterTitle('dungeon');
}
function whipPower() { return 2 + G.up.whipPower; }
function ropeMax() { return 3 + G.up.ropeBag; }
function maxHearts() { return 5 + G.up.armor; }
function whistleCdMax() { return Math.max(0.8, 2 - 0.4 * G.up.silverWhistle); }
function clearWorld() { floats = []; effects = []; hazards = []; casts = []; queue = []; }
function enterTitle(stage) { G.phase = 'title'; G.stage = stage; queue = []; }
function addFloat(x, y, text, kind, dur) { floats.push({ x: x, y: y, text: text, kind: kind, t: 0, dur: dur || 1 }); }
function addGold(n) { G.gold += n; G.goldEarned += n; }
function addRep(n) { G.rep = Math.max(0, G.rep + n); }

/* ---------- 輸入(只有鍵盤) ---------- */
var KEYS = { ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, KeyZ: 1, KeyX: 1, KeyC: 1, KeyH: 1 };
document.addEventListener('keydown', function (e) {
  if (!KEYS[e.code]) return;
  e.preventDefault();
  if (e.repeat) return;
  onPress(e.code);
});
document.addEventListener('keyup', function (e) {
  if (!KEYS[e.code]) return;
  e.preventDefault();
  delete held[e.code];
});
window.addEventListener('blur', function () { held = {}; });

function openGuide() { guide.open = true; guide.page = 0; guide.first = false; held = {}; queue = []; }
function onPress(code) {
  if (guide.open) {
    if (code === 'KeyZ' || code === 'ArrowRight') {
      if (guide.page < GUIDE.length - 1) guide.page++;
      else if (code === 'KeyZ') { guide.open = false; queue = []; held = {}; }
    } else if (code === 'ArrowLeft') { if (guide.page > 0) guide.page--; }
    else if (code === 'KeyH') { guide.open = false; queue = []; held = {}; }
    return;
  }
  if (code.charAt(0) === 'A') held[code] = true;
  if (code === 'KeyH') { if (G.phase !== 'result') openGuide(); return; }
  if (G.phase === 'title') {
    if (code === 'KeyZ') { if (G.stage === 'dungeon') startDungeon(); else startShow(); queue = []; }
    return;
  }
  if (G.phase === 'shop') {
    if (code === 'ArrowUp') G.shopSel = Math.max(0, G.shopSel - 1);
    else if (code === 'ArrowDown') G.shopSel = Math.min(4, G.shopSel + 1);
    else if (code === 'KeyZ') shopConfirm();
    return;
  }
  if (G.phase === 'result') { if (code === 'KeyZ') { newGame(); } return; }
  if (G.phase === 'dungeon' || G.phase === 'show') {
    if (code.charAt(0) !== 'A' && G.sub === 'play') queue.push(code);
  }
}
function inputVec() {
  var dx = 0, dy = 0;
  if (held.ArrowLeft) dx -= 1; if (held.ArrowRight) dx += 1; if (held.ArrowUp) dy -= 1; if (held.ArrowDown) dy += 1;
  return { dx: dx, dy: dy };
}

/* ---------- 商店 / 流程 ---------- */
function itemMaxed(it) { return it === 'silverWhistle' && whistleCdMax() <= 0.8 + 1e-9; }
function shopConfirm() {
  if (G.shopSel === 4) { G.day++; enterTitle('dungeon'); return; }
  var it = ITEMS[G.shopSel], c = G.cost[it];
  if (itemMaxed(it) || G.gold < c) return;
  G.gold -= c; G.up[it]++; G.cost[it] = Math.round(c * 1.5);
}
function stars() { return G.rep >= 260 ? 3 : (G.rep >= 150 ? 2 : (G.rep >= 60 ? 1 : 0)); }

/* ---------- 地下城 ---------- */
function startDungeon() {
  clearWorld();
  G.phase = 'dungeon'; G.sub = 'play';
  T.x = 330; T.y = 1650; T.facing = 0; T.rollT = 0; T.rollCd = 0; T.whipCd = 0; T.parryT = 0; T.parryCd = 0; T.stunT = 0; T.invulnT = 0;
  T.hearts = maxHearts();
  D = { time: 60, ropes: ropeMax(), monsters: [], lasso: null, camY: 0 };
  for (var i = 0; i < NESTS.length; i++) { NESTS[i].mon = null; NESTS[i].timer = 0; spawnAtNest(NESTS[i]); }
  updateCam();
}
function spawnAtNest(n) {
  var hp = Math.round(SP[n.sp].hp * (1 + 0.5 * (G.day - 1)));
  var m = { sp: n.sp, x: n.x, y: n.y, hp: hp, maxHp: hp, hitT: 0, weak: false, vx: 0, vy: 0, dirT: 0, castCd: 0, castVis: 0, lassoed: false, dir: 1, dead: false, nest: n };
  m.castCd = rnd(0.5, 1) * SP[n.sp].cast;
  randomDir(m);
  n.mon = m; D.monsters.push(m);
}
function randomDir(m) {
  var a = rnd(0, Math.PI * 2);
  m.vx = Math.cos(a) * 60; m.vy = Math.sin(a) * 60; m.dirT = rnd(2, 3);
  if (Math.abs(m.vx) > 1) m.dir = m.vx > 0 ? 1 : -1;
}
function updateCam() { D.camY = clamp(T.y - 700, 0, 640); }
function killMon(m) {
  m.dead = true; m.nest.mon = null; m.nest.timer = 8;
  if (D.lasso && D.lasso.mon === m) breakLasso();
  addGold(4); addFloat(m.x, m.y - 30, '+4', 'gold');
}
function setWeak(m) { m.weak = m.hp <= m.maxHp * 0.3; }
function breakLasso() { if (D.lasso) { D.lasso.mon.lassoed = false; D.lasso = null; } }

function dungeonWhip() {
  T.whipCd = 0.35;
  effects.push({ type: 'whip', x: T.x, y: T.y, shape: 'arc', facing: T.facing, radius: 110, t: 0, dur: 0.25 });
  var fv = DIRV[T.facing], list = [];
  D.monsters.forEach(function (m) {
    if (m.dead) return;
    var dx = m.x - T.x, dy = m.y - T.y, d = Math.hypot(dx, dy);
    if (d > 110 + MR) return;
    if (d > 1e-6 && (dx * fv.x + dy * fv.y) / d < 0.5) return; // 120° 扇形
    list.push({ m: m, d: d });
  });
  list.sort(function (a, b) { return a.d - b.d; });
  list.forEach(function (o) {
    var m = o.m; if (m.dead) return;
    if (m.weak && D.ropes > 0 && !D.lasso) {
      m.lassoed = true;
      var a = Math.atan2(T.y - m.y, T.x - m.x);
      D.lasso = { mon: m, t: 0, sum: 0, last: a, progress: 0 };
      addFloat(m.x, m.y - 40, '套住!', 'combo');
    } else {
      m.hp -= whipPower(); m.hitT = 0.15; setWeak(m);
      if (m.hp <= 0) killMon(m);
    }
  });
}
function captureMon(m) {
  D.ropes--; breakLasso();
  m.dead = true; m.nest.mon = null; m.nest.timer = 8;
  addFloat(m.x, m.y - 30, '收服!', 'capture');
  var e = null;
  for (var i = 0; i < G.roster.length; i++) if (G.roster[i].species === m.sp) e = G.roster[i];
  if (!e) G.roster.push({ species: m.sp, mastery: 0 });
  else if (e.mastery < 3) { e.mastery++; addFloat(m.x, m.y - 65, '馴熟 +1', 'mastery'); }
  else { addGold(20); addFloat(m.x, m.y - 65, '+20', 'gold'); }
}

/* 技能: 地下城與表演場共用 */
function spawnSkill(sp, x, y, tx, ty, cast) {
  if (sp === 'fire') { hazards.push({ kind: 'firering', phase: 'warn', x: x, y: y, t: 0, dur: 0.5, radius: 120, angle: 0, cast: cast }); cast.n = 1; }
  else if (sp === 'thunder') { hazards.push({ kind: 'thunder', phase: 'warn', x: tx, y: ty, t: 0, dur: 0.8, radius: 70, angle: 0, cast: cast }); cast.n = 1; }
  else if (sp === 'stone') { hazards.push({ kind: 'quake', phase: 'active', x: x, y: y, t: 0, dur: 1, radius: 0, angle: 0, cast: cast }); cast.n = 1; }
  else if (sp === 'water') {
    var base = Math.atan2(ty - y, tx - x);
    for (var i = -1; i <= 1; i++) {
      var a = base + i * 20 * Math.PI / 180;
      hazards.push({ kind: 'waterball', phase: 'active', x: x, y: y, t: 0, dur: 0, radius: 12, angle: a, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, cast: cast });
    }
    cast.n = 3;
  }
}
function removeHz(h) {
  if (h.dead) return;
  h.dead = true;
  var c = h.cast;
  if (c) { c.n--; if (c.n <= 0 && c.show && !c.settled) settleCast(c); }
}
function settleCast(c) {
  if (c.settled) return; c.settled = true;
  var sp = SP[c.sp];
  var gold = Math.round(sp.gold * (1 + 0.5 * c.hits.length) * c.mult * (1 + G.rep / 100));
  addGold(gold); addRep(sp.rep);
  addFloat(c.x, c.y - 50, c.red ? '+' + gold + ' ×' + Number(c.mult.toFixed(1)) : '+' + gold, c.red ? 'redGold' : 'gold');
}

function inTamerShape(h) {
  var d = dist(h.x, h.y, T.x, T.y);
  if (h.kind === 'firering') return d <= h.radius + TR;
  if (h.kind === 'thunder') return d <= h.radius + TR;
  if (h.kind === 'quake') return Math.abs(d - h.radius) <= 15 + TR;
  if (h.kind === 'waterball') return d <= 12 + TR;
  return false;
}
function inMonShape(h, m) {
  var d = dist(h.x, h.y, m.x, m.y);
  if (h.kind === 'firering' || h.kind === 'thunder') return d <= h.radius + MR;
  if (h.kind === 'quake') return Math.abs(d - h.radius) <= 15 + MR;
  if (h.kind === 'waterball') return d <= 12 + MR;
  return false;
}
function hazardVsTamer(h) {
  var c = h.cast;
  if (!c || c.resolved) return;
  if (!inTamerShape(h)) return;
  if (T.rollT > 0 || T.invulnT > 0) return;
  c.resolved = true;
  if (T.parryT > 0) {
    effects.push({ type: 'parry', x: T.x, y: T.y, t: 0, dur: 0.25 });
    addFloat(T.x, T.y - 40, '彈反', 'parry');
    if (!c.show && c.caster && !c.caster.dead && c.caster.hp > 1) {
      c.caster.hp = Math.max(1, c.caster.hp - whipPower()); c.caster.hitT = 0.15; setWeak(c.caster);
    }
  } else damageTamer();
  if (h.kind === 'waterball') removeHz(h);
}
function damageTamer() {
  if (G.phase === 'dungeon') {
    T.hearts--; T.invulnT = 1; breakLasso();
  } else {
    T.stunT = 1.5; T.invulnT = 2; T.parryT = 0; addRep(-2);
    addFloat(T.x, T.y - 40, '名聲 -2', 'repDown');
  }
}
function hazardVsMons(h) {
  if (G.phase !== 'show' || !h.cast || !h.cast.show) return;
  var c = h.cast;
  S.mons.forEach(function (m) {
    if (m === c.mon || m.mode !== 'roam' || c.hits.indexOf(m) >= 0) return;
    if (!inMonShape(h, m)) return;
    c.hits.push(m);
    if (h.kind === 'waterball') { m.rage = clamp(m.rage - 20, 0, 100); m.fx = 'doused'; }
    else { m.rage = clamp(m.rage + 15, 0, 100); m.fx = 'ignited'; }
    m.fxT = 0;
  });
}
function updateHazards(dt) {
  for (var i = 0; i < hazards.length; i++) {
    var h = hazards[i]; if (h.dead) continue;
    if (h.kind === 'waterball') {
      h.x += h.vx * dt; h.y += h.vy * dt;
      if (G.phase === 'dungeon') { if (solid(tileKind(Math.floor(h.x / TS), Math.floor(h.y / TS)))) { removeHz(h); continue; } }
      else if (h.x < FIELD.x0 - 40 || h.x > FIELD.x1 + 40 || h.y < FIELD.y0 - 40 || h.y > FIELD.y1 + 40) { removeHz(h); continue; }
      hazardVsTamer(h); if (h.dead) continue;
      hazardVsMons(h);
      continue;
    }
    h.t += dt;
    if (h.kind === 'firering') {
      if (h.phase === 'warn') { if (h.t >= h.dur) { h.phase = 'active'; h.t = 0; h.dur = 0.5; } }
      if (h.phase === 'active') { hazardVsTamer(h); hazardVsMons(h); if (h.t >= h.dur) removeHz(h); }
    } else if (h.kind === 'thunder') {
      if (h.phase === 'warn') {
        if (h.t >= h.dur) { h.phase = 'active'; h.t = 0; h.dur = 0.2; hazardVsTamer(h); hazardVsMons(h); }
      } else if (h.t >= h.dur) removeHz(h);
    } else if (h.kind === 'quake') {
      h.radius = 220 * Math.min(1, h.t / h.dur);
      hazardVsTamer(h); hazardVsMons(h);
      if (h.t >= h.dur) removeHz(h);
    }
  }
  hazards = hazards.filter(function (h) { return !h.dead; });
}

function tamerMoveCommon(dt, rad, speedMul, solidWorld) {
  // 回傳是否有移動
  var v = inputVec();
  if (T.rollT > 0) {
    var dv = DIRV[T.rollDir];
    var step = 800 * dt;
    if (solidWorld) moveCircle(T, dv.x * step, dv.y * step, rad);
    return;
  }
  if (v.dx === 0 && v.dy === 0) return;
  var idx = dirIndex(v.dx, v.dy); T.facing = idx;
  var l = Math.hypot(v.dx, v.dy), sp = 320 * speedMul * dt;
  if (solidWorld) moveCircle(T, v.dx / l * sp, v.dy / l * sp, rad);
  else { T.x += v.dx / l * sp; T.y += v.dy / l * sp; }
}
function tickTamerTimers(dt) {
  T.rollCd = Math.max(0, T.rollCd - dt); T.whipCd = Math.max(0, T.whipCd - dt); T.parryCd = Math.max(0, T.parryCd - dt);
  T.parryT = Math.max(0, T.parryT - dt); T.stunT = Math.max(0, T.stunT - dt); T.invulnT = Math.max(0, T.invulnT - dt);
  T.whistleCd = Math.max(0, T.whistleCd - dt); T.rollT = Math.max(0, T.rollT - dt);
}
function tickFx(dt) {
  floats.forEach(function (f) { f.t += dt; });
  floats = floats.filter(function (f) { return f.t < f.dur; });
  effects.forEach(function (e) { e.t += dt; });
  effects = effects.filter(function (e) { return e.t < e.dur; });
}

function updateDungeon(dt) {
  if (G.sub === 'ending') {
    G.endT -= dt; tickFx(dt);
    if (G.endT <= 0) { clearWorld(); enterTitle('show'); }
    return;
  }
  D.time = Math.max(0, D.time - dt);
  tickTamerTimers(dt);
  // 操作
  var acts = queue; queue = [];
  acts.forEach(function (a) {
    if (a === 'KeyZ') { if (T.whipCd <= 0 && T.rollT <= 0 && !D.lasso) dungeonWhip(); }
    else if (a === 'KeyX') { if (T.rollCd <= 0 && T.rollT <= 0) { T.rollT = 0.25; T.rollCd = 0.8; T.rollDir = T.facing; } }
    else if (a === 'KeyC') { if (T.parryCd <= 0) { T.parryT = 0.2; T.parryCd = 0.6; } }
  });
  // 移動(水上減半)
  var onWater = tileKind(Math.floor(T.x / TS), Math.floor(T.y / TS)) === 'water';
  tamerMoveCommon(dt, TR, onWater ? 0.5 : 1, true);
  // 熔岩
  if (tileKind(Math.floor(T.x / TS), Math.floor(T.y / TS)) === 'lava' && T.rollT <= 0 && T.invulnT <= 0) {
    T.hearts--; T.invulnT = 1; breakLasso();
  }
  // 魔物
  D.monsters.forEach(function (m) { updateWild(m, dt); });
  D.monsters = D.monsters.filter(function (m) { return !m.dead; });
  updateHazards(dt);
  // 套索
  if (D.lasso) updateLasso(dt);
  // 巢穴再生
  NESTS.forEach(function (n) {
    if (!n.mon) { n.timer -= dt; if (n.timer <= 0) spawnAtNest(n); }
  });
  tickFx(dt);
  updateCam();
  if (T.hearts <= 0 || D.time <= 0) { breakLasso(); G.sub = 'ending'; G.endT = 0.8; }
}
function updateWild(m, dt) {
  m.hitT = Math.max(0, m.hitT - dt); m.castVis = Math.max(0, m.castVis - dt);
  var room = ROOMS[m.sp];
  if (m.lassoed) {
    var dx = room.cx - m.x, dy = room.cy - m.y, d = Math.hypot(dx, dy);
    if (d > 3) { var st = Math.min(d, 40 * dt); moveCircle(m, dx / d * st, dy / d * st, 26); }
  } else {
    var r = moveCircle(m, m.vx * dt, m.vy * dt, 26);
    var hx = r.hx, hy = r.hy;
    if (m.x < room.x0 + 26) { m.x = room.x0 + 26; hx = true; } if (m.x > room.x1 - 26) { m.x = room.x1 - 26; hx = true; }
    if (m.y < room.y0 + 26) { m.y = room.y0 + 26; hy = true; } if (m.y > room.y1 - 26) { m.y = room.y1 - 26; hy = true; }
    if (hx) m.vx = -m.vx; if (hy) m.vy = -m.vy;
    if (Math.abs(m.vx) > 1) m.dir = m.vx > 0 ? 1 : -1;
    m.dirT -= dt;
    if (m.dirT <= 0) randomDir(m);
  }
  if (dist(m.x, m.y, T.x, T.y) < 400) {
    m.castCd -= dt;
    if (m.castCd <= 0) {
      var cast = { show: false, caster: m, n: 0, resolved: false };
      spawnSkill(m.sp, m.x, m.y, T.x, T.y, cast);
      m.castVis = m.sp === 'fire' ? 0.5 : (m.sp === 'thunder' ? 0.8 : 0.3);
      m.castCd = SP[m.sp].cast * (m.weak ? 1.5 : 1);
    }
  }
}
function updateLasso(dt) {
  var L = D.lasso, m = L.mon;
  L.t += dt;
  var a = Math.atan2(T.y - m.y, T.x - m.x);
  L.sum += normAng(a - L.last); L.last = a;
  L.progress = Math.abs(L.sum) / (2 * Math.PI);
  var len = dist(T.x, T.y, m.x, m.y);
  if (L.progress >= 1) { captureMon(m); return; }
  if (L.t >= 5 || len > 220) breakLasso();
}

/* ---------- 表演場 ---------- */
function startShow() {
  clearWorld();
  G.phase = 'show'; G.sub = 'play';
  T.x = 360; T.y = 635; T.facing = 0; T.rollT = 0; T.whipCd = 0; T.parryT = 0; T.parryCd = 0; T.stunT = 0; T.invulnT = 0; T.whistleCd = 0;
  S = { time: 50, mons: [], fences: [], visitors: [], combo: 0, comboLeft: 0, maxCombo: 0, broken: false, brokenT: 0 };
  for (var side = 0; side < 2; side++) for (var i = 0; i < 6; i++)
    S.fences.push({ x: SEAT_X[i], y: side === 0 ? 255 : 1010, side: side === 0 ? 'top' : 'bottom', broken: false });
  for (var s = 0; s < 12; s++)
    S.visitors.push({ x: SEAT_X[s % 6], y: s < 6 ? 190 : 1080, seat: s, mode: 'watch', timer: 0, side: s < 6 ? 'top' : 'bottom' });
  var placed = [];
  G.roster.forEach(function (e) {
    var x = 360, y = 635;
    for (var k = 0; k < 40; k++) {
      x = rnd(FIELD.x0 + 50, FIELD.x1 - 50); y = rnd(FIELD.y0 + 50, FIELD.y1 - 50);
      var ok = dist(x, y, T.x, T.y) > 130;
      placed.forEach(function (p) { if (dist(x, y, p.x, p.y) < 140) ok = false; });
      if (ok) break;
    }
    var m = { sp: e.species, mastery: e.mastery, x: x, y: y, vx: 0, vy: 0, dirT: 0, dir: 1, rage: 20, mode: 'roam', perfT: 0, perfTimer: 3,
      fx: 'none', fxT: 0, subdue: 0, chargeT: 0, fence: null, atkT: 1.5, runDir: 1 };
    randomDir(m); placed.push(m); S.mons.push(m);
  });
}
function redLow(m) { return 80 - 5 * m.mastery; }
function perfInterval(rage) { return 3 - 2 * (clamp(rage, 50, 99) - 50) / 49; }

function showWhip() {
  T.whipCd = 0.35;
  effects.push({ type: 'whip', x: T.x, y: T.y, shape: 'circle', facing: T.facing, radius: 110, t: 0, dur: 0.25 });
  S.mons.forEach(function (m) {
    if (m.mode !== 'roam') return;
    if (dist(m.x, m.y, T.x, T.y) <= 110 + MR) m.rage = clamp(m.rage + SP[m.sp].whip, 0, 100);
  });
}
function showWhistle() {
  T.whistleCd = whistleCdMax();
  effects.push({ type: 'whistle', x: T.x, y: T.y, radius: 140, t: 0, dur: 0.25 });
  S.mons.forEach(function (m) {
    if (dist(m.x, m.y, T.x, T.y) > 140 + MR) return;
    if (m.mode === 'roam') { m.rage = clamp(m.rage - 30, 0, 100); m.fx = 'calmed'; m.fxT = 0; }
    else { m.subdue++; if (m.subdue >= 3) recoverMon(m); }
  });
}
function recoverMon(m) {
  m.mode = 'roam'; m.x = 360; m.y = 635; m.rage = 30; m.subdue = 0; m.chargeT = 0; m.perfT = 0; m.perfTimer = 3;
  if (m.fence) { m.fence.broken = false; m.fence = null; }
  randomDir(m);
}
function goLoose(m) {
  m.mode = 'charge'; m.chargeT = 0; m.subdue = 0; m.perfT = 0; m.rage = 100;
  var top = m.y < 635, idx = clamp(Math.round((m.x - 110) / 100), 0, 5);
  m.fence = S.fences[(top ? 0 : 6) + idx];
  m.side = top ? 'top' : 'bottom';
  m.runDir = Math.random() < 0.5 ? -1 : 1; m.atkT = 1.5;
  S.combo = 0; S.comboLeft = 0; S.broken = true; S.brokenT = 0;
  addFloat(360, 640, '連擊中斷', 'comboBreak', 1.2);
}
function performShow(m) {
  var red = m.rage >= redLow(m) && m.rage < 100, mult = 1;
  if (red) {
    S.combo++; S.comboLeft = 4; S.broken = false;
    if (S.combo > S.maxCombo) S.maxCombo = S.combo;
    mult = Math.min(5, 2 + 0.2 * (S.combo - 1));
    addFloat(m.x, m.y - 70, '連擊 ' + S.combo, 'combo');
  }
  var cast = { show: true, mon: m, sp: m.sp, mult: mult, red: red, hits: [], n: 0, x: m.x, y: m.y, resolved: false, settled: false };
  casts.push(cast);
  spawnSkill(m.sp, m.x, m.y, T.x, T.y, cast);
  m.perfT = 0.5;
}
function updateShow(dt) {
  if (G.sub === 'ending') {
    G.endT -= dt; tickFx(dt);
    if (G.endT <= 0) {
      clearWorld();
      if (G.day >= DAYS) G.phase = 'result'; else { G.phase = 'shop'; G.shopSel = 0; }
    }
    return;
  }
  S.time = Math.max(0, S.time - dt);
  tickTamerTimers(dt);
  var acts = queue; queue = [];
  acts.forEach(function (a) {
    if (T.stunT > 0) return;
    if (a === 'KeyZ') { if (T.whipCd <= 0) showWhip(); }
    else if (a === 'KeyX') { if (T.whistleCd <= 0) showWhistle(); }
    else if (a === 'KeyC') { if (T.parryCd <= 0) { T.parryT = 0.2; T.parryCd = 0.6; } }
  });
  S.mons.forEach(function (m) { if (m.mode === 'roam' && m.rage >= 100) goLoose(m); });
  tamerMoveCommon(dt, TR, 1, false);
  T.x = clamp(T.x, FIELD.x0 + TR, FIELD.x1 - TR); T.y = clamp(T.y, FIELD.y0 + TR, FIELD.y1 - TR);
  S.mons.forEach(function (m) { updateShowMon(m, dt); });
  updateHazards(dt);
  S.mons.forEach(function (m) { if (m.mode === 'roam' && m.rage >= 100) goLoose(m); });
  // 連擊計時
  if (S.combo > 0) { S.comboLeft -= dt; if (S.comboLeft <= 0) { S.combo = 0; S.comboLeft = 0; addFloat(360, 1150, '連擊結束', 'combo'); } }
  if (S.broken) { S.brokenT += dt; if (S.brokenT >= 1.2) S.broken = false; }
  S.visitors.forEach(function (v) {
    if (v.mode === 'watch') return;
    v.timer -= dt;
    if (v.timer <= 0) v.mode = 'watch'; else if (v.timer < 3) v.mode = 'empty';
  });
  tickFx(dt);
  if (S.time <= 0) endShow();
}
function updateShowMon(m, dt) {
  if (m.fx !== 'none') { m.fxT += dt; if (m.fxT >= 0.5) m.fx = 'none'; }
  m.perfT = Math.max(0, m.perfT - dt);
  if (m.mode === 'roam') {
    m.rage = clamp(m.rage - SP[m.sp].decay * dt, 0, 100);
    m.x += m.vx * dt; m.y += m.vy * dt;
    var hx = false, hy = false;
    if (m.x < FIELD.x0 + 40) { m.x = FIELD.x0 + 40; hx = true; } if (m.x > FIELD.x1 - 40) { m.x = FIELD.x1 - 40; hx = true; }
    if (m.y < FIELD.y0 + 40) { m.y = FIELD.y0 + 40; hy = true; } if (m.y > FIELD.y1 - 40) { m.y = FIELD.y1 - 40; hy = true; }
    if (hx) m.vx = -m.vx; if (hy) m.vy = -m.vy;
    if (Math.abs(m.vx) > 1) m.dir = m.vx > 0 ? 1 : -1;
    m.dirT -= dt; if (m.dirT <= 0) randomDir(m);
    if (m.rage < 50) m.perfTimer = perfInterval(50);
    else {
      m.perfTimer = Math.min(m.perfTimer, perfInterval(m.rage)) - dt;
      if (m.perfTimer <= 0 && m.rage < 100) { performShow(m); m.perfTimer = perfInterval(m.rage); }
    }
  } else if (m.mode === 'charge') {
    var tx = m.fence.x, ty = m.side === 'top' ? 285 : 980;
    var dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy);
    if (d > 6) { var st = Math.min(d, 160 * dt); m.x += dx / d * st; m.y += dy / d * st; if (Math.abs(dx) > 1) m.dir = dx > 0 ? 1 : -1; }
    else {
      m.chargeT += dt;
      if (m.chargeT >= 1.5) { m.fence.broken = true; m.mode = 'loose'; m.chargeT = 0; m.atkT = 1.5; }
    }
  } else if (m.mode === 'loose') {
    var rowY = m.side === 'top' ? 190 : 1080;
    if (Math.abs(m.y - rowY) > 4) { m.y += Math.sign(rowY - m.y) * Math.min(Math.abs(rowY - m.y), 140 * dt); }
    else {
      m.x += m.runDir * 140 * dt;
      if (m.x < 70) { m.x = 70; m.runDir = 1; } if (m.x > 650) { m.x = 650; m.runDir = -1; }
      m.dir = m.runDir;
      m.atkT -= dt;
      if (m.atkT <= 0) {
        m.atkT = 1.5;
        var best = null, bd = 1e9;
        S.visitors.forEach(function (v) {
          if (v.side !== m.side || v.mode !== 'watch') return;
          var d2 = Math.abs(v.x - m.x); if (d2 < bd) { bd = d2; best = v; }
        });
        if (best && bd <= 100) {
          best.mode = 'scared'; best.timer = 4; addRep(-3);
          addFloat(best.x, best.y, '名聲 -3', 'repDown');
        }
      }
    }
  }
}
function endShow() {
  S.mons.forEach(function (m) {
    if (m.mode !== 'roam') { addRep(-5); addFloat(m.x, m.y, '名聲 -5', 'repDown'); }
  });
  S.fences.forEach(function (f) { f.broken = false; });
  hazards.forEach(function (h) { removeHz(h); }); hazards = [];
  casts.forEach(function (c) { if (!c.settled) settleCast(c); });
  addRep(S.maxCombo);
  if (S.maxCombo > 0) addFloat(360, 640, '最高連擊 +' + S.maxCombo, 'repUp', 1.5);
  if (S.maxCombo > G.bestCombo) G.bestCombo = S.maxCombo;
  G.sub = 'ending'; G.endT = 2;
}

/* ---------- 繪製(只呼叫 Art) ---------- */
function sy(y) { return y + view.oy; }
function hudState() {
  var dun = G.phase === 'dungeon', show = G.phase === 'show';
  var msg = '';
  if (dun && D.lasso) msg = '繞著牠跑一圈!';
  if (show && S.mons.some(function (m) { return m.mode !== 'roam'; })) msg = '追上去吹哨 3 次';
  return {
    phase: G.phase, day: G.day, gold: G.gold, rep: G.rep,
    hearts: Math.max(0, T.hearts), maxHearts: maxHearts(), ropes: D ? D.ropes : ropeMax(), ropeMax: ropeMax(),
    roster: G.roster, timeLeft: dun ? D.time : (show ? S.time : 0), timeMax: dun ? 60 : (show ? 50 : 0), message: msg,
    rollCd: T.rollCd, rollCdMax: 0.8, parryCd: T.parryCd, parryCdMax: 0.6, whistleCd: T.whistleCd, whistleCdMax: whistleCdMax()
  };
}
function drawTamerArt() {
  Art.drawTamer(ctx, { x: T.x, y: sy(T.y), facing: T.facing, rolling: T.rollT > 0, parryLeft: T.parryT, parryDur: 0.2,
    stunLeft: T.stunT, stunDur: 1.5, blink: T.invulnT > 0, lassoing: !!(G.phase === 'dungeon' && D.lasso) });
}
function drawHazards() {
  hazards.forEach(function (h) {
    Art.drawHazard(ctx, { x: h.x, y: sy(h.y), kind: h.kind, phase: h.phase, radius: h.radius, t: h.t, dur: h.dur, angle: h.angle });
  });
}
function drawEffects() {
  effects.forEach(function (e) {
    if (e.type === 'whip') Art.drawWhipCrack(ctx, { x: e.x, y: sy(e.y), shape: e.shape, facing: e.facing, radius: e.radius, t: e.t, dur: e.dur });
    else if (e.type === 'whistle') Art.drawWhistleWave(ctx, { x: e.x, y: sy(e.y), radius: e.radius, t: e.t, dur: e.dur });
    else if (e.type === 'parry') Art.drawParryFlash(ctx, { x: e.x, y: sy(e.y), t: e.t, dur: e.dur });
  });
}
function drawFloats() {
  floats.forEach(function (f) {
    Art.drawFloatText(ctx, { x: f.x, y: sy(f.y) - 40 * f.t / f.dur, text: f.text, kind: f.kind, t: f.t, dur: f.dur });
  });
}
function renderDungeon() {
  Art.drawBackground(ctx, {});
  view.oy = 120 - D.camY;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 120, CW, CH - 120); ctx.clip();
  var r0 = Math.max(0, Math.floor(D.camY / TS)), r1 = Math.min(ROWS - 1, Math.floor((D.camY + 1160) / TS));
  for (var r = r0; r <= r1; r++) for (var c = 0; c < COLS; c++)
    Art.drawTile(ctx, { x: c * TS + 30, y: sy(r * TS + 30), kind: KIND[r][c], zone: zoneOf(c, r), nest: isNestTile(c, r) });
  drawHazards();
  D.monsters.forEach(function (m) {
    Art.drawWildMonster(ctx, { x: m.x, y: sy(m.y), species: m.sp, hp: m.hp, maxHp: m.maxHp, hit: m.hitT > 0, weak: m.weak,
      lassoed: m.lassoed, casting: m.castVis > 0, dir: m.dir });
  });
  if (D.lasso) {
    var L = D.lasso;
    Art.drawLasso(ctx, { x1: T.x, y1: sy(T.y), x2: L.mon.x, y2: sy(L.mon.y), progress: Math.min(1, L.progress), t: L.t, limit: 5,
      len: dist(T.x, T.y, L.mon.x, L.mon.y), maxLen: 220 });
  }
  drawTamerArt();
  drawEffects();
  drawFloats();
  ctx.restore();
  Art.drawHud(ctx, hudState());
}
function renderShow() {
  Art.drawBackground(ctx, {});
  view.oy = 0;
  Art.drawShowArena(ctx, {});
  S.visitors.forEach(function (v) { Art.drawVisitor(ctx, { x: v.x, y: v.y, seat: v.seat, mode: v.mode }); });
  S.fences.forEach(function (f) { Art.drawFence(ctx, { x: f.x, y: f.y, side: f.side, broken: f.broken }); });
  S.mons.forEach(function (m) {
    Art.drawShowMonster(ctx, { x: m.x, y: m.y, species: m.sp, mastery: m.mastery, rage: m.rage, redLow: redLow(m), mode: m.mode,
      performing: m.perfT > 0, fx: m.fx, fxT: m.fxT, fxDur: 0.5, subdue: m.subdue, chargeT: m.chargeT, chargeDur: 1.5, dir: m.dir });
  });
  drawHazards();
  drawTamerArt();
  drawEffects();
  drawFloats();
  Art.drawComboMeter(ctx, { x: 360, y: 1210, combo: S.combo, mult: S.combo > 0 ? Math.min(5, 2 + 0.2 * (S.combo - 1)) : 2,
    left: S.comboLeft, window: 4, broken: S.broken, brokenT: S.brokenT, brokenDur: 1.2 });
  Art.drawHud(ctx, hudState());
}
function textBlock(str, x, y, maxW, lh) {
  var line = '', yy = y;
  for (var i = 0; i < str.length; i++) {
    var t = line + str.charAt(i);
    if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); yy += lh; line = str.charAt(i); } else line = t;
  }
  if (line) ctx.fillText(line, x, yy);
}
function renderGuide() {
  var p = GUIDE[guide.page];
  Art.drawBackground(ctx, {});
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(20, 20, CW - 40, 220);
  ctx.fillRect(20, 1150, CW - 40, 110);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd24a'; ctx.font = 'bold 54px ' + FONT;
  ctx.fillText('第 ' + (guide.page + 1) + ' 頁　' + p.title, CW / 2, 80);
  ctx.fillStyle = '#fff'; ctx.font = '34px ' + FONT;
  textBlock(p.text, CW / 2, 165, CW - 100, 44);
  ctx.font = '28px ' + FONT; ctx.fillStyle = '#ddd';
  ctx.fillText((guide.page + 1) + ' / ' + GUIDE.length, CW / 2, 1180);
  var last = guide.page === GUIDE.length - 1;
  ctx.fillText((last ? (guide.first ? '按 Z 開始遊戲' : '按 Z 回到遊戲') : '按 Z 繼續') + '　← 上一頁　→ 下一頁', CW / 2, 1225);
  ctx.restore();
  Art.drawGuidePage(ctx, { page: guide.page + 1, x: 30, y: 260, w: 660, h: 870 });
}
function render() {
  if (guide.open) { renderGuide(); return; }
  if (G.phase === 'dungeon') renderDungeon();
  else if (G.phase === 'show') renderShow();
  else if (G.phase === 'title') {
    Art.drawBackground(ctx, {});
    Art.drawTitleCard(ctx, { day: G.day, stage: G.stage });
  } else if (G.phase === 'shop') {
    Art.drawBackground(ctx, {});
    Art.drawHud(ctx, hudState());
    for (var i = 0; i < 4; i++) {
      var it = ITEMS[i], lv = G.up[it], cost = G.cost[it];
      Art.drawShopItem(ctx, { x: 360, y: SHOP_Y[i], item: it, level: lv, cost: cost, affordable: G.gold >= cost && !itemMaxed(it), selected: G.shopSel === i });
    }
    Art.drawButton(ctx, { x: 160, y: 1140, w: 400, h: 100, label: '出發', selected: G.shopSel === 4 });
    ctx.save(); ctx.fillStyle = '#fff'; ctx.font = '28px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('↑↓ 選擇　Z 確定　H 說明', CW / 2, 1100); ctx.restore();
  } else if (G.phase === 'result') {
    Art.drawBackground(ctx, {});
    Art.drawResultPanel(ctx, { rep: G.rep, goldEarned: G.goldEarned, bestCombo: G.bestCombo, roster: G.roster, stars: stars() });
    ctx.save(); ctx.fillStyle = '#fff'; ctx.font = '32px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('按 Z 重來', CW / 2, 1240); ctx.restore();
  }
}
function update(dt) {
  if (G.phase === 'dungeon') updateDungeon(dt);
  else if (G.phase === 'show') updateShow(dt);
}

/* ---------- 主迴圈 ---------- */
var lastTs = null;
function frame(ts) {
  if (lastTs === null) lastTs = ts;
  var dt = Math.min((ts - lastTs) / 1000, 1 / 30);
  lastTs = ts;
  try {
    if (!guide.open) update(dt);
    render();
  } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
function resize() {
  var dpr = window.devicePixelRatio || 1;
  var scale = Math.min(window.innerWidth / CW, window.innerHeight / CH);
  if (!(scale > 0)) scale = 1;
  canvas.style.width = Math.floor(CW * scale) + 'px';
  canvas.style.height = Math.floor(CH * scale) + 'px';
  canvas.width = Math.round(CW * scale * dpr);
  canvas.height = Math.round(CH * scale * dpr);
  ctx.setTransform(canvas.width / CW, 0, 0, canvas.height / CH, 0, 0);
}
window.addEventListener('resize', resize);
resize();
newGame();
requestAnimationFrame(frame);
})();
