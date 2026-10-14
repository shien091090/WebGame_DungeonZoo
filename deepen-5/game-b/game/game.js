'use strict';
/* 暗號節目單 — 玩法驗證 Demo。只用方向鍵 + Z、X。
   邏輯與繪製分離: update(dt) 改狀態, render() 呼叫 Art.drawXxx。 */

// ───────────────────────── 基本工具 ─────────────────────────
const CW = (Art.canvas && Art.canvas.width) || 1280;
const CH = (Art.canvas && Art.canvas.height) || 720;
const DAY_MAX = 5;
const D2R = Math.PI / 180;
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
function normAng(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
function sumObj(o) { let s = 0; for (const k in o) s += o[k]; return s; }

// ───────────────────────── 資料表 ─────────────────────────
const SPECIES = ['lily', 'monkey', 'beetle', 'parrot', 'penguin', 'tanuki'];
const SP = {
  lily:    { name: '鈴蘭精',   hp: 7,  effect: 'calm',   interval: 3.0, decay: 2,   gold: 1, rep: 1, kill: 3, dungeon: 'lake',  desc: '朝對手撒三發花粉, 打中的會冷靜', skill: 'pollen' },
  monkey:  { name: '火柴猴',   hp: 7,  effect: 'ignite', interval: 3.0, decay: 2,   gold: 2, rep: 1, kill: 3, dungeon: 'lake',  desc: '丟出會飛回來的火柴, 打中的會生氣', skill: 'match' },
  beetle:  { name: '齒輪甲蟲', hp: 12, effect: 'ignite', interval: 3.2, decay: 2,   gold: 2, rep: 1, kill: 5, dungeon: 'tower', desc: '轉圈噴出一串齒輪, 打中的會生氣', skill: 'gear' },
  parrot:  { name: '標靶鸚鵡', hp: 12, effect: 'target', interval: 2.6, decay: 2,   gold: 2, rep: 1, kill: 5, dungeon: 'tower', desc: '羽毛射中的變成大家的標靶', skill: 'feather' },
  penguin: { name: '冰柱企鵝', hp: 16, effect: 'freeze', interval: 3.0, decay: 1.5, gold: 3, rep: 2, kill: 7, dungeon: 'snow',  desc: '一道冰柱射線, 打中的凍住不動', skill: 'icebeam' },
  tanuki:  { name: '戲法狸',   hp: 18, effect: 'warp',   interval: 3.0, decay: 1.5, gold: 3, rep: 2, kill: 8, dungeon: 'snow',  desc: '紙牌射中的被變到別處', skill: 'card' },
};
const EFFECT_NAME = { ignite: '激怒', calm: '冷靜', target: '標靶', freeze: '凍結', warp: '變走' };
const NEST_CH = { l: 'lily', m: 'monkey', g: 'beetle', p: 'parrot', q: 'penguin', k: 'tanuki' };
const UP_COST = [40, 80, 140];
// 投射物: 速度、判定半徑、最長存在
const PROJ = {
  pollen:  { speed: 160, r: 12, life: 4 },
  match:   { speed: 200, r: 14, life: 3 },
  gear:    { speed: 150, r: 10, life: 4 },
  feather: { speed: 260, r: 12, life: 3 },
  card:    { speed: 200, r: 12, life: 3 },
};

const CUES = [
  { key: 'wait',   name: '過 6 秒',   desc: '上一個節目演完 6 秒後', price: 0 },
  { key: 'red3',   name: '三隻進紅區', desc: '場上同時有 3 隻在紅區', price: 0 },
  { key: 'mark3',  name: '有人標記 3', desc: '有一隻標記到 3 個', price: 0 },
  { key: 'cold',   name: '冷場',       desc: '一半以上的魔物冷掉了', price: 0 },
  { key: 'chain3', name: '連鎖 3',     desc: '出現連鎖 3 段的表演', price: 30 },
  { key: 'multi3', name: '一招 3 隻',  desc: '有一招打中 3 隻以上', price: 30 },
  { key: 'loose',  name: '有人失控',   desc: '有一隻失控了', price: 30 },
];
const PROGS = [
  { key: 'ice',     name: '冰水桶', desc: '紅區又沒標記的全部冷靜一點', price: 0 },
  { key: 'pep',     name: '加油棒', desc: '怒氣不到 50 的全部打氣', price: 0 },
  { key: 'scatter', name: '散場',   desc: '大家互相遠離 3 秒', price: 0 },
  { key: 'mob',     name: '圍攻',   desc: '大家去圍最氣的那隻 3 秒', price: 0 },
  { key: 'tutti',   name: '大合奏', desc: '紅區的全部立刻表演', price: 50 },
  { key: 'lull',    name: '安撫曲', desc: '有標記的全部冷靜下來', price: 40 },
  { key: 'spot',    name: '聚光燈', desc: '最氣的那隻連演 3 次', price: 40 },
  { key: 'shuffle', name: '魔術箱', desc: '全場洗牌換位置', price: 30 },
];
const CUE_BY = {}; CUES.forEach(c => { CUE_BY[c.key] = c; });
const PROG_BY = {}; PROGS.forEach(c => { PROG_BY[c.key] = c; });

const DUNGEONS = {
  lake: {
    name: '鏡湖', species: ['lily', 'monkey'],
    map: [
      '################################',
      '#........#..........#..........#',
      '#..l.....#.1....2...#......m...#',
      '#....o...X..........X...o......#',
      '#........#....WW....#..........#',
      '#.1......#....WW....#.......2..#',
      '#........#..........#..........#',
      '####..########....########..####',
      '####..########....########..####',
      '#........#..........#..........#',
      '#...W....#..o....o..#....W.....#',
      '#........X..........X..........#',
      '#.....o..#..........#.....m....#',
      '#..l.....#....S.....#..o.......#',
      '#........#..........#..........#',
      '################################'],
  },
  tower: {
    name: '齒輪鐘塔', species: ['beetle', 'parrot'], reqRep: 60, reqSp: 'lily', reqN: 2,
    map: [
      '################################',
      '#........#..........#..........#',
      '#..g..L..#.1....2...#...L..p...#',
      '#........X....oo....X..........#',
      '#.L......#..........#......L...#',
      '#.1..W...#..........#.......2..#',
      '#........#..........#..........#',
      '####..########....########..####',
      '####..########....########..####',
      '#........#..........#..........#',
      '#....L...#..L....L..#..W.......#',
      '#........X..........X..........#',
      '#..W.....#..........#......p...#',
      '#.g...o..#....S.....#...L......#',
      '#........#..........#..........#',
      '################################'],
  },
  snow: {
    name: '雪境', species: ['penguin', 'tanuki'], reqRep: 200, reqSp: 'parrot', reqN: 2,
    map: [
      '################################',
      '#........#..........#..........#',
      '#..q.....#.1....2...#..L....k..#',
      '#...L....X..........X..........#',
      '#......W.#....LL....#....o.....#',
      '#.1......#..........#.......2..#',
      '#...o....#..........#..W.......#',
      '####..########....########..####',
      '####..########....########..####',
      '#........#..........#..........#',
      '#..L.....#..o....o..#.....L....#',
      '#........X..........X..........#',
      '#....W...#..........#..k.......#',
      '#.q......#....S.....#.....W....#',
      '#........#..........#..........#',
      '################################'],
  },
};
const DUNGEON_ORDER = ['lake', 'tower', 'snow'];
const TILE = 60, MAPW = 32, MAPH = 16;

// 房間(世界座標) 0 左上 1 中上 2 右上 3 左下 4 中下 5 右下; 活動範圍 = 房間內縮 30
const ROOM_X = [[60, 540], [600, 1200], [1260, 1860]];
const ROOM_Y = [[60, 420], [540, 900]];
function roomOf(x, y) { return (y < 480 ? 0 : 1) * 3 + (x < 570 ? 0 : x < 1230 ? 1 : 2); }
function roomBounds(room) {
  const cx = room % 3, cy = Math.floor(room / 3);
  return { x0: ROOM_X[cx][0] + 30, x1: ROOM_X[cx][1] - 30, y0: ROOM_Y[cy][0] + 30, y1: ROOM_Y[cy][1] - 30 };
}
const SHOW_B = { x0: 100, x1: 1180, y0: 186, y1: 526 };
const ARENA = { x0: 60, x1: 1220, y0: 146, y1: 566 };
const SHOW_POS = [[380, 260], [900, 260], [380, 450], [900, 450], [640, 356], [180, 220], [1100, 220], [180, 490], [1100, 490], [640, 220],
  [640, 490], [180, 356], [1100, 356], [510, 356], [770, 356], [510, 220], [770, 490], [770, 220], [510, 490], [300, 356]];

// ───────────────────────── 全域狀態 ─────────────────────────
let G = null;   // 整輪遊戲
let D = null;   // 地下城
let S = null;   // 表演場
const keys = { up: false, down: false, left: false, right: false, z: false, x: false };
let pressed = {};

function emptyRows() { const r = []; for (let i = 0; i < 6; i++) r.push({ cue: '', prog: '' }); return r; }
function zeroMap(v) { const o = {}; SPECIES.forEach(s => { o[s] = v; }); return o; }

function newRun(startPhase) {
  G = {
    phase: startPhase, guidePage: 0, guideFrom: null,
    day: 1, gold: 30, rep: 0, goldEarned: 0, bestChain: 0,
    weapon: 'club', ownedWeapons: { club: true },
    atkBought: 0, armorBought: 0, ropeBought: 0,
    prices: { attack: 50, armor: 40, ropeBag: 40 },
    bank: Object.assign(zeroMap(0), { lily: 2, monkey: 2 }),
    cap: zeroMap(0), level: zeroMap(0),
    stage: Object.assign(zeroMap(0), { lily: 2, monkey: 2 }),
    unlocked: { lake: true, tower: false, snow: false },
    ownedCues: { wait: true, red3: true, mark3: true, cold: true },
    ownedProgs: { ice: true, pep: true, scatter: true, mob: true },
    rows: emptyRows(),
    selCur: 0,
    s1: { cur: 0, zone: 'card' },
    s2: { row: 0, col: 0, panel: null },
    shop: { tab: 0, zone: 'tab', idx: 0 },
  };
  D = null; S = null;
}

function setPhase(p) {
  G.phase = p;
  pressed = {};
  keys.z = false; keys.x = false;   // 轉場後的動作要重新按
}

function redLow(sp) { return 80 - 5 * G.level[sp]; }
function maxHeartsNow() { return 6 + G.armorBought + G.level.penguin; }
function ropeMaxNow() { return 4 + G.ropeBought; }
function xCdBase(w) { return w === 'sword' ? 3 : w === 'spear' ? 1.2 : w === 'whip' ? 1.2 : 0; }
function xCdMax() { const b = xCdBase(G.weapon); return b * (1 - 0.15 * G.level.beetle); }
function captureDur() { return Math.max(0.35, 0.8 - 0.15 * G.level.lily); }

function checkUnlock() {
  for (const id of DUNGEON_ORDER) {
    if (G.unlocked[id]) continue;
    const d = DUNGEONS[id];
    if (G.rep >= d.reqRep && G.cap[d.reqSp] >= d.reqN) G.unlocked[id] = true;
  }
}
function dungeonCondition(id) {
  const d = DUNGEONS[id];
  if (G.unlocked[id]) return '';
  return '名聲 ' + Math.min(G.rep, d.reqRep) + '/' + d.reqRep + ' + 收服' + SP[d.reqSp].name + ' ' + Math.min(G.cap[d.reqSp], d.reqN) + '/' + d.reqN;
}

// ───────────────────────── 輸入(只掛鍵盤) ─────────────────────────
function keyName(e) {
  switch (e.code) {
    case 'ArrowUp': return 'up'; case 'ArrowDown': return 'down';
    case 'ArrowLeft': return 'left'; case 'ArrowRight': return 'right';
    case 'KeyZ': return 'z'; case 'KeyX': return 'x';
  }
  switch (e.key) {
    case 'ArrowUp': return 'up'; case 'ArrowDown': return 'down';
    case 'ArrowLeft': return 'left'; case 'ArrowRight': return 'right';
    case 'z': case 'Z': return 'z'; case 'x': case 'X': return 'x';
  }
  return null;
}
window.addEventListener('keydown', function (e) {
  const k = keyName(e);
  if (!k) return;
  e.preventDefault();
  if (e.repeat) return;
  keys[k] = true;
  pressed[k] = true;
});
window.addEventListener('keyup', function (e) {
  const k = keyName(e);
  if (!k) return;
  e.preventDefault();
  keys[k] = false;
});
window.addEventListener('blur', function () {
  for (const k in keys) keys[k] = false;
  pressed = {};
});

// ───────────────────────── 說明頁 ─────────────────────────
const GUIDE = [
  { t: '地下城', s: '方向鍵走, Z 攻擊, X 武器技' },
  { t: '收服', s: '殘血時站上去, 再繞牠一圈' },
  { t: '暗號節目單', s: '場面對上暗號, 就演那個節目' },
  { t: '紅區', s: '紅區最賺, 標記滿 5 個就失控' },
  { t: '目標', s: '5 天內賺到越多名聲越好' },
];
function guideInput() {
  if (pressed.z || pressed.right) {
    if (G.guidePage >= GUIDE.length - 1) {
      G.guidePage = 0;
      setPhase(G.guideFrom || 'select');
      G.guideFrom = null;
    } else G.guidePage++;
  } else if (pressed.x || pressed.left) {
    if (G.guidePage > 0) G.guidePage--;
    else if (G.guideFrom) { G.guidePage = 0; setPhase(G.guideFrom); G.guideFrom = null; }
  }
}

// ───────────────────────── 地下城選擇 ─────────────────────────
function selectInput() {
  if (pressed.left) G.selCur = Math.max(0, G.selCur - 1);
  else if (pressed.right) G.selCur = Math.min(2, G.selCur + 1);
  else if (pressed.up) { G.guidePage = 0; G.guideFrom = 'select'; setPhase('guide'); }
  else if (pressed.z) {
    const id = DUNGEON_ORDER[G.selCur];
    if (G.unlocked[id]) startDungeon(id);
  }
}

// ───────────────────────── 地下城: 地圖與碰撞 ─────────────────────────
function solidCell(c, r) {
  if (c < 0 || r < 0 || c >= MAPW || r >= MAPH) return true;
  const ch = D.grid[r][c];
  return ch === '#' || ch === 'o' || ch === 'X';
}
function circleSolid(x, y, rad) {
  const c0 = Math.floor((x - rad) / TILE), c1 = Math.floor((x + rad) / TILE);
  const r0 = Math.floor((y - rad) / TILE), r1 = Math.floor((y + rad) / TILE);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    if (!solidCell(c, r)) continue;
    const nx = clamp(x, c * TILE, c * TILE + TILE), ny = clamp(y, r * TILE, r * TILE + TILE);
    if ((nx - x) * (nx - x) + (ny - y) * (ny - y) < rad * rad) return true;
  }
  return false;
}
function circleOnChar(x, y, rad, ch) {
  const c0 = Math.floor((x - rad) / TILE), c1 = Math.floor((x + rad) / TILE);
  const r0 = Math.floor((y - rad) / TILE), r1 = Math.floor((y + rad) / TILE);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    if (c < 0 || r < 0 || c >= MAPW || r >= MAPH || D.grid[r][c] !== ch) continue;
    const nx = clamp(x, c * TILE, c * TILE + TILE), ny = clamp(y, r * TILE, r * TILE + TILE);
    if ((nx - x) * (nx - x) + (ny - y) * (ny - y) < rad * rad) return true;
  }
  return false;
}
function solidAtPoint(x, y) { return solidCell(Math.floor(x / TILE), Math.floor(y / TILE)); }

