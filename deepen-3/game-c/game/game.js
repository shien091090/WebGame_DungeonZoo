// 玩具球亂鬥秀 — 玩法驗證 Demo
// 邏輯與繪製分離: 每幀 update() 改狀態, render() 才呼叫 Art
(function () {
'use strict';

var CW = (window.Art && Art.canvas && Art.canvas.width) || 720;
var CH = (window.Art && Art.canvas && Art.canvas.height) || 1280;
var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');

// ---------- 工具 ----------
function rnd(a, b) { return a + Math.random() * (b - a); }
function hyp(x, y) { return Math.sqrt(x * x + y * y); }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function wrapAng(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function sgn(v) { return v < 0 ? -1 : 1; }

// ---------- 資料 ----------
var SP_LIST = ['fire', 'water', 'thunder', 'spike', 'stone', 'ghost'];
var SPECIES = {
  fire:    { name: '火蜥蜴', hp: 10, interval: 2.4, drop: 4, decay: 2,   showGold: 2, showRep: 1, roam: 40 },
  water:   { name: '水母',   hp: 7,  interval: 1.6, drop: 4, decay: 3,   showGold: 1, showRep: 1, roam: 40 },
  thunder: { name: '雷鳥',   hp: 14, interval: 2.6, drop: 6, decay: 4,   showGold: 3, showRep: 2, roam: 0 },
  spike:   { name: '刺蝟',   hp: 12, interval: 2.2, drop: 6, decay: 2.5, showGold: 2, showRep: 1, roam: 0 },
  stone:   { name: '石像鬼', hp: 22, interval: 3,   drop: 8, decay: 0.5, showGold: 3, showRep: 2, roam: 25 },
  ghost:   { name: '幽靈',   hp: 16, interval: 2.8, drop: 8, decay: 1.5, showGold: 3, showRep: 2, roam: 0 }
};
var COMMON_ROWS = ['#####..#####', '#..........#', '#..........#', '#....S.....#', '#..........#', '#..........#', '############'];
var DUNGEONS = [
  { code: 'cave', name: '濕熱洞窟', sp: ['fire', 'water'], cost: 0, needSp: null, needN: 0, top: [
    '############', '#LL......LL#', '#L..f..f..L#', '#..........#', '#.L......L.#', '#..........#',
    '#####..#####', '#..WW......#', '#.j....WW..#', '#......j...#', '#.WW.......#', '#.....WW...#'] },
  { code: 'cliff', name: '雷鳴崖', sp: ['thunder', 'spike'], cost: 60, needSp: 'water', needN: 2, top: [
    '############', '#..t....t..#', '#.o......o.#', '#..........#', '#.o......o.#', '#..........#',
    '#####..#####', '#..........#', '#.h......h.#', '#...oo.....#', '#.......oo.#', '#..........#'] },
  { code: 'ruins', name: '古代遺跡', sp: ['stone', 'ghost'], cost: 120, needSp: 'spike', needN: 2, top: [
    '############', '#..........#', '#.g..o...g.#', '#....L.....#', '#.o......o.#', '#..........#',
    '#####..#####', '#..........#', '#.p..oo..p.#', '#..........#', '#.L......L.#', '#..........#'] }
];
var NEST_SP = { f: 'fire', j: 'water', t: 'thunder', h: 'spike', g: 'stone', p: 'ghost' };
var BALLS = {
  hot:  { name: '火辣球', cost: 10, desc: '滾去撞到誰, 誰就生氣' },
  cold: { name: '冰涼球', cost: 10, desc: '滾去撞到誰, 誰就冷靜' },
  bell: { name: '鈴鐺球', cost: 15, desc: '滾去撞到誰, 誰就立刻表演' },
  yarn: { name: '毛線球', cost: 15, desc: '滾動時附近的魔物都會追它' }
};
var BALL_LIST = ['hot', 'cold', 'bell', 'yarn'];
var BALL_MAX = 6;
var SHOP_ITEMS = ['club', 'sword', 'spear', 'whip', 'attack', 'armor', 'ropeBag'];
var DAY_MAX = 7;
var GUIDE_PAGES = [
  { title: '地下城', text: '方向鍵走, Z 攻擊, X 武器技' },
  { title: '收服', text: '殘血時站上去, 再繞牠一圈' },
  { title: '擺球', text: '開演前擺球, 開演後只能看' },
  { title: '紅區', text: '紅區最賺, 標記滿 5 個就失控' },
  { title: '目標', text: '7 天內賺到越多名聲越好' }
];
var MON_R = 30;        // 魔物受投射物 / 武器突進判定用的身體半徑(規格沒寫, 取半個圖大小)
var TAMER_R = 18;
var ARENA = { x0: 100, x1: 620, y0: 310, y1: 950 };
var BALL_B = { x0: 84, x1: 636, y0: 294, y1: 966 };
var FIELD = { x0: 60, x1: 660, y0: 270, y1: 990 };
var FENCE_Y = { top: 255, bottom: 1005 };
var SEAT_Y = { top: 190, bottom: 1080 };

// ---------- 狀態 ----------
var G, D = null, S = null;
var held = { up: false, down: false, left: false, right: false, z: false, x: false };
var needRel = { z: false, x: false };
var pressed = [];
var nextId = 1;

function newGame(skipGuide) {
  var caps = {};
  SP_LIST.forEach(function (s) { caps[s] = 0; });
  G = {
    phase: skipGuide ? 'select' : 'guide', guidePage: 0, guideReturn: 'select',
    day: 1, gold: 30, rep: 0, goldEarned: 0, bestChain: 0,
    weapon: 'club', owned: { club: true, sword: false, spear: false, whip: false },
    atk: 0, armorLv: 0, ropeLv: 0,
    shopLv: { attack: 0, armor: 0, ropeBag: 0 },
    shopCost: { attack: 50, armor: 40, ropeBag: 40 },
    roster: [{ sp: 'fire', level: 0 }, { sp: 'water', level: 0 }],
    caps: caps, open: [true, false, false], selIdx: 0,
    floats: [], stars: 0,
    s1: { cur: 0, picked: [] },
    s2: { cur: 0, col: 0, panel: null, cells: [] },
    shopCur: 0
  };
  D = null; S = null;
  needRel.z = held.z; needRel.x = held.x;
}

function rosterLv(sp) {
  for (var i = 0; i < G.roster.length; i++) if (G.roster[i].sp === sp) return G.roster[i].level;
  return -1;
}
function bonus(sp) { return Math.max(0, rosterLv(sp)); }
function addFloat(x, y, text, kind) { G.floats.push({ x: x, y: y, text: text, kind: kind, t: 0, dur: 1 }); }
function addGold(n) { G.gold += n; G.goldEarned += n; }

// ============================================================
// 地下城
// ============================================================
var FACING_VEC = [];
(function () { for (var f = 0; f < 8; f++) { var a = (f - 2) * Math.PI / 4; FACING_VEC.push({ x: Math.cos(a), y: Math.sin(a), ang: a }); } })();

function buildTiles(dg) {
  var rows = dg.top.concat(COMMON_ROWS);
  var grid = [], nests = [], start = { x: 330, y: 930 };
  for (var r = 0; r < 19; r++) {
    var row = [];
    for (var c = 0; c < 12; c++) {
      var ch = rows[r].charAt(c);
      var kind = ch === '#' ? 'wall' : ch === 'o' ? 'pillar' : ch === 'L' ? 'lava' : ch === 'W' ? 'water' : 'floor';
      var room = 'hall';
      if (c >= 1 && c <= 10 && r >= 1 && r <= 5) room = 'top';
      else if (c >= 1 && c <= 10 && r >= 7 && r <= 11) room = 'bottom';
      var nest = !!NEST_SP[ch];
      row.push({ dungeon: dg.code, kind: kind, room: room, nest: nest });
      if (nest) nests.push({ sp: NEST_SP[ch], x: c * 60 + 30, y: r * 60 + 30, room: room, respawn: 0, mon: null });
      if (ch === 'S') start = { x: c * 60 + 30, y: r * 60 + 30 };
    }
    grid.push(row);
  }
  return { grid: grid, nests: nests, start: start };
}

function startDungeon(idx) {
  var dg = DUNGEONS[idx];
  var b = buildTiles(dg);
  var maxH = 5 + G.armorLv + bonus('stone');
  var ropes = 3 + G.ropeLv;
  D = {
    idx: idx, dg: dg, grid: b.grid, nests: b.nests, time: 60, over: false,
    tamer: { x: b.start.x, y: b.start.y, facing: 0, hp: maxH, maxHp: maxH, inv: 0, zCd: 0, xCd: 0, xCdMax: 0, dash: null },
    ropes: ropes, ropeMax: ropes, mons: [], prep: null, lasso: null, fx: []
  };
  hz = [];
  G.floats = [];
  D.nests.forEach(function (n) { spawnMon(n); });
  G.phase = 'dungeon';
  pressed.length = 0;
  needRel.z = held.z; needRel.x = held.x;
}

function roomBounds(room) {
  var m = 30;
  if (room === 'top') return { x0: 60 + m, x1: 660 - m, y0: 60 + m, y1: 360 - m };
  return { x0: 60 + m, x1: 660 - m, y0: 420 + m, y1: 720 - m };
}

function spawnMon(n) {
  var sp = SPECIES[n.sp];
  var m = {
    id: nextId++, sp: n.sp, x: n.x, y: n.y, hp: sp.hp, maxHp: sp.hp, hitT: 0, stun: 0, lassoed: false, alive: true,
    castCd: sp.interval * rnd(0.6, 1), roamAng: rnd(0, 6.28), roamT: rnd(2, 3), dashT: 0, dashCd: rnd(0.5, 2), dashAng: 0,
    rollAng: rnd(0, 6.28), rollT: 4, tpT: rnd(1, 3), knock: null, dirX: 1, nest: n, b: roomBounds(n.room), strafe: 1
  };
  n.mon = m; n.respawn = 0;
  D.mons.push(m);
}

function isWeak(m) { return m.hp <= m.maxHp * 0.3; }

function solidTile(c, r) {
  if (c < 0 || r < 0 || c >= 12 || r >= 19) return true;
  var k = D.grid[r][c].kind;
  return k === 'wall' || k === 'pillar';
}
function circleHitsWall(x, y, rad) {
  var c0 = Math.floor((x - rad) / 60), c1 = Math.floor((x + rad) / 60);
  var r0 = Math.floor((y - rad) / 60), r1 = Math.floor((y + rad) / 60);
  for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
    if (!solidTile(c, r)) continue;
    var nx = clamp(x, c * 60, c * 60 + 60), ny = clamp(y, r * 60, r * 60 + 60);
    var dx = x - nx, dy = y - ny;
    if (dx * dx + dy * dy < rad * rad) return true;
  }
  return false;
}
function tileKindAt(x, y) {
  var c = Math.floor(x / 60), r = Math.floor(y / 60);
  if (c < 0 || r < 0 || c >= 12 || r >= 19) return 'wall';
  return D.grid[r][c].kind;
}
function moveTamer(dx, dy) {
  var t = D.tamer;
  if (!circleHitsWall(t.x + dx, t.y, TAMER_R)) t.x += dx;
  if (!circleHitsWall(t.x, t.y + dy, TAMER_R)) t.y += dy;
}

// ---- 技能 / 投射物(地下城與表演場共用) ----
var hz = [];
function newHz(kind, x, y, owner, perf) {
  var h = { kind: kind, phase: 'warn', x: x, y: y, radius: 0, t: 0, dur: 0, angle: 0, reflected: false, owner: owner, perf: perf || null,
    hit: [], ballHit: [], speed: 0, turn: 0, target: null, homing: false, dead: false, fixed: false };
  if (perf) perf.pending++;
  hz.push(h);
  return h;
}
// target: 物件(有 x,y)或 {x,y}
function spawnSkill(sp, owner, ox, oy, target, perf) {
  var tx = target.x, ty = target.y, a = Math.atan2(ty - oy, tx - ox), h, i;
  if (sp === 'fire') {
    h = newHz('firering', ox, oy, owner, perf); h.radius = 120; h.dur = 0.5;
  } else if (sp === 'thunder') {
    h = newHz('thunder', tx, ty, owner, perf); h.radius = 70; h.dur = 0.8; h.fixed = true;
  } else if (sp === 'stone') {
    h = newHz('quake', ox, oy, owner, perf); h.phase = 'active'; h.radius = 0; h.dur = 1; h.fixed = true;
  } else if (sp === 'water') {
    for (i = -1; i <= 1; i++) {
      h = newHz('waterball', ox, oy, owner, perf); h.phase = 'fly'; h.radius = 12; h.speed = 300; h.angle = a + i * 20 * Math.PI / 180;
    }
  } else if (sp === 'spike') {
    for (i = 0; i < 8; i++) {
      h = newHz('spike', ox, oy, owner, perf); h.phase = 'fly'; h.radius = 10; h.speed = 260; h.angle = i * Math.PI / 4;
    }
  } else if (sp === 'ghost') {
    h = newHz('wisp', ox, oy, owner, perf); h.phase = 'fly'; h.radius = 14; h.speed = 160; h.angle = a; h.dur = 3;
    h.homing = true; h.target = target;
  }
}

function cancelWarn(m) {
  for (var i = 0; i < hz.length; i++) {
    var h = hz[i];
    if (h.owner === m && h.phase === 'warn' && (h.kind === 'firering' || h.kind === 'thunder')) h.dead = true;
  }
}

function inRing(h, px, py) {
  var d = hyp(px - h.x, py - h.y);
  if (h.kind === 'quake') return Math.abs(d - h.radius) <= 15;
  return d <= h.radius;
}

function updateHazards(dt, mode) {
  var i, h;
  for (i = 0; i < hz.length; i++) {
    h = hz[i];
    if (h.dead) continue;
    if (h.kind === 'firering' || h.kind === 'thunder') {
      if (h.phase === 'warn') {
        if (h.kind === 'firering' && h.owner && h.owner.alive !== false && !h.owner.loose) { h.x = h.owner.x; h.y = h.owner.y; }
        h.t += dt;
        if (h.t >= h.dur) {
          h.phase = 'active'; h.t = 0; h.dur = h.kind === 'firering' ? 0.5 : 0.2;
          if (h.kind === 'thunder') areaHit(h, mode);
        }
      }
      if (h.phase === 'active') {
        if (h.kind === 'firering') areaHit(h, mode);
        h.t += dt;
        if (h.t >= h.dur) h.dead = true;
      }
    } else if (h.kind === 'quake') {
      h.t += dt;
      h.radius = 220 * Math.min(1, h.t / h.dur);
      areaHit(h, mode);
      if (h.t >= h.dur) h.dead = true;
    } else {
      projUpdate(h, dt, mode);
    }
  }
  var keep = [];
  for (i = 0; i < hz.length; i++) {
    h = hz[i];
    if (h.dead) { if (h.perf) { h.perf.pending--; checkPerf(h.perf); } } else keep.push(h);
  }
  hz = keep;
}

function areaHit(h, mode) {
  var i;
  if (mode === 'dungeon') {
    if (h.hitTamer) return;
    var t = D.tamer;
    if (inRing(h, t.x, t.y)) { h.hitTamer = true; damageTamer(); }
    return;
  }
  for (i = 0; i < S.mons.length; i++) {
    var m = S.mons[i];
    if (m.loose || m === h.owner || h.hit.indexOf(m) >= 0) continue;
    if (inRing(h, m.x, m.y)) { h.hit.push(m); skillHitMon(h, m); }
  }
  for (i = 0; i < S.balls.length; i++) {
    var b = S.balls[i];
    if (h.ballHit.indexOf(b) >= 0) continue;
    if (inRing(h, b.x, b.y)) {
      h.ballHit.push(b);
      var d = hyp(b.x - h.x, b.y - h.y);
      var ang = d < 0.001 ? rnd(0, 6.28) : Math.atan2(b.y - h.y, b.x - h.x);
      pushBall(b, 380, ang, h.owner, h.perf ? h.perf.stage : 1);
    }
  }
}

function projUpdate(h, dt, mode) {
  var i;
  if (h.homing && !h.reflected && h.target) {
    var tg = h.target;
    if (!tg.loose) {
      var want = Math.atan2(tg.y - h.y, tg.x - h.x);
      var diff = wrapAng(want - h.angle), mx = 120 * Math.PI / 180 * dt;
      h.angle += clamp(diff, -mx, mx);
    }
  }
  var sp = h.speed * dt;
  h.x += Math.cos(h.angle) * sp; h.y += Math.sin(h.angle) * sp;
  h.t += dt;
  if (h.kind === 'wisp' && h.t >= h.dur) { h.dead = true; return; }
  if (mode === 'dungeon') {
    if (solidTile(Math.floor(h.x / 60), Math.floor(h.y / 60))) { h.dead = true; return; }
    if (!h.reflected) {
      var t = D.tamer;
      if (hyp(t.x - h.x, t.y - h.y) <= TAMER_R + h.radius && t.inv <= 0 && !t.dash) { damageTamer(); h.dead = true; }
    } else {
      for (i = 0; i < D.mons.length; i++) {
        var m = D.mons[i];
        if (m.lassoed) continue;
        if (hyp(m.x - h.x, m.y - h.y) <= MON_R + h.radius) { dmgMon(m, 3 + G.atk); h.dead = true; return; }
      }
    }
    return;
  }
  // 表演場
  if (h.x < FIELD.x0 || h.x > FIELD.x1 || h.y < FIELD.y0 || h.y > FIELD.y1) { h.dead = true; return; }
  var bm = null, bmd = 1e9, bb = null, bbd = 1e9, d;
  for (i = 0; i < S.mons.length; i++) {
    var mm = S.mons[i];
    if (mm.loose || mm === h.owner) continue;
    d = hyp(mm.x - h.x, mm.y - h.y);
    if (d <= MON_R + h.radius && d < bmd) { bm = mm; bmd = d; }
  }
  for (i = 0; i < S.balls.length; i++) {
    var ba = S.balls[i];
    d = hyp(ba.x - h.x, ba.y - h.y);
    if (d <= 24 + h.radius && d < bbd) { bb = ba; bbd = d; }
  }
  if (bb && (!bm || bbd < bmd)) {
    pushBall(bb, 380, h.angle, h.owner, h.perf ? h.perf.stage : 1);
    h.dead = true;
  } else if (bm) {
    skillHitMon(h, bm);
    h.dead = true;
  }
}

function damageTamer() {
  var t = D.tamer;
  if (t.inv > 0 || t.dash) return;
  t.hp -= 1; t.inv = 1;
  if (D.lasso) breakLasso();
  if (t.hp <= 0) D.over = true;
}

function dmgMon(m, d) {
  if (m.lassoed || !m.alive) return;
  m.hp -= d; m.hitT = 0.1;
  if (D.prep && D.prep.mon === m) D.prep = null;
  if (m.hp <= 0) {
    m.alive = false;
    cancelWarn(m);
    m.nest.mon = null; m.nest.respawn = 8;
    var g = SPECIES[m.sp].drop;
    addGold(g);
    addFloat(m.x, m.y + 130 - 50, '+' + g, 'gold');
  }
}

// ---- 武器 ----
var WEAPON_Z = {
  club:  { shape: 'arc', spread: 100, radius: 70, dmg: 2, cd: 0.35 },
  sword: { shape: 'arc', spread: 120, radius: 80, dmg: 2, cd: 0.35 },
  spear: { shape: 'line', length: 170, width: 40, dmg: 2, cd: 0.45 },
  whip:  { shape: 'circle', radius: 100, dmg: 1, cd: 0.4 }
};
var WEAPON_X_CD = { sword: 3, spear: 1.2, whip: 1.2 };

function inShape(shape, mx, my, ox, oy, ang, spreadRad, radius, length, width) {
  var dx = mx - ox, dy = my - oy;
  if (shape === 'circle') return hyp(dx, dy) <= radius;
  if (shape === 'arc') {
    var d = hyp(dx, dy);
    if (d > radius) return false;
    if (d < 0.001) return true;
    return Math.abs(wrapAng(Math.atan2(dy, dx) - ang)) <= spreadRad / 2;
  }
  var u = dx * Math.cos(ang) + dy * Math.sin(ang), v = -dx * Math.sin(ang) + dy * Math.cos(ang);
  return u >= 0 && u <= length && Math.abs(v) <= width / 2;
}

function addFx(weapon, move, shape, ang, spread, radius, length, width, dur) {
  var t = D.tamer;
  D.fx.push({ x: t.x, y: t.y, weapon: weapon, move: move, shape: shape, angle: ang, spread: spread, radius: radius, length: length, width: width, t: 0, dur: dur });
}

function attackZ() {
  var t = D.tamer, w = G.weapon, def = WEAPON_Z[w], ang = FACING_VEC[t.facing].ang, i, m;
  var mul = 1 + 0.1 * bonus('fire');
  var radius = (def.radius || 0) * (w === 'club' || w === 'sword' || w === 'whip' ? mul : 1);
  var length = (def.length || 0) * mul;
  var spread = (def.spread || 0) * Math.PI / 180;
  t.zCd = def.cd;
  addFx(w, 'normal', def.shape, ang, spread, radius, length, def.width || 0, 0.2);
  var dmg = def.dmg + G.atk;
  var list = D.mons.slice();
  for (i = 0; i < list.length; i++) {
    m = list[i];
    if (!m.alive) continue;
    if (inShape(def.shape, m.x, m.y, t.x, t.y, ang, spread, radius, length, def.width)) dmgMon(m, dmg);
  }
  if (w === 'sword') {
    for (i = 0; i < hz.length; i++) {
      var h = hz[i];
      if (h.dead || h.reflected || h.phase !== 'fly') continue;
      if (h.kind !== 'waterball' && h.kind !== 'spike' && h.kind !== 'wisp') continue;
      if (inShape('arc', h.x, h.y, t.x, t.y, ang, spread, radius, 0, 0)) reflectHz(h);
    }
  }
}

function reflectHz(h) {
  var t = D.tamer, o = h.owner;
  if (o && o.alive) h.angle = Math.atan2(o.y - t.y, o.x - t.x); else h.angle += Math.PI;
  h.speed *= 1.2; h.reflected = true; h.homing = false;
}

function attackX() {
  var t = D.tamer, w = G.weapon, i, m;
  if (w === 'club') return;
  var ang = FACING_VEC[t.facing].ang;
  var cd = WEAPON_X_CD[w] * (1 - 0.15 * bonus('spike'));
  t.xCd = cd; t.xCdMax = cd;
  var list = D.mons.slice();
  if (w === 'sword') {
    var sp = 120 * Math.PI / 180;
    addFx(w, 'skill', 'arc', ang, sp, 80, 0, 0, 0.2);
    for (i = 0; i < list.length; i++) {
      m = list[i];
      if (!m.alive || m.lassoed) continue;
      if (inShape('arc', m.x, m.y, t.x, t.y, ang, sp, 80, 0, 0)) { m.stun = 2; cancelWarn(m); }
    }
  } else if (w === 'spear') {
    var v = FACING_VEC[t.facing];
    t.dash = { t: 0, dur: 0.25, vx: v.x, vy: v.y, left: 220, hit: [] };
    addFx(w, 'skill', 'dash', ang, 0, 0, 220, 0, 0.25);
  } else if (w === 'whip') {
    var sp2 = 100 * Math.PI / 180;
    addFx(w, 'skill', 'arc', ang, sp2, 170, 0, 0, 0.2);
    for (i = 0; i < list.length; i++) {
      m = list[i];
      if (!m.alive) continue;
      if (inShape('arc', m.x, m.y, t.x, t.y, ang, sp2, 170, 0, 0)) {
        var a2 = Math.atan2(m.y - t.y, m.x - t.x);
        dmgMon(m, 2 + G.atk);
        if (m.alive && !m.lassoed) m.knock = { vx: Math.cos(a2) * 640, vy: Math.sin(a2) * 640, t: 0.25 };
      }
    }
  }
}

function updateDash(dt) {
  var t = D.tamer, ds = t.dash;
  var step = 220 / 0.25 * dt, remain = Math.min(step, ds.left), n = Math.ceil(remain / 8), i, j;
  var moved = 0;
  var px = t.x, py = t.y;
  for (i = 0; i < n; i++) {
    var s = remain / n;
    if (circleHitsWall(t.x + ds.vx * s, t.y + ds.vy * s, TAMER_R)) { ds.left = 0; break; }
    t.x += ds.vx * s; t.y += ds.vy * s; moved += s;
  }
  ds.left -= moved;
  // 掃過的魔物
  for (j = 0; j < D.mons.length; j++) {
    var m = D.mons[j];
    if (!m.alive || m.lassoed || ds.hit.indexOf(m) >= 0) continue;
    var vx = t.x - px, vy = t.y - py, l2 = vx * vx + vy * vy, u = 0;
    if (l2 > 0) u = clamp(((m.x - px) * vx + (m.y - py) * vy) / l2, 0, 1);
    if (hyp(m.x - (px + vx * u), m.y - (py + vy * u)) <= 40) { ds.hit.push(m); dmgMon(m, 3 + G.atk); }
  }
  ds.t += dt;
  if (ds.t >= ds.dur || ds.left <= 0.01) t.dash = null;
}

// ---- 魔物 AI(地下城) ----
function clampMon(m) { m.x = clamp(m.x, m.b.x0, m.b.x1); m.y = clamp(m.y, m.b.y0, m.b.y1); }
function stepMon(m, ang, spd, dt) {
  m.x += Math.cos(ang) * spd * dt; m.y += Math.sin(ang) * spd * dt;
  if (Math.cos(ang) !== 0) m.dirX = sgn(Math.cos(ang));
  clampMon(m);
}
function roamMon(m, spd, dt) {
  m.roamT -= dt;
  if (m.roamT <= 0) { m.roamAng = rnd(0, 6.28); m.roamT = rnd(2, 3); }
  stepMon(m, m.roamAng, spd, dt);
}

function updateMon(m, dt) {
  if (m.hitT > 0) m.hitT -= dt;
  if (m.knock) {
    m.x += m.knock.vx * dt; m.y += m.knock.vy * dt; clampMon(m);
    m.knock.t -= dt; if (m.knock.t <= 0) m.knock = null;
    return;
  }
  if (m.lassoed) return;
  if (m.stun > 0) { m.stun -= dt; return; }
  var t = D.tamer, dx = t.x - m.x, dy = t.y - m.y, dist = hyp(dx, dy), toT = Math.atan2(dy, dx);
  var k = isWeak(m) ? 0.5 : 1, near = dist < 320;
  switch (m.sp) {
    case 'fire':
      if (!near) roamMon(m, 40 * k, dt); else if (dist > 80) stepMon(m, toT, 70 * k, dt);
      break;
    case 'water':
      if (!near) roamMon(m, 40 * k, dt);
      else if (dist < 220) stepMon(m, toT + Math.PI, 60 * k, dt);
      else stepMon(m, toT + m.strafe * Math.PI / 2, 40 * k, dt);
      break;
    case 'thunder':
      if (m.dashT > 0) { stepMon(m, m.dashAng, 600 * k, dt); m.dashT -= dt; }
      else {
        m.dashCd -= dt;
        if (m.dashCd <= 0) { m.dashT = 0.3; m.dashAng = rnd(0, 6.28); m.dashCd = 2; }
      }
      break;
    case 'spike':
      m.rollT -= dt;
      if (m.rollT <= 0) { m.rollAng = rnd(0, 6.28); m.rollT = 4; }
      var vx = Math.cos(m.rollAng), vy = Math.sin(m.rollAng);
      m.x += vx * 110 * k * dt; m.y += vy * 110 * k * dt;
      if (m.x < m.b.x0) { m.x = m.b.x0; vx = Math.abs(vx); }
      if (m.x > m.b.x1) { m.x = m.b.x1; vx = -Math.abs(vx); }
      if (m.y < m.b.y0) { m.y = m.b.y0; vy = Math.abs(vy); }
      if (m.y > m.b.y1) { m.y = m.b.y1; vy = -Math.abs(vy); }
      m.rollAng = Math.atan2(vy, vx);
      m.dirX = sgn(vx);
      break;
    case 'stone':
      if (!near) roamMon(m, 25 * k, dt); else stepMon(m, toT, 35 * k, dt);
      break;
    case 'ghost':
      m.tpT -= dt;
      if (m.tpT <= 0) {
        m.tpT = 3;
        var cands = [];
        for (var r = 0; r < 19; r++) for (var c = 0; c < 12; c++) {
          var tl = D.grid[r][c];
          if (tl.kind !== 'floor' || tl.room !== m.nest.room) continue;
          var px = c * 60 + 30, py = r * 60 + 30;
          if (hyp(px - t.x, py - t.y) >= 120) cands.push({ x: px, y: py });
        }
        if (cands.length) { var p = pick(cands); m.x = p.x; m.y = p.y; }
      }
      break;
  }
  if (near) {
    m.castCd -= dt;
    if (m.castCd <= 0) {
      m.castCd = SPECIES[m.sp].interval * (isWeak(m) ? 1.5 : 1);
      spawnSkill(m.sp, m, m.x, m.y, t, null);
    }
  }
}

// ---- 捕捉 ----
function breakLasso() {
  if (!D.lasso) return;
  D.lasso.mon.lassoed = false;
  D.lasso = null;
}

function updateCapture(dt) {
  var t = D.tamer, i, m;
  if (D.lasso) {
    var l = D.lasso;
    m = l.mon;
    var dx = t.x - m.x, dy = t.y - m.y, d = hyp(dx, dy);
    if (d > 4) {
      var a = Math.atan2(dy, dx);
      l.sum += wrapAng(a - l.last); l.last = a;
    }
    l.progress = Math.min(1, Math.abs(l.sum) / (Math.PI * 2));
    l.t += dt;
    if (l.progress >= 1) { captureDone(m); return; }
    if (l.t >= l.limit || d > 220) breakLasso();
    return;
  }
  if (D.ropes <= 0) { D.prep = null; return; }
  var best = null, bd = 1e9;
  for (i = 0; i < D.mons.length; i++) {
    m = D.mons[i];
    if (!m.alive || m.lassoed || !isWeak(m)) continue;
    var dd = hyp(t.x - m.x, t.y - m.y);
    if (dd <= 40 && dd < bd) { best = m; bd = dd; }
  }
  if (!best) { D.prep = null; return; }
  var dur = Math.max(0.35, 0.8 - 0.15 * bonus('water'));
  if (D.prep && D.prep.mon === best) { D.prep.t += dt; D.prep.dur = dur; }
  else D.prep = { mon: best, t: 0, dur: dur };
  if (D.prep.t >= D.prep.dur) {
    var a0 = Math.atan2(t.y - best.y, t.x - best.x);
    D.lasso = { mon: best, t: 0, sum: 0, last: a0, limit: 5 + bonus('ghost'), progress: 0 };
    best.lassoed = true; cancelWarn(best);
    D.prep = null;
  }
}

function captureDone(m) {
  D.lasso = null;
  D.ropes -= 1;
  m.alive = false; m.lassoed = false;
  m.nest.mon = null; m.nest.respawn = 8;
  addFloat(m.x, m.y + 130 - 50, '收服!', 'capture');
  G.caps[m.sp]++;
  var lv = rosterLv(m.sp);
  if (lv < 0) G.roster.push({ sp: m.sp, level: 0 });
  else if (lv < 3) {
    for (var i = 0; i < G.roster.length; i++) if (G.roster[i].sp === m.sp) G.roster[i].level++;
    addFloat(m.x, m.y + 130 - 90, '等級 +1', 'levelUp');
  } else {
    addGold(20);
    addFloat(m.x, m.y + 130 - 90, '+20', 'coin20');
  }
}

function updateDungeon(dt) {
  var t = D.tamer, i;
  D.time -= dt;
  if (t.inv > 0) t.inv -= dt;
  if (t.zCd > 0) t.zCd -= dt;
  if (t.xCd > 0) t.xCd -= dt;

  if (t.dash) updateDash(dt);
  else {
    var ix = (held.right ? 1 : 0) - (held.left ? 1 : 0), iy = (held.down ? 1 : 0) - (held.up ? 1 : 0);
    if (ix || iy) {
      var n = hyp(ix, iy);
      t.facing = ((Math.round(Math.atan2(iy, ix) / (Math.PI / 4) + 2) % 8) + 8) % 8;
      var spd = 300 + 25 * bonus('thunder');
      if (tileKindAt(t.x, t.y) === 'water') spd *= 0.5;
      moveTamer(ix / n * spd * dt, iy / n * spd * dt);
    }
    if (held.z && !needRel.z && t.zCd <= 0) attackZ();
    if (held.x && !needRel.x && t.xCd <= 0) attackX();
  }
  // 熔岩
  if (!t.dash && t.inv <= 0 && tileKindAt(t.x, t.y) === 'lava') damageTamer();

  for (i = 0; i < D.mons.length; i++) updateMon(D.mons[i], dt);
  D.mons = D.mons.filter(function (m) { return m.alive; });
  updateHazards(dt, 'dungeon');
  updateCapture(dt);
  for (i = 0; i < D.nests.length; i++) {
    var n2 = D.nests[i];
    if (!n2.mon && n2.respawn > 0) { n2.respawn -= dt; if (n2.respawn <= 0) spawnMon(n2); }
  }
  D.fx.forEach(function (f) { f.t += dt; });
  D.fx = D.fx.filter(function (f) { return f.t < f.dur; });
  if (D.over || D.time <= 0) endDungeon();
}

function endDungeon() {
  if (D.lasso) breakLasso();
  hz = [];
  D = null;
  G.floats = [];
  G.s1 = { cur: 0, picked: [] };
  G.s2 = { cur: 0, col: 0, panel: null, cells: [] };
  G.phase = 'setup1';
  pressed.length = 0;
}

// ============================================================
// 布置階段
// ============================================================
function ballRefund(cell) { return cell && cell.type === 'ball' ? BALLS[cell.key].cost : 0; }
function countBalls() { var n = 0; G.s2.cells.forEach(function (c) { if (c && c.type === 'ball') n++; }); return n; }
function countPlaced() { var n = 0; G.s2.cells.forEach(function (c) { if (c && c.type === 'monster') n++; }); return n; }
function initCells() { G.s2.cells = []; for (var i = 0; i < 12; i++) G.s2.cells.push(null); }
function clearCell(i) {
  var c = G.s2.cells[i];
  if (c && c.type === 'ball') G.gold += BALLS[c.key].cost;
  G.s2.cells[i] = null;
}
function cellCenter(i) { return { x: 160 + 200 * (i % 3), y: 360 + 180 * Math.floor(i / 3) }; }

function buildPanelOptions(cellIdx) {
  var cur = G.s2.cells[cellIdx], opts = [];
  G.s1.picked.forEach(function (sp) {
    var placed = G.s2.cells.some(function (c) { return c && c.type === 'monster' && c.key === sp; });
    if (!placed) opts.push({ type: 'monster', key: sp, name: SPECIES[sp].name, cost: 0, desc: '', affordable: true });
  });
  var balls = countBalls() - (cur && cur.type === 'ball' ? 1 : 0);
  BALL_LIST.forEach(function (b) {
    var aff = balls < BALL_MAX && (G.gold + ballRefund(cur)) >= BALLS[b].cost;
    opts.push({ type: 'ball', key: b, name: BALLS[b].name, cost: BALLS[b].cost, desc: BALLS[b].desc, affordable: aff });
  });
  opts.push({ type: 'clear', key: 'clear', name: '清空', cost: 0, desc: '', affordable: true });
  return opts;
}

function handleSetup1(k) {
  var s = G.s1, n = G.roster.length;
  if (k === 'left') { if (s.cur < n && s.cur % 2 === 1) s.cur--; }
  else if (k === 'right') { if (s.cur < n && s.cur % 2 === 0 && s.cur + 1 < n) s.cur++; }
  else if (k === 'up') { if (s.cur === n) s.cur = n - 1; else if (s.cur >= 2) s.cur -= 2; }
  else if (k === 'down') { if (s.cur < n) { if (s.cur + 2 < n) s.cur += 2; else s.cur = n; } }
  else if (k === 'z') {
    if (s.cur < n) {
      var sp = G.roster[s.cur].sp, i = s.picked.indexOf(sp);
      if (i >= 0) s.picked.splice(i, 1); else if (s.picked.length < 4) s.picked.push(sp);
    } else if (s.picked.length >= 1) {
      initCells(); G.s2.cur = 0; G.s2.col = 0; G.s2.panel = null;
      G.phase = 'setup2';
      pressed.length = 0;
    }
  }
}

function handleSetup2(k) {
  var s = G.s2, i;
  if (s.panel) {
    var p = s.panel;
    if (k === 'up') p.index = Math.max(0, p.index - 1);
    else if (k === 'down') p.index = Math.min(p.options.length - 1, p.index + 1);
    else if (k === 'x') s.panel = null;
    else if (k === 'z') {
      var o = p.options[p.index];
      if (!o.affordable) return;
      if (o.type === 'clear') clearCell(p.cell);
      else {
        clearCell(p.cell);
        if (o.type === 'ball') { G.gold -= o.cost; s.cells[p.cell] = { type: 'ball', key: o.key }; }
        else s.cells[p.cell] = { type: 'monster', key: o.key };
      }
      s.panel = null;
    }
    return;
  }
  var r = Math.floor(s.cur / 3), c = s.cur % 3;
  if (s.cur < 12) {
    if (k === 'left') { c = Math.max(0, c - 1); s.cur = r * 3 + c; s.col = c; }
    else if (k === 'right') { c = Math.min(2, c + 1); s.cur = r * 3 + c; s.col = c; }
    else if (k === 'up') { if (r > 0) s.cur -= 3; }
    else if (k === 'down') { if (r < 3) s.cur += 3; else s.cur = 12; }
    else if (k === 'z') s.panel = { cell: s.cur, index: 0, options: buildPanelOptions(s.cur) };
    else if (k === 'x') clearCell(s.cur);
  } else {
    if (k === 'up') s.cur = 9 + s.col;
    else if (k === 'z') startShow();
    else if (k === 'x') {
      for (i = 0; i < 12; i++) clearCell(i);
      G.s2 = { cur: 0, col: 0, panel: null, cells: [] };
      G.phase = 'setup1';
      pressed.length = 0;
    }
  }
}

// ============================================================
// 表演場
// ============================================================
function startShow() {
  var cells = G.s2.cells, i;
  var placedSp = {};
  cells.forEach(function (c) { if (c && c.type === 'monster') placedSp[c.key] = true; });
  var empties = [];
  for (i = 0; i < 12; i++) if (!cells[i]) empties.push(i);
  G.s1.picked.forEach(function (sp) {
    if (placedSp[sp]) return;
    var j = Math.floor(Math.random() * empties.length);
    cells[empties[j]] = { type: 'monster', key: sp };
    empties.splice(j, 1);
  });
  S = { t: 0, mons: [], balls: [], perfs: [], pair: {}, fences: { top: [], bottom: [] }, vis: { top: [], bottom: [] } };
  for (i = 0; i < 6; i++) {
    ['top', 'bottom'].forEach(function (sd) {
      S.fences[sd].push({ broken: false });
      S.vis[sd].push({ mode: 'watch', t: 0 });
    });
  }
  for (i = 0; i < 12; i++) {
    var c = cells[i];
    if (!c) continue;
    var p = cellCenter(i);
    if (c.type === 'monster') {
      var lv = rosterLv(c.key);
      S.mons.push({
        id: nextId++, sp: c.key, level: lv, x: p.x, y: p.y, rage: 60, redLow: 80 - 5 * lv, marks: 0, markT: 0, slow: false,
        perfTimer: rnd(0.5, 2), performing: false, perfT: 0, fx: 'none', fxT: 0, relay: null, lastRelay: -99,
        loose: false, mode: 'roam', chargeT: 0, looseT: 0, arrived: false, side: 'top', fi: 0, runDir: 1, atkT: 0,
        dashT: 0, dashRem: 0, dashAng: 0, dashCd: rnd(0.5, 2), dirX: 1, hunt: null, lastTouched: null, flee: 0, fleeFrom: null,
        orbit: null, orbitT: 0, rollAng: rnd(0, 6.28), rollT: 4, tpT: rnd(1, 3), wAng: rnd(0, 6.28), wT: rnd(2, 3)
      });
    } else {
      S.balls.push({ kind: c.key, x: p.x, y: p.y, vx: 0, vy: 0, pusher: null, pushT: -99, stage: 0, hits: {}, hitT: 0, reacting: false });
    }
  }
  hz = [];
  G.floats = [];
  G.phase = 'show';
  pressed.length = 0;
}

function interval(rage) { return 4 - (clamp(rage, 50, 100) - 50) / 50 * 2.5; }
function others(m) { return S.mons.filter(function (o) { return o !== m && !o.loose; }); }
function nearestOther(m) {
  var best = null, bd = 1e9;
  others(m).forEach(function (o) { var d = hyp(o.x - m.x, o.y - m.y); if (d < bd) { bd = d; best = o; } });
  return best;
}

// ---- 怒氣 ----
function raiseRage(m, amt) {
  if (m.marks > 0 || m.rage >= 100) return;
  m.rage = Math.min(100, m.rage + amt);
  m.fx = 'ignited'; m.fxT = 0;
  if (m.rage >= 100) { m.marks = 1; m.markT = 4; m.slow = false; }
}
function ignite(m, amt, stage) {
  if (m.loose) return;
  if (m.marks > 0) {
    m.marks++; m.markT = 4; m.fx = 'ignited'; m.fxT = 0;
    if (m.marks >= 5) { startLoose(m); return; }
  } else raiseRage(m, amt);
  if (m.rage >= m.redLow && !m.loose && S.t - m.lastRelay >= 1.5 && !m.relay) {
    m.relay = { t: 0.3, stage: stage + 1 };
    m.lastRelay = S.t;
  }
}
function douse(m, amt) {
  if (m.loose) return;
  m.fx = 'doused'; m.fxT = 0;
  if (m.marks > 0) {
    m.marks--; m.markT = 4;
    if (m.marks === 0) { m.slow = true; m.markT = 0; }
  } else m.rage = Math.max(0, m.rage - amt);
}
function skillHitMon(h, m) {
  if (h.perf && h.perf.hits.indexOf(m) < 0) h.perf.hits.push(m);
  var stage = h.perf ? h.perf.stage : 1;
  switch (h.kind) {
    case 'firering': case 'thunder': case 'quake': ignite(m, 15, stage); break;
    case 'spike': ignite(m, 10, stage); break;
    case 'waterball': douse(m, 20); break;
    case 'wisp': douse(m, 15); break;
  }
}

function startLoose(m) {
  m.loose = true; m.mode = 'charge'; m.marks = 0; m.markT = 0; m.slow = false; m.relay = null;
  m.chargeT = 0; m.looseT = 0; m.arrived = false; m.rage = 100; m.performing = false;
  m.side = m.y < 630 ? 'top' : 'bottom';
  m.fi = clamp(Math.floor((m.x - 60) / 100), 0, 5);
}

// ---- 表演 ----
function perform(m, stage) {
  if (m.loose) return;
  var perf = { m: m, stage: stage, red: m.rage >= m.redLow, hits: [], pending: 0, spawned: false, done: false };
  S.perfs.push(perf);
  if (stage > G.bestChain) G.bestChain = stage;
  m.performing = true; m.perfT = 0;
  m.perfTimer = interval(Math.max(50, m.rage));
  var tg = nearestOther(m) || { x: 360, y: 630 };
  spawnSkill(m.sp, m, m.x, m.y, tg, perf);
  perf.spawned = true;
  checkPerf(perf);
}
function checkPerf(perf) {
  if (!perf.spawned || perf.done || perf.pending > 0) return;
  finalizePerf(perf);
}
function finalizePerf(perf) {
  if (perf.done) return;
  perf.done = true;
  var m = perf.m, sp = SPECIES[m.sp];
  var gold = sp.showGold * (1 + 0.5 * perf.hits.length) * (perf.red ? 2 : 1) * (1 + 0.25 * (perf.stage - 1)) * Math.min(3, 1 + G.rep / 200);
  gold = Math.max(1, Math.round(gold));
  addGold(gold);
  G.rep += sp.showRep;
  var text = '+' + gold, kind = 'gold';
  if (perf.red) { text += ' ×2'; kind = 'redGold'; }
  if (perf.stage >= 2) { text += ' 連鎖 ' + perf.stage; kind = 'chain'; }
  addFloat(m.x, m.y - 60, text, kind);
}

// ---- 球 ----
function ballSpeed(b) { return hyp(b.vx, b.vy); }
function pushBall(b, spd, ang, owner, stage) {
  b.vx = Math.cos(ang) * spd; b.vy = Math.sin(ang) * spd;
  b.pusher = owner || null; b.pushT = S.t; b.stage = stage;
}

function updateBalls(dt) {
  var i, j, b, m;
  for (i = 0; i < S.balls.length; i++) {
    b = S.balls[i];
    if (b.reacting) { b.hitT += dt; if (b.hitT >= 0.3) { b.reacting = false; b.hitT = 0; } }
    for (j = 0; j < S.mons.length; j++) {
      m = S.mons[j];
      if (m.loose) continue;
      var dx = b.x - m.x, dy = b.y - m.y, d = hyp(dx, dy);
      if (d > 64) continue;
      var sp = ballSpeed(b);
      if (sp < 80) {
        // 踢
        var ang = d < 0.001 ? rnd(0, 6.28) : Math.atan2(dy, dx);
        pushBall(b, 320, ang, m, 0);
      } else {
        if (b.pusher === m && S.t - b.pushT <= 0.5) continue;
        var last = b.hits[m.id];
        var effect = last === undefined || S.t - last >= 1;
        var nx = d < 0.001 ? 1 : dx / d, ny = d < 0.001 ? 0 : dy / d;
        var dot = b.vx * nx + b.vy * ny;
        if (dot < 0) { b.vx = (b.vx - 2 * dot * nx) * 0.8; b.vy = (b.vy - 2 * dot * ny) * 0.8; }
        if (effect) {
          b.hits[m.id] = S.t;
          b.reacting = true; b.hitT = 0;
          if (b.kind === 'hot') ignite(m, 15, b.stage);
          else if (b.kind === 'cold') douse(m, 20);
          else if (b.kind === 'bell') { if (m.rage >= 50) perform(m, b.stage + 1); }
          b.pusher = m; b.pushT = S.t;
        }
      }
    }
    // 移動與減速
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < BALL_B.x0) { b.x = BALL_B.x0; b.vx = Math.abs(b.vx); }
    if (b.x > BALL_B.x1) { b.x = BALL_B.x1; b.vx = -Math.abs(b.vx); }
    if (b.y < BALL_B.y0) { b.y = BALL_B.y0; b.vy = Math.abs(b.vy); }
    if (b.y > BALL_B.y1) { b.y = BALL_B.y1; b.vy = -Math.abs(b.vy); }
    var s2 = ballSpeed(b);
    if (s2 > 0) {
      var ns = s2 - 150 * dt;
      if (ns < 20) { b.vx = 0; b.vy = 0; } else { b.vx *= ns / s2; b.vy *= ns / s2; }
    }
  }
}

// ---- 表演場移動 ----
function showStep(m, ang, spd, dt) {
  m.x += Math.cos(ang) * spd * dt; m.y += Math.sin(ang) * spd * dt;
  var cx = Math.cos(ang);
  if (Math.abs(cx) > 0.01) m.dirX = sgn(cx);
}
function showRoam(m, dt) {
  m.wT -= dt;
  if (m.wT <= 0) { m.wAng = rnd(0, 6.28); m.wT = rnd(2, 3); }
  showStep(m, m.wAng, 50, dt);
}
function clampArena(m) { m.x = clamp(m.x, ARENA.x0, ARENA.x1); m.y = clamp(m.y, ARENA.y0, ARENA.y1); }

function showMove(m, dt) {
  var i, yarn = null, yd = 1e9;
  for (i = 0; i < S.balls.length; i++) {
    var b = S.balls[i];
    if (b.kind !== 'yarn' || ballSpeed(b) < 80) continue;
    var d0 = hyp(b.x - m.x, b.y - m.y);
    if (d0 <= 220 && d0 < yd) { yd = d0; yarn = b; }
  }
  if (yarn) {
    m.mode = 'chase'; m.dashT = 0;
    showStep(m, Math.atan2(yarn.y - m.y, yarn.x - m.x), 90, dt);
    return;
  }
  m.mode = 'roam';
  var os = others(m), tg, a, d;
  switch (m.sp) {
    case 'fire':
      if (m.flee > 0) {
        m.flee -= dt;
        showStep(m, Math.atan2(m.y - m.fleeFrom.y, m.x - m.fleeFrom.x), 75, dt);
        if (m.flee <= 0) { m.lastTouched = null; m.hunt = null; }
      } else if (!os.length) showRoam(m, dt);
      else {
        tg = m.hunt;
        if (!tg || tg.loose) {
          var cand = os.filter(function (o) { return o !== m.lastTouched; });
          if (!cand.length) cand = os;
          tg = m.hunt = pick(cand);
        }
        showStep(m, Math.atan2(tg.y - m.y, tg.x - m.x), 75, dt);
        if (hyp(tg.x - m.x, tg.y - m.y) <= 70) {
          m.lastTouched = tg;
          var c2 = os.filter(function (o) { return o !== tg; });
          if (c2.length) m.hunt = pick(c2); else { m.flee = 1; m.fleeFrom = tg; m.hunt = null; }
        }
      }
      break;
    case 'water':
      if (!os.length) { showRoam(m, dt); break; }
      m.orbitT -= dt;
      if (!m.orbit || m.orbit.loose || m.orbitT <= 0) { m.orbit = nearestOther(m); m.orbitT = 5; }
      var c = m.orbit;
      a = Math.atan2(m.y - c.y, m.x - c.x); d = hyp(m.x - c.x, m.y - c.y);
      var rad = clamp((200 - d) / 100, -1, 1);
      var vx = -Math.sin(a) + Math.cos(a) * rad, vy = Math.cos(a) + Math.sin(a) * rad;
      showStep(m, Math.atan2(vy, vx), 70, dt);
      break;
    case 'thunder':
      if (m.dashT > 0) {
        var step = Math.min(600 * dt, m.dashRem);
        m.x += Math.cos(m.dashAng) * step; m.y += Math.sin(m.dashAng) * step; m.dashRem -= step;
        m.dashT -= dt;
        if (m.dashRem <= 0.01) m.dashT = 0;
      } else if (!os.length) showRoam(m, dt);
      else {
        m.dashCd -= dt;
        if (m.dashCd <= 0) {
          tg = pick(os);
          m.dashAng = Math.atan2(tg.y - m.y, tg.x - m.x);
          m.dashRem = Math.min(180, hyp(tg.x - m.x, tg.y - m.y));
          m.dashT = 0.3; m.dashCd = 2;
          m.dirX = sgn(Math.cos(m.dashAng));
        }
      }
      break;
    case 'spike':
      m.rollT -= dt;
      if (m.rollT <= 0) { m.rollAng = rnd(0, 6.28); m.rollT = 4; }
      var rx = Math.cos(m.rollAng), ry = Math.sin(m.rollAng);
      m.x += rx * 110 * dt; m.y += ry * 110 * dt;
      if (m.x < ARENA.x0) { m.x = ARENA.x0; rx = Math.abs(rx); }
      if (m.x > ARENA.x1) { m.x = ARENA.x1; rx = -Math.abs(rx); }
      if (m.y < ARENA.y0) { m.y = ARENA.y0; ry = Math.abs(ry); }
      if (m.y > ARENA.y1) { m.y = ARENA.y1; ry = -Math.abs(ry); }
      m.rollAng = Math.atan2(ry, rx); m.dirX = sgn(rx);
      break;
    case 'stone':
      tg = nearestOther(m);
      if (tg) showStep(m, Math.atan2(tg.y - m.y, tg.x - m.x), 35, dt); else showRoam(m, dt);
      break;
    case 'ghost':
      if (!os.length) { showRoam(m, dt); break; }
      m.tpT -= dt;
      if (m.tpT <= 0) {
        m.tpT = 3;
        tg = pick(os);
        a = rnd(0, 6.28);
        m.x = tg.x + Math.cos(a) * 100; m.y = tg.y + Math.sin(a) * 100;
      }
      break;
  }
  clampArena(m);
}

// ---- 失控 ----
function updateLoose(m, dt) {
  var f = S.fences[m.side][m.fi];
  if (m.mode === 'charge') {
    var fx = 110 + 100 * m.fi, fy = FENCE_Y[m.side];
    if (!m.arrived) {
      var d = hyp(fx - m.x, fy - m.y);
      if (d <= 6) { m.arrived = true; m.chargeT = 0; if (f.broken) startRun(m); }
      else {
        var st = Math.min(160 * dt, d), a = Math.atan2(fy - m.y, fx - m.x);
        m.x += Math.cos(a) * st; m.y += Math.sin(a) * st;
        if (Math.abs(Math.cos(a)) > 0.01) m.dirX = sgn(Math.cos(a));
      }
    } else {
      m.chargeT += dt;
      if (m.chargeT >= 1.5) { f.broken = true; startRun(m); }
    }
    return;
  }
  m.looseT += dt;
  m.x += m.runDir * 140 * dt;
  if (m.x < 90) { m.x = 90; m.runDir = 1; }
  if (m.x > 630) { m.x = 630; m.runDir = -1; }
  m.dirX = m.runDir;
  m.atkT += dt;
  if (m.atkT >= 1.5) {
    m.atkT -= 1.5;
    var best = null, bd = 100;
    S.vis[m.side].forEach(function (v, i) {
      if (v.mode !== 'watch') return;
      var dd = Math.abs(110 + 100 * i - m.x);
      if (dd <= bd) { bd = dd; best = v; }
    });
    if (best) {
      best.mode = 'scared'; best.t = 0;
      G.rep = Math.max(0, G.rep - 3);
      addFloat(m.x, SEAT_Y[m.side] + (m.side === 'top' ? 50 : -50), '名聲 -3', 'repDown');
    }
  }
  if (m.looseT >= 6) {
    m.loose = false; m.mode = 'roam'; m.x = 360; m.y = 630; m.rage = 30; m.marks = 0; m.markT = 0; m.slow = false;
    m.perfTimer = rnd(0.5, 2); m.relay = null; m.hunt = null; m.orbit = null; m.dashT = 0;
    m.chargeT = 0; m.looseT = 0;
  }
}
function startRun(m) {
  m.mode = 'loose'; m.looseT = 0; m.atkT = 0;
  m.y = SEAT_Y[m.side];
  m.runDir = m.x < 360 ? 1 : -1;
}

function updateShow(dt) {
  var i, j, m;
  S.t += dt;
  for (i = 0; i < S.mons.length; i++) {
    m = S.mons[i];
    if (m.fx !== 'none') { m.fxT += dt; if (m.fxT >= 0.5) { m.fx = 'none'; m.fxT = 0; } }
    if (m.performing) { m.perfT += dt; if (m.perfT >= 0.5) { m.performing = false; m.perfT = 0; } }
    if (m.loose) { updateLoose(m, dt); continue; }
    // 怒氣與標記
    if (m.marks > 0) {
      m.rage = 100;
      m.markT -= dt;
      if (m.markT <= 0) {
        m.marks--;
        if (m.marks > 0) m.markT = 4; else { m.slow = true; m.markT = 0; }
      }
    } else if (m.slow) {
      m.rage -= 2 * dt;
      if (m.rage < m.redLow) m.slow = false;
    } else m.rage -= SPECIES[m.sp].decay * dt;
    m.rage = clamp(m.rage, 0, 100);
    // 接演
    if (m.relay) {
      m.relay.t -= dt;
      if (m.relay.t <= 0) { var st = m.relay.stage; m.relay = null; perform(m, st); }
    }
    // 定時表演
    if (!m.loose && m.rage >= 50) {
      m.perfTimer = Math.min(m.perfTimer, interval(m.rage));
      m.perfTimer -= dt;
      if (m.perfTimer <= 0) perform(m, 1);
    }
    if (!m.loose) showMove(m, dt);
  }
  updateBalls(dt);
  updateHazards(dt, 'show');
  // 相撞挑釁
  for (i = 0; i < S.mons.length; i++) for (j = i + 1; j < S.mons.length; j++) {
    var a = S.mons[i], b = S.mons[j];
    if (a.loose || b.loose) continue;
    if (hyp(a.x - b.x, a.y - b.y) > 70) continue;
    var key = i * 10 + j;
    if (S.pair[key] !== undefined && S.t - S.pair[key] < 2) continue;
    S.pair[key] = S.t;
    raiseRage(a, 8); raiseRage(b, 8);
  }
  // 觀眾
  ['top', 'bottom'].forEach(function (sd) {
    S.vis[sd].forEach(function (v) {
      if (v.mode === 'watch') return;
      v.t += dt;
      if (v.mode === 'scared' && v.t >= 0.8) v.mode = 'empty';
      if (v.mode === 'empty' && v.t >= 4) { v.mode = 'watch'; v.t = 0; }
    });
  });
  if (S.t >= 45) endShow();
}

function endShow() {
  S.perfs.forEach(function (p) { finalizePerf(p); });
  S.mons.forEach(function (m) { if (m.loose) G.rep = Math.max(0, G.rep - 5); });
  G.rep = Math.max(0, G.rep);
  hz = [];
  S = null;
  G.floats = [];
  pressed.length = 0;
  if (G.day >= DAY_MAX) {
    G.stars = G.rep >= 900 ? 3 : G.rep >= 550 ? 2 : G.rep >= 250 ? 1 : 0;
    G.phase = 'result';
  } else { G.phase = 'shop'; G.shopCur = 0; }
}

// ============================================================
// 選擇 / 商店 / 說明 / 結算
// ============================================================
function condText(i) {
  var dg = DUNGEONS[i];
  if (!dg.needSp) return '';
  return '金幣 ' + dg.cost + ' + 收服' + SPECIES[dg.needSp].name + ' ' + Math.min(G.caps[dg.needSp], dg.needN) + '/' + dg.needN;
}
function handleSelect(k) {
  if (k === 'up') G.selIdx = Math.max(0, G.selIdx - 1);
  else if (k === 'down') G.selIdx = Math.min(2, G.selIdx + 1);
  else if (k === 'x') { G.phase = 'guide'; G.guidePage = 0; G.guideReturn = 'select'; }
  else if (k === 'z') {
    var i = G.selIdx, dg = DUNGEONS[i];
    if (G.open[i]) startDungeon(i);
    else if (G.gold >= dg.cost && G.caps[dg.needSp] >= dg.needN) { G.gold -= dg.cost; G.open[i] = true; }
  }
}

function shopCost(item) {
  if (item === 'attack' || item === 'armor' || item === 'ropeBag') return G.shopCost[item];
  return item === 'club' ? 0 : 60;
}
function handleShop(k) {
  if (k === 'up') G.shopCur = Math.max(0, G.shopCur - 1);
  else if (k === 'down') G.shopCur = Math.min(7, G.shopCur + 1);
  else if (k === 'z') {
    if (G.shopCur === 7) { G.day++; G.phase = 'select'; G.selIdx = 0; pressed.length = 0; return; }
    var it = SHOP_ITEMS[G.shopCur];
    if (G.shopCur < 4) {
      if (G.owned[it]) G.weapon = it;
      else if (G.gold >= 60) { G.gold -= 60; G.owned[it] = true; G.weapon = it; }
    } else {
      var c = G.shopCost[it];
      if (G.gold < c) return;
      G.gold -= c;
      G.shopCost[it] = Math.round(c * 1.5);
      G.shopLv[it]++;
      if (it === 'attack') G.atk++; else if (it === 'armor') G.armorLv++; else G.ropeLv++;
    }
  }
}

function handleGuide(k) {
  if (k === 'z' || k === 'right') {
    if (G.guidePage >= GUIDE_PAGES.length - 1) { G.phase = G.guideReturn; pressed.length = 0; }
    else G.guidePage++;
  } else if (k === 'x' || k === 'left') G.guidePage = Math.max(0, G.guidePage - 1);
}

function handleKey(k) {
  switch (G.phase) {
    case 'guide': handleGuide(k); break;
    case 'select': handleSelect(k); break;
    case 'setup1': handleSetup1(k); break;
    case 'setup2': handleSetup2(k); break;
    case 'shop': handleShop(k); break;
    case 'result': if (k === 'z') { newGame(true); pressed.length = 0; } break;
  }
}

// ============================================================
// 主更新
// ============================================================
function update(dt) {
  var i, before = G.phase;
  var q = pressed.slice(); pressed.length = 0;
  for (i = 0; i < q.length; i++) {
    handleKey(q[i]);
    if (G.phase !== before) break;   // 階段變了, 後面的按鍵丟掉
    before = G.phase;
  }
  if (G.phase === 'dungeon') updateDungeon(dt);
  else if (G.phase === 'show') updateShow(dt);
  G.floats.forEach(function (f) { f.t += dt; });
  G.floats = G.floats.filter(function (f) { return f.t < f.dur; });
}

// ============================================================
// 繪製(只讀狀態, 呼叫 Art)
// ============================================================
function hudState(extra) {
  var h = {
    phase: G.phase, day: G.day, dayMax: DAY_MAX, gold: G.gold, rep: G.rep,
    hearts: 0, maxHearts: 0, ropes: 0, ropeMax: 0, weapon: G.weapon, xCdLeft: 0, xCdMax: 0,
    timeLeft: 0, timeMax: 0, dungeon: '', message: ''
  };
  for (var k in extra) h[k] = extra[k];
  return h;
}

function drawFloats() {
  G.floats.forEach(function (f) { Art.drawFloatText(ctx, { x: f.x, y: f.y, text: f.text, kind: f.kind, t: f.t, dur: f.dur }); });
}

function monsterShowState(m) {
  return {
    x: m.x, y: m.y, species: m.sp, level: m.level, rage: m.rage, redLow: m.redLow,
    marks: Math.min(4, m.marks), markLeft: m.marks > 0 ? m.markT : 0, markDur: 4,
    mode: m.mode, performing: m.performing, performT: m.performing ? m.perfT : 0, performDur: 0.5,
    fx: m.fx, fxT: m.fx === 'none' ? 0 : m.fxT, fxDur: 0.5,
    chargeT: m.mode === 'charge' ? m.chargeT : 0, chargeDur: 1.5,
    looseT: m.mode === 'loose' ? m.looseT : 0, looseDur: 6,
    dashing: m.dashT > 0, dir: m.dirX
  };
}
function ballState(b) {
  var sp = b ? ballSpeed(b) : 0;
  return { x: b.x, y: b.y, kind: b.kind, rolling: sp >= 80, angle: sp > 0 ? Math.atan2(b.vy, b.vx) : 0,
    hitT: b.reacting ? b.hitT : 0, hitDur: 0.3 };
}
function hzState(h, oy) {
  return { x: h.x, y: h.y + oy, kind: h.kind, phase: h.phase, radius: h.radius, t: h.t, dur: h.dur, angle: h.angle, reflected: h.reflected };
}

function drawArenaScene(isSetup) {
  var i, j;
  Art.drawBackground(ctx, {});
  Art.drawShowArena(ctx, {});
  if (isSetup) {
    for (i = 0; i < 12; i++) {
      var p = cellCenter(i);
      Art.drawSetupCell(ctx, { x: p.x, y: p.y, selected: G.s2.cur === i && !G.s2.panel });
    }
  }
  var balls, mons;
  if (isSetup) {
    balls = []; mons = [];
    for (i = 0; i < 12; i++) {
      var c = G.s2.cells[i];
      if (!c) continue;
      var q = cellCenter(i);
      if (c.type === 'ball') balls.push({ kind: c.key, x: q.x, y: q.y, vx: 0, vy: 0, reacting: false, hitT: 0 });
      else { var lv = rosterLv(c.key); mons.push({ x: q.x, y: q.y, sp: c.key, level: lv, rage: 60, redLow: 80 - 5 * lv, marks: 0, markT: 0, mode: 'roam', performing: false, perfT: 0, fx: 'none', fxT: 0, chargeT: 0, looseT: 0, dashT: 0, dirX: 1 }); }
    }
  } else { balls = S.balls; mons = S.mons; }
  balls.forEach(function (b) { Art.drawToyBall(ctx, ballState(b)); });
  if (!isSetup) hz.forEach(function (h) { Art.drawHazard(ctx, hzState(h, 0)); });
  mons.forEach(function (m) { Art.drawShowMonster(ctx, monsterShowState(m)); });
  var fences = isSetup ? null : S.fences, vis = isSetup ? null : S.vis;
  ['top', 'bottom'].forEach(function (sd) {
    for (j = 0; j < 6; j++) {
      Art.drawFence(ctx, { x: 110 + 100 * j, y: FENCE_Y[sd], side: sd, broken: fences ? fences[sd][j].broken : false });
      Art.drawVisitor(ctx, { x: 110 + 100 * j, y: SEAT_Y[sd], side: sd, mode: vis ? vis[sd][j].mode : 'watch' });
    }
  });
  drawFloats();
}

function wrapText(text, x, y, maxW, lh) {
  var line = '', yy = y;
  for (var i = 0; i < text.length; i++) {
    var test = line + text.charAt(i);
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = text.charAt(i); yy += lh; }
    else line = test;
  }
  ctx.fillText(line, x, yy);
}

