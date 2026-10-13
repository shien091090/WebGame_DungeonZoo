# 連鎖機關秀 — 美術規格(style.md)

RD 只讀這份。函式名、參數、state 欄位與 `interface.json` 一字不差。
**index.html 必須宣告 `<meta charset="utf-8">`**, 否則 art.js 裡的中文會變亂碼。用一般 `<script src="art/art.js">` 載入(非 module), 載入後用 `window.Art`。

## 1. 邏輯畫布尺寸

720 × 1280(直式)。`Art.canvas = { width: 720, height: 1280 }`。HUD 佔 y 0~120。

## 2. 色票表

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg | #14161c | 全畫面底色 |
| hudBg | #0d0f14 | HUD 底 |
| panel / panelHi | #1f232d / #2a303c | 卡片、面板、按鈕底 |
| text / textDim | #f2f2f2 / #9aa3b2 | 主字 / 次要字 |
| cursor(= player) | #2ee6c8 | **玩家這一側**: 馴獸師本體、選擇框、殘血可捕捉圈、捕捉 / 繞圈進度、武器技特效、被劍打回去的飛彈外框、X 冷卻好了 |
| gold | #f5b82e | 金幣(一律配圓形硬幣圖示) |
| rep | #ff8fd0 | 名聲(一律配星形圖示; 結算的評價星也是它) |
| rage | #ff3048 | 規則紅: 怒氣條紅區、失控標記、失控鋸齒外圈、破損圍欄、扣名聲、時限快到、繩快斷。**只畫在線、條、記號上, 不填魔物本體** |
| ignite | #ff7a1a | 升怒(戰鼓、火藥桶、魔物被點燃) |
| douse | #4ac8ff | 降怒(噴泉、水車、魔物被澆熄) |
| gongC | #e8c860 | 銅鑼聲波 / 連鎖 |
| rope | #d8b070 | 繩子、捕獸繩圖示 |
| ok | #5fd068 | 已開放、上場、已擁有 |
| heart | #ff4d6a | HUD 的心 |
| fire | #e8452a | 火蜥蜴本體與火圈(色相 9°, 灰階 115) |
| water | #3a78e0 | 水母本體與水彈(218°, 113) |
| thunder | #e8e030 | 雷鳥本體與落雷(57°, 206) |
| spike | #46b84a | 刺蝟本體與尖刺(122°, 137) |
| stone | #9a9488 | 石像鬼本體與震波(低彩度灰, 148) |
| ghost | #b060e0 | 幽靈本體與鬼火(278°, 135) |
| lava / pool | #d0501c / #2b5a7e | 熔岩、水地形 |

色彩張力(寫明讓製作人驗收):
- 火蜥蜴(9°)與雷鳥(57°)只差 48°, 落在相鄰色名; 不移色是因為兩邊都被主題綁住(火 = 紅、雷 = 黃)。補償: 灰階差 91(115 vs 206)、外形完全不同(長身 + 尾 vs 圓身 + 雙翼)、且兩者住不同地下城, 只在表演場同框。
- 規格的「紅區」紅(353°)與火蜥蜴紅(9°)相近: 規則紅只出現在怒氣條、標記、外圈線, 火蜥蜴紅只在本體與火圈實心面; 紅區條上另夾一條白細線, 靠明度分。
- 水母藍(218°)與降怒藍(198°)同一族色: 刻意的, 「水 = 讓對方冷靜」是同一個意義。火蜥蜴紅與升怒橘同理。

## 3. 形狀語言

扁平幾何 + 深色描邊; 能動的東西(魔物、馴獸師)有落影與眼睛, 場景(地格、場地)平塗無影; 「玩家這一側」一律青綠, 「規則危險」一律紅線, 種類只用本體顏色 + 剪影分。

## 4. 理念落實(成立理念)

