# 伸縮擂台秀 — 美術規格(style.md)

> RD 只讀這份。`index.html` 必須宣告 `<meta charset="utf-8">`,否則 art.js 的中文字會變亂碼。
> 載入方式:`<script src="game/art/art.js"></script>`(非 module),之後用 `window.Art`。
> 所有函式自帶 `ctx.save()/restore()`;state 欄位缺漏、型別錯、列舉值不在表內都不會拋錯,會畫成「表外值預設」(見文末)。

## 1. 邏輯畫布尺寸

`Art.canvas = { width: 1280, height: 720 }`(= interface.json)。座標一律畫面座標;地下城物件由 RD 先換成畫面座標(世界 − cam + (0,100))再傳。

## 2. 色票表(`Art.palette`)

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg / bgDeep | #1b1726 / #120f1a | 全畫面底、表演場外框底、說明頁圖框底 |
| panel / panel2 / panelHi / panelLine | #2a2438 / #352e47 / #463c5e / #5a4f78 | 面板底(兩階)、選中行底、面板描邊 |
| text / textDim / textDark | #f4f0ff / #a99fc4 / #16121f | 主字、次要字、鍵帽字 |
| outline | #0d0a12 | 所有物件描邊與字的深色外描 |
| select | #ffffff | **選中框**(全遊戲同一個長相:白 4px 內框 + 內側淡青細框) |
| danger | #ff3b3b | 地下城危險:傷害地形紅虛線框、施法預備紅圈、電弧鎖定圈、套索時限快到 |
| gold | #ffd23a | 金幣(圓幣圖示 + 字) |
| rep | #8fd8ff | 名聲(星形圖示 + 字)、結算星 |
| capture | #8cf06a | **捕捉字典色**:殘血虛線圈、殘血血條、「準備捕捉」環、繞圈進度環、收服飄字、已開放、裝備中 |
| rope / ropeDark | #f2e3c0 / #8a6a3a | 套索繩、HUD 捕獸繩圖示、被打回的投射物內環 |
| ignite | #ff4d3a | 效果「激怒」標籤、點燃反應(往上竄的火舌)、激將卡圖示 |
| calm | #39a8ff | 效果「冷靜」標籤、澆熄反應(往下滴的水滴)、冰鎮卡圖示 |
| special | #c46cff | 效果「引信 / 黏液」標籤、引信繩、黏液、特殊反應(螺旋)、馴獸師被黏 |
| redZone / rageMid / rageLow | #ff3b3b / #ffb347 / #8a9bb5 | 怒氣條:紅區 / 50~紅區下限 / 50 以下 |
| mark | #ff3b3b | 失控標記點 |
| arena / arenaDark | #4fd1c5 / #1f5f5a | **擂台字典色**:伸縮柵欄、場地停靠刻度、擂台類節目卡(縮場 / 放場 / 擂台賽)、「擂台」小標、HUD 擂台倍率、節目小標 |
| offField | #0a0810 | 柵欄外側的「場外」 |
| chant / chantDark | #b4a6ff / #3a3266 | **口令字典色**:口令圖示、口令牌位描邊、口令發動橫幅、「口令」小標 |
| call / callDark | #f0e0b0 / #5a4a2a | 點名類節目卡底(激將 / 冰鎮 / 安可 / 熱身操) |
| encore / warm | #ff6ad5 / #ffe14d | 安可卡圖示;熱身操卡圖示與熱身中速度線 |
| tamer / tamerHat / tamerSkin | #2f4a8a / #f2e3c0 / #f0c8a0 | 馴獸師身體、帽子、觀眾臉 |
| fxNormal / fxSkill | #ffffff / #fff2a8 | Z 普攻特效(白)/ X 武器技特效(淡黃) |
| reflect | #ffffff | 被劍打回的投射物外環 |
| showFloor / stands / seat / fence / fenceDark | #3b3247 / #241e30 / #3a2f4c / #a7774a / #4a2e18 | 表演場地、觀眾席、座位、圍欄 |
| bee / slug / shrimp / urchin / eel / bear | #f5c518 / #6fe0b0 / #ff7a33 / #9a6ae0 / #3355ee / #e6f2fa | 六種魔物本體色(也用在牠們的投射物) |
| fruit / tree | #ff8ad0 / #3f8a4a | 果子、果樹樹冠 |

