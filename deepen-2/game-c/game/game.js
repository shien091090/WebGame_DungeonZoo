(function () {
'use strict';

/* ================= 基本設定 ================= */
var CW = Art.canvas.width, CH = Art.canvas.height;
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
function fit() {
  var s = Math.min(window.innerWidth / CW, window.innerHeight / CH);
  if (!(s > 0)) s = 1;
  var dpr = window.devicePixelRatio || 1;
  canvas.style.width = Math.floor(CW * s) + 'px';
  canvas.style.height = Math.floor(CH * s) + 'px';
  canvas.width = Math.round(CW * s * dpr);
  canvas.height = Math.round(CH * s * dpr);
  ctx.setTransform(canvas.width / CW, 0, 0, canvas.height / CH, 0, 0);
}
window.addEventListener('resize', fit);
fit();

var TS = 60, COLS = 12, ROWS = 19, DY = 130;
var DAY_MAX = 7;
var SPECIES = ['fire', 'water', 'thunder', 'spike', 'stone', 'ghost'];
var SPD = {
  fire:    { name: '火蜥蜴', hp: 10, interval: 2.4, decay: 4, showGold: 5, showRep: 1, killGold: 4 },
  water:   { name: '水母',   hp: 7,  interval: 1.6, decay: 6, showGold: 3, showRep: 1, killGold: 4 },
  thunder: { name: '雷鳥',   hp: 14, interval: 2.6, decay: 8, showGold: 7, showRep: 2, killGold: 6 },
  spike:   { name: '刺蝟',   hp: 12, interval: 2.2, decay: 5, showGold: 5, showRep: 1, killGold: 6 },
  stone:   { name: '石像鬼', hp: 22, interval: 3.0, decay: 1, showGold: 6, showRep: 2, killGold: 8 },
  ghost:   { name: '幽靈',   hp: 16, interval: 2.8, decay: 3, showGold: 6, showRep: 2, killGold: 8 }
};
var DUNGEONS = ['cave', 'cliff', 'ruins'];
var DUN = {
  cave:  { name: '濕熱洞窟', top: 'fire',    bottom: 'water', rows: [
    '############', '#LL......LL#', '#L..f..f..L#', '#..........#', '#.L......L.#', '#..........#',
    '#####..#####', '#..WW......#', '#.j....WW..#', '#......j...#', '#.WW.......#', '#.....WW...#'] },
  cliff: { name: '雷鳴崖',   top: 'thunder', bottom: 'spike', cost: 60, need: 'water', needN: 2, rows: [
    '############', '#..t....t..#', '#.o......o.#', '#..........#', '#.o......o.#', '#..........#',
    '#####..#####', '#..........#', '#.h......h.#', '#...oo.....#', '#.......oo.#', '#..........#'] },
  ruins: { name: '古代遺跡', top: 'stone',   bottom: 'ghost', cost: 120, need: 'spike', needN: 2, rows: [
    '############', '#..........#', '#.g...o..g.#', '#....L.....#', '#.o......o.#', '#..........#',
    '#####..#####', '#..........#', '#.p..oo..p.#', '#..........#', '#.L......L.#', '#..........#'] }
};
var COMMON = ['#####..#####', '#..........#', '#..........#', '#....S.....#', '#..........#', '#..........#', '############'];
var NEST_SP = { f: 'fire', j: 'water', t: 'thunder', h: 'spike', g: 'stone', p: 'ghost' };
var ROOMS = { top: { x0: 60, y0: 60, x1: 660, y1: 360 }, bottom: { x0: 60, y0: 420, x1: 660, y1: 720 } };
var WEAPONS = ['club', 'sword', 'spear', 'whip'];
var WEAPON_DESC = { club: 'Z 敲擊 X 無', sword: 'Z 斬擊可打回飛彈 X 擊暈', spear: 'Z 長刺 X 突進', whip: 'Z 整圈抽打 X 擊飛' };
var GADGETS = {
  drum:     { name: '戰鼓',   cost: 15, desc: '每 3 秒讓周圍魔物生氣' },
  fountain: { name: '噴泉',   cost: 15, desc: '每 3 秒讓周圍魔物冷靜' },
  bait:     { name: '肉塊',   cost: 10, desc: '把附近魔物吸過來' },
  valve:    { name: '安全閥', cost: 20, desc: '周圍魔物快失控時自動降標記一次' }
};
var GADGET_KEYS = ['drum', 'fountain', 'bait', 'valve'];
var FACE = [[0, -1], [1, -1], [2, 0], [1, 1], [0, 1], [-1, 1], [-2, 0], [-1, -1]];
(function () { // 面向向量正規化
  FACE = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]].map(function (v) {
    var l = Math.hypot(v[0], v[1]); return [v[0] / l, v[1] / l];
  });
})();
var FIELD = { x0: 60, y0: 270, x1: 660, y1: 990 };

/* 地圖解析 */
var MAPS = {};
DUNGEONS.forEach(function (d) {
  var rows = DUN[d].rows.concat(COMMON), grid = [], nests = [];
  for (var r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (var c = 0; c < COLS; c++) {
      var ch = rows[r].charAt(c), kind = 'floor', nest = false;
      if (ch === '#') kind = 'wall'; else if (ch === 'o') kind = 'pillar';
      else if (ch === 'L') kind = 'lava'; else if (ch === 'W') kind = 'water';
      else if (NEST_SP[ch]) { nest = true; nests.push({ col: c, row: r, species: NEST_SP[ch], x: c * TS + 30, y: r * TS + 30 }); }
      var room = 'hall';
      if (c >= 1 && c <= 10 && r >= 1 && r <= 5) room = 'top';
      else if (c >= 1 && c <= 10 && r >= 7 && r <= 11) room = 'bottom';
      grid[r][c] = { kind: kind, nest: nest, room: room, start: ch === 'S' };
    }
  }
  MAPS[d] = { grid: grid, nests: nests };
});

