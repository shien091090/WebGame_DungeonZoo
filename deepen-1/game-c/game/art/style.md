# 習性大招秀 — 美術規格(deepen-1 / game-c)

> index.html 必須宣告 `<meta charset="utf-8">`, 否則 art.js 裡的中文會亂碼。
> 載入方式: `<script src="art/art.js"></script>`(一般 script, 非 module), 之後用全域 `window.Art`。

## 邏輯畫布尺寸

720 × 1280(直式)。HUD 佔 y 0~120; 地下城地圖視窗 y 120~1280; 表演場版位照 spec 數值表。

## 色票表

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg | #120e18 | 全畫面底 |
| hudBg / hudLine | #1c1626 / #3a3048 | HUD 底、分隔線、卡片框 |
| text / textDim | #f4eee2 / #a89cb8 | 主文字 / 次要文字 |
| outline | #1b1424 | 所有物件與文字的深色描邊 |
| fire | #e8452c | 火蜥蜴、火圈(色相 8°, 灰階 115) |
| thunder | #a6e83a | 雷鳥、落雷(色相 83°, 灰階 192) |
| water | #5aa8ff | 水母、水彈(色相 212°, 灰階 155) |
| stone | #6e2690 | 石像鬼、震波(色相 282°, 灰階 72) |
| tamer / hat | #f4ecd8 / #7a4a26 | 馴獸師(無彩奶白, 不和任何種類色相撞) |
| rope | #d9b26a | 套索、可套記號、捕獸繩、收服飄字 |
| gold | #ffd23a | 金幣、大招(金幣 ×2)外環、怒氣條 50 門檻刻度 |
| rage | #ff2d6f | 紅線區、失控、破損圍欄、扣名聲、HUD 警示訊息 |
| calm | #e8f6ff | 哨音波浪環、被安撫、制伏進度 |
| parry | #bff8ff | 盾、彈反閃光、彈反飄字 |
| whip | #fff6dc | 揮鞭扇形 / 整圈 |
| heart | #ff5a6e | 心 |
| rep | #c9b6ff | 名聲(星) |
| wall / wallTop | #2b2236 / #4a3d5c | 牆、石柱 |
| lava / lavaHot | #ff6a1a / #ffc43a | 熔岩格 |
| waterTile / waterHi | #1f5f9a / #5fb4ef | 水格 |
| floorCrag / Ruins / Lava / Pond / Hall | #3a3640 / #4a4034 / #3a2622 / #26343e / #2e2a34 | 各區地板(低對比) |
| sand / sandDark / stands / fence | #c9a978 / #b08f60 / #3a2a3e / #a8743e | 表演場沙地、觀眾席、圍欄 |

種類色驗算(node): 色相兩兩差 75° / 129° / 70° / 86° / 154° / 161°(全 ≥ 60°, 沒有一對落在相鄰色名); 灰階 192 > 155 > 115 > 72, 相鄰階差 37 / 40 / 43。
已知張力: rage(341°)與 fire(8°)只差 27°。規格把那一段叫「紅線」, 不能不用紅; 兩者靠類別分開 — rage 只出現在 UI 條、鋸齒外圈、破損缺口、文字上, 從不填在魔物本體上; fire 只出現在魔物本體與火圈。

## 形狀語言

深色描邊 + 扁平填色; 可動物件(馴獸師、魔物)有落影與圓潤輪廓, 地形平塗無影且低對比; 危險 = 預警「虛線框 + 由中心長大的填色, 填滿 = 生效」, 生效 = 實心填色 + 亮邊。

## 理念落實

