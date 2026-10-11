# 幕間連鎖秀 — 美術規格(RD 只讀這份)

> index.html 必須宣告 `<meta charset="utf-8">`, art.js 內含中文字串。
> 載入方式: `<script src="art/art.js"></script>`(一般 script, 非 module), 之後用 `window.Art`。
> 所有 `x, y` 皆為物件**中心點**; 唯一例外是 `drawButton` 的 `x, y` 為左上角。

## 1. 邏輯畫布尺寸
720 × 1280(直式)。`Art.canvas = { width: 720, height: 1280 }`。

## 2. 色票表(`Art.palette`)
| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg | #15131d | 全畫面底色 |
| panel / panelHi | #232033 / #2f2b45 | 卡片、商店列、標題卡底; panelHi = 游標所在列的底 |
| text / textDim | #f1eef8 / #a9a3bf | 主文字 / 次要文字、標籤 |
| fire | #ff4f3a | 火蜥蜴: 本體、預警格、技能格、形狀預覽、卡片色帶 |
| water | #1f78e8 | 水母(同上) |
| thunder | #d4f03a | 雷鳥(同上) |
| stone | #d28cff | 石像鬼(同上) |
| hero | #f4f1ea | 玩家(白騎士; 全遊戲唯一白色本體) |
| danger | #ff2d55 | 危險 / 失控 / 名聲減 / 籠子破 / 錢不夠; 面積型一律疊斜線紋 |
| ready | #4ade80 | 怒氣達門檻、暈眩可裝籠、收服成功、樓梯(可前往) |
| gold | #ffb627 | 金幣 |
| rep | #ff7ad9 | 名聲(星形圖示) |
| rageUp / rageDown | #fff1c9 / #7fb6d9 | 怒氣增(白熱上箭頭) / 怒氣減(冷藍下箭頭) |
| hp | #ff6b81 | 地下城魔物血條、玩家心 |
| floor1 / floor2 | #363b4f / #47393f | 地下城地板(第 1 層偏藍、第 2 層偏紅褐) |
| wall / wallTop | #6b6880 / #9591b0 | 牆 |
| stairs | #d8c79a | 樓梯 |
| board / boardHi | #5e3f2c / #7a5539 | 舞台木板(棋盤交錯) |
| curtain / seat | #25366a / #1d1a2a | 舞台兩側布幕 / 觀眾席 |
| rageTrack / rageLow | #14121c / #9aa3bd | 怒氣條底 / 未達門檻的填色 |

