# 來馬戲團看一點大場面(打磨版第 2 輪)— 美術規格(style.md)

> RD 只讀這份。`index.html` 必須宣告 `<meta charset="utf-8">`(art.js 內有中文字串)。
> 函式名、參數、state 欄位全部照 `interface.json`, 一個不多一個不少。所有函式自己 save / restore; 傳入表外值不會拋錯, 會畫成下表寫的「預設」。
> 沿用打磨第 1 輪的色票、形狀語言與物件畫法。本輪只改規格「本輪改動」表牽涉到美術的部分: 「紅區」改叫「生氣」、標題、10 天、觀眾滿意度、9 個新暗號 / 節目圖示、商店 4 分頁、選擇面板行高 44、節目單鎖列、見習過場(新)、頭上心列(新)、怪物卡拿掉效果標籤、升級面板結構化、HUD 改版、教學附註泡泡。

## 1. 邏輯畫布

1280 × 720(`window.Art.canvas = { width: 1280, height: 720 }`)。

## 2. 色票(`window.Art.palette`)

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg / bg2 | #141821 / #1c2230 | 背景 |
| panel / panelHi / line | #232a3a / #2f3a52 / #465372 | 面板底 / 亮一階(上台的格、選中的卡) / 面板框 |
| text / textDim / outline | #eef2f8 / #9aa6bd / #0d1018 | 文字 / 次要字 / 物件與文字的深色描邊 |
| select | #ffd24a | **游標 / 選擇框**(全遊戲唯一的選擇長相: 金色 4px 框 + 外光) |
| tamer | #ffd24a | 馴獸師本體、他打出的武器特效、被劍打回去的投射物外環 |
| hittable | rgba(255,210,74,0.8) 虛線 | **你打得到 / 打得破的場景物**: 裂牆的框、有果子的果樹 |
| capture | #c6f046 | 只給「可捕捉 / 捕捉進度 / 收服」 |
| rope | #f0e2b8 | 套索繩 |
| danger | #ff3b4a | 傷害地形紅框、爆炸桶預警圈、爆炸、失控鋸齒、破損圍欄、心列扣血碎片 |
| ignite / calm / special | #ff6a2c / #3fa0ff / #b46cff | 惹生氣(點燃)/ 冷靜(澆熄)/ 特殊效果(標靶·凍住·變走);說明面板〔 〕標籤也用這三色 |
| cue / program | #5ad1e6 / #ff8fc8 | 暗號格與圖示 / 節目格與圖示(商店「暗號」「節目」分頁底線也用) |
| gold / rep | #ffc83a / #9fd8ff | 金幣(錢幣圖示)/ 名聲(星形圖示) |
| **sat** | #ffd6a8 | **觀眾滿意度**(笑臉圖示): HUD、飄字 kind sat、表演結算、暗號「滿意度 +30」、節目「歡呼」 |
| rageLow / rageMid / rageRed | #8390aa / #ffb43a / #ff3b4a | 怒氣條: < 50 / 50~生氣門檻 / 生氣段 |
| ice | #bfeaff | 冰塊、減速霜環 |
| portal1 / portal2 | #3fe0ff / #ff7ad9 | 傳送陣 1 號 / 2 號 |
| lily / monkey / beetle / parrot / penguin / tanuki | #8fe3a0 / #e8782c / #2fb8a8 / #ec4f9c / #3a5a9a / #a88a62 | 六種魔物本體主色 |
| heart | #ff5d7a | 心(頭上心列、回復泉、補心飄字) |
| **heal** | #5cf0a0 | **只給頭上心列的回血光點** |
| fruit | #ffe34a | 誘餌果子 |
| bush / bushHi | #2f8a3e / #58c06a | 草叢圓葉、馴獸師躲藏時蓋在身上的葉 |
| water | #5ab4ff | 回復泉水 |
| tutorBg / tutorInk / tutorOk | #fff6e0 / #1a2030 / #2fb060 | **只給新手教學泡泡**: 淺紙底、深字、按過 / 完成的綠 |