- P0 辨識度先於好看: 四種魔物同時用「色相 + 明度 + 剪影」三條區分(長身捲尾 / 半圓傘觸手 / 張翼鋸齒冠 / 方塊雙角底座); 地形整體壓暗壓低對比。
- P1 視覺權重跟著決策迫切度: 最亮的是技能(預警與生效)與馴獸師; 地板最暗; HUD 數值字中等; 表演場怒氣條的紅線段與 50 刻度是條上最亮的兩處。
- P2 規則上存在就要畫出來: 馴獸師本體圓半徑 18 = 判定半徑; 技能畫面邊界 = 判定半徑(震波環的外緣 = radius); 殘血有可套記號; 冷掉倒數、入場、撞欄進度、制伏進度都有圖形; 巢穴畫出來並標種類色小蛋。
- P3 一本字典: 種類色 = 那一種魔物與牠的技能; 繩色 = 套索相關的一切; 金色 = 金幣與大招(×2); 怒紅 = 紅線 / 失控 / 損失; 白色波浪環 = 哨音 / 被安撫; 青白 = 盾 / 彈反。說明頁一律呼叫遊戲內畫法。
- P4 兩條通道: 揮鞭(直線鞭身 + 扇形)vs 哨音(波浪環)用形狀分; 被點燃(往上的箭頭 + 橙環)vs 被澆熄(往下的水滴 + 藍環)用方向 + 顏色分; 失控用鋸齒外圈(形狀)+ 怒紅(顏色); 大招用金色雙環(圈數)+ 金色。
- P7 掙版面: 魔物名稱不上畫面(剪影已讀得出); 野生魔物不顯示血量數字, 只有血條 + 30% 刻度; HUD 冷卻只放這個場景會用的兩顆鍵。
- P9 最混亂的一刻: 表演場 4 隻同時表演 + 技能互打時, 每隻的怒氣條有深色底板, 技能半透明, 所有文字帶描邊。
- P13 事件排隊: 飄字由 RD 排程; 美術端每個飄字固定上飄 40 像素並在後 40% 淡出, 讓連發的飄字錯開而不疊在同一點。
- P15 回饋強度和份量成正比: 一般金幣飄字 22px + 小幣; 大招金幣 32px + 進場放大 + 深紅描邊; 收服 30px 繩色。大招技能比一般多金色雙環、火焰數 12 → 18。
- P17 進度圖形與數字分工: 時間條給總進度、數字給秒數; 套索進度環沒有數字, 照畫總進度; 套索時限只畫圖形(外圈虛線弧), 剩 30% 轉紅給「快斷了」的預告。
- P18 重要資訊不只存在一瞬間: 收服的結果留在 HUD 的陣容小圖(各種類 ×N); 大招次數留到結算。
- P19 資訊貼著物件: 怒氣條、冷掉環、制伏進度都長在魔物身上; 盾畫在馴獸師面向側; 套索進度環圍在被套的魔物身上。
- P21 示意圖選分岔的例子: 第 2 頁並排「已套住正在繞」與「殘血但還沒套」(帶可套記號), 讓玩家看出殘血要再揮一鞭才會套上; 第 4 頁怒氣條同時連到「紅線段 → 大招賺更多」與「最右端 → 失控扣名聲」, 兩個結果長得不一樣。

## 物件表

座標一律畫面座標、物件中心(drawButton 例外, 左上角)。所有函式自帶 save/restore。

容錯: 任何 state 欄位缺漏、型別不對或不在列舉內都不會拋錯。`species` 不是 fire / water / thunder / stone 時一律當 fire 畫(畫面上會看到火蜥蜴, 若 RD 看到不該出現的火蜥蜴, 先查傳入的 species 值)。

