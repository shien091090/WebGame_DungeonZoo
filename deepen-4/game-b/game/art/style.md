# 後台燈控怪獸秀 — 美術規格(style.md)

RD 只讀這份。`art.js` 掛在 `window.Art`, 一般 `<script>` 載入(非 module)。**index.html 必須寫 `<meta charset="utf-8">`**, 否則 art.js 裡的中文在 file:// 下會變亂碼。

## 1. 邏輯畫布尺寸

1280 × 720(`Art.canvas = { width: 1280, height: 720 }`, 等於 interface.json)。

## 2. 色票表(`Art.palette`)

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg / bg2 | #17121f / #221a2e | 一般畫面底(地下城選擇、布置、商店、結算) |
| ink | #120d18 | 所有物件與文字的深色描邊 |
| text / textDim | #f4eee2 / #a99fb8 | 主文字 / 次要文字 |
| panel / panel2 / frame | #2a2236 / #352b44 / #4a3f5c | 卡片底、選中卡片底、卡片外框 |
| select | #ffe27a | **選擇框**(全遊戲唯一的「游標在這」顏色: 卡片外框、選中按鈕底) |
| player / playerHat | #f6ead0 / #2c3a66 | 馴獸師本體 / 帽子 |
| playerFx / playerSkill | #fff6dc / #ffd75e | **玩家放出的東西**: 普攻前緣(白)、X 武器技前緣與捕捉相關(金): 準備捕捉環、繞圈進度環、被打回的泡泡 |
| rope | #d9a05b | 套索繩、HUD 捕獸繩 |
| danger / dangerDark | #ff4a4a / #5a1620 | **規則上的危險**: 傷害地形虛線框、紅區刻度與紅區段、失控標記、失控虛線光環、套索快斷、計時最後 10 秒、電力不足斜線 |
| ignite | #ff8a3d | **激怒 / 被點燃**: 激怒類器材、往上竄的火舌、爆竹預警圈 |
| calm | #7fd0ff | **冷靜 / 被澆熄**: 冷靜類器材、往下落的水滴、冷霧、玻璃罩剩餘時間 |
| move | #c9b8f0 | 移動類器材(吊鉤) |
| light | #fff3c4 | 聚光燈光柱、光圈、「被照亮」光環 |
| gold / rep / heart / ok | #ffc83d / #ffe9a8 / #ff6b81 / #6be08a | 金幣與電力 / 名聲星 / 心、殘血血條 / 已開放、上場、裝備中、收服 |
| rageLow / rageShow / rageRed | #bdb4cc / #ffc04a / #ff5a4a | 怒氣條填色: < 50(不定時)/ ≥ 50(定時表演)/ ≥ 紅區下限 |
| cat 炸毛貓 | #f2d03a | 本體與爪擊(色相 49°, 灰階 201) |
| turtle 泡泡龜 | #4cc35a | 本體與泡泡(127°, 147) |
| boar 熔岩豬 | #e2463c | 本體與熔岩彈(4°, 116) |
| monkey 溫泉猴 | #3cc8d2 | 本體與潑水(184°, 159) |
| fox 流星狐 | #4a6cf0 | 本體與星光射線(228°, 113) |
| owl 月光鴞 | #c47cf2 | 本體與催眠波(277°, 159) |
| arenaFloor / stands / fence | #4a3428 / #2b1f33 / #b98a55 | 表演場地板 / 觀眾席 / 圍欄 |

**色票張力(請製作人用這幾幀驗收)**
- 六種魔物排滿色輪, 相鄰最近一對只差 44°(溫泉猴—流星狐)、45°(熔岩豬—炸毛貓), 過不了 60° 門檻; 每種另有獨一無二的剪影(貓炸毛 + 尖耳、龜殼、豬鼻 + 獠牙、猴頭巾 + 圓耳、狐大尾 + 額星、鴞大眼 + 月牙), 剪影是主通道, 顏色是第二通道。
- 「危險紅」與熔岩豬同色相: 紅色只出現在**線與記號**(虛線框、刻度、標記點、光環), 從不填在魔物本體上; 熔岩豬只在本體與熔岩彈。
- 「被點燃橘」落在炸毛貓黃與熔岩豬紅之間、「被澆熄藍」貼近溫泉猴青: 這兩種回饋的主通道是**方向**(火舌往上竄 / 水滴往下落)與**形狀**(尖頭火舌 / 水滴), 都帶深色描邊; 顏色是第三通道。最差組合: 被點燃的炸毛貓、被澆熄的溫泉猴。