場所色(場所卡、日曆 / 總結算的場所圖示、見習過場的帳篷): 地下城 #58b86a、表演 #e0a040、商店 #7a9ae8。升級面板的「升級後」綠 #7dea8a、Lv 徽章亮黃 #ffe680(只在說明面板)。

**張力(請製作人用這幾幀驗收)**:
- 觀眾滿意度(sat 桃色笑臉)與金幣(金色錢幣)色相只差約 13°。主通道是**圖示形狀**(笑臉 vs 錢幣)與明度(桃色明顯較淡),顏色只當第二通道。最難分的一幀: 表演結算, 「觀眾滿意度」與下方「金幣 +N」同一個面板上下排。
- 觀眾滿意度會「加進名聲」, 但兩者不是同一個數: 名聲 = 星形淡藍, 滿意度 = 笑臉桃色, 長相刻意分開(P3)。
- 回血光點綠 #5cf0a0 與捕捉萊姆 #c6f046 相隔約 75°; 光點只在馴獸師頭上心列的 0.6 秒特效出現, 不會和魔物身上的捕捉色同位置。
- 沿用: 六種魔物色排不開色輪(主通道 = 剪影); 泉水 vs 1 號傳送陣(主通道 = 石盆 + 紅心 vs 平地環 + 點數); 果子 vs 馴獸師(主通道 = 尺寸 + 剪影)。

## 3. 形狀語言

圓潤扁平 + 深色描邊。**尖角 / 鋸齒只給危險**(傷害地形、爆炸桶火焰記號、失控鋸齒、失控橫幅、心列扣血的三角碎片);其他記號一律圓頭,草叢是圓葉、教學鍵帽是圓角。**虛線框 + 由內長大的填色 = 「快生效了」**(冰柱預警、傳送陣啟動、爆炸桶預警圈)。**金色實線框 = 游標**,**金色虛線 = 你打得到的場景物**。**白色外擴環 = 表演**(場上表演、暗號「有人表演」、節目「全體表演」、見習過場都用同一個)。**圖示下方一個白點 = 「1 隻」**(任一怪物生氣、有人表演、有人當標靶、有人被凍住)。教學泡泡和全畫面所有面板的明暗相反(淺紙底 + 深字),只給教學用。

## 4. 理念落實

