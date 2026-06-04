# NEON RUSH — Project Context

A 2D action platformer + space dogfighter built in vanilla HTML5 Canvas + JavaScript. Inspired by Mega Man, Dead Cells, Hades, **Transformers**, and modern PS-style action platformers. Heavy emphasis on cinematics, screen-juice (hitstop, shake, flashes, shockwaves), varied combat moves (dash, dodge roll, parry, ground pound, melee combo), and **vehicle transformation**.

---

## ⚡ MOST RECENT SESSION (Jun 3, 2026 — dev-weapon arsenal explosion + arena rework + balance pass)

Another long kid-led session. ~21 commits. The session focused on **dev-only weapons** (kid + 2 friends Micah + Jax each get themed weapons), **friendly-summon systems** (minecraft mobs, primus titan), **boss-arena rework**, and a sweeping **balance pass** to make the game properly hard. File grew from ~25,000 → ~30,600 lines.

### Big new systems

**Cache-bust on game.js load** (`b0c3001`) — every page load fetches `game.js?v=Date.now()` via a generated script tag + 3 no-cache meta tags. Solves the recurring "I don't see my changes" report from the kid because GitHub Pages + browser caching kept serving stale builds. Now every reload pulls fresh code regardless of cache state.

**🛠 DEV panel quick-give buttons** (`e627f60`, then expanded across the session) — instead of going through the shop to grab a dev weapon, the panel now has one-click buttons that unlock + equip + close-the-panel:
- ⚽ JAX BLASTER · ⛏ MICAH MINECRAFTER · 🎵 BAND BLASTER · ⚙ CONVOY ION BLASTER (Nicholas)
- DAGGERS · HAMMER · SCYTHE (the new melee weapons added below)
- UNLOCK ALL also extends to flip on all 6 melee weapons

**3 new melee weapons** (`8cec2e8` follow-up + earlier session work) added to the shop:
- DUAL DAGGERS [H], 360c, dmg×2.0 — twin-blade flurry, second blade renders alongside main during swings AND in idle
- WAR HAMMER [J], 760c, dmg×3.0 — heavy slam with ground shockwave on every swing (extra AOE for fraction of damage)
- PHANTOM SCYTHE [K], 1380c, dmg×4.2 — long curved arc, **lifesteal 8%** of damage dealt as HP, capped at 60/swing
Each gets a per-weapon swing render (custom blade shape + trail count + glow color) plus a persistent idle-blade visual when held still.

**Improved melee animation curves** — replaced linear extend with **windup → snap → hold → recover**: 0.18 windup (blade pulls back visually), 0.27 snap with easeOutCubic + 1.03 overshoot, 0.20 hold near peak, 0.35 eased retract. Animation length scales per weapon (knife/daggers 14f, katana/saber 18f, scythe 22f, hammer 24f). Adds anticipation telegraph + "lands like a real strike" follow-through.

### Dev weapons (4 total — one per kid + their two friends + a band)

**⚽ JAX BLASTER** (tier 24, free for devs) — soccer-themed gun. 5-ball volley per shot. Every ball has **homing + bouncing (4 ricochets) + on-impact "GOAL!" split** that fires 4 mini soccer balls in a fan, each with their own 60-radius explosion. Custom render: spinning pentagon-stitched white-and-black soccer ball with motion-blur trail. 320 dmg + 170 AOE.

**⛏ MICAH MINECRAFTER** (tier 25, free) — minecraft-themed gun. **Big-deal weapon — most complex one in the game.** Each shot:
1. Fires a creeper-faced TNT block bullet (520 dmg + 220 AOE)
2. Drops a green acid puddle on impact (uses stageHazards system, 14 dmg/tick for 6s)
3. Free-summons one bonus mob at the impact point (zombie/wolf/enderman/blaze)
4. Pops 2-3 entries from a deterministic 20-step **summon queue** that includes mobs, blocks, AND **mob spawners** (iron-cage block that pumps out 5 of one mob over ~10s)
5. Has a 10% chance per shot to trigger a **rare boss mob** at the front of the queue (~7% Wither, ~3% Ender Dragon)

Mob roster (huge expansion this session):
- Tier 1: zombie / skeleton / wolf / creeper
- Tier 2: enderman (teleporting flank, 320 HP) · blaze (hovering fireball thrower, 240 HP) · iron golem (700 HP tank, 60 dmg)
- Boss tier: **wither** (1800 HP, 3-skull triple-volley AOE skulls) · **ender dragon** (2600 HP, sweeping 8-shot piercing breath beam)

Each mob has its own AI + render branch + HUD-preview icon + lifetime fade ring + HP bar. Dragons render with flapping wings + ember trail. Wither has 3-skull silhouette + glowing red eye sockets + persistent dark aura. Mob spawner is an iron cage with fire backdrop + spinning mini-mob inside + bottom progress gauge.

HUD preview at top-center shows the next 5 queued summons as pixel-art icons with a yellow `NEXT` highlight on slot 0 — kid can plan around what's coming.

Mobs return to player when no enemies are in range (walks back to a follow-trail offset, hops over bumps, warps if 1100+ px away).

**🎵 BAND BLASTER** (tier 26, free, dev-panel only) — 4-instrument music-note rifle. Press **B** to cycle DRUM → SAXOPHONE → CLARINET → FLUTE. Each instrument has TWO levels of ability:
- **F (regular fire)** = signature pattern per instrument
- **V (SPECIAL move, 3-sec cooldown)** = full-screen cinematic ability per instrument

Per-instrument:
| Inst | F (fire) | V (SPECIAL) |
|---|---|---|
| 🥁 DRUM | 3-shockwave wave w/ knockback + slow | EARTHQUAKE SOLO — 90f of expanding shockwave rings + ground-crack overlay |
| 🎷 SAX | 5 piercing homers + heal-on-shot + mob heal | JAZZ FRENZY — 12 spiral homers, +50 max HP, 120f of spiraling triple-notes |
| 🎼 CLARINET | Hyperspeed pierce-beam + chain-arc to 4 enemies | THUNDER OVERTURE — pre-computes ALL visible enemies, fires chain-lightning beam connecting them all (800 first hit + 320 each chain) with zigzag bolt render |
| 🎶 FLUTE | 8 bouncing notes (each splits into 3 sparkles on hit) + +30% speed buff | DOVE STORM — 90f invincibility, 30+ homing dove-notes auto-spawn around you, each piercing-explosive |

Music notes render as proper eighth-note silhouettes (filled head + stem + flag curl) with sine wobble + sparkle trail. The gun arm itself **physically transforms** into the instrument silhouette (snare drum + crossed sticks, gold curved sax + bell, black clarinet tube w/ silver keys, silver flute w/ finger holes) — switching is visually obvious without reading the toast.

