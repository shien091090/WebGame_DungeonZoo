# 連鎖總機 — 美術規格(style.md)

> `index.html` 必須宣告 `<meta charset="utf-8">`, 否則 art.js 裡的中文會變亂碼。
> 全部函式掛在 `window.Art`, 參數固定 `(ctx, state)`(`drawBackground` 只有 `ctx`), 每個函式自己 save/restore。座標一律是**畫面座標**(地下城已扣鏡頭), 中心點; 只有 `drawButton` 的 x,y 是左上角。

## 1. 邏輯畫布尺寸

720 × 1280(直式)。HUD 佔 y 0~120。

## 2. 色票表

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg | `#14151b` | 全畫面底色 |
| hudBg | `#0c0d12` | HUD 底 |
| text / textDim | `#f2f2f5` / `#9aa0ad` | 主文字 / 次要文字 |
| wall / wallTop | `#1a1b23` / `#2b2d39` | 牆 |
| floorHall / Crag / Ruins / Pond / Lava | `#363944` `#463f33` `#363b4b` `#2c3d46` `#422c2a` | 五區地板(低對比, 只讓人分區) |
| water | `#1c4f78`(波紋 `#5b9cc8`) | 水格(減速) |
| lava | `#ff6a1a`(結痂 `#6e200e`, 亮 `#ffd25a`) | 熔岩格(危險, 全地圖最亮的地形) |
| pillar | `#6a6d7c` | 石柱 |
| nest | `#8a6a3e` | 巢穴枝圈 |
| **fire** 火蜥蜴 | `#ec4a2c` | 物種色; 火圈 |
| **thunder** 雷鳥 | `#c6e02a` | 物種色; 落雷 |
| **water_sp** 水母 | `#3a86ff` | 物種色; 水彈 |
| **stone** 石像鬼 | `#c060e0` | 物種色; 震波 |
| player | `#f4ead2` | 馴獸師身體(帽 `#6b4a2e`) |
| parry / select | `#ffffff` | **白 = 玩家的動作**: 彈反護罩、反擊光束、選擇框 |
| capture | `#3fe08a` | **綠 = 收服**: 殘血血條、捕捉記號、套索、捕獸繩、打勾 |
| danger | `#ff3b30` | **紅 = 危險 / 失去**: 失控鋸齒圈、怒氣 ≥80、名聲減、打叉、時間 ≤10 |
| gold | `#ffc83a` | 金幣、評價星 |
| rep | `#ff7ad9` | 名聲(星形) |
| snack | `#d8955a` | 點心(骨頭肉形) |
| rageLow / rageMid / rageHigh | `#8f97a8` / `#ffb21e` / `#ff3b30` | 怒氣條 <40 / 40~79 / 80~99 |
| heart | `#ff4d6a` | 心 |

物種色 + 收服綠的色相與灰階(node 計算):

| 色 | 色相 | 灰階 |
|---|---|---|
| fire | 9° | 119 |
| thunder | 69° | 195 |
| capture | 148° | 166 |
| water_sp | 217° | 125 |
| stone | 285° | 139 |

五色在色環上約每 60~80° 一個, 兩兩 ≥ 60°(最近: thunder—fire 60°、capture—water 69°), 各落在自己色名中心(紅 / 黃綠 / 綠 / 藍 / 紫), 不分食中間色名。雷鳥刻意不用典型黃(黃與紅相鄰)。fire 與 water 灰階相近, 但色相相反、形狀完全不同, 不會同框混淆。

## 3. 形狀語言

扁平填色 + 深色描邊(`#0b0b10`), 圓角; 物種靠剪影分(長條蜥蜴 / 三角翼鳥 / 半圓傘水母 / 方塊石像鬼), 危險靠鋸齒與紅, 玩家的動作一律白。

## 4. 理念落實

