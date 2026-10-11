(function () {
'use strict';

var W = Art.canvas.width, H = Art.canvas.height;
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var ratio = 1;

// ---------- 佔位圖形(style.md 沒有的) ----------
var Placeholder = {
  text: function (c, s, x, y, size, color) {
    c.save();
    c.font = 'bold ' + size + 'px sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    var w = c.measureText(s).width + 30;
    c.fillStyle = 'rgba(0,0,0,0.6)';
    c.fillRect(Math.round(x - w / 2), Math.round(y - size * 0.8), Math.round(w), Math.round(size * 1.6));
    c.fillStyle = color || '#fff';
    c.fillText(s, Math.round(x), Math.round(y));
    c.restore();
  },
  emptySlot: function (c, x, y, cursor) {
    c.save();
    c.strokeStyle = cursor ? '#ffe14d' : 'rgba(255,255,255,0.35)';
    c.lineWidth = cursor ? 5 : 2;
    c.setLineDash([8, 6]);
    c.strokeRect(Math.round(x - 62), Math.round(y - 75), 124, 150);
    c.restore();
  },
  floorBanner: function (c, s) {
    Placeholder.text(c, s, W / 2, H / 2, 72, '#ffe14d');
  }
};

// ---------- 常數 ----------
var SP = {
  fire:    { th: 50, cost: 40, wait: 15, ignite: 20, gold: 5, cd: 2.5, hp: 3 },
  water:   { th: 30, cost: 20, wait: 10, ignite: 20, gold: 3, cd: 2.2, hp: 2 },
  thunder: { th: 60, cost: 60, wait: 25, ignite: 30, gold: 8, cd: 3.0, hp: 3 },
  stone:   { th: 70, cost: 30, wait: 5,  ignite: 10, gold: 6, cd: 3.5, hp: 5 }
};
var COLS = 9, ROWS = 14, TS = 80, OY = 140;
var STAGE_X = [200, 360, 520], STAGE_Y = [220, 380, 540];
var AUD_Y = 700;
var BACK_X = [88, 224, 360, 496, 632], BACK_Y = [870, 1030];
var BTN = { x: 160, y: 1140, w: 400, h: 100 };
var SHOP_Y = [200, 300, 400, 500], REL_Y = [680, 840];
var ITEMS = ['sword', 'cageBag', 'armor', 'encore'];
var ITEM_COST = [50, 40, 40, 60];
var GUIDE = [
  ['地下城', '方向鍵移動, 躲開亮起的格子'],
  ['收服', '撲空會累, 暈了按 C 裝籠'],
  ['揮劍與下樓', '空白鍵揮劍, 走到樓梯下樓'],
  ['排陣', '空白鍵選魔物, 再放上舞台'],
  ['開幕', '技能打到同伴, 牠也會接著演']
];

function rnd(n) { return Math.floor(Math.random() * n); }
function cellCx(c) { return c * TS + TS / 2; }
function cellCy(r) { return OY + r * TS + TS / 2; }

// ---------- 狀態 ----------
var G = {};
var held = [];
var tempMsg = '', tempMsgT = 0;

function resetAll() {
  G.day = 1; G.gold = 0; G.goldEarned = 0; G.rep = 0;
  G.maxHearts = 5; G.hearts = 5; G.cageMax = 3; G.cages = 3; G.attack = 1;
  G.actMax = 4; G.nextId = 1;
  G.roster = [newMon('fire'), newMon('water')];
  G.levels = [0, 0, 0, 0]; G.costs = ITEM_COST.slice();
  G.floats = []; G.d = null; G.s = null;
  G.title = { stage: 'dungeon', goldNight: null, repNight: null };
  G.phase = 'title';
  G.act = 0;
  G.repStart = 0;
  G.selected = null;
  G.cur = { zone: 'stage', col: 1, row: 1 };
  G.shopCur = { zone: 'item', i: 0 };
}
function newMon(sp) { return { id: G.nextId++, species: sp, rage: 40, loose: false, col: -1, row: -1, fx: null }; }

function say(s) { tempMsg = s; tempMsgT = 1.5; }

// ---------- 形狀 ----------
// 回傳相對 (dc, dr) 列表
function shapeOffsets(sp, dx, dy) {
  var a = [], i;
  if (sp === 'fire') {
    for (i = 1; i <= 2; i++) a.push([0, i], [0, -i], [i, 0], [-i, 0]);
  } else if (sp === 'thunder') {
    for (i = 1; i <= 2; i++) a.push([i, i], [i, -i], [-i, i], [-i, -i]);
  } else if (sp === 'stone') {
    for (var x = -1; x <= 1; x++) for (var y = -1; y <= 1; y++) if (x || y) a.push([x, y]);
  } else {
    for (i = 1; i <= 3; i++) a.push([dx * i, dy * i]);
  }
  return a;
}

// ---------- 地下城 ----------
function genFloor(floor) {
  for (;;) {
    var tiles = [], r, c;
    for (r = 0; r < ROWS; r++) { tiles.push([]); for (c = 0; c < COLS; c++) tiles[r].push(0); }
    var sc = rnd(COLS);
    tiles[0][sc] = 2;
    var n = 0;
    while (n < 14) {
      c = rnd(COLS); r = rnd(ROWS);
      if (tiles[r][c] !== 0) continue;
      if (c === 4 && r === 13) continue;
      tiles[r][c] = 1; n++;
    }
    if (reachable(tiles, sc)) return { tiles: tiles, sc: sc };
  }
}
function reachable(tiles, sc) {
  var seen = {}, q = [[4, 13]]; seen['4,13'] = 1;
  while (q.length) {
    var p = q.shift();
    if (p[0] === sc && p[1] === 0) return true;
    var d = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var i = 0; i < 4; i++) {
      var nc = p[0] + d[i][0], nr = p[1] + d[i][1];
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      if (tiles[nr][nc] === 1 || seen[nc + ',' + nr]) continue;
      seen[nc + ',' + nr] = 1; q.push([nc, nr]);
    }
  }
  return false;
}
function pickSpecies(floor) {
  var v = Math.random() * 100;
  if (floor === 1) return v < 40 ? 'fire' : v < 80 ? 'water' : v < 90 ? 'thunder' : 'stone';
  return v < 20 ? 'fire' : v < 40 ? 'water' : v < 70 ? 'thunder' : 'stone';
}
function setupFloor(floor) {
  var D = G.d, f = genFloor(floor);
  D.floor = floor; D.tiles = f.tiles; D.sc = f.sc;
  D.mons = []; D.cagesFx = [];
  var cnt = G.day === 1 ? 3 : 4, tries = 0;
  while (D.mons.length < cnt && tries++ < 1000) {
    var c = rnd(COLS), r = rnd(9);
    if (D.tiles[r][c] !== 0 || monAt(c, r)) continue;
    var sp = pickSpecies(floor);
    var hp = SP[sp].hp + (G.day - 1);
    D.mons.push({ species: sp, col: c, row: r, fc: c, fr: r, moveT: 0.3, moveCd: Math.random() * 0.9,
      cd: 0, hp: hp, maxHp: hp, tired: 0, stunT: 0, warn: null, hitT: 0 });
  }
}
function startDungeon() {
  G.hearts = G.maxHearts; G.cages = G.cageMax;
  G.d = { floor: 1, time: 70, hx: cellCx(4), hy: cellCy(13), facing: 'up', moving: false,
    inv: 0, swordCd: 0, atkT: 0, banner: 0 };
  setupFloor(1);
  G.floats = [];
  G.phase = 'dungeon';
}
function monAt(c, r) {
  var m = G.d.mons;
  for (var i = 0; i < m.length; i++) if (m[i].col === c && m[i].row === r) return m[i];
  return null;
}
function isBlocked(D, x, y) {
  var xs = [x - 25, x + 24.999], ys = [y - 25, y + 24.999];
  for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) {
    var c = Math.floor(xs[i] / TS), r = Math.floor((ys[j] - OY) / TS);
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return true;
    if (D.tiles[r][c] === 1) return true;
  }
  return false;
}
function heroCell(D) { return [Math.floor(D.hx / TS), Math.floor((D.hy - OY) / TS)]; }
var DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function moveHero(D, dt) {
  var dir = held.length ? held[held.length - 1] : null;
  if (!dir) { D.moving = false; return; }
  D.facing = dir; D.moving = true;
  var v = DIRV[dir], dist = 260 * dt;
  var nx = D.hx + v[0] * dist, ny = D.hy + v[1] * dist;
  if (!isBlocked(D, nx, ny)) { D.hx = nx; D.hy = ny; return; }
  // 貼牆
  var lo = 0, hi = 1;
  for (var i = 0; i < 6; i++) {
    var mid = (lo + hi) / 2;
    if (isBlocked(D, D.hx + v[0] * dist * mid, D.hy + v[1] * dist * mid)) hi = mid; else lo = mid;
  }
  D.hx += v[0] * dist * lo; D.hy += v[1] * dist * lo;
  // 沿牆滑動(轉角容錯)
  var px = v[0] !== 0 ? 0 : 1, py = v[0] !== 0 ? 1 : 0, step = dist * 0.7, s;
  for (var k = 0; k < 2; k++) {
    s = k === 0 ? 1 : -1;
    if (!isBlocked(D, D.hx + v[0] * 2 + px * s * 18, D.hy + v[1] * 2 + py * s * 18) &&
        !isBlocked(D, D.hx + px * s * step, D.hy + py * s * step)) {
      D.hx += px * s * step; D.hy += py * s * step; return;
    }
  }
}

