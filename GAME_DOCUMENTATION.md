# 2D Endless Runner Game - Complete Documentation

## Game Overview
An endless runner game built with HTML5 Canvas and JavaScript where players run through a forest environment, collecting coins, avoiding obstacles, and escaping from a chasing monster.

---

## 🎮 Game Mechanics

### Player Controls
- **SPACEBAR**: Jump (press twice for double jump)
- **ARROW DOWN / S Key**: Crouch/Slide under obstacles
- **Mouse Click**: Alternative jump control

### Player Abilities
1. **Double Jump**: Players can jump a second time while in the air
2. **Slide**: Crouch under high obstacles by holding down arrow/S
3. **Rope Crossing**: Hold SPACE to grab and cross rope obstacles

---

## 💰 Coins

### Coin Collection
- **Coin Value**: 1 point per coin (2 points with Score Multiplier power-up)
- **Score Display**: Shows as "Coin: X" in the top-left UI
- **High Score**: Automatically saved to browser localStorage

### Coin Spawn Patterns
Coins appear in various formations:

1. **Single Coin** (50% chance)
   - 1 coin spawned alone

2. **Two Coins** (30% chance)
   - 2 coins spawned together
   - Arranged horizontally or vertically

3. **Small Group** (12% chance)
   - 3-4 coins arranged in patterns
   - Can be horizontal line, vertical line, or curved arc

4. **Large Group** (8% chance)
   - 5-7 coins in elaborate patterns
   - Horizontal, vertical, or wave formations