| 物件 | 函式 | state 欄位 | 各狀態視覺 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | — | 全畫面填 bg |
| 地圖格 | `drawTile(ctx, s)` | x, y, kind(wall/pillar/floor/lava/water), zone(crag/ruins/lava/pond/hall), nest | wall: 磚牆 + 亮頂邊; pillar: 地板上一根帶頂蓋的石柱 + 落影; floor: 依 zone 換底色與紋(崖 = 裂紋、遺跡 = 方磚、熔岩洞 = 暗紅斑、水池 = 冷色紋、走道 = 中性); lava: 亮橘 + 上浮氣泡 + 暗紅裂線; water: 深藍 + 漂動水紋; nest = true: 樹枝圈 + 該區種類色的半透明蛋 |
| 馴獸師 | `drawTamer(ctx, s)` | x, y, facing(0~7), rolling, parryLeft, parryDur, stunLeft, stunDur, blink, lassoing | 奶白圓身(半徑 18)+ 帽 + 面向側的鞭柄尖; rolling: 壓扁旋轉 + 兩層拖尾; parryLeft > 0: 面向側青白弧形盾, 內層白弧長度 = 剩餘彈反時機; stunLeft > 0: 身體變灰、眼睛打叉、頭上 3 顆繞圈星 + 金色剩餘弧; blink: 每 1/12 秒交替半透明; lassoing: 腰間繩圈 |
| 野生魔物 | `drawWildMonster(ctx, s)` | x, y, species, hp, maxHp, hit, weak, lassoed, casting, dashing, dir | 種類剪影; 頭上血條(白, 30% 處有刻度); hit: 整隻閃白; weak: 血條變繩色 + 身上壓暗 + 面向側上方閃爍的虛線繩圈(= 可套); lassoed: 身上纏繩 + 左右抖動(可套記號收起); casting: 種類色外光脈動 + 背側紅底「!」; dashing: 兩層殘影 + 速度線; dir 決定面向 |
| 套索 | `drawLasso(ctx, s)` | x1, y1, x2, y2, progress, t, limit, len, maxLen | 繩色曲線, 越鬆越下垂; len/maxLen > 0.8 變直、加粗、紅白閃(快斷); 魔物周圍半徑 50 的粗進度環(繩色, 滿 = 白); 半徑 59 細虛線弧 = 剩餘時限, 剩 30% 轉怒紅 |
| 技能 | `drawHazard(ctx, s)` | x, y, kind(firering/waterball/thunder/quake), big, phase(warn/active), radius, t, dur, angle | warn: 種類色虛線圓 + 由中心長大的填色(t/dur 填滿 = 生效), 落雷加十字準星、震波加放射裂紋; active: 火圈 = 紅橘實心 + 邊緣火舌, 落雷 = 亮黃綠圓閃 + 白色閃電(隨 t/dur 淡出), 震波 = 紫色環帶(外緣 = radius, 內緣 = radius − 環寬 30 / 大招 40)+ 碎石, 水彈 = 藍球 + 反向拖尾; big: 內側加金色雙環(水彈加金邊), 火舌 12 → 18 |
| 揮鞭 | `drawWhipCrack(ctx, s)` | x, y, shape(arc/circle), facing, radius, t, dur | arc: 朝 facing 的 120° 白色扇形 + 掃過的鞭身與鞭梢星; circle: 整圈淡白 + 繞一圈的實線 + 虛線環; 隨 t/dur 淡出, t ≥ dur 不畫 |
| 哨音 | `drawWhistleWave(ctx, s)` | x, y, radius, t, dur | 兩圈白色波浪環往外擴到 radius + 極淡填色, 淡出 |
| 彈反閃光 | `drawParryFlash(ctx, s)` | x, y, t, dur | 外擴青白環 + 8 道白色放射, 淡出 |
| 表演場 | `drawShowArena(ctx)` | — | 上下觀眾席底(6 個座位底塊)、沙地場地(圓角, 中央入場圈)、後台排隊底板 + 左側直排「後台」小字 |
| 表演魔物 | `drawShowMonster(ctx, s)` | x, y, species, rage, mode, performing, big, fx, fxT, fxDur, dashing, coolT, coolDur, enterT, enterDur, subdue, chargeT, chargeDur, dir | 本體 + 腳下怒氣條(寬 84; 50 處金色門檻刻度、80~99 怒紅斜紋段; 填色 < 50 灰、50~79 白、80~99 粉紅、100 怒紅); performing: 本體放大 1.08 + 種類淺色放射短線; big: 金色雙環光暈; fx ignited: 橙環 + 往上的箭頭; doused: 藍環 + 往下的水滴; calmed: 白色波浪環(三者隨 fxT/fxDur 淡出); dashing: 殘影; coolT > 0(且 roam): 頭上藍色環逐漸填滿; mode enter: 從 0.3 倍長大 + 淡入 + 白色虛線圈; charge / loose: 怒紅鋸齒外圈 + 抖動, 頭上「n/3」制伏進度牌; charge 且 chargeT > 0: 抖動加劇 + 頭側怒紅撞欄進度弧 |
| 後台一格 | `drawBenchSlot(ctx, s)` | x, y, species, next, more | 深色卡 + 縮小的魔物; next: 卡變亮、白框加粗、上緣朝場地的小三角; 非 next 魔物半透明; more > 0: 只畫「+N」 |
| 圍欄 | `drawFence(ctx, s)` | x, y, side, broken | 完好: 木橫桿 + 3 根樁; 破損: 斷成兩截往外翹 + 中間怒紅缺口與鋸齒(side 目前兩側同畫法) |
| 觀眾 | `drawVisitor(ctx, s)` | x, y, seat, mode | 座椅 + 人; watch: 依 seat 換衣服色、輕微上下晃; scared: 灰衣、傾斜抖動、舉雙手、O 嘴 + 怒紅「!」; empty: 只有空座椅 |
| 標題卡 | `drawTitleCard(ctx, s)` | day, stage(dungeon/show) | 全畫面暗底 + 中央卡: 「第 N 天」、「地下城」(繩色框 + 四種魔物)/「表演場」(金框 + 金幣)、閃爍的「按 [Z] 開始」 |
| 商店項目 | `drawShopItem(ctx, s)` | x, y, item, level, cost, affordable, selected | 圖示圓 + 名稱(鞭力 / 繩袋 / 護甲 / 銀哨)+ Lv + 效果一行 + 金幣價格; affordable = false: 價格變灰 + 怒紅斜線; selected: 卡變亮、白粗框、左緣白三角 |
| 按鈕 | `drawButton(ctx, s)` | x, y(左上), w, h, label, selected | 未選: 深紫卡 + 白字; 選中: 金底 + 深字 + 白粗框 |
| 飄字 | `drawFloatText(ctx, s)` | x, y, text, kind, t, dur | 上飄 40px, 後 40% 淡出, t ≥ dur 不畫; gold: 金 22px + 小幣; bigGold: 金 32px + 小幣 + 深紅描邊 + 進場放大; repUp: 淡紫 + 星; repDown: 怒紅 + 星; capture: 繩色 30px; parry: 青白 26px; enter: 白; leave: 灰 |
| 結算 | `drawResultPanel(ctx, s)` | rep, goldEarned, bigCount, rosterCount, stars | 全畫面卡: 標題、3 顆星(stars 顆亮)、總名聲 / 累計金幣 / 大招次數、四種魔物 × 隻數、閃爍的「按 [Z] 重來」 |
| HUD | `drawHud(ctx, s)` | phase, day, gold, rep, hearts, maxHearts, ropes, ropeMax, rosterCount, timeLeft, timeMax, message, rollCd, rollCdMax, parryCd, parryCdMax, whistleCd, whistleCdMax | phase guide / title / result: 不畫; 其他: 左上「第 N 天 場景名」、其下陣容小圖(種類色點 ×N, 0 隻不畫)、右上金幣與名聲; dungeon / show: 中上時間條 + 秒數; dungeon: 心(y 82)、捕獸繩圈(y 104)、右側 X 翻滾 / C 彈反冷卻鍵; show: 右側 X 吹哨 / C 彈反冷卻鍵; message 非空: 中間怒紅框訊息牌; shop: 中間「強化」+ 畫面底部 y 1264 的「[↑↓] 選擇 [Z] 確定」 |
| 說明頁示意圖 | `drawGuidePage(ctx, s)` | page(0~3), x, y, w, h | 見「說明頁」一節; 只畫在框內(有 clip) |

