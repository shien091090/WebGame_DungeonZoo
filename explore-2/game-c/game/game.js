// 人潮閘門動物園 — 玩法驗證 Demo。邏輯與繪製分離: update 改狀態, render 呼叫 Art。
(function () {
  'use strict';

  var W = Art.canvas.width, H = Art.canvas.height;
  var FONT = "'Microsoft JhengHei','PingFang TC',sans-serif";

  // ===== 數值表 =====
  var CFG = {
    days: 3, cols: 7, rows: 9, cell: 96, gx: 24, gy: 160, walls: 6,
    playerHp: 12, playerAtk: 2, traps: 3, tiredRatio: 0.5, killGold: 4,
    zoneMax: 2, openTime: 60, spawnGap: 1.5, walkSpeed: 140, scaredSpeed: 320, watchTime: 8,
    plazaMax: 12, startRage: 20, rageDrop: 5, performRage: 40, performGap: 2.5,
    calmTime: 4, calmRage: 30, scareGap: 1, looseRep: 2, endLooseRep: 5,
    stars: [60, 150, 250], priceMul: 1.5
  };
  var SPECIES = {
    fire:    { hp: 6,  atk: 2, rage: 1.0, gold: 5 },
    water:   { hp: 4,  atk: 1, rage: 0.7, gold: 3 },
    thunder: { hp: 6,  atk: 2, rage: 1.5, gold: 8 },
    stone:   { hp: 10, atk: 3, rage: 0.5, gold: 4 }
  };
  var SPECIES_LIST = ['fire', 'water', 'thunder', 'stone'];
  var ZONE_X = [130, 360, 590];
  var ITEMS = [
    { id: 'armor', base: 40, y: 300 }, { id: 'claw', base: 50, y: 460 },
    { id: 'trapBag', base: 40, y: 620 }, { id: 'promo', base: 60, y: 780 }
  ];
  var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  var GUIDE = [
    ['地下城', '方向鍵走一格, 撞魔物就是攻擊'],
    ['捕獲', '空白鍵放夾子, 疲憊的才夾得住'],
    ['擺放', '方向鍵把魔物放進展區'],
    ['閘門', '← ↓ → 開關三道閘門'],
    ['人潮與怒氣', '看的人越多, 魔物越氣'],
    ['一天的流程', '三天後依名聲評星']
  ];

  // ===== 佔位圖形(style.md / interface.json 沒有的東西) =====
  var Placeholder = {
    // 候展區放不下時顯示「+N」
    trayMore: function (ctx, n) {
      ctx.save();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 28px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+' + n, 690, 1100);
      ctx.restore();
    }
  };

  // ===== 狀態 =====
  var G = {};

  function resetAll() {
    G.day = 1; G.floor = 1; G.gold = 0; G.goldEarned = 0; G.rep = 0;
    G.up = { armor: 0, claw: 0, trapBag: 0, promo: 0 };
    G.cost = { armor: 40, claw: 50, trapBag: 40, promo: 60 };
    G.zones = [[], [], []]; G.tray = []; G.sel = 1;
    G.floats = []; G.shopSel = 0;
    G.map = null; G.monsters = []; G.trapList = [];
    G.pl = { c: 3, r: 8, hp: 12, hitT: 0, atkT: 0, atkDir: null };
    G.open = null;
    startDay();
  }
  function maxHp() { return CFG.playerHp + 4 * G.up.armor; }
  function atk() { return CFG.playerAtk + G.up.claw; }
  function trapMax() { return CFG.traps + G.up.trapBag; }

  function startDay() {
    G.phase = 'dungeon';
    G.floor = 1;
    G.pl.hp = maxHp(); G.traps = trapMax();
    genFloor();
  }

  // ===== 地下城 =====
  function cx(c) { return CFG.gx + c * CFG.cell + CFG.cell / 2; }
  function cy(r) { return CFG.gy + r * CFG.cell + CFG.cell / 2; }
  function inB(c, r) { return c >= 0 && c < CFG.cols && r >= 0 && r < CFG.rows; }
  function isWall(c, r) { return G.map.walls.some(function (w) { return w[0] === c && w[1] === r; }); }
  function isStairs(c, r) { return G.map.stairs[0] === c && G.map.stairs[1] === r; }
  function monAt(c, r) { for (var i = 0; i < G.monsters.length; i++) if (G.monsters[i].c === c && G.monsters[i].r === r) return G.monsters[i]; return null; }
  function trapAt(c, r) { for (var i = 0; i < G.trapList.length; i++) { var t = G.trapList[i]; if (t.mode === 'set' && t.c === c && t.r === r) return t; } return null; }
  function ri(n) { return Math.floor(Math.random() * n); }

  function hasPath(walls, stairs) {
    var seen = {}, q = [[3, 8]]; seen['3,8'] = 1;
    function w(c, r) { return walls.some(function (a) { return a[0] === c && a[1] === r; }); }
    while (q.length) {
      var p = q.shift();
      if (p[0] === stairs[0] && p[1] === stairs[1]) return true;
      for (var k in DIRS) {
        var nc = p[0] + DIRS[k][0], nr = p[1] + DIRS[k][1], key = nc + ',' + nr;
        if (inB(nc, nr) && !seen[key] && !w(nc, nr)) { seen[key] = 1; q.push([nc, nr]); }
      }
    }
    return false;
  }

  function genFloor() {
    var walls, stairs;
    do {
      stairs = [ri(CFG.cols), 0];
      walls = [];
      while (walls.length < CFG.walls) {
        var c = ri(CFG.cols), r = ri(CFG.rows);
        if ((c === 3 && r === 8) || (c === stairs[0] && r === stairs[1])) continue;
        if (walls.some(function (a) { return a[0] === c && a[1] === r; })) continue;
        walls.push([c, r]);
      }
    } while (!hasPath(walls, stairs));
    G.map = { walls: walls, stairs: stairs };
    G.trapList = [];
    G.monsters = [];
    var n = G.day === 1 ? 3 : 4;
    while (G.monsters.length < n) {
      var mc = ri(CFG.cols), mr = ri(5);
      if (isWall(mc, mr) || isStairs(mc, mr) || monAt(mc, mr)) continue;
      var sp = SPECIES_LIST[ri(4)];
      var hp = SPECIES[sp].hp + 2 * (G.day - 1);
      G.monsters.push({ sp: sp, c: mc, r: mr, hp: hp, maxHp: hp, stunned: false, tick: 0, hitT: 0, atkT: 0, atkDir: null });
    }
    G.pl.c = 3; G.pl.r = 8; G.pl.hitT = 0; G.pl.atkT = 0; G.pl.atkDir = null;
  }

  function addFloat(x, y, text, kind) { G.floats.push({ x: x, y: y, text: text, kind: kind, t: 0 }); }
  function addRep(n, x, y) {
    var before = G.rep;
    G.rep = Math.max(0, G.rep + n);
    var d = G.rep - before;
    if (d !== 0 && x !== undefined) addFloat(x, y, (d > 0 ? '+' : '') + d, d > 0 ? 'repUp' : 'repDown');
    else if (d === 0 && n < 0 && x !== undefined) addFloat(x, y, String(n), 'repDown');
  }

  function dungeonKey(k) {
    if (DIRS[k]) {
      var p = G.pl, nc = p.c + DIRS[k][0], nr = p.r + DIRS[k][1];
      if (!inB(nc, nr) || isWall(nc, nr)) return;
      var m = monAt(nc, nr);
      if (m) {
        m.hp -= atk(); m.hitT = 0.2;
        p.atkT = 0.2; p.atkDir = k;
        if (m.hp <= 0) {
          G.monsters.splice(G.monsters.indexOf(m), 1);
          G.gold += CFG.killGold; G.goldEarned += CFG.killGold;
          addFloat(cx(m.c), cy(m.r) - 40, '+' + CFG.killGold, 'gold');
        }
        endTurn(); return;
      }
      p.c = nc; p.r = nr;
      if (isStairs(nc, nr)) {
        if (G.floor === 1) { G.floor = 2; genFloor(); }
        else finishDungeon();
        return;
      }
      endTurn();
    } else if (k === 'space') {
      if (G.traps > 0 && !trapAt(G.pl.c, G.pl.r)) {
        G.traps--;
        G.trapList.push({ c: G.pl.c, r: G.pl.r, mode: 'set', t: 0 });
        endTurn();
      }
    }
  }

  function endTurn() {
    var list = G.monsters.slice();
    for (var i = 0; i < list.length; i++) {
      if (G.monsters.indexOf(list[i]) < 0) continue;
      monsterAct(list[i]);
      if (G.pl.hp <= 0) { finishDungeon(); return; }
    }
  }

  function adjacent(m) { return Math.abs(m.c - G.pl.c) + Math.abs(m.r - G.pl.r) === 1; }
  function freeCell(c, r) { return inB(c, r) && !isWall(c, r) && !isStairs(c, r) && !monAt(c, r) && !(G.pl.c === c && G.pl.r === r); }

  function stepToward(m) {
    var dx = G.pl.c - m.c, dy = G.pl.r - m.r, ax = [];
    if (dy !== 0) ax.push({ d: Math.abs(dy), c: 0, r: Math.sign(dy) });
    if (dx !== 0) ax.push({ d: Math.abs(dx), c: Math.sign(dx), r: 0 });
    ax.sort(function (a, b) { return b.d - a.d; });
    for (var i = 0; i < ax.length; i++) {
      if (freeCell(m.c + ax[i].c, m.r + ax[i].r)) { m.c += ax[i].c; m.r += ax[i].r; return true; }
    }
    return false;
  }
  function stepRandom(m) {
    var opts = [];
    for (var k in DIRS) if (freeCell(m.c + DIRS[k][0], m.r + DIRS[k][1])) opts.push(DIRS[k]);
    if (!opts.length) return false;
    var d = opts[ri(opts.length)]; m.c += d[0]; m.r += d[1]; return true;
  }
  // 踩夾子; 回傳 true 表示行動中止
  function trapCheck(m) {
    var t = trapAt(m.c, m.r);
    if (!t) return false;
    if (m.hp * 2 <= m.maxHp) {
      t.mode = 'caught'; t.t = 0;
      G.monsters.splice(G.monsters.indexOf(m), 1);
      G.tray.push(m.sp);
    } else {
      t.mode = 'broken'; t.t = 0;
      m.stunned = true;
    }
    return true;
  }

  function monsterAct(m) {
    if (m.sp === 'stone') { m.tick++; if (m.tick % 2 !== 0) return; }
    if (m.stunned) { m.stunned = false; return; }
    if (adjacent(m)) { monsterAttack(m); return; }
    var steps = m.sp === 'thunder' ? 2 : 1;
    for (var i = 0; i < steps; i++) {
      var moved;
      if (m.sp === 'water' && Math.abs(m.c - G.pl.c) + Math.abs(m.r - G.pl.r) > 3) moved = stepRandom(m);
      else moved = stepToward(m);
      if (!moved) return;
      if (trapCheck(m)) return;
      if (adjacent(m)) return;
    }
  }
  function monsterAttack(m) {
    var dx = G.pl.c - m.c, dy = G.pl.r - m.r;
    m.atkDir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up'; m.atkT = 0.2;
    G.pl.hp = Math.max(0, G.pl.hp - SPECIES[m.sp].atk); G.pl.hitT = 0.2;
  }

  function finishDungeon() {
    G.phase = 'place';
    G.monsters = []; G.trapList = [];
    G.sel = 1;
  }

  // ===== 擺放 =====
  function placeKey(k) {
    if (k === 'left') G.sel = Math.max(0, G.sel - 1);
    else if (k === 'right') G.sel = Math.min(2, G.sel + 1);
    else if (k === 'up') {
      if (G.tray.length && G.zones[G.sel].length < CFG.zoneMax) G.zones[G.sel].push(G.tray.shift());
    } else if (k === 'down') {
      if (G.zones[G.sel].length) G.tray.unshift(G.zones[G.sel].pop());
    } else if (k === 'enter') startOpen();
  }

  // ===== 開園 =====
  function startOpen() {
    G.phase = 'open';
    var o = G.open = { time: CFG.openTime, spawnT: 0.5, seq: 0, gates: [true, true, true], visitors: [], zoo: [], zone: [] };
    for (var z = 0; z < 3; z++) {
      o.zone.push({ calmT: 0, scareT: 0, viewers: 0 });
      for (var i = 0; i < G.zones[z].length; i++) {
        o.zoo.push({ z: z, i: i, n: G.zones[z].length, sp: G.zones[z][i], rage: CFG.startRage, loose: false, cd: CFG.performGap, perfT: 99 });
      }
    }
  }
  function zooPos(m) { return { x: m.n === 2 ? ZONE_X[m.z] + (m.i === 0 ? -50 : 50) : ZONE_X[m.z], y: 340 }; }

  function openKey(k) {
    if (k === 'left') G.open.gates[0] = !G.open.gates[0];
    else if (k === 'down') G.open.gates[1] = !G.open.gates[1];
    else if (k === 'right') G.open.gates[2] = !G.open.gates[2];
  }

  function spawnVisitor(o) {
    var tx = 90 + Math.random() * 540, ty = 820 + Math.random() * 160;
    o.visitors.push({ x: 360, y: 1180, st: 'in', tx: tx, ty: ty, zone: -1, variant: ri(4), t: 0, arrive: 0 });
  }
  function moveTo(v, tx, ty, dt, sp) {
    var dx = tx - v.x, dy = ty - v.y, d = Math.sqrt(dx * dx + dy * dy), s = sp * dt;
    if (d <= s) { v.x = tx; v.y = ty; return true; }
    v.x += dx / d * s; v.y += dy / d * s; return false;
  }
  function pickGate(o) {
    var open = [];
    for (var z = 0; z < 3; z++) if (o.gates[z]) open.push(z);
    return open.length ? open[ri(open.length)] : -1;
  }

  function updateVisitor(o, v, dt) {
    var sp = CFG.walkSpeed;
    switch (v.st) {
      case 'in': if (moveTo(v, v.tx, v.ty, dt, sp)) { v.st = 'idle'; v.arrive = ++o.seq; } break;
      case 'idle':
        var z = pickGate(o);
        if (z >= 0) { v.zone = z; v.st = 'gate'; }
        break;
      case 'gate':
        if (!o.gates[v.zone]) { var z2 = pickGate(o); if (z2 >= 0) v.zone = z2; else { v.st = 'idle'; break; } }
        if (moveTo(v, ZONE_X[v.zone], 760, dt, sp)) {
          v.st = 'view';
          v.tx = ZONE_X[v.zone] - 85 + Math.random() * 170; v.ty = 540 + Math.random() * 170;
        }
        break;
      case 'view': if (moveTo(v, v.tx, v.ty, dt, sp)) { v.st = 'watch'; v.t = CFG.watchTime; } break;
      case 'watch': v.t -= dt; if (v.t <= 0) v.st = 'exit'; break;
      case 'exit': if (moveTo(v, v.x, 520, dt, sp)) v.dead = true; break;
      case 'scared':
        var tx = v.x < 360 ? -40 : 760;
        if (moveTo(v, tx, v.y + 60, dt, CFG.scaredSpeed)) v.dead = true; break;
      case 'leave': if (moveTo(v, 360, 1190, dt, sp)) v.dead = true; break;
    }
  }

  function updateOpen(dt) {
    var o = G.open;
    o.time -= dt;
    o.spawnT -= dt;
    var gap = CFG.spawnGap / (1 + 0.25 * G.up.promo);
    while (o.spawnT <= 0) { spawnVisitor(o); o.spawnT += gap; }

    for (var i = 0; i < o.visitors.length; i++) updateVisitor(o, o.visitors[i], dt);
    o.visitors = o.visitors.filter(function (v) { return !v.dead; });

    // 廣場等待上限
    var waiting = o.visitors.filter(function (v) { return v.st === 'idle'; });
    if (waiting.length > CFG.plazaMax) {
      var first = waiting[0];
      waiting.forEach(function (v) { if (v.arrive < first.arrive) first = v; });
      first.st = 'leave';
      addRep(-1, first.x, first.y - 40);
    }

    // 觀看人數
    var z;
    for (z = 0; z < 3; z++) o.zone[z].viewers = 0;
    o.visitors.forEach(function (v) { if (v.st === 'watch') o.zone[v.zone].viewers++; });

    // 魔物怒氣 / 表演 / 失控
    o.zoo.forEach(function (m) {
      var zs = o.zone[m.z], pos = zooPos(m);
      m.perfT += dt;
      if (m.loose) { m.rage = 100; return; }
      if (zs.viewers > 0) m.rage += zs.viewers * 1.0 * SPECIES[m.sp].rage * dt;
      else m.rage -= CFG.rageDrop * dt;
      m.rage = Math.max(0, Math.min(100, m.rage));
      if (m.rage >= 100) { m.loose = true; zs.scareT = 0; return; }
      if (m.rage >= CFG.performRage) {
        m.cd -= dt;
        if (m.cd <= 0) {
          m.cd += CFG.performGap; m.perfT = 0;
          var g = Math.round(SPECIES[m.sp].gold * (1 + 0.2 * zs.viewers) * (1 + G.rep / 100));
          G.gold += g; G.goldEarned += g;
          addFloat(pos.x, pos.y - 60, '+' + g, 'gold');
          if (zs.viewers >= 1) addRep(1, pos.x + 30, pos.y - 90);
        }
      } else m.cd = CFG.performGap;
    });
    // 每區失控處理
    for (z = 0; z < 3; z++) {
      var zs = o.zone[z], anyLoose = o.zoo.some(function (m) { return m.z === z && m.loose; });
      if (!anyLoose) { zs.calmT = 0; zs.scareT = 0; continue; }
      if (zs.viewers === 0) zs.calmT += dt; else zs.calmT = 0;
      if (zs.calmT >= CFG.calmTime) {
        o.zoo.forEach(function (m) { if (m.z === z && m.loose) { m.loose = false; m.rage = CFG.calmRage; m.cd = CFG.performGap; } });
        zs.calmT = 0; zs.scareT = 0; continue;
      }
      zs.scareT += dt;
      if (zs.scareT >= CFG.scareGap) {
        var cand = o.visitors.filter(function (v) { return v.st === 'watch' && v.zone === z; });
        if (cand.length) {
          var v = cand[ri(cand.length)];
          v.st = 'scared';
          addRep(-CFG.looseRep, v.x, v.y - 40);
          zs.scareT -= CFG.scareGap;
        } else zs.scareT = CFG.scareGap;
      }
    }

    if (o.time <= 0) endOpen();
  }

  function endOpen() {
    var o = G.open;
    o.zoo.forEach(function (m) { if (m.loose) { var p = zooPos(m); addRep(-CFG.endLooseRep, p.x, p.y - 60); } });
    G.open = null;
    if (G.day >= CFG.days) G.phase = 'result';
    else { G.phase = 'shop'; G.shopSel = 0; }
  }

  // ===== 商店 =====
  function shopKey(k) {
    if (k === 'up') G.shopSel = (G.shopSel + 3) % 4;
    else if (k === 'down') G.shopSel = (G.shopSel + 1) % 4;
    else if (k === 'space') {
      var id = ITEMS[G.shopSel].id;
      if (G.gold >= G.cost[id]) {
        G.gold -= G.cost[id];
        G.cost[id] = Math.round(G.cost[id] * CFG.priceMul);
        G.up[id]++;
      }
    } else if (k === 'enter') { G.day++; startDay(); }
  }

  // ===== 輸入(只有鍵盤) =====
  var guide = { page: 0, ret: null };
  function openGuide(ret) { guide.page = 0; guide.ret = ret; G.phase = 'guide'; }

  function onKey(k) {
    switch (G.phase) {
      case 'guide':
        if (k === 'enter') {
          if (guide.page < GUIDE.length - 1) guide.page++;
          else { G.phase = guide.ret; if (G.phase === 'start') resetAll(); }
        } else if (k === 'left') guide.page = Math.max(0, guide.page - 1);
        else if (k === 'right') guide.page = Math.min(GUIDE.length - 1, guide.page + 1);
        else if (k === 'help' && guide.ret !== 'start') G.phase = guide.ret;
        break;
      case 'dungeon': if (k === 'help') openGuide('dungeon'); else dungeonKey(k); break;
      case 'place': if (k === 'help') openGuide('place'); else placeKey(k); break;
      case 'open': if (k === 'help') openGuide('open'); else openKey(k); break;
      case 'shop': if (k === 'help') openGuide('shop'); else shopKey(k); break;
      case 'result': if (k === 'enter') resetAll(); break;
    }
  }
  var KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', ' ': 'space', Enter: 'enter', h: 'help', H: 'help' };
  window.addEventListener('keydown', function (e) {
    var k = KEYMAP[e.key];
    if (!k) return;
    e.preventDefault();
    if (e.repeat) return;
    onKey(k);
  });

  // ===== 更新 =====
  function update(dt) {
    var i;
    for (i = G.floats.length - 1; i >= 0; i--) { G.floats[i].t += dt; if (G.floats[i].t > 1.2) G.floats.splice(i, 1); }
    if (G.phase === 'dungeon') {
      var p = G.pl;
      p.hitT = Math.max(0, p.hitT - dt); p.atkT = Math.max(0, p.atkT - dt);
      G.monsters.forEach(function (m) { m.hitT = Math.max(0, m.hitT - dt); m.atkT = Math.max(0, m.atkT - dt); });
    }
    if (G.phase === 'dungeon' || G.phase === 'place') {
      for (i = G.trapList.length - 1; i >= 0; i--) {
        var t = G.trapList[i]; t.t += dt;
        if (t.mode !== 'set' && t.t >= 0.5) G.trapList.splice(i, 1);
      }
    }
    if (G.phase === 'open') updateOpen(dt);
  }

  // ===== 繪製 =====
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  function resize() {
    var s = Math.min(window.innerWidth / W, window.innerHeight / H);
    var cssW = Math.floor(W * s), cssH = Math.floor(H * s);
    var dpr = window.devicePixelRatio || 1;
    canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
  }
  window.addEventListener('resize', resize);
  resize();

  function hudState(msg) {
    var o = G.open, waiting = 0;
    if (o) waiting = o.visitors.filter(function (v) { return v.st === 'idle'; }).length;
    return {
      phase: G.phase, day: G.day, floor: G.floor, gold: G.gold, rep: G.rep,
      hp: G.pl.hp, maxHp: maxHp(), traps: G.traps || 0, trapMax: trapMax(),
      timeLeft: o ? Math.max(0, Math.ceil(o.time)) : 0, plazaCount: waiting, plazaMax: CFG.plazaMax, message: msg
    };
  }
  function drawFloats() {
    G.floats.forEach(function (f) { Art.drawFloatText(ctx, { x: f.x, y: f.y, text: f.text, kind: f.kind, t: f.t }); });
  }

  function renderDungeon() {
    Art.drawDungeonFloor(ctx, { day: G.day, floor: G.floor });
    G.map.walls.forEach(function (w) { Art.drawWall(ctx, { x: cx(w[0]), y: cy(w[1]) }); });
    Art.drawStairs(ctx, { x: cx(G.map.stairs[0]), y: cy(G.map.stairs[1]) });
    G.trapList.forEach(function (t) { Art.drawTrap(ctx, { x: cx(t.c), y: cy(t.r), mode: t.mode, t: t.t }); });
    G.monsters.forEach(function (m) {
      Art.drawMonster(ctx, {
        x: cx(m.c), y: cy(m.r), species: m.sp, hp: m.hp, maxHp: m.maxHp,
        tired: m.hp * 2 <= m.maxHp, stunned: m.stunned, hit: m.hitT > 0, attackDir: m.atkT > 0 ? m.atkDir : null
      });
    });
    var p = G.pl;
    Art.drawPlayer(ctx, { x: cx(p.c), y: cy(p.r), hp: p.hp, maxHp: maxHp(), hit: p.hitT > 0, attackDir: p.atkT > 0 ? p.atkDir : null });
    drawFloats();
    Art.drawHud(ctx, hudState('走到樓梯前往下一層'));
  }

  function drawZooBase(placing) {
    Art.drawZooMap(ctx, {});
    var o = G.open;
    for (var z = 0; z < 3; z++) {
      var broken = !!o && o.zoo.some(function (m) { return m.z === z && m.loose; });
      Art.drawEnclosure(ctx, { x: ZONE_X[z], y: 340, zone: z, selected: placing && G.sel === z, broken: broken });
    }
    if (o) {
      o.zoo.forEach(function (m) {
        var p = zooPos(m);
        Art.drawZooMonster(ctx, { x: p.x, y: p.y, species: m.sp, rage: m.rage, performing: m.perfT < 0.5, loose: m.loose });
      });
    } else {
      for (z = 0; z < 3; z++) G.zones[z].forEach(function (sp, i) {
        var n = G.zones[z].length;
        Art.drawZooMonster(ctx, { x: n === 2 ? ZONE_X[z] + (i === 0 ? -50 : 50) : ZONE_X[z], y: 340, species: sp, rage: CFG.startRage, performing: false, loose: false });
      });
    }
    for (z = 0; z < 3; z++) Art.drawGate(ctx, { x: ZONE_X[z], y: 760, zone: z, open: o ? o.gates[z] : true });
    if (o) {
      o.visitors.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (v) {
        var mode = v.st === 'idle' ? 'wait' : v.st === 'watch' ? 'watch' : v.st === 'scared' ? 'scared' : 'walk';
        Art.drawVisitor(ctx, { x: v.x, y: v.y, mode: mode, variant: v.variant });
      });
    }
  }

  function renderPlace() {
    drawZooBase(true);
    var shown = Math.min(G.tray.length, 7);
    for (var i = 0; i < shown; i++) {
      Art.drawTrayMonster(ctx, { x: 70 + i * 100, y: 1100, species: G.tray[i], first: i === 0 });
    }
    if (G.tray.length > shown) Placeholder.trayMore(ctx, G.tray.length - shown);
    drawFloats();
    Art.drawHud(ctx, hudState('←→選區 ↑放入 ↓取回 Enter開園'));
  }

  function renderOpen() {
    drawZooBase(false);
    drawFloats();
    var loose = G.open.zoo.some(function (m) { return m.loose; });
    Art.drawHud(ctx, hudState(loose ? '把人潮導開, 牠才會冷靜' : ''));
  }

  function renderShop() {
    ITEMS.forEach(function (it, i) {
      Art.drawShopItem(ctx, {
        x: 360, y: it.y, item: it.id, level: G.up[it.id], cost: G.cost[it.id],
        affordable: G.gold >= G.cost[it.id], selected: G.shopSel === i
      });
    });
    drawFloats();
    Art.drawHud(ctx, hudState('↑↓選 空白鍵買 Enter出發'));
  }

  function renderResult() {
    var stars = 0;
    CFG.stars.forEach(function (t) { if (G.rep >= t) stars++; });
    Art.drawResultPanel(ctx, { rep: G.rep, goldEarned: G.goldEarned, stars: stars });
    Art.drawHud(ctx, hudState('按 Enter 重來'));
  }

  function renderGuide() {
    var pg = guide.page, last = pg === GUIDE.length - 1;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(20, 20, 680, 1240);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 52px ' + FONT;
    ctx.fillText('人潮閘門動物園', 360, 70);
    ctx.font = 'bold 44px ' + FONT;
    ctx.fillText('第 ' + (pg + 1) + ' 頁  ' + GUIDE[pg][0], 360, 140);
    ctx.restore();
    Art.drawGuidePage(ctx, { page: pg + 1, x: 40, y: 190, w: 640, h: 700 });
    ctx.save();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 40px ' + FONT;
    ctx.fillText(GUIDE[pg][1], 360, 960);
    ctx.font = '30px ' + FONT;
    ctx.fillText((pg + 1) + ' / ' + GUIDE.length, 360, 1090);
    ctx.fillText(last ? '按 Enter 開始' : '按 Enter 繼續', 360, 1160);
    ctx.font = '24px ' + FONT;
    ctx.fillText(pg > 0 ? '← 上一頁' : '', 360, 1210);
    ctx.restore();
  }

  function render() {
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    Art.drawBackground(ctx, {});
    switch (G.phase) {
      case 'guide': renderGuide(); break;
      case 'dungeon': renderDungeon(); break;
      case 'place': renderPlace(); break;
      case 'open': renderOpen(); break;
      case 'shop': renderShop(); break;
      case 'result': renderResult(); break;
    }
  }

  // ===== 主迴圈 =====
  var last = 0;
  function frame(ts) {
    var dt = last ? (ts - last) / 1000 : 0;
    last = ts;
    dt = Math.min(dt, 1 / 30);
    try {
      if (G.phase !== 'guide') update(dt);
      render();
    } catch (e) { console.error(e); }
    requestAnimationFrame(frame);
  }

  resetAll();
  openGuide('start');   // 開場說明頁; 看完直接進第 1 天(resetAll 之後內容相同)
  requestAnimationFrame(frame);
})();
