# 口令牌馴獸秀 — 美術規格(style.md)

> RD 只讀這份。`index.html` 必須宣告 `<meta charset="utf-8">`(art.js 內含中文字串)。
> 全域物件 `window.Art`, 非 ES module; 每個函式自己 save / restore。表外值一律換成預設外觀(見文末「表外值」)。

## 1. 邏輯畫布尺寸
1280 × 720(`Art.canvas = { width: 1280, height: 720 }`), 與 interface.json 一致。

## 2. 色票表(`Art.palette`)

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg | #171a26 | 選擇 / 布置 / 商店 / 結算 / 地下城外圍底色 |
| panel / panelHi / panelLine | #252a3d / #323852 / #4a5274 | 卡片、面板底、外框 |
| hudBg | #10121b | HUD 底 |
| text / textDim | #f3f0e4 / #9aa2bd | 主文字 / 次要文字 |
| outline | #14131c | 物件深色外描 |
| select | #ffe14d | **選擇框專用**(卡、牌位、面板行、按鈕、商店格) |
| danger | #ff3b47 | 危險: 傷害地形框、紅區段、失控標記、失控外圈、套索快斷 |
| ignite / igniteCore | #ffa62e / #ffe27a | 點燃(升怒)、加溫類口令牌、表演門檻到紅區之間的怒氣 |
| douse / douseCore | #4aa8ff / #cfe9ff | 澆熄(降怒)、降溫類口令牌 |
| other | #c3b2ff | 非冷熱類口令牌(安可令、嘲諷令)、被嘲諷外圈 |
| gold / rep | #ffd23f / #fff0a0 | 金幣 / 名聲星 |
| capture | #6cf08a | 「可以捕捉」: 殘血血條、準備捕捉環、繞圈進度、「已開放」、「上場」、「裝備中」 |
| levelUp / repDown | #6fe7ff / #b9a6ff | 飄字「等級 +1」/ 名聲下降 |
| player / playerLight | #3d6fe0 / #a9c6ff | 馴獸師外套; 被劍打回的投射物(改打魔物) |
| rope | #d6a65c | 套索、繩 |
| rageLow / rageMid / rageRed | #7d86a6 / #ffa62e / #ff3b47 | 怒氣 < 50 / 50~紅區下限 / 紅區 |
| mouse | #e6b93a(44°, 灰 184) | 發條鼠本體與火花 |
| snail | #6cc24a(103°, 灰 155) | 油壺蝸牛殼與冷卻液 |
| puffer | #39c6d6(186°, 灰 158) | 河豚與膨脹刺 |
| octo | #9b6be0(265°, 灰 135) | 章魚、墨汁、觸手 |
| pumpkin | #ee7a22(26°, 灰 147) | 南瓜燈與南瓜炸彈 |
| sheep | #f4a6d0(328°, 灰 194) | 棉花糖羊與棉花雲 |
| field / stands / seat / fence | #2a3040 / #211d2e / #2e2840 / #b98a52 | 表演場地、觀眾席、座位、圍欄 |

**張力(最差組合)**: 六種魔物排滿色輪, 發條鼠(44°)與南瓜燈(26°)只差 18°(灰階差 37), 兩者會同場。種類辨識的主通道是**剪影**(鼠: 橢圓身 + 圓耳 + 發條鑰匙; 南瓜燈: 三瓣南瓜 + 發光鬼臉), 顏色只是第二通道。點燃特效(ignite 34°)也落在兩者之間, 所以點燃 / 澆熄的主通道是**方向與形狀**(火舌往上竄 vs 水滴往下掉), 顏色降為第三通道。驗收用「發條鼠與南瓜燈相鄰、其中一隻被點燃」那一幀。

## 3. 形狀語言
圓角、深色外描、扁平填色; 可互動 / 會動的東西(魔物、馴獸師)有外描與立體細節, 場景(地板、場地)平塗無外描; 「危險」用紅虛線框與尖角, 「選中」只用黃色粗框。

## 4. 理念落實(經驗文件中「成立」的理念)

