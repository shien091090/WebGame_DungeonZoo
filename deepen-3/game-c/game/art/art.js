// 玩具球亂鬥秀 — 美術 (Canvas 2D 幾何繪製, 無外部資源)
// 全域物件 window.Art; 每個函式自己 save/restore。
(function () {
  'use strict';
  var TAU = Math.PI * 2;
  var FONT = '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif';

  // ---------- 小工具 ----------
  function now() {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() / 1000 : Date.now() / 1000;
  }
  function num(v, d) { v = +v; return isFinite(v) ? v : (d === undefined ? 0 : d); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function c01(v) { return clamp(num(v, 0), 0, 1); }
  function ratio(t, dur) { dur = num(dur, 0); return dur > 0 ? c01(num(t, 0) / dur) : 0; }
  function oneOf(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function str(v) { return v === undefined || v === null ? '' : String(v); }
  function S(state) { return (state && typeof state === 'object') ? state : {}; }
  function font(px, w) { return (w || 'bold') + ' ' + px + 'px ' + FONT; }

  function rrect(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
  // 文字: 一律帶深色描邊 (P10)
  function txt(ctx, s, x, y, px, color, align, base, outline, weight) {
    ctx.font = font(px, weight);
    ctx.textAlign = align || 'center';
    ctx.textBaseline = base || 'middle';
    if (outline !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(3, px * 0.2);
      ctx.strokeStyle = outline || 'rgba(8,6,12,0.9)';
      ctx.strokeText(s, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
  }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); }
  function star(ctx, x, y, r, inner) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var rr = i % 2 ? r * (inner || 0.45) : r;
      if (i === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  }
  function heart(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.85);
    ctx.bezierCurveTo(x - s * 1.2, y + s * 0.05, x - s * 0.75, y - s * 0.9, x, y - s * 0.3);
    ctx.bezierCurveTo(x + s * 0.75, y - s * 0.9, x + s * 1.2, y + s * 0.05, x, y + s * 0.85);
    ctx.closePath();
  }
  function arrowHead(ctx, x, y, ang, s) {
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(ang) * s, y + Math.sin(ang) * s);
    ctx.lineTo(x + Math.cos(ang + 2.5) * s, y + Math.sin(ang + 2.5) * s);
    ctx.lineTo(x + Math.cos(ang - 2.5) * s, y + Math.sin(ang - 2.5) * s);
    ctx.closePath();
  }

  // ---------- 色票 ----------
  var palette = {
    bg: '#16131d',
    hudBg: '#100d16',
    panel: '#241f30',
    panelHi: '#302a40',
    line: '#4a4260',
    text: '#f4efe6',
    textDim: '#a49cb4',
    cursor: '#fff3b0',     // 選擇框 / 游標, 全遊戲唯一
    player: '#3fe0c8',     // 馴獸師與「玩家造成的」(攻擊特效、打回的投射物、捕捉進度)
    playerBody: '#f2efe6',
    rope: '#d8b07a',
    danger: '#ff3b4a',     // 規則紅: 紅區、失控、危險讀數 (只用在線與記號)
    gold: '#ffd84a',
    rep: '#ffb8f0',
    ignite: '#ff8a1c',     // 升怒: 往上竄的火苗 (火辣球同色)
    douse: '#7fe3ff',      // 降怒: 往下滴的水珠 (冰涼球同色)
    perform: '#ffd23a',    // 表演星芒 (鈴鐺球同色)
    yarn: '#ff7ad0',       // 毛線球與「追毛線球」
    lava: '#ff5a1e',
    water: '#2a6fb8',
    fire: '#ec3b30', waterMon: '#3a86f0', thunder: '#e6dc34', spike: '#4cc04c', stone: '#9c8f84', ghost: '#c08cf0',
    ballHot: '#ff8a1c', ballCold: '#7fe3ff', ballBell: '#ffd23a', ballYarn: '#ff7ad0'
  };

  var SPECIES = {
    fire:    { name: '火蜥蜴', c: '#ec3b30', d: '#7e1a14', l: '#ff8a70' },
    water:   { name: '水母',   c: '#3a86f0', d: '#163e80', l: '#9cc8ff' },
    thunder: { name: '雷鳥',   c: '#e6dc34', d: '#7a7010', l: '#fff6a0' },
    spike:   { name: '刺蝟',   c: '#4cc04c', d: '#1e5e1e', l: '#a8ec98' },
    stone:   { name: '石像鬼', c: '#9c8f84', d: '#4a423c', l: '#d0c6bc' },
    ghost:   { name: '幽靈',   c: '#c08cf0', d: '#5a3a86', l: '#ecdcff' }
  };
  var SP_LIST = ['fire', 'water', 'thunder', 'spike', 'stone', 'ghost'];
  function sp(v) { return oneOf(v, SP_LIST, 'fire'); }

  var DUN = {
    cave:  { name: '濕熱洞窟', species: ['fire', 'water'], floor: '#3b302b', floor2: '#352b27', hall: '#28221f', wall: '#6b4632', wallTop: '#8e5d40', pillar: '#7c5c48' },
    cliff: { name: '雷鳴崖',   species: ['thunder', 'spike'], floor: '#343a45', floor2: '#2f343f', hall: '#24272f', wall: '#55607a', wallTop: '#7884a4', pillar: '#8a94ac' },
    ruins: { name: '古代遺跡', species: ['stone', 'ghost'], floor: '#3d3a2e', floor2: '#37342a', hall: '#29271f', wall: '#6e6448', wallTop: '#938862', pillar: '#a3976c' }
  };
  function dun(v) { return DUN[oneOf(v, ['cave', 'cliff', 'ruins'], 'cave')]; }

  var BALL = {
    hot:  { name: '火辣球', c: '#ff8a1c', d: '#9a3e00', l: '#ffd29a' },
    cold: { name: '冰涼球', c: '#7fe3ff', d: '#1f7894', l: '#e8fbff' },
    bell: { name: '鈴鐺球', c: '#ffd23a', d: '#8a6400', l: '#fff3b8' },
    yarn: { name: '毛線球', c: '#ff7ad0', d: '#962a72', l: '#ffd2ef' }
  };
  function ballKind(v) { return oneOf(v, ['hot', 'cold', 'bell', 'yarn'], 'hot'); }

  var WEAPON = { club: '棍棒', sword: '劍', spear: '長槍', whip: '長鞭' };
  function weap(v) { return oneOf(v, ['club', 'sword', 'spear', 'whip'], 'club'); }

  // ---------- 魔物本體 (共用: 地下城、表演場、卡片、面板、說明頁) ----------
  // 在原點畫, r = 本體半徑; 外延部件(尾、觸手、翅、角)最遠 1.38r 以內
  function eyes(ctx, ex, ey, r, color) {
    ctx.fillStyle = '#fff';
    circle(ctx, ex, ey, r); ctx.fill();
    ctx.fillStyle = color || '#1a1020';
    circle(ctx, ex + r * 0.3, ey, r * 0.55); ctx.fill();
  }
  function monsterBody(ctx, species, r, opt) {
    opt = opt || {};
    var s = SPECIES[sp(species)];
    var c = s.c, d = s.d, l = s.l;
    if (opt.flash) { c = '#ffffff'; d = '#d8d8e0'; l = '#ffffff'; }
    ctx.save();
    ctx.scale((opt.dir === -1 ? -1 : 1) * r, r);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    var ow = 3 / r; // 外描線寬 (換算回 3px)
    var key = sp(species);
    if (key === 'fire') {
      // 尾 + 尾巴火苗
      ctx.strokeStyle = d; ctx.lineWidth = 0.34;
      ctx.beginPath(); ctx.moveTo(-0.6, 0.1); ctx.quadraticCurveTo(-1.15, 0.2, -1.08, -0.3); ctx.stroke();
      ctx.strokeStyle = c; ctx.lineWidth = 0.2;
      ctx.beginPath(); ctx.moveTo(-0.6, 0.1); ctx.quadraticCurveTo(-1.15, 0.2, -1.08, -0.3); ctx.stroke();
      ctx.fillStyle = opt.flash ? '#fff' : '#ffb21c';
      ctx.beginPath(); ctx.moveTo(-1.08, -0.62); ctx.quadraticCurveTo(-0.9, -0.38, -1.02, -0.22); ctx.quadraticCurveTo(-1.26, -0.32, -1.08, -0.62); ctx.fill();
      // 腳
      ctx.fillStyle = d;
      [[-0.4, -0.55], [-0.4, 0.6], [0.3, -0.55], [0.3, 0.6]].forEach(function (p) { circle(ctx, p[0], p[1], 0.16); ctx.fill(); });
      // 身
      ctx.fillStyle = c; ctx.strokeStyle = d; ctx.lineWidth = ow;
      ctx.beginPath(); ctx.ellipse(-0.1, 0.03, 0.78, 0.55, 0, 0, TAU); ctx.fill(); ctx.stroke();
      circle(ctx, 0.62, -0.08, 0.46); ctx.fill(); ctx.stroke();
      ctx.fillStyle = l;
      circle(ctx, -0.3, -0.15, 0.12); ctx.fill(); circle(ctx, 0.05, 0.2, 0.1); ctx.fill(); circle(ctx, -0.5, 0.18, 0.08); ctx.fill();
      eyes(ctx, 0.78, -0.24, 0.15);
    } else if (key === 'water') {
      // 觸手
      ctx.strokeStyle = d; ctx.lineWidth = 0.13;
      for (var i = 0; i < 4; i++) {
        var tx = -0.5 + i * 0.33;
        ctx.beginPath(); ctx.moveTo(tx, -0.05);
        ctx.bezierCurveTo(tx + 0.18, 0.3, tx - 0.18, 0.6, tx + 0.06, 0.95); ctx.stroke();
      }
      ctx.strokeStyle = l; ctx.lineWidth = 0.06;
      for (i = 0; i < 4; i++) {
        tx = -0.5 + i * 0.33;
        ctx.beginPath(); ctx.moveTo(tx, -0.05);
        ctx.bezierCurveTo(tx + 0.18, 0.3, tx - 0.18, 0.6, tx + 0.06, 0.95); ctx.stroke();
      }
      // 傘
      ctx.fillStyle = c; ctx.strokeStyle = d; ctx.lineWidth = ow;
      ctx.beginPath(); ctx.arc(0, -0.1, 0.88, Math.PI, TAU);
      ctx.quadraticCurveTo(0.66, 0.12, 0.44, 0.02); ctx.quadraticCurveTo(0.22, 0.16, 0, 0.02);
      ctx.quadraticCurveTo(-0.22, 0.16, -0.44, 0.02); ctx.quadraticCurveTo(-0.66, 0.12, -0.88, -0.1);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = l; ctx.globalAlpha *= 0.7;
      ctx.beginPath(); ctx.ellipse(-0.35, -0.6, 0.22, 0.12, -0.5, 0, TAU); ctx.fill();
      ctx.globalAlpha /= 0.7;
      eyes(ctx, 0.12, -0.38, 0.14); eyes(ctx, 0.48, -0.38, 0.14);
    } else if (key === 'thunder') {
      // 翅膀 (鋸齒邊)
      ctx.fillStyle = d;
      ctx.beginPath(); ctx.moveTo(-0.2, -0.2); ctx.lineTo(-1.3, -0.55); ctx.lineTo(-1.0, -0.25); ctx.lineTo(-1.32, -0.05); ctx.lineTo(-0.95, 0.08); ctx.lineTo(-1.15, 0.32); ctx.lineTo(-0.3, 0.25); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0.2, -0.2); ctx.lineTo(1.25, -0.6); ctx.lineTo(0.98, -0.3); ctx.lineTo(1.3, -0.12); ctx.lineTo(0.9, 0.02); ctx.lineTo(1.1, 0.26); ctx.lineTo(0.3, 0.22); ctx.closePath(); ctx.fill();
      // 身
      ctx.fillStyle = c; ctx.strokeStyle = d; ctx.lineWidth = ow;
      circle(ctx, 0, 0.05, 0.62); ctx.fill(); ctx.stroke();
      // 冠 (閃電)
      ctx.fillStyle = l; ctx.strokeStyle = d;
      ctx.beginPath(); ctx.moveTo(-0.08, -0.5); ctx.lineTo(0.18, -1.05); ctx.lineTo(0.12, -0.75); ctx.lineTo(0.3, -0.78); ctx.lineTo(0.12, -0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      // 喙
      ctx.fillStyle = '#ff9a2a';
      ctx.beginPath(); ctx.moveTo(0.5, -0.05); ctx.lineTo(0.95, 0.08); ctx.lineTo(0.5, 0.22); ctx.closePath(); ctx.fill();
      eyes(ctx, 0.3, -0.15, 0.15);
    } else if (key === 'spike') {
      // 刺
      ctx.fillStyle = d;
      ctx.beginPath();
      for (var k = 0; k < 14; k++) {
        var a0 = Math.PI * 0.35 + k * (Math.PI * 1.3 / 13);
        var a1 = a0 + 0.12, a2 = a0 + 0.24;
        ctx.moveTo(Math.cos(a0 + Math.PI) * 0.66, Math.sin(a0 + Math.PI) * 0.66);
        ctx.lineTo(Math.cos(a1 + Math.PI) * 1.12, Math.sin(a1 + Math.PI) * 1.12);
        ctx.lineTo(Math.cos(a2 + Math.PI) * 0.66, Math.sin(a2 + Math.PI) * 0.66);
      }
      ctx.fill();
      ctx.fillStyle = c; ctx.strokeStyle = d; ctx.lineWidth = ow;
      circle(ctx, 0, 0, 0.74); ctx.fill(); ctx.stroke();
      // 臉
      ctx.fillStyle = '#e8d2a8';
      ctx.beginPath(); ctx.ellipse(0.48, 0.12, 0.42, 0.34, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2a1a10'; circle(ctx, 0.88, 0.12, 0.09); ctx.fill();
      eyes(ctx, 0.5, -0.05, 0.12);
    } else if (key === 'stone') {
      // 蝙蝠翼
      ctx.fillStyle = d;
      ctx.beginPath(); ctx.moveTo(-0.6, -0.3); ctx.lineTo(-1.3, -0.65); ctx.quadraticCurveTo(-1.1, -0.2, -1.32, 0.15); ctx.quadraticCurveTo(-0.95, 0.0, -0.6, 0.2); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0.6, -0.3); ctx.lineTo(1.3, -0.65); ctx.quadraticCurveTo(1.1, -0.2, 1.32, 0.15); ctx.quadraticCurveTo(0.95, 0.0, 0.6, 0.2); ctx.closePath(); ctx.fill();
      // 角
      ctx.fillStyle = l;
      ctx.beginPath(); ctx.moveTo(-0.5, -0.6); ctx.lineTo(-0.55, -1.08); ctx.lineTo(-0.22, -0.66); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0.5, -0.6); ctx.lineTo(0.55, -1.08); ctx.lineTo(0.22, -0.66); ctx.closePath(); ctx.fill();
      // 方塊身
      ctx.fillStyle = c; ctx.strokeStyle = d; ctx.lineWidth = ow;
      rrect(ctx, -0.7, -0.72, 1.4, 1.5, 0.22); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = d; ctx.lineWidth = 0.06;
      ctx.beginPath(); ctx.moveTo(-0.5, 0.4); ctx.lineTo(-0.25, 0.25); ctx.lineTo(-0.3, 0.6); ctx.moveTo(0.3, -0.5); ctx.lineTo(0.5, -0.3); ctx.stroke();
      // 發光眼 (琥珀, 不用規則紅)
      ctx.fillStyle = opt.flash ? '#fff' : '#ffb43a';
      rrect(ctx, -0.42, -0.3, 0.3, 0.16, 0.05); ctx.fill();
      rrect(ctx, 0.14, -0.3, 0.3, 0.16, 0.05); ctx.fill();
      ctx.fillStyle = d; rrect(ctx, -0.3, 0.1, 0.6, 0.12, 0.05); ctx.fill();
    } else { // ghost
      var ga = ctx.globalAlpha; ctx.globalAlpha = ga * 0.88;
      ctx.fillStyle = c; ctx.strokeStyle = d; ctx.lineWidth = ow;
      ctx.beginPath();
      ctx.arc(0, -0.2, 0.78, Math.PI, TAU);
      ctx.lineTo(0.78, 0.7);
      ctx.quadraticCurveTo(0.6, 1.0, 0.39, 0.72); ctx.quadraticCurveTo(0.2, 1.0, 0, 0.72);
      ctx.quadraticCurveTo(-0.2, 1.0, -0.39, 0.72); ctx.quadraticCurveTo(-0.6, 1.0, -0.78, 0.7);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = ga;
      ctx.fillStyle = l; ctx.globalAlpha = ga * 0.6;
      ctx.beginPath(); ctx.ellipse(-0.3, -0.62, 0.2, 0.1, -0.5, 0, TAU); ctx.fill();
      ctx.globalAlpha = ga;
      ctx.fillStyle = '#2a1a3a';
      ctx.beginPath(); ctx.ellipse(0.0, -0.18, 0.13, 0.2, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0.4, -0.18, 0.13, 0.2, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0.2, 0.25, 0.12, 0.08, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  // ---------- 球本體 (立體、帶落影: 「能被踢動的東西」類別) ----------
  function ballBody(ctx, kind, r, spin) {
    var b = BALL[ballKind(kind)];
    // 落影
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(r * 0.12, r * 0.8, r * 0.85, r * 0.22, 0, 0, TAU); ctx.fill();
    // 深色外描 + 球體漸層
    var g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
    g.addColorStop(0, b.l); g.addColorStop(0.55, b.c); g.addColorStop(1, b.d);
    ctx.fillStyle = g;
    circle(ctx, 0, 0, r - 1.5); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#120c18';
    circle(ctx, 0, 0, r - 1.5); ctx.stroke();
    // 圖案 (會隨滾動轉)
    ctx.save();
    circle(ctx, 0, 0, r - 3); ctx.clip();
    ctx.rotate(spin || 0);
    var k = ballKind(kind);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (k === 'hot') {
      // 白色火焰紋
      ctx.fillStyle = '#fff6e0';
      ctx.beginPath(); ctx.moveTo(0, -r * 0.62);
      ctx.quadraticCurveTo(r * 0.5, -r * 0.1, r * 0.3, r * 0.35);
      ctx.quadraticCurveTo(r * 0.12, r * 0.55, 0, r * 0.5);
      ctx.quadraticCurveTo(-r * 0.45, r * 0.45, -r * 0.3, r * 0.05);
      ctx.quadraticCurveTo(-r * 0.15, -r * 0.05, -r * 0.08, -r * 0.25);
      ctx.quadraticCurveTo(r * 0.1, -r * 0.2, 0, -r * 0.62); ctx.fill();
      ctx.fillStyle = '#ff5a00';
      ctx.beginPath(); ctx.ellipse(0, r * 0.22, r * 0.14, r * 0.2, 0, 0, TAU); ctx.fill();
    } else if (k === 'cold') {
      // 雪花
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
      for (var i = 0; i < 3; i++) {
        var a = i * Math.PI / 3;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6); ctx.lineTo(-Math.cos(a) * r * 0.6, -Math.sin(a) * r * 0.6); ctx.stroke();
      }
      ctx.strokeStyle = b.d; ctx.lineWidth = 2;
      circle(ctx, 0, 0, r * 0.18); ctx.stroke();
    } else if (k === 'bell') {
      // 鈴鐺: 橫帶 + 下方開口
      ctx.fillStyle = b.d;
      ctx.fillRect(-r, -r * 0.12, r * 2, r * 0.16);
      circle(ctx, 0, r * 0.38, r * 0.16); ctx.fill();
      ctx.fillRect(-r * 0.05, r * 0.38, r * 0.1, r * 0.4);
      ctx.fillStyle = '#fff8d8';
      circle(ctx, 0, -r * 0.45, r * 0.1); ctx.fill();
    } else {
      // 毛線纏繞
      ctx.strokeStyle = b.d; ctx.lineWidth = 2.2;
      for (var j = -2; j <= 2; j++) {
        ctx.beginPath(); ctx.ellipse(j * r * 0.22, 0, r * 0.35, r * 1.0, 0.5, 0, TAU); ctx.stroke();
      }
      ctx.strokeStyle = '#fff0fa'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.95, r * 0.3, -0.4, 0, TAU); ctx.stroke();
    }
    ctx.restore();
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.ellipse(-r * 0.38, -r * 0.45, r * 0.22, r * 0.13, -0.6, 0, TAU); ctx.fill();
  }

  // ---------- 鍵帽 (說明頁) ----------
  function keycap(ctx, x, y, label, w) {
    w = w || 44;
    ctx.fillStyle = '#e8e2d6';
    rrect(ctx, x - w / 2, y - 22, w, 44, 8); ctx.fill();
    ctx.fillStyle = '#b8b0a2';
    rrect(ctx, x - w / 2, y + 12, w, 10, 6); ctx.fill();
    ctx.strokeStyle = '#2a2430'; ctx.lineWidth = 2;
    rrect(ctx, x - w / 2, y - 22, w, 44, 8); ctx.stroke();
    txt(ctx, label, x, y - 3, 22, '#1e1828', 'center', 'middle', false);
  }

  // =================================================================
  var Art = {
    canvas: { width: 720, height: 1280 },
    palette: palette,

    drawBackground: function (ctx) {
      ctx.save();
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.restore();
    },

    // ---------- 地下城格 60×60 ----------
    drawTile: function (ctx, state) {
      var s = S(state);
      var x = num(s.x), y = num(s.y);
      var D = dun(s.dungeon);
      var kind = oneOf(s.kind, ['wall', 'pillar', 'floor', 'lava', 'water'], 'floor');
      var room = oneOf(s.room, ['top', 'bottom', 'hall'], 'hall');
      var L = x - 30, T = y - 30;
      var checker = (Math.floor(x / 60) + Math.floor(y / 60)) % 2;
      ctx.save();
      var floorColor = room === 'hall' ? D.hall : (checker ? D.floor : D.floor2);
      if (kind === 'wall') {
        ctx.fillStyle = D.wall; ctx.fillRect(L, T, 60, 60);
        ctx.fillStyle = D.wallTop; ctx.fillRect(L, T, 60, 14);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(L, T + 14); ctx.lineTo(L + 60, T + 14);
        ctx.moveTo(L, T + 37); ctx.lineTo(L + 60, T + 37);
        ctx.moveTo(L + 30, T + 14); ctx.lineTo(L + 30, T + 37);
        ctx.moveTo(L + 15, T + 37); ctx.lineTo(L + 15, T + 60);
        ctx.moveTo(L + 45, T + 37); ctx.lineTo(L + 45, T + 60);
        ctx.stroke();
      } else {
        ctx.fillStyle = floorColor; ctx.fillRect(L, T, 60, 60);
        if (room === 'hall') {
          // 走道: 細格紋, 和房間地板分開 (魔物不出房間)
          ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(L, T + 30); ctx.lineTo(L + 60, T + 30); ctx.moveTo(L + 30, T); ctx.lineTo(L + 30, T + 60); ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
          circle(ctx, L + 16, T + 20, 3); ctx.fill(); circle(ctx, L + 42, T + 44, 2); ctx.fill();
        }
        if (kind === 'lava') {
          ctx.fillStyle = '#a8260c'; ctx.fillRect(L + 2, T + 2, 56, 56);
          var ph = now() * 2 + (x + y) * 0.03;
          ctx.fillStyle = palette.lava;
          rrect(ctx, L + 5, T + 5, 50, 50, 10); ctx.fill();
          ctx.fillStyle = '#ffc04a';
          ctx.globalAlpha = 0.6 + 0.3 * Math.sin(ph);
          ctx.beginPath(); ctx.ellipse(L + 22, T + 24, 9, 5, 0.3, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.ellipse(L + 40, T + 40, 7, 4, -0.4, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = '#7a1a06'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(L + 8, T + 44); ctx.lineTo(L + 20, T + 38); ctx.lineTo(L + 28, T + 50); ctx.stroke();
        } else if (kind === 'water') {
          ctx.fillStyle = palette.water; ctx.fillRect(L + 1, T + 1, 58, 58);
          ctx.strokeStyle = 'rgba(160,210,255,0.55)'; ctx.lineWidth = 2;
          var w = (now() * 12 + x) % 20;
          ctx.beginPath();
          for (var r = 0; r < 3; r++) {
            var yy = T + 12 + r * 18;
            ctx.moveTo(L + 6, yy); ctx.quadraticCurveTo(L + 18 + w * 0.3, yy - 5, L + 30, yy); ctx.quadraticCurveTo(L + 42, yy + 5, L + 54, yy);
          }
          ctx.stroke();
        } else if (kind === 'pillar') {
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.beginPath(); ctx.ellipse(x + 3, y + 6, 26, 22, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = D.pillar; circle(ctx, x, y, 25); ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 3; circle(ctx, x, y, 25); ctx.stroke();
          ctx.fillStyle = D.wallTop; circle(ctx, x - 3, y - 4, 17); ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; circle(ctx, x - 3, y - 4, 10); ctx.stroke();
        }
        if (s.nest === true && kind !== 'lava' && kind !== 'water') {
          // 巢穴: 草圈 + 一圈小石
          ctx.strokeStyle = 'rgba(214,176,108,0.55)'; ctx.lineWidth = 5;
          circle(ctx, x, y, 19); ctx.stroke();
          ctx.fillStyle = 'rgba(230,220,200,0.5)';
          for (var i = 0; i < 6; i++) { var a = i * TAU / 6; circle(ctx, x + Math.cos(a) * 25, y + Math.sin(a) * 25, 3); ctx.fill(); }
        }
      }
      ctx.restore();
    },

    // ---------- 馴獸師 64×64, 判定半徑 18 = 本體圓 ----------
    drawTamer: function (ctx, state) {
      var s = S(state);
      var x = num(s.x), y = num(s.y);
      var f = Math.round(num(s.facing, 0)); f = ((f % 8) + 8) % 8;
      var ang = -Math.PI / 2 + f * Math.PI / 4;
      var w = weap(s.weapon);
      ctx.save();
      ctx.translate(x, y);
      if (s.blink === true) ctx.globalAlpha = (Math.floor(now() * 12) % 2) ? 0.3 : 0.85;
      if (s.dashing === true) {
        // 突進殘影 (往後, 收在框內)
        for (var k = 2; k >= 1; k--) {
          ctx.fillStyle = 'rgba(63,224,200,' + (0.18 * (3 - k)) + ')';
          circle(ctx, -Math.cos(ang) * 7 * k, -Math.sin(ang) * 7 * k, 16); ctx.fill();
        }
      }
      // 武器 (握在面向的右手側)
      ctx.save();
      ctx.rotate(ang);
      ctx.lineCap = 'round';
      if (w === 'club') {
        ctx.strokeStyle = '#3a2414'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(4, 14); ctx.lineTo(26, 18); ctx.stroke();
        ctx.strokeStyle = '#a86e3a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(4, 14); ctx.lineTo(26, 18); ctx.stroke();
      } else if (w === 'sword') {
        ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(6, 14); ctx.lineTo(29, 14); ctx.stroke();
        ctx.strokeStyle = '#e4ecf4'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(10, 14); ctx.lineTo(29, 14); ctx.stroke();
        ctx.strokeStyle = '#c89a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, 9); ctx.lineTo(10, 19); ctx.stroke();
      } else if (w === 'spear') {
        ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-14, 14); ctx.lineTo(24, 14); ctx.stroke();
        ctx.fillStyle = '#e4ecf4'; ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(31, 14); ctx.lineTo(23, 9); ctx.lineTo(23, 19); ctx.closePath(); ctx.fill(); ctx.stroke();
      } else {
        ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(6, 14); ctx.bezierCurveTo(18, 26, 28, 4, 22, 22); ctx.stroke();
        ctx.fillStyle = '#3a2414'; rrect(ctx, 2, 11, 9, 6, 2); ctx.fill();
      }
      ctx.restore();
      // 本體: 外緣 = 判定半徑 18
      ctx.fillStyle = palette.playerBody;
      circle(ctx, 0, 0, 16.5); ctx.fill();
      ctx.strokeStyle = palette.player; ctx.lineWidth = 3;
      circle(ctx, 0, 0, 16.5); ctx.stroke();
      // 帽子
      ctx.fillStyle = '#2a7a6c';
      circle(ctx, 0, 0, 9); ctx.fill();
      ctx.fillStyle = '#c84a3a';
      circle(ctx, 0, 0, 4); ctx.fill();
      // 面向鼻尖
      ctx.fillStyle = palette.player; ctx.strokeStyle = '#0c2a26'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * 28, Math.sin(ang) * 28);
      ctx.lineTo(Math.cos(ang + 0.42) * 17, Math.sin(ang + 0.42) * 17);
      ctx.lineTo(Math.cos(ang - 0.42) * 17, Math.sin(ang - 0.42) * 17);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      if (s.lassoing === true) {
        // 腰間繩圈
        ctx.strokeStyle = palette.rope; ctx.lineWidth = 3;
        var ba = ang + Math.PI;
        circle(ctx, Math.cos(ba) * 16, Math.sin(ba) * 16, 7); ctx.stroke();
      }
      if (s.dashing === true) {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        circle(ctx, 0, 0, 21); ctx.stroke();
      }
      ctx.restore();
    },

    // ---------- 地下城野生魔物 90×90 (石像鬼 110×110) ----------
    drawWildMonster: function (ctx, state) {
      var s = S(state);
      var x = num(s.x), y = num(s.y);
      var key = sp(s.species);
      var big = key === 'stone';
      var half = big ? 55 : 45;
      var r = big ? 34 : 28;
      var dir = num(s.dir, 1) < 0 ? -1 : 1;
      var stunned = s.lassoed === true || num(s.stunLeft) > 0;
      var t = now();
      ctx.save();
      ctx.translate(x, y);
      // 施法預備: 本體外一圈種類色虛線脈動
      if (s.casting === true && !stunned) {
        ctx.strokeStyle = SPECIES[key].l; ctx.lineWidth = 3;
        ctx.setLineDash([6, 5]); ctx.lineDashOffset = -t * 30;
        circle(ctx, 0, 0, r * 1.38 + 2 * Math.sin(t * 14)); ctx.stroke();
        ctx.setLineDash([]);
      }
      // 雷鳥急衝: 身後速度線
      if (s.dashing === true) {
        ctx.strokeStyle = 'rgba(255,250,200,0.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (var i = -1; i <= 1; i++) {
          ctx.beginPath(); ctx.moveTo(-dir * (r * 0.9), i * 12); ctx.lineTo(-dir * (half - 2), i * 12); ctx.stroke();
        }
      }
      var bob = stunned ? 0 : Math.sin(t * 4 + x * 0.01) * 1.5;
      ctx.save(); ctx.translate(0, bob - (big ? 2 : 2));
      monsterBody(ctx, key, r, { dir: dir, flash: s.hit === true });
      ctx.restore();
      // 被套住: 頸上繩圈
      if (s.lassoed === true) {
        ctx.strokeStyle = palette.rope; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(0, r * 0.15, r * 0.95, r * 0.35, 0, 0, TAU); ctx.stroke();
      }
      // 暈眩: 頭上繞的星星; 擊暈另畫剩餘時間短弧
      if (stunned) {
        var sy = -half + 12;
        for (var k = 0; k < 3; k++) {
          var a = t * 4 + k * TAU / 3;
          ctx.fillStyle = '#fff07a'; ctx.strokeStyle = '#3a3010'; ctx.lineWidth = 1.5;
          star(ctx, Math.cos(a) * 16, sy + Math.sin(a) * 4, 6); ctx.fill(); ctx.stroke();
        }
        if (s.lassoed !== true && num(s.stunLeft) > 0) {
          var p = ratio(s.stunLeft, num(s.stunDur, 2) || 2);
          // 擊暈剩餘: 星星上方一條會縮短的短線
          ctx.strokeStyle = 'rgba(10,8,16,0.8)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(-20, -half + 3); ctx.lineTo(20, -half + 3); ctx.stroke();
          ctx.strokeStyle = '#fff07a'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(-20, -half + 3); ctx.lineTo(-20 + 40 * p, -half + 3); ctx.stroke();
        }
      }
      // 殘血記號: 右上一顆裂開的小心 + 汗滴
      if (s.weak === true) {
        var wx = half - 12, wy = -half + 12;
        ctx.fillStyle = '#ffb0c0'; ctx.strokeStyle = '#3a1020'; ctx.lineWidth = 2;
        heart(ctx, wx, wy, 9); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#3a1020'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(wx, wy - 4); ctx.lineTo(wx - 3, wy); ctx.lineTo(wx + 2, wy + 3); ctx.lineTo(wx - 1, wy + 7); ctx.stroke();
        ctx.fillStyle = '#9fd8ff';
        ctx.beginPath(); ctx.moveTo(-half + 10, -half + 14); ctx.quadraticCurveTo(-half + 15, -half + 22, -half + 10, -half + 24); ctx.quadraticCurveTo(-half + 5, -half + 22, -half + 10, -half + 14); ctx.fill();
      }
      // 血條 (底部), 30% 處一道殘血刻度
      var hpMax = Math.max(1, num(s.maxHp, 1));
      var hp = clamp(num(s.hp, hpMax) / hpMax, 0, 1);
      var bw = big ? 64 : 56, by = half - 8;
      ctx.fillStyle = '#100c14'; rrect(ctx, -bw / 2 - 2, by - 2, bw + 4, 9, 3); ctx.fill();
      ctx.fillStyle = hp <= 0.3 ? '#ff7a8a' : '#8fe07a';
      ctx.fillRect(-bw / 2, by, bw * hp, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-bw / 2 + bw * 0.3 - 1, by - 2, 2, 9);
      ctx.restore();
    },

    // ---------- 準備捕捉 120×120 ----------
    drawCaptureRing: function (ctx, state) {
      var s = S(state);
      var x = num(s.x), y = num(s.y);
      var p = ratio(s.t, s.dur);
      ctx.save();
      ctx.translate(x, y);
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(10,8,16,0.75)'; ctx.lineWidth = 10;
      circle(ctx, 0, 0, 40); ctx.stroke();
      ctx.strokeStyle = 'rgba(63,224,200,0.3)'; ctx.lineWidth = 6;
      circle(ctx, 0, 0, 40); ctx.stroke();
      if (p > 0) {
        ctx.strokeStyle = palette.player; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(0, 0, 40, -Math.PI / 2, -Math.PI / 2 + TAU * p); ctx.stroke();
      }
      // 「準備捕捉」字樣 (底部膠囊)
      ctx.fillStyle = 'rgba(10,30,28,0.9)';
      rrect(ctx, -40, 44, 80, 16, 8); ctx.fill();
      ctx.strokeStyle = palette.player; ctx.lineWidth = 1.5;
      rrect(ctx, -40, 44, 80, 16, 8); ctx.stroke();
      txt(ctx, '準備捕捉', 0, 52.5, 14, palette.player, 'center', 'middle', false);
      ctx.restore();
    },

    // ---------- 套索與繞圈進度 ----------
    drawLasso: function (ctx, state) {
      var s = S(state);
      var x1 = num(s.x1), y1 = num(s.y1), x2 = num(s.x2), y2 = num(s.y2);
      var maxLen = num(s.maxLen, 220) || 220;
      var tense = c01(num(s.len) / maxLen);
      var prog = c01(s.progress);
      var limit = num(s.limit, 5) || 5;
      var left = Math.max(0, limit - num(s.t));
      ctx.save();
      // 繩: 鬆時下垂, 越接近最大長度越直、越紅、越粗並抖動
      var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      var sag = (1 - tense) * 34;
      var jit = tense > 0.8 ? Math.sin(now() * 60) * 2 : 0;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(10,8,16,0.8)'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my + sag + jit, x2, y2); ctx.stroke();
      ctx.strokeStyle = tense > 0.8 ? '#ff8a5a' : palette.rope; ctx.lineWidth = tense > 0.8 ? 4.5 : 3.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my + sag + jit, x2, y2); ctx.stroke();
      // 繞圈進度環 (魔物周圍)
      ctx.strokeStyle = 'rgba(10,8,16,0.75)'; ctx.lineWidth = 11;
      circle(ctx, x2, y2, 52); ctx.stroke();
      ctx.strokeStyle = 'rgba(63,224,200,0.28)'; ctx.lineWidth = 7;
      circle(ctx, x2, y2, 52); ctx.stroke();
      if (prog > 0) {
        ctx.strokeStyle = palette.player; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.arc(x2, y2, 52, -Math.PI / 2, -Math.PI / 2 + TAU * prog); ctx.stroke();
        var ea = -Math.PI / 2 + TAU * prog;
        ctx.fillStyle = '#ffffff';
        circle(ctx, x2 + Math.cos(ea) * 52, y2 + Math.sin(ea) * 52, 5); ctx.fill();
      }
      // 時限: 繩中點的小鐘 (剩餘), 最後 1 秒轉紅
      var cy = my + sag * 0.5;
      var lp = clamp(left / limit, 0, 1);
      ctx.fillStyle = '#100c14'; circle(ctx, mx, cy, 12); ctx.fill();
      ctx.fillStyle = left <= 1 ? palette.danger : '#ffe27a';
      ctx.beginPath(); ctx.moveTo(mx, cy); ctx.arc(mx, cy, 9, -Math.PI / 2, -Math.PI / 2 + TAU * lp); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; circle(ctx, mx, cy, 12); ctx.stroke();
      ctx.restore();
    },

    // ---------- 魔物技能 (地下城 / 表演場共用) ----------
    drawHazard: function (ctx, state) {
      var s = S(state);
      var x = num(s.x), y = num(s.y);
      var kind = oneOf(s.kind, ['firering', 'waterball', 'thunder', 'quake', 'spike', 'wisp'], 'firering');
      var phase = oneOf(s.phase, ['warn', 'active', 'fly'], kind === 'waterball' || kind === 'spike' || kind === 'wisp' ? 'fly' : 'active');
      var r = Math.max(0, num(s.radius, kind === 'firering' ? 120 : kind === 'thunder' ? 70 : kind === 'quake' ? 0 : kind === 'waterball' ? 12 : kind === 'spike' ? 10 : 14));
      var p = ratio(s.t, s.dur);
      var ang = num(s.angle);
      var refl = s.reflected === true;
      var spc = { firering: 'fire', thunder: 'thunder', quake: 'stone', waterball: 'water', spike: 'spike', wisp: 'ghost' }[kind];
      var C = SPECIES[spc];
      var T = now();
      ctx.save();
      ctx.translate(x, y);
      if (kind === 'firering' || kind === 'thunder') {
        if (phase === 'warn') {
          // 預警: 虛線外框 = 判定外緣 + 由中心長大的填色, 長滿 = 生效
          ctx.fillStyle = 'rgba(0,0,0,0.25)'; circle(ctx, 0, 0, r); ctx.fill();
          ctx.globalAlpha = 0.32; ctx.fillStyle = C.c;
          circle(ctx, 0, 0, r * p); ctx.fill();
          ctx.globalAlpha = 1;
          ctx.setLineDash([10, 7]); ctx.lineDashOffset = -T * 40;
          ctx.strokeStyle = C.l; ctx.lineWidth = 3;
          circle(ctx, 0, 0, r - 1.5); ctx.stroke();
          ctx.setLineDash([]);
          if (kind === 'thunder') {
            ctx.strokeStyle = C.l; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.stroke();
          }
        } else {
          var fade = 1 - p * 0.6;
          ctx.globalAlpha = fade;
          if (kind === 'firering') {
            var g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
            g.addColorStop(0, 'rgba(255,200,80,0.55)'); g.addColorStop(0.7, 'rgba(236,59,48,0.6)'); g.addColorStop(1, 'rgba(236,59,48,0.85)');
            ctx.fillStyle = g; circle(ctx, 0, 0, r); ctx.fill();
            // 外緣火舌 (往內長, 不越出判定)
            ctx.fillStyle = '#ffb21c';
            ctx.beginPath();
            for (var i = 0; i < 24; i++) {
              var a = i * TAU / 24 + T * 0.8;
              var h = 10 + 6 * Math.sin(T * 10 + i * 1.7);
              ctx.moveTo(Math.cos(a - 0.1) * r, Math.sin(a - 0.1) * r);
              ctx.lineTo(Math.cos(a) * (r - h), Math.sin(a) * (r - h));
              ctx.lineTo(Math.cos(a + 0.1) * r, Math.sin(a + 0.1) * r);
            }
            ctx.fill();
            ctx.strokeStyle = '#fff0c0'; ctx.lineWidth = 3; circle(ctx, 0, 0, r - 1.5); ctx.stroke();
          } else {
            ctx.fillStyle = 'rgba(255,250,190,0.75)'; circle(ctx, 0, 0, r); ctx.fill();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; circle(ctx, 0, 0, r - 1.5); ctx.stroke();
            // 閃電 (從上方劈下)
            ctx.strokeStyle = C.c; ctx.lineWidth = 9; ctx.lineJoin = 'round';
            ctx.beginPath(); ctx.moveTo(-10, -r * 1.6); ctx.lineTo(8, -r * 0.8); ctx.lineTo(-6, -r * 0.5); ctx.lineTo(4, 0); ctx.stroke();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(-10, -r * 1.6); ctx.lineTo(8, -r * 0.8); ctx.lineTo(-6, -r * 0.5); ctx.lineTo(4, 0); ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
      } else if (kind === 'quake') {
        if (phase === 'warn') {
          ctx.setLineDash([8, 6]); ctx.strokeStyle = C.l; ctx.lineWidth = 3;
          circle(ctx, 0, 0, 30); ctx.stroke(); ctx.setLineDash([]);
        } else {
          // 判讀約定: radius = 中線, 判定帶 = [radius-15, radius+15]
          var inner = Math.max(0, r - 15), outer = r + 15;
          ctx.globalAlpha = 1 - p * 0.3;
          ctx.fillStyle = 'rgba(156,143,132,0.75)';
          ctx.beginPath(); ctx.arc(0, 0, outer, 0, TAU); ctx.arc(0, 0, inner, 0, TAU, true); ctx.fill('evenodd');
          ctx.strokeStyle = '#f0e6da'; ctx.lineWidth = 2.5;
          circle(ctx, 0, 0, outer - 1.25); ctx.stroke();
          ctx.strokeStyle = '#4a423c'; ctx.lineWidth = 2;
          if (inner > 2) { circle(ctx, 0, 0, inner + 1); ctx.stroke(); }
          // 裂紋
          ctx.strokeStyle = '#4a423c'; ctx.lineWidth = 2;
          ctx.beginPath();
          for (var q = 0; q < 12; q++) {
            var qa = q * TAU / 12;
            ctx.moveTo(Math.cos(qa) * inner, Math.sin(qa) * inner);
            ctx.lineTo(Math.cos(qa + 0.05) * r, Math.sin(qa + 0.05) * r);
            ctx.lineTo(Math.cos(qa - 0.03) * outer, Math.sin(qa - 0.03) * outer);
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      } else {
        // 投射物: 判定圓 = 畫面外緣; 被打回 = 馴獸師色 + 白芯
        var col = refl ? palette.player : C.c;
        var dark = refl ? '#0c3a34' : C.d;
        var life = (kind === 'wisp' && num(s.dur) > 0) ? 1 - p : 1;
        ctx.globalAlpha = life < 0.2 ? 0.4 + life * 3 : 1;
        ctx.rotate(ang);
        // 尾跡
        ctx.fillStyle = col; ctx.globalAlpha *= 0.4;
        ctx.beginPath(); ctx.moveTo(-r * 3, 0); ctx.lineTo(0, -r * 0.7); ctx.lineTo(0, r * 0.7); ctx.closePath(); ctx.fill();
        ctx.globalAlpha /= 0.4;
        if (kind === 'spike') {
          ctx.fillStyle = col; ctx.strokeStyle = dark; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(r, 0); ctx.lineTo(-r * 0.6, -r * 0.6); ctx.lineTo(-r * 1.4, 0); ctx.lineTo(-r * 0.6, r * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
        } else if (kind === 'waterball') {
          ctx.fillStyle = col; ctx.strokeStyle = dark; ctx.lineWidth = 2;
          circle(ctx, 0, 0, r - 1); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.8)'; circle(ctx, r * 0.25, -r * 0.3, r * 0.3); ctx.fill();
        } else {
          ctx.fillStyle = col; ctx.strokeStyle = dark; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(0, 0, r - 1, -Math.PI / 2, Math.PI / 2);
          ctx.quadraticCurveTo(-r * 1.2, r * 0.6, -r * 1.6, Math.sin(T * 12) * r * 0.3);
          ctx.quadraticCurveTo(-r * 1.2, -r * 0.6, 0, -r + 1);
          ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = refl ? '#ffffff' : C.l; circle(ctx, 0, 0, r * 0.45); ctx.fill();
        }
        if (refl) {
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
          circle(ctx, 0, 0, r * 0.55); ctx.stroke();
        }
      }
      ctx.restore();
    },

    // ---------- 武器攻擊特效 ----------
    drawWeaponFx: function (ctx, state) {
      var s = S(state);
      var x = num(s.x), y = num(s.y);
      var shape = oneOf(s.shape, ['arc', 'circle', 'line', 'dash'], 'arc');
      var skill = s.move === 'skill';
      var w = weap(s.weapon);
      var ang = num(s.angle), spread = num(s.spread, Math.PI / 2);
      var r = Math.max(0, num(s.radius, 70));
      var len = Math.max(0, num(s.length, 0)), wid = Math.max(0, num(s.width, 40));
      var p = ratio(s.t, s.dur);
      var fill = skill ? 'rgba(63,224,200,0.38)' : 'rgba(255,255,255,0.3)';
      var edge = skill ? palette.player : '#ffffff';
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = 1 - p * 0.7;
      ctx.lineJoin = 'round';
      if (shape === 'arc') {
        ctx.fillStyle = fill;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, ang - spread / 2, ang + spread / 2); ctx.closePath(); ctx.fill();
        // 掃過的前緣
        var sweep = ang - spread / 2 + spread * Math.min(1, p * 1.6);
        ctx.strokeStyle = edge; ctx.lineWidth = skill ? 5 : 4;
        ctx.beginPath(); ctx.arc(0, 0, Math.max(0, r - 2), ang - spread / 2, sweep); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(sweep) * r, Math.sin(sweep) * r); ctx.stroke();
        if (skill && w === 'sword') {
          // 擊暈: 範圍內小星
          ctx.fillStyle = '#fff07a';
          for (var i = 0; i < 3; i++) {
            var a = ang - spread / 3 + i * spread / 3;
            star(ctx, Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.65, 7); ctx.fill();
          }
        }
        if (skill && w === 'whip') {
          // 擊飛: 外緣朝外的箭頭
          ctx.fillStyle = edge;
          for (var j = -1; j <= 1; j++) {
            var b = ang + j * spread / 3;
            arrowHead(ctx, Math.cos(b) * (r - 10), Math.sin(b) * (r - 10), b, 9); ctx.fill();
          }
        }
      } else if (shape === 'circle') {
        ctx.fillStyle = fill;
        circle(ctx, 0, 0, r); ctx.fill();
        ctx.strokeStyle = edge; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, Math.max(0, r - 2), -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, p * 1.6)); ctx.stroke();
      } else if (shape === 'line') {
        ctx.rotate(ang);
        ctx.fillStyle = fill;
        ctx.fillRect(0, -wid / 2, len, wid);
        ctx.strokeStyle = edge; ctx.lineWidth = 3;
        ctx.strokeRect(1.5, -wid / 2 + 1.5, Math.max(0, len - 3), Math.max(0, wid - 3));
        ctx.fillStyle = edge;
        var tipX = len * Math.min(1, 0.4 + p * 1.5);
        ctx.beginPath(); ctx.moveTo(tipX, 0); ctx.lineTo(tipX - 16, -wid / 2 + 4); ctx.lineTo(tipX - 16, wid / 2 - 4); ctx.closePath(); ctx.fill();
      } else {
        // 突進殘影軌跡
        ctx.rotate(ang);
        var g = ctx.createLinearGradient(0, 0, len, 0);
        g.addColorStop(0, 'rgba(63,224,200,0)'); g.addColorStop(1, 'rgba(63,224,200,0.55)');
        ctx.fillStyle = g;
        rrect(ctx, 0, -18, len, 36, 18); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(len * 0.2, -10); ctx.lineTo(len, -10); ctx.moveTo(len * 0.1, 10); ctx.lineTo(len, 10); ctx.stroke();
      }
      ctx.restore();
    },

    // ---------- 地下城選擇卡 600×260 ----------
    drawDungeonCard: function (ctx, state) {
      var s = S(state);
      var x = num(s.x), y = num(s.y);
      var key = oneOf(s.dungeon, ['cave', 'cliff', 'ruins'], 'cave');
      var D = DUN[key];
      var open = s.open === true;
      var sel = s.selected === true;
      var L = x - 300, T = y - 130;
      ctx.save();
      // 底: 該地下城的地板色 + 牆帶
      ctx.fillStyle = D.floor;
      rrect(ctx, L + 3, T + 3, 594, 254, 18); ctx.fill();
      ctx.save();
      rrect(ctx, L + 3, T + 3, 594, 254, 18); ctx.clip();
      ctx.fillStyle = D.wall; ctx.fillRect(L, T, 600, 30);
      ctx.fillStyle = D.wallTop; ctx.fillRect(L, T, 600, 10);
      if (key === 'cave') {
        ctx.fillStyle = 'rgba(255,90,30,0.5)';
        ctx.beginPath(); ctx.ellipse(L + 560, T + 220, 70, 26, 0, 0, TAU); ctx.fill();
      } else if (key === 'cliff') {
        ctx.fillStyle = D.pillar;
        circle(ctx, L + 560, T + 210, 22); ctx.fill(); circle(ctx, L + 500, T + 236, 14); ctx.fill();
      } else {
        ctx.fillStyle = D.pillar;
        ctx.fillRect(L + 545, T + 150, 26, 110); ctx.fillRect(L + 505, T + 190, 20, 70);
      }
      ctx.restore();
      // 名稱
      txt(ctx, D.name, L + 30, T + 62, 40, open ? palette.text : '#c8c0d4', 'left');
      // 住的兩種魔物
      for (var i = 0; i < 2; i++) {
        var mx = L + 330 + i * 140, my = T + 120;
        ctx.save(); ctx.translate(mx, my);
        if (!open) ctx.globalAlpha = 0.75;
        monsterBody(ctx, D.species[i], 34, { dir: -1 });
        ctx.restore();
        txt(ctx, SPECIES[D.species[i]].name, mx, my + 62, 20, palette.text);
      }
      if (open) {
        ctx.fillStyle = palette.player;
        rrect(ctx, L + 30, T + 100, 110, 40, 20); ctx.fill();
        txt(ctx, '已開放', L + 85, T + 120, 22, '#0c2a26', 'center', 'middle', false);
      } else {
        // 鎖頭 + 條件文字
        var lx = L + 50, ly = T + 125;
        ctx.strokeStyle = '#e8e2d6'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(lx, ly - 8, 11, Math.PI, TAU); ctx.stroke();
        ctx.fillStyle = '#e8e2d6'; rrect(ctx, lx - 16, ly - 8, 32, 26, 5); ctx.fill();
        ctx.fillStyle = '#2a2430'; circle(ctx, lx, ly + 3, 4); ctx.fill();
        txt(ctx, '未開放', L + 80, T + 125, 22, '#e8e2d6', 'left');
        ctx.fillStyle = 'rgba(10,8,16,0.75)';
        rrect(ctx, L + 24, T + 170, 290, 60, 12); ctx.fill();
        txt(ctx, str(s.condition), L + 40, T + 200, 21, palette.gold, 'left');
        // 未開放: 整卡蓋一層暗
        ctx.fillStyle = 'rgba(10,8,16,0.22)';
        rrect(ctx, L + 3, T + 3, 594, 254, 18); ctx.fill();
      }
      // 外框 / 選擇框
      ctx.lineWidth = sel ? 6 : 2;
      ctx.strokeStyle = sel ? palette.cursor : palette.line;
      rrect(ctx, L + 3, T + 3, 594, 254, 18); ctx.stroke();
      if (sel) {
        ctx.fillStyle = palette.cursor;
        arrowHead(ctx, L + 16, y, 0, 10); ctx.fill();
      }
      ctx.restore();
    },

    // ---------- 布置第 1 步魔物卡 300×200 ----------
    drawRosterCard: function (ctx, state) {
      var s = S(state);
      var x = num(s.x), y = num(s.y);
      var key = sp(s.species);
      var lv = clamp(Math.round(num(s.level)), 0, 3);
      var picked = s.picked === true, sel = s.selected === true;
      var L = x - 150, T = y - 100;
      ctx.save();
      ctx.fillStyle = picked ? '#1e3a36' : palette.panel;
      rrect(ctx, L + 3, T + 3, 294, 194, 16); ctx.fill();
      ctx.save(); ctx.translate(L + 80, y + 8);
      if (!picked) ctx.globalAlpha = 0.85;
      monsterBody(ctx, key, 44, {});
      ctx.restore();
      txt(ctx, SPECIES[key].name, L + 150, T + 60, 28, palette.text, 'left');
      txt(ctx, 'Lv ' + lv, L + 150, T + 104, 24, palette.text, 'left');
      for (var i = 0; i < 3; i++) {
        ctx.fillStyle = i < lv ? palette.gold : 'rgba(255,255,255,0.15)';
        star(ctx, L + 222 + i * 22, T + 104, 9); ctx.fill();
      }
      if (picked) {
        ctx.fillStyle = palette.player;
        rrect(ctx, L + 150, T + 134, 110, 40, 20); ctx.fill();
        ctx.strokeStyle = '#0c2a26'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(L + 166, T + 154); ctx.lineTo(L + 174, T + 162); ctx.lineTo(L + 188, T + 145); ctx.stroke();
        txt(ctx, '上場', L + 222, T + 154, 22, '#0c2a26', 'center', 'middle', false);
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
        rrect(ctx, L + 150, T + 134, 110, 40, 20); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.lineWidth = sel ? 6 : (picked ? 3 : 2);
      ctx.strokeStyle = sel ? palette.cursor : (picked ? palette.player : palette.line);
      rrect(ctx, L + 3, T + 3, 294, 194, 16); ctx.stroke();
      ctx.restore();
    },

    // ---------- 布置格子 200×180 ----------
    drawSetupCell: function (ctx, state) {
      var s = S(state);
      var x = num(s.x), y = num(s.y);
      var sel = s.selected === true;
      var L = x - 100, T = y - 90;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
      ctx.strokeRect(L + 5, T + 5, 190, 170);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      circle(ctx, x, y, 3); ctx.fill();
      if (sel) {
        ctx.fillStyle = 'rgba(255,243,176,0.10)';
        ctx.fillRect(L + 3, T + 3, 194, 174);
        ctx.strokeStyle = 'rgba(10,8,16,0.8)'; ctx.lineWidth = 9;
        ctx.strokeRect(L + 4.5, T + 4.5, 191, 171);
        ctx.strokeStyle = palette.cursor; ctx.lineWidth = 5;
        ctx.strokeRect(L + 4.5, T + 4.5, 191, 171);
      }
      ctx.restore();
    },

    // ---------- 選擇面板 x 120~600 ----------
    drawPickerPanel: function (ctx, state) {
      var s = S(state);
      var opts = Array.isArray(s.options) ? s.options : [];
      var idx = Math.round(num(s.index));
      var n = opts.length;
      var L = 120, T = 240, W = 480, H = 80 + 70 * n;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      rrect(ctx, L + 6, T + 8, W, H, 16); ctx.fill();
      ctx.fillStyle = '#1c1826';
      rrect(ctx, L, T, W, H, 16); ctx.fill();
      ctx.strokeStyle = '#8a80a8'; ctx.lineWidth = 3;
      rrect(ctx, L + 1.5, T + 1.5, W - 3, H - 3, 15); ctx.stroke();
      txt(ctx, '要放什麼?', L + 24, T + 40, 28, palette.text, 'left');
      for (var i = 0; i < n; i++) {
        var o = (opts[i] && typeof opts[i] === 'object') ? opts[i] : {};
        var type = oneOf(o.type, ['monster', 'ball', 'clear'], 'clear');
        var RT = T + 80 + 70 * i;
        var on = i === idx;
        var ok = o.affordable !== false;
        ctx.save();
        if (on) {
          ctx.fillStyle = 'rgba(255,243,176,0.14)';
          rrect(ctx, L + 8, RT + 3, W - 16, 64, 10); ctx.fill();
          ctx.strokeStyle = palette.cursor; ctx.lineWidth = 4;
          rrect(ctx, L + 8, RT + 3, W - 16, 64, 10); ctx.stroke();
        } else if (i > 0) {
          ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(L + 20, RT); ctx.lineTo(L + W - 20, RT); ctx.stroke();
        }
        if (!ok) ctx.globalAlpha = 0.38;
        var ix = L + 48, iy = RT + 35;
        ctx.save(); ctx.translate(ix, iy);
        if (type === 'monster') monsterBody(ctx, o.key, 22, {});
        else if (type === 'ball') ballBody(ctx, o.key, 22, 0);
        else {
          ctx.strokeStyle = '#d8d0e4'; ctx.lineWidth = 3; ctx.setLineDash([5, 4]);
          circle(ctx, 0, 0, 20); ctx.stroke(); ctx.setLineDash([]);
          ctx.lineWidth = 4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(8, 8); ctx.moveTo(8, -8); ctx.lineTo(-8, 8); ctx.stroke();
        }
        ctx.restore();
        var name = str(o.name) || (type === 'clear' ? '清空' : '');
        if (type === 'ball') {
          txt(ctx, name, L + 90, RT + 23, 24, palette.text, 'left');
          txt(ctx, str(o.desc), L + 90, RT + 52, 17, palette.textDim, 'left');
          txt(ctx, num(o.cost) + ' 金', L + W - 24, RT + 23, 22, ok ? palette.gold : '#c87a7a', 'right');
        } else {
          txt(ctx, name, L + 90, RT + 35, 24, palette.text, 'left');
        }
        ctx.restore();
      }
      ctx.restore();
    },

    // ---------- 布置第 2 步資訊列 400×120 ----------
    drawSetupInfo: function (ctx, state) {
      var s = S(state);
      var cx = 260, cy = 1210; // spec 版位 x 60~460、y 1150~1270
      if (s.x !== undefined) cx = num(s.x, cx);
      if (s.y !== undefined) cy = num(s.y, cy);
      var L = cx - 200, T = cy - 60;
      var placed = Math.round(num(s.placed)), picked = Math.round(num(s.picked));
      var balls = Math.round(num(s.balls)), bmax = Math.round(num(s.ballMax, 6));
      ctx.save();
      ctx.fillStyle = palette.panel;
      rrect(ctx, L + 2, T + 6, 396, 108, 14); ctx.fill();
      ctx.strokeStyle = palette.line; ctx.lineWidth = 2;
      rrect(ctx, L + 2, T + 6, 396, 108, 14); ctx.stroke();
      // 三塊底卡
      var cols = [L + 12, L + 142, L + 272];
      for (var i = 0; i < 3; i++) {
        ctx.fillStyle = palette.panelHi;
        rrect(ctx, cols[i], T + 16, 116, 88, 10); ctx.fill();
      }
      txt(ctx, '金幣', cols[0] + 58, T + 38, 17, palette.textDim);
      txt(ctx, String(Math.round(num(s.gold))), cols[0] + 58, T + 76, 30, palette.gold);
      txt(ctx, '已擺', cols[1] + 58, T + 38, 17, palette.textDim);
      txt(ctx, placed + ' / ' + picked, cols[1] + 58, T + 76, 28, placed < picked ? '#ffc070' : palette.text);
      txt(ctx, '球', cols[2] + 58, T + 38, 17, palette.textDim);
      txt(ctx, balls + ' / ' + bmax, cols[2] + 58, T + 76, 28, balls >= bmax ? '#ff8a8a' : palette.text);
      ctx.restore();
    },

    // ---------- 玩具球 52×52, 判定半徑 24 ----------
    drawToyBall: function (ctx, state) {
      var s = S(state);
      var x = num(s.x), y = num(s.y);
      var k = ballKind(s.kind);
      var b = BALL[k];
      var rolling = s.rolling === true;
      var ang = num(s.angle);
      var hp = ratio(s.hitT, s.hitDur);
      var hitting = num(s.hitT) > 0 && hp < 1;
      var T = now();
      ctx.save();
      ctx.translate(x, y);
      if (rolling) {
        // 毛線球: 吸引範圍淡圈 (半徑 220 = 外緣)
        if (k === 'yarn') {
          ctx.fillStyle = 'rgba(255,122,208,0.06)';
          circle(ctx, 0, 0, 220); ctx.fill();
          ctx.strokeStyle = 'rgba(255,122,208,0.55)'; ctx.lineWidth = 2;
          ctx.setLineDash([10, 10]); ctx.lineDashOffset = T * 30;
          circle(ctx, 0, 0, 219); ctx.stroke(); ctx.setLineDash([]);
        }
        // 滾動殘影 (身後, 球色)
        for (var i = 3; i >= 1; i--) {
          ctx.fillStyle = b.c;
          ctx.globalAlpha = 0.12 * (4 - i);
          circle(ctx, -Math.cos(ang) * 14 * i, -Math.sin(ang) * 14 * i, 22 - i * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      var spin = rolling ? T * 9 : 0;
      ballBody(ctx, k, 24, spin);
      if (hitting) {
        // 撞中: 球的效果色外擴光環 + 白閃 (長在球本身)
        ctx.fillStyle = 'rgba(255,255,255,' + (0.6 * (1 - hp)) + ')';
        circle(ctx, 0, 0, 22); ctx.fill();
        ctx.strokeStyle = '#120c18'; ctx.lineWidth = 6; ctx.globalAlpha = 1 - hp;
        circle(ctx, 0, 0, 24 + hp * 10); ctx.stroke();
        ctx.strokeStyle = b.c; ctx.lineWidth = 3.5;
        circle(ctx, 0, 0, 24 + hp * 10); ctx.stroke();
      }
      ctx.restore();
    },

    // ---------- 表演場底 ----------
    drawShowArena: function (ctx) {
      ctx.save();
      // 觀眾席
      function stand(T, B, top) {
        ctx.fillStyle = '#2a2134';
        ctx.fillRect(0, T, 720, B - T);
        ctx.fillStyle = '#342840';
        for (var i = 0; i < 6; i++) {
          var sx = 110 + 100 * i;
          rrect(ctx, sx - 40, top ? T + 82 : T + 82, 80, 20, 6); ctx.fill();
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 2;
        for (var r = T + 20; r < B; r += 30) { ctx.beginPath(); ctx.moveTo(0, r); ctx.lineTo(720, r); ctx.stroke(); }
      }
      stand(130, 250, true);
      stand(1020, 1140, false);
      // 圍欄下方地帶
      ctx.fillStyle = '#1e1826';
      ctx.fillRect(0, 250, 720, 20); ctx.fillRect(0, 990, 720, 30);
      // 場地: 深色布幕 + 中央圓
      ctx.fillStyle = '#2e2440';
      ctx.fillRect(60, 270, 600, 720);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 2;
      for (var k = 0; k < 12; k++) { ctx.beginPath(); ctx.moveTo(60 + 50 * k + 25, 270); ctx.lineTo(60 + 50 * k + 25, 990); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,220,160,0.14)'; ctx.lineWidth = 4;
      circle(ctx, 360, 630, 150); ctx.stroke();
      circle(ctx, 360, 630, 6); ctx.stroke();
      // 場地邊界 (球會反彈)
      ctx.strokeStyle = '#d8c090'; ctx.lineWidth = 4;
      ctx.strokeRect(62, 272, 596, 716);
      // 側邊
      ctx.fillStyle = '#1e1826';
      ctx.fillRect(0, 270, 60, 720); ctx.fillRect(660, 270, 60, 720);
      // 底部資訊區
      ctx.fillStyle = '#16131d';
      ctx.fillRect(0, 1140, 720, 140);
      ctx.restore();
    },

    // ---------- 表演場魔物 + 怒氣條 ----------
    drawShowMonster: function (ctx, state) {
      var s = S(state);
      var x = num(s.x), y = num(s.y);
      var key = sp(s.species);
      var big = key === 'stone';
      var sc = big ? 1.2 : 1;
      var dir = num(s.dir, 1) < 0 ? -1 : 1;
      var mode = oneOf(s.mode, ['roam', 'chase', 'charge', 'loose'], 'roam');
      var wild = mode === 'charge' || mode === 'loose';
      var rage = clamp(num(s.rage), 0, 100);
      var redLow = clamp(num(s.redLow, 80), 0, 100);
      var marks = clamp(Math.round(num(s.marks)), 0, 4);
      var lv = clamp(Math.round(num(s.level)), 0, 3);
      var fx = oneOf(s.fx, ['none', 'ignited', 'doused'], 'none');
      var fxp = ratio(s.fxT, num(s.fxDur, 0.5) || 0.5);
      var T = now();
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sc, sc);
      // 以下在 100×100 框內 (±50) 設計; 石像鬼放大 1.2 = 120×120
      var r = 26, by = 10;
      var shake = 0;
      if (mode === 'charge' && num(s.chargeT) > 0) shake = Math.sin(T * 50) * 2.5;
      // 失控: 紅色怒氣光 (規則紅只在線) + 內夾白細線
      if (wild) {
        ctx.strokeStyle = palette.danger; ctx.lineWidth = 4;
        circle(ctx, shake, by, r + 10); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
        circle(ctx, shake, by, r + 7); ctx.stroke();
      }
      // 追毛線球: 毛線粉虛線圈
      if (mode === 'chase') {
        ctx.strokeStyle = palette.yarn; ctx.lineWidth = 3; ctx.setLineDash([5, 5]); ctx.lineDashOffset = -T * 20;
        circle(ctx, 0, by, r + 9); ctx.stroke(); ctx.setLineDash([]);
      }
      // 表演: 金色星芒
      var pp = s.performing === true ? ratio(s.performT, num(s.performDur, 0.5) || 0.5) : 0;
      if (s.performing === true) {
        ctx.strokeStyle = palette.perform; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.globalAlpha = 1 - pp * 0.6;
        for (var i = 0; i < 8; i++) {
          var a = i * TAU / 8 + 0.2;
          var r0 = r + 4 + pp * 3, r1 = r + 10 + pp * 2;
          ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, by + Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, by + Math.sin(a) * r1); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      // 雷鳥急衝: 身後速度線
      if (s.dashing === true) {
        ctx.strokeStyle = 'rgba(255,250,200,0.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (var d = -1; d <= 1; d++) {
          ctx.beginPath(); ctx.moveTo(-dir * (r * 0.9), by + d * 11); ctx.lineTo(-dir * 48, by + d * 11); ctx.stroke();
        }
      }
      // 本體
      var pulse = s.performing === true ? 1 + 0.1 * Math.sin(Math.PI * pp) : 1;
      var bob = wild ? Math.abs(Math.sin(T * 14)) * -3 : Math.sin(T * 4 + x * 0.02) * 1.5;
      ctx.save();
      ctx.translate(shake, by + bob);
      ctx.scale(pulse, pulse);
      monsterBody(ctx, key, r, { dir: dir });
      ctx.restore();
      // 失控: 頭上怒氣符號
      if (wild) {
        ctx.strokeStyle = palette.danger; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
        var vx = dir * 20, vy = by - 22;
        ctx.beginPath();
        ctx.moveTo(vx - 7, vy - 2); ctx.lineTo(vx - 2, vy - 2); ctx.lineTo(vx - 2, vy - 7);
        ctx.moveTo(vx + 7, vy - 2); ctx.lineTo(vx + 2, vy - 2); ctx.lineTo(vx + 2, vy - 7);
        ctx.moveTo(vx - 7, vy + 2); ctx.lineTo(vx - 2, vy + 2); ctx.lineTo(vx - 2, vy + 7);
        ctx.moveTo(vx + 7, vy + 2); ctx.lineTo(vx + 2, vy + 2); ctx.lineTo(vx + 2, vy + 7);
        ctx.stroke();
        // 撞欄 / 亂竄進度: 本體外一圈白弧 (撞欄到破欄、亂竄到累倒還剩多少)
        var wp = mode === 'charge' ? ratio(s.chargeT, num(s.chargeDur, 1.5) || 1.5) : ratio(s.looseT, num(s.looseDur, 6) || 6);
        if (mode === 'loose' || num(s.chargeT) > 0) {
          ctx.strokeStyle = 'rgba(10,8,16,0.8)'; ctx.lineWidth = 6;
          circle(ctx, 0, by, r + 12); ctx.stroke();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(0, by, r + 12, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - wp)); ctx.stroke();
        }
      }
      // 升怒 / 降怒: 長在本體兩側 (橘火苗往上竄 / 青水珠往下滴)
      if (fx !== 'none' && num(s.fxT) >= 0 && fxp < 1) {
        ctx.globalAlpha = 1 - fxp * 0.7;
        for (var side = -1; side <= 1; side += 2) {
          for (var f = 0; f < 2; f++) {
            var fxx = side * (r + 6 + f * 6);
            if (fx === 'ignited') {
              var fy = by + 14 - fxp * 26 - f * 8;
              ctx.fillStyle = '#2a0e00';
              ctx.beginPath(); ctx.moveTo(fxx, fy - 13); ctx.quadraticCurveTo(fxx + 8, fy, fxx, fy + 6); ctx.quadraticCurveTo(fxx - 8, fy, fxx, fy - 13); ctx.fill();
              ctx.fillStyle = palette.ignite;
              ctx.beginPath(); ctx.moveTo(fxx, fy - 10); ctx.quadraticCurveTo(fxx + 6, fy, fxx, fy + 4); ctx.quadraticCurveTo(fxx - 6, fy, fxx, fy - 10); ctx.fill();
            } else {
              var dy = by - 12 + fxp * 26 + f * 8;
              ctx.fillStyle = '#062430';
              ctx.beginPath(); ctx.moveTo(fxx, dy - 7); ctx.quadraticCurveTo(fxx + 8, dy + 5, fxx, dy + 9); ctx.quadraticCurveTo(fxx - 8, dy + 5, fxx, dy - 7); ctx.fill();
              ctx.fillStyle = palette.douse;
              ctx.beginPath(); ctx.moveTo(fxx, dy - 4); ctx.quadraticCurveTo(fxx + 5, dy + 4, fxx, dy + 6); ctx.quadraticCurveTo(fxx - 5, dy + 4, fxx, dy - 4); ctx.fill();
            }
          }
        }
        ctx.globalAlpha = 1;
      }
      // 怒氣條 90×12, 框頂
      var BL = -45, BT = -50, BW = 90, BH = 12;
      ctx.fillStyle = '#0c0a12';
      rrect(ctx, BL, BT, BW, BH, 3); ctx.fill();
      var ix = BL + 2, iw = BW - 4, iy = BT + 2, ih = BH - 4;
      // 紅區底
      ctx.fillStyle = 'rgba(255,59,74,0.28)';
      ctx.fillRect(ix + iw * redLow / 100, iy, iw * (1 - redLow / 100), ih);
      var fillCol = rage >= redLow ? palette.danger : rage >= 50 ? '#ffb43a' : '#7d8aa6';
      if (wild || marks > 0) fillCol = (Math.floor(T * 6) % 2) ? palette.danger : '#ff8a94';
      ctx.fillStyle = fillCol;
      ctx.fillRect(ix, iy, iw * (wild ? 1 : rage / 100), ih);
      if (rage >= redLow || wild) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ix, iy + ih / 2 - 0.75, iw * (wild ? 1 : rage / 100), 1.5);
      }
      // 刻度: 50 白、紅區下限紅 (上方伸出)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ix + iw * 0.5 - 1, BT, 2, BH);
      ctx.fillStyle = palette.danger;
      ctx.fillRect(ix + iw * redLow / 100 - 1.5, BT, 3, BH);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
      rrect(ctx, BL + 0.5, BT + 0.5, BW - 1, BH - 1, 3); ctx.stroke();
      // 失控標記 (0~4), 第 5 格 = 失控
      if (marks > 0 && !wild) {
        var mlp = ratio(s.markLeft, num(s.markDur, 4) || 4);
        for (var m = 0; m < 5; m++) {
          var mx = -36 + m * 18, my = -31;
          ctx.beginPath();
          ctx.moveTo(mx, my - 6); ctx.lineTo(mx + 6, my); ctx.lineTo(mx, my + 6); ctx.lineTo(mx - 6, my); ctx.closePath();
          ctx.fillStyle = '#0c0a12'; ctx.fill();
          if (m < marks) {
            ctx.save();
            if (m === marks - 1) {
              // 最新一顆: 填色高度 = 距下次自動 −1 的剩餘
              ctx.beginPath(); ctx.rect(mx - 7, my + 6 - 12 * mlp, 14, 12 * mlp); ctx.clip();
            }
            ctx.beginPath();
            ctx.moveTo(mx, my - 6); ctx.lineTo(mx + 6, my); ctx.lineTo(mx, my + 6); ctx.lineTo(mx - 6, my); ctx.closePath();
            ctx.fillStyle = palette.danger; ctx.fill();
            ctx.restore();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
          } else {
            ctx.strokeStyle = m === 4 ? palette.danger : 'rgba(255,255,255,0.35)'; ctx.lineWidth = m === 4 ? 2 : 1.5;
          }
          ctx.beginPath();
          ctx.moveTo(mx, my - 6); ctx.lineTo(mx + 6, my); ctx.lineTo(mx, my + 6); ctx.lineTo(mx - 6, my); ctx.closePath();
          ctx.stroke();
          if (m === 4) {
            ctx.strokeStyle = palette.danger; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(mx - 2.5, my - 2.5); ctx.lineTo(mx + 2.5, my + 2.5); ctx.moveTo(mx + 2.5, my - 2.5); ctx.lineTo(mx - 2.5, my + 2.5); ctx.stroke();
          }
        }
      }
      // Lv (右下角)
      txt(ctx, 'Lv' + lv, 48, 44, 14, palette.text, 'right');
      ctx.restore();
    },

    // ---------- 圍欄 100×16 ----------
    drawFence: function (ctx, state) {
      var s = S(state);
      var x = num(s.x), y = num(s.y);
      var broken = s.broken === true;
      ctx.save();
      ctx.translate(x, y);
      var wood = '#c08850', dark = '#5a3a1e';
      if (!broken) {
        ctx.fillStyle = dark; ctx.fillRect(-50, -5, 100, 4); ctx.fillRect(-50, 2, 100, 4);
        ctx.fillStyle = wood; ctx.fillRect(-50, -4, 100, 2); ctx.fillRect(-50, 3, 100, 2);
        for (var i = 0; i < 4; i++) {
          var px = -42 + i * 28;
          ctx.fillStyle = dark; ctx.fillRect(px - 4, -8, 8, 16);
          ctx.fillStyle = wood; ctx.fillRect(px - 2.5, -6.5, 5, 13);
        }
      } else {
        // 破損: 中段缺口 + 斷口鋸齒, 左右兩根柱子倒斜
        ctx.fillStyle = dark;
        ctx.beginPath(); ctx.moveTo(-50, -5); ctx.lineTo(-22, -5); ctx.lineTo(-16, -1); ctx.lineTo(-24, 1); ctx.lineTo(-50, 1); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(50, 2); ctx.lineTo(22, 2); ctx.lineTo(16, 5); ctx.lineTo(24, 7); ctx.lineTo(50, 7); ctx.closePath(); ctx.fill();
        ctx.fillStyle = wood;
        ctx.fillRect(-50, -4, 26, 2); ctx.fillRect(24, 3, 26, 2);
        ctx.save(); ctx.translate(-42, 0); ctx.rotate(-0.3);
        ctx.fillStyle = dark; ctx.fillRect(-4, -7, 8, 14); ctx.fillStyle = wood; ctx.fillRect(-2.5, -5.5, 5, 11); ctx.restore();
        ctx.save(); ctx.translate(42, 0); ctx.rotate(0.35);
        ctx.fillStyle = dark; ctx.fillRect(-4, -7, 8, 14); ctx.fillStyle = wood; ctx.fillRect(-2.5, -5.5, 5, 11); ctx.restore();
        // 碎木片
        ctx.fillStyle = wood;
        ctx.save(); ctx.translate(-6, 3); ctx.rotate(0.6); ctx.fillRect(-6, -1.5, 12, 3); ctx.restore();
        ctx.save(); ctx.translate(8, -3); ctx.rotate(-0.4); ctx.fillRect(-5, -1.5, 10, 3); ctx.restore();
      }
      ctx.restore();
    },

    // ---------- 觀眾 60×90 ----------
    drawVisitor: function (ctx, state) {
      var s = S(state);
      var x = num(s.x), y = num(s.y);
      var mode = oneOf(s.mode, ['watch', 'scared', 'empty'], 'watch');
      var top = s.side === 'top';
      var shirts = ['#5a8ad8', '#d8a03a', '#6ab87a', '#c070b0', '#d86a5a', '#7ac0c8'];
      var shirt = shirts[Math.abs(Math.round(x / 100)) % 6];
      var T = now();
      ctx.save();
      ctx.translate(x, y);
      // 座位
      ctx.fillStyle = '#4a3c58';
      rrect(ctx, -26, 22, 52, 18, 5); ctx.fill();
      ctx.fillStyle = '#5c4c6c';
      rrect(ctx, -26, 22, 52, 6, 3); ctx.fill();
      if (mode === 'empty') {
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
        circle(ctx, 0, -18, 12); ctx.stroke();
        rrect(ctx, -14, -4, 28, 26, 8); ctx.stroke(); ctx.setLineDash([]);
      } else if (mode === 'watch') {
        var hop = Math.abs(Math.sin(T * 3 + x * 0.05)) * 2;
        ctx.translate(0, -hop);
        ctx.fillStyle = shirt;
        rrect(ctx, -14, -4, 28, 28, 9); ctx.fill();
        // 舉手歡呼
        ctx.strokeStyle = shirt; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-20, -18); ctx.moveTo(12, 0); ctx.lineTo(20, -18); ctx.stroke();
        ctx.fillStyle = '#f0c8a0';
        circle(ctx, 0, -18, 12); ctx.fill();
        ctx.fillStyle = '#2a1a10';
        circle(ctx, -4, top ? -16 : -20, 2); ctx.fill(); circle(ctx, 4, top ? -16 : -20, 2); ctx.fill();
        ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, top ? -12 : -16, 4, 0.2, Math.PI - 0.2); ctx.stroke();
      } else {
        // 嚇跑: 傾斜逃開、臉色發白、頭上驚嘆
        ctx.rotate(-0.35);
        ctx.fillStyle = shirt; ctx.globalAlpha = 0.85;
        rrect(ctx, -12, -2, 24, 24, 8); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#e0e8f0';
        circle(ctx, 0, -16, 11); ctx.fill();
        ctx.fillStyle = '#2a1a10';
        circle(ctx, -4, -17, 2.5); ctx.fill(); circle(ctx, 4, -17, 2.5); ctx.fill();
        circle(ctx, 0, -10, 3); ctx.fill();
        ctx.rotate(0.35);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(14, -6); ctx.lineTo(26, -6); ctx.moveTo(14, 4); ctx.lineTo(24, 4); ctx.stroke();
        txt(ctx, '!', -16, -36, 18, '#ffffff', 'center', 'middle', '#3a1020');
      }
      ctx.restore();
    },

    // ---------- 商店項目 600×110 ----------
    drawShopItem: function (ctx, state) {
      var s = S(state);
      var x = num(s.x), y = num(s.y);
      var item = oneOf(s.item, ['club', 'sword', 'spear', 'whip', 'attack', 'armor', 'ropeBag'], 'club');
      var isW = WEAPON[item] !== undefined;
      var owned = s.owned === true || item === 'club';
      var eq = s.equipped === true;
      var ok = s.affordable === true;
      var sel = s.selected === true;
      var names = { club: '棍棒', sword: '劍', spear: '長槍', whip: '長鞭', attack: '攻擊力 +1', armor: '護甲 心 +1', ropeBag: '繩袋 捕獸繩 +1' };
      var descs = { club: 'Z 敲擊 X 無', sword: 'Z 斬擊可打回飛彈 X 擊暈', spear: 'Z 長刺 X 突進', whip: 'Z 整圈抽打 X 擊飛', attack: '傷害 +1', armor: '地下城的心 +1', ropeBag: '每天捕獸繩 +1' };
      var L = x - 300, T = y - 55;
      ctx.save();
      ctx.fillStyle = eq ? '#1e3a36' : palette.panel;
      rrect(ctx, L + 3, T + 3, 594, 104, 14); ctx.fill();
      // 圖示
      ctx.fillStyle = palette.panelHi;
      rrect(ctx, L + 14, T + 14, 82, 82, 12); ctx.fill();
      ctx.save(); ctx.translate(L + 55, T + 55);
      if (isW) {
        // 借用馴獸師武器畫法 (面向右)
        ctx.scale(1.6, 1.6); ctx.translate(-14, -14);
        ctx.rotate(0);
        var w = item;
        ctx.lineCap = 'round';
        if (w === 'club') { ctx.strokeStyle = '#3a2414'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(4, 14); ctx.lineTo(26, 18); ctx.stroke(); ctx.strokeStyle = '#a86e3a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(4, 14); ctx.lineTo(26, 18); ctx.stroke(); }
        else if (w === 'sword') { ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(4, 14); ctx.lineTo(28, 14); ctx.stroke(); ctx.strokeStyle = '#e4ecf4'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(8, 14); ctx.lineTo(28, 14); ctx.stroke(); ctx.strokeStyle = '#c89a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(8, 9); ctx.lineTo(8, 19); ctx.stroke(); }
        else if (w === 'spear') { ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-2, 14); ctx.lineTo(24, 14); ctx.stroke(); ctx.fillStyle = '#e4ecf4'; ctx.beginPath(); ctx.moveTo(31, 14); ctx.lineTo(23, 10); ctx.lineTo(23, 18); ctx.closePath(); ctx.fill(); }
        else { ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(2, 14); ctx.bezierCurveTo(18, 30, 30, 0, 22, 24); ctx.stroke(); ctx.fillStyle = '#3a2414'; rrect(ctx, 0, 11, 9, 6, 2); ctx.fill(); }
      } else if (item === 'attack') {
        ctx.fillStyle = '#ffb43a';
        ctx.beginPath(); ctx.moveTo(-6, -26); ctx.lineTo(10, -26); ctx.lineTo(2, -4); ctx.lineTo(14, -4); ctx.lineTo(-8, 26); ctx.lineTo(-2, 4); ctx.lineTo(-14, 4); ctx.closePath(); ctx.fill();
      } else if (item === 'armor') {
        ctx.fillStyle = '#ff7a8a'; ctx.strokeStyle = '#3a1020'; ctx.lineWidth = 3;
        heart(ctx, 0, 0, 24); ctx.fill(); ctx.stroke();
      } else {
        ctx.strokeStyle = palette.rope; ctx.lineWidth = 5;
        circle(ctx, 0, 0, 20); ctx.stroke(); circle(ctx, 0, 0, 12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(18, 8); ctx.quadraticCurveTo(30, 20, 22, 30); ctx.stroke();
      }
      ctx.restore();
      txt(ctx, names[item], L + 116, T + 36, 26, palette.text, 'left');
      txt(ctx, descs[item], L + 116, T + 76, 19, palette.textDim, 'left');
      // 右側: 價格 / 已擁有 / 裝備中 / 已買次數
      var RX = L + 576;
      if (isW && owned) {
        txt(ctx, '已擁有', RX, T + 36, 22, palette.textDim, 'right');
      } else {
        txt(ctx, Math.round(num(s.cost)) + ' 金', RX, T + 36, 26, ok ? palette.gold : '#c87a7a', 'right');
      }
      if (eq) {
        ctx.fillStyle = palette.player;
        rrect(ctx, RX - 96, T + 60, 96, 32, 16); ctx.fill();
        txt(ctx, '裝備中', RX - 48, T + 76, 19, '#0c2a26', 'center', 'middle', false);
      } else if (!isW && num(s.level) > 0) {
        txt(ctx, '已買 ' + Math.round(num(s.level)) + ' 次', RX, T + 78, 18, palette.textDim, 'right');
      }
      ctx.lineWidth = sel ? 6 : (eq ? 3 : 2);
      ctx.strokeStyle = sel ? palette.cursor : (eq ? palette.player : palette.line);
      rrect(ctx, L + 3, T + 3, 594, 104, 14); ctx.stroke();
      ctx.restore();
    },

    // ---------- 按鈕 (x,y = 左上角) ----------
    drawButton: function (ctx, state) {
      var s = S(state);
      var x = num(s.x), y = num(s.y), w = Math.max(0, num(s.w, 400)), h = Math.max(0, num(s.h, 100));
      var sel = s.selected === true;
      ctx.save();
      ctx.fillStyle = sel ? palette.cursor : palette.panel;
      rrect(ctx, x + 3, y + 3, w - 6, h - 6, 16); ctx.fill();
      ctx.lineWidth = sel ? 5 : 3;
      ctx.strokeStyle = sel ? '#ffffff' : '#8a80a8';
      rrect(ctx, x + 3, y + 3, w - 6, h - 6, 16); ctx.stroke();
      var px = Math.max(16, Math.min(34, h * 0.36));
      txt(ctx, str(s.label), x + w / 2, y + h / 2, px, sel ? '#1e1828' : palette.text, 'center', 'middle', sel ? false : undefined);
      if (sel) {
        ctx.fillStyle = '#1e1828';
        var tw = Math.min(w / 2 - 14, str(s.label).length * px * 0.55 + 22);
        arrowHead(ctx, x + w / 2 - tw, y + h / 2, 0, 9); ctx.fill();
      }
      ctx.restore();
    },

    // ---------- 飄字 ----------
    drawFloatText: function (ctx, state) {
      var s = S(state);
      var x = num(s.x), y = num(s.y);
      var kind = oneOf(s.kind, ['gold', 'redGold', 'chain', 'repDown', 'capture', 'levelUp', 'coin20'], 'gold');
      var p = ratio(s.t, num(s.dur, 1) || 1);
      if (num(s.t) >= num(s.dur, 1) && num(s.dur, 1) > 0) return;
      var cfg = {
        gold: { c: palette.gold, px: 24, o: '#3a2a00' },
        coin20: { c: palette.gold, px: 26, o: '#3a2a00' },
        redGold: { c: palette.gold, px: 30, o: '#7a0a14' },
        chain: { c: '#ff9af0', px: 30, o: '#3a0a34' },
        repDown: { c: '#c8b8e0', px: 24, o: '#1a1026' },
        capture: { c: palette.player, px: 32, o: '#0c2a26' },
        levelUp: { c: '#a8f07a', px: 26, o: '#1a3a10' }
      }[kind];
      var rise = kind === 'repDown' ? p * 26 : -p * 42;
      var pop = p < 0.15 ? 0.7 + p * 2 : 1;
      ctx.save();
      ctx.globalAlpha = p > 0.6 ? 1 - (p - 0.6) / 0.4 : 1;
      ctx.translate(x, y + rise);
      ctx.scale(pop, pop);
      var label = str(s.text);
      if (kind === 'capture') {
        // 打勾
        ctx.strokeStyle = '#0c2a26'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.font = font(cfg.px);
        var w = ctx.measureText(label).width;
        var cx = -w / 2 - 22;
        ctx.beginPath(); ctx.moveTo(cx - 10, 0); ctx.lineTo(cx - 3, 8); ctx.lineTo(cx + 10, -10); ctx.stroke();
        ctx.strokeStyle = palette.player; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(cx - 10, 0); ctx.lineTo(cx - 3, 8); ctx.lineTo(cx + 10, -10); ctx.stroke();
        txt(ctx, label, 6, 0, cfg.px, cfg.c, 'center', 'middle', cfg.o);
      } else {
        if (kind === 'redGold') {
          ctx.font = font(cfg.px);
          var ww = ctx.measureText(label).width;
          ctx.fillStyle = 'rgba(122,10,20,0.85)';
          rrect(ctx, -ww / 2 - 10, -cfg.px * 0.7, ww + 20, cfg.px * 1.4, 8); ctx.fill();
          ctx.strokeStyle = palette.danger; ctx.lineWidth = 2.5;
          rrect(ctx, -ww / 2 - 10, -cfg.px * 0.7, ww + 20, cfg.px * 1.4, 8); ctx.stroke();
        }
        txt(ctx, label, 0, 0, cfg.px, cfg.c, 'center', 'middle', cfg.o);
      }
      ctx.restore();
    },

    // ---------- 結算 ----------
    drawResultPanel: function (ctx, state) {
      var s = S(state);
      var stars = clamp(Math.round(num(s.stars)), 0, 3);
      var roster = Array.isArray(s.roster) ? s.roster : [];
      ctx.save();
      ctx.fillStyle = 'rgba(10,8,16,0.85)'; ctx.fillRect(0, 120, 720, 1160);
      ctx.fillStyle = palette.panel;
      rrect(ctx, 40, 150, 640, 1080, 24); ctx.fill();
      ctx.strokeStyle = '#8a80a8'; ctx.lineWidth = 3;
      rrect(ctx, 41.5, 151.5, 637, 1077, 23); ctx.stroke();
      txt(ctx, '七天巡演結束', 360, 220, 40, palette.text);
      var th = [250, 550, 900];
      for (var i = 0; i < 3; i++) {
        var sx = 220 + i * 140;
        ctx.fillStyle = i < stars ? palette.gold : '#3a3448';
        ctx.strokeStyle = i < stars ? '#7a5a00' : '#5a5270'; ctx.lineWidth = 4;
        star(ctx, sx, 340, 52, 0.45); ctx.fill(); ctx.stroke();
        txt(ctx, '名聲 ' + th[i], sx, 420, 18, i < stars ? palette.gold : palette.textDim);
      }
      var rows = [['總名聲', String(Math.round(num(s.rep))), palette.rep], ['累計金幣', String(Math.round(num(s.goldEarned))), palette.gold], ['最長連鎖', String(Math.round(num(s.bestChain))) + ' 段', '#ff9af0']];
      for (var r = 0; r < 3; r++) {
        var ry = 490 + r * 90;
        ctx.fillStyle = palette.panelHi;
        rrect(ctx, 80, ry, 560, 74, 12); ctx.fill();
        txt(ctx, rows[r][0], 110, ry + 37, 26, palette.textDim, 'left');
        txt(ctx, rows[r][1], 610, ry + 37, 36, rows[r][2], 'right');
      }
      txt(ctx, '陣容', 360, 790, 24, palette.textDim);
      var n = Math.min(roster.length, 6);
      for (var k = 0; k < n; k++) {
        var it = (roster[k] && typeof roster[k] === 'object') ? roster[k] : {};
        var col = k % 3, row = Math.floor(k / 3);
        var cx = 160 + col * 200, cy = 870 + row * 140;
        ctx.save(); ctx.translate(cx, cy);
        monsterBody(ctx, it.species, 34, {});
        ctx.restore();
        txt(ctx, SPECIES[sp(it.species)].name + ' Lv' + clamp(Math.round(num(it.level)), 0, 3), cx, cy + 56, 20, palette.text);
      }
      ctx.fillStyle = palette.cursor;
      rrect(ctx, 210, 1140, 300, 64, 32); ctx.fill();
      txt(ctx, '按 Z 重來', 360, 1172, 28, '#1e1828', 'center', 'middle', false);
      ctx.restore();
    },

    // ---------- HUD (0~120) ----------
    drawHud: function (ctx, state) {
      var s = S(state);
      var phase = oneOf(s.phase, ['guide', 'select', 'dungeon', 'setup1', 'setup2', 'show', 'shop', 'result'], 'select');
      ctx.save();
      ctx.fillStyle = palette.hudBg; ctx.fillRect(0, 0, 720, 120);
      ctx.fillStyle = '#2e2840'; ctx.fillRect(0, 118, 720, 2);
      if (phase !== 'guide') {
        var day = Math.round(num(s.day, 1)), dmax = Math.round(num(s.dayMax, 7));
        var dn = (s.dungeon && DUN[s.dungeon]) ? DUN[s.dungeon].name : '';
        txt(ctx, '第 ' + day + '/' + dmax + ' 天', 16, 30, 24, palette.text, 'left');
        if (dn) txt(ctx, dn, 148, 30, 20, palette.textDim, 'left');
        // 金幣
        ctx.fillStyle = palette.gold; ctx.strokeStyle = '#5a4000'; ctx.lineWidth = 2.5;
        circle(ctx, 318, 30, 12); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#5a4000'; ctx.fillRect(316, 23, 4, 14);
        txt(ctx, String(Math.round(num(s.gold))), 338, 31, 28, palette.gold, 'left');
        // 名聲
        ctx.fillStyle = palette.rep; ctx.strokeStyle = '#4a1a40'; ctx.lineWidth = 2.5;
        star(ctx, 460, 30, 14, 0.48); ctx.fill(); ctx.stroke();
        txt(ctx, String(Math.round(num(s.rep))), 480, 31, 28, palette.rep, 'left');
        // 計時
        var tmax = num(s.timeMax);
        if (tmax > 0) {
          var tl = Math.max(0, num(s.timeLeft));
          var urgent = tl <= 10;
          txt(ctx, String(Math.ceil(tl)), 704, 32, 36, urgent ? '#ff8a8a' : palette.text, 'right');
          // 一圈 = 這一秒
          var frac = tl - Math.floor(tl);
          ctx.strokeStyle = '#2e2840'; ctx.lineWidth = 4; circle(ctx, 630, 30, 11); ctx.stroke();
          ctx.strokeStyle = urgent ? '#ff8a8a' : palette.textDim; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(630, 30, 11, -Math.PI / 2, -Math.PI / 2 + TAU * (tl > 0 ? (frac || 1) : 0)); ctx.stroke();
        }
        if (phase === 'dungeon') {
          var hearts = Math.max(0, Math.round(num(s.hearts))), mh = Math.max(0, Math.min(14, Math.round(num(s.maxHearts, 5))));
          for (var i = 0; i < mh; i++) {
            ctx.fillStyle = i < hearts ? '#ff6a7a' : '#3a2a3a';
            ctx.strokeStyle = '#1a0a10'; ctx.lineWidth = 2;
            heart(ctx, 28 + i * 24, 72, 10); ctx.fill(); ctx.stroke();
          }
          var rx0 = 28 + mh * 24 + 18;
          var ropes = Math.max(0, Math.round(num(s.ropes))), rm = Math.max(0, Math.min(10, Math.round(num(s.ropeMax, 3))));
          for (var j = 0; j < rm; j++) {
            ctx.strokeStyle = j < ropes ? palette.rope : '#3a3040'; ctx.lineWidth = 3.5;
            circle(ctx, rx0 + j * 22, 72, 7); ctx.stroke();
          }
          // 武器 + X 冷卻
          var wn = WEAPON[weap(s.weapon)];
          txt(ctx, wn, 600, 72, 22, palette.text, 'right');
          var xm = num(s.xCdMax), xl = Math.max(0, num(s.xCdLeft));
          ctx.fillStyle = '#2a2436'; rrect(ctx, 612, 54, 92, 36, 8); ctx.fill();
          if (xm > 0) {
            var ready = xl <= 0;
            ctx.fillStyle = ready ? palette.player : '#4a4458';
            rrect(ctx, 612, 54, 92 * (ready ? 1 : clamp(1 - xl / xm, 0, 1)), 36, 8); ctx.fill();
            txt(ctx, 'X', 658, 72, 22, ready ? '#0c2a26' : palette.textDim, 'center', 'middle', ready ? false : undefined);
          } else {
            txt(ctx, 'X 無', 658, 72, 18, '#6a6278', 'center', 'middle', false);
          }
        }
      }
      var msg = str(s.message);
      if (msg) txt(ctx, msg, 360, 103, 21, '#ffe9a0', 'center', 'middle');
      ctx.restore();
    },

    // ---------- 說明頁 (page 0~4), 依介面「文字歸屬」連同文字一起畫 ----------
    drawGuidePage: function (ctx, state) {
      var s = S(state);
      var page = clamp(Math.round(num(s.page)), 0, 4);
      var bx = num(s.x), byy = num(s.y), bw = Math.max(1, num(s.w, 720)), bh = Math.max(1, num(s.h, 1280));
      var sc = Math.min(bw / 720, bh / 1280);
      ctx.save();
      ctx.beginPath(); ctx.rect(bx, byy, bw, bh); ctx.clip();
      ctx.translate(bx + (bw - 720 * sc) / 2, byy + (bh - 1280 * sc) / 2);
      ctx.scale(sc, sc);
      // 虛擬 720×1280 版面: 標題 150~210, 圖 230~1010, 文字 1070, 頁尾 1200
      ctx.fillStyle = palette.bg; ctx.fillRect(0, 120, 720, 1160);
      var titles = ['地下城', '收服', '擺球', '紅區', '目標'];
      var lines = ['方向鍵走, Z 攻擊, X 武器技', '殘血時站上去, 再繞牠一圈', '開演前擺球, 開演後只能看', '紅區最賺, 標記滿 5 個就失控', '7 天內賺到越多名聲越好'];
      txt(ctx, (page + 1) + '. ' + titles[page], 360, 175, 44, palette.text);
      ctx.fillStyle = '#1c1826';
      rrect(ctx, 20, 230, 680, 790, 20); ctx.fill();
      ctx.save();
      rrect(ctx, 20, 230, 680, 790, 20); ctx.clip();
      guideFigure[page](ctx);
      ctx.restore();
      ctx.strokeStyle = palette.line; ctx.lineWidth = 2;
      rrect(ctx, 21, 231, 678, 788, 19); ctx.stroke();
      txt(ctx, lines[page], 360, 1080, 32, '#ffe9a0');
      // 頁碼點 + 繼續提示
      for (var i = 0; i < 5; i++) {
        ctx.fillStyle = i === page ? palette.text : '#4a4260';
        circle(ctx, 300 + i * 30, 1150, i === page ? 8 : 6); ctx.fill();
      }
      txt(ctx, page === 4 ? '按 Z 開始' : '按 Z 繼續', 360, 1210, 24, palette.textDim);
      ctx.restore();
    }
  };

  // ---------- 說明頁示意圖 (虛擬座標 20~700 × 230~1020) ----------
  function label(ctx, s, x, y, c) { txt(ctx, s, x, y, 22, c || palette.text, 'center', 'middle'); }
  function dashArrow(ctx, pts, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.setLineDash([12, 9]); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    if (pts.length === 3) ctx.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]);
    else ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.stroke(); ctx.setLineDash([]);
    var a = pts[pts.length - 1], b = pts[pts.length - 2];
    ctx.fillStyle = color;
    arrowHead(ctx, a[0], a[1], Math.atan2(a[1] - b[1], a[0] - b[0]), 14); ctx.fill();
    ctx.restore();
  }
  function bigArrow(ctx, x1, y1, x2, y2, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.fillStyle = color;
    arrowHead(ctx, x2, y2, Math.atan2(y2 - y1, x2 - x1), 18); ctx.fill();
    ctx.restore();
  }
  function cross(ctx, x, y, r) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a0a10'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); ctx.stroke();
    ctx.strokeStyle = palette.danger; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); ctx.stroke();
    ctx.restore();
  }
  var guideFigure = [
    // 第 1 頁: 地下城一角
    function (ctx) {
      var A = Art;
      // 10×9 格洞窟 (x 60~660, y 250~790)
      var map = [
        '##########',
        '#........#',
        '#..L.....#',
        '#........#',
        '#........#',
        '#........#',
        '#.....L..#',
        '#........#',
        '##########'
      ];
      for (var r = 0; r < 9; r++) for (var c = 0; c < 10; c++) {
        var ch = map[r][c];
        A.drawTile(ctx, { x: 60 + c * 60 + 30, y: 250 + r * 60 + 30, dungeon: 'cave', kind: ch === '#' ? 'wall' : ch === 'L' ? 'lava' : 'floor', room: 'top', nest: false });
      }
      // 火圈預警 (另一隻火蜥蜴施法中), 中心 (450, 610)
      A.drawHazard(ctx, { x: 450, y: 610, kind: 'firering', phase: 'warn', radius: 120, t: 0.3, dur: 0.5 });
      A.drawWildMonster(ctx, { x: 450, y: 610, species: 'fire', hp: 10, maxHp: 10, casting: true, dir: -1 });
      // 馴獸師朝右敲中火蜥蜴
      A.drawWeaponFx(ctx, { x: 230, y: 400, weapon: 'club', move: 'normal', shape: 'arc', angle: 0, spread: 100 * Math.PI / 180, radius: 70, t: 0.08, dur: 0.2 });
      A.drawWildMonster(ctx, { x: 285, y: 400, species: 'fire', hp: 6, maxHp: 10, hit: true, dir: -1 });
      A.drawTamer(ctx, { x: 230, y: 400, facing: 2, weapon: 'club' });
      label(ctx, '你', 230, 360, palette.player);
      // 移動箭頭繞開火圈
      dashArrow(ctx, [[220, 440], [210, 760], [600, 760]], palette.player);
      label(ctx, '火圈: 預警時躲開', 450, 455, '#ffd0c0');
      // 鍵帽
      ctx.fillStyle = 'rgba(10,8,16,0.85)';
      rrect(ctx, 40, 830, 640, 170, 18); ctx.fill();
      keycap(ctx, 110, 900, '↑', 44); keycap(ctx, 62, 950, '←', 44); keycap(ctx, 110, 950, '↓', 44); keycap(ctx, 158, 950, '→', 44);
      label(ctx, '走', 220, 925);
      keycap(ctx, 360, 925, 'Z', 60); label(ctx, '攻擊', 360, 980);
      keycap(ctx, 560, 925, 'X', 60); label(ctx, '武器技', 560, 980);
    },
    // 第 2 頁: 收服 (左: 準備捕捉 / 右: 套索繞圈)
    function (ctx) {
      var A = Art;
      ctx.fillStyle = '#2a2438';
      rrect(ctx, 36, 260, 316, 540, 16); ctx.fill();
      rrect(ctx, 368, 260, 316, 540, 16); ctx.fill();
      label(ctx, '① 站上去', 194, 295, '#ffe9a0');
      label(ctx, '② 繞一圈', 526, 295, '#ffe9a0');
      // 左: 馴獸師站在殘血水母身上, 準備捕捉一半
      A.drawWildMonster(ctx, { x: 194, y: 520, species: 'water', hp: 2, maxHp: 7, weak: true, dir: 1 });
      A.drawTamer(ctx, { x: 200, y: 530, facing: 0, weapon: 'club' });
      A.drawCaptureRing(ctx, { x: 194, y: 520, t: 0.4, dur: 0.8 });
      label(ctx, '殘血', 120, 420, '#ffb0c0');
      // 右: 套索中, 暈眩, 繞圈一半
      var mx = 526, my = 540;
      A.drawWildMonster(ctx, { x: mx, y: my, species: 'water', hp: 2, maxHp: 7, weak: true, lassoed: true, dir: -1 });
      var tx = mx - 120, ty = my + 40;
      A.drawLasso(ctx, { x1: tx, y1: ty, x2: mx, y2: my, progress: 0.5, t: 2, limit: 5, len: 126, maxLen: 220 });
      A.drawTamer(ctx, { x: tx, y: ty, facing: 1, weapon: 'club', lassoing: true });
      // 繞行路線箭頭
      ctx.save();
      ctx.strokeStyle = 'rgba(255,233,160,0.85)'; ctx.lineWidth = 4; ctx.setLineDash([12, 9]);
      ctx.beginPath(); ctx.arc(mx, my, 126, Math.PI * 0.9, Math.PI * 2.4); ctx.stroke(); ctx.setLineDash([]);
      var ea = Math.PI * 2.4;
      ctx.fillStyle = 'rgba(255,233,160,0.95)';
      arrowHead(ctx, mx + Math.cos(ea) * 126, my + Math.sin(ea) * 126, ea + Math.PI / 2, 14); ctx.fill();
      ctx.restore();
      // 角落: 收服! 飄字
      ctx.fillStyle = 'rgba(10,8,16,0.85)';
      rrect(ctx, 220, 840, 280, 140, 18); ctx.fill();
      A.drawFloatText(ctx, { x: 360, y: 920, text: '收服!', kind: 'capture', t: 0.3, dur: 1 });
    },
    // 第 3 頁: 擺球
    function (ctx) {
      var A = Art;
      // 上: 布置畫面縮圖 (表演場 x60~660, y270~990 → 縮 0.5)
      ctx.save();
      ctx.translate(40, 250);
      ctx.scale(0.5, 0.5);
      ctx.translate(-60, -270);
      ctx.save(); ctx.beginPath(); ctx.rect(60, 270, 600, 720); ctx.clip();
      A.drawShowArena(ctx);
      ctx.restore();
      for (var r = 0; r < 4; r++) for (var c = 0; c < 3; c++) {
        A.drawSetupCell(ctx, { x: 160 + 200 * c, y: 360 + 180 * r, selected: r === 2 && c === 1 });
      }
      A.drawShowMonster(ctx, { x: 160, y: 360, species: 'fire', level: 0, rage: 60, redLow: 80, marks: 0, markLeft: 0, markDur: 4, mode: 'roam', fx: 'none', dir: 1 });
      A.drawShowMonster(ctx, { x: 560, y: 720, species: 'water', level: 0, rage: 60, redLow: 80, marks: 0, markLeft: 0, markDur: 4, mode: 'roam', fx: 'none', dir: -1 });
      A.drawToyBall(ctx, { x: 360, y: 360, kind: 'hot' });
      A.drawToyBall(ctx, { x: 160, y: 900, kind: 'cold' });
      A.drawButton(ctx, { x: 480, y: 1010, w: 180, h: 100, label: '開演', selected: false });
      ctx.restore();
      // 選擇面板 (縮 0.62, 貼在游標格右側)
      ctx.save();
      ctx.translate(372, 262);
      ctx.scale(0.62, 0.62);
      ctx.translate(-120, -240);
      A.drawPickerPanel(ctx, { index: 1, options: [
        { type: 'monster', key: 'water', name: '水母', cost: 0, desc: '', affordable: true },
        { type: 'ball', key: 'hot', name: '火辣球', cost: 10, desc: '滾去撞到誰, 誰就生氣', affordable: true },
        { type: 'ball', key: 'cold', name: '冰涼球', cost: 10, desc: '滾去撞到誰, 誰就冷靜', affordable: true },
        { type: 'ball', key: 'bell', name: '鈴鐺球', cost: 15, desc: '滾去撞到誰, 誰就立刻表演', affordable: true },
        { type: 'ball', key: 'yarn', name: '毛線球', cost: 15, desc: '滾動時附近的魔物都會追它', affordable: true },
        { type: 'clear', key: 'clear', name: '清空', cost: 0, desc: '', affordable: true }
      ] });
      ctx.restore();
      // 游標格 → 面板 的連線
      ctx.save();
      ctx.strokeStyle = palette.cursor; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(240, 475); ctx.lineTo(372, 475); ctx.stroke();
      ctx.restore();
      // 下: 開演後 (縮 0.6)
      ctx.fillStyle = '#2e2440';
      rrect(ctx, 40, 820, 640, 180, 14); ctx.fill();
      label(ctx, '開演後', 100, 850, '#ffe9a0');
      bigArrow(ctx, 80, 870, 80, 950, '#ffe9a0');
      ctx.save();
      ctx.translate(0, 0);
      // 縮 0.7: 火蜥蜴 (170,930) 剛踢出火辣球 (250), 水母 (420) — 球到水母 170/0.7 ≈ 243 遊戲像素 < 340
      ctx.save(); ctx.translate(170, 930); ctx.scale(0.7, 0.7); ctx.translate(-170, -930);
      A.drawShowMonster(ctx, { x: 170, y: 930, species: 'fire', level: 0, rage: 62, redLow: 80, marks: 0, markLeft: 0, markDur: 4, mode: 'roam', fx: 'none', dir: 1 });
      ctx.restore();
      ctx.save(); ctx.translate(420, 930); ctx.scale(0.7, 0.7); ctx.translate(-420, -930);
      A.drawShowMonster(ctx, { x: 420, y: 930, species: 'water', level: 0, rage: 55, redLow: 80, marks: 0, markLeft: 0, markDur: 4, mode: 'roam', fx: 'none', dir: -1 });
      ctx.restore();
      dashArrow(ctx, [[270, 935], [385, 935]], BALL.hot.c);
      ctx.save(); ctx.translate(250, 935); ctx.scale(0.7, 0.7); ctx.translate(-250, -935);
      A.drawToyBall(ctx, { x: 250, y: 935, kind: 'hot', rolling: true, angle: 0 });
      ctx.restore();
      label(ctx, '踢!', 210, 880, BALL.hot.c);
      ctx.restore();
    },
    // 第 4 頁: 紅區與失控
    function (ctx) {
      var A = Art;
      // 上: 紅區表演 ×2
      ctx.fillStyle = '#2e2440';
      rrect(ctx, 40, 250, 640, 330, 16); ctx.fill();
      ctx.save(); ctx.translate(250, 440); ctx.scale(1.8, 1.8); ctx.translate(-250, -440);
      A.drawShowMonster(ctx, { x: 250, y: 440, species: 'fire', level: 0, rage: 88, redLow: 80, marks: 0, markLeft: 0, markDur: 4, mode: 'roam', performing: true, performT: 0.2, performDur: 0.5, fx: 'none', dir: 1 });
      ctx.restore();
      label(ctx, '紅區', 336, 318, '#ff8a94');
      ctx.save(); ctx.strokeStyle = '#ff8a94'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(310, 330); ctx.lineTo(310, 343); ctx.stroke(); ctx.restore();
      A.drawFloatText(ctx, { x: 500, y: 420, text: '+4 ×2', kind: 'redGold', t: 0.2, dur: 1 });
      // 下: 4 個標記 → 衝撞圍欄
      ctx.fillStyle = '#2e2440';
      rrect(ctx, 40, 610, 640, 390, 16); ctx.fill();
      ctx.save(); ctx.translate(170, 830); ctx.scale(1.6, 1.6); ctx.translate(-170, -830);
      A.drawShowMonster(ctx, { x: 170, y: 830, species: 'fire', level: 0, rage: 100, redLow: 80, marks: 4, markLeft: 3, markDur: 4, mode: 'roam', fx: 'none', dir: 1 });
      ctx.restore();
      label(ctx, '標記 4 個', 170, 950, '#ff8a94');
      bigArrow(ctx, 275, 820, 380, 820, '#ffe9a0');
      label(ctx, '再 +1', 328, 785, '#ffe9a0');
      // 右: 觀眾席 + 圍欄, 魔物撞上去
      ctx.fillStyle = '#2a2134'; ctx.fillRect(420, 640, 260, 90);
      A.drawVisitor(ctx, { x: 490, y: 680, side: 'top', mode: 'scared' });
      A.drawVisitor(ctx, { x: 600, y: 680, side: 'top', mode: 'watch' });
      A.drawFence(ctx, { x: 490, y: 745, side: 'top', broken: false });
      A.drawFence(ctx, { x: 590, y: 745, side: 'top', broken: false });
      ctx.save(); ctx.translate(540, 830); ctx.scale(1.3, 1.3); ctx.translate(-540, -830);
      A.drawShowMonster(ctx, { x: 540, y: 830, species: 'fire', level: 0, rage: 100, redLow: 80, marks: 0, markLeft: 0, markDur: 4, mode: 'charge', chargeT: 0.6, chargeDur: 1.5, fx: 'none', dir: 1 });
      ctx.restore();
      cross(ctx, 640, 920, 26);
      label(ctx, '失控', 540, 960, '#ff8a94');
    },
    // 第 5 頁: 一天的循環 ×7 → 結算
    function (ctx) {
      var cx = 300, cy = 560, R = 190;
      var nodes = ['地下城', '布置', '表演', '商店'];
      var pos = [[cx, cy - R], [cx + R, cy], [cx, cy + R], [cx - R, cy]];
      ctx.save();
      ctx.strokeStyle = 'rgba(255,233,160,0.7)'; ctx.lineWidth = 6;
      for (var i = 0; i < 4; i++) {
        var a0 = -Math.PI / 2 + i * Math.PI / 2 + 0.38, a1 = -Math.PI / 2 + (i + 1) * Math.PI / 2 - 0.38;
        ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1); ctx.stroke();
        ctx.fillStyle = 'rgba(255,233,160,0.9)';
        arrowHead(ctx, cx + Math.cos(a1) * R, cy + Math.sin(a1) * R, a1 + Math.PI / 2, 16); ctx.fill();
      }
      ctx.restore();
      for (var k = 0; k < 4; k++) {
        ctx.fillStyle = k === 2 ? '#3a2a50' : palette.panelHi;
        rrect(ctx, pos[k][0] - 70, pos[k][1] - 36, 140, 72, 16); ctx.fill();
        ctx.strokeStyle = k === 2 ? palette.rep : '#8a80a8'; ctx.lineWidth = 3;
        rrect(ctx, pos[k][0] - 70, pos[k][1] - 36, 140, 72, 16); ctx.stroke();
        label(ctx, nodes[k], pos[k][0], pos[k][1]);
      }
      txt(ctx, '×7 天', cx, cy, 48, '#ffe9a0');
      // 表演旁: 名聲星往上加
      for (var j = 0; j < 3; j++) {
        ctx.fillStyle = palette.rep; ctx.globalAlpha = 1 - j * 0.25;
        star(ctx, cx + 110 + j * 18, cy + R - 20 - j * 34, 14, 0.48); ctx.fill();
      }
      ctx.globalAlpha = 1;
      label(ctx, '+名聲', cx + 160, cy + R + 30, palette.rep);
      // 終點: 結算星數
      bigArrow(ctx, cx + R + 20, cy + 90, 560, 300 + 520, '#ffe9a0');
      ctx.fillStyle = palette.panelHi;
      rrect(ctx, 440, 840, 240, 150, 16); ctx.fill();
      label(ctx, '結算', 560, 870);
      for (var s2 = 0; s2 < 3; s2++) {
        ctx.fillStyle = palette.gold; ctx.strokeStyle = '#7a5a00'; ctx.lineWidth = 3;
        star(ctx, 500 + s2 * 60, 940, 24, 0.45); ctx.fill(); ctx.stroke();
      }
    }
  ];

  if (typeof window !== 'undefined') window.Art = Art;
  else if (typeof globalThis !== 'undefined') globalThis.Art = Art;
})();
