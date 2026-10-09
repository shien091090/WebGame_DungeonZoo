(function () {
'use strict';

// ===== 常數 =====
var W = (typeof Art !== 'undefined' && Art.canvas) ? Art.canvas.width : 720;
var H = (typeof Art !== 'undefined' && Art.canvas) ? Art.canvas.height : 1280;

var SPECIES = {
  fire:    { hp: 10, atk: 2, rage: 4,   gold: 6, name: '火蜥蜴' },
  water:   { hp: 8,  atk: 1, rage: 3,   gold: 4, name: '水母' },
  thunder: { hp: 12, atk: 3, rage: 5,   gold: 8, name: '雷鳥' },
  stone:   { hp: 16, atk: 2, rage: 2.5, gold: 5, name: '石像鬼' }
};
var SPECIES_LIST = ['fire', 'water', 'thunder', 'stone'];
var DAYS = 3, ROOMS = 2, PER_ROOM = 3;
var PLAYER_HP = 40, PLAYER_ATK = 4, NET_MAX = 3;
var KILL_GOLD = 3, CAPTURE_BASE = 0.3, CAPTURE_CAP = 0.95;
var SHOW_TIME = 45, START_RAGE = 30;
var CALM = 15, TAP_RAGE = 20, TAP_WARN = 1.5;
var LOOSE_SPEED = 120, LOOSE_ATK_INT = 2, CATCH_HITS = 3, CATCH_RAGE = 20;
var VISITOR_RESPAWN = 3;
var MON_X = [140, 360, 580], MON_Y = 460;
var PLAYER_POS = { x: 360, y: 860 };
var CAGE_POS = [[190, 300], [530, 300], [190, 640], [530, 640]];
var CAGE_W = 300, CAGE_H = 280;
var VIS_POS = [[140, 845], [360, 845], [580, 845], [140, 950], [360, 950], [580, 950]];
var TRAY_Y = 1080;
var SHOP_ITEMS = [
  { id: 'weapon', cost: 60, y: 250 },
  { id: 'armor',  cost: 50, y: 420 },
  { id: 'netBag', cost: 40, y: 590 },
  { id: 'goodNet', cost: 80, y: 760 }
];
var BTN = {
  net:   { x: 40,  y: 1160, w: 300, h: 100 },
  home:  { x: 380, y: 1160, w: 300, h: 100 },
  open:  { x: 210, y: 1160, w: 300, h: 100 },
  go:    { x: 210, y: 1160, w: 300, h: 100 },
  help:  { x: 620, y: 124,  w: 90,  h: 34 },
  prev:  { x: 40,  y: 1160, w: 200, h: 80 }
};
var GUIDE_FRAME = { x: 40, y: 240, w: 640, h: 760 };
var GUIDE_TITLES = ['目標', '地下城戰鬥', '捕獲', '怒氣與表演', '安撫與失控'];
var GUIDE_TEXTS = [
  '經營三天, 衝高名聲',
  '點魔物攻擊',
  '按捕獲網, 再點魔物',
  '怒氣越高, 表演越賺',
  '點籠子安撫, 滿了會失控'
];

// 美術沒有的圖形: 集中在這裡(目前只有說明文字與提示字)
var Placeholder = {
  text: function (ctx, s, x, y, size, align, color) {
    ctx.save();
    ctx.font = 'bold ' + size + 'px sans-serif';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(3, size / 7);
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.lineJoin = 'round';
    ctx.strokeText(s, x, y);
    ctx.fillStyle = color || '#fff';
    ctx.fillText(s, x, y);
    ctx.restore();
  }
};

// ===== 狀態 =====
var G = null;

function newCage() {
  return { mon: null, rage: 0, streak: 0, perf: 0, warn: 0, calm: 0, broken: false };
}

function resetGame() {
  G = {
    phase: 'dungeon', day: 1, room: 1,
    gold: 0, totalGold: 0, rep: 0,
    hp: PLAYER_HP, maxHp: PLAYER_HP, atk: PLAYER_ATK,
    nets: NET_MAX, netMax: NET_MAX, netBonus: 0,
    mode: 'attack', monsters: [], netAnim: null, clearTimer: 0, playerHit: 0,
    tray: [], cages: [newCage(), newCage(), newCage(), newCage()], selTray: -1,
    shopLevel: { weapon: 0, armor: 0, netBag: 0, goodNet: 0 },
    shopCost: { weapon: 60, armor: 50, netBag: 40, goodNet: 80 },
    floats: [], effects: [], loose: [], visitors: [],
    show: null,
    guide: { page: 0, first: true, ret: null },
    stars: 0
  };
  for (var i = 0; i < VIS_POS.length; i++) {
    G.visitors.push({ x: VIS_POS[i][0], y: VIS_POS[i][1], scared: false, t: 0 });
  }
  startDay();
}

function startDay() {
  G.phase = 'dungeon';
  G.room = 1;
  G.hp = G.maxHp;
  G.nets = G.netMax;
  G.mode = 'attack';
  G.netAnim = null;
  G.clearTimer = 0;
  G.floats = [];
  spawnRoom();
}

function spawnRoom() {
  var n = G.day - 1;
  G.monsters = [];
  for (var i = 0; i < PER_ROOM; i++) {
    var sp = SPECIES_LIST[Math.floor(Math.random() * 4)];
    var hp = Math.round(SPECIES[sp].hp * (1 + 0.4 * n));
    G.monsters.push({ species: sp, hp: hp, maxHp: hp, atk: SPECIES[sp].atk + n, x: MON_X[i], y: MON_Y, hit: 0, ceil: 0 });
  }
  G.clearTimer = 0;
}

function toPlace() {
  G.phase = 'place';
  G.mode = 'attack';
  G.netAnim = null;
  G.monsters = [];
  G.clearTimer = 0;
  G.selTray = -1;
  G.floats = [];
}

function startShow() {
  G.phase = 'show';
  G.selTray = -1;
  G.floats = [];
  G.effects = [];
  G.loose = [];
  for (var i = 0; i < 4; i++) {
    var c = G.cages[i];
    c.rage = START_RAGE; c.streak = 0; c.perf = 0; c.warn = 0; c.calm = 0; c.broken = false;
  }
  for (var v = 0; v < G.visitors.length; v++) { G.visitors[v].scared = false; G.visitors[v].t = 0; }
  G.show = { t: 0, tapT: rand(6, 10), tap: null };
}

function rand(a, b) { return a + Math.random() * (b - a); }

function addFloat(x, y, text, kind) {
  G.floats.push({ x: x, y: y, text: text, kind: kind, t: 0 });
}

function addRep(n, x, y) {
  var before = G.rep;
  G.rep = Math.max(0, G.rep + n);
  var d = G.rep - before;
  if (d > 0) addFloat(x, y, '名聲+' + d, 'repUp');
  else if (d < 0) addFloat(x, y, '名聲' + d, 'repDown');
}

function addGold(n) {
  G.gold += n;
  G.totalGold += n;
}

// ===== 更新 =====
function update(dt) {
  if (G.guide.open) return;
  var i;
  for (i = G.floats.length - 1; i >= 0; i--) {
    G.floats[i].t += dt;
    if (G.floats[i].t > 1.1) G.floats.splice(i, 1);
  }
  for (i = G.effects.length - 1; i >= 0; i--) {
    G.effects[i].t += dt;
    if (G.effects[i].t > 0.8) G.effects.splice(i, 1);
  }
  if (G.phase === 'dungeon') updateDungeon(dt);
  else if (G.phase === 'show') updateShow(dt);
}

function updateDungeon(dt) {
  var i;
  G.playerHit = Math.max(0, G.playerHit - dt);
  for (i = 0; i < G.monsters.length; i++) G.monsters[i].hit = Math.max(0, G.monsters[i].hit - dt);
  var a = G.netAnim;
  if (a) {
    a.t += dt;
    if (!a.resolved && a.t >= 0.4) {
      a.resolved = true;
      var idx = G.monsters.indexOf(a.m);
      if (a.success) {
        a.result = 'success';
        if (idx >= 0) G.monsters.splice(idx, 1);
        G.tray.push({ species: a.m.species });
      } else {
        a.result = 'fail';
        if (idx >= 0) counter(a.m);
      }
      if (G.phase !== 'dungeon') return;
      if (G.monsters.length === 0) G.clearTimer = 1;
    }
    if (a.t >= 0.9) G.netAnim = null;
  }
  if (G.clearTimer > 0) {
    G.clearTimer -= dt;
    if (G.clearTimer <= 0) {
      G.clearTimer = 0;
      if (G.room < ROOMS) { G.room++; spawnRoom(); }
      else toPlace();
    }
  }
}

function counter(m) {
  G.hp -= m.atk;
  G.playerHit = 0.3;
  if (G.hp <= 0) { G.hp = 0; toPlace(); }
}

function cageHasMon(c) { return !!c.mon && !c.broken; }

function updateShow(dt) {
  var S = G.show, i, c;
  S.t += dt;
  // 遊客復原
  for (i = 0; i < G.visitors.length; i++) {
    var v = G.visitors[i];
    if (v.scared) { v.t -= dt; if (v.t <= 0) { v.scared = false; v.t = 0; } }
  }
  // 拍玻璃
  if (S.tap) {
    S.tap.left -= dt;
    var tc = G.cages[S.tap.cage];
    if (!cageHasMon(tc)) { tc.warn = 0; S.tap = null; S.tapT = rand(6, 10); }
    else if (S.tap.left <= 0) {
      tc.warn = 0;
      tc.rage += TAP_RAGE;
      addFloat(CAGE_POS[S.tap.cage][0], CAGE_POS[S.tap.cage][1] - 40, '怒氣+' + TAP_RAGE, 'rage');
      S.tap = null;
      S.tapT = rand(6, 10);
    } else tc.warn = S.tap.left;
  } else {
    S.tapT -= dt;
    if (S.tapT <= 0) {
      var opts = [];
      for (i = 0; i < 4; i++) if (cageHasMon(G.cages[i])) opts.push(i);
      if (opts.length === 0) S.tapT = 1;
      else {
        var ci = opts[Math.floor(Math.random() * opts.length)];
        S.tap = { cage: ci, left: TAP_WARN };
        G.cages[ci].warn = TAP_WARN;
      }
    }
  }
  // 籠子
  for (i = 0; i < 4; i++) {
    c = G.cages[i];
    c.calm = Math.max(0, c.calm - dt);
    if (!cageHasMon(c)) continue;
    c.rage += SPECIES[c.mon.species].rage * dt;
    if (c.rage >= 100) { breakCage(i); continue; }
    if (c.rage >= 80) c.streak += dt; else c.streak = 0;
    if (c.rage >= 40) {
      var red = c.rage >= 80;
      c.perf += dt;
      var interval = red ? 2 : 3;
      if (c.perf >= interval) { c.perf -= interval; perform(i, red); }
    } else c.perf = 0;
  }
  // 逃脫魔物
  for (i = 0; i < G.loose.length; i++) updateLoose(G.loose[i], dt);
  // 時間到
  if (S.t >= SHOW_TIME) endShow();
}

function perform(i, red) {
  var c = G.cages[i], sp = SPECIES[c.mon.species];
  var mult = 1, repGain = 1, tier = 'show';
  if (red) {
    if (c.streak < 4) { mult = 2; repGain = 2; tier = 'frenzy'; }
    else if (c.streak < 8) { mult = 3; repGain = 3; tier = 'frenzy'; }
    else { mult = 4; repGain = 4; tier = 'bigshow'; }
  }
  var gold = Math.round(sp.gold * mult * (1 + G.rep / 100));
  addGold(gold);
  var x = CAGE_POS[i][0], y = CAGE_POS[i][1];
  addFloat(x - 40, y - 70, '+' + gold, 'gold');
  addRep(repGain, x + 50, y - 100);
  G.effects.push({ x: x, y: y, species: c.mon.species, tier: tier, t: 0 });
}

function breakCage(i) {
  var c = G.cages[i];
  G.loose.push({ cage: i, species: c.mon.species, x: CAGE_POS[i][0], y: CAGE_POS[i][1], hitsLeft: CATCH_HITS, hit: 0, atkT: 0 });
  c.mon = null;
  c.broken = true;
  c.warn = 0; c.streak = 0; c.perf = 0;
  if (G.show.tap && G.show.tap.cage === i) { G.show.tap = null; G.show.tapT = rand(6, 10); }
}

function updateLoose(m, dt) {
  m.hit = Math.max(0, m.hit - dt);
  var best = null, bd = 1e9, i;
  for (i = 0; i < G.visitors.length; i++) {
    var v = G.visitors[i];
    if (v.scared) continue;
    var d = Math.hypot(v.x - m.x, v.y - m.y);
    if (d < bd) { bd = d; best = v; }
  }
  if (!best) return;
  if (bd > 50) {
    var step = Math.min(LOOSE_SPEED * dt, bd - 50);
    m.x += (best.x - m.x) / bd * step;
    m.y += (best.y - m.y) / bd * step;
    m.atkT = 0;
  } else {
    m.atkT += dt;
    if (m.atkT >= LOOSE_ATK_INT) {
      m.atkT = 0;
      best.scared = true;
      best.t = VISITOR_RESPAWN;
      addRep(-3, best.x, best.y - 60);
    }
  }
}

function recapture(m) {
  var c = G.cages[m.cage];
  c.broken = false;
  c.mon = { species: m.species };
  c.rage = CATCH_RAGE; c.streak = 0; c.perf = 0; c.warn = 0;
  var idx = G.loose.indexOf(m);
  if (idx >= 0) G.loose.splice(idx, 1);
}

function endShow() {
  var i;
  var rest = G.loose.slice();
  for (i = 0; i < rest.length; i++) {
    addRep(-5, rest[i].x, rest[i].y - 60);
    recapture(rest[i]);
  }
  for (i = 0; i < 4; i++) { G.cages[i].broken = false; G.cages[i].warn = 0; }
  G.show = null;
  G.effects = [];
  if (G.day >= DAYS) {
    G.phase = 'result';
    G.stars = G.rep >= 200 ? 3 : G.rep >= 120 ? 2 : G.rep >= 60 ? 1 : 0;
  } else {
    G.phase = 'shop';
  }
}

// ===== 輸入(只有滑鼠) =====
function inRect(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }

function onClick(x, y) {
  if (G.guide.open) return clickGuide(x, y);
  if (G.phase !== 'result' && inRect(x, y, BTN.help)) {
    G.guide.open = true; G.guide.first = false; G.guide.page = 0;
    return;
  }
  if (G.phase === 'dungeon') clickDungeon(x, y);
  else if (G.phase === 'place') clickPlace(x, y);
  else if (G.phase === 'show') clickShow(x, y);
  else if (G.phase === 'shop') clickShop(x, y);
  else if (G.phase === 'result') { resetGame(); G.guide.first = false; }
}

function clickGuide(x, y) {
  var g = G.guide;
  if (g.page > 0 && inRect(x, y, BTN.prev)) { g.page--; return; }
  if (g.page < 4) { g.page++; return; }
  g.open = false;
  g.page = 0;
  g.first = false;
}

function clickDungeon(x, y) {
  if (inRect(x, y, BTN.home)) { toPlace(); return; }
  if (inRect(x, y, BTN.net)) {
    if (G.mode === 'net') G.mode = 'attack';
    else if (G.nets > 0) G.mode = 'net';
    return;
  }
  if (G.netAnim && !G.netAnim.resolved) return;
  for (var i = 0; i < G.monsters.length; i++) {
    var m = G.monsters[i];
    if (Math.abs(x - m.x) <= 80 && Math.abs(y - m.y) <= 80) {
      if (G.mode === 'net') throwNet(m); else attack(m);
      return;
    }
  }
}

function attack(m) {
  m.hp -= G.atk;
  m.hit = 0.25;
  if (m.hp <= 0) {
    m.hp = 0;
    G.monsters.splice(G.monsters.indexOf(m), 1);
    addGold(KILL_GOLD);
    addFloat(m.x, m.y - 60, '+' + KILL_GOLD, 'gold');
    if (G.monsters.length === 0) G.clearTimer = 1;
  } else {
    counter(m);
  }
}

function throwNet(m) {
  if (G.nets <= 0) { G.mode = 'attack'; return; }
  G.nets--;
  G.mode = 'attack';
  var rate = CAPTURE_BASE + 0.7 * (1 - m.hp / m.maxHp) + G.netBonus;
  rate = Math.min(CAPTURE_CAP, rate);
  G.netAnim = { m: m, t: 0, success: Math.random() < rate, resolved: false, result: 'flying' };
}

function trayPos(n, i) {
  var sp = n > 1 ? Math.min(114, 600 / (n - 1)) : 0;
  return { x: 360 - sp * (n - 1) / 2 + sp * i, y: TRAY_Y };
}

function cageAt(x, y) {
  for (var i = 0; i < 4; i++) {
    if (Math.abs(x - CAGE_POS[i][0]) <= CAGE_W / 2 && Math.abs(y - CAGE_POS[i][1]) <= CAGE_H / 2) return i;
  }
  return -1;
}

function clickPlace(x, y) {
  if (inRect(x, y, BTN.open)) { startShow(); return; }
  var n = G.tray.length, i;
  for (i = n - 1; i >= 0; i--) {
    var p = trayPos(n, i);
    if (Math.abs(x - p.x) <= 50 && Math.abs(y - p.y) <= 50) {
      G.selTray = (G.selTray === i) ? -1 : i;
      return;
    }
  }
  var ci = cageAt(x, y);
  if (ci < 0) return;
  var c = G.cages[ci];
  if (c.mon) {
    G.tray.push(c.mon);
    c.mon = null;
    G.selTray = -1;
  } else if (G.selTray >= 0 && G.selTray < G.tray.length) {
    c.mon = G.tray.splice(G.selTray, 1)[0];
    c.rage = 0;
    G.selTray = -1;
  }
}

function clickShow(x, y) {
  var i;
  for (i = 0; i < G.loose.length; i++) {
    var m = G.loose[i];
    if (Math.abs(x - m.x) <= 60 && Math.abs(y - m.y) <= 60) {
      m.hitsLeft--;
      m.hit = 0.25;
      if (m.hitsLeft <= 0) recapture(m);
      return;
    }
  }
  var ci = cageAt(x, y);
  if (ci < 0) return;
  var c = G.cages[ci];
  if (!cageHasMon(c)) return;
  c.rage = Math.max(0, c.rage - CALM);
  c.calm = 0.3;
  addFloat(CAGE_POS[ci][0], CAGE_POS[ci][1] - 40, '怒氣-' + CALM, 'rage');
}

function clickShop(x, y) {
  if (inRect(x, y, BTN.go)) {
    G.day++;
    startDay();
    return;
  }
  for (var i = 0; i < SHOP_ITEMS.length; i++) {
    var it = SHOP_ITEMS[i];
    if (Math.abs(x - 360) <= 300 && Math.abs(y - it.y) <= 70) {
      var cost = G.shopCost[it.id];
      if (G.gold < cost) return;
      G.gold -= cost;
      G.shopLevel[it.id]++;
      G.shopCost[it.id] = Math.round(cost * 1.5);
      if (it.id === 'weapon') G.atk += 2;
      else if (it.id === 'armor') G.maxHp += 15;
      else if (it.id === 'netBag') G.netMax += 1;
      else if (it.id === 'goodNet') G.netBonus += 0.1;
      return;
    }
  }
}

// ===== 繪製 =====
var canvas, ctx;

function render() {
  ctx.clearRect(0, 0, W, H);
  Art.drawBackground(ctx, {});
  if (G.guide.open) { renderGuide(); return; }
  var ph = G.phase;
  if (ph === 'dungeon') renderDungeon();
  else if (ph === 'place' || ph === 'show') renderZoo();
  else if (ph === 'shop') renderShop();
  else if (ph === 'result') renderResult();
  if (ph !== 'result') {
    Art.drawButton(ctx, { x: BTN.help.x, y: BTN.help.y, w: BTN.help.w, h: BTN.help.h, label: '說明', enabled: true, active: false });
  }
}

function hudState(message) {
  return {
    phase: G.phase, day: G.day, gold: G.gold, rep: G.rep, hp: G.hp, maxHp: G.maxHp,
    nets: G.nets, netMax: G.netMax,
    timeLeft: G.phase === 'show' ? Math.max(0, SHOW_TIME - G.show.t) : (G.phase === 'place' ? SHOW_TIME : 0),
    room: G.room, message: message || ''
  };
}

function drawFloats() {
  for (var i = 0; i < G.floats.length; i++) {
    var f = G.floats[i];
    Art.drawFloatText(ctx, { x: f.x, y: f.y, text: f.text, kind: f.kind, t: f.t });
  }
}

function renderDungeon() {
  var i, m;
  Art.drawDungeonRoom(ctx, { day: G.day, room: G.room });
  var aiming = G.mode === 'net';
  for (i = 0; i < G.monsters.length; i++) {
    m = G.monsters[i];
    var aim = aiming || (G.netAnim && G.netAnim.m === m && !G.netAnim.resolved);
    Art.drawMonster(ctx, { x: m.x, y: m.y, species: m.species, hp: m.hp, maxHp: m.maxHp, hit: m.hit / 0.25, aimNet: !!aim });
  }
  Art.drawPlayer(ctx, { x: PLAYER_POS.x, y: PLAYER_POS.y, hp: G.hp, maxHp: G.maxHp, hit: G.playerHit / 0.3 });
  var a = G.netAnim;
  if (a) {
    var k = Math.min(1, a.t / 0.4);
    var nx = PLAYER_POS.x + (a.m.x - PLAYER_POS.x) * k;
    var ny = PLAYER_POS.y + (a.m.y - PLAYER_POS.y) * k;
    Art.drawNet(ctx, { x: nx, y: ny, t: a.t, result: a.resolved ? a.result : 'flying' });
  }
  drawFloats();
  Art.drawButton(ctx, { x: BTN.net.x, y: BTN.net.y, w: BTN.net.w, h: BTN.net.h, label: '捕獲網 x' + G.nets, enabled: G.nets > 0 || G.mode === 'net', active: G.mode === 'net' });
  Art.drawButton(ctx, { x: BTN.home.x, y: BTN.home.y, w: BTN.home.w, h: BTN.home.h, label: '回動物園', enabled: true, active: false });
  Art.drawHud(ctx, hudState(G.mode === 'net' ? '點一隻魔物丟網' : ''));
}

function renderZoo() {
  var i, c;
  Art.drawZooGround(ctx, {});
  for (i = 0; i < G.visitors.length; i++) {
    var v = G.visitors[i];
    Art.drawVisitor(ctx, { x: v.x, y: v.y, scared: v.scared });
  }
  var placing = G.phase === 'place' && G.selTray >= 0;
  for (i = 0; i < 4; i++) {
    c = G.cages[i];
    var has = cageHasMon(c) && G.phase === 'show';
    var tier = 'none';
    if (has) {
      if (c.rage >= 80) tier = c.streak >= 8 ? 'bigshow' : 'frenzy';
      else if (c.rage >= 40) tier = 'show';
    }
    Art.drawCage(ctx, {
      x: CAGE_POS[i][0], y: CAGE_POS[i][1],
      species: c.mon ? c.mon.species : null,
      rage: G.phase === 'show' ? Math.min(100, c.rage) : 0,
      tier: tier, streak: has ? c.streak : 0, warn: c.warn,
      calmFlash: c.calm, broken: c.broken,
      selected: placing && !c.mon && !c.broken
    });
  }
  for (i = 0; i < G.effects.length; i++) {
    var e = G.effects[i];
    Art.drawShowEffect(ctx, { x: e.x, y: e.y, species: e.species, tier: e.tier, t: e.t });
  }
  for (i = 0; i < G.loose.length; i++) {
    var l = G.loose[i];
    Art.drawLooseMonster(ctx, { x: l.x, y: l.y, species: l.species, hitsLeft: l.hitsLeft, hit: l.hit / 0.25 });
  }
  var n = G.tray.length;
  for (i = 0; i < n; i++) {
    var p = trayPos(n, i);
    Art.drawTrayMonster(ctx, { x: p.x, y: p.y, species: G.tray[i].species, selected: i === G.selTray });
  }
  drawFloats();
  var msg = '';
  if (G.phase === 'place') {
    msg = '點魔物, 再點空籠子';
    Art.drawButton(ctx, { x: BTN.open.x, y: BTN.open.y, w: BTN.open.w, h: BTN.open.h, label: '開園', enabled: true, active: false });
  } else if (G.loose.length > 0) {
    msg = '點牠 3 下抓回';
  }
  Art.drawHud(ctx, hudState(msg));
}

function renderShop() {
  for (var i = 0; i < SHOP_ITEMS.length; i++) {
    var it = SHOP_ITEMS[i], cost = G.shopCost[it.id];
    Art.drawShopItem(ctx, { x: 360, y: it.y, item: it.id, level: G.shopLevel[it.id], cost: cost, affordable: G.gold >= cost });
  }
  Art.drawButton(ctx, { x: BTN.go.x, y: BTN.go.y, w: BTN.go.w, h: BTN.go.h, label: '出發', enabled: true, active: false });
  Art.drawHud(ctx, hudState(''));
}

function renderResult() {
  Art.drawResultPanel(ctx, { rep: G.rep, goldEarned: G.totalGold, stars: G.stars });
  Placeholder.text(ctx, '點畫面重來', W / 2, 1200, 36);
}

function renderGuide() {
  var g = G.guide, p = g.page;
  Placeholder.text(ctx, '第 ' + (p + 1) + ' 頁  ' + GUIDE_TITLES[p], W / 2, 90, 48);
  Placeholder.text(ctx, GUIDE_TEXTS[p], W / 2, 175, 38);
  Art.drawGuidePage(ctx, { page: p + 1, x: GUIDE_FRAME.x, y: GUIDE_FRAME.y, w: GUIDE_FRAME.w, h: GUIDE_FRAME.h });
  Placeholder.text(ctx, (p + 1) + ' / 5', W / 2, 1050, 34);
  if (p > 0) {
    Art.drawButton(ctx, { x: BTN.prev.x, y: BTN.prev.y, w: BTN.prev.w, h: BTN.prev.h, label: '上一頁', enabled: true, active: false });
  }
  var hint = p < 4 ? '點畫面繼續' : (g.first ? '點畫面開始遊戲' : '點畫面回到遊戲');
  Placeholder.text(ctx, hint, 470, 1200, 30);
}

// ===== 主迴圈 / 初始化 =====
var last = 0;
function frame(ts) {
  var dt = (ts - last) / 1000;
  last = ts;
  if (!(dt > 0)) dt = 0;
  dt = Math.min(dt, 1 / 30);
  try {
    update(dt);
    render();
  } catch (err) {
    console.error(err);
  }
  requestAnimationFrame(frame);
}

function fit() {
  var s = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
}

function init() {
  canvas = document.getElementById('game');
  var dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  fit();
  window.addEventListener('resize', fit);
  canvas.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    e.preventDefault();
    var r = canvas.getBoundingClientRect();
    onClick((e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height);
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  resetGame();
  G.phase = 'dungeon';
  G.guide.open = true; // 開場先顯示說明頁
  requestAnimationFrame(function (ts) { last = ts; frame(ts); });
}

if (typeof document !== 'undefined') init();
})();
