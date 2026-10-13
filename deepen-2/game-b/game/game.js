(function () {
'use strict';

// ============================================================
// 基本設定
// ============================================================
var CW = Art.canvas.width, CH = Art.canvas.height;
var canvas = document.getElementById('game');
var dpr = window.devicePixelRatio || 1;
canvas.width = Math.round(CW * dpr);
canvas.height = Math.round(CH * dpr);
var ctx = canvas.getContext('2d');
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

var PI = Math.PI;
function rnd(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
function normAng(a) { while (a > PI) a -= 2 * PI; while (a <= -PI) a += 2 * PI; return a; }
function sign(v) { return v > 0 ? 1 : (v < 0 ? -1 : 0); }

// ============================================================
// 資料表
// ============================================================
var SP = {
  fire:    { name: '火蜥蜴', hp: 10, iv: 2.4, decay: 4, gold: 5, rep: 1, kill: 4 },
  water:   { name: '水母',   hp: 7,  iv: 1.6, decay: 6, gold: 3, rep: 1, kill: 4 },
  thunder: { name: '雷鳥',   hp: 14, iv: 2.6, decay: 8, gold: 7, rep: 2, kill: 6 },
  spike:   { name: '刺蝟',   hp: 12, iv: 2.2, decay: 5, gold: 5, rep: 1, kill: 6 },
  stone:   { name: '石像鬼', hp: 22, iv: 3.0, decay: 1, gold: 6, rep: 2, kill: 8 },
  ghost:   { name: '幽靈',   hp: 16, iv: 2.8, decay: 3, gold: 6, rep: 2, kill: 8 }
};
var NEST_CH = { f: 'fire', j: 'water', t: 'thunder', h: 'spike', g: 'stone', p: 'ghost' };
var COMMON = ['#####..#####', '#..........#', '#..........#', '#....S.....#', '#..........#', '#..........#', '############'];
var DUN = {
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
var DUN_ORDER = ['cave', 'cliff', 'ruins'];
var UNLOCK = { cliff: { gold: 60, sp: 'water', n: 2 }, ruins: { gold: 120, sp: 'spike', n: 2 } };
var GADGET = {
  drum:     { name: '戰鼓', cost: 15, desc: '每 3 秒讓周圍魔物生氣' },
  fountain: { name: '噴泉', cost: 15, desc: '每 3 秒讓周圍魔物冷靜' },
  bait:     { name: '肉塊', cost: 10, desc: '把附近魔物吸過來' },
  wall:     { name: '矮牆', cost: 5,  desc: '擋住魔物和飛彈' }
};
var GADGET_ORDER = ['drum', 'fountain', 'bait', 'wall'];
var BONUS_SP = { fire: 1, water: 1, thunder: 1, spike: 1, stone: 1, ghost: 1 };
var SHOP_ITEMS = ['club', 'sword', 'spear', 'whip', 'attack', 'armor', 'ropeBag'];
var WEAPON_PRICE = { club: 0, sword: 60, spear: 60, whip: 60 };
var X_CD = { club: 0, sword: 3, spear: 1.2, whip: 1.2 };
var GUIDE = [
  { title: '第 1 頁 地下城', text: '方向鍵走, Z 攻擊, X 武器技' },
  { title: '第 2 頁 收服', text: '殘血時站上去, 再繞牠一圈' },
  { title: '第 3 頁 布置', text: '開演前擺好魔物與機關, 開演後只能看' },
  { title: '第 4 頁 紅區', text: '紅區最賺, 標記滿 5 個就失控' },
  { title: '第 5 頁 目標', text: '7 天內賺到越多名聲越好' }
];
var DAYS = 7;

// ============================================================
// 輸入(只用方向鍵 + Z、X)
// ============================================================
var keys = {};
var edge = {};
var locked = { KeyZ: false, KeyX: false };
var GAME_KEYS = { ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, KeyZ: 1, KeyX: 1 };

window.addEventListener('keydown', function (e) {
  if (!GAME_KEYS[e.code]) return;
  e.preventDefault();
  if (e.repeat) return;
  keys[e.code] = true;
  edge[e.code] = true;
});
window.addEventListener('keyup', function (e) {
  if (!GAME_KEYS[e.code]) return;
  e.preventDefault();
  keys[e.code] = false;
  if (locked[e.code]) locked[e.code] = false;
});
window.addEventListener('blur', function () { keys = {}; edge = {}; });

function pressed(c) { return !!edge[c]; }
function held(c) { return !!keys[c] && !locked[c]; }

// ============================================================
// 全域狀態
// ============================================================
var G = {};
var D = null;        // 地下城
var SH = null;       // 表演場
var hazards = [];
var floats = [];

function newGame() {
  G.day = 1; G.gold = 30; G.rep = 0; G.goldEarned = 0; G.bestHits = 0;
  G.roster = [{ sp: 'fire', level: 0 }];
  G.caught = { fire: 0, water: 0, thunder: 0, spike: 0, stone: 0, ghost: 0 };
  G.weapon = 'club'; G.owned = { club: true };
  G.up = { attack: 0, armor: 0, rope: 0 };
  G.upCost = { attack: 50, armor: 40, rope: 40 };
  G.unlocked = { cave: true, cliff: false, ruins: false };
  G.selIdx = 0; G.picked = {}; G.s1cur = 0; G.shopIdx = 0;
  G.cells = []; G.s2cur = 0; G.panel = null;
  G.stars = 0;
}
G.phase = 'guide'; G.page = 0; G.guideRet = 'select'; G.guideFirst = true;
newGame();

function go(phase) {
  G.phase = phase;
  edge = {};
  locked.KeyZ = !!keys.KeyZ;
  locked.KeyX = !!keys.KeyX;
}
function lvl(sp) {
  for (var i = 0; i < G.roster.length; i++) if (G.roster[i].sp === sp) return G.roster[i].level;
  return -1;
}
function bonus(sp) { var l = lvl(sp); return l > 0 ? l : 0; }
function atkBonus() { return G.up.attack; }
function maxHeartsNow() { return 5 + G.up.armor + bonus('stone'); }
function maxRopesNow() { return 3 + G.up.rope; }
function addGold(n) { G.gold += n; G.goldEarned += n; }
function addRep(n) { G.rep = Math.max(0, G.rep + n); }
function floatText(x, y, text, kind) { floats.push({ x: x, y: y, text: text, kind: kind, t: 0, dur: 1 }); }
function updFloats(dt) {
  for (var i = floats.length - 1; i >= 0; i--) {
    floats[i].t += dt;
    if (floats[i].t >= floats[i].dur) floats.splice(i, 1);
  }
}

// ============================================================
// 地下城
// ============================================================
var TS = 60, OY = 130;
var T = null; // tamer

function buildGrid(id) {
  var rows = DUN[id].rows.concat(COMMON), grid = [], nests = [];
  for (var r = 0; r < rows.length; r++) {
    grid[r] = [];
    for (var c = 0; c < 12; c++) {
      var ch = rows[r][c], kind = 'floor', nest = false;
      if (ch === '#') kind = 'wall';
      else if (ch === 'o') kind = 'pillar';
      else if (ch === 'L') kind = 'lava';
      else if (ch === 'W') kind = 'water';
      var room = (r >= 1 && r <= 5 && c >= 1 && c <= 10) ? 'top' : ((r >= 7 && r <= 11 && c >= 1 && c <= 10) ? 'bottom' : 'hall');
      if (NEST_CH[ch]) {
        nest = true;
        nests.push({ col: c, row: r, x: c * TS + 30, y: r * TS + 30, sp: NEST_CH[ch], room: room, mon: null, respawn: 0 });
      }
      grid[r][c] = { ch: ch, kind: kind, room: room, nest: nest };
    }
  }
  return { grid: grid, nests: nests };
}
function solid(c, r) {
  if (r < 0 || c < 0 || r >= 19 || c >= 12) return true;
  var k = D.grid[r][c].kind;
  return k === 'wall' || k === 'pillar';
}
function tamerHits(x, y) {
  var R = 18, c0 = Math.floor((x - R) / TS), c1 = Math.floor((x + R) / TS), r0 = Math.floor((y - R) / TS), r1 = Math.floor((y + R) / TS);
  for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
    if (!solid(c, r)) continue;
    var nx = clamp(x, c * TS, c * TS + TS), ny = clamp(y, r * TS, r * TS + TS);
    if (dist(x, y, nx, ny) < R) return true;
  }
  return false;
}
function moveTamer(dx, dy) {
  var steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 8));
  var sx = dx / steps, sy = dy / steps, blocked = false;
  for (var i = 0; i < steps; i++) {
    if (!tamerHits(T.x + sx, T.y)) T.x += sx; else if (sx) blocked = true;
    if (!tamerHits(T.x, T.y + sy)) T.y += sy; else if (sy) blocked = true;
  }
  return blocked;
}
function tileAt(x, y) {
  var c = clamp(Math.floor(x / TS), 0, 11), r = clamp(Math.floor(y / TS), 0, 18);
  return D.grid[r][c];
}
function monR(m) { return m.sp === 'stone' ? 40 : 30; }
function roomBox(room) {
  // 魔物中心可到達範圍(房間內縮 30)
  return room === 'top' ? { x0: 90, x1: 630, y0: 90, y1: 330 } : { x0: 90, x1: 630, y0: 450, y1: 690 };
}
function isWeak(m) { return m.hp <= m.maxHp * 0.3; }

function spawnWild(nest) {
  var sp = nest.sp, m = {
    id: Math.random(), sp: sp, x: nest.x, y: nest.y, hp: SP[sp].hp, maxHp: SP[sp].hp, hitT: 0,
    stun: 0, lassoed: false, castCd: rnd(0.5, SP[sp].iv), castFlash: 0, dashT: 0, dashCd: rnd(0.5, 2),
    dvx: 0, dvy: 0, dir: 1, turnT: 4, roamT: 0, rvx: 0, rvy: 0, tpT: 3, kb: null, nest: nest, room: nest.room, dead: false
  };
  var a = rnd(0, 2 * PI); m.rvx = Math.cos(a); m.rvy = Math.sin(a);
  m.vx = Math.cos(a); m.vy = Math.sin(a); // 刺蝟滾動方向
  nest.mon = m; nest.respawn = 0;
  D.mons.push(m);
}

function startDungeon(id) {
  var g = buildGrid(id);
  D = { id: id, grid: g.grid, nests: g.nests, mons: [], fxs: [], time: 60, ring: null, lasso: null };
  hazards = []; floats = [];
  var maxH = maxHeartsNow();
  T = { x: 5 * TS + 30, y: 15 * TS + 30, facing: 0, hearts: maxH, maxHearts: maxH, ropes: maxRopesNow(), invuln: 0, dash: null, zCd: 0, xCd: 0 };
  for (var i = 0; i < D.nests.length; i++) spawnWild(D.nests[i]);
  go('dungeon');
}

function xCdMax() {
  var b = X_CD[G.weapon];
  return b * Math.max(0.1, 1 - 0.15 * bonus('spike'));
}

function damageTamer() {
  if (T.invuln > 0 || T.dash) return;
  T.hearts -= 1;
  T.invuln = 1;
  if (D.lasso) breakLasso();
}
function breakLasso() {
  if (!D.lasso) return;
  D.lasso.mon.lassoed = false;
  D.lasso = null;
  D.ring = null;
}

function cancelWarn(m) {
  for (var i = hazards.length - 1; i >= 0; i--) {
    var h = hazards[i];
    if (h.owner === m && h.phase === 'warn') h.dead = true;
  }
}

function killMon(m) {
  m.dead = true;
  var i = D.mons.indexOf(m); if (i >= 0) D.mons.splice(i, 1);
  if (m.nest) { m.nest.mon = null; m.nest.respawn = 8; }
  if (D.ring && D.ring.mon === m) D.ring = null;
  addGold(SP[m.sp].kill);
  floatText(m.x, m.y + OY - 30, '+' + SP[m.sp].kill, 'gold');
}
function hurtMon(m, dmg) {
  if (m.lassoed || m.dead) return;
  m.hp -= dmg; m.hitT = 0.1;
  if (D.ring && D.ring.mon === m) D.ring.t = 0;
  if (m.hp <= 0) killMon(m);
}
function stunMon(m, sec) {
  if (m.lassoed || m.dead) return;
  m.stun = sec; cancelWarn(m);
  if (D.ring && D.ring.mon === m) D.ring.t = 0;
}

// ---------- 武器 ----------
function inArc(m, ox, oy, ang, spread, R) {
  var d = dist(m.x, m.y, ox, oy), mr = monR(m);
  if (d > R + mr) return false;
  if (d <= mr + 8) return true;
  var a = Math.atan2(m.y - oy, m.x - ox);
  return Math.abs(normAng(a - ang)) <= spread / 2 + Math.atan(mr / d);
}
function inLine(m, ox, oy, ang, len, wid) {
  var dx = m.x - ox, dy = m.y - oy, ca = Math.cos(ang), sa = Math.sin(ang);
  var along = dx * ca + dy * sa, lat = -dx * sa + dy * ca, mr = monR(m);
  return along >= -mr && along <= len + mr && Math.abs(lat) <= wid / 2 + mr;
}
function addFx(o) { o.t = 0; o.dur = o.dur || 0.2; D.fxs.push(o); }
function monsCopy() { return D.mons.slice(); }

function attackZ() {
  var w = G.weapon, ang = (T.facing - 2) * PI / 4, fb = 1 + 0.1 * bonus('fire'), dmg = 2 + atkBonus(), i, m, list = monsCopy();
  if (w === 'club' || w === 'sword') {
    var R = (w === 'club' ? 70 : 80) * fb, sp = (w === 'club' ? 100 : 120) * PI / 180;
    T.zCd = 0.35;
    addFx({ x: T.x, y: T.y, weapon: w, move: 'normal', shape: 'arc', angle: ang, spread: sp, radius: R, follow: true });
    for (i = 0; i < list.length; i++) if (inArc(list[i], T.x, T.y, ang, sp, R)) hurtMon(list[i], dmg);
    if (w === 'sword') {
      for (i = 0; i < hazards.length; i++) {
        var h = hazards[i];
        if (h.phase !== 'fly' || h.reflected || h.dead) continue;
        var d = dist(h.x, h.y, T.x, T.y);
        if (d > R + h.radius) continue;
        var a = Math.atan2(h.y - T.y, h.x - T.x);
        if (d > 20 && Math.abs(normAng(a - ang)) > sp / 2 + 0.1) continue;
        var o = h.owner;
        h.angle = (o && !o.dead) ? Math.atan2(o.y - T.y, o.x - T.x) : normAng(h.angle + PI);
        h.reflected = true; h.speed *= 1.2; h.home = false;
      }
    }
  } else if (w === 'spear') {
    var L = 170 * fb;
    T.zCd = 0.45;
    addFx({ x: T.x, y: T.y, weapon: w, move: 'normal', shape: 'line', angle: ang, length: L, width: 40, follow: true });
    for (i = 0; i < list.length; i++) if (inLine(list[i], T.x, T.y, ang, L, 40)) hurtMon(list[i], dmg);
  } else if (w === 'whip') {
    var R2 = 100 * fb;
    T.zCd = 0.4;
    addFx({ x: T.x, y: T.y, weapon: w, move: 'normal', shape: 'circle', angle: ang, radius: R2, follow: true });
    for (i = 0; i < list.length; i++) if (dist(list[i].x, list[i].y, T.x, T.y) <= R2 + monR(list[i])) hurtMon(list[i], 1 + atkBonus());
  }
}
function attackX() {
  var w = G.weapon, ang = (T.facing - 2) * PI / 4, i, list = monsCopy();
  if (w === 'club') return;
  if (w === 'sword') {
    T.xCd = xCdMax();
    var sp = 120 * PI / 180;
    addFx({ x: T.x, y: T.y, weapon: w, move: 'skill', shape: 'arc', angle: ang, spread: sp, radius: 80, follow: true });
    for (i = 0; i < list.length; i++) if (inArc(list[i], T.x, T.y, ang, sp, 80)) stunMon(list[i], 2);
  } else if (w === 'spear') {
    T.xCd = xCdMax();
    var dx = Math.cos(ang), dy = Math.sin(ang);
    T.dash = { t: 0, dx: dx, dy: dy, hit: [] };
    addFx({ x: T.x, y: T.y, weapon: w, move: 'skill', shape: 'dash', angle: ang, length: 220, dur: 0.25 });
  } else if (w === 'whip') {
    T.xCd = xCdMax();
    var sp2 = 100 * PI / 180;
    addFx({ x: T.x, y: T.y, weapon: w, move: 'skill', shape: 'arc', angle: ang, spread: sp2, radius: 170, follow: true });
    for (i = 0; i < list.length; i++) {
      var m = list[i];
      if (!inArc(m, T.x, T.y, ang, sp2, 170)) continue;
      if (m.lassoed) continue;
      hurtMon(m, 2 + atkBonus());
      if (!m.dead) {
        var ka = dist(m.x, m.y, T.x, T.y) > 1 ? Math.atan2(m.y - T.y, m.x - T.x) : ang;
        m.kb = { vx: Math.cos(ka) * 640, vy: Math.sin(ka) * 640, t: 0.25 };
      }
    }
  }
}

// ---------- 技能(地下城與表演場共用) ----------
function pushHaz(o) {
  o.t = 0; o.hit = []; o.dead = false; o.reflected = false;
  if (o.cast) o.cast.live++;
  hazards.push(o);
}
function spawnSkill(m, tx, ty, cast) {
  var sp = m.sp, i, base;
  if (sp === 'fire') {
    pushHaz({ kind: 'firering', x: m.x, y: m.y, phase: 'warn', radius: 120, dur: 0.5, angle: 0, owner: m, cast: cast });
  } else if (sp === 'water') {
    base = Math.atan2(ty - m.y, tx - m.x);
    for (i = -1; i <= 1; i++) pushHaz({ kind: 'waterball', x: m.x, y: m.y, phase: 'fly', radius: 12, dur: 0, angle: base + i * 20 * PI / 180, speed: 300, owner: m, cast: cast });
    m.castFlash = 0.25;
  } else if (sp === 'thunder') {
    pushHaz({ kind: 'thunder', x: tx, y: ty, phase: 'warn', radius: 70, dur: 0.8, angle: 0, owner: m, cast: cast });
  } else if (sp === 'spike') {
    for (i = 0; i < 8; i++) pushHaz({ kind: 'spike', x: m.x, y: m.y, phase: 'fly', radius: 10, dur: 0, angle: i * PI / 4, speed: 260, owner: m, cast: cast });
    m.castFlash = 0.25;
  } else if (sp === 'stone') {
    pushHaz({ kind: 'quake', x: m.x, y: m.y, phase: 'active', radius: 0, dur: 1, angle: 0, owner: m, cast: cast });
  } else if (sp === 'ghost') {
    base = Math.atan2(ty - m.y, tx - m.x);
    pushHaz({ kind: 'wisp', x: m.x, y: m.y, phase: 'fly', radius: 14, dur: 3, angle: base, speed: 160, home: true, owner: m, cast: cast });
    m.castFlash = 0.25;
  }
}
function isProj(h) { return h.kind === 'waterball' || h.kind === 'spike' || h.kind === 'wisp'; }

function hazardHitsTamer(h) {
  var d = dist(h.x, h.y, T.x, T.y);
  if (h.kind === 'quake') return Math.abs(d - h.radius) <= 15 + 18;
  return d <= h.radius + 18;
}
function areaHitDungeon(h) {
  if (h.hit.indexOf('tamer') >= 0) return;
  if (hazardHitsTamer(h)) { h.hit.push('tamer'); damageTamer(); }
}
function areaHitShow(h) {
  var o = h.owner;
  for (var i = 0; i < SH.mons.length; i++) {
    var m = SH.mons[i];
    if (m === o || m.mode !== 'roam' || h.hit.indexOf(m) >= 0) continue;
    var d = dist(h.x, h.y, m.x, m.y), ok;
    if (h.kind === 'quake') ok = Math.abs(d - h.radius) <= 15 + SHR(m);
    else ok = d <= h.radius + SHR(m);
    if (ok) { h.hit.push(m); showHit(h, m); }
  }
}

function updHazards(dt, inShow) {
  var i, h;
  for (i = 0; i < hazards.length; i++) {
    h = hazards[i];
    if (h.dead) continue;
    if (h.phase === 'warn') {
      h.t += dt;
      if (h.t >= h.dur) {
        if (h.kind === 'firering') { h.phase = 'active'; h.t = 0; h.dur = 0.5; }
        else if (h.kind === 'thunder') {
          h.phase = 'active'; h.t = 0; h.dur = 0.2;
          if (inShow) areaHitShow(h); else areaHitDungeon(h);
        }
      }
    } else if (h.phase === 'active') {
      h.t += dt;
      if (h.kind === 'quake') h.radius = 220 * Math.min(1, h.t / 1);
      if (h.kind === 'firering' || h.kind === 'quake') { if (inShow) areaHitShow(h); else areaHitDungeon(h); }
      if (h.t >= h.dur) h.dead = true;
    } else { // fly
      h.t += dt;
      if (h.kind === 'wisp' && h.home && !h.reflected) {
        var tx = null, ty = null;
        if (inShow) {
          var nm = nearestMon(h.owner, h.x, h.y);
          if (nm) { tx = nm.x; ty = nm.y; }
        } else { tx = T.x; ty = T.y; }
        if (tx !== null) {
          var want = normAng(Math.atan2(ty - h.y, tx - h.x) - h.angle), mx = 120 * PI / 180 * dt;
          h.angle += clamp(want, -mx, mx);
        }
      }
      h.x += Math.cos(h.angle) * h.speed * dt;
      h.y += Math.sin(h.angle) * h.speed * dt;
      if (h.kind === 'wisp' && h.t >= h.dur) { h.dead = true; continue; }
      if (inShow) {
        if (h.x < 60 || h.x > 660 || h.y < 270 || h.y > 990) { h.dead = true; continue; }
        if (inWall(h.x, h.y, h.radius * 0.5)) { h.dead = true; continue; }
        for (var k = 0; k < SH.mons.length; k++) {
          var m = SH.mons[k];
          if (m === h.owner || m.mode !== 'roam') continue;
          if (h.cast && h.cast.hit.indexOf(m) >= 0) continue;
          if (dist(h.x, h.y, m.x, m.y) <= h.radius + SHR(m)) { showHit(h, m); h.dead = true; break; }
        }
      } else {
        var t = tileAt(h.x, h.y);
        if (t.kind === 'wall' || t.kind === 'pillar' || h.x < 0 || h.x > 720 || h.y < 0 || h.y > 1140) { h.dead = true; continue; }
        if (h.reflected) {
          for (var j = 0; j < D.mons.length; j++) {
            var wm = D.mons[j];
            if (wm.lassoed) continue;
            if (dist(h.x, h.y, wm.x, wm.y) <= h.radius + monR(wm)) { hurtMon(wm, 3 + atkBonus()); h.dead = true; break; }
          }
        } else if (!T.dash && T.invuln <= 0) {
          if (dist(h.x, h.y, T.x, T.y) <= h.radius + 18) { damageTamer(); h.dead = true; }
        }
      }
    }
  }
  var keep = [];
  for (i = 0; i < hazards.length; i++) {
    h = hazards[i];
    if (h.dead) { if (h.cast) { h.cast.live--; if (h.cast.live <= 0) finalizeCast(h.cast); } }
    else keep.push(h);
  }
  hazards = keep;
}

// ---------- 地下城更新 ----------
function roamMove(m, dt, speed, box) {
  m.roamT -= dt;
  if (m.roamT <= 0) { var a = rnd(0, 2 * PI); m.rvx = Math.cos(a); m.rvy = Math.sin(a); m.roamT = rnd(2, 3); }
  m.x = clamp(m.x + m.rvx * speed * dt, box.x0, box.x1);
  m.y = clamp(m.y + m.rvy * speed * dt, box.y0, box.y1);
  if (m.rvx) m.dir = sign(m.rvx);
}
function roomFloors(room) {
  var out = [], r0 = room === 'top' ? 1 : 7;
  for (var r = r0; r < r0 + 5; r++) for (var c = 1; c <= 10; c++) {
    var ch = D.grid[r][c].ch;
    if (ch === '.' || NEST_CH[ch]) out.push({ x: c * TS + 30, y: r * TS + 30 });
  }
  return out;
}

function updMon(m, dt) {
  if (m.hitT > 0) m.hitT -= dt;
  if (m.castFlash > 0) m.castFlash -= dt;
  var box = roomBox(m.room);
  if (m.kb) {
    m.x = clamp(m.x + m.kb.vx * dt, box.x0, box.x1);
    m.y = clamp(m.y + m.kb.vy * dt, box.y0, box.y1);
    m.kb.t -= dt; if (m.kb.t <= 0) m.kb = null;
    return;
  }
  if (m.stun > 0) { m.stun -= dt; return; }
  if (m.lassoed) return;
  var dx = T.x - m.x, dy = T.y - m.y, d = Math.hypot(dx, dy), sf = isWeak(m) ? 0.5 : 1, sp = m.sp;
  if (sp === 'fire') {
    if (d >= 320) roamMove(m, dt, 40 * sf, box);
    else if (d > 80) { m.x = clamp(m.x + dx / d * 70 * sf * dt, box.x0, box.x1); m.y = clamp(m.y + dy / d * 70 * sf * dt, box.y0, box.y1); m.dir = sign(dx) || m.dir; }
  } else if (sp === 'water') {
    if (d >= 320) roamMove(m, dt, 40 * sf, box);
    else if (d < 220 && d > 0.01) { m.x = clamp(m.x - dx / d * 60 * sf * dt, box.x0, box.x1); m.y = clamp(m.y - dy / d * 60 * sf * dt, box.y0, box.y1); m.dir = sign(-dx) || m.dir; }
  } else if (sp === 'thunder') {
    if (m.dashT > 0) {
      m.dashT -= dt;
      m.x = clamp(m.x + m.dvx * 600 * sf * dt, box.x0, box.x1);
      m.y = clamp(m.y + m.dvy * 600 * sf * dt, box.y0, box.y1);
    } else {
      m.dashCd -= dt;
      if (m.dashCd <= 0) {
        var a = rnd(0, 2 * PI); m.dvx = Math.cos(a); m.dvy = Math.sin(a); m.dashT = 0.3; m.dashCd = 2;
        if (m.dvx) m.dir = sign(m.dvx);
      }
    }
  } else if (sp === 'spike') {
    m.turnT -= dt;
    if (m.turnT <= 0) { var b = rnd(0, 2 * PI); m.vx = Math.cos(b); m.vy = Math.sin(b); m.turnT = 4; }
    var nx = m.x + m.vx * 110 * sf * dt, ny = m.y + m.vy * 110 * sf * dt;
    if (nx < box.x0 || nx > box.x1) { m.vx = -m.vx; nx = clamp(nx, box.x0, box.x1); }
    if (ny < box.y0 || ny > box.y1) { m.vy = -m.vy; ny = clamp(ny, box.y0, box.y1); }
    m.x = nx; m.y = ny; if (m.vx) m.dir = sign(m.vx);
  } else if (sp === 'ghost') {
    m.tpT -= dt;
    if (m.tpT <= 0) {
      m.tpT = 3;
      var fl = roomFloors(m.room), cand = [];
      for (var i = 0; i < fl.length; i++) if (dist(fl[i].x, fl[i].y, T.x, T.y) >= 120) cand.push(fl[i]);
      if (!cand.length) cand = fl;
      var p = cand[Math.floor(Math.random() * cand.length)];
      m.x = p.x; m.y = p.y;
    }
  }
  // 施放
  m.castCd -= dt;
  if (m.castCd <= 0 && d < 320) {
    spawnSkill(m, T.x, T.y, null);
    m.castCd = SP[sp].iv * (isWeak(m) ? 1.5 : 1);
  }
}

function captureTime() { return Math.max(0.35, 0.8 - 0.15 * bonus('water')); }

function addCapture(m) {
  var sp = m.sp, r = null, i;
  G.caught[sp]++;
  for (i = 0; i < G.roster.length; i++) if (G.roster[i].sp === sp) r = G.roster[i];
  floatText(m.x, m.y + OY - 30, '收服!', 'capture');
  if (!r) G.roster.push({ sp: sp, level: 0 });
  else if (r.level < 3) {
    r.level++;
    floatText(m.x, m.y + OY - 70, '等級 +1', 'levelUp');
    if (sp === 'stone') { T.maxHearts++; T.hearts++; }
  } else {
    addGold(20);
    floatText(m.x, m.y + OY - 70, '+20', 'coin20');
  }
}

function updDungeon(dt) {
  var i, m;
  D.time -= dt;
  updFloats(dt);
  for (i = D.fxs.length - 1; i >= 0; i--) {
    var f = D.fxs[i]; f.t += dt;
    if (f.follow) { f.x = T.x; f.y = T.y; }
    if (f.t >= f.dur) D.fxs.splice(i, 1);
  }
  if (T.invuln > 0) T.invuln -= dt;
  if (T.zCd > 0) T.zCd -= dt;
  if (T.xCd > 0) T.xCd -= dt;

  // 馴獸師
  if (T.dash) {
    var D0 = T.dash;
    D0.t += dt;
    var blocked = moveTamer(D0.dx * 880 * dt, D0.dy * 880 * dt);
    var lm = monsCopy();
    for (i = 0; i < lm.length; i++) {
      if (D0.hit.indexOf(lm[i]) >= 0) continue;
      if (dist(lm[i].x, lm[i].y, T.x, T.y) <= 18 + monR(lm[i])) { D0.hit.push(lm[i]); hurtMon(lm[i], 3 + atkBonus()); }
    }
    if (blocked || D0.t >= 0.25) T.dash = null;
  } else {
    var ix = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
    var iy = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
    if (ix || iy) {
      var len = Math.hypot(ix, iy);
      var spd = 300 + 25 * bonus('thunder');
      if (tileAt(T.x, T.y).kind === 'water') spd *= 0.5;
      moveTamer(ix / len * spd * dt, iy / len * spd * dt);
      T.facing = faceIdx(ix, iy);
    }
    if (held('KeyZ') && T.zCd <= 0) attackZ();
    else if (held('KeyX') && T.xCd <= 0 && G.weapon !== 'club') attackX();
  }
  if (tileAt(T.x, T.y).kind === 'lava') damageTamer();

  // 魔物
  var list = monsCopy();
  for (i = 0; i < list.length; i++) updMon(list[i], dt);
  updHazards(dt, false);

  // 準備捕捉 / 套索
  if (!D.lasso) {
    var best = null, bd = 1e9;
    if (T.ropes > 0) {
      for (i = 0; i < D.mons.length; i++) {
        m = D.mons[i];
        if (!isWeak(m) || m.lassoed) continue;
        var dd = dist(m.x, m.y, T.x, T.y);
        if (dd <= 40 && dd < bd) { bd = dd; best = m; }
      }
    }
    if (!best) D.ring = null;
    else {
      if (!D.ring || D.ring.mon !== best) D.ring = { mon: best, t: 0, dur: captureTime() };
      else { D.ring.t += dt; D.ring.dur = captureTime(); }
      if (D.ring.t >= D.ring.dur) {
        m = D.ring.mon;
        m.lassoed = true; m.kb = null; cancelWarn(m);
        D.lasso = { mon: m, sum: 0, last: Math.atan2(T.y - m.y, T.x - m.x), t: 0, limit: 5 + bonus('ghost') };
        D.ring = null;
      }
    }
  } else {
    var L = D.lasso, lmn = L.mon;
    L.t += dt;
    var dl = dist(T.x, T.y, lmn.x, lmn.y);
    if (dl > 0.5) {
      var ang = Math.atan2(T.y - lmn.y, T.x - lmn.x);
      L.sum += normAng(ang - L.last); L.last = ang;
    }
    if (Math.abs(L.sum) >= 2 * PI) {
      T.ropes -= 1;
      D.lasso = null;
      var idx = D.mons.indexOf(lmn); if (idx >= 0) D.mons.splice(idx, 1);
      lmn.dead = true;
      if (lmn.nest) { lmn.nest.mon = null; lmn.nest.respawn = 8; }
      addCapture(lmn);
    } else if (L.t >= L.limit || dl > 220) breakLasso();
  }

  // 巢穴再生
  for (i = 0; i < D.nests.length; i++) {
    var n = D.nests[i];
    if (!n.mon && n.respawn > 0) { n.respawn -= dt; if (n.respawn <= 0) spawnWild(n); }
  }

  if (T.hearts <= 0 || D.time <= 0) endDungeon();
}
function faceIdx(ix, iy) {
  if (ix === 0 && iy < 0) return 0;
  if (ix > 0 && iy < 0) return 1;
  if (ix > 0 && iy === 0) return 2;
  if (ix > 0 && iy > 0) return 3;
  if (ix === 0 && iy > 0) return 4;
  if (ix < 0 && iy > 0) return 5;
  if (ix < 0 && iy === 0) return 6;
  return 7;
}
function endDungeon() {
  hazards = []; floats = [];
  G.picked = {}; G.s1cur = 0;
  go('setup1');
}

// ============================================================
// 地下城選擇
// ============================================================
function condText(id) {
  var u = UNLOCK[id];
  if (!u) return '';
  return '金幣 ' + u.gold + ' + 收服' + SP[u.sp].name + ' ' + Math.min(G.caught[u.sp], u.n) + '/' + u.n;
}
function updSelect() {
  if (pressed('ArrowUp')) G.selIdx = (G.selIdx + 2) % 3;
  if (pressed('ArrowDown')) G.selIdx = (G.selIdx + 1) % 3;
  if (pressed('KeyX')) { openGuide('select'); return; }
  if (pressed('KeyZ')) {
    var id = DUN_ORDER[G.selIdx];
    if (G.unlocked[id]) startDungeon(id);
    else {
      var u = UNLOCK[id];
      if (G.gold >= u.gold && G.caught[u.sp] >= u.n) { G.gold -= u.gold; G.unlocked[id] = true; }
    }
  }
}

// ============================================================
// 布置階段
// ============================================================
function pickedList() {
  var out = [];
  for (var i = 0; i < G.roster.length; i++) if (G.picked[G.roster[i].sp]) out.push(G.roster[i].sp);
  return out;
}
function updSetup1() {
  var n = G.roster.length, c = G.s1cur;
  if (pressed('KeyX')) { openGuide('setup1'); return; }
  if (pressed('ArrowLeft') && c < n && c % 2 === 1) c--;
  if (pressed('ArrowRight') && c < n && c % 2 === 0 && c + 1 < n) c++;
  if (pressed('ArrowDown')) { if (c < n) { c = (c + 2 < n) ? c + 2 : n; } }
  if (pressed('ArrowUp')) { if (c === n) c = n - 1; else if (c >= 2) c -= 2; }
  G.s1cur = c;
  if (pressed('KeyZ')) {
    if (c < n) {
      var sp = G.roster[c].sp;
      if (G.picked[sp]) delete G.picked[sp];
      else if (pickedList().length < 4) G.picked[sp] = true;
    } else if (pickedList().length >= 1) {
      G.cells = []; for (var i = 0; i < 12; i++) G.cells.push(null);
      G.s2cur = 0; G.panel = null;
      go('setup2');
    }
  }
}
function cellRefund(cell) { return (cell && cell.t === 'g') ? GADGET[cell.k].cost : 0; }
function clearCell(i) {
  var cell = G.cells[i];
  if (cell && cell.t === 'g') G.gold += GADGET[cell.k].cost;
  G.cells[i] = null;
}
function openPanel(i) {
  var opts = [], placed = {}, k;
  for (k = 0; k < 12; k++) if (G.cells[k] && G.cells[k].t === 'm') placed[G.cells[k].sp] = true;
  var pl = pickedList();
  for (k = 0; k < pl.length; k++) if (!placed[pl[k]]) opts.push({ type: 'monster', key: pl[k], name: SP[pl[k]].name, cost: 0, desc: '', affordable: true });
  var refund = cellRefund(G.cells[i]);
  for (k = 0; k < GADGET_ORDER.length; k++) {
    var g = GADGET[GADGET_ORDER[k]];
    opts.push({ type: 'gadget', key: GADGET_ORDER[k], name: g.name, cost: g.cost, desc: g.desc, affordable: G.gold + refund >= g.cost });
  }
  opts.push({ type: 'clear', key: 'clear', name: '清空', cost: 0, desc: '', affordable: true });
  G.panel = { cell: i, options: opts, index: 0 };
}
function updSetup2() {
  var cur = G.s2cur, p = G.panel;
  if (p) {
    if (pressed('ArrowUp')) p.index = Math.max(0, p.index - 1);
    if (pressed('ArrowDown')) p.index = Math.min(p.options.length - 1, p.index + 1);
    if (pressed('KeyX')) { G.panel = null; return; }
    if (pressed('KeyZ')) {
      var o = p.options[p.index];
      if (o.type === 'monster') { clearCell(p.cell); G.cells[p.cell] = { t: 'm', sp: o.key }; G.panel = null; }
      else if (o.type === 'gadget') {
        if (o.affordable) { clearCell(p.cell); G.gold -= o.cost; G.cells[p.cell] = { t: 'g', k: o.key }; G.panel = null; }
      } else { clearCell(p.cell); G.panel = null; }
    }
    return;
  }
  if (cur < 12) {
    var c = cur % 3, r = Math.floor(cur / 3);
    if (pressed('ArrowLeft') && c > 0) cur--;
    if (pressed('ArrowRight') && c < 2) cur++;
    if (pressed('ArrowUp') && r > 0) cur -= 3;
    if (pressed('ArrowDown')) { if (r < 3) cur += 3; else cur = 12; }
    G.s2cur = cur;
    if (cur < 12) {
      if (pressed('KeyZ')) openPanel(cur);
      else if (pressed('KeyX')) clearCell(cur);
    }
  } else {
    if (pressed('ArrowUp') || pressed('ArrowLeft')) G.s2cur = 11;
    else if (pressed('KeyX')) {
      for (var i = 0; i < 12; i++) clearCell(i);
      G.panel = null; go('setup1');
    } else if (pressed('KeyZ')) startShow();
  }
}

// ============================================================
// 表演場
// ============================================================
var AX0 = 60, AX1 = 660, AY0 = 270, AY1 = 990;
function cellX(c) { return 160 + 200 * c; }
function cellY(r) { return 360 + 180 * r; }
function SHR(m) { return m.sp === 'stone' ? 38 : 30; }

function startShow() {
  var i, placed = {}, empties = [];
  for (i = 0; i < 12; i++) if (G.cells[i] && G.cells[i].t === 'm') placed[G.cells[i].sp] = true;
  for (i = 0; i < 12; i++) if (!G.cells[i]) empties.push(i);
  var pl = pickedList();
  for (var k = 0; k < pl.length; k++) {
    if (placed[pl[k]]) continue;
    var slot;
    if (empties.length) slot = empties.splice(Math.floor(Math.random() * empties.length), 1)[0];
    else { // 沒空格: 取代一座非矮牆的機關(退費)
      var cand = [];
      for (i = 0; i < 12; i++) if (G.cells[i] && G.cells[i].t === 'g') cand.push(i);
      if (!cand.length) continue;
      slot = cand[Math.floor(Math.random() * cand.length)];
      clearCell(slot);
    }
    G.cells[slot] = { t: 'm', sp: pl[k] };
  }
  SH = { t: 0, mons: [], gadgets: [], walls: [], pulses: [], pulseNext: 1.5, fences: [], visitors: [], casts: [], bestThis: 0, done: false };
  hazards = []; floats = [];
  for (i = 0; i < 12; i++) {
    var cell = G.cells[i];
    if (!cell) continue;
    var x = cellX(i % 3), y = cellY(Math.floor(i / 3));
    if (cell.t === 'm') {
      var l = lvl(cell.sp);
      SH.mons.push({
        sp: cell.sp, level: l, x: x, y: y, rage: 40, redLow: 80 - 5 * l, marks: 0, markLeft: 0, slow: false,
        mode: 'roam', performCd: 3, performT: -1, fx: 'none', fxT: 0, chargeT: 0, looseT: 0, dashT: 0, dashCd: rnd(0.5, 2),
        dvx: 0, dvy: 0, dir: 1, roamT: 0, rvx: 0, rvy: 0, vx: 1, vy: 0, turnT: 4, tpT: 3, fence: null, attackT: 1.5, runDir: 1
      });
      var m = SH.mons[SH.mons.length - 1], a = rnd(0, 2 * PI);
      m.vx = Math.cos(a); m.vy = Math.sin(a);
    } else {
      SH.gadgets.push({ k: cell.k, x: x, y: y, firedT: 99 });
      if (cell.k === 'wall') SH.walls.push({ x: x, y: y });
    }
  }
  for (var s = 0; s < 2; s++) for (i = 0; i < 6; i++) {
    SH.fences.push({ side: s ? 'bottom' : 'top', i: i, x: 110 + 100 * i, y: s ? 1005 : 255, broken: false });
    SH.visitors.push({ side: s ? 'bottom' : 'top', i: i, x: 110 + 100 * i, y: s ? 1080 : 190, mode: 'watch', timer: 0 });
  }
  go('show');
}

function inWall(x, y, r) {
  for (var i = 0; i < SH.walls.length; i++) {
    var w = SH.walls[i];
    if (Math.abs(x - w.x) < 80 + r && Math.abs(y - w.y) < 70 + r) return true;
  }
  return false;
}
function moveShow(m, dx, dy) {
  var res = { bx: false, by: false }, r = 30, wr = 24;
  var nx = clamp(m.x + dx, AX0 + r, AX1 - r);
  if (nx !== m.x + dx) res.bx = true;
  if (!inWall(nx, m.y, wr)) m.x = nx; else res.bx = true;
  var ny = clamp(m.y + dy, AY0 + r, AY1 - r);
  if (ny !== m.y + dy) res.by = true;
  if (!inWall(m.x, ny, wr)) m.y = ny; else res.by = true;
  if (dx) m.dir = sign(dx);
  return res;
}
function freeShowPoint(x, y) {
  return x >= AX0 + 30 && x <= AX1 - 30 && y >= AY0 + 30 && y <= AY1 - 30 && !inWall(x, y, 24);
}
function activeMons(except) {
  var out = [];
  for (var i = 0; i < SH.mons.length; i++) if (SH.mons[i] !== except && SH.mons[i].mode === 'roam') out.push(SH.mons[i]);
  return out;
}
function nearestMon(m, x, y) {
  var best = null, bd = 1e9, l = activeMons(m);
  for (var i = 0; i < l.length; i++) { var d = dist(l[i].x, l[i].y, x, y); if (d < bd) { bd = d; best = l[i]; } }
  return best;
}
function gadgetsOf(k) { return SH.gadgets.filter(function (g) { return g.k === k; }); }
function nearestG(m, k, maxD) {
  var best = null, bd = maxD || 1e9, l = gadgetsOf(k);
  for (var i = 0; i < l.length; i++) { var d = dist(l[i].x, l[i].y, m.x, m.y); if (d <= bd) { bd = d; best = l[i]; } }
  return best;
}
function approach(m, tx, ty, speed, stop, dt) {
  var d = dist(m.x, m.y, tx, ty);
  if (d > stop && d > 0.01) moveShow(m, (tx - m.x) / d * speed * dt, (ty - m.y) / d * speed * dt);
}
function showRoam(m, dt) {
  m.roamT -= dt;
  if (m.roamT <= 0) { var a = rnd(0, 2 * PI); m.rvx = Math.cos(a); m.rvy = Math.sin(a); m.roamT = rnd(2, 3); }
  moveShow(m, m.rvx * 40 * dt, m.rvy * 40 * dt);
}

function showHabit(m, dt) {
  var sp = m.sp, bait, tg, d;
  if (sp === 'fire') {
    bait = nearestG(m, 'bait', 260);
    if (bait) approach(m, bait.x, bait.y, 60, 60, dt);
    else {
      tg = nearestG(m, 'drum') || nearestMon(m, m.x, m.y);
      if (tg) approach(m, tg.x, tg.y, 70, 80, dt); else showRoam(m, dt);
    }
  } else if (sp === 'water') {
    bait = nearestG(m, 'bait', 260);
    if (bait) approach(m, bait.x, bait.y, 60, 60, dt);
    else {
      tg = nearestG(m, 'drum') || nearestMon(m, m.x, m.y);
      if (!tg) showRoam(m, dt);
      else {
        d = dist(m.x, m.y, tg.x, tg.y);
        if (d < 220 && d > 0.01) moveShow(m, (m.x - tg.x) / d * 60 * dt, (m.y - tg.y) / d * 60 * dt);
        else if (d > 320) approach(m, tg.x, tg.y, 40, 0, dt);
      }
    }
  } else if (sp === 'thunder') {
    if (m.dashT > 0) {
      m.dashT -= dt;
      var r = moveShow(m, m.dvx * 600 * dt, m.dvy * 600 * dt);
      if (r.bx || r.by) m.dashT = 0;
    } else {
      m.dashCd -= dt;
      if (m.dashCd <= 0) {
        m.dashCd = 2; m.dashT = 0.3;
        var b = nearestG(m, 'bait'), a;
        if (b && dist(m.x, m.y, b.x, b.y) > 80) a = Math.atan2(b.y - m.y, b.x - m.x) + rnd(-30, 30) * PI / 180;
        else a = rnd(0, 2 * PI);
        m.dvx = Math.cos(a); m.dvy = Math.sin(a);
        if (m.dvx) m.dir = sign(m.dvx);
      }
    }
  } else if (sp === 'spike') {
    bait = nearestG(m, 'bait', 260);
    if (bait) approach(m, bait.x, bait.y, 60, 60, dt);
    else {
      m.turnT -= dt;
      if (m.turnT <= 0) { var a2 = rnd(0, 2 * PI); m.vx = Math.cos(a2); m.vy = Math.sin(a2); m.turnT = 4; }
      var res = moveShow(m, m.vx * 110 * dt, m.vy * 110 * dt);
      if (res.bx) m.vx = -m.vx;
      if (res.by) m.vy = -m.vy;
      for (var i = 0; i < SH.gadgets.length; i++) {
        var g = SH.gadgets[i];
        if (g.k === 'wall') continue;
        var dd = dist(m.x, m.y, g.x, g.y);
        if (dd <= 40 && dd > 0.01 && (m.vx * (g.x - m.x) + m.vy * (g.y - m.y)) > 0) {
          // 沿連心線法線反射
          var nx = (m.x - g.x) / dd, ny = (m.y - g.y) / dd, dot = m.vx * nx + m.vy * ny;
          m.vx -= 2 * dot * nx; m.vy -= 2 * dot * ny;
        }
      }
    }
  } else if (sp === 'ghost') {
    m.tpT -= dt;
    if (m.tpT <= 0) {
      m.tpT = 3;
      var fs = gadgetsOf('fountain'), px, py, ok = false;
      for (var t = 0; t < 20 && !ok; t++) {
        if (fs.length) {
          var f = fs[Math.floor(Math.random() * fs.length)], aa = rnd(0, 2 * PI), rr = rnd(80, 140);
          px = f.x + Math.cos(aa) * rr; py = f.y + Math.sin(aa) * rr;
        } else { px = rnd(AX0 + 30, AX1 - 30); py = rnd(AY0 + 30, AY1 - 30); }
        ok = freeShowPoint(px, py);
      }
      if (ok) { m.x = px; m.y = py; }
    }
  }
}

function boostedG(g) {
  for (var i = 0; i < SH.mons.length; i++) {
    var m = SH.mons[i];
    if (m.sp === 'stone' && m.mode === 'roam' && dist(m.x, m.y, g.x, g.y) <= 200) return true;
  }
  return false;
}

function applyRage(m, delta, type) {
  if (m.mode !== 'roam') return;
  if (m.marks > 0) {
    if (type === 'ignite') { m.marks++; m.markLeft = 4; if (m.marks >= 5) goLoose(m); }
    else { m.marks--; m.markLeft = 4; if (m.marks <= 0) { m.marks = 0; m.markLeft = 0; m.slow = true; } }
  } else {
    m.rage = clamp(m.rage + delta, 0, 100);
    if (m.rage >= 100 && delta > 0) { m.marks = 1; m.markLeft = 4; m.slow = false; }
  }
  m.fx = type === 'ignite' ? 'ignited' : 'doused'; m.fxT = 0;
}
function goLoose(m) {
  m.mode = 'charge'; m.marks = 0; m.markLeft = 0; m.rage = 100; m.chargeT = 0; m.looseT = 0; m.performT = -1;
  var side = m.y < 630 ? 'top' : 'bottom';
  var idx = clamp(Math.round((m.x - 110) / 100), 0, 5);
  for (var i = 0; i < SH.fences.length; i++) if (SH.fences[i].side === side && SH.fences[i].i === idx) m.fence = SH.fences[i];
}
var ATK_TYPE = { firering: 'ignite', thunder: 'ignite', quake: 'ignite', spike: 'ignite', waterball: 'douse', wisp: 'douse' };
var ATK_DELTA = { firering: 15, thunder: 15, quake: 15, spike: 10, waterball: -20, wisp: -15 };
function showHit(h, m) {
  if (h.cast) {
    if (h.cast.hit.indexOf(m) >= 0) return;
    h.cast.hit.push(m);
  }
  applyRage(m, ATK_DELTA[h.kind], ATK_TYPE[h.kind]);
}
function finalizeCast(c) {
  if (c.done) return;
  c.done = true;
  var o = c.owner, n = c.hit.length, S = SP[o.sp];
  var g = Math.round(S.gold * (1 + 0.5 * n) * (c.red ? 2 : 1) * Math.min(3, 1 + G.rep / 200));
  addGold(g); addRep(S.rep);
  if (n > G.bestHits) G.bestHits = n;
  floatText(o.x, o.y - 70, '+' + g + (c.red ? ' ×2' : ''), c.red ? 'redGold' : 'gold');
  if (n >= 2) floatText(o.x, o.y - 100, '波及 ' + n, 'splash');
}

function updVisitorsAndFx(dt) {
  var i;
  for (i = 0; i < SH.visitors.length; i++) {
    var v = SH.visitors[i];
    if (v.mode === 'watch') continue;
    v.timer += dt;
    if (v.mode === 'scared' && v.timer > 0.5) v.mode = 'empty';
    if (v.timer >= 4) { v.mode = 'watch'; v.timer = 0; }
  }
  for (i = SH.pulses.length - 1; i >= 0; i--) { SH.pulses[i].t += dt; if (SH.pulses[i].t >= SH.pulses[i].dur) SH.pulses.splice(i, 1); }
  for (i = 0; i < SH.gadgets.length; i++) SH.gadgets[i].firedT += dt;
}

function updLoose(m, dt) {
  var top = m.y < 630 || (m.fence && m.fence.side === 'top');
  if (m.mode === 'charge') {
    var f = m.fence, side = f.side;
    var ty = side === 'top' ? f.y + 28 : f.y - 28, tx = f.x;
    var d = dist(m.x, m.y, tx, ty);
    if (d > 6) {
      m.x += (tx - m.x) / d * 160 * dt; m.y += (ty - m.y) / d * 160 * dt;
      if (tx !== m.x) m.dir = sign(tx - m.x) || m.dir;
    } else if (f.broken) { m.mode = 'loose'; m.looseT = 0; m.attackT = 1.5; m.runDir = Math.random() < 0.5 ? -1 : 1; }
    else {
      m.chargeT += dt;
      if (m.chargeT >= 1.5) { f.broken = true; m.chargeT = 0; m.mode = 'loose'; m.looseT = 0; m.attackT = 1.5; m.runDir = Math.random() < 0.5 ? -1 : 1; }
    }
  } else {
    var seatY = m.fence.side === 'top' ? 190 : 1080;
    m.looseT += dt;
    if (Math.abs(m.y - seatY) > 2) m.y += sign(seatY - m.y) * Math.min(160 * dt, Math.abs(seatY - m.y));
    m.x += m.runDir * 140 * dt; m.dir = m.runDir;
    if (m.x > 610) { m.x = 610; m.runDir = -1; }
    if (m.x < 110) { m.x = 110; m.runDir = 1; }
    m.attackT -= dt;
    if (m.attackT <= 0) {
      m.attackT = 1.5;
      var best = null, bd = 1e9;
      for (var i = 0; i < SH.visitors.length; i++) {
        var v = SH.visitors[i];
        if (v.side !== m.fence.side || v.mode !== 'watch') continue;
        var dd = Math.abs(v.x - m.x);
        if (dd <= 70 && dd < bd) { bd = dd; best = v; }
      }
      if (best) { best.mode = 'scared'; best.timer = 0; addRep(-3); floatText(best.x, best.y, '名聲 -3', 'repDown'); }
    }
    if (m.looseT >= 6) {
      m.mode = 'roam'; m.x = 360; m.y = 630; m.rage = 30; m.marks = 0; m.markLeft = 0; m.slow = false;
      m.performCd = 3; m.fence = null; m.looseT = 0; m.chargeT = 0;
    }
  }
}

function updShow(dt) {
  var i, m;
  SH.t += dt;
  updFloats(dt);
  updVisitorsAndFx(dt);

  // 機關脈衝
  while (SH.t >= SH.pulseNext) {
    SH.pulseNext += 3;
    for (i = 0; i < SH.gadgets.length; i++) {
      var g = SH.gadgets[i];
      if (g.k !== 'drum' && g.k !== 'fountain') continue;
      var bo = boostedG(g);
      g.firedT = 0;
      SH.pulses.push({ x: g.x, y: g.y, kind: g.k, radius: 160, boosted: bo, t: 0, dur: 0.4 });
      for (var k = 0; k < SH.mons.length; k++) {
        var mm = SH.mons[k];
        if (mm.mode !== 'roam' || dist(mm.x, mm.y, g.x, g.y) > 160) continue;
        if (g.k === 'drum') applyRage(mm, bo ? 30 : 15, 'ignite');
        else applyRage(mm, bo ? -40 : -20, 'douse');
      }
    }
  }

  var list = SH.mons.slice();
  for (i = 0; i < list.length; i++) {
    m = list[i];
    if (m.fxT < 0.5) { m.fxT += dt; if (m.fxT >= 0.5) m.fx = 'none'; }
    if (m.performT >= 0) { m.performT += dt; if (m.performT >= 0.5) m.performT = -1; }
    if (m.mode !== 'roam') { updLoose(m, dt); continue; }
    // 怒氣自然變化
    if (m.marks > 0) {
      m.rage = 100;
      m.markLeft -= dt;
      if (m.markLeft <= 0) {
        m.marks--; m.markLeft = 4;
        if (m.marks <= 0) { m.marks = 0; m.markLeft = 0; m.slow = true; }
      }
    } else if (m.slow) {
      m.rage = Math.max(0, m.rage - 2 * dt);
      if (m.rage < m.redLow) m.slow = false;
    } else m.rage = Math.max(0, m.rage - SP[m.sp].decay * dt);
    // 習性
    showHabit(m, dt);
    // 表演
    var iv = m.rage >= 50 ? 3 - 2 * (m.rage - 50) / 50 : 3;
    if (m.rage < 50) m.performCd = 3;
    else {
      if (m.performCd > iv) m.performCd = iv;
      m.performCd -= dt;
      if (m.performCd <= 0) { doPerform(m); m.performCd = iv; }
    }
  }
  updHazards(dt, true);

  if (SH.t >= 45) endShow();
}
function doPerform(m) {
  var cast = { owner: m, hit: [], live: 0, red: m.rage >= m.redLow, done: false };
  SH.casts.push(cast);
  m.performT = 0;
  var o = nearestMon(m, m.x, m.y), tx = o ? o.x : 360, ty = o ? o.y : 630;
  spawnSkill(m, tx, ty, cast);
  if (cast.live <= 0) finalizeCast(cast);
}
function endShow() {
  var i;
  for (i = 0; i < SH.casts.length; i++) finalizeCast(SH.casts[i]);
  for (i = 0; i < SH.mons.length; i++) if (SH.mons[i].mode !== 'roam') addRep(-5);
  hazards = [];
  G.panel = null;
  if (G.day >= DAYS) {
    G.stars = G.rep >= 800 ? 3 : (G.rep >= 450 ? 2 : (G.rep >= 200 ? 1 : 0));
    floats = [];
    go('result');
  } else { floats = []; G.shopIdx = 0; go('shop'); }
}

// ============================================================
// 商店
// ============================================================
function shopCost(item) {
  if (WEAPON_PRICE[item] !== undefined) return WEAPON_PRICE[item];
  if (item === 'attack') return G.upCost.attack;
  if (item === 'armor') return G.upCost.armor;
  return G.upCost.rope;
}
function updShop() {
  if (pressed('ArrowUp')) G.shopIdx = (G.shopIdx + 7) % 8;
  if (pressed('ArrowDown')) G.shopIdx = (G.shopIdx + 1) % 8;
  if (pressed('KeyX')) { openGuide('shop'); return; }
  if (!pressed('KeyZ')) return;
  if (G.shopIdx === 7) { G.day++; go('select'); return; }
  var it = SHOP_ITEMS[G.shopIdx], cost = shopCost(it);
  if (WEAPON_PRICE[it] !== undefined) {
    if (G.owned[it]) G.weapon = it;
    else if (G.gold >= cost) { G.gold -= cost; G.owned[it] = true; G.weapon = it; }
  } else if (G.gold >= cost) {
    G.gold -= cost;
    var key = it === 'attack' ? 'attack' : (it === 'armor' ? 'armor' : 'rope');
    G.up[key]++; G.upCost[key] = Math.round(G.upCost[key] * 1.5);
  }
}

// ============================================================
// 說明頁
// ============================================================
function openGuide(ret) { G.guideRet = ret; G.page = 0; go('guide'); }
function closeGuide() {
  if (G.guideFirst) { G.guideFirst = false; go('select'); } else go(G.guideRet);
}
function updGuide() {
  if (pressed('ArrowLeft') && G.page > 0) G.page--;
  else if (pressed('ArrowRight') && G.page < GUIDE.length - 1) G.page++;
  else if (pressed('KeyX')) closeGuide();
  else if (pressed('KeyZ')) {
    if (G.page < GUIDE.length - 1) G.page++; else closeGuide();
  }
}

// ============================================================
// 總更新
// ============================================================
function update(dt) {
  switch (G.phase) {
    case 'guide': updGuide(); break;
    case 'select': updSelect(); break;
    case 'dungeon': updDungeon(dt); break;
    case 'setup1': updSetup1(); break;
    case 'setup2': updSetup2(); break;
    case 'show': updShow(dt); break;
    case 'shop': updShop(); break;
    case 'result':
      if (pressed('KeyZ')) { newGame(); go('select'); }
      break;
  }
  edge = {};
}

// ============================================================
// 繪製(只依狀態呼叫 Art)
// ============================================================
function hudMessage() {
  switch (G.phase) {
    case 'select': return '↑↓ 選擇 Z 進入 X 說明';
    case 'dungeon':
      if (D && D.lasso) return '繞牠一圈!';
      if (D && D.ring) return '站住別動';
      return 'Z 攻擊 X 武器技';
    case 'setup1': return '方向鍵選 Z 上場/下場 X 說明';
    case 'setup2':
      if (G.panel) return '↑↓ 選 Z 確定 X 取消';
      if (G.s2cur === 12) return 'Z 開演 X 回上一步';
      return '方向鍵選格子 Z 擺放 X 清空';
    case 'show': return '表演中…';
    case 'shop': return '↑↓ 選擇 Z 購買/裝備 X 說明';
    case 'result': return 'Z 重來';
  }
  return '';
}
function drawHud() {
  var dun = G.phase === 'dungeon';
  Art.drawHud(ctx, {
    phase: G.phase, day: G.day, dayMax: DAYS, gold: G.gold, rep: G.rep,
    hearts: dun ? T.hearts : 0, maxHearts: dun ? T.maxHearts : 0,
    ropes: dun ? T.ropes : 0, ropeMax: dun ? maxRopesNow() : 0, weapon: G.weapon,
    xCdLeft: dun ? Math.max(0, T.xCd) : 0, xCdMax: dun ? xCdMax() : 0,
    timeLeft: dun ? Math.max(0, D.time) : (G.phase === 'show' ? Math.max(0, 45 - SH.t) : 0),
    timeMax: dun ? 60 : (G.phase === 'show' ? 45 : 0),
    dungeon: dun ? D.id : '', message: hudMessage()
  });
}
function drawFloats() {
  for (var i = 0; i < floats.length; i++) {
    var f = floats[i];
    Art.drawFloatText(ctx, { x: f.x, y: f.y, text: f.text, kind: f.kind, t: f.t, dur: f.dur });
  }
}
function drawHazard(h, oy) {
  Art.drawHazard(ctx, { x: h.x, y: h.y + oy, kind: h.kind, phase: h.phase, radius: h.radius, t: h.t, dur: h.dur, angle: h.angle, reflected: !!h.reflected });
}
function drawHazards(oy) {
  var i, h;
  for (i = 0; i < hazards.length; i++) { h = hazards[i]; if (!isProj(h)) drawHazard(h, oy); }
}
function drawProjectiles(oy) {
  for (var i = 0; i < hazards.length; i++) if (isProj(hazards[i])) drawHazard(hazards[i], oy);
}
function wildState(m) {
  return {
    x: m.x, y: m.y + OY, species: m.sp, hp: m.hp, maxHp: m.maxHp, hit: m.hitT > 0, weak: isWeak(m),
    stunLeft: Math.max(0, m.stun), stunDur: 2, lassoed: m.lassoed, casting: m.castFlash > 0 || hasWarn(m),
    dashing: m.dashT > 0, dir: m.dir
  };
}
function hasWarn(m) {
  for (var i = 0; i < hazards.length; i++) if (hazards[i].owner === m && hazards[i].phase === 'warn') return true;
  return false;
}
function showState(m, x, y) {
  var perf = m.performT >= 0 && m.performT < 0.5;
  return {
    x: x !== undefined ? x : m.x, y: y !== undefined ? y : m.y, species: m.sp, level: m.level, rage: m.rage, redLow: m.redLow,
    marks: m.marks, markLeft: m.marks > 0 ? m.markLeft : 0, markDur: 4, mode: m.mode,
    performing: perf, performT: perf ? m.performT : 0, performDur: 0.5,
    fx: m.fx, fxT: m.fx === 'none' ? 0 : m.fxT, fxDur: 0.5,
    chargeT: m.mode === 'charge' ? m.chargeT : 0, chargeDur: 1.5,
    looseT: m.mode === 'loose' ? m.looseT : 0, looseDur: 6,
    dashing: m.dashT > 0, dir: m.dir
  };
}

function renderDungeon() {
  var r, c, i;
  for (r = 0; r < 19; r++) for (c = 0; c < 12; c++) {
    var t = D.grid[r][c];
    Art.drawTile(ctx, { x: c * TS + 30, y: r * TS + 30 + OY, dungeon: D.id, kind: t.kind, room: t.room, nest: t.nest });
  }
  if (D.lasso) {
    var L = D.lasso;
    Art.drawLasso(ctx, { x1: T.x, y1: T.y + OY, x2: L.mon.x, y2: L.mon.y + OY, progress: Math.min(1, Math.abs(L.sum) / (2 * PI)), t: L.t, limit: L.limit, len: dist(T.x, T.y, L.mon.x, L.mon.y), maxLen: 220 });
  }
  drawHazards(OY);
  var ms = D.mons.slice().sort(function (a, b) { return a.y - b.y; });
  for (i = 0; i < ms.length; i++) Art.drawWildMonster(ctx, wildState(ms[i]));
  if (D.ring) Art.drawCaptureRing(ctx, { x: D.ring.mon.x, y: D.ring.mon.y + OY, t: D.ring.t, dur: D.ring.dur });
  drawProjectiles(OY);
  Art.drawTamer(ctx, { x: T.x, y: T.y + OY, facing: T.facing, weapon: G.weapon, dashing: !!T.dash, blink: T.invuln > 0, lassoing: !!D.lasso });
  for (i = 0; i < D.fxs.length; i++) {
    var f = D.fxs[i];
    Art.drawWeaponFx(ctx, { x: f.x, y: f.y + OY, weapon: f.weapon, move: f.move, shape: f.shape, angle: f.angle, spread: f.spread || 0, radius: f.radius || 0, length: f.length || 0, width: f.width || 0, t: f.t, dur: f.dur });
  }
  drawFloats();
}

function renderSetupField() {
  Art.drawShowArena(ctx, {});
  var i;
  for (i = 0; i < 12; i++) Art.drawSetupCell(ctx, { x: cellX(i % 3), y: cellY(Math.floor(i / 3)), selected: G.phase === 'setup2' && G.s2cur === i });
  for (i = 0; i < 12; i++) {
    var cell = G.cells[i];
    if (!cell) continue;
    var x = cellX(i % 3), y = cellY(Math.floor(i / 3));
    if (cell.t === 'g') Art.drawGadget(ctx, { x: x, y: y, kind: cell.k, fired: false, boosted: false });
    else {
      var l = lvl(cell.sp);
      Art.drawShowMonster(ctx, showState({ sp: cell.sp, level: l, rage: 40, redLow: 80 - 5 * l, marks: 0, markLeft: 0, mode: 'roam', performT: -1, fx: 'none', fxT: 0, chargeT: 0, looseT: 0, dashT: 0, dir: 1 }, x, y));
    }
  }
}

function renderShow() {
  var i, k;
  Art.drawShowArena(ctx, {});
  for (i = 0; i < SH.visitors.length; i++) {
    var v = SH.visitors[i];
    Art.drawVisitor(ctx, { x: v.x, y: v.y, side: v.side, mode: v.mode });
  }
  for (i = 0; i < SH.fences.length; i++) {
    var f = SH.fences[i];
    Art.drawFence(ctx, { x: f.x, y: f.y, side: f.side, broken: f.broken });
  }
  for (i = 0; i < SH.gadgets.length; i++) {
    var g = SH.gadgets[i];
    if (g.k === 'drum' || g.k === 'fountain') {
      for (k = 0; k < SH.mons.length; k++) {
        var s = SH.mons[k];
        if (s.sp === 'stone' && s.mode === 'roam' && dist(s.x, s.y, g.x, g.y) <= 200) Art.drawBoostLink(ctx, { x1: s.x, y1: s.y, x2: g.x, y2: g.y });
      }
    }
  }
  for (i = 0; i < SH.gadgets.length; i++) {
    var gg = SH.gadgets[i], fired = (gg.k === 'drum' || gg.k === 'fountain') && gg.firedT <= 0.3;
    Art.drawGadget(ctx, { x: gg.x, y: gg.y, kind: gg.k, fired: fired, boosted: (gg.k === 'drum' || gg.k === 'fountain') ? boostedG(gg) : false });
  }
  for (i = 0; i < SH.pulses.length; i++) {
    var p = SH.pulses[i];
    Art.drawGadgetPulse(ctx, { x: p.x, y: p.y, kind: p.kind, radius: p.radius, boosted: p.boosted, t: p.t, dur: p.dur });
  }
  drawHazards(0);
  var ms = SH.mons.slice().sort(function (a, b) { return a.y - b.y; });
  for (i = 0; i < ms.length; i++) Art.drawShowMonster(ctx, showState(ms[i]));
  drawProjectiles(0);
  drawFloats();
}

function wrapGuideText(text, x, y, maxW, lh) {
  var line = '', yy = y;
  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (ctx.measureText(line + ch).width > maxW && line) { ctx.fillText(line, x, yy); line = ch; yy += lh; }
    else line += ch;
  }
  if (line) ctx.fillText(line, x, yy);
}
function renderGuide() {
  var pg = GUIDE[G.page], last = G.page === GUIDE.length - 1;
  Art.drawBackground(ctx, {});
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.fillStyle = '#fff';
  var FF = '"Microsoft JhengHei","PingFang TC",sans-serif';
  ctx.font = 'bold 40px ' + FF;
  ctx.strokeText('習性相性秀 — 玩家說明', 360, 60); ctx.fillText('習性相性秀 — 玩家說明', 360, 60);
  ctx.font = 'bold 46px ' + FF;
  ctx.strokeText(pg.title, 360, 140); ctx.fillText(pg.title, 360, 140);
  ctx.font = 'bold 30px ' + FF;
  ctx.textBaseline = 'alphabetic';
  var lines = [];
  // 說明文字區 y 185~255, 圖框 y 280~1000
  ctx.strokeText(pg.text, 360, 235); ctx.fillText(pg.text, 360, 235);
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 32px ' + FF;
  var foot = (G.page + 1) + ' / ' + GUIDE.length;
  ctx.strokeText(foot, 360, 1040); ctx.fillText(foot, 360, 1040);
  ctx.font = 'bold 28px ' + FF;
  var tip = (G.page > 0 ? '← 上一頁    ' : '') + (last ? 'Z 開始遊戲' : 'Z 下一頁(按 Z 繼續)');
  ctx.strokeText(tip, 360, 1100); ctx.fillText(tip, 360, 1100);
  ctx.font = '24px ' + FF;
  var tip2 = G.guideFirst ? 'X 跳過說明' : 'X 關閉說明';
  ctx.strokeText(tip2, 360, 1150); ctx.fillText(tip2, 360, 1150);
  ctx.restore();
  Art.drawGuidePage(ctx, { page: G.page + 1, x: 60, y: 280, w: 600, h: 720 });
}