- **P0 辨識度先於好看**: 六種魔物各有獨特剪影, 縮到 60% 仍分得出; 不靠顏色認種類。
- **P1 視覺權重跟著決策迫切度**: 地下城最迫切的是「技能預警」與「殘血可捕」——預警用虛線框 + 由中心長大的填色(填滿 = 生效), 殘血血條變捕捉綠並閃爍; 地板、牆壓在低明度。HUD 的捕捉訊息(「站住別動」/「繞牠一圈!」)是 HUD 唯一黃色大字。
- **P2 規則上存在的東西畫面上必須存在**: 怒氣條固定標出表演門檻 50(白刻度)與紅區下限~100(紅底段 + 上緣紅線); 失控標記遞減計時畫成標記下方一條白線; 套索時限畫成外圈細弧; 口令牌冷卻畫成徽章上的暗色扇形; 範圍技能的判定邊界 = 畫面邊界(radius 指外緣, 白邊從外緣往內畫)。
- **P3 一個意義一種長相**: 暖色 = 升怒(點燃特效、加溫類牌、怒氣條中段), 冷藍 = 降怒(澆熄特效、降溫類牌), 捕捉綠 = 「可以收 / 已擁有 / 上場」, 黃粗框 = 游標所在, 紅 = 危險(紅區、標記、失控、傷害地形); 牌的圖示在牌位、面板、場上徽章、浮字四處是同一張。
- **P4 關鍵區分走兩條通道**: 點燃 vs 澆熄 = 顏色 + 方向(往上竄火舌 / 往下滴水滴); 冷靜鈴 vs 打氣鈴 = 冷暖色 + 鈴上箭頭朝下 / 朝上; 傳火令 vs 滅火令 = 火焰 vs 水滴形 + 冷暖色; 牌待命 vs 冷卻 = 實線亮框 vs 虛線暗框 + 暗色扇形。
- **P7 每個元素都要掙得版面**: 表演場魔物只寫「Lv N」(介面要求), 不加種類名; 失控不加字樣, 由紅色鋸齒外圈 + 怒筋 + 怒氣條轉成紅閃表達; 說明頁按鍵只用鍵帽貼在動作物件旁。
- **P9 以最混亂的一刻驗收**: 四隻魔物同時有預警範圍、投射物、浮字時, 魔物本體都有深色外描, 範圍技能填色約 14~62% 不透明不蓋死魔物; 浮字都帶深色描邊。
- **P13 事件要排隊**: 牌名浮字(drawTagFx)只畫在配戴者頭頂 74px 上方、0.8 秒內淡出; 同一隻同一幀若兩塊牌一起發動, 請 RD 讓第二塊的 TagFx 晚 0.4 秒開始(美術無法從 state 得知同一隻有幾塊在冒)。
- **P15 回饋強度和份量成正比**: 飄字分級: 一般金幣 20px < 等級 / +20 24px < 紅區金幣、連鎖 26px(紅區加紅描邊)< 收服 30px; 名聲下降往下掉, 其他往上飄。
- **P17 進度類資訊圖形與數字分工**: HUD 計時條給總剩餘比例、數字給秒數(玩家決策是總量, 依邊界可畫總量); 牌冷卻沒有數字, 圖形畫總進度。
- **P18 重要資訊不能只存在一瞬間**: 牌發動的浮字 0.8 秒消失, 但場上徽章會同時進入冷卻扇形, 留存「剛發動過」; 收服 / 等級結果留在布置卡的「Lv N」。
- **P19 資訊貼著物件**: 怒氣條、標記、牌徽章都在魔物本身上下; 準備捕捉字樣與進度環畫在魔物身上; 套索進度環圍著被套的魔物。
- **P21 示意圖要選對錯理解會分岔的例子**: 說明第 1 頁火花畫 4 條斜向軌跡虛線, 移動箭頭走正左方的空隙(錯誤理解「火花會追人」畫出來會不同); 第 4 頁畫「4 個標記還在場上」對照「衝欄時頭上已沒有標記」並打叉。