### 畫面文字歸屬(美術已畫, RD 不要再畫)

- 標題卡: 「第 N 天」、場景名、「按 Z 開始」
- 結算: 全部文字與「按 Z 重來」
- 商店: 每個項目的名稱、等級、效果、價格; HUD 的「強化」標題與底部「↑↓ 選擇 Z 確定」
- 按鈕: label 由 RD 傳, 美術畫
- 表演魔物頭上的「n/3」; 後台的「+N」與「後台」小字
- HUD 的 message(RD 只傳字串, 例「追上去吹哨 3 次」)
- 說明頁: 美術只畫示意圖與圖內短標籤(「殘血」「收服!」「大招 ×2」「地下城 / 表演場 / 商店」「×3 天」)與鍵帽; **頁標題、說明文字、頁碼、「按 Z 繼續」由 RD 畫**, 而且要畫在 (x, y, w, h) 框外

## 尺寸表

| 物件 | 介面 size | 實際繪製範圍 |
|---|---|---|
| Tile | 60×60 | 剛好 60×60 |
| Tamer | 64×64 | 本體圓半徑 18(= 判定); 面向尖到 29、盾弧到 29.5、暈眩弧到 31.5 |
| WildMonster | 90×90 | 本體約 ±32; 血條 y −44~−37; 可套記號在 (±33, −32) 半徑 9; 殘影 / 速度線到 ±42 |
| Lasso | — | 進度環半徑 50(線寬 6)、時限弧半徑 59 |
| Hazard | — | 外緣 = radius(火圈 / 落雷 / 震波外緣); 水彈球半徑 = radius, 拖尾往後 2.4 倍 |
| WhipCrack / WhistleWave | — | 外緣 = radius |
| ParryFlash | 120×120 | 放射到半徑 58 |
| ShowMonster | 100×100 | 本體中心在 (0, −4), 約 ±30; 大招雙環半徑 31 / 36~39; 鋸齒外圈 31~40; 怒氣條 x −42~42、y 31~40; 頭上冷掉環 / 制伏牌 y −50~−31 |
| BenchSlot | 70×100 | 卡 66×96 |
| Fence | 100×16 | 橫桿 100×9, 樁高 16; 破損兩截內縮 |
| Visitor | 60×90 | 座椅 48×22(y +18~+40), 人在 y −36~+24 |
| ShopItem | 600×140 | 卡 596×136 |
| Button | w×h | 內縮 2px 的圓角卡 |

