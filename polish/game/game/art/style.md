# 來動物園看一點大場面(打磨版)— 美術規格(style.md)

> RD 只讀這份。`index.html` 必須宣告 `<meta charset="utf-8">`(art.js 內有中文字串)。
> 函式名、參數、state 欄位全部照 `interface.json`, 一個不多一個不少。所有函式自己 save / restore; 傳入表外值不會拋錯, 會畫成下表寫的「預設」。
> 沿用上一版(deepen-5 B 款「暗號節目單」)的色票、形狀語言與物件畫法; 爆炸桶、回復泉、爆炸、果樹、果子、草叢、馴獸師躲藏從 `ref-objects.js` 移植並改成本款的視覺語言(見 §4 最後一條)。上一版的 `drawSpeciesCard`、`drawSpeciesInfo`、`drawGuidePage` 已刪除。

## 1. 邏輯畫布

1280 × 720(`window.Art.canvas = { width: 1280, height: 720 }`)。

## 2. 色票(`window.Art.palette`)

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg / bg2 | #141821 / #1c2230 | 背景 |
| panel / panelHi / line | #232a3a / #2f3a52 / #465372 | 面板底 / 亮一階(上場的格、選中的卡) / 面板框 |
| text / textDim / outline | #eef2f8 / #9aa6bd / #0d1018 | 文字 / 次要字 / 物件與文字的深色描邊 |
| select | #ffd24a | **游標 / 選擇框**(全遊戲唯一的選擇長相: 金色 4px 框 + 外光) |
| tamer | #ffd24a | 馴獸師本體、他打出的武器特效、被劍打回去的投射物外環 |
| hittable | rgba(255,210,74,0.8) 虛線 | **你打得到 / 打得破的場景物**: 裂牆的框、有果子的果樹 |
| capture | #c6f046 | 只給「可捕捉 / 捕捉進度 / 收服」: 殘血血條、破心、準備捕捉圈、繞圈進度、收服飄字、結算頭像框 |
| rope | #f0e2b8 | 套索繩 |
| danger | #ff3b4a | 傷害地形紅框、爆炸桶預警圈、爆炸、失控鋸齒、破損圍欄、紅區 |
| ignite / calm / special | #ff6a2c / #3fa0ff / #b46cff | 激怒(點燃)/ 冷靜(澆熄)/ 特殊效果(標靶·凍結·變走) |
| cue / program | #5ad1e6 / #ff8fc8 | 暗號格與圖示 / 節目格與圖示 |
| gold / rep | #ffc83a / #9fd8ff | 金幣 / 名聲 |
| rageLow / rageMid / rageRed | #8390aa / #ffb43a / #ff3b4a | 怒氣條: < 50 / 50~紅區下限 / 紅區 |
| ice | #bfeaff | 冰塊、減速霜環 |
| portal1 / portal2 | #3fe0ff / #ff7ad9 | 傳送陣 1 號 / 2 號 |
| lily / monkey / beetle / parrot / penguin / tanuki | #8fe3a0 / #e8782c / #2fb8a8 / #ec4f9c / #3a5a9a / #a88a62 | 六種魔物本體主色 |
| heart | #ff5d7a | 心(HUD、回復泉、補心飄字) |
| fruit | #ffe34a | 誘餌果子(地上、樹上、魔物嘴邊同一個長相) |
| bush / bushHi | #2f8a3e / #58c06a | 草叢圓葉、馴獸師躲藏時蓋在身上的葉 |
| water | #5ab4ff | 回復泉水 |
| tutorBg / tutorInk / tutorOk | #fff6e0 / #1a2030 / #2fb060 | **只給新手教學泡泡**: 淺紙底、深字、按過 / 完成的綠 |

場所色(場所卡標題帶、日曆 / 總結算的場所圖示): 地下城 #58b86a、表演 #e0a040、商店 #7a9ae8。

