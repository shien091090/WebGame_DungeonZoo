# 來馬戲團看一點大場面(打磨版第 3 輪)— 美術規格(style.md)

> RD 只讀這份。`index.html` 必須宣告 `<meta charset="utf-8">`(art.js 內有中文字串)。
> 函式名、參數、state 欄位全部照 `interface.json`, 一個不多一個不少。所有函式自己 save / restore; 傳入表外值不會拋錯, 會畫成下表寫的「預設」。
> 沿用打磨第 2 輪的色票、形狀語言與物件畫法。本輪只改規格「本輪改動」表牽涉到美術的部分: 7 天(日曆 / 總結算)、拿掉等級與升級面板(怪物庫格、說明面板、表演魔物、總結算怪物庫)、商店 3 分頁、拿掉長鞭、節目單 4 列、爆炸桶拿掉焦痕、**出口(新)**、**出口詢問框(新)**、**HUD 收服列(新)**、**熱度表(新)**、**沸騰警示(新)**、**觀眾依熱度段動作**、地下城結算多「提早收工」、飄字拿掉升級。

## 1. 邏輯畫布

1280 × 720(`window.Art.canvas = { width: 1280, height: 720 }`)。

## 2. 色票(`window.Art.palette`)

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg / bg2 | #141821 / #1c2230 | 背景 |
| panel / panelHi / line | #232a3a / #2f3a52 / #465372 | 面板底 / 亮一階(上台的格、選中的卡) / 面板框 |
| text / textDim / outline | #eef2f8 / #9aa6bd / #0d1018 | 文字 / 次要字 / 物件與文字的深色描邊 |
| select | #ffd24a | **游標 / 選擇框**(全遊戲唯一的選擇長相: 金色 4px 框 + 外光);出口詢問框選中的鈕也用它 |
| tamer | #ffd24a | 馴獸師本體、他打出的武器特效、被劍打回去的投射物外環 |
| hittable | rgba(255,210,74,0.8) 虛線 | **你打得到 / 打得破的場景物**: 裂牆的框、有果子的果樹 |
| capture | #c6f046 | 只給「可捕捉 / 捕捉進度 / 收服」(HUD 收服列頭像框也用) |
| rope | #f0e2b8 | 套索繩 |
| danger | #ff3b4a | 傷害地形紅框、爆炸桶預警圈、爆炸、失控鋸齒、破損圍欄、心列扣血碎片、**熱度「沸騰」段、沸騰警示邊框** |
| ignite / calm / special | #ff6a2c / #3fa0ff / #b46cff | 惹生氣(點燃)/ 冷靜(澆熄)/ 特殊效果(標靶·凍住·變走);說明面板〔 〕標籤也用這三色 |
| cue / program | #5ad1e6 / #ff8fc8 | 暗號格與圖示 / 節目格與圖示(商店「暗號」「節目」分頁底線也用) |
| gold / rep | #ffc83a / #9fd8ff | 金幣(錢幣圖示)/ 名聲(星形圖示) |
| sat | #ffd6a8 | 觀眾滿意度(笑臉圖示): HUD、飄字 kind sat、表演結算、暗號「滿意度 +30」、節目「歡呼」 |
| rageLow / rageMid / rageRed | #8390aa / #ffb43a / #ff3b4a | 怒氣條: < 50 / 50~生氣門檻 / 生氣段 |
| ice | #bfeaff | 冰塊、減速霜環 |
| portal1 / portal2 | #3fe0ff / #ff7ad9 | 傳送陣 1 號 / 2 號 |
| lily / monkey / beetle / parrot / penguin / tanuki | #8fe3a0 / #e8782c / #2fb8a8 / #ec4f9c / #3a5a9a / #a88a62 | 六種魔物本體主色 |
| heart / heal | #ff5d7a / #5cf0a0 | 心 / 頭上心列的回血光點 |
| fruit | #ffe34a | 誘餌果子 |
| bush / bushHi | #2f8a3e / #58c06a | 草叢圓葉、馴獸師躲藏時蓋在身上的葉 |
| water | #5ab4ff | 回復泉水 |
| tutorBg / tutorInk / tutorOk | #fff6e0 / #1a2030 / #2fb060 | **只給新手教學泡泡**: 淺紙底、深字、按過 / 完成的綠 |