function frontCell(D) {
  var c = heroCell(D), v = DIRV[D.facing];
  return [c[0] + v[0], c[1] + v[1]];
}

function swordAttack() {
  var D = G.d;
  if (D.swordCd > 0) return;
  D.swordCd = 0.35; D.atkT = 0.2;
  var f = frontCell(D), m = monAt(f[0], f[1]);
  if (!m) return;
  m.hp -= G.attack; m.hitT = 0.2;
  if (m.hp <= 0) {
    G.gold += 4; G.goldEarned += 4;
    G.floats.push({ x: cellCx(m.col), y: cellCy(m.row) - 40, text: '+4', kind: 'gold', t: 0 });
    D.mons.splice(D.mons.indexOf(m), 1);
  }
}
function throwCage() {
  var D = G.d;
  if (G.roster.length >= 10) { say('名單滿了'); return; }
  if (G.cages <= 0) return;
  var f = frontCell(D), m = monAt(f[0], f[1]);
  if (!m) return;
  G.cages--;
  var res = 'broken';
  if (m.stunT > 0) {
    res = 'caught';
    G.roster.push(newMon(m.species));
    D.mons.splice(D.mons.indexOf(m), 1);
  }
  D.cagesFx.push({ sx: D.hx, sy: D.hy, tx: cellCx(f[0]), ty: cellCy(f[1]), res: res, t: 0 });
}

