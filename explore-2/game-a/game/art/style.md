# 鞭響大場面 — 美術規格(style.md)

RD 只讀這份。`index.html` 必須宣告 `<meta charset="utf-8">`(art.js 內有中文字串)。
所有函式在 `window.Art` 底下, 參數固定 `(ctx, state)`(`drawBackground` 只有 `ctx`); 每個函式自己 save/restore。座標除 `drawButton` 外一律是**物件中心**。

## 1. 邏輯畫布尺寸

720 × 1280(直式)。`Art.canvas = { width: 720, height: 1280 }`。

## 2. 色票表(`Art.palette`)

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg | #121019 | 全畫面底 |
| hudBg / hudLine | #1b1826 / #3a3450 | HUD 底(y 0~120)與下緣線 |
| panel / panelLine | #262036 / #4a4266 | 商店卡、結算板、說明圖框 |
| text / textDim | #f4f1ff / #a9a3c2 | 主文字 / 次要文字 |
| outline | #0b0910 | 所有物件與文字的深色描邊 |
| dungeonFloor | #1e2233 | 地下城地板(第 2、3 天依序偏紫、偏紅) |
| showSand / showSandLine | #4a3d2c / #6a573e | 表演場沙地 / 粉筆線 |
| stands / seat | #2a2236 / #3b3150 | 觀眾席底 / 座椅 |
| player | #3ee07a | **我方 = 綠**: 玩家、馴獸師、子彈、捕獲球、虛弱準星、制伏進度、揮鞭範圍、可按按鈕 |
| playerDark / playerLight | #16703c / #c9ffdd | 我方暗部 / 判定核心(頭) |
| capture | #3ee07a | 同 player(「綠 = 可以抓 / 我方在作用」) |
| danger | #ff2bd6 | **危險 = 洋紅**: 敵彈、技能危險區、失控魔物外圈、怒氣滿條、失控提示 |
| dangerDark | #5c0c4e | 危險物內描邊 |
| fail | #ff3b4f | **失敗 / 損失 = 紅**: 打叉、球碎、名聲減少、買不起價格、名單滿、時間 ≤5 秒、破損圍欄框 |
| gold | #ffc83a | 金幣; 怒氣條「表演區(50~99)」也是金色 = 正在賺錢 |
| rep | #c08cff | 名聲(星星圖示)、評價星數 |
| heart | #ff5a7a | 心 |
| rageCalm | #8792ad | 怒氣 < 50(不表演) |
| fire / water / thunder / stone | #ff7a1f / #2fc4ff / #f5e04a / #a39486 | 四種魔物本體色(另有暗 / 亮兩階, 寫在 art.js) |
| fence / fenceDark | #a8743f / #5a3a1c | 圍欄 |

## 3. 形狀語言

圓潤卡通生物、粗深色描邊、平塗; **危險 = 洋紅 + 鋸齒或虛線圓, 我方 = 綠 + 圓角**, 種類靠剪影(火冠 / 傘與觸手 / 翅膀與閃電冠 / 方身與角)辨認, 不只靠顏色。

## 4. 理念落實(經驗文件中「成立」的理念)

