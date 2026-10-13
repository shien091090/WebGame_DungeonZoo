# 玩具球亂鬥秀 — 美術風格 (style.md)

> RD 只讀這份。`index.html` 必須宣告 `<meta charset="utf-8">`(art.js 內有中文字串)。
> 所有函式掛在 `window.Art`, 參數固定 `(ctx, state)`, 各自 save/restore。state 欄位照 interface.json, 一個不多一個不少。
> 美術函式內部會讀 `performance.now()` 做閃爍 / 流動等小動態, RD 不必傳時間。

## 邏輯畫布尺寸
720 × 1280(直式)。HUD 固定在 y 0~120。

## 色票表

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg | #16131d | 全畫面底 |
| hudBg | #100d16 | HUD 帶 |
| panel / panelHi | #241f30 / #302a40 | 卡片、面板底 / 面板內的分塊底卡 |
| line | #4a4260 | 卡片未選中外框 |
| text / textDim | #f4efe6 / #a49cb4 | 主文字 / 次要標籤 |
| cursor | #fff3b0 | **選擇框 / 游標**(全遊戲唯一的「目前選中」色) |
| player | #3fe0c8 | 馴獸師外框、**玩家造成的東西**(攻擊特效、打回去的投射物、捕捉 / 繞圈進度、「上場」「已開放」「裝備中」) |
| playerBody | #f2efe6 | 馴獸師本體 |
| rope | #d8b07a | 套索、捕獸繩 |
| danger | #ff3b4a | **規則紅**: 怒氣條紅區、失控標記、失控外圈。只出現在線、條、記號上, 不填在魔物本體 |
| gold | #ffd84a | 金幣數字 / 圖示 |
| rep | #ffb8f0 | 名聲 |
| ignite | #ff8a1c | 升怒: 本體兩側往上竄的橘火苗(= 火辣球色) |
| douse | #7fe3ff | 降怒: 本體兩側往下滴的青水珠(= 冰涼球色) |
| perform | #ffd23a | 表演星芒(= 鈴鐺球色) |
| yarn | #ff7ad0 | 毛線球與「追毛線球中」的虛線圈 |
| lava / water | #ff5a1e / #2a6fb8 | 地下城熔岩 / 水格 |
| 種類色 fire / water / thunder / spike / stone / ghost | #ec3b30 / #3a86f0 / #e6dc34 / #4cc04c / #9c8f84 / #c08cf0 | 魔物本體與牠的技能(火圈、水彈、落雷、尖刺、震波、鬼火) |
| 球色 hot / cold / bell / yarn | #ff8a1c / #7fe3ff / #ffd23a / #ff7ad0 | 玩具球 |

色相 / 灰階(node 算): 火 4°/111、雷 57°/204、刺 120°/144、水 215°/123、鬼 271°/167、石 低飽和/146; 球: 辣 29°/160、冰 193°/200、鈴 46°/206、毛線 321°/172; 規則紅 355°/119。

**已知張力(驗收請看最差組合)**
- 六種魔物排滿色輪, 火—雷 53°、水—鬼 56° 沒到 60°。種類主通道是**剪影**(蜥蜴長身+尾火 / 水母傘+觸手 / 雷鳥鋸齒翅 / 刺蝟刺圈 / 石像鬼方塊+角翼 / 幽靈波浪下襬), 顏色是第二通道。
- 規則紅(355°)與火蜥蜴紅(4°)同色名, 兩邊都不能讓: 規則紅只在線與條, 且一律內夾白細線(怒氣條紅段中央白線、失控外圈內側白圈); 火蜥蜴紅只在本體與火圈面。最差組合 = 失控中的火蜥蜴。
- 火辣球(29°)與火蜥蜴、鈴鐺球(46°)與雷鳥近色: 球屬「能被踢動的東西」類別 = 立體漸層 + 深色外描 + 高光 + 落影 + 白色圖案, 魔物 = 平塗 + 眼睛, 類別層先分開。
- 字典: 火辣球色 = 升怒火苗色、冰涼球色 = 降怒水珠色、鈴鐺球色 = 表演星芒色、毛線色 = 追毛線圈。球的顏色就是它造成的效果的顏色。

## 形狀語言
魔物與 UI 一律圓角、平塗、深色外描; 能被踢的球是全畫面唯一「立體漸層 + 高光 + 落影」的東西; 危險(技能)= 種類色的面, 玩家造成的 = 青綠細線 / 淡填色。