**張力(沿用 + 本輪新增, 請製作人用這幾幀驗收)**:
- 六種魔物色排不開色輪(火柴猴 24° vs 戲法狸 34°)。種類辨識的主通道是**剪影**, 顏色只當第二通道(同上一版)。
- 回復泉水與傳送陣 1 號都在雪境, 都是冷藍。所以泉水改成較深的天藍 #5ab4ff(不用青), 而且泉的主通道是**石盆 + 浮著的紅心**, 傳送陣是**平地上的環 / 菱形 + 點數**。最難分的一幀: 雪境中房, 泉與 1 號傳送陣同時出現在畫面上。
- 果子用檸檬黃, 和馴獸師的金色(45°)只差 7°。果子是半徑 10 的小圓加綠葉, 馴獸師是 18 的大圓加披肩加武器, 所以主通道是尺寸與剪影。最難分的一幀: 馴獸師站在剛掉落的果子旁。

## 3. 形狀語言

圓潤扁平 + 深色描邊。**尖角 / 鋸齒只給危險**(傷害地形、爆炸桶火焰記號、失控鋸齒、失控橫幅);其他記號一律圓頭,草叢是圓葉、教學鍵帽是圓角。**虛線框 + 由內長大的填色 = 「快生效了」**(冰柱預警、傳送陣啟動、爆炸桶預警圈)。**金色實線框 = 游標**,**金色虛線 = 你打得到的場景物**。馴獸師造成的東西是金白色;會打到人的東西是深色底 + 效果色環。**教學泡泡和全畫面所有面板的明暗相反**(淺紙底 + 深字),這個長相只給教學用。

## 4. 理念落實

- P0 辨識度先於好看: 魔物種類靠剪影分,狀態靠方向與外形分,顏色只當第二通道。四座地下城只換皮,危險地形(暗紅底 + 紅框 + 尖物)、減速地形(波浪紋)、草叢(圓葉叢)三套骨架不變。爆炸桶爆掉後畫成平面焦痕,不是立體的桶,一眼看得出「不在了」。
- P1 視覺權重跟著決策迫切度走: 地下城裡最亮的是會打到你的投射物外環、殘血的捕捉色、冰柱預警和爆炸桶的紅色預警圈;草叢和果樹壓在中明度。表演場地板壓低對比,怒氣條和紅區是場上最飽和的 UI。
- P2 規則上存在的東西,畫面上就要存在: 投射物、冰柱、武器範圍、爆炸的畫面邊界都等於判定邊界。爆炸桶點燃後畫出半徑 130 的預警圈(上一版經驗提過的缺口,這次介面給了 `fuseRange`)。裂牆 0 道裂痕也有金色虛線框。馴獸師躲草叢時用白虛線圈標出判定圓。果子正在被吃時有剩餘量環。
- P3 一個意義一種長相: 激怒紅橘 / 冷靜藍 / 特殊紫在怪物庫格子、商店、投射物和場上反應共用一套;暗號青 / 節目粉同理;「場所」三個圖示在場所卡、日曆、總結算長得一樣;果子在樹上、地上、魔物嘴邊是同一個長相;金色虛線只代表「你打得到」(裂牆、有果的樹)。
- P4 關鍵區分走兩條通道: 傳送陣 1 / 2 號 = 顏色 + 形狀;點燃 / 澆熄 = 顏色 + 方向;殘血 = 血條變捕捉色 + 身上破心 + 下垂眼;上場 = 淺青亮框 + 打勾章(沒上場的頭像 55% 半透明);red1 與 red3 = 一團大火 + 一個點 vs 三團小火。
- P7 每個元素都要掙得版面: 縮小節目單只畫圖示、不畫字;怒氣條不寫數字;結算面板只放規格點名的項目。
- P9 以最混亂的那一刻驗收: 二十隻大亂鬥時,所有反應都長在本體框內、只出現 0.5 秒;投射物一律深色底 + 環。失控收場其他魔物一起停住時,每隻都有灰罩、大白眼和驚嘆號,一眼看出全場凍結。
- P13 事件要排隊: 節目浮字固定在 (640,180),一次一塊;新地下城開放提示固定在 (640,110),和節目浮字不同畫面出現。
- P15 回饋強度和份量成正比: 單隻反應(0.5 秒、本體框內)< 表演(本體彈一下 + 白環外擴)< 節目發動(全寬浮字)< 爆炸桶(260 圓)< 失控(全畫面橫幅 + 爆發 + 觀眾逃走)。
- P17 進度的圖形與數字分工: HUD 時間條給「還剩多少」,數字給精確秒數;X 冷卻、等待條、凍結剩餘、套索時限、吃果進度都只畫圖形;表演結算的金幣用跳動數字。
- P18 重要資訊不能只存在一瞬間: 節目發動只閃 0.8 秒,但縮小節目單的框會停在下一列;每次收服的魔物都留在地下城結算的頭像列;每天去了哪留在日曆和總結算的行程列。
- P19 資訊貼著物件: 怒氣條、標記、Lv、血條、準備捕捉圈貼在魔物上;教學泡泡的尾巴指著目標(停在目標前 6px,不蓋住目標)。
- P21 示意圖選對錯理解會分岔的例子: 本輪沒有說明頁,這條不適用。開始畫面的遊行小景只用遊戲內畫法,狀態都合規則(火柴飛 0.7 秒後才折返)。