- P0 辨識度先於好看: 四種魔物各有獨立剪影; 怒氣只用一條帶 50 刻度的條讀, 不加表情以外的裝飾。
- P1 決策迫切度決定權重: 全畫面只有危險洋紅(敵彈、危險區、失控)是最飽和的顏色; 背景、場地、觀眾都壓低明度。
- P2 規則上存在就要畫出來: 玩家判定圓(半徑 16)直接畫成白圈的頭; 虛弱門檻(30%)、表演門檻(50)都在條上畫刻度; 危險區外緣 = 判定邊界; 地下城玩家活動範圍畫淡綠虛線框。
- P3 一個意義一種長相: 綠 = 我方 / 可抓、洋紅 = 會傷到你、紅 = 失敗或損失、金 = 錢、紫星 = 名聲; 說明頁與標題卡小景全部呼叫遊戲內畫法。
- P4 關鍵區分兩條通道: 虛弱 = 變灰 + 漩渦眼 + 綠準星; 危險區預警 / 生效 = 虛線 + 半透明長大的填色 / 實心白邊; 失控 = 洋紅鋸齒外圈 + 紅色發光眼; 買得起 / 買不起 = 金實線框 / 灰虛線框 + 價格金 / 紅。
- P7 每個元素掙得版面: 玩家身上不重畫心數(HUD 有); 馴獸師身上只畫制伏「光暈」, 進度環只畫在被制伏的魔物上(HUD 依規格另有進度條)。
- P9 以最混亂的一刻驗收: 6 隻魔物 + 多個危險區同場時, 怒氣條一律有黑底描邊、危險區只用一種洋紅; 預警區畫在魔物底下, 生效區半透明蓋上去也還看得到魔物與怒氣條(見繪製層級)。
- P13 事件排隊: 飄字只有向上 50px、1.2 秒內淡出, 不同種類由 RD 的出現位置錯開; 本作沒有會同時冒出的大型事件卡。
- P15 回饋強度與份量成正比: 表演 = 魔物外 8 道金光(小); 失控 = 整圈洋紅鋸齒 + 怒氣條轉洋紅(大); 球碎 = 小紅叉, 捕獲 = 綠勾。
- P17 圖形與數字分工: 怒氣與血量只有條沒有數字, 條上畫的是「離下一個會改變決策的刻度」(50 / 30%); 時間只有數字。
- P18 重要資訊不能只閃一下: 金幣 / 名聲飄字後, HUD 右上常駐總額; 結算列出總名聲、累計金幣與三個星級門檻。
- P19 資訊貼著物件: 怒氣條、制伏環、虛弱標示都長在魔物本體下 / 外緣; 說明頁「怒氣上升」箭頭貼在怒氣條旁。
- P21 示意圖選分岔例子: 說明第 2 頁左右對照「虛弱 → 抓到 / 滿血 → 球碎」; 第 3 頁放一隻圈外魔物對照「沒變」; 第 4 頁三格同一隻魔物只差怒氣。

## 5. 物件表

