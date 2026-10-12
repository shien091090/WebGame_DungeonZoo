(function () {
'use strict';

var CW = Art.canvas.width, CH = Art.canvas.height;
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var dpr = window.devicePixelRatio || 1;
canvas.width = CW * dpr;
canvas.height = CH * dpr;

// ---------- 佔位(style 沒有的文字/提示, 集中在這) ----------
var Placeholder = {
  font: '"Microsoft JhengHei","PingFang TC",sans-serif',
  text: function (str, x, y, size, color, align, bold) {
    ctx.save();
    ctx.font = (bold ? 'bold ' : '') + size + 'px ' + Placeholder.font;
    ctx.fillStyle = color || '#fff';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.strokeText(str, x, y);
    ctx.fillText(str, x, y);
    ctx.restore();
  },
  shopHint: function () { Placeholder.text('↑↓ 選擇  空白 確定', CW / 2, 1262, 26, '#ddd'); },
  restartHint: function () { Placeholder.text('按空白鍵重來', CW / 2, 1200, 36, '#fff', 'center', true); }
};

// ---------- 常數 ----------
var MAP = [
  '############', '#..........#', '#.t......t.#', '#....oo....#', '#..........#', '#.g......g.#',
  '#..........#', '##...##...##', '#..........#', '#LL......WW#', '#L.f....j.W#', '#..........#',
  '#LL..f..j.W#', '#..........#', '##...##...##', '#..........#', '#..o....o..#', '#..........#',
  '#....S.....#', '#..........#', '#..........#', '############'];
var TS = 60, COLS = 12, ROWS = 22;
var SP_BY_CH = { t: 'thunder', g: 'stone', f: 'fire', j: 'water' };
var BASE_HP = { fire: 10, water: 7, thunder: 10, stone: 13 };
var ZONE_RECT = { // 世界座標 [x0,y0,x1,y1]
  thunder: [60, 60, 660, 240], stone: [60, 240, 660, 420],
  fire: [60, 480, 360, 840], water: [360, 480, 660, 840]
};
var SKILL = { fire: 'firering', water: 'waterball', thunder: 'thunder', stone: 'quake' };
var SKILL_INT = { fire: 2.4, water: 1.6, thunder: 2.6, stone: 3 };
var SPECIES = {
  fire:    { rate: 8,  flee: 150, fspd: 150, push: 1,   gold: 5, rep: 1 },
  water:   { rate: 6,  flee: 120, fspd: 110, push: 1.2, gold: 3, rep: 1 },
  thunder: { rate: 12, flee: 200, fspd: 220, push: 1,   gold: 7, rep: 2 },
  stone:   { rate: 4,  flee: 90,  fspd: 80,  push: 0.5, gold: 4, rep: 1 }
};
var SPEED = 300, TAMER_R = 18;
var POOL = { x: 360, y: 635, r: 110 };
var FIELD = { x0: 60, x1: 660, y0: 270, y1: 1000 };
var PLAY = { x0: 60, x1: 660, y0: 130, y1: 1140 };
var MON_PR = { firering: 0, thunder: 0, quake: 10, waterball: 25 };
var ITEM_DEF = [
  { item: 'longRope', base: 40 }, { item: 'ropeBag', base: 40 },
  { item: 'squeeze', base: 50 }, { item: 'loudBark', base: 50 }];
var GUIDE = [
  { title: '圍圈', text: '方向鍵走, 繩子繞一圈' },
  { title: '收服', text: '殘血時圈住才收服' },
  { title: '上舞台', text: '趕進舞台區, 牠就會生氣表演' },
  { title: '吠叫', text: '空白鍵吠叫, 推開魔物' },
  { title: '拿捏', text: '滿了會失控, 水池能消氣', sub: '地下城 → 牧場 → 商店, 三天後評星' }
];
var GUIDE_BOX = { x: 60, y: 250, w: 600, h: 560 };

// 地圖解析
var tiles = [], nests = [];
(function () {
  for (var r = 0; r < ROWS; r++) {
    tiles[r] = [];
    for (var c = 0; c < COLS; c++) {
      var ch = MAP[r].charAt(c), kind = 'floor', nest = false;
      if (ch === '#') kind = 'wall';
      else if (ch === 'o') kind = 'pillar';
      else if (ch === 'L') kind = 'lava';
      else if (ch === 'W') kind = 'water';
      if (SP_BY_CH[ch]) { nest = true; nests.push({ c: c, r: r, sp: SP_BY_CH[ch], mon: null, respawn: 0 }); }
      tiles[r][c] = { kind: kind, zone: zoneOf(c, r), nest: nest };
    }
  }
})();
function zoneOf(c, r) {
  if (r >= 1 && r <= 3 && c >= 1 && c <= 10) return 'crag';
  if (r >= 4 && r <= 6 && c >= 1 && c <= 10) return 'ruins';
  if (r >= 8 && r <= 13) { if (c >= 1 && c <= 5) return 'lava'; if (c >= 6 && c <= 10) return 'pond'; }
  return 'hall';
}
var START = { x: 5 * TS + 30, y: 18 * TS + 30 };

// ---------- 狀態 ----------
var phase = 'guide';         // guide | title | dungeon | show | shop | result
var titleStage = 'dungeon';
var guidePage = 0, guideOverlay = false;
var day = 1, gold = 0, rep = 0, goldEarned = 0;
var herd = [];
var up = {};                 // 升級
var shopSel = 0, shopItems = [];
var keys = { l: false, r: false, u: false, d: false };
var press = { space: false, up: false, down: false, left: false, right: false, help: false };

var tamer, rope, wilds, hazards, effects, floats, casts;
var hearts = 5, ropes = 3, dTime = 0, sTime = 0;
var camY = 0;
var showMons, visitors, barkCd, barkWaves;

function resetAll() {
  day = 1; gold = 0; rep = 0; goldEarned = 0;
  herd = ['fire', 'water'];
  up = { ropeMax: 900, ropeCount: 3, squeeze: 3, barkR: 180 };
  shopItems = ITEM_DEF.map(function (d) { return { item: d.item, level: 0, cost: d.base }; });
  shopSel = 0;
}
function newTamer(x, y) {
  return { x: x, y: y, facing: 4, stun: 0, inv: 0, bark: 0, acc: 0 };
}

// ---------- 通用 ----------
function rnd(a, b) { return a + Math.random() * (b - a); }
function dist(ax, ay, bx, by) { return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function tileAt(px, py) {
  var c = Math.floor(px / TS), r = Math.floor(py / TS);
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return null;
  return tiles[r][c];
}
function isSolidTile(c, r) {
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
  var k = tiles[r][c].kind;
  return k === 'wall' || k === 'pillar';
}
function hitsWall(x, y, rad) {
  var c0 = Math.floor((x - rad) / TS), c1 = Math.floor((x + rad) / TS);
  var r0 = Math.floor((y - rad) / TS), r1 = Math.floor((y + rad) / TS);
  for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
    if (!isSolidTile(c, r)) continue;
    var nx = clamp(x, c * TS, c * TS + TS), ny = clamp(y, r * TS, r * TS + TS);
    if ((x - nx) * (x - nx) + (y - ny) * (y - ny) < rad * rad) return true;
  }
  return false;
}
function inputVec() {
  var dx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), dy = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
  if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
  return { x: dx, y: dy };
}
function facingOf(dx, dy) {
  var sx = dx > 0.01 ? 1 : (dx < -0.01 ? -1 : 0), sy = dy > 0.01 ? 1 : (dy < -0.01 ? -1 : 0);
  if (sx === 0 && sy === -1) return 0;
  if (sx === 1 && sy === -1) return 1;
  if (sx === 1 && sy === 0) return 2;
  if (sx === 1 && sy === 1) return 3;
  if (sx === 0 && sy === 1) return 4;
  if (sx === -1 && sy === 1) return 5;
  if (sx === -1 && sy === 0) return 6;
  if (sx === -1 && sy === -1) return 7;
  return null;
}
function addFloat(x, y, text, kind) { floats.push({ x: x, y: y, text: text, kind: kind, t: 0 }); }
function addRep(v, x, y) {
  var before = rep;
  rep = Math.max(0, rep + v);
  var d = rep - before;
  if (d > 0) addFloat(x, y, '名聲+' + d, 'repUp');
  else if (d < 0) addFloat(x, y, '名聲' + d, 'repDown');
}
function stars() { return rep >= 260 ? 3 : (rep >= 150 ? 2 : (rep >= 60 ? 1 : 0)); }

// ---------- 流程 ----------
function startGame() { resetAll(); gotoTitle('dungeon'); }
function gotoTitle(stage) { phase = 'title'; titleStage = stage; floats = []; }

function startDungeon() {
  phase = 'dungeon';
  dTime = 0; hearts = 5; ropes = up.ropeCount;
  tamer = newTamer(START.x, START.y);
  rope = []; hazards = []; effects = []; floats = []; casts = [];
  wilds = [];
  for (var i = 0; i < nests.length; i++) { nests[i].mon = null; spawnWild(nests[i]); }
}
function spawnWild(n) {
  var mhp = Math.round(BASE_HP[n.sp] * (1 + 0.5 * (day - 1)));
  var m = {
    sp: n.sp, x: n.c * TS + 30, y: n.r * TS + 30, hp: mhp, maxHp: mhp, hitT: 0,
    cd: SKILL_INT[n.sp] * rnd(0.5, 1), castT: 0, ang: rnd(0, 6.28), wT: rnd(2, 3), dir: 1, nest: n
  };
  n.mon = m; n.respawn = 0;
  wilds.push(m);
}
function removeWild(m) {
  var i = wilds.indexOf(m); if (i >= 0) wilds.splice(i, 1);
  m.nest.mon = null; m.nest.respawn = 8;
}
function endDungeon() {
  hazards = []; casts = [];
  gotoTitle('show');
}

function startShow() {
  phase = 'show';
  sTime = 0; barkCd = 0; barkWaves = [];
  tamer = newTamer(360, 1000);
  hazards = []; floats = []; casts = [];
  showMons = [];
  for (var i = 0; i < herd.length; i++) {
    var x, y;
    do { x = rnd(110, 610); y = rnd(440, 830); } while (dist(x, y, POOL.x, POOL.y) < POOL.r + 40);
    showMons.push({
      sp: herd[i], x: x, y: y, rage: 20, vx: 0, vy: 0, pushT: 0, pushV0: 0, loose: false, daze: 0,
      ang: rnd(0, 6.28), wT: rnd(2, 3), perfCd: 3, perfT: 0, fxT: 0, fx: 'none', atkCd: 1.5, runDir: Math.random() < 0.5 ? -1 : 1,
      dir: 1, mode: 'roam'
    });
  }
  visitors = [];
  for (var s = 0; s < 12; s++) visitors.push({ seat: s, mode: 'watch', t: 0 });
}
function endShow() {
  for (var i = 0; i < showMons.length; i++) if (showMons[i].loose) addRep(-5, showMons[i].x, showMons[i].y);
  while (hazards.length) removeHazard(0);
  if (day >= 3) { phase = 'result'; }
  else { phase = 'shop'; shopSel = 0; floats = []; }
}

// ---------- 地下城 ----------
function segInt(a, b, c, d) {
  var rx = b.x - a.x, ry = b.y - a.y, sx = d.x - c.x, sy = d.y - c.y;
  var den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-9) return null;
  var qx = c.x - a.x, qy = c.y - a.y;
  var t = (qx * sy - qy * sx) / den, u = (qx * ry - qy * rx) / den;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return { x: a.x + t * rx, y: a.y + t * ry };
  return null;
}
function polyArea(p) {
  var s = 0;
  for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a.x * b.y - b.x * a.y; }
  return Math.abs(s) / 2;
}
function inPoly(x, y, p) {
  var inside = false;
  for (var i = 0, j = p.length - 1; i < p.length; j = i++) {
    if (((p[i].y > y) !== (p[j].y > y)) && (x < (p[j].x - p[i].x) * (y - p[i].y) / (p[j].y - p[i].y) + p[i].x)) inside = !inside;
  }
  return inside;
}
function ropeLength() {
  var len = 0, pts = rope;
  for (var i = 1; i < pts.length; i++) len += dist(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
  if (pts.length) len += dist(pts[pts.length - 1].x, pts[pts.length - 1].y, tamer.x, tamer.y);
  return len;
}
function hurtDungeon() {
  if (tamer.inv > 0) return false;
  hearts--; tamer.inv = 1;
  return true;
}
function moveTamerDungeon(dt) {
  var v = inputVec();
  var f = facingOf(v.x, v.y); if (f !== null) tamer.facing = f;
  if (!v.x && !v.y) return 0;
  var t = tileAt(tamer.x, tamer.y);
  var sp = SPEED * (t && t.kind === 'water' ? 0.5 : 1);
  var ox = tamer.x, oy = tamer.y;
  var nx = tamer.x + v.x * sp * dt;
  if (!hitsWall(nx, tamer.y, TAMER_R)) tamer.x = nx;
  var ny = tamer.y + v.y * sp * dt;
  if (!hitsWall(tamer.x, ny, TAMER_R)) tamer.y = ny;
  return dist(ox, oy, tamer.x, tamer.y);
}
function checkLoop() {
  var pts = rope.concat([{ x: tamer.x, y: tamer.y }]);
  var m = pts.length - 1;
  if (m < 5) return;
  for (var k = 0; k <= m - 5; k++) {
    var I = segInt(pts[m - 1], pts[m], pts[k], pts[k + 1]);
    if (!I) continue;
    var poly = [I];
    for (var j = k + 1; j <= m - 1; j++) poly.push(pts[j]);
    if (poly.length < 3 || polyArea(poly) < 6000) continue;
    resolveLoop(poly);
    return;
  }
}
function resolveLoop(poly) {
  var captured = false;
  var list = wilds.slice();
  for (var i = 0; i < list.length; i++) {
    var w = list[i];
    if (!inPoly(w.x, w.y, poly)) continue;
    var weak = w.hp <= w.maxHp * 0.3;
    if (weak && ropes > 0) {
      ropes--; herd.push(w.sp); captured = true;
      addFloat(w.x, w.y - 50, '收服!', 'capture');
      removeWild(w);
    } else {
      w.hp -= up.squeeze; w.hitT = 0.2;
      if (w.hp <= 0) {
        gold += 4; goldEarned += 4;
        addFloat(w.x, w.y - 50, '+4', 'gold');
        removeWild(w);
      }
    }
  }
  effects.push({ type: 'loop', poly: poly.map(function (p) { return { x: p.x, y: p.y }; }), captured: captured, t: 0 });
  rope = []; tamer.acc = 0;
}
function updateWild(m, dt) {
  m.hitT = Math.max(0, m.hitT - dt);
  m.castT = Math.max(0, m.castT - dt);
  var weak = m.hp <= m.maxHp * 0.3;
  // 走動
  m.wT -= dt;
  if (m.wT <= 0) { m.ang = rnd(0, 6.283); m.wT = rnd(2, 3); }
  var z = ZONE_RECT[m.sp], pad = 24;
  var nx = m.x + Math.cos(m.ang) * 60 * dt, ny = m.y + Math.sin(m.ang) * 60 * dt;
  if (nx < z[0] + pad || nx > z[2] - pad || ny < z[1] + pad || ny > z[3] - pad || hitsWall(nx, ny, 24)) {
    m.ang = m.ang + Math.PI + rnd(-0.8, 0.8); m.wT = rnd(2, 3);
  } else { m.x = nx; m.y = ny; }
  if (Math.cos(m.ang) > 0.1) m.dir = 1; else if (Math.cos(m.ang) < -0.1) m.dir = -1;
  // 施放
  var d = dist(m.x, m.y, tamer.x, tamer.y);
  if (d < 400) {
    m.cd -= dt;
    if (m.cd <= 0) {
      cast(m, null, { x: tamer.x, y: tamer.y }, 'dungeon');
      m.castT = m.sp === 'fire' ? 0.5 : (m.sp === 'thunder' ? 0.8 : 0.3);
      m.cd = SKILL_INT[m.sp] * (weak ? 1.5 : 1);
    }
  }
}

// ---------- 技能(地下城與牧場共用) ----------
function cast(owner, cobj, target, where) {
  var kind = SKILL[owner.sp];
  var base = { owner: owner, cast: cobj, hit: [] };
  var list = [];
  if (kind === 'firering') list.push({ kind: kind, x: owner.x, y: owner.y, phase: 'warn', t: 0, radius: 120, warnD: 0.5, actD: 0.5 });
  else if (kind === 'thunder') list.push({ kind: kind, x: target.x, y: target.y, phase: 'warn', t: 0, radius: 70, warnD: 0.8, actD: 0.3 });
  else if (kind === 'quake') list.push({ kind: kind, x: owner.x, y: owner.y, phase: 'active', t: 0, radius: 0, warnD: 0, actD: 1 });
  else {
    var a = Math.atan2(target.y - owner.y, target.x - owner.x), off = 10 * Math.PI / 180;
    for (var i = -1; i <= 1; i++) list.push({ kind: kind, x: owner.x, y: owner.y, phase: 'active', t: 0, radius: 12, angle: a + i * off, warnD: 0, actD: 0 });
  }
  for (var j = 0; j < list.length; j++) {
    var h = list[j];
    h.owner = owner; h.cast = cobj; h.hit = []; h.tamerHit = false; h.fresh = false;
    if (cobj) cobj.pending++;
    hazards.push(h);
  }
}
function inArea(h, px, py, pr) {
  var d = dist(px, py, h.x, h.y);
  if (h.kind === 'firering' || h.kind === 'thunder') return d <= h.radius + pr;
  if (h.kind === 'quake') return Math.abs(d - h.radius) <= 15 + pr;
  return d <= 12 + pr;
}
function removeHazard(i) {
  var h = hazards[i];
  hazards.splice(i, 1);
  if (h.cast) {
    h.cast.pending--;
    if (h.cast.pending <= 0) settleCast(h.cast);
  }
}
function settleCast(c) {
  var sp = SPECIES[c.sp];
  var g = Math.round(sp.gold * (1 + 0.5 * c.hits) * (1 + rep / 100));
  gold += g; goldEarned += g;
  addFloat(c.x, c.y - 60, '+' + g, 'gold');
  addRep(sp.rep, c.x + 30, c.y - 90);
}
// 回傳 true 表示水彈被消耗
function applyEffects(h) {
  var consumed = false;
  if (phase === 'dungeon') {
    if (inArea(h, tamer.x, tamer.y, TAMER_R) && !h.tamerHit) {
      if (hurtDungeon()) { h.tamerHit = true; if (h.kind === 'waterball') consumed = true; }
    }
    var idx = -1;
    for (var i = rope.length - 1; i >= 0; i--) if (inArea(h, rope[i].x, rope[i].y, 0)) { idx = i; break; }
    if (idx >= 0) {
      effects.push({ type: 'cut', x: rope[idx].x, y: rope[idx].y, t: 0 });
      rope.splice(0, idx + 1);
      if (h.kind === 'waterball') consumed = true;
    }
  } else if (phase === 'show') {
    if (tamer.inv <= 0 && inArea(h, tamer.x, tamer.y, TAMER_R)) {
      tamer.stun = 1.2; tamer.inv = 3.2;
      addRep(-2, tamer.x, tamer.y - 40);
      if (h.kind === 'waterball') consumed = true;
    }
    for (var k = 0; k < showMons.length; k++) {
      var m = showMons[k];
      if (m === h.owner || m.loose || h.hit.indexOf(m) >= 0) continue;
      if (!inArea(h, m.x, m.y, MON_PR[h.kind])) continue;
      h.hit.push(m);
      if (h.cast) h.cast.hits++;
      if (h.kind === 'waterball') { m.rage = Math.max(0, m.rage - 20); m.fx = 'doused'; }
      else { m.rage = Math.min(100, m.rage + 15); m.fx = 'ignited'; }
      m.fxT = 0.5;
    }
  }
  return consumed;
}
function updateHazards(dt) {
  for (var i = hazards.length - 1; i >= 0; i--) {
    var h = hazards[i], done = false;
    if (h.kind === 'waterball') {
      h.t += dt;
      h.x += Math.cos(h.angle) * 300 * dt; h.y += Math.sin(h.angle) * 300 * dt;
      if (phase === 'dungeon' && (isSolidTile(Math.floor(h.x / TS), Math.floor(h.y / TS)))) done = true;
      else if (phase === 'show' && (h.x < PLAY.x0 || h.x > PLAY.x1 || h.y < PLAY.y0 || h.y > PLAY.y1)) done = true;
      else done = applyEffects(h);
    } else if (h.kind === 'quake') {
      h.t += dt; h.radius = 220 * Math.min(h.t, 1);
      applyEffects(h);
      done = h.t >= 1;
    } else {
      h.t += dt;
      if (h.phase === 'warn' && h.t >= h.warnD) { h.phase = 'active'; h.t = 0; h.fresh = true; }
      if (h.phase === 'active') {
        if (h.kind === 'thunder') { if (h.fresh) applyEffects(h); }
        else applyEffects(h);
        h.fresh = false;
        if (h.t >= h.actD) done = true;
      }
    }
    if (done) removeHazard(i);
  }
}

function updateDungeon(dt) {
  dTime += dt;
  tamer.inv = Math.max(0, tamer.inv - dt);
  var moved = moveTamerDungeon(dt);
  var t = tileAt(tamer.x, tamer.y);
  if (t && t.kind === 'lava') hurtDungeon();
  if (moved > 0) {
    tamer.acc += moved;
    while (tamer.acc >= 12) { rope.push({ x: tamer.x, y: tamer.y }); tamer.acc -= 12; }
    while (rope.length && ropeLength() > up.ropeMax) rope.shift();
    checkLoop();
  }
  for (var i = 0; i < wilds.length; i++) updateWild(wilds[i], dt);
  updateHazards(dt);
  for (var n = 0; n < nests.length; n++) {
    if (!nests[n].mon) { nests[n].respawn -= dt; if (nests[n].respawn <= 0) spawnWild(nests[n]); }
  }
  for (var e = effects.length - 1; e >= 0; e--) { effects[e].t += dt; if (effects[e].t > 0.6) effects.splice(e, 1); }
  camY = clamp(tamer.y - 700, 0, 160);
  if (hearts <= 0 || dTime >= 60) endDungeon();
}

// ---------- 牧場 ----------
function inStageY(y) { return (y >= 270 && y <= 420) || (y >= 850 && y <= 1000); }
function bark() {
  if (tamer.stun > 0 || barkCd > 0) return;
  barkCd = 0.8; tamer.bark = 0.3;
  var R = up.barkR;
  barkWaves.push({ x: tamer.x, y: tamer.y, radius: R, t: 0 });
  for (var i = 0; i < showMons.length; i++) {
    var m = showMons[i];
    var d = dist(m.x, m.y, tamer.x, tamer.y);
    if (d > R) continue;
    var dx = m.x - tamer.x, dy = m.y - tamer.y;
    if (d < 1) { var a = rnd(0, 6.28); dx = Math.cos(a); dy = Math.sin(a); d = 1; }
    m.vx = dx / d; m.vy = dy / d; m.pushT = 0.4;
    if (m.loose) { m.pushV0 = 450 * 1.5; m.daze = 1; }
    else { m.pushV0 = 450 * SPECIES[m.sp].push; m.rage = Math.min(100, m.rage + 8); }
  }
}
function updateShowMon(m, dt) {
  var S = SPECIES[m.sp];
  m.fxT = Math.max(0, m.fxT - dt); if (m.fxT <= 0) m.fx = 'none';
  m.perfT = Math.max(0, m.perfT - dt);
  // 怒氣
  var inPool = dist(m.x, m.y, POOL.x, POOL.y) < POOL.r;
  var inStage = !inPool && m.y >= 270 && m.y <= 1000 && inStageY(m.y);
  var inField = m.y >= 270 && m.y <= 1000;
  var dr = 0;
  if (inStage) dr = S.rate; else if (inPool) dr = -25; else if (inField) dr = -3;
  m.rage = clamp(m.rage + dr * dt, 0, 100);
  if (!m.loose && m.rage >= 100) { m.loose = true; m.atkCd = 1.5; }
  else if (m.loose && m.rage < 60) { m.loose = false; m.perfCd = 3; }
  m.inStage = inStage;
  var ox = m.x;
  // 被推
  var pushing = m.pushT > 0;
  if (pushing) {
    var v = m.pushV0 * (m.pushT / 0.4);
    m.x += m.vx * v * dt; m.y += m.vy * v * dt;
    m.pushT = Math.max(0, m.pushT - dt);
  }
  if (m.loose) {
    if (m.daze > 0) { m.daze -= dt; m.mode = 'dazed'; }
    else if (!pushing) {
      var inStand = m.y < 270 || m.y > 1000;
      if (inStand) {
        m.mode = 'loose';
        var rowY = m.y < 635 ? 190 : 1080;
        m.y += clamp(rowY - m.y, -160 * dt, 160 * dt);
        m.x += m.runDir * 140 * dt;
        if (m.x > 630) { m.x = 630; m.runDir = -1; }
        if (m.x < 90) { m.x = 90; m.runDir = 1; }
      } else if (inPool) {
        m.mode = 'loose';
      } else {
        m.mode = 'charge';
        m.y += (m.y < 635 ? -1 : 1) * 160 * dt;
      }
    }
    // 攻擊觀眾
    if (m.y < 270 || m.y > 1000) {
      m.atkCd -= dt;
      if (m.atkCd <= 0) {
        var best = null, bd = 90;
        for (var i = 0; i < visitors.length; i++) {
          var vs = visitors[i]; if (vs.mode !== 'watch') continue;
          var p = seatPos(vs.seat), d = dist(m.x, m.y, p.x, p.y);
          if (d < bd) { bd = d; best = vs; }
        }
        if (best) { best.mode = 'scared'; best.t = 0; addRep(-3, m.x, m.y - 50); m.atkCd = 1.5; }
        else m.atkCd = 0.3;
      }
    } else m.atkCd = Math.max(m.atkCd, 0.5);
    m.x = clamp(m.x, PLAY.x0, PLAY.x1); m.y = clamp(m.y, PLAY.y0, PLAY.y1);
  } else {
    var dT = dist(m.x, m.y, tamer.x, tamer.y);
    if (pushing) m.mode = 'pushed';
    else if (dT < S.flee) {
      m.mode = 'flee';
      var ux = (m.x - tamer.x) / (dT || 1), uy = (m.y - tamer.y) / (dT || 1);
      if (dT < 1) { ux = Math.cos(m.ang); uy = Math.sin(m.ang); }
      m.x += ux * S.fspd * dt; m.y += uy * S.fspd * dt;
    } else {
      m.mode = 'roam';
      m.wT -= dt;
      if (m.wT <= 0) { m.ang = rnd(0, 6.283); m.wT = rnd(2, 3); }
      m.x += Math.cos(m.ang) * 40 * dt; m.y += Math.sin(m.ang) * 40 * dt;
    }
    var cx = clamp(m.x, FIELD.x0, FIELD.x1), cy = clamp(m.y, FIELD.y0, FIELD.y1);
    if (m.mode === 'roam' && (cx !== m.x || cy !== m.y)) {
      m.ang = Math.atan2(635 - cy, 360 - cx) + rnd(-0.8, 0.8); m.wT = rnd(2, 3);
    }
    m.x = cx; m.y = cy;
    // 表演
    if (m.inStage && m.rage >= 50) {
      var interval = clamp(3 - 2 * (m.rage - 50) / 49, 1, 3);
      m.perfCd -= dt;
      if (m.perfCd <= 0) {
        var c = { sp: m.sp, hits: 0, pending: 0, x: m.x, y: m.y };
        casts.push(c);
        cast(m, c, { x: tamer.x, y: tamer.y }, 'show');
        m.perfT = 0.5; m.perfCd = interval;
      }
    } else m.perfCd = clamp(3 - 2 * (m.rage - 50) / 49, 1, 3);
  }
  if (m.x - ox > 0.01) m.dir = 1; else if (m.x - ox < -0.01) m.dir = -1;
}
function seatPos(s) {
  return { x: 110 + (s % 6) * 100, y: s < 6 ? 190 : 1080 };
}
function updateShow(dt) {
  sTime += dt;
  barkCd = Math.max(0, barkCd - dt);
  tamer.inv = Math.max(0, tamer.inv - dt);
  tamer.bark = Math.max(0, tamer.bark - dt);
  tamer.stun = Math.max(0, tamer.stun - dt);
  if (press.space) bark();
  if (tamer.stun <= 0) {
    var v = inputVec();
    var f = facingOf(v.x, v.y); if (f !== null) tamer.facing = f;
    tamer.x = clamp(tamer.x + v.x * SPEED * dt, PLAY.x0, PLAY.x1);
    tamer.y = clamp(tamer.y + v.y * SPEED * dt, PLAY.y0, PLAY.y1);
  }
  for (var i = 0; i < showMons.length; i++) updateShowMon(showMons[i], dt);
  updateHazards(dt);
  for (var w = barkWaves.length - 1; w >= 0; w--) { barkWaves[w].t += dt; if (barkWaves[w].t > 0.4) barkWaves.splice(w, 1); }
  for (var q = 0; q < visitors.length; q++) {
    var vs = visitors[q];
    if (vs.mode === 'watch') continue;
    vs.t += dt;
    if (vs.t >= 4) { vs.mode = 'watch'; vs.t = 0; }
    else if (vs.t >= 0.8) vs.mode = 'empty';
  }
  if (sTime >= 50) endShow();
}

// ---------- 商店 / 結算 ----------
function shopBuy() {
  if (shopSel === 4) { day++; gotoTitle('dungeon'); return; }
  var it = shopItems[shopSel];
  if (gold < it.cost) return;
  gold -= it.cost;
  it.level++; it.cost = Math.round(it.cost * 1.5);
  if (it.item === 'longRope') up.ropeMax += 250;
  else if (it.item === 'ropeBag') up.ropeCount += 1;
  else if (it.item === 'squeeze') up.squeeze += 1;
  else if (it.item === 'loudBark') up.barkR += 40;
}

// ---------- 輸入 ----------
function onKeyDown(e) {
  var k = e.code, used = true;
  if (k === 'ArrowLeft') { keys.l = true; } else if (k === 'ArrowRight') { keys.r = true; }
  else if (k === 'ArrowUp') { keys.u = true; } else if (k === 'ArrowDown') { keys.d = true; }
  else if (k === 'Space' || k === 'KeyH' || k === 'Escape') { /* 事件鍵 */ }
  else used = false;
  if (!used) return;
  e.preventDefault();
  if (e.repeat) return;
  if (k === 'Space') press.space = true;
  else if (k === 'ArrowUp') press.up = true;
  else if (k === 'ArrowDown') press.down = true;
  else if (k === 'ArrowLeft') press.left = true;
  else if (k === 'ArrowRight') press.right = true;
  else press.help = true;
}
function onKeyUp(e) {
  var k = e.code;
  if (k === 'ArrowLeft') keys.l = false; else if (k === 'ArrowRight') keys.r = false;
  else if (k === 'ArrowUp') keys.u = false; else if (k === 'ArrowDown') keys.d = false;
  else if (k !== 'Space' && k !== 'KeyH' && k !== 'Escape') return;
  e.preventDefault();
}
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
window.addEventListener('blur', function () { keys.l = keys.r = keys.u = keys.d = false; });

function guideAdvance(dir) {
  if (dir > 0) {
    if (guidePage < GUIDE.length - 1) guidePage++;
    else if (guideOverlay) guideOverlay = false;
    else startGame();
  } else if (guidePage > 0) guidePage--;
}
function handleEvents() {
  var p = press;
  var any = p.space || p.up || p.down || p.left || p.right || p.help;
  if (!any) return;
  var ph0 = phase, ovl0 = guideOverlay;
  if (phase === 'guide' || guideOverlay) {
    if (p.space || p.right) guideAdvance(1);
    else if (p.left) guideAdvance(-1);
    else if (p.help && guideOverlay) guideOverlay = false;
  } else if (p.help && phase !== 'result') {
    guideOverlay = true; guidePage = 0;
  } else if (phase === 'title') {
    if (p.space) { if (titleStage === 'dungeon') startDungeon(); else startShow(); }
  } else if (phase === 'shop') {
    if (p.up) shopSel = Math.max(0, shopSel - 1);
    if (p.down) shopSel = Math.min(4, shopSel + 1);
    if (p.space) shopBuy();
  } else if (phase === 'result') {
    if (p.space) { resetAll(); gotoTitle('dungeon'); }
  }
  // 牧場的吠叫由 updateShow 讀 press.space; 剛換階段/剛關說明的那一下空白不算吠叫
  if (!(ph0 === 'show' && phase === 'show' && !ovl0 && !guideOverlay)) p.space = false;
  p.up = p.down = p.left = p.right = p.help = false;
}

// ---------- 更新 ----------
function update(dt) {
  handleEvents();
  if (!guideOverlay) {
    if (phase === 'dungeon') updateDungeon(dt);
    else if (phase === 'show') updateShow(dt);
    var i;
    if (floats) for (i = floats.length - 1; i >= 0; i--) { floats[i].t += dt; if (floats[i].t > 1.2) floats.splice(i, 1); }
  }
  press.space = false;
}

// ---------- 繪製 ----------
function hudState() {
  var msg = '';
  if (phase === 'show') {
    for (var i = 0; i < showMons.length; i++) if (showMons[i].loose) { msg = '繞到牠後面吠叫, 趕進水池'; break; }
  }
  return {
    phase: phase, day: day, gold: gold, rep: rep, hearts: hearts, maxHearts: 5,
    ropes: ropes, ropeMax: up.ropeCount, ropeLen: phase === 'dungeon' ? Math.round(ropeLength()) : 0, ropeLenMax: up.ropeMax,
    herd: herd.slice(), timeLeft: phase === 'dungeon' ? Math.max(0, 60 - dTime) : (phase === 'show' ? Math.max(0, 50 - sTime) : 0),
    message: msg, barkReady: barkCd <= 0
  };
}
function sy(y) { return y - camY + 120; }
function tamerState(x, y) {
  return { x: x, y: y, facing: tamer.facing, stunned: tamer.stun > 0, blink: tamer.inv > 0, barking: tamer.bark > 0 };
}
function drawFloats(oy) {
  for (var i = 0; i < floats.length; i++) {
    var f = floats[i];
    Art.drawFloatText(ctx, { x: f.x, y: f.y + oy, text: f.text, kind: f.kind, t: f.t });
  }
}
function drawHazards(oy) {
  for (var i = 0; i < hazards.length; i++) {
    var h = hazards[i];
    Art.drawHazard(ctx, { x: h.x, y: h.y + oy, kind: h.kind, phase: h.phase, radius: h.radius, t: h.t, angle: h.angle || 0 });
  }
}
function renderDungeon() {
  Art.drawBackground(ctx, {});
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 120, CW, CH - 120); ctx.clip();
  var r0 = Math.max(0, Math.floor(camY / TS) - 1), r1 = Math.min(ROWS - 1, Math.ceil((camY + 1160) / TS) + 1);
  for (var r = r0; r <= r1; r++) for (var c = 0; c < COLS; c++) {
    var t = tiles[r][c];
    Art.drawTile(ctx, { x: c * TS + 30, y: sy(r * TS + 30), kind: t.kind, zone: t.zone, nest: t.nest });
  }
  var oy = -camY + 120;
  drawHazards(oy);
  var pts = rope.map(function (p) { return { x: p.x, y: sy(p.y) }; });
  pts.push({ x: tamer.x, y: sy(tamer.y) });
  if (rope.length) Art.drawRope(ctx, { points: pts });
  for (var i = 0; i < wilds.length; i++) {
    var w = wilds[i];
    Art.drawWildMonster(ctx, { x: w.x, y: sy(w.y), species: w.sp, hp: w.hp, maxHp: w.maxHp, hit: w.hitT > 0, weak: w.hp <= w.maxHp * 0.3, casting: w.castT > 0, dir: w.dir });
  }
  Art.drawTamer(ctx, tamerState(tamer.x, sy(tamer.y)));
  for (var e = 0; e < effects.length; e++) {
    var ef = effects[e];
    if (ef.type === 'loop') Art.drawLoopFlash(ctx, { points: ef.poly.map(function (p) { return { x: p.x, y: sy(p.y) }; }), captured: ef.captured, t: ef.t });
    else Art.drawRopeCut(ctx, { x: ef.x, y: sy(ef.y), t: ef.t });
  }
  drawFloats(oy);
  ctx.restore();
  Art.drawHud(ctx, hudState());
}
function renderShow() {
  Art.drawBackground(ctx, {});
  Art.drawPasture(ctx, {});
  for (var s = 0; s < visitors.length; s++) {
    var p = seatPos(visitors[s].seat);
    Art.drawVisitor(ctx, { x: p.x, y: p.y, seat: visitors[s].seat, mode: visitors[s].mode });
  }
  var items = [];
  for (var i = 0; i < showMons.length; i++) items.push({ y: showMons[i].y, m: showMons[i] });
  items.push({ y: tamer.y, m: null });
  items.sort(function (a, b) { return a.y - b.y; });
  for (var k = 0; k < items.length; k++) {
    var m = items[k].m;
    if (!m) { Art.drawTamer(ctx, tamerState(tamer.x, tamer.y)); continue; }
    Art.drawShowMonster(ctx, { x: m.x, y: m.y, species: m.sp, rage: m.rage, mode: m.mode, inStage: !!m.inStage, performing: m.perfT > 0, fx: m.fx, dir: m.dir });
  }
  drawHazards(0);
  for (var b = 0; b < barkWaves.length; b++) Art.drawBarkWave(ctx, barkWaves[b]);
  drawFloats(0);
  Art.drawHud(ctx, hudState());
}
function renderGuide() {
  Art.drawBackground(ctx, {});
  var g = GUIDE[guidePage];
  Placeholder.text(g.title, CW / 2, 190, 56, '#ffe9a0', 'center', true);
  Art.drawGuidePage(ctx, { page: guidePage + 1, x: GUIDE_BOX.x, y: GUIDE_BOX.y, w: GUIDE_BOX.w, h: GUIDE_BOX.h });
  Placeholder.text(g.text, CW / 2, 880, 40, '#fff', 'center', true);
  if (g.sub) Placeholder.text(g.sub, CW / 2, 960, 30, '#ddd');
  Placeholder.text((guidePage + 1) + ' / ' + GUIDE.length, CW / 2, 1120, 32, '#fff');
  var last = guidePage === GUIDE.length - 1;
  Placeholder.text(last ? (guideOverlay ? '按空白鍵返回遊戲' : '按空白鍵開始遊戲') : '按空白鍵繼續', CW / 2, 1190, 34, '#fff', 'center', true);
  Placeholder.text('← 上一頁  → 下一頁', CW / 2, 1240, 24, '#ccc');
}
function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, CW, CH);
  if (phase === 'guide' || guideOverlay) { renderGuide(); return; }
  if (phase === 'title') {
    Art.drawBackground(ctx, {});
    Art.drawTitleCard(ctx, { day: day, stage: titleStage });
  } else if (phase === 'dungeon') renderDungeon();
  else if (phase === 'show') renderShow();
  else if (phase === 'shop') {
    Art.drawBackground(ctx, {});
    for (var i = 0; i < 4; i++) {
      var it = shopItems[i];
      Art.drawShopItem(ctx, { x: 360, y: 300 + i * 160, item: it.item, level: it.level, cost: it.cost, affordable: gold >= it.cost, selected: shopSel === i });
    }
    Art.drawButton(ctx, { x: 160, y: 1140, w: 400, h: 100, label: '出發', selected: shopSel === 4 });
    Art.drawHud(ctx, hudState());
    Placeholder.shopHint();
  } else if (phase === 'result') {
    Art.drawBackground(ctx, {});
    Art.drawResultPanel(ctx, { rep: rep, goldEarned: goldEarned, herd: herd.slice(), stars: stars() });
    Placeholder.restartHint();
  }
}

// ---------- 主迴圈 ----------
var last = null;
function frame(ts) {
  requestAnimationFrame(frame);
  if (last === null) last = ts;
  var dt = Math.min((ts - last) / 1000, 1 / 30);
  last = ts;
  try { update(dt); render(); } catch (err) { console.error(err); }
}
resetAll();
floats = []; effects = []; hazards = []; casts = [];
tamer = newTamer(START.x, START.y); rope = []; wilds = []; showMons = []; visitors = []; barkWaves = [];
barkCd = 0;
requestAnimationFrame(frame);
})();
