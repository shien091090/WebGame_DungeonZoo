/* 伸縮擂台秀 — 玩法驗證 Demo。只用方向鍵 + Z、X。繪製一律走 Art.drawXxx。 */
(function () {
'use strict';

var CW = Art.canvas.width, CH = Art.canvas.height;
var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var dpr = window.devicePixelRatio || 1;
canvas.width = Math.round(CW * dpr);
canvas.height = Math.round(CH * dpr);
canvas.style.aspectRatio = CW + ' / ' + CH;

// ============================================================ 工具
function rnd(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
function normAng(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
function rndAng() { return Math.random() * Math.PI * 2; }
function remove(arr, x) { var i = arr.indexOf(x); if (i >= 0) arr.splice(i, 1); }

// ============================================================ 資料
var SP = ['bee', 'slug', 'shrimp', 'urchin', 'eel', 'bear'];
var SPD = {
  bee:    { name: '蜜蜂球',   hp: 7,  effect: 'ignite',      interval: 3.0, decay: 2,   gold: 2, repv: 1, kill: 3, desc: '朝對手連射三根針, 刺到的會生氣' },
  slug:   { name: '薄荷蛞蝓', hp: 8,  effect: 'calm',        interval: 3.0, decay: 2,   gold: 1, repv: 1, kill: 3, desc: '吐出慢慢飄的大泡泡, 碰到的會冷靜' },
  shrimp: { name: '火山蝦',   hp: 12, effect: 'fuse',        interval: 3.0, decay: 2,   gold: 2, repv: 1, kill: 5, desc: '火種黏上誰, 兩秒後誰就爆炸點燃周圍' },
  urchin: { name: '海膽球',   hp: 14, effect: 'slime',       interval: 3.0, decay: 1.5, gold: 2, repv: 1, kill: 5, desc: '朝六個方向射黏刺, 黏到的走不動' },
  eel:    { name: '雷電鰻',   hp: 16, effect: 'chainIgnite', interval: 3.0, decay: 2,   gold: 3, repv: 2, kill: 7, desc: '電弧一路跳四隻, 電到的會生氣' },
  bear:   { name: '冰雹熊',   hp: 20, effect: 'calm',        interval: 3.2, decay: 1.5, gold: 3, repv: 2, kill: 8, desc: '降下一片冰雹, 砸到的會冷靜' }
};
var BONUS = {
  bee: '振翅', slug: '黏手', shrimp: '爆發', urchin: '尖刺', eel: '電網', bear: '毛皮'
};
function bonusText(sp, L) {
  switch (sp) {
    case 'bee': return '移速 +' + (25 * L);
    case 'slug': return '準備捕捉 −' + (0.15 * L).toFixed(2) + ' 秒';
    case 'shrimp': return 'X 冷卻 −' + (15 * L) + '%';
    case 'urchin': return 'Z 範圍 +' + (10 * L) + '%';
    case 'eel': return '套索時限 +' + L + ' 秒';
    case 'bear': return '心 +' + L;
  }
  return '';
}
var UP_COST = [40, 80, 140];

var DUNGEONS = [
  { id: 'candy',   name: '糖果森林', sp: ['bee', 'slug'] },
  { id: 'coast',   name: '熔岩海岸', sp: ['shrimp', 'urchin'] },
  { id: 'plateau', name: '雷雲高原', sp: ['eel', 'bear'] }
];
var NEST_CH = { e: 'bee', s: 'slug', v: 'shrimp', u: 'urchin', j: 'eel', w: 'bear' };

var MAPS = {
  candy: [
    '################################',
    '#..........##......##..........#',
    '#..e....Y..##......##...Y...s..#',
    '#...GG.....GG..GG..GG......GG..#',
    '#...GG.....GG......GG..W...GG..#',
    '#......o...##......##..........#',
    '#####GG#######....#######GG#####',
    '#..............GG..............#',
    '#....W.........S.........W.....#',
    '#####GG#######....#######GG#####',
    '#..........##......##..........#',
    '#..GG...o..GG..GG..GG....o.....#',
    '#..GG......GG......GG......GG..#',
    '#...e...Y..##......##..Y....s..#',
    '#..........##......##..........#',
    '################################'
  ],
  coast: [
    '################################',
    '#..........##......##..........#',
    '#..v..L.Y..##......##...Y.L.u..#',
    '#...GG.....GG......GG......GG..#',
    '#.L.GG.....GG..LL..GG..W...GG..#',
    '#......o...##......##.......L..#',
    '#####GG#######....#######GG#####',
    '#.......L......GG..............#',
    '#....W.........S.........W..L..#',
    '#####GG#######....#######GG#####',
    '#..........##......##..........#',
    '#..GG..L...GG......GG....o.....#',
    '#..GG......GG..LL..GG......GG..#',
    '#...v...Y..##......##..Y.L..u..#',
    '#..........##......##..........#',
    '################################'
  ],
  plateau: [
    '################################',
    '#..........##......##..........#',
    '#..j..L.Y..##......##...Y...w..#',
    '#...GG.....GG..LL..GG..L...GG..#',
    '#...GG..W..GG......GG......GG..#',
    '#.L....o...##......##..o....L..#',
    '#####GG#######....#######GG#####',
    '#......L.......GG.......L......#',
    '#....W.........S.........W.....#',
    '#####GG#######....#######GG#####',
    '#..........##......##..........#',
    '#..GG...o..GG..LL..GG...L......#',
    '#..GG..L...GG......GG......GG..#',
    '#...j...Y..##......##..Y....w..#',
    '#..........##......##..........#',
    '################################'
  ]
};
var CLEARINGS = [
  { x0: 60, x1: 660, y0: 60, y1: 360 }, { x0: 60, x1: 660, y0: 600, y1: 900 },
  { x0: 1260, x1: 1860, y0: 60, y1: 360 }, { x0: 1260, x1: 1860, y0: 600, y1: 900 },
  { x0: 780, x1: 1140, y0: 60, y1: 360 }, { x0: 780, x1: 1140, y0: 600, y1: 900 }
];
function clrOf(x, y) {
  for (var i = 0; i < CLEARINGS.length; i++) {
    var c = CLEARINGS[i];
    if (x >= c.x0 && x <= c.x1 && y >= c.y0 && y <= c.y1) return c;
  }
  return null;
}

var WEAPON_NAME = { club: '棍棒', sword: '劍', spear: '長槍', whip: '長鞭' };
var Z_CD = { club: 0.35, sword: 0.35, spear: 0.45, whip: 0.4 };
var Z_DMG = { club: 2, sword: 2, spear: 2, whip: 1 };
var X_CD = { club: 0, sword: 3, spear: 1.2, whip: 1.2 };

var CARDS = {
  shrink:  { name: '縮場',   point: false, desc: '擂台縮一階' },
  widen:   { name: '放場',   point: false, desc: '擂台放寬一階' },
  provoke: { name: '激將',   point: true,  desc: '點名的那種全部大怒' },
  chill:   { name: '冰鎮',   point: true,  desc: '點名的那種全部冷靜' },
  cage:    { name: '擂台賽', point: false, desc: '擂台瞬間縮到最窄 5 秒' },
  encore:  { name: '安可',   point: true,  desc: '點名的那種全部立刻表演' },
  warmup:  { name: '熱身操', point: true,  desc: '點名的那種跑得更快' }
};
var CARD_ORDER = ['shrink', 'widen', 'provoke', 'chill', 'cage', 'encore', 'warmup'];
var CHANTS = {
  alarm:   { name: '警鈴',   cd: 8,  desc: '當 3 隻帶標記, 擂台就放寬' },
  gong:    { name: '鑼聲',   cd: 8,  desc: '當一半冷掉, 擂台就縮緊' },
  brigade: { name: '滅火隊', cd: 6,  desc: '當有誰標記到 4, 帶標記的全部少一個' },
  salute:  { name: '慶功炮', cd: 8,  desc: '當出現連鎖 4 段, 沒進紅區的全部升溫' },
  clear:   { name: '清場鈴', cd: 10, desc: '當有誰失控, 擂台全開、全場降溫' }
};
var CHANT_ORDER = ['alarm', 'gong', 'brigade', 'salute', 'clear'];

var WALL_L = [60, 260, 440], WALL_R = [1220, 1020, 840];
var SHOW_POS = [[380,260],[900,260],[380,450],[900,450],[640,356],[180,220],[1100,220],[180,490],[1100,490],[640,220],[640,490],[180,356],[1100,356],[510,356],[770,356],[510,220],[770,490],[770,220],[510,490],[300,356]];

var DAYS = 5, DUNGEON_TIME = 75, SHOW_TIME = 45;

// ============================================================ 輸入
var keys = {}, blocked = {}, pressed = [];
var KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyZ: 'z', KeyX: 'x' };
function keyName(e) {
  if (KEYMAP[e.code]) return KEYMAP[e.code];
  var k = (e.key || '').toLowerCase();
  if (k === 'z') return 'z';
  if (k === 'x') return 'x';
  if (k === 'arrowup') return 'up';
  if (k === 'arrowdown') return 'down';
  if (k === 'arrowleft') return 'left';
  if (k === 'arrowright') return 'right';
  return null;
}
window.addEventListener('keydown', function (e) {
  var k = keyName(e);
  if (!k) return;
  e.preventDefault();
  if (e.repeat) return;
  keys[k] = true;
  pressed.push(k);
});
window.addEventListener('keyup', function (e) {
  var k = keyName(e);
  if (!k) return;
  e.preventDefault();
  keys[k] = false; blocked[k] = false;
});
window.addEventListener('blur', function () { keys = {}; blocked = {}; pressed.length = 0; });
function held(k) { return !!keys[k] && !blocked[k]; }

var phase = 'guide';
function setPhase(p) {
  phase = p;
  pressed.length = 0;
  for (var k in keys) if (keys[k]) blocked[k] = true;
}

// ============================================================ 遊戲總狀態
var G;
function newGame() {
  G = {
    day: 1, gold: 30, rep: 0, goldEarned: 0, bestChain: 0,
    weapon: 'club', weapons: { club: true, sword: false, spear: false, whip: false },
    atk: 0, armor: 0, rope: 0,
    price: { attack: 50, armor: 40, ropeBag: 40 },
    bank: { bee: 2, slug: 2, shrimp: 0, urchin: 0, eel: 0, bear: 0 },
    lv: { bee: 0, slug: 0, shrimp: 0, urchin: 0, eel: 0, bear: 0 },
    cap: { bee: 0, slug: 0, shrimp: 0, urchin: 0, eel: 0, bear: 0 },
    stage: { bee: 2, slug: 2, shrimp: 0, urchin: 0, eel: 0, bear: 0 },
    cards: { shrink: true, widen: true, provoke: true, chill: true, cage: false, encore: false, warmup: false },
    chants: { alarm: true, gong: true, brigade: false, salute: false, clear: false },
    sched: [], chantSlots: ['', '', ''],
    unlocked: { candy: true, coast: false, plateau: false },
    selIdx: 0, dungeon: 'candy'
  };
  for (var i = 0; i < 9; i++) G.sched.push({ card: '', target: '' });
}
function stageTotal() { var n = 0; SP.forEach(function (s) { n += G.stage[s]; }); return n; }
function maxHearts() { return 6 + G.armor + G.lv.bear; }
function maxRopes() { return 4 + G.rope; }
function checkUnlock() {
  if (!G.unlocked.coast && G.rep >= 60 && G.cap.slug >= 2) G.unlocked.coast = true;
  if (!G.unlocked.plateau && G.rep >= 200 && G.cap.urchin >= 2) G.unlocked.plateau = true;
}
function condText(id) {
  if (id === 'coast') return '名聲 ' + Math.min(G.rep, 60) + '/60 + 收服薄荷蛞蝓 ' + Math.min(G.cap.slug, 2) + '/2';
  if (id === 'plateau') return '名聲 ' + Math.min(G.rep, 200) + '/200 + 收服海膽球 ' + Math.min(G.cap.urchin, 2) + '/2';
  return '';
}
function upgradeLines(sp) {
  var L = G.lv[sp];
  if (L >= 3) return ['已滿級'];
  var lowNow = 80 - 5 * L, lowNext = 80 - 5 * (L + 1);
  return [
    '升級 Lv' + L + ' → Lv' + (L + 1) + ' 費用 ' + UP_COST[L] + ' 金',
    '紅區 ' + lowNow + '~100 → ' + lowNext + '~100',
    BONUS[sp] + ' ' + bonusText(sp, L) + ' → ' + bonusText(sp, L + 1)
  ];
}
function tryUpgrade(sp) {
  if (G.bank[sp] <= 0 || G.lv[sp] >= 3) return false;
  var c = UP_COST[G.lv[sp]];
  if (G.gold < c) return false;
  G.gold -= c; G.lv[sp]++;
  return true;
}

// ============================================================ 地下城
var D = null;
var dung = { cam: { x: 0, y: 0 } };

function buildDungeon(id) {
  var rows = MAPS[id], tiles = [], trees = [], nests = [], start = { x: 930, y: 510 };
  for (var r = 0; r < 16; r++) {
    var row = [];
    for (var c = 0; c < 32; c++) {
      var ch = rows[r].charAt(c), kind = 'floor', nest = false;
      if (ch === '#') kind = 'wall';
      else if (ch === 'o') kind = 'pillar';
      else if (ch === 'L') kind = 'hurt';
      else if (ch === 'W') kind = 'slow';
      else if (ch === 'G') kind = 'bush';
      else if (ch === 'Y') trees.push({ c: c, r: r, x: c * 60 + 30, y: r * 60 + 30, has: true, regrow: 0 });
      else if (ch === 'S') start = { x: c * 60 + 30, y: r * 60 + 30 };
      else if (NEST_CH[ch]) { nest = true; nests.push({ sp: NEST_CH[ch], x: c * 60 + 30, y: r * 60 + 30, m: null, respawn: 0 }); }
      row.push({ kind: kind, nest: nest, ch: ch });
    }
    tiles.push(row);
  }
  return { id: id, tiles: tiles, trees: trees, nests: nests, start: start };
}

function startDungeon(id) {
  var map = buildDungeon(id);
  G.dungeon = id;
  D = {
    map: map, tiles: map.tiles, trees: map.trees, nests: map.nests,
    mons: [], fruits: [], hazards: [], fx: [], floats: [],
    timeLeft: DUNGEON_TIME,
    T: {
      x: map.start.x, y: map.start.y, facing: 0, invuln: 0, hearts: maxHearts(), ropes: maxRopes(),
      cdZ: 0, cdX: 0, dash: null, slowT: 0, hidden: false
    },
    ring: null, lasso: null, over: false
  };
  D.nests.forEach(function (n) { spawnNest(n); });
  updateCam();
  setPhase('dungeon');
}

function solidTile(c, r) {
  if (c < 0 || r < 0 || c >= 32 || r >= 16) return true;
  var t = D.tiles[r][c];
  return t.kind === 'wall' || t.kind === 'pillar' || t.ch === 'Y';
}
function circleHitsSolid(x, y, rad) {
  var c0 = Math.floor((x - rad) / 60), c1 = Math.floor((x + rad) / 60);
  var r0 = Math.floor((y - rad) / 60), r1 = Math.floor((y + rad) / 60);
  for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
    if (!solidTile(c, r)) continue;
    var nx = clamp(x, c * 60, c * 60 + 60), ny = clamp(y, r * 60, r * 60 + 60);
    if ((x - nx) * (x - nx) + (y - ny) * (y - ny) < rad * rad) return true;
  }
  return false;
}
function circleTouchesKind(x, y, rad, kind) {
  var c0 = Math.floor((x - rad) / 60), c1 = Math.floor((x + rad) / 60);
  var r0 = Math.floor((y - rad) / 60), r1 = Math.floor((y + rad) / 60);
  for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
    if (c < 0 || r < 0 || c >= 32 || r >= 16) continue;
    if (D.tiles[r][c].kind !== kind) continue;
    var nx = clamp(x, c * 60, c * 60 + 60), ny = clamp(y, r * 60, r * 60 + 60);
    if ((x - nx) * (x - nx) + (y - ny) * (y - ny) < rad * rad) return true;
  }
  return false;
}
function tileAt(x, y) {
  var c = Math.floor(x / 60), r = Math.floor(y / 60);
  if (c < 0 || r < 0 || c >= 32 || r >= 16) return null;
  return D.tiles[r][c];
}
function faceAng(f) { return (f - 2) * Math.PI / 4; }
function facingOf(dx, dy) {
  var sx = dx > 0 ? 1 : (dx < 0 ? -1 : 0), sy = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
  var tbl = { '0,-1': 0, '1,-1': 1, '1,0': 2, '1,1': 3, '0,1': 4, '-1,1': 5, '-1,0': 6, '-1,-1': 7 };
  var v = tbl[sx + ',' + sy];
  return v === undefined ? null : v;
}
function monR(m) { return m.sp === 'bear' ? 32 : 24; }
function updateCam() {
  dung.cam.x = clamp(D.T.x - 640, 0, 640);
  dung.cam.y = clamp(D.T.y - 310, 0, 340);
}
function toScr(x, y) { return { x: x - dung.cam.x, y: y - dung.cam.y + 100 }; }

// ---- 魔物移動共用 ----
function newMv() {
  return { h: rndAng(), tm: rnd(0, 0.4), t2: rnd(0, 1), turn: Math.random() < 0.5 ? -1 : 1, hop: -1, dash: -1, dh: 0, ph: rnd(0, 1.6), face: 1, move: 'walk', moveT: 0, moveDur: 0 };
}
// desire: 回傳方向弧度或 null(null = 隨機)
function stepMove(m, dt, sm, tm, desire, b) {
  var mv = m.mv, dtT = dt * tm, vx = 0, vy = 0, d, spd;
  mv.move = 'walk'; mv.moveT = 0; mv.moveDur = 0;
  switch (m.sp) {
    case 'bee':
      mv.tm += dtT;
      if (mv.tm >= 0.5) {
        mv.tm -= 0.5;
        d = desire ? desire() : null;
        mv.h = (d !== null && d !== undefined) ? d : mv.h + rnd(-Math.PI / 2, Math.PI / 2);
      }
      vx = Math.cos(mv.h) * 90 * sm; vy = Math.sin(mv.h) * 90 * sm;
      break;
    case 'slug': {
      mv.tm += dtT;
      if (mv.tm >= 2) { mv.tm -= 2; mv.turn = Math.random() < 0.5 ? -1 : 1; }
      var rate = (30 * Math.PI / 180) * tm;
      d = desire ? desire() : null;
      if (d !== null && d !== undefined) {
        var diff = normAng(d - mv.h), step = Math.min(Math.abs(diff), rate * dt);
        mv.h += diff >= 0 ? step : -step;
      } else mv.h += mv.turn * rate * dt;
      vx = Math.cos(mv.h) * 30 * sm; vy = Math.sin(mv.h) * 30 * sm;
      break;
    }
    case 'shrimp':
      if (mv.hop >= 0) {
        mv.hop += dt * sm;
        var hv = 110 / 0.35 * sm;
        vx = Math.cos(mv.h) * hv; vy = Math.sin(mv.h) * hv;
        mv.move = 'hop'; mv.moveT = Math.min(mv.hop, 0.35); mv.moveDur = 0.35;
        if (mv.hop >= 0.35) mv.hop = -1;
      } else {
        mv.tm += dtT;
        if (mv.tm >= 1.5) {
          mv.tm -= 1.5;
          d = desire ? desire() : null;
          mv.h = (d !== null && d !== undefined) ? d : rndAng();
          mv.hop = 0;
        }
      }
      break;
    case 'urchin':
      mv.tm += dtT;
      if (mv.tm >= 5) {
        mv.tm -= 5;
        d = desire ? desire() : null;
        mv.h = (d !== null && d !== undefined) ? d : rndAng();
      }
      vx = Math.cos(mv.h) * 100 * sm; vy = Math.sin(mv.h) * 100 * sm;
      break;
    case 'eel': {
      mv.tm += dtT;
      if (mv.tm >= 3) {
        mv.tm -= 3;
        d = desire ? desire() : null;
        mv.h = (d !== null && d !== undefined) ? d : rndAng();
      }
      mv.ph += dtT;
      var lat = 50 * (2 * Math.PI / 1.6) * Math.cos(2 * Math.PI * mv.ph / 1.6);
      vx = (Math.cos(mv.h) * 100 - Math.sin(mv.h) * lat) * sm;
      vy = (Math.sin(mv.h) * 100 + Math.cos(mv.h) * lat) * sm;
      break;
    }
    case 'bear':
      if (mv.dash >= 0) {
        mv.dash += dtT;
        vx = Math.cos(mv.dh) * 200 * sm; vy = Math.sin(mv.dh) * 200 * sm;
        mv.move = 'dash'; mv.moveT = Math.min(mv.dash, 0.6); mv.moveDur = 0.6;
        if (mv.dash >= 0.6) mv.dash = -1;
      } else {
        mv.tm += dtT; mv.t2 += dtT;
        if (mv.tm >= 4) {
          mv.tm -= 4;
          d = desire ? desire() : null;
          mv.h = (d !== null && d !== undefined) ? d : rndAng();
        }
        if (mv.t2 >= 4) {
          mv.t2 -= 4;
          d = desire ? desire() : null;
          mv.dh = (d !== null && d !== undefined) ? d : rndAng();
          mv.dash = 0;
        }
        vx = Math.cos(mv.h) * 40 * sm; vy = Math.sin(mv.h) * 40 * sm;
      }
      break;
  }
  m.x += vx * dt; m.y += vy * dt;
  if (Math.abs(vx) > 0.5) mv.face = vx > 0 ? 1 : -1;
  // 邊界: 直線類反彈, 其餘夾住
  var key = (m.sp === 'bear' && mv.dash >= 0) ? 'dh' : 'h';
  if (m.x < b.x0) { m.x = b.x0; if (Math.cos(mv[key]) < 0) mv[key] = Math.PI - mv[key]; }
  if (m.x > b.x1) { m.x = b.x1; if (Math.cos(mv[key]) > 0) mv[key] = Math.PI - mv[key]; }
  if (m.y < b.y0) { m.y = b.y0; if (Math.sin(mv[key]) < 0) mv[key] = -mv[key]; }
  if (m.y > b.y1) { m.y = b.y1; if (Math.sin(mv[key]) > 0) mv[key] = -mv[key]; }
  m.x = clamp(m.x, b.x0, b.x1); m.y = clamp(m.y, b.y0, b.y1);
}

// ---- 投射物 ----
var PROJ = {
  sting: { speed: 200, r: 8, life: 4 }, bubble: { speed: 100, r: 22, life: 5 },
  ember: { speed: 160, r: 14, life: 4 }, spine: { speed: 150, r: 10, life: 4 }
};
function mkProj(list, kind, x, y, ang, owner, act) {
  var p = PROJ[kind];
  var h = { kind: kind, phase: 'fly', x: x, y: y, angle: ang, speed: p.speed, radius: p.r, t: 0, dur: p.life, owner: owner, act: act || null, reflected: false, tx: 0, ty: 0, points: [] };
  list.push(h);
  return h;
}
function hailPoints(cx, cy) {
  var pts = [], minD = 60;
  for (var i = 0; i < 5; i++) {
    var ok = false, tries = 0, p;
    while (!ok) {
      var a = rndAng(), r = 250 * Math.sqrt(Math.random());
      p = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
      ok = true;
      for (var j = 0; j < pts.length; j++) if (dist(p.x, p.y, pts[j].x, pts[j].y) < minD) { ok = false; break; }
      if (++tries > 30) { minD = Math.max(0, minD - 6); tries = 0; }
    }
    pts.push(p);
  }
  return pts;
}

// ---- 地下城: 魔物 ----
function spawnNest(n) {
  var clr = clrOf(n.x, n.y);
  var m = {
    sp: n.sp, x: n.x, y: n.y, hp: SPD[n.sp].hp, maxHp: SPD[n.sp].hp, hitT: 0, stun: 0, lassoed: false,
    clr: clr, nest: n, mv: newMv(), inRange: false, castCd: 0, burst: null, toFruit: false, eating: false, knock: null
  };
  n.m = m; D.mons.push(m);
}
function monWeak(m) { return m.hp <= m.maxHp * 0.3; }
function cancelCasts(m) {
  D.hazards = D.hazards.filter(function (h) { return !(h.owner === m && h.phase === 'warn'); });
  m.burst = null;
}
function monCasting(m) {
  if (m.burst) return true;
  for (var i = 0; i < D.hazards.length; i++) if (D.hazards[i].owner === m && D.hazards[i].phase === 'warn') return true;
  return false;
}
function removeMon(m) {
  remove(D.mons, m);
  if (m.nest) { m.nest.m = null; m.nest.respawn = 10; }
  if (D.lasso && D.lasso.m === m) D.lasso = null;
  if (D.ring && D.ring.m === m) D.ring = null;
  cancelCasts(m);
}
function addFloat(list, x, y, text, kind) { list.push({ x: x, y: y, text: text, kind: kind, t: 0, dur: 1 }); }
function damageMon(m, dmg) {
  if (m.lassoed) return;
  m.hp -= dmg; m.hitT = 0.1;
  if (D.ring && D.ring.m === m) D.ring = null;
  if (m.hp <= 0) {
    var g = SPD[m.sp].kill;
    G.gold += g; G.goldEarned += g;
    addFloat(D.floats, m.x, m.y - 40, '+' + g, 'gold');
    removeMon(m);
  }
}
function hurtTamer() {
  var T = D.T;
  if (T.invuln > 0 || T.dash) return false;
  T.hearts--; T.invuln = 1.2;
  if (D.lasso) { D.lasso.m.lassoed = false; D.lasso = null; }
  D.ring = null;
  if (T.hearts <= 0) D.over = true;
  return true;
}

function monFruit(m) {
  for (var i = 0; i < D.fruits.length; i++) if (D.fruits[i].clr === m.clr) return D.fruits[i];
  return null;
}

function castDungeon(m) {
  var T = D.T, ang = Math.atan2(T.y - m.y, T.x - m.x);
  switch (m.sp) {
    case 'bee': m.burst = { n: 3, t: 0 }; break;
    case 'slug':
      mkProj(D.hazards, 'bubble', m.x, m.y, ang - 12 * Math.PI / 180, m);
      mkProj(D.hazards, 'bubble', m.x, m.y, ang + 12 * Math.PI / 180, m);
      break;
    case 'shrimp': mkProj(D.hazards, 'ember', m.x, m.y, ang, m); break;
    case 'urchin':
      [30, 90, 150, 210, 270, 330].forEach(function (a) { mkProj(D.hazards, 'spine', m.x, m.y, a * Math.PI / 180, m); });
      break;
    case 'eel':
      D.hazards.push({ kind: 'arc', phase: 'warn', x: m.x, y: m.y, tx: T.x, ty: T.y, radius: 0, angle: 0, points: [], t: 0, dur: 0.5, owner: m, reflected: false });
      break;
    case 'bear':
      hailPoints(T.x, T.y).forEach(function (p) {
        D.hazards.push({ kind: 'hail', phase: 'warn', x: p.x, y: p.y, tx: 0, ty: 0, radius: 55, angle: 0, points: [], t: 0, dur: 1.0, owner: m, reflected: false });
      });
      break;
  }
}

function updMon(m, dt) {
  var T = D.T;
  if (m.hitT > 0) m.hitT -= dt;
  var b = { x0: m.clr.x0 + 30, x1: m.clr.x1 - 30, y0: m.clr.y0 + 30, y1: m.clr.y1 - 30 };
  m.eating = false;
  // 擊飛
  if (m.knock) {
    var k = m.knock, st = Math.min(dt, k.left);
    m.x = clamp(m.x + k.vx * st, b.x0, b.x1); m.y = clamp(m.y + k.vy * st, b.y0, b.y1);
    k.left -= dt; if (k.left <= 0) m.knock = null;
    m.inRange = false;
    return;
  }
  if (m.lassoed) { m.inRange = false; return; }
  if (m.stun > 0) { m.stun -= dt; m.inRange = false; return; }
  // 魔物連射中
  if (m.burst) {
    m.burst.t -= dt;
    while (m.burst && m.burst.t <= 0) {
      var a = Math.atan2(T.y - m.y, T.x - m.x);
      mkProj(D.hazards, 'sting', m.x, m.y, a, m);
      m.burst.n--;
      if (m.burst.n <= 0) m.burst = null; else m.burst.t += 0.15;
    }
  }
  // 果子
  var fr = monFruit(m);
  if (fr) {
    if (!m.toFruit) { m.toFruit = true; cancelCasts(m); }
    m.inRange = false;
    var d = dist(m.x, m.y, fr.x, fr.y);
    if (d > 30) {
      var ang = Math.atan2(fr.y - m.y, fr.x - m.x), s = Math.min(80 * dt, d);
      m.x = clamp(m.x + Math.cos(ang) * s, b.x0, b.x1); m.y = clamp(m.y + Math.sin(ang) * s, b.y0, b.y1);
      if (Math.abs(Math.cos(ang)) > 0.1) m.mv.face = Math.cos(ang) > 0 ? 1 : -1;
    } else if (!fr.eating) { fr.eating = true; fr.eatT = 0; }
    m.eating = true;
    return;
  }
  m.toFruit = false;
  var wk = monWeak(m);
  var dd = dist(m.x, m.y, T.x, T.y);
  var directed = dd < 300 && !T.hidden;
  var desire = null;
  if (directed) {
    desire = function () {
      var a = dd < 1 ? rndAng() : Math.atan2(T.y - m.y, T.x - m.x);
      if (dd > 200) return a;
      if (dd < 120) return a + Math.PI;
      return a + (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2;
    };
  }
  stepMove(m, dt, wk ? 0.5 : 1, 1, desire, b);
  // 施放
  var interval = SPD[m.sp].interval * (wk ? 1.5 : 1);
  if (!directed) m.inRange = false;
  else if (!m.inRange) { m.inRange = true; m.castCd = interval; }
  else {
    m.castCd -= dt;
    if (m.castCd <= 0) { castDungeon(m); m.castCd = interval; }
  }
}

function dropFruit(tree) {
  if (!tree.has) return;
  var fx = tree.x, fy = tree.y + 60, clr = clrOf(fx, fy);
  tree.has = false; tree.regrow = 15;
  if (!clr) return;
  D.fruits.push({ x: fx, y: fy, eating: false, eatT: 0, eatDur: 3, clr: clr });
}

// ---- 武器 ----
function lvl(sp) { return G.lv[sp]; }
function inShape(sh, px, py, pr) {
  var dx = px - sh.x, dy = py - sh.y, d = Math.hypot(dx, dy);
  if (sh.shape === 'circle') return d <= sh.radius + pr;
  if (sh.shape === 'arc') {
    if (d > sh.radius + pr) return false;
    if (d <= pr) return true;
    var diff = Math.abs(normAng(Math.atan2(dy, dx) - sh.angle));
    return diff <= sh.spread / 2 + Math.asin(Math.min(1, pr / d));
  }
  var ca = Math.cos(sh.angle), sa = Math.sin(sh.angle);
  var f = dx * ca + dy * sa, l = -dx * sa + dy * ca;
  return f >= -pr && f <= sh.length + pr && Math.abs(l) <= sh.width / 2 + pr;
}
function pushFx(fx) { fx.t = 0; D.fx.push(fx); }
function attackZ() {
  var T = D.T, w = G.weapon;
  if (T.cdZ > 0 || T.dash) return;
  T.cdZ = Z_CD[w];
  var ang = faceAng(T.facing), rm = 1 + 0.1 * lvl('urchin'), dmg = Z_DMG[w] + G.atk, deg = Math.PI / 180;
  var sh;
  if (w === 'club') sh = { shape: 'arc', spread: 100 * deg, radius: 70 * rm };
  else if (w === 'sword') sh = { shape: 'arc', spread: 120 * deg, radius: 80 * rm };
  else if (w === 'spear') sh = { shape: 'line', length: 170 * rm, width: 40 };
  else sh = { shape: 'circle', radius: 100 * rm };
  sh.x = T.x; sh.y = T.y; sh.angle = ang;
  pushFx({ weapon: w, move: 'normal', shape: sh.shape, follow: true, angle: ang, spread: sh.spread || 0, radius: sh.radius || 0, length: sh.length || 0, width: sh.width || 0, dur: 0.2, x: T.x, y: T.y });
  D.mons.slice().forEach(function (m) { if (inShape(sh, m.x, m.y, monR(m))) damageMon(m, dmg); });
  D.trees.forEach(function (t) { if (t.has && inShape(sh, t.x, t.y, 0)) dropFruit(t); });
  if (w === 'sword') {
    D.hazards.forEach(function (h) {
      if (h.phase !== 'fly' || h.reflected || !PROJ[h.kind]) return;
      if (!inShape(sh, h.x, h.y, h.radius)) return;
      h.reflected = true;
      var o = h.owner;
      if (o && D.mons.indexOf(o) >= 0) h.angle = Math.atan2(o.y - T.y, o.x - T.x);
      else h.angle = h.angle + Math.PI;
      h.speed *= 1.2;
    });
  }
}
function attackX() {
  var T = D.T, w = G.weapon;
  if (w === 'club' || T.cdX > 0 || T.dash) return;
  var ang = faceAng(T.facing), deg = Math.PI / 180, cd = X_CD[w];
  cd = cd * (1 - 0.15 * lvl('shrimp')); // 爆發: X 冷卻 −15%/級
  T.cdX = cd;
  if (w === 'sword') {
    var sh = { shape: 'arc', spread: 120 * deg, radius: 80, x: T.x, y: T.y, angle: ang };
    pushFx({ weapon: w, move: 'skill', shape: 'arc', follow: true, angle: ang, spread: sh.spread, radius: 80, length: 0, width: 0, dur: 0.2, x: T.x, y: T.y });
    D.mons.slice().forEach(function (m) {
      if (inShape(sh, m.x, m.y, monR(m))) { m.stun = 2; cancelCasts(m); }
    });
    D.trees.forEach(function (t) { if (t.has && inShape(sh, t.x, t.y, 0)) dropFruit(t); });
  } else if (w === 'whip') {
    var sh2 = { shape: 'arc', spread: 100 * deg, radius: 170, x: T.x, y: T.y, angle: ang };
    pushFx({ weapon: w, move: 'skill', shape: 'arc', follow: true, angle: ang, spread: sh2.spread, radius: 170, length: 0, width: 0, dur: 0.2, x: T.x, y: T.y });
    D.mons.slice().forEach(function (m) {
      if (!inShape(sh2, m.x, m.y, monR(m))) return;
      var dmg = 2 + G.atk;
      var a = dist(m.x, m.y, T.x, T.y) < 1 ? ang : Math.atan2(m.y - T.y, m.x - T.x);
      damageMon(m, dmg);
      if (D.mons.indexOf(m) >= 0) m.knock = { vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, left: 0.25 };
    });
    D.trees.forEach(function (t) { if (t.has && inShape(sh2, t.x, t.y, 0)) dropFruit(t); });
  } else if (w === 'spear') {
    T.dash = { t: 0, dur: 0.25, ang: ang, hit: [], x0: T.x, y0: T.y, moved: 0 };
    pushFx({ weapon: w, move: 'skill', shape: 'dash', follow: false, angle: ang, spread: 0, radius: 0, length: 220, width: 0, dur: 0.25, x: T.x, y: T.y });
  }
}
function updDash(dt) {
  var T = D.T, ds = T.dash;
  var step = Math.min(dt, ds.dur - ds.t) * (220 / ds.dur), n = Math.max(1, Math.ceil(step / 8)), sx = Math.cos(ds.ang) * step / n, sy = Math.sin(ds.ang) * step / n;
  for (var i = 0; i < n; i++) {
    var nx = T.x + sx, ny = T.y + sy;
    if (circleHitsSolid(nx, ny, 18)) break;
    T.x = nx; T.y = ny;
    D.mons.slice().forEach(function (m) {
      if (ds.hit.indexOf(m) >= 0) return;
      if (dist(m.x, m.y, T.x, T.y) <= 18 + monR(m)) { ds.hit.push(m); damageMon(m, 3 + G.atk); }
    });
  }
  ds.t += dt;
  if (ds.t >= ds.dur) {
    // 突進結束: 沿路徑上的果樹也能打落(中心離軌跡 ≤ 40)
    var ex = T.x, ey = T.y;
    D.trees.forEach(function (tr) {
      if (!tr.has) return;
      var dx = ex - ds.x0, dy = ey - ds.y0, L2 = dx * dx + dy * dy, u = L2 > 0 ? clamp(((tr.x - ds.x0) * dx + (tr.y - ds.y0) * dy) / L2, 0, 1) : 0;
      if (dist(tr.x, tr.y, ds.x0 + dx * u, ds.y0 + dy * u) <= 40) dropFruit(tr);
    });
    T.dash = null;
  }
}

// ---- 捕捉 ----
function capDur() { return Math.max(0.35, 0.8 - 0.15 * lvl('slug')); }
function updCapture(dt) {
  var T = D.T;
  if (D.lasso) { updLasso(dt); return; }
  if (T.ropes <= 0) { D.ring = null; return; }
  var best = null, bd = 1e9;
  D.mons.forEach(function (m) {
    if (!monWeak(m) || m.lassoed) return;
    var d = dist(m.x, m.y, T.x, T.y);
    if (d <= 40 && d < bd) { bd = d; best = m; }
  });
  if (!best) { D.ring = null; return; }
  if (!D.ring || D.ring.m !== best) D.ring = { m: best, t: 0, dur: capDur() };
  D.ring.dur = capDur();
  D.ring.t += dt;
  if (D.ring.t >= D.ring.dur) {
    var m = D.ring.m;
    m.lassoed = true; cancelCasts(m);
    D.lasso = { m: m, t: 0, sum: 0, last: Math.atan2(T.y - m.y, T.x - m.x), limit: 5 + lvl('eel'), len: 0 };
    D.ring = null;
  }
}
function breakLasso() { if (D.lasso) { D.lasso.m.lassoed = false; D.lasso = null; } }
function updLasso(dt) {
  var L = D.lasso, T = D.T, m = L.m;
  L.t += dt;
  var a = Math.atan2(T.y - m.y, T.x - m.x);
  L.sum += normAng(a - L.last); L.last = a;
  L.len = dist(T.x, T.y, m.x, m.y);
  if (L.len > 220 || L.t >= L.limit) { breakLasso(); return; }
  if (Math.abs(L.sum) >= 2 * Math.PI) {
    T.ropes--;
    G.bank[m.sp]++; G.cap[m.sp]++;
    if (stageTotal() < 20) G.stage[m.sp]++;
    addFloat(D.floats, m.x, m.y - 40, '收服!', 'capture');
    D.lasso = null;
    removeMon(m);
    checkUnlock();
  }
}

// ---- 地下城主更新 ----
function updateDungeon(dt) {
  var T = D.T, ev = pressed.splice(0), atkZ = false, atkX = false;
  ev.forEach(function (k) { if (k === 'z') atkZ = true; if (k === 'x') atkX = true; });
  if (held('z')) atkZ = true;
  if (held('x')) atkX = true;
  D.timeLeft -= dt;
  if (T.invuln > 0) T.invuln -= dt;
  if (T.slowT > 0) T.slowT -= dt;
  if (T.cdZ > 0) T.cdZ -= dt;
  if (T.cdX > 0) T.cdX -= dt;

  // 移動
  var tl = tileAt(T.x, T.y);
  T.hidden = !!(tl && tl.kind === 'bush');
  if (T.dash) updDash(dt);
  else {
    var dx = (held('right') ? 1 : 0) - (held('left') ? 1 : 0), dy = (held('down') ? 1 : 0) - (held('up') ? 1 : 0);
    if (dx || dy) {
      var f = facingOf(dx, dy); if (f !== null) T.facing = f;
      var l = Math.hypot(dx, dy), spd = (300 + 25 * lvl('bee')) * (tl && tl.kind === 'slow' ? 0.5 : 1) * (T.slowT > 0 ? 0.5 : 1);
      var nx = T.x + dx / l * spd * dt, ny = T.y + dy / l * spd * dt;
      if (!circleHitsSolid(nx, T.y, 18)) T.x = nx;
      if (!circleHitsSolid(T.x, ny, 18)) T.y = ny;
    }
  }
  tl = tileAt(T.x, T.y);
  T.hidden = !!(tl && tl.kind === 'bush');

  if (atkZ) attackZ();
  if (atkX) attackX();
  if (!T.dash && circleTouchesKind(T.x, T.y, 18, 'hurt')) hurtTamer();

  // 魔物
  D.mons.slice().forEach(function (m) { if (D.mons.indexOf(m) >= 0) updMon(m, dt); });
  // 果子
  D.fruits.slice().forEach(function (f) {
    if (f.eating) { f.eatT += dt; if (f.eatT >= f.eatDur) remove(D.fruits, f); }
  });
  D.trees.forEach(function (t) { if (!t.has) { t.regrow -= dt; if (t.regrow <= 0) t.has = true; } });
  D.nests.forEach(function (n) { if (!n.m) { n.respawn -= dt; if (n.respawn <= 0) spawnNest(n); } });

  updHazardsDungeon(dt);
  updCapture(dt);

  D.fx.forEach(function (f) { f.t += dt; });
  D.fx = D.fx.filter(function (f) { return f.t < f.dur; });
  D.floats.forEach(function (f) { f.t += dt; });
  D.floats = D.floats.filter(function (f) { return f.t < f.dur; });
  updateCam();

  if (D.over || D.timeLeft <= 0) endDungeon();
}

function updHazardsDungeon(dt) {
  var T = D.T, out = [];
  D.hazards.forEach(function (h) {
    var keep = true;
    if (h.phase === 'fly') {
      h.t += dt;
      h.x += Math.cos(h.angle) * h.speed * dt; h.y += Math.sin(h.angle) * h.speed * dt;
      if (h.t >= h.dur) keep = false;
      else {
        var tl = tileAt(h.x, h.y);
        if (!tl || tl.kind === 'wall' || tl.kind === 'pillar' || tl.ch === 'Y') keep = false;
      }
      if (keep && h.reflected) {
        for (var i = 0; i < D.mons.length; i++) {
          var m = D.mons[i];
          if (dist(h.x, h.y, m.x, m.y) <= h.radius + monR(m)) { damageMon(m, 3 + G.atk); keep = false; break; }
        }
      } else if (keep) {
        if (dist(h.x, h.y, T.x, T.y) <= h.radius + 18) {
          if (h.kind === 'spine') T.slowT = 1.5;
          hurtTamer();
          keep = false;
        }
      }
    } else if (h.phase === 'warn') {
      h.t += dt;
      if (h.kind === 'arc') { h.x = h.owner.x; h.y = h.owner.y; }
      if (h.t >= h.dur) {
        h.phase = 'active'; h.t = 0; h.dur = 0.2;
        if (h.kind === 'hail') {
          if (dist(h.x, h.y, T.x, T.y) <= 55 + 18) hurtTamer();
        } else if (h.kind === 'arc') {
          h.points = [{ x: h.x, y: h.y }, { x: h.tx, y: h.ty }];
          if (dist(h.tx, h.ty, T.x, T.y) <= 40) hurtTamer();
        }
      }
    } else {
      h.t += dt;
      if (h.t >= h.dur) keep = false;
    }
    if (keep) out.push(h);
  });
  D.hazards = out;
}

function endDungeon() {
  D = Object.assign(D, { over: true });
  SP.forEach(function (s) { if (G.stage[s] > G.bank[s]) G.stage[s] = G.bank[s]; });
  checkUnlock();
  initSetup1();
  setPhase('setup1');
}

// ============================================================ 布置 第 1 步
var P1 = { zone: 'card', i: 0 };
function bankSpecies() { return SP.filter(function (s) { return G.bank[s] > 0; }); }
function initSetup1() { P1 = { zone: 'card', i: 0 }; }
function keySetup1(k) {
  var list = bankSpecies(), sp = list[Math.min(P1.i, list.length - 1)];
  if (P1.zone === 'card') {
    if (k === 'left') P1.i = Math.max(0, P1.i - 1);
    else if (k === 'right') P1.i = Math.min(list.length - 1, P1.i + 1);
    else if (k === 'z') { if (G.stage[sp] < G.bank[sp] && stageTotal() < 20) G.stage[sp]++; }
    else if (k === 'x') { if (G.stage[sp] > 0) G.stage[sp]--; }
    else if (k === 'down') P1.zone = 'upgrade';
  } else if (P1.zone === 'upgrade') {
    if (k === 'up') P1.zone = 'card';
    else if (k === 'down') P1.zone = 'next';
    else if (k === 'z') tryUpgrade(sp);
  } else {
    if (k === 'up') P1.zone = 'upgrade';
    else if (k === 'z') { if (stageTotal() >= 1) { initSetup2(); setPhase('setup2'); } }
  }
}

// ============================================================ 布置 第 2 步
var P2 = null;
function initSetup2() { P2 = { zone: 'row', i: 0, k: 0, back: 0, panel: null }; }
function isPointCard(c) { return !!(c && CARDS[c].point); }
function slotInvalid(s) { return isPointCard(s.card) && (!s.target || G.stage[s.target] < 1); }
function panelOptions(p) {
  var o = [];
  if (p.layer === 'card') {
    CARD_ORDER.forEach(function (c) { if (G.cards[c]) o.push({ key: c, name: CARDS[c].name, desc: CARDS[c].desc, disabled: false }); });
    o.push({ key: 'clear', name: '清空', desc: '', disabled: false });
  } else if (p.layer === 'target') {
    SP.forEach(function (s) { if (G.stage[s] >= 1) o.push({ key: s, name: SPD[s].name, desc: '', disabled: false }); });
  } else {
    CHANT_ORDER.forEach(function (c) {
      if (!G.chants[c]) return;
      var other = false;
      for (var j = 0; j < 3; j++) if (j !== p.k && G.chantSlots[j] === c) other = true;
      o.push({ key: c, name: CHANTS[c].name, desc: CHANTS[c].desc, disabled: other });
    });
    o.push({ key: 'clear', name: '拿下', desc: '', disabled: false });
  }
  return o;
}
function keySetup2(k) {
  var p = P2.panel;
  if (p) {
    var opts = panelOptions(p);
    if (k === 'up') p.index = Math.max(0, p.index - 1);
    else if (k === 'down') p.index = Math.min(opts.length - 1, p.index + 1);
    else if (k === 'z') {
      var o = opts[p.index];
      if (!o) return;
      if (p.layer === 'card') {
        if (o.key === 'clear') { G.sched[p.slot] = { card: '', target: '' }; P2.panel = null; }
        else if (CARDS[o.key].point) P2.panel = { layer: 'target', index: 0, slot: p.slot, card: o.key, cardIndex: p.index };
        else { G.sched[p.slot] = { card: o.key, target: '' }; P2.panel = null; }
      } else if (p.layer === 'target') {
        G.sched[p.slot] = { card: p.card, target: o.key }; P2.panel = null;
      } else {
        if (o.disabled) return;
        G.chantSlots[p.k] = o.key === 'clear' ? '' : o.key; P2.panel = null;
      }
    } else if (k === 'x') {
      if (p.layer === 'target') P2.panel = { layer: 'card', index: p.cardIndex || 0, slot: p.slot };
      else P2.panel = null;
    }
    return;
  }
  if (P2.zone === 'row') {
    if (k === 'up') P2.i = Math.max(0, P2.i - 1);
    else if (k === 'down') { if (P2.i >= 8) P2.zone = 'start'; else P2.i++; }
    else if (k === 'right') { P2.back = P2.i; P2.k = Math.floor(P2.i / 3); P2.zone = 'chant'; }
    else if (k === 'z') P2.panel = { layer: 'card', index: 0, slot: P2.i };
    else if (k === 'x') G.sched[P2.i] = { card: '', target: '' };
  } else if (P2.zone === 'chant') {
    if (k === 'up') P2.k = Math.max(0, P2.k - 1);
    else if (k === 'down') { if (P2.k >= 2) P2.zone = 'start'; else P2.k++; }
    else if (k === 'left') { P2.zone = 'row'; P2.i = P2.back; }
    else if (k === 'z') P2.panel = { layer: 'chant', index: 0, k: P2.k };
    else if (k === 'x') G.chantSlots[P2.k] = '';
  } else {
    if (k === 'up') { P2.zone = 'row'; P2.i = 8; }
    else if (k === 'z') startShow();
    else if (k === 'x') { initSetup1(); setPhase('setup1'); }
  }
}

// ============================================================ 表演場
var S = null;
function arenaMul() {
  if (S.wl >= 440 - 0.01 && S.wr <= 840 + 0.01) return 1.5;
  if (S.wl >= 260 - 0.01 && S.wr <= 1020 + 0.01) return 1.25;
  return 1;
}
function showInterval(r) { return r < 50 ? 6 : 4 - (r - 50) / 50 * 2.5; }

function startShow() {
  S = {
    t: 0, mons: [], hazards: [], sched: [], floats: [], banners: [], cardfx: [],
    wl: 60, wr: 1220, tw: 0, reverts: [],
    chants: G.chantSlots.map(function (id) { return { id: id, cd: 0, cdDur: id ? CHANTS[id].cd : 0, flashT: 0.3 }; }),
    fenceBroken: { top: [], bottom: [] }, visitors: { top: [], bottom: [] },
    fired: [], chain4: false, looseEv: false, over: false
  };
  for (var i = 0; i < 8; i++) {
    S.fenceBroken.top.push(false); S.fenceBroken.bottom.push(false);
    S.visitors.top.push({ mode: 'watch', t: 0 }); S.visitors.bottom.push({ mode: 'watch', t: 0 });
  }
  for (i = 0; i < 9; i++) S.fired.push(false);
  var idx = 0;
  SP.forEach(function (sp) {
    for (var n = 0; n < G.stage[sp]; n++) {
      var pos = SHOW_POS[idx++];
      S.mons.push({
        sp: sp, lv: G.lv[sp], x: pos[0], y: pos[1], rage: 60, redLow: 80 - 5 * G.lv[sp],
        marks: 0, markT: 0, lastMark: -9, slow: false, mode: 'roam', fuse: 0, fuseChain: 1, slime: 0, warm: 0,
        performing: false, perfT: 0, perfTimer: rnd(0.5, 2), fx: 'none', fxT: 0, lastRelay: -99,
        chargeT: 0, looseT: 0, charge: null, loose: null, mv: newMv()
      });
    }
  });
  setPhase('show');
}

function roamers() { return S.mons.filter(function (m) { return m.mode === 'roam'; }); }
function nearestOther(m) {
  var best = null, bd = 1e9;
  S.mons.forEach(function (o) {
    if (o === m || o.mode !== 'roam') return;
    var d = dist(o.x, o.y, m.x, m.y);
    if (d < bd) { bd = d; best = o; }
  });
  return best;
}
function showPush(list, x, y, kind, ang, owner, act) { return mkProj(list, kind, x, y, ang, owner, act); }

function perform(m, chain) {
  if (m.mode !== 'roam') return;
  m.performing = true; m.perfT = 0; m.perfTimer = showInterval(m.rage);
  var act = { owner: m, chain: chain, hits: [], pending: 0, red: m.rage >= m.redLow, settled: false };
  noteChain(act);
  var tgt = nearestOther(m);
  var tx = tgt ? tgt.x : 640, ty = tgt ? tgt.y : 356;
  var ang = Math.atan2(ty - m.y, tx - m.x);
  switch (m.sp) {
    case 'bee':
      act.pending = 3;
      for (var j = 0; j < 3; j++) {
        (function (j) {
          var fire = function () {
            var t2 = (tgt && tgt.mode === 'roam') ? tgt : nearestOther(m);
            var px = t2 ? t2.x : 640, py = t2 ? t2.y : 356;
            showPush(S.hazards, m.x, m.y, 'sting', Math.atan2(py - m.y, px - m.x), m, act);
          };
          if (j === 0) fire(); else S.sched.push({ at: S.t + 0.15 * j, fn: fire });
        })(j);
      }
      break;
    case 'slug':
      act.pending = 2;
      showPush(S.hazards, m.x, m.y, 'bubble', ang - 12 * Math.PI / 180, m, act);
      showPush(S.hazards, m.x, m.y, 'bubble', ang + 12 * Math.PI / 180, m, act);
      break;
    case 'shrimp':
      act.pending = 1;
      showPush(S.hazards, m.x, m.y, 'ember', ang, m, act);
      break;
    case 'urchin':
      act.pending = 6;
      [30, 90, 150, 210, 270, 330].forEach(function (a) { showPush(S.hazards, m.x, m.y, 'spine', a * Math.PI / 180, m, act); });
      break;
    case 'eel':
      act.pending = 1;
      S.hazards.push({ kind: 'arc', phase: 'warn', x: m.x, y: m.y, tx: tx, ty: ty, target: tgt, radius: 0, angle: 0, points: [], t: 0, dur: 0.5, owner: m, act: act, reflected: false });
      break;
    case 'bear':
      act.pending = 5;
      hailPoints(tx, ty).forEach(function (p) {
        S.hazards.push({ kind: 'hail', phase: 'warn', x: p.x, y: p.y, tx: 0, ty: 0, radius: 55, angle: 0, points: [], t: 0, dur: 1.0, owner: m, act: act, reflected: false });
      });
      break;
  }
}
function noteChain(act) { if (act.chain >= 4) S.chain4 = true; }
function actDone(act) {
  if (!act) return;
  act.pending--;
  if (act.pending <= 0) settle(act);
}
function settle(act) {
  if (act.settled) return;
  act.settled = true;
  var o = act.owner, d = SPD[o.sp];
  var gold = Math.max(1, Math.round(d.gold * (1 + 0.5 * act.hits.length) * (act.red ? 2 : 1) * (1 + 0.25 * (act.chain - 1)) * arenaMul() * Math.min(3, 1 + G.rep / 300)));
  G.gold += gold; G.goldEarned += gold; G.rep += d.repv;
  if (act.chain > G.bestChain) G.bestChain = act.chain;
  var text = '+' + gold + (act.red ? ' ×2' : '') + (act.chain >= 2 ? ' 連鎖 ' + act.chain : '');
  addFloat(S.floats, o.x, o.y - 70, text, act.chain >= 2 ? 'chain' : (act.red ? 'redGold' : 'gold'));
  checkUnlock();
}

function addMarks(v, d) {
  var was = v.marks;
  v.marks = Math.max(0, v.marks + d);
  v.markT = v.marks > 0 ? 4 : 0;
  if (d > 0) {
    v.lastMark = S.t;
    if (v.marks >= 5) goLoose(v);
  } else if (was > 0 && v.marks === 0) v.slow = true;
}
function addRage(v, amt) {
  v.fx = 'ignited'; v.fxT = 0;
  if (v.marks > 0) {
    if (S.t - v.lastMark >= 1) addMarks(v, 1);
  } else {
    v.rage = Math.min(100, v.rage + amt);
    if (v.rage >= 100) { v.rage = 100; v.marks = 1; v.markT = 4; v.lastMark = S.t; v.slow = false; }
  }
}
function douse(v, amt) {
  v.fx = 'doused'; v.fxT = 0;
  if (v.marks > 0) addMarks(v, -1);
  else v.rage = Math.max(0, v.rage - amt);
}
function goLoose(v) {
  if (v.mode !== 'roam') return;
  v.mode = 'charge'; v.marks = 0; v.markT = 0; v.fuse = 0; v.slime = 0; v.slow = false;
  var top = v.y < 356, i = 0, bd = 1e9;
  for (var j = 0; j < 8; j++) { var d = Math.abs(v.x - (165 + 136 * j)); if (d < bd) { bd = d; i = j; } }
  v.charge = { side: top ? 'top' : 'bottom', i: i, arrived: false };
  v.chargeT = 0; v.looseT = 0;
  S.looseEv = true;
}
function relay(m, act) {
  if (m.mode !== 'roam' || m.rage < m.redLow || S.t - m.lastRelay < 1.5) return;
  m.lastRelay = S.t;
  S.sched.push({ at: S.t + 0.3, fn: function () { perform(m, act.chain + 1); } });
}
// type: ignite / calm / fuse / slime
function applyEffect(act, v, type, amt) {
  if (v.mode !== 'roam' || v === act.owner || act.hits.indexOf(v) >= 0) return false;
  act.hits.push(v);
  if (type === 'ignite') { addRage(v, amt); relay(v, act); }
  else if (type === 'calm') douse(v, amt);
  else if (type === 'fuse') { v.fuse = 2; v.fuseChain = act.chain; v.fx = 'special'; v.fxT = 0; }
  else if (type === 'slime') { v.slime = 3; v.fx = 'special'; v.fxT = 0; }
  return true;
}
function boom(v) {
  var act = { owner: v, chain: v.fuseChain + 1, hits: [], pending: 0, red: v.rage >= v.redLow, settled: false };
  noteChain(act);
  S.hazards.push({ kind: 'boom', phase: 'active', x: v.x, y: v.y, tx: 0, ty: 0, radius: 110, angle: 0, points: [], t: 0, dur: 0.3, owner: v, act: null, reflected: false });
  S.mons.slice().forEach(function (o) {
    if (o !== v && o.mode === 'roam' && dist(o.x, o.y, v.x, v.y) <= 110) applyEffect(act, o, 'ignite', 12);
  });
  settle(act);
}

function effectOf(sp) {
  switch (sp) { case 'bee': return ['ignite', 8]; case 'slug': return ['calm', 10]; case 'shrimp': return ['fuse', 0];
    case 'urchin': return ['slime', 0]; case 'eel': return ['ignite', 6]; default: return ['calm', 10]; }
}

function updHazardsShow(dt) {
  var out = [];
  S.hazards.forEach(function (h) {
    var keep = true;
    if (h.phase === 'fly') {
      h.t += dt;
      h.x += Math.cos(h.angle) * h.speed * dt; h.y += Math.sin(h.angle) * h.speed * dt;
      var dead = false;
      if (h.t >= h.dur || h.x < S.wl + 12 || h.x > S.wr - 12 || h.y < 146 || h.y > 566) dead = true;
      else {
        for (var i = 0; i < S.mons.length; i++) {
          var v = S.mons[i];
          if (v === h.owner || v.mode !== 'roam') continue;
          if (dist(h.x, h.y, v.x, v.y) <= h.radius + 24) {
            var e = effectOf(h.owner.sp);
            applyEffect(h.act, v, e[0], e[1]);
            dead = true; break;
          }
        }
      }
      if (dead) { keep = false; actDone(h.act); }
    } else if (h.phase === 'warn') {
      h.t += dt;
      if (h.kind === 'arc') {
        h.x = h.owner.x; h.y = h.owner.y;
        if (h.target && h.target.mode === 'roam') { h.tx = h.target.x; h.ty = h.target.y; }
      }
      if (h.t >= h.dur) {
        h.phase = 'active'; h.t = 0; h.dur = 0.2;
        if (h.kind === 'hail') {
          S.mons.slice().forEach(function (v) {
            if (v !== h.owner && v.mode === 'roam' && dist(v.x, v.y, h.x, h.y) <= 55) applyEffect(h.act, v, 'calm', 10);
          });
          actDone(h.act);
        } else if (h.kind === 'arc') {
          var pts = [{ x: h.x, y: h.y }], t = h.target;
          if (t && t.mode === 'roam') {
            var cur = t;
            applyEffect(h.act, t, 'ignite', 6); pts.push({ x: t.x, y: t.y });
            for (var n = 0; n < 3; n++) {
              var best = null, bd = 1e9;
              S.mons.forEach(function (o) {
                if (o === h.owner || o.mode !== 'roam' || h.act.hits.indexOf(o) >= 0) return;
                var d = dist(o.x, o.y, cur.x, cur.y);
                if (d <= 200 && d < bd) { bd = d; best = o; }
              });
              if (!best) break;
              applyEffect(h.act, best, 'ignite', 6); pts.push({ x: best.x, y: best.y }); cur = best;
            }
          } else pts.push({ x: h.tx, y: h.ty });
          h.points = pts;
          actDone(h.act);
        }
      }
    } else {
      h.t += dt;
      if (h.t >= h.dur) keep = false;
    }
    if (keep) out.push(h);
  });
  S.hazards = out;
}

function widenOne() { S.tw = Math.max(0, S.tw - 1); }
function shrinkOne() { S.tw = Math.min(2, S.tw + 1); }

function fireCard(i) {
  var s = G.sched[i];
  S.fired[i] = true;
  if (!s.card || slotInvalid(s)) return;
  var c = s.card;
  if (!CARDS[c].point) {
    S.banners.push({ kind: 'card', key: c, t: 0 });
    if (c === 'shrink') shrinkOne();
    else if (c === 'widen') widenOne();
    else if (c === 'cage') { S.reverts.push({ at: S.t + 5, to: S.tw }); S.tw = 2; }
    return;
  }
  S.mons.slice().forEach(function (m) {
    if (m.sp !== s.target || m.mode !== 'roam') return;
    S.cardfx.push({ m: m, card: c, t: 0 });
    if (c === 'provoke') addRage(m, 25);
    else if (c === 'chill') {
      m.fx = 'doused'; m.fxT = 0;
      if (m.marks > 0) { m.marks = 0; m.markT = 0; m.rage = 70; m.slow = true; }
      else m.rage = Math.max(0, m.rage - 30);
    }
    else if (c === 'encore') perform(m, 1);
    else if (c === 'warmup') m.warm = 4;
  });
}

function fireChant(k) {
  var c = S.chants[k];
  c.cd = c.cdDur; c.flashT = 0;
  S.banners.push({ kind: 'chant', key: c.id, t: 0 });
}
function checkChants() {
  for (var k = 0; k < 3; k++) {
    var c = S.chants[k];
    if (!c.id || c.cd > 0) continue;
    var ro = roamers(), ok = false;
    switch (c.id) {
      case 'alarm': ok = ro.filter(function (m) { return m.marks > 0; }).length >= 3;
        if (ok) { widenOne(); } break;
      case 'gong': ok = ro.length > 0 && ro.filter(function (m) { return m.rage < 50; }).length * 2 >= ro.length;
        if (ok) { shrinkOne(); } break;
      case 'brigade': ok = ro.some(function (m) { return m.marks >= 4; });
        if (ok) ro.forEach(function (m) { if (m.marks > 0) addMarks(m, -1); }); break;
      case 'salute': ok = S.chain4;
        if (ok) ro.forEach(function (m) { if (m.rage < m.redLow) addRage(m, 10); }); break;
      case 'clear': ok = S.looseEv;
        if (ok) { S.tw = 0; ro.forEach(function (m) { douse(m, 10); }); } break;
    }
    if (ok) fireChant(k);
  }
}

function updShowMon(m, dt) {
  if (m.fxT !== undefined && m.fx !== 'none') { m.fxT += dt; if (m.fxT >= 0.5) { m.fx = 'none'; m.fxT = 0; } }
  if (m.performing) { m.perfT += dt; if (m.perfT >= 0.5) { m.performing = false; m.perfT = 0; } }
  if (m.mode === 'charge') {
    var ch = m.charge, fy = ch.side === 'top' ? 140 : 572, fx = 165 + 136 * ch.i;
    if (!ch.arrived) {
      var dy = fy - m.y, st = 160 * dt;
      m.x += (fx - m.x) * Math.min(1, st / Math.max(1, Math.abs(fx - m.x) + Math.abs(dy)));
      if (Math.abs(dy) <= st) { m.y = fy; ch.arrived = true; m.chargeT = 0; }
      else m.y += Math.sign(dy) * st;
    } else {
      m.chargeT += dt;
      if (m.chargeT >= 1.5) {
        S.fenceBroken[ch.side][ch.i] = true;
        m.mode = 'loose'; m.looseT = 0;
        m.x = fx; m.y = ch.side === 'top' ? 95 : 622;
        m.loose = { side: ch.side, dir: Math.random() < 0.5 ? -1 : 1, atk: 0 };
      }
    }
    return;
  }
  if (m.mode === 'loose') {
    var L = m.loose;
    m.looseT += dt;
    m.x += L.dir * 140 * dt;
    if (m.x < 165) { m.x = 165; L.dir = 1; }
    if (m.x > 165 + 136 * 7) { m.x = 165 + 136 * 7; L.dir = -1; }
    m.mv.face = L.dir;
    L.atk += dt;
    if (L.atk >= 1.5) {
      L.atk -= 1.5;
      var vs = S.visitors[L.side], bi = -1, bd = 1e9;
      vs.forEach(function (v, i) { if (v.mode === 'watch' && Math.abs(165 + 136 * i - m.x) < bd) { bd = Math.abs(165 + 136 * i - m.x); bi = i; } });
      if (bi >= 0) {
        vs[bi].mode = 'scared'; vs[bi].t = 0;
        G.rep = Math.max(0, G.rep - 3);
        addFloat(S.floats, 165 + 136 * bi, L.side === 'top' ? 95 : 622, '名聲 −3', 'repDown');
      }
    }
    if (m.looseT >= 6) {
      m.mode = 'roam'; m.x = 640; m.y = 356; m.rage = 30; m.marks = 0; m.markT = 0; m.slow = false;
      m.perfTimer = showInterval(m.rage); m.mv = newMv(); m.loose = null; m.charge = null; m.looseT = 0; m.chargeT = 0;
    }
    return;
  }
  // roam
  if (m.warm > 0) m.warm -= dt;
  if (m.slime > 0) m.slime -= dt;
  if (m.fuse > 0) { m.fuse -= dt; if (m.fuse <= 0) { m.fuse = 0; boom(m); } }
  // 標記
  if (m.marks > 0) {
    m.markT -= dt;
    if (m.markT <= 0) addMarks(m, -1);
  } else {
    var rate = m.slow ? 2 : SPD[m.sp].decay;
    m.rage = Math.max(0, m.rage - rate * dt);
    if (m.slow && m.rage < m.redLow) m.slow = false;
  }
  // 定時表演
  m.perfTimer -= dt;
  if (m.perfTimer <= 0) perform(m, 1);
  // 移動
  var sm = (m.warm > 0 ? 2 : 1) * (m.slime > 0 ? 0.3 : 1), tmx = m.warm > 0 ? 2 : 1;
  stepMove(m, dt, sm, tmx, null, { x0: S.wl + 40, x1: S.wr - 40, y0: 186, y1: 526 });
}

function updateShow(dt) {
  pressed.length = 0; // 表演中 Z、X 都不反應
  S.t += dt;
  // 節目表
  for (var i = 0; i < 9; i++) if (!S.fired[i] && S.t >= 5 * i + 0.5) fireCard(i);
  // 擂台賽改回
  S.reverts = S.reverts.filter(function (r) { if (S.t >= r.at) { S.tw = r.to; return false; } return true; });
  // 柵欄
  var stp = 200 * dt, tl = WALL_L[S.tw], tr = WALL_R[S.tw];
  S.wl += clamp(tl - S.wl, -stp, stp); S.wr += clamp(tr - S.wr, -stp, stp);
  // 排程
  var due = S.sched.filter(function (s) { return s.at <= S.t; });
  S.sched = S.sched.filter(function (s) { return s.at > S.t; });
  due.forEach(function (s) { s.fn(); });
  // 魔物
  S.mons.forEach(function (m) { updShowMon(m, dt); });
  // 活動範圍夾住(被推進)
  S.mons.forEach(function (m) {
    if (m.mode !== 'roam') return;
    m.x = clamp(m.x, S.wl + 40, S.wr - 40); m.y = clamp(m.y, 186, 526);
  });
  updHazardsShow(dt);
  checkChants();
  S.chain4 = false; S.looseEv = false;
  S.chants.forEach(function (c) { if (c.cd > 0) c.cd = Math.max(0, c.cd - dt); if (c.flashT < 0.3) c.flashT = Math.min(0.3, c.flashT + dt); });
  // 觀眾
  ['top', 'bottom'].forEach(function (side) {
    S.visitors[side].forEach(function (v) {
      if (v.mode === 'watch') return;
      v.t += dt;
      if (v.t >= 4) { v.mode = 'watch'; v.t = 0; }
      else if (v.t >= 0.6) v.mode = 'empty';
    });
  });
  S.banners.forEach(function (b) { b.t += dt; });
  S.banners = S.banners.filter(function (b) { return b.t < 0.8; });
  S.cardfx.forEach(function (b) { b.t += dt; });
  S.cardfx = S.cardfx.filter(function (b) { return b.t < 0.8; });
  S.floats.forEach(function (f) { f.t += dt; });
  S.floats = S.floats.filter(function (f) { return f.t < f.dur; });

  if (S.t >= SHOW_TIME) endShow();
}
function endShow() {
  S.mons.forEach(function (m) { if (m.mode !== 'roam') G.rep = Math.max(0, G.rep - 5); });
  checkUnlock();
  if (G.day >= DAYS) { setPhase('result'); }
  else { initShop(); setPhase('shop'); }
}

// ============================================================ 商店
var SHOP = null;
var SHOP_TABS = ['char', 'show', 'monster'];
var SHOP_ITEMS = {
  char: ['club', 'sword', 'spear', 'whip', 'attack', 'armor', 'ropeBag'],
  show: ['cage', 'encore', 'warmup', 'brigade', 'salute', 'clear'],
  monster: SP.slice()
};
var SHOP_DESC = {
  club: 'Z 敲擊 X 無', sword: 'Z 斬擊可打回飛彈 X 擊暈', spear: 'Z 長刺 X 突進', whip: 'Z 整圈抽打 X 擊飛',
  attack: '每次攻擊傷害 +1', armor: '心上限 +1', ropeBag: '每天捕獸繩 +1'
};
var SHOP_NAMES = { attack: '攻擊力 +1', armor: '護甲 心 +1', ropeBag: '繩袋 捕獸繩 +1' };
var PRICE = { sword: 60, spear: 60, whip: 60, cage: 40, encore: 40, warmup: 30, brigade: 40, salute: 40, clear: 30 };
function initShop() { SHOP = { tab: 0, zone: 'tab', idx: 0 }; }
function shopList() { return SHOP_ITEMS[SHOP_TABS[SHOP.tab]]; }
function shopState(id) {
  var o = { item: id, cost: 0, level: 0, owned: false, equipped: false, affordable: false, effect: '', maxed: false, locked: false };
  if (WEAPON_NAME[id]) {
    o.owned = !!G.weapons[id]; o.equipped = G.weapon === id; o.cost = o.owned ? 0 : PRICE[id];
  } else if (id === 'attack' || id === 'armor' || id === 'ropeBag') {
    o.cost = G.price[id]; o.level = id === 'attack' ? G.atk : (id === 'armor' ? G.armor : G.rope);
  } else if (CARDS[id]) { o.owned = !!G.cards[id]; o.cost = o.owned ? 0 : PRICE[id]; }
  else if (CHANTS[id]) { o.owned = !!G.chants[id]; o.cost = o.owned ? 0 : PRICE[id]; }
  else {
    o.effect = SPD[id].effect; o.level = G.lv[id]; o.locked = G.bank[id] <= 0; o.maxed = G.lv[id] >= 3;
    o.cost = o.maxed ? 0 : UP_COST[G.lv[id]];
  }
  o.affordable = o.cost > 0 ? G.gold >= o.cost : false;
  return o;
}
function shopLines(id) {
  if (SHOP_DESC[id]) return [SHOP_DESC[id]];
  if (CARDS[id]) return [CARDS[id].desc];
  if (CHANTS[id]) return [CHANTS[id].desc];
  if (SPD[id]) return G.bank[id] > 0 ? upgradeLines(id) : ['尚未收服'];
  return [];
}
function shopBuy(id) {
  var s = shopState(id);
  if (WEAPON_NAME[id]) {
    if (G.weapons[id]) G.weapon = id;
    else if (G.gold >= PRICE[id]) { G.gold -= PRICE[id]; G.weapons[id] = true; G.weapon = id; }
  } else if (id === 'attack' || id === 'armor' || id === 'ropeBag') {
    if (G.gold >= G.price[id]) {
      G.gold -= G.price[id];
      G.price[id] = Math.round(G.price[id] * 1.5);
      if (id === 'attack') G.atk++; else if (id === 'armor') G.armor++; else G.rope++;
    }
  } else if (CARDS[id]) {
    if (!G.cards[id] && G.gold >= PRICE[id]) { G.gold -= PRICE[id]; G.cards[id] = true; }
  } else if (CHANTS[id]) {
    if (!G.chants[id] && G.gold >= PRICE[id]) { G.gold -= PRICE[id]; G.chants[id] = true; }
  } else if (SPD[id]) tryUpgrade(id);
  return s;
}
function keyShop(k) {
  var list = shopList(), n = list.length, rows = Math.ceil(n / 3);
  if (SHOP.zone === 'tab') {
    if (k === 'left') SHOP.tab = Math.max(0, SHOP.tab - 1);
    else if (k === 'right') SHOP.tab = Math.min(2, SHOP.tab + 1);
    else if (k === 'down') { SHOP.zone = 'grid'; SHOP.idx = 0; }
  } else if (SHOP.zone === 'grid') {
    var r = Math.floor(SHOP.idx / 3), c = SHOP.idx % 3;
    if (k === 'left') { if (c > 0) SHOP.idx--; }
    else if (k === 'right') { if (c < 2 && SHOP.idx + 1 < n) SHOP.idx++; }
    else if (k === 'up') { if (r === 0) SHOP.zone = 'tab'; else SHOP.idx -= 3; }
    else if (k === 'down') {
      if (r >= rows - 1) SHOP.zone = 'go';
      else { var ni = (r + 1) * 3 + c; SHOP.idx = Math.min(ni, n - 1); }
    }
    else if (k === 'z') shopBuy(list[SHOP.idx]);
  } else {
    if (k === 'up') { SHOP.zone = 'grid'; SHOP.idx = (rows - 1) * 3; }
    else if (k === 'z') { G.day++; setPhase('select'); }
  }
}

// ============================================================ 其他畫面操作
var GUIDE = { page: 0, ret: 'select' };
var GUIDE_PAGES = [
  { title: '地下城', text: '方向鍵走, Z 攻擊, X 武器技' },
  { title: '收服', text: '殘血時站上去, 再繞牠一圈' },
  { title: '伸縮擂台', text: '擂台越窄越賺, 也越容易失控' },
  { title: '節目與口令', text: '節目按時發動, 口令看場面發動' },
  { title: '紅區', text: '紅區最賺, 標記滿 5 個就失控' },
  { title: '目標', text: '5 天內賺到越多名聲越好' }
];
function keyGuide(k) {
  if (k === 'left') GUIDE.page = Math.max(0, GUIDE.page - 1);
  else if (k === 'right') GUIDE.page = Math.min(5, GUIDE.page + 1);
  else if (k === 'z') {
    if (GUIDE.page < 5) GUIDE.page++;
    else { GUIDE.page = 0; setPhase(GUIDE.ret); }
  }
}
function keySelect(k) {
  if (k === 'left') G.selIdx = Math.max(0, G.selIdx - 1);
  else if (k === 'right') G.selIdx = Math.min(2, G.selIdx + 1);
  else if (k === 'up') { GUIDE.page = 0; GUIDE.ret = 'select'; setPhase('guide'); }
  else if (k === 'z') {
    var d = DUNGEONS[G.selIdx];
    if (G.unlocked[d.id]) startDungeon(d.id);
  }
}
function keyResult(k) {
  if (k === 'z') { newGame(); GUIDE.ret = 'select'; setPhase('select'); }
}

function dispatchKeys(fn) {
  var ev = pressed.splice(0);
  for (var i = 0; i < ev.length; i++) {
    var p = phase;
    fn(ev[i]);
    if (phase !== p) break;
  }
}

// ============================================================ 繪製
var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';
function hudBase(ph, msg) {
  return { phase: ph, day: G.day, dayMax: DAYS, gold: G.gold, rep: G.rep, hearts: 0, maxHearts: 0, ropes: 0, ropeMax: 0, weapon: G.weapon, xCdLeft: 0, xCdMax: 0, timeLeft: 0, timeMax: 0, dungeon: '', arenaMul: 0, message: msg };
}
function guideFrame() { return { x: 140, y: 140, w: 1000, h: 380 }; }
function drawGuide() {
  Art.drawBackground(ctx, {});
  var pg = GUIDE_PAGES[GUIDE.page], f = guideFrame();
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(140, 62, 1000, 66);
  ctx.fillRect(140, 532, 1000, 70);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
  ctx.font = 'bold 40px ' + FONT;
  ctx.fillText('第 ' + (GUIDE.page + 1) + ' 頁  ' + pg.title, 160, 96);
  ctx.font = '30px ' + FONT;
  ctx.textAlign = 'center';
  ctx.fillText(pg.text, 640, 567);
  ctx.textAlign = 'center';
  ctx.font = '22px ' + FONT;
  ctx.fillStyle = '#ddd';
  ctx.fillText((GUIDE.page + 1) + ' / 6', 640, 630);
  ctx.fillText(GUIDE.page < 5 ? '← 上一頁    Z 下一頁' : '← 上一頁    Z ' + (GUIDE.ret === 'select' ? '開始遊戲' : '返回'), 640, 665);
  ctx.restore();
  Art.drawGuidePage(ctx, { page: GUIDE.page + 1, x: f.x, y: f.y, w: f.w, h: f.h });
  Art.drawHud(ctx, hudBase('guide', '← 上一頁 Z 下一頁'));
}

function drawSelect() {
  Art.drawBackground(ctx, {});
  DUNGEONS.forEach(function (d, i) {
    Art.drawDungeonCard(ctx, { x: [240, 640, 1040][i], y: 390, dungeon: d.id, open: !!G.unlocked[d.id], condition: G.unlocked[d.id] ? '' : condText(d.id), selected: G.selIdx === i });
  });
  Art.drawHud(ctx, hudBase('select', '←→ 選擇 Z 進入 ↑ 說明'));
}

function drawDungeon() {
  var T = D.T, cam = dung.cam, id = D.map.id;
  Art.drawBackground(ctx, {});
  var c0 = Math.floor(cam.x / 60), c1 = Math.min(31, Math.floor((cam.x + 1280) / 60));
  var r0 = Math.max(0, Math.floor((cam.y - 0) / 60)), r1 = Math.min(15, Math.floor((cam.y + 620) / 60));
  var r, c, p;
  for (r = r0; r <= r1; r++) for (c = c0; c <= c1; c++) {
    var t = D.tiles[r][c]; p = toScr(c * 60 + 30, r * 60 + 30);
    Art.drawTile(ctx, { x: p.x, y: p.y, dungeon: id, kind: t.kind, nest: t.nest });
  }
  function vis(x, y, m) { var q = toScr(x, y); return q.x > -m && q.x < 1280 + m && q.y > 100 - m && q.y < 720 + m; }
  D.trees.forEach(function (tr) {
    if (!vis(tr.x, tr.y, 60)) return; p = toScr(tr.x, tr.y);
    Art.drawFruitTree(ctx, { x: p.x, y: p.y, dungeon: id, hasFruit: tr.has });
  });
  D.fruits.forEach(function (f) {
    if (!vis(f.x, f.y, 40)) return; p = toScr(f.x, f.y);
    Art.drawFruit(ctx, { x: p.x, y: p.y, dungeon: id, eating: f.eating, eatT: f.eating ? f.eatT : 0, eatDur: f.eating ? f.eatDur : 3 });
  });
  function hz(h) {
    var q = toScr(h.x, h.y), pts = (h.points || []).map(function (pt) { var w = toScr(pt.x, pt.y); return { x: w.x, y: w.y }; });
    var tq = toScr(h.tx || 0, h.ty || 0);
    return { x: q.x, y: q.y, kind: h.kind, phase: h.phase, radius: h.radius || 0, angle: h.angle || 0, tx: h.kind === 'arc' ? tq.x : 0, ty: h.kind === 'arc' ? tq.y : 0, points: pts, t: h.t, dur: h.dur, reflected: !!h.reflected };
  }
  D.hazards.forEach(function (h) { if (h.phase !== 'fly') Art.drawHazard(ctx, hz(h)); });
  if (D.ring) { p = toScr(D.ring.m.x, D.ring.m.y); Art.drawCaptureRing(ctx, { x: p.x, y: p.y, t: D.ring.t, dur: D.ring.dur }); }
  D.mons.forEach(function (m) {
    if (!vis(m.x, m.y, 80)) return; p = toScr(m.x, m.y);
    var mv = m.mv, move = mv.move, mt = mv.moveT, md = mv.moveDur;
    if (m.eating) { move = 'eat'; mt = 0; md = 0; }
    Art.drawWildMonster(ctx, { x: p.x, y: p.y, species: m.sp, hp: m.hp, maxHp: m.maxHp, hit: m.hitT > 0, weak: monWeak(m), stunLeft: Math.max(0, m.stun), stunDur: 2, lassoed: m.lassoed, casting: monCasting(m), move: move, moveT: mt, moveDur: md, dir: mv.face });
  });
  if (D.lasso) {
    var L = D.lasso, a = toScr(T.x, T.y), b = toScr(L.m.x, L.m.y);
    Art.drawLasso(ctx, { x1: a.x, y1: a.y, x2: b.x, y2: b.y, progress: Math.min(1, Math.abs(L.sum) / (2 * Math.PI)), t: L.t, limit: L.limit, len: L.len, maxLen: 220 });
  }
  p = toScr(T.x, T.y);
  Art.drawTamer(ctx, { x: p.x, y: p.y, facing: T.facing, weapon: G.weapon, dashing: !!T.dash, blink: T.invuln > 0 && !T.dash, lassoing: !!D.lasso, hidden: T.hidden, slowed: T.slowT > 0 });
  D.fx.forEach(function (f) {
    var q = f.follow ? toScr(T.x, T.y) : toScr(f.x, f.y);
    Art.drawWeaponFx(ctx, { x: q.x, y: q.y, weapon: f.weapon, move: f.move, shape: f.shape, angle: f.angle, spread: f.spread, radius: f.radius, length: f.length, width: f.width, t: f.t, dur: f.dur });
  });
  D.hazards.forEach(function (h) { if (h.phase === 'fly') Art.drawHazard(ctx, hz(h)); });
  D.floats.forEach(function (f) { var q = toScr(f.x, f.y); Art.drawFloatText(ctx, { x: q.x, y: q.y, text: f.text, kind: f.kind, t: f.t, dur: f.dur }); });
  var msg = 'Z 攻擊 X 武器技';
  if (D.lasso) msg = '繞牠一圈!'; else if (D.ring) msg = '站住別動'; else if (T.hidden) msg = '躲藏中';
  var h = hudBase('dungeon', msg);
  h.hearts = T.hearts; h.maxHearts = maxHearts(); h.ropes = T.ropes; h.ropeMax = maxRopes();
  h.xCdLeft = Math.max(0, T.cdX); h.xCdMax = xCdMax(); h.timeLeft = Math.max(0, D.timeLeft); h.timeMax = DUNGEON_TIME; h.dungeon = id;
  Art.drawHud(ctx, h);
}
function xCdMax() {
  var w = G.weapon;
  if (w === 'club') return 0;
  return X_CD[w] * (1 - 0.15 * lvl('shrimp'));
}

function effectCode(sp) { return SPD[sp].effect; }
function drawSetup1() {
  Art.drawBackground(ctx, {});
  var list = bankSpecies(), cur = list[Math.min(P1.i, list.length - 1)];
  list.forEach(function (s, i) {
    Art.drawSpeciesCard(ctx, { x: 160 + 192 * i, y: 230, species: s, level: G.lv[s], effect: effectCode(s), owned: G.bank[s], onStage: G.stage[s], selected: P1.zone === 'card' && P1.i === i });
  });
  Art.drawSpeciesInfo(ctx, { x: 500, y: 490, species: cur, desc: SPD[cur].desc, total: stageTotal(), totalMax: 20, lines: upgradeLines(cur) });
  Art.drawButton(ctx, { x: 960, y: 410, w: 220, h: 70, label: '升級', selected: P1.zone === 'upgrade' });
  Art.drawButton(ctx, { x: 960, y: 510, w: 220, h: 70, label: '下一步', selected: P1.zone === 'next' });
  var msg = P1.zone === 'card' ? '←→ 選 Z 上場+1 X 上場−1 ↓ 升級/下一步' : 'Z 確定 ↑ 回卡片';
  Art.drawHud(ctx, hudBase('setup1', msg));
}

function drawSetup2() {
  Art.drawBackground(ctx, {});
  for (var i = 0; i < 9; i++) {
    var s = G.sched[i];
    Art.drawTimelineSlot(ctx, { x: 360, y: 84 + 58 * i, style: 'row', slot: i, card: s.card, target: s.target, invalid: slotInvalid(s), selected: P2.zone === 'row' && P2.i === i, active: false, done: false });
  }
  for (var k = 0; k < 3; k++) Art.drawChantSlot(ctx, { x: 1000, y: 150 + 110 * k, index: k, chant: G.chantSlots[k], selected: P2.zone === 'chant' && P2.k === k });
  Art.drawButton(ctx, { x: 260, y: 610, w: 200, h: 70, label: '開演', selected: P2.zone === 'start' });
  var msg;
  if (P2.panel) msg = P2.panel.layer === 'target' ? '↑↓ 選 Z 點名 X 回上一層' : '↑↓ 選 Z 確定 X 取消';
  else if (P2.zone === 'chant') msg = '↑↓ 選牌位 ← 回節目 Z 掛口令 X 拿下';
  else if (P2.zone === 'start') msg = 'Z 開演 X 回上一步';
  else msg = '↑↓ 選時段 → 口令 Z 放卡 X 清空';
  if (P2.panel) Art.drawPickerPanel(ctx, { layer: P2.panel.layer, options: panelOptions(P2.panel), index: P2.panel.index });
  Art.drawHud(ctx, hudBase('setup2', msg));
}

function drawShow() {
  Art.drawShowArena(ctx, {});
  function hz(h) {
    return { x: h.x, y: h.y, kind: h.kind, phase: h.phase, radius: h.radius || 0, angle: h.angle || 0, tx: h.kind === 'arc' ? h.tx : 0, ty: h.kind === 'arc' ? h.ty : 0, points: h.points || [], t: h.t, dur: h.dur, reflected: false };
  }
  function late(h) { return h.phase === 'fly' || h.kind === 'arc' || h.kind === 'boom'; }
  S.hazards.forEach(function (h) { if (!late(h)) Art.drawHazard(ctx, hz(h)); });
  S.mons.forEach(function (m) {
    var mv = m.mv, mode = m.mode;
    Art.drawShowMonster(ctx, {
      x: m.x, y: m.y, species: m.sp, level: m.lv, rage: m.rage, redLow: m.redLow, marks: Math.min(4, m.marks), markLeft: m.marks > 0 ? Math.max(0, m.markT) : 0, markDur: 4,
      mode: mode, fuseLeft: Math.max(0, m.fuse), fuseDur: 2, slimeLeft: Math.max(0, m.slime), slimeDur: 3, warm: m.warm > 0,
      performing: m.performing, performT: m.performing ? m.perfT : 0, performDur: 0.5, fx: m.fx, fxT: m.fx === 'none' ? 0 : m.fxT, fxDur: 0.5,
      chargeT: mode === 'charge' ? m.chargeT : 0, chargeDur: 1.5, looseT: mode === 'loose' ? m.looseT : 0, looseDur: 6,
      move: mode === 'roam' ? mv.move : 'walk', moveT: mode === 'roam' ? mv.moveT : 0, moveDur: mode === 'roam' ? mv.moveDur : 0, dir: mv.face
    });
  });
  S.hazards.forEach(function (h) { if (late(h)) Art.drawHazard(ctx, hz(h)); });
  Art.drawArenaWall(ctx, { x: S.wl, y: 356, side: 'left', moving: Math.abs(S.wl - WALL_L[S.tw]) > 0.01 });
  Art.drawArenaWall(ctx, { x: S.wr, y: 356, side: 'right', moving: Math.abs(S.wr - WALL_R[S.tw]) > 0.01 });
  S.cardfx.forEach(function (c) { Art.drawCardFx(ctx, { x: c.m.x, y: c.m.y, card: c.card, t: c.t, dur: 0.8 }); });
  S.banners.forEach(function (b) { Art.drawBannerFx(ctx, { x: 640, y: 180, kind: b.kind, key: b.key, t: b.t, dur: 0.8 }); });
  var i;
  for (i = 0; i < 8; i++) {
    var fx = 165 + 136 * i;
    Art.drawFence(ctx, { x: fx, y: 140, side: 'top', broken: S.fenceBroken.top[i] });
    Art.drawFence(ctx, { x: fx, y: 572, side: 'bottom', broken: S.fenceBroken.bottom[i] });
    Art.drawVisitor(ctx, { x: fx, y: 95, side: 'top', mode: S.visitors.top[i].mode });
    Art.drawVisitor(ctx, { x: fx, y: 622, side: 'bottom', mode: S.visitors.bottom[i].mode });
  }
  var cur = Math.min(8, Math.floor(S.t / 5));
  for (i = 0; i < 9; i++) {
    var s = G.sched[i];
    Art.drawTimelineSlot(ctx, { x: 75 + 141 * i, y: 691, style: 'mini', slot: i, card: s.card, target: s.target, invalid: slotInvalid(s), selected: false, active: i === cur, done: S.fired[i] || slotInvalid(s) });
  }
  S.floats.forEach(function (f) { Art.drawFloatText(ctx, { x: f.x, y: f.y, text: f.text, kind: f.kind, t: f.t, dur: f.dur }); });
  var h = hudBase('show', '表演中…');
  h.timeLeft = Math.max(0, SHOW_TIME - S.t); h.timeMax = SHOW_TIME; h.arenaMul = arenaMul();
  Art.drawHud(ctx, h);
  S.chants.forEach(function (c, k) {
    if (!c.id) return;
    Art.drawChantBadge(ctx, { x: 1110 + 50 * k, y: 25, chant: c.id, cdLeft: c.cd, cdDur: c.cdDur, flashT: c.flashT, flashDur: 0.3 });
  });
}

function drawShop() {
  Art.drawBackground(ctx, {});
  var names = ['char', 'show', 'monster'];
  for (var i = 0; i < 3; i++) Art.drawShopTab(ctx, { x: [400, 640, 880][i], y: 85, tab: names[i], current: SHOP.tab === i, selected: SHOP.zone === 'tab' && SHOP.tab === i });
  var list = shopList(), lines = [];
  list.forEach(function (id, j) {
    var st = shopState(id), sel = SHOP.zone === 'grid' && SHOP.idx === j;
    st.x = 220 + 420 * (j % 3); st.y = 190 + 115 * Math.floor(j / 3); st.selected = sel;
    Art.drawShopItem(ctx, st);
    if (sel) lines = shopLines(id);
  });
  Art.drawShopDetail(ctx, { x: 640, y: 570, lines: lines });
  Art.drawButton(ctx, { x: 540, y: 625, w: 200, h: 70, label: '出發', selected: SHOP.zone === 'go' });
  Art.drawHud(ctx, hudBase('shop', '←→ 切分頁 方向鍵選擇 Z 購買'));
}

function stars() { return G.rep >= 1000 ? 3 : (G.rep >= 650 ? 2 : (G.rep >= 300 ? 1 : 0)); }
function drawResult() {
  Art.drawBackground(ctx, {});
  var bank = [];
  SP.forEach(function (s) { if (G.bank[s] > 0) bank.push({ species: s, count: G.bank[s], level: G.lv[s] }); });
  Art.drawResultPanel(ctx, { rep: G.rep, goldEarned: G.goldEarned, bestChain: G.bestChain, bank: bank, stars: stars() });
  Art.drawHud(ctx, hudBase('result', 'Z 重來'));
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, CW, CH);
  switch (phase) {
    case 'guide': drawGuide(); break;
    case 'select': drawSelect(); break;
    case 'dungeon': drawDungeon(); break;
    case 'setup1': drawSetup1(); break;
    case 'setup2': drawSetup2(); break;
    case 'show': drawShow(); break;
    case 'shop': drawShop(); break;
    case 'result': drawResult(); break;
  }
}

// ============================================================ 主迴圈
function update(dt) {
  checkUnlock();
  switch (phase) {
    case 'guide': dispatchKeys(keyGuide); break;
    case 'select': dispatchKeys(keySelect); break;
    case 'dungeon': updateDungeon(dt); break;
    case 'setup1': dispatchKeys(keySetup1); break;
    case 'setup2': dispatchKeys(keySetup2); break;
    case 'show': updateShow(dt); break;
    case 'shop': dispatchKeys(keyShop); break;
    case 'result': dispatchKeys(keyResult); break;
  }
}

var last = 0;
function frame(ts) {
  var dt = last ? (ts - last) / 1000 : 0;
  last = ts;
  dt = Math.min(Math.max(dt, 0), 1 / 30);
  update(dt);
  render();
  requestAnimationFrame(frame);
}

newGame();
setPhase('guide');
requestAnimationFrame(frame);
})();