function updateMon(D, m, dt) {
  if (m.hitT > 0) m.hitT -= dt;
  if (m.cd > 0) m.cd -= dt;
  if (m.moveT < 0.3) m.moveT += dt;
  if (m.warn) {
    var w = m.warn;
    w.t += dt;
    if (w.phase === 'warn' && w.t >= 0.9) {
      w.phase = 'strike'; w.t = 0;
      var hc = heroCell(D), hit = false, i;
      for (i = 0; i < w.cells.length; i++) if (w.cells[i][0] === hc[0] && w.cells[i][1] === hc[1]) hit = true;
      if (hit) {
        if (D.inv <= 0) { G.hearts--; D.inv = 1; }
      } else {
        m.tired++;
        if (m.tired >= 3) m.stunT = 4;
      }
      m.cd = SP[m.species].cd;
    } else if (w.phase === 'strike' && w.t >= 0.2) {
      m.warn = null;
    }
    return;
  }
  if (m.stunT > 0) {
    m.stunT -= dt;
    if (m.stunT <= 0) { m.stunT = 0; m.tired = 0; }
    return;
  }
  m.moveCd -= dt;
  var animating = m.moveT < 0.3;
  var hc2 = heroCell(D);
  if (!animating && m.cd <= 0 && Math.abs(hc2[0] - m.col) <= 4 && Math.abs(hc2[1] - m.row) <= 4) {
    var dx = 0, dy = 1;
    if (m.species === 'water') {
      var ddc = hc2[0] - m.col, ddr = hc2[1] - m.row;
      if (Math.abs(ddc) > Math.abs(ddr)) { dx = ddc > 0 ? 1 : -1; dy = 0; }
      else if (ddr !== 0) { dy = ddr > 0 ? 1 : -1; dx = 0; }
    }
    var offs = shapeOffsets(m.species, dx, dy), cells = [];
    for (var k = 0; k < offs.length; k++) {
      var cc = m.col + offs[k][0], rr = m.row + offs[k][1];
      if (cc >= 0 && cc < COLS && rr >= 0 && rr < ROWS) cells.push([cc, rr]);
    }
    m.warn = { cells: cells, phase: 'warn', t: 0 };
    m.moveCd = Math.max(m.moveCd, 0.3);
    return;
  }
  if (m.moveCd <= 0 && !animating) {
    m.moveCd = 0.9;
    var ds = [[1, 0], [-1, 0], [0, 1], [0, -1]], opts = [];
    for (var j = 0; j < 4; j++) {
      var nc = m.col + ds[j][0], nr = m.row + ds[j][1];
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      if (D.tiles[nr][nc] !== 0 || monAt(nc, nr)) continue;
      opts.push([nc, nr]);
    }
    if (opts.length) {
      var o = opts[rnd(opts.length)];
      m.fc = m.col; m.fr = m.row; m.col = o[0]; m.row = o[1]; m.moveT = 0;
    }
  }
}

function updateDungeon(dt) {
  var D = G.d, i;
  D.time -= dt;
  if (D.inv > 0) D.inv -= dt;
  if (D.swordCd > 0) D.swordCd -= dt;
  if (D.atkT > 0) D.atkT -= dt;
  if (D.banner > 0) D.banner -= dt;
  moveHero(D, dt);
  for (i = 0; i < D.mons.length; i++) updateMon(D, D.mons[i], dt);
  for (i = D.cagesFx.length - 1; i >= 0; i--) {
    D.cagesFx[i].t += dt;
    if (D.cagesFx[i].t > 0.8) D.cagesFx.splice(i, 1);
  }
  var hc = heroCell(D);
  if (D.tiles[hc[1]] && D.tiles[hc[1]][hc[0]] === 2 && G.hearts > 0) {
    if (D.floor === 1) {
      D.floor = 2; D.hx = cellCx(4); D.hy = cellCy(13); D.banner = 1;
      var keepInv = D.inv; setupFloor(2); D.inv = keepInv;
    } else { endDungeon(); return; }
  }
  if (G.hearts <= 0 || D.time <= 0) endDungeon();
}