## 5. 物件表

座標一律是**物件中心**(地下城已換算成畫面座標)。例外: `drawButton` 的 x,y 是左上角;固定版位的函式見 §7。

| 物件 | 函式 | state 欄位 | 各狀態視覺 |
|---|---|---|---|
| 背景 | `drawBackground(ctx, s)` | scene | 深藍黑漸層 + 淡斜紋 + 依場景的淡色光暈(place 琥珀、select 綠、setup 粉 / 青、shop 藍);**dresult / sresult / result 整片壓暗 60% + 暗角**。表外 scene → 不加光暈 |
| 開始畫面 | `drawTitle(ctx, s)` | t | 全畫面: 夜色舞台 + 擺動聚光燈;遊戲名「來動物園看一點大場面」(74px 金字);六種魔物在舞台上由左往右走(火柴猴每秒跳一次,每 3 秒丟一根迴旋火柴);下方「Z 鍵帽 + 按 Z 開始」,閃爍週期 1 秒(每秒前 0.62 秒顯示) |
| 日曆過場 | `drawCalendar(ctx, s)` | day, dayMax, t, dur, log | 桌曆: 0~0.6 秒舊的一頁(前一天的字;day 1 的舊頁寫「見習日」,day 0 的舊頁空白)以頂端為軸往上翻走;之後今天的大字「第 N 天」/「見習日」由 1.18 倍縮回 1(0.2 秒)。下方 5 格: 已過的格(index < day−1)畫場所圖示 + 白叉;今天(index = day−1)金框外光脈動 +「今天」;未來暗。右側「共 dayMax 天」。day 0 沒有亮格 |
| 場所卡 | `drawPlaceCard(ctx, s)` | x, y, place, note, selected | 標題帶(場所色)+ 名稱、中央大場所圖示(地下城另有一隻火柴猴)、底部 note 小字;selected = 底亮一階 + 金框,未選 = 圖示 75%。表外 place → dungeon |
| 地磚 | `drawTile(ctx, s)` | x, y, dungeon, kind, nest | wall: 凸起石磚;pillar: 圓柱;floor: 平地(四關色不同,見習草地有圓頭小草);hurt: 暗紅底 + 紅框 + 尖物(鐘塔旋轉齒輪刃、雪境冰刺、其他尖刺);slow: 波浪紋;**bush: 地板上一叢 3×3 圓葉 + 淡綠框,葉間留暗縫**;nest = 米色虛線橢圓 + 兩顆蛋。表外 kind → floor;表外 dungeon → lake |
| 果樹 | `drawFruitTree(ctx, s)` | x, y, dungeon, hasFruit | 樹幹 + 三團圓樹冠(比牆亮、圓);hasFruit = 金色虛線圈 + 大果(打得落);false = 只剩小綠芽 |
| 果子 | `drawFruit(ctx, s)` | x, y, dungeon, eating, eatT, eatDur | 半徑 10 的黃果 + 綠葉;eating false = 外圈黃虛線慢轉(正在吸引魔物);eating true = 果子縮小(到 30%)+ 兩個咬痕 + 白色剩餘量環 |
| 爆炸桶 | `drawKeg(ctx, s)` | x, y, dungeon, mode, fuseT, fuseDur, radius | ok = 木桶(寬 44 = 判定直徑)+ 黑底火焰記號 + 引信;**fuse = 半徑 radius 的紅虛線預警圈(虛線流動)+ 紅色由中心長大,長滿 = 爆炸**,桶紅褐交替閃、抖、引信燒短冒火花;**gone = 平面焦痕 + 四片碎木(沒有立體的桶)**。表外 mode → ok |
| 爆炸 | `drawBlast(ctx, s)` | x, y, radius, t, dur | 半徑 radius 紅色實心圓(外緣 = 判定)+ 白外環 + 黃色核心外擴 + 十道放射線,0.3 秒淡出 |
| 回復泉 | `drawFountain(ctx, s)` | x, y, dungeon, full | full = 灰石盆 + 藍水 + 兩道噴泉 + 上下浮動的紅心;false = 暗石盆 + 泥色乾底 + 裂紋,沒有心 |
| 傳送陣 | `drawPortal(ctx, s)` | x, y, dungeon, id, charge, cooling | 1 號 = 青圓環 + 1 點;2 號 = 粉菱形環 + 2 點;charge 0~1 由中心長大的亮面;cooling = 40% + 灰虛線框。表外 id → 1 |
| 裂牆 | `drawCrackWall(ctx, s)` | x, y, dungeon, cracks | 暖色砌磚 + 金色虛線框;0 = 淡細縫、1 = 粗裂、2 = 十字裂 + 缺塊 + 碎屑 |
| 馴獸師 | `drawTamer(ctx, s)` | x, y, facing, weapon, dashing, blink, lassoing, slowed, hidden | 金色身體圓(半徑 18 = 判定)+ 白披肩 + 頭 + 武器朝面向;dashing = 殘影 + 淺青環;blink = 每 100ms 閃 30%;lassoing = 腰上萊姆繩圈;slowed = 冰色虛線環 + 雪花;**hidden = 本體 45% 透明 + 腳邊蓋五片圓葉 + 白虛線判定圓** |
| 野生魔物 | `drawWildMonster(ctx, s)` | x, y, species, hp, maxHp, hit, weak, stunLeft, stunDur, lassoed, casting, move, moveT, moveDur, dir | 剪影同上一版;hit = 整隻閃白;weak = 灰罩 + 下垂眼 + 破心 + 血條變捕捉色;stunLeft > 0 或 lassoed = 漩渦眼 + 三顆黃星繞頭;lassoed 另有腰間繩圈;casting = 紅橘虛線環 + 怒眉;hop / swoop / fadeOut / fadeIn 同上一版;**eat = 瞇眼 + 嘴邊一顆小果子**(暈眩時改畫暈眩)。表外 species → lily |
| 準備捕捉圈 | `drawCaptureRing(ctx, s)` | x, y, t, dur | 半徑 40 的環,捕捉色由 12 點鐘方向順時針填到 t/dur;上方寫「準備捕捉」 |
| 套索 | `drawLasso(ctx, s)` | x1, y1, x2, y2, progress, t, limit, len, maxLen | 同上一版: 繩越長越直,超過 75% 轉橘、超過 90% 變紅虛線;進度環半徑 42;時限白環半徑 49(剩不到 30% 轉紅) |
| 技能 | `drawHazard(ctx, s)` | x, y, kind, phase, radius, angle, length, width, t, dur, returning, reflected | 同上一版。投射物 = 判定圓內深底 + 效果色環;returning = 內圈白虛線;reflected = 外環金;icebeam warn = 紫虛線長方形 + 冰色由施放者往外長;active = 冰白光束。表外 kind → pollen |
| 武器特效 | `drawWeaponFx(ctx, s)` | x, y, weapon, move, shape, angle, spread, radius, length, width, t, dur | 同上一版(範圍 = 判定範圍;normal 米白、skill 金) |
| 地下城卡 | `drawDungeonCard(ctx, s)` | x, y, dungeon, open, condition, selected | 主題色標題帶 + 名稱、地格小景(鏡湖畫草叢、鐘塔 / 雪境畫傷害地形)、住民頭像 + 名;open = 萊姆勾 +「已開放」;未開放 = 頭像 45% + 鎖頭 + condition(最多兩行);selected = 金框。meadow 只畫一隻火柴猴 |
| 地下城結算 | `drawDungeonResult(ctx, s)` | reason, captures, kills, gold | 固定 (640,390) 760×460。標題: time「時間到」(白)/ down「倒下了」(粉紅)/ tutorial「見習完成!」(金);「收服」+ 頭像列(每格半徑 29、捕捉色框,10 個以上換第二排,最多 20 個);沒有收服時寫「這趟沒有收服」;「打倒 N 隻」「金幣 +N」;「按 Z 繼續」閃爍。表外 reason → time |
| 怪物庫格 | `drawBankSlot(ctx, s)` | x, y, species, num, level, effect, onStage, selected, canUpgrade | 頭像、「N 號」(左下)、「Lv N」(右下)、效果膠囊(底部);**onStage = 底亮一階 + 淺青框 + 左上淺青打勾章**;未上場 = 頭像 55%、暗框;canUpgrade = 右上金色圓圈 + 往上箭頭;level 3 = 右上金底「MAX」小標(取代箭頭)+ Lv 字變金;selected = 金框。effect 表外 → 用該種預設效果 |
| 說明面板 | `drawMonsterInfo(ctx, s)` | x, y, species, num, desc, total, totalMax, lines | 840×170。左邊: 「種類名 N 號」、desc(最多兩行)、「上場 total / totalMax」(滿額時變金);直線分隔;右邊: lines 逐行(最多 4 行,第 1 行較大) |
| 捲動記號 | `drawScrollMark(ctx, s)` | x, y, dir | 40×14 圓角小三角,up 朝上 / down 朝下 |
| 節目單一列 | `drawCueRow(ctx, s)` | x, y, style, index, cue, program, complete, selCell, current, t, dur, switching | 同上一版;**新增 red1 圖示 = 一團大火 + 下方一個白點**(red3 = 三團小火);刪除 loose 圖示 |
| 選擇面板 | `drawPickerPanel(ctx, s)` | layer, options, index | 同上一版 |
| 節目浮字 | `drawBannerFx(ctx, s)` | x, y, cue, program, t, dur | 同上一版 |
| 表演場 | `drawShowArena(ctx)` | — | 同上一版 |
| 表演魔物 | `drawShowMonster(ctx, s)` | x, y, species, level, rage, redLow, marks, markLeft, markDur, mode, target, frozenLeft, frozenDur, performing, performT, performDur, fx, fxT, fxDur, looseT, looseDur, move, moveT, moveDur, dir | 同上一版(program 粉虛線地環、hold 粉雙環、target 紫準星、冰塊、表演白環、ignited / doused / special 反應)。**charge = 紅鋸齒外圈 + 怒眉 + 抖動,不畫標記;looseT < 1.0 時身後畫三條紅色速度線(y < 356 線在下方,否則在上方),1.0 秒後抖得更大。stopped = 灰罩 30% + 大白眼小瞳孔 + 頭邊白色驚嘆號形狀**(怒氣條和標記照畫) |
| 圍欄 | `drawFence(ctx, s)` | x, y, side, broken | 同上一版 |
| 觀眾 | `drawVisitor(ctx, s)` | x, y, side, mode, fleeT, fleeDur | 座椅常駐;watch = 坐著(上側看得到臉、下側看到後腦);**flee = 舉雙手 + 驚嚇線 + 張嘴,隨 fleeT/fleeDur 往外側移、縮到 35%、淡到 0,全程不出 56×76 框**;empty = 只剩座椅。表外 mode → empty |
| 失控演出 | `drawLooseFx(ctx, s)` | x, y, t, dur | 在 x,y 畫爆發: 0~0.5 秒紅鋸齒圈外擴(30→75)、全程紅鋸齒脈動圈(半徑約 42)、1.0~1.5 秒撞破圍欄時再一次黃白爆開。固定在 (640,300) 畫「失控!」鋸齒邊暗紅橫幅(76px 白字):前 0.15 秒由 0.8 倍長大,最後 0.3 秒淡出 |
| 表演結算 | `drawShowResult(ctx, s)` | fame, gold, tallyT, tallyDur, bestChain, loose, timeLeft, tutorial | 固定 (640,390) 760×460。標題: loose → 暗紅底「失控! 表演提前結束」+「剩 N 秒」;否則「收場!」;tutorial 加前綴「見習 」。「本場名聲 N」→ 向下箭頭 →「金幣 +N」(N = round(gold × tallyT / tallyDur),跳動中數字會脈動)、「最長連鎖 N」;tallyT ≥ tallyDur 才畫「按 Z 繼續」(閃爍) |
| 商店分頁 | `drawShopTab(ctx, s)` | x, y, tab, current, selected | 同上一版 |
| 商店項目 | `drawShopItem(ctx, s)` | x, y, item, cost, level, owned, equipped, affordable, selected, fameReq, fameLocked | 380×90。左邊 70×70 圖示框(武器 / 強化 / 暗號 / 節目圖示)、名稱、說明(美術依 item 內建規格第 84 條的文字);暗號另有青色「暗號」小標,節目另有粉色「節目」小標。右下: 裝備中(金)/ 已擁有 / 否則「N 金」(買不起時紅字);強化 level > 0 時左下加「已買 N」。**fameLocked = 整格 40% 暗 + 圖示上鎖頭 + 右下名聲星 +「名聲 N 解鎖」(名聲色)**;selected = 金框 |
| 商店說明列 | `drawShopDetail(ctx, s)` | x, y, lines | 1080×70,置中逐行(1~3 行,行數越多字越小);空陣列只畫底 |
| 按鈕 | `drawButton(ctx, s)` | x, y, w, h, label, selected | 圓角鈕;selected = 金底深字 |
| 飄字 | `drawFloatText(ctx, s)` | x, y, text, kind, t, dur | 上浮 32px,後 40% 淡出;gold 金 18px;fame 名聲色 18px;redFame 淡粉字 + 紅底框 22px;chain 淺青 22px;capture 萊姆勾章 + 萊姆字 24px;heal 紅心 + 粉字 20px;levelUp 淡金字 22px(前 15% 由 0.7 倍彈大);**unlock = 深底藍框大膠囊 + 兩側名聲星 + 26px 白字,前 10% 彈出、只上浮 8px、後 30% 淡出**。表外 kind → gold |
| 總結算 | `drawResultPanel(ctx, s)` | rep, goldEarned, bestChain, days, bank, stars | 固定 (640,390) 800×560:「五天結算」、3 顆星(亮 stars 顆)、總名聲 / 累計賺得金幣 / 最長連鎖 N 段、行程 5 格(第 N 天 + 場所圖示 + 名)、怪物庫(頭像 ×count +「最高 Lv maxLevel」,最多 6 種)、「按 Z 重來」閃爍 |
| HUD | `drawHud(ctx, s)` | phase, day, dayMax, gold, rep, showFame, hearts, maxHearts, ropes, ropeMax, weapon, xCdLeft, xCdMax, timeLeft, timeMax, dungeon, message | 見 §8 |
| 新手教學 | `drawTutorial(ctx, s)` | stage, text, keys, pressed, x, y, bx, by, side, phase, appearT, appearDur, doneT, doneDur | 見 §9 |

