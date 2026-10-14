## 提案(來自 DungeonZoo polish 音效 build)

- 放進分類: **技術**(新條目)
- `辨識` **本機沒有 ffmpeg, Python 與 npm 又被權限擋住, 背景音樂超過 3 MB、Kenney ogg 也無法解碼量測** → 只有 Node 可用, 而 incompetech 的曲子是 320 kbps(約 40 KB/秒) → mp3 不重新編碼也能截短: 跳過 ID3 標籤, 逐一解析 MPEG-1 Layer III 音框標頭(長度 = 144 × 位元率 / 取樣率 + 補位), 取前 N 個音框直接串接, 3 MB 約可留 75 秒; 第一個音框若含 `Xing` / `Info` / `VBRI` 要丟掉, 否則瀏覽器會照原曲長度報 duration, 循環時間點全錯。ogg 不解碼也能量長度: 取樣率在 `vorbis` 識別標頭字串結束後第 6 個位元組起、4 位元組小端序(字串起點 + 11; 我第一次用 + 12 算出的長度差了幾百倍), 長度 = 最後一個 `OggS` 頁的 granule position / 取樣率(位置 + 6, 64 位元)。音量、音高量不到時, 優先挑 WAV 原檔的素材(OpenGameArt 上 artisticdude 的 CC0 包是 WAV), Node 可直接讀 PCM 量起音與峰值, 剪輯後以 PCM base64 內嵌。(DungeonZoo polish build, 截段的接縫效果待試玩)
