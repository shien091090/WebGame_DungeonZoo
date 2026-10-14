'use strict';
/* 來動物園看一點大場面(打磨版)— 玩法驗證 Demo。只用方向鍵 + Z、X。
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
function fmtNum(v) { return String(+v.toFixed(2)); }

// ───────────────────────── 聲音(全部走這一層; Sound 不存在也不會壞) ─────────────────────────
const Snd = {
  muted: false, ready: false, want: null, cur: undefined, frame: {},
  init() {
    if (this.ready) return;
    this.ready = true;
    try { if (typeof Sound !== 'undefined' && Sound.init) Sound.init(); } catch (e) { console.error(e); }
    this.cur = undefined; this.sync();
  },
  play(n, a) {
    if (this.muted || !this.ready) return;
    try { if (typeof Sound !== 'undefined' && Sound.play) Sound.play(n, a); } catch (e) { console.error(e); }
  },
  once(n, a) { if (this.frame[n]) return; this.frame[n] = true; this.play(n, a); },
  music(n) { this.want = n; this.sync(); },
  sync() {
    if (!this.ready) return;
    const w = this.muted ? null : this.want;
    if (w === this.cur) return;
    this.cur = w;
    try {
      if (typeof Sound === 'undefined') return;
      if (w) { if (Sound.playMusic) Sound.playMusic(w); }
      else if (Sound.stopMusic) Sound.stopMusic();
      else if (Sound.playMusic) Sound.playMusic(null);
    } catch (e) { console.error(e); }
  },
  toggleMute() {
    this.muted = !this.muted;
    try { if (typeof Sound !== 'undefined' && Sound.setMuted) Sound.setMuted(this.muted); } catch (e) { console.error(e); }
    this.sync();
  },
};

// ───────────────────────── 埋點 ─────────────────────────
const LOG = { startMs: 0, startedAt: '', events: [], sent: false };
function logStart(replay) {
  LOG.startMs = Date.now(); LOG.startedAt = new Date().toISOString(); LOG.events = []; LOG.sent = false;
  ev('session_start', { replay: !!replay });
}
function ev(type, o) {
  const e = { t: +((Date.now() - LOG.startMs) / 1000).toFixed(2), type };
  if (o) for (const k in o) e[k] = o[k];
  LOG.events.push(e);
}
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function downloadLog() {
  if (LOG.sent) return;
  LOG.sent = true;
  try {
    const d = new Date();
    const name = 'gamelog-WebGame_DungeonZoo-' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '-' + pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds()) + '.json';
    const blob = new Blob([JSON.stringify({ game: 'WebGame_DungeonZoo', build: 'polish-1', startedAt: LOG.startedAt, events: LOG.events }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { try { document.body.removeChild(a); URL.revokeObjectURL(a.href); } catch (e) { /* 忽略 */ } }, 500);
  } catch (e) { console.error(e); }
}

// ───────────────────────── 資料表 ─────────────────────────
const SPECIES = ['lily', 'monkey', 'beetle', 'parrot', 'penguin', 'tanuki'];
const SP = {
  lily:    { name: '鈴蘭精',   hp: 7,  effect: 'calm',   interval: 3.0, decay: 2,   rep: 1, kill: 3, desc: '朝對手撒三發花粉, 打中的會冷靜', skill: 'pollen' },
  monkey:  { name: '火柴猴',   hp: 7,  effect: 'ignite', interval: 3.0, decay: 2,   rep: 1, kill: 3, desc: '丟出會飛回來的火柴, 打中的會生氣', skill: 'match' },
  beetle:  { name: '齒輪甲蟲', hp: 12, effect: 'ignite', interval: 3.2, decay: 2,   rep: 1, kill: 5, desc: '轉圈噴出一串齒輪, 打中的會生氣', skill: 'gear' },
  parrot:  { name: '標靶鸚鵡', hp: 12, effect: 'target', interval: 2.6, decay: 2,   rep: 1, kill: 5, desc: '羽毛射中的變成大家的標靶', skill: 'feather' },
  penguin: { name: '冰柱企鵝', hp: 16, effect: 'freeze', interval: 3.0, decay: 1.5, rep: 2, kill: 7, desc: '一道冰柱射線, 打中的凍住不動', skill: 'icebeam' },
  tanuki:  { name: '戲法狸',   hp: 18, effect: 'warp',   interval: 3.0, decay: 1.5, rep: 2, kill: 8, desc: '紙牌射中的被變到別處', skill: 'card' },
};
const NEST_CH = { l: 'lily', m: 'monkey', g: 'beetle', p: 'parrot', q: 'penguin', k: 'tanuki' };
const UP_COST = [20, 40, 70];
const PROJ = {
  pollen:  { speed: 160, r: 12, life: 4 },
  match:   { speed: 200, r: 14, life: 3 },
  gear:    { speed: 150, r: 10, life: 4 },
  feather: { speed: 260, r: 12, life: 3 },
  card:    { speed: 200, r: 12, life: 3 },
};

const CUES = [
  { key: 'wait',   name: '過 6 秒',     desc: '上一個節目演完 6 秒後', price: 0,  fame: 0 },
  { key: 'red1',   name: '有人進紅區',   desc: '有一隻進了紅區',       price: 0,  fame: 0 },
  { key: 'cold',   name: '冷場',         desc: '一半以上的魔物冷掉了', price: 20, fame: 0 },
  { key: 'red3',   name: '三隻進紅區',   desc: '場上同時有 3 隻在紅區', price: 20, fame: 0 },
  { key: 'mark3',  name: '有人標記 3',   desc: '有一隻標記到 3 個',     price: 30, fame: 80 },
  { key: 'chain3', name: '連鎖 3',       desc: '出現連鎖 3 段的表演',   price: 30, fame: 150 },
  { key: 'multi3', name: '一招 3 隻',    desc: '有一招打中 3 隻以上',   price: 30, fame: 150 },
];
const PROGS = [
  { key: 'ice',     name: '冰水桶', desc: '紅區又沒標記的全部冷靜一點', price: 0,  fame: 0 },
  { key: 'tutti',   name: '大合奏', desc: '紅區的全部立刻表演',         price: 0,  fame: 0 },
  { key: 'pep',     name: '加油棒', desc: '怒氣不到 50 的全部打氣',     price: 20, fame: 0 },
  { key: 'scatter', name: '散場',   desc: '大家互相遠離 3 秒',         price: 30, fame: 0 },
  { key: 'mob',     name: '圍攻',   desc: '大家去圍最氣的那隻 3 秒',   price: 30, fame: 80 },
  { key: 'lull',    name: '安撫曲', desc: '有標記的全部冷靜下來',       price: 40, fame: 150 },
  { key: 'spot',    name: '聚光燈', desc: '最氣的那隻連演 3 次',       price: 40, fame: 150 },
  { key: 'shuffle', name: '魔術箱', desc: '全場洗牌換位置',             price: 30, fame: 300 },
];
const CUE_BY = {}; CUES.forEach(c => { CUE_BY[c.key] = c; });
const PROG_BY = {}; PROGS.forEach(c => { PROG_BY[c.key] = c; });

const DUNGEONS = {
  meadow: {
    name: '見習草地',
    map: [
      '######################',
      '#....................#',
      '#..m.............m...#',
      '#....................#',
      '#.........o..........#',
      '#....................#',
      '#......o.......o.....#',
      '#....................#',
      '#.........S..........#',
      '#....................#',
      '######################'],
  },
  lake: {
    name: '鏡湖', species: ['lily', 'monkey'],
    map: [
      '################################',
      '#........#..........#..........#',
      '#..l..Y..#..GG......#..Y...m...#',
      '#....o...G..GG......G...o......#',
      '#..GG....#....WW....#....GG....#',
      '#..GG....#....WW....#....GG....#',
      '#........#..........#..........#',
      '####..########....########..####',
      '####..########....########..####',
      '#........#..........#..........#',
      '#...W..Y.#..o...GG..#..Y.W.....#',
      '#........G......GG..G..........#',
      '#.....o..#..........#.....m....#',
      '#..l..GG.#....S.....#..o.......#',
      '#.....GG.#..........#..........#',
      '################################'],
  },
  tower: {
    name: '齒輪鐘塔', species: ['beetle', 'parrot'], reqRep: 80, reqSp: 'lily', reqN: 2,
    map: [
      '################################',
      '#........#..........#..........#',
      '#..g..L..#....K.....#...L..p...#',
      '#....K...X....oo....X....K.....#',
      '#.L......#..........#......L...#',
      '#....W...#..K....K..#..........#',
      '#........#..........#....K.....#',
      '####..########....########..####',
      '####..########....########..####',
      '#........#..........#..........#',
      '#....L.K.#..L....L..#..W.......#',
      '#........X..........X..K.......#',
      '#..W.....#..........#......p...#',
      '#.g...o..#....S.....#...L..K...#',
      '#..K.....#..........#..........#',
      '################################'],
  },
  snow: {
    name: '雪境', species: ['penguin', 'tanuki'], reqRep: 300, reqSp: 'parrot', reqN: 2,
    map: [
      '################################',
      '#........#..........#..........#',
      '#..q.....#.1....2...#..L....k..#',
      '#...L....#..........#..........#',
      '#......W.#....LL....#....o.....#',
      '#.1......#....F.....#.......2..#',
      '#...o....#..........#..W.......#',
      '####..########....########..####',
      '####..########....########..####',
      '#........#..........#..........#',
      '#..L.....#..o....o..#.....L....#',
      '#........#..........#..........#',
      '#....W...#..........#..k....F..#',
      '#.q......#....S.....#.....W....#',
      '#........#..........#..........#',
      '################################'],
  },
};
const DUNGEON_ORDER = ['lake', 'tower', 'snow'];
const TILE = 60;

// 房間(世界座標, 3 座地下城共用); 活動範圍 = 房間內縮 30
const ROOM_X = [[60, 540], [600, 1200], [1260, 1860]];
const ROOM_Y = [[60, 420], [540, 900]];
function roomOf(x, y) { return (y < 480 ? 0 : 1) * 3 + (x < 570 ? 0 : x < 1230 ? 1 : 2); }
function roomBounds(room) {
  if (D && D.id === 'meadow') return { x0: 90, x1: 1230, y0: 90, y1: 570 };
  const cx = room % 3, cy = Math.floor(room / 3);
  return { x0: ROOM_X[cx][0] + 30, x1: ROOM_X[cx][1] - 30, y0: ROOM_Y[cy][0] + 30, y1: ROOM_Y[cy][1] - 30 };
}
const SHOW_B = { x0: 100, x1: 1180, y0: 186, y1: 526 };
const ARENA = { x0: 60, x1: 1220, y0: 146, y1: 566 };
const SHOW_POS = [[380, 260], [900, 260], [380, 450], [900, 450], [640, 356], [180, 220], [1100, 220], [180, 490], [1100, 490], [640, 220],
  [640, 490], [180, 356], [1100, 356], [510, 356], [770, 356], [510, 220], [770, 490], [770, 220], [510, 490], [300, 356]];

// ───────────────────────── 全域狀態 ─────────────────────────
let G = null;       // 整輪遊戲
let D = null;       // 地下城
let S = null;       // 表演場
let scene = 'title';
let CAL = null;     // 日曆過場
let PL = null;      // 今天去哪
let SEL = { cur: 0 };
let DR = null;      // 地下城結算
let SR = null;      // 表演結算
let RS = null;      // 總結算
let TITLE_T = 0;
let tutorialDone = false;   // 見習日完成過(本次開啟網頁內)
const keys = { up: false, down: false, left: false, right: false, z: false, x: false };
let pressed = {};

function emptyRows() { const r = []; for (let i = 0; i < 6; i++) r.push({ cue: '', prog: '' }); return r; }

function newRun(replay) {
  G = {
    day: replay ? 1 : 0, gold: replay ? 80 : 30, rep: 0, goldEarned: 0, bestChain: 0,
    weapon: 'club', ownedWeapons: { club: true },
    atkBought: 0, armorBought: 0, ropeBought: 0,
    prices: { attack: 50, armor: 40, ropeBag: 40 },
    bank: [], cap: { lily: 0, monkey: 0, beetle: 0, parrot: 0, penguin: 0, tanuki: 0 },
    unlocked: { lake: true, tower: false, snow: false },
    unlockQueue: [],
    ownedCues: { wait: true, red1: true }, ownedProgs: { ice: true, tutti: true },
    rows: emptyRows(), stageInit: false,
    log: ['', '', '', '', ''],
    placeCur: 0,
    s1: { cur: 0, top: 0, zone: 'grid', back: 0 },
    s2: { row: 0, col: 0, panel: null },
    shop: { tab: 0, zone: 'tab', idx: 0, top: 0 },
  };
  if (replay) { addMonster('monkey', false); addMonster('monkey', false); G.cap.monkey = 2; }
  D = null; S = null;
}

function musicFor(sc) {
  switch (sc) {
    case 'title': case 'calendar': case 'place': case 'select': return 'title';
    case 'dungeon': return 'dungeon';
    case 'setup1': case 'setup2': case 'shop': return 'setup';
    case 'show': return 'show';
    case 'dresult': case 'sresult': case 'result': return 'result';
  }
  return null;
}
function setScene(s) {
  scene = s;
  pressed = {};
  keys.z = false; keys.x = false;   // 轉場後的動作要重新按
  Snd.music(musicFor(s));
}

