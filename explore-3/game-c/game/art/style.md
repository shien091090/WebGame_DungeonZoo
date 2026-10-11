# 魔物大遊行 — 美術規格(style.md)

> RD 只讀這份。`index.html` 必須宣告 `<meta charset="utf-8">`(art.js 內有中文字串)。
> art.js 以一般 `<script src="game/art/art.js">` 載入, 掛在 `window.Art`。所有函式自帶 save/restore。

## 1. 邏輯畫布尺寸

720 × 1280(直式)。HUD 佔 y 0~120; 地下城地圖視窗與遊行園區在 y 120~1280。

## 2. 色票表(`Art.palette`)

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg | #15121c | 畫布底、地圖外 |
| ink | #120e16 | 所有物件外描、文字描邊 |
| hudBg / hudLine | #1a1622 / #3a3346 | HUD 底 / 下緣線 |
| text / textDim | #f4f0fa / #a49cb4 | 主文字 / 次文字 |
| player | #3fe0d0 | 隊頭(馴獸師)、前進指標、圍圈閃光、「加入!」飄字。**青綠只屬於玩家** |
| skin / hat | #f0c8a0 / #4a3020 | 馴獸師臉 / 帽子 |
| collar | #ffcf3a | 項圈(隊伍魔物頸上金環、HUD 項圈、結算隊伍列) |
| rope / ropeDark | #c89a5a / #8a6234 | 捕獸繩(奇偶節交替) |
| rageLow | #e8e4f0 | 怒氣弧 < 50 |
| rageReady | #ffb020 | 怒氣弧 50~99(會表演) |
| rageLoose | #ff3b3b | 失控(怒氣弧全滿紅、HUD 失控訊息) |
| gold | #ffd23a | 金幣(圖示、數字、飄字) |
| rep | #ff8ad8 | 名聲(星形圖示、數字、名聲增飄字、結算評價星) |
| repDown / heart | #ff4a4a | 名聲減飄字、買不起的價格 / 心 |
| wall / wallTop / wallEdge | #0e0b12 / #1c1724 / #2c2538 | 牆 |
| lava / ruins / forest / cave / hall | #3a2420 / #33333c / #1e3226 / #262640 / #2e2a26 | 各區地板底色(低彩度, 退在最底層) |
| *Mark | 各區略亮一階 | 地板紋樣(裂紋 / 石磚 / 落葉 / 碎石點 / 木板線) |
| fire | #ff6a2a(dark #b8401a, light #ffb070) | 火蜥蜴、噴火 |
| bat | #a070ff(dark #6a40c0, light #d0b8ff) | 蝙蝠、俯衝 |
| mushroom | #6ee05a(dark #3a9a30, light #c8f5b0) | 蘑菇、孢子 |
| stone | #b8b0a0(dark #7c7466, light #e0dacb) | 石像鬼、落石 |
| grass / plaza / plazaEdge | #1c2a22 / #3a3530 / #6a5e50 | 遊行: 草地 / 廣場鋪面 / 廣場邊界 |
| standWood / standRow / standRail | #5a3e2a / #6e4c32 / #9a7650 | 看台 |
| water / fountainStone | #2a6a9a / #8a8478 | 噴水池 |
| panel / panelEdge | #241e2e / #4a4058 | 商店、結算面板 |
| btnOn / btnOff | #3fe0d0 / #2a2632 | 按鈕可按 / 不可按 |

四種魔物(node 驗算): 火 18° / 飽和 0.84 / 灰階 143、蘑菇 111° / 0.60 / 175、蝙蝠 260° / 0.56 / 143、石像鬼 40° / 0.13(近無彩)/ 177。有彩三色兩兩差 ≥ 93°; 石像鬼與火同屬暖側但彩度差 0.7, 讀成「灰石」而非「橘」; 火與蝙蝠灰階相同, 靠色相(差 118°)與剪影分。四種輪廓完全不同(見物件表), 不靠顏色單獨辨識。玩家青綠 174° 離蘑菇 63°、離其他更遠。

## 3. 形狀語言

圓潤卡通、粗深色外描(2~3px)、扁平填色; 魔物一律正立畫(不隨前進方向旋轉, 只左右翻面), 方向交給隊頭的三角指標與隊伍本身的排列。

