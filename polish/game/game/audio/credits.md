# 音效 / 音樂素材來源

授權統計: CC0 51 項(Kenney 45 檔 + OpenGameArt 6 段內嵌)、CC BY 4.0 5 項(背景音樂)。

## 遊戲畫面需要放的署名(CC BY 4.0)

背景音樂為 Kevin MacLeod 作品, 依授權須署名。建議放在總結算畫面或開始畫面角落(由製作人決定位置):

```
Music: "Waunobe March", "Monster Promenade", "Easy Lemon (60 second)", "Four Beers' Polka", "Happy Boy End Theme"
Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0
https://creativecommons.org/licenses/by/4.0/
```

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

全部出自 Kenney(https://kenney.nl), 頁面標示 CC0。檔案為原檔直接複製改名, 未剪輯; 音量、音高(播放速度)與截斷長度在 sound.js 裡調。sound.js 另以 base64 內嵌同一份 ogg 供 Web Audio 解碼。

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
| sfx_keg_fuse.ogg | keg_fuse | https://kenney.nl/assets/sci-fi-sounds (thrusterFire_000.ogg) | Kenney | CC0 | 檔案未剪; 播放時只放前 0.6 秒並淡出 |
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
| sfx_red_perform.ogg | red_perform | https://kenney.nl/assets/music-jingles (jingles_HIT00.ogg) | Kenney | CC0 | 無 |
| sfx_chain.ogg | chain | https://kenney.nl/assets/interface-sounds (pluck_002.ogg) | Kenney | CC0 | 無(播放時依段數升調) |
| sfx_cue_fire.ogg | cue_fire | https://kenney.nl/assets/interface-sounds (confirmation_001.ogg) | Kenney | CC0 | 無 |
| sfx_mark_add.ogg | mark_add | https://kenney.nl/assets/interface-sounds (bong_001.ogg) | Kenney | CC0 | 無(播放時依標記數升調) |
| sfx_loose.ogg | loose | https://kenney.nl/assets/impact-sounds (impactBell_heavy_001.ogg) | Kenney | CC0 | 無 |
| sfx_crowd_step_1.ogg | crowd_flee | https://kenney.nl/assets/impact-sounds (footstep_concrete_000.ogg) | Kenney | CC0 | 無 |
| sfx_crowd_step_2.ogg | crowd_flee | https://kenney.nl/assets/impact-sounds (footstep_concrete_002.ogg) | Kenney | CC0 | 無 |
| sfx_crowd_step_3.ogg | crowd_flee | https://kenney.nl/assets/impact-sounds (footstep_concrete_004.ogg) | Kenney | CC0 | 無 |
| sfx_coin_tally.ogg | coin_tally | https://kenney.nl/assets/casino-audio (chips-stack-5.ogg) | Kenney | CC0 | 無 |
| sfx_buy.ogg | buy | https://kenney.nl/assets/rpg-audio (handleCoins.ogg) | Kenney | CC0 | 無 |
| sfx_upgrade.ogg | upgrade | https://kenney.nl/assets/digital-audio (powerUp2.ogg) | Kenney | CC0 | 無 |
| sfx_unlock.ogg | unlock | https://kenney.nl/assets/music-jingles (jingles_STEEL04.ogg) | Kenney | CC0 | 無 |
| sfx_tutorial_done.ogg | tutorial_done | https://kenney.nl/assets/interface-sounds (maximize_001.ogg) | Kenney | CC0 | 無 |
| sfx_star.ogg | star | https://kenney.nl/assets/interface-sounds (glass_001.ogg) | Kenney | CC0 | 無(播放時依第幾顆升調) |

## 內嵌於 sound.js 的音效(無獨立檔, CC0)

原檔是 WAV, 本機沒有可用的 ogg / mp3 編碼器, 所以剪輯後轉成 16-bit 單聲道 22.05 kHz PCM, 以 base64 內嵌在 sound.js(沒有 Web Audio 時包成 WAV data URI 播放)。

| 內嵌鍵 | 事件 | 原始頁面(原檔名) | 作者 | 授權 | 剪輯 |
|---|---|---|---|---|---|
| attack_club | attack(weapon: club) | https://opengameart.org/content/swishes-sound-pack (swish-2.wav) | artisticdude | CC0 | 去頭尾靜音、混成單聲道、降取樣 22.05 kHz、峰值正規化 −1 dBFS |
| attack_sword | attack(weapon: sword) | https://opengameart.org/content/swishes-sound-pack (swish-13.wav) | artisticdude | CC0 | 同上 |
| attack_spear | attack(weapon: spear) | https://opengameart.org/content/swishes-sound-pack (swish-11.wav) | artisticdude | CC0 | 同上 |
| attack_whip | attack(weapon: whip) | https://opengameart.org/content/swishes-sound-pack (swish-10.wav) | artisticdude | CC0 | 同上 |
| skill | skill | https://opengameart.org/content/swishes-sound-pack (swish-7.wav) | artisticdude | CC0 | 同上 |
| show_end | show_end | https://opengameart.org/content/applause-in-a-large-hall-or-church (applause-clapping-church-crowd-immersive.wav) | eXpl0it3r | CC0 | 取全曲最響的 3 秒(4.6~7.6 秒), 淡入 0.03 秒、淡出 0.9 秒, 單聲道 22.05 kHz, 峰值正規化 −1 dBFS |

## 核對

assets/ 共 50 個檔 = 背景音樂 5 列 + 短音效 45 列; 另 6 段內嵌於 sound.js。沒有未登記的檔。
