/* 導播台怪獸秀 - 玩法驗證 Demo
 * 邏輯與繪製分離: tick(dt) 更新狀態, render() 只依狀態呼叫 Art.drawXxx
 * 只掛鍵盤事件(方向鍵 + Z、X)
 */
(function () {
'use strict';

var W = Art.canvas.width, H = Art.canvas.height;
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var dpr = window.devicePixelRatio || 1;
canvas.width = Math.round(W * dpr);
canvas.height = Math.round(H * dpr);
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

/* ================= 工具 ================= */
var PI = Math.PI, TAU = Math.PI * 2;
function rnd(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function normAng(a) { while (a > PI) a -= TAU; while (a <= -PI) a += TAU; return a; }
function angDiff(a, b) { return normAng(a - b); }
function randSign() { return Math.random() < 0.5 ? 1 : -1; }
function unitDir(dx, dy) {
  var d = Math.hypot(dx, dy);
  if (d < 1) { var a = rnd(0, TAU); return { x: Math.cos(a), y: Math.sin(a), d: 0 }; }
  return { x: dx / d, y: dy / d, d: d };
}

/* ================= 資料表 ================= */
var SPECIES = ['bunny', 'cloud', 'rat', 'turtle', 'hawk', 'rhino'];
var SP = {
  bunny:  { name: '蒲公英兔', hp: 7,  effect: 'ignite', amt: 8,  interval: 3.0, drop: 3, gold: 2, rep: 1, decay: 2 },
  cloud:  { name: '霧雨雲',   hp: 7,  effect: 'calm',   amt: 12, interval: 3.0, drop: 3, gold: 1, rep: 1, decay: 2 },
  rat:    { name: '爆竹鼠',   hp: 12, effect: 'ignite', amt: 10, interval: 2.6, drop: 5, gold: 2, rep: 1, decay: 2 },
  turtle: { name: '磁石龜',   hp: 14, effect: 'pull',   amt: 0,  interval: 3.2, drop: 5, gold: 2, rep: 1, decay: 1.5 },
  hawk:   { name: '隕星鷹',   hp: 16, effect: 'ignite', amt: 8,  interval: 2.8, drop: 7, gold: 3, rep: 2, decay: 2 },
  rhino:  { name: '號角犀',   hp: 20, effect: 'push',   amt: 0,  interval: 3.0, drop: 8, gold: 3, rep: 2, decay: 1.5 }
};
var EFFECT_TEXT = {
  bunny: '朝八方射種子, 打中的會生氣', cloud: '在對手附近下雨, 淋到的會冷靜',
  rat: '丟爆竹炸一圈, 炸到的會生氣', turtle: '磁力球把附近的魔物吸過去',
  hawk: '召喚隕石雨, 砸到的會生氣', rhino: '一道震波把打中的推開'
};
var UP_COST = [40, 80, 140];
var BONUS = {
  bunny:  { n: '乘風', label: '移速', f: function (l) { return '+' + 25 * l; } },
  cloud:  { n: '濕潤', label: '準備捕捉時間', f: function (l) { return '−' + (0.15 * l).toFixed(2) + ' 秒'; } },
  rat:    { n: '火藥', label: 'X 武器技冷卻', f: function (l) { return '−' + 15 * l + '%'; } },
  turtle: { n: '磁力', label: '套索時限', f: function (l) { return '+' + l + ' 秒'; } },
  hawk:   { n: '鷹眼', label: 'Z 普攻範圍', f: function (l) { return '+' + 10 * l + '%'; } },
  rhino:  { n: '厚皮', label: '心', f: function (l) { return '+' + l; } }
};
var PROG = {
  brawl:    { name: '混戰', desc: '大家互相靠近' },
  scatter:  { name: '散開', desc: '大家互相遠離' },
  rest:     { name: '中場休息', desc: '全場慢慢冷靜' },
  cheer:    { name: '加油', desc: '全場慢慢升溫' },
  photo:    { name: '大合照', desc: '大家擠到中央' },
  allegro:  { name: '快板', desc: '大家表演得更勤' },
  parade:   { name: '遊行', desc: '大家繞場一圈' },
  adagio:   { name: '慢板', desc: '全場慢動作' }
};
var PROG_ORDER = ['brawl', 'scatter', 'rest', 'cheer', 'photo', 'allegro', 'parade', 'adagio'];
var PROG_PRICE = { photo: 40, allegro: 40, parade: 50, adagio: 30 };
var RULE = {
  calm:    { name: '冷靜鈴', desc: '當誰標記到 3, 那隻就冷靜', cd: 12 },
  pep:     { name: '打氣鈴', desc: '當誰怒氣掉到 50 下, 那隻就打起精神', cd: 8 },
  relay:   { name: '傳火令', desc: '當誰被激怒, 那隻就去撞最近的', cd: 4 },
  double:  { name: '連發令', desc: '當誰一招打中 2 隻以上, 那隻就再演一次', cd: 6 },
  shelter: { name: '避難令', desc: '當誰標記到 4, 那隻就躲開大家', cd: 15 }
};
var RULE_ORDER = ['calm', 'pep', 'relay', 'double', 'shelter'];
var RULE_PRICE = { relay: 40, double: 50, shelter: 30 };
var WEAPON_ORDER = ['club', 'sword', 'spear', 'whip'];
var WEAPON_DESC = { club: 'Z 敲擊 X 無', sword: 'Z 斬擊可打回飛彈 X 擊暈', spear: 'Z 長刺 X 突進', whip: 'Z 整圈抽打 X 擊飛' };
var UPG_DESC = { attack: '每次攻擊傷害 +1', armor: '心上限 +1', ropeBag: '每天捕獸繩 +1' };
var UPG_BASE = { attack: 50, armor: 40, ropeBag: 40 };
var SHOP_ITEMS = {
  char: ['club', 'sword', 'spear', 'whip', 'attack', 'armor', 'ropeBag'],
  show: ['photo', 'allegro', 'parade', 'adagio', 'relay', 'double', 'shelter'],
  monster: SPECIES
};
var SHOP_TABS = ['char', 'show', 'monster'];

var DUNGEONS = ['meadow', 'mine', 'temple'];
var DUN = {
  meadow: { mons: ['bunny', 'cloud'], map: [
    '################################',
    '#.........#..........#.........#',
    '#..b...o..#....WW....#..o...c..#',
    '#.......K......WW......K.......#',
    '#...W..........................#',
    '#.........#..........#.....W...#',
    '#.........#....F.....#.........#',
    '####..#####..........#####..####',
    '####..#####....S.....#####..####',
    '#.........#..........#.........#',
    '#...o.....#....o.....#.........#',
    '#.........................K....#',
    '#......K.......WW..........o...#',
    '#..b......#....WW....#.....c...#',
    '#.........#..........#.........#',
    '################################'] },
  mine: { mons: ['rat', 'turtle'], map: [
    '################################',
    '#.........#..........#.........#',
    '#..r..L...#...o..o...#...L..t..#',
    '#......K.................K.....#',
    '#.L.......................L....#',
    '#....W....#..........#.........#',
    '#.........#....F.....#....W....#',
    '####..#####..........#####..####',
    '####..#####....S.....#####..####',
    '#.........#..........#.........#',
    '#...L.....#..L....L..#....o....#',
    '#......K.....................t.#',
    '#..r...........WW.......K......#',
    '#....o....#..........#..L......#',
    '#.........#..........#.........#',
    '################################'] },
  temple: { mons: ['hawk', 'rhino'], map: [
    '################################',
    '#.........#..........#.........#',
    '#..h...L..#..o....o..#.n....L..#',
    '#....K....................K....#',
    '#..W...........LL..............#',
    '#.........#..........#....W....#',
    '#...o.....#....F.....#.........#',
    '####..#####..........#####..####',
    '####..#####....S.....#####..####',
    '#.........#..........#.........#',
    '#..L......#..o....o..#...o.....#',
    '#.....K.......................n#',
    '#.h............LL.........K....#',
    '#......L..#..........#..W......#',
    '#.........#..........#.........#',
    '################################'] }
};
var NEST_LETTER = { b: 'bunny', c: 'cloud', r: 'rat', t: 'turtle', h: 'hawk', n: 'rhino' };
var ROOMS = [
  { x0: 60, y0: 60, x1: 600, y1: 420 }, { x0: 60, y0: 540, x1: 600, y1: 900 },
  { x0: 1320, y0: 60, x1: 1860, y1: 420 }, { x0: 1320, y0: 540, x1: 1860, y1: 900 }
];
var SHOW_POS = [[380,260],[900,260],[380,450],[900,450],[640,356],[180,220],[1100,220],[180,490],[1100,490],[640,220],[640,490],[180,356],[1100,356],[510,356],[770,356],[510,220],[770,490],[770,220],[510,490],[300,356]];
var ARENA = { x0: 100, y0: 186, x1: 1180, y1: 526 };
var FONT = "'Microsoft JhengHei','PingFang TC','Noto Sans TC',sans-serif";

var GUIDE = [
  { title: '地下城', text: '方向鍵走, Z 攻擊, X 武器技' },
  { title: '收服', text: '殘血時站上去, 再繞牠一圈' },
  { title: '排節目', text: '排好節目順序, 掛上場規' },
  { title: '喊下一段', text: '表演中按 Z, 換下一段節目' },
  { title: '紅區', text: '紅區最賺, 標記滿 5 個就失控' },
  { title: '目標', text: '5 天內賺到越多名聲越好' }
];

/* ================= 全域狀態 ================= */
var S = {};
var keysHeld = {};
var keyQ = [];

function newGame() {
  S.phase = S.phase || 'guide';
  S.day = 1; S.gold = 30; S.rep = 0; S.goldEarned = 0; S.bestChain = 0;
  S.weapon = 'club'; S.wOwned = { club: true, sword: false, spear: false, whip: false };
  S.lv = { attack: 0, armor: 0, ropeBag: 0 };
  S.price = { attack: 50, armor: 40, ropeBag: 40 };
  S.bank = { bunny: 2, cloud: 2, rat: 0, turtle: 0, hawk: 0, rhino: 0 };
  S.ever = { bunny: true, cloud: true, rat: false, turtle: false, hawk: false, rhino: false };
  S.cap = { bunny: 0, cloud: 0, rat: 0, turtle: 0, hawk: 0, rhino: 0 };
  S.level = { bunny: 0, cloud: 0, rat: 0, turtle: 0, hawk: 0, rhino: 0 };
  S.stage = { bunny: 2, cloud: 2, rat: 0, turtle: 0, hawk: 0, rhino: 0 };
  S.progOwn = { brawl: true, scatter: true, rest: true, cheer: true, photo: false, allegro: false, parade: false, adagio: false };
  S.ruleOwn = { calm: true, pep: true, relay: false, double: false, shelter: false };
  S.schedule = ['', '', '', '', '', '', '', ''];
  S.slots = ['', '', ''];
  S.unlocked = { meadow: true, mine: false, temple: false };
  S.selCur = 0;
  S.s1 = { cur: 'card', ci: 0 };
  S.s2 = { cur: 'row', i: 0, slot: 0, rowMem: 0, picker: null };
  S.shop = { tab: 0, zone: 'tab', idx: 0 };
  S.dun = null; S.show = null;
}

function maxHearts() { return 6 + S.lv.armor + S.level.rhino; }
function maxRopes() { return 4 + S.lv.ropeBag; }
function stageTotal() { var n = 0; SPECIES.forEach(function (s) { n += S.stage[s]; }); return n; }
function checkUnlock() {
  if (S.rep >= 60 && S.cap.cloud >= 2) S.unlocked.mine = true;
  if (S.rep >= 200 && S.cap.turtle >= 2) S.unlocked.temple = true;
}
function addGold(n) { S.gold += n; S.goldEarned += n; }

function upgradeLines(sp) {
  var l = S.level[sp], b = BONUS[sp];
  if (l >= 3) return ['已滿級'];
  return [
    '升級 Lv' + l + ' → Lv' + (l + 1) + ' 費用 ' + UP_COST[l] + ' 金',
    '紅區 ' + (80 - 5 * l) + '~100 → ' + (80 - 5 * (l + 1)) + '~100',
    b.n + ' ' + b.label + ' ' + b.f(l) + ' → ' + b.f(l + 1)
  ];
}
function tryUpgrade(sp) {
  if (!S.ever[sp] || S.level[sp] >= 3) return false;
  var c = UP_COST[S.level[sp]];
  if (S.gold < c) return false;
  S.gold -= c; S.level[sp]++;
  return true;
}

/* ================= 幾何 ================= */
function faceAng(f) { return (f - 2) * PI / 4; }
function shapeHit(sh, px, py, margin) {
  var dx = px - sh.x, dy = py - sh.y, d = Math.hypot(dx, dy);
  if (sh.type === 'circle') return d <= sh.radius + margin;
  if (sh.type === 'arc') {
    if (d > sh.radius + margin) return false;
    if (d <= margin) return true;
    var diff = Math.abs(angDiff(Math.atan2(dy, dx), sh.angle));
    return diff <= sh.spread / 2 + Math.asin(Math.min(1, margin / d));
  }
  var c = Math.cos(sh.angle), s = Math.sin(sh.angle);
  var u = dx * c + dy * s, v = -dx * s + dy * c;
  return u >= -margin && u <= sh.length + margin && Math.abs(v) <= sh.width / 2 + margin;
}

/* ================= 魔物移動(地下城與表演場共用) ================= */
function mkMon(sp, x, y) {
  return {
    sp: sp, x: x, y: y, hp: SP[sp].hp, maxHp: SP[sp].hp, hitT: 0, stun: 0, lassoed: false,
    ang: rnd(0, TAU), dirT: rnd(0, 3), hopCd: rnd(0.2, 1.2), hopLeft: 0, hopDir: 0,
    runLeft: 0, pauseLeft: rnd(0, 1), turn: randSign(), turnT: 2, tpT: rnd(1.5, 3), fade: null,
    move: 'walk', moveT: 0, moveDur: 0, dir: 1, knock: null, side: randSign(),
    castT: SP[sp].interval, inRange: false
  };
}
function stepFade(m, dt, env) {
  var f = m.fade;
  f.t += dt;
  if (f.phase === 'out') {
    m.move = 'fadeOut'; m.moveT = Math.min(f.t, 0.3); m.moveDur = 0.3;
    if (f.t >= 0.3) { var p = env.tp(m); m.x = p.x; m.y = p.y; m.fade = { phase: 'in', t: 0 }; }
  } else {
    m.move = 'fadeIn'; m.moveT = Math.min(f.t, 0.3); m.moveDur = 0.3;
    if (f.t >= 0.3) { m.fade = null; m.move = 'walk'; m.moveT = 0; m.moveDur = 0; }
  }
}
function reflectIn(m, b) {
  if (m.x < b.x0) { m.x = b.x0; if (Math.cos(m.ang) < 0) m.ang = PI - m.ang; }
  if (m.x > b.x1) { m.x = b.x1; if (Math.cos(m.ang) > 0) m.ang = PI - m.ang; }
  if (m.y < b.y0) { m.y = b.y0; if (Math.sin(m.ang) < 0) m.ang = -m.ang; }
  if (m.y > b.y1) { m.y = b.y1; if (Math.sin(m.ang) > 0) m.ang = -m.ang; }
}
function stepMover(m, dt, env, k) {
  var b = env.bounds(m);
  function pick() { m.side = randSign(); var d = env.desired(m); return d === null ? rnd(0, TAU) : d; }
  var vx = 0, vy = 0, sp = m.sp, reflect = true;
  m.move = 'walk'; m.moveT = 0; m.moveDur = 0;
  if (sp === 'bunny') {
    reflect = false;
    if (m.hopLeft > 0) {
      m.hopLeft -= dt; vx = Math.cos(m.hopDir) * 300 * k; vy = Math.sin(m.hopDir) * 300 * k;
      m.move = 'hop'; m.moveDur = 0.3; m.moveT = clamp(0.3 - m.hopLeft, 0, 0.3);
    } else {
      m.hopCd -= dt;
      if (m.hopCd <= 0) { m.hopCd = 1.2; m.hopDir = pick(); m.hopLeft = 0.3; }
    }
  } else if (sp === 'cloud' || sp === 'turtle' || sp === 'rhino') {
    var spd = sp === 'cloud' ? 35 : (sp === 'turtle' ? 40 : 30), per = sp === 'cloud' ? 4 : 3;
    m.dirT -= dt;
    if (m.dirT <= 0) { m.dirT = per; m.ang = pick(); }
    vx = Math.cos(m.ang) * spd * k; vy = Math.sin(m.ang) * spd * k;
    if (sp === 'rhino') {
      m.tpT -= dt;
      if (m.tpT <= 0) { m.tpT = 3; m.fade = { phase: 'out', t: 0 }; vx = vy = 0; }
    }
  } else if (sp === 'rat') {
    if (m.runLeft > 0) {
      m.runLeft -= dt; vx = Math.cos(m.ang) * 160 * k; vy = Math.sin(m.ang) * 160 * k;
      if (m.runLeft <= 0) m.pauseLeft = 1.0;
    } else {
      m.pauseLeft -= dt;
      if (m.pauseLeft <= 0) { m.ang = pick(); m.runLeft = 0.8; }
    }
  } else if (sp === 'hawk') {
    var des = env.desired(m);
    if (des !== null) {
      var diff = angDiff(des, m.ang), st = Math.min(Math.abs(diff), 60 * PI / 180 * dt);
      m.ang += (diff >= 0 ? 1 : -1) * st;
    } else {
      m.turnT -= dt;
      if (m.turnT <= 0) { m.turnT = 2; m.turn = randSign(); }
      m.ang += m.turn * 60 * PI / 180 * dt;
    }
    vx = Math.cos(m.ang) * 110 * k; vy = Math.sin(m.ang) * 110 * k;
  }
  m.x += vx * dt; m.y += vy * dt;
  if (reflect) reflectIn(m, b);
  else { m.x = clamp(m.x, b.x0, b.x1); m.y = clamp(m.y, b.y0, b.y1); }
  if (vx > 0.01) m.dir = 1; else if (vx < -0.01) m.dir = -1;
}
function applyKnock(m, dt, b) {
  var kn = m.knock;
  var step = Math.min(dt, kn.dur - kn.t);
  m.x = clamp(m.x + kn.vx * step, b.x0, b.x1);
  m.y = clamp(m.y + kn.vy * step, b.y0, b.y1);
  kn.t += dt;
  if (kn.t >= kn.dur) m.knock = null;
}

/* ================= 魔物技能(共用) ================= */
function mkH(kind, phase, p) {
  var h = { kind: kind, phase: phase, x: 0, y: 0, radius: 0, pullRadius: 0, angle: 0, length: 0, width: 0, sx: 0, sy: 0, t: 0, dur: 0, reflected: false, speed: 0, owner: null, cast: null, resolved: false };
  for (var k in p) h[k] = p[k];
  return h;
}
function castSkill(m, tx, ty, cast, list) {
  var hs = [], i;
  if (m.sp === 'bunny') {
    for (i = 0; i < 8; i++) hs.push(mkH('seed', 'fly', { x: m.x, y: m.y, radius: 10, angle: i * PI / 4, speed: 130, dur: 4 }));
  } else if (m.sp === 'cloud') {
    for (i = 0; i < 3; i++) {
      var a = rnd(0, TAU), d = rnd(0, 70);
      hs.push(mkH('rain', 'warn', { x: tx + Math.cos(a) * d, y: ty + Math.sin(a) * d, radius: 50, dur: 1.0 }));
    }
  } else if (m.sp === 'rat') {
    hs.push(mkH('cracker', 'warn', { x: tx, y: ty, radius: 80, sx: m.x, sy: m.y, dur: 0.8 }));
  } else if (m.sp === 'turtle') {
    var u = unitDir(tx - m.x, ty - m.y);
    hs.push(mkH('magnet', 'fly', { x: m.x, y: m.y, radius: 20, pullRadius: 170, angle: Math.atan2(u.y, u.x), speed: 90, dur: 2 }));
  } else if (m.sp === 'hawk') {
    var pts = [];
    for (i = 0; i < 4; i++) {
      var p = null, tries;
      for (var relax = 0; relax < 2 && !p; relax++) {
        for (tries = 0; tries < 30 && !p; tries++) {
          var aa = rnd(0, TAU), dd = 200 * Math.sqrt(Math.random());
          var c = { x: tx + Math.cos(aa) * dd, y: ty + Math.sin(aa) * dd };
          var ok = true;
          if (!relax) for (var j = 0; j < pts.length; j++) if (dist(c, pts[j]) < 60) ok = false;
          if (ok) p = c;
        }
      }
      pts.push(p);
      hs.push(mkH('meteor', 'warn', { x: p.x, y: p.y, radius: 60, dur: 1.0 }));
    }
  } else if (m.sp === 'rhino') {
    var q = unitDir(tx - m.x, ty - m.y);
    hs.push(mkH('quake', 'warn', { x: m.x, y: m.y, angle: Math.atan2(q.y, q.x), length: 520, width: 44, dur: 0.7 }));
  }
  hs.forEach(function (h) { h.owner = m; h.cast = cast; list.push(h); });
  if (cast) cast.pending = hs.length;
  return hs;
}

/* ================= 地下城 ================= */
function dunCam() {
  var t = S.dun.tamer;
  return { x: clamp(t.x - 640, 0, 640), y: clamp(t.y - 310, 0, 340) };
}
function solidAt(col, row) {
  if (col < 0 || row < 0 || col >= 32 || row >= 16) return true;
  var k = S.dun.kinds[row][col];
  return k === 'wall' || k === 'pillar';
}
function pointSolid(x, y) { return solidAt(Math.floor(x / 60), Math.floor(y / 60)); }
function blockedCircle(x, y, r) {
  var D = S.dun, c0 = Math.floor((x - r) / 60), c1 = Math.floor((x + r) / 60), r0 = Math.floor((y - r) / 60), r1 = Math.floor((y + r) / 60), c, rr;
  for (rr = r0; rr <= r1; rr++) for (c = c0; c <= c1; c++) {
    if (!solidAt(c, rr)) continue;
    var nx = clamp(x, c * 60, c * 60 + 60), ny = clamp(y, rr * 60, rr * 60 + 60);
    if ((x - nx) * (x - nx) + (y - ny) * (y - ny) < r * r) return true;
  }
  for (var i = 0; i < D.kegs.length; i++) {
    var k = D.kegs[i];
    if (k.mode !== 'gone' && Math.hypot(x - k.x, y - k.y) < r + 22) return true;
  }
  return false;
}
function moveTamer(dx, dy) {
  var t = S.dun.tamer, moved = false;
  if (dx !== 0 && !blockedCircle(t.x + dx, t.y, 18)) { t.x += dx; moved = true; }
  if (dy !== 0 && !blockedCircle(t.x, t.y + dy, 18)) { t.y += dy; moved = true; }
  return moved;
}
function roomOf(x, y) {
  for (var i = 0; i < ROOMS.length; i++) {
    var r = ROOMS[i];
    if (x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) return r;
  }
  return ROOMS[0];
}
function roomBounds(room) { return { x0: room.x0 + 30, y0: room.y0 + 30, x1: room.x1 - 30, y1: room.y1 - 30 }; }

function startDungeon(key) {
  var d = DUN[key];
  var D = {
    key: key, kinds: [], kegs: [], fountain: null, nests: [], mons: [], hazards: [], fxs: [], blasts: [], floats: [],
    timeLeft: 75, hearts: maxHearts(), ropes: maxRopes(), cdZ: 0, cdX: 0, zBuf: 0, xBuf: 0,
    ring: null, lasso: null, tamer: null, over: false
  };
  var sx = 0, sy = 0;
  for (var r = 0; r < 16; r++) {
    var row = [];
    for (var c = 0; c < 32; c++) {
      var ch = d.map[r][c], kind = 'floor', cx = c * 60 + 30, cy = r * 60 + 30;
      if (ch === '#') kind = 'wall'; else if (ch === 'o') kind = 'pillar'; else if (ch === 'L') kind = 'hurt'; else if (ch === 'W') kind = 'slow';
      else if (ch === 'S') { sx = cx; sy = cy; }
      else if (ch === 'K') D.kegs.push({ x: cx, y: cy, mode: 'ok', fuseT: 0, respawn: 0 });
      else if (ch === 'F') D.fountain = { x: cx, y: cy, full: true };
      else if (NEST_LETTER[ch]) { var n = { x: cx, y: cy, sp: NEST_LETTER[ch], mon: null, respawn: 0, room: roomOf(cx, cy), nest: true }; D.nests.push(n); }
      row.push(kind);
    }
    D.kinds.push(row);
  }
  D.nestSet = {};
  D.nests.forEach(function (n) { D.nestSet[Math.floor(n.y / 60) * 32 + Math.floor(n.x / 60)] = true; });
  D.tamer = { x: sx, y: sy, facing: 0, invuln: 0, dash: 0, dashHit: null, dashAng: 0, knock: null };
  S.dun = D; S.phase = 'dungeon';
  D.nests.forEach(function (n) { spawnNest(n); });
  keyQ.length = 0;
}
function spawnNest(n) {
  var m = mkMon(n.sp, n.x, n.y);
  m.nest = n; m.room = n.room;
  n.mon = m; S.dun.mons.push(m);
}
function isWeak(m) { return m.hp <= m.maxHp * 0.3; }
function dunFloat(x, y, text, kind) { S.dun.floats.push({ x: x, y: y, text: text, kind: kind, t: 0, dur: 1 }); }

function removeMon(m) {
  var D = S.dun, i = D.mons.indexOf(m);
  if (i >= 0) D.mons.splice(i, 1);
  if (m.nest) { m.nest.mon = null; m.nest.respawn = 10; }
  if (D.ring && D.ring.mon === m) D.ring = null;
}
function damageMon(m, dmg) {
  var D = S.dun;
  if (m.lassoed || m.hp <= 0) return;
  m.hp -= dmg; m.hitT = 0.1;
  if (D.ring && D.ring.mon === m) D.ring = null;
  if (m.hp <= 0) {
    addGold(SP[m.sp].drop);
    dunFloat(m.x, m.y - 40, '+' + SP[m.sp].drop, 'gold');
    removeMon(m);
  }
}
function hurtTamer() {
  var D = S.dun, t = D.tamer;
  if (t.invuln > 0 || t.dash > 0) return false;
  D.hearts--; t.invuln = 1.2;
  breakLasso();
  return true;
}
function breakLasso() {
  var D = S.dun;
  if (D.lasso) { D.lasso.mon.lassoed = false; D.lasso = null; D.ring = null; }
}
function igniteKeg(k) { if (k.mode === 'ok') { k.mode = 'fuse'; k.fuseT = 0; } }
function explodeKeg(k) {
  var D = S.dun;
  k.mode = 'gone'; k.respawn = 20; k.fuseT = 0;
  D.blasts.push({ x: k.x, y: k.y, radius: 130, t: 0, dur: 0.3 });
  D.mons.slice().forEach(function (m) { if (!m.lassoed && Math.hypot(m.x - k.x, m.y - k.y) <= 130) damageMon(m, 4); });
  if (Math.hypot(D.tamer.x - k.x, D.tamer.y - k.y) <= 130 + 18) hurtTamer();
  D.kegs.forEach(function (o) { if (o !== k && o.mode === 'ok' && Math.hypot(o.x - k.x, o.y - k.y) <= 130) igniteKeg(o); });
}

function dunEnv() {
  var D = S.dun;
  return {
    bounds: function (m) { return roomBounds(m.room); },
    desired: function (m) {
      var t = D.tamer, dx = t.x - m.x, dy = t.y - m.y, d = Math.hypot(dx, dy);
      if (d >= 300 || d < 1) return null;
      var to = Math.atan2(dy, dx);
      if (d > 200) return to;
      if (d < 120) return to + PI;
      return to + (m.side > 0 ? PI / 2 : -PI / 2);
    },
    tp: function (m) {
      var b = roomBounds(m.room), t = D.tamer, d = Math.hypot(t.x - m.x, t.y - m.y), i;
      if (d < 300) {
        for (i = 0; i < 30; i++) {
          var a = rnd(0, TAU), r = rnd(150, 250), x = t.x + Math.cos(a) * r, y = t.y + Math.sin(a) * r;
          if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) return { x: x, y: y };
        }
      }
      return { x: rnd(b.x0, b.x1), y: rnd(b.y0, b.y1) };
    }
  };
}

function updateWild(m, dt, env) {
  var D = S.dun, t = D.tamer;
  m.hitT = Math.max(0, m.hitT - dt);
  if (m.lassoed) { m.move = 'walk'; return; }
  var b = roomBounds(m.room);
  if (m.knock) { applyKnock(m, dt, b); return; }
  if (m.stun > 0) { m.stun -= dt; return; }
  var weak = isWeak(m);
  if (m.fade) stepFade(m, dt, env);
  else stepMover(m, dt, env, weak ? 0.5 : 1);
  var d = Math.hypot(t.x - m.x, t.y - m.y);
  var itv = SP[m.sp].interval * (weak ? 1.5 : 1);
  if (d < 300) {
    if (!m.inRange) { m.inRange = true; m.castT = itv; }
    else if (!m.fade) {
      m.castT -= dt;
      if (m.castT <= 0) { castSkill(m, t.x, t.y, null, D.hazards); m.castT = itv; }
    }
  } else m.inRange = false;
}

function reflectProj(h) {
  var t = S.dun.tamer, o = h.owner, a;
  if (o && S.dun.mons.indexOf(o) >= 0) a = Math.atan2(o.y - t.y, o.x - t.x); else a = h.angle + PI;
  h.angle = a; h.speed *= 1.2; h.reflected = true; h.pullRadius = 0;
}

function dunHazardResolve(h) {
  var D = S.dun, t = D.tamer;
  if (h.kind === 'quake') {
    var sh = { type: 'line', x: h.x, y: h.y, angle: h.angle, length: h.length, width: h.width };
    if (shapeHit(sh, t.x, t.y, 18)) {
      if (hurtTamer() || t.invuln > 0) {
        t.knock = { vx: Math.cos(h.angle) * 560, vy: Math.sin(h.angle) * 560, t: 0, dur: 0.25 };
      }
    }
    D.kegs.forEach(function (k) { if (shapeHit(sh, k.x, k.y, 0)) igniteKeg(k); });
  } else {
    if (Math.hypot(t.x - h.x, t.y - h.y) <= h.radius + 18) hurtTamer();
    D.kegs.forEach(function (k) { if (Math.hypot(k.x - h.x, k.y - h.y) <= h.radius) igniteKeg(k); });
  }
}
function updateDunHazards(dt) {
  var D = S.dun, t = D.tamer, list = D.hazards;
  for (var i = list.length - 1; i >= 0; i--) {
    var h = list[i], rm = false;
    if (h.phase === 'warn') {
      h.t += dt;
      if (h.t >= h.dur) { h.phase = 'active'; h.t = 0; h.dur = 0.2; dunHazardResolve(h); }
    } else if (h.phase === 'active') {
      h.t += dt; if (h.t >= h.dur) rm = true;
    } else {
      h.t += dt;
      h.x += Math.cos(h.angle) * h.speed * dt; h.y += Math.sin(h.angle) * h.speed * dt;
      if (h.t >= h.dur || pointSolid(h.x, h.y)) rm = true;
      if (!rm) {
        for (var ki = 0; ki < D.kegs.length; ki++) {
          var k = D.kegs[ki];
          if (k.mode !== 'gone' && Math.hypot(h.x - k.x, h.y - k.y) <= h.radius + 22) { igniteKeg(k); rm = true; break; }
        }
      }
      if (!rm && h.reflected) {
        for (var mi = 0; mi < D.mons.length; mi++) {
          var m = D.mons[mi];
          if (Math.hypot(h.x - m.x, h.y - m.y) <= h.radius + 24 && !m.lassoed) {
            damageMon(m, 3 + S.lv.attack); rm = true; break;
          }
        }
      } else if (!rm) {
        if (h.kind === 'seed') {
          if (Math.hypot(h.x - t.x, h.y - t.y) <= h.radius + 18) { hurtTamer(); rm = true; }
        } else if (h.kind === 'magnet') {
          var dd = Math.hypot(h.x - t.x, h.y - t.y);
          if (dd <= h.radius + 18) { hurtTamer(); rm = true; }
          else {
            if (dd <= h.pullRadius && dd > 20) { var u = unitDir(h.x - t.x, h.y - t.y); moveTamer(u.x * 110 * dt, u.y * 110 * dt); }
            D.mons.forEach(function (m2) {
              if (m2 === h.owner || m2.lassoed || m2.knock) return;
              var d2 = Math.hypot(h.x - m2.x, h.y - m2.y);
              if (d2 <= h.pullRadius && d2 > 20) {
                var u2 = unitDir(h.x - m2.x, h.y - m2.y), b = roomBounds(m2.room);
                m2.x = clamp(m2.x + u2.x * 110 * dt, b.x0, b.x1); m2.y = clamp(m2.y + u2.y * 110 * dt, b.y0, b.y1);
              }
            });
          }
        }
      }
    }
    if (rm) list.splice(i, 1);
  }
}

/* --- 武器 --- */
function atkBonus() { return S.lv.attack; }
function xCdMax() {
  var w = S.weapon;
  if (w === 'club') return 0;
  var base = w === 'sword' ? 3 : 1.2;
  return base * (1 - 0.15 * S.level.rat);
}
function tryZ() {
  var D = S.dun;
  if (D.cdZ > 0) { D.zBuf = 0.15; return; }
  doZ();
}
function doZ() {
  var D = S.dun, t = D.tamer, w = S.weapon, a = faceAng(t.facing), mul = 1 + 0.1 * S.level.hawk;
  var sh, dmg = 2, cd = 0.35, fx;
  if (w === 'club') { sh = { type: 'arc', x: t.x, y: t.y, angle: a, spread: 100 * PI / 180, radius: 70 * mul }; }
  else if (w === 'sword') { sh = { type: 'arc', x: t.x, y: t.y, angle: a, spread: 120 * PI / 180, radius: 80 * mul }; }
  else if (w === 'spear') { sh = { type: 'line', x: t.x, y: t.y, angle: a, length: 170 * mul, width: 40 }; cd = 0.45; }
  else { sh = { type: 'circle', x: t.x, y: t.y, radius: 100 * mul }; dmg = 1; cd = 0.4; }
  D.cdZ = cd;
  fx = { weapon: w, move: 'normal', shape: sh.type === 'arc' ? 'arc' : (sh.type === 'circle' ? 'circle' : 'line'), x: t.x, y: t.y, angle: a,
    spread: sh.spread || 0, radius: sh.radius || 0, length: sh.length || 0, width: sh.width || 0, t: 0, dur: 0.2 };
  D.fxs.push(fx);
  D.mons.slice().forEach(function (m) { if (shapeHit(sh, m.x, m.y, 24)) damageMon(m, dmg + atkBonus()); });
  D.kegs.forEach(function (k) { if (shapeHit(sh, k.x, k.y, 0)) igniteKeg(k); });
  if (w === 'sword') {
    D.hazards.forEach(function (h) {
      if (h.phase === 'fly' && !h.reflected && (h.kind === 'seed' || h.kind === 'magnet') && shapeHit(sh, h.x, h.y, h.radius)) reflectProj(h);
    });
  }
}
function tryX() {
  var D = S.dun;
  if (S.weapon === 'club') return;
  if (D.cdX > 0) { D.xBuf = 0.15; return; }
  doX();
}
function doX() {
  var D = S.dun, t = D.tamer, w = S.weapon, a = faceAng(t.facing), fx, sh;
  D.cdX = xCdMax();
  if (w === 'sword') {
    sh = { type: 'arc', x: t.x, y: t.y, angle: a, spread: 120 * PI / 180, radius: 80 };
    fx = { weapon: w, move: 'skill', shape: 'arc', x: t.x, y: t.y, angle: a, spread: sh.spread, radius: 80, length: 0, width: 0, t: 0, dur: 0.2 };
    D.mons.forEach(function (m) {
      if (shapeHit(sh, m.x, m.y, 24)) {
        m.stun = 2; m.stunDur = 2;
        for (var i = D.hazards.length - 1; i >= 0; i--) if (D.hazards[i].owner === m && D.hazards[i].phase === 'warn') D.hazards.splice(i, 1);
      }
    });
    D.kegs.forEach(function (k) { if (shapeHit(sh, k.x, k.y, 0)) igniteKeg(k); });
  } else if (w === 'spear') {
    fx = { weapon: w, move: 'skill', shape: 'dash', x: t.x, y: t.y, angle: a, spread: 0, radius: 0, length: 220, width: 40, t: 0, dur: 0.25 };
    sh = { type: 'line', x: t.x, y: t.y, angle: a, length: 220, width: 40 };
    D.kegs.forEach(function (k) { if (shapeHit(sh, k.x, k.y, 0)) igniteKeg(k); });
    t.dash = 0.25; t.dashAng = a; t.dashHit = [];
  } else {
    sh = { type: 'arc', x: t.x, y: t.y, angle: a, spread: 100 * PI / 180, radius: 170 };
    fx = { weapon: w, move: 'skill', shape: 'arc', x: t.x, y: t.y, angle: a, spread: sh.spread, radius: 170, length: 0, width: 0, t: 0, dur: 0.2 };
    D.mons.slice().forEach(function (m) {
      if (shapeHit(sh, m.x, m.y, 24)) {
        var had = !m.lassoed;
        damageMon(m, 2 + atkBonus());
        if (had && m.hp > 0) m.knock = { vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, t: 0, dur: 0.25 };
      }
    });
    D.kegs.forEach(function (k) { if (shapeHit(sh, k.x, k.y, 0)) igniteKeg(k); });
  }
  D.fxs.push(fx);
}

/* --- 捕捉 --- */
function updateCapture(dt) {
  var D = S.dun, t = D.tamer;
  if (D.lasso) {
    var L = D.lasso, m = L.mon;
    var ang = Math.atan2(t.y - m.y, t.x - m.x);
    L.sum += normAng(ang - L.last); L.last = ang;
    L.t += dt;
    var d = Math.hypot(t.x - m.x, t.y - m.y);
    if (Math.abs(L.sum) >= TAU) { captureDone(m); return; }
    if (L.t >= L.limit || d > 220) breakLasso();
    return;
  }
  var best = null, bd = 1e9;
  if (D.ropes > 0) {
    D.mons.forEach(function (m) {
      if (!isWeak(m) || m.fade || m.lassoed) return;
      var d = Math.hypot(t.x - m.x, t.y - m.y);
      if (d <= 40 && d < bd) { bd = d; best = m; }
    });
  }
  if (!best) { D.ring = null; return; }
  var dur = Math.max(0.35, 0.8 - 0.15 * S.level.cloud);
  if (!D.ring || D.ring.mon !== best) D.ring = { mon: best, t: 0, dur: dur };
  D.ring.dur = dur;
  D.ring.t += dt;
  if (D.ring.t >= dur) {
    best.lassoed = true;
    for (var i = D.hazards.length - 1; i >= 0; i--) if (D.hazards[i].owner === best && D.hazards[i].phase === 'warn') D.hazards.splice(i, 1);
    var a0 = Math.atan2(t.y - best.y, t.x - best.x);
    D.lasso = { mon: best, t: 0, limit: 5 + S.level.turtle, sum: 0, last: a0 };
    D.ring = null;
  }
}
function captureDone(m) {
  var D = S.dun, sp = m.sp;
  D.ropes--; D.lasso = null; D.ring = null;
  dunFloat(m.x, m.y - 40, '收服!', 'capture');
  removeMon(m);
  S.bank[sp]++; S.ever[sp] = true; S.cap[sp]++;
  if (stageTotal() < 20) S.stage[sp]++;
  checkUnlock();
}

function updateDungeon(dt) {
  var D = S.dun, t = D.tamer, env = dunEnv(), i;
  D.timeLeft -= dt;
  D.cdZ = Math.max(0, D.cdZ - dt); D.cdX = Math.max(0, D.cdX - dt);
  D.zBuf = Math.max(0, D.zBuf - dt); D.xBuf = Math.max(0, D.xBuf - dt);
  if (D.zBuf > 0 && D.cdZ <= 0) { D.zBuf = 0; doZ(); }
  if (D.xBuf > 0 && D.cdX <= 0 && S.weapon !== 'club') { D.xBuf = 0; doX(); }
  t.invuln = Math.max(0, t.invuln - dt);
  /* 爆炸桶 */
  D.kegs.forEach(function (k) {
    if (k.mode === 'fuse') { k.fuseT += dt; if (k.fuseT >= 0.6) explodeKeg(k); }
    else if (k.mode === 'gone') {
      k.respawn -= dt;
      if (k.respawn <= 0 && Math.hypot(t.x - k.x, t.y - k.y) > 18 + 22 + 2) { k.mode = 'ok'; k.fuseT = 0; }
    }
  });
  /* 馴獸師移動 */
  var mx = 0, my = 0;
  if (keysHeld.ArrowLeft) mx -= 1; if (keysHeld.ArrowRight) mx += 1;
  if (keysHeld.ArrowUp) my -= 1; if (keysHeld.ArrowDown) my += 1;
  if (t.knock) {
    var kn = t.knock, st = Math.min(dt, kn.dur - kn.t);
    moveTamer(kn.vx * st, kn.vy * st);
    kn.t += dt; if (kn.t >= kn.dur) t.knock = null;
  } else if (t.dash > 0) {
    var st2 = Math.min(dt, t.dash);
    var moved = moveTamer(Math.cos(t.dashAng) * 880 * st2, Math.sin(t.dashAng) * 880 * st2);
    D.mons.slice().forEach(function (m) {
      if (t.dashHit.indexOf(m) < 0 && Math.hypot(m.x - t.x, m.y - t.y) <= 18 + 24) { t.dashHit.push(m); damageMon(m, 3 + atkBonus()); }
    });
    t.dash -= dt;
    if (!moved) t.dash = 0;
  } else if (mx || my) {
    var u = unitDir(mx, my);
    var spd = 300 + 25 * S.level.bunny;
    var kind = D.kinds[Math.floor(t.y / 60)][Math.floor(t.x / 60)];
    if (kind === 'slow') spd *= 0.5;
    moveTamer(u.x * spd * dt, u.y * spd * dt);
    t.facing = ((Math.round(Math.atan2(mx, -my) / (PI / 4)) % 8) + 8) % 8;
  }
  if (mx || my) t.facing = ((Math.round(Math.atan2(mx, -my) / (PI / 4)) % 8) + 8) % 8;
  /* 傷害地形 */
  if (D.kinds[Math.floor(t.y / 60)][Math.floor(t.x / 60)] === 'hurt') hurtTamer();
  /* 回復泉 */
  var f = D.fountain;
  if (f && f.full && D.hearts < maxHearts() && Math.hypot(t.x - f.x, t.y - f.y) <= 30) {
    D.hearts = maxHearts(); f.full = false; dunFloat(t.x, t.y - 40, '心補滿', 'heal');
  }
  /* 魔物 */
  D.mons.slice().forEach(function (m) { updateWild(m, dt, env); });
  D.nests.forEach(function (n) {
    if (!n.mon) { n.respawn -= dt; if (n.respawn <= 0) spawnNest(n); }
  });
  updateDunHazards(dt);
  updateCapture(dt);
  /* 特效計時 */
  [D.fxs, D.blasts, D.floats].forEach(function (arr) {
    for (i = arr.length - 1; i >= 0; i--) { arr[i].t += dt; if (arr[i].t >= arr[i].dur) arr.splice(i, 1); }
  });
  if (D.hearts <= 0 || D.timeLeft <= 0) finishDungeon();
}
function finishDungeon() {
  S.dun.lasso = null;
  var cur = S.s1.ci;
  S.phase = 'setup1';
  S.s1 = { cur: 'card', ci: cur };
  checkUnlock();
  keyQ.length = 0;
}

/* ================= 表演場 ================= */
function sh() { return S.show; }
function redLow(m) { return 80 - 5 * S.level[m.sp]; }
function curProg() { var s = S.show; return s.seg < 8 ? S.schedule[s.seg] : ''; }

function startShow() {
  var list = [], idx = 0;
  SPECIES.forEach(function (sp) {
    for (var i = 0; i < S.stage[sp]; i++) {
      var p = SHOW_POS[idx++], m = mkMon(sp, p[0], p[1]);
      m.level = S.level[sp]; m.rage = 60; m.marks = 0; m.markT = 0; m.markAddT = -10; m.slow = false;
      m.sinceLast = 0; m.firstDelay = rnd(0.5, 2); m.performT = 0.5; m.performing = false;
      m.fx = 'none'; m.fxT = 0; m.mode = 'roam'; m.loose = false; m.looseState = '';
      m.chargeT = 0; m.looseT = 0; m.shelterT = 0; m.dashT = 0; m.relayWait = 0; m.relayChain = 1;
      m.echoT = 0; m.echoChain = 1; m.lastEcho = -10; m.doubleT = 0; m.doubleChain = 1;
      m.evRelay = null; m.evDouble = null; m.cd = { calm: 0, pep: 0, relay: 0, double: 0, shelter: 0 };
      m.dashTarget = null; m.attackT = 0; m.fenceI = 0; m.fenceSide = 'top';
      list.push(m);
    }
  });
  var vis = { top: [], bottom: [] }, fen = { top: [], bottom: [] };
  for (var i = 0; i < 8; i++) {
    vis.top.push({ mode: 'watch', t: 0 }); vis.bottom.push({ mode: 'watch', t: 0 });
    fen.top.push(false); fen.bottom.push(false);
  }
  S.show = {
    mons: list, hazards: [], floats: [], ruleFx: [], flash: [0.3, 0.3, 0.3], banner: null,
    timeLeft: 45, now: 0, seg: 0, segT: 0, zCool: 0, visitors: vis, fences: fen
  };
  S.show.banner = { program: S.schedule[0], t: 0, dur: 0.8 };
  S.phase = 'show';
  keyQ.length = 0;
}
function showFloat(x, y, text, kind) { S.show.floats.push({ x: x, y: y, text: text, kind: kind, t: 0, dur: 1 }); }
function showEnv() {
  return {
    bounds: function () { return ARENA; },
    desired: function () { return null; },
    tp: function (m) {
      var a = rnd(0, TAU), d = 350 * Math.sqrt(Math.random());
      return { x: clamp(m.x + Math.cos(a) * d, ARENA.x0, ARENA.x1), y: clamp(m.y + Math.sin(a) * d, ARENA.y0, ARENA.y1) };
    }
  };
}
function validTarget(m, owner) { return m !== owner && !m.loose && m.shelterT <= 0; }
function nearestTarget(m) {
  var best = null, bd = 1e9;
  S.show.mons.forEach(function (o) {
    if (o === m || o.loose || o.shelterT > 0 || o.fade) return;
    var d = dist(m, o);
    if (d < bd) { bd = d; best = o; }
  });
  return best;
}
function nearestOther(m) {
  var best = null, bd = 1e9;
  S.show.mons.forEach(function (o) {
    if (o === m || o.loose) return;
    var d = dist(m, o);
    if (d < bd) { bd = d; best = o; }
  });
  return best;
}
function setFx(m, fx) { m.fx = fx; m.fxT = 0; }
function startMarks(m) {
  m.marks = 1; m.markT = curProg() === 'rest' ? 2 : 4; m.markAddT = S.show.now; m.slow = false; m.rage = 100;
}
function igniteMon(m, amt, chain, skill) {
  var s = S.show;
  if (m.loose) return;
  if (m.marks > 0) {
    if (s.now - m.markAddT >= 1) {
      m.marks++; m.markAddT = s.now; m.markT = curProg() === 'rest' ? 2 : 4;
      if (m.marks >= 5) { goLoose(m); return; }
    }
  } else {
    var before = m.rage;
    m.rage = Math.min(100, m.rage + amt);
    if (m.rage >= 100 && (before < 100 || m.slow)) startMarks(m);
  }
  setFx(m, 'ignited');
  if (skill) {
    m.evRelay = chain;
    if (m.rage >= redLow(m) && s.now - m.lastEcho >= 1.5) { m.echoT = 0.3; m.echoChain = chain + 1; m.lastEcho = s.now; }
  }
}
function calmMon(m, amt) {
  if (m.loose) return;
  if (m.marks > 0) {
    m.marks--; m.markT = curProg() === 'rest' ? 2 : 4;
    if (m.marks === 0) { m.markT = 0; m.slow = true; }
  } else m.rage = Math.max(0, m.rage - amt);
  setFx(m, 'doused');
}
function showHit(h, m) {
  var cast = h.cast, o = h.owner, e = SP[o.sp].effect;
  if (!validTarget(m, o) || cast.hits.has(m)) return false;
  cast.hits.add(m);
  if (e === 'ignite') igniteMon(m, SP[o.sp].amt, cast.chain, true);
  else if (e === 'calm') calmMon(m, SP[o.sp].amt);
  else if (e === 'push') { m.knock = { vx: Math.cos(h.angle) * 560, vy: Math.sin(h.angle) * 560, t: 0, dur: 0.25 }; setFx(m, 'pulled'); }
  else setFx(m, 'pulled');
  return true;
}
function endPending(h) {
  var c = h.cast;
  if (!c || c.done) return;
  c.pending--;
  if (c.pending <= 0) settleCast(c);
}
function settleCast(c) {
  c.done = true;
  var o = c.owner, hits = c.hits.size, sp = SP[o.sp];
  var g = sp.gold * (1 + 0.5 * hits) * (c.red ? 2 : 1) * (1 + 0.25 * (c.chain - 1)) * Math.min(3, 1 + S.rep / 300);
  g = Math.max(1, Math.round(g));
  addGold(g); S.rep += sp.rep;
  showFloat(o.x, o.y - 50, '+' + g + (c.red ? ' ×2' : ''), c.red ? 'redGold' : 'gold');
  if (c.chain >= 2) showFloat(o.x, o.y - 76, '連鎖 ' + c.chain, 'chain');
  if (hits >= 2 && !o.loose) o.evDouble = c.chain;
}
function performMon(m, chain) {
  var s = S.show;
  if (m.loose) return;
  m.performT = 0; m.performing = true; m.sinceLast = 0; m.firstDelay = null;
  var tg = nearestTarget(m), tx = tg ? tg.x : 640, ty = tg ? tg.y : 356;
  var cast = { owner: m, chain: chain, hits: new Set(), pending: 0, red: m.rage >= redLow(m), done: false };
  if (chain > S.bestChain) S.bestChain = chain;
  castSkill(m, tx, ty, cast, s.hazards);
}
function resolveShowRange(h) {
  var s = S.show;
  if (h.kind === 'quake') {
    var shp = { type: 'line', x: h.x, y: h.y, angle: h.angle, length: h.length, width: h.width };
    s.mons.forEach(function (m) { if (validTarget(m, h.owner) && shapeHit(shp, m.x, m.y, 0)) showHit(h, m); });
  } else {
    s.mons.forEach(function (m) { if (validTarget(m, h.owner) && Math.hypot(m.x - h.x, m.y - h.y) <= h.radius) showHit(h, m); });
  }
}
function updateShowHazards(dt) {
  var s = S.show, list = s.hazards, adagio = curProg() === 'adagio';
  for (var i = list.length - 1; i >= 0; i--) {
    var h = list[i], rm = false;
    if (h.phase === 'warn') {
      h.t += dt;
      if (h.t >= h.dur) { h.phase = 'active'; h.t = 0; h.dur = 0.2; resolveShowRange(h); endPending(h); }
    } else if (h.phase === 'active') {
      h.t += dt; if (h.t >= h.dur) rm = true;
    } else {
      var k = adagio ? 0.5 : 1;
      h.t += dt;
      h.x += Math.cos(h.angle) * h.speed * k * dt; h.y += Math.sin(h.angle) * h.speed * k * dt;
      if (h.t >= h.dur || h.x < 60 || h.x > 1220 || h.y < 146 || h.y > 566) rm = true;
      else if (h.kind === 'seed') {
        for (var mi = 0; mi < s.mons.length; mi++) {
          var m = s.mons[mi];
          if (validTarget(m, h.owner) && !h.cast.hits.has(m) && Math.hypot(h.x - m.x, h.y - m.y) <= h.radius + 24) { showHit(h, m); rm = true; break; }
        }
      } else if (h.kind === 'magnet') {
        s.mons.forEach(function (m2) {
          if (!validTarget(m2, h.owner)) return;
          var d2 = Math.hypot(h.x - m2.x, h.y - m2.y);
          if (d2 <= h.pullRadius) {
            h.cast.hits.add(m2); setFx(m2, 'pulled');
            if (d2 > 20) {
              var u = unitDir(h.x - m2.x, h.y - m2.y);
              m2.x = clamp(m2.x + u.x * 110 * dt, ARENA.x0, ARENA.x1); m2.y = clamp(m2.y + u.y * 110 * dt, ARENA.y0, ARENA.y1);
            }
          }
        });
      }
    }
    if (rm) { if (h.phase === 'fly') endPending(h); list.splice(i, 1); }
  }
}

function goLoose(m) {
  var s = S.show;
  m.loose = true; m.marks = 0; m.markT = 0; m.dashT = 0; m.shelterT = 0; m.relayWait = 0; m.echoT = 0; m.doubleT = 0;
  m.knock = null; m.evRelay = null; m.evDouble = null; m.performing = false; m.fade = null;
  m.looseState = 'approach'; m.chargeT = 0; m.looseT = 0; m.attackT = 0;
  m.fenceSide = m.y < 356 ? 'top' : 'bottom';
  var bi = 0, bd = 1e9;
  for (var i = 0; i < 8; i++) { var d = Math.abs(165 + 136 * i - m.x); if (d < bd) { bd = d; bi = i; } }
  m.fenceI = bi;
  m.mode = 'charge'; m.move = 'walk'; m.moveT = 0; m.moveDur = 0;
}
function updateLoose(m, dt) {
  var s = S.show, fx = 165 + 136 * m.fenceI, fy = m.fenceSide === 'top' ? 140 : 572;
  if (m.looseState === 'approach') {
    var u = unitDir(fx - m.x, fy - m.y);
    if (u.d <= 160 * dt + 1) { m.x = fx; m.y = fy; m.looseState = 'break'; m.chargeT = 0; if (u.d > 0) m.dir = u.x >= 0 ? 1 : -1; }
    else { m.x += u.x * 160 * dt; m.y += u.y * 160 * dt; m.dir = u.x >= 0 ? 1 : -1; }
    m.mode = 'charge';
  } else if (m.looseState === 'break') {
    m.mode = 'charge';
    if (s.fences[m.fenceSide][m.fenceI]) m.chargeT = 1.5; else m.chargeT += dt;
    if (m.chargeT >= 1.5) {
      s.fences[m.fenceSide][m.fenceI] = true;
      m.looseState = 'run'; m.looseT = 0; m.attackT = 1.5; m.runDir = randSign();
    }
  } else {
    m.mode = 'loose';
    var sy = m.fenceSide === 'top' ? 95 : 622;
    m.looseT += dt;
    m.y += clamp(sy - m.y, -140 * dt, 140 * dt);
    m.x += m.runDir * 140 * dt;
    if (m.x < 100) { m.x = 100; m.runDir = 1; } if (m.x > 1180) { m.x = 1180; m.runDir = -1; }
    m.dir = m.runDir;
    m.attackT -= dt;
    if (m.attackT <= 0) {
      m.attackT += 1.5;
      var arr = s.visitors[m.fenceSide], bi = -1, bd = 1e9;
      for (var i = 0; i < 8; i++) {
        if (arr[i].mode !== 'watch') continue;
        var d = Math.abs(165 + 136 * i - m.x);
        if (d < bd) { bd = d; bi = i; }
      }
      if (bi >= 0) { arr[bi].mode = 'scared'; arr[bi].t = 0; S.rep = Math.max(0, S.rep - 3); showFloat(165 + 136 * bi, m.fenceSide === 'top' ? 95 : 622, '-3', 'repDown'); }
    }
    if (m.looseT >= 6) {
      m.loose = false; m.looseState = ''; m.x = 640; m.y = 356; m.rage = 30; m.marks = 0; m.markT = 0; m.slow = false;
      m.mode = 'roam'; m.sinceLast = 0; m.firstDelay = null; m.looseT = 0; m.chargeT = 0; m.move = 'walk';
    }
  }
}

function progMove(m, dt, prog, k) {
  var sp = 90 * k, o, u;
  if (prog === 'brawl') {
    o = nearestOther(m); if (!o) return;
    u = unitDir(o.x - m.x, o.y - m.y);
    if (u.d <= 60) return;
    m.x += u.x * sp * dt; m.y += u.y * sp * dt; m.dir = u.x >= 0 ? 1 : -1;
  } else if (prog === 'scatter') {
    o = nearestOther(m); if (!o) return;
    u = unitDir(m.x - o.x, m.y - o.y);
    var vx = u.x, vy = u.y;
    if ((m.x <= ARENA.x0 + 0.5 && vx < 0) || (m.x >= ARENA.x1 - 0.5 && vx > 0)) vx = 0;
    if ((m.y <= ARENA.y0 + 0.5 && vy < 0) || (m.y >= ARENA.y1 - 0.5 && vy > 0)) vy = 0;
    var l = Math.hypot(vx, vy);
    if (l > 0.001) { vx /= l; vy /= l; }
    m.x += vx * sp * dt; m.y += vy * sp * dt; if (vx) m.dir = vx >= 0 ? 1 : -1;
  } else if (prog === 'photo') {
    u = unitDir(640 - m.x, 356 - m.y);
    if (u.d <= 120) return;
    m.x += u.x * sp * dt; m.y += u.y * sp * dt; m.dir = u.x >= 0 ? 1 : -1;
  } else if (prog === 'parade') {
    var dx = m.x - 640, dy = m.y - 356, r = Math.hypot(dx, dy);
    if (r < 1) return;
    var a = Math.atan2(dy, dx) - 40 * PI / 180 * dt * k;
    var nx = 640 + Math.cos(a) * r, ny = 356 + Math.sin(a) * r;
    m.dir = nx - m.x >= 0 ? 1 : -1;
    m.x = nx; m.y = ny;
  }
  m.x = clamp(m.x, ARENA.x0, ARENA.x1); m.y = clamp(m.y, ARENA.y0, ARENA.y1);
}
function showInterval(m) {
  var v = m.rage < 50 ? 6 : 4 - (m.rage - 50) / 50 * 2.5;
  if (curProg() === 'allegro') v *= 0.5;
  return v;
}
function rageTick(m, dt) {
  var prog = curProg();
  if (m.loose) return;
  var dur = prog === 'rest' ? 2 : 4;
  if (m.marks > 0) {
    if (m.markT > dur) m.markT = dur;
    m.markT -= dt;
    if (m.markT <= 0) {
      m.marks--;
      if (m.marks > 0) m.markT = dur; else { m.markT = 0; m.slow = true; }
    }
    return;
  }
  var dec = SP[m.sp].decay;
  if (m.slow) { if (m.rage < redLow(m)) m.slow = false; else dec = 2; }
  m.rage -= dec * dt;
  if (prog === 'rest') m.rage -= 3 * dt;
  if (m.rage < 0) m.rage = 0;
  if (prog === 'cheer') {
    m.rage += 3 * dt;
    if (m.rage >= 100) { m.rage = 100; startMarks(m); }
  }
}
function fireRule(m, k, r) {
  var s = S.show;
  m.cd[r] = RULE[r].cd;
  s.ruleFx.push({ mon: m, rule: r, t: 0, dur: 0.8 });
  s.flash[k] = 0;
  if (r === 'calm') { m.marks = 0; m.markT = 0; m.rage = 70; m.slow = false; }
  else if (r === 'pep') { igniteMon(m, 20, 1, false); }
  else if (r === 'relay') { m.relayWait = 0.2; m.relayChain = m.evRelay + 1; }
  else if (r === 'double') { m.doubleT = 1; m.doubleChain = m.evDouble + 1; }
  else if (r === 'shelter') { m.shelterT = 3; }
}
function ruleStep(m) {
  for (var k = 0; k < 3; k++) {
    var r = S.slots[k];
    if (!r || m.cd[r] > 0 || m.loose) continue;
    var ok = false;
    if (r === 'calm') ok = m.marks >= 3;
    else if (r === 'pep') ok = m.rage < 50 && m.marks === 0;
    else if (r === 'relay') ok = m.evRelay !== null;
    else if (r === 'double') ok = m.evDouble !== null;
    else if (r === 'shelter') ok = m.marks >= 4;
    if (ok) fireRule(m, k, r);
  }
  m.evRelay = null; m.evDouble = null;
}

function advanceSegment() {
  var s = S.show;
  s.seg++; s.segT = 0;
  if (s.seg < 8) s.banner = { program: S.schedule[s.seg], t: 0, dur: 0.8 };
}

function updateShow(dt) {
  var s = S.show, env = showEnv(), prog, i;
  s.timeLeft -= dt; s.now += dt;
  s.zCool = Math.max(0, s.zCool - dt);
  if (s.seg < 8) { s.segT += dt; if (s.segT >= 8) advanceSegment(); }
  prog = curProg();
  var slowK = prog === 'adagio' ? 0.5 : 1;
  s.mons.forEach(function (m) {
    for (var c in m.cd) m.cd[c] = Math.max(0, m.cd[c] - dt);
    if (m.fxT >= 0 && m.fx !== 'none') { m.fxT += dt; if (m.fxT >= 0.5) { m.fx = 'none'; m.fxT = 0; } }
    if (m.performing) { m.performT += dt; if (m.performT >= 0.5) { m.performing = false; m.performT = 0.5; } }
    if (m.loose) { updateLoose(m, dt); return; }
    /* 表演計時 */
    m.sinceLast += dt;
    var due = m.firstDelay !== null ? m.sinceLast >= m.firstDelay : m.sinceLast >= showInterval(m);
    if (due) performMon(m, 1);
    if (m.echoT > 0) { m.echoT -= dt; if (m.echoT <= 0) performMon(m, m.echoChain); }
    if (m.doubleT > 0) { m.doubleT -= dt; if (m.doubleT <= 0) performMon(m, m.doubleChain); }
    if (m.relayWait > 0) {
      m.relayWait -= dt;
      if (m.relayWait <= 0) {
        var tg = nearestOther(m);
        if (tg) { m.dashT = 1; m.dashTarget = tg; }
      }
    }
    /* 移動 */
    m.mode = 'roam';
    if (m.knock) { applyKnock(m, dt, ARENA); m.mode = 'knock'; if (m.fade) { m.fade = null; m.move = 'walk'; } }
    else if (m.fade) stepFade(m, dt, env);
    else if (m.dashT > 0) {
      m.mode = 'dash';
      var tg2 = m.dashTarget, u = tg2 ? unitDir(tg2.x - m.x, tg2.y - m.y) : null;
      if (!tg2 || tg2.loose) m.dashT = 0;
      else {
        if (u.d <= 60) {
          if (validTarget(tg2, m)) igniteMon(tg2, 10, m.relayChain, true);
          m.dashT = 0;
        } else {
          m.x = clamp(m.x + u.x * 300 * slowK * dt, ARENA.x0, ARENA.x1); m.y = clamp(m.y + u.y * 300 * slowK * dt, ARENA.y0, ARENA.y1);
          m.dir = u.x >= 0 ? 1 : -1;
          m.dashT -= dt;
        }
      }
    } else if (m.shelterT > 0) {
      m.mode = 'shelter'; m.shelterT -= dt;
      var o = nearestOther(m);
      if (o) {
        var u2 = unitDir(m.x - o.x, m.y - o.y);
        m.x = clamp(m.x + u2.x * 150 * slowK * dt, ARENA.x0, ARENA.x1); m.y = clamp(m.y + u2.y * 150 * slowK * dt, ARENA.y0, ARENA.y1);
        m.dir = u2.x >= 0 ? 1 : -1;
      }
    } else if (prog === 'brawl' || prog === 'scatter' || prog === 'photo' || prog === 'parade') {
      m.mode = 'program'; m.move = 'walk'; m.moveT = 0; m.moveDur = 0;
      progMove(m, dt, prog, slowK);
    } else stepMover(m, dt, env, slowK);
  });
  updateShowHazards(dt);
  s.mons.forEach(function (m) { rageTick(m, dt); });
  s.mons.forEach(function (m) { ruleStep(m); });
  /* 觀眾 */
  ['top', 'bottom'].forEach(function (side) {
    s.visitors[side].forEach(function (v) {
      if (v.mode === 'watch') return;
      v.t += dt;
      if (v.t >= 4) { v.mode = 'watch'; v.t = 0; }
      else if (v.t >= 1.2) v.mode = 'empty';
    });
  });
  for (i = s.flash.length - 1; i >= 0; i--) s.flash[i] = Math.min(0.3, s.flash[i] + dt);
  [s.floats, s.ruleFx].forEach(function (arr) {
    for (var j = arr.length - 1; j >= 0; j--) { arr[j].t += dt; if (arr[j].t >= arr[j].dur) arr.splice(j, 1); }
  });
  if (s.banner) { s.banner.t += dt; if (s.banner.t >= s.banner.dur) s.banner = null; }
  if (s.timeLeft <= 0) finishShow();
}
function finishShow() {
  var s = S.show;
  s.mons.forEach(function (m) { if (m.loose) S.rep = Math.max(0, S.rep - 5); });
  checkUnlock();
  keyQ.length = 0;
  if (S.day >= 5) S.phase = 'result';
  else { S.phase = 'shop'; S.shop = { tab: 0, zone: 'tab', idx: 0 }; }
}

/* ================= 商店 ================= */
function shopList() { return SHOP_ITEMS[SHOP_TABS[S.shop.tab]]; }
function shopItemState(item) {
  var tab = SHOP_TABS[S.shop.tab], o = { item: item, cost: 0, level: 0, owned: false, equipped: false, affordable: false, effect: '', maxed: false, locked: false };
  if (tab === 'char') {
    if (WEAPON_ORDER.indexOf(item) >= 0) {
      o.owned = S.wOwned[item]; o.equipped = S.weapon === item;
      o.cost = o.owned || item === 'club' ? 0 : 60; o.affordable = S.gold >= 60;
    } else { o.level = S.lv[item]; o.cost = S.price[item]; o.affordable = S.gold >= o.cost; }
  } else if (tab === 'show') {
    if (PROG[item]) { o.owned = S.progOwn[item]; o.cost = o.owned ? 0 : PROG_PRICE[item]; }
    else { o.owned = S.ruleOwn[item]; o.cost = o.owned ? 0 : RULE_PRICE[item]; }
    o.affordable = S.gold >= o.cost;
  } else {
    o.effect = SP[item].effect; o.level = S.level[item]; o.locked = !S.ever[item]; o.maxed = S.level[item] >= 3;
    o.cost = (o.maxed || o.locked) ? 0 : UP_COST[o.level]; o.affordable = !o.maxed && !o.locked && S.gold >= o.cost;
  }
  return o;
}
function shopDetailLines(item) {
  var tab = SHOP_TABS[S.shop.tab];
  if (tab === 'char') return [WEAPON_DESC[item] || UPG_DESC[item]];
  if (tab === 'show') return [PROG[item] ? PROG[item].desc : RULE[item].desc];
  if (!S.ever[item]) return ['未收服'];
  return upgradeLines(item);
}
function shopBuy(item) {
  var tab = SHOP_TABS[S.shop.tab];
  if (tab === 'char') {
    if (WEAPON_ORDER.indexOf(item) >= 0) {
      if (S.wOwned[item]) S.weapon = item;
      else if (S.gold >= 60) { S.gold -= 60; S.wOwned[item] = true; S.weapon = item; }
    } else if (S.gold >= S.price[item]) {
      S.gold -= S.price[item]; S.lv[item]++; S.price[item] = Math.round(S.price[item] * 1.5);
    }
  } else if (tab === 'show') {
    if (PROG[item]) { if (!S.progOwn[item] && S.gold >= PROG_PRICE[item]) { S.gold -= PROG_PRICE[item]; S.progOwn[item] = true; } }
    else if (!S.ruleOwn[item] && S.gold >= RULE_PRICE[item]) { S.gold -= RULE_PRICE[item]; S.ruleOwn[item] = true; }
  } else tryUpgrade(item);
}

/* ================= 輸入處理 ================= */
function stagedCards() { return SPECIES.filter(function (sp) { return S.bank[sp] > 0; }); }

function onKey(k) {
  var p = S.phase;
  if (p === 'guide') keyGuide(k);
  else if (p === 'select') keySelect(k);
  else if (p === 'dungeon') { if (k === 'z') tryZ(); else if (k === 'x') tryX(); }
  else if (p === 'setup1') keySetup1(k);
  else if (p === 'setup2') keySetup2(k);
  else if (p === 'show') {
    if (k === 'z') {
      var s = S.show;
      if (s.seg < 8 && s.zCool <= 0) { s.zCool = 1; advanceSegment(); }
    }
  }
  else if (p === 'shop') keyShop(k);
  else if (p === 'result') { if (k === 'z') { newGame(); S.phase = 'select'; } }
}
function keyGuide(k) {
  if (k === 'z') {
    if (S.guidePage < GUIDE.length - 1) S.guidePage++;
    else S.phase = 'select';
  } else if (k === 'left') { if (S.guidePage > 0) S.guidePage--; }
  else if (k === 'x' && S.guideReopen) S.phase = 'select';
}
function keySelect(k) {
  if (k === 'left') S.selCur = Math.max(0, S.selCur - 1);
  else if (k === 'right') S.selCur = Math.min(2, S.selCur + 1);
  else if (k === 'up') { S.guidePage = 0; S.guideReopen = true; S.phase = 'guide'; }
  else if (k === 'z') {
    checkUnlock();
    if (S.unlocked[DUNGEONS[S.selCur]]) startDungeon(DUNGEONS[S.selCur]);
  }
}
function keySetup1(k) {
  var st = S.s1, cards = stagedCards();
  if (st.ci >= cards.length) st.ci = 0;
  var sp = cards[st.ci];
  if (st.cur === 'card') {
    if (k === 'left') st.ci = Math.max(0, st.ci - 1);
    else if (k === 'right') st.ci = Math.min(cards.length - 1, st.ci + 1);
    else if (k === 'z') { if (S.stage[sp] < S.bank[sp] && stageTotal() < 20) S.stage[sp]++; }
    else if (k === 'x') { if (S.stage[sp] > 0) S.stage[sp]--; }
    else if (k === 'down') st.cur = 'upgrade';
  } else if (st.cur === 'upgrade') {
    if (k === 'up') st.cur = 'card';
    else if (k === 'down') st.cur = 'next';
    else if (k === 'z') tryUpgrade(sp);
  } else {
    if (k === 'up') st.cur = 'upgrade';
    else if (k === 'z') { if (stageTotal() >= 1) { S.phase = 'setup2'; } }
  }
}
function pickerOptions(layer, slotIdx) {
  var opts = [], i;
  if (layer === 'program') {
    PROG_ORDER.forEach(function (key) { if (S.progOwn[key]) opts.push({ key: key, name: PROG[key].name, desc: PROG[key].desc, disabled: false }); });
    opts.push({ key: 'clear', name: '自由(清空)', desc: '', disabled: false });
  } else {
    RULE_ORDER.forEach(function (key) {
      if (!S.ruleOwn[key]) return;
      var dis = false;
      for (i = 0; i < 3; i++) if (i !== slotIdx && S.slots[i] === key) dis = true;
      opts.push({ key: key, name: RULE[key].name, desc: RULE[key].desc, disabled: dis });
    });
    opts.push({ key: 'clear', name: '拿下', desc: '', disabled: false });
  }
  return opts;
}
function keySetup2(k) {
  var st = S.s2, pk = st.picker;
  if (pk) {
    if (k === 'up') pk.index = Math.max(0, pk.index - 1);
    else if (k === 'down') pk.index = Math.min(pk.options.length - 1, pk.index + 1);
    else if (k === 'x') st.picker = null;
    else if (k === 'z') {
      var o = pk.options[pk.index];
      if (pk.layer === 'program') {
        S.schedule[pk.target] = o.key === 'clear' ? '' : o.key; st.picker = null;
      } else if (!o.disabled) {
        S.slots[pk.target] = o.key === 'clear' ? '' : o.key; st.picker = null;
      }
    }
    return;
  }
  if (st.cur === 'row') {
    if (k === 'up') st.i = Math.max(0, st.i - 1);
    else if (k === 'down') { if (st.i < 7) st.i++; else st.cur = 'start'; }
    else if (k === 'right') { st.rowMem = st.i; st.slot = st.i <= 2 ? 0 : (st.i <= 5 ? 1 : 2); st.cur = 'slot'; }
    else if (k === 'z') st.picker = { layer: 'program', options: pickerOptions('program'), index: 0, target: st.i };
    else if (k === 'x') S.schedule[st.i] = '';
  } else if (st.cur === 'slot') {
    if (k === 'up') st.slot = Math.max(0, st.slot - 1);
    else if (k === 'down') { if (st.slot < 2) st.slot++; else st.cur = 'start'; }
    else if (k === 'left') { st.i = st.rowMem; st.cur = 'row'; }
    else if (k === 'z') st.picker = { layer: 'rule', options: pickerOptions('rule', st.slot), index: 0, target: st.slot };
    else if (k === 'x') S.slots[st.slot] = '';
  } else {
    if (k === 'up') { st.cur = 'row'; st.i = 7; }
    else if (k === 'z') startShow();
    else if (k === 'x') S.phase = 'setup1';
  }
}
function keyShop(k) {
  var sp = S.shop, list = shopList(), n = list.length;
  if (sp.zone === 'tab') {
    if (k === 'left') sp.tab = Math.max(0, sp.tab - 1);
    else if (k === 'right') sp.tab = Math.min(2, sp.tab + 1);
    else if (k === 'down') { sp.zone = 'grid'; sp.idx = 0; }
  } else if (sp.zone === 'grid') {
    var r = Math.floor(sp.idx / 3), c = sp.idx % 3, rows = Math.ceil(n / 3);
    if (k === 'left') { if (c > 0) sp.idx--; }
    else if (k === 'right') { if (c < 2 && sp.idx + 1 < n) sp.idx++; }
    else if (k === 'up') { if (r === 0) sp.zone = 'tab'; else sp.idx -= 3; }
    else if (k === 'down') {
      if (r + 1 >= rows) sp.zone = 'go';
      else sp.idx = Math.min(sp.idx + 3, n - 1);
    }
    else if (k === 'z') shopBuy(list[sp.idx]);
  } else {
    if (k === 'up') { sp.zone = 'grid'; sp.idx = Math.floor((n - 1) / 3) * 3; }
    else if (k === 'z') { S.day++; S.phase = 'select'; }
  }
}

var KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyZ: 'z', KeyX: 'x' };
function keyName(e) {
  if (KEYMAP[e.code]) return e.code;
  if (e.key === 'z' || e.key === 'Z') return 'KeyZ';
  if (e.key === 'x' || e.key === 'X') return 'KeyX';
  if (KEYMAP[e.key]) return e.key;
  return null;
}
window.addEventListener('keydown', function (e) {
  var n = keyName(e);
  if (!n) return;
  e.preventDefault();
  if (e.repeat) return;
  keysHeld[n] = true;
  keyQ.push(KEYMAP[n]);
});
window.addEventListener('keyup', function (e) {
  var n = keyName(e);
  if (!n) return;
  e.preventDefault();
  keysHeld[n] = false;
});
window.addEventListener('blur', function () { keysHeld = {}; });

/* ================= 主更新 ================= */
function tick(dt) {
  while (keyQ.length) onKey(keyQ.shift());
  var p = S.phase;
  if (p === 'dungeon') updateDungeon(dt);
  else if (p === 'show') updateShow(dt);
  if (S.phase === 'select' || S.phase === 'dungeon') checkUnlock();
}

/* ================= 繪製 ================= */
function hudBase(phase, message) {
  return { phase: phase, day: S.day, dayMax: 5, gold: S.gold, rep: S.rep, hearts: 0, maxHearts: 0, ropes: 0, ropeMax: 0, weapon: S.weapon,
    xCdLeft: 0, xCdMax: 0, timeLeft: 0, timeMax: 0, dungeon: '', message: message || '' };
}
function drawGuideScreen() {
  var pg = GUIDE[S.guidePage], n = S.guidePage + 1;
  Art.drawBackground(ctx, {});
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, 150); ctx.fillRect(0, 640, W, 80);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 44px ' + FONT; ctx.fillText(pg.title, 640, 52);
  ctx.font = '28px ' + FONT; ctx.fillText(pg.text, 640, 112);
  ctx.font = '20px ' + FONT;
  ctx.textAlign = 'left'; ctx.fillText('第 ' + n + ' / ' + GUIDE.length + ' 頁', 40, 680);
  ctx.textAlign = 'center';
  var hint = n < GUIDE.length ? '按 Z 繼續' : '按 Z 開始遊戲';
  if (n > 1) hint += '    ← 上一頁';
  ctx.fillText(hint, 640, 680);
  ctx.restore();
  Art.drawGuidePage(ctx, { page: n, x: 140, y: 160, w: 1000, h: 470 });
}
function drawSelect() {
  Art.drawBackground(ctx, {});
  var xs = [240, 640, 1040];
  DUNGEONS.forEach(function (key, i) {
    var cond = '';
    if (!S.unlocked[key]) {
      if (key === 'mine') cond = '名聲 ' + Math.min(S.rep, 60) + '/60 + 收服霧雨雲 ' + Math.min(S.cap.cloud, 2) + '/2';
      else cond = '名聲 ' + Math.min(S.rep, 200) + '/200 + 收服磁石龜 ' + Math.min(S.cap.turtle, 2) + '/2';
    }
    Art.drawDungeonCard(ctx, { x: xs[i], y: 390, dungeon: key, open: !!S.unlocked[key], condition: cond, selected: S.selCur === i });
  });
  Art.drawHud(ctx, hudBase('select', '←→ 選擇 Z 進入'));
}
function drawDungeon() {
  var D = S.dun, c = dunCam(), t = D.tamer, i;
  function sx(x) { return x - c.x; }
  function sy(y) { return y - c.y + 100; }
  function vis(x, y, m) { var a = sx(x), b = sy(y); return a > -m && a < W + m && b > 100 - m && b < H + m; }
  Art.drawBackground(ctx, {});
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 100, W, 620); ctx.clip();
  var c0 = Math.floor(c.x / 60), c1 = Math.min(31, Math.floor((c.x + W) / 60)), r0 = Math.floor(c.y / 60), r1 = Math.min(15, Math.floor((c.y + 620) / 60)), cc, rr;
  for (rr = r0; rr <= r1; rr++) for (cc = c0; cc <= c1; cc++) {
    Art.drawTile(ctx, { x: sx(cc * 60 + 30), y: sy(rr * 60 + 30), dungeon: D.key, kind: D.kinds[rr][cc], nest: !!D.nestSet[rr * 32 + cc] });
  }
  if (D.fountain && vis(D.fountain.x, D.fountain.y, 60)) Art.drawFountain(ctx, { x: sx(D.fountain.x), y: sy(D.fountain.y), dungeon: D.key, full: D.fountain.full });
  function hz(h) {
    return { x: sx(h.x), y: sy(h.y), kind: h.kind, phase: h.phase, radius: h.radius, pullRadius: h.pullRadius, angle: h.angle, length: h.length, width: h.width,
      sx: h.kind === 'cracker' ? sx(h.sx) : 0, sy: h.kind === 'cracker' ? sy(h.sy) : 0, t: h.t, dur: h.dur, reflected: h.reflected };
  }
  D.hazards.forEach(function (h) { if (h.phase !== 'fly') Art.drawHazard(ctx, hz(h)); });
  if (D.ring) Art.drawCaptureRing(ctx, { x: sx(D.ring.mon.x), y: sy(D.ring.mon.y), t: D.ring.t, dur: D.ring.dur });
  D.kegs.forEach(function (k) {
    if (!vis(k.x, k.y, 60)) return;
    Art.drawKeg(ctx, { x: sx(k.x), y: sy(k.y), dungeon: D.key, mode: k.mode, fuseT: k.mode === 'fuse' ? k.fuseT : 0, fuseDur: 0.6 });
  });
  var casting = {};
  D.hazards.forEach(function (h) { if (h.phase === 'warn' && h.owner) h.owner._casting = true; });
  D.mons.forEach(function (m) {
    if (!vis(m.x, m.y, 100)) { m._casting = false; return; }
    Art.drawWildMonster(ctx, { x: sx(m.x), y: sy(m.y), species: m.sp, hp: m.hp, maxHp: m.maxHp, hit: m.hitT > 0, weak: isWeak(m),
      stunLeft: Math.max(0, m.stun), stunDur: 2, lassoed: m.lassoed, casting: !!m._casting, move: m.move, moveT: m.moveT, moveDur: m.moveDur, dir: m.dir });
    m._casting = false;
  });
  if (D.lasso) {
    var L = D.lasso;
    Art.drawLasso(ctx, { x1: sx(t.x), y1: sy(t.y), x2: sx(L.mon.x), y2: sy(L.mon.y), progress: Math.min(1, Math.abs(L.sum) / TAU), t: L.t, limit: L.limit,
      len: Math.hypot(t.x - L.mon.x, t.y - L.mon.y), maxLen: 220 });
  }
  Art.drawTamer(ctx, { x: sx(t.x), y: sy(t.y), facing: t.facing, weapon: S.weapon, dashing: t.dash > 0, blink: t.invuln > 0 && t.dash <= 0, lassoing: !!D.lasso });
  D.fxs.forEach(function (f) {
    Art.drawWeaponFx(ctx, { x: sx(f.x), y: sy(f.y), weapon: f.weapon, move: f.move, shape: f.shape, angle: f.angle, spread: f.spread, radius: f.radius, length: f.length, width: f.width, t: f.t, dur: f.dur });
  });
  D.hazards.forEach(function (h) { if (h.phase === 'fly') Art.drawHazard(ctx, hz(h)); });
  D.blasts.forEach(function (b) { Art.drawBlast(ctx, { x: sx(b.x), y: sy(b.y), radius: b.radius, t: b.t, dur: b.dur }); });
  D.floats.forEach(function (f) { Art.drawFloatText(ctx, { x: sx(f.x), y: sy(f.y), text: f.text, kind: f.kind, t: f.t, dur: f.dur }); });
  ctx.restore();
  var msg = D.lasso ? '繞牠一圈!' : (D.ring ? '站住別動' : 'Z 攻擊 X 武器技');
  var h = hudBase('dungeon', msg);
  h.hearts = D.hearts; h.maxHearts = maxHearts(); h.ropes = D.ropes; h.ropeMax = maxRopes();
  var xm = xCdMax(); h.xCdMax = xm; h.xCdLeft = xm > 0 ? Math.min(xm, D.cdX) : 0;
  h.timeLeft = Math.max(0, D.timeLeft); h.timeMax = 75; h.dungeon = D.key;
  Art.drawHud(ctx, h);
}
function drawSetup1() {
  var st = S.s1, cards = stagedCards();
  if (st.ci >= cards.length) st.ci = 0;
  Art.drawBackground(ctx, {});
  cards.forEach(function (sp, i) {
    Art.drawSpeciesCard(ctx, { x: 160 + 192 * i, y: 230, species: sp, level: S.level[sp], effect: SP[sp].effect, owned: S.bank[sp], onStage: S.stage[sp],
      selected: st.cur === 'card' && st.ci === i, style: 'setup' });
  });
  var sp = cards[st.ci];
  Art.drawSpeciesInfo(ctx, { x: 500, y: 490, species: sp, desc: EFFECT_TEXT[sp], total: stageTotal(), totalMax: 20, lines: upgradeLines(sp) });
  Art.drawButton(ctx, { x: 960, y: 410, w: 220, h: 70, label: '升級', selected: st.cur === 'upgrade' });
  Art.drawButton(ctx, { x: 960, y: 510, w: 220, h: 70, label: '下一步', selected: st.cur === 'next' });
  Art.drawHud(ctx, hudBase('setup1', st.cur === 'card' ? '←→ 選 Z 上場+1 X 上場−1 ↓ 升級/下一步' : 'Z 確定 ↑ 回卡片'));
}
function drawSetup2() {
  var st = S.s2, i;
  Art.drawBackground(ctx, {});
  for (i = 0; i < 8; i++) {
    Art.drawProgramRow(ctx, { x: 360, y: 92 + 62 * i, style: 'row', index: i, program: S.schedule[i], selected: st.cur === 'row' && st.i === i, active: false, t: 0, dur: 8, done: false });
  }
  for (i = 0; i < 3; i++) {
    Art.drawRuleSlot(ctx, { x: 1000, y: 150 + 110 * i, index: i, rule: S.slots[i], selected: st.cur === 'slot' && st.slot === i });
  }
  Art.drawButton(ctx, { x: 260, y: 590, w: 200, h: 70, label: '開演', selected: st.cur === 'start' });
  if (st.picker) Art.drawPickerPanel(ctx, { layer: st.picker.layer, options: st.picker.options, index: st.picker.index });
  var msg = st.picker ? '↑↓ 選 Z 確定 X 取消' : (st.cur === 'row' ? '↑↓ 選段 → 場規 Z 放入 X 清空' : (st.cur === 'slot' ? '↑↓ 選牌位 ← 回節目 Z 掛牌 X 拿下' : 'Z 開演 X 回上一步'));
  Art.drawHud(ctx, hudBase('setup2', msg));
}
function drawShow() {
  var s = S.show, i;
  Art.drawShowArena(ctx, {});
  s.hazards.forEach(function (h) { if (h.phase !== 'fly') Art.drawHazard(ctx, hzShow(h)); });
  s.mons.forEach(function (m) {
    Art.drawShowMonster(ctx, { x: m.x, y: m.y, species: m.sp, level: S.level[m.sp], rage: m.rage, redLow: redLow(m), marks: m.marks, markLeft: m.marks > 0 ? m.markT : 0,
      markDur: curProgForMark(), mode: m.mode, performing: m.performing, performT: m.performing ? m.performT : 0, performDur: 0.5,
      fx: m.fx, fxT: m.fx === 'none' ? 0 : m.fxT, fxDur: 0.5,
      chargeT: m.mode === 'charge' ? Math.min(1.5, m.chargeT) : 0, chargeDur: 1.5, looseT: m.mode === 'loose' ? m.looseT : 0, looseDur: 6,
      move: m.move, moveT: m.moveT, moveDur: m.moveDur, dir: m.dir });
  });
  s.hazards.forEach(function (h) { if (h.phase === 'fly') Art.drawHazard(ctx, hzShow(h)); });
  s.ruleFx.forEach(function (f) { Art.drawRuleFx(ctx, { x: f.mon.x, y: f.mon.y, rule: f.rule, t: f.t, dur: f.dur }); });
  if (s.banner) Art.drawBannerFx(ctx, { x: 640, y: 180, program: s.banner.program, t: s.banner.t, dur: s.banner.dur });
  ['top', 'bottom'].forEach(function (side) {
    for (i = 0; i < 8; i++) {
      var x = 165 + 136 * i;
      Art.drawFence(ctx, { x: x, y: side === 'top' ? 140 : 572, side: side, broken: s.fences[side][i] });
      Art.drawVisitor(ctx, { x: x, y: side === 'top' ? 95 : 622, side: side, mode: s.visitors[side][i].mode });
    }
  });
  for (i = 0; i < 8; i++) {
    Art.drawProgramRow(ctx, { x: 95 + 155 * i, y: 691, style: 'mini', index: i, program: S.schedule[i], selected: false, active: s.seg === i,
      t: s.seg === i ? Math.min(8, s.segT) : 0, dur: 8, done: i < s.seg });
  }
  s.floats.forEach(function (f) { Art.drawFloatText(ctx, { x: f.x, y: f.y, text: f.text, kind: f.kind, t: f.t, dur: f.dur }); });
  var msg = s.zCool > 0 ? '…' : (s.seg >= 8 ? '節目已演完' : 'Z 下一段');
  var h = hudBase('show', msg); h.timeLeft = Math.max(0, s.timeLeft); h.timeMax = 45;
  Art.drawHud(ctx, h);
  for (i = 0; i < 3; i++) Art.drawRuleBadge(ctx, { x: 1110 + 50 * i, y: 25, rule: S.slots[i], flashT: s.flash[i], flashDur: 0.3 });
}
function curProgForMark() { return curProg() === 'rest' ? 2 : 4; }
function hzShow(h) {
  return { x: h.x, y: h.y, kind: h.kind, phase: h.phase, radius: h.radius, pullRadius: h.pullRadius, angle: h.angle, length: h.length, width: h.width,
    sx: h.kind === 'cracker' ? h.sx : 0, sy: h.kind === 'cracker' ? h.sy : 0, t: h.t, dur: h.dur, reflected: h.reflected };
}
function drawShop() {
  var sp = S.shop, list = shopList(), i;
  Art.drawBackground(ctx, {});
  for (i = 0; i < 3; i++) {
    Art.drawShopTab(ctx, { x: 400 + 240 * i, y: 85, tab: SHOP_TABS[i], current: sp.tab === i, selected: sp.zone === 'tab' && sp.tab === i });
  }
  list.forEach(function (item, j) {
    var o = shopItemState(item);
    o.x = 220 + 420 * (j % 3); o.y = 190 + 115 * Math.floor(j / 3); o.selected = sp.zone === 'grid' && sp.idx === j;
    Art.drawShopItem(ctx, o);
  });
  Art.drawShopDetail(ctx, { x: 640, y: 570, lines: sp.zone === 'grid' ? shopDetailLines(list[sp.idx]) : [] });
  Art.drawButton(ctx, { x: 540, y: 625, w: 200, h: 70, label: '出發', selected: sp.zone === 'go' });
  Art.drawHud(ctx, hudBase('shop', '←→ 切分頁 方向鍵選擇 Z 購買'));
}
function drawResult() {
  var bank = [];
  SPECIES.forEach(function (sp) { if (S.ever[sp]) bank.push({ species: sp, count: S.bank[sp], level: S.level[sp] }); });
  var stars = S.rep >= 1000 ? 3 : (S.rep >= 650 ? 2 : (S.rep >= 300 ? 1 : 0));
  Art.drawBackground(ctx, {});
  Art.drawResultPanel(ctx, { rep: S.rep, goldEarned: S.goldEarned, bestChain: S.bestChain, bank: bank, stars: stars });
  Art.drawHud(ctx, hudBase('result', ''));
}
function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  var p = S.phase;
  if (p === 'guide') drawGuideScreen();
  else if (p === 'select') drawSelect();
  else if (p === 'dungeon') drawDungeon();
  else if (p === 'setup1') drawSetup1();
  else if (p === 'setup2') drawSetup2();
  else if (p === 'show') drawShow();
  else if (p === 'shop') drawShop();
  else if (p === 'result') drawResult();
}

/* ================= 主迴圈 ================= */
S.phase = 'guide'; S.guidePage = 0; S.guideReopen = false;
newGame();
S.phase = 'guide';
var last = null;
function frame(ts) {
  if (last === null) last = ts;
  var dt = Math.min((ts - last) / 1000, 1 / 30);
  last = ts;
  try { tick(dt); render(); } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
/*DEBUG_HOOK*/
})();