- **P0 辨識度先於好看**: 六種魔物各一個剪影(長身帶尾 / 傘蓋觸手 / 雙翼尖喙 / 一圈尖刺 / 方塊帶角 / 波浪下襬), 縮小到選擇面板的 26px 仍可分。
- **P1 視覺權重跟著決策迫切度走**: 地下城裡最顯眼的是「殘血 = 青綠旋轉虛線圈」(玩家要決定撲上去抓)與技能預警; 地格壓暗、低彩度。
- **P2 規則上存在的東西畫面上就存在**: 觸發型機關(火藥桶、水車、銅鑼)把判定半徑 30 畫成靶圈; 野生魔物血條上標出 30% 殘血刻度; 怒氣條標出 50 門檻與紅區; 標記遞減計時畫成最後一顆標記外的細弧; 地下城走道地板比房間亮一階(魔物出不了房間)。
- **P3 一個意義一種長相**: 選擇框全遊戲同一個青綠粗框; 金幣 = 圓硬幣、名聲 = 粉星, HUD / 飄字 / 結算 / 說明頁共用; 升怒 = 橘 + 往上的火舌、降怒 = 藍 + 往下的水滴, 機關脈衝與魔物身上的被點燃 / 被澆熄共用; 預警 = 虛線框 + 由中心長大的填色, 填滿 = 生效。
- **P4 關鍵區分走兩條通道**: 升怒 / 降怒 = 顏色(橘 / 藍)+ 粒子方向(上 / 下); 可觸發 / 冷卻中 = 靶圈亮色 vs 灰 + 本體半透明 + 冷卻環; 打回去的飛彈 = 白本體 + 青綠虛線外圈(形狀多一圈)。
- **P7 每個元素都要掙得版面**: 表演場魔物不畫名字(本體已讀得出), 只留怒氣條、標記、右下小字 Lv; 機關不畫名字(選擇面板有寫)。
- **P9 以最混亂的那一刻驗收**: 失控魔物用全場唯一的紅鋸齒外圈, 四隻魔物 + 機關脈衝 + 技能同框時仍搶得到。
- **P13 事件要排隊**: 飄字只往上飄 40px、後 40% 淡出; 紅區與連鎖飄字有底框, 一般金幣沒有, 同時冒出時分得出主次(排隊本身由 RD 錯開位置)。
- **P15 回饋強度和份量成正比**: 飄字分四級 — 一般金幣 24px 無框 < 收服 / 等級 30 / 28px < 紅區 30px 紅框 < 連鎖 32px 金框。
- **P17 進度圖形與數字分工**: HUD 計時數字給秒數, 底下的條給整段比例(剩 10 秒轉紅); 套索的繞圈環(青綠)與時限環(外圈白細線)分兩圈, 時限剩 30% 轉紅。
- **P18 重要資訊不能只存在一瞬間**: 等級在布置卡、表演場 Lv、結算陣容都查得到; 最長連鎖留在結算。
- **P19 資訊貼著物件**: 「準備捕捉」字與進度環畫在魔物身上; 冷卻環長在機關外緣; 怒氣條與標記長在魔物頭頂。
- **P21 示意圖選分岔的例子**: 說明第 4 頁並排「怒氣滿但標記 2 → 還在表演 ✓」與「標記滿 5 → 失控 ✗」, 擋住「怒氣滿就失控」的錯誤理解。

## 5. 物件表

所有 x,y 為**物件中心**(畫面座標, 地下城已含 y +130); `drawButton` 例外為左上角。表外值(未知字串、undefined、NaN)會換成預設畫, 不拋錯; 預設值寫在各列「表外值」。

