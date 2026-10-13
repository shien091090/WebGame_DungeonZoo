/* 連鎖機關秀 — 玩法驗證 Demo。邏輯與繪製分離: 先 update 再依狀態呼叫 Art.drawXxx */
(function () {
'use strict';

var CW = Art.canvas.width, CH = Art.canvas.height;
var OY = 130; // 地下城畫面 y = 世界 y + 130
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var dpr = window.devicePixelRatio || 1;
canvas.width = CW * dpr;
canvas.height = CH * dpr;
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

/* ---------- 佔位圖形(style.md / interface.json 沒有的) ---------- */
var Placeholder = {
  // 說明頁的頁標題、說明文字、頁碼、翻頁提示(依任務分工由 RD 畫)
  guide: function (c, page, total, title, text, last) {
    c.save();
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#ffe9a8';
    c.font = 'bold 56px sans-serif';
    c.fillText(title, CW / 2, 170, 640);
    c.fillStyle = '#ffffff';
    c.font = '34px sans-serif';
    c.fillText(text, CW / 2, 245, 660);
    c.fillStyle = '#cccccc';
    c.font = '28px sans-serif';
    c.fillText('第 ' + (page + 1) + ' / ' + total + ' 頁', CW / 2, 1110);
    c.font = '26px sans-serif';
    c.fillText((last ? '按 Z 開始遊戲' : '按 Z 繼續') + (page > 0 ? '   X 上一頁' : ''), CW / 2, 1160);
    c.restore();
  }
};

/* ---------- 資料 ---------- */
var ORDER = ['fire', 'water', 'thunder', 'spike', 'stone', 'ghost'];
var SP = {
  fire:    { name: '火蜥蜴', hp: 10, interval: 2.4, decay: 4, showGold: 5, rep: 1, kill: 4 },
  water:   { name: '水母',   hp: 7,  interval: 1.6, decay: 6, showGold: 3, rep: 1, kill: 4 },
  thunder: { name: '雷鳥',   hp: 14, interval: 2.6, decay: 8, showGold: 7, rep: 2, kill: 6 },
  spike:   { name: '刺蝟',   hp: 12, interval: 2.2, decay: 5, showGold: 5, rep: 1, kill: 6 },
  stone:   { name: '石像鬼', hp: 22, interval: 3.0, decay: 1, showGold: 6, rep: 2, kill: 8 },
  ghost:   { name: '幽靈',   hp: 16, interval: 2.8, decay: 3, showGold: 6, rep: 2, kill: 8 }
};
var DNAMES = { cave: '濕熱洞窟', cliff: '雷鳴崖', ruins: '古代遺跡' };
var DLIST = ['cave', 'cliff', 'ruins'];
var DSP = { cave: ['fire', 'water'], cliff: ['thunder', 'spike'], ruins: ['stone', 'ghost'] };
var UNLOCK = {
  cave: null,
  cliff: { cost: 60, sp: 'water', n: 2 },
  ruins: { cost: 120, sp: 'spike', n: 2 }
};
var MAPTOP = {
  cave: ['############', '#LL......LL#', '#L..f..f..L#', '#..........#', '#.L......L.#', '#..........#',
         '#####..#####', '#..WW......#', '#.j....WW..#', '#......j...#', '#.WW.......#', '#.....WW...#'],
  cliff: ['############', '#..t....t..#', '#.o......o.#', '#..........#', '#.o......o.#', '#..........#',
          '#####..#####', '#..........#', '#.h......h.#', '#...oo.....#', '#.......oo.#', '#..........#'],
  ruins: ['############', '#..........#', '#.g..o...g.#', '#....L.....#', '#.o......o.#', '#..........#',
          '#####..#####', '#..........#', '#.p..oo..p.#', '#..........#', '#.L......L.#', '#..........#']
};
var MAPCOMMON = ['#####..#####', '#..........#', '#..........#', '#....S.....#', '#..........#', '#..........#', '############'];
var NESTCH = { f: 'fire', j: 'water', t: 'thunder', h: 'spike', g: 'stone', p: 'ghost' };

var WEAPONS = {
  club:  { name: '棍棒', price: 0,  zCd: 0.35, xCd: 0,   dmg: 2 },
  sword: { name: '劍',   price: 60, zCd: 0.35, xCd: 3,   dmg: 2 },
  spear: { name: '長槍', price: 60, zCd: 0.45, xCd: 1.2, dmg: 2 },
  whip:  { name: '長鞭', price: 60, zCd: 0.4,  xCd: 1.2, dmg: 1 }
};
var WLIST = ['club', 'sword', 'spear', 'whip'];

var GADGETS = [
  { kind: 'drum',     name: '戰鼓',   cost: 15, desc: '每 3 秒讓周圍魔物生氣' },
  { kind: 'fountain', name: '噴泉',   cost: 15, desc: '每 3 秒讓周圍魔物冷靜' },
  { kind: 'bait',     name: '肉塊',   cost: 10, desc: '把附近魔物吸過來' },
  { kind: 'keg',      name: '火藥桶', cost: 10, desc: '被火、雷、震波、尖刺打中就爆炸' },
  { kind: 'wheel',    name: '水車',   cost: 10, desc: '被水彈、鬼火打中就潑水' },
  { kind: 'gong',     name: '銅鑼',   cost: 20, desc: '被技能打中就讓周圍魔物立刻表演' }
];
var GCOST = {}; var GNAME = {};
GADGETS.forEach(function (g) { GCOST[g.kind] = g.cost; GNAME[g.kind] = g.name; });
var GCD = { keg: 4, wheel: 4, gong: 3 };
var REACT = {
  keg: { firering: 1, thunder: 1, quake: 1, spike: 1 },
  wheel: { waterball: 1, wisp: 1 },
  gong: { firering: 1, thunder: 1, quake: 1, spike: 1, waterball: 1, wisp: 1 }
};
var IGN = { firering: 15, thunder: 15, quake: 15, spike: 10 };
var DOU = { waterball: 20, wisp: 15 };

var GUIDE = [
  { title: '地下城', text: '方向鍵走, Z 攻擊, X 武器技' },
  { title: '收服', text: '殘血時站上去, 再繞牠一圈' },
  { title: '布置', text: '開演前擺好魔物與機關, 開演後只能看' },
  { title: '紅區', text: '紅區最賺, 標記滿 5 個就失控' },
  { title: '目標', text: '7 天內賺到越多名聲越好' }
];

var DAYMAX = 7;
var ARENA = { x0: 60, x1: 660, y0: 270, y1: 990 };

/* ---------- 工具 ---------- */
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function dist(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }
function rnd(a, b) { return a + Math.random() * (b - a); }
function angNorm(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
function fAng(f) { return (f - 2) * Math.PI / 4; }
var FTAB = [7, 0, 1, 6, -1, 2, 5, 4, 3];
function hrOf(sp) { return sp === 'stone' ? 50 : 34; }
function rad(d) { return d * Math.PI / 180; }

/* ---------- 全域狀態 ---------- */
var G, D, SH, phase;
var keys = { up: false, down: false, left: false, right: false, z: false, x: false };
var lock = { z: false, x: false };
var press = [];
var guide = { page: 0, ret: 'select' };
var S1 = { cur: 0, picks: [] };
var S2 = { cur: { c: 0, r: 0 }, cells: [], panel: null, last: { c: 0, r: 0 } };
var shopCur = 0;
var selCur = 0;
var mapCache = {};

function newGame() {
  G = {
    day: 1, gold: 30, rep: 0, goldEarned: 0, bestChain: 0,
    weapon: 'club', owned: { club: true, sword: false, spear: false, whip: false },
    roster: { fire: 0 },
    caps: { fire: 0, water: 0, thunder: 0, spike: 0, stone: 0, ghost: 0 },
    upg: { attack: 0, armor: 0, ropeBag: 0 },
    price: { attack: 50, armor: 40, ropeBag: 40 },
    unlocked: { cave: true, cliff: false, ruins: false }
  };
  selCur = 0; shopCur = 0;
}
function lvOf(sp) { var v = G.roster[sp]; return v === undefined ? 0 : v; }
function maxHearts() { return 5 + G.upg.armor + lvOf('stone'); }
function maxRopes() { return 3 + G.upg.ropeBag; }
function atkBonus() { return G.upg.attack; }

function setPhase(p) {
  phase = p;
  lock.z = keys.z; lock.x = keys.x; // 轉場時還按著的鍵, 放開前不當動作
}

/* ---------- 輸入(只有方向鍵 + Z、X) ---------- */
var KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyZ: 'z', KeyX: 'x' };
function keyName(e) {
  if (KEYMAP[e.code]) return KEYMAP[e.code];
  if (e.key === 'z' || e.key === 'Z') return 'z';
  if (e.key === 'x' || e.key === 'X') return 'x';
  return null;
}
window.addEventListener('keydown', function (e) {
  var k = keyName(e);
  if (!k) return;
  e.preventDefault();
  if (e.repeat) return;
  keys[k] = true;
  press.push(k);
});
window.addEventListener('keyup', function (e) {
  var k = keyName(e);
  if (!k) return;
  e.preventDefault();
  keys[k] = false;
  if (k === 'z') lock.z = false;
  if (k === 'x') lock.x = false;
});
window.addEventListener('blur', function () {
  for (var k in keys) keys[k] = false;
  lock.z = false; lock.x = false;
});

/* ---------- 地圖 ---------- */
function buildMap(code) {
  if (mapCache[code]) return mapCache[code];
  var rows = MAPTOP[code].concat(MAPCOMMON);
  var grid = [], nests = [];
  for (var r = 0; r < rows.length; r++) {
    grid[r] = [];
    for (var c = 0; c < 12; c++) {
      var ch = rows[r].charAt(c);
      var kind = 'floor';
      if (ch === '#') kind = 'wall';
      else if (ch === 'o') kind = 'pillar';
      else if (ch === 'L') kind = 'lava';
      else if (ch === 'W') kind = 'water';
      var room = (r >= 1 && r <= 5) ? 'top' : ((r >= 7 && r <= 11) ? 'bottom' : 'hall');
      var nest = !!NESTCH[ch];
      grid[r][c] = { kind: kind, room: room, nest: nest };
      if (nest) nests.push({ sp: NESTCH[ch], x: c * 60 + 30, y: r * 60 + 30, room: room });
    }
  }
  mapCache[code] = { grid: grid, nests: nests };
  return mapCache[code];
}
function tileAt(x, y) {
  var c = Math.floor(x / 60), r = Math.floor(y / 60);
  if (r < 0 || r > 18 || c < 0 || c > 11) return { kind: 'wall' };
  return D.grid[r][c];
}
function solid(t) { return t.kind === 'wall' || t.kind === 'pillar'; }
function blocked(x, y, rr) {
  var c0 = Math.floor((x - rr) / 60), c1 = Math.floor((x + rr) / 60);
  var r0 = Math.floor((y - rr) / 60), r1 = Math.floor((y + rr) / 60);
  for (var r = r0; r <= r1; r++) {
    for (var c = c0; c <= c1; c++) {
      var t = (r < 0 || r > 18 || c < 0 || c > 11) ? { kind: 'wall' } : D.grid[r][c];
      if (!solid(t)) continue;
      var cx = clamp(x, c * 60, c * 60 + 60), cy = clamp(y, r * 60, r * 60 + 60);
      var dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy < rr * rr) return true;
    }
  }
  return false;
}
function roomBox(room) {
  return room === 'top' ? { x0: 60, x1: 660, y0: 60, y1: 360 } : { x0: 60, x1: 660, y0: 420, y1: 720 };
}

/* ---------- 地下城 ---------- */
function startDungeon(code) {
  var m = buildMap(code);
  D = {
    code: code, grid: m.grid, t: 60,
    nests: m.nests.map(function (n) { return { sp: n.sp, x: n.x, y: n.y, room: n.room, mon: null, timer: 0 }; }),
    mons: [], haz: [], fx: [], floats: [],
    tamer: { x: 330, y: 930, facing: 0, hearts: maxHearts(), inv: 0, dash: null, zCd: 0, xCd: 0 },
    ring: { target: null, t: 0 }, lasso: null, ropes: maxRopes(), nextId: 1
  };
  D.nests.forEach(function (n) { spawnWild(n); });
  setPhase('dungeon');
}
function spawnWild(n) {
  var s = SP[n.sp];
  var a = rnd(0, Math.PI * 2);
  var m = {
    id: D.nextId++, sp: n.sp, x: n.x, y: n.y, hp: s.hp, maxHp: s.hp, hitT: 0, stun: 0, lassoed: false,
    room: n.room, nest: n, cd: rnd(0.6, s.interval), roamT: 0, ra: a, dashCd: rnd(0.5, 2), dashT: 0, da: 0,
    vx: Math.cos(a) * 110, vy: Math.sin(a) * 110, dirT: 4, teleT: 3, dir: 1, kb: null
  };
  n.mon = m; n.timer = 0;
  D.mons.push(m);
}
function isWeak(m) { return m.hp <= m.maxHp * 0.3 + 1e-9; }
function isCasting(m) {
  for (var i = 0; i < D.haz.length; i++) if (D.haz[i].owner === m && D.haz[i].phase === 'warn' && !D.haz[i].dead) return true;
  return false;
}
function cancelWarn(m) {
  for (var i = 0; i < D.haz.length; i++) if (D.haz[i].owner === m && D.haz[i].phase === 'warn') D.haz[i].dead = true;
}
function removeMon(m) {
  var i = D.mons.indexOf(m);
  if (i >= 0) D.mons.splice(i, 1);
  if (m.nest) { m.nest.mon = null; m.nest.timer = 8; }
  if (D.ring.target === m) { D.ring.target = null; D.ring.t = 0; }
}
function dfloat(x, y, text, kind) { D.floats.push({ x: x, y: y, text: text, kind: kind, t: 0, dur: 1 }); }
function earn(g) { G.gold += g; G.goldEarned += g; }

function dmgMon(m, amt) {
  if (m.lassoed) return;
  m.hp -= amt;
  m.hitT = 0.1;
  if (D.ring.target === m) D.ring.t = 0;
  if (m.hp <= 0) {
    var g = SP[m.sp].kill;
    earn(g);
    dfloat(m.x, m.y - 40, '+' + g, 'gold');
    removeMon(m);
  }
}

function hurtTamer() {
  var t = D.tamer;
  if (t.inv > 0 || t.dash) return false;
  t.hearts--;
  t.inv = 1;
  if (D.lasso) breakLasso();
  return true;
}
function breakLasso() {
  if (D.lasso) { D.lasso.m.lassoed = false; D.lasso = null; }
}

function moveTamer(dx, dy) {
  var t = D.tamer;
  var nx = t.x + dx;
  if (!blocked(nx, t.y, 18)) t.x = nx;
  var ny = t.y + dy;
  if (!blocked(t.x, ny, 18)) t.y = ny;
}

function inShape(sh, m) {
  var t = D.tamer;
  var mr = hrOf(m.sp) * 0.7;
  var dx = m.x - t.x, dy = m.y - t.y;
  var d = Math.sqrt(dx * dx + dy * dy);
  if (sh.shape === 'circle') return d <= sh.radius + mr;
  if (sh.shape === 'arc') {
    if (d > sh.radius + mr) return false;
    if (d < mr) return true;
    var diff = Math.abs(angNorm(Math.atan2(dy, dx) - sh.angle));
    return diff <= sh.spread / 2 + Math.asin(Math.min(1, mr / d));
  }
  if (sh.shape === 'line') {
    var ca = Math.cos(sh.angle), sa = Math.sin(sh.angle);
    var along = dx * ca + dy * sa, perp = -dx * sa + dy * ca;
    return along >= -mr && along <= sh.length + mr && Math.abs(perp) <= sh.width / 2 + mr;
  }
  return false;
}
function addFx(shape, move, extra) {
  var t = D.tamer;
  var f = { x: t.x, y: t.y, weapon: G.weapon, move: move, shape: shape, angle: fAng(t.facing),
    spread: 0, radius: 0, length: 0, width: 0, t: 0, dur: 0.2 };
  for (var k in extra) f[k] = extra[k];
  D.fx.push(f);
  return f;
}
function attackZ() {
  var t = D.tamer, w = G.weapon, a = fAng(t.facing);
  var fb = 1 + 0.1 * lvOf('fire');
  var sh;
  if (w === 'club') sh = { shape: 'arc', angle: a, spread: rad(100), radius: 70 * fb };
  else if (w === 'sword') sh = { shape: 'arc', angle: a, spread: rad(120), radius: 80 * fb };
  else if (w === 'spear') sh = { shape: 'line', angle: a, length: 170 * fb, width: 40 };
  else sh = { shape: 'circle', angle: a, radius: 100 * fb };
  addFx(sh.shape, 'normal', sh);
  t.zCd = WEAPONS[w].zCd;
  var dmg = WEAPONS[w].dmg + atkBonus();
  D.mons.slice().forEach(function (m) { if (inShape(sh, m)) dmgMon(m, dmg); });
  if (w === 'sword') {
    D.haz.forEach(function (h) {
      if (h.dead || h.reflected || h.phase !== 'fly') return;
      var dx = h.x - t.x, dy = h.y - t.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d > sh.radius + h.radius) return;
      if (d > 8 && Math.abs(angNorm(Math.atan2(dy, dx) - a)) > sh.spread / 2 + 0.15) return;
      var ang;
      if (h.owner && D.mons.indexOf(h.owner) >= 0) ang = Math.atan2(h.owner.y - t.y, h.owner.x - t.x);
      else ang = h.angle + Math.PI;
      h.reflected = true; h.angle = ang; h.speed *= 1.2;
      h.vx = Math.cos(ang) * h.speed; h.vy = Math.sin(ang) * h.speed;
    });
  }
}
function attackX() {
  var t = D.tamer, w = G.weapon, a = fAng(t.facing);
  if (w === 'club') return;
  t.xCd = xCdMax();
  if (w === 'sword') {
    var sh = { shape: 'arc', angle: a, spread: rad(120), radius: 80 };
    addFx('arc', 'skill', sh);
    D.mons.forEach(function (m) { if (!m.lassoed && inShape(sh, m)) { m.stun = 2; cancelWarn(m); } });
  } else if (w === 'spear') {
    addFx('dash', 'skill', { length: 220, dur: 0.25 });
    t.dash = { t: 0, hit: [] };
  } else if (w === 'whip') {
    var s2 = { shape: 'arc', angle: a, spread: rad(100), radius: 170 };
    addFx('arc', 'skill', s2);
    var dmg = 2 + atkBonus();
    D.mons.slice().forEach(function (m) {
      if (!inShape(s2, m)) return;
      if (m.lassoed) return;
      var before = m.hp;
      dmgMon(m, dmg);
      if (m.hp > 0 && before > 0) {
        var ka = Math.atan2(m.y - t.y, m.x - t.x);
        m.kb = { vx: Math.cos(ka) * 640, vy: Math.sin(ka) * 640, t: 0.25 };
      }
    });
  }
}
function xCdMax() {
  var b = WEAPONS[G.weapon].xCd;
  return b * (1 - 0.15 * lvOf('spike'));
}