function startDungeon(id) {
  const def = DUNGEONS[id];
  const grid = def.map.map(r => r.split(''));
  D = {
    id, grid, portals: [], nests: [], mons: [], hz: [], fx: [], floats: [], cracks: {},
    timeLeft: 75, pairCd: { 1: 0, 2: 0 }, ring: { m: null, t: 0 }, lasso: null,
    ropes: ropeMaxNow(), tamer: null,
  };
  let sx = 0, sy = 0;
  for (let r = 0; r < MAPH; r++) for (let c = 0; c < MAPW; c++) {
    const ch = grid[r][c], cx = c * TILE + 30, cy = r * TILE + 30;
    if (ch === 'S') { sx = cx; sy = cy; grid[r][c] = '.'; }
    else if (ch === '1' || ch === '2') { D.portals.push({ id: +ch, x: cx, y: cy, charge: 0, armed: true }); grid[r][c] = '.'; }
    else if (NEST_CH[ch]) { D.nests.push({ sp: NEST_CH[ch], x: cx, y: cy, room: roomOf(cx, cy), mon: null, respawn: 0 }); grid[r][c] = 'n'; }
  }
  const mh = maxHeartsNow();
  D.tamer = {
    x: sx, y: sy, facing: 0, weapon: G.weapon, hearts: mh, maxHearts: mh, invuln: 0, slowT: 0,
    zCd: 0, xCd: 0, dash: null,
  };
  for (const n of D.nests) spawnWild(n);
  setPhase('dungeon');
}

function spawnWild(n) {
  const sp = SP[n.sp];
  const m = {
    sp: n.sp, x: n.x, y: n.y, hp: sp.hp, maxHp: sp.hp, hitT: 0, stun: 0, lassoed: false, kb: null,
    room: n.room, nest: n, dead: false, ang: rnd(0, Math.PI * 2), dirT: rnd(0.5, 2), cyc: rnd(0, 1),
    tp: 0, tpT: 0, teleT: rnd(0, 2.5), swooping: false, castT: 0, inRange: false, burst: null,
    face: 1, move: 'walk', moveT: 0, moveDur: 0, weak: false, casting: false,
  };
  if (n.sp === 'penguin') m.cyc = rnd(0, 2);
  if (n.sp === 'parrot') m.cyc = rnd(0, 2);
  n.mon = m; n.respawn = 0;
  D.mons.push(m);
}

// ───────────────────────── 魔物移動(地下城與表演場共用) ─────────────────────────
function advStraight(m, speed, dt, b) {
  m.x += Math.cos(m.ang) * speed * dt; m.y += Math.sin(m.ang) * speed * dt;
  if (m.x < b.x0) { m.x = b.x0; m.ang = Math.PI - m.ang; } else if (m.x > b.x1) { m.x = b.x1; m.ang = Math.PI - m.ang; }
  if (m.y < b.y0) { m.y = b.y0; m.ang = -m.ang; } else if (m.y > b.y1) { m.y = b.y1; m.ang = -m.ang; }
  const c = Math.cos(m.ang); if (speed > 0 && Math.abs(c) > 0.05) m.face = c > 0 ? 1 : -1;
}
function advClamp(m, speed, dt, b) {
  m.x = clamp(m.x + Math.cos(m.ang) * speed * dt, b.x0, b.x1);
  m.y = clamp(m.y + Math.sin(m.ang) * speed * dt, b.y0, b.y1);
  const c = Math.cos(m.ang); if (Math.abs(c) > 0.05) m.face = c > 0 ? 1 : -1;
}
// env: { b: 邊界, dir(m): 新方向, tele(m): 瞬移落點 }; mul: 速度倍率
function moveMonster(m, dt, env, mul) {
  const b = env.b;
  m.move = 'walk'; m.moveT = 0; m.moveDur = 0;
  switch (m.sp) {
    case 'lily':
      m.dirT -= dt; if (m.dirT <= 0) { m.ang = env.dir(m); m.dirT = rnd(2, 3); }
      advStraight(m, 50 * mul, dt, b); break;
    case 'beetle':
      m.dirT -= dt; if (m.dirT <= 0) { m.ang = env.dir(m); m.dirT = 4; }
      advStraight(m, 110 * mul, dt, b); break;
    case 'monkey':
      m.cyc += dt; if (m.cyc >= 1) { m.cyc -= 1; m.ang = env.dir(m); }
      if (m.cyc < 0.3) { m.move = 'hop'; m.moveT = m.cyc; m.moveDur = 0.3; advClamp(m, (80 / 0.3) * mul, dt, b); }
      break;
    case 'parrot':
      m.cyc += dt;
      if (m.cyc >= 2) { m.cyc -= 2; m.ang = env.dir(m); m.swooping = true; }
      if (m.swooping) {
        if (m.cyc < 0.5) { m.move = 'swoop'; m.moveT = m.cyc; m.moveDur = 0.5; advStraight(m, 220 * mul, dt, b); }
        else { m.swooping = false; m.ang = env.dir(m); advStraight(m, 20 * mul, dt, b); }
      } else advStraight(m, 20 * mul, dt, b);
      break;
    case 'penguin': {
      m.cyc += dt; if (m.cyc >= 2) { m.cyc -= 2; m.ang = env.dir(m); }
      let sp = 0;
      if (m.cyc < 1) sp = 150; else if (m.cyc < 1.6) sp = 150 * (1 - (m.cyc - 1) / 0.6);
      advStraight(m, sp * mul, dt, b); break;
    }
    case 'tanuki':
      if (m.tp === 1) {
        m.tpT += dt; m.move = 'fadeOut'; m.moveT = Math.min(m.tpT, 0.25); m.moveDur = 0.25;
        if (m.tpT >= 0.25) { const p = env.tele(m); m.x = p.x; m.y = p.y; m.tp = 2; m.tpT = 0; m.move = 'fadeIn'; m.moveT = 0; }
        break;
      }
      if (m.tp === 2) {
        m.tpT += dt; m.move = 'fadeIn'; m.moveT = Math.min(m.tpT, 0.25); m.moveDur = 0.25;
        if (m.tpT >= 0.25) { m.tp = 0; m.tpT = 0; m.teleT = 0; m.move = 'walk'; m.moveT = 0; m.moveDur = 0; }
        break;
      }
      m.teleT += dt;
      if (m.teleT >= 2.5) { m.tp = 1; m.tpT = 0; break; }
      m.dirT -= dt; if (m.dirT <= 0) { m.ang = env.dir(m); m.dirT = 3; }
      advStraight(m, 30 * mul, dt, b); break;
  }
}

