# 暗號節目單 — 美術規格(style.md)

> RD 只讀這份。`index.html` 必須宣告 `<meta charset="utf-8">`(art.js 內有中文字串)。
> 所有函式自己 save / restore;傳入表外值不會拋錯,會畫成下表寫的「預設」。

## 1. 邏輯畫布

1280 × 720(`window.Art.canvas = { width: 1280, height: 720 }`)。

## 2. 色票(`window.Art.palette`)

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg / bg2 | #141821 / #1c2230 | 背景 |
| panel / panelHi / line | #232a3a / #2f3a52 / #465372 | 面板底 / 有上場的卡 / 面板框 |
| text / textDim / outline | #eef2f8 / #9aa6bd / #0d1018 | 文字 / 次要字 / 物件與文字的深描邊 |
| select | #ffd24a | **游標 / 選擇框**(全遊戲唯一的選擇長相: 金色 4px 框 + 外光) |
| tamer | #ffd24a | 馴獸師本體、他打出的武器特效、被劍打回去的投射物外環 |
| capture | #c6f046 | 可捕捉(殘血血條、破心記號)、準備捕捉圈、繞圈進度、收服飄字 |
| rope | #f0e2b8 | 套索繩 |
| danger | #ff3b4a | 傷害地形紅框、失控鋸齒圈、破損圍欄、紅區 |
| ignite | #ff6a2c | 激怒 / 點燃(效果標籤、火柴與齒輪外環、點燃火舌、失控標記) |
| calm | #3fa0ff | 冷靜 / 澆熄(效果標籤、花粉外環、澆熄水滴) |
| special | #b46cff | 特殊效果(標靶 / 凍結 / 變走標籤、羽毛紙牌冰柱外環、標靶準星、特殊反應星) |
| cue | #5ad1e6 | 暗號(條件)格與圖示 |
| program | #ff8fc8 | 節目格與圖示;被節目帶著走的地環 |
| gold / rep | #ffc83a / #9fd8ff | 金幣 / 名聲 |
| rageLow / rageMid / rageRed | #8390aa / #ffb43a / #ff3b4a | 怒氣條: < 50 / 50~紅區下限 / 紅區 |
| ice | #bfeaff | 冰塊、減速霜環 |
| portal1 / portal2 | #3fe0ff / #ff7ad9 | 傳送陣 1 號 / 2 號 |
| lily / monkey / beetle / parrot / penguin / tanuki | #8fe3a0 / #e8782c / #2fb8a8 / #ec4f9c / #3a5a9a / #a88a62 | 六種魔物本體主色 |
| heart | #ff5d7a | 心 |

色相 / 灰階(node 算):鈴蘭精 132°/194、火柴猴 24°/145、齒輪甲蟲 173°/141、標靶鸚鵡 331°/135、冰柱企鵝 220°/88、戲法狸 34°/142(低彩度);激怒 18°、冷靜 210°、特殊 269°、暗號 189°、節目 329°、捕捉 75°。

**張力(請製作人用這一幀驗收)**:
- 六種魔物色排不開色輪(火柴猴 24° vs 戲法狸 34°)。**種類辨識主通道 = 剪影**(鈴蘭: 倒鐘花 + 雙葉;猴: 圓頭 + 兩側圓耳 + 捲尾 + 火柴;甲蟲: 齒輪外緣圓殼;鸚鵡: 冠羽 + 鉤喙 + 長尾;企鵝: 直立橢圓 + 白肚 + 冰帽;狸: 黑眼罩 + 大條紋尾巴 + 頭頂葉),顏色是第二通道;戲法狸刻意壓低彩度與火柴猴分開。
- 激怒火舌(18°)長在火柴猴(24°)身上是最差組合 → 反應的主通道是**方向**(點燃 = 火舌從頭頂往上竄;澆熄 = 水滴從上往下落;特殊 = 紫星繞圈),火舌另帶黃色描邊。最差一幀: 火柴猴被火柴打中、fx = ignited。
- 節目色(329°)與標靶鸚鵡本體(331°)同色名 → 節目色只出現在**地上的環**與節目格 / 圖示,不填在魔物身上;鸚鵡是本體實心面。

## 3. 形狀語言

圓潤扁平 + 深色描邊;**尖角 / 鋸齒只給危險**(傷害地形、失控鋸齒圈),其他記號一律圓頭;**虛線框 + 由內長大的填色 = 「快生效了」**(冰柱預警、傳送陣啟動);**金框 = 游標**;馴獸師造成的東西是金白、會打到人的東西有深色底 + 效果色環。