/* ================= 工具 ================= */
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function rnd(a, b) { return a + Math.random() * (b - a); }
function angdiff(a, b) { var d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

/* ================= 全域狀態 ================= */
var G, phase = 'guide';
var guide = { page: 0, back: null };
var keys = {}, block = {};
var selIdx = 0;            // 地下城選擇
var s1 = { idx: 0, picked: [] };
var s2 = { cur: 0, placed: [], panel: null };
var shopIdx = 0;
var msg = '';

// 地下城
var D = null;
// 表演場
var S = null;

function resetAll() {
  G = {
    day: 1, gold: 30, rep: 0, goldEarned: 0, edgeShows: 0,
    roster: { fire: { level: 0 } }, caught: { fire: 0, water: 0, thunder: 0, spike: 0, stone: 0, ghost: 0 },
    weapon: 'club', owned: { club: true, sword: false, spear: false, whip: false },
    up: { attack: 0, armor: 0, ropeBag: 0 },
    unlocked: { cave: true, cliff: false, ruins: false }
  };
  selIdx = 0; shopIdx = 0; D = null; S = null;
}
resetAll();

function lv(sp) { return G.roster[sp] ? G.roster[sp].level : -1; }
function lvb(sp) { return Math.max(0, lv(sp)); }
function addGold(n) { G.gold += n; if (n > 0) G.goldEarned += n; }
function setPhase(p) {
  phase = p;
  block.z = !!keys.z; block.x = !!keys.x;
  msg = '';
}
function upPrice(k) {
  var p = { attack: 50, armor: 40, ropeBag: 40 }[k];
  for (var i = 0; i < G.up[k]; i++) p = Math.round(p * 1.5);
  return p;
}

/* ================= 輸入(只有方向鍵 + Z、X) ================= */
function keyName(e) {
  switch (e.key) {
    case 'ArrowUp': return 'up'; case 'ArrowDown': return 'down';
    case 'ArrowLeft': return 'left'; case 'ArrowRight': return 'right';
    case 'z': case 'Z': return 'z'; case 'x': case 'X': return 'x';
  }
  return null;
}
window.addEventListener('keydown', function (e) {
  var k = keyName(e);
  if (!k) return;
  e.preventDefault();
  if (e.repeat) return;
  keys[k] = true;
  onPress(k);
});
window.addEventListener('keyup', function (e) {
  var k = keyName(e);
  if (!k) return;
  e.preventDefault();
  keys[k] = false; block[k] = false;
});
window.addEventListener('blur', function () { keys = {}; block = {}; });

function onPress(k) {
  switch (phase) {
    case 'guide': guideKey(k); break;
    case 'select': selectKey(k); break;
    case 'setup1': setup1Key(k); break;
    case 'setup2': setup2Key(k); break;
    case 'shop': shopKey(k); break;
    case 'result': if (k === 'z') { resetAll(); setPhase('select'); } break;
  }
}

/* ================= 說明頁 ================= */
var GUIDE_TITLES = ['地下城', '收服', '布置', '紅區', '目標'];
var GUIDE_TEXT = [
  '方向鍵走, Z 攻擊, X 武器技',
  '殘血時站上去, 再繞牠一圈',
  '開演前擺好魔物與機關, 開演後只能看',
  '標記越多越賺, 滿 5 個就失控',
  '7 天內賺到越多名聲越好'
];
var GUIDE_BOX = { x: 60, y: 160, w: 600, h: 780 };
function openGuide() { guide.page = 0; guide.back = phase; setPhase('guide'); }
function closeGuide() {
  if (guide.back) { var b = guide.back; guide.back = null; setPhase(b); }
  else setPhase('select');
}
function guideKey(k) {
  if (k === 'z' || k === 'right') { if (guide.page < GUIDE_TITLES.length - 1) guide.page++; else closeGuide(); }
  else if (k === 'left') { if (guide.page > 0) guide.page--; }
  else if (k === 'x') { if (guide.back) closeGuide(); }
}
function drawText(t, x, y, size, color, align, bold) {
  ctx.save();
  ctx.font = (bold ? 'bold ' : '') + size + 'px "Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';
  ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(t, x, y);
  ctx.restore();
}
function renderGuide() {
  var p = guide.page;
  drawText('第 ' + (p + 1) + ' 頁  ' + GUIDE_TITLES[p], CW / 2, 80, 44, '#fff', 'center', true);
  Art.drawGuidePage(ctx, { page: p, x: GUIDE_BOX.x, y: GUIDE_BOX.y, w: GUIDE_BOX.w, h: GUIDE_BOX.h });
  drawText(GUIDE_TEXT[p], CW / 2, 1010, 32, '#fff', 'center', true);
  drawText((p + 1) + ' / ' + GUIDE_TITLES.length, CW / 2, 1100, 28, '#ddd');
  var hint = (p === GUIDE_TITLES.length - 1 ? '按 Z ' + (guide.back ? '關閉說明' : '開始遊戲') : '按 Z 繼續');
  drawText(hint, CW / 2, 1170, 26, '#ffd866');
  drawText('← 上一頁' + (guide.back ? '   X 關閉' : ''), CW / 2, 1225, 22, '#aaa');
}

/* ================= 地下城選擇 ================= */
function unlockCond(d) {
  var u = DUN[d];
  if (!u.cost) return '';
  return '金幣 ' + u.cost + ' + 收服' + SPD[u.need].name + ' ' + Math.min(G.caught[u.need], u.needN) + '/' + u.needN;
}
function canUnlock(d) { var u = DUN[d]; return G.gold >= u.cost && G.caught[u.need] >= u.needN; }
function selectKey(k) {
  if (k === 'up') selIdx = Math.max(0, selIdx - 1);
  else if (k === 'down') selIdx = Math.min(2, selIdx + 1);
  else if (k === 'x') openGuide();
  else if (k === 'z') {
    var d = DUNGEONS[selIdx];
    if (G.unlocked[d]) startDungeon(d);
    else if (canUnlock(d)) { G.gold -= DUN[d].cost; G.unlocked[d] = true; }
  }
}

/* ================= 地下城 ================= */
function stoneBonus() { return lvb('stone'); }
function calcMaxHearts() { return 5 + G.up.armor + stoneBonus(); }
function ropeMax() { return 3 + G.up.ropeBag; }
function atkBonus() { return G.up.attack; }
function tamerSpeed() { return 300 + 25 * lvb('thunder'); }
function lassoLimit() { return 5 + lvb('ghost'); }
function ringDur() { return Math.max(0.35, 0.8 - 0.15 * lvb('water')); }
function xCdMax() {
  var b = { club: 0, sword: 3, spear: 1.2, whip: 1.2 }[G.weapon];
  return b ? b * (1 - 0.15 * lvb('spike')) : 0;
}
function monR(m) { return m.species === 'stone' ? 42 : 30; }

function startDungeon(d) {
  var map = MAPS[d];
  var mh = calcMaxHearts();
  D = {
    id: d, map: map, time: 60,
    T: { x: 5 * TS + 30, y: 15 * TS + 30, facing: 0, hearts: mh, maxHearts: mh, ropes: ropeMax(), invuln: 0, zCd: 0, xCd: 0, dashT: 0, dashHit: [] },
    mons: [], hazards: [], fx: [], floats: [], ring: null, lasso: null,
    nests: map.nests.map(function (n) { return { col: n.col, row: n.row, species: n.species, x: n.x, y: n.y, mon: null, timer: 0 }; })
  };
  D.nests.forEach(function (n) { spawnAt(n); });
  setPhase('dungeon');
}
function spawnAt(n) {
  var sp = SPD[n.species];
  var m = { species: n.species, x: n.x, y: n.y, hp: sp.hp, maxHp: sp.hp, hitT: 0, stun: 0, lassoed: false, castHaz: null, castFlash: 0,
    cd: rnd(0.8, sp.interval), dir: 1, kb: null, dashT: 0, dashCd: rnd(0.5, 2), dashAng: 0, wT: 0, wAng: rnd(0, 6.28),
    vAng: rnd(0, 6.28), vT: 4, tpT: 3, dead: false, nest: n, room: roomOfRow(n.row) };
  m.mr = monR(m);
  n.mon = m; n.timer = 0;
  D.mons.push(m);
}
function roomOfRow(r) { return r <= 6 ? 'top' : 'bottom'; }
function isWeak(m) { return m.hp <= m.maxHp * 0.3; }

function solidAt(c, r) {
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
  var k = D.map.grid[r][c].kind; return k === 'wall' || k === 'pillar';
}
function circleRect(x, y, r, c, rr) {
  var nx = clamp(x, c * TS, c * TS + TS), ny = clamp(y, rr * TS, rr * TS + TS);
  return (x - nx) * (x - nx) + (y - ny) * (y - ny) < r * r;
}
function blockedAt(x, y, r) {
  var c0 = Math.floor((x - r) / TS), c1 = Math.floor((x + r) / TS), r0 = Math.floor((y - r) / TS), r1 = Math.floor((y + r) / TS);
  for (var rr = r0; rr <= r1; rr++) for (var c = c0; c <= c1; c++) if (solidAt(c, rr) && circleRect(x, y, r, c, rr)) return true;
  return false;
}
function touchingLava(x, y, r) {
  var c0 = Math.floor((x - r) / TS), c1 = Math.floor((x + r) / TS), r0 = Math.floor((y - r) / TS), r1 = Math.floor((y + r) / TS);
  for (var rr = r0; rr <= r1; rr++) for (var c = c0; c <= c1; c++) {
    if (c < 0 || rr < 0 || c >= COLS || rr >= ROWS) continue;
    if (D.map.grid[rr][c].kind === 'lava' && circleRect(x, y, r, c, rr)) return true;
  }
  return false;
}
function onWater(x, y) {
  var c = Math.floor(x / TS), r = Math.floor(y / TS);
  return c >= 0 && r >= 0 && c < COLS && r < ROWS && D.map.grid[r][c].kind === 'water';
}
// 移動馴獸師, 回傳是否被擋(撞牆)
function moveTamer(dx, dy) {
  var T = D.T, len = Math.hypot(dx, dy), n = Math.max(1, Math.ceil(len / 8)), hitWall = false;
  for (var i = 0; i < n; i++) {
    var sx = dx / n, sy = dy / n;
    if (sx) { if (!blockedAt(T.x + sx, T.y, 18)) T.x += sx; else hitWall = true; }
    if (sy) { if (!blockedAt(T.x, T.y + sy, 18)) T.y += sy; else hitWall = true; }
  }
  return hitWall;
}
function faceAng() { var f = FACE[D.T.facing]; return Math.atan2(f[1], f[0]); }

function addFloat(x, y, text, kind) { (D ? D.floats : S.floats).push({ x: x, y: y, text: text, kind: kind, t: 0, dur: 1 }); }
function addFloatTo(arr, x, y, text, kind) { arr.push({ x: x, y: y, text: text, kind: kind, t: 0, dur: 1 }); }

function hurtTamer() {
  var T = D.T;
  if (T.invuln > 0 || T.dashT > 0) return;
  T.hearts--; T.invuln = 1;
  if (D.lasso) breakLasso();
}
function breakLasso() { if (D.lasso) { D.lasso.m.lassoed = false; D.lasso = null; } }
function cancelWarn(m) {
  D.hazards.forEach(function (h) { if (h.owner === m && h.phase === 'warn') h.dead = true; });
  m.castHaz = null;
}
function removeMon(m) {
  m.dead = true;
  if (m.nest && m.nest.mon === m) { m.nest.mon = null; m.nest.timer = 8; }
  cancelWarn(m);
  if (D.ring && D.ring.m === m) D.ring = null;
  if (D.lasso && D.lasso.m === m) D.lasso = null;
}
function dmgMon(m, dmg) {
  if (m.dead || m.lassoed) return false;
  m.hp -= dmg; m.hitT = 0.1;
  if (D.ring && D.ring.m === m) D.ring = null;
  if (m.hp <= 0) {
    removeMon(m);
    var g = SPD[m.species].killGold; addGold(g);
    addFloat(m.x, m.y, '+' + g, 'gold');
  }
  return true;
}

/* 武器 */
function fxPush(o) { o.t = 0; if (!o.dur) o.dur = 0.2; D.fx.push(o); }
function inArc(m, cx, cy, ang, spread, R) {
  var dx = m.x - cx, dy = m.y - cy, d = Math.hypot(dx, dy), mr = m.mr * 0.6;
  if (d > R + mr) return false;
  if (d <= mr + 10) return true;
  var tol = Math.asin(Math.min(1, mr / d));
  return Math.abs(angdiff(ang, Math.atan2(dy, dx))) <= spread / 2 + tol;
}
function inLine(m, cx, cy, ang, len, wid) {
  var dx = m.x - cx, dy = m.y - cy, cs = Math.cos(ang), sn = Math.sin(ang);
  var lx = dx * cs + dy * sn, ly = -dx * sn + dy * cs, mr = m.mr * 0.6;
  return lx >= -mr * 0.5 && lx <= len + mr && Math.abs(ly) <= wid / 2 + mr;
}
function inCircle(m, cx, cy, R) { return Math.hypot(m.x - cx, m.y - cy) <= R + m.mr * 0.6; }
function liveMons() { return D.mons.filter(function (m) { return !m.dead; }); }

function reflectProj(h) {
  var T = D.T, tgt = h.owner && !h.owner.dead ? h.owner : null, a;
  if (tgt) a = Math.atan2(tgt.y - T.y, tgt.x - T.x); else a = h.angle + Math.PI;
  h.angle = a; h.speed *= 1.2; h.reflected = true; h.homing = false;
}

function attackZ() {
  var T = D.T, w = G.weapon, a = faceAng(), fb = 1 + 0.1 * lvb('fire'), dmg;
  if (T.zCd > 0 || T.dashT > 0) return;
  var ex = { x: T.x, y: T.y, weapon: w, move: 'normal', angle: a };
  if (w === 'club' || w === 'sword') {
    var R = (w === 'club' ? 70 : 80) * fb, sp = (w === 'club' ? 100 : 120) * Math.PI / 180;
    ex.shape = 'arc'; ex.spread = sp; ex.radius = R; fxPush(ex);
    liveMons().forEach(function (m) { if (inArc(m, T.x, T.y, a, sp, R)) dmgMon(m, 2 + atkBonus()); });
    if (w === 'sword') D.hazards.forEach(function (h) {
      if (h.proj && !h.reflected && !h.dead) {
        var hh = { x: h.x, y: h.y, mr: h.radius / 0.6 };
        if (inArc(hh, T.x, T.y, a, sp, R)) reflectProj(h);
      }
    });
    T.zCd = w === 'club' ? 0.35 : 0.35;
  } else if (w === 'spear') {
    var L = 170 * fb;
    ex.shape = 'line'; ex.length = L; ex.width = 40; fxPush(ex);
    liveMons().forEach(function (m) { if (inLine(m, T.x, T.y, a, L, 40)) dmgMon(m, 2 + atkBonus()); });
    T.zCd = 0.45;
  } else if (w === 'whip') {
    var RR = 100 * fb;
    ex.shape = 'circle'; ex.radius = RR; fxPush(ex);
    liveMons().forEach(function (m) { if (inCircle(m, T.x, T.y, RR)) dmgMon(m, 1 + atkBonus()); });
    T.zCd = 0.4;
  }
}
function attackX() {
  var T = D.T, w = G.weapon, a = faceAng(), mx = xCdMax();
  if (!mx || T.xCd > 0 || T.dashT > 0) return;
  var ex = { x: T.x, y: T.y, weapon: w, move: 'skill', angle: a };
  if (w === 'sword') {
    var sp = 120 * Math.PI / 180;
    ex.shape = 'arc'; ex.spread = sp; ex.radius = 80; fxPush(ex);
    liveMons().forEach(function (m) { if (inArc(m, T.x, T.y, a, sp, 80)) { m.stun = 2; cancelWarn(m); } });
  } else if (w === 'spear') {
    T.dashT = 0.25; T.dashHit = [];
    ex.shape = 'dash'; ex.length = 220; ex.dur = 0.25; fxPush(ex);
  } else if (w === 'whip') {
    var sp2 = 100 * Math.PI / 180;
    ex.shape = 'arc'; ex.spread = sp2; ex.radius = 170; fxPush(ex);
    liveMons().forEach(function (m) {
      if (inArc(m, T.x, T.y, a, sp2, 170)) {
        var hit = dmgMon(m, 2 + atkBonus());
        if (hit && !m.dead) { var ka = Math.atan2(m.y - T.y, m.x - T.x); m.kb = { vx: Math.cos(ka) * 640, vy: Math.sin(ka) * 640, t: 0.25 }; cancelWarn(m); }
      }
    });
  }
  T.xCd = mx;
}

/* 魔物行為(地下城 / 表演場共用) */
function moveClamped(m, vx, vy, dt, b) {
  var bounced = false;
  m.x += vx * dt; m.y += vy * dt;
  var mr = m.mr;
  if (m.x < b.x0 + mr) { m.x = b.x0 + mr; bounced = 'x'; } else if (m.x > b.x1 - mr) { m.x = b.x1 - mr; bounced = 'x'; }
  if (m.y < b.y0 + mr) { m.y = b.y0 + mr; bounced = bounced ? 'xy' : 'y'; } else if (m.y > b.y1 - mr) { m.y = b.y1 - mr; bounced = bounced ? 'xy' : 'y'; }
  if (vx) m.dir = vx > 0 ? 1 : -1;
  return bounced;
}
function wander(m, dt, b, F) {
  m.wT -= dt;
  if (m.wT <= 0) { m.wT = rnd(2, 3); m.wAng = rnd(0, Math.PI * 2); }
  moveClamped(m, Math.cos(m.wAng) * 40 * F, Math.sin(m.wAng) * 40 * F, dt, b);
}
function toward(m, tx, ty, sp, dt, b) {
  var dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy) || 1;
  moveClamped(m, dx / d * sp, dy / d * sp, dt, b);
}
// engage: 是否有對象可追 / 保持距離; tgt: {x,y}
function behave(m, dt, tgt, engage, b, F, teleportFn) {
  var sp = m.species;
  if (sp === 'fire') {
    if (engage && tgt) { var d = dist(m, tgt); if (d > 80) toward(m, tgt.x, tgt.y, 70 * F, dt, b); else m.dir = tgt.x >= m.x ? 1 : -1; }
    else wander(m, dt, b, F);
  } else if (sp === 'water') {
    if (engage && tgt) {
      var d2 = dist(m, tgt);
      if (d2 < 220) toward(m, 2 * m.x - tgt.x, 2 * m.y - tgt.y, 60 * F, dt, b);
      else if (d2 > 320) toward(m, tgt.x, tgt.y, 40 * F, dt, b);
      else m.dir = tgt.x >= m.x ? 1 : -1;
    } else wander(m, dt, b, F);
  } else if (sp === 'thunder') {
    if (m.dashT > 0) {
      m.dashT -= dt;
      moveClamped(m, Math.cos(m.dashAng) * 600 * F, Math.sin(m.dashAng) * 600 * F, dt, b);
    } else {
      m.dashCd -= dt;
      if (m.dashCd <= 0) { m.dashCd = 2; m.dashT = 0.3; m.dashAng = rnd(0, Math.PI * 2); }
    }
  } else if (sp === 'spike') {
    m.vT -= dt;
    if (m.vT <= 0) { m.vT = 4; m.vAng = rnd(0, Math.PI * 2); }
    var vx = Math.cos(m.vAng) * 110 * F, vy = Math.sin(m.vAng) * 110 * F;
    var bn = moveClamped(m, vx, vy, dt, b);
    if (bn) {
      if (bn.indexOf('x') >= 0) m.vAng = Math.PI - m.vAng;
      if (bn.indexOf('y') >= 0) m.vAng = -m.vAng;
    }
  } else if (sp === 'ghost') {
    m.tpT -= dt;
    if (m.tpT <= 0) { m.tpT = 3; teleportFn(m); }
  }
}