## 3. 形狀語言
扁平幾何、深色描邊(#0d0b14)、圓角; **一種意義一種長相**: 種類 = 顏色 + 剪影; 危險 = 斜線紋; 游標 = 白色四角括號; 選中 = 白色實線外框; 可以 / 達標 = 綠。

### 字典(全畫面共用)
| 意義 | 長相 |
|---|---|
| 種類 | 種類色 + 剪影: 火蜥蜴 = 火冠圓身帶尾、水母 = 圓頂 + 4 條波浪觸手、雷鳥 = 展翼菱形 + 鋸齒冠、石像鬼 = 方塊身 + 雙角小翼 |
| 形狀(技能 / 攻擊範圍) | 種類色的方格; 地下城與舞台同色同格狀 |
| 危險(會扣你 / 失控) | 斜線紋(預警格用種類色斜紋、失控用 danger 紅斜紋) |
| 游標所在 | 白色四角括號(舞台格、後台卡片、按鈕、商店列) |
| 選中 | 白色實線外框 + 底色提亮(與游標的「只有四角」不同形) |
| 可以 / 達標 | 綠: 怒氣條達門檻、暈眩可裝籠的綠虛線環、收服打勾、樓梯綠框 |
| 怒氣門檻 | 怒氣條上白色凸出刻度; 條尾紅色端蓋 = 100 失控 |

## 4. 理念落實(經驗文件中「成立」的理念)
- **P0 辨識度先於好看**: 四種魔物同時用色相(紅 6° / 黃綠 69° / 藍 213° / 紫 277°, 兩兩 ≥ 63°; 雷鳥刻意偏黃綠, 避開紅—黃相鄰)、灰階明度(106 / 129 / 174 / 210 分階)與剪影三條通道分辨; 玩家是全畫面唯一白色本體。
- **P1 視覺權重跟著決策迫切度**: 地下城最搶眼的是預警格(種類色斜紋 + 由中心長大的實心方塊), 排陣時最搶眼的是游標括號、選中框與形狀預覽; 背景、布幕、木板全壓在低明度。
- **P2 規則上存在的東西畫面上就存在**: 隱藏計數「疲憊」畫成魔物頭上 3 個點; 暈眩(可裝籠)畫綠虛線環; 門檻畫成怒氣條刻度; 卡片寫出後台每幕漲怒、被點燃值與水母的消氣效果(說明頁刻意不寫, 改由卡片給)。
- **P3 一個意義一種長相**: 種類色在地下城本體、預警格、舞台本體、技能格、形狀預覽、卡片色帶與卡片形狀小圖全部一致; 地下城的「落下」與舞台的「技能格」用同一個畫法(種類色實心 + 白色閃光), 讓玩家自己把兩者連起來。
- **P4 關鍵區分走兩條通道**: 游標(四角括號)vs 選中(整圈實線 + 提亮)形狀不同; 怒氣增(白熱 + 上箭頭)vs 減(冷藍 + 下箭頭)顏色與方向都不同; 預警(半透明斜紋 + 虛線框)vs 落下(實心 + 白實線框)。
- **P7 每個元素都要掙得版面**: 地下城魔物不顯示名字(剪影 + 色已足); 舞台魔物只留本體 + 怒氣條 + 數字; 數值說明只在後台卡片上出現一次。
- **P9 以最混亂的那一刻驗收**: 舞台連鎖時技能格是種類色實心方塊, 魔物本體與怒氣條畫在技能格之上(見繪製層級), 數字帶深色描邊, 任何底色都讀得到。
- **P13 事件要排隊**: 飄字各自從生成點往上飄 1 秒(大場面 1.6 秒)後淡出, 不留卡片; 大場面字牌只在一幕結束後出一次。
- **P15 回饋強度與份量成正比**: 怒氣增減 = 魔物兩側小箭頭(單隻); 表演 = 本體放大 + 種類色放射光芒; 大場面 = 全場唯一的大型金色星爆字牌。
- **P17 進度圖形與數字分工**: 怒氣數字給精確值, 條上的白色刻度給「離門檻還差多少」, 條填色在達門檻時轉綠; 地下城時間數字 + 70 秒總條(沒有更細的決策刻度)。
- **P18 重要資訊不能只閃一瞬**: 當晚金幣 / 名聲在小計卡留存; 結算畫面列總名聲、累計金幣與三個星級門檻。
- **P19 資訊貼著物件**: 疲憊點、血條貼在魔物本體上下; 怒氣條貼在舞台魔物腳下; 失控標記長在卡片本身。
- **P21 示意圖選分岔的例子**: 第 1 頁玩家從十字格走到斜角格(十字外但緊鄰魔物), 讓「整片都危險」與「只有亮格危險」兩種理解畫出不同結果; 第 5 頁雷鳥怒氣條畫成剛跳過刻度(接力要達門檻)。

## 5. 物件表

| 物件 | 函式 | state 欄位 | 各狀態視覺差異 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | 無 | 全畫面 bg 純色 |
| Tile | `drawTile(ctx, s)` | x, y, kind(`floor`/`wall`/`stairs`), floor(1/2) | floor: 暗石板, 第 1 層偏藍、第 2 層偏紅褐; wall: 亮紫灰磚塊 + 磚縫; stairs: 地板上 4 階往下的米黃階梯 + 綠框 |
| Hero | `drawHero(ctx, s)` | x, y, facing(`up`/`down`/`left`/`right`), moving, attacking, blink | 白色圓身 + 深藍面罩與尖端朝 facing; moving: 身後 3 條速度線; attacking: 面前半圈白色劍弧 + 劍身; blink: 整體不透明度 0.3(**RD 負責交替 true/false 產生閃爍**) |
| WildMonster | `drawWildMonster(ctx, s)` | x, y, species, hp, maxHp, tired(0~3), dazed, casting, hit | 本體依種類; 頭上 3 個點 = 疲憊(白實心 = 已撲空); 腳下分格血條(hp/maxHp); casting: 種類色粗實線環 + 怒眼; dazed: 綠虛線環 + 漩渦眼 + 頭上 3 顆白星(疲憊點隱藏); hit: 本體白閃 + 右偏 2px |
| WarnTile | `drawWarnTile(ctx, s)` | x, y, species, phase(`warn`/`strike`), t | warn: 種類色淡底 + 斜線紋 + 虛線框, 中央實心方塊隨 t/0.9 長大, 長滿 = 落下; strike: 種類色實心 + 白實線框, 中央白閃在 0.2 秒內淡掉 |
| Cage | `drawCage(ctx, s)` | x, y, result(`flying`/`caught`/`broken`), t | flying: 旋轉的白色籠子; caught: 綠底籠子 + 綠勾, 0.25 秒內放大到定位; broken: 籠子左右裂開 + 紅叉, 0.6 秒內變淡 |
| Stage | `drawStage(ctx)` | 無 | 舞台後牆 + 兩側布幕(y 120~640)、舞台木板底(x 120~600, y 140~620)與台口、觀眾席(y 640~760)+「觀眾」小字、「後台」小字(y 777)+ 後台底板(x 14~706, y 790~1112)。**不含 HUD 與按鈕** |
| StageCell | `drawStageCell(ctx, s)` | x, y, col, row, cursor, preview, previewSpecies | 一般: 木板格; preview: 種類色半透明填色 + 種類色虛線框; cursor: 白色四角括號(可與 preview 同時) |
| StageMonster | `drawStageMonster(ctx, s)` | x, y, species, rage, threshold, mode, selected | 本體 + 腳下怒氣條(門檻刻度)+ 右側怒氣數字; idle: 一般; performing: 本體放大 1.08 + 種類色放射光芒; ignited: 本體白閃 + 兩側白熱上箭頭; doused: 本體變暗縮小 + 兩側冷藍下箭頭; loose: 暗紅本體、怒眼、紅圈、紅斜紋底、怒氣條紅色; selected: 白色實線圓角框 + 提亮底 |
| SkillTile | `drawSkillTile(ctx, s)` | x, y, species, t | 種類色實心方塊 0.15 秒內長滿 + 白框, 前 0.25 秒中央白閃, 0.5~0.8 秒淡出。**y > 630 視為觀眾區, 自動收成 144×112** |
| Audience | `drawAudience(ctx, s)` | x, y, col, mood(`calm`/`cheer`/`scared`) | 一欄 3 位觀眾; calm: 灰紫、平嘴; cheer: 暖膚色、舉雙手、張嘴笑、頭上金色小星、欄底淡金; scared: 冷藍、後仰、O 嘴、兩側紅「!」、欄底淡紅 |
| BackstageCard | `drawBackstageCard(ctx, s)` | x, y, species, rage, threshold, cursor, selected, loose, sellPrice | 頂部種類色帶; 左上本體、右上形狀小圖(白點 = 施放者, 色格 = 打到的格); 名字; **夜場**(sellPrice = null): 怒氣條 + 數字、「後台 +N」、火 / 雷 / 石「被點 +N」、水母「技能 同伴−25」; **商店**(sellPrice 有值): 改顯示「放生」+ 金幣 + 價格; selected: 底提亮 + 白色實線框; cursor: 白色四角括號; loose: 整張變暗 + 紅斜紋 + 大紅叉 +「失控」 |
| Button | `drawButton(ctx, s)` | x, y(**左上角**), w, h, label, cursor | 一般: 暗紫圓角鈕、灰字; cursor: 亮紫底、白字 + 白色四角括號 |
| ShopItem | `drawShopItem(ctx, s)` | x, y, item(`sword`/`cageBag`/`armor`/`encore`), level, cost, affordable, maxed, cursor | 左圖示 + 名稱 + 效果說明; level > 0 顯示「已買 N」; 買得起: 金幣 + 金色價格; 買不起: 圖示變淡、紅色價格 +「不足」; maxed: 「已達上限」灰字(不顯示價格); cursor: 底提亮 + 白色四角括號 |
| TitleCard | `drawTitleCard(ctx, s)` | day, stage(`dungeon`/`show`/`nightSummary`), goldNight, repNight | 全畫面暗幕 + 中央面板(x 80~640, y 380~860); dungeon:「第 N 天 / 地下城 / 2 層 · 共 70 秒」+ 三隻魔物; show:「第 N 天 / 夜場 / 排好站位, 開幕」; nightSummary:「今晚小計」+ 金幣 +goldNight、名聲 ±repNight(負數紅色); 底部「空白鍵繼續」 |
| FloatText | `drawFloatText(ctx, s)` | x, y, text, kind, t | 文字由 RD 傳(例 `+12`); 左側自動配圖示: gold = 金幣、repUp = 粉星、repDown = 紅星 + 抖動、rageUp = 白熱上箭頭、rageDown = 冷藍下箭頭; 1 秒內上飄 48px, 後 0.4 秒淡出。bigShow: 金色 12 角星爆字牌 + text(空字串時顯示「大場面!」), 0.2 秒彈出, 共 1.6 秒 |
| ResultPanel | `drawResultPanel(ctx, s)` | rep, goldEarned, stars(0~3) | 全畫面暗幕 + 面板; 3 顆大星(達到的金色)+ 各自門檻「名聲 40 / 100 / 160」; 總名聲、累計金幣; 底部「空白鍵重來」 |
| HUD | `drawHud(ctx, s)` | phase, day, floor, gold, rep, hearts, maxHearts, cages, cageMax, act, actMax, rosterCount, rosterMax, timeLeft, message | phase = dungeon: 頂部 0~140 暗條; 「第 N 天 · 第 F 層」、中央剩餘秒數 + 70 秒總條(≤ 10 秒變紅)、右上金幣; 第二列心(maxHearts 個)、籠(x 400 起, cageMax 個, 用掉變暗)、右側「名單 a/b」(滿了變紅); 第三列 message。arrange / perform: 頂部 0~120;「第 N 天 · 夜場」、中央「第 act / actMax 幕」、右上金幣 + 名聲; message 在 y 100。shop: 同夜場但標「商店」、不顯示幕數。guide / title / result: 不畫條, 只在畫布底部 y 1250 畫 message(有值時) |
| 說明頁示意圖 | `drawGuidePage(ctx, s)` | page(0~4), x, y, w, h | 只畫在 (x, y, w, h) 框內(會 clip), 內容以 640×480 設計後等比縮放置中。**頁標題、說明文字、頁碼、「空白鍵繼續」由 RD 畫** |

### 說明頁各頁內容
| page | 示意 |
|---|---|
| 0 | 7×5 地圖一角, 火蜥蜴施放中、十字預警格; 半透明的玩家在十字內(旁邊打叉的心), 虛線箭頭走到斜角格的玩家, 標「你」 |
| 1 | 三格連環: 水母疲憊點 1 → 2(旁邊各一格落下的亮格、玩家站在外面), 第三格暈眩 + 籠子罩住打勾 + 玩家面向牠 + 鍵帽「C」; 標「撲空 1 / 撲空 2 / 撲空 3 → 暈」 |
| 2 | 地圖一角: 玩家揮劍打中面前的火蜥蜴(白閃、血條少一格), 鍵帽「空白」; 最上列樓梯格 + 綠色箭頭 + 「樓梯」 |
| 3 | 縮小的 3×3 舞台 + 觀眾列; 後台一張雷鳥卡片被選中, 虛線箭頭指向舞台中間格(游標), 四個斜角格亮雷鳥形狀預覽; 鍵帽「空白」與「Enter」=開幕 |
| 4 | 縮小舞台: 火蜥蜴(1)表演中放出十字, 打到右邊的雷鳥(2)→ 雷鳥點燃、怒氣條跳過刻度、+30; 雷鳥斜角打到觀眾區左欄, 觀眾歡呼、金幣飄字; 右上角一張石像鬼後台卡片失控; 底部流程小圖「地下城 → 夜場 4 幕 → 商店 × 3 天 → 評星」 |

## 6. 尺寸表(畫面邊界 = 介面 size, 已用追蹤變換的假 ctx 逐狀態驗證無超框)
| 物件 | 尺寸 | 備註 |
|---|---|---|
| Tile | 80 × 80 | 自帶 clip |
| Hero | 64 × 64 | 身體半徑 23(≈ 碰撞框 50); 揮劍弧外緣 31 |
| WildMonster | 72 × 72 | 本體外接半徑 23(中心上移 2); 狀態環半徑 33; 疲憊點 y −31; 血條 y 27~33 |
| WarnTile | 80 × 80 | |
| Cage | 48 × 48 | |
| StageCell | 160 × 160 | 自帶 clip |
| StageMonster | 130 × 130 | 本體外接半徑 38(中心上移 12); 怒氣條 x −58~18, y 42~54; 數字右對齊 x 61 |
| SkillTile | 舞台 144 × 144 / 觀眾區 144 × 112 | 以 y > 630 判斷觀眾區, 收進該欄 160 × 120 |
| Audience | 160 × 120 | |
| BackstageCard | 124 × 150 | 卡身 120 × 146; 括號貼外框 |
| Button | 依 w, h | 圓角鈕內縮 4px |
| ShopItem | 600 × 80 | |
| TitleCard / ResultPanel | 全畫面 | 自帶暗幕 |

## 7. 繪製層級(由下而上, RD 照這個順序呼叫)
- **地下城**: Background → Tile(全部)→ WarnTile → WildMonster → Hero → Cage → FloatText → Hud →(標題卡時)TitleCard
- **夜場**: Background → Stage → StageCell → SkillTile → Audience → StageMonster → BackstageCard → Button → FloatText(bigShow 最後)→ Hud →(小計時)TitleCard
- **商店**: Background → ShopItem → BackstageCard(sellPrice 帶值)→ Button → Hud
- **說明頁**: Background → RD 的標題與文字 → drawGuidePage → Hud(phase guide)
- **結算**: Background → ResultPanel

## 8. 取捨與給 RD 的提醒
- 卡片上的「後台 +N / 被點 +N / 水母 −25」數值寫在 art.js 內部的種類表(照 spec 種類表); spec 改這些數值時美術要同步。
- SkillTile 以 y 判斷是否在觀眾區(介面只給一個 160 × 160 的 size)。若 RD 把觀眾區中心 y 改掉, 需通知美術。
- Hero 的 blink 只畫「這一幀半透明」, 閃爍的節奏由 RD 交替 true / false 產生。
- 游標括號、選中框都在物件框內; 卡片、商店列、舞台格的游標不會蓋到相鄰物件。
