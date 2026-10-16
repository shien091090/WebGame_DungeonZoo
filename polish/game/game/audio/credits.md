# 音效 / 音樂素材來源

授權統計: CC0 67 項(Kenney 52 檔 + OpenGameArt 5 檔 + OpenGameArt 10 段內嵌)、CC BY 4.0 7 項(背景音樂 5 檔 + 觀眾歡呼 2 檔)。另有 1 個程式產生的音效(heat_warn, 無外部素材, 不列)。

打磨第 6 輪異動: 無(素材全部沿用)。

打磨第 5 輪異動: 新增 9 個檔(Kenney 7 檔、OpenGameArt 2 檔)與 1 段內嵌(rope_throw), 給本輪新增的 6 個事件用; 既有檔案不動。

打磨第 4 輪異動: 新增內嵌段 clock_tick(bart 的 CC0 時鐘單拍)。keg_fuse 素材不變, 只把播放長度從 0.6 秒改成 0.95 秒。

打磨第 3 輪異動: 拿掉 sfx_upgrade.ogg(個別升級移除)與長鞭普攻的內嵌段 attack_whip(長鞭移除); 新增 sfx_crowd_cheer.mp3、sfx_crowd_frenzy.mp3、sfx_crowd_unrest.ogg 與內嵌段 exit_prompt、crowd_clap。

## 遊戲畫面需要放的署名(CC BY 4.0)

背景音樂(Kevin MacLeod)與觀眾歡呼聲(Gregor Quendel)依授權須署名。建議放在總結算畫面或開始畫面角落(由製作人決定位置):

```
Music: "Waunobe March", "Monster Promenade", "Easy Lemon (60 second)", "Four Beers' Polka", "Happy Boy End Theme"
Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0
https://creativecommons.org/licenses/by/4.0/

Crowd cheering: "Free Crowd Cheering Sounds" by Gregor Quendel (gregorquendel.com)
Licensed under CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/
```

## 觀眾歡呼聲(assets/, CC BY 4.0)

| 檔名 | 事件 | 原始頁面(原檔名) | 作者 | 授權 | 剪輯 |
|---|---|---|---|---|---|
| sfx_crowd_cheer.mp3 | crowd_cheer(循環) | https://opengameart.org/content/free-crowd-cheering-sounds (Gregor Quendel - Crowd Cheering Sounds - 03 - Strong cheering - I.mp3) | Gregor Quendel | CC BY 4.0 | 取 6.0~14.4 秒(8.4 秒), 依 mp3 音框邊界截斷、未重新編碼; 播放時去頭 0.15 秒、尾段 1.2 秒交叉淡化進開頭做成循環 |
| sfx_crowd_frenzy.mp3 | crowd_frenzy(循環, 主層) | https://opengameart.org/content/free-crowd-cheering-sounds (Gregor Quendel - Crowd Cheering Sounds - 01 - Strong cheering and strong rhythmic cheering.mp3) | Gregor Quendel | CC BY 4.0 | 同上(6.0~14.4 秒) |

## 背景音樂(assets/, CC BY 4.0)

| 檔名 | 事件 | 原始頁面 | 作者 | 授權 | 剪輯 |
|---|---|---|---|---|---|
| music_title.mp3 | 音樂 title | https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100016 ("Waunobe March") | Kevin MacLeod (incompetech.com) | CC BY 4.0 | 取開頭 70.6 秒(102 BPM × 30 小節), 依 mp3 音框邊界截斷、拿掉 ID3 標籤; 未重新編碼 |
| music_dungeon.mp3 | 音樂 dungeon | https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100478 ("Monster Promenade") | Kevin MacLeod (incompetech.com) | CC BY 4.0 | 取開頭 73.8 秒(117 BPM × 36 小節), 同上 |
| music_setup.mp3 | 音樂 setup | https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1200077 ("Easy Lemon (60 second)") | Kevin MacLeod (incompetech.com) | CC BY 4.0 | 全曲 62.5 秒, 只拿掉 ID3 標籤 |
| music_show.mp3 | 音樂 show | https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100225 ("Four Beers' Polka") | Kevin MacLeod (incompetech.com) | CC BY 4.0 | 取開頭 73.6 秒(124 BPM × 38 小節), 同上 |
| music_result.mp3 | 音樂 result | https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100648 ("Happy Boy End Theme") | Kevin MacLeod (incompetech.com) | CC BY 4.0 | 全曲 53.9 秒, 只拿掉 ID3 標籤 |