// ───────────────────────── 技能(地下城 / 表演場共用) ─────────────────────────
function newHz(o) {
  return Object.assign({ kind: '', phase: 'fly', x: 0, y: 0, radius: 0, angle: 0, length: 0, width: 0, t: 0, dur: 0,
    speed: 0, returning: false, reflected: false, dead: false, owner: null, cast: null, hit: null, trav: 0, ox: 0, oy: 0 }, o);
}
function hzList() { return G.phase === 'show' ? S.hz : D.hz; }
function killHz(h) {
  if (h.dead) return;
  h.dead = true;
  if (h.cast) { h.cast.alive--; checkSettle(h.cast); }
}
function newCast(owner, chain, dungeon) {
  return { owner, chain, hits: new Set(), alive: 0, red: false, settled: false, dungeon };
}
// 發出一次技能; cast 追蹤同一次施放(alive = 尚在飛的投射物 / 連射)
function emitSkill(m, tx, ty, cast) {
  const list = hzList();
  const kind = SP[m.sp].skill;
  const base = Math.atan2(ty - m.y, tx - m.x);
  const mk = (ang, extra) => {
    const p = PROJ[kind];
    const h = newHz(Object.assign({ kind, phase: 'fly', x: m.x, y: m.y, radius: p.r, angle: ang, dur: p.life, speed: p.speed, owner: m, cast, ox: m.x, oy: m.y }, extra || {}));
    cast.alive++; list.push(h);
  };
  if (kind === 'pollen') { mk(base - 20 * D2R); mk(base); mk(base + 20 * D2R); }
  else if (kind === 'match') mk(base);
  else if (kind === 'feather') mk(base);
  else if (kind === 'card') { [-22.5, -7.5, 7.5, 22.5].forEach(a => mk(base + a * D2R)); }
  else if (kind === 'gear') {
    m.burst = { k: 0, t: 0, base, cast };
    cast.alive++;
    stepBurst(m, 0);
  } else if (kind === 'icebeam') {
    const h = newHz({ kind, phase: 'warn', x: m.x, y: m.y, angle: base, length: 460, width: 36, t: 0, dur: 0.7, owner: m, cast });
    cast.alive++; list.push(h);
  }
}
function stepBurst(m, dt) {
  const b = m.burst; if (!b) return;
  b.t += dt;
  const p = PROJ.gear, list = hzList();
  while (b.k < 12 && b.t >= b.k * 0.1) {
    const h = newHz({ kind: 'gear', phase: 'fly', x: m.x, y: m.y, radius: p.r, angle: b.base + 30 * D2R * b.k, dur: p.life, speed: p.speed, owner: m, cast: b.cast, ox: m.x, oy: m.y });
    b.cast.alive++; list.push(h); b.k++;
  }
  if (b.k >= 12) { const c = b.cast; m.burst = null; c.alive--; checkSettle(c); }
}
function cancelBurst(m) {
  if (m.burst) { const c = m.burst.cast; m.burst = null; c.alive--; checkSettle(c); }
}
function cancelWarns(m) {
  for (const h of hzList()) if (!h.dead && h.owner === m && h.phase === 'warn') killHz(h);
}
// 長方形判定(施放者中心起, 朝 angle 延伸 length, 寬 width)
function inLine(px, py, ox, oy, ang, len, wid, pad) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const u = (px - ox) * c + (py - oy) * s, v = -(px - ox) * s + (py - oy) * c;
  return u >= -pad && u <= len + pad && Math.abs(v) <= wid / 2 + pad;
}
function inArc(px, py, ox, oy, ang, spread, r, pad) {
  const d = dist(px, py, ox, oy);
  if (d > r + pad) return false;
  if (d <= pad) return true;
  const da = Math.abs(normAng(Math.atan2(py - oy, px - ox) - ang));
  return da <= spread / 2 + Math.asin(Math.min(1, pad / d));
}
// 範圍中心點與圓的最近距離(冰柱射線打馴獸師圓用)
function lineHitsCircle(h, px, py, rad) {
  const c = Math.cos(h.angle), s = Math.sin(h.angle);
  const u = (px - h.x) * c + (py - h.y) * s, v = -(px - h.x) * s + (py - h.y) * c;
  const cu = clamp(u, 0, h.length), cv = clamp(v, -h.width / 2, h.width / 2);
  return (u - cu) * (u - cu) + (v - cv) * (v - cv) <= rad * rad;
}

// ───────────────────────── 地下城: 馴獸師 ─────────────────────────
function facingFromDir(dx, dy) {
  if (dx === 0 && dy === -1) return 0; if (dx === 1 && dy === -1) return 1; if (dx === 1 && dy === 0) return 2;
  if (dx === 1 && dy === 1) return 3; if (dx === 0 && dy === 1) return 4; if (dx === -1 && dy === 1) return 5;
  if (dx === -1 && dy === 0) return 6; return 7;
}
function hurtTamer(h) {
  const T = D.tamer;
  if (T.invuln > 0 || T.dash) return false;
  T.hearts--; T.invuln = 1.2;
  if (h && h.kind === 'icebeam') T.slowT = 1;
  if (D.lasso) breakLasso();
  return true;
}
function tryMoveTamer(dx, dy) {
  const T = D.tamer;
  let blocked = false;
  T.x += dx; if (circleSolid(T.x, T.y, 18)) { T.x -= dx; blocked = true; }
  T.y += dy; if (circleSolid(T.x, T.y, 18)) { T.y -= dy; blocked = true; }
  return blocked;
}
function updateTamer(dt) {
  const T = D.tamer;
  T.invuln = Math.max(0, T.invuln - dt); T.slowT = Math.max(0, T.slowT - dt);
  T.zCd = Math.max(0, T.zCd - dt); T.xCd = Math.max(0, T.xCd - dt);
  if (T.dash) { updateDash(dt); return; }
  let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  if (dx || dy) {
    T.facing = facingFromDir(dx, dy);
    const len = Math.hypot(dx, dy);
    let sp = 300 + 25 * G.level.monkey;
    if (D.grid[Math.floor(T.y / TILE)][Math.floor(T.x / TILE)] === 'W') sp *= 0.5;
    if (T.slowT > 0) sp *= 0.5;
    const step = sp * dt, n = Math.max(1, Math.ceil(step / 8));
    for (let i = 0; i < n; i++) tryMoveTamer(dx / len * step / n, dy / len * step / n);
  }
  // 傷害地形
  if (circleOnChar(T.x, T.y, 18, 'L')) hurtTamer(null);
  if (keys.z && T.zCd <= 0) doAttack(false);
  if (keys.x && T.xCd <= 0 && !T.dash) doAttack(true);
}
function addFx(o) { D.fx.push(Object.assign({ x: D.tamer.x, y: D.tamer.y, weapon: D.tamer.weapon, move: 'normal', shape: 'arc', angle: 0, spread: 0, radius: 0, length: 0, width: 0, t: 0, dur: 0.2 }, o)); }
function doAttack(isX) {
  const T = D.tamer, wp = T.weapon, ang = (T.facing - 2) * Math.PI / 4;
  const atk = G.atkBought, rb = 1 + 0.1 * G.level.parrot;
  let sh = null;
  if (!isX) {
    if (wp === 'club') { sh = { shape: 'arc', spread: 100 * D2R, radius: 70 * rb, dmg: 2 + atk }; T.zCd = 0.35; }
    else if (wp === 'sword') { sh = { shape: 'arc', spread: 120 * D2R, radius: 80 * rb, dmg: 2 + atk, reflect: true }; T.zCd = 0.35; }
    else if (wp === 'spear') { sh = { shape: 'line', length: 170 * rb, width: 40, dmg: 2 + atk }; T.zCd = 0.45; }
    else { sh = { shape: 'circle', radius: 100 * rb, dmg: 1 + atk }; T.zCd = 0.4; }
    addFx({ move: 'normal', shape: sh.shape, angle: ang, spread: sh.spread || 0, radius: sh.radius || 0, length: sh.length || 0, width: sh.width || 0, dur: 0.2 });
    applyShape(sh, T.x, T.y, ang);
  } else {
    if (wp === 'club') return;
    T.xCd = xCdMax();
    if (wp === 'sword') {
      sh = { shape: 'arc', spread: 120 * D2R, radius: 80, dmg: 0, stun: true };
      addFx({ move: 'skill', shape: 'arc', angle: ang, spread: sh.spread, radius: 80 });
      applyShape(sh, T.x, T.y, ang);
    } else if (wp === 'whip') {
      sh = { shape: 'arc', spread: 100 * D2R, radius: 170, dmg: 2 + atk, knock: true };
      addFx({ move: 'skill', shape: 'arc', angle: ang, spread: sh.spread, radius: 170 });
      applyShape(sh, T.x, T.y, ang);
    } else if (wp === 'spear') {
      T.dash = { t: 0, ang, hit: new Set(), sx: T.x, sy: T.y, trav: 0 };
      addFx({ move: 'skill', shape: 'dash', angle: ang, length: 220, dur: 0.25 });
    }
  }
}
function updateDash(dt) {
  const T = D.tamer, d = T.dash;
  const step = Math.min(dt, 0.25 - d.t) * (220 / 0.25);
  const n = Math.max(1, Math.ceil(step / 8));
  let blocked = false;
  for (let i = 0; i < n; i++) {
    const sx = Math.cos(d.ang) * step / n, sy = Math.sin(d.ang) * step / n;
    const ox = T.x, oy = T.y;
    T.x += sx; if (circleSolid(T.x, T.y, 18)) { T.x -= sx; }
    T.y += sy; if (circleSolid(T.x, T.y, 18)) { T.y -= sy; }
    if (T.x === ox && T.y === oy) { blocked = true; break; }
    d.trav += Math.hypot(T.x - ox, T.y - oy);
    for (const m of D.mons) {
      if (m.dead || m.lassoed || d.hit.has(m)) continue;
      if (dist(m.x, m.y, T.x, T.y) <= 24 + 18) { d.hit.add(m); damageMon(m, 3 + G.atkBought); }
    }
  }
  d.t += dt;
  if (blocked || d.t >= 0.25) {
    T.dash = null;
    T.invuln = Math.max(T.invuln, 0);
    hitCracks({ shape: 'line', length: d.trav + 60, width: 40 }, d.sx, d.sy, d.ang);
  }
}
function inShape(sh, px, py, ox, oy, ang, pad) {
  if (sh.shape === 'arc') return inArc(px, py, ox, oy, ang, sh.spread, sh.radius, pad);
  if (sh.shape === 'circle') return dist(px, py, ox, oy) <= sh.radius + pad;
  return inLine(px, py, ox, oy, ang, sh.length, sh.width, pad);
}
function applyShape(sh, ox, oy, ang) {
  const T = D.tamer;
  for (const m of D.mons) {
    if (m.dead || m.lassoed) continue;
    if (!inShape(sh, m.x, m.y, ox, oy, ang, 24)) continue;
    if (sh.dmg > 0) damageMon(m, sh.dmg);
    if (m.dead) continue;
    if (sh.stun) { m.stun = 2; cancelWarns(m); cancelBurst(m); }
    if (sh.knock) {
      const a = Math.atan2(m.y - T.y, m.x - T.x);
      m.kb = { vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, t: 0.25 };
    }
  }
  if (sh.reflect) {
    for (const h of D.hz) {
      if (h.dead || h.kind === 'icebeam' || h.reflected || h.phase !== 'fly') continue;
      if (!inShape(sh, h.x, h.y, ox, oy, ang, h.radius)) continue;
      const ow = h.owner;
      h.angle = (ow && !ow.dead && D.mons.indexOf(ow) >= 0) ? Math.atan2(ow.y - T.y, ow.x - T.x) : h.angle + Math.PI;
      h.speed *= 1.2; h.reflected = true; h.returning = false; h.t = 0;
    }
  }
  hitCracks(sh, ox, oy, ang);
}
function hitCracks(sh, ox, oy, ang) {
  const reach = (sh.radius || sh.length || 0) + 70;
  const c0 = Math.max(0, Math.floor((ox - reach) / TILE)), c1 = Math.min(MAPW - 1, Math.floor((ox + reach) / TILE));
  const r0 = Math.max(0, Math.floor((oy - reach) / TILE)), r1 = Math.min(MAPH - 1, Math.floor((oy + reach) / TILE));
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    if (D.grid[r][c] !== 'X') continue;
    if (!inShape(sh, c * TILE + 30, r * TILE + 30, ox, oy, ang, 0)) continue;
    const key = r * MAPW + c;
    D.cracks[key] = (D.cracks[key] || 0) + 1;
    if (D.cracks[key] >= 3) D.grid[r][c] = '.';
  }
}
function damageMon(m, dmg) {
  if (m.dead || m.lassoed) return;
  m.hp -= dmg; m.hitT = 0.1;
  if (D.ring.m === m) D.ring.t = 0;
  if (m.hp <= 0) killMon(m);
}
function killMon(m) {
  m.dead = true; cancelWarns(m); cancelBurst(m);
  m.nest.mon = null; m.nest.respawn = 10;
  const k = SP[m.sp].kill;
  G.gold += k; G.goldEarned += k;
  addDFloat(m.x, m.y - 40, '+' + k, 'gold');
  if (D.lasso && D.lasso.m === m) { D.lasso = null; }
  if (D.ring.m === m) { D.ring.m = null; D.ring.t = 0; }
}
function addDFloat(x, y, text, kind) { D.floats.push({ x, y, text, kind, t: 0, dur: 1 }); }