## 4. 理念落實

- P0 辨識度先於好看: 魔物種類用剪影分、狀態用方向與外形分,色彩只當第二通道;地形三關換皮但危險(暗紅底 + 紅框 + 尖物)、減速(波浪紋)兩個骨不變。
- P1 視覺權重跟著決策迫切度走: 地下城裡最亮的是會打到你的投射物外環、殘血的捕捉色與冰柱預警;表演場地板壓到低對比,怒氣條與紅區是場上最飽和的 UI;節目浮字半透明深底、0.8 秒內淡出。
- P2 規則上存在的東西畫面上就要存在: 投射物畫面圓 = 判定半徑;冰柱長方形 = 判定長寬;攻擊特效的扇形 / 長方形 / 圓 = 判定範圍;裂牆 0 道裂痕也有金色虛線框;紅區下限刻度常駐;標記自動 −1 的倒數畫在最右那顆標記上;套索長度逼近上限繩轉紅變細。
- P3 一個意義一種長相: 激怒紅橘 / 冷靜藍 / 特殊紫在種類卡、商店、投射物外環、場上反應同一套;暗號 = 青、節目 = 粉在布置大列、縮小格、選擇面板、浮字、商店小標同一套;捕捉 = 萊姆綠只用在「可抓 / 抓的進度」。
- P4 關鍵區分走兩條通道: 傳送陣 1 / 2 號 = 顏色 + 形狀(圓環一點 / 菱形兩點);點燃 / 澆熄 = 顏色 + 方向;殘血 = 血條變捕捉色 + 身上破心 + 眼睛下垂;失控 = 紅 + 鋸齒外形。
- P7 每個元素都要掙得版面: 縮小節目單只畫圖示不畫字;怒氣條不寫數字(條 + 刻度已足夠);名字不重複標在場上魔物身上。
- P9 以最混亂的那一刻驗收: 二十隻大亂鬥時,所有反應都長在本體框內、只占 0.5 秒;投射物一律深色底 + 環,壓在任何魔物上都撿得到。
- P13 事件要排隊: 節目浮字固定在 (640,180) 一次一塊(RD 只會同時有一個);飄字只上浮 32px、後 40% 淡出。
- P15 回饋強度和份量成正比: 單隻反應(0.5 秒、本體框內)< 表演(本體彈一下 + 白環外擴)< 節目發動(全寬浮字)< 失控(紅鋸齒外圈 + 抖動)。
- P17 進度圖形與數字分工: HUD 時間條給「還剩多少」、數字給精確秒數;X 冷卻只畫圖形扇形(沒有數字);「過 6 秒」等待條只畫圖形;凍結剩餘畫在冰塊底的白條。
- P18 重要資訊不能只存在一瞬間: 節目發動只閃 0.8 秒,但縮小節目單的框會停在下一列,隨時看得出輪到哪一列。
- P19 資訊貼著物件: 怒氣條、標記、Lv、血條、準備捕捉圈都貼在魔物本體;等待進度條畫在「目前這列」的格子裡。
- P21 示意圖選對錯理解會分岔的例子: 第 3 頁畫 4 隻、只有 3 隻被淋(沒進紅區那隻沒反應);第 4 頁畫「4 個標記還在場上」與「衝欄時已沒有標記」兩刻。

## 5. 物件表

座標一律為**物件中心**(地下城已換算成畫面座標),例外: `drawButton` 的 x,y 為左上角。

