(function () {
'use strict';

var W = Art.canvas.width, H = Art.canvas.height;
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var viewScale = 1;

function resize() {
  var dpr = window.devicePixelRatio || 1;
  viewScale = Math.min(window.innerWidth / W, window.innerHeight / H);
  if (!(viewScale > 0)) viewScale = 1;
  canvas.style.width = Math.floor(W * viewScale) + 'px';
  canvas.style.height = Math.floor(H * viewScale) + 'px';
  canvas.width = Math.round(W * viewScale * dpr);
  canvas.height = Math.round(H * viewScale * dpr);
  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
}
window.addEventListener('resize', resize);
resize();

/* ---------- 數值表 ---------- */
var DAYS = 3, PER_ROOM = 3, SHOW_TIME = 45;
var SPECIES = {
  fire:    { hp: 10, atk: 2, rage: 3,   gold: 6 },
  water:   { hp: 8,  atk: 1, rage: 2,   gold: 4 },
  thunder: { hp: 12, atk: 3, rage: 3.5, gold: 8 },
  stone:   { hp: 16, atk: 2, rage: 2,   gold: 5 }
};
var SPECIES_LIST = ['fire', 'water', 'thunder', 'stone'];
var STAR_HP = [0, 1, 1.5, 2], STAR_GOLD = [0, 1, 2, 3.5], STAR_RAGE = [0, 1, 1.4, 1.8];
var MON_X = [140, 360, 580], MON_Y = 460, PLAYER_X = 360, PLAYER_Y = 860;
var CAGE_POS = [[190, 300], [530, 300], [190, 640], [530, 640]];
var SHOP_ITEMS = [
  { id: 'weapon', cost: 60 }, { id: 'armor', cost: 50 },
  { id: 'netBag', cost: 40 }, { id: 'goodNet', cost: 80 }
];
var SHOP_Y = [300, 470, 640, 810];
var VIS_POS = [[120, 850], [360, 850], [600, 850], [120, 950], [360, 950], [600, 950]];

/* ---------- 佔位圖形(目前無) ---------- */
var Placeholder = {};

/* ---------- 狀態 ---------- */
var G;            // 遊戲資料
var phase;        // dungeon | roomClear | place | show | shop | result
var guideOpen = true, guidePage = 0, guideFrom = 'start';
var clockT = 0;

function resetAll() {
  G = {
    day: 1, depth: 1, gold: 0, rep: 0, goldEarned: 0, maxDepth: 1, bestStar: 0,
    hp: 40, maxHp: 40, atk: 6, nets: 4, netMax: 4, netBonus: 0,
    mode: 'heavy', prevMode: 'heavy',
    monsters: [], loot: [], tray: [], sel: -1,
    cages: [], loose: [], visitors: [], floats: [], nets_fx: [],
    shop: SHOP_ITEMS.map(function (s) { return { id: s.id, level: 0, cost: s.cost }; }),
    playerHit: 0, timeLeft: SHOW_TIME, message: '', msgT: 0, stars: 0
  };
  for (var i = 0; i < 4; i++) G.cages.push({ mon: null, broken: false, calm: 0, eff: 99, perfT: 0 });
  for (i = 0; i < 6; i++) G.visitors.push({ x: VIS_POS[i][0], y: VIS_POS[i][1], present: true, back: 0, scaredT: 0 });
}

function startDay() {
  G.hp = G.maxHp; G.nets = G.netMax; G.depth = 1; G.loot = [];
  G.mode = 'heavy'; G.prevMode = 'heavy'; G.floats = []; G.nets_fx = [];
  G.message = ''; G.msgT = 0;
  spawnRoom();
  phase = 'dungeon';
}

function rand() { return Math.random(); }

function spawnRoom() {
  var d = G.depth, day = G.day;
  if (d > G.maxDepth) G.maxDepth = d;
  G.monsters = [];
  var p3 = Math.min(0.5, 0.05 + 0.1 * (d - 1));
  var p2 = Math.min(0.4, 0.2 + 0.1 * (d - 1));
  for (var i = 0; i < PER_ROOM; i++) {
    var sp = SPECIES_LIST[Math.floor(rand() * 4)];
    var r = rand();
    var star = r < p3 ? 3 : (r < p3 + p2 ? 2 : 1);
    var base = SPECIES[sp];
    var hp = Math.round(base.hp * STAR_HP[star] * (1 + 0.3 * (d - 1)) * (1 + 0.3 * (day - 1)));
    G.monsters.push({
      species: sp, star: star, hp: hp, maxHp: hp,
      atk: base.atk + Math.floor((d - 1) / 2) + (day - 1),
      x: MON_X[i], y: MON_Y, hit: 0
    });
  }
}

/* ---------- 工具 ---------- */
function addFloat(x, y, text, kind) { G.floats.push({ x: x, y: y, text: text, kind: kind, t: 0 }); }
function addRep(n) { G.rep = Math.max(0, G.rep + n); }
function tierOf(rage) { return rage < 40 ? 'none' : (rage < 80 ? 'show' : 'frenzy'); }

/* ---------- 地下城 ---------- */
function setMode(m) {
  if (m === 'net' && G.nets <= 0) return;
  if (m !== 'net') G.prevMode = m;
  G.mode = m;
}

function clickMonster(m) {
  if (m.hp <= 0) return;
  if (G.mode === 'net') {
    G.nets--;
    var rate = 0.2 + 0.8 * (1 - m.hp / m.maxHp) + G.netBonus - (m.star - 1) * 0.1;
    rate = Math.max(0.05, Math.min(0.95, rate));
    var ok = rand() < rate;
    G.nets_fx.push({ x: m.x, y: m.y, t: 0, result: ok ? 'success' : 'fail' });
    G.mode = G.prevMode;
    if (ok) {
      G.monsters.splice(G.monsters.indexOf(m), 1);
      G.loot.push({ species: m.species, star: m.star });
      if (m.star > G.bestStar) G.bestStar = m.star;
    } else {
      counter(m);
    }
  } else {
    var dmg = G.mode === 'heavy' ? G.atk : Math.max(1, Math.round(G.atk / 3));
    m.hp = Math.max(0, m.hp - dmg);
    m.hit = 0.25;
    addFloat(m.x, m.y - 80, '-' + dmg, 'damage');
    if (m.hp <= 0) {
      G.monsters.splice(G.monsters.indexOf(m), 1);
      var g = 3 * m.star;
      G.gold += g; G.goldEarned += g;
      addFloat(m.x, m.y - 40, '+' + g, 'gold');
    } else {
      counter(m);
    }
  }
  if (phase !== 'dungeon') return;
  if (G.hp > 0 && G.monsters.length === 0) phase = 'roomClear';
}

function counter(m) {
  G.hp = Math.max(0, G.hp - m.atk);
  G.playerHit = 0.3;
  addFloat(PLAYER_X, PLAYER_Y - 90, '-' + m.atk, 'damage');
  if (G.hp <= 0) {
    G.loot = [];
    G.message = '倒下了, 今天抓的都跑了';
    G.msgT = 5;
    G.monsters = [];
    enterPlace(true);
  }
}

function enterPlace(fell) {
  if (!fell) {
    for (var i = 0; i < G.loot.length; i++) G.tray.push(G.loot[i]);
    G.loot = [];
    G.message = ''; G.msgT = 0;
  }
  G.sel = -1;
  phase = 'place';
}

function deeper() {
  G.depth++;
  spawnRoom();
  phase = 'dungeon';
}

/* ---------- 擺放 ---------- */
function trayPos(i) {
  var n = G.tray.length, step = Math.min(100, 660 / Math.max(1, n));
  return { x: 360 + (i - (n - 1) / 2) * step, y: 1080, step: step };
}

function startShow() {
  for (var i = 0; i < 4; i++) {
    var c = G.cages[i];
    c.broken = false; c.calm = 0; c.eff = 99; c.perfT = 0;
    if (c.mon) c.mon.rage = 30;
  }
  G.loose = [];
  for (i = 0; i < 6; i++) { var v = G.visitors[i]; v.present = true; v.back = 0; v.scaredT = 0; }
  G.timeLeft = SHOW_TIME; G.floats = []; G.message = ''; G.msgT = 0;
  phase = 'show';
}

/* ---------- 開園 ---------- */
function updateShow(dt) {
  G.timeLeft -= dt;
  var i, c;
  for (i = 0; i < 4; i++) {
    c = G.cages[i];
    c.calm = Math.max(0, c.calm - dt);
    c.eff += dt;
    var m = c.mon;
    if (!m) continue;
    m.rage += SPECIES[m.species].rage * STAR_RAGE[m.star] * dt;
    if (m.rage >= 100) { breakOut(i); continue; }
    var tier = tierOf(m.rage);
    if (tier === 'none') { c.perfT = 0; continue; }
    c.perfT += dt;
    var itv = tier === 'show' ? 3 : 2;
    if (c.perfT >= itv) {
      c.perfT -= itv;
      var gold = SPECIES[m.species].gold * STAR_GOLD[m.star] * (1 + G.rep / 100);
      if (tier === 'frenzy') gold *= 2;
      gold = Math.round(gold);
      var rep = tier === 'frenzy' ? m.star * 2 : m.star;
      G.gold += gold; G.goldEarned += gold; addRep(rep);
      c.eff = 0; c.effTier = tier;
      var p = CAGE_POS[i];
      addFloat(p[0], p[1] - 90, '+' + gold, 'gold');
      addFloat(p[0] + 70, p[1] - 130, '名聲+' + rep, 'repUp');
    }
  }
  // 逃脫魔物
  for (i = G.loose.length - 1; i >= 0; i--) {
    var L = G.loose[i];
    L.hit = Math.max(0, L.hit - dt);
    L.atkCd -= dt;
    var best = null, bd = 1e9;
    for (var j = 0; j < 6; j++) {
      var v = G.visitors[j];
      if (!v.present) continue;
      var d = Math.hypot(v.x - L.x, v.y - L.y);
      if (d < bd) { bd = d; best = v; }
    }
    if (best) {
      if (bd > 50) {
        var s = Math.min(bd - 50, 120 * dt);
        L.x += (best.x - L.x) / bd * s; L.y += (best.y - L.y) / bd * s;
      }
      if (Math.hypot(best.x - L.x, best.y - L.y) <= 55 && L.atkCd <= 0) {
        L.atkCd = 2;
        best.present = false; best.scaredT = 0.6; best.back = 3;
        var loss = 3 * L.mon.star;
        addRep(-loss);
        addFloat(best.x, best.y - 70, '名聲-' + loss, 'repDown');
      }
    }
  }
  for (i = 0; i < 6; i++) {
    var vv = G.visitors[i];
    if (vv.scaredT > 0) vv.scaredT -= dt;
    if (!vv.present && vv.back > 0) { vv.back -= dt; if (vv.back <= 0) { vv.present = true; vv.scaredT = 0; } }
  }
  G.message = G.loose.length ? '點牠 3 下抓回' : '';
  if (G.timeLeft <= 0) endShow();
}

function breakOut(i) {
  var c = G.cages[i], p = CAGE_POS[i];
  G.loose.push({ mon: c.mon, cage: i, x: p[0], y: p[1], hits: 3, hit: 0, atkCd: 2 });
  c.mon = null; c.broken = true; c.perfT = 0;
}

function recapture(L) {
  var c = G.cages[L.cage];
  L.mon.rage = 20; c.mon = L.mon; c.broken = false; c.perfT = 0;
  G.loose.splice(G.loose.indexOf(L), 1);
}

function endShow() {
  for (var i = G.loose.length - 1; i >= 0; i--) {
    var L = G.loose[i];
    addRep(-5);
    L.mon.rage = 20;
    G.cages[L.cage].mon = L.mon;
  }
  G.loose = [];
  for (i = 0; i < 4; i++) G.cages[i].broken = false;
  G.message = '';
  if (G.day >= DAYS) {
    G.stars = G.rep >= 200 ? 3 : (G.rep >= 120 ? 2 : (G.rep >= 60 ? 1 : 0));
    phase = 'result';
  } else {
    phase = 'shop';
  }
}

/* ---------- 商店 ---------- */
function buy(i) {
  var s = G.shop[i];
  if (G.gold < s.cost) return;
  G.gold -= s.cost;
  if (s.id === 'weapon') G.atk += 3;
  else if (s.id === 'armor') G.maxHp += 15;
  else if (s.id === 'netBag') G.netMax += 1;
  else if (s.id === 'goodNet') G.netBonus += 0.1;
  s.level++;
  s.cost = Math.round(s.cost * 1.5);
}

/* ---------- 說明頁 ---------- */
var GUIDE = [
  ['目標', '經營三天, 衝高名聲'],
  ['地下城戰鬥', '選重擊或輕擊, 再點魔物'],
  ['捕獲', '血越少越好抓, 打死就沒了'],
  ['深入或撤退', '越深越稀有, 倒下全丟光'],
  ['怒氣與表演', '怒氣越高, 表演越賺'],
  ['安撫與失控', '點籠子安撫, 滿了會失控']
];
var GUIDE_BTN = { x: 590, y: 124, w: 120, h: 32 };
var BACK_AREA = { x: 0, y: 1130, w: 260, h: 150 };

function inRect(px, py, r) { return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; }

function openGuide() { guideOpen = true; guidePage = 0; guideFrom = 'game'; }

function guideClick(x, y) {
  if (guidePage > 0 && inRect(x, y, BACK_AREA)) { guidePage--; return; }
  if (guidePage < GUIDE.length - 1) { guidePage++; return; }
  guideOpen = false;
  if (guideFrom === 'start') { guideFrom = 'game'; startDay(); }
}

/* ---------- 輸入(只用滑鼠) ---------- */
var BTN = {
  heavy: { x: 20, y: 1060, w: 220, h: 80 },
  light: { x: 250, y: 1060, w: 220, h: 80 },
  net:   { x: 480, y: 1060, w: 220, h: 80 },
  retreat: { x: 20, y: 1160, w: 330, h: 100 },
  deeper:  { x: 370, y: 1160, w: 330, h: 100 },
  open:  { x: 210, y: 1160, w: 300, h: 100 },
  go:    { x: 210, y: 1160, w: 300, h: 100 }
};

function onDown(e) {
  var r = canvas.getBoundingClientRect();
  var x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
  if (e.button !== undefined && e.button !== 0) return;
  e.preventDefault();
  if (guideOpen) { guideClick(x, y); return; }
  if (phase !== 'result' && inRect(x, y, GUIDE_BTN)) { openGuide(); return; }
  var i;
  if (phase === 'dungeon' || phase === 'roomClear') {
    if (inRect(x, y, BTN.retreat)) { enterPlace(false); return; }
    if (phase === 'roomClear') {
      if (inRect(x, y, BTN.deeper)) deeper();
      return;
    }
    if (inRect(x, y, BTN.heavy)) { setMode('heavy'); return; }
    if (inRect(x, y, BTN.light)) { setMode('light'); return; }
    if (inRect(x, y, BTN.net)) { setMode('net'); return; }
    for (i = G.monsters.length - 1; i >= 0; i--) {
      var m = G.monsters[i];
      if (Math.abs(x - m.x) <= 80 && Math.abs(y - m.y) <= 80) { clickMonster(m); return; }
    }
  } else if (phase === 'place') {
    if (inRect(x, y, BTN.open)) { startShow(); return; }
    for (i = 0; i < 4; i++) {
      var p = CAGE_POS[i];
      if (Math.abs(x - p[0]) <= 150 && Math.abs(y - p[1]) <= 140) {
        var c = G.cages[i];
        if (c.mon) { G.tray.push({ species: c.mon.species, star: c.mon.star }); c.mon = null; G.msgT = 0; G.message = ''; }
        else if (G.sel >= 0) {
          var t = G.tray.splice(G.sel, 1)[0];
          c.mon = { species: t.species, star: t.star, rage: 0 };
          G.sel = -1; G.msgT = 0; G.message = '';
        }
        return;
      }
    }
    for (i = 0; i < G.tray.length; i++) {
      var tp = trayPos(i);
      if (Math.abs(x - tp.x) <= tp.step / 2 && Math.abs(y - tp.y) <= 50) { G.sel = (G.sel === i) ? -1 : i; return; }
    }
  } else if (phase === 'show') {
    for (i = 0; i < G.loose.length; i++) {
      var L = G.loose[i];
      if (Math.hypot(x - L.x, y - L.y) <= 65) {
        L.hits--; L.hit = 0.2;
        if (L.hits <= 0) recapture(L);
        return;
      }
    }
    for (i = 0; i < 4; i++) {
      var q = CAGE_POS[i], cg = G.cages[i];
      if (cg.mon && Math.abs(x - q[0]) <= 150 && Math.abs(y - q[1]) <= 140) {
        cg.mon.rage = Math.max(0, cg.mon.rage - 25);
        cg.calm = 0.3;
        addFloat(q[0], q[1] - 40, '-25', 'rage');
        return;
      }
    }
  } else if (phase === 'shop') {
    if (inRect(x, y, BTN.go)) { G.day++; startDay(); return; }
    for (i = 0; i < 4; i++) {
      if (Math.abs(x - 360) <= 300 && Math.abs(y - SHOP_Y[i]) <= 70) { buy(i); return; }
    }
  } else if (phase === 'result') {
    resetAll(); startDay();
  }
}
canvas.addEventListener('mousedown', onDown);
canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

/* ---------- 更新 ---------- */
function update(dt) {
  clockT += dt;
  if (guideOpen) return;
  var i;
  if (G.msgT > 0) { G.msgT -= dt; if (G.msgT <= 0) G.message = ''; }
  G.playerHit = Math.max(0, G.playerHit - dt);
  for (i = 0; i < G.monsters.length; i++) G.monsters[i].hit = Math.max(0, G.monsters[i].hit - dt);
  for (i = G.floats.length - 1; i >= 0; i--) { G.floats[i].t += dt; if (G.floats[i].t > 1) G.floats.splice(i, 1); }
  for (i = G.nets_fx.length - 1; i >= 0; i--) { G.nets_fx[i].t += dt; if (G.nets_fx[i].t > 0.6) G.nets_fx.splice(i, 1); }
  if (phase === 'show') updateShow(dt);
}

/* ---------- 繪製 ---------- */
function text(str, x, y, size, color, align) {
  ctx.font = 'bold ' + size + 'px "Microsoft JhengHei", "PingFang TC", sans-serif';
  ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function drawGuide() {
  Art.drawBackground(ctx, {});
  text(guidePage + 1 + ' / ' + GUIDE.length, 360, 60, 32, '#fff');
  text(GUIDE[guidePage][0], 360, 140, 56, '#ffe9a0');
  Art.drawGuidePage(ctx, { page: guidePage, x: 60, y: 220, w: 600, h: 640 });
  text(GUIDE[guidePage][1], 360, 940, 44, '#fff');
  var last = guidePage === GUIDE.length - 1;
  text(last ? (guideFrom === 'start' ? '點畫面開始遊戲' : '點畫面回到遊戲') : '點畫面繼續', 360, 1060, 30, '#ddd');
  if (guidePage > 0) text('◀ 點左下角回上一頁', 20, 1230, 26, '#ffd27a', 'left');
}

function drawFloats() {
  for (var i = 0; i < G.floats.length; i++) Art.drawFloatText(ctx, G.floats[i]);
}

function hud(p) {
  Art.drawHud(ctx, {
    phase: p, day: G.day, gold: G.gold, rep: G.rep, hp: G.hp, maxHp: G.maxHp,
    nets: G.nets, netMax: G.netMax, timeLeft: Math.max(0, G.timeLeft), depth: G.depth,
    loot: G.loot.length, message: G.message
  });
}

function guideBtn() {
  Art.drawButton(ctx, { x: GUIDE_BTN.x, y: GUIDE_BTN.y, w: GUIDE_BTN.w, h: GUIDE_BTN.h, label: '說明', enabled: true, active: false });
}

function drawZoo() {
  var i, c, p;
  Art.drawZooGround(ctx, {});
  for (i = 0; i < 4; i++) {
    c = G.cages[i]; p = CAGE_POS[i];
    var m = c.mon;
    var rage = (m && phase === 'show') ? m.rage : 0;
    Art.drawCage(ctx, {
      x: p[0], y: p[1], species: m ? m.species : null, star: m ? m.star : 0,
      rage: rage, tier: tierOf(rage), calmFlash: c.calm, broken: c.broken,
      selected: !m && !c.broken && phase === 'place' && G.sel >= 0
    });
    if (m && phase === 'show' && c.eff < 0.8) {
      Art.drawShowEffect(ctx, { x: p[0], y: p[1], species: m.species, star: m.star, tier: c.effTier, t: c.eff });
    }
  }
  for (i = 0; i < 6; i++) {
    var v = G.visitors[i];
    if (v.present) Art.drawVisitor(ctx, { x: v.x, y: v.y, scared: false });
    else if (v.scaredT > 0) Art.drawVisitor(ctx, { x: v.x, y: v.y, scared: true });
  }
  for (i = 0; i < G.loose.length; i++) {
    var L = G.loose[i];
    Art.drawLooseMonster(ctx, { x: L.x, y: L.y, species: L.mon.species, star: L.mon.star, hitsLeft: L.hits, hit: L.hit });
  }
}

function drawTray() {
  for (var i = 0; i < G.tray.length; i++) {
    var t = G.tray[i], tp = trayPos(i);
    Art.drawTrayMonster(ctx, { x: tp.x, y: tp.y, species: t.species, star: t.star, selected: i === G.sel });
  }
}

function render() {
  if (guideOpen) { drawGuide(); return; }
  var i;
  if (phase === 'dungeon' || phase === 'roomClear') {
    Art.drawBackground(ctx, {});
    Art.drawDungeonRoom(ctx, { day: G.day, depth: G.depth });
    for (i = 0; i < G.monsters.length; i++) {
      var m = G.monsters[i];
      Art.drawMonster(ctx, { x: m.x, y: m.y, species: m.species, star: m.star, hp: m.hp, maxHp: m.maxHp, hit: m.hit, aimNet: G.mode === 'net' });
    }
    Art.drawPlayer(ctx, { x: PLAYER_X, y: PLAYER_Y, hp: G.hp, maxHp: G.maxHp, hit: G.playerHit });
    for (i = 0; i < G.nets_fx.length; i++) Art.drawNet(ctx, G.nets_fx[i]);
    drawFloats();
    if (phase === 'dungeon') {
      var md = ['heavy', 'light', 'net'], lb = { heavy: '重擊', light: '輕擊', net: '捕獲網' };
      for (i = 0; i < 3; i++) {
        var k = md[i], b = BTN[k];
        Art.drawButton(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, label: lb[k], enabled: k !== 'net' || G.nets > 0, active: G.mode === k });
      }
    }
    Art.drawButton(ctx, { x: BTN.retreat.x, y: BTN.retreat.y, w: BTN.retreat.w, h: BTN.retreat.h, label: '撤退回園', enabled: true, active: false });
    if (phase === 'roomClear') Art.drawButton(ctx, { x: BTN.deeper.x, y: BTN.deeper.y, w: BTN.deeper.w, h: BTN.deeper.h, label: '深入一層', enabled: true, active: false });
    hud(phase);
    guideBtn();
  } else if (phase === 'place' || phase === 'show') {
    Art.drawBackground(ctx, {});
    drawZoo();
    drawTray();
    drawFloats();
    if (phase === 'place') {
      Art.drawButton(ctx, { x: BTN.open.x, y: BTN.open.y, w: BTN.open.w, h: BTN.open.h, label: '開園', enabled: true, active: false });
      var save = G.message;
      if (!G.message) G.message = '點魔物, 再點空籠子';
      hud('place');
      G.message = save;
    } else hud('show');
    guideBtn();
  } else if (phase === 'shop') {
    Art.drawBackground(ctx, {});
    Art.drawZooGround(ctx, {});
    for (i = 0; i < 4; i++) {
      var s = G.shop[i];
      Art.drawShopItem(ctx, { x: 360, y: SHOP_Y[i], item: s.id, level: s.level, cost: s.cost, affordable: G.gold >= s.cost });
    }
    Art.drawButton(ctx, { x: BTN.go.x, y: BTN.go.y, w: BTN.go.w, h: BTN.go.h, label: '出發', enabled: true, active: false });
    hud('shop');
    guideBtn();
  } else if (phase === 'result') {
    Art.drawBackground(ctx, {});
    Art.drawResultPanel(ctx, { rep: G.rep, goldEarned: G.goldEarned, maxDepth: G.maxDepth, bestStar: G.bestStar, stars: G.stars });
    text('點畫面重來', 360, 1180, 40, '#fff');
  }
}

/* ---------- 主迴圈 ---------- */
resetAll();
var last = 0;
function frame(ts) {
  var dt = last ? (ts - last) / 1000 : 0;
  last = ts;
  if (dt > 1 / 30) dt = 1 / 30;
  if (dt < 0) dt = 0;
  try { update(dt); render(); } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

})();