- P0 辨識度先於好看: 魔物種類靠剪影分,狀態靠方向與外形分,顏色只當第二通道。四座地下城只換皮,危險地形、減速地形、草叢三套骨架不變。新暗號 / 節目圖示每個都換剪影(火團、半圓、準星、冰塊、笑臉),不靠換色區分。
- P1 視覺權重跟著決策迫切度走: 頭上心列平時只有 40% 不透明,只在扣血 / 回血那 2 秒轉不透明;地下城裡最亮的仍是會打到你的投射物外環與預警。升級面板裡最亮的是「升級後」綠字與費用徽章,項目名退成灰。
- P2 規則上存在的東西,畫面上就要存在: 見習日鎖住的 4 列照畫(鎖頭 +「見習後開放」),不是空著;生氣門檻每隻不同,怒氣條上的紅段起點照 angryLow 畫;棍棒沒有 X 技,HUD 整個 X 格不畫。
- P3 一個意義一種長相: 觀眾滿意度 = 笑臉(HUD、飄字、結算、暗號 gain30、節目 cheer 同一個);標靶 = 紫準星(場上、暗號 target1、節目 bull 同一套路徑);凍住 = 冰塊(場上、frozen1、still);表演 = 白外擴環;帳篷 = 場所卡「表演」圖示(見習過場直接用它)。
- P4 關鍵區分走兩條通道: 全體表演 vs 大合奏 = 三個灰點白環 vs 紅符頭音符(剪影 + 顏色);angry1 / angry3 / half = 一團大火 + 點 / 三團小火 / 半紅半灰圓;有人被凍住 vs 全場定格 = 小冰塊一隻 + 點 vs 大冰塊三隻;心列扣血 vs 回血 = 紅三角碎片往下 + 整排抖 vs 綠圓光點往上 + 心依序填滿。
- P7 每個元素都要掙得版面: 怪物格拿掉效果標籤後不另補東西,把頭像放大;縮小節目單只畫圖示;HUD 的歡呼剩餘時間只畫小條、不寫秒數。
- P9 以最混亂的那一刻驗收: 二十隻大亂鬥時反應都長在本體框內;頭上心列在 0.4 不透明度下壓在魔物、投射物之下(繪製順序在投射物之後,但半透明)。
- P13 事件要排隊: 節目浮字固定 (640,180)、上架 / 開放提示固定 (640,110),不同畫面出現。
- P15 回饋強度和份量成正比: 單隻反應 < 表演 < 節目發動 < 爆炸桶 < 失控;心列特效只在心列 240×64 範圍內。
- P17 進度的圖形與數字分工: 表演結算的金幣、名聲用跳動數字;歡呼、X 冷卻、等待條只畫圖形。HUD 計時條給「剩多少」、數字給精確秒數。
- P18 重要資訊不能只存在一瞬間: 每天去了哪留在日曆 10 格與總結算 10 格行程;收服留在地下城結算頭像列。
- P19 資訊貼著物件: 心列從 HUD 搬到馴獸師頭上;教學泡泡尾巴指著目標(停在目標前 6px);附註泡泡尾巴指著捕獸繩列下緣。
- P21 示意圖選對錯理解會分岔的例子: 本輪沒有說明頁。見習過場的三步圖解用遊戲內畫法(怪物格 + 上台勾、暗號格 → 節目格、表演白環 + 笑臉),狀態都合規則。

## 5. 物件表

座標一律是**物件中心**(地下城已換算成畫面座標)。例外: `drawButton` 的 x,y 是左上角;固定版位的函式見 §7。**粗體** = 本輪新增或改過。