function clampRoom(m) {
  var b = roomBox(m.room), hx = false, hy = false;
  if (m.x < b.x0 + 30) { m.x = b.x0 + 30; hx = true; }
  if (m.x > b.x1 - 30) { m.x = b.x1 - 30; hx = true; }
  if (m.y < b.y0 + 30) { m.y = b.y0 + 30; hy = true; }
  if (m.y > b.y1 - 30) { m.y = b.y1 - 30; hy = true; }
  return { x: hx, y: hy };
}

function updWild(m, dt) {
  var t = D.tamer;
  if (m.hitT > 0) m.hitT -= dt;
  if (m.lassoed) return;
  if (m.stun > 0) m.stun -= dt;
  if (m.kb) {
    m.x += m.kb.vx * dt; m.y += m.kb.vy * dt; m.kb.t -= dt;
    clampRoom(m);
    if (m.kb.t <= 0) m.kb = null;
    return;
  }
  if (m.stun > 0) return;
  var weak = isWeak(m), mul = weak ? 0.5 : 1;
  var dx = t.x - m.x, dy = t.y - m.y, d = Math.sqrt(dx * dx + dy * dy);
  var ux = d > 0.001 ? dx / d : 0, uy = d > 0.001 ? dy / d : 0;
  var near = d < 320;
  function roam() {
    m.roamT -= dt;
    if (m.roamT <= 0) { m.ra = rnd(0, Math.PI * 2); m.roamT = rnd(2, 3); }
    m.x += Math.cos(m.ra) * 40 * mul * dt; m.y += Math.sin(m.ra) * 40 * mul * dt;
  }
  switch (m.sp) {
    case 'fire':
      if (!near) roam(); else if (d > 80) { m.x += ux * 70 * mul * dt; m.y += uy * 70 * mul * dt; }
      break;
    case 'water':
      if (!near) roam();
      else if (d < 220) { m.x -= ux * 60 * mul * dt; m.y -= uy * 60 * mul * dt; }
      break;
    case 'thunder':
      if (m.dashT > 0) {
        m.dashT -= dt;
        m.x += Math.cos(m.da) * 600 * mul * dt; m.y += Math.sin(m.da) * 600 * mul * dt;
      } else {
        m.dashCd -= dt;
        if (m.dashCd <= 0) { m.dashCd = 2; m.dashT = 0.3; m.da = rnd(0, Math.PI * 2); }
      }
      break;
    case 'spike':
      m.dirT -= dt;
      if (m.dirT <= 0) { var a = rnd(0, Math.PI * 2); m.vx = Math.cos(a) * 110; m.vy = Math.sin(a) * 110; m.dirT = 4; }
      m.x += m.vx * mul * dt; m.y += m.vy * mul * dt;
      break;
    case 'ghost':
      m.teleT -= dt;
      if (m.teleT <= 0) {
        m.teleT = 3;
        var b = roomBox(m.room), tries = 0, px, py;
        do {
          var c = Math.floor(rnd(b.x0 / 60, b.x1 / 60)), r = Math.floor(rnd(b.y0 / 60, b.y1 / 60));
          px = c * 60 + 30; py = r * 60 + 30; tries++;
        } while (tries < 30 && (D.grid[r][c].kind !== 'floor' || dist(px, py, t.x, t.y) < 120));
        m.x = px; m.y = py;
      }
      break;
  }
  var cl = clampRoom(m);
  if (m.sp === 'spike') { if (cl.x) m.vx = -m.vx; if (cl.y) m.vy = -m.vy; }
  if (Math.abs(dx) > 4 && near) m.dir = dx > 0 ? 1 : -1;
  else if (m.sp === 'spike' && Math.abs(m.vx) > 1) m.dir = m.vx > 0 ? 1 : -1;
  // 施放
  if (near) {
    m.cd -= dt;
    if (m.cd <= 0) {
      m.cd = SP[m.sp].interval * (weak ? 1.5 : 1);
      castSkill(m, 'dg', null, { x: t.x, y: t.y, obj: t });
    }
  }
}