| 物件 | 函式 | state 欄位 | 各狀態視覺 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | — | 深藍黑漸層 + 淡斜紋。表演場不用,改用 drawShowArena |
| Tile | `drawTile(ctx, s)` | x, y, dungeon, kind, nest | wall: 凸起石磚(上緣亮);pillar: 地板上的圓柱;floor: 平地(三關色不同);hurt: 暗紅底 + 紅框 + 尖物(鐘塔 = 旋轉齒輪刃、雪境 = 冰刺、鏡湖 = 尖刺後備);slow: 波浪紋(鏡湖淺灘藍 / 鐘塔機油黑紫 / 雪境雪堆白);nest = 米色虛線橢圓 + 兩顆蛋形。表外 kind → floor;表外 dungeon → lake |
| Portal | `drawPortal(ctx, s)` | x, y, dungeon, id, charge, cooling | 1 號 = 青色圓環 + 1 點;2 號 = 粉色菱形環 + 2 點;charge 0~1 由中心長大亮面(填滿 = 傳送);cooling = 整體 40% + 灰虛線框、不畫 charge。表外 id → 1 |
| CrackWall | `drawCrackWall(ctx, s)` | x, y, dungeon, cracks | 比一般牆暖亮的砌磚 + 金色虛線框(= 打得破);0 = 一道淡細縫;1 = 一條粗裂;2 = 十字裂 + 缺塊 + 碎屑 |
| Tamer | `drawTamer(ctx, s)` | x, y, facing, weapon, dashing, blink, lassoing, slowed | 金色身體圓(半徑 18 = 判定)+ 白披肩在背後 + 頭與帽 + 武器朝面向;dashing = 背後兩層殘影 + 淺青外環;blink = 每 100ms 30% 透明交替;lassoing = 腰上萊姆色繩圈;slowed = 冰色虛線環 + 雪花。表外 weapon → club;facing 夾到 0~7 |
| WildMonster | `drawWildMonster(ctx, s)` | x, y, species, hp, maxHp, hit, weak, stunLeft, stunDur, lassoed, casting, move, moveT, moveDur, dir | 剪影見 §2;hit = 整隻白色覆蓋;weak = 灰罩 + 下垂眼 + 右上破心(捕捉色)+ 血條變捕捉色;stunLeft > 0 或 lassoed = 漩渦眼 + 頭頂三顆黃星繞;lassoed 另加腰間繩圈;casting = 紅橘虛線環閃 + 怒眉;hop = 上跳最多 5px;swoop = 前傾 + 後方速度線;fadeOut / fadeIn = 透明度 1→0.2 / 0.2→1,低於 0.65 時加紫虛線輪廓(仍可被打);dir −1 朝左。血條在本體框外頭上。表外 species → lily |
| CaptureRing | `drawCaptureRing(ctx, s)` | x, y, t, dur | 半徑 40 的環,捕捉色從 12 點鐘順時針填 t/dur;上方「準備捕捉」字(美術畫) |
| Lasso | `drawLasso(ctx, s)` | x1, y1, x2, y2, progress, t, limit, len, maxLen | 繩從馴獸師到魔物,鬆時下垂、越長越直;len/maxLen > 0.75 轉橘變細、> 0.9 轉紅虛線;魔物周圍半徑 42 進度環(捕捉色, progress);外圈半徑 49 白細環 = 時限剩餘(剩 < 30% 轉紅) |
| Hazard | `drawHazard(ctx, s)` | x, y, kind, phase, radius, angle, length, width, t, dur, returning, reflected | 投射物: 判定圓內深色底 + 效果色環(花粉藍、火柴 / 齒輪紅橘、羽毛 / 紙牌紫),內畫本體(花粉團、旋轉火柴、旋轉齒輪、羽毛沿 angle、旋轉紙牌);returning(火柴)= 內圈白虛線;reflected = 外環換馴獸師金、本體變米白。icebeam warn = 紫虛線長方形 + 冰色填色由施放者往外長(t/dur 填滿 = 生效);active = 實心冰白光束 + 紫框,0.2 秒內淡到 30%。表外 kind → pollen |
| WeaponFx | `drawWeaponFx(ctx, s)` | x, y, weapon, move, shape, angle, spread, radius, length, width, t, dur | 範圍淡填色 + 掃過的亮邊;normal 米白 4px、skill 金色 6px(扇形再加內圈第二道);arc / circle / line 範圍 = 判定範圍;dash = 淺青殘影帶。淡出 1 − p² |
| DungeonCard | `drawDungeonCard(ctx, s)` | x, y, dungeon, open, condition, selected | 上方主題色標題帶 + 名稱、中段該地下城地格小景、兩隻住民頭像 + 名;open = 萊姆勾 +「已開放」;未開放 = 頭像 45% + 鎖頭 + condition 字串(最多兩行);selected = 金框 |
| SpeciesCard | `drawSpeciesCard(ctx, s)` | x, y, species, level, effect, owned, onStage, selected | 頭像、名、「Lv N」、效果膠囊(激怒紅 / 冷靜藍 / 標靶·凍結·變走紫)、「擁有 N」「上場 M」;onStage > 0 = 卡底亮一階、上場數金色;onStage 0 = 頭像 50%;selected = 金框。effect 空字串 → 用該種預設效果 |
| SpeciesInfo | `drawSpeciesInfo(ctx, s)` | x, y, species, desc, total, totalMax, lines | 左: 種類名、desc(最多兩行)、「上場 total / totalMax」(滿額變金);右: lines 逐行(最多 3 行,第 1 行較大) |
| CueRow | `drawCueRow(ctx, s)` | x, y, style, index, cue, program, complete, selCell, current, t, dur, switching | row: 「第 N 個」+ 暗號格(青條、「當」+ 圖示 + 名)→ 節目格(粉條、「演」+ 圖示 + 名),空格「—」;complete false = 整列 50% 暗;selCell 0 / 1 = 該格金框。mini: 左暗號圖示 → 右節目圖示(空格 = 虛線空框),不完整 = 圖示 35%;current = 底亮一階 + 金框;wait 且有 dur = 底部青色進度條;switching = 箭頭換成「…」 |
| PickerPanel | `drawPickerPanel(ctx, s)` | layer, options, index | 固定 x 760~1220;標題列(cue 青底「什麼時候?」/ program 粉底「演什麼?」);每行 圖示 + name(+ desc 小字);clear 行 = 灰叉;index 行 = 金框 |
| BannerFx | `drawBannerFx(ctx, s)` | x, y, cue, program, t, dur | 深底金框膠囊: 暗號圖示 + 暗號名(青)→ 節目圖示 + 節目名!(粉);前 12% 由 0.8 倍放大、後 25% 淡出 |
| ShowArena | `drawShowArena(ctx)` | — | 全畫布: 上下觀眾席階梯、場地 x 60~1220 y 146~566 低對比暗地板 + 淡同心圓、底部縮小節目單深底 y 666~720 |
| ShowMonster | `drawShowMonster(ctx, s)` | x, y, species, level, rage, redLow, marks, markLeft, markDur, mode, target, frozenLeft, frozenDur, performing, performT, performDur, fx, fxT, fxDur, chargeT, chargeDur, looseT, looseDur, move, moveT, moveDur, dir | 本體半徑 24(= 判定)。mode: roam 無記號;program = 腳下粉虛線環;hold(圍攻目標)= 腳下粉雙實線環;charge / loose = 紅鋸齒外圈 + 怒眉(chargeT > 0 撞欄中、loose 都會抖),不畫標記。target = 紫準星環 + 四短線;frozenLeft > 0 = 冰塊包住 + 底部白條 = 剩餘;performing = 本體彈 6% + 白環外擴;fx ignited = 頭頂三道火舌往上 / doused = 四滴藍水往下 / special = 四顆紫星繞圈(各 0.5 秒)。怒氣條、標記、Lv 見尺寸表。looseT / looseDur 目前不影響外觀(亂竄中一律同一長相) |
| Fence | `drawFence(ctx, s)` | x, y, side, broken | 完好 = 兩條木橫欄 + 兩端柱;broken = 橫欄斷成歪斜三截 + 紅虛線框 |
| Visitor | `drawVisitor(ctx, s)` | x, y, side, mode | 座椅常駐;watch = 坐著的人(衣色依位置 8 色輪替;上側看得到臉、下側是後腦);scared = 舉雙手 + 驚嚇線、張嘴;empty = 只剩座椅 |
| ShopTab | `drawShopTab(ctx, s)` | x, y, tab, current, selected | current = 底亮 + 白底線;selected = 金框 |
| ShopItem | `drawShopItem(ctx, s)` | x, y, item, cost, level, owned, equipped, affordable, selected, effect, maxed, locked | 左圖示框(武器 / 強化 / 暗號圖示 / 節目圖示 / 魔物頭像)、名稱、說明(美術依 item 內建 spec 第 73 條文字);暗號 / 節目另有青「暗號」/ 粉「節目」小標;怪物 = 效果膠囊 +「Lv N」。右下狀態: 裝備中(金)/ 已擁有 / 已滿級(金)/ 未收服 / 否則「N 金」(買不起紅字);強化 level > 0 加「已買 N」;locked = 整格暗 |
| ShopDetail | `drawShopDetail(ctx, s)` | x, y, lines | 置中逐行(1~3 行,行數多字變小);空陣列只畫底 |
| Button | `drawButton(ctx, s)` | x, y, w, h, label, selected | 圓角鈕;selected = 金底深字 |
| FloatText | `drawFloatText(ctx, s)` | x, y, text, kind, t, dur | 上浮 32px、後 40% 淡出;gold 金 18px;redGold 金字 + 紅底框 22px;chain 淺青 22px;repDown 灰紫、往**下**沉;capture 萊姆勾圈 + 萊姆字 24px。表外 kind → gold |
| ResultPanel | `drawResultPanel(ctx, s)` | rep, goldEarned, bestChain, bank, stars | 固定中心 (640,380):「五天結算」、3 顆星(stars 顆亮)、總名聲 / 累計賺得金幣 / 最長連鎖 N 段、怪物庫頭像 ×隻數 + Lv、「按 Z 重來」 |
| Hud | `drawHud(ctx, s)` | phase, day, dayMax, gold, rep, hearts, maxHearts, ropes, ropeMax, weapon, xCdLeft, xCdMax, timeLeft, timeMax, dungeon, message | 見 §7 |
| 說明頁示意圖 | `drawGuidePage(ctx, s)` | page, x, y, w, h | 見 §8 |

