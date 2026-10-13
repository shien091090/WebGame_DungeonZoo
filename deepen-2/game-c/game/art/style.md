# 失控邊緣秀 — 美術規格(RD 只讀這份)

> index.html 必須宣告 `<meta charset="utf-8">`, 否則 art.js 裡的中文字會變亂碼。
> 載入方式: `<script src="art/art.js"></script>`(非 module), 之後用全域 `window.Art`。

## 邏輯畫布尺寸

720 × 1280(`Art.canvas`)。所有 x, y 為畫面座標、物件中心(地下城已加 y 偏移 130); 例外: `drawButton` 的 x, y 是左上角。

## 色票表

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg | #14101c | 全畫面底 |
| panel / panelHi / line | #231c30 / #33294a / #4a3f63 | 卡片、面板底、選中卡底、面板框線 |
| text / textDim | #f4eee2 / #a89cbf | 主要字 / 次要字 |
| tamer | #2c3e7a | 馴獸師外套 |
| tamerRim | #ffc23a | **玩家專屬金**: 馴獸師金邊、武器技特效、被打回的投射物外框、繞圈進度、選擇框、「裝備中」 |
| playerFx | #ffffff | 普攻特效 |
| capture | #7dffb0 | 準備捕捉環與字、「收服!」 |
| rope | #d9a066 | 繩、捕獸繩圖示 |
| edge | #ff3b6b | **規則色(紅區 / 失控)**: 怒氣條紅區、失控標記、倍率字描邊、失控外光、破欄虛線。只用在線、記號、字, 從不填在魔物本體 |
| ignite | #ff8a1a | 升怒(被點燃型技能、戰鼓): 橘色圓頭火苗 + 往外擴環 |
| douse | #59c8ff | 降怒(被澆熄型、噴泉、安全閥): 水藍水滴 / 安全閥往內收環 |
| rageLow / rageMid | #8d97a8 / #f2b84b | 怒氣 < 50(不表演)/ 50 ~ 紅區下限 |
| gold | #ffd23f | 金幣圖示與數字 |
| rep | #d6a8ff | 名聲星 |
| heart | #ff5068 | 心 |
| danger | #ff3b3b | 價格買不起、時間 ≤ 10 秒、套索快斷、打叉 |
| ok | #6fe08a | 「已開放」「上場」、打勾 |
| fire 火蜥蜴 | #e0452a | 色相 9°, 灰階 112 |
| water 水母 | #2f7fe8 | 色相 214°, 灰階 115 |
| thunder 雷鳥 | #f0d020 | 色相 51°, 灰階 198 |
| spike 刺蝟 | #5fae3a | 色相 101°, 灰階 137 |
| stone 石像鬼 | #8a62d0 | 色相 262°, 灰階 123 |
| ghost 幽靈 | #a8f0e8 | 色相 173°, 灰階 218 |

**張力(寫明讓製作人驗收)**:
- 6 種魔物色無法兩兩 ≥ 60°(火 9° / 雷 51° 只差 42°; 火、水、石灰階相近)。魔物主辨識靠**剪影**(蜥蜴 / 水母傘 / 鳥 / 刺球 / 方塊石像 / 床單幽靈), 顏色是第二通道; 火與雷再用明度拉開(112 vs 198)。
- 規則色 edge(345°)與火蜥蜴(9°)只差 24°。照經驗「規格用顏色替機制命名」處理: edge 只出現在線與記號; 魔物在紅區時怒氣條紅段內夾一條白細線、失控外光內圈夾白細線, 分界靠明度。驗收用「火蜥蜴在紅區、帶標記」這個最差組合。

## 形狀語言

扁平填色 + 深色描邊; 魔物 = 有眼睛的圓潤剪影 + 橢圓地影; 機關 = 方形底座 + 菱形地墊(無臉); 馴獸師 = 唯一帶金邊的圓; 危險預警 = 虛線外框 + 由中心長大的填色(填滿 = 生效); 功能性記號一律圓頭, 不用並排的尖角(尖角只屬刺蝟)。

