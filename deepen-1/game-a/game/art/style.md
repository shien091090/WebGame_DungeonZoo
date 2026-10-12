# 紅線連擊秀 — 美術規格(RD 只讀這份)

> index.html 必須宣告 `<meta charset="utf-8">`, 否則 art.js 裡的中文會變亂碼。
> art.js 以 `<script src="art/art.js">` 載入(非 module), 掛在 `window.Art`。
> 所有 x, y 都是**物件中心點的畫面座標**(地下城已扣掉鏡頭), 只有 `drawButton` 的 x, y 是左上角。

## 1. 邏輯畫布尺寸

720 × 1280(直式)。HUD 佔 y 0~120。

## 2. 色票表(`Art.palette`)

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg | #121018 | 全畫面底 |
| outline | #1a1420 | 所有物件與字的深色描邊 |
| text / textDim | #f4efe6 / #9a93a8 | 主文字 / 次要文字 |
| panel / panelHi | #1e1a28 / #2c2638 | 面板底 / 選中面板底 |
| fire (+Dark/Hi) | #e04420 | 火蜥蜴、火圈(色相 11°, 灰階 111) |
| thunder (+Dark/Hi) | #c0f040 | 雷鳥、落雷(色相 76°, 灰階 206; 刻意偏黃綠, 離火色相 65°) |
| water (+Dark/Hi) | #60b0ff | 水母、水彈(色相 210°, 灰階 161) |
| stone (+Dark/Hi) | #6a30a0 | 石像鬼、震波(色相 271°, 灰階 78) |
| tamerCoat / tamerHat | #f2ecdc / #8a5530 | 馴獸師(全場唯一近白的可動物件) |
| redline | #ff2a55 | 紅線區、連擊、馴熟度(全遊戲「紅線」只用這色) |
| danger | #ff3a3a | 失控、扣名聲、打叉、時間快到 |
| lassoRing / lasso | #ffd23a / #e0b060 | 套索進度環、殘血可套虛線環 / 繩子 |
| gold | #ffd23a | 金幣、商店價格、選擇框 |
| rep | #8fe8ff | 名聲(星形) |
| whip | #fff0b0 | 揮鞭範圍(直線外緣) |
| whistle | #7ff5c8 | 哨音範圍(波浪外緣)、安撫、制伏進度點 |
| parry | #fffbe0 | 舉盾、彈反閃光 |
| heart | #ff5a6e | 心 |
| rageLow / rageMid | #7a86a8 / #ffb02e | 怒氣 < 50 / 50~紅線下限 |
| wall / wallTop / pillar | #18161f / #2f2c3a / #6b6878 | 牆、石柱 |
| lavaTile / lavaGlow | #c83a10 / #ff8a20 | 熔岩格 |
| waterTile / waterWave | #1c4a7a / #4a88c0 | 水格 |
| floorCrag / Ruins / Lava / Pond / Hall | #384050 / #4a4036 / #3a2a2a / #2a4038 / #2c2a33 | 各區地板 |
| arena / stands / seat | #4a3c30 / #241e2c / #3a3046 | 表演場地 / 觀眾席 / 座位 |
| fence / fenceDark | #b88a50 / #6a4a28 | 圍欄 |

## 3. 形狀語言

可動物件(馴獸師、魔物、觀眾)= 粗深色描邊 + 平塗 + 地面影子; 地形 = 平塗、無描邊、無影子; 危險範圍 = 物種色 + 鋸齒外緣; 預警 = 虛線圈 + 由中心長大的填色(填滿 = 生效)。

## 4. 理念落實