/* 技能(共用) */
function cast(m, tx, ty, perf) {
  var sp = m.species, list = [], a = Math.atan2(ty - m.y, tx - m.x), i;
  if (sp === 'fire') list.push({ kind: 'firering', phase: 'warn', dur: 0.5, activeDur: 0.5, radius: 120, x: m.x, y: m.y, follow: true });
  else if (sp === 'thunder') list.push({ kind: 'thunder', phase: 'warn', dur: 0.8, activeDur: 0.2, radius: 70, x: tx, y: ty });
  else if (sp === 'stone') list.push({ kind: 'quake', phase: 'active', dur: 1, activeDur: 1, radius: 0, x: m.x, y: m.y });
  else if (sp === 'water') for (i = -1; i <= 1; i++) list.push({ kind: 'waterball', proj: true, phase: 'fly', dur: 0, radius: 12, speed: 300, angle: a + i * 20 * Math.PI / 180, x: m.x, y: m.y });
  else if (sp === 'spike') for (i = 0; i < 8; i++) list.push({ kind: 'spike', proj: true, phase: 'fly', dur: 0, radius: 10, speed: 260, angle: i * Math.PI / 4, x: m.x, y: m.y });
  else if (sp === 'ghost') list.push({ kind: 'wisp', proj: true, phase: 'fly', dur: 3, life: 3, radius: 14, speed: 160, angle: a, x: m.x, y: m.y, homing: true });
  list.forEach(function (h) {
    h.t = 0; h.owner = m; h.perf = perf || null; h.hits = []; h.reflected = false; h.dead = false;
    if (perf) perf.pending++;
    (D ? D.hazards : S.hazards).push(h);
  });
  if (D) {
    var area = sp === 'fire' || sp === 'thunder';
    if (area) m.castHaz = list[0]; else m.castFlash = 0.25;
  }
}
function areaInside(h, m, tol) {
  var d = Math.hypot(m.x - h.x, m.y - h.y);
  if (h.kind === 'quake') return Math.abs(d - h.radius) <= 15 + tol;
  return d <= h.radius + tol;
}
function areaHit(h) {
  if (D) {
    if (!h.hitT && areaInside(h, D.T, 18)) { h.hitT = true; hurtTamer(); }
  } else {
    S.mons.forEach(function (m) {
      if (m === h.owner || m.mode !== 'roam' || h.hits.indexOf(m) >= 0) return;
      if (areaInside(h, m, 20)) { h.hits.push(m); skillHit(m, h); }
    });
  }
}
function skillHit(m, h) {
  if (h.perf) h.perf.hits++;
  var k = h.kind;
  if (k === 'waterball') douse(m, 20);
  else if (k === 'wisp') douse(m, 15);
  else ignite(m, k === 'spike' ? 10 : 15);
}
function updHazards(dt) {
  var arr = D ? D.hazards : S.hazards;
  arr.forEach(function (h) {
    if (h.dead) return;
    if (h.proj) updProj(h, dt); else updArea(h, dt);
  });
  var keep = [];
  arr.forEach(function (h) {
    if (h.dead) { if (h.perf) h.perf.pending--; if (h.owner && h.owner.castHaz === h) h.owner.castHaz = null; } else keep.push(h);
  });
  if (D) D.hazards = keep; else S.hazards = keep;
}
function updArea(h, dt) {
  if (h.phase === 'warn') {
    if (h.follow && h.owner) { if (h.owner.dead) { h.dead = true; return; } h.x = h.owner.x; h.y = h.owner.y; }
    h.t += dt;
    if (h.t >= h.dur) { h.phase = 'active'; h.t = 0; h.dur = h.activeDur; if (h.kind === 'thunder') areaHit(h); }
  } else {
    h.t += dt;
    if (h.kind === 'quake') h.radius = 220 * Math.min(1, h.t / h.dur);
    if (h.kind !== 'thunder') areaHit(h);
    if (h.t >= h.dur) h.dead = true;
  }
}
function nearestValidShow(from, excl) {
  var best = null, bd = 1e9;
  S.mons.forEach(function (m) {
    if (m === excl || m.mode !== 'roam') return;
    var d = dist(from, m); if (d < bd) { bd = d; best = m; }
  });
  return best;
}
function updProj(h, dt) {
  if (h.homing) {
    var tg = D ? D.T : nearestValidShow(h, h.owner);
    if (tg) {
      var diff = angdiff(h.angle, Math.atan2(tg.y - h.y, tg.x - h.x)), mx = 120 * Math.PI / 180 * dt;
      h.angle += clamp(diff, -mx, mx);
    }
  }
  h.x += Math.cos(h.angle) * h.speed * dt; h.y += Math.sin(h.angle) * h.speed * dt;
  h.t += dt;
  if (h.life && h.t >= h.life) { h.dead = true; return; }
  if (D) {
    if (solidAt(Math.floor(h.x / TS), Math.floor(h.y / TS))) { h.dead = true; return; }
    if (h.reflected) {
      for (var i = 0; i < D.mons.length; i++) {
        var m = D.mons[i];
        if (m.dead || m.lassoed) continue;
        if (Math.hypot(m.x - h.x, m.y - h.y) <= h.radius + m.mr) { dmgMon(m, 3 + atkBonus()); h.dead = true; return; }
      }
    } else {
      var T = D.T;
      if (T.invuln <= 0 && T.dashT <= 0 && Math.hypot(T.x - h.x, T.y - h.y) <= h.radius + 18) { hurtTamer(); h.dead = true; }
    }
  } else {
    if (h.x < FIELD.x0 || h.x > FIELD.x1 || h.y < FIELD.y0 || h.y > FIELD.y1) { h.dead = true; return; }
    for (var j = 0; j < S.mons.length; j++) {
      var sm = S.mons[j];
      if (sm === h.owner || sm.mode !== 'roam') continue;
      if (Math.hypot(sm.x - h.x, sm.y - h.y) <= h.radius + 30) { h.hits.push(sm); skillHit(sm, h); h.dead = true; return; }
    }
  }
}

