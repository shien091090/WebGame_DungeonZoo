// 怒火連鎖馴獸場 — 玩法驗證 Demo
// 邏輯與繪製分離: update(dt) 更新狀態, render() 依狀態呼叫 Art
(function () {
'use strict';

var W = Art.canvas.width, H = Art.canvas.height;
var canvas = document.getElementById('c');
var dpr = window.devicePixelRatio || 1;
canvas.width = Math.round(W * dpr);
canvas.height = Math.round(H * dpr);
var ctx = canvas.getContext('2d');

// ---------- 佔位圖形(style.md / interface 沒有的東西) ----------
var Placeholder = {
  text: function (s, x, y, size, align, color) {
    ctx.save();
    ctx.font = 'bold ' + size + 'px sans-serif';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(3, size / 7);
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.strokeText(s, x, y);
    ctx.fillStyle = color || '#fff';
    ctx.fillText(s, x, y);
    ctx.restore();
  },
  panel: function (x, y, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  },
  // 說明頁: 標題、說明文字、頁碼、翻頁提示
  guideText: function (page, total, title, line, lastHint) {
    Placeholder.panel(40, 40, 640, 170);
    Placeholder.text(title, 360, 90, 56, 'center', '#ffd54f');
    Placeholder.text(line, 360, 165, 34, 'center', '#fff');
    Placeholder.panel(40, 920, 640, 340);
    Placeholder.text((page + 1) + ' / ' + total, 360, 960, 34, 'center', '#fff');
    if (page > 0) Placeholder.text('◀ 上一頁', 60, 1100, 34, 'left', '#9fd3ff');
    Placeholder.text(lastHint, 360, 1220, 28, 'center', '#ddd');
  },
  titleHint: function () { Placeholder.text('點畫面開始', 360, 1100, 40, 'center', '#fff'); },
  resultHint: function () { Placeholder.text('點畫面重來', 360, 1230, 40, 'center', '#fff'); },
  // 遊戲中叫出說明的小按鈕(HUD 右下角)
  helpButton: function () {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(680, 98, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    Placeholder.text('?', 680, 98, 26, 'center', '#fff');
  }
};
var HELP_BTN = { x: 680, y: 98, r: 22 };

// ---------- 常數 ----------
var T = 60, COLS = 12, ROWS = 30;
var MAP = [
  '############', '#....##....#', '#.t..##..g.#', '#..o.##.o..#', '#....##....#', '#.o..##..o.#',
  '#..t.##.g..#', '#....##....#', '##..####..##', '#..........#', '#..........#', '##..####..##',
  '#LL..##....#', '#L.f.##.WW.#', '#....##.WWj#', '#..LL##.WW.#', '#.f..##..j.#', '#L...##....#',
  '##..####..##', '#..........#', '#..........#', '#####..#####', '#####..#####', '#####..#####',
  '##........##', '##........##', '##...S....##', '##........##', '##........##', '############'
];
// MAP 的每列長度在 selfcheck 時應為 12
var ZONES = [
  { name: 'crag', c0: 1, c1: 4, r0: 1, r1: 7, species: 't' },
  { name: 'ruins', c0: 7, c1: 10, r0: 1, r1: 7, species: 'g' },
  { name: 'lava', c0: 1, c1: 4, r0: 12, r1: 17, species: 'f' },
  { name: 'pond', c0: 7, c1: 10, r0: 12, r1: 17, species: 'j' }
];
var NEST_SPECIES = { t: 'thunder', g: 'stone', f: 'fire', j: 'water' };
var SP = {
  fire:    { hp: 10, interval: 2.4, whip: 25, decay: 4, gold: 5, rep: 1, skill: 'firering' },
  water:   { hp: 7,  interval: 1.6, whip: 20, decay: 6, gold: 3, rep: 1, skill: 'waterball' },
  thunder: { hp: 12, interval: 2.6, whip: 40, decay: 8, gold: 7, rep: 2, skill: 'thunder' },
  stone:   { hp: 16, interval: 3.0, whip: 12, decay: 1, gold: 4, rep: 1, skill: 'quake' }
};
var STAR_MULT = [0, 1, 1.3, 1.6];
var SPEED = 520, TAMER_R = 18, WALK = 60, FLEE = 90, CHARGE_SPD = 160;
var DUNGEON_TIME = 60, SHOW_TIME = 50, DAYS = 3;
var WHIP_CD = 0.35;
var ARENA = { x0: 60, x1: 660, y0: 270, y1: 1000 };
var FENCE_Y = [255, 1010];
var SEAT_X = [110, 210, 310, 410, 510, 610];
var SEAT_Y = [190, 1080];
var LOOSE_Y = [225, 1040];
var RAM_Y = [290, 985];
var SHOP_Y = [300, 460, 620, 780];
var SHOP_ITEMS = ['whipPower', 'ropeBag', 'armor', 'longWhip'];
var SHOP_BASE = { whipPower: 50, ropeBag: 40, armor: 40, longWhip: 60 };
var BTN = { x: 160, y: 1140, w: 400, h: 100 };

// ---------- 地圖 ----------
var TILES = [], NEST_DEFS = [], START = { x: 330, y: 1590 };
(function buildMap() {
  for (var r = 0; r < ROWS; r++) {
    TILES[r] = [];
    for (var c = 0; c < COLS; c++) {
      var ch = MAP[r].charAt(c), kind = 'floor', nest = false;
      if (ch === '#') kind = 'wall';
      else if (ch === 'o') kind = 'pillar';
      else if (ch === 'L') kind = 'lava';
      else if (ch === 'W') kind = 'water';
      else if (NEST_SPECIES[ch]) { nest = true; NEST_DEFS.push({ col: c, row: r, species: NEST_SPECIES[ch], zone: null }); }
      else if (ch === 'S') { START = { x: c * T + 30, y: r * T + 30 }; }
      var zone = 'hall', zref = null;
      for (var i = 0; i < ZONES.length; i++) {
        var z = ZONES[i];
        if (c >= z.c0 && c <= z.c1 && r >= z.r0 && r <= z.r1) { zone = z.name; zref = z; }
      }
      TILES[r][c] = { kind: kind, zone: zone, nest: nest, zref: zref };
    }
  }
  for (var n = 0; n < NEST_DEFS.length; n++) NEST_DEFS[n].zone = TILES[NEST_DEFS[n].row][NEST_DEFS[n].col].zref;
})();

function solidTile(c, r) {
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
  var k = TILES[r][c].kind;
  return k === 'wall' || k === 'pillar';
}
function tileAt(x, y) {
  var c = Math.floor(x / T), r = Math.floor(y / T);
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return TILES[0][0];
  return TILES[r][c];
}
function circleHitsRect(cx, cy, rad, rx, ry, rw, rh) {
  var nx = Math.max(rx, Math.min(cx, rx + rw)), ny = Math.max(ry, Math.min(cy, ry + rh));
  var dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy < rad * rad;
}
function blockedCircle(x, y, rad) {
  var c0 = Math.floor((x - rad) / T), c1 = Math.floor((x + rad) / T);
  var r0 = Math.floor((y - rad) / T), r1 = Math.floor((y + rad) / T);
  for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
    if (solidTile(c, r) && circleHitsRect(x, y, rad, c * T, r * T, T, T)) return true;
  }
  return false;
}
function touchesKind(x, y, rad, kind) {
  var c0 = Math.floor((x - rad) / T), c1 = Math.floor((x + rad) / T);
  var r0 = Math.floor((y - rad) / T), r1 = Math.floor((y + rad) / T);
  for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue;
    if (TILES[r][c].kind === kind && circleHitsRect(x, y, rad, c * T, r * T, T, T)) return true;
  }
  return false;
}

// ---------- 遊戲狀態 ----------
var G = null;
var mouse = { x: W / 2, y: H / 2 };
var nextId = 1;

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function rand(a, b) { return a + Math.random() * (b - a); }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function newRun() {
  G = {
    phase: 'guide', guidePage: 0, guideReturn: null, guideSeen: G ? G.guideSeen : false,
    day: 1, gold: 0, rep: 0, goldEarned: 0,
    lv: { whipPower: 0, ropeBag: 0, armor: 0, longWhip: 0 },
    cost: { whipPower: 50, ropeBag: 40, armor: 40, longWhip: 60 },
    roster: [{ species: 'fire', star: 1 }],
    tamer: { x: START.x, y: START.y, dir: 1, stunT: 0, invulT: 0 },
    hearts: 5, ropes: 3, whipCd: 0, time: 0,
    monsters: [], nests: [], hazards: [], whips: [], floats: [],
    smons: [], fences: [], visitors: [],
    title: { day: 1, stage: 'dungeon' },
    stars: 0
  };
}
function maxHearts() { return 5 + G.lv.armor; }
function ropeMax() { return 3 + G.lv.ropeBag; }
function whipPower() { return 2 + G.lv.whipPower; }
function whipRadius() { return 110 + 25 * G.lv.longWhip; }

function addFloat(x, y, text, kind, world) {
  G.floats.push({ x: x, y: y, text: text, kind: kind, t: 0, world: !!world });
}

// ---------- 階段切換 ----------
function startTitle(day, stage) {
  G.day = day;
  G.title = { day: day, stage: stage };
  G.phase = 'title';
  G.hazards = []; G.whips = []; G.floats = [];
}
function startDungeon() {
  G.phase = 'dungeon';
  G.time = DUNGEON_TIME;
  G.hearts = maxHearts();
  G.ropes = ropeMax();
  G.tamer = { x: START.x, y: START.y, dir: 1, stunT: 0, invulT: 0 };
  G.whipCd = 0;
  G.monsters = []; G.hazards = []; G.whips = []; G.floats = [];
  G.nests = NEST_DEFS.map(function (d) {
    var n = { def: d, monster: null, timer: 0 };
    n.monster = spawnWild(d);
    G.monsters.push(n.monster);
    return n;
  });
}
function spawnWild(d) {
  var base = SP[d.species].hp;
  var hp = Math.round(base * (1 + 0.5 * (G.day - 1)));
  var a = rand(0, Math.PI * 2);
  return {
    id: nextId++, species: d.species, nest: d, x: d.col * T + 30, y: d.row * T + 30,
    hp: hp, maxHp: hp, weak: false, hitT: 0, castT: 0, dir: 1,
    vx: Math.cos(a), vy: Math.sin(a), turnT: rand(2, 3), cd: SP[d.species].interval * rand(0.5, 1)
  };
}
function startShow() {
  G.phase = 'show';
  G.time = SHOW_TIME;
  G.tamer = { x: 360, y: 635, dir: 1, stunT: 0, invulT: 0 };
  G.whipCd = 0;
  G.hazards = []; G.whips = []; G.floats = [];
  G.fences = []; G.visitors = [];
  for (var i = 0; i < 12; i++) {
    G.fences.push({ broken: false });
    G.visitors.push({ mode: 'watch', t: 0 });
  }
  G.smons = G.roster.map(function (e) {
    var a = rand(0, Math.PI * 2);
    return {
      id: nextId++, species: e.species, star: e.star,
      x: rand(ARENA.x0 + 60, ARENA.x1 - 60), y: rand(ARENA.y0 + 60, ARENA.y1 - 60),
      dir: 1, vx: Math.cos(a), vy: Math.sin(a), turnT: rand(2, 3),
      rage: 20, mode: 'roam', pt: null, perfT: 0, fxT: 0, fxKind: 'none',
      sub: 0, fence: -1, ram: 0, atk: 0, arrived: false
    };
  });
}
function endDungeon() {
  startTitle(G.day, 'show');
}
function endShow() {
  for (var i = 0; i < G.smons.length; i++) {
    var m = G.smons[i];
    if (m.mode !== 'roam') G.rep = Math.max(0, G.rep - 5);
  }
  for (var f = 0; f < G.fences.length; f++) G.fences[f].broken = false;
  G.hazards = []; G.floats = [];
  if (G.day >= DAYS) {
    G.stars = G.rep >= 260 ? 3 : (G.rep >= 150 ? 2 : (G.rep >= 60 ? 1 : 0));
    G.phase = 'result';
  } else {
    G.phase = 'shop';
  }
}

// ---------- 馴獸師 ----------
function moveTamer(dt, tx, ty, dungeon) {
  var t = G.tamer, sp = SPEED;
  if (dungeon && tileAt(t.x, t.y).kind === 'water') sp *= 0.5;
  var dx = tx - t.x, dy = ty - t.y, d = Math.hypot(dx, dy);
  if (d < 1e-6) return;
  var step = Math.min(sp * dt, d);
  var vx = dx / d * step, vy = dy / d * step;
  if (vx > 0.01) t.dir = 1; else if (vx < -0.01) t.dir = -1;
  if (dungeon) {
    if (!blockedCircle(t.x + vx, t.y, TAMER_R)) t.x += vx;
    if (!blockedCircle(t.x, t.y + vy, TAMER_R)) t.y += vy;
  } else {
    t.x = clamp(t.x + vx, ARENA.x0, ARENA.x1);
    t.y = clamp(t.y + vy, ARENA.y0, ARENA.y1);
  }
}
function camY() { return clamp(G.tamer.y - 700, 0, 640); }
function mouseWorld() {
  if (G.phase === 'dungeon') return { x: mouse.x, y: mouse.y - 120 + camY() };
  return { x: mouse.x, y: mouse.y };
}
function tamerHurtDungeon() {
  var t = G.tamer;
  if (t.invulT > 0) return;
  G.hearts = Math.max(0, G.hearts - 1);
  t.invulT = 1;
}
function tamerHurtShow() {
  var t = G.tamer;
  if (t.invulT > 0 || t.stunT > 0) return;
  t.stunT = 1.5;
  G.rep = Math.max(0, G.rep - 2);
  addFloat(t.x, t.y - 60, '名聲-2', 'repDown', false);
}
function tickTamerTimers(dt) {
  var t = G.tamer;
  if (t.stunT > 0) { t.stunT -= dt; if (t.stunT <= 0) { t.stunT = 0; t.invulT = 2; } }
  else if (t.invulT > 0) t.invulT = Math.max(0, t.invulT - dt);
  G.whipCd = Math.max(0, G.whipCd - dt);
}

// ---------- 技能(地下城與表演場共用) ----------
function castSkill(owner, kind, mult, tx, ty, perform) {
  var cast = { owner: owner, hit: {}, hitCount: 0, live: 0, perform: perform, done: false };
  function add(h) { h.cast = cast; h.t = 0; h.mult = mult; cast.live++; G.hazards.push(h); }
  if (kind === 'firering') add({ kind: 'firering', x: owner.x, y: owner.y, phase: 'warn', radius: 120 * mult, angle: 0 });
  else if (kind === 'thunder') add({ kind: 'thunder', x: tx, y: ty, phase: 'warn', radius: 70 * mult, angle: 0, fired: false });
  else if (kind === 'quake') add({ kind: 'quake', x: owner.x, y: owner.y, phase: 'active', radius: 0, angle: 0 });
  else if (kind === 'waterball') {
    var base = Math.atan2(ty - owner.y, tx - owner.x);
    var offs = [-10, 0, 10];
    for (var i = 0; i < 3; i++) {
      var a = base + offs[i] * Math.PI / 180;
      add({ kind: 'waterball', x: owner.x, y: owner.y, phase: 'active', radius: 12, angle: a, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300 });
    }
  }
}
function hazardTest(h, x, y, tr) {
  var d = Math.hypot(x - h.x, y - h.y);
  if (h.kind === 'firering') return h.phase === 'active' && d < h.radius + tr;
  if (h.kind === 'thunder') return h.phase === 'active' && !h.fired && d < h.radius + tr;
  if (h.kind === 'quake') return Math.abs(d - h.radius) < 15 + tr;
  if (h.kind === 'waterball') return d < 12 + tr;
  return false;
}
function setRage(m, v) {
  if (m.mode !== 'roam') return;
  m.rage = clamp(v, 0, 100);
  if (m.rage >= 100) startCharge(m);
}
function updateHazards(dt, dungeon) {
  var out = [];
  for (var i = 0; i < G.hazards.length; i++) {
    var h = G.hazards[i], dead = false;
    h.t += dt;
    if (h.kind === 'firering') {
      h.phase = h.t < 0.5 ? 'warn' : 'active';
      if (h.t >= 1.0) dead = true;
    } else if (h.kind === 'thunder') {
      h.phase = h.t < 0.8 ? 'warn' : 'active';
      if (h.t >= 1.05) dead = true;
    } else if (h.kind === 'quake') {
      h.radius = 220 * h.mult * Math.min(h.t, 1);
      if (h.t >= 1) dead = true;
    } else if (h.kind === 'waterball') {
      h.x += h.vx * dt; h.y += h.vy * dt;
      if (h.t > 3) dead = true;
      else if (dungeon && (solidTile(Math.floor(h.x / T), Math.floor(h.y / T)))) dead = true;
      else if (!dungeon && (h.x < -20 || h.x > W + 20 || h.y < 130 || h.y > 1150)) dead = true;
    }
    if (!dead) {
      var cast = h.cast;
      // 打馴獸師
      if (!cast.hit.T && hazardTest(h, G.tamer.x, G.tamer.y, TAMER_R)) {
        cast.hit.T = true;
        if (dungeon) tamerHurtDungeon(); else tamerHurtShow();
        if (h.kind === 'waterball') dead = true;
      }
      // 打其他魔物(只有表演場)
      if (!dungeon) {
        for (var k = 0; k < G.smons.length; k++) {
          var m = G.smons[k];
          if (m === cast.owner || m.mode !== 'roam' || cast.hit[m.id]) continue;
          if (hazardTest(h, m.x, m.y, 30)) {
            cast.hit[m.id] = true; cast.hitCount++;
            if (h.kind === 'waterball') { m.fxKind = 'doused'; setRage(m, m.rage - 20); }
            else { m.fxKind = 'ignited'; setRage(m, m.rage + 15); }
            m.fxT = 0.5;
          }
        }
      }
      if (h.kind === 'thunder' && h.phase === 'active') h.fired = true;
    }
    if (dead) {
      h.cast.live--;
      if (h.cast.live <= 0 && h.cast.perform && !h.cast.done) awardPerformance(h.cast);
    } else out.push(h);
  }
  G.hazards = out;
}
function awardPerformance(cast) {
  cast.done = true;
  var m = cast.owner, d = SP[m.species];
  var gold = Math.round(d.gold * m.star * (1 + 0.5 * cast.hitCount) * (1 + G.rep / 100));
  G.gold += gold; G.goldEarned += gold;
  G.rep += d.rep;
  addFloat(m.x, m.y - 60, '+' + gold, 'gold', false);
  addFloat(m.x + 40, m.y - 90, '名聲+' + d.rep, 'repUp', false);
}

// ---------- 地下城 ----------
function canStandWild(m, x, y) {
  var z = m.nest.zone, R = 20;
  var pts = [[0, 0], [R, R], [-R, R], [R, -R], [-R, -R]];
  for (var i = 0; i < pts.length; i++) {
    var px = x + pts[i][0], py = y + pts[i][1];
    var c = Math.floor(px / T), r = Math.floor(py / T);
    if (solidTile(c, r)) return false;
    if (c < z.c0 || c > z.c1 || r < z.r0 || r > z.r1) return false;
  }
  return true;
}
function tryMoveWild(m, vx, vy) {
  var nx = m.x + vx, ny = m.y + vy;
  if (canStandWild(m, nx, ny)) { m.x = nx; m.y = ny; return true; }
  if (canStandWild(m, nx, m.y)) { m.x = nx; return true; }
  if (canStandWild(m, m.x, ny)) { m.y = ny; return true; }
  return false;
}
function turnWild(m) {
  var z = m.nest.zone;
  var cx = (z.c0 + z.c1 + 1) * T / 2, cy = (z.r0 + z.r1 + 1) * T / 2;
  var a = Math.atan2(cy - m.y, cx - m.x) + rand(-1.2, 1.2);
  m.vx = Math.cos(a); m.vy = Math.sin(a); m.turnT = rand(2, 3);
}
function updateWild(m, dt) {
  m.hitT = Math.max(0, m.hitT - dt);
  m.castT = Math.max(0, m.castT - dt);
  var t = G.tamer;
  if (m.weak) {
    var dx = m.x - t.x, dy = m.y - t.y, d = Math.hypot(dx, dy) || 1;
    var vx = dx / d * FLEE * dt, vy = dy / d * FLEE * dt;
    tryMoveWild(m, vx, vy);
    if (Math.abs(vx) > 0.01) m.dir = vx > 0 ? 1 : -1;
    return;
  }
  m.turnT -= dt;
  if (m.turnT <= 0) { var a = rand(0, Math.PI * 2); m.vx = Math.cos(a); m.vy = Math.sin(a); m.turnT = rand(2, 3); }
  if (!tryMoveWild(m, m.vx * WALK * dt, m.vy * WALK * dt)) turnWild(m);
  if (Math.abs(m.vx) > 0.05) m.dir = m.vx > 0 ? 1 : -1;
  m.cd = Math.max(0, m.cd - dt);
  if (m.cd <= 0 && Math.hypot(m.x - t.x, m.y - t.y) < 400) {
    castSkill(m, SP[m.species].skill, 1, t.x, t.y, false);
    m.castT = 0.5;
    m.cd = SP[m.species].interval;
  }
}
function removeWild(m) {
  var i = G.monsters.indexOf(m);
  if (i >= 0) G.monsters.splice(i, 1);
  for (var n = 0; n < G.nests.length; n++) if (G.nests[n].monster === m) { G.nests[n].monster = null; G.nests[n].timer = 8; }
}
function captureWild(m) {
  G.ropes--;
  var e = null;
  for (var i = 0; i < G.roster.length; i++) if (G.roster[i].species === m.species) e = G.roster[i];
  if (!e) { G.roster.push({ species: m.species, star: 1 }); addFloat(m.x, m.y - 50, '收服', 'starUp', true); }
  else if (e.star >= 3) { G.gold += 20; G.goldEarned += 20; addFloat(m.x, m.y - 50, '+20', 'gold', true); }
  else { e.star++; addFloat(m.x, m.y - 50, '升星', 'starUp', true); }
  removeWild(m);
}
function whipDungeon() {
  var t = G.tamer, R = whipRadius();
  G.whips.push({ x: t.x, y: t.y, radius: R, t: 0, world: true });
  var list = G.monsters.slice();
  for (var i = 0; i < list.length; i++) {
    var m = list[i];
    if (Math.hypot(m.x - t.x, m.y - t.y) > R) continue;
    if (m.weak && G.ropes > 0) { captureWild(m); continue; }
    m.hp -= whipPower();
    m.hitT = 0.25;
    if (m.hp <= 0) {
      G.gold += 4; G.goldEarned += 4;
      addFloat(m.x, m.y - 50, '+4', 'gold', true);
      removeWild(m);
    } else if (m.hp <= m.maxHp * 0.3) m.weak = true;
  }
}
function updateDungeon(dt) {
  G.time -= dt;
  tickTamerTimers(dt);
  var w = mouseWorld();
  moveTamer(dt, w.x, w.y, true);
  if (G.tamer.invulT <= 0 && touchesKind(G.tamer.x, G.tamer.y, TAMER_R, 'lava')) tamerHurtDungeon();
  for (var i = 0; i < G.monsters.length; i++) updateWild(G.monsters[i], dt);
  for (var n = 0; n < G.nests.length; n++) {
    var nest = G.nests[n];
    if (!nest.monster) {
      nest.timer -= dt;
      if (nest.timer <= 0) { nest.monster = spawnWild(nest.def); G.monsters.push(nest.monster); }
    }
  }
  updateHazards(dt, true);
  if (G.hearts <= 0 || G.time <= 0) endDungeon();
}

// ---------- 表演場 ----------
function perfInterval(rage) { return 3 - 2 * clamp((rage - 50) / 49, 0, 1); }
function fenceIdxFor(side, x) {
  var best = -1, bd = 1e9, i, idx;
  for (i = 0; i < 6; i++) {
    idx = side * 6 + i;
    if (G.fences[idx].broken) continue;
    var d = Math.abs(SEAT_X[i] - x);
    if (d < bd) { bd = d; best = idx; }
  }
  if (best < 0) {
    for (i = 0; i < 6; i++) {
      var dd = Math.abs(SEAT_X[i] - x);
      if (dd < bd) { bd = dd; best = side * 6 + i; }
    }
  }
  return best;
}
function startCharge(m) {
  m.mode = 'charge';
  m.rage = 100; m.pt = null; m.sub = 0; m.ram = 0; m.arrived = false; m.atk = 0;
  var side = m.y < (ARENA.y0 + ARENA.y1) / 2 ? 0 : 1;
  m.side = side;
  m.fence = fenceIdxFor(side, m.x);
}
function moveToward(m, tx, ty, sp, dt) {
  var dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy);
  if (d < 1e-6) return true;
  var s = Math.min(sp * dt, d);
  m.x += dx / d * s; m.y += dy / d * s;
  if (Math.abs(dx) > 1) m.dir = dx > 0 ? 1 : -1;
  return d <= s + 0.01;
}
function scareVisitor(m) {
  var base = m.fence % 6, side = m.side, best = -1, bd = 1e9;
  for (var i = 0; i < 6; i++) {
    var v = G.visitors[side * 6 + i];
    if (v.mode !== 'watch') continue;
    var d = Math.abs(i - base);
    if (d < bd) { bd = d; best = side * 6 + i; }
  }
  if (best >= 0) { G.visitors[best].mode = 'scared'; G.visitors[best].t = 0; }
}
function updateShowMonster(m, dt) {
  m.fxT = Math.max(0, m.fxT - dt);
  m.perfT = Math.max(0, m.perfT - dt);
  var t = G.tamer;
  if (m.mode === 'roam') {
    m.rage = Math.max(0, m.rage - SP[m.species].decay * dt);
    m.turnT -= dt;
    if (m.turnT <= 0) { var a = rand(0, Math.PI * 2); m.vx = Math.cos(a); m.vy = Math.sin(a); m.turnT = rand(2, 3); }
    m.x += m.vx * WALK * dt; m.y += m.vy * WALK * dt;
    var mg = 45;
    if (m.x < ARENA.x0 + mg) { m.x = ARENA.x0 + mg; m.vx = Math.abs(m.vx); }
    if (m.x > ARENA.x1 - mg) { m.x = ARENA.x1 - mg; m.vx = -Math.abs(m.vx); }
    if (m.y < ARENA.y0 + mg) { m.y = ARENA.y0 + mg; m.vy = Math.abs(m.vy); }
    if (m.y > ARENA.y1 - mg) { m.y = ARENA.y1 - mg; m.vy = -Math.abs(m.vy); }
    if (Math.abs(m.vx) > 0.05) m.dir = m.vx > 0 ? 1 : -1;
    if (m.rage >= 50) {
      if (m.pt === null) m.pt = perfInterval(m.rage);
      m.pt -= dt;
      if (m.pt <= 0) {
        m.perfT = 0.5;
        castSkill(m, SP[m.species].skill, STAR_MULT[m.star], t.x, t.y, true);
        m.pt = perfInterval(m.rage);
      }
    } else m.pt = null;
    return;
  }
  // 失控
  if (m.mode === 'charge') {
    if (!m.arrived) {
      if (moveToward(m, SEAT_X[m.fence % 6], RAM_Y[m.side], CHARGE_SPD, dt)) { m.arrived = true; m.ram = 0; }
    } else {
      m.ram += dt;
      if (m.ram >= 1.5 || G.fences[m.fence].broken) { G.fences[m.fence].broken = true; m.mode = 'loose'; m.arrived = false; m.atk = 1.5; }
    }
  } else if (m.mode === 'loose') {
    if (!m.arrived) {
      if (moveToward(m, SEAT_X[m.fence % 6], LOOSE_Y[m.side], CHARGE_SPD, dt)) { m.arrived = true; m.atk = 1.5; }
    } else {
      m.atk -= dt;
      if (m.atk <= 0) {
        m.atk = 1.5;
        G.rep = Math.max(0, G.rep - 3);
        addFloat(m.x, m.y - 60, '名聲-3', 'repDown', false);
        scareVisitor(m);
      }
    }
  }
  // 制伏
  if (t.stunT <= 0 && Math.hypot(m.x - t.x, m.y - t.y) < 60) m.sub += dt; else m.sub = 0;
  if (m.sub >= 1.5) {
    if (m.fence >= 0) G.fences[m.fence].broken = false;
    m.mode = 'roam'; m.x = 360; m.y = 635; m.rage = 30; m.pt = null; m.sub = 0; m.arrived = false;
    m.fxT = 0; m.fxKind = 'none';
  }
}
function whipShow() {
  var t = G.tamer, R = whipRadius();
  G.whips.push({ x: t.x, y: t.y, radius: R, t: 0, world: false });
  for (var i = 0; i < G.smons.length; i++) {
    var m = G.smons[i];
    if (m.mode !== 'roam') continue;
    if (Math.hypot(m.x - t.x, m.y - t.y) <= R) setRage(m, m.rage + SP[m.species].whip);
  }
}
function updateShow(dt) {
  G.time -= dt;
  tickTamerTimers(dt);
  moveTamer(dt, mouse.x, mouse.y, false);
  for (var i = 0; i < G.smons.length; i++) updateShowMonster(G.smons[i], dt);
  for (var v = 0; v < G.visitors.length; v++) {
    var vis = G.visitors[v];
    if (vis.mode === 'watch') continue;
    vis.t += dt;
    if (vis.mode === 'scared' && vis.t >= 1) vis.mode = 'empty';
    if (vis.t >= 4) { vis.mode = 'watch'; vis.t = 0; }
  }
  updateHazards(dt, false);
  if (G.time <= 0) { G.time = 0; endShow(); }
}
function maxSubdue() {
  var p = 0;
  for (var i = 0; i < G.smons.length; i++) {
    var m = G.smons[i];
    if (m.mode !== 'roam') p = Math.max(p, m.sub / 1.5);
  }
  return Math.min(1, p);
}
function anyLoose() {
  for (var i = 0; i < G.smons.length; i++) if (G.smons[i].mode !== 'roam') return true;
  return false;
}