- P0 辨識度先於好看: 四種魔物色相兩兩 ≥ 60°、灰階分四階, 而且剪影各不同(長身捲尾 / 圓頂觸手 / 三角翼 / 方塊帶角); 地形不描邊、不落影, 和可動物件分開。
- P1 視覺權重跟著決策迫切度: 地板壓在低明度; 最亮的是馴獸師(近白)、危險範圍(鋸齒亮邊)與怒氣條紅線段; 時間只在剩 10 秒以下才變紅。
- P2 規則存在畫面就存在: 血條上有 30% 白刻度(可套的門檻); 怒氣條標出表演門檻 50、紅線段 redLow~99 與失控格 100; 套索的時限與繩長(繃緊變紅變直)都畫出來; 判定圓半徑 18 = 馴獸師身體圓。
- P3 一個意義一種長相: 金色虛線環(殘血可套)與金色進度環(繞圈)同色 = 套索; 紅線色只用在紅線區、連擊、馴熟度; 鞭 = 直線外緣暖白, 哨 = 波浪外緣薄荷綠; 說明頁全部呼叫遊戲內畫法。
- P4 關鍵區分走兩條通道: 怒氣升(橘色往上雙箭頭)與降(藍 / 薄荷往下雙箭頭)顏色、方向都不同; 紅線區外光多一圈白細線(紅線色與火蜥蜴色相太近); 失控 = 紅色 + 旋轉鋸齒圈, 表演中 = 物種亮色 + 靜止星芒。
- P7 每個元素都要掙得版面: 時間只給數字和時鐘圖示, 不另畫總長條; 馴熟度只在 HUD 陣容與結算畫小點, 場上靠紅線段變寬表達。
- P9 以最混亂的一刻驗收: 所有字都有深色描邊; 危險範圍外緣有深色襯線, 疊在任何地板與魔物上都讀得到。
- P13 事件要排隊: 連擊中斷的大字由飄字負責(畫面中央), 連擊顯示面板只畫數字裂開與紅框, 不重複寫「連擊中斷」。
- P15 回饋強度和事件份量成正比: 飄字字級 金幣 22 < 彈反 26 < 連擊 / 紅線金幣 28 < 馴熟 30 < 收服 38 < 連擊中斷 60; 倍率字隨倍率變大、到 5 變白並標「最高」。
- P17 進度類圖形與數字分工: 連擊顯示的數字給連擊數, 條只畫「離斷線還剩多少」(連擊計時); 套索進度環給圈數, 外圈細弧給時限。
- P18 重要資訊不能只存在一瞬間: 收服、馴熟 +1 的飄字一閃就過, 陣容與馴熟度常駐在 HUD(地下城)與結算畫面。
- P19 資訊貼著物件: 怒氣條、制伏進度、撞欄進度都長在魔物身上; 紅線狀態用貼著魔物的外光; 說明頁鍵帽貼在做動作的馴獸師旁。
- P21 示意圖選分岔例子: 第 2 頁馴獸師停在起點對面(半圈 = 環填一半), 避免讀成「站著不動等環滿」; 第 4 頁上排怒氣條停在紅線段內(沒滿), 下排條滿了就撞欄, 兩者並排。

## 5. 物件表