**畫面文字歸屬**(照介面): 除了新手教學以外,所有字都由美術在上表的函式裡畫,RD 不要另外畫字。新手教學泡泡的文字、按鍵圖示、打勾也全部由美術畫(RD 只傳 state)。

## 6. 尺寸表

| 物件 | 尺寸(以中心為準) | 備註 |
|---|---|---|
| Title / Calendar | 1280×720 全畫面 | Title 自己 clip 在畫布內(遊行魔物從畫面外走進來) |
| PlaceCard | 360×420 | |
| Tile / Portal / CrackWall / FruitTree / Fountain | 60×60 | 草叢圓葉最遠 ±27.6 |
| Fruit | 30×30;果半徑 10、剩餘量環 / 吸引圈半徑 13.5 | |
| Keg 本體 | 60×60;桶寬 44(= 判定半徑 22) | fuse 抖動 ±1.5,火花最高到 y − 29 |
| Keg 預警圈 | 260×260;半徑 = radius(外緣) | 只有 fuse 時畫 |
| Blast | 260×260;半徑 = radius(外緣) | |
| Tamer | 64×64;身體圓半徑 18 | hidden 的白虛線圈 = 判定圓 |
| WildMonster 本體 | 72×72(戲法狸 90×90);身體圓半徑 26(狸 27) | eat 的嘴邊果子半徑 6,在本體框內 |
| WildMonster 血條 | 56×6,中心 (x, y − 46)(狸 y − 55) | 在本體框外的頭上 |
| CaptureRing | 110×110;環半徑 40;字中心 y − 47 | |
| DungeonCard / DungeonResult / ShowResult | 360×440 / 760×460 / 760×460 | 結算固定在 (640,390) |
| BankSlot | 104×110 | 上場勾章 (−38,−41) 半徑 10;升級箭頭 / MAX 在右上 |
| MonsterInfo | 840×170 | |
| ScrollMark | 40×14(三角 30×10 + 線寬) | |
| CueRow row / mini | 680×64 / 200×46 | 同上一版 |
| PickerPanel | 460 × (50 + 52 × 選項數) | x 760~1220,y 60 起 |
| ShowMonster 本體 | 64×64(戲法狸 80×80);身體圓半徑 24 | stopped 的驚嘆號在 (21, −31~−14),本體框內,不碰怒氣條 |
| ShowMonster 怒氣條 / 標記 / Lv | 同上一版 | |
| Fence / Visitor | 136×14 / 56×76 | flee 全程在框內 |
| LooseFx | 橫幅 600×140,固定在 (640,300)(鋸齒邊最遠 ±292 × ±68);爆發 160×160,以 x,y 為中心(最遠半徑約 77) | |
| ShopTab / ShopItem / ShopDetail | 220×50 / 380×90 / 1080×70 | |
| ResultPanel | 800×560,中心 (640,390) | |
| Hud | 地下城 1280×100;其他 1280×50 | |
| Tutorial 泡泡 | 316×92 本體(在 320×96 內)+ 尾巴;鍵帽 34×34,間距 8 | 尾巴根部夾在 bx ± 130 |