**畫面文字歸屬**(照介面): 上表中所有字都由美術畫,RD 不另畫字;說明頁(phase guide)例外,見 §8。

## 6. 尺寸表

| 物件 | 尺寸(以中心為準) | 備註 |
|---|---|---|
| Tile / Portal / CrackWall | 60×60 | |
| Tamer | 64×64;身體圓半徑 18 | 武器最遠 31px |
| WildMonster 本體 | 72×72(戲法狸 90×90);身體圓半徑 26(狸 27) | 配件 ≤ 1.15R,狸尾到 1.55R;hop 上跳 5 |
| WildMonster 血條 | 56×6,中心 (x, y − 46)(狸 y − 55) | 本體框外;30% 處白刻度 |
| CaptureRing | 110×110;環半徑 40、線寬 5;字中心 y − 47 | |
| Lasso 環 | 進度環半徑 42(線寬 6)、時限環半徑 49(線寬 2.5),以 (x2,y2) 為中心 | 無 size |
| Hazard 投射物 | 半徑 = radius(判定半徑),整顆畫在圓內 | |
| Hazard icebeam | 從 (x,y) 沿 angle 長 length、寬 width(中線左右各半) | |
| WeaponFx | = shape 的判定範圍 | |
| DungeonCard | 360×440 | |
| SpeciesCard | 180×250 | |
| SpeciesInfo | 800×180 | |
| CueRow row | 680×64;暗號格 280×52 中心 (x − 100, y);節目格 280×52 中心 (x + 200, y);序號 x − 340 ~ x − 250 | |
| CueRow mini | 200×46;暗號圖示中心 x − 55、節目圖示 x + 55;等待條 y + 15~20 | |
| PickerPanel | 460 × (50 + 52 × 選項數),x 760~1220,y 60 起 | |
| BannerFx | 高 50,寬依字長(約 380~460) | |
| ShowMonster 本體 | 64×64(戲法狸 80×80);身體圓半徑 24 | 表演彈跳最多 6% |
| ShowMonster 怒氣條 | 60×8,中心 (x, y − 44)(狸 y − 52);50 白刻度、紅區下限紅刻度上下各突出 2px | |
| ShowMonster 標記 | 直徑 8、間距 11,中心 y − 56(狸 y − 64) | |
| ShowMonster Lv | 12px 字,中心 (x, y + 40)(狸 y + 48) | |
| Fence | 136×14 | |
| Visitor | 56×76 | |
| ShopTab / ShopItem / ShopDetail | 220×50 / 380×100 / 1080×60 | |
| ResultPanel | 800×520,中心 (640,380) | |
| Hud | 地下城 1280×100、其他 1280×50 | |