function endDungeon() {
  G.d.time = Math.max(0, G.d.time);
  startNight();
  G.title = { stage: 'show', goldNight: null, repNight: null };
  G.phase = 'title';
}

// ---------- 夜場 ----------
function startNight() {
  G.roster.forEach(function (m) { m.rage = 40; m.loose = false; m.col = -1; m.row = -1; m.fx = null; });
  G.act = 1; G.repStart = G.rep; G.nightGold = 0;
  G.selected = null; G.cur = { zone: 'stage', col: 1, row: 1 };
  G.floats = [];
  G.s = { aud: [{ mood: 'calm', t: 0 }, { mood: 'calm', t: 0 }, { mood: 'calm', t: 0 }], tiles: [], cur: null, queue: [], stepT: 0 };
}
function stageAt(c, r) {
  for (var i = 0; i < G.roster.length; i++) if (G.roster[i].col === c && G.roster[i].row === r) return G.roster[i];
  return null;
}
function moveSlot(slot, n, dir) {
  var col = slot % 5, row = Math.floor(slot / 5);
  if (dir === 'left') return col > 0 ? slot - 1 : slot;
  if (dir === 'right') return (slot + 1 < n && col < 4) ? slot + 1 : slot;
  if (dir === 'up') return row > 0 ? slot - 5 : 'up';
  return slot + 5 < n ? slot + 5 : 'down';
}
var STAGE_TO_BACK = [1, 2, 3], BACK_TO_STAGE = [0, 0, 1, 2, 2];

function arrangeNav(dir) {
  var c = G.cur, n = G.roster.length, r;
  if (c.zone === 'stage') {
    if (dir === 'left') c.col = Math.max(0, c.col - 1);
    else if (dir === 'right') c.col = Math.min(2, c.col + 1);
    else if (dir === 'up') c.row = Math.max(0, c.row - 1);
    else if (c.row < 2) c.row++;
    else if (n === 0) G.cur = { zone: 'button' };
    else G.cur = { zone: 'back', slot: Math.min(STAGE_TO_BACK[c.col], n - 1) };
  } else if (c.zone === 'back') {
    r = moveSlot(c.slot, n, dir);
    if (r === 'up') G.cur = { zone: 'stage', col: BACK_TO_STAGE[c.slot % 5], row: 2 };
    else if (r === 'down') G.cur = { zone: 'button' };
    else c.slot = r;
  } else if (dir === 'up') {
    if (n > 0) {
      var lr = Math.floor((n - 1) / 5);
      G.cur = { zone: 'back', slot: Math.min(lr * 5 + 2, n - 1) };
    } else G.cur = { zone: 'stage', col: 1, row: 2 };
  }
}
function arrangeConfirm() {
  var c = G.cur, sel = G.selected, m;
  if (c.zone === 'button') { startShow(); return; }
  if (!sel) {
    m = c.zone === 'stage' ? stageAt(c.col, c.row) : G.roster[c.slot];
    if (m && c.zone === 'back' && m.col >= 0) m = null;
    if (m && !m.loose) G.selected = m;
    return;
  }
  if (c.zone === 'stage') {
    var t = stageAt(c.col, c.row);
    if (t === sel) { G.selected = null; return; }
    var c0 = sel.col, r0 = sel.row;
    if (t) { t.col = c0; t.row = r0; }
    sel.col = c.col; sel.row = c.row;
    G.selected = null;
  } else {
    m = G.roster[c.slot];
    if (m === sel) G.selected = null;
    else if (sel.col >= 0) { sel.col = -1; sel.row = -1; G.selected = null; }
  }
}