- **P0 辨識度先於好看**: 四種魔物同時用「剪影 + 色相」兩條通道分開, 地下城與表演場用同一個本體畫法, 縮到 HUD 陣容格(半徑 10)仍認得出。
- **P1 視覺權重跟著決策迫切度走**: 地板五區全壓在低明度、低飽和; 最亮的是技能預警與熔岩(馬上要躲)、白色彈反護罩(此刻能不能彈)、怒氣條(表演場唯一的決策讀數)。
- **P2 規則存在畫面就存在**: 盾冷卻(背後灰盾 vs 藍盾)、彈反時機(白護罩圈)、殘血門檻(血條 30% 綠刻度)、點名門檻 40(白刻度)、連鎖線 80(紅刻度)、空台座(虛線圓 + 「空」)、拿起來源(白虛線圈)都有獨立外觀; 馴獸師身體圓 = 判定半徑 18。
- **P3 一個意義一種長相**: 白 = 玩家動作、綠 = 收服、紅 + 鋸齒 = 危險 / 失去、金 = 錢、粉星 = 名聲、骨頭肉 = 點心; HUD、商店、飄字、說明頁共用同一組圖示函式; 技能在地下城與表演場同一個函式畫。
- **P4 關鍵區分走兩條通道**: 反擊 vs 收服 = 白色鋸齒光束 + 爆星 vs 綠色波浪繩 + 收緊套圈; 盾可用 vs 冷卻 = 藍 vs 灰 + 實 vs 暗; 失控 = 紅鋸齒圈 + 怒眼(不只變色)。
- **P7 每個元素都要掙得版面**: 表演場不畫技能會打到哪幾座的輔助線(規格要玩家自己摸), 只在落雷預警時畫施放者到目標的虛線(那是此刻真的要劈下來的現況); 台座編號縮成角落小字。
- **P9 以最混亂的那一刻驗收**: 連鎖時同時有多個技能、飄字、橫幅; 怒氣條自帶黑底描邊, 刻度線比條高出上下 4 像素, 任何特效疊上去刻度仍讀得到。
- **P13 事件要排隊**: 「連鎖 ×N」一次只一塊, 2.2 秒自淡; 位置在台座圈內的空地, 與台座頭上的「×序號」分在不同帶(見尺寸表)。
- **P15 回饋強度跟份量成正比**: 連鎖橫幅分三級(×2 琥珀 52px 無射線 / ×3 橘 62px 10 射線 / ×4 以上 洋紅 72px 16 射線); 台座上的單次表演只是物種色圈。
- **P17 進度圖形與數字分工**: 怒氣條沒有數字, 圖形本身就是讀數; 兩條刻度讓圖形回答「離能點名 / 離連鎖 / 離失控還差多少」; 血條同理只標收服刻度。
- **P18 重要資訊不能只存在一瞬間**: 收服結果留在 HUD 陣容 6 格(地下城、商店); 名聲 / 金幣常駐 HUD; 最長連鎖留到結算。
- **P19 資訊貼著物件**: 怒氣條、×序號、點燃 / 澆熄 / 吃點心回饋都長在魔物本身與它的怒氣條外框上; 捕捉記號在魔物頭頂。
- **P21 示意圖選分岔的例子**: 說明第 1 頁並排「打到時按 ✓」與「按太早 ✗」(盾已冷卻、心少一顆), 兩格只差按的時機; 第 4 頁三欄同一隻魔物只差怒氣。

## 5. 物件表