/* 地下城更新 */
function updateDungeon(dt) {
  var T = D.T;
  D.time -= dt;
  T.zCd = Math.max(0, T.zCd - dt); T.xCd = Math.max(0, T.xCd - dt); T.invuln = Math.max(0, T.invuln - dt);

  // 移動
  if (T.dashT > 0) {
    var f = FACE[T.facing], step = Math.min(dt, T.dashT);
    var blocked = moveTamer(f[0] * 880 * step, f[1] * 880 * step);
    T.dashT -= dt;
    if (blocked) T.dashT = 0;
    liveMons().forEach(function (m) {
      if (T.dashHit.indexOf(m) < 0 && !m.lassoed && Math.hypot(m.x - T.x, m.y - T.y) <= 18 + m.mr * 0.8) { T.dashHit.push(m); dmgMon(m, 3 + atkBonus()); }
    });
    if (T.dashT < 0) T.dashT = 0;
  } else {
    var dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (dx || dy) {
      for (var i = 0; i < 8; i++) { var fv = Math.round(FACE[i][0] * 1000) === Math.round(dx / Math.hypot(dx, dy) * 1000) && Math.round(FACE[i][1] * 1000) === Math.round(dy / Math.hypot(dx, dy) * 1000); if (fv) T.facing = i; }
      var sp = tamerSpeed() * (onWater(T.x, T.y) ? 0.5 : 1), l = Math.hypot(dx, dy);
      moveTamer(dx / l * sp * dt, dy / l * sp * dt);
    }
    if (keys.z && !block.z) attackZ();
    if (keys.x && !block.x) attackX();
  }
  if (T.invuln <= 0 && T.dashT <= 0 && touchingLava(T.x, T.y, 18)) hurtTamer();

  // 魔物
  D.mons.forEach(function (m) { if (!m.dead) updDMonster(m, dt); });
  D.mons = D.mons.filter(function (m) { return !m.dead; });
  D.nests.forEach(function (n) {
    if (!n.mon) { n.timer -= dt; if (n.timer <= 0) spawnAt(n); }
  });

  updHazards(dt);
  updCapture(dt);

  D.fx.forEach(function (f) { f.t += dt; });
  D.fx = D.fx.filter(function (f) { return f.t < f.dur; });
  D.floats.forEach(function (f) { f.t += dt; });
  D.floats = D.floats.filter(function (f) { return f.t < f.dur; });

  if (T.hearts <= 0 || D.time <= 0) endDungeon();
}
function updDMonster(m, dt) {
  var T = D.T, room = ROOMS[m.room];
  var b = { x0: room.x0, y0: room.y0, x1: room.x1, y1: room.y1 };
  m.hitT = Math.max(0, m.hitT - dt); m.castFlash = Math.max(0, m.castFlash - dt);
  if (m.stun > 0) m.stun = Math.max(0, m.stun - dt);
  if (m.kb) {
    moveClamped(m, m.kb.vx, m.kb.vy, dt, b);
    m.kb.t -= dt; if (m.kb.t <= 0) m.kb = null;
    return;
  }
  if (m.lassoed || m.stun > 0) return;
  var weak = isWeak(m), F = weak ? 0.5 : 1;
  var d = dist(m, T), near = d < 320;
  behave(m, dt, T, near, b, F, function (g) { teleportDungeon(g); });
  m.cd -= dt;
  if (near && m.cd <= 0 && !m.castHaz) {
    cast(m, T.x, T.y, null);
    m.cd = SPD[m.species].interval * (weak ? 1.5 : 1);
  }
}
function teleportDungeon(m) {
  var T = D.T, tiles = [];
  for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
    var g = D.map.grid[r][c];
    if (g.room === m.room && g.kind === 'floor') {
      var x = c * TS + 30, y = r * TS + 30;
      if (Math.hypot(x - T.x, y - T.y) >= 120) tiles.push([x, y]);
    }
  }
  if (!tiles.length) return;
  var p = tiles[Math.floor(Math.random() * tiles.length)];
  m.x = p[0]; m.y = p[1];
}