不在 palette 物件裡、但固定用的顏色:
- 場所色(場所卡、日曆 / 總結算的場所圖示、見習過場的帳篷): 地下城 #58b86a、表演 #e0a040、商店 #7a9ae8。
- **熱度段色(新, 只在熱度表)**: 安靜 #8fa3c0 灰藍、掌聲 #f2e45a 檸檬黃、歡呼 #ff9a3a 橘、沸騰 #ff3b4a(= danger)。
- **出口門洞天光(新)**: #ffeebb → #e8c070 漸層(只在出口格)。
- 地下城結算「提早收工」標題字 #c8e6ff。

**張力(請製作人用這幾幀驗收)**:
- **熱度段色 vs 怒氣條**: 熱度表的歡呼橘 #ff9a3a 與怒氣條中段 #ffb43a、惹生氣 #ff6a2c 同在暖橘一帶。熱度表只在 HUD 中央(x 420~860), 怒氣條只在魔物頭上, 位置不重疊; 段名文字(安靜 / 掌聲 / 歡呼 / 沸騰!)是主通道, 顏色是第二通道。沸騰刻意用危險紅: 它和失控同一件事的前兆。最難分的一幀: 熱度 75~89%(歡呼)且場上多隻在 50~79(怒氣中段)。
- **掌聲黃 #f2e45a vs 游標金 #ffd24a**: 表演場沒有游標, 兩者不會同框; 商店 / 布置畫面不畫熱度表。
- 沿用: 觀眾滿意度(笑臉桃色)vs 金幣(錢幣金)主通道 = 圖示形狀; 名聲 = 星形淡藍, 和滿意度刻意分開; 回血綠 vs 捕捉萊姆只在心列 0.6 秒出現; 六種魔物主通道 = 剪影; 泉水 vs 1 號傳送陣 = 石盆 + 紅心 vs 平地環 + 點數; 果子 vs 馴獸師 = 尺寸 + 剪影。
- **出口 vs 牆 / 傳送陣**: 出口 = 拱門框 + 亮門洞 + 白色圓頭往上箭頭; 牆 = 整塊實心磚; 傳送陣 = 平地上的環 / 菱 + 點數。主通道是剪影(拱門), 門洞亮度是第二通道。

## 3. 形狀語言

圓潤扁平 + 深色描邊。**尖角 / 鋸齒只給危險**(傷害地形、爆炸桶火焰記號、失控鋸齒、失控橫幅、心列扣血的三角碎片);其他記號一律圓頭,草叢是圓葉、教學鍵帽是圓角、出口箭頭與沸騰觀眾的驚嘆號都是圓頭。**虛線框 + 由內長大的填色 = 「快生效了」**(冰柱預警、傳送陣啟動、爆炸桶預警圈)。**金色實線框 = 游標**,**金色虛線 = 你打得到的場景物**。**白色外擴環 = 表演**。**圖示下方一個白點 = 「1 隻」**。**畫面邊緣的紅色脈動 = 沸騰(快失控)**, 不用在其他地方。教學泡泡和全畫面所有面板的明暗相反(淺紙底 + 深字),只給教學用。

## 4. 理念落實