地下城換皮(只換地面與牆,魔物、危險記號、字典色不換):

| 地下城 | 標頭 | 地板 | 密林 | 減速地形 | 傷害地形 |
|---|---|---|---|---|---|
| candy 糖果森林 | #d9579a | 莓紫 #4d3a52 | 深綠 + 粉點 | 糖漿 #c98a2e | (地圖沒有,仍可畫:暗底橘裂紋) |
| coast 熔岩海岸 | #e0672a | 深沙 #5a4a3a | 黑岩 | 濕沙 #3e5566 | 火山岩:黑底橘裂紋 |
| plateau 雷雲高原 | #5a6ad8 | 石板 #424a5e | 暗雲林 | 草泥 #4e4630 | 雷擊石:暗底黃裂紋 |

**色相張力(已知最差組合)**:六種魔物排滿色輪,色相有兩對很近 — 蜜蜂球 47° / 火山蝦 21°(灰階 192 / 154)、海膽球 264° / 雷電鰻 229°(灰階 134 / 92)。種類辨識的主通道是**剪影**(圓球 + 翅 + 尾針 / 扁長 + 雙眼柄 / 橢圓彎身 + 尾扇 + 觸鬚 / 帶刺球 / S 形長身 / 大圓 + 雙耳),顏色是第二通道。反應回饋同理:火山蝦身上的點燃(6° 對 21°)、雷電鰻身上的澆熄(206° 對 229°)、海膽球身上的黏液(276° 對 264°)是色相最差的三組,主通道交給**方向與形狀**(火舌往上竄、水滴往下掉、黏液是罩住下半身的團塊),回饋都帶深色描邊與本體分界。驗收用這三組各一幀。

## 3. 形狀語言

圓角、深色粗描邊、扁平填色 + 一塊高光;**能動的生物有描邊有影子,地形平塗無影**;危險 = 紅色(虛線框 / 脈動圈),捕捉 = 亮綠,擂台 = 青綠,口令 = 淡紫,效果 = 紅 / 藍 / 紫。

## 4. 理念落實(經驗文件中「成立」的理念)

- **P0 辨識度先於好看**:六種魔物先用剪影分,再用顏色;地下城換皮只換地面與牆,魔物與所有字典色三張圖一致。
- **P1 視覺權重跟著決策迫切度**:地下城最亮的是「施法預備紅圈」與「殘血綠虛線圈」(要閃 / 能抓);表演場最亮的是柵欄(青綠亮條)與怒氣條的紅區;背景、觀眾席、地板都壓在低明度。
- **P2 規則上存在的東西畫面上就要存在**:柵欄外側畫成斜紋場外;場地上下邊緣畫出三階柵欄的停靠刻度;電弧預警在鎖定點畫半徑 40 的圈(走出圈就躲得掉);怒氣條標出 50 門檻與紅區;最右一顆失控標記畫成「距離自動 −1 還剩多久」的餅;投射物的畫面外緣 = 判定半徑。
- **P3 一個意義一種長相**:選中框全遊戲同一個;口令圖示在牌位、選擇面板、HUD 徽章、發動橫幅是同一張;節目卡圖示在大列、縮小格、選擇面板、商店、橫幅是同一張;魔物在卡片、面板、說明頁都呼叫同一個本體畫法。
- **P4 關鍵區分至少兩條通道**:點燃 / 澆熄 = 紅 / 藍 + 往上 / 往下;擂台卡 / 點名卡 = 青綠深底 / 米色淺底 + 柵欄圖形 / 單一符號;敵方投射物 / 被打回 = 深色襯底細描 / 白色雙環 + 淡白底。
- **P7 每個元素都要掙得版面**:縮小節目表不畫字(介面規定);魔物頭上不畫怒氣數字,只畫條;血條不畫數字。
- **P9 以最混亂的那一刻驗收**:投射物一律帶深色襯底圈,在 20 隻魔物 + 彈幕重疊時仍分得出;反應回饋都帶深色描邊。
- **P13 事件要排隊**:擂台卡 / 口令橫幅固定在 (640,180),點名卡的卡名長在魔物頭上(y − 80),兩者不同帶;同一刻多個橫幅由 RD 依序呼叫,本函式只畫一個(見判讀約定)。
- **P15 回饋強度和事件份量成正比**:飄字分級 一般金幣 18px < 紅區金幣 23px(紅描 + 黃字)≈ 連鎖 22px(白字金描)< 收服 24px(綠字 + 勾);全場事件(擂台卡、口令)用畫面上方橫幅,單隻事件(點名卡)用頭上小字。
- **P17 進度類圖形與數字分工**:HUD 計時用條 + 秒數;套索的繞圈進度(綠環)與時限(外側白細環,剩 30% 轉紅)分開畫兩圈;口令冷卻只畫圖形(無字)。
- **P18 重要資訊不能只存在一瞬間**:擂台倍率常駐 HUD(字 + 三格刻度);口令冷卻常駐徽章;點名卡發動後縮小格變暗留存。
- **P19 資訊貼著物件**:怒氣條、失控標記、Lv、血條、殘血圈、準備捕捉環、引信、黏液都長在魔物身上或頭上;點名卡名冒在被點的那隻頭上。
- **P21 示意圖選分岔例**:說明第 3 頁寬 / 窄並排(同陣容、只差柵欄位置);第 5 頁「4 個標記 → 失控(沒有標記)」並排,避免讀成「標記滿 5 個還會顯示」。