/* 捕捉 */
function updCapture(dt) {
  var T = D.T, L = D.lasso;
  if (L) {
    var m = L.m;
    L.t += dt;
    var ang = Math.atan2(T.y - m.y, T.x - m.x);
    L.sum += angdiff(L.last, ang); L.last = ang;
    L.progress = Math.min(1, Math.abs(L.sum) / (2 * Math.PI));
    var d = dist(T, m);
    if (L.progress >= 1) { capture(m); return; }
    if (L.t >= L.limit || d > 220) breakLasso();
    return;
  }
  // 準備捕捉
  var cand = null, bd = 1e9;
  if (T.ropes > 0) liveMons().forEach(function (m) {
    if (!isWeak(m) || m.lassoed) return;
    var d2 = dist(T, m); if (d2 <= 40 && d2 < bd) { bd = d2; cand = m; }
  });
  if (!cand) { D.ring = null; return; }
  if (!D.ring || D.ring.m !== cand) D.ring = { m: cand, t: 0 };
  D.ring.t += dt;
  if (D.ring.t >= ringDur()) {
    D.ring = null; cand.lassoed = true; cancelWarn(cand);
    var a = Math.atan2(T.y - cand.y, T.x - cand.x);
    D.lasso = { m: cand, t: 0, limit: lassoLimit(), sum: 0, last: a, progress: 0 };
  }
}
function capture(m) {
  var T = D.T, sp = m.species;
  D.lasso = null; D.ring = null; m.lassoed = false;
  T.ropes--;
  removeMon(m);
  G.caught[sp]++;
  addFloat(m.x, m.y, '收服!', 'capture');
  if (!G.roster[sp]) G.roster[sp] = { level: 0 };
  else if (G.roster[sp].level < 3) { G.roster[sp].level++; addFloat(m.x, m.y - 40, '等級 +1', 'levelUp'); }
  else { addGold(20); addFloat(m.x, m.y - 40, '+20', 'coin20'); }
  var nm = calcMaxHearts();
  if (nm > T.maxHearts) { T.hearts += nm - T.maxHearts; T.maxHearts = nm; }
}
function endDungeon() {
  D.lasso = null; D.ring = null;
  D = null;
  s1 = { idx: 0, picked: [] };
  setPhase('setup1');
}

/* ================= 布置階段 ================= */
function rosterList() { return SPECIES.filter(function (sp) { return G.roster[sp]; }); }
function setup1Key(k) {
  var list = rosterList(), n = list.length, i = s1.idx;
  if (k === 'x') { openGuide(); return; }
  if (k === 'right') { if (i < n) s1.idx = Math.min(i + 1, n - 1); }
  else if (k === 'left') { if (i < n) s1.idx = Math.max(i - 1, 0); }
  else if (k === 'down') { if (i < n) s1.idx = (i + 2 < n) ? i + 2 : n; }
  else if (k === 'up') { if (i === n) s1.idx = n - 1; else if (i - 2 >= 0) s1.idx = i - 2; }
  else if (k === 'z') {
    if (i < n) {
      var sp = list[i], p = s1.picked.indexOf(sp);
      if (p >= 0) s1.picked.splice(p, 1); else if (s1.picked.length < 4) s1.picked.push(sp);
    } else if (s1.picked.length >= 1) {
      s2 = { cur: 0, placed: [], panel: null };
      for (var c = 0; c < 12; c++) s2.placed.push(null);
      setPhase('setup2');
    }
  }
}
function cellPos(c) { return { x: 160 + 200 * (c % 3), y: 360 + 180 * Math.floor(c / 3) }; }
function clearCell(c) {
  var p = s2.placed[c];
  if (p && p.type === 'gadget') G.gold += GADGETS[p.key].cost;
  s2.placed[c] = null;
}
function buildPanel() {
  var cur = s2.placed[s2.cur], refund = (cur && cur.type === 'gadget') ? GADGETS[cur.key].cost : 0, opts = [];
  s1.picked.forEach(function (sp) {
    var used = s2.placed.some(function (p) { return p && p.type === 'monster' && p.key === sp; });
    if (!used) opts.push({ type: 'monster', key: sp, name: SPD[sp].name, cost: 0, desc: '', affordable: true });
  });
  GADGET_KEYS.forEach(function (g) { opts.push({ type: 'gadget', key: g, name: GADGETS[g].name, cost: GADGETS[g].cost, desc: GADGETS[g].desc, affordable: G.gold + refund >= GADGETS[g].cost }); });
  opts.push({ type: 'clear', key: 'clear', name: '清空', cost: 0, desc: '', affordable: true });
  return { options: opts, index: 0 };
}
function setup2Key(k) {
  var P = s2.panel;
  if (P) {
    if (k === 'up') P.index = Math.max(0, P.index - 1);
    else if (k === 'down') P.index = Math.min(P.options.length - 1, P.index + 1);
    else if (k === 'x') s2.panel = null;
    else if (k === 'z') {
      var o = P.options[P.index];
      if (!o.affordable) return;
      if (o.type === 'clear') clearCell(s2.cur);
      else if (o.type === 'monster') { clearCell(s2.cur); s2.placed[s2.cur] = { type: 'monster', key: o.key }; }
      else { clearCell(s2.cur); G.gold -= o.cost; s2.placed[s2.cur] = { type: 'gadget', key: o.key }; }
      s2.panel = null;
    }
    return;
  }
  var cur = s2.cur;
  if (cur === 12) {
    if (k === 'up') s2.cur = 11;
    else if (k === 'z') startShow();
    else if (k === 'x') { for (var c = 0; c < 12; c++) clearCell(c); setPhase('setup1'); }
    return;
  }
  var col = cur % 3, row = Math.floor(cur / 3);
  if (k === 'left') s2.cur = row * 3 + Math.max(0, col - 1);
  else if (k === 'right') s2.cur = row * 3 + Math.min(2, col + 1);
  else if (k === 'up') s2.cur = Math.max(0, row - 1) * 3 + col;
  else if (k === 'down') { if (row < 3) s2.cur = (row + 1) * 3 + col; else s2.cur = 12; }
  else if (k === 'z') s2.panel = buildPanel();
  else if (k === 'x') clearCell(cur);
}