- P0 辨識度先於好看: 魔物種類靠剪影分,狀態靠方向與外形分,顏色只當第二通道。新的出口格用「拱門 + 亮門洞 + 往上箭頭」的剪影和牆、傳送陣分開;熱度段以段名文字為主、段色為輔。
- P1 視覺權重跟著決策迫切度走: 頭上心列平時 40% 不透明;熱度表平時是暗底板,只有沸騰才轉紅脈動(那時玩家最該看它);HUD 收服列頭像只有 26px 小框,不和捕獸繩搶。
- P2 規則上存在的東西,畫面上就要存在: 見習日鎖住的第 3、4 列照畫鎖頭 +「見習後開放」;出口剛選「留下」、暫時不會再問的狀態有獨立外觀(門洞變暗、箭頭變灰);熱度條上 50 / 75 / 90 三條刻度和 4 段底色常駐;棍棒沒有 X 技,HUD 整個 X 格不畫。
- P3 一個意義一種長相: 觀眾滿意度 = 笑臉;標靶 = 紫準星;凍住 = 冰塊;表演 = 白外擴環;收服 = 萊姆框(HUD 收服列、地下城結算頭像列同一個);危險紅在熱度表裡只給「沸騰」那一段,和沸騰警示邊框、失控同色。
- P4 關鍵區分走兩條通道: 熱度 4 段 = 段名 + 段色;觀眾 4 種反應 = 姿勢(坐 / 拍手 / 站起舉手 / 跳更高 + 單手狂揮)+ 記號(沸騰才有汗珠與驚嘆號、緊張臉);出口可觸發 vs 暫停 = 門洞亮 / 暗 + 箭頭白 / 灰 + 箭頭有無上下浮動。
- P7 每個元素都要掙得版面: 怪物格拿掉等級後只留「N 號」;說明面板升級區拿掉後整塊給介紹文字(字級放大),不另補東西;表演 HUD 的「表演中…」退成計時下方 14px 灰字。
- P9 以最混亂的那一刻驗收: 二十隻大亂鬥時反應都長在本體框內;觀眾沸騰動作全部在 56×76 框內,不會跳進場地;沸騰警示只畫外緣 40px。
- P13 事件要排隊: 節目浮字固定 (640,180)、上架 / 開放提示固定 (640,110);熱度換段的彈跳只在熱度表本身,不另外冒字。
- P15 回饋強度和份量成正比: 單隻反應 < 表演 < 節目發動 < 爆炸桶 < 沸騰警示(全畫面邊緣)< 失控;HUD 收服頭像的彈一下只在自己 26×26 格內。
- P17 進度的圖形與數字分工: 熱度表數字給精確 %,橫條與刻度給「離下一段還有多遠」;歡呼、X 冷卻、等待條只畫圖形。
- P18 重要資訊不能只存在一瞬間: 每天去了哪留在日曆 7 格與總結算 7 格行程;這趟收服的魔物在地下城裡就常駐在 HUD 收服列,結算時再列一次。
- P19 資訊貼著物件: 心列在馴獸師頭上;教學泡泡尾巴指著目標(停在目標前 6px);第 15、16 階段泡泡尾巴指著熱度表下緣。
- P21 示意圖選對錯理解會分岔的例子: 本輪沒有說明頁。見習過場的三步圖解沿用,狀態都合規則。

## 5. 物件表

座標一律是**物件中心**(地下城已換算成畫面座標)。例外: `drawButton` 的 x,y 是左上角;固定版位的函式見 §7。**粗體** = 本輪新增或改過。