function drawGuide() {
  var pg = GUIDE_PAGES[G.guidePage], last = G.guidePage === GUIDE_PAGES.length - 1;
  Art.drawBackground(ctx, {});
  ctx.save();
  ctx.fillStyle = 'rgba(20,16,30,0.82)';
  ctx.fillRect(40, 30, 640, 180);
  ctx.fillRect(40, 1140, 640, 110);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 44px sans-serif';
  ctx.fillText('第 ' + (G.guidePage + 1) + ' 頁 ' + pg.title, 360, 85);
  ctx.fillStyle = '#ffffff'; ctx.font = '32px sans-serif';
  wrapText(pg.text, 360, 155, 600, 40);
  ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 30px sans-serif';
  ctx.fillText((G.guidePage + 1) + ' / ' + GUIDE_PAGES.length, 360, 1175);
  ctx.fillStyle = '#ffffff'; ctx.font = '26px sans-serif';
  ctx.fillText((last ? '按 Z 開始遊戲' : '按 Z 繼續') + (G.guidePage > 0 ? '    按 X 上一頁' : ''), 360, 1222);
  ctx.restore();
  Art.drawGuidePage(ctx, { page: G.guidePage + 1, x: 60, y: 230, w: 600, h: 890 });
}

function render() {
  var dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, CW, CH);
  var i, j;
  switch (G.phase) {
    case 'guide': drawGuide(); break;
    case 'select':
      Art.drawBackground(ctx, {});
      for (i = 0; i < 3; i++) {
        Art.drawDungeonCard(ctx, { x: 360, y: 330 + 310 * i, dungeon: DUNGEONS[i].code, open: G.open[i], condition: G.open[i] ? '' : condText(i), selected: G.selIdx === i });
      }
      Art.drawHud(ctx, hudState({ message: '↑↓ 選擇 Z 進入 X 說明' }));
      break;
    case 'dungeon': renderDungeon(); break;
    case 'setup1':
      Art.drawBackground(ctx, {});
      for (i = 0; i < G.roster.length; i++) {
        var r = G.roster[i];
        Art.drawRosterCard(ctx, { x: 195 + 330 * (i % 2), y: 300 + 230 * Math.floor(i / 2), species: r.sp, level: r.level,
          picked: G.s1.picked.indexOf(r.sp) >= 0, selected: G.s1.cur === i });
      }
      Art.drawButton(ctx, { x: 160, y: 1100, w: 400, h: 100, label: '下一步', selected: G.s1.cur === G.roster.length });
      Art.drawHud(ctx, hudState({ message: '方向鍵選 Z 上場/下場' }));
      break;
    case 'setup2':
      drawArenaScene(true);
      Art.drawSetupInfo(ctx, { gold: G.gold, placed: countPlaced(), picked: G.s1.picked.length, balls: countBalls(), ballMax: BALL_MAX });
      Art.drawButton(ctx, { x: 480, y: 1160, w: 180, h: 100, label: '開演', selected: G.s2.cur === 12 && !G.s2.panel });
      var msg = G.s2.panel ? '↑↓ 選 Z 確定 X 取消' : (G.s2.cur === 12 ? 'Z 開演 X 回上一步' : '方向鍵選格子 Z 擺放 X 清空');
      Art.drawHud(ctx, hudState({ message: msg }));
      if (G.s2.panel) Art.drawPickerPanel(ctx, { options: G.s2.panel.options, index: G.s2.panel.index });
      break;
    case 'show':
      drawArenaScene(false);
      Art.drawHud(ctx, hudState({ timeLeft: Math.max(0, 45 - S.t), timeMax: 45, message: '表演中…' }));
      break;
    case 'shop':
      Art.drawBackground(ctx, {});
      for (i = 0; i < 7; i++) {
        var it = SHOP_ITEMS[i], isW = i < 4;
        Art.drawShopItem(ctx, { x: 360, y: 200 + 125 * i, item: it, cost: shopCost(it),
          level: isW ? 0 : G.shopLv[it], owned: isW ? !!G.owned[it] : false, equipped: isW && G.weapon === it,
          affordable: isW ? (G.owned[it] || G.gold >= 60) : G.gold >= G.shopCost[it], selected: G.shopCur === i });
      }
      Art.drawButton(ctx, { x: 160, y: 1110, w: 400, h: 100, label: '出發', selected: G.shopCur === 7 });
      Art.drawHud(ctx, hudState({ message: '↑↓ 選擇 Z 購買/裝備' }));
      break;
    case 'result':
      Art.drawBackground(ctx, {});
      Art.drawHud(ctx, hudState({ message: '' }));
      Art.drawResultPanel(ctx, { rep: G.rep, goldEarned: G.goldEarned, bestChain: G.bestChain,
        roster: G.roster.map(function (r) { return { species: r.sp, level: r.level }; }), stars: G.stars });
      break;
  }
}