| 物件 | 函式 | state 欄位 | 各狀態視覺 |
|---|---|---|---|
| 背景 | `drawBackground(ctx, s)` | scene | 深藍黑漸層 + 淡斜紋 + 依場景的淡色光暈;dresult / sresult / result 整片壓暗 60% + 暗角。自己 clip 在畫布內 |
| **開始畫面** | `drawTitle(ctx, s)` | t | 同上一版,**遊戲名改「來馬戲團看一點大場面」**;「Z 鍵帽 + 按 Z 開始」閃爍週期 1 秒(每秒前 0.62 秒顯示) |
| **日曆過場** | `drawCalendar(ctx, s)` | day, dayMax, t, dur, log | 桌曆翻頁同上一版。**下方 10 格排一排**(格 92×84、中心 x = 112 + 102i、y 610): 已過(i < day−1)= 場所圖示 + 白叉;今天(i = day−1)= 金框外光脈動 +「今天」;未來暗。右側 (1170, 610)「共 10 天」。day 0 沒有亮格 |
| **見習過場(新)** | `drawIntermission(ctx, s)` | t, ready, monsters | 全畫面夜色。大字「見習表演」(640,66)、一句「把剛抓到的火柴猴帶上台表演給觀眾看!」(640,128);中央帳篷(= 場所卡表演圖示)+ 舞台;monsters 每隻從畫面左外以 220 px/s 走到舞台前排好(火柴猴每秒跳一次),到了之後每 2 秒冒一次表演白環;下方三塊步驟卡(中心 x 222 / 640 / 1058、y 568,各 396×116): ① 怪物格 + 上台勾 / ② 暗號格 → 節目格 / ③ 表演白環 + 笑臉,下面寫三句固定字串;**ready 為 true 才畫**「Z 鍵帽 + 按 Z 繼續」(640 附近、y 674,閃爍週期 1 秒)。最多畫 6 隻;自己 clip 在畫布內 |
| 場所卡 | `drawPlaceCard(ctx, s)` | x, y, place, note, selected | 同上一版 |
| 地磚 | `drawTile(ctx, s)` | x, y, dungeon, kind, nest | 同上一版(見習草地無特殊地形) |
| 果樹 / 果子 / 爆炸桶 / 爆炸 / 回復泉 / 傳送陣 / 裂牆 | `drawFruitTree` / `drawFruit` / `drawKeg` / `drawBlast` / `drawFountain` / `drawPortal` / `drawCrackWall` | 同 interface | 同上一版(見上一版說明:有果 = 金虛線圈 + 大果;fuse = 半徑 radius 紅虛線預警圈;gone = 平面焦痕;full = 石盆藍水 + 浮心;1 號圓環 / 2 號菱形;cracks 0~2) |
| 馴獸師 | `drawTamer(ctx, s)` | x, y, facing, weapon, dashing, blink, lassoing, slowed, hidden | 同上一版 |
| **頭上心列(新)** | `drawHeartBar(ctx, s)` | x, y, hearts, maxHearts, fx, fxT, fxDur, delta | 一排心以 (x,y) 置中,每顆 14×13、間距 16(maxHearts > 12 時 13;仍超過 200 寬就再壓縮);**滿 = 粉紅實心 + 深描邊;少掉 = 深底 + 粉紅細框(空心)**。不透明度: fx none 或 fxT ≥ fxDur → 0.4;fxT < 0.75·fxDur(=1.5 秒)→ 1;之後線性淡回 0.4。**hurt**(前 0.5 秒): 第 hearts ~ hearts+delta−1 顆各噴 4 片紅色三角碎片往下掉並淡出,整排左右抖(±3,漸弱);**heal**(前 0.6 秒): 第 hearts−delta ~ hearts−1 顆依序(每顆晚 0.12 秒)從空變滿並彈一下,每顆冒 3 顆綠色圓光點往上飄。表外 fx → none |
| 野生魔物 | `drawWildMonster(ctx, s)` | x, y, species, hp, maxHp, hit, weak, stunLeft, stunDur, lassoed, casting, move, moveT, moveDur, dir | 同上一版(stunDur 不影響畫面,只看 stunLeft > 0) |
| 準備捕捉圈 / 套索 / 技能 / 武器特效 | `drawCaptureRing` / `drawLasso` / `drawHazard` / `drawWeaponFx` | 同 interface | 同上一版 |
| 地下城卡 / 地下城結算 | `drawDungeonCard` / `drawDungeonResult` | 同 interface | 同上一版 |
| **怪物庫格** | `drawBankSlot(ctx, s)` | x, y, species, num, level, onStage, selected, canUpgrade | **效果標籤拿掉,頭像放大(半徑 29,中心 y−10)**;「N 號」左下、「Lv N」右下(y+38);onStage = 底亮一階 + 淺青框 + 左上淺青打勾章;未上台 = 頭像 55%;canUpgrade = 右上金圈往上箭頭;level 3 = 右上金底「MAX」+ Lv 字變金;selected = 金框 |
| **說明面板** | `drawMonsterInfo(ctx, s)` | x, y, where, species, num, level, desc, effect, total, totalMax, upgrade | 840×170。**左半**(x−420~x−120): 頭像圓 (x−378, y−44) 半徑 32、「種類名 N 號」(x−336, y−60)、下方亮黃「Lv N」徽章;desc 從 (x−408, y+10) 起最多 2 行(行高 26、寬 280),**〔 〕裡的字畫成圓角標籤(底色依 effect: ignite 紅橘、calm 藍、其他紫;白字;〔 〕不畫)**;where setup 時 (x−408, y+66)「上台 total / totalMax」(滿額變金),shop 不畫。x−120 一條直分隔線。**右半升級面板**: 標頭列 y−62 — 未滿級:「升級」(x−100)+ 亮黃「Lv a → Lv b」徽章(x−44 起)+ 金色費用膠囊(錢幣 +「N 金」;affordable false 時紅框紅字);maxed:金底「已滿級」徽章 + 「Lv N」徽章,不畫費用。表格 3 列(y−26 / y+4 / y+34,列間淡分隔線): label 灰(x−100);before 白(x+40);before 與 after 都有字 → 灰「→」(x+178)+ after 綠(x+200);before 空 → 綠向上箭頭(x+48)+ after 綠從 x+62 起;note 非空 → 整列只畫 note 灰字(x+40)。底部 (x−100, y+68): 鍵帽 + 「升級這隻」(setup 鍵帽 X、shop 鍵帽 Z);**不能升(maxed 或 affordable false)整組 40% 灰** |
| 捲動記號 | `drawScrollMark(ctx, s)` | x, y, dir | 同上一版 |
| **節目單一列** | `drawCueRow(ctx, s)` | x, y, style, index, cue, program, complete, selCell, current, t, dur, switching, locked | 同上一版。**locked(row 樣式)= 整列極暗底 + 灰虛線框 + 灰「第 N 個」+ 灰鎖頭 +「見習後開放」,不畫暗號格 / 節目格**。圖示換成新代號(見 §6.1);表外代號畫虛線空框 |
| **選擇面板** | `drawPickerPanel(ctx, s)` | layer, options, index | 固定 x 760~1220,標題列 y 60~110(「什麼時候?」/「演什麼?」),**第 i 行 y 110 + 44i ~ 154 + 44i**: 左邊圖示(x 792)、name 17px(上)+ desc 13px 灰(下);desc 空時 name 單行置中;clear 畫灰叉。選中行金框。最多 13 行,最下緣 y 682 |
| 節目浮字 | `drawBannerFx(ctx, s)` | x, y, cue, program, t, dur | 同上一版(用新代號的名稱與圖示) |
| 表演場 | `drawShowArena(ctx)` | — | 同上一版 |
| **表演魔物** | `drawShowMonster(ctx, s)` | x, y, species, level, rage, **angryLow**, marks, markLeft, markDur, mode, target, frozenLeft, frozenDur, performing, performT, performDur, fx, fxT, fxDur, looseT, looseDur, move, moveT, moveDur, dir | 同上一版;怒氣條紅段起點改讀 **angryLow**(怒氣 ≥ angryLow 整條變紅)。looseDur 不影響畫面(只看 looseT < 1.0 畫速度線) |
| 圍欄 / 觀眾 / 失控演出 | `drawFence` / `drawVisitor` / `drawLooseFx` | 同 interface | 同上一版 |
| **表演結算** | `drawShowResult(ctx, s)` | sat, gold, fameGain, tallyT, tallyDur, bestChain, loose, timeLeft, tutorial | 固定 (640,390) 760×460。標題同上一版(loose →「失控! 表演提前結束」+「剩 N 秒」;否則「收場!」;tutorial 加「見習 」)。**笑臉 +「觀眾滿意度」+ 右側 sat(桃色 34px);一條豎線分岔箭頭到兩列: 錢幣「金幣」+N(金,40px)、星「名聲」+N(淡藍,40px),兩個 N 都 = round(值 × tallyT / tallyDur),跳動中一起脈動**;分隔線下「最長連鎖 N」;跳完才畫「按 Z 繼續」 |
| **商店分頁** | `drawShopTab(ctx, s)` | x, y, tab, current, selected | **tab: char 角色 / cue 暗號 / program 節目 / monster 怪物**;current = 亮底 + 底線(暗號頁青、節目頁粉、其他白);selected = 金框 |
| **商店項目** | `drawShopItem(ctx, s)` | x, y, item, cost, level, owned, equipped, affordable, selected, fameReq, fameLocked | 同上一版版面;item 換成新清單(暗號 10、節目 10),說明文字照規格第 58、59 條表與第 84 條(棍棒「Z 敲擊」) |
| 商店說明列 / 按鈕 | `drawShopDetail` / `drawButton` | 同 interface | 同上一版 |
| **飄字** | `drawFloatText(ctx, s)` | x, y, text, kind, t, dur | 同上一版;**kind sat = 桃色 18px(原 fame);angryFame = 淡粉字 + 紅底框 22px(原 redFame)**;表外 kind → gold |
| **總結算** | `drawResultPanel(ctx, s)` | rep, goldEarned, bestChain, days, bank, stars | 同上一版,**標題「十天結算」;行程 10 格一排**(每格 62×72、中心 x = 640 − 306 + 68i: 上方天數數字 + 場所圖示,沒有的畫「—」) |
| **HUD** | `drawHud(ctx, s)` | phase, day, dayMax, gold, rep, **sat, cheerLeft, cheerDur**, ropes, ropeMax, weapon, xCdLeft, xCdMax, timeLeft, timeMax, dungeon, message | 見 §8 |
| **新手教學** | `drawTutorial(ctx, s)` | stage, **kind**, text, keys, pressed, x, y, bx, by, side, phase, appearT, appearDur, doneT, doneDur | 見 §9。stage 不影響畫面(所有階段同一套) |

