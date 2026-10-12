# 紅線馴獸場 — 美術規格(RD 只讀這份)

`index.html` 必須宣告 `<meta charset="utf-8">`(art.js 內有中文字串)。用 `<script src="game/art/art.js">` 載入, 全域 `window.Art`。

## 邏輯畫布尺寸
720 × 1280(直式)。`Art.canvas = { width: 720, height: 1280 }`。

## 色票表(`Art.palette`)
| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg | #120e18 | 全畫面底 |
| hudBg / hudLine | #1d1726 / #3a3048 | HUD 底 / 分隔線、未選框 |
| text / textDim | #f4ecd8 / #a89cb8 | 主文字 / 次要文字 |
| outline | #140f1a | 所有物件與文字的深色描邊 |
| fire | #ff6a1a | 火蜥蜴、火圈(色相 21°, 灰階 141) |
| water | #1f6fd0 | 水母、水彈(213°, 灰階 98) |
| thunder | #e0aaff | 雷鳥、落雷(278°, 灰階 196) |
| stone / stoneHi | #3e3833 / #8a8076 | 石像鬼本體(低飽和, 灰階 57)/ 石像鬼亮邊、震波 |
| tamer / tamerHat | #f4ecd8 / #7a4a2a | 馴獸師身體 / 帽子與鞭柄 |
| whip | #fff0b8 | 揮鞭特效(暖白, 鋸齒裂紋) |
| whistle | #9effd6 | 吹哨特效、制伏進度、「被哨音罩到」(薄荷, 平滑波紋) |
| catchDim / catchLit | #1f4a1a / #6dff3a | 捕捉圈暗 / 亮綠(104°, 全遊戲只有捕捉圈與「收服成功」用這個綠) |
| rageLow / rageShow / rageRed | #8aa0b8 / #ffb000 / #ff2a4a | 怒氣 < 50 / 50~79 / 80~100(紅線區與失控) |
| gold | #ffd23a | 金幣、星級、選中框 |
| rep | #ff7ad9 | 名聲 |
| heart | #ff4d5e | 心 |
| wall / wallTop | #221c28 / #3a3044 | 牆、石柱 |
| lava / lavaCrust | #ff5a1a / #7a1e08 | 熔岩格 |
| waterTile | #2a5fa8 | 水格 |
| floorCrag / floorRuins / floorLava / floorPond / floorHall | #5b6170 / #8a7a5e / #5a3b33 / #3f5a50 / #4e4a52 | 各區地板 |
| sand / stands / fence | #b09a72 / #3b2f45 / #a0703c | 表演場場地 / 觀眾席 / 圍欄 |

## 形狀語言
俯視 + 正面混搭的扁平幾何, 所有可動物件一律 3px 深色描邊 + 地面落影; 地形平塗無描邊無影。危險(技能、熔岩)= 種類色 + 斜紋 / 虛線; 我方動作 = 鞭是鋸齒裂紋、哨是平滑波紋。