// ───────────────────────── 地下城: 魔物 ─────────────────────────
function dirDungeon(m) {
  const T = D.tamer, d = dist(m.x, m.y, T.x, T.y);
  if (d >= 300) return rnd(0, Math.PI * 2);
  const to = Math.atan2(T.y - m.y, T.x - m.x);
  if (d > 200) return to;
  if (d < 120) return to + Math.PI;
  return to + (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2;
}
function teleDungeon(m) {
  const b = roomBounds(m.room), T = D.tamer;
  if (dist(m.x, m.y, T.x, T.y) < 300) {
    for (let i = 0; i < 40; i++) {
      const x = rnd(b.x0, b.x1), y = rnd(b.y0, b.y1), d = dist(x, y, T.x, T.y);
      if (d >= 150 && d <= 250) return { x, y };
    }
  }
  return { x: rnd(b.x0, b.x1), y: rnd(b.y0, b.y1) };
}
function intervalWild(m) { return SP[m.sp].interval * (m.weak ? 1.5 : 1); }
function updateWild(m, dt) {
  const T = D.tamer;
  m.hitT = Math.max(0, m.hitT - dt);
  m.weak = m.hp <= m.maxHp * 0.3;
  const b = roomBounds(m.room);
  if (m.lassoed) { m.casting = false; return; }
  if (m.stun > 0) { m.stun = Math.max(0, m.stun - dt); m.casting = false; return; }
  if (m.kb) {
    m.x = clamp(m.x + m.kb.vx * dt, b.x0, b.x1); m.y = clamp(m.y + m.kb.vy * dt, b.y0, b.y1);
    m.kb.t -= dt; if (m.kb.t <= 0) m.kb = null;
  } else {
    moveMonster(m, dt, { b, dir: dirDungeon, tele: teleDungeon }, m.weak ? 0.5 : 1);
  }
  if (m.burst) stepBurst(m, dt);
  let warning = false;
  for (const h of D.hz) if (!h.dead && h.owner === m && h.phase === 'warn') warning = true;
  m.casting = warning || !!m.burst;
  const d = dist(m.x, m.y, T.x, T.y);
  if (d < 300) {
    if (!m.inRange) { m.inRange = true; m.castT = intervalWild(m); }
    m.castT -= dt;
    if (m.castT <= 0 && !m.casting) {
      emitSkill(m, T.x, T.y, newCast(m, 1, true));
      m.castT = intervalWild(m);
    }
  } else m.inRange = false;
}

// ───────────────────────── 地下城: 投射物 ─────────────────────────
function updateHazardsDungeon(dt) {
  const T = D.tamer;
  for (const h of D.hz) {
    if (h.dead) continue;
    if (h.owner && !h.owner.dead) { h.ox = h.owner.x; h.oy = h.owner.y; }
    if (h.kind === 'icebeam') {
      h.t += dt;
      if (h.phase === 'warn') {
        if (h.owner.dead || h.owner.stun > 0 || h.owner.lassoed) { killHz(h); continue; }
        if (h.t >= h.dur) {
          h.phase = 'active'; h.t = 0; h.dur = 0.2;
          if (lineHitsCircle(h, T.x, T.y, 18)) hurtTamer(h);
        }
      } else if (h.t >= h.dur) killHz(h);
      continue;
    }
    h.t += dt;
    if (h.t >= h.dur) { killHz(h); continue; }
    const step = h.speed * dt;
    if (h.kind === 'match' && !h.reflected && h.returning) {
      const ang = Math.atan2(h.oy - h.y, h.ox - h.x);
      h.angle = ang;
      if (dist(h.x, h.y, h.ox, h.oy) <= 20) { killHz(h); continue; }
    }
    h.x += Math.cos(h.angle) * step; h.y += Math.sin(h.angle) * step;
    if (h.kind === 'match' && !h.reflected && !h.returning) { h.trav += step; if (h.trav >= 280) h.returning = true; }
    if (solidAtPoint(h.x, h.y)) { killHz(h); continue; }
    if (h.reflected) {
      for (const m of D.mons) {
        if (m.dead || m.lassoed) continue;
        if (dist(h.x, h.y, m.x, m.y) <= h.radius + 24) { damageMon(m, 3 + G.atkBought); killHz(h); break; }
      }
      continue;
    }
    if (T.invuln <= 0 && !T.dash && dist(h.x, h.y, T.x, T.y) <= h.radius + 18) {
      if (h.kind === 'match') {
        if (!h.hit) h.hit = new Set();
        if (h.cast && h.hit.has(h.cast)) continue;
        if (h.cast) h.hit.add(h.cast);
        hurtTamer(h);   // 同一次施放只打一次
      } else { hurtTamer(h); killHz(h); }
    }
  }
  D.hz = D.hz.filter(h => !h.dead);
}

// ───────────────────────── 地下城: 傳送陣、捕捉 ─────────────────────────
function updatePortals(dt) {
  const T = D.tamer;
  D.pairCd[1] = Math.max(0, D.pairCd[1] - dt); D.pairCd[2] = Math.max(0, D.pairCd[2] - dt);
  for (const p of D.portals) {
    const d = dist(T.x, T.y, p.x, p.y);
    if (d > 40) p.armed = true;
    if (d <= 24 && p.armed && D.pairCd[p.id] <= 0) {
      p.charge += dt;
      if (p.charge >= 0.3) {
        const other = D.portals.find(q => q !== p && q.id === p.id);
        p.charge = 0;
        if (other) {
          T.x = other.x; T.y = other.y; other.armed = false; other.charge = 0;
          D.pairCd[p.id] = 1.5;
        }
      }
    } else p.charge = 0;
  }
}
function startLasso(m) {
  m.lassoed = true; cancelWarns(m); cancelBurst(m); m.casting = false;
  const T = D.tamer;
  D.lasso = { m, t: 0, limit: 5 + G.level.tanuki, sum: 0, last: Math.atan2(T.y - m.y, T.x - m.x) };
  D.ring.m = null; D.ring.t = 0;
}
function breakLasso() {
  if (!D.lasso) return;
  D.lasso.m.lassoed = false;
  D.lasso = null; D.ring.m = null; D.ring.t = 0;
}
function captureDone() {
  const L = D.lasso, m = L.m;
  D.ropes--;
  G.bank[m.sp]++; G.cap[m.sp]++;
  if (sumObj(G.stage) < 20) G.stage[m.sp]++;
  addDFloat(m.x, m.y - 40, '收服!', 'capture');
  m.dead = true; m.nest.mon = null; m.nest.respawn = 10;
  D.lasso = null; D.ring.m = null; D.ring.t = 0;
}
function updateCapture(dt) {
  const T = D.tamer;
  if (D.lasso) {
    const L = D.lasso, m = L.m;
    L.t += dt;
    const a = Math.atan2(T.y - m.y, T.x - m.x);
    L.sum += normAng(a - L.last); L.last = a;
    if (dist(T.x, T.y, m.x, m.y) > 220 || L.t >= L.limit) { breakLasso(); return; }
    if (Math.abs(L.sum) / (Math.PI * 2) >= 1) captureDone();
    return;
  }
  if (D.ropes <= 0) { D.ring.m = null; D.ring.t = 0; return; }
  let best = null, bd = 1e9;
  for (const m of D.mons) {
    if (m.dead || m.hp > m.maxHp * 0.3 || m.tp === 1) continue;
    const d = dist(T.x, T.y, m.x, m.y);
    if (d <= 40 && d < bd) { best = m; bd = d; }
  }
  if (!best) { D.ring.m = null; D.ring.t = 0; return; }
  if (D.ring.m !== best) { D.ring.m = best; D.ring.t = 0; }
  D.ring.t += dt;
  if (D.ring.t >= captureDur()) startLasso(best);
}

function updateDungeon(dt) {
  D.timeLeft -= dt;
  updateTamer(dt);
  updatePortals(dt);
  for (const n of D.nests) {
    if (!n.mon) { n.respawn -= dt; if (n.respawn <= 0) spawnWild(n); }
  }
  for (const m of D.mons) if (!m.dead) updateWild(m, dt);
  updateHazardsDungeon(dt);
  D.mons = D.mons.filter(m => !m.dead);
  updateCapture(dt);
  for (const f of D.fx) f.t += dt;
  D.fx = D.fx.filter(f => f.t < f.dur);
  for (const f of D.floats) f.t += dt;
  D.floats = D.floats.filter(f => f.t < f.dur);
  if (D.tamer.hearts <= 0 || D.timeLeft <= 0) endDungeon();
}
function endDungeon() {
  G.s1.cur = 0; G.s1.zone = 'card';
  D = null;
  setPhase('setup1');
}

// ───────────────────────── 布置第 1 步 ─────────────────────────
function ownedList() { return SPECIES.filter(sp => G.bank[sp] > 0); }
function bonusParts(sp, l) {
  switch (sp) {
    case 'lily': return ['花香 準備捕捉', '−' + (+(0.15 * l).toFixed(2)) + ' 秒'];
    case 'monkey': return ['靈巧 移速', '+' + 25 * l];
    case 'beetle': return ['齒輪 X 技冷卻', '−' + 15 * l + '%'];
    case 'parrot': return ['羽翼 Z 範圍', '+' + 10 * l + '%'];
    case 'penguin': return ['冰甲 心', '+' + l];
    default: return ['戲法 套索時限', '+' + l + ' 秒'];
  }
}
function upgradeLines(sp) {
  const l = G.level[sp];
  if (l >= 3) return ['已滿級'];
  const a = bonusParts(sp, l), b = bonusParts(sp, l + 1);
  return [
    '升級 Lv' + l + ' → Lv' + (l + 1) + ' 費用 ' + UP_COST[l] + ' 金',
    '紅區 ' + (80 - 5 * l) + '~100 → ' + (80 - 5 * (l + 1)) + '~100',
    a[0] + ' ' + a[1] + ' → ' + b[1],
  ];
}
function tryUpgrade(sp) {
  const l = G.level[sp];
  if (l >= 3 || G.bank[sp] <= 0 || G.gold < UP_COST[l]) return false;
  G.gold -= UP_COST[l]; G.level[sp]++;
  return true;
}
function setup1Input() {
  const list = ownedList(), s = G.s1;
  if (s.cur >= list.length) s.cur = Math.max(0, list.length - 1);
  const sp = list[s.cur];
  if (s.zone === 'card') {
    if (pressed.left) s.cur = Math.max(0, s.cur - 1);
    else if (pressed.right) s.cur = Math.min(list.length - 1, s.cur + 1);
    else if (pressed.down) s.zone = 'up';
    else if (pressed.z) { if (G.stage[sp] < G.bank[sp] && sumObj(G.stage) < 20) G.stage[sp]++; }
    else if (pressed.x) { if (G.stage[sp] > 0) G.stage[sp]--; }
  } else if (s.zone === 'up') {
    if (pressed.up) s.zone = 'card';
    else if (pressed.down) s.zone = 'next';
    else if (pressed.z) tryUpgrade(sp);
  } else {
    if (pressed.up) s.zone = 'up';
    else if (pressed.z && sumObj(G.stage) >= 1) { G.s2 = { row: 0, col: 0, panel: null }; setPhase('setup2'); }
  }
}

// ───────────────────────── 布置第 2 步 ─────────────────────────
function panelOptions(layer) {
  const out = [];
  if (layer === 'cue') CUES.forEach(c => { if (G.ownedCues[c.key]) out.push({ key: c.key, name: c.name, desc: c.desc }); });
  else PROGS.forEach(c => { if (G.ownedProgs[c.key]) out.push({ key: c.key, name: c.name, desc: c.desc }); });
  out.push({ key: 'clear', name: '清空', desc: '' });
  return out;
}
function setup2Input() {
  const s = G.s2;
  if (s.panel) {
    const p = s.panel;
    if (pressed.up) p.index = Math.max(0, p.index - 1);
    else if (pressed.down) p.index = Math.min(p.options.length - 1, p.index + 1);
    else if (pressed.x) s.panel = null;
    else if (pressed.z) {
      const o = p.options[p.index];
      G.rows[s.row][p.layer === 'cue' ? 'cue' : 'prog'] = o.key === 'clear' ? '' : o.key;
      s.panel = null;
    }
    return;
  }
  if (s.row === 6) {
    if (pressed.up) s.row = 5;
    else if (pressed.z) startShow();
    else if (pressed.x) setPhase('setup1');
    return;
  }
  if (pressed.up) s.row = Math.max(0, s.row - 1);
  else if (pressed.down) s.row++;
  else if (pressed.left) s.col = 0;
  else if (pressed.right) s.col = 1;
  else if (pressed.x) G.rows[s.row][s.col === 0 ? 'cue' : 'prog'] = '';
  else if (pressed.z) {
    const layer = s.col === 0 ? 'cue' : 'program';
    s.panel = { layer, options: panelOptions(layer === 'cue' ? 'cue' : 'prog'), index: 0 };
  }
}

// ───────────────────────── 表演場 ─────────────────────────
function startShow() {
  S = {
    left: 45, clock: 0, mons: [], hz: [], floats: [], banner: null,
    rows: G.rows.map(r => ({ cue: r.cue, prog: r.prog, complete: !!(r.cue && r.prog) })),
    cur: -1, waitT: 0, sinceFire: 0, ev: { chain3: false, multi3: false, loose: false },
    move: null, spots: [],
    fences: { top: [], bottom: [] }, vis: { top: [], bottom: [] },
  };
  for (let i = 0; i < 8; i++) {
    S.fences.top.push(false); S.fences.bottom.push(false);
    S.vis.top.push({ mode: 'watch', t: 0 }); S.vis.bottom.push({ mode: 'watch', t: 0 });
  }
  let idx = 0;
  for (const sp of SPECIES) for (let i = 0; i < G.stage[sp]; i++) {
    const p = SHOW_POS[idx++];
    S.mons.push({
      sp, lv: G.level[sp], x: p[0], y: p[1], rage: 60, marks: 0, markT: 0, markAdd: 0, slow: false,
      perfT: rnd(0.5, 2), perfAct: -1, relayT: -1, relayChain: 0, lastRelay: -99, frozen: 0, target: 0,
      state: 'roam', chargeT: 0, arrived: false, looseT: 0, side: 'top', fenceIdx: 0, runDir: 1, atkT: 0,
      fx: 'none', fxT: 0, progMove: false, hold: false,
      ang: rnd(0, Math.PI * 2), dirT: rnd(0.5, 2), cyc: rnd(0, 1), tp: 0, tpT: 0, teleT: rnd(0, 2.5), swooping: false,
      face: 1, move: 'walk', moveT: 0, moveDur: 0, burst: null,
    });
    if (sp === 'penguin' || sp === 'parrot') S.mons[S.mons.length - 1].cyc = rnd(0, 2);
  }
  S.cur = S.rows.findIndex(r => r.complete);
  setPhase('show');
}
const isRoam = m => m.state === 'roam';
function intervalShow(m) { return m.rage < 50 ? 6 : 4 - 2.5 * (m.rage - 50) / 50; }
function addSFloat(x, y, text, kind) { S.floats.push({ x, y, text, kind, t: 0, dur: 1 }); }

function pickAim(m) {
  let best = null, bd = 1e9;
  for (const o of S.mons) {
    if (o === m || !isRoam(o) || o.target <= 0) continue;
    const d = dist(m.x, m.y, o.x, o.y); if (d < bd) { bd = d; best = o; }
  }
  if (!best) for (const o of S.mons) {
    if (o === m || !isRoam(o) || (o.sp === 'tanuki' && o.tp === 1)) continue;
    const d = dist(m.x, m.y, o.x, o.y); if (d < bd) { bd = d; best = o; }
  }
  return best ? { x: best.x, y: best.y } : { x: 640, y: 356 };
}
function perform(m, chain) {
  m.perfAct = 0; m.perfT = intervalShow(m); m.relayT = -1;
  if (chain > G.bestChain) G.bestChain = chain;
  if (chain >= 3) S.ev.chain3 = true;
  const cast = newCast(m, chain, false);
  cast.red = m.rage >= redLow(m.sp);
  const t = pickAim(m);
  emitSkill(m, t.x, t.y, cast);
}
function checkSettle(c) {
  if (c.dungeon || c.settled || c.alive > 0) return;
  c.settled = true;
  if (G.phase !== 'show' || !S) return;
  const n = c.hits.size, m = c.owner, sp = SP[m.sp];
  if (n >= 3) S.ev.multi3 = true;
  const v = sp.gold * (1 + 0.5 * n) * (c.red ? 2 : 1) * (1 + 0.25 * (c.chain - 1)) * Math.min(3, 1 + G.rep / 300);
  const g = Math.max(1, Math.round(v));
  G.gold += g; G.goldEarned += g; G.rep += sp.rep;
  addSFloat(m.x, m.y - 70, '+' + g + (c.red ? ' ×2' : ''), c.red ? 'redGold' : 'gold');
  if (c.chain >= 2) addSFloat(m.x, m.y - 95, '連鎖 ' + c.chain, 'chain');
}

// 怒氣上升(點燃型): skill = 是否為技能(技能才會引發接演)
function igniteMon(m, amt, skill, chain) {
  const old = m.rage;
  m.rage = Math.min(100, m.rage + amt);
  m.fx = 'ignited'; m.fxT = 0;
  if (m.marks > 0) {
    if (m.markAdd <= 0) { m.marks++; m.markAdd = 1; m.markT = 4; if (m.marks >= 5) { goLoose(m); return; } }
  } else if (m.rage >= 100 && (old < 100 || m.slow)) {
    m.marks = 1; m.markT = 4; m.markAdd = 1; m.slow = false;
  }
  if (skill && m.rage >= redLow(m.sp) && m.relayT < 0 &&S.clock - m.lastRelay >= 1.5 && m.frozen <= 0) {
    m.relayT = 0.3; m.relayChain = chain + 1; m.lastRelay = S.clock;
  }
}
function calmSkillHit(m) {
  m.fx = 'doused'; m.fxT = 0;
  if (m.marks > 0) {
    m.marks--; m.markT = 4;
    if (m.marks === 0) { m.slow = true; m.markT = 0; }
  } else m.rage = Math.max(0, m.rage - 12);
}
function applySkillHit(h, v) {
  const kind = h.kind, c = h.cast;
  c.hits.add(v);
  if (kind === 'pollen') calmSkillHit(v);
  else if (kind === 'match') igniteMon(v, 10, true, c.chain);
  else if (kind === 'gear') igniteMon(v, 6, true, c.chain);
  else if (kind === 'feather') { v.target = 4; v.fx = 'special'; v.fxT = 0; }
  else if (kind === 'icebeam') { v.frozen = 1.5; v.fx = 'special'; v.fxT = 0; }
  else if (kind === 'card') { const p = randPoint(); v.x = p.x; v.y = p.y; v.fx = 'special'; v.fxT = 0; }
}
function randPoint() { return { x: rnd(SHOW_B.x0, SHOW_B.x1), y: rnd(SHOW_B.y0, SHOW_B.y1) }; }
function validVictim(h, v) { return isRoam(v) && v !== h.owner && !h.cast.hits.has(v); }

function updateHazardsShow(dt) {
  for (const h of S.hz) {
    if (h.dead) continue;
    if (h.owner && isRoam(h.owner)) { h.ox = h.owner.x; h.oy = h.owner.y; }
    else if (h.owner) { h.ox = h.owner.x; h.oy = h.owner.y; }
    if (h.kind === 'icebeam') {
      h.t += dt;
      if (h.phase === 'warn') {
        if (h.t >= h.dur) {
          h.phase = 'active'; h.t = 0; h.dur = 0.2;
          for (const v of S.mons) if (validVictim(h, v) && inLine(v.x, v.y, h.x, h.y, h.angle, h.length, h.width, 0)) applySkillHit(h, v);
        }
      } else if (h.t >= h.dur) killHz(h);
      continue;
    }
    h.t += dt;
    if (h.t >= h.dur) { killHz(h); continue; }
    const step = h.speed * dt;
    if (h.kind === 'match' && h.returning) {
      h.angle = Math.atan2(h.oy - h.y, h.ox - h.x);
      if (dist(h.x, h.y, h.ox, h.oy) <= 20) { killHz(h); continue; }
    }
    h.x += Math.cos(h.angle) * step; h.y += Math.sin(h.angle) * step;
    if (h.kind === 'match' && !h.returning) { h.trav += step; if (h.trav >= 280) h.returning = true; }
    if (h.x < ARENA.x0 || h.x > ARENA.x1 || h.y < ARENA.y0 || h.y > ARENA.y1) { killHz(h); continue; }
    for (const v of S.mons) {
      if (!validVictim(h, v)) continue;
      if (dist(h.x, h.y, v.x, v.y) <= h.radius + 24) {
        applySkillHit(h, v);
        if (h.kind !== 'match') { killHz(h); break; }
      }
    }
  }
  S.hz = S.hz.filter(h => !h.dead);
}

function goLoose(m) {
  m.state = 'charge'; m.arrived = false; m.chargeT = 0; m.marks = 0; m.markT = 0; m.slow = false;
  m.frozen = 0; m.target = 0; m.relayT = -1; m.hold = false; m.progMove = false;
  m.side = m.y < 356 ? 'top' : 'bottom';
  m.fenceIdx = clamp(Math.round((m.x - 165) / 136), 0, 7);
  m.move = 'walk'; m.moveT = 0; m.moveDur = 0;
  cancelBurst(m);
  S.ev.loose = true;
}
function updateLoose(m, dt) {
  const fy = m.side === 'top' ? 140 : 572, fx = 165 + 136 * m.fenceIdx;
  const fences = S.fences[m.side];
  if (m.state === 'charge') {
    if (!m.arrived) {
      const d = dist(m.x, m.y, fx, fy), st = 160 * dt;
      if (d <= st + 1) { m.x = fx; m.y = fy; m.arrived = true; m.chargeT = 0; if (fences[m.fenceIdx]) startLoose(m); }
      else { m.x += (fx - m.x) / d * st; m.y += (fy - m.y) / d * st; m.face = fx > m.x ? 1 : -1; }
    } else {
      m.chargeT += dt;
      if (m.chargeT >= 1.5) { fences[m.fenceIdx] = true; startLoose(m); }
    }
    return;
  }
  m.looseT += dt;
  const ay = m.side === 'top' ? 95 : 622;
  m.y += clamp(ay - m.y, -140 * dt, 140 * dt);
  m.x += m.runDir * 140 * dt;
  if (m.x < 130) { m.x = 130; m.runDir = 1; } else if (m.x > 1150) { m.x = 1150; m.runDir = -1; }
  m.face = m.runDir;
  m.atkT += dt;
  if (m.atkT >= 1.5) {
    m.atkT -= 1.5;
    let best = -1, bd = 1e9;
    S.vis[m.side].forEach((v, i) => { if (v.mode === 'watch') { const d = Math.abs(165 + 136 * i - m.x); if (d < bd) { bd = d; best = i; } } });
    if (best >= 0) {
      S.vis[m.side][best].mode = 'scared'; S.vis[m.side][best].t = 0;
      G.rep = Math.max(0, G.rep - 3);
      addSFloat(m.x, m.y + 30, '名聲 −3', 'repDown');
    }
  }
  if (m.looseT >= 6) {
    m.state = 'roam'; m.x = 640; m.y = 356; m.rage = 30; m.marks = 0; m.markT = 0; m.slow = false;
    m.perfT = intervalShow(m); m.looseT = 0; m.chargeT = 0;
  }
}
function startLoose(m) {
  m.state = 'loose'; m.looseT = 0; m.atkT = 0; m.runDir = Math.random() < 0.5 ? 1 : -1;
}

function updateShowMon(m, dt) {
  if (m.fx !== 'none') { m.fxT += dt; if (m.fxT >= 0.5) { m.fx = 'none'; m.fxT = 0; } }
  if (m.perfAct >= 0) { m.perfAct += dt; if (m.perfAct >= 0.5) m.perfAct = -1; }
  if (m.state !== 'roam') { updateLoose(m, dt); return; }
  if (m.target > 0) m.target = Math.max(0, m.target - dt);
  if (m.markAdd > 0) m.markAdd = Math.max(0, m.markAdd - dt);
  const frozen = m.frozen > 0;
  if (frozen) m.frozen = Math.max(0, m.frozen - dt);
  // 標記自動遞減
  if (m.marks > 0) {
    m.markT -= dt;
    if (m.markT <= 0) {
      m.marks--; m.markT = 4;
      if (m.marks === 0) { m.slow = true; m.markT = 0; }
    }
  }
  // 自然下降
  if (!frozen && m.marks === 0) {
    if (m.slow) { m.rage = Math.max(0, m.rage - 2 * dt); if (m.rage < redLow(m.sp)) m.slow = false; }
    else m.rage = Math.max(0, m.rage - SP[m.sp].decay * dt);
  }
  // 連射
  if (m.burst && !frozen) stepBurst(m, dt);
  // 表演計時與接演
  if (!frozen) {
    if (m.relayT >= 0) {
      m.relayT -= dt;
      if (m.relayT <= 0) { const ch = m.relayChain; m.relayT = -1; perform(m, ch); }
    }
    m.perfT -= dt;
    if (m.perfT <= 0 && isRoam(m)) perform(m, 1);
  }
  // 移動: 凍結 > 節目移動 > 自己的模式
  m.progMove = false; m.hold = false;
  if (frozen) return;
  const mv = S.move;
  if (mv && mv.left > 0) {
    if (mv.type === 'mob') {
      if (m === mv.target) { m.hold = true; return; }
      const t = mv.target, d = dist(m.x, m.y, t.x, t.y);
      m.progMove = true;
      if (d > 80) {
        const st = Math.min(130 * dt, d - 80);
        m.x += (t.x - m.x) / d * st; m.y += (t.y - m.y) / d * st; m.face = t.x > m.x ? 1 : -1;
      }
      m.move = 'walk'; m.moveT = 0; m.moveDur = 0;
      return;
    }
    if (mv.type === 'scatter') {
      let near = null, nd = 1e9;
      for (const o of S.mons) if (o !== m && isRoam(o)) { const d = dist(m.x, m.y, o.x, o.y); if (d < nd) { nd = d; near = o; } }
      m.progMove = true; m.move = 'walk'; m.moveT = 0; m.moveDur = 0;
      if (near) {
        let ax = m.x - near.x, ay = m.y - near.y;
        if (nd < 1) { const a = rnd(0, Math.PI * 2); ax = Math.cos(a); ay = Math.sin(a); nd = 1; }
        m.x = clamp(m.x + ax / nd * 120 * dt, SHOW_B.x0, SHOW_B.x1);
        m.y = clamp(m.y + ay / nd * 120 * dt, SHOW_B.y0, SHOW_B.y1);
        if (Math.abs(ax) > 1) m.face = ax > 0 ? 1 : -1;
      }
      return;
    }
  }
  moveMonster(m, dt, { b: SHOW_B, dir: () => rnd(0, Math.PI * 2), tele: teleShow }, 1);
}
function teleShow(m) {
  for (let i = 0; i < 40; i++) {
    const a = rnd(0, Math.PI * 2), r = rnd(0, 300);
    const x = m.x + Math.cos(a) * r, y = m.y + Math.sin(a) * r;
    if (x >= SHOW_B.x0 && x <= SHOW_B.x1 && y >= SHOW_B.y0 && y <= SHOW_B.y1) return { x, y };
  }
  return { x: clamp(m.x, SHOW_B.x0, SHOW_B.x1), y: clamp(m.y, SHOW_B.y0, SHOW_B.y1) };
}

// 暗號節目單引擎
function cueTrue(key) {
  const act = S.mons.filter(isRoam);
  switch (key) {
    case 'wait': return S.sinceFire >= 6;
    case 'red3': return act.filter(m => m.rage >= redLow(m.sp)).length >= 3;
    case 'mark3': return act.some(m => m.marks >= 3);
    case 'cold': return act.length > 0 && act.filter(m => m.rage < 50).length * 2 >= act.length;
    case 'chain3': return S.ev.chain3;
    case 'multi3': return S.ev.multi3;
    case 'loose': return S.ev.loose;
  }
  return false;
}
function nextComplete(from) {
  for (let i = 1; i <= 6; i++) { const j = (from + i) % 6; if (S.rows[j].complete) return j; }
  return from;
}
function updateProgram(dt) {
  if (S.cur < 0) return;
  S.sinceFire += dt;
  if (S.waitT > 0) { S.waitT -= dt; if (S.waitT > 0) return; S.waitT = 0; }
  const row = S.rows[S.cur];
  if (cueTrue(row.cue)) {
    S.cur = nextComplete(S.cur);
    S.waitT = 1.5; S.sinceFire = 0;
    S.ev = { chain3: false, multi3: false, loose: false };
    fireProgram(row);
  }
}
function pickTop(act) {
  let best = [];
  let hi = -1;
  for (const m of act) if (m.rage > hi) hi = m.rage;
  best = act.filter(m => m.rage === hi);
  let mk = -1; for (const m of best) if (m.marks > mk) mk = m.marks;
  best = best.filter(m => m.marks === mk);
  return best[Math.floor(Math.random() * best.length)] || null;
}
function fireProgram(row) {
  S.banner = { cue: row.cue, prog: row.prog, t: 0 };
  const act = S.mons.filter(isRoam);
  switch (row.prog) {
    case 'ice':
      for (const m of act) if (m.rage >= redLow(m.sp) && m.marks === 0) { m.rage = Math.max(0, m.rage - 20); m.fx = 'doused'; m.fxT = 0; }
      break;
    case 'pep':
      for (const m of act) if (m.rage < 50) igniteMon(m, 25, false, 0);
      break;
    case 'scatter': S.move = { type: 'scatter', left: 3, target: null }; act.forEach(m => { m.fx = 'special'; m.fxT = 0; }); break;
    case 'mob': {
      const t = pickTop(act);
      if (t) { S.move = { type: 'mob', left: 3, target: t }; act.forEach(m => { m.fx = 'special'; m.fxT = 0; }); }
      break;
    }
    case 'tutti':
      for (const m of act) if (m.rage >= redLow(m.sp) && m.frozen <= 0) perform(m, 1);
      break;
    case 'lull':
      for (const m of act) if (m.marks > 0) { m.marks = 0; m.markT = 0; m.rage = 75; m.slow = false; m.fx = 'doused'; m.fxT = 0; }
      break;
    case 'spot': {
      const t = pickTop(act);
      if (t) {
        if (t.frozen <= 0) perform(t, 1);
        S.spots.push({ m: t, left: 0.6 }, { m: t, left: 1.2 });
      }
      break;
    }
    case 'shuffle': {
      const placed = [];
      for (const m of act) {
        let minD = 60, p = null;
        while (!p) {
          for (let i = 0; i < 40; i++) {
            const q = randPoint();
            if (placed.every(o => dist(q.x, q.y, o.x, o.y) >= minD)) { p = q; break; }
          }
          minD *= 0.7;
          if (minD < 1) p = randPoint();
        }
        m.x = p.x; m.y = p.y; placed.push(p); m.fx = 'special'; m.fxT = 0;
      }
      break;
    }
  }
}

function updateShow(dt) {
  S.clock += dt; S.left -= dt;
  updateProgram(dt);
  if (S.move) { S.move.left -= dt; if (S.move.left <= 0 || (S.move.type === 'mob' && !isRoam(S.move.target))) S.move = null; }
  for (const m of S.mons) updateShowMon(m, dt);
  for (const sp of S.spots) {
    sp.left -= dt;
    if (sp.left <= 0 && !sp.done) { sp.done = true; if (isRoam(sp.m) && sp.m.frozen <= 0) perform(sp.m, 1); }
  }
  S.spots = S.spots.filter(s => !s.done);
  updateHazardsShow(dt);
  if (S.banner) { S.banner.t += dt; if (S.banner.t >= 0.8) S.banner = null; }
  for (const f of S.floats) f.t += dt;
  S.floats = S.floats.filter(f => f.t < f.dur);
  for (const side of ['top', 'bottom']) for (const v of S.vis[side]) {
    if (v.mode === 'watch') continue;
    v.t += dt;
    if (v.t >= 4) { v.mode = 'watch'; v.t = 0; } else if (v.t >= 0.8) v.mode = 'empty';
  }
  if (S.left <= 0) endShow();
}
function endShow() {
  for (const m of S.mons) if (!isRoam(m)) G.rep = Math.max(0, G.rep - 5);
  S = null;
  if (G.day >= DAY_MAX) setPhase('result');
  else { G.shop = { tab: 0, zone: 'tab', idx: 0 }; setPhase('shop'); }
}

// ───────────────────────── 商店 ─────────────────────────
const SHOP_TABS = ['char', 'show', 'monster'];
const SHOP_ITEMS = {
  char: ['club', 'sword', 'spear', 'whip', 'attack', 'armor', 'ropeBag'],
  show: ['chain3', 'multi3', 'loose', 'tutti', 'lull', 'spot', 'shuffle'],
  monster: SPECIES,
};
const WEAPON_PRICE = { sword: 60, spear: 60, whip: 60 };
const WEAPON_DESC = { club: 'Z 敲擊 X 無', sword: 'Z 斬擊可打回飛彈 X 擊暈', spear: 'Z 長刺 X 突進', whip: 'Z 整圈抽打 X 擊飛' };
const ENH_DESC = { attack: '每次攻擊傷害 +1', armor: '心上限 +1', ropeBag: '每天捕獸繩 +1' };
function shopState(item) {
  const o = { item, cost: 0, level: 0, owned: false, equipped: false, affordable: false, maxed: false, locked: false, effect: '' };
  if (WEAPON_DESC[item]) {
    o.owned = !!G.ownedWeapons[item]; o.equipped = G.weapon === item;
    o.cost = o.owned ? 0 : WEAPON_PRICE[item]; o.affordable = !o.owned && G.gold >= o.cost;
  } else if (ENH_DESC[item]) {
    o.cost = G.prices[item]; o.affordable = G.gold >= o.cost;
    o.level = item === 'attack' ? G.atkBought : item === 'armor' ? G.armorBought : G.ropeBought;
  } else if (CUE_BY[item]) {
    o.owned = !!G.ownedCues[item]; o.cost = o.owned ? 0 : CUE_BY[item].price; o.affordable = !o.owned && G.gold >= o.cost;
  } else if (PROG_BY[item]) {
    o.owned = !!G.ownedProgs[item]; o.cost = o.owned ? 0 : PROG_BY[item].price; o.affordable = !o.owned && G.gold >= o.cost;
  } else if (SP[item]) {
    const l = G.level[item];
    o.level = l; o.maxed = l >= 3; o.locked = G.bank[item] <= 0; o.effect = SP[item].effect;
    o.cost = o.maxed ? 0 : UP_COST[l]; o.affordable = !o.maxed && !o.locked && G.gold >= o.cost;
  }
  return o;
}
function shopDetailLines(item) {
  if (WEAPON_DESC[item]) return [WEAPON_DESC[item]];
  if (ENH_DESC[item]) return [ENH_DESC[item]];
  if (CUE_BY[item]) return [CUE_BY[item].desc];
  if (PROG_BY[item]) return [PROG_BY[item].desc];
  if (SP[item]) return G.bank[item] > 0 ? upgradeLines(item) : ['未收服'];
  return [];
}
function shopBuy(item) {
  const st = shopState(item);
  if (WEAPON_DESC[item]) {
    if (st.owned) { G.weapon = item; return; }
    if (G.gold >= st.cost) { G.gold -= st.cost; G.ownedWeapons[item] = true; G.weapon = item; }
  } else if (ENH_DESC[item]) {
    if (G.gold < st.cost) return;
    G.gold -= st.cost; G.prices[item] = Math.round(G.prices[item] * 1.5);
    if (item === 'attack') G.atkBought++; else if (item === 'armor') G.armorBought++; else G.ropeBought++;
  } else if (CUE_BY[item]) {
    if (!st.owned && G.gold >= st.cost) { G.gold -= st.cost; G.ownedCues[item] = true; }
  } else if (PROG_BY[item]) {
    if (!st.owned && G.gold >= st.cost) { G.gold -= st.cost; G.ownedProgs[item] = true; }
  } else if (SP[item]) tryUpgrade(item);
}
function shopInput() {
  const s = G.shop, items = SHOP_ITEMS[SHOP_TABS[s.tab]], n = items.length;
  const rows = Math.ceil(n / 3);
  if (s.zone === 'tab') {
    if (pressed.left) { s.tab = Math.max(0, s.tab - 1); s.idx = 0; }
    else if (pressed.right) { s.tab = Math.min(2, s.tab + 1); s.idx = 0; }
    else if (pressed.down) { s.zone = 'grid'; s.idx = 0; }
  } else if (s.zone === 'grid') {
    const r = Math.floor(s.idx / 3), c = s.idx % 3;
    if (pressed.left) { if (c > 0) s.idx--; }
    else if (pressed.right) { if (c < 2 && s.idx + 1 < n) s.idx++; }
    else if (pressed.up) { if (r > 0) s.idx -= 3; else s.zone = 'tab'; }
    else if (pressed.down) { if (s.idx + 3 < n) s.idx += 3; else s.zone = 'go'; }
    else if (pressed.z) shopBuy(items[s.idx]);
  } else {
    if (pressed.up) { s.zone = 'grid'; s.idx = (rows - 1) * 3; }
    else if (pressed.z) { G.day++; G.selCur = 0; setPhase('select'); }
  }
}

// ───────────────────────── 主更新 ─────────────────────────
function update(dt) {
  switch (G.phase) {
    case 'dungeon': updateDungeon(dt); break;
    case 'show': updateShow(dt); break;
    case 'guide': guideInput(); break;
    case 'select': selectInput(); break;
    case 'setup1': setup1Input(); break;
    case 'setup2': setup2Input(); break;
    case 'shop': shopInput(); break;
    case 'result': if (pressed.z) { newRun('select'); } break;
  }
  pressed = {};
  checkUnlock();
}

// ───────────────────────── 繪製 ─────────────────────────
const FONT = '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif';
function hudState(message) {
  const ph = G.phase, inD = ph === 'dungeon' && D;
  return {
    phase: ph, day: G.day, dayMax: DAY_MAX, gold: G.gold, rep: G.rep,
    hearts: inD ? D.tamer.hearts : 0, maxHearts: inD ? D.tamer.maxHearts : 0,
    ropes: inD ? D.ropes : 0, ropeMax: inD ? ropeMaxNow() : 0,
    weapon: G.weapon, xCdLeft: inD ? D.tamer.xCd : 0, xCdMax: inD ? xCdMax() : 0,
    timeLeft: inD ? Math.max(0, D.timeLeft) : ph === 'show' && S ? Math.max(0, S.left) : 0,
    timeMax: inD ? 75 : ph === 'show' ? 45 : 0,
    dungeon: inD ? D.id : '', message: message || '',
  };
}
function drawHazards(list, solidPhase, ox, oy) {
  for (const h of list) {
    const isBeam = h.kind === 'icebeam';
    if (isBeam !== solidPhase) continue;
    Art.drawHazard(ctx, { x: h.x - ox, y: h.y - oy, kind: h.kind, phase: h.phase, radius: h.radius, angle: h.angle, length: h.length, width: h.width,
      t: h.t, dur: h.dur, returning: h.returning, reflected: h.reflected });
  }
}
function tileKind(ch) { return ch === '#' ? 'wall' : ch === 'o' ? 'pillar' : ch === 'L' ? 'hurt' : ch === 'W' ? 'slow' : 'floor'; }

function renderDungeon() {
  const T = D.tamer, id = D.id;
  const cx = clamp(T.x - 640, 0, 640), cy = clamp(T.y - 310, 0, 340);
  const ox = cx, oy = cy - 100;   // 畫面 = 世界 − ox, 世界 − oy
  Art.drawBackground(ctx, {});
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 100, CW, CH - 100); ctx.clip();
  const c0 = Math.floor(cx / TILE), c1 = Math.min(MAPW - 1, Math.floor((cx + 1280) / TILE));
  const r0 = Math.floor(cy / TILE), r1 = Math.min(MAPH - 1, Math.floor((cy + 620) / TILE));
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    const ch = D.grid[r][c], x = c * TILE + 30 - ox, y = r * TILE + 30 - oy;
    if (ch === 'X') Art.drawCrackWall(ctx, { x, y, dungeon: id, cracks: D.cracks[r * MAPW + c] || 0 });
    else Art.drawTile(ctx, { x, y, dungeon: id, kind: tileKind(ch), nest: ch === 'n' });
  }
  for (const p of D.portals) {
    const x = p.x - ox, y = p.y - oy;
    if (x < -60 || x > CW + 60 || y < 40 || y > CH + 60) continue;
    Art.drawPortal(ctx, { x, y, dungeon: id, id: p.id, charge: clamp(p.charge / 0.3, 0, 1), cooling: D.pairCd[p.id] > 0 });
  }
  drawHazards(D.hz, true, ox, oy);
  if (D.ring.m) Art.drawCaptureRing(ctx, { x: D.ring.m.x - ox, y: D.ring.m.y - oy, t: D.ring.t, dur: captureDur() });
  for (const m of D.mons) {
    const x = m.x - ox, y = m.y - oy;
    if (x < -90 || x > CW + 90 || y < 10 || y > CH + 90) continue;
    Art.drawWildMonster(ctx, { x, y, species: m.sp, hp: m.hp, maxHp: m.maxHp, hit: m.hitT > 0, weak: m.hp <= m.maxHp * 0.3,
      stunLeft: m.stun, stunDur: 2, lassoed: m.lassoed, casting: m.casting, move: m.move, moveT: m.moveT, moveDur: m.moveDur, dir: m.face });
  }
  if (D.lasso) {
    const L = D.lasso, m = L.m;
    Art.drawLasso(ctx, { x1: T.x - ox, y1: T.y - oy, x2: m.x - ox, y2: m.y - oy, progress: clamp(Math.abs(L.sum) / (Math.PI * 2), 0, 1),
      t: L.t, limit: L.limit, len: dist(T.x, T.y, m.x, m.y), maxLen: 220 });
  }
  Art.drawTamer(ctx, { x: T.x - ox, y: T.y - oy, facing: T.facing, weapon: T.weapon, dashing: !!T.dash, blink: T.invuln > 0,
    lassoing: !!D.lasso, slowed: T.slowT > 0 });
  for (const f of D.fx) {
    Art.drawWeaponFx(ctx, { x: f.x - ox, y: f.y - oy, weapon: f.weapon, move: f.move, shape: f.shape, angle: f.angle, spread: f.spread,
      radius: f.radius, length: f.length, width: f.width, t: f.t, dur: f.dur });
  }
  drawHazards(D.hz, false, ox, oy);
  for (const f of D.floats) Art.drawFloatText(ctx, { x: f.x - ox, y: f.y - oy - f.t * 30, text: f.text, kind: f.kind, t: f.t, dur: f.dur });
  ctx.restore();
  const msg = D.lasso ? '繞牠一圈!' : D.ring.m ? '站住別動' : 'Z 攻擊 X 武器技';
  Art.drawHud(ctx, hudState(msg));
}