## 5. 物件表

`(ctx, state)` 的 x, y 皆為中心點(drawButton 例外:左上角)。「—」表示該欄不用。

| 物件 | 函式 | state 欄位 | 各狀態視覺差異 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | — | 深紫底 + 暗角;地下城選擇、布置、商店、結算用 |
| 地圖格 | `drawTile(ctx, s)` | x, y, dungeon, kind, nest | wall 深色樹冠團;pillar 灰岩塊;floor 平塗;hurt 暗底亮裂紋 + **紅虛線框**(三圖共通危險記號);slow 濁色底 + 水紋圈;bush 整格葉尖叢 + 淡綠框(看得出能鑽);nest=true 加樹枝巢圈 |
| 果樹 | `drawFruitTree` | x, y, dungeon, hasFruit | 圓樹冠 + 樹幹(和方正密林分開);hasFruit=true 樹冠中央大粉果 + 白虛線圈;false 只剩小綠芽 |
| 果子 | `drawFruit` | x, y, dungeon, eating, eatT, eatDur | 未吃:完整粉果;吃中:果子依 eatT/eatDur 縮小(最小 30%)+ 咬痕 + 外圈白環表示剩餘量 |
| 馴獸師 | `drawTamer` | x, y, facing, weapon, dashing, blink, lassoing, hidden, slowed | 藍身 r18(= 判定圓)+ 米色帽 + 朝面向的帽簷三角 + 手上武器(棍棒 / 劍 / 長槍 / 長鞭各自造型);dashing 白描邊 + 身後殘影;blink 每 1/12 秒明暗閃;lassoing 腰間繩圈;hidden 半透明 + 草葉蓋身 + **白虛線圈標出位置**;slowed 腳下紫黏灘 + 滴落 |
| 野生魔物 | `drawWildMonster` | x, y, species, hp, maxHp, hit, weak, stunLeft, stunDur, lassoed, casting, move, moveT, moveDur, dir | 本體剪影依種類,dir 決定朝向;hit 疊白;weak **綠虛線轉動圈** + 汗滴,血條變綠;stunLeft>0 或 lassoed 頭頂三顆轉動黃星;casting **紅色脈動外圈**;move hop 微跳 + 影子縮、dash 傾斜 + 身後速度線、eat 嘴邊果屑;血條 56×6 在頭上(含 30% 綠刻度) |
| 準備捕捉 | `drawCaptureRing` | x, y, t, dur | 綠環 r44 依 t/dur 順時針填滿 + 上方「準備捕捉」字 |
| 套索 | `drawLasso` | x1, y1, x2, y2, progress, t, limit, len, maxLen | 米色編繩;len/maxLen 低時下垂、> 0.8 拉直並轉紅;魔物周圍**綠色繞圈進度環 r50**(progress);外側白細環 r57 = 剩餘時限,剩 < 30% 轉紅;魔物腰上繩圈 |
| 技能 | `drawHazard` | x, y, kind, phase, radius, angle, tx, ty, points, t, dur, reflected | 投射物(sting/bubble/ember/spine):深色襯底圓(半徑 = radius = 判定)+ 依種類造型朝 angle;reflected 改白色雙環 + 淡白底。hail warn:白虛線圈 r55 + 由中心長大的淡藍填色,填滿 = 落下;hail active:實心冰圈 + 冰塊。arc warn:黃藍閃爍虛線(施放者 → tx,ty)+ 鎖定點紅圈 r40 與十字;arc active:沿 points 的鋸齒電弧(藍光 + 黃 + 白芯),每個被打中的點一個黃圈。boom:橘紅外擴爆圈 + 外緣 r110 虛線 |
| 攻擊特效 | `drawWeaponFx` | x, y, weapon, move, shape, angle, spread, radius, length, width, t, dur | arc 扇形淡填 + 掃過的前緣弧;circle 整圈;line 長方形;dash 漸層軌跡。move=normal 白、skill 淡黃(劍的擊暈斬加三顆黃星) |
| 地下城卡 | `drawDungeonCard` | x, y, dungeon, open, condition, selected | 標頭色帶 + 名稱 + 地景小圖與兩種魔物 + 魔物名;open 綠框「已開放」;未開放:整張暗、魔物半透明、鎖頭 + condition(最多 3 行);selected 選中框 |
| 種類卡 | `drawSpeciesCard` | x, y, species, level, effect, owned, onStage, selected | 頭像 + 右上「Lv N」+ 名稱 + 效果標籤(激怒紅 / 冷靜藍 / 引信、黏液紫;雷電鰻紅「激怒」+ 黃小字「連鎖電」)+「擁有 N」「上場 M」+ 底部點點(綠 = 上場,最多 10 顆)|
| 說明面板 | `drawSpeciesInfo` | x, y, species, desc, total, totalMax, lines | 左上頭像 + 名稱 + desc(2 行內);右上「上場 total / totalMax」(滿 20 變橘);分隔線下逐行畫 lines(第 1 行淡黃粗) |
| 節目時段 | `drawTimelineSlot` | x, y, style, slot, card, target, invalid, selected, active, done | row:左「5i~5i+5 秒」、卡圖示 + 卡名、擂台卡畫青綠「擂台」小標 / 點名卡畫種類頭像 + 名;空的畫「—」;invalid 整列壓暗 + 刪除線 +「未上場」;selected 選中框。mini:只畫卡圖示(點名卡再加種類小頭像),active 白粗框 + 亮底,done 整格 35% 透明 |
| 口令牌位 | `drawChantSlot` | x, y, index, chant, selected | 左上「口令 index+1」;有掛:口令圖示 + 名稱 + 「當…就…」說明(美術依代號內建,同 spec 第 51 條);空:虛線框「空牌位」|
| 選擇面板 | `drawPickerPanel` | layer, options, index | 固定 x 760~1220、標題 y 60~110、第 i 行 y 110+52i;標題依 layer;每行圖示(卡 / 種類頭像 / 口令;key=clear 畫紅叉)+ name(+ desc);disabled 35% 透明 + 右側「已掛」;index 行亮底 + 選中框 |
| 口令徽章 | `drawChantBadge` | x, y, chant, cdLeft, cdDur, flashT, flashDur | 同一張口令圖示;待命(cdLeft=0)白描邊;冷卻中:剩餘部分深色扇形(12 點順時針)+ 灰虛線框;flashT<flashDur 時整塊白光淡出 |
| 發動橫幅 | `drawBannerFx` | x, y, kind, key, t, dur | 深底膠囊 + 左側卡 / 口令圖示 + 「名稱!」;卡 = 青綠框、口令 = 淡紫框;前 12% 放大淡入、後 30% 淡出 |
| 點名卡名 | `drawCardFx` | x, y, card, t, dur | 魔物頭上 y−80 的小膠囊「激將!」,字色 = 卡的符號色,往上飄 10px、後 35% 淡出 |
| 伸縮柵欄 | `drawArenaWall` | x, y, side, moving | 24×420 青綠柵欄;**柵欄外側到場地邊畫成黑底斜紋場外**(y 146~566);moving 白描邊 + 沿柵欄流動的白亮點 |
| 表演場 | `drawShowArena(ctx)` | — | 全畫面:觀眾席兩條(各 8 個座位)、場地 x 60~1220 / y 146~566、中央回場圈、場地上下緣 6 個青綠停靠刻度(60/260/440/840/1020/1220)、底部節目表底條 |
| 表演魔物 | `drawShowMonster` | x, y, species, level, rage, redLow, marks, markLeft, markDur, mode, fuseLeft, fuseDur, slimeLeft, slimeDur, warm, performing, performT, performDur, fx, fxT, fxDur, chargeT, chargeDur, looseT, looseDur, move, moveT, moveDur, dir | 本體(r24,冰雹熊 r26);mode charge/loose 紅色脈動氣場 + 本體泛紅(撞欄中 chargeT>0 抖動),不畫標記;warm 身後黃速度線;performing 外緣白放射線 + 微脹;fx ignited 頭上往上竄的紅火舌、doused 藍水滴往下掉、special 紫螺旋;fuseLeft>0 頭上紫引信繩,**越燒越短**,尾端火花;slimeLeft>0 紫黏團罩住下半身,滴落隨剩餘變短;怒氣條 60×8(紅區底色 + 紅區起點紅線 + 50 白刻度,填色依段:灰藍 / 橘 / 紅);失控標記一排紅點(最右一顆 = markLeft/markDur 餅);腳下「Lv N」|
| 圍欄 | `drawFence` | x, y, side, broken | 完好:木欄 136×14;broken:斷成兩截微歪 + 中間紅色碎片 |
| 觀眾 | `drawVisitor` | x, y, side, mode | watch 坐著輕晃;scared 雙手舉起、臉發白、驚嚇線、左右搖;empty 只剩座椅 |
| 商店分頁 | `drawShopTab` | x, y, tab, current, selected | current 亮紫底白字;否則暗底灰字;selected 選中框 |
| 商店項目 | `drawShopItem` | x, y, item, cost, level, owned, equipped, affordable, selected, effect, maxed, locked | 左圖示格 + 名稱 + 說明(美術依 item 內建 spec 第 75 條文字);節目卡加青綠「節目」小標、口令加淡紫「口令」小標;怪物種類畫效果標籤 + 「Lv N」;右上:價格(金幣圖示,買不起變灰)或「已擁有」「裝備中」(綠底綠框)「已滿級」「未收服」(整格 40% 暗);強化已買過另畫「已買 N」|
| 商店說明 | `drawShopDetail` | x, y, lines | 1080×60 面板,lines 置中(1~3 行自動縮行距)|
| 按鈕 | `drawButton` | x, y, w, h, label, selected | 左上角 + 寬高;selected 亮紫底 + 選中框 |
| 飄字 | `drawFloatText` | x, y, text, kind, t, dur | 往上飄 32px、後 40% 淡出;gold 金幣圖示 + 黃字;redGold 大一號、紅描黃字;chain 白字金描;repDown 星圖示 + 淡紅字;capture 綠字 + 勾 |
| 結算 | `drawResultPanel` | rep, goldEarned, bestChain, bank, stars | 固定中心 (640,380) 800×520;標題、3 顆星(亮 = 得到)、總名聲 / 累計金幣 / 最長連鎖、怪物庫(頭像 + ×count + Lv)、「按 Z 重來」|
| HUD | `drawHud` | phase, day, dayMax, gold, rep, hearts, maxHearts, ropes, ropeMax, weapon, xCdLeft, xCdMax, timeLeft, timeMax, dungeon, arenaMul, message | 見第 7 節版位 |
| 說明頁示意圖 | `drawGuidePage` | page, x, y, w, h | 只畫在 (x,y,w,h) 框內(深底圓角框 + 等比縮放的示意圖);見第 9 節 |