| 物件 | 函式 | state 欄位 | 各狀態視覺 |
|---|---|---|---|
| 背景 | `drawBackground(ctx, s)` | scene | 深藍黑漸層 + 淡斜紋 + 依場景的淡色光暈;dresult / sresult / result 整片壓暗 60% + 暗角。表外 scene → 無光暈 |
| 開始畫面 | `drawTitle(ctx, s)` | t | 遊戲名「來馬戲團看一點大場面」+ 舞台 + 魔物遊行(火柴猴丟迴旋火柴);「Z 鍵帽 + 按 Z 開始」閃爍週期 1 秒(每秒前 0.62 秒顯示) |
| **日曆過場** | `drawCalendar(ctx, s)` | day, dayMax, t, dur, log | 桌曆翻頁同上一版。**下方 7 格排一排**(格 92×84、中心 x = 260 + 120i、y 610): 已過(i < day−1)= 場所圖示 + 白叉;今天(i = day−1)= 金框外光脈動 +「今天」;未來暗。右側 (1150, 610)「共 7 天」。day 0 沒有亮格。dur 不影響畫面(翻頁固定 0.6 秒) |
| 見習過場 | `drawIntermission(ctx, s)` | t, ready, monsters | 同上一版(帳篷 + 走向舞台的隊伍 + 三步圖解;ready 才畫「按 Z 繼續」) |
| 場所卡 | `drawPlaceCard(ctx, s)` | x, y, place, note, selected | 同上一版 |
| 地磚 | `drawTile(ctx, s)` | x, y, dungeon, kind, nest | 同上一版 |
| 果樹 / 果子 / 回復泉 / 傳送陣 / 裂牆 / 爆炸 | `drawFruitTree` / `drawFruit` / `drawFountain` / `drawPortal` / `drawCrackWall` / `drawBlast` | 同 interface | 同上一版 |
| **爆炸桶** | `drawKeg(ctx, s)` | x, y, dungeon, mode, fuseT, fuseDur, radius | ok = 桶;fuse = 桶閃紅 + 半徑 radius 紅虛線預警圈(由內長大的紅填色, 填滿 = 爆炸)。**gone 已拿掉**: 炸掉後 RD 不呼叫;表外 mode → ok |
| **出口(新)** | `drawExit(ctx, s)` | x, y, dungeon, armed | 60×60 格內: 該地下城地板 + 石砌拱門框(牆色)+ 門洞 + 門洞裡往上的台階 + 白色圓頭往上箭頭。**armed true** = 門洞是暖黃天光漸層、門洞描亮邊、箭頭白色並上下浮動;**armed false** = 門洞暗灰、邊框灰、箭頭灰且不動 |
| **出口詢問框(新)** | `drawExitPrompt(ctx, s)` | choice, t | 全畫面壓暗 + 面板 560×240 中心 (640,400):「是否離開地下城?」(640,330, 32px)、小字「會直接進入結算」(640,372, 灰);「離開」鈕中心 (520,470)、「留下」鈕中心 (760,470), 各 180×56。**choice 0 → 離開選中、1 → 留下選中**(表外值 → 1);選中的鈕 = 金底深字 + 金框外光(和 drawButton 選中同一個長相)。t 0~0.2 秒: 壓暗由淡到濃、面板 0.9 → 1 倍、透明度 0.3 → 1 |
| 馴獸師 | `drawTamer(ctx, s)` | x, y, facing, weapon, dashing, blink, lassoing, slowed, hidden | 同上一版;**weapon 只剩 club / sword / spear**(表外 → club) |
| 頭上心列 | `drawHeartBar(ctx, s)` | x, y, hearts, maxHearts, fx, fxT, fxDur, delta | 同上一版(滿 = 粉紅實心;少掉 = 空心框;平時 0.4 不透明;hurt 紅碎片往下 + 整排抖;heal 依序填滿 + 綠光點往上) |
| 野生魔物 | `drawWildMonster(ctx, s)` | x, y, species, hp, maxHp, hit, weak, stunLeft, stunDur, lassoed, casting, move, moveT, moveDur, dir | 同上一版(stunDur 不影響畫面, 只看 stunLeft > 0) |
| 準備捕捉圈 / 套索 / 技能 | `drawCaptureRing` / `drawLasso` / `drawHazard` | 同 interface | 同上一版 |
| **武器特效** | `drawWeaponFx(ctx, s)` | x, y, weapon, move, shape, angle, spread, radius, length, width, t, dur | 同上一版;**shape circle 已拿掉**(表外 shape → arc) |
| 地下城卡 | `drawDungeonCard(ctx, s)` | x, y, dungeon, open, condition, selected | 同上一版 |
| **地下城結算** | `drawDungeonResult(ctx, s)` | reason, captures, kills, gold | 同上一版;**reason exit → 標題「提早收工」(淡藍白)**;time「時間到」白、down「倒下了」紅粉、tutorial「見習完成!」金;表外 → time |
| **怪物庫格** | `drawBankSlot(ctx, s)` | x, y, species, num, onStage, selected | 頭像半徑 29 中心 (0,−10);**「N 號」置中在 y+38(等級與能升級記號已拿掉)**;onStage = 底亮一階 + 淺青框 + 左上淺青打勾章;未上台 = 頭像 55%;selected = 金框 |
| **說明面板** | `drawMonsterInfo(ctx, s)` | x, y, species, num, desc, effect, total, totalMax | **840×170 整塊介紹**: 左側頭像圓 (x−340, y) 半徑 48;右側文字區 x−270 ~ x+390: 第一行「種類名 N 號」(x−270, y−52, 26px);desc 從 (x−270, y−8) 起最多 2 行(19px、行高 30、寬 660),〔 〕裡的字畫成圓角標籤(底色依 effect: ignite 紅橘、calm 藍、target / freeze / warp 紫;白字;〔 〕不畫);最下一行「上台 total / totalMax」(x−270, y+58, 20px, 滿額變金)。表外 effect → 該種預設效果 |
| 捲動記號 | `drawScrollMark(ctx, s)` | x, y, dir | 同上一版 |
| **節目單一列** | `drawCueRow(ctx, s)` | x, y, style, index, cue, program, complete, selCell, current, t, dur, switching, locked | 同上一版;**index 0~3**(畫成「第 index+1 個」);locked(row)= 整列極暗 + 灰虛線框 + 鎖頭 +「見習後開放」 |
| 選擇面板 / 節目浮字 / 表演場 | `drawPickerPanel` / `drawBannerFx` / `drawShowArena` | 同 interface | 同上一版 |
| **表演魔物** | `drawShowMonster(ctx, s)` | x, y, species, rage, angryLow, marks, markLeft, markDur, mode, target, frozenLeft, frozenDur, performing, performT, performDur, fx, fxT, fxDur, looseT, looseDur, move, moveT, moveDur, dir | 同上一版;**不再畫 Lv**。怒氣條紅段起點讀 angryLow(固定 80)。looseDur 不影響畫面(只看 looseT < 1.0 畫速度線) |
| 圍欄 / 失控演出 | `drawFence` / `drawLooseFx` | 同 interface | 同上一版 |
| **觀眾** | `drawVisitor(ctx, s)` | x, y, side, i, mode, mood, t, fleeT, fleeDur | 座椅常駐。**mode watch 依 mood**(相位 = t × 頻率 + i × 0.37, 16 人錯開):**quiet** = 坐著, 約每 2.6 秒眨一次眼;**clap** = 坐著, 雙手在胸前開合(每秒約 2.4 下), 合起那一下冒三條白短線, 微笑;**cheer** = 站起(身體上移 5~9px 跳動)、雙手高舉輕擺, 張嘴笑;**frenzy** = 跳得更高更快(上移 4~11px)、一隻手大力揮, 另一側頭邊冒白色圓頭驚嘆號、臉頰掛汗珠往下滑、緊張臉(大白眼小瞳孔 + 波浪嘴)。上側觀眾面向場地看得到臉, 下側背對(只看到頭髮, 姿勢照畫)。**flee** = 同上一版(往外跑、縮小淡出, fleeT/fleeDur);**empty** = 只剩座椅。i 表外 → 由 x 推座位;mood 表外 → quiet;flee / empty 忽略 mood。全部在 56×76 框內 |
| **熱度表(新)** | `drawHeatMeter(ctx, s)` | x, y, heat, tier, t, tierT, tierDur | 以 (x,y) 為中心 420×42(RD 固定傳 (640,25)): 底板 396×34 暗底;左「熱度」灰字 + 大字「N%」(N = round(heat), 段色);中間橫條 184×12(x−84 ~ x+100): 底下淡淡鋪 4 段色(0~50 / 50~75 / 75~90 / 90~100)、填色長度 = heat、顏色 = 目前段色;50 / 75 / 90 白刻度上下突出;右邊段名(安靜 / 掌聲 / 歡呼 / 沸騰!, 段色)。**tier 決定段名與顏色, 不用 heat 重算**。換段彈跳: tierT < tierDur 時整個表放大到 1.05 倍、段名再多放大 0.2 倍(sin 曲線)。**frenzy**: 底板疊紅色脈動、框線轉紅加粗, 週期 0.8 秒(讀 t)。表外 tier → quiet |
| **沸騰警示(新)** | `drawHeatAlert(ctx, s)` | t | 畫面四周 40px 紅色漸層(外濃內淡)+ 最外緣 4px 紅框, 不透明度 0.18 ~ 0.68 隨 t 以 0.8 秒為週期脈動。不碰場地中央 |
| 表演結算 | `drawShowResult(ctx, s)` | sat, gold, fameGain, tallyT, tallyDur, bestChain, loose, timeLeft, tutorial | 同上一版 |
| **商店分頁** | `drawShopTab(ctx, s)` | x, y, tab, current, selected | **tab: char 角色 / cue 暗號 / program 節目**(怪物分頁已拿掉, 表外 → char);current = 亮底 + 底線(暗號頁青、節目頁粉、角色白);selected = 金框 |
| **商店項目** | `drawShopItem(ctx, s)` | x, y, item, cost, level, owned, equipped, affordable, selected, fameReq, fameLocked | 同上一版;**item 沒有 whip**(表外 item → 只畫名稱 / ?)。level 只對強化(attack / armor / ropeBag)畫「已買 N」 |
| 商店說明列 / 按鈕 | `drawShopDetail` / `drawButton` | 同 interface | 同上一版 |
| **飄字** | `drawFloatText(ctx, s)` | x, y, text, kind, t, dur | 同上一版;**levelUp 已拿掉**(表外 kind → gold) |
| **總結算** | `drawResultPanel(ctx, s)` | rep, goldEarned, bestChain, days, bank, stars | **標題「七天結算」;行程 7 格一排**(每格 62×72、中心 x = 640 − 252 + 84i: 天數數字 + 場所圖示, 沒有的畫「—」);**怪物庫只畫頭像 +「×count」(不畫等級)** |
| **HUD** | `drawHud(ctx, s)` | phase, day, dayMax, gold, rep, sat, cheerLeft, cheerDur, ropes, ropeMax, **caught**, weapon, xCdLeft, xCdMax, timeLeft, timeMax, dungeon, message | 見 §8 |
| 新手教學 | `drawTutorial(ctx, s)` | stage, kind, text, keys, pressed, x, y, bx, by, side, phase, appearT, appearDur, doneT, doneDur | 見 §9。stage 不影響畫面(1~23 所有階段同一套) |

