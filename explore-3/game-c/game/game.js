// 魔物大遊行 — 玩法驗證 Demo(只用滑鼠)
(function () {
'use strict';

var W = Art.canvas.width, H = Art.canvas.height;
var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var dpr = window.devicePixelRatio || 1;
canvas.width = Math.round(W * dpr);
canvas.height = Math.round(H * dpr);
function fitCanvas() {
  var s = Math.min(window.innerWidth / W, window.innerHeight / H);
  if (!(s > 0)) s = 1;
  canvas.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

// ---------- 常數 ----------
var MAP = [
  '##################',
  '#......####......#',
  '#.f....####...g..#',
  '#...#..####......#',
  '#......####..#...#',
  '#..f...####...g..#',
  '#......####......#',
  '###.##########.###',
  '###.##########.###',
  '#......#..#......#',
  '#.m..#.#..#.b....#',
  '#......#..#......#',
  '#..#..........#..#',
  '#.m....#..#..b...#',
  '#......#..#......#',
  '########..########',
  '########..########',
  '####..........####',
  '####..........####',
  '####....S.....####',
  '####..........####',
  '####..........####',
  '##################'
];
var COLS = 18, ROWS = 23, TILE = 80, WORLD_W = 1440, WORLD_H = 1840;
var HUD_H = 120;
var DAYS = 3, DUNGEON_TIME = 60, PARADE_TIME = 60;
var TEAM_MAX = 12, MON_GAP = 46, ROPE_GAP = 24;
var HEAD_R = 16, TURN_MAX = 6;
var NEST_CHAR = { f: 'fire', g: 'stone', m: 'mushroom', b: 'bat' };
// zone: [c0,c1,r0,r1]
var SP = {
  fire:     { hp: 2, gold: 5, rep: 1, cd: 2.6, zone: 'lava',   box: [1, 6, 1, 6],   speed: 50 },
  stone:    { hp: 3, gold: 7, rep: 2, cd: 3.4, zone: 'ruins',  box: [11, 16, 1, 6], speed: 50 },
  mushroom: { hp: 2, gold: 3, rep: 1, cd: 3.2, zone: 'forest', box: [1, 6, 9, 14],  speed: 50 },
  bat:      { hp: 1, gold: 4, rep: 1, cd: 2.4, zone: 'cave',   box: [11, 16, 9, 14], speed: 90 }
};
var ITEMS = [
  { id: 'longRope',  base: 50, y: 300 },
  { id: 'collarBag', base: 40, y: 460 },
  { id: 'armor',     base: 40, y: 620 },
  { id: 'swiftFeet', base: 50, y: 780 }
];
var STAR_AT = [50, 120, 200];
var STAND_DEFS = [
  { side: 'top',    x: 160, y: 130,  w: 400, h: 80 },
  { side: 'bottom', x: 160, y: 1190, w: 400, h: 80 },
  { side: 'left',   x: 0,   y: 420,  w: 70,  h: 460 },
  { side: 'right',  x: 650, y: 420,  w: 70,  h: 460 }
];
var PLAZA = { x0: 90, x1: 630, y0: 230, y1: 1170 };
var FOUNT = { x: 360, y: 700, r: 70 };
var GUIDE = [
  { t: '帶隊', s: '隊伍會跟著游標走' },
  { t: '圍圈', s: '繞一圈圍住魔物, 削牠體力' },
  { t: '收服', s: '體力歸零, 牠就加入隊伍' },
  { t: '遊行', s: '夠氣就表演, 太氣會脫隊' }
];
var GUIDE_FRAME = { x: 60, y: 190, w: 600, h: 640 };
var PREV_BTN = { x: 30, y: 1170, w: 210, h: 60 };
var DEPART_BTN = { x: 160, y: 1140, w: 400, h: 100 };

// ---------- 小工具 ----------
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function rnd(a, b) { return a + Math.random() * (b - a); }
function angDiff(a, b) { var d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
function hyp(x, y) { return Math.sqrt(x * x + y * y); }
function nearestOnRect(r, px, py) { return { x: clamp(px, r.x, r.x + r.w), y: clamp(py, r.y, r.y + r.h) }; }
function distRect(r, px, py) { var n = nearestOnRect(r, px, py); return hyp(px - n.x, py - n.y); }
function inPoly(poly, x, y) {
  var inside = false;
  for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    var a = poly[i], b = poly[j];
    if (((a.y > y) !== (b.y > y)) && (x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x)) inside = !inside;
  }
  return inside;
}
function zoneAt(c, r) {
  for (var k in SP) { var b = SP[k].box; if (c >= b[0] && c <= b[1] && r >= b[2] && r <= b[3]) return SP[k].zone; }
  return 'hall';
}
function isWallCell(c, r) {
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
  return MAP[r].charAt(c) === '#';
}
function circleHitsWall(x, y, rad) {
  var c0 = Math.floor((x - rad) / TILE), c1 = Math.floor((x + rad) / TILE);
  var r0 = Math.floor((y - rad) / TILE), r1 = Math.floor((y + rad) / TILE);
  for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
    if (!isWallCell(c, r)) continue;
    var nx = clamp(x, c * TILE, c * TILE + TILE), ny = clamp(y, r * TILE, r * TILE + TILE);
    if (hyp(x - nx, y - ny) < rad) return true;
  }
  return false;
}

// ---------- 狀態 ----------
var G;            // 整局資料(跨天)
var phase = 'guide';
var guidePage = 0, guideReturn = null;
var titleStage = 'dungeon';
var mouse = { x: 360, y: 300 };
var T = { x: 0, y: 0, angle: -Math.PI / 2, inv: 0, turnRate: 0 };
var trail = [], headD = 0, lastLoopD = -1e9;
var timeLeft = 0, clock = 0;
var hazards = [], wilds = [], nests = [], floats = [], loopFxs = [];
var stands = [], loose = [], ropes = [];
var hearts = 4, collars = 3;
var cam = { x: 0, y: 0 };

(function parseNests() {
  for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
    var ch = MAP[r].charAt(c);
    if (NEST_CHAR[ch]) nests.push({ c: c, r: r, x: c * TILE + 40, y: r * TILE + 40, species: NEST_CHAR[ch], w: null, rt: 0 });
  }
})();

function mkMonster(species, rage) {
  return { species: species, rage: rage, hitFx: 0, perfFx: 0, perfCd: -1, bx: 0, by: 0, angle: 0, dashPos: null, loose: false, atkT: 0, arrived: false };
}
function newRun() {
  G = {
    day: 1, gold: 0, goldEarned: 0, rep: 0, maxHearts: 4, collarMax: 3, speed: 300, ropeCount: 10,
    team: [mkMonster('fire', 20)],
    shop: { longRope: { lv: 0, cost: 50 }, collarBag: { lv: 0, cost: 40 }, armor: { lv: 0, cost: 40 }, swiftFeet: { lv: 0, cost: 50 } }
  };
}
newRun();

function addGold(n) { G.gold += n; G.goldEarned += n; }
function addRep(n) { G.rep = Math.max(0, G.rep + n); }
function addFloat(x, y, text, kind) { floats.push({ x: x, y: y, text: text, kind: kind, t: 0 }); }

// ---------- 軌跡 ----------
function initTrail(x, y, ang) {
  trail = [];
  var L = 1800;
  for (var k = L; k >= 0; k -= 8) trail.push({ x: x - Math.cos(ang) * k, y: y - Math.sin(ang) * k, d: -k });
  headD = 0; lastLoopD = -1e9;
  T.x = x; T.y = y; T.angle = ang; T.inv = 0; T.turnRate = 0;
}
var _p = { x: 0, y: 0 };
function posAt(back, out) {
  var td = headD - back, hi = trail.length - 1, lo = 0;
  if (td <= trail[0].d) { out.x = trail[0].x; out.y = trail[0].y; return out; }
  if (td >= trail[hi].d) { out.x = trail[hi].x; out.y = trail[hi].y; return out; }
  while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (trail[mid].d <= td) lo = mid; else hi = mid; }
  var a = trail[lo], b = trail[hi], k = (td - a.d) / Math.max(1e-6, b.d - a.d);
  out.x = a.x + (b.x - a.x) * k; out.y = a.y + (b.y - a.y) * k;
  return out;
}
function teamLen() { return G.team.length * MON_GAP + G.ropeCount * ROPE_GAP; }
function followAngle(back, prevAng) {
  var a = { x: 0, y: 0 }, b = { x: 0, y: 0 };
  posAt(Math.max(0, back - 12), a); posAt(back + 12, b);
  if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) < 0.01) return prevAng;
  return Math.atan2(a.y - b.y, a.x - b.x);
}
function updateFollowers() {
  var i, p = { x: 0, y: 0 };
  for (i = 0; i < G.team.length; i++) {
    var m = G.team[i], back = MON_GAP * (i + 1);
    posAt(back, p); m.bx = p.x; m.by = p.y; m.angle = followAngle(back, m.angle);
  }
  ropes.length = 0;
  var n = G.team.length;
  for (i = 0; i < G.ropeCount; i++) {
    var bk = MON_GAP * n + ROPE_GAP * (i + 1);
    posAt(bk, p);
    ropes.push({ x: p.x, y: p.y, angle: followAngle(bk, 0), index: i });
  }
}
function lowerBound(d) {
  var lo = 0, hi = trail.length;
  while (lo < hi) { var mid = (lo + hi) >> 1; if (trail[mid].d < d) lo = mid + 1; else hi = mid; }
  return lo;
}