## 5. 判讀約定(RD 請照這些算判定)
- **Hazard 的 radius = 外緣**。範圍技能判定 = 填色區; 白邊 / 虛線框從外緣往內畫, 不往外溢。投射物 radius = 判定半徑, 星形 / 圓的外緣就在 radius, 後方半透明尾巴不算判定。
- **馴獸師**: 外套圓半徑 18 = 判定圓。武器握在身側往前伸(最遠約 31px), 不屬判定。
- **ShowMonster 的怒氣條**畫在 size 框內頂端: 中心 + (−45, −half + 2.5), 90×12(half = 48, 棉花糖羊 60)。
- **drawPickerPanel** 固定畫在 x 820~1240, 標題 y 60~110, 第 i 行 y 110 + 60i ~ 170 + 60i(spec 數值表「布置第 2 步版面」); 最多畫 8 行。
- **drawResultPanel** 固定 x 240~1040、y 120~640(中心 640, 380)。
- **drawHud**: phase = dungeon 高 100, 其他高 50; **phase = guide 時整個不畫**(說明頁的頁標題、文字、頁碼、翻頁提示歸 RD, 避免和 HUD 重疊)。
- **drawTagBadge 閃光**: 只在 `0 < flashT < flashDur` 時畫(介面寫「沒在閃時為 0 / 0.3」, 和閃光第一幀相同, 第一幀不閃, 差一幀無妨)。
- **drawTagFx / drawFloatText**: `t ≥ dur` 或 t < 0 時自己不畫, RD 可在 t ≥ dur 後停止呼叫。
- **ShowMonster.fx**: `fxT ≥ fxDur` 時視同 none。
- **WildMonster.move = hop** 只有南瓜燈會往上抬; 其他種類給 hop 時照 walk 畫。
- 暈眩星星與失控閃爍、無敵閃爍用 `performance.now()` 自己算動畫相位, 不需 RD 傳時間。

## 6. 物件表