**刻意不讀的欄位**(全檔掃過 interface 每個 state 欄位, 只有這三個沒被讀到): `drawWildMonster.stunDur`、`drawShowMonster.looseDur`、`drawTutorial.stage`。

**畫面文字歸屬**(照介面): 除了新手教學以外,所有字都由美術在上表的函式裡畫,RD 不要另外畫字。新手教學泡泡的文字、按鍵圖示、打勾也全部由美術畫(RD 只傳 state)。出口詢問框的「離開」「留下」由 drawExitPrompt 自己畫, 不另呼叫 drawButton。

### 5.1 暗號 / 節目圖示

同上一版(wait 時鐘、perf1 灰點白環 + 白點、angry1 大火 + 白點、angry3 三團小火、half 半紅半灰圓、cold、mark3、chain3、multi3、target1 紫準星 + 白點、frozen1 小冰塊 + 白點、gain30 笑臉 + 上箭頭;all 三灰點白環、spot、ice、pep、tutti 紅符頭音符、scatter、mob、lull、bull 藍點套紫準星、still 大冰塊包三隻、shuffle、cheer 笑臉 + 放射短線)。表外代號畫虛線空框。

## 6. 尺寸表

| 物件 | 尺寸(以中心為準) | 備註 |
|---|---|---|
| Title / Calendar / Intermission | 1280×720 全畫面 | Title、Intermission 自己 clip |
| PlaceCard | 360×420 | |
| Tile / Portal / CrackWall / FruitTree / Fountain / **Exit** | 60×60 | Exit 拱門框 26 半寬、門洞 17 半寬 |
| Fruit | 30×30 | |
| Keg 本體 / 預警圈 | 60×60 / 260×260 | |
| Blast | 260×260 | |
| **ExitPrompt** | 壓暗 1280×720;面板 560×240 @ (640,400);鈕 180×56 @ (520,470) / (760,470) | 彈出只縮不放 |
| Tamer | 64×64;身體圓半徑 18 | |
| HeartBar | 心 14×13,間距 16(>12 顆 13);整排 ≤ 200×16;特效 240×64 | |
| WildMonster 本體 / 血條 | 72×72(戲法狸 90×90)/ 56×6 @ (x, y−46)(戲法狸 y−55) | |
| CaptureRing | 110×110 | |
| DungeonCard / DungeonResult / ShowResult | 360×440 / 760×460 / 760×460 | 結算面板框線內縮 1.25px, 含線寬剛好 760×460 |
| BankSlot | 104×110;頭像圓半徑 29 中心 (0,−10) | 上台勾章 (−38,−41) 半徑 10 |
| **MonsterInfo** | 840×170;頭像圓半徑 48 @ (x−340, y);文字區 x−270 ~ x+390 | |
| ScrollMark | 40×14 | |
| CueRow row / mini | 680×64 / 200×46 | |
| PickerPanel | 460 × (50 + 44 × 選項數) | x 760~1220, y 60 起 |
| ShowMonster 本體 / 怒氣條 / 標記 | 64×64(戲法狸 80×80)/ 60×8 @ (x, y−44)(狸 y−52)/ 直徑 8 間距 11 @ y−56(狸 y−64) | 不再畫 Lv |
| Fence | 136×14 | |
| **Visitor** | 56×76(x ±28、y −38 ~ +38) | 頭頂最高 −35(沸騰跳起時)、驚嘆號最高 −37 |
| **HeatMeter** | 420×42 @ (640,25);底板 396×34;橫條 184×12 @ x−84 ~ x+100 | 彈跳 1.05 倍 + 沸騰 3px 框線仍在框內 |
| **HeatAlert** | 1280×720 的外緣 40px | |
| LooseFx | 橫幅 600×140 @ (640,300);爆發 160×160 | |
| ShopTab / ShopItem / ShopDetail | 220×50 / 380×90 / 1080×70 | |
| ResultPanel | 800×560 @ (640,390) | |
| Hud | 地下城 1280×100;其他 1280×50 | 收服頭像 26×26 |
| Tutorial 主泡泡 / 附註 | 主: 本體 316×92 + 尾巴;附註: 本體 296×56 + 尾巴;鍵帽 34×34,間距 8 | 尾巴根部夾在 bx ± 130(附註 ± 120) |