## 理念落實

- **P0 辨識度先於好看**: 6 種魔物靠剪影先分、色第二; 地形只有熔岩是高飽和亮橘 + 黃框(會傷人), 其他地板壓低對比。
- **P1 視覺權重跟著決策迫切度**: 地下城最亮的是技能預警(虛線 + 長大的填色)與馴獸師金邊; 地板與牆低對比; 表演場最醒目的是倍率字與失控標記, 場地底刻意灰暗。
- **P2 規則上存在就要畫出來**: 野生魔物頭頂血條畫出 30% 殘血刻度; 套索有長度張力(變紅變細 + 閃白虛線)與時限外環; 失控標記的自動 −1 倒數畫成最新一顆菱形外的白弧; 震波畫出完整判定帶寬 30。
- **P3 一本字典**: 金 = 玩家(邊、武器技、繞圈、選擇框); 橘火苗 = 升怒、藍水滴 = 降怒(表演場魔物身上、機關脈衝共用); edge 紅 = 紅區 / 失控; 說明頁一律呼叫遊戲內畫法並給規則上成立的 state。
- **P4 關鍵區分兩條通道**: 升怒 vs 降怒 = 色(橘 / 藍)+ 形(火苗往上 / 水滴往下); 戰鼓 / 噴泉脈衝外擴 vs 安全閥內收(方向 + 白色); 被打回的投射物 = 白芯 + 金框(換色 + 外框); 殘血 = 血條變橘紅 + 冷汗水滴 + 閉眼下垂; 暈眩 = 星星 + 螺旋眼。
- **P7 每個元素掙得版面**: 倍率不在紅區不畫; 失控標記 0 個時整列不畫; 機關不畫作用範圍圈(範圍只在脈衝時出現, 見下方取捨)。
- **P9 以最混亂的一刻驗收**: 怒氣條、倍率、標記都有深色襯底 / 描邊, 壓在火圈、震波上仍讀得到; 表演場魔物的 fx 只長在本體外緣一圈。
- **P13 事件排隊**: 飄字只在物件上方往上飄 40px、1 秒淡出; 同一隻的表演光圈、fx、飄字分在本體 / 外緣 / 上方三帶, 不互疊。
- **P15 回饋強度與份量成正比**: 一般金幣 22px 金字 < 紅區金幣 28px 白字粗 edge 描邊 < 失控(整圈 edge 外光 + 5 格全亮 + 抖動); 倍率字 ×2 → ×4 字級 14 → 22, ≥ ×3.5 脈動。
- **P17 進度圖形與數字分工**: 地下城計時條畫總量(沒有其他圖形重述), 數字給秒; 準備捕捉、繞圈、套索時限只有圖形, 畫總進度。
- **P18 重要資訊不只一瞬間**: 收服 / 等級 +1 飄字之外, 等級留在陣容卡、結算與怒氣條旁的 Lv; 邊緣表演次數留在結算。
- **P19 資訊貼著物件**: 倍率、Lv、標記、怒氣條全在魔物自己的 100×100 框內; 準備捕捉字樣在被捕的魔物頭上; 說明頁鍵帽貼在做那個動作的物件旁。
- **P21 示意圖選分岔例子**: 第 4 頁並排 0 / 2 / 4 個標記 → ×2 / ×3 / ×4, 最右一隻是 5 個 → 失控, 讓「越多越賺」與「滿 5 就爆」在同一列分出來。

## 物件表

所有函式 `(ctx, state)`, 自己 save / restore。表外列舉值會畫成括號內的預設; 看到不該出現的預設外觀, 先查傳入值。