/* ---------- 技能(地下城與表演場共用) ---------- */
function pushHaz(list, h, perf) {
  h.perf = perf || null;
  if (perf) perf.live++;
  list.push(h);
}
function mkHaz(kind, phase, x, y, radius, dur, owner) {
  return { kind: kind, phase: phase, x: x, y: y, radius: radius, t: 0, dur: dur, angle: 0, reflected: false,
    owner: owner, speed: 0, vx: 0, vy: 0, target: null, dead: false, hitT: false };
}
function mkProj(kind, x, y, ang, speed, radius, dur, owner) {
  var h = mkHaz(kind, 'fly', x, y, radius, dur, owner);
  h.angle = ang; h.speed = speed; h.vx = Math.cos(ang) * speed; h.vy = Math.sin(ang) * speed;
  return h;
}
function castSkill(m, mode, perf, aim) {
  var list = mode === 'dg' ? D.haz : SH.haz;
  switch (m.sp) {
    case 'fire': pushHaz(list, mkHaz('firering', 'warn', m.x, m.y, 120, 0.5, m), perf); break;
    case 'water':
      var base = Math.atan2(aim.y - m.y, aim.x - m.x);
      for (var k = -1; k <= 1; k++) pushHaz(list, mkProj('waterball', m.x, m.y, base + k * rad(20), 300, 12, 0, m), perf);
      break;
    case 'thunder': pushHaz(list, mkHaz('thunder', 'warn', aim.x, aim.y, 70, 0.8, m), perf); break;
    case 'spike':
      for (var j = 0; j < 8; j++) pushHaz(list, mkProj('spike', m.x, m.y, j * Math.PI / 4, 260, 10, 0, m), perf);
      break;
    case 'stone': pushHaz(list, mkHaz('quake', 'active', m.x, m.y, 0, 1, m), perf); break;
    case 'ghost':
      var w = mkProj('wisp', m.x, m.y, Math.atan2(aim.y - m.y, aim.x - m.x), 160, 14, 3, m);
      w.target = aim.obj;
      pushHaz(list, w, perf);
      break;
  }
}