自測: 假 ctx 會追蹤變換矩陣,arc 照實際角度取樣,也追蹤 clip。所有有 size 的函式都跑了全部狀態組合,加上 24 個教學階段 × 出現 / 完成各進度,總共 18836 次呼叫。外接框都在框內(沒算線寬),save/restore 都成對,餵壞狀態不會拋錯。唯一的例外是戲法狸 + swoop + charge 抖動的組合會超出約 1px,但規則上戲法狸不會撲擊,不會出現。

## 7. 固定版位(照介面 notes)

- drawTitle、drawCalendar 畫滿全畫面(這兩個畫面不畫 HUD)。
- drawDungeonResult、drawShowResult 固定在 (640,390) 760×460;drawResultPanel 固定在 (640,390) 800×560。
- drawPickerPanel 固定在 x 760~1220,標題列 y 60~110,第 i 行 y 110 + 52i。
- drawLooseFx 的「失控!」橫幅固定在 (640,300);爆發畫在傳入的 x,y。
- drawFloatText 的 kind unlock 由 RD 傳 (640,110)。

## 8. HUD 版面

- 上排(y 25),每個 phase 都有: 左邊是天數(day 0 寫金色「見習日」,其他寫「第 N / dayMax 天」);timeMax > 0 時中間 x 470~730 畫時間條 +「N 秒」(剩不到 20% 轉紅);右邊是金幣 x 1000、名聲 x 1132。
- phase = show 時,上排 x 182 多畫名聲星 +「本場名聲 N」(名聲色)。
- 地下城(高 100): 上排另有地下城名 x 160(主題色;見習草地是淡綠);下排(y 74)畫心(最多 14 顆)、繩圈(最多 10 條)、武器框 x 634~814(圖示 + 名 + X 鍵帽: 冷卻中用深色扇形蓋住剩餘、可用時白框、xCdMax 0 時是灰鍵),message 置中在 x 1040(含「繞」「站住」時用萊姆色)。
- 其他 phase(高 50): message 置中在 x 640(有時間條時移到 x 880)。

