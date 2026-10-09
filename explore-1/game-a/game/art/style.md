# 大場面動物園: 紅線邊緣 — 美術規格(給 RD)

> index.html 必須宣告 `<meta charset="utf-8">`, 否則 art.js 裡的中文會變亂碼。
> 用 `<script src="art/art.js">` 一般 script 載入(不用 module), 載入後取 `window.Art`。

## 邏輯畫布尺寸
720 × 1280(直式)。`Art.canvas = { width: 720, height: 1280 }`。

## 色票表
| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg | #141826 | 全畫面底色 |
| hudBg | #0d1019 | HUD 底(0~120) |
| panel / panelHi | #232a3d / #2f3852 | 結算面板 / 商店卡片 |
| text / textDim | #f4f1e8 / #8d96ab | 主文字 / 次要文字 |
| outline | #0a0c14 | 所有描邊與文字襯底 |
| fire | #ff8a2a | 火蜥蜴(色相約 28°) |
| water | #3cc8e8 | 水母(約 191°) |
| thunder | #a970ff | 雷鳥(約 266°) |
| stone | #a4a196 | 石像鬼(低彩度灰) |
| rageLow | #6b7a99 | 怒氣 0~39(不表演) |
| rageShow | #ffb02e | 怒氣 40~79(一般表演)、×1 倍率章 |
| rageRed / danger | #ff3b3b | 紅線(80)、紅線區、失控、破損、逃脫魔物、名聲減少、怒氣增加 |
| gold | #ffd54a | 金幣 |
| bigshow | #ffd54a | 大場面(刻意與金幣同色: 大場面 = 最賺) |
| rep | #7dff9c | 名聲增加(星) |
| hp | #5ee07a | 血量條(玩家與魔物同一個長相)、捕獲成功勾 |
| net | #f4e7c3 | 捕獲網繩 |
| netMode | #8ff0ff | 丟網模式: 按鈕「啟用中」、魔物瞄準框 |
| warn | #ff5ad1 | 遊客拍玻璃預警(全畫面只有它用洋紅) |
| calm | #a8e4ff | 安撫波紋、怒氣減少飄字 |
| select | #fff3c4 | 選中(候展魔物、籠子) |
| btn / btnOff | #ffe7a8 / #3a4152 | 按鈕可按 / 不可按 |

## 形狀語言
圓角、粗深色描邊、扁平填色; 魔物用剪影區分種類(長身尾火 / 圓傘觸手 / 圓身閃電冠 / 方身蝙蝠翼), 顏色只當第二通道; 危險一律紅, 選中一律奶白虛線。

## 理念落實
- P0 辨識度先於好看: 四種魔物先用剪影區分, 色相再拉開(28° / 191° / 266° / 灰), 縮到候展區 76px 仍分得出。
- P1 迫切度決定權重: 開園時最需決策的是怒氣條與紅線; 紅線是全畫面唯一超出條外的紅色直條, 紅線區整個籠框轉紅並脈動, 表演特效被剪裁在內室、不蓋讀數槽。
- P2 規則上存在就要看得到: 拍玻璃 1.5 秒預警有洋紅手掌 + 倒數環; 逃脫魔物還要點幾下, 畫成外圈三段; 不表演(怒氣 < 40)畫成趴睡 + zZ; 破損籠子畫碎玻璃 + 「破損」字。
- P3 同一意義同一長相: 紅 = 危險 / 失控 / 扣名聲; 奶白虛線 = 選中; 血量條玩家與魔物共用; 說明頁直接呼叫遊戲內函式畫物件。
- P4 兩條通道: 怒氣三段同時換填色與魔物姿勢(睡 / 站 / 怒 + 蒸氣); 按鈕「可按」實心浮起、「不可按」灰底虛線、「啟用中」按下去 + 發光; 商店買不起同樣是灰色虛線價格章。
- P7 每個元素要掙得版面: 怒氣條不寫數字(只看三段與紅線); 種類不配名字; 籠子空時不加「空」字。
- P9 最混亂時驗收: 4 籠同時紅線 + 特效 + 逃脫魔物時, 讀數槽仍在每籠固定位置, 特效不進讀數槽; 逃脫魔物帶紅色底圈, 在步道上不會混進遊客。
- P13 事件要排隊: 本作的事件都長在各自的物件上(籠子 / 魔物), 沒有全畫面橫幅; 飄字由 RD 依時間錯開。
- P15 回饋強度隨份量: 表演特效 一般 3 個元素 < 紅線區 6 個 + 外環 < 大場面 9 個 + 金色星屑 + 籠頂「大場面」字牌 + 金色聚光。
- P17 進度的圖形與數字分工: 倍率章的數字給 ×2 / ×3 / ×4, 外環只畫「離下一級倍率還差幾秒」(每 4 秒滿一圈後重跑)。
- P18 重要資訊不只存在一瞬間: 金幣與名聲飄字之外, HUD 右側常駐金幣、名聲; 結算面板留總數。
- P19 資訊貼著物件: 怒氣條、倍率章、預警手掌都長在籠子上; 剩餘抓回次數長在逃脫魔物外圈。
- P21 示意圖挑會分岔的例子: 說明第 3 頁並排「滿血 → 網裂開打叉」與「殘血 → 收袋打勾」。

