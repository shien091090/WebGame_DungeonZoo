# 習性相性秀 — 美術規格(style.md)

> RD 只讀這份。**index.html 必須宣告 `<meta charset="utf-8">`**, 否則 art.js 的中文會變亂碼。
> 所有函式: `window.Art.drawXxx(ctx, state)`, x,y 為物件中心(畫面座標; 地下城已加 130), 例外 `drawButton` 的 x,y 為左上角。每個函式自己 save / restore。
> **畫面上所有文字都由美術畫**(照 interface.json「文字歸屬」), RD 不另外畫字; 說明頁的標題、內文、頁碼、「按 Z 繼續 / 按 Z 開始」也由 `drawGuidePage` 畫。

## 1. 邏輯畫布尺寸

720 × 1280(直式)。HUD 佔 y 0~120。

## 2. 色票表(`Art.palette`)

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg | #14121c | 全畫面底 |
| panel / panel2 / panelHi | #221f2e / #2e2a3e / #3a3550 | 卡片、面板底(一般 / 已開放、裝備中 / 已選上場、面板選中行) |
| line | #4a4562 | 面板外框 |
| text / textDim | #f4f0e6 / #a39fb5 | 主文字 / 次要文字 |
| ink | #120f18 | 物件外描、文字描邊(P10) |
| tamerCoat / tamerHat | #f4f0e6 / #2fd3c4 | 馴獸師本體 / 馴獸師專屬色(帽、也用在「上場」「裝備中」徽章與 X 技就緒) |
| playerFx | #ffffff | **玩家造成的 = 白**: 武器特效、被打回的投射物、捕捉圈、繞圈進度環、選擇框 |
| rope | #d8b07a | 套索、捕獸繩 |
| fire / water / thunder / spike / stone / ghost | #ff5a28 / #3d8bff / #ffd23c / #58c93c / #9a96a8 / #b46cff | 六種魔物本體與牠的技能(各另有 Dark / Light 兩階) |
| redZone | #ff2d55 | 紅區、失控標記、失控外光、套索快斷、圍欄破口。**只用在線、條、記號, 不填在魔物本體** |
| ignite | #ffb020 | 被點燃(升怒): 往上飄的火舌 + 外緣環 |
| douse | #5fd8ff | 被澆熄(降怒): 往下落的水滴 + 外緣環 |
| boost | #e9e4ff | 石像鬼加倍: 機關外的雙圈、連線 |
| gold | #ffc83a | 金幣 |
| heart | #ff5d73 | 心 |
| drum / drumHead | #a8452e / #f1dfb8 | 戰鼓 |
| fountain / fountainWater | #8d97a8 / #7fd6ff | 噴泉 |
| bait / bone | #d97a6a / #f4efe2 | 肉塊 |
| wall / wallDark / wallLight | #8a7a68 / #5a4e42 / #b8a690 | 矮牆 |
| arenaSand / stands | #c9a87a / #3a2e3e | 表演場沙地 / 觀眾席 |
| lava / lavaHot, waterTile / waterWave | #c8401a / #ffb030, #1f4a78 / #5aa0e0 | 熔岩、水地塊 |

地下城風格(Tile 依 dungeon 換): cave 暖褐、cliff 冷灰藍、ruins 沙黃綠褐; HUD 地下城名用該地下城的強調色。

色相 / 灰階實算(node): fire 14° / 134、thunder 46° / 206、spike 108° / 151、water 216° / 129、ghost 269° / 146、stone 無彩 / 153、redZone 349° / 112。
**已知張力**: fire 與 thunder 只差 32°(紅橘 vs 黃), 靠灰階差 72 + 剪影(蜥蜴 vs 鳥)分開; ignite 與 thunder、douse 與 water 色名相近 → 這兩種回饋一律帶 ink 黑襯環, 並靠「方向」(火舌往上 / 水滴往下)當主通道。最差組合: 被點燃的雷鳥、被澆熄的水母。

## 3. 形狀語言

