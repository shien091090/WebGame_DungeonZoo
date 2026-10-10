// 鞭響大場面 — 美術(程式繪製, 無外部資源)
// 契約見 style.md; 所有座標皆為邏輯畫布 720x1280。
(function () {
  'use strict';

  var FONT = '"Microsoft JhengHei","PingFang TC","Noto Sans TC","Heiti TC",sans-serif';

  var P = {
    bg: '#121019',
    hudBg: '#1b1826',
    hudLine: '#3a3450',
    panel: '#262036',
    panelLine: '#4a4266',
    text: '#f4f1ff',
    textDim: '#a9a3c2',
    outline: '#0b0910',
    dungeonFloor: '#1e2233',
    dungeonTile: '#262b40',
    dungeonWall: '#14161f',
    showSand: '#4a3d2c',
    showSandLine: '#6a573e',
    stands: '#2a2236',
    standsSeat: '#3b3150',
    player: '#3ee07a',
    playerDark: '#16703c',
    playerLight: '#c9ffdd',
    bolt: '#b8ffd2',
    capture: '#3ee07a',
    danger: '#ff2bd6',
    dangerDark: '#5c0c4e',
    fail: '#ff3b4f',
    gold: '#ffc83a',
    rep: '#c08cff',
    heart: '#ff5a7a',
    rageCalm: '#8792ad',
    ragePerform: '#ffc83a',
    rageLoose: '#ff2bd6',
    fire: '#ff7a1f',
    water: '#2fc4ff',
    thunder: '#f5e04a',
    stone: '#a39486',
    fence: '#a8743f',
    fenceDark: '#5a3a1c',
    seat: '#3b3150'
  };

  var SPECIES = {
    fire: { main: P.fire, dark: '#8a3200', light: '#ffd27a', name: '火蜥蜴' },
    water: { main: P.water, dark: '#0d5f8a', light: '#bff0ff', name: '水母' },
    thunder: { main: P.thunder, dark: '#7d6a00', light: '#fffbd0', name: '雷鳥' },
    stone: { main: P.stone, dark: '#4d433b', light: '#d9cfc5', name: '石像鬼' }
  };

  var VISITOR_COLORS = ['#6b8cce', '#c97b9b', '#7cb58a', '#d0a35e', '#9a7fc4', '#5fb3b3'];

  // ---------- 小工具 ----------
  function now() {
    return (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) / 1000;
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function num(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; }
  function hexToRgb(h) {
    h = h.replace('#', '');
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  function mix(a, b, t) {
    var x = hexToRgb(a), y = hexToRgb(b);
    var r = Math.round(x[0] + (y[0] - x[0]) * t), g = Math.round(x[1] + (y[1] - x[1]) * t), bl = Math.round(x[2] + (y[2] - x[2]) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }
  function rgba(hex, a) {
    var c = hexToRgb(hex);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
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
  // 文字: 一律帶深色描邊(P10)
  function txt(ctx, s, x, y, size, color, align, weight, outlineW) {
    ctx.font = (weight || 'bold') + ' ' + size + 'px ' + FONT;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    var ow = outlineW === undefined ? Math.max(3, size * 0.16) : outlineW;
    if (ow > 0) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = ow;
      ctx.strokeStyle = P.outline;
      ctx.strokeText(String(s), x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(String(s), x, y);
  }
  function heartPath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.42);
    ctx.bezierCurveTo(x - s * 0.62, y, x - s * 0.5, y - s * 0.5, x, y - s * 0.22);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 0.5, x + s * 0.62, y, x, y + s * 0.42);
    ctx.closePath();
  }
  function heart(ctx, x, y, s, filled) {
    heartPath(ctx, x, y, s);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = P.outline;
    ctx.stroke();
    ctx.fillStyle = filled ? P.heart : '#3a3348';
    ctx.fill();
    if (filled) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(x - s * 0.2, y - s * 0.12, s * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  function coin(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = P.gold;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#7a5200';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
    ctx.strokeStyle = '#b37a00';
    ctx.lineWidth = Math.max(1, r * 0.15);
    ctx.stroke();
  }
  function starPath(ctx, x, y, r) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var rad = i % 2 === 0 ? r : r * 0.45;
      var px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  function star(ctx, x, y, r, filled) {
    starPath(ctx, x, y, r);
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, r * 0.14);
    ctx.strokeStyle = filled ? P.outline : P.rep;
    ctx.stroke();
    if (filled) { ctx.fillStyle = P.rep; ctx.fill(); }
    else { ctx.fillStyle = 'rgba(192,140,255,0.12)'; ctx.fill(); }
  }
  function checkMark(ctx, x, y, s, color) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.5, y);
    ctx.lineTo(x - s * 0.12, y + s * 0.38);
    ctx.lineTo(x + s * 0.55, y - s * 0.4);
    ctx.lineWidth = s * 0.34;
    ctx.strokeStyle = P.outline;
    ctx.stroke();
    ctx.lineWidth = s * 0.18;
    ctx.strokeStyle = color || P.capture;
    ctx.stroke();
    ctx.restore();
  }
  function crossMark(ctx, x, y, s, color) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.45, y - s * 0.45); ctx.lineTo(x + s * 0.45, y + s * 0.45);
    ctx.moveTo(x + s * 0.45, y - s * 0.45); ctx.lineTo(x - s * 0.45, y + s * 0.45);
    ctx.lineWidth = s * 0.34;
    ctx.strokeStyle = P.outline;
    ctx.stroke();
    ctx.lineWidth = s * 0.18;
    ctx.strokeStyle = color || P.fail;
    ctx.stroke();
    ctx.restore();
  }
  function cursorArrow(ctx, x, y, s) {
    s = s || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, 30); ctx.lineTo(8, 23); ctx.lineTo(14, 35);
    ctx.lineTo(19, 33); ctx.lineTo(13, 21); ctx.lineTo(23, 21); ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = P.outline;
    ctx.stroke();
    ctx.restore();
  }
  function arrowLine(ctx, x1, y1, x2, y2, color, dashed, w) {
    ctx.save();
    var a = Math.atan2(y2 - y1, x2 - x1);
    ctx.lineCap = 'round';
    ctx.lineWidth = w || 4;
    ctx.strokeStyle = color;
    if (dashed) ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - Math.cos(a) * 10, y2 - Math.sin(a) * 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.5) * 18, y2 - Math.sin(a - 0.5) * 18);
    ctx.lineTo(x2 - Math.cos(a + 0.5) * 18, y2 - Math.sin(a + 0.5) * 18);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  // ---------- 魔物本體(地下城與表演場共用一套畫法) ----------
  // 以 (0,0) 為中心, 外接圓約 1.15R。mood: calm | sleepy | angry | furious | dazed
  function creature(ctx, species, R, mood, opt) {
    opt = opt || {};
    var sp = SPECIES[species] || SPECIES.fire;
    var main = sp.main, dark = sp.dark, light = sp.light;
    if (opt.muted) {
      main = mix(main, '#6d6a78', 0.55); dark = mix(dark, '#3a3842', 0.5); light = mix(light, '#9b98a6', 0.5);
    }
    if (opt.flash) { main = '#ffffff'; dark = '#d8d8e8'; light = '#ffffff'; }
    var OL = P.outline;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    var eyeY = -0.12 * R, eyeX = 0.3 * R, eyeR = 0.14 * R;

    if (species === 'water') {
      // 觸手
      ctx.strokeStyle = dark;
      ctx.lineWidth = R * 0.12;
      for (var i = 0; i < 4; i++) {
        var tx = (-0.45 + i * 0.3) * R;
        ctx.beginPath();
        ctx.moveTo(tx, 0.2 * R);
        ctx.quadraticCurveTo(tx + 0.14 * R, 0.5 * R, tx, 0.75 * R);
        ctx.quadraticCurveTo(tx - 0.12 * R, 0.9 * R, tx + 0.04 * R, 1.02 * R);
        ctx.stroke();
      }
      // 傘
      ctx.beginPath();
      ctx.moveTo(-0.95 * R, 0.25 * R);
      ctx.arc(0, 0.05 * R, 0.95 * R, Math.PI * 1.02, Math.PI * 1.98);
      ctx.lineTo(0.95 * R, 0.25 * R);
      for (var k = 0; k < 5; k++) {
        var x0 = 0.95 * R - (k + 0.5) * 0.38 * R;
        ctx.quadraticCurveTo(x0, 0.42 * R, x0 - 0.19 * R, 0.25 * R);
      }
      ctx.closePath();
      ctx.fillStyle = main; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.stroke();
      ctx.fillStyle = light;
      ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(-0.45 * R, -0.5 * R, 0.13 * R, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0.35 * R, -0.62 * R, 0.09 * R, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    } else if (species === 'thunder') {
      // 翅膀
      ctx.fillStyle = dark;
      for (var s = -1; s <= 1; s += 2) {
        ctx.beginPath();
        ctx.moveTo(s * 0.5 * R, -0.15 * R);
        ctx.lineTo(s * 1.12 * R, -0.5 * R);
        ctx.lineTo(s * 0.98 * R, -0.05 * R);
        ctx.lineTo(s * 1.12 * R, 0.2 * R);
        ctx.lineTo(s * 0.55 * R, 0.3 * R);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.stroke();
      }
      // 頭冠閃電
      ctx.beginPath();
      ctx.moveTo(-0.1 * R, -0.65 * R);
      ctx.lineTo(0.12 * R, -1.08 * R);
      ctx.lineTo(0.05 * R, -0.85 * R);
      ctx.lineTo(0.28 * R, -0.95 * R);
      ctx.lineTo(0.15 * R, -0.62 * R);
      ctx.closePath();
      ctx.fillStyle = light; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = OL; ctx.stroke();
      // 身體
      ctx.beginPath(); ctx.arc(0, 0, 0.72 * R, 0, Math.PI * 2);
      ctx.fillStyle = main; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0.3 * R, 0.42 * R, 0.3 * R, 0, 0, Math.PI * 2);
      ctx.fillStyle = light; ctx.fill();
      // 嘴
      ctx.beginPath();
      ctx.moveTo(-0.12 * R, 0.08 * R); ctx.lineTo(0.12 * R, 0.08 * R); ctx.lineTo(0, 0.26 * R); ctx.closePath();
      ctx.fillStyle = '#ff9a2e'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = OL; ctx.stroke();
    } else if (species === 'stone') {
      // 小翅
      ctx.fillStyle = dark;
      for (var s2 = -1; s2 <= 1; s2 += 2) {
        ctx.beginPath();
        ctx.moveTo(s2 * 0.7 * R, -0.3 * R);
        ctx.lineTo(s2 * 1.1 * R, -0.45 * R);
        ctx.quadraticCurveTo(s2 * 1.0 * R, 0, s2 * 1.1 * R, 0.25 * R);
        ctx.lineTo(s2 * 0.7 * R, 0.2 * R);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.stroke();
      }
      // 角
      for (var s3 = -1; s3 <= 1; s3 += 2) {
        ctx.beginPath();
        ctx.moveTo(s3 * 0.35 * R, -0.6 * R);
        ctx.lineTo(s3 * 0.6 * R, -1.05 * R);
        ctx.lineTo(s3 * 0.62 * R, -0.55 * R);
        ctx.closePath();
        ctx.fillStyle = light; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = OL; ctx.stroke();
      }
      rr(ctx, -0.75 * R, -0.7 * R, 1.5 * R, 1.6 * R, 0.25 * R);
      ctx.fillStyle = main; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.stroke();
      // 裂紋
      ctx.strokeStyle = dark; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-0.5 * R, 0.35 * R); ctx.lineTo(-0.3 * R, 0.5 * R); ctx.lineTo(-0.38 * R, 0.72 * R);
      ctx.moveTo(0.45 * R, 0.2 * R); ctx.lineTo(0.28 * R, 0.42 * R);
      ctx.stroke();
      // 獠牙嘴
      ctx.beginPath(); ctx.moveTo(-0.28 * R, 0.22 * R); ctx.lineTo(0.28 * R, 0.22 * R);
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke();
    } else {
      // fire 火蜥蜴: 尾巴
      ctx.beginPath();
      ctx.moveTo(0.6 * R, 0.45 * R);
      ctx.quadraticCurveTo(1.15 * R, 0.55 * R, 1.05 * R, 0.05 * R);
      ctx.lineWidth = R * 0.2; ctx.strokeStyle = OL; ctx.stroke();
      ctx.lineWidth = R * 0.13; ctx.strokeStyle = main; ctx.stroke();
      // 頭頂火焰
      var flames = [[-0.3, -0.98], [0, -1.12], [0.3, -0.98]];
      for (var f = 0; f < 3; f++) {
        var fx = flames[f][0] * R, fy = flames[f][1] * R;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.quadraticCurveTo(fx + 0.2 * R, fy + 0.3 * R, fx, fy + 0.45 * R);
        ctx.quadraticCurveTo(fx - 0.2 * R, fy + 0.3 * R, fx, fy);
        ctx.fillStyle = light; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = OL; ctx.stroke();
      }
      // 腳
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(-0.45 * R, 0.82 * R, 0.2 * R, 0.13 * R, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0.4 * R, 0.82 * R, 0.2 * R, 0.13 * R, 0, 0, Math.PI * 2); ctx.fill();
      // 身體
      ctx.beginPath(); ctx.ellipse(0, 0.08 * R, 0.9 * R, 0.78 * R, 0, 0, Math.PI * 2);
      ctx.fillStyle = main; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0.42 * R, 0.5 * R, 0.3 * R, 0, 0, Math.PI * 2);
      ctx.fillStyle = light; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
    }

    // 眼睛
    drawEyes(ctx, eyeX, eyeY, eyeR, mood);
    ctx.restore();
  }

  function drawEyes(ctx, ex, ey, er, mood) {
    ctx.save();
    ctx.lineCap = 'round';
    var OL = P.outline;
    for (var s = -1; s <= 1; s += 2) {
      var x = s * ex;
      if (mood === 'sleepy') {
        ctx.beginPath();
        ctx.arc(x, ey, er * 0.9, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.lineWidth = er * 0.45; ctx.strokeStyle = OL; ctx.stroke();
      } else if (mood === 'dazed') {
        ctx.beginPath(); ctx.arc(x, ey, er * 1.15, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = OL; ctx.stroke();
        ctx.beginPath();
        for (var i = 0; i <= 20; i++) {
          var a = i * 0.6, r = er * 0.05 + i * er * 0.045;
          var px = x + Math.cos(a) * r, py = ey + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.lineWidth = 1.8; ctx.stroke();
      } else if (mood === 'stunX') {
        ctx.beginPath();
        ctx.moveTo(x - er, ey - er); ctx.lineTo(x + er, ey + er);
        ctx.moveTo(x + er, ey - er); ctx.lineTo(x - er, ey + er);
        ctx.lineWidth = er * 0.5; ctx.strokeStyle = OL; ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(x, ey, er * 1.1, 0, Math.PI * 2);
        ctx.fillStyle = mood === 'furious' ? P.danger : '#ffffff'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = OL; ctx.stroke();
        ctx.beginPath(); ctx.arc(x + s * er * 0.15, ey + er * 0.1, er * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = mood === 'furious' ? '#ffffff' : OL; ctx.fill();
        if (mood === 'angry' || mood === 'furious') {
          ctx.beginPath();
          ctx.moveTo(x - s * er * 1.3, ey - er * 2.0);
          ctx.lineTo(x + s * er * 1.1, ey - er * 1.1);
          ctx.lineWidth = er * 0.5; ctx.strokeStyle = OL; ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  // 怒氣條: 寬 w, 置中於 (0, y)。刻度 50(表演門檻)。滿 100 = 危險洋紅
  function rageBar(ctx, y, w, rage) {
    rage = clamp(num(rage, 0), 0, 100);
    var h = 9, x = -w / 2;
    rr(ctx, x - 2, y - 2, w + 4, h + 4, 4);
    ctx.fillStyle = P.outline; ctx.fill();
    rr(ctx, x, y, w, h, 3);
    ctx.fillStyle = '#2b2838'; ctx.fill();
    var col = rage >= 100 ? P.rageLoose : (rage >= 50 ? P.ragePerform : P.rageCalm);
    if (rage > 0) {
      rr(ctx, x, y, Math.max(4, w * rage / 100), h, 3);
      ctx.fillStyle = col; ctx.fill();
    }
    // 50 刻度
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + w * 0.5 - 1, y - 2, 2, h + 4);
  }

  // ---------- 玩家 / 馴獸師共用人物 ----------
  function hero(ctx, opt) {
    // opt: { hat, mood, muted }
    var body = opt.muted ? '#7b8a80' : P.player;
    var dark = opt.muted ? '#3e4741' : P.playerDark;
    var core = opt.muted ? '#c9d2cc' : P.playerLight;
    ctx.save();
    ctx.lineJoin = 'round';
    // 肩膀 / 身體
    ctx.beginPath(); ctx.ellipse(0, 12, 30, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = dark; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 10, 25, 13, 0, 0, Math.PI * 2);
    ctx.fillStyle = body; ctx.fill();
    // 頭 = 判定圓 r16
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fillStyle = core; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 14.5, 0, Math.PI * 2);
    ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    drawEyes(ctx, 6, -1, 3, opt.mood || 'calm');
    ctx.restore();
  }

  // ---------- 匯出 ----------
  var Art = {
    canvas: { width: 720, height: 1280 },
    palette: P,

    drawBackground: function (ctx) {
      ctx.save();
      ctx.fillStyle = P.bg;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.restore();
    },

    drawDungeonArena: function (ctx, state) {
      state = state || {};
      var day = clamp(Math.round(num(state.day, 1)), 1, 3);
      var tints = ['#1e2233', '#241f36', '#2c1d2c'];
      ctx.save();
      ctx.fillStyle = P.dungeonWall;
      ctx.fillRect(0, 120, 720, 1160);
      ctx.fillStyle = tints[day - 1];
      ctx.fillRect(0, 120, 720, 1060);
      // 石磚
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 2;
      for (var y = 120; y < 1180; y += 60) {
        var off = ((y - 120) / 60) % 2 ? 30 : 0;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(720, y); ctx.stroke();
        for (var x = off; x <= 720; x += 60) {
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, Math.min(y + 60, 1180)); ctx.stroke();
        }
      }
      // 魔物出沒帶(上半部)淡暗化
      var g = ctx.createLinearGradient(0, 120, 0, 600);
      g.addColorStop(0, 'rgba(0,0,0,0.35)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 120, 720, 480);
      // 玩家活動範圍: 淡綠虛線框
      ctx.setLineDash([12, 10]);
      ctx.strokeStyle = 'rgba(62,224,122,0.22)';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 600, 640, 560);
      ctx.setLineDash([]);
      // 上緣出口(虛弱魔物逃走處)
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 120, 720, 10);
      ctx.restore();
    },

    drawShowArena: function (ctx) {
      ctx.save();
      // 觀眾席
      ctx.fillStyle = P.stands;
      ctx.fillRect(0, 120, 720, 150);
      ctx.fillRect(0, 1000, 720, 150);
      ctx.fillStyle = '#1a1524';
      ctx.fillRect(0, 1150, 720, 130);
      // 階梯紋
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(0, 160, 720, 4);
      ctx.fillRect(0, 210, 720, 4);
      ctx.fillRect(0, 1060, 720, 4);
      ctx.fillRect(0, 1110, 720, 4);
      // 場地
      ctx.fillStyle = '#2a2219';
      ctx.fillRect(40, 262, 640, 754);
      ctx.fillStyle = P.showSand;
      ctx.fillRect(60, 270, 600, 730);
      // 粉筆線
      ctx.strokeStyle = P.showSandLine;
      ctx.lineWidth = 3;
      ctx.strokeRect(66, 276, 588, 718);
      ctx.beginPath(); ctx.arc(360, 635, 110, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(66, 635); ctx.lineTo(654, 635); ctx.stroke();
      // 沙地斑點
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (var i = 0; i < 40; i++) {
        var px = 80 + ((i * 137) % 560), py = 290 + ((i * 251) % 690);
        ctx.beginPath(); ctx.arc(px, py, 3 + (i % 3), 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    },

    drawPlayer: function (ctx, state) {
      state = state || {};
      var x = num(state.x, 360), y = num(state.y, 900);
      ctx.save();
      ctx.translate(x, y);
      if (state.blink && Math.floor(now() * 12) % 2 === 0) ctx.globalAlpha = 0.3;
      // 槍管(朝上)
      rr(ctx, -6, -34, 12, 22, 4);
      ctx.fillStyle = P.playerDark; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
      ctx.fillStyle = P.bolt;
      ctx.fillRect(-3, -32, 6, 5);
      hero(ctx, {});
      ctx.restore();
    },

    drawMonster: function (ctx, state) {
      state = state || {};
      var x = num(state.x, 0), y = num(state.y, 0);
      var maxHp = Math.max(1, num(state.maxHp, 1));
      var hp = clamp(num(state.hp, maxHp), 0, maxHp);
      var weak = !!state.weak;
      ctx.save();
      ctx.translate(x, y);
      creature(ctx, state.species, 40, weak ? 'dazed' : 'angry', { flash: !!state.hit, muted: weak });
      // 血條(上方), 30% 刻度 = 虛弱門檻
      var w = 84, bx = -42, by = -57;
      rr(ctx, bx - 2, by - 2, w + 4, 11, 4);
      ctx.fillStyle = P.outline; ctx.fill();
      ctx.fillStyle = '#2b2838';
      ctx.fillRect(bx, by, w, 7);
      ctx.fillStyle = weak ? P.capture : '#e9e4f5';
      ctx.fillRect(bx, by, Math.max(2, w * hp / maxHp), 7);
      ctx.fillStyle = P.capture;
      ctx.fillRect(bx + w * 0.3 - 1, by - 2, 2, 11);
      if (weak) {
        // 綠色準星四角 = 可以丟球
        ctx.strokeStyle = P.capture;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        var c = 55, L = 16;
        var corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
        for (var i = 0; i < 4; i++) {
          var sx = corners[i][0], sy = corners[i][1];
          if (sy < 0) continue; // 上方兩角讓給血條
          ctx.beginPath();
          ctx.moveTo(sx * c, sy * (c - L)); ctx.lineTo(sx * c, sy * c); ctx.lineTo(sx * (c - L), sy * c);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(-c, -c + 22); ctx.lineTo(-c, -c + 8);
        ctx.moveTo(c, -c + 22); ctx.lineTo(c, -c + 8);
        ctx.stroke();
        txt(ctx, '虛弱', 0, 50, 17, P.capture);
      }
      ctx.restore();
    },

    drawBolt: function (ctx, state) {
      state = state || {};
      ctx.save();
      ctx.translate(num(state.x, 0), num(state.y, 0));
      rr(ctx, -5, -14, 10, 28, 5);
      ctx.fillStyle = P.player; ctx.fill();
      rr(ctx, -2.5, -11, 5, 20, 2.5);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.restore();
    },

    drawEnemyBullet: function (ctx, state) {
      state = state || {};
      var sp = SPECIES[state.species] || SPECIES.fire;
      ctx.save();
      ctx.translate(num(state.x, 0), num(state.y, 0));
      if (state.kind === 'rock') {
        // 大石: 判定半徑 22(規格), 畫面外緣 = 22
        var pts = [[0, -22], [15, -16], [22, -2], [17, 15], [3, 22], [-14, 17], [-22, 3], [-17, -14]];
        ctx.beginPath();
        for (var i = 0; i < pts.length; i++) {
          if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]); else ctx.lineTo(pts[i][0], pts[i][1]);
        }
        ctx.closePath();
        ctx.fillStyle = P.danger; ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2);
        ctx.fillStyle = '#7d7068'; ctx.fill();
        ctx.strokeStyle = '#3d342e'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(0, 2); ctx.lineTo(-3, 10); ctx.moveTo(6, -8); ctx.lineTo(9, 0);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fillStyle = P.danger; ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.lineWidth = 2; ctx.strokeStyle = P.dangerDark; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = sp.light; ctx.fill();
      }
      ctx.restore();
    },

    drawOrb: function (ctx, state) {
      state = state || {};
      var t = Math.max(0, num(state.t, 0));
      var res = state.result || 'flying';
      ctx.save();
      ctx.translate(num(state.x, 0), num(state.y, 0));
      if (res === 'broken') {
        ctx.globalAlpha = clamp(1 - t / 0.6, 0, 1);
        var d = Math.min(8, t * 40);
        for (var s = -1; s <= 1; s += 2) {
          ctx.save();
          ctx.translate(s * d, d * 0.4);
          ctx.rotate(s * Math.min(0.6, t * 3));
          ctx.beginPath();
          ctx.arc(0, 0, 11, s < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, s < 0 ? Math.PI * 1.5 : Math.PI * 0.5);
          ctx.closePath();
          ctx.fillStyle = '#8e8a99'; ctx.fill();
          ctx.lineWidth = 2.5; ctx.strokeStyle = P.outline; ctx.stroke();
          ctx.restore();
        }
        crossMark(ctx, 0, 0, 22, P.fail);
      } else {
        var sc = 1, ang = 0;
        if (res === 'caught') { ang = Math.sin(t * 30) * 0.25 * clamp(1 - t / 0.5, 0, 1); sc = 0.85; }
        ctx.save();
        ctx.rotate(ang);
        ctx.scale(sc, sc);
        ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, 19, Math.PI, Math.PI * 2); ctx.closePath();
        ctx.fillStyle = P.player; ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2);
        ctx.lineWidth = 3; ctx.strokeStyle = P.outline; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-19, 0); ctx.lineTo(19, 0); ctx.lineWidth = 3.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
        ctx.restore();
        if (res === 'caught') {
          ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.lineWidth = 3; ctx.strokeStyle = rgba(P.capture, clamp(1 - t / 0.8, 0.3, 1)); ctx.stroke();
          checkMark(ctx, 4, -2, 24, P.capture);
        }
      }
      ctx.restore();
    },

    drawTamer: function (ctx, state) {
      state = state || {};
      var x = num(state.x, 360), y = num(state.y, 635);
      var stunned = !!state.stunned;
      var sub = clamp(num(state.subdueProgress, 0), 0, 1);
      ctx.save();
      ctx.translate(x, y);
      if (state.blink && !stunned && Math.floor(now() * 12) % 2 === 0) ctx.globalAlpha = 0.3;
      if (sub > 0 && !stunned) {
        // 制伏中: 綠色呼吸光暈(進度畫在魔物身上)
        var pulse = 0.5 + 0.5 * Math.sin(now() * 10);
        ctx.beginPath(); ctx.arc(0, 2, 33, 0, Math.PI * 2);
        ctx.fillStyle = rgba(P.capture, 0.12 + 0.12 * pulse); ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = rgba(P.capture, 0.7); ctx.stroke();
      }
      // 鞭子(右手)
      ctx.beginPath();
      ctx.moveTo(22, 10);
      ctx.quadraticCurveTo(34, 26, 22, 30);
      ctx.quadraticCurveTo(8, 33, 14, 22);
      ctx.lineWidth = 3.5; ctx.strokeStyle = stunned ? '#6b5a48' : '#c08a4a'; ctx.stroke();
      hero(ctx, { muted: stunned, mood: stunned ? 'stunX' : 'calm' });
      // 帽子
      ctx.beginPath(); ctx.ellipse(0, -13, 21, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = stunned ? '#4a4040' : '#7a3e1c'; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = P.outline; ctx.stroke();
      rr(ctx, -11, -27, 22, 15, 4);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = stunned ? '#777' : P.gold;
      ctx.fillRect(-11, -16, 22, 3);
      if (stunned) {
        // 頭頂轉圈的星星
        var a0 = now() * 6;
        for (var i = 0; i < 3; i++) {
          var a = a0 + i * Math.PI * 2 / 3;
          var sx = Math.cos(a) * 22, sy = -23 + Math.sin(a) * 5;
          starPath(ctx, sx, sy, 7);
          ctx.fillStyle = '#ffe680'; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = P.outline; ctx.stroke();
        }
      }
      ctx.restore();
    },

    drawShowMonster: function (ctx, state) {
      state = state || {};
      var x = num(state.x, 360), y = num(state.y, 635);
      var rage = clamp(num(state.rage, 0), 0, 100);
      var mode = state.mode || 'roam';
      var dir = state.dir === -1 ? -1 : 1;
      var sub = clamp(num(state.subdueProgress, 0), 0, 1);
      var perf = !!state.performing && mode === 'roam';
      var R = 33;
      ctx.save();
      ctx.translate(x, y);
      // 失控 / 衝刺: 洋紅危險外圈(鋸齒)
      if (mode === 'loose' || mode === 'charge') {
        ctx.beginPath();
        var n = 14;
        for (var i = 0; i <= n * 2; i++) {
          var a = i * Math.PI / n + now() * (mode === 'loose' ? 2 : 0);
          var r = i % 2 === 0 ? 47 : 39;
          var px = Math.cos(a) * r, py = Math.sin(a) * r - 4;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = rgba(P.danger, mode === 'loose' ? 0.45 : 0.25); ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = P.danger; ctx.stroke();
      }
      // 表演中: 金色光芒(往外)
      if (perf) {
        ctx.save();
        ctx.strokeStyle = P.gold; ctx.lineWidth = 4; ctx.lineCap = 'round';
        for (var k = 0; k < 8; k++) {
          var aa = k * Math.PI / 4 + Math.PI / 8;
          ctx.beginPath();
          ctx.moveTo(Math.cos(aa) * 42, Math.sin(aa) * 42 - 6);
          ctx.lineTo(Math.cos(aa) * 51, Math.sin(aa) * 51 - 6);
          ctx.stroke();
        }
        ctx.restore();
      }
      // 本體
      ctx.save();
      var mood = 'calm';
      if (mode === 'charge' || mode === 'loose') mood = 'furious';
      else if (rage < 50) mood = 'sleepy';
      else mood = 'angry';
      if (mode === 'roam' && rage < 50) {
        // 趴著: 壓扁貼地
        ctx.translate(0, 8);
        ctx.scale(dir * 1.1, 0.78);
      } else if (perf) {
        ctx.translate(0, -6);
        ctx.scale(dir * 1.06, 1.06);
      } else {
        ctx.translate(0, -4);
        ctx.scale(dir, 1);
      }
      creature(ctx, state.species, R, mood, {});
      ctx.restore();
      if (mode === 'roam' && rage < 50) {
        txt(ctx, 'z', 30 * dir, -22, 16, '#cfd6ff', 'center', 'bold', 3);
      }
      if (mode === 'charge') {
        // 速度線(身後)
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (var j = -1; j <= 1; j++) {
          ctx.beginPath();
          ctx.moveTo(-dir * 36, j * 12 - 4); ctx.lineTo(-dir * 52, j * 12 - 4);
          ctx.stroke();
        }
      }
      // 怒氣條
      rageBar(ctx, 42, 80, mode === 'roam' ? rage : 100);
      // 制伏進度環
      if (sub > 0) {
        ctx.beginPath(); ctx.arc(0, -4, 50, 0, Math.PI * 2);
        ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -4, 50, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sub);
        ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.strokeStyle = P.capture; ctx.stroke();
      }
      ctx.restore();
    },

    drawHazard: function (ctx, state) {
      state = state || {};
      var x = num(state.x, 0), y = num(state.y, 0);
      var kind = state.kind || 'firering';
      var warn = state.phase === 'warn';
      var t = Math.max(0, num(state.t, 0));
      ctx.save();
      ctx.translate(x, y);
      if (kind === 'waterball') {
        var ang = num(state.angle, Math.PI / 2);
        ctx.rotate(ang);
        // 尾跡(身後)
        var g = ctx.createLinearGradient(-40, 0, 0, 0);
        g.addColorStop(0, rgba(P.danger, 0));
        g.addColorStop(1, rgba(P.danger, 0.6));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(0, -9); ctx.lineTo(0, 9); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fillStyle = P.danger; ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
        ctx.lineWidth = 2.5; ctx.strokeStyle = P.dangerDark; ctx.stroke();
        ctx.beginPath(); ctx.arc(1, 0, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = SPECIES.water.light; ctx.fill();
        ctx.restore();
        return;
      }
      var R = num(state.radius, kind === 'thunder' ? 70 : 120);
      if (kind === 'quake') {
        var inner = Math.max(0, R - 30);
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0.1, R), 0, Math.PI * 2);
        if (inner > 0) ctx.arc(0, 0, inner, 0, Math.PI * 2, true);
        ctx.fillStyle = rgba(P.danger, warn ? 0.18 : 0.5);
        ctx.fill('evenodd');
        if (warn) ctx.setLineDash([10, 8]);
        ctx.lineWidth = 3; ctx.strokeStyle = P.danger;
        ctx.beginPath(); ctx.arc(0, 0, Math.max(0.1, R - 1.5), 0, Math.PI * 2); ctx.stroke();
        if (inner > 0) { ctx.beginPath(); ctx.arc(0, 0, inner + 1.5, 0, Math.PI * 2); ctx.stroke(); }
        ctx.setLineDash([]);
        // 裂痕
        if (!warn && R > 20) {
          ctx.strokeStyle = P.dangerDark; ctx.lineWidth = 2.5;
          for (var c = 0; c < 10; c++) {
            var a = c * Math.PI / 5;
            var r0 = inner + 6, r1 = R - 6;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
            ctx.lineTo(Math.cos(a + 0.05) * (r0 + r1) / 2 + 3, Math.sin(a + 0.05) * (r0 + r1) / 2);
            ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
            ctx.stroke();
          }
        }
        ctx.restore();
        return;
      }
      // firering / thunder: 圓形區
      var dur = kind === 'thunder' ? 0.8 : 0.4;
      if (warn) {
        // 預警: 虛線外框 + 由中心長大的填色, 長滿 = 生效
        var p = clamp(t / dur, 0, 1);
        ctx.beginPath(); ctx.arc(0, 0, R * p, 0, Math.PI * 2);
        ctx.fillStyle = rgba(P.danger, 0.28); ctx.fill();
        ctx.setLineDash([12, 9]);
        ctx.beginPath(); ctx.arc(0, 0, R - 1.5, 0, Math.PI * 2);
        ctx.lineWidth = 3; ctx.strokeStyle = P.danger; ctx.stroke();
        ctx.setLineDash([]);
        if (kind === 'thunder') {
          // 準星
          ctx.beginPath();
          ctx.moveTo(-18, 0); ctx.lineTo(18, 0); ctx.moveTo(0, -18); ctx.lineTo(0, 18);
          ctx.lineWidth = 3; ctx.stroke();
        }
      } else {
        var flick = 0.5 + 0.5 * Math.sin(now() * 25);
        ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fillStyle = rgba(P.danger, 0.5 + 0.1 * flick); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, R - 2, 0, Math.PI * 2);
        ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        if (kind === 'firering') {
          // 火舌朝內(不超出判定圓)
          ctx.fillStyle = 'rgba(255,214,120,0.85)';
          for (var f = 0; f < 16; f++) {
            var fa = f * Math.PI / 8 + now() * 1.5;
            var r2 = R - 4, r3 = R - 22 - 6 * flick;
            ctx.beginPath();
            ctx.moveTo(Math.cos(fa - 0.1) * r2, Math.sin(fa - 0.1) * r2);
            ctx.lineTo(Math.cos(fa) * r3, Math.sin(fa) * r3);
            ctx.lineTo(Math.cos(fa + 0.1) * r2, Math.sin(fa + 0.1) * r2);
            ctx.closePath(); ctx.fill();
          }
        } else {
          // 落雷: 天上劈下的閃電
          ctx.beginPath();
          ctx.moveTo(-10, -R - 260); ctx.lineTo(14, -R - 170); ctx.lineTo(-8, -R - 120);
          ctx.lineTo(16, -R - 40); ctx.lineTo(-6, -20); ctx.lineTo(4, 0);
          ctx.lineWidth = 12; ctx.strokeStyle = rgba(P.danger, 0.7); ctx.stroke();
          ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        }
      }
      ctx.restore();
    },

    drawWhipCrack: function (ctx, state) {
      state = state || {};
      var t = Math.max(0, num(state.t, 0));
      var R = num(state.radius, 130);
      var DUR = 0.35;
      if (t > DUR) return;
      var a = 1 - t / DUR;
      ctx.save();
      ctx.translate(num(state.x, 0), num(state.y, 0));
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fillStyle = rgba(P.capture, 0.14); ctx.fill();
      // 外緣 = 揮鞭半徑, 從內緣往內描
      ctx.beginPath(); ctx.arc(0, 0, R - 3, 0, Math.PI * 2);
      ctx.lineWidth = 6; ctx.strokeStyle = P.outline; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, R - 3, 0, Math.PI * 2);
      ctx.lineWidth = 3.5; ctx.strokeStyle = '#d8ffe6'; ctx.stroke();
      // 中央啪的一聲
      var s = 14 + 14 * Math.min(1, t / 0.1);
      ctx.strokeStyle = P.playerLight; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (var i = 0; i < 6; i++) {
        var aa = i * Math.PI / 3 + 0.3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(aa) * s * 0.4, Math.sin(aa) * s * 0.4);
        ctx.lineTo(Math.cos(aa) * s, Math.sin(aa) * s);
        ctx.stroke();
      }
      ctx.restore();
    },

    drawFence: function (ctx, state) {
      state = state || {};
      ctx.save();
      ctx.translate(num(state.x, 0), num(state.y, 0));
      if (!state.broken) {
        ctx.fillStyle = P.fenceDark;
        ctx.fillRect(-50, -8, 100, 16);
        ctx.fillStyle = P.fence;
        ctx.fillRect(-48, -6, 96, 5);
        ctx.fillRect(-48, 2, 96, 5);
        ctx.fillStyle = P.fenceDark;
        ctx.fillRect(-48, -8, 7, 16);
        ctx.fillRect(41, -8, 7, 16);
        ctx.fillRect(-3, -8, 6, 16);
      } else {
        // 破損: 中間斷開, 兩端斷木
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(-50, -8, 100, 16);
        ctx.fillStyle = '#6d4a2a';
        ctx.beginPath();
        ctx.moveTo(-48, -6); ctx.lineTo(-20, -6); ctx.lineTo(-12, -2); ctx.lineTo(-22, -1); ctx.lineTo(-48, -1); ctx.closePath();
        ctx.moveTo(48, 2); ctx.lineTo(22, 2); ctx.lineTo(14, 5); ctx.lineTo(24, 7); ctx.lineTo(48, 7); ctx.closePath();
        ctx.fill();
        ctx.fillStyle = P.fenceDark;
        ctx.fillRect(-48, -8, 7, 16);
        ctx.fillRect(41, -8, 7, 16);
        ctx.strokeStyle = P.fail; ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(-49, -7, 98, 14);
        ctx.setLineDash([]);
      }
      ctx.restore();
    },

    drawVisitor: function (ctx, state) {
      state = state || {};
      var seat = Math.abs(Math.round(num(state.seat, 0)));
      var mode = state.mode || 'watch';
      var shirt = VISITOR_COLORS[seat % VISITOR_COLORS.length];
      ctx.save();
      ctx.translate(num(state.x, 0), num(state.y, 0));
      // 座椅
      rr(ctx, -26, 26, 52, 16, 4);
      ctx.fillStyle = P.seat; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#4c4166'; ctx.stroke();
      if (mode === 'empty') {
        ctx.setLineDash([5, 4]);
        rr(ctx, -16, -20, 32, 44, 8);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        return;
      }
      var scared = mode === 'scared';
      if (scared) ctx.rotate(0.18);
      ctx.lineJoin = 'round';
      // 身體
      rr(ctx, -16, -2, 32, 36, 10);
      ctx.fillStyle = scared ? mix(shirt, '#888888', 0.4) : shirt; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = P.outline; ctx.stroke();
      // 手
      ctx.strokeStyle = '#f1c9a5'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath();
      if (scared) { ctx.moveTo(-14, 4); ctx.lineTo(-24, -22); ctx.moveTo(14, 4); ctx.lineTo(24, -22); }
      else { ctx.moveTo(-14, 6); ctx.lineTo(-20, 22); ctx.moveTo(14, 6); ctx.lineTo(20, 22); }
      ctx.stroke();
      // 頭
      ctx.beginPath(); ctx.arc(0, -16, 13, 0, Math.PI * 2);
      ctx.fillStyle = '#f1c9a5'; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = P.outline; ctx.stroke();
      ctx.fillStyle = P.outline;
      if (scared) {
        ctx.beginPath(); ctx.arc(-5, -18, 2.5, 0, Math.PI * 2); ctx.arc(5, -18, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, -9, 3.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(-5, -17, 2, 0, Math.PI * 2); ctx.arc(5, -17, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -12, 5, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.restore();
      if (scared) {
        ctx.save();
        ctx.translate(num(state.x, 0), num(state.y, 0));
        txt(ctx, '!', 20, -34, 20, P.fail, 'center', 'bold', 4);
        ctx.restore();
      }
    },

    drawTitleCard: function (ctx, state) {
      state = state || {};
      var day = Math.round(num(state.day, 1));
      var show = state.stage === 'show';
      ctx.save();
      ctx.fillStyle = 'rgba(10,8,16,0.82)';
      ctx.fillRect(0, 0, 720, 1280);
      rr(ctx, 80, 420, 560, 440, 24);
      ctx.fillStyle = show ? '#3a2f22' : '#1f2438';
      ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = show ? P.gold : P.player; ctx.stroke();
      txt(ctx, '第 ' + day + ' 天', 360, 490, 40, P.textDim);
      txt(ctx, show ? '表演場' : '地下城', 360, 560, 68, P.text);
      // 小景: 遊戲內畫法
      if (show) {
        ctx.save(); ctx.translate(290, 690);
        Art.drawWhipCrack(ctx, { x: 0, y: 0, radius: 70, t: 0.05 });
        ctx.restore();
        Art.drawTamer(ctx, { x: 290, y: 690, stunned: false, blink: false, subdueProgress: 0 });
        Art.drawShowMonster(ctx, { x: 440, y: 690, species: 'fire', rage: 75, performing: true, mode: 'roam', subdueProgress: 0, dir: -1 });
      } else {
        Art.drawMonster(ctx, { x: 440, y: 680, species: 'water', hp: 3, maxHp: 10, hit: false, weak: true });
        Art.drawOrb(ctx, { x: 360, y: 730, result: 'flying', t: 0 });
        Art.drawPlayer(ctx, { x: 290, y: 760, hearts: 5, maxHearts: 5, blink: false });
      }
      var blink = 0.55 + 0.45 * Math.sin(now() * 4);
      ctx.globalAlpha = blink;
      txt(ctx, '點畫面開始', 360, 815, 28, P.text);
      ctx.restore();
    },

    drawButton: function (ctx, state) {
      state = state || {};
      var x = num(state.x, 0), y = num(state.y, 0), w = num(state.w, 200), h = num(state.h, 80);
      var on = state.enabled !== false;
      ctx.save();
      rr(ctx, x, y, w, h, 18);
      ctx.fillStyle = on ? P.player : '#3a3646';
      ctx.fill();
      ctx.lineWidth = 4;
      if (!on) ctx.setLineDash([10, 8]);
      ctx.strokeStyle = on ? P.outline : '#5c5670';
      ctx.stroke();
      ctx.setLineDash([]);
      if (on) {
        rr(ctx, x + 6, y + 6, w - 12, h * 0.35, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
      }
      txt(ctx, state.label || '', x + w / 2, y + h / 2 + 2, Math.min(40, h * 0.42), on ? '#08240f' : '#7d7790', 'center', 'bold', 0);
      ctx.restore();
    },

    drawShopItem: function (ctx, state) {
      state = state || {};
      var x = num(state.x, 360), y = num(state.y, 300);
      var ok = !!state.affordable;
      var info = {
        power: ['火力', '子彈攻擊力 +1'],
        orbBag: ['球袋', '捕獲球上限 +1'],
        armor: ['護甲', '心數上限 +1'],
        longWhip: ['長鞭', '揮鞭範圍 +30']
      }[state.item] || ['強化', ''];
      ctx.save();
      ctx.translate(x, y);
      rr(ctx, -298, -68, 596, 136, 16);
      ctx.fillStyle = ok ? P.panel : '#1d1928'; ctx.fill();
      ctx.lineWidth = 4;
      if (!ok) ctx.setLineDash([10, 8]);
      ctx.strokeStyle = ok ? P.gold : '#4a4458'; ctx.stroke();
      ctx.setLineDash([]);
      // 圖示框
      rr(ctx, -282, -52, 104, 104, 14);
      ctx.fillStyle = '#15121f'; ctx.fill();
      ctx.save();
      ctx.translate(-230, 0);
      if (!ok) ctx.globalAlpha = 0.5;
      if (state.item === 'power') {
        Art.drawBolt(ctx, { x: -14, y: 6 }); Art.drawBolt(ctx, { x: 14, y: -6 });
      } else if (state.item === 'orbBag') {
        Art.drawOrb(ctx, { x: 0, y: 0, result: 'flying', t: 0 });
      } else if (state.item === 'armor') {
        heart(ctx, 0, 4, 52, true);
      } else if (state.item === 'longWhip') {
        ctx.beginPath(); ctx.arc(0, 0, 38, 0, Math.PI * 2);
        ctx.lineWidth = 4; ctx.strokeStyle = '#d8ffe6'; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(216,255,230,0.5)'; ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
      var dimA = ok ? 1 : 0.55;
      ctx.globalAlpha = dimA;
      txt(ctx, info[0], -156, -22, 34, P.text, 'left');
      txt(ctx, info[1], -156, 20, 22, P.textDim, 'left', 'normal', 3);
      txt(ctx, '已買 ' + Math.max(0, Math.round(num(state.level, 0))) + ' 次', -156, 50, 17, P.textDim, 'left', 'normal', 3);
      ctx.globalAlpha = 1;
      // 價格
      coin(ctx, 170, 0, 18);
      txt(ctx, String(Math.round(num(state.cost, 0))), 280, 2, 40, ok ? P.gold : P.fail, 'right');
      ctx.restore();
    },

    drawFloatText: function (ctx, state) {
      state = state || {};
      var t = Math.max(0, num(state.t, 0));
      var kind = state.kind || 'gold';
      var a = t < 0.7 ? 1 : clamp(1 - (t - 0.7) / 0.5, 0, 1);
      if (a <= 0) return;
      var x = num(state.x, 0), y = num(state.y, 0) - Math.min(1, t / 1.0) * 50;
      var col = kind === 'gold' ? P.gold : (kind === 'repUp' ? P.rep : P.fail);
      var size = kind === 'repDown' ? 30 : 28;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = 'bold ' + size + 'px ' + FONT;
      var s = String(state.text === undefined ? '' : state.text);
      var tw = ctx.measureText ? (ctx.measureText(s).width || s.length * size * 0.6) : s.length * size * 0.6;
      var iconX = x - tw / 2 - 14;
      if (kind === 'gold') coin(ctx, iconX, y, 12);
      else star(ctx, iconX, y, 14, kind === 'repUp');
      if (kind === 'repDown') {
        // 失去的名聲: 星星上打斜線
        ctx.beginPath(); ctx.moveTo(iconX - 12, y + 12); ctx.lineTo(iconX + 12, y - 12);
        ctx.lineWidth = 4; ctx.strokeStyle = P.fail; ctx.stroke();
      }
      txt(ctx, s, x + 6, y, size, col, 'center');
      ctx.restore();
    },

    drawResultPanel: function (ctx, state) {
      state = state || {};
      var stars = clamp(Math.round(num(state.stars, 0)), 0, 3);
      ctx.save();
      ctx.fillStyle = 'rgba(10,8,16,0.88)';
      ctx.fillRect(0, 0, 720, 1280);
      rr(ctx, 60, 300, 600, 680, 28);
      ctx.fillStyle = P.panel; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = P.rep; ctx.stroke();
      txt(ctx, '三天的表演結束', 360, 380, 44, P.text);
      var th = [50, 120, 200];
      for (var i = 0; i < 3; i++) {
        var sx = 210 + i * 150;
        star(ctx, sx, 510, 56, i < stars);
        txt(ctx, '名聲 ' + th[i], sx, 590, 18, P.textDim, 'center', 'normal', 3);
      }
      // 數值
      star(ctx, 180, 690, 22, true);
      txt(ctx, '總名聲', 220, 690, 30, P.textDim, 'left');
      txt(ctx, String(Math.round(num(state.rep, 0))), 560, 690, 44, P.rep, 'right');
      coin(ctx, 180, 780, 20);
      txt(ctx, '累計金幣', 220, 780, 30, P.textDim, 'left');
      txt(ctx, String(Math.round(num(state.goldEarned, 0))), 560, 780, 44, P.gold, 'right');
      var blink = 0.55 + 0.45 * Math.sin(now() * 4);
      ctx.globalAlpha = blink;
      txt(ctx, '點畫面重來', 360, 910, 30, P.text);
      ctx.restore();
    },

    drawHud: function (ctx, state) {
      state = state || {};
      var phase = state.phase || 'dungeon';
      if (phase === 'guide' || phase === 'result') return;
      ctx.save();
      ctx.fillStyle = P.hudBg;
      ctx.fillRect(0, 0, 720, 120);
      ctx.fillStyle = P.hudLine;
      ctx.fillRect(0, 118, 720, 2);
      var day = Math.round(num(state.day, 1));
      var stageName = { dungeon: '地下城', show: '表演場', shop: '商店', title: '' }[phase] || '';
      txt(ctx, '第 ' + day + ' 天' + (stageName ? ' · ' + stageName : ''), 20, 34, 24, P.textDim, 'left');
      // 金幣 / 名聲(右上)
      var rep = String(Math.round(num(state.rep, 0)));
      var gold = String(Math.round(num(state.gold, 0)));
      txt(ctx, rep, 700, 34, 28, P.rep, 'right');
      star(ctx, 700 - rep.length * 17 - 22, 34, 14, true);
      var gx = 700 - rep.length * 17 - 58;
      txt(ctx, gold, gx, 34, 28, P.gold, 'right');
      coin(ctx, gx - gold.length * 17 - 18, 34, 12);
      // 時間(中央)
      if ((phase === 'dungeon' || phase === 'show') && state.timeLeft !== undefined) {
        var tl = Math.max(0, Math.ceil(num(state.timeLeft, 0)));
        txt(ctx, String(tl), 360, 36, 46, tl <= 5 ? P.fail : P.text);
      }
      var msg = state.message ? String(state.message) : '';
      var sub = clamp(num(state.subdueProgress, 0), 0, 1);
      if (phase === 'dungeon') {
        var maxH = Math.max(0, Math.round(num(state.maxHearts, 5)));
        var hearts = Math.round(num(state.hearts, maxH));
        var step = Math.min(30, 230 / Math.max(1, maxH));
        for (var i = 0; i < maxH; i++) heart(ctx, 34 + i * step, 88, Math.min(28, step - 2), i < hearts);
        // 名單(右)
        var roster = Math.round(num(state.roster, 0)), rmax = Math.round(num(state.rosterMax, 6));
        var full = roster >= rmax;
        txt(ctx, '名單 ' + roster + '/' + rmax, 700, 88, 22, full ? P.fail : P.textDim, 'right');
        // 捕獲球
        var om = Math.max(0, Math.round(num(state.orbMax, 3))), orbs = Math.round(num(state.orbs, om));
        var ostep = Math.min(28, 150 / Math.max(1, om));
        var ox = 570 - om * ostep;
        for (var j = 0; j < om; j++) {
          ctx.save();
          ctx.translate(ox + j * ostep + ostep / 2, 88);
          var sc = (ostep - 4) / 40;
          ctx.scale(sc, sc);
          if (j < orbs) Art.drawOrb(ctx, { x: 0, y: 0, result: 'flying', t: 0 });
          else {
            ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.setLineDash([6, 5]); ctx.lineWidth = 3; ctx.strokeStyle = '#5c5670'; ctx.stroke();
            ctx.setLineDash([]);
          }
          ctx.restore();
        }
        if (msg) {
          // 訊息: 只放在第二列中段(心與球之間), 不壓遊戲區
          ctx.font = 'bold 20px ' + FONT;
          txt(ctx, msg, 330, 88, 20, P.fail, 'center');
        }
      } else if (phase === 'show') {
        if (msg) {
          var hasBar = sub > 0 || /制伏/.test(msg);
          var mx = hasBar ? 260 : 360;
          txt(ctx, msg, mx, 88, 24, P.danger, 'center');
          if (hasBar) {
            rr(ctx, 480, 78, 200, 20, 8);
            ctx.fillStyle = P.outline; ctx.fill();
            if (sub > 0) {
              rr(ctx, 482, 80, 196 * sub, 16, 7);
              ctx.fillStyle = P.capture; ctx.fill();
            }
          }
        } else {
          var r2 = Math.round(num(state.roster, 0));
          txt(ctx, '上場 ' + r2 + ' 隻', 20, 88, 20, P.textDim, 'left', 'normal', 3);
        }
      } else if (phase === 'shop') {
        txt(ctx, '買強化, 準備明天', 360, 88, 24, P.text, 'center');
      }
      ctx.restore();
    },

    // ---------- 說明頁示意圖 ----------
    drawGuidePage: function (ctx, state) {
      state = state || {};
      var page = Math.round(num(state.page, 0));
      var bx = num(state.x, 60), by = num(state.y, 300), bw = num(state.w, 600), bh = num(state.h, 600);
      var V = 600;
      var s = Math.min(bw / V, bh / V);
      ctx.save();
      ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
      ctx.translate(bx + (bw - V * s) / 2, by + (bh - V * s) / 2);
      ctx.scale(s, s);
      if (GUIDE[page]) GUIDE[page](ctx);
      ctx.restore();
    }
  };

  function frame(ctx, x, y, w, h, fill) {
    rr(ctx, x, y, w, h, 16);
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = P.panelLine; ctx.stroke();
  }
  function label(ctx, s, x, y, col) { txt(ctx, s, x, y, 22, col || P.text, 'center'); }

  var GUIDE = [
    // 第 1 頁 地下城
    function (ctx) {
      frame(ctx, 0, 0, 600, 600, P.dungeonFloor);
      ctx.save();
      rr(ctx, 0, 0, 600, 600, 16); ctx.clip();
      ctx.setLineDash([12, 10]);
      ctx.strokeStyle = 'rgba(62,224,122,0.22)'; ctx.lineWidth = 2;
      ctx.strokeRect(20, 330, 560, 250);
      ctx.setLineDash([]);
      Art.drawMonster(ctx, { x: 170, y: 120, species: 'fire', hp: 14, maxHp: 14, hit: false, weak: false });
      Art.drawMonster(ctx, { x: 430, y: 150, species: 'water', hp: 8, maxHp: 10, hit: true, weak: false });
      // 火蜥蜴扇形彈
      var fb = [[170, 210], [140, 260], [200, 260], [110, 310], [230, 310]];
      for (var i = 0; i < fb.length; i++) Art.drawEnemyBullet(ctx, { x: fb[i][0], y: fb[i][1], kind: 'normal', species: 'fire' });
      // 水母瞄準彈
      Art.drawEnemyBullet(ctx, { x: 395, y: 250, kind: 'normal', species: 'water' });
      Art.drawEnemyBullet(ctx, { x: 345, y: 360, kind: 'normal', species: 'water' });
      // 子彈往上
      for (var b = 0; b < 4; b++) Art.drawBolt(ctx, { x: 300, y: 400 - b * 55 });
      Art.drawPlayer(ctx, { x: 300, y: 470, hearts: 5, maxHearts: 5, blink: false });
      // 左右閃
      arrowLine(ctx, 262, 500, 170, 500, '#ffffff', true, 4);
      arrowLine(ctx, 338, 500, 430, 500, '#ffffff', true, 4);
      cursorArrow(ctx, 300, 470, 1.2);
      label(ctx, '你', 300, 545, P.player);
      ctx.restore();
    },
    // 第 2 頁 捕獲
    function (ctx) {
      frame(ctx, 0, 0, 292, 600, P.dungeonFloor);
      frame(ctx, 308, 0, 292, 600, P.dungeonFloor);
      // 左: 虛弱 → 抓到
      ctx.save();
      ctx.globalAlpha = 0.45;
      Art.drawMonster(ctx, { x: 146, y: 170, species: 'thunder', hp: 3, maxHp: 16, hit: false, weak: true });
      ctx.restore();
      Art.drawOrb(ctx, { x: 146, y: 200, result: 'caught', t: 0.1 });
      ctx.setLineDash([6, 8]); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(146, 440); ctx.lineTo(146, 230); ctx.stroke(); ctx.setLineDash([]);
      Art.drawPlayer(ctx, { x: 146, y: 490, hearts: 5, maxHearts: 5, blink: false });
      checkMark(ctx, 146, 330, 60, P.capture);
      label(ctx, '抓到', 146, 380, P.capture);
      // 右: 滿血 → 球碎
      Art.drawMonster(ctx, { x: 454, y: 170, species: 'thunder', hp: 16, maxHp: 16, hit: false, weak: false });
      Art.drawOrb(ctx, { x: 454, y: 238, result: 'broken', t: 0.15 });
      ctx.setLineDash([6, 8]); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(454, 440); ctx.lineTo(454, 262); ctx.stroke(); ctx.setLineDash([]);
      Art.drawPlayer(ctx, { x: 454, y: 490, hearts: 5, maxHearts: 5, blink: false });
      crossMark(ctx, 454, 330, 56, P.fail);
      label(ctx, '球碎了', 454, 380, P.fail);
    },
    // 第 3 頁 揮鞭
    function (ctx) {
      frame(ctx, 0, 0, 600, 600, P.showSand);
      ctx.save();
      rr(ctx, 0, 0, 600, 600, 16); ctx.clip();
      Art.drawShowMonster(ctx, { x: 470, y: 470, species: 'stone', rage: 20, performing: false, mode: 'roam', subdueProgress: 0, dir: -1 });
      Art.drawWhipCrack(ctx, { x: 250, y: 260, radius: 130, t: 0.06 });
      Art.drawShowMonster(ctx, { x: 175, y: 220, species: 'fire', rage: 45, performing: false, mode: 'roam', subdueProgress: 0, dir: 1 });
      Art.drawShowMonster(ctx, { x: 320, y: 330, species: 'water', rage: 70, performing: false, mode: 'roam', subdueProgress: 0, dir: -1 });
      Art.drawTamer(ctx, { x: 250, y: 255, stunned: false, blink: false, subdueProgress: 0 });
      cursorArrow(ctx, 250, 255, 1.2);
      // 怒氣上升箭頭(貼在怒氣條旁)
      arrowLine(ctx, 228, 275, 228, 248, P.gold, false, 5);
      arrowLine(ctx, 373, 385, 373, 358, P.gold, false, 5);
      label(ctx, '沒變', 470, 545, P.textDim);
      ctx.restore();
    },
    // 第 4 頁 怒氣
    function (ctx) {
      frame(ctx, 0, 0, 600, 600, P.showSand);
      ctx.save();
      rr(ctx, 0, 0, 600, 600, 16); ctx.clip();
      ctx.fillStyle = P.stands;
      ctx.fillRect(0, 0, 600, 150);
      var cols = [100, 300, 500];
      Art.drawVisitor(ctx, { x: 100, y: 80, seat: 0, mode: 'watch' });
      Art.drawVisitor(ctx, { x: 300, y: 80, seat: 1, mode: 'watch' });
      Art.drawVisitor(ctx, { x: 500, y: 80, seat: 2, mode: 'scared' });
      Art.drawFence(ctx, { x: 100, y: 160, side: 'top', broken: false });
      Art.drawFence(ctx, { x: 300, y: 160, side: 'top', broken: false });
      Art.drawFence(ctx, { x: 500, y: 160, side: 'top', broken: true });
      // 分隔線
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(200, 175); ctx.lineTo(200, 600); ctx.moveTo(400, 175); ctx.lineTo(400, 600); ctx.stroke();
      // 低: 趴著
      Art.drawShowMonster(ctx, { x: cols[0], y: 330, species: 'water', rage: 20, performing: false, mode: 'roam', subdueProgress: 0, dir: 1 });
      // 中高: 表演 + 技能 + 金幣名聲
      Art.drawShowMonster(ctx, { x: cols[1], y: 330, species: 'water', rage: 75, performing: true, mode: 'roam', subdueProgress: 0, dir: 1 });
      var base = Math.PI / 2;
      for (var k = -1; k <= 1; k++) {
        var a = base + k * 20 * Math.PI / 180;
        Art.drawHazard(ctx, { x: cols[1] + Math.cos(a) * 110, y: 330 + Math.sin(a) * 110, kind: 'waterball', phase: 'active', radius: 12, t: 0.3, angle: a });
      }
      Art.drawFloatText(ctx, { x: cols[1] - 40, y: 250, text: '+3', kind: 'gold', t: 0.2 });
      Art.drawFloatText(ctx, { x: cols[1] + 50, y: 250, text: '+1', kind: 'repUp', t: 0.2 });
      // 滿: 衝破圍欄
      Art.drawShowMonster(ctx, { x: cols[2], y: 185, species: 'water', rage: 100, performing: false, mode: 'loose', subdueProgress: 0, dir: 1 });
      Art.drawFloatText(ctx, { x: cols[2], y: 285, text: '-3', kind: 'repDown', t: 0.2 });
      crossMark(ctx, cols[2], 380, 60, P.fail);
      label(ctx, '不表演', cols[0], 540, P.textDim);
      label(ctx, '表演', cols[1], 540, P.gold);
      label(ctx, '失控', cols[2], 540, P.danger);
      ctx.restore();
    },
    // 第 5 頁 一天的流程
    function (ctx) {
      function node(x, y, name, col, draw) {
        rr(ctx, x - 90, y - 70, 180, 140, 18);
        ctx.fillStyle = P.panel; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
        draw();
        txt(ctx, name, x, y + 48, 26, P.text);
      }
      node(300, 90, '地下城', P.player, function () {
        Art.drawMonster(ctx, { x: 270, y: 70, species: 'fire', hp: 3, maxHp: 14, hit: false, weak: true });
        Art.drawOrb(ctx, { x: 340, y: 70, result: 'flying', t: 0 });
      });
      node(480, 340, '表演場', P.gold, function () {
        Art.drawTamer(ctx, { x: 445, y: 315, stunned: false, blink: false, subdueProgress: 0 });
        Art.drawShowMonster(ctx, { x: 515, y: 312, species: 'water', rage: 75, performing: true, mode: 'roam', subdueProgress: 0, dir: -1 });
      });
      node(120, 340, '商店', P.gold, function () {
        coin(ctx, 95, 315, 18);
        heart(ctx, 145, 318, 38, true);
      });
      arrowLine(ctx, 395, 120, 470, 262, '#ffffff', false, 5);
      arrowLine(ctx, 385, 350, 215, 350, '#ffffff', false, 5);
      arrowLine(ctx, 135, 265, 205, 125, '#ffffff', false, 5);
      txt(ctx, '第 1~3 天', 300, 245, 26, P.textDim);
      // 第 3 天後 → 結算
      arrowLine(ctx, 480, 415, 410, 505, P.rep, true, 5);
      rr(ctx, 160, 480, 240, 100, 18);
      ctx.fillStyle = P.panel; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = P.rep; ctx.stroke();
      for (var i = 0; i < 3; i++) star(ctx, 215 + i * 65, 520, 24, true);
      txt(ctx, '結算', 280, 560, 22, P.text);
      txt(ctx, '第 3 天後', 500, 470, 20, P.rep, 'left');
    }
  ];

  window.Art = Art;
})();