function stepHaz(h, dt, mode) {
  var area = h.kind === 'firering' || h.kind === 'thunder' || h.kind === 'quake';
  if (area) {
    var check = false;
    h.t += dt;
    if (h.kind === 'quake') {
      h.radius = 220 * Math.min(1, h.t / 1);
      check = true;
      if (h.t >= h.dur) h.dead = true;
    } else if (h.phase === 'warn') {
      if (h.t >= h.dur) {
        h.phase = 'active'; h.t -= h.dur; h.dur = h.kind === 'thunder' ? 0.2 : 0.5;
        if (h.kind === 'thunder') check = true;
      }
    } else {
      if (h.kind === 'firering') check = true;
      if (h.t >= h.dur) h.dead = true;
    }
    if (check) areaHit(h, mode);
    return;
  }
  // 投射物
  h.t += dt;
  if (h.kind === 'wisp' && h.t >= 3) { h.dead = true; return; }
  if (h.kind === 'wisp' && !h.reflected) {
    var tx, ty, ok = false;
    if (mode === 'dg') { tx = D.tamer.x; ty = D.tamer.y; ok = true; }
    else if (h.target && (h.target.mode === undefined || h.target.mode === 'roam')) { tx = h.target.x; ty = h.target.y; ok = true; }
    if (ok) {
      var want = Math.atan2(ty - h.y, tx - h.x);
      var diff = angNorm(want - h.angle), lim = rad(120) * dt;
      h.angle += clamp(diff, -lim, lim);
      h.vx = Math.cos(h.angle) * h.speed; h.vy = Math.sin(h.angle) * h.speed;
    }
  }
  h.x += h.vx * dt; h.y += h.vy * dt;
  if (mode === 'dg') {
    if (solid(tileAt(h.x, h.y))) { h.dead = true; return; }
    if (h.reflected) {
      for (var i = 0; i < D.mons.length; i++) {
        var m = D.mons[i];
        if (dist(h.x, h.y, m.x, m.y) <= h.radius + hrOf(m.sp) * 0.9) {
          dmgMon(m, 3 + atkBonus());
          h.dead = true; return;
        }
      }
    } else {
      var t = D.tamer;
      if (dist(h.x, h.y, t.x, t.y) <= h.radius + 18) {
        if (hurtTamer()) h.dead = true;
      }
    }
  } else {
    if (h.x < ARENA.x0 || h.x > ARENA.x1 || h.y < ARENA.y0 || h.y > ARENA.y1) { h.dead = true; return; }
    var p = h.perf;
    for (var k = 0; k < SH.mons.length; k++) {
      var sm = SH.mons[k];
      if (sm === h.owner || sm.mode !== 'roam') continue;
      if (dist(h.x, h.y, sm.x, sm.y) <= h.radius + hrOf(sm.sp)) {
        if (p.hitM.indexOf(sm) < 0) { p.hitM.push(sm); showHitMon(h, sm); }
        h.dead = true; return;
      }
    }
    for (var g = 0; g < SH.gadgets.length; g++) {
      var gd = SH.gadgets[g];
      if (!REACT[gd.kind] || !REACT[gd.kind][h.kind] || gd.cd > 0) continue;
      if (dist(h.x, h.y, gd.x, gd.y) <= h.radius + 30) {
        if (p.hitG.indexOf(gd) < 0) { p.hitG.push(gd); triggerGadget(gd, h); }
        h.dead = true; return;
      }
    }
  }
}
function areaHit(h, mode) {
  if (mode === 'dg') {
    if (h.hitT) return;
    var t = D.tamer, d = dist(h.x, h.y, t.x, t.y);
    var hit = h.kind === 'quake' ? Math.abs(d - h.radius) <= 15 + 18 : d <= h.radius + 18;
    if (hit && hurtTamer()) h.hitT = true;
    return;
  }
  var p = h.perf, i;
  for (i = 0; i < SH.mons.length; i++) {
    var m = SH.mons[i];
    if (m === h.owner || m.mode !== 'roam' || p.hitM.indexOf(m) >= 0) continue;
    var d2 = dist(h.x, h.y, m.x, m.y), hr = hrOf(m.sp);
    var ok = h.kind === 'quake' ? Math.abs(d2 - h.radius) <= 15 + hr : d2 <= h.radius + hr;
    if (ok) { p.hitM.push(m); showHitMon(h, m); }
  }
  for (i = 0; i < SH.gadgets.length; i++) {
    var g = SH.gadgets[i];
    if (!REACT[g.kind] || !REACT[g.kind][h.kind] || g.cd > 0 || p.hitG.indexOf(g) >= 0) continue;
    var d3 = dist(h.x, h.y, g.x, g.y);
    var ok2 = h.kind === 'quake' ? Math.abs(d3 - h.radius) <= 15 + 30 : d3 <= h.radius + 30;
    if (ok2) { p.hitG.push(g); triggerGadget(g, h); }
  }
}
function updHazards(list, dt, mode) {
  for (var i = 0; i < list.length; i++) { if (!list[i].dead) stepHaz(list[i], dt, mode); }
  var keep = [];
  for (var j = 0; j < list.length; j++) {
    var h = list[j];
    if (h.dead) {
      if (h.perf) { h.perf.live--; if (h.perf.live <= 0) settle(h.perf); }
    } else keep.push(h);
  }
  return keep;
}

/* ---------- 地下城更新 ---------- */
function updDungeon(dt) {
  var t = D.tamer;
  D.t -= dt;
  if (t.inv > 0) t.inv -= dt;
  if (t.zCd > 0) t.zCd -= dt;
  if (t.xCd > 0) t.xCd -= dt;
  var i;
  // 移動 / 突進
  if (t.dash) {
    t.dash.t += dt;
    var a = fAng(t.facing), sx = t.x, sy = t.y;
    moveTamer(Math.cos(a) * 880 * dt, Math.sin(a) * 880 * dt);
    var moved = dist(sx, sy, t.x, t.y);
    D.mons.slice().forEach(function (m) {
      if (t.dash.hit.indexOf(m) >= 0) return;
      if (dist(m.x, m.y, t.x, t.y) < 18 + hrOf(m.sp) * 0.9) { t.dash.hit.push(m); dmgMon(m, 3 + atkBonus()); }
    });
    if (t.dash.t >= 0.25 || moved < 0.01) t.dash = null;
  } else {
    var dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (dx || dy) {
      var len = Math.sqrt(dx * dx + dy * dy);
      var sp = 300 + 25 * lvOf('thunder');
      if (tileAt(t.x, t.y).kind === 'water') sp *= 0.5;
      moveTamer(dx / len * sp * dt, dy / len * sp * dt);
      t.facing = FTAB[(Math.sign(dy) + 1) * 3 + Math.sign(dx) + 1];
    }
    if (keys.z && !lock.z && t.zCd <= 0) attackZ();
    if (keys.x && !lock.x && t.xCd <= 0 && G.weapon !== 'club') attackX();
  }
  // 熔岩
  if (tileAt(t.x, t.y).kind === 'lava') hurtTamer();
  // 魔物
  D.mons.slice().forEach(function (m) { updWild(m, dt); });
  // 技能
  D.haz = updHazards(D.haz, dt, 'dg');
  // 捕捉
  updCapture(dt);
  // 特效 / 飄字
  D.fx.forEach(function (f) { f.t += dt; });
  D.fx = D.fx.filter(function (f) { return f.t < f.dur; });
  D.floats.forEach(function (f) { f.t += dt; });
  D.floats = D.floats.filter(function (f) { return f.t < f.dur; });
  // 巢穴再生
  D.nests.forEach(function (n) {
    if (!n.mon && n.timer > 0) { n.timer -= dt; if (n.timer <= 0) spawnWild(n); }
  });
  if (t.hearts <= 0 || D.t <= 0) endDungeon();
}
function updCapture(dt) {
  var t = D.tamer, ring = D.ring;
  if (D.lasso) {
    ring.target = null; ring.t = 0;
    var L = D.lasso, m = L.m;
    L.t += dt;
    var dx = t.x - m.x, dy = t.y - m.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d >= 10) {
      var a = Math.atan2(dy, dx);
      if (L.last !== null) L.sum += angNorm(a - L.last);
      L.last = a;
    } else L.last = null;
    L.progress = Math.abs(L.sum) / (2 * Math.PI);
    L.len = d;
    if (L.progress >= 1) captureDone(m);
    else if (L.t >= 5 + lvOf('ghost') || d > 220) breakLasso();
    return;
  }
  if (D.ropes <= 0) { ring.target = null; ring.t = 0; return; }
  var best = null, bd = 1e9;
  D.mons.forEach(function (m) {
    if (!isWeak(m)) return;
    var d = dist(m.x, m.y, t.x, t.y);
    if (d <= 40 && d < bd) { bd = d; best = m; }
  });
  if (!best) { ring.target = null; ring.t = 0; return; }
  if (ring.target !== best) { ring.target = best; ring.t = 0; }
  ring.t += dt;
  if (ring.t >= ringDur()) {
    best.lassoed = true;
    cancelWarn(best);
    D.lasso = { m: best, sum: 0, last: null, t: 0, progress: 0, len: bd };
    ring.target = null; ring.t = 0;
  }
}
function ringDur() { return Math.max(0.35, 0.8 - 0.15 * lvOf('water')); }
function captureDone(m) {
  var sp = m.sp;
  D.lasso = null; m.lassoed = false;
  D.ropes--;
  G.caps[sp]++;
  removeMon(m);
  dfloat(m.x, m.y - 40, '收服!', 'capture');
  if (G.roster[sp] === undefined) {
    G.roster[sp] = 0;
  } else if (G.roster[sp] < 3) {
    G.roster[sp]++;
    dfloat(m.x, m.y - 80, '等級 +1', 'levelUp');
    if (sp === 'stone') D.tamer.hearts++;
  } else {
    earn(20);
    dfloat(m.x, m.y - 80, '+20', 'coin20');
  }
}
function endDungeon() {
  breakLasso();
  S1.cur = 0; S1.picks = [];
  setPhase('setup1');
}

