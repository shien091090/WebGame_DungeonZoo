# 彈反引爆秀 — 美術規格(style.md)

RD 只讀這份。函式全掛在 `window.Art`(非 ES module); 每個函式自己 save/restore。`index.html` 必須宣告 `<meta charset="utf-8">`(art.js 內有中文字串)。

## 邏輯畫布尺寸

720 × 1280(直式)。`window.Art.canvas = { width: 720, height: 1280 }`。HUD 佔 y 0~120。

## 色票表

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg | #15131c | 全畫面底色 |
| hudBg / hudLine | #0e0c14 / #3a3450 | HUD 底 / 底線 |
| panel / panelHi / panelLine | #221e2c / #2e2840 / #4a4262 | 面板、卡片、選中卡片、邊框 |
| text / textDim / outline | #f2ecdf / #a59fb5 / #0b0a10 | 主字 / 次要字 / 全畫面深色描邊 |
| tamer / tamerCoat / tamerHat | #f4ead2 / #7a4e2e / #4e3220 | 馴獸師身體 / 外套 / 帽子 |
| shield | #ffffff | 舉盾護泡、彈反閃光 |
| rope | #e2b866 | 繩與收服相關的一切: 套索、繞圈進度環、殘血可套虛線圈、捕獸繩圖示、加成飄字 |
| fire | #ff5a3a | 火蜥蜴 / 火元素(色相 10°, 灰階 136) |
| thunder | #d0ff58 | 雷鳥 / 雷元素(色相 77°, 灰階 222) |
| water | #6cc8ff | 水母 / 水元素(色相 202°, 灰階 179) |
| stone | #8c30e8 | 石像鬼 / 震元素(色相 270°, 灰階 96) |
| fireLt / thunderLt / waterLt / stoneLt | #ffc08a / #f4ffc8 / #d4f0ff / #d8b8ff | 各種的亮部(火冠、觸手、角、石像鬼外框) |
| whip | #fff1c8 | 揮鞭範圍、面向箭頭、翻滾速度線(玩家動作色) |
| whistle | #c8ffd8 | 哨音範圍、被安撫、制伏進度點(冷靜色) |
| rageCalm / ragePerform | #8a93a8 / #f4ead2 | 怒氣條填色: < 50(不表演)/ 50~79(會表演) |
| redLine | #ff2e88 | 紅線區 80~99、怒氣滿 / 失控、破欄、繩快斷、HUD 警示訊息框 |
| gold / goldDk | #ffcc33 / #8a6210 | 金幣 |
| heart | #ff6f7d | 心 |
| rep / repDown | #ffffff / #ff8a8a | 名聲(白星)/ 名聲下降 |
| crag / ruins / lava / pond / hall | #2c3122 / #2a2534 / #33221d / #1c2836 / #25242b | 地板依區染色(雷鳥崖偏橄欖、遺跡偏紫、熔岩洞偏紅褐、水池偏藍、走道中性) |
| wall / wallEdge | #0c0b10 / #3d3a4a | 牆(磚紋) |
| pillar / pillarHi | #4a4658 / #6a6680 | 石柱(整格) |
| lavaTile / lavaHi | #b8361a / #ff8a2a | 熔岩格與裂紋 |
| waterTile / waterHi | #1d4f8f / #5f9fe0 | 水格與波紋 |
| arenaFloor / arenaLine | #3a3226 / #4c4232 | 表演場沙地 / 場地圈線 |
| stands / standsRow | #241b17 / #33271f | 觀眾席 |
| fenceWood / fenceDk | #a8794a / #5a3c22 | 圍欄 |

四種元素色已用 node 驗算: 色相兩兩差 ≥ 67°(10 / 77 / 202 / 270), 灰階分四階 96 / 136 / 179 / 222(相鄰差 ≥ 40)。雷刻意放在黃綠, 避開與火(紅)、金幣(黃 45°)相鄰。

## 形狀語言

圓角、深色粗描邊、扁平填色; **魔物(會動的生物)= 有輪廓線的剪影 + 地上影子, 地形 = 無描邊的平塗方格**。危險(敵方技能)= 元素色的面或粗環; 玩家放出的東西(鞭、哨、反射波)= 線條為主, 帶白色或淺色前緣。

