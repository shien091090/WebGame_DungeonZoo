# 導播台怪獸秀 — 美術規格 (deepen-5 / game-a)

> RD 只讀這份。`index.html` 必須宣告 `<meta charset="utf-8">`(art.js 有中文字串)。
> 載入: `<script src="art/art.js"></script>` 之後用 `window.Art.drawXxx(ctx, state)`。所有函式自己 save / restore, 不改傳入的 state。

## 邏輯畫布尺寸

1280 × 720(`Art.canvas`)。

## 色票表

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg / bg2 | #17132a / #0f0c1c | 選單背景漸層 |
| panel / panel2 / panelEdge | #2a2440 / #362f52 / #5a5080 | 面板、卡片底與框 |
| text / textDim / textMute | #f4f0ff / #a79fc4 / #6e6790 | 主字 / 次要字 / 停用字 |
| outline | #1b1426 | 全場物件深色外描 |
| select | #ffffff | **游標 / 選中**: 白色 4px 框 + 外圈淡白框(全畫面唯一的選中長相) |
| ignite | #ff4a3d | 激怒(點燃型): 效果標籤、技能(種子 / 爆竹 / 隕石)、點燃反應、紅區、加油圖示 |
| calm | #3d8bff | 冷靜(澆熄型): 效果標籤、雨滴、澆熄反應、中場休息 / 冷靜鈴圖示 |
| special | #b25cff | 吸引 / 擊退: 效果標籤、磁力球、震波、推拉反應 |
| catch | #6dffa8 | **捕捉**: 殘血虛線圈、準備捕捉環、繞圈進度環、殘血血條、「收服!」、「已開放」 |
| program | #36c9d6 | **節目(導播台)**: 節目圖示、節目列外框、正在演的進度條、腳下「被節目帶著走」橢圓、換段浮字 |
| rule | #e8b04a | **場規牌**: 銅牌底的圖示框、牌位框、場規浮字 |
| gold / rep | #ffd23f / #ffe680 | 金幣 / 名聲星 |
| heart | #ff5c7a | 心 |
| reflect | #ffd23f | 被劍打回去的投射物(「你的」) |
| danger | #ff7a2e | 爆炸桶爆炸、傷害地形火舌、時限快到 |
| mark | #ff2e63 | 失控標記點 |
| 種類本體色 | bunny #f3e6c4 / cloud #bcdcf7 / rat #f08a2a / turtle #4fb06a / hawk #d95fb2 / rhino #98877a | 只在魔物本體 |

**張力(寫明讓製作人驗收)**: 六種本體色排不開色輪(爆竹鼠 29° 與號角犀 26°、蒲公英兔 43° 色相相鄰), 所以**種類辨識以剪影為主通道**(長耳圓兔 / 三團雲 / 尖鼻鼠帶爆竹尾 / 半圓殼龜 / V 翅鷹 / 方身帶角犀), 顏色是第二通道且以明度撐開(兔 230、雲 214 極淺; 鼠 158 飽和; 龜、鷹、犀約 140 但飽和度 0.55 / 0.56 / 0.20)。效果色只畫在線、標籤、技能、反應上, 不填魔物本體。最差組合: 殘血的磁石龜(綠 137°)外面套捕捉薄荷綠虛線圈(144°) — 靠「虛線 vs 實心面」與明度(201 vs 139)分開; 被澆熄的霧雨雲 — 藍水滴(灰 129)疊淺藍本體(214), 靠明度與「往下滴」的方向分開。

## 形狀語言