/* ================= 表演場 ================= */
function redLow(m) { return 80 - 5 * m.level; }
function startShow() {
  var placed = s2.placed, i;
  var mons = [], gadgets = [];
  placed.forEach(function (p, c) {
    if (!p) return;
    var pos = cellPos(c);
    if (p.type === 'monster') mons.push(newShowMonster(p.key, pos.x, pos.y));
    else gadgets.push({ kind: p.key, x: pos.x, y: pos.y, fired: 0, spent: false });
  });
  // 還沒擺的上場魔物隨機放到空格
  s1.picked.forEach(function (sp) {
    if (mons.some(function (m) { return m.species === sp; })) return;
    var empty = [];
    for (i = 0; i < 12; i++) if (!placed[i]) empty.push(i);
    var c;
    if (empty.length) c = empty[Math.floor(Math.random() * empty.length)];
    else { // 全被機關佔滿: 隨機取一個機關格並退費
      var gi = []; for (i = 0; i < 12; i++) if (placed[i] && placed[i].type === 'gadget') gi.push(i);
      c = gi[Math.floor(Math.random() * gi.length)];
      G.gold += GADGETS[placed[c].key].cost;
      gadgets = gadgets.filter(function (g) { var p = cellPos(c); return !(g.x === p.x && g.y === p.y); });
    }
    placed[c] = { type: 'monster', key: sp };
    var pos2 = cellPos(c);
    mons.push(newShowMonster(sp, pos2.x, pos2.y));
  });
  S = {
    t: 0, mons: mons, gadgets: gadgets, hazards: [], floats: [], pulses: [], perfs: [],
    pulseT: 1.5, broken: { top: [0, 0, 0, 0, 0, 0], bottom: [0, 0, 0, 0, 0, 0] },
    vis: { top: [], bottom: [] }
  };
  for (i = 0; i < 6; i++) { S.vis.top.push({ mode: 'watch', t: 0 }); S.vis.bottom.push({ mode: 'watch', t: 0 }); }
  setPhase('show');
}
function newShowMonster(sp, x, y) {
  var m = { species: sp, level: lvb(sp), x: x, y: y, rage: 40, marks: 0, markT: 4, slow: false, mode: 'roam', perfCd: 3, perfT: 1, perfDur: 0.5,
    fx: 'none', fxT: 0.5, chargeT: 0, chargeSeg: 0, loose: 0, looseDir: 1, atkT: 1.5, dir: 1, dead: false,
    wT: 0, wAng: rnd(0, 6.28), vAng: rnd(0, 6.28), vT: 4, tpT: 3, dashT: 0, dashCd: rnd(0.5, 2), dashAng: 0, ramming: false };
  m.mr = monR(m);
  return m;
}
function setFx(m, k) { m.fx = k; m.fxT = 0; }
function ignite(m, amt) {
  if (m.mode !== 'roam') return;
  setFx(m, 'ignited');
  if (m.marks > 0) { m.marks++; m.markT = 4; if (m.marks >= 5) runaway(m); return; }
  m.rage = Math.min(100, m.rage + amt);
  if (m.rage >= 100) { m.marks = 1; m.markT = 4; m.slow = false; }
}
function douse(m, amt) {
  if (m.mode !== 'roam') return;
  setFx(m, 'doused');
  if (m.marks > 0) { m.marks--; m.markT = 4; if (m.marks === 0) m.slow = true; }
  else m.rage = Math.max(0, m.rage - amt);
}
function runaway(m) {
  m.mode = 'charge'; m.marks = 5; m.chargeT = 0; m.ramming = false; m.fx = 'none';
  m.side = m.y < 630 ? 'top' : 'bottom';
  m.chargeSeg = clamp(Math.round((m.x - 110) / 100), 0, 5);
}
function fenceY(side) { return side === 'top' ? 255 : 1005; }
function seatY(side) { return side === 'top' ? 190 : 1080; }