自測(Node vm + 會追蹤變換矩陣、clip 與 arc 實際角度的假 ctx): 每個 interface 函式都呼叫(含 23 個教學階段 × 出現 6 格 + 完成 13 格進度、附註泡泡出現 / 完成、心列 hurt / heal 每 0.05 秒、觀眾 16 座位 × 5 種 mood × 3 種 mode 每 0.07 秒、熱度表 5 段 × 彈跳每 0.05 秒 × 6 種熱度、出口兩態、出口詢問框 0~0.5 秒、HUD 10 種 phase × 收服 0 / 1 / 5 / 10 / 11 / 25 隻), 共 19181 次: 不拋錯、save/restore 成對、有 size 的都在框內;壞狀態(空物件、null、NaN、表外字串)也不拋錯;表演 HUD 中段 x 420~860 沒有任何繪製。

## 7. 固定版位(照介面 notes)

- drawTitle、drawCalendar、drawIntermission 畫滿全畫面(這三個畫面不畫 HUD)。
- drawDungeonResult、drawShowResult 固定在 (640,390) 760×460;drawResultPanel 固定在 (640,390) 800×560。
- **drawExitPrompt 固定**: 壓暗全畫面 + 面板中心 (640,400) + 兩鈕 (520,470) / (760,470)。不讀 x,y。
- **drawHeatAlert 固定**畫滿全畫面外緣;**drawHeatMeter 讀 RD 傳的 (x,y)**(固定 (640,25))。
- drawPickerPanel 固定在 x 760~1220,標題列 y 60~110,第 i 行 y 110 + 44i。
- drawLooseFx 的「失控!」橫幅固定在 (640,300);爆發畫在傳入的 x,y。
- drawFloatText 的 kind unlock 由 RD 傳 (640,110)。
- drawHeartBar 由 RD 傳 (馴獸師 x, 馴獸師 y − 46)。