## 9. 新手教學泡泡(drawTutorial)

- 長相: 淺紙底 #fff6e0 + 3px 深墨框 + 深字(不描邊),整體和全畫面所有深色面板明暗相反,一眼分得出「這是教學」。這套教學色只給教學用。
- 位置: 泡泡本體以 (bx,by) 為中心,316×92;side up 時尾巴從泡泡下緣出發,down 時從上緣出發。尾巴根部的 x 夾在 bx ± 130,尖端停在目標 (x,y) 前 6px,不蓋住目標。如果目標在泡泡錯的那一側(RD 算錯),尾巴會改成垂直短尾,不會反折。
- 內容: 有 keys 時文字在上 (by − 21)、鍵帽一列在下 (by + 22) 置中;沒有 keys 時文字置中。文字最寬 296px,超過會縮字。
- 鍵帽 34×34: up / down / left / right 是圓角箭頭;z / x 是字母;circle 是繞圈箭頭(第 4 階段)。pressed 裡的鍵畫成綠底白字 + 右上白底綠勾。表外 key 不畫。最多 6 個。
- 彈出(appearT/appearDur): 以尾巴根部為錨點,從 0.6 倍放大到 1 倍並帶一點回彈,透明度 0.4 → 1。appearDur 是 0 時直接完整顯示。
- 完成特效(phase done,doneT/doneDur,所有階段共用一套): 泡泡蒙一層淡綠;鍵帽依序跳一下(每個晚 0.08 秒;第 1 階段就是「四鍵依序跳一下」);右上角的綠色打勾章在前 30% 由小彈大;第 10%~80% 六顆金星從勾章噴開(夾在泡泡框內);最後 35% 整個泡泡淡出。spec 表裡各階段的專屬特效(繩圈閃、「收服!」放大、卡片彈一下等)本輪統一用這一套,物件本身的反應交給各物件既有的回饋(例如收服飄字)。

