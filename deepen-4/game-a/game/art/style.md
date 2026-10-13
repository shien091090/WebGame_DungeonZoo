# 怪獸夜場節目單 — 美術規格(style.md)

RD 只讀這份。`index.html` 必須宣告 `<meta charset="utf-8">`(art.js 內有中文字串)。`art.js` 以一般 `<script>` 載入, 掛在 `window.Art`。

## 邏輯畫布尺寸

1280 × 720(`Art.canvas = { width: 1280, height: 720 }`)。所有座標皆為畫面座標; 地下城物件已含偏移 (40, 110)。

## 色票表

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg / bg2 | #151225 / #1d1833 | 一般畫面底(選擇、布置、商店、結算) |
| panel / panelHi / line | #262040 / #342c56 / #4d4478 | 面板底 / 亮一階的面板 / 分隔線、一般外框 |
| text / textDim | #f4f0ff / #a79fc4 | 主要文字 / 次要文字 |
| outline | #140f20 | 所有物件與文字的深色外描(壓在任何底色上都讀得到) |
| select | #ffe14a | 選擇框 / 游標 / 進行中時段(只用在外框線) |
| gold | #ffd23f | 金幣、進度環(準備捕捉、繞圈)、武器技特效 |
| rep | #ff9ad5 | 名聲星 |
| danger | #ff3b4e | 危險: 傷害地形外框、魔物施法預備、怒氣紅區、失控、破欄 |
| ignite | #ff7a2a | 點燃型(升怒)技能邊線、被點燃反應、彩帶砲、紅氣球 |
| douse | #38a8ff | 澆熄型(降怒)技能邊線、被澆熄反應、灑水車、藍氣球 |
| player | #ffffff | 馴獸師的 Z 普攻特效 |
| ok | #5ee08a | 已開放、上場、裝備中、收服 |
| spore 菇菇球 | #d65ce0 | H295 / 灰階 144 |
| frog 露水蛙 | #4fd05a | H125 / 灰階 156 |
| mole 鑽沙鼴 | #c8783a | H26 / 灰階 137 |
| tumble 風滾草 | #e8cf4a | H51 / 灰階 199 |
| butterfly 冰晶蝶 | #5ad8f0 | H190 / 灰階 181 |
| crab 礦石蟹 | #7a7cf0 | H239 / 灰階 137 |
| rageLow / rageMid / redZone | #7d8fb8 / #ffb03a / #ff3b4e | 怒氣條 < 50 / 50~紅區下限 / 紅區 |

色彩張力(寫明給製作人驗收):
- 六種魔物把色輪排滿, 鑽沙鼴(26°)與點燃色(23°)同色名, 風滾草(51°)與金色(46°)同色名。**種類的主通道是剪影**(蘑菇、蛙、鼴鼠、草球、蝶、蟹完全不同形), 顏色只是第二通道。點燃色只出現在線(技能邊線)與往上竄的火焰形; 金色只出現在 UI 線與環, 從不填在魔物本體上。最差組合 = 「被點燃的鑽沙鼴」: 火焰帶深色外描 + 黃芯 + 往上飄, 本體是實心面, 靠形狀與方向分開。
- 技能範圍的填色 = 施放者的種類色(哪隻放的); 邊線 = 點燃色或澆熄色(升怒或降怒)。地下城裡所有技能都會傷人, 危險靠「範圍本身」表達; 表演場上邊線顏色告訴玩家這招是點火還是滅火。

## 形狀語言

圓角、扁平填色、全物件 2~3px 深色外描; 魔物是側面剪影 + 大眼, 介面是圓角面板; **會傷人的 = 實心面 / 虛線預警**, **玩家打出去的 = 白色(或金色)細前緣 + 極淡填色**; 點名卡 = 圓形徽章, 不點名卡 = 圓角方形徽章。

## 理念落實

