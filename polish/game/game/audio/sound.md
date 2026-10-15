# 音效說明(RD 只需讀這份)

## 聲音風格

輕快的卡通馬戲團: 撥弦(pizzicato)/ 鋼鼓短樂句當成就音, 木頭、布料、軟撞擊當動作音, 少量電子音只用在「魔法 / 怪事」(傳送、惹生氣、冷靜、特殊效果)。spec 指定音色的三個新事件例外: 見習過場用馬戲團小號、全場定格用冰裂聲、歡呼用人聲。

## 接法

- `index.html` 以 `<script src="audio/sound.js"></script>` 載入(放在 game.js 之前)。全域物件 `window.Sound`, 不是 module
- **開始畫面按 Z 的那一下**呼叫 `Sound.init()`(重複呼叫無害), 接著 `Sound.play('title_start')`
- init 之前的 `play` 一律靜默丟棄、不報錯; init 之前的 `playMusic` 會**記住最後一首**, init 時才開始播(所以開始畫面一出現就可以呼叫 `playMusic('title')`)
- 未知事件名、未知曲名: 靜默忽略
- `setMuted(bool)` 同時關音樂與音效; `isMuted()` 給「聲音 開 / 關」按鈕顯示用
- 事件名照 interface.json(底線小寫), 不是小駝峰; 這是 interface.json 已定死的名稱, 這裡沿用

## 事件表

相對音量 0~1(已寫在 sound.js 裡, RD 不用傳)。「間隔」= 同一事件在這段時間內重複呼叫只響一次, RD 可以放心每幀呼叫。全部不循環。