| 物件 | 函式 | state 欄位 | 各狀態視覺 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | — | 全畫面 #121019 |
| DungeonArena | `drawDungeonArena(ctx, {day})` | day 1~3 | y 120~1180 石磚地板; 上半部暗化(魔物區); 玩家活動範圍 x 40~680、y 600~1160 淡綠虛線框; day 越大地板越偏紅 |
| ShowArena | `drawShowArena(ctx, {})` | 無 | 上觀眾席 y 120~270、下觀眾席 y 1000~1150; 沙地 x 60~660、y 270~1000(粉筆邊線、中線、中圈)。圍欄與觀眾另畫 |
| Player | `drawPlayer(ctx, {x,y,hearts,maxHearts,blink})` | blink: 無敵閃爍 | 綠色獵人 + 往上的槍管; 頭 = 判定圓 r16(白圈)。blink=true → 12Hz 透明閃爍(自帶時鐘)。hearts/maxHearts 不畫在角色上(HUD 有) |
| Monster | `drawMonster(ctx, {x,y,species,hp,maxHp,hit,weak})` | species fire/water/thunder/stone | 本體 + 頂部血條(綠色刻度在 30%)。hit=true → 本體全白一幀。weak=true → 本體變灰、漩渦眼、血條變綠、下方三角綠準星 + 「虛弱」字 |
| Bolt | `drawBolt(ctx, {x,y})` | — | 綠白膠囊 10×28 |
| EnemyBullet | `drawEnemyBullet(ctx, {x,y,kind,species})` | kind normal/rock | normal: 半徑 10 洋紅圓 + 種類亮色小核。rock: 半徑 **22** 石塊, 洋紅外緣 |
| Orb | `drawOrb(ctx, {x,y,result,t})` | result flying/caught/broken; t 秒 | flying: 上綠下白的球(r19)。caught: 球縮小搖晃 + 綠圈 + 綠勾(建議顯示 0.6 秒)。broken: 灰色兩半分開 + 紅叉, 0.6 秒淡出 |
| Tamer | `drawTamer(ctx, {x,y,stunned,blink,subdueProgress})` | | 綠人 + 牛仔帽 + 鞭圈。stunned → 全身變灰、X 眼、頭上 3 顆星轉圈。blink → 閃爍(暈眩中不閃)。subdueProgress>0 → 身周綠色呼吸光暈 |
| ShowMonster | `drawShowMonster(ctx, {x,y,species,rage,performing,mode,subdueProgress,dir})` | mode roam/charge/loose; dir -1/1 | roam 且 rage<50: 壓扁趴地、閉眼、「z」。roam 且 rage≥50: 站起、怒眉。performing(只在 roam 生效): 微跳 + 外圈 8 道金光。charge: 洋紅鋸齒外圈(淡)+ 身後速度線 + 洋紅眼。loose: 洋紅鋸齒外圈(濃, 旋轉)+ 洋紅眼。怒氣條在本體下方(charge/loose 一律畫滿洋紅)。subdueProgress>0: 綠色進度環 r50(12 點鐘起順時針)。dir 決定臉 / 尾巴朝向 |
| Hazard | `drawHazard(ctx, {x,y,kind,phase,radius,t,angle})` | kind firering/waterball/thunder/quake; phase warn/active | firering / thunder warn: 洋紅虛線圓(外緣 = radius)+ 由中心長大的半透明填色, **以 t 計: 火圈 0.4 秒、落雷 0.8 秒長滿 = 生效那刻**(t = 危險區出現起秒數)。落雷 warn 多一個十字準星。active: 實心洋紅 + 白邊; 火圈邊緣火舌朝內, 落雷多一道從上方劈下的閃電。quake: 圓環 **外徑 = radius、內徑 = radius − 30**(RD 判定請用同一定義), active 實心 + 裂痕, warn(若有)只畫淡填色虛線。waterball: 半徑 12 洋紅彈 + 水藍小核 + 身後尾跡, 朝 angle 方向; radius 不用 |
| WhipCrack | `drawWhipCrack(ctx, {x,y,radius,t})` | t 秒 | 外緣 = 揮鞭半徑的淺綠圓 + 中央啪星; 0.35 秒內淡出, t>0.35 不畫 |
| Fence | `drawFence(ctx, {x,y,side,broken})` | side top/bottom | 完好: 雙橫木 + 三根柱。broken: 中段斷開、斷木 + 紅虛線框 |
| Visitor | `drawVisitor(ctx, {x,y,seat,mode})` | seat 0~11; mode watch/scared/empty | 座椅永遠畫。watch: 坐著微笑, 衣服色依 seat 輪替。scared: 傾斜、舉手、O 嘴、旁邊紅「!」。empty: 只有座椅 + 淡虛線輪廓 |
| TitleCard | `drawTitleCard(ctx, {day,stage})` | stage dungeon/show | 全畫面暗幕 + 中央卡(y 420~860): 「第 N 天」、大字「地下城 / 表演場」、遊戲物件小景、閃爍「點畫面開始」 |
| Button | `drawButton(ctx, {x,y,w,h,label,enabled})` | **x,y 為左上角** | enabled: 綠底深字。不可按: 灰底、灰虛線框、灰字 |
| ShopItem | `drawShopItem(ctx, {x,y,item,level,cost,affordable})` | item power/orbBag/armor/longWhip | 左圖示、名稱、效果、「已買 N 次」、右側金幣 + 價格。affordable: 金框、金價格。否: 暗底、灰虛線框、文字半透明、價格紅 |
| FloatText | `drawFloatText(ctx, {x,y,text,kind,t})` | kind gold/repUp/repDown | 文字前加圖示(金幣 / 實心紫星 / 空心星 + 紅斜線); 1 秒內上飄 50px, 0.7~1.2 秒淡出, t>1.2 不畫。text 由 RD 給(例「+5」「-3」) |
| ResultPanel | `drawResultPanel(ctx, {rep,goldEarned,stars})` | stars 0~3 | 全畫面暗幕 + 板: 三顆星(達成實心紫、未達成空心)與門檻 50/120/200、總名聲、累計金幣、閃爍「點畫面重來」 |
| HUD | `drawHud(ctx, {phase,day,gold,rep,hearts,maxHearts,orbs,orbMax,roster,rosterMax,timeLeft,message,subdueProgress})` | phase guide/title/dungeon/show/shop/result | guide、result: 不畫。其餘 y 0~120: 左上「第 N 天 · 階段」、右上金幣 + 名聲、中央剩餘秒數(dungeon/show; ≤5 秒變紅)。dungeon 第二列: 左心、中訊息(紅)、右捕獲球(空的畫虛線圈)+「名單 n/m」(滿了變紅)。show 第二列: 有訊息時左側洋紅訊息, 訊息含「制伏」或 subdueProgress>0 時右側綠色進度條; 無訊息時「上場 N 隻」。shop: 「買強化, 準備明天」 |
| 說明頁示意圖 | `drawGuidePage(ctx, {page,x,y,w,h})` | page 0~4 | 只畫在框內(自帶 clip), 以 600×600 虛擬畫面等比縮放置中。**頁標題、說明文字、頁碼、「點畫面繼續」由 RD 畫**; 圖內只有短標籤(你 / 抓到 / 球碎了 / 沒變 / 不表演 / 表演 / 失控 / 第 1~3 天 / 結算 / 第 3 天後)。建議框 ≥ 560×560 |