**畫面文字歸屬**:說明頁以外所有字由美術畫(照 interface 的文字歸屬),RD 不另畫字;`message` 字串由 RD 給、HUD 負責畫。**說明頁:標題、說明文字、頁碼、「按 Z 繼續」歸 RD,`drawHud` 在 phase=guide 時整個不畫**;示意圖內只有物件旁短標籤與鍵帽。

## 6. 尺寸表

| 物件 | 判定 / 框 | 實際繪製 |
|---|---|---|
| Tile / FruitTree | 60×60 | 收在框內 |
| Fruit | 30×30 | 果子 r11,吃中外環 r14 |
| Tamer | 64×64 | 身體 r18(= 判定半徑);武器、帽簷三角、殘影、黏灘都在 r32 內 |
| WildMonster | 72×72(熊 90×90) | 本體 r27(熊 r34),附件 ≤ 1.3r;殘血圈 r34(熊 r43);**血條 56×6 在框外,中心 (x, y−46)(熊 y−55)** |
| CaptureRing | 110×110 | 環 r44(線寬 6);字中心 y−46 |
| Lasso | 無框 | 繞圈環 r50、時限環 r57,以 (x2,y2) 為圓心 |
| Hazard 投射物 | 判定半徑 radius | 外緣 = radius(sting 8、bubble 22、ember 14、spine 10);火種尾焰在圓內 |
| Hazard hail | r55 | 預警虛線圈外緣 r55;生效實心圈 r55 |
| Hazard boom | r110 | 外緣虛線 r110,內圈從 0.55R 擴到 R |
| Hazard arc | — | 鎖定圈 r40(地下城判定距離);電弧線寬 9(光暈)|
| DungeonCard | 360×440 | 收在框內 |
| SpeciesCard | 180×250 | 收在框內 |
| SpeciesInfo | 800×180 | 收在框內 |
| TimelineSlot | row 600×52 / mini 130×46 | 收在框內 |
| ChantSlot | 440×90 | 收在框內 |
| PickerPanel | 460 × (50 + 52×選項數) | x 760~1220、y 60 起 |
| ChantBadge | 40×40 | 收在框內 |
| BannerFx | 無框 | 中心 (640,180),寬 = 字寬 + 110、高 56 |
| CardFx | 無框 | 中心 (x, y−80−上飄 10),高 26 |
| ArenaWall | 24×420 | 柵欄本體收在框內;**場外區域超出框是預期的**(介面已註明) |
| ShowMonster | 64×64(熊 80×80) | 本體 r24(熊 r26),附件 ≤ 32(熊 40);**怒氣條 60×8 框外中心 (x, y−44)(熊 y−52)**;**標記排中心 y−56(熊 y−64),直徑 8 間距 11**;**Lv 字中心 (x, y+40)(熊 y+48)** |
| Fence | 136×14 | 收在框內 |
| Visitor | 56×76 | 收在框內(座椅在 y+14~+36)|
| ShopTab / ShopItem / ShopDetail | 220×50 / 380×100 / 1080×60 | 收在框內 |
| ResultPanel | 800×520 | x 240~1040、y 120~640 |
| HUD | 地下城 1280×100、其他 1280×50 | 收在框內 |