function renderShow() {
  Art.drawShowArena(ctx, {});
  drawHazards(S.hz, true, 0, 0);
  for (const m of S.mons) {
    const loose = m.state !== 'roam';
    let mode = 'roam';
    if (m.state === 'charge') mode = 'charge'; else if (m.state === 'loose') mode = 'loose';
    else if (m.hold) mode = 'hold'; else if (m.progMove) mode = 'program';
    Art.drawShowMonster(ctx, {
      x: m.x, y: m.y, species: m.sp, level: m.lv, rage: m.rage, redLow: redLow(m.sp),
      marks: loose ? 0 : m.marks, markLeft: m.marks > 0 ? Math.max(0, m.markT) : 0, markDur: 4, mode, target: m.target > 0,
      frozenLeft: m.frozen, frozenDur: 1.5, performing: m.perfAct >= 0, performT: m.perfAct >= 0 ? m.perfAct : 0, performDur: 0.5,
      fx: m.fx, fxT: m.fx === 'none' ? 0 : m.fxT, fxDur: 0.5,
      chargeT: m.state === 'charge' && m.arrived ? m.chargeT : 0, chargeDur: 1.5,
      looseT: m.state === 'loose' ? m.looseT : 0, looseDur: 6,
      move: m.move, moveT: m.moveT, moveDur: m.moveDur, dir: m.face,
    });
  }
  drawHazards(S.hz, false, 0, 0);
  if (S.banner) Art.drawBannerFx(ctx, { x: 640, y: 180, cue: S.banner.cue, program: S.banner.prog, t: S.banner.t, dur: 0.8 });
  for (const side of ['top', 'bottom']) {
    for (let i = 0; i < 8; i++) {
      Art.drawFence(ctx, { x: 165 + 136 * i, y: side === 'top' ? 140 : 572, side, broken: S.fences[side][i] });
      Art.drawVisitor(ctx, { x: 165 + 136 * i, y: side === 'top' ? 95 : 622, side, mode: S.vis[side][i].mode });
    }
  }
  for (let i = 0; i < 6; i++) {
    const r = S.rows[i], cur = i === S.cur;
    const waiting = cur && r.cue === 'wait' && S.waitT <= 0;
    Art.drawCueRow(ctx, { x: 110 + 212 * i, y: 691, style: 'mini', index: i, cue: r.cue, program: r.prog, complete: r.complete, selCell: -1,
      current: cur, t: waiting ? Math.min(6, S.sinceFire) : 0, dur: waiting ? 6 : 0, switching: cur && S.waitT > 0 });
  }
  for (const f of S.floats) Art.drawFloatText(ctx, { x: f.x, y: f.y - f.t * 30, text: f.text, kind: f.kind, t: f.t, dur: f.dur });
  Art.drawHud(ctx, hudState('表演中…'));
}