## 理念落實
- P0 辨識度先於好看: 4 種魔物同時用「色相 + 明度 + 剪影」三條區分(火蜥蜴長身帶尾焰、水母傘蓋觸手、雷鳥尖翼閃電冠、石像鬼方塊雙角); 地形無描邊無影, 物件全有描邊與落影, 一眼分出「場景」與「會動的東西」。
- P1 視覺權重跟著決策迫切度: 捕捉圈亮綠(此刻揮鞭)是地下城唯一的粗亮綠環 + 準星刻; 地板紋理壓到 7~20% 不透明; 表演場上紅線區與失控用全場最飽和的紅。
- P2 規則存在就要畫: 血條上畫 30% 殘血刻度; 怒氣條畫 50 表演門檻、80~99 紅線段、100 終點; 巢穴畫出位置並染該區魔物色; 判定半徑 18 = 馴獸師身體圓外緣; 揮鞭 / 吹哨特效外緣 = 判定半徑。
- P3 一本字典: 種類色在野生魔物、技能、HUD 陣容、結算、說明頁完全一致(同一個魔物畫法函式); 怒氣條在魔物頭下與說明頁第 4 頁是同一個畫法; 預警一律「虛線外緣 + 由中心長大的填色」, 生效一律「實線粗外緣 + 斜紋」。
- P4 關鍵區分兩條通道: 捕捉圈暗 vs 亮綠 = 亮度 + 線寬 + 準星刻; 揮鞭 vs 吹哨 = 暖白 vs 薄荷 + 鋸齒放射 vs 平滑波紋 + 音符; 預警 vs 生效 = 虛線 vs 實線 + 斜紋; 種類色色相兩兩 ≥ 60°(石像鬼改靠低飽和), 灰階 196 / 141 / 98 / 57 四階; 衝欄 vs 觀眾席失控 = 虛線 vs 粗實線紅圈。
- P7 每個元素掙得版面: 怒氣條不配數字(位置 + 色段已足夠); HUD 計時只有數字不另畫進度條; 魔物頭上平時只有星級, 失控時才換成制伏進度。
- P9 以最混亂的一刻驗收: 所有物件與文字帶深色描邊, 表演場多隻魔物 + 技能斜紋疊在沙地上時仍可讀; 技能填色 ≤ 42% 不透明, 不蓋死底下的魔物。
- P13 事件排隊: 美術不排程, 但訊息橫幅固定一條(HUD 下緣 y128~170), 飄字依份量分大小, RD 同時給多條時請依序。
- P15 回饋強度與份量成正比: 飄字四級 名聲 / 金幣(24~26px 無框)< 升星(32px 星)< 紅線金幣(34px 紅框底板 + 金幣); 表演中 = 種類色爆發環, 失控 = 全場最粗紅圈。
- P17 進度類圖形與數字分工: 血條只畫圖形 + 殘血刻度(玩家要的是「離可收服還多遠」), 不加數字; 制伏進度是規格要求的「n/3」數字, 不再畫圓點重述。
- P18 重要資訊不能只閃一下: 升星 / 新收服的結果常駐在 HUD 右側陣容(種類圖 + 星數)與結算畫面。
- P19 資訊貼著物件: 怒氣條、星級、制伏進度、怒氣升降箭頭都長在魔物身上; 捕捉圈直接套在魔物身上。
- P21 示意圖選分岔的例子: 說明第 2 頁左右兩格同一隻殘血魔物, 只差捕捉圈亮綠 / 暗, 結果一勾一叉(對應「殘血就能抓」的錯誤理解); 第 4 頁同一條怒氣條上紅線段出金幣、滿格接到失控打叉。

## 物件表
座標一律畫面座標; 除 drawButton 外 x,y 為物件中心。

