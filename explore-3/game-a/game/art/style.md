# 怒火連鎖馴獸場 — 美術規格(explore-3 / game-a)

> index.html 必須宣告 `<meta charset="utf-8">`, 否則 art.js 裡的中文會亂碼。
> 載入方式: `<script src="art/art.js"></script>`(一般 script, 非 module), 之後用 `window.Art`。

## 邏輯畫布尺寸

720 × 1280(直式)。HUD 佔 y 0~120, 遊戲區從 y 120 起。

## 色票表

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg | #120f18 | 全畫面底 |
| hudBg / hudLine | #0c0a11 / #3a3346 | HUD 底與下緣線 |
| text / textDim | #f4efe6 / #a49cb2 | 主文字 / 次要文字 |
| ink | #0d0b12 | 所有物件的深色描邊、文字襯邊 |
| player | #3fcf6e | **玩家方 = 綠**: 馴獸師斗篷、腳下環、制伏進度、虛弱魔物的「可收服」虛線環、收服打勾、說明頁的「你」 |
| playerDark | #1f7a3e | 斗篷陰影、HUD 訊息列的制伏進度填色 |
| whip | #fff1cf | 甩鞭範圍(奶白細線, 不填色) |
| rope | #c8955a | 捕獸繩 |
| fire | #ff5a36 | 火蜥蜴本體 + 火圈 |
| water | #46b4ff | 水母本體 + 水彈 |
| thunder | #ffd83f | 雷鳥本體 + 落雷 |
| stone | #b29ae6 | 石像鬼本體 + 震波 |
| wall / wallTop | #1c1923 / #2e2a38 | 牆 |
| pillar | #6f6a7c | 石柱 |
| lava / lavaHot | #ff6a1a / #ffc23a | 熔岩格(全地圖最亮的地形) |
| water2 | #1d4a86 | 水格(暗藍, 刻意比水母本體暗) |
| zoneCrag / zoneRuins / zoneLava / zonePond / zoneHall | #323b4b / #4a4233 / #432b2a / #25403f / #302d36 | 五區地板(低彩度、低對比) |
| sand / sandLine | #6b5640 / #7d6750 | 表演場地 |
| stand / standRow | #3a2836 / #4a3344 | 觀眾席 |
| fenceWood / fenceDark | #a8784a / #5a3c22 | 圍欄 |
| gold | #ffcf3a | 金幣、星級星星 |
| rep | #ff74cf | 名聲(洋紅菱形徽章) |
| danger | #ff3b3b | 失控、圍欄破損、扣名聲、觀眾嚇跑 |
| heart | #ff4a5e | 心 |
| rageCalm / rageHot / rageMax | #8fa3bd / #ffa53a / #ff3b3b | 怒氣條: < 50 / 50~99 / 100 |
| hpBar | #f0ebe0 | 野生魔物血條(虛弱時改 player 綠) |
| btn / btnText | #f3dfa8 / #2a1d10 | 可按按鈕、買得起的價格膠囊 |
| card | #262030 | 卡片底(商店、結算) |

## 形狀語言

圓角、粗深色描邊(ink)、扁平填色; 魔物是「身體 + 臉」的圓胖剪影, 技能是「以魔物種類色畫的範圍圓」, 危險一律「預警虛線 → 生效實心」。

## 理念落實