| 物件 | 函式 | state 欄位 | 各狀態視覺 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | — | 全畫面 bg 色 |
| Tile | `drawTile` | x, y, kind, zone, nest | wall: 深色方塊 + 頂面; pillar: 所在區地板 + 圓柱頂; floor: 區色地板 + 區紋理(崖碎石點 / 遺跡磚縫 / 水池淡弧 / 熔岩洞裂紋 / 走道無); water: 藍底流動波紋; lava: 亮橘 + 黑痂塊 + 脈動亮斑 + 亮邊; nest=true: 地板上一圈枝條巢 |
| Tamer | `drawTamer` | x, y, dir, guarding, shieldReady, blink | 奶油色圓身(r18 = 判定) + 帽, dir 決定臉朝向與盾的位置; **guarding**: 全身白色護罩圈 r28 + 前方大白盾(任何方向都能彈); 非 guarding 且 **shieldReady**: 背後藍盾; 冷卻中: 背後暗灰盾; **blink**: 全身半透明快速閃爍 |
| WildMonster | `drawWildMonster` | x, y, species, hp, maxHp, hit, weak, casting, dir | 物種剪影; 頭上血條(白填色, 30% 處綠刻度); **hit**: 本體白閃 + 左右抖; **weak**: 血條變綠 + 頭頂綠色套索記號(脈動); **casting**: 物種色外光 + 腳下物種色橢圓圈閃 + 怒眼 |
| Hazard | `drawHazard` | x, y, kind, phase, radius, t, angle, tx, ty | **firering** 中心 x,y: warn 紅虛線圓 + 由中心長大的半透明填色(0.5 秒長滿); active 漸層火圓盤 + 邊緣圓丘火舌。**thunder** 中心 = (tx,ty) 有給就用, 否則 (x,y): warn 黃綠虛線圓 + 十字準星 + 長大填色(0.8 秒長滿), 表演場另畫施放者→目標虛線; active 從上方劈下的閃電 + 亮圓, 0.4 秒內淡到 20%。**quake** 中心 x,y: active 以 radius 為中線、寬 30 的紫環 + 碎石(radius=0 不畫); warn 小紫虛線圈。**waterball** x,y 為彈心: 半徑 12 藍球 + 朝 angle 反向的尾跡 |
| ParryFlash | `drawParryFlash` | x, y, tx, ty, result, t | **counter**: 白色鋸齒光束馴獸師→施放者 + 馴獸師處白爆星 + 命中處白圈擴散; **capture**: 綠色波浪繩 + 目標處綠套圈由 34 收到 20 + 馴獸師處綠圈; 0.5 秒線性淡出 |
| ShowArena | `drawShowArena` | stage | 畫 y 120~1280: 上下看台(130~250、1020~1140)、圓形舞台(圓心 360,635 半徑 320)、台座軌道淡虛線。**prep**: 舞台暗、中央淡字「排位中」; **show**: 舞台打光(放射漸層)、邊框亮 |
| Pedestal | `drawPedestal` | x, y, index, occupied, selected, heldFrom | 半徑 50 圓盤; **occupied**: 亮盤; **空**: 暗盤 + 虛線小圓 + 「空」; 左下角小字編號(index+1); **heldFrom**: 半徑 56 白虛線圈; **selected**: 四角白色粗角框(±56) + 外光 |
| ShowMonster | `drawShowMonster` | x, y, species, rage, mode, performing, fx, chainStep, dir | 本體中心在 (x, y−4), 下方怒氣條(y+36, 寬 84)。怒氣條: <40 灰 / 40~79 琥珀 / 80~99 紅且閃; 40 處白刻度、80 處紅刻度。**mode**: stand 一般; held 白描邊 + 白外光 + 腳下小影(RD 給浮在選擇框上方的座標); charge 紅鋸齒圈 + 前傾 + 怒眼; loose 紅鋸齒圈(旋轉) + 怒眼。rage ≥80 時 stand 也換怒眼。**performing**: 本體放大 1.06 + 物種色圈 + 白內圈; chainStep ≥1 時頭頂「×(chainStep+1)」。**fx**: ignited 兩側琥珀火焰 + 怒氣條琥珀外框; doused 頭頂三顆藍水滴 + 藍外框; fed 嘴邊點心 + 碎屑 + 點心色外框; none 無 |
| Visitor | `drawVisitor` | x, y, seat, mode | 座位永遠畫; **watch**: 依 seat 換衣服色、笑臉; **scared**: 傾斜、變灰白、雙手舉高、O 嘴、汗滴; **empty**: 只剩座位 + 淡虛線人形 |
| ChainBanner | `drawChainBanner` | count, t | 畫在舞台中心 (360,635); count<2 不畫; 0~0.3 秒彈出, 1.6 秒起淡出, 2.2 秒消失; 三級見理念 P15 |
| TitleCard | `drawTitleCard` | day, stage | 全畫面暗幕; 「第 N 天」+ 大字「地下城 / 表演場」+ 遊戲物件小景 + 一句目標 + **「[空白] 開始」(美術已畫, RD 不要再畫)** |
| ShopItem | `drawShopItem` | x, y, item, level, cost, affordable, selected | 600×140 卡; 左圖示(重盾=盾、繩袋=繩、護甲=心、點心包=點心, 與 HUD 同圖示)、名稱、效果、已買次數(level>0 才顯示)、右側金幣 + 價格; **affordable=false**: 整卡 55% 透明 + 價格變紅; **selected**: 白粗框 + 外光 + 底色變亮 |
| Button | `drawButton` | x, y, w, h, label, selected | x,y 左上角; **selected**: 綠底 + 白粗框 + 外光 + 白字; 未選中: 暗底灰字 |
| FloatText | `drawFloatText` | x, y, text, kind, t | 1 秒內上浮 40, 0.5 秒起淡出; gold 金幣圖示 + 金字; repUp 粉星 + 粉字; repDown 紅星 + 紅字; snack 點心圖示 + 點心色字; hint 深底膠囊 + 白字(「還不夠氣」) |
| ResultPanel | `drawResultPanel` | rep, goldEarned, roster, bestChain, stars | 全畫面暗幕; 三顆大星(stars 顆亮金); 名聲 / 累計金幣 / 最長連鎖三列; 6 格陣容; **「[空白] 重來」(美術已畫, RD 不要再畫)** |
| HUD | `drawHud` | phase, day, gold, rep, hearts, maxHearts, ropes, ropeMax, snacks, roster, timeLeft, message | 見下方 HUD 版面 |
| 說明頁示意圖 | `drawGuidePage` | page, x, y, w, h | 只畫在框內(會 clip), 600×600 虛擬畫布等比縮放置中; 不畫頁標題、說明文字、頁碼、翻頁提示 |