| 物件 | 函式 | state 欄位 | 各狀態視覺 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | — | 全畫面 #121018 |
| Tile | `drawTile(ctx, s)` | x, y, kind(wall/pillar/floor/lava/water), zone(crag/ruins/lava/pond/hall), nest | 牆: 深磚 + 頂面; 石柱: 地板上一根灰色圓柱; 熔岩: 亮橘紅 + 亮斑; 水: 深藍 + 白波紋; 地板依區換底色與紋(崖 = 裂紋、遺跡 = 方磚、熔岩洞 = 暗玄武、水池 = 苔、走道 = 素面); nest = 地板上一圈虛線草窩 + 兩顆該區魔物色的蛋 |
| Tamer | `drawTamer(ctx, s)` | x, y, facing(0~7), rolling, parryLeft, parryDur, stunLeft, stunDur, blink, lassoing | 常態: 近白圓身(半徑 18 = 判定)+ 俯視帽 + 面向鼻尖與鞭柄; rolling: 縮成球 + 身後三道速度弧; parryLeft > 0: 面向前方一道亮白盾弧(剩越多越亮); stunLeft > 0: 身體變灰 + 頭上三顆轉圈星 + 身外灰色剩餘環; blink: 每 90ms 半透明閃; lassoing: 手上一圈繩結 |
| WildMonster | `drawWildMonster(ctx, s)` | x, y, species, hp, maxHp, hit, weak, lassoed, casting, dir(-1/1) | 頭上血條(30% 處白刻度); hit: 全身白閃; weak: 血條變金 + 漩渦眼 + 汗滴 + 旋轉金色虛線環(= 可套); lassoed: 身上纏繩 + 左右掙扎抖動; casting: 物種色脈動外光 + 右上「!」 |
| Lasso | `drawLasso(ctx, s)` | x1, y1, x2, y2, progress, t, limit, len, maxLen | 繩從馴獸師到魔物: len/maxLen < 0.6 下垂、0.6~0.8 變橘、> 0.8 拉直變紅加粗並抖; 魔物外圈半徑 52 粗金環 = 繞圈進度; 半徑 62 細白弧 = 剩餘時限, 剩 30% 以下變紅閃 |
| Hazard | `drawHazard(ctx, s)` | x, y, kind, phase, radius, t, dur, angle | firering / thunder 預警: 物種色虛線圈 + 由中心長大的填色(t/dur 填滿 = 生效), 落雷中心加十字; 生效: 物種色填滿 + 鋸齒亮邊, 火圈有小火苗, 落雷有閃電且隨時間淡出; waterball: 半徑 12 藍球 + 朝 angle 反方向的拖尾; quake: 紫色環帶, **環帶 = 半徑 radius ± 15**(內緣 radius−15、外緣 radius+15), 帶上有碎石 |
| WhipCrack | `drawWhipCrack(ctx, s)` | x, y, shape(arc/circle), facing, radius, t, dur | arc: 朝面向 ±60° 扇形淡填 + 暖白外緣 + 鞭身掃過; circle: 整圈淡填 + 暖白外緣 + 鞭梢繞一圈; t ≥ dur 不畫 |
| WhistleWave | `drawWhistleWave(ctx, s)` | x, y, radius, t, dur | 薄荷綠淡填 + 波浪外緣 + 往外擴的音波圈; t ≥ dur 不畫 |
| ParryFlash | `drawParryFlash(ctx, s)` | x, y, t, dur | 白色八角星芒 + 金邊 + 外擴白環; t ≥ dur 不畫 |
| ShowArena | `drawShowArena(ctx)` | — | 上下觀眾席(130~250、1020~1140)深色 + 座位條; 場地 60~660 × 270~1000 沙地 + 中線中圈 |
| ShowMonster | `drawShowMonster(ctx, s)` | x, y, species, mastery, rage, redLow, mode, performing, fx, fxT, fxDur, subdue, chargeT, chargeDur, dir | roam: 頭上怒氣條; rage 在 redLow~99: 身上紅線外光(紅圈 + 白細內線); rage ≥ 95 眼睛變怒; performing: 身後物種亮色星芒; fx ignited: 兩側橘色往上雙箭頭 / doused: 藍色往下雙箭頭 / calmed: 頭頂薄荷音波弧 + 往下雙箭頭, 依 fxT/fxDur 淡出; charge / loose: 怒氣條換成「制伏進度」(3 個點 + 「n/3」)+ 紅色旋轉鋸齒圈 + 怒眼; charge 衝刺中(chargeT = 0): 身後速度線; 撞欄中(chargeT > 0): 抖動 + 白弧沿外圈填滿(chargeT/chargeDur = 圍欄快破) |
| Fence | `drawFence(ctx, s)` | x, y, side, broken | 完好: 兩條木欄 + 三根柱; broken: 中段斷裂、斷木 + 紅色破口底 |
| Visitor | `drawVisitor(ctx, s)` | x, y, seat(0~11), mode | 都畫座位; watch: 坐著的人(衣色依 seat 輪替, 低彩); scared: 灰白、傾斜、雙手舉高 + 頭上紅叉; empty: 只剩空座位 |
| ComboMeter | `drawComboMeter(ctx, s)` | x, y, combo, mult, left, window, broken, brokenT, brokenDur | 左「連擊」+ 大數字, 右「紅線倍率 ×N」, 下方紅色連擊計時條(left/window, 剩 25% 閃白); combo 0: 全灰; 倍率越高字越大越亮, 5 時變白 + 「最高」; broken 且 brokenT < brokenDur: 紅底紅框、左右抖、數字被紅裂痕劃過 |
| TitleCard | `drawTitleCard(ctx, s)` | day, stage(dungeon/show) | 全畫面: 「第 N 天」+ 地下城門 / 表演帳篷圖示 + 階段名 + 一行副標 + **Z 鍵帽「開始」**(美術已畫, RD 不要再畫按鍵提示) |
| ShopItem | `drawShopItem(ctx, s)` | x, y, item, level, cost, affordable, selected | 左圖示 + 名稱 + 效果 + 「已買 N」(level > 0)+ 右價格; 買不起: 圖示文字半透明、價格變紅; selected: 金色粗框 + 左側金色三角 + 底色變亮; 選中且買不起再加「金幣不足」 |
| Button | `drawButton(ctx, s)` | x, y(左上), w, h, label, selected | selected: 金底白粗框深字; 未選: 深底灰字 |
| FloatText | `drawFloatText(ctx, s)` | x, y, text, kind, t, dur | 往上飄 40px(comboBreak 只飄 10px 並左右抖), 最後 40% 淡出, 開頭 0.15 放大彈入; 字級與顏色見 P15; redGold 帶紅底小框; comboBreak 帶深紅底紅框; t ≥ dur 不畫 |
| ResultPanel | `drawResultPanel(ctx, s)` | rep, goldEarned, bestCombo, roster[{species, mastery}], stars(0~3) | 全畫面: 「結算」+ 三顆星(亮 stars 顆)+ 名聲 / 累計金幣 / 最高連擊三列 + 陣容卡(物種圖 + 名字 + 馴熟度 3 點)+ **Z 鍵帽「重來」**(美術已畫, RD 不要再畫) |
| Hud | `drawHud(ctx, s)` | phase, day, gold, rep, hearts, maxHearts, ropes, ropeMax, roster, timeLeft, timeMax, message, rollCd, rollCdMax, parryCd, parryCdMax, whistleCd, whistleCdMax | phase 為 guide / title / result 時不畫。第 1 列: 「第N天」+ 階段名 / 時鐘 + 剩餘秒數(≤ 10 變紅; 商店不畫)/ 金幣 / 名聲。第 2 列 dungeon: 心、捕獸繩、陣容(物種小圖 + 馴熟點)、X 翻滾與 C 彈反冷卻鍵帽; message 以紅框膠囊畫在**畫面底部 y 1236**。show: message 紅框膠囊在第 2 列左半; X 吹哨、C 彈反冷卻鍵帽。shop: **畫面底部 y 1250 的「↑↓ 選擇 Z 確定」**(美術已畫, RD 不要再畫) |
| 說明頁示意圖 | `drawGuidePage(ctx, s)` | page(0~3), x, y, w, h | 只畫在 (x, y, w, h) 框內(自己剪裁), 內部以 600×700 參考座標等比縮放置中。頁標題、說明文字、頁碼、翻頁提示由 RD 畫 |