**畫面文字歸屬**(照介面): 除了新手教學以外,所有字都由美術在上表的函式裡畫,RD 不要另外畫字。新手教學泡泡的文字、按鍵圖示、打勾也全部由美術畫(RD 只傳 state)。

### 5.1 暗號 / 節目圖示(新代號)

| 代號 | 圖示 |
|---|---|
| wait 過 6 秒 | 時鐘 |
| **perf1 有人表演** | 灰點 + 白色表演環 + 下方白點 |
| **angry1 任一怪物生氣**(原 red1) | 一團大火 + 下方白點 |
| **angry3 三隻怪物生氣**(原 red3) | 三團小火 |
| **half 一半生氣** | 圓左半生氣紅、右半灰 |
| cold / mark3 / chain3 / multi3 | 同上一版 |
| **target1 有人當標靶** | 紫準星 + 下方白點 |
| **frozen1 有人被凍住** | 小冰塊包一隻 + 下方白點 |
| **gain30 滿意度 +30** | 笑臉 + 往上箭頭 |
| **all 全體表演** | 三個灰點各帶白色表演環 |
| spot / ice / pep / scatter / mob / lull / shuffle | 同上一版 |
| **tutti 大合奏** | 音符,**符頭改成生氣紅**(和全體表演分開) |
| **bull 標靶秀** | 藍點(冷靜那隻)套紫準星 |
| **still 全場定格** | 大冰塊包三隻 |
| **cheer 歡呼** | 笑臉 + 一圈放射短線 |

