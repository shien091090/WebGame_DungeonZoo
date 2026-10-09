(function () {
'use strict';

var W = Art.canvas.width, H = Art.canvas.height;
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');

/* ---------- 常數 ---------- */
var ORDER = ['fire', 'thunder', 'water', 'stone'];
var SP = {
  fire:    { hp: 10, atk: 2, rage: 3,   gold: 6 },
  thunder: { hp: 12, atk: 3, rage: 3.5, gold: 8 },
  water:   { hp: 8,  atk: 1, rage: 2,   gold: 4 },
  stone:   { hp: 16, atk: 2, rage: 1.5, gold: 5 }
};
var DAYS = 3, SHOW_TIME = 50, PERF_RAGE = 50, SELF_INT = 4, RELAY_DELAY = 0.4;
var CAGE_X = [130, 360, 590], CAGE_Y = [290, 570];
var MON_X = [140, 360, 580], MON_Y = 460;
var PLAYER = { x: 360, y: 860 };
var TRAY_Y = 1080;
var ITEMS = ['weapon', 'armor', 'netBag', 'goodNet'];
var BASE_COST = { weapon: 60, armor: 50, netBag: 40, goodNet: 80 };
var GUIDE = [
  ['目標', '經營三天, 衝高名聲'],
  ['地下城戰鬥', '點魔物攻擊'],
  ['捕獲', '按捕獲網, 再點魔物'],
  ['怒氣與表演', '怒氣夠高才會表演'],
  ['接力', '照接力圖相鄰, 會接著演'],
  ['安撫與失控', '點籠子安撫, 滿了會失控']
];
var GFRAME = { x: 60, y: 150, w: 600, h: 640 };

/* 佔位: 目前 interface.json 涵蓋全部物件, 無需佔位圖形 */
var Placeholder = {};

/* ---------- 按鈕 ---------- */
var BTN = {
  net:    { x: 40,  y: 1160, w: 300, h: 100 },
  back:   { x: 380, y: 1160, w: 300, h: 100 },
  open:   { x: 210, y: 1160, w: 300, h: 100 },
  depart: { x: 210, y: 1160, w: 300, h: 100 },
  help:   { x: 590, y: 124,  w: 110, h: 40 }
};

/* ---------- 狀態 ---------- */
var G;
function rnd(n) { return Math.floor(Math.random() * n); }
function inRect(px, py, b) { return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h; }

function newGame(phase) {
  G = {
    phase: phase, returnPhase: 'dungeon', guidePage: 0,
    day: 1, gold: 0, rep: 0, goldEarned: 0, bestChain: 0,
    hp: 40, maxHp: 40, atk: 4, nets: 4, netMax: 4, netBonus: 0,
    lv: { weapon: 0, armor: 0, netBag: 0, goodNet: 0 },
    cost: { weapon: 60, armor: 50, netBag: 40, goodNet: 80 },
    room: 1, monsters: [], netMode: false, pendingNet: null, netFx: [], clearTimer: -1, playerHit: 0,
    tray: [], selected: -1,
    cages: [], visitors: [], loose: [], events: [], chains: [], clock: 0,
    links: [], floats: [], banner: null, guideActive: null, guideActiveT: 0,
    message: '', result: null
  };
  var i;
  for (i = 0; i < 6; i++) {
    G.cages.push({ x: CAGE_X[i % 3], y: CAGE_Y[Math.floor(i / 3)], species: null, rage: 0, t: 0,
      broken: false, chainStep: 0, stepT: 0, calmFlash: 0 });
  }
  for (i = 0; i < 6; i++) {
    G.visitors.push({ x: [160, 360, 560][i % 3], y: i < 3 ? 860 : 955, scared: false, t: 0 });
  }
  if (phase === 'dungeon') startDay();
}

function startDay() {
  G.phase = 'dungeon';
  G.hp = G.maxHp; G.nets = G.netMax;
  G.room = 1; G.netMode = false; G.pendingNet = null; G.netFx = []; G.playerHit = 0;
  G.floats = [];
  genRoom();
  G.message = '點魔物攻擊';
}

function genRoom() {
  G.monsters = [];
  var n = G.day - 1;
  for (var i = 0; i < 3; i++) {
    var sp = ORDER[rnd(4)], b = SP[sp];
    var hp = Math.round(b.hp * (1 + 0.4 * n));
    G.monsters.push({ x: MON_X[i], y: MON_Y, species: sp, hp: hp, maxHp: hp, atk: b.atk + n, hit: 0, alive: true });
  }
  G.clearTimer = -1;
}

function addFloat(x, y, text, kind) { G.floats.push({ x: x, y: y, text: text, kind: kind, t: 0 }); }

/* ---------- 地下城 ---------- */
function monsterAt(px, py) {
  for (var i = 0; i < 3; i++) {
    var m = G.monsters[i];
    if (m.alive && Math.abs(px - m.x) <= 80 && Math.abs(py - m.y) <= 80) return m;
  }
  return null;
}

function counter(m) {
  if (!m.alive) return;
  G.hp -= m.atk;
  G.playerHit = 0.3;
  addFloat(PLAYER.x, PLAYER.y - 90, '-' + m.atk, 'repDown');
  if (G.hp <= 0) { G.hp = 0; retreat('體力耗盡, 撤退了'); }
}

function retreat(msg) {
  G.phase = 'place';
  G.netMode = false; G.pendingNet = null; G.netFx = [];
  G.selected = -1;
  G.message = '點魔物, 再點空籠子';
  G.floats = [];
}

function dungeonClick(px, py) {
  if (inRect(px, py, BTN.help)) { openGuide(); return; }
  if (G.pendingNet) return;
  if (inRect(px, py, BTN.back)) { retreat(); return; }
  if (inRect(px, py, BTN.net)) {
    if (G.nets > 0 || G.netMode) G.netMode = !G.netMode;
    G.message = G.netMode ? '點要丟網的魔物' : '點魔物攻擊';
    return;
  }
  if (G.clearTimer >= 0) return;
  var m = monsterAt(px, py);
  if (!m) return;
  if (G.netMode) {
    if (G.nets <= 0) { G.netMode = false; return; }
    G.nets--;
    var rate = 0.3 + 0.7 * (1 - m.hp / m.maxHp) + G.netBonus;
    if (rate > 0.95) rate = 0.95;
    G.pendingNet = { m: m, ok: Math.random() < rate, t: 0 };
    G.netFx.push({ x: m.x, y: m.y, t: 0, result: 'flying', ok: G.pendingNet.ok });
    G.netMode = false;
    G.message = '點魔物攻擊';
  } else {
    m.hp -= G.atk; m.hit = 0.25;
    if (m.hp <= 0) {
      m.alive = false; G.gold += 3; G.goldEarned += 3;
      addFloat(m.x, m.y - 60, '+3', 'gold');
    } else {
      counter(m);
    }
  }
}

function updateDungeon(dt) {
  var i;
  G.playerHit = Math.max(0, G.playerHit - dt);
  for (i = 0; i < 3; i++) G.monsters[i].hit = Math.max(0, G.monsters[i].hit - dt);
  for (i = G.netFx.length - 1; i >= 0; i--) {
    var f = G.netFx[i]; f.t += dt;
    f.result = f.t < 0.3 ? 'flying' : (f.ok ? 'success' : 'fail');
    if (f.t > 0.9) G.netFx.splice(i, 1);
  }
  if (G.pendingNet) {
    var p = G.pendingNet; p.t += dt;
    if (p.t >= 0.3) {
      G.pendingNet = null;
      if (p.ok) {
        p.m.alive = false; G.tray.push(p.m.species);
        addFloat(p.m.x, p.m.y - 60, '捕獲!', 'gold');
      } else {
        addFloat(p.m.x, p.m.y - 60, '失敗', 'repDown');
        counter(p.m);
      }
    }
  }
  if (G.phase !== 'dungeon') return;
  if (!G.pendingNet) {
    var any = false;
    for (i = 0; i < 3; i++) if (G.monsters[i].alive) any = true;
    if (!any && G.clearTimer < 0) G.clearTimer = 1;
  }
  if (G.clearTimer >= 0) {
    G.clearTimer -= dt;
    if (G.clearTimer <= 0) {
      G.clearTimer = -1;
      if (G.room === 1) { G.room = 2; genRoom(); }
      else retreat();
    }
  }
}

/* ---------- 擺放 ---------- */
function trayPos(i, n) {
  var sp = Math.min(110, 680 / Math.max(1, n));
  return { x: 360 + (i - (n - 1) / 2) * sp, y: TRAY_Y };
}

function cageAt(px, py) {
  for (var i = 0; i < 6; i++) {
    var c = G.cages[i];
    if (Math.abs(px - c.x) <= 110 && Math.abs(py - c.y) <= 120) return i;
  }
  return -1;
}

function placeClick(px, py) {
  if (inRect(px, py, BTN.help)) { openGuide(); return; }
  if (inRect(px, py, BTN.open)) { startShow(); return; }
  var n = G.tray.length, i;
  var best = -1, bd = 1e9;
  for (i = 0; i < n; i++) {
    var tp = trayPos(i, n);
    var dx = px - tp.x, dy = py - tp.y;
    if (Math.abs(dx) <= 55 && Math.abs(dy) <= 55 && Math.abs(dx) < bd) { bd = Math.abs(dx); best = i; }
  }
  if (best >= 0) { G.selected = (G.selected === best) ? -1 : best; return; }
  var ci = cageAt(px, py);
  if (ci >= 0) {
    var c = G.cages[ci];
    if (c.species === null) {
      if (G.selected >= 0 && G.selected < G.tray.length) {
        c.species = G.tray[G.selected];
        G.tray.splice(G.selected, 1);
        G.selected = -1;
      }
    } else {
      G.tray.push(c.species); c.species = null; G.selected = -1;
    }
  }
}

/* ---------- 開園 ---------- */
function startShow() {
  G.phase = 'show'; G.clock = 0; G.selected = -1;
  G.events = []; G.chains = []; G.loose = []; G.links = []; G.floats = []; G.banner = null;
  G.guideActive = null; G.guideActiveT = 0;
  for (var i = 0; i < 6; i++) {
    var c = G.cages[i];
    c.broken = false; c.chainStep = 0; c.stepT = 0; c.calmFlash = 0; c.t = 0;
    c.rage = c.species ? 30 : 0;
  }
  for (i = 0; i < 6; i++) { G.visitors[i].scared = false; G.visitors[i].t = 0; }
  G.message = '點籠子安撫怒氣';
}

function neighbors(i) {
  var col = i % 3, row = Math.floor(i / 3), r = [];
  if (col > 0) r.push(i - 1);
  if (col < 2) r.push(i + 1);
  if (row > 0) r.push(i - 3);
  if (row < 1) r.push(i + 3);
  return r;
}
function nextSpecies(s) { return ORDER[(ORDER.indexOf(s) + 1) % 4]; }

function addRep(d) { G.rep = Math.max(0, G.rep + d); }

function startChain(idx) {
  var ch = { count: 0, scheduled: {}, pending: 1, done: false };
  ch.scheduled[idx] = true;
  G.chains.push(ch);
  perform(idx, ch);
}

function perform(idx, ch) {
  var c = G.cages[idx];
  if (c.species === null || c.broken) { ch.pending--; chainCheck(ch); return; }
  var k = ++ch.count;
  var gold = Math.round(SP[c.species].gold * k * (1 + G.rep / 100));
  G.gold += gold; G.goldEarned += gold;
  addRep(k);
  addFloat(c.x - 30, c.y - 100, '+' + gold, 'gold');
  addFloat(c.x + 40, c.y - 70, '+' + k, 'repUp');
  c.chainStep = k; c.stepT = 0; c.t = 0;
  if (k > G.bestChain) G.bestChain = k;
  G.guideActive = c.species; G.guideActiveT = 1.0;
  if (k >= 2) {
    c.rage += 15;
    addFloat(c.x + 40, c.y - 30, '+15', 'rage');
  }
  var nx = nextSpecies(c.species), nb = neighbors(idx);
  if (c.rage >= PERF_RAGE) {
    for (var j = 0; j < nb.length; j++) {
      var o = G.cages[nb[j]];
      if (o.species === nx && !o.broken && o.rage >= PERF_RAGE && !ch.scheduled[nb[j]]) {
        ch.scheduled[nb[j]] = true; ch.pending++;
        G.events.push({ time: G.clock + RELAY_DELAY, idx: nb[j], ch: ch });
        G.links.push({ x1: c.x, y1: c.y, x2: o.x, y2: o.y, step: k + 1, t: 0 });
      }
    }
  }
  checkRunaway(idx);
  ch.pending--;
  chainCheck(ch);
}

function chainCheck(ch) {
  if (ch.pending > 0 || ch.done) return;
  ch.done = true;
  if (ch.count >= 3) {
    addRep(5);
    G.banner = { n: ch.count, t: 0 };
  }
}

function checkRunaway(idx) {
  var c = G.cages[idx];
  if (c.species === null || c.broken || c.rage < 100) return;
  c.broken = true; c.chainStep = 0;
  G.loose.push({ cage: idx, species: c.species, x: c.x, y: c.y, hits: 3, hit: 0, cd: 0 });
  c.species = null;      /* 魔物離開籠子; 回籠時由 loose 還原 */
  c.escaped = true;
}

function nearestVisitor(m) {
  var best = null, bd = 1e12;
  for (var i = 0; i < 6; i++) {
    var v = G.visitors[i];
    if (v.scared) continue;
    var d = (v.x - m.x) * (v.x - m.x) + (v.y - m.y) * (v.y - m.y);
    if (d < bd) { bd = d; best = v; }
  }
  return best;
}

function returnLoose(m) {
  var c = G.cages[m.cage];
  c.species = m.species; c.broken = false; c.escaped = false; c.rage = 20; c.t = 0;
}

function updateShow(dt) {
  var i, c;
  G.clock += dt;
  /* 怒氣與自發計時 */
  for (i = 0; i < 6; i++) {
    c = G.cages[i];
    c.calmFlash = Math.max(0, c.calmFlash - dt);
    if (c.chainStep > 0) { c.stepT += dt; if (c.stepT > 0.8) c.chainStep = 0; }
    if (c.species === null || c.broken) continue;
    c.rage += SP[c.species].rage * dt;
    if (c.rage >= PERF_RAGE) c.t += dt; else c.t = 0;
  }
  for (i = 0; i < 6; i++) checkRunaway(i);
  /* 接力事件 */
  var guard = 0;
  for (;;) {
    var bi = -1;
    for (i = 0; i < G.events.length; i++) {
      if (G.events[i].time <= G.clock && (bi < 0 || G.events[i].time < G.events[bi].time)) bi = i;
    }
    if (bi < 0 || guard++ > 200) break;
    var ev = G.events.splice(bi, 1)[0];
    perform(ev.idx, ev.ch);
  }
  /* 自發表演 */
  for (i = 0; i < 6; i++) {
    c = G.cages[i];
    if (c.species !== null && !c.broken && c.rage >= PERF_RAGE && c.t >= SELF_INT) {
      c.t = 0;
      startChain(i);
    }
  }
  /* 逃脫魔物 */
  for (i = 0; i < G.loose.length; i++) {
    var m = G.loose[i];
    m.hit = Math.max(0, m.hit - dt);
    var v = nearestVisitor(m);
    if (!v) continue;
    var dx = v.x - m.x, dy = v.y - m.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d > 50) {
      var s = Math.min(120 * dt, d - 50);
      m.x += dx / d * s; m.y += dy / d * s;
    }
    m.cd = Math.max(0, m.cd - dt);
    if (d <= 52 && m.cd <= 0) {
      m.cd = 2;
      addRep(-3);
      addFloat(v.x, v.y - 70, '-3', 'repDown');
      v.scared = true; v.t = 0;
    }
  }
  /* 遊客補回 */
  for (i = 0; i < 6; i++) {
    var vi = G.visitors[i];
    if (vi.scared) { vi.t += dt; if (vi.t >= 3) { vi.scared = false; vi.t = 0; } }
  }
  /* 演出計時 */
  var k;
  for (k = G.links.length - 1; k >= 0; k--) { G.links[k].t += dt; if (G.links[k].t > 0.5) G.links.splice(k, 1); }
  G.guideActiveT -= dt; if (G.guideActiveT <= 0) G.guideActive = null;
  if (G.banner) { G.banner.t += dt; if (G.banner.t > 1.6) G.banner = null; }
  G.message = G.loose.length > 0 ? '點牠 3 下抓回' : '點籠子安撫怒氣';
  if (G.clock >= SHOW_TIME) endShow();
}

function showClick(px, py) {
  var i;
  for (i = G.loose.length - 1; i >= 0; i--) {
    var m = G.loose[i];
    if (Math.abs(px - m.x) <= 60 && Math.abs(py - m.y) <= 60) {
      m.hits--; m.hit = 0.2;
      if (m.hits <= 0) { returnLoose(m); G.loose.splice(i, 1); }
      return;
    }
  }
  var ci = cageAt(px, py);
  if (ci >= 0) {
    var c = G.cages[ci];
    if (c.species !== null && !c.broken) {
      c.rage = Math.max(0, c.rage - 30);
      c.calmFlash = 0.3;
      addFloat(c.x, c.y - 50, '-30', 'rage');
    }
  }
}

function endShow() {
  for (var i = 0; i < G.loose.length; i++) {
    returnLoose(G.loose[i]);
    addRep(-5);
  }
  G.loose = []; G.events = [];
  for (i = 0; i < 6; i++) { G.cages[i].broken = false; G.cages[i].chainStep = 0; }
  for (i = 0; i < G.chains.length; i++) chainCheck(G.chains[i]);  /* 未完成的連鎖結算 */
  G.chains = []; G.links = []; G.banner = null; G.floats = [];
  if (G.day >= DAYS) {
    G.phase = 'result';
    var r = G.rep;
    G.result = { rep: r, goldEarned: G.goldEarned, bestChain: G.bestChain, stars: r >= 200 ? 3 : r >= 120 ? 2 : r >= 60 ? 1 : 0 };
  } else {
    G.phase = 'shop';
    G.message = '選擇強化';
  }
}

/* ---------- 商店 ---------- */
function shopPos(i) { return { x: 360, y: 250 + i * 165 }; }

function shopClick(px, py) {
  if (inRect(px, py, BTN.help)) { openGuide(); return; }
  if (inRect(px, py, BTN.depart)) { G.day++; startDay(); return; }
  for (var i = 0; i < 4; i++) {
    var p = shopPos(i), it = ITEMS[i];
    if (Math.abs(px - p.x) <= 300 && Math.abs(py - p.y) <= 70) {
      if (G.gold >= G.cost[it]) {
        G.gold -= G.cost[it];
        G.lv[it]++;
        G.cost[it] = Math.round(G.cost[it] * 1.5);
        if (it === 'weapon') G.atk += 2;
        else if (it === 'armor') G.maxHp += 15;
        else if (it === 'netBag') G.netMax += 1;
        else G.netBonus += 0.1;
      }
      return;
    }
  }
}

/* ---------- 說明頁 ---------- */
function openGuide() {
  G.returnPhase = G.phase; G.phase = 'guide'; G.guidePage = 0;
}
function guideClick(px) {
  if (px < W * 0.25) {
    if (G.guidePage > 0) G.guidePage--;
    return;
  }
  if (G.guidePage < GUIDE.length - 1) { G.guidePage++; return; }
  if (G.started) { G.phase = G.returnPhase; }
  else { G.started = true; G.phase = 'dungeon'; startDay(); }
}

/* ---------- 輸入(只有滑鼠) ---------- */
canvas.addEventListener('mousedown', function (e) {
  e.preventDefault();
  var r = canvas.getBoundingClientRect();
  var px = (e.clientX - r.left) * W / r.width, py = (e.clientY - r.top) * H / r.height;
  switch (G.phase) {
    case 'guide': guideClick(px); break;
    case 'dungeon': dungeonClick(px, py); break;
    case 'place': placeClick(px, py); break;
    case 'show': showClick(px, py); break;
    case 'shop': shopClick(px, py); break;
    case 'result': { var st = G.started; newGame('dungeon'); G.started = st; break; }
  }
});

/* ---------- 繪製 ---------- */
function text(s, x, y, size, color, align) {
  ctx.font = 'bold ' + size + 'px sans-serif';
  ctx.fillStyle = color || '#fff';
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function drawHud() {
  Art.drawHud(ctx, { phase: G.phase, day: G.day, gold: G.gold, rep: G.rep, hp: G.hp, maxHp: G.maxHp,
    nets: G.nets, netMax: G.netMax, timeLeft: Math.max(0, SHOW_TIME - G.clock), room: G.room, message: G.message });
}
function drawBtn(b, label, enabled, active) {
  Art.drawButton(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, label: label, enabled: enabled, active: !!active });
}
function drawFloats() {
  for (var i = 0; i < G.floats.length; i++) {
    var f = G.floats[i];
    Art.drawFloatText(ctx, { x: f.x, y: f.y, text: f.text, kind: f.kind, t: f.t });
  }
}

function drawGuide() {
  Art.drawBackground(ctx, {});
  var p = G.guidePage, g = GUIDE[p];
  text(g[0], W / 2, 80, 56, '#ffe9a8');
  Art.drawGuidePage(ctx, { page: p + 1, x: GFRAME.x, y: GFRAME.y, w: GFRAME.w, h: GFRAME.h });
  text(g[1], W / 2, 880, 44, '#ffffff');
  text((p + 1) + ' / ' + GUIDE.length, W / 2, 1010, 32, '#ddd');
  text(p === GUIDE.length - 1 ? '點畫面開始遊戲' : '點畫面繼續', W / 2, 1180, 30, '#ccc');
  if (p > 0) text('點畫面左側回上一頁', W / 2, 1225, 24, '#999');
}

function render() {
  var i;
  ctx.clearRect(0, 0, W, H);
  if (G.phase === 'guide') { drawGuide(); return; }
  Art.drawBackground(ctx, {});
  if (G.phase === 'dungeon') {
    Art.drawDungeonRoom(ctx, { day: G.day, room: G.room });
    for (i = 0; i < 3; i++) {
      var m = G.monsters[i];
      if (m.alive) Art.drawMonster(ctx, { x: m.x, y: m.y, species: m.species, hp: m.hp, maxHp: m.maxHp, hit: m.hit, aimNet: G.netMode });
    }
    Art.drawPlayer(ctx, { x: PLAYER.x, y: PLAYER.y, hp: G.hp, maxHp: G.maxHp, hit: G.playerHit });
    for (i = 0; i < G.netFx.length; i++) {
      var n = G.netFx[i];
      Art.drawNet(ctx, { x: n.x, y: n.y, t: n.t, result: n.result });
    }
    drawFloats();
    drawBtn(BTN.net, '捕獲網 ×' + G.nets, G.nets > 0 && !G.pendingNet, G.netMode);
    drawBtn(BTN.back, '回動物園', !G.pendingNet, false);
    drawBtn(BTN.help, '說明', true, false);
    drawHud();
  } else if (G.phase === 'place' || G.phase === 'show') {
    var show = G.phase === 'show';
    Art.drawZooGround(ctx, {});
    for (i = 0; i < 6; i++) {
      var c = G.cages[i];
      Art.drawCage(ctx, { x: c.x, y: c.y, species: c.species, rage: show ? c.rage : 0,
        canShow: show && c.species !== null && !c.broken && c.rage >= PERF_RAGE,
        chainStep: c.chainStep, calmFlash: c.calmFlash, broken: c.broken,
        selected: !show && G.selected >= 0 && c.species === null });
      if (c.chainStep > 0) Art.drawShowEffect(ctx, { x: c.x, y: c.y, species: c.species, chainStep: c.chainStep, t: c.stepT });
    }
    for (i = 0; i < G.links.length; i++) {
      var l = G.links[i];
      Art.drawChainLink(ctx, { x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2, chainStep: l.step, t: l.t });
    }
    Art.drawChainGuide(ctx, { x: 360, y: 755, activeSpecies: G.guideActive });
    for (i = 0; i < 6; i++) {
      var v = G.visitors[i];
      if (!v.scared || v.t < 0.5) Art.drawVisitor(ctx, { x: v.x, y: v.y, scared: v.scared });
    }
    for (i = 0; i < G.loose.length; i++) {
      var lm = G.loose[i];
      Art.drawLooseMonster(ctx, { x: lm.x, y: lm.y, species: lm.species, hitsLeft: lm.hits, hit: lm.hit });
    }
    if (!show) {
      for (i = 0; i < G.tray.length; i++) {
        var tp = trayPos(i, G.tray.length);
        Art.drawTrayMonster(ctx, { x: tp.x, y: tp.y, species: G.tray[i], selected: i === G.selected });
      }
      drawBtn(BTN.open, '開園', true, false);
      drawBtn(BTN.help, '說明', true, false);
    }
    drawFloats();
    if (G.banner) Art.drawBigShowBanner(ctx, { chainCount: G.banner.n, t: G.banner.t });
    G.message = show ? G.message : '點魔物, 再點空籠子';
    drawHud();
  } else if (G.phase === 'shop') {
    for (i = 0; i < 4; i++) {
      var p = shopPos(i), it = ITEMS[i];
      Art.drawShopItem(ctx, { x: p.x, y: p.y, item: it, level: G.lv[it], cost: G.cost[it], affordable: G.gold >= G.cost[it] });
    }
    drawBtn(BTN.depart, '出發', true, false);
    drawBtn(BTN.help, '說明', true, false);
    drawHud();
  } else if (G.phase === 'result') {
    Art.drawResultPanel(ctx, G.result);
    text('點畫面重來', W / 2, 1180, 36, '#fff');
  }
}

/* ---------- 主迴圈 ---------- */
function update(dt) {
  var i;
  for (i = G.floats.length - 1; i >= 0; i--) { G.floats[i].t += dt; if (G.floats[i].t > 1.2) G.floats.splice(i, 1); }
  if (G.phase === 'dungeon') updateDungeon(dt);
  else if (G.phase === 'show') updateShow(dt);
}

function resize() {
  var dpr = window.devicePixelRatio || 1;
  var s = Math.min(window.innerWidth / W, window.innerHeight / H);
  if (!(s > 0)) s = 1;
  canvas.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
  canvas.width = Math.round(W * s * dpr);
  canvas.height = Math.round(H * s * dpr);
  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
}
window.addEventListener('resize', resize);
resize();

var last = 0;
function frame(ts) {
  var dt = last ? (ts - last) / 1000 : 0;
  last = ts;
  if (dt > 1 / 30) dt = 1 / 30;
  try { update(dt); render(); } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}

newGame('guide');
G.started = false;
requestAnimationFrame(frame);

})();