- P0 辨識度先於好看: 六種魔物用六種完全不同的剪影, 縮到節目表 34px 小頭像也認得出; 每個物件都帶深色外描, 不靠背景剛好對比。
- P1 視覺權重跟著決策迫切度走: 地下城裡最亮的是技能預警與殘血魔物的碎心 + 準備捕捉金環; 地板、牆、巢穴都壓在低對比; 表演場的轉盤平常只有 7% 填色, 不搶魔物與怒氣條。
- P2 規則上存在的東西畫面上就存在: 殘血門檻在血條 30% 處有白刻度; 表演門檻 50 與紅區下限都在怒氣條上標出; 套索時限畫成細環倒數; 「沒反應」、破欄、空位、已發動時段都有獨立外觀; 灑水車整條車道以淡虛線標出。所有判定範圍的畫面邊緣等於判定邊緣(見判讀約定)。
- P3 一個意義一種長相: 「虛線外框 + 由內長大的填色, 填滿 = 生效」只用在預警(魔物技能、彩帶砲落點、氣球落點); 金色環只代表「你正在累積的進度」(準備捕捉、繞圈); 點燃 = 橙 + 往上、澆熄 = 藍 + 往下, 從技能邊線到卡片徽章到身上反應都一樣。
- P4 關鍵區分走兩條通道: 敵方技能(種類色實心面 + 粗邊)vs 玩家攻擊(白 / 金細前緣 + 極淡面); 點燃 vs 澆熄(橙 / 藍 + 往上竄的火 / 往下滴的水); 點名卡 vs 不點名卡(圓 / 方 + 列上寫魔物名 / 寫「全場」)。
- P7 每個元素都要掙得版面: 魔物身上不寫名字(剪影就是名字); 布置資訊列只寫兩個數字; 說明頁圖內不配動作名稱(鍵帽貼在物件旁)。
- P9 以最混亂的一刻驗收: 怒氣條、失控標記、Lv 都帶深底板或深描邊, 疊在技能範圍與別隻魔物上仍讀得到; 技能範圍填色只有 12%(預警)~50%(生效), 魔物不會被蓋掉。
- P13 事件要排隊: 卡名浮字掛在目標頭上 120px(怒氣條與標記之上), 不點名卡固定在畫面上方中央, 兩者不同帶; 飄字自己往上飄並淡出。
- P15 回饋強度和事件份量成正比: 一般金幣飄字 20px 金、紅區 26px 紅金、連鎖 26px 紫; 收服 28px 綠為最大; 「沒反應」18px 灰最小。
- P17 進度圖形與數字分工: HUD 只給剩餘秒數數字 + 小圓餅; 準備捕捉 / 繞圈只用環(沒有數字); 失控標記用可數的菱形, 下方細線畫「到下次自動 −1 還剩多久」。
- P18 重要資訊不只存在一瞬間: 收服的結果留在布置卡的 Lv 與結算陣容; 卡發動後縮小節目表該格變暗留存。
- P19 資訊貼著物件: 怒氣條、標記、Lv、碎心、暈眩星、準備捕捉字樣全部長在魔物身上; 點名卡的卡名冒在目標頭上。
- P21 示意圖選分岔例子: 第 4 頁並排「4 個標記仍在場上」與「標記消失、衝向圍欄 ✕」, 讓「滿 5 才失控、失控後不再顯示標記」一眼可見; 第 1 頁移動箭頭明確穿出預警圈外緣。

## 繪製層級

照 interface.json notes 的「繪製順序」。美術額外約定: 說明頁階段 `drawHud` 什麼都不畫(phase = guide 直接 return), 說明頁的文字全歸 RD。

## 物件表

所有 x, y 皆為物件中心(例外: drawButton 為左上角)。表外值一律換成預設, 不拋錯(預設寫在括號)。