**字典(全畫面共用)**
- 虛線框 + 由內往外長大的填色 = 預警(還沒生效); 實線白框 + 滿填 = 生效中(技能、野生魔物施放中的外圈同一套)
- 金環 = 項圈 = 已收服; 頸上沒金環 + 頭上白色體力格 = 野生
- 環繞身體的弧 = 怒氣; 白 → 琥珀(≥50 會表演)→ 紅且脈動(失控)
- 青綠 = 玩家做的事(隊頭、圍圈閃光、加入)
- 金色圓幣 = 金幣; 粉色星 = 名聲

## 4. 理念落實

| 理念 | 本作怎麼落實 |
|---|---|
| P0 辨識度先於好看 | 四種魔物用四種剪影(火冠圓身 / 張翼 / 菇帽 / 方身帶角), 色相只是第二層; 野生與隊伍用「有無金項圈 + 體力格 vs 怒氣弧」兩條通道分 |
| P1 視覺權重跟著決策迫切度 | 地板、草地、鋪面全部低彩度暗色; 最亮的是技能(預警與生效)、怒氣弧與隊頭; 失控是全畫面唯一持續脈動的紅 |
| P2 規則上存在就要看得到 | 隊頭身體圓 = 判定半徑 16; 噴水池外緣 = 判定半徑 70; 技能範圍照 state 的 radius / length 畫, 畫面邊界 = 判定邊界; 怒氣 50 門檻在弧的正下方畫白刻度; 巢穴畫淡虛線環 |
| P3 一個意義一種長相 | 地下城攻擊與遊行表演用同一個 `drawHazard`, 同種同色同形(玩家才能把兩者連起來); 星 = 名聲在 HUD、飄字、結算一致; 金環 = 項圈在隊伍、HUD、結算一致 |
| P4 關鍵區分走兩條通道 | 預警 vs 生效: 虛線 + 半透明 vs 實線白邊 + 實填; 失控 vs 隊伍中: 紅弧脈動 + 項圈斷開 + 怒眉; 可買 vs 買不起: 青框亮面 vs 暗面半透明 + 紅價格 |
| P7 每個元素要掙得版面 | 隊伍魔物不另掛數字, 怒氣只用弧; 野生魔物不寫名字; 看台、觀眾不加字 |
| P9 以最混亂時驗收 | 技能邊緣一律深色襯底 + 亮線, 壓在任何地板、任何魔物上都讀得到; 怒氣弧在身體之上畫 |
| P12 遊戲區優先於 UI | 失控提示「繞一圈把牠圍回來」放在 HUD 第二列(y 68~108), 不蓋遊行場地 |
| P13 事件排隊 | 本作事件提示只有飄字(上浮 50px、1 秒後淡出), 不做全畫面橫幅 |
| P15 回饋強度跟份量 | 被圍(暈眩星 + 少一格)< 收服(「加入!」青色大字)< 圍圈閃光(整圈面積) |
| P17 進度圖形與數字分工 | 怒氣只有圖形(無數字, 依邊界照畫總量), 並畫出 50 門檻刻度——玩家要知道的是「過沒過 50」 |
| P18 重要資訊不只一瞬 | 金幣與名聲飄字之外, HUD 右上常駐總數; 結算列出三項並在星下標門檻 50 / 120 / 200 |
| P19 資訊貼著物件 | 體力格貼在野生魔物頭上、怒氣弧貼在隊伍魔物身上 |
| P21 示意圖選分岔例 | 說明頁第 2 頁隊頭明確碰到自己的繩尾才成圈(非只是繞過去); 第 4 頁同時畫「過半表演」與「全滿脫隊」對照 |

## 5. 物件表

所有 x,y 為**中心點**(畫面座標), 除 `drawStand`、`drawButton` 為左上角。angle 單位弧度, 0 = 朝右。