| 物件 | 函式 | state 欄位 | 各狀態視覺差異 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | — | 全畫面 bg 色 |
| Tile | `drawTile` | x, y, dungeon(cave), kind(floor), room(hall), nest | dungeon 換整套地板 / 牆色(洞窟紅褐碎石、雷鳴崖藍灰岩紋、遺跡黃褐石磚); wall 深塊 + 亮頂邊; pillar 圓柱帶影; lava 亮橘 + 黑裂紋 + 黃框 + 亮斑脈動; water 深藍 + 水紋; hall 比房間暗一階; nest = 一圈小石 + 乾草(只畫在 floor) |
| Tamer | `drawTamer` | x, y, facing(0), weapon(club), dashing, blink, lassoing | 圓身半徑 18 = 判定圓, 金邊; 帽與臉朝 facing; 右手武器隨 weapon 換形; dashing 外加白青光環; blink 以 80ms 交替半透明(美術自己閃, RD 只需整段給 true); lassoing 背後一捲繩 |
| WildMonster | `drawWildMonster` | x, y, species(fire), hp, maxHp, hit, weak, stunLeft, stunDur, lassoed, casting, dashing, dir | 頭頂血條(30% 白刻度); hit 全身白; weak 血條橘紅 + 冷汗水滴 + 閉眼 + 下垂; stunLeft > 0 星星 + 螺旋眼 + 黃色剩餘弧; lassoed 星星 + 螺旋眼 + 頸上繩圈(不閃白); casting 本體外種類淡色脈動圈; dashing 身後速度線(雷鳥翅膀上揚); dir 左右翻 |
| CaptureRing | `drawCaptureRing` | x, y, t, dur | 虛線薄荷綠底環(半徑 42)+ 實線進度 t/dur, 從 12 點順時針; 上方「準備捕捉」 |
| Lasso | `drawLasso` | x1, y1, x2, y2, progress, t, limit, len, maxLen | 繩: len/maxLen < 0.75 鬆垂褐色, 0.75~0.9 橘, ≥ 0.9 紅細 + 閃白虛線; 魔物周圍半徑 52 金色繞圈進度環 + 兩個方向小箭頭; 半徑 60 白細環 = 剩餘時限, 剩 < 1.5 秒紅白閃 |
| Hazard | `drawHazard` | x, y, kind(firering), phase, radius, t, dur, angle, reflected | 見下方「判讀約定」; 預警 = 種類色虛線框 + 由中心長大的填色(t/dur, 填滿 = 生效), 落雷多一個準星; 生效 = 實心面(火圈火舌、落雷白色雷柱閃過即淡); 投射物 = 種類色實心 + 拖尾, 鬼火在最後 25% 淡出; reflected = 白芯 + 金框 + 金拖尾 |
| WeaponFx | `drawWeaponFx` | x, y, weapon, move, shape, angle, spread, radius, length, width, t, dur | normal 白、skill 金; arc 扇形面 + 外緣 + 隨 t 掃過的前緣線(劍的 skill 多三顆暈眩星); circle 整圈 + 旋轉亮段; line 長方形框 + 中線刺出; dash 金色殘影帶 + 三個殘影圈; 隨 t 淡出 |
| DungeonCard | `drawDungeonCard` | x, y, dungeon, open, condition, selected | 上緣該地下城的牆色條 + 名稱; 兩隻魔物圖 + 名; open: 綠框「已開放」; 未開放: 魔物灰化 + 鎖 + condition 字串; selected 金框 |
| RosterCard | `drawRosterCard` | x, y, species, level, picked, selected | 魔物圖 + 名稱 + 「Lv N」; picked: 底亮一階、種類色框、綠底「上場」膠囊; 未選: 虛線空膠囊、魔物略淡; selected 金框 |
| SetupCell | `drawSetupCell` | x, y, selected | 白色虛線框(內縮 4px); selected 金色四角括號 + 淡金底 |
| PickerPanel | `drawPickerPanel` | options[{type, key, name, cost, desc, affordable}], index | 全畫面壓暗; 面板 x 120~600; 標題「要放什麼?」; 每行: 圖示(魔物 / 機關 / 打叉)、name、desc(有才畫)、機關畫金幣 + cost; affordable=false 整行 42% 淡化、價格紅; index 行底亮 + 金框 |
| SetupInfo | `drawSetupInfo` | gold, placed, picked | 固定畫在 x 60~460、y 1150~1270(不讀 x, y); 「金幣 N」、「已擺 p / q」(擺滿變綠) |
| Gadget | `drawGadget` | x, y, kind(drum), fired, spent | 戰鼓 紅鼓 + 鼓棒, fired 鼓跳起、鼓棒落下、橘震動弧; 噴泉 石盆 + 水柱, fired 水柱變高 + 水珠; 肉塊 骨頭肉 + 往上飄的香味圓點; 安全閥 錶盤 + 藍色啟動段 + 紅針, fired 針打到藍段 + 白蒸氣團, spent 全灰、針倒、斜封條 |
| GadgetPulse | `drawGadgetPulse` | x, y, kind, radius, t, dur | 範圍極淡填色 + 虛線外緣; drum 橘環外擴 + 圓頭上箭頭; fountain 藍環外擴 + 水滴; valve 白藍環由外往內收 + 朝內箭頭; bait 不畫 |
| ShowArena | `drawShowArena(ctx)` | — | 上下觀眾席(深酒紅 + 6 個座位)、圍欄帶暗底、沙地場地 x 60~660 y 270~990 |
| ShowMonster | `drawShowMonster` | x, y, species, level, rage, redLow, mult, marks, markLeft, markDur, mode, performing, performT, performDur, fx, fxT, fxDur, chargeT, chargeDur, looseT, looseDur, dashing, dir | 框內由上到下: 失控標記列(5 格菱形, 有幾個亮幾個, 第 5 格 edge 虛線; 最新一顆外白弧 = 距自動 −1 的剩餘)/ 本體 / 左 Lv、右倍率 / 怒氣條。怒氣條: 50 白刻度、紅區段 edge 上下線 + 淡底, 填色 灰(<50)→ 琥珀 → edge(紅區, 內夾白線)。mult > 0 才畫「×N」, 字級隨倍率放大、≥3.5 脈動。performing 本體彈大 + 種類淡色環外擴; fx ignited 外緣橘火苗 + 橘環, doused 藍水滴往下 + 藍環; mode charge / loose: 整圈 edge 外光 + 怒眼 + 5 格全亮(失控中不讀 marks), charge 身後紅速度線、chargeT > 0 撞欄抖動, loose 上下蹦跳 |
| Fence | `drawFence` | x, y, side, broken | 完好: 兩橫木 + 4 柱; 破損: 兩端殘樁、中段缺口、碎木片、缺口下 edge 虛線 |
| Visitor | `drawVisitor` | x, y, side, mode | watch 坐著微笑(衣色依 x 固定); scared 後仰舉手、臉發白、張嘴、兩道驚嚇線; empty 只剩椅子 + 虛線椅背 |
| ShopItem | `drawShopItem` | x, y, item, cost, level, owned, equipped, affordable, selected | 左圖示(武器 / 劍 +1 / 心 / 繩)、名稱、說明(spec 第 60 條); 右上: 武器已擁有寫「已擁有」, 否則金幣 + cost(買不起紅); 右下: 武器 equipped 金底「裝備中」, 強化 level > 0 寫「已買 N 次」; equipped 時底亮一階; selected 金框 |
| Button | `drawButton` | x, y, w, h, label, selected | x, y 左上角; 「開演」紅系、其他藍系; 未選暗底 + 色框, 選中實色底 + 白框 + 金框 |
| FloatText | `drawFloatText` | x, y, text, kind, t, dur | 1 秒內上飄 40px, 後 40% 淡出, t ≥ dur 不畫; gold 22px 金 + 金幣; redGold 28px 白字粗 edge 描邊 + 金幣; repDown 24px 名聲色 + 星; capture 30px 薄荷綠; levelUp 26px 青; coin20 24px 金 + 金幣 |
| ResultPanel | `drawResultPanel` | rep, goldEarned, edgeShows, roster[{species, level}], stars | 全畫面面板: 標題、3 顆星(亮 stars 顆)、總名聲 / 累計賺得金幣 / 邊緣表演次數、陣容(最多 6 張小卡)、「按 Z 重來」 |
| Hud | `drawHud` | phase, day, dayMax, gold, rep, hearts, maxHearts, ropes, ropeMax, weapon, xCdLeft, xCdMax, timeLeft, timeMax, dungeon, message | 0~120 帶。第 1 列: 天數(左)、畫面名 / 地下城名(中)、金幣、名聲(右)。第 2 列 dungeon: 心、繩、武器圖、X 鍵冷卻(xCdMax=0 灰 X 打叉; 冷卻中由下往上長金色; 就緒整顆金); dungeon / show 時計時條 + 秒數(≤ 10 秒變紅)。第 3 列: message 字串。phase=guide 整個不畫 |
| 說明頁 | `drawGuidePage` | page(0~4), x, y, w, h | 只畫示意圖, 等比縮放置中在框內並剪裁; 不畫頁標題、說明文字、頁碼、翻頁提示 |