自測: 假 ctx 追蹤變換矩陣、arc 沿實際角度取樣、追蹤 clip,所有有 size 的函式 × 全部狀態組合(2093 次呼叫)外接框都在框內(未計線寬)、save/restore 成對、壞狀態不拋錯。

## 7. HUD 版面

- 每個 phase 上排(y 25): 左「第 day / dayMax 天」;中 timeMax > 0 時時間條 x 470~730 + 「N 秒」(剩 < 20% 轉紅);右 金幣 x 1000、名聲 x 1132。
- 地下城(高 100): 上排另有地下城名 x 160(主題色);下排(y 74): 心(最多畫 14 顆)、繩圈(最多 10)、武器框 x 634~814(圖示 + 名 + X 鍵帽: 冷卻中深色扇形蓋住剩餘、可用時白框;xCdMax 0 = 灰鍵)、message 置中於 x 1040(含「繞」「站住」時萊姆色)。
- 其他 phase(高 50): message 置中於 x 640(表演場有時間條時移到 x 880)。
- **phase = guide 時整個 HUD 不畫**(說明頁文字歸 RD,避免重疊)。

## 8. 說明頁示意圖

- 分工: 美術只畫 `(x, y, w, h)` 框內的示意圖(clip 在框內);頁標題、說明文字、頁碼、「按 Z 繼續」一律 RD 畫。圖內只有物件旁短標籤。
- 每頁以虛擬尺寸設計、等比縮放置中: 第 1 頁 800×440、第 2 頁 800×420、第 3 頁 1000×590、第 4 頁 800×470、第 5 頁 800×440。**第 3 頁含遊戲內節目單大列與縮小格,框寬建議 ≥ 900、高 ≥ 520,否則列內字會小於 10px。**
- 圖裡的遊戲物件一律呼叫遊戲內函式。
- 第 1 頁: 鏡湖一角;馴獸師棍棒朝右敲中受擊閃白的火柴猴;上方鈴蘭精射三發扇形花粉(20°)朝馴獸師,白虛線箭頭往左閃出扇形(離鈴蘭精 190px 處扇形半寬 69 + 身體 18 < 箭頭位移 130 ✓)。鍵帽: 方向鍵貼在移動箭頭旁、Z 貼在扇形旁。**偏離 guide**: guide 要「下方三個鍵帽排一列對應 走 / 攻擊 / 武器技」——依經驗「鍵帽貼在做動作的物件旁、不排成一列」改貼物件;且圖中武器是棍棒(X 無反應),畫 X 鍵帽會教錯,所以不畫 X,由 RD 的頁文字講 X。
- 第 2 頁: 左格 馴獸師站在殘血鈴蘭精上、準備捕捉圈 0.4/0.8;右格 套索中的鈴蘭精(暈眩星)、進度環 0.5、時限環 3/5 剩餘、繞牠的白虛線箭頭路線;右下角「收服!」飄字(勾)。準備期間沒暈、套索中才暈 ✓。
- 第 3 頁: 上 6 列節目單(1 過 6 秒→圍攻、2 三隻進紅區→冰水桶、3 冷場→加油棒、4~6 空列畫暗);箭頭;下 表演場縮圖 4 隻: 3 隻 doused、怒氣 64 / 70 / 62(紅區下限 80,剛掉到下面),1 隻怒氣 50 無反應;上方浮字「三隻進紅區 → 冰水桶!」(t 0.3/0.8);最下縮小節目單第 3 格 current + switching「…」。
- 第 4 頁: 上 火柴猴怒氣 90(紅區)表演中 + 火柴飛出 + 「+4 ×2」紅區金幣飄字,「紅區」小標以線連到怒氣條紅段;下 左 怒氣 100、4 個標記 → 右 同一隻 mode charge(沒有標記)撞向下側完好圍欄,後方一名觀眾嚇到、一名觀看,旁邊紅白大叉。
- 第 5 頁: 地下城 → 布置 → 表演 → 商店 順時針橢圓箭頭,中央「×5 天」;表演旁名聲星往上 +「+名聲」;表演 → 結算(2 顆亮星示意)。