| 物件 | 函式 | state 欄位 | 狀態視覺差異 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | — | 整張畫布填 bg |
| 地圖格 | `drawTile(ctx, s)` | x, y, kind(`wall`/`floor`), zone(`lava`/`ruins`/`forest`/`cave`/`hall`), nest(bool) | 牆: 近黑方塊 + 磚縫; 地板: 區底色 + 區紋樣(熔岩裂紋、遺跡石磚、菇林落葉、蝙蝠洞碎石、走道木板); nest=true: 地板上加該區魔物色的淡虛線環(半徑 30)+ 枝條 |
| 隊頭 | `drawTamer(ctx, s)` | x, y, angle, blink | 青綠圓身(半徑 16 = 判定)+ 帽子 + 前進方向三角指標; blink: 以 12Hz 閃爍(透明 0.3/0.95)+ 白外環 |
| 隊伍魔物 | `drawTrainMonster(ctx, s)` | x, y, angle, species, rage(0~100), performing, hitFx, mode(`line`/`loose`) | 本體 = 種類剪影(半徑 16)+ 頸上金項圈; 外圈怒氣弧(半徑 22.5, 頂端順時針): <50 白、50~99 琥珀 + 怒眉、正下方白刻度 = 50; performing: 本體泛金 + 四角金閃光 + 笑眼; hitFx: 本體白閃 + 抖動 + 疼痛眼 + 怒氣弧外白環; loose: 項圈斷開、本體泛紅、怒眉、怒氣弧紅色加粗脈動 |
| 捕獸繩 | `drawRopeSegment(ctx, s)` | x, y, angle, index | 沿 angle 的一小段粗繩 + 繩結; index 奇偶深淺交替 |
| 野生魔物 | `drawWildMonster(ctx, s)` | x, y, species, stamina, maxStamina, casting, stunned, hit, angle | 本體同種類剪影但較大(半徑 24)、外描較粗、**沒有項圈**; 頭上一排體力格(白 = 剩、暗 = 已削); casting: 外圈旋轉的種類色虛線環(半徑 33)+ 本體閃亮 + 怒眉; stunned: X 眼 + 頭上 3 顆繞圈黃星 + 本體偏灰; hit: 本體白閃 + 疼痛眼 |
| 技能 | `drawHazard(ctx, s)` | x, y, kind(`firecone`/`batdash`/`spore`/`rockfall`), phase(`warn`/`active`), radius, length, angle, t | 共通: warn = 種類色虛線框(流動)+ 淡底 + 由內長大的填色(t / 預警時長, 填滿 = 即將生效); active = 白實線框 + 種類色實填。見下方「技能 state 約定」 |
| 圍圈閃光 | `drawLoopFx(ctx, s)` | points([{x,y}]), t | 多邊形內填青綠 + 青綠粗外光 + 白邊; 0.6 秒線性淡出(t ≥ 0.6 不再可見) |
| 遊行園區 | `drawPark(ctx)` | — | 草地(y 120~1280)+ 廣場鋪面 x 90~630、y 230~1170 + 邊框 |
| 噴水池 | `drawFountain(ctx, s)` | x, y | 石緣外徑 70(= 判定)+ 水面 + 漣漪 + 中央噴口 |
| 看台 | `drawStand(ctx, s)` | x, y(左上), w, h, side(`top`/`bottom`/`left`/`right`), mood(`calm`/`cheer`/`attacked`) | 木色看台, 座位排與長邊平行, 面向廣場的那側有淺色欄杆; cheer: 金框 + 飄動彩紙; attacked: 紅框脈動 + 整片泛紅 |
| 觀眾 | `drawVisitor(ctx, s)` | x, y, side, mode(`watch`/`cheer`/`scared`/`empty`) | watch: 手垂下; cheer: 雙手高舉 + 張嘴 + 上下跳 + 頭頂小金閃; scared: 灰衣、傾斜、抖、睜大眼、冒汗; empty: 只剩虛線空座 |
| 標題卡 | `drawTitleCard(ctx, s)` | day, stage(`dungeon`/`parade`) | 全畫面深底: 「第 N 天」+ 大字「地下城」(暖橘)/「遊行」(粉)+ 一句目標 + 小景(地下城: 四種魔物; 遊行: 隊伍走過歡呼看台)+ 閃爍「點畫面開始」 |
| 按鈕 | `drawButton(ctx, s)` | x, y(左上), w, h, label, enabled | 可按: 青綠底 + 白框 + 深字; 不可按: 暗灰底 + 灰字 |
| 商店項目 | `drawShopItem(ctx, s)` | x, y, item(`longRope`/`collarBag`/`armor`/`swiftFeet`), level, cost, affordable | 左圖示、名稱(長繩 / 項圈袋 / 護甲 / 快腿)、效果一行、level>0 時「已買 N」、右側金幣 + 價格; 買不起: 面板變暗、左半半透明、價格變紅、框變灰 |
| 飄字 | `drawFloatText(ctx, s)` | x, y, text, kind(`gold`/`repUp`/`repDown`/`join`), t | 1 秒上浮 50px, 0.7 秒後淡出(t ≥ 1.2 不可見); gold: 金色 + 金幣圖示; repUp: 粉 + 星; repDown: 紅 + 紅星; join: 青綠大字無圖示。text 由 RD 給(例「+5」「-3」「加入!」) |
| 結算 | `drawResultPanel(ctx, s)` | rep, goldEarned, trainCount, stars(0~3) | 全畫面: 「三天結束」、三顆大星(達成 = 粉實心白框; 未達成 = 暗)、星下門檻 50/120/200、名聲 / 累計金幣 / 隊伍魔物三列、閃爍「點畫面重來」 |
| HUD | `drawHud(ctx, s)` | phase, day, gold, rep, hearts, maxHearts, collars, collarMax, trainCount, trainMax, timeLeft, message | 見下方 HUD 版面 |
| 說明頁示意圖 | `drawGuidePage(ctx, s)` | page(0~3), x, y, w, h | 只畫在框內(自帶 clip), 等比縮放置中; 不畫頁標題、說明文字、頁碼、翻頁提示 |

