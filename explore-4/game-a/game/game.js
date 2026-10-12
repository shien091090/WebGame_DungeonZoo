(function () {
'use strict';

// ===================== 常數 / 資料 =====================
var CW = (Art.canvas && Art.canvas.width) || 720;
var CH = (Art.canvas && Art.canvas.height) || 1280;
var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';

var MAP = [
  '############',
  '#....#.....#',
  '#.t..#..g..#',
  '#..o.#.o...#',
  '#....#..g..#',
  '#.t........#',
  '#....#.....#',
  '###.####.###',
  '#..........#',
  '#....oo....#',
  '#..........#',
  '###.####.###',
  '#LL..#.WW..#',
  '#L.f.#.WWj.#',
  '#....#..W..#',
  '#.f.L#..j..#',
  '#LL........#',
  '###.####.###',
  '#..........#',
  '#..o....o..#',
  '#..........#',
  '#####..#####',
  '#####..#####',
  '##........##',
  '##........##',
  '##...S....##',
  '##........##',
  '##........##',
  '##........##',
  '############'
];
var TS = 60, COLS = 12, ROWS = 30;
var START_X = 5 * TS + 30, START_Y = 25 * TS + 30;

var SP = {
  fire:    { name: '火蜥蜴', hp: 10, interval: 2.4, whip: 25, decay: 4, gold: 5, rep: 1, room: [1, 1, 4, 6] },
  water:   { name: '水母',   hp: 7,  interval: 1.6, whip: 20, decay: 6, gold: 3, rep: 1, room: [6, 12, 10, 16] },
  thunder: { name: '雷鳥',   hp: 12, interval: 2.6, whip: 40, decay: 8, gold: 7, rep: 2, room: [1, 1, 4, 6] },
  stone:   { name: '石像鬼', hp: 16, interval: 3,   whip: 12, decay: 1, gold: 4, rep: 1, room: [6, 1, 10, 6] }
};
// 熔岩洞(火蜥蜴)是欄 1~4 列 12~16; 雷鳥崖是欄 1~4 列 1~6
SP.fire.room = [1, 12, 4, 16];
var NEST_CH = { t: 'thunder', g: 'stone', f: 'fire', j: 'water' };
var STAR_MULT = [0, 1, 1.3, 1.6];

var FACE_VEC = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
var FACE_IDX = [7, 0, 1, 6, -1, 2, 5, 4, 3];

var BODY = 30;            // 魔物身體判定半徑(揮鞭 / 哨音 / 技能打魔物)
var TAMER_R = 18;
var TAMER_SPEED = 320;
var ARENA = { x0: 60, x1: 660, y0: 270, y1: 1000 };
var SEAT_X = [110, 210, 310, 410, 510, 610];
var AUD_Y = { top: 190, bottom: 1080 };
var FENCE_Y = { top: 255, bottom: 1010 };

var SHOP_ITEMS = ['whipPower', 'ropeBag', 'armor', 'silverWhistle'];
var SHOP_BASE = [50, 40, 40, 50];
var SHOP_Y = [300, 460, 620, 780];

var GUIDE = [
  { title: '地下城', text: '方向鍵走, Z 揮鞭, X 翻滾' },
  { title: '收服', text: '打到殘血, 圈亮綠時揮鞭' },
  { title: '表演', text: 'Z 讓牠生氣, X 讓牠冷靜' },
  { title: '拿捏', text: '越氣越賺, 滿了就失控' }
];
var GUIDE_FRAME = { x: 60, y: 300, w: 600, h: 700 };

// ===================== 工具 =====================
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function rand(a, b) { return a + Math.random() * (b - a); }
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

function tileCh(c, r) {
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return '#';
  return MAP[r].charAt(c);
}
function solidAt(c, r) { var ch = tileCh(c, r); return ch === '#' || ch === 'o'; }
function blocked(x, y, rad) {
  var c0 = Math.floor((x - rad) / TS), c1 = Math.floor((x + rad) / TS);
  var r0 = Math.floor((y - rad) / TS), r1 = Math.floor((y + rad) / TS);
  for (var r = r0; r <= r1; r++) {
    for (var c = c0; c <= c1; c++) {
      if (!solidAt(c, r)) continue;
      var nx = clamp(x, c * TS, c * TS + TS), ny = clamp(y, r * TS, r * TS + TS);
      var dx = x - nx, dy = y - ny;
      if (dx * dx + dy * dy < rad * rad) return true;
    }
  }
  return false;
}
// 分軸移動, 可沿牆滑動; 兩軸都走完回 true
function tryMove(e, dx, dy, rad) {
  var ok = true;
  if (dx !== 0) { if (!blocked(e.x + dx, e.y, rad)) e.x += dx; else ok = false; }
  if (dy !== 0) { if (!blocked(e.x, e.y + dy, rad)) e.y += dy; else ok = false; }
  return ok;
}
function zoneOf(c, r) {
  if (c >= 1 && c <= 4 && r >= 1 && r <= 6) return 'crag';
  if (c >= 6 && c <= 10 && r >= 1 && r <= 6) return 'ruins';
  if (c >= 1 && c <= 4 && r >= 12 && r <= 16) return 'lava';
  if (c >= 6 && c <= 10 && r >= 12 && r <= 16) return 'pond';
  return 'hall';
}
function tileKind(ch) {
  if (ch === '#') return 'wall';
  if (ch === 'o') return 'pillar';
  if (ch === 'L') return 'lava';
  if (ch === 'W') return 'water';
  return 'floor';
}

// ===================== 狀態 =====================
var G = {};          // 跨天資料與流程
var T = {};          // 馴獸師
var D = null;        // 地下城
var S = null;        // 表演場
var held = {};
var idSeq = 1;

function resetAll() {
  G.phase = 'title';
  G.stage = 'dungeon';
  G.day = 1;
  G.gold = 0;
  G.rep = 0;
  G.goldEarned = 0;
  G.roster = [{ species: 'fire', star: 1 }];
  G.maxHearts = 5;
  G.ropeMax = 3;
  G.whipPower = 2;
  G.whistleCd = 2;
  G.shopLevel = [0, 0, 0, 0];
  G.shopCost = SHOP_BASE.slice();
  G.shopSel = 0;
  G.hold = null;
  G.guidePage = 0;
  G.guideReturn = null;
  G.stars = 0;
  G.hearts = G.maxHearts;
  G.ropes = G.ropeMax;
  D = null; S = null;
  T = newTamer(START_X, START_Y);
}
function newTamer(x, y) {
  return { x: x, y: y, facing: 0, rolling: false, rollT: 0, rollCd: 0, whipCd: 0, whistleCd: 0, invuln: 0, stun: 0, onWater: false };
}
function addRep(n) { G.rep = Math.max(0, G.rep + n); }
function addGold(n) { G.gold += n; G.goldEarned += n; }

// ===================== 浮字 / 特效 =====================
function addFloat(list, text, kind, x, y, world) {
  list.push({ x: x, y: y, text: text, kind: kind, t: 0, world: !!world });
}
function updateFx(list, dt, life) {
  for (var i = list.length - 1; i >= 0; i--) {
    list[i].t += dt;
    if (list[i].t >= life(list[i])) list.splice(i, 1);
  }
}
function floatLife() { return 1.3; }
function effectLife(e) { return e.life; }

// ===================== 技能(地下城與表演場共用) =====================
// cast: 一次施放; 包含多個 hazard(水彈 3 發)
function makeCast(owner, payout, red, star) {
  return { owner: owner, payout: payout, red: red, star: star, hits: {}, count: 0, tamerHit: false, pending: 0 };
}
function spawnSkill(list, species, owner, ox, oy, tx, ty, mult, cast) {
  function add(h) { h.cast = cast; cast.pending++; list.push(h); }
  if (species === 'fire') {
    add({ kind: 'firering', x: ox, y: oy, phase: 'warn', t: 0, warnDur: 0.5, activeDur: 0.5, radius: 120 * mult, angle: 0 });
  } else if (species === 'thunder') {
    add({ kind: 'thunder', x: tx, y: ty, phase: 'warn', t: 0, warnDur: 0.8, activeDur: 0.3, radius: 70 * mult, angle: 0, fired: false });
  } else if (species === 'stone') {
    add({ kind: 'quake', x: ox, y: oy, phase: 'active', t: 0, warnDur: 0, activeDur: 1, radius: 0, maxR: 220 * mult, angle: 0 });
  } else if (species === 'water') {
    var a = Math.atan2(ty - oy, tx - ox);
    for (var i = -1; i <= 1; i++) {
      var an = a + i * 20 * Math.PI / 180;
      add({ kind: 'waterball', x: ox, y: oy, phase: 'active', t: 0, warnDur: 0, activeDur: 99, radius: 12, angle: an, vx: Math.cos(an) * 300, vy: Math.sin(an) * 300, life: 6 });
    }
  }
}
function hazardHits(h, px, py, pr) {
  var d = dist(px, py, h.x, h.y);
  if (h.kind === 'quake') return Math.abs(d - h.radius) <= 15 + pr;
  if (h.kind === 'waterball') return d <= 12 + pr;
  return d <= h.radius + pr;
}
function hazardResolved(h) {
  h.cast.pending--;
  if (h.cast.pending <= 0 && h.cast.payout && S) payCast(h.cast);
}
function applyHazard(h, inDungeon) {
  var cast = h.cast;
  // 馴獸師
  if (!cast.tamerHit && hazardHits(h, T.x, T.y, TAMER_R)) {
    if (inDungeon) {
      if (!T.rolling && T.invuln <= 0) { cast.tamerHit = true; hurtDungeon(); }
    } else if (T.stun <= 0 && T.invuln <= 0) {
      cast.tamerHit = true; stunTamer();
    }
  }
  // 表演場魔物互打
  if (!inDungeon && cast.payout) {
    for (var i = 0; i < S.monsters.length; i++) {
      var m = S.monsters[i];
      if (m === cast.owner || m.mode !== 'roam' || cast.hits[m.id]) continue;
      if (!hazardHits(h, m.x, m.y, BODY)) continue;
      cast.hits[m.id] = true; cast.count++;
      if (h.kind === 'waterball') { m.fx = 'doused'; m.fxT = 0.5; setRage(m, m.rage - 20); }
      else { m.fx = 'ignited'; m.fxT = 0.5; setRage(m, m.rage + 15); }
    }
  }
}
function updateHazards(list, dt, inDungeon) {
  for (var i = list.length - 1; i >= 0; i--) {
    var h = list[i];
    var done = false;
    h.t += dt;
    if (h.kind === 'firering') {
      if (h.phase === 'warn' && h.t >= h.warnDur) { h.phase = 'active'; h.t -= h.warnDur; }
      if (h.phase === 'active') { applyHazard(h, inDungeon); if (h.t >= h.activeDur) done = true; }
    } else if (h.kind === 'thunder') {
      if (h.phase === 'warn' && h.t >= h.warnDur) { h.phase = 'active'; h.t -= h.warnDur; }
      if (h.phase === 'active') {
        if (!h.fired) { h.fired = true; applyHazard(h, inDungeon); }
        if (h.t >= h.activeDur) done = true;
      }
    } else if (h.kind === 'quake') {
      h.radius = h.maxR * Math.min(h.t / h.activeDur, 1);
      applyHazard(h, inDungeon);
      if (h.t >= h.activeDur) done = true;
    } else if (h.kind === 'waterball') {
      h.x += h.vx * dt; h.y += h.vy * dt;
      applyHazard(h, inDungeon);
      if (h.cast.tamerHit && dist(h.x, h.y, T.x, T.y) <= 12 + TAMER_R) done = true;
      if (h.life !== undefined) { h.life -= dt; if (h.life <= 0) done = true; }
      if (inDungeon) { if (blocked(h.x, h.y, 4)) done = true; }
      else if (h.x < ARENA.x0 || h.x > ARENA.x1 || h.y < ARENA.y0 || h.y > ARENA.y1) done = true;
    }
    if (done) { list.splice(i, 1); hazardResolved(h); }
  }
}

// ===================== 馴獸師共用 =====================
function updateTamerBase(dt, inDungeon) {
  T.whipCd = Math.max(0, T.whipCd - dt);
  T.rollCd = Math.max(0, T.rollCd - dt);
  T.whistleCd = Math.max(0, T.whistleCd - dt);
  T.invuln = Math.max(0, T.invuln - dt);
  if (T.stun > 0) { T.stun -= dt; if (T.stun <= 0) { T.stun = 0; T.invuln = 2; } }

  var ix = (held.ArrowRight ? 1 : 0) - (held.ArrowLeft ? 1 : 0);
  var iy = (held.ArrowDown ? 1 : 0) - (held.ArrowUp ? 1 : 0);

  if (inDungeon) {
    var tc = Math.floor(T.x / TS), tr = Math.floor(T.y / TS);
    T.onWater = tileCh(tc, tr) === 'W';
  }
  if (T.rolling) {
    T.rollT -= dt;
    var fv = FACE_VEC[T.facing], fl = Math.hypot(fv[0], fv[1]);
    var step = 800 * dt;
    tryMove(T, fv[0] / fl * step, fv[1] / fl * step, TAMER_R);
    if (T.rollT <= 0) { T.rolling = false; T.rollT = 0; }
    return;
  }
  if (ix || iy) {
    T.facing = FACE_IDX[(iy + 1) * 3 + (ix + 1)];
    var len = Math.hypot(ix, iy);
    var sp = TAMER_SPEED * (inDungeon && T.onWater ? 0.5 : 1) * dt;
    var dx = ix / len * sp, dy = iy / len * sp;
    if (inDungeon) tryMove(T, dx, dy, TAMER_R);
    else {
      T.x = clamp(T.x + dx, ARENA.x0 + TAMER_R, ARENA.x1 - TAMER_R);
      T.y = clamp(T.y + dy, ARENA.y0 + TAMER_R, ARENA.y1 - TAMER_R);
    }
  }
}

// ===================== 地下城 =====================
function startDungeon() {
  var nests = [];
  for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
    var sp = NEST_CH[tileCh(c, r)];
    if (sp) nests.push({ c: c, r: r, species: sp, timer: 0, mon: null });
  }
  D = { t: 0, left: 60, monsters: [], nests: nests, hazards: [], effects: [], floats: [], ended: false };
  G.hearts = G.maxHearts;
  G.ropes = G.ropeMax;
  T = newTamer(START_X, START_Y);
  for (var i = 0; i < nests.length; i++) spawnWild(nests[i]);
  G.phase = 'dungeon';
}
function spawnWild(nest) {
  var base = SP[nest.species];
  var maxHp = Math.round(base.hp * (1 + 0.5 * (G.day - 1)));
  var m = {
    id: idSeq++, species: nest.species, x: nest.c * TS + TS / 2, y: nest.r * TS + TS / 2,
    maxHp: maxHp, hp: maxHp, hit: 0, castT: base.interval * rand(0.5, 1), castFlash: 0,
    dirT: rand(2, 3), ang: rand(0, Math.PI * 2), faceDir: 1, nest: nest
  };
  nest.mon = m; nest.timer = 0;
  D.monsters.push(m);
}
function removeWild(m) {
  var i = D.monsters.indexOf(m);
  if (i >= 0) D.monsters.splice(i, 1);
  m.nest.mon = null; m.nest.timer = 8;
}
function isWeak(m) { return m.hp <= m.maxHp * 0.3; }
function monPulse(m) {
  if (!isWeak(m)) return 0;
  var ph = (D.t % 1.2) / 1.2;
  return ph < 0.5 ? ph * 2 : 2 - ph * 2;
}
function monGreen(m) {
  if (!isWeak(m)) return false;
  var ratio = m.hp / m.maxHp;
  var w = 0.15 + 0.35 * (1 - ratio / 0.3);
  return monPulse(m) >= 1 - w;
}
function hurtDungeon() {
  G.hearts--;
  T.invuln = 1;
}

function dungeonWhip() {
  T.whipCd = 0.35;
  D.effects.push({ type: 'whip', x: T.x, y: T.y, facing: T.facing, t: 0, life: 0.3 });
  var fv = FACE_VEC[T.facing], fl = Math.hypot(fv[0], fv[1]);
  var fx = fv[0] / fl, fy = fv[1] / fl;
  var list = D.monsters.slice();
  for (var i = 0; i < list.length; i++) {
    var m = list[i];
    var d = dist(m.x, m.y, T.x, T.y);
    if (d > 110 + BODY) continue;
    if (d > 1) {
      var dot = ((m.x - T.x) * fx + (m.y - T.y) * fy) / d;
      if (dot < 0.5) continue;   // cos 60°
    }
    if (isWeak(m) && monGreen(m) && G.ropes > 0) {
      G.ropes--;
      captureMonster(m);
    } else {
      m.hp -= G.whipPower;
      m.hit = 0.2;
      if (m.hp <= 0) {
        addGold(4);
        addFloat(D.floats, '+4', 'gold', m.x, m.y - 40, true);
        removeWild(m);
      }
    }
  }
}
function captureMonster(m) {
  var found = null;
  for (var i = 0; i < G.roster.length; i++) if (G.roster[i].species === m.species) found = G.roster[i];
  if (found) {
    if (found.star < 3) { found.star++; addFloat(D.floats, '升星', 'starUp', m.x, m.y - 40, true); }
    else { addGold(20); addFloat(D.floats, '+20', 'gold', m.x, m.y - 40, true); }
  } else {
    G.roster.push({ species: m.species, star: 1 });
    addFloat(D.floats, '收服', 'starUp', m.x, m.y - 40, true);
  }
  removeWild(m);
}
function dungeonRoll() {
  T.rolling = true; T.rollT = 0.25; T.rollCd = 0.8;
}

function updateWild(m, dt) {
  var base = SP[m.species];
  m.hit = Math.max(0, m.hit - dt);
  m.castFlash = Math.max(0, m.castFlash - dt);
  m.dirT -= dt;
  if (m.dirT <= 0) { m.ang = rand(0, Math.PI * 2); m.dirT = rand(2, 3); }
  var dx = Math.cos(m.ang) * 60 * dt, dy = Math.sin(m.ang) * 60 * dt;
  var rm = base.room;
  var x0 = rm[0] * TS + 25, x1 = (rm[2] + 1) * TS - 25, y0 = rm[1] * TS + 25, y1 = (rm[3] + 1) * TS - 25;
  var nx = m.x + dx, ny = m.y + dy;
  if (nx < x0 || nx > x1) { m.ang = Math.PI - m.ang; m.x = clamp(m.x, x0, x1); }
  else if (ny < y0 || ny > y1) { m.ang = -m.ang; m.y = clamp(m.y, y0, y1); }
  else if (!tryMove(m, dx, dy, 22)) { m.ang = rand(0, Math.PI * 2); m.dirT = rand(2, 3); }
  m.faceDir = Math.cos(m.ang) >= 0 ? 1 : -1;
  // 攻擊
  if (dist(m.x, m.y, T.x, T.y) < 400) {
    m.castT -= dt;
    if (m.castT <= 0) {
      var cast = makeCast(m, false, false, 1);
      spawnSkill(D.hazards, m.species, m, m.x, m.y, T.x, T.y, 1, cast);
      m.castFlash = 0.3;
      m.castT = base.interval * (isWeak(m) ? 1.5 : 1);
    }
  }
}

function updateDungeon(dt) {
  D.t += dt;
  D.left -= dt;
  updateTamerBase(dt, true);
  // 熔岩
  if (!T.rolling && T.invuln <= 0 && tileCh(Math.floor(T.x / TS), Math.floor(T.y / TS)) === 'L') hurtDungeon();
  for (var i = 0; i < D.monsters.length; i++) updateWild(D.monsters[i], dt);
  for (var n = 0; n < D.nests.length; n++) {
    var nest = D.nests[n];
    if (!nest.mon) { nest.timer -= dt; if (nest.timer <= 0) spawnWild(nest); }
  }
  updateHazards(D.hazards, dt, true);
  updateFx(D.effects, dt, effectLife);
  updateFx(D.floats, dt, floatLife);
  checkDungeonEnd();
}
function checkDungeonEnd() {
  if (D.ended) return;
  if (G.hearts <= 0 || D.left <= 0) {
    D.ended = true;
    G.hold = { t: 0.8, msg: G.hearts <= 0 ? '心歸零' : '時間到', next: function () { G.phase = 'title'; G.stage = 'show'; } };
  }
}

// ===================== 表演場 =====================
function startShow() {
  S = { left: 50, monsters: [], hazards: [], effects: [], floats: [], casts: [], fences: [], visitors: [], ended: false };
  for (var i = 0; i < 12; i++) {
    var side = i < 6 ? 'top' : 'bottom';
    var sx = SEAT_X[i % 6];
    S.fences.push({ x: sx, y: FENCE_Y[side], side: side, broken: false });
    S.visitors.push({ x: sx, y: AUD_Y[side], seat: i, mode: 'watch', timer: 0 });
  }
  T = newTamer(360, 635);
  T.facing = 4;
  var placed = [];
  for (var k = 0; k < G.roster.length; k++) {
    var r = G.roster[k], px = 360, py = 635;
    for (var tries = 0; tries < 40; tries++) {
      px = rand(ARENA.x0 + 60, ARENA.x1 - 60); py = rand(ARENA.y0 + 60, ARENA.y1 - 60);
      var ok = dist(px, py, T.x, T.y) > 120;
      for (var j = 0; j < placed.length && ok; j++) if (dist(px, py, placed[j][0], placed[j][1]) < 130) ok = false;
      if (ok) break;
    }
    placed.push([px, py]);
    S.monsters.push({
      id: idSeq++, species: r.species, star: r.star, x: px, y: py, rage: 20, mode: 'roam',
      ang: rand(0, Math.PI * 2), dirT: rand(2, 3), faceDir: 1, perfTimer: -1, perfT: 0,
      fx: 'none', fxT: 0, subdue: 0, fence: null, ramT: 0, tx: 0, ty: 0, seatSide: 'top',
      runDir: 1, atkT: 1.5
    });
  }
  G.phase = 'show';
}
function perfInterval(rage) { return 3 - 2 * clamp((rage - 50) / 49, 0, 1); }
function setRage(m, v) {
  m.rage = clamp(v, 0, 100);
  if (m.rage >= 100 && m.mode === 'roam') startCharge(m);
}
function startCharge(m) {
  m.mode = 'charge';
  m.rage = 100;
  m.subdue = 0;
  m.perfT = 0;
  m.seatSide = m.y < (ARENA.y0 + ARENA.y1) / 2 ? 'top' : 'bottom';
  var seat = clamp(Math.round((m.x - 110) / 100), 0, 5);
  m.seat = seat;
  m.fence = S.fences[(m.seatSide === 'top' ? 0 : 6) + seat];
  m.tx = SEAT_X[seat];
  m.ty = m.seatSide === 'top' ? ARENA.y0 + 5 : ARENA.y1 - 5;
  m.ramT = 0;
}
function payCast(cast) {
  var m = cast.owner;
  if (cast.paid) return;
  cast.paid = true;
  var b = SP[m.species];
  var n = Math.round(b.gold * cast.star * (1 + 0.5 * cast.count) * (cast.red ? 2 : 1) * (1 + G.rep / 100));
  addGold(n);
  addRep(b.rep);
  addFloat(S.floats, cast.red ? '+' + n + ' 紅線 ×2' : '+' + n, cast.red ? 'redGold' : 'gold', m.x, m.y - 60, false);
  addFloat(S.floats, '+' + b.rep + ' 名聲', 'repUp', m.x + 50, m.y - 30, false);
}
function perform(m) {
  var red = m.rage >= 80 && m.rage < 100;
  var cast = makeCast(m, true, red, m.star);
  S.casts.push(cast);
  spawnSkill(S.hazards, m.species, m, m.x, m.y, T.x, T.y, STAR_MULT[m.star], cast);
  m.perfT = 0.5;
}
function stunTamer() {
  T.stun = 1.5;
  addRep(-2);
  addFloat(S.floats, '-2 名聲', 'repDown', T.x, T.y - 50, false);
}
function showWhip() {
  T.whipCd = 0.35;
  S.effects.push({ type: 'whip', x: T.x, y: T.y, t: 0, life: 0.3 });
  var list = S.monsters.slice();
  for (var i = 0; i < list.length; i++) {
    var m = list[i];
    if (m.mode !== 'roam') continue;
    if (dist(m.x, m.y, T.x, T.y) <= 110 + BODY) setRage(m, m.rage + SP[m.species].whip);
  }
}
function showWhistle() {
  T.whistleCd = G.whistleCd;
  S.effects.push({ type: 'whistle', x: T.x, y: T.y, t: 0, life: 0.5 });
  for (var i = 0; i < S.monsters.length; i++) {
    var m = S.monsters[i];
    if (dist(m.x, m.y, T.x, T.y) > 140 + BODY) continue;
    if (m.mode === 'roam') {
      m.rage = clamp(m.rage - 30, 0, 100);
      m.fx = 'calmed'; m.fxT = 0.5;
    } else {
      m.subdue++;
      m.fx = 'calmed'; m.fxT = 0.5;
      if (m.subdue >= 3) subdueMonster(m);
    }
  }
}
function subdueMonster(m) {
  if (m.fence) m.fence.broken = false;
  m.fence = null;
  m.mode = 'roam';
  m.rage = 30;
  m.subdue = 0;
  m.x = 360; m.y = 635;
  m.perfTimer = -1;
  m.ang = rand(0, Math.PI * 2);
}
function updateShowMonster(m, dt) {
  m.perfT = Math.max(0, m.perfT - dt);
  if (m.fxT > 0) { m.fxT -= dt; if (m.fxT <= 0) { m.fxT = 0; m.fx = 'none'; } }
  if (m.mode === 'roam') {
    m.rage = clamp(m.rage - SP[m.species].decay * dt, 0, 100);
    m.dirT -= dt;
    if (m.dirT <= 0) { m.ang = rand(0, Math.PI * 2); m.dirT = rand(2, 3); }
    var nx = m.x + Math.cos(m.ang) * 60 * dt, ny = m.y + Math.sin(m.ang) * 60 * dt;
    if (nx < ARENA.x0 + 50 || nx > ARENA.x1 - 50) { m.ang = Math.PI - m.ang; nx = m.x; }
    if (ny < ARENA.y0 + 50 || ny > ARENA.y1 - 50) { m.ang = -m.ang; ny = m.y; }
    m.x = clamp(nx, ARENA.x0 + 50, ARENA.x1 - 50);
    m.y = clamp(ny, ARENA.y0 + 50, ARENA.y1 - 50);
    m.faceDir = Math.cos(m.ang) >= 0 ? 1 : -1;
    if (m.rage < 50) m.perfTimer = -1;
    else {
      if (m.perfTimer < 0) m.perfTimer = perfInterval(m.rage);
      m.perfTimer -= dt;
      if (m.perfTimer <= 0) { perform(m); m.perfTimer = perfInterval(m.rage); }
    }
  } else if (m.mode === 'charge') {
    var d = dist(m.x, m.y, m.tx, m.ty);
    if (m.ramT <= 0 && d > 3) {
      var st = Math.min(160 * dt, d);
      m.x += (m.tx - m.x) / d * st; m.y += (m.ty - m.y) / d * st;
      m.faceDir = m.tx >= m.x ? 1 : -1;
    } else {
      m.ramT += dt;
      if (m.ramT >= 1.5) {
        m.fence.broken = true;
        m.mode = 'loose';
        m.atkT = 1.5;
        m.runDir = Math.random() < 0.5 ? -1 : 1;
      }
    }
  } else if (m.mode === 'loose') {
    var rowY = AUD_Y[m.seatSide];
    if (Math.abs(m.y - rowY) > 2) m.y += clamp(rowY - m.y, -140 * dt, 140 * dt);
    else {
      m.x += m.runDir * 140 * dt;
      if (m.x < SEAT_X[0]) { m.x = SEAT_X[0]; m.runDir = 1; }
      if (m.x > SEAT_X[5]) { m.x = SEAT_X[5]; m.runDir = -1; }
    }
    m.faceDir = m.runDir;
    m.atkT -= dt;
    if (m.atkT <= 0) {
      m.atkT = 1.5;
      var best = null, bd = 1e9;
      for (var i = 0; i < S.visitors.length; i++) {
        var v = S.visitors[i];
        if (v.mode !== 'watch' || (v.y !== rowY)) continue;
        var dd = Math.abs(v.x - m.x);
        if (dd < bd) { bd = dd; best = v; }
      }
      if (best && bd <= 80) {
        best.mode = 'scared'; best.timer = 4;
        addRep(-3);
        addFloat(S.floats, '-3 名聲', 'repDown', best.x, best.y, false);
      }
    }
  }
}
function updateShow(dt) {
  S.left -= dt;
  updateTamerBase(dt, false);
  for (var i = 0; i < S.monsters.length; i++) updateShowMonster(S.monsters[i], dt);
  updateHazards(S.hazards, dt, false);
  for (var v = 0; v < S.visitors.length; v++) {
    var vis = S.visitors[v];
    if (vis.mode === 'watch') continue;
    vis.timer -= dt;
    if (vis.timer <= 0) vis.mode = 'watch';
    else if (vis.timer <= 3) vis.mode = 'empty';
  }
  updateFx(S.effects, dt, effectLife);
  updateFx(S.floats, dt, floatLife);
  checkShowEnd();
}
function checkShowEnd() {
  if (S.ended) return;
  if (S.left > 0) return;
  S.ended = true;
  for (var i = 0; i < S.monsters.length; i++) {
    var m = S.monsters[i];
    if (m.mode === 'charge' || m.mode === 'loose') {
      addRep(-5);
      addFloat(S.floats, '-5 名聲', 'repDown', m.x, m.y - 40, false);
    }
  }
  for (var f = 0; f < S.fences.length; f++) S.fences[f].broken = false;
  for (var c = 0; c < S.casts.length; c++) if (!S.casts[c].paid) payCast(S.casts[c]);
  S.hazards.length = 0;
  G.hold = { t: 1.3, msg: '表演結束', next: function () {
    if (G.day < 3) { G.phase = 'shop'; G.shopSel = 0; }
    else {
      G.stars = G.rep >= 260 ? 3 : (G.rep >= 150 ? 2 : (G.rep >= 60 ? 1 : 0));
      G.phase = 'result';
    }
  } };
}

// ===================== 商店 =====================
function buyItem(i) {
  if (G.gold < G.shopCost[i]) return;
  G.gold -= G.shopCost[i];
  G.shopLevel[i]++;
  G.shopCost[i] = Math.round(G.shopCost[i] * 1.5);
  if (i === 0) G.whipPower += 1;
  else if (i === 1) G.ropeMax += 1;
  else if (i === 2) G.maxHearts += 1;
  else if (i === 3) G.whistleCd = Math.max(0.8, G.whistleCd - 0.4);
}

// ===================== 輸入(只有鍵盤) =====================
var KEYSET = { ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, KeyZ: 1, KeyX: 1, KeyH: 1 };
function keyName(e) {
  if (e.code && KEYSET[e.code]) return e.code;
  var k = e.key;
  if (k === 'z' || k === 'Z') return 'KeyZ';
  if (k === 'x' || k === 'X') return 'KeyX';
  if (k === 'h' || k === 'H') return 'KeyH';
  if (KEYSET[k]) return k;
  return null;
}
function onKeyDown(e) {
  var k = keyName(e);
  if (!k) return;
  e.preventDefault();
  if (e.repeat) return;
  held[k] = true;
  handleKey(k);
}
function onKeyUp(e) {
  var k = keyName(e);
  if (!k) return;
  e.preventDefault();
  held[k] = false;
}
function openGuide() {
  if (G.phase === 'guide' || G.phase === 'result') return;
  G.guideReturn = G.phase;
  G.guidePage = 0;
  G.phase = 'guide';
}
function handleKey(k) {
  var ph = G.phase;
  if (ph === 'guide') {
    if (k === 'KeyZ') {
      if (G.guidePage < GUIDE.length - 1) G.guidePage++;
      else if (G.guideReturn) { G.phase = G.guideReturn; G.guideReturn = null; }
      else { G.phase = 'title'; G.stage = 'dungeon'; }
    } else if (k === 'ArrowLeft') {
      if (G.guidePage > 0) G.guidePage--;
    }
    return;
  }
  if (k === 'KeyH') { openGuide(); return; }
  if (G.hold) return;
  if (ph === 'title') {
    if (k === 'KeyZ') { if (G.stage === 'dungeon') startDungeon(); else startShow(); }
  } else if (ph === 'dungeon') {
    if (D.ended) return;
    if (k === 'KeyZ' && T.whipCd <= 0 && !T.rolling) dungeonWhip();
    else if (k === 'KeyX' && T.rollCd <= 0 && !T.rolling) dungeonRoll();
  } else if (ph === 'show') {
    if (S.ended) return;
    if (T.stun > 0) return;
    if (k === 'KeyZ' && T.whipCd <= 0) showWhip();
    else if (k === 'KeyX' && T.whistleCd <= 0) showWhistle();
  } else if (ph === 'shop') {
    if (k === 'ArrowUp') G.shopSel = (G.shopSel + 4) % 5;
    else if (k === 'ArrowDown') G.shopSel = (G.shopSel + 1) % 5;
    else if (k === 'KeyZ') {
      if (G.shopSel < 4) buyItem(G.shopSel);
      else { G.day++; G.phase = 'title'; G.stage = 'dungeon'; }
    }
  } else if (ph === 'result') {
    if (k === 'KeyZ') resetAll();
  }
}

// ===================== 更新 =====================
function update(dt) {
  if (G.phase === 'guide') return;
  if (G.hold) {
    var list = G.phase === 'dungeon' ? D : S;
    if (list) { updateFx(list.effects, dt, effectLife); updateFx(list.floats, dt, floatLife); }
    G.hold.t -= dt;
    if (G.hold.t <= 0) { var nx = G.hold.next; G.hold = null; nx(); }
    return;
  }
  if (G.phase === 'dungeon') updateDungeon(dt);
  else if (G.phase === 'show') updateShow(dt);
}

// ===================== 繪製 =====================
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');

function resize() {
  var dpr = window.devicePixelRatio || 1;
  var scale = Math.min(window.innerWidth / CW, window.innerHeight / CH);
  if (!(scale > 0)) scale = 1;
  canvas.style.width = Math.floor(CW * scale) + 'px';
  canvas.style.height = Math.floor(CH * scale) + 'px';
  canvas.width = Math.round(CW * dpr * scale);
  canvas.height = Math.round(CH * dpr * scale);
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
}

function txt(s, x, y, size, color, align, weight) {
  ctx.save();
  ctx.font = (weight || 'bold') + ' ' + size + 'px ' + FONT;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, size / 8);
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.strokeText(s, x, y);
  ctx.fillStyle = color || '#fff';
  ctx.fillText(s, x, y);
  ctx.restore();
}