| 物件 | 函式 | state 欄位 | 各狀態視覺 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | — | 全畫面填 bg |
| Tile | `drawTile(ctx, s)` | x, y, kind(wall/pillar/floor/lava/water), zone(crag/ruins/lava/pond/hall), nest(bool) | 牆: 深紫磚 + 上緣亮面; 石柱: 區地板上一顆有描邊的圓柱; 地板: 依區換底色與淡紋理; 熔岩: 亮橘 + 深色硬殼裂紋; 水: 藍底 + 白波紋; 巢穴: 地板上一圈虛線(染該區魔物色)+ 稻草紋 |
| Tamer | `drawTamer(ctx, s)` | x, y, facing(0~7), rolling, stunned, blink | 一般: 米白身體圓(外緣半徑 18 = 判定)+ 俯視帽 + 朝面向伸出的手與鞭柄 + 帽簷三角; 翻滾: 身體縮成球、帽子成弧線、身後 3 條速度線; 暈眩: 身體轉灰 + 頭上 3 顆黃星; 無敵閃爍: 整體半透明 + 白色虛線護圈(美術不自己閃, RD 可隔幀切 blink) |
| WildMonster | `drawWildMonster(ctx, s)` | x, y, species, hp, maxHp, hit, weak, pulse, green, casting, dir | 本體依種類; dir −1 左右翻; hit: 整隻刷白; casting: 身後種類色光盤 + 虛線 + 眼睛變紅; 血條(頭上, 30% 處有刻度, 0~30% 底色淡綠; 殘血時填色變亮綠); weak: 身上捕捉圈, 依 pulse 由暗綠漸亮、線變粗; green: 粗亮綠環 + 淡綠內填 + 4 道準星刻 |
| Hazard | `drawHazard(ctx, s)` | x, y, kind(firering/waterball/thunder/quake), phase(warn/active), radius, t, angle | firering warn: 橘虛線圈 + 由中心長大的填色(t/0.5 長滿); active: 實線粗圈 + 斜紋 + 向內火舌; thunder warn: 紫虛線圈 + 十字 + 填色(t/0.8 長滿); active: 實線圈 + 斜紋 + 白雷, 0.4 秒內淡到 35%; quake: 灰石色環帶(radius ± 15, 寬 30)+ 斜紋; waterball: 藍球(半徑 12)+ 朝 angle 反方向的尾跡 |
| WhipCrack | `drawWhipCrack(ctx, s)` | x, y, shape(arc/circle), facing, radius, t | arc: 朝 facing 120° 扇形淡填 + 外緣實線(= 判定半徑)+ 3 道鋸齒裂紋; circle: 整圈 + 8 道裂紋; t 0→0.25 秒淡出(之後不畫) |
| WhistleWave | `drawWhistleWave(ctx, s)` | x, y, radius, t | 薄荷淡填 + 外緣實線(= 判定半徑)+ 兩道往外擴的波浪圈 + 3 個上飄音符; t 0.25 秒後開始淡出, 0.6 秒消失 |
| ShowArena | `drawShowArena(ctx)` | — | 外牆深底; 上下觀眾席 4 階條紋 + 旗串; 沙地場地 x60~660 y270~1000 + 中圈 + 粗邊框。**畫在 HUD 之前** |
| ShowMonster | `drawShowMonster(ctx, s)` | x, y, species, star, rage, mode(roam/charge/loose), performing, fx(none/ignited/doused/calmed), subdue, dir | 本體同野生魔物畫法; 頭上 1~3 顆金星; 腳下怒氣條(灰藍 <50 / 琥珀 50~79 / 紅 80~100, 50 白刻度, 80~99 紅框段); 怒氣 ≥ 80 眼睛變紅; performing: 種類色粗爆發環 + 白放射短線; fx ignited: 琥珀光暈 + 右上兩個向上箭頭; doused: 藍光暈 + 向下箭頭; calmed: 薄荷光暈 + 向下箭頭; charge: 紅虛線怒圈; loose: 紅粗實線怒圈; charge/loose 時頭上星級換成「制伏 n/3」薄荷字牌, 不畫 fx 與 performing |
| Fence | `drawFence(ctx, s)` | x, y, side(top/bottom), broken | 完好: 木欄 + 4 根柱; 破損: 中段斷開、兩端鋸齒斷口、木屑, 缺口畫紅虛線框 |
| Visitor | `drawVisitor(ctx, s)` | x, y, seat(0~11), mode(watch/scared/empty) | 座椅永遠畫; watch: 坐姿、微笑, 衣色依 seat 6 色循環; scared: 身體歪、雙手舉高、臉發白 O 嘴、汗滴; empty: 只有空座椅 |
| TitleCard | `drawTitleCard(ctx, s)` | day, stage(dungeon/show) | 全畫面: 3 格天數進度、「第 N 天」、洞口(地下城)或帳篷(表演場)圖示、場景名、一句目標、**「按 Z 開始」(RD 不用再畫)** |
| ShopItem | `drawShopItem(ctx, s)` | x, y, item(whipPower/ropeBag/armor/silverWhistle), level, cost, affordable, selected | 600×140 卡: 圖示、名稱、效果、「已買 n」、金幣價; selected: 金色 6px 框 + 左側金三角; 買不起: 內容 55% 不透明、價格灰、下方「金幣不足」 |
| Button | `drawButton(ctx, s)` | x, y(左上角), w, h, label, selected | 選中: 金底深字 + 白框 + 左側三角; 未選: 深底灰字 |
| FloatText | `drawFloatText(ctx, s)` | x, y, text, kind(gold/redGold/repUp/repDown/starUp), t | 1 秒上飄 50px, 0.7 秒後 0.5 秒淡出(t ≥ 1.2 不畫); gold: 金幣 + 金字 26px; redGold: 紅框深底板 + 金幣 + 金字 34px; starUp: 金星 + 白字 32px; repUp: 粉字 24px; repDown: 灰粉字 + 向下箭頭 |
| ResultPanel | `drawResultPanel(ctx, s)` | rep, goldEarned, roster[{species,star}], stars(0~3) | 全畫面: 標題、3 顆大星(得到的金色)、門檻小字、總名聲、累計金幣、陣容魔物 + 星、**「按 Z 重來」(RD 不用再畫)** |
| HUD | `drawHud(ctx, s)` | phase(guide/title/dungeon/show/shop/result), day, gold, rep, hearts, maxHearts, ropes, ropeMax, roster, timeLeft, message, rollReady, whistleReady | guide/title/result: 不畫; 其他: 上方 0~120 底板。第一列: 第 N 天 + 階段名、剩餘秒數(≤ 10 變紅; 只在 dungeon/show)、金幣、名聲。第二列 dungeon: 心、捕獸繩、「X 翻滾」膠囊(就緒亮白 / 冷卻暗); show: 「X 吹哨」膠囊(就緒薄荷 / 冷卻暗); 右側陣容小圖 + 星(shop 不畫)。shop: 畫面底部 y1262「↑↓ 選擇 Z 確定」**(RD 不用再畫)**。message 非空: HUD 正下方 y128~170 置中紅框橫幅 |
| 說明頁示意圖 | `drawGuidePage(ctx, s)` | page(0~3), x, y, w, h | 只畫在框內(會 clip), 內容以 640×560 設計後等比縮放置中。**頁標題、說明文字、頁碼、翻頁提示由 RD 畫**; 圖內只有物件旁短標籤與鍵帽 |