## 3. 形狀語言

圓潤剪影 + 2~2.5px 深色描邊 + 平塗單高光; 玩家放出的東西是「白 / 金前緣細線 + 極淡填色」, 魔物技能是「種類色實心面」; 預警一律「虛線外框 + 由中心長大的填色, 填滿 = 生效」。

## 4. 理念落實(經驗文件中「成立」的理念)

- **P0 辨識度先於好看**: 每種魔物先定剪影再上色; 地下城三套主題只換地板 / 牆 / 地形的「皮」, 危險地形一律加紅虛線框、減速地形一律加白波浪, 換地下城不用重學。
- **P1 視覺權重跟著決策迫切度走**: 表演場上最搶眼的是魔物頭上的怒氣條與失控標記(帶深框、紅區刻度); 光柱與冷霧只用 8~28% 不透明, 不蓋過魔物; 器材名浮字在準星正上方、小字、0.6 秒淡出。
- **P2 規則上存在的東西畫面上就要存在**: 準星同時畫 Z、X 兩個器材的作用範圍圈(半徑 = 規則半徑); 怒氣條標出 50 表演門檻與紅區起點; 失控標記畫成 5 格槽(滿 5 = 失控); 電力條上標出按一下型器材的消耗刻度(低於刻度 = 按了不反應); 地下城地板分出左右房與走道(魔物不會離開房間)。
- **P3 一個意義一種長相**: 橘往上 = 激怒、藍往下 = 冷靜, 器材類別標籤、控制台、說明頁、魔物身上回饋全部共用; 「虛線框 + 長大的填色」只代表預警(魔物技能、冷霧、爆竹同一套); 黃框只代表選擇框; 說明頁示意圖直接呼叫遊戲內畫法。
- **P4 關鍵區分走兩條通道**: 玩家放的 vs 魔物放的 = 白金細線前緣 vs 種類色實心面; 被點燃 vs 被澆熄 = 方向(上 / 下)+ 形狀(火舌 / 水滴)+ 顏色; 準星的 Z 圈 vs X 圈 = 長虛線 vs 短點線 + 器材類別色。
- **P7 每個元素都要掙得版面**: 魔物身上不寫怒氣數字(條本身已表達); 失控標記只在有標記時才出現; 準星不畫字; 卡片說明只留器材表那一句。
- **P9 以最混亂的那一刻驗收**: 魔物上的回饋都帶深色描邊; 怒氣條固定在魔物腳下同一位置、有標記時外框閃白, 四隻擠在一起時仍讀得出誰快失控。
- **P13 事件要排隊**: 同一隻魔物的表演地面光環(腳下)、被點燃 / 澆熄(身體周圍)、失控標記(頭頂)、怒氣條(腳下框內)分在不同帶, 同一刻發生也不疊。
- **P15 回饋強度和份量成正比**: 飄字分級 金幣 20px < 紅區 26px(紅描邊)< 連鎖 28px(粉)< 收服 30px; 扣名聲往下飄(唯一往下的飄字)。
- **P17 進度圖形與數字分工**: 電力條旁有數字, 條上另給「消耗刻度」(數字給不了的「還夠不夠按一次」); 計時條旁寫秒數, 條在最後 10 秒轉紅; 標記槽最新一格外圈的白弧 = 距離自動 −1 還剩多久。
- **P18 重要資訊不能只存在一瞬間**: 收服、升級的飄字之外, 等級留在布置卡(Lv + 三顆等級點)、表演中魔物左上角 Lv、結算陣容。
- **P19 資訊貼著物件**: 怒氣條、標記、Lv 都貼在魔物本身; 器材範圍圈長在準星上; 玻璃罩剩餘時間畫在罩子底座; 套索時限畫在被套魔物的內圈。
- **P21 示意圖選會分岔的例子**: 說明第 1 頁讓馴獸師站在兩顆泡泡之間的空隙(而不是遠離泡泡), 教「顆與顆之間能鑽」; 第 5 頁畫「4 個標記 → 衝欄時沒有標記」, 教「滿 5 個那一刻就失控」, 避免讀成「標記滿了才算數」。

