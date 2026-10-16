# 音效說明(RD 只需讀這份)

## 聲音風格

輕快的卡通馬戲團: 撥弦(pizzicato)/ 鋼鼓短樂句當成就音, 木頭、布料、軟撞擊當動作音, 少量電子音只用在「魔法 / 怪事」(傳送、惹生氣、冷靜、特殊效果)與「警示」(heat_warn)。spec 指定音色的事件例外: 見習過場用馬戲團小號、全場定格用冰裂聲、歡呼與觀眾聲用真人群眾錄音、出口用門鈴「叮咚」。

## 接法

- `index.html` 以 `<script src="audio/sound.js"></script>` 載入(放在 game.js 之前)。全域物件 `window.Sound`, 不是 module
- **開始畫面按 Z 的那一下**呼叫 `Sound.init()`(重複呼叫無害), 接著 `Sound.play('title_start')`
- init 之前的 `play` 一律靜默丟棄、不報錯; init 之前的 `playMusic` / `setCrowd` 會**記住最後一個**, init 時才開始播(所以開始畫面一出現就可以呼叫 `playMusic('title')`)
- 未知事件名、未知曲名、未知熱度段: 靜默忽略(未知熱度段視同安靜)
- `setMuted(bool)` 同時關音樂、音效與觀眾聲; `isMuted()` 給「聲音 開 / 關」按鈕顯示用
- 事件名照 interface.json(底線小寫), 不是小駝峰; 這是 interface.json 已定死的名稱, 這裡沿用

### 契約外的兩個介面(打磨第 3 輪新增, 沿用不變)

| 介面 | 用途 | 何時呼叫 |
|---|---|---|
| `Sound.setCrowd(tier)` | 表演場的循環觀眾聲。`tier`: `'quiet'` / `'clap'` / `'cheer'` / `'frenzy'`(直接傳 spec 的熱度段名; `''` 或 `'quiet'` = 沒有觀眾聲) | 開演時依開演熱度段呼叫一次, 之後熱度**換段**時呼叫(每幀呼叫同一段也無害, 不會重頭)。換段自動 0.4 秒交叉淡入淡出; 傳 `''` / `'quiet'` 時 0.3 秒淡出 |
| `Sound.setMusicDuck(bool)` | 出口詢問框、換武器視窗開著時背景音樂壓到一半 | 詢問框 / 視窗跳出時 `true`、關掉時 `false`。**不接也可以**: `play('exit_prompt')`、`play('weapon_menu')` 會自動壓低, `ui_confirm` / `ui_cancel` / `dungeon_end` 會自動恢復; 換曲也會恢復 |

- **倒下自動停音樂**(打磨第 5 輪): `play('player_down')` 會順手做一次 `stopMusic()`(0.15 秒淡出), 讓倒下聲單獨響完。RD 照 spec 自己再呼叫 `stopMusic()` 也無害; 結算畫面照常 `playMusic('result')`

- interface.json 的 `crowd_clap` / `crowd_cheer` / `crowd_frenzy` 也可以用 `play('crowd_clap')` 呼叫, 效果等同 `setCrowd('clap')`(不是一次性音效, 會一直循環到換段或停掉)
- 觀眾聲**自動收掉**的時機(RD 不呼叫也會停): `play('loose')`、`play('show_end')`、`stopMusic()`、`playMusic(表演以外的曲子)`。所以失控、時間到收場、離開表演場都不用另外 `setCrowd('')`; 要明確寫也無害

## 事件表

相對音量 0~1(已寫在 sound.js 裡, RD 不用傳)。「間隔」= 同一事件在這段時間內重複呼叫只響一次, RD 可以放心每幀呼叫。除觀眾聲三個外全部不循環。