### 說明頁各頁內容
- 0 地下城: 熔岩洞一角; 「你」朝右揮扇形鞭打中火蜥蜴(刷白、血條白段 = 掉的那一截), 方向鍵圖示在馴獸師旁、Z 鍵帽在鞭旁; 下方馴獸師半透明殘影沿虛線翻滾穿過火圈預警, X 鍵帽在翻滾中的馴獸師上方。**鍵帽貼在對應動作的物件旁, 不另排一列「方向鍵 / Z / X → 走 / 揮鞭 / 翻滾」**: 那一列與 RD 畫的頁面說明文字是同一句, 兩邊都畫會重複
- 1 收服: 左「亮綠」殘血火蜥蜴 + 亮綠捕捉圈 + 繩套連到下方揮鞭的馴獸師 + 綠勾; 右「暗」同一隻倒地變灰半透明 + 暗捕捉圈 + 塵土 + 紅叉
- 2 表演: 左 沙地, 整圈鞭; 圈內火蜥蜴怒氣 88(紅線)表演中 + 火圈生效 + 紅線金幣飄字與金幣, 水母怒氣 72 + 向上箭頭; Z 鍵帽。右 哨音圈; 雷鳥、石像鬼怒氣 38 / 45 + 薄荷光暈向下箭頭; X 鍵帽
- 3 拿捏: 放大怒氣條(怒氣 92), 「50」「紅線」標籤, 紅線段上方一堆金幣; 條右端「100」紅箭頭接到撞破圍欄、衝進觀眾席的失控火蜥蜴與嚇到的觀眾 + 紅叉; 底部流程小圖「地下城 → 表演場 → 商店 × 3 天 → 評星」

## 尺寸表
| 物件 | 尺寸 / 判定 | 備註 |
|---|---|---|
| Tile | 60×60 | 石柱圓半徑 25(格內) |
| Tamer | 框 64×64; 身體圓外緣半徑 18 = 判定 | 手與鞭柄伸到 27, 暈眩星到 −30 |
| WildMonster | 框 90×90; 本體基準半徑 25 | 捕捉圈半徑 36(中心下移 2), 血條 56×6 在 y −44 |
| Hazard | 依 radius; 水彈判定半徑 12(畫面球外緣 12) | 火圈 / 落雷: 畫面外緣 = radius; 震波: radius ± 15 環帶 |
| WhipCrack | 外緣 = radius(規格 110) | 扇形 120° |
| WhistleWave | 外緣 = radius(規格 140) | |
| ShowArena | 場地 600×730(60,270);觀眾席 680×120(20,130)/(20,1020) | |
| ShowMonster | 框 100×100; 本體基準半徑 27, 中心上移 4 | 星 y −42; 制伏牌 68×22 在 y −50~−28; 怒氣條 84×9 在 y 35~44; 怒圈半徑 41 |
| Fence | 100×16 | 木板高 12, 柱高 16 |
| Visitor | 60×90 | 頭 y −22 半徑 13; 座椅 y 26~42 |
| ShopItem | 600×140 | |
| Button | 依 w,h(規格 400×100) | |
| FloatText | 約 寬 = 字數 × 字級, 高 48 | 上飄 50px |
| HUD | 0~120 全寬; 訊息橫幅 y128~170 | 心最多 230px 寬, 繩最多 150px 寬, 自動縮距 |

## 時長常數(美術內部寫死, 規格改了要通知美術)
介面只傳經過秒數 `t`, 沒傳總長, 下列總長取自 spec 技能表:
- 火圈預警 0.5 秒(填色 t/0.5 長滿)
- 落雷預警 0.8 秒(填色 t/0.8 長滿); 落雷生效畫面 0.4 秒內淡到 35%
- 揮鞭特效 0.25 秒, 吹哨特效 0.6 秒, 飄字 1.2 秒(美術自訂, RD 可在超過後停止呼叫)

## 繪製層級(由下到上)
地下城: Background → Tile → Hazard(地面範圍)→ WildMonster → Tamer → WhipCrack → Hazard(waterball 可與魔物同層)→ FloatText → HUD
表演場: Background → ShowArena → Visitor → Fence → Hazard → ShowMonster → Tamer → WhipCrack / WhistleWave → FloatText → HUD
全畫面: TitleCard / ResultPanel 畫在最上層(會蓋滿); 商店: Background → ShopItem → Button → HUD
