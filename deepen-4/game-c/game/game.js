(function () {
'use strict';

var CW = Art.canvas.width, CH = Art.canvas.height;
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var dpr = window.devicePixelRatio || 1;
canvas.width = Math.round(CW * dpr);
canvas.height = Math.round(CH * dpr);

// ---------- 工具 ----------
function rnd(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function dist(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }
function unitVec(dx, dy) {
  var l = Math.sqrt(dx * dx + dy * dy);
  if (l < 1) { var a = Math.random() * 6.2832; return { x: Math.cos(a), y: Math.sin(a) }; }
  return { x: dx / l, y: dy / l };
}
function angNorm(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a <= -Math.PI) a += 2 * Math.PI; return a; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ---------- 資料 ----------
var SP = {
  mouse:   { name: '發條鼠',   hp: 7,  interval: 2.8, decay: 2.5, gold: 2, rep: 1, kill: 3, body: 24 },
  snail:   { name: '油壺蝸牛', hp: 8,  interval: 3.0, decay: 2,   gold: 1, rep: 1, kill: 3, body: 24 },
  puffer:  { name: '河豚',     hp: 12, interval: 2.6, decay: 2,   gold: 2, rep: 1, kill: 5, body: 24 },
  octo:    { name: '章魚',     hp: 12, interval: 2.4, decay: 2.5, gold: 2, rep: 1, kill: 5, body: 24 },
  pumpkin: { name: '南瓜燈',   hp: 16, interval: 2.6, decay: 2,   gold: 3, rep: 2, kill: 7, body: 24 },
  sheep:   { name: '棉花糖羊', hp: 18, interval: 3.0, decay: 1.5, gold: 3, rep: 2, kill: 8, body: 32 }
};
var SPLIST = ['mouse', 'snail', 'puffer', 'octo', 'pumpkin', 'sheep'];

var DUN = {
  workshop: { name: '發條工坊', sp: ['mouse', 'snail'], cost: 0, need: null, needN: 0 },
  reef:     { name: '珊瑚海窟', sp: ['puffer', 'octo'], cost: 60, need: 'snail', needN: 2 },
  grave:    { name: '南瓜墓園', sp: ['pumpkin', 'sheep'], cost: 120, need: 'octo', needN: 2 }
};
var DUNLIST = ['workshop', 'reef', 'grave'];
var NESTCH = { e: 'mouse', n: 'snail', f: 'puffer', q: 'octo', h: 'pumpkin', y: 'sheep' };

var MAPS = {
  workshop: [
    '####################',
    '#.......#..#.......#',
    '#.e..o..#..#.n.....#',
    '#.......#..#....o..#',
    '#...WW.............#',
    '#.............WW...#',
    '#..o....#..#.......#',
    '#....e..#..#..o..n.#',
    '#.......#.S#.......#',
    '####################'],
  reef: [
    '####################',
    '#.......#..#.......#',
    '#.f..W..#..#..q..L.#',
    '#...WW..#..#.......#',
    '#.L................#',
    '#..............o...#',
    '#.....L.#..#.WW....#',
    '#..f....#..#.....q.#',
    '#.......#.S#.......#',
    '####################'],
  grave: [
    '####################',
    '#.......#..#.......#',
    '#.h...o.#..#.y.....#',
    '#..L....#..#...o.L.#',
    '#..................#',
    '#...o...........W..#',
    '#.W.....#..#.......#',
    '#....h..#..#..L..y.#',
    '#.......#.S#.......#',
    '####################']
};
var TILESTATE = {};
(function buildTiles() {
  DUNLIST.forEach(function (code) {
    var list = [];
    for (var r = 0; r < 10; r++) {
      for (var c = 0; c < 20; c++) {
        var ch = MAPS[code][r].charAt(c);
        var kind = 'floor';
        if (ch === '#') kind = 'wall'; else if (ch === 'o') kind = 'pillar';
        else if (ch === 'L') kind = 'hurt'; else if (ch === 'W') kind = 'slow';
        var room = (c >= 1 && c <= 7) ? 'left' : ((c >= 12 && c <= 18) ? 'right' : 'hall');
        list.push({ x: c * 60 + 30 + 40, y: r * 60 + 30 + 110, dungeon: code, kind: kind, room: room, nest: !!NESTCH[ch] });
      }
    }
    TILESTATE[code] = list;
  });
})();

var WEAPONS = {
  club:  { zCd: 0.35, xCd: 0,   price: 0,  name: '棍棒' },
  sword: { zCd: 0.35, xCd: 3,   price: 60, name: '劍' },
  spear: { zCd: 0.45, xCd: 1.2, price: 60, name: '長槍' },
  whip:  { zCd: 0.4,  xCd: 1.2, price: 60, name: '長鞭' }
};

var TAGS = {
  calm:   { name: '冷靜鈴', desc: '當自己標記到 3, 就冷靜下來', cd: 12, price: 0 },
  cheer:  { name: '打氣鈴', desc: '當自己怒氣掉到 50 以下, 就打起精神', cd: 8, price: 0 },
  relay:  { name: '傳火令', desc: '當自己被點燃, 就衝去撞最近的一隻', cd: 4, price: 0 },
  rescue: { name: '滅火令', desc: '當別隻標記到 3, 就趕過去對牠表演', cd: 10, price: 40 },
  hype:   { name: '炒熱令', desc: '當自己進紅區, 就讓全場都氣起來', cd: 10, price: 40 },
  encore: { name: '安可令', desc: '當自己一招打中 2 隻以上, 就再演一次', cd: 6, price: 50 },
  taunt:  { name: '嘲諷令', desc: '當自己開始表演, 就把附近的叫過來', cd: 6, price: 30 }
};
var TAGLIST = ['calm', 'cheer', 'relay', 'rescue', 'hype', 'encore', 'taunt'];

var SHOP_ITEMS = ['club', 'sword', 'spear', 'whip', 'attack', 'armor', 'ropeBag', 'rescue', 'hype', 'encore', 'taunt'];
var SHOP_BASE = { attack: 50, armor: 40, ropeBag: 40 };

var GUIDE = [
  { title: '地下城', text: '方向鍵走, Z 攻擊, X 武器技' },
  { title: '收服', text: '殘血時站上去, 再繞牠一圈' },
  { title: '掛口令牌', text: '幫魔物掛牌, 條件到了自己會做' },
  { title: '紅區', text: '紅區最賺, 標記滿 5 個就失控' },
  { title: '目標', text: '7 天內賺到越多名聲越好' }
];

var START_POS = [[300, 260], [980, 260], [300, 460], [980, 460]];
var AX0 = 100, AX1 = 1180, AY0 = 186, AY1 = 526;

// ---------- 全域狀態 ----------
var S;            // 跨天的進度
var phase = 'guide';
var guidePage = 0, guideReturn = null;
var selIdx = 0;
var D = null;     // 地下城
var SH = null;    // 表演場
var setup1 = { cur: 0 };      // cur: 0..n-1 卡片, 'next'
var setup2 = { row: 0, slot: 0, panel: null };  // panel: {options, index}
var shopCur = { idx: 0, onStart: false };
var resultInfo = null;
var floatsMisc = [];

function newGame() {
  S = {
    day: 1, gold: 30, rep: 0, goldEarned: 0, bestChain: 0,
    weapon: 'club', ownedW: { club: true },
    lv: { attack: 0, armor: 0, ropeBag: 0 },
    price: { attack: 50, armor: 40, ropeBag: 40 },
    roster: [{ sp: 'mouse', level: 0 }, { sp: 'snail', level: 0 }],
    cap: { mouse: 0, snail: 0, puffer: 0, octo: 0, pumpkin: 0, sheep: 0 },
    tagOwned: { calm: true, cheer: true, relay: true },
    assign: {},
    open: { workshop: true, reef: false, grave: false },
    picked: {}
  };
}
function rosterEntry(sp) { for (var i = 0; i < S.roster.length; i++) if (S.roster[i].sp === sp) return S.roster[i]; return null; }
function lvl(sp) { var e = rosterEntry(sp); return e ? e.level : 0; }
function redLowOf(sp) { return 80 - 5 * lvl(sp); }
function addRep(v) { S.rep = Math.max(0, S.rep + v); }
function addGold(v) { S.gold += v; if (v > 0) S.goldEarned += v; }
function pickedList() { return S.roster.filter(function (e) { return S.picked[e.sp]; }); }
function tagHung(tag) {
  var n = 0;
  for (var sp in S.assign) { var a = S.assign[sp]; if (a[0] === tag) n++; if (a[1] === tag) n++; }
  return n;
}

// ---------- 輸入(只有方向鍵 + Z、X) ----------
var held = { up: false, down: false, left: false, right: false };
var queue = [];
var KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyZ: 'z', KeyX: 'x' };
window.addEventListener('keydown', function (e) {
  var k = KEYMAP[e.code];
  if (!k) return;
  e.preventDefault();
  if (e.repeat) return;
  if (held.hasOwnProperty(k)) held[k] = true;
  queue.push(k);
});
window.addEventListener('keyup', function (e) {
  var k = KEYMAP[e.code];
  if (!k) return;
  e.preventDefault();
  if (held.hasOwnProperty(k)) held[k] = false;
});
window.addEventListener('blur', function () { held.up = held.down = held.left = held.right = false; queue.length = 0; });

function setPhase(p) { phase = p; queue.length = 0; }

// ---------- HUD ----------
function hudState(msg) {
  var st = {
    phase: phase, day: S.day, dayMax: 7, gold: S.gold, rep: S.rep,
    hearts: 0, maxHearts: 0, ropes: 0, ropeMax: 0, weapon: S.weapon, xCdLeft: 0, xCdMax: 0,
    timeLeft: 0, timeMax: 0, dungeon: '', message: msg || ''
  };
  if (phase === 'dungeon' && D) {
    st.hearts = D.tamer.hearts; st.maxHearts = D.tamer.maxHearts;
    st.ropes = D.tamer.ropes; st.ropeMax = D.tamer.ropeMax;
    st.xCdLeft = Math.max(0, D.tamer.xCd); st.xCdMax = xCdMax();
    st.timeLeft = Math.max(0, D.time); st.timeMax = 60; st.dungeon = D.code;
  } else if (phase === 'show' && SH) {
    st.timeLeft = Math.max(0, 45 - SH.t); st.timeMax = 45;
  }
  return st;
}
function xCdMax() {
  var b = WEAPONS[S.weapon].xCd;
  return b * (1 - 0.15 * lvl('sheep'));
}

// ====================================================================
// 地下城
// ====================================================================
function gridChar(c, r) { if (c < 0 || r < 0 || c >= 20 || r >= 10) return '#'; return MAPS[D.code][r].charAt(c); }
function solidTile(c, r) { var ch = gridChar(c, r); return ch === '#' || ch === 'o'; }
function solidAt(x, y) { return solidTile(Math.floor(x / 60), Math.floor(y / 60)); }
function circleBlocked(x, y, rad) {
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
function moveTamer(t, dx, dy) {
  var moved = false;
  if (dx !== 0 && !circleBlocked(t.x + dx, t.y, 18)) { t.x += dx; moved = true; }
  if (dy !== 0 && !circleBlocked(t.x, t.y + dy, 18)) { t.y += dy; moved = true; }
  return moved;
}
function circleHitsKind(x, y, rad, kindCh) {
  var c0 = Math.floor((x - rad) / 60), c1 = Math.floor((x + rad) / 60);
  var r0 = Math.floor((y - rad) / 60), r1 = Math.floor((y + rad) / 60);
  for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
    if (gridChar(c, r) !== kindCh) continue;
    var nx = clamp(x, c * 60, c * 60 + 60), ny = clamp(y, r * 60, r * 60 + 60);
    var dx = x - nx, dy = y - ny;
    if (dx * dx + dy * dy < rad * rad) return true;
  }
  return false;
}
function roomBounds(d, sp) {
  var left = DUN[d.code].sp[0] === sp;
  return left ? { x0: 90, x1: 450, y0: 90, y1: 510 } : { x0: 750, x1: 1110, y0: 90, y1: 510 };
}

function startDungeon(code) {
  var map = MAPS[code];
  D = { code: code, time: 60, hazards: [], tents: [], fx: [], floats: [], nests: [], mons: [], ring: { mon: null, t: 0 }, nextId: 1 };
  var sx = 630, sy = 510;
  for (var r = 0; r < 10; r++) for (var c = 0; c < 20; c++) {
    var ch = map[r].charAt(c);
    if (ch === 'S') { sx = c * 60 + 30; sy = r * 60 + 30; }
    if (NESTCH[ch]) D.nests.push({ x: c * 60 + 30, y: r * 60 + 30, sp: NESTCH[ch], respawn: 0, mon: null });
  }
  var maxH = 6 + S.lv.armor + lvl('puffer');
  D.tamer = {
    x: sx, y: sy, facing: 0, hearts: maxH, maxHearts: maxH,
    ropeMax: 3 + S.lv.ropeBag, ropes: 3 + S.lv.ropeBag,
    zCd: 0, xCd: 0, inv: 0, dash: null, lasso: null, pull: null
  };
  D.nests.forEach(function (n) { spawnWild(n); });
  setPhase('dungeon');
}
function spawnWild(n) {
  var hp = SP[n.sp].hp;
  var m = {
    id: D.nextId++, sp: n.sp, nest: n, x: n.x, y: n.y, hp: hp, maxHp: hp, hitT: 0, stun: 0, lassoed: false,
    castCd: SP[n.sp].interval, casting: false, mv: { ph: 'wind', t: 0, dx: 1, dy: 0 }, dirx: 1,
    roamT: 0, rdx: 0, rdy: 0, knock: null, tentCd: 3, stick: null, stickCd: 0, hopT: 0, hopDx: 0, hopDy: 0, osc: 0
  };
  n.mon = m;
  D.mons.push(m);
}
function removeWild(m) {
  var i = D.mons.indexOf(m);
  if (i >= 0) D.mons.splice(i, 1);
  if (m.nest) { m.nest.mon = null; m.nest.respawn = 8; }
  if (D.ring.mon === m) { D.ring.mon = null; D.ring.t = 0; }
  D.hazards = D.hazards.filter(function (h) { return !(h.owner === m && h.phase !== 'fly'); });
  D.tents = D.tents.filter(function (t) { return t.owner !== m; });
}
function dFloat(x, y, text, kind) { D.floats.push({ x: x, y: y, text: text, kind: kind, t: 0, dur: 1 }); }
function isWeak(m) { return m.hp <= m.maxHp * 0.3; }
function atkBonus() { return S.lv.attack; }
function cancelWarn(m) {
  D.hazards = D.hazards.filter(function (h) { return !(h.owner === m && (h.phase === 'warn' || h.phase === 'active')); });
}

function hitTamer() {
  var t = D.tamer;
  if (t.inv > 0 || t.dash) return;
  t.hearts -= 1;
  t.inv = 1.2;
  if (t.lasso) breakLasso();
}
function breakLasso() {
  var t = D.tamer;
  if (!t.lasso) return;
  t.lasso.mon.lassoed = false;
  t.lasso = null;
  D.ring.mon = null; D.ring.t = 0;
}
function dmgMon(m, dmg) {
  if (m.lassoed) return;
  m.hp -= dmg;
  m.hitT = 0.1;
  if (D.ring.mon === m) D.ring.t = 0;
  if (m.hp <= 0) {
    addGold(SP[m.sp].kill);
    dFloat(m.x, m.y - 30, '+' + SP[m.sp].kill, 'gold');
    removeWild(m);
  }
}

// ----- 技能(地下城與表演場共用) -----
function spawnSkill(list, owner, ax, ay, cast) {
  var sp = owner.sp, n = 0, h, i;
  function add(o) {
    o.owner = owner; o.cast = cast || null; o.t = o.t || 0; o.dead = false; o.reflected = false;
    o.angle = o.angle || 0; o.spread = o.spread || 0; o.radius = o.radius || 0; o.follow = o.follow || null;
    o.vx = o.vx || 0; o.vy = o.vy || 0; o.judged = false; o.counted = false;
    list.push(o); n++;
  }
  var ang = Math.atan2(ay - owner.y, ax - owner.x);
  if (sp === 'mouse') {
    for (i = 0; i < 4; i++) {
      var a = Math.PI / 4 + i * Math.PI / 2;
      add({ kind: 'spark', phase: 'fly', x: owner.x, y: owner.y, angle: a, radius: 12, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, speed: 200, dur: 0 });
    }
  } else if (sp === 'snail') {
    add({ kind: 'coolant', phase: 'warn', x: owner.x, y: owner.y, angle: ang, spread: Math.PI / 2, radius: 130, dur: 0.9, activeDur: 0.3 });
  } else if (sp === 'puffer') {
    add({ kind: 'puff', phase: 'warn', x: owner.x, y: owner.y, radius: 130, dur: 0.7, activeDur: 0.3, follow: owner });
  } else if (sp === 'octo') {
    for (i = -1; i <= 1; i++) {
      var a2 = ang + i * 20 * Math.PI / 180;
      add({ kind: 'ink', phase: 'fly', x: owner.x, y: owner.y, angle: a2, radius: 14, vx: Math.cos(a2) * 240, vy: Math.sin(a2) * 240, speed: 240, dur: 0 });
    }
  } else if (sp === 'pumpkin') {
    add({ kind: 'pumpkin', phase: 'warn', x: ax, y: ay, radius: 100, dur: 0.9, activeDur: 0.2 });
  } else if (sp === 'sheep') {
    add({ kind: 'cotton', phase: 'warn', x: owner.x, y: owner.y, radius: 160, dur: 0.8, activeDur: 0.5, follow: owner });
  }
  if (cast) cast.pending += n;
}
function inShape(h, px, py, pr) {
  var d = dist(h.x, h.y, px, py);
  if (h.kind === 'coolant') {
    if (d - pr > h.radius) return false;
    if (d < 1) return true;
    var a = Math.abs(angNorm(Math.atan2(py - h.y, px - h.x) - h.angle));
    return a <= h.spread / 2 + Math.asin(Math.min(1, pr / d));
  }
  return d <= h.radius + pr;
}

function updHazardsDungeon(dt) {
  var t = D.tamer, list = D.hazards, i, j;
  for (i = 0; i < list.length; i++) {
    var h = list[i];
    if (h.dead) continue;
    if (h.follow) { h.x = h.follow.x; h.y = h.follow.y; }
    if (h.phase === 'fly') {
      h.x += h.vx * dt; h.y += h.vy * dt;
      if (solidAt(h.x, h.y) || h.x < 0 || h.y < 0 || h.x > 1200 || h.y > 600) { h.dead = true; continue; }
      if (h.reflected) {
        for (j = 0; j < D.mons.length; j++) {
          var m = D.mons[j];
          if (dist(h.x, h.y, m.x, m.y) <= h.radius + SP[m.sp].body) {
            dmgMon(m, 3 + atkBonus()); h.dead = true; break;
          }
        }
      } else if (dist(h.x, h.y, t.x, t.y) <= h.radius + 18) {
        hitTamer(); h.dead = true;
      }
    } else if (h.phase === 'warn') {
      h.t += dt;
      if (h.t >= h.dur) { h.phase = 'active'; h.t = 0; h.dur = h.activeDur; }
    } else if (h.phase === 'active') {
      if (h.kind === 'pumpkin') {
        if (!h.judged) { h.judged = true; if (inShape(h, t.x, t.y, 18)) hitTamer(); }
      } else if (inShape(h, t.x, t.y, 18)) hitTamer();
      h.t += dt;
      if (h.t >= h.dur) h.dead = true;
    }
  }
  D.hazards = list.filter(function (h) { return !h.dead; });
}

// ----- 武器 -----
function tamerAngle(t) { return (t.facing - 2) * Math.PI / 4; }
function inArc(px, py, ox, oy, ang, spread, R, br) {
  var d = dist(px, py, ox, oy);
  if (d - br > R) return false;
  if (d < 1) return true;
  var a = Math.abs(angNorm(Math.atan2(py - oy, px - ox) - ang));
  return a <= spread / 2 + Math.asin(Math.min(1, br / d));
}
function pushFx(o) { o.t = 0; o.length = o.length || 0; o.width = o.width || 0; o.radius = o.radius || 0; o.spread = o.spread || 0; o.angle = o.angle || 0; D.fx.push(o); }
function doZ() {
  var t = D.tamer, w = S.weapon, ang = tamerAngle(t), mul = 1 + 0.1 * lvl('pumpkin');
  t.zCd = WEAPONS[w].zCd;
  var mons = D.mons.slice(), i, m, br;
  if (w === 'club' || w === 'sword') {
    var spread = w === 'club' ? 100 * Math.PI / 180 : 120 * Math.PI / 180;
    var R = (w === 'club' ? 70 : 80) * mul;
    pushFx({ x: t.x, y: t.y, weapon: w, move: 'normal', shape: 'arc', angle: ang, spread: spread, radius: R, dur: 0.2, follow: true });
    for (i = 0; i < mons.length; i++) {
      m = mons[i];
      if (inArc(m.x, m.y, t.x, t.y, ang, spread, R, SP[m.sp].body)) dmgMon(m, 2 + atkBonus());
    }
    if (w === 'sword') {
      D.hazards.forEach(function (h) {
        if (h.phase !== 'fly' || h.reflected) return;
        if (!inArc(h.x, h.y, t.x, t.y, ang, spread, R, h.radius)) return;
        var d;
        if (h.owner && D.mons.indexOf(h.owner) >= 0) d = unitVec(h.owner.x - t.x, h.owner.y - t.y);
        else d = unitVec(-h.vx, -h.vy);
        var sp2 = h.speed * 1.2;
        h.vx = d.x * sp2; h.vy = d.y * sp2; h.angle = Math.atan2(d.y, d.x); h.reflected = true;
      });
    }
  } else if (w === 'spear') {
    var L = 170 * mul;
    pushFx({ x: t.x, y: t.y, weapon: w, move: 'normal', shape: 'line', angle: ang, length: L, width: 40, dur: 0.2, follow: true });
    var ca = Math.cos(ang), sa = Math.sin(ang);
    for (i = 0; i < mons.length; i++) {
      m = mons[i]; br = SP[m.sp].body;
      var dx = m.x - t.x, dy = m.y - t.y;
      var u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
      if (u >= -br && u <= L + br && Math.abs(v) <= 20 + br) dmgMon(m, 2 + atkBonus());
    }
  } else if (w === 'whip') {
    var R2 = 100 * mul;
    pushFx({ x: t.x, y: t.y, weapon: w, move: 'normal', shape: 'circle', angle: 0, radius: R2, dur: 0.2, follow: true });
    for (i = 0; i < mons.length; i++) {
      m = mons[i];
      if (dist(m.x, m.y, t.x, t.y) <= R2 + SP[m.sp].body) dmgMon(m, 1 + atkBonus());
    }
  }
}
function doX() {
  var t = D.tamer, w = S.weapon;
  if (w === 'club' || t.xCd > 0) return;
  var ang = tamerAngle(t), i, m;
  t.xCd = xCdMax();
  var mons = D.mons.slice();
  if (w === 'sword') {
    var spread = 120 * Math.PI / 180;
    pushFx({ x: t.x, y: t.y, weapon: w, move: 'skill', shape: 'arc', angle: ang, spread: spread, radius: 80, dur: 0.2, follow: true });
    for (i = 0; i < mons.length; i++) {
      m = mons[i];
      if (inArc(m.x, m.y, t.x, t.y, ang, spread, 80, SP[m.sp].body)) { m.stun = 2; m.stick = null; cancelWarn(m); }
    }
  } else if (w === 'spear') {
    t.dash = { t: 0, dx: Math.cos(ang), dy: Math.sin(ang), hit: [] };
    pushFx({ x: t.x, y: t.y, weapon: w, move: 'skill', shape: 'dash', angle: ang, length: 220, dur: 0.25, follow: false });
  } else if (w === 'whip') {
    var sp3 = 100 * Math.PI / 180;
    pushFx({ x: t.x, y: t.y, weapon: w, move: 'skill', shape: 'arc', angle: ang, spread: sp3, radius: 170, dur: 0.2, follow: true });
    for (i = 0; i < mons.length; i++) {
      m = mons[i];
      if (inArc(m.x, m.y, t.x, t.y, ang, sp3, 170, SP[m.sp].body)) {
        var d = unitVec(m.x - t.x, m.y - t.y);
        dmgMon(m, 2 + atkBonus());
        if (D.mons.indexOf(m) >= 0 && !m.lassoed) m.knock = { t: 0, dur: 0.25, vx: d.x * 160 / 0.25, vy: d.y * 160 / 0.25 };
      }
    }
  }
}

// ----- 捕捉 -----
function ringDur() { return Math.max(0.35, 0.8 - 0.15 * lvl('snail')); }
function lassoLimit() { return 5 + lvl('octo'); }
function updCapture(dt) {
  var t = D.tamer, i, m;
  if (t.lasso) {
    var L = t.lasso;
    m = L.mon;
    if (D.mons.indexOf(m) < 0) { t.lasso = null; return; }
    L.t += dt;
    var ang = Math.atan2(t.y - m.y, t.x - m.x);
    L.sum += angNorm(ang - L.last);
    L.last = ang;
    L.len = dist(t.x, t.y, m.x, m.y);
    if (Math.abs(L.sum) / (2 * Math.PI) >= 1) { captureDone(m); return; }
    if (L.t >= lassoLimit() || L.len > 220) breakLasso();
    return;
  }
  var best = null, bd = 1e9;
  if (t.ropes > 0) {
    for (i = 0; i < D.mons.length; i++) {
      m = D.mons[i];
      if (!isWeak(m) || m.lassoed) continue;
      var d = dist(t.x, t.y, m.x, m.y);
      if (d <= 40 && d < bd) { bd = d; best = m; }
    }
  }
  if (best !== D.ring.mon) { D.ring.mon = best; D.ring.t = 0; }
  else if (best) {
    D.ring.t += dt;
    if (D.ring.t >= ringDur()) {
      best.lassoed = true; best.stick = null; cancelWarn(best); best.knock = null;
      var a0 = Math.atan2(t.y - best.y, t.x - best.x);
      t.lasso = { mon: best, t: 0, sum: 0, last: a0, len: dist(t.x, t.y, best.x, best.y) };
      D.ring.mon = null; D.ring.t = 0;
    }
  }
}
function captureDone(m) {
  var t = D.tamer;
  t.ropes -= 1;
  t.lasso = null;
  m.lassoed = false;
  S.cap[m.sp] += 1;
  dFloat(m.x, m.y - 30, '收服!', 'capture');
  var e = rosterEntry(m.sp);
  if (!e) S.roster.push({ sp: m.sp, level: 0 });
  else if (e.level < 3) { e.level += 1; dFloat(m.x, m.y - 60, '等級 +1', 'levelUp'); }
  else { addGold(20); dFloat(m.x, m.y - 60, '+20', 'coin20'); }
  removeWild(m);
}

// ----- 野生魔物行為 -----
function roamStep(m, dt, sp, b) {
  m.roamT -= dt;
  if (m.roamT <= 0) { var a = Math.random() * 6.2832; m.rdx = Math.cos(a); m.rdy = Math.sin(a); m.roamT = rnd(2, 3); }
  m.x += m.rdx * sp * dt; m.y += m.rdy * sp * dt;
  if (m.x < b.x0 || m.x > b.x1) m.rdx = -m.rdx;
  if (m.y < b.y0 || m.y > b.y1) m.rdy = -m.rdy;
}
function updWild(m, dt) {
  var t = D.tamer, b = roomBounds(D, m.sp), sp = m.sp;
  m.hitT = Math.max(0, m.hitT - dt);
  if (m.stun > 0) m.stun -= dt;
  var frozen = m.lassoed || m.stun > 0;
  var weak = isWeak(m), f = weak ? 0.5 : 1;
  var d = dist(m.x, m.y, t.x, t.y), near = d < 300;
  var ox = m.x;
  var u;
  if (m.knock) {
    m.knock.t += dt; m.x += m.knock.vx * dt; m.y += m.knock.vy * dt;
    if (m.knock.t >= m.knock.dur) m.knock = null;
  }
  // 施放
  if (frozen || !near) m.castCd = SP[sp].interval * (weak ? 1.5 : 1);
  else {
    m.castCd -= dt;
    if (m.castCd <= 0) {
      spawnSkill(D.hazards, m, t.x, t.y, null);
      m.castCd = SP[sp].interval * (weak ? 1.5 : 1);
    }
  }
  // 章魚觸手
  if (sp === 'octo') {
    if (frozen || d >= 260) m.tentCd = 3;
    else {
      m.tentCd -= dt;
      if (m.tentCd <= 0) {
        m.tentCd = 3;
        D.tents.push({ owner: m, t: 0, dur: 0.3 });
        t.pull = { t: 0, dur: 0.3, owner: m, left: Math.min(80, d) };
      }
    }
  }
  if (frozen) { if (m.stick) m.stick = null; clampWild(m, b); updDirx(m, ox); return; }
  if (m.knock) { clampWild(m, b); updDirx(m, ox); return; }
  // 移動
  if (sp === 'mouse') {
    var mv = m.mv;
    if (mv.ph === 'wind') {
      mv.t += dt;
      if (mv.t >= 1) {
        mv.ph = 'dash'; mv.t = 0;
        if (near) u = unitVec(t.x - m.x, t.y - m.y); else u = unitVec(Math.random() - 0.5, Math.random() - 0.5);
        mv.dx = u.x; mv.dy = u.y;
      }
    } else {
      mv.t += dt;
      m.x += mv.dx * 220 * f * dt; m.y += mv.dy * 220 * f * dt;
      if (m.x < b.x0) { m.x = b.x0; mv.dx = Math.abs(mv.dx); } else if (m.x > b.x1) { m.x = b.x1; mv.dx = -Math.abs(mv.dx); }
      if (m.y < b.y0) { m.y = b.y0; mv.dy = Math.abs(mv.dy); } else if (m.y > b.y1) { m.y = b.y1; mv.dy = -Math.abs(mv.dy); }
      if (mv.t >= 1.5) { mv.ph = 'wind'; mv.t = 0; }
    }
  } else if (!near) {
    m.stick = null;
    roamStep(m, dt, 40 * f, b);
  } else if (sp === 'snail') {
    if (m.stick) {
      m.stick.t += dt;
      m.x = t.x + m.stick.ox; m.y = t.y + m.stick.oy;
      if (m.stick.t >= 2) { m.stick = null; m.stickCd = 2; }
    } else {
      m.stickCd -= dt;
      u = unitVec(t.x - m.x, t.y - m.y);
      m.x += u.x * 40 * f * dt; m.y += u.y * 40 * f * dt;
      if (d <= 60 && m.stickCd <= 0) m.stick = { ox: m.x - t.x, oy: m.y - t.y, t: 0 };
    }
  } else if (sp === 'puffer') {
    m.osc += dt;
    u = unitVec(t.x - m.x, t.y - m.y);
    var lat = 40 * Math.PI * Math.cos(Math.PI * m.osc);
    m.x += (u.x * 70 * f + (-u.y) * lat) * dt; m.y += (u.y * 70 * f + u.x * lat) * dt;
  } else if (sp === 'octo') {
    u = unitVec(t.x - m.x, t.y - m.y);
    if (d > 205) { m.x += u.x * 50 * f * dt; m.y += u.y * 50 * f * dt; }
    else if (d < 195) { m.x -= u.x * 50 * f * dt; m.y -= u.y * 50 * f * dt; }
  } else if (sp === 'pumpkin') {
    m.hopT += dt;
    if (m.hopT >= 1) { m.hopT -= 1; m.hopDx = 0; m.hopDy = 0; }
    if (m.hopT < 0.5) {
      if (m.hopDx === 0 && m.hopDy === 0) { u = unitVec(t.x - m.x, t.y - m.y); m.hopDx = u.x; m.hopDy = u.y; }
      m.x += m.hopDx * 240 * f * dt; m.y += m.hopDy * 240 * f * dt;
    }
  } else if (sp === 'sheep') {
    if (d > 80) { u = unitVec(t.x - m.x, t.y - m.y); m.x += u.x * 50 * f * dt; m.y += u.y * 50 * f * dt; }
  }
  clampWild(m, b);
  updDirx(m, ox);
}
function clampWild(m, b) { m.x = clamp(m.x, b.x0, b.x1); m.y = clamp(m.y, b.y0, b.y1); }
function updDirx(m, ox) { if (m.x - ox > 0.05) m.dirx = 1; else if (m.x - ox < -0.05) m.dirx = -1; }

function updTamer(dt) {
  var t = D.tamer;
  t.zCd = Math.max(0, t.zCd - dt); t.xCd = Math.max(0, t.xCd - dt); t.inv = Math.max(0, t.inv - dt);
  // 動作輸入
  for (var i = 0; i < queue.length; i++) {
    if (t.dash) break;
    if (queue[i] === 'z' && t.zCd <= 0) doZ();
    else if (queue[i] === 'x') doX();
  }
  queue.length = 0;
  if (t.pull) {
    var p = t.pull, step = Math.min(p.left, 80 * dt / p.dur);
    var u = unitVec(p.owner.x - t.x, p.owner.y - t.y);
    if (D.mons.indexOf(p.owner) >= 0) {
      var mx = u.x * step, my = u.y * step;
      var moved = moveTamer(t, mx, my);
      if (!moved) p.left = 0; else p.left -= step;
    }
    p.t += dt;
    if (p.t >= p.dur || p.left <= 0) t.pull = null;
  }
  if (t.dash) {
    var ds = t.dash, total = 220 * dt / 0.25, sub = Math.ceil(total / 12), k;
    for (k = 0; k < sub; k++) {
      if (!moveTamer(t, ds.dx * total / sub, ds.dy * total / sub)) { ds.t = 99; break; }
    }
    D.mons.slice().forEach(function (m) {
      if (ds.hit.indexOf(m) >= 0) return;
      if (dist(m.x, m.y, t.x, t.y) <= 18 + SP[m.sp].body) { ds.hit.push(m); dmgMon(m, 3 + atkBonus()); }
    });
    ds.t += dt;
    if (ds.t >= 0.25) t.dash = null;
  } else {
    var dx = (held.right ? 1 : 0) - (held.left ? 1 : 0), dy = (held.down ? 1 : 0) - (held.up ? 1 : 0);
    if (dx !== 0 || dy !== 0) {
      var l = Math.sqrt(dx * dx + dy * dy);
      var ux = dx / l, uy = dy / l;
      var spd = 300 + 25 * lvl('mouse');
      if (circleHitsKind(t.x, t.y, 0.1, 'W')) spd *= 0.5;
      moveTamer(t, ux * spd * dt, uy * spd * dt);
      var fi = { '0,-1': 0, '1,-1': 1, '1,0': 2, '1,1': 3, '0,1': 4, '-1,1': 5, '-1,0': 6, '-1,-1': 7 };
      t.facing = fi[dx + ',' + dy];
    }
  }
  if (circleHitsKind(t.x, t.y, 18, 'L')) hitTamer();
}

function updDungeon(dt) {
  var t = D.tamer, i;
  D.time -= dt;
  updTamer(dt);
  for (i = 0; i < D.mons.length; i++) D.mons[i].casting = false;
  for (i = D.mons.length - 1; i >= 0; i--) if (D.mons[i]) updWild(D.mons[i], dt);
  updHazardsDungeon(dt);
  D.hazards.forEach(function (h) { if (h.phase === 'warn' && h.owner) h.owner.casting = true; });
  updCapture(dt);
  D.nests.forEach(function (n) {
    if (!n.mon && n.respawn > 0) { n.respawn -= dt; if (n.respawn <= 0) spawnWild(n); }
  });
  D.tents.forEach(function (te) { te.t += dt; });
  D.tents = D.tents.filter(function (te) { return te.t < te.dur && D.mons.indexOf(te.owner) >= 0; });
  D.fx.forEach(function (f) { f.t += dt; if (f.follow) { f.x = t.x; f.y = t.y; } });
  D.fx = D.fx.filter(function (f) { return f.t < f.dur; });
  D.floats.forEach(function (f) { f.t += dt; });
  D.floats = D.floats.filter(function (f) { return f.t < f.dur; });
  if (phase === 'dungeon' && (t.hearts <= 0 || D.time <= 0)) endDungeon();
}
function endDungeon() {
  D = null;
  setup1.cur = 0;
  setPhase('setup1');
}

function drawDungeon() {
  var OX = 40, OY = 110, t = D.tamer, i;
  Art.drawBackground(ctx, {});
  var tiles = TILESTATE[D.code];
  for (i = 0; i < tiles.length; i++) Art.drawTile(ctx, tiles[i]);
  function hz(h) {
    return { x: h.x + OX, y: h.y + OY, kind: h.kind, phase: h.phase, radius: h.radius, angle: h.angle, spread: h.spread, t: h.t, dur: h.dur, reflected: h.reflected };
  }
  D.hazards.forEach(function (h) { if (h.phase !== 'fly') Art.drawHazard(ctx, hz(h)); });
  if (D.ring.mon) Art.drawCaptureRing(ctx, { x: D.ring.mon.x + OX, y: D.ring.mon.y + OY, t: D.ring.t, dur: ringDur() });
  D.mons.forEach(function (m) {
    var mv = 'walk', mT = 0, mD = 0;
    if (m.sp === 'mouse') { mv = m.mv.ph; mT = m.mv.t; mD = m.mv.ph === 'wind' ? 1 : 1.5; }
    else if (m.sp === 'snail' && m.stick) { mv = 'stick'; mT = m.stick.t; mD = 2; }
    else if (m.sp === 'pumpkin' && m.hopT < 0.5 && m.hopDx + m.hopDy !== 0) { mv = 'hop'; mT = m.hopT; mD = 0.5; }
    Art.drawWildMonster(ctx, {
      x: m.x + OX, y: m.y + OY, species: m.sp, hp: m.hp, maxHp: m.maxHp, hit: m.hitT > 0, weak: isWeak(m),
      stunLeft: Math.max(0, m.stun), stunDur: 2, lassoed: m.lassoed, casting: m.casting,
      move: mv, moveT: mT, moveDur: mD, dir: m.dirx
    });
  });
  D.tents.forEach(function (te) {
    Art.drawTentacle(ctx, { x1: te.owner.x + OX, y1: te.owner.y + OY, x2: t.x + OX, y2: t.y + OY, t: te.t, dur: te.dur });
  });
  if (t.lasso) {
    var L = t.lasso;
    Art.drawLasso(ctx, { x1: t.x + OX, y1: t.y + OY, x2: L.mon.x + OX, y2: L.mon.y + OY, progress: Math.min(1, Math.abs(L.sum) / (2 * Math.PI)), t: L.t, limit: lassoLimit(), len: L.len, maxLen: 220 });
  }
  Art.drawTamer(ctx, { x: t.x + OX, y: t.y + OY, facing: t.facing, weapon: S.weapon, dashing: !!t.dash, blink: t.inv > 0, lassoing: !!t.lasso });
  D.fx.forEach(function (f) {
    Art.drawWeaponFx(ctx, { x: f.x + OX, y: f.y + OY, weapon: f.weapon, move: f.move, shape: f.shape, angle: f.angle, spread: f.spread, radius: f.radius, length: f.length, width: f.width, t: f.t, dur: f.dur });
  });
  D.hazards.forEach(function (h) { if (h.phase === 'fly') Art.drawHazard(ctx, hz(h)); });
  D.floats.forEach(function (f) { Art.drawFloatText(ctx, { x: f.x + OX, y: f.y + OY, text: f.text, kind: f.kind, t: f.t, dur: f.dur }); });
  var msg = 'Z 攻擊 X 武器技';
  if (t.lasso) msg = '繞牠一圈!'; else if (D.ring.mon) msg = '站住別動';
  Art.drawHud(ctx, hudState(msg));
}

// ====================================================================
// 表演場
// ====================================================================
var FENCE_X = []; for (var fi0 = 0; fi0 < 8; fi0++) FENCE_X.push(165 + 136 * fi0);

function isLoose(m) { return m.mode === 'charge' || m.mode === 'loose'; }
function sFloat(x, y, text, kind) { SH.floats.push({ x: x, y: y, text: text, kind: kind, t: 0, dur: 1 }); }
function perfInterval(r) { return 4 - (r - 50) / 50 * 2.5; }

function startShow() {
  var list = pickedList();
  SH = { t: 0, mons: [], hazards: [], tents: [], floats: [], tagFx: [], pairs: {}, casts: [],
    fences: { top: [], bottom: [] }, vis: { top: [], bottom: [] }, bestChain: 0 };
  for (var i = 0; i < 8; i++) {
    SH.fences.top.push({ broken: false }); SH.fences.bottom.push({ broken: false });
    SH.vis.top.push({ mode: 'watch', t: 0 }); SH.vis.bottom.push({ mode: 'watch', t: 0 });
  }
  list.forEach(function (e, i) {
    var a = S.assign[e.sp] || ['', ''];
    SH.mons.push({
      id: i, sp: e.sp, level: e.level, x: START_POS[i][0], y: START_POS[i][1], rage: 60, redLow: 80 - 5 * e.level,
      marks: 0, markT: 0, slow: false, mode: 'roam', perfTimer: rnd(0.5, 2), performT: -1,
      fx: 'none', fxT: 0, tags: [a[0] || '', a[1] || ''], cd: [0, 0], flash: [-1, -1],
      ev: {}, evNew: {}, pending: [], ov: null, lastEcho: -99, dirx: 1,
      mv: { ph: 'wind', t: 0, dx: 1, dy: 0 }, roamT: 0, rdx: 0, rdy: 0, tgt: null, tgtT: 0, hopT: 0, hopDx: 0, hopDy: 0,
      osc: 0, tentCd: 3, stick: null, avoid: null, avoidT: 0,
      chargeT: 0, arrived: false, looseT: 0, side: 'top', fence: 0, attackT: 0, rescueTg: null
    });
  });
  setPhase('show');
}
function othersOf(m) { return SH.mons.filter(function (o) { return o !== m && !isLoose(o); }); }
function nearestOther(m) {
  var best = null, bd = 1e9;
  SH.mons.forEach(function (o) {
    if (o === m || isLoose(o)) return;
    var d = dist(m.x, m.y, o.x, o.y);
    if (d < bd) { bd = d; best = o; }
  });
  return best;
}
function later(m, t, fn) { m.pending.push({ t: t, fn: fn }); }

function becomeLoose(m) {
  m.mode = 'charge';
  m.marks = 0; m.markT = 0; m.slow = false; m.rage = 100;
  m.ov = null; m.pending = []; m.stick = null; m.performT = -1; m.perfTimer = null;
  m.side = m.y < 356 ? 'top' : 'bottom';
  var bi = 0, bd = 1e9;
  for (var i = 0; i < 8; i++) { var dd = Math.abs(FENCE_X[i] - m.x); if (dd < bd) { bd = dd; bi = i; } }
  m.fence = bi; m.arrived = false; m.chargeT = 0; m.looseT = 0; m.attackT = 0;
  SH.tents = SH.tents.filter(function (t) { return t.owner !== m && t.target !== m; });
}
function applyRage(m, delta, opts) {
  if (isLoose(m)) return;
  var prev = m.rage;
  if (delta > 0) {
    if (opts.collision && m.rage >= 100) return;
    if (m.marks > 0) {
      m.marks += 1; m.markT = 4;
      if (m.marks >= 5) { becomeLoose(m); return; }
    } else {
      m.rage = Math.min(100, m.rage + delta);
      if (m.rage >= 100 && prev < 100) { m.marks = 1; m.markT = 4; m.slow = false; }
    }
    m.fx = 'ignited'; m.fxT = 0;
    if (prev < m.redLow && m.rage >= m.redLow) m.evNew.cross = true;
    m.evNew.ign = { chain: (opts.skill ? opts.chain : 0) + 1 };
    if (opts.skill && m.rage >= m.redLow && SH.t - m.lastEcho >= 1.5) {
      m.lastEcho = SH.t;
      var ch = opts.chain + 1;
      later(m, 0.3, function () { perform(m, ch, null); });
    }
  } else {
    if (m.marks > 0) {
      m.marks -= 1; m.markT = 4;
      if (m.marks === 0) m.slow = true;
    } else {
      m.rage = Math.max(0, m.rage + delta);
    }
    m.fx = 'doused'; m.fxT = 0;
  }
}

function perform(m, chain, aimMon) {
  if (isLoose(m)) return;
  m.performT = 0;
  m.perfTimer = m.rage >= 50 ? perfInterval(m.rage) : null;
  var tg = (aimMon && !isLoose(aimMon)) ? aimMon : nearestOther(m);
  var ax = tg ? tg.x : 640, ay = tg ? tg.y : 356;
  var cast = { owner: m, chain: chain, hits: [], pending: 0, red: m.rage >= m.redLow, settled: false };
  SH.casts.push(cast);
  spawnSkill(SH.hazards, m, ax, ay, cast);
  if (chain > SH.bestChain) SH.bestChain = chain;
  m.evNew.perfStart = true;
}
function settleCast(c) {
  if (c.settled) return;
  c.settled = true;
  var m = c.owner, n = c.hits.length;
  var g = SP[m.sp].gold * (1 + 0.5 * n) * (c.red ? 2 : 1) * (1 + 0.25 * (c.chain - 1)) * Math.min(3, 1 + S.rep / 200);
  g = Math.max(1, Math.round(g));
  addGold(g); addRep(SP[m.sp].rep);
  var text = '+' + g + (c.red ? ' ×2' : '') + (c.chain >= 2 ? ' 連鎖 ' + c.chain : '');
  sFloat(m.x, m.y - 60, text, c.chain >= 2 ? 'chain' : (c.red ? 'redGold' : 'gold'));
  if (c.chain > S.bestChain) S.bestChain = c.chain;
  if (n >= 2) m.evNew.enc = { chain: c.chain, hits: n };
  var i = SH.casts.indexOf(c);
  if (i >= 0) SH.casts.splice(i, 1);
}
var DELTA = { spark: 10, puff: 15, pumpkin: 15, coolant: -20, ink: -15, cotton: -10 };
function castHit(h, target) {
  var c = h.cast;
  c.hits.push(target);
  applyRage(target, DELTA[h.kind], { skill: true, chain: c.chain });
}
function updHazardsShow(dt) {
  var list = SH.hazards, i, j;
  for (i = 0; i < list.length; i++) {
    var h = list[i];
    if (h.dead) continue;
    if (h.follow) {
      if (isLoose(h.follow)) h.follow = null; else { h.x = h.follow.x; h.y = h.follow.y; }
    }
    if (h.phase === 'fly') {
      h.x += h.vx * dt; h.y += h.vy * dt;
      if (h.x < 60 || h.x > 1220 || h.y < 146 || h.y > 566) { h.dead = true; continue; }
      for (j = 0; j < SH.mons.length; j++) {
        var m = SH.mons[j];
        if (m === h.owner || isLoose(m) || h.cast.hits.indexOf(m) >= 0) continue;
        if (dist(h.x, h.y, m.x, m.y) <= h.radius + SP[m.sp].body) { castHit(h, m); h.dead = true; break; }
      }
    } else if (h.phase === 'warn') {
      h.t += dt;
      if (h.t >= h.dur) { h.phase = 'active'; h.t = 0; h.dur = h.activeDur; }
    } else {
      if (h.kind !== 'pumpkin' || !h.judged) {
        h.judged = true;
        for (j = 0; j < SH.mons.length; j++) {
          var m2 = SH.mons[j];
          if (m2 === h.owner || isLoose(m2) || h.cast.hits.indexOf(m2) >= 0) continue;
          if (inShape(h, m2.x, m2.y, 0)) castHit(h, m2);
        }
      }
      h.t += dt;
      if (h.t >= h.dur) h.dead = true;
    }
  }
  var keep = [];
  list.forEach(function (h) {
    if (h.dead) {
      if (!h.counted) { h.counted = true; h.cast.pending -= 1; if (h.cast.pending <= 0) settleCast(h.cast); }
    } else keep.push(h);
  });
  SH.hazards = keep;
}

// ----- 表演場移動 -----
function clampAct(m) { m.x = clamp(m.x, AX0, AX1); m.y = clamp(m.y, AY0, AY1); }
function showRoam(m, dt, sp) {
  m.roamT -= dt;
  if (m.roamT <= 0) { var a = Math.random() * 6.2832; m.rdx = Math.cos(a); m.rdy = Math.sin(a); m.roamT = rnd(2, 3); }
  m.x += m.rdx * sp * dt; m.y += m.rdy * sp * dt;
  if (m.x < AX0 || m.x > AX1) m.rdx = -m.rdx;
  if (m.y < AY0 || m.y > AY1) m.rdy = -m.rdy;
}
function randomOther(m, exclude) {
  var o = othersOf(m).filter(function (x) { return x !== exclude; });
  if (!o.length) o = othersOf(m);
  return o.length ? pick(o) : null;
}
function updLoose(m, dt) {
  var ox = m.x;
  if (m.mode === 'charge') {
    var fx = FENCE_X[m.fence], fy = m.side === 'top' ? 140 : 572;
    if (!m.arrived) {
      var d = dist(m.x, m.y, fx, fy);
      if (d <= 160 * dt + 1) { m.x = fx; m.y = fy; m.arrived = true; m.chargeT = 0; }
      else { var u = unitVec(fx - m.x, fy - m.y); m.x += u.x * 160 * dt; m.y += u.y * 160 * dt; }
    } else {
      m.chargeT += dt;
      if (m.chargeT >= 1.5) {
        SH.fences[m.side][m.fence].broken = true;
        m.mode = 'loose'; m.looseT = 0; m.attackT = 0; m.chargeT = 0;
        m.y = m.side === 'top' ? 95 : 622; m.x = fx;
        m.rdx = Math.random() < 0.5 ? -1 : 1;
      }
    }
  } else {
    m.looseT += dt;
    m.x += m.rdx * 140 * dt;
    if (m.x < 100) { m.x = 100; m.rdx = 1; } else if (m.x > 1180) { m.x = 1180; m.rdx = -1; }
    m.attackT -= dt;
    if (m.attackT <= 0 && m.looseT < 6) {
      m.attackT = 1.5;
      var best = null, bd = 1e9, row = SH.vis[m.side];
      row.forEach(function (v, i) {
        if (v.mode !== 'watch') return;
        var dd = Math.abs(FENCE_X[i] - m.x);
        if (dd < bd) { bd = dd; best = v; }
      });
      if (best) { best.mode = 'scared'; best.t = 0; addRep(-3); sFloat(m.x, m.y - 50, '名聲 -3', 'repDown'); }
    }
    if (m.looseT >= 6) {
      m.mode = 'roam'; m.x = 640; m.y = 356; m.rage = 30; m.marks = 0; m.markT = 0; m.slow = false;
      m.looseT = 0; m.perfTimer = null; m.ov = null; m.mv = { ph: 'wind', t: 0, dx: 1, dy: 0 };
    }
  }
  if (m.x - ox > 0.05) m.dirx = 1; else if (m.x - ox < -0.05) m.dirx = -1;
}
function updShowMove(m, dt) {
  var ox = m.x, u, i;
  if (isLoose(m)) { updLoose(m, dt); return; }
  if (m.ov) {
    var ov = m.ov;
    m.mode = ov.kind;
    ov.t += dt;
    if (ov.kind === 'relay') {
      var tg = ov.target;
      if (isLoose(tg)) { m.ov = null; }
      else if (dist(m.x, m.y, tg.x, tg.y) <= 80) {
        SH.pairs[pairKey(m, tg)] = SH.t;
        applyRage(tg, 12, { skill: true, chain: ov.chain });
        m.ov = null;
      } else {
        u = unitVec(tg.x - m.x, tg.y - m.y);
        m.x += u.x * 300 * dt; m.y += u.y * 300 * dt;
        if (ov.t >= 1) m.ov = null;
      }
    } else if (ov.kind === 'taunted') {
      var tt = ov.target;
      if (isLoose(tt)) m.ov = null;
      else {
        if (dist(m.x, m.y, tt.x, tt.y) > 80) { u = unitVec(tt.x - m.x, tt.y - m.y); m.x += u.x * 150 * dt; m.y += u.y * 150 * dt; }
        if (ov.t >= 1.5) m.ov = null;
      }
    } else if (ov.kind === 'pulled') {
      var k = Math.min(1, ov.t / ov.dur), dd = ov.d0 + (80 - ov.d0) * k;
      m.x = ov.owner.x + ov.ux * dd; m.y = ov.owner.y + ov.uy * dd;
      if (ov.t >= ov.dur || isLoose(ov.owner)) m.ov = null;
    }
    if (!m.ov) m.mode = 'roam';
    clampAct(m);
    if (m.x - ox > 0.05) m.dirx = 1; else if (m.x - ox < -0.05) m.dirx = -1;
    return;
  }
  m.mode = 'roam';
  var others = othersOf(m), sp = m.sp;
  if (sp === 'mouse') {
    var mv = m.mv;
    mv.t += dt;
    if (mv.ph === 'wind') {
      if (mv.t >= 1) {
        mv.ph = 'dash'; mv.t = 0;
        var o = others.length ? pick(others) : null;
        u = o ? unitVec(o.x - m.x, o.y - m.y) : unitVec(Math.random() - 0.5, Math.random() - 0.5);
        mv.dx = u.x; mv.dy = u.y;
      }
    } else {
      m.x += mv.dx * 220 * dt; m.y += mv.dy * 220 * dt;
      if (m.x < AX0) { m.x = AX0; mv.dx = Math.abs(mv.dx); } else if (m.x > AX1) { m.x = AX1; mv.dx = -Math.abs(mv.dx); }
      if (m.y < AY0) { m.y = AY0; mv.dy = Math.abs(mv.dy); } else if (m.y > AY1) { m.y = AY1; mv.dy = -Math.abs(mv.dy); }
      if (mv.t >= 1.5) { mv.ph = 'wind'; mv.t = 0; }
    }
  } else if (!others.length) {
    m.stick = null;
    showRoam(m, dt, 50);
  } else if (sp === 'snail') {
    if (m.avoidT > 0) m.avoidT -= dt;
    if (m.stick) {
      var st = m.stick;
      if (isLoose(st.target)) { m.stick = null; }
      else {
        st.t += dt; m.x = st.target.x + st.ox; m.y = st.target.y + st.oy;
        if (st.t >= 2) { m.stick = null; m.avoid = st.target; m.avoidT = 2; }
      }
    }
    if (!m.stick) {
      var cand = others.filter(function (o) { return !(m.avoidT > 0 && o === m.avoid); });
      var best = null, bd = 1e9;
      cand.forEach(function (o) { var d = dist(m.x, m.y, o.x, o.y); if (d < bd) { bd = d; best = o; } });
      if (best) {
        if (bd <= 80) m.stick = { target: best, ox: m.x - best.x, oy: m.y - best.y, t: 0 };
        else { u = unitVec(best.x - m.x, best.y - m.y); m.x += u.x * 45 * dt; m.y += u.y * 45 * dt; }
      }
    }
  } else if (sp === 'puffer') {
    m.tgtT -= dt;
    if (!m.tgt || isLoose(m.tgt) || m.tgtT <= 0) { m.tgt = randomOther(m, null); m.tgtT = 3; }
    m.osc += dt;
    if (m.tgt) {
      u = unitVec(m.tgt.x - m.x, m.tgt.y - m.y);
      var lat = 40 * Math.PI * Math.cos(Math.PI * m.osc);
      m.x += (u.x * 70 + (-u.y) * lat) * dt; m.y += (u.y * 70 + u.x * lat) * dt;
    }
  } else if (sp === 'octo') {
    var nb = nearestOther(m);
    if (nb) {
      var dn = dist(m.x, m.y, nb.x, nb.y);
      u = unitVec(nb.x - m.x, nb.y - m.y);
      if (dn > 205) { m.x += u.x * 50 * dt; m.y += u.y * 50 * dt; }
      else if (dn < 195) { m.x -= u.x * 50 * dt; m.y -= u.y * 50 * dt; }
    }
    m.tentCd -= dt;
    if (m.tentCd <= 0 && nb && dist(m.x, m.y, nb.x, nb.y) <= 300) {
      m.tentCd = 3;
      var uu = unitVec(nb.x - m.x, nb.y - m.y);
      nb.ov = { kind: 'pulled', t: 0, dur: 0.4, owner: m, ux: uu.x, uy: uu.y, d0: dist(m.x, m.y, nb.x, nb.y) };
      nb.stick = null;
      SH.tents.push({ owner: m, target: nb, t: 0, dur: 0.4 });
    } else if (m.tentCd < 0) m.tentCd = 0;
  } else if (sp === 'pumpkin') {
    m.tgtT += dt;
    if (!m.tgt || isLoose(m.tgt) || m.tgtT >= 4 || dist(m.x, m.y, m.tgt.x, m.tgt.y) <= 80) {
      m.tgt = randomOther(m, m.tgt); m.tgtT = 0;
    }
    m.hopT += dt;
    if (m.hopT >= 1) { m.hopT -= 1; m.hopDx = 0; m.hopDy = 0; }
    if (m.hopT < 0.5 && m.tgt) {
      if (m.hopDx === 0 && m.hopDy === 0) { u = unitVec(m.tgt.x - m.x, m.tgt.y - m.y); m.hopDx = u.x; m.hopDy = u.y; }
      m.x += m.hopDx * 240 * dt; m.y += m.hopDy * 240 * dt;
    }
  } else if (sp === 'sheep') {
    var ax = 0, ay = 0;
    others.forEach(function (o) { ax += o.x; ay += o.y; });
    ax /= others.length; ay /= others.length;
    if (dist(m.x, m.y, ax, ay) > 40) { u = unitVec(ax - m.x, ay - m.y); m.x += u.x * 60 * dt; m.y += u.y * 60 * dt; }
  }
  clampAct(m);
  if (m.x - ox > 0.05) m.dirx = 1; else if (m.x - ox < -0.05) m.dirx = -1;
}
function pairKey(a, b) { return a.id < b.id ? a.id * 8 + b.id : b.id * 8 + a.id; }

// ----- 口令牌 -----
function rescueTarget(m) {
  var best = null, bm = 0, bd = 1e9;
  SH.mons.forEach(function (o) {
    if (o === m || isLoose(o) || o.marks < 3) return;
    var d = dist(m.x, m.y, o.x, o.y);
    if (o.marks > bm || (o.marks === bm && d < bd)) { bm = o.marks; bd = d; best = o; }
  });
  return best;
}
function tagCond(m, tag) {
  switch (tag) {
    case 'calm': return m.marks >= 3;
    case 'cheer': return m.rage < 50;
    case 'relay': return !!m.ev.ign;
    case 'rescue': m.rescueTg = rescueTarget(m); return !!m.rescueTg;
    case 'hype': return !!m.ev.cross;
    case 'encore': return !!(m.ev.enc && m.ev.enc.hits >= 2);
    case 'taunt': return !!m.ev.perfStart;
  }
  return false;
}
function fireTag(m, k, tag) {
  m.cd[k] = TAGS[tag].cd; m.flash[k] = 0;
  SH.tagFx.push({ m: m, tag: tag, t: 0 });
  var ev = m.ev;
  if (tag === 'calm') { m.marks = 0; m.markT = 0; m.rage = 70; m.slow = false; }
  else if (tag === 'cheer') applyRage(m, 25, { skill: false });
  else if (tag === 'relay') {
    var ch = ev.ign.chain;
    later(m, 0.2, function () {
      var o = nearestOther(m);
      if (!o) return;
      m.ov = { kind: 'relay', t: 0, target: o, chain: ch }; m.stick = null;
    });
  } else if (tag === 'rescue') {
    var tg = m.rescueTg;
    later(m, 0.2, function () {
      if (isLoose(tg)) return;
      var a = Math.random() * 6.2832;
      m.x = clamp(tg.x + Math.cos(a) * 80, AX0, AX1); m.y = clamp(tg.y + Math.sin(a) * 80, AY0, AY1);
      m.ov = null; m.stick = null;
      perform(m, 1, tg);
    });
  } else if (tag === 'hype') {
    othersOf(m).forEach(function (o) { applyRage(o, 10, { skill: false }); });
  } else if (tag === 'encore') {
    var c2 = ev.enc.chain + 1;
    later(m, 1, function () { perform(m, c2, null); });
  } else if (tag === 'taunt') {
    othersOf(m).forEach(function (o) {
      if (dist(m.x, m.y, o.x, o.y) <= 350) { o.ov = { kind: 'taunted', t: 0, target: m }; o.stick = null; }
    });
  }
}
function tagStep(dt) {
  SH.mons.forEach(function (m) {
    m.ev = m.evNew; m.evNew = {};
    for (var k = 0; k < 2; k++) {
      m.cd[k] = Math.max(0, m.cd[k] - dt);
      if (m.flash[k] >= 0) { m.flash[k] += dt; if (m.flash[k] >= 0.3) m.flash[k] = -1; }
    }
  });
  SH.mons.forEach(function (m) {
    if (isLoose(m)) return;
    for (var k = 0; k < 2; k++) {
      var tag = m.tags[k];
      if (!tag || m.cd[k] > 0 || isLoose(m)) continue;
      if (tagCond(m, tag)) fireTag(m, k, tag);
    }
  });
}

function updShow(dt) {
  SH.t += dt;
  var i, j, m;
  for (i = 0; i < SH.mons.length; i++) {
    m = SH.mons[i];
    if (m.fx !== 'none') { m.fxT += dt; if (m.fxT >= 0.5) { m.fx = 'none'; m.fxT = 0; } }
    if (m.performT >= 0) { m.performT += dt; if (m.performT >= 0.5) m.performT = -1; }
    if (isLoose(m)) continue;
    // 失控標記與怒氣
    if (m.marks > 0) {
      m.markT -= dt;
      if (m.markT <= 0) {
        m.marks -= 1;
        if (m.marks > 0) m.markT = 4; else { m.markT = 0; m.slow = true; }
      }
    } else if (m.slow) {
      m.rage -= 2 * dt;
      if (m.rage < m.redLow) m.slow = false;
    } else {
      m.rage -= SP[m.sp].decay * dt;
    }
    m.rage = clamp(m.rage, 0, 100);
    // 延遲動作
    var pend = m.pending; m.pending = [];
    for (j = 0; j < pend.length; j++) {
      pend[j].t -= dt;
      if (pend[j].t <= 0) { if (!isLoose(m)) pend[j].fn(); } else m.pending.push(pend[j]);
    }
  }
  for (i = 0; i < SH.mons.length; i++) {
    m = SH.mons[i];
    if (isLoose(m)) continue;
    if (m.rage >= 50) {
      if (m.perfTimer === null) m.perfTimer = perfInterval(m.rage);
      else m.perfTimer = Math.min(m.perfTimer, perfInterval(m.rage));
      m.perfTimer -= dt;
      if (m.perfTimer <= 0) perform(m, 1, null);
    } else m.perfTimer = null;
  }
  for (i = 0; i < SH.mons.length; i++) updShowMove(SH.mons[i], dt);
  // 相撞挑釁
  for (i = 0; i < SH.mons.length; i++) for (j = i + 1; j < SH.mons.length; j++) {
    var a = SH.mons[i], b = SH.mons[j];
    if (isLoose(a) || isLoose(b)) continue;
    if (dist(a.x, a.y, b.x, b.y) > 80) continue;
    var key = pairKey(a, b);
    if (SH.pairs[key] !== undefined && SH.t - SH.pairs[key] < 2) continue;
    SH.pairs[key] = SH.t;
    applyRage(a, 8, { collision: true });
    applyRage(b, 8, { collision: true });
  }
  updHazardsShow(dt);
  SH.tents.forEach(function (te) { te.t += dt; });
  SH.tents = SH.tents.filter(function (te) { return te.t < te.dur; });
  tagStep(dt);
  SH.tagFx.forEach(function (f) { f.t += dt; });
  SH.tagFx = SH.tagFx.filter(function (f) { return f.t < 0.8; });
  SH.floats.forEach(function (f) { f.t += dt; });
  SH.floats = SH.floats.filter(function (f) { return f.t < f.dur; });
  ['top', 'bottom'].forEach(function (side) {
    SH.vis[side].forEach(function (v) {
      if (v.mode === 'watch') return;
      v.t += dt;
      if (v.t >= 4) { v.mode = 'watch'; v.t = 0; } else if (v.t >= 1) v.mode = 'empty';
    });
  });
  if (SH.t >= 45) endShow();
}
function endShow() {
  SH.casts.slice().forEach(settleCast);
  SH.mons.forEach(function (m) { if (isLoose(m)) addRep(-5); });
  if (SH.bestChain > S.bestChain) S.bestChain = SH.bestChain;
  SH = null;
  if (S.day >= 7) {
    var stars = S.rep >= 900 ? 3 : (S.rep >= 550 ? 2 : (S.rep >= 250 ? 1 : 0));
    resultInfo = { rep: S.rep, goldEarned: S.goldEarned, bestChain: S.bestChain,
      roster: S.roster.map(function (e) { return { species: e.sp, level: e.level }; }), stars: stars };
    setPhase('result');
  } else {
    shopCur.idx = 0; shopCur.onStart = false;
    setPhase('shop');
  }
}

function drawShow() {
  var i;
  Art.drawShowArena(ctx, {});
  function hz(h) {
    return { x: h.x, y: h.y, kind: h.kind, phase: h.phase, radius: h.radius, angle: h.angle, spread: h.spread, t: h.t, dur: h.dur, reflected: false };
  }
  SH.hazards.forEach(function (h) { if (h.phase !== 'fly') Art.drawHazard(ctx, hz(h)); });
  SH.mons.forEach(function (m) {
    var mv = 'walk', mT = 0, mD = 0;
    if (m.sp === 'mouse' && m.mode === 'roam') { mv = m.mv.ph; mT = m.mv.t; mD = m.mv.ph === 'wind' ? 1 : 1.5; }
    else if (m.sp === 'snail' && m.stick) { mv = 'stick'; mT = m.stick.t; mD = 2; }
    else if (m.sp === 'pumpkin' && m.mode === 'roam' && m.hopT < 0.5 && m.hopDx + m.hopDy !== 0) { mv = 'hop'; mT = m.hopT; mD = 0.5; }
    Art.drawShowMonster(ctx, {
      x: m.x, y: m.y, species: m.sp, level: m.level, rage: m.rage, redLow: m.redLow, marks: Math.min(4, m.marks),
      markLeft: m.marks > 0 ? Math.max(0, m.markT) : 0, markDur: 4, mode: m.mode,
      performing: m.performT >= 0, performT: m.performT >= 0 ? m.performT : 0, performDur: 0.5,
      fx: m.fx, fxT: m.fx === 'none' ? 0 : m.fxT, fxDur: 0.5,
      chargeT: m.mode === 'charge' ? m.chargeT : 0, chargeDur: 1.5,
      looseT: m.mode === 'loose' ? m.looseT : 0, looseDur: 6,
      move: mv, moveT: mT, moveDur: mD, dir: m.dirx
    });
  });
  SH.mons.forEach(function (m) {
    for (var k = 0; k < 2; k++) {
      if (!m.tags[k]) continue;
      Art.drawTagBadge(ctx, {
        x: m.x - 18 + 36 * k, y: m.y + 66, tag: m.tags[k], cdLeft: m.cd[k], cdDur: TAGS[m.tags[k]].cd,
        flashT: m.flash[k] >= 0 ? m.flash[k] : 0, flashDur: 0.3
      });
    }
  });
  SH.tents.forEach(function (te) {
    Art.drawTentacle(ctx, { x1: te.owner.x, y1: te.owner.y, x2: te.target.x, y2: te.target.y, t: te.t, dur: te.dur });
  });
  SH.hazards.forEach(function (h) { if (h.phase === 'fly') Art.drawHazard(ctx, hz(h)); });
  SH.tagFx.forEach(function (f) { Art.drawTagFx(ctx, { x: f.m.x, y: f.m.y, tag: f.tag, t: f.t, dur: 0.8 }); });
  ['top', 'bottom'].forEach(function (side) {
    for (i = 0; i < 8; i++) {
      Art.drawFence(ctx, { x: FENCE_X[i], y: side === 'top' ? 140 : 572, side: side, broken: SH.fences[side][i].broken });
      Art.drawVisitor(ctx, { x: FENCE_X[i], y: side === 'top' ? 95 : 622, side: side, mode: SH.vis[side][i].mode });
    }
  });
  SH.floats.forEach(function (f) { Art.drawFloatText(ctx, f); });
  Art.drawHud(ctx, hudState('表演中…'));
}

// ====================================================================
// 其他畫面
// ====================================================================
function dungeonCondition(code) {
  var d = DUN[code];
  if (S.open[code]) return '';
  var n = Math.min(d.needN, S.cap[d.need]);
  return '金幣 ' + d.cost + ' + 收服' + SP[d.need].name + ' ' + n + '/' + d.needN;
}
function updSelect() {
  var k;
  while ((k = queue.shift())) {
    if (k === 'left') selIdx = Math.max(0, selIdx - 1);
    else if (k === 'right') selIdx = Math.min(2, selIdx + 1);
    else if (k === 'x') { openGuide(); return; }
    else if (k === 'z') {
      var code = DUNLIST[selIdx], d = DUN[code];
      if (S.open[code]) { startDungeon(code); return; }
      if (S.gold >= d.cost && S.cap[d.need] >= d.needN) { S.gold -= d.cost; S.open[code] = true; }
    }
  }
}
function drawSelect() {
  Art.drawBackground(ctx, {});
  DUNLIST.forEach(function (code, i) {
    Art.drawDungeonCard(ctx, { x: 240 + 400 * i, y: 390, dungeon: code, open: S.open[code], condition: dungeonCondition(code), selected: selIdx === i });
  });
  Art.drawHud(ctx, hudState('←→ 選擇 Z 進入 X 說明'));
}

function openGuide() { guideReturn = phase; guidePage = 0; setPhase('guide'); }
function updGuide() {
  var k;
  while ((k = queue.shift())) {
    if (k === 'left') guidePage = Math.max(0, guidePage - 1);
    else if (k === 'right') guidePage = Math.min(GUIDE.length - 1, guidePage + 1);
    else if (k === 'z') {
      if (guidePage < GUIDE.length - 1) guidePage++;
      else { closeGuide(); return; }
    } else if (k === 'x' && guideReturn) { closeGuide(); return; }
  }
}
function closeGuide() {
  var r = guideReturn || 'select';
  guideReturn = null;
  setPhase(r);
}
function drawGuide() {
  Art.drawBackground(ctx, {});
  var p = GUIDE[guidePage];
  Art.drawGuidePage(ctx, { page: guidePage, x: 140, y: 110, w: 1000, h: 430 });
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 40px "Microsoft JhengHei", sans-serif';
  ctx.fillText(p.title, 640, 82);
  ctx.font = '30px "Microsoft JhengHei", sans-serif';
  ctx.fillText(p.text, 640, 590);
  ctx.font = '22px "Microsoft JhengHei", sans-serif';
  ctx.fillStyle = '#ddd';
  ctx.fillText((guidePage + 1) + ' / ' + GUIDE.length, 1180, 82);
  ctx.fillText('按 Z 繼續' + (guidePage === GUIDE.length - 1 ? '(開始遊戲)' : '') + '    ← 上一頁  → 下一頁' + (guideReturn ? '    X 關閉' : ''), 640, 660);
  ctx.restore();
  Art.drawHud(ctx, hudState('←→ 翻頁 Z 繼續'));
}

function updSetup1() {
  var list = S.roster, n = list.length, k;
  while ((k = queue.shift())) {
    if (setup1.cur === 'next') {
      if (k === 'up') setup1.cur = 0;
      else if (k === 'z') {
        if (pickedList().length >= 1) { enterSetup2(); return; }
      }
    } else {
      if (k === 'left') setup1.cur = Math.max(0, setup1.cur - 1);
      else if (k === 'right') setup1.cur = Math.min(n - 1, setup1.cur + 1);
      else if (k === 'down') setup1.cur = 'next';
      else if (k === 'z') {
        var e = list[setup1.cur];
        if (S.picked[e.sp]) delete S.picked[e.sp];
        else if (pickedList().length < 4) S.picked[e.sp] = true;
      }
    }
  }
}
function drawSetup1() {
  Art.drawBackground(ctx, {});
  S.roster.forEach(function (e, i) {
    Art.drawRosterCard(ctx, { x: 160 + 192 * i, y: 300, species: e.sp, level: e.level, picked: !!S.picked[e.sp], selected: setup1.cur === i });
  });
  Art.drawButton(ctx, { x: 540, y: 560, w: 200, h: 80, label: '下一步', selected: setup1.cur === 'next' });
  Art.drawHud(ctx, hudState('←→ 選 Z 上場/下場 ↓ 下一步'));
}

function enterSetup2() {
  S.roster.forEach(function (e) {
    if (!S.picked[e.sp]) S.assign[e.sp] = ['', ''];
  });
  setup2.row = 0; setup2.slot = 0; setup2.panel = null;
  setPhase('setup2');
}
function openPanel() {
  var e = pickedList()[setup2.row], cur = S.assign[e.sp] || ['', ''];
  var other = cur[1 - setup2.slot];
  var opts = [];
  TAGLIST.forEach(function (tag) {
    if (!S.tagOwned[tag]) return;
    var left = 2 - tagHung(tag);
    opts.push({ type: 'tag', key: tag, name: TAGS[tag].name, desc: TAGS[tag].desc, left: left, usable: left > 0 && other !== tag });
  });
  opts.push({ type: 'remove', key: 'remove', name: '拿下', desc: '', left: 0, usable: true });
  setup2.panel = { options: opts, index: 0 };
}
function updSetup2() {
  var list = pickedList(), n = list.length, k, st = setup2;
  while ((k = queue.shift())) {
    if (st.panel) {
      var pn = st.panel;
      if (k === 'up') pn.index = Math.max(0, pn.index - 1);
      else if (k === 'down') pn.index = Math.min(pn.options.length - 1, pn.index + 1);
      else if (k === 'x') st.panel = null;
      else if (k === 'z') {
        var o = pn.options[pn.index], e = list[st.row];
        if (!S.assign[e.sp]) S.assign[e.sp] = ['', ''];
        if (o.type === 'remove') { S.assign[e.sp][st.slot] = ''; st.panel = null; }
        else if (o.usable) { S.assign[e.sp][st.slot] = o.key; st.panel = null; }
      }
      continue;
    }
    if (st.row >= n) {
      if (k === 'up') st.row = n - 1;
      else if (k === 'z') { startShow(); return; }
      else if (k === 'x') { setPhase('setup1'); setup1.cur = 0; return; }
    } else {
      if (k === 'up') st.row = Math.max(0, st.row - 1);
      else if (k === 'down') st.row = st.row + 1;
      else if (k === 'left') st.slot = 0;
      else if (k === 'right') st.slot = 1;
      else if (k === 'z') openPanel();
      else if (k === 'x') { var e2 = list[st.row]; if (S.assign[e2.sp]) S.assign[e2.sp][st.slot] = ''; }
    }
  }
}
function drawSetup2() {
  var list = pickedList(), n = list.length, st = setup2;
  Art.drawBackground(ctx, {});
  list.forEach(function (e, i) {
    var y = 125 + 125 * i, a = S.assign[e.sp] || ['', ''];
    Art.drawSetupRow(ctx, { x: 420, y: y, species: e.sp, level: e.level, selected: st.row === i });
    for (var k = 0; k < 2; k++) {
      Art.drawTagSlot(ctx, { x: 470 + 230 * k, y: y, tag: a[k] || '', selected: st.row === i && st.slot === k });
    }
  });
  Art.drawButton(ctx, { x: 320, y: 620, w: 200, h: 70, label: '開演', selected: st.row >= n });
  var msg = '↑↓ 選魔物 ←→ 選牌位 Z 掛牌 X 拿下';
  if (st.row >= n) msg = 'Z 開演 X 回上一步';
  if (st.panel) {
    Art.drawPickerPanel(ctx, { options: st.panel.options, index: st.panel.index });
    msg = '↑↓ 選 Z 確定 X 取消';
  }
  Art.drawHud(ctx, hudState(msg));
}

// ----- 商店 -----
function shopCell(i) { return { r: Math.floor(i / 3), c: i % 3 }; }
function itemCost(it) {
  if (SHOP_BASE[it]) return S.price[it];
  if (WEAPONS[it]) return WEAPONS[it].price;
  return TAGS[it].price;
}
function itemOwned(it) { if (WEAPONS[it]) return !!S.ownedW[it]; if (TAGS[it]) return !!S.tagOwned[it]; return false; }
function shopBuy(it) {
  if (WEAPONS[it]) {
    if (S.ownedW[it]) { S.weapon = it; return; }
    if (S.gold >= WEAPONS[it].price) { S.gold -= WEAPONS[it].price; S.ownedW[it] = true; S.weapon = it; }
  } else if (SHOP_BASE[it]) {
    if (S.gold >= S.price[it]) {
      S.gold -= S.price[it]; S.lv[it] += 1; S.price[it] = Math.round(S.price[it] * 1.5);
    }
  } else if (TAGS[it]) {
    if (!S.tagOwned[it] && S.gold >= TAGS[it].price) { S.gold -= TAGS[it].price; S.tagOwned[it] = true; }
  }
}
function updShop() {
  var k, sc = shopCur, n = SHOP_ITEMS.length;
  while ((k = queue.shift())) {
    if (sc.onStart) {
      if (k === 'up') { sc.onStart = false; sc.idx = Math.floor((n - 1) / 3) * 3; }
      else if (k === 'z') { S.day += 1; setPhase('select'); return; }
      else if (k === 'x') { openGuide(); return; }
      continue;
    }
    if (k === 'left') { if (sc.idx % 3 > 0) sc.idx--; }
    else if (k === 'right') { if (sc.idx % 3 < 2 && sc.idx + 1 < n) sc.idx++; }
    else if (k === 'up') { if (sc.idx >= 3) sc.idx -= 3; }
    else if (k === 'down') { if (sc.idx + 3 < n) sc.idx += 3; else sc.onStart = true; }
    else if (k === 'z') shopBuy(SHOP_ITEMS[sc.idx]);
    else if (k === 'x') { openGuide(); return; }
  }
}
function drawShop() {
  Art.drawBackground(ctx, {});
  SHOP_ITEMS.forEach(function (it, i) {
    var rc = shopCell(i), cost = itemCost(it);
    Art.drawShopItem(ctx, {
      x: 220 + 420 * rc.c, y: 140 + 115 * rc.r, item: it, cost: cost, level: SHOP_BASE[it] ? S.lv[it] : 0,
      owned: itemOwned(it), equipped: !!WEAPONS[it] && S.weapon === it,
      affordable: S.gold >= cost, selected: !shopCur.onStart && shopCur.idx === i
    });
  });
  Art.drawButton(ctx, { x: 540, y: 610, w: 200, h: 70, label: '出發', selected: shopCur.onStart });
  Art.drawHud(ctx, hudState('方向鍵選擇 Z 購買/裝備 X 說明'));
}

function updResult() {
  var k;
  while ((k = queue.shift())) {
    if (k === 'z') { newGame(); selIdx = 0; guideReturn = null; setPhase('select'); return; }
  }
}
function drawResult() {
  Art.drawBackground(ctx, {});
  Art.drawResultPanel(ctx, resultInfo);
  Art.drawHud(ctx, hudState('按 Z 重來'));
}

// ====================================================================
// 主迴圈
// ====================================================================
function update(dt) {
  if (phase === 'dungeon') updDungeon(dt);
  else if (phase === 'show') updShow(dt);
  else if (phase === 'guide') updGuide();
  else if (phase === 'select') updSelect();
  else if (phase === 'setup1') updSetup1();
  else if (phase === 'setup2') updSetup2();
  else if (phase === 'shop') updShop();
  else if (phase === 'result') updResult();
  if (phase !== 'dungeon') queue.length = 0;
}
function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, CW, CH);
  if (phase === 'dungeon' && D) drawDungeon();
  else if (phase === 'show' && SH) drawShow();
  else if (phase === 'guide') drawGuide();
  else if (phase === 'select') drawSelect();
  else if (phase === 'setup1') drawSetup1();
  else if (phase === 'setup2') drawSetup2();
  else if (phase === 'shop') drawShop();
  else if (phase === 'result') drawResult();
}

newGame();
var lastT = null;
function frame(ts) {
  requestAnimationFrame(frame);
  if (lastT === null) lastT = ts;
  var dt = Math.min((ts - lastT) / 1000, 1 / 30);
  lastT = ts;
  try {
    update(dt);
    render();
  } catch (err) {
    console.error(err);
  }
}
requestAnimationFrame(frame);
})();