冷卻鍵帽: 恢復中的部分深色從上往下蓋, 剩餘越少蓋越少; 可用時整顆亮。

### 說明頁內容

| 頁 | 示意 |
|---|---|
| 0 地下城 | 上: 馴獸師朝右揮鞭打中火蜥蜴(白閃), Z 鍵帽貼在鞭旁、方向鍵貼在馴獸師左邊; 中: 火圈生效中, 馴獸師殘影 → 翻滾中 → 殘影穿過去, X 鍵帽; 下: 馴獸師舉盾 + 彈反閃光, 兩發水彈, 虛線「反擊」箭頭打回水母(白閃), C 鍵帽 |
| 1 收服 | 殘血石像鬼被套住, 進度環一半; 虛線圓路線 + 順時針箭頭; 馴獸師在「起點」對面(繞了半圈), 標「你」; Z 鍵帽在起點、方向鍵在馴獸師下方; 右下角小圖: 環填滿 + 打勾 |
| 2 表演 | 左: 整圈鞭範圍, 火蜥蜴怒氣條在 70、橘色往上箭頭、正在表演(火圈 + 「+5」金幣); 右: 哨音範圍, 雷鳥怒氣條在 55、往下箭頭; 下方方向鍵 |
| 3 紅線 | 上: 兩隻魔物怒氣條都在紅線段(沒滿), 一隻表演中飄「連擊 4」, 下方連擊顯示「3 ×2.4 → 4 ×2.6」; 下: 雷鳥怒氣滿、撞欄(圍欄破), 觀眾嚇跑打叉, 連擊顯示中斷; 最底: 「地下城 → 表演場 → 商店 ×3 天 → ★★★」短標籤流程 |