## 理念落實
- P0: 六種魔物各一個剪影, 縮到卡片 22px 半徑仍分得出; 球用立體手法與魔物 / 地塊分類別。
- P1: 表演場最迫切的是「誰快失控」, 怒氣條 + 失控標記放在每隻頭頂框頂, 紅區與標記用規則紅; 場地底與觀眾席壓低明度。
- P2: 判定 = 畫面: 馴獸師本體圓外緣 18、球外緣 24、火圈 / 落雷外緣 = radius、投射物外緣 = 判定半徑; 魔物血條上畫 30% 殘血刻度; 怒氣條畫 50 門檻刻度與紅區下限刻度; 套索時限畫成繩中央的小鐘。
- P3: 一個意義一種長相: cursor 色只給選中; 青綠只給玩家造成的; 球色 = 它的效果色(見色票張力)。說明頁全部呼叫遊戲內畫家並給規則成立的 state。
- P4: 升怒 vs 降怒 = 顏色(橘 / 青)+ 方向(往上竄 / 往下滴)+ 形狀(火苗 / 水珠); 敵方技能(實心面)vs 玩家攻擊(白 / 青綠淡填 + 掃過的前緣線); 預警(虛線 + 由中心長大的填色)vs 生效(實心)。
- P7: 球不畫字(靠顏色 + 圖案); 失控標記只在 marks > 0 時才出現; 走動中的普通魔物不加任何外圈。
- P9: 驗收幀 = 表演場 4 隻 + 6 顆球同時滾、兩個範圍技能疊在一起; 所有文字帶深色描邊, 球帶深色外描。
- P13: 飄字自己往上飄 1 秒並在後 40% 淡出; 同一隻的連續事件由 RD 依時間排, 美術不另疊卡片。
- P15: 回饋分級 = 一般金幣(小黃字)< 紅區金幣(紅框底卡 + 大字)/ 連鎖(粉大字)< 收服(打勾 + 青綠大字)。
- P17: 失控標記的最新一顆用填色高度畫「距下次自動 −1 還多久」(數字沒給的那一段); HUD 計時器旁的小環 = 這一秒; X 武器技冷卻畫在 X 鍵帽上的填色; 撞欄 / 亂竄外圈白弧 = 還剩多久破欄 / 累倒。
- P18: 收服、等級、金幣都會留在 HUD / 卡片 / 結算; 飄字只是當下回饋。
- P19: 準備捕捉圈、繞圈進度環、怒氣條都貼著所描述的那隻魔物。
- P21: 說明第 4 頁並排「4 個標記」與「衝撞圍欄(頭上已無標記)+ 打叉」, 分開「滿 5 才失控」與「怒氣滿就失控」兩種理解; 第 3 頁下圖只畫到球滾向水母為止。
- P22(候選): 撞中回饋長在球本身(白閃 + 球色外擴環), 升怒 / 降怒長在魔物本體兩側。

## 物件表