超框自查(Node 假 ctx 追蹤變換矩陣、arc 依實際角度取樣、clip 取交集):全部函式、所有狀態組合 0 筆超過 0.6px;唯一 0.6px 是雷電鰻撞欄抖動(±1px,只在撞欄期間)。
與規格的差:表演場判定的魔物身體半徑是 24,冰雹熊本體畫 r26(大 2px,為了剪影比其他種大一號);其餘種類 r24 = 判定。

## 7. HUD 版位

- **phase=guide**:不畫任何東西。
- **phase=dungeon(高 100)**:第 1 列(y≈25)「第 d/5 天」(x16)、金幣(x150)、名聲(x258)、地下城名膠囊(x350~470)、計時條 x490~790 + 秒數、message 靠右(右緣 1264,最寬 380,淡黃)。第 2 列(y≈76)心 ×maxHearts(每顆間距 26)、「繩」+ 繩圈 ×ropeMax(亮 = 剩)、武器格 x900 + 武器名、X 鍵帽 x1110 + 冷卻環(xCdMax=0 畫「無」;冷卻完畫綠「OK」)。
- **phase=show(高 50)**:天數 / 金幣 / 名聲同上;message x360~600;計時條 x600~750 + 秒數;擂台倍率膠囊 x850~1060(「擂台 ×1.25」+ 三格刻度,亮幾格 = 多窄;×1.5 時白框)。**x 1080~1240 留空**給 drawChantBadge。
- **其他 phase(高 50)**:天數 / 金幣 / 名聲,message 靠右(最寬 860)。