// ---------- 頭部移動 ----------
function camOf() {
  cam.x = clamp(T.x - 360, 0, 720);
  cam.y = clamp(T.y - 580, 0, 680);
}
function moveHead(dt) {
  var tx, ty;
  if (phase === 'dungeon') { camOf(); tx = mouse.x + cam.x; ty = mouse.y - HUD_H + cam.y; }
  else { tx = mouse.x; ty = mouse.y; }
  var dx = tx - T.x, dy = ty - T.y, turn = 0;
  if (hyp(dx, dy) >= 30) {
    var diff = angDiff(Math.atan2(dy, dx), T.angle), mx = TURN_MAX * dt;
    turn = clamp(diff, -mx, mx);
    T.angle += turn;
  }
  T.turnRate = dt > 0 ? Math.abs(turn) / dt : 0;
  var ox = T.x, oy = T.y, step = G.speed * dt;
  var nx = T.x + Math.cos(T.angle) * step, ny = T.y + Math.sin(T.angle) * step;
  if (phase === 'dungeon') {
    if (!circleHitsWall(nx, T.y, HEAD_R)) T.x = nx;
    if (!circleHitsWall(T.x, ny, HEAD_R)) T.y = ny;
  } else {
    T.x = clamp(nx, PLAZA.x0 + HEAD_R, PLAZA.x1 - HEAD_R);
    T.y = clamp(ny, PLAZA.y0 + HEAD_R, PLAZA.y1 - HEAD_R);
    var fx = T.x - FOUNT.x, fy = T.y - FOUNT.y, fd = hyp(fx, fy), lim = FOUNT.r + HEAD_R;
    if (fd < lim) { if (fd < 0.001) { fx = 0; fy = 1; fd = 1; } T.x = FOUNT.x + fx / fd * lim; T.y = FOUNT.y + fy / fd * lim; }
  }
  var moved = hyp(T.x - ox, T.y - oy);
  if (moved > 0.01) {
    headD += moved;
    trail.push({ x: T.x, y: T.y, d: headD });
    while (trail.length > 2 && trail[1].d < headD - 2300) trail.shift();
  }
}