function renderDungeon() {
  var t = D.tamer, i, j, OY = 130;
  Art.drawBackground(ctx, {});
  for (i = 0; i < 19; i++) for (j = 0; j < 12; j++) {
    var tl = D.grid[i][j];
    Art.drawTile(ctx, { x: j * 60 + 30, y: i * 60 + 30 + OY, dungeon: tl.dungeon, kind: tl.kind, room: tl.room, nest: tl.nest });
  }
  var casting = {};
  hz.forEach(function (h) { if (h.phase === 'warn' && h.owner) casting[h.owner.id] = true; });
  D.mons.forEach(function (m) {
    Art.drawWildMonster(ctx, { x: m.x, y: m.y + OY, species: m.sp, hp: m.hp, maxHp: m.maxHp, hit: m.hitT > 0, weak: isWeak(m),
      stunLeft: Math.max(0, m.stun), stunDur: 2, lassoed: m.lassoed, casting: !!casting[m.id], dashing: m.dashT > 0, dir: m.dirX });
  });
  if (D.prep) Art.drawCaptureRing(ctx, { x: D.prep.mon.x, y: D.prep.mon.y + OY, t: D.prep.t, dur: D.prep.dur });
  if (D.lasso) {
    var l = D.lasso;
    Art.drawLasso(ctx, { x1: t.x, y1: t.y + OY, x2: l.mon.x, y2: l.mon.y + OY, progress: l.progress, t: l.t, limit: l.limit,
      len: hyp(t.x - l.mon.x, t.y - l.mon.y), maxLen: 220 });
  }
  Art.drawTamer(ctx, { x: t.x, y: t.y + OY, facing: t.facing, weapon: G.weapon, dashing: !!t.dash, blink: t.inv > 0, lassoing: !!D.lasso });
  hz.forEach(function (h) { Art.drawHazard(ctx, hzState(h, OY)); });
  D.fx.forEach(function (f) {
    Art.drawWeaponFx(ctx, { x: f.x, y: f.y + OY, weapon: f.weapon, move: f.move, shape: f.shape, angle: f.angle, spread: f.spread,
      radius: f.radius, length: f.length, width: f.width, t: f.t, dur: f.dur });
  });
  drawFloats();
  var msg = D.lasso ? '繞牠一圈!' : (D.prep ? '站住別動' : 'Z 攻擊 X 武器技');
  Art.drawHud(ctx, hudState({ hearts: t.hp, maxHearts: t.maxHp, ropes: D.ropes, ropeMax: D.ropeMax,
    xCdLeft: G.weapon === 'club' ? 0 : Math.max(0, t.xCd),
    xCdMax: G.weapon === 'club' ? 0 : WEAPON_X_CD[G.weapon] * (1 - 0.15 * bonus('spike')),
    timeLeft: Math.max(0, D.time), timeMax: 60, dungeon: D.dg.code, message: msg }));
}