## 8. 判讀約定 / 時長常數

| 項目 | 約定 |
|---|---|
| 一次性特效的停止 | BannerFx、CardFx、FloatText:`t ≥ dur` 時函式自己不畫(RD 可放心多呼叫一幀) |
| ChantBadge 閃光 | 只在 `flashT < flashDur` 時畫;閒置值 flashT = flashDur(照介面) |
| 預警填色 | hail warn 用 `t/dur` 填滿(dur 由 RD 傳 1.0),不寫死秒數 |
| 套索時限 | 外側白環長 = 1 − t/limit;< 30% 轉紅 |
| 失控標記遞減 | 最右一顆畫 markLeft/markDur 的餅(餅越小 = 越快少一個) |
| 引信 | 繩長 ∝ fuseLeft/fuseDur |
| 動畫時間 | 待機動畫(閃爍、星星轉、電弧抖)用 `performance.now()`,不需要 RD 傳時間 |
| BannerFx 同時多個 | 函式只畫一個,位置固定 (640,180);同一幀多個請 RD 依序排隊(前一個 t 到 dur 再呼叫下一個),不要疊畫 |
| PickerPanel 位置 | 固定 x 760~1220、y 60 起(interface 固定版位) |
| ResultPanel 位置 | 固定中心 (640,380) |