- **P0 辨識度先於好看**: 四種魔物各一種剪影(長蜥蜴 / 傘狀水母 / 圓鳥帶閃電冠 / 方墩帶翅與角), 不靠顏色也分得出; 牠的技能與本體同色, 一看技能色就知道是誰放的。
- **P1 視覺權重跟著決策迫切度走**: 地板五區只差低對比的色溫與紋理; 全畫面最亮的是熔岩、生效中的技能與失控紅圈, 其次才是魔物與馴獸師; 金幣名聲飄字壓在 1 秒內淡出。
- **P2 規則上存在的東西畫面上就存在**: 判定邊界 = 畫面邊界: 技能圓的外緣就是半徑、馴獸師腳下綠環就是判定半徑 18、甩鞭圈就是甩鞭半徑; 虛弱(可收服)、怒氣 50 門檻、失控都各有常駐外觀。
- **P3 一個意義一種長相**: 綠 = 玩家方 / 玩家能做的事; 紅 = 失控與損失; 奶白細圈 = 甩鞭; 「虛線 + 由中心長大的填色 = 預警, 長滿就生效」用在所有技能。說明頁的物件全呼叫遊戲內畫法。
- **P4 關鍵區分兩條通道**: 預警 vs 生效 = 虛線 / 實線 + 半透明 / 實心; 虛弱 = 綠虛線環 + 本體褪色垂眼; 失控 = 紅鋸齒外圈 + 紅眼 + 怒氣條閃白; 甩鞭(奶白、不填色、會轉)vs 技能(種類色、填色)。
- **P7 每個元素掙得版面**: 魔物身上不寫名字、不寫數字; 血條、怒氣條只畫一條加一個刻度(30% / 50%), 數值留給玩家看長度。
- **P9 以最混亂的那一刻驗收**: 所有物件與技能外緣都有 ink 深描邊, 技能圓疊在沙地、熔岩、其他技能上仍有邊; 失控是全場唯一的紅色鋸齒形。
- **P13 事件要排隊**: 飄字一律 1 秒內出場、淡出, 不留常駐; 同時多個由 RD 排位(本檔不疊放)。
- **P15 回饋強度與份量成正比**: 金幣 / 名聲飄字 28px 小圖示; 升星 34px 雙星 + 彈跳; 失控是持續的紅圈 + 煙。
- **P17 進度類圖形與數字分工**: 怒氣條只畫圖形 + 50 門檻刻度(玩家要判斷的是「過半沒」); 計時只給數字; 制伏進度是馴獸師身上的綠弧 + HUD 訊息列底色填滿。
- **P18 重要資訊不只存在一瞬間**: 升星飄字之外, HUD 右側陣容常駐顯示每種魔物的星數; 結算畫面列出陣容、名聲、金幣與評星門檻。
- **P19 資訊貼著物件**: 血條、怒氣條、星級、虛弱環、點燃 / 澆熄、制伏進度全部長在物件身上。
- **P21 示意圖選對錯理解會分岔的例子**: 第 1 頁畫「直走會穿過火圈, 虛線繞開」而不是只畫走路; 第 3 頁同框放一隻圈內(怒氣過半、表演)與一隻圈外(怒氣低、不動)對照。

(候選理念 P5、P6、P8、P10、P11、P12、P14、P16、P20、P22 不約束; 有順手照顧的: 文字一律加 ink 襯邊(P10)、HUD 位置固定(P11)。)

## 物件表

所有 `x, y` 為物件**中心**(畫面座標, 地下城已扣鏡頭); 只有 `drawButton` 的 `x, y` 是左上角。每個函式自己 save / restore。