### 技能 state 約定(RD 請照這個傳)

| kind | x, y | radius | length | angle | t |
|---|---|---|---|---|---|
| firecone | 施放者位置(扇形頂點) | 扇形長度 220 | null | 扇形中心方向 | 本 phase 經過秒數 |
| batdash | **warn: 直線起點(施放者位置); active: 衝刺中身體目前的中心** | 身體判定半徑 30 | warn: 直線長 320 | 衝刺方向 | 同上 |
| spore | 圓心 | 90 | null | 不用 | 同上 |
| rockfall | 該顆落石的圓心(3 顆各呼叫一次) | 50 | null | 不用 | 同上 |

- t 是**從該 phase 開始起算**的秒數。warn 的「由內長大填色」用規格預警時長換算: 噴火 0.5、俯衝 0.6、孢子 0.4、落石 1.0 秒(寫死在 art.js `HAZ_WARN`; 規格改預警時長時要同步改)
- batdash 的 active 畫的是身體圓 + 身後拖尾; 衝刺中的蝙蝠本體(野生或隊伍魔物)請 RD 照常另外畫在同一點上
- rockfall active 是「瞬間」: RD 至少讓 active 停留約 0.3 秒才看得到撞擊(判定仍只在落下那一刻)

### HUD 版面(phase)

- `guide`、`result`: 不畫(說明頁由 RD 畫、結算由 `drawResultPanel` 蓋全畫面)
- 第一列(y 0~60): 左「第 N 天」+ 階段名(地下城 / 遊行 / 商店); 中央剩餘秒數(只在 dungeon / parade, ≤10 秒變紅); 右上金幣、名聲
- 第二列(y 60~120):
  - dungeon: 心(x 20 起)、項圈金環(x 240 起)、「隊伍 n/12」(x 384)、message 靠右小字(琥珀)
  - parade: 「隊伍 n/12」靠左; message 非空時在 x 450 置中畫紅色脈動膠囊 + 白字(例「繞一圈把牠圍回來」)
  - title / shop: 「隊伍 n/12」靠左; message 靠右灰字

## 6. 尺寸表