| 事件名 | spec 音效清單 | 何時呼叫 | opts | 素材 | 相對音量 | 間隔 |
|---|---|---|---|---|---|---|
| ui_move | ui_move | 任何選單游標移動(含場所卡、格子、列、分頁、面板行) | — | sfx_ui_move.ogg | 0.45 | 0.03 秒 |
| ui_confirm | ui_confirm | 選單按 Z 確定: 進入場所 / 地下城、上台、填格、見習過場按 Z 繼續、面板確定、下一步、開演前的確定、結算按 Z 繼續 | — | sfx_ui_confirm.ogg | 0.6 | 0.03 |
| ui_cancel | ui_cancel | 按 X 返回 / 關閉面板 / 清空格子 / 讓魔物下台; 按「返回上一步」「回選地點」 | — | sfx_ui_cancel.ogg | 0.5 | 0.03 |
| ui_denied | ui_denied | 金幣不夠、未開放的地下城、不能買、上台已滿 20、上台 0 隻按下一步、游標撞到鎖住的列(見習日第 3~6 列) | — | sfx_ui_denied.ogg | 0.55 | 0.08 |
| title_start | title_start | 開始畫面按 Z(緊接在 init 之後) | — | sfx_title_start.ogg | 0.7 | — |
| calendar_flip | calendar_flip | 日曆過場開始(翻頁動畫 0~0.6 秒那段的起點) | — | sfx_calendar_flip.ogg | 0.7 | 0.2 |
| intermission | intermission(新) | 見習過場畫面出現的那一刻(只呼叫一次; 按 Z 離開時不用呼叫, 照常播 ui_confirm) | — | sfx_intermission.ogg(小號 fanfare, 2.9 秒) | 0.7 | 0.5 |
| attack | attack | Z 普攻揮出的那一刻(不論有沒有打中) | `weapon`: `'club'`/`'sword'`/`'spear'`/`'whip'`, 省略當 club | 內嵌 PCM(四種武器各一個揮動聲) | 0.5~0.6 | 0.04 |
| skill | skill | X 武器技發動的那一刻 | `weapon`: 同上(影響音高) | 內嵌 PCM(較重的揮動聲, 放慢) | 0.8 | 0.08 |
| hit_monster | hit_monster | 馴獸師的普攻 / 武器技打中魔物(每次命中) | — | sfx_hit_monster.ogg | 0.6 | 0.04 |
| monster_weak | monster_weak | 魔物血量剛掉進殘血(每隻只在進入的那一刻一次) | — | sfx_monster_weak.ogg | 0.65 | 0.1 |
| monster_cast | monster_cast | 地下城魔物施放技能; 冰柱企鵝在預警開始時呼叫 | — | sfx_monster_cast.ogg | 0.4 | 0.08 |
| player_hurt | player_hurt | 馴獸師扣心(任何來源: 技能、傷害地形、爆炸) | — | sfx_player_hurt.ogg + sfx_player_hurt_tone.ogg 疊層 | 0.8 + 0.35 | 0.15 |
| capture_ready | capture_ready | 「準備捕捉」圓圈填滿、套上套索 | — | sfx_capture_ready.ogg | 0.8 | 0.1 |
| capture | capture | 繞圈完成、收服成功 | — | sfx_capture.ogg | 0.75 | 0.1 |
| lasso_break | lasso_break | 套索斷掉(timeout / distance / hit 都是) | — | sfx_lasso_break.ogg | 0.8 | 0.1 |
| kill | kill | 魔物被打倒(任何方式) | — | sfx_kill.ogg | 0.7 | 0.06 |
| bush_hide | bush_hide | 馴獸師進入草叢格(從非草叢走進草叢的那一刻) | — | sfx_bush_hide.ogg | 0.7 | 0.2 |
| fruit_drop | fruit_drop | 果子被打落 | — | sfx_fruit_drop.ogg | 0.8 | 0.1 |
| keg_fuse | keg_fuse | 爆炸桶被點燃、引信開始(聲音自己在 0.6 秒後收掉) | — | sfx_keg_fuse.ogg(只放前 0.6 秒) | 0.45 | 0.1 |
| keg_blast | keg_blast | 爆炸桶爆炸(含連鎖引爆的每一個) | — | sfx_keg_blast.ogg + sfx_boom_low.ogg 疊層 | 0.85 + 0.8 | 0.05 |
| wall_crack | wall_crack | 裂牆被打、裂痕 +1(第 1、2 下) | — | sfx_wall_crack.ogg | 0.7 | 0.06 |
| wall_break | wall_break | 裂牆第 3 下碎掉(只呼叫這個, 不要同時呼叫 wall_crack) | — | sfx_wall_break.ogg + sfx_wall_crack.ogg 疊層 | 0.6 + 0.5 | 0.1 |
| teleport | teleport | 傳送陣把馴獸師傳走的那一刻 | — | sfx_teleport.ogg | 0.55 | 0.1 |
| heal | heal | 回復泉補滿心 | — | sfx_heal.ogg | 0.6 | 0.2 |
| dungeon_end | dungeon_end | 地下城結束(時間到 / 倒下 / 見習完成), 進地下城結算的那一刻 | `reason`: `'time'`/`'down'`/`'tutorial'`; `down` 換成下降的遺憾音 | sfx_dungeon_end.ogg; reason down 用 sfx_dungeon_end_down.ogg | 0.7 / 0.5 | 0.3 |
| show_start | show_start | 開演(布置第 2 步按「開演」進表演場) | — | sfx_show_start.ogg | 0.75 | 0.3 |
| perform | perform | 表演場魔物放技能; 同一幀多隻只呼叫一次 | — | sfx_perform.ogg(每次音高微亂) | 0.22 | 0.07 |
| ignite | ignite | 點燃型技能打中別隻 | — | sfx_ignite.ogg(上揚) | 0.3 | 0.06 |
| calm | calm | 澆熄型技能打中別隻 | — | sfx_calm.ogg(下降) | 0.3 | 0.06 |
| special | special | 特殊效果打中(標靶 / 凍住 / 變走) | — | sfx_special.ogg | 0.35 | 0.08 |
| angry_perform | angry_perform(原 red_perform, 改名) | 魔物在生氣時表演(滿意度 ×2) | — | sfx_angry_perform.ogg(素材同上一版) | 0.45 | 0.1 |
| chain | chain | 連鎖段數 ≥ 2 的那次表演 | `chain`: 目前段數(整數 ≥ 2); 每升一段升兩個半音, 第 14 段起封頂 | sfx_chain.ogg | 0.45 | 0.04 |
| cue_fire | cue_fire | 暗號成立、節目發動(任何節目都呼叫, 含全場定格、歡呼) | — | sfx_cue_fire.ogg | 0.6 | 0.1 |
| freeze_all | freeze_all(新) | 節目「全場定格」發動, 與 cue_fire 同一幀呼叫 | — | sfx_freeze_glass.ogg(玻璃脆響, 立刻出聲)+ 內嵌 PCM 冰裂聲(1.6 秒內自己收掉) | 0.4 + 0.55 | 0.3 |
| cheer | cheer(新) | 節目「歡呼」發動, 與 cue_fire 同一幀呼叫; 歡呼中再發動照樣呼叫 | — | sfx_cheer.ogg(一群人「耶—」, 2 秒) | 0.6 | 0.3 |
| mark_add | mark_add | 某隻魔物失控標記 +1 | `marks`: 加完後的標記數 1~5; 越多越高、越大聲, 4 個以上連響兩下 | sfx_mark_add.ogg | 0.48~0.8 | 0.08 |
| loose | loose | 失控的那一刻(同一刻請 `stopMusic()`) | — | sfx_loose.ogg + sfx_boom_low.ogg 疊層 | 0.9 + 0.7 | 0.5 |
| crowd_flee | crowd_flee | 觀眾開始逃走(失控後, 可與 loose 同一刻) | — | sfx_crowd_step_1~3.ogg 錯開排成約 1.2 秒的一陣腳步 | 0.25~0.4 | 0.5 |
| show_end | show_end | 表演時間到、正常收場(失控收場不要呼叫) | — | 內嵌 PCM(掌聲 3 秒) | 0.6 | 0.5 |
| coin_tally | coin_tally | 結算畫面數字每跳一次(可每幀呼叫, 間隔會自動擋) | — | sfx_coin_tally.ogg | 0.4 | 0.06 |
| buy | buy | 商店購買 / 裝備成功 | — | sfx_buy.ogg | 0.7 | 0.1 |
| upgrade | upgrade | 個別魔物升級成功(布置第 1 步或商店) | — | sfx_upgrade.ogg | 0.55 | 0.1 |
| unlock | unlock | 「新地下城開放」提示冒出、暗號 / 節目上架提示冒出 | — | sfx_unlock.ogg | 0.65 | 0.3 |
| tutorial_done | tutorial_done | 教學階段完成(播完成特效的那一刻) | — | sfx_tutorial_done.ogg | 0.5 | 0.2 |
| star | star | 總結算每顆星亮起 | `index`: 第幾顆, 從 0 起算; 一顆比一顆高 | sfx_star.ogg | 0.7 | 0.05 |