// ───────────────────────── 怪物庫(每隻獨立) ─────────────────────────
function bankSort() { G.bank.sort((a, b) => SPECIES.indexOf(a.sp) - SPECIES.indexOf(b.sp) || a.num - b.num); }
function addMonster(sp, on) {
  let num = 0; for (const b of G.bank) if (b.sp === sp && b.num > num) num = b.num;
  const m = { sp, num: num + 1, lv: 0, on: !!on };
  G.bank.push(m); bankSort();
  return m;
}
function stageCount() { let n = 0; for (const b of G.bank) if (b.on) n++; return n; }
function topLv(sp) { let l = 0; for (const b of G.bank) if (b.sp === sp && b.lv > l) l = b.lv; return l; }
function redLowOf(lv) { return 80 - 5 * lv; }
function baseFame(sp, lv) { return SP[sp].rep + 0.5 * lv; }
function maxHeartsNow() { return 6 + G.armorBought + topLv('penguin'); }
function ropeMaxNow() { return 4 + G.ropeBought; }
function xCdBase(w) { return w === 'sword' ? 3 : w === 'spear' ? 1.2 : w === 'whip' ? 1.2 : 0; }
function xCdMax() { return xCdBase(G.weapon) * (1 - 0.15 * topLv('beetle')); }
function captureDur() { return Math.max(0.35, 0.8 - 0.15 * topLv('lily')); }

function checkUnlock() {
  for (const id of DUNGEON_ORDER) {
    if (G.unlocked[id]) continue;
    const d = DUNGEONS[id];
    if (G.rep >= d.reqRep && G.cap[d.reqSp] >= d.reqN) {
      G.unlocked[id] = true; G.unlockQueue.push(id);
      ev('dungeon_unlock', { day: G.day, dungeon: id, fame: G.rep });
    }
  }
}
function dungeonCondition(id) {
  const d = DUNGEONS[id];
  if (G.unlocked[id]) return '';
  return '名聲 ' + Math.min(G.rep, d.reqRep) + '/' + d.reqRep + ' + 收服' + SP[d.reqSp].name + ' ' + Math.min(G.cap[d.reqSp], d.reqN) + '/' + d.reqN;
}

// 升級(個體)
const BONUS = {
  lily: ['花香', '準備捕捉', l => '−' + fmtNum(0.15 * l) + ' 秒'],
  monkey: ['靈巧', '移速', l => '+' + 25 * l],
  beetle: ['齒輪', 'X 技冷卻', l => '−' + 15 * l + '%'],
  parrot: ['羽翼', 'Z 範圍', l => '+' + 10 * l + '%'],
  penguin: ['冰甲', '心', l => '+' + l],
  tanuki: ['戲法', '套索時限', l => '+' + l + ' 秒'],
};
function upgradeLines(b) {
  const sp = SP[b.sp], head = sp.name + ' ' + b.num + ' 號';
  if (b.lv >= 3) return [head + ' 已滿級'];
  const l = b.lv, n = l + 1, bo = BONUS[b.sp], mx = topLv(b.sp);
  const lines = [
    head + ' Lv' + l + ' → Lv' + n + ' 費用 ' + UP_COST[l] + ' 金',
    '紅區 ' + redLowOf(l) + '~100 → ' + redLowOf(n) + '~100',
    '表演名聲 ' + fmtNum(baseFame(b.sp, l)) + ' → ' + fmtNum(baseFame(b.sp, n)),
  ];
  if (n > mx) lines.push(bo[0] + ' ' + bo[1] + ' ' + bo[2](mx) + ' → ' + bo[2](n));
  else lines.push(bo[0] + ' 看同種最高等級: Lv' + mx);
  return lines;
}
function canUpgrade(b) { return b.lv < 3 && G.gold >= UP_COST[b.lv]; }
function doUpgrade(b, where) {
  if (!canUpgrade(b)) return false;
  const cost = UP_COST[b.lv];
  G.gold -= cost; b.lv++;
  ev('upgrade', { day: G.day, where, species: b.sp, num: b.num, level: b.lv, cost });
  Snd.play('upgrade');
  return true;
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
  Snd.init();
  keys[k] = true;
  pressed[k] = true;
  if (TUT.cur && TUT.cur.phase === 'show') TUT.cur.pk[k] = true;
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

// ───────────────────────── 新手教學 ─────────────────────────
// 已完成階段記在本次開啟網頁的記憶裡(整關重來、失敗重來都不重置)
const TUT = { done: {}, trig: {}, cur: null, logged: {}, redMon: null, markMon: null };
function tut(flag) { if (TUT.cur && TUT.cur.phase === 'show') TUT.cur.flags[flag] = true; }
function tutTrig(id) { if (!TUT.done[id]) TUT.trig[id] = true; }
function inMeadow() { return scene === 'dungeon' && D && D.id === 'meadow'; }
function inDungeon() { return scene === 'dungeon' && !!D; }
function scr(wx, wy) { const c = camOf(); return { x: wx - c.x, y: wy - c.y }; }
function nearestMon() {
  if (!D) return null;
  const T = D.tamer; let best = null, bd = 1e9;
  for (const m of D.mons) { if (m.dead) continue; const d = dist(m.x, m.y, T.x, T.y); if (d < bd) { bd = d; best = m; } }
  return best;
}
function monTgt(m, hh) { const p = scr(m.x, m.y); return { x: p.x, y: p.y, hh: hh || 58 }; }
function slotCenter(idx, shop) {
  const s = shop ? G.shop : G.s1, r = Math.floor(idx / 10) - s.top, c = idx % 10;
  return shop ? { x: 145 + 110 * c, y: 195 + 115 * r } : { x: 145 + 110 * c, y: 120 + 125 * r };
}
function nestTgt() {
  if (!D) return null;
  const T = D.tamer; let best = null, bd = 1e9;
  for (const n of D.nests) { const d = dist(n.x, n.y, T.x, T.y); if (d < bd) { bd = d; best = n; } }
  if (!best) return null;
  const p = scr(best.x, best.y); return { x: p.x, y: p.y, hh: 40 };
}
function nearestOf(list) {
  if (!D) return null;
  const T = D.tamer; let best = null, bd = 1e9;
  for (const o of list) { const d = dist(o.x, o.y, T.x, T.y); if (d < bd) { bd = d; best = o; } }
  return best ? { o: best, d: bd } : null;
}
function tamerTgt() { if (!D) return null; const p = scr(D.tamer.x, D.tamer.y); return { x: p.x, y: p.y, hh: 44 }; }

const ARROWS = ['up', 'down', 'left', 'right'];
const TS = {
  1: { where: () => inMeadow(), text: () => '方向鍵 移動', keys: () => ARROWS, tgt: tamerTgt, ok: c => ARROWS.every(k => c.pk[k]) },
  2: { where: () => inMeadow(), text: () => 'Z 打牠', keys: () => ['z'], tgt: () => { const m = nearestMon(); return m ? monTgt(m) : nestTgt(); }, ok: c => c.flags.zhit },
  3: { where: () => inMeadow(), text: () => '站到牠身上別動', keys: () => ARROWS,
    tgt: () => { if (!D) return null; let w = null, bd = 1e9; for (const m of D.mons) if (!m.dead && isWeak(m)) { const d = dist(m.x, m.y, D.tamer.x, D.tamer.y); if (d < bd) { bd = d; w = m; } } return w ? monTgt(w) : null; },
    ok: c => c.flags.lasso || (!!D && !!D.lasso) },
  4: { where: () => inDungeon(), text: () => '繞牠一圈', keys: () => ['circle'], tgt: () => (D && D.lasso ? monTgt(D.lasso.m) : null), ok: c => c.flags.capture },
  5: { where: () => inMeadow(), text: () => '再收服 1 隻火柴猴 ' + (TUT.cur && TUT.cur.phase === 'done' ? 2 : 1) + '/2', keys: () => [],
    tgt: () => { const m = nearestMon(); return m ? monTgt(m) : nestTgt(); }, ok: c => c.flags.capture },
  6: { where: () => scene === 'setup1' && G.day === 0, text: () => 'Z 讓牠上場', keys: () => ['z'],
    tgt: () => { const c = slotCenter(G.s1.cur, false); return { x: c.x, y: c.y, hh: 55 }; }, ok: () => G.bank.length > 0 && G.bank.every(b => b.on) },
  7: { where: () => scene === 'setup1' && G.day === 0, text: () => '↓ 再 Z 下一步', keys: () => ['down', 'z'],
    tgt: () => ({ x: 1070, y: 505, hh: 35 }), ok: () => scene === 'setup2' },
  8: { where: () => scene === 'setup2' && G.day === 0, text: () => 'Z 選暗號: 什麼時候演', keys: () => ['z'],
    tgt: () => ({ x: 280, y: 100, hh: 26 }), ok: () => !!G.rows[0].cue },
  9: { where: () => scene === 'setup2' && G.day === 0, text: () => '→ 再 Z 選節目', keys: () => ['right', 'z'],
    tgt: () => ({ x: 580, y: 100, hh: 26 }), ok: () => !!(G.rows[0].cue && G.rows[0].prog) },
  10: { where: () => scene === 'setup2' && G.day === 0, text: () => '↓ 再排一列', keys: () => ['down'],
    tgt: () => ({ x: 280, y: 178, hh: 26 }), ok: () => !!(G.rows[1].cue && G.rows[1].prog) },
  11: { where: () => scene === 'setup2' && G.day === 0, text: () => '↓ 到開演 按 Z', keys: () => ['down', 'z'],
    tgt: () => ({ x: 380, y: 615, hh: 35 }), ok: () => scene === 'show' },
  12: { where: () => scene === 'show' && G.day === 0, text: () => '暗號成立 就演節目', keys: () => [],
    tgt: () => (S && S.cur >= 0 ? { x: 110 + 212 * S.cur, y: 691, hh: 23 } : { x: 110, y: 691, hh: 23 }), ok: c => c.flags.fired },
  13: { where: () => scene === 'show', text: () => '紅區表演 名聲×2', keys: () => [],
    tgt: () => { const m = TUT.redMon; return m && S && S.mons.indexOf(m) >= 0 ? { x: m.x, y: m.y, hh: 64 } : null; },
    tick: (c, dt) => { c.t += dt; }, ok: c => c.t >= 4 },
  14: { where: () => scene === 'show', text: () => '標記滿 5 個 會失控', keys: () => [],
    tgt: () => { const m = TUT.markMon; return m && S && S.mons.indexOf(m) >= 0 ? { x: m.x, y: m.y, hh: 72 } : null; },
    tick: (c, dt) => { c.t += dt; }, ok: c => c.t >= 5 || (!!TUT.markMon && TUT.markMon.marks === 0 && c.t > 0.3) },
  15: { where: () => scene === 'place', text: () => '←→ 選 Z 決定', keys: () => ['left', 'right', 'z'],
    tgt: () => ({ x: 240 + 400 * (G.placeCur), y: 370, hh: 210 }), ok: c => c.flags.placeChosen },
  16: { where: () => scene === 'shop', text: () => '←→ 換分頁', keys: () => ['left', 'right'], tgt: () => ({ x: 640, y: 85, hh: 25 }), ok: c => c.flags.tab },
  17: { where: () => scene === 'setup1' || (scene === 'shop' && G.shop.tab === 2),
    text: () => (scene === 'shop' ? 'Z 升級這隻' : 'X 升級這隻'), keys: () => (scene === 'shop' ? ['z'] : ['x']),
    tgt: () => { const shop = scene === 'shop', c = slotCenter(shop ? G.shop.idx : G.s1.cur, shop); return { x: c.x, y: c.y, hh: 55 }; }, ok: c => c.flags.upgrade },
  18: { where: () => inDungeon(), text: () => 'X 武器技', keys: () => ['x'], tgt: tamerTgt, ok: c => c.flags.xskill },
  19: { where: () => inDungeon() && D.id === 'lake', text: () => '躲進草叢 魔物看不到你', keys: () => [],
    tgt: () => { const b = nearestOf(D.bushes); if (!b) return null; const p = scr(b.o.x, b.o.y); return { x: p.x, y: p.y, hh: 30 }; }, ok: c => c.flags.hide },
  20: { where: () => inDungeon() && D.id === 'lake', text: () => 'Z 打落果子 引開魔物', keys: () => ['z'],
    tgt: () => { const b = nearestOf(D.trees.filter(t => t.hasFruit)); if (!b) return null; const p = scr(b.o.x, b.o.y); return { x: p.x, y: p.y, hh: 32 }; }, ok: c => c.flags.fruit },
  21: { where: () => inDungeon() && D.id === 'tower', text: () => 'Z 點燃 快跑開', keys: () => ['z'],
    tgt: () => { const b = nearestOf(D.kegs.filter(k => k.mode === 'ok')); if (!b) return null; const p = scr(b.o.x, b.o.y); return { x: p.x, y: p.y, hh: 30 }; }, ok: c => c.flags.keg },
  22: { where: () => inDungeon() && D.id === 'tower', text: () => 'Z 打 3 下 打通', keys: () => ['z'],
    tgt: () => { const b = nearestOf(crackCells()); if (!b) return null; const p = scr(b.o.x, b.o.y); return { x: p.x, y: p.y, hh: 30 }; }, ok: c => c.flags.wall },
  23: { where: () => inDungeon() && D.id === 'snow', text: () => '站上去 傳送', keys: () => [],
    tgt: () => { const b = nearestOf(D.portals); if (!b) return null; const p = scr(b.o.x, b.o.y); return { x: p.x, y: p.y, hh: 30 }; }, ok: c => c.flags.tele },
  24: { where: () => inDungeon() && D.id === 'snow', text: () => '走進泉水 補滿心', keys: () => [],
    tgt: () => { const b = nearestOf(D.fountains.filter(f => f.full)); if (!b) return null; const p = scr(b.o.x, b.o.y); return { x: p.x, y: p.y, hh: 30 }; }, ok: c => c.flags.heal },
};
const TUT_IDS = Object.keys(TS).map(Number).sort((a, b) => a - b);
function crackCells() {
  const out = [];
  for (let r = 0; r < D.H; r++) for (let c = 0; c < D.W; c++) if (D.grid[r][c] === 'X') out.push({ x: c * TILE + 30, y: r * TILE + 30 });
  return out;
}

// 每幀檢查「第一次成立」的出現時機(成立後鎖存)
function tutWatch() {
  if (scene === 'dungeon' && D) {
    const T = D.tamer;
    if (D.id === 'meadow') {
      tutTrig(1);
      if (D.mons.some(m => !m.dead && isWeak(m))) tutTrig(3);
    }
    if (D.lasso) tutTrig(4);
    if (!TUT.done[19] && D.bushes.length && nearestOf(D.bushes).d <= 150) tutTrig(19);
    if (!TUT.done[20]) { const b = nearestOf(D.trees.filter(t => t.hasFruit)); if (b && b.d <= 200) tutTrig(20); }
    if (!TUT.done[21]) { const b = nearestOf(D.kegs.filter(k => k.mode === 'ok')); if (b && b.d <= 200) tutTrig(21); }
    if (!TUT.done[22]) { const b = nearestOf(crackCells()); if (b && b.d <= 200) tutTrig(22); }
    if (!TUT.done[23]) { const b = nearestOf(D.portals); if (b && b.d <= 200) tutTrig(23); }
    if (!TUT.done[24] && T.hearts < T.maxHearts) { const b = nearestOf(D.fountains.filter(f => f.full)); if (b && b.d <= 300) tutTrig(24); }
  }
  if (scene === 'setup1' && G.day === 0) tutTrig(6);
  if (scene === 'setup2' && G.day === 0 && TUT.done[7]) tutTrig(8);
  if (scene === 'show' && G.day === 0) tutTrig(12);
  if (scene === 'place' && G.day === 1) tutTrig(15);
  if (scene === 'shop') tutTrig(16);
  if ((scene === 'setup1' && G.bank.some(canUpgrade)) || (scene === 'shop' && G.shop.tab === 2 && G.bank.some(canUpgrade))) tutTrig(17);
}
function tutStart(id) {
  const c = { id, phase: 'show', pk: {}, flags: {}, t: 0, age: 0, doneT: 0, lastTg: null };
  TUT.cur = c;
  if (!TUT.logged[id]) { TUT.logged[id] = Date.now(); ev('tutorial_show', { stage: id, day: G.day, scene }); }
}
function tutForceSkip(maxId) {
  for (const id of TUT_IDS) if (id <= maxId) { if (TUT.trig[id] || (TUT.cur && TUT.cur.id === id)) TUT.done[id] = true; }
  if (TUT.cur && TUT.cur.id <= maxId) TUT.cur = null;
}
function tutUpdate(dt) {
  tutWatch();
  let c = TUT.cur;
  if (c) {
    const def = TS[c.id];
    if (c.phase === 'show') {
      const here = def.where();
      if (here) { c.age += dt; if (def.tick) def.tick(c, dt); }
      if (def.ok(c)) {
        c.phase = 'done'; c.doneT = 0;
        ev('tutorial_done', { stage: c.id, day: G.day, took: +((Date.now() - TUT.logged[c.id]) / 1000).toFixed(1) });
        Snd.play('tutorial_done');
        if (c.id === 1) tutTrig(2);
        if (c.id === 4 && inMeadow()) { /* 5 由第一次收服觸發 */ }
        if (c.id === 6) tutTrig(7);
        if (c.id === 8) tutTrig(9);
        if (c.id === 9) tutTrig(10);
        if (c.id === 10) tutTrig(11);
      } else if (!here) {
        TUT.cur = null;   // 離開該階段的場景: 收起來, 條件成立時再出現
      }
    } else {
      c.doneT += dt;
      if (c.doneT >= 0.6) { TUT.done[c.id] = true; TUT.cur = null; }
    }
  }
  if (!TUT.cur) {
    for (const id of TUT_IDS) {
      if (TUT.done[id] || !TUT.trig[id]) continue;
      if (TS[id].where()) { tutStart(id); break; }
    }
  }
}
function renderTutorial() {
  const c = TUT.cur;
  if (!c) return;
  const def = TS[c.id];
  let tg;
  if (c.phase === 'show') {
    if (!def.where()) return;
    tg = def.tgt(); if (!tg) return;
    c.lastTg = tg;
  } else {
    tg = c.lastTg; if (!tg) return;
  }
  const side = tg.y < 300 ? 'down' : 'up';
  const ty = side === 'down' ? tg.y + tg.hh : tg.y - tg.hh;
  const top = (scene === 'dungeon' ? 100 : 50) + 52;
  const by = clamp(side === 'down' ? ty + 60 : ty - 60, top, CH - 52);
  const bx = clamp(tg.x, 170, CW - 170);
  const keysList = def.keys();
  Art.drawTutorial(ctx, {
    stage: c.id, text: def.text(), keys: keysList,
    pressed: c.id === 1 ? keysList.filter(k => c.pk[k]) : [],
    x: tg.x, y: ty, bx, by, side, phase: c.phase,
    appearT: Math.min(0.25, c.age), appearDur: 0.25,
    doneT: c.phase === 'done' ? c.doneT : 0.6, doneDur: 0.6,
  });
}

// ───────────────────────── 開始畫面 / 日曆 / 今天去哪 / 地下城選擇 ─────────────────────────
function titleInput() {
  if (!pressed.z) return;
  Snd.init(); Snd.play('title_start');
  logStart(false);
  newRun(false);
  beginDay(tutorialDone ? 1 : 0, tutorialDone);
}
function beginDay(day, replayState) {
  if (replayState) { /* newRun 已準備好 */ }
  G.day = day;
  CAL = { t: 0, dur: 2.0 };
  ev('day_start', { day });
  Snd.play('calendar_flip');
  setScene('calendar');
}
function calendarInput(dt) {
  CAL.t += dt;
  if (CAL.t >= CAL.dur || (CAL.t >= 0.5 && pressed.z)) {
    if (G.day === 0) startDungeon('meadow');
    else enterPlace();
  }
}
function enterPlace() {
  PL = { zone: 'card', notice: null };
  nextNotice();
  setScene('place');
}
function nextNotice() {
  if (G.unlockQueue.length > 0) {
    const id = G.unlockQueue.shift();
    PL.notice = { text: '新地下城開放: ' + DUNGEONS[id].name, t: 0 };
    Snd.play('unlock');
  } else PL.notice = null;
}
function placeInput(dt) {
  if (PL.notice) { PL.notice.t += dt; if (PL.notice.t >= 1.5) nextNotice(); }
  if (PL.zone === 'card') {
    if (pressed.left && G.placeCur > 0) { G.placeCur--; Snd.play('ui_move'); }
    else if (pressed.right && G.placeCur < 2) { G.placeCur++; Snd.play('ui_move'); }
    else if (pressed.down) { PL.zone = 'sound'; Snd.play('ui_move'); }
    else if (pressed.z) {
      const place = ['dungeon', 'show', 'shop'][G.placeCur];
      ev('place_choose', { day: G.day, place });
      tut('placeChosen');
      Snd.play('ui_confirm');
      if (place === 'dungeon') { SEL.cur = 0; setScene('select'); }
      else if (place === 'show') { enterSetup1(); }
      else { G.shop = { tab: 0, zone: 'tab', idx: 0, top: 0 }; setScene('shop'); }
    }
  } else {
    if (pressed.up) { PL.zone = 'card'; Snd.play('ui_move'); }
    else if (pressed.z) { Snd.toggleMute(); ev('mute_toggle', { muted: Snd.muted }); Snd.play('ui_confirm'); }
  }
}
function selectInput() {
  if (pressed.left && SEL.cur > 0) { SEL.cur--; Snd.play('ui_move'); }
  else if (pressed.right && SEL.cur < 2) { SEL.cur++; Snd.play('ui_move'); }
  else if (pressed.x) { Snd.play('ui_cancel'); setScene('place'); PL.zone = 'card'; }
  else if (pressed.z) {
    const id = DUNGEON_ORDER[SEL.cur];
    if (G.unlocked[id]) { Snd.play('ui_confirm'); startDungeon(id); } else Snd.play('ui_denied');
  }
}
// 一天結束: where = dungeon / show; 見習日不計入天數
function advanceDay(where) {
  if (G.day >= 1) G.log[G.day - 1] = where;
  if (G.day >= DAY_MAX) { toResult(); return; }
  beginDay(G.day + 1);
}

// ───────────────────────── 地下城: 地圖與碰撞 ─────────────────────────
function solidCell(c, r) {
  if (c < 0 || r < 0 || c >= D.W || r >= D.H) return true;
  const ch = D.grid[r][c];
  return ch === '#' || ch === 'o' || ch === 'X' || ch === 'Y';
}
function kegBlock(x, y, rad) {
  for (const k of D.kegs) if (k.mode !== 'gone' && dist(x, y, k.x, k.y) < rad + 22) return k;
  return null;
}
function circleSolid(x, y, rad) {
  const c0 = Math.floor((x - rad) / TILE), c1 = Math.floor((x + rad) / TILE);
  const r0 = Math.floor((y - rad) / TILE), r1 = Math.floor((y + rad) / TILE);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    if (!solidCell(c, r)) continue;
    const nx = clamp(x, c * TILE, c * TILE + TILE), ny = clamp(y, r * TILE, r * TILE + TILE);
    if ((nx - x) * (nx - x) + (ny - y) * (ny - y) < rad * rad) return true;
  }
  return !!kegBlock(x, y, rad);
}
function circleOnChar(x, y, rad, ch) {
  const c0 = Math.floor((x - rad) / TILE), c1 = Math.floor((x + rad) / TILE);
  const r0 = Math.floor((y - rad) / TILE), r1 = Math.floor((y + rad) / TILE);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    if (c < 0 || r < 0 || c >= D.W || r >= D.H || D.grid[r][c] !== ch) continue;
    const nx = clamp(x, c * TILE, c * TILE + TILE), ny = clamp(y, r * TILE, r * TILE + TILE);
    if ((nx - x) * (nx - x) + (ny - y) * (ny - y) < rad * rad) return true;
  }
  return false;
}
function solidAtPoint(x, y) { return solidCell(Math.floor(x / TILE), Math.floor(y / TILE)); }
function camOf() {
  if (!D) return { x: 0, y: 0 };
  const T = D.tamer;
  const cx = clamp(T.x - 640, 0, Math.max(0, D.W * TILE - 1280));
  const cy = clamp(T.y - 310, 0, Math.max(0, D.H * TILE - 620));
  return { x: cx, y: cy - 100 };   // 畫面 = 世界 − cam
}
function monStat(sp) {
  const base = SP[sp];
  if (D && D.id === 'meadow' && sp === 'monkey') return { hp: 6, interval: 4.0 };
  return { hp: base.hp, interval: base.interval };
}
function isWeak(m) { return D && D.id === 'meadow' ? m.hp <= 2 : m.hp <= m.maxHp * 0.3; }