圓角扁平 + 2~3px 深色外描; 魔物是側面可愛剪影(每種一個輪廓), 機關是物件寫實小圖, UI 是圓角卡片。字典:
- **虛線框 + 由中心長大的填色 = 預警, 填滿那刻生效**(火圈、落雷)
- **實心面 = 正在生效的危險**
- **白 = 玩家造成 / 玩家要操作的**(武器、打回的飛彈、捕捉圈、進度環、選擇框)
- **白虛線圈(半徑 40) = 站進來就能捕捉**; 準備捕捉的進度就填在這同一圈上
- **雙圈 = ×2**(石像鬼加倍)
- **琥珀火舌往上 = 升怒; 青色水滴往下 = 降怒**
- **紅 = 紅區 / 失控**, 只出現在條、線、菱形記號

## 4. 理念落實

- P0 辨識度先於好看: 六種魔物各一個剪影 + 一個典型色; 危險(實心面)與預警(虛線 + 長大填色)與玩家的(白)三類長相互不重疊。
- P1 決策迫切度: 地下城最重的是預警圈(玩家要閃)與殘血白虛線圈(玩家要衝上去); 地形全部壓低彩度; 飄字不疊在怒氣條上(飄字在物件上方, 怒氣條在物件底部)。
- P2 規則看得見: 殘血門檻在血條上有 30% 刻度; 捕捉距離 40 畫成白虛線圈; 套索快斷時畫出 220 的最大長度圈; 怒氣條上標 50 門檻與紅區寬度(等級越高紅區越寬); 失控標記畫 5 格(滿 5 失控), 正在遞減那一顆被逐漸吃掉; 石像鬼加倍有連線 + 雙圈。
- P3 一本字典: 「填滿 = 生效」同時用在火圈 / 落雷預警與捕捉圈; 技能在地下城與表演場同一套畫法; 說明頁全用遊戲內函式畫。
- P4 兩條通道: 升怒 / 降怒 = 顏色(琥珀 / 青)+ 方向(上 / 下)+ 形狀(火舌 / 水滴), 戰鼓脈衝往外擴、噴泉脈衝往內收; 被打回的飛彈 = 白本體 + 種類色描邊(顏色反轉), 與敵方飛彈分開。
- P7 掙得版面: 不畫怒氣數字(條已給)、不在機關上寫「×2」(雙圈已給); Lv 只在 ≥1 時才出徽章。
- P9 最混亂的一刻: 4 隻魔物 + 多個脈衝 + 技能同框時, 所有物件帶 ink 外描, 脈衝範圍內只鋪 ≤10% 的淡色。
- P13 事件排隊: 飄字只往上飄 40px、1 秒內淡出, 不做其他全畫面事件演出。
- P15 份量分級: 單隻被點燃 / 澆熄 = 物件外緣小環; 機關脈衝 = 半徑 160 的環; 失控 = 紅色外光 + 撞欄進度環, 層層加大。
- P17 圖形與數字分工: HUD 計時數字給秒數, 細條給整段比例; 套索時限只用圖(繩中點小餅圖), 最後 30% 轉紅。
- P18 重要資訊留存: 收服結果另有結算的陣容與等級; 單次最多打中寫進結算。
- P19 貼著物件: 捕捉進度、套索時限、失控標記、怒氣條、被點燃 / 澆熄全部長在該物件身上。
- P21 示意圖選分岔例子: 第 2 頁把「站上去」(虛線圈內)與「繞一圈」(套索 + 圓形路線)分兩格; 第 4 頁「5 個標記」與「失控撞欄」並排, 而不是只畫怒氣滿。

## 5. 物件表