## 物件表
所有 `x, y` 是物件**中心**; `drawButton` 的 `x, y` 是**左上角**。每個函式都自己 save / restore。

| 物件 | 函式 | state 欄位 | 各狀態視覺 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | 無 | 整片 #141826 |
| 地下城房間 | `drawDungeonRoom(ctx, {day, room})` | day 1~3, room 1~2 | 磚牆 + 透視地板(地平線 y=560); 第 1 / 2 / 3 天分別是褐 / 藍灰 / 紫的色調; 第 2 房後方拱門更黑; y 1150~1280 畫按鈕底帶 |
| 動物園場地 | `drawZooGround(ctx)` | 無 | 籠子區地磚 120~790、欄杆 786、遊客步道 790~1010、候展區木架 1012~1148(左上角小字「候展區」)、按鈕底帶 1148~1280 |
| 玩家 | `drawPlayer(ctx, {x, y, hp, maxHp, hit})` | hit: 布林或剩餘秒數(0.3 秒為滿強度) | 背影冒險者(藍披風、舉劍、背網袋); 受擊 = 左右震 + 紅色光暈; 框底 y+66 有綠色血量條 |
| 野生魔物 | `drawMonster(ctx, {x, y, species, hp, maxHp, hit, aimNet})` | species: fire / water / thunder / stone | 站姿; 受擊 = 震動 + 白色衝擊星芒 + 怒眼; aimNet = 青色虛線慢轉圈 + 四角括號; 下方血量條 + 「hp/max」數字 |
| 捕獲網 | `drawNet(ctx, {x, y, t, result})` | result: flying / success / fail; t: 秒 | flying: 旋轉的網片從半徑 22 張開到 72(0.35 秒); success: 收成網袋 + 綠勾, 0.9 秒後淡出; fail: 網裂兩半往下掉 + 灰叉, 0.8 秒後淡出 |
| 籠子 | `drawCage(ctx, {x, y, species, rage, tier, streak, warn, calmFlash, broken, selected})` | 見 interface.json notes | 見下方「籠子狀態對照」 |
| 表演特效 | `drawShowEffect(ctx, {x, y, species, tier, t})` | x,y = **籠子中心**; tier none 不畫 | 剪裁在籠子內室(不蓋怒氣條)。火: 火焰往外噴; 水: 水珠拋物線 + 泡泡; 雷: 閃電從上劈下 + 閃光; 石: 圓石落下 + 地面震波。一般 3 個元素、紅線區 6 個 + 外環、大場面 9 個 + 金色星屑。0.7 秒起淡出, 約 1.05 秒消失(建議 RD 播 1.1 秒) |
| 逃脫魔物 | `drawLooseMonster(ctx, {x, y, species, hitsLeft, hit})` | hitsLeft 0~3 | 怒姿魔物 + 紅色脈動底圈; 外圈分 3 段, 剩幾下就亮幾段紅、用掉的變暗; 受擊 = 震動 + 白色星芒 |
| 遊客 | `drawVisitor(ctx, {x, y, scared})` | | 觀看: 背影站立(衣色依 x 固定挑, 低彩度); 嚇跑: 身體傾斜、雙手高舉、張嘴、汗滴 |
| 候展魔物 | `drawTrayMonster(ctx, {x, y, species, selected})` | | 未選中: 站在木底座上; 選中: 抬高 8px + 奶白圓框 + 底座亮邊 |
| 按鈕 | `drawButton(ctx, {x, y, w, h, label, enabled, active})` | x,y 左上角 | 可按: 奶黃實心 + 下方厚度; 不可按: 灰底 + 灰虛線框 + 灰字; 啟用中(丟網模式): 青色、往下壓 6px、外發光脈動。字級 = min(34, h×0.42) |
| 商店項目 | `drawShopItem(ctx, {x, y, item, level, cost, affordable})` | item: weapon / armor / netBag / goodNet | 左圖示(劍 / 盾 / 網袋 +1 / 網 + 星)、名稱、效果、Lv.n; 右價格章。買得起: 卡片亮、價格章奶黃浮起; 買不起: 卡片暗、內容 50% 透明、價格章灰底虛線 |
| 飄字 | `drawFloatText(ctx, {x, y, text, kind, t})` | kind: gold / repUp / repDown / rage | 1 秒內上升 70px, 0.7 秒起淡出, 1.2 秒消失。gold 金幣圖示 + 金字; repUp 綠星 + 綠字; repDown 紅星 + 紅字(稍大); rage: text 以「-」或「−」開頭 → 水滴 + 安撫藍, 否則 → 火苗 + 紅 |
| 結算面板 | `drawResultPanel(ctx, {rep, goldEarned, stars})` | stars 0~3 | 全畫面暗幕 + 中央面板: 標題「三天結算」、3 顆大星(亮幾顆)、總名聲、累計金幣、門檻小字、閃爍的「點畫面重來」 |
| HUD | `drawHud(ctx, {phase, day, gold, rep, hp, maxHp, nets, netMax, timeLeft, room, message})` | phase guide / result 不畫 | 0~120: 左「第 N / 3 天」+ 階段名; 右金幣、名聲(位置固定); 中間 dungeon = HP 條 + 網圖示(實心 = 有、虛線 = 用掉; netMax > 7 改成「n / max」); show = 剩餘秒數大字(≤10 秒轉紅)。message 非空時畫在 HUD 下方 y 124~158 的膠囊, 含「抓回」字樣自動換紅底 |
| 說明頁示意圖 | `drawGuidePage(ctx, {page, x, y, w, h})` | page 0~4 | 只畫在框內(內部以 640×640 等比縮放置中)。頁標題、說明文字、頁碼、「點畫面繼續」由 RD 畫 |