function updateShow(dt) {
  S.t += dt;
  var b = { x0: FIELD.x0, y0: FIELD.y0, x1: FIELD.x1, y1: FIELD.y1 };
  // 機關脈衝
  S.gadgets.forEach(function (g) { g.fired = Math.max(0, g.fired - dt); });
  if (S.t >= S.pulseT) {
    S.pulseT += 3;
    S.gadgets.forEach(function (g) {
      if (g.kind !== 'drum' && g.kind !== 'fountain') return;
      g.fired = 0.3; S.pulses.push({ kind: g.kind, x: g.x, y: g.y, radius: 160, t: 0, dur: 0.4 });
      S.mons.forEach(function (m) {
        if (m.mode !== 'roam' || Math.hypot(m.x - g.x, m.y - g.y) > 160) return;
        if (g.kind === 'drum') ignite(m, 15); else douse(m, 20);
      });
    });
  }
  S.pulses.forEach(function (p) { p.t += dt; });
  S.pulses = S.pulses.filter(function (p) { return p.t < p.dur; });

  S.mons.forEach(function (m) {
    m.perfT += dt; m.fxT += dt;
    if (m.mode === 'roam') updRoam(m, dt, b);
    else if (m.mode === 'charge') updCharge(m, dt);
    else updLoose(m, dt);
  });
  // 安全閥
  S.gadgets.forEach(function (g) {
    if (g.kind !== 'valve' || g.spent) return;
    var trig = S.mons.some(function (m) { return m.mode === 'roam' && m.marks >= 4 && Math.hypot(m.x - g.x, m.y - g.y) <= 180; });
    if (!trig) return;
    g.spent = true; g.fired = 0.3;
    S.pulses.push({ kind: 'valve', x: g.x, y: g.y, radius: 180, t: 0, dur: 0.4 });
    S.mons.forEach(function (m) {
      if (m.mode !== 'roam' || Math.hypot(m.x - g.x, m.y - g.y) > 180) return;
      var had = m.marks > 0;
      m.marks = Math.max(0, m.marks - 2); m.markT = 4; setFx(m, 'doused');
      if (had && m.marks === 0) m.slow = true;
    });
  });

  updHazards(dt);
  S.perfs.forEach(function (p) { if (!p.paid && p.pending <= 0) payPerf(p); });
  S.perfs = S.perfs.filter(function (p) { return !p.paid; });
  S.floats.forEach(function (f) { f.t += dt; });
  S.floats = S.floats.filter(function (f) { return f.t < f.dur; });
  ['top', 'bottom'].forEach(function (sd) {
    S.vis[sd].forEach(function (v) {
      if (v.mode === 'watch') return;
      v.t += dt;
      if (v.mode === 'scared' && v.t >= 0.5) v.mode = 'empty';
      if (v.t >= 4) { v.mode = 'watch'; v.t = 0; }
    });
  });

  if (S.t >= 45) endShow();
}
function updRoam(m, dt, b) {
  // 怒氣與標記
  if (m.marks > 0) {
    m.rage = 100;
    m.markT -= dt;
    if (m.markT <= 0) { m.marks--; m.markT = 4; if (m.marks === 0) m.slow = true; }
  } else if (m.slow) {
    m.rage = Math.max(0, m.rage - 2 * dt);
    if (m.rage < redLow(m)) m.slow = false;
  } else m.rage = Math.max(0, m.rage - SPD[m.species].decay * dt);
  if (m.fxT >= 0.5) m.fx = 'none';

  // 移動
  var tgt = nearestValidShow(m, m);
  var bait = null, bd = 1e9;
  if (m.species !== 'stone' && m.species !== 'ghost') S.gadgets.forEach(function (g) {
    if (g.kind !== 'bait') return;
    var d = Math.hypot(m.x - g.x, m.y - g.y); if (d <= 260 && d < bd) { bd = d; bait = g; }
  });
  if (bait) { if (bd > 60) toward(m, bait.x, bait.y, 60, dt, b); }
  else behave(m, dt, tgt, !!tgt, b, 1, function (g) {
    g.x = rnd(b.x0 + g.mr, b.x1 - g.mr); g.y = rnd(b.y0 + g.mr, b.y1 - g.mr);
  });

  // 表演
  var interval = m.rage >= 50 ? 3 - 2 * (m.rage - 50) / 50 : 3;
  if (m.rage >= 50) {
    m.perfCd = Math.min(m.perfCd, interval);
    m.perfCd -= dt;
    if (m.perfCd <= 0) { perform(m, tgt); m.perfCd = 3 - 2 * (m.rage - 50) / 50; }
  }
}
function perform(m, tgt) {
  var red = m.rage >= redLow(m), mult = red ? 2 + 0.5 * m.marks : 1;
  var p = { m: m, base: SPD[m.species].showGold, mult: mult, hits: 0, pending: 0, paid: false };
  S.perfs.push(p);
  G.rep += SPD[m.species].showRep + (m.marks >= 3 ? 1 : 0);
  if (m.marks >= 3) G.edgeShows++;
  m.perfT = 0;
  cast(m, tgt ? tgt.x : 360, tgt ? tgt.y : 630, p);
}
function payPerf(p) {
  p.paid = true;
  var g = Math.round(p.base * (1 + 0.5 * p.hits) * p.mult * Math.min(3, 1 + G.rep / 200));
  addGold(g);
  addFloatTo(S.floats, p.m.x, p.m.y - 70, '+' + g + (p.mult > 1 ? ' ×' + p.mult : ''), p.mult > 1 ? 'redGold' : 'gold');
}
function updCharge(m, dt) {
  var fy = fenceY(m.side), fx = 110 + 100 * m.chargeSeg;
  var d = Math.hypot(fx - m.x, fy - m.y);
  if (!m.ramming) {
    if (d <= 8) { m.ramming = true; m.x = fx; m.y = fy; }
    else { var st = Math.min(160 * dt, d); m.x += (fx - m.x) / d * st; m.y += (fy - m.y) / d * st; m.dir = fx >= m.x ? 1 : -1; }
  }
  if (m.ramming) {
    var seg = S.broken[m.side][m.chargeSeg];
    if (seg) { startLoose(m); return; }
    m.chargeT += dt;
    if (m.chargeT >= 1.5) { S.broken[m.side][m.chargeSeg] = 1; startLoose(m); }
  }
}
function startLoose(m) {
  m.mode = 'loose'; m.loose = 0; m.atkT = 1.5; m.looseDir = Math.random() < 0.5 ? -1 : 1;
  m.x = 110 + 100 * m.chargeSeg; m.y = seatY(m.side); m.chargeT = 0;
}
function updLoose(m, dt) {
  m.loose += dt;
  m.x += m.looseDir * 140 * dt; m.dir = m.looseDir;
  if (m.x < 110) { m.x = 110; m.looseDir = 1; } else if (m.x > 610) { m.x = 610; m.looseDir = -1; }
  m.atkT -= dt;
  if (m.atkT <= 0) {
    m.atkT += 1.5;
    var best = -1, bd = 1e9;
    S.vis[m.side].forEach(function (v, i) {
      if (v.mode !== 'watch') return;
      var d = Math.abs(110 + 100 * i - m.x); if (d <= 70 && d < bd) { bd = d; best = i; }
    });
    if (best >= 0) {
      var v = S.vis[m.side][best]; v.mode = 'scared'; v.t = 0;
      G.rep = Math.max(0, G.rep - 3);
      addFloatTo(S.floats, 110 + 100 * best, seatY(m.side), '名聲 -3', 'repDown');
    }
  }
  if (m.loose >= 6) {
    m.mode = 'roam'; m.x = 360; m.y = 630; m.rage = 30; m.marks = 0; m.slow = false; m.fx = 'none'; m.perfCd = 3;
  }
}
function endShow() {
  S.mons.forEach(function (m) { if (m.mode !== 'roam') G.rep = Math.max(0, G.rep - 5); });
  S.perfs.forEach(function (p) { if (!p.paid) payPerf(p); });
  S = null; // 圍欄隨 S 一起重置(全部修好)
  if (G.day >= DAY_MAX) { setPhase('result'); }
  else { shopIdx = 0; setPhase('shop'); }
}

/* ================= 商店 ================= */
var SHOP_ITEMS = ['club', 'sword', 'spear', 'whip', 'attack', 'armor', 'ropeBag'];
function shopKey(k) {
  if (k === 'up') shopIdx = Math.max(0, shopIdx - 1);
  else if (k === 'down') shopIdx = Math.min(7, shopIdx + 1);
  else if (k === 'x') openGuide();
  else if (k === 'z') {
    if (shopIdx === 7) { G.day++; setPhase('select'); return; }
    var it = SHOP_ITEMS[shopIdx];
    if (WEAPONS.indexOf(it) >= 0) {
      if (G.owned[it]) G.weapon = it;
      else if (G.gold >= 60) { G.gold -= 60; G.owned[it] = true; G.weapon = it; }
    } else {
      var p = upPrice(it);
      if (G.gold >= p) { G.gold -= p; G.up[it]++; }
    }
  }
}