function renderGuide() {
  Art.drawBackground(ctx, {});
  const pg = GUIDE[G.guidePage];
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 40px ' + FONT; ctx.fillText(pg.t, CW / 2, 90);
  ctx.font = '26px ' + FONT; ctx.fillText(pg.s, CW / 2, 150);
  Art.drawGuidePage(ctx, { page: G.guidePage + 1, x: 140, y: 190, w: 1000, h: 420 });
  ctx.fillStyle = '#fff'; ctx.font = '22px ' + FONT;
  ctx.fillText((G.guidePage + 1) + ' / ' + GUIDE.length, CW / 2, 640);
  ctx.font = '20px ' + FONT;
  ctx.fillText(G.guidePage >= GUIDE.length - 1 ? 'Z 開始遊戲   X 上一頁' : 'Z 下一頁   X 上一頁', CW / 2, 685);
  ctx.restore();
  Art.drawHud(ctx, hudState(''));
}

function renderSetup1() {
  const list = ownedList(), s = G.s1, total = sumObj(G.stage);
  Art.drawBackground(ctx, {});
  list.forEach((sp, i) => {
    Art.drawSpeciesCard(ctx, { x: 160 + 192 * i, y: 230, species: sp, level: G.level[sp], effect: SP[sp].effect, owned: G.bank[sp], onStage: G.stage[sp],
      selected: s.zone === 'card' && i === s.cur });
  });
  const cur = list[Math.min(s.cur, list.length - 1)];
  Art.drawSpeciesInfo(ctx, { x: 500, y: 490, species: cur, desc: SP[cur].desc, total, totalMax: 20, lines: upgradeLines(cur) });
  Art.drawButton(ctx, { x: 960, y: 410, w: 220, h: 70, label: '升級', selected: s.zone === 'up' });
  Art.drawButton(ctx, { x: 960, y: 510, w: 220, h: 70, label: '下一步', selected: s.zone === 'next' });
  const msg = s.zone === 'card' ? '←→ 選 Z 上場+1 X 上場−1 ↓ 升級/下一步' : 'Z 確定 ↑ 回卡片';
  Art.drawHud(ctx, hudState(msg));
}