### HUD 版面(phase 為 guide / title / result 時不畫任何東西)

- 第一列 y≈28: 左「第 N 天 + 階段名」; 中 timeLeft 大字(只在 dungeon / show, ≤10 秒變紅); 右 金幣、名聲
- 第二列 y≈72: dungeon / shop = 心(maxHearts 格, hearts 顆亮)、捕獸繩(ropeMax 條, ropes 條亮; 商店全亮表上限)、點心 ×N、右側 6 格陣容; prep / show = 點心 ×N
- 第三列 y 92~118: message 非空時畫琥珀膠囊(例「選牠的台座按 ↓ 餵點心叫回」)
- **底部操作提示由 HUD 畫, RD 不要另畫**: prep y≈1264「←→ 選擇 空白 拿起 / 放下」; show y≈1210「←→ 選台座 空白 表演 ↓ 餵點心」; shop y≈1260「↑↓ 選擇 空白 確定」

### 說明頁每頁示意

1. 彈反: 左格 水母射出的水彈碰到舉盾的馴獸師 → 白光反打、水母血條掉、受擊白閃(✓「打到時按」); 右格 盾已冷卻(灰盾)、水彈打中、閃爍、心 4/5 碎一顆(✗「按太早」); 左下角方向鍵鍵帽「走」
2. 收服: 殘血火蜥蜴(綠套索記號、綠血條)放出火圈, 馴獸師在圈內舉盾, 綠繩套走(✓「收服!」, 「殘血」短標籤指著記號)
3. 點名表演: 一圈 6 台座, 選擇框在最上那座, 牠正在表演、放出小火圈、金幣飛出 +7; 鍵帽「←→ 選」「空白 表演」
4. 拿捏: 三欄同一隻火蜥蜴 — 怒氣 45 表演 1 枚金幣「少賺」/ 怒氣 95 表演 7 枚金幣「多賺」/ 怒氣滿、跳下台座衝向嚇到的觀眾「失控」✗
5. 點心: 選中的雷鳥吃點心, 怒氣條 92→52 掉的那一截以白虛線段標出; 點心沿虛線飛向嘴、旁邊「↓」鍵帽; 下方流程「地下城 → 排位 → 表演 → 商店」「×3 天 → ★★★」

## 6. 尺寸表