| 物件 | 函式 | state 欄位 | 各狀態視覺 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | — | 全畫面 bg 色 |
| 地下城地塊 | `drawTile(ctx, s)` | x, y, dungeon(cave/cliff/ruins), kind(wall/pillar/floor/lava/water), room(top/bottom/hall), nest | 牆: 暗塊 + 亮頂邊 + 磚縫; 石柱: 地板上一根圓角柱; 地板: 房內棋盤格、走道(hall)較暗帶小點; 熔岩: 紅底 + 亮橘裂紋(慢閃); 水: 深藍 + 波紋; nest: 地板上一圈草繩虛線巢 |
| 馴獸師 | `drawTamer(ctx, s)` | x, y, facing(0~7), weapon(club/sword/spear/whip), dashing, blink, lassoing | 身體 = 判定圓 r18(白)+ 青綠帽; 帽簷與手上武器朝面向; dashing: 後方白殘影 + 白外圈; blink: 半透明閃爍; lassoing: 腰間繩圈 |
| 野生魔物 | `drawWildMonster(ctx, s)` | x, y, species, hp, maxHp, hit, weak, stunLeft, stunDur, lassoed, casting, dashing, dir(-1/1) | 底部血條(含 30% 刻度); hit: 本體疊白; weak: 白虛線捕捉圈 r40 + 汗滴, 血條變白; 暈眩(stunLeft>0 或 lassoed): 頭上 3 顆白星 + 叉叉眼, 劍暈另畫剩餘時間弧; lassoed: 腰間繩圈; casting: 本體後種類淺色光暈; dashing: 身後黃白速度線 |
| 準備捕捉 | `drawCaptureRing(ctx, s)` | x, y, t, dur | 魔物中心 r40 的圈, 白弧填到 t/dur; 上方白字「準備捕捉」 |
| 套索 | `drawLasso(ctx, s)` | x1, y1(馴獸師), x2, y2(魔物), progress, t, limit, len, maxLen | 繩: 鬆時下垂、len/maxLen > 0.85 拉直並紅白閃; > 0.7 時畫出半徑 maxLen 的紅虛線圈; 魔物周圍 r50 白色繞圈進度環; 繩中點小餅圖 = 套索剩餘時間(最後 30% 轉紅) |
| 技能 | `drawHazard(ctx, s)` | x, y, kind(firering/waterball/thunder/quake/spike/wisp), phase(warn/active/fly), radius, t, dur, angle, reflected | 火圈 / 落雷 warn: 種類色虛線外緣 + 由中心長到 t/dur 的填色; active: 實心面(火圈加火舌、落雷加白閃電), 隨 t 淡; 震波 active: r±15 的實心環帶 + 碎石; 水彈 / 尖刺 / 鬼火 fly: 判定半徑內的實心體 + 後方淡尾跡, 鬼火最後 1/3 漸淡; reflected: 白本體 + 種類色描邊 + 白尾跡 |
| 武器特效 | `drawWeaponFx(ctx, s)` | x, y, weapon, move(normal/skill), shape(arc/circle/line/dash), angle, spread, radius, length, width, t, dur | 一律白: arc 扇形淡填 + 外緣粗弧(外緣 = radius); skill 多一道內弧; circle 整圈; line 長方形框; dash 沿路白殘影 + 兩條軌跡線; 隨 t/dur 淡出 |
| 地下城卡 | `drawDungeonCard(ctx, s)` | x, y, dungeon, open, condition, selected | 畫名稱、兩種魔物剪影與名字; open: 亮底 + 綠「已開放」; 未開放: 暗底、魔物半透明、右上鎖頭、右側「開放條件」+ condition 依「+」斷行; selected: 白粗框 + 左側白三角 |
| 陣容卡 | `drawRosterCard(ctx, s)` | x, y, species, level, picked, selected | 魔物剪影、名稱、「Lv N」、底部一句習性(依 species); picked: 青綠框 + 青綠「上場」徽章; selected: 白粗框 + 白三角 |
| 布置格 | `drawSetupCell(ctx, s)` | x, y, selected | 一般: 暗色虛線框; selected: 白粗框 + 淡白底 |
| 選擇面板 | `drawPickerPanel(ctx, s)` | options[{type, key, name, cost, desc, affordable}], index | 固定 x 120~600, y 240 起; 標題「要放什麼?」; 每行: 圖示(魔物剪影 / 機關小圖 / 清空灰叉)+ name + desc + 機關價格(金幣圖示); 買不起: 整行 40% 淡化、價格轉暗; 選中行: 亮底 + 白框 |
| 布置資訊列 | `drawSetupInfo(ctx, s)` | gold, placed, picked(x, y 可省, 預設中心 260,1210) | 「金幣 N」「已擺 p / q」+ q 個圓點(已擺的亮青綠) |
| 機關 | `drawGadget(ctx, s)` | x, y, kind(drum/fountain/bait/wall), fired, boosted | 戰鼓: 鼓 + 兩支鼓棒; 噴泉: 石盆 + 水柱; 肉塊: 帶骨肉; 矮牆: 磚牆畫滿 160×140; fired: 鼓棒舉起 + 鼓面亮 + 琥珀底光 / 水柱變高 + 青底光; boosted(戰鼓、噴泉): 外圍淡紫白雙圈 |
| 機關脈衝 | `drawGadgetPulse(ctx, s)` | x, y, kind(drum/fountain), radius, boosted, t, dur | 半徑 radius 的虛線外緣 + ≤10% 淡填; 戰鼓: 琥珀環由內往外擴; 噴泉: 青環由外往內收 + 水滴; boosted: 兩道環(第一道淡紫白、較粗) |
| 加倍連線 | `drawBoostLink(ctx, s)` | x1, y1(石像鬼), x2, y2(機關) | 黑襯底 + 淡紫白流動虛線 + 朝機關前進的小箭頭 |
| 表演場 | `drawShowArena(ctx)` | —(state 可不傳) | 上下觀眾席(座位排)、沙地場地 x 60~660 y 270~990 與場中圈線 |
| 表演魔物 | `drawShowMonster(ctx, s)` | x, y, species, level, rage, redLow, marks, markLeft, markDur, mode(roam/charge/loose), performing, performT, performDur, fx(none/ignited/doused), fxT, fxDur, chargeT, chargeDur, looseT, looseDur, dashing, dir | 底部怒氣條 90×12: 50 門檻白刻度、redLow~100 紅底 + 紅框, 填色 <50 灰 / ≥50 米白 / 紅區紅帶白芯; marks>0: 頭上 5 格紅菱形(實 = 已有, 最後一顆依 markLeft/markDur 被吃掉), 怒氣條紅白閃, 眼睛變怒; Lv≥1 右下黑底「LvN」; performing: 種類淺色光暈 + 本體小跳; fx ignited: 黑襯琥珀外環 + 兩側火舌往上; doused: 黑襯青外環 + 兩側水滴往下; dashing: 速度線; charge: 紅外光 + 紅圈, 衝刺中速度線、撞欄中(chargeT>0)本體抖動 + 白弧 = 撞欄進度; loose: 紅外光 + 紅弧 = 亂竄剩餘時間; charge / loose 時怒氣條全滿閃、不畫標記 |
| 圍欄 | `drawFence(ctx, s)` | x, y, side, broken | 完好: 木欄; broken: 斷成兩截、中間紅色破口 |
| 觀眾 | `drawVisitor(ctx, s)` | x, y, side, mode(watch/scared/empty) | watch: 坐著微笑; scared: 舉雙手抖動、張嘴、驚嚇線; empty: 座位 + 虛線空位 |
| 商店項目 | `drawShopItem(ctx, s)` | x, y, item, cost, level, owned, equipped, affordable, selected | 圖示、名稱、說明(spec 第 60 條); 武器 owned: 綠「已擁有」, 否則金幣 + 價格; 買不起: 價格轉暗 + 小字「金幣不足」; 強化 level>0: 「已買 N 次」; equipped: 青綠框 + 「裝備中」徽章; selected: 白粗框 + 白三角 |
| 按鈕 | `drawButton(ctx, s)` | x, y(左上), w, h, label, selected | 一般: 暗底白字; selected: 米白實心 + 深字 + 雙框 |
| 飄字 | `drawFloatText(ctx, s)` | x, y, text, kind, t, dur | 1 秒內上飄 40px, 後 40% 淡出; gold / coin20 金字; redGold: 金字 + 紅框暗底牌; splash: 金字 + 白框; repDown: 粉紅字; capture: 大白字; levelUp: 青綠字 |
| 結算 | `drawResultPanel(ctx, s)` | rep, goldEarned, bestHits, roster[{species, level}], stars | 全畫面暗幕 + 面板: 「七天結算」、3 顆星(stars 亮)、門檻小字、總名聲 / 累計金幣 / 單次最多打中、陣容剪影與 Lv、「按 Z 重來」 |
| HUD | `drawHud(ctx, s)` | phase, day, dayMax, gold, rep, hearts, maxHearts, ropes, ropeMax, weapon, xCdLeft, xCdMax, timeLeft, timeMax, dungeon, message | 見下方版位; guide 只畫遊戲名 |
| 說明頁 | `drawGuidePage(ctx, s)` | page(0~4), x, y, w, h | 在框內等比縮放 640×1000 的設計稿, 畫標題、內文、示意圖、頁碼、「按 Z 繼續 / 開始」(見第 7 節) |