// ---------- 主更新 ----------
function update(dt) {
  if (G.phase === 'dungeon' || G.phase === 'show') {
    // 特效 / 飄字
    var i, o;
    for (i = 0; i < G.whips.length; i++) G.whips[i].t += dt;
    G.whips = G.whips.filter(function (w) { return w.t < 0.3; });
    for (i = 0; i < G.floats.length; i++) G.floats[i].t += dt;
    G.floats = G.floats.filter(function (f) { return f.t < 1.2; });
    if (G.phase === 'dungeon') updateDungeon(dt); else updateShow(dt);
  }
}

// ---------- 輸入(只有滑鼠) ----------
function toLogical(e) {
  var r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
}
window.addEventListener('mousemove', function (e) {
  var p = toLogical(e); mouse.x = p.x; mouse.y = p.y;
});
canvas.addEventListener('mousedown', function (e) {
  if (e.button !== 0) return;
  e.preventDefault();
  var p = toLogical(e); mouse.x = p.x; mouse.y = p.y;
  onClick(p.x, p.y);
});

function onClick(x, y) {
  var ph = G.phase;
  if (ph === 'guide') {
    if (G.guidePage > 0 && x < 260 && y > 1040 && y < 1160) { G.guidePage--; return; }
    if (G.guidePage < GUIDE.length - 1) { G.guidePage++; return; }
    // 最後一頁: 結束說明
    G.guideSeen = true;
    if (G.guideReturn) { G.phase = G.guideReturn; G.guideReturn = null; }
    else startTitle(1, 'dungeon');
    return;
  }
  if (ph === 'title') {
    if (G.title.stage === 'dungeon') startDungeon(); else startShow();
    return;
  }
  if (ph === 'dungeon' || ph === 'show' || ph === 'shop') {
    if (Math.hypot(x - HELP_BTN.x, y - HELP_BTN.y) <= HELP_BTN.r) {
      G.guideReturn = ph; G.guidePage = 0; G.phase = 'guide';
      return;
    }
  }
  if (ph === 'dungeon') {
    if (G.whipCd <= 0) { G.whipCd = WHIP_CD; whipDungeon(); }
    return;
  }
  if (ph === 'show') {
    if (G.whipCd <= 0 && G.tamer.stunT <= 0) { G.whipCd = WHIP_CD; whipShow(); }
    return;
  }
  if (ph === 'shop') {
    for (var i = 0; i < 4; i++) {
      if (Math.abs(x - 360) <= 300 && Math.abs(y - SHOP_Y[i]) <= 70) {
        var key = SHOP_ITEMS[i];
        if (G.gold >= G.cost[key]) {
          G.gold -= G.cost[key];
          G.cost[key] = Math.round(G.cost[key] * 1.5);
          G.lv[key]++;
        }
        return;
      }
    }
    if (x >= BTN.x && x <= BTN.x + BTN.w && y >= BTN.y && y <= BTN.y + BTN.h) {
      startTitle(G.day + 1, 'dungeon');
    }
    return;
  }
  if (ph === 'result') {
    var seen = G.guideSeen;
    newRun();
    G.guideSeen = seen;
    startTitle(1, 'dungeon');
    return;
  }
}

