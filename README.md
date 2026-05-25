# NEON RUSH

It's a game where you have to platform your way through robots, collect coins for upgrades, and fight bosses to save other characters to help you in battle.

A 2D action platformer + space dogfighter built in vanilla HTML5 Canvas + JavaScript. Inspired by Mega Man, Dead Cells, Hades, and Transformers, with heavy emphasis on cinematics, screen-juice, varied combat moves, and vehicle transformation.

## How to play

No build, no install. Just open `index.html` in a browser.

```bash
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

## Controls

| Key | Action |
|-----|--------|
| `A`/`D` or `←`/`→` | Move |
| `↑`/`W`/`SPACE` | Jump (double/triple/quadruple jump unlocks with evolution) |
| `SHIFT` | Dash (perfect-dodge bullets for slow-mo) |
| `CTRL` | Dodge roll (i-frame escape) |
| `C` | Parry (reflects bullets at 2× damage) |
| `S`/`↓` in air | Ground pound (AOE shockwave on landing) |
| `F` | Shoot |
| `↑`/`↓` while shooting | Angle shots up/down |
| `G` | Melee combo (3-hit, finisher AOE) |
| `Q` | Character ability |
| `R` | Evolution ability |
| `X` | Transform to vehicle / back to robot |
| `TAB` | Swap character |
| `E` | Open shop / use ⚒ craft bench / use ⚕ healing station |
| `M` | Mute / unmute audio |
| `ENTER` | Start / advance dialogue |
| `L` (in shop) | Evolve (costs Robot Coins) |

### Dev shortcuts

| Key | Action |
|-----|--------|
| `1`–`8` | Skip to that stage's boss |
| `0` | Start a space battle |
| `9` | Toggle GOD MODE |

The 🛠 DEV button (top-right) opens a panel with full heal, give RC/coins, force evolve, kill boss, unlock all, etc.

## Features

- **8 main stages** with cinematic boss intros and per-stage themes
- **9 unique bosses** with 3-phase fights (rage mode at 25% HP)
- **7 evolution tiers** BASE → MK-II → MK-III → OMEGA → APEX → PRIME → CONVOY
- **5 vehicle forms** including the Optimus-style hovertank with Matrix Ion Blast
- **Energon Axe** melee at the CONVOY tier — massive damage with crescent slash AOE finisher
- **8 playable characters** with unique Q abilities (TIME SLOW, PHASE DASH, SHOCKWAVE, etc.)
- **19 weapons** (8 boss-themed + 11 shop weapons)
- **15 enemy types** (14 mobs + the WARDEN-K mini-boss)
- **WARDEN-K mini-boss antechamber** between the level and the boss arena on stages 3-8 — three-claw sentinel that drops spike eruptions and orbital sentry orbs
- Mission-impossible key/laser/terminal puzzle every stage
- ⚕ **Healing stations** scattered through every stage — press `E` to repair to full, partial heal to allies in range, 6s recharge
- 🔩 **Scrap** currency from breakables and enemies, used at the **⚒ craft bench** for permanent stat upgrades and consumables (REPAIR KIT, ARMOR PLATE, AMMO OVERCHARGE, etc.)
- **Procedural Web Audio** — synthwave/industrial soundtrack + 24 SFX, generated at runtime (no audio files)
- **Save system** — localStorage persistence for unlocked characters, weapons, audio settings, and meta stats
- Combat: 3-hit melee combo, dodge roll, parry with reflection, ground pound, perfect-dodge slow-mo, headshot crits
- Cinematic systems: boss intros, evolution transformation, OMEGA-PRIME throne stand-up, space-transition warp ambushes

## Files

```
index.html          # Page wrapper, canvas, dev panel, audio panel (~674 lines)
game.js             # Entire game (~19,700 lines)
PROJECT_CONTEXT.md  # Detailed dev/design documentation
```

## Tech

- Vanilla HTML5 Canvas 2D
- No frameworks, no build step, no dependencies
- Single file (`game.js`) with global state and a `requestAnimationFrame` loop
- Runs in any modern browser
