# NEON RUSH — Project Context

A 2D action platformer + space dogfighter built in vanilla HTML5 Canvas + JavaScript. Inspired by Mega Man, Dead Cells, Hades, **Transformers**, and modern PS-style action platformers. Heavy emphasis on cinematics, screen-juice (hitstop, shake, flashes, shockwaves), varied combat moves (dash, dodge roll, parry, ground pound, melee combo), and **vehicle transformation**.

---

## ⚡ MOST RECENT SESSION (May 25, 2026)

Freshest context — read this first if dropping into a new chat. Previous sessions preserved further down.

### What changed in this session (in order)

1. **CRYO-LORD attack expansion (Stage 5)** — humanoid form bumped from 3 → 5 distinct attacks per phase. New patterns: **ICE BEAM** (single big piercing slowing crystal shard from the scepter, telegraphed with shockwave + charge particles) and **ICICLE STORM** (6 spikes fall straight down from above the player's x range, slow on hit). Phase 2 versions are stronger: ICE BEAM TWIN (3 piercing shards in a tight bracketing fan, 9.5 speed) and ICICLE STORM WIDE (10 spikes, faster fall vy=8).

2. **World-themed enemy palette** — new `STAGE_ENEMY_THEMES` table (8 stages × 5 categories: ground / aerial / fortified / armored / mech) and `applyStageEnemyTheme(stageIdx)` post-process at the end of `buildLevel()`. Mob enemies (patrol/drone/turret/heavy/shielder/jumper/sniper/bomber/sprinter/ricochet/swarm/mech) get retinted to match each stage. Bosses, mini-bosses (HYDRA, WARDEN-K), and stage-locked elites (HYDRA-WALKER, SCORPION-BOT) keep their hand-tuned signature colors. Per-stage palettes documented in code comments.

3. **Death screen "FULL RESET" option + intro save status panel** —
   - Death screen: `Press R — RESTART (keeps your unlocks)` is the existing flow. New `Press Y — FULL RESET (wipe save & start fresh)` line uses native `confirm()` so a stray keypress can't nuke progress.
   - Intro screen: new `drawIntroSavePanel()` in the lower-left shows characters unlocked, weapons unlocked, farthest stage, and lifetime stats when save data exists; neutral "NO SAVED PROGRESS" state otherwise. `Press Y to WIPE SAVE` hint when there's a save to wipe.
   - New top-level helper `performFullSaveReset()` shared between both screens. Edge-triggered KeyY handler in `gameLoop` with `player.fullResetHeld` latch.

4. **INFERNO-X 5 fire powers (Stage 3)** — humanoid form had 3 distinct attacks (slot 0/1/2 shared the same triple shot). Restructured to 5 truly distinct patterns: AIMED TRIPLE / CIRCLE BURST / LAVA GLOBS / **FIRE WAVE** (5 fast burning shots in a horizontal wall) / **METEOR SHOWER** (4 lava meteors fall from above the player, gravity arc, leave puddles). Phase 2 stronger variants: 5 / 16 / 5 / 7 / 6 bullets respectively.

5. **PRIME / CONVOY balance — fewer bullets, gated by shot counter** — side-arms used to dump 6 (PRIME) / 8 (CONVOY) piercing bullets *per* weapon shot. Trivialized boss fights.
   - PRIME: 6 → **3** cannons (shoulders + chest), 70 → 80 dmg each. Fires every **2nd** weapon shot via `player.sideArmShotCounter % 2`.
   - CONVOY: 8 → **4** cannons (shoulders + twin chest), 95 → 110 dmg each. Fires every **3rd** weapon shot.
   - Reads as "powerful precise" instead of "wall of bullets". `EVOLUTIONS` upgrade strings updated.

6. **World-themed enemy bullets** — new `STAGE_ENEMY_BULLET_TINTS` table (8 stages × {fill, glow}). `drawBullets` respects `b.color` when bosses set it, else falls back to the stage tint. Mob bullets in each world feel themed (acid green in lab, ice blue in arctic, etc.) without touching the 100+ `enemyBullets.push` call sites. Verified: each stage produces correct hex via pixel-sample check.

7. **WARDEN-K theme per stage** — mini-boss spawned in 6 different worlds (stages 3-8) but always rendered red/pink. Now adopts each stage's palette via new `WARDEN_THEME_BY_STAGE` table with `{glow, accent, mid, dark, particle}` per stage. Spawn attaches `themeGlow/themeAccent/themeMid/themeDark/themeParticle` to the enemy object. AI bullets/particles/shockwaves and drawer torso gradient/eye/orbital orbs/ground spike warnings/phase 2 aura all read the theme. Heavy black outline strokes left as-is (shading, not signature color). Antechamber-entry gate color and `⚠ MINI-BOSS: WARDEN-K ⚠` banner also retint per stage.
   - Stage 3 REACTOR molten orange, 4 LAB acid green, 5 ARCTIC ice blue, 6 VOID violet, 7 CITADEL gold, 8 ORBITAL chrome cyan.

8. **GIANT-ROBOT FINALE — EARTHBREAKER** (the big one) — after Titan-Lord falls on stage 8, the player ascends to giant scale and fights EARTHBREAKER, a planet-sized mech, to save the world. Self-contained module (`finale = { ... }` global object) with own bullets/enemyBullets/particles/shockwaves arrays so it doesn't pollute normal-stage state.
   - **2 lives across 2 environments** (city → space, full HP refill on transition).
   - **Phase machine**: `intro` → `dialogue1` (3 lines: YOU vs EARTHBREAKER) → `battle` (city, life 1, 4500 HP) → `cityToSpace` cinematic (180-frame cascade: boss debris falls, player launches up, screen flashes, boss reforms in orbit) → `dialogue2` (2 lines, taunt) → `battle` (space, life 2, 4500 HP refill) → `victory`.
   - **City form**: boss patrols laterally; camera scrolls (`f.cameraX`) so it feels like traversal. 3-layer parallax skyline scrolls at 0.18/0.36/0.54 rates. Phase 2 trigger at 50% HP with 60-frame player i-frames.
   - **Space form**: floor-less arena, half gravity (player can hover and fight in mid-air). Boss orbits the arena center in a wide arc. Starfield + Earth orb backdrop with atmosphere glow gradient.
   - **Player upgrades** (finale-only): Dash (Shift, 12-frame burst with i-frames, 50f cooldown), Double Jump (2nd press in air gives ~10 vy), Special (Q, 5-stack piercing energy beam, 240f cooldown, 80 dmg/ray).
   - **Boss attacks**: 4 in life 1 (energy beam sweep, fist slam, missile barrage, plasma ring); life 2 has all 6 including phase-2 double-ring and a new **ORBITAL LASER SWEEP** (3-beam telegraphed sweep that the player can dash through).
   - **HUD upgrades**: life pips next to boss bar (◆◆ → ◇◆ after life 1 down), dash + special cooldown indicators bottom-left, life-2 banner color, updated controls hint mentioning dash + Q.
   - Trigger sites: `if (currentStage >= STAGES.length - 1 && !allyDef) { startFinale(); }` plus the cage-rescue `deferFrames(90, () => { startFinale(); })`. Restart handler clears `finale = null` so dying mid-finale routes through the normal death screen flow.

9. **Fairness fix for boss phase-2 transformation** — phase-2 entrance no longer flashes the screen / freezes time:
   - Removed `critFlash = 18` (gold overlay was blinding)
   - Removed `hitStop = 10` (freeze let phase-2 entrance bullets land before the player could react)
   - Added 60-frame `player.invincible` window so the immediate phase-2 cone attack can't clip you mid-transform
   - `screenShake = 28` retained for impact

10. **FLAME THROWER nerf** — damage 6 → 3 (-50%). Cooldown 3, spread 0.28 unchanged (same fire rate). Per-pellet damage was just too generous.

### Notable code pointers (current state)

- `finale` global + `startFinale()` / `updateFinale()` / `drawFinale()` — all in one block before `function gameLoop`. Phase dispatch in `updateFinale()`. Helpers: `updateFinaleIntro`, `updateFinaleDialogue`, `updateFinaleBattle`, `updateFinaleCityToSpace`, `updateFinaleVictory`, `finaleShoot`, `finaleSpecial`, `finaleBossAttack`, `drawFinalePlayer`, `drawFinaleBoss`, `drawFinaleCityBackdrop`, `drawFinaleSpaceBackdrop`, `drawFinaleDialogue`, `drawFinaleHUD`, `drawFinaleAbilityHUD`, `buildFinaleSkyline`, `spawnFinaleParticle`, `spawnFinaleShockwave`.
- `STAGE_ENEMY_THEMES`, `STAGE_ENEMY_BULLET_TINTS`, `WARDEN_THEME_BY_STAGE` — the three palette lookup tables.
- `applyStageEnemyTheme(stageIdx)` — runs at end of `buildLevel`.
- `getWardenTheme(stageIdx)` — used at warden spawn AND by the antechamber gate AND the mini-boss banner.
- `performFullSaveReset()` — top-level helper used by both death and intro screens.
- `player.sideArmShotCounter` — gates PRIME (every 2nd) / CONVOY (every 3rd) side-arms.
- INFERNO-X attack pool is now 5 patterns per phase in the humanoid form. CRYO-LORD same — 5 per phase.
- Finale gameLoop dispatch lives in the early-return block alongside `spaceTransition`. Renders fully separately from normal-stage drawing.

### Pending work (good prompts for the next session)

1. **Remaining boss transformations** — only GUARD-1 and TITAN-LORD have been fully wired. SKYHAMMER, RAVAGER, NULLIFIER, OMEGA-PRIME phase-2 transforms have draw scaffolds (`drawBossSkyhammerJet` etc.) but the AI override + origin slots aren't fully connected. INFERNO-X and CRYO-LORD got attack expansion this session but not transformation.
2. **SCREAMER and SENTINEL enemy AI** — drop tables already include them, AI/draw not implemented yet.
3. **More stages** — 1-2 new stages reusing existing bosses with new themes is doable in 1 turn.
4. **More obstacles in existing stages** — bump density in `addExtraHazards`, add CRUSHER vertical-platform hazard, conveyor belts, falling debris.
5. **PRIME unique vehicle form** — still inherits APEX's starfighter. CONVOY has its dedicated `hovertank` already.
6. **Frame-counted state transitions** — done. The two `setTimeout` cases were converted to `deferFrames` last session.
7. **Finale polish** — the giant sprite designs are functional but could be more menacing (more procedural detail, ember trails on boss, glowing veins). City could have falling rubble / fires on rooftops. Space form could add asteroid debris.
8. **Finale dialogue** — currently 3 + 2 lines. Could expand to per-character variants (different lines if you arrive as STRIKER vs OMEGA character) or add 1-2 mid-fight quips when the boss enters phase 2 / reaches life 2.

---

## Previous Session — May 24, 2026 (Evening)

This block was the freshest context for the prior session, preserved verbatim.

### Project on GitHub

- Pushed to `https://github.com/nicholasdada001-cpu/neon-rush` (new account, no Amazon identity)
- Branch: `main`. Commits use `nicholasdada001-cpu <nicholasdada001@gmail.com>` (local-only git config — global Amazon identity untouched)
- `credential.helper=""` is set locally so macOS Keychain doesn't auto-supply Amazon GitHub creds
- `.gitignore` excludes `_visual.png`, `_smoke.html`, `_visual.html`, `_bracecount.js`, OS junk, editor folders

### What changed in this session (in order)

1. **AUDIO SYSTEM** — pure Web Audio API, no asset files. Lives at the top of `game.js` (~`const audio = (() => { ... })()` around line 61):
   - Lazy `AudioContext` created on first user gesture (browser autoplay policy)
   - Master/music/SFX gain nodes; mute, music-volume, SFX-volume settable independently
   - 24 procedural SFX: `jump`, `doubleJump`, `wallJump`, `dash`, `roll`, `shoot`, `shootHeavy`, `shootBeam`, `rocket`, `melee`, `meleeHit`, `axeSwing`, `axeHit`, `hit`, `hurt`, `crit`, `explosion`, `bossKill`, `parry`, `pound`, `transform`, `evolve`, `coin`, `heal`, `death`, `win`, `bossIntro`, `keyPickup`, `ui`, `warpIn`. Each is `tone(freq, dur, opts)` + `noise(...)` calls.
   - Per-SFX throttle (default 30ms) so bullet sprays don't shriek
   - Procedural music tracks scheduled bar-by-bar: `menu`, `cyber`, `industrial`, `void`, `boss`, `final`, `victory`. `pickMusicTrack()` selects based on `gameState` and "is a boss alive" — auto-crossfades when the answer changes.
   - HTML control panel in `index.html` (bottom-left): mute button, MUSIC slider, SFX slider. **M key** also toggles mute.

2. **SAVE SYSTEM** — localStorage persistence at `~line 587` (`const save = (() => { ... })()`):
   - Storage key `neonRush.save.v1`, version-gated (mismatched version is ignored)
   - Persisted: unlocked characters, unlocked weapons, audio settings (muted/musicVol/sfxVol), meta stats (`totalCoins`, `totalScrap`, `totalRC`, `bossesDefeated`, `totalDeaths`, `totalWins`, `farthestStage`, `maxEvoLevel`)
   - Per-run state (HP, currencies, position, current stage) intentionally does NOT persist — every fresh run starts from zero with all unlocks intact
   - API: `save.load()`, `save.write()`, `save.reset()`, `save.markDirty()`, `save.bumpStat(k, n)`, `save.setStat(k, v)`, `save.getMeta()`, `save.isFlashing()`, `save.tickFlash()`
   - Auto-flush every 3s if dirty via `setInterval`. `save.load()` is called once at startup before `applyCharacter` / `buildLevel`.
   - "SAVED" HUD indicator pulses for 60 frames on each successful flush (`save.isFlashing()`)
   - Game-over screen now shows all-time meta stats (final score + lifetime coins/scrap/bosses)
   - Dev panel **⚠ RESET SAVE** button calls `save.reset()` and reloads the page

3. **🔩 SCRAP CURRENCY + ⚒ CRAFTING** — third currency axis next to coins and RC:
   - **Drops from breakables and every enemy.** Roughly: boss `40 + stage*4`, miniboss 22, hydraWalker/scorpion/mech `10 + floor(stage*1.5)`, heavy/sniper 6, sentinel 7, screamer 5, shielder/jumper 4, bomber/sprinter/turret/ricochet 3, patrol/drone/swarm 2, default 1. Spawned as orange `coinPickup`s with `scrap: true` flag.
   - **Three currencies** displayed in shop UI and HUD: `Coins`, `🔩 Scrap`, `◆ RC`
   - **Two scrap-trade items** in `SHOP_ITEMS`: `50 SCRAP → 80¢`, `25 SCRAP → 1 RC` (intentionally stingy — escape valves, not main income)
   - **Seven crafting recipes** (`craft: true` flag, mostly scrap-only with some hybrid coin cost):
     - `REPAIR KIT` (30 scrap) — full HP restore + 1s i-frames
     - `ARMOR PLATE` (60 scrap + 40c) — +30 max HP permanent
     - `AMMO OVERCHARGE` (80 scrap) — +4 bullet damage permanent
     - `SERVO BOOST` (100 scrap + 60c) — +0.3 movement speed
     - `KINETIC SHIELD` (90 scrap) — 4s invincibility consumable
     - `POWER CELL` (150 scrap + 80c) — +1 extra jump permanent
     - `ENERGON CORE` (200 scrap) — converts scrap to 5 RC (best rate)
   - Shop affordability check now validates all three currencies. Error message names which is short.

4. **⚕ HEALING STATIONS** (Step 2 of polish pass) — at `~line 4111`:
   - `HEAL_STATION_RECHARGE = 360` (6s), `HEAL_STATION_DURATION = 90` (1.5s heal animation)
   - `spawnHealingStation(x, groundY)` called from `extendStage`; **two per stage** (mid-stage at `~42% of maxX` and pre-boss next to the shop at `maxX + 140`)
   - E key triggers heal — but the shop wins if both are in range. Refuses to fire if already at full HP.
   - Heals player ~1.5% maxHp per frame for 90 frames (full heal). Allies within 180px get a one-shot 50% heal at `healTimer === 1`.
   - Particle stream from station to player during heal, finishing shockwave on completion. Recharge gauge visible on the pillar.

5. **WARDEN-K MINI-BOSS + ANTECHAMBER** (stages 3-8) — new structural layer between the level and the boss arena:
   - Stage flow becomes: `[LEVEL] → entry-gate → [WARDEN ANTECHAMBER ~880px] → exit-gate (requires warden dead) → [BOSS ARENA]`
   - Spawned in `spawnEliteEnemies` for `stage >= 2`. Warden sits at `bossTriggerX - 700`, in an 880px-wide arena between the entry gate (`triggerX - 940`) and the exit/boss gate (`triggerX - 60`).
   - **`spawnMinibossAntechamber(wardenX)`** at `~line 2398` creates the entry gate (red, `antechamberEntry: true`). The entry gate auto-opens on approach, then **closes behind the player** when they cross past it (locking them in with the warden). Plays `'⚠ MINI-BOSS: WARDEN-K ⚠'` banner.
   - The standard `spawnBossGate()` exit gate auto-detects the antechamber (`requiresWardenDead: !!antechamberState`) and refuses to open while any `subtype === 'warden'` enemy is alive.
   - **`updateMinibossWarden(e, playerAngle, slowMul)`** at `~line 18010` and **`drawMinibossWarden(ex, ey, e)`** at `~line 18167`:
     - HP `320 + stage * 60`, hovers + drifts in a sin-wave pattern
     - Smoothly tracks player with optic eye
     - Three rotating attack patterns (chosen by `bossPickRandomAttack(e, 3)`):
       - **TRIPLE BEAM VOLLEY** — 3 fanned piercing shots from the eye
       - **CLAW SPIKE** — drops a 70-frame-delay spike eruption under the player; on detonation, AOE damage + 5 upward shrapnel bullets + launches player up
       - **SENTRY OVERCHARGE** — every alive orbital orb pulses and fires almost immediately
     - **Orbital sentry orbs**: 4 in phase 1, +2 in phase 2 (`_phase2OrbsAdded` flag), each fires a tracking bullet on its own timer
     - Phase 2 at 50% HP: faster orb spin (0.026 → 0.038), faster shoot timers, +2 orbs, pink shockwave
     - Three segmented claw-legs (90° / 210° / 330° splay) with bobbing animation
     - Dispatched in `updateEnemies()` boss block via `else if (e.subtype === 'warden')`
   - `devSkipToBoss(stageIdx)` updated: stages 3+ now drop the player at `triggerX - 1000` (just before the antechamber entry gate) instead of `triggerX - 30` so the warden fight runs first.

6. **Dev panel rework** in `index.html`:
   - **EVOLVE button** changed back to **+1 tier per click** (it had jumped straight to CONVOY for height-bonus testing, but per-tier control is more useful day-to-day)
   - **Per-tier evo buttons row**: BASE / MK-II / MK-III / OMEGA / APEX / PRIME / CONVOY — each button instantly sets the player to that tier (or devolves first if needed). Skips RC checks. The BASE button manually undoes all bonuses (the only way to actually devolve).
   - **+100 🔩 SCRAP** utility button added
   - **⚠ RESET SAVE** button (red border) — confirms then calls `save.reset()` + `location.reload()`

7. **HUD additions**:
   - SCRAP counter shown in the upper-right (orange, glow-tinted)
   - Three-currency line in the shop UI
   - Save flash indicator hooked into `save.tickFlash()`

8. **Audio integration in gameplay** — every meaningful action triggers an SFX via `audio.play(name, { throttle? })`. Music auto-switches based on `pickMusicTrack()`.

### What's now in code that the doc previously listed as "Pending"

- ✅ Sound effects (item 5 of previous Pending list)
- ✅ Save system (item 6 of previous Pending list)

### Pending work (good prompts for the next session)

1. **Remaining boss transformations** — only GUARD-1 and TITAN-LORD transform. SKYHAMMER, INFERNO-X, RAVAGER, CRYO-LORD, NULLIFIER, OMEGA-PRIME still need their phase-2 transform drawer + AI override (the per-subtype drawers `drawBossSkyhammerJet` / `drawBossInfernoBeast` / `drawBossRavagerTank` / `drawBossCryoGolem` / `drawBossNullifierRift` / `drawBossOmegaDemon` already exist as scaffolds at `~line 11397+`, but they aren't fully wired to the AI yet).
2. **New enemy types** — SCREAMER kamikaze diver and SENTINEL laser-tripod were originally planned; `screamer` and `sentinel` already appear in the scrap-drop table but the AI/draw isn't implemented yet.
3. **More stages** — 1-2 new stages reusing existing bosses with new themes is doable in 1 turn.
4. **More obstacles in existing stages** — bump density in `addExtraHazards`, add a CRUSHER vertical-platform hazard, conveyor belts, falling debris.
5. **PRIME/CONVOY unique vehicle forms** — they currently inherit APEX's starfighter; CONVOY does have the dedicated `hovertank` but the `vTypes` table has it sitting in the tier-6 slot rather than one variant per tier. PRIME could get its own jet variant.
6. **Frame-counted state transitions** — two `setTimeout(() => { gameState = ... }, 1500)` calls remain (`~line 5479` win, `~line 5817` win). Both bypass hitstop/pause. Should be moved to a frame-based timer object.

### Notable code pointers (current state)

- `audio` IIFE — `~line 61`. Add SFX via `SFX.<name> = () => { ... }`. Trigger via `audio.play('<name>', { throttle: <ms> })`.
- `save` IIFE — `~line 587`. Mark dirty via `save.markDirty()`; auto-flush every 3s.
- `SHOP_ITEMS` — `~line 1141`. Crafting items have `craft: true`, `costScrap`, optional `cost`, and `craftDesc` fields.
- `spawnHealingStation(x, groundY)` — `~line 4114`. Two per stage from `extendStage`.
- `spawnMinibossAntechamber(wardenX)` — `~line 2398`. Entry-gate-locks-behind-player flow.
- `updateMinibossWarden`/`drawMinibossWarden` — `~line 18010` / `~line 18167`.
- `pickMusicTrack()` — `~line 542`. Authoritative on which music plays for each `gameState`.
- `devSkipToBoss(stageIdx)` — `index.html` script block. Stages 3+ drop player at `triggerX - 1000` so antechamber fires first.

---

## Previous Session — May 24, 2026 (Morning)

This is the prior session's MOST RECENT block, preserved verbatim for context.

### What changed in that session (in order)

1. **Transformer-look armor + fake-3D depth pass** for evolution tiers (helpers above `drawPlayer`):
   - `bevelPanel(x,y,w,h, base, hi, sh)` — reusable beveled metal panel
   - `drawTfPauldron`, `drawTfDoorWing`, `drawTfTruckCab`, `drawTfGrilleChest`, `drawTfHelmet`, `drawTfBackPack` (now a no-op)
   - `drawTransformerArmor(px, py, evoCol, evoLevel)` — top-level dispatcher
   - Stronger `drawFogOverlay` (vignette + bottom tint + edge chromatic aura)
   - True vanishing-point perspective floor grid in `drawBackground`
   - Height-aware drop shadow on the player (projects onto nearest platform top, shrinks/fades while airborne)

2. **CONVOY tier completely rewritten** as a dedicated G1 Optimus Prime drawer that **bypasses the normal armor stack** at evoLevel 6:
   - `drawConvoyOptimus(px, py)` lives just above `drawPlayer`. Front-facing body, both eyes lit, both pauldrons visible (Mega Man style — NOT side profile).
   - **Helmet**: blue trapezoid shell, light-blue forehead crest, twin silver antennae, blue side ear-plates with yellow dots, cyan eyebar visor with twin pupils, chrome faceplate (single hairline seam, NO 3-slit grille — that earlier mistake is gone)
   - **Truck-cab chest**: red shell with twin cyan windshield panels (white shine streaks), white vertical grille below with chromeShd slats, Autobot emblem on the right pane
   - **Pauldrons**: chunky red shoulder cubes (cleaner trapezoids at CONVOY tier than the generic `drawTfPauldron`)
   - **Arms**:
     - **Ion Blaster** on the side matching `player.facing` (front arm). Idle pose: forearm horizontal across the chest. Aiming: forearm rotates to aim direction with recoil + muzzle flash.
     - **Energon Axe** on the opposite side (back arm). Idle pose: forearm angled UP with axe held over the shoulder. Swing: forward-down arc with glowing crescent trail. Stage-3 finisher does a wider overhead chop.
   - **Belt**: white waist with gold buckle bar
   - **Legs**: blue thighs with center groove, white knee caps with red dot, blue boots with darker side panel inset
   - **Animation hooks**: `player.legPhase` drives walk swing (legs alternate vertical lift), `player.gunRecoil` drives blaster recoil, `player.meleeAnimTimer/meleeAnimStage/meleeAxe` drive the axe swing, idle breath bob (~3.5Hz, 0.6% of sprite height)
   - **drawPlayer short-circuit**: at `player.evoLevel >= 6 && !transformed && !sliding && !rolling && !parrying && !pounding`, calls `drawConvoyOptimus(px, py); ctx.restore(); return;` so the old armor stack never paints over CONVOY

3. **CONVOY signature gear**:
   - Vehicle form is **`'hovertank'`** (NOT recycled starfighter). Dispatched in the `vTypes` array as the tier-6 entry. Has its own render block in `drawVehiclePlayer` (chrome chassis, blue cab, red rear pods, ion cannon, hover underglow disc, side hover-vents) and physics (25% gravity, gentle hover bob, max fall speed 8) in the player update.
   - **Matrix Ion Blast** projectile when shooting in hovertank form: 180-dmg pierce + 130-radius AOE main shot + 3 trailing energy comets, big white-blue muzzle flash, double shockwave, 18-frame screen shake. Cooldown 38f.
   - **Energon Axe melee** at CONVOY tier (`isAxe = player.evoLevel >= 6` in `executeMelee`): 75/100/200 dmg per hit (vs 30/40/80 for normal punches), 100/130 range, 14/22 knockback, finisher does extra 120-dmg AOE with 160px radius, double shockwave, 6-frame hitstop.
   - The melee renderer detects `player.meleeAxe` and draws a swinging axe (crescent trail + blade) instead of fists during the swing animation.

4. **Stats balance** (last balance pass):
   - PRIME: rcCost 220→60, hpBonus 600→400, dmgBonus 3.4→2.6, speedBonus 1.5→0.5
   - CONVOY: rcCost 380→80, hpBonus 900→600, dmgBonus 4.5→3.5, speedBonus 1.9→0.6
   - Heightbonuses bumped: OMEGA 26→38, APEX 34→50, PRIME 70→90, CONVOY 100→**600** (cumulative climb from BASE → CONVOY adds ~808px so the sprite stands ~848px tall on a 600px canvas — properly towering)

5. **Boss buffs**:
   - Stage 1-3 arena HP multiplier: 1.8 → 2.4
   - Stage 4-8 arena HP multiplier: 2.4 → 3.2 (further × 1.4 if `player.evoLevel >= 6`)
   - Fire timers: 0.65 → 0.55 (stages 1-3), 0.45 → 0.40 (stages 4-8)

6. **Per-subtype boss attack expansion** (every boss except hydra/titan):
   - **Phase 2 entrance attack** (fires immediately when boss drops to 50% HP): GUARD 16-cone, SKYHAMMER 5-bomb arc, INFERNO 14-globule lava ring, RAVAGER 8-saw spinning radial, CRYO 10-bullet ice cone (slow), NULLIFIER 3 phase-blink rings, OMEGA twin laser-eye spread + 8-bullet outer ring
   - **Phase 3 signature** (every 4s during rage on `e.subRageTimer`): GUARD armor crash + 3 mortars, SKYHAMMER WAR DRUMS (6-bomb line), INFERNO LAVA GEYSER (8 rising globs), RAVAGER BLADESTORM (12-bullet cone), CRYO BLIZZARD (16 homing snowflakes that slow), NULLIFIER PHASE STRIKE (4 rings teleport-spawn at player), OMEGA TWIN LASER EYES (16 piercing bullets + ring)
   - These run *alongside* the existing generic 12-bullet rage burst on `e.rageBurstTimer` (180f cooldown)

7. **GUARD-1 boss transformation** (proof of concept — same pattern as TITAN-LORD):
   - Phase 2 entrance now sets `e.transformed = true` and `e.transformTimer = 1`
   - 90-frame fold-down animation (energy core + spinning ring + sparks)
   - **Riot Tank** silhouette: wide trapezoid hull, full-width treads with alternating segments, fortified armor dome, pulsing red sensor eye, twin forward cannons that flip toward the player, side spike-bumpers
   - **AI override** when `e.transformed && e.transformTimer >= 90`: tank glides side-to-side along the ground tracking the player, sits at `baseY + 24`, fires twin cannon volleys (6 bullets total, slight cone) on a 35f/55f timer
   - **Origin slots** added in `bossOrigin()`: `cannonTop`, `cannonBot`, `eye`, plus humanoid slots that fall back when not transformed
   - **Drawer**: `drawBossGuardTank(ex, ey, e)` lives between `drawBossGuard` and `drawBossSkyhammer`. `drawBossGuard` checks `e.transformed` and routes to it.
   - Banner: `'⚠ GUARD-1: RIOT TANK MODE ⚠'` shown for 240 frames
   - **Other bosses still need their transformations** — pending work

8. **Cinematic upgrades**:
   - Boss intro: full-screen impact flash on the landing beat, pre-landing red warning, 110→120px letterbox with chrome edge lines, energy lightning bolts arcing from bars to center, 76→84px boss name with double-pass stamping for chunkiness, name-scale bounce + vertical wobble at landing, diagonal corner accents, hitstop punches doubled, multi-color shockwaves
   - Phase 2 transition: 3 multi-color shockwaves, 80-150 particles, cone-of-sparks, 28 screenshake, 10-frame hitstop, critFlash overlay, 60-frame `phaseFlashTimer` for boss body halo
   - Phase 3 transition: 3 shockwaves (red/orange/white), 100+ particles, 24-point radial burst, 36 screenshake, 14-frame hitstop, full red `hitFlash`, 80-frame `phaseFlashTimer`
   - Evolution cutscene: 5 scripted beats with cumulative particle bursts at 30/55/80/85/95% of duration, helmet snap-down screenshake + critFlash at 85%, final pose explosion with 24-point radial burst at 95%

9. **Polish caps**:
   - `MAX_PARTICLES = 280` — `spawnParticles` drops new requests beyond this so screen stays readable in busy fights
   - `MAX_SHOCKWAVES = 24` — same pattern for `spawnShockwave`
   - Boss intro spark rate halved (every 4f → 8f), ring rate slowed (every 30f → 40f)

10. **HUD upgrade**:
    - Evolution tier badge in upper-left under HP bar (`TIER N: NAME`) tinted by EVO_COLOR

11. **Dev panel**:
    - The 🛠 → **EVOLVE** button now jumps STRAIGHT to CONVOY (loops `evolvePlayer` until max tier) instead of one tier per click — needed because the cumulative height bonus only applies if you go through every tier
    - *(NOTE — superseded by the evening session's per-tier evo button row.)*

### Pending work from the morning session — now status

1. ❌ **Remaining boss transformations** — still pending (see current Pending list above).
2. ❌ **New enemy types** (SCREAMER, SENTINEL) — still pending.
3. ❌ **More stages** — still pending.
4. ❌ **More obstacles in existing stages** — still pending.
5. ✅ **Sound effects** — DONE in evening session (full Web Audio module + 24 SFX + 7 procedural music tracks).
6. ✅ **Save system** — DONE in evening session (localStorage `neonRush.save.v1`).

### Notable code pointers (current state)

- `drawConvoyOptimus(px, py)` — front-facing G1 Optimus drawer (~430 lines)
- `drawBossGuardTank(ex, ey, e)` — riot-tank phase-2 form (~150 lines)
- `executeMelee()` — `isAxe = player.evoLevel >= 6` flag drives the energon axe damage profile
- `shootVehicleProjectile()` — `'hovertank'` branch fires Matrix Ion Blast
- `drawVehiclePlayer()` — `'hovertank'` branch renders Optimus-tank vehicle silhouette
- Per-subtype phase-2 entrance + phase-3 signature attacks live in the `updateEnemies` boss block; phase-2 around `e.phaseFlashTimer = 60`, phase-3 around `e.subRageTimer`
- Boss transformations wire `e.transformed`, `e.transformTimer`. The drawers check `e.transformed` and route to the alternate form.

---

## Files

```
/Users/darrwang/Downloads/nicholas/
├── index.html          # Page wrapper, canvas, dev panel + audio panel + keyboard shortcuts (~674 lines)
├── game.js             # Entire game (~21,200 lines)
├── README.md           # GitHub-facing readme (~81 lines)
└── PROJECT_CONTEXT.md  # This file
```

Run by opening `index.html` in a browser. No build step, no dependencies.

## Workspace Note

The workspace root is `/Users/darrwang/Downloads/nicholas/`. File writes outside this directory are blocked.

---

## Game States (`gameState` variable)
- `intro` — opening title screen
- `charSelect` — pick a character to start
- `midCharSelect` — change character between stages
- `playing` — normal stage gameplay
- `cutscene` — boss dialogue (typewriter text, robot portraits, letterbox bars)
- `evoCutscene` — anime-style evolution transformation cutscene
- `throneCutscene` — OMEGA-PRIME throne stand-up cinematic (Stage 7 only)
- `bossIntro` — generic per-subtype boss-intro cinematic (every boss except OMEGA)
- `spaceTransition` — space combat between stages
- `finale` — giant-robot final fight against EARTHBREAKER (after Titan-Lord). Internal phases: `intro`, `dialogue1`, `battle` (city, life 1), `cityToSpace`, `dialogue2`, `battle` (space, life 2), `victory`. Self-contained module — see `finale` global object.
- `stageComplete` — between-stage screen
- `dead` — game over
- `won` — final victory (entered after the finale's `victory` phase, or directly from non-final stages)

---

## Core Architecture

Single file (`game.js`) with global state. Main loop is `requestAnimationFrame(gameLoop)`.

**Key globals:**
- `player` — main character with stats, position, evolution, abilities, **vehicle transform state** (`transformed`, `transformAnim`, `vehicleType`)
- `enemies[]` — all current enemies on screen
- `bullets[]`, `enemyBullets[]` — projectiles (incl. lava globs, plasma arcs, rockets, missiles, homing torpedoes)
- `platforms[]` — terrain (ground / platform / wall / spike / lava / laser / breakable / recovery)
- `coinPickups[]`, `healthDrops[]` — collectibles
- `allies[]` — friendly NPCs (max 2 at once)
- `cages[]` — captive cages spawned after boss kills (require key)
- `STAGES[]` — 8 stage configurations
- `WEAPONS[]` — 19 weapons
- `CHARACTERS[]` — 8 unlockable characters
- `EVOLUTIONS[]` — **7 evolution tiers** (BASE / MK-II / MK-III / OMEGA / APEX / PRIME / CONVOY)
- `EVO_COLORS` — color palette per evolution tier
- `FACE_ART` — speaker → portrait mapping
- `bossIntro`, `throneCutscene`, `evoTransform`, `bossDefeatCutscene` — cinematic state

---

## Player Controls

| Key | Action |
|-----|--------|
| A/D or ←/→ | Move |
| ↑/W/SPACE | Jump (double/triple/quadruple jump available depending on evo) |
| SHIFT | Dash (perfect dodge bullets for slow-mo) |
| **CTRL** | Dodge Roll (i-frame horizontal escape, 50f cooldown) |
| **C** | Parry (14-frame deflect window — reflects bullets at 2× damage, 60f cooldown) |
| **S/↓ in air** | Ground Pound (slam down + AOE shockwave damaging enemies in 130px radius) |
| S/↓ on ground | Slide while running |
| F (or J) | Shoot (gun aim follows facing + up/down keys) |
| ↑/↓ while shooting | Angle shots up/down |
| G | Melee combo (3-hit, 3rd is AOE explosion) |
| Q | Character ability (TIME SLOW, PHASE DASH, SHOCKWAVE, etc.) |
| R | Evolution ability (PULSE BURST, ROCKET BARRAGE, OMEGA BLAST, APEX NOVA, PRIME BEAM, CONVOY MATRIX) |
| **X** | **TRANSFORM** to vehicle / back to robot |
| TAB | Swap to next unlocked character mid-stage |
| E | Open shop / use ⚒ craft bench / use ⚕ healing station (when in range) |
| **M** | **Mute / unmute audio** |
| ENTER | Start / advance dialogue / continue |
| L (in shop) | Evolve (costs Robot Coins) |

### Dev shortcuts (always active during gameplay)

| Key | Action |
|-----|--------|
| **1-8** | **Skip directly to that stage's boss** (1=GUARD-1, 7=OMEGA-PRIME, 8=TITAN-LORD) |
| **0** | Start a space battle for the current sector |
| **9** | Toggle GOD MODE (auto-heal + invincibility) |

🛠 DEV button (top-right) opens a panel with all boss-skip and utility buttons (FULL HEAL, +50 RC, +1000¢, +100 🔩 SCRAP, EVOLVE +1, GOD MODE, KILL BOSS, UNLOCK ALL, SPACE BATTLE, ⚠ RESET SAVE) plus a per-tier evolution row (BASE / MK-II / MK-III / OMEGA / APEX / PRIME / CONVOY) for instant tier switching.

The audio panel (bottom-left, always visible) has a mute button and MUSIC + SFX volume sliders.

---

## Vehicle Transformation System (X key)

Each evolution tier maps to a unique vehicle silhouette:

| Tier | Vehicle | Speed | Gravity | Weapon (F) | Damage | Cooldown |
|------|---------|-------|---------|------------|--------|----------|
| BASE | **Bike** (motorcycle) | 1.7× | normal | none — ram only | 14 ram | — |
| MK-II | **Hover** (hoverbike) | 1.5× | half (floaty) | none — ram only | 18 ram | — |
| MK-III | **Tank** (treaded) | **0.85× (slow)** | normal | **Rockets** (gravity-arc, AOE 110px) | 110 + AOE | 55f |
| OMEGA | **Jet** (winged) | 1.6× | **none — flies** | **Twin homing missiles** (AOE 70px) | 55 + AOE | 28f |
| APEX | **Starfighter** | 1.8× (fastest) | **none — flies** | **Quad plasma torpedoes** (piercing, homing) | 48 each | 12f (rapid) |
| PRIME | (uses starfighter currently) | 1.8× | flies | quad plasma | — | — |
| CONVOY | (uses starfighter currently) | 1.8× | flies | quad plasma | — | — |

**Flight controls** (jet/starfighter only):
- W / ↑ / Space → ascend
- S / ↓ → descend
- A / D / ← / → → strafe
- Gravity is fully disabled — you stay airborne until you transform back

**Vehicle benefits:**
- Per-vehicle speed modifier
- Ram damage on contact (5 hits/sec, 12-frame per-enemy cooldown)
- Speed-streak FX while moving
- Bike/hover **cannot shoot** — pure rammers
- Tank/jet/starfighter **can shoot** their unique projectiles
- Mid-transform: counter-rotating energy rings + sparks animation (~12 frames)

---

## Stages (8 main + 7 space transitions)

1. **Facility Entrance** — boss GUARD-1, weapon: GUARD CANNON, ally: JADE
2. **Sky Docks** — boss SKYHAMMER, weapon: STORM HAMMER, ally: STORM
3. **Reactor Core** (lava) — boss INFERNO-X, weapon: INFERNO RIFLE, ally: EMBER
4. **Weapons Lab** — boss RAVAGER, weapon: RAVAGER FANG, ally: VIPER. **HYDRA-WALKER** starts spawning here
5. **Arctic Outpost** — boss CRYO-LORD, weapon: FROST CANNON, ally: FROST. **SCORPION-BOT** starts spawning here
6. **Void Gateway** — boss NULLIFIER (PHASE STRIKE signature). HYDRA mini-boss with 5 destructible heads.
7. **Command Citadel** — final boss OMEGA-PRIME, weapon: OMEGA BLASTER, ally: ECHO. **THRONE CINEMATIC** before dialogue.
8. **Orbital Fortress** — final-final boss **TITAN-LORD**. Phase-1 humanoid mech, phase-2 transforms into a battleship spaceship at 50% HP. Curated elite-only spawn list. Stage unlocks **APEX** evolution.

### Stage flow with mini-boss antechamber (stages 3-8)

Stages 3+ insert a mini-boss arena between the level proper and the boss arena:

```
[LEVEL] → entry-gate → [WARDEN ANTECHAMBER ~880px] → exit-gate → [BOSS ARENA]
```

- **Entry gate** (red, `antechamberEntry: true`) sits at `bossTriggerX - 940`. Auto-opens on approach, then closes behind the player once they cross past it (locking them in with WARDEN-K).
- **WARDEN-K** spawns at `bossTriggerX - 700`. Three-claw sentinel mini-boss — see Enemy Types table.
- **Exit gate** is the regular `bossGate` with `requiresWardenDead: true`. Refuses to open until every `subtype === 'warden'` enemy is dead, then auto-opens permanently (so the player can backtrack).
- Stages 1-2 still go straight from level → boss gate (no antechamber).

`devSkipToBoss(stageIdx)` drops the player at `triggerX - 1000` (just before the entry gate) on stages 3+ so the warden fight runs first.

### Stage 4-8 arena scaling
- Arena width: **2400px** (vs 1600 for stages 1-3)
- All non-boss enemies are **cleared from the arena** when the player triggers the cutscene (1v1 with boss, except HYDRA mini-boss)
- Bosses get **2.4× HP** + **45% faster fire timers** in arena (vs 1.8×/65% for stages 1-3)
- Layouts have NO ground-level walls (all walls were causing freeze bugs)
- Each arena has 2-3 destructible breakable cover pieces

### Stage Building Pipeline (`buildLevel`)
1. `buildStageN()` — base platforms, enemies, danger zones, shops
2. `extendStage()` — adds 700px post-content zone, +700 boss x-offset, more enemies (mech, hydra mini-boss)
3. `mergeAdjacentGround()` — merge ground gaps
4. **Strip walls from open world** — `platforms.filter(p => p.type !== 'wall')` (arena walls preserved because `buildBossArena` runs at cutscene time)
5. **HARD MODE SCALING** — applied to all enemies before puzzles/elites added
   - `stageScale = 1 + max(0, currentStage - 2) * 0.08` (stage 8 = 1.48)
   - Mob HP: `1.7 × stageScale` (was 1.4)
   - Boss HP: `1.45 × stageScale` (was 1.25)
   - Patrols: 12% faster
   - Fire timers: 22% faster
6. `populatePuzzles()` — switches/doors/breakables
7. `addExtraHazards()` — spikes/lasers/lava (density: `2 + stage` spikes, `stage - 1` lasers)
8. `addMissionPuzzle()` — key/laser-grid/terminal triplet (per-stage layouts in `layouts[stage]`)
9. `spawnEliteEnemies()` — HYDRA-WALKER (stage 4+) + SCORPION-BOT (stage 5+)
10. `spawnBossGate()` — visual gate at `bossTriggerX - 60` that auto-opens when player approaches (within 200px, 60-frame anim)

### Boss Cutscene Trigger Logic
When player's x ≥ `stage.bossTriggerX`:
1. `buildBossArena(currentStage, player.x, boss)` — clears platforms + enemies in arena, places gate, snaps boss to `arenaStartX + arenaW - 250`, applies HP/fire buffs
2. **OMEGA-PRIME** → `gameState = 'throneCutscene'` (special cinematic)
3. **All other bosses** → `bossIntro = createBossIntro(...); gameState = 'bossIntro'` (per-subtype cinematic)
4. After bossIntro/throne ends → `gameState = 'cutscene'` (dialogue)
5. After dialogue ends → `gameState = 'playing'`

### Mission-Impossible Puzzle (every stage)
1. KEY card hovers behind a laser grid (yellow halo)
2. Red laser grid blocks access (12 dmg + knockback, blocks bullets)
3. TERMINAL elsewhere on level — shoot to disable laser grid
4. Pick up key → 🔑 KEY ACQUIRED + golden shockwave
5. Defeat boss → cage spawns. **Cage refuses damage until you carry the key.**
6. HUD shows 🎯 OBJECTIVE banner that updates contextually

---

## Characters (8 total — Q ability)

| Character | Unlock | HP | Q Ability |
|-----------|--------|----|-----------| 
| STRIKER | Start | 220 | TIME SLOW (35% enemy speed for 3s) |
| SHADOW | Stage 1 | 160 | PHASE DASH (invincible big dash) |
| TANK | Stage 2 | 350 | SHOCKWAVE (250 dmg AOE) |
| GHOST | Stage 3 | 190 | AIR HOVER (3s float) |
| GUNSLINGER | Stage 4 | 190 | BULLET STORM (60% fire rate buff for 4s) |
| CRYO | Stage 5 | 260 | FREEZE BLAST (freeze all on screen) |
| VOIDWALKER | Stage 6 | 230 | TELEPORT (200px warp + i-frames) |
| OMEGA | Stage 7 | 320 | ANNIHILATE (huge damage to all) |

---

## Evolution System (7 tiers — `EVOLUTIONS[]`)

Spend Robot Coins (RC) at shops or via dev panel.

| Tier | RC | HP+ | DMG× | SPD+ | W+ | H+ | Side-Arm | [R] Ability |
|------|----|----|----|------|------|------|---------|-------------|
| BASE | — | — | 1.0 | — | — | — | none | none |
| MK-II | 16 | +60 | 1.25 | +0.4 | +2 | +12 | Twin pulse cannons (auto) | PULSE BURST (240f) |
| MK-III | 38 | +120 | 1.55 | +0.6 | +3 | +18 | Twin rocket launcher (auto) | ROCKET BARRAGE (240f) |
| OMEGA | 75 | +250 | 2.0 | +0.9 | +4 | +26 | Quad missile array (auto) | OMEGA BLAST (480f) |
| APEX | 130 | +400 | 2.6 | +1.2 | +5 | +34 | Quad plasma cannons (auto) | APEX NOVA (600f, reflects bullets) |
| **PRIME** | 220 | +600 | 3.4 | +1.5 | **+3** | **+70** | Six-cannon crimson volley | PRIME BEAM (720f, sweeping orbital) |
| **CONVOY** | 380 | +900 | 4.5 | +1.9 | **+4** | **+100** | Eight-cannon golden storm w/ AOE | CONVOY MATRIX (900f, screen-clear, full heal) |

**Tall-not-fat rule:** PRIME/CONVOY have NARROW widthBonus + HUGE heightBonus — true Optimus-Convoy proportions, not chubby.

### Visual evolution armor stack (drawn on top of base robot)
- **MK-II+** → chest emblem
- **MK-III+** → tank tread plating on legs (visible black tread + glowing seam)
- **OMEGA+** → halo over head + folded jet wings on back + animated aura ring (50px)
- **APEX+** → halo blade orbital rig (3 floating points, 22px radius)
- **PRIME** → glowing crimson chest reactor + crimson plate trim + twin sword hilts on back
- **CONVOY** → full Optimus look:
  - Truck-cab shoulder pads with headlights
  - Truck-grille chest plate w/ horizontal bars
  - Glowing Autobot emblem on chest
  - Dual energy swords from forearms
  - 4-point halo crown over head (animated rotation)
  - Twin smokestacks on shoulder pods (with smoke puffs)

### Innate aura (passive damage radius around player)
- BASE/MK-II/MK-III: none
- OMEGA: 90px, 4 dmg/30f
- APEX: 130px, 8 dmg/30f
- **PRIME: 160px, 12 dmg/30f**
- **CONVOY: 200px, 16 dmg/30f**

### CONVOY innate damage reduction: -10% from enemy bullets

### EVO_COLORS lookup
```js
[null, // BASE
 { armor: '#ffaa00', glow: '#ff8800' },  // MK-II
 { armor: '#ff44ff', glow: '#aa00ff' },  // MK-III
 { armor: '#ffffff', glow: '#ffff00' },  // OMEGA
 { armor: '#66ffff', glow: '#00ffff' },  // APEX
 { armor: '#ff3344', glow: '#ff8866' },  // PRIME
 { armor: '#ffd744', glow: '#ff6600' }]  // CONVOY
```

---

## Boss System

### Bosses (9 total — each w/ unique silhouette + bossOrigin slots)

| Boss | Subtype | Stage | Phase 1 HP | Effective HP (after 2.4× arena buff + stage scale) |
|------|---------|-------|------------|---------------------------------------------------|
| GUARD-1 | `guard` | 1 | 500 | ~1380 |
| SKYHAMMER | `skyhammer` | 2 | 600 | ~1670 |
| INFERNO-X | `inferno` | 3 | 850 | ~2380 |
| RAVAGER | `ravager` | 4 | 750 | ~2870 |
| CRYO-LORD | `cryo` | 5 | 700 | ~2900 |
| NULLIFIER | `nullifier` | 6 | 800 | ~3580 |
| OMEGA-PRIME | `omega` | 7 | 1300 | ~6230 |
| TITAN-LORD | `titan` | 8 | 1800 | ~9210 |
| HYDRA (mini) | `hydra` | 6 | 500 | ~700 |

### Boss phases (NEW: 3 phases now)
1. **Phase 1** — base attack patterns
2. **Phase 2** at 50% HP — color shift, expanded attack pool, faster fire, **transformation overlay** (extra shoulder cannon pods + back armor flares appear on the body)
3. **Phase 3** at 25% HP — RAGE MODE
   - Pulsing red aura around the body
   - "★ BOSS ENRAGED — FINAL PHASE ★" banner
   - Shoot timers run **50% faster** (`bossSlowMul = slowMul / 0.65`)
   - **Rage burst** every 3 seconds — 12-bullet circle outward from boss center
   - Constant red rage particles
   - Skipped for HYDRA (multi-headed) and TITAN-LORD (already has its own ship transformation)

### TITAN-LORD's special transformation (Phase 2 = ship form)
- At 50% HP, plays a **counter-rotating energy-ring fold-down animation** (120 frames)
- Body changes from 160×170 humanoid mech to 220×110 wide battleship
- New attack pool: nose cannon plasma, four-wing salvo, bombing run, ring barrages
- Engine plume always running on the rear

### Boss attack origins (`bossOrigin(e, slot)`)
Returns world-space coords for visible body parts. Used for muzzle flashes + projectile spawn:
- **GUARD-1**: shoulder cannons, leftHand/rightHand (mace, shield), eyes
- **SKYHAMMER**: belly (bombs), leftPod/rightPod (missiles), leftHand/rightHand
- **INFERNO-X**: mouth (lava globs!), leftFist/rightFist, eyes, shoulders
- **RAVAGER**: leftSaw/rightSaw, eye, chest, tail
- **CRYO-LORD**: scepter, crystal, leftHand
- **NULLIFIER**: leftClaw/rightClaw, eye
- **OMEGA-PRIME**: leftEye/rightEye (TWIN LASER EYES), chestOmega, leftFist/rightFist, halo
- **TITAN-LORD** (mech): leftEye/rightEye, leftCannon/rightCannon, chestCore, leftFist/rightFist
- **TITAN-LORD** (ship): noseCannon, wingTopL/R, wingBotL/R, engine

### Boss-intro cinematics (`createBossIntro` / `updateBossIntro` / `drawBossIntro`)
Each non-Omega boss plays a unique scripted entrance before dialogue:
- **GUARD-1** — slam-drops from above
- **SKYHAMMER** — roars in horizontally
- **INFERNO-X** — rises from lava
- **RAVAGER** — charges in screaming
- **CRYO-LORD** — materializes inside an ice shockwave
- **NULLIFIER** — phase-glitches into existence
- **TITAN-LORD** — counter-rotating energy-ring assembly

**Cinematic visuals (recently polished):**
- 110px letterbox bars (sliding in)
- Side vignette
- Color-tinted scanlines
- Per-boss tagline (`BOSS_TAGLINES`): "GATEKEEPER OF THE FACILITY", "SKY DOMINION ENGAGED", "REACTOR CORE — UNCONTAINED", "PROTOTYPE WEAPONS ONLINE", "ABSOLUTE ZERO — ASCENDED", "EXISTENCE: REVOKED", "KING OF MACHINES", "ORBITAL FORTRESS — AWAKE"
- 76px boss name with decorative slash bars above and below
- Slide-in from left, sequential reveal timing
- Skippable with ENTER/SPACE/F (after 25-frame grace period)

---

## Enemy Types (14 mobs + WARDEN-K mini-boss = 15 total)

| Enemy | Behavior |
|-------|----------|
| patrol | Walks back and forth, alerts on player sight, chases when alerted |
| drone | Floats and shoots downward |
| turret | Stationary, aims and rapid-fires |
| heavy | Big tank, triple shot, slow movement |
| shielder | Shield reduces frontal damage 80% — flank them |
| jumper | Crouches and leaps at player, contact damage |
| sniper | Telegraphs with red beam, fires high-damage shots |
| bomber | Floating kamikaze, explodes on contact |
| sprinter | Fast melee chaser |
| ricochet | Patrols, fires bouncing pellets (3 bounces) |
| swarm | Small drone, orbits player, dive-bombs |
| mech | Transformers-style giant — 3 attack patterns (missiles/MG/plasma) |
| hydraWalker | 3-headed patrolling walker (stage 4+). Each head fires its own colored bullet. Heads die at HP thresholds. 4 jointed legs that stride. |
| scorpion | 4-leg artillery walker (stage 5+). Tail-mounted plasma cannon lobs charged blue arcs. |
| **warden** (mini-boss) | **WARDEN-K** — sentinel-class mini-boss in the antechamber on stages 3-8. Three claw-legs, optic eye smoothly tracks player. Three rotating attacks: **TRIPLE BEAM VOLLEY** (3 fanned piercing shots from the eye), **CLAW SPIKE** (delayed-eruption ground spike under player + 5 upward shrapnel), **SENTRY OVERCHARGE** (every alive orbital orb pulses). 4 orbital sentry orbs in phase 1, +2 in phase 2. HP `320 + stage * 60`. |

### Defensive normalization (CRITICAL)
At the top of every enemy AI tick, `updateEnemies()` runs:
```js
if (typeof e.vx !== 'number' || !isFinite(e.vx)) e.vx = 0;
if (typeof e.vy !== 'number' || !isFinite(e.vy)) e.vy = 0;
if (!isFinite(e.x)) e.x = e.baseX || 0;
if (!isFinite(e.y)) e.y = e.baseY || 0;
```
This was added because a missing `vy: 0` on a Stage 8 mech caused NaN propagation → `createLinearGradient` threw → game appeared frozen. **Always init `vx, vy, facing, walkPhase, attackPhase` on new enemy spawns.**

---

## Vehicle Projectile System

`shootVehicleProjectile()` (called when in tank/jet/starfighter form):
- **Tank** — heavy AP rocket (110 dmg + 110 AOE radius, 55f cooldown, gravity-arc, smoke trail)
- **Jet** — twin homing missiles (55 dmg + 70 AOE radius, 28f cooldown, mild homing toward nearest enemy within 700px)
- **Starfighter** — quad plasma torpedoes (48 dmg each, piercing, homing, 12f cooldown)

`updateBullets()` includes a homing pass that gently steers `b.homing` bullets toward the nearest enemy (turn rate 0.08, re-normalizes velocity to preserve speed).

---

## Combat Mechanics

- **Bullets blocked by walls** — true cover system
- **Headshot CRIT** — hits to top 25% of bosses do 2× damage with yellow particle burst, shockwave, hitstop, gold flash overlay
- **Perfect Dodge** — dash through bullets within 25-50px → triggers slow-mo (60 frames) + combo bonus
- **Melee Combo** — G key, 3-hit chain. Hit 1: 30 dmg jab. Hit 2: 40 dmg cross. Hit 3: 80 dmg uppercut + AOE explosion.
- **Dodge Roll (Ctrl)** — spinning ball animation + speed lines, 18f i-frames
- **Parry (C)** — silver shield arc + golden ring on success. Reflects bullets at 2× damage at nearest enemy.
- **Ground Pound (S/↓ in air)** — vertical orange streak. On landing: double shockwave (180px + 140px), 60+ AOE damage with knockback, "SLAM!" float text.
- **Combo counter** — kill enemies quickly to multiply coins (up to 3×). Banner appears at top: 5+ STREAK / 8+ KILLING SPREE / 12+ RAMPAGE / 20+ UNREAL
- **Hitstop** — 3-4 frame freeze on big hits
- **Status effects** — burn (DOT), slow, frozen apply to enemies
- **Boss weak points** — every boss takes 2× damage from headshots

---

## Allies

After each boss kill, a cage spawns. Free key first → shoot cage → captive joins as ally. **Max 2 allies at a time** — the oldest ally departs when a new one is rescued.

| Stage | Ally | HP | DMG |
|-------|------|----|----|
| 1 | JADE (green) | 80 | 14 |
| 2 | STORM (blue) | 100 | 18 |
| 3 | EMBER (orange) | 110 | 20 |
| 4 | VIPER (lime) | 130 | 22 |
| 5 | FROST (cyan) | 150 | 25 |
| 6 | NULL (purple) | 160 | 28 |
| 7 | ECHO (white) | 200 | 35 |
| 8 | (no ally — final stage triggers immediate `won` after boss death) |

Allies can double-jump to reach platforms.

---

## Visual / Graphics Systems

- Damage numbers (white/gold/magenta float text)
- Shockwave rings (expand+fade on explosions, crits, AOE, key pickup, evolution)
- Hit flash + crit flash overlays (red pulse on damage, gold tint on crit)
- Twinkling parallax starfield
- Combo banner (pulsing colored)
- Hitstop (3-4 frame freeze)
- PS-style gradient lighting on platforms
- Drop shadows under player + large enemies
- Atmospheric fog overlay tinted per stage theme
- Vignette + faint scanlines
- Perspective floor grid
- Stage-unique decorations (lava glow, snow falling, void portals, citadel towers)
- Eye-tracking visor on player (pupil follows mouse)
- Animated arms (front tracks aim, back swings opposite legs)
- Walking legs (sin-wave swing)

---

## Hazards

- **spike** — red triangles, 8 dmg + knockback
- **laser** — toggling beam, 8 dmg + knockback
- **lava** — orange bubbling pool, 12 dmg + knockback. Can be `temp:true` (timed lifespan from Inferno glob impacts)
- **breakable** — wooden crates, 60-150 HP. Some are HIDDEN CACHES with coins + health drop
- **laser grid** (mission puzzle) — wall of red beams, 14 dmg, blocks bullets, disabled by terminal

---

## Currencies

Three currencies with separate sources and uses.

- **Coins** — buy weapons and stat upgrades at the shop. Drop from most enemies and breakables.
- **🔩 Scrap** — primary cost for crafting recipes (see below). Drops from breakables and **every enemy**:
  - Boss: `40 + currentStage * 4`
  - Mini-boss (WARDEN-K, HYDRA): 22
  - hydraWalker / scorpion / mech: `10 + floor(currentStage * 1.5)`
  - heavy / sniper: 6
  - sentinel: 7 (enemy AI not yet implemented; drop table is staged)
  - screamer: 5 (enemy AI not yet implemented; drop table is staged)
  - shielder / jumper: 4
  - bomber / sprinter / turret / ricochet: 3
  - patrol / drone / swarm: 2
  - default: 1
  - Spawned as orange `coinPickup`s with `scrap: true` flag.
- **◆ Robot Coins (RC)** — evolution. Drop from elite enemies:
  - Boss: 18 RC
  - Mini-boss (HYDRA): 10 RC
  - HYDRA-WALKER: 5 RC
  - Mech / SCORPION-BOT: 4 RC
  - Heavy/Sniper: 3 RC
  - Shielder/Jumper: 2 RC
  - Bomber/Sprinter/Turret: 1 RC

### ⚒ Crafting recipes (scrap-driven)

Available alongside regular shop items. Every recipe uses scrap as the primary cost; some hybrid with coins for the more powerful upgrades.

| Recipe | Cost | Effect |
|--------|------|--------|
| REPAIR KIT | 30 scrap | Full HP restore + 1s i-frames |
| ARMOR PLATE | 60 scrap + 40c | +30 max HP (permanent) |
| AMMO OVERCHARGE | 80 scrap | +4 bullet damage (permanent) |
| SERVO BOOST | 100 scrap + 60c | +0.3 movement speed (permanent) |
| KINETIC SHIELD | 90 scrap | 4s invincibility (consumable) |
| POWER CELL | 150 scrap + 80c | +1 extra jump (permanent) |
| ENERGON CORE | 200 scrap | Convert scrap to 5 RC |

### Scrap-trade items (escape valves)

Intentionally stingy rates so scrap doesn't trivialize coins/RC.

| Trade | Rate |
|-------|------|
| Trade scrap → coins | 50 scrap → 80c |
| Trade scrap → RC | 25 scrap → 1 RC |

---

## Audio System (`const audio = (() => { ... })()` at ~line 61)

Pure Web Audio API — no asset files, no build step. Music and SFX are generated procedurally so the game stays a single-file vanilla project.

- Lazy `AudioContext` — created on first user gesture (browser autoplay policy)
- Master / music / SFX gain nodes; mute, music volume, SFX volume settable independently
- `audio.play(name, opts?)` — fire one-shot SFX with per-name throttle (default 30ms)
- `audio.setMusic(name)` — switch background music with smooth crossfade
- `audio.setMuted(bool)`, `audio.setMusicVol(0..1)`, `audio.setSfxVol(0..1)`, `audio.isMuted()`, `audio.getMusicVol()`, `audio.getSfxVol()`
- `audio.unlock()` — call on first user gesture to start the AudioContext

### SFX library (24 effects)

`jump` `doubleJump` `wallJump` `dash` `roll` `shoot` `shootHeavy` `shootBeam` `rocket` `melee` `meleeHit` `axeSwing` `axeHit` `hit` `hurt` `crit` `explosion` `bossKill` `parry` `pound` `transform` `evolve` `coin` `heal` `death` `win` `bossIntro` `keyPickup` `ui` `warpIn`

Each is a tone+noise composition. Add new ones by extending the `SFX` object inside the IIFE.

### Music tracks (procedural, scheduled bar-by-bar)

- `menu` — intro / character select
- `cyber` — stages 1-3 (also boss dialogue + space transition)
- `industrial` — stages 4-5
- `void` — stage 6
- `final` — stages 7-8 + evolution cutscene
- `boss` — any time `enemies.some(e => e.type === 'boss' && e.hp > 0)` returns true
- `victory` — stage complete + final win

`pickMusicTrack()` is the authority on what should be playing. Called every frame from `gameLoop`; internal dedup makes repeats cheap. The music auto-crossfades when the result changes.

### HTML controls (in `index.html`)

- Bottom-left **audio panel** (always visible): mute button + MUSIC slider + SFX slider
- **M key** also toggles mute (in addition to the button)
- First keydown / click also calls `audio.unlock()` to start the context

---

## Save System (`const save = (() => { ... })()` at ~line 587)

`localStorage` persistence under key `neonRush.save.v1` (version-gated — mismatched versions are ignored on load).

**Persisted between sessions:**
- Unlocked characters (`CHARACTERS[i].unlocked`)
- Unlocked weapons (`player.weaponsUnlocked`)
- Audio settings (muted, musicVol, sfxVol)
- Meta stats: `totalCoins`, `totalScrap`, `totalRC`, `bossesDefeated`, `totalDeaths`, `totalWins`, `farthestStage`, `maxEvoLevel`

**Intentionally NOT persisted** — every fresh run starts from zero with all unlocks intact:
- Per-run state: HP, currencies, position, current stage, evolution level, bullet damage, weaponTier, max-jump bonus

### API

```js
save.load()             // restore from localStorage at startup
save.write()            // flush current state immediately
save.reset()            // wipe + reset CHARACTERS unlocks (only [0] starts unlocked)
save.markDirty()        // schedule autosave on next 3s tick
save.bumpStat(k, n)     // increment a meta counter
save.setStat(k, v)      // set a meta counter
save.getMeta()          // read meta object
save.isFlashing()       // for HUD "SAVED" indicator
save.tickFlash()        // tick the flash timer (called from gameLoop)
```

### Auto-flush

`setInterval(() => { if (dirty) write(); }, 3000)` — debounces frequent updates. Game-over screen displays the meta stats. Dev panel **⚠ RESET SAVE** button calls `save.reset()` then `location.reload()`.

---

## Healing Stations

Reusable repair pillars scattered through every stage (two per stage).

- **`HEAL_STATION_RECHARGE = 360`** (6s recharge after use)
- **`HEAL_STATION_DURATION = 90`** (1.5s heal animation)
- **`spawnHealingStation(x, groundY)`** — called from `extendStage`. Two per stage: one mid-stage at `~42% of maxX`, one pre-boss next to the shop at `maxX + 140`.
- Player presses **E** in range to repair. Refuses if already at full HP. Heals ~1.5% maxHp/frame for 90 frames (full heal).
- **Allies in 180px radius** get a one-shot 50% heal at `healTimer === 1`.
- Particle stream from station to player during heal, finishing shockwave on completion. Recharge gauge visible on the pillar.
- Shop wins if both shop and healing station are in range simultaneously (shared `shopKeyHeld` edge-trigger).

---

## Cinematics & Cutscenes

- **Boss intro** (`cutscene` state) — typewriter dialogue with cinematic black bars + robot character portraits (uses `drawBossBody` for boss likeness)
- **Boss victory cutscenes** — bosses 1-7 confess + point to next threat
- **Space cutscenes** — between every stage transition (SHIP A.I. + CONTROL + YOU)
- **Space intro cinematic** (within `spaceTransition`) — scripted ambush: warp signature → ships warp in → cannons charge → battle. Skippable.
- **Evolution transformation cutscene** (`evoCutscene`) — 5 phases over 6s with anime speed lines, counter-rotating rings, armor pieces flying in, helmet snap, eye ignition, name banner reveal
- **OMEGA-PRIME THRONE cinematic** (`throneCutscene`) — Stage 7 only:
  - Phase 0 (0-50): "— THE THRONE ROOM —" subtitle, wide shot of throne with Omega slumped (70% scale, shifted down)
  - Phase 1 (50-110): Player walks in from left automatically
  - Phase 2 (110-180): Omega's eyes ignite, body rises, scale grows back to 100%+
  - Phase 3 (180-230): Standing pose, halo flares, 280px shockwave, screen shake
  - Phase 4 (230+): Hand off to regular dialogue cutscene
- **Per-boss intro cinematics** (`bossIntro` state) — see Boss section above

---

## Key Files / Code Pointers (game.js)

| Topic | Approx Lines |
|-------|--------------|
| Globals (canvas, particles, damageNumbers, shockwaves, evoTransform, throneCutscene, bossIntro) | 1-50 |
| WEAPONS array (19 weapons) | ~30-160 |
| CHARACTERS array (8 chars) | ~165-245 |
| EVOLUTIONS array (7 tiers) | ~248-370 |
| EVO_COLORS | ~370-380 |
| `player` object init (with transform fields) | ~340-415 |
| `triggerEvoAbility` (PULSE / ROCKET / OMEGA / APEX / PRIME / CONVOY) | ~415-635 |
| `evolvePlayer` | ~635-680 |
| Allies (`spawnAlly`, `updateAllies`, max-2 logic) | ~680-915 |
| STAGES array (8 stages with cutscene + spaceCutscene + victoryCutscene) | ~1120-1430 |
| `buildLevel`, `buildBossArena` (with stage 4-8 arena clearing + 2.4× HP buff) | ~1450-1730 |
| `extendStage` | ~1735-1800 |
| `addExtraHazards`, `addMissionPuzzle`, `spawnEliteEnemies` | ~1810-2010 |
| `buildStage1..8` | ~2050-2700 |
| Boss cutscene trigger | ~3070-3110 |
| Player update entry | ~3120 |
| **Vehicle transform (X key) + animation** | ~3490-3540 |
| **Vehicle ram damage** | ~3540-3580 |
| Aura damage (OMEGA/APEX/PRIME/CONVOY) | ~3590-3620 |
| Player gravity + flight (jet/starfighter) | ~3630-3680 |
| Shoot block + vehicle-projectile gating | ~3700-3750 |
| Side-arm spawn (pulse/rocket/omega/apex/prime/convoy) | ~3870-3960 |
| Bullet update (incl. homing) | ~3970-4020 |
| Boss AI dispatch + Phase 2/3 transitions + rage burst | ~5085-5570 |
| `drawPlayer` (with vehicle branch + evolution armor stack) | ~5510-5770 |
| **`drawVehiclePlayer` — bike/hover/tank/jet/starfighter renders** | ~13200-13500 |
| **`shootVehicleProjectile`** | ~13500-13585 |
| `drawBossBody` dispatch + `drawBossTransformOverlay` (NEW) | ~7210-7290 |
| Per-boss drawers (drawBossGuard..drawBossOmega + drawBossOmegaInner) | ~7290-8200 |
| Throne cinematic (updateThroneCutscene, drawThroneCutscene, drawThrone) | ~6175-6325 |
| Evolution transformation cinematic | ~6325-6650 |
| `drawBossOmega` (with throne slump/rise override) | ~7565-7720 |
| FACE_ART map + drawRobotPortrait + drawBossPortrait + drawPlayerPortrait + drawPanelPortrait | ~10220-10985 |
| `startSpaceTransition` + `spawnFlyingEnemy` | ~11470-11700 |
| `updateSpaceIntro` + `drawSpaceIntro` + `updateSpaceTransition` + `drawSpaceTransition` | ~11700-12300 |
| Main `gameLoop` (state dispatch, draw flow) | ~12810-13000 |
| **TITAN-LORD AI + draw** (`updateBossTitan`, `drawBossTitan`) | ~13050-13250 |
| **Boss-intro system** (`createBossIntro`, `updateBossIntro`, `drawBossIntro`, `BOSS_TAGLINES`) | ~13250-13450 |
| **Vehicle render + projectile system** | ~13450-13700 |
| Final start hooks (`applyCharacter(0); buildLevel(); requestAnimationFrame(gameLoop)`) | ~13855-13860 |

(Use `grep_search` for exact line numbers — they shift as code evolves.)

---

## Critical Bug Patterns to Avoid

1. **Always init `vy: 0` on new enemy spawns** — missing vy causes NaN propagation → `createLinearGradient` throws → game freezes. Even with the defensive normalization in `updateEnemies`, it's safer to init at spawn time.

2. **Don't add ground-level walls in arenas** — they block player path. All arena walls must either be raised (top above ground level) or be small step-up platforms (h ≤ 14, low enough to jump onto).

3. **Use correct field names on enemy spawns** — the existing AI/draw code expects specific field names:
   - mech: `vx, vy, facing, walkPhase, attackPhase, onGround` (NOT `dir`, NOT `attackPattern`)
   - hydraWalker: `vx, dir, patrolStart, patrolEnd`
   - boss: `subtype, hp, maxHp, phase: 1, shootTimer, moveTimer: 0, baseX, baseY, attackPattern: 0`

4. **Test in real Chrome via headless** — Node simulation passes silently for canvas errors. Use `--headless=new` to catch `createLinearGradient` errors.

5. **Boss x must be ≤ trigger x** — boss should be PAST `bossTriggerX` so player walks INTO the trigger before reaching the boss. `buildBossArena` snaps boss to `arenaStartX + arenaW - 250`, so it's always far past trigger.

6. **Stages 4-8 use `arenaW = 2400`**, stages 1-3 use `arenaW = 1600`. Layout coords for stages 4-8 should fit within 2400.

---

## Recent Major Additions (most recent first)

**Evening session (May 24, 2026):**

- **Audio system** — full Web Audio module with 24 procedural SFX + 7 procedural music tracks selected by `pickMusicTrack()` per `gameState`. M key + audio panel.
- **Save system** — localStorage `neonRush.save.v1` with characters/weapons/audio/meta. 3s autosave.
- **Scrap currency + crafting** — third currency, drops from breakables/enemies, drives 7 crafting recipes + 2 trade rates.
- **Healing stations** — two per stage, E to repair, partial heal to allies in range.
- **WARDEN-K mini-boss antechamber** — stages 3-8 add a locked-arena gauntlet between the level and the boss arena.
- **Dev panel rework** — per-tier evo buttons (BASE/MK-II/.../CONVOY), +100 SCRAP button, ⚠ RESET SAVE button. EVOLVE button reverted to +1 per click.

**Morning session and earlier:**

0. **Transformers-look armor + fake-3D depth pass** — replaced the flat colored squares on the player with a chunky Transformers visual style (G1 Megatron / Bumblebee movie / Optimus movie reference). New helper functions live just above `drawPlayer()`:
   - `bevelPanel(x, y, w, h, color, accent, shadow)` — reusable beveled metal panel with rim lighting
   - `drawTfPauldron(...)` — chunky trapezoidal shoulder pad
   - `drawTfDoorWing(...)` — back-mounted Bumblebee-style door wings
   - `drawTfTruckCab(...)` — Optimus truck-cab shoulder block (windshield + headlights)
   - `drawTfGrilleChest(...)` — vehicle-grille chest plate with optional Autobot emblem
   - `drawTfHelmet(...)` — full Transformers helmet (crest + side fins/horns + faceplate + glowing eyebar visor); returns the visor rect for the eye-tracking pupil
   - `drawTfBackPack(...)` — CONVOY twin smokestacks + smoke puffs
   - `drawTransformerArmor(px, py, evoCol, evoLevel)` — top-level dispatcher; called from `drawPlayer` after the body torso draws and before the helmet
   - The eye-tracking code now uses the visor rect returned by `drawTfHelmet` so the pupil dots stay inside the eyebar at any tier
   - `drawFogOverlay` is more aggressive (bottom-tint, edge chromatic aura, stronger vignette) to sell depth
   - Player drop shadow is height-aware: it projects onto the actual ground beneath, shrinks/fades while airborne, grows/darkens on landing
   - `drawBackground` now renders a true vanishing-point perspective floor grid (lines converge to (vanX, horizonY)), tinted by arena theme
1. **Phase 3 boss rage** — at 25% HP all bosses enrage: red aura, 50% faster fire, periodic 12-bullet rage burst every 3 seconds
2. **Boss transformation overlay** — phase 2/3 spawns shoulder cannon pods + back armor flares on boss silhouettes
3. **CONVOY/PRIME proportions** — much taller, slimmer (CONVOY now 100px height bonus, 4px width — true Optimus proportions)
4. **PRIME (tier 5) + CONVOY (tier 6) evolutions** — 7 total tiers now. PRIME gets 6-cannon volley + chest reactor + sword hilts. CONVOY gets 8-cannon storm + truck-cab shoulders + Autobot emblem + dual energy swords + halo crown.
5. **Vehicle projectiles**:
   - Tank: heavy AP rockets (110 dmg + 110 AOE radius, 55f cooldown)
   - Jet: twin homing missiles (55 dmg + 70 AOE, 28f cooldown)
   - Starfighter: quad plasma torpedoes (48 dmg, piercing, homing, 12f cooldown)
6. **Flight physics** — jet/starfighter fully ignore gravity, W/S controls altitude
7. **Player vehicle transform** (X key) — robot ↔ vehicle toggle, mid-transform energy-ring animation, per-tier vehicle (bike/hover/tank/jet/starfighter), +60% speed, ram damage, can't shoot in rammer-only forms
8. **Bigger boss arenas (stages 4-8)** — 2400 vs 1600, all non-boss enemies cleared on entry, 2.4× boss HP, 45% faster fire timers
9. **Bigger cinematic boss intros** — 110px letterbox, side vignette, scanlines, per-boss tagline, 76px boss name with slash bars
10. **APEX evolution tier** + APEX NOVA (full-screen plasma + bullet reflection)
11. **STAGE 8: ORBITAL FORTRESS** — final-final stage with TITAN-LORD
12. **TITAN-LORD boss** — humanoid mech in phase 1, transforms into a battleship at 50% HP with counter-rotating energy-ring cinematic
13. **Generic boss-intro cinematic system** — every non-Omega boss plays a unique scripted entrance
14. **Density cleanup pass** — fewer hazards/lasers/lava/breakables per stage
15. **Defensive enemy normalization** — `vx, vy, x, y` clamped at every AI tick to prevent NaN-cascade game freezes
16. **Stronger enemies pass** — mob HP 1.7×, +8% per stage past stage 3, 22% faster fire timers, 12% faster patrols
17. **OMEGA-PRIME throne cinematic** — slumped → walk-in → eye ignite → rise/transform → halo flare → dialogue
18. **Taller-not-fatter evolutions** — separate widthBonus / heightBonus
19. **Higher character HP** — base STRIKER 150 → 220, all chars +30-40%
20. **New combat moves** — Dodge Roll (Ctrl), Parry (C, with bullet reflection), Ground Pound (S/↓ in air)
21. **Two new enemies** — HYDRA-WALKER (3-headed walker, stage 4+), SCORPION-BOT (4-leg artillery, stage 5+)
22. **Boss attacks from body parts** — Inferno mouth lava globs, Nullifier claw phase-strike, Omega twin laser eyes, Skyhammer belly bombs + shoulder missiles, Cryo scepter, Ravager saws, Titan wing cannons
23. **Damage numbers, shockwave rings, hitstop, hit/crit flash overlays, combo banner**
24. **Mission-Impossible puzzle system** — key + laser grid + terminal per stage
25. **Transformer-style player evolution** — side-arms spawn from visible shoulder mounts with muzzle flashes
26. **Per-stage boss victory cutscenes** with portraits + transition dialogue
27. **Space transition cinematic** with warp-in ambush sequence
28. **Stronger ships per galaxy tier** — HP/damage scale, ELITE ships at sector 3+
29. **Max 2 allies at once** with double-jump AI
30. **Eye-tracking visor** — pupil follows mouse cursor

---

## Known Issues / Pending Polish

1. **PRIME/CONVOY use APEX's starfighter** for the vehicle slot. CONVOY *does* have a dedicated `hovertank` form but the `vTypes` table needs reorganizing so each tier 5/6 gets a unique vehicle. Could give PRIME its own jet variant.
2. **Per-boss unique phase-3 attacks** — phase-2 entrances + phase-3 signatures already exist per subtype; the generic 12-bullet rage burst still runs alongside.
3. **Boss transformations** — only GUARD-1 (riot tank) and TITAN-LORD (battleship) transform. Six bosses still need their phase-2 transform wired up. The drawer scaffolds (`drawBossSkyhammerJet`, `drawBossInfernoBeast`, `drawBossRavagerTank`, `drawBossCryoGolem`, `drawBossNullifierRift`, `drawBossOmegaDemon`) exist but the AI override + origin slots aren't fully connected for these.
4. ~~**No sound effects**~~ — DONE (Web Audio module with 24 SFX + 7 procedural music tracks).
5. ~~**No save system**~~ — DONE (localStorage `neonRush.save.v1`).
6. **Performance** — bullet/particle counts can spike during boss circle bursts. `MAX_PARTICLES = 280` and `MAX_SHOCKWAVES = 24` caps help.
7. **Dead helper code** — old portrait helpers (drawPortraitChest, drawPortraitHead, drawHelmetShape, etc.) exist after the new drawRobotPortrait but are unused.
8. **HYDRA mini-boss in Stage 6** — already exists from older work; the HYDRA-WALKER is a distinct smaller patrol enemy. WARDEN-K is the new general-purpose mini-boss for stages 3-8.
9. **PRIME/CONVOY vehicle types** — `transform` handler line: `const vTypes = ['bike', 'hover', 'tank', 'jet', 'starfighter', ?, 'hovertank']`. Tier 5 still needs a unique vehicle.
10. **`screamer` and `sentinel` enemy types** appear in the scrap-drop table but the AI/draw code isn't implemented yet — they're staged for the next session.
11. **Two `setTimeout` game-state transitions** at `~line 5479` and `~line 5817` bypass hitstop/pause. Should be moved to frame-counted timer objects.

---

## How to Resume Development

1. Open `/Users/darrwang/Downloads/nicholas/` in your editor
2. Open `index.html` in a browser to test (no build needed)
3. **Press 1-8 to test any boss instantly** (1=GUARD-1, 7=OMEGA-PRIME with throne cinematic, 8=TITAN-LORD)
4. **Press 9 to toggle GOD MODE** for testing
5. **Press X in gameplay to transform** to vehicle
6. Read this file + scan `game.js` to refresh context
7. Common things to ask for:
   - **Boss transformations** for the remaining 6 bosses (the user has asked multiple times for bosses to fold into vehicles like TITAN-LORD does)
   - **SCREAMER + SENTINEL enemy AI** (drop tables already include them; just need the AI + draw blocks)
   - **Per-boss unique phase-3 attacks** — replace the generic rage burst with subtype-specific patterns
   - **PRIME/CONVOY unique vehicle forms** (jet variant for PRIME, semi-truck for CONVOY's robot mode tie-in)
   - More cutscenes / character lore
   - Tweak balance (boss HP, character HP, RC costs, scrap drop rates, craft recipe costs)
   - Polish UI / HUD
   - Add new mission puzzle types
   - Mobile/touch controls
   - Add more crafting recipes / scrap sinks
   - Add a 3rd healing station per stage on later levels

---

## Game Stats Summary

- **~21,200 lines** of code in game.js
- ~674 lines in index.html
- **8 main stages** + 7 space transitions + Omega throne cinematic + per-boss intro cinematics + EARTHBREAKER giant-robot finale
- **9 main bosses** (GUARD-1, SKYHAMMER, INFERNO-X, RAVAGER, CRYO-LORD, NULLIFIER, OMEGA-PRIME, TITAN-LORD) + 1 stage-6 mini-boss (HYDRA) + 1 general mini-boss (WARDEN-K, stages 3-8) + 1 finale boss (EARTHBREAKER, 2 lives across city and space)
  - Each main boss has 3 phases (rage at 25% HP)
  - GUARD-1 transforms to riot tank at 50% HP
  - TITAN-LORD transforms to battleship at 50% HP
  - INFERNO-X has 5 distinct fire powers per phase (added FIRE WAVE + METEOR SHOWER)
  - CRYO-LORD has 5 distinct ice powers per phase (added ICE BEAM + ICICLE STORM)
  - WARDEN-K mini-boss themed per stage (6 different palettes)
- **15 enemy types** (14 mobs + WARDEN-K mini-boss); mob colors and bullets retinted per stage
- **19 weapons** (FLAME THROWER damage rebalanced from 6 → 3)
- **8 playable characters**
- **7 evolution tiers** with anime transformation cinematic; PRIME/CONVOY side-arms gated by shot counter (every 2nd / every 3rd) so they don't trivialize bosses
- **5 vehicle forms** (bike/hover/tank/jet/starfighter) + CONVOY-only hovertank with Matrix Ion Blast
- **3 currencies** (Coins / 🔩 Scrap / ◆ RC) and **7 crafting recipes**
- **2 healing stations per stage** with allied splash heal
- **Procedural Web Audio** — 24 SFX + 7 music tracks selected by `pickMusicTrack()`
- **localStorage save** for characters / weapons / audio / 8 meta stats; FULL RESET option from death + intro screens
- 7 rescue allies (max 2 active)
- Mission puzzle entities: keys, laser grids, terminals
- 7 movement abilities: walk, jump, double/triple/quadruple jump (per evo), wall jump, dash, dodge roll, slide
  - Finale-only: dash (Shift, i-frames), double jump in air, special beam (Q)
- 3 defensive moves: parry, ground pound, perfect dodge
- 3-hit melee combo
- Cutscene types: boss intro (per-subtype), victory, space transit, evolution, throne, finale (intro + city→space + dialogue beats)
- Dev tools: 🛠 button + per-tier evo buttons + ⚠ RESET SAVE + keyboard shortcuts (1-8, 0, 9, M)