| 物件 | 函式 | state 欄位 | 各狀態視覺 |
|---|---|---|---|
| 背景 | drawBackground(ctx) | — | 全畫面 bg 色 |
| Tile | drawTile | x, y, dungeon, kind, room, nest | dungeon 換地板 / 牆色(洞窟褐、雷鳴崖藍灰、遺跡沙褐); wall = 磚牆+頂面亮帶; pillar = 地板上圓石柱(有影); lava = 亮橘紅塊+流動亮斑(危險); water = 藍底+波紋; room=hall 地板較暗且有細十字紋(房間與走道分界); nest=true 草圈+一圈小石 |
| Tamer | drawTamer | x, y, facing, weapon, dashing, blink, lassoing | 米白圓(外緣=判定 18)+青綠外框+面向鼻尖; 手上畫 club/sword/spear/whip; dashing: 身後青綠殘影+白外圈; blink: 快速閃爍半透明; lassoing: 背後繩圈 |
| WildMonster | drawWildMonster | x, y, species, hp, maxHp, hit, weak, stunLeft, stunDur, lassoed, casting, dashing, dir | 種類剪影; dir=-1 左右翻; hit: 整隻白; weak: 右上裂心+左上汗滴; stunLeft>0 或 lassoed: 頭上 3 顆繞圈星(擊暈另有星星上方的縮短黃線 = 剩餘秒數); lassoed: 頸上繩圈; casting: 外圈種類淺色虛線脈動; dashing: 身後速度線; 底部血條(≤30% 變粉紅, 30% 處白刻度) |
| CaptureRing | drawCaptureRing | x, y, t, dur | 半徑 40 青綠進度環, 從 12 點順時針填到 t/dur; 底部「準備捕捉」膠囊 |
| Lasso | drawLasso | x1, y1, x2, y2, progress, t, limit, len, maxLen | 繩: 鬆時下垂, len/maxLen > 0.8 變直、轉橘紅、加粗、抖動; 魔物周圍半徑 52 青綠繞圈進度環 + 白點前端; 繩中點小鐘 = 剩餘時限(最後 1 秒轉紅) |
| Hazard | drawHazard | x, y, kind, phase, radius, t, dur, angle, reflected | firering/thunder warn: 虛線外框(=radius)+ 由中心長大的種類色填色, 填滿=生效; active: 火圈實心漸層+外緣往內的火舌, 落雷亮黃白圓+從上劈下的閃電, 依 t/dur 淡出; quake: 環帶(判讀約定見下)+裂紋; waterball/spike/wisp: 判定圓外緣的投射物+身後尾跡; reflected=true: 改馴獸師青綠+白芯環 |
| WeaponFx | drawWeaponFx | x, y, weapon, move, shape, angle, spread, radius, length, width, t, dur | normal: 白淡填+白前緣掃過; skill: 青綠淡填+青綠前緣; arc/circle/line 照形狀尺寸; 劍 skill 範圍內黃星(擊暈), 鞭 skill 外緣朝外箭頭(擊飛); dash: 青綠漸層軌跡 |
| DungeonCard | drawDungeonCard | x, y, dungeon, open, condition, selected | 底=該地下城地板+牆帶; 名稱、兩種魔物圖+名; open: 青綠「已開放」膠囊; 未開放: 鎖頭+「未開放」+條件字串(金色)+整卡壓暗; selected: cursor 粗框+左側三角 |
| RosterCard | drawRosterCard | x, y, species, level, picked, selected | 魔物圖、名稱、「Lv N」+3 星(已達等級亮金); picked: 底轉深青、青綠「✓ 上場」膠囊、青綠框; 未上場: 虛線空膠囊; selected: cursor 粗框 |
| SetupCell | drawSetupCell | x, y, selected | 白色淡虛線格框+中心小點; selected: cursor 粗框+淡亮底 |
| PickerPanel | drawPickerPanel | options, index | 固定 x 120~600、標題列 y 240~320「要放什麼?」; 第 i 行 y 320+70i: 圖示(魔物剪影 / 球 / 清空虛線圈 X)+名稱; 球行另有說明與「N 金」; affordable=false 整行 38% 透明、價格轉暗紅; 選中行 cursor 框 |
| SetupInfo | drawSetupInfo | gold, placed, picked, balls, ballMax | 三塊底卡「金幣 / 已擺 / 球」; 已擺 < 上場數時數字橘; 球滿時數字淡紅 |
| ToyBall | drawToyBall | x, y, kind, rolling, angle, hitT, hitDur | 立體球(外緣=判定 24)+白色圖案: hot 火焰、cold 雪花、bell 橫帶+鈴口、yarn 纏線; rolling: 身後 3 顆殘影、圖案旋轉; yarn 滾動中另畫半徑 220 粉色淡圈(外緣=吸引範圍); hitT>0: 白閃+球色外擴環 |
| ShowArena | drawShowArena(ctx, state) | (無) | 上下觀眾席(座位帶)、深紫場地 x 60~660 y 270~990 + 米色邊界線 + 中央圓 |
| ShowMonster | drawShowMonster | x, y, species, level, rage, redLow, marks, markLeft, markDur, mode, performing, performT, performDur, fx, fxT, fxDur, chargeT, chargeDur, looseT, looseDur, dashing, dir | 框頂怒氣條: 底色紅區段(redLow~100)、50 白刻度、redLow 紅刻度; 填色 <50 灰藍、50~紅區 琥珀、≥紅區 紅+白中線; marks>0 時條閃紅、條下 5 格菱形(已有=紅、空=暗、第 5 格=紅框 X), 最新一顆的填色高度 = markLeft/markDur; chase: 粉色虛線圈; charge/loose: 紅外圈+內白細線、頭上怒筋、條全紅閃、撞欄中(chargeT>0)抖動, 外圈白弧 = 1−chargeT/chargeDur 或 1−looseT/looseDur; performing: 金色 8 道星芒+本體脈動; fx=ignited: 兩側橘火苗往上; doused: 兩側青水珠往下; dashing: 身後速度線; 右下「LvN」 |
| Fence | drawFence | x, y, side, broken | 完好: 兩條橫木+4 根柱; broken: 中段缺口、斷口鋸齒、兩柱倒斜、碎木片 |
| Visitor | drawVisitor | x, y, side, mode | 座位常駐; watch: 彩色上衣舉手歡呼輕跳; scared: 傾斜、臉色發白、張嘴、速度線、頭上「!」; empty: 只剩座位+虛線人形 |
| ShopItem | drawShopItem | x, y, item, cost, level, owned, equipped, affordable, selected | 左圖示(武器 / 閃電 / 心 / 繩圈)、名稱、說明(spec 第 65 條); 右: 「N 金」(買不起暗紅)或「已擁有」; equipped: 青綠「裝備中」膠囊+深青底; 強化 level>0 顯示「已買 N 次」; selected: cursor 粗框 |
| Button | drawButton | x, y, w, h, label, selected | x,y 為左上角; 未選: 深底+紫灰框; selected: cursor 色實心+深字+左側三角 |
| FloatText | drawFloatText | x, y, text, kind, t, dur | 往上飄 42px(repDown 往下 26px), 後 40% 淡出, t≥dur 不畫; gold/coin20 黃; redGold 黃字+紅框暗紅底卡; chain 粉; repDown 淡紫; capture 青綠+打勾; levelUp 綠 |
| ResultPanel | drawResultPanel | rep, goldEarned, bestChain, roster, stars | 標題、3 顆大星(各附門檻 250/550/900)、總名聲 / 累計金幣 / 最長連鎖三列、陣容(最多 6)魔物圖+名+Lv、「按 Z 重來」 |
| Hud | drawHud | phase, day, dayMax, gold, rep, hearts, maxHearts, ropes, ropeMax, weapon, xCdLeft, xCdMax, timeLeft, timeMax, dungeon, message | 第 1 行: 「第 d/7 天」+地下城名、金幣、名聲、計時(≤10 秒轉紅, 旁邊小環 = 這一秒); 第 2 行(只 dungeon): 心、繩、武器名+X 冷卻條(xCdMax=0 顯示「X 無」); 第 3 行 message。phase=guide 只畫 message |
| 說明頁 | drawGuidePage | page, x, y, w, h | 見下方「說明頁」 |

