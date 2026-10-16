# 音效經驗提案(DungeonZoo 打磨第 8 輪 build)

## 提案 1 → 放進「素材來源」(新條目)

- `辨識` **爆竹、煙火、彩炮這類「劈啪 / 大砰」, OpenGameArt 用 firecracker、confetti 關鍵字一筆都找不到** → 站內搜尋只比對標題與標籤, 小眾詞多半沒人標 → 改搜近義的大類詞(fireworks、bang、horse 代替 hooves、rain), 一個 CC0 合集就能湊齊一整組: rubberduck 的「25 CC0 bang / firework SFX」(`https://opengameart.org/content/25-cc0-bang-firework-sfx`, 免登入)有短槍響(0.26~0.46 秒)、大砰(起音 3~12 毫秒)與尾段持續劈啪的煙火。鞭炮 = 短槍響加速 1.7~2.3 倍、間隔 0.05~0.09 秒連放五聲, 音量壓到比爆炸低約 15 dB; 彩炮 = 大砰 + 尾段有劈啪的那一段煙火當彩帶撒落。挑哪一段煙火用每 100 毫秒響度包絡看: 起爆後包絡維持在 −30 dB 上下約 1 秒的才是持續劈啪, 一路衰減的只是單響。(DungeonZoo 打磨第 8 輪 build, 聽感待試玩)

## 提案 2 → 放進「授權與下載」(新條目)

- `辨識` **素材包頁面標 CC BY, 但寫「混合授權, 見包內 credits.txt」** → 頁面授權欄只能標一種, 轉製者把 CC0 與 CC BY 的來源混成一包 → 解開後讀包內的署名檔, 逐檔看原始來源的授權, 優先挑標 CC0 的那個檔; 轉製本身仍是頁面作者做的, 保守起見照頁面的 CC BY 署名(寫轉製者 + 原錄音者與原始網址), 授權統計算進 CC BY。同理頁面同時列 CC BY 與 CC0 兩種的, 選 CC0 並在 credits 寫明「選 CC0」。(DungeonZoo 打磨第 8 輪 build: OpenGameArt congusbongus 的馬蹄合集、jwiese 的電流蓄能聲)