授權依據: https://incompetech.com/music/royalty-free/faq.html(Creative Commons: By Attribution 4.0)。

## 短音效(assets/, CC0)

除最後五列(OpenGameArt)外全部出自 Kenney(https://kenney.nl), 頁面標示 CC0。檔案為原檔直接複製改名, 未剪輯; 音量、音高(播放速度)與截斷長度在 sound.js 裡調。sound.js 另以 base64 內嵌同一份 ogg 供 Web Audio 解碼。

| 檔名 | 事件 | 原始頁面(原檔名) | 作者 | 授權 | 剪輯 |
|---|---|---|---|---|---|
| sfx_ui_move.ogg | ui_move | https://kenney.nl/assets/interface-sounds (tick_002.ogg) | Kenney | CC0 | 無 |
| sfx_ui_confirm.ogg | ui_confirm | https://kenney.nl/assets/interface-sounds (select_002.ogg) | Kenney | CC0 | 無 |
| sfx_ui_cancel.ogg | ui_cancel | https://kenney.nl/assets/interface-sounds (back_002.ogg) | Kenney | CC0 | 無 |
| sfx_ui_denied.ogg | ui_denied | https://kenney.nl/assets/interface-sounds (error_004.ogg) | Kenney | CC0 | 無 |
| sfx_title_start.ogg | title_start | https://kenney.nl/assets/music-jingles (jingles_PIZZI03.ogg) | Kenney | CC0 | 無 |
| sfx_calendar_flip.ogg | calendar_flip | https://kenney.nl/assets/rpg-audio (bookFlip2.ogg) | Kenney | CC0 | 無 |
| sfx_hit_monster.ogg | hit_monster | https://kenney.nl/assets/impact-sounds (impactPunch_medium_000.ogg) | Kenney | CC0 | 無 |
| sfx_monster_weak.ogg | monster_weak | https://kenney.nl/assets/interface-sounds (glass_002.ogg) | Kenney | CC0 | 無 |
| sfx_monster_cast.ogg | monster_cast | https://kenney.nl/assets/sci-fi-sounds (laserSmall_002.ogg) | Kenney | CC0 | 無 |
| sfx_player_hurt.ogg | player_hurt | https://kenney.nl/assets/impact-sounds (impactPunch_heavy_000.ogg) | Kenney | CC0 | 無 |
| sfx_player_hurt_tone.ogg | player_hurt(疊層) | https://kenney.nl/assets/digital-audio (lowDown.ogg) | Kenney | CC0 | 無 |
| sfx_capture_ready.ogg | capture_ready | https://kenney.nl/assets/rpg-audio (beltHandle1.ogg) | Kenney | CC0 | 無 |
| sfx_capture.ogg | capture | https://kenney.nl/assets/music-jingles (jingles_PIZZI10.ogg) | Kenney | CC0 | 無 |
| sfx_lasso_break.ogg | lasso_break | https://kenney.nl/assets/rpg-audio (chop.ogg) | Kenney | CC0 | 無(播放時速度 1.15) |
| sfx_kill.ogg | kill | https://kenney.nl/assets/rpg-audio (handleCoins2.ogg) | Kenney | CC0 | 無 |
| sfx_bush_hide.ogg | bush_hide | https://kenney.nl/assets/impact-sounds (footstep_grass_001.ogg) | Kenney | CC0 | 無 |
| sfx_fruit_drop.ogg | fruit_drop | https://kenney.nl/assets/impact-sounds (impactSoft_medium_001.ogg) | Kenney | CC0 | 無 |
| sfx_keg_fuse.ogg | keg_fuse | https://kenney.nl/assets/sci-fi-sounds (thrusterFire_000.ogg) | Kenney | CC0 | 檔案未剪(原長 5.0 秒); 播放時只放前 0.95 秒並淡出 |
| sfx_keg_blast.ogg | keg_blast | https://kenney.nl/assets/sci-fi-sounds (explosionCrunch_000.ogg) | Kenney | CC0 | 無 |
| sfx_boom_low.ogg | keg_blast、loose(低頻疊層) | https://kenney.nl/assets/sci-fi-sounds (lowFrequency_explosion_001.ogg) | Kenney | CC0 | 無 |
| sfx_wall_crack.ogg | wall_crack、wall_break(疊層) | https://kenney.nl/assets/impact-sounds (impactMining_000.ogg) | Kenney | CC0 | 無 |
| sfx_wall_break.ogg | wall_break | https://kenney.nl/assets/sci-fi-sounds (explosionCrunch_002.ogg) | Kenney | CC0 | 無 |
| sfx_teleport.ogg | teleport | https://kenney.nl/assets/digital-audio (phaseJump1.ogg) | Kenney | CC0 | 無 |
| sfx_heal.ogg | heal | https://kenney.nl/assets/music-jingles (jingles_STEEL09.ogg) | Kenney | CC0 | 無 |
| sfx_dungeon_end.ogg | dungeon_end(時間到 / 見習完成) | https://kenney.nl/assets/music-jingles (jingles_PIZZI04.ogg) | Kenney | CC0 | 無 |
| sfx_dungeon_end_down.ogg | dungeon_end(倒下) | https://kenney.nl/assets/digital-audio (zapThreeToneDown.ogg) | Kenney | CC0 | 無 |
| sfx_show_start.ogg | show_start | https://kenney.nl/assets/music-jingles (jingles_PIZZI07.ogg) | Kenney | CC0 | 無 |
| sfx_perform.ogg | perform | https://kenney.nl/assets/interface-sounds (pluck_001.ogg) | Kenney | CC0 | 無 |
| sfx_ignite.ogg | ignite | https://kenney.nl/assets/digital-audio (phaserUp2.ogg) | Kenney | CC0 | 無 |
| sfx_calm.ogg | calm | https://kenney.nl/assets/digital-audio (phaserDown2.ogg) | Kenney | CC0 | 無 |
| sfx_special.ogg | special | https://kenney.nl/assets/digital-audio (zapTwoTone.ogg) | Kenney | CC0 | 無 |
| sfx_angry_perform.ogg | angry_perform(原 red_perform, 打磨第 2 輪改名, 素材不變) | https://kenney.nl/assets/music-jingles (jingles_HIT00.ogg) | Kenney | CC0 | 無 |
| sfx_freeze_glass.ogg | freeze_all(開頭脆響疊層) | https://kenney.nl/assets/impact-sounds (impactGlass_heavy_001.ogg) | Kenney | CC0 | 無(播放時速度 1.1) |
| sfx_chain.ogg | chain | https://kenney.nl/assets/interface-sounds (pluck_002.ogg) | Kenney | CC0 | 無(播放時依段數升調) |
| sfx_cue_fire.ogg | cue_fire | https://kenney.nl/assets/interface-sounds (confirmation_001.ogg) | Kenney | CC0 | 無 |
| sfx_mark_add.ogg | mark_add | https://kenney.nl/assets/interface-sounds (bong_001.ogg) | Kenney | CC0 | 無(播放時依標記數升調) |
| sfx_loose.ogg | loose | https://kenney.nl/assets/impact-sounds (impactBell_heavy_001.ogg) | Kenney | CC0 | 無 |
| sfx_crowd_step_1.ogg | crowd_flee | https://kenney.nl/assets/impact-sounds (footstep_concrete_000.ogg) | Kenney | CC0 | 無 |
| sfx_crowd_step_2.ogg | crowd_flee | https://kenney.nl/assets/impact-sounds (footstep_concrete_002.ogg) | Kenney | CC0 | 無 |
| sfx_crowd_step_3.ogg | crowd_flee | https://kenney.nl/assets/impact-sounds (footstep_concrete_004.ogg) | Kenney | CC0 | 無 |
| sfx_coin_tally.ogg | coin_tally | https://kenney.nl/assets/casino-audio (chips-stack-5.ogg) | Kenney | CC0 | 無 |
| sfx_buy.ogg | buy | https://kenney.nl/assets/rpg-audio (handleCoins.ogg) | Kenney | CC0 | 無 |
| sfx_unlock.ogg | unlock | https://kenney.nl/assets/music-jingles (jingles_STEEL04.ogg) | Kenney | CC0 | 無 |
| sfx_tutorial_done.ogg | tutorial_done | https://kenney.nl/assets/interface-sounds (maximize_001.ogg) | Kenney | CC0 | 無 |
| sfx_star.ogg | star | https://kenney.nl/assets/interface-sounds (glass_001.ogg) | Kenney | CC0 | 無(播放時依第幾顆升調) |
| sfx_monster_windup.ogg | monster_windup | https://kenney.nl/assets/digital-audio (highUp.ogg) | Kenney | CC0 | 無(播放時跳過開頭 0.14 秒靜音、速度 1.2) |
| sfx_player_down_hit.ogg | player_down(重擊層) | https://kenney.nl/assets/impact-sounds (impactPunch_heavy_002.ogg) | Kenney | CC0 | 無 |
| sfx_player_down_fall.ogg | player_down(倒地層) | https://kenney.nl/assets/impact-sounds (impactSoft_heavy_003.ogg) | Kenney | CC0 | 無(播放時速度 0.85) |
| sfx_player_down_tone.ogg | player_down(遺憾撥弦層) | https://kenney.nl/assets/music-jingles (jingles_PIZZI05.ogg) | Kenney | CC0 | 無(播放時速度 0.89) |
| sfx_weapon_menu.ogg | weapon_menu | https://kenney.nl/assets/rpg-audio (cloth4.ogg) | Kenney | CC0 | 無(播放時跳過開頭 25 毫秒) |
| sfx_rope_escape_slap.ogg | rope_escape(輕拍層) | https://kenney.nl/assets/impact-sounds (impactGeneric_light_001.ogg) | Kenney | CC0 | 無 |
| sfx_fruit_eat_ding.ogg | fruit_eat(回復小叮層) | https://kenney.nl/assets/interface-sounds (glass_005.ogg) | Kenney | CC0 | 無(播放時速度 1.5 / 2.0 各一聲) |
| sfx_rope_escape_boing.mp3 | rope_escape(彈簧層) | https://opengameart.org/node/183321 「Silly Sound Effects」(blung_0.mp3) | EZduzziteh | CC0 | 無(播放時速度 1.1) |
| sfx_fruit_eat.ogg | fruit_eat(咬一口) | https://opengameart.org/content/7-eating-crunches (crunch_-_tito.zip 內的 crunch.4.ogg) | StarNinjas(作者說明由其弟 Tito 錄製) | CC0 | 無(播放時跳過開頭 0.118 秒靜音) |
| sfx_intermission.ogg | intermission | https://opengameart.org/content/classic-fanfare-lick (fanfare.ogg) | fvcalderan | CC0 | 無。作者在留言說明是自己用 GarageBand 內建樂器演奏, 非套用現成樂句 |
| sfx_cheer.ogg | cheer | https://opengameart.org/content/cheers-0 (cheers.ogg) | Nocturnal_Vanguard | CC0 | 無 |
| sfx_crowd_unrest.ogg | crowd_frenzy(循環, 騷動疊層) | https://opengameart.org/content/crowd-shoutingspeaking-ambience (crowd_shouting.ogg) | StarNinjas | CC0 | 只留開頭約 10.2 秒(依 Ogg 頁截斷、最後一頁標結尾並重算檢查碼, 未重新編碼); 播放時去頭 0.6 秒、尾段 1.5 秒交叉淡化進開頭做成循環。作者表示樂見署名但不強制 |

## 內嵌於 sound.js 的音效(無獨立檔, CC0)

原檔是 WAV, 本機沒有可用的 ogg / mp3 編碼器, 所以剪輯後轉成 16-bit 單聲道 22.05 kHz PCM, 以 base64 內嵌在 sound.js(沒有 Web Audio 時包成 WAV data URI 播放)。

| 內嵌鍵 | 事件 | 原始頁面(原檔名) | 作者 | 授權 | 剪輯 |
|---|---|---|---|---|---|
| attack_club | attack(weapon: club) | https://opengameart.org/content/swishes-sound-pack (swish-2.wav) | artisticdude | CC0 | 去頭尾靜音、混成單聲道、降取樣 22.05 kHz、峰值正規化 −1 dBFS |
| attack_sword | attack(weapon: sword) | https://opengameart.org/content/swishes-sound-pack (swish-13.wav) | artisticdude | CC0 | 同上 |
| attack_spear | attack(weapon: spear) | https://opengameart.org/content/swishes-sound-pack (swish-11.wav) | artisticdude | CC0 | 同上 |
| skill | skill | https://opengameart.org/content/swishes-sound-pack (swish-7.wav) | artisticdude | CC0 | 同上 |
| freeze_all | freeze_all | https://opengameart.org/content/freeze-spell-0 (freeze.wav) | artisticdude | CC0 | 去頭尾靜音(從 0.10 秒起)、混成單聲道、48 kHz 降為 24 kHz、尾端淡出 0.25 秒、峰值正規化 −1 dBFS; 播放時 1.6 秒收掉 |
| show_end | show_end | https://opengameart.org/content/applause-in-a-large-hall-or-church (applause-clapping-church-crowd-immersive.wav) | eXpl0it3r | CC0 | 取全曲最響的 3 秒(4.6~7.6 秒), 淡入 0.03 秒、淡出 0.9 秒, 單聲道 22.05 kHz, 峰值正規化 −1 dBFS |
| exit_prompt | exit_prompt | https://opengameart.org/content/doorbell (doorbell.wav) | frosty ham | CC0 | 混成單聲道、48 kHz 降為 22.05 kHz、剪掉尾端 −50 dB 以下、淡出 0.15 秒、峰值正規化 −1 dBFS(0.93 秒, C5 → A4 兩音) |
| crowd_clap | crowd_clap(循環) | https://opengameart.org/content/applause-in-a-large-hall-or-church (applause-clapping-church-crowd-immersive.wav) | eXpl0it3r | CC0 | 從掌聲漸弱的尾段(33.0~36.8 秒)切出 16 個單拍, 以 5 人各自節奏、拍一陣停一下的方式重新散佈成 6 秒首尾相接的循環(約每秒 10 拍), 單聲道 22.05 kHz, 峰值正規化 −3 dBFS |
| rope_throw | rope_throw | https://opengameart.org/content/swishes-sound-pack (swish-6.wav) | artisticdude | CC0 | 剪掉開頭 15 毫秒、混成單聲道、44.1 kHz 降為 22.05 kHz、尾端淡出 15 毫秒、峰值正規化 −1 dBFS(0.12 秒) |
| clock_tick | clock_tick | https://opengameart.org/content/ticking-clock (ticks.zip 內的 ticking clock - tick1.wav) | bart | CC0 | 剪掉開頭 32 毫秒靜音、取 0.135 秒、淡入 1 毫秒、淡出 20 毫秒, 混成單聲道 44.1 kHz 16-bit, 峰值正規化 −1 dBFS。作者表示樂見署名但不強制 |

## 核對

assets/ 共 64 個檔 = 背景音樂 5 列 + 觀眾歡呼 2 列 + 短音效 57 列; 另 10 段內嵌於 sound.js(heat_warn 為程式產生, 不在此表)。沒有未登記的檔。