function startDungeon(id) {
  const def = DUNGEONS[id];
  const grid = def.map.map(r => r.split(''));
  const H = grid.length, W = grid[0].length;
  D = {
    id, grid, W, H, portals: [], nests: [], mons: [], hz: [], fx: [], floats: [], cracks: {}, kegs: [], trees: [], fruits: [], fountains: [], blasts: [], bushes: [],
    timed: id !== 'meadow', timeLeft: 75, elapsed: 0, pairCd: { 1: 0, 2: 0 }, ring: { m: null, t: 0 }, lasso: null,
    ropes: ropeMaxNow(), tamer: null, caps: [], kills: 0, killGold: 0, heartsLost: 0, endT: -1, hidden: false, respawnT: id === 'meadow' ? 3 : 10,
  };
  let sx = 0, sy = 0;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const ch = grid[r][c], cx = c * TILE + 30, cy = r * TILE + 30;
    if (ch === 'S') { sx = cx; sy = cy; grid[r][c] = '.'; }
    else if (ch === '1' || ch === '2') { D.portals.push({ id: +ch, x: cx, y: cy, charge: 0, armed: true }); grid[r][c] = '.'; }
    else if (ch === 'K') { D.kegs.push({ x: cx, y: cy, mode: 'ok', fuseT: 0, respawn: 0 }); grid[r][c] = '.'; }
    else if (ch === 'F') { D.fountains.push({ x: cx, y: cy, full: true }); grid[r][c] = '.'; }
    else if (ch === 'Y') D.trees.push({ x: cx, y: cy, hasFruit: true, regrow: 0 });
    else if (ch === 'G') D.bushes.push({ x: cx, y: cy });
    else if (NEST_CH[ch]) { D.nests.push({ sp: NEST_CH[ch], x: cx, y: cy, room: id === 'meadow' ? 0 : roomOf(cx, cy), mon: null, respawn: 0 }); grid[r][c] = 'n'; }
  }
  const mh = maxHeartsNow();
  D.tamer = { x: sx, y: sy, facing: 0, weapon: G.weapon, hearts: mh, maxHearts: mh, invuln: 0, slowT: 0, zCd: 0, xCd: 0, dash: null, hidden: false };
  for (const n of D.nests) spawnWild(n);
  ev('dungeon_start', { day: G.day, dungeon: id, weapon: G.weapon, hearts: mh, ropes: D.ropes });
  if (xCdBase(G.weapon) > 0) tutTrig(18);
  setScene('dungeon');
}