**文字歸屬**: 照 interface.json「文字歸屬」, 上表每個函式裡的字都由美術畫, RD 不另外畫字。

**表外值的預設**(RD 看到不該出現的外觀時請查傳入值): species → fire、kind(Tile) → floor、dungeon → cave、room → hall、weapon → club、Hazard kind → firering、ToyBall kind → hot、mode → roam、fx → none、FloatText kind → gold、Hud phase → select、ShopItem item → club、options 項目 type → clear。數字欄位 NaN / 未給 → 0(maxHp 未給 → 1)。

**判讀約定**
- 震波 radius = **中線**, 判定帶 = [radius − 15, radius + 15](照 interface notes)。畫面環帶就是這一段。
- 火圈 / 落雷 radius = 外緣; 預警虛線畫在外緣內側, 不越出。
- drawSetupInfo、drawPickerPanel 的 state 沒有 x,y: 位置寫死在 spec 版位(資訊列中心 (260, 1210) = x 60~460、y 1150~1270; 面板 x 120~600、y 240 起)。drawSetupInfo 若另收到 x,y 會改用它。

**時長常數**(一次性特效)
| 效果 | 總長 | 來源 |
|---|---|---|
| FloatText | state.dur(預設 1) | 介面 |
| ToyBall 撞中 | state.hitDur(0.3) | 介面 |
| ShowMonster fx / 表演 | fxDur / performDur(0.5) | 介面 |
| 地下城 hit 閃白 | RD 控制 hit 開關 | 介面 |

## 尺寸表