// ---------- 圍圈 ----------
function checkLoop() {
  if (headD - lastLoopD < 120) return null;
  var minD = headD - teamLen(), maxD = headD - 150;
  var best = -1, bd = 26;
  for (var i = lowerBound(minD); i < trail.length && trail[i].d <= maxD; i++) {
    var dd = hyp(trail[i].x - T.x, trail[i].y - T.y);
    if (dd < bd) { bd = dd; best = i; }
  }
  if (best < 0) return null;
  lastLoopD = headD;
  var n = trail.length - best, stride = Math.max(1, Math.ceil(n / 60)), poly = [];
  for (var k = best; k < trail.length; k += stride) poly.push({ x: trail[k].x, y: trail[k].y });
  poly.push({ x: T.x, y: T.y });
  loopFxs.push({ poly: poly, t: 0 });
  return poly;
}

// ---------- 技能 ----------
function ownerPos(o) { return { x: o.bx, y: o.by }; }
function castSkill(species, ox, oy, tx, ty, owner, src, noScore) {
  var group = { hit: [], stands: {}, noScore: !!noScore, species: species, src: src };
  var ang = Math.atan2(ty - oy, tx - ox);
  function mk(kind, extra) {
    var h = { kind: kind, x: ox, y: oy, angle: ang, radius: 0, length: null, warn: 0, act: 0, ret: 0, t: 0, phase: 'warn',
      owner: owner, group: group, src: src, follow: true, dashing: false, checked: false, ox: ox, oy: oy };
    for (var k in extra) h[k] = extra[k];
    hazards.push(h);
  }
  if (species === 'fire') mk('firecone', { radius: 220, warn: 0.5, act: 0.6 });
  else if (species === 'bat') mk('batdash', { radius: 30, length: 320, warn: 0.6, act: 0.4, ret: 0.3 });
  else if (species === 'mushroom') mk('spore', { radius: 90, warn: 0.4, act: 3 });
  else {
    mk('rockfall', { x: tx, y: ty, radius: 50, warn: 1, act: 0.25, follow: false });
    for (var i = 0; i < 2; i++) {
      var a = rnd(0, Math.PI * 2), d = rnd(0, 120);
      mk('rockfall', { x: tx + Math.cos(a) * d, y: ty + Math.sin(a) * d, radius: 50, warn: 1, act: 0.25, follow: false });
    }
  }
}
function bodyOf(h) {
  if (h.kind === 'batdash') return h.owner.dashPos || { x: h.x, y: h.y };
  return { x: h.x, y: h.y };
}
function coneHasPoint(h, px, py) {
  var d = hyp(px - h.x, py - h.y);
  if (d > h.radius) return false;
  if (d < 1) return true;
  return Math.abs(angDiff(Math.atan2(py - h.y, px - h.x), h.angle)) <= Math.PI / 6;
}
function hazardHitsCircle(h, cx, cy, r) {
  if (h.kind === 'firecone') {
    var d = hyp(cx - h.x, cy - h.y);
    if (d > h.radius + r) return false;
    if (d <= r) return true;
    return Math.abs(angDiff(Math.atan2(cy - h.y, cx - h.x), h.angle)) <= Math.PI / 6 + Math.asin(Math.min(1, r / d));
  }
  var b = bodyOf(h);
  return hyp(cx - b.x, cy - b.y) < h.radius + r;
}
function hazardHitsRect(h, rc) {
  if (h.kind === 'firecone') {
    for (var x = rc.x; x <= rc.x + rc.w + 0.1; x += 20) for (var y = rc.y; y <= rc.y + rc.h + 0.1; y += 20) {
      if (coneHasPoint(h, Math.min(x, rc.x + rc.w), Math.min(y, rc.y + rc.h))) return true;
    }
    return false;
  }
  var b = bodyOf(h), n = nearestOnRect(rc, b.x, b.y);
  return hyp(b.x - n.x, b.y - n.y) < h.radius;
}
function scoreStand(st, group) {
  if (group.noScore || group.stands[st.i]) return;
  group.stands[st.i] = 1;
  var sp = SP[group.species];
  var g = Math.round(sp.gold * (1 + G.rep / 100));
  addGold(g); addRep(sp.rep);
  var cx = st.x + st.w / 2, cy = st.y + st.h / 2;
  addFloat(cx, cy, '+' + g, 'gold');
  addFloat(cx, cy - 34, '名聲+' + sp.rep, 'repUp');
  st.cheerT = 1;
  for (var i = 0; i < st.visitors.length; i++) st.visitors[i].cheerT = 1;
}
function updateHazards(dt) {
  var i, h;
  for (i = hazards.length - 1; i >= 0; i--) {
    h = hazards[i];
    var o = h.owner;
    h.t += dt;
    if (h.kind === 'batdash' && (o.loose || o.dead)) { o.dashPos = null; hazards.splice(i, 1); continue; }
    if (h.phase === 'warn') {
      if (h.follow && o) { h.x = o.bx; h.y = o.by; }
      if (h.t >= h.warn) {
        h.phase = 'active';
        if (h.kind === 'batdash') { h.ox = h.x; h.oy = h.y; }
      }
    }
    var done = false;
    if (h.phase === 'active') {
      var at = h.t - h.warn;
      if (h.kind === 'batdash') {
        if (at < h.act) {
          var dd = Math.min(h.length, 800 * at);
          o.dashPos = { x: h.ox + Math.cos(h.angle) * dd, y: h.oy + Math.sin(h.angle) * dd };
          h.dashing = true;
        } else {
          h.dashing = false;
          var k = (at - h.act) / h.ret;
          if (k >= 1) { o.dashPos = null; done = true; }
          else {
            var ex = h.ox + Math.cos(h.angle) * h.length, ey = h.oy + Math.sin(h.angle) * h.length;
            o.dashPos = { x: ex + (o.bx - ex) * k, y: ey + (o.by - ey) * k };
          }
        }
      } else if (at >= h.act) done = true;
    }
    if (done) { hazards.splice(i, 1); continue; }
    applyHazard(h);
  }
}
function applyHazard(h) {
  if (h.phase !== 'active') return;
  if (h.kind === 'rockfall') { if (h.checked) return; h.checked = true; }
  if (h.kind === 'batdash' && !h.dashing) return;
  var i, m, g = h.group;
  if (h.src === 'wild') {
    if (T.inv <= 0 && hazardHitsCircle(h, T.x, T.y, HEAD_R)) { hearts = Math.max(0, hearts - 1); T.inv = 1.2; }
    for (i = 0; i < G.team.length; i++) {
      m = G.team[i];
      if (g.hit.indexOf(m) >= 0) continue;
      if (hazardHitsCircle(h, m.bx, m.by, 22)) { g.hit.push(m); m.rage = Math.min(90, m.rage + 20); m.hitFx = 0.5; }
    }
  } else {
    for (i = 0; i < stands.length; i++) if (hazardHitsRect(h, stands[i])) scoreStand(stands[i], g);
    for (i = 0; i < G.team.length; i++) {
      m = G.team[i];
      if (m === h.owner || g.hit.indexOf(m) >= 0) continue;
      if (hazardHitsCircle(h, m.bx, m.by, 22)) {
        g.hit.push(m);
        m.rage = Math.min(100, m.rage + (m.species === 'mushroom' ? 25 : 10)); m.hitFx = 0.5;
      }
    }
  }
}