| 物件 | 函式 | state 欄位 | 各狀態視覺 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | — | 深紫底 + 中央微光, 全畫面 |
| 地下城格 | `drawTile(ctx, s)` | x, y, dungeon(forest), kind(floor), room(hall), nest | wall: 深色磚塊 + 亮頂; pillar: 地板上的圓角石柱 + 影; floor: 地板(走道 hall 比房間亮一階); hurt: 紅色淡底 + 紅虛線框 + 仙人掌(沙丘)/ 冰錐(礦坑); slow: 泥沼(菇菇林)/ 鬆沙波紋(沙丘)/ 冰面亮線(礦坑), 填滿整格; nest = true: 一圈綠 / 金 / 冰藍枝葉環 |
| 馴獸師 | `drawTamer(ctx, s)` | x, y, facing(0), weapon(club), dashing, blink, lassoing | 白外套藍帽小人, 武器指向 facing 方向(朝上時畫在身後); dashing: 淡藍殘影 + 淡藍外圈; blink: 以 12Hz 閃爍半透明; lassoing: 腰間繩圈變亮黃 |
| 野生魔物 | `drawWildMonster(ctx, s)` | x, y, species(spore), hp, maxHp, hit, weak, stunLeft, stunDur, lassoed, casting, move(walk), moveT, moveDur, dir | 種類剪影, dir = −1 時左右翻; 底部血條(30% 處白刻度, ≤30% 變粉紅); hit: 全身白; weak: 右上碎心; stunLeft > 0 或 lassoed: 頭上三顆旋轉黃星; lassoed: 身上一圈繩; casting: 紅虛線外圈閃爍; jump: 身體縮小抬起、影子留地上; burrow: 只畫土堆(位置清楚, 血條半透明); roll: 草球內紋旋轉 |
| 準備捕捉 | `drawCaptureRing(ctx, s)` | x, y, t, dur | 半徑 38 的金色進度環(t/dur, 自 12 點順時針)+ 頭上「準備捕捉」 |
| 套索 | `drawLasso(ctx, s)` | x1, y1, x2, y2, progress, t, limit, len, maxLen | 繩子: len/maxLen < 0.8 時下垂, > 0.85 變粗並紅白閃(快斷); 被套魔物周圍半徑 52 金色繞圈進度環; 內側半徑 44 白細環 = 剩餘時限, 剩 ≤ 1.5 秒變紅 |
| 技能 | `drawHazard(ctx, s)` | x, y, kind(spore), phase, radius, angle, spread, length, width, t, dur, reflected | warn: 種類色 12% 底 + 由內長大的 38% 填色(t/dur, 填滿 = 生效)+ 虛線邊; active: 種類色 50% 實心 + 實線邊 + 紋樣(孢子點 / 冰晶 / 地刺 / 爪痕); fly: 水泡(藍球 + 方向箭頭)/ 旋風(旋轉弧 + 方向箭頭); reflected: 填白、邊金 |
| 武器特效 | `drawWeaponFx(ctx, s)` | x, y, weapon, move, shape(arc), angle, spread, radius, length, width, t, dur | normal 白、skill 金; arc: 扇形淡填 + 外緣粗弧 + 掃過的線; circle: 整圈; line: 長方形 + 前端粗線; dash: 由淡到濃的軌跡帶 + 三條速度線; 隨 t/dur 淡出 |
| 地下城卡 | `drawDungeonCard(ctx, s)` | x, y, dungeon, open, condition, selected | 名稱、該地主題縮圖 + 兩種魔物頭像與名字; open: 綠色「已開放」膠囊; 未開放: 縮圖變暗 + 鎖頭 + condition(含「+」時拆兩行); selected: 7px 黃框 + 底部小三角 |
| 魔物卡 | `drawRosterCard(ctx, s)` | x, y, species, level, picked, selected | 頭像、名字、「Lv N」; picked: 綠底 + 綠框 + 「上場」膠囊; 未選: 整張略暗; selected: 6px 黃框 |
| 節目表時段 | `drawTimelineSlot(ctx, s)` | x, y, style(row), slot, card, target, selected, active, done | row: 「5i~5i+5 秒」| 卡徽章 + 卡名 | 點名卡: 頭像 + 魔物名(未點名畫「—」)/ 不點名卡: 「全場」; 空: 「—」較暗; selected: 黃框 + 左側三角。mini: 點名卡 = 卡徽章 + 小頭像, 不點名卡 = 置中卡徽章, 空 = 只有框; active: 黃框; done: 蓋 65% 暗 |
| 選擇面板 | `drawPickerPanel(ctx, s)` | layer(card), options, index | 固定 x 760~1220、y 60 起; 標題「放哪張卡?」/「點名誰?」; 卡行 = 徽章 + 名稱 + 說明, 魔物行 = 頭像 + 名稱, 清空行 = 灰 ✕ + 名稱; 選中行黃框 |
| 布置資訊列 | `drawSetupInfo(ctx, s)` | x, y, gold, cards | 「金幣 N」「已排 N 段」; 未傳 x, y 時用 (990, 670) |
| 卡發動浮字 | `drawCardFx(ctx, s)` | x, y, card, t, dur | 深底膠囊 + 卡徽章 + 「卡名!」, 外框用卡色; 點名卡畫在 (x, y − 120)(目標怒氣條與標記之上), 不點名卡畫在 (x, y) 且字較大; 0.12 秒彈出、最後 25% 淡出, t ≥ dur 不畫 |
| 舞台裝置 | `drawStageDevice(ctx, s)` | x, y, device(spin), active, t, dur | confettiL / R: 斜放的彩帶砲朝場內, active 時後座 + 亮橙 + 砲口彩紙; sprinkler: 虛線停車格 + 停著的灑水車, active 時停車格變空(藍虛線); spin: 地板轉盤(半徑 178 外框 + 8 條輻線)平常 7% 淡, active 時變亮、輻線逆時針轉、三支白箭頭 |
| 裝置特效 | `drawDeviceFx(ctx, s)` | x, y, kind(confettiWarn), radius, color, t, dur | confettiWarn / balloonWarn: 預警字典(虛線圈 + 由內長大的填色 + 十字準星), 彩帶 = 點燃橙, 氣球依 color 紅(橙)/ 藍; balloonWarn 另畫從上方掉下的氣球與漸大的落影; confettiBurst / balloonBurst: 實心圈 + 彩紙往外飛並淡出; sprinkler: 整條車道淡藍虛線 + 已開過那段極淡藍 + 車身 + 上下 ±radius 的水簾 |
| 表演場 | `drawShowArena(ctx)` | — | 全畫面: 上下觀眾席(y 50~146、566~666)、場地 x 60~1220 y 146~566(木地板 + 金色邊燈)、最下方縮小節目表暗帶 y 666~720 |
| 表演場魔物 | `drawShowMonster(ctx, s)` | x, y, species, level, rage, redLow, marks, markLeft, markDur, mode(roam), performing, performT, performDur, fx(none), fxT, fxDur, chargeT, chargeDur, looseT, looseDur, move, moveT, moveDur, dir | 本體同野生魔物; 頭上怒氣條(見下); 左下「Lv N」; performing: 種類色外擴環 + 本體輕微放大; fx ignited: 三團往上竄的橙火, doused: 三滴往下掉的藍水(0.5 秒淡出); rampage: 身後橙色速度線; rally: 前方兩個金色 » ; hold: 身旁金色小旗(集合點); spin: 身周兩道淡紫旋轉弧; knock: 身體傾斜 + 側邊白色衝擊星; charge / loose: 紅色脈動底圈 + 紅框, 怒氣條紅白閃, 條下白細線 = charge 撞欄進度(chargeT/chargeDur)/ loose 剩餘亂竄時間; charge 撞欄中(chargeT > 0)身體抖動 |
| 怒氣條(ShowMonster 內) | — | rage, redLow, marks, markLeft, markDur | 90×12, 中心 (x, y − 箱高/2 − 10); 紅區段底色淡紅, redLow 處紅刻度、50 處白刻度; 填色 < 50 灰藍、50~紅區下限 橙、紅區 紅; marks 1~4: 條上方 4 格菱形(紅實心 = 已有), 下方白細線 = markLeft/markDur; marks 0 不畫菱形 |
| 圍欄 | `drawFence(ctx, s)` | x, y, side, broken | 完好: 兩道木欄 + 4 根柱; broken: 中段斷開、斷口紅虛線 + 紅 ✕ |
| 觀眾 | `drawVisitor(ctx, s)` | x, y, side, mode(watch) | 座椅常駐; watch: 笑臉 + 舉黃色螢光棒; scared: 臉發青、雙手舉高、抖動 + 紅色驚嘆記號; empty: 只有空椅 |
| 商店項目 | `drawShopItem(ctx, s)` | x, y, item(club), cost, level, owned, equipped, affordable, selected | 左圖示(武器圖 / 強化圖 / 卡徽章)、名稱、說明(最多兩行)、強化另寫「已買 N」; 右側: 未擁有 = 金幣 + 價格(買不起時價格灰、整格略暗), 已擁有 = 「已擁有」, 裝備中 = 綠色「裝備中」膠囊 + 綠底; 棍棒一律視為已擁有; selected: 黃框 |
| 按鈕 | `drawButton(ctx, s)` | x, y, w, h, label, selected | 圓角按鈕 + label; selected: 金底白框深字 |
| 飄字 | `drawFloatText(ctx, s)` | x, y, text, kind(gold), t, dur | 1 秒內上飄 40px、最後 30% 淡出; gold / coin20 金 + 金幣圖、redGold 26px 紅 + 金幣圖、chain 26px 紫、repDown 紅粉、capture 28px 綠、levelUp 青、fizzle 18px 灰; t ≥ dur 不畫 |
| 結算 | `drawResultPanel(ctx, s)` | rep, goldEarned, bestChain, roster, stars | 固定中央 (640, 380) 800×520: 「七天結算」、3 顆星(stars 顆亮)、總名聲 / 累計金幣 / 最長連鎖 N 段、陣容頭像 + Lv、「按 Z 重來」 |
| HUD | `drawHud(ctx, s)` | phase, day, dayMax, gold, rep, hearts, maxHearts, ropes, ropeMax, weapon, xCdLeft, xCdMax, timeLeft, timeMax, dungeon, message | guide: 不畫。dungeon(高 100): 第一列「第 N/7 天」、金幣、名聲、地下城名(置中, 主題色)、右上計時(數字 + 圓餅, ≤10 秒變紅); 第二列心(空心暗)、繩圈(用掉的暗)、武器圖 + 名、X 鍵帽(xCdMax = 0 時暗 + 斜線; 冷卻中蓋暗扇形 = 剩餘)、右側 message(不是預設「Z 攻擊 X 武器技」時加金色膠囊強調)。其他(高 50): 天數、金幣、名聲、timeMax > 0 時中間計時、右側 message |
| 說明頁示意圖 | `drawGuidePage(ctx, s)` | page(0~4), x, y, w, h | 只畫在 (x, y, w, h) 框內, 依框等比縮放置中(設計基準 1200×520); 不畫頁標題、說明文字、頁碼、翻頁提示 |