function startShow() {
  var S = G.s, q = [];
  G.selected = null;
  G.roster.forEach(function (m) {
    if (m.col >= 0 && !m.loose && m.rage >= SP[m.species].th) q.push(m);
  });
  q.sort(function (a, b) { return (b.rage - a.rage) || (a.row - b.row) || (a.col - b.col); });
  S.queue = q; S.performed = {}; S.count = 0; S.t = 0.5; S.ended = false; S.tiles = []; S.cur = null; S.stepT = 0.8;
  G.phase = 'perform';
}
function looseMon(m) {
  if (m.loose) return;
  m.loose = true; m.rage = 100;
  G.rep = Math.max(0, G.rep - 8);
  var S = G.s, i = S.queue.indexOf(m);
  if (i >= 0) S.queue.splice(i, 1);
  var x = m.col >= 0 ? STAGE_X[m.col] : 360, y = m.col >= 0 ? STAGE_Y[m.row] : 900;
  G.floats.push({ x: x, y: y - 50, text: '失控 名聲-8', kind: 'repDown', t: 0 });
  S.aud.forEach(function (a) { a.mood = 'scared'; a.t = 1.2; });
}
function doStep() {
  var S = G.s, m = S.queue.shift(), sp = SP[m.species];
  var offs = shapeOffsets(m.species, 0, 1), tiles = [], audN = 0, hits = [], i;
  var audCols = [];
  for (i = 0; i < offs.length; i++) {
    var c = m.col + offs[i][0], r = m.row + offs[i][1];
    if (c < 0 || c > 2) continue;
    if (r === 3) { audN++; audCols.push(c); tiles.push({ x: STAGE_X[c], y: AUD_Y, species: m.species }); }
    else if (r >= 0 && r <= 2) { tiles.push({ x: STAGE_X[c], y: STAGE_Y[r], species: m.species }); var t = stageAt(c, r); if (t && t !== m && !t.loose) hits.push(t); }
  }
  var gain = Math.round(sp.gold * (1 + 0.5 * S.count) * (1 + G.rep / 100) + 3 * audN);
  G.gold += gain; G.goldEarned += gain; G.nightGold += gain;
  var repGain = 1 + audN; G.rep += repGain;
  S.performed[m.id] = true; S.count++;
  m.rage = Math.max(0, m.rage - sp.cost);
  S.cur = m; S.stepT = 0; S.tiles = tiles;
  var px = STAGE_X[m.col], py = STAGE_Y[m.row];
  G.floats.push({ x: px, y: py - 70, text: '+' + gain, kind: 'gold', t: 0 });
  G.floats.push({ x: px, y: py - 20, text: '名聲+' + repGain, kind: 'repUp', t: 0 });
  audCols.forEach(function (c2) { S.aud[c2].mood = 'cheer'; S.aud[c2].t = 0.8; });
  hits.forEach(function (tm) {
    var tx = STAGE_X[tm.col], ty = STAGE_Y[tm.row];
    if (m.species === 'water') {
      tm.rage = Math.max(0, tm.rage - 25); tm.fx = { mode: 'doused', t: 0.5 };
      G.floats.push({ x: tx, y: ty - 50, text: '-25', kind: 'rageDown', t: 0 });
    } else {
      var inc = SP[tm.species].ignite;
      tm.rage = Math.min(100, tm.rage + inc); tm.fx = { mode: 'ignited', t: 0.5 };
      G.floats.push({ x: tx, y: ty - 50, text: '+' + inc, kind: 'rageUp', t: 0 });
    }
    if (tm.rage >= 100) { looseMon(tm); return; }
    if (!S.performed[tm.id] && tm.rage >= SP[tm.species].th && S.queue.indexOf(tm) < 0) S.queue.push(tm);
  });
}
function endAct() {
  var S = G.s;
  S.cur = null; S.tiles = [];
  if (S.count >= 3) {
    G.rep += 5;
    G.floats.push({ x: 360, y: 440, text: '大場面! 名聲+5', kind: 'bigShow', t: 0 });
  }
  G.roster.forEach(function (m) {
    if (m.col < 0 && !m.loose) {
      m.rage += SP[m.species].wait;
      if (m.rage >= 100) looseMon(m);
    }
  });
}
function finishAct() {
  G.roster.forEach(function (m) { if (m.loose && m.col >= 0) { m.col = -1; m.row = -1; } });
  if (G.act >= G.actMax) {
    G.title = { stage: 'nightSummary', goldNight: G.nightGold, repNight: G.rep - G.repStart };
    G.phase = 'title';
  } else {
    G.act++; G.selected = null; G.phase = 'arrange';
  }
}
function updateShow(dt) {
  var S = G.s;
  S.stepT += dt;
  S.t -= dt;
  if (S.t > 0) return;
  if (S.queue.length > 0) { doStep(); S.t = 0.8; }
  else if (!S.ended) { endAct(); S.ended = true; S.t = 1.0; }
  else finishAct();
}