## 5. 物件表(函式簽章與 state 欄位, 全部照 interface.json)

x, y 一律是物件中心點(畫面座標); 例外: `drawButton` 的 x, y 是左上角。所有函式都會把表外值換成預設(見第 8 節), 不會拋錯。

| 物件 | 函式 | state 欄位 | 各狀態視覺差異 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | 無 | 深紫漸層全畫布; 地下城選擇、地下城、布置、商店、結算用 |
| Tile | `drawTile(ctx, s)` | x, y, dungeon, kind, room, nest | **dungeon** 換皮: 竹林綠、溫泉火山褐、星空塔靛。**kind**: wall 深色磚 + 亮頂邊; pillar 立體障礙(竹叢 / 岩塊 / 石柱, 帶影子); floor 平地; hurt 熔岩(火山)/ 粉色碎星(星空塔)+ **紅虛線框**; slow 落葉 / 溫泉池 / 重力漩渦 + **白波浪**。**room**: left / right 棋盤格地板, hall 較暗 + 斜紋。**nest**: 地上草窩虛線圈 + 三顆蛋 |
| Tamer | `drawTamer(ctx, s)` | x, y, facing(0~7), weapon, dashing, blink, lassoing | 米白圓身 + 深藍帽, 帽沿與武器朝面向; 四種武器長相不同(棍 / 劍 / 槍 / 鞭); dashing: 淡藍殘影 + 淡藍外框; blink: 每 1/12 秒半透明閃爍; lassoing: 手邊一捲繩 |
| WildMonster | `drawWildMonster(ctx, s)` | x, y, species, hp, maxHp, hit, weak, stunLeft, stunDur, lassoed, casting, move, moveT, moveDur, dir | 腳下血條(30% 處白刻度); hit: 本體蓋白; weak: 血條轉粉紅 + 右上碎心 + 左上汗滴 + 垂眼; stunLeft > 0 或 lassoed: 頭上三顆旋轉星 + 螺旋眼(劍暈另有金弧 = 剩餘暈眩); lassoed: 腰上一圈繩; casting: 身體外種類色 + 白雙圈脈動; move: crouch 壓扁、pounce 拉長 + 速度線、charge 前傾 + 速度線 + 怒眼、rest 汗滴; dir: −1 朝左 / 1 朝右 |
| CaptureRing | `drawCaptureRing(ctx, s)` | x, y, t, dur | 半徑 42 金色進度環, 從 12 點順時針填 t/dur; 下緣「準備捕捉」小牌 |
| Lasso | `drawLasso(ctx, s)` | x1, y1, x2, y2, progress, t, limit, len, maxLen | 繩: len/maxLen < 0.75 下垂金棕; ≥ 0.75 拉直變紅加粗; ≥ 0.9 紅白閃。魔物外圈半徑 50 金環 = 繞圈進度(尖端帶箭頭); 內圈半徑 43 細白環 = 套索剩餘時限, 剩 < 30% 轉紅 |
| Hazard | `drawHazard(ctx, s)` | x, y, kind, phase, radius, angle, spread, length, width, t, dur, reflected | 顏色 = 施放種類色。warn: 虛線外框 + 淡填 + 由中心長大的較深填色(t/dur 填滿 = 生效); active: 實心種類色 + 邊線(點燃型暖白邊、澆熄型冷白邊)+ 紋樣(爪痕 / 水珠 / 白芯 / z)。lava warn 另有從上空落下的熔岩球; lava active 火花外擴。bubble fly: 半透明綠球; reflected: 米白球 + 金邊 + 金尾跡(玩家色) |
| WeaponFx | `drawWeaponFx(ctx, s)` | x, y, weapon, move, shape, angle, spread, radius, length, width, t, dur | 前緣白線(normal)/ 金線(skill)+ 極淡填; arc 掃過、circle 外擴環、line 帶箭頭長方形、dash 殘影軌跡; 劍 X 技在扇內加三顆星(擊暈); 隨 t/dur 淡出 |
| DungeonCard | `drawDungeonCard(ctx, s)` | x, y, dungeon, open, condition, selected | 上方主題小景 + 名稱 + 兩種魔物頭像與名稱; open: 綠色「已開放」; 未開放: 上半蓋暗 + 鎖 + condition 字串(最多兩行); selected: 黃色選擇框 + 底色提亮 |
| RosterCard | `drawRosterCard(ctx, s)` | x, y, species, level, picked, selected | 頭像 + 名稱 +「Lv N」+ 三顆等級點; picked: 綠框 + 綠底調 + 下方「上場」綠牌 + 笑眼; selected: 黃色選擇框 |
| DeviceSlot | `drawDeviceSlot(ctx, s)` | x, y, key, device | 控制台面板質感; 左大鍵帽 Z / X +「Z 鍵 / X 鍵」; 右器材圖示 + 名稱 + 類別牌 |
| DeviceCard | `drawDeviceCard(ctx, s)` | x, y, device, slot, selected | 圖示、名稱、類別牌(激怒橘 / 冷靜藍 / 移動紫)、說明一句、電力消耗; slot 為 z / x 時左上角黃色鍵帽「Z」「X」; selected: 黃色選擇框 |
| Cursor | `drawCursor(ctx, s)` | x, y, zDevice, xDevice, zRange, xRange, holding, hooking | 白色四角括號準星。Z 範圍圈 = 長虛線、X 範圍圈 = 短點線, 顏色 = 該器材類別色; holding 的那個鍵的圈變實線加粗。hooking: 括號收緊 + 中央吊鉤圖示。不畫字 |
| DeviceFx | `drawDeviceFx(ctx, s)` | x, y, kind, radius, t, dur | spot: 從 y=50 的燈具打下的光柱 + 地上半徑 radius 光圈; mistWarn / fireWarn: 預警(虛線圈 + 長大的填色; 霧氣往中心收 / 地上爆竹 + 引信火花); mistBurst: 霧團外擴淡出; fireBurst: 橘環外擴 + 火花(中央挖空不蓋魔物); jarDrop: 罩子從上方 90px 落下; hookRope: 從 y=50 垂下的繩 + 吊鉤。不畫字 |
| ControlPanel | `drawControlPanel(ctx, s)` | x, y, energy, energyMax, zDevice, xDevice, zState, xState | 左: 「電力」+ 電力條(低於 25% 轉橘)+ 數字; 條上白刻度 = 按一下型器材的消耗(標 Z / X)。右兩個模組(Z、X): 鍵帽 + 圖示 + 名稱 + 狀態字。ready: 綠「可用」; active: 模組底與框變器材類別色、鍵帽按下 + 發光、「照射中 / 吊著」; cooldown: 鍵帽灰 + 流動斜紋、「冷卻」; lowPower: 鍵帽灰 + 紅斜線、「電力不足」 |
| DeviceName | `drawDeviceName(ctx, s)` | x, y, device, t, dur | 準星上方 36~58px 往上飄的器材名(類別色), 後 40% 淡出, t ≥ dur 不畫 |
| ShowArena | `drawShowArena(ctx)` | 無 | 全畫布: 上下觀眾席(y 56~136、582~662)、木地板場地(x 60~1220、y 146~566)、兩側布幕 |
| ShowMonster | `drawShowMonster(ctx, s)` | x, y, species, level, rage, redLow, marks, markLeft, markDur, mode, performing, performT, performDur, fx, fxT, fxDur, lit, jarT, jarDur, chargeT, chargeDur, looseT, looseDur, move, moveT, moveDur, dir | 見下方「表演魔物狀態」 |
| Fence | `drawFence(ctx, s)` | x, y, side, broken | 完好: 兩條橫木 + 4 根柱; broken: 暗色斷木、中間缺口 + 紅虛線 |
| Visitor | `drawVisitor(ctx, s)` | x, y, side, mode | watch: 坐著輕微晃動、笑臉; scared: 灰衣、舉雙手、張嘴、汗滴、抖動; empty: 只剩空椅 |
| ShopItem | `drawShopItem(ctx, s)` | x, y, item, cost, level, owned, equipped, affordable, selected | 左圖示框 + 名稱 + 說明; 右: equipped 綠「裝備中」/ 武器或器材 owned 灰「已擁有」/ 其他金幣價格(買不起: 價格紅、名稱轉灰); 強化另標「已買 N」; selected: 黃色選擇框。club 一律視為已擁有 |
| Button | `drawButton(ctx, s)` | x, y(左上角), w, h, label, selected | selected: 黃底深字 + 左側三角; 否則深底白字 |
| FloatText | `drawFloatText(ctx, s)` | x, y, text, kind, t, dur | 往上飄 36px(repDown 往下), 後 40% 淡出, t ≥ dur 不畫; 含「燈」時字後一團暖光 |
| ResultPanel | `drawResultPanel(ctx, s)` | rep, goldEarned, bestChain, roster, stars | 固定畫在 (640, 380) 800×520: 標題、3 顆星(亮 stars 顆)、總名聲 / 累計金幣 / 最長連鎖、陣容頭像 + Lv、「按 Z 重來」 |
| Hud | `drawHud(ctx, s)` | phase, day, dayMax, gold, rep, hearts, maxHearts, ropes, ropeMax, weapon, xCdLeft, xCdMax, timeLeft, timeMax, dungeon, message | 見下方「HUD 版面」 |
| 說明頁示意圖 | `drawGuidePage(ctx, s)` | page(0~5), x, y, w, h | 見第 7 節 |