function renderSetup2() {
  const s = G.s2;
  Art.drawBackground(ctx, {});
  for (let i = 0; i < 6; i++) {
    const r = G.rows[i];
    Art.drawCueRow(ctx, { x: 380, y: 100 + 78 * i, style: 'row', index: i, cue: r.cue, program: r.prog, complete: !!(r.cue && r.prog),
      selCell: s.row === i ? s.col : -1, current: false, t: 0, dur: 0, switching: false });
  }
  Art.drawButton(ctx, { x: 280, y: 580, w: 200, h: 70, label: '開演', selected: s.row === 6 });
  if (s.panel) Art.drawPickerPanel(ctx, { layer: s.panel.layer, options: s.panel.options, index: s.panel.index });
  const msg = s.panel ? '↑↓ 選 Z 確定 X 取消' : s.row === 6 ? 'Z 開演 X 回上一步' : '↑↓ 選列 ←→ 暗號/節目 Z 放入 X 清空';
  Art.drawHud(ctx, hudState(msg));
}

function renderShop() {
  const s = G.shop, tabName = SHOP_TABS[s.tab], items = SHOP_ITEMS[tabName];
  Art.drawBackground(ctx, {});
  SHOP_TABS.forEach((t, i) => Art.drawShopTab(ctx, { x: 400 + 240 * i, y: 85, tab: t, current: i === s.tab, selected: s.zone === 'tab' && i === s.tab }));
  items.forEach((it, i) => {
    const st = shopState(it);
    st.x = 220 + 420 * (i % 3); st.y = 190 + 115 * Math.floor(i / 3); st.selected = s.zone === 'grid' && s.idx === i;
    Art.drawShopItem(ctx, st);
  });
  Art.drawShopDetail(ctx, { x: 640, y: 570, lines: s.zone === 'grid' ? shopDetailLines(items[s.idx]) : [] });
  Art.drawButton(ctx, { x: 540, y: 625, w: 200, h: 70, label: '出發', selected: s.zone === 'go' });
  Art.drawHud(ctx, hudState('←→ 切分頁 方向鍵選擇 Z 購買'));
}