| 物件 | 函式 | state 欄位 | 各狀態的視覺 | 表外值 |
|---|---|---|---|---|
| 背景 | `drawBackground(ctx)` | 無 | 全畫面 #14161c | — |
| Tile | `drawTile(ctx, s)` | x, y, dungeon(cave/cliff/ruins), kind(wall/pillar/floor/lava/water), room(top/bottom/hall), nest | 三座地下城換地板 / 牆色(洞窟暖褐、雷鳴崖藍灰、遺跡沙黃)。wall 磚紋 + 頂亮邊; pillar 地板上的圓石柱; lava 橘底亮斑 + 黑裂縫; water 藍底波紋; hall 地板亮一階 + 兩點紋; nest 地板上一圈草編窩 | dungeon→cave, kind→floor, room→top |
| Tamer | `drawTamer(ctx, s)` | x, y, facing(0~7), weapon, dashing, blink, lassoing | 青綠圓身(半徑 18 = 判定圓)+ 頭 + 面向白三角, 武器握在面向側。dashing: 身後兩道青綠殘影 + 白描邊; blink: 以 12Hz 自行閃爍(半透明); lassoing: 背後一圈繩 | facing→0, weapon→club |
| WildMonster | `drawWildMonster(ctx, s)` | x, y, species, hp, maxHp, hit, weak, stunLeft, stunDur, lassoed, casting, dashing, dir | 種類剪影 + 底部血條(白, 30% 處紅刻度)。hit: 整隻白; weak: 青綠旋轉虛線圈 + 血條轉青綠; stunLeft>0 或 lassoed: 頭頂 3 顆黃星繞圈; lassoed: 身上再綁一圈繩; casting: 種類色外圈閃爍; dashing(雷鳥): 身後速度線; dir: 左右翻面 | species→fire |
| CaptureRing | `drawCaptureRing(ctx, s)` | x, y, t, dur | 魔物外一圈深色底環 + 青綠進度弧(從 12 點順時針, t/dur); 下緣深底小牌「準備捕捉」 | — |
| Lasso | `drawLasso(ctx, s)` | x1, y1, x2, y2, progress, t, limit, len, maxLen | 繩: len/maxLen < 0.7 時下垂, > 0.8 拉直、轉紅虛線(快斷)。魔物外半徑 52 青綠繞圈進度環(progress); 半徑 60 白細環 = 剩餘時限(1 − t/limit), 剩 30% 轉紅 | — |
| Hazard | `drawHazard(ctx, s)` | x, y, kind, phase, radius, t, dur, angle, reflected | firering / thunder: warn = 虛線外框(半徑 radius)+ 由中心長到 radius 的淡填色(t/dur, 滿 = 生效); active = 實心種類色 + 火舌 / 閃電與白閃光, 隨 t/dur 變淡。quake: 環帶 [radius−15, radius+15] 實心 + 裂紋。waterball / spike / wisp(fly): 種類色實體, 外緣 = 判定半徑; 尖刺朝 angle; 鬼火身後有尾巴, dur>0 時最後 20% 淡出。reflected: 本體換白 + 青綠虛線外圈 | kind→firering, phase→active |
| WeaponFx | `drawWeaponFx(ctx, s)` | x, y, weapon, move, shape, angle, spread, radius, length, width, t, dur | normal 白、skill 青綠。arc: 扇形淡填 + 前緣掃過; circle: 整圈環; line: 長方形 + 刺出的線; dash: 沿路徑的殘影。劍 skill 扇內加星(擊暈), 鞭 skill 扇緣加外推箭頭(擊飛)。隨 t/dur 淡出 | shape→arc, weapon→club |
| DungeonCard | `drawDungeonCard(ctx, s)` | x, y, dungeon, open, condition, selected | 卡底用該地下城色; 左上名稱、右側兩種魔物圖 + 名字。open: 綠色「已開放」膠囊; 未開放: 卡變暗、魔物半透明、鎖頭 +「未開放」, 下方金色 condition 字串。selected: 青綠粗框 + 左側三角 | dungeon→cave |
| RosterCard | `drawRosterCard(ctx, s)` | x, y, species, level, picked, selected | 左魔物圖, 右種類名、「Lv N」、3 顆等級點。picked: 卡底轉綠、綠框、綠色「上場」膠囊。selected: 青綠粗框 | species→fire |
| SetupCell | `drawSetupCell(ctx, s)` | x, y, selected | 白色淡虛線框; selected: 青綠淡底 + 青綠粗框 | — |
| PickerPanel | `drawPickerPanel(ctx, s)` | options[{type,key,name,cost,desc,affordable}], index | x 120~600, 標題列 y 240~320 寫「要放什麼?」; 每行 70 高: 左圖示(魔物圖 / 機關圖 / 清空 = 圓圈叉), name, desc(小字), 機關右側硬幣 + cost。affordable=false: 整行 40% 透明、價格轉紅。index 那行: 青綠淡底 + 粗框 | type→clear |
| SetupInfo | `drawSetupInfo(ctx, s)` | gold, placed, picked | 固定畫在 x 60~460、y 1150~1270(不讀 x,y): 「金幣 N」、「已擺 placed / picked」+ picked 顆點(已擺的亮綠); 全擺完字轉綠 | — |
| Gadget | `drawGadget(ctx, s)` | x, y, kind, armed, cdLeft, cdDur, fired | 戰鼓 / 噴泉 / 肉塊: 只有本體。火藥桶 / 水車 / 銅鑼: 本體 + 判定半徑 30 的虛線靶圈(火藥桶橘、水車藍、銅鑼金)。armed=false: 本體半透明、靶圈轉灰、外緣 r35 冷卻環(已恢復段用效果色, 剩餘段深色)。fired: 戰鼓鼓棒落下 + 鼓面下壓; 噴泉水柱變高; 火藥桶白芯爆光; 水車轉動 + 濺水; 銅鑼抖動 + 兩側聲紋 | kind→drum |
| GadgetPulse | `drawGadgetPulse(ctx, s)` | x, y, kind, radius, t, dur | 作用範圍虛線圈(radius)全程可見 + 極淡填色; 升怒(戰鼓、火藥桶)= 橘環外擴 + 往上火舌點; 降怒(噴泉、水車)= 藍環外擴 + 水滴點; 銅鑼 = 三道金色聲波環。肉塊不畫 | kind→drum |
| ShowArena | `drawShowArena(ctx)` | 無 | y 120 以下全底; 上下觀眾席(130~250、1020~1140)階梯紋; 場地 x 60~660、y 270~990 沙地 + 框 | — |
| ShowMonster | `drawShowMonster(ctx, s)` | x, y, species, level, rage, redLow, marks, markLeft, markDur, mode, performing, performT, performDur, fx, fxT, fxDur, chargeT, chargeDur, looseT, looseDur, dashing, dir | 頂部怒氣條(見尺寸表): 底黑, redLow~100 紅框 + 淡紅底, 50 處白刻度; 填色 <50 灰藍、50~紅區下限米白、紅區內紅 + 白芯。條下 5 格標記列: 紅菱 = 已有標記, 灰點 = 空, 第 5 格紅圈 = 「滿就失控」; 最後一顆紅菱外細白弧 = markLeft/markDur。performing: 種類淺色環外擴 + 本體上跳。fx ignited: 橘火舌往上 + 橘外圈; doused: 藍水滴往下 + 藍外圈(fxT/fxDur 淡出)。mode charge / loose: 紅鋸齒外圈 + 5 格標記全亮; charge 且 chargeT>0: 抖動 + 紅弧 = 撞欄進度; loose: 白弧 = 剩餘亂竄時間。右下「LvN」 | species→fire, mode→roam, fx→none |
| Fence | `drawFence(ctx, s)` | x, y, side, broken | 完好: 兩條橫木 + 4 根柱; broken: 中間斷開、只剩兩端, 斷口兩道紅裂線 | — |
| Visitor | `drawVisitor(ctx, s)` | x, y, side, mode | 座位常駐。watch: 坐著的觀眾(衣色依 x 固定); scared: 傾斜、舉手、往外側偏, 頭旁紅「!」; empty: 只剩座位 | mode→watch |
| ShopItem | `drawShopItem(ctx, s)` | x, y, item, cost, level, owned, equipped, affordable, selected | 左圖示(武器圖 / 劍 +1 / 心 +1 / 繩 +1), 名稱, 說明(第 60 條原句)。右: equipped = 青綠「裝備中」膠囊; 武器 owned(棍棒一律視為已擁有)= 綠「已擁有」; 否則硬幣 + 價格(買不起轉紅、整項變暗)。強化項多一行「已買 N」(level)。selected: 青綠粗框 | item→club |
| Button | `drawButton(ctx, s)` | x, y(左上角), w, h, label, selected | 圓角按鈕 + 置中 label; selected: 底轉深青 + 青綠粗框 | — |
| FloatText | `drawFloatText(ctx, s)` | x, y, text, kind, t, dur | 由 y 往上飄 40px, 後 40% 淡出, t≥dur 透明。gold 金字 + 硬幣; redGold 大一號 + 紅框底牌; chain 白字 + 金框底牌; repDown 紅字 + 粉星; capture 青綠字 + 勾; levelUp 綠字 + 上箭頭; coin20 金字 + 硬幣 | kind→gold |
| ResultPanel | `drawResultPanel(ctx, s)` | rep, goldEarned, bestChain, roster[{species,level}], stars | 全畫面: 「七天巡演結束」、3 顆粉星(亮 stars 顆)與星級字、總名聲 / 累計金幣 / 最長連鎖三列、陣容圖 + Lv、「按 Z 重來」 | — |
| HUD | `drawHud(ctx, s)` | phase, day, dayMax, gold, rep, hearts, maxHearts, ropes, ropeMax, weapon, xCdLeft, xCdMax, timeLeft, timeMax, dungeon, message | y 0~120。phase guide / result **不畫**。第一列: 「第 d/7 天」、硬幣 + 金幣、粉星 + 名聲、中央標題(地下城名或畫面名)、timeMax>0 時右上秒數 + 比例條(≤10 秒轉紅)。dungeon 再畫第二列: 心(實 / 空)、繩圖示(實 / 空)、武器圖 + 名稱、xCdMax>0 時 X 圓鈕(冷卻中扇形填充, 好了轉實心青綠)。最下 y 93~117 訊息列畫 message | phase→select |
| 說明頁 | `drawGuidePage(ctx, s)` | page(0~4), x, y, w, h | 見第 8 節 | page 夾到 0~4 |