function hudState(phase, left, msg) {
  return {
    phase: phase, day: G.day, gold: G.gold, rep: G.rep, hearts: Math.max(0, G.hearts), maxHearts: G.maxHearts,
    ropes: G.ropes, ropeMax: G.ropeMax, roster: G.roster, timeLeft: Math.max(0, Math.ceil(left)),
    message: msg || '', rollReady: T.rollCd <= 0 && !T.rolling, whistleReady: T.whistleCd <= 0
  };
}
function tamerState(sx, sy, inDungeon) {
  return { x: sx, y: sy, facing: T.facing, rolling: T.rolling, stunned: T.stun > 0, blink: T.invuln > 0 };
}
function drawFloats(list, camY) {
  for (var i = 0; i < list.length; i++) {
    var f = list[i];
    Art.drawFloatText(ctx, { x: f.x, y: f.world ? f.y - camY + 120 : f.y, text: f.text, kind: f.kind, t: f.t });
  }
}
function drawFxList(list, camY, inDungeon) {
  for (var i = 0; i < list.length; i++) {
    var e = list[i], sy = inDungeon ? e.y - camY + 120 : e.y;
    if (e.type === 'whip') {
      Art.drawWhipCrack(ctx, { x: e.x, y: sy, shape: inDungeon ? 'arc' : 'circle', facing: e.facing || 0, radius: 110, t: e.t });
    } else {
      Art.drawWhistleWave(ctx, { x: e.x, y: sy, radius: 140, t: e.t });
    }
  }
}
function drawHazards(list, camY, inDungeon) {
  for (var i = 0; i < list.length; i++) {
    var h = list[i];
    Art.drawHazard(ctx, { x: h.x, y: inDungeon ? h.y - camY + 120 : h.y, kind: h.kind, phase: h.phase, radius: h.radius, t: h.t, angle: h.angle });
  }
}
function ownerCasting(hz, m) {
  for (var i = 0; i < hz.length; i++) if (hz[i].cast.owner === m && hz[i].phase === 'warn') return true;
  return false;
}