// ---------- 商店 ----------
function shopNav(dir) {
  var c = G.shopCur, n = G.roster.length, r;
  if (c.zone === 'item') {
    if (dir === 'up') c.i = Math.max(0, c.i - 1);
    else if (dir === 'down') {
      if (c.i < 3) c.i++;
      else G.shopCur = n > 0 ? { zone: 'rel', slot: 0 } : { zone: 'btn' };
    }
  } else if (c.zone === 'rel') {
    r = moveSlot(c.slot, n, dir);
    if (r === 'up') G.shopCur = { zone: 'item', i: 3 };
    else if (r === 'down') G.shopCur = { zone: 'btn' };
    else c.slot = r;
  } else if (dir === 'up') {
    G.shopCur = n > 0 ? { zone: 'rel', slot: Math.min(Math.floor((n - 1) / 5) * 5 + 2, n - 1) } : { zone: 'item', i: 3 };
  }
}
function shopConfirm() {
  var c = G.shopCur;
  if (c.zone === 'btn') { departShop(); return; }
  if (c.zone === 'item') {
    var i = c.i;
    if (i === 3 && G.actMax >= 6) return;
    if (G.gold < G.costs[i]) return;
    G.gold -= G.costs[i];
    G.levels[i]++;
    G.costs[i] = Math.round(G.costs[i] * 1.5);
    if (i === 0) G.attack++;
    else if (i === 1) G.cageMax++;
    else if (i === 2) G.maxHearts++;
    else G.actMax++;
    return;
  }
  var m = G.roster[c.slot];
  if (!m) return;
  var p = SP[m.species].gold * 4;
  G.gold += p; G.goldEarned += p;
  G.roster.splice(c.slot, 1);
  if (G.roster.length === 0) G.shopCur = { zone: 'btn' };
  else if (c.slot >= G.roster.length) c.slot = G.roster.length - 1;
}
function departShop() {
  G.day++;
  G.title = { stage: 'dungeon', goldNight: null, repNight: null };
  G.phase = 'title';
}

// ---------- 輸入 ----------
var KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Space: 'space', Enter: 'enter', KeyC: 'c', KeyH: 'h', Escape: 'esc' };
function keyAct(e) {
  if (KEYS[e.code]) return KEYS[e.code];
  var k = e.key;
  if (k === ' ') return 'space';
  if (k === 'c' || k === 'C') return 'c';
  if (k === 'h' || k === 'H') return 'h';
  if (k === 'Enter') return 'enter';
  if (k === 'ArrowUp') return 'up'; if (k === 'ArrowDown') return 'down';
  if (k === 'ArrowLeft') return 'left'; if (k === 'ArrowRight') return 'right';
  return null;
}
var prevPhase = null, guideFromGame = false, guidePage = 0;

function openGuide() {
  prevPhase = G.phase; guideFromGame = true; guidePage = 0; G.phase = 'guide';
}
function closeGuide() {
  if (guideFromGame) { G.phase = prevPhase; guideFromGame = false; }
  else { G.title = { stage: 'dungeon', goldNight: null, repNight: null }; G.phase = 'title'; }
}
function onPress(a) {
  var P = G.phase;
  if (P === 'guide') {
    if (a === 'space' || a === 'right') {
      if (guidePage < GUIDE.length - 1) guidePage++;
      else if (a === 'space') closeGuide();
    } else if (a === 'left') guidePage = Math.max(0, guidePage - 1);
    else if ((a === 'h' || a === 'esc') && guideFromGame) closeGuide();
    return;
  }
  if (a === 'h') { openGuide(); return; }
  if (P === 'title') {
    if (a !== 'space') return;
    var st = G.title.stage;
    if (st === 'dungeon') startDungeon();
    else if (st === 'show') G.phase = 'arrange';
    else if (G.day < 3) { G.shopCur = { zone: 'item', i: 0 }; G.phase = 'shop'; }
    else G.phase = 'result';
  } else if (P === 'dungeon') {
    if (a === 'space') swordAttack();
    else if (a === 'c') throwCage();
  } else if (P === 'arrange') {
    if (a === 'enter') startShow();
    else if (a === 'space') arrangeConfirm();
    else if (a === 'up' || a === 'down' || a === 'left' || a === 'right') arrangeNav(a);
  } else if (P === 'shop') {
    if (a === 'enter') departShop();
    else if (a === 'space') shopConfirm();
    else if (a === 'up' || a === 'down' || a === 'left' || a === 'right') shopNav(a);
  } else if (P === 'result') {
    if (a === 'space') resetAll();
  }
}
window.addEventListener('keydown', function (e) {
  var a = keyAct(e);
  if (!a) return;
  e.preventDefault();
  if (e.repeat) return;
  if (a === 'up' || a === 'down' || a === 'left' || a === 'right') {
    var i = held.indexOf(a); if (i >= 0) held.splice(i, 1);
    held.push(a);
  }
  onPress(a);
});
window.addEventListener('keyup', function (e) {
  var a = keyAct(e);
  if (!a) return;
  e.preventDefault();
  var i = held.indexOf(a); if (i >= 0) held.splice(i, 1);
});
window.addEventListener('blur', function () { held.length = 0; });

// ---------- 更新 ----------
function updateFloats(dt) {
  for (var i = G.floats.length - 1; i >= 0; i--) {
    G.floats[i].t += dt;
    if (G.floats[i].t > 1.2) G.floats.splice(i, 1);
  }
}
function update(dt) {
  if (tempMsgT > 0) tempMsgT -= dt;
  var P = G.phase;
  if (P === 'guide') return;
  updateFloats(dt);
  if (P === 'dungeon') updateDungeon(dt);
  else if (P === 'perform') {
    updateShow(dt);
    var S = G.s;
    S.aud.forEach(function (a) { if (a.t > 0) { a.t -= dt; if (a.t <= 0) a.mood = 'calm'; } });
    G.roster.forEach(function (m) { if (m.fx) { m.fx.t -= dt; if (m.fx.t <= 0) m.fx = null; } });
  }
}