/* ---------- 布置 ---------- */
function rosterList() { return ORDER.filter(function (s) { return G.roster[s] !== undefined; }); }
function cellPos(i) { return { x: 160 + 200 * (i % 3), y: 360 + 180 * Math.floor(i / 3) }; }
function startSetup2() {
  S2.cells = []; for (var i = 0; i < 12; i++) S2.cells.push(null);
  S2.cur = { c: 0, r: 0 }; S2.panel = null;
  setPhase('setup2');
}
function refundAll() {
  S2.cells.forEach(function (c) { if (c && c.type === 'gadget') G.gold += GCOST[c.kind]; });
  for (var i = 0; i < 12; i++) S2.cells[i] = null;
}
function placedCount() {
  var n = 0;
  S2.cells.forEach(function (c) { if (c && c.type === 'monster') n++; });
  return n;
}
function buildPanel(ci) {
  var cur = S2.cells[ci];
  var refund = (cur && cur.type === 'gadget') ? GCOST[cur.kind] : 0;
  var opts = [];
  S1.picks.forEach(function (sp) {
    var placed = S2.cells.some(function (c) { return c && c.type === 'monster' && c.sp === sp; });
    if (!placed) opts.push({ type: 'monster', key: sp, name: SP[sp].name, cost: 0, desc: '', affordable: true });
  });
  GADGETS.forEach(function (g) {
    opts.push({ type: 'gadget', key: g.kind, name: g.name, cost: g.cost, desc: g.desc, affordable: G.gold + refund >= g.cost });
  });
  opts.push({ type: 'clear', key: 'clear', name: '清空', cost: 0, desc: '', affordable: true });
  S2.panel = { cell: ci, opts: opts, index: 0 };
}
function clearCell(ci) {
  var c = S2.cells[ci];
  if (c && c.type === 'gadget') G.gold += GCOST[c.kind];
  S2.cells[ci] = null;
}
function startShowFromSetup() {
  var unplaced = S1.picks.filter(function (sp) {
    return !S2.cells.some(function (c) { return c && c.type === 'monster' && c.sp === sp; });
  });
  unplaced.forEach(function (sp) {
    var empty = [], i;
    for (i = 0; i < 12; i++) if (!S2.cells[i]) empty.push(i);
    if (!empty.length) { // 12 格全被機關占滿的極端情況: 退掉一個機關讓位
      for (i = 0; i < 12; i++) empty.push(i);
      var pick = empty[Math.floor(Math.random() * empty.length)];
      clearCell(pick);
      empty = [pick];
    }
    S2.cells[empty[Math.floor(Math.random() * empty.length)]] = { type: 'monster', sp: sp };
  });
  startShow();
}

/* ---------- 表演場 ---------- */
function startShow() {
  SH = { t: 0, mons: [], gadgets: [], haz: [], pulses: [], floats: [], fences: [], visitors: [] };
  for (var i = 0; i < 12; i++) {
    var c = S2.cells[i];
    if (!c) continue;
    var p = cellPos(i);
    if (c.type === 'monster') {
      var lv = lvOf(c.sp);
      SH.mons.push({
        sp: c.sp, x: p.x, y: p.y, lvl: lv, rage: 40, redLow: 80 - 5 * lv, rs: 'normal', marks: 0, markT: 0,
        mode: 'roam', perfT: 0, pAnim: 99, fx: 'none', fxT: 0, dir: 1, chargeT: 0, looseT: 0, atkT: 0,
        dashT: 0, dashCd: rnd(0.5, 2), da: 0, vx: 0, vy: 0, teleT: 3, roamT: 0, ra: rnd(0, 6.28),
        seg: 0, side: 'top', arrived: false, dtime: 4
      });
      var mm = SH.mons[SH.mons.length - 1];
      var a = rnd(0, Math.PI * 2); mm.vx = Math.cos(a) * 110; mm.vy = Math.sin(a) * 110;
    } else {
      SH.gadgets.push({ kind: c.kind, x: p.x, y: p.y, cd: 0, cdDur: GCD[c.kind] || 0, firedT: 99, next: 1.5 });
    }
  }
  ['top', 'bottom'].forEach(function (side) {
    for (var k = 0; k < 6; k++) {
      SH.fences.push({ x: 110 + 100 * k, y: side === 'top' ? 255 : 1005, side: side, broken: false });
      SH.visitors.push({ x: 110 + 100 * k, y: side === 'top' ? 190 : 1080, side: side, mode: 'watch', timer: 0 });
    }
  });
  setPhase('show');
}
function sfloat(x, y, text, kind) { SH.floats.push({ x: x, y: y, text: text, kind: kind, t: 0, dur: 1 }); }

function raiseRage(m, amt) {
  if (m.mode !== 'roam') return;
  m.fx = 'ignited'; m.fxT = 0;
  if (m.rs === 'marks') { addMark(m); return; }
  m.rage = Math.min(100, m.rage + amt);
  if (m.rage >= 100) { m.rs = 'marks'; m.marks = 1; m.markT = 4; m.rage = 100; }
}
function addMark(m) {
  m.marks++; m.markT = 4;
  if (m.marks >= 5) startRun(m);
}
function douseRage(m, amt) {
  if (m.mode !== 'roam') return;
  m.fx = 'doused'; m.fxT = 0;
  if (m.rs === 'marks') {
    m.marks--; m.markT = 4;
    if (m.marks <= 0) { m.marks = 0; m.rs = 'slow'; }
    return;
  }
  m.rage = Math.max(0, m.rage - amt);
}
function showHitMon(h, m) {
  if (IGN[h.kind]) raiseRage(m, IGN[h.kind]);
  else if (DOU[h.kind]) douseRage(m, DOU[h.kind]);
}
function startRun(m) {
  m.mode = 'charge'; m.rs = 'normal'; m.marks = 0; m.chargeT = 0; m.arrived = false;
  m.side = m.y < 630 ? 'top' : 'bottom';
  m.seg = clamp(Math.round((m.x - 110) / 100), 0, 5);
  m.dashT = 0; m.pAnim = 99;
}
function fenceOf(m) {
  for (var i = 0; i < SH.fences.length; i++) if (SH.fences[i].side === m.side && SH.fences[i].x === 110 + 100 * m.seg) return SH.fences[i];
  return null;
}
function triggerGadget(g, h) {
  g.cd = g.cdDur; g.firedT = 0;
  var chain = h.perf ? h.perf.chain : 1;
  if (g.kind === 'keg' || g.kind === 'wheel') {
    SH.pulses.push({ x: g.x, y: g.y, kind: g.kind, radius: 180, t: 0, dur: 0.4 });
    SH.mons.forEach(function (m) {
      if (m.mode !== 'roam' || dist(m.x, m.y, g.x, g.y) > 180) return;
      if (g.kind === 'keg') raiseRage(m, 20); else douseRage(m, 20);
    });
  } else if (g.kind === 'gong') {
    SH.pulses.push({ x: g.x, y: g.y, kind: 'gong', radius: 200, t: 0, dur: 0.4 });
    SH.mons.slice().forEach(function (m) {
      if (m.mode !== 'roam' || m.rage < 50 || dist(m.x, m.y, g.x, g.y) > 200) return;
      perform(m, chain + 1);
    });
  }
}
function showAim(m) {
  var gk = m.sp === 'thunder' ? { keg: 1, gong: 1 } : { wheel: 1, gong: 1 };
  var best = null, bd = 1e9;
  SH.mons.forEach(function (o) {
    if (o === m || o.mode !== 'roam') return;
    var d = dist(o.x, o.y, m.x, m.y); if (d < bd) { bd = d; best = o; }
  });
  SH.gadgets.forEach(function (g) {
    if (!gk[g.kind] || g.cd > 0) return;
    var d = dist(g.x, g.y, m.x, m.y); if (d < bd) { bd = d; best = g; }
  });
  if (!best) return { x: 360, y: 630, obj: null };
  return { x: best.x, y: best.y, obj: best };
}
function perform(m, chain) {
  m.perfT = 0; m.pAnim = 0;
  var perf = { owner: m, chain: chain, red: m.rage >= m.redLow, hitM: [], hitG: [], live: 0 };
  var aim = null;
  if (m.sp === 'water' || m.sp === 'thunder' || m.sp === 'ghost') aim = showAim(m);
  castSkill(m, 'show', perf, aim);
  if (chain > G.bestChain) G.bestChain = chain;
}
function settle(p) {
  if (p.done) return;
  p.done = true;
  var o = p.owner, s = SP[o.sp];
  var g = Math.round(s.showGold * (1 + 0.5 * p.hitM.length) * (p.red ? 2 : 1) * (1 + 0.25 * (p.chain - 1)) * Math.min(3, 1 + G.rep / 200));
  earn(g);
  G.rep += s.rep;
  var text = '+' + g, kind = 'gold';
  if (p.red) { text += ' ×2'; kind = 'redGold'; }
  if (p.chain >= 2) { text += ' 連鎖 ' + p.chain; if (!p.red) kind = 'chain'; }
  sfloat(o.x, o.y - 70, text, kind);
}
function nearestOther(m) {
  var best = null, bd = 1e9;
  SH.mons.forEach(function (o) {
    if (o === m || o.mode !== 'roam') return;
    var d = dist(o.x, o.y, m.x, m.y); if (d < bd) { bd = d; best = o; }
  });
  return best;
}
function clampArena(m) {
  var hx = false, hy = false;
  if (m.x < 100) { m.x = 100; hx = true; } if (m.x > 620) { m.x = 620; hx = true; }
  if (m.y < 310) { m.y = 310; hy = true; } if (m.y > 950) { m.y = 950; hy = true; }
  return { x: hx, y: hy };
}
function visitorAttack(m) {
  var best = null, bd = 1e9;
  SH.visitors.forEach(function (v) {
    if (v.side !== m.side || v.mode !== 'watch') return;
    var d = Math.abs(v.x - m.x); if (d < bd) { bd = d; best = v; }
  });
  if (!best) return;
  best.mode = 'scared'; best.timer = 4;
  G.rep = Math.max(0, G.rep - 3);
  sfloat(best.x, best.y + (best.side === 'top' ? 60 : -60), '-3', 'repDown');
}