### Coin Appearance
- Golden color (#FFD700)
- Rotating animation for visual appeal
- Shine/highlight effect
- Dollar sign ($) symbol in center
- Size: 16x16 pixels

---

## ⚡ Power-Ups

The game features 4 different power-up types:

### 1. Shield 🛡️
- **Duration**: 3 seconds (180 frames)
- **Effect**: Blocks 1 obstacle hit without taking damage
- **Visual**: Blue shield icon with cross pattern
- **Color**: Blue (#3B82F6)
- **Size**: 36x36 pixels

### 2. Coin Magnet 🧲
- **Duration**: 6 seconds (360 frames)
- **Effect**: Automatically attracts coins within 100 pixel radius
- **Visual**: Red horseshoe magnet with +/- symbols
- **Color**: Red (#DC2626)
- **Attraction Range**: 100 pixels
- **Pull Speed**: 3 pixels per frame

### 3. Speed Boost 🚀
- **Duration**: 3 seconds (180 frames)
- **Effect**: 
  - Increases game speed by 80% (1.8x multiplier)
  - Auto-dodge feature automatically jumps/slides over obstacles
- **Visual**: Orange rocket icon with flame trail
- **Color**: Orange (#F59E0B)
- **Speed Multiplier**: 1.8x

### 4. Double Coins 💰💰
- **Duration**: 5 seconds (300 frames)
- **Effect**: All coins collected are worth 2 points instead of 1
- **Visual**: Two overlapping gold coins with "2x" text
- **Color**: Gold (#FFD700)
- **Score Multiplier**: 2x

### Power-Up Spawn Rate
- Appear in the same spawn cycle as coins
- 15% chance when a coin/power-up spawn is triggered
- 85% chance for coins, 15% for power-ups
- Power-up type is randomly selected from all 4 types

---

## 🚧 Obstacles

### Obstacle Types & Spawn Rates

#### Early Game (Score < 50)
1. **Ground Rocks** - 45% spawn rate
   - Most common obstacle
   - Must jump over
   - Size: 35x45 pixels
   - Irregular boulder shape with moss

2. **Flying Birds** - 15% spawn rate
   - Blue jay appearance
   - Two height levels:
     - High (60-80 pixels above ground) - Slide under
     - Low (20-35 pixels above ground) - Jump over
   - Wavy flight pattern
   - Size: 35x20 pixels

3. **Gaps/Pits** - 15% spawn rate
   - Deadly instant game over
   - Width: 80-140 pixels
   - Can spawn 1-4 connected gaps
   - Dark pit with roots and debris
   - Helper platforms spawn automatically

5. **Rope Crossings** - 3% spawn rate
   - Wide gap (200-300 pixels) with rope
   - Hold SPACE to grab and cross
   - Rope swings slightly
   - Letting go causes fall

6. **Fire Traps** - 4% spawn rate
   - Ground-based flame obstacles
   - Always visible and glowing
   - Animated flickering flames
   - Size: 60x30 pixels

7. **Pendulum Axes** - Dynamic spawn rate
   - Swinging axe traps on chains
   - Swing back and forth in arc pattern
   - Chain length: 80-120 pixels
   - Axe size: 25x35 pixels
   - Swing speed varies

8. **Spike Bushes** - Dynamic spawn rate
   - Forest bushes with thorns
   - Ground-based obstacles
   - Spawn in clusters of 3-6
   - Natural organic appearance
   - Size: 22x30 pixels each

9. **Coins/Power-ups** - 18% spawn rate

#### Late Game (Score ≥ 50)
1. **Ground Rocks** - 50% (increased)
2. **Flying Birds** - 18% (increased)
3. **Gaps/Pits** - 12%
4. **Rope Crossings** - 3%
5. **Fire Traps** - 4%
6. **Pendulum Axes** - Dynamic spawns
7. **Spike Bushes** - Dynamic spawns
8. **Coins/Power-ups** - 13%

### Pendulum Axes
- Swinging axe traps on chains
- Swing back and forth in arc pattern
- Chain length: 80-120 pixels
- Axe size: 25x35 pixels
- Swing speed varies

### Spike Bushes
- Forest bushes with thorns
- Ground-based obstacles
- Spawn in clusters of 3-6
- Natural organic appearance
- Size: 22x30 pixels each

---

## 👹 Monster System

### Monster Behavior
The game features a single persistent monster that chases the player.

#### Monster Chase Mechanics
1. **Starting Position**: Spawns far behind player (-100 pixels)
2. **Base Speed**: 3.0 pixels per frame
3. **Chase Distance**: Maintains 250 pixels behind player initially
4. **Progressive Threat**: Gets closer with each obstacle hit

#### Monster Movement
- **Base Speed**: 3.0 pixels/frame
- **Speed Increase**: +80% per obstacle hit
- **Vertical Following**: Tracks player's vertical position
- **Obstacle Avoidance**: 
  - Jumps over ground obstacles, gaps, and fire traps
  - Slides under birds
  - Reacts when obstacles are 150-200 pixels away

### Hit System
- **Hit Threshold**: 2 obstacle hits within 10 seconds
- **Monster States**:
  - Normal (0-1 hits): Yellow/orange eyes, maintains distance
  - Deadly (2+ hits): **Bright red glowing eyes**, catches player on contact

#### Progressive Difficulty
- **Hit 0**: 250 pixel chase distance
- **Hit 1**: 200 pixel chase distance
- **Hit 2+**: 100 pixel chase distance + **DEADLY**

#### Reset Mechanic
- All hits reset if 10 seconds pass without hitting an obstacle
- Monster returns to non-deadly state
- Chase distance resets to 250 pixels

### Monster Appearance
- **Size**: 100x380 pixels
- **Color**: Red/dark crimson tones
- **Features**: 
  - Horns/spikes on head
  - Large claws
  - Single visible eye (side profile)
  - Sharp teeth and protruding fangs
  - Running animation with arm swing

### Catching Animation
When player is caught after 2+ hits:
1. **Phase 0** (30 frames): Monster rushes toward player
2. **Phase 1** (30 frames): Player struggles with shake effect, "CAUGHT!" text appears
3. **Phase 2** (30 frames): Screen fades to black, then game over

---

## 🎯 Game States

### 1. Start Screen
- Displays game title "Endless Runner"
- Shows how-to-play instructions
- Lists all power-up types
- Start button to begin game

### 2. Playing
- Active gameplay state
- Player can control character
- Obstacles spawn and move
- Score/distance tracked
- Monster chases player

### 3. Catching
- Triggered when monster catches player (2+ hits)
- Three-phase animation sequence
- Game speed stops
- Visual effects displayed

### 4. Game Over
- Displays final statistics:
  - Final Coin count
  - Distance traveled (in meters)
  - High Score
- "Play Again" button to restart

---

## 📊 Scoring & Progression

### Score System
- **Coins**: +1 point per coin (+2 with Double Coins power-up)
- **Distance**: Tracked separately in meters
- **High Score**: Automatically saved in browser

### Difficulty Progression
- **Speed Increase**: Game speed increases by 0.5 every 75 coins collected
- **Starting Speed**: 6 pixels per frame
- **Gravity**: 0.7 (increases to 1.05 when falling)

### Slowdown Mechanic
When hitting an obstacle:
- Game speed reduced to 60% of normal
- Slowdown lasts 120 frames (2 seconds)
- Monster gets speed boost during slowdown (1.8x multiplier)

---

## 🎨 Visual Elements

### Environment
1. **Sky**: Gradient from light blue to green
2. **Sun**: 
   - Animated with pulsing effect
   - Golden color with rays
   - Position: Top-right corner
   - Radius: 45 pixels with 30-pixel glow

3. **Clouds**: 
   - 5 clouds floating
   - White with transparency
   - Slow horizontal movement

4. **Background Trees**: 
   - 8 parallax trees
   - Three types: Pine, Round, Tall
   - Depth-based transparency
   - Green forest foliage

5. **Ground**: 
   - Green grass texture
   - Leaf litter patterns
   - Ground level: Canvas height - 100 pixels

### Player Character
- **Size**: 40x60 pixels (standing), 40x30 pixels (sliding)
- **Appearance**: 
  - Blue shirt (#3B82F6)
  - Dark blue pants (#1E3A8A)
  - Brown hair (#92400E)
  - Skin tone (#FBBF24)
  - Green eyes (#059669)
  - Gray shoes (#1F2937)
- **Animations**:
  - Running cycle (4 frames)
  - Jumping with arm swing
  - Sliding/crouching position
  - Rope hanging animation

---

## 🔊 Audio System

### Sound Effects
All sounds are generated using Web Audio API:

1. **Jump Sound**: 
   - Frequency: 400 Hz (sine wave)
   - Duration: 0.15 seconds
   - Additional: 200 Hz triangle wave

2. **Slide Sound**: 
   - Frequency: 150 Hz (sawtooth)
   - Duration: 0.3 seconds

3. **Coin Collection**: 
   - Frequency: 800 Hz → 1000 Hz
   - Duration: 0.1 + 0.08 seconds

4. **Power-Up**: 
   - Frequency: 600 Hz → 800 Hz → 1000 Hz
   - Duration: 0.15 + 0.12 + 0.1 seconds

5. **Hit/Obstacle**: 
   - Frequency: 200 Hz → 150 Hz (sawtooth)
   - Duration: 0.2 + 0.15 seconds

6. **Game Over**: 
   - Descending: 400 Hz → 300 Hz → 200 Hz
   - Duration: 0.3 + 0.3 + 0.5 seconds

### Background Music
- **File**: `song/song.mp3`
- **Volume**: 50%
- **Loop**: Continuous
- **Controls**: 
  - Music toggle button (🎵)
  - Separate from sound effects
  - Saved in localStorage

### Audio Controls
- **Sound Toggle**: 🔊/🔇 button (blue when on, gray when off)
- **Music Toggle**: 🎵 button (green when on, gray when off)
- **Settings Persist**: Saved in browser localStorage

---

## 💾 Data Persistence

### LocalStorage Keys
1. **highScore**: Stores highest coin count achieved
2. **audioEnabled**: Sound effects on/off state (default: true)
3. **musicEnabled**: Background music on/off state (default: true)

---

## 🎮 Platform System

### Moving Platforms
- **Purpose**: Help cross dangerous gaps
- **Appearance**: Brown log with moss
- **Size**: 80-130 pixels wide, 15 pixels tall
- **Movement**: Vertical up/down motion
- **Bounce Range**: 35-60 pixels
- **Speed**: 1.5-4 pixels per frame

### Strategic Platform Spawning
- **Trigger**: Automatically spawns when gaps detected
- **Quantity**: 
  - 1 platform for single gap
  - 2 platforms for double gap
  - 3 platforms for triple gap
  - 4 platforms for quad gap
- **Visual Indicator**: 
  - Brighter green moss
  - "!" help icon above platform
  - Blue glow pulse effect
  - Dotted line showing gap below

---

## 📈 Game Statistics Display

### Top-Left UI Panel
Shows real-time information:
- **Coin**: Current score (coins collected)
- **Distance**: Meters traveled
- **Level**: Current difficulty level (always shows "1")
- **High Coin**: All-time high score
- **Obstacle Hits**: Current hits out of 2 (X/2)
- **Status Indicators**:
  - SLOWED DOWN! (red, when hit recently)
  - DOUBLE JUMP READY! (blue, when in air)
  - SLIDING! (purple, when crouching)
  - SHIELD ACTIVE! (blue, when invulnerable)
  - COIN MAGNET! (yellow, when magnet active)
  - SPEED BOOST! (orange, when boosting)
  - SCORE 2X! (pink, when double coins active)

---

## 🎯 Special Mechanics

### Rope Crossing
1. Player approaches rope obstacle
2. "HOLD SPACE" indicator appears
3. Hold SPACE to grab rope
4. Player swings across gap
5. Rope pulls player forward
6. Release SPACE or reach end to drop

### Auto-Dodge (Speed Boost)
When Speed Boost is active:
- Automatically jumps over ground obstacles within 100 pixels
- Automatically slides under birds within 100 pixels
- No manual input needed during boost

### Coin Magnet Effect
When active:
- Attracts coins within 100-pixel radius
- Coins smoothly move toward player
- Attraction strength: 3 pixels per frame
- Visual: Coins curve toward player

---

## 🔢 Numerical Summary

### Total Coins
- Coins spawn in groups of 1-7
- Spawn rate: 18% (early) / 13% (late game)
- **No maximum limit** - infinite coins available
- Average spawn interval: 40-80 frames (0.67-1.33 seconds)

### Total Power-Ups
- 4 different types available: Shield, Coin Magnet, Speed Boost, Double Coins
- 15% chance when coin/power-up spawn triggered
- **No maximum limit** - infinite power-ups available
- Power-up types randomly selected each spawn

### Total Obstacles
Multiple obstacle types spawn continuously:
- Ground Rocks: Most common
- Flying Birds: Second most common
- Gaps: Medium frequency
- Fire Traps: Rare
- Rope Crossings: Very rare
- Pendulums: Dynamic spawns
- Spikes: Cluster obstacles
- **No maximum limit** - endless obstacles

### Spawn Timers
| Element | Spawn Interval (frames) |
|---------|------------------------|
| Obstacles (Early) | 40-80 |
| Obstacles (Late) | 30-75 |
| Coins/Power-ups | Included in obstacle spawn cycle |

---

## 🎨 Visual Effects

### Particle Effects
1. **Coin Collection**:
   - 6 gold particles
   - Spread in all directions
   - Life: 30 frames

2. **Power-Up Collection**:
   - 8 colored particles (red/cyan/blue)
   - Larger spread
   - Life: 40 frames

3. **Sliding Dust**:
   - Purple dust trail
   - 5 particles behind player
   - Fades over time

### Screen Effects
1. **Hit Flash**:
   - Red screen overlay
   - Fades over 40 frames
   - Alpha: 66% → 0%

2. **Shield Glow**:
   - Blue ellipse around player
   - Pulsing animation
   - Dashed line pattern

3. **Speed Boost Aura**:
   - Red/orange flame trail
   - 5 flame particles behind player
   - Speed lines effect

4. **Catching Animation**:
   - Three-phase monster catch sequence
   - Screen shake and red tint
   - "CAUGHT!" text display
   - Fade to black transition

---

## 🏃 Movement Physics

### Player Physics
- **Jump Velocity**: -12 pixels/frame (first jump), -9 pixels/frame (double jump)
- **Gravity**: 0.7 pixels/frame² (1.05 when falling)
- **Slide Duration**: 20 frames
- **Ground Position**: Canvas height - 100 pixels

### Game Speed
- **Initial**: 6 pixels/frame
- **Increment**: +0.5 every 75 coins
- **Slowdown**: 60% of current speed (after hit)
- **Speed Boost**: 180% of base speed

---

## 🎮 Game Loop

### Update Cycle (60 FPS)
1. Update player physics
2. Spawn new obstacles
3. Update obstacle positions
4. Update monster position and AI
5. Check collisions
6. Update power-up timers
7. Update UI displays
8. Increment distance

### Draw Cycle
1. Draw sky gradient
2. Draw sun with rays
3. Draw clouds
4. Draw background trees
5. Draw ground
6. Draw obstacles and items
7. Draw monster
8. Draw player
9. Draw special effects

---

## 🎯 Win/Loss Conditions

### Game Over Triggers
1. **Falling in Gap**: Instant death, no mercy
2. **Monster Catch**: After 2+ obstacle hits within 10 seconds
3. **No other death conditions**: Single obstacle hits don't kill, only slow down

### No Win Condition
- Game is endless
- Goal is to survive as long as possible
- Maximize coin collection and distance traveled

---

## 📱 Responsive Design

### Canvas Sizing
- Auto-adjusts to window size
- Width: Full window width
- Height: Full window height
- Resize handler updates canvas dimensions

### UI Scaling
- Fixed UI elements at 16px, 20px, 24px font sizes
- Semi-transparent black background panels
- Positioned absolutely on canvas

---

## 🛠️ Technical Details

### Technologies Used
- **HTML5 Canvas**: Game rendering
- **Vanilla JavaScript**: Game logic (ES6 class-based)
- **TailwindCSS**: UI styling (CDN version 4)
- **Web Audio API**: Sound generation
- **LocalStorage API**: Data persistence

### Browser Compatibility
- Modern browsers with Canvas support
- Web Audio API support required
- LocalStorage support required

### Performance
- Target: 60 FPS
- RequestAnimationFrame for smooth animation
- Efficient object pooling (arrays filtered each frame)
- Parallax effects for depth

---

## 🎨 Color Palette

### Player Colors
- Shirt: #3B82F6 (Blue)
- Pants: #1E3A8A (Dark Blue)
- Skin: #FBBF24 (Golden)
- Hair: #92400E (Brown)
- Eyes: #059669 (Green)

### Environment Colors
- Sky: #87CEEB → #98FB98 → #228B22
- Sun: #FFD700 (Gold)
- Grass: #228B22 (Forest Green)
- Trees: #228B22 (Green foliage), #654321 (Brown trunk)

### Obstacle Colors
- Rocks: #696969 (Dim Gray) with #808080 highlights
- Birds: #4169E1 (Royal Blue), #000080 (Navy)
- Fire: #FF6400 → #FF8C00 → #FFA500 (Orange gradient)
- Spikes: #228B22 (Green bushes), #32CD32 (Light green leaves)
- Ropes: #8B4513 (Brown rope), #654321 (Darker rope strands)

### Monster Colors
- Normal: #7F2020 (Dark Red)
- Deadly: #2D1B1B (Very Dark Red)
- Eyes (Normal): #FFA500 (Orange)
- Eyes (Deadly): #FF0000 (Bright Red)

---

## 📝 Tips for Players

1. **Master Double Jump**: Essential for crossing gaps
2. **Watch Bird Heights**: High birds need sliding, low birds need jumping
3. **Avoid 2 Hits**: Monster becomes deadly after 2nd hit
4. **Use Platforms**: Strategic platforms appear near gaps
5. **Collect Power-Ups**: Shield protects from one hit
6. **Speed Boost Strategy**: Auto-dodge makes it safer
7. **Magnet Timing**: Activate near coin clusters
8. **10-Second Reset**: Avoid obstacles for 10 seconds to reset hit counter
9. **Rope Crossing**: Hold SPACE firmly, don't let go
10. **Distance Matters**: Survival time counts as much as coins

---

## 🎯 Special Mechanics

### Rope Crossing
1. Player approaches rope obstacle
2. "HOLD SPACE" indicator appears
3. Hold SPACE to grab rope
4. Player swings across gap
5. Rope pulls player forward
6. Release SPACE or reach end to drop

### Auto-Dodge (Speed Boost)
When Speed Boost is active:
- Automatically jumps over ground obstacles within 100 pixels
- Automatically slides under birds within 100 pixels
- No manual input needed during boost

### Coin Magnet Effect
When active:
- Attracts coins within 100-pixel radius
- Coins smoothly move toward player
- Attraction strength: 3 pixels per frame
- Visual: Coins curve toward player

### Hit Reset Mechanic
- All hits reset if 10 seconds pass without hitting an obstacle
- Monster returns to non-deadly state
- Chase distance resets to 250 pixels

---

## 🎮 Platform System

### Moving Platforms
- **Purpose**: Help cross dangerous gaps
- **Appearance**: Brown log with moss
- **Size**: 80-130 pixels wide, 15 pixels tall
- **Movement**: Vertical up/down motion
- **Bounce Range**: 35-60 pixels
- **Speed**: 1.5-4 pixels per frame

### Strategic Platform Spawning
- **Trigger**: Automatically spawns when gaps detected
- **Quantity**:
  - 1 platform for single gap
  - 2 platforms for double gap
  - 3 platforms for triple gap
  - 4 platforms for quad gap
- **Visual Indicator**:
  - Brighter green moss
  - "!" help icon above platform
  - Blue glow pulse effect
  - Dotted line showing gap below

---

## 📊 Game Statistics Display

### Top-Left UI Panel
Shows real-time information:
- **Coin**: Current score (coins collected)
- **Distance**: Meters traveled
- **Level**: Current difficulty level (always shows "1")
- **High Coin**: All-time high score
- **Obstacle Hits**: Current hits out of 2 (X/2)
- **Status Indicators**:
  - SLOWED DOWN! (red, when hit recently)
  - DOUBLE JUMP READY! (blue, when in air)
  - SLIDING! (purple, when crouching)
  - SHIELD ACTIVE! (blue, when invulnerable)
  - COIN MAGNET! (yellow, when magnet active)
  - SPEED BOOST! (orange, when boosting)
  - SCORE 2X! (pink, when double coins active)

---

## 🔄 Version Information

- **Game Type**: Endless Runner
- **Theme**: Forest Adventure
- **Difficulty**: Progressive (increases with score)
- **Replayability**: High (procedural generation, high score chasing)

---

*Documentation Generated: 14 November 2025*  
*Game Development: HTML5 Canvas + JavaScript*