## 6. 尺寸表

| 物件 | 尺寸(以中心為準) | 備註 |
|---|---|---|
| Title / Calendar / Intermission | 1280×720 全畫面 | Title、Intermission 自己 clip(魔物從畫面外走進來) |
| PlaceCard | 360×420 | |
| Tile / Portal / CrackWall / FruitTree / Fountain | 60×60 | |
| Fruit | 30×30 | |
| Keg 本體 / 預警圈 | 60×60 / 260×260 | |
| Blast | 260×260 | |
| Tamer | 64×64;身體圓半徑 18 | |
| **HeartBar** | 心 14×13,間距 16(>12 顆 13);整排 ≤ 200×16;特效範圍 240×64(以 (x,y) 為中心) | 扣血碎片最低到 y+29,回血光點最高到 y−28 |
| WildMonster 本體 / 血條 | 72×72(戲法狸 90×90)/ 56×6 | |
| CaptureRing | 110×110 | |
| DungeonCard / DungeonResult / ShowResult | 360×440 / 760×460 / 760×460 | |
| **BankSlot** | 104×110;頭像圓半徑 29 中心 (0,−10) | 上台勾章 (−38,−41) 半徑 10 |
| **MonsterInfo** | 840×170;左半 300×170、右半 540×170 | 表格列中心 y−26 / y+4 / y+34,列高 30 |
| ScrollMark | 40×14 | |
| **CueRow** row / mini | 680×64 / 200×46 | locked 也在 680×64 內 |
| **PickerPanel** | 460 × (50 + 44 × 選項數) | x 760~1220,y 60 起,13 行時到 y 682 |
| ShowMonster 本體 / 怒氣條 / 標記 / Lv | 同上一版 | |
| Fence / Visitor | 136×14 / 56×76 | |
| LooseFx | 橫幅 600×140 @ (640,300);爆發 160×160 | |
| ShopTab / ShopItem / ShopDetail | 220×50 / 380×90 / 1080×70 | |
| ResultPanel | 800×560 @ (640,390) | |
| Hud | 地下城 1280×100;其他 1280×50 | |
| **Tutorial** 主泡泡 / 附註 | 主: 本體 316×92(在 320×96 內)+ 尾巴;附註: 本體 296×56(在 300×60 內)+ 尾巴;鍵帽 34×34,間距 8 | 尾巴根部夾在 bx ± 130(附註 ± 120) |