## 尺寸表

| 物件 | 尺寸(畫面邊界) | 備註 |
|---|---|---|
| Tile | 60×60 | 整格填滿, 判定 = 整格 |
| Tamer | 64×64 | 身體約 24×55; 武器長 28 從中心伸出 |
| WildMonster | 80×80(crab 110×110) | 本體約箱寬 0.85; 血條在箱底內 |
| CaptureRing | 110×110 | 環半徑 38, 字樣中心在 y − 46 |
| Lasso | 不限 | 繞圈環半徑 52、時限環半徑 44(畫在被套魔物身上) |
| Hazard | = 判定形狀 | 見判讀約定 |
| WeaponFx | = 判定形狀 | dash 帶寬 36 |
| DungeonCard | 360×440 | |
| RosterCard | 180×240 | |
| TimelineSlot | row 640×54 / mini 130×46 | |
| PickerPanel | 460 × (50 + 52 × 選項數) | 固定 x 760, y 60 |
| SetupInfo | 460×60 | |
| CardFx | 約 (卡名寬 + 50) × 44(不點名 56 高) | 點名卡在目標中心上方 120 |
| StageDevice | confettiL/R 60×90、sprinkler 60×60、spin 360×360 | |
| DeviceFx | 半徑 = radius | 氣球落下中會從落點上方 300 處往下掉(在預警圈外, 只是顯示) |
| ShowMonster | 96×96(crab 120×120)+ 怒氣條 90×12 | 怒氣條與標記畫在箱上方(箱外): 條 y − 箱/2 − 16 ~ −4, 標記菱形中心 y − 箱/2 − 27 |
| Fence | 136×14 | |
| Visitor | 56×76 | |
| ShopItem | 380×100 | |
| Button | w×h | 依傳入 |
| ResultPanel | 800×520 | 中心 (640, 380) |
| HUD | dungeon 1280×100 / 其他 1280×50 | |