// ---------- 繪製 ----------
var GUIDE = [
  { title: '地下城', line: '馴獸師跟著游標走' },
  { title: '收服', line: '點一下甩鞭, 虛弱時再甩就收服' },
  { title: '表演', line: '甩鞭讓魔物生氣, 夠氣就表演' },
  { title: '別讓牠爆掉', line: '怒氣滿了會衝去咬觀眾' }
];
function hudState(phase, msg, sub) {
  return {
    phase: phase, day: G.day, gold: G.gold, rep: G.rep,
    hearts: G.hearts, maxHearts: maxHearts(), ropes: G.ropes, ropeMax: ropeMax(),
    roster: G.roster.map(function (e) { return { species: e.species, star: e.star }; }),
    timeLeft: Math.max(0, G.time), message: msg || '', subdueProgress: sub || 0
  };
}
function tamerState(sx, sy, sub) {
  var t = G.tamer;
  return { x: sx, y: sy, stunned: t.stunT > 0, blink: t.invulT > 0, subdueProgress: sub || 0, dir: t.dir };
}
function drawFloats(cam) {
  for (var i = 0; i < G.floats.length; i++) {
    var f = G.floats[i];
    Art.drawFloatText(ctx, { x: f.x, y: f.world ? f.y - cam + 120 : f.y, text: f.text, kind: f.kind, t: f.t });
  }
}
function drawHazards(cam, dungeon) {
  for (var i = 0; i < G.hazards.length; i++) {
    var h = G.hazards[i];
    Art.drawHazard(ctx, { x: h.x, y: dungeon ? h.y - cam + 120 : h.y, kind: h.kind, phase: h.phase, radius: h.radius, t: h.t, angle: h.angle });
  }
}
function drawWhips(cam) {
  for (var i = 0; i < G.whips.length; i++) {
    var w = G.whips[i];
    Art.drawWhipCrack(ctx, { x: w.x, y: w.world ? w.y - cam + 120 : w.y, radius: w.radius, t: w.t });
  }
}
function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  Art.drawBackground(ctx, {});
  var ph = G.phase, i;
  if (ph === 'guide') {
    var pg = GUIDE[G.guidePage];
    var hint = G.guidePage < 3 ? '點畫面繼續' : (G.guideReturn ? '點畫面關閉說明' : '點畫面開始遊戲');
    Placeholder.guideText(G.guidePage, 4, pg.title, pg.line, hint);
    Art.drawGuidePage(ctx, { page: G.guidePage + 1, x: 60, y: 240, w: 600, h: 660 });
  } else if (ph === 'title') {
    Art.drawTitleCard(ctx, { day: G.title.day, stage: G.title.stage });
    Placeholder.titleHint();
  } else if (ph === 'dungeon') {
    var cam = camY();
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 120, W, 1160); ctx.clip();
    var r0 = Math.max(0, Math.floor(cam / T)), r1 = Math.min(ROWS - 1, Math.floor((cam + 1160) / T));
    for (var r = r0; r <= r1; r++) for (var c = 0; c < COLS; c++) {
      var tl = TILES[r][c];
      Art.drawTile(ctx, { x: c * T + 30, y: r * T + 30 - cam + 120, kind: tl.kind, zone: tl.zone, nest: tl.nest });
    }
    drawHazards(cam, true);
    for (i = 0; i < G.monsters.length; i++) {
      var m = G.monsters[i];
      Art.drawWildMonster(ctx, { x: m.x, y: m.y - cam + 120, species: m.species, hp: m.hp, maxHp: m.maxHp, hit: m.hitT > 0, weak: m.weak, casting: m.castT > 0, dir: m.dir });
    }
    Art.drawTamer(ctx, tamerState(G.tamer.x, G.tamer.y - cam + 120, 0));
    drawWhips(cam);
    drawFloats(cam);
    ctx.restore();
    Art.drawHud(ctx, hudState('dungeon', '', 0));
    Placeholder.helpButton();
  } else if (ph === 'show') {
    Art.drawShowArena(ctx, {});
    for (i = 0; i < 12; i++) {
      var side = i < 6 ? 'top' : 'bottom';
      Art.drawFence(ctx, { x: SEAT_X[i % 6], y: FENCE_Y[i < 6 ? 0 : 1], side: side, broken: G.fences[i].broken });
    }
    for (i = 0; i < 12; i++) {
      Art.drawVisitor(ctx, { x: SEAT_X[i % 6], y: SEAT_Y[i < 6 ? 0 : 1], seat: i, mode: G.visitors[i].mode });
    }
    drawHazards(0, false);
    for (i = 0; i < G.smons.length; i++) {
      var s = G.smons[i];
      Art.drawShowMonster(ctx, {
        x: s.x, y: s.y, species: s.species, star: s.star, rage: s.rage, mode: s.mode,
        performing: s.perfT > 0, fx: s.fxT > 0 ? s.fxKind : 'none', dir: s.dir
      });
    }
    var sp = maxSubdue();
    Art.drawTamer(ctx, tamerState(G.tamer.x, G.tamer.y, sp));
    drawWhips(0);
    drawFloats(0);
    Art.drawHud(ctx, hudState('show', anyLoose() ? '游標停在牠身上制伏' : '', sp));
    Placeholder.helpButton();
  } else if (ph === 'shop') {
    Art.drawHud(ctx, hudState('shop', '點項目購買強化', 0));
    for (i = 0; i < 4; i++) {
      var key = SHOP_ITEMS[i];
      Art.drawShopItem(ctx, { x: 360, y: SHOP_Y[i], item: key, level: G.lv[key], cost: G.cost[key], affordable: G.gold >= G.cost[key] });
    }
    Art.drawButton(ctx, { x: BTN.x, y: BTN.y, w: BTN.w, h: BTN.h, label: '出發', enabled: true });
    Placeholder.helpButton();
  } else if (ph === 'result') {
    Art.drawResultPanel(ctx, {
      rep: G.rep, goldEarned: G.goldEarned, stars: G.stars,
      roster: G.roster.map(function (e) { return { species: e.species, star: e.star }; })
    });
    Placeholder.resultHint();
  }
}

// ---------- 主迴圈 ----------
var last = null;
function frame(ts) {
  if (last === null) last = ts;
  var dt = Math.min((ts - last) / 1000, 1 / 30);
  last = ts;
  if (dt < 0) dt = 0;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

newRun();
requestAnimationFrame(frame);

})();