自測: 假 ctx 追蹤變換矩陣與 arc 實際角度,算外接框。每個 interface 函式都呼叫(含 26 個教學階段 × 出現 / 完成各進度、附註泡泡、心列 hurt / heal 每 0.05 秒、每個新暗號 / 節目圖示、locked 列、每種 upgrade 組合),共 3352 次: 不拋錯、save/restore 成對、有 size 的都在框內,壞狀態(空物件、NaN、表外字串)也不拋錯。另外掃過 interface 每個 state 欄位都有被讀到(只有 WildMonster.stunDur、ShowMonster.looseDur、Tutorial.stage 刻意不用,見上表)。

## 7. 固定版位(照介面 notes)

- drawTitle、drawCalendar、**drawIntermission** 畫滿全畫面(這三個畫面不畫 HUD)。
- drawDungeonResult、drawShowResult 固定在 (640,390) 760×460;drawResultPanel 固定在 (640,390) 800×560。
- drawPickerPanel 固定在 x 760~1220,標題列 y 60~110,**第 i 行 y 110 + 44i**。
- drawLooseFx 的「失控!」橫幅固定在 (640,300);爆發畫在傳入的 x,y。
- drawFloatText 的 kind unlock 由 RD 傳 (640,110)。
- **drawHeartBar 由 RD 傳 (馴獸師 x, 馴獸師 y − 46)**。

## 8. HUD 版面

- 上排(y 25),每個 phase: 左邊天數(day 0 金色「見習日」,其他「第 N / dayMax 天」);timeMax > 0 時 x 470~730 時間條 +「N 秒」(剩不到 20% 轉紅);右邊金幣 x 1000、名聲 x 1132。
- **phase = show**: 上排 x 182 笑臉 +「觀眾滿意度 N」(桃色,最寬 160);**cheerLeft > 0 時緊接在右邊畫桃色膠囊「歡呼 ×1.5」+ 膠囊下方剩餘時間小條(80×5,cheerLeft / cheerDur)**,整組不超過 x 470。
- **地下城(高 100)**: 上排另有地下城名 x 160。**下排不再畫心**: 捕獸繩第 k 條圓圈中心 (40 + 22k, 74)(有的亮、用掉的暗,最多 10 條);武器框 x 634~814、y 56~92(圖示 + 名稱;**xCdMax > 0 時才在 x 780 畫 X 鍵冷卻格**: 冷卻中深色扇形蓋住剩餘、可用時白框;棍棒整格不畫);message 置中在 (1040, 74)(含「繞」「站住」時用捕捉萊姆色)。
- 其他 phase(高 50): message 置中在 x 640(有時間條時移到 x 880)。

## 9. 新手教學泡泡(drawTutorial)