### 籠子狀態對照(drawCage)
| 條件 | 外觀 |
|---|---|
| species = null 且未破損 | 空內室, 灰框, 讀數槽空白 |
| tier none | 魔物趴睡、閉眼、飄 zZ; 怒氣條灰藍; 無倍率章 |
| tier show | 魔物站姿; 怒氣條琥珀; 橘色「×1」章 |
| tier frenzy | 魔物怒眼 + 蒸氣 + 輕微抖動 + 紅色光暈; **籠框轉紅並脈動**; 怒氣條紅; 紅色倍率章 ×2 / ×3(由 streak 算: <4 秒 ×2, <8 秒 ×3), 外環 = 距下一級的進度 |
| tier bigshow | 同上但光暈、籠框、倍率章(×4)都換金色; 內室金色聚光旋轉; 籠頂金色「大場面」字牌 |
| warn > 0 | 左上角洋紅手掌在拍 + 洋紅倒數環(以 1.5 秒為滿, 剩多少畫多少); 玻璃泛洋紅閃 |
| calmFlash > 0 | 內室泛淡藍 + 淡藍波紋往外擴(以 0.3 秒為滿) |
| broken | 魔物不畫、怒氣條不畫; 玻璃裂紋 + 碎片 + 紅爪痕; 紅色虛線框; 讀數槽寫紅字「破損」 |
| selected | 奶白虛線框沿籠框流動(與候展魔物選中同色) |