**文字歸屬**: 上表每個函式裡出現的字都由美術畫, RD 不要再畫一份(含 HUD 第 3 列的 message、結算的「按 Z 重來」、選擇面板標題)。說明頁例外: 頁標題、說明文字、頁碼、「按 Z 繼續」由 RD 畫(任務分工), 美術只畫圖內短標籤(「走」「攻擊」「① 站上去」「失控」等)。interface.json notes 寫「drawGuidePage 畫說明頁全部文字」, 與本輪任務分工衝突, 依任務分工。

## 判讀約定

- 火圈、落雷: radius = 實心圓外緣(畫面邊界 = 判定邊界)。
- 震波: radius = 環的**中線**(依 interface notes), 畫出的帶 = [radius − 15, radius + 15]; 請 RD 照這個算判定。
- 投射物: radius = 判定半徑, 實心圓就畫這麼大(刺蝟尖刺另畫半徑 10 細圈 = 判定)。
- 馴獸師身體圓半徑 18 = 判定圓。

## 時長常數

| 效果 | 總長 | 來源 |
|---|---|---|
| 火圈預警 / 生效 | 0.5 / 0.5 | 規格; 由 state.dur 傳入, 沒傳才用這個預設 |
| 落雷預警 / 閃光 | 0.8 / 0.2 | 規格 / 介面 |
| 震波 | 1 | 規格 |
| 鬼火存在 | 3(最後 25% 淡出) | 規格 |
| 武器特效 | 0.2(突進 0.25) | 介面 |
| 機關脈衝 | 0.4 | 介面 |
| 飄字 | 1, t ≥ dur 不畫 | 介面 |
| 套索時限紅閃 | 剩 < 1.5 秒 | 美術自訂 |
| 馴獸師受擊閃爍 | 80ms 交替 | 美術自訂(blink 為 true 期間自己閃) |

