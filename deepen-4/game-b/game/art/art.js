// 後台燈控怪獸秀 — 美術(全部 Canvas 2D 幾何繪製, 無外部資源)
// 全域物件 window.Art; 每個函式自己 save / restore
(function () {
  'use strict';

  var F = '"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';
  var TAU = Math.PI * 2;

  // ---------- 色票 ----------
  var P = {
    bg: '#17121f', bg2: '#221a2e', ink: '#120d18',
    text: '#f4eee2', textDim: '#a99fb8',
    panel: '#2a2236', panel2: '#352b44', frame: '#4a3f5c',
    select: '#ffe27a',
    player: '#f6ead0', playerHat: '#2c3a66', playerFx: '#fff6dc', playerSkill: '#ffd75e',
    rope: '#d9a05b',
    danger: '#ff4a4a', dangerDark: '#5a1620',
    ignite: '#ff8a3d', calm: '#7fd0ff', move: '#c9b8f0',
    gold: '#ffc83d', rep: '#ffe9a8', heart: '#ff6b81', ok: '#6be08a',
    lowPower: '#7a7286', light: '#fff3c4',
    rageLow: '#bdb4cc', rageShow: '#ffc04a', rageRed: '#ff5a4a',
    cat: '#f2d03a', turtle: '#4cc35a', boar: '#e2463c', monkey: '#3cc8d2', fox: '#4a6cf0', owl: '#c47cf2',
    arenaFloor: '#4a3428', stands: '#2b1f33', fence: '#b98a55'
  };

  var SP = {
    cat: { name: '炸毛貓', c: P.cat, d: '#9c7f14', kind: 'ignite', hz: 'claw' },
    turtle: { name: '泡泡龜', c: P.turtle, d: '#2a7a35', kind: 'douse', hz: 'bubble' },
    boar: { name: '熔岩豬', c: P.boar, d: '#8e2620', kind: 'ignite', hz: 'lava' },
    monkey: { name: '溫泉猴', c: P.monkey, d: '#1f7f86', kind: 'douse', hz: 'splash' },
    fox: { name: '流星狐', c: P.fox, d: '#283f9c', kind: 'ignite', hz: 'beam' },
    owl: { name: '月光鴞', c: P.owl, d: '#6b2f93', kind: 'douse', hz: 'sleepwave' }
  };
  var HZ_SP = { claw: 'cat', bubble: 'turtle', lava: 'boar', splash: 'monkey', beam: 'fox', sleepwave: 'owl' };

  var DEV = {
    spotlight: { name: '聚光燈', cat: '激怒', desc: '按住照亮, 照著的越來越氣, 表演更賺', cost: '按住每秒 30 電', hold: true, need: 0 },
    mist: { name: '冷霧', cat: '冷靜', desc: '噴一團冷霧, 範圍內冷靜下來', cost: '每次 30 電', hold: false, need: 30 },
    firecracker: { name: '爆竹', cat: '激怒', desc: '丟一串爆竹, 炸到的大怒', cost: '每次 25 電', hold: false, need: 25 },
    jar: { name: '玻璃罩', cat: '冷靜', desc: '把一隻罩起來, 暫停 3 秒', cost: '每次 35 電', hold: false, need: 35 },
    hook: { name: '吊鉤', cat: '移動', desc: '按住吊起一隻, 放開就放下', cost: '按住每秒 20 電', hold: true, need: 0 }
  };
  var CAT_COLOR = { '激怒': P.ignite, '冷靜': P.calm, '移動': P.move };

  var DUN = {
    bamboo: { name: '竹林', mons: ['cat', 'turtle'], c: '#6fbf5e' },
    volcano: { name: '溫泉火山', mons: ['boar', 'monkey'], c: '#ff7a45' },
    tower: { name: '星空塔', mons: ['fox', 'owl'], c: '#8f8cff' }
  };
  var WEAPON = {
    club: { name: '棍棒', desc: 'Z 敲擊 X 無' },
    sword: { name: '劍', desc: 'Z 斬擊可打回飛彈 X 擊暈' },
    spear: { name: '長槍', desc: 'Z 長刺 X 突進' },
    whip: { name: '長鞭', desc: 'Z 整圈抽打 X 擊飛' }
  };
  var SHOP = {
    club: { name: '棍棒', desc: WEAPON.club.desc, type: 'weapon' },
    sword: { name: '劍', desc: WEAPON.sword.desc, type: 'weapon' },
    spear: { name: '長槍', desc: WEAPON.spear.desc, type: 'weapon' },
    whip: { name: '長鞭', desc: WEAPON.whip.desc, type: 'weapon' },
    attack: { name: '攻擊力 +1', desc: '武器傷害 +1', type: 'upgrade' },
    armor: { name: '護甲 心 +1', desc: '每天的心 +1', type: 'upgrade' },
    ropeBag: { name: '繩袋 捕獸繩 +1', desc: '每天的捕獸繩 +1', type: 'upgrade' },
    firecracker: { name: '爆竹', desc: DEV.firecracker.desc, type: 'device' },
    jar: { name: '玻璃罩', desc: DEV.jar.desc, type: 'device' },
    hook: { name: '吊鉤', desc: DEV.hook.desc, type: 'device' }
  };

  // ---------- 小工具 ----------
  function now() { return ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) / 1000; }
  function num(v, d) { v = Number(v); return isFinite(v) ? v : d; }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function ratio(t, d) { t = num(t, 0); d = num(d, 0); if (d <= 0) return 0; return clamp(t / d, 0, 1); }
  function pick(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function str(v) { return (v === undefined || v === null) ? '' : String(v); }
  function bool(v) { return v === true || v === 'true' || v === 1; }
  function obj(s) { return (s && typeof s === 'object') ? s : {}; }
  function spc(v) { return SP[v] ? v : 'cat'; }
  function dev(v) { return DEV[v] ? v : 'spotlight'; }

  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); }
  function ell(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, TAU); }
  function fillStroke(ctx, fill, stroke, lw) {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
  }
  function hexA(hex, a) {
    var h = String(hex).replace('#', '');
    if (h.length !== 6) return 'rgba(255,255,255,' + a + ')';
    return 'rgba(' + parseInt(h.substr(0, 2), 16) + ',' + parseInt(h.substr(2, 2), 16) + ',' + parseInt(h.substr(4, 2), 16) + ',' + a + ')';
  }
  // 文字(深色描邊保證任何底色可讀)
  function txt(ctx, s, x, y, o) {
    o = o || {};
    var size = o.size || 16;
    ctx.font = (o.weight || 'bold') + ' ' + size + 'px ' + F;
    if (o.maxW) {
      var w = ctx.measureText(s).width;
      while (w > o.maxW && size > 9) { size -= 1; ctx.font = (o.weight || 'bold') + ' ' + size + 'px ' + F; w = ctx.measureText(s).width; }
    }
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.base || 'middle';
    if (o.stroke !== false) {
      ctx.lineJoin = 'round';
      ctx.strokeStyle = o.strokeColor || P.ink;
      ctx.lineWidth = o.sw || Math.max(3, size * 0.22);
      ctx.strokeText(s, x, y);
    }
    ctx.fillStyle = o.color || P.text;
    ctx.fillText(s, x, y);
  }
  // 中文逐字換行
  function wrap(ctx, s, x, y, maxW, lineH, maxLines, o) {
    o = o || {};
    ctx.font = (o.weight || 'bold') + ' ' + (o.size || 14) + 'px ' + F;
    var lines = [], cur = '';
    for (var i = 0; i < s.length; i++) {
      var t = cur + s[i];
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = s[i]; } else cur = t;
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) { lines = lines.slice(0, maxLines); }
    var y0 = y - (lines.length - 1) * lineH / 2;
    for (var j = 0; j < lines.length; j++) txt(ctx, lines[j], x, y0 + j * lineH, o);
  }
  function star(ctx, x, y, r, fill, stroke) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rad = (i % 2) ? r * 0.46 : r;
      var px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.lineJoin = 'round';
    fillStroke(ctx, fill, stroke || P.ink, Math.max(1.5, r * 0.18));
  }
  function heart(ctx, x, y, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.6, y - r * 1.1, x, y - r * 0.35);
    ctx.bezierCurveTo(x + r * 0.6, y - r * 1.1, x + r * 1.4, y - r * 0.1, x, y + r * 0.9);
    ctx.closePath();
    fillStroke(ctx, fill, P.ink, 2);
  }
  function coin(ctx, x, y, r) {
    circle(ctx, x, y, r); fillStroke(ctx, P.gold, P.ink, 2);
    circle(ctx, x, y, r * 0.55); ctx.strokeStyle = '#b5841a'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  function bolt(ctx, x, y, s, fill) {
    ctx.beginPath();
    ctx.moveTo(x + 0.15 * s, y - 0.5 * s); ctx.lineTo(x - 0.3 * s, y + 0.08 * s); ctx.lineTo(x - 0.02 * s, y + 0.08 * s);
    ctx.lineTo(x - 0.15 * s, y + 0.5 * s); ctx.lineTo(x + 0.3 * s, y - 0.1 * s); ctx.lineTo(x + 0.02 * s, y - 0.1 * s);
    ctx.closePath();
    fillStroke(ctx, fill || P.gold, P.ink, 1.5);
  }
  function arrowHead(ctx, x, y, ang, s, color) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.6, -s * 0.75); ctx.lineTo(-s * 0.6, s * 0.75); ctx.closePath();
    fillStroke(ctx, color, P.ink, 2);
    ctx.restore();
  }
  function keyCap(ctx, x, y, label, size, opt) {
    opt = opt || {};
    var s = size || 34, dy = opt.pressed ? 3 : 0;
    ctx.save();
    rr(ctx, x - s / 2, y - s / 2 + 4, s, s, 7); ctx.fillStyle = '#0b0810'; ctx.fill();
    rr(ctx, x - s / 2, y - s / 2 + dy, s, s, 7);
    fillStroke(ctx, opt.dim ? '#6b6475' : (opt.face || '#ece6f4'), P.ink, 2);
    if (opt.glow) { rr(ctx, x - s / 2 - 3, y - s / 2 + dy - 3, s + 6, s + 6, 9); ctx.strokeStyle = opt.glow; ctx.lineWidth = 3; ctx.stroke(); }
    txt(ctx, label, x, y + dy + 1, { size: Math.round(s * (label.length > 1 ? 0.36 : 0.56)), color: '#1b1424', stroke: false });
    ctx.restore();
  }

  // ---------- 魔物本體(原點為身體中心, 基準半徑 24) ----------
  function eyes(ctx, ex, ey, gap, kind, r) {
    r = r || 3.2;
    for (var i = -1; i <= 1; i += 2) {
      var x = ex + i * gap;
      ctx.save();
      if (kind === 'weak') {
        ctx.strokeStyle = P.ink; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(x, ey - 1, r, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      } else if (kind === 'stun') {
        ctx.strokeStyle = P.ink; ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (var k = 0; k < 16; k++) { var a = k * 0.8, rad = r * k / 16 * 1.3; var px = x + Math.cos(a) * rad, py = ey + Math.sin(a) * rad; if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.stroke();
      } else if (kind === 'happy') {
        ctx.strokeStyle = P.ink; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(x, ey + 1, r, 1.1 * Math.PI, 1.9 * Math.PI); ctx.stroke();
      } else {
        circle(ctx, x, ey, r); ctx.fillStyle = P.ink; ctx.fill();
        circle(ctx, x + r * 0.35, ey - r * 0.35, r * 0.35); ctx.fillStyle = '#fff'; ctx.fill();
        if (kind === 'angry') {
          ctx.strokeStyle = P.ink; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x - i * r * 1.6, ey - r * 2.2); ctx.lineTo(x + i * r * 0.6, ey - r * 1.2); ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  function monsterBody(ctx, species, o) {
    o = o || {};
    var d = SP[species], dir = o.dir < 0 ? -1 : 1, ek = o.eyes || 'normal';
    var c = d.c, dk = d.d, lw = 2.5;
    ctx.save();
    ctx.lineJoin = 'round';
    if (species === 'cat') {
      // 尾巴
      ctx.beginPath(); ctx.moveTo(-dir * 18, 12); ctx.quadraticCurveTo(-dir * 34, 4, -dir * 28, -14);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.stroke();
      ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.stroke();
      // 耳
      for (var e = -1; e <= 1; e += 2) {
        ctx.beginPath(); ctx.moveTo(e * 6, -20); ctx.lineTo(e * 17, -33); ctx.lineTo(e * 20, -14); ctx.closePath();
        fillStroke(ctx, c, P.ink, lw);
        ctx.beginPath(); ctx.moveTo(e * 10, -20); ctx.lineTo(e * 16, -28); ctx.lineTo(e * 17, -18); ctx.closePath();
        ctx.fillStyle = '#ffb3a8'; ctx.fill();
      }
      // 炸毛身體(圓齒)
      ctx.beginPath();
      var N = 16;
      for (var i = 0; i <= N; i++) {
        var a = i / N * TAU, a2 = (i + 0.5) / N * TAU;
        var px = Math.cos(a) * 22, py = Math.sin(a) * 22;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.quadraticCurveTo(Math.cos(a2 - TAU / N) * 27, Math.sin(a2 - TAU / N) * 27, px, py);
      }
      ctx.closePath();
      fillStroke(ctx, c, P.ink, lw);
      eyes(ctx, dir * 3, -4, 8, ek);
      ctx.beginPath(); ctx.moveTo(dir * 3 - 2.5, 3); ctx.lineTo(dir * 3 + 2.5, 3); ctx.lineTo(dir * 3, 6); ctx.closePath(); ctx.fillStyle = '#e46a7a'; ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 1.2;
      for (var w = -1; w <= 1; w += 2) {
        ctx.beginPath(); ctx.moveTo(dir * 3 + w * 7, 5); ctx.lineTo(dir * 3 + w * 17, 3); ctx.moveTo(dir * 3 + w * 7, 7); ctx.lineTo(dir * 3 + w * 17, 9); ctx.stroke();
      }
    } else if (species === 'turtle') {
      for (var f = -1; f <= 1; f += 2) { ell(ctx, f * 15, 13, 7, 5); fillStroke(ctx, '#a6dc7c', P.ink, 2); }
      circle(ctx, dir * 24, 2, 9.5); fillStroke(ctx, '#a6dc7c', P.ink, lw);
      circle(ctx, dir * 27, 0, 2.6); ctx.fillStyle = P.ink; ctx.fill();
      if (ek === 'weak' || ek === 'stun') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; circle(ctx, dir * 27, 0, 3.5); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-25, 9); ctx.quadraticCurveTo(-25, -22, 0, -22); ctx.quadraticCurveTo(25, -22, 25, 9); ctx.closePath();
      fillStroke(ctx, c, P.ink, lw);
      ctx.strokeStyle = dk; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-8, -15); ctx.lineTo(8, -15); ctx.lineTo(13, -4); ctx.lineTo(8, 6); ctx.lineTo(-8, 6); ctx.lineTo(-13, -4); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-13, -4); ctx.lineTo(-24, -4); ctx.moveTo(13, -4); ctx.lineTo(24, -4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-25, 9); ctx.lineTo(25, 9); ctx.strokeStyle = P.ink; ctx.lineWidth = lw; ctx.stroke();
      ell(ctx, -8, -14, 5, 2.5); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
      // 眼睛畫在頭上(已畫), 表情靠頭部
      if (ek === 'angry') { ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(dir * 22, -6); ctx.lineTo(dir * 30, -3); ctx.stroke(); }
    } else if (species === 'boar') {
      for (var be = -1; be <= 1; be += 2) {
        ctx.beginPath(); ctx.moveTo(be * 8, -21); ctx.lineTo(be * 18, -30); ctx.lineTo(be * 20, -15); ctx.closePath();
        fillStroke(ctx, c, P.ink, lw);
      }
      circle(ctx, 0, 0, 24); fillStroke(ctx, c, P.ink, lw);
      ctx.strokeStyle = '#ffb04a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-dir * 14, -16); ctx.lineTo(-dir * 8, -10); ctx.lineTo(-dir * 12, -4); ctx.moveTo(-dir * 4, -20); ctx.lineTo(-dir * 1, -14); ctx.stroke();
      eyes(ctx, dir * 2, -7, 8, ek);
      ell(ctx, dir * 13, 6, 10, 7.5); fillStroke(ctx, '#f2877d', P.ink, 2);
      circle(ctx, dir * 10, 6, 1.8); circle(ctx, dir * 16, 6, 1.8); ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(dir * 10, 6, 1.8, 0, TAU); ctx.arc(dir * 16, 6, 1.8, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fffbea'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(dir * 6, 11); ctx.quadraticCurveTo(dir * 4, 16, dir * 8, 18); ctx.stroke();
    } else if (species === 'monkey') {
      for (var me = -1; me <= 1; me += 2) { circle(ctx, me * 23, -2, 8); fillStroke(ctx, '#f3b9a0', P.ink, 2); }
      circle(ctx, 0, 0, 23); fillStroke(ctx, c, P.ink, lw);
      ell(ctx, dir * 2, 4, 15, 13); fillStroke(ctx, '#f3b9a0', null);
      eyes(ctx, dir * 2, 1, 6, ek, 2.8);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(dir * 2, 8, 4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      rr(ctx, -13, -30, 26, 9, 4); fillStroke(ctx, '#ffffff', P.ink, 2);
      ctx.strokeStyle = '#9adfe6'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-8, -26); ctx.lineTo(8, -26); ctx.stroke();
    } else if (species === 'fox') {
      ctx.save(); ctx.translate(-dir * 22, 8); ctx.rotate(-dir * 0.5);
      ell(ctx, 0, 0, 15, 9); fillStroke(ctx, c, P.ink, lw);
      ell(ctx, -dir * 9, 0, 6, 5.5); ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.restore();
      for (var fe = -1; fe <= 1; fe += 2) {
        ctx.beginPath(); ctx.moveTo(fe * 5, -19); ctx.lineTo(fe * 14, -36); ctx.lineTo(fe * 19, -13); ctx.closePath();
        fillStroke(ctx, c, P.ink, lw);
      }
      circle(ctx, 0, 0, 22); fillStroke(ctx, c, P.ink, lw);
      ell(ctx, dir * 6, 7, 12, 9); ctx.fillStyle = '#dfe6ff'; ctx.fill();
      eyes(ctx, dir * 3, -4, 7.5, ek, 3);
      star(ctx, dir * 3, -14, 4.5, '#ffffff', P.ink);
      circle(ctx, dir * 14, 6, 2.2); ctx.fillStyle = P.ink; ctx.fill();
    } else { // owl
      for (var oe = -1; oe <= 1; oe += 2) {
        ell(ctx, oe * 22, 4, 9, 18); fillStroke(ctx, dk, P.ink, lw);
        ctx.beginPath(); ctx.moveTo(oe * 8, -22); ctx.lineTo(oe * 16, -34); ctx.lineTo(oe * 19, -18); ctx.closePath(); fillStroke(ctx, c, P.ink, lw);
      }
      ell(ctx, 0, 0, 22, 25); fillStroke(ctx, c, P.ink, lw);
      for (var oi = -1; oi <= 1; oi += 2) { circle(ctx, oi * 9, -7, 8); fillStroke(ctx, '#f6efff', P.ink, 2); }
      eyes(ctx, 0, -7, 9, ek, 3.6);
      ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.lineTo(0, 5); ctx.closePath(); fillStroke(ctx, '#f0c98a', P.ink, 1.5);
      ctx.beginPath(); ctx.arc(0, 14, 7, 0.3 * Math.PI, 1.7 * Math.PI, false); ctx.arc(3, 14, 5.5, 1.6 * Math.PI, 0.4 * Math.PI, true); ctx.closePath();
      ctx.fillStyle = '#f5f0c8'; ctx.fill();
    }
    if (o.flash) {
      ctx.globalAlpha = 0.75 * o.flash;
      circle(ctx, 0, 0, 25); ctx.fillStyle = '#ffffff'; ctx.fill();
    }
    ctx.restore();
  }

  function poseTransform(ctx, move, p, dir) {
    if (move === 'crouch') { ctx.translate(0, 6 * Math.min(1, p * 4)); ctx.scale(1 + 0.15 * Math.min(1, p * 4), 1 - 0.22 * Math.min(1, p * 4)); }
    else if (move === 'pounce') { ctx.scale(1.15, 0.85); }
    else if (move === 'charge') { ctx.rotate(dir * 0.12); }
  }
  function poseExtras(ctx, move, p, dir, k) {
    ctx.save();
    if (move === 'pounce' || move === 'charge') {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (var i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(-dir * 26 * k, i * 9 * k); ctx.lineTo(-dir * 36 * k, i * 9 * k); ctx.stroke();
      }
    } else if (move === 'rest') {
      ctx.beginPath(); ctx.moveTo(22 * k, -26 * k); ctx.quadraticCurveTo(27 * k, -18 * k, 22 * k, -15 * k); ctx.quadraticCurveTo(17 * k, -18 * k, 22 * k, -26 * k);
      fillStroke(ctx, '#bfe8ff', P.ink, 1.5);
    }
    ctx.restore();
  }
  function stunStars(ctx, y, k, frac) {
    var t = now() * 3;
    for (var i = 0; i < 3; i++) {
      var a = t + i * TAU / 3;
      star(ctx, Math.cos(a) * 14 * k, y + Math.sin(a) * 4 * k, 4.2, '#ffe96a', P.ink);
    }
    if (frac !== null && frac !== undefined) {
      ctx.save(); ctx.strokeStyle = '#ffe96a'; ctx.lineWidth = 2; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.ellipse(0, y, 18 * k, 6 * k, 0, -Math.PI / 2, -Math.PI / 2 + TAU * frac); ctx.stroke(); ctx.restore();
    }
  }

  // ---------- 背景 ----------
  function drawBackground(ctx) {
    ctx.save();
    var g = ctx.createLinearGradient(0, 0, 0, 720);
    g.addColorStop(0, '#1d1528'); g.addColorStop(1, '#120d18');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
    ctx.globalAlpha = 0.05; ctx.fillStyle = '#ffffff';
    for (var i = 0; i < 16; i++) { circle(ctx, (i * 173) % 1280, 120 + (i * 97) % 560, 2 + (i % 3)); ctx.fill(); }
    ctx.restore();
  }

  // ---------- 地下城地圖格 ----------
  var THEME = {
    bamboo: { room: '#3c4c36', room2: '#384731', hall: '#2a3127', wall: '#1d281b', wallTop: '#3f5b34' },
    volcano: { room: '#4a3a32', room2: '#45362e', hall: '#302527', wall: '#1d1416', wallTop: '#4d2f27' },
    tower: { room: '#2f3252', room2: '#2b2e4c', hall: '#21233d', wall: '#13132a', wallTop: '#383370' }
  };
  function floorBase(ctx, th, room, x0, y0, x, y) {
    var checker = (Math.floor(x / 60) + Math.floor(y / 60)) % 2;
    ctx.fillStyle = room === 'hall' ? th.hall : (checker ? th.room : th.room2);
    ctx.fillRect(x0, y0, 60, 60);
    if (room === 'hall') {
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); for (var i = 0; i < 3; i++) { ctx.moveTo(x0 + i * 20, y0); ctx.lineTo(x0 + i * 20 + 20, y0 + 60); } ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, 59, 59);
    }
  }
  function drawTile(ctx, s) {
    s = obj(s);
    var x = num(s.x, 0), y = num(s.y, 0);
    var dun = pick(s.dungeon, ['bamboo', 'volcano', 'tower'], 'bamboo');
    var kind = pick(s.kind, ['wall', 'pillar', 'floor', 'hurt', 'slow'], 'floor');
    var room = pick(s.room, ['left', 'right', 'hall'], 'hall');
    var th = THEME[dun], x0 = x - 30, y0 = y - 30;
    ctx.save();
    if (kind === 'wall') {
      ctx.fillStyle = th.wall; ctx.fillRect(x0, y0, 60, 60);
      ctx.fillStyle = th.wallTop; ctx.fillRect(x0, y0, 60, 10);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, y0 + 35); ctx.lineTo(x0 + 60, y0 + 35); ctx.moveTo(x0 + 30, y0 + 10); ctx.lineTo(x0 + 30, y0 + 35); ctx.moveTo(x0 + 15, y0 + 35); ctx.lineTo(x0 + 15, y0 + 60); ctx.moveTo(x0 + 45, y0 + 35); ctx.lineTo(x0 + 45, y0 + 60); ctx.stroke();
      ctx.restore(); return;
    }
    floorBase(ctx, th, room, x0, y0, x, y);
    if (kind === 'pillar') {
      ell(ctx, x + 4, y + 22, 24, 7); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
      if (dun === 'bamboo') {
        var xs = [-16, 0, 14];
        for (var i = 0; i < 3; i++) {
          rr(ctx, x + xs[i] - 6, y0 + 2 + (i % 2) * 5, 12, 54 - (i % 2) * 5, 4); fillStroke(ctx, '#5e9a3e', P.ink, 2);
          ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x + xs[i] - 6, y - 6 + i * 4); ctx.lineTo(x + xs[i] + 6, y - 6 + i * 4); ctx.moveTo(x + xs[i] - 6, y + 14); ctx.lineTo(x + xs[i] + 6, y + 14); ctx.stroke();
        }
        ell(ctx, x - 20, y0 + 8, 8, 3.5); ctx.fillStyle = '#86c45a'; ctx.fill();
      } else if (dun === 'volcano') {
        ctx.beginPath(); ctx.moveTo(x - 26, y + 22); ctx.lineTo(x - 20, y - 14); ctx.lineTo(x - 4, y - 26); ctx.lineTo(x + 18, y - 18); ctx.lineTo(x + 27, y + 4); ctx.lineTo(x + 22, y + 24); ctx.closePath();
        fillStroke(ctx, '#5b4c4a', P.ink, 2.5);
        ctx.beginPath(); ctx.moveTo(x - 18, y - 12); ctx.lineTo(x - 4, y - 22); ctx.lineTo(x + 14, y - 15); ctx.strokeStyle = '#8a7a76'; ctx.lineWidth = 3; ctx.stroke();
      } else {
        rr(ctx, x - 20, y0 + 4, 40, 54, 6); fillStroke(ctx, '#5c5899', P.ink, 2.5);
        ell(ctx, x, y0 + 10, 20, 6); fillStroke(ctx, '#7f7bc4', P.ink, 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 8, y0 + 18); ctx.lineTo(x - 8, y0 + 54); ctx.moveTo(x + 6, y0 + 18); ctx.lineTo(x + 6, y0 + 54); ctx.stroke();
      }
    } else if (kind === 'hurt') {
      if (dun === 'tower') {
        ctx.fillStyle = '#3a1838'; ctx.fillRect(x0 + 2, y0 + 2, 56, 56);
        ctx.fillStyle = '#ff7ab8';
        var pts = [[-14, -12], [12, -16], [-4, 4], [16, 10], [-16, 16]];
        for (var k = 0; k < pts.length; k++) {
          var px = x + pts[k][0], py = y + pts[k][1];
          ctx.beginPath(); ctx.moveTo(px, py - 6); ctx.lineTo(px + 4, py); ctx.lineTo(px, py + 6); ctx.lineTo(px - 4, py); ctx.closePath(); ctx.fill();
        }
      } else {
        var g = ctx.createRadialGradient(x, y, 4, x, y, 34);
        g.addColorStop(0, '#ffcf4a'); g.addColorStop(0.6, '#ff6a2a'); g.addColorStop(1, '#a8231a');
        ctx.fillStyle = g; ctx.fillRect(x0 + 2, y0 + 2, 56, 56);
        ctx.fillStyle = 'rgba(60,20,16,0.55)';
        ell(ctx, x - 12, y - 10, 9, 5); ctx.fill(); ell(ctx, x + 13, y + 12, 8, 4); ctx.fill();
      }
      // 危險共通記號: 紅色虛線框
      ctx.setLineDash([8, 5]); ctx.strokeStyle = P.danger; ctx.lineWidth = 3; ctx.strokeRect(x0 + 3.5, y0 + 3.5, 53, 53); ctx.setLineDash([]);
    } else if (kind === 'slow') {
      if (dun === 'bamboo') {
        ctx.fillStyle = '#6b4b25'; ctx.fillRect(x0 + 2, y0 + 2, 56, 56);
        var lv = [[-14, -14, 0.4], [10, -12, -0.6], [-4, 2, 1.1], [14, 12, 0.2], [-16, 16, -0.3]];
        for (var l = 0; l < lv.length; l++) {
          ctx.save(); ctx.translate(x + lv[l][0], y + lv[l][1]); ctx.rotate(lv[l][2]);
          ell(ctx, 0, 0, 9, 4); ctx.fillStyle = l % 2 ? '#c98a3a' : '#a8642a'; ctx.fill(); ctx.restore();
        }
      } else if (dun === 'volcano') {
        ctx.fillStyle = '#2f8f9a'; ctx.fillRect(x0 + 2, y0 + 2, 56, 56);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ell(ctx, x - 10, y - 12, 7, 3); ctx.fill(); ell(ctx, x + 12, y + 8, 6, 2.5); ctx.fill();
      } else {
        ctx.fillStyle = '#3c2d66'; ctx.fillRect(x0 + 2, y0 + 2, 56, 56);
        ctx.strokeStyle = 'rgba(201,184,240,0.5)'; ctx.lineWidth = 2;
        circle(ctx, x, y, 10); ctx.stroke(); circle(ctx, x, y, 20); ctx.stroke();
      }
      // 減速共通記號: 白色波浪
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2;
      for (var r = 0; r < 2; r++) {
        ctx.beginPath();
        for (var q = 0; q <= 4; q++) { var qx = x - 20 + q * 10, qy = y - 6 + r * 14 + (q % 2 ? -4 : 4); if (q) ctx.lineTo(qx, qy); else ctx.moveTo(qx, qy); }
        ctx.stroke();
      }
    }
    if (bool(s.nest)) {
      ctx.setLineDash([5, 4]);
      ell(ctx, x, y + 4, 22, 13); ctx.fillStyle = 'rgba(210,180,110,0.25)'; ctx.fill();
      ctx.strokeStyle = '#d9bf7a'; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
      for (var n = -1; n <= 1; n++) { ell(ctx, x + n * 7, y + 4, 4, 5); fillStroke(ctx, '#f4ead2', P.ink, 1.2); }
    }
    ctx.restore();
  }

  // ---------- 馴獸師 ----------
  function weaponShape(ctx, weapon) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (weapon === 'sword') {
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(30, 0); ctx.strokeStyle = P.ink; ctx.lineWidth = 7; ctx.stroke();
      ctx.strokeStyle = '#dfe7f2'; ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(14, -6); ctx.lineTo(14, 6); ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 4; ctx.stroke();
    } else if (weapon === 'spear') {
      ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(25, 0); ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.stroke();
      ctx.strokeStyle = '#a7774a'; ctx.lineWidth = 3.5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(31, 0); ctx.lineTo(23, -5); ctx.lineTo(23, 5); ctx.closePath(); fillStroke(ctx, '#dfe7f2', P.ink, 1.5);
    } else if (weapon === 'whip') {
      ctx.beginPath(); ctx.moveTo(12, 2); ctx.quadraticCurveTo(28, -10, 24, 6); ctx.quadraticCurveTo(20, 16, 29, 12);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = 2.5; ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(28, 0); ctx.strokeStyle = P.ink; ctx.lineWidth = 9; ctx.stroke();
      ctx.strokeStyle = '#a0683a'; ctx.lineWidth = 6; ctx.stroke();
      circle(ctx, 28, 0, 4.5); fillStroke(ctx, '#a0683a', P.ink, 1.5);
    }
  }
  function drawTamer(ctx, s) {
    s = obj(s);
    var x = num(s.x, 0), y = num(s.y, 0), facing = clamp(Math.round(num(s.facing, 0)), 0, 7);
    var weapon = pick(s.weapon, ['club', 'sword', 'spear', 'whip'], 'club');
    var a = facing * Math.PI / 4 - Math.PI / 2;
    ctx.save();
    ctx.translate(x, y);
    if (bool(s.blink) && Math.floor(now() * 12) % 2 === 0) ctx.globalAlpha = 0.35;
    ell(ctx, 0, 16, 16, 5); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    if (bool(s.dashing)) {
      ctx.save(); ctx.globalAlpha *= 0.35;
      for (var i = 1; i <= 2; i++) { circle(ctx, -Math.cos(a) * 6 * i, -Math.sin(a) * 6 * i, 17); ctx.fillStyle = '#bfe8ff'; ctx.fill(); }
      ctx.restore();
    }
    // 武器在面向側
    ctx.save(); ctx.rotate(a); weaponShape(ctx, weapon); ctx.restore();
    circle(ctx, 0, 0, 18);
    fillStroke(ctx, P.player, bool(s.dashing) ? '#bfe8ff' : P.ink, bool(s.dashing) ? 4 : 2.5);
    // 帽子(帽沿朝面向)
    ctx.save(); ctx.rotate(a);
    ctx.beginPath(); ctx.arc(-3, 0, 13, Math.PI * 0.5, Math.PI * 1.5); ctx.closePath(); fillStroke(ctx, P.playerHat, P.ink, 2);
    ctx.beginPath(); ctx.moveTo(-3, -13); ctx.quadraticCurveTo(6, -15, 8, 0); ctx.quadraticCurveTo(6, 15, -3, 13); ctx.strokeStyle = P.playerHat; ctx.lineWidth = 3; ctx.stroke();
    circle(ctx, 9, -5, 2.4); ctx.fillStyle = P.ink; ctx.fill();
    circle(ctx, 9, 5, 2.4); ctx.fill();
    ctx.restore();
    if (bool(s.lassoing)) {
      ctx.save(); ctx.rotate(a + Math.PI * 0.75);
      ctx.strokeStyle = P.rope; ctx.lineWidth = 3;
      ell(ctx, 18, 0, 6, 4); ctx.stroke(); ell(ctx, 18, 0, 3.5, 2.2); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- 野生魔物 ----------
  function drawWildMonster(ctx, s) {
    s = obj(s);
    var x = num(s.x, 0), y = num(s.y, 0), sp = spc(s.species), owl = sp === 'owl';
    var k = owl ? 1.35 : 1, half = owl ? 55 : 40, dir = num(s.dir, 1) < 0 ? -1 : 1;
    var move = pick(s.move, ['walk', 'crouch', 'pounce', 'charge', 'rest'], 'walk');
    var mp = ratio(s.moveT, s.moveDur);
    var stunLeft = Math.max(0, num(s.stunLeft, 0)), lassoed = bool(s.lassoed), weak = bool(s.weak);
    var stunned = stunLeft > 0 || lassoed;
    ctx.save();
    ctx.translate(x, y);
    ell(ctx, 0, 27 * k, 22 * k, 5.5 * k); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    if (bool(s.casting) && !stunned) {
      var pulse = 0.5 + 0.5 * Math.sin(now() * 14);
      circle(ctx, 0, -2 * k, 31 * k); ctx.strokeStyle = hexA(SP[sp].c, 0.5 + 0.4 * pulse); ctx.lineWidth = 3; ctx.stroke();
      circle(ctx, 0, -2 * k, 34 * k); ctx.strokeStyle = 'rgba(255,255,255,' + (0.3 + 0.4 * pulse) + ')'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.save(); ctx.translate(0, -2 * k); ctx.scale(k, k);
    poseExtras(ctx, move, mp, dir, 1);
    poseTransform(ctx, move, mp, dir);
    monsterBody(ctx, sp, { dir: dir, eyes: stunned ? 'stun' : (weak ? 'weak' : (move === 'charge' || move === 'pounce' ? 'angry' : 'normal')), flash: bool(s.hit) ? 1 : 0 });
    ctx.restore();
    if (lassoed) {
      ell(ctx, 0, 6 * k, 25 * k, 7 * k); ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.stroke();
      ctx.strokeStyle = P.rope; ctx.lineWidth = 3.5; ctx.stroke();
    }
    // 血條
    var maxHp = Math.max(1, num(s.maxHp, 1)), hp = clamp(num(s.hp, maxHp), 0, maxHp);
    var bw = owl ? 70 : 54, by = half - 8;
    rr(ctx, -bw / 2, by - 3, bw, 6, 3); fillStroke(ctx, '#0e0a14', P.ink, 1.5);
    if (hp > 0) { rr(ctx, -bw / 2 + 1, by - 2, (bw - 2) * hp / maxHp, 4, 2); ctx.fillStyle = weak ? P.heart : '#cfeec0'; ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(-bw / 2 + bw * 0.3, by - 4); ctx.lineTo(-bw / 2 + bw * 0.3, by + 4); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
    // 殘血記號: 汗滴 + 碎心(可捕捉的機會)
    if (weak) {
      var wy = -24 * k, wx = 22 * k;
      var bob = Math.sin(now() * 4) * 1.5;
      heart(ctx, wx, wy + bob, 6, P.heart);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(wx, wy - 3 + bob); ctx.lineTo(wx - 2, wy + bob); ctx.lineTo(wx + 1.5, wy + 2 + bob); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-wx, wy - 4); ctx.quadraticCurveTo(-wx + 4, wy + 2, -wx, wy + 4); ctx.quadraticCurveTo(-wx - 4, wy + 2, -wx, wy - 4);
      fillStroke(ctx, '#bfe8ff', P.ink, 1.2);
    }
    if (stunned) {
      var fr = lassoed ? null : ratio(stunLeft, num(s.stunDur, 2) || 2);
      stunStars(ctx, (owl ? -44 : -33), k * 0.9, fr);
    }
    ctx.restore();
  }

  // ---------- 準備捕捉 ----------
  function drawCaptureRing(ctx, s) {
    s = obj(s);
    var x = num(s.x, 0), y = num(s.y, 0), p = ratio(s.t, s.dur);
    ctx.save(); ctx.translate(x, y);
    circle(ctx, 0, 0, 42); ctx.strokeStyle = 'rgba(14,10,20,0.75)'; ctx.lineWidth = 9; ctx.stroke();
    circle(ctx, 0, 0, 42); ctx.strokeStyle = 'rgba(255,215,94,0.25)'; ctx.lineWidth = 6; ctx.stroke();
    if (p > 0) {
      ctx.beginPath(); ctx.arc(0, 0, 42, -Math.PI / 2, -Math.PI / 2 + TAU * p);
      ctx.strokeStyle = P.playerSkill; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke();
    }
    rr(ctx, -38, 34, 76, 20, 10); fillStroke(ctx, '#2a2236', P.playerSkill, 2);
    txt(ctx, '準備捕捉', 0, 44, { size: 13, color: P.playerSkill, stroke: false });
    ctx.restore();
  }

  // ---------- 套索 ----------
  function drawLasso(ctx, s) {
    s = obj(s);
    var x1 = num(s.x1, 0), y1 = num(s.y1, 0), x2 = num(s.x2, 0), y2 = num(s.y2, 0);
    var prog = clamp(num(s.progress, 0), 0, 1), tl = ratio(s.t, s.limit);
    var tension = ratio(s.len, s.maxLen || 220);
    ctx.save();
    // 繞圈進度環(魔物周圍)
    circle(ctx, x2, y2, 50); ctx.strokeStyle = 'rgba(14,10,20,0.7)'; ctx.lineWidth = 10; ctx.stroke();
    circle(ctx, x2, y2, 50); ctx.strokeStyle = 'rgba(255,215,94,0.22)'; ctx.lineWidth = 6; ctx.stroke();
    if (prog > 0) {
      ctx.beginPath(); ctx.arc(x2, y2, 50, -Math.PI / 2, -Math.PI / 2 + TAU * prog); ctx.strokeStyle = P.playerSkill; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke();
      var ea = -Math.PI / 2 + TAU * prog;
      arrowHead(ctx, x2 + Math.cos(ea) * 50, y2 + Math.sin(ea) * 50, ea + Math.PI / 2, 7, P.playerSkill);
    }
    // 套索時限: 內圈細環 = 剩餘時間
    var rem = 1 - tl;
    if (rem > 0) {
      ctx.beginPath(); ctx.arc(x2, y2, 43, -Math.PI / 2, -Math.PI / 2 + TAU * rem);
      ctx.strokeStyle = rem < 0.3 ? P.danger : 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5; ctx.lineCap = 'butt'; ctx.stroke();
    }
    // 繩子
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy) || 1;
    var sag = tension < 0.75 ? 24 * (1 - tension / 0.75) : 0;
    var mx = (x1 + x2) / 2 - dy / L * 0 , my = (y1 + y2) / 2 + sag;
    var col = tension >= 0.75 ? P.danger : P.rope;
    var lw = tension >= 0.75 ? 4.5 : 3.5;
    if (tension >= 0.9 && Math.floor(now() * 10) % 2 === 0) col = '#ffffff';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.strokeStyle = P.ink; ctx.lineWidth = lw + 3; ctx.lineCap = 'round'; ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
    ctx.restore();
  }

  // ---------- 魔物技能 ----------
  function sectorPath(ctx, x, y, r0, r1, a, spread) {
    ctx.beginPath();
    if (r0 <= 0) { ctx.moveTo(x, y); ctx.arc(x, y, r1, a - spread / 2, a + spread / 2); }
    else { ctx.arc(x, y, r1, a - spread / 2, a + spread / 2); ctx.arc(x, y, r0, a + spread / 2, a - spread / 2, true); }
    ctx.closePath();
  }
  function drawHazard(ctx, s) {
    s = obj(s);
    var kind = pick(s.kind, ['claw', 'bubble', 'lava', 'splash', 'beam', 'sleepwave'], 'claw');
    var phase = pick(s.phase, ['warn', 'active', 'fly'], kind === 'bubble' ? 'fly' : 'warn');
    var x = num(s.x, 0), y = num(s.y, 0), a = num(s.angle, 0);
    var col = SP[HZ_SP[kind]].c, edge = SP[HZ_SP[kind]].kind === 'ignite' ? '#ffd9a8' : '#d4f0ff';
    var p = ratio(s.t, s.dur);
    ctx.save();
    if (kind === 'bubble') {
      var r = Math.max(4, num(s.radius, 14)), refl = bool(s.reflected);
      if (refl) {
        ctx.strokeStyle = hexA(P.playerSkill, 0.6); ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r); ctx.lineTo(x - Math.cos(a) * r * 3, y - Math.sin(a) * r * 3); ctx.stroke();
      }
      circle(ctx, x, y, r);
      fillStroke(ctx, refl ? hexA(P.playerFx, 0.85) : hexA(col, 0.55), refl ? P.playerSkill : P.ink, refl ? 3 : 2.5);
      circle(ctx, x - r * 0.35, y - r * 0.35, r * 0.28); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
      ctx.restore(); return;
    }
    var warn = phase === 'warn';
    if (kind === 'claw' || kind === 'splash') {
      var R = Math.max(1, num(s.radius, kind === 'claw' ? 110 : 150)), sp = num(s.spread, kind === 'claw' ? 1.745 : 1.571);
      if (warn) {
        sectorPath(ctx, x, y, 0, R, a, sp); ctx.fillStyle = hexA(col, 0.12); ctx.fill();
        ctx.setLineDash([8, 6]); ctx.strokeStyle = hexA(col, 0.9); ctx.lineWidth = 2.5; ctx.stroke(); ctx.setLineDash([]);
        sectorPath(ctx, x, y, 0, R * p, a, sp); ctx.fillStyle = hexA(col, 0.35); ctx.fill();
      } else {
        sectorPath(ctx, x, y, 0, R, a, sp); ctx.fillStyle = hexA(col, 0.55); ctx.fill();
        ctx.strokeStyle = edge; ctx.lineWidth = 3; ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        if (kind === 'claw') {
          for (var i = -1; i <= 1; i++) {
            var aa = a + i * sp * 0.18;
            ctx.beginPath(); ctx.moveTo(x + Math.cos(aa - 0.3) * R * 0.45, y + Math.sin(aa - 0.3) * R * 0.45);
            ctx.quadraticCurveTo(x + Math.cos(aa) * R * 0.8, y + Math.sin(aa) * R * 0.8, x + Math.cos(aa + 0.3) * R * 0.92, y + Math.sin(aa + 0.3) * R * 0.92); ctx.stroke();
          }
        } else {
          for (var j = 0; j < 6; j++) {
            var ja = a - sp / 2 + sp * (j + 0.5) / 6, jr = R * (0.5 + 0.4 * ((j * 37) % 10) / 10);
            ell(ctx, x + Math.cos(ja) * jr, y + Math.sin(ja) * jr, 4, 6); ctx.fillStyle = '#e8fbff'; ctx.fill();
          }
        }
      }
    } else if (kind === 'lava') {
      var LR = Math.max(1, num(s.radius, 80));
      if (warn) {
        circle(ctx, x, y, LR); ctx.fillStyle = hexA(col, 0.12); ctx.fill();
        ctx.setLineDash([8, 6]); ctx.strokeStyle = hexA(col, 0.95); ctx.lineWidth = 2.5; ctx.stroke(); ctx.setLineDash([]);
        circle(ctx, x, y, LR * p); ctx.fillStyle = hexA(col, 0.35); ctx.fill();
        var fy = y - 220 * (1 - p);
        ctx.strokeStyle = 'rgba(255,170,80,0.5)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, fy - 30); ctx.lineTo(x, fy - 8); ctx.stroke();
        circle(ctx, x, fy, 11); fillStroke(ctx, '#ff7a2a', P.ink, 2.5);
        circle(ctx, x - 3, fy - 3, 4); ctx.fillStyle = '#ffd36a'; ctx.fill();
      } else {
        circle(ctx, x, y, LR); ctx.fillStyle = hexA(col, 0.5 * (1 - p) + 0.15); ctx.fill();
        ctx.strokeStyle = edge; ctx.lineWidth = 3; ctx.stroke();
        ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (var q = 0; q < 10; q++) {
          var qa = q / 10 * TAU, q0 = LR * (0.2 + 0.5 * p), q1 = LR * (0.45 + 0.5 * p);
          ctx.beginPath(); ctx.moveTo(x + Math.cos(qa) * q0, y + Math.sin(qa) * q0); ctx.lineTo(x + Math.cos(qa) * q1, y + Math.sin(qa) * q1); ctx.stroke();
        }
      }
    } else if (kind === 'beam') {
      var len = Math.max(1, num(s.length, 400)), wd = Math.max(1, num(s.width, 36));
      ctx.translate(x, y); ctx.rotate(a);
      if (warn) {
        ctx.fillStyle = hexA(col, 0.12); ctx.fillRect(0, -wd / 2, len, wd);
        ctx.setLineDash([8, 6]); ctx.strokeStyle = hexA(col, 0.95); ctx.lineWidth = 2.5; ctx.strokeRect(0, -wd / 2, len, wd); ctx.setLineDash([]);
        ctx.fillStyle = hexA(col, 0.4); ctx.fillRect(0, -wd / 2 * p, len, wd * p);
      } else {
        ctx.fillStyle = hexA(col, 0.6); ctx.fillRect(0, -wd / 2, len, wd);
        ctx.strokeStyle = edge; ctx.lineWidth = 3; ctx.strokeRect(0, -wd / 2, len, wd);
        ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(0, -wd * 0.12, len, wd * 0.24);
      }
    } else { // sleepwave: radius = 中線, 環寬 30
      var mr = Math.max(0, num(s.radius, 0)), ri = Math.max(0, mr - 15), ro = mr + 15;
      ctx.beginPath(); ctx.arc(x, y, ro, 0, TAU); if (ri > 0) ctx.arc(x, y, ri, 0, TAU, true);
      ctx.fillStyle = hexA(col, 0.5); ctx.fill();
      circle(ctx, x, y, ro); ctx.strokeStyle = edge; ctx.lineWidth = 2.5; ctx.stroke();
      if (ri > 0) { circle(ctx, x, y, ri); ctx.stroke(); }
      for (var z = 0; z < 6; z++) {
        var za = z / 6 * TAU + 0.3;
        txt(ctx, 'z', x + Math.cos(za) * mr, y + Math.sin(za) * mr, { size: 14, color: '#f6efff', stroke: false });
      }
    }
    ctx.restore();
  }

  // ---------- 武器特效(玩家放出: 白色前緣細線 + 極淡填) ----------
  function drawWeaponFx(ctx, s) {
    s = obj(s);
    var x = num(s.x, 0), y = num(s.y, 0), a = num(s.angle, 0);
    var shape = pick(s.shape, ['arc', 'circle', 'line', 'dash'], 'arc');
    var skill = s.move === 'skill';
    var p = ratio(s.t, s.dur);
    var edge = skill ? P.playerSkill : P.playerFx;
    var alpha = 1 - p * 0.85;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    if (shape === 'arc') {
      var R = Math.max(1, num(s.radius, 70)), sp = num(s.spread, 1.745);
      var sw = Math.min(1, p * 3 + 0.25);
      var a0 = a - sp / 2, a1 = a0 + sp * sw;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, R, a0, a1); ctx.closePath();
      ctx.fillStyle = hexA(edge, skill ? 0.28 : 0.18); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, R, a0, a1); ctx.strokeStyle = P.ink; ctx.lineWidth = skill ? 9 : 7; ctx.stroke();
      ctx.strokeStyle = edge; ctx.lineWidth = skill ? 5 : 4; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, R * 0.8, a0, a1); ctx.strokeStyle = hexA(edge, 0.5); ctx.lineWidth = 2; ctx.stroke();
      if (skill && s.weapon === 'sword') { for (var i = 0; i < 3; i++) { var sa = a - sp / 3 + i * sp / 3; star(ctx, x + Math.cos(sa) * R * 0.6, y + Math.sin(sa) * R * 0.6, 6, '#ffe96a'); } }
    } else if (shape === 'circle') {
      var CR = Math.max(1, num(s.radius, 100)), cr = CR * (0.7 + 0.3 * Math.min(1, p * 3));
      circle(ctx, x, y, cr); ctx.fillStyle = hexA(edge, 0.15); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 7; ctx.stroke(); ctx.strokeStyle = edge; ctx.lineWidth = 4; ctx.stroke();
    } else if (shape === 'line') {
      var len = Math.max(1, num(s.length, 170)), wd = Math.max(1, num(s.width, 40));
      var ext = len * Math.min(1, p * 3 + 0.3);
      ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = hexA(edge, 0.18); ctx.fillRect(0, -wd / 2, ext, wd);
      ctx.beginPath(); ctx.moveTo(0, -wd / 2); ctx.lineTo(ext - wd / 2, -wd / 2); ctx.lineTo(ext, 0); ctx.lineTo(ext - wd / 2, wd / 2); ctx.lineTo(0, wd / 2);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = edge; ctx.lineWidth = 3.5; ctx.stroke();
    } else { // dash
      var dl = Math.max(1, num(s.length, 220));
      ctx.translate(x, y); ctx.rotate(a);
      for (var g = 0; g < 4; g++) {
        var gx = dl * g / 3;
        circle(ctx, gx, 0, 16); ctx.fillStyle = hexA('#bfe8ff', 0.12 + 0.12 * g); ctx.fill();
      }
      ctx.strokeStyle = edge; ctx.lineWidth = 3;
      for (var k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(0, k * 12); ctx.lineTo(dl, k * 12); ctx.stroke(); }
    }
    ctx.restore();
  }

  // ---------- 卡片共用 ----------
  function cardBase(ctx, w, h, selected, fill) {
    rr(ctx, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 14);
    fillStroke(ctx, fill || P.panel, P.frame, 2);
    if (selected) {
      rr(ctx, -w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 15);
      ctx.strokeStyle = P.select; ctx.lineWidth = 4; ctx.stroke();
    }
  }
  function dungeonScene(ctx, dun, w, h) {
    var c = DUN[dun].c;
    ctx.save();
    rr(ctx, -w / 2, -h / 2, w, h, 10); ctx.clip();
    if (dun === 'bamboo') {
      ctx.fillStyle = '#2c4a2a'; ctx.fillRect(-w / 2, -h / 2, w, h);
      for (var i = 0; i < 9; i++) {
        var bx = -w / 2 + 18 + i * (w - 36) / 8;
        ctx.fillStyle = i % 2 ? '#5e9a3e' : '#4b8434'; ctx.fillRect(bx - 5, -h / 2, 10, h);
        ctx.fillStyle = '#2c4a2a'; ctx.fillRect(bx - 5, -h / 2 + 20 + (i % 3) * 14, 10, 2);
      }
    } else if (dun === 'volcano') {
      ctx.fillStyle = '#3a2228'; ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.beginPath(); ctx.moveTo(-w / 2, h / 2); ctx.lineTo(-30, -h / 2 + 24); ctx.lineTo(30, -h / 2 + 24); ctx.lineTo(w / 2, h / 2); ctx.closePath(); ctx.fillStyle = '#5b3a33'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-30, -h / 2 + 24); ctx.lineTo(-12, -h / 2 + 46); ctx.lineTo(0, -h / 2 + 34); ctx.lineTo(14, -h / 2 + 50); ctx.lineTo(30, -h / 2 + 24); ctx.closePath(); ctx.fillStyle = '#ff7a2a'; ctx.fill();
      ell(ctx, w / 2 - 60, h / 2 - 14, 46, 12); ctx.fillStyle = '#2f8f9a'; ctx.fill();
    } else {
      ctx.fillStyle = '#1b1c3e'; ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = '#ffffff';
      for (var s2 = 0; s2 < 14; s2++) { circle(ctx, -w / 2 + (s2 * 67) % w, -h / 2 + (s2 * 31) % h, 1.5); ctx.fill(); }
      rr(ctx, -18, -h / 2 + 18, 36, h, 4); ctx.fillStyle = '#4a4690'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-24, -h / 2 + 20); ctx.lineTo(0, -h / 2 + 4); ctx.lineTo(24, -h / 2 + 20); ctx.closePath(); ctx.fillStyle = '#6a66b8'; ctx.fill();
    }
    ctx.restore();
    rr(ctx, -w / 2, -h / 2, w, h, 10); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke();
  }
  function lockIcon(ctx, x, y, s) {
    ctx.beginPath(); ctx.arc(x, y - s * 0.25, s * 0.32, Math.PI, 0); ctx.strokeStyle = '#c8c0d6'; ctx.lineWidth = s * 0.12; ctx.stroke();
    rr(ctx, x - s * 0.45, y - s * 0.25, s * 0.9, s * 0.7, s * 0.12); fillStroke(ctx, '#c8c0d6', P.ink, 2);
    circle(ctx, x, y + 0.05 * s, s * 0.1); ctx.fillStyle = P.ink; ctx.fill();
  }

  function drawDungeonCard(ctx, s) {
    s = obj(s);
    var x = num(s.x, 0), y = num(s.y, 0), dun = pick(s.dungeon, ['bamboo', 'volcano', 'tower'], 'bamboo');
    var open = bool(s.open), sel = bool(s.selected), d = DUN[dun];
    ctx.save(); ctx.translate(x, y);
    cardBase(ctx, 360, 440, sel, sel ? P.panel2 : P.panel);
    ctx.save(); ctx.translate(0, -138); dungeonScene(ctx, dun, 320, 140); ctx.restore();
    txt(ctx, d.name, 0, -50, { size: 32, color: d.c });
    for (var i = 0; i < 2; i++) {
      var mx = i ? 78 : -78;
      circle(ctx, mx, 22, 44); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
      ctx.save(); ctx.translate(mx, 24); var sc = d.mons[i] === 'owl' ? 1.05 : 1.25; ctx.scale(sc, sc);
      monsterBody(ctx, d.mons[i], { dir: i ? -1 : 1 }); ctx.restore();
      txt(ctx, SP[d.mons[i]].name, mx, 84, { size: 18 });
    }
    if (!open) {
      rr(ctx, -176, -216, 352, 330, 14); ctx.fillStyle = 'rgba(18,13,24,0.55)'; ctx.fill();
      lockIcon(ctx, 0, 130, 34);
      wrap(ctx, str(s.condition), 0, 182, 300, 22, 2, { size: 18, color: P.text });
    } else {
      rr(ctx, -70, 130, 140, 40, 20); fillStroke(ctx, hexA(P.ok, 0.2), P.ok, 2.5);
      txt(ctx, '已開放', 0, 151, { size: 20, color: P.ok, stroke: false });
    }
    ctx.restore();
  }

  function levelPips(ctx, x, y, level, r) {
    for (var i = 0; i < 3; i++) {
      circle(ctx, x + (i - 1) * r * 3, y, r);
      fillStroke(ctx, i < level ? P.gold : '#3a3046', P.ink, 1.5);
    }
  }
  function drawRosterCard(ctx, s) {
    s = obj(s);
    var x = num(s.x, 0), y = num(s.y, 0), sp = spc(s.species), lv = clamp(Math.round(num(s.level, 0)), 0, 3);
    var picked = bool(s.picked), sel = bool(s.selected);
    ctx.save(); ctx.translate(x, y);
    cardBase(ctx, 180, 240, sel, picked ? '#2f3a34' : P.panel);
    if (picked) { rr(ctx, -84, -114, 168, 228, 12); ctx.strokeStyle = P.ok; ctx.lineWidth = 3; ctx.stroke(); }
    circle(ctx, 0, -30, 52); ctx.fillStyle = hexA(SP[sp].c, 0.15); ctx.fill();
    ctx.save(); ctx.translate(0, -26); var sc = sp === 'owl' ? 1.25 : 1.45; ctx.scale(sc, sc); monsterBody(ctx, sp, { dir: 1, eyes: picked ? 'happy' : 'normal' }); ctx.restore();
    txt(ctx, SP[sp].name, 0, 48, { size: 22 });
    txt(ctx, 'Lv ' + lv, -22, 80, { size: 18, color: P.gold });
    levelPips(ctx, 34, 80, lv, 5);
    if (picked) {
      rr(ctx, -40, 94, 80, 20, 10); fillStroke(ctx, P.ok, P.ink, 2);
      txt(ctx, '上場', 0, 104, { size: 14, color: '#10301a', stroke: false });
    }
    ctx.restore();
  }

  // ---------- 器材圖示 ----------
  function deviceIcon(ctx, d, size) {
    var k = (size || 40) / 40;
    ctx.save(); ctx.scale(k, k); ctx.lineJoin = 'round';
    if (d === 'spotlight') {
      ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(6, -8); ctx.lineTo(18, 16); ctx.lineTo(-18, 16); ctx.closePath(); ctx.fillStyle = 'rgba(255,243,196,0.55)'; ctx.fill();
      ell(ctx, 0, 16, 18, 4); ctx.fillStyle = P.light; ctx.fill();
      rr(ctx, -9, -19, 18, 13, 3); fillStroke(ctx, '#55505f', P.ink, 2);
      ell(ctx, 0, -6, 7, 2.5); ctx.fillStyle = '#fff8d8'; ctx.fill();
    } else if (d === 'mist') {
      ctx.beginPath(); ctx.arc(-9, 2, 9, 0, TAU); ctx.arc(2, -5, 11, 0, TAU); ctx.arc(11, 4, 8, 0, TAU); ctx.fillStyle = P.calm; ctx.fill();
      ctx.beginPath(); ctx.arc(-9, 2, 9, 0, TAU); ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(2, -5, 11, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(11, 4, 8, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(-9, 2, 7.5, 0, TAU); ctx.arc(2, -5, 9.5, 0, TAU); ctx.arc(11, 4, 6.5, 0, TAU); ctx.fillStyle = '#d8f1ff'; ctx.fill();
      ctx.strokeStyle = P.calm; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-6, 13); ctx.lineTo(-8, 18); ctx.moveTo(4, 13); ctx.lineTo(2, 18); ctx.stroke();
    } else if (d === 'firecracker') {
      for (var i = -1; i <= 1; i++) {
        rr(ctx, i * 9 - 4, -8 + Math.abs(i) * 3, 8, 22, 2); fillStroke(ctx, P.ignite, P.ink, 2);
        ctx.fillStyle = '#7a2a12'; ctx.fillRect(i * 9 - 4, -1 + Math.abs(i) * 3, 8, 3);
      }
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.quadraticCurveTo(4, -15, 10, -14); ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.stroke();
      star(ctx, 12, -15, 5, '#ffe96a');
    } else if (d === 'jar') {
      ctx.beginPath(); ctx.moveTo(-15, 14); ctx.lineTo(-15, -2); ctx.quadraticCurveTo(-15, -16, 0, -16); ctx.quadraticCurveTo(15, -16, 15, -2); ctx.lineTo(15, 14);
      ctx.fillStyle = 'rgba(200,235,255,0.3)'; ctx.fill(); ctx.strokeStyle = '#d4f0ff'; ctx.lineWidth = 2.5; ctx.stroke();
      circle(ctx, 0, -18, 3.5); fillStroke(ctx, '#d4f0ff', P.ink, 1.5);
      rr(ctx, -19, 13, 38, 5, 2); fillStroke(ctx, '#8aa0b8', P.ink, 1.5);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-9, 6); ctx.lineTo(-9, -4); ctx.stroke();
    } else { // hook
      ctx.beginPath(); ctx.moveTo(0, -19); ctx.lineTo(0, -4); ctx.strokeStyle = '#c8c0d6'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, 6); ctx.arc(-6, 6, 6, 0, Math.PI); ctx.lineTo(-12, 2);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.stroke();
      ctx.strokeStyle = P.move; ctx.lineWidth = 4; ctx.stroke();
      circle(ctx, 0, -6, 3.5); fillStroke(ctx, '#55505f', P.ink, 1.5);
    }
    ctx.restore();
  }

  function catTag(ctx, d, x, y) {
    var info = DEV[d], c = CAT_COLOR[info.cat];
    rr(ctx, x - 30, y - 12, 60, 24, 12); fillStroke(ctx, hexA(c, 0.2), c, 2);
    txt(ctx, info.cat, x, y + 1, { size: 15, color: c, stroke: false });
  }

  function drawDeviceSlot(ctx, s) {
    s = obj(s);
    var x = num(s.x, 0), y = num(s.y, 0), key = pick(s.key, ['z', 'x'], 'z'), d = dev(s.device), info = DEV[d];
    var K = key.toUpperCase();
    ctx.save(); ctx.translate(x, y);
    rr(ctx, -176, -71, 352, 142, 16); fillStroke(ctx, '#1f1929', '#5a4e6e', 3);
    // 控制台面板質感: 螺絲
    ctx.fillStyle = '#5a4e6e';
    circle(ctx, -164, -59, 3); ctx.fill(); circle(ctx, 164, -59, 3); ctx.fill(); circle(ctx, -164, 59, 3); ctx.fill(); circle(ctx, 164, 59, 3); ctx.fill();
    keyCap(ctx, -120, -10, K, 64, { face: '#ece6f4' });
    txt(ctx, K + ' 鍵', -120, 46, { size: 18, color: P.textDim });
    rr(ctx, -66, -52, 226, 104, 12); ctx.fillStyle = hexA(CAT_COLOR[info.cat], 0.1); ctx.fill();
    ctx.save(); ctx.translate(-22, -2); deviceIcon(ctx, d, 64); ctx.restore();
    txt(ctx, info.name, 76, -16, { size: 28, maxW: 140 });
    catTag(ctx, d, 76, 24);
    ctx.restore();
  }

  function drawDeviceCard(ctx, s) {
    s = obj(s);
    var x = num(s.x, 0), y = num(s.y, 0), d = dev(s.device), info = DEV[d], sel = bool(s.selected);
    var slot = pick(s.slot, ['z', 'x', ''], '');
    ctx.save(); ctx.translate(x, y);
    cardBase(ctx, 220, 240, sel, sel ? P.panel2 : P.panel);
    rr(ctx, -98, -108, 196, 84, 10); ctx.fillStyle = hexA(CAT_COLOR[info.cat], 0.12); ctx.fill();
    ctx.save(); ctx.translate(0, -66); deviceIcon(ctx, d, 64); ctx.restore();
    txt(ctx, info.name, 0, -6, { size: 24 });
    catTag(ctx, d, 0, 26);
    wrap(ctx, info.desc, 0, 64, 184, 18, 2, { size: 14, color: P.textDim });
    bolt(ctx, -56, 98, 16, P.gold);
    txt(ctx, info.cost, 8, 98, { size: 15, color: P.gold, maxW: 120 });
    if (slot) {
      keyCap(ctx, -80, -88, slot.toUpperCase(), 32, { face: P.select });
    }
    ctx.restore();
  }

  // ---------- 表演中: 準星 ----------
  function drawCursor(ctx, s) {
    s = obj(s);
    var x = num(s.x, 0), y = num(s.y, 0);
    var zd = dev(s.zDevice), xd = dev(s.xDevice);
    var zr = Math.max(0, num(s.zRange, 100)), xr = Math.max(0, num(s.xRange, 100));
    var holding = pick(s.holding, ['z', 'x', ''], ''), hooking = bool(s.hooking);
    ctx.save(); ctx.translate(x, y);
    // 兩個鍵的作用範圍: Z = 長虛線, X = 短點線; 顏色 = 器材類別色; 按住中的那個實線加亮
    var rings = [['z', zd, zr, [14, 8]], ['x', xd, xr, [3, 6]]];
    for (var i = 0; i < 2; i++) {
      var rg = rings[i], active = holding === rg[0], c = CAT_COLOR[DEV[rg[1]].cat];
      if (rg[2] <= 0) continue;
      circle(ctx, 0, 0, rg[2]);
      if (active) {
        ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.stroke();
        ctx.strokeStyle = c; ctx.lineWidth = 3.5; ctx.stroke();
      } else {
        ctx.setLineDash(rg[3]); ctx.strokeStyle = 'rgba(18,13,24,0.6)'; ctx.lineWidth = 4; ctx.stroke();
        ctx.strokeStyle = hexA(c, 0.85); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
      }
    }
    // 準星本體
    var g = hooking ? 14 : 20, L = 9;
    ctx.lineCap = 'round';
    for (var pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass ? '#ffffff' : P.ink; ctx.lineWidth = pass ? 3.5 : 7;
      for (var q = 0; q < 4; q++) {
        var sx = q % 2 ? 1 : -1, sy = q < 2 ? -1 : 1;
        ctx.beginPath(); ctx.moveTo(sx * g, sy * (g - L)); ctx.lineTo(sx * g, sy * g); ctx.lineTo(sx * (g - L), sy * g); ctx.stroke();
      }
    }
    if (hooking) {
      ctx.save(); ctx.translate(0, 2); deviceIcon(ctx, 'hook', 22); ctx.restore();
    } else {
      circle(ctx, 0, 0, 4); fillStroke(ctx, '#ffffff', P.ink, 2);
    }
    ctx.restore();
  }

  // ---------- 器材特效 ----------
  function domePath(ctx, hw, top, base) {
    ctx.beginPath(); ctx.moveTo(-hw, base); ctx.lineTo(-hw, top + hw * 0.7);
    ctx.quadraticCurveTo(-hw, top, 0, top); ctx.quadraticCurveTo(hw, top, hw, top + hw * 0.7); ctx.lineTo(hw, base);
  }
  function puff(ctx, x, y, r, a) {
    circle(ctx, x, y, r); ctx.fillStyle = 'rgba(216,241,255,' + a + ')'; ctx.fill();
  }
  function drawDeviceFx(ctx, s) {
    s = obj(s);
    var x = num(s.x, 0), y = num(s.y, 0);
    var kind = pick(s.kind, ['spot', 'mistWarn', 'mistBurst', 'fireWarn', 'fireBurst', 'jarDrop', 'hookRope'], 'spot');
    var R = Math.max(0, num(s.radius, 100)), p = ratio(s.t, s.dur);
    ctx.save();
    if (kind === 'spot') {
      var top = 50;
      ctx.beginPath(); ctx.moveTo(x - 16, top); ctx.lineTo(x + 16, top); ctx.lineTo(x + R * 0.95, y); ctx.lineTo(x - R * 0.95, y); ctx.closePath();
      var g = ctx.createLinearGradient(0, top, 0, y);
      g.addColorStop(0, 'rgba(255,243,196,0.28)'); g.addColorStop(1, 'rgba(255,243,196,0.08)');
      ctx.fillStyle = g; ctx.fill();
      circle(ctx, x, y, R); ctx.fillStyle = 'rgba(255,243,196,0.16)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,243,196,0.85)'; ctx.lineWidth = 2.5; ctx.stroke();
      rr(ctx, x - 14, top - 14, 28, 16, 4); fillStroke(ctx, '#55505f', P.ink, 2);
    } else if (kind === 'mistWarn' || kind === 'fireWarn') {
      var c = kind === 'mistWarn' ? P.calm : P.ignite;
      circle(ctx, x, y, R); ctx.fillStyle = hexA(c, 0.08); ctx.fill();
      ctx.setLineDash([10, 7]); ctx.strokeStyle = hexA(c, 0.95); ctx.lineWidth = 2.5; ctx.stroke(); ctx.setLineDash([]);
      circle(ctx, x, y, R * p); ctx.fillStyle = hexA(c, 0.22); ctx.fill();
      if (kind === 'mistWarn') {
        for (var i = 0; i < 6; i++) { var a = i / 6 * TAU + p * 2; puff(ctx, x + Math.cos(a) * 20 * (1 - p), y + Math.sin(a) * 20 * (1 - p), 9, 0.55); }
      } else {
        ctx.save(); ctx.translate(x, y); deviceIcon(ctx, 'firecracker', 36); ctx.restore();
        var fl = Math.floor(now() * 16) % 2;
        star(ctx, x + 12, y - 16 - fl * 2, 5 + fl * 2, '#ffe96a');
      }
    } else if (kind === 'mistBurst') {
      var mr = R * (0.55 + 0.45 * p), ma = 0.42 * (1 - p);
      for (var j = 0; j < 10; j++) { var ja = j / 10 * TAU; puff(ctx, x + Math.cos(ja) * mr * 0.8, y + Math.sin(ja) * mr * 0.8, R * 0.22, ma); }
      circle(ctx, x, y, mr); ctx.strokeStyle = hexA(P.calm, 0.8 * (1 - p)); ctx.lineWidth = 3; ctx.stroke();
    } else if (kind === 'fireBurst') {
      var br = R * (0.4 + 0.6 * p);
      circle(ctx, x, y, br); ctx.strokeStyle = P.ink; ctx.lineWidth = 9 * (1 - p) + 2; ctx.stroke();
      ctx.strokeStyle = P.ignite; ctx.lineWidth = 6 * (1 - p) + 1; ctx.stroke();
      for (var k = 0; k < 8; k++) {
        var ka = k / 8 * TAU + 0.2;
        star(ctx, x + Math.cos(ka) * br * 0.75, y + Math.sin(ka) * br * 0.75, 6 * (1 - p) + 2, k % 2 ? '#ffe96a' : P.ignite);
      }
    } else if (kind === 'jarDrop') {
      var hw = Math.max(10, R * 0.55), dy = -90 * (1 - p) * (1 - p);
      ctx.translate(x, y + dy);
      domePath(ctx, hw, -40, 26); ctx.fillStyle = 'rgba(200,235,255,0.2)'; ctx.fill();
      ctx.strokeStyle = '#d4f0ff'; ctx.lineWidth = 3; ctx.stroke();
      if (p > 0.85) { ctx.translate(0, -dy); ell(ctx, 0, 28, hw + 10, 6); ctx.strokeStyle = 'rgba(212,240,255,0.7)'; ctx.lineWidth = 2; ctx.stroke(); }
    } else { // hookRope
      var ty = 50;
      ctx.beginPath(); ctx.moveTo(x, ty); ctx.lineTo(x, y - 26);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#c8c0d6'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.save(); ctx.translate(x, y - 22); deviceIcon(ctx, 'hook', 22); ctx.restore();
    }
    ctx.restore();
  }

  // ---------- 控制台面板 ----------
  function drawControlPanel(ctx, s) {
    s = obj(s);
    var cx = num(s.x, 640), cy = num(s.y, 691);
    var emax = Math.max(1, num(s.energyMax, 100)), e = clamp(num(s.energy, emax), 0, emax);
    var zd = dev(s.zDevice), xd = dev(s.xDevice);
    var st = ['ready', 'active', 'cooldown', 'lowPower'];
    var zs = pick(s.zState, st, 'ready'), xs = pick(s.xState, st, 'ready');
    ctx.save(); ctx.translate(cx - 640, cy - 25);
    rr(ctx, 2, 1, 1276, 48, 10); fillStroke(ctx, '#1f1929', '#5a4e6e', 2);
    // 電力
    bolt(ctx, 24, 25, 20, P.gold);
    txt(ctx, '電力', 58, 25, { size: 18 });
    var bx = 88, bw = 380, frac = e / emax;
    rr(ctx, bx, 15, bw, 20, 6); fillStroke(ctx, '#0e0a14', P.ink, 2);
    if (frac > 0) { rr(ctx, bx + 2, 17, (bw - 4) * frac, 16, 5); ctx.fillStyle = frac < 0.25 ? '#ff9a4a' : P.gold; ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
    ctx.beginPath(); for (var t = 1; t < 10; t++) { ctx.moveTo(bx + bw * t / 10, 17); ctx.lineTo(bx + bw * t / 10, 33); } ctx.stroke();
    // 按一下型器材的消耗刻度(電力低於刻度 = 這個鍵按了不反應)
    var keys = [[zd, 'Z'], [xd, 'X']];
    for (var i = 0; i < 2; i++) {
      var need = DEV[keys[i][0]].need;
      if (need > 0) {
        var tx = bx + bw * need / emax;
        ctx.beginPath(); ctx.moveTo(tx, 12); ctx.lineTo(tx, 38); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
        txt(ctx, keys[i][1], tx, 6, { size: 10, color: '#ffffff' });
      }
    }
    txt(ctx, String(Math.round(e)), bx + bw + 24, 25, { size: 18, color: P.gold });
    // Z / X 模組
    function module(mx, key, d, state) {
      var info = DEV[d], c = CAT_COLOR[info.cat];
      var active = state === 'active', low = state === 'lowPower', cd = state === 'cooldown';
      rr(ctx, mx, 5, 340, 40, 10);
      fillStroke(ctx, active ? hexA(c, 0.28) : '#2a2236', active ? c : (low ? '#5a4e6e' : '#4a3f5c'), active ? 3 : 2);
      keyCap(ctx, mx + 26, 25, key, 30, { pressed: active, dim: low || cd, glow: active ? c : null });
      if (low) {
        ctx.beginPath(); ctx.moveTo(mx + 12, 39); ctx.lineTo(mx + 40, 11); ctx.strokeStyle = P.danger; ctx.lineWidth = 3; ctx.stroke();
      }
      ctx.save(); ctx.globalAlpha = (low || cd) ? 0.45 : 1; ctx.translate(mx + 70, 25); deviceIcon(ctx, d, 30); ctx.restore();
      txt(ctx, info.name, mx + 96, 25, { size: 18, align: 'left', color: (low || cd) ? P.textDim : P.text, maxW: 90 });
      var label = active ? (d === 'hook' ? '吊著' : '照射中') : low ? '電力不足' : cd ? '冷卻' : '可用';
      var lc = active ? c : low ? P.danger : cd ? P.textDim : P.ok;
      txt(ctx, label, mx + 290, 25, { size: 15, color: lc });
      if (cd) {
        // 冷卻: 鍵帽上一道斜紋
        ctx.save(); ctx.globalAlpha = 0.6; rr(ctx, mx + 11, 10, 30, 30, 7); ctx.clip();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; var off = (now() * 40) % 10;
        ctx.beginPath(); for (var k = -4; k < 6; k++) { ctx.moveTo(mx + 11 + k * 10 + off, 40); ctx.lineTo(mx + 31 + k * 10 + off, 10); } ctx.stroke(); ctx.restore();
      }
    }
    module(560, 'Z', zd, zs);
    module(920, 'X', xd, xs);
    ctx.restore();
  }

  function drawDeviceName(ctx, s) {
    s = obj(s);
    var x = num(s.x, 0), y = num(s.y, 0), d = dev(s.device), p = ratio(s.t, s.dur || 0.6);
    if (num(s.dur, 0.6) > 0 && num(s.t, 0) >= num(s.dur, 0.6)) return;
    ctx.save();
    ctx.globalAlpha = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
    txt(ctx, DEV[d].name, x, y - 36 - 22 * p, { size: 20, color: CAT_COLOR[DEV[d].cat], sw: 5 });
    ctx.restore();
  }

  // ---------- 表演場 ----------
  function drawShowArena(ctx) {
    ctx.save();
    ctx.fillStyle = '#140f1b'; ctx.fillRect(0, 0, 1280, 720);
    // 觀眾席
    var stands = [[56, 80], [582, 80]];
    for (var i = 0; i < 2; i++) {
      var sy = stands[i][0], sh = stands[i][1];
      ctx.fillStyle = P.stands; ctx.fillRect(0, sy, 1280, sh);
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      for (var r = 0; r < 3; r++) ctx.fillRect(0, sy + 8 + r * 26, 1280, 3);
    }
    // 場地
    var g = ctx.createRadialGradient(640, 356, 60, 640, 356, 640);
    g.addColorStop(0, '#5a4031'); g.addColorStop(1, '#3a291f');
    ctx.fillStyle = g; ctx.fillRect(60, 146, 1160, 420);
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 2;
    ctx.beginPath(); for (var k = 1; k < 14; k++) { ctx.moveTo(60, 146 + k * 30); ctx.lineTo(1220, 146 + k * 30); } ctx.stroke();
    ell(ctx, 640, 356, 150, 90); ctx.strokeStyle = 'rgba(255,233,168,0.12)'; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = '#2a1d16'; ctx.lineWidth = 3; ctx.strokeRect(60, 146, 1160, 420);
    // 兩側布幕
    ctx.fillStyle = '#4a1a2a'; ctx.fillRect(0, 140, 60, 432); ctx.fillRect(1220, 140, 60, 432);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
    ctx.beginPath(); for (var c = 0; c < 4; c++) { ctx.moveTo(10 + c * 14, 140); ctx.lineTo(10 + c * 14, 572); ctx.moveTo(1230 + c * 14, 140); ctx.lineTo(1230 + c * 14, 572); } ctx.stroke();
    ctx.restore();
  }

  function rageBar(ctx, cy, w, h, rage, redLow, marks, mode) {
    var x0 = -w / 2;
    rr(ctx, x0, cy, w, h, 4); fillStroke(ctx, '#0e0a14', P.ink, 2);
    var rx = x0 + w * redLow / 100;
    ctx.fillStyle = P.dangerDark; ctx.fillRect(rx, cy + 1.5, x0 + w - rx - 1.5, h - 3);
    var loose = mode === 'charge' || mode === 'loose';
    var fw = (w - 3) * (loose ? 1 : rage / 100);
    var col = (loose || marks > 0) ? P.danger : rage >= redLow ? P.rageRed : rage >= 50 ? P.rageShow : P.rageLow;
    if (fw > 0) { ctx.fillStyle = col; ctx.fillRect(x0 + 1.5, cy + 1.5, fw, h - 3); }
    if (loose) {
      ctx.save(); ctx.beginPath(); ctx.rect(x0 + 1.5, cy + 1.5, w - 3, h - 3); ctx.clip();
      ctx.strokeStyle = 'rgba(18,13,24,0.55)'; ctx.lineWidth = 3;
      ctx.beginPath(); for (var i = -2; i < 14; i++) { ctx.moveTo(x0 + i * 9, cy + h); ctx.lineTo(x0 + i * 9 + h, cy); } ctx.stroke(); ctx.restore();
    }
    // 紅區起點刻度(紅) + 表演門檻 50(白)
    ctx.beginPath(); ctx.moveTo(rx, cy - 2); ctx.lineTo(rx, cy + h + 1); ctx.strokeStyle = P.danger; ctx.lineWidth = 2.5; ctx.stroke();
    var tx = x0 + w * 0.5;
    ctx.beginPath(); ctx.moveTo(tx, cy + 1); ctx.lineTo(tx, cy + h - 1); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
    if (marks > 0 && !loose) {
      rr(ctx, x0 - 1, cy - 1, w + 2, h + 2, 5);
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * Math.sin(now() * 10)) + ')'; ctx.lineWidth = 2; ctx.stroke();
    }
  }

  function drawShowMonster(ctx, s) {
    s = obj(s);
    var x = num(s.x, 0), y = num(s.y, 0), sp = spc(s.species), owl = sp === 'owl';
    var half = owl ? 60 : 48, k = owl ? 1.3 : 1, dir = num(s.dir, 1) < 0 ? -1 : 1;
    var mode = pick(s.mode, ['roam', 'hooked', 'jarred', 'charge', 'loose'], 'roam');
    var rage = clamp(num(s.rage, 0), 0, 100), redLow = clamp(num(s.redLow, 80), 0, 100);
    var marks = clamp(Math.round(num(s.marks, 0)), 0, 4);
    var move = pick(s.move, ['walk', 'crouch', 'pounce', 'charge', 'rest'], 'walk');
    var mp = ratio(s.moveT, s.moveDur);
    var lit = bool(s.lit), fx = pick(s.fx, ['none', 'ignited', 'doused'], 'none'), fp = ratio(s.fxT, s.fxDur || 0.5);
    var performing = bool(s.performing), pp = ratio(s.performT, s.performDur || 0.5);
    var loose = mode === 'charge' || mode === 'loose';
    var lv = clamp(Math.round(num(s.level, 0)), 0, 3);
    var bodyY = -6;
    ctx.save(); ctx.translate(x, y);
    // 撞欄震動
    var shake = 0;
    if (mode === 'charge' && num(s.chargeT, 0) > 0) shake = Math.sin(now() * 60) * 2;
    var lift = 0; // 被吊: 靠影子縮小 + 擺動表達離地, 本體不上移(上緣已貼框)
    // 地面: 影子 / 聚光燈下的亮圈
    ell(ctx, 0, 22 * k, (mode === 'hooked' ? 15 : 22) * k, 5.5 * k); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill();
    if (lit) { ell(ctx, 0, 22 * k, 34 * k, 9 * k); ctx.fillStyle = 'rgba(255,243,196,0.35)'; ctx.fill(); }
    // 表演: 種類色地面光環外擴
    if (performing) {
      var pr = (20 + 20 * pp) * k;
      ell(ctx, 0, 22 * k - 2, pr, pr * 0.35); ctx.strokeStyle = hexA(SP[sp].c, 1 - pp); ctx.lineWidth = 4; ctx.stroke();
    }
    // 失控光環(紅虛線)
    if (loose) {
      circle(ctx, 0, bodyY * k, (32 + Math.sin(now() * 12) * 2) * k);
      ctx.setLineDash([6, 5]); ctx.strokeStyle = P.danger; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
    }
    // 被照亮: 暖白光環貼著外緣
    if (lit) {
      circle(ctx, 0, bodyY * k, 30 * k); ctx.strokeStyle = 'rgba(255,243,196,0.9)'; ctx.lineWidth = 3; ctx.stroke();
      circle(ctx, 0, bodyY * k, 34 * k); ctx.strokeStyle = 'rgba(255,243,196,0.35)'; ctx.lineWidth = 4; ctx.stroke();
    }
    ctx.save();
    ctx.translate(shake, bodyY * k + lift);
    if (mode === 'hooked') ctx.rotate(Math.sin(now() * 5) * 0.06);
    ctx.scale(k, k);
    poseExtras(ctx, mode === 'charge' ? 'charge' : move, mp, dir, 1);
    poseTransform(ctx, mode === 'charge' ? 'charge' : move, mp, dir);
    if (performing) { var pop = 1 + 0.12 * Math.sin(Math.PI * pp); ctx.scale(pop, pop); }
    var ek = loose ? 'angry' : (rage >= redLow ? 'angry' : 'normal');
    if (mode === 'jarred') ek = 'normal';
    monsterBody(ctx, sp, { dir: dir, eyes: ek });
    if (fx === 'doused' && fp < 1) { circle(ctx, 0, 0, 25); ctx.fillStyle = 'rgba(127,208,255,' + (0.3 * (1 - fp)) + ')'; ctx.fill(); }
    ctx.restore();
    // 被點燃(往上竄的火舌) / 被澆熄(往下落的水滴)
    if (fx === 'ignited' && !lit && fp < 1) {
      ctx.save(); ctx.globalAlpha = 1 - fp;
      for (var f = -1; f <= 1; f++) {
        var fa = -Math.PI / 2 + f * 0.75, fr = 24 * k;
        var fxp = Math.cos(fa) * fr, fyp = bodyY * k + Math.sin(fa) * fr - 6 * fp;
        ctx.beginPath(); ctx.moveTo(fxp, fyp - 11); ctx.quadraticCurveTo(fxp + 7, fyp, fxp, fyp + 4); ctx.quadraticCurveTo(fxp - 7, fyp, fxp, fyp - 11);
        fillStroke(ctx, P.ignite, P.ink, 2);
        circle(ctx, fxp, fyp - 1, 2.5); ctx.fillStyle = '#ffe96a'; ctx.fill();
      }
      ctx.restore();
    } else if (fx === 'doused' && fp < 1) {
      ctx.save(); ctx.globalAlpha = 1 - fp;
      var dxs = [-30, -18, 18, 30];
      for (var d = 0; d < 4; d++) {
        var dxp = dxs[d] * k * 0.95, dyp = (-28 + 34 * fp + (d % 2) * 8) * k;
        ctx.beginPath(); ctx.moveTo(dxp, dyp - 7); ctx.quadraticCurveTo(dxp + 5, dyp + 1, dxp, dyp + 4); ctx.quadraticCurveTo(dxp - 5, dyp + 1, dxp, dyp - 7);
        fillStroke(ctx, P.calm, P.ink, 1.8);
      }
      ctx.restore();
    }
    // 玻璃罩
    if (mode === 'jarred') {
      var jr = 1 - ratio(s.jarT, s.jarDur || 3);
      var hw = 32 * k, top = -42 * k, base = 24 * k;
      domePath(ctx, hw, top, base); ctx.fillStyle = 'rgba(200,235,255,0.22)'; ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#d4f0ff'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-hw * 0.55, base - 10); ctx.lineTo(-hw * 0.55, top + 18); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.stroke();
      rr(ctx, -hw - 3, base - 3, hw * 2 + 6, 7, 3); fillStroke(ctx, '#2a3340', P.ink, 1.5);
      if (jr > 0) { ctx.fillStyle = P.calm; ctx.fillRect(-hw - 1.5, base - 1.5, (hw * 2 + 3) * jr, 4); }
    }
    // 撞欄衝擊
    if (mode === 'charge' && num(s.chargeT, 0) > 0) {
      var up = y < 356 ? -1 : 1;
      for (var st = -1; st <= 1; st++) star(ctx, st * 16, up * 38 * k, 5 + (st === 0 ? 2 : 0), '#ffe96a');
    }
    // 怒氣條
    var bw = 90, bh = 12, by = half - 15;
    rageBar(ctx, by, bw, bh, rage, redLow, marks, mode);
    if (mode === 'loose') {
      var lr = 1 - ratio(s.looseT, s.looseDur || 6);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-bw / 2, by + bh + 0.5, bw * lr, 2);
    } else if (mode === 'charge') {
      var cr = ratio(s.chargeT, s.chargeDur || 1.5);
      if (cr > 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(-bw / 2, by + bh + 0.5, bw * cr, 2); }
    }
    // 失控標記: 5 格槽(滿 5 = 失控); 只在有標記時顯示
    if (marks > 0 && !loose) {
      var my = -half + 7, mr = 4.5, gap = 12;
      for (var m = 0; m < 5; m++) {
        var mx = (m - 2) * gap;
        circle(ctx, mx, my, mr);
        fillStroke(ctx, m < marks ? P.danger : 'rgba(18,13,24,0.75)', m < marks ? P.ink : 'rgba(255,74,74,0.6)', 1.8);
        if (m === marks - 1) {
          var ml = ratio(s.markLeft, s.markDur || 4);
          if (ml > 0) { ctx.beginPath(); ctx.arc(mx, my, mr + 2.5, -Math.PI / 2, -Math.PI / 2 + TAU * ml); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke(); }
        }
      }
    }
    txt(ctx, 'Lv' + lv, -bw / 2 + 2, by - 9, { size: 11, align: 'left', color: P.gold, sw: 3 });
    ctx.restore();
  }

  function drawFence(ctx, s) {
    s = obj(s);
    var x = num(s.x, 0), y = num(s.y, 0), broken = bool(s.broken);
    ctx.save(); ctx.translate(x, y);
    if (!broken) {
      ctx.fillStyle = P.fence; ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5;
      rr(ctx, -66, -5, 132, 4, 2); ctx.fill(); ctx.stroke();
      rr(ctx, -66, 2, 132, 4, 2); ctx.fill(); ctx.stroke();
      for (var i = 0; i < 4; i++) { rr(ctx, -64 + i * 41.3, -7, 8, 14, 2); fillStroke(ctx, '#8a6238', P.ink, 1.5); }
    } else {
      ctx.fillStyle = '#5e4630'; ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5;
      ctx.save(); ctx.translate(-66, 0); ctx.rotate(0.08); rr(ctx, 0, -5, 46, 4, 2); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(66, -1); ctx.rotate(-0.06); rr(ctx, -42, 0, 42, 4, 2); ctx.fill(); ctx.stroke(); ctx.restore();
      rr(ctx, -64, -7, 8, 14, 2); fillStroke(ctx, '#4a3624', P.ink, 1.5);
      rr(ctx, 56, -7, 8, 14, 2); fillStroke(ctx, '#4a3624', P.ink, 1.5);
      ctx.strokeStyle = '#8a6238'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-20, -4); ctx.lineTo(-14, 2); ctx.moveTo(-8, 4); ctx.lineTo(-2, -2); ctx.moveTo(8, -5); ctx.lineTo(14, 3); ctx.stroke();
      ctx.setLineDash([5, 4]); ctx.strokeStyle = hexA(P.danger, 0.8); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  }

  var SHIRTS = ['#7a6a9a', '#5f7f8f', '#8f6f5f', '#6f8f6a', '#8a5f7a', '#5f6a8f', '#8f855f', '#6a6a6a'];
  function drawVisitor(ctx, s) {
    s = obj(s);
    var x = num(s.x, 0), y = num(s.y, 0), side = pick(s.side, ['top', 'bottom'], 'top');
    var mode = pick(s.mode, ['watch', 'scared', 'empty'], 'watch');
    var idx = Math.abs(Math.round(x / 136)) % SHIRTS.length;
    ctx.save(); ctx.translate(x, y);
    // 座椅
    rr(ctx, -24, 4, 48, 30, 6); fillStroke(ctx, '#3d2c48', P.ink, 2);
    rr(ctx, -20, 26, 40, 8, 3); ctx.fillStyle = '#4e3a5c'; ctx.fill();
    if (mode === 'empty') { ctx.restore(); return; }
    var scared = mode === 'scared';
    var jx = scared ? Math.sin(now() * 40) * 2 : 0, lean = scared ? (side === 'top' ? -6 : 6) : 0;
    var bob = scared ? 0 : Math.sin(now() * 3 + idx) * 1.5;
    ctx.translate(jx, lean * 0.5 + bob);
    // 身體
    rr(ctx, -15, -6, 30, 32, 10); fillStroke(ctx, scared ? '#5a5268' : SHIRTS[idx], P.ink, 2);
    // 頭
    circle(ctx, 0, -18, 13); fillStroke(ctx, scared ? '#d8cfc4' : '#f0cfa8', P.ink, 2);
    ctx.fillStyle = '#4a3428'; ctx.beginPath(); ctx.arc(0, -21, 13, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
    if (scared) {
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
      circle(ctx, -4, -17, 2.5); ctx.stroke(); circle(ctx, 4, -17, 2.5); ctx.stroke();
      ell(ctx, 0, -10, 3, 3.5); ctx.fillStyle = P.ink; ctx.fill();
      // 舉手
      ctx.lineWidth = 4; ctx.strokeStyle = '#f0cfa8'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(-20, -24); ctx.moveTo(13, 0); ctx.lineTo(20, -24); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(22, -30); ctx.quadraticCurveTo(25, -25, 22, -22); ctx.quadraticCurveTo(19, -25, 22, -30); fillStroke(ctx, '#bfe8ff', P.ink, 1.2);
    } else {
      circle(ctx, -4, -17, 2); ctx.fillStyle = P.ink; ctx.fill(); circle(ctx, 4, -17, 2); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, -13, 4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 商店 ----------
  function itemIcon(ctx, item, size) {
    var k = size / 40;
    ctx.save(); ctx.scale(k, k);
    if (WEAPON[item]) { ctx.rotate(-Math.PI / 4); ctx.translate(-20, 0); weaponShape(ctx, item); }
    else if (DEV[item]) deviceIcon(ctx, item, 40);
    else if (item === 'attack') {
      ctx.rotate(-Math.PI / 4); ctx.translate(-22, 4); weaponShape(ctx, 'sword'); ctx.rotate(Math.PI / 4);
      txt(ctx, '+1', 26, -8, { size: 16, color: P.gold });
    } else if (item === 'armor') {
      ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(16, -12); ctx.lineTo(14, 6); ctx.quadraticCurveTo(8, 16, 0, 20); ctx.quadraticCurveTo(-8, 16, -14, 6); ctx.lineTo(-16, -12); ctx.closePath();
      fillStroke(ctx, '#8aa0b8', P.ink, 2);
      heart(ctx, 0, 0, 8, P.heart);
    } else { // ropeBag
      rr(ctx, -14, -6, 28, 24, 8); fillStroke(ctx, '#8a6238', P.ink, 2);
      ell(ctx, 0, -10, 12, 6); ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = P.rope; ctx.lineWidth = 3; ctx.stroke();
      ell(ctx, 0, -10, 7, 3); ctx.stroke();
    }
    ctx.restore();
  }
  function drawShopItem(ctx, s) {
    s = obj(s);
    var x = num(s.x, 0), y = num(s.y, 0), item = SHOP[s.item] ? s.item : 'club', info = SHOP[item];
    var cost = Math.max(0, Math.round(num(s.cost, 0))), level = Math.max(0, Math.round(num(s.level, 0)));
    var owned = bool(s.owned), eq = bool(s.equipped), aff = bool(s.affordable), sel = bool(s.selected);
    if (item === 'club') owned = true;
    ctx.save(); ctx.translate(x, y);
    rr(ctx, -186, -46, 372, 92, 12); fillStroke(ctx, sel ? P.panel2 : P.panel, P.frame, 2);
    if (sel) { rr(ctx, -188, -48, 376, 96, 13); ctx.strokeStyle = P.select; ctx.lineWidth = 4; ctx.stroke(); }
    var tagC = info.type === 'device' ? CAT_COLOR[DEV[item].cat] : (info.type === 'weapon' ? P.playerFx : P.gold);
    rr(ctx, -176, -36, 72, 72, 10); fillStroke(ctx, hexA(tagC, 0.12), hexA(tagC, 0.6), 2);
    ctx.save(); ctx.translate(-140, 0); itemIcon(ctx, item, 48); ctx.restore();
    var buyable = !(owned && info.type !== 'upgrade');
    var dim = buyable && !aff;
    txt(ctx, info.name, -92, -16, { size: 21, align: 'left', color: dim ? P.textDim : P.text, maxW: 170 });
    txt(ctx, info.desc, -92, 16, { size: 14, align: 'left', color: P.textDim, maxW: 180 });
    if (eq) {
      rr(ctx, 96, -14, 80, 28, 14); fillStroke(ctx, P.ok, P.ink, 2);
      txt(ctx, '裝備中', 136, 1, { size: 15, color: '#10301a', stroke: false });
    } else if (owned && info.type !== 'upgrade') {
      rr(ctx, 96, -14, 80, 28, 14); fillStroke(ctx, '#3a3046', '#6a5e7e', 2);
      txt(ctx, '已擁有', 136, 1, { size: 15, color: P.textDim, stroke: false });
    } else {
      coin(ctx, 112, info.type === 'upgrade' ? -10 : 0, 10);
      txt(ctx, String(cost), 128, info.type === 'upgrade' ? -10 : 0, { size: 22, align: 'left', color: aff ? P.gold : '#ff7a7a' });
      if (info.type === 'upgrade') txt(ctx, '已買 ' + level, 136, 22, { size: 13, color: P.textDim });
    }
    ctx.restore();
  }

  function drawButton(ctx, s) {
    s = obj(s);
    var x = num(s.x, 0), y = num(s.y, 0), w = Math.max(10, num(s.w, 200)), h = Math.max(10, num(s.h, 60));
    var sel = bool(s.selected);
    ctx.save();
    rr(ctx, x, y + 4, w, h, 14); ctx.fillStyle = '#0b0810'; ctx.fill();
    rr(ctx, x, y, w, h, 14); fillStroke(ctx, sel ? P.select : P.panel2, sel ? P.ink : P.frame, sel ? 3 : 2);
    if (sel) {
      ctx.beginPath(); ctx.moveTo(x + 18, y + h / 2 - 8); ctx.lineTo(x + 30, y + h / 2); ctx.lineTo(x + 18, y + h / 2 + 8); ctx.closePath(); ctx.fillStyle = P.ink; ctx.fill();
    }
    txt(ctx, str(s.label), x + w / 2, y + h / 2 + 1, { size: Math.min(28, h * 0.42), color: sel ? '#1b1424' : P.text, stroke: !sel, maxW: w - 50 });
    ctx.restore();
  }

  var FT = {
    gold: { c: P.gold, size: 20 },
    redGold: { c: P.gold, size: 26, sc: '#8a1420' },
    chain: { c: '#ffb0f0', size: 28, sc: '#4a1050' },
    repDown: { c: '#ff7a7a', size: 20, down: true },
    capture: { c: P.ok, size: 30 },
    levelUp: { c: '#9fe8ff', size: 24 },
    coin20: { c: P.gold, size: 24 }
  };
  function drawFloatText(ctx, s) {
    s = obj(s);
    var x = num(s.x, 0), y = num(s.y, 0), t = num(s.t, 0), dur = num(s.dur, 1) || 1;
    if (t >= dur) return;
    var p = clamp(t / dur, 0, 1), st = FT[s.kind] || FT.gold, text = str(s.text);
    ctx.save();
    ctx.globalAlpha = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
    var dy = (st.down ? 1 : -1) * 36 * p;
    var pop = p < 0.12 ? 0.7 + 0.3 * p / 0.12 : 1;
    ctx.translate(x, y + dy); ctx.scale(pop, pop);
    if (text.indexOf('燈') >= 0) { ell(ctx, 0, 0, 14 + text.length * st.size * 0.3, st.size * 0.8); ctx.fillStyle = 'rgba(255,243,196,0.25)'; ctx.fill(); }
    txt(ctx, text, 0, 0, { size: st.size, color: st.c, strokeColor: st.sc || P.ink, sw: st.sc ? 6 : 4.5 });
    ctx.restore();
  }

  function drawResultPanel(ctx, s) {
    s = obj(s);
    var stars = clamp(Math.round(num(s.stars, 0)), 0, 3);
    var roster = Array.isArray(s.roster) ? s.roster : [];
    ctx.save(); ctx.translate(640, 380);
    rr(ctx, -396, -256, 792, 512, 20); fillStroke(ctx, P.panel, P.frame, 3);
    txt(ctx, '七天結算', 0, -216, { size: 32 });
    for (var i = 0; i < 3; i++) star(ctx, (i - 1) * 78, -146, 30, i < stars ? P.gold : '#3a3046', P.ink);
    var rows = [['總名聲', String(Math.round(num(s.rep, 0))), P.rep], ['累計金幣', String(Math.round(num(s.goldEarned, 0))), P.gold], ['最長連鎖', String(Math.round(num(s.bestChain, 0))) + ' 段', '#ffb0f0']];
    for (var r = 0; r < 3; r++) {
      var ry = -76 + r * 42;
      txt(ctx, rows[r][0], -150, ry, { size: 22, align: 'left', color: P.textDim });
      txt(ctx, rows[r][1], 150, ry, { size: 26, align: 'right', color: rows[r][2] });
    }
    txt(ctx, '陣容', 0, 58, { size: 18, color: P.textDim });
    var n = Math.min(6, roster.length), gap = 118;
    for (var j = 0; j < n; j++) {
      var it = obj(roster[j]), sp = spc(it.species), mx = (j - (n - 1) / 2) * gap;
      ctx.save(); ctx.translate(mx, 112); var sc = sp === 'owl' ? 0.9 : 1.05; ctx.scale(sc, sc); monsterBody(ctx, sp, { dir: 1, eyes: 'happy' }); ctx.restore();
      txt(ctx, SP[sp].name + ' Lv' + clamp(Math.round(num(it.level, 0)), 0, 3), mx, 160, { size: 15, maxW: gap - 8 });
    }
    rr(ctx, -90, 196, 180, 40, 20); fillStroke(ctx, P.select, P.ink, 2);
    txt(ctx, '按 Z 重來', 0, 217, { size: 20, color: '#1b1424', stroke: false });
    ctx.restore();
  }

  // ---------- HUD ----------
  function timeBar(ctx, x, y, w, left, max) {
    var f = max > 0 ? clamp(left / max, 0, 1) : 0;
    rr(ctx, x, y - 8, w, 16, 6); fillStroke(ctx, '#0e0a14', P.ink, 2);
    if (f > 0) { rr(ctx, x + 2, y - 6, (w - 4) * f, 12, 5); ctx.fillStyle = left <= 10 ? P.danger : '#e8e2f0'; ctx.fill(); }
    txt(ctx, Math.ceil(Math.max(0, left)) + ' 秒', x + w + 12, y, { size: 20, align: 'left', color: left <= 10 ? '#ff7a7a' : P.text });
  }
  function drawHud(ctx, s) {
    s = obj(s);
    var phase = pick(s.phase, ['guide', 'select', 'dungeon', 'setup1', 'setup2', 'show', 'shop', 'result'], 'select');
    if (phase === 'guide') return; // 說明頁的文字全歸 RD
    var day = Math.round(num(s.day, 1)), dayMax = Math.round(num(s.dayMax, 7));
    var gold = Math.round(num(s.gold, 0)), rep = Math.round(num(s.rep, 0));
    var tl = num(s.timeLeft, 0), tm = num(s.timeMax, 0), msg = str(s.message);
    ctx.save();
    var H = phase === 'dungeon' ? 100 : 50;
    ctx.fillStyle = '#100c16'; ctx.fillRect(0, 0, 1280, H);
    ctx.fillStyle = '#4a3f5c'; ctx.fillRect(0, H - 2, 1280, 2);
    txt(ctx, '第 ' + day + ' / ' + dayMax + ' 天', 20, 25, { size: 22, align: 'left' });
    coin(ctx, 1020, 25, 11); txt(ctx, String(gold), 1038, 25, { size: 22, align: 'left', color: P.gold });
    star(ctx, 1150, 25, 12, P.rep); txt(ctx, String(rep), 1168, 25, { size: 22, align: 'left', color: P.rep });
    if (phase === 'dungeon') {
      var dn = DUN[s.dungeon] ? DUN[s.dungeon] : null;
      if (dn) txt(ctx, dn.name, 180, 25, { size: 22, align: 'left', color: dn.c });
      if (tm > 0) timeBar(ctx, 380, 25, 460, tl, tm);
      // 第二列: 心、繩、武器
      var mh = clamp(Math.round(num(s.maxHearts, 6)), 0, 14), hh = clamp(Math.round(num(s.hearts, mh)), 0, mh);
      for (var i = 0; i < mh; i++) heart(ctx, 30 + i * 22, 74, 8, i < hh ? P.heart : '#3a3046');
      var rx0 = 30 + mh * 22 + 18;
      var rmax = clamp(Math.round(num(s.ropeMax, 3)), 0, 10), rc = clamp(Math.round(num(s.ropes, rmax)), 0, rmax);
      for (var j = 0; j < rmax; j++) {
        ell(ctx, rx0 + j * 22, 74, 8, 6); ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.stroke();
        ctx.strokeStyle = j < rc ? P.rope : '#4a3f5c'; ctx.lineWidth = 3; ctx.stroke();
      }
      var wx = rx0 + rmax * 22 + 20;
      var wp = pick(s.weapon, ['club', 'sword', 'spear', 'whip'], 'club');
      ctx.save(); ctx.translate(wx + 14, 74); itemIcon(ctx, wp, 30); ctx.restore();
      txt(ctx, WEAPON[wp].name, wx + 36, 74, { size: 18, align: 'left' });
      var xcm = num(s.xCdMax, 0), xcl = Math.max(0, num(s.xCdLeft, 0));
      var kx = wx + 36 + 18 * WEAPON[wp].name.length + 26;
      if (xcm > 0) {
        var ready = xcl <= 0;
        keyCap(ctx, kx, 74, 'X', 28, { dim: !ready, glow: ready ? P.playerSkill : null });
        if (!ready) {
          ctx.beginPath(); ctx.moveTo(kx, 74); ctx.arc(kx, 74, 13, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(xcl / xcm, 0, 1)); ctx.closePath();
          ctx.fillStyle = 'rgba(18,13,24,0.6)'; ctx.fill();
        }
      }
      if (msg) txt(ctx, msg, 1000, 74, { size: 24, color: P.select, maxW: 500 });
    } else {
      if (tm > 0) timeBar(ctx, 170, 25, 200, tl, tm);
      if (msg) txt(ctx, msg, 690, 25, { size: 19, color: P.text, maxW: 560 });
    }
    ctx.restore();
  }

  // ---------- 說明頁示意圖(只畫在 x,y,w,h 框內; 標題 / 說明 / 頁碼 / 翻頁提示歸 RD) ----------
  var VW = 800, VH = 440;
  function label(ctx, s, x, y, c) { txt(ctx, s, x, y, { size: 16, color: c || P.text, sw: 4 }); }
  function curvedArrow(ctx, x1, y1, cx, cy, x2, y2, color, lw) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2);
    ctx.strokeStyle = P.ink; ctx.lineWidth = (lw || 4) + 3; ctx.lineCap = 'round'; ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = lw || 4; ctx.stroke();
    arrowHead(ctx, x2, y2, Math.atan2(y2 - cy, x2 - cx), 9, color);
  }
  function panelBox(ctx, x, y, w, h) { rr(ctx, x, y, w, h, 12); fillStroke(ctx, 'rgba(255,255,255,0.03)', '#4a3f5c', 2); }
  function stageBox(ctx, x, y, w, h) {
    rr(ctx, x, y, w, h, 10); ctx.fillStyle = '#4a3428'; ctx.fill();
    ctx.save(); rr(ctx, x, y, w, h, 10); ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 2; ctx.beginPath(); for (var k = 1; k < 12; k++) { ctx.moveTo(x, y + k * 30); ctx.lineTo(x + w, y + k * 30); } ctx.stroke();
    ctx.restore();
    rr(ctx, x, y, w, h, 10); ctx.strokeStyle = '#2a1d16'; ctx.lineWidth = 3; ctx.stroke();
  }

  function guide0(ctx) {
    // 竹林一角
    ctx.save(); rr(ctx, 10, 10, 780, 420, 12); ctx.clip();
    var map = ['wwwwwwwwwwwwwww', 'w.....o.......w', 'w.............w', 'w..........W..w', 'w.............w', 'w...o.........w', 'w.............w', 'wwwwwwwwwwwwwww'];
    for (var r = 0; r < map.length; r++) for (var c = 0; c < map[r].length; c++) {
      var ch = map[r][c];
      drawTile(ctx, { x: 10 + c * 60 - 20, y: 10 + r * 60 - 30, dungeon: 'bamboo', kind: ch === 'w' ? 'wall' : ch === 'o' ? 'pillar' : ch === 'W' ? 'slow' : 'floor', room: 'left', nest: false });
    }
    ctx.restore();
    var turtle = { x: 640, y: 230 }, aim = { x: 330, y: 250 };
    var base = Math.atan2(aim.y - turtle.y, aim.x - turtle.x), dist = 250;
    // 泡泡龜射出 3 顆泡泡(相鄰 25°)
    var bub = [];
    for (var i = -1; i <= 1; i++) { var a = base + i * 25 * Math.PI / 180; bub.push({ x: turtle.x + Math.cos(a) * dist, y: turtle.y + Math.sin(a) * dist, a: a }); }
    // 馴獸師站在中間與上方泡泡之間的空隙(同一距離), 剛從瞄準點閃開
    var ga = base - 12.5 * Math.PI / 180;
    var tamer = { x: turtle.x + Math.cos(ga) * (dist + 40), y: turtle.y + Math.sin(ga) * (dist + 40) };
    var cat = { x: tamer.x - 66, y: tamer.y + 4 };
    drawWildMonster(ctx, { x: cat.x, y: cat.y, species: 'cat', hp: 5, maxHp: 7, hit: true, weak: false, stunLeft: 0, stunDur: 2, lassoed: false, casting: false, move: 'walk', moveT: 0, moveDur: 0, dir: 1 });
    drawWildMonster(ctx, { x: turtle.x, y: turtle.y, species: 'turtle', hp: 8, maxHp: 8, hit: false, weak: false, stunLeft: 0, stunDur: 2, lassoed: false, casting: false, move: 'walk', moveT: 0, moveDur: 0, dir: -1 });
    // 移動箭頭: 從原本被瞄準的位置閃進空隙
    curvedArrow(ctx, aim.x + 30, aim.y + 70, aim.x + 60, aim.y + 10, tamer.x + 6, tamer.y + 24, P.playerFx, 4);
    drawTamer(ctx, { x: tamer.x, y: tamer.y, facing: 6, weapon: 'club', dashing: false, blink: false, lassoing: false });
    drawWeaponFx(ctx, { x: tamer.x, y: tamer.y, weapon: 'club', move: 'normal', shape: 'arc', angle: Math.PI, spread: 1.745, radius: 70, length: 0, width: 0, t: 0.07, dur: 0.2 });
    for (var b = 0; b < 3; b++) drawHazard(ctx, { x: bub[b].x, y: bub[b].y, kind: 'bubble', phase: 'fly', radius: 14, angle: bub[b].a, spread: 0, length: 0, width: 0, t: 0, dur: 0, reflected: false });
    // 鍵帽貼在動作旁
    keyCap(ctx, aim.x + 18, aim.y + 108, '方向', 40, {});
    keyCap(ctx, cat.x - 4, cat.y - 66, 'Z', 34, { pressed: true });
    label(ctx, '你', tamer.x + 26, tamer.y - 26, P.playerFx);
  }

  function guide1(ctx) {
    panelBox(ctx, 10, 10, 385, 420); panelBox(ctx, 405, 10, 385, 420);
    // 左: 站上殘血泡泡龜, 準備捕捉進度一半
    var L = { x: 200, y: 230 };
    drawWildMonster(ctx, { x: L.x, y: L.y, species: 'turtle', hp: 2, maxHp: 8, hit: false, weak: true, stunLeft: 0, stunDur: 2, lassoed: false, casting: false, move: 'walk', moveT: 0, moveDur: 0, dir: 1 });
    drawCaptureRing(ctx, { x: L.x, y: L.y, t: 0.4, dur: 0.8 });
    drawTamer(ctx, { x: L.x + 12, y: L.y - 6, facing: 4, weapon: 'club', dashing: false, blink: false, lassoing: false });
    label(ctx, '站住別動', L.x, L.y - 100, P.playerSkill);
    // 右: 套索中, 繞圈一半
    var R = { x: 598, y: 240 }, tr = 120, ta = -Math.PI * 0.15;
    var tx = R.x + Math.cos(ta) * tr, ty = R.y + Math.sin(ta) * tr;
    ctx.save(); ctx.setLineDash([6, 6]); circle(ctx, R.x, R.y, tr); ctx.strokeStyle = 'rgba(255,246,220,0.5)'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    curvedArrow(ctx, R.x + Math.cos(ta + 0.25) * tr, R.y + Math.sin(ta + 0.25) * tr, R.x + Math.cos(ta + 0.55) * tr * 1.08, R.y + Math.sin(ta + 0.55) * tr * 1.08, R.x + Math.cos(ta + 0.85) * tr, R.y + Math.sin(ta + 0.85) * tr, P.playerFx, 4);
    drawWildMonster(ctx, { x: R.x, y: R.y, species: 'turtle', hp: 2, maxHp: 8, hit: false, weak: true, stunLeft: 0, stunDur: 2, lassoed: true, casting: false, move: 'walk', moveT: 0, moveDur: 0, dir: -1 });
    drawLasso(ctx, { x1: tx, y1: ty, x2: R.x, y2: R.y, progress: 0.5, t: 2, limit: 5, len: tr, maxLen: 220 });
    drawTamer(ctx, { x: tx, y: ty, facing: 3, weapon: 'club', dashing: false, blink: false, lassoing: true });
    label(ctx, '繞一圈', R.x, R.y + 150, P.playerSkill);
    // 角落: 收服!
    drawFloatText(ctx, { x: 700, y: 52, text: '收服!', kind: 'capture', t: 0.2, dur: 1 });
    ctx.save(); ctx.translate(755, 40); ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-2, 7); ctx.lineTo(10, -8); ctx.strokeStyle = P.ink; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.stroke(); ctx.strokeStyle = P.ok; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
  }

  function guide2(ctx) {
    ctx.save(); ctx.translate(205, 80); ctx.scale(0.95, 0.95); drawDeviceSlot(ctx, { x: 0, y: 0, key: 'z', device: 'spotlight' }); ctx.restore();
    ctx.save(); ctx.translate(595, 80); ctx.scale(0.95, 0.95); drawDeviceSlot(ctx, { x: 0, y: 0, key: 'x', device: 'mist' }); ctx.restore();
    ctx.save(); ctx.translate(290, 268); ctx.scale(0.8, 0.8); drawDeviceCard(ctx, { x: 0, y: 0, device: 'spotlight', slot: 'z', selected: true }); ctx.restore();
    ctx.save(); ctx.translate(510, 268); ctx.scale(0.8, 0.8); drawDeviceCard(ctx, { x: 0, y: 0, device: 'mist', slot: 'x', selected: false }); ctx.restore();
    drawButton(ctx, { x: 320, y: 376, w: 160, h: 52, label: '開演', selected: false });
  }

  function miniEnergy(ctx, x, y, w, frac, ghost) {
    bolt(ctx, x - 14, y + 7, 16, P.gold);
    rr(ctx, x, y, w, 14, 5); fillStroke(ctx, '#0e0a14', P.ink, 2);
    ctx.fillStyle = 'rgba(255,200,61,0.3)'; ctx.fillRect(x + 2, y + 2, (w - 4) * ghost, 10);
    ctx.fillStyle = P.gold; ctx.fillRect(x + 2, y + 2, (w - 4) * frac, 10);
    arrowHead(ctx, x + (w - 4) * frac + 14, y + 7, Math.PI, 7, P.gold);
  }
  function guide3(ctx) {
    var boxes = [[10, 10], [430, 10]];
    for (var i = 0; i < 2; i++) {
      ctx.save(); rr(ctx, boxes[i][0], boxes[i][1], 360, 360, 10); ctx.clip();
      stageBox(ctx, boxes[i][0], boxes[i][1], 360, 360);
      if (i === 0) {
        var c = { x: 190, y: 200 };
        drawDeviceFx(ctx, { x: c.x, y: c.y, kind: 'spot', radius: 100, t: 0, dur: 0 });
        drawShowMonster(ctx, { x: c.x, y: c.y, species: 'cat', level: 0, rage: 72, redLow: 80, marks: 0, markLeft: 0, markDur: 4, mode: 'roam', performing: false, performT: 0, performDur: 0.5, fx: 'none', fxT: 0, fxDur: 0.5, lit: true, jarT: 0, jarDur: 3, chargeT: 0, chargeDur: 1.5, looseT: 0, looseDur: 6, move: 'walk', moveT: 0, moveDur: 0, dir: 1 });
        drawCursor(ctx, { x: c.x, y: c.y, zDevice: 'spotlight', xDevice: 'mist', zRange: 100, xRange: 120, holding: 'z', hooking: false });
      } else {
        var t = { x: 610, y: 200 };
        drawDeviceFx(ctx, { x: t.x, y: t.y, kind: 'mistBurst', radius: 120, t: 0.12, dur: 0.4 });
        drawShowMonster(ctx, { x: t.x, y: t.y, species: 'turtle', level: 0, rage: 48, redLow: 80, marks: 0, markLeft: 0, markDur: 4, mode: 'roam', performing: false, performT: 0, performDur: 0.5, fx: 'doused', fxT: 0.15, fxDur: 0.5, lit: false, jarT: 0, jarDur: 3, chargeT: 0, chargeDur: 1.5, looseT: 0, looseDur: 6, move: 'walk', moveT: 0, moveDur: 0, dir: -1 });
        drawCursor(ctx, { x: t.x, y: t.y, zDevice: 'spotlight', xDevice: 'mist', zRange: 100, xRange: 120, holding: '', hooking: false });
      }
      ctx.restore();
    }
    // 按鍵: 左按住 Z, 右按一下 X
    keyCap(ctx, 330, 60, 'Z', 40, { pressed: true, glow: P.ignite });
    label(ctx, '按住', 330, 100, P.ignite);
    keyCap(ctx, 750, 60, 'X', 40, { pressed: true });
    // 左下: 電力條變短
    miniEnergy(ctx, 70, 392, 260, 0.55, 0.8);
    // 中間: 準星移動
    curvedArrow(ctx, 260, 130, 400, 40, 540, 130, '#ffffff', 4);
    keyCap(ctx, 400, 110, '方向', 40, {});
  }

  function guide4(ctx) {
    var base = { species: 'fox', level: 0, redLow: 80, markLeft: 0, markDur: 4, performDur: 0.5, fx: 'none', fxT: 0, fxDur: 0.5, lit: false, jarT: 0, jarDur: 3, chargeT: 0, chargeDur: 1.5, looseT: 0, looseDur: 6, move: 'walk', moveT: 0, moveDur: 0, dir: 1 };
    function m(o) { var r = {}, k; for (k in base) r[k] = base[k]; for (k in o) r[k] = o[k]; return r; }
    // 上: 紅區表演 ×2
    panelBox(ctx, 10, 10, 780, 170);
    stageBox(ctx, 190, 24, 420, 142);
    drawShowMonster(ctx, m({ x: 330, y: 92, rage: 88, marks: 0, mode: 'roam', performing: true, performT: 0.2 }));
    drawFloatText(ctx, { x: 470, y: 76, text: '+12 ×2', kind: 'redGold', t: 0.15, dur: 1 });
    // 下: 4 個標記 → 衝去撞圍欄(沒有標記)
    panelBox(ctx, 10, 190, 780, 240);
    stageBox(ctx, 24, 204, 300, 212);
    drawShowMonster(ctx, m({ species: 'boar', x: 170, y: 300, rage: 100, marks: 4, markLeft: 2.5, mode: 'roam' }));
    curvedArrow(ctx, 300, 300, 360, 270, 420, 300, P.danger, 5);
    ctx.save(); rr(ctx, 440, 204, 336, 212, 10); ctx.clip();
    stageBox(ctx, 440, 204, 336, 170);
    ctx.fillStyle = P.stands; ctx.fillRect(440, 374, 336, 60);
    drawShowMonster(ctx, m({ species: 'boar', x: 560, y: 318, rage: 100, marks: 0, mode: 'charge', chargeT: 0.7, dir: 1 }));
    drawFence(ctx, { x: 560, y: 368, side: 'bottom', broken: false });
    drawFence(ctx, { x: 696, y: 368, side: 'bottom', broken: false });
    ctx.save(); ctx.translate(0, 0); ctx.scale(1, 1);
    drawVisitor(ctx, { x: 540, y: 404, side: 'bottom', mode: 'scared' });
    drawVisitor(ctx, { x: 640, y: 404, side: 'bottom', mode: 'scared' });
    drawVisitor(ctx, { x: 740, y: 404, side: 'bottom', mode: 'watch' });
    ctx.restore();
    ctx.restore();
    // 打叉
    ctx.save(); ctx.translate(700, 262);
    circle(ctx, 0, 0, 26); fillStroke(ctx, P.dangerDark, P.danger, 3);
    ctx.strokeStyle = P.danger; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-11, -11); ctx.lineTo(11, 11); ctx.moveTo(11, -11); ctx.lineTo(-11, 11); ctx.stroke();
    ctx.restore();
    label(ctx, '失控', 700, 304, P.danger);
  }

  function guide5(ctx) {
    var cx = 360, cy = 215, rx = 250, ry = 150;
    var nodes = [['地下城', Math.PI], ['布置', -Math.PI / 2], ['表演', 0], ['商店', Math.PI / 2]];
    ctx.save(); ctx.setLineDash([2, 0]);
    for (var i = 0; i < 4; i++) {
      var a0 = nodes[i][1] + 0.38, a1 = nodes[i][1] + Math.PI / 2 - 0.38;
      if (i === 0) { a0 = Math.PI + 0.38; a1 = Math.PI * 1.5 - 0.38; }
      var am = (a0 + a1) / 2;
      curvedArrow(ctx, cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry, cx + Math.cos(am) * rx * 1.12, cy + Math.sin(am) * ry * 1.12, cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry, '#e8e2f0', 4);
    }
    ctx.restore();
    for (var j = 0; j < 4; j++) {
      var nx = cx + Math.cos(nodes[j][1]) * rx, ny = cy + Math.sin(nodes[j][1]) * ry;
      rr(ctx, nx - 62, ny - 26, 124, 52, 14); fillStroke(ctx, j === 2 ? P.panel2 : P.panel, j === 2 ? P.rep : P.frame, 3);
      txt(ctx, nodes[j][0], nx, ny + 1, { size: 22 });
    }
    txt(ctx, '×7 天', cx, cy, { size: 40, color: P.select });
    // 表演旁: 名聲星星往上加
    var sx = cx + rx + 30;
    for (var k = 0; k < 3; k++) star(ctx, sx + 30 + k * 6, cy - 40 - k * 30, 10 + k * 2, P.rep);
    arrowHead(ctx, sx + 60, cy - 130, -Math.PI / 2, 9, P.rep);
    // 終點: 結算評價星數
    curvedArrow(ctx, cx + rx - 10, cy + 40, cx + rx + 60, cy + 130, cx + rx + 110, cy + 170, P.rep, 4);
    rr(ctx, 620, 330, 170, 90, 14); fillStroke(ctx, P.panel, P.rep, 3);
    txt(ctx, '結算', 705, 352, { size: 18, color: P.textDim });
    for (var s2 = 0; s2 < 3; s2++) star(ctx, 665 + s2 * 40, 392, 15, P.gold);
  }

  var GUIDES = [guide0, guide1, guide2, guide3, guide4, guide5];
  function drawGuidePage(ctx, s) {
    s = obj(s);
    var page = clamp(Math.round(num(s.page, 0)), 0, GUIDES.length - 1);
    var x = num(s.x, 0), y = num(s.y, 0), w = Math.max(1, num(s.w, VW)), h = Math.max(1, num(s.h, VH));
    var k = Math.min(w / VW, h / VH);
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.translate(x + (w - VW * k) / 2, y + (h - VH * k) / 2);
    ctx.scale(k, k);
    GUIDES[page](ctx);
    ctx.restore();
  }

  window.Art = {
    canvas: { width: 1280, height: 720 },
    palette: P,
    drawBackground: drawBackground,
    drawTile: drawTile,
    drawTamer: drawTamer,
    drawWildMonster: drawWildMonster,
    drawCaptureRing: drawCaptureRing,
    drawLasso: drawLasso,
    drawHazard: drawHazard,
    drawWeaponFx: drawWeaponFx,
    drawDungeonCard: drawDungeonCard,
    drawRosterCard: drawRosterCard,
    drawDeviceSlot: drawDeviceSlot,
    drawDeviceCard: drawDeviceCard,
    drawCursor: drawCursor,
    drawDeviceFx: drawDeviceFx,
    drawControlPanel: drawControlPanel,
    drawDeviceName: drawDeviceName,
    drawShowArena: drawShowArena,
    drawShowMonster: drawShowMonster,
    drawFence: drawFence,
    drawVisitor: drawVisitor,
    drawShopItem: drawShopItem,
    drawButton: drawButton,
    drawFloatText: drawFloatText,
    drawResultPanel: drawResultPanel,
    drawHud: drawHud,
    drawGuidePage: drawGuidePage
  };
})();