function spawnWild(n) {
  const st = monStat(n.sp);
  const m = {
    sp: n.sp, x: n.x, y: n.y, hp: st.hp, maxHp: st.hp, interval: st.interval, hitT: 0, stun: 0, lassoed: false, kb: null,
    room: n.room, nest: n, dead: false, ang: rnd(0, Math.PI * 2), dirT: rnd(0.5, 2), cyc: rnd(0, 1),
    tp: 0, tpT: 0, teleT: rnd(0, 2.5), swooping: false, castT: 0, inRange: false, burst: null,
    face: 1, move: 'walk', moveT: 0, moveDur: 0, weak: false, casting: false,
  };
  if (n.sp === 'penguin' || n.sp === 'parrot') m.cyc = rnd(0, 2);
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
function hzList() { return scene === 'show' || scene === 'sresult' ? S.hz : D.hz; }
function killHz(h) {
  if (h.dead) return;
  h.dead = true;
  if (h.cast) { h.cast.alive--; checkSettle(h.cast); }
}
function newCast(owner, chain, dungeon) {
  return { owner, chain, hits: new Set(), alive: 0, red: false, settled: false, dungeon };
}
function emitSkill(m, tx, ty, cast) {
  const list = hzList();
  const kind = SP[m.sp].skill;
  const base = Math.atan2(ty - m.y, tx - m.x);
  const mk = (ang, extra) => {
    const p = PROJ[kind];
    const spd = (cast.dungeon && D && D.id === 'meadow' && kind === 'match') ? 160 : p.speed;
    const h = newHz(Object.assign({ kind, phase: 'fly', x: m.x, y: m.y, radius: p.r, angle: ang, dur: p.life, speed: spd, owner: m, cast, ox: m.x, oy: m.y }, extra || {}));
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
// source: 技能代號 / 'hurt' / 'blast'
function hurtTamer(source, h) {
  const T = D.tamer;
  if (T.invuln > 0 || T.dash) return false;
  T.hearts--; T.invuln = 1.2; D.heartsLost++;
  if (h && h.kind === 'icebeam') T.slowT = 1;
  Snd.play('player_hurt');
  ev('player_hit', { dungeon: D.id, source, x: Math.round(T.x), y: Math.round(T.y), heartsLeft: T.hearts, elapsed: +D.elapsed.toFixed(1) });
  if (D.lasso) breakLasso('hit');
  return true;
}
function tryMoveTamer(dx, dy) {
  const T = D.tamer;
  let blocked = false;
  T.x += dx; if (circleSolid(T.x, T.y, 18)) { T.x -= dx; blocked = true; }
  T.y += dy; if (circleSolid(T.x, T.y, 18)) { T.y -= dy; blocked = true; }
  return blocked;
}
function tileAt(x, y) {
  const c = Math.floor(x / TILE), r = Math.floor(y / TILE);
  if (c < 0 || r < 0 || c >= D.W || r >= D.H) return '#';
  return D.grid[r][c];
}
function updateTamer(dt) {
  const T = D.tamer;
  T.invuln = Math.max(0, T.invuln - dt); T.slowT = Math.max(0, T.slowT - dt);
  T.zCd = Math.max(0, T.zCd - dt); T.xCd = Math.max(0, T.xCd - dt);
  if (T.dash) { updateDash(dt); return; }
  const dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  if (dx || dy) {
    T.facing = facingFromDir(dx, dy);
    const len = Math.hypot(dx, dy);
    let sp = 300 + 25 * topLv('monkey');
    if (tileAt(T.x, T.y) === 'W') sp *= 0.5;
    if (T.slowT > 0) sp *= 0.5;
    const step = sp * dt, n = Math.max(1, Math.ceil(step / 8));
    for (let i = 0; i < n; i++) tryMoveTamer(dx / len * step / n, dy / len * step / n);
  }
  // 躲草叢
  const inBush = tileAt(T.x, T.y) === 'G';
  if (inBush && !T.hidden) {
    Snd.play('bush_hide'); tut('hide');
    ev('object_use', { dungeon: D.id, object: 'bush', action: 'hide', x: Math.round(T.x), y: Math.round(T.y) });
  }
  T.hidden = inBush;
  if (circleOnChar(T.x, T.y, 18, 'L')) hurtTamer('hurt', null);
  if (keys.z && T.zCd <= 0) doAttack(false);
  if (keys.x && T.xCd <= 0 && !T.dash) doAttack(true);
}
function addFx(o) { D.fx.push(Object.assign({ x: D.tamer.x, y: D.tamer.y, weapon: D.tamer.weapon, move: 'normal', shape: 'arc', angle: 0, spread: 0, radius: 0, length: 0, width: 0, t: 0, dur: 0.2 }, o)); }
function doAttack(isX) {
  const T = D.tamer, wp = T.weapon, ang = (T.facing - 2) * Math.PI / 4;
  const atk = G.atkBought, rb = 1 + 0.1 * topLv('parrot');
  let sh = null;
  if (!isX) {
    if (wp === 'club') { sh = { shape: 'arc', spread: 100 * D2R, radius: 70 * rb, dmg: 2 + atk }; T.zCd = 0.35; }
    else if (wp === 'sword') { sh = { shape: 'arc', spread: 120 * D2R, radius: 80 * rb, dmg: 2 + atk, reflect: true }; T.zCd = 0.35; }
    else if (wp === 'spear') { sh = { shape: 'line', length: 170 * rb, width: 40, dmg: 2 + atk }; T.zCd = 0.45; }
    else { sh = { shape: 'circle', radius: 100 * rb, dmg: 1 + atk }; T.zCd = 0.4; }
    addFx({ move: 'normal', shape: sh.shape, angle: ang, spread: sh.spread || 0, radius: sh.radius || 0, length: sh.length || 0, width: sh.width || 0, dur: 0.2 });
    Snd.play('attack', wp);
    if (applyShape(sh, T.x, T.y, ang) > 0) tut('zhit');
  } else {
    if (wp === 'club') return;
    T.xCd = xCdMax();
    Snd.play('skill', wp); tut('xskill');
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
      if (dist(m.x, m.y, T.x, T.y) <= 24 + 18) { d.hit.add(m); damageMon(m, 3 + G.atkBought, 'weapon'); }
    }
  }
  d.t += dt;
  if (blocked || d.t >= 0.25) {
    T.dash = null;
    hitObjects({ shape: 'line', length: d.trav + 60, width: 40 }, d.sx, d.sy, d.ang);
  }
}
function inShape(sh, px, py, ox, oy, ang, pad) {
  if (sh.shape === 'arc') return inArc(px, py, ox, oy, ang, sh.spread, sh.radius, pad);
  if (sh.shape === 'circle') return dist(px, py, ox, oy) <= sh.radius + pad;
  return inLine(px, py, ox, oy, ang, sh.length, sh.width, pad);
}
function applyShape(sh, ox, oy, ang) {
  const T = D.tamer;
  let n = 0;
  for (const m of D.mons) {
    if (m.dead || m.lassoed) continue;
    if (!inShape(sh, m.x, m.y, ox, oy, ang, 24)) continue;
    if (sh.dmg > 0) { damageMon(m, sh.dmg, 'weapon'); n++; }
    if (m.dead) continue;
    if (sh.stun) { m.stun = 2; cancelWarns(m); cancelBurst(m); n++; Snd.once('hit_monster'); }
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
  hitObjects(sh, ox, oy, ang);
  return n;
}
// 攻擊範圍蓋到的互動物件: 裂牆、爆炸桶、果樹
function hitObjects(sh, ox, oy, ang) {
  const reach = (sh.radius || sh.length || 0) + 70;
  const c0 = Math.max(0, Math.floor((ox - reach) / TILE)), c1 = Math.min(D.W - 1, Math.floor((ox + reach) / TILE));
  const r0 = Math.max(0, Math.floor((oy - reach) / TILE)), r1 = Math.min(D.H - 1, Math.floor((oy + reach) / TILE));
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    if (D.grid[r][c] !== 'X') continue;
    if (!inShape(sh, c * TILE + 30, r * TILE + 30, ox, oy, ang, 0)) continue;
    addCrack(r, c);
  }
  for (const k of D.kegs) if (k.mode === 'ok' && inShape(sh, k.x, k.y, ox, oy, ang, 0)) igniteKeg(k);
  for (const t of D.trees) if (t.hasFruit && inShape(sh, t.x, t.y, ox, oy, ang, 0)) dropFruit(t);
}
function addCrack(r, c) {
  const key = r * D.W + c;
  D.cracks[key] = (D.cracks[key] || 0) + 1;
  if (D.cracks[key] >= 3) {
    D.grid[r][c] = '.';
    Snd.play('wall_break'); tut('wall');
    ev('object_use', { dungeon: D.id, object: 'crackwall', action: 'break', x: c * TILE + 30, y: r * TILE + 30 });
  } else Snd.play('wall_crack');
}
function igniteKeg(k) {
  if (k.mode !== 'ok') return;
  k.mode = 'fuse'; k.fuseT = 0; Snd.play('keg_fuse');
}
function explodeKeg(k) {
  k.mode = 'gone'; k.respawn = 20; k.fuseT = 0;
  D.blasts.push({ x: k.x, y: k.y, t: 0, dur: 0.3 });
  Snd.play('keg_blast'); tut('keg');
  ev('object_use', { dungeon: D.id, object: 'keg', action: 'blast', x: Math.round(k.x), y: Math.round(k.y) });
  for (const m of D.mons) {
    if (m.dead || m.lassoed) continue;
    if (dist(m.x, m.y, k.x, k.y) <= 130 + 24) damageMon(m, 4, 'blast');
  }
  if (dist(D.tamer.x, D.tamer.y, k.x, k.y) <= 130 + 18) hurtTamer('blast', null);
  for (let r = 0; r < D.H; r++) for (let c = 0; c < D.W; c++) {
    if (D.grid[r][c] === 'X' && dist(c * TILE + 30, r * TILE + 30, k.x, k.y) <= 130) addCrack(r, c);
  }
  for (const o of D.kegs) if (o !== k && o.mode === 'ok' && dist(o.x, o.y, k.x, k.y) <= 130) igniteKeg(o);
}
function dropFruit(t) {
  t.hasFruit = false; t.regrow = 15;
  const f = { x: t.x, y: t.y + 60, room: roomOf(t.x, t.y + 60), eating: false, eatT: 0 };
  D.fruits.push(f);
  for (const m of D.mons) if (!m.dead && m.room === f.room) { cancelWarns(m); cancelBurst(m); m.casting = false; }
  Snd.play('fruit_drop'); tut('fruit');
  ev('object_use', { dungeon: D.id, object: 'fruit', action: 'drop', x: Math.round(f.x), y: Math.round(f.y) });
}
function damageMon(m, dmg, by) {
  if (m.dead || m.lassoed) return;
  const wasWeak = isWeak(m);
  m.hp -= dmg; m.hitT = 0.1;
  Snd.once('hit_monster');
  if (D.ring.m === m) D.ring.t = 0;
  if (m.hp <= 0) killMon(m, by);
  else if (!wasWeak && isWeak(m)) Snd.once('monster_weak');
}
function killMon(m, by) {
  m.dead = true; cancelWarns(m); cancelBurst(m);
  m.nest.mon = null; m.nest.respawn = D.respawnT;
  const k = SP[m.sp].kill;
  G.gold += k; G.goldEarned += k; D.kills++; D.killGold += k;
  Snd.play('kill');
  ev('kill', { dungeon: D.id, species: m.sp, by: by || 'weapon', x: Math.round(m.x), y: Math.round(m.y) });
  addDFloat(m.x, m.y - 40, '+' + k, 'gold');
  if (D.lasso && D.lasso.m === m) D.lasso = null;
  if (D.ring.m === m) { D.ring.m = null; D.ring.t = 0; }
}
function addDFloat(x, y, text, kind) { D.floats.push({ x, y, text, kind, t: 0, dur: 1 }); }

// ───────────────────────── 地下城: 魔物 ─────────────────────────
function dirDungeon(m) {
  const T = D.tamer, d = dist(m.x, m.y, T.x, T.y);
  if (d >= 300 || T.hidden) return rnd(0, Math.PI * 2);
  const to = Math.atan2(T.y - m.y, T.x - m.x);
  if (d > 200) return to;
  if (d < 120) return to + Math.PI;
  return to + (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2;
}
function teleDungeon(m) {
  const b = roomBounds(m.room), T = D.tamer;
  if (dist(m.x, m.y, T.x, T.y) < 300 && !T.hidden) {
    for (let i = 0; i < 40; i++) {
      const x = rnd(b.x0, b.x1), y = rnd(b.y0, b.y1), d = dist(x, y, T.x, T.y);
      if (d >= 150 && d <= 250) return { x, y };
    }
  }
  return { x: rnd(b.x0, b.x1), y: rnd(b.y0, b.y1) };
}
function intervalWild(m) { return m.interval * (m.weak ? 1.5 : 1); }
function fruitFor(m) {
  let best = null, bd = 1e9;
  for (const f of D.fruits) { if (f.room !== m.room) continue; const d = dist(m.x, m.y, f.x, f.y); if (d < bd) { bd = d; best = f; } }
  return best;
}
function updateWild(m, dt) {
  const T = D.tamer;
  m.hitT = Math.max(0, m.hitT - dt);
  m.weak = isWeak(m);
  const b = roomBounds(m.room);
  if (m.lassoed) { m.casting = false; return; }
  if (m.stun > 0) { m.stun = Math.max(0, m.stun - dt); m.casting = false; return; }
  // 果子: 同房間的魔物走過去吃, 期間不施放
  const f = fruitFor(m);
  if (f) {
    cancelWarns(m); cancelBurst(m); m.casting = false;
    m.move = 'eat'; m.moveT = 0; m.moveDur = 0; m.inRange = false;
    const d = dist(m.x, m.y, f.x, f.y);
    if (d > 30) {
      const st = Math.min(80 * dt, d);
      m.x = clamp(m.x + (f.x - m.x) / d * st, b.x0, b.x1); m.y = clamp(m.y + (f.y - m.y) / d * st, b.y0, b.y1);
      m.face = f.x >= m.x ? 1 : -1;
    } else if (!f.eating) { f.eating = true; f.eatT = 0; }
    return;
  }
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
  if (d < 300 && !T.hidden) {
    if (!m.inRange) { m.inRange = true; m.castT = intervalWild(m); }
    m.castT -= dt;
    if (m.castT <= 0 && !m.casting) {
      emitSkill(m, T.x, T.y, newCast(m, 1, true));
      Snd.once('monster_cast');
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
          if (lineHitsCircle(h, T.x, T.y, 18)) hurtTamer('icebeam', h);
          for (const k of D.kegs) if (k.mode === 'ok' && inLine(k.x, k.y, h.x, h.y, h.angle, h.length, h.width, 0)) igniteKeg(k);
        }
      } else if (h.t >= h.dur) killHz(h);
      continue;
    }
    h.t += dt;
    if (h.t >= h.dur) { killHz(h); continue; }
    const step = h.speed * dt;
    if (h.kind === 'match' && !h.reflected && h.returning) {
      h.angle = Math.atan2(h.oy - h.y, h.ox - h.x);
      if (dist(h.x, h.y, h.ox, h.oy) <= 20) { killHz(h); continue; }
    }
    h.x += Math.cos(h.angle) * step; h.y += Math.sin(h.angle) * step;
    if (h.kind === 'match' && !h.reflected && !h.returning) { h.trav += step; if (h.trav >= 280) h.returning = true; }
    if (solidAtPoint(h.x, h.y)) { killHz(h); continue; }
    let kegHit = null;
    for (const k of D.kegs) if (k.mode !== 'gone' && dist(h.x, h.y, k.x, k.y) <= 22 + h.radius) { kegHit = k; break; }
    if (kegHit) { igniteKeg(kegHit); killHz(h); continue; }
    if (h.reflected) {
      for (const m of D.mons) {
        if (m.dead || m.lassoed) continue;
        if (dist(h.x, h.y, m.x, m.y) <= h.radius + 24) { damageMon(m, 3 + G.atkBought, 'reflect'); killHz(h); break; }
      }
      continue;
    }
    if (T.invuln <= 0 && !T.dash && dist(h.x, h.y, T.x, T.y) <= h.radius + 18) {
      if (h.kind === 'match') {
        if (!h.hit) h.hit = new Set();
        if (h.cast && h.hit.has(h.cast)) continue;
        if (h.cast) h.hit.add(h.cast);
        hurtTamer('match', h);
      } else { hurtTamer(h.kind, h); killHz(h); }
    }
  }
  D.hz = D.hz.filter(h => !h.dead);
}

// ───────────────────────── 地下城: 互動物件、捕捉 ─────────────────────────
function updateObjects(dt) {
  const T = D.tamer;
  // 傳送陣
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
          Snd.play('teleport'); tut('tele');
          ev('object_use', { dungeon: D.id, object: 'portal', action: 'teleport', x: Math.round(T.x), y: Math.round(T.y) });
        }
      }
    } else p.charge = 0;
  }
  // 回復泉
  for (const f of D.fountains) {
    if (f.full && T.hearts < T.maxHearts && dist(T.x, T.y, f.x, f.y) <= 30) {
      f.full = false; T.hearts = T.maxHearts;
      addDFloat(T.x, T.y - 50, '心補滿', 'heal');
      Snd.play('heal'); tut('heal');
      ev('object_use', { dungeon: D.id, object: 'fountain', action: 'heal', x: Math.round(f.x), y: Math.round(f.y) });
    }
  }
  // 爆炸桶
  for (const k of D.kegs) {
    if (k.mode === 'fuse') { k.fuseT += dt; if (k.fuseT >= 0.6) explodeKeg(k); }
    else if (k.mode === 'gone') {
      k.respawn -= dt;
      if (k.respawn <= 0 && dist(T.x, T.y, k.x, k.y) > 44) { k.mode = 'ok'; k.fuseT = 0; }
    }
  }
  for (const b of D.blasts) b.t += dt;
  D.blasts = D.blasts.filter(b => b.t < b.dur);
  // 果樹與果子
  for (const t of D.trees) if (!t.hasFruit) { t.regrow -= dt; if (t.regrow <= 0) t.hasFruit = true; }
  for (const f of D.fruits) if (f.eating) f.eatT += dt;
  D.fruits = D.fruits.filter(f => !(f.eating && f.eatT >= 3));
}
function startLasso(m) {
  m.lassoed = true; cancelWarns(m); cancelBurst(m); m.casting = false;
  const T = D.tamer;
  D.lasso = { m, t: 0, limit: 5 + topLv('tanuki'), sum: 0, last: Math.atan2(T.y - m.y, T.x - m.x) };
  D.ring.m = null; D.ring.t = 0;
  Snd.play('capture_ready'); tut('lasso');
}
function breakLasso(reason) {
  if (!D.lasso) return;
  const m = D.lasso.m;
  m.lassoed = false;
  Snd.play('lasso_break');
  ev('lasso_break', { dungeon: D.id, species: m.sp, reason, x: Math.round(D.tamer.x), y: Math.round(D.tamer.y) });
  D.lasso = null; D.ring.m = null; D.ring.t = 0;
}
function captureDone() {
  const L = D.lasso, m = L.m;
  D.ropes--;
  const auto = G.stageInit && stageCount() < 20;
  const b = addMonster(m.sp, auto);
  G.cap[m.sp]++;
  D.caps.push(m.sp);
  addDFloat(m.x, m.y - 40, '收服!', 'capture');
  Snd.play('capture'); tut('capture');
  ev('capture', { dungeon: D.id, species: m.sp, num: b.num, elapsed: +D.elapsed.toFixed(1), x: Math.round(m.x), y: Math.round(m.y) });
  m.dead = true; m.nest.mon = null; m.nest.respawn = D.respawnT;
  D.lasso = null; D.ring.m = null; D.ring.t = 0;
  if (D.id === 'meadow') {
    if (D.caps.length === 1) tutTrig(5);
    if (D.caps.length >= 2 && D.endT < 0) D.endT = 0.6;   // 讓「2/2」完成特效播完再結束
  }
}
function updateCapture(dt) {
  const T = D.tamer;
  if (D.lasso) {
    const L = D.lasso, m = L.m;
    L.t += dt;
    const a = Math.atan2(T.y - m.y, T.x - m.x);
    L.sum += normAng(a - L.last); L.last = a;
    if (dist(T.x, T.y, m.x, m.y) > 220) { breakLasso('distance'); return; }
    if (L.t >= L.limit) { breakLasso('timeout'); return; }
    if (Math.abs(L.sum) / (Math.PI * 2) >= 1) captureDone();
    return;
  }
  if (D.ropes <= 0) { D.ring.m = null; D.ring.t = 0; return; }
  let best = null, bd = 1e9;
  for (const m of D.mons) {
    if (m.dead || !isWeak(m) || m.tp === 1) continue;
    const d = dist(T.x, T.y, m.x, m.y);
    if (d <= 40 && d < bd) { best = m; bd = d; }
  }
  if (!best) { D.ring.m = null; D.ring.t = 0; return; }
  if (D.ring.m !== best) { D.ring.m = best; D.ring.t = 0; }
  D.ring.t += dt;
  if (D.ring.t >= captureDur()) startLasso(best);
}