假 ctx(會追蹤變換矩陣)把所有 state 組合跑過一輪: 每個有 size 的函式外接框都在 size 內(線寬不計), save/restore 全部成對, 0 拋錯。

## 繪製層級(由下而上, 建議)

地下城: drawBackground → drawTile → drawHazard(warn)→ drawLasso → drawWildMonster → drawTamer → drawHazard(active)→ drawWhipCrack → drawParryFlash → drawFloatText → drawHud
表演場: drawBackground → drawShowArena → drawVisitor → drawFence → drawBenchSlot → drawHazard(warn)→ drawWhistleWave → drawShowMonster → drawTamer → drawHazard(active)→ drawWhipCrack → drawParryFlash → drawFloatText → drawHud

## 時長常數

| 效果 | 總長 | 來源 |
|---|---|---|
| WhipCrack / WhistleWave / ParryFlash | 用 state.dur(介面寫 0.25) | 介面; t ≥ dur 自己不畫 |
| FloatText | 用 state.dur(介面寫 1) | 介面; t ≥ dur 自己不畫 |
| Hazard 預警 / 生效 | 用 state.dur | 規格技能表; 預警填滿 = 生效 |
| ShowMonster fx / 入場 / 冷掉 / 撞欄 | 用 fxDur / enterDur / coolDur / chargeDur | 規格 |
| 馴獸師無敵閃爍 | 每 1/12 秒交替 | 美術自訂(blink 為 true 期間) |
| 套索快斷提示 | 剩餘時限 < 30%、長度 > 80% | 美術自訂 |

## 判讀約定(RD 請照這個算判定, 畫面才會等於判定)

- 震波: radius 是環的**外緣**, 環帶 = [radius − 環寬, radius], 環寬一般 30、大招 40(用 big 判斷)
- 火圈 / 落雷: radius 是實心圓半徑
- 水彈: radius 是判定半徑, 球身就是這個半徑, 拖尾只是裝飾不算判定

## 說明頁

示意圖用 600×560 的虛擬座標畫, 等比縮放置中到 (x, y, w, h), 並 clip 在框內。

1. 第 1 頁 地下城: 熔岩洞地板一角。左上馴獸師朝右揮出扇形鞭, 打中閃白的火蜥蜴, 旁貼 [Z]; 右上火蜥蜴的火圈生效中, 半透明的馴獸師殘影 → 虛線 → 翻滾中的馴獸師穿進火圈, 旁貼 [X]; 下方馴獸師舉盾, 水彈打在盾上冒彈反閃光, 虛線箭頭彈回右邊閃白的水母, 旁貼 [C]; 左上角貼 [←↑↓→]
2. 第 2 頁 收服: 殘血石像鬼被套住(纏繩、可套記號收起), 套索連到它左邊 130 像素處的馴獸師(130 < 220, 規則上不會斷), 半徑 130 的虛線箭頭繞魔物一圈, 進度環填一半; 下方一隻殘血火蜥蜴帶可套記號 + 「殘血」標籤; 右側小框: 進度環全滿(白)、魔物半透明、白勾、「收服!」
3. 第 3 頁 表演: 兩塊沙地並排。左: 揮鞭整圈特效罩住火蜥蜴, 牠怒氣 70、正在表演放火圈, 旁邊怒紅上箭頭, 上方兩個金幣飄字, 馴獸師旁貼 [Z]; 右: 哨音波浪環罩住雷鳥, 牠身上白色波浪環(被安撫)、怒氣 45, 旁邊白色下箭頭, 馴獸師旁貼 [X]
4. 第 4 頁 拿捏: 一條大怒氣條(50 金刻度、80 起紅線斜紋)。紅線段虛線連到上方放大招的火蜥蜴(金色雙環、大招火圈)+ 6 枚金幣 + 「大招 ×2」; 條最右端虛線連到觀眾席裡失控的雷鳥(鋸齒外圈、0/3)、旁邊破掉的圍欄、受驚觀眾、「−3」名聲飄字與一個大紅叉; 最下方三塊「地下城 → 表演場 → 商店」+「×3 天」與一顆星

**偏離 guide 字面(請製作人驗收)**: 第 1 頁 guide 要求「畫面下方四個鍵帽各對應走 / 揮鞭 / 翻滾 / 彈反」。依分工, 按鍵說明歸 RD 的頁面文字; 美術把四個鍵帽各貼在做那個動作的馴獸師旁, 不排成一列、不配動作名稱, 避免和 RD 的文字重複。第 4 頁「下方小字流程」做成三塊圖示 + 短標籤, 不寫成一句話。