## 背景音樂

`Sound.playMusic(曲名)`: 循環播放; 換到另一首時舊的淡出、新的淡入 0.5 秒; 呼叫正在播的同一首不會重頭。`Sound.stopMusic()`: 0.15 秒內停掉(給失控用)。

| 曲名 | spec 用在哪 | 何時呼叫 | 素材 | 長度 | 相對音量 |
|---|---|---|---|---|---|
| title | 開始畫面、日曆過場、今天去哪 | 進開始畫面、日曆過場、今天去哪、地下城選擇時 | music_title.mp3(Waunobe March 截段) | 70.6 秒 | 0.40 |
| dungeon | 地下城(含見習草地) | 進地下城地圖時 | music_dungeon.mp3(Monster Promenade 截段) | 73.8 秒 | 0.30 |
| setup | 見習過場、布置第 1、2 步、商店 | 進見習過場、布置第 1 步、商店時 | music_setup.mp3(Easy Lemon 60 秒版) | 62.5 秒 | 0.35 |
| show | 表演場 | 開演進表演場時; 失控那一刻呼叫 `stopMusic()` | music_show.mp3(Four Beers' Polka 截段) | 73.6 秒 | 0.30 |
| result | 地下城結算、表演結算、總結算 | 進任一結算畫面時 | music_result.mp3(Happy Boy End Theme) | 53.9 秒 | 0.40 |

- 循環方式: 曲尾最後 1 秒與曲頭交叉淡化接回, 不是無縫剪接; 聽得出一次「段落重來」屬正常
- 地下城選擇畫面 spec 沒列, 視同「今天去哪」的延伸, 播 title
- 背景音樂需要在遊戲畫面上署名(CC BY 4.0), 署名文字見 credits.md

## 同時觸發的處理

| 同一刻可能一起發生 | 處理 |
|---|---|
| 表演場 perform / ignite / calm / special / angry_perform / chain 大量重疊 | 各自有最短間隔與同時聲部上限(perform 4、chain 3、angry_perform 2), 不會疊成噪音牆。perform 音量最低, 讓 chain(依段數升調)與 red_perform 浮在上面 |
| loose 與上面那批 | loose 一響, 那批正在響的立刻 0.05 秒淡掉, 之後 1.5 秒內不再出聲; crowd_flee、mark_add、cue_fire、freeze_all、cheer 不受影響 |
| cue_fire + freeze_all / cheer | 同一幀一起呼叫(spec: cue_fire 照播再疊上)。cue_fire 是短促的確認音(0.3 秒), freeze_all 的玻璃脆響在高頻、冰裂聲墊在後面; cheer 是人聲, 跟 cue_fire 音色錯開, 都聽得到 |
| intermission + playMusic('setup') | 同一刻呼叫即可; 音樂淡入 0.5 秒, 小號先出頭 |
| loose + crowd_flee + stopMusic | 三個可以同一幀呼叫; 腳步聲自帶錯開, 不會跟鐘聲擠在同一點 |
| tutorial_done 撞上 capture / cue_fire / unlock / show_start / upgrade | 那幾個剛響過(0.2 秒內)時, tutorial_done 自動延後 0.5 秒, 讓主事件先講完(例: 教學「看暗號」以第一次節目發動為完成條件, cue_fire 先、tutorial_done 後) |
| hit_monster + kill + monster_weak | 都會響; kill 是錢幣聲、monster_weak 是高音叮, 跟打擊聲頻段錯開 |
| keg_blast + kill + player_hurt | 都會響; 爆炸桶連鎖時 keg_blast 同時最多 3 聲 |
| capture_ready 之後很快 capture | 不同素材, 都響 |
| coin_tally 每幀呼叫 | 間隔 0.06 秒自動擋, 大約每秒 16 下 |

## 理念或經驗落實

- 按鍵直接回饋的音(ui_move / ui_confirm / ui_cancel / attack / skill)要在 0.03 秒內出聲: 介面音選 Kenney 介面包裡最短的(0.02~0.07 秒); 揮動聲從 13 個候選量出「到峰值一成的時間」, 剪掉開頭靜音後普攻 0.002~0.005 秒、武器技 0.013 秒, 並以 PCM 內嵌、不經瀏覽器解碼器
- 背景音樂找現成整首截段、不自己合成, 每首循環 54~74 秒(約 27~38 小節), 避免「短循環聽到膩」
- incompetech 的 pieces.json 用來篩曲風、拍速與長度; 署名照 incompetech 授權頁格式抄進 credits.md, 並提醒製作人遊戲畫面要放署名
- 短音效以 base64 內嵌、頁面載入時用 OfflineAudioContext 先解碼, 第一次按鍵就有現成 buffer 可播
- 「刻意漸強的音要有立即出聲的層墊著」: freeze_all 的冰裂聲從開頭到峰值一成要 0.13 秒, 所以疊一層立刻出聲的玻璃脆響, 前面還有同一幀的 cue_fire
- 本機只有 Node 可用(Python 被權限擋): 新素材優先挑 WAV(冰裂聲)以便量起音與剪長度; ogg 素材(小號、歡呼)只能量長度, 起音與音量待試玩
- 沿用上一版所有素材與音量; 新增的三個事件挑「撥弦 / 鋼鼓 / 木頭」之外, 照 spec 指定的音色(小號、冰、人聲歡呼), 音量對齊同類事件(intermission 比照 title_start 0.7、cheer 比照 cue_fire 0.6)
