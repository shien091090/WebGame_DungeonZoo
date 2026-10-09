# 大場面動物園: 深入一層 — 美術規格(給 RD)

> index.html 必須宣告 `<meta charset="utf-8">`, 否則 art.js 裡的中文會變亂碼。
> 用法: `<script src="art/art.js"></script>` 後呼叫 `window.Art.drawXxx(ctx, state)`。每個函式自己 save/restore。座標 x,y 一律是物件**中心**; 只有 `drawButton` 的 x,y 是**左上角**。

## 1. 邏輯畫布尺寸

720 × 1280(直式)。`Art.canvas = { width: 720, height: 1280 }`。

## 2. 色票表(`Art.palette`)

| 名稱 | 色碼 | 用途 |
|---|---|---|
| bg | #141824 | 整體底色 |
| hudBg / hudLine | #1b2131 / #323b55 | HUD 底與分隔線 |
| text / textDim | #f2f4f8 / #9aa3b8 | 主文字 / 次要標籤 |
| gold | #ffcc33 | 金幣(圖示、數字、飛出的金幣)、一般表演怒氣段 |
| rep | #ff8fd0 | 名聲(皇冠圖示、數字、名聲增加飄字) |
| select | #4fe3ff | 「你選的」: 啟用中的模式按鈕、選中的候展魔物、可放入的籠子、丟網瞄準框 |
| calm | #7cf5c0 | 安撫(波紋、怒氣條外框、怒氣下降飄字) |
| danger | #ff4a4a | 危險/損失: 傷害飄字、低血量、高怒氣段、失控、破損籠子、逃脫魔物、名聲減少、失敗叉 |
| ok | #5fe08a | 成功勾 |
| hp | #5fd36a | 血條 |
| star | #fff0a0 | 魔物星級的星星 |
| rageNone / rageShow / rageFrenzy | #7d8aa8 / #ffcc33 / #ff4a4a | 怒氣條三段 |
| fire / water / thunder / stone | #ff8a2a / #3c8cff / #a46cff / #9aa0a8 | 四種魔物本體色 |
| player / playerArmor | #d9b27a / #c9d2e0 | 玩家 |
| net | #eadcb8 | 捕獲網繩 |

## 3. 形狀語言