### 畫面文字歸屬(interface.json「文字歸屬」照做)

所有畫面文字都由美術畫, RD 不另外畫字, 包括: HUD 的 message 字串、地下城卡的條件與「已開放 / 未開放」、面板標題「要放什麼?」、「上場」、「Lv N」、「已擁有 / 裝備中 / 已買 N」、「準備捕捉」、結算的「按 Z 重來」, 以及**說明頁的標題、說明文字、頁碼點與「按 Z 繼續 / 按 Z 開始」**。

## 6. 尺寸表

| 物件 | 尺寸(以 x,y 為中心) | 內部配置 |
|---|---|---|
| Tile | 60 × 60 | 石柱圓半徑 27 |
| Tamer | 64 × 64 | 身體圓半徑 18 = 判定半徑; 武器 + 面向三角在 32 內 |
| WildMonster | 90 × 90(石像鬼 110 × 110) | 本體半徑 34(石 43); 殘血虛線圈半徑 41(石 50); 血條在下緣 y+38~+44(石 +48~+54), 寬 = 本體半徑 × 1.6 |
| CaptureRing | 120 × 120 | 進度環半徑 42、線寬 6; 字牌 y+45~+60 |
| Lasso | 無框 | 繞圈環半徑 52、時限環半徑 60(以 x2,y2 為中心) |
| Hazard | 無框 | 火圈 / 落雷: 外緣 = radius; 震波: 判定帶 [radius−15, radius+15]; 投射物: 外緣 = radius(判定半徑) |
| DungeonCard | 600 × 260 | |
| RosterCard | 300 × 200 | 魔物圖半徑 48(石 52) |
| SetupCell | 200 × 180 | 框內縮 4 |
| PickerPanel | 480 × (80 + 70 × 選項數), 固定 x 120、y 240 起 | 每行 70 |
| SetupInfo | 400 × 120, 固定 x 60~460、y 1150~1270 | |
| Gadget | 80 × 80 | 本體與靶圈在半徑 30 內; 冷卻環半徑 35 |
| GadgetPulse | 無框 | 範圍虛線圈 = radius |
| ShowMonster | 100 × 100(石像鬼 120 × 120) | 怒氣條 90 × 12 在框頂(中心 y−44, 石 y−54); 標記列在條下 15px; 本體中心 y+7(石 y+10), 半徑 29(石 36); Lv 字右下角 |
| Fence | 100 × 16 | |
| Visitor | 60 × 90 | 座位 y+20~+42 |
| ShopItem | 600 × 110 | |
| Button | w × h(左上角 x,y) | |