## 8. HUD 版面

- 上排(y 25),每個 phase: 左邊天數(day 0 金色「見習日」,其他「第 N / dayMax 天」);右邊金幣 x 1000、名聲 x 1132。
- **phase = show(本輪改)**: 中段 x 420~860 不畫任何東西(留給熱度表)。左: 天數(最寬 118)→ x 158 笑臉 +「觀眾滿意度 N」(桃色 19px,最寬 140)→ cheerLeft > 0 時緊接右邊桃色膠囊「歡呼 ×1.5」+ 下方剩餘時間小條(80×5),整組右緣 ≤ 414。右: **計時移到 x 872~988**: 上半時間條 70×14(y 7~21)+「N 秒」16px;下半 message 14px 灰字置中 (930, 37)。
- **地下城(高 100)**: 上排另有地下城名 x 160、時間條 x 470~730 +「N 秒」。下排: 捕獸繩第 k 條圓圈中心 (40 + 22k, 74)(有的亮、用掉的暗,最多 10 條);**收服列(新)**: 「收服」灰小字中心 (300, 74);第 k 隻頭像 26×26 圓角框(萊姆邊、深底、該種剪影)中心 (346 + 28k, 74);長度 ≤ 10 全畫,> 10 時畫前 9 個、第 10 格 (598, 74) 畫萊姆字「+N」(N = 長度 − 9);空陣列時第 0 格畫淡萊姆虛線空框;**收服那一刻最新的頭像從 0.6 倍彈到 1 倍並閃一圈白框(0.3 秒)**——介面沒有收服時刻欄位,美術自己記住上一幀的 caught 長度,變長時起跳(只是畫面記憶,不影響遊戲;caught 變短 = 新的一趟, 不彈)。武器框 x 634~814、y 56~92(圖示 + 名稱;xCdMax > 0 時才在 x 780 畫 X 鍵冷卻格;棍棒整格不畫);message 置中在 (1040, 74)(含「繞」「站住」時用捕捉萊姆色)。
- 其他 phase(高 50): 有時間時時間條 x 470~730;message 置中在 x 640(有時間條時移到 x 880)。

## 9. 新手教學泡泡(drawTutorial)