**表外值的預設**(RD 看到不該出現的預設外觀時去查傳入值): species → fire、dungeon → cave、Tile kind → floor、room → hall、weapon → club、Hazard kind → firering、ShowMonster mode → roam、fx → none、Gadget kind → drum、ShopItem item → club、FloatText kind → gold、HUD phase → select。數字欄位 NaN / undefined 當 0(或該欄位的規格預設)。

## 6. 尺寸表

| 物件 | 尺寸(以 x,y 為中心) | 備註 |
|---|---|---|
| Tile | 60×60 | 填滿 |
| Tamer | 64×64 | 身體圓 r18 = 判定半徑 |
| WildMonster | 90×90(石像鬼 110×110) | 剪影 R=30(石像鬼 40); 捕捉虛線圈 r40 = 準備捕捉距離; 血條在底部 |
| CaptureRing | 120×120 | 圈 r40 |
| Lasso | 不限 | 進度環 r50; 最大長度圈 r = maxLen |
| Hazard | 依 radius | 火圈 / 落雷: 畫面外緣 = radius; 震波: **radius = 環中線**(照 interface), 帶 = [radius−15, radius+15], 外緣 = radius+15; 投射物: 實心體外緣 = 判定半徑(尾跡只在後方, 寬度 < 判定半徑) |
| WeaponFx | 依 radius / length / width | 外緣 = radius; line = length × width |
| DungeonCard | 600×260 | |
| RosterCard | 300×200 | |
| SetupCell | 200×180 | |
| PickerPanel | 480 × (80 + 70n), 左上 (120, 240) | 行 480×70 |
| SetupInfo | 400×120 | |
| Gadget | 80×80; 矮牆 160×140 | 矮牆畫滿 = 判定 |
| GadgetPulse | 2 × radius | |
| ShowMonster | 100×100(石像鬼 120×120) | 剪影 R=28(石像鬼 36)中心 y−4; 怒氣條 90×12 貼底; 標記列在頂 |
| Fence | 100×16 | |
| Visitor | 60×90 | |
| ShopItem | 600×110 | |
| Button | w × h | |
| ResultPanel | 全畫面 | 面板 x 50~670, y 170~1150 |
| HUD | 720×120 | 第一列 y 10~50: 天數框(x 12~150)、畫面 / 地下城名(x 166)、計時數字(右緣 x 440)、金幣(x 458)、名聲(x 571); 計時細條 y 56~62; 地下城第二列 y ~82: 心(x 14 起每 26)、繩(接在心後每 24)、武器框 x 640~704 含 X 冷卻圓; message: 地下城在右下(右緣 x 630, y 108), 其他畫面置中 y 94 |

