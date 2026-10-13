# 怪獸節目表 — 美術規格(deepen-3 / game-b)

> RD 必讀: `index.html` 必須宣告 `<meta charset="utf-8">`, 否則 art.js 裡的中文會變亂碼。
> 載入方式: `<script src="game/art/art.js"></script>` 之後用全域 `window.Art`。不用 ES module。

## 1. 邏輯畫布尺寸

`720 × 1280`(直式)。`Art.canvas = { width: 720, height: 1280 }`, 與 interface.json 相同。

## 2. 色票表(`Art.palette`)

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg / bg2 | #15121d / #201b2c | 全畫面底(上下漸層) |
| panel / panelHi / panelLine | #2a2440 / #3a3258 / #4d4470 | 卡片、面板底; 面板選中行; 面板邊線 |
| ink / inkDim / disabled | #f6f0e4 / #a69fba / #6b6680 | 主文字 / 次要文字 / 停用、空位 |
| outline | #100c16 | 所有物件與文字的深色描邊 |
| cursor | #ffe066 | **選擇框 / 游標專用**(全遊戲同一個長相: 黃粗框 + 外暈); 也用在 Lv 字、暈眩星 |
| mine(= tamerAccent) | #2ec4b6 | **「你的」**: 馴獸師圍巾與鼻尖、武器特效底、被打回的投射物、捕捉圈、套索進度環、上場標記、裝備中、按鈕選中 |
| tamer | #f3ead8 | 馴獸師身體 |
| danger | #ff3b3b | 危險 / 規則記號: 紅區段、失控鋸齒圈、失控標記、時間將盡、買不起價格、打叉 |
| amber / rageLow | #f0b030 / #9aa3b5 | 怒氣條填色: 50~紅區下限 / 50 以下 |
| gold | #ffd84a | 金幣(圖示、數字、紅區表演光環) |
| rep | #c9a0ff | 名聲(星形圖示、數字) |
| heart / rope | #ff5577 / #d9b27a | 心 / 捕獸繩 |
| good | #5ef08a | 已開放、收服! |
| fire | #ec4a2c | 火蜥蜴本體與火圈 |
| water | #3a8ef0 | 水母本體與水彈 |
| thunder | #f4d43a | 雷鳥本體與落雷 |
| spike | #5fb83a | 刺蝟本體與尖刺 |
| stone | #9a98a6 | 石像鬼本體(震波另用 #b8a78a 土石色) |
| ghost | #b46ee8 | 幽靈本體與鬼火 |
| provoke / chill / rampage / rally / encore | #e8503a / #7cc8f0 / #f08a24 / #4fbf7a / #f0c53a | 五種節目卡的卡底色(只出現在卡圖示、卡名浮字、集合的地面圈與橫衝直撞的 >> 記號) |
| ignite / douse | #ffa53a / #8fdcff | 剛被點燃(往上竄的火舌) / 剛被澆熄(往下滴的水滴) |
| sand / sandDark / stands / fence | #c9a873 / #a88a5c / #3a2f4a / #8a5a32 | 表演場地、觀眾席、圍欄 |

種類色檢查(node 算): 火 9° 灰 119、雷 50° 灰 204、刺 102° 灰 143、水 212° 灰 128、幽 274° 灰 145、石 無彩 灰 154。

**已知張力**:
- 火(9°)與雷(50°)色相只差 41°(紅—黃相鄰), 但灰階差 85, 而且**六種魔物的主辨識是剪影**(蜥蜴 / 傘狀水母 / 三角翅鳥 / 刺球 / 方塊帶角 / 波浪底幽靈), 顏色是第二通道。表演場最差組合: 火蜥蜴與雷鳥重疊時, 用剪影分。
- 規則色「紅區」紅(0°)與火蜥蜴(9°)同名。處理: 紅只出現在線與記號(怒氣條紅段、失控鋸齒圈、標記三角), **從不填在魔物本體上**; 火蜥蜴的紅只在本體與火圈(實心面)。失控時本體上蓋的 25% 紅是唯一例外, 外面一定套著紅鋸齒圈。
- 點燃(琥珀 33°)貼近雷鳥黃與火紅、澆熄(淺藍 199°)貼近水母藍。主通道交給**方向**(火舌往上竄 / 水滴往下滴)與形狀(尖頂火舌 / 圓底水滴), 都帶深色描邊與本體分開。最差組合: 被澆熄的水母、被點燃的雷鳥。