| 物件 | 畫面尺寸 | 備註 |
|---|---|---|
| Tile | 80 × 80 | 填滿整格 |
| Tamer | 56 × 56 框內; 身體圓半徑 16(= 判定) | 指標尖端距中心 27 |
| TrainMonster | 52 × 52 框內; 本體半徑 16、怒氣弧半徑 22.5(線寬 4~5.5) | 全狀態已用假 ctx 驗證不出框 |
| RopeSegment | 20 × 20 框內; 線段 ±8 + 繩結半徑 4.5 | |
| WildMonster | 80 × 80 框內; 本體半徑 24、施放虛線環半徑 33、體力格在中心上方 32~39 | 體力格 >5 格時自動縮窄 |
| Hazard | 無固定框, 照 state: 扇形長 220 / 60°、俯衝直線長 320 寬 60、孢子半徑 90、落石半徑 50 | 畫面邊界 = 判定邊界 |
| LoopFx | 照 points | |
| Fountain | 140 × 140; 外緣半徑 70(= 判定) | |
| Stand | 照 x,y,w,h, 不出框 | |
| Visitor | 44 × 60 框內 | |
| ShopItem | 600 × 140 框內 | |
| Button | 照 x,y,w,h | |
| TitleCard / ResultPanel | 全畫面 720 × 1280 | |
| HUD | 720 × 120 | |
| 文字下限 | 20px(次要)/ 28px 以上(數字) | 1280 高: 1/64 與 1/45 |

## 7. 繪製層級(由下而上)

**地下城**: drawBackground → drawTile(全部可見格)→ drawHazard(warn)→ drawRopeSegment(尾 → 頭)→ drawTrainMonster(尾 → 頭)→ drawTamer → drawWildMonster → drawHazard(active)→ drawLoopFx → drawFloatText → drawHud → drawTitleCard(標題卡時)

**遊行**: drawPark → drawStand → drawVisitor → drawFountain → drawHazard(warn)→ drawRopeSegment → drawTrainMonster(隊伍中, 尾 → 頭)→ drawTamer → drawTrainMonster(loose)→ drawHazard(active)→ drawLoopFx → drawFloatText → drawHud

**商店**: drawBackground → drawShopItem × 4 → drawButton → drawHud(phase `shop`)

## 8. 說明頁示意圖內容(drawGuidePage)

各頁用自己的虛擬尺寸等比縮放進 (x,y,w,h), 框內留白置中。圖中物件全部呼叫遊戲內畫法。

| page | 虛擬尺寸 | 畫面 | 框內短標籤 |
|---|---|---|---|
| 0 帶隊 | 640×480 | 走道 L 形轉角; 隊頭(朝右)→ 火蜥蜴 → 10 節繩; 身後淡青點線 = 走過的路, 前方青色虛線箭頭彎向上方走道的游標 | 你、游標 |
| 1 圍圈 | 320×240 | 隊伍(火蜥蜴、蝙蝠、10 節繩)繞成一圈, 隊頭碰到繩尾(白閃光), 圈亮起; 圈中石像鬼體力 2/3、暈眩 | 碰到繩子 |
| 2 收服 | 660×280 | 左: 同樣一圈圍住蘑菇, 體力只剩 1/3; 中: 箭頭; 右: 隊伍變成 火蜥蜴 → 蝙蝠 → 蘑菇(戴金項圈, 頭上「加入!」)→ 繩 | 加入!(飄字) |
| 3 遊行 | 640×480 | 上方歡呼看台; 隊伍向左走, 火蜥蜴(怒氣 62、表演中)朝看台噴火、金幣「+5」; 蝙蝠(怒氣 100、失控)離隊衝向看台, 紅虛線 + 紅叉, 旁邊觀眾嚇到; 底部流程 地下城 → 遊行 → 商店 × 3 天 → 評星 | 表演、脫隊 |

## 9. 取捨說明(給製作人驗收)

- 魔物正立不旋轉: 隊伍會繞圈, 若剪影跟著轉, 倒過來的蘑菇與石像鬼難辨; 改成只左右翻面, 方向由隊頭三角指標與隊伍排列表達
- 介面的 `drawHazard` 沒傳預警總時長, 預警填色進度用規格的預警秒數換算(見技能 state 約定)。建議之後在 state 加 `dur`
- 地下城被打到的怒氣上升、遊行的表演對同伴的影響, 都用同一個 hitFx 外觀(白閃 + 抖動), 怒氣弧本身的變化就是讀數