粗黑外框(#0b0e16)+ 平塗、圓角; 物件是「有外框的立體小角色」, 場景(地下城牆地、動物園草地)無外框、低對比。

## 4. 理念落實

- **P0 辨識度先於好看**: 四種魔物用四種剪影(橫躺蜥蜴 / 傘狀水母 / 圓鳥加閃電翼 / 方塊石像)+ 四種色相, 縮小到候展區 56px 仍分得出。
- **P1 視覺權重跟著決策迫切度走**: 場景調暗、無外框; 全畫面只有啟用中的模式按鈕、選中物件、高怒氣籠子會發光; 3★ 魔物身後有淡金光暈(稀有 = 要不要冒險抓的決策點)。
- **P2 規則上存在的東西畫面上就存在**: 怒氣條上畫出 40 / 80 兩條門檻刻度; 網數畫成可數的網圖示(實 = 剩、暗 = 用掉); 逃脫魔物「剩幾下」畫成三段環; 破損籠子留下逃走魔物的淡剪影。
- **P3 一個意義一種長相**: 青色只代表「你選的 / 你瞄準的」, 紅色只代表危險與損失, 金色只代表錢, 粉紅皇冠只代表名聲; 說明頁全部呼叫遊戲內畫法。
- **P4 關鍵區分走兩條通道**: 怒氣三段 = 顏色 + 魔物姿勢(趴睡 Zzz / 站立 / 青筋抖動); 按鈕三態 = 填色 + 外框(實線 / 實心發光 / 虛線); 商店買不起 = 變暗 + 虛線框 + 紅價格; 捕獲成功 / 失敗 = 綠勾收網 / 紅叉碎網。
- **P7 每個元素掙得版面**: 籠子不寫怒氣數字(條 + 門檻已足夠); 玩家身上不畫血條(HUD 已有); 地下城不重複畫層數。
- **P9 以最混亂那一刻驗收**: 逃脫魔物帶紅色底圈與紅色三段環, 混在 6 名遊客與 4 個籠子之間仍跳出來; 飄字一律黑描邊。
- **P13 事件排隊**: 美術端每個特效自帶淡出(表演 1.2 秒、飄字 1 秒), RD 若同一籠連續觸發, 請等前一個 t 結束再起下一個。
- **P15 回饋強度與份量成正比**: 一般表演 vs 高怒氣表演 = 粒子數 + 尺寸 ×1.35 + 額外紅色衝擊環; 星級越高粒子與金幣越多。
- **P17 進度圖形與數字分工**: 怒氣條不配數字, 圖形負責「離下一道門檻(40 / 80 / 100)多遠」; 血條配數字(數字給精確值、條給殘血比例, 後者決定丟網時機)。
- **P18 重要資訊不只存在一瞬間**: 飄字閃過的金幣與名聲都常駐在 HUD; 結算畫面列全部累計值。
- **P19 資訊貼著物件**: 星級、血條、抓回次數都長在物件上; HUD 提示放在 HUD 正下方固定位置。
- **P21 示意圖選分岔的例子**: 說明第 2 頁重擊 / 輕擊並排掉不同長度; 第 3 頁滿血 ✗、殘血 ✓、打倒 ✗ 三格並排(錯誤理解「打死再抓」與「直接丟」都被叉掉)。

## 5. 物件表

| 物件 | 函式 | state 欄位 | 各狀態視覺差異 |
|---|---|---|---|
| 背景 | `drawBackground(ctx)` | — | 純色 bg 鋪滿 |
| DungeonRoom | `drawDungeonRoom(ctx, { day, depth })` | day, depth | 磚牆 120~360、地板 360~1040、底部操作區 1040~1280。depth 每 +1 疊一層暗紫(每層 +9%, 上限 62%), 火把變弱、四角更暗; day 不改變外觀 |
| ZooGround | `drawZooGround(ctx)` | — | 草地; 籠子區底板 146~794、遊客步道 800~1000(柵欄在上緣)、候展區木板 1012~1148(左上「候展區」小字)、按鈕區 1152~1280 |
| Player | `drawPlayer(ctx, { x, y, hp, maxHp, hit })` | x,y,hp,maxHp,hit | 正常: 頭盔劍士; hit=true: 泛紅 + 抖動; hp/maxHp ≤ 30%: 身後紅色脈動光 + 汗滴; hp ≤ 0: 橫躺、X 眼、灰色(倒下) |
| Monster | `drawMonster(ctx, { x, y, species, star, hp, maxHp, hit, aimNet })` | 同左 | 頭上 1~3 顆星; 3★ 身後淡金光暈; 腳下綠血條 + 右側目前血量數字; hit=true: 本體變白 + 抖動; aimNet=true: 青色虛線瞄準圈 + 四段括弧(脈動); hp ≤ 0: X 眼、灰化、傾倒(說明頁用, 遊戲內打倒即消失) |
| Net | `drawNet(ctx, { x, y, t, result })` | x,y,t,result | flying: 網張開旋轉(0.35 秒內半徑 30→72); success: 收成一包 + 綁繩 + 擴散綠環 + 右上綠勾; fail: 網碎成四塊往外飛淡出 + 右上紅叉。x,y 傳魔物中心即可疊在牠身上 |
| Cage | `drawCage(ctx, { x, y, species, star, rage, tier, calmFlash, broken, selected })` | 同左 | species=null: 空籠, 中央虛線圈 +「空」; tier none: 魔物趴睡 Zzz; show: 站立; frenzy: 青筋 + 抖動 + 身後紅光 + 紅框紅欄杆; 底部怒氣條(顏色依 tier, 40/80 白刻度, 右端紅色裂紋記號); calmFlash>0: 薄荷色波紋擴散 + 怒氣條薄荷外框 + 往左箭頭; broken=true: 中間三根欄杆彎斷、裂痕、紅色虛線框、只剩魔物淡剪影、不畫怒氣條; selected=true: 青色發光外框 |
| ShowEffect | `drawShowEffect(ctx, { x, y, species, star, tier, t })` | 同左 | 1.2 秒播完(t>1.2 不畫)。fire 火焰扇形噴出; water 水泡噴泉; thunder 放射閃電; stone 震波 + 碎石。tier=frenzy: 尺寸 ×1.35、粒子變多、外加紅色衝擊環; star 越高粒子與金幣越多。剪裁在籠子 300×280 內, x,y 傳籠子中心 |
| LooseMonster | `drawLooseMonster(ctx, { x, y, species, star, hitsLeft, hit })` | 同左 | 生氣臉 + 紅色底圈; 外圈三段環: 紅 = 還要點的次數, 暗灰 = 已點掉; 星級在腳下; hit=true: 變白 + 抖動 |
| Visitor | `drawVisitor(ctx, { x, y, scared })` | 同左 | 觀看: 微笑站立(衣服顏色依 x 自動變化); scared: 半透明、後仰、雙手舉高、張嘴、頭旁紅色「!」 |
| TrayMonster | `drawTrayMonster(ctx, { x, y, species, star, selected })` | 同左 | 木色圓座 + 小魔物 + 腳下星級; selected: 圓座變藍、魔物浮起、青色發光圈 |
| Button | `drawButton(ctx, { x, y, w, h, label, enabled, active })` | 同左(x,y 左上角) | 可按: 深藍底 + 實線框; active(啟用中的模式): 青色實心 + 發光、深色字; 不可按(enabled=false): 更暗底 + 虛線框 + 灰字。label 為「重擊 / 輕擊 / 捕獲網 / 深入一層 / 撤退回園 / 開園 / 出發」時自動加左側小圖示; 其他 label 只畫字 |
| ShopItem | `drawShopItem(ctx, { x, y, item, level, cost, affordable })` | 同左 | item: weapon 劍 / armor 盾 / netBag 網袋 / goodNet 網 + 綠加號; 左圖示、中名稱 + 效果、level>0 時「已買 N」、右側金幣 + 價格。affordable: 金框、金色價格; 否: 變暗、虛線框、紅色價格 |
| FloatText | `drawFloatText(ctx, { x, y, text, kind, t })` | 同左 | 1 秒左右淡出(t>1.2 不畫), 剛出現時微放大。gold: 金色 + 金幣圖示、上飄; repUp: 粉紅 + 皇冠、上飄; repDown: 紅 + 皇冠、**下沉**; damage: 紅、上飄、最大字; rage: text 以「-」或「−」開頭 → 薄荷色下沉(安撫), 否則紅色上飄。text 由 RD 帶正負號(例 "+12"、"-6") |
| ResultPanel | `drawResultPanel(ctx, { rep, goldEarned, maxDepth, bestStar, stars })` | 同左 | 全畫面半透明遮罩 + 面板: 「三天結算」、3 顆大評價星(stars 顆金色、其餘暗)、總名聲 / 累計金幣 / 最深層數 / 最高星級(bestStar 顆小星, 0 顯示「—」)、門檻說明、**「點畫面重來」**(RD 不用再畫) |
| HUD | `drawHud(ctx, { phase, day, gold, rep, hp, maxHp, nets, netMax, timeLeft, depth, loot, message })` | 同左 | 0~120 深色條。第一列: 「第 N 天 · 第 M 層 / 擺放 / 開園中 / 商店」+ 右側金幣。第二列: dungeon / roomClear = 血條(含 hp/maxHp 數字, ≤30% 變紅)+ 網圖示 netMax 個(實 = 剩)+「戰利品 ×loot」; place / show / shop = 皇冠 + 名聲, show 時右側「剩 N 秒」(≤10 變紅)。phase 為 guide 或 result 時不畫。message 非空時在 y 124~156 置中畫提示條, 含「倒下」或「跑了」時紅框紅底。spec 的三句 HUD 提示請放 message |
| 說明頁示意圖 | `drawGuidePage(ctx, { page, x, y, w, h })` | page 0~5 | 只畫在 (x,y,w,h) 內(等比縮放置中, 內部座標 640×560)。不畫頁標題、說明文字、頁碼、翻頁提示。0 目標 / 1 重擊輕擊 / 2 捕獲三格 / 3 深入或撤退 / 4 怒氣低高 / 5 安撫與失控 |

spec 物件清單 14 項都有獨立函式, 無合併。

## 6. 尺寸表

| 物件 | 尺寸(= 判定範圍, 以中心為準) | 備註 |
|---|---|---|
| Player | 160 × 160 | 倒下時旋轉並縮 0.88 仍在框內 |
| Monster | 160 × 160 | 本體半徑約 44; 星級 y−68; 血條 y+56~+68; 瞄準圈半徑 66~75 |
| Net | 160 × 160 | 最大半徑約 77 |
| Cage | 300 × 280 | 怒氣條 y+108~+126、x −128~+128 |
| ShowEffect | 300 × 280 | 以籠子中心剪裁 |
| LooseMonster | 120 × 120 | 三段環半徑 54 |
| Visitor | 60 × 90 | |
| TrayMonster | 100 × 100 | 圓座半徑 46 |
| ShopItem | 600 × 140 | |
| Button | 由 state.w/h 決定 | 建議高 ≥ 72; 字級 = clamp(h×0.36, 18, 30) |
| FloatText | 無固定 | 字級 26~34 |
| HUD | 720 × 120(+ 提示條 y 124~156) | |

## 7. 繪製層級(由下到上)

地下城: Background → DungeonRoom → Monster → Player → Net → FloatText → Button → HUD
動物園: Background → ZooGround → Cage → ShowEffect → Visitor → LooseMonster → TrayMonster → Button / ShopItem → FloatText → HUD → ResultPanel