// ---------- 繪製 ----------
function hudState() {
  var P = G.phase, msg = '';
  if (P === 'dungeon') msg = '空白揮劍 C 丟籠 走到樓梯下樓';
  else if (P === 'arrange') msg = '方向鍵移動 空白選 / 放 Enter 開幕';
  else if (P === 'shop') msg = '方向鍵移動 空白購買 / 放生 Enter 出發';
  if (tempMsgT > 0 && P === 'dungeon') msg = tempMsg;
  return {
    phase: P, day: G.day, floor: P === 'dungeon' ? G.d.floor : 0, gold: G.gold, rep: G.rep,
    hearts: Math.max(0, G.hearts), maxHearts: G.maxHearts, cages: G.cages, cageMax: G.cageMax,
    act: (P === 'arrange' || P === 'perform') ? G.act : 0, actMax: G.actMax,
    rosterCount: G.roster.length, rosterMax: 10,
    timeLeft: P === 'dungeon' ? Math.max(0, G.d.time) : 0, message: msg
  };
}
function drawFloats() {
  G.floats.forEach(function (f) { Art.drawFloatText(ctx, { x: f.x, y: f.y, text: f.text, kind: f.kind, t: f.t }); });
}
function drawDungeon() {
  var D = G.d, r, c, i;
  for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) {
    var k = D.tiles[r][c];
    Art.drawTile(ctx, { x: cellCx(c), y: cellCy(r), kind: k === 1 ? 'wall' : k === 2 ? 'stairs' : 'floor', floor: D.floor });
  }
  D.mons.forEach(function (m) {
    if (!m.warn) return;
    m.warn.cells.forEach(function (cl) {
      Art.drawWarnTile(ctx, { x: cellCx(cl[0]), y: cellCy(cl[1]), species: m.species, phase: m.warn.phase, t: m.warn.t });
    });
  });
  D.mons.forEach(function (m) {
    var p = Math.min(1, m.moveT / 0.3);
    var x = cellCx(m.fc) + (cellCx(m.col) - cellCx(m.fc)) * p;
    var y = cellCy(m.fr) + (cellCy(m.row) - cellCy(m.fr)) * p;
    Art.drawWildMonster(ctx, { x: x, y: y, species: m.species, hp: m.hp, maxHp: m.maxHp, tired: m.tired,
      dazed: m.stunT > 0, casting: !!(m.warn && m.warn.phase === 'warn'), hit: m.hitT > 0 });
  });
  D.cagesFx.forEach(function (cg) {
    var x, y, res, t;
    if (cg.t < 0.2) { var p = cg.t / 0.2; x = cg.sx + (cg.tx - cg.sx) * p; y = cg.sy + (cg.ty - cg.sy) * p; res = 'flying'; t = cg.t; }
    else { x = cg.tx; y = cg.ty; res = cg.res; t = cg.t - 0.2; }
    Art.drawCage(ctx, { x: x, y: y, result: res, t: t });
  });
  Art.drawHero(ctx, { x: D.hx, y: D.hy, facing: D.facing, moving: D.moving, attacking: D.atkT > 0, blink: D.inv > 0 });
  drawFloats();
  if (D.banner > 0) Placeholder.floorBanner(ctx, '第 2 層');
}
function drawNightBase(forShop) {
  var c, r, S = G.s;
  Art.drawStage(ctx, {});
  var prev = null;
  if (G.phase === 'arrange' && G.selected && G.cur.zone === 'stage') {
    prev = shapeOffsets(G.selected.species, 0, 1).map(function (o) { return [G.cur.col + o[0], G.cur.row + o[1]]; });
  }
  for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) {
    var pv = false;
    if (prev) for (var i = 0; i < prev.length; i++) if (prev[i][0] === c && prev[i][1] === r) pv = true;
    Art.drawStageCell(ctx, { x: STAGE_X[c], y: STAGE_Y[r], col: c, row: r,
      cursor: G.phase === 'arrange' && G.cur.zone === 'stage' && G.cur.col === c && G.cur.row === r,
      preview: pv, previewSpecies: pv ? G.selected.species : null });
  }
  S.tiles.forEach(function (t) { Art.drawSkillTile(ctx, { x: t.x, y: t.y, species: t.species, t: S.stepT }); });
  for (c = 0; c < 3; c++) Art.drawAudience(ctx, { x: STAGE_X[c], y: AUD_Y, col: c, mood: S.aud[c].mood });
  G.roster.forEach(function (m) {
    if (m.col < 0) return;
    var mode = m.loose ? 'loose' : (S.cur === m ? 'performing' : (m.fx ? m.fx.mode : 'idle'));
    Art.drawStageMonster(ctx, { x: STAGE_X[m.col], y: STAGE_Y[m.row], species: m.species, rage: m.rage,
      threshold: SP[m.species].th, mode: mode, selected: G.selected === m });
  });
  G.roster.forEach(function (m, i) {
    var x = BACK_X[i % 5], y = BACK_Y[Math.floor(i / 5)];
    var cur = G.phase === 'arrange' && G.cur.zone === 'back' && G.cur.slot === i;
    if (m.col >= 0) { Placeholder.emptySlot(ctx, x, y, cur); return; }
    Art.drawBackstageCard(ctx, { x: x, y: y, species: m.species, rage: m.rage, threshold: SP[m.species].th,
      cursor: cur, selected: G.selected === m, loose: m.loose, sellPrice: null });
  });
  Art.drawButton(ctx, { x: BTN.x, y: BTN.y, w: BTN.w, h: BTN.h, label: '開幕',
    cursor: G.phase === 'arrange' && G.cur.zone === 'button' });
  drawFloats();
}
function drawShop() {
  var i;
  for (i = 0; i < 4; i++) {
    var maxed = i === 3 && G.actMax >= 6;
    Art.drawShopItem(ctx, { x: 360, y: SHOP_Y[i], item: ITEMS[i], level: G.levels[i], cost: G.costs[i],
      affordable: G.gold >= G.costs[i], maxed: maxed, cursor: G.shopCur.zone === 'item' && G.shopCur.i === i });
  }
  G.roster.forEach(function (m, j) {
    Art.drawBackstageCard(ctx, { x: BACK_X[j % 5], y: REL_Y[Math.floor(j / 5)], species: m.species, rage: 0,
      threshold: SP[m.species].th, cursor: G.shopCur.zone === 'rel' && G.shopCur.slot === j,
      selected: false, loose: false, sellPrice: SP[m.species].gold * 4 });
  });
  Art.drawButton(ctx, { x: BTN.x, y: BTN.y, w: BTN.w, h: BTN.h, label: '出發', cursor: G.shopCur.zone === 'btn' });
}
function drawGuide() {
  Placeholder.text(ctx, (guidePage + 1) + '. ' + GUIDE[guidePage][0], W / 2, 190, 52);
  Art.drawGuidePage(ctx, { page: guidePage + 1, x: 60, y: 250, w: 600, h: 760 });
  Placeholder.text(ctx, GUIDE[guidePage][1], W / 2, 1070, 40);
  Placeholder.text(ctx, (guidePage + 1) + ' / ' + GUIDE.length, W / 2, 1140, 30);
  var last = guidePage === GUIDE.length - 1;
  Placeholder.text(ctx, (last ? '空白鍵開始' : '空白鍵下一頁') + (guidePage > 0 ? '  ← 上一頁' : ''), W / 2, 1210, 28);
}
function render() {
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, W, H);
  Art.drawBackground(ctx, {});
  var P = G.phase;
  if (P === 'guide') {
    drawGuide();
  } else if (P === 'title') {
    Art.drawTitleCard(ctx, { day: G.day, stage: G.title.stage, goldNight: G.title.goldNight, repNight: G.title.repNight });
    Placeholder.text(ctx, '空白鍵繼續', W / 2, 1230, 28);
  } else if (P === 'dungeon') {
    drawDungeon();
  } else if (P === 'arrange' || P === 'perform') {
    drawNightBase();
  } else if (P === 'shop') {
    drawShop();
  } else if (P === 'result') {
    var stars = G.rep >= 160 ? 3 : G.rep >= 100 ? 2 : G.rep >= 40 ? 1 : 0;
    Art.drawResultPanel(ctx, { rep: G.rep, goldEarned: G.goldEarned, stars: stars });
    Placeholder.text(ctx, '空白鍵重來', W / 2, 1230, 28);
  }
  var hp = hudState();
  if (P === 'guide') hp.phase = 'guide';
  else if (P === 'title') hp.phase = 'title';
  Art.drawHud(ctx, hp);
}

// ---------- 主迴圈 ----------
function fit() {
  var s = Math.min(window.innerWidth / W, window.innerHeight / H);
  if (!(s > 0)) s = 1;
  var dpr = window.devicePixelRatio || 1;
  var cw = Math.floor(W * s), ch = Math.floor(H * s);
  canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
  canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
  ratio = canvas.width / W;
}
window.addEventListener('resize', fit);
fit();
resetAll();
// 開場先顯示說明頁
G.phase = 'guide'; guideFromGame = false; guidePage = 0; prevPhase = null;

var last = 0;
function frame(ts) {
  var dt = last ? (ts - last) / 1000 : 0;
  last = ts;
  if (dt > 1 / 30) dt = 1 / 30;
  if (dt < 0) dt = 0;
  try { update(dt); render(); } catch (err) { if (window.console) console.error(err); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

})();