function updShowMon(m, dt) {
  if (m.fx !== 'none') { m.fxT += dt; if (m.fxT >= 0.5) { m.fx = 'none'; m.fxT = 0; } }
  if (m.pAnim < 90) m.pAnim += dt;
  if (m.mode === 'charge') {
    var fy = m.side === 'top' ? 255 : 1005, sx = 110 + 100 * m.seg;
    if (!m.arrived) {
      var d = dist(m.x, m.y, sx, fy);
      if (d <= 8) { m.arrived = true; m.x = sx; m.y = fy; }
      else { m.x += (sx - m.x) / d * 160 * dt; m.y += (fy - m.y) / d * 160 * dt; m.dir = sx >= m.x ? 1 : -1; }
    }
    if (m.arrived) {
      var f = fenceOf(m);
      if (f.broken) m.chargeT = 1.5; else m.chargeT += dt;
      if (m.chargeT >= 1.5) {
        f.broken = true;
        m.mode = 'loose'; m.looseT = 0; m.atkT = 0; m.chargeT = 0;
        m.x = sx; m.y = m.side === 'top' ? 190 : 1080;
        m.dir = Math.random() < 0.5 ? -1 : 1;
      }
    }
    return;
  }
  if (m.mode === 'loose') {
    m.x += m.dir * 140 * dt;
    if (m.x < 110) { m.x = 110; m.dir = 1; }
    if (m.x > 610) { m.x = 610; m.dir = -1; }
    m.looseT += dt; m.atkT += dt;
    if (m.atkT >= 1.5) { m.atkT -= 1.5; visitorAttack(m); }
    if (m.looseT >= 6) {
      m.mode = 'roam'; m.x = 360; m.y = 630; m.rage = 30; m.marks = 0; m.rs = 'normal'; m.looseT = 0;
      m.perfT = 0; m.dashT = 0;
    }
    return;
  }
  // 怒氣
  if (m.rs === 'normal') m.rage = Math.max(0, m.rage - SP[m.sp].decay * dt);
  else if (m.rs === 'slow') {
    m.rage = Math.max(0, m.rage - 2 * dt);
    if (m.rage < m.redLow) m.rs = 'normal';
  } else if (m.rs === 'marks') {
    m.rage = 100;
    m.markT -= dt;
    if (m.markT <= 0) {
      m.marks--; m.markT = 4;
      if (m.marks <= 0) { m.marks = 0; m.rs = 'slow'; }
    }
  }
  // 表演計時
  if (m.rage >= 50) {
    m.perfT += dt;
    var iv = 3 - 2 * (m.rage - 50) / 50;
    if (m.perfT >= iv) perform(m, 1);
  } else m.perfT = 0;
  // 移動
  var bait = null, bd = 260;
  if (m.sp !== 'stone') {
    SH.gadgets.forEach(function (g) {
      if (g.kind !== 'bait') return;
      var d = dist(g.x, g.y, m.x, m.y);
      if (d <= bd) { bd = d; bait = g; }
    });
  }
  var tg = nearestOther(m);
  function roam() {
    m.roamT -= dt;
    if (m.roamT <= 0) { m.ra = rnd(0, Math.PI * 2); m.roamT = rnd(2, 3); }
    m.x += Math.cos(m.ra) * 40 * dt; m.y += Math.sin(m.ra) * 40 * dt;
  }
  var cl;
  if (m.sp === 'ghost') {
    m.teleT -= dt;
    if (m.teleT <= 0) { m.teleT = 3; m.x = rnd(100, 620); m.y = rnd(310, 950); }
  } else if (bait) {
    if (bd > 60) {
      m.x += (bait.x - m.x) / bd * 60 * dt; m.y += (bait.y - m.y) / bd * 60 * dt;
      m.dir = bait.x >= m.x ? 1 : -1;
    }
  } else {
    var dx = tg ? tg.x - m.x : 0, dy = tg ? tg.y - m.y : 0, dd = Math.sqrt(dx * dx + dy * dy) || 1;
    switch (m.sp) {
      case 'fire':
        if (!tg) roam(); else if (dd > 80) { m.x += dx / dd * 70 * dt; m.y += dy / dd * 70 * dt; m.dir = dx >= 0 ? 1 : -1; }
        break;
      case 'water':
        if (!tg) roam();
        else if (dd < 220) { m.x -= dx / dd * 60 * dt; m.y -= dy / dd * 60 * dt; }
        else if (dd > 320) { m.x += dx / dd * 40 * dt; m.y += dy / dd * 40 * dt; }
        break;
      case 'thunder':
        if (m.dashT > 0) {
          m.dashT -= dt; m.x += Math.cos(m.da) * 600 * dt; m.y += Math.sin(m.da) * 600 * dt;
          m.dir = Math.cos(m.da) >= 0 ? 1 : -1;
        } else {
          m.dashCd -= dt;
          if (m.dashCd <= 0) { m.dashCd = 2; m.dashT = 0.3; m.da = rnd(0, Math.PI * 2); }
        }
        break;
      case 'spike':
        m.dtime -= dt;
        if (m.dtime <= 0) { var a = rnd(0, Math.PI * 2); m.vx = Math.cos(a) * 110; m.vy = Math.sin(a) * 110; m.dtime = 4; }
        m.x += m.vx * dt; m.y += m.vy * dt;
        if (Math.abs(m.vx) > 1) m.dir = m.vx > 0 ? 1 : -1;
        break;
    }
  }
  cl = clampArena(m);
  if (m.sp === 'spike') { if (cl.x) m.vx = -m.vx; if (cl.y) m.vy = -m.vy; }
}

function updShow(dt) {
  SH.t += dt;
  // 機關
  SH.gadgets.forEach(function (g) {
    if (g.cd > 0) g.cd = Math.max(0, g.cd - dt);
    if (g.firedT < 90) g.firedT += dt;
    if ((g.kind === 'drum' || g.kind === 'fountain') && SH.t >= g.next) {
      g.next += 3; g.firedT = 0;
      SH.pulses.push({ x: g.x, y: g.y, kind: g.kind, radius: 160, t: 0, dur: 0.4 });
      SH.mons.forEach(function (m) {
        if (m.mode !== 'roam' || dist(m.x, m.y, g.x, g.y) > 160) return;
        if (g.kind === 'drum') raiseRage(m, 15); else douseRage(m, 20);
      });
    }
  });
  SH.mons.slice().forEach(function (m) { updShowMon(m, dt); });
  SH.haz = updHazards(SH.haz, dt, 'show');
  SH.pulses.forEach(function (p) { p.t += dt; });
  SH.pulses = SH.pulses.filter(function (p) { return p.t < p.dur; });
  SH.floats.forEach(function (f) { f.t += dt; });
  SH.floats = SH.floats.filter(function (f) { return f.t < f.dur; });
  SH.visitors.forEach(function (v) {
    if (v.mode === 'watch') return;
    v.timer -= dt;
    if (v.timer <= 0) v.mode = 'watch';
    else if (v.timer <= 3) v.mode = 'empty';
  });
  if (SH.t >= 45) endShow();
}
function endShow() {
  SH.haz.forEach(function (h) { if (h.perf) { h.perf.live = 0; settle(h.perf); } });
  SH.mons.forEach(function (m) { if (m.mode !== 'roam') G.rep = Math.max(0, G.rep - 5); });
  SH.fences.forEach(function (f) { f.broken = false; });
  if (G.day >= DAYMAX) setPhase('result');
  else { shopCur = 0; setPhase('shop'); }
}