**表演魔物狀態(drawShowMonster)**
- 怒氣條(腳下, 90×12): 底色深, 紅區(redLow~100)底色暗紅 + 紅色起點刻度, 50 處白刻度; 填色 < 50 灰 / ≥ 50 琥珀 / ≥ redLow 紅; 有標記時填色紅 + 外框閃白; charge / loose 時整條紅 + 深色斜紋(= 失控)。
- 失控標記(頭頂): marks 1~4 時畫 5 格槽, 紅點 = 已有; 最新一格外圈白弧 = markLeft / markDur。marks 0 不畫; charge / loose 不畫(失控本身就是滿)。
- Lv: 怒氣條左上小字「LvN」。
- mode: roam 一般; hooked 影子縮小 + 本體左右擺動(繩子由 DeviceFx hookRope 畫); jarred 玻璃罩 + 底座藍條 = 剩餘時間(1 − jarT/jarDur); charge 紅虛線光環 + 怒眼 + 速度線, chargeT > 0 時本體震動、靠近的那側圍欄冒撞擊星(y < 356 朝上, 否則朝下), 條下白線 = 撞欄進度; loose 紅虛線光環 + 怒眼, 條下白線 = 亂竄剩餘時間。
- performing: 本體彈一下 + 腳下種類色光環外擴(performT/performDur)。
- fx ignited: 身體上緣三支往上竄的橘色火舌; doused: 身體兩側往下落的藍水滴 + 本體淡藍; 都隨 fxT/fxDur 淡出。lit 為 true 時不畫 ignited。
- lit: 腳下暖白光斑 + 身體外緊貼的暖白雙光環。
- 怒眼: rage ≥ redLow 或失控時換怒眼。