## 理念落實

- **P0 辨識度先於好看**: 四種魔物每種一個剪影(長身火冠蜥蜴 / 鐘形觸手水母 / 鋸齒翅雷鳥 / 方塊雙角石像鬼)+ 一個元素色, 牠的技能、反射波、HUD 圖示全用同一色; 地板只用極暗的區色, 讓魔物與技能永遠是畫面上最亮的東西。
- **P1 視覺權重跟著決策迫切度走**: 最亮、對比最強的是正在預警 / 生效的技能(玩家此刻要閃或要彈反)和魔物頭上的怒氣條; 地板、觀眾席、場地圈線全部壓到暗低彩; 飄字小而短, 不蓋怒氣條。
- **P2 規則上存在就畫出來**: 殘血 30% 門檻畫成血條上的白刻度; 怒氣 50 門檻與 80~99 紅線區常駐在每條怒氣條上; 套索時限、繩長繃緊、彈反時機剩多少、暈眩剩多少、撞欄剩多少、制伏 0/3 全部有圖形; 馴獸師身體圓 = 判定半徑 18, 石柱畫滿整格(= 擋路範圍)。
- **P3 一個意義一種長相**: 繩色(#e2b866)只代表「收服」(殘血可套的虛線圈、套索、進度環、繩數、加成飄字); 粉紅(redLine)只代表「怒氣過頭」(紅線區、失控外圈、破欄、繩快斷、警示訊息); 元素色只代表該種魔物與牠的技能; 說明頁全部呼叫遊戲內畫法。
- **P4 關鍵區分走兩條通道**: 敵方技能 vs 玩家反射波: 實心面 / 粗碎石環 vs 白色前緣 + 往外箭頭 + 白虛線全範圍圈; 揮鞭 vs 吹哨: 單道鞭痕掃過 + 外緣小尖 vs 三圈柔和波浪 + ♪, 色也分(奶油白 / 薄荷白); 點燃 / 澆熄 / 安撫: 白閃 + 外射火花 + 上箭頭 vs 落下水滴 + 下箭頭 vs 薄荷圈 + ♪ + 下箭頭; 四色同時分色相與明度。
- **P7 每個元素都要掙得版面**: 怒氣條不寫數字(刻度與區色已給決策需要的刻度); 魔物不掛名字; 套索環不寫百分比; 說明頁的按鍵只用鍵帽貼在做動作的馴獸師旁, 不另排一列對照。
- **P9 以最混亂的那一刻驗收**: 所有字、技能邊緣、怒氣條都帶深色描邊或深底, 疊在火盤 / 反射波 / 其他魔物上仍讀得到; 反射波中心挖空只畫環, 不整片蓋住圈內魔物的怒氣條。
- **P13 事件要排隊**: 本作美術端沒有會同時冒出的事件卡; 飄字由 RD 依時間排, 每則 1 秒、往上飄 44 像素後淡出, 前 60% 不透明。HUD 訊息一次只放一句。
- **P15 回饋強度和份量成正比**: 一般金幣 22px → 紅線金幣 30px + 粉紅外描 → 彈反 30px 白字 + 閃光 + 反射波 → 收服 32px; 魔物被技能打中只有小火花, 反射波一次點燃整群是全場最大的環。
- **P17 進度圖形與數字分工**: 時間: 大數字給秒數, 細條只給總進度並在最後 10 秒變粉紅; 怒氣條不給數字, 圖形只表達「離 50 / 80 / 100 還多遠」; 冷卻鍵帽用由上往下退的深色遮罩畫剩餘, 好了就整顆亮起。
- **P18 重要資訊不能只閃一下**: 收服加成除了飄字, 常駐在 HUD 陣容圖示下的三顆加成點, 結算也列出各級; 陣容缺哪種用暗剪影常駐。
- **P19 資訊貼著物件**: 怒氣條、制伏進度、血條、殘血記號全在魔物頭上; 彈反時機弧、暈眩星在馴獸師身上; 套索時限畫在被套魔物外圈。
- **P21 示意圖選分岔的例子**: 說明第 1 頁並排「站在火圈外的殘影」與「翻滾中在火圈裡」, 第 4 頁讓施放者(雷鳥)站在反射範圍外、只有圈內三隻被點燃, 第 5 頁並排「中段一顆金幣」與「紅線段一堆金幣 ×2」以及「滿了 → 失控撞欄(打叉)」。

## 物件表

所有 `x, y` 皆為物件中心的畫面座標(地下城已扣鏡頭), 只有 drawButton 是左上角。

| 物件 | 函式 | state 欄位 | 各狀態視覺 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | — | 全畫面填 bg |
| Tile | `drawTile(ctx, s)` | x, y, kind(wall/pillar/floor/lava/water), zone(crag/ruins/lava/pond/hall), nest(bool) | wall: 近黑 + 磚紋; pillar: 區色地板上一塊滿格圓角石柱(圓頂高光); floor: 區色平塗; lava: 橘紅 + 亮裂紋 + 泡; water: 深藍 + 三條波紋; nest=true: 地板上一圈該區魔物色的虛線圈 + 三個小點 |
| Tamer | `drawTamer(ctx, s)` | x, y, facing(0~7), rolling, parryLeft, parryDur, stunLeft, stunDur, blink, lassoing | 常態: 奶油白圓身(半徑 18)+ 棕帽 + 眼睛看向面向 + 身外奶油色面向箭頭; rolling: 縮成棕色球 + 旋轉條紋 + 身後三條速度線(無面向箭頭); parryLeft>0: 全方位白色護泡(半徑 26)+ 外圈白弧 = 時機剩餘比例; stunLeft>0: 身體變灰、眼睛打叉、頭頂三顆繞圈小星 + 灰紫弧 = 暈眩剩餘; blink: 自己以 12Hz 閃爍(RD 傳 true 即可, 不用自己切); lassoing: 手邊一圈繩 |
| WildMonster | `drawWildMonster(ctx, s)` | x, y, species, hp, maxHp, hit, weak, lassoed, casting, dir | 頭上血條(白刻度 = 30% 可套門檻); hit: 整隻疊白; weak: 外圈繩色旋轉虛線圈 + 頭旁白色螺旋 + 血條變繩色; lassoed: 身上綁一圈繩 + 左右掙扎抖動(虛線圈改不畫); casting: 身後元素色閃爍光暈; dir -1 朝左 / 1 朝右 |
| Lasso | `drawLasso(ctx, s)` | x1, y1, x2, y2, progress, t, limit, len, maxLen | 繩從馴獸師連到魔物, 鬆時下垂、越長越直; len/maxLen ≥ 0.8 變細並粉紅閃(快斷); 魔物外圈半徑 42 的粗繩色進度環(progress, 從正上方順時針); 半徑 49 細環 = 時限剩餘, 剩 30% 變粉紅 |
| Hazard | `drawHazard(ctx, s)` | x, y, kind, phase, radius, t, dur, angle | firering / thunder warn: 元素色虛線圈 + 由中心長大的填色, 填滿 = 生效(雷多一個準星); firering active: 火色實心盤 + 鋸齒火舌邊; thunder active: 亮黃綠盤 + 從上方劈下的閃電, 隨 t/dur 淡; quake: 石紫粗環(radius ± 15)+ 碎石塊, warn 時只在中心一小圈虛線; waterball: 半徑 12 水藍球 + 白高光 + 身後兩顆殘影(沿 angle 反方向) |
| WhipCrack | `drawWhipCrack(ctx, s)` | x, y, shape(arc/circle), facing, radius, t, dur | arc: 以面向為中心 120° 扇形淡填 + 外緣一道鞭痕在前 45% 時間掃完 + 內刺小尖; circle: 整圈同樣做法; t ≥ dur 不畫 |
| WhistleWave | `drawWhistleWave(ctx, s)` | x, y, radius, t, dur | 薄荷淡填 + 三圈波浪環往外 + 範圍邊界一圈實線 + 兩個 ♪; t ≥ dur 不畫 |
| ParryFlash | `drawParryFlash(ctx, s)` | x, y, t, dur | 白色八芒星爆 + 中心白光, 隨 t/dur 放大淡出; t ≥ dur 不畫 |
| ReflectWave | `drawReflectWave(ctx, s)` | x, y, element, radius, t, dur | 白虛線圈 = 全範圍(radius); 元素色粗環由 0 擴到 radius(先快後慢)+ 白色前緣 + 8 個往外白箭頭; 圈內只極淡元素色; 最後 25% 淡出 |
| ShowArena | `drawShowArena(ctx)` | — | 依數值表版面: 上觀眾席 y130~250、下觀眾席 y1020~1140(x60~660), 場地 x60~660 / y270~1000 沙地 + 兩圈場地線; 圍欄帶 y250~270 / 1000~1020 深底(圍欄本身由 drawFence 畫) |
| ShowMonster | `drawShowMonster(ctx, s)` | x, y, species, rage, mode(roam/charge/loose), performing, fx(none/ignited/doused/calmed), fxT, fxDur, subdue, chargeT, chargeDur, dir | 本體與 WildMonster 同一套畫法; roam: 頭上怒氣條(見下); performing: 元素色光暈 + 往上竄的小星 + 本體上抬 3px; ignited: 疊白閃 + 6 道外射白火花 + 粉紅上箭頭; doused: 4 顆落下的水滴 + 水藍下箭頭; calmed: 薄荷圈 + ♪ + 薄荷下箭頭(fx 都隨 fxT/fxDur 淡出); charge / loose: 怒氣條換成「三顆制伏點 + 0/3」, 身外粉紅鋸齒外圈 + 抖動; charge 且 chargeT>0: 外圈粉紅弧 = 撞欄進度 |
| (怒氣條) | ShowMonster 內建 | rage | 灰底; 80~99 常駐粉紅斜紋 + 粉紅框; 50 白刻度; 填色: <50 灰藍、50~79 奶油白、80~99 粉紅、100 粉紅白閃; 不寫數字 |
| Fence | `drawFence(ctx, s)` | x, y, side(top/bottom), broken | 完好: 兩根木柱 + 兩條橫木; broken: 橫木斷成四截往外歪 + 中央粉紅缺口與粉紅叉 |
| Visitor | `drawVisitor(ctx, s)` | x, y, seat(0~11), mode(watch/scared/empty) | watch: 坐著微笑, 衣服顏色依 seat 輪替(低彩); scared: 身體變灰、雙手舉高、張嘴、抖動 + 粉紅「!」; empty: 只剩座椅 + 淡灰虛線人形框 |
| TitleCard | `drawTitleCard(ctx, s)` | day, stage(dungeon/show) | 全畫面: 「第 N 天」+「地下城」(繩色)/「表演場」(奶油白)+ 小圖 +「按 Z 開始」 |
| ShopItem | `drawShopItem(ctx, s)` | x, y, item(whipPower/ropeBag/armor/silverWhistle), level, cost, affordable, selected | 卡片: 圖示 + 名稱(鞭力 / 繩袋 / 護甲 / 銀哨)+「Lv n」+ 一行效果 + 右側金幣價格; selected: 亮底 + 金色粗框 + 左側金色箭頭; affordable=false: 價格變淡紅 + 半透明 + 「金幣不足」小字 |
| Button | `drawButton(ctx, s)` | x, y(左上角), w, h, label, selected | 未選: 面板色 + 細框 + 白字; 選中: 金底 + 白粗框 + 深字 + 左側深色箭頭 |
| FloatText | `drawFloatText(ctx, s)` | x, y, text, kind, t, dur | 往上飄 44px, 前 12% 彈出、後 40% 淡出; gold: 22px 金字 + 金幣; redGold: 30px 金字 + 粉紅粗外描 + 金幣; repUp: 20px 白字 + 白星; repDown: 20px 淡紅字 + 下箭頭; capture: 32px 白字 + 棕外描; perk: 26px 繩色字; parry: 30px 白字。文字內容由 RD 給 |
| ResultPanel | `drawResultPanel(ctx, s)` | rep, goldEarned, reflects, roster, perks, stars | 全畫面: 「三天結算」+ 三顆大星(亮幾顆 = stars)+ 名聲 / 賺得金幣 / 彈反反射三列 + 四種陣容圖(沒有的暗剪影)與加成點、加成名 Lv +「按 Z 重來」 |
| Hud | `drawHud(ctx, s)` | phase, day, gold, rep, hearts, maxHearts, ropes, ropeMax, roster, perks, timeLeft, timeMax, message, rollCd, rollCdMax, parryCd, parryCdMax, whistleCd, whistleCdMax | 見「HUD 版面」; phase 為 guide / title / result 時什麼都不畫 |
| 說明頁示意圖 | `drawGuidePage(ctx, s)` | page(0~4), x, y, w, h | 見「說明頁」 |

`roster` 每項 `{ species }`(也接受直接傳字串); `perks` = `{ fire, water, thunder, stone }` 各 0~3。

### 畫面文字歸屬(避免兩邊各畫一份)

- **美術已畫, RD 不要再畫**: 標題卡的「第 N 天 / 地下城或表演場 / 按 Z 開始」; 結算的所有字含「按 Z 重來」; 商店卡片內的名稱、Lv、效果、價格、「金幣不足」; 按鈕標籤(RD 傳 label); HUD 上的天數、階段名、時間、金幣、名聲、冷卻鍵帽字(X 翻滾 / X 吹哨 / C 彈反)、`message`; 說明頁圖內的鍵帽與短標籤(「收服!」「×2」、底部流程「地下城 → 表演場 → 商店 × 3 天 → ★」)
- **RD 畫**: 說明頁的頁標題、說明文字、頁碼、「按 Z 繼續」; 商店畫面頂端標題與底部「↑↓ 選擇 Z 確定」; 飄字的文字內容(美術只畫樣式)

## HUD 版面(y 0~120, 位置固定)

| 區塊 | 位置 | 內容 |
|---|---|---|
| 天數 / 階段 | x16, y22 / y50 | 「第 N 天」20px 次要字; 階段名 26px(地下城繩色、表演場奶油白、商店金色) |
| 時間(地下城 / 表演場) | 數字 x170 y30(34px); 條 x230~430 y26~34 | 剩 ≤ 10 秒數字與條變粉紅 |
| 金幣 | 金幣圖 x470, 數字 x490 起, y30 | 28px 金字 |
| 名聲 | 白星 x600, 數字 x620 起, y30 | 28px 白字 |
| 心(地下城) | x30 起, y86, 間距 min(28, 236/maxHearts) | 亮 = 剩, 暗 = 失去; maxHearts 多到 12 顆仍收在 x16~270 |
| 捕獸繩(地下城) | x288 起, y86, 間距 min(26, 110/ropeMax) | 繩色圈 = 剩, 暗紫灰 = 用掉 |
| 訊息(表演場) | x16~396, y70~110 粉紅框膠囊 | 例「追上去吹哨 3 次」, 22px |
| 陣容 + 收服加成 | 四隻小圖中心 x425 / 463 / 501 / 539, y80; 加成點 y101 | 有 = 彩色, 沒有 = 暗剪影; 下方三點亮幾個 = 幾級(該種色) |
| 冷卻鍵帽 | X: 中心 x600 y92; C: x672 y92(各 60×46) | 好了 = 整顆奶油白; 冷卻中 = 半亮底 + 由上往下的深色遮罩(高度 = 剩餘比例)+ 灰虛線框。地下城 X 是「翻滾」, 表演場 X 是「吹哨」 |
| 訊息(地下城) | 畫面最下緣 y1222~1262 置中膠囊 | 馴獸師在地下城固定在畫面 y≈820, 下緣不壓路線; 不放 HUD 下方是因為那裡是玩家前方的路 |
| 商店 | 只畫天數 / 「商店」/ 金幣 / 名聲 / 陣容; message 在 x200 y90 | |

## 說明頁(drawGuidePage)

- 只畫在 `(x, y, w, h)` 框內(會 clip); 內部以 600×480 虛擬畫布設計, 等比縮放置中, RD 給什麼比例的框都行(建議 640×512 以上, 字才不會太小)
- 圖裡的遊戲物件全部直接呼叫遊戲內的 drawXxx, state 皆為規則上成立的值
- 頁碼 page 0 起算: 0 地下城 / 1 收服 / 2 表演 / 3 反射 / 4 拿捏

| 頁 | 圖 |
|---|---|
| 0 地下城 | 上左: 馴獸師朝右揮鞭(扇形)打中火蜥蜴(受擊閃白), 旁邊方向鍵四鍵 + Z 鍵帽; 下左: 火蜥蜴的火圈生效中, 淡化的馴獸師站在圈外, 虛線軌跡接到翻滾中的馴獸師(在圈內), X 鍵帽; 右: 水母射出 3 發水彈, 中間那發打在舉盾馴獸師的護泡上閃光, 白色虛線箭頭彈回水母(水母受擊閃白), 另兩發從兩側飛過, C 鍵帽 |
| 1 收服 | 遺跡地板; 殘血且被套住的石像鬼, 繩連到牠左邊的馴獸師; 繩色圓形路線: 走過的上半圈實線、還沒走的下半圈虛線 + 箭頭; 魔物外圈進度環填到一半; 右下角小框: 進度環全滿 + 淡化的石像鬼 + 大白勾 +「收服!」 |
| 2 表演 | 中間一條分隔線。左: 整圈鞭打範圍, 圈內水母(表演中, 射出 3 發水彈)與雷鳥, 兩條怒氣條在 50 以上、旁邊粉紅上箭頭, 水母上方飄「+3」金幣, Z 鍵帽; 右: 整圈哨音範圍, 圈內石像鬼與火蜥蜴被安撫(薄荷圈 + ♪)、怒氣條在 50 以下、旁邊薄荷下箭頭, X 鍵帽 |
| 3 反射 | 馴獸師舉盾, 落雷打在身上 + 彈反閃光; 雷元素反射波擴到約 0.8 倍半徑, 白虛線標出全範圍 160; 圈內火蜥蜴、水母、石像鬼都是「點燃」(白閃火花 + 粉紅上箭頭); 施放的雷鳥站在範圍外右下(表演中), C 鍵帽 |
| 4 拿捏 | 上方一條大怒氣條(與遊戲內同一個畫法, 填到 92); 紅線段上方飛出一堆金幣 +「×2」; 左下一隻在中段表演的雷鳥頭上只有一顆金幣(對照); 條的最右端用粉紅虛線接到右下: 三段圍欄其中一段破掉, 失控的火蜥蜴在觀眾席裡、旁邊觀眾嚇到, 粉紅打叉; 最底「地下城 → 表演場 → 商店 × 3 天 → ★」 |

**與 guide.md 字面的偏離**: 第 1 頁 guide 寫「畫面下方四個鍵帽各對應走 / 揮鞭 / 翻滾 / 彈反」。依分工按鍵說明歸 RD, 所以圖裡改成把鍵帽貼在做那個動作的馴獸師旁, 不排成一列、不配動作名(動作名在 RD 的頁面文字裡已有)。

示意座標驗算(規則判定式): 第 0 頁火蜥蜴距揮鞭者 90 < 110 且在面向 ±60° 內; 翻滾中的馴獸師距火圈中心 80 < 120、殘影 183 > 120。第 1 頁套索長 130 < 220。第 2 頁鞭圈內兩隻距離 93 / 85 < 110, 哨圈內兩隻 93 / 95 < 140。第 3 頁圈內三隻距離 132 / 130 / 130 < 160, 雷鳥 280 > 160(不受反射)。

## 尺寸表

| 物件 | 尺寸(介面 size) | 實際內容 |
|---|---|---|
| Tile | 60×60 | 整格; 石柱畫滿整格(邊界 = 擋路判定) |
| Tamer | 64×64 | 身體圓半徑 18(= 判定半徑); 帽頂 −25; 面向箭頭尖端 30; 護泡半徑 26 + 時機弧 30; 暈眩星最高 −31 |
| WildMonster | 90×90 | 本體約 ±34 × −28~+24; 血條 x ±29、y −43~−35; 殘血虛線圈半徑 37; 施法光暈半徑 40 |
| Lasso | 無 | 進度環半徑 42(寬 6)、時限環半徑 49(寬 2.5), 圍繞 (x2, y2) |
| Hazard | 無 | 火圈 / 落雷 = radius; 震波 = radius ± 15 的環; 水彈半徑 12(= 判定), 殘影在後方 |
| WhipCrack / WhistleWave | 無 | 範圍邊 = radius |
| ParryFlash | 120×120 | 光芒最長 56 |
| ReflectWave | 無 | 白色前緣 = 當下半徑, 白虛線 = radius |
| ShowMonster | 100×100 | 本體同上; 怒氣條 80×9 在 y −43 中心; 制伏列 92×17 在 y −50~−33; 失控鋸齒外圈 42、撞欄弧 46 |
| Fence | 100×16 | 木柱 x ±43~49; 橫木 92 寬 |
| Visitor | 60×90 | 頭頂 −31, 嚇到時手 −28、「!」−42; 座椅底 +42 |
| ShopItem | 600×140 | 卡片 596×136 |
| Button | w×h | 圓角 18 |
| TitleCard / ResultPanel | 全畫面 | 中央面板 540×480 / 600×1000 |
| HUD | 720×120 | 見 HUD 版面 |

自查: 用會追蹤變換矩陣的假 ctx 跑過所有函式的所有狀態組合(5392 次呼叫), 有 size 的物件外接框都在 size 內; 唯一回報是怒氣條紅線斜紋, 那段有 clip, 實際不出框。

## 判讀約定(請 RD 照這個算判定)

- **震波 quake 的 radius = 環的中線**, 判定環帶 = [radius − 15, radius + 15](環寬 30)。介面只寫「當下半徑」, 沒說是外緣還是中線; 美術畫的是中線 ± 15, 若 RD 的判定取外緣或內緣, 畫面會比判定差 15 像素, 請兩邊對齊
- 火圈 / 落雷的 radius = 圓的外緣(實心圓); 水彈畫面半徑 12 = 判定半徑
- 反射波: radius 為最終半徑 160, 畫面上的白色前緣 = radius × (1 − (1 − t/dur)²)。若 RD 判定是在放出那一刻一次結算整圈, 白虛線圈就是判定範圍
- 表外值的預設: species / element 不是 fire / water / thunder / stone 時畫成火蜥蜴 / 火; state 為 null 或缺欄位時各欄退回預設(座標 0、布林 false、比例 0)。畫面上看到不該出現的火蜥蜴, 先查傳入的種類字串

## 時長常數(全部由 state 傳入, 美術不寫死)

| 效果 | 用到的總長欄位 | 來源 |
|---|---|---|
| 揮鞭 / 哨音 / 彈反閃光 | dur(介面 0.25) | 介面 |
| 反射波 | dur(介面 0.4) | 介面 |
| 技能預警填色 | Hazard.dur(該 phase 總長) | 介面 |
| 套索時限 | limit | 介面 |
| 彈反時機弧 / 暈眩弧 | parryDur / stunDur | 介面 |
| 魔物 fx | fxDur | 介面 |
| 撞欄弧 | chargeDur | 介面 |
| 飄字 | dur(介面 1) | 介面 |
| 冷卻遮罩 | rollCdMax / parryCdMax / whistleCdMax | 介面 |
| 無敵閃爍 12Hz、火舌 / 觸手擺動、殘血螺旋旋轉 | 美術用系統時間自轉 | 美術自訂 |

一次性特效在 t ≥ dur 時自己不畫, RD 過時移除即可。

## 繪製層級(由下往上)

1. drawBackground
2. 地下城: drawTile(全部)/ 表演場: drawShowArena → drawFence → drawVisitor
3. drawHazard 的 warn 與火圈 / 落雷 / 震波 active(地面類)
4. drawWhipCrack、drawWhistleWave、drawReflectWave
5. drawLasso(繩在魔物下面)
6. drawWildMonster / drawShowMonster(依 y 排序)
7. drawHazard waterball(飛行物, 在魔物上面)
8. drawTamer → drawParryFlash
9. drawFloatText
10. drawHud(最上, 地下城的地圖會被它蓋住 y 0~120)
11. 全畫面: drawTitleCard / 商店(drawShopItem、drawButton)/ drawResultPanel / 說明頁(RD 的底 + drawGuidePage)