function updateDungeon(dt) {
  D.elapsed += dt;
  if (D.timed) D.timeLeft -= dt;
  updateTamer(dt);
  updateObjects(dt);
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
  const T = D.tamer;
  if (T.hearts <= 0) {
    ev('player_down', { dungeon: D.id, x: Math.round(T.x), y: Math.round(T.y), elapsed: +D.elapsed.toFixed(1) });
    if (D.id === 'meadow') T.hearts = T.maxHearts;   // 教學不會失敗: 補滿心、原地繼續
    else { endDungeon('down'); return; }
  }
  if (D.timed && D.timeLeft <= 0) { endDungeon('time'); return; }
  if (D.endT >= 0) { D.endT -= dt; if (D.endT <= 0) endDungeon('tutorial'); }
}
function endDungeon(reason) {
  if (D.lasso) { D.lasso.m.lassoed = false; D.lasso = null; }
  DR = { reason, captures: D.caps.slice(), kills: D.kills, gold: D.killGold };
  ev('dungeon_end', { day: G.day, dungeon: D.id, reason, dur: +D.elapsed.toFixed(1), captures: D.caps.slice(), kills: D.kills, heartsLost: D.heartsLost, gold: D.killGold });
  Snd.play('dungeon_end');
  if (D.id === 'meadow') tutForceSkip(5);
  D = null;
  checkUnlock();
  setScene('dresult');
}
function dresultInput() {
  if (!pressed.z) return;
  Snd.play('ui_confirm');
  if (G.day === 0) enterSetup1();
  else advanceDay('dungeon');
}

// ───────────────────────── 布置 ─────────────────────────
const UI = { floats: [] };
function uiFloat(x, y, text, kind) { UI.floats.push({ x, y, text, kind, t: 0, dur: 1 }); }
function enterSetup1() {
  if (G.day >= 1 && !G.stageInit) { G.bank.forEach((b, i) => { b.on = i < 20; }); G.stageInit = true; }
  G.s1 = { cur: 0, top: 0, zone: 'grid', back: 0 };
  UI.floats = [];
  setScene('setup1');
}
// 格子游標移動(10 欄); 回傳 moved / up / down / ''
function gridMove(s, key, n) {
  const cur = s[key], row = Math.floor(cur / 10), last = Math.floor((n - 1) / 10);
  if (pressed.left) { if (cur % 10 > 0) { s[key]--; return 'moved'; } }
  else if (pressed.right) { if (cur % 10 < 9 && cur + 1 < n) { s[key]++; return 'moved'; } }
  else if (pressed.up) { if (row > 0) { s[key] -= 10; return 'moved'; } return 'up'; }
  else if (pressed.down) { if (row < last) { s[key] = Math.min(n - 1, cur + 10); return 'moved'; } return 'down'; }
  return '';
}
function fixScroll(s, key, n) {
  if (s[key] >= n) s[key] = Math.max(0, n - 1);
  const rows = Math.max(1, Math.ceil(n / 10)), row = Math.floor(s[key] / 10);
  if (row < s.top) s.top = row;
  if (row > s.top + 2) s.top = row - 2;
  s.top = clamp(s.top, 0, Math.max(0, rows - 3));
}
function setup1Input() {
  const s = G.s1, n = G.bank.length;
  fixScroll(s, 'cur', n);
  if (s.zone === 'grid') {
    const r = gridMove(s, 'cur', n);
    if (r === 'moved') Snd.play('ui_move');
    else if (r === 'down') { s.back = s.cur; s.zone = 'next'; Snd.play('ui_move'); }
    else if (pressed.z && n > 0) {
      const b = G.bank[s.cur];
      if (b.on) { b.on = false; Snd.play('ui_cancel'); }
      else if (stageCount() < 20) { b.on = true; Snd.play('ui_confirm'); }
      else Snd.play('ui_denied');
    } else if (pressed.x && n > 0) {
      const b = G.bank[s.cur], p = slotCenter(s.cur, false);
      if (doUpgrade(b, 'setup')) { uiFloat(p.x, p.y - 30, 'Lv↑', 'levelUp'); tut('upgrade'); }
      else Snd.play('ui_denied');
    }
    fixScroll(s, 'cur', n);
  } else if (s.zone === 'next') {
    if (pressed.up) { s.zone = 'grid'; s.cur = s.back; Snd.play('ui_move'); }
    else if (pressed.down) { s.zone = 'back'; Snd.play('ui_move'); }
    else if (pressed.z) {
      if (stageCount() >= 1) { Snd.play('ui_confirm'); G.s2 = { row: 0, col: 0, panel: null }; setScene('setup2'); }
      else Snd.play('ui_denied');
    }
  } else {
    if (pressed.up) { s.zone = 'next'; Snd.play('ui_move'); }
    else if (pressed.z) {
      if (G.day === 0) Snd.play('ui_denied');   // 見習日沒有「今天去哪?」可回
      else { Snd.play('ui_cancel'); enterPlace(); }
    }
  }
}

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
    if (pressed.up) { p.index = Math.max(0, p.index - 1); Snd.play('ui_move'); }
    else if (pressed.down) { p.index = Math.min(p.options.length - 1, p.index + 1); Snd.play('ui_move'); }
    else if (pressed.x) { s.panel = null; Snd.play('ui_cancel'); }
    else if (pressed.z) {
      const o = p.options[p.index];
      G.rows[s.row][p.layer === 'cue' ? 'cue' : 'prog'] = o.key === 'clear' ? '' : o.key;
      s.panel = null; Snd.play('ui_confirm');
    }
    return;
  }
  if (s.row === 6) {
    if (pressed.up) { s.row = 5; Snd.play('ui_move'); }
    else if (pressed.z) { Snd.play('ui_confirm'); startShow(); }
    else if (pressed.x) { Snd.play('ui_cancel'); setScene('setup1'); }
    return;
  }
  if (pressed.up) { s.row = Math.max(0, s.row - 1); Snd.play('ui_move'); }
  else if (pressed.down) { s.row++; Snd.play('ui_move'); }
  else if (pressed.left) { s.col = 0; Snd.play('ui_move'); }
  else if (pressed.right) { s.col = 1; Snd.play('ui_move'); }
  else if (pressed.x) { G.rows[s.row][s.col === 0 ? 'cue' : 'prog'] = ''; Snd.play('ui_cancel'); }
  else if (pressed.z) {
    const layer = s.col === 0 ? 'cue' : 'program';
    s.panel = { layer, options: panelOptions(layer === 'cue' ? 'cue' : 'prog'), index: 0 };
    Snd.play('ui_confirm');
  }
}

