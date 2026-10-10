(function () {
  'use strict';

  var W = Art.canvas.width, H = Art.canvas.height;
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');

  // ---------- 數值 ----------
  var C = {
    days: 3, dungeonTime: 45, showTime: 50, speed: 900,
    hearts: 5, hitR: 16, power: 1, fireGap: 0.2, boltSpeed: 900,
    invuln: 1, orbMax: 3, orbSpeed: 700, rosterMax: 6, fieldMax: 3, respawn: 2,
    driftSpeed: 80, weakRatio: 0.3, fleeSpeed: 50, killGold: 4,
    bulletSpeed: 260, bulletR: 10, rockSpeed: 180, rockR: 22,
    monR: 50, orbR: 14, boltR: 5,
    startRage: 20, rageDecay: 4, whipRage: 25, whipR: 130, whipCd: 0.35,
    performMin: 50, walkSpeed: 60, chargeSpeed: 160, bumpTime: 1.5,
    looseGap: 1.5, subdueDist: 60, subdueTime: 1.5, stunTime: 1.5, stunRep: 2, stunInvuln: 2,
    waterSpeed: 300, waterR: 12, endLoosePenalty: 5,
    stars: [50, 120, 200]
  };
  var SPECIES = ['fire', 'water', 'thunder', 'stone'];
  var SP = {
    fire: { hp: 14, gap: 1.6, gold: 5, rep: 1 },
    water: { hp: 10, gap: 1.2, gold: 3, rep: 1 },
    thunder: { hp: 16, gap: 2.2, gold: 7, rep: 2 },
    stone: { hp: 22, gap: 2.0, gold: 4, rep: 1 }
  };
  var ITEMS = [
    { id: 'power', base: 50, y: 300 },
    { id: 'orbBag', base: 40, y: 460 },
    { id: 'armor', base: 40, y: 620 },
    { id: 'longWhip', base: 60, y: 780 }
  ];
  var DG = { top: 120, bottom: 1180, spawnX0: 100, spawnX1: 620, spawnY0: 200, spawnY1: 420, px0: 40, px1: 680, py0: 600, py1: 1160 };
  var SH = { fx0: 60, fx1: 660, fy0: 270, fy1: 1000, fenceTop: 255, fenceBot: 1010, seatTopY: 190, seatBotY: 1080, looseTopY: 218, looseBotY: 1052 };
  var DEG = Math.PI / 180;

  var GUIDE = [
    { t: '地下城', d: '角色跟著游標走, 會自動射擊' },
    { t: '捕獲', d: '魔物虛弱時, 點一下丟球' },
    { t: '揮鞭', d: '點一下揮鞭, 魔物會變生氣' },
    { t: '怒氣', d: '夠生氣才表演, 太生氣會失控' },
    { t: '一天的流程', d: '三天後依名聲評星' }
  ];

  // ---------- 狀態 ----------
  var G = {};
  var mouse = { x: W / 2, y: 900 };
  var phase, stage, guidePage, guideReturn;
  var D, S; // 地下城 / 表演場 狀態

  function resetAll() {
    G = { day: 1, gold: 0, goldEarned: 0, rep: 0, lv: { power: 0, orbBag: 0, armor: 0, longWhip: 0 },
      cost: { power: 50, orbBag: 40, armor: 40, longWhip: 60 }, roster: [], floats: [] };
  }
  function attack() { return C.power + G.lv.power; }
  function orbMax() { return C.orbMax + G.lv.orbBag; }
  function maxHearts() { return C.hearts + G.lv.armor; }
  function whipR() { return C.whipR + 30 * G.lv.longWhip; }

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function dist(ax, ay, bx, by) { return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); }
  function addFloat(x, y, text, kind) { G.floats.push({ x: x, y: y, text: text, kind: kind, t: 0 }); }
  function addRep(v) { G.rep = Math.max(0, G.rep + v); }
  function moveToward(o, tx, ty, speed, dt) {
    var d = dist(o.x, o.y, tx, ty), s = speed * dt;
    if (d <= s || d === 0) { o.x = tx; o.y = ty; } else { o.x += (tx - o.x) / d * s; o.y += (ty - o.y) / d * s; }
  }

  // ---------- 地下城 ----------
  function newMonster(species) {
    var mhp = Math.round(SP[species].hp * (1 + 0.5 * (G.day - 1)));
    return { x: rnd(DG.spawnX0, DG.spawnX1), y: rnd(DG.spawnY0, DG.spawnY1), species: species, hp: mhp, maxHp: mhp,
      hit: 0, weak: false, vx: (Math.random() < 0.5 ? -1 : 1) * C.driftSpeed, fire: rnd(0.5, SP[species].gap) };
  }
  function randSpecies() { return SPECIES[Math.floor(Math.random() * 4)]; }

  function initDungeon() {
    D = { time: C.dungeonTime, hearts: maxHearts(), orbs: orbMax(), player: { x: 360, y: 900 }, inv: 0,
      fireT: 0, bolts: [], bullets: [], orbList: [], monsters: [newMonster(randSpecies()), newMonster(randSpecies())],
      spawnT: -1, msg: '', msgT: 0 };
  }

  function fireBullets(m) {
    var p = D.player, sp = m.species, i, a;
    if (sp === 'fire') {
      for (i = -1; i <= 1; i++) pushBullet(m.x, m.y, Math.PI / 2 + i * 25 * DEG, 'normal', sp);
    } else if (sp === 'water') {
      pushBullet(m.x, m.y, Math.atan2(p.y - m.y, p.x - m.x), 'normal', sp);
    } else if (sp === 'thunder') {
      for (i = 0; i < 8; i++) pushBullet(m.x, m.y, i * Math.PI / 4, 'normal', sp);
    } else {
      pushBullet(m.x, m.y, Math.atan2(p.y - m.y, p.x - m.x), 'rock', sp);
    }
  }
  function pushBullet(x, y, a, kind, sp) {
    var v = kind === 'rock' ? C.rockSpeed : C.bulletSpeed;
    D.bullets.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, kind: kind, species: sp, r: kind === 'rock' ? C.rockR : C.bulletR });
  }

  function throwOrb() {
    if (D.orbs <= 0) return;
    var flying = 0, i;
    for (i = 0; i < D.orbList.length; i++) if (D.orbList[i].result === 'flying') flying++;
    if (G.roster.length + flying >= C.rosterMax) { D.msg = '表演場滿了'; D.msgT = 1.5; return; }
    D.orbs--;
    D.orbList.push({ x: D.player.x, y: D.player.y - 30, result: 'flying', t: 0 });
  }

  function updateDungeon(dt) {
    var i, j, m, b, o, p = D.player;
    D.time -= dt;
    if (D.msgT > 0) { D.msgT -= dt; if (D.msgT <= 0) D.msg = ''; }
    // 玩家
    moveToward(p, clamp(mouse.x, DG.px0, DG.px1), clamp(mouse.y, DG.py0, DG.py1), C.speed, dt);
    if (D.inv > 0) D.inv -= dt;
    // 自動射擊
    D.fireT -= dt;
    while (D.fireT <= 0) { D.fireT += C.fireGap; D.bolts.push({ x: p.x, y: p.y - 36 }); }
    // 魔物
    for (i = 0; i < D.monsters.length; i++) {
      m = D.monsters[i];
      if (m.hit > 0) m.hit -= dt;
      if (m.weak) { m.y -= C.fleeSpeed * dt; continue; }
      m.x += m.vx * dt;
      if (m.x < DG.spawnX0) { m.x = DG.spawnX0; m.vx = Math.abs(m.vx); }
      if (m.x > DG.spawnX1) { m.x = DG.spawnX1; m.vx = -Math.abs(m.vx); }
      m.fire -= dt;
      if (m.fire <= 0) { m.fire += SP[m.species].gap; fireBullets(m); }
    }
    // 子彈
    for (i = D.bolts.length - 1; i >= 0; i--) {
      b = D.bolts[i]; b.y -= C.boltSpeed * dt;
      var hitM = null, hd = 1e9;
      for (j = 0; j < D.monsters.length; j++) {
        m = D.monsters[j]; var d = dist(b.x, b.y, m.x, m.y);
        if (d < C.monR + C.boltR && d < hd) { hd = d; hitM = m; }
      }
      if (hitM) {
        hitM.hp -= attack(); hitM.hit = 0.12; D.bolts.splice(i, 1);
        if (hitM.hp <= 0) {
          G.gold += C.killGold; G.goldEarned += C.killGold; addFloat(hitM.x, hitM.y, '+' + C.killGold, 'gold');
          D.monsters.splice(D.monsters.indexOf(hitM), 1);
        } else if (!hitM.weak && hitM.hp <= hitM.maxHp * C.weakRatio) hitM.weak = true;
      } else if (b.y < DG.top) D.bolts.splice(i, 1);
    }
    // 捕獲球
    for (i = D.orbList.length - 1; i >= 0; i--) {
      o = D.orbList[i];
      if (o.result !== 'flying') { o.t += dt; if (o.t > 0.5) D.orbList.splice(i, 1); continue; }
      o.y -= C.orbSpeed * dt;
      var hm = null, hd2 = 1e9;
      for (j = 0; j < D.monsters.length; j++) {
        m = D.monsters[j]; var d2 = dist(o.x, o.y, m.x, m.y);
        if (d2 < C.monR + C.orbR && d2 < hd2) { hd2 = d2; hm = m; }
      }
      if (hm) {
        o.x = hm.x; o.y = hm.y; o.t = 0;
        if (hm.weak) {
          o.result = 'caught'; G.roster.push(hm.species);
          D.monsters.splice(D.monsters.indexOf(hm), 1);
        } else o.result = 'broken';
      } else if (o.y < DG.top) D.orbList.splice(i, 1);
    }
    // 魔物離場 / 補位
    for (i = D.monsters.length - 1; i >= 0; i--) if (D.monsters[i].weak && D.monsters[i].y < DG.top) D.monsters.splice(i, 1);
    if (D.monsters.length < C.fieldMax) {
      if (D.spawnT < 0) D.spawnT = C.respawn;
      else { D.spawnT -= dt; if (D.spawnT <= 0) { D.monsters.push(newMonster(randSpecies())); D.spawnT = -1; } }
    } else D.spawnT = -1;
    // 敵彈
    for (i = D.bullets.length - 1; i >= 0; i--) {
      b = D.bullets[i]; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < -40 || b.x > W + 40 || b.y < DG.top - 40 || b.y > DG.bottom + 40) { D.bullets.splice(i, 1); continue; }
      if (dist(b.x, b.y, p.x, p.y) < C.hitR + b.r) {
        D.bullets.splice(i, 1);
        if (D.inv <= 0) { D.hearts--; D.inv = C.invuln; }
      }
    }
    if (D.hearts <= 0 || D.time <= 0) { D.time = Math.max(0, D.time); enterTitle('show'); }
  }

  // ---------- 表演場 ----------
  function seatX(i) { return 110 + 100 * (i % 6); }
  function initShow() {
    var i;
    S = { time: C.showTime, mons: [], haz: [], whips: [], whipCd: 0, tamer: { x: 360, y: 635, stun: 0, inv: 0 },
      fences: [], visitors: [], msg: '' };
    for (i = 0; i < 12; i++) {
      var top = i < 6;
      S.fences.push({ seat: i, x: seatX(i), y: top ? SH.fenceTop : SH.fenceBot, side: top ? 'top' : 'bottom', broken: false });
      S.visitors.push({ seat: i, x: seatX(i), y: top ? SH.seatTopY : SH.seatBotY, mode: 'watch', t: 0 });
    }
    for (i = 0; i < G.roster.length; i++) {
      S.mons.push({ x: rnd(110, 610), y: rnd(320, 950), species: G.roster[i], rage: C.startRage, perf: 0, perfT: null, flash: 0,
        ctl: 'none', vx: 0, vy: 0, dirT: 0, dir: 1, sub: 0, seat: -1, bump: 0, atk: 0, tx: 0, ty: 0 });
      newWalk(S.mons[i]);
    }
  }
  function newWalk(m) {
    var a = rnd(0, Math.PI * 2);
    m.vx = Math.cos(a) * C.walkSpeed; m.vy = Math.sin(a) * C.walkSpeed; m.dirT = rnd(2, 4);
    if (m.vx !== 0) m.dir = m.vx < 0 ? -1 : 1;
  }

  function whip(x, y) {
    if (S.whipCd > 0 || S.tamer.stun > 0) return;
    var r = whipR(), i, m;
    S.whipCd = C.whipCd; S.whips.push({ x: x, y: y, radius: r, t: 0 });
    for (i = 0; i < S.mons.length; i++) {
      m = S.mons[i];
      if (m.ctl !== 'none') continue;
      if (dist(x, y, m.x, m.y) <= r) {
        m.rage = Math.min(100, m.rage + C.whipRage);
        if (m.rage >= 100) startCharge(m);
      }
    }
  }
  function startCharge(m) {
    var top = m.y < (SH.fy0 + SH.fy1) / 2, bi = 0, bd = 1e9, k;
    for (k = 0; k < 6; k++) { var dd = Math.abs(seatX(k) - m.x); if (dd < bd) { bd = dd; bi = k; } }
    m.seat = bi + (top ? 0 : 6); m.ctl = 'charge'; m.rage = 100; m.perfT = null; m.sub = 0;
    m.tx = seatX(m.seat); m.ty = top ? SH.fenceTop + 45 : SH.fenceBot - 45;
  }

  function interval(rage) { return 3 - 2 * (clamp(rage, 50, 99) - 50) / 49; }

  function perform(m) {
    var sp = SP[m.species], gain = Math.round(sp.gold * (1 + G.rep / 100)), t = S.tamer;
    G.gold += gain; G.goldEarned += gain; G.rep += sp.rep;
    addFloat(m.x, m.y - 40, '+' + gain, 'gold'); addFloat(m.x + 30, m.y - 70, '+' + sp.rep, 'repUp');
    m.flash = 0.5;
    var sk = m.species, i;
    if (sk === 'fire') S.haz.push({ kind: 'firering', phase: 'warn', x: m.x, y: m.y, radius: 120, t: 0, angle: 0 });
    else if (sk === 'water') {
      var a = Math.atan2(t.y - m.y, t.x - m.x);
      for (i = -1; i <= 1; i++) S.haz.push({ kind: 'waterball', phase: 'active', x: m.x, y: m.y, radius: C.waterR, t: 0, angle: a + i * 20 * DEG });
    } else if (sk === 'thunder') S.haz.push({ kind: 'thunder', phase: 'warn', x: t.x, y: t.y, radius: 70, t: 0, angle: 0 });
    else S.haz.push({ kind: 'quake', phase: 'active', x: m.x, y: m.y, radius: 0, t: 0, angle: 0 });
  }

  function stunTamer() {
    var t = S.tamer;
    if (t.stun > 0 || t.inv > 0) return;
    t.stun = C.stunTime; addRep(-C.stunRep); addFloat(t.x, t.y - 50, '-' + C.stunRep, 'repDown');
  }

  function updateShow(dt) {
    var i, j, m, h, t = S.tamer;
    S.time -= dt;
    if (S.whipCd > 0) S.whipCd -= dt;
    // 馴獸師
    moveToward(t, clamp(mouse.x, SH.fx0, SH.fx1), clamp(mouse.y, SH.fy0, SH.fy1), C.speed, dt);
    if (t.stun > 0) { t.stun -= dt; if (t.stun <= 0) { t.stun = 0; t.inv = C.stunInvuln; } }
    else if (t.inv > 0) t.inv -= dt;
    // 魔物
    var anyLoose = false, maxSub = 0;
    for (i = 0; i < S.mons.length; i++) {
      m = S.mons[i];
      if (m.flash > 0) m.flash -= dt;
      if (m.ctl === 'none') {
        m.x += m.vx * dt; m.y += m.vy * dt;
        if (m.x < 110) { m.x = 110; m.vx = Math.abs(m.vx); } else if (m.x > 610) { m.x = 610; m.vx = -Math.abs(m.vx); }
        if (m.y < 320) { m.y = 320; m.vy = Math.abs(m.vy); } else if (m.y > 950) { m.y = 950; m.vy = -Math.abs(m.vy); }
        if (m.vx !== 0) m.dir = m.vx < 0 ? -1 : 1;
        m.dirT -= dt; if (m.dirT <= 0) newWalk(m);
        m.rage = Math.max(0, m.rage - C.rageDecay * dt);
        if (m.rage >= C.performMin) {
          if (m.perfT === null) m.perfT = interval(m.rage);
          m.perfT -= dt;
          if (m.perfT <= 0) { perform(m); m.perfT = interval(m.rage); }
        } else m.perfT = null;
      } else {
        anyLoose = true;
        var f = S.fences[m.seat];
        if (m.ctl === 'charge') {
          moveToward(m, m.tx, m.ty, C.chargeSpeed, dt);
          if (m.tx !== m.x) m.dir = m.tx < m.x ? -1 : 1;
          if (m.x === m.tx && m.y === m.ty) { m.ctl = f.broken ? 'enter' : 'bump'; m.bump = 0; }
        } else if (m.ctl === 'bump') {
          m.bump += dt;
          if (m.bump >= C.bumpTime) { f.broken = true; m.ctl = 'enter'; }
        }
        if (m.ctl === 'enter') {
          var top = m.seat < 6;
          moveToward(m, seatX(m.seat), top ? SH.looseTopY : SH.looseBotY, C.chargeSpeed, dt);
          if (m.x === seatX(m.seat) && m.y === (top ? SH.looseTopY : SH.looseBotY)) { m.ctl = 'inside'; m.atk = C.looseGap; }
        } else if (m.ctl === 'inside') {
          m.atk -= dt;
          if (m.atk <= 0) { m.atk += C.looseGap; looseAttack(m); }
        }
        // 制伏
        if (t.stun <= 0 && dist(t.x, t.y, m.x, m.y) < C.subdueDist) m.sub += dt; else m.sub = 0;
        if (m.sub >= C.subdueTime) {
          f.broken = false; m.ctl = 'none'; m.x = 360; m.y = (SH.fy0 + SH.fy1) / 2; m.rage = 30; m.sub = 0; m.perfT = null; newWalk(m);
        }
        if (m.sub > maxSub) maxSub = m.sub;
      }
    }
    S.maxSub = maxSub / C.subdueTime;
    S.anyLoose = anyLoose;
    // 觀眾
    for (i = 0; i < S.visitors.length; i++) {
      var v = S.visitors[i];
      if (v.mode !== 'watch') { v.t += dt; if (v.t >= 4) { v.mode = 'watch'; v.t = 0; } else if (v.t > 1) v.mode = 'empty'; }
    }
    // 危險區
    for (i = S.haz.length - 1; i >= 0; i--) {
      h = S.haz[i]; h.t += dt;
      var hit = false;
      if (h.kind === 'firering') {
        if (h.phase === 'warn' && h.t >= 0.4) h.phase = 'active';
        if (h.phase === 'active' && dist(t.x, t.y, h.x, h.y) < h.radius + C.hitR) hit = true;
        if (h.t >= 1.0) { S.haz.splice(i, 1); }
      } else if (h.kind === 'thunder') {
        if (h.phase === 'warn' && h.t >= 0.8) {
          h.phase = 'active';
          if (dist(t.x, t.y, h.x, h.y) < h.radius + C.hitR) hit = true;
        }
        if (h.t >= 1.1) S.haz.splice(i, 1);
      } else if (h.kind === 'quake') {
        h.radius = Math.min(220, 220 * h.t);
        if (Math.abs(dist(t.x, t.y, h.x, h.y) - h.radius) < 15 + C.hitR) hit = true;
        if (h.t >= 1.0) S.haz.splice(i, 1);
      } else { // waterball
        h.x += Math.cos(h.angle) * C.waterSpeed * dt; h.y += Math.sin(h.angle) * C.waterSpeed * dt;
        if (h.x < -40 || h.x > W + 40 || h.y < 100 || h.y > H) { S.haz.splice(i, 1); continue; }
        if (dist(t.x, t.y, h.x, h.y) < h.radius + C.hitR && t.stun <= 0 && t.inv <= 0) { hit = true; S.haz.splice(i, 1); }
      }
      if (hit) stunTamer();
    }
    for (i = S.whips.length - 1; i >= 0; i--) { S.whips[i].t += dt; if (S.whips[i].t > 0.3) S.whips.splice(i, 1); }
    if (t.stun > 0) for (i = 0; i < S.mons.length; i++) S.mons[i].sub = 0;
    if (S.time <= 0) endShow();
  }

  function looseAttack(m) {
    var top = m.seat < 6, base = top ? 0 : 6, best = null, bd = 1e9, i;
    for (i = 0; i < 6; i++) {
      var v = S.visitors[base + i];
      if (v.mode !== 'watch') continue;
      var d = Math.abs(v.x - m.x);
      if (d < bd) { bd = d; best = v; }
    }
    addRep(-3);
    addFloat(m.x, m.y + (top ? -40 : 40), '-3', 'repDown');
    if (best) { best.mode = 'scared'; best.t = 0; }
  }

  function endShow() {
    var i, m;
    for (i = 0; i < S.mons.length; i++) {
      m = S.mons[i];
      if (m.ctl !== 'none') { addRep(-C.endLoosePenalty); addFloat(m.x, m.y, '-' + C.endLoosePenalty, 'repDown'); m.ctl = 'none'; }
    }
    for (i = 0; i < S.fences.length; i++) S.fences[i].broken = false;
    if (G.day >= C.days) { phase = 'result'; } else { phase = 'shop'; }
  }

  // ---------- 流程 ----------
  function enterTitle(st) {
    stage = st; phase = 'title';
    if (st === 'dungeon') initDungeon(); else initShow();
    G.floats = [];
  }
  function startGame() { resetAll(); enterTitle('dungeon'); }

  function stars() { var s = 0, i; for (i = 0; i < 3; i++) if (G.rep >= C.stars[i]) s = i + 1; return s; }

  // 圖形 / 按鈕區域
  var BTN_DEPART = { x: 160, y: 1140, w: 400, h: 100 };
  var BTN_HELP = { x: 620, y: 1190, w: 70, h: 60 };
  var BTN_PREV = { x: 30, y: 1170, w: 200, h: 70 };
  function inBtn(b, x, y) { return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }

  function onClick(x, y) {
    var i;
    if (phase === 'guide') {
      if (guidePage > 0 && inBtn(BTN_PREV, x, y)) { guidePage--; return; }
      if (guidePage < GUIDE.length - 1) { guidePage++; return; }
      if (guideReturn) { phase = guideReturn; guideReturn = null; } else startGame();
    } else if (phase === 'title') {
      if (inBtn(BTN_HELP, x, y)) { guideReturn = 'title'; guidePage = 0; phase = 'guide'; return; }
      phase = stage;
    } else if (phase === 'dungeon') {
      throwOrb();
    } else if (phase === 'show') {
      whip(x, y);
    } else if (phase === 'shop') {
      if (inBtn(BTN_HELP, x, y)) { guideReturn = 'shop'; guidePage = 0; phase = 'guide'; return; }
      if (inBtn(BTN_DEPART, x, y)) { G.day++; enterTitle('dungeon'); return; }
      for (i = 0; i < ITEMS.length; i++) {
        var it = ITEMS[i];
        if (Math.abs(x - 360) <= 300 && Math.abs(y - it.y) <= 70) {
          if (G.gold >= G.cost[it.id]) {
            G.gold -= G.cost[it.id]; G.lv[it.id]++; G.cost[it.id] = Math.round(G.cost[it.id] * 1.5);
          }
          return;
        }
      }
    } else if (phase === 'result') {
      startGame();
    }
  }

  // ---------- 繪製 ----------
  function text(str, x, y, size, color, align) {
    ctx.font = 'bold ' + size + 'px "Microsoft JhengHei", "PingFang TC", sans-serif';
    ctx.fillStyle = color || '#fff'; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(str, x, y);
  }

  function drawFloats() {
    for (var i = 0; i < G.floats.length; i++) { var f = G.floats[i]; Art.drawFloatText(ctx, { x: f.x, y: f.y, text: f.text, kind: f.kind, t: f.t }); }
  }

  function hudState() {
    var st = { phase: phase, day: G.day, gold: G.gold, rep: G.rep, hearts: 0, maxHearts: maxHearts(), orbs: 0, orbMax: orbMax(),
      roster: G.roster.length, rosterMax: C.rosterMax, timeLeft: 0, message: '', subdueProgress: 0 };
    var ph = phase === 'title' ? stage : phase;
    if (ph === 'dungeon' && D) {
      st.hearts = D.hearts; st.orbs = D.orbs; st.timeLeft = Math.ceil(Math.max(0, D.time)); st.message = D.msg;
    } else if (ph === 'show' && S) {
      st.hearts = maxHearts(); st.orbs = orbMax(); st.timeLeft = Math.ceil(Math.max(0, S.time));
      if (phase === 'show' && S.anyLoose) { st.message = '游標停在牠身上制伏'; st.subdueProgress = S.maxSub || 0; }
    } else { st.hearts = maxHearts(); st.orbs = orbMax(); }
    return st;
  }

  function renderDungeon() {
    var i, m, p = D.player;
    Art.drawDungeonArena(ctx, { day: G.day });
    for (i = 0; i < D.monsters.length; i++) { m = D.monsters[i];
      Art.drawMonster(ctx, { x: m.x, y: m.y, species: m.species, hp: m.hp, maxHp: m.maxHp, hit: m.hit > 0, weak: m.weak }); }
    for (i = 0; i < D.bolts.length; i++) Art.drawBolt(ctx, { x: D.bolts[i].x, y: D.bolts[i].y });
    for (i = 0; i < D.bullets.length; i++) { var b = D.bullets[i]; Art.drawEnemyBullet(ctx, { x: b.x, y: b.y, kind: b.kind, species: b.species }); }
    for (i = 0; i < D.orbList.length; i++) { var o = D.orbList[i]; Art.drawOrb(ctx, { x: o.x, y: o.y, result: o.result, t: o.t }); }
    Art.drawPlayer(ctx, { x: p.x, y: p.y, hearts: D.hearts, maxHearts: maxHearts(), blink: D.inv > 0 });
    drawFloats();
  }

  function renderShow() {
    var i, m, t = S.tamer, h;
    Art.drawShowArena(ctx, {});
    for (i = 0; i < S.visitors.length; i++) { var v = S.visitors[i]; Art.drawVisitor(ctx, { x: v.x, y: v.y, seat: v.seat, mode: v.mode }); }
    for (i = 0; i < S.fences.length; i++) { var f = S.fences[i]; Art.drawFence(ctx, { x: f.x, y: f.y, side: f.side, broken: f.broken }); }
    for (i = 0; i < S.haz.length; i++) { h = S.haz[i];
      Art.drawHazard(ctx, { x: h.x, y: h.y, kind: h.kind, phase: h.phase, radius: h.radius, t: h.t, angle: h.angle }); }
    for (i = 0; i < S.mons.length; i++) { m = S.mons[i];
      Art.drawShowMonster(ctx, { x: m.x, y: m.y, species: m.species, rage: m.rage, performing: m.flash > 0,
        mode: m.ctl === 'none' ? 'roam' : (m.ctl === 'enter' || m.ctl === 'inside' ? 'loose' : 'charge'),
        subdueProgress: m.sub / C.subdueTime, dir: m.dir }); }
    Art.drawTamer(ctx, { x: t.x, y: t.y, stunned: t.stun > 0, blink: t.inv > 0, subdueProgress: S.maxSub || 0 });
    for (i = 0; i < S.whips.length; i++) { var w = S.whips[i]; Art.drawWhipCrack(ctx, { x: w.x, y: w.y, radius: w.radius, t: w.t }); }
    drawFloats();
  }

  function drawHelpBtn() { Art.drawButton(ctx, { x: BTN_HELP.x, y: BTN_HELP.y, w: BTN_HELP.w, h: BTN_HELP.h, label: '?', enabled: true }); }

  function render() {
    ctx.clearRect(0, 0, W, H);
    var i;
    if (phase === 'guide') {
      Art.drawBackground(ctx, {});
      text(GUIDE[guidePage].t, W / 2, 90, 56, '#fff');
      Art.drawGuidePage(ctx, { page: guidePage + 1, x: 40, y: 150, w: 640, h: 720 });
      text(GUIDE[guidePage].d, W / 2, 940, 38, '#fff');
      text((guidePage + 1) + ' / ' + GUIDE.length, W / 2, 1020, 32, '#ddd');
      if (guidePage > 0) Art.drawButton(ctx, { x: BTN_PREV.x, y: BTN_PREV.y, w: BTN_PREV.w, h: BTN_PREV.h, label: '上一頁', enabled: true });
      text('點畫面繼續', 470, 1205, 30, '#ccc');
    } else if (phase === 'result') {
      Art.drawBackground(ctx, {});
      Art.drawResultPanel(ctx, { rep: G.rep, goldEarned: G.goldEarned, stars: stars() });
    } else if (phase === 'shop') {
      Art.drawBackground(ctx, {});
      for (i = 0; i < ITEMS.length; i++) {
        var it = ITEMS[i];
        Art.drawShopItem(ctx, { x: 360, y: it.y, item: it.id, level: G.lv[it.id], cost: G.cost[it.id], affordable: G.gold >= G.cost[it.id] });
      }
      Art.drawButton(ctx, { x: BTN_DEPART.x, y: BTN_DEPART.y, w: BTN_DEPART.w, h: BTN_DEPART.h, label: '出發', enabled: true });
      drawHelpBtn();
      Art.drawHud(ctx, hudState());
    } else {
      if (stage === 'dungeon') renderDungeon(); else renderShow();
      Art.drawHud(ctx, hudState());
      if (phase === 'title') { Art.drawTitleCard(ctx, { day: G.day, stage: stage }); drawHelpBtn(); }
    }
  }

  // ---------- 主迴圈 ----------
  var last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = last ? (now - last) / 1000 : 0;
    last = now;
    dt = Math.min(Math.max(dt, 0), 1 / 30);
    try {
      for (var i = G.floats.length - 1; i >= 0; i--) { G.floats[i].t += dt; if (G.floats[i].t > 1.2) G.floats.splice(i, 1); }
      if (phase === 'dungeon') updateDungeon(dt);
      else if (phase === 'show') updateShow(dt);
      render();
    } catch (e) { console.error(e); }
  }

  // ---------- 輸入(只有滑鼠) ----------
  function toLogical(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }
  window.addEventListener('mousemove', function (e) { var p = toLogical(e); mouse.x = p.x; mouse.y = p.y; });
  canvas.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    e.preventDefault();
    var p = toLogical(e); mouse.x = p.x; mouse.y = p.y;
    try { onClick(p.x, p.y); } catch (err) { console.error(err); }
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    var s = Math.min(window.innerWidth / W, window.innerHeight / H);
    canvas.style.width = Math.floor(W * s) + 'px'; canvas.style.height = Math.floor(H * s) + 'px';
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  resetAll();
  phase = 'guide'; guidePage = 0; guideReturn = null;
  requestAnimationFrame(frame);
})();