## 尺寸表

| 物件 | 尺寸 | 說明 |
|---|---|---|
| Tile | 60×60 | 剪裁在格內 |
| Tamer | 64×64 | 身體半徑 18, 武器伸到約 30 |
| WildMonster | 90×90(石像鬼 110×110) | 本體基準半徑 27(石像鬼 34); 血條 50×6(石像鬼 60×6)貼框頂 |
| CaptureRing | 120×120 | 環半徑 42, 字在 y − 52 |
| Lasso | 不限 | 進度環半徑 52、時限環 60 |
| Hazard | 依 radius | 震波外緣 radius + 15 |
| DungeonCard | 600×260 | |
| RosterCard | 300×200 | |
| SetupCell | 200×180 | 框內縮 4px, 相鄰格不疊線 |
| PickerPanel | 480 × (80 + 70n) | x 120~600, y 240 起 |
| SetupInfo | 400×120 | x 60~460, y 1150~1270 |
| Gadget | 80×80 | 不畫作用範圍 |
| GadgetPulse | 半徑 radius | |
| ShowMonster | 100×100(石像鬼 120×120) | 本體基準半徑 25(石像鬼 32), 中心上移 6(石像鬼 8); 標記列中心 y − 42(石像鬼 −52), 5 格 × 14px; 怒氣條 90×12 中心 y + 41(石像鬼 + 51); Lv 與倍率在條上方 |
| Fence | 100×16 | |
| Visitor | 60×90 | |
| ShopItem | 600×110 | |
| Button | w×h(state 給) | |