/* ---------- 商店 ---------- */
var SHOP = ['club', 'sword', 'spear', 'whip', 'attack', 'armor', 'ropeBag'];
function shopCost(it) {
  if (WEAPONS[it]) return WEAPONS[it].price;
  return G.price[it];
}
function shopAct(it) {
  if (WEAPONS[it]) {
    if (G.owned[it]) G.weapon = it;
    else if (G.gold >= WEAPONS[it].price) { G.gold -= WEAPONS[it].price; G.owned[it] = true; G.weapon = it; }
    return;
  }
  var c = G.price[it];
  if (G.gold < c) return;
  G.gold -= c;
  G.upg[it]++;
  G.price[it] = Math.round(c * 1.5);
}

/* ---------- 輸入分派 ---------- */
function unlockInfo(code) {
  var u = UNLOCK[code];
  if (!u) return { open: true, text: '', ok: true };
  var n = G.caps[u.sp];
  return {
    open: G.unlocked[code],
    text: '金幣 ' + u.cost + ' + 收服' + SP[u.sp].name + ' ' + Math.min(n, u.n) + '/' + u.n,
    ok: G.gold >= u.cost && n >= u.n
  };
}
function onPress(k) {
  if (phase === 'guide') {
    if (k === 'z' || k === 'right') {
      if (guide.page < GUIDE.length - 1) guide.page++;
      else if (k === 'z') setPhase(guide.ret);
    } else if (k === 'x' || k === 'left') { if (guide.page > 0) guide.page--; }
    return;
  }
  if (k === 'x' && (phase === 'select' || phase === 'setup1' || phase === 'shop') && !(phase === 'setup2')) {
    guide.page = 0; guide.ret = phase; setPhase('guide');
    return;
  }
  if (phase === 'select') {
    if (k === 'up') selCur = Math.max(0, selCur - 1);
    else if (k === 'down') selCur = Math.min(2, selCur + 1);
    else if (k === 'z') {
      var code = DLIST[selCur], u = unlockInfo(code);
      if (u.open) startDungeon(code);
      else if (u.ok) { G.gold -= UNLOCK[code].cost; G.unlocked[code] = true; }
    }
  } else if (phase === 'setup1') {
    var list = rosterList(), n = list.length;
    if (k === 'up') { if (S1.cur === n) S1.cur = n - 1; else if (S1.cur - 2 >= 0) S1.cur -= 2; }
    else if (k === 'down') { if (S1.cur < n && S1.cur + 2 < n) S1.cur += 2; else S1.cur = n; }
    else if (k === 'left') { if (S1.cur < n && S1.cur > 0) S1.cur--; }
    else if (k === 'right') { if (S1.cur < n - 1) S1.cur++; }
    else if (k === 'z') {
      if (S1.cur === n) { if (S1.picks.length >= 1) startSetup2(); }
      else {
        var sp = list[S1.cur], i = S1.picks.indexOf(sp);
        if (i >= 0) S1.picks.splice(i, 1); else if (S1.picks.length < 4) S1.picks.push(sp);
      }
    }
  } else if (phase === 'setup2') {
    onSetup2(k);
  } else if (phase === 'shop') {
    if (k === 'up') shopCur = Math.max(0, shopCur - 1);
    else if (k === 'down') shopCur = Math.min(7, shopCur + 1);
    else if (k === 'z') {
      if (shopCur === 7) { G.day++; selCur = 0; setPhase('select'); }
      else shopAct(SHOP[shopCur]);
    }
  } else if (phase === 'result') {
    if (k === 'z') { newGame(); setPhase('select'); }
  }
}
function onSetup2(k) {
  var cur = S2.cur;
  if (S2.panel) {
    var p = S2.panel;
    if (k === 'up') p.index = Math.max(0, p.index - 1);
    else if (k === 'down') p.index = Math.min(p.opts.length - 1, p.index + 1);
    else if (k === 'x') S2.panel = null;
    else if (k === 'z') {
      var o = p.opts[p.index];
      if (o.type === 'gadget' && !o.affordable) return;
      clearCell(p.cell);
      if (o.type === 'monster') S2.cells[p.cell] = { type: 'monster', sp: o.key };
      else if (o.type === 'gadget') { G.gold -= o.cost; S2.cells[p.cell] = { type: 'gadget', kind: o.key }; }
      S2.panel = null;
    }
    return;
  }
  if (cur.r === 4) { // 開演按鈕
    if (k === 'up') cur.r = 3, cur.c = S2.last.c;
    else if (k === 'z') startShowFromSetup();
    else if (k === 'x') { refundAll(); S1.cur = 0; setPhase('setup1'); }
    return;
  }
  if (k === 'up') cur.r = Math.max(0, cur.r - 1);
  else if (k === 'down') { if (cur.r === 3) { S2.last = { c: cur.c, r: 3 }; cur.r = 4; } else cur.r++; }
  else if (k === 'left') cur.c = Math.max(0, cur.c - 1);
  else if (k === 'right') cur.c = Math.min(2, cur.c + 1);
  else if (k === 'z') buildPanel(cur.r * 3 + cur.c);
  else if (k === 'x') clearCell(cur.r * 3 + cur.c);
}

/* ---------- 繪製 ---------- */
function hudMessage() {
  switch (phase) {
    case 'guide': return 'Z 下一頁 X 上一頁';
    case 'select': return '↑↓ 選擇 Z 進入 X 說明';
    case 'dungeon':
      if (D.lasso) return '繞牠一圈!';
      if (D.ring.target) return '站住別動';
      return 'Z 攻擊 X 武器技';
    case 'setup1': return '方向鍵選 Z 上場/下場 X 說明';
    case 'setup2':
      if (S2.panel) return '↑↓ 選 Z 確定 X 取消';
      if (S2.cur.r === 4) return 'Z 開演 X 回上一步';
      return '方向鍵選格子 Z 擺放 X 清空';
    case 'show': return '表演中…';
    case 'shop': return '↑↓ 選擇 Z 購買/裝備 X 說明';
    case 'result': return '按 Z 重來';
  }
  return '';
}
function drawHud() {
  var inD = phase === 'dungeon';
  var st = {
    phase: phase, day: G.day, dayMax: DAYMAX, gold: G.gold, rep: G.rep,
    hearts: inD ? D.tamer.hearts : 0, maxHearts: inD ? maxHearts() : 0,
    ropes: inD ? D.ropes : 0, ropeMax: inD ? maxRopes() : 0,
    weapon: G.weapon, xCdLeft: inD ? Math.max(0, D.tamer.xCd) : 0, xCdMax: inD ? xCdMax() : 0,
    timeLeft: inD ? Math.max(0, D.t) : (phase === 'show' ? Math.max(0, 45 - SH.t) : 0),
    timeMax: inD ? 60 : (phase === 'show' ? 45 : 0),
    dungeon: inD ? D.code : '', message: hudMessage()
  };
  Art.drawHud(ctx, st);
}
function drawFloats(list, oy) {
  list.forEach(function (f) { Art.drawFloatText(ctx, { x: f.x, y: f.y + oy, text: f.text, kind: f.kind, t: f.t, dur: f.dur }); });
}
function drawHaz(h, oy) {
  Art.drawHazard(ctx, { x: h.x, y: h.y + oy, kind: h.kind, phase: h.phase, radius: h.radius, t: h.t, dur: h.dur, angle: h.angle, reflected: h.reflected });
}
function drawShowMon(m, rage) {
  var showMarks = m.rs === 'marks' && m.mode === 'roam' ? Math.min(4, m.marks) : 0;
  Art.drawShowMonster(ctx, {
    x: m.x, y: m.y, species: m.sp, level: m.lvl, rage: rage === undefined ? m.rage : rage, redLow: m.redLow,
    marks: showMarks, markLeft: showMarks ? Math.max(0, m.markT) : 0, markDur: 4,
    mode: m.mode, performing: m.pAnim < 0.5, performT: m.pAnim < 0.5 ? m.pAnim : 0, performDur: 0.5,
    fx: m.fx, fxT: m.fx === 'none' ? 0 : m.fxT, fxDur: 0.5,
    chargeT: m.mode === 'charge' && m.arrived ? m.chargeT : 0, chargeDur: 1.5,
    looseT: m.mode === 'loose' ? m.looseT : 0, looseDur: 6,
    dashing: m.dashT > 0, dir: m.dir
  });
}
function drawGadgets() {
  SH.gadgets.forEach(function (g) {
    Art.drawGadget(ctx, { x: g.x, y: g.y, kind: g.kind, armed: g.cd <= 0, cdLeft: g.cd, cdDur: g.cdDur, fired: g.firedT < 0.3 });
  });
}
function drawFencesVisitors() {
  SH.fences.forEach(function (f) { Art.drawFence(ctx, { x: f.x, y: f.y, side: f.side, broken: f.broken }); });
  SH.visitors.forEach(function (v) { Art.drawVisitor(ctx, { x: v.x, y: v.y, side: v.side, mode: v.mode }); });
}