## 9. 說明頁(drawGuidePage)

示意圖以設計座標畫好後**等比縮放置中**進 (x,y,w,h);第 4 頁用 1280×720(整個布置第 2 步畫面),其他頁用 1000×500。框外不畫。圖裡的遊戲物件全部呼叫遊戲內函式。

**框的大小(請 RD 照這個留)**:縮放 = min(w/設計寬, h/設計高)。建議框 ≥ 1000×450(其他頁縮放 ≥ 0.9)。第 4 頁含遊戲內帶字元件(最小字 15px),縮放要 ≥ 0.63 字才不低於畫布高 1/77(≈ 9.4px),也就是框至少約 **810×455**;框比這小時第 4 頁口令說明會糊。

| 頁 | 圖 | 物件旁短標籤 / 鍵帽 |
|---|---|---|
| 0 地下城 | 糖果森林一角(密林、草叢、果樹、糖漿);馴獸師朝右棍棒扇形(100°、r70)敲中蜜蜂球(受擊閃白,距 62 < 70);右上另一隻蜜蜂(施法紅圈)射出的三根蜂針,各朝「發射當下」的馴獸師位置(依序相隔 45px = 300 像素/秒 × 0.15 秒,先發的偏上);白箭頭往下側閃 | 「↓」鍵帽 +「走」、「Z」+「攻擊」(鍵帽貼在對應動作旁,不排成一列;**不畫 X**)— 偏離 guide 字面「畫面下方三個鍵帽 方向鍵 / Z / X」,理由:(1) 按鍵說明一列歸 RD,圖裡只放物件旁短標籤;(2) 圖中武器是棍棒,規格裡棍棒的 X 無反應,畫 X 鍵帽會教錯。X 的說明請 RD 留在頁面文字 |
| 1 收服 | 左:殘血薄荷蛞蝓(綠虛線圈、汗滴,**沒有暈眩星**)+ 馴獸師站在牠身上(距 18 ≤ 40)+ 準備捕捉環填到一半;右:套索連著頭頂冒星的蛞蝓,繞圈綠環填一半,白虛線箭頭繞牠一圈;右下角小框「收服!」+ 勾 | 無 |
| 2 伸縮擂台 | 左右兩格同一個表演場縮圖。左:寬(柵欄 60/1220),4 隻(蜜蜂 2、蛞蝓 2)散開,一根蜂針在空處;右:柵欄在 440/840,外側斜紋場外,4 隻擠在 x 480~800 內;一根蜂針正飛向最近的蛞蝓(距 40,判定 32,尚未打中)、兩顆泡泡(±12°)正飛向最近的蜜蜂;另兩隻身上是剛被打中的點燃 / 澆熄反應 + 飛出的金幣;兩格上方各一個 HUD 同款倍率膠囊「擂台 ×1」「擂台 ×1.5」;中間白箭頭 | 倍率膠囊(遊戲內 HUD 同長相) |
| 3 節目與口令 | 布置第 2 步實際畫面:9 列(0~5 秒 縮場 擂台、10~15 秒 激將 蜜蜂球、20~25 秒 放場 擂台,其餘「—」)、口令 警鈴 / 鑼聲 / 空牌位、「開演」按鈕 | 無(字是遊戲內元件本身的字) |
| 4 紅區 | 上:蜜蜂怒氣 88(紅區下限 80)正在表演 + 「+4 ×2」紅區金幣;下左:怒氣 100、頭上 4 個標記;白箭頭 → 下右:同一隻 mode=charge(撞欄中,**沒有標記**)頂著完好圍欄,觀眾在後,紅叉 | 無 |
| 5 目標 | 四節點流程環 地下城 → 布置 → 表演 → 商店(每節點一個遊戲內小圖示),中央「×5 天」;表演節點旁名聲星一路往上;右側箭頭 → 結算框 3 顆星 | 節點名、「結算」、「×5 天」 |