圓角、扁平填色 + 深色外描(#1b1426); 魔物是圓鼓鼓的剪影, 技能是「虛線框 + 由中心長大的填色, 填滿 = 生效」, UI 是圓角面板。

## 理念落實

- P0 辨識度先於好看: 六種魔物以剪影區分, 每種狀態(殘血、暈眩、施放預備、失控、避難)都有本體外的獨立記號, 背景與地板低對比。
- P1 視覺權重跟著決策迫切度走: 表演場最亮的是技能預警與失控鋸齒; 節目模式只有腳下一圈細青色橢圓; 地下城裡可抓的殘血魔物有全場唯一的薄荷綠虛線圈。
- P2 規則上存在的東西畫面上就存在: 紅區段與 50 表演門檻刻在怒氣條上; 磁力球畫出 170 吸引範圍與往內流的 V; 投射物畫面邊緣 = 判定半徑(種子 10、磁力球 20), 範圍技能外緣 = radius; 套索時限畫成外圈細環。
- P3 一個意義一種長相: 紅 = 激怒、藍 = 冷靜、紫 = 吸引 / 擊退, 從布置卡標籤、技能、反應到節目 / 場規圖示都同一套; 薄荷綠只代表捕捉; 白框只代表游標。
- P4 關鍵區分走兩條通道: 點燃 / 澆熄 / 推拉反應 = 顏色 + 方向(火舌往上竄 / 水滴往下滴 / 側邊漩渦); 地下城的牆 = 立體方塊、石柱 = 帶影圓柱、地塊 = 平面。
- P7 每個元素掙得版面: 縮小節目表格內不寫字(只圖示 + 進度條), 怒氣條不配數字。
- P9 以最混亂的一刻驗收: 所有技能與投射物帶深色襯底 / 外描, 預警框外多一圈深色描邊, 20 隻同場時仍分得出圈。
- P13 事件排隊: 換段浮字(上方中央 y 180)與場規浮字(魔物頭上 y−80)分在兩個帶, 不會疊。
- P15 回饋強度與份量成正比: 單隻反應(0.5 秒小火舌 / 水滴)< 表演光盤 < 場規浮字 < 換段大浮字。
- P17 圖形與數字分工: 失控標記最後一顆畫成「剩多久消掉一顆」的扇形; 節目進度條畫這一段的 8 秒, 不重述 HUD 總時間。
- P18 重要資訊不只存在一瞬間: 場規發動後頭上浮字 0.8 秒, 同時 HUD 場規圖示閃光, 牌位常駐。
- P19 資訊貼著物件: 怒氣條、標記、Lv、暈眩星、殘血記號都長在魔物身上; 準備捕捉環就圈在魔物上。
- P21 示意圖選分岔的例子: 說明第 5 頁並排「4 個標記還在表演」與「再 +1 → 衝圍欄打叉」。

## 物件表

文字歸屬: 說明頁以外, 下列函式會自己畫字, **RD 不要另外畫**; 說明頁(phase = guide)的標題、文字、頁碼、翻頁提示由 RD 畫, 美術只畫示意圖, `drawHud` 在 phase = guide 時整個不畫。

表外值: 種類查不到 → 畫成蒲公英兔; 地下城查不到 → meadow; Hazard kind 查不到 → seed; mode 查不到 → 各自第一個值(ok / roam / watch); 數字非有限值 → 0 或預設總長。看到不該出現的兔子或預設外觀, 先查傳入值。

| 物件 | 函式 | state 欄位 | 各狀態視覺 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | — | 深紫漸層 + 淡星點, 全畫布 |
| 地圖格 | `drawTile(ctx, {x,y,dungeon,kind,nest})` | x,y 格中心; dungeon meadow/mine/temple; kind wall/pillar/floor/hurt/slow; nest bool | wall 立體磚塊(頂面亮、前緣暗); pillar 帶影圓柱; floor 棋盤平面(草原草葉 / 礦坑碎石 / 神殿石磚框); slow 圓角深色泥塊 + 漣漪橢圓(泥沼 / 煤渣 / 流沙換色); hurt 暗紅塊 + 橘框 + 三簇火舌(神殿為四角星火); nest 一圈枝條 |
| 爆炸桶 | `drawKeg(ctx, {x,y,dungeon,mode,fuseT,fuseDur})` | mode ok/fuse/gone | ok 棕桶 + 黑底火焰記號; fuse 桶身紅棕交替閃、引信變短冒火花、外圈紅光隨 fuseT/fuseDur 加深、輕微抖; gone 地上焦痕 + 碎木(平面, 不立體) |
| 回復泉 | `drawFountain(ctx, {x,y,dungeon,full})` | full bool | 有水: 藍水 + 噴泉 + 小愛心; 乾: 灰石盆 + 乾裂褐底 |
| 馴獸師 | `drawTamer(ctx, {x,y,facing,weapon,dashing,blink,lassoing})` | facing 0~7; weapon club/sword/spear/whip | 深藍圓身(半徑 18 = 判定)、金圍巾、草帽; 面向 = 身體邊緣金色小三角 + 武器朝向; dashing 身後兩個白殘影 + 白虛線圈; blink 半透明 0.45; lassoing 腰間繩圈 |
| 野生魔物 | `drawWildMonster(ctx, {x,y,species,hp,maxHp,hit,weak,stunLeft,stunDur,lassoed,casting,move,moveT,moveDur,dir})` | 見介面 | 種類剪影; hit 整隻刷白; weak 薄荷綠虛線圈 + 汗滴 + 繃帶 + 血條轉薄荷綠; 暈眩(stunLeft>0 或 lassoed)頭上 3 顆黃星繞 + 叉眼(暈眩中不畫施放光與殘血圈, 套索進度環接手); casting 本體外一圈該種技能效果色粗環 + 白細環; hop 上抬 4px(影子不動); fadeOut / fadeIn 透明度 1→0.15 / 0.15→1; dir 左右翻; 血條 56×6 在 (x, y−46)(犀 y−55), 30% 處一條刻線 |
| 準備捕捉 | `drawCaptureRing(ctx, {x,y,t,dur})` | t/dur 進度 | 半徑 40 薄荷綠環從 12 點順時針填滿; 上方「準備捕捉」小字 |
| 套索 | `drawLasso(ctx, {x1,y1,x2,y2,progress,t,limit,len,maxLen})` | 1 = 馴獸師, 2 = 魔物 | 繩: 鬆時下垂(len/maxLen 越小越垂), ≥ 80% 拉直並變紅虛線; 魔物外半徑 46 薄荷綠繞圈進度環(progress); 半徑 54 白細環 = 時限剩餘(1 − t/limit), 剩 < 30% 轉橘 |
| 技能 | `drawHazard(ctx, {x,y,kind,phase,radius,pullRadius,angle,length,width,sx,sy,t,dur,reflected})` | 見介面 | 顏色 = 效果色(種子 / 爆竹 / 隕石紅, 雨滴藍, 磁力球 / 震波紫); **warn**: 深色底圈 + 效果色虛線外緣 + 由中心長大的填色(t/dur, 填滿 = 生效), 中心記號(雨滴 / 四角星 / 十字); cracker warn 另畫爆竹沿拋物線從 (sx,sy) 飛到 (x,y)(高 = 50 + 距離 × 0.25)與剩餘虛線軌跡; **active**: 實心面 0.2 秒淡出 + 白外緣, 雨 = 水花放射線、隕石 = 岩塊 + 星芒、爆竹 = 黃白星爆; quake: 從 (x,y) 朝 angle 的長方形, warn 虛線框 + 沿長度長出的填色 + 前進 V, active 實心 + 白芯; **fly**: 種子 = 半徑 10 紅圓 + 白絨毛, 磁力球 = 半徑 20 紫圓 + 白馬蹄 + pullRadius 虛線圈 + 往內流的 V; 身後半透明尾跡; reflected: 改金色 + 白邊 + 朝前小箭頭, 不畫吸引圈 |
| 爆炸 | `drawBlast(ctx, {x,y,radius,t,dur})` | — | 橘色實心圓(外緣 = radius)+ 中心黃光擴大 + 白外緣 + 放射線, 0.3 秒淡出 |
| 武器特效 | `drawWeaponFx(ctx, {x,y,weapon,move,shape,angle,spread,radius,length,width,t,dur})` | shape arc/circle/line/dash | normal 白、skill 金; arc 扇形淡填 + 外緣弧線 + 掃過的揮動線; circle 整圈; line 長方形 + 往前刺的線; dash 4 個漸濃殘影圓 + 兩條軌跡線; 隨 t/dur 淡出 |
| 地下城卡 | `drawDungeonCard(ctx, {x,y,dungeon,open,condition,selected})` | 360×440 | 名稱、地面縮圖、兩種魔物剪影 + 名稱 + 效果標籤; open: 「已開放」薄荷綠; 未開放: 卡片變暗、魔物半透明、中央鎖頭、「開放條件」+ condition 字串; selected 白框 |
| 種類卡 | `drawSpeciesCard(ctx, {x,y,species,level,effect,owned,onStage,selected,style})` | style 固定 setup | 種類名、Lv N、剪影、效果標籤(激怒紅 / 冷靜藍 / 吸引擊退紫)、擁有 N、上場 M(大字); onStage = 0 卡底較暗、剪影半透明、上場字變灰; selected 白框 |
| 種類說明 | `drawSpeciesInfo(ctx, {x,y,species,desc,total,totalMax,lines})` | 800×180 | 左上小剪影 + 名稱 + desc; 右上「上場 total / totalMax」(滿時轉名聲黃); 分隔線下逐行畫 lines(第 1 行亮、其餘次要色) |
| 節目列 | `drawProgramRow(ctx, {x,y,style,index,program,selected,active,t,dur,done})` | style row/mini | row: 左「第 N 段」、節目圖示、節目名、右側一句說明; 空段圖示為虛線空圈 + 灰字「自由」; 有節目時外框青色; selected 白框 + 左側白三角。mini: 只有圖示, 不畫字; active 青色深底 + 白框 + 底部青色進度條(t/dur); done 變暗 + 右側灰勾; 其他為一般格 |
| 場規牌位 | `drawRuleSlot(ctx, {x,y,index,rule,selected})` | — | 左上「場規 N」; 銅牌圖示 + 場規名 + 「當…就…」說明; 空: 虛線框 + 灰「空牌位」; selected 白框 |
| 選擇面板 | `drawPickerPanel(ctx, {layer,options,index})` | 固定 x 760~1220, 標題 y 60~110, 第 i 行 y 110+52i | 標題「放哪個節目?」(青框)/「掛哪塊場規?」(銅框); 每行圖示 + name + desc; clear 行為灰叉; disabled 整行 35% 透明; 選中行淡白底 + 白框 |
| 場規圖示 | `drawRuleBadge(ctx, {x,y,rule,flashT,flashDur})` | 40×40 | 與牌位、面板同一張銅牌圖示(冷靜鈴 = 鈴 + 藍下箭; 打氣鈴 = 鈴 + 紅上箭; 傳火令 = 火把 + 前衝箭; 連發令 = 兩個疊環; 避難令 = 盾); flashT < flashDur 時蓋白光淡出; 空字串 = 虛線空框 |
| 換段浮字 | `drawBannerFx(ctx, {x,y,program,t,dur})` | — | 青框深底膠囊 300×72, 節目圖示 + 「節目名!」(空 =「自由!」); 前 15% 從 0.7 彈到 1, 後 30% 淡出 |
| 場規浮字 | `drawRuleFx(ctx, {x,y,rule,t,dur})` | x,y = 魔物中心 | 銅框小牌 124×30 畫在 y−80, 隨時間上飄 10px, 圖示 + 「場規名!」, 後 30% 淡出 |
| 表演場 | `drawShowArena(ctx)` | — | 全畫布: 上下觀眾席三排階梯座、沙地場地 x 60~1220 y 146~566、中央 120 圈 + 中心點、活動範圍極淡虛線、底部節目表槽 y 664~720 深色 |
| 表演魔物 | `drawShowMonster(ctx, {x,y,species,level,rage,redLow,marks,markLeft,markDur,mode,performing,performT,performDur,fx,fxT,fxDur,chargeT,chargeDur,looseT,looseDur,move,moveT,moveDur,dir})` | 見介面 | 剪影(怒氣 ≥ 紅區下限時加怒眉); mode: roam 無記號; program 腳下青色細橢圓; dash 身後紅火舌三條; shelter 本體 55% 透明 + 白虛線泡泡; knock 身後紫速度線 + 傾斜; charge / loose 紅鋸齒外圈 + 怒眉, 撞欄中(chargeT > 0)抖動 + 白弧(撞破進度 chargeT/chargeDur), 怒氣條強制滿紅、不畫標記; performing 效果色光盤 + 外擴環 0.5 秒; fx ignited 頭上三簇紅火舌往上竄 / doused 兩側藍水滴往下滴 / pulled 兩側紫漩渦, 0.5 秒淡出(失控中不畫); 怒氣條 60×8 在 (x, y−44)(犀 y−52): 底灰、紅區段淡紅底、白線 = 紅區下限、50 處小刻度, 填色 < 50 灰藍 / 50~紅區下限 橘 / 紅區紅; 標記 marks 顆紅點(直徑 8、間距 11)在 y−56(犀 y−64), 最右一顆的暗扇形 = markLeft/markDur; 「Lv N」小字在 y+40(犀 y+48) |
| 圍欄 | `drawFence(ctx, {x,y,side,broken})` | 136×14 | 完好: 兩條橫木 + 4 根柱; 破損: 只剩兩端柱、中間斷開、兩截歪木 + 白木屑 |
| 觀眾 | `drawVisitor(ctx, {x,y,side,mode})` | 56×76 | 座椅常在; watch 坐著微笑(衣服顏色依 x 輪替); scared 往外側偏、雙手舉高、張嘴 + 白驚嚇線; empty 只剩座椅 |
| 商店分頁 | `drawShopTab(ctx, {x,y,tab,current,selected})` | 220×50 | current 亮底 + 白框 + 底線; 其他暗底灰字; selected 白框 |
| 商店項目 | `drawShopItem(ctx, {x,y,item,cost,level,owned,equipped,affordable,selected,effect,maxed,locked})` | 380×100 | 左圖示(武器 / 強化 / 節目 / 場規 / 魔物剪影)、名稱、說明(第 73 條); 魔物: 效果標籤 + Lv N; 右上: 價格(金幣 + 數字, 買不起轉灰)/「裝備中」金(外框也轉金)/「已擁有」薄荷綠 /「已滿級」/「未收服」(整格變暗); 強化已買次數「已買 N」 |
| 商店說明 | `drawShopDetail(ctx, {x,y,lines})` | 1080×60 | 1 行 22px; 2 行 18px; 3 行 15px; 空陣列只畫底 |
| 按鈕 | `drawButton(ctx, {x,y,w,h,label,selected})` | x,y 左上 | 圓角按鈕 + 底影; selected 亮底 + 白框 |
| 飄字 | `drawFloatText(ctx, {x,y,text,kind,t,dur})` | kind gold/redGold/chain/repDown/capture/heal | gold 黃 18px; redGold 黃 24px 紅描邊; chain 白字橘描邊 22px; repDown 淡紫往下飄; capture 薄荷綠 + 左側打勾圓; heal 粉字 + 左側愛心; 其餘往上飄 30px, 後 40% 淡出 |
| 結算 | `drawResultPanel(ctx, {rep,goldEarned,bestChain,bank,stars})` | 固定中心 (640,380) 800×520 | 「五天結算」、3 顆星(stars 顆亮)、總名聲 / 累計賺得金幣 / 最長連鎖 N 段、怪物庫每種剪影 + ×數量 + Lv、「按 Z 重來」 |
| HUD | `drawHud(ctx, {phase,day,dayMax,gold,rep,hearts,maxHearts,ropes,ropeMax,weapon,xCdLeft,xCdMax,timeLeft,timeMax,dungeon,message})` | dungeon 高 100, 其他 50 | 第一列: 「第 d / 5 天」、金幣、名聲、計時條 + 秒數(timeMax > 0 才畫, 剩 < 20% 轉橘)、地下城名; dungeon 第二列: 心(空心灰)、繩 n / max、武器圖示 + 名、X 鍵帽 + 冷卻扇形(xCdMax = 0 不畫)、message 靠右; 其他 phase: message 靠右灰字; show 時 message 右緣止於 x 1070, **x 1080~1240 留空給場規圖示**; guide 時不畫 |
| 說明頁示意圖 | `drawGuidePage(ctx, {page,x,y,w,h})` | page 0~5 | 只畫在框內(等比縮放置中 + 裁切), 見下節 |

## 說明頁示意圖

示意圖內的遊戲物件一律呼叫遊戲內畫法; 圖裡只有物件旁短標籤與鍵帽。

| 頁 | 虛擬尺寸 | 內容 |
|---|---|---|
| 0 地下城 | 800×400 | 草原一角; 馴獸師(標「你」)朝右, 棍棒扇形(半徑 70)敲中右側 62px 的兔子(刷白), Z 鍵帽貼在扇形旁; 另一隻兔子的 8 顆種子(距離 110), 白箭頭從馴獸師沿 157.5° 射線穿過 135° 與 180° 兩顆種子之間(兩顆各離箭頭 42px), 方向鍵鍵帽貼在箭頭上方; X 鍵帽 + 「武器技」貼在馴獸師旁 |
| 1 收服 | 900×400 | 左格: 馴獸師站在殘血霧雨雲上(距離 26 ≤ 40), 準備捕捉環填一半、雲沒暈; 右格: 套索連著頭上冒暈眩星的霧雨雲, 繞圈進度環一半, 白虛線弧箭頭 = 繞圈路線; 右下角小框「收服!」打勾飄字 |
| 2 排節目 | 1280×720 | 布置第 2 步實際版位縮圖: 節目列 混戰 / 散開 / 加油 / 自由×5, 游標(白框)在第 4 段; 牌位 冷靜鈴 / 打氣鈴 / 空牌位; 「開演」按鈕 |
| 3 喊下一段 | 1280×720 | 表演場縮圖; 上方中央「散開!」浮字(t 0.3); 5 隻魔物(program 模式)各一支「背離最近那隻」的白箭頭(方向由程式算); 縮小節目表第 1 格(混戰)done、第 2 格(散開)active 進度 0.3/8; Z 鍵帽 + 白箭頭指向第 2 格 |
| 4 紅區 | 1000×440 | 上: 怒氣 88(紅區 80~100)的爆竹鼠正在表演, 飄「+8 ×2」紅區金幣, 旁邊放大 4 倍的怒氣條標「紅區」; 下: 怒氣 100 + 4 個標記的爆竹鼠 → 白箭頭標「再 +1」→ 同一隻 charge 模式(沒有標記)撞圍欄、觀眾嚇跑, 紅色大叉 |
| 5 目標 | 1000×440 | 四節點流程圈 地下城 → 布置 → 表演 → 商店(各配小圖示), 圈中央「×5 天」, 表演旁名聲星 + 上箭頭「名聲」, 右側箭頭到「結算」三星框 |

偏離 guide 字面: 第 1 頁「畫面下方三個鍵帽對應走 / 攻擊 / 武器技」改成鍵帽貼在做那個動作的物件旁(下方另列一排會和 RD 的頁面文字重複); 第 4 頁的「4、5 隻」取 5 隻。

## 尺寸表

| 物件 | 尺寸(px) | 備註 |
|---|---|---|
| 地圖格 | 60×60 | 以 (x,y) 為中心 |
| 爆炸桶 | 桶身寬 44(= 判定直徑)、框 60×60 | 引信光圈最大半徑 26 |
| 回復泉 | 盆 54×40 | 框 60×60 |
| 馴獸師 | 身體半徑 18(= 判定), 框 64×64 | 武器 / 面向三角在半徑 30 內 |
| 野生魔物 | 身體單位半徑 26(犀 32), 框 72×72(犀 90×90) | 殘血圈半徑 33(犀 39); 血條 56×6 中心 (x, y−46)(犀 y−55), 框外 |
| 準備捕捉 | 環半徑 40、字 14px 在 y−47 | 框 110×110 |
| 套索進度環 / 時限環 | 半徑 46 / 54 | 以魔物中心 |
| 種子 / 磁力球 | 半徑 = radius(10 / 20) | 吸引範圍虛線 = pullRadius |
| 雨滴 / 隕石 / 爆竹 | 外緣 = radius(50 / 60 / 80) | 預警虛線畫在 radius−2 內側, 不往外 |
| 震波 | length × width(520 × 44) | 從施放者中心起算 |
| 爆炸 | 外緣 = radius 130 | |
| 地下城卡 | 360×440 | selected 白框往外 8px |
| 種類卡 | 180×250 | selected 白框往外 8px |
| 種類說明 | 800×180 | |
| 節目列 row / mini | 600×56 / 140×46 | row selected 白三角在左緣外 10px |
| 場規牌位 | 440×90 | |
| 選擇面板 | 460 × (50 + 52 × 選項數) | 右下 6px 影子 |
| 場規圖示 | 38×38 | |
| 換段浮字 | 300×72 | 中心 (640,180) |
| 場規浮字 | 124×30 | 中心 (x, y−80) 往上飄到 y−90 |
| 表演魔物 | 身體單位半徑 23(犀 28), 框 64×64(犀 80×80) | 怒氣條 60×8 中心 (x, y−44)(犀 −52); 標記直徑 8 中心 y−56(犀 −64); Lv 11px 中心 y+40(犀 +48) |
| 圍欄 | 136×14 | |
| 觀眾 | 56×76 | |
| 商店分頁 / 項目 / 說明 | 220×50 / 380×100 / 1080×60 | |
| 結算 | 800×520 | 中心 (640,380) |
| HUD | 1280×100(地下城)/ 1280×50 | |

## 時長常數(美術自訂或取自介面)

| 效果 | 總長 | 來源 |
|---|---|---|
| 換段浮字 / 場規浮字 | 0.8 秒(由 dur 傳入) | 規格 |
| 場規圖示閃光 | 0.3 秒(flashDur) | 規格; 閒置時 flashT = flashDur, 不閃 |
| 反應 fx | 0.5 秒(fxDur) | 規格 |
| 飄字 | 1 秒(dur) | 介面 |
| 技能 active | 0.2 秒(dur) | 規格 |

所有比例都用傳入的 t / dur 算, 美術沒有寫死秒數。

## 繪製層級

照介面「繪製順序」。美術補充: 表演場的圍欄與觀眾畫在魔物之後, 所以亂竄中的魔物會被觀眾蓋住一部分 — 若試玩看不清亂竄中的魔物, 請 RD 把 loose 模式的魔物移到圍欄 / 觀眾之後再畫。

## 判讀約定

- 震波 x,y = 施放者中心, 長方形從那裡往 angle 延伸 length, 寬度以中線左右各 width/2。
- 範圍技能 radius = 外緣; 畫面外緣 = 判定外緣。
- `drawHazard` 的 cracker warn 用 t/dur 當飛行進度, t = dur 時爆竹正好落在 (x,y)。
- 爆炸桶引信中只在 60×60 內加深紅光, **沒有畫出 130 的爆炸範圍**(介面 size 限制); 若要讓玩家預判躲開, 需要另加函式(見回報)。