同上一版, 所有 23 階段共用一套:
- **主泡泡(kind main)**: 淺紙底 #fff6e0 + 3px 深墨框 + 深字 20px;本體以 (bx,by) 為中心 316×92。有 keys 時文字在上 (by − 21)、鍵帽一列在下 (by + 22);沒有 keys 時文字置中。文字最寬 296px,超過會縮字。第 15、16 階段(熱度、太熱)RD 傳 bx,by = (640,110)、x,y = (640,46)、side down: 泡泡在熱度表正下方, 尾巴從上緣指到熱度表下緣前 6px, 畫在 HUD 之上。
- **附註泡泡(kind note,第 6 階段)**: 本體 296×56、淡紙底 92% 不透明、2px 灰墨框、灰字 15px、陰影較淺;不畫按鍵。RD 固定傳 bx,by = (250,150)、x,y = (130,92)、side down。畫在 HUD 之上。
- 尾巴: side up 從下緣出發,down 從上緣出發;根部 x 夾在 bx ± 130(附註 ± 120),尖端停在目標前 6px。目標在錯的一側時改成垂直短尾,不反折。
- 鍵帽 34×34: up / down / left / right 圓角箭頭;z / x 字母;circle 繞圈箭頭。pressed 裡的鍵 = 綠底白字 + 右上白底綠勾。最多 6 個。
- 彈出(appearT/appearDur): 以尾巴根部為錨,0.6 倍放大到 1 倍(不過衝),透明度 0.4 → 1。
- 完成特效(phase done,所有階段共用): 泡泡蒙淡綠;鍵帽依序跳一下;綠色打勾章前 30% 由小彈大;10%~80% 六顆金星噴開(夾在泡泡框內);最後 35% 淡出。spec 表各階段的專屬特效(熱度表閃、草叢晃等)統一用這一套,物件本身的反應交給各物件既有回饋。

## 10. 判讀約定(請 RD 照這個傳)

- Hazard 投射物 radius = 判定半徑(外緣);icebeam 從施放者中心起算,width 以中線左右各半。爆炸桶 / 爆炸 radius = 外緣。
- WildMonster: stunLeft > 0 或 lassoed 都畫暈眩;eat + 暈眩時畫暈眩。
- ShowMonster: charge 不畫標記;stopped 照畫怒氣條和標記。
- HeartBar: delta 是正整數;hurt 時 hearts 已是扣完的值,heal 時 hearts 已是補完的值。
- MonsterInfo: 〔 〕標籤顏色看 effect,沒傳時用該種預設效果。
- Calendar: 今天 = 第 day−1 格(索引從 0 起算);day 0 沒有亮格;log[i] 是 dungeon / show 才畫圖示,空字串只畫叉(已過的格)。格數 = dayMax(本輪 7)。
- **Exit: armed 只認 true**(undefined / false 都畫成暫停的暗門)。
- **ExitPrompt: choice 只認 0 = 離開**, 其他值一律當 1 = 留下(和規格預設一致)。
- **HeatMeter: 段名與顏色只看 tier**;heat 只決定橫條長度與「N%」。閒置時 tierT = tierDur(不彈)。
- **Visitor: 動作只看 t 與 i**(失控收場時 t 停住 → 動作也停住)。
- **Hud caught**: 依收服順序;收服列的「彈一下」靠美術比對上一幀長度(見 §8),RD 不用多傳東西。
- 動畫小細節(齒輪刃旋轉、暈眩星、虛線流動、無敵閃爍、出口箭頭浮動、結算「按 Z」閃爍、收服頭像彈跳)用 `performance.now()`;開始畫面、見習過場、觀眾、熱度表、沸騰警示由傳入的 t 驅動。
- 時長常數(一次性特效都由傳入的 t/dur 決定): 節目浮字 0.8、飄字 1(unlock 1.5)、反應 0.5、表演 0.5、冰柱預警 0.7 / 生效 0.2、引信 0.6、爆炸 0.3、失控收場 2.5、觀眾逃走 1.5、教學出現 0.25 / 完成 0.6、日曆翻頁 0.6、心列特效 2.0(扣血 0.5、回血 0.6)、**出口詢問框彈出 0.2(美術自訂, 讀 t)**、**熱度換段彈跳 0.4(讀 tierT/tierDur)**、**沸騰脈動週期 0.8(熱度表與警示邊框都讀各自的 t)**、**收服頭像彈跳 0.3(美術自訂)**、閃爍「按 Z」週期 1 秒(開始畫面、見習過場)/ 0.7 秒亮 0.3 秒暗(結算畫面)。

## 11. 繪製層級(照介面「繪製順序」)

- 地下城: 地磚 / 裂牆 → **出口** → 回復泉 → 傳送陣 → 果樹 → 果子 → 技能預警 → 準備捕捉圈 → 爆炸桶 → 野生魔物 → 套索 → 馴獸師 → 武器特效 → 投射物 → 爆炸 → 頭上心列 → 飄字 → 教學主泡泡 → HUD → 教學附註泡泡 → **出口詢問框(最上層)**。
- 表演場: 表演場 → 技能預警 → 表演魔物(charge 以外)→ 投射物 → 節目浮字 → 圍欄 / 觀眾 → 失控那隻 → 失控演出 → **沸騰警示** → 縮小節目單 → 飄字 → HUD → **熱度表** → 教學泡泡(第 15、16 階段指著熱度表)。