// ---------- 地下城 ----------
function startDungeon() {
  hearts = G.maxHearts; collars = G.collarMax;
  for (var i = 0; i < G.team.length; i++) { var m = G.team[i]; m.rage = 20; m.hitFx = 0; m.perfFx = 0; m.dashPos = null; m.loose = false; }
  var sc = 0, sr = 0;
  for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) if (MAP[r].charAt(c) === 'S') { sc = c; sr = r; }
  initTrail(sc * TILE + 40, sr * TILE + 40, -Math.PI / 2);
  hazards = []; floats = []; loopFxs = []; loose = []; wilds = [];
  for (var n = 0; n < nests.length; n++) { nests[n].w = null; nests[n].rt = 0; spawnWild(nests[n]); }
  timeLeft = DUNGEON_TIME;
  updateFollowers();
  phase = 'dungeon';
}
function spawnWild(n) {
  var sp = SP[n.species];
  var w = { species: n.species, nest: n, bx: n.x, by: n.y, hp: sp.hp + (G.day - 1), maxHp: sp.hp + (G.day - 1),
    dir: rnd(0, Math.PI * 2), dirT: rnd(2, 3), cd: rnd(1, 2), stun: 0, hitT: 0, angle: 0, casting: false, busy: false, dashPos: null, dead: false };
  w.angle = w.dir;
  n.w = w; wilds.push(w);
}
function removeWild(w) {
  w.dead = true; w.dashPos = null;
  w.nest.w = null; w.nest.rt = 10;
  var i = wilds.indexOf(w); if (i >= 0) wilds.splice(i, 1);
}
function wildBlocked(w, x, y) {
  var b = SP[w.species].box;
  if (x < b[0] * TILE + 24 || x > (b[1] + 1) * TILE - 24 || y < b[2] * TILE + 24 || y > (b[3] + 1) * TILE - 24) return true;
  return circleHitsWall(x, y, 24);
}
function updateWilds(dt) {
  var i, w;
  for (i = 0; i < nests.length; i++) {
    var n = nests[i];
    if (!n.w) { n.rt -= dt; if (n.rt <= 0) spawnWild(n); }
  }
  for (i = 0; i < wilds.length; i++) { wilds[i].casting = false; wilds[i].busy = false; }
  for (i = 0; i < hazards.length; i++) {
    var h = hazards[i];
    if (h.src === 'wild') {
      if (h.phase === 'warn') h.owner.casting = true;
      if (h.kind === 'batdash') h.owner.busy = true;
      if (h.phase === 'warn') h.owner.busy = true;
    }
  }
  for (i = 0; i < wilds.length; i++) {
    w = wilds[i];
    w.hitT = Math.max(0, w.hitT - dt);
    if (w.stun > 0) { w.stun -= dt; continue; }
    var dist = hyp(T.x - w.bx, T.y - w.by);
    if (w.casting) w.angle = Math.atan2(T.y - w.by, T.x - w.bx);
    if (!w.busy) {
      w.dirT -= dt;
      if (w.dirT <= 0) { w.dir = rnd(0, Math.PI * 2); w.dirT = rnd(2, 3); }
      var sp = SP[w.species].speed, nx = w.bx + Math.cos(w.dir) * sp * dt, ny = w.by + Math.sin(w.dir) * sp * dt;
      if (wildBlocked(w, nx, ny)) { w.dir = rnd(0, Math.PI * 2); w.dirT = rnd(2, 3); }
      else { w.bx = nx; w.by = ny; }
      w.angle = w.dir;
      w.cd -= dt;
      if (w.cd <= 0 && dist < 380) {
        castSkill(w.species, w.bx, w.by, T.x, T.y, w, 'wild', false);
        w.cd = SP[w.species].cd * (1 - 0.15 * (G.day - 1));
      }
    }
  }
}
function wildLoopHit(poly) {
  var list = wilds.slice();
  for (var i = 0; i < list.length; i++) {
    var w = list[i];
    if (!inPoly(poly, w.bx, w.by)) continue;
    w.hp -= 1; w.stun = 1; w.hitT = 0.4; w.casting = false;
    for (var k = hazards.length - 1; k >= 0; k--) if (hazards[k].owner === w && hazards[k].phase === 'warn') hazards.splice(k, 1);
    if (w.hp <= 0) resolveWild(w);
  }
}
function resolveWild(w) {
  if (collars > 0) {
    collars -= 1;
    if (G.team.length < TEAM_MAX) {
      G.team.push(mkMonster(w.species, 20));
      updateFollowers();
      addFloat(w.bx, w.by, '加入!', 'join');
    } else {
      addGold(10); addFloat(w.bx, w.by, '+10', 'gold');
    }
  } else {
    addGold(4); addFloat(w.bx, w.by, '+4', 'gold');
  }
  removeWild(w);
}
function updateDungeon(dt) {
  timeLeft -= dt;
  T.inv = Math.max(0, T.inv - dt);
  moveHead(dt);
  updateFollowers();
  var poly = checkLoop();
  if (poly) wildLoopHit(poly);
  updateWilds(dt);
  updateHazards(dt);
  for (var i = 0; i < G.team.length; i++) { G.team[i].hitFx = Math.max(0, G.team[i].hitFx - dt); }
  if (hearts <= 0 || timeLeft <= 0) endDungeon();
}
function endDungeon() {
  timeLeft = Math.max(0, timeLeft);
  hazards = []; wilds = [];
  for (var i = 0; i < G.team.length; i++) G.team[i].dashPos = null;
  titleStage = 'parade'; phase = 'title';
}