## 判讀約定

- **技能與範圍的半徑 = 外緣**: spore / frost / confetti / balloon 圓、claw 扇形、bubble / whirl 投射物的 radius 都是外緣; 畫面上的邊線從外緣往內畫(線寬全在判定內), 不往外溢。
- spikes: 從 (x, y) 沿 angle 延伸 length、中線左右各 width/2; line 型武器特效同理。
- sprinkler 水簾: 上下各 radius(80), 水簾帶寬 52 置中於車身 x(判定 ±60 寬於畫面 ±26, 水簾只是表示「這裡在灑」; 判定請照 spec ±60)。
- 預警填色進度 = t/dur; 介面已傳各 phase 的 dur, 美術不寫死任何預警秒數。
- drawPickerPanel / drawResultPanel / drawHud 固定版位; drawSetupInfo 若 RD 沒傳 x, y 用 (990, 670)(= spec 資訊列 x 760~1220、y 640~700 的中心)。

## 時長常數

| 效果 | 總長 | 來源 |
|---|---|---|
| 卡發動浮字 | dur(預設 0.8) | spec 51 |
| 被點燃 / 被澆熄反應 | fxDur(預設 0.5) | spec 66 |
| 表演動作外擴環 | performDur(預設 0.5) | spec 58 |
| 飄字 | dur(預設 1) | interface |
| 受擊無敵閃爍 | 由 blink 決定, 12Hz | 美術自訂 |
| 套索快斷警示 | 剩 ≤ 1.5 秒時限環變紅; len/maxLen > 0.85 繩子紅白閃 | 美術自訂 |