| 事件名 | spec 音效清單 | 何時呼叫 | opts | 素材 | 相對音量 | 間隔 |
|---|---|---|---|---|---|---|
| ui_move | ui_move | 任何選單游標移動(含場所卡、格子、列、分頁、面板行、出口詢問框換選項、**換武器視窗換選項**) | — | sfx_ui_move.ogg | 0.45 | 0.03 秒 |
| ui_confirm | ui_confirm | 選單按 Z 確定: 進入場所 / 地下城、上台、填格、見習過場按 Z 繼續、面板確定、下一步、開演前的確定、結算按 Z 繼續、出口選「離開」 | — | sfx_ui_confirm.ogg | 0.6 | 0.03 |
| ui_cancel | ui_cancel | 按 X 返回 / 關閉面板 / 清空格子 / 讓魔物下台; 按「返回上一步」「回選地點」; **出口選「留下」(Z 或 X)** | — | sfx_ui_cancel.ogg | 0.5 | 0.03 |
| ui_denied | ui_denied | 金幣不夠、未開放的地下城、不能買、上台已滿 20、上台 0 隻按下一步、游標撞到鎖住的列(見習日第 3、4 列)、見習表演上台數不對、**繩子用完還在換武器視窗選捕捉繩** | — | sfx_ui_denied.ogg | 0.55 | 0.08 |
| title_start | title_start | 開始畫面按 Z(緊接在 init 之後) | — | sfx_title_start.ogg | 0.7 | — |
| calendar_flip | calendar_flip | 日曆過場開始(翻頁動畫 0~0.6 秒那段的起點) | — | sfx_calendar_flip.ogg | 0.7 | 0.2 |
| intermission | intermission | 見習過場畫面出現的那一刻(只呼叫一次; 按 Z 離開時不用呼叫, 照常播 ui_confirm) | — | sfx_intermission.ogg(小號 fanfare, 2.9 秒) | 0.7 | 0.5 |
| attack | attack | Z 普攻揮出的那一刻(不論有沒有打中) | `weapon`: `'club'`/`'sword'`/`'spear'`, 省略或其他值當 club | 內嵌 PCM(三種武器各一個揮動聲) | 0.5~0.6 | 0.04 |
| skill | skill | X 武器技發動的那一刻 | `weapon`: 同上(影響音高) | 內嵌 PCM(較重的揮動聲, 放慢) | 0.8 | 0.08 |
| hit_monster | hit_monster | 馴獸師的普攻 / 武器技打中魔物(每次命中) | — | sfx_hit_monster.ogg | 0.6 | 0.04 |
| monster_weak | monster_weak | 魔物血量剛掉進殘血(每隻只在進入的那一刻一次) | — | sfx_monster_weak.ogg | 0.65 | 0.1 |
| monster_windup | monster_windup(本輪新增) | 地下城魔物**開始前搖**的那一刻; 冰柱企鵝在預警開始時呼叫(本輪 spec 把企鵝從 monster_cast 移到這裡)。同一幀多隻只呼叫一次即可(呼叫多次也只會響一聲) | — | sfx_monster_windup.ogg(短促上揚的「咻↑」, 剪掉開頭 0.14 秒靜音、加速 1.2 倍, 約 0.33 秒) | 0.07(素材本身很響; 量得實際響度約比 monster_cast 低 3~4 dB) | 0.1 |
| monster_cast | monster_cast | 地下城魔物放出技能: **前搖結束**、技能真正打出去的那一刻 | — | sfx_monster_cast.ogg | 0.4 | 0.08 |
| player_hurt | player_hurt | 馴獸師扣心(任何來源: 技能、傷害地形、爆炸)。最後一顆心被扣掉時照常呼叫, 再接 player_down | — | sfx_player_hurt.ogg + sfx_player_hurt_tone.ogg 疊層 | 0.9 + 0.5 | 0.15 |
| player_down | player_down(本輪新增) | 心歸零、倒下動畫開始的那一刻(一次)。會自動停掉背景音樂(見上方) | — | sfx_player_down_hit.ogg(重擊)→ 0.15 秒後 sfx_player_down_fall.ogg(倒地悶響, 放慢)→ 0.35 秒後 sfx_player_down_tone.ogg(下降的撥弦兩音, 遺憾); 全長約 0.95 秒。0.2 秒內剛響過 player_hurt 時自動省掉重擊層 | 0.9 + 0.85 + 0.6 | 0.5 |
| weapon_menu | weapon_menu(本輪新增) | 按 C 打開換武器視窗的那一刻。視窗裡左右換選項播 ui_move; 按 Z 換上播 ui_confirm; 按 X 取消 / 關閉播 ui_cancel。會自動把背景音樂壓到一半, ui_confirm / ui_cancel 自動恢復 | — | sfx_weapon_menu.ogg(布料「唰」, 剪掉開頭 25 毫秒) | 2.5(素材很小聲, 增益拉高; 實際響度與 ui_confirm 相近) | 0.15 |
| rope_throw | rope_throw(本輪新增) | 丟出捕捉繩的那一刻(按鍵當下) | — | 內嵌 PCM(輕的揮動聲, 0.12 秒, 11 毫秒到峰值一成); 播放時加速 1.1~1.2 倍, 比普攻輕快 | 0.45 | 0.06 |
| rope_escape | rope_escape(本輪新增) | 繩子打中**沒虛弱**的魔物、被掙脫彈開的那一刻 | — | sfx_rope_escape_slap.ogg(輕拍「啪」)+ sfx_rope_escape_boing.mp3(卡通彈簧「啵嚶」) | 0.4 + 1.0 | 0.1 |
| capture_ready | capture_ready(本輪改用途) | 繩子**套上虛弱的魔物**、繩子收緊的那一刻 | — | sfx_capture_ready.ogg(皮帶扣「喀啦」, 沿用) | 0.8 | 0.1 |
| capture | capture | 繞圈完成、收服成功 | — | sfx_capture.ogg | 0.75 | 0.1 |
| lasso_break | lasso_break | 套索斷掉(timeout / distance / hit 都是) | — | sfx_lasso_break.ogg | 0.8 | 0.1 |
| kill | kill | 魔物被打倒(任何方式) | — | sfx_kill.ogg | 0.7 | 0.06 |
| bush_hide | bush_hide | 馴獸師進入草叢格(從非草叢走進草叢的那一刻) | — | sfx_bush_hide.ogg | 0.7 | 0.2 |
| fruit_drop | fruit_drop | 果子被打落(本輪果子不再吸引魔物; 聲音不變) | — | sfx_fruit_drop.ogg | 0.8 | 0.1 |
| fruit_eat | fruit_eat(本輪新增) | 馴獸師吃到果子、回 1 心的那一刻 | — | sfx_fruit_eat.ogg(咬一口的脆響, 剪掉開頭 0.118 秒靜音)+ sfx_fruit_eat_ding.ogg 兩聲上揚的小「叮」(0.12 / 0.21 秒) | 0.8 + 0.22 × 2 | 0.15 |
| keg_fuse | keg_fuse | 爆炸桶被點燃、引信開始(聲音自己在 0.95 秒收掉, 趕在 1.0 秒爆炸前結束; 本輪由 0.6 拉長) | — | sfx_keg_fuse.ogg(只放前 0.95 秒, 最後 0.06 秒淡出) | 0.45 | 0.1 |
| keg_blast | keg_blast | 爆炸桶爆炸(含連鎖引爆的每一個) | — | sfx_keg_blast.ogg + sfx_boom_low.ogg 疊層 | 0.85 + 0.8 | 0.05 |
| wall_crack | wall_crack | 裂牆被打、裂痕 +1(第 1、2 下) | — | sfx_wall_crack.ogg | 0.7 | 0.06 |
| wall_break | wall_break | 裂牆第 3 下碎掉(只呼叫這個, 不要同時呼叫 wall_crack) | — | sfx_wall_break.ogg + sfx_wall_crack.ogg 疊層 | 0.6 + 0.5 | 0.1 |
| teleport | teleport | 傳送陣把馴獸師傳走的那一刻 | — | sfx_teleport.ogg | 0.55 | 0.1 |
| heal | heal | 回復泉補滿心 | — | sfx_heal.ogg | 0.6 | 0.2 |
| exit_prompt | exit_prompt(新) | 碰到出口、詢問框跳出的那一刻(只呼叫一次; 選項移動播 ui_move, 選完播 ui_confirm / ui_cancel)。會自動把背景音樂壓到一半 | — | 內嵌 PCM(門鈴「叮咚」C5 → A4, 0.93 秒) | 0.5 | 0.5 |
| dungeon_end | dungeon_end | 地下城結束(時間到 / 倒下 / 提早收工 / 見習完成), 進地下城結算的那一刻。**倒下時改在結算畫面出現時才呼叫**(倒下那一刻已播 player_down, spec) | `reason`: `'time'`/`'down'`/`'exit'`/`'tutorial'`; `down` 換成下降的遺憾音, `exit` 同 time | sfx_dungeon_end.ogg; reason down 用 sfx_dungeon_end_down.ogg | 0.7 / 0.5 | 0.3 |
| show_start | show_start | 開演(布置第 2 步按「開演」進表演場) | — | sfx_show_start.ogg | 0.75 | 0.3 |
| perform | perform | 表演場魔物放技能; 同一幀多隻只呼叫一次 | — | sfx_perform.ogg(每次音高微亂) | 0.22 | 0.07 |
| ignite | ignite | 惹生氣型技能打中別隻 | — | sfx_ignite.ogg(上揚) | 0.3 | 0.06 |
| calm | calm | 冷靜型技能打中別隻 | — | sfx_calm.ogg(下降) | 0.3 | 0.06 |
| special | special | 特殊效果打中(標靶 / 凍住 / 變走) | — | sfx_special.ogg | 0.35 | 0.08 |
| angry_perform | angry_perform | 魔物在生氣時表演(滿意度 ×2) | — | sfx_angry_perform.ogg | 0.45 | 0.1 |
| chain | chain | 連鎖段數 ≥ 2 的那次表演 | `chain`: 目前段數(整數 ≥ 2); 每升一段升兩個半音, 第 14 段起封頂 | sfx_chain.ogg | 0.45 | 0.04 |
| cue_fire | cue_fire | 暗號成立、節目發動(任何節目都呼叫, 含全場定格、歡呼) | — | sfx_cue_fire.ogg | 0.6 | 0.1 |
| freeze_all | freeze_all | 節目「全場定格」發動, 與 cue_fire 同一幀呼叫 | — | sfx_freeze_glass.ogg(玻璃脆響, 立刻出聲)+ 內嵌 PCM 冰裂聲(1.6 秒內自己收掉) | 0.4 + 0.55 | 0.3 |
| cheer | cheer | 節目「歡呼」發動, 與 cue_fire 同一幀呼叫; 歡呼中再發動照樣呼叫 | — | sfx_cheer.ogg(一群人「耶—」, 2 秒) | 0.6 | 0.3 |
| crowd_clap | crowd_clap(新, 循環) | 熱度在掌聲段(≥ 50%)。用 `setCrowd('clap')`(或 `play('crowd_clap')`) | — | 內嵌 PCM(稀疏掌聲, 6 秒無縫循環, 約每秒 10 拍) | 0.35 | — |
| crowd_cheer | crowd_cheer(新, 循環) | 熱度在歡呼段(≥ 75%)。用 `setCrowd('cheer')` | — | sfx_crowd_cheer.mp3(全場歡呼, 執行時做成約 7 秒循環) | 0.16 | — |
| crowd_frenzy | crowd_frenzy(新, 循環) | 熱度在沸騰段(≥ 90%)。用 `setCrowd('frenzy')` | — | sfx_crowd_frenzy.mp3(更猛的歡呼 + 齊聲吶喊)+ sfx_crowd_unrest.ogg(群眾叫嚷騷動)疊層 | 0.2 + 0.12 | — |
| heat_warn | heat_warn(新) | 熱度**剛進**沸騰段的那一刻(一次; 同一幀照常 `setCrowd('frenzy')`) | — | 內嵌 PCM, **程式產生**(880 / 660 Hz 高低交替兩次的短警報, 0.56 秒) | 0.26 | 1.0 |
| mark_add | mark_add | 某隻魔物失控標記 +1 | `marks`: 加完後的標記數 1~5; 越多越高、越大聲, 4 個以上連響兩下 | sfx_mark_add.ogg | 0.48~0.8 | 0.08 |
| loose | loose | 失控的那一刻(同一刻請 `stopMusic()`; 觀眾聲自動 0.3 秒淡出) | — | sfx_loose.ogg + sfx_boom_low.ogg 疊層 | 0.9 + 0.7 | 0.5 |
| crowd_flee | crowd_flee | 觀眾開始逃走(失控後, 可與 loose 同一刻) | — | sfx_crowd_step_1~3.ogg 錯開排成約 1.2 秒的一陣腳步 | 0.25~0.4 | 0.5 |
| clock_tick | clock_tick(本輪新增) | 表演時鐘最後 5 秒, 每跨過一個整數秒呼叫一次(剩 5、4、3、2、1 秒各一聲; 跟時鐘「彈一下」同一幀)。失控後時鐘停住, 不要再呼叫 | — | 內嵌 PCM(真實時鐘的「喀」, 0.135 秒, 2 毫秒內出聲) | 0.4 | 0.3 |
| show_end | show_end | 表演時間到、正常收場(失控收場不要呼叫; 觀眾聲自動 0.3 秒淡出) | — | 內嵌 PCM(掌聲 3 秒) | 0.6 | 0.5 |
| coin_tally | coin_tally | 結算畫面數字每跳一次(可每幀呼叫, 間隔會自動擋) | — | sfx_coin_tally.ogg | 0.4 | 0.06 |
| buy | buy | 商店購買 / 裝備成功 | — | sfx_buy.ogg | 0.7 | 0.1 |
| unlock | unlock | 「新地下城開放」提示冒出、暗號 / 節目上架提示冒出 | — | sfx_unlock.ogg | 0.65 | 0.3 |
| tutorial_done | tutorial_done | 教學階段完成(播完成特效的那一刻) | — | sfx_tutorial_done.ogg | 0.5 | 0.2 |
| star | star | 總結算每顆星亮起 | `index`: 第幾顆, 從 0 起算; 一顆比一顆高 | sfx_star.ogg | 0.7 | 0.05 |