/* ================= 繪製 ================= */
function stars() { return G.rep >= 800 ? 3 : G.rep >= 450 ? 2 : G.rep >= 200 ? 1 : 0; }
function hud(message) {
  var inD = phase === 'dungeon', T = inD ? D.T : null;
  return {
    phase: phase, day: G.day, dayMax: DAY_MAX, gold: G.gold, rep: G.rep,
    hearts: inD ? Math.max(0, T.hearts) : 0, maxHearts: inD ? T.maxHearts : 0, ropes: inD ? T.ropes : 0, ropeMax: inD ? ropeMax() : 0,
    weapon: G.weapon, xCdLeft: inD ? T.xCd : 0, xCdMax: inD ? xCdMax() : 0,
    timeLeft: inD ? Math.max(0, D.time) : (phase === 'show' ? Math.max(0, 45 - S.t) : 0), timeMax: inD ? 60 : (phase === 'show' ? 45 : 0),
    dungeon: inD ? D.id : '', message: message || ''
  };
}
function drawMonsterD(m) {
  Art.drawWildMonster(ctx, {
    x: m.x, y: m.y + DY, species: m.species, hp: m.hp, maxHp: m.maxHp, hit: m.hitT > 0, weak: isWeak(m),
    stunLeft: m.stun, stunDur: 2, lassoed: m.lassoed, casting: !!(m.castHaz && !m.castHaz.dead && m.castHaz.phase === 'warn') || m.castFlash > 0,
    dashing: m.dashT > 0 && m.species === 'thunder', dir: m.dir
  });
}
function drawHaz(h, dy) {
  Art.drawHazard(ctx, { x: h.x, y: h.y + dy, kind: h.kind, phase: h.phase, radius: h.radius, t: h.t, dur: h.dur, angle: h.angle || 0, reflected: !!h.reflected });
}
function renderDungeon() {
  var T = D.T, r, c;
  for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) {
    var g = D.map.grid[r][c];
    Art.drawTile(ctx, { x: c * TS + 30, y: r * TS + 30 + DY, dungeon: D.id, kind: g.kind, room: g.room, nest: g.nest });
  }
  D.hazards.forEach(function (h) { if (!h.proj) drawHaz(h, DY); });
  D.mons.forEach(drawMonsterD);
  if (D.ring) Art.drawCaptureRing(ctx, { x: D.ring.m.x, y: D.ring.m.y + DY, t: D.ring.t, dur: ringDur() });
  if (D.lasso) {
    var L = D.lasso;
    Art.drawLasso(ctx, { x1: T.x, y1: T.y + DY, x2: L.m.x, y2: L.m.y + DY, progress: L.progress, t: L.t, limit: L.limit, len: dist(T, L.m), maxLen: 220 });
  }
  Art.drawTamer(ctx, { x: T.x, y: T.y + DY, facing: T.facing, weapon: G.weapon, dashing: T.dashT > 0, blink: T.invuln > 0, lassoing: !!D.lasso });
  D.hazards.forEach(function (h) { if (h.proj) drawHaz(h, DY); });
  D.fx.forEach(function (f) {
    Art.drawWeaponFx(ctx, { x: f.x, y: f.y + DY, weapon: f.weapon, move: f.move, shape: f.shape, angle: f.angle, spread: f.spread || 0, radius: f.radius || 0, length: f.length || 0, width: f.width || 0, t: f.t, dur: f.dur });
  });
  D.floats.forEach(function (f) { Art.drawFloatText(ctx, { x: f.x, y: f.y + DY, text: f.text, kind: f.kind, t: f.t, dur: f.dur }); });
  var m = T.ropes > 0 && D.ring ? '站住別動' : '';
  if (D.lasso) m = '繞牠一圈!'; else if (!m) m = 'Z 攻擊 X 武器技';
  Art.drawHud(ctx, hud(m));
}
function showMonsterState(m, x, y) {
  var red = m.rage >= redLow(m) && (m.mode === 'roam');
  return {
    x: x === undefined ? m.x : x, y: y === undefined ? m.y : y, species: m.species, level: m.level, rage: m.rage, redLow: redLow(m),
    mult: red ? 2 + 0.5 * m.marks : 0, marks: m.mode === 'roam' ? m.marks : 0, markLeft: m.mode === 'roam' && m.marks > 0 ? m.markT : 0, markDur: 4,
    mode: m.mode, performing: m.perfT < 0.5, performT: Math.min(m.perfT, 0.5), performDur: 0.5,
    fx: m.fx, fxT: Math.min(m.fxT, 0.5), fxDur: 0.5,
    chargeT: m.mode === 'charge' ? m.chargeT : 0, chargeDur: 1.5, looseT: m.mode === 'loose' ? m.loose : 0, looseDur: 6,
    dashing: m.dashT > 0 && m.species === 'thunder', dir: m.dir
  };
}
function renderSetup2() {
  Art.drawShowArena(ctx, {});
  var i, P = s2.panel;
  for (i = 0; i < 12; i++) {
    var pos = cellPos(i);
    Art.drawSetupCell(ctx, { x: pos.x, y: pos.y, selected: s2.cur === i && !P });
  }
  for (i = 0; i < 12; i++) {
    var p = s2.placed[i], ps = cellPos(i);
    if (!p) continue;
    if (p.type === 'gadget') Art.drawGadget(ctx, { x: ps.x, y: ps.y, kind: p.key, fired: false, spent: false });
    else {
      var m = newShowMonster(p.key, ps.x, ps.y); m.perfT = 9;
      Art.drawShowMonster(ctx, showMonsterState(m));
    }
  }
  var placedN = s2.placed.filter(function (p) { return p && p.type === 'monster'; }).length;
  Art.drawSetupInfo(ctx, { x: 260, y: 1210, gold: G.gold, placed: placedN, picked: s1.picked.length });
  Art.drawButton(ctx, { x: 480, y: 1160, w: 180, h: 100, label: '開演', selected: s2.cur === 12 && !P });
  if (P) {
    Art.drawPickerPanel(ctx, { x: 360, y: 240 + (80 + 70 * P.options.length) / 2, options: P.options, index: P.index });
  }
  var mm = P ? '↑↓ 選 Z 確定 X 取消' : (s2.cur === 12 ? 'Z 開演 X 回上一步' : '方向鍵選格子 Z 擺放 X 清空');
  Art.drawHud(ctx, hud(mm));
}
function renderShow() {
  Art.drawShowArena(ctx, {});
  var i;
  ['top', 'bottom'].forEach(function (sd) {
    for (i = 0; i < 6; i++) Art.drawVisitor(ctx, { x: 110 + 100 * i, y: seatY(sd), side: sd, mode: S.vis[sd][i].mode });
  });
  ['top', 'bottom'].forEach(function (sd) {
    for (i = 0; i < 6; i++) Art.drawFence(ctx, { x: 110 + 100 * i, y: fenceY(sd), side: sd, broken: !!S.broken[sd][i] });
  });
  S.gadgets.forEach(function (g) { Art.drawGadget(ctx, { x: g.x, y: g.y, kind: g.kind, fired: g.fired > 0, spent: g.spent }); });
  S.pulses.forEach(function (p) { Art.drawGadgetPulse(ctx, { x: p.x, y: p.y, kind: p.kind, radius: p.radius, t: p.t, dur: p.dur }); });
  S.hazards.forEach(function (h) { if (!h.proj) drawHaz(h, 0); });
  S.mons.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (m) { Art.drawShowMonster(ctx, showMonsterState(m)); });
  S.hazards.forEach(function (h) { if (h.proj) drawHaz(h, 0); });
  S.floats.forEach(function (f) { Art.drawFloatText(ctx, { x: f.x, y: f.y, text: f.text, kind: f.kind, t: f.t, dur: f.dur }); });
  Art.drawHud(ctx, hud('表演中…'));
}
function render() {
  Art.drawBackground(ctx, {});
  var i;
  switch (phase) {
    case 'guide': renderGuide(); return;
    case 'select':
      for (i = 0; i < 3; i++) {
        var d = DUNGEONS[i];
        Art.drawDungeonCard(ctx, { x: 360, y: 330 + 310 * i, dungeon: d, open: G.unlocked[d], condition: G.unlocked[d] ? '' : unlockCond(d), selected: selIdx === i });
      }
      Art.drawHud(ctx, hud('↑↓ 選擇 Z 進入 X 說明'));
      break;
    case 'dungeon': renderDungeon(); break;
    case 'setup1':
      var list = rosterList();
      list.forEach(function (sp, j) {
        Art.drawRosterCard(ctx, { x: 195 + 330 * (j % 2), y: 300 + 230 * Math.floor(j / 2), species: sp, level: G.roster[sp].level, picked: s1.picked.indexOf(sp) >= 0, selected: s1.idx === j });
      });
      Art.drawButton(ctx, { x: 160, y: 1100, w: 400, h: 100, label: '下一步', selected: s1.idx === list.length });
      Art.drawHud(ctx, hud('方向鍵選 Z 上場/下場 X 說明'));
      break;
    case 'setup2': renderSetup2(); break;
    case 'show': renderShow(); break;
    case 'shop':
      SHOP_ITEMS.forEach(function (it, j) {
        var isW = WEAPONS.indexOf(it) >= 0, cost, afford;
        if (isW) { cost = it === 'club' ? 0 : 60; afford = G.owned[it] || G.gold >= cost; }
        else { cost = upPrice(it); afford = G.gold >= cost; }
        Art.drawShopItem(ctx, { x: 360, y: 200 + 125 * j, item: it, cost: cost, level: isW ? 0 : G.up[it], owned: isW ? !!G.owned[it] : false, equipped: isW && G.weapon === it, affordable: afford, selected: shopIdx === j });
      });
      Art.drawButton(ctx, { x: 160, y: 1110, w: 400, h: 100, label: '出發', selected: shopIdx === 7 });
      Art.drawHud(ctx, hud('↑↓ 選擇 Z 購買/裝備 X 說明'));
      break;
    case 'result':
      Art.drawResultPanel(ctx, { rep: G.rep, goldEarned: G.goldEarned, edgeShows: G.edgeShows, stars: stars(),
        roster: rosterList().map(function (sp) { return { species: sp, level: G.roster[sp].level }; }) });
      Art.drawHud(ctx, hud('按 Z 重來'));
      break;
  }
}

/* ================= 主迴圈 ================= */
var last = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  var dt = last ? (ts - last) / 1000 : 0;
  last = ts;
  if (dt > 1 / 30) dt = 1 / 30;
  if (dt < 0) dt = 0;
  try {
    if (phase === 'dungeon') updateDungeon(dt);
    else if (phase === 'show') updateShow(dt);
    render();
  } catch (e) { console.error(e); }
}
requestAnimationFrame(frame);

})();