## 文字歸屬

照 interface notes「文字歸屬」, 所有遊戲畫面文字都在上述函式內畫完, RD 不要另外畫字(含 HUD 的 message、結算的「按 Z 重來」)。說明頁例外: 美術只畫示意圖與圖內短標籤, 頁標題、說明文字、頁碼、翻頁提示由 RD 畫; 說明頁階段 drawHud 不畫任何東西。

## 說明頁(drawGuidePage)

設計基準 1200×520, 等比縮進 (x, y, w, h) 置中、超出部分裁掉。建議框寬高比接近 2.3:1(例: x 40、y 120、w 1200、h 520)。圖裡的遊戲物件一律呼叫遊戲內畫法並給規則成立的 state。

| page | 內容 | 規則驗算 |
|---|---|---|
| 0 | 菇菇林一角: 馴獸師(棍棒、面向右)Z 扇形敲中菇菇球(閃白); 菇菇球自身為中心的孢子雲預警圈(半徑 110, 填到一半); 白虛線箭頭從馴獸師繞出圈外; 方向鍵帽貼在箭頭終點、Z 鍵帽貼在扇形上方、X 鍵帽在旁(棍棒無 X 技, 畫成暗色) | 馴獸師距菇菇球 68(≤ 70 + 判定半徑, 敲得到), 在圈內; 箭頭終點 (470, 440) 距圈心 264 > 110 ✓ |
| 1 | 左: 殘血露水蛙(碎心、血 2/7)+ 馴獸師站在牠身上(中心距 16 ≤ 40)+ 準備捕捉環 50%; 右: 被套住的露水蛙(繩圈、暈眩星)+ 套索 + 繞圈進度環 50% + 繞牠一圈的白虛線箭頭; 右下角小框「收服!」飄字 + 綠勾 | 準備捕捉期間牠沒暈 ✓; 套索長 115 ≤ 220 ✓ |
| 2 | 左: 布置第 2 步縮圖(9 列: 第 1 列「5~10 秒 激將 菇菇球」、第 3 列「15~20 秒 冰鎮 露水蛙」、其餘「—」; 游標在第 5 列空時段; 右側「點名誰?」面板列菇菇球、露水蛙; 下方「開演」); 中間白箭頭; 右: 表演場縮圖, 菇菇球頭上「激將!」+ 身上往上竄的火(被點燃), 下方縮小節目表第 1 格變暗、第 2 格黃框(進行中且帶激將 + 菇菇球) | 照 guide 驗算: 5.5~6.0 秒浮字與點燃反應同時成立; 第 0 段沒放卡, 第 1 格只變暗 ✓ |
| 3 | 上: 菇菇球怒氣 88(紅區下限 80)正在表演, 旁邊「+6 ×2」紅金飄字; 下: 左邊同種怒氣 100、頭上 4 個失控標記 → 箭頭 → 右邊衝向上側圍欄(charge, 撞欄中、怒氣條紅白閃、沒有標記), 圍欄後是觀眾, 再右一個大紅 ✕ | 標記 0~4 才顯示, 失控後不顯示 ✓; 圖例取撞欄途中, 圍欄未破(撞 1.5 秒後才破)✓ |
| 4 | 四個節點順時針「地下城 → 布置 → 表演 → 商店」, 各帶遊戲內圖示(馴獸師、激將徽章、菇菇球、金幣); 圈中央「×7 天」; 表演節點旁三顆名聲星往上疊; 表演 → 金虛線箭頭 → 「結算」框(3 顆評價星, 2 顆亮) | — |

偏離 guide 字面: 第 1 頁「三個鍵帽各對應走 / 攻擊 / 武器技」, 動作名稱已在 RD 畫的頁面文字裡, 圖中只把鍵帽貼在做那個動作的物件旁、不配動作名稱(避免與頁面文字重複)。

## 表外值的預設外觀

species → 菇菇球; dungeon → 菇菇林; kind(Tile)→ floor; room → hall; weapon → 棍棒; Hazard kind → spore(phase 依 kind 給 warn / fly); WeaponFx shape → arc; card 不在表內 → 視為空(不畫徽章 / CardFx 不畫); mode → roam; fx → none; Visitor mode → watch; item → club; FloatText kind → gold; HUD phase → select; device → spin; DeviceFx kind → confettiWarn。看到這些預設外觀出現在不該出現的地方, 請先查傳入值。