自測: 用會追蹤變換矩陣的假 ctx 跑過所有函式的所有狀態組合 + 壞狀態(空物件、undefined、null、表外字串、NaN、極大數), 無拋錯、save/restore 成對, 有 size 的函式外接框都在 size 內(HUD 的超框是假 ctx 用字數 × 字級估字寬的誤報)。

## 7. 說明頁(drawGuidePage)

框內設計空間 640×1000, 等比縮放置中、剪裁在框內。版位: 標題 y 44、內文 y 104、示意圖 y 140~930、頁碼右下、「按 Z 繼續」(最後一頁「按 Z 開始」)y 966。**建議 RD 傳 `{x:0, y:0, w:720, h:1280}`**(或扣掉 HUD 的 `{x:0, y:120, w:720, h:1160}`), 頁面上不再畫其他字。

| 頁 | 示意圖 |
|---|---|
| 1 地下城 | 洞窟一角: 馴獸師拿棍棒朝右敲中火蜥蜴(白扇形 + 火蜥蜴閃白); 另一隻火蜥蜴腳下火圈預警, 白色移動箭頭繞開它。鍵帽貼在動作旁: 方向鍵 + 「走」在箭頭旁、Z +「攻擊」在扇形下、X +「武器技」在馴獸師下 |
| 2 收服 | 左格「1 站上去」: 殘血水母(白虛線圈 + 汗滴)、馴獸師站在身上、捕捉圈填一半; 右格「2 繞牠一圈」: 套索連著暈眩水母、白虛線圓形路線 + 箭頭、進度環一半; 下方小格: 進度環滿 + 綠勾 +「收服!」 |
| 3 布置 | 表演場(×0.5)疊 3×4 格: 火蜥蜴、水母、石像鬼、戰鼓、矮牆各一格, 游標在空格; 右上選擇面板(×0.6)列機關; 「開演」按鈕拉一條箭頭到右下開演後縮圖(×0.3): 戰鼓脈衝、火蜥蜴放火圈、水母被點燃 |
| 4 紅區 | 上: 火蜥蜴怒氣在紅區、正在表演, 飛出紅框「+10 ×2」, 「紅區」標籤指著怒氣條紅段; 下: 雷鳥頭上 5 顆紅菱形 → 箭頭 → 撞破圍欄、在觀眾席亂竄、觀眾嚇到, 紅叉 +「失控: 名聲下降」 |
| 5 目標 | 地下城 → 布置 → 表演 → 商店 一圈箭頭, 中央「×7 天」; 表演旁白星往上 +「+名聲」; 箭頭出圈到「結算」三顆星 |

