(function () {
'use strict';

// ===== 數值表(spec 數值參數表) =====
var SPECIES = {
  fire:    { name: '火蜥蜴', hp: 20, atk: 4, iv: 1.2, gold: 6 },
  water:   { name: '水母',   hp: 16, atk: 2, iv: 0.8, gold: 4 },
  thunder: { name: '雷鳥',   hp: 18, atk: 5, iv: 1.6, gold: 7 },
  stone:   { name: '石像鬼', hp: 30, atk: 3, iv: 1.5, gold: 5 }
};
var SPECIES_KEYS = ['fire', 'water', 'thunder', 'stone'];
var CFG = {
  days: 3, enemyCounts: [2, 3, 3],
  heroHp: 40, heroAtk: 5, heroIv: 1.0,
  killGold: 3, rosterMax: 8, teamBase: 2, teamCap: 3,
  cagesBase: 3, slotsBase: 6, slotsCap: 8, slotTime: 4,
  perfMin: 40, bigMin: 80, looseAt: 100,
  rageAtk: 8, rageHit: 5, rageDown: 30, rageCap: 99,
  idleRage: 20, newRage: 20, afterPerf: 35, backstage: 12, hype: 20, calm: 25,
  stars: [30, 60, 100]
};
var SHOP = [
  { item: 'weapon',   cost: 50, max: 99 },
  { item: 'cageBag',  cost: 40, max: 99 },
  { item: 'goodCage', cost: 60, max: 99 },
  { item: 'extraSlot', cost: 60, max: 2 },  // 6 -> 8
  { item: 'teamSize', cost: 70, max: 1 }    // 2 -> 3
];

var W = Art.canvas.width, H = Art.canvas.height;
var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var FONT = "'Microsoft JhengHei','PingFang TC',sans-serif";

// ===== 佔位圖形(目前無) =====
var Placeholder = {};

// ===== 畫布縮放 =====
function resize() {
  var dpr = window.devicePixelRatio || 1;
  var s = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ===== 狀態 =====
var G;          // 整局狀態
var guide = { open: true, page: 0, first: true };
var nextId = 1;

function newGame() {
  G = {
    phase: 'team', day: 1, gold: 0, goldEarned: 0, rep: 0,
    lv: { weapon: 0, cageBag: 0, goodCage: 0, extraSlot: 0, teamSize: 0 },
    roster: [], cages: 0,
    hero: null, battleIdx: 0, enemies: [], allies: [], cageObjs: [], floats: [],
    clearTimer: -1, message: '', msgT: 0,
    slots: [], selId: null,
    show: null
  };
  G.roster.push(makeMonster('fire'));
  G.slots = emptySlots();
}
function makeMonster(sp) {
  var b = SPECIES[sp];
  return { id: nextId++, species: sp, hp: b.hp, maxHp: b.hp, atk: b.atk, iv: b.iv, rage: CFG.newRage,
           loose: false, deployed: false, down: false, acc: 0, atkT: 0, hitT: 0 };
}
function teamMax() { return CFG.teamBase + G.lv.teamSize; }
function slotCount() { return CFG.slotsBase + G.lv.extraSlot; }
function cageMax() { return CFG.cagesBase + G.lv.cageBag; }
function heroAtk() { return CFG.heroAtk + 3 * G.lv.weapon; }
function emptySlots() { var a = []; for (var i = 0; i < slotCount(); i++) a.push(null); return a; }
function deployedCount() { var n = 0; G.roster.forEach(function (m) { if (m.deployed) n++; }); return n; }
// 每次買價格 ×1.5 四捨五入(逐次取整)
function priceOf(i) {
  var c = SHOP[i].cost;
  for (var k = 0; k < G.lv[SHOP[i].item]; k++) c = Math.round(c * 1.5);
  return c;
}
function findMonster(id) { for (var i = 0; i < G.roster.length; i++) if (G.roster[i].id === id) return G.roster[i]; return null; }
function addRep(n) { G.rep = Math.max(0, G.rep + n); }
function addGold(n) { G.gold += n; G.goldEarned += n; }
function say(t, sec) { G.message = t; G.msgT = sec || 0; }
function addFloat(x, y, text, kind, life) { G.floats.push({ x: x, y: y, text: text, kind: kind, t: 0, life: life || 1.2 }); }

// ===== 版面 =====
var BTN = { x: 160, y: 1140, w: 400, h: 100 };
var HELP_BTN = { x: 610, y: 128, w: 100, h: 44 };
var PREV_BTN = { x: 30, y: 1150, w: 200, h: 80 };
function inRect(px, py, x, y, w, h) { return px >= x && px <= x + w && py >= y && py <= y + h; }
function inBox(px, py, cx, cy, w, h) { return Math.abs(px - cx) <= w / 2 && Math.abs(py - cy) <= h / 2; }
function teamCardPos(i) { return { x: 140 + 220 * (i % 3), y: 300 + 240 * Math.floor(i / 3) }; }
function rosterCardPos(i) { return { x: 105 + 170 * (i % 4), y: 880 + 180 * Math.floor(i / 4) }; }
function slotPos(i, n) { return { x: 360 + (i - (n - 1) / 2) * 84, y: 680 }; }
var ENEMY_X = [140, 360, 580], ENEMY_Y = 400;
var ALLY_X = [120, 280, 440, 600], ALLY_Y = 820;
function shopPos(i) { return { x: 360, y: 260 + 140 * i }; }

// ===== 流程 =====
function startDay() {
  G.roster.forEach(function (m) { m.hp = m.maxHp; m.down = false; m.atkT = 0; m.hitT = 0; m.acc = 0; });
  G.hero = { hp: CFG.heroHp, maxHp: CFG.heroHp, atk: heroAtk(), iv: CFG.heroIv, acc: 0, atkT: 0, hitT: 0, down: false };
  G.cages = cageMax();
  G.battleIdx = 0;
  G.phase = 'battle';
  startBattle();
}
function startBattle() {
  var d = G.day - 1;
  var n = CFG.enemyCounts[G.battleIdx];
  G.enemies = [];
  for (var i = 0; i < n; i++) {
    var sp = SPECIES_KEYS[Math.floor(Math.random() * 4)];
    var b = SPECIES[sp];
    var hp = Math.round(b.hp * (1 + 0.4 * d));
    G.enemies.push({ species: sp, hp: hp, maxHp: hp, atk: b.atk + d, iv: b.iv, acc: 0, atkT: 0, hitT: 0,
                     x: ENEMY_X[i], y: ENEMY_Y, caging: false });
  }
  G.allies = [];
  G.roster.forEach(function (m) { if (m.deployed) G.allies.push(m); });
  G.cageObjs = [];
  G.floats = [];
  G.clearTimer = -1;
  say('點敵人丟籠', 0);
}
function endBattle() { // 進入排節目
  G.phase = 'program';
  G.cageObjs = [];
  G.floats = [];
  G.roster.forEach(function (m) { if (!m.deployed) m.rage = CFG.idleRage; });
  G.slots = emptySlots();
  G.selId = null;
  say('點魔物, 再點格子', 0);
}

// ===== 戰鬥 =====
function aliveAllies() {
  var a = [];
  if (G.hero.hp > 0) a.push(G.hero);
  G.allies.forEach(function (m) { if (!m.down) a.push(m); });
  return a;
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function allyPos(u) {
  if (u === G.hero) return { x: ALLY_X[0], y: ALLY_Y };
  return { x: ALLY_X[1 + G.allies.indexOf(u)], y: ALLY_Y };
}
function killEnemy(e) {
  var i = G.enemies.indexOf(e);
  if (i >= 0) G.enemies.splice(i, 1);
  addGold(CFG.killGold);
  addFloat(e.x, e.y, '+' + CFG.killGold, 'gold');
}
function allyAttack(u) {
  var t = G.enemies.length ? pick(G.enemies) : null;
  if (!t) return;
  u.atkT = 0.25;
  if (u !== G.hero) u.rage = Math.min(CFG.rageCap, u.rage + CFG.rageAtk);
  t.hp -= u.atk; t.hitT = 0.25;
  if (t.hp <= 0) { t.hp = 0; killEnemy(t); }
}
function enemyAttack(e) {
  var list = aliveAllies();
  if (!list.length) return;
  var t = pick(list);
  e.atkT = 0.25;
  t.hp -= e.atk; t.hitT = 0.25;
  if (t !== G.hero) t.rage = Math.min(CFG.rageCap, t.rage + CFG.rageHit);
  if (t.hp <= 0) {
    t.hp = 0; t.down = true;
    if (t !== G.hero) {
      t.rage = Math.min(CFG.rageCap, t.rage + CFG.rageDown);
      var p = allyPos(t);
      addFloat(p.x, p.y - 60, '+' + CFG.rageDown, 'rageUp');
    }
  }
}
function throwCage(e) {
  if (G.cages <= 0 || e.caging) return;
  if (G.roster.length >= CFG.rosterMax) { say('名單滿了', 1.5); return; }
  G.cages--;
  var rate = 1 - e.hp / e.maxHp + 0.1 * G.lv.goodCage;
  rate = Math.max(0.1, Math.min(0.95, rate));
  e.caging = true;
  G.cageObjs.push({ sx: ALLY_X[0], sy: ALLY_Y - 40, tx: e.x, ty: e.y, enemy: e, success: Math.random() < rate,
                    state: 'flying', t: 0, x: ALLY_X[0], y: ALLY_Y - 40 });
}
function updateCages(dt) {
  var FLY = 0.45, STAY = 0.7;
  for (var i = G.cageObjs.length - 1; i >= 0; i--) {
    var c = G.cageObjs[i];
    c.t += dt;
    if (c.state === 'flying') {
      var k = Math.min(1, c.t / FLY);
      c.x = c.sx + (c.tx - c.sx) * k;
      c.y = c.sy + (c.ty - c.sy) * k - Math.sin(k * Math.PI) * 120;
      if (c.t >= FLY) {
        var e = c.enemy, idx = G.enemies.indexOf(e);
        c.t = 0; c.x = c.tx; c.y = c.ty;
        if (idx >= 0) { c.x = e.x; c.y = e.y; }
        e.caging = false;
        if (idx >= 0 && c.success) {
          if (G.roster.length >= CFG.rosterMax) { c.state = 'broken'; say('名單滿了', 1.5); }
          else {
            c.state = 'caught';
            G.enemies.splice(idx, 1);
            G.roster.push(makeMonster(e.species));
          }
        } else c.state = 'broken';
      }
    } else if (c.t >= STAY) G.cageObjs.splice(i, 1);
  }
}
function updateBattle(dt) {
  if (G.msgT > 0) { G.msgT -= dt; if (G.msgT <= 0) say('點敵人丟籠', 0); }
  var es = G.enemies.slice(), as = aliveAllies();
  es.concat(as, G.allies).forEach(function (u) {
    if (u.atkT > 0) u.atkT -= dt;
    if (u.hitT > 0) u.hitT -= dt;
  });
  as.forEach(function (u) {
    if (u.hp <= 0) return; // 本幀稍早被打倒
    u.acc += dt;
    if (u.acc >= u.iv) { u.acc -= u.iv; allyAttack(u); }
  });
  es.forEach(function (e) {
    if (G.enemies.indexOf(e) < 0) return; // 已被打倒
    e.acc += dt;
    if (e.acc >= e.iv) { e.acc -= e.iv; enemyAttack(e); }
  });
  updateCages(dt);
  if (G.hero.hp <= 0) { G.hero.down = true; endBattle(); return; }
  if (G.enemies.length === 0) {
    if (G.clearTimer < 0) G.clearTimer = 1;
    else {
      G.clearTimer -= dt;
      if (G.clearTimer <= 0) {
        G.battleIdx++;
        if (G.battleIdx >= CFG.enemyCounts.length) endBattle(); else startBattle();
      }
    }
  }
}

// ===== 演出 =====
function startShow() {
  G.phase = 'show';
  G.selId = null;
  say('', 0);
  G.floats = [];
  var n = G.slots.length;
  var sh = G.show = { i: 0, t: 0, successCnt: 0, nextBonus: 1, cur: null, mode: 'idle', big: false,
                      riotT: 99, skill: null, done: [], bonus: [], finishT: -1 };
  for (var i = 0; i < n; i++) { sh.done.push('none'); sh.bonus.push(1); }
  startSlot();
}
function backstageList() {
  var sh = G.show, a = [];
  G.roster.forEach(function (m) { if (m !== sh.cur && !m.loose) a.push(m); });
  return a;
}
function checkLoose() {
  var sh = G.show;
  backstageList().forEach(function (m) {
    if (m.rage >= CFG.looseAt) {
      m.loose = true;
      addRep(-8);
      sh.riotT = 0;
      addFloat(360, 330, '名聲-8', 'repDown');
    }
  });
}
function rosterIndex(m) { return G.roster.indexOf(m); }
function rageFloat(m, delta) {
  var p = rosterCardPos(rosterIndex(m));
  addFloat(p.x, p.y - 70, (delta > 0 ? '+' : '') + delta, delta > 0 ? 'rageUp' : 'rageDown');
}
function startSlot() {
  var sh = G.show, i = sh.i;
  sh.t = 0;
  var id = G.slots[i];
  var m = id ? findMonster(id) : null;
  var bonus = sh.nextBonus; sh.nextBonus = 1;
  sh.bonus[i] = bonus;
  sh.cur = m; sh.skill = null; sh.big = false;
  if (m && !m.loose && m.rage >= CFG.perfMin) {
    var big = m.rage >= CFG.bigMin;
    var mult = bonus;
    if (m.species === 'stone') mult *= 1 + 0.5 * sh.successCnt;
    var gold = Math.round(SPECIES[m.species].gold * m.rage / 50 * mult * (1 + G.rep / 100));
    addGold(gold);
    addFloat(360, 300, '+' + gold, 'gold');
    var rp = big ? 4 : 2;
    addRep(rp);
    addFloat(360, 345, '名聲+' + rp + (big ? ' 大場面' : ''), 'repUp');
    sh.successCnt++;
    sh.mode = 'perform'; sh.big = big;
    var kind = { fire: 'warmup', thunder: 'hype', water: 'calm', stone: 'finale' }[m.species];
    sh.skill = { kind: kind, t: 0 };
    if (m.species === 'fire') {
      sh.nextBonus = 2;
      if (i + 1 < sh.bonus.length) sh.bonus[i + 1] = 2;
    } else if (m.species === 'thunder') {
      backstageList().forEach(function (b) { b.rage += CFG.hype; rageFloat(b, CFG.hype); });
    } else if (m.species === 'water') {
      backstageList().forEach(function (b) {
        var nr = Math.max(0, b.rage - CFG.calm);
        rageFloat(b, nr - b.rage); b.rage = nr;
      });
    }
    checkLoose();
  } else {
    addRep(-1);
    addFloat(360, 345, '名聲-1', 'repDown');
    sh.mode = 'flop';
  }
}
function endSlot() {
  var sh = G.show, m = sh.cur;
  var back = backstageList();
  if (m && !m.loose) { // 剛表演的魔物 -35
    var nr = Math.max(0, m.rage - CFG.afterPerf);
    rageFloat(m, nr - m.rage); m.rage = nr;
  }
  back.forEach(function (b) { b.rage += CFG.backstage; rageFloat(b, CFG.backstage); });
  sh.done[sh.i] = sh.mode === 'perform' ? 'success' : 'flop';
  checkLoose();
}
function updateShow(dt) {
  var sh = G.show;
  if (sh.riotT < 90) sh.riotT += dt;
  if (sh.skill) sh.skill.t += dt;
  if (sh.finishT >= 0) {
    sh.finishT += dt;
    if (sh.finishT >= 1.2) finishShow();
    return;
  }
  sh.t += dt;
  if (sh.t >= CFG.slotTime) {
    endSlot();
    sh.i++;
    if (sh.i >= G.slots.length) { sh.finishT = 0; sh.cur = null; sh.mode = 'idle'; sh.skill = null; }
    else startSlot();
  }
}
function finishShow() {
  G.roster.forEach(function (m) { m.loose = false; });
  G.show = null;
  G.floats = [];
  if (G.day >= CFG.days) { G.phase = 'result'; }
  else { G.phase = 'shop'; }
}

// ===== 更新 =====
function update(dt) {
  if (guide.open) return;
  var i;
  for (i = G.floats.length - 1; i >= 0; i--) {
    G.floats[i].t += dt;
    if (G.floats[i].t > G.floats[i].life) G.floats.splice(i, 1);
  }
  if (G.phase === 'battle') updateBattle(dt);
  else if (G.phase === 'show') updateShow(dt);
}

// ===== 輸入(只有滑鼠) =====
function onClick(ev) {
  ev.preventDefault();
  var r = canvas.getBoundingClientRect();
  var x = (ev.clientX - r.left) * W / r.width;
  var y = (ev.clientY - r.top) * H / r.height;
  handleClick(x, y);
}
function handleClick(x, y) {
  if (guide.open) {
    if (guide.page > 0 && inRect(x, y, PREV_BTN.x, PREV_BTN.y, PREV_BTN.w, PREV_BTN.h)) { guide.page--; return; }
    if (guide.page < Art_guidePages() - 1) { guide.page++; return; }
    guide.open = false; guide.page = 0; guide.first = false;
    return;
  }
  var ph = G.phase, i;
  if (ph !== 'result' && inRect(x, y, HELP_BTN.x, HELP_BTN.y, HELP_BTN.w, HELP_BTN.h)) {
    guide.open = true; guide.page = 0; return;
  }
  if (ph === 'team') {
    for (i = 0; i < G.roster.length; i++) {
      var p = teamCardPos(i);
      if (inBox(x, y, p.x, p.y, 200, 220)) {
        var m = G.roster[i];
        if (m.deployed) m.deployed = false;
        else if (deployedCount() < teamMax()) m.deployed = true;
        return;
      }
    }
    if (inRect(x, y, BTN.x, BTN.y, BTN.w, BTN.h)) startDay();
  } else if (ph === 'battle') {
    if (inRect(x, y, BTN.x, BTN.y, BTN.w, BTN.h)) { endBattle(); return; }
    for (i = 0; i < G.enemies.length; i++) {
      var e = G.enemies[i];
      if (inBox(x, y, e.x, e.y, 160, 160)) { throwCage(e); return; }
    }
  } else if (ph === 'program') {
    if (inRect(x, y, BTN.x, BTN.y, BTN.w, BTN.h)) { startShow(); return; }
    for (i = 0; i < G.roster.length; i++) {
      var q = rosterCardPos(i);
      if (inBox(x, y, q.x, q.y, 150, 160)) {
        G.selId = G.selId === G.roster[i].id ? null : G.roster[i].id;
        return;
      }
    }
    var n = G.slots.length;
    for (i = 0; i < n; i++) {
      var s = slotPos(i, n);
      if (inBox(x, y, s.x, s.y, 76, 96)) {
        if (G.selId != null) G.slots[i] = G.selId;
        else G.slots[i] = null;
        return;
      }
    }
  } else if (ph === 'shop') {
    for (i = 0; i < SHOP.length; i++) {
      var sp = shopPos(i);
      if (inBox(x, y, sp.x, sp.y, 600, 120)) { buy(i); return; }
    }
    if (inRect(x, y, BTN.x, BTN.y, BTN.w, BTN.h)) { G.day++; G.phase = 'team'; }
  } else if (ph === 'result') {
    newGame();
  }
}
function maxed(i) { return G.lv[SHOP[i].item] >= SHOP[i].max; }
function buy(i) {
  if (maxed(i)) return;
  var c = priceOf(i);
  if (G.gold < c) return;
  G.gold -= c;
  G.lv[SHOP[i].item]++;
  if (SHOP[i].item === 'extraSlot') G.slots = emptySlots();
}

// ===== 繪製 =====
function Art_guidePages() { return 6; }
var GUIDE = [
  { t: '編隊', s: ['點魔物卡片, 帶牠一起出戰'] },
  { t: '戰鬥與捕獲', s: ['戰鬥自動打, 點敵人丟籠'] },
  { t: '排節目', s: ['點魔物, 再點格子, 排好按開演'] },
  { t: '後台', s: ['在後台等越久越生氣'] },
  { t: '怒氣', s: ['夠生氣才演得好, 爆了會失控'] },
  { t: '一天的流程', s: ['三天後依名聲評星'] }
];
function text(s, x, y, size, color, align) {
  ctx.font = 'bold ' + size + 'px ' + FONT;
  ctx.fillStyle = color || '#fff';
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}
function renderGuide() {
  Art.drawBackground(ctx, {});
  var g = GUIDE[guide.page];
  text('第 ' + (guide.page + 1) + ' 頁 ' + g.t, W / 2, 70, 52, '#ffe9a8');
  Art.drawGuidePage(ctx, { page: guide.page + 1, x: 40, y: 150, w: 640, h: 640 });
  for (var i = 0; i < g.s.length; i++) text(g.s[i], W / 2, 870 + i * 60, 42, '#fff');
  text((guide.page + 1) + ' / ' + Art_guidePages(), W / 2, 1010, 36, '#ccc');
  Art.drawButton(ctx, { x: PREV_BTN.x, y: PREV_BTN.y, w: PREV_BTN.w, h: PREV_BTN.h, label: '上一頁', enabled: guide.page > 0 });
  var last = guide.page === Art_guidePages() - 1;
  text(last ? '點畫面開始遊戲' : '點畫面繼續', W / 2 + 120, 1190, 30, '#ddd');
}
function hud(extra) {
  var s = {
    phase: G.phase, day: G.day, gold: G.gold, rep: G.rep, cages: G.cages, cageMax: cageMax(),
    teamCount: deployedCount(), teamMax: teamMax(), slotIndex: 0, slotCount: G.slots.length,
    slotTimeLeft: 0, message: G.message
  };
  if (extra) for (var k in extra) s[k] = extra[k];
  Art.drawHud(ctx, s);
}
function drawFloats() {
  G.floats.forEach(function (f) { Art.drawFloatText(ctx, { x: f.x, y: f.y, text: f.text, kind: f.kind, t: f.t }); });
}
function helpButton() {
  Art.drawButton(ctx, { x: HELP_BTN.x, y: HELP_BTN.y, w: HELP_BTN.w, h: HELP_BTN.h, label: '說明', enabled: true });
}
function render() {
  if (guide.open) { renderGuide(); return; }
  var ph = G.phase, i;
  Art.drawBackground(ctx, {});
  if (ph === 'team') {
    G.roster.forEach(function (m, i) {
      var p = teamCardPos(i);
      Art.drawTeamCard(ctx, { x: p.x, y: p.y, species: m.species, hp: m.maxHp, maxHp: m.maxHp, rage: m.rage,
        selected: m.deployed, disabled: !m.deployed && deployedCount() >= teamMax() });
    });
    Art.drawButton(ctx, { x: BTN.x, y: BTN.y, w: BTN.w, h: BTN.h, label: '出發', enabled: true });
    hud({ message: '點魔物卡片出戰, 再按出發' });
    helpButton();
  } else if (ph === 'battle') {
    Art.drawBattleField(ctx, { day: G.day, battle: G.battleIdx + 1 });
    G.enemies.forEach(function (e) {
      Art.drawEnemy(ctx, { x: e.x, y: e.y, species: e.species, hp: e.hp, maxHp: e.maxHp, attacking: e.atkT > 0, hit: e.hitT > 0 });
    });
    var h = G.hero;
    Art.drawHero(ctx, { x: ALLY_X[0], y: ALLY_Y, hp: h.hp, maxHp: h.maxHp, attacking: h.atkT > 0, hit: h.hitT > 0, down: h.hp <= 0 });
    G.allies.forEach(function (m, i) {
      Art.drawAllyMonster(ctx, { x: ALLY_X[1 + i], y: ALLY_Y, species: m.species, hp: m.hp, maxHp: m.maxHp, rage: m.rage,
        attacking: m.atkT > 0, hit: m.hitT > 0, down: m.down });
    });
    G.cageObjs.forEach(function (c) {
      Art.drawCage(ctx, { x: c.x, y: c.y, result: c.state === 'flying' ? 'flying' : c.state, t: c.t });
    });
    drawFloats();
    Art.drawButton(ctx, { x: BTN.x, y: BTN.y, w: BTN.w, h: BTN.h, label: '撤退', enabled: true });
    hud();
    helpButton();
  } else if (ph === 'program' || ph === 'show') {
    var sh = G.show, n = G.slots.length;
    var stage = { mode: 'idle', species: null, bigShow: false, t: 0 };
    if (sh) {
      stage.t = sh.t;
      if (sh.riotT < 1.2) { stage.mode = 'riot'; stage.t = sh.riotT; }
      else if (sh.finishT < 0 && sh.t < 3.5 && sh.cur !== undefined) {
        stage.mode = sh.mode;
        stage.species = sh.cur && sh.mode === 'perform' ? sh.cur.species : (sh.cur ? sh.cur.species : null);
        stage.bigShow = sh.big;
      }
    }
    Art.drawStage(ctx, stage);
    for (i = 0; i < n; i++) {
      var p = slotPos(i, n);
      var mon = G.slots[i] ? findMonster(G.slots[i]) : null;
      Art.drawProgramSlot(ctx, { x: p.x, y: p.y, index: i + 1, species: mon ? mon.species : null,
        current: !!sh && sh.finishT < 0 && sh.i === i, result: sh ? sh.done[i] : 'none',
        bonus: sh ? sh.bonus[i] : 1, selectedTarget: !sh && G.selId != null });
    }
    G.roster.forEach(function (m, i) {
      var q = rosterCardPos(i);
      Art.drawRosterCard(ctx, { x: q.x, y: q.y, species: m.species, rage: m.rage, selected: G.selId === m.id,
        onStage: !!sh && sh.cur === m, loose: m.loose });
    });
    if (sh && sh.skill) Art.drawSkillEffect(ctx, { kind: sh.skill.kind, t: sh.skill.t });
    drawFloats();
    if (sh) Art.drawButton(ctx, { x: BTN.x, y: BTN.y, w: BTN.w, h: BTN.h, label: '演出中', enabled: false });
    else Art.drawButton(ctx, { x: BTN.x, y: BTN.y, w: BTN.w, h: BTN.h, label: '開演', enabled: true });
    if (sh) hud({ slotIndex: Math.min(sh.i + 1, n), slotTimeLeft: sh.finishT >= 0 ? 0 : Math.max(0, CFG.slotTime - sh.t), message: '' });
    else hud({ message: '點魔物, 再點格子' });
    helpButton();
  } else if (ph === 'shop') {
    for (i = 0; i < SHOP.length; i++) {
      var sp = shopPos(i), c = priceOf(i), mx = maxed(i);
      Art.drawShopItem(ctx, { x: sp.x, y: sp.y, item: SHOP[i].item, level: G.lv[SHOP[i].item], cost: c,
        affordable: G.gold >= c && !mx, maxed: mx });
    }
    Art.drawButton(ctx, { x: BTN.x, y: BTN.y, w: BTN.w, h: BTN.h, label: '出發', enabled: true });
    hud({ message: '' });
    helpButton();
  } else if (ph === 'result') {
    var stars = 0;
    CFG.stars.forEach(function (t) { if (G.rep >= t) stars++; });
    Art.drawResultPanel(ctx, { rep: G.rep, goldEarned: G.goldEarned, stars: stars });
    text('點畫面重來', W / 2, 1180, 40, '#fff');
    hud({ message: '' });
  }
}

// ===== 主迴圈 =====
var last = 0;
function frame(ts) {
  try {
    var dt = (ts - last) / 1000;
    last = ts;
    if (!(dt > 0)) dt = 0;
    dt = Math.min(dt, 1 / 30);
    update(dt);
    render();
  } catch (e) { console.error(e); }
  requestAnimationFrame(frame);
}

newGame();
resize();
window.addEventListener('resize', resize);
canvas.addEventListener('click', onClick);
requestAnimationFrame(function (ts) { last = ts; frame(ts); });
})();