// ---------- 遊行 ----------
function buildStands() {
  stands = [];
  for (var s = 0; s < STAND_DEFS.length; s++) {
    var d = STAND_DEFS[s];
    var st = { i: s, side: d.side, x: d.x, y: d.y, w: d.w, h: d.h, cheerT: 0, atkT: 0, visitors: [] };
    for (var k = 0; k < 5; k++) {
      var horiz = d.w > d.h;
      st.visitors.push({
        x: horiz ? d.x + d.w * (k + 0.5) / 5 : d.x + d.w / 2,
        y: horiz ? d.y + d.h / 2 : d.y + d.h * (k + 0.5) / 5,
        cheerT: 0, awayT: 0
      });
    }
    stands.push(st);
  }
}
function startParade() {
  buildStands();
  initTrail(360, 1080, -Math.PI / 2);
  for (var i = 0; i < G.team.length; i++) { var m = G.team[i]; m.perfCd = -1; m.hitFx = 0; m.perfFx = 0; m.dashPos = null; m.loose = false; }
  hazards = []; floats = []; loopFxs = []; loose = []; wilds = [];
  timeLeft = PARADE_TIME;
  updateFollowers();
  phase = 'parade';
}
function nearestStand(px, py) {
  var best = null, bd = 1e9;
  for (var i = 0; i < stands.length; i++) { var d = distRect(stands[i], px, py); if (d < bd) { bd = d; best = stands[i]; } }
  return { stand: best, dist: bd };
}
function perform(m) {
  var ns = nearestStand(m.bx, m.by), tx, ty, noScore = false;
  if (ns.dist <= 280) { var p = nearestOnRect(ns.stand, m.bx, m.by); tx = p.x; ty = p.y; }
  else { tx = m.bx + Math.cos(m.angle) * 220; ty = m.by + Math.sin(m.angle) * 220; noScore = true; }
  m.rage = Math.max(0, m.rage - (m.species === 'stone' ? 25 : 10));
  m.perfFx = 0.5;
  castSkill(m.species, m.bx, m.by, tx, ty, m, 'parade', noScore);
}
function updateParade(dt) {
  timeLeft -= dt;
  moveHead(dt);
  updateFollowers();
  var poly = checkLoop();
  if (poly) {
    for (var q = loose.length - 1; q >= 0; q--) {
      if (inPoly(poly, loose[q].bx, loose[q].by)) {
        var m0 = loose.splice(q, 1)[0];
        m0.loose = false; m0.rage = 40; m0.perfCd = -1; m0.arrived = false; m0.dashPos = null;
        G.team.push(m0);
      }
    }
    updateFollowers();
  }
  var i, m;
  // 怒氣
  for (i = 0; i < G.team.length; i++) {
    m = G.team[i];
    m.hitFx = Math.max(0, m.hitFx - dt); m.perfFx = Math.max(0, m.perfFx - dt);
    var r = m.rage;
    if (m.species === 'fire') r += (nearestStand(m.bx, m.by).dist < 170 ? 12 : -4) * dt;
    else if (m.species === 'bat') r += (T.turnRate >= 3 ? 15 : -5) * dt;
    else if (m.species === 'mushroom') r -= 2 * dt;
    else r += 3 * dt;
    m.rage = clamp(r, 0, 100);
  }
  // 失控
  for (i = G.team.length - 1; i >= 0; i--) {
    m = G.team[i];
    if (m.rage >= 100) {
      G.team.splice(i, 1);
      m.loose = true; m.dashPos = null; m.arrived = false; m.atkT = 1.5; m.perfFx = 0;
      loose.push(m);
    }
  }
  updateFollowers();
  // 表演
  for (i = 0; i < G.team.length; i++) {
    m = G.team[i];
    if (m.rage < 50) { m.perfCd = -1; continue; }
    var interval = 3 - 2 * clamp((m.rage - 50) / 49, 0, 1);
    if (m.perfCd < 0) m.perfCd = interval;
    m.perfCd -= dt;
    if (m.perfCd <= 0) { perform(m); m.perfCd = 3 - 2 * clamp((m.rage - 50) / 49, 0, 1); }
  }
  updateHazards(dt);
  // 失控魔物
  for (i = 0; i < loose.length; i++) {
    m = loose[i];
    var ns = nearestStand(m.bx, m.by);
    if (!ns.stand) continue;
    var tp = nearestOnRect(ns.stand, m.bx, m.by);
    m.angle = Math.atan2(tp.y - m.by, tp.x - m.bx);
    if (ns.dist > 24) {
      var sd = Math.min(170 * dt, ns.dist);
      m.bx += Math.cos(m.angle) * sd; m.by += Math.sin(m.angle) * sd;
    } else {
      if (!m.arrived) { m.arrived = true; m.atkT = 1.5; }
      m.atkT -= dt;
      if (m.atkT <= 0) {
        m.atkT += 1.5;
        addRep(-3);
        var st = ns.stand, cx = st.x + st.w / 2, cy = st.y + st.h / 2;
        addFloat(cx, cy, '名聲-3', 'repDown');
        st.atkT = 1;
        var cand = st.visitors.filter(function (v) { return v.awayT <= 0; });
        if (cand.length) cand[Math.floor(Math.random() * cand.length)].awayT = 4;
      }
    }
  }
  // 看台計時
  for (i = 0; i < stands.length; i++) {
    var s = stands[i];
    s.cheerT = Math.max(0, s.cheerT - dt); s.atkT = Math.max(0, s.atkT - dt);
    for (var k = 0; k < s.visitors.length; k++) {
      var v = s.visitors[k];
      v.cheerT = Math.max(0, v.cheerT - dt); v.awayT = Math.max(0, v.awayT - dt);
    }
  }
  if (timeLeft <= 0) endParade();
}
function endParade() {
  timeLeft = 0;
  for (var i = 0; i < loose.length; i++) {
    addRep(-5);
    var m = loose[i]; m.loose = false; m.rage = 40; m.perfCd = -1; m.arrived = false;
    G.team.push(m);
  }
  loose = []; hazards = [];
  for (var j = 0; j < G.team.length; j++) G.team[j].dashPos = null;
  if (G.day >= DAYS) phase = 'result';
  else phase = 'shop';
}