| 物件 | 函式 | state 欄位 | 各狀態視覺 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | 無 | 全畫面 #120f18 |
| 地圖格 | `drawTile(ctx, s)` | `x, y, kind`(wall\|pillar\|floor\|lava\|water)`, zone`(crag\|ruins\|lava\|pond\|hall)`, nest`(bool) | wall: 深色磚、頂緣亮條。pillar: 該區地板 + 圓石柱(半徑 25)。floor: 區色地板 + 區紋理(崖 = 裂紋、遺跡 = 方磚、熔岩洞 = 暗紅帶火星、水池 = 水漬圓、走道 = 接縫)。lava: 亮橘 + 黃熱斑閃動 + 黑殼裂紋(危險)。water: 暗藍 + 淺藍波紋。nest=true: 地板上一圈虛線草巢, 內圈細線用該區魔物的種類色 |
| 馴獸師 | `drawTamer(ctx, s)` | `x, y, stunned, blink, subdueProgress`(0~1)`, dir`(-1\|1) | 一般: 綠斗篷 + 棕帽 + 捲鞭, 腳下半透明綠環(半徑 18 = 判定)。stunned: 斗篷褪灰、眼睛打叉、頭頂 3 顆星繞圈。blink: 以 12Hz 在 35% / 100% 不透明之間閃(美術自己算時間, RD 只傳 true)。subdueProgress > 0: 外圈半徑 28 綠色進度弧從 12 點順時針長 |
| 野生魔物 | `drawWildMonster(ctx, s)` | `x, y, species`(fire\|water\|thunder\|stone)`, hp, maxHp, hit, weak, casting, dir` | 頂端血條(奶白, 30% 位置一條刻度)。hit: 本體整隻刷白。casting: 腳下種類色光圈脈動 + 皺眉。weak: 本體褪色、垂眼、汗滴, 血條變綠, 外圈綠色虛線環慢轉(= 可收服) |
| 技能 | `drawHazard(ctx, s)` | `x, y, kind`(firering\|waterball\|thunder\|quake)`, phase`(warn\|active)`, radius, t, angle` | firering / thunder: warn = 暗底 + 種類色虛線外緣 + 由中心長大的半透明填色(firering 0.5 秒、thunder 0.8 秒長滿, 以 `t` 算), thunder 另有十字準星; active = 種類色實心 + 白外緣, 火圈內緣有火舌, 落雷中央有白閃電。waterball: 半徑 12 實心藍球 + 白內圈 + 朝 `angle` 反方向的淡尾跡。quake: 圓環帶, **外緣 = radius、內緣 = radius − 30**(radius < 30 時為實心圓); active 實心 + 白外緣 + 碎石, warn 淡填 + 虛線 |
| 甩鞭 | `drawWhipCrack(ctx, s)` | `x, y, radius, t` | 半徑 = radius 的奶白細圈 + 極淡填色, 一段粗鞭梢弧在 0.15 秒內順時針繞一圈, 0.3 秒淡出(t ≥ 0.3 不畫, RD 可在 0.3 秒後移除) |
| 表演場 | `drawShowArena(ctx)` | 無 | 全畫面底 + 上下觀眾席(130~250、1020~1140)+ 沙地(x 60~660、y 270~1000)。圍欄與觀眾另畫 |
| 表演魔物 | `drawShowMonster(ctx, s)` | `x, y, species, star`(1~3)`, rage`(0~100)`, mode`(roam\|charge\|loose)`, performing, fx`(none\|ignited\|doused)`, dir` | 頂端怒氣條(< 50 藍灰、50~99 橘、100 紅且閃白), 50 處白刻度; 條下方 1~3 顆金星。rage ≥ 50: 皺眉; rage ≥ 80 且 roam: 頭頂冒煙(快失控預告)。performing: 種類色光暈 + 8 道光芒。ignited: 腳下 5 道橘火焰。doused: 頭上 3 滴水往下落。charge: 紅鋸齒外圈 + 紅眼 + 身後煙塵。loose: 紅鋸齒外圈 + 紅眼。失控(charge / loose)時不畫 ignited / doused / performing |
| 圍欄 | `drawFence(ctx, s)` | `x, y, side`(top\|bottom)`, broken` | 完好: 木橫桿 + 5 根柱。broken: 中段缺口、兩端斷木、紅色裂痕。上下兩側外觀相同(side 目前不改畫法) |
| 觀眾 | `drawVisitor(ctx, s)` | `x, y, seat`(0~11)`, mode`(watch\|scared\|empty) | 座椅常駐。watch: 依 seat 換衣色, 微笑、輕微上下晃。scared: 衣色變淡、舉雙手、O 嘴、頭上紅色驚嚇線、抖動。empty: 只有座椅 + 淡虛線人形 |
| 標題卡 | `drawTitleCard(ctx, s)` | `day, stage`(dungeon\|show) | 全畫面。地下城: 冷色底 + 石拱門, 「地下城」淡藍字。表演場: 紅布幕 + 聚光, 「表演場」金字。上方 3 顆天數點(已過灰、今天金、未到暗), 「第 N 天」, 底部閃爍「點畫面開始」 |
| 按鈕 | `drawButton(ctx, s)` | `x, y`(左上角)`, w, h, label, enabled` | enabled: 奶黃實心 + 深描邊 + 底部陰影。disabled: 暗底 + 灰虛線框 + 灰字 |
| 商店項目 | `drawShopItem(ctx, s)` | `x, y, item`(whipPower\|ropeBag\|armor\|longWhip)`, level, cost, affordable` | 左圖示圓、名稱(鞭力 / 繩袋 / 護甲 / 長鞭)、說明、「已買 N 次」、右側價格膠囊。affordable: 奶黃外框 + 奶黃價格膠囊。不可: 卡片變暗、圖示半透明、價格紅字 + 「金幣不足」 |
| 飄字 | `drawFloatText(ctx, s)` | `x, y, text, kind`(gold\|repUp\|repDown\|starUp)`, t` | 0.12 秒彈出, 往上飄 40px, 0.6~1.0 秒淡出; t ≥ 1 不畫(RD 1 秒後移除)。gold: 金幣圖示 + 金字。repUp: 名聲菱形 + 洋紅字。repDown: 名聲菱形 + 紅字。starUp: 34px 淡黃字左右各一顆金星 |
| 結算 | `drawResultPanel(ctx, s)` | `rep, goldEarned, roster`([{species, star}])`, stars`(0~3) | 全畫面: 3 顆大星(亮 = 拿到)、評星門檻小字、總名聲、累計金幣、陣容(魔物圖 + 星數 + 名稱)、底部閃爍「點畫面重來」 |
| HUD | `drawHud(ctx, s)` | `phase`(guide\|title\|dungeon\|show\|shop\|result)`, day, gold, rep, hearts, maxHearts, ropes, ropeMax, roster, timeLeft, message, subdueProgress` | guide / title / result 不畫。其餘畫 y 0~120 的 HUD 帶(見下方版面)。message 有字才畫訊息膠囊; 含「制伏」字樣時膠囊紅框, subdueProgress > 0 時膠囊底從左往右填綠 |
| 說明頁示意圖 | `drawGuidePage(ctx, s)` | `page`(0~3)`, x, y, w, h` | 只畫在 (x, y, w, h) 框內; 內部以 640×520 設計, 等比縮放置中並剪裁。頁標題、說明文字、頁碼、「點畫面繼續」由 RD 畫 |

### HUD 版面(720 × 120)

