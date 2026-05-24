# NEON RUSH — Project Context

A 2D action platformer + space dogfighter built in vanilla HTML5 Canvas + JavaScript. Inspired by Mega Man, Dead Cells, Hades, **Transformers**, and modern PS-style action platformers. Heavy emphasis on cinematics, screen-juice (hitstop, shake, flashes, shockwaves), varied combat moves (dash, dodge roll, parry, ground pound, melee combo), and **vehicle transformation**.

## Files

```
/Users/darrwang/Downloads/nicholas/
├── index.html          # Page wrapper, canvas, dev panel + keyboard shortcuts (~396 lines)
├── game.js             # Entire game (~13,859 lines)
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
- `stageComplete` — between-stage screen
- `dead` — game over
- `won` — final victory

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
| E | Open shop (when near a shop) |
| ENTER | Start / advance dialogue / continue |
| L (in shop) | Evolve (costs Robot Coins) |

### Dev shortcuts (always active during gameplay)

| Key | Action |
|-----|--------|
| **1-8** | **Skip directly to that stage's boss** (1=GUARD-1, 7=OMEGA-PRIME, 8=TITAN-LORD) |
| **0** | Start a space battle for the current sector |
| **9** | Toggle GOD MODE (auto-heal + invincibility) |

🛠 DEV button (top-right) opens a panel with all boss-skip and utility buttons (FULL HEAL, +50 RC, +1000¢, EVOLVE, GOD MODE, KILL BOSS, UNLOCK ALL, SPACE BATTLE).

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

## Enemy Types (14 total)

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

- **Coins** — buy weapons and stat upgrades
- **Robot Coins (RC)** — evolution. Drop from elite enemies:
  - Boss: 18 RC
  - Mini-boss (HYDRA): 10 RC
  - HYDRA-WALKER: 5 RC
  - Mech / SCORPION-BOT: 4 RC
  - Heavy/Sniper: 3 RC
  - Shielder/Jumper: 2 RC
  - Bomber/Sprinter/Turret: 1 RC

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

1. **PRIME/CONVOY use starfighter vehicle** — they currently inherit APEX's vehicle form. Could give PRIME its own jet variant and CONVOY a semi-truck.
2. **Per-boss unique phase-3 attacks** — currently all bosses share the generic 12-bullet rage burst. Could specialize (e.g. INFERNO-X spits a wall of lava globs in phase 3, OMEGA-PRIME does triple twin-laser-eye burst, etc.).
3. **Boss transformations** — the user asked for bosses to TRANSFORM. Currently only TITAN-LORD does (mech↔ship). Could add transformations to GUARD-1 (riot car), SKYHAMMER (full jet), RAVAGER (scorpion-tank), etc. Started but not implemented in the latest pass.
4. **No sound effects** — game is fully silent. Web Audio API additions would significantly enhance feel.
5. **No save system** — every run starts fresh. Could add localStorage for unlocked characters/weapons.
6. **Performance** — bullet/particle counts can spike during boss circle bursts (less of an issue now that some patterns were trimmed).
7. **Dead helper code** — old portrait helpers (drawPortraitChest, drawPortraitHead, drawHelmetShape, etc.) exist after the new drawRobotPortrait but are unused.
8. **HYDRA mini-boss in Stage 6** — already exists from older work; the new HYDRA-WALKER is a distinct smaller patrol enemy.
9. **PRIME/CONVOY vehicle types** — line in `transform handler`: `const vTypes = ['bike', 'hover', 'tank', 'jet', 'starfighter']; player.vehicleType = vTypes[Math.min(player.evoLevel, vTypes.length - 1)];` — need to extend to 'primejet' and 'semi' for tiers 5/6.

---

## How to Resume Development

1. Open `/Users/darrwang/Downloads/nicholas/` in your editor
2. Open `index.html` in a browser to test (no build needed)
3. **Press 1-8 to test any boss instantly** (1=GUARD-1, 7=OMEGA-PRIME with throne cinematic, 8=TITAN-LORD)
4. **Press 9 to toggle GOD MODE** for testing
5. **Press X in gameplay to transform** to vehicle
6. Read this file + scan `game.js` to refresh context
7. Common things to ask for:
   - **Boss transformations** (the user has asked multiple times for bosses to fold into vehicles like TITAN-LORD does)
   - **Per-boss unique phase-3 attacks** (specialize the rage burst)
   - **PRIME/CONVOY unique vehicle forms** (jet variant + semi-truck)
   - Add sound effects (Web Audio API)
   - Add save system (localStorage for unlocks)
   - New monster types
   - More cutscenes / character lore
   - Tweak balance (boss HP, character HP, RC costs)
   - Polish UI / HUD
   - Add new mission puzzle types
   - Mobile/touch controls

---

## Game Stats Summary

- **~13,859 lines** of code in game.js
- ~396 lines in index.html
- **8 main stages** + 7 space transitions + Omega throne cinematic + per-boss intro cinematics
- **9 main bosses** (GUARD-1, SKYHAMMER, INFERNO-X, RAVAGER, CRYO-LORD, NULLIFIER, OMEGA-PRIME, TITAN-LORD) + 1 mini-boss (HYDRA)
  - Each has 3 phases (rage at 25% HP)
  - TITAN-LORD transforms to battleship at 50% HP
- **14 enemy types**
- **19 weapons**
- **8 playable characters**
- **7 evolution tiers** with anime transformation cinematic
- **5 vehicle forms** (bike/hover/tank/jet/starfighter) with per-vehicle physics + projectiles
- 7 rescue allies (max 2 active)
- Mission puzzle entities: keys, laser grids, terminals
- 7 movement abilities: walk, jump, double/triple/quadruple jump (per evo), wall jump, dash, dodge roll, slide
- 3 defensive moves: parry, ground pound, perfect dodge
- 3-hit melee combo
- Cutscene types: boss intro (per-subtype), victory, space transit, evolution, throne
- Dev tools: 🛠 button + keyboard shortcuts (1-8, 0, 9)
