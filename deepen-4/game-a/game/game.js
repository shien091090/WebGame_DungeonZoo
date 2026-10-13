(function () {
'use strict';

/* ===== 基本設定 ===== */
var CW = (window.Art && Art.canvas && Art.canvas.width) || 1280;
var CH = (window.Art && Art.canvas && Art.canvas.height) || 720;
var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var dpr = window.devicePixelRatio || 1;
canvas.width = Math.round(CW * dpr);
canvas.height = Math.round(CH * dpr);

var OX = 40, OY = 110;          // 地下城畫面偏移
var TAU = Math.PI * 2;
var MR = 28;                    // 地下城魔物身體半徑(武器判定用)
var TR = 18;                    // 馴獸師半徑
var DAYS = 7;
var ARENA = { x0: 100, x1: 1180, y0: 186, y1: 526 };
var CENTER = { x: 640, y: 356 };

/* ===== 工具 ===== */
function rnd(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function angDiff(a, b) { var d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function has(arr, x) { return arr.indexOf(x) >= 0; }

/* ===== 資料 ===== */
var SP_LIST = ['spore', 'frog', 'mole', 'tumble', 'butterfly', 'crab'];
var SPD = {
  spore:     { name: '菇菇球', hp: 7,  itv: 2.8, decay: 2,   pg: 2, pr: 1, kg: 3 },
  frog:      { name: '露水蛙', hp: 7,  itv: 2.6, decay: 3,   pg: 1, pr: 1, kg: 3 },
  mole:      { name: '鑽沙鼴', hp: 12, itv: 2.6, decay: 2.5, pg: 2, pr: 1, kg: 5 },
  tumble:    { name: '風滾草', hp: 12, itv: 2.4, decay: 2,   pg: 2, pr: 1, kg: 5 },
  butterfly: { name: '冰晶蝶', hp: 14, itv: 2.4, decay: 3,   pg: 3, pr: 2, kg: 7 },
  crab:      { name: '礦石蟹', hp: 20, itv: 2.8, decay: 1,   pg: 3, pr: 2, kg: 8 }
};
var NEST_SP = { s: 'spore', r: 'frog', m: 'mole', t: 'tumble', b: 'butterfly', c: 'crab' };
var DORDER = ['forest', 'dune', 'mine'];
var DUNGEONS = {
  forest: { name: '菇菇林', species: ['spore', 'frog'], map: [
    '####################',
    '#.......#..#.......#',
    '#.s...o.#..#.WW..r.#',
    '#.......#..#.WW....#',
    '#..o...............#',
    '#..............o...#',
    '#.......#..#.......#',
    '#.o...s.#..#..r..W.#',
    '#.......#.S#.....W.#',
    '####################'] },
  dune: { name: '沙丘巢', species: ['mole', 'tumble'], map: [
    '####################',
    '#.......#..#.......#',
    '#.m..L..#..#..t....#',
    '#...WW..#..#....o..#',
    '#.L................#',
    '#..............WW..#',
    '#..o....#..#.L.....#',
    '#.....m.#..#.....t.#',
    '#.......#.S#.......#',
    '####################'] },
  mine: { name: '冰晶礦坑', species: ['butterfly', 'crab'], map: [
    '####################',
    '#.......#..#.......#',
    '#.b..o..#..#.c...L.#',
    '#....L..#..#.......#',
    '#..W...............#',
    '#...............o..#',
    '#.o.....#..#..W....#',
    '#....b..#..#.L...c.#',
    '#.......#.S#.......#',
    '####################'] }
};
var UNLOCK = { dune: { gold: 60, sp: 'frog', n: 2 }, mine: { gold: 120, sp: 'tumble', n: 2 } };

var CARD_ORDER = ['provoke', 'chill', 'rally', 'encore', 'rampage', 'confetti', 'sprinkler', 'spin', 'balloon'];
var CARDS = {
  provoke:   { name: '激將',     desc: '點名的魔物大怒', t: true },
  chill:     { name: '冰鎮',     desc: '點名的魔物冷靜下來', t: true },
  rally:     { name: '集合',     desc: '全場其他魔物跑到點名的魔物身邊', t: true },
  encore:    { name: '安可',     desc: '點名的魔物連演 3 次', t: true },
  rampage:   { name: '橫衝直撞', desc: '點名的魔物一路撞開別隻', t: true, price: 30 },
  confetti:  { name: '彩帶砲',   desc: '彩帶砲轟向最擠的地方', t: false, price: 40 },
  sprinkler: { name: '灑水車',   desc: '灑水車沿最氣那隻的那一列開過去', t: false, price: 40 },
  spin:      { name: '旋轉舞台', desc: '舞台轉起來, 全場捲向中央', t: false, price: 50 },
  balloon:   { name: '抽獎氣球', desc: '三顆氣球隨機落下, 紅的點火藍的澆熄', t: false, price: 30 }
};
var SHOP_ITEMS = ['club', 'sword', 'spear', 'whip', 'attack', 'armor', 'ropeBag', 'rampage', 'confetti', 'sprinkler', 'spin', 'balloon'];
var WEAPONS = { club: 1, sword: 1, spear: 1, whip: 1 };
var UPS = { attack: 1, armor: 1, ropeBag: 1 };
var SHOW_POS = [{ x: 300, y: 260 }, { x: 980, y: 260 }, { x: 300, y: 460 }, { x: 980, y: 460 }];

var GUIDE_TITLES = ['地下城', '收服', '排節目', '紅區', '目標'];
var GUIDE_TEXTS = ['方向鍵走, Z 攻擊, X 武器技', '殘血時站上去, 再繞牠一圈', '排好節目表, 時間到就上演', '紅區最賺, 標記滿 5 個就失控', '7 天內賺到越多名聲越好'];

/* ===== 全域狀態 ===== */
var G, D, T, S;
var hazards = [];
var floats = [];
var keys = { l: false, r: false, u: false, d: false };
var zP = false, xP = false;

function newGame() {
  G = {
    phase: 'select', day: 1, gold: 30, rep: 0, goldEarned: 0, bestChain: 0,
    weapon: 'club', weapons: { club: true },
    roster: [{ sp: 'spore', level: 0 }, { sp: 'frog', level: 0 }],
    caps: { spore: 0, frog: 0, mole: 0, tumble: 0, butterfly: 0, crab: 0 },
    cards: { provoke: true, chill: true, rally: true, encore: true },
    ups: { attack: 0, armor: 0, ropeBag: 0 },
    price: { attack: 50, armor: 40, ropeBag: 40 },
    open: { forest: true, dune: false, mine: false },
    selD: 0, picks: {}, s1: { idx: 0, btn: false },
    slots: [], s2: { cur: 0, panel: null }, shopIdx: 0,
    guide: { page: 0, back: 'select' }
  };
  resetSlots();
  D = null; T = null; S = null; hazards = []; floats = [];
}
function resetSlots() { G.slots = []; for (var i = 0; i < 9; i++) G.slots.push({ card: '', target: '' }); }

function lvl(sp) { for (var i = 0; i < G.roster.length; i++) if (G.roster[i].sp === sp) return G.roster[i].level; return 0; }
function atkBonus() { return G.ups.attack; }
function maxHearts() { return 6 + G.ups.armor + lvl('crab'); }
function ropeMax() { return 3 + G.ups.ropeBag; }
function moveSpd() { return 300 + 25 * lvl('tumble'); }
function xCdMax() {
  var b = { sword: 3, spear: 1.2, whip: 1.2 }[G.weapon] || 0;
  return b * (1 - 0.15 * lvl('mole'));
}
function zRange() { return 1 + 0.1 * lvl('spore'); }
function ringDur() { return Math.max(0.35, 0.8 - 0.15 * lvl('frog')); }
function lassoLimit() { return 5 + lvl('butterfly'); }

function fl(x, y, text, kind) { floats.push({ x: x, y: y, text: text, kind: kind, t: 0, dur: 1 }); }
function gainGold(n) { G.gold += n; G.goldEarned += n; }

/* ===== 形狀判定 ===== */
function shapeHit(s, px, py, pr) {
  var dx = px - s.x, dy = py - s.y, d = Math.hypot(dx, dy);
  if (s.type === 'circle') return d <= s.radius + pr;
  if (s.type === 'arc') {
    if (d > s.radius + pr) return false;
    if (d <= pr) return true;
    var half = s.spread / 2 + Math.asin(Math.min(1, pr / d));
    return Math.abs(angDiff(Math.atan2(dy, dx), s.angle)) <= half;
  }
  var c = Math.cos(s.angle), sn = Math.sin(s.angle);
  var lx = dx * c + dy * sn, ly = -dx * sn + dy * c;
  return lx >= -pr && lx <= s.length + pr && Math.abs(ly) <= s.width / 2 + pr;
}

/* ===== 地圖 ===== */
function buildGrid(key) {
  var dd = DUNGEONS[key];
  if (dd.grid) return dd.grid;
  var grid = [], nests = [];
  for (var r = 0; r < 10; r++) {
    var row = [];
    for (var c = 0; c < 20; c++) {
      var ch = dd.map[r].charAt(c), kind = 'floor', nest = false;
      if (ch === '#') kind = 'wall'; else if (ch === 'o') kind = 'pillar';
      else if (ch === 'L') kind = 'hurt'; else if (ch === 'W') kind = 'slow';
      if (NEST_SP[ch]) { nest = true; nests.push({ sp: NEST_SP[ch], x: c * 60 + 30, y: r * 60 + 30 }); }
      var room = (c >= 1 && c <= 7) ? 'left' : ((c >= 12 && c <= 18) ? 'right' : 'hall');
      row.push({ kind: kind, room: room, nest: nest });
    }
    grid.push(row);
  }
  dd.grid = grid; dd.nestDefs = nests;
  return grid;
}
function tileAt(x, y) {
  var c = Math.floor(x / 60), r = Math.floor(y / 60);
  if (c < 0 || r < 0 || c > 19 || r > 9) return null;
  return D.grid[r][c];
}
function solidTile(c, r) {
  if (c < 0 || r < 0 || c > 19 || r > 9) return true;
  var k = D.grid[r][c].kind; return k === 'wall' || k === 'pillar';
}
function blocked(x, y, rad) {
  var c0 = Math.floor((x - rad) / 60), c1 = Math.floor((x + rad) / 60);
  var r0 = Math.floor((y - rad) / 60), r1 = Math.floor((y + rad) / 60);
  for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
    if (!solidTile(c, r)) continue;
    var nx = clamp(x, c * 60, c * 60 + 60), ny = clamp(y, r * 60, r * 60 + 60);
    if ((x - nx) * (x - nx) + (y - ny) * (y - ny) < rad * rad) return true;
  }
  return false;
}
function moveTamer(dx, dy) {
  var nx = T.x + dx;
  if (!blocked(nx, T.y, TR)) T.x = nx;
  var ny = T.y + dy;
  if (!blocked(T.x, ny, TR)) T.y = ny;
}
function roomB(m) {
  var left = DUNGEONS[D.key].species[0] === m.sp;
  return left ? { x0: 90, x1: 450, y0: 90, y1: 510 } : { x0: 750, x1: 1110, y0: 90, y1: 510 };
}

/* ===== 魔物共用移動 ===== */
function clampB(m, B) {
  var ox = m.x, oy = m.y;
  m.x = clamp(m.x, B.x0, B.x1); m.y = clamp(m.y, B.y0, B.y1);
  return ox !== m.x || oy !== m.y;
}
function moveBy(m, dx, dy, E) {
  m.x += dx; m.y += dy;
  if (dx < -0.001) m.dir = -1; else if (dx > 0.001) m.dir = 1;
  return clampB(m, E.b);
}
function wander(m, dt, E, spd) {
  m.wT -= dt;
  if (m.wT <= 0 || (!m.wdx && !m.wdy)) { var a = rnd(0, TAU); m.wdx = Math.cos(a); m.wdy = Math.sin(a); m.wT = rnd(2, 3); }
  if (moveBy(m, m.wdx * spd * dt, m.wdy * spd * dt, E)) m.wT = 0;
}
function chase(m, tg, spd, stop, dt, E) {
  var dx = tg.x - m.x, dy = tg.y - m.y, d = Math.hypot(dx, dy);
  if (d <= stop || d < 0.001) return;
  var st = Math.min(spd * dt, d);
  moveBy(m, dx / d * st, dy / d * st, E);
}
function validTgt(t, E) { return !!t && E.others.indexOf(t) >= 0; }
function farthest(m, arr) { var b = null, bd = -1; arr.forEach(function (o) { var d = dist(m, o); if (d > bd) { bd = d; b = o; } }); return b; }
function nearest(m, arr) { var b = null, bd = 1e9; arr.forEach(function (o) { var d = dist(m, o); if (d < bd) { bd = d; b = o; } }); return b; }
function clampPt(p, B) { p.x = clamp(p.x, B.x0, B.x1); p.y = clamp(p.y, B.y0, B.y1); return p; }

function popPoint(m, E) {
  var p, a = rnd(0, TAU);
  if (E.mode === 'd') {
    if (E.target) p = { x: E.target.x + Math.cos(a) * 60, y: E.target.y + Math.sin(a) * 60 };
    else {
      for (var i = 0; i < 20; i++) {
        p = { x: rnd(E.b.x0, E.b.x1), y: rnd(E.b.y0, E.b.y1) };
        if (!solidTile(Math.floor(p.x / 60), Math.floor(p.y / 60))) break;
      }
    }
  } else {
    var o = E.others.length ? pick(E.others) : null;
    p = o ? { x: o.x + Math.cos(a) * 60, y: o.y + Math.sin(a) * 60 } : { x: rnd(E.b.x0, E.b.x1), y: rnd(E.b.y0, E.b.y1) };
  }
  clampPt(p, E.b);
  m.x = p.x; m.y = p.y;
}

// E = { mode:'d'|'s', sm, b, target(地下城對象或 null), others(表演場) }
function stepMover(m, dt, E) {
  var sm = E.sm, tg, d, k;
  if (m.move === 'jump') {
    m.moveT += dt; k = Math.min(1, m.moveT / 0.4);
    m.x = m.jx0 + (m.jx1 - m.jx0) * k; m.y = m.jy0 + (m.jy1 - m.jy0) * k;
    if (m.moveT >= 0.4) { m.move = 'walk'; m.moveT = 0; m.moveDur = 0; }
    return;
  }
  if (m.move === 'burrow') {
    m.moveT += dt;
    if (m.moveT >= 1) { popPoint(m, E); m.move = 'walk'; m.moveT = 0; m.moveDur = 0; m.bT = 0; }
    return;
  }
  var wspd = (E.mode === 'd' ? 40 : 50) * sm;
  switch (m.sp) {
    case 'spore':
      if (E.mode === 'd') { if (E.target) chase(m, E.target, 45 * sm, 70, dt, E); else wander(m, dt, E, wspd); }
      else {
        m.tgtT -= dt;
        if (!validTgt(m.tgt, E) || m.tgtT <= 0) { m.tgt = E.others.length ? farthest(m, E.others) : null; m.tgtT = 3; }
        if (m.tgt) chase(m, m.tgt, 60, 0, dt, E); else wander(m, dt, E, wspd);
      }
      break;
    case 'frog':
      m.jT -= dt;
      tg = E.mode === 'd' ? E.target : (E.others.length ? pick(E.others) : null);
      if (!tg) { wander(m, dt, E, wspd); break; }
      if (m.jT <= 0) {
        var a = rnd(0, TAU), R = E.mode === 'd' ? 100 : 90;
        var to = clampPt({ x: tg.x + Math.cos(a) * R, y: tg.y + Math.sin(a) * R }, E.b);
        m.move = 'jump'; m.moveT = 0; m.moveDur = 0.4;
        m.jx0 = m.x; m.jy0 = m.y; m.jx1 = to.x; m.jy1 = to.y;
        m.dir = to.x < m.x ? -1 : 1; m.jT = 1.6 / sm;
      }
      break;
    case 'mole':
      m.bT += dt;
      if (m.bT >= 3) { m.move = 'burrow'; m.moveT = 0; m.moveDur = 1; }
      break;
    case 'tumble':
      m.move = 'roll';
      m.rT -= dt;
      if ((!m.vx && !m.vy) || m.rT <= 0) {
        tg = E.mode === 'd' ? E.target : (E.others.length ? pick(E.others) : null);
        var ra = tg ? Math.atan2(tg.y - m.y, tg.x - m.x) : rnd(0, TAU);
        m.vx = Math.cos(ra) * 120; m.vy = Math.sin(ra) * 120; m.rT = 3;
      }
      var nx = m.x + m.vx * sm * dt, ny = m.y + m.vy * sm * dt;
      if (nx < E.b.x0 || nx > E.b.x1) { m.vx = -m.vx; nx = clamp(nx, E.b.x0, E.b.x1); }
      if (ny < E.b.y0 || ny > E.b.y1) { m.vy = -m.vy; ny = clamp(ny, E.b.y0, E.b.y1); }
      m.x = nx; m.y = ny; if (m.vx) m.dir = m.vx < 0 ? -1 : 1;
      break;
    case 'butterfly':
      if (E.mode === 'd') tg = E.target;
      else {
        m.tgtT -= dt;
        if (!validTgt(m.tgt, E) || m.tgtT <= 0) { m.tgt = E.others.length ? pick(E.others) : null; m.tgtT = 4; }
        tg = m.tgt;
      }
      if (!tg) { wander(m, dt, E, wspd); break; }
      var cx = m.x - tg.x, cy = m.y - tg.y, dd = Math.hypot(cx, cy), ca;
      if (dd < 1) { ca = rnd(0, TAU); dd = 1; } else ca = Math.atan2(cy, cx);
      var tang = 90 * sm, rad = clamp((150 - dd) * 3, -90, 90) * sm;
      moveBy(m, (-Math.sin(ca) * tang + Math.cos(ca) * rad) * dt, (Math.cos(ca) * tang + Math.sin(ca) * rad) * dt, E);
      break;
    case 'crab':
      if (E.mode === 'd') tg = E.target;
      else {
        if (m.awayT > 0) {
          m.awayT -= dt;
          var lt = m.lastTouch;
          if (lt) { var ld = dist(m, lt) || 1; moveBy(m, (m.x - lt.x) / ld * 80 * dt, (m.y - lt.y) / ld * 80 * dt, E); }
          break;
        }
        if (!validTgt(m.tgt, E)) {
          m.tgt = null;
          var cs = E.others.filter(function (o) { return o !== m.lastTouch; });
          if (!cs.length) cs = E.others;
          if (cs.length) m.tgt = nearest(m, cs);
        }
        tg = m.tgt;
      }
      if (!tg) { wander(m, dt, E, wspd); break; }
      d = dist(m, tg);
      if (d <= 90) {
        if (E.mode === 's') { m.lastTouch = tg; m.tgt = null; if (E.others.length <= 1) m.awayT = 1; }
        break;
      }
      var ddx = tg.x - m.x, ddy = tg.y - m.y;
      if (Math.abs(ddx) > 20) moveBy(m, (ddx > 0 ? 1 : -1) * 80 * sm * dt, 0, E);
      else moveBy(m, 0, (ddy > 0 ? 1 : -1) * 50 * sm * dt, E);
      break;
  }
}

/* ===== 技能 / 危害物 ===== */
function mkHaz(sp, c, tx, ty, side, chain) {
  var a = (tx === c.x && ty === c.y) ? 0 : Math.atan2(ty - c.y, tx - c.x);
  var h = { side: side, owner: c, x: c.x, y: c.y, angle: 0, radius: 0, spread: 0, length: 0, width: 0,
    phase: 'warn', t: 0, dur: 0, act: 0, hits: [], hitT: false, reflected: false, chain: chain || 1, red: false, speed: 0, kind: '' };
  switch (sp) {
    case 'spore': h.kind = 'spore'; h.radius = 110; h.dur = 0.9; h.act = 0.5; break;
    case 'frog': h.kind = 'bubble'; h.phase = 'fly'; h.radius = 16; h.speed = 200; h.angle = a; h.dur = 0; break;
    case 'mole': h.kind = 'spikes'; h.angle = a; h.length = 320; h.width = 50; h.dur = 0.7; h.act = 0.3; break;
    case 'tumble': h.kind = 'whirl'; h.phase = 'fly'; h.radius = 30; h.speed = 180; h.angle = a; h.dur = 2.5; break;
    case 'butterfly': h.kind = 'frost'; h.radius = 140; h.dur = 0.6; h.act = 0.4; break;
    case 'crab': h.kind = 'claw'; h.angle = a; h.spread = 2.094; h.radius = 160; h.dur = 0.6; h.act = 0.3; break;
  }
  hazards.push(h);
  return h;
}
function hazShape(h) {
  if (h.kind === 'spore' || h.kind === 'frost') return { type: 'circle', x: h.x, y: h.y, radius: h.radius };
  if (h.kind === 'spikes') return { type: 'rect', x: h.x, y: h.y, angle: h.angle, length: h.length, width: h.width };
  return { type: 'arc', x: h.x, y: h.y, angle: h.angle, spread: h.spread, radius: h.radius };
}
function hazState(h, ox, oy) {
  return { x: h.x + ox, y: h.y + oy, kind: h.kind, phase: h.phase, radius: h.radius, angle: h.angle, spread: h.spread,
    length: h.length, width: h.width, t: h.t, dur: h.dur, reflected: h.reflected };
}
function cancelWarn(m) {
  for (var i = hazards.length - 1; i >= 0; i--) if (hazards[i].owner === m && hazards[i].phase === 'warn') hazards.splice(i, 1);
}

function updateHazards(dt) {
  for (var i = hazards.length - 1; i >= 0; i--) {
    var h = hazards[i], ended = false;
    if (h.phase === 'warn') {
      h.t += dt;
      if (h.t >= h.dur) { h.phase = 'active'; h.t = 0; h.dur = h.act; }
    } else if (h.phase === 'active') {
      if (h.side === 'd') areaDungeon(h); else areaShow(h);
      h.t += dt;
      if (h.t >= h.dur) ended = true;
    } else {
      h.x += Math.cos(h.angle) * h.speed * dt; h.y += Math.sin(h.angle) * h.speed * dt; h.t += dt;
      if (h.kind === 'whirl' && h.t >= 2.5) ended = true;
      else if (h.side === 'd') ended = flyDungeon(h);
      else ended = flyShow(h);
    }
    if (ended) {
      hazards.splice(i, 1);
      if (h.side === 's') payout(h);
    }
  }
}

/* ---- 地下城側 ---- */
function tamerValid() { return T.inv <= 0 && !T.dash; }
function areaDungeon(h) {
  if (h.hitT || !tamerValid()) return;
  if (shapeHit(hazShape(h), T.x, T.y, TR)) { h.hitT = true; hitTamer(h); }
}
function flyDungeon(h) {
  var tl = tileAt(h.x, h.y);
  if (!tl || tl.kind === 'wall' || tl.kind === 'pillar') return true;
  if (!h.reflected) {
    if (!h.hitT && tamerValid() && dist(h, T) <= h.radius + TR) {
      h.hitT = true; hitTamer(h);
      if (h.kind === 'bubble') return true;
    }
    return false;
  }
  for (var i = 0; i < D.mons.length; i++) {
    var m = D.mons[i];
    if (m.move === 'burrow' || m.lassoed) continue;
    if (dist(h, m) <= h.radius + MR) { damageWild(m, 3 + atkBonus()); return true; }
  }
  return false;
}
function hitTamer(h) {
  T.hearts -= 1; T.inv = 1.2;
  if (T.lasso) breakLasso();
  if (h.kind === 'whirl') T.knock = { ux: Math.cos(h.angle), uy: Math.sin(h.angle), t: 0, dur: 0.2, speed: 400 };
  if (T.hearts <= 0) D.over = true;
}
function breakLasso() {
  if (!T.lasso) return;
  T.lasso.m.lassoed = false; T.lasso = null;
}

/* ---- 表演場側 ---- */
function areaShow(h) {
  var sh = hazShape(h);
  S.mons.forEach(function (m) {
    if (m === h.owner || m.state !== 'normal' || m.move === 'burrow' || has(h.hits, m)) return;
    if (shapeHit(sh, m.x, m.y, 0)) hitShow(h, m);
  });
}
function flyShow(h) {
  if (h.x < 60 || h.x > 1220 || h.y < 146 || h.y > 566) return true;
  var done = false;
  for (var i = 0; i < S.mons.length; i++) {
    var m = S.mons[i];
    if (m === h.owner || m.state !== 'normal' || m.move === 'burrow' || has(h.hits, m)) continue;
    if (dist(h, m) <= h.radius) {
      hitShow(h, m);
      if (h.kind === 'bubble') { done = true; break; }
    }
  }
  return done;
}
function hitShow(h, m) {
  h.hits.push(m);
  switch (h.kind) {
    case 'spore': case 'spikes': case 'claw': applyRage(m, 15, 'skill', h.chain); break;
    case 'whirl':
      applyRage(m, 10, 'skill', h.chain);
      if (m.state === 'normal') startKnock(m, Math.cos(h.angle), Math.sin(h.angle), 80);
      break;
    case 'bubble': applyRage(m, -20, 'douse', h.chain); break;
    case 'frost': applyRage(m, -15, 'douse', h.chain); break;
  }
}
function startKnock(m, ux, uy, d) { m.knock = { ux: ux, uy: uy, t: 0, dur: 0.2, speed: d / 0.2 }; }

/* ===== 地下城 ===== */
function enterDungeon(key) {
  var dd = DUNGEONS[key];
  D = { key: key, grid: buildGrid(key), t: 0, mons: [], nests: [], fx: [], over: false };
  dd.nestDefs.forEach(function (n) { D.nests.push({ sp: n.sp, x: n.x, y: n.y, m: null, cd: 0 }); });
  hazards = []; floats = [];
  T = { x: 630, y: 510, facing: 0, hearts: maxHearts(), inv: 0, zCd: 0, xCd: 0, dash: null, knock: null, lasso: null, ring: null, ropes: ropeMax() };
  D.nests.forEach(spawnNest);
  zP = false; xP = false;
  G.phase = 'dungeon';
}
function spawnNest(n) {
  var sd = SPD[n.sp];
  var m = { sp: n.sp, nest: n, x: n.x, y: n.y, hp: sd.hp, max: sd.hp, hitT: 0, stunT: 0, lassoed: false, casting: false,
    move: 'walk', moveT: 0, moveDur: 0, dir: 1, cd: 0, wasIn: false, jT: rnd(0.3, 1.6), bT: rnd(0, 2), rT: 0, vx: 0, vy: 0,
    wT: 0, wdx: 0, wdy: 0, tgt: null, tgtT: 0, lastTouch: null, awayT: 0, knock: null, dead: false };
  n.m = m; n.cd = 0;
  D.mons.push(m);
}
function isWeak(m) { return m.hp <= m.max * 0.3; }
function wildItv(m) { return SPD[m.sp].itv * (isWeak(m) ? 1.5 : 1); }

function removeWild(m) {
  m.dead = true;
  var i = D.mons.indexOf(m); if (i >= 0) D.mons.splice(i, 1);
  cancelWarn(m);
  if (T.lasso && T.lasso.m === m) T.lasso = null;
  if (T.ring && T.ring.m === m) T.ring = null;
  m.nest.m = null; m.nest.cd = 8;
}
function damageWild(m, d) {
  if (m.dead || m.move === 'burrow' || m.lassoed) return;
  m.hp -= d; m.hitT = 0.1;
  if (T.ring && T.ring.m === m) T.ring.t = 0;
  if (m.hp <= 0) {
    var g = SPD[m.sp].kg; gainGold(g);
    fl(m.x + OX, m.y + OY - 40, '+' + g, 'gold');
    removeWild(m);
  }
}
function stunWild(m) {
  if (m.dead || m.move === 'burrow') return;
  m.stunT = 2; m.casting = false; cancelWarn(m);
}

function updateDungeon(dt) {
  D.t += dt;
  updateTamer(dt);
  D.mons.slice().forEach(function (m) { updateWild(m, dt); });
  D.nests.forEach(function (n) {
    if (!n.m) { n.cd -= dt; if (n.cd <= 0) spawnNest(n); }
  });
  updateHazards(dt);
  updateCapture(dt);
  D.mons.forEach(function (m) {
    m.casting = hazards.some(function (h) { return h.owner === m && h.phase === 'warn'; });
  });
  for (var i = D.fx.length - 1; i >= 0; i--) { D.fx[i].t += dt; if (D.fx[i].t >= D.fx[i].dur) D.fx.splice(i, 1); }
  updateFloats(dt);
  // 結束判定放在尾端(同一批事件都處理完)
  if (D.over || D.t >= 60) endDungeon();
}
function endDungeon() {
  breakLasso();
  hazards = []; floats = []; D.fx = [];
  G.phase = 'setup1'; G.picks = {}; G.s1 = { idx: 0, btn: false };
  zP = false; xP = false;
}

var FACE_TBL = { '0,-1': 0, '1,-1': 1, '1,0': 2, '1,1': 3, '0,1': 4, '-1,1': 5, '-1,0': 6, '-1,-1': 7 };
function faceAngle(f) { return (f - 2) * Math.PI / 4; }

function updateTamer(dt) {
  T.inv = Math.max(0, T.inv - dt); T.zCd -= dt; T.xCd -= dt;
  var dx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), dy = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
  if (T.dash) {
    var dsh = T.dash, step = 880 * dt;
    var px = T.x, py = T.y, nx = T.x + dsh.ux * step, ny = T.y + dsh.uy * step;
    if (blocked(nx, ny, TR)) dsh.t = dsh.dur;
    else { T.x = nx; T.y = ny; }
    D.mons.slice().forEach(function (m) {
      if (has(dsh.hit, m)) return;
      if (segDist(m.x, m.y, px, py, T.x, T.y) <= TR + MR) { dsh.hit.push(m); damageWild(m, 3 + atkBonus()); }
    });
    dsh.t += dt;
    if (dsh.t >= dsh.dur) T.dash = null;
  } else if (T.knock) {
    var k = T.knock;
    moveTamer(k.ux * k.speed * dt, k.uy * k.speed * dt);
    k.t += dt; if (k.t >= k.dur) T.knock = null;
  } else if (dx || dy) {
    var f = FACE_TBL[dx + ',' + dy]; if (f !== undefined) T.facing = f;
    var sp = moveSpd(), tl = tileAt(T.x, T.y);
    if (tl && tl.kind === 'slow') sp *= 0.5;
    var n = (dx && dy) ? 0.70710678 : 1;
    moveTamer(dx * n * sp * dt, dy * n * sp * dt);
  }
  // 傷害地形
  var tl2 = tileAt(T.x, T.y);
  if (tl2 && tl2.kind === 'hurt' && tamerValid()) hitTamer({ kind: 'tile', angle: 0 });
  // 攻擊
  if (zP && T.zCd <= 0 && !T.dash) attackZ();
  if (xP && T.xCd <= 0 && !T.dash && xCdMax() > 0) attackX();
  zP = false; xP = false;
}
function segDist(px, py, ax, ay, bx, by) {
  var vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy;
  var t = l2 > 0 ? clamp(((px - ax) * vx + (py - ay) * vy) / l2, 0, 1) : 0;
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
}
function pushFx(move, shape, ang, spread, radius, length, width, dur) {
  D.fx.push({ weapon: G.weapon, move: move, shape: shape, angle: ang, spread: spread, radius: radius, length: length, width: width, x: T.x, y: T.y, t: 0, dur: dur });
}
function hitMons(shape, dmg, cb) {
  D.mons.slice().forEach(function (m) {
    if (m.dead || m.move === 'burrow' || m.lassoed) return;
    if (shapeHit(shape, m.x, m.y, MR)) { if (dmg > 0) damageWild(m, dmg); if (cb && !m.dead) cb(m); }
  });
}
function attackZ() {
  var w = G.weapon, a = faceAngle(T.facing), b = zRange(), dmg, sh;
  if (w === 'club') {
    sh = { type: 'arc', x: T.x, y: T.y, angle: a, spread: 100 * Math.PI / 180, radius: 70 * b };
    pushFx('normal', 'arc', a, sh.spread, sh.radius, 0, 0, 0.2); T.zCd = 0.35;
    hitMons(sh, 2 + atkBonus());
  } else if (w === 'sword') {
    sh = { type: 'arc', x: T.x, y: T.y, angle: a, spread: 120 * Math.PI / 180, radius: 80 * b };
    pushFx('normal', 'arc', a, sh.spread, sh.radius, 0, 0, 0.2); T.zCd = 0.35;
    hitMons(sh, 2 + atkBonus());
    hazards.forEach(function (h) {
      if (h.side !== 'd' || h.phase !== 'fly' || h.reflected || (h.kind !== 'bubble' && h.kind !== 'whirl')) return;
      if (shapeHit(sh, h.x, h.y, h.radius)) {
        var o = h.owner, alive = o && !o.dead;
        h.angle = alive ? Math.atan2(o.y - T.y, o.x - T.x) : h.angle + Math.PI;
        h.speed *= 1.2; h.reflected = true; h.hits = []; h.hitT = false;
      }
    });
  } else if (w === 'spear') {
    sh = { type: 'rect', x: T.x, y: T.y, angle: a, length: 170 * b, width: 40 };
    pushFx('normal', 'line', a, 0, 0, sh.length, 40, 0.2); T.zCd = 0.45;
    hitMons(sh, 2 + atkBonus());
  } else {
    sh = { type: 'circle', x: T.x, y: T.y, radius: 100 * b };
    pushFx('normal', 'circle', a, 0, sh.radius, 0, 0, 0.2); T.zCd = 0.4;
    hitMons(sh, 1 + atkBonus());
  }
}
function attackX() {
  var w = G.weapon, a = faceAngle(T.facing), sh;
  if (w === 'sword') {
    sh = { type: 'arc', x: T.x, y: T.y, angle: a, spread: 120 * Math.PI / 180, radius: 80 };
    pushFx('skill', 'arc', a, sh.spread, 80, 0, 0, 0.2);
    hitMons(sh, 0, stunWild);
  } else if (w === 'spear') {
    T.dash = { t: 0, dur: 0.25, ux: Math.cos(a), uy: Math.sin(a), hit: [] };
    pushFx('skill', 'dash', a, 0, 0, 220, 0, 0.25);
  } else if (w === 'whip') {
    sh = { type: 'arc', x: T.x, y: T.y, angle: a, spread: 100 * Math.PI / 180, radius: 170 };
    pushFx('skill', 'arc', a, sh.spread, 170, 0, 0, 0.2);
    hitMons(sh, 2 + atkBonus(), function (m) {
      var dx = m.x - T.x, dy = m.y - T.y, d = Math.hypot(dx, dy) || 1;
      m.knock = { ux: dx / d, uy: dy / d, t: 0, dur: 0.25, speed: 160 / 0.25 };
    });
  }
  T.xCd = xCdMax();
}

function updateWild(m, dt) {
  if (m.hitT > 0) m.hitT -= dt;
  var B = roomB(m);
  if (m.knock) {
    var k = m.knock;
    m.x += k.ux * k.speed * dt; m.y += k.uy * k.speed * dt; clampB(m, B);
    k.t += dt; if (k.t >= k.dur) m.knock = null;
  }
  var d = dist(m, T), inR = d < 300;
  if (inR && !m.wasIn) m.cd = wildItv(m);
  m.wasIn = inR;
  var stunned = m.stunT > 0 || m.lassoed;
  if (m.stunT > 0) m.stunT -= dt;
  if (stunned) { m.casting = false; return; }
  if (!m.knock) {
    stepMover(m, dt, { mode: 'd', sm: isWeak(m) ? 0.5 : 1, b: B, target: inR ? T : null, others: null });
  }
  if (inR && m.move !== 'burrow') {
    m.dir = T.x < m.x ? -1 : 1;
    m.cd -= dt;
    if (m.cd <= 0) { mkHaz(m.sp, m, T.x, T.y, 'd', 1); m.cd = wildItv(m); }
  }
}

function updateCapture(dt) {
  if (T.lasso) {
    var L = T.lasso, m = L.m;
    L.t += dt;
    var dd = dist(m, T);
    if (dd >= 8) {
      var a = Math.atan2(T.y - m.y, T.x - m.x);
      L.sum += angDiff(a, L.prev); L.prev = a;
    }
    if (Math.abs(L.sum) >= TAU) { captureWild(m); return; }
    if (L.t >= L.limit || dd > 220) breakLasso();
    return;
  }
  var best = null, bd = 1e9;
  if (T.ropes > 0) {
    D.mons.forEach(function (m) {
      if (!isWeak(m) || m.move === 'burrow' || m.lassoed) return;
      var d = dist(m, T);
      if (d <= 40 && d < bd) { bd = d; best = m; }
    });
  }
  if (!best) { T.ring = null; return; }
  if (T.ring && T.ring.m === best) {
    T.ring.t += dt;
    if (T.ring.t >= ringDur()) {
      T.ring = null; best.lassoed = true; best.casting = false; cancelWarn(best);
      T.lasso = { m: best, t: 0, limit: lassoLimit(), sum: 0, prev: Math.atan2(T.y - best.y, T.x - best.x) };
    }
  } else T.ring = { m: best, t: 0 };
}
function captureWild(m) {
  var sp = m.sp;
  T.ropes -= 1;
  T.lasso = null; m.lassoed = false;
  fl(m.x + OX, m.y + OY - 40, '收服!', 'capture');
  G.caps[sp] += 1;
  var found = null;
  G.roster.forEach(function (r) { if (r.sp === sp) found = r; });
  if (!found) G.roster.push({ sp: sp, level: 0 });
  else if (found.level < 3) { found.level += 1; fl(m.x + OX, m.y + OY - 70, '等級 +1', 'levelUp'); }
  else { gainGold(20); fl(m.x + OX, m.y + OY - 70, '+20', 'coin20'); }
  removeWild(m);
}

function updateFloats(dt) {
  for (var i = floats.length - 1; i >= 0; i--) { floats[i].t += dt; if (floats[i].t >= floats[i].dur) floats.splice(i, 1); }
}

/* ===== 布置 ===== */
function lineup() { return G.roster.filter(function (r) { return G.picks[r.sp]; }); }
function pickedCount() { return lineup().length; }
function cardOptions() {
  var o = [];
  CARD_ORDER.forEach(function (k) { if (G.cards[k]) o.push({ type: 'card', key: k, name: CARDS[k].name, desc: CARDS[k].desc }); });
  o.push({ type: 'clear', key: 'clear', name: '清空', desc: '' });
  return o;
}
function targetOptions() {
  return lineup().map(function (r) { return { type: 'monster', key: r.sp, name: SPD[r.sp].name, desc: '' }; });
}
function placedCount() { return G.slots.filter(function (s) { return s.card; }).length; }

/* ===== 表演場 ===== */
function startShow() {
  var lu = lineup().slice(0, 4);
  S = { t: 0, mons: [], fired: [], done: [], rallies: [], spins: [], encores: [], dfx: [], cardFx: [], confT: 0,
    pairLast: {}, fence: { top: [], bottom: [] }, vis: { top: [], bottom: [] }, over: false };
  for (var i = 0; i < 9; i++) { S.fired.push(false); S.done.push(false); }
  for (i = 0; i < 8; i++) {
    S.fence.top.push(false); S.fence.bottom.push(false);
    S.vis.top.push({ mode: 'watch', t: 0 }); S.vis.bottom.push({ mode: 'watch', t: 0 });
  }
  lu.forEach(function (r, i) {
    var p = SHOW_POS[i];
    S.mons.push({ sp: r.sp, level: r.level, x: p.x, y: p.y, rage: 60, redLow: 80 - 5 * r.level, marks: 0, markT: 0, slow: false,
      state: 'normal', performing: false, performT: 0, perfCd: rnd(0.5, 2), fx: 'none', fxT: 0, chargeT: 0, looseT: 0,
      move: 'walk', moveT: 0, moveDur: 0, dir: 1, knock: null, ramp: null, relay: null, lastRelay: -99,
      jT: rnd(0.3, 1.6), bT: rnd(0, 2), rT: 0, vx: 0, vy: 0, wT: 0, wdx: 0, wdy: 0, tgt: null, tgtT: 0, lastTouch: null, awayT: 0,
      arrived: false, side: 'top', fi: 0, atkT: 0, runDir: 1 });
  });
  hazards = []; floats = [];
  G.phase = 'show';
}
function normalMons() { return S.mons.filter(function (m) { return m.state === 'normal'; }); }
function monOf(sp) { for (var i = 0; i < S.mons.length; i++) if (S.mons[i].sp === sp) return S.mons[i]; return null; }
function spinActive() { return S.spins.length > 0; }
function perfItv(m) { return m.rage < 50 ? 4 : 4 - (m.rage - 50) * 0.05; }

function applyRage(m, delta, kind, chain) {
  if (m.state !== 'normal') return;
  if (delta > 0) {
    if (kind === 'collide' && m.rage >= 100) return;
    if (m.marks > 0) {
      m.marks += 1; m.markT = 0; m.slow = false;
      if (m.marks >= 5) { goLoose(m); return; }
    } else {
      m.rage = Math.min(100, m.rage + delta);
      if (m.rage >= 100) { m.rage = 100; m.marks = 1; m.markT = 0; m.slow = false; }
    }
    m.fx = 'ignited'; m.fxT = 0;
    if (kind === 'skill') tryRelay(m, (chain || 1) + 1);
  } else {
    if (m.marks > 0) { m.marks -= 1; m.markT = 0; if (m.marks === 0) m.slow = true; }
    else m.rage = Math.max(0, m.rage + delta);
    m.fx = 'doused'; m.fxT = 0;
  }
}
function tryRelay(m, chain) {
  if (m.state === 'normal' && m.rage >= m.redLow && S.t - m.lastRelay >= 1.5 && !m.relay) m.relay = { t: 0.3, chain: chain };
}
function goLoose(m) {
  m.state = 'charge'; m.marks = 0; m.markT = 0; m.slow = false; m.ramp = null; m.relay = null; m.performing = false; m.performT = 0;
  m.move = 'walk'; m.moveT = 0; m.moveDur = 0; m.knock = null; m.chargeT = 0; m.arrived = false;
  m.side = m.y < 356 ? 'top' : 'bottom';
  m.fi = clamp(Math.round((m.x - 165) / 136), 0, 7);
}
function perform(m, chain) {
  m.performing = true; m.performT = 0; m.perfCd = perfItv(m);
  if (chain > G.bestChain) G.bestChain = chain;
  var others = S.mons.filter(function (o) { return o !== m && o.state === 'normal' && o.move !== 'burrow'; });
  var tg = others.length ? nearest(m, others) : CENTER;
  var h = mkHaz(m.sp, m, tg.x, tg.y, 's', chain);
  h.red = m.rage >= m.redLow;
}
function payout(h) {
  var m = h.owner, sd = SPD[m.sp], n = h.hits.length;
  var g = sd.pg * (1 + 0.5 * n) * (h.red ? 2 : 1) * (1 + 0.25 * (h.chain - 1)) * Math.min(3, 1 + G.rep / 200);
  g = Math.max(1, Math.round(g));
  gainGold(g); G.rep += sd.pr;
  var text = '+' + g;
  if (h.red) text += ' ×2';
  if (h.chain >= 2) text += ' 連鎖 ' + h.chain;
  fl(m.x, m.y - 60, text, h.chain >= 2 ? 'chain' : (h.red ? 'redGold' : 'gold'));
}

function updateShow(dt) {
  S.t += dt;
  // 發動節目卡
  for (var i = 0; i < 9; i++) if (!S.fired[i] && S.t >= 5 * i + 0.5) { S.fired[i] = true; fireCard(i); S.done[i] = true; }
  updateEffects(dt);
  S.mons.forEach(function (m) { updateShowMon(m, dt); });
  // 相撞挑釁
  var ms = S.mons;
  for (var a = 0; a < ms.length; a++) for (var b = a + 1; b < ms.length; b++) {
    var p = ms[a], q = ms[b];
    if (p.state !== 'normal' || q.state !== 'normal' || p.move === 'burrow' || q.move === 'burrow') continue;
    if (dist(p, q) > 80) continue;
    var key = a * 10 + b, last = S.pairLast[key];
    if (last !== undefined && S.t - last < 2) continue;
    S.pairLast[key] = S.t;
    applyRage(p, 8, 'collide'); applyRage(q, 8, 'collide');
  }
  updateHazards(dt);
  // 觀眾
  ['top', 'bottom'].forEach(function (sd) {
    S.vis[sd].forEach(function (v) {
      if (v.mode === 'watch') return;
      v.t += dt;
      if (v.t >= 4) { v.mode = 'watch'; v.t = 0; } else if (v.t >= 1) v.mode = 'empty';
    });
  });
  for (i = S.cardFx.length - 1; i >= 0; i--) { S.cardFx[i].t += dt; if (S.cardFx[i].t >= 0.8) S.cardFx.splice(i, 1); }
  if (S.confT > 0) S.confT -= dt;
  updateFloats(dt);
  if (S.t >= 45) endShow();
}
function endShow() {
  S.mons.forEach(function (m) { if (m.state !== 'normal') G.rep -= 5; });
  G.rep = Math.max(0, G.rep);
  hazards = []; floats = [];
  zP = false; xP = false;
  if (G.day >= DAYS) G.phase = 'result';
  else { G.phase = 'shop'; G.shopIdx = 0; }
}

function updateEffects(dt) {
  var i;
  // 集合
  for (i = S.rallies.length - 1; i >= 0; i--) {
    var r = S.rallies[i]; r.t -= dt;
    if (r.t <= 0 || r.tgt.state !== 'normal') S.rallies.splice(i, 1);
  }
  for (i = S.spins.length - 1; i >= 0; i--) { S.spins[i].t += dt; if (S.spins[i].t >= 3) S.spins.splice(i, 1); }
  // 安可
  for (i = S.encores.length - 1; i >= 0; i--) {
    var e = S.encores[i];
    if (e.m.state !== 'normal') { S.encores.splice(i, 1); continue; }
    e.t -= dt;
    if (e.t <= 0) {
      if (e.m.move !== 'burrow') perform(e.m, 1);
      e.n -= 1; e.t = 1;
      if (e.n <= 0) S.encores.splice(i, 1);
    }
  }
  // 裝置特效
  for (i = S.dfx.length - 1; i >= 0; i--) {
    var f = S.dfx[i];
    f.t += dt;
    if (f.kind === 'sprinkler') {
      f.x = 60 + 580 * Math.min(f.t, f.dur);
      S.mons.forEach(function (m) {
        if (m.state !== 'normal' || m.move === 'burrow' || has(f.sprayed, m)) return;
        if (Math.abs(f.x - m.x) <= 60 && Math.abs(m.y - f.y) <= 80) { f.sprayed.push(m); applyRage(m, -20, 'douse'); }
      });
    }
    if (f.t >= f.dur) {
      S.dfx.splice(i, 1);
      if (f.kind === 'confettiWarn') {
        S.dfx.push({ kind: 'confettiBurst', x: f.x, y: f.y, radius: 160, color: '', t: 0, dur: 0.3 });
        S.mons.forEach(function (m) {
          if (m.state === 'normal' && m.move !== 'burrow' && Math.hypot(m.x - f.x, m.y - f.y) <= 160) applyRage(m, 15, 'skill', 1);
        });
      } else if (f.kind === 'balloonWarn') {
        S.dfx.push({ kind: 'balloonBurst', x: f.x, y: f.y, radius: 110, color: f.color, t: 0, dur: 0.3 });
        S.mons.forEach(function (m) {
          if (m.state !== 'normal' || m.move === 'burrow' || Math.hypot(m.x - f.x, m.y - f.y) > 110) return;
          if (f.color === 'red') applyRage(m, 15, 'skill', 1); else applyRage(m, -15, 'douse');
        });
      }
    }
  }
}

function fireCard(i) {
  var s = G.slots[i], c = s.card;
  if (!c) return;
  var m = null;
  if (CARDS[c].t) {
    m = monOf(s.target);
    if (!m) return;
    if (m.state !== 'normal') { fl(m.x, m.y - 50, '沒反應', 'fizzle'); return; }
    S.cardFx.push({ card: c, m: m, t: 0 });
  } else S.cardFx.push({ card: c, m: null, t: 0 });
  switch (c) {
    case 'provoke': applyRage(m, 30, 'card'); break;
    case 'chill':
      m.marks = 0; m.markT = 0; m.slow = false; m.rage = Math.max(0, m.rage - 30); m.fx = 'doused'; m.fxT = 0; break;
    case 'rally': S.rallies.push({ tgt: m, t: 3 }); break;
    case 'encore':
      if (m.move !== 'burrow') perform(m, 1);
      S.encores.push({ m: m, n: 2, t: 1 }); break;
    case 'rampage': m.ramp = { t: 5, last: null }; break;
    case 'confetti': fireConfetti(); break;
    case 'sprinkler': fireSprinkler(); break;
    case 'spin': S.spins.push({ t: 0 }); break;
    case 'balloon': fireBalloon(); break;
  }
}
function fireConfetti() {
  var ns = normalMons(), best = null, bc = -1, br = -1;
  ns.forEach(function (m) {
    var cnt = 0;
    ns.forEach(function (o) { if (Math.hypot(o.x - m.x, o.y - m.y) <= 160) cnt++; });
    if (cnt > bc || (cnt === bc && (m.rage > br || (m.rage === br && Math.random() < 0.5)))) { bc = cnt; br = m.rage; best = m; }
  });
  var p = best ? { x: best.x, y: best.y } : { x: CENTER.x, y: CENTER.y };
  S.dfx.push({ kind: 'confettiWarn', x: p.x, y: p.y, radius: 160, color: '', t: 0, dur: 0.8 });
  S.confT = 0.5;
}
function fireSprinkler() {
  var ns = normalMons(), best = null;
  ns.forEach(function (m) {
    if (!best || m.rage > best.rage || (m.rage === best.rage && (m.marks > best.marks || (m.marks === best.marks && Math.random() < 0.5)))) best = m;
  });
  S.dfx.push({ kind: 'sprinkler', x: 60, y: best ? best.y : 356, radius: 80, color: '', t: 0, dur: 2, sprayed: [] });
}
function fireBalloon() {
  var pts = [], minD = 200, tries = 0;
  while (pts.length < 3) {
    var p = { x: rnd(ARENA.x0, ARENA.x1), y: rnd(ARENA.y0, ARENA.y1) };
    var ok = pts.every(function (q) { return Math.hypot(q.x - p.x, q.y - p.y) >= minD; });
    if (ok) pts.push(p); else if (++tries > 60) { tries = 0; minD -= 20; }
  }
  pts.forEach(function (q) {
    S.dfx.push({ kind: 'balloonWarn', x: q.x, y: q.y, radius: 110, color: Math.random() < 0.5 ? 'red' : 'blue', t: 0, dur: 1 });
  });
}

function showEnv(m) {
  return { mode: 's', sm: 1, b: ARENA, target: null,
    others: S.mons.filter(function (o) { return o !== m && o.state === 'normal' && o.move !== 'burrow'; }) };
}
function updateShowMon(m, dt) {
  if (m.fx !== 'none') { m.fxT += dt; if (m.fxT >= 0.5) { m.fx = 'none'; m.fxT = 0; } }
  if (m.performing) { m.performT += dt; if (m.performT >= 0.5) { m.performing = false; m.performT = 0; } }
  if (m.state === 'charge') { updateCharge(m, dt); return; }
  if (m.state === 'loose') { updateLoose(m, dt); return; }
  // 怒氣與標記
  if (m.marks > 0) {
    m.rage = 100; m.markT += dt;
    if (m.markT >= 4) { m.marks -= 1; m.markT = 0; if (m.marks === 0) m.slow = true; }
  } else if (m.slow) {
    m.rage -= 2 * dt;
    if (m.rage < m.redLow) m.slow = false;
  } else m.rage = Math.max(0, m.rage - SPD[m.sp].decay * dt);
  if (m.relay) {
    m.relay.t -= dt;
    if (m.relay.t <= 0) {
      var r = m.relay; m.relay = null;
      if (m.state === 'normal' && m.move !== 'burrow') { m.lastRelay = S.t; perform(m, r.chain); }
    }
  }
  if (m.move !== 'burrow' && m.rage >= 50 && m.state === 'normal') {
    m.perfCd -= dt;
    if (m.perfCd <= 0) perform(m, 1);
  }
  if (m.state === 'normal') moveShow(m, dt);
}
function rallyOf(m) {
  for (var i = 0; i < S.rallies.length; i++) if (S.rallies[i].tgt !== m) return S.rallies[i];
  return null;
}
function isHold(m) {
  for (var i = 0; i < S.rallies.length; i++) if (S.rallies[i].tgt === m) return true;
  return false;
}
function moveShow(m, dt) {
  var E = showEnv(m);
  if (m.ramp) { m.ramp.t -= dt; if (m.ramp.t <= 0) m.ramp = null; }
  var busy = m.move === 'jump' || m.move === 'burrow';
  var spin = spinActive();
  if (m.knock) {
    var k = m.knock;
    if (!spin && !busy) { m.x += k.ux * k.speed * dt; m.y += k.uy * k.speed * dt; clampB(m, ARENA); }
    k.t += dt; if (k.t >= k.dur) m.knock = null;
    if (!spin && !busy) return;
  }
  if (!busy) {
    if (spin) {
      var dx = m.x - CENTER.x, dy = m.y - CENTER.y, r = Math.hypot(dx, dy);
      var a = r < 1 ? rnd(0, TAU) : Math.atan2(dy, dx);
      a -= 50 * Math.PI / 180 * dt;
      if (r > 80) r = Math.max(80, r - 60 * dt);
      m.x = CENTER.x + Math.cos(a) * r; m.y = CENTER.y + Math.sin(a) * r; clampB(m, ARENA);
      m.move = 'walk'; return;
    }
    if (m.ramp) { rampMove(m, dt, E); return; }
    if (isHold(m)) { m.move = 'walk'; return; }
    var rl = rallyOf(m);
    if (rl) { m.move = 'walk'; chase(m, rl.tgt, 130, 80, dt, E); return; }
  }
  stepMover(m, dt, E);
}
function rampMove(m, dt, E) {
  m.move = 'walk';
  var cs = E.others.filter(function (o) { return o !== m.ramp.last; });
  if (!cs.length) cs = E.others;
  if (!cs.length) return;
  var tg = nearest(m, cs);
  if (dist(m, tg) <= 80) {
    var dx = tg.x - m.x, dy = tg.y - m.y, d = Math.hypot(dx, dy) || 1;
    var ux = d < 0.001 ? 1 : dx / d, uy = d < 0.001 ? 0 : dy / d;
    startKnock(tg, ux, uy, 100);
    applyRage(tg, 10, 'skill', 1);
    var key = Math.min(S.mons.indexOf(m), S.mons.indexOf(tg)) * 10 + Math.max(S.mons.indexOf(m), S.mons.indexOf(tg));
    S.pairLast[key] = S.t;
    m.ramp.last = tg;
    return;
  }
  chase(m, tg, 160, 0, dt, E);
}

function updateCharge(m, dt) {
  var fx = 165 + 136 * m.fi, ty = m.side === 'top' ? 160 : 552;
  if (!m.arrived) {
    var dx = fx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy);
    if (d <= 6) { m.arrived = true; m.x = fx; m.y = ty; }
    else { var st = Math.min(160 * dt, d); m.x += dx / d * st; m.y += dy / d * st; m.dir = dx < 0 ? -1 : 1; }
    m.chargeT = 0;
    if (m.arrived && S.fence[m.side][m.fi]) breakIn(m);
    return;
  }
  m.chargeT += dt;
  if (m.chargeT >= 1.5) { S.fence[m.side][m.fi] = true; breakIn(m); }
}
function breakIn(m) {
  S.fence[m.side][m.fi] = true;
  m.state = 'loose'; m.looseT = 0; m.chargeT = 0; m.atkT = 1.5;
  m.y = m.side === 'top' ? 95 : 622; m.runDir = Math.random() < 0.5 ? -1 : 1;
}
function updateLoose(m, dt) {
  m.looseT += dt;
  m.x += m.runDir * 140 * dt; m.dir = m.runDir;
  if (m.x < 110) { m.x = 110; m.runDir = 1; } else if (m.x > 1170) { m.x = 1170; m.runDir = -1; }
  m.atkT -= dt;
  if (m.atkT <= 0) {
    m.atkT = 1.5;
    var best = null, bd = 1e9, arr = S.vis[m.side];
    arr.forEach(function (v, i) {
      if (v.mode !== 'watch') return;
      var d = Math.abs(165 + 136 * i - m.x);
      if (d < bd) { bd = d; best = i; }
    });
    if (best !== null) {
      arr[best].mode = 'scared'; arr[best].t = 0;
      G.rep = Math.max(0, G.rep - 3);
      fl(165 + 136 * best, m.side === 'top' ? 95 : 622, '-3', 'repDown');
    }
  }
  if (m.looseT >= 6) {
    m.state = 'normal'; m.x = CENTER.x; m.y = CENTER.y; m.rage = 30; m.marks = 0; m.markT = 0; m.slow = false;
    m.perfCd = 1; m.looseT = 0; m.knock = null; m.move = 'walk';
  }
}
function modeOf(m) {
  if (m.state === 'charge') return 'charge';
  if (m.state === 'loose') return 'loose';
  if (spinActive()) return 'spin';
  if (m.knock) return 'knock';
  if (m.ramp) return 'rampage';
  if (isHold(m)) return 'hold';
  if (rallyOf(m)) return 'rally';
  return 'roam';
}

/* ===== 商店 ===== */
function shopCost(it) {
  if (UPS[it]) return G.price[it];
  if (WEAPONS[it]) return it === 'club' ? 0 : 60;
  return CARDS[it].price;
}
function shopOwned(it) {
  if (WEAPONS[it]) return !!G.weapons[it];
  if (CARDS[it]) return !!G.cards[it];
  return false;
}
function shopBuy() {
  var it = SHOP_ITEMS[G.shopIdx], cost = shopCost(it);
  if (UPS[it]) {
    if (G.gold < cost) return;
    G.gold -= cost; G.ups[it] += 1; G.price[it] = Math.round(G.price[it] * 1.5);
  } else if (WEAPONS[it]) {
    if (!G.weapons[it]) { if (G.gold < cost) return; G.gold -= cost; G.weapons[it] = true; }
    G.weapon = it;
  } else {
    if (G.cards[it] || G.gold < cost) return;
    G.gold -= cost; G.cards[it] = true;
  }
}

/* ===== 地下城選擇 ===== */
function dungeonCond(k) {
  var u = UNLOCK[k];
  if (!u) return '';
  return '金幣 ' + u.gold + ' + 收服' + SPD[u.sp].name + ' ' + Math.min(G.caps[u.sp], u.n) + '/' + u.n;
}
function dungeonCanOpen(k) { var u = UNLOCK[k]; return !!u && G.gold >= u.gold && G.caps[u.sp] >= u.n; }

/* ===== 輸入 ===== */
function keyName(e) {
  switch (e.code) {
    case 'ArrowLeft': return 'l'; case 'ArrowRight': return 'r'; case 'ArrowUp': return 'u'; case 'ArrowDown': return 'd';
    case 'KeyZ': return 'z'; case 'KeyX': return 'x';
  }
  switch (e.key) {
    case 'ArrowLeft': return 'l'; case 'ArrowRight': return 'r'; case 'ArrowUp': return 'u'; case 'ArrowDown': return 'd';
    case 'z': case 'Z': return 'z'; case 'x': case 'X': return 'x';
  }
  return null;
}
window.addEventListener('keydown', function (e) {
  var k = keyName(e);
  if (!k) return;
  e.preventDefault();
  if (e.repeat) return;
  if (k === 'l' || k === 'r' || k === 'u' || k === 'd') keys[k] = true;
  var before = G.phase;
  onPress(k);
  if (G.phase !== before) { zP = false; xP = false; }
});
window.addEventListener('keyup', function (e) {
  var k = keyName(e);
  if (!k) return;
  e.preventDefault();
  if (k === 'l' || k === 'r' || k === 'u' || k === 'd') keys[k] = false;
});
window.addEventListener('blur', function () { keys.l = keys.r = keys.u = keys.d = false; });

function openGuide() { G.guide = { page: 0, back: G.phase }; G.phase = 'guide'; }

function onPress(k) {
  var ph = G.phase, i;
  if (ph === 'guide') {
    var g = G.guide;
    if (k === 'z') { if (g.page < 4) g.page++; else G.phase = g.back; }
    else if (k === 'l') { if (g.page > 0) g.page--; }
  } else if (ph === 'select') {
    if (k === 'l') G.selD = Math.max(0, G.selD - 1);
    else if (k === 'r') G.selD = Math.min(2, G.selD + 1);
    else if (k === 'x') openGuide();
    else if (k === 'z') {
      var key = DORDER[G.selD];
      if (G.open[key]) enterDungeon(key);
      else if (dungeonCanOpen(key)) { G.gold -= UNLOCK[key].gold; G.open[key] = true; }
    }
  } else if (ph === 'dungeon') {
    if (k === 'z') zP = true; else if (k === 'x') xP = true;
  } else if (ph === 'setup1') {
    var s1 = G.s1;
    if (k === 'x') { openGuide(); return; }
    if (!s1.btn) {
      if (k === 'l') s1.idx = Math.max(0, s1.idx - 1);
      else if (k === 'r') s1.idx = Math.min(G.roster.length - 1, s1.idx + 1);
      else if (k === 'd') s1.btn = true;
      else if (k === 'z') {
        var sp = G.roster[s1.idx].sp;
        if (G.picks[sp]) delete G.picks[sp];
        else if (pickedCount() < 4) G.picks[sp] = true;
      }
    } else {
      if (k === 'u') s1.btn = false;
      else if (k === 'z' && pickedCount() >= 1) { resetSlots(); G.s2 = { cur: 0, panel: null }; G.phase = 'setup2'; }
    }
  } else if (ph === 'setup2') {
    setup2Press(k);
  } else if (ph === 'shop') {
    if (k === 'x') { openGuide(); return; }
    var idx = G.shopIdx;
    if (idx === 12) {
      if (k === 'u') G.shopIdx = 10;
      else if (k === 'z') { G.day += 1; G.phase = 'select'; }
    } else if (k === 'l') { if (idx % 3 > 0) G.shopIdx--; }
    else if (k === 'r') { if (idx % 3 < 2) G.shopIdx++; }
    else if (k === 'u') { if (idx >= 3) G.shopIdx -= 3; }
    else if (k === 'd') { if (idx < 9) G.shopIdx += 3; else G.shopIdx = 12; }
    else if (k === 'z') shopBuy();
  } else if (ph === 'result') {
    if (k === 'z') { newGame(); }
  }
}
function setup2Press(k) {
  var s2 = G.s2, p = s2.panel, i;
  if (!p) {
    if (s2.cur === 9) {
      if (k === 'u') s2.cur = 8;
      else if (k === 'z') startShow();
      else if (k === 'x') { resetSlots(); G.phase = 'setup1'; G.s1 = { idx: 0, btn: false }; }
    } else if (k === 'u') s2.cur = Math.max(0, s2.cur - 1);
    else if (k === 'd') s2.cur = Math.min(9, s2.cur + 1);
    else if (k === 'z') s2.panel = { layer: 'card', idx: 0, card: '' };
    else if (k === 'x') G.slots[s2.cur] = { card: '', target: '' };
    return;
  }
  var opts = p.layer === 'card' ? cardOptions() : targetOptions();
  if (k === 'u') p.idx = Math.max(0, p.idx - 1);
  else if (k === 'd') p.idx = Math.min(opts.length - 1, p.idx + 1);
  else if (k === 'x') {
    if (p.layer === 'target') { p.layer = 'card'; p.idx = 0; } else s2.panel = null;
  } else if (k === 'z') {
    var o = opts[p.idx];
    if (!o) return;
    if (p.layer === 'card') {
      if (o.type === 'clear') { G.slots[s2.cur] = { card: '', target: '' }; s2.panel = null; }
      else if (CARDS[o.key].t) { p.layer = 'target'; p.card = o.key; p.idx = 0; }
      else { G.slots[s2.cur] = { card: o.key, target: '' }; s2.panel = null; }
    } else {
      G.slots[s2.cur] = { card: p.card, target: o.key }; s2.panel = null;
    }
  }
}

/* ===== 繪製 ===== */
function hud(phase, msg) {
  var dun = phase === 'dungeon';
  return {
    phase: phase, day: G.day, dayMax: DAYS, gold: G.gold, rep: G.rep,
    hearts: dun ? T.hearts : 0, maxHearts: dun ? maxHearts() : 0, ropes: dun ? T.ropes : 0, ropeMax: dun ? ropeMax() : 0,
    weapon: G.weapon, xCdLeft: dun ? Math.max(0, T.xCd) : 0, xCdMax: dun ? xCdMax() : 0,
    timeLeft: dun ? Math.max(0, 60 - D.t) : (phase === 'show' ? Math.max(0, 45 - S.t) : 0),
    timeMax: dun ? 60 : (phase === 'show' ? 45 : 0),
    dungeon: dun ? D.key : '', message: msg
  };
}
function drawFloats() {
  floats.forEach(function (f) { Art.drawFloatText(ctx, { x: f.x, y: f.y, text: f.text, kind: f.kind, t: f.t, dur: f.dur }); });
}

function renderGuide() {
  var g = G.guide, p = g.page;
  Art.drawBackground(ctx, {});
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 40px sans-serif';
  ctx.fillText((p + 1) + '. ' + GUIDE_TITLES[p], 640, 90);
  Art.drawGuidePage(ctx, { page: p + 1, x: 140, y: 130, w: 1000, h: 400 });
  ctx.fillStyle = '#ffffff'; ctx.font = '32px sans-serif';
  ctx.fillText(GUIDE_TEXTS[p], 640, 590);
  ctx.fillStyle = '#cccccc'; ctx.font = '22px sans-serif';
  ctx.fillText(p < 4 ? '按 Z 繼續' : (g.first ? '按 Z 開始' : '按 Z 關閉'), 640, 660);
  if (p > 0) { ctx.textAlign = 'left'; ctx.fillText('← 上一頁', 60, 660); }
  ctx.textAlign = 'right'; ctx.fillText((p + 1) + ' / 5', 1220, 660);
  ctx.restore();
  Art.drawHud(ctx, hud('guide', 'Z 下一頁 ← 上一頁'));
}
function renderSelect() {
  Art.drawBackground(ctx, {});
  DORDER.forEach(function (k, i) {
    Art.drawDungeonCard(ctx, { x: 240 + 400 * i, y: 390, dungeon: k, open: G.open[k], condition: G.open[k] ? '' : dungeonCond(k), selected: G.selD === i });
  });
  Art.drawHud(ctx, hud('select', '←→ 選擇 Z 進入'));
}
function renderDungeon() {
  var r, c, i;
  Art.drawBackground(ctx, {});
  for (r = 0; r < 10; r++) for (c = 0; c < 20; c++) {
    var t = D.grid[r][c];
    Art.drawTile(ctx, { x: c * 60 + 30 + OX, y: r * 60 + 30 + OY, dungeon: D.key, kind: t.kind, room: t.room, nest: t.nest });
  }
  hazards.forEach(function (h) { if (h.phase !== 'fly') Art.drawHazard(ctx, hazState(h, OX, OY)); });
  if (T.ring) Art.drawCaptureRing(ctx, { x: T.ring.m.x + OX, y: T.ring.m.y + OY, t: T.ring.t, dur: ringDur() });
  D.mons.forEach(function (m) {
    Art.drawWildMonster(ctx, { x: m.x + OX, y: m.y + OY, species: m.sp, hp: m.hp, maxHp: m.max, hit: m.hitT > 0, weak: isWeak(m),
      stunLeft: Math.max(0, m.stunT), stunDur: 2, lassoed: m.lassoed, casting: m.casting, move: m.move, moveT: m.moveT, moveDur: m.moveDur, dir: m.dir });
  });
  if (T.lasso) {
    var L = T.lasso;
    Art.drawLasso(ctx, { x1: T.x + OX, y1: T.y + OY, x2: L.m.x + OX, y2: L.m.y + OY, progress: Math.min(1, Math.abs(L.sum) / TAU),
      t: L.t, limit: L.limit, len: dist(T, L.m), maxLen: 220 });
  }
  Art.drawTamer(ctx, { x: T.x + OX, y: T.y + OY, facing: T.facing, weapon: G.weapon, dashing: !!T.dash, blink: T.inv > 0, lassoing: !!T.lasso });
  D.fx.forEach(function (f) {
    Art.drawWeaponFx(ctx, { x: f.x + OX, y: f.y + OY, weapon: f.weapon, move: f.move, shape: f.shape, angle: f.angle, spread: f.spread,
      radius: f.radius, length: f.length, width: f.width, t: f.t, dur: f.dur });
  });
  hazards.forEach(function (h) { if (h.phase === 'fly') Art.drawHazard(ctx, hazState(h, OX, OY)); });
  drawFloats();
  var msg = T.lasso ? '繞牠一圈!' : (T.ring ? '站住別動' : 'Z 攻擊 X 武器技');
  Art.drawHud(ctx, hud('dungeon', msg));
}
function renderSetup1() {
  Art.drawBackground(ctx, {});
  G.roster.forEach(function (r, i) {
    Art.drawRosterCard(ctx, { x: 160 + 192 * i, y: 300, species: r.sp, level: r.level, picked: !!G.picks[r.sp], selected: !G.s1.btn && G.s1.idx === i });
  });
  Art.drawButton(ctx, { x: 540, y: 560, w: 200, h: 80, label: '下一步', selected: G.s1.btn });
  Art.drawHud(ctx, hud('setup1', '←→ 選 Z 上場/下場 ↓ 下一步'));
}
function renderSetup2() {
  var s2 = G.s2, p = s2.panel, i;
  Art.drawBackground(ctx, {});
  for (i = 0; i < 9; i++) {
    var sl = G.slots[i];
    Art.drawTimelineSlot(ctx, { x: 400, y: 90 + 60 * i, style: 'row', slot: i, card: sl.card, target: sl.target, selected: s2.cur === i, active: false, done: false });
  }
  Art.drawSetupInfo(ctx, { x: 990, y: 670, gold: G.gold, cards: placedCount() });
  Art.drawButton(ctx, { x: 300, y: 620, w: 200, h: 70, label: '開演', selected: s2.cur === 9 });
  var msg;
  if (p) {
    Art.drawPickerPanel(ctx, { layer: p.layer, options: p.layer === 'card' ? cardOptions() : targetOptions(), index: p.idx });
    msg = p.layer === 'card' ? '↑↓ 選 Z 確定 X 取消' : '↑↓ 選 Z 點名 X 回上一層';
  } else msg = s2.cur === 9 ? 'Z 開演 X 回上一步' : '↑↓ 選時段 Z 放卡 X 清空';
  Art.drawHud(ctx, hud('setup2', msg));
}
function renderShow() {
  var i;
  Art.drawShowArena(ctx, {});
  var own = G.cards;
  if (own.spin) {
    var sp = S.spins[0];
    Art.drawStageDevice(ctx, { x: 640, y: 356, device: 'spin', active: !!sp, t: sp ? sp.t : 0, dur: sp ? 3 : 0 });
  }
  S.dfx.forEach(function (f) { if (f.kind === 'confettiWarn') Art.drawDeviceFx(ctx, devFx(f)); });
  hazards.forEach(function (h) { Art.drawHazard(ctx, hazState(h, 0, 0)); });
  S.mons.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (m) {
    Art.drawShowMonster(ctx, {
      x: m.x, y: m.y, species: m.sp, level: m.level, rage: m.rage, redLow: m.redLow, marks: m.marks,
      markLeft: m.marks > 0 ? Math.max(0, 4 - m.markT) : 0, markDur: 4, mode: modeOf(m),
      performing: m.performing, performT: m.performT, performDur: 0.5, fx: m.fx, fxT: m.fxT, fxDur: 0.5,
      chargeT: m.state === 'charge' ? m.chargeT : 0, chargeDur: 1.5, looseT: m.state === 'loose' ? m.looseT : 0, looseDur: 6,
      move: m.move, moveT: m.moveT, moveDur: m.moveDur, dir: m.dir });
  });
  S.dfx.forEach(function (f) { if (f.kind !== 'confettiWarn') Art.drawDeviceFx(ctx, devFx(f)); });
  if (own.confetti) {
    var ca = S.confT > 0;
    Art.drawStageDevice(ctx, { x: 30, y: 200, device: 'confettiL', active: ca, t: ca ? 0.5 - S.confT : 0, dur: ca ? 0.5 : 0 });
    Art.drawStageDevice(ctx, { x: 1250, y: 200, device: 'confettiR', active: ca, t: ca ? 0.5 - S.confT : 0, dur: ca ? 0.5 : 0 });
  }
  if (own.sprinkler) {
    var sf = null;
    S.dfx.forEach(function (f) { if (f.kind === 'sprinkler') sf = f; });
    Art.drawStageDevice(ctx, { x: 30, y: 500, device: 'sprinkler', active: !!sf, t: sf ? sf.t : 0, dur: sf ? 2 : 0 });
  }
  S.cardFx.forEach(function (f) {
    Art.drawCardFx(ctx, { x: f.m ? f.m.x : 640, y: f.m ? f.m.y : 180, card: f.card, t: f.t, dur: 0.8 });
  });
  ['top', 'bottom'].forEach(function (sd) {
    for (i = 0; i < 8; i++) {
      Art.drawFence(ctx, { x: 165 + 136 * i, y: sd === 'top' ? 140 : 572, side: sd, broken: S.fence[sd][i] });
      Art.drawVisitor(ctx, { x: 165 + 136 * i, y: sd === 'top' ? 95 : 622, side: sd, mode: S.vis[sd][i].mode });
    }
  });
  var cur = Math.min(8, Math.floor(S.t / 5));
  for (i = 0; i < 9; i++) {
    var sl = G.slots[i];
    Art.drawTimelineSlot(ctx, { x: 75 + 141 * i, y: 691, style: 'mini', slot: i, card: sl.card, target: sl.target, selected: false, active: i === cur, done: S.done[i] });
  }
  drawFloats();
  Art.drawHud(ctx, hud('show', '表演中…'));
}
function devFx(f) { return { x: f.x, y: f.y, kind: f.kind, radius: f.radius, color: f.color, t: f.t, dur: f.dur }; }
function renderShop() {
  Art.drawBackground(ctx, {});
  SHOP_ITEMS.forEach(function (it, i) {
    var cost = shopCost(it);
    Art.drawShopItem(ctx, { x: 220 + 420 * (i % 3), y: 140 + 115 * Math.floor(i / 3), item: it, cost: cost,
      level: UPS[it] ? G.ups[it] : 0, owned: shopOwned(it), equipped: !!WEAPONS[it] && G.weapon === it,
      affordable: G.gold >= cost, selected: G.shopIdx === i });
  });
  Art.drawButton(ctx, { x: 540, y: 610, w: 200, h: 70, label: '出發', selected: G.shopIdx === 12 });
  Art.drawHud(ctx, hud('shop', '方向鍵選擇 Z 購買/裝備'));
}
function renderResult() {
  Art.drawBackground(ctx, {});
  var stars = G.rep >= 900 ? 3 : (G.rep >= 550 ? 2 : (G.rep >= 250 ? 1 : 0));
  Art.drawResultPanel(ctx, { rep: G.rep, goldEarned: G.goldEarned, bestChain: G.bestChain,
    roster: G.roster.map(function (r) { return { species: r.sp, level: r.level }; }), stars: stars });
  Art.drawHud(ctx, hud('result', 'Z 重來'));
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, CW, CH);
  switch (G.phase) {
    case 'guide': renderGuide(); break;
    case 'select': renderSelect(); break;
    case 'dungeon': renderDungeon(); break;
    case 'setup1': renderSetup1(); break;
    case 'setup2': renderSetup2(); break;
    case 'show': renderShow(); break;
    case 'shop': renderShop(); break;
    case 'result': renderResult(); break;
  }
}

/* ===== 主迴圈 ===== */
function update(dt) {
  if (G.phase === 'dungeon') updateDungeon(dt);
  else if (G.phase === 'show') updateShow(dt);
}
var lastTs = null, lastErr = '';
function frame(ts) {
  var dt = lastTs === null ? 0 : Math.min((ts - lastTs) / 1000, 1 / 30);
  lastTs = ts;
  try { update(dt); render(); }
  catch (err) {
    var s = String(err && err.stack || err);
    if (s !== lastErr) { lastErr = s; console.error(s); }
  }
  requestAnimationFrame(frame);
}

newGame();
G.phase = 'guide';
G.guide = { page: 0, back: 'select', first: true };
requestAnimationFrame(frame);

})();