// ---------- 輸入(只有滑鼠) ----------
function updMouse(e) {
  var r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * W / r.width;
  mouse.y = (e.clientY - r.top) * H / r.height;
}
function inBox(x, y, b) { return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
function openGuide() { guideReturn = phase; guidePage = 0; phase = 'guide'; }
function onLeftClick() {
  var mx = mouse.x, my = mouse.y;
  if (phase === 'guide') {
    if (guidePage > 0 && inBox(mx, my, PREV_BTN)) { guidePage--; return; }
    if (guidePage < GUIDE.length - 1) { guidePage++; return; }
    if (guideReturn) { phase = guideReturn; guideReturn = null; }
    else { titleStage = 'dungeon'; phase = 'title'; }
  } else if (phase === 'title') {
    if (titleStage === 'dungeon') startDungeon(); else startParade();
  } else if (phase === 'shop') {
    for (var i = 0; i < ITEMS.length; i++) {
      var it = ITEMS[i], s = G.shop[it.id];
      if (Math.abs(mx - 360) <= 300 && Math.abs(my - it.y) <= 70) {
        if (G.gold >= s.cost) {
          G.gold -= s.cost; s.lv++; s.cost = Math.round(s.cost * 1.5);
          if (it.id === 'longRope') G.ropeCount += 4;
          else if (it.id === 'collarBag') G.collarMax += 1;
          else if (it.id === 'armor') G.maxHearts += 1;
          else G.speed += 40;
        }
        return;
      }
    }
    if (inBox(mx, my, DEPART_BTN)) { G.day++; titleStage = 'dungeon'; phase = 'title'; }
  } else if (phase === 'result') {
    newRun(); titleStage = 'dungeon'; phase = 'title';
  }
}
function onRightClick() {
  if (phase === 'guide') { if (guidePage > 0) guidePage--; }
  else if (phase !== 'result') openGuide();
}
canvas.addEventListener('mousemove', function (e) { updMouse(e); });
canvas.addEventListener('mousedown', function (e) {
  e.preventDefault(); updMouse(e);
  if (e.button === 0) onLeftClick(); else if (e.button === 2) onRightClick();
});
canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

// ---------- 繪製 ----------
function toScr(x, y) { return phase === 'dungeon' ? { x: x - cam.x, y: y - cam.y + HUD_H } : { x: x, y: y }; }
function hudState() {
  return { phase: phase, day: G.day, gold: G.gold, rep: G.rep, hearts: hearts, maxHearts: G.maxHearts, collars: collars,
    collarMax: G.collarMax, trainCount: G.team.length, trainMax: TEAM_MAX, timeLeft: Math.max(0, timeLeft),
    message: (phase === 'parade' && loose.length) ? '繞一圈把牠圍回來' : '' };
}
function fontOf(px, bold) { return (bold ? 'bold ' : '') + px + 'px "Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif'; }
function textShadowed(str, x, y, px, align, color, bold) {
  ctx.font = fontOf(px, bold); ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, px / 6); ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineJoin = 'round';
  ctx.strokeText(str, x, y); ctx.fillStyle = color; ctx.fillText(str, x, y);
}
function drawPanel(x, y, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x, y, w, h);
}
function drawHelpHint() { textShadowed('右鍵:說明', W - 12, H - 16, 22, 'right', '#fff', false); }