**HUD 版面(drawHud)**
- phase = guide: **整個不畫**(說明頁的所有文字歸 RD)。
- dungeon(高 100): 第一列 y 25: 「第 N / 7 天」、地下城名(主題色)、計時條 x 380~840 + 秒數(≤ 10 秒轉紅)、金幣(x 1020)、名聲星(x 1150)。第二列 y 74: 心(maxHearts 個, 空心為暗)、捕獸繩圈(ropeMax 個)、武器圖示 + 名稱、X 鍵帽(xCdMax 為 0 不畫; 冷卻中鍵帽灰 + 暗色扇形 = 剩餘冷卻; 可用時金框)、message(黃字, 中心 x 1000, 最寬 500, 太長自動縮字)。
- 其他 phase(高 50): 天數、計時條 x 170~370(timeMax > 0 才畫)、message(中心 x 690, 最寬 560)、金幣、名聲。

## 6. 尺寸表

| 物件 | 判定框(interface size) | 實際繪製 |
|---|---|---|
| Tile | 60×60 | 剛好 60×60 |
| Tamer | 64×64 | 身體半徑 18(= 判定半徑), 武器伸到中心外 31 |
| WildMonster | 80×80;月光鴞 110×110 | 身體基準半徑 24(鴞 ×1.35), 血條在框底上方 8px, 暈眩星在頭頂, 全部在框內 |
| CaptureRing | 110×110 | 環半徑 42(線寬 6~9), 下緣字牌到 +54 |
| Lasso | — | 進度環半徑 50、時限環半徑 43(以魔物中心) |
| Hazard | — | 照 radius / spread / length / width 畫, 畫面邊界 = 判定邊界 |
| WeaponFx | — | 同上 |
| DungeonCard | 360×440 | 框內縮 2~4px |
| RosterCard | 180×240 | 同上 |
| DeviceSlot | 360×150 | 352×142 |
| DeviceCard | 220×240 | 框內縮 2~4px |
| Cursor | 60×60 | 準星本體 ±24;**範圍圈半徑 = zRange / xRange, 超出 60×60**(見第 9 節) |
| ControlPanel | 1280×50 | 中心 (640, 691) |
| ShowMonster | 96×96;月光鴞 120×120;怒氣條 90×12 | 怒氣條在框底(中心下 33~45;鴞 45~57), 標記槽在框頂(中心上 41;鴞 53), 本體中心上移 6 |
| Fence | 136×14 | 132×14 |
| Visitor | 56×76 | 座椅 + 人物, 框內 |
| ShopItem | 380×100 | 372×92 + 選擇框 376×96 |
| ResultPanel | 800×520 | 792×512, 固定中心 (640, 380) |
| Hud | 1280×100(dungeon)/ 1280×50(其他) | 底線在 y = 高 − 2 |