| 物件 | 像素 | 備註 |
|---|---|---|
| Tile | 60×60 | 石柱半徑 25 |
| Tamer | 64×64 | 本體圓外緣 18(= 判定); 鼻尖到 28、武器到 31 |
| WildMonster | 90×90(石像鬼 110×110) | 本體半徑 28(石像鬼 34), 部件到 1.38r; 血條在框底 |
| CaptureRing | 120×120 | 環半徑 40、線寬 6; 字樣膠囊 y +44~+60 |
| Lasso | — | 繞圈環半徑 52、線寬 7; 時限小鐘半徑 12 |
| Hazard | — | 依 radius; 投射物尾跡往後 3r(非判定) |
| DungeonCard | 600×260 | |
| RosterCard | 300×200 | |
| SetupCell | 200×180 | |
| PickerPanel | 480 × (80 + 70 × 選項數) | 行高 70 |
| SetupInfo | 400×120 | |
| ToyBall | 52×52 | 球外緣 24(= 判定)。**超框例外(非判定, 由介面建議)**: 滾動殘影往後到 ~56、毛線球滾動範圍圈 220、撞中外擴環到 ~29(0.3 秒淡出) |
| ShowMonster | 100×100(石像鬼 120×120) | 怒氣條 90×12 在框頂(y −50~−38, 石像鬼 ×1.2); 標記列 y −37~−25; 本體半徑 26 中心 y +10; 失控外圈 r+12 |
| Fence | 100×16 | |
| Visitor | 60×90 | |
| ShopItem | 600×110 | |
| Button | w×h(state) | |
| HUD | 720×120 | |

## 繪製層級
照 interface notes: ShowArena → SetupCell → ToyBall → Hazard → ShowMonster → Fence / Visitor → FloatText → Hud。地下城建議: Tile → Hazard(預警)→ WeaponFx → WildMonster → CaptureRing → Lasso → Tamer → Hazard(投射物)→ FloatText → Hud。

## 說明頁
`drawGuidePage(ctx, { page, x, y, w, h })`, page 0~4。

**與任務範本的偏離**: 任務範本寫「說明頁標題 / 文字 / 頁碼 / 翻頁提示歸 RD, 美術只畫示意圖」, 但本輪 interface.json「文字歸屬」寫 `drawGuidePage 畫說明頁全部文字`。照 RD 實際照著寫的介面: **美術在框內畫整頁(標題、示意圖、說明文字、頁碼點、「按 Z 繼續 / 按 Z 開始」), RD 請不要在說明頁另畫任何文字**。版面以 720×1280 設計, 等比縮放置中在 (x,y,w,h) 框內; 建議 RD 傳整個畫布 (0,0,720,1280) 或 HUD 以下 (0,120,720,1160)。HUD 在 guide phase 只畫 message。

| 頁 | 圖 |
|---|---|
| 1 地下城 | 洞窟一角(遊戲內 Tile); 馴獸師拿棍棒朝右敲中火蜥蜴(扇形特效 + 受擊白); 另一隻火蜥蜴施法中、火圈預警(半徑 120); 青綠虛線箭頭繞開火圈; 底部鍵帽 方向鍵→走、Z→攻擊、X→武器技 |
| 2 收服 | 左: 馴獸師站在殘血水母上, 準備捕捉環一半(未暈); 右: 套索中、頭上暈星, 繞圈環一半, 黃虛線繞行箭頭; 底部「收服!」飄字(打勾) |
| 3 擺球 | 上: 布置畫面縮圖(3×4 格, 火蜥蜴 / 水母各一格, 火辣球 / 冰涼球各一格, 游標框在空格), 選擇面板列 水母 + 4 種球 + 清空, 「開演」按鈕; 下: 「開演後」火蜥蜴剛踢出火辣球(滾動殘影), 虛線箭頭指向水母, 只畫到滾向為止 |
| 4 紅區 | 上: 火蜥蜴怒氣 88(紅區 80~100)表演中, 「+4 ×2」紅區金幣; 下: 怒氣 100 + 4 個標記 → 「再 +1」→ 同一隻失控撞圍欄(頭上無標記), 打叉 |
| 5 目標 | 地下城→布置→表演→商店 循環箭頭, 中央「×7 天」, 表演旁名聲星往上加, 箭頭指到結算 3 星 |

驗算: 第 3 頁下圖縮 0.7, 球(踢出點)到水母 170/0.7 ≈ 243 遊戲像素, 加碰觸距離 64 仍 < 340(踢球滾距)✓; 第 4 頁標記 4 個時怒氣 100 ✓、衝欄時不顯示標記 ✓; 第 2 頁準備捕捉的水母不畫暈 ✓。