**⚙ CONVOY ION BLASTER** (tier 27, "Nicholas weapon", free) — Optimus-themed dual-mode weapon:
- **F** — fires the convoy ion-blaster volley (3 piercing explosive shots, 240 dmg + 90 AOE each)
- **V** — triggers the **PRIME ULTIMATE**: player TRANSFORMS into Prime form (gold halo, pulsing Matrix-of-Leadership chest glow, +50% max HP, full heal, 60f i-frames, ember trail) AND simultaneously **summons the PRIMUS TITAN ally** (royal-blue/gold 90×160px colossus, 4500 HP, cycles through Chest Cannon → Shoulder Missiles → Ion Beam → Matrix Slam abilities)
- Both effects share a 30s active window + 30s cooldown
- Top-center HUD always visible while equipped: ACTIVE (gold drain bar) → RECHARGING (orange fill bar) → READY (callout)

### Other weapons + balance

**🆕 LASER RIFLE** (tier 28, shop, 1700c) — hot-pink piercing beam, 90 dmg, 4-frame fire rate. The "regular" new weapon for non-devs.

**Boss arena rework** (`57be4a8` then revised `117e642`):
- Originally bumped width 1600/2400 → 3200, but that broke split-floor stages (Sky / Inferno / Void had hardcoded floor positions that didn't extend) and pushed bosses 2950px right of the player → off-screen "missing boss" bug.
- Final width: **2000px** uniform across stages. Visible boss in mid-arena, split-floor positions still align.
- All in-flight stage hazards (acid drips, lava globs, lightning, icicles) get **wiped from the arena range** when the fight starts — no more chip damage from background.
- **Removed Stage 1 facility's two side pillars** and **Stage 7 citadel's two side towers** (user feedback: pillars blocked sightlines).

**Sweeping balance pass** (`2e61c77`):
- Shop prices up ~50% across the board (heal 15→25, full repair 40→70, max-HP 30→50, damage+5 70→110, sniper 500→760, railgun 720→1100, BFG 800→1250, knife 120→200, scythe 880→1380, etc.)
- Weapon damage up ~25% (PISTOL 16→22, OMEGA BLASTER 95→130, SNIPER 140→195, BFG 160→220, RAILGUN 130→180)
- Per-stage enemy HP curve steeper (1.08-1.48 → 1.10-1.60)
- Base mob HP multiplier 1.7 → 2.2
- Boss-room HP buff 1.45 → 1.85
- Enemy speed 1.12 → 1.18
- Boss base HPs up ~35%: guard 1100→1500, skyhammer 1400→1900, inferno 1700→2300, ravager 2100→2900, cryo 2400→3300, nullifier 2900→4000, omega 3600→4900, titan 4800→6500.
- Finale boss city form 4000→6500 (already from earlier in session), sky form 12000→18000, UNLEASH trigger HP 2000→3200.

**Reduced "flashbang"** screen tint on player damage:
- Removed the full-screen red overlay entirely. Only a subtle outer vignette remains, alpha capped at 0.16 (was 0.45 + 0.55).
- Crit gold-flash alpha capped at 0.10 (was 0.22).
- Boss rage-phase trigger no longer slams the screen with a full flash — just a soft pulse. Screenshake + hit-stop preserved.

### Permanent name lock + dev gate (`180f851`, then loosened in `117e642`)

**`firstName` localStorage key** records the first name a player ever submits and is **immutable**. On every subsequent load the input is pre-filled and **read-only** — players can no longer change their name on this browser. The submit button reads `▶ CONTINUE`.

Dev access logic (final):
- If `firstName` is empty (very first load before submit), trust the current name (so friends typing `nicholas` on a fresh browser get instant dev access)
- If `firstName` IS recorded, both `firstName` and current `playerName` must be in `DEV_NAMES`
- Friend types `bob` first → permanent normal player on that browser, can't bypass by claiming a dev name later (game still works fully, just no dev tools)

This was reworked twice mid-session — too strict version locked friends out of dev mode even when they typed dev names on their own browsers. Final version is the lenient-but-anti-bypass middle ground.

### Notable code pointers

- `WEAPONS[24..28]` — JAX BLASTER, MICAH MINECRAFTER, BAND BLASTER, CONVOY ION BLASTER, LASER RIFLE
- `MELEE_WEAPONS` map — knife/katana/saber/daggers/hammer/scythe with lifesteal/shockwave/dual flags
- `MINECRAFT_MOB_DEFS` — 9 mob kinds (4 tier-1 + 3 tier-2 + 2 boss). Every mob has its own AI branch in `updateMinecraftSummons()` and render branch in `drawMinecraftSummons()` and HUD-icon branch in `drawMinecraftPreview()`
- `MINECRAFT_BLOCK_DEFS` — dirt/stone/oak. Solid platforms with full collision in `updatePlayer` platform loop.
- `minecraftQueue[]` + `minecraftQueueCursor` — deterministic 20-step rotation; queue refilled lazily by `ensureMinecraftQueue()`. Cursor is monotonic so refill always advances (had a bug earlier where it always read indices 4-5 once stable)
- `minecraftSpawners[]` — iron-cage blocks that pump mobs over ~10s. Render with mini spinning mob inside + progress gauge.
- `BAND_INSTRUMENTS[0..3]` — DRUM/SAX/CLARINET/FLUTE definitions. Switching cycle in `cycleBandInstrument()`. Per-instrument fire patterns in `shootBandWeapon()`. Per-instrument SPECIAL cinematics in `executeBandSpecial()` + `updateBandSpecialFx()` + `drawBandSpecialFx()`.
- `executePrimusUltimate()` — V key handler for CONVOY ION BLASTER. Sets `player.primeMode = 1800` AND calls `spawnPrimusTitan()`. Cooldown ticked in `updatePlayer` along with the maxHp buff revert.
- `drawPrimeHud()` — shared HUD timer for the convoy weapon, three states (active/recharging/ready).
- `primusTitans[]` array + `updatePrimusTitans()` + `drawPrimusTitans()` — ally state machine (idle/cannon/missile/beam/slam) with 60-90f per mode + 30f idle gap. Heavy boss-bias in target selection.
- Cache-bust: `index.html` line ~395 builds the script tag with `Date.now()` query string at load time.

### Pending work / known gotchas

1. **PROJECT_CONTEXT.md is now ~600 lines longer** (this session block) but earlier session blocks below still reference removed mechanics. Could prune the May 25 v3 era ones since the gameplay has moved past them.
2. **Cached browser builds** are now solved by the cache-bust commit, but kids still occasionally see stale builds. The README should mention `Cmd+Shift+R` once.
3. **Stage 2/3/6 boss arenas** had a broken-floor bug at width 3200. Fixed by reverting to 2000. If we ever want bigger arenas again, we'd need to extend the split-floor stage layouts to fill the new width.
4. **`spawnPrimusTitan` is called once per V press**; if the kid spam-presses, the cooldown-gate prevents stacking but a queued press might fire if cooldown rolls over to 0 mid-press. Edge-trigger guard already in place.
5. **Itch.io upload still blocked** (account never got verified). GitHub Pages is the live host.

---

## ⚡ MOST RECENT SESSION (Jun 1, 2026 — kid-led iteration spree, big arsenal expansion)

Long collaborative session with the project owner (a 12-year-old) iterating live on weapon design, shop layout, and player-facing systems. ~30 commits, all pushed to `origin/main` (`github.com/nicholasdada001-cpu/neon-rush`). Game is now also live on **GitHub Pages** at `https://nicholasdada001-cpu.github.io/neon-rush/`.

### Big new systems

**Training mode** (`9a610ae`) — `gameState='finale'` + `phase='training'` reuses the entire EARTHBREAKER finale rig (player movement, melee combo, sword, rockets, jet, dash, hyper) against a 100k-HP indestructible-but-resetting dummy boss. Separate HUD with floating damage popups + DPS counter. R reset, T toggle dummy passive/shoot, E toggle evolved form, ESC exit. Implemented as a wrapper around `updateFinaleBattle` with post-tick state pin (boss can't actually die / phase-shift / unleash). Entry: `🎯 TRAINING MODE` button in dev panel.

**Name prompt + dev gate** (`adc1bf1`, `ac7803d`, `f8e7c81`) — every game start shows a "⚡ NEON RUSH ⚡ Enter your name" overlay. Name compared case-insensitively against `DEV_NAMES = ['nicholas', 'micah', 'jax']`. Non-devs get the 🛠 DEV button + dev keyboard shortcuts (1-8/0/9/backtick) **completely hidden**, plus `[DEV]` controls hint hidden. Levenshtein-based "Did you mean X?" suggestion for typos within 1-2 edits of a dev name. **Always re-prompts** every load (input cleared) so case changes/dev-mode toggling is fast for testing. Soft gate (anyone with F12 can bypass localStorage) — that's fine for the kid-game scope.

**Stage hazards** (`57496f3`, `d2f1ed0`) — periodic per-stage themed hazards via `stageHazards[]`, ticked from `updateStageHazards()` every 2-3 sec near the player. Falling hazards (acid/icicle/lava/meteor) **home toward the player** during descent (`tickStageHazardSpecials` adjusts vx each frame, capped at 5 px/f). Per-stage:
- 1 Facility = acid drips · 2 Sky = lightning bolt with 18f telegraph · 3 Reactor = lava globs · 4 Lab = toxic gas pockets · 5 Arctic = icicles (slow-on-hit, sets `iceSlowTimer`) · 6 Void = rifts (pull player) · 7 Citadel = orbiting plasma orbs · 8 Orbital = falling debris meteors

**Frozen-enemy variant** (`57496f3`) — Stage 5 mobs marked `e.frozenEnemy=true`, take ×1.5 fire damage, ×0.5 ice damage. Visible cyan tint + corner crystal triangles. Counter-pick FLAME THROWER for stage 5.

**Visible elemental status overlays** (`d41acbe`) — burn (orange tint + flame tongues + body sparks), ice (cyan tint + ice shards + frost rim + "❄ FROZEN" label), acid (green tint + bubbles + drip streams + "☣ MELTING" label), water (blue tint + electric arc zigzags + droplets). All apply to ALL enemies (mobs, mini-boss, boss). Bosses get shorter freeze/water-stun (8f vs 30f, etc.) so they're not trivialized.

### Combat balance (3 progressive nerfs)

- **OMEGA tier**: dmgMul ×1.30 → ×1.05 over the session, missile array 4×80/100r → 2×30/50r, OMEGA BLAST 180/350r → 50/220r
- **APEX tier**: dmgMul ×1.40 → ×1.08, cannons 4×55 → 4×22, APEX NOVA 260/520r → 80/320r
- **Flame+evolution exploit**: with FLAME equipped, side-arm now **completely disabled** (was firing missile barrages 30×/sec). Critical fairness fix.
- **Boss HP curve fixed** (was broken — bosses 4-5 had less HP than boss 3): 700/900/1100/1400/1600/1900/2400/3200 across stages 1-8. Warden mini-boss formula 320+stage*60 → 500+stage*100. Space-battle ships ~70% more HP, 8→12 ships per battle.
- **Lasers harder**: 700ms cycle → 500ms (stages 1-3) / 350ms (stages 4+), 25% always-on lasers from stage 4 up, damage 8→12. Laser hazard placement scales `1+stage` (was `max(0,stage-1)`).

### Massive arsenal expansion (10+ new weapons & melee)

Tiers 19-23 added to `WEAPONS`, plus a separate `MELEE_WEAPONS` table for blade weapons. All in shop:
- **ICE BLAST** (Z, 480c, tier 19) — beam-style freeze ray, slow + freeze on hit, 8f cooldown
- **RAILGUN** (Q, 720c, tier 20) — 130 dmg / 50f cooldown / pierces, magnetic-coil aesthetic
- **ACID GUN** (W, 540c, tier 21) — corrosive globs, burn + new `acidTimer` melt that does **% maxHp** damage every 12 frames (1.5% bosses, 3% mobs)
- **WATER GUN** (T, 380c, tier 22) — short-circuit pressurized stream, applies `frozen` (stun) + `waterShockTimer`, ×1.5 vs robots
- **LIGHTNING GUN** (R, 620c, tier 23) — REWORKED twice: started as chain-lightning, now a **marker shot** that triggers a sky-strike on impact (80 dmg in 110px radius, persistent zigzag bolt sprite via new `lightningBolts[]` array + `drawLightningBolts`)

**Melee weapons** (`MELEE_WEAPONS` map + `player.activeMelee`):
- **KNIFE** (D, 120c) — 1.6× dmg, 1.0× reach
- **KATANA** (F, 320c) — 2.4× dmg, 1.4× reach, gold cross-guard
- **LIGHT SABER** (G, 680c) — 3.5× dmg, 1.7× reach, white core + halo

Each has both an **active swing visual** (arc trail + blade rendered along swing angle, `glow + color + white core for saber`) AND a **persistent off-hand idle blade** that's always visible while equipped (anchored at player's back/free hand, tilts subtly with walk cycle). Buying re-equips, pressing the shop key again toggles equipped/bare-fist.

### Shop UI rework (`8cec2e8`, `3b695d1`)
- **All 7 ⚒ craft items removed** (REPAIR KIT, ARMOR PLATE, AMMO OVERCHARGE, SERVO BOOST, KINETIC SHIELD, POWER CELL, ENERGON CORE) to make room for the new weapons.
- Two-column layout split by **type** (left = utilities/trades/EVOLVE/SwitchWeapon, right = full ARMORY incl. melee), not by craft-vs-not.
- **Damage +5**: 35¢ → 70¢. **Fire Rate +15%**: 60¢ → 120¢. (Stat upgrades meaningfully more expensive.)
- New shop messages for melee: `Bought + Equipped: NAME`, `Equipped:`, `Unequipped:`.

### Visual polish

- **Better gun designs** (`83dee1a`) — main player gun went from a 14×6 cyan rectangle to a proper sci-fi rifle silhouette: stock + receiver + power-core + sight + barrel + grip + trigger guard + layered muzzle flash. Class-specific attachments: flame nozzle + fuel pod, beam emitter coils + crystal lens, explosive wide barrel + warning stripes, sniper long barrel + scope w/ red dot, multi-shot split barrel.
- **In-game weapon cycle** (`1cffc34`) — `,` (prev) and `.` (next) cycle through any owned weapons without going to shop. Edge-triggered, gated against shop/cutscene/heavy-action. Updates a transient banner.
- **Frost beam** (`1cffc34`) — FROST CANNON converted from a heavy slug to a continuous piercing beam (matches ICE BLAST's beam style; `beam: true` flag + `drawBullets` glow-stroke render).

### Wire-cut puzzle rework (`23f103a`, `2b15145`)

Old: shoot the terminal box, HP based.
New: terminal has 3 colored wires (red/blue/yellow). Walk near → floating label changes from gray "▼ CUT WIRES X/3 ▼" to yellow "[E] CUT WIRE (X/3)" → press E to cut next wire (sequential). Bullets now just spark off the panel + show "PRESS E TO CUT WIRE" hint. Each cut sprays colored sparks + screen shake + "WIRE CUT" floating text. All 3 cut → laser grid disables. Plus **key-card box**: each puzzle key has 3-sided wall enclosure so you can't walk in around the laser.

### Notable code pointers

- `WEAPONS[19..23]` — ICE BLAST / RAILGUN / ACID GUN / WATER GUN / LIGHTNING GUN. Bullet object now carries `flame/ice/beam/acid/water/lightning/lightningStrike/chainDmg/strikeDmg/strikeRadius` flags through from weapon definition (the latest lightning bug was that these flags weren't being copied to bullets).
- `MELEE_WEAPONS` map (knife/katana/saber) + `player.activeMelee` + `player.meleeWeaponsUnlocked` (object). `executeMelee()` reads `MELEE_WEAPONS[activeMelee]` to scale dmg/range.
- `drawPlayer()` melee FX block: blade-swing branch (`if (meleeWpnDef && !player.meleeAxe)`) handles knife/katana/saber arc render with per-weapon glow trail count, blade length, color, white core for saber.
- `drawPlayer()` end of front-arm/gun render: persistent off-hand blade render block — anchors at hand, idle angle tilts up-and-back per facing.
- `lightningBolts[]` global + `drawLightningBolts()` — sky-strike sprite array. Pushed from bullet hit when `b.lightningStrike`. 14-frame life with outer yellow glow + bright white core.
- `stageHazards[]` global + `updateStageHazards()` + `tickStageHazardSpecials()` + `spawnStageHazard()` + `drawStageHazards()`. Falling-type hazards have `homing: 0.10..0.22` strength applied each frame.
- `STAGE_ENEMY_THEMES[stage].frozenEnemy` post-pass in `applyStageEnemyTheme` for stage 5.
- `e.acidTimer` + `e.acidPct` + `e.iceFrostTimer` + `e.waterShockTimer` — per-enemy elemental state ticked in `updateEnemies()`. Visible overlays in `drawEnemies()`.
- `f.training` substate object + `updateFinaleTraining` + `drawFinaleTrainingHUD` for the practice arena.
- `player.iceSlowTimer` — drives 0.5× speed scale in `updatePlayer` after icicle hits.

### Pending work

1. **README controls update** for the new weapon hotkeys + melee toggle pattern (only weapon cycle + cut-wire are documented so far).
2. **Lightning gun is shaped weird** in the gun silhouette — `isMulti` etc. branches don't account for `lightningStrike` so it falls through to default rifle. A proper lightning emitter look (Tesla coils on the barrel, arcing) would be nice.
3. **`drawLightningBolts` is added** but the bolt life is short (14 frames) — could persist longer for clarity.
4. **PROJECT_CONTEXT.md is now ~50 lines longer** but other older sections below have stale info (boss HP numbers, weapon counts, etc.). Could prune oldest sections (the ones from May 25 v3 era) since the gameplay has moved well past that snapshot.
5. **itch.io upload still blocked** — the project owner's itch.io account never got verified, so the existing zip (`/Users/darrwang/Downloads/nicholas/neon-rush.zip` — outdated) is unused. GitHub Pages is the live host. A previous Netlify attempt (`robot-rush.netlify.app`) failed because that subdomain belongs to someone else and got bandwidth-paused.
6. **Cached browser builds caused multiple "the change isn't working" reports** — the project owner needs `Cmd+Shift+R` to force-reload after every push because the GitHub Pages cache is aggressive. Worth a one-line note in the README.

---

## ⚡ MOST RECENT SESSION (May 25, 2026 — late evening, post-revert restoration)

Quick addendum to the v3 finale overhaul block below. This run had three real changes plus a revert/restore round-trip:

1. **`fd04a88` — anime transformation cinematic + knockdown rescue scaffold.** The commit message described just the new phases, but the diff was +4143/-333 — it bundled in a large amount of in-flight working-tree work too: joint-articulated player + boss sprites, evolved-form rendering, hyper mode, new boss attack systems (UNLEASH at HP ≤ 2000 with 10× damage, kill-cinematic-on-low-HP trigger, the elaborate 6-act cityToSpace cutscene with kill beam → flatline → allies channel → transform → ascend), `b.unleashed`, `b.killCinematicQueued`, `p.evolved`, `p.maxHp = 2400` post-transform, `p.hyperTimer`, evolved sprite halos.

2. **Player-not-taking-damage bug.** The new `finaleOnPlayerDeath()` helper introduced by `fd04a88` set `f.player.invincible = 9999` and routed to a simpler home-grown `'knockdown'` phase that pre-empted the elaborate cityToSpace cinematic. Player became immortal and the rescue acts (allies talking, falling down, transforming) never showed.

3. **`31909a1` — misguided revert of `fd04a88`.** Tried to revert the broken knockdown but **the revert pulled out the joint sprites, evolved form, attack systems, and elaborate cinematic alongside it**. Big regression to the giant-robot fight visuals.

4. **`5039770` — replacement rescue cinematic.** Wrote a fresh 6-act `updateFinaleCityToSpace` that handles both paths (victory vs rescue) via `f.knockdownPath`. Functional, but visually thinner than the elaborate one that was reverted.

5. **`e0a1d5b` — restoration.** `git checkout fd04a88 -- game.js` brought the joint sprites + evolved form + cinematic back. Then patched only `finaleOnPlayerDeath()` to set `f.knockdownPath = true` and route to the existing elaborate `cityToSpace` (instead of the broken `'knockdown'` phase). Net: joints + new designs back in, rescue plays through the elaborate cityToSpace with full kill-beam → flatline → allies channel → transform → ascend.

### Current state of the finale (canonical)

- **`updateFinaleCityToSpace`** at line ~19684 — elaborate 6-act cinematic:
  - Act 1 (0–120): boss kill beam charges + fires
  - Act 2 (120–280): player flatlines, boss lifts off
  - Act 3 (280–520): four allies fade in, channel energy
  - Act 4 (520–760): player ascends + transforms in flight
  - Act 5 (760–900): boss transforms into final form
  - t = 900: hand off to sky-battle (`battle` phase, `boss.life = 2`)
- **`finaleOnPlayerDeath()`** sets `f.knockdownPath = true`, clamps HP to 1, kicks `f.phase = 'cityToSpace'`. The cinematic acts on `knockdownPath` to play the rescue beats.
- **`b.unleashed`** flips at boss HP ≤ 2000 (`b.damageMul = 10` until cinematic). `b.killCinematicQueued` triggers when player HP ≤ 100 with `b.unleashed` set, deferring 30 frames before kicking `cityToSpace`.
- **`p.evolved`** flag set during cityToSpace Act 3 → unlocks hyper mode (B key, `p.hyperTimer`), bumps `p.maxHp` to 2400, enables golden visual accents in `drawFinalePlayer`.

### Lessons / pending cleanup

- The fd04a88 commit message was misleading vs the diff. Going forward: inspect commit diff stats before reverting; if a commit is > 1k lines, assume the message is incomplete.
- The simpler "knockdown" phase added in fd04a88 (`updateFinaleKnockdown`, `updateFinaleKnockdownRevive`, `'knockdownDialogue'`, `transformAnime`) still exists in the file but is **unreachable** now since `finaleOnPlayerDeath` no longer routes there. Could be cleaned up next session for ~300 lines saved.
- File is now ~25,009 lines.

---

## ⚡ MOST RECENT SESSION (May 25, 2026 — v3 cinematic finale overhaul)

A multi-pass session that fundamentally restructured the EARTHBREAKER finale into a proper anime-style giant-mech showdown with a dramatic kill-cinematic, evolution sequence, and ascended sky battle. Boss balance, player abilities, body design, arena scale, and movement all overhauled.

### What changed in v3 (chronological)

1. **Three-key melee** — replaced "G cycles through punch/kick/uppercut" with three independent keys: **G = PUNCH**, **↓ = KICK**, **H = UPPERCUT**. Each press always plays the same move. Predictable input. `meleeStage` is set directly from the pressed key (1/2/3), not advanced.

2. **Cannon arm locked + stowed** — front cannon arm completely separated from melee animation:
   - **Hidden by default** — only renders the blaster when `gunOutTimer > 0` (held F or aiming up). Stows back to a closed-fist hanging arm 30 frames after each shot.
   - When out: **horizontally locked** (`frontArmUpper = π/2, frontArmLower = 0`) so the gun barrel always points forward. Aim up (↑) rotates to ~45° up-forward.
   - **Bullets fire from actual barrel tip** — `p.muzzleX/Y/Ang` cached per frame from the barrel-end world position; `finaleShoot` reads those.
   - **Direct line-drawing** instead of rotated-rectangle limb: `ctx.lineCap='round'` thick lines + glowing elbow disc + barrel rectangle attached to hand. Cleaner than the rotation transform approach which had mirroring math bugs.

3. **Cooler player body** — `w` 70 → 60 (slimmer mech), `h` 145.
   - Tapered torso silhouette (wider shoulders, narrower waist) replacing the plain rectangle
   - Diagonal V-chest plates with glowing accent edges
   - Three pairs of glowing side vents (cooling slats)
   - Layered chest core: outer pulsing ring + accent glow + white-hot center + waist belt with bolts
   - Beveled trapezoidal pauldrons with glowing accent slats + menacing top spikes
   - Mech helmet with chamfered top, forehead crest, ear plates, tinted black visor with bright accent bar, twin antennae with glowing tips

4. **Three new abilities** (giant-mech arsenal):
   - **C — SHIELD**: 90f hex bubble that blocks bullets. Cooldown 300f. Multi-layer cinematic visual: outer atmospheric glow, refraction-tint sphere, two counter-rotating hex grids (8/10-side), 3 procedural lightning bolts inside, drift sparkle particles. Block FX: 50px white shockwave + 80px accent shockwave + 8 directional sparks.
   - **R — TRIPLE ROCKETS**: 3-missile salvo from shoulder/chest/hip launchers. Each rocket: chrome-gradient body with red+orange stripes, dual rear fins, tapered nose cone with hot-red glowing tip, layered flame trail (yellow-white core → orange → fading red), per-missile sparkle trails. Homes toward boss. 75 dmg direct + 50 AOE per missile, 100px AOE radius. Cooldown 200f.
   - **V — ENERGY SWORD**: clean straight horizontal slash from front hand. 200px reach. Three layers: outer white halo (22px) + accent mid-blade (10px) + inner white core (4px). Reveal animation extends blade rapidly in first 40% of swing. Pointed tip glow. Hilt rendered AT the front hand. 130 dmg + 18 knockback + stagger. Cooldown 60f.

5. **Charged shot rebalance** — F-tap fires twin shot (20 dmg). F-hold builds charge over 60f → release for 5-ray pierce beam at **90 dmg per ray** (450 total max). Cancels if released before 24f.

6. **Articulated boss** — boss now uses the same drawFinaleLimb rig with `ctx.scale(b.facing, 1)` so its limbs swing as it walks/attacks. Walk swing on legs, idle arm sway, slam-windup raises both arms overhead, charge locks arms back + exaggerated stride. Hammerfist swings the active arm via the limb pose, not a free-floating tube.

7. **Bigger arena** — city arena 200..1100 → **200..1500** wide. Player roam city 700 → **1100**, space 940 → **1340**. Boss orbit radius 240→**360**, vertical bob 100→**130**.

8. **Boss keeps respectable distance** — hover gap 280 → **450px**, walk speed 1.8 → 1.4 (heavyweight feel), leap-landing target distance **350px** from player. Space dash stops at **350px** rather than ramming.

9. **Anime speed lines** — new `finale.speedLinesTimer` + `speedLinesIntensity`. Triggers on CLASH, UPPERCUT, and CHARGE-collision. 36 thin radial streaks + 8 thick ones emanating from screen center, skipping a 200px inner radius so the focus action stays readable. Slow rotation (1°/2°/f) for subtle motion.

10. **Boss "INTENT" flash** — `f.bossIntentFlash` ticks down for 14f before EVERY attack. Boss core eye flashes white + 60px shockwave + 6 sparks. Gives a clear "tell" so attacks feel telegraphed and fair.

11. **`` ` `` (backtick) shortcut** + dedicated **⚡ FINALE — EARTHBREAKER** dev panel button (red border, top-right under Esc). Both work from any state including title/charSelect (the keyboard handler used to gate against intro/charSelect — fixed).

12. **The CINEMATIC RESTRUCTURE** (the big one) — the city→space transition is now a **15-second, 5-act 900-frame anime sequence**:

   **Act 1 (0..120) — KILL SHOT**
   - Boss charges a multi-stage beam (60f charge with sparks + pulsing shockwaves)
   - At t=60 the beam **fires** — multi-layer beam (60px outer gold glow + 30px white mid + 10px bright core) blasts the player from boss core to player position
   - Player drops to **1 HP** + tumbles backward and falls

   **Act 2 (120..280) — FLATLINE + BOSS LIFT-OFF**
   - Player crumples, sparks emit from damaged body
   - Boss accelerates upward with rocket exhaust trail and ascent shockwaves

   **Act 3 (280..520) — ALLIES CHANNEL ENERGY**
   - 4 ally mech silhouettes appear around fallen player (pink, cyan, orange, green)
   - Each ally fires a continuous energy beam from their core toward the player
   - Energy stream particles flow from each ally to the player every 3f
   - Player slowly **levitates** as energy fills + heals from 1 to 2400 HP
   - Pulsing golden shockwaves + aura particles
   - **Meanwhile in upper screen**: 5 colored planet orbs (blue/orange/green/gold/purple) appear, boss destroys them sequentially every 30f starting t=380 (white+colored shockwaves + 30 colored debris particles each)
   - At t=480 final convergence: 400/600 shockwaves + 80 particles. Player marked `evolved=true`, `maxHp = 2400`

   **Act 4 (520..760) — PLAYER ASCENDS, TRANSFORMS**
   - Twin gold jet streams from boots
   - Cloud streaks until t=620, then star bursts (atmosphere → space)
   - Speed-line shockwaves every 24f
   - Backdrop transitions from city to space at t=620

   **Act 5 (760..900) — BOSS TRANSFORMS, STANDOFF**
   - Particles spiral INTO boss core (transformation anim)
   - 3 dramatic shockwave beats at t=800/840/880 (red+gold each)
   - Both combatants face each other, frozen in pose

   **t=900 — SKY BATTLE BEGINS**
   - 800px white shockwave + 100 particles
   - Boss `maxHp = 12000` (massively buffed in evolved sky form)
   - Three-line dialogue: "You... you came BACK?" / "I am EVERYONE'S strength now. We end this together." / "Then I shall consume galaxies to match you."

13. **UNLEASH trigger at 2000 HP** — when boss HP hits 2000:
   - Sets `b.unleashed = true` + `b.damageMul = 10`
   - Boss **stays vulnerable** but does **10× damage** on EVERY attack (bullets, hammerfist, slam, charge, hazards, beams, leap, minions — all multiplied by `b.damageMul`)
   - Big "☠ UNLEASHED — 10× DAMAGE ☠" entrance flash + triple shockwave + 80 particles + 60f player i-frames so it doesn't blindside
   - Player keeps fighting until their HP gets ground down to ≤100, then the kill cinematic auto-fires

14. **Kill cinematic auto-trigger at PLAYER HP ≤ 100** — once `b.unleashed && p.hp <= 100`:
   - `b.killCinematicQueued = true`
   - 60f player i-frames + 30-frame defer for the moment to read
   - Boss invincibility set + all in-flight attacks/hazards/minions wiped
   - Phase switches to `cityToSpace` → 900-frame sequence plays

15. **HP safety floor during UNLEASH** — at the top of `updateFinaleBattle`:
   ```js
   if (b.unleashed && !b.killCinematicQueued && p.hp <= 1) p.hp = 1;
   if (b.killCinematicQueued) { p.invincible = max(p.invincible, 30); if (p.hp <= 1) p.hp = 1; }
   ```
   Player can't die during the rage phase or the deferred cinematic transition — they just get pinned at low HP until the cinematic carries them through.

16. **EVOLVED player visuals** — when `p.evolved`:
   - Color shift: `colorBody = '#88ddff'`, `colorAccent = '#ffdd44'` (gold)
   - Soft constant golden halo around player
   - **HYPER MODE (B key)** unlocked: 240f duration, 600f cooldown, **3× damage multiplier** on all attacks, big pulsing gold halo + trailing sparks particles
   - HUD shows extra HYPER button (5 → 6 ability slots)

17. **EVOLVED boss visuals** — when `b.evolved`:
   - New gold-and-crimson palette: dark crimson body (`#5a1a00` → `#3a0000` phase 3), gold/crimson accents (`#ffaa00`/`#ff0000`), bright gold trim (`#ffdd44`)
   - Extra inner horns (gold, smaller, angled inward)
   - Floating crown ring above head (animated gold halo pulsing with walkPhase)

### Final HP / damage numbers (post-balance)

- City boss: **4000 HP**, normal damage
- After UNLEASH (≤2000 HP): boss **10× damage**
- Sky boss: **12000 HP**, normal damage
- Player base: 1500 maxHp
- Player evolved: 2400 maxHp

### Player ability table (final)

| Key | Move | Damage | Cooldown |
|---|---|---|---|
| F (tap) | Twin shot | 20 (× hyper 3) | 8f |
| F (hold) | Charge beam | 90×5 = 450 (× hyper 3) | 24f |
| Q | Special beam | 50×5 = 250 (× hyper 3) | 240f |
| G | PUNCH | 60 | 16f |
| ↓ | KICK | 75 | 16f |
| H | UPPERCUT | 140 + slow-mo + camera punch-in | 32f |
| C | SHIELD | blocks bullets 90f | 300f |
| R | TRIPLE ROCKETS | 75×3 + 50 AOE×3 = up to 375 | 200f |
| V | ENERGY SWORD | 130 + knockback | 60f |
| SHIFT | Dash w/ i-frames | — | 50f |
| SPACE (hold) | JET BOOSTER (after double-jump) | — | uses jetFuel |
| B | HYPER MODE (evolved only) | 3× damage 240f | 600f |

### Notable code pointers (v3)

- `updateFinaleCityToSpace` — the 900-frame multi-act cinematic. Acts split by `t` thresholds. Spawns `f.allies` and `f.bossPlanets` mid-sequence.
- `updateFinaleBattle` — top has the HP-floor guards. UNLEASH trigger near phase-transition block. 10× damage applied via `b.damageMul` multiplier on all `p.hp -=` lines.
- `b.unleashed` / `b.killCinematicQueued` / `b.damageMul` / `b.invincible` / `b.evolved` — the new boss state flags.
- `p.evolved` / `p.evolveAnim` / `p.hyperTimer` / `p.gunOutTimer` / `p.shieldTimer` / `p.rocketCooldown` / `p.swordTimer` — player state.
- `drawFinalePlayer` — `ctx.scale(sgn, 1)` mirroring, then direct line-segment limbs (not rotation-transform). Front arm has `gunOutTimer > 0` branch (BLASTER) vs stowed branch (closed-fist).
- `drawFinaleBoss` — uses `drawFinaleLimb` rig with boss pose state. New `b.evolved` branch picks the gold-crimson palette + extra horns + crown ring.
- `f.speedLinesTimer` — anime speed-line overlay rendered after dialogue, before vignette.
- Backtick shortcut + dev panel `⚡ FINALE — EARTHBREAKER` button both jump straight to `startFinale()` from any state.

### Pending work (good prompts for the next session)

1. **Sky-battle exclusive boss attacks** — currently the same 15-attack pool. Could add space-only patterns: orbital strike, gravity well, dark-matter wave.
2. **Player evolved-form unique moves** — HYPER MODE is a stat boost; could add a unique evolved-only move (Q variant in evolved form fires a giant gold beam?).
3. **Ally character variations** — currently allies are 4 generic colored mechs. Could match the four player characters (with their charColor) — picks the four NOT currently equipped.
4. **Mid-cinematic dialogue text overlay** — Act 3 currently has no text. Could add narration: "THE WORLD'S DEFENDERS SHARE THEIR STRENGTH" + character-specific quips.
5. **Boss death animation** — when boss finally dies in sky form, currently fires the standard victory shockwave. Could do a multi-stage explosion: limb-by-limb rip-apart, core implosion, screen black, "THE WORLD IS SAVED" text crawl.

---

## ⚡ Previous Session — May 25, 2026 (Late + v2)

The EARTHBREAKER finale fight got a second pass focused on (1) properly articulated player melee animations (no more disconnected fists), (2) lots more boss attacks/abilities, (3) longer fight (HP 4500 → 6500 + phase 3 at 25%).

### What changed in v2 (in order)

1. **Articulated player body** — new `drawFinaleLimb(sx, sy, upperAng, lowerAng, upperLen, lowerLen, thick, color, accent, endCap)` helper renders a tapered upper segment, joint disc, lower segment, and end cap (`fist` / `foot` / `cannon`). All limbs use ctx.translate + ctx.rotate so they're connected to the body. Render order: back leg → back arm → torso → front leg → front arm → head, so depth reads right.

2. **Pose-based fight animations** — every melee swing computes `frontArmUpper / Lower / backArmUpper / Lower / frontLegUpper / Lower / backLegUpper / Lower` from `meleeStage` + `meleeTimer`. PUNCH rotates the back arm from cocked-back (-1.0 rad) to extended-forward (+1.4 rad) over 14 frames, KICK lifts the front leg from down (-0.2) to forward-up (+1.5), UPPERCUT rotates the back arm from forward-low (+1.0) to overhead-back (-1.6) with crouch-to-extend body motion. Walk swing baseline drives subtle idle limb sway.

3. **Boss attack pool expanded from 6 to 12 patterns** — 6 new attacks added on top of the original 6:
   - **HAMMERFIST SWIPE** — boss arm extends in a wide arc toward the player. Live damage frames 8..28, 30 dmg + knockback. Drawn as a thick connecting tube from shoulder to spiked fist.
   - **GROUND SLAM** — 50f wind-up (chest pulses red, ground danger ring telegraphs), then AOE shockwave + 8 lava globs erupt outward. 28 direct dmg if grounded within 220px.
   - **TITAN CHARGE** — 36f telegraph, then 60f of charge motion across the arena. Trail of magenta/orange particles + motion-blur ghosts. 36 dmg + heavy knockback on body collision. Cancels boss patrol while active.
   - **DRONE SWARM** — spawns 5/6/8 homing drone minions (more in space + phase 3) that orbit the boss for ~50f then track the player. Drone HP 60, deal 14 dmg on contact-explode. Killable with bullets or melee.
   - **LASER GRID** — 40f telegraph, then two vertical beams + two ground-lava patches that linger for 130f (beams) / 200f (lava). 12 / 8 damage if you stand in them.
   - **PLASMA RAIN** (phase 3 only) — 10 vertical pillars rain across the arena over ~90f + leave 220f-lifetime lava patches. 18 dmg per pillar.

4. **Phase 3 RAGE state at 25% HP** — triggers `phase3Triggered`, sets `boss.phase = 3`, plays a triple-shockwave + 60-particle entrance, screen flash, "⚠ FINAL RAGE ⚠" hit-text banner. Phase 3 unlocks PLASMA RAIN, drops attack-cooldown windows by ~30%, immediately drops 6 plasma pillars on entry. Phase 3 re-arms when life 2 begins (full HP refill, but rage state can trigger again at 25%).

5. **Hazard system** — new `boss.hazards` array (kinds: `beam`, `lava`, `rain`). Each entry has `{ x, y, w, h, life, color, dmg, telegraph }`. Update tick handles motion (rain falls), telegraph countdown (no damage during), AABB damage check against player. Drawn before bullets so they read as floor-level.

6. **Minion system** — new `finale.minions` array. Each minion: `{ x, y, vx, vy, hp, orbitAng, orbitTimer, spawnFlash }`. Spawn cycle: appear at boss with 12f flash → orbit boss 50-80f at radius 60 → home toward player with steering force 0.35. Take damage from bullets, instant-death from any active melee swing.

7. **Boss melee + reaction tweaks** — boss patrol/orbit drift now skips while charging, knocked-back, or staggered (was overriding `chargeVx`). New `armAttackTimer` / `slamWindup` / `chargeTimer` / `minionsToSpawn` fields on the boss.

8. **HUD** — boss HP bar shows `[PH2]` / `[PH3 RAGE]` tag suffix. Hit-text feedback added for boss-side hits ("SMACK!" on hammerfist, "BLOCKED!" on charge body-check, "SMASH!" on melee-killed minion).

9. **Boss draw additions** — hammerfist limb connection from shoulder→fist with knuckle spikes, slam wind-up chest swell + ground-danger ring telegraph, charge motion-blur ghost trail.

10. **Boss HP bumped 4500 → 6500** per life. Total HP across both lives is now 13,000 (up from 9,000). Combined with phase 3's extra attacks, fight is meaningfully longer.

### Notable code pointers (v2)

- `drawFinaleLimb` — top-level helper above `drawFinalePlayer`. Used for both arms and legs.
- `drawFinalePlayer` — fully rewritten, computes pose from animation state, calls `drawFinaleLimb` 4× (legs + arms).
- `finaleBossAttack` — 12-pattern switch (`if (next === 0..11)`).
- Boss tick logic for new attacks lives in `updateFinaleBattle` between the AI variable section and phase 2 detection.
- `boss.hazards` — declarative hazard array; tick + draw both iterate.
- `finale.minions` — drone swarm. Killable; collide with player.
- Phase 3 trigger immediately after phase 2 trigger in the same block.

### Pending work (good prompts for the next session)

1. **Boss death animations per life** — life-1 ending could use a more dramatic stagger-into-explosion pose; life-2 could literally rip apart limb-by-limb.
2. **Player taking direct boss melee damage during the swing** — currently the hammerfist hit applies damage directly, but the boss arm doesn't respect player's dash/parry counters. Add parry support: if player presses a counter key during armAttackTimer 8..28, reflect the swing.
3. **Mid-fight quips** — phase 2 / phase 3 / life 2 entries could each spawn one-line dialogue popups instead of just banner text.
4. **Boss form-shift cinematic** — when entering phase 3, the boss could briefly transform (sprout extra arms / split chest core / grow horns).
5. **Tighter clash interactions** — clash currently only triggers from telegraphTimer. Could extend to clash-on-hammerfist, clash-on-charge, clash-on-slam-windup for richer reactive play.

---

## ⚡ MOST RECENT SESSION (May 25, 2026 — Late)

Freshest context. The session focused on making the EARTHBREAKER finale fight feel like an actual Transformers-style brawl with melee combat and aerial flight.

### What changed in this session (in order)

1. **Melee combat in the finale** (`G` key, 3-hit chain) — punch / kick / uppercut. Each press advances `player.meleeStage`; chain window resets after 30 frames.
   - Stage 1 PUNCH: 90 dmg, 16f cooldown, energy-fist trail.
   - Stage 2 KICK: 110 dmg, 16f cooldown, crescent arc trail.
   - Stage 3 UPPERCUT: 220 dmg, 32f cooldown, big magenta+orange explosion, **slow-mo** (factor 0.4 for 30f), launches boss upward in space form.
   - Whiff still consumes the press but doesn't reset the chain (forgiving).
   - Hits trigger boss `stagger` (30f normal, 80f uppercut), boss `knockback` (drift along its `knockbackVx/Vy`), `hitFlash` (white tint), and `shakeOffset` (micro-shake decay).
   - Combo counter (`player.comboCount`) increments on every connect, displays "N HIT COMBO!" at center-bottom for 90f. Color escalates blue → orange → magenta at 3 / 5 hits.

2. **CLASH mechanic** — punching/kicking the boss while its `telegraphTimer > 6` triggers a clash. Cancels the boss attack, both rebound, slow-mo (0.35 for 24f), sparks ring at the midpoint, "CLASH!" text in gold. The forgiving counter to bullet-spam patterns.

3. **JET BOOSTER flight** (hold `SPACE` while airborne) — Transformers-style mid-air thrust. New `player.jetFuel` (max 100) drains at 0.9/f in city, 0.6/f in space. Refuels +1.5/f on ground, +0.5/f passively in space. Twin exhaust flames render from the boots whenever `player.jetActive` is true. The double-jump still works first; jet boost takes over after.

4. **Slow-mo system** — `finale.slowMo` (1.0 normal, lower = slower) with `finale.slowMoTimer` countdown. All bullets and gravity tick scaled by `slowMo`. Triggers: clash (0.35 / 24f), uppercut (0.4 / 30f). Visual: subtle blue desaturation overlay during slow-mo.

5. **Hit-text popups** — floating "PUNCH!" / "KICK!" / "UPPERCUT!" / "CLASH!" text rendered via new `finale.hitTexts` array. Each pops up at the boss, drifts up, fades over 50f. Color-coded (blue / blue / magenta / gold).

6. **Boss stagger reactions** — boss tilts back during stagger (visual `staggerLean = sin(stagger * 0.5) * 8`), flashes white during `hitFlash > 0`, won't fire while `stagger > 0` (prevents stunlock-into-death-spam). Knockback drift uses `knockbackVx/Vy` damped by 0.88/0.92 per frame.

7. **Low-HP boss FX** — under 35% HP the boss emits dark smoke trail particles every 4f; under 20% HP also shoots up sparks every 6f. Damaged-mech vibes.

8. **Beefier city→space ascent** — accelerating velocity (`-1.5 - (t-80)*0.04`), twin jet exhaust trails from the boots, vertical cloud streaks during atmosphere phase (t<150), expanding speed-line shockwaves every 30f. `player.jetActive = true` set during the ascent so the boots render with thruster flames.

9. **HUD additions** — bottom-left now shows DASH / **MELEE** / SPECIAL cooldown squares plus a JET fuel gauge (110px, color shifts to red below 15%). Combo counter floats at center-bottom when `comboCount >= 2`.

10. **Boss attack gated by stagger** — the `if (b.attackTimer <= 0)` trigger is now `if (b.attackTimer <= 0 && b.stagger <= 0)` so the boss can't fire while staggered. Meaningful payoff for landing the combo.

### Notable code pointers (current state)

- All finale state lives in the global `finale = { ... }` object created by `startFinale()`.
- Player melee state: `meleeTimer / meleeCooldown / meleeStage / meleeChain / comboCount / comboTimer`.
- Player jet state: `jetFuel / jetMax / jetActive / jetExhaustPhase`.
- Boss reaction state: `stagger / hitFlash / shakeOffset / knockback / knockbackVx / knockbackVy / launchVy`.
- Slow-mo: `finale.slowMo` (multiplier), `finale.slowMoTimer` (frames remaining).
- Hit text: `finale.hitTexts` array, drawn after particles.
- Melee logic: in `updateFinaleBattle` directly after the SPECIAL key block (~line 18092).
- Jet logic: in `updateFinaleBattle` directly after the JUMP block (~line 18016).
- Bullet update applies `* sm` slow-mo factor.
- Player rendering adds `=== Melee swing FX ===` block (fist/foot/uppercut visuals) and `=== Jet exhaust trails ===` block (boot thrusters).
- Boss rendering applies `staggerLean + shake` to `cx`, draws low-HP smoke + sparks, applies `hitFlash` white overlay.

---

## ⚡ Previous Session — May 25, 2026 (Earlier)

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
├── game.js             # Entire game (~25,000 lines)
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