## 3. 形狀語言

圓角、粗深色描邊(2~3px #100c16)、扁平填色; **會動的生物(魔物、馴獸師、觀眾)有落影, 場景地塊(地板、水、熔岩)平塗無影**; 敵方技能 = 實心面 / 粗環, 你放出去的 = 白色前緣細線 + 青色淡底 + 虛線最終範圍。

## 4. 理念落實(經驗文件中「成立」的理念)

- **P0 辨識度先於好看**: 六種魔物各一個獨特剪影, 縮到說明頁 0.5 倍仍分得出; 任何狀態(殘血、暈眩、施法、失控)都疊在本體外圍, 不改本體剪影。
- **P1 視覺權重跟著決策迫切度走**: 地下城最搶眼的是敵方技能預警(虛線圈 + 長大的填色)與殘血記號; 表演場是玩家不能操作的觀看畫面, 最顯眼的是怒氣條紅段與失控紅鋸齒圈; 卡名浮字畫在怒氣條**上方**, 不蓋怒氣條。
- **P2 規則上存在的東西, 畫面上就必須存在**: 怒氣條常駐標出門檻 50(白刻度)與紅區下限~100(紅段); 失控標記的「4 秒後 −1」畫在最後一個標記的填滿度上; 野生魔物畫血條與 30% 殘血刻度; 判定邊界 = 畫面邊界(馴獸師身體 r17 + 描邊 = 判定 r18; 投射物本體圓 = 判定半徑; 火圈 / 落雷外緣 = radius; 震波帶 = radius±15)。
- **P3 一個意義一種長相**: 青色只代表「你的」(馴獸師、你的攻擊、被打回的投射物、捕捉 / 套索進度、上場、裝備中); 黃框只代表游標; 紅只代表危險 / 規則記號; 節目卡圖示在面板、節目大列、縮小格、浮字四處同一個; 說明頁全部呼叫遊戲內畫法並給規則上成立的 state。
- **P4 關鍵區分至少兩條感知通道**: 魔物 = 剪影 + 顏色; 點燃 / 澆熄 = 方向 + 形狀(+ 顏色); 敵方技能 vs 你的攻擊 = 實心面 vs 白細線虛線 + 色; 預警 vs 生效 = 虛線外框 + 半透明 vs 實心不透明; 縮小節目表「進行中」= 白粗框 + 頂端小三角, 「已過」= 整格壓暗。
- **P7 每個元素都要掙得它的版面**: 縮小節目表不畫字(介面規定), 只留卡圖示 + 點名頭像; 表演中魔物不畫名字(剪影已讀得出), 只畫 Lv; 說明頁鍵帽貼在動作旁、不另列一排「鍵 ↔ 動作」(該頁標語已寫)。
- **P9 以最混亂的那一刻驗收**: 所有文字帶深色描邊; 怒氣條有深色底與描邊, 壓在任何魔物或沙地上都讀得到; 4 隻魔物重疊 + 技能滿場時, 每隻頭頂的怒氣條仍在自己的 `size` 框內、不被卡名浮字蓋住。
- **P13 事件要排隊**: 卡名浮字與金幣飄字分佔不同高度帶(卡名在怒氣條上方 54~122px, 飄字由 RD 指定位置往上飄); 卡名 0.8 秒、飄字 1 秒都在後段淡出, 不同時佔同一點。
- **P15 回饋強度與份量成正比**: 飄字分級: 金幣 22px < 紅區 ×2 28px 加紅描邊 < 連鎖 30px 白字加橘描邊; 收服 30px 綠字加打勾; 失控是唯一用鋸齒外圈 + 紅色調的狀態。
- **P17 進度類資訊分工**: HUD 計時給秒數, 底線細條給總進度; 套索繞圈進度(內粗環) 與時限(外細環, 剩 30% 變紅)分兩個環, 不重述同一量; 擊暈只畫剩餘弧(數字不顯示); X 冷卻方塊由下往上填青, 就緒時整塊實心青。
- **P18 重要資訊不能只存在一瞬間**: 收服 / 升級只在飄字閃過, 但升級後的紅區變寬會常駐在怒氣條上、Lv 常駐在魔物右下與陣容卡; 結算畫面列出陣容與等級。
- **P19 資訊貼著物件**: 準備捕捉字樣與圈畫在魔物身上; 卡名浮字帶尖角指向被點名的魔物; 怒氣條、標記、Lv 都長在魔物自己的框內; 說明頁「紅區」標籤直接框住怒氣條紅段。

## 5. 物件表(函式簽章與 state)

所有 `x, y` 為物件中心(畫面座標, 地下城已含 y+130), `drawButton` 例外(左上角 + 寬高)。所有函式自己 save/restore。

| 物件 | 函式 | state 欄位 | 各狀態視覺 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | 無 | 深紫漸層 + 頂部 120px 更深的 HUD 帶。地下城、選擇、布置、商店、結算都先畫它 |
| Tile | `drawTile(ctx, s)` | x, y, dungeon, kind, room, nest | dungeon 換皮: cave 暖褐、cliff 冷灰藍、ruins 沙石磚縫。kind: wall 立體石塊(頂面 + 亮邊)、pillar 地板上一根帶影圓柱、floor 棋盤微差、lava 橘紅漸層 + 深紅裂紋 + 冒泡、water 深藍 + 流動波紋。room: hall(走道)比房間亮一階。nest true: 地板上一圈草窩 |
| Tamer | `drawTamer(ctx, s)` | x, y, facing, weapon, dashing, blink, lassoing | 米白圓身(r17)+ 青圍巾 + 褐帽 + 面向的青色鼻尖; 武器握在面向右手側。dashing: 身後青殘影 + 白外圈(無敵)。blink: 每秒 6 次 35% / 85% 透明交替。lassoing: 側邊一捆繩 |
| WildMonster | `drawWildMonster(ctx, s)` | x, y, species, hp, maxHp, hit, weak, stunLeft, stunDur, lassoed, casting, dashing, dir | 本體 r30(石像鬼 r38)+ 下方血條(30% 白刻度)。hit: 整隻閃白。weak: 血條變粉紅 + 頭頂左上裂心 + 右上汗滴 + 下垂眼。casting: 本體外一圈種類淡色流動虛線 + 怒眉。stunLeft>0 或 lassoed: 頭頂 3 顆繞圈黃星 + X 眼; 劍擊暈另畫一條黃色剩餘弧(lassoed 不畫弧, 時限在套索上)。dashing: 身後白速度線。dir 決定臉朝向 |
| CaptureRing | `drawCaptureRing(ctx, s)` | x, y, t, dur | 魔物身上半徑 42 的深底環, 青色進度從 12 點鐘順時針長到 t/dur; 上方青字「準備捕捉」 |
| Lasso | `drawLasso(ctx, s)` | x1, y1, x2, y2, progress, t, limit, len, maxLen | 繩: 鬆時下垂、繩色; len/maxLen > 0.65 變琥珀、> 0.85 拉直變紅 + 白虛線(快斷)。魔物周圍 r54 粗環 = 繞圈進度(青), 外圈 r63 細環 = 剩餘時限(剩 30% 變紅), 環上兩個白箭頭沿順時針轉(提示繞行) |
| Hazard | `drawHazard(ctx, s)` | x, y, kind, phase, radius, t, dur, angle, reflected | 見下方「判讀約定」。warn: 深色底 + 種類色虛線外框 + 由中心長大的半透明填色(填滿 = 生效), 落雷另加準星。active: 火圈 = 實心漸層 + 火舌、淡出; 落雷 = 亮白黃閃光 + 閃電、0.2 秒淡出; 震波 = 土石色實心帶 + 裂紋。fly: 水彈 = 藍圓 + 高光、尖刺 = 綠尖錐、鬼火 = 紫火團(最後 20% 淡出); 皆有尾跡。reflected: 改成青色本體 + 白描邊 + 青尾跡 |
| WeaponFx | `drawWeaponFx(ctx, s)` | x, y, weapon, move, shape, angle, spread, radius, length, width, t, dur | 全部 = 青淡底 + 白虛線標出完整範圍 + 白色掃過前緣, 隨 t/dur 淡出。arc: 前緣從一側掃到另一側; circle: 白弧繞圈; line: 白刺尖往前推; dash: 青殘影串 + 兩條白軌跡。劍擊暈(sword+skill): 前緣改黃 + 3 顆黃星(與暈眩同色) |
| DungeonCard | `drawDungeonCard(ctx, s)` | x, y, dungeon, open, condition, selected | 上緣牆帶 + 地下城名; 兩種魔物頭像與名字。open: 該地下城皮色底 + 綠「已開放」。未開放: 暗底、頭像半透明、右上鎖、右側琥珀色 condition 字串。selected: 黃粗框 |
| RosterCard | `drawRosterCard(ctx, s)` | x, y, species, level, picked, selected | 左大頭身、右種類名 + 黃「Lv N」。picked: 青邊框 + 青底「上場」膠囊; 未選: 本體 70% 透明。selected: 黃粗框 |
| PickerPanel | `drawPickerPanel(ctx, s)` | layer, options, index | 先把整個遊戲區(y 120 以下)壓暗 55%。面板 x 120~600、y 240 起, 高 80+70×行數。標題「放哪張卡?」/「點名誰?」。card 行: 卡圖示 + 名稱 + 灰色說明 + 金幣價格; affordable false 整行 45% 透明、價格紅。monster 行: 小頭像 + 名字。clear 行: 灰 X + 名字。選中行: 亮底 + 黃粗框 |
| SetupInfo | `drawSetupInfo(ctx, s)` | gold, cards | 固定畫在 x 60~460、y 1150~1270(介面沒傳座標, 照 spec 版位寫死)。「金幣 N」(金)/「已排 N 張」 |
| TimelineSlot | `drawTimelineSlot(ctx, s)` | x, y, style, slot, card, target, selected, active, done | row(600×100): 左「5i~5i+5 秒」灰字、分隔線、卡圖示 + 卡名、點名頭像 + 種類名; 空的畫灰「—」; 有卡的列底色亮一階。selected: 黃粗框。mini(72×100): 上卡圖示、下點名小頭像; 空格只有一條灰短線; active: 底色亮 + 白粗框 + 頂端白小三角; done(非 active): 整格壓暗 55%、圖示 40%; active 且 done: 白框照畫、只壓暗 25% |
| CardFx | `drawCardFx(ctx, s)` | x, y, card, t, dur | 被點名魔物頭頂(中心上方 84px, 0.8 秒內再升 18px)一塊卡色膠囊: 卡圖示 + 白字「卡名!」+ 朝下尖角。前 15% 彈出、後 30% 淡出; t ≥ dur 自己不畫 |
| ShowArena | `drawShowArena(ctx)` | 無 | 上下觀眾席(130~250、1020~1140)、沙地場地(x 60~660、y 270~990, 圓角)、魔物活動邊界淡虛線(內縮 40)、中央圓、縮小節目表底(y 1152~1268) |
| ShowMonster | `drawShowMonster(ctx, s)` | x, y, species, level, rage, redLow, marks, markLeft, markDur, mode, performing, performT, performDur, fx, fxT, fxDur, chargeT, chargeDur, looseT, looseDur, dashing, dir | 見下方「表演場魔物」 |
| Fence | `drawFence(ctx, s)` | x, y, side, broken | 完好: 木欄 + 立柱。broken: 斷成左右兩截略傾、中間空洞 + 紅色裂口記號 |
| Visitor | `drawVisitor(ctx, s)` | x, y, side, mode | 座位永遠畫。watch: 彩色上衣小人(上衣色依 x 固定)、手放下。scared: 灰上衣、雙手舉高、張嘴、紅「!」、微斜抖動。empty: 只剩座位 + 虛線頭位 |
| ShopItem | `drawShopItem(ctx, s)` | x, y, item, cost, level, owned, equipped, affordable, selected | 左圖示(武器 / 劍加綠 + / 心 / 繩)、名稱、說明(spec 第 65 條)。強化 level>0 加「已買 N」。右側: 武器已擁有 → equipped 青「裝備中」膠囊, 否則「已擁有」; 其他 → 金幣 + 價格(買不起紅字)。equipped 整列青邊。selected: 黃粗框 |
| Button | `drawButton(ctx, s)` | x, y, w, h, label, selected | **x, y 為左上角**。未選: 暗青底白字; selected: 實心青底深字 + 黃粗框 |
| FloatText | `drawFloatText(ctx, s)` | x, y, text, kind, t, dur | 前 12% 彈出、後 40% 淡出; t ≥ dur 自己不畫。gold 22px 金字 + 金幣(上飄 40)、redGold 28px 金字紅描邊 + 金幣(上飄 50)、chain 30px 白字橘描邊 + 金幣(上飄 56)、repDown 24px 名聲色 + 星(**往下**飄 30)、capture 30px 綠字 + 打勾、levelUp 26px 青字 + 上箭頭、coin20 26px 金字 + 金幣、fizzle 22px 灰字左右抖、幾乎不飄 |
| ResultPanel | `drawResultPanel(ctx, s)` | rep, goldEarned, bestChain, roster, stars | 全畫面壓暗 + 中央面板: 「7 天結束」、3 顆星(stars 顆填金)、名聲 / 賺得金幣 / 最長連鎖 N 段、陣容頭像 + 「名 LvN」(最多 6)、黃「按 Z 重來」 |
| Hud | `drawHud(ctx, s)` | phase, day, dayMax, gold, rep, hearts, maxHearts, ropes, ropeMax, weapon, xCdLeft, xCdMax, timeLeft, timeMax, dungeon, message | y 0~120。第 1 列(y 24): 「第 d/7 天」、金幣、名聲、右側「N 秒」(≤10 秒變紅); timeMax>0 時 HUD 底線畫剩餘比例細條。第 2 列(只在 dungeon, y 60): 心(≤8 顆畫圖示, 超過畫 1 顆 + 「h/max」)、繩(≤5 條畫圖示, 超過同理)、武器圖示 + X 方塊(xCdMax=0 灰框; 冷卻中由下往上填青; 就緒實心青)、右側地下城名。訊息列: dungeon 在 y 96, 其他 phase 在 y 76, 置中; 含「站住」或「繞牠」的訊息放大成青字。**phase 為 guide / result 時整個不畫**(那兩頁的字在說明頁 / 結算面板裡) |
| 說明頁 | `drawGuidePage(ctx, s)` | page, x, y, w, h | 見第 8 節 |

### 表演場魔物(drawShowMonster)細節

版型(default 100×100, stone 120×120), 由上到下:
- **怒氣條** 90×12, 貼在框頂(y −49 起; 石像鬼 −59)。深底; redLow~100 常駐淡紅底段; 填色: <50 灰、50~redLow 琥珀、≥redLow 紅。白刻度 = 門檻 50, 紅刻度 = 紅區下限。marks>0 或失控時, 條外框白 / 黑閃爍(怒氣停在 100)。
- **失控標記**: 條下方一排紅三角, 0~4 個; 最後一個由上往下被壓暗 = 距下次自動 −1 還剩多少(markLeft/markDur, 亮的部分 = 剩餘時間)。mode 為 charge / loose 時不畫標記。
- **本體** r28(石像鬼 r34), 中心下移 10px(12px)把頭頂讓給怒氣條; 判定用的中心仍是 (x, y)。rage ≥ redLow 或失控、橫衝直撞時怒眉。
- **Lv**: 右下角黃字「LvN」。
- performing: 本體彈一下(最多 1.1 倍)+ 外擴光環(rage ≥ redLow 為金色, 否則白), 隨 performT 淡出。
- fx ignited: 本體兩側各兩朵**往上竄**的琥珀火舌; doused: 兩側各兩滴**往下滴**的淺藍水滴; 都在 fxT/fxDur 內淡出。
- mode: roam 無; rampage 身後兩道橘色 >>; rally 腳下綠虛線橢圓(正走向集合點); hold 腳下綠實心橢圓(被點名、原地不動); knock 本體傾斜 + 白撞擊星; charge 紅鋸齒外圈 + 本體蓋 25% 紅, chargeT>0(撞欄中)本體左右震; loose 同 charge 外觀 + 本體下方白弧 = 亂竄剩餘時間(1 − looseT/looseDur)。
- dashing: 身後白速度線; 雷鳥翅膀拍動加快。

## 6. 尺寸表

| 物件 | 尺寸(px) | 說明 |
|---|---|---|
| Tile | 60×60 | 填滿整格 |
| Tamer | 64×64 框; 身體圓 r17 + 描邊 = 判定 r18 | 武器與鼻尖在 r≤32 內 |
| WildMonster | default 90×90(本體 r30)、stone 110×110(本體 r38) | 血條在本體下 6px; 暈眩星在頭頂 |
| CaptureRing | 120×120(環 r42) | 字在環上方 |
| Lasso | 無框; 進度環 r54、時限環 r63(以魔物為圓心) | |
| Hazard | 火圈 / 落雷 = radius; 震波 = radius±15; 投射物本體圓 = radius(水彈 12、尖刺 10、鬼火 14) | 尾跡往後最多 3×radius |
| WeaponFx | 依 state 的 radius / length / width | |
| DungeonCard | 600×260 | |
| RosterCard | 300×200 | |
| PickerPanel | 480 × (80 + 70×行數), 行 480×70 | 左上 (120, 240) |
| SetupInfo | 400×120 | 左上 (60, 1150) |
| TimelineSlot | row 600×100、mini 72×100 | |
| CardFx | 無框; 膠囊高 40, 寬 ≈ 字寬 + 52, 中心在魔物上方 84~102px | |
| ShowMonster | default 100×100(本體 r28)、stone 120×120(本體 r34); 怒氣條 90×12 | |
| Fence | 100×16 | |
| Visitor | 60×90 | |
| ShopItem | 600×110 | |
| Button | 由 state 的 w×h | |
| 文字 | 最小 15px(魔物 Lv、準備捕捉), 一般 18~26px, 關鍵數字 28~52px | |

自測: 用會追蹤變換矩陣的假 ctx, 對每個有 `size` 的函式跑所有狀態組合(1596 次呼叫), 外接框全部在 `size` 內(誤差 ≤1px); save/restore 全部成對。

## 7. 判讀約定、時長常數、表外值

**判讀約定**(照 interface.json, 寫明以免 RD 判定和畫面差一個環寬):
- 火圈、落雷: `radius` = 實心圓外緣。
- 震波: `radius` = 環的中線, 畫面帶 = [radius − 15, radius + 15](環寬 30)。
- 投射物: `radius` = 判定半徑 = 畫面本體圓半徑; 尖刺的尖端畫到 1.0×radius。
- 馴獸師: 判定 r18 = 身體外緣(含描邊)。

**時長常數**(美術內用到的總長; 全部可由 state 傳入, 下列是沒傳時的預設):

| 效果 | 總長 | 來源 |
|---|---|---|
| CaptureRing | state.dur | 規格 0.8(水母加成縮短) |
| Lasso 時限 | state.limit | 規格 5 + 幽靈加成 |
| Hazard 預警 / 生效 | state.dur | 介面(火圈 0.5/0.5、落雷 0.8/0.2、震波 1、鬼火 3) |
| WeaponFx | state.dur | 規格 0.2 / 突進 0.25 |
| CardFx | state.dur, 沒傳用 0.8 | 規格 0.8; t ≥ dur 自己不畫 |
| FloatText | state.dur, 沒傳用 1 | 介面 1; t ≥ dur 自己不畫 |
| 表演 / fx | performDur、fxDur, 沒傳用 0.5 | 介面 |
| 標記遞減 | markDur, 沒傳用 4 | 規格 |
| 亂竄 | looseDur, 沒傳用 6 | 規格 |
| 擊暈 | stunDur, 沒傳用 2 | 規格 |
| 閃爍(blink)、選擇框呼吸、波紋 | 美術自訂, 用 `performance.now()` | 純視覺 |

**表外值**(傳了列舉以外的值會畫成什麼, 看到這些預設外觀就去查傳入值):
species → fire; dungeon → cave; Tile kind → floor; room → hall; weapon → club; Hazard kind → firering; phase → 投射物 fly、其他 active; shape → arc; card(TimelineSlot / CardFx)→ 空(畫「—」/ 不畫); ShowMonster mode → roam; fx → none; Visitor mode → watch; ShopItem item → attack; FloatText kind → gold; HUD phase → select; guide page → 夾在 0~4。數字欄位 NaN / 缺值當 0(或上表預設)。

## 8. 說明頁(drawGuidePage)

**分工偏離(請製作人確認)**: 任務單寫「說明頁只畫示意圖、文字歸 RD」, 但本輪不可更改的 interface.json `notes.文字歸屬` 寫「drawGuidePage 畫說明頁全部文字」「RD 不另外畫字」。依經驗文件(兩份衝突時照 RD 照著寫的介面), **說明頁的標題、標語、頁碼點、「按 Z 繼續 / 按 Z 開始」全部由美術畫, RD 請不要在說明頁另畫任何文字**。同理 phase = guide 時 drawHud 不畫任何東西。

- state `{ page, x, y, w, h }`, page 0~4。整頁以 720×1280 為參考版面, 等比縮放置中到 (x, y, w, h) 框內並裁切; RD 傳全畫布 `{x:0,y:0,w:720,h:1280}` 即可。函式自己會先畫背景。
- 版面: 頂部小字「怪獸節目表」、標題(46px)、黃色標語(guide.md 每頁「文字」)、示意圖區 y 220~1140、頁碼點 y 1170、「按 Z 繼續」(最後一頁「按 Z 開始」)y 1228。
- 示意圖全部呼叫遊戲內函式, 給規則上成立的 state:
  1. **地下城**: 洞窟一角; 馴獸師拿棍棒朝右(facing 2)敲中火蜥蜴(普攻扇形 + 閃白); 另一隻施法中的火蜥蜴腳下火圈預警(火圈以施放者為中心); 青色移動箭頭全程在火圈半徑外繞開。方向鍵鍵帽貼在移動箭頭旁、Z 鍵帽貼在揮擊旁。**偏離 guide**: 不在圖下方另列「方向鍵 / Z / X ↔ 走 / 攻擊 / 武器技」一排(標語已寫同一句; 棍棒沒有 X 技, 圖上也沒有可指的動作), 依經驗文件「說明頁按鍵只用鍵帽貼在動作旁」。
  2. **收服**: 左格 = 殘血水母(血條粉紅 + 裂心 + 汗滴, 未暈)身上站著馴獸師, 準備捕捉圈填一半; 箭頭 → 右格 = 被套住的水母(暈眩星)、套索、進度環一半、馴獸師沿虛線圓箭頭繞行。下方小框 = 「收服!」飄字 + 打勾。
  3. **排節目**: 上 = 節目表 9 列(縮 0.45): 5~10 秒 集合 水母、15~20 秒 激將 火蜥蜴, 其餘「—」, 游標在 20~25 秒的空列; 右側「點名誰?」面板(水母 / 火蜥蜴 / 雷鳥, 選中水母); 左下「開演」按鈕。箭頭「開演」→ 下 = 表演場縮圖: 水母原地(hold)頭上「集合!」, 火蜥蜴與雷鳥(rally)帶綠箭頭走向牠; 下方縮小節目表第 2 格(i=1)白框進行中、第 1 格壓暗已過(第 2 格的卡已發動, 依規則 done 也為 true, 只輕壓暗)。驗算見 guide.md(5.5~6.3 秒)。
  4. **紅區**: 上 = 火蜥蜴 Lv1(紅區下限 75)怒氣 90 正在表演(金色光環), 飛出「+4 ×2」紅區金幣; 「紅區」短標籤用紅括線直接框住怒氣條紅段。下 = 雷鳥怒氣 100、頭上 4 個標記(最後一個在倒數)→ 箭頭 → 同一隻 mode charge(紅鋸齒、無標記)撞上方觀眾席的圍欄, 一名觀眾嚇到; 下方紅色大叉。
  5. **目標**: 地下城 → 布置 → 表演 → 商店 四個節點繞一圈(順時針白箭頭), 中央「×7 天」; 表演節點旁名聲星往上疊; 下方箭頭 → 「結算」+ 3 顆星。

## 9. 繪製層級(照 interface.json, 美術這邊的假設)

- 地下城: drawBackground → drawTile × 全部 → drawHazard(預警 / 範圍)→ drawWildMonster → drawCaptureRing / drawLasso → drawTamer → drawHazard(投射物)→ drawWeaponFx → drawFloatText → drawHud。(地下城順序介面沒寫, 這是建議: 範圍技能壓在魔物下面才看得到魔物, 投射物壓在上面)
- 表演場: drawShowArena → drawHazard → drawShowMonster → drawCardFx → drawFence / drawVisitor → drawTimelineSlot(mini × 9)→ drawFloatText → drawHud。
- 布置第 2 步: drawBackground → drawTimelineSlot(row × 9)→ drawSetupInfo → drawButton(開演)→ drawPickerPanel(開著時, 會自己壓暗背後)→ drawHud。

## 10. 文字歸屬(美術已畫, RD 不要再畫)

照 interface.json `notes.文字歸屬` 全部由美術畫: 地下城卡名 / 魔物名 / 條件 / 已開放; 陣容卡名 / Lv / 上場; 面板標題 / 每行 name·cost·desc; 「金幣 N」「已排 N 張」; 節目大列的時段 / 卡名 / 魔物名與「—」; 卡名浮字; 商店名稱 / 說明 / 價格 / 已擁有 / 裝備中 / 已買 N; 按鈕 label; 飄字 text; 「準備捕捉」; 表演魔物「LvN」; 結算全部文字與「按 Z 重來」; HUD 天數 / 金幣 / 名聲 / 秒數 / 地下城名 / message; 說明頁全部文字。
