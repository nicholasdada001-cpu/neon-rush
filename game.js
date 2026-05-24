// NEON RUSH - Parkour Shooter with Robot Enemies
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 1000;
canvas.height = 600;

// Game state
let gameState = 'intro'; // intro, charSelect, midCharSelect, playing, dead, won, stageComplete, cutscene, paused, spaceTransition
let currentStage = 0;
let charSelectIndex = 0;
let screenShake = 0;
let camera = { x: 0, y: 0 };
let score = 0;
let particles = [];
let bullets = [];
let enemyBullets = [];
let enemies = [];
let platforms = [];
let shops = [];
let dangerZones = [];
let activeWarning = null; // { text, timer, intensity }
let keys = {};
let mouse = { x: 0, y: 0, down: false };
let lastTime = 0;
let dashTrails = [];
let damageNumbers = [];   // floating damage popups when an enemy is hit
let hitFlash = 0;         // red overlay when the player takes damage
let critFlash = 0;        // gold overlay on crit hits
let hitStop = 0;          // frames of hitstop (paused gameplay) for impact
let bgStars = [];         // procedural parallax stars behind levels
let shockwaves = [];      // expanding rings on big explosions / crits
let evoTransform = null;  // active evolution transformation cinematic { fromLevel, toLevel, timer, duration }
let bossDefeatCutscene = null;  // post-boss victory dialogue { lines, idx, timer, nextState }
let throneCutscene = null;  // Omega throne stand-up cinematic before final boss dialogue
let bossIntro = null;       // generic per-subtype boss-intro cinematic before dialogue
let stageBgTint = '#0a0a0f';

// Weapon definitions - tier 0 starter, tiers 1-7 are unique boss-themed weapons.
// Each weapon has a "special" property describing its unique gameplay effect.
// Damage and fire rates rebalanced to be less overpowered overall — fights feel more fair.
const WEAPONS = [
    {
        name: 'PISTOL',  tier: 0,
        damage: 16, speed: 14, cooldown: 11, bullets: 1, spread: 0,
        color: '#ffff66', glow: '#ffff00', size: 6, life: 70,
        flavor: 'Standard issue. Reliable.'
    },
    {
        name: 'GUARD CANNON',  tier: 1,
        damage: 16, speed: 16, cooldown: 16, bullets: 3, spread: 0.22,
        color: '#ff66dd', glow: '#ff00aa', size: 6, life: 80,
        flavor: 'Triple spread shot.'
    },
    {
        name: 'STORM HAMMER',  tier: 2,
        damage: 32, speed: 11, cooldown: 34, bullets: 1, spread: 0,
        color: '#44aaff', glow: '#0088ff', size: 11, life: 110,
        explosive: true, aoeRadius: 95,
        flavor: 'Lobbed cluster bomb. Big AOE.'
    },
    {
        name: 'INFERNO RIFLE',  tier: 3,
        damage: 11, speed: 17, cooldown: 6, bullets: 1, spread: 0.1,
        color: '#ff5500', glow: '#ff2200', size: 6, life: 80,
        burn: true, burnDmg: 4, burnDur: 70,
        flavor: 'Rapid fire that burns enemies.'
    },
    {
        name: 'RAVAGER FANG',  tier: 4,
        damage: 11, speed: 20, cooldown: 5, bullets: 1, spread: 0.2,
        color: '#88ff44', glow: '#22ff00', size: 5, life: 70,
        flavor: 'Full auto chain-gun. Hold F to spray.'
    },
    {
        name: 'FROST CANNON',  tier: 5,
        damage: 36, speed: 14, cooldown: 19, bullets: 1, spread: 0,
        color: '#aaeeff', glow: '#66ccff', size: 11, life: 100, pierce: true,
        slow: true, slowFactor: 0.5, slowDur: 70,
        flavor: 'Pierces and slows enemies.'
    },
    {
        name: 'VOID PIERCER',  tier: 6,
        damage: 56, speed: 26, cooldown: 26, bullets: 1, spread: 0,
        color: '#cc66ff', glow: '#aa00ff', size: 8, life: 120, pierce: true,
        flavor: 'Hyper-velocity rail shot.'
    },
    {
        name: 'OMEGA BLASTER',  tier: 7,
        damage: 95, speed: 26, cooldown: 38, bullets: 3, spread: 0.1,
        color: '#ffffff', glow: '#ffff00', size: 12, life: 130, pierce: true, explosive: true, aoeRadius: 75,
        flavor: 'Three piercing explosive shots.'
    },
    // Shop weapons - several tiers, more variety
    {
        name: 'BURST RIFLE', tier: 8, shopOnly: true, cost: 200,
        damage: 13, speed: 18, cooldown: 7, bullets: 1, spread: 0.05,
        color: '#88ffaa', glow: '#44ff66', size: 5, life: 85,
        flavor: 'Solid fast rifle. Mid-cost.'
    },
    {
        name: 'SCATTER GUN', tier: 9, shopOnly: true, cost: 280,
        damage: 8, speed: 14, cooldown: 19, bullets: 7, spread: 0.5,
        color: '#ffaa66', glow: '#ff6622', size: 5, life: 45,
        flavor: 'Shop shotgun. 7-pellet spread.'
    },
    {
        name: 'TWIN BLASTER', tier: 10, shopOnly: true, cost: 350,
        damage: 13, speed: 16, cooldown: 10, bullets: 2, spread: 0.07,
        color: '#ff88ff', glow: '#ff44ff', size: 6, life: 80,
        flavor: 'Dual barrel pistol.'
    },
    {
        name: 'SNIPER', tier: 11, shopOnly: true, cost: 500,
        damage: 70, speed: 28, cooldown: 36, bullets: 1, spread: 0,
        color: '#aaccff', glow: '#0088ff', size: 7, life: 130, pierce: true,
        flavor: 'Slow, devastating, pierces.'
    },
    {
        name: 'FLAME THROWER', tier: 12, shopOnly: true, cost: 420,
        damage: 6, speed: 9, cooldown: 3, bullets: 1, spread: 0.28,
        color: '#ff8800', glow: '#ff4400', size: 8, life: 35,
        burn: true, burnDmg: 3, burnDur: 55,
        flavor: 'Short range, burns everything.'
    },
    {
        name: 'BFG-9000', tier: 13, shopOnly: true, cost: 800,
        damage: 160, speed: 13, cooldown: 60, bullets: 1, spread: 0,
        color: '#00ff00', glow: '#88ff00', size: 16, life: 150,
        explosive: true, aoeRadius: 150,
        flavor: 'Massive plasma orb. Huge AOE.'
    },
    {
        name: 'AUTO PISTOL', tier: 14, shopOnly: true, cost: 150,
        damage: 10, speed: 16, cooldown: 5, bullets: 1, spread: 0.06,
        color: '#ffcc88', glow: '#ffaa44', size: 5, life: 75,
        flavor: 'Cheap full-auto starter upgrade.'
    },
    {
        name: 'GRENADE LAUNCHER', tier: 15, shopOnly: true, cost: 600,
        damage: 60, speed: 9, cooldown: 38, bullets: 1, spread: 0,
        color: '#88ff44', glow: '#44ff00', size: 13, life: 130,
        explosive: true, aoeRadius: 120,
        flavor: 'Lobs explosive grenades. Big AOE.'
    },
    {
        name: 'PLASMA RIFLE', tier: 16, shopOnly: true, cost: 550,
        damage: 28, speed: 18, cooldown: 9, bullets: 1, spread: 0.04,
        color: '#88ffff', glow: '#00ffff', size: 7, life: 95, pierce: true,
        flavor: 'Fast-firing piercing energy beam.'
    },
    {
        name: 'CHAOS MORTAR', tier: 17, shopOnly: true, cost: 700,
        damage: 20, speed: 12, cooldown: 16, bullets: 4, spread: 0.55,
        color: '#ff44aa', glow: '#ff0066', size: 7, life: 75,
        explosive: true, aoeRadius: 60,
        flavor: 'Quad chaos shells with mini explosions.'
    },
    {
        name: 'SOUL CANNON', tier: 18, shopOnly: true, cost: 950,
        damage: 44, speed: 20, cooldown: 11, bullets: 2, spread: 0.05,
        color: '#ddaaff', glow: '#aa44ff', size: 8, life: 110, pierce: true,
        burn: true, burnDmg: 5, burnDur: 55,
        flavor: 'Twin piercing rounds that burn souls.'
    }
];

// Characters - playable archetypes with different stats and special abilities
const CHARACTERS = [
    {
        name: 'STRIKER',
        desc: 'Balanced hero. Q: TIME SLOW (3s, slows enemies)',
        speed: 3.4, jumpForce: -10.8, gravity: 0.45,
        maxHp: 220, dashRange: 11, fireRateMul: 1, dmgMul: 1,
        color: '#00ddff', accent: '#00ffaa',
        ability: 'timeslow', abilityCooldown: 600,
        unlocked: true
    },
    {
        name: 'SHADOW',
        desc: 'Fast and agile. Q: PHASE DASH (becomes invincible)',
        speed: 4.0, jumpForce: -10.5, gravity: 0.42,
        maxHp: 160, dashRange: 13, fireRateMul: 0.85, dmgMul: 0.85,
        color: '#aa00ff', accent: '#ff66ff',
        extraJumps: 1,
        ability: 'phase', abilityCooldown: 480,
        unlocked: false, unlockedBy: 1
    },
    {
        name: 'TANK',
        desc: 'High HP. Q: SHOCKWAVE (kills nearby enemies)',
        speed: 2.7, jumpForce: -9.5, gravity: 0.55,
        maxHp: 350, dashRange: 9, fireRateMul: 1.15, dmgMul: 1.4,
        color: '#ff4400', accent: '#ffaa00',
        ability: 'shockwave', abilityCooldown: 720,
        unlocked: false, unlockedBy: 2
    },
    {
        name: 'GHOST',
        desc: 'Master of air. Q: AIR HOVER (float for 3s)',
        speed: 3.5, jumpForce: -11.5, gravity: 0.35,
        maxHp: 190, dashRange: 16, fireRateMul: 0.95, dmgMul: 1,
        color: '#88ffff', accent: '#ffffff',
        ability: 'hover', abilityCooldown: 540,
        unlocked: false, unlockedBy: 3
    },
    {
        name: 'GUNSLINGER',
        desc: 'Glass cannon. Q: BULLET STORM (massive fire rate buff)',
        speed: 3.5, jumpForce: -10.5, gravity: 0.45,
        maxHp: 190, dashRange: 11, fireRateMul: 0.65, dmgMul: 1.1,
        color: '#ffaa00', accent: '#ffff00',
        ability: 'bulletstorm', abilityCooldown: 660,
        unlocked: false, unlockedBy: 4
    },
    {
        name: 'CRYO',
        desc: 'Frost knight. Q: FREEZE BLAST (freezes all on screen)',
        speed: 3.3, jumpForce: -10.5, gravity: 0.45,
        maxHp: 260, dashRange: 12, fireRateMul: 0.95, dmgMul: 1.15,
        color: '#88ccff', accent: '#ddffff',
        ability: 'freeze', abilityCooldown: 660,
        unlocked: false, unlockedBy: 5
    },
    {
        name: 'VOIDWALKER',
        desc: 'Phaser. Q: TELEPORT (warp to mouse... uh, far ahead)',
        speed: 3.6, jumpForce: -10.8, gravity: 0.43,
        maxHp: 230, dashRange: 13, fireRateMul: 0.9, dmgMul: 1.15,
        color: '#aa44ff', accent: '#ff88ff',
        extraJumps: 1,
        ability: 'teleport', abilityCooldown: 480,
        unlocked: false, unlockedBy: 6
    },
    {
        name: 'OMEGA',
        desc: 'The ultimate. Q: ANNIHILATE (massive damage to all)',
        speed: 3.8, jumpForce: -11, gravity: 0.43,
        maxHp: 320, dashRange: 14, fireRateMul: 0.75, dmgMul: 1.3,
        color: '#ffffff', accent: '#ff00ff',
        extraJumps: 1,
        ability: 'annihilate', abilityCooldown: 900,
        unlocked: false, unlockedBy: 7
    }
];

let selectedChar = 0;

// Evolution tiers - spend Robot Coins (RC) at shops. Each tier adds visual mods + stats + a special active ability.
const EVOLUTIONS = [
    {
        name: 'BASE',    rcCost: 0,    hpBonus: 0,   dmgBonus: 1.0, speedBonus: 0,
        sideArm: null,
        ability: null, abilityKey: null,
        description: 'Standard frame. No augmentations.',
        upgrades: []
    },
    {
        name: 'MK-II',   rcCost: 16,   hpBonus: 60,  dmgBonus: 1.25, speedBonus: 0.4,
        sizeBonus: 6,
        widthBonus: 2,    // narrow gain (stays sleek)
        heightBonus: 12,  // taller frame
        sideArm: 'pulse',
        ability: 'pulseShot', abilityKey: 'KeyR',
        description: 'Twin pulse cannons mounted on shoulders. Larger frame.',
        upgrades: [
            '+60 Max HP',
            '+25% Damage',
            '+0.4 Move Speed',
            'Frame size +6 (bigger silhouette)',
            'Pulse cannon side-arm (auto-fires with main shot)',
            '[R] PULSE BURST - 3 quick energy shots'
        ]
    },
    {
        name: 'MK-III',  rcCost: 38,   hpBonus: 120, dmgBonus: 1.55, speedBonus: 0.6,
        sizeBonus: 8,
        widthBonus: 3,    // still narrow, more chest plate
        heightBonus: 18,  // significantly taller — Optimus Prime-style
        sideArm: 'rocket',
        ability: 'rocketBarrage', abilityKey: 'KeyR',
        description: 'Heavy rocket launcher + jetpack frame. Towering build.',
        upgrades: [
            '+120 Max HP',
            '+55% Damage',
            '+0.6 Move Speed',
            'Frame size +8 (heavy mech)',
            'Twin rocket launcher (auto-fires with main shot)',
            '[R] ROCKET BARRAGE - 5 homing rockets',
            'Jetpack: +1 air dash'
        ]
    },
    {
        name: 'OMEGA',   rcCost: 75,   hpBonus: 250, dmgBonus: 2.0, speedBonus: 0.9,
        sizeBonus: 10,
        widthBonus: 4,    // commanding shoulders, still proportionate
        heightBonus: 38,  // colossal vertical presence (boosted from 26)
        sideArm: 'omega',
        ability: 'omegaBlast', abilityKey: 'KeyR',
        description: 'Final form. Plasma core + missile array. Colossal frame.',
        upgrades: [
            '+250 Max HP',
            '+100% Damage (DOUBLE)',
            '+0.9 Move Speed',
            'Frame size +10 (colossus)',
            'Quad missile array (auto-fires with main shot)',
            '[R] OMEGA BLAST - massive AOE plasma wave',
            'Aura damage: enemies near you take burn damage',
            'Permanent damage immunity flicker'
        ]
    },
    {
        name: 'APEX',    rcCost: 130,  hpBonus: 400, dmgBonus: 2.6, speedBonus: 1.2,
        sizeBonus: 12,
        widthBonus: 5,    // ascended shoulders, plated chest
        heightBonus: 50,  // skyscraper-tall — Convoy/Apex tier (boosted from 34)
        sideArm: 'apex',
        ability: 'apexNova', abilityKey: 'KeyR',
        description: 'Ascended frame. Quad plasma cannons + halo blade rig. Skyscraper-tall.',
        upgrades: [
            '+400 Max HP',
            '+160% Damage (2.6×)',
            '+1.2 Move Speed',
            'Frame size +12 (titan tier)',
            'Quad plasma cannons (auto-fires with main shot)',
            '[R] APEX NOVA — full-screen plasma flash',
            'Halo blade rig orbits player',
            'Aura damage doubled (vs OMEGA)',
            'Bullet reflection while dashing'
        ]
    },
    {
        name: 'PRIME',   rcCost: 60,   hpBonus: 600, dmgBonus: 3.4, speedBonus: 1.5,
        sizeBonus: 14,
        widthBonus: 3,    // narrower than APEX — proportional, not fat
        heightBonus: 90,  // way taller — Prime/Convoy proportions, towering (boosted from 70)
        sideArm: 'prime',
        ability: 'primeBeam', abilityKey: 'KeyR',
        description: 'Triple-form Prime frame. Tank treads on the legs, jet wings on the back, dual sword rigs.',
        upgrades: [
            '+600 Max HP',
            '+240% Damage (3.4×)',
            '+1.5 Move Speed',
            'Frame size +14 (Prime class — towering height)',
            'Six-cannon side-arm volley (auto-fires)',
            '[R] PRIME BEAM — sweeping orbital cannon',
            'Tank tread legs (visible on robot)',
            'Folding jet wings (visible on back)',
            'Triple jump baseline'
        ]
    },
    {
        name: 'CONVOY',  rcCost: 80,   hpBonus: 900, dmgBonus: 4.5, speedBonus: 1.9,
        sizeBonus: 16,
        widthBonus: 4,    // narrower body — Convoy is TALL, not bulky
        heightBonus: 130, // skyscraper-tall — true Optimus-Convoy proportions (boosted from 100)
        sideArm: 'convoy',
        ability: 'convoyMatrix', abilityKey: 'KeyR',
        description: 'CONVOY frame. Truck-cab shoulders, dual-sword rig, full vehicle plating. Final form.',
        upgrades: [
            '+900 Max HP',
            '+350% Damage (4.5×)',
            '+1.9 Move Speed',
            'Frame size +16 (Convoy class — towering)',
            'Eight-cannon side-arm storm (auto-fires)',
            '[R] CONVOY MATRIX — screen-clear holy beam',
            'Truck-cab shoulders + visible vehicle hood plating',
            'Dual sword rig (animated)',
            'Quadruple jump baseline',
            'Aura tier 3: enemies in 200px take 16 dmg/30f',
            '+10% damage reduction (innate)'
        ]
    }
];

// Coloration overlays for each evo tier
const EVO_COLORS = [
    null,
    { armor: '#ffaa00', glow: '#ff8800' },
    { armor: '#ff44ff', glow: '#aa00ff' },
    { armor: '#ffffff', glow: '#ffff00' },
    { armor: '#66ffff', glow: '#00ffff' },
    { armor: '#ff3344', glow: '#ff8866' },   // PRIME — hot crimson
    { armor: '#ffd744', glow: '#ff6600' }    // CONVOY — Optimus gold/red
];

// Player - slower, more controllable
const player = {
    x: 100, y: 400, w: 28, h: 40,
    vx: 0, vy: 0,
    speed: 3.2, jumpForce: -10.5, gravity: 0.45,
    onGround: false, onWall: false, wallDir: 0,
    jumps: 0, maxJumps: 2,
    dashCooldown: 0, dashing: false, dashTimer: 0, dashDir: { x: 0, y: 0 },
    hp: 220, maxHp: 220, invincible: 0,
    facing: 1, shootCooldown: 0,
    slideTimer: 0, sliding: false,
    coyoteTime: 0,    // grace period after leaving ground
    jumpBuffer: 0,    // grace period for early jump press
    jumpHeld: false,
    coins: 0,
    robotCoins: 0,            // RC - rare currency for evolution
    evoLevel: 0,              // 0 = base, 1 = MK-II, 2 = MK-III, 3 = OMEGA FORM
    bulletDamage: 0,         // additive damage bonus (from "Damage +5" upgrade)
    weaponTier: 0,            // index into WEAPONS (currently equipped)
    weaponsUnlocked: [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],  // pistol unlocked at start; tiers 8+ are shop weapons
    maxJumpsBonus: 0,         // extra jumps from upgrades
    fireRateMul: 1,           // < 1 = faster
    dmgMul: 1,                // damage multiplier from character
    dashRange: 11,            // dash distance (px per frame * 8 frames)
    charColor: '#00ddff',
    charAccent: '#00ffaa',
    abilityType: 'timeslow',
    abilityCooldown: 600,
    abilityTimer: 0,           // current cooldown
    abilityActiveTimer: 0,     // duration of active effect
    abilityActive: false,
    // Melee combat
    meleeCooldown: 0,
    meleeCombo: 0,             // 0..2 for 3-hit combo
    meleeComboTimer: 0,        // window to chain hits
    meleeAnimTimer: 0,         // visual animation
    // Perfect dodge
    perfectDodgeTimer: 0,
    // === New combat moves ===
    rolling: false,            // dodge-roll active
    rollTimer: 0,              // frames remaining
    rollCooldown: 0,           // cooldown between rolls
    rollDir: 1,                // direction of roll
    rollAnim: 0,               // 0..1 spin progress for rendering
    parrying: false,           // parry window open
    parryTimer: 0,             // frames remaining in parry
    parryCooldown: 0,          // cooldown between parries
    parrySuccess: 0,           // glow timer after a successful parry
    pounding: false,           // ground-pound active
    poundTrail: 0,             // tracking timer for pound visual
    // === Vehicle transformation (X key) ===
    // Holding/pressing X toggles between robot mode and a vehicle form unique
    // to the current evolution tier. Vehicle gains +60% speed, gravity-light
    // hover for some tiers, ram damage on contact, and disables shooting.
    transformed: false,        // true while in vehicle form
    transformAnim: 0,          // 0..1 anim progress for the fold-down/up
    transformDir: 1,           // 1 = transforming TO vehicle, -1 = TO robot
    vehicleType: null,         // 'bike' | 'hover' | 'tank' | 'jet' | 'starfighter'
    transformHeld: false,      // input edge-detect for X
    transformCooldown: 0,      // brief cd so it doesn't strobe
    // Mission key inventory: which keys the player currently holds.
    // Reset on stage advance, ally rescue, and game restart.
    keysHeld: [],
    safeX: 100, safeY: 400  // last known safe ground position (for respawn)
};

// Shop items - upgrades plus mid-tier shop-bought weapons
const SHOP_ITEMS = [
    { key: '1', name: 'Heal +60 HP',         cost: 15, action: p => { p.hp = Math.min(p.maxHp, p.hp + 60); }, repeatable: true },
    { key: '2', name: 'Full Repair',         cost: 40, action: p => { p.hp = p.maxHp; }, repeatable: true },
    { key: '3', name: 'Max HP +25',          cost: 30, action: p => { p.maxHp += 25; p.hp += 25; }, repeatable: true },
    { key: '4', name: 'Damage +5',           cost: 35, action: p => { p.bulletDamage += 5; }, repeatable: true },
    { key: '5', name: 'Speed +0.4',          cost: 25, action: p => { p.speed += 0.4; }, repeatable: true },
    { key: '6', name: 'Triple Jump',         cost: 80, action: p => { p.maxJumpsBonus += 1; }, repeatable: true },
    { key: '7', name: 'Fire Rate +15%',      cost: 60, action: p => { p.fireRateMul *= 0.87; }, repeatable: true },
    { key: '8', name: 'Buy: AUTO PISTOL',    cost: 150, action: p => { p.weaponsUnlocked[14] = true; p.weaponTier = 14; }, weapon: 14 },
    { key: '9', name: 'Buy: BURST RIFLE',    cost: 200, action: p => { p.weaponsUnlocked[8] = true; p.weaponTier = 8; }, weapon: 8 },
    { key: '0', name: 'Buy: SCATTER GUN',    cost: 280, action: p => { p.weaponsUnlocked[9] = true; p.weaponTier = 9; }, weapon: 9 },
    { key: 'Y', name: 'Buy: TWIN BLASTER',   cost: 350, action: p => { p.weaponsUnlocked[10] = true; p.weaponTier = 10; }, weapon: 10 },
    { key: 'U', name: 'Buy: PLASMA RIFLE',   cost: 550, action: p => { p.weaponsUnlocked[16] = true; p.weaponTier = 16; }, weapon: 16 },
    { key: 'I', name: 'Buy: SNIPER',         cost: 500, action: p => { p.weaponsUnlocked[11] = true; p.weaponTier = 11; }, weapon: 11 },
    { key: 'O', name: 'Buy: GRENADE LAUNCH', cost: 600, action: p => { p.weaponsUnlocked[15] = true; p.weaponTier = 15; }, weapon: 15 },
    { key: 'P', name: 'Buy: FLAME THROWER',  cost: 420, action: p => { p.weaponsUnlocked[12] = true; p.weaponTier = 12; }, weapon: 12 },
    { key: 'V', name: 'Buy: CHAOS MORTAR',   cost: 700, action: p => { p.weaponsUnlocked[17] = true; p.weaponTier = 17; }, weapon: 17 },
    { key: 'B', name: 'Buy: SOUL CANNON',    cost: 950, action: p => { p.weaponsUnlocked[18] = true; p.weaponTier = 18; }, weapon: 18 },
    { key: 'N', name: 'Buy: BFG-9000',       cost: 800, action: p => { p.weaponsUnlocked[13] = true; p.weaponTier = 13; }, weapon: 13 },
    { key: 'M', name: 'Switch Weapon ▶',     cost: 0,   action: p => { switchWeapon(p); }, repeatable: true, switcher: true },
    { key: 'L', name: 'EVOLVE',              cost: 0,   action: p => { evolvePlayer(p); }, evolution: true }
];

// Trigger an evolution-specific active ability (R key)
function triggerEvoAbility(name) {
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    const dx = player.facing;
    if (name === 'pulseShot') {
        // 3 quick pulse shots in a tight burst
        for (let i = 0; i < 3; i++) {
            bullets.push({
                x: cx, y: cy + (i - 1) * 6,
                vx: dx * 16, vy: 0,
                life: 80, damage: Math.round(40 * player.dmgMul),
                color: '#ff88ff', glow: '#ff44ff', size: 7,
                pierce: false, hitEnemies: new Set()
            });
        }
        spawnParticles(cx + dx * 24, cy, '#ff44ff', 12, 5);
        screenShake = 8;
    } else if (name === 'rocketBarrage') {
        // 5 homing rockets that arc upward
        for (let i = 0; i < 5; i++) {
            const offset = (i - 2) * 0.18;
            bullets.push({
                x: cx, y: cy - 6,
                vx: dx * (8 + i),
                vy: -4 + offset * 8,
                life: 100, damage: Math.round(70 * player.dmgMul),
                color: '#ff4400', glow: '#ff0000', size: 9,
                pierce: false, hitEnemies: new Set(),
                explosive: true, aoeRadius: 100,
                rocket: true
            });
        }
        spawnParticles(cx, cy, '#ffaa00', 25, 8);
        screenShake = 14;
    } else if (name === 'omegaBlast') {
        // Massive plasma wave around the player. Damages all enemies.
        spawnParticles(cx, cy, '#ffffff', 80, 14);
        spawnParticles(cx, cy, '#ffff00', 60, 10);
        spawnParticles(cx, cy, '#ff00ff', 40, 8);
        screenShake = 32;
        const radius = 350;
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            const ddx = (e.x + e.w/2) - cx;
            const ddy = (e.y + e.h/2) - cy;
            if (ddx * ddx + ddy * ddy < radius * radius) {
                e.hp -= Math.round(180 * player.dmgMul);
                if (e.hp <= 0) handleEnemyKilled(e, i);
            }
        }
        player.invincible = 60;
    } else if (name === 'apexNova') {
        // APEX NOVA — full-screen plasma flash. Damages everything on screen
        // and a wide ring outside. Grants brief i-frames + heal pulse.
        spawnParticles(cx, cy, '#66ffff', 120, 16);
        spawnParticles(cx, cy, '#ffffff', 80, 12);
        spawnParticles(cx, cy, '#00ffff', 60, 10);
        spawnShockwave(cx, cy, 280, '#66ffff');
        spawnShockwave(cx, cy, 460, '#00ffff');
        screenShake = 38;
        critFlash = 16;
        const radius = 520;
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            const ddx = (e.x + e.w/2) - cx;
            const ddy = (e.y + e.h/2) - cy;
            if (ddx * ddx + ddy * ddy < radius * radius) {
                e.hp -= Math.round(260 * player.dmgMul);
                if (e.hp <= 0) handleEnemyKilled(e, i);
            }
        }
        // Also deflect all enemy bullets back as friendly bullets
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const eb = enemyBullets[i];
            bullets.push({
                x: eb.x, y: eb.y,
                vx: -eb.vx * 1.4, vy: -eb.vy * 1.4,
                life: 90, damage: Math.round(50 * player.dmgMul),
                color: '#66ffff', glow: '#00ffff', size: 7,
                pierce: true, hitEnemies: new Set()
            });
            enemyBullets.splice(i, 1);
        }
        player.invincible = 90;
        player.hp = Math.min(player.maxHp, player.hp + 60);
    } else if (name === 'primeBeam') {
        // PRIME BEAM — sweeping orbital crimson beam. Fires a wide horizontal
        // line of damage from the player's position, plus a swirling fire
        // shockwave. Stronger and longer than APEX NOVA.
        spawnParticles(cx, cy, '#ff3344', 140, 18);
        spawnParticles(cx, cy, '#ffaa44', 90, 14);
        spawnShockwave(cx, cy, 320, '#ff3344');
        spawnShockwave(cx, cy, 540, '#ff8866');
        screenShake = 44;
        critFlash = 20;
        // Wide damage box — full screen width centered on player
        const beamY = cy;
        const beamH = 180;
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            const ey = e.y + e.h / 2;
            if (Math.abs(ey - beamY) < beamH / 2) {
                e.hp -= Math.round(380 * player.dmgMul);
                spawnDamageNumber(e.x + e.w/2, e.y, Math.round(380 * player.dmgMul), 'aoe');
                if (e.hp <= 0) handleEnemyKilled(e, i);
            }
        }
        // Visual horizontal beam (timed shockwave wave that extends sideways)
        for (let dx = -800; dx <= 800; dx += 80) {
            spawnShockwave(cx + dx, cy, 100, '#ff3344');
        }
        // Reflect enemy bullets too (Prime is a counter-fighter)
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const eb = enemyBullets[i];
            bullets.push({
                x: eb.x, y: eb.y,
                vx: -eb.vx * 1.6, vy: -eb.vy * 1.6,
                life: 100, damage: Math.round(70 * player.dmgMul),
                color: '#ff6644', glow: '#ff3322', size: 8,
                pierce: true, hitEnemies: new Set()
            });
            enemyBullets.splice(i, 1);
        }
        player.invincible = 110;
        player.hp = Math.min(player.maxHp, player.hp + 90);
    } else if (name === 'convoyMatrix') {
        // CONVOY MATRIX — screen-clearing holy beam from the chest. The
        // canonical "you have failed me" Optimus moment. Damages every enemy
        // on the entire stage segment + extreme heal/i-frames.
        spawnParticles(cx, cy, '#ffd744', 200, 24);
        spawnParticles(cx, cy, '#ffffff', 120, 18);
        spawnParticles(cx, cy, '#ff6600', 100, 14);
        spawnShockwave(cx, cy, 400, '#ffd744');
        spawnShockwave(cx, cy, 700, '#ff6600');
        spawnShockwave(cx, cy, 1100, '#ffffff');
        screenShake = 60;
        critFlash = 30;
        // Damage EVERY enemy on screen (camera range), heavy damage
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            const ex = e.x + e.w / 2;
            const ey = e.y + e.h / 2;
            const camDist = Math.abs(ex - (camera.x + canvas.width / 2));
            if (camDist < canvas.width * 0.9) {
                e.hp -= Math.round(540 * player.dmgMul);
                spawnDamageNumber(ex, e.y, Math.round(540 * player.dmgMul), 'aoe');
                if (e.hp <= 0) handleEnemyKilled(e, i);
            }
        }
        // Wipe ALL enemy bullets on screen
        enemyBullets.length = 0;
        // Visual: vertical beam from above the player
        for (let dy = -300; dy <= 200; dy += 30) {
            spawnShockwave(cx, cy + dy, 110, '#ffd744');
        }
        player.invincible = 150;
        player.hp = player.maxHp;
        if (typeof shopMessage !== 'undefined') {
            shopMessage = { text: '★ TILL ALL ARE ONE ★', timer: 180, color: '#ffd744' };
        }
    }
}

function evolvePlayer(p) {
    const next = p.evoLevel + 1;
    if (next >= EVOLUTIONS.length) {
        shopMessage = { text: 'EVOLUTION MAXED', timer: 90, color: '#ff8844' };
        return;
    }
    const cost = EVOLUTIONS[next].rcCost;
    if (p.robotCoins < cost) {
        shopMessage = { text: `Need ${cost} RC (have ${p.robotCoins})`, timer: 90, color: '#ff3333' };
        return;
    }
    p.robotCoins -= cost;
    p.evoLevel = next;
    const evo = EVOLUTIONS[next];
    p.maxHp += evo.hpBonus;
    p.hp = p.maxHp;  // Full heal on evolve
    p.dmgMul *= evo.dmgBonus;
    p.speed += evo.speedBonus;
    // Grow the player frame — taller more than wider so each tier looks
    // sleeker and more imposing (Optimus Prime-style proportions) instead of
    // just bulky. Use widthBonus/heightBonus when defined; fall back to the
    // legacy sizeBonus for safety.
    const oldW = p.w, oldH = p.h;
    if (typeof evo.widthBonus === 'number' || typeof evo.heightBonus === 'number') {
        p.w += (evo.widthBonus || 0);
        p.h += (evo.heightBonus || 0);
    } else if (evo.sizeBonus) {
        p.w += evo.sizeBonus;
        p.h += Math.round(evo.sizeBonus * 1.4);
    }
    // Re-anchor so the player doesn't sink into the ground when scaling up
    if (p.w !== oldW || p.h !== oldH) {
        p.x -= (p.w - oldW) / 2;
        p.y -= (p.h - oldH);
    }
    if (evo.name === 'MK-III') p.maxJumpsBonus += 1;
    spawnParticles(p.x + p.w/2, p.y + p.h/2, '#ffff00', 60, 10);
    spawnParticles(p.x + p.w/2, p.y + p.h/2, '#ff00ff', 40, 8);
    spawnParticles(p.x + p.w/2, p.y + p.h/2, '#ffffff', 30, 12);
    screenShake = 24;
    // ===== ANIME-STYLE TRANSFORMATION CUTSCENE =====
    // Pause gameplay and play a full-screen cinematic. The player keeps the
    // upgraded stats (already applied), but the visual reveal happens here.
    evoTransform = {
        fromLevel: next - 1,
        toLevel: next,
        timer: 0,
        duration: 360,         // ~6 seconds total at 60fps
        ringRot: 0,
        skippable: true,
        prevState: 'playing'
    };
    spawnShockwave(p.x + p.w/2, p.y + p.h/2, 240, '#ffff66');
    spawnShockwave(p.x + p.w/2, p.y + p.h/2, 320, EVO_COLORS[next] ? EVO_COLORS[next].glow : '#ff00ff');
    p.invincible = Math.max(p.invincible, 360);
    gameState = 'evoCutscene';
    shopOpen = false;
    shopMessage = { text: `★ EVOLVED TO ${evo.name} ★`, timer: 240, color: EVO_COLORS[next] ? EVO_COLORS[next].glow : '#ffff00' };
    // Show the upgrade list popup (after the transform finishes, the popup remains)
    evoUnlockPopup = { evo: evo, timer: 360, evoLevel: next };
}

function switchWeapon(p) {
    // Cycle to next unlocked weapon
    for (let i = 1; i <= WEAPONS.length; i++) {
        const idx = (p.weaponTier + i) % WEAPONS.length;
        if (p.weaponsUnlocked[idx]) {
            p.weaponTier = idx;
            return;
        }
    }
}

// Spawn an ally NPC that will follow the player and shoot enemies
function spawnAlly(def, x, y) {
    allies.push({
        def: def,
        x: x, y: y,
        vx: 0, vy: 0,
        w: 26, h: 38,
        hp: def.hp, maxHp: def.hp,
        shootTimer: 0,
        facing: 1,
        respawnTimer: 0,
        onGround: false,
        airJumps: 0,           // double-jump charges remaining mid-air
        maxAirJumps: 1,        // allies get 1 mid-air jump (double jump)
        airJumpCooldown: 0     // small delay between the ground jump and the air jump
    });
}

// Update ally NPCs - follow when no enemies nearby, engage when enemies in range.
function updateAllies() {
    if (gameState !== 'playing') return;
    for (let i = allies.length - 1; i >= 0; i--) {
        const a = allies[i];

        // Initialize state fields if missing
        if (a.jumpCooldown === undefined) a.jumpCooldown = 0;
        if (a.stuckTimer === undefined) a.stuckTimer = 0;
        if (a.airJumps === undefined) a.airJumps = 0;
        if (a.maxAirJumps === undefined) a.maxAirJumps = 1;
        if (a.airJumpCooldown === undefined) a.airJumpCooldown = 0;

        // Tick cooldowns
        if (a.jumpCooldown > 0) a.jumpCooldown--;
        if (a.airJumpCooldown > 0) a.airJumpCooldown--;

        // Respawn after dying
        if (a.hp <= 0) {
            a.respawnTimer = (a.respawnTimer || 0) + 1;
            if (a.respawnTimer >= 360) {
                a.hp = a.maxHp;
                a.x = player.x + (Math.random() - 0.5) * 60;
                a.y = player.y - 50;
                a.vx = 0; a.vy = 0;
                a.respawnTimer = 0;
                spawnParticles(a.x + a.w/2, a.y + a.h/2, a.def.color, 15, 4);
            }
            continue;
        }

        // Find nearest enemy in engagement range
        let target = null;
        let bestDist = a.def.range;
        for (const e of enemies) {
            const ddx = (e.x + e.w / 2) - (a.x + a.w / 2);
            const ddy = (e.y + e.h / 2) - (a.y + a.h / 2);
            const d = Math.sqrt(ddx * ddx + ddy * ddy);
            if (d < bestDist) {
                target = e;
                bestDist = d;
            }
        }
        a.target = target;

        // Distance from player
        const dxToPlayer = player.x - a.x;
        const dyToPlayer = player.y - a.y;
        const distToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);

        // STATE LOGIC
        let moveDir = 0;
        let inEngageMode = false;
        if (distToPlayer > 800) {
            // Teleport
            a.x = player.x - player.facing * 60;
            a.y = player.y - 30;
            a.vx = 0; a.vy = 0;
            spawnParticles(a.x + a.w / 2, a.y + a.h / 2, a.def.color, 10, 4);
            continue;
        } else if (target && bestDist < 280) {
            // Engagement: stop, face target, shoot
            inEngageMode = true;
            a.vx *= 0.55;
            const tdx = (target.x + target.w / 2) - (a.x + a.w / 2);
            a.facing = tdx > 0 ? 1 : -1;
        } else {
            // Follow mode
            const trailOffset = 100 + i * 20;
            const targetX = player.x - player.facing * trailOffset;
            const dxFollow = targetX - a.x;
            if (Math.abs(dxFollow) > 35) {
                moveDir = dxFollow > 0 ? 1 : -1;
                a.vx = moveDir * 4.5;
                a.facing = moveDir;
            } else {
                a.vx *= 0.7;
                a.facing = player.facing;
            }
        }

        // Stuck detection - if not moving for several frames while trying to move, increment
        if (Math.abs(a.vx) > 0.5 && Math.abs(a.x - (a.lastX || 0)) < 0.5) {
            a.stuckTimer++;
        } else {
            a.stuckTimer = 0;
        }
        a.lastX = a.x;

        // Smart jump - with cooldown to prevent spam
        if (a.onGround && a.jumpCooldown <= 0 && !inEngageMode) {
            const wantToMove = moveDir !== 0;
            const playerHigh = dyToPlayer < -90;
            let needJump = false;

            if (wantToMove) {
                // Check ground ahead
                const aheadX = a.x + a.w / 2 + moveDir * 35;
                const groundY = a.y + a.h + 5;
                let groundAhead = false;
                for (const plat of platforms) {
                    if (plat.type === 'spike' || plat.type === 'laser' || plat.type === 'recovery' || plat.type === 'lava') continue;
                    if (aheadX >= plat.x && aheadX <= plat.x + plat.w &&
                        groundY >= plat.y - 5 && groundY <= plat.y + plat.h) {
                        groundAhead = true;
                        break;
                    }
                }
                if (!groundAhead) needJump = true;
                if (a.bumpedWall) needJump = true;
                if (a.stuckTimer > 8) needJump = true;
            }
            if (playerHigh) needJump = true;

            if (needJump) {
                a.vy = -12;
                a.bumpedWall = false;
                a.jumpCooldown = 30;
                a.stuckTimer = 0;
                a.airJumps = a.maxAirJumps;     // refresh double-jump charges on takeoff
                a.airJumpCooldown = 8;          // brief delay before air jump can fire
            }
        }

        // Mid-air double jump - to clear wider gaps and reach high platforms
        if (!a.onGround && a.airJumps > 0 && a.airJumpCooldown <= 0 && !inEngageMode) {
            const playerHigh = dyToPlayer < -40;
            const fallingHard = a.vy > 2;
            const movingHorizontally = Math.abs(a.vx) > 0.5;

            // Check if there is no ground close below us (likely falling into a gap)
            const belowX = a.x + a.w / 2;
            const checkRange = 80;  // how far down to look
            let groundBelow = false;
            for (const plat of platforms) {
                if (plat.type === 'spike' || plat.type === 'laser' || plat.type === 'recovery' || plat.type === 'lava') continue;
                if (belowX >= plat.x && belowX <= plat.x + plat.w &&
                    plat.y >= a.y + a.h && plat.y <= a.y + a.h + checkRange) {
                    groundBelow = true;
                    break;
                }
            }

            // Trigger double jump if we'd fall into a gap, or we still need to climb to the player
            if ((fallingHard && !groundBelow && movingHorizontally) || (playerHigh && a.vy > -2)) {
                a.vy = -11;
                a.airJumps--;
                a.airJumpCooldown = 18;
                spawnParticles(a.x + a.w / 2, a.y + a.h, a.def.color, 6, 3);
            }
        }

        // Gravity
        a.vy += 0.5;
        if (a.vy > 14) a.vy = 14;

        a.x += a.vx;
        a.y += a.vy;

        // Platform collision
        a.onGround = false;
        a.bumpedWall = false;
        for (const plat of platforms) {
            if (plat.type === 'spike' || plat.type === 'laser' || plat.type === 'recovery' || plat.type === 'lava') continue;
            if (rectCollide(a, plat)) {
                const overlapX = Math.min(a.x + a.w - plat.x, plat.x + plat.w - a.x);
                const overlapY = Math.min(a.y + a.h - plat.y, plat.y + plat.h - a.y);
                if (overlapX < overlapY) {
                    if (a.x + a.w / 2 < plat.x + plat.w / 2) a.x = plat.x - a.w;
                    else a.x = plat.x + plat.w;
                    a.vx = 0;
                    a.bumpedWall = true;
                } else {
                    if (a.y + a.h / 2 < plat.y + plat.h / 2) {
                        a.y = plat.y - a.h;
                        a.vy = 0;
                        a.onGround = true;
                    } else {
                        a.y = plat.y + plat.h;
                        a.vy = 0;
                    }
                }
            }
        }

        // Refresh double-jump charges whenever the ally is on the ground
        if (a.onGround) a.airJumps = a.maxAirJumps;

        // Block doors and arena gates
        for (const d of doors) {
            if (d.open) continue;
            if (rectCollide(a, d)) {
                if (a.x + a.w / 2 < d.x + d.w / 2) a.x = d.x - a.w;
                else a.x = d.x + d.w;
                a.vx = 0;
                a.bumpedWall = true;
            }
        }
        for (const ag of arenaGates) {
            if (ag.open) continue;
            if (rectCollide(a, ag)) {
                if (a.x + a.w / 2 < ag.x + ag.w / 2) a.x = ag.x - a.w;
                else a.x = ag.x + ag.w;
                a.vx = 0;
                a.bumpedWall = true;
            }
        }
        for (const bg of bossGates) {
            if (bg.open) continue;
            if (rectCollide(a, bg)) {
                if (a.x + a.w / 2 < bg.x + bg.w / 2) a.x = bg.x - a.w;
                else a.x = bg.x + bg.w;
                a.vx = 0;
                a.bumpedWall = true;
            }
        }

        // Fall off bottom -> warp to player
        if (a.y > 700) {
            a.x = player.x;
            a.y = player.y - 50;
            a.vx = 0; a.vy = 0;
        }

        // Shoot at the targeted enemy
        a.shootTimer -= timeSlowFactor;
        if (a.shootTimer <= 0 && a.target) {
            const ang = Math.atan2((a.target.y + a.target.h / 2) - (a.y + a.h / 2), (a.target.x + a.target.w / 2) - (a.x + a.w / 2));
            bullets.push({
                x: a.x + a.w / 2 + Math.cos(ang) * 20,
                y: a.y + a.h / 2 + Math.sin(ang) * 20,
                vx: Math.cos(ang) * 12,
                vy: Math.sin(ang) * 12,
                life: 70,
                damage: a.def.damage,
                color: a.def.bulletColor, glow: a.def.bulletColor, size: 5,
                pierce: false, hitEnemies: new Set(),
                fromAlly: true
            });
            a.shootTimer = a.def.fireRate;
        }

        // Take damage from enemy bullets
        for (let bi = enemyBullets.length - 1; bi >= 0; bi--) {
            const b = enemyBullets[bi];
            if (b.x >= a.x && b.x <= a.x + a.w && b.y >= a.y && b.y <= a.y + a.h) {
                a.hp -= b.damage || 6;
                spawnParticles(b.x, b.y, '#ff0000', 4, 2);
                enemyBullets.splice(bi, 1);
                if (a.hp <= 0) {
                    spawnExplosion(a.x + a.w / 2, a.y + a.h / 2);
                    spawnParticles(a.x + a.w / 2, a.y + a.h / 2, a.def.color, 20, 5);
                    shopMessage = { text: `${a.def.name} DOWN — respawning...`, timer: 90, color: '#ff6666' };
                }
            }
        }
    }
}

function drawAllies() {
    for (const a of allies) {
        if (a.hp <= 0) continue;
        const ax = a.x - camera.x;
        const ay = a.y - camera.y;
        ctx.save();
        ctx.shadowColor = a.def.color;
        ctx.shadowBlur = 8;
        // Body
        ctx.fillStyle = a.def.color;
        ctx.fillRect(ax + 4, ay + 10, a.w - 8, a.h - 14);
        // Head
        ctx.fillStyle = a.def.accent;
        ctx.fillRect(ax + 6, ay, a.w - 12, 12);
        // Visor
        ctx.fillStyle = '#fff';
        ctx.fillRect(ax + (a.facing > 0 ? 12 : 6), ay + 3, 8, 4);
        // Legs
        ctx.fillStyle = '#222';
        ctx.fillRect(ax + 4, ay + a.h - 8, 8, 8);
        ctx.fillRect(ax + a.w - 12, ay + a.h - 8, 8, 8);
        // Gun
        ctx.fillStyle = a.def.accent;
        const gunX = ax + (a.facing > 0 ? a.w - 4 : -8);
        ctx.fillRect(gunX, ay + 16, 12, 6);
        ctx.shadowBlur = 0;
        // Health bar above
        if (a.hp < a.maxHp) {
            ctx.fillStyle = '#222';
            ctx.fillRect(ax, ay - 8, a.w, 4);
            ctx.fillStyle = a.def.color;
            ctx.fillRect(ax, ay - 8, (a.hp / a.maxHp) * a.w, 4);
        }
        // Name tag
        ctx.fillStyle = a.def.color;
        ctx.font = 'bold 9px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(a.def.name, ax + a.w / 2, ay - 12);
        ctx.textAlign = 'left';
        ctx.restore();
    }

    // Draw cages
    for (const cage of cages) {
        if (cage.rescued) continue;
        const cx = cage.x - camera.x;
        const cy = cage.y - camera.y;
        ctx.save();
        // Cage frame
        ctx.fillStyle = '#222';
        ctx.fillRect(cx, cy, cage.w, cage.h);
        // Bars
        ctx.fillStyle = '#888';
        ctx.shadowColor = '#aaa';
        ctx.shadowBlur = 4;
        for (let bi = 0; bi < 5; bi++) {
            ctx.fillRect(cx + 6 + bi * 11, cy + 4, 3, cage.h - 8);
        }
        ctx.fillRect(cx, cy, cage.w, 4);
        ctx.fillRect(cx, cy + cage.h - 4, cage.w, 4);
        // Captive inside (silhouette)
        ctx.shadowBlur = 0;
        ctx.fillStyle = cage.allyDef.color;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(cx + 18, cy + 30, 24, 36);
        ctx.fillStyle = cage.allyDef.accent;
        ctx.fillRect(cx + 22, cy + 22, 16, 12);
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx + 28, cy + 26, 4, 3);
        ctx.globalAlpha = 1;
        // Cage HP bar
        ctx.fillStyle = '#222';
        ctx.fillRect(cx, cy - 12, cage.w, 6);
        ctx.fillStyle = '#ffdd44';
        ctx.fillRect(cx, cy - 12, (cage.hp / 50) * cage.w, 6);
        // "Free me" bubble
        const blink = Math.floor(performance.now() / 400) % 2 === 0;
        if (blink) {
            ctx.fillStyle = '#ffdd44';
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 8;
            ctx.font = 'bold 11px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('SHOOT TO FREE', cx + cage.w / 2, cy - 18);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
        }
        ctx.restore();
    }
}

// Melee combat - 3-hit combo with increasing damage and knockback. Final hit explodes.
// At CONVOY tier the player wields the ENERGON AXE — much higher damage,
// wider AOE, and every hit ends in a glowing crescent slash with a small AOE.
function executeMelee() {
    player.meleeCombo = (player.meleeCombo + 1) % 3;
    if (player.meleeCombo === 0) player.meleeCombo = 3; // wrap to 3rd hit
    const stage = player.meleeCombo;  // 1, 2, or 3
    const isAxe = player.evoLevel >= 6;     // CONVOY → Energon Axe
    // Damage profile: axe roughly 2.4× the punches and the finisher hits hard
    let dmg, range, knockback;
    if (isAxe) {
        dmg = stage === 1 ? 75 : stage === 2 ? 100 : 200;
        range = stage === 3 ? 130 : 100;
        knockback = stage === 3 ? 22 : 14;
    } else {
        dmg = stage === 1 ? 30 : stage === 2 ? 40 : 80;
        range = stage === 3 ? 90 : 70;
        knockback = stage === 3 ? 14 : 8;
    }

    player.meleeCooldown = stage === 3 ? 35 : 18;
    player.meleeComboTimer = stage === 3 ? 0 : 35;  // 35-frame chain window
    player.meleeAnimTimer = 14;
    // Track which punch is firing so the renderer knows which arm thrusts
    // and what shape (jab, cross, uppercut).
    player.meleeAnimMax = 14;
    player.meleeAnimStage = stage;     // 1 = jab, 2 = cross, 3 = uppercut/AOE
    // Alternate arms: jab uses the back arm, cross uses the front arm,
    // uppercut is a two-handed slam from the front.
    player.meleeAnimArm = (stage === 1) ? 'back' : (stage === 2) ? 'front' : 'both';
    // Tag the swing so the renderer can draw an axe slash arc instead of fists
    player.meleeAxe = isAxe;
    if (stage === 3) player.meleeCombo = 0;  // reset after final

    const cx = player.x + player.w / 2 + player.facing * 25;
    const cy = player.y + player.h / 2;

    // Hit detection in arc in front of player
    let hitCount = 0;
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const dx = (e.x + e.w / 2) - cx;
        const dy = (e.y + e.h / 2) - cy;
        if (Math.abs(dx) < range && Math.abs(dy) < range && dx * player.facing > -range / 2) {
            const finalDmg = Math.round(dmg * player.dmgMul);
            // SHIELDER takes much less melee damage from front, but melee bypasses ranged shield mostly
            let actualDmg = finalDmg;
            if (e.type === 'shielder') {
                const fromFront = (e.dir > 0 && (e.x + e.w/2) > player.x) || (e.dir < 0 && (e.x + e.w/2) < player.x);
                if (fromFront) actualDmg = Math.round(actualDmg * 0.7);
            }
            e.hp -= actualDmg;
            // Knockback - little upward push too
            e.x += Math.sign(dx) * knockback;
            // Energon axe sparks are bright cyan/white; punches are yellow.
            const sparkColor = isAxe ? '#88ddff' : '#ffff00';
            const sparkCount = isAxe ? 14 : 8;
            spawnParticles(e.x + e.w / 2, e.y + e.h / 2, sparkColor, sparkCount, isAxe ? 7 : 4);
            if (isAxe) {
                // Secondary energon trail
                spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#ffffff', 6, 5);
            }
            hitCount++;
            if (e.hp <= 0) {
                handleEnemyKilled(e, i);
            }
        }
    }

    // Visual flash on combo finisher
    if (stage === 3) {
        screenShake = isAxe ? 22 : 14;
        if (isAxe) {
            // ENERGON AXE FINISHER — massive crescent slash, double shockwave
            spawnParticles(cx, cy, '#88ddff', 50, 12);
            spawnParticles(cx, cy, '#ffffff', 30, 10);
            spawnParticles(cx, cy, '#ffd744', 20, 8);
            spawnShockwave(cx, cy, 140, '#88ddff');
            spawnShockwave(cx, cy, 200, '#ffffff');
            hitStop = Math.max(hitStop, 6);
            // Bigger AOE hit window
            for (let i = enemies.length - 1; i >= 0; i--) {
                const e = enemies[i];
                const dx = (e.x + e.w/2) - cx;
                const dy = (e.y + e.h/2) - cy;
                if (dx*dx + dy*dy < 160*160) {
                    e.hp -= Math.round(120 * player.dmgMul);
                    if (e.hp <= 0) handleEnemyKilled(e, i);
                }
            }
        } else {
            spawnParticles(cx, cy, '#ffff00', 30, 8);
            spawnParticles(cx, cy, '#ffaa00', 20, 6);
            // AOE damage in big radius
            for (let i = enemies.length - 1; i >= 0; i--) {
                const e = enemies[i];
                const dx = (e.x + e.w/2) - cx;
                const dy = (e.y + e.h/2) - cy;
                if (dx*dx + dy*dy < 110*110) {
                    e.hp -= Math.round(40 * player.dmgMul);
                    if (e.hp <= 0) handleEnemyKilled(e, i);
                }
            }
        }
    } else {
        screenShake = isAxe ? 8 : 4;
        spawnParticles(cx, cy, isAxe ? '#88ddff' : player.charAccent, isAxe ? 12 : 6, isAxe ? 6 : 4);
    }

    // Hitting an enemy gives the player a tiny damage immunity reward
    if (hitCount > 0) {
        player.invincible = Math.max(player.invincible, 6);
    }
}

// Activate the player's special ability (Q key)
function activateAbility() {
    if (player.abilityTimer > 0) return;
    const ab = player.abilityType;
    player.abilityTimer = player.abilityCooldown;
    player.abilityActive = true;

    if (ab === 'timeslow') {
        timeSlowFactor = 0.35;
        player.abilityActiveTimer = 180; // 3 seconds
        spawnParticles(player.x + player.w/2, player.y + player.h/2, '#00ffff', 25, 5);
    } else if (ab === 'phase') {
        player.invincible = 90;
        player.abilityActiveTimer = 90;
        // Big dash in facing direction
        player.vx = player.facing * 22;
        player.vy = 0;
        spawnParticles(player.x + player.w/2, player.y + player.h/2, '#aa00ff', 30, 6);
    } else if (ab === 'shockwave') {
        // Damage all enemies within 220 px
        spawnParticles(player.x + player.w/2, player.y + player.h/2, '#ff8800', 40, 8);
        screenShake = 18;
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            const dx = (e.x + e.w/2) - (player.x + player.w/2);
            const dy = (e.y + e.h/2) - (player.y + player.h/2);
            if (dx*dx + dy*dy < 220 * 220) {
                e.hp -= 250;
                if (e.hp <= 0) handleEnemyKilled(e, i);
            }
        }
        player.abilityActiveTimer = 30;
    } else if (ab === 'hover') {
        player.abilityActiveTimer = 180;
        spawnParticles(player.x + player.w/2, player.y + player.h/2, '#88ffff', 20, 4);
    } else if (ab === 'bulletstorm') {
        player.abilityActiveTimer = 240;
        spawnParticles(player.x + player.w/2, player.y + player.h/2, '#ffaa00', 25, 5);
    } else if (ab === 'freeze') {
        // Freeze all enemies on screen
        spawnParticles(player.x + player.w/2, player.y + player.h/2, '#ddffff', 50, 6);
        screenShake = 12;
        for (const e of enemies) {
            e.frozen = 240;
        }
        player.abilityActiveTimer = 30;
    } else if (ab === 'teleport') {
        // Warp forward
        player.x += player.facing * 200;
        spawnParticles(player.x + player.w/2, player.y + player.h/2, '#aa44ff', 30, 5);
        player.invincible = 30;
        player.abilityActiveTimer = 15;
    } else if (ab === 'annihilate') {
        // Massive damage to ALL enemies on screen
        spawnParticles(player.x + player.w/2, player.y + player.h/2, '#ffffff', 60, 10);
        screenShake = 25;
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            // Don't annihilate bosses, but heavy damage
            if (e.type === 'boss') {
                e.hp -= 250;
                if (e.hp <= 0) handleEnemyKilled(e, i);
            } else {
                e.hp -= 999;
                if (e.hp <= 0) handleEnemyKilled(e, i);
            }
        }
        player.abilityActiveTimer = 60;
    }
}

// Apply character stats to player (called on character select / restart)
function applyCharacter(charIndex) {
    const c = CHARACTERS[charIndex];
    selectedChar = charIndex;
    player.speed = c.speed;
    player.jumpForce = c.jumpForce;
    player.gravity = c.gravity;
    player.maxHp = c.maxHp;
    player.hp = c.maxHp;
    player.dashRange = c.dashRange;
    player.fireRateMul = c.fireRateMul;
    player.dmgMul = c.dmgMul;
    player.maxJumps = 2 + (c.extraJumps || 0);
    player.charColor = c.color;
    player.charAccent = c.accent;
    player.abilityType = c.ability;
    player.abilityCooldown = c.abilityCooldown;
    player.abilityTimer = 0;
    player.abilityActive = false;
    player.abilityActiveTimer = 0;
}

let activeShop = null;        // shop currently in range
let shopOpen = false;         // is the shop UI open
let shopMessage = null;       // { text, timer }
let coinPickups = [];         // floating coins to collect
let healthDrops = [];         // floating HP pickups
let comboCount = 0;           // kill combo counter
let comboTimer = 0;           // combo decay
let timeSlowFactor = 1;       // global enemy speed multiplier (for STRIKER ability)
let cutscene = null;          // active boss cutscene { lines: [{speaker, text, color}], idx, timer }
let switches = [];            // shootable switches
let doors = [];               // locked doors
let arenaGates = [];          // boss arena gates that lock player in
let bossGates = [];           // visual boss-approach gates that open as you near
let exitPortals = [];         // stage exit portals after boss
let laserGrids = [];          // mission-impossible laser walls — disabled by terminal puzzles
let terminals = [];           // hackable terminals; shoot to disable a laser grid
let keyPickups = [];          // glowing keys you must collect to unlock the cage
let floatTexts = [];          // floating text labels (CRIT!, dodges, etc)

// Space transition state
let spaceState = {
    active: false,
    enemiesKilled: 0,
    enemiesRequired: 8,
    timer: 0,
    stars: [],   // background star field
    flyingEnemies: []   // space combat flying robots
};
// Takeoff/launch sequence state — bridge between stage exit and space combat
let launchState = null;
let allies = [];              // friendly NPCs that follow the player
let cages = [];               // captive cages spawned after boss kill
let evoUnlockPopup = null;    // shown when player evolves: { evo, timer }
let evoAbilityCooldown = 0;   // [R] ability cooldown

// Ally definitions - one rescued per defeated boss
const ALLY_TEMPLATES = [
    {
        name: 'JADE',     stage: 0,  // rescued after stage 1
        color: '#88ff88', accent: '#44ff44',
        hp: 80, damage: 14, fireRate: 35, range: 350,
        bulletColor: '#44ff44'
    },
    {
        name: 'STORM',    stage: 1,
        color: '#88aaff', accent: '#4488ff',
        hp: 100, damage: 18, fireRate: 30, range: 400,
        bulletColor: '#88ddff'
    },
    {
        name: 'EMBER',    stage: 2,
        color: '#ff8866', accent: '#ff5522',
        hp: 110, damage: 20, fireRate: 25, range: 380,
        bulletColor: '#ffaa44'
    },
    {
        name: 'VIPER',    stage: 3,
        color: '#aaff44', accent: '#88ff00',
        hp: 130, damage: 22, fireRate: 22, range: 400,
        bulletColor: '#aaff66'
    },
    {
        name: 'FROST',    stage: 4,
        color: '#aaeeff', accent: '#88ddff',
        hp: 150, damage: 25, fireRate: 20, range: 420,
        bulletColor: '#ccffff'
    },
    {
        name: 'NULL',     stage: 5,
        color: '#cc88ff', accent: '#aa44ff',
        hp: 160, damage: 28, fireRate: 18, range: 440,
        bulletColor: '#dd88ff'
    },
    {
        name: 'ECHO',     stage: 6,
        color: '#ffffff', accent: '#ffaaff',
        hp: 200, damage: 35, fireRate: 16, range: 480,
        bulletColor: '#ffffff'
    }
];

// Level design - platforms [x, y, w, h, type]
// Stage definitions. Each stage has its own platforms, enemies, shops, danger zones, and a boss.
const STAGES = [
    {
        name: 'STAGE 1: FACILITY ENTRANCE',
        bgTint: '#0a0a0f',
        bossName: 'GUARD-1',
        bossColor: '#ff66dd',
        weaponReward: 1,
        charUnlockMsg: 'NEW CHARACTER: SHADOW',
        bossTriggerX: 4000,
        cutscene: [
            { speaker: 'YOU', text: 'A guard. The first of many.', color: '#00ffff' },
            { speaker: 'GUARD-1', text: 'Halt, intruder. You will not pass.', color: '#ff66dd' },
            { speaker: 'YOU', text: 'Try and stop me.', color: '#00ffff' }
        ],
        victoryCutscene: [
            { speaker: 'GUARD-1', text: 'I... was only the gatekeeper...', color: '#ff66dd' },
            { speaker: 'YOU', text: 'Then your masters are next. Where are they?', color: '#00ffff' },
            { speaker: 'GUARD-1', text: 'Above. Always above. The Sky Docks...', color: '#ff66dd' },
            { speaker: 'YOU', text: 'Got it. Hold on, prisoner. I am coming.', color: '#00ffff' }
        ],
        spaceCutscene: [
            { speaker: 'SHIP A.I.', text: 'Lift-off confirmed. Heading to Sky Docks orbit.', color: '#88ddff' },
            { speaker: 'SHIP A.I.', text: 'Multiple hostile interceptors closing fast.', color: '#88ddff' },
            { speaker: 'YOU', text: 'Hand me the cannons. Punch through.', color: '#00ffff' }
        ]
    },
    {
        name: 'STAGE 2: SKY DOCKS',
        bgTint: '#0a0a18',
        bossName: 'SKYHAMMER',
        bossColor: '#0088ff',
        weaponReward: 2,
        charUnlockMsg: 'NEW CHARACTER: TANK',
        bossTriggerX: 4150,
        cutscene: [
            { speaker: 'SKYHAMMER', text: 'You climbed all this way... impressive.', color: '#0088ff' },
            { speaker: 'SKYHAMMER', text: 'But the sky is MY domain.', color: '#0088ff' },
            { speaker: 'YOU', text: 'Time to come back down.', color: '#00ffff' }
        ],
        victoryCutscene: [
            { speaker: 'SKYHAMMER', text: 'Cracks... in my hull... how?', color: '#0088ff' },
            { speaker: 'YOU', text: 'You stopped paying attention.', color: '#00ffff' },
            { speaker: 'SKYHAMMER', text: 'The Reactor will burn you. Inferno-X is awake.', color: '#0088ff' }
        ],
        spaceCutscene: [
            { speaker: 'SHIP A.I.', text: 'Punching through atmosphere. Reactor sector ahead.', color: '#88ddff' },
            { speaker: 'CONTROL', text: 'New ship class detected — heavier armor, twin guns.', color: '#ffaa44' },
            { speaker: 'YOU', text: 'They get tougher every jump. So do we.', color: '#00ffff' }
        ]
    },
    {
        name: 'STAGE 3: REACTOR CORE',
        bgTint: '#180a0a',
        bossName: 'INFERNO-X',
        bossColor: '#ff3300',
        weaponReward: 3,
        charUnlockMsg: 'NEW CHARACTER: GHOST',
        bossTriggerX: 3900,
        cutscene: [
            { speaker: 'INFERNO-X', text: 'You feel that heat? It is the truth.', color: '#ff3300' },
            { speaker: 'INFERNO-X', text: 'I will burn your steel down to slag.', color: '#ff3300' },
            { speaker: 'YOU', text: 'Bold for someone made of metal.', color: '#00ffff' }
        ],
        victoryCutscene: [
            { speaker: 'INFERNO-X', text: 'My core... cooling... unacceptable...', color: '#ff3300' },
            { speaker: 'YOU', text: 'It is over. Tell me about Ravager.', color: '#00ffff' },
            { speaker: 'INFERNO-X', text: 'He builds them. Every monster you have fought.', color: '#ff3300' },
            { speaker: 'YOU', text: 'Then I am long overdue for that lab.', color: '#00ffff' }
        ],
        spaceCutscene: [
            { speaker: 'SHIP A.I.', text: 'Crossing the asteroid belt. Brace for chaff.', color: '#88ddff' },
            { speaker: 'CONTROL', text: 'Heat-signatures rising. Combat drones in formation.', color: '#ffaa44' },
            { speaker: 'YOU', text: 'Light em up.', color: '#00ffff' }
        ]
    },
    {
        name: 'STAGE 4: WEAPONS LAB',
        bgTint: '#0a180a',
        bossName: 'RAVAGER',
        bossColor: '#22ff44',
        weaponReward: 4,
        charUnlockMsg: 'NEW CHARACTER: GUNSLINGER',
        bossTriggerX: 4100,
        cutscene: [
            { speaker: 'RAVAGER', text: 'You touched my weapons. My PROTOTYPES.', color: '#22ff44' },
            { speaker: 'RAVAGER', text: 'I will grind you into spare parts.', color: '#22ff44' },
            { speaker: 'YOU', text: 'I have been collecting yours.', color: '#00ffff' }
        ],
        victoryCutscene: [
            { speaker: 'RAVAGER', text: 'My — my prototypes... gone...', color: '#22ff44' },
            { speaker: 'YOU', text: 'They will not be missed. The Cryo-Lord. Where?', color: '#00ffff' },
            { speaker: 'RAVAGER', text: 'The Outpost. The cold. You will freeze before you find him.', color: '#22ff44' },
            { speaker: 'YOU', text: 'I have heat for both of us.', color: '#00ffff' }
        ],
        spaceCutscene: [
            { speaker: 'SHIP A.I.', text: 'Jumping cold sector. Arctic outpost is fortified.', color: '#88ddff' },
            { speaker: 'CONTROL', text: 'Frost interceptors detected — armor plating doubled.', color: '#ffaa44' },
            { speaker: 'YOU', text: 'They want a fight in vacuum? Fine.', color: '#00ffff' }
        ]
    },
    {
        name: 'STAGE 5: ARCTIC OUTPOST',
        bgTint: '#0a1a20',
        bossName: 'CRYO-LORD',
        bossColor: '#88ccff',
        weaponReward: 5,
        charUnlockMsg: 'NEW CHARACTER: CRYO',
        bossTriggerX: 4000,
        cutscene: [
            { speaker: 'CRYO-LORD', text: 'Far enough, warm-blood.', color: '#88ccff' },
            { speaker: 'CRYO-LORD', text: 'I will freeze you in place. Forever.', color: '#88ccff' },
            { speaker: 'YOU', text: 'Cold reception. Fitting.', color: '#00ffff' }
        ],
        victoryCutscene: [
            { speaker: 'CRYO-LORD', text: 'My ice... breaks... how can warmth WIN?', color: '#88ccff' },
            { speaker: 'YOU', text: 'It always does. Tell me about the Void.', color: '#00ffff' },
            { speaker: 'CRYO-LORD', text: 'Nullifier sees through reality. He has already seen you die.', color: '#88ccff' },
            { speaker: 'YOU', text: 'He will need to look again.', color: '#00ffff' }
        ],
        spaceCutscene: [
            { speaker: 'SHIP A.I.', text: 'Approaching the Void. Reality is... thin here.', color: '#88ddff' },
            { speaker: 'CONTROL', text: 'WARNING — phase-shift fighters in our lane.', color: '#ff6644' },
            { speaker: 'YOU', text: 'Whatever they are, they bleed sparks.', color: '#00ffff' }
        ]
    },
    {
        name: 'STAGE 6: VOID GATEWAY',
        bgTint: '#100018',
        bossName: 'NULLIFIER',
        bossColor: '#aa00ff',
        weaponReward: 6,
        charUnlockMsg: 'NEW CHARACTER: VOIDWALKER',
        bossTriggerX: 4200,
        cutscene: [
            { speaker: 'NULLIFIER', text: 'You do not exist. Not here.', color: '#aa00ff' },
            { speaker: 'NULLIFIER', text: 'I will erase you from this place.', color: '#aa00ff' },
            { speaker: 'YOU', text: 'Come and try.', color: '#00ffff' }
        ],
        victoryCutscene: [
            { speaker: 'NULLIFIER', text: 'I... am being unwritten...', color: '#aa00ff' },
            { speaker: 'YOU', text: 'Where is OMEGA-PRIME hiding?', color: '#00ffff' },
            { speaker: 'NULLIFIER', text: 'Above the citadel. He has been... waiting for you.', color: '#aa00ff' },
            { speaker: 'YOU', text: 'Then I will not keep him waiting.', color: '#00ffff' }
        ],
        spaceCutscene: [
            { speaker: 'SHIP A.I.', text: 'Final approach: COMMAND CITADEL orbit.', color: '#88ddff' },
            { speaker: 'CONTROL', text: 'Royal-guard interceptors. Heaviest class on record.', color: '#ff6644' },
            { speaker: 'YOU', text: 'One more wave. Then OMEGA-PRIME.', color: '#00ffff' }
        ]
    },
    {
        name: 'STAGE 7: COMMAND CITADEL',
        bgTint: '#180018',
        bossName: 'OMEGA-PRIME',
        bossColor: '#ffffff',
        weaponReward: 7,
        charUnlockMsg: 'NEW CHARACTER: OMEGA',
        bossTriggerX: 4300,
        cutscene: [
            { speaker: 'OMEGA-PRIME', text: 'So this is the one who has hunted my children.', color: '#ffffff' },
            { speaker: 'OMEGA-PRIME', text: 'You have walked through fire and frost.', color: '#ffffff' },
            { speaker: 'OMEGA-PRIME', text: 'And now you face the source.', color: '#ffffff' },
            { speaker: 'YOU', text: 'I have walked through worse than you.', color: '#00ffff' },
            { speaker: 'OMEGA-PRIME', text: 'PROVE IT.', color: '#ff44ff' }
        ],
        victoryCutscene: [
            { speaker: 'OMEGA-PRIME', text: 'Im — impossible... the source... cannot fall...', color: '#ffffff' },
            { speaker: 'YOU', text: 'It just did. Power down.', color: '#00ffff' },
            { speaker: 'OMEGA-PRIME', text: 'You... will be... a legend...', color: '#ffffff' },
            { speaker: 'YOU', text: 'I just want them all home.', color: '#00ffff' },
            { speaker: 'SHIP A.I.', text: 'CAPTAIN — new signal above the citadel. Massive.', color: '#88ddff' },
            { speaker: 'YOU', text: 'Wait. Omega was not the source?', color: '#00ffff' },
            { speaker: 'SHIP A.I.', text: 'Negative. Something is folding open in orbit.', color: '#88ddff' }
        ],
        spaceCutscene: [
            { speaker: 'SHIP A.I.', text: 'Climbing out of atmosphere — orbital threat is HUGE.', color: '#88ddff' },
            { speaker: 'CONTROL', text: 'TITAN-LORD detected. He IS a fortress.', color: '#ff6644' },
            { speaker: 'YOU', text: 'Then it is time to break the fortress.', color: '#00ffff' }
        ]
    },
    {
        name: 'STAGE 8: ORBITAL FORTRESS',
        bgTint: '#02030c',
        bossName: 'TITAN-LORD',
        bossColor: '#66ffff',
        weaponReward: 0,   // no new weapon — final boss reward is the win
        charUnlockMsg: 'NEW EVOLUTION TIER UNLOCKED: APEX',
        bossTriggerX: 4400,
        cutscene: [
            { speaker: 'TITAN-LORD',  text: 'You climbed past Omega? Cute.', color: '#66ffff' },
            { speaker: 'TITAN-LORD',  text: 'Omega was a SOLDIER. I am the SHIP that brought him.', color: '#66ffff' },
            { speaker: 'YOU',         text: 'A robot AND a battleship. Fine. I will break both.', color: '#00ffff' },
            { speaker: 'TITAN-LORD',  text: 'You will see my second form. They never come back from it.', color: '#ff44ff' }
        ],
        victoryCutscene: [
            { speaker: 'TITAN-LORD',  text: 'My — chassis... my engines... going dark...', color: '#66ffff' },
            { speaker: 'YOU',         text: 'It is over. The whole network. Done.', color: '#00ffff' },
            { speaker: 'TITAN-LORD',  text: 'Then... they are all yours. Take them home.', color: '#66ffff' }
        ]
    }
];

function buildLevel() {
    const stage = STAGES[currentStage];
    stageBgTint = stage.bgTint;
    arenaTheme = null;  // reset arena theme

    if (currentStage === 0)      buildStage1();
    else if (currentStage === 1) buildStage2();
    else if (currentStage === 2) buildStage3();
    else if (currentStage === 3) buildStage4();
    else if (currentStage === 4) buildStage5();
    else if (currentStage === 5) buildStage6();
    else if (currentStage === 6) buildStage7();
    else                          buildStage8();

    extendStage();   // adds the post-content zone
    mergeAdjacentGround();   // merge ground gaps so map feels continuous

    // Strip out walls from the open-world stage area (keeps only ground, floating platforms, hazards)
    // Boss arena walls (added later) are preserved because buildBossArena runs at cutscene time
    platforms = platforms.filter(p => p.type !== 'wall');

    // ===== HARD MODE SCALING =====
    // Bosses scale lighter than mobs. Late stages (4-8) get a steeper bump
    // since the player has 7 evolution tiers and vehicle forms by then.
    const stageScale = 1 + Math.max(0, currentStage - 2) * 0.08;  // stage 3 = 1.08, stage 8 = 1.48
    const enemyHpMul = 1.7 * stageScale;       // was 1.4
    const bossHpMul = 1.45 * stageScale;        // was 1.25
    const enemySpeedMul = 1.12;                 // was 1.08 — slightly faster patrols
    for (const e of enemies) {
        if (e.type === 'boss') {
            e.hp = Math.round(e.hp * bossHpMul);
            e.maxHp = Math.round(e.maxHp * bossHpMul);
        } else {
            e.hp = Math.round(e.hp * enemyHpMul);
            e.maxHp = Math.round(e.maxHp * enemyHpMul);
            // Slightly faster patrols / fire timers (smaller = faster)
            if (typeof e.vx === 'number' && e.vx !== 0) {
                e.vx *= enemySpeedMul;
            }
            if (typeof e.shootTimer === 'number' && e.shootTimer > 5) {
                e.shootTimer = Math.max(5, Math.round(e.shootTimer * 0.78));   // was 0.85 — fire faster
            }
        }
    }

    coinPickups = [];
    healthDrops = [];
    bullets = [];
    enemyBullets = [];
    activeWarning = null;
    switches = [];
    doors = [];
    arenaGates = [];
    bossGates = [];
    exitPortals = [];
    cages = [];
    laserGrids = [];
    terminals = [];
    keyPickups = [];
    player.keysHeld = [];
    populatePuzzles();
    spawnBossGate();
}

// Place a glowing boss-approach gate ahead of the boss for that "console game" feel
function spawnBossGate() {
    const stage = STAGES[currentStage];
    if (!stage || !stage.bossTriggerX) return;
    // Gate just before the boss trigger - blocks ground level and most of the air
    const gx = stage.bossTriggerX - 60;
    bossGates.push({
        x: gx, y: 150, w: 50, h: 400,  // y=150 to 550 = ground
        open: false,
        animTimer: 0,
        color: stage.bossColor || '#ff00ff'
    });
}

// Merge adjacent ground segments so the map feels continuous (only big gaps remain)
function mergeAdjacentGround() {
    // Build a list of ground rectangles sorted by x
    const grounds = platforms.filter(p => p.type === 'ground').sort((a, b) => a.x - b.x);
    const others = platforms.filter(p => p.type !== 'ground');

    const merged = [];
    for (const g of grounds) {
        if (merged.length === 0) {
            merged.push({ ...g });
            continue;
        }
        const last = merged[merged.length - 1];
        const gap = g.x - (last.x + last.w);
        // Merge if at the same height and within 90 px
        if (gap <= 90 && g.y === last.y) {
            last.w = (g.x + g.w) - last.x;
        } else {
            merged.push({ ...g });
        }
    }
    platforms = others.concat(merged);
}

// Active arena theme - drives boss arena visuals
let arenaTheme = null;

// Build a boss arena - open space, boss-themed hazards. Removes existing nearby content.
function buildBossArena(stageIdx, playerX, boss) {
    const arenaStartX = Math.max(playerX - 150, 0);
    // Stages 4+ get a much bigger arena (2400 vs 1600) so the player can
    // properly maneuver around bigger bosses (especially TITAN-LORD's ship form).
    const arenaW = stageIdx >= 3 ? 2400 : 1600;
    const arenaEndX = arenaStartX + arenaW;
    const groundY = 550;

    // Wipe out existing platforms/decorations in the arena range to make it clean
    platforms = platforms.filter(p => !(p.x + p.w > arenaStartX - 50 && p.x < arenaEndX + 200));

    // STAGES 4+: clear out non-boss enemies inside the arena range so the
    // boss fight is a clean 1v1 (with allies) — no chip damage from random
    // patrols while the boss is the focus. Earlier stages keep their existing
    // mob ambience.
    if (stageIdx >= 3) {
        enemies = enemies.filter(e => {
            if (e.type === 'boss') return true;
            if (e.type === 'miniboss') return true;  // hydra mini-boss stays
            // Strip everything else inside the arena range
            return !(e.x + e.w > arenaStartX - 50 && e.x < arenaEndX + 200);
        });
    }

    // Place boss at the far right of the arena
    boss.baseX = arenaStartX + arenaW - 250;
    boss.x = boss.baseX;

    // Buff the boss for the arena fight (stronger, more aggressive). Stages
    // 4+ get an EXTRA scaling pass since the cleared arena makes it a 1v1.
    // Bosses now have 3 phases including rage at 25%, so HP is bumped further.
    const bossHpMul = stageIdx >= 3 ? 2.4 : 1.8;     // was 2.0/1.5
    const bossFireMul = stageIdx >= 3 ? 0.45 : 0.65;
    boss.hp = Math.round(boss.maxHp * bossHpMul);
    boss.maxHp = boss.hp;
    boss.shootTimer = Math.round(boss.shootTimer * bossFireMul);

    // Single closing gate (just locks the player in for the fight)
    arenaGates.push({
        x: arenaStartX - 30, y: 100, w: 30, h: 460, open: false, anim: 0
    });

    // Theme-specific arena
    if (stageIdx === 0) {
        // STAGE 1: Facility - simple open arena, two side pillars
        arenaTheme = { name: 'facility', floor: '#1a2a1a', accent: '#00ff44' };
        platforms.push({ x: arenaStartX, y: groundY, w: arenaW, h: 50, type: 'ground' });
        platforms.push({ x: arenaStartX + 350, y: groundY - 220, w: 50, h: 220, type: 'wall' });
        platforms.push({ x: arenaEndX - 400, y: groundY - 220, w: 50, h: 220, type: 'wall' });
        platforms.push({ x: arenaStartX + 200, y: 380, w: 130, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 700, y: 280, w: 200, h: 16, type: 'platform' });
        platforms.push({ x: arenaEndX - 330, y: 380, w: 130, h: 16, type: 'platform' });
    } else if (stageIdx === 1) {
        // STAGE 2: Sky - high platforms with gaps you can fall through (no center floor!)
        arenaTheme = { name: 'sky', floor: '#1a1a35', accent: '#88aaff' };
        // Split floor with gap in middle
        platforms.push({ x: arenaStartX, y: groundY, w: 500, h: 50, type: 'ground' });
        platforms.push({ x: arenaEndX - 600, y: groundY, w: 600, h: 50, type: 'ground' });
        // Recovery platforms over the gap
        platforms.push({ x: arenaStartX + 540, y: 595, w: 60, h: 8, type: 'recovery' });
        platforms.push({ x: arenaStartX + 700, y: 595, w: 60, h: 8, type: 'recovery' });
        platforms.push({ x: arenaStartX + 860, y: 595, w: 60, h: 8, type: 'recovery' });
        // Floating sky platforms (the boss flies above)
        platforms.push({ x: arenaStartX + 200, y: 400, w: 130, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 450, y: 320, w: 130, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 700, y: 250, w: 150, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 970, y: 320, w: 130, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 1220, y: 400, w: 130, h: 16, type: 'platform' });
    } else if (stageIdx === 2) {
        // STAGE 3: REACTOR / INFERNO — LAVA arena!
        arenaTheme = { name: 'inferno', floor: '#2a0a0a', accent: '#ff3300' };
        // Lava pits with islands of safe ground
        platforms.push({ x: arenaStartX, y: groundY, w: 350, h: 50, type: 'ground' });
        // Small islands across the lava
        platforms.push({ x: arenaStartX + 450, y: groundY, w: 200, h: 50, type: 'ground' });
        platforms.push({ x: arenaStartX + 800, y: groundY, w: 200, h: 50, type: 'ground' });
        platforms.push({ x: arenaStartX + 1100, y: groundY, w: 500, h: 50, type: 'ground' });
        // LAVA in the gaps - damages when touched (using spike type with red look done in draw)
        platforms.push({ x: arenaStartX + 350, y: groundY + 10, w: 100, h: 40, type: 'lava' });
        platforms.push({ x: arenaStartX + 650, y: groundY + 10, w: 150, h: 40, type: 'lava' });
        platforms.push({ x: arenaStartX + 1000, y: groundY + 10, w: 100, h: 40, type: 'lava' });
        // Floating rocks
        platforms.push({ x: arenaStartX + 250, y: 380, w: 110, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 500, y: 280, w: 130, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 750, y: 220, w: 150, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 1000, y: 280, w: 130, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 1250, y: 380, w: 110, h: 16, type: 'platform' });
    } else if (stageIdx === 3) {
        // STAGE 4: WEAPONS LAB — industrial, with conveyor-style platforms
        arenaTheme = { name: 'lab', floor: '#0a1a0a', accent: '#22ff44' };
        platforms.push({ x: arenaStartX, y: groundY, w: arenaW, h: 50, type: 'ground' });
        // Stacked lab platforms — more of them, spread across the wider arena
        platforms.push({ x: arenaStartX + 200, y: 460, w: 220, h: 18, type: 'platform' });
        platforms.push({ x: arenaStartX + 100, y: 360, w: 280, h: 18, type: 'platform' });
        platforms.push({ x: arenaStartX + 250, y: 250, w: 220, h: 18, type: 'platform' });
        platforms.push({ x: arenaStartX + 600, y: 320, w: 320, h: 18, type: 'platform' });
        platforms.push({ x: arenaStartX + 1000, y: 250, w: 240, h: 18, type: 'platform' });
        platforms.push({ x: arenaStartX + 1300, y: 360, w: 280, h: 18, type: 'platform' });
        platforms.push({ x: arenaStartX + 1700, y: 250, w: 220, h: 18, type: 'platform' });
        platforms.push({ x: arenaEndX - 600, y: 460, w: 220, h: 18, type: 'platform' });
        platforms.push({ x: arenaEndX - 380, y: 360, w: 220, h: 18, type: 'platform' });
        // Breakable cover crates scattered on the floor — no ground walls
        platforms.push({ x: arenaStartX + 480, y: groundY - 50, w: 50, h: 50, type: 'breakable', hp: 90 });
        platforms.push({ x: arenaStartX + 1100, y: groundY - 50, w: 50, h: 50, type: 'breakable', hp: 90 });
        platforms.push({ x: arenaStartX + 1700, y: groundY - 50, w: 50, h: 50, type: 'breakable', hp: 90 });
        // Lasers as hazards (offset alternating, more of them)
        platforms.push({ x: arenaStartX + 700, y: groundY - 8, w: 100, h: 8, type: 'laser', phase: 0 });
        platforms.push({ x: arenaStartX + 1400, y: groundY - 8, w: 100, h: 8, type: 'laser', phase: 1 });
    } else if (stageIdx === 4) {
        // STAGE 5: ARCTIC — ice arena. Open floor (no walls) + ice platforms.
        arenaTheme = { name: 'arctic', floor: '#1a2a3a', accent: '#aaeeff' };
        platforms.push({ x: arenaStartX, y: groundY, w: arenaW, h: 50, type: 'ground' });
        // Stacked ice platforms across the wider arena
        platforms.push({ x: arenaStartX + 150, y: 420, w: 140, h: 14, type: 'platform' });
        platforms.push({ x: arenaStartX + 380, y: 320, w: 180, h: 14, type: 'platform' });
        platforms.push({ x: arenaStartX + 650, y: 240, w: 220, h: 14, type: 'platform' });
        platforms.push({ x: arenaStartX + 950, y: 320, w: 200, h: 14, type: 'platform' });
        platforms.push({ x: arenaStartX + 1250, y: 240, w: 200, h: 14, type: 'platform' });
        platforms.push({ x: arenaStartX + 1550, y: 320, w: 200, h: 14, type: 'platform' });
        platforms.push({ x: arenaStartX + 1850, y: 420, w: 180, h: 14, type: 'platform' });
        platforms.push({ x: arenaEndX - 350, y: 320, w: 180, h: 14, type: 'platform' });
        // Ice spikes on the floor (a few — punishes camping)
        platforms.push({ x: arenaStartX + 530, y: groundY - 10, w: 50, h: 10, type: 'spike' });
        platforms.push({ x: arenaStartX + 1100, y: groundY - 10, w: 50, h: 10, type: 'spike' });
        platforms.push({ x: arenaStartX + 1700, y: groundY - 10, w: 50, h: 10, type: 'spike' });
        // Breakable ice crates
        platforms.push({ x: arenaStartX + 800, y: groundY - 50, w: 50, h: 50, type: 'breakable', hp: 100 });
        platforms.push({ x: arenaStartX + 1400, y: groundY - 50, w: 50, h: 50, type: 'breakable', hp: 100 });
    } else if (stageIdx === 5) {
        // STAGE 6: VOID — chaotic, floating platforms in a void
        arenaTheme = { name: 'void', floor: '#1a0030', accent: '#aa00ff' };
        // Broken floor with void gaps (more islands across the wider arena)
        platforms.push({ x: arenaStartX, y: groundY, w: 280, h: 50, type: 'ground' });
        platforms.push({ x: arenaStartX + 380, y: groundY, w: 240, h: 50, type: 'ground' });
        platforms.push({ x: arenaStartX + 720, y: groundY, w: 280, h: 50, type: 'ground' });
        platforms.push({ x: arenaStartX + 1100, y: groundY, w: 280, h: 50, type: 'ground' });
        platforms.push({ x: arenaStartX + 1480, y: groundY, w: 280, h: 50, type: 'ground' });
        platforms.push({ x: arenaStartX + 1860, y: groundY, w: 280, h: 50, type: 'ground' });
        platforms.push({ x: arenaEndX - 280, y: groundY, w: 280, h: 50, type: 'ground' });
        // Recovery puddles in the gaps
        platforms.push({ x: arenaStartX + 320, y: 595, w: 50, h: 8, type: 'recovery' });
        platforms.push({ x: arenaStartX + 660, y: 595, w: 50, h: 8, type: 'recovery' });
        platforms.push({ x: arenaStartX + 1040, y: 595, w: 50, h: 8, type: 'recovery' });
        platforms.push({ x: arenaStartX + 1420, y: 595, w: 50, h: 8, type: 'recovery' });
        platforms.push({ x: arenaStartX + 1800, y: 595, w: 50, h: 8, type: 'recovery' });
        // Floating void chunks
        platforms.push({ x: arenaStartX + 200, y: 380, w: 130, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 500, y: 280, w: 160, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 800, y: 200, w: 200, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 1150, y: 280, w: 160, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 1450, y: 200, w: 200, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 1750, y: 280, w: 160, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 2050, y: 380, w: 130, h: 16, type: 'platform' });
    } else if (stageIdx === 6) {
        // STAGE 7: CITADEL — final arena, throne-like center, no ground walls.
        arenaTheme = { name: 'citadel', floor: '#1a0030', accent: '#ff44ff' };
        platforms.push({ x: arenaStartX, y: groundY, w: arenaW, h: 50, type: 'ground' });
        // Center throne pedestal — a low platform Omega stood on
        platforms.push({ x: arenaStartX + 1050, y: 470, w: 300, h: 80, type: 'wall' });
        // Side towers (raised, NOT touching the ground so player can walk under)
        platforms.push({ x: arenaStartX + 240, y: 250, w: 50, h: 240, type: 'wall' });
        platforms.push({ x: arenaEndX - 290, y: 250, w: 50, h: 240, type: 'wall' });
        // Layered fight platforms
        platforms.push({ x: arenaStartX + 100, y: 420, w: 160, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 380, y: 320, w: 220, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 380, y: 200, w: 220, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 720, y: 350, w: 180, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 1500, y: 320, w: 220, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 1500, y: 200, w: 220, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 1800, y: 420, w: 180, h: 16, type: 'platform' });
        platforms.push({ x: arenaEndX - 360, y: 420, w: 180, h: 16, type: 'platform' });
        // Breakable royal pillars (cover for player, can be destroyed)
        platforms.push({ x: arenaStartX + 600, y: groundY - 60, w: 50, h: 60, type: 'breakable', hp: 130 });
        platforms.push({ x: arenaStartX + 1700, y: groundY - 60, w: 50, h: 60, type: 'breakable', hp: 130 });
    } else {
        // STAGE 8: ORBITAL FORTRESS — wide arena, floor open from gate to
        // boss. Floating decks for vertical maneuvering. TITAN-LORD's ship
        // form needs lots of horizontal room to strafe.
        arenaTheme = { name: 'orbital', floor: '#02030c', accent: '#66ffff' };
        platforms.push({ x: arenaStartX, y: groundY, w: arenaW, h: 50, type: 'ground' });
        // Mid-height firing decks across the arena
        platforms.push({ x: arenaStartX + 200, y: 460, w: 140, h: 14, type: 'platform' });
        platforms.push({ x: arenaStartX + 400, y: 380, w: 220, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 720, y: 290, w: 200, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 1020, y: 380, w: 240, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 1340, y: 290, w: 200, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 1640, y: 380, w: 240, h: 16, type: 'platform' });
        platforms.push({ x: arenaStartX + 1960, y: 290, w: 200, h: 16, type: 'platform' });
        platforms.push({ x: arenaEndX - 320, y: 460, w: 140, h: 14, type: 'platform' });
        // Breakable energy pylons — destructible cover
        platforms.push({ x: arenaStartX + 580, y: groundY - 70, w: 40, h: 70, type: 'breakable', hp: 140 });
        platforms.push({ x: arenaStartX + 1180, y: groundY - 70, w: 40, h: 70, type: 'breakable', hp: 140 });
        platforms.push({ x: arenaStartX + 1780, y: groundY - 70, w: 40, h: 70, type: 'breakable', hp: 140 });
        // Recovery puddles
        platforms.push({ x: arenaStartX + 900, y: 595, w: 50, h: 8, type: 'recovery' });
        platforms.push({ x: arenaStartX + 1500, y: 595, w: 50, h: 8, type: 'recovery' });
    }
}
function extendStage() {
    // Find existing rightmost ground to know where to extend from
    let maxX = 0;
    let groundY = 550;
    for (const p of platforms) {
        if (p.type === 'ground') {
            const right = p.x + p.w;
            if (right > maxX) { maxX = right; groundY = p.y; }
        }
    }
    // Find boss in enemies
    const boss = enemies.find(e => e.type === 'boss');
    if (!boss) return;

    // Shift boss further out
    const offset = 700;
    boss.baseX += offset;
    boss.x += offset;

    // Add extension ground
    platforms.push({ x: maxX, y: groundY, w: 280, h: 50, type: 'ground' });
    platforms.push({ x: maxX + 320, y: groundY, w: 280, h: 50, type: 'ground' });
    platforms.push({ x: maxX + 640, y: groundY, w: 280, h: 50, type: 'ground' });
    // Recovery
    platforms.push({ x: maxX + 280, y: 595, w: 50, h: 8, type: 'recovery' });
    platforms.push({ x: maxX + 600, y: 595, w: 50, h: 8, type: 'recovery' });

    // Some platforms / walls
    platforms.push({ x: maxX + 100, y: 350, w: 100, h: 18, type: 'platform' });
    platforms.push({ x: maxX + 280, y: 250, w: 100, h: 18, type: 'platform' });
    platforms.push({ x: maxX + 460, y: 350, w: 100, h: 18, type: 'platform' });
    platforms.push({ x: maxX + 640, y: 230, w: 100, h: 18, type: 'platform' });
    platforms.push({ x: maxX + 220, y: 220, w: 20, h: 320, type: 'wall' });
    platforms.push({ x: maxX + 540, y: 200, w: 20, h: 350, type: 'wall' });

    // Add stage-appropriate enemies
    const baseHp = 60 + currentStage * 30;
    const stageColors = ['#ff5555', '#88ccff', '#ff5500', '#22ff44', '#88ddff', '#aa44ff', '#ff44ff'];
    const col = stageColors[currentStage] || '#aaaaaa';

    enemies.unshift(
        { x: maxX + 100, y: groundY - 40, w: 36, h: 40, type: 'patrol', hp: baseHp, maxHp: baseHp, vx: 1.6, dir: 1, shootTimer: 25, patrolStart: maxX + 50, patrolEnd: maxX + 250, color: col },
        { x: maxX + 350, y: 200, w: 30, h: 24, type: 'drone', hp: baseHp - 20, maxHp: baseHp - 20, baseY: 200, floatTimer: 0, shootTimer: 35, color: col },
        { x: maxX + 460, y: groundY - 30, w: 32, h: 30, type: 'turret', hp: baseHp + 30, maxHp: baseHp + 30, shootTimer: 35, angle: 0, color: col },
        { x: maxX + 700, y: groundY - 40, w: 36, h: 40, type: 'patrol', hp: baseHp + 10, maxHp: baseHp + 10, vx: 1.8, dir: 1, shootTimer: 25, patrolStart: maxX + 640, patrolEnd: maxX + 920, color: col }
    );

    // Stage-specific bonus enemies
    if (currentStage >= 2) {
        // Bombers from stage 3+
        enemies.unshift({ x: maxX + 250, y: 250, w: 30, h: 30, type: 'bomber', hp: baseHp - 30, maxHp: baseHp - 30, floatTimer: 0, color: '#ff4400' });
    }
    if (currentStage >= 3) {
        // Sprinters from stage 4+
        enemies.unshift({ x: maxX + 550, y: groundY - 36, w: 28, h: 36, type: 'sprinter', hp: baseHp - 10, maxHp: baseHp - 10, vx: 0, vy: 0, color: '#aa00ff', onGround: true });
        // MECH from stage 4+ (Transformers-style giant)
        enemies.unshift({
            x: maxX + 400, y: groundY - 100, w: 70, h: 100,
            type: 'mech', hp: baseHp + 250, maxHp: baseHp + 250,
            vx: 0, vy: 0, facing: -1,
            shootTimer: 100, attackPhase: 0, walkPhase: 0,
            onGround: true, color: '#ff4444'
        });
    }
    if (currentStage >= 5) {
        enemies.unshift({ x: maxX + 800, y: 280, w: 30, h: 30, type: 'bomber', hp: baseHp - 20, maxHp: baseHp - 20, floatTimer: 0, color: '#ff4400' });
        enemies.unshift({ x: maxX + 200, y: groundY - 36, w: 28, h: 36, type: 'sprinter', hp: baseHp + 10, maxHp: baseHp + 10, vx: 0, vy: 0, color: '#ff00aa', onGround: true });
        // Extra MECH for late stages
        enemies.unshift({
            x: maxX + 700, y: groundY - 100, w: 70, h: 100,
            type: 'mech', hp: baseHp + 350, maxHp: baseHp + 350,
            vx: 0, vy: 0, facing: -1,
            shootTimer: 100, attackPhase: 0, walkPhase: 0,
            onGround: true, color: '#aa00ff'
        });
        // HYDRA MINI-BOSS (multi-headed monster) - stage 6 onwards. Uses miniboss type to skip stage-clear.
        enemies.unshift({
            x: maxX + 350, y: groundY - 180, w: 130, h: 150,
            type: 'miniboss', subtype: 'hydra',
            hp: 500, maxHp: 500, phase: 1,
            shootTimer: 0, moveTimer: 0,
            baseX: maxX + 350, baseY: groundY - 180,
            color: '#aa0000', attackPattern: 0
        });
    }

    // Add a shop
    shops.push({ x: maxX + 280, y: groundY - 40, w: 50, h: 40 });

    // Update danger zone for the boss
    if (dangerZones.length > 0) {
        const last = dangerZones[dangerZones.length - 1];
        if (last && last.text.includes('BOSS')) last.x += offset;
    }
    dangerZones.push({ x: maxX + 50, triggered: false, text: '⚠ DANGER: SECONDARY DEFENSE ⚠' });
    dangerZones.push({ x: maxX + 500, triggered: false, text: '⚠ DANGER: ELITE FORCES ⚠' });
}

function populatePuzzles() {
    // Add stage-specific puzzles, breakable cover, and hidden caches
    // Note: extendStage() shifted the boss by 700 px, so doors need that offset too
    if (currentStage === 0) {
        platforms.push({ x: 1100, y: 510, w: 60, h: 40, type: 'breakable', hp: 60 });
        platforms.push({ x: 1900, y: 510, w: 60, h: 40, type: 'breakable', hp: 60 });
        platforms.push({ x: 600, y: 200, w: 50, h: 50, type: 'breakable', hp: 80, cache: true, cacheCoins: 30 });
        // NEW: simple intro puzzle - 1 switch opens a door
        doors.push({ x: 2050, y: 410, w: 26, h: 140, group: 's1', open: false });
        switches.push({ x: 1450, y: 380, w: 30, h: 30, group: 's1', activated: false });
    } else if (currentStage === 1) {
        // Stage 2: door + 2 switches (door pushed past extension)
        doors.push({ x: 3700, y: 350, w: 30, h: 200, group: 's2', open: false });
        switches.push({ x: 1800, y: 380, w: 30, h: 30, group: 's2', activated: false });
        switches.push({ x: 2400, y: 230, w: 30, h: 30, group: 's2', activated: false });
        // NEW: extra mid-stage switch
        switches.push({ x: 3000, y: 320, w: 30, h: 30, group: 's2', activated: false });
        platforms.push({ x: 1600, y: 510, w: 60, h: 40, type: 'breakable', hp: 60 });
        platforms.push({ x: 2700, y: 510, w: 60, h: 40, type: 'breakable', hp: 60 });
        platforms.push({ x: 1300, y: 100, w: 50, h: 50, type: 'breakable', hp: 80, cache: true, cacheCoins: 40 });
    } else if (currentStage === 2) {
        platforms.push({ x: 1300, y: 510, w: 60, h: 40, type: 'breakable', hp: 60 });
        platforms.push({ x: 2200, y: 510, w: 60, h: 40, type: 'breakable', hp: 60 });
        platforms.push({ x: 2600, y: 130, w: 50, h: 50, type: 'breakable', hp: 80, cache: true, cacheCoins: 40 });
        // NEW: 2-switch reactor lockdown puzzle
        doors.push({ x: 1850, y: 410, w: 26, h: 140, group: 's3', open: false });
        switches.push({ x: 850, y: 200, w: 30, h: 30, group: 's3', activated: false });
        switches.push({ x: 1500, y: 320, w: 30, h: 30, group: 's3', activated: false });
    } else if (currentStage === 3) {
        doors.push({ x: 4000, y: 350, w: 30, h: 200, group: 's4', open: false });
        switches.push({ x: 1100, y: 240, w: 30, h: 30, group: 's4', activated: false });
        switches.push({ x: 2200, y: 240, w: 30, h: 30, group: 's4', activated: false });
        switches.push({ x: 2900, y: 160, w: 30, h: 30, group: 's4', activated: false });
        platforms.push({ x: 800, y: 510, w: 60, h: 40, type: 'breakable', hp: 70 });
        platforms.push({ x: 2400, y: 510, w: 60, h: 40, type: 'breakable', hp: 70 });
        platforms.push({ x: 1700, y: 110, w: 50, h: 50, type: 'breakable', hp: 100, cache: true, cacheCoins: 50 });
    } else if (currentStage === 4) {
        doors.push({ x: 3900, y: 350, w: 30, h: 200, group: 's5', open: false });
        switches.push({ x: 900, y: 180, w: 30, h: 30, group: 's5', activated: false });
        switches.push({ x: 2200, y: 180, w: 30, h: 30, group: 's5', activated: false });
        switches.push({ x: 2900, y: 380, w: 30, h: 30, group: 's5', activated: false });
        platforms.push({ x: 1500, y: 510, w: 60, h: 40, type: 'breakable', hp: 80 });
        platforms.push({ x: 2600, y: 510, w: 60, h: 40, type: 'breakable', hp: 80 });
        platforms.push({ x: 600, y: 100, w: 50, h: 50, type: 'breakable', hp: 100, cache: true, cacheCoins: 60 });
    } else if (currentStage === 5) {
        doors.push({ x: 4100, y: 350, w: 30, h: 200, group: 's6', open: false });
        switches.push({ x: 800, y: 350, w: 30, h: 30, group: 's6', activated: false });
        switches.push({ x: 1700, y: 240, w: 30, h: 30, group: 's6', activated: false });
        switches.push({ x: 2400, y: 220, w: 30, h: 30, group: 's6', activated: false });
        switches.push({ x: 3100, y: 180, w: 30, h: 30, group: 's6', activated: false });
        platforms.push({ x: 1100, y: 510, w: 60, h: 40, type: 'breakable', hp: 90 });
        platforms.push({ x: 2700, y: 510, w: 60, h: 40, type: 'breakable', hp: 90 });
        platforms.push({ x: 2900, y: 110, w: 50, h: 50, type: 'breakable', hp: 120, cache: true, cacheCoins: 70 });
    } else if (currentStage === 6) {
        doors.push({ x: 4200, y: 350, w: 30, h: 200, group: 's7', open: false });
        switches.push({ x: 750, y: 200, w: 30, h: 30, group: 's7', activated: false });
        switches.push({ x: 1500, y: 360, w: 30, h: 30, group: 's7', activated: false });
        switches.push({ x: 2350, y: 230, w: 30, h: 30, group: 's7', activated: false });
        switches.push({ x: 3200, y: 180, w: 30, h: 30, group: 's7', activated: false });
        platforms.push({ x: 1200, y: 510, w: 60, h: 40, type: 'breakable', hp: 100 });
        platforms.push({ x: 2200, y: 510, w: 60, h: 40, type: 'breakable', hp: 100 });
        platforms.push({ x: 3000, y: 510, w: 60, h: 40, type: 'breakable', hp: 100 });
        platforms.push({ x: 2800, y: 100, w: 50, h: 50, type: 'breakable', hp: 150, cache: true, cacheCoins: 100 });
    }

    // Extra hazards/cover scaling with stage
    addExtraHazards(currentStage);

    // ===== MISSION PUZZLE =====
    // Every stage gets a "find the key" objective: a key card hides behind a
    // laser grid which is disabled by shooting a hidden terminal. The cage
    // (spawned later when the boss dies) refuses damage until that key is
    // collected, locking the ally rescue behind real puzzle solving.
    addMissionPuzzle(currentStage);
    spawnEliteEnemies(currentStage);
}

// Helper: returns true if the rect overlaps an existing hazard or breakable.
function hazardOverlapsExisting(rect) {
    for (const p of platforms) {
        if (p.type === 'spike' || p.type === 'laser' || p.type === 'lava' ||
            p.type === 'recovery' || p.type === 'breakable') {
            if (rect.x < p.x + p.w && rect.x + rect.w > p.x &&
                rect.y < p.y + p.h && rect.y + rect.h > p.y) {
                return true;
            }
        }
    }
    return false;
}

// Anchor a hazard to the top of any ground rect that fully contains the strip.
function placeHazardOnGround(type, x, w, opts) {
    let groundTop = null;
    for (const p of platforms) {
        if (p.type !== 'ground') continue;
        if (x >= p.x && x + w <= p.x + p.w) {
            if (groundTop === null || p.y < groundTop) groundTop = p.y;
        }
    }
    if (groundTop === null) return false;
    const h = type === 'lava' ? 14 : 10;
    const rect = { x, y: groundTop - 4, w, h };
    if (hazardOverlapsExisting(rect)) return false;
    const obj = { x: rect.x, y: rect.y, w: rect.w, h: rect.h, type };
    if (type === 'laser') obj.phase = (opts && opts.phase != null) ? opts.phase : Math.floor(Math.random() * 2);
    platforms.push(obj);
    return true;
}

// Add extra hazards/cover. Density scales with stage.
// Density tuned DOWN — levels were getting messy with overlapping clutter.
function addExtraHazards(stage) {
    const spikeCount = 2 + stage;                 // was 3 + stage*2
    const laserCount = Math.max(0, stage - 1);    // was full stage
    const lavaCount = (stage === 2 || stage === 6) ? 2 + Math.floor(stage / 2) : Math.max(0, stage - 2);
    const breakableCount = 2 + Math.floor(stage * 0.8);  // was 3 + stage*1.2

    let placed = 0;
    for (let attempt = 0; attempt < spikeCount * 4 && placed < spikeCount; attempt++) {
        const x = 400 + Math.random() * 3000;
        const cluster = 1 + Math.floor(Math.random() * 3);
        for (let k = 0; k < cluster; k++) {
            if (placeHazardOnGround('spike', x + k * 24, 22)) placed++;
        }
    }

    let lasers = 0;
    for (let attempt = 0; attempt < laserCount * 4 && lasers < laserCount; attempt++) {
        const x = 600 + Math.random() * 2800;
        const w = 70 + Math.floor(Math.random() * 50);
        if (placeHazardOnGround('laser', x, w, { phase: lasers % 2 })) lasers++;
    }

    let lavas = 0;
    for (let attempt = 0; attempt < lavaCount * 5 && lavas < lavaCount; attempt++) {
        const x = 500 + Math.random() * 3000;
        const w = 70 + Math.floor(Math.random() * 60);
        if (placeHazardOnGround('lava', x, w)) lavas++;
    }

    for (let i = 0; i < breakableCount; i++) {
        const x = 500 + Math.random() * 3000;
        let groundTop = null;
        for (const p of platforms) {
            if (p.type !== 'ground') continue;
            if (x >= p.x && x + 50 <= p.x + p.w) {
                if (groundTop === null || p.y < groundTop) groundTop = p.y;
            }
        }
        if (groundTop !== null && Math.random() < 0.7) {
            const rect = { x, y: groundTop - 40, w: 50, h: 40 };
            if (!hazardOverlapsExisting(rect)) {
                platforms.push({ ...rect, type: 'breakable', hp: 60 + stage * 12 });
            }
        } else {
            const ys = [320, 250, 180];
            const y = ys[Math.floor(Math.random() * ys.length)];
            const rect = { x, y, w: 40, h: 40 };
            if (!hazardOverlapsExisting(rect)) {
                let blocked = false;
                for (const p of platforms) {
                    if (p.type === 'platform' && rect.x < p.x + p.w && rect.x + rect.w > p.x &&
                        rect.y < p.y + p.h && rect.y + rect.h > p.y) { blocked = true; break; }
                }
                if (!blocked) {
                    platforms.push({ ...rect, type: 'breakable', hp: 50 + stage * 10 });
                }
            }
        }
    }
}

// Add the per-stage Mission-Impossible style puzzle: a key card behind a
// laser grid that can be disabled by shooting a hidden terminal. The cage
// later spawned by the boss refuses damage until that key is collected.
function addMissionPuzzle(stage) {
    // Each stage gets a deterministic layout so it feels designed, not random.
    // Key id is per-stage so multi-key future expansion is easy.
    const keyId = `key-stage-${stage}`;

    // Layout — key + grid + terminal positions vary by stage so the player
    // explores the level to find each piece. All x coords sit BEFORE the boss
    // trigger so the puzzle resolves in the level proper.
    const layouts = [
        // Stage 1 — Facility: terminal up high, grid mid-air, key tucked over a platform
        { keyX: 1010, keyY: 250, gridX: 950, gridY: 200, gridW: 22, gridH: 100, termX: 700, termY: 220 },
        // Stage 2 — Sky Docks: terminal on a sky platform, grid blocks descent
        { keyX: 2350, keyY: 160, gridX: 2300, gridY: 110, gridW: 24, gridH: 110, termX: 2530, termY: 230 },
        // Stage 3 — Reactor: low terminal near lava field, grid blocks side passage
        { keyX: 1450, keyY: 220, gridX: 1390, gridY: 170, gridW: 24, gridH: 110, termX: 1750, termY: 260 },
        // Stage 4 — Lab: terminal up on a wall mount, grid blocks high road
        { keyX: 2620, keyY: 160, gridX: 2570, gridY: 110, gridW: 24, gridH: 110, termX: 2280, termY: 220 },
        // Stage 5 — Arctic: terminal next to a frozen pillar
        { keyX: 1990, keyY: 180, gridX: 1940, gridY: 130, gridW: 24, gridH: 110, termX: 1540, termY: 220 },
        // Stage 6 — Void: terminal near a spike pit
        { keyX: 2710, keyY: 180, gridX: 2660, gridY: 130, gridW: 24, gridH: 110, termX: 2200, termY: 220 },
        // Stage 7 — Citadel: heavy puzzle - terminal far from grid
        { keyX: 2870, keyY: 180, gridX: 2820, gridY: 130, gridW: 24, gridH: 110, termX: 1750, termY: 220 },
        // Stage 8 — Orbital Fortress: terminal mid-level, grid past the mech gauntlet
        { keyX: 3320, keyY: 300, gridX: 3270, gridY: 250, gridW: 24, gridH: 110, termX: 1480, termY: 300 }
    ];
    const L = layouts[stage] || layouts[0];

    // KEY — sits behind the laser grid
    keyPickups.push({
        id: keyId,
        x: L.keyX, y: L.keyY,
        w: 22, h: 14,
        bobOffset: stage * 0.6,
        collected: false
    });

    // LASER GRID — vertical wall of beams blocking the key
    laserGrids.push({
        x: L.gridX, y: L.gridY,
        w: L.gridW, h: L.gridH,
        group: keyId,
        disabled: false
    });

    // TERMINAL — somewhere else on the map, shoot to disable the grid
    terminals.push({
        x: L.termX, y: L.termY,
        w: 28, h: 32,
        group: keyId,
        hp: 40 + stage * 10,
        maxHp: 40 + stage * 10,
        disabled: false
    });

    // Tag the boss-stage cage to require this key. The cage is spawned later
    // (in handleEnemyKilled), so save the requirement on the player so we can
    // retrieve it then.
    player._pendingCageKey = keyId;
}

// Add new "elite" enemy types (HYDRA-WALKER and SCORPION-BOT) on later stages.
// These enemies have richer mechanics than the basic patrol/turret/drone set
// and provide variety in mid-late game without bloating the regular spawn list.
function spawnEliteEnemies(stage) {
    // Stage 4+ gets HYDRA-WALKER (3-headed walker)
    if (stage >= 3) {
        // Place near the middle so the player has time to encounter it
        const baseX = 1900 + stage * 80;
        enemies.push({
            x: baseX, y: 500, w: 60, h: 50,
            type: 'hydraWalker',
            hp: 220 + stage * 30, maxHp: 220 + stage * 30,
            vx: 0.9, dir: 1,
            patrolStart: baseX - 200, patrolEnd: baseX + 200,
            color: '#ff4400'
        });
    }
    // Stage 5+ gets SCORPION-BOT (4-leg artillery)
    if (stage >= 4) {
        const baseX = 2400 + stage * 60;
        enemies.push({
            x: baseX, y: 504, w: 64, h: 46,
            type: 'scorpion',
            hp: 280 + stage * 35, maxHp: 280 + stage * 35,
            vx: 0.7, dir: 1,
            patrolStart: baseX - 240, patrolEnd: baseX + 240,
            shootTimer: 90,
            color: '#0a3a4a'
        });
    }
}
// ===== STAGE BUILDERS =====

function buildStage1() {
    // STAGE 1: FACILITY ENTRANCE - intro stage, longer with two mini-zones before boss
    platforms = [
        { x: 0, y: 550, w: 450, h: 50, type: 'ground' },
        { x: 480, y: 550, w: 350, h: 50, type: 'ground' },
        { x: 870, y: 550, w: 450, h: 50, type: 'ground' },
        { x: 1370, y: 550, w: 360, h: 50, type: 'ground' },
        { x: 1770, y: 550, w: 550, h: 50, type: 'ground' },
        { x: 2360, y: 550, w: 350, h: 50, type: 'ground' },
        { x: 2750, y: 550, w: 380, h: 50, type: 'ground' },
        { x: 3170, y: 550, w: 700, h: 50, type: 'ground' },
        // Recovery
        { x: 440, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 820, y: 595, w: 60, h: 8, type: 'recovery' },
        { x: 1320, y: 595, w: 60, h: 8, type: 'recovery' },
        { x: 1720, y: 595, w: 60, h: 8, type: 'recovery' },
        { x: 2310, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 2700, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 3120, y: 595, w: 50, h: 8, type: 'recovery' },
        // Floating platforms
        { x: 200, y: 420, w: 120, h: 20, type: 'platform' },
        { x: 400, y: 320, w: 100, h: 20, type: 'platform' },
        { x: 600, y: 250, w: 80, h: 20, type: 'platform' },
        { x: 800, y: 350, w: 100, h: 20, type: 'platform' },
        { x: 1000, y: 280, w: 120, h: 20, type: 'platform' },
        { x: 1200, y: 400, w: 100, h: 20, type: 'platform' },
        { x: 1500, y: 300, w: 100, h: 20, type: 'platform' },
        { x: 1700, y: 200, w: 100, h: 20, type: 'platform' },
        { x: 1900, y: 350, w: 120, h: 20, type: 'platform' },
        { x: 2100, y: 250, w: 100, h: 20, type: 'platform' },
        { x: 2400, y: 350, w: 100, h: 20, type: 'platform' },
        { x: 2600, y: 250, w: 100, h: 20, type: 'platform' },
        { x: 2800, y: 350, w: 100, h: 20, type: 'platform' },
        { x: 3000, y: 280, w: 120, h: 20, type: 'platform' },
        // Walls
        { x: 450, y: 350, w: 20, h: 200, type: 'wall' },
        { x: 1150, y: 250, w: 20, h: 300, type: 'wall' },
        { x: 1650, y: 200, w: 20, h: 350, type: 'wall' },
        { x: 2550, y: 250, w: 20, h: 300, type: 'wall' },
    ];
    enemies = [
        { x: 700, y: 510, w: 36, h: 40, type: 'patrol', hp: 50, maxHp: 50, vx: 1.2, dir: 1, shootTimer: 30, patrolStart: 600, patrolEnd: 800, color: '#ff4444' },
        { x: 1100, y: 280, w: 30, h: 24, type: 'drone', hp: 40, maxHp: 40, baseY: 280, floatTimer: 0, shootTimer: 60, color: '#44aaff' },
        { x: 1500, y: 510, w: 36, h: 40, type: 'patrol', hp: 60, maxHp: 60, vx: 1.5, dir: 1, shootTimer: 30, patrolStart: 1450, patrolEnd: 1700, color: '#ff4444' },
        { x: 1900, y: 520, w: 32, h: 30, type: 'turret', hp: 80, maxHp: 80, shootTimer: 60, angle: 0, color: '#ffaa00' },
        // Extended: bonus zone before boss
        { x: 2200, y: 200, w: 30, h: 24, type: 'drone', hp: 60, maxHp: 60, baseY: 200, floatTimer: 0, shootTimer: 50, color: '#66ddff' },
        { x: 2500, y: 510, w: 36, h: 40, type: 'patrol', hp: 70, maxHp: 70, vx: 1.6, dir: 1, shootTimer: 28, patrolStart: 2400, patrolEnd: 2700, color: '#ff5555' },
        { x: 2750, y: 520, w: 32, h: 30, type: 'turret', hp: 100, maxHp: 100, shootTimer: 50, angle: 0, color: '#ffaa00' },
        { x: 2950, y: 220, w: 30, h: 24, type: 'drone', hp: 70, maxHp: 70, baseY: 220, floatTimer: Math.PI, shootTimer: 50, color: '#66ddff' },
        // BOSS GUARD-1 (a bit beefier now)
        { x: 3500, y: 380, w: 90, h: 100, type: 'boss', subtype: 'guard', hp: 500, maxHp: 500, phase: 1, shootTimer: 120, moveTimer: 0, baseX: 3500, baseY: 380, color: '#ff00ff', attackPattern: 0 }
    ];
    dangerZones = [
        { x: 500, triggered: false, text: '⚠ DANGER: HOSTILE BOT DETECTED ⚠' },
        { x: 950, triggered: false, text: '⚠ DANGER: AERIAL DRONE INCOMING ⚠' },
        { x: 1380, triggered: false, text: '⚠ DANGER: MULTIPLE TARGETS ⚠' },
        { x: 1850, triggered: false, text: '⚠ DANGER: TURRET ACTIVE ⚠' },
        { x: 2400, triggered: false, text: '⚠ DANGER: REINFORCEMENTS ⚠' },
        { x: 2800, triggered: false, text: '⚠ DANGER: SECONDARY DEFENSE ⚠' },
        { x: 3300, triggered: false, text: '⚠⚠ BOSS: GUARD-1 APPROACHING ⚠⚠' }
    ];
    shops = [
        { x: 1300, y: 510, w: 50, h: 40 },
        { x: 2200, y: 510, w: 50, h: 40 },
        { x: 2900, y: 510, w: 50, h: 40 },
        { x: 3250, y: 510, w: 50, h: 40 }
    ];
}

function buildStage2() {
    // STAGE 2: SKY DOCKS - lots of vertical platforming, more drones overhead
    platforms = [
        { x: 0, y: 550, w: 350, h: 50, type: 'ground' },
        { x: 380, y: 550, w: 200, h: 50, type: 'ground' },
        { x: 620, y: 550, w: 280, h: 50, type: 'ground' },
        { x: 950, y: 550, w: 250, h: 50, type: 'ground' },
        { x: 1250, y: 550, w: 350, h: 50, type: 'ground' },
        { x: 1650, y: 550, w: 300, h: 50, type: 'ground' },
        { x: 2000, y: 550, w: 250, h: 50, type: 'ground' },
        { x: 2300, y: 550, w: 350, h: 50, type: 'ground' },
        { x: 2700, y: 550, w: 350, h: 50, type: 'ground' },
        { x: 3100, y: 550, w: 800, h: 50, type: 'ground' },
        // Recovery
        { x: 340, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 580, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 900, y: 595, w: 60, h: 8, type: 'recovery' },
        { x: 1200, y: 595, w: 60, h: 8, type: 'recovery' },
        { x: 1600, y: 595, w: 60, h: 8, type: 'recovery' },
        { x: 1950, y: 595, w: 60, h: 8, type: 'recovery' },
        { x: 2250, y: 595, w: 60, h: 8, type: 'recovery' },
        { x: 2650, y: 595, w: 60, h: 8, type: 'recovery' },
        { x: 3050, y: 595, w: 60, h: 8, type: 'recovery' },
        // High floating platforms (sky docks)
        { x: 150, y: 450, w: 100, h: 18, type: 'platform' },
        { x: 320, y: 380, w: 90, h: 18, type: 'platform' },
        { x: 500, y: 320, w: 80, h: 18, type: 'platform' },
        { x: 680, y: 250, w: 90, h: 18, type: 'platform' },
        { x: 850, y: 180, w: 100, h: 18, type: 'platform' },
        { x: 1030, y: 250, w: 90, h: 18, type: 'platform' },
        { x: 1200, y: 320, w: 100, h: 18, type: 'platform' },
        { x: 1400, y: 250, w: 90, h: 18, type: 'platform' },
        { x: 1580, y: 180, w: 100, h: 18, type: 'platform' },
        { x: 1770, y: 250, w: 90, h: 18, type: 'platform' },
        { x: 1950, y: 350, w: 90, h: 18, type: 'platform' },
        { x: 2130, y: 250, w: 100, h: 18, type: 'platform' },
        { x: 2330, y: 180, w: 100, h: 18, type: 'platform' },
        { x: 2530, y: 250, w: 90, h: 18, type: 'platform' },
        { x: 2720, y: 350, w: 90, h: 18, type: 'platform' },
        { x: 2900, y: 250, w: 100, h: 18, type: 'platform' },
        { x: 3080, y: 180, w: 100, h: 18, type: 'platform' },
        // Walls
        { x: 600, y: 320, w: 20, h: 230, type: 'wall' },
        { x: 1140, y: 280, w: 20, h: 270, type: 'wall' },
        { x: 1500, y: 200, w: 20, h: 350, type: 'wall' },
        { x: 2050, y: 280, w: 20, h: 270, type: 'wall' },
        { x: 2670, y: 200, w: 20, h: 350, type: 'wall' },
    ];
    enemies = [
        { x: 400, y: 510, w: 36, h: 40, type: 'patrol', hp: 60, maxHp: 60, vx: 1.5, dir: 1, shootTimer: 30, patrolStart: 380, patrolEnd: 560, color: '#ff5555' },
        { x: 700, y: 240, w: 30, h: 24, type: 'drone', hp: 50, maxHp: 50, baseY: 240, floatTimer: 0, shootTimer: 60, color: '#44aaff' },
        { x: 950, y: 180, w: 30, h: 24, type: 'drone', hp: 50, maxHp: 50, baseY: 180, floatTimer: Math.PI, shootTimer: 50, color: '#44aaff' },
        { x: 1300, y: 510, w: 36, h: 40, type: 'patrol', hp: 70, maxHp: 70, vx: 1.7, dir: 1, shootTimer: 30, patrolStart: 1260, patrolEnd: 1580, color: '#ff5555' },
        { x: 1450, y: 200, w: 30, h: 24, type: 'drone', hp: 60, maxHp: 60, baseY: 200, floatTimer: 0, shootTimer: 50, color: '#44ccff' },
        { x: 1750, y: 250, w: 30, h: 24, type: 'drone', hp: 60, maxHp: 60, baseY: 250, floatTimer: Math.PI / 2, shootTimer: 45, color: '#44ccff' },
        { x: 2050, y: 520, w: 32, h: 30, type: 'turret', hp: 90, maxHp: 90, shootTimer: 60, angle: 0, color: '#ffaa00' },
        { x: 2200, y: 200, w: 30, h: 24, type: 'drone', hp: 70, maxHp: 70, baseY: 200, floatTimer: 0, shootTimer: 45, color: '#66ddff' },
        // Extended zone
        { x: 2400, y: 510, w: 36, h: 40, type: 'patrol', hp: 90, maxHp: 90, vx: 1.8, dir: 1, shootTimer: 28, patrolStart: 2300, patrolEnd: 2640, color: '#ff5555' },
        { x: 2500, y: 200, w: 30, h: 24, type: 'drone', hp: 80, maxHp: 80, baseY: 200, floatTimer: Math.PI, shootTimer: 42, color: '#66ddff' },
        { x: 2750, y: 520, w: 32, h: 30, type: 'turret', hp: 110, maxHp: 110, shootTimer: 50, angle: 0, color: '#ffaa00' },
        { x: 2900, y: 200, w: 30, h: 24, type: 'drone', hp: 90, maxHp: 90, baseY: 200, floatTimer: 0, shootTimer: 40, color: '#66ddff' },
        { x: 3100, y: 510, w: 36, h: 40, type: 'patrol', hp: 100, maxHp: 100, vx: 2, dir: 1, shootTimer: 25, patrolStart: 3050, patrolEnd: 3300, color: '#ff5555' },
        // BOSS SKYHAMMER - flies, drops bombs from above
        { x: 3550, y: 200, w: 100, h: 80, type: 'boss', subtype: 'skyhammer', hp: 600, maxHp: 600, phase: 1, shootTimer: 120, moveTimer: 0, baseX: 3550, baseY: 200, color: '#0088ff', attackPattern: 0 }
    ];
    dangerZones = [
        { x: 300, triggered: false, text: '⚠ DANGER: SKY DOCKS PATROL ⚠' },
        { x: 600, triggered: false, text: '⚠ DANGER: AERIAL SQUADRON ⚠' },
        { x: 1200, triggered: false, text: '⚠ DANGER: MULTIPLE DRONES ⚠' },
        { x: 1900, triggered: false, text: '⚠ DANGER: HEAVY TURRET ⚠' },
        { x: 2380, triggered: false, text: '⚠ DANGER: ENFORCEMENT TEAM ⚠' },
        { x: 2900, triggered: false, text: '⚠ DANGER: SKY ENFORCERS ⚠' },
        { x: 3350, triggered: false, text: '⚠⚠ BOSS: SKYHAMMER INBOUND ⚠⚠' }
    ];
    shops = [
        { x: 900, y: 510, w: 50, h: 40 },
        { x: 1620, y: 510, w: 50, h: 40 },
        { x: 2400, y: 510, w: 50, h: 40 },
        { x: 3150, y: 510, w: 50, h: 40 }
    ];
}

function buildStage3() {
    // STAGE 3: REACTOR CORE - red theme, more turrets, harder enemies
    platforms = [
        { x: 0, y: 550, w: 400, h: 50, type: 'ground' },
        { x: 430, y: 550, w: 300, h: 50, type: 'ground' },
        { x: 760, y: 550, w: 350, h: 50, type: 'ground' },
        { x: 1140, y: 550, w: 300, h: 50, type: 'ground' },
        { x: 1470, y: 550, w: 400, h: 50, type: 'ground' },
        { x: 1900, y: 550, w: 300, h: 50, type: 'ground' },
        { x: 2230, y: 550, w: 350, h: 50, type: 'ground' },
        { x: 2610, y: 550, w: 350, h: 50, type: 'ground' },
        { x: 2990, y: 550, w: 900, h: 50, type: 'ground' },
        // Recovery
        { x: 390, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 720, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 1100, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 1430, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 1860, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 2180, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 2560, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 2940, y: 595, w: 50, h: 8, type: 'recovery' },
        // Platforms
        { x: 200, y: 400, w: 100, h: 18, type: 'platform' },
        { x: 380, y: 320, w: 100, h: 18, type: 'platform' },
        { x: 580, y: 250, w: 100, h: 18, type: 'platform' },
        { x: 780, y: 350, w: 100, h: 18, type: 'platform' },
        { x: 950, y: 250, w: 100, h: 18, type: 'platform' },
        { x: 1150, y: 320, w: 100, h: 18, type: 'platform' },
        { x: 1350, y: 250, w: 100, h: 18, type: 'platform' },
        { x: 1550, y: 350, w: 100, h: 18, type: 'platform' },
        { x: 1750, y: 250, w: 100, h: 18, type: 'platform' },
        { x: 1950, y: 350, w: 100, h: 18, type: 'platform' },
        { x: 2150, y: 250, w: 100, h: 18, type: 'platform' },
        { x: 2350, y: 350, w: 100, h: 18, type: 'platform' },
        { x: 2550, y: 250, w: 100, h: 18, type: 'platform' },
        { x: 2750, y: 350, w: 100, h: 18, type: 'platform' },
        { x: 2950, y: 250, w: 120, h: 18, type: 'platform' },
        { x: 3150, y: 200, w: 120, h: 18, type: 'platform' },
        // Walls
        { x: 700, y: 300, w: 20, h: 250, type: 'wall' },
        { x: 1080, y: 280, w: 20, h: 270, type: 'wall' },
        { x: 1700, y: 200, w: 20, h: 350, type: 'wall' },
        { x: 2500, y: 220, w: 20, h: 330, type: 'wall' },
        // Reactor hazards - lasers
        { x: 1000, y: 540, w: 80, h: 10, type: 'laser', phase: 0 },
        { x: 1900, y: 540, w: 80, h: 10, type: 'laser', phase: 1 },
        { x: 2400, y: 540, w: 100, h: 10, type: 'laser', phase: 0 },
    ];
    enemies = [
        { x: 500, y: 510, w: 36, h: 40, type: 'patrol', hp: 80, maxHp: 80, vx: 1.6, dir: 1, shootTimer: 30, patrolStart: 440, patrolEnd: 720, color: '#ff3300' },
        { x: 600, y: 220, w: 30, h: 24, type: 'drone', hp: 70, maxHp: 70, baseY: 220, floatTimer: 0, shootTimer: 45, color: '#ff6644' },
        { x: 850, y: 520, w: 32, h: 30, type: 'turret', hp: 110, maxHp: 110, shootTimer: 50, angle: 0, color: '#ff4400' },
        { x: 1200, y: 510, w: 36, h: 40, type: 'patrol', hp: 90, maxHp: 90, vx: 1.8, dir: 1, shootTimer: 25, patrolStart: 1150, patrolEnd: 1430, color: '#ff3300' },
        { x: 1400, y: 220, w: 30, h: 24, type: 'drone', hp: 80, maxHp: 80, baseY: 220, floatTimer: Math.PI, shootTimer: 40, color: '#ff6644' },
        { x: 1600, y: 520, w: 32, h: 30, type: 'turret', hp: 120, maxHp: 120, shootTimer: 45, angle: 0, color: '#ff4400' },
        { x: 1950, y: 200, w: 30, h: 24, type: 'drone', hp: 90, maxHp: 90, baseY: 200, floatTimer: 0, shootTimer: 40, color: '#ff8866' },
        { x: 2100, y: 510, w: 36, h: 40, type: 'patrol', hp: 100, maxHp: 100, vx: 2, dir: 1, shootTimer: 25, patrolStart: 2050, patrolEnd: 2230, color: '#ff5500' },
        // Extended zone
        { x: 2300, y: 510, w: 36, h: 40, type: 'patrol', hp: 110, maxHp: 110, vx: 2, dir: 1, shootTimer: 25, patrolStart: 2230, patrolEnd: 2580, color: '#ff5500' },
        { x: 2450, y: 220, w: 30, h: 24, type: 'drone', hp: 100, maxHp: 100, baseY: 220, floatTimer: Math.PI / 2, shootTimer: 40, color: '#ff8866' },
        { x: 2700, y: 520, w: 32, h: 30, type: 'turret', hp: 140, maxHp: 140, shootTimer: 40, angle: 0, color: '#ff5500' },
        { x: 2850, y: 220, w: 30, h: 24, type: 'drone', hp: 110, maxHp: 110, baseY: 220, floatTimer: 0, shootTimer: 38, color: '#ff8866' },
        // BOSS INFERNO-X
        { x: 3300, y: 350, w: 100, h: 110, type: 'boss', subtype: 'inferno', hp: 850, maxHp: 850, phase: 1, shootTimer: 120, moveTimer: 0, baseX: 3300, baseY: 350, color: '#ff3300', attackPattern: 0 }
    ];
    dangerZones = [
        { x: 350, triggered: false, text: '⚠ DANGER: REACTOR HEAT - HOSTILES ⚠' },
        { x: 800, triggered: false, text: '⚠ DANGER: TURRET LOCK ⚠' },
        { x: 1300, triggered: false, text: '⚠ DANGER: ELITE PATROL ⚠' },
        { x: 1850, triggered: false, text: '⚠ DANGER: HEAVY OPPOSITION ⚠' },
        { x: 2280, triggered: false, text: '⚠ DANGER: REACTOR DEFENDERS ⚠' },
        { x: 2780, triggered: false, text: '⚠ DANGER: CORE GUARDIANS ⚠' },
        { x: 3100, triggered: false, text: '⚠⚠ BOSS: INFERNO-X DETECTED ⚠⚠' }
    ];
    shops = [
        { x: 1100, y: 510, w: 50, h: 40 },
        { x: 1850, y: 510, w: 50, h: 40 },
        { x: 2620, y: 510, w: 50, h: 40 },
        { x: 3000, y: 510, w: 50, h: 40 }
    ];
}

function buildStage4() {
    // STAGE 4: WEAPONS LAB - green theme, lots of turrets and tougher patrols
    platforms = [
        { x: 0, y: 550, w: 380, h: 50, type: 'ground' },
        { x: 410, y: 550, w: 280, h: 50, type: 'ground' },
        { x: 720, y: 550, w: 320, h: 50, type: 'ground' },
        { x: 1070, y: 550, w: 350, h: 50, type: 'ground' },
        { x: 1450, y: 550, w: 320, h: 50, type: 'ground' },
        { x: 1800, y: 550, w: 350, h: 50, type: 'ground' },
        { x: 2180, y: 550, w: 280, h: 50, type: 'ground' },
        { x: 2490, y: 550, w: 350, h: 50, type: 'ground' },
        { x: 2870, y: 550, w: 350, h: 50, type: 'ground' },
        { x: 3250, y: 550, w: 800, h: 50, type: 'ground' },
        // Recovery
        { x: 370, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 680, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 1030, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 1410, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 1760, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 2140, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 2450, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 2830, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 3210, y: 595, w: 50, h: 8, type: 'recovery' },
        // Lab platforms
        { x: 200, y: 380, w: 100, h: 18, type: 'platform' },
        { x: 350, y: 280, w: 100, h: 18, type: 'platform' },
        { x: 540, y: 380, w: 100, h: 18, type: 'platform' },
        { x: 750, y: 280, w: 100, h: 18, type: 'platform' },
        { x: 920, y: 200, w: 100, h: 18, type: 'platform' },
        { x: 1120, y: 280, w: 100, h: 18, type: 'platform' },
        { x: 1320, y: 380, w: 100, h: 18, type: 'platform' },
        { x: 1520, y: 280, w: 100, h: 18, type: 'platform' },
        { x: 1720, y: 200, w: 100, h: 18, type: 'platform' },
        { x: 1920, y: 280, w: 100, h: 18, type: 'platform' },
        { x: 2120, y: 380, w: 100, h: 18, type: 'platform' },
        { x: 2320, y: 280, w: 100, h: 18, type: 'platform' },
        { x: 2520, y: 200, w: 120, h: 18, type: 'platform' },
        { x: 2700, y: 280, w: 100, h: 18, type: 'platform' },
        { x: 2900, y: 200, w: 100, h: 18, type: 'platform' },
        { x: 3100, y: 280, w: 100, h: 18, type: 'platform' },
        // Walls
        { x: 660, y: 250, w: 20, h: 300, type: 'wall' },
        { x: 1260, y: 280, w: 20, h: 270, type: 'wall' },
        { x: 1660, y: 200, w: 20, h: 350, type: 'wall' },
        { x: 2260, y: 280, w: 20, h: 270, type: 'wall' },
        { x: 2840, y: 200, w: 20, h: 350, type: 'wall' },
    ];
    enemies = [
        { x: 500, y: 510, w: 36, h: 40, type: 'patrol', hp: 100, maxHp: 100, vx: 1.8, dir: 1, shootTimer: 25, patrolStart: 440, patrolEnd: 680, color: '#22ff44' },
        { x: 600, y: 520, w: 32, h: 30, type: 'turret', hp: 130, maxHp: 130, shootTimer: 45, angle: 0, color: '#88ff44' },
        { x: 850, y: 230, w: 30, h: 24, type: 'drone', hp: 90, maxHp: 90, baseY: 230, floatTimer: 0, shootTimer: 40, color: '#88ff88' },
        { x: 1100, y: 520, w: 32, h: 30, type: 'turret', hp: 140, maxHp: 140, shootTimer: 40, angle: 0, color: '#88ff44' },
        { x: 1300, y: 510, w: 36, h: 40, type: 'patrol', hp: 110, maxHp: 110, vx: 2, dir: 1, shootTimer: 25, patrolStart: 1230, patrolEnd: 1450, color: '#22ff44' },
        { x: 1550, y: 230, w: 30, h: 24, type: 'drone', hp: 100, maxHp: 100, baseY: 230, floatTimer: Math.PI, shootTimer: 40, color: '#88ff88' },
        { x: 1700, y: 520, w: 32, h: 30, type: 'turret', hp: 150, maxHp: 150, shootTimer: 40, angle: 0, color: '#aaff44' },
        { x: 2000, y: 510, w: 36, h: 40, type: 'patrol', hp: 120, maxHp: 120, vx: 2, dir: 1, shootTimer: 25, patrolStart: 1830, patrolEnd: 2150, color: '#22ff44' },
        { x: 2250, y: 220, w: 30, h: 24, type: 'drone', hp: 110, maxHp: 110, baseY: 220, floatTimer: 0, shootTimer: 35, color: '#88ff88' },
        { x: 2400, y: 520, w: 32, h: 30, type: 'turret', hp: 160, maxHp: 160, shootTimer: 35, angle: 0, color: '#aaff44' },
        // Extended zone
        { x: 2600, y: 510, w: 36, h: 40, type: 'patrol', hp: 130, maxHp: 130, vx: 2.1, dir: 1, shootTimer: 25, patrolStart: 2490, patrolEnd: 2830, color: '#22ff44' },
        { x: 2750, y: 230, w: 30, h: 24, type: 'drone', hp: 120, maxHp: 120, baseY: 230, floatTimer: Math.PI / 2, shootTimer: 35, color: '#aaff88' },
        { x: 2950, y: 520, w: 32, h: 30, type: 'turret', hp: 180, maxHp: 180, shootTimer: 32, angle: 0, color: '#aaff44' },
        { x: 3100, y: 510, w: 36, h: 40, type: 'patrol', hp: 140, maxHp: 140, vx: 2.2, dir: 1, shootTimer: 22, patrolStart: 2900, patrolEnd: 3220, color: '#22ff44' },
        // Stage 4 elite zone - new enemies
        { x: 3000, y: 504, w: 46, h: 46, type: 'heavy', hp: 250, maxHp: 250, vx: 0.8, dir: 1, shootTimer: 30, patrolStart: 2890, patrolEnd: 3220, color: '#22aa44' },
        { x: 3200, y: 510, w: 38, h: 40, type: 'shielder', hp: 180, maxHp: 180, vx: 1.4, dir: 1, shootTimer: 30, patrolStart: 3150, patrolEnd: 3300, color: '#88ff44', shieldColor: '#88ffff' },
        // BOSS RAVAGER - charges and minigun-spreads (HP reduced for difficulty curve)
        { x: 3500, y: 350, w: 110, h: 110, type: 'boss', subtype: 'ravager', hp: 750, maxHp: 750, phase: 1, shootTimer: 110, moveTimer: 0, baseX: 3500, baseY: 350, color: '#22ff44', attackPattern: 0 }
    ];
    dangerZones = [
        { x: 350, triggered: false, text: '⚠ DANGER: SECURITY BOTS ⚠' },
        { x: 800, triggered: false, text: '⚠ DANGER: TURRET ARRAY ⚠' },
        { x: 1280, triggered: false, text: '⚠ DANGER: ELITE GUARD ⚠' },
        { x: 1880, triggered: false, text: '⚠ DANGER: WEAPONS DIVISION ⚠' },
        { x: 2350, triggered: false, text: '⚠ DANGER: HEAVY DEFENSE ⚠' },
        { x: 2750, triggered: false, text: '⚠ DANGER: LAB ENFORCEMENT ⚠' },
        { x: 3150, triggered: false, text: '⚠ DANGER: PROTOTYPE GUARDS ⚠' },
        { x: 3300, triggered: false, text: '⚠⚠ BOSS: RAVAGER ENGAGED ⚠⚠' }
    ];
    shops = [
        { x: 1030, y: 510, w: 50, h: 40 },
        { x: 1770, y: 510, w: 50, h: 40 },
        { x: 2550, y: 510, w: 50, h: 40 },
        { x: 3260, y: 510, w: 50, h: 40 }
    ];
}

function buildStage5() {
    // STAGE 5: ARCTIC OUTPOST - icy blue. Slippery feel via more open spaces. CRYO-LORD boss.
    platforms = [
        { x: 0, y: 550, w: 380, h: 50, type: 'ground' },
        { x: 410, y: 550, w: 280, h: 50, type: 'ground' },
        { x: 720, y: 550, w: 320, h: 50, type: 'ground' },
        { x: 1070, y: 550, w: 280, h: 50, type: 'ground' },
        { x: 1380, y: 550, w: 320, h: 50, type: 'ground' },
        { x: 1730, y: 550, w: 300, h: 50, type: 'ground' },
        { x: 2060, y: 550, w: 320, h: 50, type: 'ground' },
        { x: 2410, y: 550, w: 280, h: 50, type: 'ground' },
        { x: 2720, y: 550, w: 350, h: 50, type: 'ground' },
        { x: 3100, y: 550, w: 700, h: 50, type: 'ground' },
        // Recovery
        { x: 380, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 690, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 1040, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 1350, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 1700, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 2030, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 2380, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 2690, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 3070, y: 595, w: 50, h: 8, type: 'recovery' },
        // Ice platforms
        { x: 180, y: 420, w: 110, h: 16, type: 'platform' },
        { x: 340, y: 320, w: 100, h: 16, type: 'platform' },
        { x: 520, y: 240, w: 100, h: 16, type: 'platform' },
        { x: 700, y: 320, w: 100, h: 16, type: 'platform' },
        { x: 880, y: 220, w: 100, h: 16, type: 'platform' },
        { x: 1060, y: 320, w: 100, h: 16, type: 'platform' },
        { x: 1240, y: 220, w: 100, h: 16, type: 'platform' },
        { x: 1420, y: 320, w: 100, h: 16, type: 'platform' },
        { x: 1600, y: 220, w: 100, h: 16, type: 'platform' },
        { x: 1780, y: 320, w: 100, h: 16, type: 'platform' },
        { x: 1960, y: 220, w: 100, h: 16, type: 'platform' },
        { x: 2140, y: 320, w: 100, h: 16, type: 'platform' },
        { x: 2320, y: 220, w: 100, h: 16, type: 'platform' },
        { x: 2500, y: 320, w: 100, h: 16, type: 'platform' },
        { x: 2680, y: 220, w: 100, h: 16, type: 'platform' },
        { x: 2860, y: 380, w: 100, h: 16, type: 'platform' },
        { x: 3040, y: 280, w: 120, h: 16, type: 'platform' },
        // Walls
        { x: 670, y: 280, w: 20, h: 270, type: 'wall' },
        { x: 1200, y: 220, w: 20, h: 330, type: 'wall' },
        { x: 1750, y: 220, w: 20, h: 330, type: 'wall' },
        { x: 2300, y: 250, w: 20, h: 300, type: 'wall' },
        { x: 2840, y: 220, w: 20, h: 330, type: 'wall' },
        // Ice spike traps
        { x: 690, y: 540, w: 30, h: 10, type: 'spike' },
        { x: 1340, y: 540, w: 40, h: 10, type: 'spike' },
        { x: 2040, y: 540, w: 30, h: 10, type: 'spike' },
        { x: 2680, y: 540, w: 40, h: 10, type: 'spike' },
    ];
    enemies = [
        { x: 480, y: 510, w: 36, h: 40, type: 'patrol', hp: 150, maxHp: 150, vx: 2.2, dir: 1, shootTimer: 25, patrolStart: 410, patrolEnd: 690, color: '#88ccff' },
        { x: 600, y: 200, w: 30, h: 24, type: 'drone', hp: 130, maxHp: 130, baseY: 200, floatTimer: 0, shootTimer: 35, color: '#aaeeff' },
        { x: 800, y: 520, w: 32, h: 30, type: 'turret', hp: 200, maxHp: 200, shootTimer: 30, angle: 0, color: '#66bbff' },
        { x: 1100, y: 510, w: 36, h: 40, type: 'patrol', hp: 170, maxHp: 170, vx: 2.4, dir: 1, shootTimer: 25, patrolStart: 1070, patrolEnd: 1340, color: '#88ccff' },
        { x: 1300, y: 200, w: 30, h: 24, type: 'drone', hp: 150, maxHp: 150, baseY: 200, floatTimer: Math.PI, shootTimer: 30, color: '#aaeeff' },
        { x: 1500, y: 520, w: 32, h: 30, type: 'turret', hp: 220, maxHp: 220, shootTimer: 28, angle: 0, color: '#66bbff' },
        { x: 1800, y: 510, w: 36, h: 40, type: 'patrol', hp: 190, maxHp: 190, vx: 2.5, dir: 1, shootTimer: 22, patrolStart: 1730, patrolEnd: 2020, color: '#88ccff' },
        { x: 2000, y: 200, w: 30, h: 24, type: 'drone', hp: 170, maxHp: 170, baseY: 200, floatTimer: 0, shootTimer: 28, color: '#ccffff' },
        { x: 2200, y: 520, w: 32, h: 30, type: 'turret', hp: 240, maxHp: 240, shootTimer: 26, angle: 0, color: '#66bbff' },
        { x: 2500, y: 510, w: 36, h: 40, type: 'patrol', hp: 200, maxHp: 200, vx: 2.6, dir: 1, shootTimer: 22, patrolStart: 2410, patrolEnd: 2680, color: '#88ccff' },
        { x: 2700, y: 200, w: 30, h: 24, type: 'drone', hp: 180, maxHp: 180, baseY: 200, floatTimer: Math.PI / 2, shootTimer: 26, color: '#ccffff' },
        { x: 2900, y: 520, w: 32, h: 30, type: 'turret', hp: 260, maxHp: 260, shootTimer: 24, angle: 0, color: '#88aaff' },
        // Stage 5 elite zone - jumpers + sniper
        { x: 1600, y: 510, w: 38, h: 32, type: 'jumper', hp: 130, maxHp: 130, vx: 0, vy: 0, jumpTimer: 60, color: '#ddffff', onGround: true },
        { x: 2200, y: 510, w: 38, h: 32, type: 'jumper', hp: 150, maxHp: 150, vx: 0, vy: 0, jumpTimer: 60, color: '#aaccff', onGround: true },
        { x: 2900, y: 504, w: 38, h: 46, type: 'sniper', hp: 220, maxHp: 220, shootTimer: 50, aimTimer: 0, aimAngle: 0, color: '#88ccff' },
        // BOSS CRYO-LORD - frost shots, freezes time briefly via screen shake (HP reduced)
        { x: 3400, y: 320, w: 100, h: 110, type: 'boss', subtype: 'cryo', hp: 700, maxHp: 700, phase: 1, shootTimer: 110, moveTimer: 0, baseX: 3400, baseY: 320, color: '#88ccff', attackPattern: 0 }
    ];
    dangerZones = [
        { x: 350, triggered: false, text: '⚠ DANGER: ARCTIC PATROL ⚠' },
        { x: 760, triggered: false, text: '⚠ DANGER: ICE TURRET ⚠' },
        { x: 1280, triggered: false, text: '⚠ DANGER: FROST DRONES ⚠' },
        { x: 1830, triggered: false, text: '⚠ DANGER: COLD STORM SQUAD ⚠' },
        { x: 2360, triggered: false, text: '⚠ DANGER: HEAVY ICE BOTS ⚠' },
        { x: 2840, triggered: false, text: '⚠ DANGER: BLIZZARD ELITES ⚠' },
        { x: 3200, triggered: false, text: '⚠⚠ BOSS: CRYO-LORD ⚠⚠' }
    ];
    shops = [
        { x: 1040, y: 510, w: 50, h: 40 },
        { x: 1700, y: 510, w: 50, h: 40 },
        { x: 2380, y: 510, w: 50, h: 40 },
        { x: 3070, y: 510, w: 50, h: 40 }
    ];
}

function buildStage6() {
    // STAGE 6: VOID GATEWAY - dark purple, bullet hell, dense enemies. NULLIFIER boss.
    platforms = [
        { x: 0, y: 550, w: 350, h: 50, type: 'ground' },
        { x: 380, y: 550, w: 280, h: 50, type: 'ground' },
        { x: 690, y: 550, w: 300, h: 50, type: 'ground' },
        { x: 1020, y: 550, w: 280, h: 50, type: 'ground' },
        { x: 1330, y: 550, w: 300, h: 50, type: 'ground' },
        { x: 1660, y: 550, w: 280, h: 50, type: 'ground' },
        { x: 1970, y: 550, w: 320, h: 50, type: 'ground' },
        { x: 2320, y: 550, w: 280, h: 50, type: 'ground' },
        { x: 2630, y: 550, w: 320, h: 50, type: 'ground' },
        { x: 2980, y: 550, w: 280, h: 50, type: 'ground' },
        { x: 3290, y: 550, w: 700, h: 50, type: 'ground' },
        // Recovery
        { x: 350, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 660, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 990, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 1300, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 1630, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 1940, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 2290, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 2600, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 2950, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 3260, y: 595, w: 50, h: 8, type: 'recovery' },
        // Void platforms - more dense
        { x: 150, y: 420, w: 90, h: 16, type: 'platform' },
        { x: 290, y: 350, w: 90, h: 16, type: 'platform' },
        { x: 430, y: 280, w: 90, h: 16, type: 'platform' },
        { x: 580, y: 220, w: 90, h: 16, type: 'platform' },
        { x: 740, y: 280, w: 90, h: 16, type: 'platform' },
        { x: 900, y: 350, w: 90, h: 16, type: 'platform' },
        { x: 1060, y: 280, w: 90, h: 16, type: 'platform' },
        { x: 1220, y: 200, w: 90, h: 16, type: 'platform' },
        { x: 1380, y: 280, w: 90, h: 16, type: 'platform' },
        { x: 1540, y: 380, w: 90, h: 16, type: 'platform' },
        { x: 1700, y: 280, w: 90, h: 16, type: 'platform' },
        { x: 1860, y: 200, w: 90, h: 16, type: 'platform' },
        { x: 2020, y: 280, w: 90, h: 16, type: 'platform' },
        { x: 2180, y: 380, w: 90, h: 16, type: 'platform' },
        { x: 2340, y: 250, w: 90, h: 16, type: 'platform' },
        { x: 2500, y: 320, w: 90, h: 16, type: 'platform' },
        { x: 2680, y: 220, w: 90, h: 16, type: 'platform' },
        { x: 2860, y: 320, w: 90, h: 16, type: 'platform' },
        { x: 3040, y: 220, w: 90, h: 16, type: 'platform' },
        { x: 3220, y: 320, w: 110, h: 16, type: 'platform' },
        // Walls
        { x: 540, y: 250, w: 20, h: 300, type: 'wall' },
        { x: 1160, y: 200, w: 20, h: 350, type: 'wall' },
        { x: 1640, y: 200, w: 20, h: 350, type: 'wall' },
        { x: 2120, y: 250, w: 20, h: 300, type: 'wall' },
        { x: 2620, y: 220, w: 20, h: 330, type: 'wall' },
        { x: 3160, y: 220, w: 20, h: 330, type: 'wall' },
        // Void hazards
        { x: 660, y: 540, w: 30, h: 10, type: 'spike' },
        { x: 1310, y: 540, w: 80, h: 10, type: 'laser', phase: 0 },
        { x: 1940, y: 540, w: 30, h: 10, type: 'spike' },
        { x: 2300, y: 540, w: 80, h: 10, type: 'laser', phase: 1 },
        { x: 2950, y: 540, w: 100, h: 10, type: 'laser', phase: 0 },
    ];
    enemies = [
        { x: 450, y: 510, w: 36, h: 40, type: 'patrol', hp: 180, maxHp: 180, vx: 2.5, dir: 1, shootTimer: 22, patrolStart: 380, patrolEnd: 660, color: '#aa44ff' },
        { x: 600, y: 240, w: 30, h: 24, type: 'drone', hp: 160, maxHp: 160, baseY: 240, floatTimer: 0, shootTimer: 30, color: '#cc66ff' },
        { x: 800, y: 520, w: 32, h: 30, type: 'turret', hp: 230, maxHp: 230, shootTimer: 28, angle: 0, color: '#aa00ff' },
        { x: 1050, y: 510, w: 36, h: 40, type: 'patrol', hp: 200, maxHp: 200, vx: 2.6, dir: 1, shootTimer: 22, patrolStart: 1020, patrolEnd: 1300, color: '#aa44ff' },
        { x: 1250, y: 220, w: 30, h: 24, type: 'drone', hp: 180, maxHp: 180, baseY: 220, floatTimer: Math.PI, shootTimer: 28, color: '#cc66ff' },
        { x: 1400, y: 520, w: 32, h: 30, type: 'turret', hp: 250, maxHp: 250, shootTimer: 25, angle: 0, color: '#aa00ff' },
        { x: 1750, y: 510, w: 36, h: 40, type: 'patrol', hp: 220, maxHp: 220, vx: 2.7, dir: 1, shootTimer: 20, patrolStart: 1700, patrolEnd: 1980, color: '#aa44ff' },
        { x: 1900, y: 200, w: 30, h: 24, type: 'drone', hp: 200, maxHp: 200, baseY: 200, floatTimer: 0, shootTimer: 25, color: '#dd88ff' },
        { x: 2080, y: 520, w: 32, h: 30, type: 'turret', hp: 280, maxHp: 280, shootTimer: 24, angle: 0, color: '#bb00ff' },
        { x: 2300, y: 510, w: 36, h: 40, type: 'patrol', hp: 240, maxHp: 240, vx: 2.8, dir: 1, shootTimer: 20, patrolStart: 2240, patrolEnd: 2580, color: '#aa44ff' },
        { x: 2450, y: 220, w: 30, h: 24, type: 'drone', hp: 220, maxHp: 220, baseY: 220, floatTimer: Math.PI / 2, shootTimer: 24, color: '#dd88ff' },
        { x: 2700, y: 520, w: 32, h: 30, type: 'turret', hp: 300, maxHp: 300, shootTimer: 22, angle: 0, color: '#bb00ff' },
        { x: 2900, y: 510, w: 36, h: 40, type: 'patrol', hp: 250, maxHp: 250, vx: 3, dir: 1, shootTimer: 20, patrolStart: 2840, patrolEnd: 3160, color: '#aa44ff' },
        { x: 3100, y: 200, w: 30, h: 24, type: 'drone', hp: 240, maxHp: 240, baseY: 200, floatTimer: 0, shootTimer: 22, color: '#ee88ff' },
        // Void elite squad
        { x: 1800, y: 510, w: 38, h: 40, type: 'shielder', hp: 220, maxHp: 220, vx: 1.6, dir: 1, shootTimer: 30, patrolStart: 1700, patrolEnd: 2000, color: '#aa66ff', shieldColor: '#cc88ff' },
        { x: 2400, y: 504, w: 46, h: 46, type: 'heavy', hp: 320, maxHp: 320, vx: 1, dir: 1, shootTimer: 30, patrolStart: 2300, patrolEnd: 2620, color: '#aa44ff' },
        { x: 2950, y: 504, w: 38, h: 46, type: 'sniper', hp: 280, maxHp: 280, shootTimer: 60, aimTimer: 0, aimAngle: 0, color: '#cc66ff' },
        { x: 3300, y: 510, w: 38, h: 32, type: 'jumper', hp: 200, maxHp: 200, vx: 0, vy: 0, jumpTimer: 50, color: '#dd44ff', onGround: true },
        // BOSS NULLIFIER - teleports, dense bullet patterns (HP reduced)
        { x: 3600, y: 300, w: 110, h: 120, type: 'boss', subtype: 'nullifier', hp: 800, maxHp: 800, phase: 1, shootTimer: 110, moveTimer: 0, baseX: 3600, baseY: 300, color: '#aa00ff', attackPattern: 0 }
    ];
    dangerZones = [
        { x: 300, triggered: false, text: '⚠ DANGER: VOID HOSTILES ⚠' },
        { x: 750, triggered: false, text: '⚠ DANGER: VOID TURRET ⚠' },
        { x: 1200, triggered: false, text: '⚠ DANGER: SHADOW SQUAD ⚠' },
        { x: 1700, triggered: false, text: '⚠ DANGER: NULLITY DRONES ⚠' },
        { x: 2200, triggered: false, text: '⚠ DANGER: VOID ELITES ⚠' },
        { x: 2700, triggered: false, text: '⚠ DANGER: APEX VOIDLINGS ⚠' },
        { x: 3100, triggered: false, text: '⚠ DANGER: GATEWAY DEFENDERS ⚠' },
        { x: 3400, triggered: false, text: '⚠⚠ BOSS: NULLIFIER ⚠⚠' }
    ];
    shops = [
        { x: 990, y: 510, w: 50, h: 40 },
        { x: 1660, y: 510, w: 50, h: 40 },
        { x: 2330, y: 510, w: 50, h: 40 },
        { x: 2990, y: 510, w: 50, h: 40 },
        { x: 3270, y: 510, w: 50, h: 40 }
    ];
}

function buildStage7() {
    // STAGE 7: COMMAND CITADEL - final stage. Long, packed, ends with OMEGA-PRIME
    platforms = [
        { x: 0, y: 550, w: 350, h: 50, type: 'ground' },
        { x: 380, y: 550, w: 300, h: 50, type: 'ground' },
        { x: 710, y: 550, w: 280, h: 50, type: 'ground' },
        { x: 1020, y: 550, w: 300, h: 50, type: 'ground' },
        { x: 1350, y: 550, w: 320, h: 50, type: 'ground' },
        { x: 1700, y: 550, w: 280, h: 50, type: 'ground' },
        { x: 2010, y: 550, w: 320, h: 50, type: 'ground' },
        { x: 2360, y: 550, w: 280, h: 50, type: 'ground' },
        { x: 2670, y: 550, w: 350, h: 50, type: 'ground' },
        { x: 3050, y: 550, w: 280, h: 50, type: 'ground' },
        { x: 3360, y: 550, w: 700, h: 50, type: 'ground' },
        // Recovery
        { x: 340, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 670, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 980, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 1310, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 1660, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 1970, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 2320, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 2630, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 3010, y: 595, w: 50, h: 8, type: 'recovery' },
        { x: 3320, y: 595, w: 50, h: 8, type: 'recovery' },
        // Citadel platforms
        { x: 150, y: 420, w: 90, h: 16, type: 'platform' },
        { x: 290, y: 350, w: 90, h: 16, type: 'platform' },
        { x: 430, y: 280, w: 90, h: 16, type: 'platform' },
        { x: 580, y: 220, w: 90, h: 16, type: 'platform' },
        { x: 740, y: 280, w: 90, h: 16, type: 'platform' },
        { x: 900, y: 350, w: 90, h: 16, type: 'platform' },
        { x: 1060, y: 280, w: 90, h: 16, type: 'platform' },
        { x: 1220, y: 200, w: 90, h: 16, type: 'platform' },
        { x: 1380, y: 280, w: 90, h: 16, type: 'platform' },
        { x: 1540, y: 380, w: 90, h: 16, type: 'platform' },
        { x: 1700, y: 280, w: 90, h: 16, type: 'platform' },
        { x: 1860, y: 200, w: 90, h: 16, type: 'platform' },
        { x: 2020, y: 280, w: 90, h: 16, type: 'platform' },
        { x: 2180, y: 380, w: 90, h: 16, type: 'platform' },
        { x: 2340, y: 250, w: 90, h: 16, type: 'platform' },
        { x: 2500, y: 180, w: 110, h: 16, type: 'platform' },
        { x: 2680, y: 280, w: 90, h: 16, type: 'platform' },
        { x: 2840, y: 220, w: 90, h: 16, type: 'platform' },
        { x: 3000, y: 280, w: 90, h: 16, type: 'platform' },
        { x: 3160, y: 200, w: 90, h: 16, type: 'platform' },
        { x: 3320, y: 280, w: 110, h: 16, type: 'platform' },
        // Walls
        { x: 540, y: 250, w: 20, h: 300, type: 'wall' },
        { x: 1160, y: 200, w: 20, h: 350, type: 'wall' },
        { x: 1640, y: 200, w: 20, h: 350, type: 'wall' },
        { x: 2120, y: 250, w: 20, h: 300, type: 'wall' },
        { x: 2620, y: 200, w: 20, h: 350, type: 'wall' },
        { x: 3120, y: 200, w: 20, h: 350, type: 'wall' },
        // Citadel hazards - many lasers and spikes
        { x: 990, y: 540, w: 80, h: 10, type: 'laser', phase: 0 },
        { x: 1320, y: 540, w: 30, h: 10, type: 'spike' },
        { x: 1670, y: 540, w: 80, h: 10, type: 'laser', phase: 1 },
        { x: 2020, y: 540, w: 30, h: 10, type: 'spike' },
        { x: 2370, y: 540, w: 80, h: 10, type: 'laser', phase: 0 },
        { x: 2680, y: 540, w: 40, h: 10, type: 'spike' },
        { x: 3020, y: 540, w: 80, h: 10, type: 'laser', phase: 1 },
    ];
    enemies = [
        { x: 450, y: 510, w: 36, h: 40, type: 'patrol', hp: 220, maxHp: 220, vx: 2.6, dir: 1, shootTimer: 22, patrolStart: 380, patrolEnd: 670, color: '#ff44ff' },
        { x: 600, y: 240, w: 30, h: 24, type: 'drone', hp: 200, maxHp: 200, baseY: 240, floatTimer: 0, shootTimer: 28, color: '#ff88ff' },
        { x: 800, y: 520, w: 32, h: 30, type: 'turret', hp: 280, maxHp: 280, shootTimer: 26, angle: 0, color: '#ff44ff' },
        { x: 1050, y: 510, w: 36, h: 40, type: 'patrol', hp: 240, maxHp: 240, vx: 2.7, dir: 1, shootTimer: 22, patrolStart: 1020, patrolEnd: 1300, color: '#ff44ff' },
        { x: 1250, y: 220, w: 30, h: 24, type: 'drone', hp: 220, maxHp: 220, baseY: 220, floatTimer: Math.PI, shootTimer: 26, color: '#ff88ff' },
        { x: 1400, y: 520, w: 32, h: 30, type: 'turret', hp: 300, maxHp: 300, shootTimer: 24, angle: 0, color: '#ff44ff' },
        { x: 1750, y: 510, w: 36, h: 40, type: 'patrol', hp: 260, maxHp: 260, vx: 2.8, dir: 1, shootTimer: 20, patrolStart: 1700, patrolEnd: 1980, color: '#ff44ff' },
        { x: 1900, y: 200, w: 30, h: 24, type: 'drone', hp: 240, maxHp: 240, baseY: 200, floatTimer: 0, shootTimer: 24, color: '#ffaaff' },
        { x: 2080, y: 520, w: 32, h: 30, type: 'turret', hp: 320, maxHp: 320, shootTimer: 22, angle: 0, color: '#ff44ff' },
        { x: 2300, y: 510, w: 36, h: 40, type: 'patrol', hp: 280, maxHp: 280, vx: 3, dir: 1, shootTimer: 20, patrolStart: 2240, patrolEnd: 2580, color: '#ff44ff' },
        { x: 2450, y: 220, w: 30, h: 24, type: 'drone', hp: 260, maxHp: 260, baseY: 220, floatTimer: Math.PI / 2, shootTimer: 22, color: '#ffaaff' },
        { x: 2700, y: 510, w: 36, h: 40, type: 'patrol', hp: 300, maxHp: 300, vx: 3, dir: 1, shootTimer: 18, patrolStart: 2670, patrolEnd: 3000, color: '#ff44ff' },
        { x: 2900, y: 200, w: 30, h: 24, type: 'drone', hp: 280, maxHp: 280, baseY: 200, floatTimer: 0, shootTimer: 22, color: '#ffaaff' },
        { x: 3100, y: 520, w: 32, h: 30, type: 'turret', hp: 350, maxHp: 350, shootTimer: 20, angle: 0, color: '#ff44ff' },
        { x: 3250, y: 510, w: 36, h: 40, type: 'patrol', hp: 320, maxHp: 320, vx: 3, dir: 1, shootTimer: 18, patrolStart: 3200, patrolEnd: 3360, color: '#ff44ff' },
        // Royal guard - all elite types
        { x: 1500, y: 510, w: 38, h: 40, type: 'shielder', hp: 280, maxHp: 280, vx: 1.8, dir: 1, shootTimer: 25, patrolStart: 1450, patrolEnd: 1700, color: '#ff44ff', shieldColor: '#ffaaff' },
        { x: 2200, y: 504, w: 46, h: 46, type: 'heavy', hp: 380, maxHp: 380, vx: 1, dir: 1, shootTimer: 28, patrolStart: 2100, patrolEnd: 2400, color: '#ff66ff' },
        { x: 2700, y: 510, w: 38, h: 32, type: 'jumper', hp: 240, maxHp: 240, vx: 0, vy: 0, jumpTimer: 45, color: '#ff88ff', onGround: true },
        { x: 3000, y: 504, w: 38, h: 46, type: 'sniper', hp: 320, maxHp: 320, shootTimer: 55, aimTimer: 0, aimAngle: 0, color: '#ff44ff' },
        { x: 3300, y: 510, w: 38, h: 40, type: 'shielder', hp: 320, maxHp: 320, vx: 2, dir: 1, shootTimer: 22, patrolStart: 3200, patrolEnd: 3450, color: '#ff44ff', shieldColor: '#ffaaff' },
        // FINAL BOSS OMEGA-PRIME (HP reduced for difficulty curve — still beefy)
        { x: 3700, y: 300, w: 130, h: 140, type: 'boss', subtype: 'omega', hp: 1300, maxHp: 1300, phase: 1, shootTimer: 110, moveTimer: 0, baseX: 3700, baseY: 300, color: '#ffffff', attackPattern: 0 }
    ];
    dangerZones = [
        { x: 300, triggered: false, text: '⚠ DANGER: ELITE CITADEL GUARD ⚠' },
        { x: 750, triggered: false, text: '⚠ DANGER: HEAVY TURRET ⚠' },
        { x: 1200, triggered: false, text: '⚠ DANGER: COMMAND ENFORCERS ⚠' },
        { x: 1700, triggered: false, text: '⚠ DANGER: APEX SQUAD ⚠' },
        { x: 2200, triggered: false, text: '⚠ DANGER: CITADEL ELITES ⚠' },
        { x: 2650, triggered: false, text: '⚠ DANGER: ROYAL GUARD ⚠' },
        { x: 3150, triggered: false, text: '⚠ DANGER: OMEGA SENTINELS ⚠' },
        { x: 3500, triggered: false, text: '⚠⚠⚠ FINAL BOSS: OMEGA-PRIME ⚠⚠⚠' }
    ];
    shops = [
        { x: 980, y: 510, w: 50, h: 40 },
        { x: 1660, y: 510, w: 50, h: 40 },
        { x: 2320, y: 510, w: 50, h: 40 },
        { x: 3000, y: 510, w: 50, h: 40 },
        { x: 3450, y: 510, w: 50, h: 40 }
    ];
}

function buildStage8() {
    // STAGE 8: ORBITAL FORTRESS — final-final stage. Long, vertical, light enemy
    // count (cleaner) but every enemy is elite-tier. Ends with TITAN-LORD who
    // transforms into a battleship in phase 2.
    platforms = [
        // Approach corridor — clean ground with floating dock segments
        { x: 0, y: 550, w: 1100, h: 50, type: 'ground' },
        { x: 1100, y: 550, w: 200, h: 50, type: 'ground' },
        { x: 1300, y: 550, w: 220, h: 50, type: 'ground' },
        { x: 1520, y: 550, w: 1300, h: 50, type: 'ground' },
        { x: 2820, y: 550, w: 380, h: 50, type: 'ground' },
        { x: 3200, y: 550, w: 1700, h: 50, type: 'ground' },
        // Floating combat decks (kept sparse on purpose)
        { x: 350, y: 410, w: 220, h: 14, type: 'platform' },
        { x: 720, y: 340, w: 200, h: 14, type: 'platform' },
        { x: 1080, y: 410, w: 200, h: 14, type: 'platform' },
        { x: 1440, y: 340, w: 240, h: 14, type: 'platform' },
        { x: 1800, y: 270, w: 220, h: 14, type: 'platform' },
        { x: 2160, y: 340, w: 240, h: 14, type: 'platform' },
        { x: 2540, y: 270, w: 200, h: 14, type: 'platform' },
        { x: 2900, y: 410, w: 220, h: 14, type: 'platform' },
        { x: 3260, y: 340, w: 240, h: 14, type: 'platform' },
        { x: 3620, y: 270, w: 220, h: 14, type: 'platform' },
        // Recovery puddle (shoot for HP) outside the boss arena
        { x: 4140, y: 540, w: 80, h: 10, type: 'recovery' }
    ];
    enemies = [
        // Curated elite spawn list — fewer enemies but each is dangerous.
        // Stage 8 uses MK-III patrols as the baseline.
        { x: 600, y: 514, w: 38, h: 36, type: 'patrol',   hp: 240, maxHp: 240, vx: 1.6, dir: 1, shootTimer: 22, patrolStart: 500, patrolEnd: 800, color: '#66ffff' },
        { x: 1180, y: 504, w: 40, h: 46, type: 'sniper',  hp: 280, maxHp: 280, shootTimer: 60, aimTimer: 0, aimAngle: 0, color: '#aaffff' },
        { x: 1620, y: 504, w: 44, h: 50, type: 'heavy',   hp: 380, maxHp: 380, shootTimer: 28, vx: 0.6, dir: 1, patrolStart: 1560, patrolEnd: 1800, color: '#88ffff' },
        { x: 2080, y: 220, w: 32, h: 26, type: 'drone',   hp: 160, maxHp: 160, baseY: 220, floatTimer: Math.PI / 2, shootTimer: 45, color: '#aaccff' },
        { x: 2400, y: 510, w: 38, h: 40, type: 'shielder',hp: 350, maxHp: 350, vx: 1.6, dir: 1, shootTimer: 22, patrolStart: 2350, patrolEnd: 2600, color: '#66ffff', shieldColor: '#aaffff' },
        { x: 2780, y: 510, w: 36, h: 36, type: 'sprinter',hp: 200, maxHp: 200, vx: 0, dir: 1, shootTimer: 24, patrolStart: 2700, patrolEnd: 3000, color: '#ddffff' },
        { x: 3060, y: 220, w: 32, h: 26, type: 'drone',   hp: 160, maxHp: 160, baseY: 220, floatTimer: 0, shootTimer: 45, color: '#aaccff' },
        { x: 3380, y: 510, w: 38, h: 46, type: 'sniper',  hp: 320, maxHp: 320, shootTimer: 55, aimTimer: 0, aimAngle: 0, color: '#aaffff' },
        // Two MECHs guard the throat of the corridor — the visual gauntlet
        { x: 3720, y: 470, w: 80, h: 80, type: 'mech',    hp: 600, maxHp: 600, shootTimer: 60, attackPhase: 0, walkPhase: 0, vx: 0, vy: 0, facing: -1, onGround: false, baseY: 470, color: '#66ffff' },
        // FINAL-FINAL BOSS TITAN-LORD - mech that transforms into a battleship
        { x: 4700, y: 280, w: 160, h: 170, type: 'boss', subtype: 'titan', hp: 1800, maxHp: 1800, phase: 1, shootTimer: 110, moveTimer: 0, baseX: 4700, baseY: 280, color: '#66ffff', attackPattern: 0, transformTimer: 0, transformed: false }
    ];
    dangerZones = [
        { x: 300, triggered: false, text: '⚠ ORBITAL FORTRESS — ELITE GUARDS ⚠' },
        { x: 1500, triggered: false, text: '⚠ DANGER: VOID-ARMOR HEAVIES ⚠' },
        { x: 2700, triggered: false, text: '⚠ DANGER: APEX SENTINELS ⚠' },
        { x: 3700, triggered: false, text: '⚠ DANGER: TWIN MECH GAUNTLET ⚠' },
        { x: 4100, triggered: false, text: '⚠⚠⚠ TITAN-LORD INCOMING ⚠⚠⚠' }
    ];
    shops = [
        { x: 1240, y: 510, w: 50, h: 40 },
        { x: 2480, y: 510, w: 50, h: 40 },
        { x: 3540, y: 510, w: 50, h: 40 }
    ];
}
document.addEventListener('keydown', e => {
    keys[e.code] = true;
    // Prevent page scroll on game keys
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
        e.preventDefault();
    }
});
document.addEventListener('keyup', e => { keys[e.code] = false; });
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left + camera.x;
    mouse.y = e.clientY - rect.top + camera.y;
});
canvas.addEventListener('mousedown', e => {
    mouse.down = true;
    mouse.justPressed = true;
});
canvas.addEventListener('mouseup', e => { mouse.down = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Collision detection
function rectCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function pointInRect(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// Particle system
// Particle system. Global cap keeps the screen readable — when the game
// gets busy (big bosses, multi-explosion screens) we'd otherwise drown in
// floating dust. Excess spawn requests beyond MAX_PARTICLES are dropped
// instead of clobbering the array; this is the single biggest "professional
// game polish" cleanup.
const MAX_PARTICLES = 280;
function spawnParticles(x, y, color, count, speed) {
    // Soft cap — if we're already at limit, refuse new spawns so big hits
    // don't crush framerate and so the screen stays readable.
    const slack = Math.max(0, MAX_PARTICLES - particles.length);
    if (slack === 0) return;
    const actualCount = Math.min(count, slack);
    for (let i = 0; i < actualCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * speed + 1;
        particles.push({
            x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
            life: 1, decay: 0.02 + Math.random() * 0.03,
            size: 2 + Math.random() * 4, color
        });
    }
}

function spawnExplosion(x, y) {
    spawnParticles(x, y, '#ff4400', 15, 5);
    spawnParticles(x, y, '#ffaa00', 10, 3);
    spawnParticles(x, y, '#ffffff', 5, 2);
    screenShake = 8;
    // Shockwave ring for visual impact
    shockwaves.push({ x, y, r: 6, maxR: 80, color: '#ffaa44', alpha: 1 });
}

// Spawn a brief expanding ring (used for big hits, crits, evolution etc.).
// Capped so screen stays readable in busy fights.
const MAX_SHOCKWAVES = 24;
function spawnShockwave(x, y, maxR, color) {
    if (shockwaves.length >= MAX_SHOCKWAVES) return;
    shockwaves.push({ x, y, r: 4, maxR: maxR || 100, color: color || '#ffffff', alpha: 1 });
}

// Spawn a floating damage number above an enemy when it gets hit.
// `kind` can be 'normal', 'crit', 'burn', 'aoe' — tints the text accordingly.
function spawnDamageNumber(x, y, dmg, kind) {
    const colors = {
        normal: '#ffffff',
        crit:   '#ffdd44',
        burn:   '#ff6622',
        aoe:    '#ff44aa',
        heal:   '#66ff88'
    };
    damageNumbers.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y - 4,
        vx: (Math.random() - 0.5) * 1.4,
        vy: -2.2 - Math.random() * 0.6,
        text: (kind === 'crit' ? 'CRIT ' : '') + Math.round(dmg),
        color: colors[kind] || '#ffffff',
        life: kind === 'crit' ? 60 : 45,
        maxLife: kind === 'crit' ? 60 : 45,
        size: kind === 'crit' ? 18 : 13
    });
}

// Trigger short hitstop (gameplay freeze for impact). dur in frames.
function applyHitStop(dur) {
    if (dur > hitStop) hitStop = dur;
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
    }
    // Float texts
    for (let i = floatTexts.length - 1; i >= 0; i--) {
        const t = floatTexts[i];
        t.y -= 1.5;
        t.life--;
        if (t.life <= 0) floatTexts.splice(i, 1);
    }

    // Damage numbers - drift up and fade
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const d = damageNumbers[i];
        d.x += d.vx;
        d.y += d.vy;
        d.vy += 0.06;        // tiny gravity so they arc
        d.life--;
        if (d.life <= 0) damageNumbers.splice(i, 1);
    }

    // Shockwave rings expand and fade
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        const s = shockwaves[i];
        s.r += 4;
        s.alpha -= 0.04;
        if (s.alpha <= 0 || s.r >= s.maxR) shockwaves.splice(i, 1);
    }

    // Tick screen-flash overlays
    if (hitFlash > 0) hitFlash = Math.max(0, hitFlash - 0.06);
    if (critFlash > 0) critFlash = Math.max(0, critFlash - 0.05);
}

// Coins - bounce around, get pulled to player when close, collected on contact
function updateCoins() {
    // Combo timer decay
    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer <= 0) comboCount = 0;
    }

    for (let i = coinPickups.length - 1; i >= 0; i--) {
        const c = coinPickups[i];
        c.life--;
        if (c.life <= 0) { coinPickups.splice(i, 1); continue; }

        // Magnet effect - pull toward player when nearby
        const dx = (player.x + player.w / 2) - c.x;
        const dy = (player.y + player.h / 2) - c.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
            c.vx += (dx / dist) * 0.6;
            c.vy += (dy / dist) * 0.6;
        }

        // Gravity & drag
        c.vy += 0.25;
        c.vx *= 0.96;
        c.vy *= 0.96;
        c.x += c.vx;
        c.y += c.vy;

        // Bounce on platforms
        for (const plat of platforms) {
            if (c.x > plat.x && c.x < plat.x + plat.w && c.y > plat.y && c.y < plat.y + 8 && c.vy > 0) {
                c.y = plat.y;
                c.vy *= -0.5;
            }
        }

        // Pickup
        if (dist < 18) {
            if (c.robotCoin) {
                player.robotCoins += c.value;
                spawnParticles(c.x, c.y, '#ff00ff', 8, 4);
                floatTexts.push({ text: '+1 RC', x: c.x, y: c.y, life: 50, color: '#ff44ff' });
            } else {
                player.coins += c.value;
                spawnParticles(c.x, c.y, '#ffdd44', 4, 2);
            }
            coinPickups.splice(i, 1);
        }
    }
}

// Health drops
function updateHealthDrops() {
    for (let i = healthDrops.length - 1; i >= 0; i--) {
        const h = healthDrops[i];
        h.life--;
        if (h.life <= 0) { healthDrops.splice(i, 1); continue; }

        // Magnet
        const dx = (player.x + player.w / 2) - h.x;
        const dy = (player.y + player.h / 2) - h.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
            h.vx += (dx / dist) * 0.5;
            h.vy += (dy / dist) * 0.5;
        }

        h.vy += 0.25;
        h.vx *= 0.95;
        h.vy *= 0.97;
        h.x += h.vx;
        h.y += h.vy;

        // Bounce on platforms
        for (const plat of platforms) {
            if (h.x > plat.x && h.x < plat.x + plat.w && h.y > plat.y && h.y < plat.y + 8 && h.vy > 0) {
                h.y = plat.y;
                h.vy *= -0.4;
            }
        }

        // Pickup
        if (dist < 22) {
            player.hp = Math.min(player.maxHp, player.hp + h.heal);
            healthDrops.splice(i, 1);
            spawnParticles(h.x, h.y, '#ff66aa', 8, 3);
        }
    }
}

// Shop interaction
function updateShop() {
    // Find shop in range
    activeShop = null;
    for (const s of shops) {
        if (player.x + player.w > s.x - 20 && player.x < s.x + s.w + 20 &&
            player.y + player.h > s.y - 60 && player.y < s.y + s.h) {
            activeShop = s;
            break;
        }
    }

    // Toggle shop with E
    if (keys['KeyE'] && !player.shopKeyHeld) {
        if (activeShop) shopOpen = !shopOpen;
        player.shopKeyHeld = true;
    }
    if (!keys['KeyE']) player.shopKeyHeld = false;

    // Close if walked away
    if (!activeShop) shopOpen = false;

    // Buy items with number keys / letter keys
    if (shopOpen) {
        for (const item of SHOP_ITEMS) {
            let code;
            if (item.key === '0') code = 'Digit0';
            else if (/^[0-9]$/.test(item.key)) code = 'Digit' + item.key;
            else code = 'Key' + item.key;
            if (keys[code] && !player.shopBuyHeld) {
                // If weapon already owned, treat purchase as switch
                if (item.weapon && player.weaponsUnlocked[item.weapon]) {
                    player.weaponTier = item.weapon;
                    shopMessage = { text: `Equipped: ${WEAPONS[item.weapon].name}`, timer: 60, color: WEAPONS[item.weapon].color };
                } else if (player.coins >= item.cost) {
                    if (item.cost > 0) player.coins -= item.cost;
                    item.action(player);
                    if (item.switcher) {
                        const newW = WEAPONS[player.weaponTier];
                        shopMessage = { text: `Switched to: ${newW.name}`, timer: 60, color: newW.color };
                    } else if (item.weapon) {
                        const wpn = WEAPONS[item.weapon];
                        shopMessage = { text: `Bought: ${wpn.name}`, timer: 90, color: wpn.color };
                    } else {
                        shopMessage = { text: `Bought: ${item.name}`, timer: 60, color: '#00ff66' };
                    }
                    spawnParticles(player.x + player.w / 2, player.y, '#00ffaa', 10, 3);
                } else {
                    shopMessage = { text: 'Not enough coins!', timer: 60, color: '#ff3333' };
                }
                player.shopBuyHeld = true;
            }
        }
        let anyBuy = false;
        for (const item of SHOP_ITEMS) {
            let code;
            if (item.key === '0') code = 'Digit0';
            else if (/^[0-9]$/.test(item.key)) code = 'Digit' + item.key;
            else code = 'Key' + item.key;
            if (keys[code]) anyBuy = true;
        }
        if (!anyBuy) player.shopBuyHeld = false;
    }

    if (shopMessage) {
        shopMessage.timer--;
        if (shopMessage.timer <= 0) shopMessage = null;
    }
}

// Player update
function updatePlayer() {
    if (gameState !== 'playing') return;

    // Animate boss gates opening when player approaches
    for (const bg of bossGates) {
        if (bg.open) continue;
        const dist = Math.abs((player.x + player.w/2) - (bg.x + bg.w/2));
        if (dist < 200) {
            bg.animTimer = Math.min(60, bg.animTimer + 1);
            if (bg.animTimer >= 60) {
                bg.open = true;
                spawnParticles(bg.x + bg.w / 2, bg.y + bg.h / 2, bg.color, 30, 6);
                screenShake = 8;
            }
        } else {
            bg.animTimer = Math.max(0, bg.animTimer - 1);
        }
    }

    // Boss gate collision - closed boss gates block the player
    for (const bg of bossGates) {
        if (bg.open) continue;
        if (rectCollide(player, bg)) {
            if (player.x + player.w / 2 < bg.x + bg.w / 2) {
                player.x = bg.x - player.w;
            } else {
                player.x = bg.x + bg.w;
            }
            player.vx = 0;
        }
    }

    // Check exit portal collision (advances to next stage)
    for (const ep of exitPortals) {
        if (rectCollide(player, ep)) {
            // Trigger space transition fight before next stage. If the stage
            // defines a spaceCutscene, play it first; the cutscene handler will
            // start the actual space transition once dialogue ends.
            if (gameState === 'playing') {
                const stg = STAGES[currentStage];
                if (stg && stg.spaceCutscene && !stg.spaceCutsceneShown) {
                    stg.spaceCutsceneShown = true;
                    cutscene = {
                        stage: currentStage,
                        lines: stg.spaceCutscene,
                        idx: 0,
                        timer: 0,
                        nextState: 'space'   // signal for cutscene-end transition
                    };
                    player.vx = 0;
                    player.vy = 0;
                    gameState = 'cutscene';
                } else {
                    startSpaceTransition();
                }
            }
        }
    }

    // Check danger zones
    for (const z of dangerZones) {
        if (!z.triggered && player.x >= z.x) {
            z.triggered = true;
            activeWarning = { text: z.text, timer: 150 };
        }
    }
    if (activeWarning) {
        activeWarning.timer--;
        if (activeWarning.timer <= 0) activeWarning = null;
    }

    // Check boss cutscene trigger
    const stage = STAGES[currentStage];
    if (stage && stage.bossTriggerX && player.x >= stage.bossTriggerX && !stage.cutsceneShown) {
        stage.cutsceneShown = true;
        // Stop player movement
        player.vx = 0;
        player.vy = 0;
        // Build the boss arena (open and themed to the boss)
        const boss = enemies.find(e => e.type === 'boss');
        if (boss) {
            buildBossArena(currentStage, player.x, boss);
        }
        // OMEGA-PRIME: special throne-rising cinematic plays BEFORE dialogue.
        if (boss && boss.subtype === 'omega') {
            throneCutscene = {
                timer: 0,
                duration: 240,
                bossX: boss.x, bossY: boss.y,
                playerStartX: player.x - 200,
                playerEndX: boss.x - 250,
                throneCutsceneNext: {
                    stage: currentStage,
                    lines: stage.cutscene,
                    idx: 0,
                    timer: 0
                }
            };
            gameState = 'throneCutscene';
        } else if (boss) {
            // Every other boss now gets a SUBTYPE-SPECIFIC INTRO cinematic
            // (drop-in, rise-from-lava, phase-glitch, transformer-fold-down,
            // etc.) before its dialogue cutscene fires.
            bossIntro = createBossIntro(boss, stage, currentStage);
            gameState = 'bossIntro';
        } else {
            cutscene = {
                stage: currentStage,
                lines: stage.cutscene,
                idx: 0,
                timer: 0
            };
            gameState = 'cutscene';
        }
    }

    // Horizontal movement
    let moveX = 0;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX = -1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX = 1;

    if (!player.dashing) {
        // Per-vehicle speed scaling — bike is fast, hover medium, tank slow,
        // jet fast, starfighter fastest. Robot mode = 1.0×.
        let speedScale = 1;
        if (player.transformed) {
            const speedTable = { bike: 1.7, hover: 1.5, tank: 0.85, jet: 1.6, starfighter: 1.8 };
            speedScale = speedTable[player.vehicleType] || 1.5;
        }
        player.vx = moveX * player.speed * speedScale;
        if (moveX !== 0) player.facing = moveX;
    }

    if (player.sliding) {
        player.slideTimer--;
        if (player.slideTimer <= 0) {
            player.sliding = false;
            player.h = 40;
        }
    } else {
        player.h = 40;
    }

    // Slide
    if ((keys['KeyS'] || keys['ArrowDown']) && player.onGround && Math.abs(player.vx) > 1 && !player.sliding) {
        player.sliding = true;
        player.slideTimer = 20;
        player.vx = player.facing * 6;
        player.h = 24;
    }

    // Jumping - accept Up Arrow, W, or Space; with coyote time + jump buffer for forgiving feel
    const jumpKey = keys['Space'] || keys['ArrowUp'] || keys['KeyW'];

    // Buffer the jump press so it still works if pressed slightly before landing
    if (jumpKey && !player.jumpHeld) {
        player.jumpBuffer = 8;
    }
    player.jumpHeld = jumpKey;

    if (player.jumpBuffer > 0) player.jumpBuffer--;

    // Coyote time - allow jumping for a few frames after leaving the ground
    if (player.onGround) {
        player.coyoteTime = 8;
    } else if (player.coyoteTime > 0) {
        player.coyoteTime--;
    }

    // Try to jump
    if (player.jumpBuffer > 0) {
        if (player.onWall && !player.onGround) {
            // Wall jump
            player.vx = -player.wallDir * 7;
            player.vy = player.jumpForce * 0.9;
            player.jumps = 1;
            player.jumpBuffer = 0;
            player.coyoteTime = 0;
            spawnParticles(player.x + (player.wallDir > 0 ? 0 : player.w), player.y + player.h / 2, '#00ffaa', 5, 3);
        } else if (player.coyoteTime > 0 || player.jumps < player.maxJumps + player.maxJumpsBonus) {
            // Ground jump (or coyote-time jump) — counts as first jump
            if (player.coyoteTime > 0 && player.jumps === 0) {
                player.vy = player.jumpForce;
                player.jumps = 1;
            } else if (player.jumps < player.maxJumps + player.maxJumpsBonus) {
                player.vy = player.jumpForce * (player.jumps === 0 ? 1 : 0.85);
                player.jumps++;
            }
            player.jumpBuffer = 0;
            player.coyoteTime = 0;
            spawnParticles(player.x + player.w / 2, player.y + player.h, '#00ffaa', 5, 2);
        }
    }

    // Variable jump height - if you release jump early, cut velocity for a shorter hop
    if (!jumpKey && player.vy < -4) {
        player.vy = -4;
    }

    // Dashing
    if ((keys['ShiftLeft'] || keys['ShiftRight']) && player.dashCooldown <= 0 && !player.dashing) {
        player.dashing = true;
        player.dashTimer = 8;
        player.dashCooldown = 40;
        let dx = moveX || player.facing;
        let dy = 0;
        if (keys['KeyS'] || keys['ArrowDown']) dy = 1;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        player.dashDir = { x: dx / len, y: dy / len };
        player.vy = 0;
        spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#00ffaa', 8, 4);
    }

    if (player.dashing) {
        player.vx = player.dashDir.x * player.dashRange;
        player.vy = player.dashDir.y * player.dashRange;
        player.dashTimer--;
        // Dash trail
        dashTrails.push({ x: player.x, y: player.y, w: player.w, h: player.h, life: 1 });
        if (player.dashTimer <= 0) {
            player.dashing = false;
        }
    }

    if (player.dashCooldown > 0) player.dashCooldown--;

    // ===== DODGE ROLL (Ctrl) =====
    // Quick low-profile horizontal roll with i-frames. Faster cooldown than
    // dash but no slow-mo. Cancels gravity briefly.
    if (player.rollCooldown > 0) player.rollCooldown--;
    const rollKeyDown = (keys['ControlLeft'] || keys['ControlRight']);
    if (rollKeyDown && !player.rollKeyHeld && player.rollCooldown <= 0 &&
        !player.rolling && !player.dashing && !player.parrying && player.onGround) {
        player.rolling = true;
        player.rollTimer = 18;
        player.rollCooldown = 50;
        player.rollDir = (moveX !== 0) ? Math.sign(moveX) : player.facing;
        player.rollAnim = 0;
        player.invincible = Math.max(player.invincible, 18);
        player.h = 24;       // duck profile during roll
        spawnParticles(player.x + player.w / 2, player.y + player.h, '#88ddff', 10, 3);
    }
    player.rollKeyHeld = rollKeyDown;
    if (player.rolling) {
        player.vx = player.rollDir * 9;
        player.rollTimer--;
        player.rollAnim += 0.08;
        // Trail dust
        if (player.rollTimer % 3 === 0) {
            spawnParticles(player.x + player.w / 2, player.y + player.h - 4, '#aaccff', 3, 2);
        }
        if (player.rollTimer <= 0) {
            player.rolling = false;
            player.h = 40;
        }
    }

    // ===== PARRY (C) =====
    // 12-frame window. Reflects enemy bullets back as player bullets if hit.
    if (player.parryCooldown > 0) player.parryCooldown--;
    if (player.parryTimer > 0) player.parryTimer--;
    if (player.parrySuccess > 0) player.parrySuccess--;
    if (keys['KeyC'] && !player.parryKeyHeld && player.parryCooldown <= 0 &&
        !player.parrying && !player.rolling && !player.dashing) {
        player.parrying = true;
        player.parryTimer = 14;
        player.parryCooldown = 60;
        spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ffffff', 10, 3);
    }
    player.parryKeyHeld = keys['KeyC'];
    if (player.parrying && player.parryTimer <= 0) {
        player.parrying = false;
    }

    // ===== GROUND POUND (S/↓ while in air) =====
    // Slams downward; on landing, creates a damaging shockwave.
    if (!player.pounding && !player.onGround && (keys['KeyS'] || keys['ArrowDown']) &&
        !player.poundKeyHeld && !player.dashing && !player.rolling) {
        player.pounding = true;
        player.vy = 0;
        player.vx = 0;
        spawnParticles(player.x + player.w / 2, player.y + player.h, '#ffaa44', 10, 3);
    }
    player.poundKeyHeld = (keys['KeyS'] || keys['ArrowDown']);
    if (player.pounding) {
        // Strong downward acceleration
        player.vy = Math.min(player.vy + 1.6, 22);
        player.vx = 0;
        player.poundTrail = (player.poundTrail || 0) + 1;
        // Trail particles
        if (player.poundTrail % 2 === 0) {
            spawnParticles(player.x + player.w / 2, player.y, '#ffaa44', 2, 2);
        }
        // Detect landing — checked in collision after movement; we set a flag
        // for the collision pass to trigger the explosion.
        player._wantPoundExplode = true;
    }

    // Gravity
    if (!player.dashing) {
        // Vehicle flight handling. Jet and starfighter FLY: gravity is
        // negated and vertical input (W/S/Up/Down) directly controls altitude.
        // Hover bike + hovertank have reduced gravity (floaty feel).
        // Tank/bike use normal gravity.
        const isFlyer = player.transformed && (player.vehicleType === 'jet' || player.vehicleType === 'starfighter');
        const isHover = player.transformed && player.vehicleType === 'hover';
        const isHoverTank = player.transformed && player.vehicleType === 'hovertank';

        if (isFlyer) {
            // Pure flight — gravity disabled, vertical input drives vy
            const upKey = keys['ArrowUp'] || keys['KeyW'] || keys['Space'];
            const downKey = keys['ArrowDown'] || keys['KeyS'];
            const flySpeed = player.vehicleType === 'starfighter' ? 6 : 5;
            let targetVy = 0;
            if (upKey) targetVy -= flySpeed;
            if (downKey) targetVy += flySpeed;
            // Smooth toward target so flight feels weighted, not snappy
            player.vy += (targetVy - player.vy) * 0.25;
            if (Math.abs(player.vy) > flySpeed) player.vy = Math.sign(player.vy) * flySpeed;
            // Disable jump-related state since flight overrides it
            player.jumps = 0;
            player.jumpBuffer = 0;
        } else if (isHover) {
            // Hover bike: half gravity for that floaty feel
            player.vy += player.gravity * 0.5;
            if (player.vy > 12) player.vy = 12;
        } else if (isHoverTank) {
            // CONVOY hover-tank: heavy hover. Quarter gravity, gentle bob,
            // moderate top fall speed. Feels like a Cybertron hovertank
            // skimming the ground.
            player.vy += player.gravity * 0.25;
            // Gentle hover bob (small sin-wave additive force)
            player.vy += Math.sin(performance.now() * 0.005) * 0.08;
            if (player.vy > 8) player.vy = 8;
        } else {
            // Robot mode (and tank/bike) — normal gravity
            player.vy += player.gravity;
            if (player.vy > 15) player.vy = 15;
        }

        // Wall slide
        if (player.onWall && !player.onGround && player.vy > 0) {
            player.vy = Math.min(player.vy, 2);
        }
    }

    // Apply velocity
    player.x += player.vx;
    player.y += player.vy;

    // Invincibility timer
    if (player.invincible > 0) player.invincible--;

    // Platform collision
    player.onGround = false;
    player.onWall = false;
    player.wallDir = 0;

    for (const plat of platforms) {
        if (plat.type === 'spike' || plat.type === 'laser' || plat.type === 'lava') continue;
        if (!rectCollide(player, plat)) continue;
        // Determine collision side
        const overlapX = Math.min(player.x + player.w - plat.x, plat.x + plat.w - player.x);
        const overlapY = Math.min(player.y + player.h - plat.y, plat.y + plat.h - player.y);

        if (overlapX < overlapY) {
            // Horizontal collision (wall)
            if (player.x + player.w / 2 < plat.x + plat.w / 2) {
                player.x = plat.x - player.w;
                player.wallDir = 1;
            } else {
                player.x = plat.x + plat.w;
                player.wallDir = -1;
            }
            player.vx = 0;
            player.onWall = true;
        } else {
            // Vertical collision
            if (player.y + player.h / 2 < plat.y + plat.h / 2) {
                player.y = plat.y - player.h;
                player.vy = 0;
                player.onGround = true;
                player.jumps = 0;
                // GROUND POUND impact — shockwave + AOE damage on landing
                if (player.pounding) {
                    player.pounding = false;
                    player.poundTrail = 0;
                    player._wantPoundExplode = false;
                    const cx = player.x + player.w / 2;
                    const cy = player.y + player.h;
                    spawnExplosion(cx, cy);
                    spawnShockwave(cx, cy, 180, '#ffaa44');
                    spawnShockwave(cx, cy, 140, '#ff8844');
                    spawnParticles(cx, cy, '#ffaa44', 30, 8);
                    spawnParticles(cx, cy, '#ffcc88', 18, 5);
                    screenShake = 18;
                    applyHitStop(4);
                    // AOE damage to enemies in radius
                    const radius = 130;
                    const dmg = 60 + Math.round((player.dmgMul || 1) * 30);
                    for (let ei = enemies.length - 1; ei >= 0; ei--) {
                        const e = enemies[ei];
                        const ex = e.x + e.w / 2;
                        const ey = e.y + e.h / 2;
                        const dd = (ex - cx) ** 2 + (ey - cy) ** 2;
                        if (dd < radius * radius) {
                            e.hp -= dmg;
                            spawnDamageNumber(ex, e.y, dmg, 'aoe');
                            // Knockback up + outward
                            e.vy = -8;
                            if (e.x !== undefined) e.x += Math.sign(ex - cx) * 14;
                            if (e.hp <= 0) handleEnemyKilled(e, ei);
                        }
                    }
                    floatTexts.push({ text: 'SLAM!', x: cx, y: cy - 20, life: 50, color: '#ffaa44' });
                }
            } else {
                player.y = plat.y + plat.h;
                player.vy = 0;
            }
        }
    }

    // Door collision (closed doors act as walls)
    for (const d of doors) {
        if (d.open) continue;
        if (rectCollide(player, d)) {
            const overlapX = Math.min(player.x + player.w - d.x, d.x + d.w - player.x);
            if (player.x + player.w / 2 < d.x + d.w / 2) {
                player.x = d.x - player.w;
            } else {
                player.x = d.x + d.w;
            }
            player.vx = 0;
        }
    }

    // Arena gate collision (boss arena lock-in)
    for (const ag of arenaGates) {
        if (ag.open) continue;
        if (rectCollide(player, ag)) {
            if (player.x + player.w / 2 < ag.x + ag.w / 2) {
                player.x = ag.x - player.w;
            } else {
                player.x = ag.x + ag.w;
            }
            player.vx = 0;
        }
    }

    // Track last safe position when grounded
    if (player.onGround && player.y < 600) {
        player.safeX = player.x;
        player.safeY = player.y - 10;
    }

    // Environmental hazard collisions (spike/laser/lava)
    if (player.invincible <= 0) {
        for (const plat of platforms) {
            if (plat.type === 'spike' || plat.type === 'laser' || plat.type === 'lava') {
                if (rectCollide(player, plat)) {
                    if (plat.type === 'laser') {
                        const phase = (Math.floor(performance.now() / 700) + (plat.phase || 0)) % 2;
                        if (phase !== 0) continue;
                    }
                    const dmg = plat.type === 'lava' ? 12 : 8;
                    player.hp -= dmg;
                    hitFlash = Math.min(1, hitFlash + 0.5);
                    player.invincible = 30;
                    screenShake = 6;
                    spawnParticles(player.x + player.w / 2, player.y + player.h / 2,
                        plat.type === 'lava' ? '#ff6600' : '#ff3300', 8, 4);
                    player.vy = -10;
                    player.vx = (player.x < plat.x + plat.w / 2 ? -6 : 6);
                    if (player.hp <= 0) {
                        gameState = 'dead';
                        spawnExplosion(player.x + player.w / 2, player.y + player.h / 2);
                    }
                    break;
                }
            }
        }
        // Mission-Impossible style laser GRIDS — continuous deadly walls until disabled.
        for (const lg of laserGrids) {
            if (lg.disabled) continue;
            if (rectCollide(player, lg)) {
                player.hp -= 14;
                hitFlash = Math.min(1, hitFlash + 0.6);
                applyHitStop(2);
                player.invincible = 35;
                screenShake = 9;
                spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ff2244', 14, 6);
                // Knock the player out of the beam
                player.vy = -10;
                player.vx = (player.x < lg.x + lg.w / 2 ? -8 : 8);
                if (player.hp <= 0) {
                    gameState = 'dead';
                    spawnExplosion(player.x + player.w / 2, player.y + player.h / 2);
                }
                break;
            }
        }
    }

    // Pick up keys on touch
    for (let ki = keyPickups.length - 1; ki >= 0; ki--) {
        const k = keyPickups[ki];
        if (k.collected) { keyPickups.splice(ki, 1); continue; }
        if (rectCollide(player, k)) {
            k.collected = true;
            player.keysHeld.push(k.id);
            spawnParticles(k.x + k.w / 2, k.y + k.h / 2, '#ffdd44', 30, 6);
            spawnShockwave(k.x + k.w / 2, k.y + k.h / 2, 80, '#ffdd44');
            screenShake = 8;
            shopMessage = { text: `🔑 KEY ACQUIRED — find the cage`, timer: 220, color: '#ffdd44' };
            keyPickups.splice(ki, 1);
        }
    }

    // Fall off screen - respawn instead of dying (with HP penalty)
    if (player.y > 700) {
        player.x = player.safeX;
        player.y = player.safeY - 60;
        player.vx = 0;
        player.vy = 0;
        player.hp = Math.max(10, player.hp - 15);
        player.invincible = 60;
        spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#00ffaa', 12, 4);
        if (player.hp <= 0) {
            gameState = 'dead';
        }
    }

    // Activate ability with Q
    if ((keys['KeyQ']) && !player.abilityKeyHeld) {
        if (player.abilityTimer <= 0) {
            activateAbility();
        }
        player.abilityKeyHeld = true;
    }
    if (!keys['KeyQ']) player.abilityKeyHeld = false;

    // Evolution active ability with R
    if (evoAbilityCooldown > 0) evoAbilityCooldown--;
    const evo = EVOLUTIONS[player.evoLevel];
    if (evo && evo.ability && keys['KeyR'] && !player.evoAbilityHeld && evoAbilityCooldown <= 0) {
        triggerEvoAbility(evo.ability);
        evoAbilityCooldown = evo.ability === 'convoyMatrix' ? 900 :
                             evo.ability === 'primeBeam' ? 720 :
                             evo.ability === 'apexNova' ? 600 :
                             evo.ability === 'omegaBlast' ? 480 : 240;
        player.evoAbilityHeld = true;
    }
    if (!keys['KeyR']) player.evoAbilityHeld = false;

    // OMEGA passive aura - damages enemies near the player
    if (player.evoLevel >= 3) {
        player.auraTick = (player.auraTick || 0) + 1;
        if (player.auraTick % 30 === 0) {
            // APEX: bigger radius and double aura damage
            // PRIME: even bigger radius + more damage
            // CONVOY: massive radius + crushing damage
            const isConvoy = player.evoLevel >= 6;
            const isPrime = player.evoLevel >= 5;
            const isApex = player.evoLevel >= 4;
            const ar = isConvoy ? 200 : isPrime ? 160 : isApex ? 130 : 90;
            const dmg = isConvoy ? 16 : isPrime ? 12 : isApex ? 8 : 4;
            const auraColor = isConvoy ? '#ffd744' : isPrime ? '#ff3344' : isApex ? '#66ffff' : '#ffff44';
            for (let i = enemies.length - 1; i >= 0; i--) {
                const e = enemies[i];
                const ddx = (e.x + e.w/2) - (player.x + player.w/2);
                const ddy = (e.y + e.h/2) - (player.y + player.h/2);
                if (ddx * ddx + ddy * ddy < ar * ar) {
                    e.hp -= dmg;
                    if (Math.random() < 0.4) spawnParticles(e.x + e.w/2, e.y + e.h/2, auraColor, 1, 1);
                    if (e.hp <= 0) handleEnemyKilled(e, i);
                }
            }
        }
        // Visible aura ring
        if (player.auraTick % 6 === 0) {
            const auraColor = player.evoLevel >= 6 ? '#ffd744' :
                              player.evoLevel >= 5 ? '#ff3344' :
                              player.evoLevel >= 4 ? '#66ffff' : '#ffff44';
            spawnParticles(player.x + player.w/2 + (Math.random() - 0.5) * 90, player.y + player.h/2 + (Math.random() - 0.5) * 90, auraColor, 1, 0.5);
        }
    }

    // Tick ability timers
    if (player.abilityTimer > 0) player.abilityTimer--;

    // === VEHICLE TRANSFORMATION (X key) ===
    // Edge-trigger: pressing X toggles between robot and vehicle form. The
    // animation progresses each frame; once complete, transformed flips.
    // Each evolution tier gets a unique vehicle silhouette (see drawPlayer).
    if (player.transformCooldown > 0) player.transformCooldown--;
    const xPressed = !!keys['KeyX'];
    if (xPressed && !player.transformHeld && player.transformCooldown <= 0) {
        // Start a transform anim — direction depends on current state
        player.transformDir = player.transformed ? -1 : 1;
        player.transformAnim = player.transformed ? 1 : 0;
        player.transformCooldown = 18;
        // Pick the vehicle type based on current evolution tier.
        // BASE→bike, MK-II→hover, MK-III→tank, OMEGA→jet, APEX→starfighter,
        // PRIME→starfighter (kept), CONVOY→hovertank (Optimus-style hovering
        // tank, not the starfighter).
        const vTypes = ['bike', 'hover', 'tank', 'jet', 'starfighter', 'starfighter', 'hovertank'];
        player.vehicleType = vTypes[Math.min(player.evoLevel, vTypes.length - 1)];
        spawnShockwave(player.x + player.w/2, player.y + player.h/2, 60, player.charColor || '#00ddff');
        spawnParticles(player.x + player.w/2, player.y + player.h/2, player.charAccent || '#00ffaa', 18, 6);
        screenShake = 6;
    }
    player.transformHeld = xPressed;
    // Animate the transform progress
    if (player.transformDir !== 0) {
        const ANIM_RATE = 0.08;
        player.transformAnim += player.transformDir * ANIM_RATE;
        if (player.transformAnim >= 1) {
            player.transformAnim = 1;
            player.transformed = true;
            player.transformDir = 0;
        } else if (player.transformAnim <= 0) {
            player.transformAnim = 0;
            player.transformed = false;
            player.transformDir = 0;
        }
    }

    // === RAM DAMAGE: vehicle form damages enemies on contact ===
    // Tank/jet/starfighter ram for more; bike/hover for less. Damage scales
    // with player.dmgMul so it stays meaningful at every evolution tier.
    if (player.transformed && Math.abs(player.vx) > 1) {
        const ramTable = { bike: 14, hover: 18, tank: 28, jet: 24, starfighter: 36 };
        const ramBase = ramTable[player.vehicleType] || 14;
        const ram = Math.round(ramBase * (player.dmgMul || 1));
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (!rectCollide(player, e)) continue;
            // Tick a per-enemy ram cooldown so we hit ~5 times/sec, not 60
            e._ramCd = (e._ramCd || 0) - 1;
            if (e._ramCd > 0) continue;
            e._ramCd = 12;
            e.hp -= ram;
            spawnDamageNumber(e.x + e.w/2, e.y, ram, 'aoe');
            spawnParticles(e.x + e.w/2, e.y + e.h/2, player.charAccent || '#00ffaa', 8, 5);
            screenShake = Math.max(screenShake, 6);
            // Knock the enemy slightly
            if (e.x !== undefined) e.x += player.facing * 6;
            if (e.hp <= 0) handleEnemyKilled(e, i);
        }
    }

    if (player.abilityActiveTimer > 0) {
        player.abilityActiveTimer--;
        // Hover ability cancels gravity
        if (player.abilityType === 'hover' && player.abilityActiveTimer > 0) {
            if (player.vy > 0.5) player.vy = 0.5;
        }
        if (player.abilityActiveTimer <= 0) {
            player.abilityActive = false;
            timeSlowFactor = 1;
        }
    }

    // Perfect dodge timer
    if (player.perfectDodgeTimer > 0) {
        player.perfectDodgeTimer--;
        if (player.perfectDodgeTimer <= 0 && !player.abilityActive) {
            timeSlowFactor = 1;
        }
    }

    // Shooting - press F (or J) to shoot. Tap to fire single shots.
    if (player.shootCooldown > 0) player.shootCooldown--;
    const shootKey = keys['KeyF'] || keys['KeyJ'];
    const w = WEAPONS[player.weaponTier];
    // Vehicle form: bike/hover are pure rammers (no shooting). Tank, jet,
    // and starfighter can fire their own vehicle-mounted weapons. The mid-
    // transform fold-down still blocks shooting for both modes.
    const midTransform = player.transformAnim > 0.05 && player.transformAnim < 0.95;
    const canShootInVehicle = player.transformed && (
        player.vehicleType === 'tank' ||
        player.vehicleType === 'jet' ||
        player.vehicleType === 'starfighter' ||
        player.vehicleType === 'hovertank'
    );
    const blockedByVehicle = midTransform || (player.transformed && !canShootInVehicle);
    // Minigun is full-auto (just hold F); other weapons are tap-to-fire
    const canFire = w.cooldown <= 4 ? shootKey : (shootKey && !player.shootHeld);
    if (canFire && player.shootCooldown <= 0 && !blockedByVehicle) {
        if (canShootInVehicle) {
            shootVehicleProjectile();
        } else {
            shootBullet();
        }
        let cd = w.cooldown * player.fireRateMul;
        // Bullet storm ability halves cooldown
        if (player.abilityActive && player.abilityType === 'bulletstorm') cd *= 0.4;
        // Vehicle-specific cooldown overrides — each vehicle has its own rhythm
        if (canShootInVehicle) {
            const vehicleCd = player.vehicleType === 'tank' ? 55 :   // slow heavy rocket
                              player.vehicleType === 'jet'  ? 28 :   // missile barrage
                              player.vehicleType === 'starfighter' ? 12 :  // rapid plasma
                              player.vehicleType === 'hovertank' ? 38 : cd; // Matrix ion blast
            cd = vehicleCd * player.fireRateMul;
        }
        player.shootCooldown = Math.max(2, Math.round(cd));
        // Gun recoil for the animated arm/gun rig
        player.gunRecoil = Math.min(6, (player.gunRecoil || 0) + 4);
    }
    player.shootHeld = shootKey;

    // Melee combat - G key for 3-hit combo
    if (player.meleeCooldown > 0) player.meleeCooldown--;
    if (player.meleeAnimTimer > 0) player.meleeAnimTimer--;
    if (player.meleeComboTimer > 0) {
        player.meleeComboTimer--;
        if (player.meleeComboTimer <= 0) player.meleeCombo = 0;
    }
    if (keys['KeyG'] && !player.meleeKeyHeld && player.meleeCooldown <= 0) {
        executeMelee();
        player.meleeKeyHeld = true;
    }
    if (!keys['KeyG']) player.meleeKeyHeld = false;
}

// Shooting - fires in the direction you're facing, using current weapon
function shootBullet() {
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    const w = WEAPONS[player.weaponTier];
    // Direction: forward by default; aim up if pressing up, down if pressing down
    let baseDx = player.facing;
    let baseDy = 0;
    if (keys['ArrowUp'] || keys['KeyW']) { baseDy = -0.6; }
    if (keys['ArrowDown'] || keys['KeyS']) { baseDy = 0.6; }
    const baseLen = Math.sqrt(baseDx * baseDx + baseDy * baseDy);
    baseDx /= baseLen; baseDy /= baseLen;
    const baseAngle = Math.atan2(baseDy, baseDx);

    // Fire one or more bullets
    for (let i = 0; i < w.bullets; i++) {
        let angle = baseAngle;
        if (w.bullets > 1) {
            // Spread shotgun-style
            const t = w.bullets === 1 ? 0 : (i / (w.bullets - 1) - 0.5) * 2;
            angle += t * w.spread;
        } else if (w.spread > 0) {
            // Random spread (minigun)
            angle += (Math.random() - 0.5) * 2 * w.spread;
        }
        const dx = Math.cos(angle), dy = Math.sin(angle);
        bullets.push({
            x: cx + dx * 18, y: cy + dy * 18,
            vx: dx * w.speed,
            vy: dy * w.speed,
            life: w.life,
            damage: Math.round((w.damage + player.bulletDamage) * (player.dmgMul || 1)),
            color: w.color, glow: w.glow, size: w.size,
            pierce: !!w.pierce, hitEnemies: new Set(),
            explosive: !!w.explosive,
            aoeRadius: w.aoeRadius || 100,
            burn: !!w.burn, burnDmg: w.burnDmg, burnDur: w.burnDur,
            slow: !!w.slow, slowDur: w.slowDur, slowFactor: w.slowFactor
        });
    }
    // Muzzle flash
    spawnParticles(cx + baseDx * 22, cy + baseDy * 22, w.glow, 5, 3);
    screenShake = w.bullets > 1 ? 5 : 3;

    // Evolution side-arm bonus shots — Transformer-style: spawn from the
    // visible shoulder mounts on the player so it reads as the actual weapon
    // firing, with a muzzle flash + screen shake scaled to weapon size.
    const evo = EVOLUTIONS[player.evoLevel];
    if (evo && evo.sideArm) {
        // Both shoulder mount positions (mirror of drawPlayer side-arm code).
        const shoulderL = { x: cx - player.facing * 10, y: cy - 12 };
        const shoulderR = { x: cx + player.facing * (player.w / 2 - 4), y: cy - 12 };
        if (evo.sideArm === 'pulse') {
            // Single pulse shot from RIGHT shoulder pulse cannon
            bullets.push({
                x: shoulderR.x, y: shoulderR.y,
                vx: baseDx * 13, vy: baseDy * 13,
                life: 60, damage: Math.round(20 * player.dmgMul),
                color: '#ff88ff', glow: '#ff44ff', size: 6,
                pierce: false, hitEnemies: new Set(), explosive: false
            });
            spawnParticles(shoulderR.x, shoulderR.y, '#ff44ff', 6, 4);
            spawnShockwave(shoulderR.x, shoulderR.y, 30, '#ff44ff');
        } else if (evo.sideArm === 'rocket') {
            // TWO rockets — one from each shoulder rocket pod
            for (const sh of [shoulderL, shoulderR]) {
                bullets.push({
                    x: sh.x, y: sh.y,
                    vx: baseDx * 8 + (Math.random() - 0.5) * 0.5,
                    vy: -2 - Math.random() * 0.5,
                    life: 90, damage: Math.round(60 * player.dmgMul),
                    color: '#ff4400', glow: '#ff0000', size: 9,
                    pierce: false, hitEnemies: new Set(),
                    explosive: true, aoeRadius: 90,
                    rocket: true
                });
                spawnParticles(sh.x, sh.y, '#ffaa00', 8, 5);
                spawnShockwave(sh.x, sh.y, 40, '#ff8800');
            }
            screenShake = Math.max(screenShake, 7);
        } else if (evo.sideArm === 'omega') {
            // OMEGA: 4 missiles, alternating shoulders, fan pattern
            for (let r = 0; r < 4; r++) {
                const sh = (r % 2 === 0) ? shoulderL : shoulderR;
                bullets.push({
                    x: sh.x, y: sh.y - r * 2,
                    vx: baseDx * 9,
                    vy: -3 + r * 1.5,
                    life: 100, damage: Math.round(80 * player.dmgMul),
                    color: '#ffff00', glow: '#ffaa00', size: 10,
                    pierce: false, hitEnemies: new Set(),
                    explosive: true, aoeRadius: 100,
                    rocket: true
                });
                spawnParticles(sh.x, sh.y, '#ffff00', 4, 4);
            }
            spawnShockwave(shoulderL.x, shoulderL.y, 60, '#ffff00');
            spawnShockwave(shoulderR.x, shoulderR.y, 60, '#ffff00');
            screenShake = Math.max(screenShake, 12);
        } else if (evo.sideArm === 'apex') {
            // APEX: 4 plasma cannons fire concurrently in a tight fan,
            // one from each shoulder pulse-cannon and one from each chest port.
            const ports = [
                shoulderL,
                shoulderR,
                { x: cx - player.facing * 4, y: cy + 2 },
                { x: cx + player.facing * 6, y: cy + 2 }
            ];
            for (let r = 0; r < ports.length; r++) {
                const sh = ports[r];
                bullets.push({
                    x: sh.x, y: sh.y,
                    vx: baseDx * 14 + (Math.random() - 0.5) * 0.6,
                    vy: -1 + (r - 1.5) * 0.7,
                    life: 100, damage: Math.round(55 * player.dmgMul),
                    color: '#66ffff', glow: '#00ffff', size: 8,
                    pierce: true, hitEnemies: new Set(),
                    explosive: false
                });
                spawnParticles(sh.x, sh.y, '#66ffff', 4, 4);
            }
            spawnShockwave(shoulderL.x, shoulderL.y, 70, '#00ffff');
            spawnShockwave(shoulderR.x, shoulderR.y, 70, '#00ffff');
            screenShake = Math.max(screenShake, 14);
        } else if (evo.sideArm === 'prime') {
            // PRIME: 6 cannons fire in a sweeping fan from shoulders + chest +
            // hip mounts. Crimson plasma streams.
            const ports = [
                shoulderL,
                shoulderR,
                { x: cx - player.facing * 4, y: cy + 2 },
                { x: cx + player.facing * 6, y: cy + 2 },
                { x: cx - player.facing * 2, y: cy + 16 },
                { x: cx + player.facing * 8, y: cy + 16 }
            ];
            for (let r = 0; r < ports.length; r++) {
                const sh = ports[r];
                bullets.push({
                    x: sh.x, y: sh.y,
                    vx: baseDx * 16 + (Math.random() - 0.5) * 0.5,
                    vy: -1 + (r - 2.5) * 0.5,
                    life: 110, damage: Math.round(70 * player.dmgMul),
                    color: '#ff6644', glow: '#ff3322', size: 9,
                    pierce: true, hitEnemies: new Set()
                });
                spawnParticles(sh.x, sh.y, '#ff6644', 4, 4);
            }
            spawnShockwave(shoulderL.x, shoulderL.y, 80, '#ff3344');
            spawnShockwave(shoulderR.x, shoulderR.y, 80, '#ff3344');
            screenShake = Math.max(screenShake, 16);
        } else if (evo.sideArm === 'convoy') {
            // CONVOY: 8 cannon volley — chest cannons + shoulder cannons +
            // hip turrets + back-mounted artillery. Each shot is a ravaging
            // golden plasma orb. This is the final-tier weapon.
            const ports = [
                shoulderL,
                shoulderR,
                { x: cx - player.facing * 4, y: cy + 2 },
                { x: cx + player.facing * 6, y: cy + 2 },
                { x: cx - player.facing * 2, y: cy + 16 },
                { x: cx + player.facing * 8, y: cy + 16 },
                { x: cx - player.facing * 8, y: cy - 18 },   // back artillery L
                { x: cx + player.facing * 12, y: cy - 18 }   // back artillery R
            ];
            for (let r = 0; r < ports.length; r++) {
                const sh = ports[r];
                bullets.push({
                    x: sh.x, y: sh.y,
                    vx: baseDx * 18 + (Math.random() - 0.5) * 0.4,
                    vy: -1 + (r - 3.5) * 0.4,
                    life: 120, damage: Math.round(95 * player.dmgMul),
                    color: '#ffcc44', glow: '#ff6600', size: 10,
                    pierce: true, hitEnemies: new Set(),
                    explosive: true, aoeRadius: 60
                });
                spawnParticles(sh.x, sh.y, '#ffcc44', 5, 5);
            }
            spawnShockwave(shoulderL.x, shoulderL.y, 100, '#ffcc44');
            spawnShockwave(shoulderR.x, shoulderR.y, 100, '#ffcc44');
            screenShake = Math.max(screenShake, 20);
        }
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        // Rockets get slight gravity for arc
        if (b.rocket) {
            b.vy += 0.15;
        }
        // Homing — gently steer toward the nearest enemy. Used by missiles
        // (jet) and plasma torpedoes (starfighter). Strength is small so the
        // projectile still feels physical.
        if (b.homing) {
            let nearest = null;
            let nd = Infinity;
            for (const e of enemies) {
                const dx = (e.x + e.w / 2) - b.x;
                const dy = (e.y + e.h / 2) - b.y;
                const d = dx * dx + dy * dy;
                if (d < nd && d < 700 * 700) { nd = d; nearest = e; }
            }
            if (nearest) {
                const dx = (nearest.x + nearest.w / 2) - b.x;
                const dy = (nearest.y + nearest.h / 2) - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
                // Blend current velocity with target direction
                const turnRate = 0.08;
                b.vx += ((dx / dist) * speed - b.vx) * turnRate;
                b.vy += ((dy / dist) * speed - b.vy) * turnRate;
                // Re-normalize so homing doesn't accelerate the bullet
                const newSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
                b.vx = (b.vx / newSpeed) * speed;
                b.vy = (b.vy / newSpeed) * speed;
            }
        }
        b.x += b.vx;
        b.y += b.vy;
        b.life--;

        // Despawn if too far from camera (perf)
        if (Math.abs(b.x - camera.x) > 1500 || Math.abs(b.y - camera.y) > 900) {
            bullets.splice(i, 1);
            continue;
        }

        // Bullets blocked by solid platforms (walls/ground/normal platforms)
        let hitWall = false;
        for (let pi = 0; pi < platforms.length; pi++) {
            const plat = platforms[pi];
            if (plat.type === 'recovery' || plat.type === 'spike' || plat.type === 'laser' || plat.type === 'lava') continue;
            if (b.x >= plat.x && b.x <= plat.x + plat.w && b.y >= plat.y && b.y <= plat.y + plat.h) {
                spawnParticles(b.x, b.y, '#888', 4, 2);
                // Damage breakable cover
                if (plat.type === 'breakable') {
                    plat.hp = (plat.hp ?? 60) - b.damage;
                    spawnParticles(b.x, b.y, '#aa6622', 6, 4);
                    if (plat.hp <= 0) {
                        spawnParticles(plat.x + plat.w / 2, plat.y + plat.h / 2, '#aa6622', 25, 5);
                        screenShake = 6;
                        // Drop hidden cache
                        if (plat.cache) {
                            const cx2 = plat.x + plat.w / 2;
                            const cy2 = plat.y + plat.h / 2;
                            for (let cc = 0; cc < (plat.cacheCoins || 30); cc++) {
                                const ang = Math.random() * Math.PI * 2;
                                const spd = 2 + Math.random() * 4;
                                coinPickups.push({
                                    x: cx2, y: cy2,
                                    vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 3,
                                    value: 2, life: 600
                                });
                            }
                            healthDrops.push({
                                x: cx2, y: cy2, vx: 0, vy: -3,
                                heal: 50, life: 700
                            });
                            shopMessage = { text: 'HIDDEN CACHE!', timer: 80, color: '#ffdd44' };
                        }
                        platforms.splice(pi, 1);
                    }
                }
                hitWall = true;
                break;
            }
        }
        if (hitWall) { bullets.splice(i, 1); continue; }

        // Hit cages (free the ally) — but only if the player is holding the cage's key
        let hitCage = false;
        for (const cage of cages) {
            if (cage.rescued) continue;
            if (b.x >= cage.x && b.x <= cage.x + cage.w && b.y >= cage.y && b.y <= cage.y + cage.h) {
                // If the cage requires a key, refuse damage until the player has it.
                if (cage.requiresKey && !(player.keysHeld || []).includes(cage.requiresKey)) {
                    spawnParticles(b.x, b.y, '#ff4444', 6, 3);
                    if (!cage._lockedFlashed || (performance.now() - cage._lockedFlashed) > 600) {
                        shopMessage = { text: '🔒 CAGE LOCKED — find the KEY first!', timer: 120, color: '#ff6644' };
                        cage._lockedFlashed = performance.now();
                    }
                    hitCage = true;
                    break;
                }
                cage.hp -= b.damage;
                spawnParticles(b.x, b.y, '#ffdd44', 8, 4);
                if (cage.hp <= 0) {
                    cage.rescued = true;
                    // Squad cap: keep only 2 active allies. Boot the oldest.
                    const ALLY_LIMIT = 2;
                    while (allies.length >= ALLY_LIMIT) {
                        const departing = allies.shift();
                        if (departing) {
                            spawnParticles(
                                departing.x + departing.w / 2,
                                departing.y + departing.h / 2,
                                departing.def.color, 18, 5
                            );
                            shopMessage = {
                                text: `${departing.def.name} departs — squad limit (${ALLY_LIMIT}).`,
                                timer: 180, color: '#ffaa66'
                            };
                        }
                    }
                    // Spawn ally
                    spawnAlly(cage.allyDef, cage.x + cage.w / 2, cage.y + cage.h / 2);
                    spawnParticles(cage.x + cage.w / 2, cage.y + cage.h / 2, cage.allyDef.color, 30, 7);
                    screenShake = 14;
                    shopMessage = { text: `${cage.allyDef.name} JOINED YOU! Walk to the EXIT PORTAL.`, timer: 240, color: cage.allyDef.color };
                    // Spawn exit portal nearby
                    if (currentStage < STAGES.length - 1) {
                        exitPortals.push({
                            x: cage.x + cage.w + 100,
                            y: 470,
                            w: 80, h: 100
                        });
                    } else {
                        // Final stage - immediate win after rescue
                        setTimeout(() => { gameState = 'won'; }, 1500);
                    }
                }
                hitCage = true;
                break;
            }
        }
        if (hitCage) { bullets.splice(i, 1); continue; }

        // Hit terminals — disable the laser grids in their group when shot enough.
        let hitTerminal = false;
        for (const term of terminals) {
            if (term.disabled) continue;
            if (b.x >= term.x && b.x <= term.x + term.w && b.y >= term.y && b.y <= term.y + term.h) {
                term.hp -= b.damage;
                spawnParticles(b.x, b.y, '#88ddff', 8, 4);
                if (term.hp <= 0) {
                    term.disabled = true;
                    spawnShockwave(term.x + term.w / 2, term.y + term.h / 2, 120, '#00ffaa');
                    spawnParticles(term.x + term.w / 2, term.y + term.h / 2, '#00ffaa', 28, 6);
                    screenShake = 12;
                    // Disable any laser grid sharing this terminal's group
                    let disabledAny = false;
                    for (const lg of laserGrids) {
                        if (lg.group === term.group) {
                            lg.disabled = true;
                            disabledAny = true;
                            spawnParticles(lg.x + lg.w / 2, lg.y + lg.h / 2, '#00ffaa', 20, 5);
                        }
                    }
                    shopMessage = {
                        text: disabledAny
                            ? '🛰 TERMINAL HACKED — laser grid offline'
                            : '🛰 TERMINAL HACKED',
                        timer: 200, color: '#00ffaa'
                    };
                }
                hitTerminal = true;
                break;
            }
        }
        if (hitTerminal) { bullets.splice(i, 1); continue; }

        // Bullets are blocked by active laser grids (you can't shoot through them)
        let hitLaserGrid = false;
        for (const lg of laserGrids) {
            if (lg.disabled) continue;
            if (b.x >= lg.x && b.x <= lg.x + lg.w && b.y >= lg.y && b.y <= lg.y + lg.h) {
                spawnParticles(b.x, b.y, '#ff2244', 6, 3);
                hitLaserGrid = true;
                break;
            }
        }
        if (hitLaserGrid) { bullets.splice(i, 1); continue; }

        // Hit switches
        let hitSwitch = false;
        for (const sw of switches) {
            if (sw.activated) continue;
            if (b.x >= sw.x && b.x <= sw.x + sw.w && b.y >= sw.y && b.y <= sw.y + sw.h) {
                sw.activated = true;
                spawnParticles(sw.x + sw.w / 2, sw.y + sw.h / 2, '#00ffff', 12, 4);
                screenShake = 5;
                // Check if all switches in this group are activated -> open the door
                const grp = sw.group;
                const all = switches.filter(s => s.group === grp).every(s => s.activated);
                if (all) {
                    for (const d of doors) {
                        if (d.group === grp) {
                            d.open = true;
                            spawnParticles(d.x + d.w / 2, d.y + d.h / 2, '#00ff00', 30, 6);
                            screenShake = 12;
                            shopMessage = { text: 'PATH UNLOCKED', timer: 90, color: '#00ffaa' };
                        }
                    }
                }
                hitSwitch = true;
                break;
            }
        }
        if (hitSwitch) { bullets.splice(i, 1); continue; }

        // Bullets are blocked by closed doors
        let hitDoor = false;
        for (const d of doors) {
            if (d.open) continue;
            if (b.x >= d.x && b.x <= d.x + d.w && b.y >= d.y && b.y <= d.y + d.h) {
                spawnParticles(b.x, b.y, '#ff0000', 4, 2);
                hitDoor = true;
                break;
            }
        }
        if (hitDoor) { bullets.splice(i, 1); continue; }

        // Bullets blocked by closed arena gates
        let hitGate = false;
        for (const ag of arenaGates) {
            if (ag.open) continue;
            if (b.x >= ag.x && b.x <= ag.x + ag.w && b.y >= ag.y && b.y <= ag.y + ag.h) {
                spawnParticles(b.x, b.y, '#ffaa00', 5, 3);
                hitGate = true;
                break;
            }
        }
        if (hitGate) { bullets.splice(i, 1); continue; }

        // Bullets blocked by closed boss gates
        let hitBossGate = false;
        for (const bg of bossGates) {
            if (bg.open) continue;
            if (b.x >= bg.x && b.x <= bg.x + bg.w && b.y >= bg.y && b.y <= bg.y + bg.h) {
                spawnParticles(b.x, b.y, bg.color, 5, 3);
                hitBossGate = true;
                break;
            }
        }
        if (hitBossGate) { bullets.splice(i, 1); continue; }

        // Hit enemies
        let hit = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            // Skip enemies this piercing bullet has already hit
            if (b.pierce && b.hitEnemies && b.hitEnemies.has(e)) continue;
            if (b.x >= e.x && b.x <= e.x + e.w && b.y >= e.y && b.y <= e.y + e.h) {
                // SHIELDER damage reduction from frontal hits
                let dmg = b.damage;
                if (e.type === 'shielder') {
                    const fromFront = (e.dir > 0 && b.x > e.x + e.w / 2) || (e.dir < 0 && b.x < e.x + e.w / 2);
                    if (fromFront) {
                        dmg = Math.round(dmg * 0.2);
                        spawnParticles(b.x, b.y, e.shieldColor || '#44ddff', 5, 3);
                    }
                }
                // BOSS weak point - hits to top 25% (head) deal 2x damage with crit visual
                if (e.type === 'boss' || e.type === 'miniboss') {
                    const isHeadshot = b.y < e.y + e.h * 0.25;
                    if (isHeadshot) {
                        dmg = Math.round(dmg * 2);
                        spawnParticles(b.x, b.y, '#ffff00', 12, 5);
                        screenShake = 8;
                        critFlash = Math.min(1, critFlash + 0.55);
                        applyHitStop(3);
                        spawnShockwave(b.x, b.y, 90, '#ffdd44');
                        // Float "CRIT" text via particle
                        floatTexts.push({ text: 'CRIT!', x: b.x, y: b.y, life: 40, color: '#ffff00' });
                        spawnDamageNumber(b.x, b.y, dmg, 'crit');
                    } else {
                        spawnDamageNumber(b.x, b.y, dmg, 'normal');
                    }
                } else {
                    spawnDamageNumber(b.x, b.y, dmg, 'normal');
                }
                e.hp -= dmg;
                // Apply weapon special effects
                if (b.burn) {
                    e.burnTimer = b.burnDur || 90;
                    e.burnDamage = b.burnDmg || 8;
                }
                if (b.slow) {
                    e.slowTimer = b.slowDur || 90;
                    e.slowFactor = b.slowFactor || 0.4;
                }
                if (b.pierce) {
                    b.hitEnemies.add(e);
                } else {
                    hit = true;
                }
                spawnParticles(b.x, b.y, b.glow || '#ffff66', 6, 3);
                screenShake = 4;

                // Explosive bullet AOE
                if (b.explosive) {
                    const r = b.aoeRadius || 110;
                    spawnExplosion(b.x, b.y);
                    spawnParticles(b.x, b.y, '#ff8800', 20, 6);
                    screenShake = 12;
                    spawnShockwave(b.x, b.y, r * 1.2, '#ff8844');
                    for (const other of enemies) {
                        if (other === e) continue;
                        const dx = (other.x + other.w / 2) - b.x;
                        const dy = (other.y + other.h / 2) - b.y;
                        if (dx * dx + dy * dy < r * r) {
                            const aoeDmg = Math.round(b.damage * 0.6);
                            other.hp -= aoeDmg;
                            spawnDamageNumber(other.x + other.w/2, other.y, aoeDmg, 'aoe');
                        }
                    }
                }

                if (e.hp <= 0) {
                    handleEnemyKilled(e, j);
                }
                if (!b.pierce) break;
            }
        }
        if (hit || b.life <= 0) bullets.splice(i, 1);
    }
}

function handleEnemyKilled(e, j) {
    spawnExplosion(e.x + e.w / 2, e.y + e.h / 2);
    score += e.type === 'boss' ? 500 : 100;
    // Combo system - more coins/score with combo
    comboCount++;
    comboTimer = 180;
    const comboMul = 1 + Math.min(2, comboCount * 0.05);
    // Drop coins - much more generous now
    const baseCoinCount = e.type === 'boss' ? 100 : (e.type === 'turret' ? 18 : 12);
    const coinCount = Math.round(baseCoinCount * comboMul);
    for (let c = 0; c < coinCount; c++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 5;
        coinPickups.push({
            x: e.x + e.w / 2,
            y: e.y + e.h / 2,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 3,
            value: e.type === 'boss' ? 3 : 1, life: 600
        });
    }
    // Drop ROBOT COINS from elite enemies (mech/heavy/sniper/shielder/boss)
    let rcDrop = 0;
    if (e.type === 'boss') rcDrop = 18;       // big bump from 6 -> 18
    else if (e.type === 'miniboss') rcDrop = 10;
    else if (e.type === 'hydraWalker') rcDrop = 5;
    else if (e.type === 'scorpion') rcDrop = 4;
    else if (e.type === 'mech') rcDrop = 4;
    else if (e.type === 'heavy' || e.type === 'sniper') rcDrop = 3;
    else if (e.type === 'shielder' || e.type === 'jumper') rcDrop = 2;
    else if (e.type === 'bomber' || e.type === 'sprinter' || e.type === 'turret') rcDrop = 1;
    for (let c = 0; c < rcDrop; c++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 4;
        coinPickups.push({
            x: e.x + e.w / 2,
            y: e.y + e.h / 2,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 4,
            value: 1, life: 700,
            robotCoin: true
        });
    }
    // Drop a health pack on ~25% of normal enemies, always on bosses
    if (e.type === 'boss' || Math.random() < 0.25) {
        healthDrops.push({
            x: e.x + e.w / 2,
            y: e.y + e.h / 2,
            vx: (Math.random() - 0.5) * 2,
            vy: -3,
            heal: e.type === 'boss' ? 80 : 25,
            life: 700
        });
    }
    enemies.splice(j, 1);
    if (e.type === 'boss') {
        // Unlock the weapon reward and equip it!
        const stage = STAGES[currentStage];
        if (stage && !player.weaponsUnlocked[stage.weaponReward]) {
            player.weaponsUnlocked[stage.weaponReward] = true;
            player.weaponTier = stage.weaponReward;
        }
        // Unlock character if any
        for (const ch of CHARACTERS) {
            if (ch.unlockedBy === currentStage + 1) ch.unlocked = true;
        }
        // Open arena gates (boss is dead, lockdown lifted)
        for (const ag of arenaGates) {
            ag.open = true;
            spawnParticles(ag.x + ag.w / 2, ag.y + ag.h / 2, '#00ff00', 25, 5);
        }
        // Spawn ally cage near the boss death location
        const allyDef = ALLY_TEMPLATES.find(a => a.stage === currentStage);
        if (allyDef) {
            cages.push({
                x: e.x + e.w / 2 - 30, y: 470,
                w: 60, h: 80,
                allyDef: allyDef,
                rescued: false,
                hp: 50,  // shoot to free
                requiresKey: player._pendingCageKey || null
            });
            const haveKey = player._pendingCageKey && (player.keysHeld || []).includes(player._pendingCageKey);
            shopMessage = {
                text: haveKey
                    ? 'PRISONER DETECTED — SHOOT THE CAGE TO FREE THEM'
                    : '🔒 PRISONER DETECTED — FIND THE KEY FIRST',
                timer: 240,
                color: haveKey ? '#ffdd44' : '#ff8844'
            };
        }
        // Big extra explosion
        for (let p = 0; p < 4; p++) {
            spawnExplosion(e.x + Math.random() * e.w, e.y + Math.random() * e.h);
        }
        screenShake = 20;
        // Queue a victory cutscene if defined for this stage. Plays right after
        // the boss explosion before the cage rescue, regardless of stage number.
        const stageDef = STAGES[currentStage];
        if (stageDef && stageDef.victoryCutscene && !stageDef.victoryCutsceneShown) {
            stageDef.victoryCutsceneShown = true;
            // Defer slightly so explosion plays first
            setTimeout(() => {
                if (gameState === 'playing' || gameState === 'won' || gameState === 'stageComplete') {
                    if (gameState === 'won') return;   // don't override final-win banner
                    cutscene = {
                        stage: currentStage,
                        lines: stageDef.victoryCutscene,
                        idx: 0,
                        timer: 0
                    };
                    player.vx = 0; player.vy = 0;
                    gameState = 'cutscene';
                }
            }, 800);
        }
        // If no cage, advance immediately (final stage). Otherwise wait for rescue.
        if (currentStage >= STAGES.length - 1 && !allyDef) {
            gameState = 'won';
        } else if (!allyDef) {
            gameState = 'stageComplete';
        }
        // else: wait for cage to be broken
    }
}

// Per-boss attack origin helper. Returns world-space {x,y} for a named slot
// matching the visual silhouette so attacks emerge from hands/eyes/cannons
// rather than the body's center.
function bossOrigin(e, slot) {
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    switch (e.subtype) {
        case 'guard':
            if (slot === 'leftHand')   return { x: e.x - 14, y: e.y + 88 };
            if (slot === 'rightHand')  return { x: e.x + e.w + 14, y: e.y + 78 };
            if (slot === 'leftShoulder')  return { x: e.x + 8, y: e.y + 28 };
            if (slot === 'rightShoulder') return { x: e.x + e.w - 8, y: e.y + 28 };
            if (slot === 'eyes')       return { x: cx, y: e.y + 14 };
            break;
        case 'skyhammer':
            if (slot === 'leftPod')    return { x: e.x + 4, y: e.y + 30 };
            if (slot === 'rightPod')   return { x: e.x + e.w - 4, y: e.y + 30 };
            if (slot === 'belly')      return { x: cx, y: e.y + e.h - 4 };
            if (slot === 'leftHand')   return { x: e.x - 14, y: e.y + 76 };
            if (slot === 'rightHand')  return { x: e.x + e.w + 14, y: e.y + 76 };
            break;
        case 'inferno':
            if (slot === 'mouth')      return { x: cx, y: e.y + 22 };
            if (slot === 'leftFist')   return { x: e.x - 2, y: e.y + 84 };
            if (slot === 'rightFist')  return { x: e.x + e.w + 2, y: e.y + 84 };
            if (slot === 'eyes')       return { x: cx, y: e.y + 12 };
            if (slot === 'shoulders')  return { x: cx, y: e.y + 22 };
            break;
        case 'ravager':
            if (slot === 'leftSaw')    return { x: e.x - 18, y: e.y + 76 };
            if (slot === 'rightSaw')   return { x: e.x + e.w + 18, y: e.y + 76 };
            if (slot === 'eye')        return { x: cx, y: e.y + 12 };
            if (slot === 'chest')      return { x: cx, y: e.y + 38 };
            if (slot === 'tail')       return { x: e.x + e.w + 22, y: e.y + e.h - 14 };
            break;
        case 'cryo':
            if (slot === 'scepter')    return { x: e.x + e.w + 8, y: e.y + 24 };  // crystal head
            if (slot === 'crystal')    return { x: cx, y: e.y + 44 };
            if (slot === 'leftHand')   return { x: e.x - 4, y: e.y + 80 };
            break;
        case 'nullifier':
            if (slot === 'leftClaw')   return { x: e.x - 16, y: e.y + 90 };
            if (slot === 'rightClaw')  return { x: e.x + e.w + 16, y: e.y + 90 };
            if (slot === 'eye')        return { x: cx, y: e.y + 14 };
            break;
        case 'omega':
            if (slot === 'leftEye')    return { x: e.x + 22, y: e.y + 14 };
            if (slot === 'rightEye')   return { x: e.x + e.w - 22, y: e.y + 14 };
            if (slot === 'chestOmega') return { x: cx, y: e.y + 54 };
            if (slot === 'leftFist')   return { x: e.x - 12, y: e.y + 96 };
            if (slot === 'rightFist')  return { x: e.x + e.w + 12, y: e.y + 96 };
            if (slot === 'halo')       return { x: cx, y: e.y - 8 };
            break;
        case 'titan':
            // Mech-mode (phase 1) and ship-mode (phase 2) attack origins.
            if (e.transformed) {
                // SHIP MODE — the body is rotated horizontally, attacks come from
                // ports along the hull, wing cannons and the engine arrays.
                if (slot === 'noseCannon')  return { x: e.x + e.w + 8, y: cy - 6 };
                if (slot === 'wingTopL')    return { x: e.x + 18, y: e.y + 14 };
                if (slot === 'wingTopR')    return { x: e.x + e.w - 22, y: e.y + 14 };
                if (slot === 'wingBotL')    return { x: e.x + 18, y: e.y + e.h - 18 };
                if (slot === 'wingBotR')    return { x: e.x + e.w - 22, y: e.y + e.h - 18 };
                if (slot === 'engine')      return { x: e.x - 6, y: cy };
            } else {
                // MECH MODE — humanoid: head, shoulders, fists.
                if (slot === 'leftEye')     return { x: e.x + 32, y: e.y + 22 };
                if (slot === 'rightEye')    return { x: e.x + e.w - 32, y: e.y + 22 };
                if (slot === 'leftCannon')  return { x: e.x - 8, y: e.y + 46 };
                if (slot === 'rightCannon') return { x: e.x + e.w + 8, y: e.y + 46 };
                if (slot === 'chestCore')   return { x: cx, y: e.y + 70 };
                if (slot === 'leftFist')    return { x: e.x - 14, y: e.y + 120 };
                if (slot === 'rightFist')   return { x: e.x + e.w + 14, y: e.y + 120 };
            }
            break;
    }
    return { x: cx, y: cy };
}

// Spawn a brief muzzle flash at a world point, color-coded.
function muzzleFlash(x, y, color, glow, big) {
    spawnParticles(x, y, color || '#ffff66', big ? 8 : 5, big ? 5 : 3);
    if (big) spawnShockwave(x, y, 40, glow || color || '#ffff66');
}

// Enemy AI
function updateEnemies() {
    if (gameState !== 'playing') return;
    // Tick temporary platforms (lava puddles, ice shards, etc.)
    for (let i = platforms.length - 1; i >= 0; i--) {
        const p = platforms[i];
        if (p.temp && typeof p.life === 'number') {
            p.life--;
            if (p.life <= 0) platforms.splice(i, 1);
        }
    }

    for (const e of enemies) {
        // Apply burn DOT
        if (e.burnTimer > 0) {
            e.burnTimer--;
            if (e.burnTimer % 15 === 0) {
                e.hp -= e.burnDamage || 4;
                spawnParticles(e.x + e.w/2 + (Math.random() - 0.5) * e.w, e.y + e.h/2, '#ff6622', 2, 1);
                if (e.hp <= 0) {
                    const idx = enemies.indexOf(e);
                    if (idx >= 0) handleEnemyKilled(e, idx);
                    continue;
                }
            }
        }
        // Skip AI updates if frozen
        if (e.frozen > 0) {
            e.frozen--;
            continue;
        }
        // SAFETY: ensure numeric fields used by AI are initialized so a
        // missing `vy` (or similar) doesn't cause NaN propagation that
        // crashes the canvas renderer (createLinearGradient throws on NaN).
        if (typeof e.vx !== 'number' || !isFinite(e.vx)) e.vx = 0;
        if (typeof e.vy !== 'number' || !isFinite(e.vy)) e.vy = 0;
        if (!isFinite(e.x)) e.x = e.baseX || 0;
        if (!isFinite(e.y)) e.y = e.baseY || 0;
        // Apply slow effect
        if (e.slowTimer > 0) e.slowTimer--;
        const slowMul = (e.slowTimer > 0 ? (e.slowFactor || 0.4) : 1) * timeSlowFactor;
        const distToPlayer = Math.sqrt((e.x - player.x) ** 2 + (e.y - player.y) ** 2);

        if (e.type === 'ricochet') {
            // RICOCHET - patrols, fires bouncing pellet shots
            e.x += e.vx * e.dir * slowMul;
            if (e.x <= e.patrolStart || e.x >= e.patrolEnd) e.dir *= -1;
            e.shootTimer -= slowMul;
            if (e.shootTimer <= 0 && distToPlayer < 500) {
                const ang = Math.atan2(player.y - e.y, player.x - e.x);
                enemyBullets.push({
                    x: e.x + e.w / 2, y: e.y + e.h / 2,
                    vx: Math.cos(ang) * 5, vy: Math.sin(ang) * 5,
                    life: 180,
                    damage: 8,
                    bounces: 3,
                    big: true
                });
                e.shootTimer = 80;
            }
        } else if (e.type === 'swarm') {
            // SWARM - small flying drone, orbits and dive-bombs
            e.floatTimer += 0.04 * slowMul;
            const dxp = (player.x + player.w/2) - (e.x + e.w/2);
            const dyp = (player.y + player.h/2) - (e.y + e.h/2);
            const dp = Math.sqrt(dxp*dxp + dyp*dyp) || 1;
            const orbitTime = e.floatTimer + (e.swarmIdx || 0);
            const targetX = player.x + Math.cos(orbitTime) * 180;
            const targetY = player.y + Math.sin(orbitTime) * 80 - 50;
            e.vx = ((targetX - e.x) * 0.025) * slowMul;
            e.vy = ((targetY - e.y) * 0.025) * slowMul;
            e.x += e.vx;
            e.y += e.vy;
            e.shootTimer -= slowMul;
            if (e.shootTimer <= 0 && dp < 350) {
                const ang = Math.atan2(dyp, dxp);
                enemyBullets.push({
                    x: e.x + e.w/2, y: e.y + e.h/2,
                    vx: Math.cos(ang) * 6, vy: Math.sin(ang) * 6,
                    life: 70,
                    damage: 5
                });
                e.shootTimer = 50 + Math.random() * 40;
            }
            if (rectCollide(e, player) && player.invincible <= 0) {
                player.hp -= 8;
                hitFlash = Math.min(1, hitFlash + 0.4);
                player.invincible = 30;
                spawnParticles(player.x + player.w/2, player.y, '#ffaa44', 5, 3);
                screenShake = 4;
            }
        } else if (e.type === 'mech') {
            // MECH - Transformers-style. Big, walks slowly, fires missiles + machine guns.
            const dxp = (player.x + player.w/2) - (e.x + e.w/2);
            const moveSpd = 1.4 * slowMul;
            if (Math.abs(dxp) > 80) {
                e.vx = Math.sign(dxp) * moveSpd;
            } else {
                e.vx = 0;
            }
            e.facing = dxp > 0 ? 1 : -1;
            e.x += e.vx;
            e.vy += 0.5 * slowMul;
            if (e.vy > 14) e.vy = 14;
            e.y += e.vy * slowMul;
            for (const plat of platforms) {
                if (plat.type !== 'ground') continue;
                if (e.x + e.w/2 > plat.x && e.x + e.w/2 < plat.x + plat.w &&
                    e.y + e.h >= plat.y && e.y + e.h <= plat.y + 10 && e.vy > 0) {
                    e.y = plat.y - e.h;
                    e.vy = 0;
                    e.onGround = true;
                    break;
                }
            }
            e.walkPhase = (e.walkPhase || 0) + Math.abs(e.vx) * 0.15;

            e.shootTimer -= slowMul;
            if (e.shootTimer <= 0 && distToPlayer < 600) {
                e.attackPhase = (e.attackPhase || 0) + 1;
                const ang = Math.atan2(player.y - e.y, player.x - e.x);
                if (e.attackPhase % 3 === 0) {
                    // Missile barrage from shoulders
                    for (let m = -1.5; m <= 1.5; m += 1) {
                        enemyBullets.push({
                            x: e.x + e.w / 2 + (m * 8), y: e.y + 10,
                            vx: m * 1.5 + Math.cos(ang) * 3,
                            vy: -3 + Math.sin(ang) * 2,
                            life: 110,
                            damage: 12,
                            big: true
                        });
                    }
                    e.shootTimer = 90;
                } else if (e.attackPhase % 3 === 1) {
                    // Machine gun burst
                    for (let m = 0; m < 5; m++) {
                        const offsetAng = ang + (Math.random() - 0.5) * 0.15;
                        enemyBullets.push({
                            x: e.x + (e.facing > 0 ? e.w : 0),
                            y: e.y + e.h * 0.4,
                            vx: Math.cos(offsetAng) * 7,
                            vy: Math.sin(offsetAng) * 7,
                            life: 80,
                            damage: 6
                        });
                    }
                    e.shootTimer = 100;
                } else {
                    // Charged plasma ball
                    enemyBullets.push({
                        x: e.x + e.w / 2,
                        y: e.y + e.h / 2,
                        vx: Math.cos(ang) * 4,
                        vy: Math.sin(ang) * 4,
                        life: 130,
                        damage: 18,
                        big: true
                    });
                    e.shootTimer = 75;
                }
            }
        } else if (e.type === 'bomber') {
            // BOMBER - hovering kamikaze. Approaches player and explodes
            e.floatTimer += 0.06 * slowMul;
            const dxp = (player.x + player.w/2) - (e.x + e.w/2);
            const dyp = (player.y + player.h/2) - (e.y + e.h/2);
            const dp = Math.sqrt(dxp * dxp + dyp * dyp);
            if (dp > 5) {
                e.x += (dxp / dp) * 2.4 * slowMul;
                e.y += (dyp / dp) * 2.0 * slowMul;
            }
            e.y += Math.sin(e.floatTimer) * 0.4;
            if (rectCollide(e, player) && player.invincible <= 0) {
                spawnExplosion(e.x + e.w/2, e.y + e.h/2);
                spawnParticles(e.x + e.w/2, e.y + e.h/2, '#ff8800', 25, 6);
                screenShake = 16;
                player.hp -= 22;
                hitFlash = Math.min(1, hitFlash + 0.7);
                applyHitStop(4);
                player.invincible = 50;
                player.vx = (player.x < e.x ? -10 : 10);
                player.vy = -10;
                e.hp = 0;
                const idx = enemies.indexOf(e);
                if (idx >= 0) handleEnemyKilled(e, idx);
                if (player.hp <= 0) { gameState = 'dead'; spawnExplosion(player.x + player.w/2, player.y + player.h/2); }
                continue;
            }
        } else if (e.type === 'sprinter') {
            // SPRINTER - very fast melee chaser on the ground
            const dx = (player.x + player.w/2) - (e.x + e.w/2);
            const sprintSpd = 5 * slowMul;
            e.vx = Math.sign(dx) * sprintSpd;
            e.x += e.vx;
            e.vy += 0.5 * slowMul;
            if (e.vy > 14) e.vy = 14;
            e.y += e.vy * slowMul;
            for (const plat of platforms) {
                if (plat.type === 'ground' && plat.y === 550 &&
                    e.x + e.w/2 > plat.x && e.x + e.w/2 < plat.x + plat.w &&
                    e.y + e.h >= plat.y && e.y + e.h <= plat.y + 10 && e.vy > 0) {
                    e.y = plat.y - e.h;
                    e.vy = 0;
                    e.onGround = true;
                    break;
                }
            }
            if (e.onGround && (player.y + player.h) < (e.y + e.h - 50) && Math.random() < 0.05) {
                e.vy = -13;
                e.onGround = false;
            }
            if (rectCollide(e, player) && player.invincible <= 0) {
                player.hp -= 10;
                hitFlash = Math.min(1, hitFlash + 0.5);
                player.invincible = 35;
                player.vx = (player.x < e.x ? -8 : 8);
                player.vy = -7;
                screenShake = 7;
                spawnParticles(player.x + player.w/2, player.y, '#ff3300', 8, 4);
                if (player.hp <= 0) { gameState = 'dead'; spawnExplosion(player.x + player.w/2, player.y + player.h/2); }
            }
        } else if (e.type === 'hydraWalker') {
            // HYDRA-WALKER — patrolling 3-headed beast. Each head fires from
            // its own muzzle. Body strides on dual jointed legs.
            if (!e.heads) {
                e.heads = [
                    { off: { x: -16, y: -4 }, hp: 60, maxHp: 60, color: '#ff4400', shootTimer: 50, alive: true },
                    { off: { x:   0, y: -10 }, hp: 60, maxHp: 60, color: '#ffaa00', shootTimer: 80, alive: true },
                    { off: { x:  16, y: -4 }, hp: 60, maxHp: 60, color: '#88ff44', shootTimer: 110, alive: true }
                ];
                e.legPhase = 0;
            }
            // Patrol left/right
            e.x += e.vx * e.dir * slowMul;
            if (e.x <= e.patrolStart || e.x >= e.patrolEnd) e.dir *= -1;
            e.legPhase = (e.legPhase || 0) + Math.abs(e.vx) * 0.15 * slowMul;
            // Heads fire independently
            let aliveCount = 0;
            for (const head of e.heads) {
                if (!head.alive) continue;
                aliveCount++;
                head.shootTimer -= slowMul;
                if (head.shootTimer <= 0 && distToPlayer < 600) {
                    const hcx = e.x + e.w / 2 + head.off.x;
                    const hcy = e.y + head.off.y;
                    const ang = Math.atan2((player.y + player.h / 2) - hcy, (player.x + player.w / 2) - hcx);
                    enemyBullets.push({
                        x: hcx, y: hcy,
                        vx: Math.cos(ang) * 5, vy: Math.sin(ang) * 5,
                        life: 100, damage: 8,
                        color: head.color, glow: head.color, size: 5
                    });
                    spawnParticles(hcx, hcy, head.color, 4, 3);
                    head.shootTimer = 90 + Math.random() * 40;
                }
            }
            // Boss HP synced to alive heads (so killing heads hurts the body)
            const ratio = aliveCount / e.heads.length;
            const targetHp = Math.round(e.maxHp * ratio);
            if (targetHp < e.hp) e.hp = targetHp;
            // When body HP drops below a head's threshold, kill that head visually
            const headThresholds = e.heads.length;
            for (let h = 0; h < e.heads.length; h++) {
                const head = e.heads[h];
                const aliveLeftAfter = headThresholds - h - 1;
                const cutoff = Math.round(e.maxHp * (aliveLeftAfter / headThresholds));
                if (head.alive && e.hp <= cutoff && aliveLeftAfter < aliveCount) {
                    head.alive = false;
                    const hcx = e.x + e.w / 2 + head.off.x;
                    const hcy = e.y + head.off.y;
                    spawnExplosion(hcx, hcy);
                    spawnParticles(hcx, hcy, head.color, 16, 5);
                    spawnShockwave(hcx, hcy, 50, head.color);
                    screenShake = 8;
                }
            }
            // Contact damage
            if (rectCollide(e, player) && player.invincible <= 0) {
                player.hp -= 8;
                hitFlash = Math.min(1, hitFlash + 0.4);
                player.invincible = 30;
                player.vx = (player.x < e.x ? -7 : 7);
                spawnParticles(player.x + player.w/2, player.y, '#ff6622', 5, 3);
                if (player.hp <= 0) { gameState = 'dead'; spawnExplosion(player.x + player.w/2, player.y + player.h/2); }
            }
            // If all heads dead, the body falls
            if (aliveCount === 0) e.hp = 0;
        } else if (e.type === 'scorpion') {
            // SCORPION-BOT — 4-leg artillery walker. Slow, lobs charged plasma
            // arcs from a tail-mounted turret. Reverses direction at patrol bounds.
            if (e.legPhase === undefined) e.legPhase = 0;
            e.x += e.vx * e.dir * slowMul;
            if (e.x <= e.patrolStart || e.x >= e.patrolEnd) e.dir *= -1;
            e.legPhase = (e.legPhase || 0) + Math.abs(e.vx) * 0.18 * slowMul;
            e.shootTimer -= slowMul;
            if (e.shootTimer <= 0 && distToPlayer < 700) {
                // Lob a single arcing plasma round from the tail
                const tailX = e.x + e.w / 2 + (e.dir > 0 ? -28 : 28);
                const tailY = e.y - 4;
                const dx = (player.x + player.w / 2) - tailX;
                const ang = Math.atan2(-1, Math.sign(dx)) + 0.1;
                const speed = Math.min(11, 6 + Math.abs(dx) * 0.012);
                spawnParticles(tailX, tailY, '#88ddff', 8, 5);
                spawnShockwave(tailX, tailY, 40, '#88ddff');
                screenShake = 5;
                enemyBullets.push({
                    x: tailX, y: tailY,
                    vx: Math.sign(dx) * speed * 0.7,
                    vy: -speed,
                    life: 140, damage: 14,
                    lavaGlob: true,         // reuse arc + impact behavior, recolored
                    color: '#88ddff', glow: '#0088ff', size: 9, big: true,
                    plasmaArc: true
                });
                e.shootTimer = 90;
            }
            // Contact damage
            if (rectCollide(e, player) && player.invincible <= 0) {
                player.hp -= 10;
                hitFlash = Math.min(1, hitFlash + 0.5);
                player.invincible = 32;
                player.vx = (player.x < e.x ? -8 : 8);
                spawnParticles(player.x + player.w/2, player.y, '#aaeeff', 6, 3);
                if (player.hp <= 0) { gameState = 'dead'; spawnExplosion(player.x + player.w/2, player.y + player.h/2); }
            }
        } else if (e.type === 'heavy') {
            // HEAVY - slow, big HP, fires triple shot
            e.x += e.vx * e.dir * slowMul;
            if (e.x <= e.patrolStart || e.x >= e.patrolEnd) e.dir *= -1;
            e.shootTimer -= slowMul;
            if (e.shootTimer <= 0 && distToPlayer < 500) {
                const angle = Math.atan2(player.y - e.y, player.x - e.x);
                for (let a = -1; a <= 1; a++) {
                    const ang = angle + a * 0.18;
                    enemyBullets.push({
                        x: e.x + e.w / 2, y: e.y + e.h / 2,
                        vx: Math.cos(ang) * 4.5, vy: Math.sin(ang) * 4.5,
                        life: 90
                    });
                }
                e.shootTimer = 75;
            }
        } else if (e.type === 'shielder') {
            // SHIELDER - has a shield in front; bullets that hit the shielded side do less damage
            e.x += e.vx * e.dir * slowMul;
            if (e.x <= e.patrolStart || e.x >= e.patrolEnd) e.dir *= -1;
            e.shootTimer -= slowMul;
            if (e.shootTimer <= 0 && distToPlayer < 450) {
                const angle = Math.atan2(player.y - e.y, player.x - e.x);
                enemyBullets.push({
                    x: e.x + e.w / 2, y: e.y + e.h / 2,
                    vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5,
                    life: 80
                });
                e.shootTimer = 70;
            }
        } else if (e.type === 'jumper') {
            // JUMPER - leaps toward player
            e.vy += 0.5 * slowMul;
            e.x += e.vx * slowMul;
            e.y += e.vy * slowMul;
            // Land detection on ground at y=550
            for (const plat of platforms) {
                if (plat.type === 'ground' && plat.y === 550 &&
                    e.x + e.w/2 > plat.x && e.x + e.w/2 < plat.x + plat.w &&
                    e.y + e.h >= plat.y && e.y + e.h <= plat.y + 10 && e.vy > 0) {
                    e.y = plat.y - e.h;
                    e.vy = 0;
                    e.onGround = true;
                    break;
                }
            }
            if (e.onGround) {
                e.jumpTimer -= slowMul;
                if (e.jumpTimer <= 0 && distToPlayer < 500) {
                    // Leap at player
                    const dx = player.x - e.x;
                    e.vx = Math.sign(dx) * 5;
                    e.vy = -12;
                    e.onGround = false;
                    e.jumpTimer = 80;
                } else {
                    e.vx = 0;
                }
            }
            // Damage on contact with player
            if (rectCollide(e, player) && player.invincible <= 0) {
                player.hp -= 8;
                hitFlash = Math.min(1, hitFlash + 0.4);
                player.invincible = 40;
                player.vx = (player.x < e.x ? -8 : 8);
                player.vy = -6;
                screenShake = 6;
                spawnParticles(player.x + player.w/2, player.y, '#ff3300', 8, 4);
                if (player.hp <= 0) { gameState = 'dead'; spawnExplosion(player.x + player.w/2, player.y + player.h/2); }
            }
        } else if (e.type === 'sniper') {
            // SNIPER - far range, slow rate, big damage. Telegraphs with red beam.
            e.shootTimer -= slowMul;
            if (e.aimTimer > 0) e.aimTimer -= slowMul;
            if (e.shootTimer <= 0 && distToPlayer < 800) {
                if (e.aimTimer === 0) {
                    e.aimTimer = 60;
                    e.aimAngle = Math.atan2(player.y - e.y, player.x - e.x);
                } else if (e.aimTimer < 0) {
                    // Fire
                    enemyBullets.push({
                        x: e.x + e.w / 2, y: e.y + e.h / 2,
                        vx: Math.cos(e.aimAngle) * 12, vy: Math.sin(e.aimAngle) * 12,
                        life: 80, big: true, damage: 18
                    });
                    e.shootTimer = 150;
                    e.aimTimer = 0;
                }
            }
        } else if (e.type === 'patrol') {
            // Smart patrol - aware of player. If player is within sight (and visible), chase.
            const seePlayer = distToPlayer < 350 && Math.abs(player.y - e.y) < 100;
            if (seePlayer) {
                e.alerted = 90; // alert duration
            }
            if (e.alerted > 0) {
                e.alerted -= slowMul;
                // Move toward player
                const playerDir = player.x > e.x ? 1 : -1;
                e.dir = playerDir;
                e.x += e.vx * playerDir * 1.3 * slowMul;
                // But don't fall off platform - check platform under feet
                // Stay within original patrol area too
                if (e.x < e.patrolStart - 100) e.x = e.patrolStart - 100;
                if (e.x > e.patrolEnd + 100) e.x = e.patrolEnd + 100;
            } else {
                // Default patrol
                e.x += e.vx * e.dir * slowMul;
                if (e.x <= e.patrolStart || e.x >= e.patrolEnd) e.dir *= -1;
            }
            // Shoot at player if close
            e.shootTimer -= slowMul;
            if (e.shootTimer <= 0 && distToPlayer < 400) {
                const angle = Math.atan2(player.y - e.y, player.x - e.x);
                enemyBullets.push({
                    x: e.x + e.w / 2, y: e.y + e.h / 2,
                    vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4,
                    life: 80
                });
                e.shootTimer = 90;
            }
        } else if (e.type === 'drone') {
            // Float up and down
            e.floatTimer += 0.03 * slowMul;
            e.y = e.baseY + Math.sin(e.floatTimer) * 30;
            // Shoot downward at player
            e.shootTimer -= slowMul;
            if (e.shootTimer <= 0 && distToPlayer < 350) {
                const angle = Math.atan2(player.y - e.y, player.x - e.x);
                enemyBullets.push({
                    x: e.x + e.w / 2, y: e.y + e.h,
                    vx: Math.cos(angle) * 3.5, vy: Math.sin(angle) * 3.5,
                    life: 90
                });
                e.shootTimer = 75;
            }
        } else if (e.type === 'turret') {
            // Aim at player
            e.angle = Math.atan2(player.y - e.y, player.x - e.x);
            // Rapid fire when player is close
            e.shootTimer -= slowMul;
            if (e.shootTimer <= 0 && distToPlayer < 500) {
                enemyBullets.push({
                    x: e.x + e.w / 2 + Math.cos(e.angle) * 20,
                    y: e.y + e.h / 2 + Math.sin(e.angle) * 20,
                    vx: Math.cos(e.angle) * 5, vy: Math.sin(e.angle) * 5,
                    life: 70
                });
                e.shootTimer = 50;
            }

        } else if (e.type === 'boss' || e.type === 'miniboss') {
            // Boss AI - subtype-specific
            e.moveTimer += slowMul;
            // Decrement phase-transition flash timer for the renderer
            if (e.phaseFlashTimer && e.phaseFlashTimer > 0) e.phaseFlashTimer--;
            if (e.phase === 1 && e.hp < e.maxHp * 0.5) {
                e.phase = 2;
                // === PHASE 2 CINEMATIC TRANSITION ===
                // Multi-ring shockwave + sparks rain + heavy hitstop + screen
                // shake + on-screen banner. Sells the "I'm getting serious"
                // moment in every boss fight.
                const cx = e.x + e.w/2;
                const cy = e.y + e.h/2;
                spawnShockwave(cx, cy, 240, '#ff44ff');
                spawnShockwave(cx, cy, 360, '#ffffff');
                spawnShockwave(cx, cy, 500, '#ff88ff');
                spawnParticles(cx, cy, '#ff44ff', 80, 12);
                spawnParticles(cx, cy, '#ffffff', 50, 10);
                spawnParticles(cx, cy, '#aa00ff', 30, 8);
                // Cone of sparks erupting upward
                for (let i = 0; i < 18; i++) {
                    const ang = -Math.PI / 2 + (i - 9) * 0.12;
                    spawnParticles(
                        cx + Math.cos(ang) * 30,
                        cy + Math.sin(ang) * 30,
                        '#ff66ff', 2, 8
                    );
                }
                screenShake = 28;
                hitStop = 10;
                critFlash = 18;
                if (typeof shopMessage !== 'undefined') {
                    shopMessage = { text: '⚡ PHASE 2 — TRANSFORMATION ⚡', timer: 180, color: '#ff44ff' };
                }
                // Mark a transition glow timer the boss draw can read
                e.phaseFlashTimer = 60;
            }
            // PHASE 3 — desperate mode at 25% HP. All bosses get a danger
            // glow + faster fire timers + occasional rage-burst signature
            // attack handled below per-subtype.
            if (e.phase === 2 && e.hp < e.maxHp * 0.25) {
                e.phase = 3;
                // === PHASE 3 RAGE TRANSITION — even bigger than phase 2 ===
                const cx = e.x + e.w/2;
                const cy = e.y + e.h/2;
                spawnShockwave(cx, cy, 320, '#ff0044');
                spawnShockwave(cx, cy, 460, '#ff8800');
                spawnShockwave(cx, cy, 620, '#ffffff');
                spawnParticles(cx, cy, '#ff0044', 100, 14);
                spawnParticles(cx, cy, '#ff8800', 60, 12);
                spawnParticles(cx, cy, '#ffffff', 40, 10);
                // Outward radial burst — 24 spark trails
                for (let i = 0; i < 24; i++) {
                    const ang = (i / 24) * Math.PI * 2;
                    spawnParticles(
                        cx + Math.cos(ang) * 50,
                        cy + Math.sin(ang) * 50,
                        '#ff6644', 3, 12
                    );
                }
                screenShake = 36;
                hitStop = 14;
                hitFlash = 1;     // full red screen flash
                critFlash = 24;
                if (typeof shopMessage !== 'undefined') {
                    shopMessage = { text: '★ BOSS ENRAGED — FINAL PHASE ★', timer: 240, color: '#ff0044' };
                }
                e.phaseFlashTimer = 80;
            }
            // In phase 3, fire timers are 35% faster
            const phaseScale = e.phase === 3 ? 0.65 : 1;
            // Speed up shoot timers in phase 3 by inflating slowMul locally
            // (only for the boss subtype branches below). bossSlowMul is used
            // by every `e.shootTimer -= bossSlowMul` line in the boss AI.
            const bossSlowMul = slowMul / phaseScale;
            const playerAngle = Math.atan2(player.y - e.y, player.x - e.x);

            if (e.subtype === 'guard') {
                // GUARD-1: standard movement, spread shots
                e.y = e.baseY + Math.sin(e.moveTimer * 0.02) * 40;
                e.x = e.baseX + Math.sin(e.moveTimer * 0.015) * 70;
                e.shootTimer -= slowMul;
                if (e.shootTimer <= 0) {
                    if (e.phase === 1) {
                        for (let a = -2; a <= 2; a++) {
                            const angle = playerAngle + a * 0.25;
                            enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4, life: 100 });
                        }
                        e.shootTimer = 75;
                    } else {
                        for (let i = 0; i < 3; i++) {
                            enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: Math.cos(playerAngle) * (4 + i * 0.5), vy: Math.sin(playerAngle) * (4 + i * 0.5), life: 100 });
                        }
                        e.shootTimer = 30;
                    }
                }
            } else if (e.subtype === 'skyhammer') {
                // SKYHAMMER: flies high, drops bombs from BELLY, fires missiles from SHOULDER PODS
                e.y = e.baseY + Math.sin(e.moveTimer * 0.025) * 60;
                e.x = e.baseX + Math.sin(e.moveTimer * 0.01) * 120;
                e.shootTimer -= slowMul;
                if (e.shootTimer <= 0) {
                    if (e.phase === 1) {
                        // Bomb drop from BELLY — 3 falling rounds
                        const o = bossOrigin(e, 'belly');
                        muzzleFlash(o.x, o.y, '#88ddff', '#0088ff', false);
                        for (let i = -1; i <= 1; i++) {
                            enemyBullets.push({
                                x: o.x + i * 30, y: o.y,
                                vx: i * 1.5, vy: 4, life: 110,
                                color: '#88ddff', glow: '#0088ff', size: 7, big: true
                            });
                        }
                        e.shootTimer = 50;
                    } else {
                        // Phase 2: alternate bombs (belly) + missiles (shoulder pods)
                        e.attackPattern = (e.attackPattern + 1) % 2;
                        if (e.attackPattern === 0) {
                            const o = bossOrigin(e, 'belly');
                            muzzleFlash(o.x, o.y, '#88ddff', '#0088ff', true);
                            for (let i = -2; i <= 2; i++) {
                                enemyBullets.push({
                                    x: o.x + i * 25, y: o.y,
                                    vx: i * 1.2, vy: 5, life: 110,
                                    color: '#88ddff', glow: '#0088ff', size: 7, big: true
                                });
                            }
                        } else {
                            // SIGNATURE: shoulder-pod missiles aimed at player
                            const oL = bossOrigin(e, 'leftPod');
                            const oR = bossOrigin(e, 'rightPod');
                            muzzleFlash(oL.x, oL.y, '#ff4400', '#ff0000', true);
                            muzzleFlash(oR.x, oR.y, '#ff4400', '#ff0000', true);
                            for (let a = -1; a <= 1; a++) {
                                const angle = playerAngle + a * 0.15;
                                const o = a < 0 ? oL : oR;
                                enemyBullets.push({
                                    x: o.x, y: o.y,
                                    vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5,
                                    life: 100,
                                    color: '#ff8844', glow: '#ff4400', size: 8, big: true
                                });
                            }
                        }
                        e.shootTimer = 40;
                    }
                }
            } else if (e.subtype === 'inferno') {
                // INFERNO-X: rapid fire, frequent circle bursts, and LAVA GLOBS
                e.y = e.baseY + Math.sin(e.moveTimer * 0.03) * 50;
                e.x = e.baseX + Math.cos(e.moveTimer * 0.02) * 80;
                e.shootTimer -= slowMul;
                if (e.shootTimer <= 0) {
                    if (e.phase === 1) {
                        e.attackPattern = (e.attackPattern + 1) % 5;
                        if (e.attackPattern < 3) {
                            // Aimed triple
                            for (let a = -1; a <= 1; a++) {
                                const angle = playerAngle + a * 0.2;
                                enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5, life: 100 });
                            }
                            e.shootTimer = 25;
                        } else if (e.attackPattern === 3) {
                            // Circle burst
                            for (let a = 0; a < 12; a++) {
                                const angle = (a / 12) * Math.PI * 2;
                                enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4, life: 90 });
                            }
                            e.shootTimer = 60;
                        } else {
                            // SIGNATURE: 3 LAVA GLOBS lobbed in arcs from the MOUTH
                            const o = bossOrigin(e, 'mouth');
                            muzzleFlash(o.x, o.y, '#ff4400', '#ff8800', true);
                            for (let i = -1; i <= 1; i++) {
                                enemyBullets.push({
                                    x: o.x, y: o.y,
                                    vx: Math.cos(playerAngle) * 3 + i * 1.5,
                                    vy: Math.sin(playerAngle) * 2 - 5,
                                    life: 120, damage: 14,
                                    lavaGlob: true,                 // marker for arc + puddle
                                    color: '#ff4400', glow: '#ff8800', big: true
                                });
                            }
                            e.shootTimer = 80;
                        }
                    } else {
                        e.attackPattern = (e.attackPattern + 1) % 4;
                        if (e.attackPattern < 2) {
                            for (let a = -2; a <= 2; a++) {
                                const angle = playerAngle + a * 0.18;
                                enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: Math.cos(angle) * 5.5, vy: Math.sin(angle) * 5.5, life: 100 });
                            }
                            e.shootTimer = 28;
                        } else if (e.attackPattern === 2) {
                            // Double circle burst
                            for (let a = 0; a < 16; a++) {
                                const angle = (a / 16) * Math.PI * 2;
                                enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4, life: 90 });
                            }
                            e.shootTimer = 50;
                        } else {
                            // Phase 2 lava globs — 5 in a fan from the MOUTH
                            const o = bossOrigin(e, 'mouth');
                            muzzleFlash(o.x, o.y, '#ff4400', '#ff8800', true);
                            for (let i = -2; i <= 2; i++) {
                                enemyBullets.push({
                                    x: o.x, y: o.y,
                                    vx: Math.cos(playerAngle) * 3 + i * 1.4,
                                    vy: Math.sin(playerAngle) * 2 - 6,
                                    life: 130, damage: 18,
                                    lavaGlob: true,
                                    color: '#ff4400', glow: '#ff8800', big: true
                                });
                            }
                            e.shootTimer = 70;
                        }
                    }
                }
            } else if (e.subtype === 'ravager') {
                // RAVAGER: charges side to side, sprays bullets
                e.y = e.baseY + Math.sin(e.moveTimer * 0.04) * 30;
                e.x = e.baseX + Math.sin(e.moveTimer * 0.025) * 150;  // bigger horizontal sweep
                e.shootTimer -= slowMul;
                if (e.shootTimer <= 0) {
                    if (e.phase === 1) {
                        // Spray with random spread
                        for (let i = 0; i < 4; i++) {
                            const angle = playerAngle + (Math.random() - 0.5) * 0.6;
                            enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5, life: 90 });
                        }
                        e.shootTimer = 18;
                    } else {
                        // Phase 2: faster spray + occasional spread shot
                        e.attackPattern = (e.attackPattern + 1) % 5;
                        if (e.attackPattern < 4) {
                            for (let i = 0; i < 3; i++) {
                                const angle = playerAngle + (Math.random() - 0.5) * 0.5;
                                enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: Math.cos(angle) * 6, vy: Math.sin(angle) * 6, life: 90 });
                            }
                            e.shootTimer = 12;
                        } else {
                            for (let a = -3; a <= 3; a++) {
                                const angle = playerAngle + a * 0.18;
                                enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5, life: 100 });
                            }
                            e.shootTimer = 40;
                        }
                    }
                }
            } else if (e.subtype === 'cryo') {
                // CRYO-LORD: ice shots from SCEPTER, frost rings from CHEST CRYSTAL
                e.y = e.baseY + Math.sin(e.moveTimer * 0.018) * 60;
                e.x = e.baseX + Math.cos(e.moveTimer * 0.012) * 100;
                e.shootTimer -= slowMul;
                if (e.shootTimer <= 0) {
                    if (e.phase === 1) {
                        e.attackPattern = (e.attackPattern + 1) % 3;
                        if (e.attackPattern === 0) {
                            // Wide ice burst from SCEPTER
                            const o = bossOrigin(e, 'scepter');
                            muzzleFlash(o.x, o.y, '#aaeeff', '#88ccff', true);
                            for (let a = -3; a <= 3; a++) {
                                const angle = playerAngle + a * 0.18;
                                enemyBullets.push({ x: o.x, y: o.y, vx: Math.cos(angle) * 4.5, vy: Math.sin(angle) * 4.5, life: 110, color: '#aaeeff', glow: '#88ccff', size: 7 });
                            }
                            e.shootTimer = 45;
                        } else if (e.attackPattern === 1) {
                            // Aimed pair from SCEPTER
                            const o = bossOrigin(e, 'scepter');
                            muzzleFlash(o.x, o.y, '#aaeeff', '#88ccff', false);
                            for (let i = 0; i < 4; i++) {
                                enemyBullets.push({ x: o.x, y: o.y, vx: Math.cos(playerAngle) * (4 + i * 0.5), vy: Math.sin(playerAngle) * (4 + i * 0.5), life: 110, color: '#aaeeff', glow: '#88ccff', size: 7 });
                            }
                            e.shootTimer = 25;
                        } else {
                            // Frost ring from CHEST CRYSTAL
                            const o = bossOrigin(e, 'crystal');
                            spawnShockwave(o.x, o.y, 100, '#aaeeff');
                            for (let a = 0; a < 14; a++) {
                                const angle = (a / 14) * Math.PI * 2;
                                enemyBullets.push({ x: o.x, y: o.y, vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4, life: 95, color: '#aaeeff', glow: '#88ccff', size: 6 });
                            }
                            e.shootTimer = 60;
                        }
                    } else {
                        // Phase 2: faster + double rings
                        e.attackPattern = (e.attackPattern + 1) % 3;
                        if (e.attackPattern === 0) {
                            const o = bossOrigin(e, 'scepter');
                            muzzleFlash(o.x, o.y, '#ffaaff', '#88ccff', true);
                            for (let a = -4; a <= 4; a++) {
                                const angle = playerAngle + a * 0.15;
                                enemyBullets.push({ x: o.x, y: o.y, vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5, life: 110, color: '#aaeeff', glow: '#88ccff', size: 7 });
                            }
                            e.shootTimer = 35;
                        } else if (e.attackPattern === 1) {
                            const o = bossOrigin(e, 'crystal');
                            spawnShockwave(o.x, o.y, 130, '#ffaaff');
                            for (let a = 0; a < 16; a++) {
                                const angle = (a / 16) * Math.PI * 2;
                                enemyBullets.push({ x: o.x, y: o.y, vx: Math.cos(angle) * 3.5, vy: Math.sin(angle) * 3.5, life: 90, color: '#aaeeff', glow: '#88ccff' });
                                enemyBullets.push({ x: o.x, y: o.y, vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5, life: 90, color: '#ffaaff', glow: '#88ccff' });
                            }
                            e.shootTimer = 70;
                        } else {
                            const o = bossOrigin(e, 'scepter');
                            muzzleFlash(o.x, o.y, '#aaeeff', '#88ccff', true);
                            for (let i = 0; i < 5; i++) {
                                enemyBullets.push({ x: o.x, y: o.y, vx: Math.cos(playerAngle) * (5 + i * 0.5), vy: Math.sin(playerAngle) * (5 + i * 0.5), life: 110, color: '#aaeeff', glow: '#88ccff', size: 7 });
                            }
                            e.shootTimer = 22;
                        }
                    }
                }
            } else if (e.subtype === 'nullifier') {
                // NULLIFIER: teleports occasionally, dense bullet patterns + PHASE STRIKE
                if (e.moveTimer % 240 === 239) {
                    // Standard teleport to a new spot near the right side of the arena
                    e.x = e.baseX + (Math.random() - 0.5) * 200;
                    e.y = e.baseY + (Math.random() - 0.5) * 100;
                    spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#aa00ff', 20, 5);
                } else {
                    e.y = e.baseY + Math.sin(e.moveTimer * 0.025) * 70;
                    e.x = e.baseX + Math.cos(e.moveTimer * 0.018) * 130;
                }
                e.shootTimer -= slowMul;
                if (e.shootTimer <= 0) {
                    e.attackPattern = (e.attackPattern + 1) % (e.phase === 1 ? 4 : 5);
                    if (e.attackPattern === 0) {
                        // Twin spirals
                        const t = e.moveTimer * 0.2;
                        for (let i = 0; i < 6; i++) {
                            const angle = t + i * (Math.PI / 3);
                            enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4, life: 100 });
                        }
                        e.shootTimer = 12;
                    } else if (e.attackPattern === 1) {
                        // Aimed barrage
                        for (let i = 0; i < 5; i++) {
                            enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: Math.cos(playerAngle) * (4 + i * 0.6), vy: Math.sin(playerAngle) * (4 + i * 0.6), life: 110 });
                        }
                        e.shootTimer = 25;
                    } else if (e.attackPattern === 2) {
                        // Big radial
                        for (let a = 0; a < 18; a++) {
                            const angle = (a / 18) * Math.PI * 2;
                            enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4, life: 100 });
                        }
                        e.shootTimer = 50;
                    } else if (e.attackPattern === 3) {
                        // SIGNATURE: PHASE STRIKE — teleport adjacent to player and fire
                        // a tight burst from the CLAWS directly at them. Includes warning
                        // particles at both source and destination.
                        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#aa00ff', 25, 7);
                        spawnShockwave(e.x + e.w / 2, e.y + e.h / 2, 90, '#aa00ff');
                        const dirSign = (player.x < e.baseX) ? 1 : -1;
                        e.x = player.x + dirSign * 140;
                        e.y = player.y - 20;
                        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#ff66ff', 25, 7);
                        spawnShockwave(e.x + e.w / 2, e.y + e.h / 2, 110, '#ff66ff');
                        screenShake = 12;
                        const newAngle = Math.atan2(player.y - e.y, player.x - e.x);
                        // Fire one bullet from each claw
                        const oL = bossOrigin(e, 'leftClaw');
                        const oR = bossOrigin(e, 'rightClaw');
                        muzzleFlash(oL.x, oL.y, '#cc66ff', '#aa00ff', true);
                        muzzleFlash(oR.x, oR.y, '#cc66ff', '#aa00ff', true);
                        for (let i = -1; i <= 1; i++) {
                            const a = newAngle + i * 0.12;
                            const o = i < 0 ? oL : oR;
                            enemyBullets.push({
                                x: o.x, y: o.y,
                                vx: Math.cos(a) * 7, vy: Math.sin(a) * 7,
                                life: 80, damage: 14,
                                color: '#cc66ff', glow: '#aa00ff', big: true
                            });
                        }
                        e.shootTimer = 60;
                    } else {
                        // Phase 2 cross pattern (slimmed down — was 16 bullets)
                        for (let a = 0; a < 4; a++) {
                            for (let r = 0; r < 3; r++) {
                                const angle = (a / 4) * Math.PI * 2 + Math.PI / 4;
                                const sp = 3 + r;
                                enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: Math.cos(angle) * sp, vy: Math.sin(angle) * sp, life: 100 });
                            }
                        }
                        e.shootTimer = 45;
                    }
                }
            } else if (e.subtype === 'hydra') {
                // HYDRA - multi-headed monster boss. Each head fires its own pattern.
                if (!e.heads) {
                    e.heads = [
                        { x: 0, y: -10, angle: 0, alive: true, hp: 100, maxHp: 100, color: '#ff4400', shootTimer: 60 },
                        { x: -50, y: 20, angle: -0.4, alive: true, hp: 100, maxHp: 100, color: '#ffaa00', shootTimer: 80 },
                        { x: 50, y: 20, angle: 0.4, alive: true, hp: 100, maxHp: 100, color: '#88ff44', shootTimer: 100 },
                        { x: -90, y: 50, angle: -0.7, alive: true, hp: 100, maxHp: 100, color: '#44aaff', shootTimer: 120 },
                        { x: 90, y: 50, angle: 0.7, alive: true, hp: 100, maxHp: 100, color: '#aa44ff', shootTimer: 140 }
                    ];
                }
                // Slow drift movement
                e.y = e.baseY + Math.sin(e.moveTimer * 0.012) * 25;
                e.x = e.baseX + Math.sin(e.moveTimer * 0.008) * 60;
                // Each head animates and fires
                let aliveCount = 0;
                for (const head of e.heads) {
                    if (!head.alive) continue;
                    aliveCount++;
                    head.angle += Math.sin(e.moveTimer * 0.04 + head.x * 0.01) * 0.005;
                    head.shootTimer -= slowMul;
                    if (head.shootTimer <= 0) {
                        const cx = e.x + e.w / 2 + head.x;
                        const cy = e.y + e.h / 2 + head.y;
                        const playerAng = Math.atan2(player.y - cy, player.x - cx);
                        // Each head fires 3-shot spread
                        for (let s = -1; s <= 1; s++) {
                            const ang = playerAng + s * 0.15;
                            enemyBullets.push({
                                x: cx, y: cy,
                                vx: Math.cos(ang) * 5, vy: Math.sin(ang) * 5,
                                life: 110, damage: 10
                            });
                        }
                        head.shootTimer = 80 + Math.random() * 40;
                    }
                }
                // Boss HP based on remaining heads
                const ratio = aliveCount / e.heads.length;
                e.hp = Math.round(e.maxHp * ratio);
                // Phase 2 if half heads dead
                if (aliveCount <= 2) e.phase = 2;
                // If all heads dead, boss dies
                if (aliveCount === 0) {
                    e.hp = 0;
                }
            } else if (e.subtype === 'omega') {
                // OMEGA-PRIME: huge final boss with all attack types
                e.y = e.baseY + Math.sin(e.moveTimer * 0.02) * 60;
                e.x = e.baseX + Math.sin(e.moveTimer * 0.015) * 100;
                e.shootTimer -= slowMul;
                if (e.shootTimer <= 0) {
                    e.attackPattern = (e.attackPattern + 1) % (e.phase === 1 ? 5 : 6);
                    if (e.attackPattern === 0) {
                        // Wide spread from CHEST OMEGA emblem
                        const o = bossOrigin(e, 'chestOmega');
                        muzzleFlash(o.x, o.y, '#ffaa00', '#ff44ff', true);
                        for (let a = -3; a <= 3; a++) {
                            const angle = playerAngle + a * 0.2;
                            enemyBullets.push({ x: o.x, y: o.y, vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5, life: 110, color: '#ffffff', glow: '#ff44ff' });
                        }
                        e.shootTimer = e.phase === 1 ? 50 : 35;
                    } else if (e.attackPattern === 1) {
                        // SIGNATURE: TWIN LASER EYES — two converging beams from each eye
                        const oL = bossOrigin(e, 'leftEye');
                        const oR = bossOrigin(e, 'rightEye');
                        muzzleFlash(oL.x, oL.y, '#ff44ff', '#ff00ff', true);
                        muzzleFlash(oR.x, oR.y, '#ff44ff', '#ff00ff', true);
                        screenShake = 10;
                        // Each eye fires a 3-shot burst toward the player
                        for (let i = 0; i < 3; i++) {
                            enemyBullets.push({
                                x: oL.x, y: oL.y,
                                vx: Math.cos(playerAngle) * (8 + i * 0.4),
                                vy: Math.sin(playerAngle) * (8 + i * 0.4),
                                life: 80, damage: 16,
                                color: '#ff66ff', glow: '#ff00ff', size: 7, big: true
                            });
                            enemyBullets.push({
                                x: oR.x, y: oR.y,
                                vx: Math.cos(playerAngle) * (8 + i * 0.4),
                                vy: Math.sin(playerAngle) * (8 + i * 0.4),
                                life: 80, damage: 16,
                                color: '#ff66ff', glow: '#ff00ff', size: 7, big: true
                            });
                        }
                        e.shootTimer = e.phase === 1 ? 35 : 25;
                    } else if (e.attackPattern === 2) {
                        // Circle burst from CHEST OMEGA emblem
                        const o = bossOrigin(e, 'chestOmega');
                        muzzleFlash(o.x, o.y, '#ffffff', '#ff44ff', true);
                        for (let a = 0; a < 16; a++) {
                            const angle = (a / 16) * Math.PI * 2;
                            enemyBullets.push({ x: o.x, y: o.y, vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4, life: 90, color: '#ffaa00', glow: '#ff44ff' });
                        }
                        e.shootTimer = e.phase === 1 ? 70 : 50;
                    } else if (e.attackPattern === 3) {
                        // Random spray from BOTH GAUNTLETS
                        const oL = bossOrigin(e, 'leftFist');
                        const oR = bossOrigin(e, 'rightFist');
                        muzzleFlash(oL.x, oL.y, '#ffaa00', '#ff8800', false);
                        muzzleFlash(oR.x, oR.y, '#ffaa00', '#ff8800', false);
                        for (let i = 0; i < 6; i++) {
                            const angle = playerAngle + (Math.random() - 0.5) * 1.0;
                            const o = (i % 2 === 0) ? oL : oR;
                            enemyBullets.push({ x: o.x, y: o.y, vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5, life: 100, color: '#ffaa00', glow: '#ff8800' });
                        }
                        e.shootTimer = 25;
                    } else if (e.attackPattern === 4) {
                        // Aimed barrage from chest
                        const o = bossOrigin(e, 'chestOmega');
                        muzzleFlash(o.x, o.y, '#ffffff', '#ff44ff', true);
                        for (let i = 0; i < 4; i++) {
                            enemyBullets.push({ x: o.x, y: o.y, vx: Math.cos(playerAngle) * (4 + i * 0.7), vy: Math.sin(playerAngle) * (4 + i * 0.7), life: 110, color: '#ffffff', glow: '#ff44ff' });
                        }
                        e.shootTimer = e.phase === 1 ? 30 : 22;
                    } else {
                        // Phase 2 only: dual circle bursts from chest (slimmed — was 40 bullets)
                        const o = bossOrigin(e, 'chestOmega');
                        spawnShockwave(o.x, o.y, 120, '#ff44ff');
                        for (let a = 0; a < 14; a++) {
                            const angle = (a / 14) * Math.PI * 2;
                            enemyBullets.push({ x: o.x, y: o.y, vx: Math.cos(angle) * 3.5, vy: Math.sin(angle) * 3.5, life: 90, color: '#ffaa00', glow: '#ff44ff' });
                            enemyBullets.push({ x: o.x, y: o.y, vx: Math.cos(angle) * 5.5, vy: Math.sin(angle) * 5.5, life: 90, color: '#ffffff', glow: '#ff44ff' });
                        }
                        e.shootTimer = 90;
                    }
                }
            } else if (e.subtype === 'titan') {
                updateBossTitan(e, playerAngle, slowMul);
            }

            // PHASE 3 RAGE — bonus shootTimer decrement so all bosses fire ~35% faster.
            // Also adds a constant aura-burst particle so the player sees the rage state.
            if (e.phase === 3) {
                e.shootTimer -= slowMul * 0.5;   // total decrement now ~1.5× normal
                if ((e.moveTimer | 0) % 4 === 0) {
                    spawnParticles(
                        e.x + e.w / 2 + (Math.random() - 0.5) * e.w,
                        e.y + e.h / 2 + (Math.random() - 0.5) * e.h,
                        '#ff0044', 1, 4
                    );
                }
                // Rage burst — a circle of bullets every 3 seconds. Skips
                // hydra/titan since those have their own systems.
                e.rageBurstTimer = (e.rageBurstTimer || 0) - slowMul;
                if (e.rageBurstTimer <= 0 && e.subtype !== 'hydra' && e.subtype !== 'titan') {
                    const cx = e.x + e.w / 2;
                    const cy = e.y + e.h / 2;
                    spawnShockwave(cx, cy, 100, '#ff0044');
                    spawnParticles(cx, cy, '#ff0044', 20, 6);
                    for (let a = 0; a < 12; a++) {
                        const ang = (a / 12) * Math.PI * 2 + e.moveTimer * 0.005;
                        enemyBullets.push({
                            x: cx, y: cy,
                            vx: Math.cos(ang) * 5,
                            vy: Math.sin(ang) * 5,
                            life: 100,
                            damage: 14,
                            color: '#ff8844', glow: '#ff0044', size: 6, big: true
                        });
                    }
                    screenShake = Math.max(screenShake, 10);
                    e.rageBurstTimer = 180;   // 3 seconds
                }
            }
        }
    }

    // Enemy bullets hit player
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.x += b.vx;
        b.y += b.vy;
        // Lava globs arc downward (gravity)
        if (b.lavaGlob) {
            b.vy += 0.32;
            // Trail
            if (Math.random() < 0.5) {
                spawnParticles(b.x, b.y, '#ff8844', 1, 1);
            }
        }
        b.life--;

        if (b.life <= 0) { enemyBullets.splice(i, 1); continue; }

        // Despawn off-screen
        if (Math.abs(b.x - camera.x) > 1500 || Math.abs(b.y - camera.y) > 900) {
            enemyBullets.splice(i, 1);
            continue;
        }

        // Enemy bullets blocked by walls (encourages cover) — but ricochet bullets bounce instead
        let hitWall = false;
        for (const plat of platforms) {
            if (plat.type === 'recovery' || plat.type === 'spike' || plat.type === 'laser' || plat.type === 'lava') continue;
            if (b.x >= plat.x && b.x <= plat.x + plat.w && b.y >= plat.y && b.y <= plat.y + plat.h) {
                if ((b.bounces || 0) > 0) {
                    // Reflect off the platform
                    b.bounces--;
                    // Determine reflection axis by which side has less overlap
                    const ox = Math.min(b.x - plat.x, plat.x + plat.w - b.x);
                    const oy = Math.min(b.y - plat.y, plat.y + plat.h - b.y);
                    if (ox < oy) {
                        b.vx *= -1;
                        b.x += b.vx * 2;
                    } else {
                        b.vy *= -1;
                        b.y += b.vy * 2;
                    }
                    spawnParticles(b.x, b.y, '#ff8844', 4, 3);
                } else {
                    spawnParticles(b.x, b.y, '#ff6644', 4, 2);
                    hitWall = true;
                    // Lava globs spawn a temporary lava puddle when they hit ground
                    if (b.lavaGlob && !b.plasmaArc && plat.type === 'ground') {
                        const pw = 60;
                        const pxx = Math.max(plat.x, b.x - pw / 2);
                        platforms.push({
                            x: pxx, y: plat.y - 4, w: pw, h: 14,
                            type: 'lava',
                            temp: true, life: 360
                        });
                        spawnExplosion(b.x, b.y);
                        spawnShockwave(b.x, b.y, 80, '#ff8800');
                    }
                    // Plasma arc impact — clean energy burst, no puddle
                    if (b.plasmaArc && plat.type === 'ground') {
                        spawnParticles(b.x, b.y, '#88ddff', 14, 5);
                        spawnShockwave(b.x, b.y, 70, '#88ddff');
                        screenShake = 6;
                    }
                }
                break;
            }
        }
        if (hitWall) { enemyBullets.splice(i, 1); continue; }

        // Enemy bullets blocked by closed doors
        let hitDoor = false;
        for (const d of doors) {
            if (d.open) continue;
            if (b.x >= d.x && b.x <= d.x + d.w && b.y >= d.y && b.y <= d.y + d.h) {
                spawnParticles(b.x, b.y, '#ff0000', 4, 2);
                hitDoor = true;
                break;
            }
        }
        if (hitDoor) { enemyBullets.splice(i, 1); continue; }

        // Enemy bullets blocked by closed arena gates
        let hitGate = false;
        for (const ag of arenaGates) {
            if (ag.open) continue;
            if (b.x >= ag.x && b.x <= ag.x + ag.w && b.y >= ag.y && b.y <= ag.y + ag.h) {
                spawnParticles(b.x, b.y, '#ffaa00', 5, 3);
                hitGate = true;
                break;
            }
        }
        if (hitGate) { enemyBullets.splice(i, 1); continue; }

        // PERFECT DODGE detection - dashing through a bullet that just barely misses
        if (player.dashing && player.invincible <= 0) {
            const dx = b.x - (player.x + player.w / 2);
            const dy = b.y - (player.y + player.h / 2);
            if (dx * dx + dy * dy < 50 * 50 && (dx * dx + dy * dy) > 25 * 25) {
                // Trigger perfect dodge effect
                player.perfectDodgeTimer = 60;
                timeSlowFactor = 0.4;
                spawnParticles(b.x, b.y, '#ffff00', 12, 5);
                screenShake = 6;
                shopMessage = { text: '⚡ PERFECT DODGE ⚡', timer: 60, color: '#ffff00' };
                comboCount += 2;  // bonus combo
                comboTimer = 180;
            }
        }

        // Hit player — but PARRY window can deflect the bullet first
        if (b.x > player.x && b.x < player.x + player.w && b.y > player.y && b.y < player.y + player.h) {
            // Active parry: reflect bullet back at the closest enemy
            if (player.parrying && player.parryTimer > 0) {
                player.parrySuccess = 30;
                applyHitStop(4);
                screenShake = Math.max(screenShake, 10);
                spawnParticles(b.x, b.y, '#ffffff', 14, 5);
                spawnShockwave(b.x, b.y, 60, '#ffffff');
                floatTexts.push({ text: 'PARRY!', x: b.x, y: b.y - 8, life: 45, color: '#ffffff' });
                // Find nearest enemy to aim the deflected shot at
                let target = null;
                let bestDist = 99999;
                for (const en of enemies) {
                    const dx = (en.x + en.w / 2) - b.x;
                    const dy = (en.y + en.h / 2) - b.y;
                    const dd = dx * dx + dy * dy;
                    if (dd < bestDist) { bestDist = dd; target = en; }
                }
                let nvx, nvy;
                if (target) {
                    const dx = (target.x + target.w / 2) - b.x;
                    const dy = (target.y + target.h / 2) - b.y;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    nvx = (dx / len) * 14;
                    nvy = (dy / len) * 14;
                } else {
                    // No enemy — just send it back where it came from
                    nvx = -b.vx * 1.6;
                    nvy = -b.vy * 1.6;
                }
                bullets.push({
                    x: b.x, y: b.y,
                    vx: nvx, vy: nvy,
                    life: 100,
                    damage: Math.round((b.damage || 6) * 2.0),
                    color: '#ffffff', glow: '#ffff00', size: 6,
                    pierce: false, hitEnemies: new Set(),
                    explosive: false
                });
                enemyBullets.splice(i, 1);
                player.invincible = Math.max(player.invincible, 14);
                continue;
            }
            // Otherwise normal damage application (skips during i-frames)
            if (player.invincible <= 0) {
                let dmg = b.damage || 6;
                // CONVOY tier: 10% innate damage reduction
                if (player.evoLevel >= 6) dmg = Math.round(dmg * 0.9);
                player.hp -= dmg;
                hitFlash = Math.min(1, hitFlash + Math.min(0.7, dmg * 0.04));
                if (dmg >= 20) applyHitStop(3);
                player.invincible = 40;
                screenShake = b.big ? 12 : 5;
                spawnParticles(b.x, b.y, '#ff0000', b.big ? 12 : 5, b.big ? 5 : 3);
                enemyBullets.splice(i, 1);
                if (player.hp <= 0) {
                    gameState = 'dead';
                    spawnExplosion(player.x + player.w / 2, player.y + player.h / 2);
                }
            }
        }
    }
}

// =====================================================================
// TRANSFORMER ARMOR + 3D-LOOK HELPERS
// =====================================================================
// Reusable beveled metal panel. Gives a chunky 3D look in Canvas 2D using
// vertical gradients + top/bottom rim highlights — the same trick used by
// PS1-era sidescrollers to fake depth on flat sprites.
function bevelPanel(x, y, w, h, color, accent, shadowCol) {
    if (w < 1 || h < 1) return;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, accent || '#fff');
    g.addColorStop(0.45, color);
    g.addColorStop(1, shadowCol || '#000');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    // Top edge highlight (chrome lit)
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(x, y, w, 1);
    // Lit-side rim
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(x, y, 1, h);
    // Shadow-side rim
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x + w - 1, y, 1, h);
    // Bottom shadow line
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x, y + h - 1, w, 1);
}

// Chunky trapezoidal pauldron (shoulder pad). sign=-1 for left, +1 for right.
// Used by every evolution tier; size + color vary per tier.
function drawTfPauldron(cx, top, w, h, color, accent, sign) {
    ctx.save();
    // Outer trapezoid
    ctx.beginPath();
    ctx.moveTo(cx + sign * w * 0.2, top);
    ctx.lineTo(cx + sign * w * 1.0, top + h * 0.18);
    ctx.lineTo(cx + sign * w * 1.0, top + h * 0.82);
    ctx.lineTo(cx + sign * w * 0.35, top + h);
    ctx.closePath();
    const g = ctx.createLinearGradient(cx, top, cx, top + h);
    g.addColorStop(0, accent);
    g.addColorStop(0.45, color);
    g.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = g;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Chrome rim
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + sign * w * 0.2, top);
    ctx.lineTo(cx + sign * w * 1.0, top + h * 0.18);
    ctx.stroke();
    // Inner shadow seam
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.moveTo(cx + sign * w * 0.35, top + h);
    ctx.lineTo(cx + sign * w * 1.0, top + h * 0.82);
    ctx.stroke();
    // Bolt rivets (chunky Transformers look)
    ctx.fillStyle = '#222';
    ctx.fillRect(cx + sign * w * 0.55 - 1, top + h * 0.35, 2, 2);
    ctx.fillRect(cx + sign * w * 0.55 - 1, top + h * 0.65, 2, 2);
    ctx.restore();
}

// Door-wings on the back — signature Transformers detail (Bumblebee-style).
function drawTfDoorWing(px, py, w, h, color, accent, sign) {
    ctx.save();
    // Behind the body, so draw with slight transparency
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(px + sign * w * 0.1, py);
    ctx.lineTo(px + sign * w, py + h * 0.25);
    ctx.lineTo(px + sign * w, py + h * 0.9);
    ctx.lineTo(px + sign * w * 0.15, py + h);
    ctx.closePath();
    const g = ctx.createLinearGradient(px, py, px, py + h);
    g.addColorStop(0, accent);
    g.addColorStop(0.5, color);
    g.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = g;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Window outline (door window)
    ctx.fillStyle = 'rgba(120,200,255,0.35)';
    ctx.fillRect(px + sign * (w * 0.35), py + h * 0.25, sign * w * 0.5, h * 0.3);
    // Chrome edge
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
}

// Truck-cab shoulder block (Optimus Prime / CONVOY signature)
function drawTfTruckCab(cx, top, w, h, color, accent, sign) {
    ctx.save();
    // Main cab block (taller than wide, chunky)
    bevelPanel(cx + (sign < 0 ? -w : 0), top, w, h, color, accent, '#0a0a0a');
    // Windshield (slanted front pane) — drawn as a parallelogram
    ctx.beginPath();
    const wsX = cx + (sign < 0 ? -w : 0) + w * 0.15;
    ctx.moveTo(wsX, top + h * 0.18);
    ctx.lineTo(wsX + w * 0.7, top + h * 0.10);
    ctx.lineTo(wsX + w * 0.7, top + h * 0.45);
    ctx.lineTo(wsX, top + h * 0.55);
    ctx.closePath();
    const wg = ctx.createLinearGradient(0, top, 0, top + h);
    wg.addColorStop(0, '#aaddff');
    wg.addColorStop(1, '#003355');
    ctx.fillStyle = wg;
    ctx.shadowColor = '#88ccff';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Headlights (twin) — round bright dots
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffaa';
    ctx.shadowBlur = 10;
    const hlY = top + h * 0.72;
    ctx.beginPath();
    ctx.arc(cx + (sign < 0 ? -w * 0.7 : w * 0.3), hlY, 2.2, 0, Math.PI * 2);
    ctx.arc(cx + (sign < 0 ? -w * 0.3 : w * 0.7), hlY, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
}

// Layered chest plate with vehicle grille bars (Optimus chest signature)
function drawTfGrilleChest(px, py, w, h, color, accent, emblem) {
    // Outer dark frame
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(px - 1, py - 1, w + 2, h + 2);
    // Main plate (gradient)
    bevelPanel(px, py, w, h, color, accent, '#1a0a0a');
    // Horizontal grille bars
    ctx.fillStyle = '#1a1a1a';
    const barCount = 5;
    const barH = Math.max(1, Math.floor((h - 4) / (barCount * 2)));
    for (let i = 0; i < barCount; i++) {
        ctx.fillRect(px + 2, py + 3 + i * (barH * 2), w - 4, barH);
    }
    // Bright top bar (chrome trim)
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(px, py, w, 1);
    // Center emblem (Autobot-like glow)
    if (emblem) {
        const cx = px + w / 2;
        const cy = py + h / 2;
        const pulse = 0.6 + Math.sin(performance.now() * 0.008) * 0.4;
        ctx.fillStyle = emblem;
        ctx.shadowColor = emblem;
        ctx.shadowBlur = 12 * pulse;
        ctx.beginPath();
        ctx.arc(cx, cy, 3 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Full Transformers-style helmet — crest, side fins, faceplate, eyebar visor.
// Returns the visor rect { x, y, w, h } so the eye-tracking code can render
// the pupil inside it.
function drawTfHelmet(px, py, w, h, color, accent, evoLevel, facing) {
    const baseColor = color;
    const lit = accent;
    // Helmet shell — slightly trapezoid (wider at brow, narrower at jaw)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(px + 5, py + 2);                    // top-left
    ctx.lineTo(px + w - 5, py + 2);                // top-right
    ctx.lineTo(px + w - 3, py + h * 0.55);         // mid-right
    ctx.lineTo(px + w - 5, py + h * 0.92);         // jaw-right
    ctx.lineTo(px + 5, py + h * 0.92);             // jaw-left
    ctx.lineTo(px + 3, py + h * 0.55);             // mid-left
    ctx.closePath();
    const hg = ctx.createLinearGradient(0, py, 0, py + h);
    hg.addColorStop(0, lit);
    hg.addColorStop(0.45, baseColor);
    hg.addColorStop(1, '#0a1a2a');
    ctx.fillStyle = hg;
    ctx.shadowColor = lit;
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Chrome top highlight (curving over the brow)
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px + 6, py + 3);
    ctx.lineTo(px + w - 6, py + 3);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.restore();

    // === HELMET CREST (vertical horn / antenna) ===
    if (evoLevel >= 1) {
        const crestColor = (EVO_COLORS[evoLevel] && EVO_COLORS[evoLevel].armor) || lit;
        const crestGlow = (EVO_COLORS[evoLevel] && EVO_COLORS[evoLevel].glow) || lit;
        ctx.fillStyle = crestColor;
        ctx.shadowColor = crestGlow;
        ctx.shadowBlur = 8;
        // Center crest spine
        ctx.beginPath();
        ctx.moveTo(px + w / 2 - 2, py + 2);
        ctx.lineTo(px + w / 2 + 2, py + 2);
        ctx.lineTo(px + w / 2 + 1, py - (evoLevel >= 4 ? 8 : 5));
        ctx.lineTo(px + w / 2 - 1, py - (evoLevel >= 4 ? 8 : 5));
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // === SIDE-MOUNTED ANTENNA HORNS (Optimus / Convoy classic) ===
    if (evoLevel >= 5) {
        const cCol = EVO_COLORS[evoLevel];
        ctx.fillStyle = cCol.armor;
        ctx.shadowColor = cCol.glow;
        ctx.shadowBlur = 10;
        for (const sign of [-1, 1]) {
            // Horn base
            ctx.fillRect(px + w / 2 - 1 + sign * (w / 2 - 2), py + 2, 2, 3);
            // Horn point (slanted outward)
            ctx.beginPath();
            ctx.moveTo(px + w / 2 + sign * (w / 2 - 2), py + 2);
            ctx.lineTo(px + w / 2 + sign * (w / 2 + 4), py - 6);
            ctx.lineTo(px + w / 2 + sign * (w / 2 - 1), py + 2);
            ctx.closePath();
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    // === SIDE FINS (small ear-style fins on basic tiers) ===
    if (evoLevel >= 1 && evoLevel < 5) {
        const cCol = EVO_COLORS[evoLevel];
        ctx.fillStyle = cCol.armor;
        ctx.shadowColor = cCol.glow;
        ctx.shadowBlur = 6;
        ctx.fillRect(px + 2, py + h * 0.35, 2, 5);
        ctx.fillRect(px + w - 4, py + h * 0.35, 2, 5);
        ctx.shadowBlur = 0;
    }

    // === FACEPLATE / JAW PIECE === (mouth guard, classic G1 look)
    // Lower half of the helmet has a mask-like overlay, divided by a vertical seam.
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(px + 5, py + h * 0.55, w - 10, h * 0.32);
    // Vertical seam (chin split)
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(px + w / 2 - 0.5, py + h * 0.55, 1, h * 0.32);
    // Faceplate chrome edge
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(px + 5, py + h * 0.55, w - 10, 1);

    // === VISOR HOUSING (eyebar) ===
    // The pupil-tracking code in drawPlayer will render the eye inside this rect.
    const visorX = px + 5;
    const visorY = py + h * 0.32;
    const visorW = w - 10;
    const visorH = Math.max(4, h * 0.16);
    // Dark recessed background
    ctx.fillStyle = '#000';
    ctx.fillRect(visorX - 1, visorY - 1, visorW + 2, visorH + 2);
    // Glowing eyebar fill
    const eg = ctx.createLinearGradient(0, visorY, 0, visorY + visorH);
    eg.addColorStop(0, '#ddffff');
    eg.addColorStop(1, '#0088aa');
    ctx.fillStyle = eg;
    ctx.shadowColor = '#88ffff';
    ctx.shadowBlur = 8;
    ctx.fillRect(visorX, visorY, visorW, visorH);
    ctx.shadowBlur = 0;
    // Top chrome bar over visor (brow)
    ctx.fillStyle = lit;
    ctx.fillRect(visorX - 1, visorY - 2, visorW + 2, 1);

    return { x: visorX, y: visorY, w: visorW, h: visorH };
}

// Tier-specific extras: smokestacks for prior tiers (kept for reference).
// CONVOY no longer uses backpack add-ons — its silhouette stays clean.
function drawTfBackPack(px, py, w, h, evoLevel, color, accent) {
    // Intentional no-op. Previous CONVOY smokestacks were "truck-in-a-robot"
    // kibble; the user wants Prime-clean silhouette instead.
}

// CONVOY-only: signature Optimus-Prime helmet that REPLACES the standard
// helmet. Has horns/antennae sticking up, a chiseled mouth-guard with three
// vertical slits, and a wide visor. Drawn at a custom position (taller than
// the body bounds) so CONVOY actually looks like he towers over PRIME.
function drawConvoyHelmet(px, py, w, facing) {
    ctx.save();
    const helmetH = 22;        // taller than the standard helmet
    const helmetTop = py - 6;  // sits above the body
    const helmetW = w + 4;
    const hx = px - 2;

    // Shell — Optimus blue with a slight cyan top highlight
    const hg = ctx.createLinearGradient(0, helmetTop, 0, helmetTop + helmetH);
    hg.addColorStop(0, '#5599ff');
    hg.addColorStop(0.5, '#1a4488');
    hg.addColorStop(1, '#08183a');
    ctx.beginPath();
    ctx.moveTo(hx + 4, helmetTop + 4);
    ctx.lineTo(hx + helmetW - 4, helmetTop + 4);
    ctx.lineTo(hx + helmetW - 2, helmetTop + helmetH * 0.5);
    ctx.lineTo(hx + helmetW - 4, helmetTop + helmetH * 0.95);
    ctx.lineTo(hx + 4, helmetTop + helmetH * 0.95);
    ctx.lineTo(hx + 2, helmetTop + helmetH * 0.5);
    ctx.closePath();
    ctx.fillStyle = hg;
    ctx.shadowColor = '#88aaff';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Center crest ridge running top-to-mid (Prime's signature line)
    ctx.fillStyle = '#aaccff';
    ctx.fillRect(hx + helmetW / 2 - 1, helmetTop + 4, 2, helmetH * 0.4);

    // === ANTENNAE / HORNS (Optimus signature, taller and more prominent) ===
    ctx.fillStyle = '#cce4ff';
    ctx.shadowColor = '#88aaff';
    ctx.shadowBlur = 8;
    for (const sign of [-1, 1]) {
        // Base mount
        ctx.fillRect(hx + helmetW / 2 - 1 + sign * 6, helmetTop + 2, 2, 4);
        // Triangular horn rising up and slightly outward
        ctx.beginPath();
        ctx.moveTo(hx + helmetW / 2 + sign * 6, helmetTop + 2);
        ctx.lineTo(hx + helmetW / 2 + sign * 9, helmetTop - 10);
        ctx.lineTo(hx + helmetW / 2 + sign * 5, helmetTop + 2);
        ctx.closePath();
        ctx.fill();
    }
    ctx.shadowBlur = 0;

    // === EYE BAR (visor) — wider, brighter than standard helmets ===
    const visorY = helmetTop + helmetH * 0.32;
    const visorH = 5;
    const visorX = hx + 5;
    const visorW = helmetW - 10;
    // Recessed dark backing
    ctx.fillStyle = '#000';
    ctx.fillRect(visorX - 1, visorY - 1, visorW + 2, visorH + 2);
    // Glowing eyebar
    const eg = ctx.createLinearGradient(0, visorY, 0, visorY + visorH);
    eg.addColorStop(0, '#ddffff');
    eg.addColorStop(1, '#0066bb');
    ctx.fillStyle = eg;
    ctx.shadowColor = '#88ccff';
    ctx.shadowBlur = 12;
    ctx.fillRect(visorX, visorY, visorW, visorH);
    ctx.shadowBlur = 0;
    // Brow — chrome bar that overhangs the visor
    ctx.fillStyle = '#aaccff';
    ctx.fillRect(visorX - 1, visorY - 2, visorW + 2, 1);

    // === CHROME FACEPLATE (Optimus G1/movie style — smooth, no slits) ===
    // Single clean metallic plate covering the lower half of the face.
    // No mouth slits, no ridges — just a polished surface like the movies.
    const fpY = visorY + visorH + 3;
    const fpH = 8;
    // Outer shadow frame
    ctx.fillStyle = '#0a1828';
    ctx.fillRect(visorX - 1, fpY, visorW + 2, fpH);
    // Faceplate chrome gradient
    const fpg = ctx.createLinearGradient(0, fpY, 0, fpY + fpH);
    fpg.addColorStop(0, '#aaccff');
    fpg.addColorStop(0.45, '#5577aa');
    fpg.addColorStop(1, '#1a2a44');
    ctx.fillStyle = fpg;
    ctx.fillRect(visorX, fpY, visorW, fpH);
    // Top chrome highlight
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(visorX, fpY, visorW, 1);
    // Subtle center seam — single hairline only (NOT 3 slits)
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(visorX + visorW / 2 - 0.5, fpY + 2, 1, fpH - 4);
    // Side cheek-plates (clean blue side panels)
    ctx.fillStyle = '#3a5a99';
    ctx.fillRect(hx, fpY - 2, 4, fpH + 4);
    ctx.fillRect(hx + helmetW - 4, fpY - 2, 4, fpH + 4);

    ctx.restore();
    return { x: visorX, y: visorY, w: visorW, h: visorH };
}

// Top-level: replaces the old flat armor stack with chunky Transformers gear.
function drawTransformerArmor(px, py, evoCol, evoLevel) {
    if (!evoCol) return;
    const w = player.w;
    const h = player.h;
    const cx = px + w / 2;
    const armor = evoCol.armor;
    const glow = evoCol.glow;
    const facing = player.facing || 1;

    // === DOOR-WINGS ON BACK (drawn first so they sit behind body) ===
    // CONVOY skips door wings — silhouette stays Prime-clean.
    if (evoLevel >= 1 && evoLevel < 6) {
        const wingW = 6 + evoLevel;
        const wingH = h * 0.55;
        const sign = facing > 0 ? -1 : 1;     // wings on the back side
        drawTfDoorWing(cx, py + 6, wingW, wingH, armor, glow, sign);
    }

    // === EXTENDED JET WINGS (OMEGA+, but NOT CONVOY) ===
    if (evoLevel >= 3 && evoLevel < 6) {
        ctx.save();
        for (const sign of [-1, 1]) {
            const wingX = cx + sign * (w / 2 + 2);
            const wingY = py + 8;
            ctx.beginPath();
            ctx.moveTo(wingX, wingY);
            ctx.lineTo(wingX + sign * 14, wingY - 4);
            ctx.lineTo(wingX + sign * 18, wingY + 14);
            ctx.lineTo(wingX, wingY + 22);
            ctx.closePath();
            const g = ctx.createLinearGradient(0, wingY, 0, wingY + 22);
            g.addColorStop(0, glow);
            g.addColorStop(1, armor);
            ctx.fillStyle = g;
            ctx.shadowColor = glow;
            ctx.shadowBlur = 12;
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // === PAULDRONS (chunky shoulder pads) — main Transformers signature ===
    // CONVOY gets its own clean red Optimus-style pauldrons drawn below.
    if (evoLevel < 6) {
        const paulW = 6 + evoLevel * 1.2;
        const paulH = 12 + evoLevel * 1.5;
        const paulTop = py + 8;
        drawTfPauldron(px + 2, paulTop, paulW, paulH, armor, glow, -1);
        drawTfPauldron(px + w - 2, paulTop, paulW, paulH, armor, glow, +1);
    } else {
        // CONVOY pauldrons: clean red trapezoids, no rivets, no grunge.
        // These are the Optimus shoulder kibble done minimally.
        const paulW = 8;
        const paulH = 18;
        const paulTop = py + 10;
        for (const sign of [-1, 1]) {
            ctx.save();
            const baseX = sign < 0 ? px + 2 : px + w - 2;
            ctx.beginPath();
            ctx.moveTo(baseX + sign * 1, paulTop);
            ctx.lineTo(baseX + sign * paulW, paulTop + 3);
            ctx.lineTo(baseX + sign * paulW, paulTop + paulH - 4);
            ctx.lineTo(baseX + sign * 2, paulTop + paulH);
            ctx.closePath();
            // Red gradient
            const g = ctx.createLinearGradient(0, paulTop, 0, paulTop + paulH);
            g.addColorStop(0, '#ff5544');
            g.addColorStop(0.5, '#aa1818');
            g.addColorStop(1, '#330808');
            ctx.fillStyle = g;
            ctx.shadowColor = '#ff8866';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
            // Top chrome highlight
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(baseX + sign * 1, paulTop);
            ctx.lineTo(baseX + sign * paulW, paulTop + 3);
            ctx.stroke();
            ctx.restore();
        }
    }

    // === TRUCK-CAB SHOULDER BLOCKS (PRIME only — CONVOY drops the kibble) ===
    if (evoLevel === 5) {
        // PRIME — moderate truck-cab shoulders
        const cabW = 9;
        const cabH = 16;
        const cabTop = py + 8;
        drawTfTruckCab(px - 2, cabTop - 4, cabW, cabH, armor, glow, -1);
        drawTfTruckCab(px + w + 2, cabTop - 4, cabW, cabH, armor, glow, +1);
    }

    // === CHEST PLATE (vehicle grille style) ===
    if (evoLevel >= 6) {
        // CONVOY — clean Optimus Prime chest plate. Blue main body with a
        // central red windowed panel and a single chrome Autobot emblem.
        // Stays inside the body width — no truck-hood kibble extending past
        // the silhouette.
        const chestX = px + 4;
        const chestY = py + 17;
        const chestW = w - 8;
        const chestH = h * 0.42;
        // Outer dark frame
        ctx.fillStyle = '#08101e';
        ctx.fillRect(chestX - 1, chestY - 1, chestW + 2, chestH + 2);
        // Main BLUE chest plate
        const cg = ctx.createLinearGradient(0, chestY, 0, chestY + chestH);
        cg.addColorStop(0, '#5599ff');
        cg.addColorStop(0.5, '#1a4488');
        cg.addColorStop(1, '#08183a');
        ctx.fillStyle = cg;
        ctx.fillRect(chestX, chestY, chestW, chestH);
        // Top chrome highlight
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(chestX, chestY, chestW, 1);
        // Center RED windowed panel — single clean rectangle, no grille bars
        const panelX = chestX + chestW * 0.22;
        const panelY = chestY + chestH * 0.18;
        const panelW = chestW * 0.56;
        const panelH = chestH * 0.55;
        // Panel dark frame
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(panelX - 1, panelY - 1, panelW + 2, panelH + 2);
        // Red gradient
        const rg = ctx.createLinearGradient(0, panelY, 0, panelY + panelH);
        rg.addColorStop(0, '#ff5544');
        rg.addColorStop(0.5, '#aa1818');
        rg.addColorStop(1, '#330808');
        ctx.fillStyle = rg;
        ctx.fillRect(panelX, panelY, panelW, panelH);
        // Single chrome window pane on top of the red — like Prime's chest
        ctx.fillStyle = 'rgba(180, 220, 255, 0.55)';
        ctx.fillRect(panelX + 2, panelY + 2, panelW - 4, panelH * 0.45);
        // Window highlight bar
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(panelX + 2, panelY + 2, panelW - 4, 1);
        // Autobot emblem — single chrome dot pulse, clean and centered
        const emblemPulse = 0.6 + Math.sin(performance.now() * 0.008) * 0.4;
        const emblemY = chestY + chestH * 0.78;
        ctx.fillStyle = '#ffd744';
        ctx.shadowColor = '#ffaa44';
        ctx.shadowBlur = 14 * emblemPulse;
        ctx.beginPath();
        ctx.arc(chestX + chestW / 2, emblemY, 3.5 + emblemPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(chestX + chestW / 2, emblemY, 1.5, 0, Math.PI * 2);
        ctx.fill();
    } else if (evoLevel >= 5) {
        // PRIME — standard grille chest with Autobot emblem
        const chestX = px + 5;
        const chestY = py + 16;
        const chestW = w - 10;
        const chestH = h * 0.4;
        drawTfGrilleChest(chestX, chestY, chestW, chestH, armor, glow, '#ffd744');
    } else if (evoLevel >= 1) {
        const chestX = px + 5;
        const chestY = py + 16;
        const chestW = w - 10;
        const chestH = h * 0.4;
        // Lower tiers — simpler beveled plate with center accent stripe
        bevelPanel(chestX, chestY, chestW, chestH, armor, glow, '#0a0a0a');
        // Vertical accent stripe
        ctx.fillStyle = glow;
        ctx.shadowColor = glow;
        ctx.shadowBlur = 8;
        ctx.fillRect(cx - 1, chestY + 2, 2, chestH - 4);
        ctx.shadowBlur = 0;
        // Headlights twin (bolt rivets style — smaller)
        if (evoLevel >= 2) {
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#ffffaa';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(chestX + 4, chestY + chestH - 4, 1.6, 0, Math.PI * 2);
            ctx.arc(chestX + chestW - 4, chestY + chestH - 4, 1.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        // Emblem (small chest dot for MK-II+)
        if (evoLevel >= 1) {
            const pulse = 0.7 + Math.sin(performance.now() * 0.01) * 0.3;
            ctx.fillStyle = '#fff';
            ctx.shadowColor = glow;
            ctx.shadowBlur = 10 * pulse;
            ctx.beginPath();
            ctx.arc(cx, chestY + chestH * 0.4, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    // === ABDOMINAL / BELT PLATE ===
    if (evoLevel >= 1) {
        bevelPanel(px + 4, py + h - 16, w - 8, 4, armor, glow, '#0a0a0a');
    }

    // === LEG GREAVES (tank-tread plating) — MK-III through PRIME, NOT CONVOY ===
    if (evoLevel >= 2 && evoLevel < 6) {
        const treadY = py + h - 14;
        // Main dark tread band
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(px + 4, treadY, w - 8, 6);
        // Tread segments (alternating bumps)
        ctx.fillStyle = '#444';
        for (let tx = 6; tx < w - 6; tx += 4) {
            ctx.fillRect(px + tx, treadY + 1, 2, 4);
        }
        // Top chrome rim of tread
        ctx.fillStyle = '#888';
        ctx.fillRect(px + 4, treadY, w - 8, 1);
        // Glowing seam under tread
        ctx.fillStyle = glow;
        ctx.shadowColor = glow;
        ctx.shadowBlur = 8;
        ctx.fillRect(px + 4, treadY + 6, w - 8, 1);
        ctx.shadowBlur = 0;
    }

    // === CONVOY-specific: clean blue boots (no treads, no tires) ===
    if (evoLevel >= 6) {
        // Single solid blue greave band — clean Optimus boot look
        const bootY = py + h - 12;
        const bg = ctx.createLinearGradient(0, bootY, 0, bootY + 10);
        bg.addColorStop(0, '#5599ff');
        bg.addColorStop(0.5, '#1a4488');
        bg.addColorStop(1, '#08183a');
        ctx.fillStyle = bg;
        ctx.fillRect(px + 3, bootY, w - 6, 10);
        // Top chrome rim
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(px + 3, bootY, w - 6, 1);
        // Center red accent stripe (signature Optimus boot detail)
        ctx.fillStyle = '#aa1818';
        ctx.fillRect(px + 3, bootY + 4, w - 6, 2);
    }

    // === TIRE KNEECAPS (CONVOY signature — DISABLED, too kibbley) ===
    // (Kept disabled. The clean blue boots above replace this look.)

    // === FOREARM GAUNTLETS (extended arms get plated cuffs) — NOT CONVOY ===
    // CONVOY's forearms are taken up by the axe and ion blaster, so we skip
    // the generic gauntlet cuffs to keep the silhouette clean.
    if (evoLevel >= 3 && evoLevel < 6) {
        for (const sign of [-1, 1]) {
            const cuffX = cx + sign * (w / 2 - 2);
            const cuffY = py + 22;
            bevelPanel(cuffX - 2, cuffY, 4, 8, armor, glow, '#0a0a0a');
        }
    }

    // === HALO (OMEGA/APEX/PRIME, but NOT CONVOY) ===
    // CONVOY drops the rotating halo — Prime's "leadership" presence comes
    // from the chest plate + Matrix core, not from a flashy floating ring.
    if (evoLevel >= 3 && evoLevel < 6) {
        const haloT = performance.now() * 0.005;
        ctx.strokeStyle = armor;
        ctx.shadowColor = glow;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, py - 8, 12 + evoLevel, 4, Math.sin(haloT) * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1;
        // Aura ring around player
        ctx.strokeStyle = `rgba(255, 255, 0, ${0.25 + Math.sin(haloT * 3) * 0.15})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, py + h / 2, 50 + Math.sin(haloT * 2) * 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
    }

    // === APEX HALO BLADE RIG (4-point orbital, APEX only) ===
    if (evoLevel === 4) {
        const t = performance.now() * 0.004;
        for (let r = 0; r < 4; r++) {
            const ang = t + r * Math.PI / 2;
            const ox = cx + Math.cos(ang) * 22;
            const oy = py + h / 2 + Math.sin(ang) * 8;
            ctx.fillStyle = armor;
            ctx.shadowColor = glow;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    // === PRIME-only: glowing chest reactor + sword hilts ===
    // CONVOY skips this — its Matrix core + dual weapons are drawn separately.
    if (evoLevel === 5) {
        const pulse = 0.6 + Math.sin(performance.now() * 0.008) * 0.4;
        ctx.fillStyle = '#ff3344';
        ctx.shadowColor = '#ff8866';
        ctx.shadowBlur = 18 * pulse;
        ctx.beginPath();
        ctx.arc(cx, py + 28, 5 + pulse * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Twin sword hilts on the back
        for (const sign of [-1, 1]) {
            const hiltX = cx + sign * (w / 2 - 2);
            ctx.fillStyle = '#ff8866';
            ctx.shadowColor = '#ff3344';
            ctx.shadowBlur = 10;
            ctx.fillRect(hiltX - 1, py - 4, 3, 12);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffd744';
            ctx.fillRect(hiltX - 2, py - 4, 5, 2);
        }
    }

    // === CONVOY: Energon Axe + Ion Blaster (always visible silhouette) ===
    if (evoLevel >= 6) {
        // The two signature weapons sit on the player's forearms at all times
        // so they're recognizable in any pose:
        //   - Energon AXE on the BACK forearm (rear-side hand)
        //   - Ion BLASTER cannon on the FRONT forearm (the side facing where
        //     the player is aiming)
        const frontSign = facing > 0 ? 1 : -1;
        const backSign  = -frontSign;

        // ----- ENERGON AXE (back forearm) ------------------------------------
        // Big crackling cyan blade attached to a chunky red+gold hilt. Mounted
        // on the BACK forearm so it doesn't conflict with the ion blaster.
        const axeAnchorX = cx + backSign * (w / 2);
        const axeAnchorY = py + 26;
        // Hilt
        ctx.fillStyle = '#aa1818';
        ctx.fillRect(axeAnchorX - 2, axeAnchorY, 4, 8);
        ctx.fillStyle = '#ffd744';
        ctx.fillRect(axeAnchorX - 2, axeAnchorY, 4, 2);   // gold pommel band
        // Axe blade — large wedge with bright energon glow
        ctx.fillStyle = '#aaffff';
        ctx.shadowColor = '#88ddff';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(axeAnchorX + backSign * 2, axeAnchorY - 6);
        ctx.lineTo(axeAnchorX + backSign * 16, axeAnchorY - 2);
        ctx.lineTo(axeAnchorX + backSign * 16, axeAnchorY + 8);
        ctx.lineTo(axeAnchorX + backSign * 2, axeAnchorY + 12);
        ctx.closePath();
        ctx.fill();
        // Inner brighter core of the blade
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(axeAnchorX + backSign * 4, axeAnchorY - 2);
        ctx.lineTo(axeAnchorX + backSign * 12, axeAnchorY + 0);
        ctx.lineTo(axeAnchorX + backSign * 12, axeAnchorY + 6);
        ctx.lineTo(axeAnchorX + backSign * 4, axeAnchorY + 8);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // ----- ION BLASTER (front forearm) -----------------------------------
        // Forearm-mounted cannon barrel. Long chrome barrel with a glowing
        // energon core stripe down the middle. Charges visibly when shot.
        const blasterAnchorX = cx + frontSign * (w / 2);
        const blasterAnchorY = py + 28;
        const barrelLen = 18;
        // Forearm cuff (where the blaster mounts)
        ctx.fillStyle = '#1a3a66';
        ctx.fillRect(blasterAnchorX - 2, blasterAnchorY - 4, 4, 10);
        ctx.fillStyle = '#88aaff';
        ctx.fillRect(blasterAnchorX - 2, blasterAnchorY - 4, 4, 1);   // chrome highlight
        // Main barrel — dark housing
        ctx.fillStyle = '#222';
        ctx.fillRect(blasterAnchorX, blasterAnchorY - 3, frontSign * barrelLen, 6);
        // Chrome top edge
        ctx.fillStyle = '#888';
        ctx.fillRect(blasterAnchorX, blasterAnchorY - 3, frontSign * barrelLen, 1);
        // Glowing energon core stripe
        ctx.fillStyle = '#88ddff';
        ctx.shadowColor = '#aaffff';
        ctx.shadowBlur = 10;
        ctx.fillRect(blasterAnchorX, blasterAnchorY - 1, frontSign * barrelLen, 2);
        // Muzzle ring (gold tip)
        ctx.fillStyle = '#ffd744';
        ctx.shadowColor = '#ffaa44';
        ctx.shadowBlur = 8;
        ctx.fillRect(blasterAnchorX + frontSign * (barrelLen - 1), blasterAnchorY - 4, frontSign * 2, 8);
        ctx.shadowBlur = 0;

        // ----- MATRIX OF LEADERSHIP (chest core) -----------------------------
        // Single small bright dot on the chest. Powers the axe + blaster.
        // No halo, no aura — keeps the silhouette clean.
        const matrixPulse = 0.7 + Math.sin(performance.now() * 0.006) * 0.3;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#88ddff';
        ctx.shadowBlur = 14 * matrixPulse;
        ctx.beginPath();
        ctx.arc(cx, py + 22, 2.5 + matrixPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // === SMOKESTACKS (CONVOY) ===
    drawTfBackPack(px, py, w, h, evoLevel, armor, glow);
}

// Drawing functions
function drawPlayer() {
    ctx.save();
    const px = player.x - camera.x;
    const py = player.y - camera.y;

    // === HEIGHT-AWARE DROP SHADOW (3D feel) ===
    // Shadow is always projected on the nearest ground beneath the player,
    // not just when onGround. Distance-from-ground scales the shadow size
    // (smaller + softer when high in the air, big and dark when on ground).
    // This is the single biggest cue that sells "I'm a 3D object in a world".
    {
        // Find the closest ground/platform top BELOW the player.
        let groundY = null;
        const cx = player.x + player.w / 2;
        for (const p of platforms) {
            if (p.type === 'spike' || p.type === 'laser' || p.type === 'recovery' || p.type === 'lava') continue;
            if (cx >= p.x && cx <= p.x + p.w && p.y >= player.y + player.h - 4) {
                if (groundY === null || p.y < groundY) groundY = p.y;
            }
        }
        if (groundY !== null) {
            const dist = Math.max(0, groundY - (player.y + player.h));
            const t = Math.min(1, dist / 220);    // 0 = on ground, 1 = high in air
            const shadowAlpha = 0.45 * (1 - t * 0.85);
            const shadowW = (player.w / 2) * (1 - t * 0.5);
            const shadowH = 4 * (1 - t * 0.6);
            ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
            ctx.beginPath();
            ctx.ellipse(cx - camera.x, groundY - camera.y - 1, shadowW, shadowH, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Flicker when invincible
    if (player.invincible > 0 && Math.floor(player.invincible / 3) % 2 === 0) {
        ctx.globalAlpha = 0.4;
    }

    // Perfect dodge glow
    if (player.perfectDodgeTimer > 0) {
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 20;
    }

    // === VEHICLE / TRANSFORM RENDER ===
    // Draws the vehicle form (or the mid-transform fold animation). Returns
    // early so we don't render the robot on top.
    if (player.transformed || player.transformAnim > 0) {
        drawVehiclePlayer(px, py);
        ctx.restore();
        return;
    }

    // === DODGE ROLL — render as a spinning sphere/ball with motion lines ===
    if (player.rolling) {
        ctx.save();
        // Spinning body
        const angle = player.rollAnim * Math.PI * 2;
        ctx.translate(px + player.w / 2, py + player.h / 2);
        ctx.rotate(player.rollDir * angle);
        ctx.fillStyle = player.charColor || '#00ddff';
        ctx.shadowColor = player.charAccent || '#00ffaa';
        ctx.shadowBlur = 16;
        // Crouched ball — squashed circle
        ctx.beginPath();
        ctx.ellipse(0, 0, player.w * 0.55, player.h * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        // Tuck markers (4 cross dots showing rotation)
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        for (let i = 0; i < 4; i++) {
            const a = i * (Math.PI / 2);
            ctx.fillRect(Math.cos(a) * 8 - 1.5, Math.sin(a) * 8 - 1.5, 3, 3);
        }
        ctx.restore();
        // Speed lines behind
        ctx.fillStyle = `rgba(170, 220, 255, 0.5)`;
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(px - player.rollDir * (12 + i * 6), py + player.h / 2 - 1, 8, 2);
        }
        ctx.restore();   // matches the drawPlayer top-level save
        return;
    }

    // === PARRY — silver flash around the player + raised guard pose ===
    if (player.parrying) {
        // Bright silver shield arc in front of the player
        ctx.save();
        const armX = px + player.w / 2 + player.facing * 14;
        const armY = py + player.h / 2;
        const flash = Math.sin(performance.now() * 0.04) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.55 * flash})`;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(armX, armY, 18, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        // Outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    // === PARRY SUCCESS — short-lived golden burst ring ===
    if (player.parrySuccess > 0) {
        const t = player.parrySuccess / 30;
        ctx.save();
        ctx.globalAlpha = t;
        ctx.strokeStyle = '#ffff66';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px + player.w / 2, py + player.h / 2, 14 + (1 - t) * 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // === GROUND POUND — spinning diving pose with vertical streak ===
    if (player.pounding) {
        // Vertical streak above the player
        const streakG = ctx.createLinearGradient(0, py - 80, 0, py + player.h);
        streakG.addColorStop(0, 'rgba(255, 170, 80, 0)');
        streakG.addColorStop(1, 'rgba(255, 170, 80, 0.7)');
        ctx.fillStyle = streakG;
        ctx.fillRect(px + player.w / 2 - 3, py - 80, 6, 80 + player.h);
        // Spinning effect
        ctx.save();
        ctx.translate(px + player.w / 2, py + player.h / 2);
        ctx.rotate((performance.now() * 0.03) % (Math.PI * 2));
        ctx.fillStyle = player.charColor || '#00ddff';
        ctx.shadowColor = '#ffaa44';
        ctx.shadowBlur = 18;
        ctx.fillRect(-player.w / 2, -player.h / 2, player.w, player.h);
        // Glow indicator at bottom
        ctx.fillStyle = '#ffaa44';
        ctx.fillRect(-6, player.h / 2 - 4, 12, 6);
        ctx.restore();
        ctx.restore();   // closes drawPlayer top-level save
        return;
    }

    // Body
    ctx.fillStyle = player.dashing ? (player.charAccent || '#00ffaa') : (player.charColor || '#00ddff');
    ctx.shadowColor = player.dashing ? (player.charAccent || '#00ffaa') : (player.charColor || '#00ddff');
    ctx.shadowBlur = 10;

    if (player.sliding) {
        ctx.fillRect(px, py, player.w + 8, player.h);
    } else {
        // Torso — a dark armored undercoat. Detail is provided by the
        // Transformers armor stack drawn on top; this just gives the gaps
        // (neck, sides, back) a believable metal underbody so the suit
        // doesn't read as floating plates over a glowing slab.
        const baseColor = player.charColor || '#00ddff';
        const accentColor = player.charAccent || '#00ffaa';
        const evoCol = EVO_COLORS[player.evoLevel];
        // Higher evos get a darker, more "frame-y" undercoat so the colored
        // armor pops cleanly. BASE keeps the original character color.
        const torsoTop = player.evoLevel >= 1 ? '#1a2030' : baseColor;
        const torsoMid = player.evoLevel >= 1 ? '#0e1420' : baseColor;
        const torsoBot = player.evoLevel >= 1 ? '#06080c' : '#0a3a4a';
        const tg = ctx.createLinearGradient(px, py, px, py + player.h);
        tg.addColorStop(0, torsoTop);
        tg.addColorStop(0.5, torsoMid);
        tg.addColorStop(1, torsoBot);
        ctx.fillStyle = tg;
        ctx.fillRect(px + 4, py + 10, player.w - 8, player.h - 14);
        // Subtle highlight on lit side
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fillRect(px + 4, py + 10, 2, player.h - 14);
        // Shadow seam on right side
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(px + player.w - 6, py + 10, 2, player.h - 14);

        // === TRANSFORMERS ARMOR STACK ===
        // Drawn before the helmet so the helmet sits on top. The helper
        // builds chunky pauldrons, a vehicle-grille chest, door-wings,
        // tank treads, jet wings, halo, sword hilts, smokestacks, etc.
        // depending on evoLevel.
        if (evoCol) {
            drawTransformerArmor(px, py, evoCol, player.evoLevel);
        }

        // === HEAD (Transformers helmet — crest + side fins + faceplate + eyebar visor) ===
        // The helmet is taller and more chiseled than the old flat rectangle.
        // It also returns the visor rect so the eye-tracking code can render
        // the pupil inside the eyebar. CONVOY uses a unique Optimus-style
        // helmet with horns + 3-slit mouth guard for proper distinction.
        const helmetH = 16;
        let helmetVisor;
        if (player.evoLevel >= 6) {
            helmetVisor = drawConvoyHelmet(px, py, player.w, player.facing);
        } else {
            helmetVisor = drawTfHelmet(
                px + 4,
                py - 2,
                player.w - 8,
                helmetH,
                baseColor,
                accentColor,
                player.evoLevel,
                player.facing
            );
        }
        // Eye-tracking code below uses these names — keep them in sync.
        const visorX = helmetVisor.x;
        const visorY = helmetVisor.y;
        const visorW = helmetVisor.w;
        const visorH = helmetVisor.h;
        // ANIMATED EYE — pupil tracks mouse / aim direction within the visor.
        // The pupil is a small bright square that smoothly slides toward the
        // direction the player is looking. Blinks occasionally for personality.
        const eyeCenterX = visorX + visorW / 2;
        const eyeCenterY = visorY + visorH / 2;
        // Aim vector — toward mouse cursor (in world coords), but with screen offset.
        const mWorldX = (mouse && typeof mouse.x === 'number') ? mouse.x : (player.x + player.facing * 200);
        const mWorldY = (mouse && typeof mouse.y === 'number') ? mouse.y : (player.y + player.h / 2);
        const lookDx = mWorldX - (player.x + player.w / 2);
        const lookDy = mWorldY - (player.y + player.h / 2);
        const lookLen = Math.max(1, Math.sqrt(lookDx * lookDx + lookDy * lookDy));
        // Limit pupil offset so it stays inside the visor frame
        const pupilOX = (lookDx / lookLen) * (visorW / 4);
        const pupilOY = (lookDy / lookLen) * (visorH / 4);
        // Smoothly track previous frame
        if (player.eyeOX === undefined) { player.eyeOX = pupilOX; player.eyeOY = pupilOY; }
        player.eyeOX += (pupilOX - player.eyeOX) * 0.4;
        player.eyeOY += (pupilOY - player.eyeOY) * 0.4;
        // Blink timing
        if (player.blinkTimer === undefined) player.blinkTimer = 200;
        player.blinkTimer--;
        if (player.blinkTimer < -6) player.blinkTimer = 180 + Math.floor(Math.random() * 200);
        const isBlinking = player.blinkTimer < 0;
        if (!isBlinking) {
            // Twin pupil dots (Transformers eyes are usually two small bright dots inside the eyebar)
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#88ffff';
            ctx.shadowBlur = 10;
            ctx.fillRect(eyeCenterX - 3 + player.eyeOX, eyeCenterY - 1 + player.eyeOY, 2, 2);
            ctx.fillRect(eyeCenterX + 1 + player.eyeOX, eyeCenterY - 1 + player.eyeOY, 2, 2);
            // Bright pupil core (when angry / dashing / damaged the eye flares red)
            const angry = player.invincible > 0 || player.dashing || (hitFlash > 0.05);
            ctx.fillStyle = angry ? '#ff3344' : '#ffffff';
            ctx.shadowColor = angry ? '#ff0044' : '#ffffff';
            ctx.fillRect(eyeCenterX - 0.5 + player.eyeOX, eyeCenterY - 0.5 + player.eyeOY, 1, 1);
            ctx.shadowBlur = 0;
        } else {
            // Blink — draw a thin dark line instead of pupil
            ctx.fillStyle = '#001a2a';
            ctx.fillRect(visorX + 1, eyeCenterY, visorW - 2, 1);
        }

        // === ANIMATED LEGS (walk cycle) ===
        // Phase advances when moving on ground; freezes mid-air to a tucked pose.
        if (player.legPhase === undefined) player.legPhase = 0;
        const moveSpeed = Math.abs(player.vx);
        if (player.onGround && moveSpeed > 0.4) {
            player.legPhase += moveSpeed * 0.18;
        }
        const legSwing = player.onGround ? Math.sin(player.legPhase) * 4 : -2;
        const legSwingB = player.onGround ? -Math.sin(player.legPhase) * 4 : 2;
        const lg = ctx.createLinearGradient(0, py + player.h - 8, 0, py + player.h);
        lg.addColorStop(0, '#005577');
        lg.addColorStop(1, '#003344');
        ctx.fillStyle = lg;
        // Front leg (slightly forward in facing direction)
        ctx.fillRect(px + 6, py + player.h - 8 + legSwing, 7, 8 - legSwing);
        // Back leg
        ctx.fillRect(px + player.w - 13, py + player.h - 8 + legSwingB, 7, 8 - legSwingB);
        // Knee highlights for some 3D feel
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(px + 6, py + player.h - 8 + legSwing, 2, 2);
        ctx.fillRect(px + player.w - 13, py + player.h - 8 + legSwingB, 2, 2);

        // === ANIMATED ARMS ===
        // Forward arm: points along the actual gun-fire direction so the
        // visual arm/gun matches where bullets will travel. Bullets always
        // shoot in the player's facing direction (with optional up/down tilt
        // from arrow keys / WASD). The arm follows the same rule.
        const shoulderY = py + 14;
        const shoulderX = px + player.w / 2;

        // Compute aim direction (mirror of shootBullet logic)
        let aimDx = player.facing;
        let aimDy = 0;
        if (keys['ArrowUp'] || keys['KeyW']) aimDy = -0.6;
        if (keys['ArrowDown'] || keys['KeyS']) aimDy = 0.6;
        const aimLen = Math.sqrt(aimDx * aimDx + aimDy * aimDy);
        aimDx /= aimLen; aimDy /= aimLen;
        let aimAng = Math.atan2(aimDy, aimDx);
        const armLen = 10;
        // Forward arm endpoint
        const armEndX = shoulderX + Math.cos(aimAng) * armLen;
        const armEndY = shoulderY + Math.sin(aimAng) * armLen;
        // Draw forward arm as a thick line
        ctx.strokeStyle = '#0a3a4a';
        ctx.lineCap = 'round';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(armEndX, armEndY);
        ctx.stroke();
        // Forward arm highlight
        ctx.strokeStyle = (player.charAccent || '#00ffaa');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(armEndX, armEndY);
        ctx.stroke();
        ctx.lineWidth = 1;

        // Recoil offset for the gun (kicks back when you fire)
        if (player.gunRecoil === undefined) player.gunRecoil = 0;
        if (player.gunRecoil > 0) player.gunRecoil = Math.max(0, player.gunRecoil - 0.6);
        const recoil = player.gunRecoil;

        // Main gun — anchored at the forward arm endpoint, rotated to aim
        ctx.save();
        ctx.translate(armEndX, armEndY);
        ctx.rotate(aimAng);
        ctx.translate(-recoil, 0);   // recoil pushes gun back toward shoulder
        ctx.fillStyle = '#00aacc';
        ctx.shadowColor = '#00aacc';
        ctx.shadowBlur = 4;
        ctx.fillRect(0, -3, 14, 6);
        ctx.fillStyle = '#88ddff';
        ctx.fillRect(0, -3, 14, 2);
        // Muzzle flash flash when shootCooldown is fresh
        if (player.shootCooldown > 6) {
            ctx.fillStyle = '#ffffaa';
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(15, 0, 4 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.restore();

        // Back arm — swings during run, hangs neutral when still / firing pose when shooting
        const backSwing = player.onGround ? Math.sin(player.legPhase + Math.PI) * 6 : 4;
        const backArmStartX = shoulderX - 4;
        const backArmEndX = backArmStartX - 2 + (player.facing > 0 ? -2 : 2);
        const backArmEndY = shoulderY + 8 + Math.abs(backSwing) * 0.5;
        ctx.strokeStyle = '#0a3a4a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(backArmStartX, shoulderY);
        ctx.lineTo(backArmEndX, backArmEndY);
        ctx.stroke();
        ctx.lineWidth = 1;

        // EVOLUTION SIDE-ARM (bonus weapon mounted on the back/shoulder)
        const evo = EVOLUTIONS[player.evoLevel];
        if (evo && evo.sideArm) {
            const sx = px + (player.facing > 0 ? -10 : player.w - 2);
            const sy = py + 8;
            if (evo.sideArm === 'pulse') {
                ctx.fillStyle = evoCol.armor;
                ctx.shadowColor = evoCol.glow;
                ctx.shadowBlur = 8;
                ctx.fillRect(sx, sy, 12, 5);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(sx + (player.facing > 0 ? 0 : 10), sy + 1, 2, 3);
                ctx.shadowBlur = 0;
            } else if (evo.sideArm === 'rocket') {
                ctx.fillStyle = '#444';
                ctx.fillRect(sx - 2, sy - 2, 16, 10);
                ctx.fillStyle = evoCol.armor;
                ctx.shadowColor = evoCol.glow;
                ctx.shadowBlur = 10;
                ctx.fillRect(sx, sy, 14, 3);
                ctx.fillRect(sx, sy + 4, 14, 3);
                ctx.fillStyle = '#ff0000';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 8;
                ctx.fillRect(sx + (player.facing > 0 ? 0 : 12), sy, 2, 2);
                ctx.fillRect(sx + (player.facing > 0 ? 0 : 12), sy + 4, 2, 2);
                ctx.shadowBlur = 0;
            } else if (evo.sideArm === 'omega') {
                // OMEGA quad missile array - 4 stacked tubes
                ctx.fillStyle = '#222';
                ctx.fillRect(sx - 2, sy - 4, 18, 16);
                ctx.fillStyle = evoCol.armor;
                ctx.shadowColor = evoCol.glow;
                ctx.shadowBlur = 14;
                for (let row = 0; row < 4; row++) {
                    ctx.fillRect(sx, sy - 2 + row * 4, 16, 3);
                }
                ctx.shadowBlur = 0;
                // Yellow warning lights
                ctx.fillStyle = '#ffff00';
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur = 8;
                for (let row = 0; row < 4; row++) {
                    ctx.fillRect(sx + (player.facing > 0 ? 0 : 14), sy - 2 + row * 4, 2, 2);
                }
                ctx.shadowBlur = 0;
            } else if (evo.sideArm === 'apex') {
                // APEX: dual stacked plasma cannons w/ glowing emitter rings
                ctx.fillStyle = '#0a1a22';
                ctx.fillRect(sx - 3, sy - 6, 22, 22);
                ctx.fillStyle = evoCol.armor;
                ctx.shadowColor = evoCol.glow;
                ctx.shadowBlur = 16;
                ctx.fillRect(sx, sy - 4, 20, 4);
                ctx.fillRect(sx, sy + 6, 20, 4);
                ctx.shadowBlur = 0;
                // Bright cyan emitter eyes on the front of each tube
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = evoCol.glow;
                ctx.shadowBlur = 12;
                const tipX = sx + (player.facing > 0 ? 0 : 18);
                ctx.fillRect(tipX, sy - 3, 2, 2);
                ctx.fillRect(tipX, sy + 7, 2, 2);
                ctx.shadowBlur = 0;
                // Halo blade orbital ring above the head
                const haloT = performance.now() * 0.004;
                ctx.strokeStyle = evoCol.armor;
                ctx.shadowColor = evoCol.glow;
                ctx.shadowBlur = 12;
                ctx.lineWidth = 2;
                for (let r = 0; r < 3; r++) {
                    const ang = haloT + (r * Math.PI * 2 / 3);
                    const ox = px + player.w / 2 + Math.cos(ang) * 22;
                    const oy = py - 8 + Math.sin(ang) * 6;
                    ctx.beginPath();
                    ctx.arc(ox, oy, 3, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.lineWidth = 1;
                ctx.shadowBlur = 0;
            } else if (evo.sideArm === 'prime') {
                // PRIME: triple stacked cannon block w/ jet-wing accents.
                // Dark backplate
                ctx.fillStyle = '#0a0a18';
                ctx.fillRect(sx - 4, sy - 8, 24, 28);
                // 3 stacked cannon barrels
                ctx.fillStyle = evoCol.armor;
                ctx.shadowColor = evoCol.glow;
                ctx.shadowBlur = 18;
                ctx.fillRect(sx, sy - 6, 22, 4);
                ctx.fillRect(sx, sy + 4, 22, 4);
                ctx.fillRect(sx, sy + 14, 22, 4);
                ctx.shadowBlur = 0;
                // Bright crimson tips
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = evoCol.glow;
                ctx.shadowBlur = 14;
                const tipX = sx + (player.facing > 0 ? 0 : 20);
                ctx.fillRect(tipX, sy - 5, 2, 2);
                ctx.fillRect(tipX, sy + 5, 2, 2);
                ctx.fillRect(tipX, sy + 15, 2, 2);
                ctx.shadowBlur = 0;
                // Folded jet wings on the back (visible behind shoulder)
                ctx.fillStyle = evoCol.armor;
                ctx.shadowColor = evoCol.glow;
                ctx.shadowBlur = 12;
                const wbx = px + (player.facing > 0 ? -10 : player.w - 4);
                ctx.beginPath();
                ctx.moveTo(wbx, py + 6);
                ctx.lineTo(wbx + (player.facing > 0 ? -14 : 14), py + 14);
                ctx.lineTo(wbx + (player.facing > 0 ? -8 : 8), py + 28);
                ctx.lineTo(wbx, py + 18);
                ctx.closePath();
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (evo.sideArm === 'convoy') {
                // CONVOY: massive truck-cab shoulder pod w/ four cannons +
                // smokestacks. The most ostentatious tier.
                ctx.fillStyle = '#1a0a0a';
                ctx.fillRect(sx - 6, sy - 12, 30, 40);
                // 4 stacked cannons
                ctx.fillStyle = evoCol.armor;
                ctx.shadowColor = evoCol.glow;
                ctx.shadowBlur = 22;
                ctx.fillRect(sx, sy - 10, 26, 4);
                ctx.fillRect(sx, sy - 2, 26, 4);
                ctx.fillRect(sx, sy + 6, 26, 4);
                ctx.fillRect(sx, sy + 14, 26, 4);
                ctx.shadowBlur = 0;
                // Bright tips
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = evoCol.glow;
                ctx.shadowBlur = 18;
                const tipX = sx + (player.facing > 0 ? 0 : 24);
                ctx.fillRect(tipX, sy - 9, 2, 2);
                ctx.fillRect(tipX, sy - 1, 2, 2);
                ctx.fillRect(tipX, sy + 7, 2, 2);
                ctx.fillRect(tipX, sy + 15, 2, 2);
                ctx.shadowBlur = 0;
                // Twin smokestacks behind the shoulder pod (truck cab vibe)
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(sx - 4, sy - 24, 5, 14);
                ctx.fillRect(sx + 18, sy - 24, 5, 14);
                // Smoke puffs (animated)
                if (Math.random() < 0.4) {
                    spawnParticles(sx - 2, sy - 22, 'rgba(180,180,180,0.6)', 1, 4);
                    spawnParticles(sx + 20, sy - 22, 'rgba(180,180,180,0.6)', 1, 4);
                }
                // Halo crown (Optimus Matrix energy)
                const hT = performance.now() * 0.005;
                ctx.strokeStyle = evoCol.armor;
                ctx.shadowColor = evoCol.glow;
                ctx.shadowBlur = 16;
                ctx.lineWidth = 2;
                for (let r = 0; r < 4; r++) {
                    const ang = hT + (r * Math.PI / 2);
                    const ox = px + player.w / 2 + Math.cos(ang) * 26;
                    const oy = py - 12 + Math.sin(ang) * 8;
                    ctx.beginPath();
                    ctx.arc(ox, oy, 3, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.lineWidth = 1;
                ctx.shadowBlur = 0;
            }
        }
    }

    // === MELEE PUNCH ANIMATION ===
    // Three distinct hit poses: jab (back arm), cross (front arm), uppercut (both).
    // The fist extends from the shoulder along the punch direction. Uses crisp
    // afterimage frames instead of blurry blobs so the animation reads clearly.
    if (player.meleeAnimTimer > 0) {
        const animMax = player.meleeAnimMax || 14;
        const t = (animMax - player.meleeAnimTimer) / animMax;   // 0 → 1
        // Punch curve: fast extend (0..0.35), brief hold (0.35..0.55), retract (0.55..1)
        let extend;
        if (t < 0.35)      extend = (t / 0.35);                 // 0 → 1 fast
        else if (t < 0.55) extend = 1;                          // hold
        else               extend = 1 - (t - 0.55) / 0.45;       // 1 → 0 retract

        const stage = player.meleeAnimStage || 1;
        const arm = player.meleeAnimArm || 'front';

        // Direction the punch travels (forward + up/down hold)
        let pdx = player.facing;
        let pdy = 0;
        if (keys['ArrowUp'] || keys['KeyW']) pdy = -0.5;
        if (keys['ArrowDown'] || keys['KeyS']) pdy = 0.5;
        if (stage === 3) pdy = -0.6;        // uppercut tilts up
        const pl = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
        pdx /= pl; pdy /= pl;
        const punchAng = Math.atan2(pdy, pdx);

        // Punch reach grows with combo stage — and visually further than damage range
        // for clarity (the fist still reaches enemies via the existing hitbox check).
        const reach = stage === 1 ? 32 : stage === 2 ? 42 : 50;

        const torsoCx = px + player.w / 2;
        const torsoY = py + 18;
        const fistColor = stage === 3 ? '#ffff44' : (player.charAccent || '#00ffaa');
        const armBase = '#0a3a4a';

        // Helper to render a single punching arm with crisp afterimage frames
        const drawArm = (shoulderX, shoulderY) => {
            const fistX = shoulderX + Math.cos(punchAng) * reach * extend;
            const fistY = shoulderY + Math.sin(punchAng) * reach * extend;

            // Afterimage frames — only during the FAST extend phase (before hold).
            // Crisp arm copies at 0.7 and 0.4 of current extend, semi-transparent.
            if (extend > 0.2 && t < 0.45) {
                for (let f = 1; f <= 2; f++) {
                    const fE = Math.max(0, extend - f * 0.18);
                    if (fE <= 0) continue;
                    const fX = shoulderX + Math.cos(punchAng) * reach * fE;
                    const fY = shoulderY + Math.sin(punchAng) * reach * fE;
                    ctx.globalAlpha = 0.30 / f;
                    // Arm
                    ctx.strokeStyle = fistColor;
                    ctx.lineCap = 'round';
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.moveTo(shoulderX, shoulderY);
                    ctx.lineTo(fX, fY);
                    ctx.stroke();
                    // Fist outline
                    ctx.fillStyle = fistColor;
                    ctx.fillRect(fX - 5, fY - 5, 10, 10);
                }
                ctx.globalAlpha = 1;
            }

            // Solid arm — drawn last on top of afterimages
            // Drawn in two layers: dark outline + bright accent so the fist reads.
            ctx.strokeStyle = armBase;
            ctx.lineCap = 'round';
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(shoulderX, shoulderY);
            ctx.lineTo(fistX, fistY);
            ctx.stroke();
            // Inner accent line on the arm
            ctx.strokeStyle = (player.charColor || '#00ddff');
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(shoulderX, shoulderY);
            ctx.lineTo(fistX, fistY);
            ctx.stroke();
            ctx.lineWidth = 1;

            // Forearm "wrap" detail near the elbow for clarity
            const elbowX = shoulderX + (fistX - shoulderX) * 0.55;
            const elbowY = shoulderY + (fistY - shoulderY) * 0.55;
            ctx.fillStyle = armBase;
            ctx.fillRect(elbowX - 3, elbowY - 3, 6, 6);

            // CHUNKY FIST — outlined cube with knuckles for clear silhouette.
            // No glow blur on the fist itself so the shape stays sharp.
            const fistSize = 14;
            // Drop-shadow outline first (no blur — just offset)
            ctx.fillStyle = '#000';
            ctx.fillRect(fistX - fistSize / 2 + 1, fistY - fistSize / 2 + 1, fistSize, fistSize);
            // Fist body
            ctx.fillStyle = (player.charColor || '#00ddff');
            ctx.fillRect(fistX - fistSize / 2, fistY - fistSize / 2, fistSize, fistSize);
            // Knuckles
            ctx.fillStyle = fistColor;
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(fistX - fistSize / 2 + 1 + i * 3, fistY - fistSize / 2 + 1, 2, 3);
            }
            // Highlight on top
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(fistX - fistSize / 2 + 1, fistY - fistSize / 2 + 1, fistSize - 2, 1);

            // Impact starburst at peak extension — crisp, no blur
            if (extend > 0.85 && t < 0.6) {
                const burstA = Math.max(0, 1 - Math.abs(extend - 1) / 0.15);
                ctx.save();
                ctx.translate(fistX + Math.cos(punchAng) * 8, fistY + Math.sin(punchAng) * 8);
                ctx.rotate(punchAng);
                ctx.globalAlpha = burstA;
                ctx.fillStyle = '#ffff66';
                // 4 spike rays — outlined so they read on any background
                for (let r = 0; r < 4; r++) {
                    ctx.rotate(Math.PI / 2);
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(15, -4);
                    ctx.lineTo(22, 0);
                    ctx.lineTo(15, 4);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = '#ffff66';
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(13, -3);
                    ctx.lineTo(20, 0);
                    ctx.lineTo(13, 3);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
                ctx.globalAlpha = 1;
            }
        };

        // Stage 1 (jab): back arm only
        // Stage 2 (cross): front arm
        // Stage 3 (uppercut/AOE): both arms slammed forward+up

        // ----- ENERGON AXE swing (CONVOY only) -----
        // Replaces the fist visual at CONVOY tier. The axe swings in an arc
        // matching the punch direction, leaving a glowing crescent trail.
        if (player.meleeAxe) {
            const axeAng = punchAng;
            const axeReach = stage === 3 ? 70 : 56;
            // Axe pivots from the player's chest area in an arc
            const arcSpread = stage === 3 ? Math.PI * 0.7 : Math.PI * 0.5;
            const arcStart = axeAng - arcSpread / 2;
            const arcEnd   = axeAng + arcSpread / 2;
            // Crescent trail — multiple arc segments fading out
            ctx.save();
            for (let f = 0; f < 4; f++) {
                const fE = Math.max(0, extend - f * 0.18);
                if (fE <= 0) continue;
                const a = arcStart + arcSpread * fE;
                const r = axeReach * (0.7 + 0.3 * fE);
                ctx.globalAlpha = 0.35 / (f + 1);
                ctx.strokeStyle = '#88ddff';
                ctx.shadowColor = '#aaffff';
                ctx.shadowBlur = 18;
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.arc(torsoCx, py + player.h / 2, r, arcStart, a);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            // Solid axe — drawn at the current swing angle
            const swingAng = arcStart + arcSpread * extend;
            const haftX = torsoCx + Math.cos(swingAng) * (axeReach * 0.4);
            const haftY = py + player.h / 2 + Math.sin(swingAng) * (axeReach * 0.4);
            const headX = torsoCx + Math.cos(swingAng) * axeReach;
            const headY = py + player.h / 2 + Math.sin(swingAng) * axeReach;
            // Haft shaft
            ctx.strokeStyle = '#aa1818';
            ctx.lineCap = 'round';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(torsoCx, py + player.h / 2);
            ctx.lineTo(headX, headY);
            ctx.stroke();
            // Gold trim along haft
            ctx.strokeStyle = '#ffd744';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(torsoCx, py + player.h / 2);
            ctx.lineTo(headX, headY);
            ctx.stroke();
            // Axe head — bright energon blade
            ctx.save();
            ctx.translate(headX, headY);
            ctx.rotate(swingAng + Math.PI / 2);
            ctx.fillStyle = '#aaffff';
            ctx.shadowColor = '#88ddff';
            ctx.shadowBlur = 22;
            ctx.beginPath();
            ctx.moveTo(-14, -3);
            ctx.lineTo(14, -3);
            ctx.lineTo(18, 3);
            ctx.lineTo(-18, 3);
            ctx.closePath();
            ctx.fill();
            // Inner brighter core
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(-12, -1.5);
            ctx.lineTo(12, -1.5);
            ctx.lineTo(14, 1.5);
            ctx.lineTo(-14, 1.5);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
            // Stage 3 finisher — extra shockwave ring
            if (stage === 3) {
                const ringR = 30 + extend * 90;
                ctx.save();
                ctx.globalAlpha = (1 - t) * 0.7;
                ctx.strokeStyle = '#88ddff';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(torsoCx, py + player.h / 2, ringR, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
            ctx.restore();
        } else {
        if (arm === 'back' || arm === 'both') {
            drawArm(torsoCx - 8, torsoY - (stage === 3 ? 4 : 0));
        }
        if (arm === 'front' || arm === 'both') {
            drawArm(torsoCx + 8, torsoY - (stage === 3 ? 4 : 0));
        }
        }   // close the else branch (non-axe)

        // Stage 3 finisher — radial shockwave indicator.
        // No blur to keep it readable.
        if (stage === 3) {
            const ringR = 30 + extend * 70;
            ctx.save();
            ctx.globalAlpha = (1 - t) * 0.7;
            ctx.strokeStyle = '#ffff66';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(torsoCx, py + player.h / 2, ringR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(torsoCx, py + player.h / 2, ringR * 0.85, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    ctx.restore();
}

// ============ OMEGA-PRIME THRONE CINEMATIC ============
// Before the final boss dialogue, play a wide cinematic where Omega-Prime
// is slumped on his throne. The player walks in from the side, Omega's
// eyes ignite, then he stands up — body unfolds, halo lights, then the
// regular dialogue cutscene starts.
//
// Phase 0 (0..50):    Wide shot of throne, Omega slumped, dim lighting
// Phase 1 (50..110):  Player walks in from left to center stage
// Phase 2 (110..180): Omega's eyes ignite, body begins to rise
// Phase 3 (180..230): Standing pose, halo flares, screen shakes
// Phase 4 (>230):     Hand off to regular dialogue cutscene
function updateThroneCutscene() {
    if (!throneCutscene) return;
    throneCutscene.timer++;
    const t = throneCutscene.timer;

    // Phase 1: walk-in animation moves the player from start to end x
    if (t >= 50 && t < 110) {
        const p = (t - 50) / 60;
        const ease = 1 - Math.pow(1 - p, 2);
        player.x = throneCutscene.playerStartX + (throneCutscene.playerEndX - throneCutscene.playerStartX) * ease;
        // Drive the leg-walk animation
        player.legPhase = (player.legPhase || 0) + 0.3;
        player.facing = 1;
    }
    // Phase 2: Omega rises — increase his height over time so he visually
    // grows. Use a temporary `riseAmount` field to drive draw.
    if (t >= 110 && t < 180) {
        const p = (t - 110) / 70;
        const ease = 1 - Math.pow(1 - p, 2);
        throneCutscene.riseAmount = ease;
        if (t % 6 === 0) {
            // Mechanical assembly sparks at the throne
            spawnParticles(throneCutscene.bossX + 65, throneCutscene.bossY + 60, '#ffaa44', 4, 4);
            spawnParticles(throneCutscene.bossX + 65, throneCutscene.bossY + 60, '#ff44ff', 3, 3);
        }
        if (t === 175) {
            screenShake = 18;
            spawnShockwave(throneCutscene.bossX + 65, throneCutscene.bossY + 70, 200, '#ffaa00');
        }
    }
    // Phase 3: standing — halo flare
    if (t === 180) {
        screenShake = 22;
        spawnShockwave(throneCutscene.bossX + 65, throneCutscene.bossY - 20, 280, '#ff44ff');
    }
    if (t >= 180 && t < 230) {
        if (t % 4 === 0) {
            spawnParticles(throneCutscene.bossX + 65, throneCutscene.bossY - 10, '#ffaa00', 3, 5);
        }
    }
    // Skip with Enter / Space / F
    if ((keys['Enter'] || keys['NumpadEnter'] || keys['Space'] || keys['KeyF']) && !player.throneSkipHeld) {
        player.throneSkipHeld = true;
        if (t > 30) throneCutscene.timer = throneCutscene.duration;
    }
    if (!keys['Enter'] && !keys['NumpadEnter'] && !keys['Space'] && !keys['KeyF']) {
        player.throneSkipHeld = false;
    }

    // End — transition to regular cutscene dialogue
    if (t >= throneCutscene.duration) {
        cutscene = throneCutscene.throneCutsceneNext;
        throneCutscene = null;
        gameState = 'cutscene';
    }
}

// Render the Omega throne cinematic. Boss appears slumped on the throne
// for the early phase; he straightens up as `riseAmount` grows.
function drawThroneCutscene() {
    if (!throneCutscene) return;
    const t = throneCutscene.timer;
    const p01 = Math.min(1, t / throneCutscene.duration);

    // Cinematic black bars
    const barH = 90;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, barH);
    ctx.fillRect(0, canvas.height - barH, canvas.width, barH);

    // Subtitles per phase
    let subtitle = null;
    if (t < 50) subtitle = '— THE THRONE ROOM —';
    else if (t < 110) subtitle = '⚠ INTRUDER DETECTED';
    else if (t < 180) subtitle = '⚠ OMEGA-PRIME ACTIVATING...';
    else if (t < 230) subtitle = '★ OMEGA-PRIME ★';
    if (subtitle) {
        const flicker = 0.7 + Math.sin(t * 0.25) * 0.3;
        ctx.fillStyle = t < 50 ? '#aaa' : (t < 180 ? '#ff8844' : '#ff44ff');
        ctx.shadowColor = t < 180 ? '#ff8844' : '#ff44ff';
        ctx.shadowBlur = 16;
        ctx.font = 'bold 24px Courier New';
        ctx.textAlign = 'center';
        ctx.globalAlpha = flicker;
        ctx.fillText(subtitle, canvas.width / 2, 60);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    // Skip prompt
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px Courier New';
    ctx.textAlign = 'right';
    ctx.fillText('▸ ENTER / SPACE / F to skip', canvas.width - 30, canvas.height - 14);
    ctx.textAlign = 'left';
}

// Render the THRONE itself + Omega's slumped/standing pose. Called from
// the regular world draw so it sits properly in the camera.
function drawThrone() {
    if (!throneCutscene) return;
    const tx = throneCutscene.bossX - camera.x;
    const ty = throneCutscene.bossY - camera.y;

    ctx.save();
    // Throne pedestal — wide stepped base
    const baseW = 200;
    const baseH = 40;
    const baseX = tx + 65 - baseW / 2;
    const baseY = ty + 130;
    // Steps
    ctx.fillStyle = '#1a0028';
    ctx.fillRect(baseX - 14, baseY + 24, baseW + 28, 16);
    ctx.fillStyle = '#220033';
    ctx.fillRect(baseX - 6, baseY + 12, baseW + 12, 12);
    ctx.fillRect(baseX, baseY, baseW, 12);
    // Gold trim along edges
    ctx.fillStyle = '#ffaa00';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 10;
    ctx.fillRect(baseX - 14, baseY + 36, baseW + 28, 4);
    ctx.shadowBlur = 0;

    // Throne back — tall arched piece behind boss
    const backX = tx + 65 - 70;
    const backY = ty - 80;
    const backW = 140;
    const backH = 220;
    // Outer back (dark)
    const bg = ctx.createLinearGradient(backX, backY, backX, backY + backH);
    bg.addColorStop(0, '#2a0040');
    bg.addColorStop(1, '#100018');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(backX, backY + 30);
    ctx.quadraticCurveTo(backX + backW / 2, backY - 50, backX + backW, backY + 30);
    ctx.lineTo(backX + backW, backY + backH);
    ctx.lineTo(backX, backY + backH);
    ctx.closePath();
    ctx.fill();
    // Throne back gold trim
    ctx.strokeStyle = '#ffaa00';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(backX + 6, backY + 30);
    ctx.quadraticCurveTo(backX + backW / 2, backY - 36, backX + backW - 6, backY + 30);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;

    // Throne back ornaments (vertical gold strips)
    ctx.fillStyle = '#ffaa00';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 8;
    for (let i = 0; i < 5; i++) {
        const sx = backX + 18 + i * (backW - 36) / 4;
        ctx.fillRect(sx, backY + 40, 3, backH - 60);
    }
    ctx.shadowBlur = 0;

    // Side arm rests
    ctx.fillStyle = '#220033';
    ctx.fillRect(backX - 18, backY + 100, 18, 60);
    ctx.fillRect(backX + backW, backY + 100, 18, 60);
    ctx.fillStyle = '#ffaa00';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 8;
    ctx.fillRect(backX - 18, backY + 100, 18, 4);
    ctx.fillRect(backX + backW, backY + 100, 18, 4);
    ctx.shadowBlur = 0;

    // Glowing crown ornament at the top of the throne back
    ctx.fillStyle = '#ffaa00';
    ctx.shadowColor = '#ff44ff';
    ctx.shadowBlur = 18;
    for (let i = 0; i < 5; i++) {
        const sx = backX + backW / 2 - 24 + i * 12;
        const sh = (i === 2) ? 22 : (i === 1 || i === 3) ? 16 : 10;
        ctx.beginPath();
        ctx.moveTo(sx - 4, backY - 36);
        ctx.lineTo(sx, backY - 36 - sh);
        ctx.lineTo(sx + 4, backY - 36);
        ctx.closePath();
        ctx.fill();
    }
    ctx.shadowBlur = 0;

    ctx.restore();
}


// Draws a full-screen cinematic when the player upgrades. Sequence:
//   Phase 0  (0..0.10) : Background fades to black, character zooms in
//   Phase 1  (0.10..0.30): Energy charge beams wrap the character
//   Phase 2  (0.30..0.55): Old armor shatters off, body hovers in light
//   Phase 3  (0.55..0.80): New armor pieces fly in and lock on (each piece scripted)
//   Phase 4  (0.80..0.95): Helmet snaps down, eye lights up
//   Phase 5  (0.95..1.00): Final pose, name banner reveal
function updateEvoCutscene() {
    if (!evoTransform) return;
    evoTransform.timer++;
    evoTransform.ringRot = (evoTransform.ringRot || 0) + 0.03;

    // === CINEMATIC BEATS ===
    // Push particles + screen shake + flashes at scripted moments to give
    // the transformation real punch instead of just a static animation.
    const t = evoTransform.timer;
    const dur = evoTransform.duration;
    const p01 = Math.min(1, t / dur);
    const ec = EVO_COLORS[evoTransform.toLevel];
    const armorCol = (ec && ec.armor) || '#ffffff';
    const glowCol = (ec && ec.glow) || '#ffd744';
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Continuous orbital sparks during the energy charge phase
    if (t > 30 && t < dur * 0.55 && t % 2 === 0) {
        const ang = t * 0.2 + Math.random() * 0.6;
        const r = 80 + Math.sin(t * 0.04) * 30;
        spawnParticles(
            cx + Math.cos(ang) * r,
            cy + Math.sin(ang) * r,
            armorCol, 2, 5
        );
    }

    // PHASE 2 BEAT — old armor shatters
    if (t === Math.floor(dur * 0.30)) {
        spawnShockwave(cx, cy, 200, '#ffffff');
        spawnShockwave(cx, cy, 320, glowCol);
        spawnParticles(cx, cy, armorCol, 60, 14);
        spawnParticles(cx, cy, '#ffffff', 40, 10);
        screenShake = 22;
    }

    // PHASE 3 BEATS — armor pieces flying in
    if (t > dur * 0.55 && t < dur * 0.80) {
        if (t % 8 === 0) {
            // Each beat fires sparks from outside the screen toward the center
            const ang = Math.random() * Math.PI * 2;
            const r = 400;
            spawnParticles(
                cx + Math.cos(ang) * r,
                cy + Math.sin(ang) * r,
                glowCol, 3, 8
            );
        }
        if (t % 16 === 0) screenShake = Math.max(screenShake, 6);
    }

    // PHASE 4 BEAT — helmet snap-down
    if (t === Math.floor(dur * 0.85)) {
        spawnShockwave(cx, cy, 180, glowCol);
        spawnShockwave(cx, cy, 280, '#ffffff');
        spawnParticles(cx, cy, glowCol, 80, 12);
        screenShake = 28;
        hitStop = 4;
        critFlash = 18;
    }

    // PHASE 5 — final pose flare
    if (t === Math.floor(dur * 0.95)) {
        spawnShockwave(cx, cy, 320, glowCol);
        spawnShockwave(cx, cy, 480, '#ffffff');
        spawnShockwave(cx, cy, 640, armorCol);
        spawnParticles(cx, cy, armorCol, 120, 16);
        spawnParticles(cx, cy, '#ffffff', 80, 14);
        // Outward radial sparks
        for (let i = 0; i < 24; i++) {
            const ang = (i / 24) * Math.PI * 2;
            spawnParticles(
                cx + Math.cos(ang) * 80,
                cy + Math.sin(ang) * 80,
                glowCol, 4, 14
            );
        }
        screenShake = 36;
        hitStop = 8;
        critFlash = 30;
    }

    // Allow skip with Enter / Space / F
    if ((keys['Enter'] || keys['NumpadEnter'] || keys['Space'] || keys['KeyF']) && !player.evoSkipHeld) {
        player.evoSkipHeld = true;
        // Allow skip after the first half second so it doesn't auto-skip
        if (evoTransform.timer > 30) evoTransform.timer = evoTransform.duration;
    }
    if (!keys['Enter'] && !keys['NumpadEnter'] && !keys['Space'] && !keys['KeyF']) {
        player.evoSkipHeld = false;
    }
    if (evoTransform.timer >= evoTransform.duration) {
        // Finished
        gameState = evoTransform.prevState || 'playing';
        evoTransform = null;
    }
}

function drawEvoCutscene() {
    if (!evoTransform) return;
    const t = evoTransform.timer;
    const dur = evoTransform.duration;
    const p01 = Math.min(1, t / dur);
    const evo = EVOLUTIONS[evoTransform.toLevel];
    const ec = EVO_COLORS[evoTransform.toLevel];
    const armorColor = (ec && ec.armor) || '#ffaa00';
    const glowColor = (ec && ec.glow) || '#ff8800';
    const baseColor = player.charColor || '#00ddff';
    const accentColor = player.charAccent || '#00ffaa';

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 30;

    // ===== Background — radial energy gradient =====
    const bgFade = Math.min(1, p01 * 4);
    const bg = ctx.createRadialGradient(cx, cy, 30, cx, cy, canvas.width * 0.9);
    bg.addColorStop(0, `rgba(80, 30, 90, ${0.6 * bgFade})`);
    bg.addColorStop(0.5, `rgba(20, 5, 30, ${0.85 * bgFade})`);
    bg.addColorStop(1, `rgba(0, 0, 0, ${bgFade})`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cinematic black bars (sliding in then sliding out)
    const barAnim = Math.min(1, p01 / 0.05);   // bars in within first 5%
    const barOutAnim = p01 > 0.97 ? (p01 - 0.97) / 0.03 : 0;
    const barH = 90 * (barAnim - barOutAnim);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, barH);
    ctx.fillRect(0, canvas.height - barH, canvas.width, barH);

    // ===== Speed lines (anime!) flying outward — peaks during phases 1-3 =====
    const speedPower = (p01 > 0.1 && p01 < 0.85) ? 1 : 0;
    if (speedPower > 0) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(evoTransform.ringRot * 0.15);
        const linesCount = 36;
        for (let i = 0; i < linesCount; i++) {
            const ang = (i / linesCount) * Math.PI * 2;
            const lenJitter = (Math.sin(t * 0.4 + i) + 1) * 0.5;
            const r1 = 90 + lenJitter * 40;
            const r2 = 320 + lenJitter * 120;
            ctx.strokeStyle = `rgba(255, 240, 180, ${0.18 + lenJitter * 0.18})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
            ctx.lineTo(Math.cos(ang) * r2, Math.sin(ang) * r2);
            ctx.stroke();
        }
        ctx.restore();
    }

    // ===== Outer rotating energy ring =====
    if (p01 > 0.05) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(evoTransform.ringRot);
        ctx.strokeStyle = glowColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 24;
        ctx.lineWidth = 4;
        const ringR = 140 + Math.sin(t * 0.1) * 8;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.18) {
            const px = Math.cos(a) * ringR;
            const py = Math.sin(a) * ringR * 0.95;
            if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        // Inner counter-rotating ring
        ctx.rotate(-evoTransform.ringRot * 2.4);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        const ringR2 = 110 + Math.cos(t * 0.12) * 6;
        ctx.beginPath();
        ctx.arc(0, 0, ringR2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        ctx.shadowBlur = 0;
    }

    // ===== Central character silhouette / body =====
    // Phase logic
    const phase0End = 0.10;
    const phase1End = 0.30;
    const phase2End = 0.55;
    const phase3End = 0.80;
    const phase4End = 0.95;

    // The character is drawn larger than gameplay scale.
    // Width of the displayed body grows slightly as phases progress.
    const baseW = 80;
    const baseH = 130;
    const sizeBoost = p01 < phase2End ? 0 : Math.min(1, (p01 - phase2End) / 0.4) * 14;
    const bodyW = baseW + sizeBoost;
    const bodyH = baseH + sizeBoost * 1.4;
    const bodyX = cx - bodyW / 2;
    const bodyY = cy - bodyH / 2;

    // Charge-up halo behind the character
    const chargeAlpha = p01 < phase1End ? p01 / phase1End : (p01 < phase3End ? 1 : 1 - (p01 - phase3End) / 0.2);
    if (chargeAlpha > 0) {
        const halo = ctx.createRadialGradient(cx, cy, 10, cx, cy, 200);
        halo.addColorStop(0, `rgba(255, 255, 220, ${0.6 * chargeAlpha})`);
        halo.addColorStop(0.4, `rgba(255, 200, 80, ${0.3 * chargeAlpha})`);
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Energy beam shooting up — strongest in phase 1
    if (p01 > 0.05 && p01 < phase3End) {
        const beamA = Math.min(1, (phase3End - p01) / 0.4);
        ctx.fillStyle = `rgba(255, 240, 180, ${beamA * 0.55})`;
        ctx.fillRect(cx - 6, 0, 12, canvas.height);
        ctx.fillStyle = `rgba(${ec ? '255, 200, 120' : '180, 220, 255'}, ${beamA * 0.3})`;
        ctx.fillRect(cx - 24, 0, 48, canvas.height);
    }

    // ----- Body silhouette -----
    // During phase 2 the body is shown as a glowing silhouette without armor.
    // During phase 3 the new armor flies in. By phase 4 it's complete.
    const armorReveal = p01 < phase2End ? 0 : Math.min(1, (p01 - phase2End) / (phase3End - phase2End));
    const helmetSnap = p01 < phase3End ? 0 : Math.min(1, (p01 - phase3End) / (phase4End - phase3End));

    // Soft body shadow under
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, bodyY + bodyH + 14, bodyW * 0.6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Torso (silhouette → colored body)
    const torsoColor = p01 < phase2End ? '#0a1a30'
        : (p01 < phase3End ? '#1a3a60' : '#0a3a4a');
    const torsoGrad = ctx.createLinearGradient(bodyX, bodyY, bodyX + bodyW, bodyY + bodyH);
    torsoGrad.addColorStop(0, baseColor);
    torsoGrad.addColorStop(0.5, baseColor);
    torsoGrad.addColorStop(1, torsoColor);
    ctx.fillStyle = torsoGrad;
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = 16;
    ctx.fillRect(bodyX + 12, bodyY + 30, bodyW - 24, bodyH - 50);
    ctx.shadowBlur = 0;

    // Highlights / shading
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(bodyX + 12, bodyY + 30, 5, bodyH - 50);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(bodyX + bodyW - 17, bodyY + 30, 5, bodyH - 50);

    // Animated ARMS (raised in classic anime "transformation pose" — both
    // arms straight up at first, then drop to combat ready)
    {
        const poseProgress = Math.min(1, p01 / 0.7);   // pose moves through phases 0..3
        // Raised arms initially, then drop
        const raise = 1 - poseProgress * 0.7;          // 1 = fully raised, 0.3 = lowered
        const shoulderY = bodyY + 32;
        const upY = shoulderY - 60 * raise + 10;
        const sideX = 22 + (1 - raise) * 14;
        // Left arm
        ctx.strokeStyle = '#0a3a4a';
        ctx.lineCap = 'round';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(cx - 18, shoulderY);
        ctx.lineTo(cx - 18 - sideX, upY);
        ctx.stroke();
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - 18, shoulderY);
        ctx.lineTo(cx - 18 - sideX, upY);
        ctx.stroke();
        // Right arm
        ctx.strokeStyle = '#0a3a4a';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(cx + 18, shoulderY);
        ctx.lineTo(cx + 18 + sideX, upY);
        ctx.stroke();
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx + 18, shoulderY);
        ctx.lineTo(cx + 18 + sideX, upY);
        ctx.stroke();
        ctx.lineWidth = 1;

        // Fists (small cubes at the tips)
        ctx.fillStyle = baseColor;
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 8;
        ctx.fillRect(cx - 18 - sideX - 5, upY - 5, 10, 10);
        ctx.fillRect(cx + 18 + sideX - 5, upY - 5, 10, 10);
        ctx.shadowBlur = 0;
    }

    // ----- Armor pieces flying in (Phase 3) -----
    if (armorReveal > 0) {
        // 6 pieces orbit in toward the body. Each piece "lands" at a slightly different
        // time so it feels staged. As they land, the chest, belt, shoulders fill in.
        const pieces = [
            { name: 'helmet',    target: { x: bodyX + bodyW / 2, y: bodyY + 18 }, w: 40, h: 16, delay: 0.0 },
            { name: 'chest',     target: { x: bodyX + bodyW / 2, y: bodyY + 50 }, w: bodyW - 24, h: 12, delay: 0.1 },
            { name: 'shoulderL', target: { x: bodyX + 12, y: bodyY + 36 }, w: 12, h: 16, delay: 0.2 },
            { name: 'shoulderR', target: { x: bodyX + bodyW - 24, y: bodyY + 36 }, w: 12, h: 16, delay: 0.2 },
            { name: 'belt',      target: { x: bodyX + bodyW / 2, y: bodyY + bodyH - 35 }, w: bodyW - 30, h: 8, delay: 0.35 },
            { name: 'legs',      target: { x: bodyX + bodyW / 2, y: bodyY + bodyH - 18 }, w: bodyW - 26, h: 10, delay: 0.5 }
        ];
        for (const piece of pieces) {
            const localProgress = Math.min(1, Math.max(0, (armorReveal - piece.delay) / 0.5));
            if (localProgress <= 0) continue;
            const ease = 1 - Math.pow(1 - localProgress, 4);

            // Start position is far away on a random angle (deterministic by name)
            const seed = piece.name.charCodeAt(0) + piece.name.charCodeAt(piece.name.length - 1);
            const ang = seed * 0.8;
            const startX = piece.target.x + Math.cos(ang) * 380;
            const startY = piece.target.y + Math.sin(ang) * 280;
            const px = startX + (piece.target.x - startX) * ease;
            const py = startY + (piece.target.y - startY) * ease;

            ctx.save();
            ctx.translate(px, py);
            // Spin while flying in
            const spin = (1 - ease) * Math.PI * 2.5;
            ctx.rotate(spin);
            ctx.fillStyle = armorColor;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 14;
            ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, 2);
            ctx.shadowBlur = 0;
            ctx.restore();

            // Snap impact when piece lands
            if (localProgress >= 0.99 && !piece.snapped) {
                piece.snapped = true;
                spawnShockwave(piece.target.x, piece.target.y, 60, '#ffffff');
            }
        }
    }

    // ----- Helmet snap-down + eye ignition (Phase 4) -----
    if (helmetSnap > 0) {
        ctx.save();
        // The helmet visor — a glowing slit for the eye
        const visorY = bodyY + 22;
        const visorH = 8 + helmetSnap * 4;
        const visorW = 36;
        // Helmet plate
        ctx.fillStyle = armorColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 16;
        ctx.fillRect(cx - visorW / 2 - 4, bodyY + 8, visorW + 8, 28);
        // Visor slit
        ctx.fillStyle = '#000000';
        ctx.fillRect(cx - visorW / 2, visorY, visorW, visorH);
        // Eye ignition
        const eyePulse = 0.6 + Math.sin(t * 0.6) * 0.4;
        const eyeColor = (evoTransform.toLevel >= 3) ? '#ff44ff' : (evoTransform.toLevel >= 2) ? '#ff66cc' : '#88ffff';
        ctx.fillStyle = eyeColor;
        ctx.shadowColor = eyeColor;
        ctx.shadowBlur = 22;
        ctx.fillRect(cx - visorW / 2 + 4, visorY + 1, visorW - 8, visorH - 2);
        // Pupil
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 18 * eyePulse;
        ctx.fillRect(cx - 3, visorY + visorH / 2 - 2, 6, 4);
        ctx.restore();
        ctx.shadowBlur = 0;

        // OMEGA tier gets a halo
        if (evoTransform.toLevel >= 3) {
            ctx.save();
            ctx.strokeStyle = armorColor;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 18;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(cx, bodyY - 6, 26, 10, Math.sin(t * 0.05) * 0.2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            ctx.shadowBlur = 0;
        }
        // MK-III gets cape lines
        if (evoTransform.toLevel === 2) {
            ctx.fillStyle = armorColor;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 12;
            ctx.fillRect(bodyX + 6, bodyY + 40, 4, 70);
            ctx.fillRect(bodyX + bodyW - 10, bodyY + 40, 4, 70);
            ctx.shadowBlur = 0;
        }
    }

    // ===== Sparks raining around the central body =====
    if (t % 4 === 0) {
        const ang = Math.random() * Math.PI * 2;
        particles.push({
            x: cx + Math.cos(ang) * 90,
            y: cy + Math.sin(ang) * 90,
            vx: Math.cos(ang) * 1.4,
            vy: Math.sin(ang) * 1.4 - 1,
            life: 1, decay: 0.03,
            size: 2 + Math.random() * 2,
            color: glowColor
        });
    }

    // ===== Tier-name banner reveal (Phase 5) =====
    if (p01 > phase4End) {
        const reveal = Math.min(1, (p01 - phase4End) / 0.05);
        const ease = 1 - Math.pow(1 - reveal, 3);
        ctx.save();
        ctx.globalAlpha = ease;
        ctx.translate(cx, bodyY + bodyH + 60);
        ctx.scale(0.6 + ease * 0.5, 0.6 + ease * 0.5);
        ctx.fillStyle = glowColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 20;
        ctx.font = 'bold 24px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('★ EVOLVED ★', 0, -10);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 44px Courier New';
        ctx.fillText(evo.name, 0, 30);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#aaa';
        ctx.font = '13px Courier New';
        ctx.fillText(evo.description || '', 0, 56);
        ctx.restore();
        ctx.textAlign = 'left';
    }

    // ===== Phase title bar (top) =====
    if (p01 < phase4End) {
        const titles = [
            'ENERGY SURGE',
            'CORE LOCK',
            'PURGE FRAME',
            'ARMOR SYNCHRONIZATION',
            'SYSTEM ONLINE'
        ];
        let title;
        if (p01 < phase1End) title = titles[0];
        else if (p01 < phase2End) title = titles[1];
        else if (p01 < phase3End) title = titles[2];
        else if (p01 < phase4End) title = titles[3];
        else title = titles[4];
        ctx.save();
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(title, cx, 60);
        // Progress bar under title
        const barW = 280;
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(cx - barW / 2, 70, barW, 4);
        ctx.fillStyle = glowColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
        ctx.fillRect(cx - barW / 2, 70, barW * p01, 4);
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // Skip prompt
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px Courier New';
    ctx.textAlign = 'right';
    ctx.fillText('▸ ENTER / SPACE / F to skip', canvas.width - 30, canvas.height - 14);
    ctx.restore();
    ctx.textAlign = 'left';
}

// ===== UNIQUE BOSS BODY DRAWERS =====
// Each boss subtype has its own silhouette: distinct head/visor, hands,
// armor plating, leg/thruster style. Phase 2 colors flicker red.
function drawBossBody(ex, ey, e) {
    // === PHASE TRANSITION HALO ===
    // When phaseFlashTimer is active, paint an expanding bright ring around
    // the boss before the body. Sells the cinematic moment.
    if (e.phaseFlashTimer && e.phaseFlashTimer > 0) {
        const t = e.phaseFlashTimer;
        const maxT = e.phase === 3 ? 80 : 60;
        const f = t / maxT;
        const cx = ex + e.w / 2;
        const cy = ey + e.h / 2;
        // Massive halo
        const haloColor = e.phase === 3 ? '#ff0044' : '#ff44ff';
        ctx.save();
        ctx.globalAlpha = f * 0.6;
        ctx.strokeStyle = haloColor;
        ctx.shadowColor = haloColor;
        ctx.shadowBlur = 30;
        ctx.lineWidth = 6 * f;
        ctx.beginPath();
        ctx.arc(cx, cy, e.w * 0.7 + (1 - f) * 80, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        // Body color flash overlay (set on the canvas globalCompositeOperation
        // would be heavier — keep it simple with an additive rect)
        ctx.globalAlpha = f * 0.4;
        ctx.fillStyle = haloColor;
        ctx.fillRect(ex - 10, ey - 10, e.w + 20, e.h + 20);
        ctx.restore();
    }

    switch (e.subtype) {
        case 'guard':     drawBossGuard(ex, ey, e); break;
        case 'skyhammer': drawBossSkyhammer(ex, ey, e); break;
        case 'inferno':   drawBossInferno(ex, ey, e); break;
        case 'ravager':   drawBossRavager(ex, ey, e); break;
        case 'cryo':      drawBossCryo(ex, ey, e); break;
        case 'nullifier': drawBossNullifier(ex, ey, e); break;
        case 'omega':     drawBossOmega(ex, ey, e); break;
        case 'titan':     drawBossTitan(ex, ey, e); break;
        default:          drawBossGeneric(ex, ey, e); break;
    }
    // === BOSS TRANSFORMATION OVERLAY ===
    // When the boss enters phase 2 it visibly "transforms" — extra armor and
    // body-mounted cannons appear on top of the existing silhouette. Phase 3
    // adds a hot red rage-glow pulse around the body. Skip for hydra/titan
    // since they already have their own transformation visuals.
    if ((e.phase === 2 || e.phase === 3) && e.subtype !== 'hydra' && e.subtype !== 'titan') {
        drawBossTransformOverlay(ex, ey, e);
    }
}

// Shared overlay drawn on top of the base boss silhouette during phase 2/3.
// Adds body-mounted cannons + a rage glow that intensifies in phase 3.
function drawBossTransformOverlay(ex, ey, e) {
    ctx.save();
    const phase3 = e.phase === 3;
    const accent = phase3 ? '#ff0044' : '#ff44ff';
    const glow = phase3 ? '#ff8800' : '#ff66ff';

    // Body-mounted cannons unfold from the shoulders (visible turret pods)
    ctx.fillStyle = '#1a0a1a';
    ctx.fillRect(ex - 6, ey + e.h * 0.2, 14, 18);
    ctx.fillRect(ex + e.w - 8, ey + e.h * 0.2, 14, 18);
    // Cannon barrel
    ctx.fillStyle = accent;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 14;
    ctx.fillRect(ex - 12, ey + e.h * 0.22, 8, 4);
    ctx.fillRect(ex + e.w + 4, ey + e.h * 0.22, 8, 4);
    ctx.fillRect(ex - 12, ey + e.h * 0.22 + 8, 8, 4);
    ctx.fillRect(ex + e.w + 4, ey + e.h * 0.22 + 8, 8, 4);
    ctx.shadowBlur = 0;

    // Back armor flares — visible behind the head
    ctx.fillStyle = accent;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(ex + e.w / 2 - 14, ey - 4);
    ctx.lineTo(ex + e.w / 2 - 24, ey - 14);
    ctx.lineTo(ex + e.w / 2 - 8, ey - 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ex + e.w / 2 + 14, ey - 4);
    ctx.lineTo(ex + e.w / 2 + 24, ey - 14);
    ctx.lineTo(ex + e.w / 2 + 8, ey - 6);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Phase 3 only: pulsing rage aura around the body
    if (phase3) {
        const pulse = 0.5 + Math.sin(performance.now() * 0.012) * 0.5;
        ctx.strokeStyle = `rgba(255, 0, 68, ${0.4 + pulse * 0.4})`;
        ctx.shadowColor = '#ff0044';
        ctx.shadowBlur = 20 * pulse;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ex + e.w / 2, ey + e.h / 2, e.w / 2 + 16 + pulse * 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
    }
    ctx.restore();
}

// Shared utilities -------------------------------------------------------
function bossLimbSwing(e) {
    return Math.sin((e.moveTimer || 0) * 0.06) * 4;
}
function drawBossHpCore(ex, ey, e, color, radius) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(ex + e.w / 2, ey + e.h / 2, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(ex + e.w / 2 - 3, ey + e.h / 2 - 3, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

// Boxy security guard with riot shield + shoulder cannons -----------------
function drawBossGuard(ex, ey, e) {
    const swing = bossLimbSwing(e);
    const phase2 = e.phase === 2;
    const main = phase2 ? '#ff44aa' : '#ff66dd';
    // Legs (boxy stompers)
    ctx.fillStyle = '#1a1a22';
    ctx.fillRect(ex + 14, ey + e.h - 18 + swing * 0.3, 22, 18);
    ctx.fillRect(ex + e.w - 36, ey + e.h - 18 - swing * 0.3, 22, 18);
    // Foot plates
    ctx.fillStyle = main;
    ctx.fillRect(ex + 12, ey + e.h - 4 + swing * 0.3, 26, 4);
    ctx.fillRect(ex + e.w - 38, ey + e.h - 4 - swing * 0.3, 26, 4);
    // Torso (heavy plate)
    const tg = ctx.createLinearGradient(ex, ey + 20, ex, ey + e.h - 18);
    tg.addColorStop(0, main);
    tg.addColorStop(1, '#330033');
    ctx.fillStyle = tg;
    ctx.fillRect(ex + 8, ey + 22, e.w - 16, e.h - 40);
    // Chest emblem (security badge)
    ctx.fillStyle = '#222';
    ctx.fillRect(ex + e.w / 2 - 12, ey + 36, 24, 18);
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 10px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('★', ex + e.w / 2, ey + 50);
    ctx.textAlign = 'left';
    // Shoulder armor plates
    ctx.fillStyle = main;
    ctx.shadowColor = main;
    ctx.shadowBlur = 10;
    ctx.fillRect(ex + 2, ey + 20, 14, 14);
    ctx.fillRect(ex + e.w - 16, ey + 20, 14, 14);
    ctx.shadowBlur = 0;
    // Arms — held wide for intimidation
    ctx.fillStyle = '#1a1a22';
    ctx.fillRect(ex - 6, ey + 32, 14, 50);
    ctx.fillRect(ex + e.w - 8, ey + 32, 14, 50);
    // Riot shield (left fist)
    ctx.fillStyle = '#222';
    ctx.fillRect(ex - 22, ey + 38, 16, 44);
    ctx.fillStyle = main;
    ctx.fillRect(ex - 22, ey + 38, 16, 4);
    ctx.fillStyle = '#88ddff';
    ctx.shadowColor = '#88ddff';
    ctx.shadowBlur = 8;
    ctx.fillRect(ex - 18, ey + 50, 8, 20);
    ctx.shadowBlur = 0;
    // Right fist (mace-style)
    ctx.fillStyle = main;
    ctx.fillRect(ex + e.w + 6, ey + 70, 16, 16);
    // Head — square helmet with single visor strip
    ctx.fillStyle = '#1a1a22';
    ctx.fillRect(ex + 14, ey, e.w - 28, 28);
    // Forehead band
    ctx.fillStyle = main;
    ctx.fillRect(ex + 14, ey, e.w - 28, 6);
    // Visor (red slit, glowing)
    ctx.fillStyle = phase2 ? '#ff0000' : '#ffaa44';
    ctx.shadowColor = phase2 ? '#ff0000' : '#ff8800';
    ctx.shadowBlur = 14;
    ctx.fillRect(ex + 18, ey + 12, e.w - 36, 6);
    ctx.shadowBlur = 0;
    // Side antennae
    ctx.fillStyle = main;
    ctx.fillRect(ex + 12, ey - 10, 2, 12);
    ctx.fillRect(ex + e.w - 14, ey - 10, 2, 12);
    drawBossHpCore(ex, ey, e, main, 12);
}

// Sky enforcer — winged jet body with thrusters & shoulder missile pods --
function drawBossSkyhammer(ex, ey, e) {
    const swing = bossLimbSwing(e);
    const phase2 = e.phase === 2;
    const main = phase2 ? '#ff4444' : '#0088ff';
    // Wings
    ctx.fillStyle = '#1a2a40';
    ctx.beginPath();
    ctx.moveTo(ex - 6, ey + 28);
    ctx.lineTo(ex - 30, ey + 60);
    ctx.lineTo(ex + 6, ey + 50);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ex + e.w + 6, ey + 28);
    ctx.lineTo(ex + e.w + 30, ey + 60);
    ctx.lineTo(ex + e.w - 6, ey + 50);
    ctx.closePath();
    ctx.fill();
    // Wing edge glow
    ctx.fillStyle = main;
    ctx.shadowColor = main;
    ctx.shadowBlur = 12;
    ctx.fillRect(ex - 30, ey + 56, 36, 4);
    ctx.fillRect(ex + e.w - 6, ey + 56, 36, 4);
    ctx.shadowBlur = 0;
    // Thrusters (instead of legs)
    const thrusterLen = 14 + Math.sin(performance.now() * 0.02) * 4;
    ctx.fillStyle = '#ff8800';
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 14;
    ctx.fillRect(ex + 16, ey + e.h, 16, thrusterLen);
    ctx.fillRect(ex + e.w - 32, ey + e.h, 16, thrusterLen);
    ctx.fillStyle = '#ffff88';
    ctx.fillRect(ex + 18, ey + e.h, 12, thrusterLen * 0.6);
    ctx.fillRect(ex + e.w - 30, ey + e.h, 12, thrusterLen * 0.6);
    ctx.shadowBlur = 0;
    // Aerodynamic torso
    const tg = ctx.createLinearGradient(ex, ey + 18, ex, ey + e.h - 6);
    tg.addColorStop(0, main);
    tg.addColorStop(1, '#001a40');
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(ex + 10, ey + 22);
    ctx.lineTo(ex + e.w - 10, ey + 22);
    ctx.lineTo(ex + e.w - 6, ey + e.h - 6);
    ctx.lineTo(ex + 6, ey + e.h - 6);
    ctx.closePath();
    ctx.fill();
    // Shoulder missile pods
    ctx.fillStyle = '#222';
    ctx.fillRect(ex - 4, ey + 22, 14, 26);
    ctx.fillRect(ex + e.w - 10, ey + 22, 14, 26);
    ctx.fillStyle = '#ff4400';
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 8;
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(ex - 2, ey + 24 + i * 8, 10, 4);
        ctx.fillRect(ex + e.w - 8, ey + 24 + i * 8, 10, 4);
    }
    ctx.shadowBlur = 0;
    // Hands holding twin hammers
    ctx.fillStyle = '#1a1a22';
    ctx.fillRect(ex - 10, ey + 42 + swing, 12, 36);
    ctx.fillRect(ex + e.w - 2, ey + 42 - swing, 12, 36);
    // Hammers
    ctx.fillStyle = main;
    ctx.shadowColor = main;
    ctx.shadowBlur = 10;
    ctx.fillRect(ex - 22, ey + 70 + swing, 14, 18);
    ctx.fillRect(ex + e.w + 8, ey + 70 - swing, 14, 18);
    ctx.shadowBlur = 0;
    // Aviator helmet head
    ctx.fillStyle = '#1a2a40';
    ctx.beginPath();
    ctx.moveTo(ex + 16, ey);
    ctx.lineTo(ex + e.w - 16, ey);
    ctx.lineTo(ex + e.w - 12, ey + 28);
    ctx.lineTo(ex + 12, ey + 28);
    ctx.closePath();
    ctx.fill();
    // T-shaped visor
    ctx.fillStyle = phase2 ? '#ff0000' : '#88ddff';
    ctx.shadowColor = phase2 ? '#ff0000' : '#0088ff';
    ctx.shadowBlur = 14;
    ctx.fillRect(ex + 18, ey + 8, e.w - 36, 5);
    ctx.fillRect(ex + e.w / 2 - 2, ey + 12, 4, 12);
    ctx.shadowBlur = 0;
    // Antenna fin
    ctx.fillStyle = main;
    ctx.fillRect(ex + e.w / 2 - 1, ey - 14, 2, 14);
    drawBossHpCore(ex, ey, e, main, 14);
}

// Burning lava body with rim flame, shoulder vents, magma fists ----------
function drawBossInferno(ex, ey, e) {
    const swing = bossLimbSwing(e);
    const phase2 = e.phase === 2;
    const main = phase2 ? '#ffaa00' : '#ff3300';
    const lavaT = performance.now() * 0.005;
    // Lava drip particles spawned passively (just visual flicker)
    if (Math.random() < 0.18) {
        spawnParticles(ex + e.w / 2 + (Math.random() - 0.5) * e.w, ey + e.h, '#ff8844', 1, 1);
    }
    // Legs (rocky / molten)
    ctx.fillStyle = '#330000';
    ctx.fillRect(ex + 14, ey + e.h - 16 + swing * 0.3, 22, 16);
    ctx.fillRect(ex + e.w - 36, ey + e.h - 16 - swing * 0.3, 22, 16);
    ctx.fillStyle = main;
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 14;
    ctx.fillRect(ex + 14, ey + e.h - 6, 22, 4);
    ctx.fillRect(ex + e.w - 36, ey + e.h - 6, 22, 4);
    ctx.shadowBlur = 0;
    // Torso (cracked obsidian with lava veins)
    ctx.fillStyle = '#220000';
    ctx.fillRect(ex + 8, ey + 22, e.w - 16, e.h - 38);
    ctx.fillStyle = main;
    ctx.shadowColor = main;
    ctx.shadowBlur = 14;
    // Lava cracks
    for (let i = 0; i < 4; i++) {
        const yy = ey + 28 + i * 14;
        const ww = (Math.sin(lavaT + i) + 1) * 10 + 8;
        ctx.fillRect(ex + e.w / 2 - ww / 2, yy, ww, 3);
    }
    ctx.shadowBlur = 0;
    // Shoulder vents (smoking)
    ctx.fillStyle = '#330000';
    ctx.fillRect(ex - 4, ey + 18, 14, 18);
    ctx.fillRect(ex + e.w - 10, ey + 18, 14, 18);
    ctx.fillStyle = main;
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 12;
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(ex - 6 + i * 4, ey + 14, 3, 6);
        ctx.fillRect(ex + e.w + 2 - i * 4, ey + 14, 3, 6);
    }
    ctx.shadowBlur = 0;
    // Arms — bulging biceps with magma fists
    ctx.fillStyle = '#220000';
    ctx.fillRect(ex - 8, ey + 32 + swing, 16, 50);
    ctx.fillRect(ex + e.w - 8, ey + 32 - swing, 16, 50);
    // Magma fists (glowing)
    ctx.fillStyle = main;
    ctx.shadowColor = main;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(ex - 2, ey + 84 + swing, 12, 0, Math.PI * 2);
    ctx.arc(ex + e.w + 2, ey + 84 - swing, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Demon-style head with horns
    ctx.fillStyle = '#220000';
    ctx.fillRect(ex + 14, ey, e.w - 28, 26);
    // Horns
    ctx.fillStyle = main;
    ctx.shadowColor = main;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(ex + 14, ey + 4);
    ctx.lineTo(ex + 4, ey - 14);
    ctx.lineTo(ex + 18, ey + 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ex + e.w - 14, ey + 4);
    ctx.lineTo(ex + e.w - 4, ey - 14);
    ctx.lineTo(ex + e.w - 18, ey + 2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // Two angry eye slits
    ctx.fillStyle = '#ffff44';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(ex + 18, ey + 8);
    ctx.lineTo(ex + 30, ey + 14);
    ctx.lineTo(ex + 18, ey + 16);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ex + e.w - 18, ey + 8);
    ctx.lineTo(ex + e.w - 30, ey + 14);
    ctx.lineTo(ex + e.w - 18, ey + 16);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    drawBossHpCore(ex, ey, e, main, 14);
}

// Lab predator — quadrupedal stance with chainsaw arms -------------------
function drawBossRavager(ex, ey, e) {
    const swing = bossLimbSwing(e);
    const phase2 = e.phase === 2;
    const main = phase2 ? '#ff44aa' : '#22ff44';
    // Hunched legs — dual jointed
    ctx.fillStyle = '#0a2a14';
    // Left leg upper
    ctx.fillRect(ex + 10, ey + e.h - 30, 14, 16);
    // Left leg lower
    ctx.fillRect(ex + 4 + swing * 0.4, ey + e.h - 14, 16, 14);
    // Right leg
    ctx.fillRect(ex + e.w - 24, ey + e.h - 30, 14, 16);
    ctx.fillRect(ex + e.w - 20 - swing * 0.4, ey + e.h - 14, 16, 14);
    // Tail
    ctx.fillStyle = '#0a2a14';
    ctx.beginPath();
    ctx.moveTo(ex + e.w / 2, ey + e.h - 6);
    ctx.lineTo(ex + e.w + 22, ey + e.h - 14);
    ctx.lineTo(ex + e.w + 14, ey + e.h - 4);
    ctx.closePath();
    ctx.fill();
    // Tail tip stinger
    ctx.fillStyle = main;
    ctx.shadowColor = main;
    ctx.shadowBlur = 10;
    ctx.fillRect(ex + e.w + 18, ey + e.h - 16, 6, 6);
    ctx.shadowBlur = 0;
    // Hunched torso
    const tg = ctx.createLinearGradient(ex, ey + 16, ex, ey + e.h - 30);
    tg.addColorStop(0, main);
    tg.addColorStop(1, '#0a2a14');
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(ex + 12, ey + 20);
    ctx.lineTo(ex + e.w - 12, ey + 20);
    ctx.lineTo(ex + e.w - 4, ey + e.h - 28);
    ctx.lineTo(ex + 4, ey + e.h - 28);
    ctx.closePath();
    ctx.fill();
    // Spine spikes
    ctx.fillStyle = main;
    for (let i = 0; i < 5; i++) {
        const sx = ex + 16 + i * (e.w - 32) / 4;
        ctx.beginPath();
        ctx.moveTo(sx - 4, ey + 20);
        ctx.lineTo(sx, ey + 8);
        ctx.lineTo(sx + 4, ey + 20);
        ctx.closePath();
        ctx.fill();
    }
    // CHAINSAW arms
    ctx.fillStyle = '#0a2a14';
    ctx.fillRect(ex - 12, ey + 32 + swing, 14, 36);
    ctx.fillRect(ex + e.w - 2, ey + 32 - swing, 14, 36);
    // Saw blades (rotating teeth)
    const sawT = performance.now() * 0.04;
    ctx.fillStyle = main;
    ctx.shadowColor = main;
    ctx.shadowBlur = 12;
    for (let s = -1; s <= 1; s += 2) {
        const cx = s < 0 ? ex - 18 : ex + e.w + 18;
        const cy = ey + 76 + (s < 0 ? swing : -swing);
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0a2a14';
        for (let t = 0; t < 8; t++) {
            const a = sawT + (t / 8) * Math.PI * 2;
            ctx.fillRect(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14, 2, 4);
        }
        ctx.fillStyle = main;
    }
    ctx.shadowBlur = 0;
    // Predator head — wide, fanged
    ctx.fillStyle = '#0a2a14';
    ctx.fillRect(ex + 12, ey, e.w - 24, 24);
    // Horns/mandibles
    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.moveTo(ex + 12, ey + 22);
    ctx.lineTo(ex + 4, ey + 30);
    ctx.lineTo(ex + 16, ey + 24);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ex + e.w - 12, ey + 22);
    ctx.lineTo(ex + e.w - 4, ey + 30);
    ctx.lineTo(ex + e.w - 16, ey + 24);
    ctx.closePath();
    ctx.fill();
    // Cyclops eye
    ctx.fillStyle = '#ff0044';
    ctx.shadowColor = '#ff0044';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(ex + e.w / 2, ey + 12, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 0;
    ctx.fillRect(ex + e.w / 2 - 1, ey + 11, 2, 2);
    drawBossHpCore(ex, ey, e, main, 13);
}

// Frost king — flowing ice cape, crowned helmet, ice scepter -------------
function drawBossCryo(ex, ey, e) {
    const swing = bossLimbSwing(e);
    const phase2 = e.phase === 2;
    const main = phase2 ? '#ff66ff' : '#88ccff';
    // Ice cape behind body
    ctx.fillStyle = '#0a2030';
    ctx.beginPath();
    ctx.moveTo(ex + 6, ey + 24);
    ctx.lineTo(ex - 8, ey + e.h);
    ctx.lineTo(ex + e.w + 8, ey + e.h);
    ctx.lineTo(ex + e.w - 6, ey + 24);
    ctx.closePath();
    ctx.fill();
    // Cape edge ice
    ctx.fillStyle = main;
    ctx.shadowColor = main;
    ctx.shadowBlur = 14;
    ctx.fillRect(ex - 8, ey + e.h - 4, e.w + 16, 4);
    ctx.shadowBlur = 0;
    // Legs — armored boots
    ctx.fillStyle = '#0a2030';
    ctx.fillRect(ex + 14, ey + e.h - 18 + swing * 0.3, 22, 18);
    ctx.fillRect(ex + e.w - 36, ey + e.h - 18 - swing * 0.3, 22, 18);
    ctx.fillStyle = main;
    ctx.fillRect(ex + 14, ey + e.h - 6 + swing * 0.3, 22, 4);
    ctx.fillRect(ex + e.w - 36, ey + e.h - 6 - swing * 0.3, 22, 4);
    // Royal torso
    const tg = ctx.createLinearGradient(ex, ey + 22, ex, ey + e.h - 18);
    tg.addColorStop(0, main);
    tg.addColorStop(1, '#0a3a5a');
    ctx.fillStyle = tg;
    ctx.fillRect(ex + 8, ey + 22, e.w - 16, e.h - 40);
    // Chest crystal
    ctx.fillStyle = '#aaeeff';
    ctx.shadowColor = '#88ccff';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(ex + e.w / 2, ey + 30);
    ctx.lineTo(ex + e.w / 2 + 8, ey + 44);
    ctx.lineTo(ex + e.w / 2, ey + 58);
    ctx.lineTo(ex + e.w / 2 - 8, ey + 44);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // Shoulder pauldrons (icy)
    ctx.fillStyle = main;
    ctx.shadowColor = main;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(ex + 2, ey + 22);
    ctx.lineTo(ex - 6, ey + 36);
    ctx.lineTo(ex + 14, ey + 36);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ex + e.w - 2, ey + 22);
    ctx.lineTo(ex + e.w + 6, ey + 36);
    ctx.lineTo(ex + e.w - 14, ey + 36);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // Arms — straight
    ctx.fillStyle = '#0a2030';
    ctx.fillRect(ex - 4, ey + 36 + swing, 12, 50);
    ctx.fillRect(ex + e.w - 8, ey + 36 - swing, 12, 50);
    // Ice scepter (right hand)
    ctx.fillStyle = '#aaeeff';
    ctx.shadowColor = main;
    ctx.shadowBlur = 16;
    ctx.fillRect(ex + e.w + 2, ey + 30 - swing, 4, 56);
    // Crystal head of scepter
    ctx.beginPath();
    ctx.moveTo(ex + e.w + 4, ey + 22 - swing);
    ctx.lineTo(ex + e.w + 12, ey + 30 - swing);
    ctx.lineTo(ex + e.w + 4, ey + 38 - swing);
    ctx.lineTo(ex + e.w - 4, ey + 30 - swing);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // Crowned helmet
    ctx.fillStyle = '#0a2030';
    ctx.fillRect(ex + 14, ey + 4, e.w - 28, 22);
    // Crown points (ice)
    ctx.fillStyle = main;
    for (let i = 0; i < 5; i++) {
        const cx = ex + 16 + i * (e.w - 32) / 4;
        const ch = (i === 2) ? 18 : 14;
        ctx.beginPath();
        ctx.moveTo(cx - 3, ey + 4);
        ctx.lineTo(cx, ey + 4 - ch);
        ctx.lineTo(cx + 3, ey + 4);
        ctx.closePath();
        ctx.fill();
    }
    // Visor — slim cyan
    ctx.fillStyle = phase2 ? '#ff44ff' : '#aaeeff';
    ctx.shadowColor = main;
    ctx.shadowBlur = 12;
    ctx.fillRect(ex + 18, ey + 12, e.w - 36, 4);
    ctx.shadowBlur = 0;
    drawBossHpCore(ex, ey, e, main, 14);
}

// Phantom — gaunt, hooded body that flickers; long claws -----------------
function drawBossNullifier(ex, ey, e) {
    const swing = bossLimbSwing(e);
    const phase2 = e.phase === 2;
    const main = phase2 ? '#ff44ff' : '#aa00ff';
    // Phasing aura
    const ghostT = performance.now() * 0.004;
    ctx.save();
    ctx.globalAlpha = 0.3 + Math.sin(ghostT) * 0.15;
    ctx.fillStyle = main;
    ctx.shadowColor = main;
    ctx.shadowBlur = 28;
    ctx.beginPath();
    ctx.ellipse(ex + e.w / 2, ey + e.h / 2, e.w * 0.65, e.h * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Cape/cloak — long flowing
    ctx.fillStyle = '#1a0030';
    ctx.beginPath();
    ctx.moveTo(ex + 4, ey + 22);
    ctx.lineTo(ex - 14 + Math.sin(ghostT) * 6, ey + e.h);
    ctx.lineTo(ex + e.w + 14 - Math.sin(ghostT) * 6, ey + e.h);
    ctx.lineTo(ex + e.w - 4, ey + 22);
    ctx.closePath();
    ctx.fill();
    // Body (no legs visible — floats)
    const tg = ctx.createLinearGradient(ex, ey + 22, ex, ey + e.h - 10);
    tg.addColorStop(0, '#330055');
    tg.addColorStop(1, '#100020');
    ctx.fillStyle = tg;
    ctx.fillRect(ex + 12, ey + 22, e.w - 24, e.h - 32);
    // Cloak edge glow
    ctx.fillStyle = main;
    ctx.shadowColor = main;
    ctx.shadowBlur = 12;
    ctx.fillRect(ex + 10, ey + 22, e.w - 20, 3);
    ctx.shadowBlur = 0;
    // Long claw arms — extended outward
    ctx.fillStyle = '#1a0030';
    ctx.fillRect(ex - 14, ey + 36 + swing, 14, 40);
    ctx.fillRect(ex + e.w, ey + 36 - swing, 14, 40);
    // Claws (3 fingers)
    ctx.fillStyle = main;
    ctx.shadowColor = main;
    ctx.shadowBlur = 10;
    for (let f = -1; f <= 1; f++) {
        ctx.fillRect(ex - 18 + f * 4, ey + 78 + swing, 2, 14);
        ctx.fillRect(ex + e.w + 14 + f * 4, ey + 78 - swing, 2, 14);
    }
    ctx.shadowBlur = 0;
    // Hooded head — partial silhouette with one void mask
    ctx.fillStyle = '#100020';
    ctx.beginPath();
    ctx.ellipse(ex + e.w / 2, ey + 14, (e.w - 24) / 2, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Hood top
    ctx.fillStyle = '#1a0030';
    ctx.beginPath();
    ctx.ellipse(ex + e.w / 2, ey + 4, e.w / 2 - 4, 12, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    // Single eye in shadow
    ctx.fillStyle = main;
    ctx.shadowColor = main;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(ex + e.w / 2, ey + 14, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    drawBossHpCore(ex, ey, e, main, 12);
}

// Final boss — golden imperial frame with throne accents ----------------
function drawBossOmega(ex, ey, e) {
    // ===== THRONE CINEMATIC OVERRIDE =====
    // While the throne cutscene plays, render Omega slumped / rising on the
    // throne. The riseAmount tracks the stand-up animation (0=slumped, 1=full).
    let throneSlump = 0;
    let throneScale = 1;
    if (typeof throneCutscene !== 'undefined' && throneCutscene) {
        const t = throneCutscene.timer;
        if (t < 110) {
            throneSlump = 1;        // fully slumped
            throneScale = 0.7;
        } else if (t < 180) {
            const p = (t - 110) / 70;
            throneSlump = 1 - p;
            throneScale = 0.7 + p * 0.3;
            // Charging eyes — extra glow
            if (Math.random() < 0.4) {
                spawnParticles(ex + e.w / 2, ey + 14, '#ff44ff', 1, 1);
            }
        } else {
            throneSlump = 0;
            throneScale = 1.05 + Math.sin(t * 0.05) * 0.02;
        }
    }
    if (throneSlump > 0 || throneScale !== 1) {
        ctx.save();
        ctx.translate(ex + e.w / 2, ey + e.h);
        ctx.scale(throneScale, throneScale);
        ctx.translate(0, throneSlump * 30);   // shift body down when slumped
        ctx.translate(-e.w / 2, -e.h);
        // Recurse with adjusted local coords
        drawBossOmegaInner(0, 0, e);
        ctx.restore();
        return;
    }
    drawBossOmegaInner(ex, ey, e);
}

function drawBossOmegaInner(ex, ey, e) {
    const swing = bossLimbSwing(e);
    const phase2 = e.phase === 2;
    const main = phase2 ? '#ff44ff' : '#ffffff';
    const accent = phase2 ? '#ff44ff' : '#ffaa00';
    // Throne wings behind
    ctx.fillStyle = '#220033';
    for (let s = -1; s <= 1; s += 2) {
        ctx.beginPath();
        ctx.moveTo(ex + (s < 0 ? 8 : e.w - 8), ey + 18);
        ctx.lineTo(ex + (s < 0 ? -28 : e.w + 28), ey + 30);
        ctx.lineTo(ex + (s < 0 ? -32 : e.w + 32), ey + e.h - 30);
        ctx.lineTo(ex + (s < 0 ? -10 : e.w + 10), ey + e.h - 10);
        ctx.closePath();
        ctx.fill();
    }
    // Throne wing gold trim
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 12;
    ctx.fillRect(ex - 32, ey + 30, 4, 60);
    ctx.fillRect(ex + e.w + 28, ey + 30, 4, 60);
    ctx.shadowBlur = 0;
    // Legs
    ctx.fillStyle = '#22002a';
    ctx.fillRect(ex + 18, ey + e.h - 24 + swing * 0.3, 24, 24);
    ctx.fillRect(ex + e.w - 42, ey + e.h - 24 - swing * 0.3, 24, 24);
    ctx.fillStyle = accent;
    ctx.fillRect(ex + 18, ey + e.h - 6 + swing * 0.3, 24, 6);
    ctx.fillRect(ex + e.w - 42, ey + e.h - 6 - swing * 0.3, 24, 6);
    // Imperial torso
    const tg = ctx.createLinearGradient(ex, ey + 22, ex, ey + e.h - 24);
    tg.addColorStop(0, main);
    tg.addColorStop(0.5, '#aaaaaa');
    tg.addColorStop(1, '#22002a');
    ctx.fillStyle = tg;
    ctx.fillRect(ex + 14, ey + 22, e.w - 28, e.h - 46);
    // Gold chest plate with omega symbol
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 14;
    ctx.fillRect(ex + e.w / 2 - 14, ey + 40, 28, 28);
    ctx.fillStyle = '#22002a';
    ctx.font = 'bold 22px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('Ω', ex + e.w / 2, ey + 62);
    ctx.textAlign = 'left';
    ctx.shadowBlur = 0;
    // Shoulder spaulders (huge)
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(ex + 6, ey + 22);
    ctx.lineTo(ex - 10, ey + 42);
    ctx.lineTo(ex + 22, ey + 42);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ex + e.w - 6, ey + 22);
    ctx.lineTo(ex + e.w + 10, ey + 42);
    ctx.lineTo(ex + e.w - 22, ey + 42);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // Arms — armored
    ctx.fillStyle = '#22002a';
    ctx.fillRect(ex - 6, ey + 42 + swing, 16, 50);
    ctx.fillRect(ex + e.w - 10, ey + 42 - swing, 16, 50);
    // Gauntlet fists
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 14;
    ctx.fillRect(ex - 12, ey + 90 + swing, 22, 14);
    ctx.fillRect(ex + e.w - 10, ey + 90 - swing, 22, 14);
    ctx.shadowBlur = 0;
    // Crowned head with gold king-crown
    ctx.fillStyle = '#22002a';
    ctx.fillRect(ex + 18, ey + 4, e.w - 36, 22);
    // Crown
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 14;
    for (let i = 0; i < 7; i++) {
        const cx = ex + 16 + i * (e.w - 32) / 6;
        const ch = (i === 3) ? 22 : 14;
        ctx.beginPath();
        ctx.moveTo(cx - 4, ey + 4);
        ctx.lineTo(cx, ey + 4 - ch);
        ctx.lineTo(cx + 4, ey + 4);
        ctx.closePath();
        ctx.fill();
    }
    ctx.shadowBlur = 0;
    // V-shape visor
    ctx.fillStyle = phase2 ? '#ff44ff' : '#ffaaff';
    ctx.shadowColor = main;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(ex + 22, ey + 12);
    ctx.lineTo(ex + e.w / 2, ey + 18);
    ctx.lineTo(ex + e.w - 22, ey + 12);
    ctx.lineTo(ex + e.w - 22, ey + 16);
    ctx.lineTo(ex + e.w / 2, ey + 22);
    ctx.lineTo(ex + 22, ey + 16);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // Animated halo above (always-active for OMEGA)
    const haloT = performance.now() * 0.005;
    ctx.strokeStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 20;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(ex + e.w / 2, ey - 8, 28, 8, Math.sin(haloT) * 0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    drawBossHpCore(ex, ey, e, main, 16);
}

// Generic fallback (should not be hit if subtype is known) ---------------
function drawBossGeneric(ex, ey, e) {
    const main = e.color || '#ff00ff';
    ctx.fillStyle = main;
    ctx.fillRect(ex + 10, ey + 20, e.w - 20, e.h - 30);
    ctx.fillStyle = '#222';
    ctx.fillRect(ex + 20, ey, e.w - 40, 25);
    drawBossHpCore(ex, ey, e, main, 14);
}

function drawEnemies() {
    for (const e of enemies) {
        const ex = e.x - camera.x;
        const ey = e.y - camera.y;
        ctx.save();
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 8;

        if (e.type === 'ricochet') {
            // RICOCHET - patrol with prism-shaped weapon
            ctx.fillStyle = e.color || '#ff8844';
            ctx.fillRect(ex + 4, ey + 8, e.w - 8, e.h - 14);
            ctx.fillStyle = '#222';
            ctx.fillRect(ex + 8, ey, e.w - 16, 12);
            // Prism eyes (orange)
            ctx.fillStyle = '#ffaa00';
            ctx.shadowColor = '#ff8800';
            ctx.shadowBlur = 8;
            ctx.fillRect(ex + 10, ey + 3, 5, 5);
            ctx.fillRect(ex + e.w - 15, ey + 3, 5, 5);
            ctx.shadowBlur = 0;
            // Legs
            ctx.fillStyle = '#555';
            ctx.fillRect(ex + 6, ey + e.h - 8, 8, 8);
            ctx.fillRect(ex + e.w - 14, ey + e.h - 8, 8, 8);
            // Prism gun (faceted)
            ctx.fillStyle = '#aaa';
            ctx.fillRect(ex + (e.dir > 0 ? e.w - 2 : -10), ey + 14, 12, 5);
            ctx.fillStyle = '#ff8844';
            ctx.fillRect(ex + (e.dir > 0 ? e.w + 4 : -8), ey + 13, 4, 7);
        } else if (e.type === 'swarm') {
            // SWARM - small flying triangle drone
            ctx.fillStyle = e.color || '#ffaa00';
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(ex + e.w / 2, ey);
            ctx.lineTo(ex + e.w, ey + e.h);
            ctx.lineTo(ex, ey + e.h);
            ctx.closePath();
            ctx.fill();
            // Center eye
            ctx.fillStyle = '#ffff00';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(ex + e.w / 2, ey + e.h / 2 + 3, 3, 0, Math.PI * 2);
            ctx.fill();
            // Mini engine glow at bottom
            ctx.fillStyle = '#ff4400';
            ctx.fillRect(ex + e.w / 2 - 2, ey + e.h, 4, 3);
            ctx.shadowBlur = 0;
        } else if (e.type === 'mech') {
            // MECH - Transformers-style giant robot
            const baseColor = e.color;
            const accent = '#ffaa00';
            const dark = '#222';
            const facing = e.facing || 1;
            // Drop shadow for mass
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.beginPath();
            ctx.ellipse(ex + e.w/2, ey + e.h + 4, e.w/2 + 4, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            // Legs (animated walk)
            const walk = Math.sin(e.walkPhase || 0) * 6;
            ctx.fillStyle = dark;
            ctx.fillRect(ex + 8, ey + e.h - 22 + walk, 14, 22 - walk);
            ctx.fillRect(ex + e.w - 22, ey + e.h - 22 - walk, 14, 22 + walk);
            // Knee joints
            ctx.fillStyle = accent;
            ctx.fillRect(ex + 10, ey + e.h - 16 + walk, 10, 4);
            ctx.fillRect(ex + e.w - 20, ey + e.h - 16 - walk, 10, 4);
            // Lower torso (hip)
            const hg = ctx.createLinearGradient(0, ey + e.h - 30, 0, ey + e.h - 10);
            hg.addColorStop(0, baseColor);
            hg.addColorStop(1, dark);
            ctx.fillStyle = hg;
            ctx.fillRect(ex + 4, ey + e.h - 30, e.w - 8, 18);
            // Main torso with gradient
            const tg = ctx.createLinearGradient(ex, ey, ex + e.w, ey);
            tg.addColorStop(0, baseColor);
            tg.addColorStop(0.5, baseColor);
            tg.addColorStop(1, '#1a0808');
            ctx.fillStyle = tg;
            ctx.fillRect(ex + 6, ey + 18, e.w - 12, e.h - 50);
            // Chest highlight
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(ex + 6, ey + 18, 4, e.h - 50);
            // Chest core (glowing)
            ctx.fillStyle = accent;
            ctx.shadowColor = '#ff8800';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(ex + e.w/2, ey + e.h/2 - 5, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            // Shoulder cannons (the big ones!)
            ctx.fillStyle = dark;
            ctx.fillRect(ex - 6, ey + 14, 14, 22);
            ctx.fillRect(ex + e.w - 8, ey + 14, 14, 22);
            ctx.fillStyle = '#666';
            ctx.fillRect(ex - 4, ey + 14, 10, 4);
            ctx.fillRect(ex + e.w - 6, ey + 14, 10, 4);
            // Cannon barrels pointing forward
            ctx.fillStyle = '#888';
            const barrelDir = facing > 0 ? e.w + 6 : -14;
            ctx.fillRect(ex + barrelDir, ey + 18, facing > 0 ? 14 : 14, 5);
            ctx.fillRect(ex + barrelDir, ey + 28, facing > 0 ? 14 : 14, 5);
            // Head
            ctx.fillStyle = dark;
            ctx.fillRect(ex + e.w/2 - 12, ey, 24, 18);
            // Visor (red glowing eye band)
            ctx.fillStyle = '#ff0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10;
            ctx.fillRect(ex + e.w/2 - 9, ey + 6, 18, 5);
            ctx.shadowBlur = 0;
            // Antennas
            ctx.fillStyle = '#888';
            ctx.fillRect(ex + e.w/2 - 8, ey - 4, 2, 6);
            ctx.fillRect(ex + e.w/2 + 6, ey - 4, 2, 6);
            // Arm (gun-arm side)
            ctx.fillStyle = baseColor;
            ctx.fillRect(ex + (facing > 0 ? e.w - 6 : -8), ey + 30, 14, 22);
            // Plate detail lines
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ex + e.w / 2, ey + 18);
            ctx.lineTo(ex + e.w / 2, ey + e.h - 30);
            ctx.stroke();
        } else if (e.type === 'bomber') {
            // BOMBER - red sphere with pulsing glow + warning lights
            const pulse = Math.sin(performance.now() * 0.015) * 0.3 + 0.7;
            ctx.fillStyle = '#ff4400';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 14 * pulse;
            ctx.beginPath();
            ctx.arc(ex + e.w / 2, ey + e.h / 2, e.w / 2 - 2, 0, Math.PI * 2);
            ctx.fill();
            // Spikes around it
            ctx.fillStyle = '#aa2200';
            for (let s = 0; s < 6; s++) {
                const ang = (s / 6) * Math.PI * 2;
                const sx2 = ex + e.w/2 + Math.cos(ang) * (e.w/2);
                const sy2 = ey + e.h/2 + Math.sin(ang) * (e.h/2);
                ctx.beginPath();
                ctx.arc(sx2, sy2, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            // Eye
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(ex + e.w/2 - 4, ey + e.h/2 - 3, 8, 6);
        } else if (e.type === 'sprinter') {
            // SPRINTER - sleek thin robot
            ctx.fillStyle = e.color;
            ctx.fillRect(ex + 4, ey + 8, e.w - 8, e.h - 14);
            // Speed lines behind
            const facing = e.vx > 0 ? 1 : -1;
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(ex + (facing > 0 ? -i * 6 - 4 : e.w + i * 6), ey + 14 + i * 6, 4, 2);
            }
            ctx.globalAlpha = 1;
            // Pointed head
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.moveTo(ex + (facing > 0 ? e.w - 4 : 4), ey);
            ctx.lineTo(ex + (facing > 0 ? e.w + 6 : -6), ey + 8);
            ctx.lineTo(ex + (facing > 0 ? e.w - 4 : 4), ey + 14);
            ctx.closePath();
            ctx.fill();
            // Eye
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(ex + (facing > 0 ? e.w - 8 : 4), ey + 4, 4, 4);
            // Sharp legs
            ctx.fillStyle = '#444';
            ctx.fillRect(ex + 6, ey + e.h - 8, 5, 8);
            ctx.fillRect(ex + e.w - 11, ey + e.h - 8, 5, 8);
        } else if (e.type === 'hydraWalker') {
            // HYDRA-WALKER — multi-headed walker
            const swing = Math.sin((e.legPhase || 0)) * 4;
            // Body
            ctx.fillStyle = '#220000';
            ctx.fillRect(ex + 4, ey + 16, e.w - 8, e.h - 28);
            // Spine plates
            ctx.fillStyle = '#660000';
            for (let i = 0; i < 4; i++) {
                const sx = ex + 8 + i * (e.w - 16) / 3;
                ctx.beginPath();
                ctx.moveTo(sx - 3, ey + 16);
                ctx.lineTo(sx, ey + 8);
                ctx.lineTo(sx + 3, ey + 16);
                ctx.closePath();
                ctx.fill();
            }
            // Glowing core in chest
            ctx.fillStyle = '#ff4400';
            ctx.shadowColor = '#ff8800';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(ex + e.w / 2, ey + e.h / 2, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            // Legs (4 jointed) — alternate stride
            ctx.fillStyle = '#440000';
            for (let leg = 0; leg < 4; leg++) {
                const lx = ex + 4 + leg * (e.w - 8) / 3;
                const ly = ey + e.h - 14;
                const ph = swing * (leg % 2 === 0 ? 1 : -1);
                // Upper segment
                ctx.fillRect(lx - 2, ly, 4, 8);
                // Lower segment with stride
                ctx.fillRect(lx - 2 + ph, ly + 6, 4, 10);
            }
            // Heads (3) — sit on necks above the body
            if (e.heads) {
                for (const head of e.heads) {
                    const hx = ex + e.w / 2 + head.off.x;
                    const hy = ey + head.off.y - 6;
                    if (!head.alive) {
                        // Smoldering stump
                        ctx.fillStyle = '#330000';
                        ctx.fillRect(hx - 2, hy + 4, 4, 6);
                        if (Math.random() < 0.3) {
                            spawnParticles(hx, hy, '#888', 1, 1);
                        }
                        continue;
                    }
                    // Neck
                    ctx.strokeStyle = '#440000';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(ex + e.w / 2, ey + 18);
                    ctx.lineTo(hx, hy + 6);
                    ctx.stroke();
                    ctx.lineWidth = 1;
                    // Head body
                    ctx.fillStyle = head.color;
                    ctx.shadowColor = head.color;
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.ellipse(hx, hy, 8, 6, 0, 0, Math.PI * 2);
                    ctx.fill();
                    // Eye
                    ctx.fillStyle = '#fff';
                    ctx.shadowBlur = 0;
                    ctx.fillRect(hx - 2, hy - 1, 4, 2);
                    // Per-head HP bar
                    ctx.fillStyle = '#222';
                    ctx.fillRect(hx - 8, hy - 14, 16, 2);
                    ctx.fillStyle = head.color;
                    ctx.fillRect(hx - 8, hy - 14, (head.hp / head.maxHp) * 16, 2);
                }
            }
        } else if (e.type === 'scorpion') {
            // SCORPION-BOT — 4-leg artillery walker
            const swing = Math.sin((e.legPhase || 0)) * 5;
            // Body shell
            const sg = ctx.createLinearGradient(ex, ey + 8, ex, ey + e.h - 12);
            sg.addColorStop(0, '#0a3a4a');
            sg.addColorStop(1, '#082030');
            ctx.fillStyle = sg;
            ctx.beginPath();
            ctx.ellipse(ex + e.w / 2, ey + e.h / 2 - 2, e.w / 2, (e.h - 14) / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            // Plate ridge
            ctx.strokeStyle = '#88ddff';
            ctx.shadowColor = '#88ddff';
            ctx.shadowBlur = 8;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(ex + 6, ey + 18);
            ctx.lineTo(ex + e.w / 2, ey + 8);
            ctx.lineTo(ex + e.w - 6, ey + 18);
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;
            // Eye lamps
            ctx.fillStyle = '#88ddff';
            ctx.shadowColor = '#88ddff';
            ctx.shadowBlur = 8;
            ctx.fillRect(ex + 10, ey + 18, 4, 3);
            ctx.fillRect(ex + e.w - 14, ey + 18, 4, 3);
            ctx.shadowBlur = 0;
            // Pincers (front)
            const facing = e.dir > 0 ? 1 : -1;
            ctx.fillStyle = '#0a3a4a';
            ctx.beginPath();
            const px2 = ex + (facing > 0 ? e.w + 6 : -6);
            const py2 = ey + 28;
            ctx.moveTo(px2, py2);
            ctx.lineTo(px2 + facing * 14, py2 - 6);
            ctx.lineTo(px2 + facing * 8, py2);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(px2, py2 + 8);
            ctx.lineTo(px2 + facing * 14, py2 + 14);
            ctx.lineTo(px2 + facing * 8, py2 + 8);
            ctx.closePath();
            ctx.fill();
            // 4 legs underneath with stride
            ctx.strokeStyle = '#082030';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            for (let leg = 0; leg < 4; leg++) {
                const baseX = ex + 8 + leg * (e.w - 16) / 3;
                const baseY = ey + e.h - 16;
                const ph = swing * (leg % 2 === 0 ? 1 : -1);
                ctx.beginPath();
                ctx.moveTo(baseX, baseY);
                ctx.lineTo(baseX + ph, baseY + 12);
                ctx.lineTo(baseX + ph * 1.5, baseY + 16);
                ctx.stroke();
            }
            ctx.lineWidth = 1;
            // Tail with plasma cannon (rear-mounted)
            const tailDir = -facing;
            const tailX = ex + e.w / 2 + tailDir * 22;
            const tailY = ey - 4;
            ctx.strokeStyle = '#0a3a4a';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(ex + e.w / 2, ey + 12);
            ctx.lineTo(ex + e.w / 2 + tailDir * 12, ey + 4);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();
            ctx.lineWidth = 1;
            // Tail cannon nozzle
            ctx.fillStyle = '#88ddff';
            ctx.shadowColor = '#88ddff';
            ctx.shadowBlur = 12;
            ctx.fillRect(tailX - 4, tailY - 4, 8, 6);
            ctx.shadowBlur = 0;
            // Charging glow when about to shoot
            if (e.shootTimer < 30) {
                const charge = (30 - e.shootTimer) / 30;
                ctx.fillStyle = `rgba(140, 220, 255, ${charge * 0.7})`;
                ctx.beginPath();
                ctx.arc(tailX, tailY, 2 + charge * 6, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (e.type === 'heavy') {
            // HEAVY - bulky robot
            ctx.fillStyle = e.color;
            ctx.fillRect(ex + 4, ey + 10, e.w - 8, e.h - 15);
            // Head
            ctx.fillStyle = '#333';
            ctx.fillRect(ex + 6, ey, e.w - 12, 14);
            // Eyes
            ctx.fillStyle = '#ff4400';
            ctx.fillRect(ex + 9, ey + 4, 6, 6);
            ctx.fillRect(ex + e.w - 15, ey + 4, 6, 6);
            // Big legs
            ctx.fillStyle = '#444';
            ctx.fillRect(ex + 4, ey + e.h - 10, 12, 10);
            ctx.fillRect(ex + e.w - 16, ey + e.h - 10, 12, 10);
            // Shoulder cannons
            ctx.fillStyle = '#888';
            ctx.fillRect(ex - 4, ey + 14, 10, 8);
            ctx.fillRect(ex + e.w - 6, ey + 14, 10, 8);
        } else if (e.type === 'shielder') {
            // SHIELDER - has a glowing shield
            ctx.fillStyle = e.color;
            ctx.fillRect(ex + 6, ey + 8, e.w - 12, e.h - 14);
            ctx.fillStyle = '#333';
            ctx.fillRect(ex + 9, ey, e.w - 18, 12);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(ex + 11, ey + 3, 5, 5);
            ctx.fillRect(ex + e.w - 16, ey + 3, 5, 5);
            // Shield in front
            const shieldX = e.dir > 0 ? ex + e.w + 2 : ex - 12;
            ctx.fillStyle = e.shieldColor || '#44ddff';
            ctx.shadowColor = e.shieldColor || '#44ddff';
            ctx.shadowBlur = 14;
            ctx.fillRect(shieldX, ey - 4, 8, e.h + 8);
            ctx.shadowBlur = 8;
        } else if (e.type === 'jumper') {
            // JUMPER - bunny-like, ready to leap
            ctx.fillStyle = e.color;
            // Body
            ctx.beginPath();
            ctx.ellipse(ex + e.w/2, ey + e.h/2 + 4, e.w/2 - 2, e.h/2 - 2, 0, 0, Math.PI * 2);
            ctx.fill();
            // Spikes on top
            ctx.fillStyle = '#ff0000';
            for (let s = 0; s < 4; s++) {
                ctx.beginPath();
                ctx.moveTo(ex + 5 + s * 7, ey);
                ctx.lineTo(ex + 8 + s * 7, ey - 6);
                ctx.lineTo(ex + 11 + s * 7, ey);
                ctx.fill();
            }
            // Eye
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(ex + e.w/2 - 4, ey + e.h/2 - 2, 8, 4);
        } else if (e.type === 'sniper') {
            // SNIPER - tall stationary tower
            ctx.fillStyle = e.color;
            ctx.fillRect(ex + 6, ey + 14, e.w - 12, e.h - 16);
            // Head
            ctx.fillStyle = '#222';
            ctx.fillRect(ex + 8, ey, e.w - 16, 14);
            // Big scope
            ctx.fillStyle = '#ff0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(ex + e.w/2, ey + 7, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            // Long barrel
            ctx.fillStyle = '#555';
            ctx.save();
            ctx.translate(ex + e.w / 2, ey + e.h / 2);
            ctx.rotate(e.aimAngle || Math.atan2(player.y - e.y, player.x - e.x));
            ctx.fillRect(0, -3, 36, 6);
            ctx.restore();
            // Aim laser
            if (e.aimTimer > 0) {
                ctx.strokeStyle = '#ff0000';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 8;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.6 + Math.sin(performance.now() * 0.04) * 0.3;
                ctx.beginPath();
                const cx2 = ex + e.w / 2;
                const cy2 = ey + e.h / 2;
                ctx.moveTo(cx2, cy2);
                ctx.lineTo(cx2 + Math.cos(e.aimAngle) * 600, cy2 + Math.sin(e.aimAngle) * 600);
                ctx.stroke();
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;
            }
        } else if (e.type === 'patrol') {
            // 3D depth shadow
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(ex + 4, ey + 6, e.w, e.h - 4);
            // Body with vertical gradient
            const bg = ctx.createLinearGradient(0, ey, 0, ey + e.h);
            bg.addColorStop(0, e.color);
            bg.addColorStop(0.5, e.color);
            bg.addColorStop(1, '#220000');
            ctx.fillStyle = bg;
            ctx.fillRect(ex + 4, ey + 8, e.w - 8, e.h - 12);
            // Lit highlight
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.fillRect(ex + 4, ey + 8, 3, e.h - 12);
            // Head
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(ex + 8, ey, e.w - 16, 12);
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(ex + 8, ey, e.w - 16, 2);
            // Glowing eyes
            ctx.fillStyle = '#ff0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 8;
            ctx.fillRect(ex + 10, ey + 3, 5, 5);
            ctx.fillRect(ex + e.w - 15, ey + 3, 5, 5);
            ctx.shadowBlur = 0;
            // Mechanical legs (pistons)
            ctx.fillStyle = '#444';
            ctx.fillRect(ex + 6, ey + e.h - 8, 8, 8);
            ctx.fillRect(ex + e.w - 14, ey + e.h - 8, 8, 8);
            ctx.fillStyle = '#888';
            ctx.fillRect(ex + 6, ey + e.h - 8, 8, 2);
            ctx.fillRect(ex + e.w - 14, ey + e.h - 8, 8, 2);
            // Gun arm with metallic finish
            ctx.fillStyle = '#aaa';
            ctx.fillRect(ex + (e.dir > 0 ? e.w - 2 : -10), ey + 14, 12, 5);
            ctx.fillStyle = '#666';
            ctx.fillRect(ex + (e.dir > 0 ? e.w - 2 : -10), ey + 17, 12, 2);
            // Gun barrel tip glow
            ctx.fillStyle = '#ff8800';
            ctx.shadowColor = '#ff4400';
            ctx.shadowBlur = 4;
            ctx.fillRect(ex + (e.dir > 0 ? e.w + 8 : -10), ey + 14, 2, 5);
            ctx.shadowBlur = 0;
        } else if (e.type === 'drone') {
            // 3D shadow
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(ex + e.w/2, ey + e.h + 4, e.w/2, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            // Drone body (hexagonal-ish) with radial gradient
            const dg = ctx.createRadialGradient(ex + e.w/2 - 3, ey + e.h/2 - 3, 2, ex + e.w/2, ey + e.h/2, e.w/2);
            dg.addColorStop(0, '#ffffff');
            dg.addColorStop(0.4, e.color);
            dg.addColorStop(1, '#0a1a2a');
            ctx.fillStyle = dg;
            ctx.beginPath();
            ctx.moveTo(ex + e.w / 2, ey);
            ctx.lineTo(ex + e.w, ey + e.h / 2);
            ctx.lineTo(ex + e.w / 2, ey + e.h);
            ctx.lineTo(ex, ey + e.h / 2);
            ctx.closePath();
            ctx.fill();
            // Outer glow rim
            ctx.strokeStyle = e.color;
            ctx.shadowColor = e.color;
            ctx.shadowBlur = 6;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.shadowBlur = 0;
            // Eye
            ctx.fillStyle = '#ff0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(ex + e.w / 2, ey + e.h / 2, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            // Spinning propellers
            const prop = performance.now() * 0.05;
            ctx.fillStyle = '#aaa';
            ctx.save();
            ctx.translate(ex - 1, ey + e.h/2 - 2);
            ctx.rotate(prop);
            ctx.fillRect(-7, 0, 14, 2);
            ctx.restore();
            ctx.save();
            ctx.translate(ex + e.w + 1, ey + e.h/2 - 2);
            ctx.rotate(-prop);
            ctx.fillRect(-7, 0, 14, 2);
            ctx.restore();
        } else if (e.type === 'turret') {
            // 3D ground shadow
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            ctx.ellipse(ex + e.w/2, ey + e.h + 3, e.w/2 + 2, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            // Base with gradient
            const tg = ctx.createLinearGradient(0, ey + e.h - 12, 0, ey + e.h);
            tg.addColorStop(0, '#888');
            tg.addColorStop(1, '#333');
            ctx.fillStyle = tg;
            ctx.fillRect(ex, ey + e.h - 10, e.w, 10);
            ctx.fillStyle = '#aaa';
            ctx.fillRect(ex, ey + e.h - 10, e.w, 2);
            // Turret body (dome with radial gradient)
            const td = ctx.createRadialGradient(ex + e.w/2 - 4, ey + e.h/2 - 6, 2, ex + e.w/2, ey + e.h/2 - 2, 16);
            td.addColorStop(0, '#ffffff');
            td.addColorStop(0.4, e.color);
            td.addColorStop(1, '#220000');
            ctx.fillStyle = td;
            ctx.beginPath();
            ctx.arc(ex + e.w / 2, ey + e.h / 2 - 2, 14, 0, Math.PI * 2);
            ctx.fill();
            // Aiming eye
            ctx.fillStyle = '#ff0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(ex + e.w/2, ey + e.h/2 - 2, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            // Barrel
            ctx.fillStyle = '#888';
            ctx.save();
            ctx.translate(ex + e.w / 2, ey + e.h / 2 - 2);
            ctx.rotate(e.angle);
            ctx.fillRect(0, -3, 22, 6);
            ctx.fillStyle = '#bbb';
            ctx.fillRect(0, -3, 22, 2);
            // Barrel tip glow
            ctx.fillStyle = '#ff8800';
            ctx.shadowColor = '#ff4400';
            ctx.shadowBlur = 6;
            ctx.fillRect(20, -2, 3, 4);
            ctx.shadowBlur = 0;
            ctx.restore();

        } else if (e.type === 'boss' || e.type === 'miniboss') {
            // HYDRA gets its own custom drawing
            if (e.subtype === 'hydra') {
                const main = e.color;
                // Drop shadow
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.beginPath();
                ctx.ellipse(ex + e.w/2, ey + e.h + 8, e.w/2 + 10, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                // Main body (massive)
                const bg = ctx.createRadialGradient(ex + e.w/2, ey + e.h/2, 10, ex + e.w/2, ey + e.h/2, e.w);
                bg.addColorStop(0, '#440000');
                bg.addColorStop(0.5, '#220000');
                bg.addColorStop(1, '#100000');
                ctx.fillStyle = bg;
                ctx.beginPath();
                ctx.ellipse(ex + e.w/2, ey + e.h/2 + 30, e.w/2 + 8, e.h/3, 0, 0, Math.PI * 2);
                ctx.fill();
                // Body scales/spikes
                ctx.fillStyle = '#660000';
                for (let s = 0; s < 8; s++) {
                    const sang = (s / 8) * Math.PI * 2;
                    const sx = ex + e.w/2 + Math.cos(sang) * (e.w/2);
                    const sy = ey + e.h/2 + 30 + Math.sin(sang) * (e.h/3 - 5);
                    ctx.beginPath();
                    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Glowing core
                ctx.fillStyle = '#ff4400';
                ctx.shadowColor = '#ff8800';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(ex + e.w/2, ey + e.h/2 + 30, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                // Heads (necks rising from the body)
                if (e.heads) {
                    for (const head of e.heads) {
                        if (!head.alive) {
                            // Stump (smoking)
                            const sx = ex + e.w/2 + head.x;
                            const sy = ey + e.h/2 + head.y;
                            ctx.fillStyle = '#330000';
                            ctx.beginPath();
                            ctx.arc(sx, sy + 20, 8, 0, Math.PI * 2);
                            ctx.fill();
                            // Smoke
                            ctx.globalAlpha = 0.4;
                            ctx.fillStyle = '#666';
                            for (let p2 = 0; p2 < 3; p2++) {
                                ctx.beginPath();
                                ctx.arc(sx + (Math.random() - 0.5) * 10, sy - p2 * 6 - 5, 4, 0, Math.PI * 2);
                                ctx.fill();
                            }
                            ctx.globalAlpha = 1;
                            continue;
                        }
                        const hx = ex + e.w/2 + head.x;
                        const hy = ey + e.h/2 + head.y;
                        const bodyX = ex + e.w/2;
                        const bodyY = ey + e.h/2 + 30;
                        // Neck (thick line from body to head)
                        ctx.strokeStyle = head.color;
                        ctx.shadowColor = head.color;
                        ctx.shadowBlur = 8;
                        ctx.lineWidth = 8;
                        ctx.beginPath();
                        ctx.moveTo(bodyX, bodyY);
                        // Curved neck
                        const ctrlX = (bodyX + hx) / 2;
                        const ctrlY = bodyY - 30;
                        ctx.quadraticCurveTo(ctrlX, ctrlY, hx, hy);
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                        // Neck scales
                        ctx.lineWidth = 4;
                        ctx.strokeStyle = '#220000';
                        ctx.beginPath();
                        ctx.moveTo(bodyX, bodyY);
                        ctx.quadraticCurveTo(ctrlX, ctrlY, hx, hy);
                        ctx.stroke();
                        ctx.lineWidth = 1;
                        // Head body
                        ctx.fillStyle = head.color;
                        ctx.shadowColor = head.color;
                        ctx.shadowBlur = 14;
                        ctx.beginPath();
                        ctx.ellipse(hx, hy, 18, 14, 0, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                        // Jaw
                        ctx.fillStyle = '#220000';
                        ctx.beginPath();
                        ctx.ellipse(hx, hy + 6, 14, 8, 0, 0, Math.PI * 2);
                        ctx.fill();
                        // Teeth
                        ctx.fillStyle = '#fff';
                        for (let t = -2; t <= 2; t++) {
                            ctx.fillRect(hx + t * 4 - 1, hy + 4, 2, 4);
                        }
                        // Eyes
                        ctx.fillStyle = '#ffff00';
                        ctx.shadowColor = '#ffff00';
                        ctx.shadowBlur = 8;
                        ctx.fillRect(hx - 8, hy - 4, 4, 3);
                        ctx.fillRect(hx + 4, hy - 4, 4, 3);
                        ctx.shadowBlur = 0;
                        // Head HP bar
                        ctx.fillStyle = '#222';
                        ctx.fillRect(hx - 16, hy - 22, 32, 3);
                        ctx.fillStyle = head.color;
                        ctx.fillRect(hx - 16, hy - 22, (head.hp / head.maxHp) * 32, 3);
                    }
                }
            } else {
                drawBossBody(ex, ey, e);
            }
        } else {
            // (intentionally unused — kept structure)
        }

        // Health bar
        if (e.hp < e.maxHp) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#333';
            ctx.fillRect(ex, ey - 10, e.w, 5);
            ctx.fillStyle = e.hp > e.maxHp * 0.3 ? '#00ff00' : '#ff0000';
            ctx.fillRect(ex, ey - 10, (e.hp / e.maxHp) * e.w, 5);
        }
        ctx.restore();
    }
}

function drawPlatforms() {
    // First pass - draw shadows for 3D depth
    for (const p of platforms) {
        if (p.type === 'spike' || p.type === 'laser' || p.type === 'recovery') continue;
        const px = p.x - camera.x;
        const py = p.y - camera.y;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(px + 6, py + 6, p.w, p.h);
    }

    for (const p of platforms) {
        const px = p.x - camera.x;
        const py = p.y - camera.y;
        ctx.save();

        if (p.type === 'ground') {
            // Side face for depth
            ctx.fillStyle = '#0a1a0a';
            ctx.fillRect(px - 6, py + 6, p.w + 6, p.h);
            // Gradient top (PS-style lit ground)
            const gg = ctx.createLinearGradient(0, py, 0, py + p.h);
            gg.addColorStop(0, '#2a4a2a');
            gg.addColorStop(0.4, '#1a2a1a');
            gg.addColorStop(1, '#080a08');
            ctx.fillStyle = gg;
            ctx.fillRect(px, py, p.w, p.h);
            // Bright top edge
            ctx.fillStyle = '#00ff66';
            ctx.shadowColor = '#00ff44';
            ctx.shadowBlur = 8;
            ctx.fillRect(px, py, p.w, 3);
            ctx.shadowBlur = 0;
            // Subtle highlight just below
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.fillRect(px, py + 4, p.w, 4);
            // Grid lines
            ctx.strokeStyle = 'rgba(0, 100, 50, 0.5)';
            ctx.lineWidth = 1;
            for (let gx = 0; gx < p.w; gx += 30) {
                ctx.beginPath();
                ctx.moveTo(px + gx, py);
                ctx.lineTo(px + gx, py + p.h);
                ctx.stroke();
            }
        } else if (p.type === 'recovery') {
            // Recovery platform - glowing safety net
            ctx.fillStyle = '#1a2a2a';
            ctx.fillRect(px, py, p.w, p.h);
            ctx.fillStyle = '#00ffaa';
            ctx.shadowColor = '#00ffaa';
            ctx.shadowBlur = 6;
            ctx.fillRect(px, py, p.w, 3);
        } else if (p.type === 'spike') {
            // Spike trap - red triangles pointing up
            ctx.fillStyle = '#330000';
            ctx.fillRect(px, py, p.w, p.h);
            ctx.fillStyle = '#ff3300';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 8;
            for (let sx = 0; sx < p.w; sx += 12) {
                ctx.beginPath();
                ctx.moveTo(px + sx, py + p.h);
                ctx.lineTo(px + sx + 6, py);
                ctx.lineTo(px + sx + 12, py + p.h);
                ctx.closePath();
                ctx.fill();
            }
        } else if (p.type === 'lava') {
            // Lava pool - animated bubbling
            const bubbleT = performance.now() * 0.002;
            // Glowing bottom layer
            ctx.fillStyle = '#660000';
            ctx.fillRect(px, py, p.w, p.h);
            // Hot lava surface
            ctx.fillStyle = '#ff3300';
            ctx.shadowColor = '#ff4400';
            ctx.shadowBlur = 18;
            ctx.fillRect(px, py, p.w, 12);
            // Bright top
            ctx.fillStyle = '#ffaa00';
            ctx.shadowBlur = 22;
            for (let bx = 0; bx < p.w; bx += 18) {
                const wave = Math.sin(bubbleT + bx * 0.05) * 2;
                ctx.fillRect(px + bx, py + wave, 14, 3);
            }
            // Bubbles rising
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffff00';
            for (let bi = 0; bi < 3; bi++) {
                const bx = (Math.sin(bubbleT + bi * 2) * 0.5 + 0.5) * p.w;
                const by = ((performance.now() * 0.05 + bi * 30) % 30);
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.arc(px + bx, py + by, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        } else if (p.type === 'laser') {
            // Toggling laser
            const phase = (Math.floor(performance.now() / 700) + (p.phase || 0)) % 2;
            if (phase === 0) {
                // Active
                ctx.fillStyle = '#ff0000';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 16;
                ctx.fillRect(px, py + 2, p.w, p.h - 4);
                ctx.fillStyle = '#ffaaaa';
                ctx.fillRect(px, py + p.h / 2 - 1, p.w, 2);
            } else {
                // Inactive (warning)
                ctx.fillStyle = '#440000';
                ctx.fillRect(px, py + p.h / 2 - 1, p.w, 2);
            }
        } else if (p.type === 'breakable') {
            // Breakable cover - wooden crate look
            const hpFrac = (p.hp ?? 60) / 60;
            ctx.fillStyle = '#553322';
            ctx.fillRect(px, py, p.w, p.h);
            // Cracks based on damage
            ctx.strokeStyle = '#aa6622';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 2, py + 2, p.w - 4, p.h - 4);
            if (hpFrac < 0.6) {
                ctx.beginPath();
                ctx.moveTo(px + p.w * 0.3, py + 4);
                ctx.lineTo(px + p.w * 0.5, py + p.h * 0.5);
                ctx.lineTo(px + p.w * 0.7, py + p.h - 4);
                ctx.stroke();
            }
            if (hpFrac < 0.3) {
                ctx.beginPath();
                ctx.moveTo(px + 4, py + p.h * 0.3);
                ctx.lineTo(px + p.w - 4, py + p.h * 0.7);
                ctx.stroke();
            }
            // Inner planks
            ctx.fillStyle = '#664433';
            ctx.fillRect(px + 4, py + p.h / 2 - 1, p.w - 8, 2);
        } else if (p.type === 'platform') {
            // Side face for depth
            ctx.fillStyle = '#050a14';
            ctx.fillRect(px - 4, py + 4, p.w + 4, p.h);
            // Gradient body
            const pg = ctx.createLinearGradient(0, py, 0, py + p.h);
            pg.addColorStop(0, '#3a4a6a');
            pg.addColorStop(0.5, '#1a1a2a');
            pg.addColorStop(1, '#0a0a18');
            ctx.fillStyle = pg;
            ctx.fillRect(px, py, p.w, p.h);
            // Bright neon top
            ctx.fillStyle = '#44ccff';
            ctx.shadowColor = '#00aaff';
            ctx.shadowBlur = 10;
            ctx.fillRect(px, py, p.w, 2);
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(px, py + 3, p.w, 2);
        } else if (p.type === 'wall') {
            // Side face
            ctx.fillStyle = '#050a14';
            ctx.fillRect(px - 4, py + 4, p.w + 4, p.h);
            // Gradient (lit from above)
            const wg = ctx.createLinearGradient(0, py, 0, py + p.h);
            wg.addColorStop(0, '#3a2a5a');
            wg.addColorStop(0.5, '#1a1530');
            wg.addColorStop(1, '#080510');
            ctx.fillStyle = wg;
            ctx.fillRect(px, py, p.w, p.h);
            // Edge glow
            ctx.fillStyle = '#aa44ff';
            ctx.shadowColor = '#8800ff';
            ctx.shadowBlur = 6;
            ctx.fillRect(px, py, 2, p.h);
            ctx.fillRect(px + p.w - 2, py, 2, p.h);
            ctx.shadowBlur = 0;
            // Highlight on left edge
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(px + 2, py, 2, p.h);
        }
        ctx.restore();
    }
}

function drawBullets() {
    // Player bullets - color and size from weapon
    for (const b of bullets) {
        ctx.fillStyle = b.color || '#ffff66';
        ctx.shadowColor = b.glow || '#ffff00';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(b.x - camera.x, b.y - camera.y, b.size || 6, 0, Math.PI * 2);
        ctx.fill();
        // Inner core for plasma/railgun
        if (b.size >= 8) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(b.x - camera.x, b.y - camera.y, (b.size || 6) * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    // Enemy bullets
    for (const b of enemyBullets) {
        ctx.fillStyle = b.big ? '#ff0066' : '#ff3333';
        ctx.shadowColor = b.big ? '#ff0066' : '#ff3333';
        ctx.shadowBlur = b.big ? 12 : 6;
        ctx.beginPath();
        ctx.arc(b.x - camera.x, b.y - camera.y, b.big ? 9 : 5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;
}

function drawParticles() {
    for (const p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - camera.x - p.size / 2, p.y - camera.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    // Float texts
    for (const t of floatTexts) {
        ctx.globalAlpha = Math.min(1, t.life / 30);
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 8;
        ctx.font = 'bold 16px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x - camera.x, t.y - camera.y);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
}

// Render expanding shockwave rings (called in world space)
function drawShockwaves() {
    for (const s of shockwaves) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.strokeStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(s.x - camera.x, s.y - camera.y, s.r, 0, Math.PI * 2);
        ctx.stroke();
        // Inner soft ring
        ctx.globalAlpha = Math.max(0, s.alpha * 0.4);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(s.x - camera.x, s.y - camera.y, s.r * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

// Floating damage numbers above enemies. Call after particles so they sit on top.
function drawDamageNumbers() {
    for (const d of damageNumbers) {
        const a = Math.max(0, d.life / d.maxLife);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = d.color;
        ctx.shadowColor = d.color;
        ctx.shadowBlur = 8;
        ctx.font = `bold ${d.size}px Courier New`;
        ctx.textAlign = 'center';
        ctx.fillText(d.text, d.x - camera.x, d.y - camera.y);
        ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
}

// Twinkling parallax starfield drawn behind the level (very subtle, depth)
function ensureBgStars() {
    if (bgStars.length > 0) return;
    for (let i = 0; i < 80; i++) {
        bgStars.push({
            x: Math.random() * 4000,
            y: Math.random() * 380,
            size: 1 + Math.random() * 1.6,
            speed: 0.15 + Math.random() * 0.5,
            twinkle: Math.random() * Math.PI * 2
        });
    }
}
function drawBgStars() {
    ensureBgStars();
    ctx.save();
    for (const s of bgStars) {
        s.twinkle += 0.04;
        const px = ((s.x - camera.x * s.speed) % 4000 + 4000) % 4000;
        const screenX = (px * (canvas.width / 4000));   // distribute across screen
        const screenY = s.y;
        const a = 0.35 + Math.sin(s.twinkle) * 0.25;
        ctx.fillStyle = `rgba(180, 220, 255, ${a})`;
        ctx.fillRect(screenX, screenY, s.size, s.size);
    }
    ctx.restore();
}

// Full-screen red flash overlay when the player gets hit (and gold flash on crit)
function drawScreenFlashes() {
    if (hitFlash > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 30, 40, ${hitFlash * 0.45})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // pulse vignette ring
        const vg = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.width * 0.25,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.7
        );
        vg.addColorStop(0, `rgba(255, 0, 0, 0)`);
        vg.addColorStop(1, `rgba(255, 0, 0, ${hitFlash * 0.55})`);
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
    if (critFlash > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 220, 80, ${critFlash * 0.22})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
}

// Combo / kill-streak banner that appears at the top center when comboCount > 5
function drawComboBanner() {
    if (comboCount < 5) return;
    const t = performance.now() * 0.005;
    const scale = 1 + Math.sin(t * 4) * 0.04;
    const baseColor = comboCount >= 20 ? '#ff44aa' : (comboCount >= 12 ? '#ffaa44' : '#ffdd44');

    ctx.save();
    ctx.translate(canvas.width / 2, 110);
    ctx.scale(scale, scale);
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = 16;
    ctx.fillStyle = baseColor;
    ctx.font = 'bold 28px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(`x${comboCount} COMBO`, 0, 0);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Courier New';
    const tier = comboCount >= 20 ? 'UNREAL' : comboCount >= 12 ? 'RAMPAGE' : comboCount >= 8 ? 'KILLING SPREE' : 'STREAK';
    ctx.fillText(tier, 0, 16);
    ctx.restore();
    ctx.textAlign = 'left';
}

function drawDashTrails() {
    for (let i = dashTrails.length - 1; i >= 0; i--) {
        const t = dashTrails[i];
        t.life -= 0.1;
        if (t.life <= 0) { dashTrails.splice(i, 1); continue; }
        ctx.globalAlpha = t.life * 0.4;
        ctx.fillStyle = '#00ffaa';
        ctx.fillRect(t.x - camera.x, t.y - camera.y, t.w, t.h);
    }
    ctx.globalAlpha = 1;
}

function drawWarning() {
    if (!activeWarning) return;
    const t = activeWarning.timer;
    const flash = Math.floor(t / 8) % 2 === 0;
    const alpha = t > 30 ? 1 : t / 30;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Background bar
    const barH = 60;
    const barY = 90;
    ctx.fillStyle = flash ? 'rgba(255, 0, 0, 0.4)' : 'rgba(80, 0, 0, 0.6)';
    ctx.fillRect(0, barY, canvas.width, barH);

    // Striped border
    ctx.fillStyle = flash ? '#ffaa00' : '#ff0000';
    for (let x = 0; x < canvas.width; x += 30) {
        ctx.fillRect(x, barY - 3, 15, 3);
        ctx.fillRect(x + 15, barY + barH, 15, 3);
    }

    // Warning text
    ctx.fillStyle = flash ? '#ffffff' : '#ff3333';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 15;
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(activeWarning.text, canvas.width / 2, barY + 38);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
    ctx.restore();
}

function drawCharSelect() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00ffaa';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 18;
    ctx.font = 'bold 38px Courier New';
    ctx.textAlign = 'center';
    if (gameState === 'midCharSelect') {
        ctx.fillText('CHOOSE YOUR HERO', canvas.width / 2, 70);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#888';
        ctx.font = '14px Courier New';
        ctx.fillText(`Next: ${STAGES[currentStage].name}`, canvas.width / 2, 95);
    } else {
        ctx.fillText('SELECT CHARACTER', canvas.width / 2, 70);
    }
    ctx.shadowBlur = 0;

    const cardW = 152;
    const cardH = 220;
    const totalW = CHARACTERS.length * (cardW + 8) - 8;
    const startX = canvas.width / 2 - totalW / 2;
    const cardY = 110;

    for (let i = 0; i < CHARACTERS.length; i++) {
        const c = CHARACTERS[i];
        const cx = startX + i * (cardW + 8);
        const isSel = i === charSelectIndex;

        // Card bg
        ctx.fillStyle = c.unlocked ? (isSel ? '#222' : '#111') : '#0a0a0a';
        ctx.fillRect(cx, cardY, cardW, cardH);
        ctx.strokeStyle = isSel ? c.color : (c.unlocked ? '#444' : '#222');
        ctx.lineWidth = isSel ? 3 : 1;
        ctx.strokeRect(cx, cardY, cardW, cardH);

        // Character preview - simple body
        ctx.save();
        ctx.translate(cx + cardW / 2, cardY + 75);
        ctx.fillStyle = c.unlocked ? c.color : '#333';
        ctx.shadowColor = c.unlocked ? c.color : '#000';
        ctx.shadowBlur = c.unlocked && isSel ? 16 : 6;
        // Body
        ctx.fillRect(-14, -30, 28, 40);
        // Head
        ctx.fillStyle = c.unlocked ? c.accent : '#444';
        ctx.fillRect(-10, -45, 20, 14);
        // Visor
        ctx.fillStyle = c.unlocked ? '#fff' : '#666';
        ctx.fillRect(-2, -41, 8, 4);
        ctx.restore();

        // Lock overlay
        if (!c.unlocked) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(cx, cardY, cardW, cardH);
            ctx.fillStyle = '#888';
            ctx.font = 'bold 32px Courier New';
            ctx.fillText('LOCKED', cx + cardW / 2, cardY + 120);
            ctx.font = '11px Courier New';
            ctx.fillStyle = '#aaa';
            ctx.fillText(`Beat Stage ${c.unlockedBy}`, cx + cardW / 2, cardY + 142);
        }

        // Name
        ctx.fillStyle = c.unlocked ? c.color : '#666';
        ctx.font = 'bold 15px Courier New';
        ctx.fillText(c.name, cx + cardW / 2, cardY + 165);

        // Stats mini-block (only on unlocked)
        if (c.unlocked) {
            ctx.fillStyle = '#888';
            ctx.font = '10px Courier New';
            ctx.fillText(`HP ${c.maxHp}  SPD ${c.speed.toFixed(1)}`, cx + cardW / 2, cardY + 184);
            ctx.fillText(`DMG x${c.dmgMul.toFixed(2)}  FR x${(1 / c.fireRateMul).toFixed(2)}`, cx + cardW / 2, cardY + 200);
        }
    }

    // Description of selected character
    const sel = CHARACTERS[charSelectIndex];
    ctx.fillStyle = sel.unlocked ? sel.color : '#888';
    ctx.font = 'bold 18px Courier New';
    ctx.fillText(sel.name, canvas.width / 2, 380);
    ctx.fillStyle = '#ccc';
    ctx.font = '13px Courier New';
    ctx.fillText(sel.desc, canvas.width / 2, 405);

    // Hint
    ctx.fillStyle = '#aaa';
    ctx.font = '13px Courier New';
    ctx.fillText('LEFT/RIGHT  to choose,   ENTER   to start', canvas.width / 2, 450);
    if (!sel.unlocked) {
        ctx.fillStyle = '#ff6644';
        ctx.fillText('LOCKED  -  defeat the boss of stage ' + sel.unlockedBy + ' to unlock', canvas.width / 2, 475);
    }

    ctx.textAlign = 'left';
}

function drawIntro() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#00ffaa';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 25;
    ctx.font = 'bold 56px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('NEON RUSH', canvas.width / 2, 90);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#aaa';
    ctx.font = '16px Courier New';
    ctx.fillText('A Parkour Shooter Mission', canvas.width / 2, 120);

    // Mission briefing
    ctx.fillStyle = '#ff6644';
    ctx.font = '14px Courier New';
    ctx.fillText('MISSION: INFILTRATE THE FACILITY. DESTROY THE MEGA-BOT.', canvas.width / 2, 155);

    // Controls header
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 22px Courier New';
    ctx.fillText('CONTROLS', canvas.width / 2, 200);

    // Controls list
    ctx.fillStyle = '#ffffff';
    ctx.font = '15px Courier New';
    ctx.textAlign = 'left';
    const cx = canvas.width / 2 - 200;
    const lines = [
        ['MOVE',          'A / D  or  ← →'],
        ['JUMP',          '↑  or  W  or  SPACE'],
        ['DOUBLE JUMP',   'Press JUMP again in the air'],
        ['WALL JUMP',     'Jump while sliding on a wall'],
        ['DASH',          'SHIFT  (perfect-dodge bullets for slow-mo!)'],
        ['DODGE ROLL',    'CTRL  (i-frames, fast horizontal escape)'],
        ['PARRY',         'C  (deflect enemy bullets — 14-frame window)'],
        ['GROUND POUND',  'S/↓ in air  (slam down — AOE shockwave damage)'],
        ['SLIDE',         'S  or  ↓  while running on the ground'],
        ['SHOOT',         'F  (bullets blocked by walls - use cover)'],
        ['MELEE COMBO',   'G  (3-hit combo, 3rd hit explodes)'],
        ['ABILITY',       'Q  (each character has a unique special)'],
        ['SWAP HERO',     'TAB  (cycle to next unlocked character)'],
        ['SHOP',          'E  (when near a shop  -  spend coins)'],
        ['RESTART',       'R  (after death or victory)']
    ];
    let y = 235;
    for (const [k, v] of lines) {
        ctx.fillStyle = '#00ffaa';
        ctx.fillText(k, cx, y);
        ctx.fillStyle = '#ddd';
        ctx.fillText(v, cx + 130, y);
        y += 26;
    }

    // Tips
    ctx.fillStyle = '#ffaa00';
    ctx.font = '13px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('TIP: After each boss, find a CAGE and shoot it to free a captive who fights with you.', canvas.width / 2, y + 15);
    ctx.fillText('TIP: Walls block bullets - use cover. Headshots = CRIT. Dash through bullets for slow-mo.', canvas.width / 2, y + 35);

    // Start prompt
    const blink = Math.floor(performance.now() / 400) % 2 === 0;
    if (blink) {
        ctx.fillStyle = '#00ffaa';
        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 15;
        ctx.font = 'bold 20px Courier New';
        ctx.fillText('PRESS  ENTER  TO START', canvas.width / 2, canvas.height - 40);
        ctx.shadowBlur = 0;
    }
    ctx.textAlign = 'left';
}

function drawSwitches() {
    for (const sw of switches) {
        const sx = sw.x - camera.x;
        const sy = sw.y - camera.y;
        ctx.save();
        if (sw.activated) {
            ctx.fillStyle = '#00ffaa';
            ctx.shadowColor = '#00ffaa';
            ctx.shadowBlur = 14;
        } else {
            const pulse = Math.sin(performance.now() * 0.005) * 0.5 + 0.5;
            ctx.fillStyle = '#ff0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 8 + pulse * 8;
        }
        ctx.fillRect(sx, sy, sw.w, sw.h);
        // Inner X / O pattern
        ctx.fillStyle = '#222';
        ctx.fillRect(sx + 4, sy + 4, sw.w - 8, sw.h - 8);
        ctx.fillStyle = sw.activated ? '#00ff00' : '#ff4444';
        if (sw.activated) {
            // Checkmark
            ctx.fillRect(sx + 8, sy + 14, 4, 4);
            ctx.fillRect(sx + 12, sy + 18, 4, 4);
            ctx.fillRect(sx + 16, sy + 14, 4, 4);
            ctx.fillRect(sx + 20, sy + 10, 4, 4);
        } else {
            // Bullseye
            ctx.beginPath();
            ctx.arc(sx + sw.w / 2, sy + sw.h / 2, 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(sx + sw.w / 2, sy + sw.h / 2, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

// Wall of red light beams blocking passage. Has many parallel beams that
// shimmer animated. When disabled, fades to dim grey.
function drawLaserGrids() {
    const tnow = performance.now();
    for (const lg of laserGrids) {
        const gx = lg.x - camera.x;
        const gy = lg.y - camera.y;
        ctx.save();
        if (lg.disabled) {
            // OFF state — dim metal frame only
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            ctx.strokeRect(gx, gy, lg.w, lg.h);
            ctx.fillStyle = 'rgba(80, 80, 80, 0.18)';
            ctx.fillRect(gx, gy, lg.w, lg.h);
            // Dim diagonal beams
            ctx.strokeStyle = '#553333';
            ctx.lineWidth = 1;
            const beamCount = 6;
            for (let i = 0; i < beamCount; i++) {
                const yy = gy + (i / (beamCount - 1)) * lg.h;
                ctx.beginPath();
                ctx.moveTo(gx, yy);
                ctx.lineTo(gx + lg.w, yy);
                ctx.stroke();
            }
        } else {
            // ON state — bright red beams scrolling
            const pulse = 0.65 + Math.sin(tnow * 0.012) * 0.2;
            // Outer glow rectangle
            ctx.fillStyle = `rgba(255, 30, 60, ${0.18 * pulse})`;
            ctx.fillRect(gx - 4, gy - 4, lg.w + 8, lg.h + 8);
            // Frame
            ctx.strokeStyle = '#ff2244';
            ctx.shadowColor = '#ff0044';
            ctx.shadowBlur = 16;
            ctx.lineWidth = 2;
            ctx.strokeRect(gx, gy, lg.w, lg.h);
            // Horizontal red beams
            ctx.shadowBlur = 12;
            const beamCount = 6;
            for (let i = 0; i < beamCount; i++) {
                const yy = gy + (i / (beamCount - 1)) * lg.h;
                const a = 0.7 + Math.sin(tnow * 0.01 + i) * 0.3;
                ctx.fillStyle = `rgba(255, 60, 80, ${a})`;
                ctx.fillRect(gx, yy - 1, lg.w, 2);
            }
            // Scrolling shimmer
            const shim = (tnow * 0.4) % lg.w;
            ctx.fillStyle = 'rgba(255, 200, 200, 0.6)';
            ctx.fillRect(gx + shim - 4, gy, 4, lg.h);
            ctx.shadowBlur = 0;
            // Endpoint emitters
            ctx.fillStyle = '#ff8888';
            ctx.shadowColor = '#ff0044';
            ctx.shadowBlur = 18;
            ctx.fillRect(gx - 6, gy - 4, 6, lg.h + 8);
            ctx.fillRect(gx + lg.w, gy - 4, 6, lg.h + 8);
            ctx.shadowBlur = 0;
        }
        ctx.restore();
    }
}

// Wall-mounted hackable terminal. Shoot to disable the linked laser grid.
function drawTerminals() {
    for (const term of terminals) {
        const tx = term.x - camera.x;
        const ty = term.y - camera.y;
        ctx.save();
        // Housing
        ctx.fillStyle = term.disabled ? '#1a2a30' : '#22384a';
        ctx.fillRect(tx, ty, term.w, term.h);
        ctx.strokeStyle = term.disabled ? '#446677' : '#88aacc';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx, ty, term.w, term.h);
        // Screen
        const screenX = tx + 4;
        const screenY = ty + 4;
        const screenW = term.w - 8;
        const screenH = term.h - 8;
        ctx.fillStyle = term.disabled ? '#003322' : '#220000';
        ctx.fillRect(screenX, screenY, screenW, screenH);
        // Text glyphs
        const tnow = performance.now();
        const flicker = term.disabled ? 0.6 : 0.8 + Math.sin(tnow * 0.012) * 0.2;
        ctx.fillStyle = term.disabled ? `rgba(0, 255, 170, ${flicker})` : `rgba(255, 80, 80, ${flicker})`;
        ctx.shadowColor = term.disabled ? '#00ffaa' : '#ff2244';
        ctx.shadowBlur = 10;
        ctx.font = 'bold 9px Courier New';
        ctx.textAlign = 'center';
        const txCenter = tx + term.w / 2;
        const tyCenter = ty + term.h / 2 + 3;
        ctx.fillText(term.disabled ? 'OFFLINE' : 'ARMED', txCenter, tyCenter);
        ctx.shadowBlur = 0;
        // HP bar (for active terminals)
        if (!term.disabled && term.hp < term.maxHp) {
            ctx.fillStyle = '#222';
            ctx.fillRect(tx, ty - 8, term.w, 4);
            ctx.fillStyle = '#ff8844';
            ctx.fillRect(tx, ty - 8, term.w * (term.hp / term.maxHp), 4);
        }
        // Floating "TERMINAL" label
        if (!term.disabled) {
            const blink = Math.sin(tnow * 0.005) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 220, 80, ${0.7 + blink * 0.3})`;
            ctx.font = 'bold 10px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('▼ TERMINAL ▼', txCenter, ty - 14);
        }
        ctx.restore();
        ctx.textAlign = 'left';
    }
}

// Glowing key card pickup. Hovers and bobs in place.
function drawKeyPickups() {
    const tnow = performance.now();
    for (const k of keyPickups) {
        if (k.collected) continue;
        const bob = Math.sin(tnow * 0.004 + (k.bobOffset || 0)) * 5;
        const kx = k.x - camera.x;
        const ky = k.y - camera.y + bob;
        // Halo
        const pulse = 0.6 + Math.sin(tnow * 0.008) * 0.4;
        ctx.save();
        ctx.fillStyle = `rgba(255, 220, 80, ${0.18 * pulse})`;
        ctx.beginPath();
        ctx.arc(kx + k.w / 2, ky + k.h / 2, 26, 0, Math.PI * 2);
        ctx.fill();
        // Key card body
        ctx.fillStyle = '#ffdd44';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 18;
        ctx.fillRect(kx, ky, k.w, k.h);
        // Hole / chip
        ctx.fillStyle = '#222';
        ctx.fillRect(kx + k.w - 6, ky + k.h / 2 - 2, 4, 4);
        // Magnetic stripe
        ctx.fillStyle = '#aa6600';
        ctx.fillRect(kx + 2, ky + k.h - 4, k.w - 4, 2);
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(kx + 1, ky + 1, k.w - 2, 2);
        ctx.shadowBlur = 0;
        // Floating label "KEY"
        const blink = Math.sin(tnow * 0.006) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 220, 80, ${0.7 + blink * 0.3})`;
        ctx.font = 'bold 11px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('🔑 KEY', kx + k.w / 2, ky - 6);
        ctx.restore();
        ctx.textAlign = 'left';
    }
}

function drawBossGates() {
    for (const bg of bossGates) {
        const gx = bg.x - camera.x;
        const gy = bg.y - camera.y;
        ctx.save();
        if (bg.open) {
            // Faded outline only
            ctx.strokeStyle = bg.color;
            ctx.globalAlpha = 0.2;
            ctx.lineWidth = 2;
            ctx.strokeRect(gx, gy, bg.w, bg.h);
            ctx.globalAlpha = 1;
        } else {
            // Animation: slides apart as anim grows
            const open = bg.animTimer / 60;  // 0..1
            // Frame
            ctx.fillStyle = '#222';
            ctx.fillRect(gx - 8, gy - 8, bg.w + 16, bg.h + 16);
            ctx.fillStyle = '#444';
            ctx.fillRect(gx - 4, gy - 4, bg.w + 8, bg.h + 8);
            // Two halves sliding apart
            const halfW = bg.w / 2;
            const slideAmt = open * (bg.h / 2);
            // Top half slides up
            const topY = gy - slideAmt;
            ctx.fillStyle = bg.color;
            ctx.shadowColor = bg.color;
            ctx.shadowBlur = 18;
            ctx.fillRect(gx, topY, bg.w, bg.h / 2);
            // Bottom half slides down
            const botY = gy + bg.h / 2 + slideAmt;
            ctx.fillRect(gx, botY, bg.w, bg.h / 2);
            // Glowing seam in the middle
            ctx.shadowBlur = 22;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(gx, topY + bg.h / 2 - 3, bg.w, 6);
            ctx.fillRect(gx, botY - 3, bg.w, 6);
            ctx.shadowBlur = 0;
            // Energy particles flowing through
            const pulse = (performance.now() * 0.005) % 1;
            for (let i = 0; i < 6; i++) {
                const py2 = gy + ((i / 6 + pulse) % 1) * bg.h;
                ctx.globalAlpha = 0.5 + Math.sin(performance.now() * 0.01 + i) * 0.3;
                ctx.fillStyle = bg.color;
                ctx.fillRect(gx + 5 + Math.sin(py2 * 0.05) * 6, py2, 4, 4);
            }
            ctx.globalAlpha = 1;
            // BOSS APPROACH label
            ctx.fillStyle = bg.color;
            ctx.font = 'bold 11px Courier New';
            ctx.textAlign = 'center';
            ctx.shadowColor = bg.color;
            ctx.shadowBlur = 8;
            ctx.fillText('▼ BOSS ZONE ▼', gx + bg.w / 2, gy - 16);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
        }
        ctx.restore();
    }
}

function drawExitPortals() {
    for (const ep of exitPortals) {
        const ex = ep.x - camera.x;
        const ey = ep.y - camera.y;
        ctx.save();
        // Pulsing portal
        const pulse = Math.sin(performance.now() * 0.005) * 0.3 + 0.7;
        // Outer ring
        ctx.strokeStyle = '#00ffaa';
        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 22 * pulse;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(ex + ep.w/2, ey + ep.h/2, ep.w/2, ep.h/2, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Inner glow
        ctx.fillStyle = 'rgba(0, 255, 170, ' + (0.3 + pulse * 0.2) + ')';
        ctx.beginPath();
        ctx.ellipse(ex + ep.w/2, ey + ep.h/2, ep.w/2 * 0.7, ep.h/2 * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        // Center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(ex + ep.w/2, ey + ep.h/2, ep.w/2 * 0.3, ep.h/2 * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Spinning ring particles
        for (let i = 0; i < 6; i++) {
            const ang = performance.now() * 0.003 + i * (Math.PI / 3);
            const r = ep.w/2 * 0.8;
            const px = ex + ep.w/2 + Math.cos(ang) * r;
            const py = ey + ep.h/2 + Math.sin(ang) * r * 0.7;
            ctx.fillStyle = '#88ffaa';
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        // Label
        ctx.fillStyle = '#00ffaa';
        ctx.font = 'bold 12px Courier New';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 8;
        ctx.fillText('NEXT STAGE', ex + ep.w / 2, ey - 8);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
        ctx.restore();
    }
}

function drawArenaGates() {
    for (const ag of arenaGates) {
        const gx = ag.x - camera.x;
        const gy = ag.y - camera.y;
        ctx.save();
        if (ag.open) {
            // Faded - opening up
            ctx.globalAlpha = 0.2;
            ctx.strokeStyle = '#00ff44';
            ctx.lineWidth = 2;
            ctx.strokeRect(gx, gy, ag.w, ag.h);
            ctx.globalAlpha = 1;
        } else {
            // Heavy metal arena gate
            ctx.fillStyle = '#1a1a22';
            ctx.fillRect(gx, gy, ag.w, ag.h);
            // Vertical metal bars
            ctx.fillStyle = '#666';
            ctx.fillRect(gx + 4, gy, 4, ag.h);
            ctx.fillRect(gx + 14, gy, 4, ag.h);
            ctx.fillRect(gx + 24, gy, 4, ag.h);
            // Top and bottom plate
            ctx.fillStyle = '#aa6622';
            ctx.fillRect(gx, gy, ag.w, 12);
            ctx.fillRect(gx, gy + ag.h - 12, ag.w, 12);
            // Glowing red warning lights
            const blink = Math.floor(performance.now() / 250) % 2 === 0;
            ctx.fillStyle = blink ? '#ff0000' : '#660000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = blink ? 12 : 4;
            ctx.fillRect(gx + 2, gy + 4, 4, 4);
            ctx.fillRect(gx + ag.w - 6, gy + 4, 4, 4);
            ctx.fillRect(gx + 2, gy + ag.h - 8, 4, 4);
            ctx.fillRect(gx + ag.w - 6, gy + ag.h - 8, 4, 4);
            ctx.shadowBlur = 0;
            // "LOCKED" label
            ctx.fillStyle = '#ff3333';
            ctx.font = 'bold 11px Courier New';
            ctx.save();
            ctx.translate(gx + ag.w / 2, gy + ag.h / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.textAlign = 'center';
            ctx.fillText('— LOCKDOWN —', 0, 4);
            ctx.restore();
            ctx.textAlign = 'left';
        }
        ctx.restore();
    }
}

function drawDoors() {
    for (const d of doors) {
        const dx = d.x - camera.x;
        const dy = d.y - camera.y;
        ctx.save();
        if (d.open) {
            // Show vanishing effect (faded outline)
            ctx.strokeStyle = '#00ff44';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.2;
            ctx.strokeRect(dx, dy, d.w, d.h);
        } else {
            // Locked door - red barrier
            ctx.fillStyle = '#220000';
            ctx.fillRect(dx, dy, d.w, d.h);
            // Animated stripes
            const phase = Math.floor(performance.now() / 200) % 2;
            ctx.fillStyle = phase === 0 ? '#ff3333' : '#aa0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 12;
            for (let i = 0; i < d.h; i += 30) {
                ctx.fillRect(dx, dy + i + (phase * 15), d.w, 8);
            }
            // Lock indicator: count switches done
            const grp = d.group;
            const total = switches.filter(s => s.group === grp).length;
            const done = switches.filter(s => s.group === grp && s.activated).length;
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(`${done}/${total}`, dx + d.w / 2, dy - 5);
            ctx.textAlign = 'left';
        }
        ctx.restore();
    }
}

function drawFogOverlay() {
    // Vignette darkening at edges (cinematic feel) — stronger now for depth.
    const vg = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.width * 0.18, canvas.width/2, canvas.height/2, canvas.width * 0.7);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(0.7, 'rgba(0,0,0,0.25)');
    vg.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Distance fog — stronger at the top (sky receding) and bottom (close ground haze).
    let fogColor = 'rgba(140, 200, 255, 0.10)';
    let bottomTint = 'rgba(0, 60, 80, 0.18)';
    if (arenaTheme) {
        switch (arenaTheme.name) {
            case 'inferno': fogColor = 'rgba(255, 80, 40, 0.14)'; bottomTint = 'rgba(180, 40, 0, 0.25)'; break;
            case 'arctic': fogColor = 'rgba(180, 230, 255, 0.16)'; bottomTint = 'rgba(80, 130, 200, 0.20)'; break;
            case 'void': fogColor = 'rgba(180, 80, 255, 0.13)'; bottomTint = 'rgba(60, 0, 100, 0.22)'; break;
            case 'sky': fogColor = 'rgba(140, 200, 255, 0.12)'; bottomTint = 'rgba(40, 80, 160, 0.18)'; break;
            case 'citadel': fogColor = 'rgba(255, 100, 220, 0.12)'; bottomTint = 'rgba(80, 0, 80, 0.22)'; break;
            case 'lab': fogColor = 'rgba(80, 220, 100, 0.10)'; bottomTint = 'rgba(20, 60, 30, 0.22)'; break;
        }
    }
    const fg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    fg.addColorStop(0, fogColor);
    fg.addColorStop(0.5, 'rgba(0,0,0,0)');
    fg.addColorStop(1, bottomTint);
    ctx.fillStyle = fg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle screen scanlines for digital feel (very low alpha)
    ctx.fillStyle = 'rgba(0, 255, 255, 0.02)';
    for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 1);
    }

    // === DEPTH-BASED CHROMATIC AURA ON THE EDGES ===
    // Tiny color fringe in the corners — sells the "cinematic 3D" PS-style.
    ctx.fillStyle = 'rgba(0,180,255,0.04)';
    ctx.fillRect(0, 0, 60, canvas.height);
    ctx.fillRect(canvas.width - 60, 0, 60, canvas.height);
}

function drawCoins() {
    for (const c of coinPickups) {
        const cx = c.x - camera.x;
        const cy = c.y - camera.y;
        const pulse = 0.7 + Math.sin(c.life * 0.2) * 0.3;
        ctx.save();
        if (c.robotCoin) {
            // ROBOT COIN - hexagonal-ish, magenta-purple glow
            ctx.fillStyle = '#ff44ff';
            ctx.shadowColor = '#aa00ff';
            ctx.shadowBlur = 18 * pulse;
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, Math.PI * 2);
            ctx.fill();
            // Inner gear pattern
            ctx.fillStyle = '#220033';
            ctx.beginPath();
            ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            ctx.fill();
            // RC letters
            ctx.fillStyle = '#ffaaff';
            ctx.font = 'bold 8px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('RC', cx, cy + 3);
            ctx.textAlign = 'left';
        } else {
            // Regular coin
            ctx.fillStyle = '#ffcc00';
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 10 * pulse;
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffff66';
            ctx.beginPath();
            ctx.arc(cx - 1, cy - 1, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

function drawHealthDrops() {
    for (const h of healthDrops) {
        const hx = h.x - camera.x;
        const hy = h.y - camera.y;
        const pulse = 0.7 + Math.sin(h.life * 0.15) * 0.3;
        ctx.save();
        ctx.fillStyle = '#ff66aa';
        ctx.shadowColor = '#ff4488';
        ctx.shadowBlur = 12 * pulse;
        ctx.fillRect(hx - 8, hy - 8, 16, 16);
        // White cross
        ctx.fillStyle = '#fff';
        ctx.fillRect(hx - 6, hy - 1.5, 12, 3);
        ctx.fillRect(hx - 1.5, hy - 6, 3, 12);
        ctx.restore();
    }
}

function drawShops() {
    for (const s of shops) {
        const sx = s.x - camera.x;
        const sy = s.y - camera.y;
        // Shop base
        ctx.fillStyle = '#332200';
        ctx.fillRect(sx, sy, s.w, s.h);
        // Awning stripes
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#ffaa00' : '#ff6600';
            ctx.fillRect(sx + i * 10, sy - 8, 10, 8);
        }
        // Sign
        ctx.fillStyle = '#222';
        ctx.fillRect(sx + 5, sy + 8, s.w - 10, 14);
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 8;
        ctx.font = 'bold 11px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('SHOP', sx + s.w / 2, sy + 19);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';

        // Coin icon on shop
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(sx + s.w / 2, sy + 32, 4, 0, Math.PI * 2);
        ctx.fill();

        // "Press E" hint when in range
        if (activeShop === s && !shopOpen) {
            const blink = Math.floor(performance.now() / 400) % 2 === 0;
            if (blink) {
                ctx.fillStyle = '#00ffaa';
                ctx.shadowColor = '#00ffaa';
                ctx.shadowBlur = 8;
                ctx.font = 'bold 12px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('PRESS E TO SHOP', sx + s.w / 2, sy - 18);
                ctx.shadowBlur = 0;
                ctx.textAlign = 'left';
            }
        }
    }
}

function drawEvoUnlockPopup() {
    if (!evoUnlockPopup) return;
    evoUnlockPopup.timer--;
    if (evoUnlockPopup.timer <= 0) { evoUnlockPopup = null; return; }
    const evo = evoUnlockPopup.evo;
    const ec = EVO_COLORS[evoUnlockPopup.evoLevel];
    const fade = Math.min(1, evoUnlockPopup.timer / 30);

    // Dark overlay (60% opacity)
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * fade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Centered panel
    const w = 560;
    const h = 420;
    const x = canvas.width / 2 - w / 2;
    const y = canvas.height / 2 - h / 2;

    // Background panel with glow border
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = ec ? ec.glow : '#ff00ff';
    ctx.shadowColor = ec ? ec.glow : '#ff00ff';
    ctx.shadowBlur = 28;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;

    // Top banner
    ctx.fillStyle = ec ? ec.armor : '#ff44ff';
    ctx.shadowColor = ec ? ec.glow : '#ff00ff';
    ctx.shadowBlur = 18;
    ctx.font = 'bold 22px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('★ EVOLUTION COMPLETE ★', x + w / 2, y + 38);

    // Title — evo name
    ctx.shadowBlur = 22;
    ctx.font = 'bold 44px Courier New';
    ctx.fillText(evo.name, x + w / 2, y + 90);

    // Tagline
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#aaa';
    ctx.font = 'italic 13px Courier New';
    ctx.fillText(evo.description, x + w / 2, y + 116);

    // Divider
    ctx.fillStyle = ec ? ec.glow : '#ff00ff';
    ctx.fillRect(x + 60, y + 130, w - 120, 2);

    // Upgrades list
    ctx.font = 'bold 14px Courier New';
    ctx.fillStyle = '#ffff66';
    ctx.textAlign = 'left';
    ctx.fillText('NEW UPGRADES:', x + 50, y + 158);

    ctx.font = '14px Courier New';
    let iy = y + 184;
    for (const upg of evo.upgrades) {
        // Bullet
        ctx.fillStyle = ec ? ec.glow : '#ff44ff';
        ctx.fillText('▸', x + 50, iy);
        // Text — bracketed key bindings get highlighted
        const keyMatch = upg.match(/^\[([^\]]+)\]/);
        if (keyMatch) {
            ctx.fillStyle = '#ffff00';
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 6;
            ctx.fillText('[' + keyMatch[1] + ']', x + 70, iy);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.fillText(upg.substring(keyMatch[0].length), x + 70 + 8 + (keyMatch[1].length + 2) * 8, iy);
        } else {
            ctx.fillStyle = '#fff';
            ctx.fillText(upg, x + 70, iy);
        }
        iy += 26;
    }

    // Bottom prompt
    ctx.fillStyle = '#888';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('(Auto-closing — keep fighting)', x + w / 2, y + h - 18);
    ctx.textAlign = 'left';
    ctx.restore();
}

function drawShopUI() {
    if (!shopOpen) return;
    const w = 540, h = 660;
    const x = canvas.width / 2 - w / 2;
    const y = canvas.height / 2 - h / 2;

    ctx.save();
    // Background
    ctx.fillStyle = 'rgba(10, 10, 20, 0.95)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Title
    ctx.fillStyle = '#ffaa00';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('🛒 SHOP', x + w / 2, y + 32);

    // Coin balance
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffdd44';
    ctx.font = '16px Courier New';
    ctx.fillText(`Coins: ${player.coins}`, x + w / 2, y + 58);

    // Current weapon info
    const cur = WEAPONS[player.weaponTier];
    ctx.fillStyle = cur.color;
    ctx.shadowColor = cur.glow;
    ctx.shadowBlur = 6;
    ctx.font = 'bold 13px Courier New';
    ctx.fillText(`Equipped: ${cur.name}  /  Unlocked: ${player.weaponsUnlocked.filter(Boolean).length}/${WEAPONS.length}`, x + w / 2, y + 80);
    ctx.shadowBlur = 0;

    // Items
    ctx.textAlign = 'left';
    ctx.font = '13px Courier New';
    let iy = y + 105;
    for (const item of SHOP_ITEMS) {
        let canAfford = player.coins >= item.cost;
        let label = item.name;
        let costLabel = item.cost === 0 ? 'FREE' : `${item.cost}`;
        let color1 = canAfford ? '#00ffaa' : '#666';
        let color2 = canAfford ? '#fff' : '#888';
        let color3 = canAfford ? '#ffdd44' : '#664';

        if (item.switcher) {
            let next = cur.name;
            for (let i = 1; i < WEAPONS.length; i++) {
                const idx = (player.weaponTier + i) % WEAPONS.length;
                if (player.weaponsUnlocked[idx]) { next = WEAPONS[idx].name; break; }
            }
            label = `Switch Weapon  →  ${next}`;
            color2 = '#ff88ff';
        } else if (item.evolution) {
            // Show next evolution tier name + RC cost
            const nextIdx = player.evoLevel + 1;
            if (nextIdx >= EVOLUTIONS.length) {
                label = 'EVOLVE  (MAXED — OMEGA)';
                costLabel = '—';
                color2 = '#ffaa00';
                color3 = '#888';
            } else {
                const nextEvo = EVOLUTIONS[nextIdx];
                label = `EVOLVE → ${nextEvo.name}`;
                costLabel = `${nextEvo.rcCost} RC`;
                const canAffordRc = player.robotCoins >= nextEvo.rcCost;
                color2 = canAffordRc ? '#ffff66' : '#aa8844';
                color3 = canAffordRc ? '#ffdd44' : '#664';
            }
        } else if (item.weapon) {
            const wpn = WEAPONS[item.weapon];
            if (player.weaponsUnlocked[item.weapon]) {
                label = `Equip: ${wpn.name}`;
                costLabel = 'OWNED';
                color1 = '#00ffaa';
                color2 = wpn.color;
                color3 = '#88ffaa';
                canAfford = true;
            } else {
                label = `Buy: ${wpn.name}`;
                color2 = canAfford ? wpn.color : '#888';
            }
        }

        ctx.fillStyle = color1;
        ctx.fillText(`[${item.key}]`, x + 20, iy);
        ctx.fillStyle = color2;
        ctx.fillText(label, x + 60, iy);
        ctx.fillStyle = color3;
        ctx.textAlign = 'right';
        ctx.fillText(costLabel, x + w - 20, iy);
        ctx.textAlign = 'left';
        iy += 24;
    }
    // Hint
    ctx.fillStyle = '#aaa';
    ctx.font = '11px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('Press a number to buy. Press E to close.', x + w / 2, y + h - 16);
    ctx.fillText('New weapons are unlocked by defeating bosses.', x + w / 2, y + h - 32);

    // Shop message
    if (shopMessage) {
        ctx.fillStyle = shopMessage.color;
        ctx.font = 'bold 14px Courier New';
        ctx.fillText(shopMessage.text, x + w / 2, y + h - 56);
    }

    ctx.textAlign = 'left';
    ctx.restore();
}

function drawHUD() {
    // Stage banner (top center)
    const stage = STAGES[currentStage];
    if (stage) {
        ctx.fillStyle = '#888';
        ctx.font = '11px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(`STAGE ${currentStage + 1} / ${STAGES.length}`, canvas.width / 2, 16);
        ctx.fillStyle = '#00ffaa';
        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 6;
        ctx.font = 'bold 14px Courier New';
        ctx.fillText(stage.name, canvas.width / 2, 34);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
    }

    // Health bar
    ctx.fillStyle = '#222';
    ctx.fillRect(20, 20, 200, 20);
    ctx.fillStyle = player.hp > 30 ? '#00ff66' : '#ff3333';
    ctx.shadowColor = player.hp > 30 ? '#00ff66' : '#ff3333';
    ctx.shadowBlur = 10;
    ctx.fillRect(20, 20, (player.hp / player.maxHp) * 200, 20);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#00ffaa';
    ctx.strokeRect(20, 20, 200, 20);

    // HP text
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Courier New';
    ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, 25, 35);

    // Mission key indicator — small icon top-left when player carries a key
    if (player.keysHeld && player.keysHeld.length > 0) {
        const kx = 230, ky = 22;
        ctx.fillStyle = '#ffdd44';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 12;
        ctx.fillRect(kx, ky, 18, 12);
        ctx.fillStyle = '#222';
        ctx.fillRect(kx + 13, ky + 4, 3, 4);
        ctx.fillStyle = '#aa6600';
        ctx.fillRect(kx + 1, ky + 9, 16, 2);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffdd44';
        ctx.font = 'bold 10px Courier New';
        ctx.fillText(`KEY × ${player.keysHeld.length}`, kx + 24, ky + 10);
    }

    // Mission objective hint — show target depending on state
    const cageNow = (cages || []).find(c => !c.rescued);
    let objective = null;
    if (cageNow && cageNow.requiresKey) {
        const haveKey = (player.keysHeld || []).includes(cageNow.requiresKey);
        if (!haveKey) {
            // Look for an active terminal/laser grid for this key first
            const term = terminals.find(t => t.group === cageNow.requiresKey && !t.disabled);
            const grid = laserGrids.find(g => g.group === cageNow.requiresKey && !g.disabled);
            if (term && grid) objective = '🎯 OBJECTIVE: hack the TERMINAL to disable laser grid';
            else if (grid) objective = '🎯 OBJECTIVE: laser grid blocks the key';
            else objective = '🎯 OBJECTIVE: find the KEY card';
        } else {
            objective = '🎯 OBJECTIVE: free the prisoner from the cage';
        }
    } else if (!cageNow) {
        // Pre-boss state — same key/laser logic
        const term = terminals.find(t => !t.disabled);
        const grid = laserGrids.find(g => !g.disabled);
        const keyOnMap = keyPickups.find(k => !k.collected);
        const stageDef = STAGES[currentStage];
        if (term && grid) objective = '🎯 OBJECTIVE: hack the TERMINAL → disable laser grid → grab KEY';
        else if (keyOnMap) objective = '🎯 OBJECTIVE: pick up the KEY card';
        else if (stageDef) objective = `🎯 OBJECTIVE: defeat ${stageDef.bossName}`;
    }
    if (objective) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(canvas.width / 2 - 220, canvas.height - 36, 440, 22);
        ctx.fillStyle = '#ffdd66';
        ctx.font = 'bold 12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(objective, canvas.width / 2, canvas.height - 20);
        ctx.textAlign = 'left';
    }

    // Dash cooldown
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 48, 80, 8);
    const dashPct = 1 - (player.dashCooldown / 40);
    ctx.fillStyle = dashPct >= 1 ? '#00ffaa' : '#006644';
    ctx.fillRect(20, 48, dashPct * 80, 8);
    ctx.fillStyle = '#aaa';
    ctx.font = '10px Courier New';
    ctx.fillText('DASH', 22, 68);

    // Score
    ctx.fillStyle = '#00ffaa';
    ctx.font = '16px Courier New';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${score}`, canvas.width - 20, 35);

    // Coins
    ctx.fillStyle = '#ffdd44';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 8;
    ctx.fillText(`COINS: ${player.coins}`, canvas.width - 20, 60);
    ctx.shadowBlur = 0;

    // Robot Coins (RC)
    ctx.fillStyle = '#ff66ff';
    ctx.shadowColor = '#aa00ff';
    ctx.shadowBlur = 8;
    ctx.fillText(`RC: ${player.robotCoins}`, canvas.width - 20, 80);
    ctx.shadowBlur = 0;

    // Evolution tier (if not base)
    if (player.evoLevel > 0) {
        const evo = EVOLUTIONS[player.evoLevel];
        const ec = EVO_COLORS[player.evoLevel];
        ctx.fillStyle = ec ? ec.glow : '#ff00ff';
        ctx.shadowColor = ec ? ec.glow : '#ff00ff';
        ctx.shadowBlur = 6;
        ctx.font = 'bold 10px Courier New';
        ctx.fillText(`◆ ${evo.name} ◆`, canvas.width - 20, 100);
        ctx.shadowBlur = 0;

        // [R] Evolution ability cooldown
        if (evo.ability) {
            ctx.textAlign = 'left';
            const rx = 20;
            const ry = 130;
            ctx.fillStyle = '#222';
            ctx.fillRect(rx, ry, 120, 12);
            const ready = evoAbilityCooldown <= 0;
            const maxCd = evo.ability === 'convoyMatrix' ? 900 :
                          evo.ability === 'primeBeam' ? 720 :
                          evo.ability === 'apexNova' ? 600 :
                          evo.ability === 'omegaBlast' ? 480 : 240;
            const ratio = ready ? 1 : 1 - (evoAbilityCooldown / maxCd);
            ctx.fillStyle = ready ? (ec ? ec.glow : '#ff44ff') : '#553355';
            ctx.shadowColor = ready ? (ec ? ec.glow : '#ff44ff') : '#000';
            ctx.shadowBlur = ready ? 8 : 0;
            ctx.fillRect(rx, ry, ratio * 120, 12);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Courier New';
            ctx.textAlign = 'left';
            const abilityName = evo.ability === 'pulseShot' ? 'PULSE BURST' :
                                evo.ability === 'rocketBarrage' ? 'ROCKET BARRAGE' :
                                evo.ability === 'omegaBlast' ? 'OMEGA BLAST' :
                                evo.ability === 'apexNova' ? 'APEX NOVA' :
                                evo.ability === 'primeBeam' ? 'PRIME BEAM' :
                                evo.ability === 'convoyMatrix' ? 'CONVOY MATRIX' : evo.ability;
            ctx.fillText(`[R] ${abilityName}`, rx + 4, ry + 9);
        }
        ctx.textAlign = 'right';
    }

    // Combo
    if (comboCount > 1) {
        const ratio = comboTimer / 180;
        ctx.fillStyle = '#ff66aa';
        ctx.shadowColor = '#ff44aa';
        ctx.shadowBlur = 10;
        ctx.font = 'bold 18px Courier New';
        ctx.fillText(`x${comboCount} COMBO`, canvas.width - 20, 88);
        ctx.shadowBlur = 0;
        // Decay bar
        ctx.fillStyle = '#332233';
        ctx.fillRect(canvas.width - 120, 95, 100, 4);
        ctx.fillStyle = '#ff44aa';
        ctx.fillRect(canvas.width - 120, 95, 100 * ratio, 4);
    }

    // Current weapon (top-left below dash bar)
    const w = WEAPONS[player.weaponTier];
    ctx.fillStyle = w.color;
    ctx.shadowColor = w.glow;
    ctx.shadowBlur = 6;
    ctx.font = 'bold 13px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`▸ ${w.name}`, 20, 88);
    ctx.shadowBlur = 0;

    // Ability cooldown bar (Q)
    const ab = CHARACTERS[selectedChar];
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 96, 100, 10);
    const abReady = player.abilityTimer <= 0;
    const abPct = abReady ? 1 : 1 - (player.abilityTimer / player.abilityCooldown);
    ctx.fillStyle = abReady ? (player.abilityActive ? '#ffff00' : player.charAccent) : '#553355';
    ctx.fillRect(20, 96, abPct * 100, 10);
    ctx.fillStyle = '#aaa';
    ctx.font = '10px Courier New';
    if (abReady) {
        ctx.fillStyle = player.charAccent;
        ctx.fillText('Q: ' + (ab ? ab.ability.toUpperCase() : 'ABILITY') + ' READY', 22, 117);
    } else {
        ctx.fillText('Q: ' + Math.ceil(player.abilityTimer / 60) + 's', 22, 117);
    }

    ctx.textAlign = 'left';

    // Boss health bar (if boss is alive and nearby)
    const boss = enemies.find(e => e.type === 'boss');
    if (boss && Math.abs(boss.x - player.x) < 700) {
        ctx.fillStyle = '#222';
        ctx.fillRect(canvas.width / 2 - 175, canvas.height - 40, 350, 22);
        ctx.fillStyle = boss.phase === 2 ? '#ff0066' : (boss.color || '#ff00ff');
        ctx.shadowColor = boss.phase === 2 ? '#ff0066' : (boss.color || '#ff00ff');
        ctx.shadowBlur = 10;
        ctx.fillRect(canvas.width / 2 - 175, canvas.height - 40, (boss.hp / boss.maxHp) * 350, 22);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = boss.color || '#ff00ff';
        ctx.strokeRect(canvas.width / 2 - 175, canvas.height - 40, 350, 22);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px Courier New';
        ctx.textAlign = 'center';
        const stage = STAGES[currentStage];
        ctx.fillText((stage ? stage.bossName : 'BOSS') + (boss.phase === 2 ? '  [ENRAGED]' : ''), canvas.width / 2, canvas.height - 25);
        ctx.textAlign = 'left';
    }
}

function drawBackground() {
    // Use arena theme bg if in boss arena, else stage palette
    const stagePalettes = [
        '#0a1a0a',  // 1 - facility green
        '#0a1530',  // 2 - sky blue
        '#1a0a0a',  // 3 - reactor red
        '#0a1a0a',  // 4 - lab green
        '#0a1830',  // 5 - arctic
        '#1a0a30',  // 6 - void purple
        '#1a001a',  // 7 - citadel
    ];
    let horizon;
    if (arenaTheme) {
        // Arena-specific atmospheric backgrounds
        switch (arenaTheme.name) {
            case 'inferno':
                horizon = ['#2a0808', '#5a1010'];
                break;
            case 'arctic':
                horizon = ['#0a1525', '#1a3050'];
                break;
            case 'void':
                horizon = ['#100020', '#2a0040'];
                break;
            case 'sky':
                horizon = ['#0a1535', '#2a3a60'];
                break;
            case 'citadel':
                horizon = ['#180022', '#3a0044'];
                break;
            case 'lab':
                horizon = ['#0a1a0a', '#1a3010'];
                break;
            default:
                horizon = ['#0a0a16', '#102018'];
        }
    } else {
        const horizonColors = [
            ['#0a0a16', '#102018'],
            ['#0a0a25', '#152540'],
            ['#180808', '#2a1010'],
            ['#0a1808', '#152a10'],
            ['#0a1825', '#15253a'],
            ['#180020', '#28104a'],
            ['#180022', '#2a004a'],
        ];
        horizon = horizonColors[currentStage] || ['#0a0a16', '#102018'];
    }

    // Sky gradient (horizon perspective)
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#000000');
    grad.addColorStop(0.4, horizon[0]);
    grad.addColorStop(0.7, horizon[1]);
    grad.addColorStop(1, horizon[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Far horizon line glow
    ctx.fillStyle = 'rgba(0, 200, 255, 0.05)';
    ctx.fillRect(0, canvas.height * 0.5, canvas.width, 2);

    ctx.strokeStyle = stagePalettes[currentStage] || '#0a1a0a';
    ctx.lineWidth = 1;
    const gridSize = 60;
    const offsetX = (camera.x * 0.3) % gridSize;
    const offsetY = (camera.y * 0.3) % gridSize;
    for (let x = -offsetX; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = -offsetY; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // === PROPER PERSPECTIVE FLOOR GRID (3D vanishing-point style) ===
    // Lines converge toward a vanishing point on the horizon, exactly like
    // PS1-era racers and old TRON arcade shooters. This sells the "depth"
    // far more than parallel parallax lines.
    const horizonY = canvas.height * 0.55;
    const floorBottom = canvas.height;
    const vanX = canvas.width / 2;
    // Tint based on arena/stage
    let floorTint = 'rgba(0, 255, 170, 0.18)';
    if (arenaTheme) {
        switch (arenaTheme.name) {
            case 'inferno': floorTint = 'rgba(255, 100, 40, 0.18)'; break;
            case 'arctic': floorTint = 'rgba(180, 230, 255, 0.18)'; break;
            case 'void': floorTint = 'rgba(220, 100, 255, 0.18)'; break;
            case 'sky': floorTint = 'rgba(140, 200, 255, 0.18)'; break;
            case 'citadel': floorTint = 'rgba(255, 120, 220, 0.18)'; break;
            case 'lab': floorTint = 'rgba(120, 255, 140, 0.18)'; break;
        }
    }
    ctx.strokeStyle = floorTint;
    ctx.lineWidth = 1;
    // Vertical perspective lines fanning out from the vanishing point
    const camOffset = (camera.x * 0.4) % 60;
    for (let i = -16; i <= 16; i++) {
        const baseX = vanX + i * 60 - camOffset;
        ctx.beginPath();
        ctx.moveTo(baseX, floorBottom);
        // Each line angles toward (vanX, horizonY) — true 1-point perspective
        ctx.lineTo(vanX + (baseX - vanX) * 0.06, horizonY);
        ctx.stroke();
    }
    // Horizontal "scan" lines that get thinner near the horizon
    for (let i = 1; i <= 14; i++) {
        const t = i / 14;
        // Easing — lines bunch up toward the horizon
        const eased = Math.pow(t, 2.2);
        const lineY = floorBottom - eased * (floorBottom - horizonY);
        const alpha = 0.25 - eased * 0.20;
        ctx.strokeStyle = floorTint.replace(/[\d.]+\)$/, alpha.toFixed(2) + ')');
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(canvas.width, lineY);
        ctx.stroke();
    }
    // Bright horizon line (where the world meets the sky)
    ctx.strokeStyle = floorTint.replace(/[\d.]+\)$/, '0.35)');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(canvas.width, horizonY);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Stage-unique parallax decorations
    drawStageDecorations();
}

function drawStageDecorations() {
    const px = camera.x * 0.4;
    if (currentStage === 0) {
        // Facility - tall buildings silhouette
        ctx.fillStyle = '#0e1218';
        for (let i = 0; i < 8; i++) {
            const bx = i * 280 - (px % 280);
            ctx.fillRect(bx, 380, 60, 200);
            ctx.fillRect(bx + 80, 420, 80, 160);
            ctx.fillRect(bx + 180, 350, 50, 230);
        }
        // Window dots
        ctx.fillStyle = '#ffaa00';
        for (let i = 0; i < 16; i++) {
            const wx = i * 140 - (px % 140);
            ctx.fillRect(wx + 10, 430 + (i % 3) * 18, 4, 4);
        }
    } else if (currentStage === 1) {
        // Sky docks - clouds and floating platforms
        ctx.fillStyle = '#1a2a48';
        for (let i = 0; i < 10; i++) {
            const cx = i * 200 - (px * 1.5 % 200);
            const cy = 80 + (i % 3) * 40;
            ctx.beginPath();
            ctx.arc(cx, cy, 30, 0, Math.PI * 2);
            ctx.arc(cx + 25, cy + 5, 25, 0, Math.PI * 2);
            ctx.arc(cx - 20, cy + 8, 22, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (currentStage === 2) {
        // Reactor - lava glow at bottom
        const grad = ctx.createLinearGradient(0, canvas.height - 100, 0, canvas.height);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(255, 80, 0, 0.4)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
        // Pipes
        ctx.fillStyle = '#330000';
        for (let i = 0; i < 8; i++) {
            const bx = i * 240 - (px % 240);
            ctx.fillRect(bx, 200, 25, 360);
            ctx.fillRect(bx + 100, 100, 25, 460);
        }
    } else if (currentStage === 3) {
        // Lab - rotating gears and consoles
        ctx.fillStyle = '#0a1a0e';
        for (let i = 0; i < 7; i++) {
            const bx = i * 300 - (px % 300);
            ctx.fillRect(bx, 350, 100, 200);
            // Console screens
            ctx.fillStyle = '#22ff44';
            ctx.fillRect(bx + 10, 380, 30, 20);
            ctx.fillRect(bx + 50, 380, 30, 20);
            ctx.fillStyle = '#0a1a0e';
        }
    } else if (currentStage === 4) {
        // Arctic - falling snow
        ctx.fillStyle = '#aaccee';
        for (let i = 0; i < 60; i++) {
            const sx = (i * 73 + (performance.now() * 0.05)) % canvas.width;
            const sy = (i * 41 + (performance.now() * 0.08)) % canvas.height;
            ctx.fillRect(sx, sy, 2, 2);
        }
        // Mountain silhouette
        ctx.fillStyle = '#1a3050';
        ctx.beginPath();
        ctx.moveTo(0, 350);
        for (let i = 0; i < 12; i++) {
            const mx = i * 200 - (px * 0.5 % 200);
            ctx.lineTo(mx, 200 + (i % 3) * 60);
            ctx.lineTo(mx + 100, 350);
        }
        ctx.lineTo(canvas.width, 600);
        ctx.lineTo(0, 600);
        ctx.fill();
    } else if (currentStage === 5) {
        // Void - swirling stars/portals
        ctx.fillStyle = '#aa00ff';
        for (let i = 0; i < 30; i++) {
            const sx = (i * 89 - px) % (canvas.width + 200) - 100;
            const sy = (i * 47) % canvas.height;
            const tw = (Math.sin(performance.now() * 0.003 + i) + 1) * 2;
            ctx.globalAlpha = 0.4 + Math.sin(performance.now() * 0.005 + i) * 0.3;
            ctx.fillRect(sx, sy, tw, tw);
        }
        ctx.globalAlpha = 1;
        // Big portal
        const portalX = 600 - (px * 0.3 % 1200);
        ctx.strokeStyle = '#aa00ff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#aa00ff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(portalX, 200, 80 + Math.sin(performance.now() * 0.002) * 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    } else if (currentStage === 6) {
        // Citadel - tall fortress
        ctx.fillStyle = '#1a0a1a';
        for (let i = 0; i < 6; i++) {
            const bx = i * 360 - (px % 360);
            // Tower
            ctx.fillRect(bx, 100, 120, 460);
            // Crenellations
            for (let cr = 0; cr < 6; cr++) {
                ctx.fillRect(bx + cr * 22, 90, 18, 18);
            }
        }
        // Star field
        ctx.fillStyle = '#ff44ff';
        for (let i = 0; i < 40; i++) {
            const sx = (i * 89 - px * 0.6) % (canvas.width + 200) - 100;
            const sy = (i * 41) % 200;
            ctx.fillRect(sx, sy, 2, 2);
        }
    }
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff3333';
    ctx.shadowColor = '#ff3333';
    ctx.shadowBlur = 20;
    ctx.font = '48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('DESTROYED', canvas.width / 2, canvas.height / 2 - 20);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#aaa';
    ctx.font = '18px Courier New';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 50);
    ctx.textAlign = 'left';
}

// ===== ROBOT PORTRAIT LIBRARY =====
// Each speaker has a procedural robot/anime face drawn in the cutscene panel.
// All faces share a common helmet shape but vary in eye color, accent and
// silhouette so they read as distinct characters.
//
// Each entry maps a cutscene speaker to either a boss subtype (so we can
// reuse the gameplay drawBossBody renderer for an exact-likeness portrait)
// or a 'player' / 'panel' kind for hero/utility speakers.
const FACE_ART = {
    'YOU':         { kind: 'player', color: '#00ddff', accent: '#00ffaa', eye: '#88ffff', mood: 'determined' },
    'SHIP A.I.':   { kind: 'panel',  color: '#88ddff', accent: '#aaeeff', eye: '#aaffff', shape: 'minimal',   mood: 'calm' },
    'CONTROL':     { kind: 'panel',  color: '#ffaa44', accent: '#ffdd66', eye: '#ffee88', shape: 'square',    mood: 'alert' },
    // Bosses — mapped to their actual gameplay subtype so the portrait IS the
    // same robot you fight, just zoomed in.
    'GUARD-1':     { kind: 'boss', subtype: 'guard',     color: '#ff66dd', accent: '#ff44aa', eye: '#ffaaff', mood: 'angry' },
    'SKYHAMMER':   { kind: 'boss', subtype: 'skyhammer', color: '#0088ff', accent: '#44aaff', eye: '#ffffff', mood: 'angry' },
    'INFERNO-X':   { kind: 'boss', subtype: 'inferno',   color: '#ff3300', accent: '#ff8844', eye: '#ffff00', mood: 'fire' },
    'RAVAGER':     { kind: 'boss', subtype: 'ravager',   color: '#22ff44', accent: '#88ff66', eye: '#ffff44', mood: 'angry' },
    'CRYO-LORD':   { kind: 'boss', subtype: 'cryo',      color: '#88ccff', accent: '#aaeeff', eye: '#ffffff', mood: 'cold'  },
    'NULLIFIER':   { kind: 'boss', subtype: 'nullifier', color: '#aa00ff', accent: '#ff66ff', eye: '#ff44ff', mood: 'angry' },
    'OMEGA-PRIME': { kind: 'boss', subtype: 'omega',     color: '#ffffff', accent: '#ff44ff', eye: '#ff44ff', mood: 'kingly' },
    'TITAN-LORD':  { kind: 'boss', subtype: 'titan',     color: '#66ffff', accent: '#aaffff', eye: '#ffffff', mood: 'kingly' }
};

// Draw a portrait for the current speaker into the cutscene panel.
// CRITICAL: Bosses render using the SAME drawBossBody used in gameplay so
// the cutscene face matches the in-game robot exactly. The player and
// utility speakers (Ship A.I., Control) use compact stylized panels.
function drawRobotPortrait(face, x, y, w, h, talking, t) {
    if (!face) return;
    ctx.save();

    // ===== Panel background — dramatic gradient + soft vignette =====
    const bg = ctx.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, '#0a0a16');
    bg.addColorStop(0.5, '#181024');
    bg.addColorStop(1, '#040408');
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    // Backlight halo behind the character (the speaker's color)
    const halo = ctx.createRadialGradient(x + w / 2, y + h * 0.45, 8, x + w / 2, y + h * 0.45, w * 0.7);
    halo.addColorStop(0, hexToRgba(face.color, 0.30));
    halo.addColorStop(0.4, hexToRgba(face.color, 0.12));
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(x, y, w, h);

    // Diagonal scanline texture (very subtle)
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = -h; i < w; i += 4) {
        ctx.beginPath();
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + h, y + h);
        ctx.stroke();
    }
    ctx.restore();

    // Panel border with glow
    ctx.strokeStyle = face.color;
    ctx.shadowColor = face.color;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.shadowBlur = 0;

    // ===== Dispatch portrait drawing =====
    // Clip the panel so anything we render can't bleed outside it.
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 4, y + 4, w - 8, h - 28);   // leave room for name plate at bottom
    ctx.clip();

    if (face.kind === 'boss' && face.subtype) {
        drawBossPortrait(face, x, y, w, h, talking, t);
    } else if (face.kind === 'player') {
        drawPlayerPortrait(face, x, y, w, h, talking, t);
    } else {
        // Generic panel character (Ship A.I., Control)
        drawPanelPortrait(face, x, y, w, h, talking, t);
    }
    ctx.restore();

    // ===== Speaker name plate at bottom =====
    const nameY = y + h - 22;
    const nameG = ctx.createLinearGradient(x, nameY, x, nameY + 18);
    nameG.addColorStop(0, 'rgba(0,0,0,0.85)');
    nameG.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = nameG;
    ctx.fillRect(x + 4, nameY, w - 8, 18);
    ctx.strokeStyle = face.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 4, nameY, w - 8, 18);
    ctx.fillStyle = face.color;
    ctx.shadowColor = face.color;
    ctx.shadowBlur = 8;
    ctx.font = 'bold 12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(face.name || '', x + w / 2, nameY + 13);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';

    ctx.restore();
}

// Render the boss using the SAME drawBossBody from gameplay, just zoomed in
// and positioned in the panel. This gives the player an identical-likeness
// portrait of the robot they're fighting.
function drawBossPortrait(face, x, y, w, h, talking, t) {
    // Build a synthetic boss object with realistic dimensions.
    // Original gameplay bosses are ~90-130 wide / 100-140 tall.
    // We pick 100x110 as a clean reference and scale to fit the panel.
    const bossW = 100;
    const bossH = 110;
    // Scale so the boss fills ~70% of the panel height (head + body visible).
    const scale = Math.min((w - 30) / (bossW + 60), (h - 50) / (bossH + 30));
    const drawScale = Math.max(1.4, scale);
    // Subtle idle breathe
    const breathe = Math.sin(t * 0.0025) * 1.5;
    const turnT = Math.sin(t * 0.001) * 0.04;

    ctx.save();
    // Position roughly center of panel (slightly above middle so name plate
    // doesn't feel crowded)
    const cx = x + w / 2;
    const cy = y + h / 2 + 6 + breathe;
    ctx.translate(cx, cy);
    ctx.rotate(turnT);
    ctx.scale(drawScale, drawScale);
    ctx.translate(-bossW / 2, -bossH / 2);

    // Synthetic enemy data — just enough fields drawBossBody reads.
    const fakeE = {
        x: 0, y: 0,
        w: bossW, h: bossH,
        subtype: face.subtype,
        color: face.color,
        phase: 1,
        moveTimer: t * 0.2,           // drives limb sway
        baseX: 0, baseY: 0
    };
    drawBossBody(0, 0, fakeE);
    ctx.restore();

    // Speaking mouth flap — overlay a small "vocoder" indicator below the
    // boss face (since the boss's actual mouth varies). Hides when not talking.
    if (talking) {
        const mx = x + w / 2;
        const my = y + h - 50;
        ctx.save();
        const bars = 5;
        const bw = 8;
        for (let i = 0; i < bars; i++) {
            const phase = (t * 0.025 + i * 0.6);
            const bh = 2 + Math.abs(Math.sin(phase)) * 8;
            ctx.fillStyle = face.color;
            ctx.shadowColor = face.color;
            ctx.shadowBlur = 6;
            ctx.fillRect(mx - bars * bw / 2 + i * bw + 1, my - bh / 2, bw - 2, bh);
        }
        ctx.restore();
    }
}

// Render the player robot — built to match what drawPlayer() shows in
// gameplay (helmet, visor, chest with evo armor, shoulders, arms).
function drawPlayerPortrait(face, x, y, w, h, talking, t) {
    const breathe = Math.sin(t * 0.0025) * 1.4;
    const turnT = Math.sin(t * 0.001) * 0.04;

    const cx = x + w / 2;
    const cy = y + h / 2 + 6 + breathe;

    // Use the player's current visual stats so the portrait reflects the
    // chosen character + evolution.
    const baseColor = player.charColor || face.color || '#00ddff';
    const accent = player.charAccent || face.accent || '#00ffaa';
    const eye = '#88ffff';
    const evoCol = (typeof EVO_COLORS !== 'undefined' && EVO_COLORS[player.evoLevel]) ? EVO_COLORS[player.evoLevel] : null;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(turnT);

    // Head proportions match the gameplay player (helmet 28w x 14h scaled up)
    const scale = 3.4;

    // ===== Drop shadow =====
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 64, 60, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // ===== Body (chest) — same gradient as drawPlayer torso =====
    const bodyW = 26 * scale;
    const bodyH = 26 * scale;
    const bodyX = -bodyW / 2;
    const bodyY = -bodyH / 2 + 18;
    const tg = ctx.createLinearGradient(bodyX, bodyY, bodyX + bodyW, bodyY + bodyH);
    tg.addColorStop(0, baseColor);
    tg.addColorStop(0.5, baseColor);
    tg.addColorStop(1, '#0a3a4a');
    ctx.fillStyle = tg;
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = 12;
    ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
    ctx.shadowBlur = 0;
    // Lit-side highlight
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(bodyX, bodyY, 5, bodyH);
    // Shadow side
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(bodyX + bodyW - 5, bodyY, 5, bodyH);

    // Evo chest plate, shoulder pads, belt — mirror gameplay
    if (evoCol) {
        ctx.fillStyle = evoCol.armor;
        ctx.shadowColor = evoCol.glow;
        ctx.shadowBlur = 8;
        // Chest plate
        ctx.fillRect(bodyX + 8, bodyY + 4 * scale, bodyW - 16, 6 * scale * 0.45);
        // Shoulder pads
        ctx.fillRect(bodyX - 2, bodyY + 2 * scale, 6, 8 * scale * 0.6);
        ctx.fillRect(bodyX + bodyW - 4, bodyY + 2 * scale, 6, 8 * scale * 0.6);
        // Belt
        ctx.fillRect(bodyX + 6, bodyY + bodyH - 6, bodyW - 12, 4);
        ctx.shadowBlur = 0;
        // MK-II emblem
        if (player.evoLevel >= 1) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(-6, bodyY + 6 * scale * 0.6, 12, 3);
        }
    }

    // ===== Arms peeking from each side =====
    const armSwayL = Math.sin(t * 0.003) * 1.5;
    const armSwayR = -armSwayL;
    ctx.fillStyle = '#0a3a4a';
    ctx.fillRect(bodyX - 14 + armSwayL, bodyY + 8, 14, bodyH - 14);
    ctx.fillRect(bodyX + bodyW + armSwayR, bodyY + 8, 14, bodyH - 14);
    // Arm rim color
    ctx.fillStyle = baseColor;
    ctx.fillRect(bodyX - 14 + armSwayL, bodyY + 8, 4, bodyH - 14);
    ctx.fillRect(bodyX + bodyW + 10 + armSwayR, bodyY + 8, 4, bodyH - 14);

    // ===== Neck =====
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(-8, -bodyH / 2 + 4, 16, 18);
    ctx.fillStyle = baseColor;
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = 8;
    ctx.fillRect(-12, -bodyH / 2 + 18, 24, 4);
    ctx.shadowBlur = 0;

    // ===== Head (helmet) — same gradient + visor as gameplay =====
    const headW = 28 * scale;
    const headH = 14 * scale;
    const headX = -headW / 2;
    const headY = -bodyH / 2 - headH + 4;

    // Helmet body gradient
    const hg = ctx.createLinearGradient(headX, headY, headX, headY + headH);
    hg.addColorStop(0, accent);
    hg.addColorStop(1, baseColor);
    ctx.fillStyle = hg;
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = 14;
    // Rounded rectangle helmet
    const r = 8;
    ctx.beginPath();
    ctx.moveTo(headX + r, headY);
    ctx.lineTo(headX + headW - r, headY);
    ctx.quadraticCurveTo(headX + headW, headY, headX + headW, headY + r);
    ctx.lineTo(headX + headW, headY + headH - r);
    ctx.quadraticCurveTo(headX + headW, headY + headH, headX + headW - r, headY + headH);
    ctx.lineTo(headX + r, headY + headH);
    ctx.quadraticCurveTo(headX, headY + headH, headX, headY + headH - r);
    ctx.lineTo(headX, headY + r);
    ctx.quadraticCurveTo(headX, headY, headX + r, headY);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // Top rim highlight
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(headX + 6, headY + 1, headW - 12, 3);
    // Shadow side of helmet
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(headX + headW - 8, headY + 8, 8, headH - 16);

    // Evo helmet crest + side fins
    if (evoCol) {
        ctx.fillStyle = evoCol.armor;
        ctx.shadowColor = evoCol.glow;
        ctx.shadowBlur = 8;
        ctx.fillRect(-2, headY - 10, 4, 10);
        ctx.fillRect(headX + 6, headY - 4, 4, 6);
        ctx.fillRect(headX + headW - 10, headY - 4, 4, 6);
        ctx.shadowBlur = 0;
    }
    // OMEGA halo
    if (player.evoLevel >= 3) {
        ctx.strokeStyle = (evoCol ? evoCol.armor : '#ffaa00');
        ctx.shadowColor = (evoCol ? evoCol.glow : '#ffaa00');
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, headY - 18, 30, 8, Math.sin(t * 0.005) * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
    }

    // ===== Visor (glowing strip) =====
    const visorY = headY + 4 * scale;
    const visorH = 6 * scale;
    const visorX = -10 * scale;
    const visorW = 20 * scale;
    ctx.fillStyle = '#000';
    ctx.fillRect(visorX, visorY, visorW, visorH);
    // Glass tint
    ctx.fillStyle = hexToRgba(baseColor, 0.4);
    ctx.fillRect(visorX + 1, visorY + 1, visorW - 2, visorH - 2);

    // Eyes — track sway, blink
    const blink = Math.sin(t * 0.005);
    const isBlink = blink > 0.97;
    const eyeShift = Math.sin(t * 0.0015) * 2;
    const eyeYOffset = 0;
    if (!isBlink) {
        const eyeW = visorW * 0.32;
        const eyeH = visorH * 0.65;
        const ey = visorY + (visorH - eyeH) / 2 + eyeYOffset;
        const lex = visorX + 6 + eyeShift;
        const rex = visorX + visorW - 6 - eyeW + eyeShift;
        // Halo
        ctx.fillStyle = hexToRgba(eye, 0.5);
        ctx.shadowColor = eye;
        ctx.shadowBlur = 14;
        ctx.fillRect(lex - 2, ey - 1, eyeW + 4, eyeH + 2);
        ctx.fillRect(rex - 2, ey - 1, eyeW + 4, eyeH + 2);
        // Bright core
        ctx.fillStyle = eye;
        ctx.shadowBlur = 6;
        ctx.fillRect(lex, ey, eyeW, eyeH);
        ctx.fillRect(rex, ey, eyeW, eyeH);
        // Pupils
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.fillRect(lex + eyeW * 0.4, ey + eyeH * 0.25, 3, eyeH * 0.5);
        ctx.fillRect(rex + eyeW * 0.4, ey + eyeH * 0.25, 3, eyeH * 0.5);
    } else {
        ctx.fillStyle = hexToRgba(eye, 0.5);
        const ey = visorY + visorH / 2;
        ctx.fillRect(visorX + 6, ey - 1, visorW * 0.32, 2);
        ctx.fillRect(visorX + visorW - 6 - visorW * 0.32, ey - 1, visorW * 0.32, 2);
    }
    ctx.shadowBlur = 0;
    // Glass reflection
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.moveTo(visorX + 1, visorY + 1);
    ctx.lineTo(visorX + visorW * 0.3, visorY + 1);
    ctx.lineTo(visorX + visorW * 0.18, visorY + visorH * 0.4);
    ctx.lineTo(visorX + 1, visorY + visorH * 0.5);
    ctx.closePath();
    ctx.fill();

    // ===== Talking vocoder under helmet =====
    if (talking) {
        const my = headY + headH + 6;
        const bars = 5;
        const bw = 6;
        for (let i = 0; i < bars; i++) {
            const phase = (t * 0.025 + i * 0.6);
            const bh = 2 + Math.abs(Math.sin(phase)) * 6;
            ctx.fillStyle = baseColor;
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 6;
            ctx.fillRect(-bars * bw / 2 + i * bw + 1, my - bh / 2, bw - 2, bh);
        }
        ctx.shadowBlur = 0;
    }

    ctx.restore();
}

// Compact stylized panel portrait — kept for non-fightable speakers like
// SHIP A.I. (a console panel) and CONTROL (a comms operator).
function drawPanelPortrait(face, x, y, w, h, talking, t) {
    const cx = x + w / 2;
    const cy = y + h / 2 + 6;
    const breathe = Math.sin(t * 0.003) * 1;
    ctx.save();
    ctx.translate(cx, cy + breathe);

    // Console / utility frame
    const fw = w * 0.7;
    const fh = h * 0.55;
    const fx = -fw / 2;
    const fy = -fh / 2;

    // Outer frame
    ctx.fillStyle = '#1a2230';
    ctx.fillRect(fx - 6, fy - 6, fw + 12, fh + 12);
    // Inner screen
    const bg = ctx.createLinearGradient(fx, fy, fx, fy + fh);
    bg.addColorStop(0, hexToRgba(face.color, 0.15));
    bg.addColorStop(1, '#000');
    ctx.fillStyle = bg;
    ctx.fillRect(fx, fy, fw, fh);
    // Border glow
    ctx.strokeStyle = face.color;
    ctx.shadowColor = face.color;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2;
    ctx.strokeRect(fx, fy, fw, fh);
    ctx.shadowBlur = 0;

    // Eye/visor inside the screen
    const visorY = fy + fh * 0.35;
    const visorH = fh * 0.25;
    const visorX = fx + 12;
    const visorW = fw - 24;
    ctx.fillStyle = '#000';
    ctx.fillRect(visorX, visorY, visorW, visorH);
    // Blink + glow
    const blink = Math.sin(t * 0.005);
    const isBlink = blink > 0.97;
    if (!isBlink) {
        const eyeW = visorW * 0.3;
        const eyeH = visorH * 0.55;
        const ey = visorY + (visorH - eyeH) / 2;
        ctx.fillStyle = hexToRgba(face.eye, 0.5);
        ctx.shadowColor = face.eye;
        ctx.shadowBlur = 12;
        ctx.fillRect(visorX + 8, ey, eyeW, eyeH);
        ctx.fillRect(visorX + visorW - 8 - eyeW, ey, eyeW, eyeH);
        ctx.fillStyle = face.eye;
        ctx.shadowBlur = 8;
        ctx.fillRect(visorX + 12, ey + 2, eyeW - 8, eyeH - 4);
        ctx.fillRect(visorX + visorW - 12 - (eyeW - 8), ey + 2, eyeW - 8, eyeH - 4);
        ctx.shadowBlur = 0;
    } else {
        ctx.fillStyle = hexToRgba(face.eye, 0.5);
        ctx.fillRect(visorX + 8, visorY + visorH / 2 - 1, visorW * 0.3, 2);
        ctx.fillRect(visorX + visorW - 8 - visorW * 0.3, visorY + visorH / 2 - 1, visorW * 0.3, 2);
    }

    // Indicator lights along top
    for (let i = 0; i < 5; i++) {
        const lx = fx + 8 + i * (fw - 16) / 4;
        const lit = (Math.floor(t / 200 + i) % 3 === 0);
        ctx.fillStyle = lit ? face.accent : '#222';
        ctx.shadowColor = lit ? face.color : 'transparent';
        ctx.shadowBlur = lit ? 8 : 0;
        ctx.beginPath();
        ctx.arc(lx, fy + 8, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Talking vocoder bars at bottom of screen
    if (talking) {
        const my = fy + fh - 18;
        const bars = 7;
        const bw = (fw - 16) / bars;
        for (let i = 0; i < bars; i++) {
            const phase = (t * 0.03 + i * 0.5);
            const bh = 2 + Math.abs(Math.sin(phase)) * 10;
            ctx.fillStyle = face.color;
            ctx.shadowColor = face.color;
            ctx.shadowBlur = 6;
            ctx.fillRect(fx + 8 + i * bw + 1, my - bh / 2, bw - 2, bh);
        }
        ctx.shadowBlur = 0;
    }

    ctx.restore();
}

// Convert a #rrggbb hex into rgba(R, G, B, A) string for gradient stops.
function hexToRgba(hex, a) {
    if (!hex || hex[0] !== '#' || hex.length < 7) return `rgba(255,255,255,${a})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
}

// Draw the portrait chest — torso with shoulders, pauldrons, armored plate,
// and visible upper arms peeking in from the sides.
function drawPortraitChest(cx, chestCy, panelW, panelH, face, t, breathe) {
    const chestW = panelW * 0.72;
    const chestH = panelH * 0.30;
    const chestX = cx - chestW / 2;
    const chestY = chestCy - chestH / 2;

    // Drop shadow under chest (for separation from panel)
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(cx, chestY + chestH + 6, chestW / 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chest plate — gradient with a clear lit-side and shadow-side
    const cg = ctx.createLinearGradient(chestX, chestY, chestX + chestW, chestY + chestH);
    cg.addColorStop(0, face.accent);
    cg.addColorStop(0.4, face.color);
    cg.addColorStop(1, '#0a1a24');
    ctx.fillStyle = cg;
    ctx.shadowColor = face.color;
    ctx.shadowBlur = 16;
    // Trapezoidal chest (wider top, narrower bottom)
    ctx.beginPath();
    ctx.moveTo(chestX + 8, chestY);
    ctx.lineTo(chestX + chestW - 8, chestY);
    ctx.lineTo(chestX + chestW - 14, chestY + chestH);
    ctx.lineTo(chestX + 14, chestY + chestH);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Inner armor groove (depth detail)
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(chestX + chestW / 2 - 1, chestY + 4, 2, chestH - 8);

    // Top rim highlight (key light)
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(chestX + 12, chestY + 3, chestW - 24, 2);

    // Chest emblem — small glowing diamond in the center
    ctx.fillStyle = face.accent;
    ctx.shadowColor = face.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(cx, chestY + chestH * 0.35);
    ctx.lineTo(cx + 8, chestY + chestH * 0.55);
    ctx.lineTo(cx, chestY + chestH * 0.75);
    ctx.lineTo(cx - 8, chestY + chestH * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 1, chestY + chestH * 0.55 - 1, 2, 2);

    // ===== Shoulder pauldrons (left + right) =====
    const shoulderCy = chestY + 6;
    drawPortraitShoulder(chestX, shoulderCy, true, face);
    drawPortraitShoulder(chestX + chestW, shoulderCy, false, face);

    // ===== Upper arms — peek in from each side =====
    const armY = chestY + 8;
    const armH = chestH * 0.85;
    // Subtle sway on each arm so the body breathes
    const swayL = Math.sin(t * 0.003) * 1;
    const swayR = -swayL;
    // Left arm
    ctx.fillStyle = '#0a1a24';
    ctx.fillRect(chestX - 14 + swayL, armY, 14, armH);
    ctx.fillStyle = face.color;
    ctx.fillRect(chestX - 14 + swayL, armY, 4, armH);
    // Right arm
    ctx.fillStyle = '#0a1a24';
    ctx.fillRect(chestX + chestW + swayR, armY, 14, armH);
    ctx.fillStyle = face.color;
    ctx.fillRect(chestX + chestW + 10 + swayR, armY, 4, armH);
}

// Draw a single shoulder pauldron — a rounded armored cap.
function drawPortraitShoulder(edgeX, cy, isLeft, face) {
    const w = 20, h = 22;
    const sx = isLeft ? edgeX - 8 : edgeX - 12;
    const sy = cy;
    const sg = ctx.createLinearGradient(sx, sy, sx + w, sy + h);
    sg.addColorStop(0, face.accent);
    sg.addColorStop(1, '#0a1a24');
    ctx.fillStyle = sg;
    ctx.shadowColor = face.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(sx + (isLeft ? 0 : 4), sy);
    ctx.quadraticCurveTo(sx + w / 2, sy - 8, sx + (isLeft ? w - 4 : w), sy);
    ctx.lineTo(sx + w, sy + h);
    ctx.lineTo(sx, sy + h);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // Highlight strip
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(sx + 4, sy - 1, w - 8, 2);
}

// Draw the head/helmet/visor for the portrait. Anchored at (hx, hy) → (hx+hw, hy+hh).
function drawPortraitHead(hx, hy, hw, hh, face, mood, shape, t, talking) {
    // ===== Helmet shell — gradient for depth =====
    const headG = ctx.createLinearGradient(hx, hy, hx + hw, hy + hh);
    headG.addColorStop(0, face.accent);
    headG.addColorStop(0.5, face.color);
    headG.addColorStop(1, '#0a1a24');
    ctx.fillStyle = headG;
    ctx.shadowColor = face.color;
    ctx.shadowBlur = 16;
    drawHelmetShape(hx, hy, hw, hh, shape, face);
    ctx.shadowBlur = 0;

    // Rim light highlight on top edge
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(hx + 6, hy + 1, hw - 12, 2);

    // Side shadow (shadow side of face — gives 3D feel)
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(hx + hw - 8, hy + 6, 6, hh - 12);

    // Cheek/jaw plates
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(hx + 4, hy + hh - 10, hw - 8, 6);
    // Jaw gradient highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(hx + 6, hy + hh - 10, hw - 12, 1);

    // ===== Visor / eye area =====
    drawPortraitVisor(hx, hy, hw, hh, face, mood, t);

    // ===== Mouth / vocoder =====
    drawPortraitMouth(hx, hy, hw, hh, face, talking, t);

    // ===== Optional decorations per shape =====
    drawHelmetDecor(hx, hy, hw, hh, shape, face);
}

// Helmet outer shell variants — fills using current ctx style.
function drawHelmetShape(hx, hy, hw, hh, shape, face) {
    if (shape === 'sleek' || shape === 'minimal') {
        // Smooth dome
        ctx.beginPath();
        ctx.moveTo(hx + 10, hy);
        ctx.lineTo(hx + hw - 10, hy);
        ctx.quadraticCurveTo(hx + hw, hy + 4, hx + hw, hy + 14);
        ctx.lineTo(hx + hw, hy + hh - 6);
        ctx.quadraticCurveTo(hx + hw - 4, hy + hh, hx + hw - 12, hy + hh);
        ctx.lineTo(hx + 12, hy + hh);
        ctx.quadraticCurveTo(hx + 4, hy + hh, hx, hy + hh - 6);
        ctx.lineTo(hx, hy + 14);
        ctx.quadraticCurveTo(hx, hy + 4, hx + 10, hy);
        ctx.closePath();
        ctx.fill();
    } else if (shape === 'square') {
        // Boxy with chamfered corners
        ctx.beginPath();
        ctx.moveTo(hx + 6, hy);
        ctx.lineTo(hx + hw - 6, hy);
        ctx.lineTo(hx + hw, hy + 6);
        ctx.lineTo(hx + hw, hy + hh - 6);
        ctx.lineTo(hx + hw - 6, hy + hh);
        ctx.lineTo(hx + 6, hy + hh);
        ctx.lineTo(hx, hy + hh - 6);
        ctx.lineTo(hx, hy + 6);
        ctx.closePath();
        ctx.fill();
    } else if (shape === 'horned' || shape === 'spiked' || shape === 'crowned' || shape === 'crownking') {
        // Boxy base — decorations added separately
        ctx.beginPath();
        ctx.moveTo(hx + 4, hy);
        ctx.lineTo(hx + hw - 4, hy);
        ctx.quadraticCurveTo(hx + hw, hy + 6, hx + hw, hy + 16);
        ctx.lineTo(hx + hw, hy + hh - 4);
        ctx.lineTo(hx, hy + hh - 4);
        ctx.lineTo(hx, hy + 16);
        ctx.quadraticCurveTo(hx, hy + 6, hx + 4, hy);
        ctx.closePath();
        ctx.fill();
    } else if (shape === 'voidmask') {
        // Hooded round head
        ctx.beginPath();
        ctx.ellipse(hx + hw / 2, hy + hh / 2, hw / 2, hh / 2 + 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Lower hood shadow
        ctx.save();
        ctx.fillStyle = '#0a0014';
        ctx.beginPath();
        ctx.ellipse(hx + hw / 2, hy + hh - 6, hw / 2 - 4, 8, 0, 0, Math.PI);
        ctx.fill();
        ctx.restore();
    }
}

// Per-shape extra decorations (horns, crowns, antennae).
function drawHelmetDecor(hx, hy, hw, hh, shape, face) {
    if (shape === 'horned') {
        ctx.fillStyle = face.accent;
        ctx.shadowColor = face.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(hx + 4, hy + 4);
        ctx.lineTo(hx - 14, hy - 16);
        ctx.lineTo(hx + 16, hy + 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(hx + hw - 4, hy + 4);
        ctx.lineTo(hx + hw + 14, hy - 16);
        ctx.lineTo(hx + hw - 16, hy + 2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    } else if (shape === 'spiked') {
        ctx.fillStyle = face.accent;
        ctx.shadowColor = face.color;
        ctx.shadowBlur = 8;
        for (let i = 0; i < 5; i++) {
            const sx = hx + 8 + i * (hw - 16) / 4;
            ctx.beginPath();
            ctx.moveTo(sx - 4, hy);
            ctx.lineTo(sx, hy - 14);
            ctx.lineTo(sx + 4, hy);
            ctx.closePath();
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    } else if (shape === 'crowned') {
        ctx.fillStyle = face.accent;
        ctx.shadowColor = face.color;
        ctx.shadowBlur = 10;
        for (let i = 0; i < 5; i++) {
            const sx = hx + 6 + i * (hw - 12) / 4;
            ctx.beginPath();
            ctx.moveTo(sx - 5, hy);
            ctx.lineTo(sx, hy - 18 + (i % 2) * 6);
            ctx.lineTo(sx + 5, hy);
            ctx.closePath();
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    } else if (shape === 'crownking') {
        ctx.fillStyle = face.accent;
        ctx.shadowColor = face.color;
        ctx.shadowBlur = 14;
        for (let i = 0; i < 7; i++) {
            const sx = hx + 4 + i * (hw - 8) / 6;
            const ch = (i === 3) ? 24 : (i === 0 || i === 6 ? 14 : 18);
            ctx.beginPath();
            ctx.moveTo(sx - 4, hy);
            ctx.lineTo(sx, hy - ch);
            ctx.lineTo(sx + 4, hy);
            ctx.closePath();
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }
    // Side antennae for sleek/minimal/square — adds personality
    if (shape === 'sleek' || shape === 'minimal' || shape === 'square') {
        ctx.fillStyle = face.color;
        ctx.shadowColor = face.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(hx + 4, hy - 6, 2, 6);
        ctx.fillRect(hx + hw - 6, hy - 6, 2, 6);
        ctx.shadowBlur = 0;
    }
}

// Visor / eye plate — a glowing horizontal slot with two pupils.
function drawPortraitVisor(hx, hy, hw, hh, face, mood, t) {
    const visorY = hy + hh * 0.32;
    const visorW = hw - 14;
    const visorH = hh * 0.22;
    // Visor housing (dark)
    ctx.fillStyle = '#000';
    ctx.fillRect(hx + 7, visorY, visorW, visorH);
    // Inner backplate (slight glow)
    ctx.fillStyle = hexToRgba(face.color, 0.35);
    ctx.fillRect(hx + 8, visorY + 1, visorW - 2, visorH - 2);

    // Eye glow blink check
    const blink = Math.sin(t * 0.005 + (face.color.length || 0) * 0.2);
    const isBlink = blink > 0.97;
    // Slight head tilt eye offset for life
    const eyeShift = Math.sin(t * 0.0015) * 1.5;
    const angryShake = (mood === 'angry' || mood === 'fire') ? Math.sin(t * 0.04) * 1.2 : 0;
    const eyeYOffset = (mood === 'angry' || mood === 'fire') ? 1 : (mood === 'kingly' ? -1 : 0);

    if (!isBlink) {
        // Two glowing pupils inside the visor
        const eyeW = visorW * 0.32;
        const eyeH = (mood === 'angry' || mood === 'fire') ? visorH * 0.45 : visorH * 0.6;
        const ey = visorY + (visorH - eyeH) / 2 + eyeYOffset;
        const lex = hx + 12 + eyeShift + angryShake;
        const rex = hx + hw - 12 - eyeW + eyeShift + angryShake;
        // Outer halo
        ctx.fillStyle = hexToRgba(face.eye, 0.6);
        ctx.shadowColor = face.eye;
        ctx.shadowBlur = 14;
        ctx.fillRect(lex - 2, ey - 1, eyeW + 4, eyeH + 2);
        ctx.fillRect(rex - 2, ey - 1, eyeW + 4, eyeH + 2);
        // Bright eye core
        ctx.fillStyle = face.eye;
        ctx.shadowBlur = 8;
        ctx.fillRect(lex, ey, eyeW, eyeH);
        ctx.fillRect(rex, ey, eyeW, eyeH);
        // Pupil dot
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.fillRect(lex + eyeW * 0.4, ey + eyeH * 0.25, 3, eyeH * 0.5);
        ctx.fillRect(rex + eyeW * 0.4, ey + eyeH * 0.25, 3, eyeH * 0.5);
        // Angry brow lines (like \   /)
        if (mood === 'angry' || mood === 'fire') {
            ctx.strokeStyle = face.color;
            ctx.shadowColor = face.color;
            ctx.shadowBlur = 6;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(lex - 4, ey - 3);
            ctx.lineTo(lex + eyeW + 1, ey + 1);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(rex + eyeW + 4, ey - 3);
            ctx.lineTo(rex - 1, ey + 1);
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;
        }
    } else {
        // Blink — thin closed eye lines
        ctx.fillStyle = hexToRgba(face.eye, 0.5);
        const ey = visorY + visorH / 2;
        ctx.fillRect(hx + 12, ey - 1, visorW * 0.32, 2);
        ctx.fillRect(hx + hw - 12 - visorW * 0.32, ey - 1, visorW * 0.32, 2);
    }
    ctx.shadowBlur = 0;

    // Glass reflection (curved highlight on the visor)
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(hx + 8, visorY + 1);
    ctx.lineTo(hx + 8 + visorW * 0.3, visorY + 1);
    ctx.lineTo(hx + 8 + visorW * 0.18, visorY + visorH * 0.4);
    ctx.lineTo(hx + 8, visorY + visorH * 0.5);
    ctx.closePath();
    ctx.fill();
}

// Mouth/vocoder — two horizontal bars that animate when talking.
function drawPortraitMouth(hx, hy, hw, hh, face, talking, t) {
    const mx = hx + hw / 2;
    const my = hy + hh - 14;
    const mw = hw * 0.42;
    if (talking) {
        // 4 vocoder bars whose height oscillates while text types
        const bars = 5;
        const bw = mw / bars;
        for (let i = 0; i < bars; i++) {
            const phase = (t * 0.025 + i * 0.6);
            const bh = 2 + Math.abs(Math.sin(phase)) * 6;
            const bx = mx - mw / 2 + i * bw + 1;
            ctx.fillStyle = face.color;
            ctx.shadowColor = face.color;
            ctx.shadowBlur = 8;
            ctx.fillRect(bx, my - bh / 2, bw - 2, bh);
        }
        ctx.shadowBlur = 0;
    } else {
        // Closed mouth — two thin lines
        ctx.fillStyle = face.color;
        ctx.shadowColor = face.color;
        ctx.shadowBlur = 4;
        ctx.fillRect(mx - mw / 2, my - 1, mw, 2);
        ctx.shadowBlur = 0;
    }
}

function drawCutscene() {
    if (!cutscene) return;
    // Cinematic black bars
    const barH = 90;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, barH);
    ctx.fillRect(0, canvas.height - barH, canvas.width, barH);

    const line = cutscene.lines[cutscene.idx];
    if (!line) return;

    const tnow = performance.now();
    const charsToShow = Math.min(line.text.length, Math.floor(cutscene.timer / 1.5));
    const isTalking = charsToShow < line.text.length;

    // Anime-style portrait of the active speaker (top corner — alternates side
    // based on speaker so dialogue feels back-and-forth).
    const face = FACE_ART[line.speaker];
    if (face) {
        const portraitW = 220, portraitH = 280;
        // YOU and SHIP A.I. on left; bosses / CONTROL on right
        const isHero = (line.speaker === 'YOU' || line.speaker === 'SHIP A.I.');
        const px = isHero ? 30 : canvas.width - portraitW - 30;
        const py = barH + 20;
        // Slide-in animation when this line first appears
        const slideMax = 18;
        const slideT = Math.min(1, cutscene.timer / 12);
        const slideOff = (1 - slideT) * (isHero ? -slideMax : slideMax);
        const portraitFace = { ...face, name: line.speaker };
        drawRobotPortrait(portraitFace, px + slideOff, py, portraitW, portraitH, isTalking, tnow);
    }

    // Bottom dialogue box
    const boxY = canvas.height - 180;
    const boxH = 100;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(40, boxY, canvas.width - 80, boxH);
    ctx.strokeStyle = line.color;
    ctx.shadowColor = line.color;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2;
    ctx.strokeRect(40, boxY, canvas.width - 80, boxH);
    ctx.shadowBlur = 0;

    // Speaker name
    ctx.fillStyle = line.color;
    ctx.shadowColor = line.color;
    ctx.shadowBlur = 8;
    ctx.font = 'bold 20px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(line.speaker, 60, boxY + 30);
    ctx.shadowBlur = 0;

    // Typewriter dialogue text
    ctx.fillStyle = '#fff';
    ctx.font = '17px Courier New';
    const visible = line.text.slice(0, charsToShow);
    ctx.fillText(visible, 60, boxY + 60);

    // Continue prompt
    if (charsToShow >= line.text.length) {
        const blink = Math.floor(performance.now() / 400) % 2 === 0;
        if (blink) {
            ctx.fillStyle = '#aaa';
            ctx.font = '12px Courier New';
            ctx.textAlign = 'right';
            ctx.fillText('▸ ENTER', canvas.width - 60, boxY + 90);
        }
    }

    ctx.textAlign = 'left';
}

function drawWin() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ffaa';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 52px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('★ ALL STAGES CLEARED ★', canvas.width / 2, canvas.height / 2 - 50);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '20px Courier New';
    ctx.fillText('OMEGA-PRIME has been destroyed.', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle = '#ffdd44';
    ctx.font = '18px Courier New';
    ctx.fillText(`Final Score: ${score}    🪙 Coins: ${player.coins}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillStyle = '#aaa';
    ctx.font = '16px Courier New';
    ctx.fillText('Press R to play again from Stage 1', canvas.width / 2, canvas.height / 2 + 70);
    ctx.textAlign = 'left';
}

function drawStageComplete() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const stage = STAGES[currentStage];
    const reward = WEAPONS[stage.weaponReward];

    ctx.fillStyle = '#00ffaa';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 44px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('STAGE CLEARED', canvas.width / 2, canvas.height / 2 - 110);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '18px Courier New';
    ctx.fillText(`${stage.bossName} destroyed.`, canvas.width / 2, canvas.height / 2 - 75);

    // Weapon unlocked banner
    ctx.fillStyle = reward.color;
    ctx.shadowColor = reward.glow;
    ctx.shadowBlur = 18;
    ctx.font = 'bold 24px Courier New';
    ctx.fillText('★ WEAPON UNLOCKED ★', canvas.width / 2, canvas.height / 2 - 35);
    ctx.font = 'bold 32px Courier New';
    ctx.fillText(reward.name, canvas.width / 2, canvas.height / 2);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#aaa';
    ctx.font = '13px Courier New';
    const desc = `DMG ${reward.damage}  /  Fire ${(60 / reward.cooldown).toFixed(1)}/s  /  ${reward.bullets > 1 ? reward.bullets + ' shots' : 'single'}${reward.pierce ? '  /  PIERCING' : ''}${reward.explosive ? '  /  EXPLOSIVE' : ''}`;
    ctx.fillText(desc, canvas.width / 2, canvas.height / 2 + 22);

    // Character unlock if applicable
    if (stage.charUnlockMsg) {
        ctx.fillStyle = '#ff88ff';
        ctx.shadowColor = '#ff44ff';
        ctx.shadowBlur = 14;
        ctx.font = 'bold 18px Courier New';
        ctx.fillText('★ ' + stage.charUnlockMsg + ' ★', canvas.width / 2, canvas.height / 2 + 60);
        ctx.shadowBlur = 0;
    }

    // Continue prompt
    const blink = Math.floor(performance.now() / 400) % 2 === 0;
    if (blink) {
        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 18px Courier New';
        ctx.fillText('PRESS  ENTER  TO CONTINUE', canvas.width / 2, canvas.height / 2 + 110);
    }

    // Next stage info
    if (currentStage < STAGES.length - 1) {
        ctx.fillStyle = '#888';
        ctx.font = '13px Courier New';
        ctx.fillText(`Next: ${STAGES[currentStage + 1].name}`, canvas.width / 2, canvas.height / 2 + 145);
    }

    ctx.textAlign = 'left';
}

// =============== SPACE TRANSITION ===============
function startSpaceTransition() {
    spaceState.active = true;
    spaceState.enemiesKilled = 0;
    // More ships required and they grow tougher with each galaxy jump
    spaceState.enemiesRequired = 8 + currentStage * 2;
    spaceState.timer = 0;
    spaceState.stars = [];
    spaceState.flyingEnemies = [];
    spaceState.completing = null;
    spaceState.thrusterPhase = 0;
    spaceState.bankAngle = 0;  // ship banking visual
    spaceState.galaxyTier = currentStage;  // remembered for spawning
    // Intro cinematic — short scripted ambush before combat begins.
    // Phases: 0=approach, 1=warp-in, 2=enemy volley, 3=player power-up, 4=BATTLE
    spaceState.intro = {
        active: true,
        phase: 0,
        timer: 0,
        warpShips: [],            // pre-combat ships warping in
        playerCannonCharge: 0     // 0..1
    };

    for (let i = 0; i < 200; i++) {
        spaceState.stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            depth: 0.3 + Math.random() * 0.7,
            size: 1 + Math.random() * 2.5,
            twinkle: Math.random() * Math.PI * 2
        });
    }

    // RESET HEALTH and give pilot some breathing room
    player.hp = player.maxHp;
    player.invincible = 60;

    player.x = 200;
    player.y = 300;
    player.vx = 0;
    player.vy = 0;
    bullets = [];
    enemyBullets = [];
    coinPickups = [];
    healthDrops = [];
    enemies = [];
    cages = [];

    gameState = 'spaceTransition';
}

function spawnFlyingEnemy() {
    const side = Math.random() < 0.5 ? -1 : 1;
    const fromX = side === 1 ? -50 : canvas.width + 50;
    const fromY = 100 + Math.random() * 400;
    // Scale ship strength by galaxy tier (which stage we are jumping FROM)
    const tier = spaceState.galaxyTier || 0;
    const isElite = tier >= 2 && Math.random() < 0.18 + tier * 0.04;  // chance grows late game
    const hpScale = 1 + tier * 0.45;          // late galaxies = beefy ships
    const dmgBonus = Math.floor(tier * 1.5);  // +1.5 dmg per galaxy
    const speedBonus = tier * 0.18;            // faster as you progress
    const fireRateScale = Math.max(0.6, 1 - tier * 0.07);  // smaller cooldown = faster
    const baseHp = isElite ? 70 : 35;
    const baseDmg = isElite ? 12 : 8;
    const baseColor = isElite
        ? ['#ff0066', '#ff6600', '#ff00aa', '#00ddff'][Math.floor(Math.random() * 4)]
        : ['#ff4444', '#44aaff', '#ff8844', '#aa44ff'][Math.floor(Math.random() * 4)];

    spaceState.flyingEnemies.push({
        x: fromX, y: fromY,
        w: isElite ? 44 : 36, h: isElite ? 34 : 28,
        vx: -side * (1.5 + Math.random() * 1.5 + speedBonus),
        vy: (Math.random() - 0.5) * 1.5,
        hp: Math.round(baseHp * hpScale),
        maxHp: Math.round(baseHp * hpScale),
        damage: baseDmg + dmgBonus,
        bulletSpeed: 5 + tier * 0.5,
        elite: isElite,
        // Elites fire bursts
        burstSize: isElite ? 3 : 1,
        shootTimer: (60 + Math.random() * 60) * fireRateScale,
        baseShootTimer: (60 + Math.random() * 50) * fireRateScale,
        thrusterPhase: Math.random() * Math.PI * 2,
        color: baseColor
    });
}

// ===== SPACE COMBAT INTRO CINEMATIC =====
// Scripted sequence that plays before flight combat begins.
// Phase 0 (0..40):    "warp window detected" banner + camera shake
// Phase 1 (40..120):  enemy ships warp in from edges with light streaks
// Phase 2 (120..170): enemies fire a warning volley toward the player ship
// Phase 3 (170..220): player ship pivots / cannons charge with sparks
// Phase 4 (>220):     battle begins, transfer enemies to spaceState.flyingEnemies
function updateSpaceIntro() {
    const intro = spaceState.intro;
    if (!intro) return;
    intro.timer++;
    const t = intro.timer;

    // Phase 1: spawn warp-in ships at intervals
    if (t === 41 || t === 70 || t === 100) {
        const tier = spaceState.galaxyTier || 0;
        const isElite = tier >= 2 && Math.random() < 0.3 + tier * 0.05;
        const side = (t === 70) ? 1 : -1;
        intro.warpShips.push({
            // Final destination
            tx: side > 0 ? canvas.width - 120 - Math.random() * 80 : 100 + Math.random() * 80,
            ty: 100 + Math.random() * 200,
            // Coming from far off-screen
            x: side > 0 ? canvas.width + 100 : -100,
            y: 100 + Math.random() * 200,
            warpAlpha: 0,
            arrivedAt: null,
            firedAt: null,
            elite: isElite,
            color: isElite ? '#ff0066' : ['#ff4444', '#44aaff', '#ff8844', '#aa44ff'][Math.floor(Math.random() * 4)]
        });
    }

    // Move warp ships toward their destination
    for (const ws of intro.warpShips) {
        const ease = 0.06;
        ws.x += (ws.tx - ws.x) * ease;
        ws.y += (ws.ty - ws.y) * ease;
        ws.warpAlpha = Math.min(1, ws.warpAlpha + 0.04);
        const dx = ws.tx - ws.x;
        const dy = ws.ty - ws.y;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && ws.arrivedAt === null) {
            ws.arrivedAt = t;
            spawnShockwave(ws.tx + 18, ws.ty + 14, 80, ws.color);
            screenShake = 6;
        }
        // Phase 2: arrived ships fire a single bullet at the player
        if (ws.arrivedAt !== null && t === ws.arrivedAt + 30 && ws.firedAt === null) {
            ws.firedAt = t;
            const cx = ws.tx + 18, cy = ws.ty + 14;
            const tx = player.x + player.w / 2;
            const ty = player.y + player.h / 2;
            const ang = Math.atan2(ty - cy, tx - cx);
            // Spawn a tracer shot — purely visual, doesn't damage during cinematic
            enemyBullets.push({
                x: cx, y: cy,
                vx: Math.cos(ang) * 7, vy: Math.sin(ang) * 7,
                life: 80, damage: 0,
                cinematic: true
            });
        }
    }

    // Phase 3: player cannon charge ramps from 0 to 1
    if (t > 170 && t <= 220) {
        intro.playerCannonCharge = Math.min(1, (t - 170) / 50);
        if (t % 5 === 0) {
            // sparks at the player ship's gun ports
            const cx = player.x + (player.facing < 0 ? 0 : player.w);
            const cy = player.y + 12;
            spawnParticles(cx, cy, '#ffff66', 4, 4);
        }
        if (t === 215) {
            screenShake = 14;
            spawnShockwave(player.x + player.w / 2, player.y + player.h / 2, 120, '#88ddff');
        }
    }

    // End intro: convert any remaining warp ships into actual flying enemies
    if (t >= 220) {
        for (const ws of intro.warpShips) {
            // Promote into a normal flying enemy at its final position
            const tier = spaceState.galaxyTier || 0;
            const isElite = ws.elite;
            const hpScale = 1 + tier * 0.45;
            const baseHp = isElite ? 70 : 35;
            spaceState.flyingEnemies.push({
                x: ws.tx, y: ws.ty,
                w: isElite ? 44 : 36, h: isElite ? 34 : 28,
                vx: ws.tx < canvas.width / 2 ? 1.5 : -1.5,
                vy: 0,
                hp: Math.round(baseHp * hpScale),
                maxHp: Math.round(baseHp * hpScale),
                damage: (isElite ? 12 : 8) + Math.floor(tier * 1.5),
                bulletSpeed: 5 + tier * 0.5,
                elite: isElite,
                burstSize: isElite ? 3 : 1,
                shootTimer: 30 + Math.random() * 30,
                baseShootTimer: 60,
                thrusterPhase: Math.random() * Math.PI * 2,
                color: ws.color
            });
        }
        intro.active = false;
        // Kill the cinematic tracers (they had damage:0 anyway)
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            if (enemyBullets[i].cinematic) enemyBullets.splice(i, 1);
        }
    }
}

// Render extra cinematic-only visuals on top of the space scene during the
// intro: warp tunnels, charge bar, "ENGAGING..." banner.
function drawSpaceIntro() {
    const intro = spaceState.intro;
    if (!intro || !intro.active) return;
    const t = intro.timer;

    ctx.save();

    // Warp ship streaks — long color lines behind each ship while warping in
    for (const ws of intro.warpShips) {
        if (ws.warpAlpha < 1 && ws.arrivedAt === null) {
            const tailLen = 220 * (1 - ws.warpAlpha + 0.2);
            const fromX = ws.tx > canvas.width / 2 ? ws.x + tailLen : ws.x - tailLen;
            const grad = ctx.createLinearGradient(fromX, ws.y + 14, ws.x + 18, ws.y + 14);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            grad.addColorStop(0.7, ws.color);
            grad.addColorStop(1, '#ffffff');
            ctx.fillStyle = grad;
            ctx.fillRect(Math.min(fromX, ws.x), ws.y + 10, Math.abs(ws.x - fromX) + 20, 8);
        }
        // Ship body
        ctx.fillStyle = ws.color;
        ctx.shadowColor = ws.color;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        const dirX = ws.tx > canvas.width / 2 ? -1 : 1;   // points toward center
        ctx.moveTo(ws.x + (dirX > 0 ? 36 : 0), ws.y + 14);
        ctx.lineTo(ws.x + (dirX > 0 ? 0 : 36), ws.y);
        ctx.lineTo(ws.x + (dirX > 0 ? 8 : 28), ws.y + 14);
        ctx.lineTo(ws.x + (dirX > 0 ? 0 : 36), ws.y + 28);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Arrival shockwave handled via spawnShockwave on arrival
    }

    // Cinematic banner
    let bannerText = null, bannerColor = '#88ddff';
    if (t < 40) { bannerText = '⚠ WARP SIGNATURE DETECTED'; bannerColor = '#ff6644'; }
    else if (t < 120) { bannerText = '⚠ HOSTILES INBOUND'; bannerColor = '#ff8844'; }
    else if (t < 170) { bannerText = '⚠ INCOMING FIRE'; bannerColor = '#ff3344'; }
    else if (t < 220) { bannerText = '◉ CANNONS CHARGING...'; bannerColor = '#88ddff'; }

    if (bannerText) {
        // Black bars + center banner
        const barH = 70;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, barH);
        ctx.fillRect(0, canvas.height - barH, canvas.width, barH);

        const flicker = 0.7 + Math.sin(t * 0.3) * 0.3;
        ctx.globalAlpha = flicker;
        ctx.fillStyle = bannerColor;
        ctx.shadowColor = bannerColor;
        ctx.shadowBlur = 18;
        ctx.font = 'bold 32px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(bannerText, canvas.width / 2, 50);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // Subtitle
        ctx.fillStyle = '#aaa';
        ctx.font = '13px Courier New';
        const subs = [
            `SECTOR ${(spaceState.galaxyTier || 0) + 1} — UNKNOWN VESSELS APPROACHING FAST`,
            `${intro.warpShips.filter(w => w.arrivedAt !== null).length} HOSTILES IN ATTACK FORMATION`,
            'ENEMY VOLLEY DETECTED — RAISE SHIELDS',
            'SYNCING TARGETING SYSTEMS — STAND BY'
        ];
        let sub;
        if (t < 40) sub = subs[0];
        else if (t < 120) sub = subs[1];
        else if (t < 170) sub = subs[2];
        else sub = subs[3];
        ctx.fillText(sub, canvas.width / 2, canvas.height - 38);
    }

    // Player cannon charge bar (Phase 3)
    if (intro.playerCannonCharge > 0) {
        const bw = 280, bh = 8;
        const bx = canvas.width / 2 - bw / 2;
        const by = canvas.height - 90;
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = '#88ddff';
        ctx.shadowColor = '#88ddff';
        ctx.shadowBlur = 12;
        ctx.fillRect(bx, by, bw * intro.playerCannonCharge, bh);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#88ddff';
        ctx.font = 'bold 11px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(`PRIMARY CANNONS: ${Math.round(intro.playerCannonCharge * 100)}%`, canvas.width / 2, by - 4);
    }

    // Player ship "pivot" sparks already spawned via particles — nothing extra.

    // Skip prompt
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px Courier New';
    ctx.textAlign = 'right';
    ctx.fillText('▸ ENTER / SPACE / F to skip', canvas.width - 30, canvas.height - 14);

    ctx.restore();
    ctx.textAlign = 'left';
}

function updateSpaceTransition() {
    spaceState.timer++;

    for (const s of spaceState.stars) {
        s.x -= s.depth * 1.2;
        if (s.x < -10) {
            s.x = canvas.width + 10;
            s.y = Math.random() * canvas.height;
        }
        s.twinkle += 0.05;
    }

    // ===== INTRO CINEMATIC =====
    if (spaceState.intro && spaceState.intro.active) {
        updateSpaceIntro();
        // Most gameplay paused during intro, but particles + stars keep moving.
        // Allow skip with Enter / Space / F
        if ((keys['Enter'] || keys['NumpadEnter'] || keys['Space'] || keys['KeyF']) && !player.spaceIntroSkipHeld) {
            player.spaceIntroSkipHeld = true;
            spaceState.intro.active = false;   // jump straight into combat
        }
        if (!keys['Enter'] && !keys['NumpadEnter'] && !keys['Space'] && !keys['KeyF']) {
            player.spaceIntroSkipHeld = false;
        }
        return;   // freeze normal combat updates while intro plays
    }

    // Pressure: more ships on screen at later galaxies, faster spawning
    const tier = spaceState.galaxyTier || 0;
    const maxOnScreen = 4 + Math.min(4, tier);    // up to 8 simultaneous late-game
    const spawnInterval = Math.max(28, 60 - tier * 5);
    if (spaceState.flyingEnemies.length < maxOnScreen && spaceState.enemiesKilled < spaceState.enemiesRequired) {
        if (spaceState.timer % spawnInterval === 0) {
            spawnFlyingEnemy();
        }
    }

    player.invincible = Math.max(0, player.invincible - 1);
    let mx = 0, my = 0;
    if (keys['KeyA'] || keys['ArrowLeft']) mx = -1;
    if (keys['KeyD'] || keys['ArrowRight']) mx = 1;
    if (keys['KeyW'] || keys['ArrowUp']) my = -1;
    if (keys['KeyS'] || keys['ArrowDown']) my = 1;
    player.vx = mx * 5;
    player.vy = my * 5;
    player.x += player.vx;
    player.y += player.vy;
    if (mx !== 0) player.facing = mx;
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.w) player.x = canvas.width - player.w;
    if (player.y < 30) player.y = 30;
    if (player.y > canvas.height - player.h - 30) player.y = canvas.height - player.h - 30;

    if (player.shootCooldown > 0) player.shootCooldown--;
    if ((keys['KeyF'] || keys['KeyJ']) && player.shootCooldown <= 0) {
        const cx = player.x + player.w / 2;
        const cy = player.y + player.h / 2;
        const w = WEAPONS[player.weaponTier];
        // Twin cannon shots (top + bottom barrel) — looks like the ship's two guns
        const offsets = [-7, 5];
        for (const yOff of offsets) {
            bullets.push({
                x: cx + player.facing * 22, y: cy + yOff,
                vx: player.facing * w.speed, vy: 0,
                life: w.life,
                damage: w.damage,
                color: w.color, glow: w.glow, size: w.size,
                pierce: !!w.pierce, hitEnemies: new Set()
            });
        }
        // Tracer flash at gun tip
        spawnParticles(cx + player.facing * 24, cy - 7, w.glow, 3, 3);
        spawnParticles(cx + player.facing * 24, cy + 5, w.glow, 3, 3);
        screenShake = 3;
        player.shootCooldown = Math.max(2, Math.round(w.cooldown * player.fireRateMul));
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;
        if (b.life <= 0 || b.x < -50 || b.x > canvas.width + 50) { bullets.splice(i, 1); continue; }

        for (let j = spaceState.flyingEnemies.length - 1; j >= 0; j--) {
            const fe = spaceState.flyingEnemies[j];
            if (b.x >= fe.x && b.x <= fe.x + fe.w && b.y >= fe.y && b.y <= fe.y + fe.h) {
                fe.hp -= b.damage;
                spawnParticles(b.x, b.y, b.glow || '#ffff66', 6, 3);
                if (!b.pierce) bullets.splice(i, 1);
                if (fe.hp <= 0) {
                    spawnExplosion(fe.x + fe.w/2, fe.y + fe.h/2);
                    spawnParticles(fe.x + fe.w/2, fe.y + fe.h/2, fe.color, 15, 5);
                    spaceState.flyingEnemies.splice(j, 1);
                    spaceState.enemiesKilled++;
                    score += 50;
                    player.coins += 5;
                    screenShake = 8;
                }
                break;
            }
        }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;
        if (b.life <= 0 || b.x < -50 || b.x > canvas.width + 50) { enemyBullets.splice(i, 1); continue; }

        if (player.invincible <= 0 && b.x > player.x && b.x < player.x + player.w && b.y > player.y && b.y < player.y + player.h) {
            player.hp -= b.damage || 8;
            hitFlash = Math.min(1, hitFlash + 0.4);
            player.invincible = 40;
            screenShake = 6;
            spawnParticles(b.x, b.y, '#ff0000', 6, 3);
            enemyBullets.splice(i, 1);
            if (player.hp <= 0) {
                gameState = 'dead';
                spawnExplosion(player.x + player.w/2, player.y + player.h/2);
            }
        }
    }

    for (let i = spaceState.flyingEnemies.length - 1; i >= 0; i--) {
        const fe = spaceState.flyingEnemies[i];
        fe.x += fe.vx;
        fe.y += fe.vy;
        fe.thrusterPhase += 0.3;
        const dx = (player.x + player.w/2) - (fe.x + fe.w/2);
        const dy = (player.y + player.h/2) - (fe.y + fe.h/2);
        const d = Math.sqrt(dx*dx + dy*dy) || 1;
        fe.vx += (dx/d) * 0.04;
        fe.vy += (dy/d) * 0.04;
        const sp = Math.sqrt(fe.vx*fe.vx + fe.vy*fe.vy);
        const maxSp = 3.5;
        if (sp > maxSp) {
            fe.vx = (fe.vx / sp) * maxSp;
            fe.vy = (fe.vy / sp) * maxSp;
        }
        if (fe.x < -200 || fe.x > canvas.width + 200) {
            spaceState.flyingEnemies.splice(i, 1);
            continue;
        }
        fe.shootTimer--;
        if (fe.shootTimer <= 0 && d < 540) {
            const ang = Math.atan2(dy, dx);
            const burst = fe.burstSize || 1;
            const bulletSp = fe.bulletSpeed || 5;
            for (let bi = 0; bi < burst; bi++) {
                const spread = burst > 1 ? (bi - (burst - 1) / 2) * 0.18 : 0;
                const a = ang + spread;
                enemyBullets.push({
                    x: fe.x + fe.w/2, y: fe.y + fe.h/2,
                    vx: Math.cos(a) * bulletSp, vy: Math.sin(a) * bulletSp,
                    life: 100,
                    damage: fe.damage || 8
                });
            }
            fe.shootTimer = (fe.baseShootTimer || 60) + Math.random() * 30;
        }
        if (player.invincible <= 0 && rectCollide(fe, player)) {
            // Contact damage scales with galaxy tier
            const ramDmg = (fe.elite ? 18 : 12) + (spaceState.galaxyTier || 0) * 2;
            player.hp -= ramDmg;
            hitFlash = Math.min(1, hitFlash + 0.6);
            applyHitStop(3);
            player.invincible = 40;
            player.vx = -dx/d * 8;
            player.vy = -dy/d * 8;
            screenShake = 10;
            if (player.hp <= 0) {
                gameState = 'dead';
            }
        }
    }

    updateParticles();

    if (spaceState.enemiesKilled >= spaceState.enemiesRequired && spaceState.flyingEnemies.length === 0) {
        if (spaceState.completing === null) {
            spaceState.completing = 90;
        }
        spaceState.completing--;
        if (spaceState.completing <= 0) {
            spaceState.active = false;
            spaceState.completing = null;
            gameState = 'stageComplete';
        }
    }
}

function drawSpaceTransition() {
    const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 50, canvas.width/2, canvas.height/2, canvas.width);
    grad.addColorStop(0, '#1a0a30');
    grad.addColorStop(0.5, '#0a0518');
    grad.addColorStop(1, '#000010');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const s of spaceState.stars) {
        const twinkle = 0.5 + Math.sin(s.twinkle) * 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * s.depth})`;
        ctx.shadowColor = '#88aaff';
        ctx.shadowBlur = 4 * twinkle;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.shadowBlur = 0;

    const t = performance.now() * 0.0003;
    for (let i = 0; i < 6; i++) {
        const nx = ((i * 200 - t * 50) % (canvas.width + 400)) - 200;
        const ny = 100 + i * 80;
        const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, 200);
        const colors = ['rgba(255,80,200,0.08)', 'rgba(80,160,255,0.08)', 'rgba(180,80,255,0.07)'];
        ng.addColorStop(0, colors[i % 3]);
        ng.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ng;
        ctx.fillRect(nx - 200, ny - 200, 400, 400);
    }

    const planetX = canvas.width - 150;
    const planetY = 100;
    const pg = ctx.createRadialGradient(planetX - 25, planetY - 25, 5, planetX, planetY, 80);
    pg.addColorStop(0, '#ff8866');
    pg.addColorStop(0.6, '#aa3322');
    pg.addColorStop(1, '#220000');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(planetX, planetY, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 200, 150, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(planetX, planetY, 100, 18, -0.3, 0, Math.PI * 2);
    ctx.stroke();

    const px = player.x;
    const py = player.y;
    ctx.save();
    if (player.invincible > 0 && Math.floor(player.invincible / 3) % 2 === 0) {
        ctx.globalAlpha = 0.4;
    }
    // Compute banking based on movement
    const moveX = (keys['KeyD'] || keys['ArrowRight']) ? 1 : ((keys['KeyA'] || keys['ArrowLeft']) ? -1 : 0);
    const moveY = (keys['KeyS'] || keys['ArrowDown']) ? 1 : ((keys['KeyW'] || keys['ArrowUp']) ? -1 : 0);
    spaceState.bankAngle = (spaceState.bankAngle || 0) * 0.85 + moveY * 0.25 * 0.15;
    spaceState.thrusterPhase = (spaceState.thrusterPhase || 0) + 0.4;

    // Center the ship sprite using transforms so we can rotate/bank
    const cx = px + 18;
    const cy = py + 20;
    ctx.translate(cx, cy);
    ctx.rotate(spaceState.bankAngle);
    ctx.scale(player.facing < 0 ? -1 : 1, 1);

    // === SHIP DESIGN ===
    // Engine glow trail (behind)
    const flameSize = 14 + Math.sin(spaceState.thrusterPhase) * 4;
    const grad1 = ctx.createLinearGradient(-30 - flameSize, 0, -10, 0);
    grad1.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad1.addColorStop(0.4, 'rgba(0, 200, 255, 0.6)');
    grad1.addColorStop(1, 'rgba(255, 255, 255, 1)');
    ctx.fillStyle = grad1;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 22;
    // Twin engine flames (top + bottom)
    ctx.beginPath();
    ctx.moveTo(-10, -5);
    ctx.lineTo(-10 - flameSize, -2);
    ctx.lineTo(-10 - flameSize - 4, 0);
    ctx.lineTo(-10 - flameSize, 2);
    ctx.lineTo(-10, 5);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Hull rear (engines block)
    const hullColor = player.charColor || '#3a8bff';
    const hullDark = '#1a3a6a';
    const hullLight = '#88ccff';

    // Engine pods
    ctx.fillStyle = '#222';
    ctx.fillRect(-12, -10, 8, 6);
    ctx.fillRect(-12, 4, 8, 6);
    // Engine glow holes
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(-10, -7, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-10, 7, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Main hull body (sleek triangular fighter)
    const bodyGrad = ctx.createLinearGradient(0, -14, 0, 14);
    bodyGrad.addColorStop(0, hullLight);
    bodyGrad.addColorStop(0.4, hullColor);
    bodyGrad.addColorStop(1, hullDark);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(22, 0);              // nose
    ctx.lineTo(8, -10);             // top fwd
    ctx.lineTo(-10, -8);            // top rear
    ctx.lineTo(-10, 8);             // bottom rear
    ctx.lineTo(8, 10);              // bottom fwd
    ctx.closePath();
    ctx.fill();
    // Edge highlight
    ctx.strokeStyle = hullLight;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(8, -10);
    ctx.stroke();

    // Wings (swept back triangles)
    ctx.fillStyle = hullDark;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(-10, -22);
    ctx.lineTo(-12, -14);
    ctx.lineTo(-4, -8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(-10, 22);
    ctx.lineTo(-12, 14);
    ctx.lineTo(-4, 8);
    ctx.closePath();
    ctx.fill();
    // Wing tip lights
    ctx.fillStyle = '#ff0066';
    ctx.shadowColor = '#ff0066';
    ctx.shadowBlur = 8;
    ctx.fillRect(-11, -22, 3, 3);
    ctx.fillStyle = '#00ff66';
    ctx.shadowColor = '#00ff66';
    ctx.fillRect(-11, 21, 3, 3);
    ctx.shadowBlur = 0;

    // Cockpit (glowing canopy)
    const cgrad = ctx.createLinearGradient(4, -5, 16, 5);
    cgrad.addColorStop(0, '#88ccff');
    cgrad.addColorStop(0.4, '#003366');
    cgrad.addColorStop(1, '#001144');
    ctx.fillStyle = cgrad;
    ctx.shadowColor = '#88ddff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(10, 0, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Canopy reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(8, -2, 3, 1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hull panel lines (detail)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6, -9);
    ctx.lineTo(-6, 9);
    ctx.stroke();

    // Forward gun barrels (twin cannons under the nose)
    ctx.fillStyle = '#888';
    ctx.fillRect(18, -7, 6, 2);
    ctx.fillRect(18, 5, 6, 2);
    // Barrel tip glow
    ctx.fillStyle = player.charAccent || '#00ffaa';
    ctx.shadowColor = player.charAccent || '#00ffaa';
    ctx.shadowBlur = 4;
    ctx.fillRect(23, -7, 2, 2);
    ctx.fillRect(23, 5, 2, 2);
    ctx.shadowBlur = 0;

    ctx.restore();

    for (const fe of spaceState.flyingEnemies) {
        ctx.save();
        // Elite ships get a pulsing halo so the player can tell them apart
        if (fe.elite) {
            const pulse = 0.5 + Math.sin(performance.now() * 0.008) * 0.5;
            ctx.fillStyle = `rgba(255, 80, 120, ${0.18 + pulse * 0.18})`;
            ctx.shadowColor = '#ff3366';
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.ellipse(fe.x + fe.w / 2, fe.y + fe.h / 2, fe.w * 0.85, fe.h * 0.95, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        const flame = 4 + Math.sin(fe.thrusterPhase) * 2;
        ctx.fillStyle = '#ffaa00';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 10;
        const dirX = Math.sign(fe.vx) || 1;
        ctx.fillRect(fe.x + (dirX > 0 ? 0 : fe.w), fe.y + fe.h/2 - 2, dirX > 0 ? -flame * 2 : flame * 2, 4);
        ctx.fillStyle = fe.color;
        ctx.shadowColor = fe.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(fe.x + (dirX > 0 ? fe.w : 0), fe.y + fe.h/2);
        ctx.lineTo(fe.x + (dirX > 0 ? 0 : fe.w), fe.y);
        ctx.lineTo(fe.x + (dirX > 0 ? 8 : fe.w - 8), fe.y + fe.h/2);
        ctx.lineTo(fe.x + (dirX > 0 ? 0 : fe.w), fe.y + fe.h);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 0;
        ctx.fillRect(fe.x + fe.w/2 - 4, fe.y + fe.h/2 - 2, 8, 4);
        if (fe.hp < fe.maxHp) {
            ctx.fillStyle = '#222';
            ctx.fillRect(fe.x, fe.y - 6, fe.w, 3);
            ctx.fillStyle = fe.elite ? '#ff0066' : '#ff4444';
            ctx.fillRect(fe.x, fe.y - 6, (fe.hp / fe.maxHp) * fe.w, 3);
        }
        // ELITE label
        if (fe.elite) {
            ctx.fillStyle = '#ff66aa';
            ctx.font = 'bold 9px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('ELITE', fe.x + fe.w / 2, fe.y - 9);
            ctx.textAlign = 'left';
        }
        ctx.restore();
    }

    for (const b of bullets) {
        ctx.fillStyle = b.color || '#ffff66';
        ctx.shadowColor = b.glow || '#ffff00';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size || 6, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = '#ff3333';
    ctx.shadowColor = '#ff3333';
    ctx.shadowBlur = 8;
    for (const b of enemyBullets) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;

    for (const p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 14;
    ctx.font = 'bold 28px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('★ SPACE TRANSIT ★', canvas.width / 2, 40);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#aaa';
    ctx.font = '14px Courier New';
    ctx.fillText(`Eliminate hostile interceptors: ${spaceState.enemiesKilled} / ${spaceState.enemiesRequired}`, canvas.width / 2, 62);
    // Galaxy tier indicator — every jump means tougher ships.
    const tier = (spaceState.galaxyTier || 0) + 1;
    ctx.fillStyle = tier >= 5 ? '#ff6644' : (tier >= 3 ? '#ffaa44' : '#88ddff');
    ctx.font = 'bold 12px Courier New';
    ctx.fillText(`SECTOR ${tier}/${STAGES.length} — hostiles scale with each jump`, canvas.width / 2, 78);
    ctx.fillStyle = '#fff';
    ctx.font = '11px Courier New';
    ctx.fillText('WASD: Fly  /  F: Shoot', canvas.width / 2, 96);

    ctx.fillStyle = '#222';
    ctx.fillRect(20, canvas.height - 30, 200, 18);
    ctx.fillStyle = player.hp > 30 ? '#00ff66' : '#ff3333';
    ctx.shadowColor = player.hp > 30 ? '#00ff66' : '#ff3333';
    ctx.shadowBlur = 10;
    ctx.fillRect(20, canvas.height - 30, (player.hp / player.maxHp) * 200, 18);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '11px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, 24, canvas.height - 17);

    if (spaceState.completing !== null) {
        ctx.fillStyle = 'rgba(0, 255, 170, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ffaa';
        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 18;
        ctx.font = 'bold 36px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('SECTOR CLEAR — DOCKING', canvas.width / 2, canvas.height / 2);
    }
    // Draw the intro cinematic on TOP of everything (warp streaks, banner)
    drawSpaceIntro();
    ctx.textAlign = 'left';
}

// Camera
function updateCamera() {
    const targetX = player.x - canvas.width / 2 + player.w / 2;
    const targetY = player.y - canvas.height / 2 + player.h / 2;
    camera.x += (targetX - camera.x) * 0.08;
    camera.y += (targetY - camera.y) * 0.08;
    // Clamp
    if (camera.y > 100) camera.y = 100;
    if (camera.x < 0) camera.x = 0;
}

// Restart
function restart() {
    currentStage = 0;
    player.x = 100; player.y = 400;
    player.vx = 0; player.vy = 0;
    player.hp = 220; player.maxHp = 220;
    player.invincible = 0;
    player.jumps = 0;
    player.dashing = false;
    player.dashTimer = 0;
    player.dashCooldown = 0;
    player.sliding = false;
    // Reset new combat moves
    player.rolling = false; player.rollTimer = 0; player.rollCooldown = 0;
    player.parrying = false; player.parryTimer = 0; player.parryCooldown = 0; player.parrySuccess = 0;
    player.pounding = false; player.poundTrail = 0;
    player.spaceHeld = false;
    player.coins = 0;
    player.bulletDamage = 0;
    player.weaponTier = 0;
    player.weaponsUnlocked = [true, false, false, false, false, false];
    player.maxJumpsBonus = 0;
    player.fireRateMul = 1;
    player.speed = 3.2;
    player.safeX = 100; player.safeY = 400;
    bullets = [];
    enemyBullets = [];
    particles = [];
    dashTrails = [];
    coinPickups = [];
    activeShop = null;
    shopOpen = false;
    shopMessage = null;
    activeWarning = null;
    score = 0;
    camera.x = 0; camera.y = 0;
    gameState = 'playing';
    buildLevel();
}

// Main game loop
function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    // Start game from intro -> char select
    if (gameState === 'intro' && (keys['Enter'] || keys['NumpadEnter']) && !player.enterHeld) {
        gameState = 'charSelect';
        player.enterHeld = true;
    }

    // Char select navigation
    if (gameState === 'charSelect') {
        if (keys['ArrowLeft'] && !player.csLeftHeld) {
            charSelectIndex = (charSelectIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
            player.csLeftHeld = true;
        }
        if (!keys['ArrowLeft']) player.csLeftHeld = false;

        if (keys['ArrowRight'] && !player.csRightHeld) {
            charSelectIndex = (charSelectIndex + 1) % CHARACTERS.length;
            player.csRightHeld = true;
        }
        if (!keys['ArrowRight']) player.csRightHeld = false;

        if ((keys['Enter'] || keys['NumpadEnter']) && !player.enterHeld) {
            const c = CHARACTERS[charSelectIndex];
            if (c.unlocked) {
                applyCharacter(charSelectIndex);
                gameState = 'playing';
                buildLevel();
            }
            player.enterHeld = true;
        }
    }

    // Quick character cycle with TAB during gameplay
    if (gameState === 'playing' && keys['Tab'] && !player.tabHeld) {
        // Find next unlocked character
        let next = selectedChar;
        for (let i = 1; i <= CHARACTERS.length; i++) {
            const idx = (selectedChar + i) % CHARACTERS.length;
            if (CHARACTERS[idx].unlocked) { next = idx; break; }
        }
        if (next !== selectedChar) {
            // Save persistent stuff
            const savedHp = player.hp;
            const savedMaxHp = player.maxHp;
            const savedCoins = player.coins;
            const savedUnlocks = player.weaponsUnlocked.slice();
            const savedTier = player.weaponTier;
            const savedDmg = player.bulletDamage;
            const savedJumps = player.maxJumpsBonus;
            const savedFR = player.fireRateMul;
            const savedX = player.x; const savedY = player.y;
            const savedSafeX = player.safeX; const savedSafeY = player.safeY;
            applyCharacter(next);
            // Restore everything except character base stats
            player.hp = savedHp;
            player.maxHp = savedMaxHp;
            player.coins = savedCoins;
            player.weaponsUnlocked = savedUnlocks;
            player.weaponTier = savedTier;
            player.bulletDamage = savedDmg;
            player.maxJumpsBonus = savedJumps;
            // fireRateMul gets multiplied by character's, so keep player's separate scaling
            player.fireRateMul *= savedFR / CHARACTERS[next].fireRateMul;
            player.x = savedX; player.y = savedY;
            player.safeX = savedSafeX; player.safeY = savedSafeY;
            spawnParticles(player.x + player.w/2, player.y + player.h/2, CHARACTERS[next].color, 20, 5);
            const swapMsg = CHARACTERS[next].name;
            shopMessage = { text: `Swapped to ${swapMsg}`, timer: 80, color: CHARACTERS[next].color };
        }
        player.tabHeld = true;
    }
    if (!keys['Tab']) player.tabHeld = false;

    // Cutscene navigation - press ENTER to advance dialogue
    if (gameState === 'cutscene' && (keys['Enter'] || keys['NumpadEnter']) && !player.enterHeld) {
        if (cutscene) {
            cutscene.idx++;
            cutscene.timer = 0;
            if (cutscene.idx >= cutscene.lines.length) {
                // Cutscene done - resume play, or jump to space transition if flagged
                const next = cutscene.nextState;
                cutscene = null;
                if (next === 'space') {
                    // Drop straight into the space combat sequence. The space
                    // intro cinematic (warp-in, volley, cannons charge) plays
                    // automatically inside startSpaceTransition.
                    startSpaceTransition();
                } else {
                    gameState = 'playing';
                }
            }
        }
        player.enterHeld = true;
    }
    // Tick cutscene timer for typewriter effect
    if (gameState === 'cutscene' && cutscene) {
        cutscene.timer++;
    }

    // Continue from stage complete to next stage
    if (gameState === 'stageComplete' && (keys['Enter'] || keys['NumpadEnter']) && !player.enterHeld) {
        // Save weapon unlocks before switching - we'll preserve them
        const savedUnlocks = player.weaponsUnlocked.slice();
        const savedTier = player.weaponTier;
        const savedCoins = player.coins;
        const savedDmgBonus = player.bulletDamage;
        const savedJumps = player.maxJumpsBonus;
        const savedFireRate = player.fireRateMul;
        const savedSpeedBonus = player.speed - CHARACTERS[selectedChar].speed;
        // Go to character select for next stage (lets player change)
        currentStage++;
        bullets = [];
        enemyBullets = [];
        coinPickups = [];
        healthDrops = [];
        camera.x = 0; camera.y = 0;
        gameState = 'midCharSelect';
        // Restore the persistent stuff after we re-apply character
        player._savedState = { savedUnlocks, savedTier, savedCoins, savedDmgBonus, savedJumps, savedFireRate, savedSpeedBonus };
        player.enterHeld = true;
    }
    if (!keys['Enter'] && !keys['NumpadEnter']) player.enterHeld = false;

    // Mid-game character select (after stage complete)
    if (gameState === 'midCharSelect') {
        if (keys['ArrowLeft'] && !player.csLeftHeld) {
            charSelectIndex = (charSelectIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
            player.csLeftHeld = true;
        }
        if (!keys['ArrowLeft']) player.csLeftHeld = false;

        if (keys['ArrowRight'] && !player.csRightHeld) {
            charSelectIndex = (charSelectIndex + 1) % CHARACTERS.length;
            player.csRightHeld = true;
        }
        if (!keys['ArrowRight']) player.csRightHeld = false;

        if ((keys['Enter'] || keys['NumpadEnter']) && !player.midEnterHeld) {
            const c = CHARACTERS[charSelectIndex];
            if (c.unlocked) {
                applyCharacter(charSelectIndex);
                // Restore persistent stuff
                if (player._savedState) {
                    player.weaponsUnlocked = player._savedState.savedUnlocks;
                    player.weaponTier = player._savedState.savedTier;
                    player.coins = player._savedState.savedCoins;
                    player.bulletDamage = player._savedState.savedDmgBonus;
                    player.maxJumpsBonus = player._savedState.savedJumps;
                    player.fireRateMul = player._savedState.savedFireRate * (player.fireRateMul); // multiplier stacks
                    player.speed += player._savedState.savedSpeedBonus;
                    delete player._savedState;
                }
                // Reset position
                player.x = 100; player.y = 400;
                player.vx = 0; player.vy = 0;
                player.invincible = 60;
                player.safeX = 100; player.safeY = 400;
                // Move allies with player to new stage
                for (const a of allies) {
                    a.x = player.x + (Math.random() - 0.5) * 80;
                    a.y = player.y - 30;
                    a.vx = 0; a.vy = 0;
                    a.hp = a.maxHp;
                }
                gameState = 'playing';
                buildLevel();
            }
            player.midEnterHeld = true;
        }
        if (!keys['Enter'] && !keys['NumpadEnter']) player.midEnterHeld = false;
    }

    // Restart - back to character select
    if ((gameState === 'dead' || gameState === 'won') && keys['KeyR']) {
        currentStage = 0;
        bullets = []; enemyBullets = []; particles = []; dashTrails = [];
        coinPickups = []; healthDrops = []; activeWarning = null;
        cutscene = null;
        switches = []; doors = []; arenaGates = []; bossGates = []; exitPortals = []; floatTexts = [];
        cages = []; allies = [];
        laserGrids = []; terminals = []; keyPickups = []; player.keysHeld = [];
        spaceState.active = false; spaceState.flyingEnemies = []; spaceState.completing = null;
        for (const s of STAGES) { s.cutsceneShown = false; s.spaceCutsceneShown = false; s.victoryCutsceneShown = false; }
        timeSlowFactor = 1;
        score = 0;
        // Reset visual-effect state so a fresh run starts clean
        damageNumbers = [];
        shockwaves = [];
        bgStars = [];
        hitFlash = 0;
        critFlash = 0;
        hitStop = 0;
        camera.x = 0; camera.y = 0;
        comboCount = 0;
        // Reset persistent stuff
        player.coins = 0;
        player.bulletDamage = 0;
        player.weaponTier = 0;
        player.weaponsUnlocked = [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
        player.maxJumpsBonus = 0;
        player.fireRateMul = 1;
        player.perfectDodgeTimer = 0;
        player.meleeCombo = 0;
        // Reset new combat moves
        player.rolling = false; player.rollTimer = 0; player.rollCooldown = 0;
        player.parrying = false; player.parryTimer = 0; player.parryCooldown = 0; player.parrySuccess = 0;
        player.pounding = false; player.poundTrail = 0;
        gameState = 'charSelect';
    }

    // Update (only when playing). Honor hitstop: brief gameplay pause for impact.
    if (hitStop > 0) {
        hitStop--;
        // particles still tick so flashes don't lock up
        updateParticles();
        updateCamera();
    } else if (gameState === 'playing') {
        if (!shopOpen) {
            updatePlayer();
            updateBullets();
            updateEnemies();
            updateAllies();
            updateCoins();
            updateHealthDrops();
        }
        updateShop();
        updateParticles();
        updateCamera();
    } else if (gameState === 'spaceTransition') {
        updateSpaceTransition();
        updateParticles();
        updateCamera();
    } else if (gameState === 'evoCutscene') {
        updateEvoCutscene();
        updateParticles();
    } else if (gameState === 'throneCutscene') {
        updateThroneCutscene();
        updateParticles();
        updateCamera();
    } else if (gameState === 'bossIntro') {
        updateBossIntro();
        updateParticles();
        updateCamera();
    } else {
        updateParticles();
        updateCamera();
    }

    // Screen shake
    let shakeX = 0, shakeY = 0;
    if (screenShake > 0) {
        shakeX = (Math.random() - 0.5) * screenShake;
        shakeY = (Math.random() - 0.5) * screenShake;
        screenShake *= 0.8;
        if (screenShake < 0.5) screenShake = 0;
    }

    // Draw
    ctx.save();
    ctx.translate(shakeX, shakeY);

    if (gameState === 'spaceTransition') {
        drawSpaceTransition();
        ctx.restore();
        requestAnimationFrame(gameLoop);
        return;
    }

    ctx.fillStyle = stageBgTint || '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawBgStars();
    drawThrone();
    drawPlatforms();
    drawDoors();
    drawArenaGates();
    drawBossGates();
    drawExitPortals();
    drawSwitches();
    drawTerminals();
    drawLaserGrids();
    drawKeyPickups();
    drawShops();
    drawCoins();
    drawHealthDrops();
    drawDashTrails();
    drawEnemies();
    drawAllies();
    drawPlayer();
    drawBullets();
    drawParticles();
    drawShockwaves();
    drawDamageNumbers();

    // Atmospheric fog overlay (PS-style depth)
    drawFogOverlay();

    // Hit flash + crit flash overlays (drawn after fog so they read clearly)
    drawScreenFlashes();

    drawHUD();
    drawComboBanner();
    drawWarning();
    drawShopUI();
    // Don't draw the upgrade-list popup during the transformation cinematic;
    // it would compete for the screen. It pops up right after the cutscene.
    if (gameState !== 'evoCutscene') drawEvoUnlockPopup();

    if (gameState === 'intro') drawIntro();
    if (gameState === 'charSelect' || gameState === 'midCharSelect') drawCharSelect();
    if (gameState === 'cutscene') drawCutscene();
    if (gameState === 'evoCutscene') drawEvoCutscene();
    if (gameState === 'throneCutscene') drawThroneCutscene();
    if (gameState === 'bossIntro') drawBossIntro();
    if (gameState === 'dead') drawGameOver();
    if (gameState === 'won') drawWin();
    if (gameState === 'stageComplete') drawStageComplete();

    ctx.restore();

    requestAnimationFrame(gameLoop);
}

// ============================================================================
// === STAGE 8 / TITAN-LORD / BOSS-INTRO CINEMATIC SYSTEM ====================
// ============================================================================
//
// New systems added in the "more bosses + transformer + intro cinematics" pass.
// All code below is additive — it does not modify older boss/render logic, just
// extends it via the existing dispatch hooks (drawBossBody switch, bossOrigin
// switch, boss-AI subtype branch, gameState dispatch).
//

// ----- TITAN-LORD: phase-1 mech / phase-2 transforms into a battleship -----
// Phase 1 (HP > 50%): humanoid mech form. Walks, fires shoulder cannons,
//   summons missile swarms, slams the ground for AOE shockwaves.
// Phase 2 (HP <= 50%): folds into a battleship. Body rotates wide, four wing
//   cannons + nose cannon + engine plume. Strafes the arena while bombing.
//
// e.transformTimer — 0..120 frames during the visible fold-down anim.
// e.transformed   — true once phase-2 ship form is locked in.

// Spare flag used during the titan intro to signal the renderer to draw an
// energy build-up overlay. Declared up here so it's reachable from the
// updateBossIntro function below (avoids a temporal dead zone error).
let ctxBossIntroBg = false;

function updateBossTitan(e, playerAngle, slowMul) {
    // Trigger transformation at 50% HP
    if (!e.transformed && e.hp <= e.maxHp * 0.5) {
        e.transformed = true;
        e.transformTimer = 1;
        e.phase = 2;
        // Color shift to a cooler battleship hue
        e.color = '#aaffff';
        // Cinematic feedback
        screenShake = 26;
        spawnShockwave(e.x + e.w/2, e.y + e.h/2, 260, '#66ffff');
        spawnShockwave(e.x + e.w/2, e.y + e.h/2, 380, '#aaffff');
        spawnParticles(e.x + e.w/2, e.y + e.h/2, '#66ffff', 80, 12);
        spawnParticles(e.x + e.w/2, e.y + e.h/2, '#ffffff', 60, 9);
        hitStop = 8;
        if (typeof shopMessage !== 'undefined') {
            shopMessage = { text: '⚠ TITAN-LORD: BATTLESHIP MODE ⚠', timer: 240, color: '#66ffff' };
        }
        // Re-shape the boss to battleship proportions (wider, shallower)
        e.baseW = e.w; e.baseH = e.h;
        e.w = 220; e.h = 110;
        // Re-position so the new bounding box stays visually centered
        e.x = e.baseX - 30;
        e.y = e.baseY + 30;
        e.baseY = e.y;
    }
    if (e.transformTimer > 0 && e.transformTimer < 120) {
        e.transformTimer++;
        // No attacks during fold-down — visual pause
        return;
    }

    // ===== MECH MODE (phase 1) =====
    if (!e.transformed) {
        e.y = e.baseY + Math.sin(e.moveTimer * 0.018) * 30;
        e.x = e.baseX + Math.sin(e.moveTimer * 0.012) * 80;
        e.shootTimer -= slowMul;
        if (e.shootTimer <= 0) {
            e.attackPattern = (e.attackPattern + 1) % 4;
            if (e.attackPattern === 0) {
                // Twin shoulder cannons - aimed bursts
                const oL = bossOrigin(e, 'leftCannon');
                const oR = bossOrigin(e, 'rightCannon');
                muzzleFlash(oL.x, oL.y, '#66ffff', '#00ffff', true);
                muzzleFlash(oR.x, oR.y, '#66ffff', '#00ffff', true);
                for (let i = 0; i < 4; i++) {
                    enemyBullets.push({ x: oL.x, y: oL.y, vx: Math.cos(playerAngle) * (6 + i*0.4), vy: Math.sin(playerAngle) * (6 + i*0.4), life: 110, color: '#aaffff', glow: '#00ffff', size: 6, big: true });
                    enemyBullets.push({ x: oR.x, y: oR.y, vx: Math.cos(playerAngle) * (6 + i*0.4), vy: Math.sin(playerAngle) * (6 + i*0.4), life: 110, color: '#aaffff', glow: '#00ffff', size: 6, big: true });
                }
                e.shootTimer = 50;
            } else if (e.attackPattern === 1) {
                // Chest core — radial energy burst
                const o = bossOrigin(e, 'chestCore');
                muzzleFlash(o.x, o.y, '#ffffff', '#66ffff', true);
                spawnShockwave(o.x, o.y, 100, '#66ffff');
                for (let a = 0; a < 14; a++) {
                    const ang = (a / 14) * Math.PI * 2;
                    enemyBullets.push({ x: o.x, y: o.y, vx: Math.cos(ang) * 4, vy: Math.sin(ang) * 4, life: 95, color: '#aaffff', glow: '#00ffff' });
                }
                e.shootTimer = 70;
            } else if (e.attackPattern === 2) {
                // Missile salvo — 3 lobbing rockets toward player
                const o = bossOrigin(e, 'rightCannon');
                muzzleFlash(o.x, o.y, '#ffaa44', '#ff8800', false);
                for (let i = 0; i < 3; i++) {
                    enemyBullets.push({
                        x: o.x, y: o.y,
                        vx: Math.cos(playerAngle) * (5 + i*0.5),
                        vy: -3 + i * 1.2,
                        life: 130, color: '#ffaa44', glow: '#ff8800',
                        size: 7, lavaGlob: true
                    });
                }
                e.shootTimer = 60;
            } else {
                // Ground slam — boss dives, AOE shockwave from chest core
                const o = bossOrigin(e, 'chestCore');
                spawnShockwave(o.x, o.y, 200, '#ffffff');
                spawnShockwave(o.x, o.y, 320, '#66ffff');
                screenShake = 14;
                for (let a = -2; a <= 2; a++) {
                    const ang = playerAngle + a * 0.18;
                    enemyBullets.push({ x: o.x, y: o.y, vx: Math.cos(ang) * 6, vy: Math.sin(ang) * 6, life: 100, color: '#ffffff', glow: '#66ffff', size: 7, big: true });
                }
                e.shootTimer = 80;
            }
        }
        return;
    }

    // ===== SHIP MODE (phase 2) =====
    // Strafes back and forth across the arena, using all wing+nose cannons.
    e.moveTimer += slowMul;
    e.y = e.baseY + Math.sin(e.moveTimer * 0.018) * 90;
    e.x = e.baseX + Math.sin(e.moveTimer * 0.010) * 220;
    e.shootTimer -= slowMul;

    // Engine smoke trail (always running in ship form)
    if (e.moveTimer % 4 === 0) {
        const en = bossOrigin(e, 'engine');
        spawnParticles(en.x, en.y, '#66ffff', 2, 3);
        spawnParticles(en.x - 10, en.y, '#ffffff', 1, 2);
    }

    if (e.shootTimer <= 0) {
        e.attackPattern = (e.attackPattern + 1) % 4;
        if (e.attackPattern === 0) {
            // FOUR-WING SALVO — each wing cannon fires a heavy aimed shell
            const slots = ['wingTopL','wingTopR','wingBotL','wingBotR'];
            for (const s of slots) {
                const o = bossOrigin(e, s);
                muzzleFlash(o.x, o.y, '#aaffff', '#00ffff', true);
                enemyBullets.push({
                    x: o.x, y: o.y,
                    vx: Math.cos(playerAngle) * 7,
                    vy: Math.sin(playerAngle) * 7,
                    life: 120, color: '#aaffff', glow: '#00ffff',
                    size: 8, big: true, damage: 20
                });
            }
            screenShake = 8;
            e.shootTimer = 38;
        } else if (e.attackPattern === 1) {
            // NOSE CANNON — fat aimed plasma beam (3 bullets in a tight stream)
            const o = bossOrigin(e, 'noseCannon');
            muzzleFlash(o.x, o.y, '#ffffff', '#66ffff', true);
            spawnShockwave(o.x, o.y, 70, '#66ffff');
            for (let i = 0; i < 5; i++) {
                enemyBullets.push({
                    x: o.x, y: o.y,
                    vx: Math.cos(playerAngle) * (9 + i*0.3),
                    vy: Math.sin(playerAngle) * (9 + i*0.3),
                    life: 100, color: '#ffffff', glow: '#00ffff',
                    size: 9, big: true, damage: 22
                });
            }
            e.shootTimer = 60;
        } else if (e.attackPattern === 2) {
            // BOMBING RUN — drop 5 plasma bombs that fall with gravity
            for (let i = 0; i < 5; i++) {
                const dropX = e.x + 30 + i * 35;
                enemyBullets.push({
                    x: dropX, y: e.y + e.h,
                    vx: 0, vy: 1 + i * 0.3,
                    life: 130, color: '#ffaa44', glow: '#ff8800',
                    size: 8, lavaGlob: true
                });
            }
            e.shootTimer = 55;
        } else {
            // RING BARRAGE — 18 bullets from chest/center radiate outward
            const cx = e.x + e.w / 2;
            const cy = e.y + e.h / 2;
            spawnShockwave(cx, cy, 140, '#66ffff');
            for (let a = 0; a < 18; a++) {
                const ang = (a / 18) * Math.PI * 2 + e.moveTimer * 0.01;
                enemyBullets.push({
                    x: cx, y: cy,
                    vx: Math.cos(ang) * 4.5,
                    vy: Math.sin(ang) * 4.5,
                    life: 110, color: '#aaffff', glow: '#00ffff'
                });
            }
            e.shootTimer = 95;
        }
    }
}

// Render TITAN-LORD. Two visual modes plus the animated transition.
function drawBossTitan(ex, ey, e) {
    const w = e.w, h = e.h;
    const phase2 = e.transformed;

    // Color palette per phase
    const baseColor = phase2 ? '#aaffff' : '#66ffff';
    const accentColor = phase2 ? '#ffffff' : '#aaffff';
    const glowColor = phase2 ? '#00ffff' : '#66ffff';

    // ===== MID-TRANSFORM ANIMATION =====
    // While e.transformTimer is between 1..119 we play a fold-down effect.
    if (e.transformTimer > 0 && e.transformTimer < 120) {
        const t = e.transformTimer / 120;
        ctx.save();
        ctx.translate(ex + w/2, ey + h/2);
        // Bright energy core grows
        const coreR = 30 + t * 80;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.arc(0, 0, coreR, 0, Math.PI * 2);
        ctx.fill();
        // Counter-rotating armor rings (like the evolution cinematic)
        for (let r = 0; r < 3; r++) {
            ctx.rotate(t * Math.PI * (r + 1));
            ctx.strokeStyle = baseColor;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 18;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, 60 + r * 26, 0, Math.PI * 1.6);
            ctx.stroke();
        }
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.restore();
        // Sparks shower
        if (e.transformTimer % 3 === 0) {
            spawnParticles(ex + Math.random() * w, ey + Math.random() * h, accentColor, 2, 4);
        }
        return;
    }

    if (!phase2) {
        // ===== MECH FORM =====
        // Tall humanoid silhouette. Wide shoulders, glowing chest core,
        // gauntlet fists, twin shoulder cannons, V-visor.
        ctx.save();
        // Body backplate
        const grd = ctx.createLinearGradient(ex, ey, ex, ey + h);
        grd.addColorStop(0, baseColor);
        grd.addColorStop(0.5, '#1a3a4a');
        grd.addColorStop(1, accentColor);
        ctx.fillStyle = grd;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 14;
        // Torso
        ctx.fillRect(ex + 30, ey + 30, w - 60, h - 60);
        // Shoulder pads (wide)
        ctx.fillRect(ex, ey + 28, 36, 26);
        ctx.fillRect(ex + w - 36, ey + 28, 36, 26);
        // Helmet
        ctx.fillRect(ex + 36, ey, w - 72, 32);
        // Pelvis
        ctx.fillRect(ex + 24, ey + h - 36, w - 48, 22);
        // Legs
        ctx.fillRect(ex + 30, ey + h - 14, 28, 14);
        ctx.fillRect(ex + w - 58, ey + h - 14, 28, 14);
        ctx.shadowBlur = 0;

        // V-visor + glowing eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(ex + 40, ey + 14, w - 80, 10);
        ctx.fillStyle = glowColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 12;
        ctx.fillRect(ex + 28, ey + 18, 18, 6);
        ctx.fillRect(ex + w - 46, ey + 18, 18, 6);
        ctx.shadowBlur = 0;

        // CHEST CORE — pulsing reactor
        const pulse = 0.6 + Math.sin(performance.now() * 0.006) * 0.4;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 22 * pulse;
        ctx.beginPath();
        ctx.arc(ex + w/2, ey + 70, 16 + pulse * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(ex + w/2, ey + 70, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Shoulder cannons — twin barrels poking out from each shoulder pad
        for (const side of [-1, 1]) {
            const sx = side < 0 ? ex - 14 : ex + w;
            const sy = ey + 36;
            ctx.fillStyle = '#0a2a3a';
            ctx.fillRect(sx, sy, 20, 14);
            ctx.fillStyle = baseColor;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10;
            ctx.fillRect(sx + 2, sy + 2, 16, 4);
            ctx.fillRect(sx + 2, sy + 8, 16, 4);
            ctx.shadowBlur = 0;
        }

        // Gauntlet fists — chunky outlined squares
        for (const side of [-1, 1]) {
            const fx = side < 0 ? ex - 22 : ex + w + 6;
            const fy = ey + 110;
            ctx.fillStyle = '#0a1a22';
            ctx.fillRect(fx - 2, fy - 2, 22, 22);
            ctx.fillStyle = accentColor;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 8;
            ctx.fillRect(fx, fy, 18, 18);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(fx + 6, fy + 6, 6, 6);
            ctx.shadowBlur = 0;
        }
        ctx.restore();
        return;
    }

    // ===== SHIP FORM (phase 2) =====
    // Wide horizontal battleship silhouette.
    ctx.save();
    // Hull main shape — long pointed prow on the right, engine block on left
    ctx.fillStyle = baseColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(ex, ey + h * 0.4);              // engine top-rear
    ctx.lineTo(ex + w * 0.8, ey + 14);          // top hull line
    ctx.lineTo(ex + w, ey + h / 2);             // nose tip
    ctx.lineTo(ex + w * 0.8, ey + h - 14);      // bottom hull line
    ctx.lineTo(ex, ey + h * 0.6);               // engine bottom-rear
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Hull paneling (darker stripe down the middle)
    ctx.fillStyle = '#1a3a4a';
    ctx.fillRect(ex + 30, ey + h/2 - 6, w - 70, 12);

    // Wings — top + bottom fins flaring out
    ctx.fillStyle = accentColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    // Top wing
    ctx.beginPath();
    ctx.moveTo(ex + 60, ey + 16);
    ctx.lineTo(ex + 130, ey - 14);
    ctx.lineTo(ex + 170, ey - 14);
    ctx.lineTo(ex + 160, ey + 18);
    ctx.closePath();
    ctx.fill();
    // Bottom wing
    ctx.beginPath();
    ctx.moveTo(ex + 60, ey + h - 16);
    ctx.lineTo(ex + 130, ey + h + 14);
    ctx.lineTo(ex + 170, ey + h + 14);
    ctx.lineTo(ex + 160, ey + h - 18);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Wing cannons (4 of them) — small barrels at wing tips
    const wingPorts = [
        { x: ex + 18, y: ey + 14 },
        { x: ex + w - 22, y: ey + 14 },
        { x: ex + 18, y: ey + h - 18 },
        { x: ex + w - 22, y: ey + h - 18 }
    ];
    for (const p of wingPorts) {
        ctx.fillStyle = '#0a1a22';
        ctx.fillRect(p.x - 4, p.y - 3, 16, 8);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8;
        ctx.fillRect(p.x + 8, p.y - 1, 4, 4);
        ctx.shadowBlur = 0;
    }

    // Nose cannon (long heavy main gun)
    ctx.fillStyle = '#0a1a22';
    ctx.fillRect(ex + w - 6, ey + h/2 - 6, 18, 12);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;
    ctx.fillRect(ex + w + 8, ey + h/2 - 2, 6, 4);
    ctx.shadowBlur = 0;

    // Bridge — small windowed superstructure on top
    ctx.fillStyle = accentColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(ex + w * 0.55, ey + h * 0.2);
    ctx.lineTo(ex + w * 0.7, ey + h * 0.2);
    ctx.lineTo(ex + w * 0.65, ey + h * 0.05);
    ctx.lineTo(ex + w * 0.6, ey + h * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // Bridge windows
    ctx.fillStyle = '#000';
    ctx.fillRect(ex + w * 0.6, ey + h * 0.13, 26, 4);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 6;
    ctx.fillRect(ex + w * 0.6, ey + h * 0.13, 26, 1);
    ctx.shadowBlur = 0;

    // Engine plume — animated flicker on the rear
    const flick = 1 + Math.sin(performance.now() * 0.04) * 0.3;
    ctx.fillStyle = '#66ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(ex - 4, ey + h * 0.4);
    ctx.lineTo(ex - 32 * flick, ey + h * 0.5);
    ctx.lineTo(ex - 4, ey + h * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(ex - 4, ey + h * 0.45);
    ctx.lineTo(ex - 18 * flick, ey + h * 0.5);
    ctx.lineTo(ex - 4, ey + h * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
}

// ============================================================================
// === BOSS-INTRO CINEMATIC SYSTEM ============================================
// ============================================================================
// Each non-Omega boss now gets a unique scripted entrance played BEFORE the
// dialogue cutscene. createBossIntro() returns a state object with subtype-
// specific phases. updateBossIntro() drives the timer and triggers visual
// effects. drawBossIntro() renders cinematic letterbox + caption text.
//
// All entries last 180 frames (~3s) so the player isn't held too long.

function createBossIntro(boss, stage, stageIdx) {
    return {
        timer: 0,
        duration: 180,
        bossX: boss.x, bossY: boss.y,
        baseBossY: boss.y,
        stage: stageIdx,
        stageRef: stage,
        subtype: boss.subtype,
        bossName: stage.bossName,
        bossColor: stage.bossColor || '#ff44ff',
        // Some sub-types want the boss to be visually offset / hidden during
        // their entrance. We move boss.x or boss.y temporarily and snap back
        // when the cinematic ends.
        introOffsetY: 0,
        introOffsetX: 0
    };
}

function updateBossIntro() {
    if (!bossIntro) return;
    bossIntro.timer++;
    const t = bossIntro.timer;
    const stage = bossIntro.stageRef;
    const subtype = bossIntro.subtype;
    const boss = enemies.find(e => e.type === 'boss' || e.type === 'miniboss');

    // === GLOBAL CINEMATIC PUNCH — runs for every boss intro ===
    // Stronger camera shake that ramps with the cinematic, plus rolling
    // sparks and a charge-up energy pulse around the boss. Spark rate is
    // capped so the screen stays readable.
    if (boss) {
        const cx = boss.x + boss.w / 2;
        const cy = boss.y + boss.h / 2;
        // Charge-up sparks orbiting the boss every 8 frames (was 4 — too noisy)
        if (t > 10 && t < 150 && t % 8 === 0) {
            const ang = t * 0.18 + Math.random() * 0.5;
            const r = 90 + Math.sin(t * 0.05) * 30;
            spawnParticles(
                cx + Math.cos(ang) * r,
                cy + Math.sin(ang) * r,
                bossIntro.bossColor,
                2, 5
            );
        }
        // Rumble shake — builds slowly, then big releases at scripted beats
        if (t < 40)        screenShake = Math.max(screenShake, 4);
        else if (t < 100)  screenShake = Math.max(screenShake, 6 + Math.sin(t * 0.4) * 2);
        else if (t < 160)  screenShake = Math.max(screenShake, 10);
        // Energy pulse rings every 40 frames (was 30 — fewer overlapping rings)
        if (t > 20 && t < 160 && t % 40 === 0) {
            spawnShockwave(cx, cy, 60 + (t / 30) * 25, bossIntro.bossColor);
        }
    }

    // Choreography per subtype (kept lightweight — particles + screen shake +
    // boss-Y manipulation are enough to read as a unique entrance).
    if (boss) {
        if (subtype === 'guard') {
            // SLAM-DROP from above. Boss Y eases down from off-screen, lands
            // hard at frame 110 with a shockwave.
            const p = Math.min(1, t / 110);
            const ease = p * p;
            boss.y = bossIntro.baseBossY - 280 + 280 * ease;
            // Energy trail behind the falling boss
            if (t < 110 && t % 3 === 0) {
                spawnParticles(boss.x + boss.w/2, boss.y + boss.h, bossIntro.bossColor, 3, 6);
            }
            if (t === 110) {
                spawnShockwave(boss.x + boss.w/2, boss.y + boss.h, 240, bossIntro.bossColor);
                spawnShockwave(boss.x + boss.w/2, boss.y + boss.h, 360, '#ffffff');
                spawnParticles(boss.x + boss.w/2, boss.y + boss.h, '#ff66dd', 60, 12);
                spawnParticles(boss.x + boss.w/2, boss.y + boss.h, '#ffffff', 30, 10);
                screenShake = 36; hitStop = 8;
            }
        } else if (subtype === 'skyhammer') {
            // ROAR-IN from the right edge. Boss flies in horizontally, brakes
            // at frame 110 with a streaky wind effect.
            const p = Math.min(1, t / 110);
            const ease = 1 - Math.pow(1 - p, 3);
            boss.x = bossIntro.bossX + 600 - 600 * ease;
            if (t % 3 === 0 && t < 110) {
                spawnParticles(boss.x + boss.w + 30, boss.y + boss.h/2, '#0088ff', 6, 10);
                spawnParticles(boss.x + boss.w + 50, boss.y + boss.h/2 + (Math.random()-0.5)*40, '#aaccff', 3, 8);
            }
            if (t === 110) {
                spawnShockwave(boss.x + boss.w/2, boss.y + boss.h/2, 220, bossIntro.bossColor);
                spawnShockwave(boss.x + boss.w/2, boss.y + boss.h/2, 320, '#aaccff');
                screenShake = 28; hitStop = 6;
            }
        } else if (subtype === 'inferno') {
            // RISE-FROM-LAVA. Boss starts buried, rises with hot orange streak.
            const p = Math.min(1, t / 130);
            const ease = 1 - Math.pow(1 - p, 2);
            boss.y = bossIntro.baseBossY + 240 - 240 * ease;
            if (t % 3 === 0 && t < 130) {
                spawnParticles(boss.x + boss.w/2 + (Math.random()-0.5)*80, boss.y + boss.h, '#ff8844', 5, 8);
                spawnParticles(boss.x + boss.w/2 + (Math.random()-0.5)*40, boss.y + boss.h, '#ff3300', 4, 7);
                spawnParticles(boss.x + boss.w/2 + (Math.random()-0.5)*120, boss.y + boss.h - 10, '#ffaa00', 2, 5);
            }
            if (t === 130) {
                spawnShockwave(boss.x + boss.w/2, boss.y + boss.h, 240, '#ff6600');
                spawnShockwave(boss.x + boss.w/2, boss.y + boss.h, 380, '#ffaa00');
                screenShake = 32; hitStop = 6;
            }
        } else if (subtype === 'ravager') {
            // CHARGE-IN — boss screams across the arena from behind the player.
            const p = Math.min(1, t / 110);
            const ease = p * p * p;
            boss.x = bossIntro.bossX + 700 - 700 * ease;
            if (t % 2 === 0) {
                spawnParticles(boss.x + boss.w + 20, boss.y + boss.h/2, '#22ff44', 5, 8);
                spawnParticles(boss.x + boss.w + 40, boss.y + boss.h/2 + (Math.random()-0.5)*30, '#88ff66', 2, 6);
            }
            if (t === 110) {
                spawnShockwave(boss.x + boss.w/2, boss.y + boss.h/2, 240, '#88ff66');
                spawnShockwave(boss.x + boss.w/2, boss.y + boss.h/2, 360, '#ffffff');
                screenShake = 30; hitStop = 6;
            }
        } else if (subtype === 'cryo') {
            // ICE-BURST APPEAR — boss materializes inside an ice shockwave.
            if (t < 60) {
                boss.y = bossIntro.baseBossY - 200;   // hidden offscreen
            } else {
                const p = Math.min(1, (t - 60) / 60);
                const ease = 1 - Math.pow(1 - p, 2);
                boss.y = bossIntro.baseBossY - 200 + 200 * ease;
            }
            if (t === 60) {
                spawnShockwave(boss.x + boss.w/2, boss.y + boss.h/2, 200, '#aaeeff');
                spawnShockwave(boss.x + boss.w/2, boss.y + boss.h/2, 320, '#ffffff');
                spawnShockwave(boss.x + boss.w/2, boss.y + boss.h/2, 460, '#88ccff');
                spawnParticles(boss.x + boss.w/2, boss.y + boss.h/2, '#aaeeff', 100, 12);
                spawnParticles(boss.x + boss.w/2, boss.y + boss.h/2, '#ffffff', 60, 10);
                screenShake = 28; hitStop = 6;
            }
            // Ice shards falling
            if (t > 60 && t < 130 && t % 4 === 0) {
                spawnParticles(boss.x + Math.random() * boss.w, boss.y - 20, '#aaeeff', 2, 4);
            }
        } else if (subtype === 'nullifier') {
            // PHASE-IN GLITCH — boss flickers in and out before solidifying.
            if (t % 3 === 0 && t < 130) {
                spawnParticles(boss.x + Math.random() * boss.w, boss.y + Math.random() * boss.h, '#aa00ff', 3, 5);
                spawnParticles(boss.x + Math.random() * boss.w, boss.y + Math.random() * boss.h, '#ff66ff', 2, 4);
            }
            if (t === 130) {
                spawnShockwave(boss.x + boss.w/2, boss.y + boss.h/2, 240, '#aa00ff');
                spawnShockwave(boss.x + boss.w/2, boss.y + boss.h/2, 360, '#ff44ff');
                spawnParticles(boss.x + boss.w/2, boss.y + boss.h/2, '#ff66ff', 80, 12);
                screenShake = 26; hitStop = 5;
            }
        } else if (subtype === 'titan') {
            // TRANSFORMER FOLD-DOWN — pieces fly in from off-screen and snap
            // into the boss bounding box. Heavy effect to set up the final-
            // final fight.
            const p = Math.min(1, t / 150);
            const cx = boss.x + boss.w / 2;
            const cy = boss.y + boss.h / 2;
            // Energy core builds first
            ctxBossIntroBg = true;  // marker so we don't redraw boss until late
            if (t < 150 && t % 2 === 0) {
                const ang = (t * 0.4) % (Math.PI * 2);
                const r = 280 - p * 240;
                spawnParticles(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, '#66ffff', 4, 6);
                spawnParticles(cx + Math.cos(ang + Math.PI) * r, cy + Math.sin(ang + Math.PI) * r, '#aaffff', 4, 6);
                spawnParticles(cx + Math.cos(ang + Math.PI / 2) * r * 0.7, cy + Math.sin(ang + Math.PI / 2) * r * 0.7, '#ffffff', 3, 5);
            }
            if (t === 150) {
                spawnShockwave(cx, cy, 320, '#66ffff');
                spawnShockwave(cx, cy, 460, '#ffffff');
                spawnShockwave(cx, cy, 600, '#88ccff');
                spawnParticles(cx, cy, '#ffffff', 150, 16);
                screenShake = 44; hitStop = 12;
            }
        }
    }

    // Skip with ENTER/SPACE/F (after a tiny grace period so accidental key
    // presses don't blow past the cinematic instantly).
    if (t > 25 && (keys['Enter'] || keys['NumpadEnter'] || keys['Space'] || keys['KeyF']) && !player.bossIntroSkipHeld) {
        player.bossIntroSkipHeld = true;
        bossIntro.timer = bossIntro.duration;
    }
    if (!keys['Enter'] && !keys['NumpadEnter'] && !keys['Space'] && !keys['KeyF']) {
        player.bossIntroSkipHeld = false;
    }

    // End — snap boss back to its base position and hand off to dialogue.
    if (bossIntro.timer >= bossIntro.duration) {
        if (boss) {
            boss.y = bossIntro.baseBossY;
            boss.x = bossIntro.bossX;
        }
        cutscene = {
            stage: bossIntro.stage,
            lines: bossIntro.stageRef.cutscene,
            idx: 0,
            timer: 0
        };
        bossIntro = null;
        gameState = 'cutscene';
    }
}

// Spare global flag used during the titan intro to signal the renderer to
// draw an energy build-up overlay instead of the body. Optional polish.
// (declared above; left here as a marker.)

// Per-boss subtype taglines used in the cinematic. Falls back to a generic
// line if a subtype isn't listed.
const BOSS_TAGLINES = {
    'guard':     'GATEKEEPER OF THE FACILITY',
    'skyhammer': 'SKY DOMINION ENGAGED',
    'inferno':   'REACTOR CORE — UNCONTAINED',
    'ravager':   'PROTOTYPE WEAPONS ONLINE',
    'cryo':      'ABSOLUTE ZERO — ASCENDED',
    'nullifier': 'EXISTENCE: REVOKED',
    'omega':     'KING OF MACHINES',
    'titan':     'ORBITAL FORTRESS — AWAKE'
};

function drawBossIntro() {
    if (!bossIntro) return;
    const t = bossIntro.timer;
    const dur = bossIntro.duration;
    const p01 = Math.min(1, t / dur);

    // === FULL-SCREEN IMPACT FLASH on the boss-landing beat ===
    // Timed to each subtype's hit frame. Splashes the screen white briefly
    // when the boss connects with the ground.
    const landFrames = { guard: 110, skyhammer: 110, inferno: 130, ravager: 110, cryo: 60, nullifier: 130, titan: 150 };
    const landAt = landFrames[bossIntro.subtype] || 110;
    if (t >= landAt && t < landAt + 18) {
        const flashT = 1 - (t - landAt) / 18;
        ctx.fillStyle = `rgba(255,255,255,${flashT * 0.85})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // Pre-landing red-flash warning a few frames before
    if (t >= landAt - 8 && t < landAt) {
        const warnT = (t - (landAt - 8)) / 8;
        ctx.fillStyle = `rgba(255, 60, 60, ${warnT * 0.35})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Cinematic letterbox bars — taller and slide in faster for impact
    const barH = Math.min(120, t * 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, barH);
    ctx.fillRect(0, canvas.height - barH, canvas.width, barH);
    // Letterbox bottom-edge highlight (chrome line)
    ctx.fillStyle = bossIntro.bossColor;
    ctx.shadowColor = bossIntro.bossColor;
    ctx.shadowBlur = 12;
    ctx.fillRect(0, barH - 2, canvas.width, 2);
    ctx.fillRect(0, canvas.height - barH, canvas.width, 2);
    ctx.shadowBlur = 0;

    // Vertical edge vignette to focus the eye on the center
    const sideGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    sideGrad.addColorStop(0, 'rgba(0,0,0,0.65)');
    sideGrad.addColorStop(0.18, 'rgba(0,0,0,0)');
    sideGrad.addColorStop(0.82, 'rgba(0,0,0,0)');
    sideGrad.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = sideGrad;
    ctx.fillRect(0, barH, canvas.width, canvas.height - barH * 2);

    // Color-tinted scanlines (subtle, only visible mid-cinematic)
    if (t > 20 && t < dur - 20) {
        ctx.save();
        ctx.globalAlpha = 0.10;
        ctx.fillStyle = bossIntro.bossColor;
        for (let y = barH; y < canvas.height - barH; y += 4) {
            ctx.fillRect(0, y, canvas.width, 1);
        }
        ctx.restore();
    }

    // === ENERGY LIGHTNING bolts arcing from the bars toward the boss ===
    // Adds visual tension during the build-up. Random jagged paths.
    if (t > 30 && t < landAt) {
        ctx.save();
        ctx.strokeStyle = bossIntro.bossColor;
        ctx.shadowColor = bossIntro.bossColor;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.7;
        const boltCount = 2;
        for (let b = 0; b < boltCount; b++) {
            const startX = canvas.width * (0.15 + Math.random() * 0.7);
            const startY = b === 0 ? barH : canvas.height - barH;
            const endY = canvas.height / 2;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            const segs = 6;
            for (let s = 1; s <= segs; s++) {
                const sy = startY + (endY - startY) * (s / segs);
                const sx = startX + (Math.random() - 0.5) * 60;
                ctx.lineTo(sx, sy);
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    // Title cut-in (slides in from left) at frame ~35
    if (t > 35) {
        const reveal = Math.min(1, (t - 35) / 30);
        const slideX = (1 - reveal) * -300;
        // Slight vertical wobble during landing for extra impact
        const wobble = (t > landAt && t < landAt + 30)
            ? Math.sin((t - landAt) * 0.5) * (1 - (t - landAt) / 30) * 6
            : 0;
        ctx.save();
        ctx.translate(slideX, wobble);
        // Tagline
        const tagline = BOSS_TAGLINES[bossIntro.subtype] || 'INCOMING THREAT';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = bossIntro.bossColor;
        ctx.shadowBlur = 14;
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        ctx.globalAlpha = reveal * 0.95;
        ctx.fillText(tagline, canvas.width / 2, canvas.height / 2 - 70);
        // Boss name (massive) — glowing red ring on landing
        ctx.globalAlpha = reveal;
        const nameScale = (t > landAt && t < landAt + 12)
            ? 1 + (1 - (t - landAt) / 12) * 0.15
            : 1;
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2 + 6);
        ctx.scale(nameScale, nameScale);
        ctx.fillStyle = bossIntro.bossColor;
        ctx.shadowColor = bossIntro.bossColor;
        ctx.shadowBlur = 36;
        ctx.font = 'bold 84px Courier New';
        ctx.fillText(bossIntro.bossName, 0, 0);
        // Re-stamp the text with a brighter inner pass for chunkiness
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 18;
        ctx.font = 'bold 76px Courier New';
        ctx.fillText(bossIntro.bossName, 0, -2);
        ctx.restore();
        // Sub-line
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Courier New';
        ctx.fillText('▼ — BOSS — ▼', canvas.width / 2, canvas.height / 2 + 56);
        // Decorative slash bars on the sides of the name
        ctx.strokeStyle = bossIntro.bossColor;
        ctx.lineWidth = 5;
        ctx.shadowBlur = 22;
        const nameW = 500;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - nameW / 2 - 30, canvas.height / 2 + 76);
        ctx.lineTo(canvas.width / 2 + nameW / 2 + 30, canvas.height / 2 + 76);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - nameW / 2 - 30, canvas.height / 2 - 92);
        ctx.lineTo(canvas.width / 2 + nameW / 2 + 30, canvas.height / 2 - 92);
        ctx.stroke();
        // Diagonal corner accents (Devil May Cry / Bayonetta style)
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - nameW / 2 - 40, canvas.height / 2 + 76);
        ctx.lineTo(canvas.width / 2 - nameW / 2 - 60, canvas.height / 2 + 96);
        ctx.moveTo(canvas.width / 2 + nameW / 2 + 40, canvas.height / 2 - 92);
        ctx.lineTo(canvas.width / 2 + nameW / 2 + 60, canvas.height / 2 - 112);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // Skip hint
    if (t > 60) {
        ctx.fillStyle = '#888';
        ctx.font = '11px Courier New';
        ctx.textAlign = 'right';
        ctx.fillText('[ENTER] skip', canvas.width - 20, canvas.height - 14);
    }

    // Vignette pulse near the end for impact
    if (t > dur - 30) {
        const f = (t - (dur - 30)) / 30;
        ctx.fillStyle = `rgba(255,255,255,${f * 0.3})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// ============================================================================
// === STAGE 8 ARENA THEME + EXTRAS ===========================================
// ============================================================================
// Lightweight: when stage 8 is active, ensure the boss arena (built later by
// buildBossArena) doesn't trample our stage 8 tone. This is a NO-OP if no
// arena hook fires — the regular arena builder will handle layout. Kept as a
// stub for future expansion.

// ============================================================================
// === PLAYER VEHICLE / TRANSFORM RENDER =====================================
// ============================================================================
// drawVehiclePlayer is called from drawPlayer when player.transformed is true
// or when an in-progress transform animation is running.
//
// Each evolution tier maps to a unique vehicle silhouette:
//   tier 0 (BASE)   → bike       (street motorcycle)
//   tier 1 (MK-II)  → hover      (hoverbike)
//   tier 2 (MK-III) → tank       (treaded tank)
//   tier 3 (OMEGA)  → jet        (winged jet)
//   tier 4 (APEX)   → starfighter (full sci-fi fighter)
//
// During the fold animation, we composite the robot at decreasing opacity
// with the vehicle at increasing opacity for a "Transformers fold-down" feel,
// plus a swirling energy ring around the player and a directional speed
// streak when transformed and moving.

function drawVehiclePlayer(px, py) {
    const w = player.w;
    const h = player.h;
    const cx = px + w / 2;
    const cy = py + h / 2;
    const facing = player.facing || 1;
    const baseColor = player.charColor || '#00ddff';
    const accentColor = player.charAccent || '#00ffaa';
    const evoCol = (typeof EVO_COLORS !== 'undefined' && EVO_COLORS[player.evoLevel]) ? EVO_COLORS[player.evoLevel] : null;
    const armorColor = evoCol ? evoCol.armor : baseColor;
    const glowColor = evoCol ? evoCol.glow : accentColor;

    const animT = player.transformAnim;          // 0 → 1
    const midAnim = animT > 0.05 && animT < 0.95;
    const fullVehicle = animT >= 0.95;

    // ===== Mid-transform energy effects =====
    if (midAnim) {
        // Counter-rotating energy rings
        ctx.save();
        ctx.translate(cx, cy);
        for (let r = 0; r < 3; r++) {
            const ang = (performance.now() * 0.003 + r * 1.2) * (r % 2 === 0 ? 1 : -1);
            ctx.rotate(ang);
            ctx.strokeStyle = r === 0 ? glowColor : (r === 1 ? armorColor : '#ffffff');
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 16;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 22 + r * 8, 0, Math.PI * 1.4);
            ctx.stroke();
        }
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.restore();
        // Sparks
        if (Math.random() < 0.6) {
            spawnParticles(cx + (Math.random() - 0.5) * 30, cy + (Math.random() - 0.5) * 30, accentColor, 1, 4);
        }
    }

    // ===== Vehicle silhouette =====
    // Vehicles are drawn full size at animT===1; partial scale during transform
    const scale = 0.4 + 0.6 * animT;   // grows in
    ctx.save();
    ctx.translate(cx, cy + h * 0.35);   // anchor near wheels/treads
    ctx.scale(facing, 1);
    ctx.scale(scale, scale);

    const vt = player.vehicleType || 'bike';

    if (vt === 'bike') {
        // ----- BIKE: street motorcycle -----
        // Frame
        ctx.fillStyle = baseColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
        ctx.fillRect(-22, -10, 44, 8);
        // Front fairing
        ctx.beginPath();
        ctx.moveTo(22, -10); ctx.lineTo(28, -2); ctx.lineTo(22, -2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Seat
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(-14, -14, 22, 6);
        // Wheels
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(-18, 6, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(18, 6, 7, 0, Math.PI * 2); ctx.fill();
        // Wheel rims (animated rotation)
        const rotT = performance.now() * 0.05;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        for (const wx of [-18, 18]) {
            ctx.save();
            ctx.translate(wx, 6);
            ctx.rotate(rotT * (wx > 0 ? 1 : -1));
            ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.stroke();
            ctx.restore();
        }
        ctx.lineWidth = 1;
        // Headlight
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.fillRect(24, -6, 4, 4);
        ctx.shadowBlur = 0;
    } else if (vt === 'hover') {
        // ----- HOVER: anti-grav hoverbike -----
        // Body
        ctx.fillStyle = armorColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(-26, -2); ctx.lineTo(-18, -12); ctx.lineTo(20, -12);
        ctx.lineTo(28, -4); ctx.lineTo(20, 2); ctx.lineTo(-22, 2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Underglow (hover thrusters)
        const pulse = 0.5 + Math.sin(performance.now() * 0.012) * 0.5;
        ctx.fillStyle = `rgba(102,255,255,${0.5 + pulse * 0.3})`;
        ctx.shadowColor = '#66ffff';
        ctx.shadowBlur = 18;
        ctx.fillRect(-24, 4, 48, 6);
        ctx.shadowBlur = 0;
        // Cockpit windscreen
        ctx.fillStyle = '#88ddff';
        ctx.fillRect(-4, -10, 14, 6);
    } else if (vt === 'tank') {
        // ----- TANK: treaded armored vehicle -----
        // Treads
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-32, 2, 64, 12);
        ctx.fillStyle = '#444';
        for (let i = -28; i < 30; i += 8) {
            ctx.fillRect(i, 4, 6, 8);
        }
        // Hull
        ctx.fillStyle = baseColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 12;
        ctx.fillRect(-26, -10, 52, 14);
        ctx.shadowBlur = 0;
        // Turret
        ctx.fillStyle = armorColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
        ctx.fillRect(-10, -18, 20, 10);
        // Cannon
        ctx.fillRect(8, -14, 22, 4);
        ctx.shadowBlur = 0;
        // Hatch dot
        ctx.fillStyle = '#ffff66';
        ctx.fillRect(-2, -16, 4, 3);
    } else if (vt === 'jet') {
        // ----- JET: winged jet form (OMEGA) -----
        ctx.fillStyle = armorColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 18;
        // Fuselage
        ctx.beginPath();
        ctx.moveTo(-30, 0);
        ctx.lineTo(-12, -10);
        ctx.lineTo(20, -8);
        ctx.lineTo(32, 0);
        ctx.lineTo(20, 8);
        ctx.lineTo(-12, 10);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Wings
        ctx.fillStyle = baseColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(-6, -8);
        ctx.lineTo(-22, -22);
        ctx.lineTo(2, -10);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-6, 8);
        ctx.lineTo(-22, 22);
        ctx.lineTo(2, 10);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Cockpit
        ctx.fillStyle = '#88ddff';
        ctx.fillRect(0, -4, 14, 8);
        // Tail thruster
        const tailFlick = 1 + Math.sin(performance.now() * 0.04) * 0.3;
        ctx.fillStyle = '#ffaa44';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(-30, -3);
        ctx.lineTo(-44 * tailFlick, 0);
        ctx.lineTo(-30, 3);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    } else if (vt === 'hovertank') {
        // ----- HOVERTANK (CONVOY): Optimus Prime style hovering tank -----
        // Wide chrome chassis, blue cab with red side-pods, underglow hover
        // effect. No treads — it floats. Single forward-mounted ion cannon.
        // Underglow disc (anti-grav effect) — drawn first so chassis sits on top
        const hoverPulse = 0.7 + Math.sin(performance.now() * 0.012) * 0.3;
        ctx.fillStyle = `rgba(120, 200, 255, ${0.35 * hoverPulse})`;
        ctx.shadowColor = '#88ddff';
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.ellipse(0, 16, 38, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Inner brighter core
        ctx.fillStyle = `rgba(220, 240, 255, ${0.45 * hoverPulse})`;
        ctx.beginPath();
        ctx.ellipse(0, 16, 24, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Chassis — wide chrome trapezoid (slightly wider at the bottom)
        ctx.beginPath();
        ctx.moveTo(-28, -4);
        ctx.lineTo(28, -4);
        ctx.lineTo(34, 12);
        ctx.lineTo(-34, 12);
        ctx.closePath();
        const chg = ctx.createLinearGradient(0, -4, 0, 12);
        chg.addColorStop(0, '#aaccff');
        chg.addColorStop(0.5, '#5577aa');
        chg.addColorStop(1, '#1a2a44');
        ctx.fillStyle = chg;
        ctx.shadowColor = '#88aaff';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        // Chrome top edge
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillRect(-28, -4, 56, 1);

        // Red side-pods (rear corners)
        ctx.fillStyle = '#aa2222';
        ctx.shadowColor = '#ff5544';
        ctx.shadowBlur = 8;
        ctx.fillRect(-32, 0, 8, 10);
        ctx.fillRect(24, 0, 8, 10);
        ctx.shadowBlur = 0;
        // Pod chrome rim
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(-32, 0, 8, 1);
        ctx.fillRect(24, 0, 8, 1);

        // Blue cab — central raised cockpit
        ctx.fillStyle = '#1a4488';
        ctx.shadowColor = '#5599ff';
        ctx.shadowBlur = 10;
        ctx.fillRect(-14, -14, 28, 12);
        ctx.shadowBlur = 0;
        // Windshield slit
        const wsg = ctx.createLinearGradient(0, -14, 0, -2);
        wsg.addColorStop(0, '#aaddff');
        wsg.addColorStop(1, '#003366');
        ctx.fillStyle = wsg;
        ctx.fillRect(-12, -12, 24, 6);
        // Cab chrome highlight
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(-14, -14, 28, 1);

        // Forward-mounted ion cannon (Matrix blaster barrel)
        ctx.fillStyle = '#222';
        ctx.fillRect(0, -3, 28, 6);
        // Chrome top of cannon
        ctx.fillStyle = '#888';
        ctx.fillRect(0, -3, 28, 1);
        // Glowing energon core inside cannon
        ctx.fillStyle = '#88ddff';
        ctx.shadowColor = '#aaffff';
        ctx.shadowBlur = 12;
        ctx.fillRect(2, -1, 22, 2);
        ctx.shadowBlur = 0;
        // Muzzle ring
        ctx.fillStyle = '#ffd744';
        ctx.shadowColor = '#ffaa44';
        ctx.shadowBlur = 10;
        ctx.fillRect(28, -3, 2, 6);
        ctx.shadowBlur = 0;

        // Autobot emblem on top of the cab
        const emblemPulse = 0.6 + Math.sin(performance.now() * 0.008) * 0.4;
        ctx.fillStyle = '#ffd744';
        ctx.shadowColor = '#ffaa44';
        ctx.shadowBlur = 10 * emblemPulse;
        ctx.beginPath();
        ctx.arc(0, -8, 2 + emblemPulse * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Hover exhaust vents — tiny side jets puffing downward
        const ventPuff = (performance.now() * 0.004) % 1;
        for (const sign of [-1, 1]) {
            ctx.fillStyle = `rgba(180, 220, 255, ${0.5 - ventPuff * 0.5})`;
            ctx.beginPath();
            ctx.arc(sign * 22, 14 + ventPuff * 6, 3 + ventPuff * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (vt === 'starfighter') {
        // ----- STARFIGHTER (APEX/PRIME) — full sci-fi fighter -----
        ctx.fillStyle = armorColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 20;
        // Main hull
        ctx.beginPath();
        ctx.moveTo(-32, 0);
        ctx.lineTo(-16, -12);
        ctx.lineTo(28, -10);
        ctx.lineTo(38, 0);
        ctx.lineTo(28, 10);
        ctx.lineTo(-16, 12);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Big swept wings
        ctx.fillStyle = baseColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 14;
        for (const sign of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(-4, sign * 8);
            ctx.lineTo(-26, sign * 28);
            ctx.lineTo(4, sign * 12);
            ctx.closePath();
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        // Quad cannon nubs at the wing tips
        for (const sign of [-1, 1]) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 12;
            ctx.fillRect(-22, sign * 26 - 2, 8, 4);
            ctx.shadowBlur = 0;
        }
        // Cockpit
        ctx.fillStyle = '#88ffff';
        ctx.fillRect(2, -5, 14, 10);
        // Twin tail thrusters
        const tailFlick = 1 + Math.sin(performance.now() * 0.05) * 0.4;
        for (const sign of [-1, 1]) {
            ctx.fillStyle = glowColor;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.moveTo(-32, sign * 4);
            ctx.lineTo(-50 * tailFlick, sign * 6);
            ctx.lineTo(-32, sign * 8);
            ctx.closePath();
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    ctx.restore();

    // ===== Speed streak when moving =====
    if (fullVehicle && Math.abs(player.vx) > 1) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = glowColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
        for (let s = 0; s < 5; s++) {
            const dy = (Math.random() - 0.5) * h;
            const dx = -facing * (10 + Math.random() * 30);
            ctx.beginPath();
            ctx.moveTo(cx, cy + dy);
            ctx.lineTo(cx + dx, cy + dy);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}



// ============================================================================
// === VEHICLE PROJECTILE SHOOTING ===========================================
// ============================================================================
// Each shootable vehicle (tank, jet, starfighter) fires a unique projectile
// pattern. Bullets re-use the existing bullets[] system so they pierce
// walls/enemies/etc. exactly like normal shots.

function shootVehicleProjectile() {
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    const dir = player.facing;
    const dmgMul = player.dmgMul || 1;

    if (player.vehicleType === 'tank') {
        // ----- TANK: heavy AP rocket from the cannon -----
        // Slow, arcing, high-explosive. Big AOE on impact.
        const ox = cx + dir * 22;
        const oy = cy - 6;
        bullets.push({
            x: ox, y: oy,
            vx: dir * 11,
            vy: -2.0,
            life: 130, damage: Math.round(110 * dmgMul),
            color: '#ffaa44', glow: '#ff6600', size: 12,
            pierce: false, hitEnemies: new Set(),
            explosive: true, aoeRadius: 110,
            rocket: true   // gravity arc
        });
        // Smoke trail at the muzzle
        for (let i = 0; i < 8; i++) {
            spawnParticles(ox - dir * (i * 3), oy + (Math.random() - 0.5) * 4, '#888', 1, 5);
        }
        spawnParticles(ox, oy, '#ffaa44', 14, 7);
        spawnShockwave(ox, oy, 70, '#ff6600');
        screenShake = Math.max(screenShake, 12);
    } else if (player.vehicleType === 'jet') {
        // ----- JET: dual missile barrage -----
        // Twin underwing missiles with light homing arc + small AOE.
        const ports = [
            { x: cx + dir * 16, y: cy - 12 },
            { x: cx + dir * 16, y: cy + 12 }
        ];
        for (const p of ports) {
            bullets.push({
                x: p.x, y: p.y,
                vx: dir * 10,
                vy: 0,
                life: 120, damage: Math.round(55 * dmgMul),
                color: '#ff8866', glow: '#ff4400', size: 8,
                pierce: false, hitEnemies: new Set(),
                explosive: true, aoeRadius: 70,
                rocket: true,   // arcing flight
                homing: true    // mild tracking (handled in updateBullets)
            });
            // Missile launch flash
            spawnParticles(p.x, p.y, '#ff8866', 6, 5);
            spawnParticles(p.x - dir * 8, p.y, '#ffaa44', 4, 4);
        }
        spawnShockwave(cx + dir * 14, cy, 50, '#ff8866');
        screenShake = Math.max(screenShake, 7);
    } else if (player.vehicleType === 'starfighter') {
        // ----- STARFIGHTER (APEX): quad plasma torpedoes -----
        // Highest fire rate. Piercing plasma streams from all four wing tips.
        // Each torpedo is fast, pierces multiple enemies, with light homing.
        const ports = [
            { x: cx + dir * 18, y: cy - 16 },
            { x: cx + dir * 18, y: cy - 5 },
            { x: cx + dir * 18, y: cy + 5 },
            { x: cx + dir * 18, y: cy + 16 }
        ];
        for (const p of ports) {
            bullets.push({
                x: p.x, y: p.y,
                vx: dir * 24,
                vy: 0,
                life: 80, damage: Math.round(48 * dmgMul),
                color: '#66ffff', glow: '#00ffff', size: 7,
                pierce: true, hitEnemies: new Set(),
                homing: true
            });
        }
        spawnParticles(cx + dir * 20, cy, '#66ffff', 12, 6);
        spawnShockwave(cx + dir * 20, cy, 50, '#00ffff');
        screenShake = Math.max(screenShake, 6);
    } else if (player.vehicleType === 'hovertank') {
        // ----- HOVERTANK (CONVOY): Matrix Ion Blast -----
        // A single massive charged shot from the forward cannon. Devastating
        // power, slow rate of fire, big AOE. The "Matrix of Leadership" beam.
        const ox = cx + dir * 30;
        const oy = cy - 4;
        // Main projectile — large piercing ion sphere with heavy AOE
        bullets.push({
            x: ox, y: oy,
            vx: dir * 16,
            vy: 0,
            life: 110, damage: Math.round(180 * dmgMul),
            color: '#ddffff', glow: '#88ddff', size: 14,
            pierce: true, hitEnemies: new Set(),
            explosive: true, aoeRadius: 130
        });
        // Three smaller energy comets trailing the main shot for visual mass
        for (let i = 0; i < 3; i++) {
            bullets.push({
                x: ox - dir * (i * 8 + 6), y: oy + (i % 2 === 0 ? -3 : 3),
                vx: dir * (15 - i * 0.5),
                vy: 0,
                life: 90, damage: Math.round(40 * dmgMul),
                color: '#aaffff', glow: '#88ddff', size: 6,
                pierce: true, hitEnemies: new Set()
            });
        }
        // Massive muzzle flash + charge release effects
        spawnParticles(ox, oy, '#ffffff', 30, 12);
        spawnParticles(ox, oy, '#88ddff', 24, 10);
        spawnParticles(ox, oy, '#ffd744', 12, 8);
        spawnShockwave(ox, oy, 90, '#88ddff');
        spawnShockwave(ox, oy, 130, '#ffffff');
        screenShake = Math.max(screenShake, 18);
    }
}

// Start
applyCharacter(0);
buildLevel();
requestAnimationFrame(gameLoop);