| 位置 | 內容 |
|---|---|
| 左上 (20, 24) | 「第 N 天 地下城 / 表演場 / 商店」 |
| 右上 x 474~720, y 24 | 金幣圖示 + 數字、名聲圖示 + 數字 |
| 中央 (360, 46) | 剩餘秒數大字(54px, ≤ 10 秒轉橘), 只在 dungeon / show |
| 左二列 y 62 | 心(dungeon 才畫), 每顆間距 28 |
| 左三列 y 100 | 捕獸繩(dungeon 才畫), 每條間距 26 |
| 右二列 x ~558~710, y 64~92 | 陣容小圖 + 星數(最多 4 隻, 靠右排) |
| 中下 x 180~540, y 86~114 | 訊息膠囊(有 message 才畫) |

### 說明頁示意圖內容

| 頁 | 圖 | 物件旁短標籤 |
|---|---|---|
| 0 地下城 | 熔岩洞一角接走道; 火蜥蜴施法中 + 火圈預警; 游標在左; 馴獸師在右下, 綠虛線箭頭繞過火圈下方走向游標(直線會穿過火圈) | 「你」「火圈」 |
| 1 收服 | 左右兩格, 中間白箭頭。左: 甩鞭圈內的雷鳥刷白、血條旁紅色下降箭頭。右: 同一隻虛弱(綠環、血條綠且很低)、甩鞭圈、繩子從馴獸師套住牠、綠勾 | 「你」「虛弱」 |
| 2 表演 | 沙地; 甩鞭圈內的石像鬼怒氣過半(橘)、正在表演並放出震波、金幣與名聲飄字; 圈外一隻水母怒氣低、不動 | 「你」「怒氣」×2 |
| 3 別讓牠爆掉 | 觀眾席 5 名觀眾 + 5 段圍欄, 中間那段破掉; 怒氣全滿的火蜥蜴(紅鋸齒、衝刺中)撞進缺口, 後面那名觀眾嚇到 + 紅叉。框底部一條流程小圖: 「地下城 → 表演場 → 商店」「× 3 天 → 評星 ★★★」 | 「滿」 |

> 第 3 頁的流程條是 guide.md 列在「圖要示意」裡的內容, 所以畫在示意圖框內; RD **不必**再畫這行流程, 否則會重複。

## 尺寸表

| 物件 | 判定框(介面 size) | 實際繪製 |
|---|---|---|
| Tile | 60 × 60 | 鋪滿 60×60 無縫; 石柱圓半徑 25 |
| Tamer | 64 × 64 | 判定環半徑 18; 帽頂 y −31; 制伏弧半徑 28; 暈眩星 y −25 |
| WildMonster | 90 × 90 | 身體約半徑 28(中心下移 4); 血條 56×6 在 y −43; 虛弱環半徑 40 |
| Hazard | 無 | firering / thunder 外緣 = radius; waterball 球半徑 12(尾跡只在後方, 長 34); quake 外緣 = radius, 內緣 = radius − 30 |
| WhipCrack | 無 | 外緣 = radius |
| ShowMonster | 100 × 100 | 身體約半徑 30(中心下移 8); 怒氣條 72×8 在 y −48; 星半徑 6 在 y −30; 失控鋸齒外圈 33~41 |
| Fence | 100 × 16 | 橫桿 100×12, 柱 8×16 |
| Visitor | 60 × 90 | 座椅 48×14 在 y 26~40; 人頭頂約 y −30, 嚇到時手舉到 y −28、驚嚇線到 y −40 |
| ShopItem | 600 × 140 | 圖示圓半徑 46 在 x −225; 價格膠囊 130×60 在 x 150~280 |
| Button | w × h(RD 給) | 底部陰影往下 6px(在 h 之外) |
| TitleCard / ResultPanel | 全畫面 720 × 1280 | — |
| FloatText | 無 | gold / rep 28px, starUp 34px |

自查: 用會追蹤變換矩陣的假 ctx 呼叫全部函式的全部狀態組合(共 2425 次), 有 `size` 的物件外接框皆在框內(線寬不計), save / restore 皆成對, 無拋錯。

## 繪製層級(建議 RD 照此順序)

地下城: drawBackground → drawTile(全部)→ drawHazard(火圈 / 落雷 / 震波, 不論 warn 或 active)→ drawWildMonster → drawHazard(水彈)→ drawWhipCrack → drawTamer → drawFloatText → drawHud
表演場: drawShowArena → drawVisitor → drawFence → drawHazard(火圈 / 落雷 / 震波)→ drawShowMonster → drawHazard(水彈)→ drawWhipCrack → drawTamer → drawFloatText → drawHud

範圍型技能畫在魔物與馴獸師**底下**: 生效時是半透明實心大圓, 蓋在上面會把玩家正在閃的自己與魔物遮掉; 水彈是小顆的飛行物, 畫在上面。