怒氣條: 寬 186 × 高 20, 底色分三段(0~40 / 40~80 / 80~100), 40 有黑刻度, 80 有超出條上下的紅色直條(紅線)。

## 尺寸表
| 物件 | 尺寸(= interface.json 判定範圍) | 備註 |
|---|---|---|
| Player | 160×160 | 血量條在中心下 66 |
| Monster | 160×160 | 本體約 116, 血量條在中心下 52, 數字在下 64 |
| Net | 160×160 | 張開最大半徑 72 |
| Cage | 300×280 | 內室 280×202(中心上方), 讀數槽 280×52(中心下 80~132), 魔物本體 140 畫在中心上 34 |
| ShowEffect | 300×280 | 只畫在籠子內室 |
| LooseMonster | 120×120 | 本體 92, 外圈半徑 54 |
| Visitor | 60×90 | |
| TrayMonster | 100×100 | 本體 76 |
| Button | RD 給 w×h | 建議高 80~90; 按下 / 厚度往下多 6px |
| ShopItem | 600×140 | |
| FloatText | 約字寬 + 32 × 34 | 字 30px(repDown 32px) |
| HUD | 720×120 + 訊息膠囊 y 124~158 | |
| ResultPanel | 全畫面, 面板 600×720 在 (60, 250) | |

## 繪製順序(建議)
動物園: drawBackground → drawZooGround → drawCage(全部)→ drawShowEffect → drawVisitor → drawLooseMonster → drawTrayMonster → drawButton → drawFloatText → drawHud → drawResultPanel。
地下城: drawBackground → drawDungeonRoom → drawMonster → drawPlayer → drawNet → drawButton → drawFloatText → drawHud。
商店: drawBackground → drawShopItem → drawButton → drawHud。

## 說明頁示意內容(drawGuidePage)
| page | 示意 |
|---|---|
| 0 | 兩籠表演(水母一般、火蜥蜴紅線區)+ 金幣飄字; 下方 6 名遊客; 右上迷你名聲讀數 + 「+3」名聲飄字; 左上「第 1~3 天」 |
| 1 | 地下城三隻魔物, 手指點中間火蜥蜴: 受擊星芒、血條 6/10; 下方玩家 |
| 2 | 上: 「捕獲網」按鈕啟用中 + 手指 → 網飛向殘血雷鳥(瞄準框)→ 箭頭 → 雷鳥在候展區。下: 「滿血」石像鬼 + 網裂打叉 / 「殘血」水母 + 網袋打勾 |
| 3 | 左: 怒氣低, 石像鬼趴睡; 右: 怒氣高, 雷鳥大場面放閃電 + 金幣飄字 |
| 4 | 左: 手指點火蜥蜴籠子, 安撫波紋、怒氣 −15、怒氣條旁向下小箭頭; 右: 破損籠 → 逃脫水母衝向嚇跑遊客, 紅叉 + 名聲 −3 |

## 待 RD 注意
- `hit` 可給布林或剩餘秒數(建議 0.3 秒倒數到 0, 會自然淡掉)
- 籠子內的魔物、怒氣條都在 drawCage 裡, 不用另外呼叫
- drawShowEffect 的 x,y 給籠子中心, 不是魔物中心
- 脈動、抖動、zZ 等小動態用 `performance.now()` 自己算, RD 不必傳時間