| 物件 | 函式 | state 欄位 | 各狀態的視覺差異 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | — | 全畫布深藍灰 + 極淡 40px 格線。選擇 / 布置 / 商店 / 結算 / 地下城都先畫它 |
| Tile | `drawTile(ctx, s)` | x, y(格中心), dungeon(workshop/reef/grave), kind(wall/pillar/floor/hurt/slow), room(left/right/hall), nest | 三座地下城各一套色(工坊暖棕、海窟藍綠、墓園紫灰)。wall 深色 + 上緣亮帶; pillar = 機台 / 礁石 / 墓碑, 深外描 + 影子(與牆同屬「擋路」); floor 房間棋盤格、走道較暗; hurt = 紅虛線框 + 海膽(海窟)/ 鬼火(墓園); slow = 油漬 / 海草 / 爛泥 + 兩條白波紋(三座共用的減速記號); nest = 該房魔物色的虛線圈 + 4 點(left = 該地下城第一種, right = 第二種) |
| Tamer | `drawTamer(ctx, s)` | x, y, facing(0~7, 0 上順時針), weapon(club/sword/spear/whip), dashing, blink, lassoing | 藍外套圓 r18 + 帽 + 臉朝 facing, 武器握在右側往前。dashing: 白外框 + 後方兩個殘影; blink: 0.09 秒一次 30%/85% 閃爍; lassoing: 背後一捆繩 |
| WildMonster | `drawWildMonster(ctx, s)` | x, y, species, hp, maxHp, hit, weak, stunLeft, stunDur, lassoed, casting, move(walk/wind/dash/stick/hop), moveT, moveDur, dir(−1/1) | 本體依種類剪影, dir 決定左右。底部血條(白), 30% 處有綠刻度。hit: 整隻白剪影; weak: 血條變捕捉綠並閃 + 頭上兩滴汗; stunLeft > 0 或 lassoed: 頭頂三顆星繞軌道, 軌道弧長 = 剩餘暈眩比例(lassoed 時滿圈); lassoed: 腰間一圈繩; casting: 魔物色虛線外圈閃動, 河豚鼓起(變大 + 長刺); wind: 背上鑰匙轉 + 弧線; dash: 身後三條速度線; stick: 身下黏液; hop(南瓜燈): 本體上抬、影子留地上 |
| CaptureRing | `drawCaptureRing(ctx, s)` | x, y, t, dur | 魔物身上半徑 49 的綠色進度環(t/dur, 12 點鐘起順時針)+ 深色底軌 + 外圈白細線; 上方深底「準備捕捉」綠字 |
| Lasso | `drawLasso(ctx, s)` | x1, y1(馴獸師), x2, y2(魔物), progress, t, limit, len, maxLen | 繩: len/maxLen 越小越下垂; > 0.7 變橘, > 0.9 紅白閃(快斷)。魔物周圍半徑 58 綠色繞圈進度環(progress); 半徑 66 細白弧 = 套索剩餘時限(剩 < 30% 轉紅) |
| Hazard | `drawHazard(ctx, s)` | x, y, kind(spark/coolant/puff/ink/pumpkin/cotton), phase(warn/active/fly), radius, angle, spread, t, dur, reflected | 顏色 = 施放者種類色。warn: 14% 淡填 + 由中心長大的填色(t/dur, 填滿 = 生效)+ 外緣虛線; 南瓜炸彈另有十字準星 + 從天而降的南瓜。active: 62% 實心 + 白邊 + 內部紋理(冷卻液水滴 / 膨脹刺內收尖刺 / 棉花雲絨球 / 南瓜爆炸光芒), 隨 t 淡出。fly: 火花 = 黃星、墨汁 = 紫黑圓, 後方半透明尾巴; reflected: 改馴獸師藍 + 白芯 + 白圈 |
| Tentacle | `drawTentacle(ctx, s)` | x1, y1(章魚), x2, y2(對象), t, dur | 紫色粗彎觸手 + 吸盤點, 末端一圈纏繞; 甩出的擺動隨 t 衰減 |
| WeaponFx | `drawWeaponFx(ctx, s)` | x, y, weapon, move(normal/skill), shape(arc/circle/line/dash), angle, spread, radius, length, width, t, dur | 一律「白色前緣細線 + 極淡填色」(與魔物技能的實心面分開)。arc: 扇形 + 沿外緣掃過的白弧; circle(長鞭): 整圈白線 + 繩色旋轉虛線; line(長槍): 長方形外框 + 中線; dash(突進): 藍白殘影帶。skill 前緣改淡黃、較粗; 劍的擊暈斬多三顆小星 |
| DungeonCard | `drawDungeonCard(ctx, s)` | x, y, dungeon, open, condition, selected | 卡頂地下城名、中段兩種魔物圖 + 名稱。open: 主題色外框 + 綠「已開放」膠囊; 未開放: 灰框、魔物圖 45% 透明、右上鎖頭、底部「未開放」+ condition 字串。selected: 黃粗框 |
| RosterCard | `drawRosterCard(ctx, s)` | x, y, species, level, picked, selected | 圓底魔物圖、名稱、「Lv N」。picked: 綠外框 + 綠「上場」膠囊; 未上場: 魔物 60% 透明 + 灰框「休息」。selected: 黃粗框 |
| SetupRow | `drawSetupRow(ctx, s)` | x, y, species, level, selected | 720×110 列: 左側頭像(x 70~150)、名稱與「Lv N」(x 176 起)。selected: 較亮底 + 黃外框 + 左緣黃條 |
| TagSlot | `drawTagSlot(ctx, s)` | x, y, tag(7 種或空字串), selected | 有牌: 牌色外框 + 圓底圖示 + 牌名; 空: 虛線框 + 「空牌位」。selected: 黃粗框 |
| PickerPanel | `drawPickerPanel(ctx, s)` | options[{type, key, name, desc, left, usable}], index | 標題「掛哪塊牌?」; 每行圖示、名稱、desc 小字、右上「剩 N」; remove 行為 ✕ 圖示 + name。usable = false: 整行 38% 透明、圖示灰。index 行: 黃框 |
| TagBadge | `drawTagBadge(ctx, s)` | x, y, tag, cdLeft, cdDur, flashT, flashDur | 28×28 圓角方塊。待命(cdLeft = 0): 牌色實線框 + 亮圖示; 冷卻中: 虛線暗框 + 已恢復部分淡牌色、剩餘部分暗色扇形(12 點鐘起順時針)+ 淡灰圖示; 閃光中: 白底白框隨 flashT 淡出 |
| TagFx | `drawTagFx(ctx, s)` | x, y(配戴者中心), tag, t, dur | 頭頂上方 74px 冒出「圖示 + 牌名!」(牌色字 + 深描邊), 前 15% 彈出、後 30% 淡出, 共上飄 14px |
| ShowArena | `drawShowArena(ctx)` | — | 全畫布場地色; 上下觀眾席(y 50~142、574~666)與 8 個座位; 場地圓角矩形 x 60~1220、y 146~566 + 中圈與中線(極淡); y 666~720 延伸場地色 |
| ShowMonster | `drawShowMonster(ctx, s)` | x, y, species, level, rage, redLow, marks, markLeft, markDur, mode(roam/relay/taunted/pulled/charge/loose), performing, performT, performDur, fx(none/ignited/doused), fxT, fxDur, chargeT, chargeDur, looseT, looseDur, move, moveT, moveDur, dir | 框頂怒氣條(灰 < 50、橘 50~紅區下限、紅 ≥ 紅區下限; 紅區段常駐紅底 + 紅上緣; 50 白刻度; 紅區下限淡紅刻度)。marks 1~4: 條下方一排紅菱形 + 白色遞減計時線(markLeft/markDur)。左下「LvN」。performing: 腳下金色聚光橢圓 + 本體鼓一下 + 四顆小星(河豚鼓起)。fx ignited: 暖色外圈 + 五道往上竄的火舌; doused: 冷藍外圈 + 五滴往下掉的水滴(都隨 fxT 淡出)。relay: 身後橫向火焰尾; taunted: 淡紫旋轉虛線圈; pulled: 本體被拉扁。charge / loose: 紅色鋸齒外圈 + 怒筋, 怒氣條改紅閃; 條底白線 = charge 撞欄剩餘(chargeT/chargeDur)/ loose 亂竄剩餘(looseT/looseDur), 不畫標記; charge 且 chargeT > 0(撞欄中)本體左右抖 |
| Fence | `drawFence(ctx, s)` | x, y, side, broken | 完好: 一條木欄 + 4 根柱; broken: 中段斷開、斷口尖木片、兩塊碎木斜落、顏色變暗 |
| Visitor | `drawVisitor(ctx, s)` | x, y, side, mode(watch/scared/empty) | 底部座位常駐。watch: 坐著的觀眾(衣色依位置輪替)+ 微笑; scared: 身體傾斜、雙手舉高、臉發白張嘴 + 汗滴; empty: 只有座位 |
| ShopItem | `drawShopItem(ctx, s)` | x, y, item, cost, level, owned, equipped, affordable, selected | 左圓底圖示(武器 / 強化 +號 / 牌圖示)、名稱、說明(spec 第 64 條)、右上價格(金幣 + 數字)。武器或牌已擁有、棍棒: 「已擁有」灰字取代價格。affordable = false: 價格 45% 透明灰。equipped: 綠框 + 綠「裝備中」。強化 level > 0: 「已買 N 次」。selected: 黃粗框 |
| Button | `drawButton(ctx, s)` | x, y(左上), w, h, label, selected | 圓角按鈕; selected: 黃底深字 + 白框; 未選: 深底白字 |
| FloatText | `drawFloatText(ctx, s)` | x, y, text, kind(gold/redGold/chain/repDown/capture/levelUp/coin20), t, dur | 見 P15 分級; repDown 往下掉, 其他往上飄 34px; 後 40% 淡出 |
| ResultPanel | `drawResultPanel(ctx, s)` | rep, goldEarned, bestChain, roster[{species, level}], stars | 標題「七天結算」、三顆大星(stars 顆填金)、總名聲 / 累計賺得金幣 / 最長連鎖 N 段、陣容頭像 + Lv、底部黃字「按 Z 重來」 |
| HUD | `drawHud(ctx, s)` | phase, day, dayMax, gold, rep, hearts, maxHearts, ropes, ropeMax, weapon, xCdLeft, xCdMax, timeLeft, timeMax, dungeon, message | dungeon(高 100): 上排「第 N/7 天」+ 地下城名(主題色)、中央計時條 + 秒數(剩 < 20% 轉橘)、右上金幣與名聲; 下排左心(空心為暗)、繩、右側武器圖 + 名稱 + X 鍵框(冷卻中暗扇形; xCdMax = 0 畫斜線); 中央 message 黃色大字。其他 phase(高 50): 左天數、金幣、名聲; 中央 message; show 時右側計時條。guide: 不畫 |
| 說明頁示意圖 | `drawGuidePage(ctx, s)` | page(0~4), x, y, w, h | 見第 8 節 |