## 10. 判讀約定(請 RD 照這個傳)

- Hazard 投射物的 radius = 判定半徑(外緣);icebeam 從施放者中心起算,width 以中線左右各半。爆炸桶 radius、爆炸 radius = 外緣。
- WildMonster: stunLeft > 0 或 lassoed 都畫暈眩;move eat 加上暈眩時畫暈眩。
- ShowMonster: mode 是 charge 時不畫標記(規則上已經失控);stopped 照畫怒氣條和標記(停在當下的樣子)。charge 那隻照介面畫在 Fence / Visitor 之後(介面已排好順序,上一版的繪製順序缺口已解決)。
- Calendar: 今天的格是 index = day − 1(第 i 項 = 第 i+1 天);day 0 沒有亮格。已過的格要畫圖示,log[i] 必須是 dungeon / show;空字串只畫叉。
- 動畫小細節(齒輪刃旋轉、暈眩星、虛線流動、無敵閃爍、開始畫面整段動畫的相位除外)用 `performance.now()`,RD 不用傳時間。開始畫面的動畫全部由 t 驅動。
- 時長常數(一次性特效都由傳入的 t/dur 決定,美術不寫死): 節目浮字 0.8、飄字 1(unlock 1.5)、反應 0.5、表演 0.5、冰柱預警 0.7 / 生效 0.2、引信 0.6、爆炸 0.3、失控收場 2.5(衝欄 0~1.0、破欄 1.0)、觀眾逃走 1.5、教學出現 0.25 / 完成 0.6、日曆翻頁 0.6(美術自訂,取自規格的「0~0.6 秒翻頁」)、閃爍「按 Z」週期 1 秒(開始畫面)/ 0.7 秒亮 0.3 秒暗(結算畫面的「按 Z」,美術自訂)。

## 11. 繪製層級(照介面「繪製順序」,美術沒有額外要求)

地下城的順序: 地磚 / 裂牆 → 回復泉 → 傳送陣 → 果樹 → 果子 → 技能預警 → 準備捕捉圈 → 爆炸桶(含預警圈,所以預警圈壓在魔物下面、不蓋住魔物)→ 野生魔物 → 套索 → 馴獸師 → 武器特效 → 投射物 → 爆炸 → 飄字 → HUD → 教學泡泡。