function drawTeam() {
  var i, m;
  for (i = ropes.length - 1; i >= 0; i--) {
    var rp = ropes[i], sp = toScr(rp.x, rp.y);
    Art.drawRopeSegment(ctx, { x: sp.x, y: sp.y, angle: rp.angle, index: rp.index });
  }
  for (i = G.team.length - 1; i >= 0; i--) {
    m = G.team[i];
    var pos = m.dashPos || { x: m.bx, y: m.by }, p = toScr(pos.x, pos.y);
    Art.drawTrainMonster(ctx, { x: p.x, y: p.y, angle: m.angle, species: m.species, rage: Math.round(m.rage),
      performing: m.perfFx > 0, hitFx: m.hitFx > 0, mode: 'line' });
  }
  var tp = toScr(T.x, T.y);
  Art.drawTamer(ctx, { x: tp.x, y: tp.y, angle: T.angle, blink: T.inv > 0 });
}
function drawHazards() {
  for (var i = 0; i < hazards.length; i++) {
    var h = hazards[i];
    if (h.kind === 'batdash' && h.phase === 'active' && !h.dashing) continue;
    var p = toScr(h.x, h.y);
    Art.drawHazard(ctx, { x: p.x, y: p.y, kind: h.kind, phase: h.phase, radius: h.radius, length: h.length, angle: h.angle, t: h.t });
  }
}
function drawFx() {
  var i, p;
  for (i = 0; i < loopFxs.length; i++) {
    var lf = loopFxs[i], pts = [];
    for (var k = 0; k < lf.poly.length; k++) { p = toScr(lf.poly[k].x, lf.poly[k].y); pts.push({ x: p.x, y: p.y }); }
    Art.drawLoopFx(ctx, { points: pts, t: lf.t });
  }
  for (i = 0; i < floats.length; i++) {
    var f = floats[i]; p = toScr(f.x, f.y);
    Art.drawFloatText(ctx, { x: p.x, y: p.y, text: f.text, kind: f.kind, t: f.t });
  }
}
function drawDungeon() {
  Art.drawBackground(ctx, {});
  ctx.save();
  ctx.beginPath(); ctx.rect(0, HUD_H, W, H - HUD_H); ctx.clip();
  var c0 = Math.max(0, Math.floor(cam.x / TILE)), c1 = Math.min(COLS - 1, Math.floor((cam.x + W) / TILE));
  var r0 = Math.max(0, Math.floor(cam.y / TILE)), r1 = Math.min(ROWS - 1, Math.floor((cam.y + H - HUD_H) / TILE));
  for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
    var ch = MAP[r].charAt(c);
    Art.drawTile(ctx, { x: c * TILE + 40 - cam.x, y: r * TILE + 40 - cam.y + HUD_H, kind: ch === '#' ? 'wall' : 'floor',
      zone: ch === '#' ? 'hall' : zoneAt(c, r), nest: !!NEST_CHAR[ch] });
  }
  drawHazards();
  for (var i = 0; i < wilds.length; i++) {
    var w = wilds[i], pos = w.dashPos || { x: w.bx, y: w.by }, p = toScr(pos.x, pos.y);
    Art.drawWildMonster(ctx, { x: p.x, y: p.y, species: w.species, stamina: w.hp, maxStamina: w.maxHp,
      casting: w.casting, stunned: w.stun > 0, hit: w.hitT > 0, angle: w.angle });
  }
  drawTeam();
  drawFx();
  ctx.restore();
  Art.drawHud(ctx, hudState());
  drawHelpHint();
}
function drawParade() {
  Art.drawBackground(ctx, {});
  Art.drawPark(ctx, {});
  Art.drawFountain(ctx, { x: FOUNT.x, y: FOUNT.y });
  var i, k;
  for (i = 0; i < stands.length; i++) {
    var s = stands[i];
    Art.drawStand(ctx, { x: s.x, y: s.y, w: s.w, h: s.h, side: s.side, mood: s.atkT > 0 ? 'attacked' : (s.cheerT > 0 ? 'cheer' : 'calm') });
    for (k = 0; k < s.visitors.length; k++) {
      var v = s.visitors[k], mode = 'watch';
      if (v.awayT > 0) mode = v.awayT > 3.4 ? 'scared' : 'empty';
      else if (v.cheerT > 0) mode = 'cheer';
      Art.drawVisitor(ctx, { x: v.x, y: v.y, side: s.side, mode: mode });
    }
  }
  drawHazards();
  drawTeam();
  for (i = 0; i < loose.length; i++) {
    var m = loose[i];
    Art.drawTrainMonster(ctx, { x: m.bx, y: m.by, angle: m.angle, species: m.species, rage: 100, performing: false, hitFx: false, mode: 'loose' });
  }
  drawFx();
  Art.drawHud(ctx, hudState());
  drawHelpHint();
}
function drawGuide() {
  var g = GUIDE[guidePage];
  Art.drawBackground(ctx, {});
  drawPanel(60, 50, 600, 100);
  textShadowed(g.t, 360, 100, 52, 'center', '#ffe27a', true);
  Art.drawGuidePage(ctx, { page: guidePage + 1, x: GUIDE_FRAME.x, y: GUIDE_FRAME.y, w: GUIDE_FRAME.w, h: GUIDE_FRAME.h });
  drawPanel(60, 860, 600, 120);
  textShadowed(g.s, 360, 920, 38, 'center', '#fff', true);
  textShadowed((guidePage + 1) + ' / ' + GUIDE.length, 360, 1050, 34, 'center', '#fff', true);
  var last = guidePage === GUIDE.length - 1;
  textShadowed(last ? (guideReturn ? '點畫面回到遊戲' : '點畫面開始遊戲') : '點畫面繼續', 360, 1110, 28, 'center', '#ddd', false);
  if (guidePage > 0) {
    drawPanel(PREV_BTN.x, PREV_BTN.y, PREV_BTN.w, PREV_BTN.h);
    textShadowed('◀ 上一頁', PREV_BTN.x + PREV_BTN.w / 2, PREV_BTN.y + PREV_BTN.h / 2, 28, 'center', '#fff', true);
  }
  textShadowed('右鍵:上一頁', W - 12, H - 28, 22, 'right', '#ddd', false);
}
function drawShop() {
  Art.drawBackground(ctx, {});
  Art.drawHud(ctx, hudState());
  for (var i = 0; i < ITEMS.length; i++) {
    var it = ITEMS[i], s = G.shop[it.id];
    Art.drawShopItem(ctx, { x: 360, y: it.y, item: it.id, level: s.lv, cost: s.cost, affordable: G.gold >= s.cost });
  }
  Art.drawButton(ctx, { x: DEPART_BTN.x, y: DEPART_BTN.y, w: DEPART_BTN.w, h: DEPART_BTN.h, label: '出發', enabled: true });
  drawHelpHint();
}
function starsOf(rep) { var s = 0; for (var i = 0; i < STAR_AT.length; i++) if (rep >= STAR_AT[i]) s = i + 1; return s; }
function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (phase === 'guide') drawGuide();
  else if (phase === 'title') {
    Art.drawBackground(ctx, {});
    Art.drawTitleCard(ctx, { day: G.day, stage: titleStage });
    drawHelpHint();
  } else if (phase === 'dungeon') drawDungeon();
  else if (phase === 'parade') drawParade();
  else if (phase === 'shop') drawShop();
  else if (phase === 'result') {
    Art.drawBackground(ctx, {});
    Art.drawResultPanel(ctx, { rep: G.rep, goldEarned: G.goldEarned, trainCount: G.team.length, stars: starsOf(G.rep) });
  }
}

// ---------- 主迴圈 ----------
function update(dt) {
  clock += dt;
  var i;
  for (i = floats.length - 1; i >= 0; i--) { floats[i].t += dt; if (floats[i].t > 1.2) floats.splice(i, 1); }
  for (i = loopFxs.length - 1; i >= 0; i--) { loopFxs[i].t += dt; if (loopFxs[i].t > 0.5) loopFxs.splice(i, 1); }
  if (phase === 'dungeon') updateDungeon(dt);
  else if (phase === 'parade') updateParade(dt);
}
var lastTs = null;
function frame(ts) {
  if (lastTs === null) lastTs = ts;
  var dt = Math.min((ts - lastTs) / 1000, 1 / 30);
  lastTs = ts;
  try {
    if (phase === 'dungeon' || phase === 'parade') update(dt);
    else { // 非遊玩階段只推進特效
      for (var i = floats.length - 1; i >= 0; i--) { floats[i].t += dt; if (floats[i].t > 1.2) floats.splice(i, 1); }
    }
    render();
  } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/*DBG*/
})();