說明頁內容: 0 地下城(游標下的玩家往上連發、兩隻魔物放彈、左右虛線閃避箭頭); 1 捕獲(左虛弱 → 綠勾抓到, 右滿血 → 球碎紅叉); 2 揮鞭(馴獸師在游標下、揮鞭圈內兩隻怒氣條升、圈外一隻沒變); 3 怒氣(同一隻水母三格: 趴著 / 表演放水彈 + 金幣名聲 / 衝破圍欄嚇跑觀眾 + 打叉); 4 流程(地下城 → 表演場 → 商店循環 + 第 3 天後指向結算星星)。

## 6. 尺寸表

| 物件 | 像素尺寸(以中心為準) | 備註 |
|---|---|---|
| Player | 72×72; 判定圓(頭)r16 | 槍管頂 y−34 |
| Monster | 120×120; 本體外接約 r46 | 血條 84×7 在 y−57 |
| Bolt | 10×28 | |
| EnemyBullet normal | 直徑 20(r10) | |
| EnemyBullet rock | 直徑 **44(r22)** | 照規格判定半徑 22, **超出介面 size 20×20**; 畫面邊界 = 判定邊界 |
| Orb | 40×40(r19) | |
| Tamer | 72×72; 頭 r16 | |
| ShowMonster | 110×110; 本體約 r38 | 怒氣條 80×9 在 y+42; 制伏環 r50; 失控鋸齒 r39~47 |
| Hazard firering / thunder | 半徑 = state.radius(120 / 70) | 外緣 = 判定 |
| Hazard quake | 外徑 radius、內徑 radius−30 | |
| Hazard waterball | r12 + 身後 40px 尾跡(尾跡不算判定) | |
| 落雷閃電 | 從圓心往上約 radius+260 | 純演出 |
| WhipCrack | 半徑 = state.radius | 外緣 = 判定 |
| Fence | 100×16 | 建議 y 255(上)/ 1010(下), x 對齊觀眾 |
| Visitor | 60×90 | 建議 y 190(上)/ 1080(下) |
| ShopItem | 600×140 | |
| Button | state.w × state.h | |
| TitleCard | 卡 560×440 | 全畫面暗幕 |
| ResultPanel | 板 600×680(y 300~980) | 全畫面暗幕 |
| HUD | 720×120 | |

## 7. 繪製層級(建議由下到上)

地下城: Background → DungeonArena → Bolt → Monster → Orb → EnemyBullet → Player → FloatText → HUD → TitleCard
表演場: Background → ShowArena → Visitor → Fence → Hazard(warn)→ WhipCrack → ShowMonster → Hazard(active, waterball)→ Tamer → FloatText → HUD → TitleCard
商店: Background → HUD → ShopItem → Button; 結算: ResultPanel 蓋全畫面。

## 8. 取捨說明(給製作人)

- 大石照規格半徑 22 畫, 超出介面的 20×20; 若 RD 判定用 20, 請統一。
- HUD 的制伏進度條依規格第 30 條保留, 與魔物身上的進度環重述同一件事(P7 拉扯), 試玩嫌多可拿掉 HUD 那條。
- 動態元素(閃爍、失控鋸齒旋轉、暈眩星星、標題提示呼吸)用自帶時鐘(performance.now), RD 不用傳。