function renderDungeon() {
  var camY = clamp(T.y - 700, 0, 640);
  Art.drawBackground(ctx, {});
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 120, CW, CH - 120); ctx.clip();
  var r0 = Math.max(0, Math.floor(camY / TS)), r1 = Math.min(ROWS - 1, Math.floor((camY + 1160) / TS));
  for (var r = r0; r <= r1; r++) for (var c = 0; c < COLS; c++) {
    var ch = tileCh(c, r);
    Art.drawTile(ctx, { x: c * TS + TS / 2, y: r * TS + TS / 2 - camY + 120, kind: tileKind(ch), zone: zoneOf(c, r), nest: !!NEST_CH[ch] });
  }
  drawHazards(D.hazards, camY, true);
  for (var i = 0; i < D.monsters.length; i++) {
    var m = D.monsters[i], weak = isWeak(m);
    Art.drawWildMonster(ctx, {
      x: m.x, y: m.y - camY + 120, species: m.species, hp: m.hp, maxHp: m.maxHp, hit: m.hit > 0,
      weak: weak, pulse: monPulse(m), green: monGreen(m), casting: m.castFlash > 0 || ownerCasting(D.hazards, m), dir: m.faceDir
    });
  }
  Art.drawTamer(ctx, tamerState(T.x, T.y - camY + 120, true));
  drawFxList(D.effects, camY, true);
  drawFloats(D.floats, camY);
  ctx.restore();
  Art.drawHud(ctx, hudState('dungeon', D.left, G.hold ? G.hold.msg : ''));
}
function renderShow() {
  Art.drawBackground(ctx, {});
  Art.drawShowArena(ctx, {});
  var i, loose = false;
  for (i = 0; i < S.visitors.length; i++) {
    var v = S.visitors[i];
    Art.drawVisitor(ctx, { x: v.x, y: v.y, seat: v.seat, mode: v.mode });
  }
  for (i = 0; i < S.fences.length; i++) {
    var f = S.fences[i];
    Art.drawFence(ctx, { x: f.x, y: f.y, side: f.side, broken: f.broken });
  }
  drawHazards(S.hazards, 0, false);
  for (i = 0; i < S.monsters.length; i++) {
    var m = S.monsters[i];
    if (m.mode !== 'roam') loose = true;
    Art.drawShowMonster(ctx, {
      x: m.x, y: m.y, species: m.species, star: m.star, rage: m.rage,
      mode: m.mode, performing: m.perfT > 0, fx: m.fx, subdue: m.subdue, dir: m.faceDir
    });
  }
  Art.drawTamer(ctx, tamerState(T.x, T.y, false));
  drawFxList(S.effects, 0, false);
  drawFloats(S.floats, 0);
  var msg = G.hold ? G.hold.msg : (loose ? '追上去吹哨 3 次' : '');
  Art.drawHud(ctx, hudState('show', S.left, msg));
}
function renderGuide() {
  var p = GUIDE[G.guidePage];
  Art.drawBackground(ctx, {});
  txt('第 ' + (G.guidePage + 1) + ' 頁 ' + p.title, CW / 2, 170, 52, '#ffe08a');
  txt(p.text, CW / 2, 245, 36, '#ffffff');
  Art.drawGuidePage(ctx, { page: G.guidePage + 1, x: GUIDE_FRAME.x, y: GUIDE_FRAME.y, w: GUIDE_FRAME.w, h: GUIDE_FRAME.h });
  txt((G.guidePage + 1) + ' / ' + GUIDE.length, CW / 2, 1070, 32, '#dddddd');
  var last = G.guidePage === GUIDE.length - 1;
  txt(last ? (G.guideReturn ? '按 Z 回到遊戲' : '按 Z 開始遊戲') : '按 Z 繼續', CW / 2, 1150, 34, '#ffffff');
  txt(G.guidePage > 0 ? '← 上一頁' : '', CW / 2, 1205, 26, '#bbbbbb', 'center', 'normal');
}
function render() {
  var ph = G.phase;
  if (ph === 'guide') { renderGuide(); return; }
  if (ph === 'dungeon') renderDungeon();
  else if (ph === 'show') renderShow();
  else if (ph === 'title') {
    Art.drawBackground(ctx, {});
    Art.drawTitleCard(ctx, { day: G.day, stage: G.stage });
    txt('按 Z 開始', CW / 2, 1100, 40, '#ffffff');
  } else if (ph === 'shop') {
    Art.drawBackground(ctx, {});
    Art.drawHud(ctx, hudState('shop', 0, ''));
    for (var i = 0; i < 4; i++) {
      Art.drawShopItem(ctx, { x: CW / 2, y: SHOP_Y[i], item: SHOP_ITEMS[i], level: G.shopLevel[i], cost: G.shopCost[i], affordable: G.gold >= G.shopCost[i], selected: G.shopSel === i });
    }
    Art.drawButton(ctx, { x: 160, y: 1140, w: 400, h: 100, label: '出發', selected: G.shopSel === 4 });
    txt('↑↓ 選擇  Z 確定', CW / 2, 1100, 28, '#dddddd');
  } else if (ph === 'result') {
    Art.drawBackground(ctx, {});
    Art.drawResultPanel(ctx, { rep: G.rep, goldEarned: G.goldEarned, roster: G.roster, stars: G.stars });
    txt('按 Z 重來', CW / 2, 1180, 40, '#ffffff');
  }
  if (ph !== 'result') txt('H 說明', CW - 20, CH - 16, 22, '#cccccc', 'right', 'normal');
}

// ===================== 主迴圈 =====================
var lastTs = 0;
function frame(ts) {
  var dt = lastTs ? (ts - lastTs) / 1000 : 0;
  lastTs = ts;
  if (!(dt > 0)) dt = 0;
  if (dt > 1 / 30) dt = 1 / 30;
  try {
    update(dt);
    render();
  } catch (err) {
    console.error(err);
  }
  window.requestAnimationFrame(frame);
}

window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
window.addEventListener('blur', function () { held = {}; });
window.addEventListener('resize', resize);
resetAll();
G.phase = 'guide';
G.guideReturn = null;
resize();
window.requestAnimationFrame(frame);
})();