**畫面文字歸屬**: 說明頁以外的所有文字都由美術畫(照介面「文字歸屬」), RD 不要另外畫字。說明頁的頁標題、說明文字、頁碼、翻頁提示歸 RD; 美術在 `(x, y, w, h)` 框內只畫示意圖與物件旁的短標籤。

## 7. 尺寸表

| 物件 | 畫面範圍(= 判定 / 介面 size) | 備註 |
|---|---|---|
| Tile | 60×60 | |
| Tamer | 64×64; 外套圓 r18 = 判定 | 武器最遠約 31px |
| WildMonster | 80×80(棉花糖羊 110×110) | 本體約半徑 32(羊 1.15 倍); 血條 46×5 在框底 |
| CaptureRing | 110×110 | 進度環 r49, 外細線 r53.5 |
| Lasso | 無框 | 進度環 r58、時限弧 r66, 以魔物中心為圓心 |
| Hazard | 外緣 = radius(冷卻液 130 扇形、膨脹刺 130、棉花雲 160、南瓜炸彈 100、火花 12、墨汁 14) | 預警時的落下南瓜在落點圈上方 90px 內 |
| Tentacle | 兩端點之間, 線寬 13 | |
| WeaponFx | 依 radius / length / width | |
| DungeonCard | 360×440 | |
| RosterCard | 180×240 | |
| SetupRow | 720×110 | |
| TagSlot | 200×80 | |
| PickerPanel | 420 × (50 + 60 × 選項數) | 固定 x 820~1240、y 60 起 |
| TagBadge | 28×28 | |
| TagFx | 配戴者中心上方約 62~98px, 寬約字數 × 22 + 30 | |
| ShowMonster | 96×96(棉花糖羊 120×120); 怒氣條 90×12 在框頂 | 本體中心比 x,y 低 8px(羊 10px) |
| Fence | 136×14 | |
| Visitor | 56×76 | |
| ShopItem | 380×100 | |
| Button | w × h(左上 x, y) | |
| ResultPanel | 800×520 | 固定中心 (640, 380) |
| HUD | 1280×100(dungeon)/ 1280×50 | |