- **主泡泡(kind main)**: 淺紙底 #fff6e0 + 3px 深墨框 + 深字 20px;本體以 (bx,by) 為中心 316×92。有 keys 時文字在上 (by − 21)、鍵帽一列在下 (by + 22);沒有 keys 時文字置中。文字最寬 296px,超過會縮字。
- **附註泡泡(kind note,第 6 階段)**: 比主泡泡小一號、顏色較淡 — 本體 296×56、淡紙底 92% 不透明、2px 灰墨框 #5a6274、灰字 15px、陰影較淺;**不畫按鍵**(就算 keys 有東西也不畫)。RD 固定傳 bx,by = (250,150)、x,y = (130,92)、side down,尾巴從上緣指向捕獸繩列下緣。畫在 HUD 之上。
- 尾巴: side up 從下緣出發,down 從上緣出發;根部 x 夾在 bx ± 130(附註 ± 120),尖端停在目標前 6px。目標在錯的一側時改成垂直短尾,不反折。
- 鍵帽 34×34: up / down / left / right 圓角箭頭;z / x 字母;circle 繞圈箭頭。pressed 裡的鍵 = 綠底白字 + 右上白底綠勾。最多 6 個。
- 彈出(appearT/appearDur): 以尾巴根部為錨,0.6 倍放大到 1 倍(ease-out,**不過衝**,全程不超出 320×96 / 300×60),透明度 0.4 → 1。
- 完成特效(phase done,所有階段共用): 泡泡蒙淡綠;鍵帽依序跳一下(每個晚 0.08 秒);綠色打勾章前 30% 由小彈大(主泡泡在右上 (bx+132, by−20),附註縮成 0.72 倍在右側 (bx+126, by));10%~80% 六顆金星從勾章噴開(夾在泡泡框內);最後 35% 整個淡出。spec 表各階段的專屬特效(繩列閃、「收服!」放大等)統一用這一套,物件本身的反應交給各物件既有回饋。

## 10. 判讀約定(請 RD 照這個傳)

- Hazard 投射物 radius = 判定半徑(外緣);icebeam 從施放者中心起算,width 以中線左右各半。爆炸桶 / 爆炸 radius = 外緣。
- WildMonster: stunLeft > 0 或 lassoed 都畫暈眩;eat + 暈眩時畫暈眩。
- ShowMonster: charge 不畫標記;stopped 照畫怒氣條和標記。**怒氣門檻欄位是 angryLow(舊名 redLow 已不讀)**。
- HeartBar: delta 是正整數;hurt 時 hearts 已是扣完的值,heal 時 hearts 已是補完的值。fxDur 傳 2.0(美術用 0.75·fxDur 當 1.5 秒點)。
- MonsterInfo: upgrade.rows 固定 3 項;字串全由 RD 組好,美術不組字。〔 〕標籤顏色看 effect,沒傳時用該種預設效果。
- Calendar: 今天 = 第 day−1 格;day 0 沒有亮格;log[i] 是 dungeon / show 才畫圖示,空字串只畫叉(已過的格)。
- 動畫小細節(齒輪刃旋轉、暈眩星、虛線流動、無敵閃爍、結算「按 Z」閃爍)用 `performance.now()`;開始畫面與見習過場的動畫全部由 t 驅動。
- 時長常數(一次性特效都由傳入的 t/dur 決定): 節目浮字 0.8、飄字 1(unlock 1.5)、反應 0.5、表演 0.5、冰柱預警 0.7 / 生效 0.2、引信 0.6、爆炸 0.3、失控收場 2.5、觀眾逃走 1.5、教學出現 0.25 / 完成 0.6、日曆翻頁 0.6、心列特效 2.0(扣血 0.5、回血 0.6)、閃爍「按 Z」週期 1 秒(開始畫面、見習過場)/ 0.7 秒亮 0.3 秒暗(結算畫面)。

## 11. 繪製層級(照介面「繪製順序」,美術沒有額外要求)

地下城: 地磚 / 裂牆 → 回復泉 → 傳送陣 → 果樹 → 果子 → 技能預警 → 準備捕捉圈 → 爆炸桶 → 野生魔物 → 套索 → 馴獸師 → 武器特效 → 投射物 → 爆炸 → **頭上心列** → 飄字 → 教學主泡泡 → HUD → **教學附註泡泡**。