// ───────────────────────── 表演場 ─────────────────────────
function startShow() {
  const tutorial = G.day === 0;
  S = {
    tutorial, left: tutorial ? 30 : 45, total: tutorial ? 30 : 45, clock: 0, mons: [], hz: [], floats: [], banner: null,
    rows: G.rows.map(r => ({ cue: r.cue, prog: r.prog, complete: !!(r.cue && r.prog) })),
    cur: -1, waitT: 0, sinceFire: 0, ev: { chain3: false, multi3: false },
    move: null, spots: [], fame: 0, best: 0, performs: 0, redPerforms: 0, loose: null,
    fences: { top: [], bottom: [] }, vis: { top: [], bottom: [] },
  };
  for (let i = 0; i < 8; i++) {
    S.fences.top.push(false); S.fences.bottom.push(false);
    S.vis.top.push({ mode: 'watch', t: 0 }); S.vis.bottom.push({ mode: 'watch', t: 0 });
  }
  let idx = 0;
  const roster = G.bank.filter(b => b.on).slice(0, 20);
  for (const b of roster) {
    const p = SHOW_POS[idx++];
    const m = {
      sp: b.sp, num: b.num, lv: b.lv, x: p[0], y: p[1], rage: tutorial ? 75 : 60, marks: 0, markT: 0, markAdd: 0, slow: false,
      perfT: rnd(0.5, 2), perfAct: -1, relayT: -1, relayChain: 0, lastRelay: -99, frozen: 0, target: 0, pend: false,
      fx: 'none', fxT: 0, progMove: false, hold: false,
      ang: rnd(0, Math.PI * 2), dirT: rnd(0.5, 2), cyc: rnd(0, 1), tp: 0, tpT: 0, teleT: rnd(0, 2.5), swooping: false,
      face: 1, move: 'walk', moveT: 0, moveDur: 0, burst: null,
    };
    if (b.sp === 'penguin' || b.sp === 'parrot') m.cyc = rnd(0, 2);
    S.mons.push(m);
  }
  S.cur = S.rows.findIndex(r => r.complete);
  ev('setup_done', { day: G.day, roster: roster.map(b => ({ species: b.sp, num: b.num, level: b.lv })), rows: G.rows.map(r => ({ cue: r.cue, program: r.prog })) });
  Snd.play('show_start');
  if (tutorial) tutForceSkip(10);   // 沒走完的布置階段收掉; 階段 11 讓它在表演場播完成特效
  setScene('show');
}
function rl(m) { return redLowOf(m.lv); }
function intervalShow(m) { return m.rage < 50 ? 6 : 4 - 2.5 * (m.rage - 50) / 50; }
function addSFloat(x, y, text, kind) { S.floats.push({ x, y, text, kind, t: 0, dur: 1 }); }

function pickAim(m) {
  let best = null, bd = 1e9;
  for (const o of S.mons) {
    if (o === m || o.target <= 0) continue;
    const d = dist(m.x, m.y, o.x, o.y); if (d < bd) { bd = d; best = o; }
  }
  if (!best) for (const o of S.mons) {
    if (o === m || (o.sp === 'tanuki' && o.tp === 1)) continue;
    const d = dist(m.x, m.y, o.x, o.y); if (d < bd) { bd = d; best = o; }
  }
  return best ? { x: best.x, y: best.y } : { x: 640, y: 356 };
}
function perform(m, chain) {
  m.perfAct = 0; m.perfT = intervalShow(m); m.relayT = -1;
  S.performs++;
  if (chain > S.best) S.best = chain;
  if (chain > G.bestChain) G.bestChain = chain;
  if (chain >= 3) S.ev.chain3 = true;
  const cast = newCast(m, chain, false);
  cast.red = m.rage >= rl(m);
  if (cast.red) { S.redPerforms++; Snd.once('red_perform'); if (!TUT.done[13]) { TUT.redMon = m; tutTrig(13); } }
  Snd.once('perform');
  if (chain >= 2) Snd.once('chain', chain);
  const t = pickAim(m);
  emitSkill(m, t.x, t.y, cast);
}
function checkSettle(c) {
  if (c.dungeon || c.settled || c.alive > 0) return;
  c.settled = true;
  if (scene !== 'show' || !S || S.loose) return;
  const n = c.hits.size, m = c.owner;
  if (n >= 3) S.ev.multi3 = true;
  const v = baseFame(m.sp, m.lv) * (1 + 0.5 * Math.min(4, n)) * (c.red ? 2 : 1) * (1 + 0.25 * (c.chain - 1));
  const f = Math.max(1, Math.round(v));
  S.fame += f;
  addSFloat(m.x, m.y - 70, '名聲 +' + f + (c.red ? ' ×2' : ''), c.red ? 'redFame' : 'fame');
  if (c.chain >= 2) addSFloat(m.x, m.y - 95, '連鎖 ' + c.chain, 'chain');
}

function markFx(m) {
  Snd.once('mark_add', m.marks);
  if (!TUT.done[14]) { TUT.markMon = m; tutTrig(14); }
  if (m.marks >= 3) ev('mark_peak', { day: G.day, species: m.sp, num: m.num, marks: m.marks, elapsed: +S.clock.toFixed(1) });
}
function addMark(m) {
  m.markT = 4; m.markAdd = 1;
  if (S.tutorial && m.marks >= 4) return;   // 見習日標記最多到 4
  m.marks++; markFx(m);
  if (m.marks >= 5) m.pend = true;
}
// 怒氣上升(點燃型): skill = 是否為技能(技能才會引發接演)
function igniteMon(m, amt, skill, chain) {
  const old = m.rage;
  m.rage = Math.min(100, m.rage + amt);
  m.fx = 'ignited'; m.fxT = 0; Snd.once('ignite');
  if (m.marks > 0) {
    if (m.markAdd <= 0) addMark(m);
  } else if (m.rage >= 100 && (old < 100 || m.slow)) {
    m.marks = 1; m.markT = 4; m.markAdd = 1; m.slow = false; markFx(m);
  }
  if (skill && m.rage >= rl(m) && m.relayT < 0 && S.clock - m.lastRelay >= 1.5 && m.frozen <= 0 && !m.pend) {
    m.relayT = 0.3; m.relayChain = chain + 1; m.lastRelay = S.clock;
  }
}
function calmSkillHit(m) {
  m.fx = 'doused'; m.fxT = 0; Snd.once('calm');
  if (m.marks > 0) {
    m.marks--; m.markT = 4;
    if (m.marks === 0) { m.slow = true; m.markT = 0; }
  } else m.rage = Math.max(0, m.rage - 12);
}
function randPoint() { return { x: rnd(SHOW_B.x0, SHOW_B.x1), y: rnd(SHOW_B.y0, SHOW_B.y1) }; }
function applySkillHit(h, v) {
  const kind = h.kind, c = h.cast;
  c.hits.add(v);
  if (kind === 'pollen') calmSkillHit(v);
  else if (kind === 'match') igniteMon(v, 10, true, c.chain);
  else if (kind === 'gear') igniteMon(v, 6, true, c.chain);
  else if (kind === 'feather') { v.target = 4; v.fx = 'special'; v.fxT = 0; Snd.once('special'); }
  else if (kind === 'icebeam') { v.frozen = 1.5; v.fx = 'special'; v.fxT = 0; Snd.once('special'); }
  else if (kind === 'card') { const p = randPoint(); v.x = p.x; v.y = p.y; v.fx = 'special'; v.fxT = 0; Snd.once('special'); }
}
function validVictim(h, v) { return v !== h.owner && !h.cast.hits.has(v); }