| 物件 | 尺寸 / 判定 | 備註 |
|---|---|---|
| Tile | 60×60 | 牆 / 石柱的畫面 = 判定格 |
| Tamer | 64×64 框; 身體圓 r18 = 判定 | 彈反護罩 r28; 背盾到 ±27 |
| WildMonster | 90×90 框 | 本體基準半徑 26(中心下移 6); 血條 y−24、寬 56; 套索記號中心 y−35 r8 |
| Hazard 火圈 | 半徑 = radius(地下城 120) | 判定半徑上畫實線邊 |
| Hazard 落雷 | 半徑 = radius(地下城 70) | 閃電往上延伸 3×radius |
| Hazard 震波 | 中線半徑 = radius, 環寬 30 | |
| Hazard 水彈 | 半徑 12 = 判定 | 尾跡往後 30 |
| ParryFlash | 起點 (x,y) 到 (tx,ty) | 不限框 |
| Pedestal | 120×120 框; 圓盤 r50 | 選擇角框 ±56; heldFrom 圈 r56 |
| ShowMonster | 100×100 框 | 本體半徑 28 中心 y−4; 怒氣條中心 y+36、84×10, 刻度到 ±9; 「×N」中心 y−40; 失控鋸齒圈 r38~46; 表演圈 r44 |
| Visitor | 60×90 框 | 座位 y+18~+40 |
| ChainBanner | 280×96 牌(×4 以上射線到 ±150 × ±92) | 舞台中心 (360,635), 在台座圈內空地 |
| ShopItem | 600×140(實畫 592×132) | |
| Button | w×h(實畫內縮 3) | |
| FloatText | 字 26px / 提示 22px 膠囊高 36 | |
| HUD | 720×120 + 底部提示列 | |

### 帶狀分配(同一刻會一起出現的東西)

- 魔物頭頂帶: 地下城 = 血條 + 套索記號; 表演場 = 「×N」(只在表演中)與 doused 水滴(兩者同時出現時水滴在 ×N 兩側)
- 魔物下方帶: 怒氣條(表演場)、影子(地下城)
- 「連鎖 ×N」大橫幅在舞台中心, 與台座上的 ×序號 不同帶

## 7. 繪製層級(下 → 上)

地下城: drawBackground → drawTile → Hazard(warn) → drawWildMonster → drawTamer → Hazard(active) → drawParryFlash → drawFloatText → drawHud → drawTitleCard
表演 / 排位: drawBackground → drawShowArena → drawVisitor → drawPedestal → Hazard → drawShowMonster(held 最後畫) → drawFloatText → drawChainBanner → drawButton → drawHud → drawTitleCard
商店: drawBackground → drawShopItem → drawButton → drawHud;  結算: drawBackground → drawResultPanel

## 8. 給 RD / 製作人的注意事項(時長假設)

- **預警總長寫死在美術裡**: 介面只給 `t`(經過秒數)、沒給預警總長, 填色長滿的時刻照規格寫死: 火圈 0.5 秒、落雷 0.8 秒(震波 / 水彈沒有預警)。表演場若預警時長不同, 填色會提早或晚滿 → **請製作人在 Hazard state 加 `warnDur`**, 加了之後美術改讀它
- 落雷 active 的閃電在 0.4 秒內淡到 20%(之後 RD 自行移除)
- ParryFlash 0.5 秒淡完; FloatText 1 秒淡完; ChainBanner 2.2 秒淡完(RD 可在這之後移除)
- 失控鋸齒圈、80 以上怒氣條閃爍、熔岩脈動、水波紋、套索記號脈動、馴獸師閃爍用 `performance.now()` 自轉, RD 不用傳時間
- ShowMonster `mode: stand` 時請傳台座中心當 x,y; held 時傳選擇框上方的座標
- 表演場 Hazard: 火圈 / 震波以 x,y(施放者台座)為中心; 落雷劈在 tx,ty; 水彈 x,y 為飛行中位置
- 說明頁文字由 RD 畫; 示意圖裡只有短標籤(「打到時按」「按太早」「走」「殘血」「收服!」「選」「表演」「少賺」「多賺」「失控」、流程四格名)
