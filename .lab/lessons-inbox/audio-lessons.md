# 音效經驗提案(DungeonZoo 打磨第 5 輪)

## 提案 1 — 放進「技術」, 建議合併到「本機沒有 ffmpeg, Python 與 npm 又被權限擋住…」那一條的(續)後面

- `辨識` **只有 Node 能用, ogg / mp3 素材無法解碼, 挑素材量不到響度、起音與音高, 只能優先挑 WAV** → Python、npm 指令、tar、cd 到暫存資料夾都被權限擋, 但 Node 內建的 `fetch` 可以直接打 npm registry → 用 Node 從 `https://registry.npmjs.org/<套件>/<版本>` 讀 `dist.tarball`, `zlib.gunzipSync` 後自己解 tar(每塊 512 位元組標頭, 檔名在 0~100、大小在 124~136 為八進位, 約 20 行), 解進 `os.tmpdir()` 下的 `node_modules`。純 WASM 解碼器不需編譯: ogg 用 `@wasm-audio-decoders/ogg-vorbis`(相依 `@wasm-audio-decoders/common`、`codec-parser`、`@eshaz/web-worker`、`simple-yenc`), mp3 用 `mpg123-decoder`; 套件是 ES module, 量測腳本寫成 `.mjs`, 用 `pathToFileURL(絕對路徑)` 動態 import, 量測腳本與下載的素材放不同資料夾。拿既有素材驗算: 長度、到峰值一成的時間跟過去用 WAV 量的一致。有了它就能對 Kenney 這類 ogg 素材量「最響 50 毫秒響度」換算相對音量(例: 前搖預告素材比既有技能音響 11 dB, 要求「比它輕」就把音量設 0.07, 而不是憑感覺), 也能用每 80 毫秒的音高走向從 80 幾個樂句裡篩出「下降兩音」當遺憾音。(DungeonZoo 打磨第 5 輪 build, 實際聽感待試玩)

## 提案 2 — 放進「技術」, 建議接在「即時回饋音聽起來延遲」那一條之後

- `辨識` **素材開頭有 0.03~0.15 秒的靜音或細碎前奏, 但本機無法重新編碼 ogg / mp3 來剪頭** → 不改原檔: 事件表的每一層加一個「起播位置」, Web Audio 用 `source.start(時間, 起播秒數)`, 退回 HTMLAudio 時設 `currentTime = 起播秒數`; 起播位置用 5 毫秒包絡量出來(取聲音開始爬升前一格)。本例按鍵回饋的布料聲原本 31 毫秒才到峰值一成, 跳過 25 毫秒後在範圍內; 其他開頭有 0.12~0.14 秒靜音的素材也照此處理, credits 的剪輯欄寫「無(播放時跳過開頭 N 秒)」, 原檔與授權紀錄保持一致。(DungeonZoo 打磨第 5 輪 build)