- 本輪拿掉 `upgrade`(個別升級移除); 呼叫了也只是靜默忽略
- heat_warn 為什麼程式產生: 找過 OpenGameArt 兩個 CC0 警報(Frenchyboy「Alarm」是 2 秒持續上掃的刺耳警報, 不夠短促; yd「Short alarm」是 ogg, 本機無法解碼量測長度以外的內容, 標籤寫自爆倒數, 調性太重), Kenney 數位音效包的候選同樣是 ogg 無法量。要求只是「短促、像警報、不刺耳、跟 mark_add 的鐘聲分得開」, 兩音交替的柔和方波最容易保證這幾點

## 背景音樂

`Sound.playMusic(曲名)`: 循環播放; 換到另一首時舊的淡出、新的淡入 0.5 秒; 呼叫正在播的同一首不會重頭。`Sound.stopMusic()`: 0.15 秒內停掉(給失控用)。

| 曲名 | spec 用在哪 | 何時呼叫 | 素材 | 長度 | 相對音量 |
|---|---|---|---|---|---|
| title | 開始畫面、日曆過場、今天去哪 | 進開始畫面、日曆過場、今天去哪、地下城選擇時 | music_title.mp3(Waunobe March 截段) | 70.6 秒 | 0.40 |
| dungeon | 地下城(含見習草地) | 進地下城地圖時; 出口詢問框、換武器視窗開著時自動壓到一半(見上方 setMusicDuck); 倒下時 play('player_down') 自動停掉 | music_dungeon.mp3(Monster Promenade 截段) | 73.8 秒 | 0.30(壓低時 0.15) |
| setup | 見習過場、布置第 1、2 步、商店 | 進見習過場、布置第 1 步、商店時 | music_setup.mp3(Easy Lemon 60 秒版) | 62.5 秒 | 0.35 |
| show | 表演場 | 開演進表演場時; 失控那一刻呼叫 `stopMusic()` | music_show.mp3(Four Beers' Polka 截段) | 73.6 秒 | 0.30 |
| result | 地下城結算、表演結算、總結算 | 進任一結算畫面時 | music_result.mp3(Happy Boy End Theme) | 53.9 秒 | 0.40 |

- 循環方式: 曲尾最後 1 秒與曲頭交叉淡化接回, 不是無縫剪接; 聽得出一次「段落重來」屬正常
- 地下城選擇畫面 spec 沒列, 視同「今天去哪」的延伸, 播 title
- 背景音樂與觀眾歡呼聲需要在遊戲畫面上署名(CC BY 4.0), 署名文字見 credits.md

## 同時觸發的處理

| 同一刻可能一起發生 | 處理 |
|---|---|
| 表演場 perform / ignite / calm / special / angry_perform / chain 大量重疊 | 各自有最短間隔與同時聲部上限(perform 4、chain 3、angry_perform 2), 不會疊成噪音牆。perform 音量最低, 讓 chain(依段數升調)與 angry_perform 浮在上面 |
| 觀眾聲(crowd_*)與上面那批表演音效 | 觀眾聲是底層: 音量壓在 0.12~0.35 且是連續的群眾聲, 表演音效是短促的撥弦 / 電子音, 頻段與質感錯開。同時最多一種觀眾聲, 換段 0.4 秒交叉淡化 |
| cheer(節目)+ crowd_cheer / crowd_frenzy(底層) | 兩者可以同時響(spec)。cheer 是一次性「耶—」浮在上面, 底層照常循環 |
| heat_warn + setCrowd('frenzy') + mark_add | 同一幀呼叫即可。heat_warn 是高低兩音的電子警報, mark_add 是鐘聲, 沸騰觀眾聲在底下; 三者音色不同。heat_warn 間隔 1 秒, 熱度在門檻上下抖動也不會連響 |
| loose 與上面那批 | loose 一響, 表演音效立刻 0.05 秒淡掉、之後 1.5 秒內不再出聲; 觀眾聲 0.3 秒淡出。crowd_flee、mark_add、cue_fire、freeze_all、cheer 不受影響 |
| clock_tick + 表演音效 + 觀眾聲 | 最後 5 秒滴答時表演音效照常響。滴答是 0.135 秒的木頭「喀」, 跟撥弦(perform / chain)、電子音(ignite / calm / special)、群眾聲的質感都不同, 音量 0.4 低於 chain、angry_perform 的主旋律感; 只在整數秒出現、間隔 1 秒, 規律性本身就是辨識點。不屬於表演低優先音, 不會被 loose 壓掉(失控後 RD 本來就不會再呼叫) |
| clock_tick(剩 1 秒)接 show_end | 最後一聲滴答 1 秒後時間到, show_end 的掌聲接上; 滴答 0.135 秒早已結束, 不重疊 |
| show_end + 觀眾聲 | 觀眾聲 0.3 秒淡出, show_end 的收場掌聲接上 |
| cue_fire + freeze_all / cheer | 同一幀一起呼叫(spec: cue_fire 照播再疊上)。cue_fire 是短促的確認音(0.3 秒), freeze_all 的玻璃脆響在高頻、冰裂聲墊在後面; cheer 是人聲, 跟 cue_fire 音色錯開, 都聽得到 |
| exit_prompt + 背景音樂 | 門鈴響的同時 dungeon 音樂 0.2 秒內降到一半, 門鈴浮在上面; 選完(ui_confirm / ui_cancel)恢復 |
| weapon_menu + 背景音樂 | 同上: 「唰」的同時音樂降到一半; 換上(ui_confirm)或取消(ui_cancel)恢復 |
| monster_windup + monster_cast(不同隻) | 兩個都會響。windup 是乾淨的上揚電子短音、cast 是雷射雜訊, 音色不同; windup 響度刻意低 3~4 dB, 同時聲部上限 2, 很多隻同時前搖也只是一兩聲 |
| player_hurt(最後一顆心)+ player_down 同一幀 | 兩個都照呼叫。player_down 偵測到 0.2 秒內剛響過 player_hurt, 自動省掉自己的重擊層, 只接倒地悶響與下降撥弦, 不會疊兩記拳擊聲 |
| player_down + 背景音樂 + keg_blast / kill | 背景音樂 0.15 秒淡出(自動); 同一刻的爆炸或擊倒照常響, 倒地悶響在 0.15 秒後、撥弦在 0.35 秒後, 錯開不擠在同一點 |
| rope_throw → rope_escape / capture_ready | 先後發生, 不重疊: 丟出是 0.12 秒的揮動聲, 打中後才是「啪 + 啵嚶」(還不行)或皮帶扣「喀啦」(套住了), 兩種結果音色截然不同 |
| fruit_eat + heal | 理論上不同時。fruit_eat 是咬一口 + 兩聲很小的叮, heal 是鋼鼓樂句, 一輕一重 |
| intermission + playMusic('setup') | 同一刻呼叫即可; 音樂淡入 0.5 秒, 小號先出頭 |
| loose + crowd_flee + stopMusic | 三個可以同一幀呼叫; 腳步聲自帶錯開, 不會跟鐘聲擠在同一點 |
| tutorial_done 撞上 capture / cue_fire / unlock / show_start | 那幾個剛響過(0.2 秒內)時, tutorial_done 自動延後 0.5 秒, 讓主事件先講完 |
| hit_monster + kill + monster_weak | 都會響; kill 是錢幣聲、monster_weak 是高音叮, 跟打擊聲頻段錯開 |
| keg_blast + kill + player_hurt | 都會響; 爆炸桶連鎖時 keg_blast 同時最多 3 聲 |
| capture_ready 之後很快 capture | 不同素材, 都響 |
| coin_tally 每幀呼叫 | 間隔 0.06 秒自動擋, 大約每秒 16 下 |

## 理念或經驗落實

- 按鍵直接回饋的音(ui_move / ui_confirm / ui_cancel / attack / skill)要在 0.03 秒內出聲: 沿用上一版(介面音選最短的、揮動聲剪掉開頭靜音後以 PCM 內嵌)。本輪新的 exit_prompt 雖不是按鍵回饋, 也量過: 門鈴 0.1 毫秒就到峰值一成, heat_warn 0.5 毫秒
- 背景音樂找現成整首截段、不自己合成, 每首循環 54~74 秒; 觀眾聲同理不用合成, 用真人群眾錄音, 循環長度 6~8 秒(群眾聲本身沒有旋律, 短循環較不易聽出重複), 並在每次換段時從隨機位置起播
- 授權: 觀眾歡呼為 CC BY 4.0, 署名照 incompetech 的格式寫進 credits.md, 並提醒製作人遊戲畫面要放署名
- 短音效以 base64 內嵌、頁面載入時用 OfflineAudioContext 先解碼, 第一次按鍵就有現成 buffer 可播; 觀眾聲的 mp3 / ogg 同樣內嵌, 解碼後在執行時把尾段交叉淡化進開頭做成無縫循環(本機沒有解碼器, 無法離線處理)
- 本機只有 Node 可用(Python、PowerShell、tar 都被權限擋): 照經驗優先挑 WAV(門鈴、掌聲)以便量起音、音高與長度; mp3 不重新編碼、依音框邊界截段, 並用音框側資訊的增益值粗估整首音量起伏, 挑平穩段落; ogg 依頁截短。mp3 / ogg 素材的實際響度量不到, 觀眾聲與表演音效的輕重比例待試玩確認
- 沿用上一版所有素材與音量; 只動了規格有改的: player_hurt 加重(spec 改成 3 顆心「要更有警覺感」)、拿掉 upgrade 與長鞭
- 打磨第 5 輪: 既有事件的素材與音量全部沿用(只有 ui_denied、ui_move、capture_ready、fruit_drop、dungeon_end 的呼叫時機照 spec 補註)。新增 6 個事件, 素材都從同一批來源找(Kenney 4 個素材包 + OpenGameArt 3 位作者), 維持「撥弦當情緒、布料木頭當動作、電子音只給警示」的分工: 前搖預告是警示 → 電子上揚音; 倒下的遺憾 → 跟 dungeon_end 同一套撥弦樂句; 換武器、丟繩是動作 → 布料與揮動聲(揮動聲跟普攻同一個素材包)
- 本輪終於能量 ogg / mp3: 在暫存資料夾用 Node 從 npm registry 抓純 WASM 的解碼器(不需 npm 指令), 每個候選都量了長度、峰值、最響 50 毫秒的響度、到峰值一成的時間與音高走向。按鍵直接回饋的兩個新音照「0.03 秒內出聲」: weapon_menu 原素材 31 毫秒才到峰值一成, 用播放起點剪掉開頭 25 毫秒; rope_throw 剪頭後內嵌 PCM, 11 毫秒。非按鍵回饋但開頭有靜音的(monster_windup 0.14 秒、fruit_eat 0.118 秒)也同樣從播放起點跳過, 原檔不改
- 相對音量用量出來的響度換算, 不是憑感覺: 例如 monster_windup 素材本身比 monster_cast 響 11 dB, spec 要它「比 cast 輕」, 所以音量設 0.07; weapon_menu 素材小聲 15 dB, 增益拉到 2.5 才跟 ui_confirm 相近。實際聽感仍待試玩
- 打磨第 4 輪: 其他事件的素材與音量全部沿用, 只做兩處。(1) 新增 clock_tick: 照「先挑 WAV」與「量出到峰值一成的時間」兩條挑素材, 比過 OpenGameArt 兩個 CC0 時鐘包, 選雜訊底 −61 dB、峰值前只有 5 毫秒起音的單拍; 剪掉開頭 32 毫秒靜音後內嵌, 2 毫秒內出聲, 跟時鐘彈跳同一幀。另一包是作者自稱爛麥克風錄的(雜訊底 −47 dB、峰值 −22 dB), 不用。(2) keg_fuse 跟著 spec 的引信 1.0 秒, 從播 0.6 秒改成 0.95 秒, 收尾淡出在爆炸前結束