**時長常數**(一次性特效以 state 的 t / dur 為準; dur 沒傳或為 0 時的後備值)

| 效果 | 後備總長 | 來源 |
|---|---|---|
| DeviceName | 0.6 秒 | 規格 |
| FloatText | 1 秒 | interface |
| ShowMonster fx / perform | 0.5 / 0.5 秒 | interface |
| jarDur / chargeDur / looseDur / markDur | 3 / 1.5 / 6 / 4 秒 | interface |
| 劍暈 stunDur | 2 秒 | 規格 |

## 7. 說明頁示意圖(drawGuidePage)

**分工**: 美術只畫示意圖, 而且只畫在 `(x, y, w, h)` 框內(有剪裁); 頁標題、說明文字、頁碼、翻頁提示、按鍵說明**一律由 RD 畫**, 美術不畫。圖裡只有物件旁的短標籤與鍵帽。圖以 800×440 為設計尺寸, 等比縮放置中在框內(建議框寬高比約 1.8:1)。

| page 值 / guide 頁名 | 圖 |
|---|---|
| 0 地下城 | 竹林一角; 馴獸師拿棍棒朝左敲中炸毛貓(扇形特效、貓受擊閃白); 右邊泡泡龜射出三顆泡泡(相鄰 25°), 馴獸師在中間與上方泡泡之間的空隙, 白色箭頭表示從原本被瞄準的位置閃進來; 「方向」鍵帽貼在移動箭頭旁、「Z」鍵帽貼在被敲的貓上方; 「你」標籤 |
| 1 收服 | 左右兩格。左: 馴獸師站在殘血泡泡龜上, 準備捕捉環填一半,「站住別動」; 右: 套索連著暈眩的泡泡龜, 馴獸師在虛線繞圈路線上、箭頭指向前進方向, 繞圈進度環一半,「繞一圈」; 右上角「收服!」飄字 + 綠勾 |
| 2 裝器材 | 上方插槽「Z 鍵 聚光燈」「X 鍵 冷霧」; 下方聚光燈卡(標 Z)、冷霧卡(標 X); 「開演」按鈕。只畫開局兩樣 |
| 3 表演中控場 | 兩格舞台。左: 準星在炸毛貓上, 聚光燈光柱打下, 貓被照亮, Z 圈實線(按住中), 上方按下的「Z」鍵帽 +「按住」; 左下迷你電力條(實段比淡段短 + 往左箭頭 = 正在變短)。右: 準星在泡泡龜上, 冷霧散開, 龜身上被澆熄的水滴, 上方「X」鍵帽。兩格之間準星移動箭頭 +「方向」鍵帽 |
| 4 紅區 | 上: 流星狐怒氣 88(紅區 80 起), 正在表演, 飛出「+12 ×2」。下: 熔岩豬怒氣滿、頭上 4 個標記 → 紅箭頭 → 同一隻衝去撞觀眾席圍欄(紅虛線失控光環、無標記、撞擊星), 觀眾嚇到, 紅色打叉 +「失控」 |
| 5 目標 | 四個節點「地下城 → 布置 → 表演 → 商店」順時針一圈, 中央「×7 天」; 表演節點旁名聲星往上加; 箭頭出圈到右下「結算」三顆星 |