function renderResult() {
  Art.drawBackground(ctx, {});
  const bank = SPECIES.filter(sp => G.bank[sp] > 0).map(sp => ({ species: sp, count: G.bank[sp], level: G.level[sp] }));
  const stars = G.rep >= 1000 ? 3 : G.rep >= 650 ? 2 : G.rep >= 300 ? 1 : 0;
  Art.drawResultPanel(ctx, { rep: G.rep, goldEarned: G.goldEarned, bestChain: G.bestChain, bank, stars });
  Art.drawHud(ctx, hudState('按 Z 重來'));
}

function render() {
  switch (G.phase) {
    case 'dungeon': renderDungeon(); break;
    case 'show': renderShow(); break;
    case 'guide': renderGuide(); break;
    case 'select': {
      Art.drawBackground(ctx, {});
      DUNGEON_ORDER.forEach((id, i) => Art.drawDungeonCard(ctx, { x: 240 + 400 * i, y: 390, dungeon: id, open: !!G.unlocked[id], condition: dungeonCondition(id), selected: i === G.selCur }));
      Art.drawHud(ctx, hudState('←→ 選擇 Z 進入 ↑ 說明'));
      break;
    }
    case 'setup1': renderSetup1(); break;
    case 'setup2': renderSetup2(); break;
    case 'shop': renderShop(); break;
    case 'result': renderResult(); break;
  }
}

// ───────────────────────── 啟動 ─────────────────────────
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let dpr = 1;
function resize() {
  dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(CW * dpr); canvas.height = Math.round(CH * dpr);
  const s = Math.min(window.innerWidth / CW, window.innerHeight / CH);
  canvas.style.width = Math.floor(CW * s) + 'px'; canvas.style.height = Math.floor(CH * s) + 'px';
}
window.addEventListener('resize', resize);
resize();

newRun('guide');
let lastTs = 0;
function frame(ts) {
  if (!lastTs) lastTs = ts;
  const dt = Math.min((ts - lastTs) / 1000, 1 / 30);
  lastTs = ts;
  try {
    update(dt);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, CW, CH);
    render();
  } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