**偏離 guide 字面**: 第 1 頁 guide 要求「畫面下方四個鍵帽 方向鍵 / Z / X / C 各對應 走 / 揮鞭 / 翻滾 / 彈反」。依分工, 按鍵說明歸 RD, 我把鍵帽貼在做那個動作的馴獸師旁, 不排成一列、也不配動作名稱, 免得和 RD 畫的頁面文字重複。第 4 頁的流程是短標籤 + 箭頭 + 星, 不是一句話; 若 RD 頁面文字也寫了流程, 請製作人決定留哪一份。

## 6. 尺寸表

| 物件 | 尺寸 | 說明 |
|---|---|---|
| Tile | 60 × 60 | 石柱圓半徑 26 |
| Tamer | 64 × 64 | 身體半徑 18 = 判定半徑; 盾弧半徑 27 |
| WildMonster | 90 × 90 | 本體約半徑 30(中心下移 4); 血條寬 60 在 y−43; 殘血環半徑 38 |
| Lasso | 不限 | 進度環半徑 52、時限弧半徑 62(以魔物中心 +4 為圓心) |
| Hazard | 依 radius | 火圈 120、落雷 70 畫面外緣 = radius; 水彈半徑 12; 震波環帶 radius ± 15 |
| WhipCrack | 依 radius | 扇形 120°(面向 ±60°) |
| WhistleWave | 依 radius | 波浪外緣在 radius−8~radius 之間 |
| ParryFlash | 120 × 120 | 星芒最大半徑 56 |
| ShowMonster | 100 × 100 | 怒氣條 88 × 12 在 y−48~−36; 本體約半徑 28(中心下移 10); 紅線外光 / 失控鋸齒圈半徑 ≤ 39 |
| Fence | 100 × 16 | |
| Visitor | 60 × 90 | 座位在 y+22~+44 |
| ComboMeter | 600 × 120 | 面板 588 × 116, 抖動最多 ±4 |
| ShopItem | 600 × 140 | 面板 592 × 132 |
| Button | w × h | 由 RD 給 |
| HUD | 720 × 120 | 地下城 message 例外畫在 y 1218~1254 |

假 ctx 外接框檢查: 所有帶 size 的函式在全部狀態組合下都沒超框。

## 7. 時長常數

| 效果 | 總長 | 來源 |
|---|---|---|
| WhipCrack / WhistleWave / ParryFlash | 用 state.dur(介面 0.25) | 介面 |
| FloatText | 用 state.dur(1, comboBreak 1.2) | 介面 |
| ComboMeter 中斷特效 | brokenDur(1.2) | 介面 |
| 馴獸師 blink 閃爍週期 | 90ms | 美術自訂 |
| 套索時限變紅 | 剩 30% 以下 | 美術自訂 |

一次性特效在 t ≥ dur 時自己不畫, RD 可以在那之後停止呼叫。

## 8. 繪製層級(下 → 上)

地下城: Background → Tile → Hazard(預警與生效)→ WildMonster → Lasso → Tamer → WhipCrack → ParryFlash → FloatText → Hud
表演場: Background → ShowArena → Fence → Visitor → Hazard → WhistleWave / WhipCrack → ShowMonster → Tamer → ParryFlash → ComboMeter → FloatText → Hud
其他: TitleCard / ShopItem + Button + Hud / ResultPanel 各自蓋在 Background 上

## 9. 畫面文字歸屬

| 文字 | 誰畫 |
|---|---|
| 標題卡「按 Z 開始」 | 美術(drawTitleCard) |
| 結算「按 Z 重來」 | 美術(drawResultPanel) |
| 商店「↑↓ 選擇 Z 確定」 | 美術(drawHud, phase = shop) |
| HUD 訊息(例「追上去吹哨 3 次」) | 美術畫外框與字, RD 只傳 message |
| 說明頁標題、說明文字、頁碼、「按 Z 繼續」 | RD |