function render() {
  var i;
  if (G.phase === 'guide') { renderGuide(); return; }
  Art.drawBackground(ctx, {});
  switch (G.phase) {
    case 'select':
      for (i = 0; i < 3; i++) {
        var id = DUN_ORDER[i];
        Art.drawDungeonCard(ctx, { x: 360, y: 330 + 310 * i, dungeon: id, open: G.unlocked[id], condition: G.unlocked[id] ? '' : condText(id), selected: G.selIdx === i });
      }
      break;
    case 'dungeon': renderDungeon(); break;
    case 'setup1':
      for (i = 0; i < G.roster.length; i++) {
        var r = G.roster[i];
        Art.drawRosterCard(ctx, { x: 195 + 330 * (i % 2), y: 300 + 230 * Math.floor(i / 2), species: r.sp, level: r.level, picked: !!G.picked[r.sp], selected: G.s1cur === i });
      }
      Art.drawButton(ctx, { x: 160, y: 1100, w: 400, h: 100, label: '下一步', selected: G.s1cur === G.roster.length });
      break;
    case 'setup2':
      renderSetupField();
      var placed = 0;
      for (i = 0; i < 12; i++) if (G.cells[i] && G.cells[i].t === 'm') placed++;
      Art.drawSetupInfo(ctx, { x: 260, y: 1210, gold: G.gold, placed: placed, picked: pickedList().length });
      Art.drawButton(ctx, { x: 480, y: 1160, w: 180, h: 100, label: '開演', selected: G.s2cur === 12 });
      break;
    case 'show': renderShow(); break;
    case 'shop':
      for (i = 0; i < 7; i++) {
        var it = SHOP_ITEMS[i], cost = shopCost(it), isW = WEAPON_PRICE[it] !== undefined;
        var level = it === 'attack' ? G.up.attack : (it === 'armor' ? G.up.armor : (it === 'ropeBag' ? G.up.rope : 0));
        Art.drawShopItem(ctx, { x: 360, y: 200 + 125 * i, item: it, cost: cost, level: level, owned: isW ? !!G.owned[it] : false, equipped: isW && G.weapon === it, affordable: isW && G.owned[it] ? true : G.gold >= cost, selected: G.shopIdx === i });
      }
      Art.drawButton(ctx, { x: 160, y: 1110, w: 400, h: 100, label: '出發', selected: G.shopIdx === 7 });
      break;
    case 'result':
      Art.drawResultPanel(ctx, { rep: G.rep, goldEarned: G.goldEarned, bestHits: G.bestHits, roster: G.roster.map(function (q) { return { species: q.sp, level: q.level }; }), stars: G.stars });
      break;
  }
  drawHud();
  if (G.phase === 'setup2' && G.panel) {
    Art.drawPickerPanel(ctx, { options: G.panel.options, index: G.panel.index });
  }
}

// ============================================================
// 主迴圈
// ============================================================
var last = null;
function frame(ts) {
  requestAnimationFrame(frame);
  if (last === null) last = ts;
  var dt = (ts - last) / 1000;
  last = ts;
  if (!(dt > 0)) dt = 0;
  if (dt > 1 / 30) dt = 1 / 30;
  try { update(dt); render(); } catch (e) { console.error(e); }
}
requestAnimationFrame(frame);

})();