自測: 用會追蹤變換矩陣的假 ctx 跑過每個有 size 的函式的所有狀態組合(2339 次呼叫), 外接框全部在 size 內(誤差 ≤ 1px), save / restore 全部成對。

### 時長常數(state 沒給時的預設)

| 效果 | 總長 | 來源 |
|---|---|---|
| 擊暈 | stunDur 預設 2 | 規格 |
| 準備捕捉 | dur(必傳) | 規格 0.8 起 |
| 套索時限 | limit 預設 5 | 規格 |
| 牌名浮字 | dur 預設 0.8 | 規格 |
| 牌圖示閃光 | flashDur 預設 0.3 | 介面 |
| 表演動作 | performDur 預設 0.5 | 規格 |
| 點燃 / 澆熄反應 | fxDur 預設 0.5 | 規格 |
| 標記遞減 | markDur 預設 4 | 規格 |
| 撞欄 / 亂竄 | chargeDur 1.5 / looseDur 6 | 規格 |
| 飄字 | dur 預設 1 | 介面 |

## 8. 說明頁示意圖(drawGuidePage)

示意圖在 800×420 的虛擬座標裡畫, 等比縮放置中到 `(x, y, w, h)`, 並 clip 在框內。圖裡的遊戲物件一律呼叫遊戲內的 draw 函式。