## 9. 判讀約定(請 RD 照這個傳)

- Hazard 投射物 radius = 判定半徑(外緣);icebeam 長方形從施放者中心起算,width 以中線左右各半。
- WildMonster: stunLeft > 0 或 lassoed 都畫暈眩;weak 與暈眩可同時畫。
- ShowMonster: mode 為 charge / loose 時不畫標記(規則上已失控);frozenLeft > 0 才畫冰塊。
- **繪製順序缺口**: 介面順序是 ShowMonster → Fence / Visitor,但 mode = loose 的魔物在觀眾席裡跑、charge 撞欄時貼著圍欄,會被觀眾與圍欄蓋住。請 RD 把 mode 為 charge / loose 的 ShowMonster 改到 Fence / Visitor 之後畫(其餘照原順序)。
- CueRow mini 的等待進度條只在 current、cue = wait、!switching、dur > 0 時畫。
- 時長常數(一次性特效皆由傳入的 t/dur 決定,美術不寫死): 節目浮字 dur 0.8、飄字 1、反應 0.5、表演 0.5、冰柱預警 0.7 / 生效 0.2。RD 在 t ≥ dur 後停止呼叫即可。
- 動畫小細節(旋轉齒輪刃、暈眩星、標靶以外的抖動、無敵閃爍)用 `performance.now()`,不需 RD 傳時間。