**偏離 guide.md 的地方(請製作人驗收)**
- 第 1 頁 guide 要「畫面下方三個鍵帽 方向鍵 / Z / X 各對應 走 / 攻擊 / 武器技」: 這列對照和 RD 畫的頁面文字「方向鍵走, Z 攻擊, X 武器技」是同一句, 照分工改成鍵帽貼在動作旁、不配動作名稱; 圖裡是棍棒(X 無反應), 所以不放 X 鍵帽。
- 第 5 頁「4 個標記 → 撞圍欄」: 規則上滿 5 的那一刻才失控, 衝欄時已沒有標記, 圖照此畫; 撞欄中(chargeT > 0)圍欄仍完好(撞滿 1.5 秒才破)。

## 8. 判讀約定與表外值

- 催眠波 `radius` = 環的**中線**半徑(interface notes 明寫), 繪製帶 = [radius − 15, radius + 15]。請 RD 判定也照中線 ±15。
- 爪擊 / 潑水 `radius` = 扇形外緣; 熔岩彈 = 落點圓外緣; 星光射線從 x, y 往 angle 延伸 length, 寬 width(中線左右各半); 泡泡 radius = 判定半徑。
- 聚光燈光圈、冷霧、爆竹的圈半徑 = 傳入的 radius, 即作用範圍。
- ControlPanel 的 x, y 若有傳就用(預設 640, 691); ResultPanel 固定 (640, 380)。
- 表外值的預設外觀(看到這些請 RD 查傳入值): 未知 species → 炸毛貓; 未知 device → 聚光燈; 未知 dungeon → 竹林; 未知 Tile kind → 地板、room → 走道; 未知 weapon → 棍棒; 未知 item → 棍棒; 未知 Hazard kind → 爪擊; 未知 ShowMonster mode → roam; 未知 zState → ready; 未知 HUD phase → select 版面; 數值 NaN 一律當 0 或該欄預設。

## 9. 與 interface 的張力

- **Cursor 的 size 60×60 只涵蓋準星本體**; interface notes 要求準星畫出兩個鍵的作用範圍圈(半徑 100~120), 範圍圈必然超出 size。範圍圈不參與任何判定(判定以準星中心 + 規則半徑算), 照 notes 畫。
- `drawGuidePage` 不在 interface 的 draw 清單裡(只給 `guidePages: 6`), 請 RD 記得在說明頁呼叫它。

## 10. 繪製層級

照 interface notes 的「繪製順序」。另補: 布置第 1 步 drawBackground → drawRosterCard × N → drawButton(下一步)→ drawHud; 地下城選擇 drawBackground → drawDungeonCard × 3 → drawHud; 商店 drawBackground → drawShopItem × 10 → drawButton(出發)→ drawHud; 結算 drawBackground → drawResultPanel → drawHud; 說明頁 drawBackground → (RD 的頁面文字)→ drawGuidePage。