偏離 guide 字面: 第 1 頁 guide 要「下方三個鍵帽一列」, 改成鍵帽貼在各自動作旁(經驗: 鍵帽排成一列會和頁面文字重述同一句)。

## 8. 時長常數

| 效果 | 總長 | 來源 |
|---|---|---|
| 火圈預警 / 生效 | 0.5 / 0.5 | 規格(state dur) |
| 落雷預警 / 閃光 | 0.8 / 0.2 | 規格 |
| 震波 | 1 | 規格 |
| 鬼火存在 | 3 | 規格; 最後 1/3 漸淡 |
| 武器特效 | 0.2(突進 0.25) | 規格 |
| 機關脈衝 | 0.4 | interface; t ≥ dur 時完全透明 |
| 被點燃 / 澆熄 | 0.5 | interface |
| 表演動作 | 0.5 | interface |
| 飄字 | 1 | interface |
| 準備捕捉 | 0.8(最低 0.35) | 規格, 用 state dur |
| 套索時限 | 5 + 幽靈加成 | 規格, 用 state limit; 最後 30% 餅圖轉紅 |

所有「還剩多少」的圖形都用 state 傳入的總長算, 美術沒有寫死秒數。

## 9. 繪製層級(建議 RD 照這個順序)

地下城: Tile → Hazard(warn / active 範圍)→ WildMonster → CaptureRing → Lasso → Tamer → WeaponFx → Hazard(fly 投射物)→ FloatText → HUD
表演場: ShowArena → Fence → Visitor → SetupCell(布置時)→ GadgetPulse → Hazard(範圍)→ BoostLink → Gadget → ShowMonster → Hazard(投射物)→ FloatText → HUD → PickerPanel / SetupInfo / Button