自測: 假 ctx 追蹤變換矩陣, 對每個有 size 的函式、每個狀態組合(3492 次呼叫, 含壞狀態)比對外接框, 0 超框、0 拋錯、save/restore 全成對。

## 繪製層級(建議 RD 照此順序)

地下城: Tile → Hazard(預警與範圍)→ WildMonster → CaptureRing → Lasso → Tamer → WeaponFx → Hazard(投射物)→ FloatText → Hud。
表演場: ShowArena → Fence → Visitor → GadgetPulse → Gadget → Hazard(範圍)→ ShowMonster → Hazard(投射物)→ FloatText → Hud。
布置第 2 步: ShowArena → Fence → Visitor → SetupCell → Gadget / ShowMonster → SetupInfo → Button → PickerPanel(開著時最上層)→ Hud。

## 取捨說明(待製作人驗收)

- **機關不畫作用範圍**: Gadget 的 size 只有 80×80, 範圍(160 / 180 / 260)畫不進去; 範圍只在 GadgetPulse 出現。布置時玩家看不到安全閥能罩到哪 — 若試玩發現玩家擺不準, 建議介面加一個 `drawGadgetRange(ctx, {x, y, kind})` 讓布置第 2 步游標停在機關格時畫。
- **失控中 5 格標記全亮**: interface 寫 marks 到 5 就失控、不再顯示標記; 美術在 mode = charge / loose 時自己畫 5 格全亮(不讀 marks), 讓「滿 5 就失控」在場上與說明第 4 頁同一個長相。
- **說明第 1 頁**: guide 要求「畫面下方三個鍵帽各對應走 / 攻擊 / 武器技」; 依美術經驗(鍵帽算物件旁短標籤、不排成獨立一列, 避免和 RD 的頁面文字重複), 三顆鍵帽改貼在移動箭頭、揮擊特效、馴獸師旁。
- **說明第 4 頁**: 0 個標記那隻怒氣給 90(規則上怒氣到 100 會立刻出 1 個標記, 100 + 0 標記不成立); 金幣 +10 / +15 / +20 = 火蜥蜴 5 × 倍率; 最右一隻畫成 loose(圍欄已破、在觀眾席)而不是撞欄途中(撞欄 1.5 秒後圍欄才破)。
- **說明第 3 頁**: 布置縮圖上方 4 種上場、已擺 3(刺蝟還在面板裡), 開演後縮圖 4 隻都在場上(沒擺的隨機補位); 火圈半徑 120 內的水母畫成被點燃。

## 說明頁幾何驗算

- 第 2 頁左: 馴獸師 (172, 222) 與水母 (160, 200) 距離 25 ≤ 40 → 可準備捕捉。右: 套索長 105 < 220, 未斷。
- 第 3 頁開演後: 火蜥蜴 (230, 420) 與水母 (310, 490) 距離 106 < 火圈 120 → 水母被點燃成立; 雷鳥怒氣 85 ≥ 紅區下限 80、0 標記 → ×2。