驗算:第 2 頁的距離用規格判定式算過(投射物判定 = 投射物半徑 + 24;縮圖裡魔物放大 1.5 倍顯示,但位置與距離照規格座標,**放大後畫面上看起來貼近、規則上仍未打中**——因此飛行中的那幾發刻意擺在離目標 40px 以上);瞄準對象 = 最近的其他魔物,已逐一核對。第 4 頁:撞欄 1.5 秒後才破欄,圖中 chargeT 0.6 → 圍欄仍完好。

## 10. 繪製層級(照 interface 的繪製順序,美術不另加層)

地下城:背景 → 地圖格 → 果樹 → 果子 → 技能(預警與生效)→ 準備捕捉 → 野生魔物 → 套索 → 馴獸師 → 攻擊特效 → 技能(投射物)→ 飄字 → HUD。
表演場:表演場 → 技能(預警與生效)→ 表演魔物 → 技能(投射物、電弧、爆炸)→ 柵欄 ×2(含場外)→ 點名卡名 → 橫幅 → 圍欄 / 觀眾 → 縮小節目表 ×9 → 飄字 → HUD → 口令徽章 ×3。

## 11. 表外值預設

| 欄位 | 不在表內時 |
|---|---|
| species | 畫成蜜蜂球 |
| dungeon | 糖果森林皮 |
| kind(Tile) | floor |
| kind(Hazard) | sting;phase 不在表內:boom→active、hail/arc→warn、其他→fly |
| weapon | 棍棒 |
| card / chant | 空(row 畫「—」、牌位畫「空牌位」、徽章畫虛線空框) |
| effect | 該種類的預設效果 |
| mode / fx / move | roam / none / walk |
| phase(Hud) | select |
| 數字 NaN / 缺 | 0(比例類夾在 0~1)|
