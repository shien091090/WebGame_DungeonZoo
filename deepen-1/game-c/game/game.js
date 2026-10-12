(function () {
'use strict';

// ===== 常數 =====
var W = Art.canvas.width, H = Art.canvas.height;
var TS = 60, COLS = 12, ROWS = 30;
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
  '#..o....o..#',
  '#..........#',
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
var NEST_SP = { t: 'thunder', g: 'stone', f: 'fire', j: 'water' };
var ROOMS = {
  crag: { r0: 1, r1: 5, cx: 360, cy: 210 },
  ruins: { r0: 7, r1: 11, cx: 360, cy: 570 },
  lava: { r0: 13, r1: 17, cx: 360, cy: 930 },
  pond: { r0: 19, r1: 23, cx: 360, cy: 1290 }
};
var SP = {
  fire: { hp: 10, interval: 2.4, whip: 25, decay: 4, gold: 5, rep: 1, zone: 'lava' },
  water: { hp: 7, interval: 1.6, whip: 20, decay: 6, gold: 3, rep: 1, zone: 'pond' },
  thunder: { hp: 12, interval: 2.6, whip: 40, decay: 8, gold: 7, rep: 2, zone: 'crag' },
  stone: { hp: 16, interval: 3, whip: 12, decay: 1, gold: 4, rep: 1, zone: 'ruins' }
};
var SPECIES = ['fire', 'water', 'thunder', 'stone'];
var ARENA = { x0: 60, x1: 660, y0: 270, y1: 1000 };
var SEAT_X = [110, 210, 310, 410, 510, 610];
var TOP_ROW_Y = 190, BOT_ROW_Y = 1080;
var ITEM_IDS = ['whipPower', 'ropeBag', 'armor', 'silverWhistle'];
var ITEM_BASE = { whipPower: 50, ropeBag: 40, armor: 40, silverWhistle: 50 };
var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';

var GUIDE = [
  { t: '地下城', lines: ['方向鍵走, Z 揮鞭, X 翻滾, C 彈反'] },
  { t: '收服', lines: ['殘血時揮鞭套住, 繞牠一圈'] },
  { t: '表演', lines: ['Z 讓牠生氣, X 讓牠冷靜'] },
  { t: '拿捏', lines: ['越氣越賺, 滿了就失控'] }
];

// ===== 畫布 =====
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
function fitCanvas() {
  var dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  var s = Math.min(window.innerWidth / W, window.innerHeight / H);
  if (!(s > 0)) s = 1;
  canvas.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

// ===== 狀態 =====
var G, T, phase, cardStage, guide;
var mons = [], nests = [], hazards = [], casts = [], effects = [], floats = [];
var stage = [], bench = [], fences = [], visitors = [];
var shopIdx = 0, monId = 1;
var held = { up: false, down: false, left: false, right: false };
var act = { z: false, x: false, c: false };

function rand(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function resetGame() {
  G = {
    day: 1, gold: 0, goldEarned: 0, rep: 0, bigCount: 0,
    hearts: 5, maxHearts: 5, ropes: 3, ropeMax: 3,
    whip: 2, whistleCdMax: 2,
    roster: ['fire'],
    timeLeft: 60, timeMax: 60,
    shop: {
      whipPower: { level: 0, cost: ITEM_BASE.whipPower },
      ropeBag: { level: 0, cost: ITEM_BASE.ropeBag },
      armor: { level: 0, cost: ITEM_BASE.armor },
      silverWhistle: { level: 0, cost: ITEM_BASE.silverWhistle }
    }
  };
  resetTamer(330, 1650);
  mons = []; nests = []; hazards = []; casts = []; effects = []; floats = [];
  stage = []; bench = [];
}
function resetTamer(x, y) {
  T = { x: x, y: y, facing: 0, rollT: 0, rollCd: 0, parryT: 0, parryCd: 0, whipCd: 0,
        whistleCd: 0, stunT: 0, invT: 0, lasso: null };
}
function rosterCount() {
  var o = { fire: 0, water: 0, thunder: 0, stone: 0 };
  for (var i = 0; i < G.roster.length; i++) o[G.roster[i]]++;
  return o;
}
function loseRep(n) { G.rep = Math.max(0, G.rep - n); }
function clearAct() { act.z = act.x = act.c = false; }

// ===== 地圖 =====
function ch(c, r) {
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return '#';
  return MAP[r].charAt(c);
}
function kindOf(c) {
  if (c === '#') return 'wall';
  if (c === 'o') return 'pillar';
  if (c === 'L') return 'lava';
  if (c === 'W') return 'water';
  return 'floor';
}
function zoneOf(c, r) {
  if (c < 1 || c > 10) return 'hall';
  for (var z in ROOMS) if (r >= ROOMS[z].r0 && r <= ROOMS[z].r1) return z;
  return 'hall';
}
function solid(c, r) { var k = ch(c, r); return k === '#' || k === 'o'; }
var roomBlockCache = {};
function roomBlock(zone) {
  if (!roomBlockCache[zone]) {
    var R = ROOMS[zone];
    roomBlockCache[zone] = function (c, r) {
      return solid(c, r) || c < 1 || c > 10 || r < R.r0 || r > R.r1;
    };
  }
  return roomBlockCache[zone];
}
function circleHits(x, y, rad, blocked) {
  var c0 = Math.floor((x - rad) / TS), c1 = Math.floor((x + rad) / TS);
  var r0 = Math.floor((y - rad) / TS), r1 = Math.floor((y + rad) / TS);
  for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
    if (!blocked(c, r)) continue;
    var nx = clamp(x, c * TS, c * TS + TS), ny = clamp(y, r * TS, r * TS + TS);
    var dx = x - nx, dy = y - ny;
    if (dx * dx + dy * dy < rad * rad) return true;
  }
  return false;
}
function moveBy(e, dx, dy, rad, blocked) {
  var hit = false;
  var nx = e.x + dx;
  if (!circleHits(nx, e.y, rad, blocked)) e.x = nx; else if (dx) hit = true;
  var ny = e.y + dy;
  if (!circleHits(e.x, ny, rad, blocked)) e.y = ny; else if (dy) hit = true;
  return hit;
}
function camY() { return clamp(T.y - 700, 0, 640); }

// ===== 浮字 / 特效 =====
function addFloat(x, y, text, kind, world) {
  floats.push({ x: x, y: y, text: text, kind: kind, t: 0, dur: 1, world: !!world });
}

// ===== 魔物習性 =====
function habit(m, dt, tx, ty, mover) {
  var dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
  m.dashing = false;
  switch (m.sp) {
    case 'fire':
      if (d > 80) mover(m, ux * 60 * dt, uy * 60 * dt);
      break;
    case 'water':
      if (d < 220) mover(m, -ux * 50 * dt, -uy * 50 * dt);
      else if (d > 320) mover(m, ux * 40 * dt, uy * 40 * dt);
      break;
    case 'thunder':
      if (m.dashT > 0) {
        m.dashT -= dt;
        mover(m, Math.cos(m.dashA) * 600 * dt, Math.sin(m.dashA) * 600 * dt);
        m.dashing = true;
        if (Math.abs(Math.cos(m.dashA)) > 0.1) m.dir = Math.cos(m.dashA) > 0 ? 1 : -1;
      } else {
        m.dashCd -= dt;
        if (m.dashCd <= 0) { m.dashCd = 2; m.dashT = 0.3; m.dashA = rand(0, Math.PI * 2); }
      }
      break;
    default: break;
  }
  if (m.sp !== 'thunder' && Math.abs(ux) > 0.1) m.dir = ux > 0 ? 1 : -1;
}

// ===== 技能 =====
function makeCast(m, big, isShow) {
  var c = { owner: m, sp: m.sp, big: big, hits: 0, pending: 0, fin: false,
            x: m.x, y: m.y, show: isShow, parried: false, hitSet: [] };
  if (isShow) casts.push(c);
  return c;
}
function castSkill(m, big, tx, ty, isShow) {
  var c = makeCast(m, big, isShow);
  var h;
  if (m.sp === 'fire') {
    h = newHaz(c, 'firering', m.x, m.y, big ? 180 : 120, 'warn', 0.5, big);
    m.castT = 0.5;
  } else if (m.sp === 'thunder') {
    h = newHaz(c, 'thunder', tx, ty, big ? 105 : 70, 'warn', 0.8, big);
    m.castT = 0.8;
  } else if (m.sp === 'stone') {
    h = newHaz(c, 'quake', m.x, m.y, 0, 'active', 1, big);
  } else {
    var n = big ? 5 : 3, spread = (big ? 15 : 20) * Math.PI / 180;
    var a0 = Math.atan2(ty - m.y, tx - m.x);
    for (var i = 0; i < n; i++) {
      h = newHaz(c, 'waterball', m.x, m.y, big ? 18 : 12, 'active', 0, big);
      h.angle = a0 + (i - (n - 1) / 2) * spread;
    }
  }
}
function newHaz(c, kind, x, y, radius, phase, dur, big) {
  var h = { cast: c, kind: kind, x: x, y: y, radius: radius, phase: phase, dur: dur,
            t: 0, big: !!big, angle: 0, hitTamer: false, judged: false };
  c.pending++;
  hazards.push(h);
  return h;
}
function ovl(h, px, py, pr) {
  var d = Math.hypot(px - h.x, py - h.y);
  if (h.kind === 'quake') return Math.abs(d - h.radius) <= (h.big ? 40 : 30) / 2 + pr;
  return d <= h.radius + pr;
}
function removeHaz(i) {
  var h = hazards[i];
  hazards.splice(i, 1);
  h.cast.pending--;
  if (h.cast.show && h.cast.pending <= 0) finalizeCast(h.cast);
}
function finalizeCast(c) {
  if (c.fin) return;
  c.fin = true;
  var k = casts.indexOf(c);
  if (k >= 0) casts.splice(k, 1);
  var s = SP[c.sp];
  var gold = Math.round(s.gold * (1 + 0.5 * c.hits) * (c.big ? 2 : 1) * (1 + G.rep / 100));
  G.gold += gold; G.goldEarned += gold;
  G.rep += s.rep;
  addFloat(c.x, c.y - 60, '+' + gold + (c.big ? ' 大招×2' : ''), c.big ? 'bigGold' : 'gold', false);
}
function applyHaz(h) {
  if (!h.hitTamer && ovl(h, T.x, T.y, 18)) {
    if (tamerHit(h)) h.hitTamer = true;
  }
  if (phase === 'show' && h.cast.show) {
    for (var i = 0; i < stage.length; i++) {
      var m = stage[i];
      if (m === h.cast.owner || m.mode !== 'roam') continue;
      if (h.cast.hitSet.indexOf(m) >= 0) continue;
      if (!ovl(h, m.x, m.y, 28)) continue;
      h.cast.hitSet.push(m);
      h.cast.hits++;
      if (h.kind === 'waterball') { setRage(m, m.rage - 20); m.fx = 'doused'; }
      else { setRage(m, m.rage + 15); m.fx = 'ignited'; }
      m.fxT = 0;
    }
  }
}
function updateHazards(dt) {
  for (var i = hazards.length - 1; i >= 0; i--) {
    var h = hazards[i];
    h.t += dt;
    var gone = false;
    if (h.kind === 'firering') {
      if (h.phase === 'warn' && h.t >= h.dur) { h.phase = 'active'; h.t -= h.dur; h.dur = 0.5; }
      if (h.phase === 'active') { applyHaz(h); if (h.t >= h.dur) gone = true; }
    } else if (h.kind === 'thunder') {
      if (h.phase === 'warn' && h.t >= h.dur) {
        h.phase = 'active'; h.t = 0; h.dur = 0.25;
        applyHaz(h); // 瞬間判定
      } else if (h.phase === 'active' && h.t >= h.dur) gone = true;
    } else if (h.kind === 'quake') {
      var maxR = h.big ? 330 : 220;
      h.radius = maxR * Math.min(1, h.t / 1);
      applyHaz(h);
      if (h.t >= 1) gone = true;
    } else {
      h.x += Math.cos(h.angle) * 300 * dt;
      h.y += Math.sin(h.angle) * 300 * dt;
      applyHaz(h);
      if (h.hitTamer || h.t > 4) gone = true;
      else if (phase === 'dungeon') {
        if (solid(Math.floor(h.x / TS), Math.floor(h.y / TS))) gone = true;
      } else if (h.x < ARENA.x0 || h.x > ARENA.x1 || h.y < ARENA.y0 || h.y > ARENA.y1) gone = true;
    }
    if (gone) removeHaz(i);
  }
}

// ===== 馴獸師受擊 =====
function tamerHit(src) {
  if (T.rollT > 0 || T.invT > 0 || T.stunT > 0) return false;
  if (src && T.parryT > 0) {
    effects.push({ type: 'parry', x: T.x, y: T.y, t: 0, dur: 0.25, follow: true });
    if (phase === 'dungeon') {
      var c = src.cast;
      if (!c.parried) {
        c.parried = true;
        var m = c.owner;
        if (mons.indexOf(m) >= 0) {
          if (m.hp > 1) m.hp = Math.max(1, m.hp - G.whip);
          m.hit = 0.15;
          m.weak = m.hp <= m.maxHp * 0.3;
        }
      }
    } else {
      addFloat(T.x, T.y - 50, '彈反', 'parry', false);
    }
    return true;
  }
  if (phase === 'dungeon') {
    G.hearts--; T.invT = 1;
    if (T.lasso) breakLasso();
  } else {
    T.stunT = 1.5;
    loseRep(2);
    addFloat(T.x, T.y - 50, '名聲 -2', 'repDown', false);
  }
  return true;
}

// ===== 地下城 =====
function spawnMon(n) {
  var s = SP[n.sp];
  var maxHp = Math.round(s.hp * (1 + 0.5 * (G.day - 1)));
  var m = { id: monId++, sp: n.sp, x: n.x, y: n.y, zone: s.zone, nest: n,
            hp: maxHp, maxHp: maxHp, hit: 0, weak: false, lassoed: false,
            castT: 0, castCd: rand(0.5, 1) * s.interval, dashT: 0, dashCd: rand(0.5, 2), dashA: 0,
            dashing: false, dir: 1, wDir: 0, wT: 0, wx: 0, wy: 0 };
  n.mon = m; n.timer = 0;
  mons.push(m);
}
function removeMon(m) {
  var i = mons.indexOf(m);
  if (i >= 0) mons.splice(i, 1);
  if (m.nest) { m.nest.mon = null; m.nest.timer = 8; }
}
function beginDungeon() {
  phase = 'dungeon';
  G.timeMax = 60; G.timeLeft = 60;
  G.hearts = G.maxHearts; G.ropes = G.ropeMax;
  resetTamer(330, 1650);
  mons = []; hazards = []; casts = []; effects = []; floats = [];
  nests = [];
  for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
    var k = MAP[r].charAt(c);
    if (NEST_SP[k]) {
      var n = { x: c * TS + 30, y: r * TS + 30, sp: NEST_SP[k], mon: null, timer: 0 };
      nests.push(n);
      spawnMon(n);
    }
  }
  clearAct();
}
function endDungeon() {
  hazards = []; casts = []; effects = []; floats = []; T.lasso = null;
  mons = [];
  cardStage = 'show';
  phase = 'title';
  clearAct();
}
function breakLasso() {
  if (T.lasso) { T.lasso.mon.lassoed = false; T.lasso = null; }
}
function dirIndex(dx, dy) {
  if (dx === 0 && dy < 0) return 0;
  if (dx > 0 && dy < 0) return 1;
  if (dx > 0 && dy === 0) return 2;
  if (dx > 0 && dy > 0) return 3;
  if (dx === 0 && dy > 0) return 4;
  if (dx < 0 && dy > 0) return 5;
  if (dx < 0 && dy === 0) return 6;
  return 7;
}
function facingVec(f) { return { x: Math.sin(f * Math.PI / 4), y: -Math.cos(f * Math.PI / 4) }; }

function tamerCommon(dt, blocked, speedMul) {
  var dx = (held.right ? 1 : 0) - (held.left ? 1 : 0);
  var dy = (held.down ? 1 : 0) - (held.up ? 1 : 0);
  if (dx || dy) T.facing = dirIndex(dx, dy);
  if (T.rollT > 0) {
    var fv = facingVec(T.facing);
    moveBy(T, fv.x * 800 * dt, fv.y * 800 * dt, 18, blocked);
  } else if (dx || dy) {
    var l = Math.hypot(dx, dy), sp = 320 * speedMul * dt;
    moveBy(T, dx / l * sp, dy / l * sp, 18, blocked);
  }
}
function tickTamerTimers(dt) {
  T.rollCd = Math.max(0, T.rollCd - dt);
  T.parryCd = Math.max(0, T.parryCd - dt);
  T.parryT = Math.max(0, T.parryT - dt);
  T.whipCd = Math.max(0, T.whipCd - dt);
  T.whistleCd = Math.max(0, T.whistleCd - dt);
  T.rollT = Math.max(0, T.rollT - dt);
  if (T.stunT > 0) { T.stunT -= dt; if (T.stunT <= 0) { T.stunT = 0; T.invT = 2; } }
  else T.invT = Math.max(0, T.invT - dt);
}
function dungeonWhip() {
  T.whipCd = 0.35;
  effects.push({ type: 'whip', shape: 'arc', x: T.x, y: T.y, facing: T.facing, radius: 110, t: 0, dur: 0.25 });
  var fv = facingVec(T.facing), fa = Math.atan2(fv.y, fv.x);
  var list = [];
  for (var i = 0; i < mons.length; i++) {
    var m = mons[i], d = dist(T, m);
    if (d > 110 + 25) continue;
    var diff = Math.atan2(m.y - T.y, m.x - T.x) - fa;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (d <= 40 || Math.abs(diff) <= Math.PI / 3) list.push({ m: m, d: d });
  }
  list.sort(function (a, b) { return a.d - b.d; });
  for (var j = 0; j < list.length; j++) {
    var mm = list[j].m;
    if (mm.weak && G.ropes > 0 && !T.lasso && !mm.lassoed) {
      mm.lassoed = true;
      var lasso = { mon: mm, sum: 0, last: Math.atan2(T.y - mm.y, T.x - mm.x), t: 0 };
      T.lasso = lasso;
    } else {
      mm.hp -= G.whip;
      mm.hit = 0.15;
      if (mm.hp <= 0) {
        G.gold += 4; G.goldEarned += 4;
        addFloat(mm.x, mm.y - 40, '+4', 'gold', true);
        if (T.lasso && T.lasso.mon === mm) T.lasso = null;
        removeMon(mm);
      } else mm.weak = mm.hp <= mm.maxHp * 0.3;
    }
  }
}
function updateLasso(dt) {
  var L = T.lasso;
  if (!L) return;
  var m = L.mon;
  L.t += dt;
  var d = dist(T, m);
  if (d > 1) {
    var ang = Math.atan2(T.y - m.y, T.x - m.x);
    var dd = ang - L.last;
    while (dd > Math.PI) dd -= Math.PI * 2;
    while (dd < -Math.PI) dd += Math.PI * 2;
    L.sum += dd; L.last = ang;
  }
  if (Math.abs(L.sum) / (Math.PI * 2) >= 1) {
    G.ropes--;
    G.roster.push(m.sp);
    addFloat(m.x, m.y - 40, '收服!', 'capture', true);
    T.lasso = null;
    removeMon(m);
    return;
  }
  if (L.t >= 5 || d > 220) breakLasso();
}
function updateDungeon(dt) {
  G.timeLeft -= dt;
  tickTamerTimers(dt);
  if (act.c && T.parryCd <= 0) { T.parryT = 0.2; T.parryCd = 0.6; }
  if (act.x && T.rollCd <= 0 && T.rollT <= 0) { T.rollT = 0.25; T.rollCd = 0.8; }
  if (act.z && T.rollT <= 0 && !T.lasso && T.whipCd <= 0) dungeonWhip();
  clearAct();
  var tc = Math.floor(T.x / TS), tr = Math.floor(T.y / TS);
  var inWater = ch(tc, tr) === 'W';
  tamerCommon(dt, solid, inWater ? 0.5 : 1);
  tc = Math.floor(T.x / TS); tr = Math.floor(T.y / TS);
  if (ch(tc, tr) === 'L') tamerHit(null);

  // 魔物
  var dmover = function (m, dx, dy) {
    var hit = moveBy(m, dx, dy, 24, roomBlock(m.zone));
    return hit;
  };
  for (var i = 0; i < mons.length; i++) {
    var m = mons[i];
    var s = SP[m.sp];
    m.hit = Math.max(0, m.hit - dt);
    if (m.castT > 0) m.castT = Math.max(0, m.castT - dt);
    var d = dist(T, m), near = d < 400;
    m.dashing = false;
    if (m.lassoed) {
      var R = ROOMS[m.zone], cx = R.cx - m.x, cy = R.cy - m.y, cd = Math.hypot(cx, cy);
      if (cd > 2) {
        var step = Math.min(40 * dt, cd);
        dmover(m, cx / cd * step, cy / cd * step);
      }
    } else if (near) {
      habit(m, dt, T.x, T.y, dmover);
    } else if (m.sp !== 'stone') {
      m.wT -= dt;
      if (m.wT <= 0) {
        var a = rand(0, Math.PI * 2);
        m.wx = Math.cos(a); m.wy = Math.sin(a); m.wT = rand(2, 3);
      }
      if (dmover(m, m.wx * 40 * dt, m.wy * 40 * dt)) m.wT = 0;
      if (Math.abs(m.wx) > 0.1) m.dir = m.wx > 0 ? 1 : -1;
    }
    if (near) {
      m.castCd -= dt;
      if (m.castCd <= 0 && m.castT <= 0) {
        castSkill(m, false, T.x, T.y, false);
        m.castCd = s.interval * (m.weak ? 1.5 : 1);
      }
    }
  }
  updateLasso(dt);
  updateHazards(dt);
  // 巢穴再生
  for (var k = 0; k < nests.length; k++) {
    var n = nests[k];
    if (!n.mon) { n.timer -= dt; if (n.timer <= 0) spawnMon(n); }
  }
  updateFx(dt);
  if (G.hearts <= 0 || G.timeLeft <= 0) { endDungeon(); }
}
function updateFx(dt) {
  var i;
  for (i = effects.length - 1; i >= 0; i--) {
    var e = effects[i];
    e.t += dt;
    if (e.follow) { e.x = T.x; e.y = T.y; }
    if (e.t >= e.dur) effects.splice(i, 1);
  }
  for (i = floats.length - 1; i >= 0; i--) {
    floats[i].t += dt;
    if (floats[i].t >= floats[i].dur) floats.splice(i, 1);
  }
}

// ===== 表演場 =====
function newShowMon(sp, entering) {
  return { id: monId++, sp: sp, x: 360, y: 635, rage: entering ? 50 : 20,
           mode: entering ? 'enter' : 'roam', perfCd: -1, perfFlash: 0, bigT: 0,
           fx: 'none', fxT: 0, dashT: 0, dashCd: rand(0.5, 2), dashA: 0, dashing: false,
           coolT: 0, enterT: 0, subdue: 0, chargeT: 0, dir: 1,
           tx: 0, ty: 0, fence: 0, side: 'top', looseDir: 1, atkT: 1.5 };
}
function beginShow() {
  phase = 'show';
  G.timeMax = 50; G.timeLeft = 50;
  resetTamer(360, 635);
  hazards = []; casts = []; effects = []; floats = [];
  stage = []; bench = [];
  var i;
  for (i = 0; i < G.roster.length; i++) {
    if (i < 4) stage.push(newShowMon(G.roster[i], false));
    else bench.push(G.roster[i]);
  }
  for (i = 0; i < stage.length; i++) {
    var m = stage[i], ok = false, tries = 0;
    while (!ok && tries++ < 60) {
      m.x = rand(120, 600); m.y = rand(330, 940);
      ok = Math.hypot(m.x - T.x, m.y - T.y) > 160;
      for (var j = 0; j < i && ok; j++) if (Math.hypot(m.x - stage[j].x, m.y - stage[j].y) < 110) ok = false;
    }
  }
  fences = [];
  visitors = [];
  for (i = 0; i < 12; i++) {
    fences.push(false);
    visitors.push({ seat: i, x: SEAT_X[i % 6], y: i < 6 ? TOP_ROW_Y : BOT_ROW_Y, timer: 0 });
  }
  clearAct();
}
function setRage(m, v) {
  m.rage = clamp(v, 0, 100);
  if (m.mode === 'roam' && m.rage >= 100) goLoose(m);
}
function goLoose(m) {
  m.mode = 'charge'; m.rage = 100; m.chargeT = 0; m.subdue = 0;
  m.perfCd = -1; m.coolT = 0; m.dashing = false;
  m.side = m.y < 635 ? 'top' : 'bottom';
  var seg = clamp(Math.floor((m.x - 60) / 100), 0, 5);
  m.fence = (m.side === 'top' ? 0 : 6) + seg;
  m.tx = SEAT_X[seg]; m.ty = m.side === 'top' ? ARENA.y0 + 20 : ARENA.y1 - 20;
  m.looseDir = Math.random() < 0.5 ? -1 : 1;
  m.atkT = 1.5;
}
function perfInterval(rage) {
  return 3 - 2 * (clamp(rage, 50, 99) - 50) / 49;
}
function swapOut(m) {
  var i = stage.indexOf(m);
  if (i < 0) return;
  var next = bench.length ? bench.shift() : null;
  stage.splice(i, 1);
  bench.push(m.sp);
  addFloat(m.x, m.y - 50, '下場', 'leave', false);
  if (next) {
    stage.push(newShowMon(next, true));
    addFloat(360, 585, '上場', 'enter', false);
  }
}
function showMover(m, dx, dy) {
  m.x = clamp(m.x + dx, ARENA.x0 + 35, ARENA.x1 - 35);
  m.y = clamp(m.y + dy, ARENA.y0 + 35, ARENA.y1 - 35);
}
function resolveSubdue(m) {
  fences[m.fence] = false;
  if (bench.length) { swapOut(m); }
  else {
    m.mode = 'roam'; m.x = 360; m.y = 635; m.rage = 30; m.subdue = 0;
    m.perfCd = -1; m.coolT = 0; m.chargeT = 0;
  }
}
function showWhip() {
  T.whipCd = 0.35;
  effects.push({ type: 'whip', shape: 'circle', x: T.x, y: T.y, facing: T.facing, radius: 110, t: 0, dur: 0.25 });
  for (var i = 0; i < stage.length; i++) {
    var m = stage[i];
    if (m.mode !== 'roam') continue;
    if (dist(T, m) <= 110 + 30) {
      setRage(m, m.rage + SP[m.sp].whip);
      m.fx = 'ignited'; m.fxT = 0;
    }
  }
}
function showWhistle() {
  T.whistleCd = G.whistleCdMax;
  effects.push({ type: 'whistle', x: T.x, y: T.y, radius: 140, t: 0, dur: 0.25 });
  var list = stage.slice();
  for (var i = 0; i < list.length; i++) {
    var m = list[i];
    if (dist(T, m) > 140 + 30) continue;
    if (m.mode === 'roam') {
      setRage(m, m.rage - 30);
      m.fx = 'calmed'; m.fxT = 0;
    } else if (m.mode === 'charge' || m.mode === 'loose') {
      m.subdue++;
      if (m.subdue >= 3) resolveSubdue(m);
    }
  }
}
function updateMonShow(m, dt) {
  var s = SP[m.sp];
  if (m.fx !== 'none') { m.fxT += dt; if (m.fxT >= 0.5) { m.fx = 'none'; m.fxT = 0; } }
  m.perfFlash = Math.max(0, m.perfFlash - dt);
  m.bigT = Math.max(0, m.bigT - dt);
  if (m.mode === 'enter') {
    m.enterT += dt; m.dashing = false;
    if (m.enterT >= 0.5) { m.mode = 'roam'; m.enterT = 0; }
    return;
  }
  if (m.mode === 'roam') {
    m.rage = Math.max(0, m.rage - s.decay * dt);
    habit(m, dt, T.x, T.y, showMover);
    if (m.rage >= 50) {
      m.coolT = 0;
      if (m.perfCd < 0) m.perfCd = perfInterval(m.rage);
      m.perfCd -= dt;
      if (m.perfCd <= 0) {
        var big = m.rage >= 80 && m.rage < 100;
        m.perfFlash = 0.5;
        if (big) { m.bigT = 0.8; G.bigCount++; }
        castSkill(m, big, T.x, T.y, true);
        m.perfCd = perfInterval(m.rage);
      }
    } else {
      m.perfCd = -1;
      m.coolT = Math.min(8, m.coolT + dt);
      if (m.coolT >= 8 && bench.length > 0) swapOut(m);
    }
  } else if (m.mode === 'charge') {
    m.dashing = false;
    var dx = m.tx - m.x, dy = m.ty - m.y, d = Math.hypot(dx, dy);
    if (d > 4) {
      var st = Math.min(160 * dt, d);
      m.x += dx / d * st; m.y += dy / d * st;
      if (Math.abs(dx) > 1) m.dir = dx > 0 ? 1 : -1;
      m.chargeT = 0;
    } else {
      m.chargeT += dt;
      if (m.chargeT >= 1.5) {
        fences[m.fence] = true;
        m.mode = 'loose'; m.chargeT = 0; m.atkT = 1.5;
      }
    }
  } else if (m.mode === 'loose') {
    var rowY = m.side === 'top' ? TOP_ROW_Y : BOT_ROW_Y;
    var ey = rowY - m.y;
    if (Math.abs(ey) > 2) m.y += Math.sign(ey) * Math.min(160 * dt, Math.abs(ey));
    m.x += m.looseDir * 140 * dt;
    if (m.x < SEAT_X[0]) { m.x = SEAT_X[0]; m.looseDir = 1; }
    if (m.x > SEAT_X[5]) { m.x = SEAT_X[5]; m.looseDir = -1; }
    m.dir = m.looseDir;
    m.atkT -= dt;
    if (m.atkT <= 0) {
      m.atkT = 1.5;
      var best = null, bd = 9999;
      for (var i = 0; i < visitors.length; i++) {
        var v = visitors[i];
        if (v.timer > 0 || (m.side === 'top') !== (v.seat < 6)) continue;
        var vd = Math.abs(v.x - m.x);
        if (vd < bd) { bd = vd; best = v; }
      }
      if (best && bd <= 100) {
        best.timer = 4;
        loseRep(3);
        addFloat(best.x, best.y, '名聲 -3', 'repDown', false);
      }
    }
  }
}
function updateShow(dt) {
  G.timeLeft -= dt;
  tickTamerTimers(dt);
  if (T.stunT <= 0) {
    if (act.c && T.parryCd <= 0) { T.parryT = 0.2; T.parryCd = 0.6; }
    if (act.z && T.whipCd <= 0) showWhip();
    if (act.x && T.whistleCd <= 0) showWhistle();
  }
  clearAct();
  var dx = (held.right ? 1 : 0) - (held.left ? 1 : 0);
  var dy = (held.down ? 1 : 0) - (held.up ? 1 : 0);
  if (dx || dy) {
    T.facing = dirIndex(dx, dy);
    var l = Math.hypot(dx, dy);
    T.x += dx / l * 320 * dt; T.y += dy / l * 320 * dt;
  }
  T.x = clamp(T.x, ARENA.x0 + 18, ARENA.x1 - 18);
  T.y = clamp(T.y, ARENA.y0 + 18, ARENA.y1 - 18);
  var list = stage.slice();
  for (var i = 0; i < list.length; i++) if (stage.indexOf(list[i]) >= 0) updateMonShow(list[i], dt);
  updateHazards(dt);
  for (var v = 0; v < visitors.length; v++) if (visitors[v].timer > 0) visitors[v].timer = Math.max(0, visitors[v].timer - dt);
  updateFx(dt);
  if (G.timeLeft <= 0) endShow();
}
function endShow() {
  var cs = casts.slice();
  for (var i = 0; i < cs.length; i++) finalizeCast(cs[i]);
  for (var j = 0; j < stage.length; j++) {
    if (stage[j].mode === 'charge' || stage[j].mode === 'loose') loseRep(5);
  }
  for (var f = 0; f < fences.length; f++) fences[f] = false;
  hazards = []; casts = []; effects = []; floats = [];
  stage = []; bench = [];
  clearAct();
  if (G.day >= 3) phase = 'result';
  else { phase = 'shop'; shopIdx = 0; }
}

// ===== 商店 =====
function itemAffordable(id) {
  if (id === 'silverWhistle' && G.whistleCdMax <= 0.8 + 1e-9) return false;
  return G.gold >= G.shop[id].cost;
}
function buyItem(id) {
  if (!itemAffordable(id)) return;
  var it = G.shop[id];
  G.gold -= it.cost;
  it.level++;
  it.cost = Math.round(it.cost * 1.5);
  if (id === 'whipPower') G.whip += 1;
  else if (id === 'ropeBag') G.ropeMax += 1;
  else if (id === 'armor') G.maxHearts += 1;
  else if (id === 'silverWhistle') G.whistleCdMax = Math.max(0.8, G.whistleCdMax - 0.4);
}

// ===== 輸入(只有鍵盤) =====
function keyOf(e) {
  switch (e.code) {
    case 'ArrowUp': return 'up';
    case 'ArrowDown': return 'down';
    case 'ArrowLeft': return 'left';
    case 'ArrowRight': return 'right';
    case 'KeyZ': return 'z';
    case 'KeyX': return 'x';
    case 'KeyC': return 'c';
    case 'KeyH': return 'h';
    case 'Escape': return 'esc';
    default: break;
  }
  switch (e.key) {
    case 'ArrowUp': return 'up';
    case 'ArrowDown': return 'down';
    case 'ArrowLeft': return 'left';
    case 'ArrowRight': return 'right';
    case 'z': case 'Z': return 'z';
    case 'x': case 'X': return 'x';
    case 'c': case 'C': return 'c';
    case 'h': case 'H': return 'h';
    default: return null;
  }
}
function startStage() {
  if (cardStage === 'dungeon') beginDungeon(); else beginShow();
}
function startDay() {
  cardStage = 'dungeon';
  phase = 'title';
  clearAct();
}
function openGuide(first) {
  guide = { open: true, page: 0, first: first };
  clearAct();
}
function guideKey(k) {
  if (k === 'z' || k === 'right') {
    if (guide.page < GUIDE.length - 1) guide.page++;
    else if (k === 'z') closeGuide();
  } else if (k === 'left') {
    if (guide.page > 0) guide.page--;
  } else if ((k === 'h' || k === 'esc') && !guide.first) {
    closeGuide();
  }
}
function closeGuide() {
  var first = guide.first;
  guide.open = false;
  clearAct();
  if (first) { resetGame(); startDay(); }
}
function onKeyDown(e) {
  var k = keyOf(e);
  if (!k) return;
  e.preventDefault();
  if (e.repeat) return;
  if (k === 'up' || k === 'down' || k === 'left' || k === 'right') held[k] = true;
  if (guide.open) { guideKey(k); return; }
  if (k === 'h') { openGuide(false); return; }
  switch (phase) {
    case 'title':
      if (k === 'z') startStage();
      break;
    case 'shop':
      if (k === 'up') shopIdx = Math.max(0, shopIdx - 1);
      else if (k === 'down') shopIdx = Math.min(4, shopIdx + 1);
      else if (k === 'z') {
        if (shopIdx < 4) buyItem(ITEM_IDS[shopIdx]);
        else { G.day++; startDay(); }
      }
      break;
    case 'result':
      if (k === 'z') { resetGame(); startDay(); }
      break;
    case 'dungeon':
      if (k === 'z') act.z = true; else if (k === 'x') act.x = true; else if (k === 'c') act.c = true;
      break;
    case 'show':
      if (k === 'z') act.z = true; else if (k === 'x') act.x = true; else if (k === 'c') act.c = true;
      break;
    default: break;
  }
  if (phase !== 'dungeon' && phase !== 'show') clearAct();
}
function onKeyUp(e) {
  var k = keyOf(e);
  if (!k) return;
  e.preventDefault();
  if (k === 'up' || k === 'down' || k === 'left' || k === 'right') held[k] = false;
}
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
window.addEventListener('blur', function () {
  held.up = held.down = held.left = held.right = false;
  clearAct();
});

// ===== 繪製 =====
function text(str, x, y, size, color, align) {
  ctx.font = 'bold ' + size + 'px ' + FONT;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color || '#fff';
  ctx.fillText(str, x, y);
}
function hudState() {
  var inD = phase === 'dungeon' || (phase === 'title' && cardStage === 'dungeon');
  var inS = phase === 'show' || (phase === 'title' && cardStage === 'show');
  var msg = '';
  if (phase === 'show') {
    for (var i = 0; i < stage.length; i++) if (stage[i].mode === 'charge' || stage[i].mode === 'loose') { msg = '追上去吹哨 3 次'; break; }
  }
  return {
    phase: guide.open ? 'guide' : phase, day: G.day, gold: G.gold, rep: G.rep,
    hearts: G.hearts, maxHearts: G.maxHearts, ropes: G.ropes, ropeMax: G.ropeMax,
    rosterCount: rosterCount(),
    timeLeft: (phase === 'dungeon' || phase === 'show') ? Math.max(0, G.timeLeft) : (inD ? 60 : (inS ? 50 : 0)),
    timeMax: inD ? 60 : (inS ? 50 : 0),
    message: msg,
    rollCd: T.rollCd, rollCdMax: 0.8, parryCd: T.parryCd, parryCdMax: 0.6,
    whistleCd: T.whistleCd, whistleCdMax: G.whistleCdMax
  };
}
function drawFloats(offY, world) {
  for (var i = 0; i < floats.length; i++) {
    var f = floats[i];
    var y = f.world ? f.y - offY + 120 : f.y;
    Art.drawFloatText(ctx, { x: f.x, y: y, text: f.text, kind: f.kind, t: f.t, dur: f.dur });
  }
}
function drawEffects(off, shift) {
  for (var i = 0; i < effects.length; i++) {
    var e = effects[i], y = shift ? e.y - off + 120 : e.y;
    if (e.type === 'whip') Art.drawWhipCrack(ctx, { x: e.x, y: y, shape: e.shape, facing: e.facing, radius: e.radius, t: e.t, dur: e.dur });
    else if (e.type === 'whistle') Art.drawWhistleWave(ctx, { x: e.x, y: y, radius: e.radius, t: e.t, dur: e.dur });
    else Art.drawParryFlash(ctx, { x: e.x, y: y, t: e.t, dur: e.dur });
  }
}
function drawTamerObj(sy) {
  Art.drawTamer(ctx, {
    x: T.x, y: sy, facing: T.facing, rolling: T.rollT > 0,
    parryLeft: T.parryT, parryDur: 0.2, stunLeft: T.stunT, stunDur: 1.5,
    blink: T.invT > 0, lassoing: !!T.lasso
  });
}
function drawHazards(offY, shift) {
  for (var i = 0; i < hazards.length; i++) {
    var h = hazards[i];
    Art.drawHazard(ctx, {
      x: h.x, y: shift ? h.y - offY + 120 : h.y, kind: h.kind, big: h.big, phase: h.phase,
      radius: h.radius, t: h.t, dur: h.dur, angle: h.angle
    });
  }
}
function renderDungeon() {
  var cam = camY();
  Art.drawBackground(ctx, {});
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 120, W, H - 120); ctx.clip();
  var r0 = Math.max(0, Math.floor(cam / TS)), r1 = Math.min(ROWS - 1, Math.floor((cam + 1160) / TS));
  for (var r = r0; r <= r1; r++) for (var c = 0; c < COLS; c++) {
    var k = MAP[r].charAt(c);
    Art.drawTile(ctx, { x: c * TS + 30, y: r * TS + 30 - cam + 120, kind: kindOf(k), zone: zoneOf(c, r), nest: !!NEST_SP[k] });
  }
  if (T.lasso) {
    var L = T.lasso;
    Art.drawLasso(ctx, {
      x1: T.x, y1: T.y - cam + 120, x2: L.mon.x, y2: L.mon.y - cam + 120,
      progress: Math.min(1, Math.abs(L.sum) / (Math.PI * 2)), t: L.t, limit: 5,
      len: dist(T, L.mon), maxLen: 220
    });
  }
  drawHazards(cam, true);
  for (var i = 0; i < mons.length; i++) {
    var m = mons[i];
    Art.drawWildMonster(ctx, {
      x: m.x, y: m.y - cam + 120, species: m.sp, hp: m.hp, maxHp: m.maxHp, hit: m.hit > 0,
      weak: m.weak, lassoed: m.lassoed, casting: m.castT > 0, dashing: m.dashing,
      dir: m.dir
    });
  }
  drawTamerObj(T.y - cam + 120);
  drawEffects(cam, true);
  drawFloats(cam);
  ctx.restore();
  Art.drawHud(ctx, hudState());
}
function renderShow() {
  Art.drawBackground(ctx, {});
  Art.drawShowArena(ctx, {});
  var i;
  for (i = 0; i < visitors.length; i++) {
    var v = visitors[i];
    var mode = v.timer <= 0 ? 'watch' : (v.timer > 3.4 ? 'scared' : 'empty');
    Art.drawVisitor(ctx, { x: v.x, y: v.y, seat: v.seat, mode: mode });
  }
  for (i = 0; i < fences.length; i++) {
    Art.drawFence(ctx, { x: SEAT_X[i % 6], y: i < 6 ? 255 : 1010, side: i < 6 ? 'top' : 'bottom', broken: fences[i] });
  }
  drawHazards(0, false);
  var sorted = stage.slice().sort(function (a, b) { return a.y - b.y; });
  for (i = 0; i < sorted.length; i++) {
    var m = sorted[i];
    Art.drawShowMonster(ctx, {
      x: m.x, y: m.y, species: m.sp, rage: m.rage, mode: m.mode, performing: m.perfFlash > 0,
      big: m.bigT > 0, fx: m.fx, fxT: m.fxT, fxDur: 0.5, dashing: m.dashing,
      coolT: m.coolT, coolDur: 8, enterT: m.enterT, enterDur: 0.5, subdue: m.subdue,
      chargeT: m.chargeT, chargeDur: 1.5, dir: m.dir
    });
  }
  drawTamerObj(T.y);
  drawEffects(0, false);
  drawFloats(0);
  var n = bench.length;
  for (i = 0; i < Math.min(n, 8); i++) {
    var more = 0, sp = bench[i];
    if (n > 8 && i === 7) { more = n - 7; sp = ''; }
    Art.drawBenchSlot(ctx, { x: 95 + 75 * i, y: 1215, species: sp, next: i === 0, more: more });
  }
  Art.drawHud(ctx, hudState());
}
function renderShop() {
  Art.drawBackground(ctx, {});
  Art.drawHud(ctx, hudState());
  for (var i = 0; i < 4; i++) {
    var id = ITEM_IDS[i];
    Art.drawShopItem(ctx, {
      x: 360, y: 300 + 160 * i, item: id, level: G.shop[id].level, cost: G.shop[id].cost,
      affordable: itemAffordable(id), selected: shopIdx === i
    });
  }
  Art.drawButton(ctx, { x: 160, y: 1140, w: 400, h: 100, label: '出發', selected: shopIdx === 4 });
  text('↑↓ 選擇  Z 確定', 360, 1262, 22, '#ddd');
}
function renderGuide() {
  var p = GUIDE[guide.page];
  Art.drawBackground(ctx, {});
  Art.drawHud(ctx, hudState());
  text(p.t, 360, 150, 44, '#ffe9a8');
  Art.drawGuidePage(ctx, { page: guide.page + 1, x: 40, y: 190, w: 640, h: 680 });
  for (var i = 0; i < p.lines.length; i++) text(p.lines[i], 360, 940 + i * 50, 34, '#fff');
  text((guide.page + 1) + ' / ' + GUIDE.length, 360, 1130, 26, '#ccc');
  var last = guide.page === GUIDE.length - 1;
  var hint = (last ? '按 Z ' + (guide.first ? '開始遊戲' : '回到遊戲') : '按 Z 繼續');
  if (guide.page > 0) hint = '← 上一頁    ' + hint;
  text(hint, 360, 1200, 26, '#ffe9a8');
}
function render() {
  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (guide.open) { renderGuide(); return; }
  switch (phase) {
    case 'dungeon': renderDungeon(); break;
    case 'show': renderShow(); break;
    case 'shop': renderShop(); break;
    case 'title':
      Art.drawBackground(ctx, {});
      Art.drawHud(ctx, hudState());
      Art.drawTitleCard(ctx, { day: G.day, stage: cardStage });
      text('按 Z 開始    H 說明', 360, 1220, 26, '#ffe9a8');
      break;
    case 'result':
      Art.drawBackground(ctx, {});
      Art.drawHud(ctx, hudState());
      Art.drawResultPanel(ctx, {
        rep: G.rep, goldEarned: G.goldEarned, bigCount: G.bigCount, rosterCount: rosterCount(),
        stars: G.rep >= 260 ? 3 : (G.rep >= 150 ? 2 : (G.rep >= 60 ? 1 : 0))
      });
      text('按 Z 重來', 360, 1220, 28, '#ffe9a8');
      break;
    default: break;
  }
}

// ===== 主迴圈 =====
var lastTs = null;
function frame(ts) {
  try {
    if (lastTs === null) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 1 / 30);
    lastTs = ts;
    if (!guide.open) {
      if (phase === 'dungeon') updateDungeon(dt);
      else if (phase === 'show') updateShow(dt);
    }
    render();
  } catch (err) {
    console.error(err);
  }
  requestAnimationFrame(frame);
}

resetGame();
phase = 'title'; cardStage = 'dungeon';
openGuide(true);
requestAnimationFrame(frame);
})();