以上框都用會追蹤變換矩陣的假 ctx 對所有狀態組合跑過, 外接框都在框內 2px 以內。

### 判讀約定(請 RD 照這個算判定)

- 震波 `radius` = **環的中線**(照 interface.json), 判定帶 = [radius − 15, radius + 15]。
- 投射物、火圈、落雷 `radius` = 外緣 = 判定半徑。
- 觸發型機關靶圈半徑 30 = 機關判定半徑。

### 時長常數

| 效果 | 總長 | 來源 |
|---|---|---|
| 預警填色 | 以 state 的 t/dur 換算 | 規格(RD 傳) |
| 準備捕捉環 | t/dur | 規格 |
| 冷卻環 | cdLeft/cdDur | 規格 |
| 飄字 | t/dur(建議 1) | interface |
| 機關脈衝 | t/dur(0.4) | interface |
| 馴獸師 blink 閃爍頻率 | 12Hz, 讀系統時間 | 美術自訂(RD 只要在無敵期間傳 blink=true) |
| 暈眩星、殘血虛線旋轉 | 讀系統時間 | 美術自訂, 純動態 |

## 7. 繪製層級(由下到上, 建議 RD 照這個順序呼叫)

地下城: drawBackground → drawTile(全部)→ drawHazard 中的 warn 與 quake → drawLasso → drawWildMonster → drawCaptureRing → drawTamer → drawWeaponFx → drawHazard 中的 active / fly → drawFloatText → drawHud。
表演 / 布置第 2 步: drawBackground → drawShowArena → drawVisitor → drawFence → drawSetupCell(布置時)→ drawGadgetPulse → drawGadget → drawHazard → drawShowMonster → drawFloatText → drawPickerPanel / drawSetupInfo / drawButton → drawHud。