| 頁 | 圖 |
|---|---|
| 0 地下城 | 發條工坊一角。馴獸師(標「你」)拿棍棒朝右敲中一隻發條鼠(扇形攻擊特效、鼠受擊白剪影); 右邊另一隻發條鼠朝 45°/135°/225°/315° 射出四顆火花, 每顆後面一條軌跡虛線; 馴獸師身後一支白箭頭沿正左方(空隙)走開。鍵帽: 方向鍵貼在移動箭頭下方、Z 貼在攻擊扇形上方 |
| 1 收服 | 左右兩格。左: 帶汗滴、綠血條的殘血油壺蝸牛, 身上「準備捕捉」綠環填一半, 馴獸師站在牠身上。右: 頭上冒星、腰上一圈繩的蝸牛, 套索連到站在虛線圓路徑上的馴獸師, 路徑末端有箭頭, 魔物周圍綠進度環填一半。右下角小框: 綠勾 +「收服!」飄字 |
| 2 掛口令牌 | 上: 布置第 2 步兩列(縮 0.62)「發條鼠 [冷靜鈴][傳火令]」「油壺蝸牛 [打氣鈴][空牌位]」, 黃框停在蝸牛的空牌位。箭頭指向下方表演場縮圖: 油壺蝸牛怒氣 73(橘), 怒氣條上白框圈出 48→73 那一段 + 白色小箭頭; 身上點燃反應(火舌); 頭上「打氣鈴!」; 身下打氣鈴徽章正在閃(冷卻剛開始) |
| 3 紅區 | 上: 南瓜燈怒氣 90(紅區)正在表演(金色聚光), 飛出金幣與「+6 ×2」紅描邊金字。下: 左邊南瓜燈怒氣全滿、條下 4 個紅菱形標記; 箭頭 → 右邊同一隻已在衝欄(紅鋸齒外圈、怒氣條紅閃、頭上無標記)頂著上方圍欄, 觀眾嚇到; 旁邊大紅叉 |
| 4 目標 | 四格流程「地下城 → 布置 → 表演 → 商店」順時針箭頭圍成一圈, 中央「×7 天」; 表演格旁三顆名聲星往上疊 + 上升箭頭; 表演格往右一支箭頭(標「第 7 天」)指到結算框, 框內三顆星(兩顆亮) |

**偏離 guide 字面與理由**(請製作人驗收):
- 第 1 頁: guide 要「方向鍵 / Z / X 三個鍵帽各對應走 / 攻擊 / 武器技」排在下方。按鍵說明歸 RD 頁面文字, 圖裡只把鍵帽貼在做那個動作的物件旁, 不排成一列、不配動作名稱; 且圖中拿的是棍棒(X 無反應), 畫 X 鍵帽會教錯, 所以只畫方向鍵與 Z。
- 第 3 頁: 怒氣條「剛從門檻下方跳回」用白框圈出 48→73 那一段表示(怒氣條本身只能畫現值)。
- 第 4 頁: 照驗算, 衝欄這一格不畫標記; 圍欄畫完好(撞欄 1.5 秒後才破), 魔物頂在圍欄前抖動。

**驗算**: 第 0 頁四顆火花都在斜向軌跡上, 移動箭頭在 180° 方向, 與最近的軌跡(135° / 225°)夾角 45°, 不相交 ✓。第 2 頁每種牌各用 1 塊 ✓, 同一隻沒有同種兩塊 ✓, 打氣鈴不引發接演, 蝸牛沒畫表演聚光 ✓。第 3 頁 marks 0~4 才顯示 ✓, 有標記時怒氣 100 ✓。第 1 頁準備捕捉的蝸牛沒畫暈眩星, 套索中才有 ✓。

## 9. 繪製層級
照 interface.json「繪製順序」。說明頁階段: RD 畫頁面底與文字 → `drawGuidePage` → (HUD 不畫)。

## 10. 表外值
- species 不在表內 → 畫發條鼠; tag 不在表內 → 不畫(牌位畫成空牌位); dungeon 不在表內 → 發條工坊; weapon → 棍棒; Hazard kind → 火花; mode → roam; move → walk; fx → none; item → 攻擊力; phase → select; page 夾到 0~4; 數值 NaN / 缺 → 0 或該欄預設。看到不該出現的發條鼠或棍棒時, 先查傳入值。