function renderDungeon() {
  var i, t = D.tamer;
  for (var r = 0; r < 19; r++) for (var c = 0; c < 12; c++) {
    var tl = D.grid[r][c];
    Art.drawTile(ctx, { x: c * 60 + 30, y: r * 60 + 30 + OY, dungeon: D.code, kind: tl.kind, room: tl.room, nest: tl.nest });
  }
  D.haz.forEach(function (h) { if (h.phase !== 'fly') drawHaz(h, OY); });
  D.mons.forEach(function (m) {
    Art.drawWildMonster(ctx, {
      x: m.x, y: m.y + OY, species: m.sp, hp: m.hp, maxHp: m.maxHp, hit: m.hitT > 0, weak: isWeak(m),
      stunLeft: Math.max(0, m.stun), stunDur: 2, lassoed: m.lassoed, casting: isCasting(m), dashing: m.dashT > 0, dir: m.dir
    });
  });
  if (D.ring.target) {
    Art.drawCaptureRing(ctx, { x: D.ring.target.x, y: D.ring.target.y + OY, t: D.ring.t, dur: ringDur() });
  }
  if (D.lasso) {
    var L = D.lasso;
    Art.drawLasso(ctx, { x1: t.x, y1: t.y + OY, x2: L.m.x, y2: L.m.y + OY, progress: Math.min(1, L.progress), t: L.t, limit: 5 + lvOf('ghost'), len: L.len, maxLen: 220 });
  }
  Art.drawTamer(ctx, { x: t.x, y: t.y + OY, facing: t.facing, weapon: G.weapon, dashing: !!t.dash, blink: t.inv > 0, lassoing: !!D.lasso });
  D.haz.forEach(function (h) { if (h.phase === 'fly') drawHaz(h, OY); });
  D.fx.forEach(function (f) {
    Art.drawWeaponFx(ctx, { x: f.x, y: f.y + OY, weapon: f.weapon, move: f.move, shape: f.shape, angle: f.angle, spread: f.spread,
      radius: f.radius, length: f.length, width: f.width, t: f.t, dur: f.dur });
  });
  drawFloats(D.floats, OY);
}
function renderSetup1() {
  var list = rosterList();
  list.forEach(function (sp, i) {
    Art.drawRosterCard(ctx, { x: 195 + 330 * (i % 2), y: 300 + 230 * Math.floor(i / 2), species: sp, level: lvOf(sp),
      picked: S1.picks.indexOf(sp) >= 0, selected: S1.cur === i });
  });
  Art.drawButton(ctx, { x: 160, y: 1100, w: 400, h: 100, label: '下一步', selected: S1.cur === list.length });
}
function renderSetup2() {
  Art.drawShowArena(ctx, {});
  var i, p;
  for (i = 0; i < 12; i++) {
    p = cellPos(i);
    Art.drawSetupCell(ctx, { x: p.x, y: p.y, selected: !S2.panel && S2.cur.r < 4 && S2.cur.r * 3 + S2.cur.c === i });
    var c = S2.cells[i];
    if (!c) continue;
    if (c.type === 'gadget') Art.drawGadget(ctx, { x: p.x, y: p.y, kind: c.kind, armed: true, cdLeft: 0, cdDur: GCD[c.kind] || 0, fired: false });
    else drawShowMon({ sp: c.sp, x: p.x, y: p.y, lvl: lvOf(c.sp), rage: 40, redLow: 80 - 5 * lvOf(c.sp), rs: 'normal', marks: 0, markT: 0,
      mode: 'roam', pAnim: 99, fx: 'none', fxT: 0, chargeT: 0, looseT: 0, dashT: 0, dir: 1 });
  }
  Art.drawSetupInfo(ctx, { gold: G.gold, placed: placedCount(), picked: S1.picks.length });
  Art.drawButton(ctx, { x: 480, y: 1160, w: 180, h: 100, label: '開演', selected: !S2.panel && S2.cur.r === 4 });
  if (S2.panel) Art.drawPickerPanel(ctx, { options: S2.panel.opts, index: S2.panel.index });
}
function renderShow() {
  Art.drawShowArena(ctx, {});
  drawFencesVisitors();
  drawGadgets();
  SH.pulses.forEach(function (p) { Art.drawGadgetPulse(ctx, { x: p.x, y: p.y, kind: p.kind, radius: p.radius, t: p.t, dur: p.dur }); });
  SH.haz.forEach(function (h) { if (h.phase !== 'fly') drawHaz(h, 0); });
  SH.mons.forEach(function (m) { drawShowMon(m); });
  SH.haz.forEach(function (h) { if (h.phase === 'fly') drawHaz(h, 0); });
  drawFloats(SH.floats, 0);
}
function renderShop() {
  SHOP.forEach(function (it, i) {
    var isW = !!WEAPONS[it];
    Art.drawShopItem(ctx, {
      x: 360, y: 200 + 125 * i, item: it, cost: shopCost(it), level: isW ? 0 : G.upg[it],
      owned: isW ? !!G.owned[it] : false, equipped: isW && G.weapon === it,
      affordable: isW ? (G.owned[it] || G.gold >= WEAPONS[it].price) : G.gold >= G.price[it], selected: shopCur === i
    });
  });
  Art.drawButton(ctx, { x: 160, y: 1110, w: 400, h: 100, label: '出發', selected: shopCur === 7 });
}
function stars() { return G.rep >= 800 ? 3 : (G.rep >= 450 ? 2 : (G.rep >= 200 ? 1 : 0)); }

function render() {
  ctx.clearRect(0, 0, CW, CH);
  Art.drawBackground(ctx, {});
  switch (phase) {
    case 'guide': {
      var pg = GUIDE[guide.page];
      var frame = { page: guide.page, x: 60, y: 300, w: 600, h: 720 };
      if (Art.drawGuidePage) Art.drawGuidePage(ctx, frame);
      Placeholder.guide(ctx, guide.page, GUIDE.length, pg.title, pg.text, guide.page === GUIDE.length - 1);
      break;
    }
    case 'select':
      DLIST.forEach(function (code, i) {
        var u = unlockInfo(code);
        Art.drawDungeonCard(ctx, { x: 360, y: 330 + 310 * i, dungeon: code, open: u.open, condition: u.open ? '' : u.text, selected: selCur === i });
      });
      break;
    case 'dungeon': renderDungeon(); break;
    case 'setup1': renderSetup1(); break;
    case 'setup2': renderSetup2(); break;
    case 'show': renderShow(); break;
    case 'shop': renderShop(); break;
    case 'result':
      Art.drawResultPanel(ctx, {
        rep: G.rep, goldEarned: G.goldEarned, bestChain: G.bestChain,
        roster: rosterList().map(function (s) { return { species: s, level: G.roster[s] }; }), stars: stars()
      });
      break;
  }
  drawHud();
}

/* ---------- 主迴圈 ---------- */
function update(dt) {
  var q = press; press = [];
  for (var i = 0; i < q.length; i++) onPress(q[i]);
  if (phase === 'dungeon') updDungeon(dt);
  else if (phase === 'show') updShow(dt);
}
var last = null;
function frame(ts) {
  if (last === null) last = ts;
  var dt = Math.min(Math.max((ts - last) / 1000, 0), 1 / 30);
  last = ts;
  try { update(dt); render(); } catch (e) { console.error(e); }
  requestAnimationFrame(frame);
}

newGame();
phase = 'guide';
guide.page = 0; guide.ret = 'select';
requestAnimationFrame(frame);
})();