## 8. 說明頁(drawGuidePage)

state `{ page, x, y, w, h }`, 只畫在框內(會先 clip)。框內由上而下: 頁標題(青綠)→ 說明文字(guide.md 的「文字」)→ 示意圖 → 頁碼點 → 「按 Z 繼續」(最後一頁「按 Z 開始」)。建議 RD 傳整個畫布 `{x:0, y:0, w:720, h:1280}`, 並且該畫面不呼叫 drawHud(phase guide 時 drawHud 本來就不畫)。

**與任務分工的偏離(請製作人驗收)**: 本輪任務單寫「說明頁的標題、說明文字、頁碼、翻頁提示由 RD 畫, 美術只畫示意圖」, 但 `interface.json`(不可更改, RD 照它寫)的 notes 寫「drawGuidePage 畫說明頁全部文字」「RD 不另外畫字」, 而且沒給示意圖框的位置。兩份衝突時照 interface.json 做, 因為 RD 是照它寫的: 兩邊都不畫字最糟(說明頁一片空白), 照 interface 至少有一方畫。**RD 請不要在說明頁另畫任何文字。**

各頁示意圖(全部呼叫遊戲內畫法並給規則上成立的 state):
1. 地下城: 洞窟一角; 馴獸師面向右、棍棒扇形敲中閃白的火蜥蜴(距離 62 < 半徑 70); 右上另一隻火蜥蜴施放中, 火圈預警(虛線框 + 長到一半的填色); 青綠虛線箭頭從馴獸師繞過火圈外。鍵帽貼在動作旁: 「方向鍵」在箭頭起點、「Z」在扇形下方標「攻擊」、「X」在馴獸師手邊標「武器技」。**偏離 guide**: 沒有排成一列「方向鍵 / Z / X ↔ 走 / 攻擊 / 武器技」, 因為說明文字已寫同一句, 改成貼在物件旁的鍵帽(經驗「guide 的圖要示意把整頁當一張圖」)。
2. 收服: 左格 ①: 馴獸師站在殘血水母上(中心距 25 ≤ 40), 準備捕捉環填一半。右格 ②: 套索連著頭上冒星的水母(繩長 100 < 220), 馴獸師在牠正下方, 青綠繞圈進度環一半、虛線繞圈路徑 + 實線箭頭指出往哪繞。下方小圖: 進度環滿 + 勾 + 淡掉的水母 +「收服!」。
3. 布置: 上方縮小 0.5 的布置第 2 步實際畫面(3×4 格、火蜥蜴 / 水母 / 刺蝟各一格、戰鼓一格、右下空格是游標、選擇面板列出雷鳥 / 火藥桶 / 買不起的銅鑼、下方資訊列「已擺 3 / 4」、「開演」鈕); 往下箭頭; 下方 0.3 縮圖: 開演後戰鼓脈衝、火蜥蜴放火圈表演、水母被點燃。
4. 紅區: 上: 雷鳥怒氣 88 在紅區(下限 75)表演, 頭上「+14 ×2」紅框飄字; 右側放大 2.4 倍的怒氣條標「紅區」「50」。下左: 火蜥蜴怒氣 100、標記 2 →「還在表演 ✓」; 箭頭「再升怒」; 下右: 失控(標記滿)撞破圍欄, 前方觀眾嚇跑、紅叉、「名聲 −3」。
5. 目標: 四節點環「地下城 → 布置 → 表演 → 商店」, 中央「×7 天」; 表演旁三顆粉星往上 +「+名聲」; 虛線從表演拉到下方「結算」三顆粉星, 標「第 7 天後」。

## 9. 本作沒有獨立函式的 spec 物件

無。spec 物件清單 22 項全部對應 interface.json 的函式。另加 `drawGuidePage`(探索 / 深掘說明頁)。
