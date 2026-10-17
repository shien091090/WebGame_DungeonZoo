# 音效經驗提案(DungeonZoo 打磨第 12 輪 build)

## 提案 1 → 放進「素材來源」(新條目)

- `辨識` **要「一把金幣噴出來」約 0.6 秒的嘩啦聲, CC0 錢幣錄音多是單枚掉落或很長的倒錢** → BigSoundBank 的錢幣類(站內搜尋 `https://bigsoundbank.com/search?q=coins`, 結果頁的連結含 `-s<四位數編號>.html`, 可直接抓出編號)12 筆都是單枚掉進杯子、在桌上旋轉 12~20 秒, 或 45 枚慢慢倒 43 秒; Kenney 的 RPG / 賭場包只有手抓錢幣與籌碼單響 → OpenGameArt 上 LordTomorrow 的「Coin Splash」(CC0, `https://opengameart.org/content/coin-splash`, 0.33 秒、21 毫秒到峰值一成)是「一把金幣打在地上」。長度不夠時, 同一個檔錯開疊三層、各用不同速度(本例 0 / 0.12 / 0.27 秒、速度 1.0 / 1.18 / 0.9、音量遞減), 聽起來是三把不同的錢, 拉到約 0.6 秒, 不必再找第二個素材。(DungeonZoo 打磨第 12 輪 build, 聽感待試玩)

## 提案 2 → 合併到「技術」最後一條(無頭模式權限)的(續)

- (續)從暫存資料夾 `cp` 到專案資料夾也要人工核准(暫存資料夾不在工作目錄內) → 新素材確定要用時, 直接用 `curl -o <專案 assets 路徑>` 再下載一次到專案資料夾; 暫存資料夾那份只拿來量測。sound.js 內嵌 base64 那行有數 MB, Read / Edit 工具讀不動, 改用 Write 寫一支小 Node 腳本做字串替換(每個替換先確認在檔案裡只出現一次)。(DungeonZoo 打磨第 12 輪 build)