function updateHazardsShow(dt) {
  for (const h of S.hz) {
    if (h.dead) continue;
    if (h.owner) { h.ox = h.owner.x; h.oy = h.owner.y; }
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

// 失控 = 表演立刻結束: 一切停住, 失控那隻衝向圍欄、撞破、觀眾逃走
function startLoose(m) {
  const side = m.y < 356 ? 'top' : 'bottom';
  S.loose = { m, t: 0, side, idx: clamp(Math.round((m.x - 165) / 136), 0, 7), broken: false, fled: false };
  m.marks = 0; m.frozen = 0; m.target = 0; m.relayT = -1; m.hold = false; m.progMove = false;
  m.move = 'walk'; m.moveT = 0; m.moveDur = 0;
  Snd.music(null); Snd.play('loose');
}
function updateLooseShow(dt) {
  const L = S.loose, m = L.m;
  L.t += dt;
  if (L.t <= 1.0 || !L.broken) {
    const fx = 165 + 136 * L.idx, fy = L.side === 'top' ? 140 : 572;
    const d = dist(m.x, m.y, fx, fy);
    if (L.t < 1.0 && d > 0.5) {
      const st = Math.min(200 * dt, d);
      m.x += (fx - m.x) / d * st; m.y += (fy - m.y) / d * st;
      if (Math.abs(fx - m.x) > 1) m.face = fx > m.x ? 1 : -1;
    }
  }
  if (L.t >= 1.0 && !L.broken) {
    L.broken = true; S.fences[L.side][L.idx] = true;
    for (const side of ['top', 'bottom']) for (const v of S.vis[side]) { v.mode = 'flee'; v.t = 0; }
    Snd.play('crowd_flee');
  }
  if (L.broken) for (const side of ['top', 'bottom']) for (const v of S.vis[side]) if (v.mode === 'flee') { v.t = Math.min(1.5, L.t - 1.0); }
  if (L.t >= 2.5) finishShow('loose');
}

function updateShowMon(m, dt) {
  if (m.fx !== 'none') { m.fxT += dt; if (m.fxT >= 0.5) { m.fx = 'none'; m.fxT = 0; } }
  if (m.perfAct >= 0) { m.perfAct += dt; if (m.perfAct >= 0.5) m.perfAct = -1; }
  if (m.target > 0) m.target = Math.max(0, m.target - dt);
  if (m.markAdd > 0) m.markAdd = Math.max(0, m.markAdd - dt);
  const frozen = m.frozen > 0;
  if (frozen) m.frozen = Math.max(0, m.frozen - dt);
  if (m.marks > 0) {
    m.markT -= dt;
    if (m.markT <= 0) {
      m.marks--; m.markT = 4;
      if (m.marks === 0) { m.slow = true; m.markT = 0; }
    }
  }
  if (!frozen && m.marks === 0) {
    if (m.slow) { m.rage = Math.max(0, m.rage - 2 * dt); if (m.rage < rl(m)) m.slow = false; }
    else m.rage = Math.max(0, m.rage - SP[m.sp].decay * dt);
  }
  if (m.burst && !frozen) stepBurst(m, dt);
  if (!frozen) {
    if (m.relayT >= 0) {
      m.relayT -= dt;
      if (m.relayT <= 0) { const ch = m.relayChain; m.relayT = -1; perform(m, ch); }
    }
    m.perfT -= dt;
    if (m.perfT <= 0) perform(m, 1);
  }
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
      for (const o of S.mons) if (o !== m) { const d = dist(m.x, m.y, o.x, o.y); if (d < nd) { nd = d; near = o; } }
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
  const act = S.mons;
  switch (key) {
    case 'wait': return S.sinceFire >= 6;
    case 'red1': return act.some(m => m.rage >= rl(m));
    case 'red3': return act.filter(m => m.rage >= rl(m)).length >= 3;
    case 'mark3': return act.some(m => m.marks >= 3);
    case 'cold': return act.length > 0 && act.filter(m => m.rage < 50).length * 2 >= act.length;
    case 'chain3': return S.ev.chain3;
    case 'multi3': return S.ev.multi3;
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
    const idx = S.cur;
    S.cur = nextComplete(S.cur);
    S.waitT = 1.5; S.sinceFire = 0;
    S.ev = { chain3: false, multi3: false };
    const n = fireProgram(row);
    ev('program_fire', { day: G.day, row: idx, cue: row.cue, program: row.prog, elapsed: +S.clock.toFixed(1), targets: n });
    Snd.play('cue_fire'); tut('fired');
  }
}
function pickTop(act) {
  let hi = -1;
  for (const m of act) if (m.rage > hi) hi = m.rage;
  let best = act.filter(m => m.rage === hi);
  let mk = -1; for (const m of best) if (m.marks > mk) mk = m.marks;
  best = best.filter(m => m.marks === mk);
  return best[Math.floor(Math.random() * best.length)] || null;
}
function fireProgram(row) {
  S.banner = { cue: row.cue, prog: row.prog, t: 0 };
  const act = S.mons;
  let n = 0;
  switch (row.prog) {
    case 'ice':
      for (const m of act) if (m.rage >= rl(m) && m.marks === 0) { m.rage = Math.max(0, m.rage - 20); m.fx = 'doused'; m.fxT = 0; n++; }
      if (n) Snd.once('calm');
      break;
    case 'pep':
      for (const m of act) if (m.rage < 50) { igniteMon(m, 25, false, 0); n++; }
      break;
    case 'scatter': S.move = { type: 'scatter', left: 3, target: null }; act.forEach(m => { m.fx = 'special'; m.fxT = 0; }); n = act.length; break;
    case 'mob': {
      const t = pickTop(act);
      if (t) { S.move = { type: 'mob', left: 3, target: t }; act.forEach(m => { m.fx = 'special'; m.fxT = 0; }); n = act.length - 1; }
      break;
    }
    case 'tutti':
      for (const m of act) if (m.rage >= rl(m) && m.frozen <= 0) { perform(m, 1); n++; }
      break;
    case 'lull':
      for (const m of act) if (m.marks > 0) { m.marks = 0; m.markT = 0; m.rage = 75; m.slow = false; m.fx = 'doused'; m.fxT = 0; n++; }
      if (n) Snd.once('calm');
      break;
    case 'spot': {
      const t = pickTop(act);
      if (t) {
        if (t.frozen <= 0) perform(t, 1);
        S.spots.push({ m: t, left: 0.6 }, { m: t, left: 1.2 }); n = 1;
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
        m.x = p.x; m.y = p.y; placed.push(p); m.fx = 'special'; m.fxT = 0; n++;
      }
      Snd.once('special');
      break;
    }
  }
  return n;
}

function updateShow(dt) {
  if (S.loose) { updateLooseShow(dt); return; }
  S.clock += dt; S.left -= dt;
  updateProgram(dt);
  if (S.move) { S.move.left -= dt; if (S.move.left <= 0) S.move = null; }
  for (const m of S.mons) updateShowMon(m, dt);
  for (const sp of S.spots) {
    sp.left -= dt;
    if (sp.left <= 0 && !sp.done) { sp.done = true; if (sp.m.frozen <= 0) perform(sp.m, 1); }
  }
  S.spots = S.spots.filter(s => !s.done);
  updateHazardsShow(dt);
  if (S.banner) { S.banner.t += dt; if (S.banner.t >= 0.8) S.banner = null; }
  for (const f of S.floats) f.t += dt;
  S.floats = S.floats.filter(f => f.t < f.dur);
  // 同一幀多隻達 5 標記: 取怪物庫順序最前的那隻當主角
  const pend = S.mons.find(m => m.pend);
  if (pend) { startLoose(pend); return; }
  if (S.left <= 0) { S.left = 0; finishShow('time'); }
}
function finishShow(reason) {
  const fame = S.fame, gold = 20 + Math.round(8 * Math.sqrt(fame));
  const loose = reason === 'loose';
  const L = S.loose;
  G.rep += fame; G.gold += gold; G.goldEarned += gold;
  if (S.best > G.bestChain) G.bestChain = S.best;
  SR = { fame, gold, tallyT: 0, tallyDur: 1.5, loose, timeLeft: loose ? Math.round(Math.max(0, S.left)) : 0, bestChain: S.best, tutorial: S.tutorial, tickT: 0 };
  const o = { day: G.day, reason, dur: +(S.total - Math.max(0, S.left)).toFixed(1), fame, gold, bestChain: S.best, performs: S.performs, redPerforms: S.redPerforms };
  if (loose) { o.looseSpecies = L.m.sp; o.looseNum = L.m.num; o.looseX = Math.round(L.m.x); o.looseY = Math.round(L.m.y); }
  ev('show_end', o);
  if (!loose) Snd.play('show_end');
  if (S.tutorial) tutForceSkip(12);
  S = null;
  checkUnlock();
  setScene('sresult');
}
function sresultInput(dt) {
  if (SR.tallyT < SR.tallyDur) {
    SR.tallyT = Math.min(SR.tallyDur, SR.tallyT + dt);
    SR.tickT -= dt; if (SR.tickT <= 0) { SR.tickT = 0.12; Snd.play('coin_tally'); }
    return;
  }
  if (pressed.z) {
    Snd.play('ui_confirm');
    if (SR.tutorial) { tutorialDone = true; beginDay(1); }
    else advanceDay('show');
  }
}

// ───────────────────────── 商店 ─────────────────────────
const SHOP_TABS = ['char', 'show', 'monster'];
const SHOP_ITEMS = {
  char: ['club', 'sword', 'spear', 'whip', 'attack', 'armor', 'ropeBag'],
  show: ['cold', 'red3', 'mark3', 'chain3', 'multi3', 'pep', 'scatter', 'mob', 'lull', 'spot', 'shuffle'],
};
const WEAPON_PRICE = { sword: 60, spear: 60, whip: 60 };
const WEAPON_DESC = { club: 'Z 敲擊 X 無', sword: 'Z 斬擊可打回飛彈 X 擊暈', spear: 'Z 長刺 X 突進', whip: 'Z 整圈抽打 X 擊飛' };
const ENH_DESC = { attack: '每次攻擊傷害 +1', armor: '心上限 +1', ropeBag: '每天捕獸繩 +1' };
function shopState(item) {
  const o = { item, cost: 0, level: 0, owned: false, equipped: false, affordable: false, fameReq: 0, fameLocked: false };
  if (WEAPON_DESC[item]) {
    o.owned = !!G.ownedWeapons[item]; o.equipped = G.weapon === item;
    o.cost = o.owned ? 0 : WEAPON_PRICE[item]; o.affordable = !o.owned && G.gold >= o.cost;
  } else if (ENH_DESC[item]) {
    o.cost = G.prices[item]; o.affordable = G.gold >= o.cost;
    o.level = item === 'attack' ? G.atkBought : item === 'armor' ? G.armorBought : G.ropeBought;
  } else if (CUE_BY[item] || PROG_BY[item]) {
    const def = CUE_BY[item] || PROG_BY[item], own = CUE_BY[item] ? G.ownedCues : G.ownedProgs;
    o.owned = !!own[item]; o.fameReq = def.fame; o.fameLocked = !o.owned && G.rep < def.fame;
    o.cost = o.owned ? 0 : def.price; o.affordable = !o.owned && !o.fameLocked && G.gold >= o.cost;
  }
  return o;
}
function shopDetailLines(item) {
  if (WEAPON_DESC[item]) return [WEAPON_DESC[item]];
  if (ENH_DESC[item]) return [ENH_DESC[item]];
  if (CUE_BY[item]) return [CUE_BY[item].desc];
  if (PROG_BY[item]) return [PROG_BY[item].desc];
  return [];
}
function shopBuy(item) {
  const st = shopState(item);
  const bought = (cost) => { Snd.play('buy'); ev('shop_buy', { day: G.day, item, cost, goldLeft: G.gold }); };
  if (WEAPON_DESC[item]) {
    if (st.owned) { G.weapon = item; bought(0); return; }
    if (G.gold >= st.cost) { G.gold -= st.cost; G.ownedWeapons[item] = true; G.weapon = item; bought(st.cost); } else Snd.play('ui_denied');
  } else if (ENH_DESC[item]) {
    if (G.gold < st.cost) { Snd.play('ui_denied'); return; }
    G.gold -= st.cost; G.prices[item] = Math.round(G.prices[item] * 1.5);
    if (item === 'attack') G.atkBought++; else if (item === 'armor') G.armorBought++; else G.ropeBought++;
    bought(st.cost);
  } else if (CUE_BY[item] || PROG_BY[item]) {
    if (st.owned) return;
    if (st.fameLocked || G.gold < st.cost) { Snd.play('ui_denied'); return; }
    G.gold -= st.cost;
    if (CUE_BY[item]) G.ownedCues[item] = true; else G.ownedProgs[item] = true;
    bought(st.cost);
  }
}
function shopInput() {
  const s = G.shop, tab = s.tab;
  const items = tab < 2 ? SHOP_ITEMS[SHOP_TABS[tab]] : null;
  const n = tab < 2 ? items.length : G.bank.length;
  if (tab === 2) fixScroll(s, 'idx', n);
  if (s.zone === 'tab') {
    if (pressed.left && s.tab > 0) { s.tab--; s.idx = 0; s.top = 0; Snd.play('ui_move'); tut('tab'); }
    else if (pressed.right && s.tab < 2) { s.tab++; s.idx = 0; s.top = 0; Snd.play('ui_move'); tut('tab'); }
    else if (pressed.down) { s.zone = n > 0 ? 'grid' : 'go'; s.idx = 0; s.top = 0; Snd.play('ui_move'); }
  } else if (s.zone === 'grid') {
    if (tab < 2) {
      const r = Math.floor(s.idx / 3), c = s.idx % 3;
      if (pressed.left) { if (c > 0) { s.idx--; Snd.play('ui_move'); } }
      else if (pressed.right) { if (c < 2 && s.idx + 1 < n) { s.idx++; Snd.play('ui_move'); } }
      else if (pressed.up) { if (r > 0) s.idx -= 3; else s.zone = 'tab'; Snd.play('ui_move'); }
      else if (pressed.down) { if (s.idx + 3 < n) s.idx += 3; else s.zone = 'go'; Snd.play('ui_move'); }
      else if (pressed.z) shopBuy(items[s.idx]);
    } else {
      const r = gridMove(s, 'idx', n);
      if (r === 'moved') Snd.play('ui_move');
      else if (r === 'up') { s.zone = 'tab'; Snd.play('ui_move'); }
      else if (r === 'down') { s.zone = 'go'; Snd.play('ui_move'); }
      else if (pressed.z) {
        const b = G.bank[s.idx], p = slotCenter(s.idx, true);
        if (doUpgrade(b, 'shop')) { uiFloat(p.x, p.y - 30, 'Lv↑', 'levelUp'); tut('upgrade'); }
        else Snd.play('ui_denied');
      }
      fixScroll(s, 'idx', n);
    }
  } else {
    if (pressed.up) {
      s.zone = 'grid';
      if (tab < 2) s.idx = Math.floor((n - 1) / 3) * 3; else { s.idx = Math.floor((n - 1) / 10) * 10; fixScroll(s, 'idx', n); }
      Snd.play('ui_move');
    } else if (pressed.z) { Snd.play('ui_cancel'); enterPlace(); }
  }
}

// ───────────────────────── 總結算 ─────────────────────────
function toResult() {
  const stars = G.rep >= 1600 ? 3 : G.rep >= 900 ? 2 : G.rep >= 400 ? 1 : 0;
  RS = { t: 0, stars, shown: 0 };
  ev('game_end', { fame: G.rep, stars, goldEarned: G.goldEarned, bestChain: G.bestChain, days: G.log.slice(), bankSize: G.bank.length });
  downloadLog();
  setScene('result');
}
function resultInput(dt) {
  RS.t += dt;
  while (RS.shown < RS.stars && RS.t >= 0.8 + 0.6 * RS.shown) { RS.shown++; Snd.play('star'); }
  if (pressed.z) {
    Snd.play('ui_confirm');
    logStart(true);
    newRun(true);
    beginDay(1);
  }
}

// ───────────────────────── 主更新 ─────────────────────────
function update(dt) {
  Snd.frame = {};
  switch (scene) {
    case 'title': TITLE_T += dt; titleInput(); break;
    case 'calendar': calendarInput(dt); break;
    case 'place': placeInput(dt); break;
    case 'select': selectInput(); break;
    case 'dungeon': updateDungeon(dt); break;
    case 'dresult': dresultInput(); break;
    case 'setup1': setup1Input(); break;
    case 'setup2': setup2Input(); break;
    case 'show': updateShow(dt); break;
    case 'sresult': sresultInput(dt); break;
    case 'shop': shopInput(); break;
    case 'result': resultInput(dt); break;
  }
  for (const f of UI.floats) f.t += dt;
  UI.floats = UI.floats.filter(f => f.t < f.dur);
  pressed = {};
  tutUpdate(dt);
}

// ───────────────────────── 繪製 ─────────────────────────
function hudMessage() {
  switch (scene) {
    case 'place': return '←→ 選擇 Z 決定 ↓ 聲音';
    case 'select': return '←→ 選擇 Z 進入 X 返回';
    case 'dungeon':
      if (D.lasso) return '繞牠一圈!';
      if (D.ring.m) return '站住別動';
      if (D.tamer.hidden) return '躲藏中';
      if (D.id === 'meadow') return '收服火柴猴 ' + Math.min(2, D.caps.length) + '/2';
      return 'Z 攻擊 X 武器技';
    case 'dresult': case 'sresult': return 'Z 繼續';
    case 'setup1': return G.s1.zone === 'grid' ? 'Z 上場/下場 X 升級這隻 ↓ 下一步' : 'Z 確定 ↑ 回格子';
    case 'setup2':
      if (G.s2.panel) return '↑↓ 選 Z 確定 X 取消';
      return G.s2.row === 6 ? 'Z 開演 X 回上一步' : '↑↓ 選列 ←→ 暗號/節目 Z 放入 X 清空';
    case 'show': return '表演中…';
    case 'shop': return G.shop.tab === 2 ? 'Z 升級這隻' : '←→ 切分頁 方向鍵選擇 Z 購買';
    case 'result': return 'Z 重來';
  }
  return '';
}
function hudState() {
  const inD = scene === 'dungeon' && D, inS = scene === 'show' && S;
  return {
    phase: scene, day: G.day, dayMax: DAY_MAX, gold: G.gold, rep: G.rep, showFame: inS ? S.fame : 0,
    hearts: inD ? D.tamer.hearts : 0, maxHearts: inD ? D.tamer.maxHearts : 0,
    ropes: inD ? D.ropes : 0, ropeMax: inD ? ropeMaxNow() : 0,
    weapon: G.weapon, xCdLeft: inD ? D.tamer.xCd : 0, xCdMax: inD ? xCdMax() : 0,
    timeLeft: inD ? (D.timed ? Math.max(0, D.timeLeft) : 0) : inS ? Math.max(0, S.left) : 0,
    timeMax: inD ? (D.timed ? 75 : 0) : inS ? S.total : 0,
    dungeon: inD ? D.id : '', message: hudMessage(),
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
function tileKind(ch) { return ch === '#' ? 'wall' : ch === 'o' ? 'pillar' : ch === 'L' ? 'hurt' : ch === 'W' ? 'slow' : ch === 'G' ? 'bush' : 'floor'; }
function onScr(x, y, m) { return x > -m && x < CW + m && y > 100 - m && y < CH + m; }

function renderDungeon() {
  const T = D.tamer, id = D.id, cam = camOf(), ox = cam.x, oy = cam.y;
  Art.drawBackground(ctx, { scene: 'dungeon' });
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 100, CW, CH - 100); ctx.clip();
  const wy0 = oy + 100;
  const c0 = Math.max(0, Math.floor(ox / TILE)), c1 = Math.min(D.W - 1, Math.floor((ox + 1280) / TILE));
  const r0 = Math.max(0, Math.floor(wy0 / TILE)), r1 = Math.min(D.H - 1, Math.floor((wy0 + 620) / TILE));
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    const ch = D.grid[r][c], x = c * TILE + 30 - ox, y = r * TILE + 30 - oy;
    if (ch === 'X') Art.drawCrackWall(ctx, { x, y, dungeon: id, cracks: D.cracks[r * D.W + c] || 0 });
    else Art.drawTile(ctx, { x, y, dungeon: id, kind: tileKind(ch), nest: ch === 'n' });
  }
  for (const f of D.fountains) {
    const x = f.x - ox, y = f.y - oy; if (!onScr(x, y, 60)) continue;
    Art.drawFountain(ctx, { x, y, dungeon: id, full: f.full });
  }
  for (const p of D.portals) {
    const x = p.x - ox, y = p.y - oy; if (!onScr(x, y, 60)) continue;
    Art.drawPortal(ctx, { x, y, dungeon: id, id: p.id, charge: clamp(p.charge / 0.3, 0, 1), cooling: D.pairCd[p.id] > 0 });
  }
  for (const t of D.trees) {
    const x = t.x - ox, y = t.y - oy; if (!onScr(x, y, 60)) continue;
    Art.drawFruitTree(ctx, { x, y, dungeon: id, hasFruit: t.hasFruit });
  }
  for (const f of D.fruits) {
    const x = f.x - ox, y = f.y - oy; if (!onScr(x, y, 40)) continue;
    Art.drawFruit(ctx, { x, y, dungeon: id, eating: f.eating, eatT: f.eating ? Math.min(3, f.eatT) : 0, eatDur: 3 });
  }
  drawHazards(D.hz, true, ox, oy);
  if (D.ring.m) Art.drawCaptureRing(ctx, { x: D.ring.m.x - ox, y: D.ring.m.y - oy, t: D.ring.t, dur: captureDur() });
  for (const k of D.kegs) {
    const x = k.x - ox, y = k.y - oy; if (!onScr(x, y, 140)) continue;
    const fuse = k.mode === 'fuse';
    Art.drawKeg(ctx, { x, y, dungeon: id, mode: k.mode, fuseT: fuse ? Math.min(0.6, k.fuseT) : 0.6, fuseDur: 0.6, radius: 130 });
  }
  for (const m of D.mons) {
    const x = m.x - ox, y = m.y - oy; if (!onScr(x, y, 90)) continue;
    Art.drawWildMonster(ctx, { x, y, species: m.sp, hp: m.hp, maxHp: m.maxHp, hit: m.hitT > 0, weak: isWeak(m),
      stunLeft: m.stun, stunDur: 2, lassoed: m.lassoed, casting: m.casting, move: m.move, moveT: m.moveT, moveDur: m.moveDur, dir: m.face });
  }
  if (D.lasso) {
    const L = D.lasso, m = L.m;
    Art.drawLasso(ctx, { x1: T.x - ox, y1: T.y - oy, x2: m.x - ox, y2: m.y - oy, progress: clamp(Math.abs(L.sum) / (Math.PI * 2), 0, 1),
      t: L.t, limit: L.limit, len: dist(T.x, T.y, m.x, m.y), maxLen: 220 });
  }
  Art.drawTamer(ctx, { x: T.x - ox, y: T.y - oy, facing: T.facing, weapon: T.weapon, dashing: !!T.dash, blink: T.invuln > 0,
    lassoing: !!D.lasso, slowed: T.slowT > 0, hidden: !!T.hidden });
  for (const f of D.fx) {
    Art.drawWeaponFx(ctx, { x: f.x - ox, y: f.y - oy, weapon: f.weapon, move: f.move, shape: f.shape, angle: f.angle, spread: f.spread,
      radius: f.radius, length: f.length, width: f.width, t: f.t, dur: f.dur });
  }
  drawHazards(D.hz, false, ox, oy);
  for (const b of D.blasts) {
    const x = b.x - ox, y = b.y - oy; if (!onScr(x, y, 140)) continue;
    Art.drawBlast(ctx, { x, y, radius: 130, t: b.t, dur: b.dur });
  }
  for (const f of D.floats) Art.drawFloatText(ctx, { x: f.x - ox, y: f.y - oy - f.t * 30, text: f.text, kind: f.kind, t: f.t, dur: f.dur });
  ctx.restore();
  Art.drawHud(ctx, hudState());
  renderTutorial();
}

function renderShow() {
  Art.drawShowArena(ctx, {});
  drawHazards(S.hz, true, 0, 0);
  const L = S.loose;
  const showMon = (m, charge) => {
    const isL = !!L && L.m === m;
    let mode = 'roam';
    if (isL) mode = 'charge'; else if (L) mode = 'stopped'; else if (m.hold) mode = 'hold'; else if (m.progMove) mode = 'program';
    Art.drawShowMonster(ctx, {
      x: m.x, y: m.y, species: m.sp, level: m.lv, rage: m.rage, redLow: rl(m),
      marks: isL ? 0 : Math.min(4, m.marks), markLeft: m.marks > 0 ? Math.max(0, m.markT) : 0, markDur: 4, mode, target: m.target > 0,
      frozenLeft: m.frozen, frozenDur: 1.5, performing: m.perfAct >= 0, performT: m.perfAct >= 0 ? m.perfAct : 0, performDur: 0.5,
      fx: m.fx, fxT: m.fx === 'none' ? 0 : m.fxT, fxDur: 0.5,
      looseT: isL ? L.t : 0, looseDur: 2.5,
      move: m.move, moveT: m.moveT, moveDur: m.moveDur, dir: m.face,
    });
  };
  for (const m of S.mons) if (!(L && L.m === m)) showMon(m);
  drawHazards(S.hz, false, 0, 0);
  if (S.banner) Art.drawBannerFx(ctx, { x: 640, y: 180, cue: S.banner.cue, program: S.banner.prog, t: S.banner.t, dur: 0.8 });
  for (const side of ['top', 'bottom']) {
    for (let i = 0; i < 8; i++) {
      const v = S.vis[side][i];
      Art.drawFence(ctx, { x: 165 + 136 * i, y: side === 'top' ? 140 : 572, side, broken: S.fences[side][i] });
      const mode = v.mode === 'flee' ? (v.t >= 1.5 ? 'empty' : 'flee') : 'watch';
      Art.drawVisitor(ctx, { x: 165 + 136 * i, y: side === 'top' ? 95 : 622, side, mode, fleeT: mode === 'flee' ? v.t : 0, fleeDur: 1.5 });
    }
  }
  if (L) {
    showMon(L.m);
    Art.drawLooseFx(ctx, { x: L.m.x, y: L.m.y, t: Math.min(2.5, L.t), dur: 2.5 });
  }
  for (let i = 0; i < 6; i++) {
    const r = S.rows[i], cur = i === S.cur;
    const waiting = cur && r.cue === 'wait' && S.waitT <= 0;
    Art.drawCueRow(ctx, { x: 110 + 212 * i, y: 691, style: 'mini', index: i, cue: r.cue, program: r.prog, complete: r.complete, selCell: -1,
      current: cur, t: waiting ? Math.min(6, S.sinceFire) : 0, dur: waiting ? 6 : 0, switching: cur && S.waitT > 0 });
  }
  for (const f of S.floats) Art.drawFloatText(ctx, { x: f.x, y: f.y - f.t * 30, text: f.text, kind: f.kind, t: f.t, dur: f.dur });
  Art.drawHud(ctx, hudState());
  renderTutorial();
}

function bankSlotState(b, i, x, y, selected) {
  return { x, y, species: b.sp, num: b.num, level: b.lv, effect: SP[b.sp].effect, onStage: b.on, selected, canUpgrade: canUpgrade(b) };
}
function drawBank(s, key, shop, selected) {
  const n = G.bank.length;
  for (let i = s.top * 10; i < Math.min(n, (s.top + 3) * 10); i++) {
    const p = slotCenter(i, shop);
    Art.drawBankSlot(ctx, bankSlotState(G.bank[i], i, p.x, p.y, selected && i === s[key]));
  }
  const rows = Math.ceil(n / 10);
  if (s.top > 0) Art.drawScrollMark(ctx, { x: 640, y: shop ? 128 : 58, dir: 'up' });
  if (s.top + 3 < rows) Art.drawScrollMark(ctx, { x: 640, y: shop ? 492 : 437, dir: 'down' });
}
function renderSetup1() {
  const s = G.s1;
  Art.drawBackground(ctx, { scene: 'setup1' });
  drawBank(s, 'cur', false, s.zone === 'grid');
  const b = G.bank[Math.min(s.cur, G.bank.length - 1)];
  if (b) Art.drawMonsterInfo(ctx, { x: 480, y: 555, species: b.sp, num: b.num, desc: SP[b.sp].desc, total: stageCount(), totalMax: 20, lines: upgradeLines(b) });
  Art.drawButton(ctx, { x: 960, y: 470, w: 220, h: 70, label: '下一步', selected: s.zone === 'next' });
  Art.drawButton(ctx, { x: 960, y: 570, w: 220, h: 70, label: '返回', selected: s.zone === 'back' });
  for (const f of UI.floats) Art.drawFloatText(ctx, { x: f.x, y: f.y - f.t * 30, text: f.text, kind: f.kind, t: f.t, dur: f.dur });
  Art.drawHud(ctx, hudState());
  renderTutorial();
}
function renderSetup2() {
  const s = G.s2;
  Art.drawBackground(ctx, { scene: 'setup2' });
  for (let i = 0; i < 6; i++) {
    const r = G.rows[i];
    Art.drawCueRow(ctx, { x: 380, y: 100 + 78 * i, style: 'row', index: i, cue: r.cue, program: r.prog, complete: !!(r.cue && r.prog),
      selCell: s.row === i ? s.col : -1, current: false, t: 0, dur: 0, switching: false });
  }
  Art.drawButton(ctx, { x: 280, y: 580, w: 200, h: 70, label: '開演', selected: s.row === 6 });
  if (s.panel) Art.drawPickerPanel(ctx, { layer: s.panel.layer, options: s.panel.options, index: s.panel.index });
  Art.drawHud(ctx, hudState());
  renderTutorial();
}
function renderShop() {
  const s = G.shop, tab = SHOP_TABS[s.tab];
  Art.drawBackground(ctx, { scene: 'shop' });
  SHOP_TABS.forEach((t, i) => Art.drawShopTab(ctx, { x: 400 + 240 * i, y: 85, tab: t, current: i === s.tab, selected: s.zone === 'tab' && i === s.tab }));
  let lines = [];
  if (s.tab < 2) {
    const items = SHOP_ITEMS[tab];
    items.forEach((it, i) => {
      const st = shopState(it);
      st.x = 220 + 420 * (i % 3); st.y = 170 + 100 * Math.floor(i / 3); st.selected = s.zone === 'grid' && s.idx === i;
      Art.drawShopItem(ctx, st);
    });
    if (s.zone === 'grid') lines = shopDetailLines(items[s.idx]);
  } else {
    drawBank(s, 'idx', true, s.zone === 'grid');
    if (s.zone === 'grid' && G.bank[s.idx]) lines = upgradeLines(G.bank[s.idx]);
  }
  Art.drawShopDetail(ctx, { x: 640, y: 570, lines });
  Art.drawButton(ctx, { x: 540, y: 625, w: 200, h: 70, label: '離開', selected: s.zone === 'go' });
  for (const f of UI.floats) Art.drawFloatText(ctx, { x: f.x, y: f.y - f.t * 30, text: f.text, kind: f.kind, t: f.t, dur: f.dur });
  Art.drawHud(ctx, hudState());
  renderTutorial();
}

function render() {
  switch (scene) {
    case 'title': Art.drawTitle(ctx, { t: TITLE_T }); break;
    case 'calendar': Art.drawCalendar(ctx, { day: G.day, dayMax: DAY_MAX, t: Math.min(CAL.t, CAL.dur), dur: CAL.dur, log: G.log.slice() }); break;
    case 'place': {
      Art.drawBackground(ctx, { scene: 'place' });
      const notes = ['抓魔物 · 過一天', '賺名聲 · 過一天', '買東西 · 不花時間'], places = ['dungeon', 'show', 'shop'];
      for (let i = 0; i < 3; i++) Art.drawPlaceCard(ctx, { x: 240 + 400 * i, y: 370, place: places[i], note: notes[i], selected: PL.zone === 'card' && i === G.placeCur });
      Art.drawButton(ctx, { x: 1060, y: 640, w: 190, h: 60, label: Snd.muted ? '聲音 關' : '聲音 開', selected: PL.zone === 'sound' });
      if (PL.notice) Art.drawFloatText(ctx, { x: 640, y: 110, text: PL.notice.text, kind: 'unlock', t: PL.notice.t, dur: 1.5 });
      Art.drawHud(ctx, hudState());
      renderTutorial();
      break;
    }
    case 'select':
      Art.drawBackground(ctx, { scene: 'select' });
      DUNGEON_ORDER.forEach((id, i) => Art.drawDungeonCard(ctx, { x: 240 + 400 * i, y: 390, dungeon: id, open: !!G.unlocked[id], condition: dungeonCondition(id), selected: i === SEL.cur }));
      Art.drawHud(ctx, hudState());
      break;
    case 'dungeon': renderDungeon(); break;
    case 'dresult':
      Art.drawBackground(ctx, { scene: 'dresult' });
      Art.drawDungeonResult(ctx, { reason: DR.reason, captures: DR.captures, kills: DR.kills, gold: DR.gold });
      Art.drawHud(ctx, hudState());
      break;
    case 'setup1': renderSetup1(); break;
    case 'setup2': renderSetup2(); break;
    case 'show': renderShow(); break;
    case 'sresult':
      Art.drawBackground(ctx, { scene: 'sresult' });
      Art.drawShowResult(ctx, { fame: SR.fame, gold: SR.gold, tallyT: SR.tallyT, tallyDur: SR.tallyDur, bestChain: SR.bestChain, loose: SR.loose, timeLeft: SR.timeLeft, tutorial: SR.tutorial });
      Art.drawHud(ctx, hudState());
      break;
    case 'shop': renderShop(); break;
    case 'result': {
      Art.drawBackground(ctx, { scene: 'result' });
      const bank = SPECIES.filter(sp => G.bank.some(b => b.sp === sp)).map(sp => ({ species: sp, count: G.bank.filter(b => b.sp === sp).length, maxLevel: topLv(sp) }));
      Art.drawResultPanel(ctx, { rep: G.rep, goldEarned: G.goldEarned, bestChain: G.bestChain, days: G.log.slice(), bank, stars: RS.shown });
      Art.drawHud(ctx, hudState());
      break;
    }
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

newRun(false);
Snd.music('title');
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