// ============================================================
// 輸入(只掛鍵盤)
// ============================================================
var KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', z: 'z', Z: 'z', x: 'x', X: 'x' };
window.addEventListener('keydown', function (e) {
  var k = KEYMAP[e.key];
  if (!k) return;
  e.preventDefault();
  if (e.repeat) return;
  held[k] = true;
  pressed.push(k);
});
window.addEventListener('keyup', function (e) {
  var k = KEYMAP[e.key];
  if (!k) return;
  e.preventDefault();
  held[k] = false;
  if (k === 'z' || k === 'x') needRel[k] = false;
});
window.addEventListener('blur', function () {
  for (var k in held) held[k] = false;
});

// ============================================================
// 啟動
// ============================================================
function fit() {
  var dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(CW * dpr); canvas.height = Math.round(CH * dpr);
  var s = Math.min(window.innerWidth / CW, window.innerHeight / CH);
  canvas.style.width = Math.floor(CW * s) + 'px';
  canvas.style.height = Math.floor(CH * s) + 'px';
}
window.addEventListener('resize', fit);
fit();
newGame(false);

var lastT = null;
function frame(ts) {
  if (lastT === null) lastT = ts;
  var dt = Math.min((ts - lastT) / 1000, 1 / 30);
  lastT = ts;
  try { update(dt); render(); } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

})();
