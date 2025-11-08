class EndlessRunner {
     constructor() {
          this.canvas = document.getElementById('gameCanvas');
          this.ctx = this.canvas.getContext('2d');
          this.canvas.width = window.innerWidth;
          this.canvas.height = window.innerHeight;
          
          // Audio setup
          this.audioContext = null;
          this.backgroundMusicOscillators = [];
          this.backgroundMusicInterval = null;
          this.audioEnabled = localStorage.getItem('audioEnabled') !== 'false'; // Default to true
          this.musicEnabled = localStorage.getItem('musicEnabled') !== 'false'; // Default to true
          this.initAudio();
          
          this.gameState = 'start'; // start, playing, gameOver
          this.score = 0;
          this.highScore = localStorage.getItem('highScore') || 0;
          this.level = 1; // Add level system
          this.gameSpeed = 6; // Increased from 4 to 6
          this.baseGameSpeed = 6; // Increased from 4 to 6
          this.gravity = 0.5; // Increased from 0.8 to 1.0
          this.slowdownTimer = 0;
          this.hitTimestamps = [];
          this.hitFlash = 0;
          this.lastHitTime = 0; // Track when the last obstacle was hit
          this.consecutiveDangers = 0; // Track consecutive dangerous obstacles spawned
          
          this.ground = this.canvas.height - 100;
          
          // Player properties
          this.player = {
               x: 400,
               y: this.ground - 60,
               width: 40,
               height: 60,
               velocityY: 0,
               jumping: false,
               doubleJumpUsed: false,
               sliding: false,
               slideTimer: 0,
               runFrame: 0
          };
          
          this.obstacles = [];
          this.birds = [];
          this.spikes = [];
          this.movingPlatforms = [];
          this.gaps = [];
          this.coins = [];
          this.powerUps = [];
          this.fallenTrees = [];
          this.fireTraps = [];
          this.monster = null; // Single monster
          this.clouds = [];
          this.backgroundTrees = [];
          this.backgroundWalls = []; // Temple walls for level 2
          this.particles = []; // For visual effects
          this.snowParticles = []; // Snow particles for level 2
          this.dangerousAreas = []; // Track dangerous obstacles that need platform assistance
          
          this.obstacleTimer = 0;
          this.birdTimer = 0;
          this.spikeTimer = 0;
          this.platformTimer = 0;
          this.ballTimer = 0;
          this.cloudTimer = 0;
          this.gapTimer = 0;
          this.coinTimer = 0;
          this.powerUpTimer = 0;
          this.treeTimer = 0;
          this.fireTimer = 0;
          
          // Power-up effects
          this.invulnerable = false;
          this.invulnerableTimer = 0;
          this.magnetCoins = false;
          this.magnetTimer = 0;
          this.speedBoost = false;
          this.speedBoostTimer = 0;
          this.doubleJumpBoost = false;
          this.doubleJumpTimer = 0;
          this.scoreMultiplier = false;
          this.scoreMultiplierTimer = 0;
          this.slowMotion = false;
          this.slowMotionTimer = 0;
          
          this.keys = {};
          
          this.setupEventListeners();
          this.generateClouds();
          this.generateBackgroundTrees();
          this.generateBackgroundWalls();
          this.generateSnowParticles(); // Generate snow particles for level 2
          this.updateHighScore();
          this.updateAudioButtons(); // Initialize audio button states
          this.gameLoop();
     }
     
     initAudio() {
          try {
               this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          } catch (e) {
               console.warn('Web Audio API not supported');
          }
     }
     
     playSound(frequency, duration, type = 'sine', volume = 0.3) {
          if (!this.audioContext || !this.audioEnabled) return;
          
          const oscillator = this.audioContext.createOscillator();
          const gainNode = this.audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext.destination);
          
          oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
          oscillator.type = type;
          
          gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
          
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + duration);
     }
     
     playJumpSound() {
          // High-pitched jump sound
          this.playSound(400, 0.15, 'sine', 0.2);
          // Add a quick lower tone for depth
          setTimeout(() => this.playSound(200, 0.1, 'triangle', 0.15), 50);
     }
     
     playSlideSound() {
          // Low sliding sound
          this.playSound(150, 0.3, 'sawtooth', 0.25);
     }
     
     playCoinSound() {
          // Pleasant coin collection sound
          this.playSound(800, 0.1, 'sine', 0.3);
          setTimeout(() => this.playSound(1000, 0.08, 'sine', 0.2), 50);
     }
     
     playPowerUpSound() {
          // Magical power-up sound
          this.playSound(600, 0.15, 'triangle', 0.3);
          setTimeout(() => this.playSound(800, 0.12, 'triangle', 0.25), 75);
          setTimeout(() => this.playSound(1000, 0.1, 'triangle', 0.2), 150);
     }
     
     playHitSound() {
          // Harsh hit sound
          this.playSound(200, 0.2, 'sawtooth', 0.4);
          setTimeout(() => this.playSound(150, 0.15, 'sawtooth', 0.3), 100);
     }
     
     playGameOverSound() {
          // Descending game over sound
          this.playSound(400, 0.3, 'sawtooth', 0.4);
          setTimeout(() => this.playSound(300, 0.3, 'sawtooth', 0.35), 150);
          setTimeout(() => this.playSound(200, 0.5, 'sawtooth', 0.3), 300);
     }
     
     playLevelUpSound() {
          // Triumphant level up sound
          this.playSound(500, 0.2, 'triangle', 0.4);
          setTimeout(() => this.playSound(600, 0.15, 'triangle', 0.35), 100);
          setTimeout(() => this.playSound(700, 0.15, 'triangle', 0.3), 200);
          setTimeout(() => this.playSound(800, 0.2, 'triangle', 0.25), 300);
     }
     
     // Background music management
     startBackgroundMusic() {
          if (!this.audioContext || !this.musicEnabled) return;
          
          // Stop any existing background music
          this.stopBackgroundMusic();
          
          // Create new background music based on current level
          if (this.level === 1) {
               this.playLevel1Music();
          } else if (this.level === 2) {
               this.playLevel2Music();
          }
     }
     
     stopBackgroundMusic() {
          if (this.backgroundMusicOscillators) {
               this.backgroundMusicOscillators.forEach(osc => {
                    try {
                         osc.stop();
                    } catch (e) {
                         // Oscillator might already be stopped
                    }
               });
          }
          this.backgroundMusicOscillators = [];
          if (this.backgroundMusicInterval) {
               clearInterval(this.backgroundMusicInterval);
               this.backgroundMusicInterval = null;
          }
     }

     toggleAudio() {
          this.audioEnabled = !this.audioEnabled;
          localStorage.setItem('audioEnabled', this.audioEnabled);
          this.updateAudioButtons();
     }

     toggleMusic() {
          this.musicEnabled = !this.musicEnabled;
          localStorage.setItem('musicEnabled', this.musicEnabled);
          this.updateAudioButtons();

          // Start or stop background music based on new setting
          if (this.musicEnabled && this.gameState === 'playing') {
               this.startBackgroundMusic();
          } else {
               this.stopBackgroundMusic();
          }
     }

     updateAudioButtons() {
          const audioBtn = document.getElementById('audioToggle');
          const musicBtn = document.getElementById('musicToggle');

          if (this.audioEnabled) {
               audioBtn.textContent = '🔊 Sound';
               audioBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm';
          } else {
               audioBtn.textContent = '🔇 Sound';
               audioBtn.className = 'bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm';
          }

          if (this.musicEnabled) {
               musicBtn.textContent = '🎵 Music';
               musicBtn.className = 'bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm';
          } else {
               musicBtn.textContent = '🎵 Music';
               musicBtn.className = 'bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm';
          }
     }
     
     playLevel1Music() {
          // Forest adventure theme - melodic and adventurous
          this.backgroundMusicOscillators = [];
          let noteIndex = 0;
          const melody = [
               { freq: 523, duration: 300, type: 'sine' }, // C5 - Forest call
               { freq: 659, duration: 250, type: 'sine' }, // E5 - Adventure
               { freq: 784, duration: 400, type: 'sine' }, // G5 - Journey
               { freq: 659, duration: 200, type: 'sine' }, // E5 - Return
               { freq: 698, duration: 300, type: 'sine' }, // F5 - Discovery
               { freq: 784, duration: 350, type: 'sine' }, // G5 - Exploration
               { freq: 880, duration: 500, type: 'sine' }, // A5 - Triumph
               { freq: 784, duration: 250, type: 'sine' }, // G5 - Rest
               { freq: 698, duration: 300, type: 'sine' }, // F5 - Reflection
               { freq: 659, duration: 350, type: 'sine' }, // E5 - Wisdom
               { freq: 587, duration: 400, type: 'sine' }, // D5 - Growth
               { freq: 523, duration: 600, type: 'sine' }, // C5 - Home
          ];

          const playNextNote = () => {
               if (this.gameState !== 'playing') return;

               const note = melody[noteIndex % melody.length];
               const oscillator = this.audioContext.createOscillator();
               const gainNode = this.audioContext.createGain();

               oscillator.connect(gainNode);
               gainNode.connect(this.audioContext.destination);

               oscillator.frequency.setValueAtTime(note.freq, this.audioContext.currentTime);
               oscillator.type = note.type;

               gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
               gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + note.duration / 1000);

               oscillator.start(this.audioContext.currentTime);
               oscillator.stop(this.audioContext.currentTime + note.duration / 1000);

               this.backgroundMusicOscillators.push(oscillator);

               noteIndex++;
          };

          // Play first note immediately
          playNextNote();

          // Set up interval for continuous melody
          this.backgroundMusicInterval = setInterval(playNextNote, 250); // Steady, adventurous rhythm
     }
     
     playLevel2Music() {
          // Mountain summit theme - triumphant and challenging
          this.backgroundMusicOscillators = [];
          let noteIndex = 0;
          const melody = [
               { freq: 659, duration: 250, type: 'triangle' }, // E5 - Ascent
               { freq: 784, duration: 300, type: 'triangle' }, // G5 - Challenge
               { freq: 880, duration: 350, type: 'triangle' }, // A5 - Triumph
               { freq: 988, duration: 200, type: 'triangle' }, // B5 - Peak
               { freq: 880, duration: 250, type: 'triangle' }, // A5 - Descent
               { freq: 784, duration: 300, type: 'triangle' }, // G5 - Recovery
               { freq: 698, duration: 200, type: 'triangle' }, // F5 - Rest
               { freq: 784, duration: 350, type: 'triangle' }, // G5 - New ascent
               { freq: 880, duration: 400, type: 'triangle' }, // A5 - Higher peak
               { freq: 1047, duration: 300, type: 'triangle' }, // C6 - Summit
               { freq: 988, duration: 250, type: 'triangle' }, // B5 - Achievement
               { freq: 880, duration: 500, type: 'triangle' }, // A5 - Victory
          ];

          const playNextNote = () => {
               if (this.gameState !== 'playing') return;

               const note = melody[noteIndex % melody.length];
               const oscillator = this.audioContext.createOscillator();
               const gainNode = this.audioContext.createGain();

               oscillator.connect(gainNode);
               gainNode.connect(this.audioContext.destination);

               oscillator.frequency.setValueAtTime(note.freq, this.audioContext.currentTime);
               oscillator.type = note.type;

               gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
               gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + note.duration / 1000);

               oscillator.start(this.audioContext.currentTime);
               oscillator.stop(this.audioContext.currentTime + note.duration / 1000);

               this.backgroundMusicOscillators.push(oscillator);

               noteIndex++;
          };

          // Play first note immediately
          playNextNote();

          // Set up interval for continuous melody
          this.backgroundMusicInterval = setInterval(playNextNote, 200); // Steady, triumphant rhythm
     }
     
     setupEventListeners() {
          document.addEventListener('keydown', (e) => {
               this.keys[e.code] = true;
               if (e.code === 'Space') {
                    e.preventDefault();
                    this.jump();
               }
               if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                    e.preventDefault();
                    this.slide();
               }
          });
          
          document.addEventListener('keyup', (e) => {
               this.keys[e.code] = false;
               if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                    this.stopSlide();
               }
          });
          
          document.getElementById('startBtn').addEventListener('click', () => {
               this.startGame();
          });
          
          document.getElementById('restartBtn').addEventListener('click', () => {
               this.restartGame();
          });

          // Audio toggle buttons
          document.getElementById('audioToggle').addEventListener('click', () => {
               this.toggleAudio();
          });

          document.getElementById('musicToggle').addEventListener('click', () => {
               this.toggleMusic();
          });
          
          // Handle canvas clicks for jump
          this.canvas.addEventListener('click', () => {
               if (this.gameState === 'playing') {
                    this.jump();
               }
          });
     }
     
     startGame() {
          this.gameState = 'playing';
          document.getElementById('startScreen').classList.add('hidden');
          this.spawnMonster(); // Spawn the single monster
          this.startBackgroundMusic(); // Start background music
     }
     
     restartGame() {
          this.gameState = 'playing';
          this.score = 0;
          this.level = 1; // Reset level to 1 when restarting
          this.gameSpeed = 4;
          this.baseGameSpeed = 4;
          this.slowdownTimer = 0;
          this.hitTimestamps = [];
          this.hitFlash = 0;
          this.lastHitTime = 0;
          this.consecutiveDangers = 0; // Reset consecutive danger counter
          this.obstacles = [];
          this.birds = [];
          this.spikes = [];
          this.movingPlatforms = [];
          this.gaps = [];
          this.coins = [];
          this.powerUps = [];
          this.fallenTrees = [];
          this.fireTraps = [];
          this.monster = null;
          this.particles = [];
          this.backgroundTrees = [];
          this.backgroundWalls = []; // Reset temple walls
          this.snowParticles = []; // Reset snow particles
          this.dangerousAreas = []; // Reset dangerous areas tracking
          this.player.y = this.ground - 60;
          this.player.velocityY = 0;
          this.player.jumping = false;
          this.player.doubleJumpUsed = false;
          this.player.sliding = false;
          this.player.slideTimer = 0;
          this.obstacleTimer = 0;
          this.birdTimer = 0;
          this.spikeTimer = 0;
          this.platformTimer = 0;
          this.ballTimer = 0;
          this.gapTimer = 0;
          this.coinTimer = 0;
          this.powerUpTimer = 0;
          this.treeTimer = 0;
          this.fireTimer = 0;
          this.invulnerable = false;
          this.invulnerableTimer = 0;
          this.magnetCoins = false;
          this.magnetTimer = 0;
          this.speedBoost = false;
          this.speedBoostTimer = 0;
          document.getElementById('gameOverScreen').classList.add('hidden');
          this.generateClouds();
          this.generateBackgroundTrees();
          this.generateBackgroundWalls();
          this.generateSnowParticles(); // Generate snow particles for level 2
          this.spawnMonster(); // Spawn the single monster
          this.startBackgroundMusic(); // Restart background music
     }
     
     jump() {
          if (this.gameState === 'playing') {
               // First jump
               if (!this.player.jumping) {
                    this.player.velocityY = -12; // Reduced from -18 to -12
                    this.player.jumping = true;
                    this.player.doubleJumpUsed = false;
                    this.playJumpSound();
               }
               // Double jump (enhanced with power-up)
               else if (!this.player.doubleJumpUsed || (this.doubleJumpBoost && this.player.doubleJumpUsed)) { // Allow multiple double jumps with boost
                    this.player.velocityY = -9; // Reduced from -15 to -9
                    this.player.doubleJumpUsed = true;
                    this.playJumpSound();
               }
          }
     }
     
     slide() {
          if (this.gameState === 'playing' && !this.player.sliding) {
               this.player.sliding = true;
               this.player.slideTimer = 20; // Reduced from 30 to 20 frames (shorter slide)
               this.player.height = 30; // Reduce height while sliding
               this.player.y = this.ground - 30; // Adjust position
               this.playSlideSound();
          }
     }
     
     stopSlide() {
          if (this.player.sliding && this.player.slideTimer <= 0) {
               this.player.sliding = false;
               this.player.height = 60; // Restore normal height
               this.player.y = this.ground - 60; // Restore normal position
          }
     }
     
     updatePlayer() {
          // Handle sliding timer
          if (this.player.sliding) {
               this.player.slideTimer--;
               if (this.player.slideTimer <= 0) {
                    this.stopSlide();
               }
          }
          
          // Apply gravity (stronger when falling for more responsive feel)
          if (this.player.velocityY > 0) {
               this.player.velocityY += this.gravity * 1.5; // Increased from 1.2 to 1.5 for faster falling
          } else {
               this.player.velocityY += this.gravity;
          }
          this.player.y += this.player.velocityY;
          
          // Ground collision
          if (this.player.y >= this.ground - this.player.height) {
               this.player.y = this.ground - this.player.height;
               this.player.velocityY = 0;
               this.player.jumping = false;
               this.player.doubleJumpUsed = false; // Reset double jump when landing
          }
          
          // Running animation - slower for more natural movement
          this.player.runFrame += 0.18; // Slower animation frame increment
          if (this.player.runFrame >= 4) this.player.runFrame = 0;
     }
     
     spawnObstacle() {
          if (this.obstacleTimer <= 0) {
               // Randomly choose obstacle type based on level
               const obstacleType = Math.random();
               
               if (this.level === 1) {
                    // Forest theme obstacles
                    if (obstacleType < 0.3) { // Increased from 0.25 to 0.3
                         // Ground obstacles (30%) - Not dangerous, resets counter
                         this.obstacles.push({
                              x: this.canvas.width,
                              y: this.ground - 45, // Increased height from 40 to 45
                              width: 35, // Increased width from 30 to 35
                              height: 45, // Increased height from 40 to 45
                              type: Math.random() > 0.5 ? 'cactus' : 'rock'
                         });
                         this.consecutiveDangers = 0; // Reset counter
                    } else if (obstacleType < 0.45) { // Increased from 0.4 to 0.45
                         // Flying birds (15%) - Not dangerous, resets counter
                         this.spawnBird();
                         this.consecutiveDangers = 0; // Reset counter
                    } else if (obstacleType < 0.6) { // Increased from 0.52 to 0.6
                         // Spikes (15%)
                         this.spawnSpikes();
                    } else if (obstacleType < 0.68) { // Reduced from 0.62 to 0.68
                         // Moving platforms (8%) - Helpful, resets counter
                         this.spawnMovingPlatform();
                         this.consecutiveDangers = 0; // Reset counter
                    } else if (obstacleType < 0.75) { // Reduced from 0.7 to 0.75
                         // Gaps (7%)
                         this.spawnGap();
                    } else if (obstacleType < 0.82) { // Reduced from 0.78 to 0.82
                         // Fallen trees (5%)
                         this.spawnFallenTree();
                    } else if (obstacleType < 0.87) { // Reduced from 0.85 to 0.87
                         // Fire traps (4%)
                         this.spawnFireTrap();
                    } else {
                         // Coins or power-ups (9%) - Helpful, resets counter
                         let powerUpChance = this.level === 2 ? 0.6 : 0.8; // Reduced power-up chance in level 2
                         if (Math.random() < powerUpChance) {
                              this.spawnCoins();
                         } else {
                              this.spawnPowerUp();
                         }
                         this.consecutiveDangers = 0; // Reset counter
                    }
               } else if (this.level === 2) {
                    // Snowy theme obstacles - different snow-themed obstacles
                    if (obstacleType < 0.25) {
                         // Snowmen (25%) - soft obstacle, resets counter
                         this.obstacles.push({
                              x: this.canvas.width,
                              y: this.ground - 50,
                              width: 35,
                              height: 50,
                              type: 'snowman'
                         });
                         this.consecutiveDangers = 0; // Reset counter
                    } else if (obstacleType < 0.4) {
                         // Ice crystals (15%) - slippery obstacle, resets counter
                         this.obstacles.push({
                              x: this.canvas.width,
                              y: this.ground - 45,
                              width: 30,
                              height: 45,
                              type: 'ice_crystal'
                         });
                         this.consecutiveDangers = 0; // Reset counter
                    } else if (obstacleType < 0.55) {
                         // Icicles (15%) - dangerous spikes
                         this.spawnIcicles();
                    } else if (obstacleType < 0.65) {
                         // Floating ice platforms (10%) - helpful, resets counter
                         this.spawnFloatingIcePlatform();
                         this.consecutiveDangers = 0; // Reset counter
                    } else if (obstacleType < 0.75) {
                         // Crevasses (10%) - dangerous gaps
                         this.spawnCrevasse();
                    } else if (obstacleType < 0.82) {
                         // Pine trees (7%) - dangerous
                         this.spawnPineTree();
                    } else if (obstacleType < 0.87) {
                         // Ice avalanches (5%) - dangerous
                         this.spawnIceAvalanche();
                    } else {
                         // Coins or power-ups (9%) - helpful, resets counter
                         let powerUpChance = this.level === 2 ? 0.6 : 0.8; // Reduced power-up chance in level 2
                         if (Math.random() < powerUpChance) {
                              this.spawnCoins();
                         } else {
                              this.spawnPowerUp();
                         }
                         this.consecutiveDangers = 0; // Reset counter
                    }
               }
               
               this.obstacleTimer = Math.random() * 80 + 30; // Reduced from 120+60 to 80+30 for more frequent obstacles
               
               // Level 2 has even more frequent obstacles
               if (this.level === 2) {
                    this.obstacleTimer *= 0.7; // 30% faster obstacle spawning in level 2
               }
          }
          this.obstacleTimer--;
     }
     
     spawnBird() {
          const height = Math.random() * 100 + 80; // Fly at different heights
          this.birds.push({
               x: this.canvas.width,
               y: this.ground - height,
               width: 35,
               height: 20,
               initialY: this.ground - height, // Store initial Y position for wave motion
               waveOffset: Math.random() * Math.PI * 2, // Random starting phase
               frame: Math.random() * 4
          });
     }
     
     spawnSpikes() {
          const spikeCount = Math.floor(Math.random() * 4) + 3; // Increased from 2-4 to 3-6 spikes
          const totalWidth = spikeCount * 22;
          for (let i = 0; i < spikeCount; i++) {
               this.spikes.push({
                    x: this.canvas.width + i * 22, // Reduced spacing from 25 to 22
                    y: this.ground - 30, // Increased height from 25 to 30
                    width: 22, // Increased width from 20 to 22
                    height: 30 // Increased height from 25 to 30
               });
          }
          
          // Mark spike cluster as dangerous area needing platform assistance
          if (spikeCount >= 4) { // Only for large spike clusters
               this.markDangerousArea(this.canvas.width + totalWidth/2, totalWidth, 'spikes');
          }
     }
     
     spawnMovingPlatform() {
          this.movingPlatforms.push({
               x: this.canvas.width,
               y: this.ground - 80 - Math.random() * 50,
               width: 80,
               height: 15,
               velocityY: (Math.random() - 0.5) * 4, // Vertical movement
               bounceRange: 60
          });
     }
     
     spawnGap() {
          const gapWidth = 80 + Math.random() * 60; // Variable gap width
          this.gaps.push({
               x: this.canvas.width,
               width: gapWidth,
               y: this.ground,
               height: this.canvas.height - this.ground
          });
          
          // Mark this as a dangerous area that needs a platform
          this.markDangerousArea(this.canvas.width + gapWidth/2, gapWidth, 'gap');
     }
     
     spawnCoins() {
          const coinCount = Math.floor(Math.random() * 5) + 3; // 3-7 coins
          const pattern = Math.random();
          
          for (let i = 0; i < coinCount; i++) {
               let coinX, coinY;
               
               if (pattern < 0.33) {
                    // Horizontal line
                    coinX = this.canvas.width + i * 25;
                    coinY = this.ground - 60 - Math.random() * 40;
               } else if (pattern < 0.66) {
                    // Vertical line
                    coinX = this.canvas.width + 20;
                    coinY = this.ground - 40 - i * 20;
               } else {
                    // Curved pattern
                    coinX = this.canvas.width + i * 20;
                    coinY = this.ground - 60 - Math.sin(i * 0.5) * 30;
               }
               
               this.coins.push({
                    x: coinX,
                    y: coinY,
                    width: 16,
                    height: 16,
                    frame: Math.random() * 8,
                    collected: false
               });
          }
     }
     
     spawnPowerUp() {
          const powerUpTypes = ['shield', 'magnet', 'speed', 'doublejump', 'multiplier', 'slowmotion'];
          const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
          
          this.powerUps.push({
               x: this.canvas.width,
               y: this.ground - 70 - Math.random() * 30,
               width: 24,
               height: 24,
               type: type,
               frame: 0,
               collected: false
          });
     }
     
     spawnFallenTree() {
          const treeHeight = 40 + Math.random() * 20;
          this.fallenTrees.push({
               x: this.canvas.width,
               y: this.ground - treeHeight,
               width: 80,
               height: treeHeight,
               canSlideUnder: treeHeight > 50 // Can slide under taller trees
          });
          
          // Mark tall trees that can't be slid under as dangerous
          if (!treeHeight > 50 || treeHeight >= 55) {
               this.markDangerousArea(this.canvas.width + 40, 80, 'tree');
          }
     }
     
     spawnFireTrap() {
          this.fireTraps.push({
               x: this.canvas.width,
               y: this.ground - 30,
               width: 60,
               height: 30,
               active: false,
               timer: Math.random() * 60 + 30, // Random activation delay
               frame: 0
          });
          
          // Fire traps are dangerous and may need platform assistance
          this.markDangerousArea(this.canvas.width + 30, 60, 'fire');
     }
     
     spawnTempleSpikes() {
          const spikeCount = Math.floor(Math.random() * 4) + 3; // 3-6 spikes
          const totalWidth = spikeCount * 25;
          for (let i = 0; i < spikeCount; i++) {
               this.spikes.push({
                    x: this.canvas.width + i * 25,
                    y: this.ground - 35,
                    width: 25,
                    height: 35,
                    type: 'temple' // Mark as temple spikes
               });
          }
          
          // Mark spike cluster as dangerous area needing platform assistance
          if (spikeCount >= 4) {
               this.markDangerousArea(this.canvas.width + totalWidth/2, totalWidth, 'temple_spikes');
          }
     }
     
     spawnStonePlatform() {
          this.movingPlatforms.push({
               x: this.canvas.width,
               y: this.ground - 85 - Math.random() * 55,
               width: 85,
               height: 18,
               velocityY: (Math.random() - 0.5) * 4.5,
               bounceRange: 65,
               type: 'stone' // Mark as stone platform
          });
     }
     
     spawnTempleGap() {
          const gapWidth = 85 + Math.random() * 65; // Variable gap width
          this.gaps.push({
               x: this.canvas.width,
               width: gapWidth,
               y: this.ground,
               height: this.canvas.height - this.ground,
               type: 'temple' // Mark as temple gap
          });
          
          // Mark this as a dangerous area that needs a platform
          this.markDangerousArea(this.canvas.width + gapWidth/2, gapWidth, 'temple_gap');
     }
     
     spawnTempleTrap() {
          this.fireTraps.push({
               x: this.canvas.width,
               y: this.ground - 35,
               width: 70,
               height: 35,
               active: false,
               timer: Math.random() * 50 + 25,
               frame: 0,
               type: 'temple' // Mark as temple trap
          });
          
          // Temple traps are dangerous and may need platform assistance
          this.markDangerousArea(this.canvas.width + 35, 70, 'temple_trap');
     }
     
     spawnBoulderTrap() {
          // Spawn a rolling boulder that falls from above
          this.fireTraps.push({
               x: this.canvas.width,
               y: this.ground - 80,
               width: 45,
               height: 45,
               active: true,
               timer: 0,
               frame: 0,
               type: 'boulder',
               velocityY: 0,
               falling: false
          });
          
          // Boulders are dangerous
          this.markDangerousArea(this.canvas.width + 22, 45, 'boulder');
     }
     
     spawnFrozenSpikes() {
          const spikeCount = Math.floor(Math.random() * 4) + 3; // 3-6 spikes
          const totalWidth = spikeCount * 25;
          for (let i = 0; i < spikeCount; i++) {
               this.spikes.push({
                    x: this.canvas.width + i * 25,
                    y: this.ground - 35,
                    width: 25,
                    height: 35,
                    type: 'frozen' // Mark as frozen spikes
               });
          }
          
          // Mark spike cluster as dangerous area needing platform assistance
          if (spikeCount >= 4) {
               this.markDangerousArea(this.canvas.width + totalWidth/2, totalWidth, 'frozen_spikes');
          }
     }
     
     spawnIcePlatform() {
          this.movingPlatforms.push({
               x: this.canvas.width,
               y: this.ground - 85 - Math.random() * 55,
               width: 85,
               height: 18,
               velocityY: (Math.random() - 0.5) * 4.5,
               bounceRange: 65,
               type: 'ice' // Mark as ice platform
          });
     }
     
     spawnSnowGap() {
          const gapWidth = 85 + Math.random() * 65; // Variable gap width
          this.gaps.push({
               x: this.canvas.width,
               width: gapWidth,
               y: this.ground,
               height: this.canvas.height - this.ground,
               type: 'snow' // Mark as snow gap
          });
          
          // Mark this as a dangerous area that needs a platform
          this.markDangerousArea(this.canvas.width + gapWidth/2, gapWidth, 'snow_gap');
     }
     
     spawnFrozenTree() {
          const treeHeight = 40 + Math.random() * 20;
          this.fallenTrees.push({
               x: this.canvas.width,
               y: this.ground - treeHeight,
               width: 80,
               height: treeHeight,
               canSlideUnder: treeHeight > 50, // Can slide under taller trees
               type: 'frozen' // Mark as frozen tree
          });
          
          // Mark tall trees that can't be slid under as dangerous
          if (!treeHeight > 50 || treeHeight >= 55) {
               this.markDangerousArea(this.canvas.width + 40, 80, 'frozen_tree');
          }
     }
     
     spawnSnowAvalanche() {
          // Spawn falling snow chunks that can hurt the player
          this.fireTraps.push({
               x: this.canvas.width,
               y: this.ground - 100,
               width: 50,
               height: 50,
               active: true,
               timer: 0,
               frame: 0,
               type: 'avalanche',
               velocityY: 0,
               falling: false
          });
          
          // Avalanches are dangerous
          this.markDangerousArea(this.canvas.width + 25, 50, 'avalanche');
     }
     
     spawnIcicles() {
          const icicleCount = Math.floor(Math.random() * 4) + 3; // 3-6 icicles
          const totalWidth = icicleCount * 20;
          for (let i = 0; i < icicleCount; i++) {
               this.spikes.push({
                    x: this.canvas.width + i * 20,
                    y: this.ground - 40,
                    width: 20,
                    height: 40,
                    type: 'icicle' // Mark as icicle
               });
          }
          
          // Mark icicle cluster as dangerous area needing platform assistance
          if (icicleCount >= 4) {
               this.markDangerousArea(this.canvas.width + totalWidth/2, totalWidth, 'icicles');
          }
     }
     
     spawnFloatingIcePlatform() {
          this.movingPlatforms.push({
               x: this.canvas.width,
               y: this.ground - 90 - Math.random() * 60,
               width: 90,
               height: 20,
               velocityY: (Math.random() - 0.5) * 5,
               bounceRange: 70,
               type: 'floating_ice' // Mark as floating ice platform
          });
     }
     
     spawnCrevasse() {
          const crevasseWidth = 90 + Math.random() * 70; // Variable crevasse width
          this.gaps.push({
               x: this.canvas.width,
               width: crevasseWidth,
               y: this.ground,
               height: this.canvas.height - this.ground,
               type: 'crevasse' // Mark as crevasse
          });
          
          // Mark this as a dangerous area that needs a platform
          this.markDangerousArea(this.canvas.width + crevasseWidth/2, crevasseWidth, 'crevasse');
     }
     
     spawnPineTree() {
          const treeHeight = 45 + Math.random() * 25;
          this.fallenTrees.push({
               x: this.canvas.width,
               y: this.ground - treeHeight,
               width: 85,
               height: treeHeight,
               canSlideUnder: treeHeight > 55, // Can slide under taller trees
               type: 'pine' // Mark as pine tree
          });
          
          // Mark tall trees that can't be slid under as dangerous
          if (!treeHeight > 55 || treeHeight >= 60) {
               this.markDangerousArea(this.canvas.width + 42, 85, 'pine_tree');
          }
     }
     
     spawnIceAvalanche() {
          // Spawn falling ice chunks that can hurt the player
          this.fireTraps.push({
               x: this.canvas.width,
               y: this.ground - 110,
               width: 55,
               height: 55,
               active: true,
               timer: 0,
               frame: 0,
               type: 'ice_avalanche',
               velocityY: 0,
               falling: false
          });
          
          // Ice avalanches are dangerous
          this.markDangerousArea(this.canvas.width + 27, 55, 'ice_avalanche');
     }
     
     markDangerousArea(centerX, width, type) {
          // Add dangerous area to tracking
          this.dangerousAreas.push({
               x: centerX,
               width: width,
               type: type,
               needsPlatform: true,
               timestamp: Date.now()
          });
          
          // Increment consecutive danger counter
          this.consecutiveDangers++;
          
          // Try to spawn a strategic platform near this danger
          // Higher chance for gaps (80%), moderate for others (50%)
          // If we've had 2+ consecutive dangers, force spawn a platform (100% chance)
          let spawnChance = type === 'gap' ? 0.8 : 0.5;
          
          if (this.consecutiveDangers >= 2) {
               spawnChance = 1.0; // Guarantee platform after 2 consecutive dangers
          }
          
          if (Math.random() < spawnChance) {
               this.spawnStrategicPlatform(centerX, width, type);
               this.consecutiveDangers = 0; // Reset counter after spawning platform
          }
     }
     
     spawnStrategicPlatform(dangerX, dangerWidth, dangerType) {
          // Calculate optimal platform position based on danger type
          let platformX, platformY, platformWidth;
          
          switch(dangerType) {
               case 'gap':
                    // For gaps, place platform over the gap or slightly before it
                    platformX = dangerX - dangerWidth/2 + (Math.random() * dangerWidth * 0.3);
                    platformY = this.ground - 100 - Math.random() * 40; // Higher platforms for gaps
                    platformWidth = Math.min(100, dangerWidth * 1.2); // Platform spans most of gap
                    break;
                    
               case 'spikes':
                    // For spike clusters, place platform above them
                    platformX = dangerX + (Math.random() - 0.5) * 40;
                    platformY = this.ground - 90 - Math.random() * 30;
                    platformWidth = 80;
                    break;
                    
               case 'tree':
                    // For fallen trees, place platform to jump over
                    platformX = dangerX - 20 + Math.random() * 40;
                    platformY = this.ground - 110 - Math.random() * 20;
                    platformWidth = 70;
                    break;
                    
               case 'fire':
                    // For fire traps, place platform nearby
                    platformX = dangerX + (Math.random() - 0.5) * 30;
                    platformY = this.ground - 95 - Math.random() * 25;
                    platformWidth = 75;
                    break;
                    
               default:
                    platformX = dangerX;
                    platformY = this.ground - 100;
                    platformWidth = 80;
          }
          
          // Check if there's already a platform too close
          const tooClose = this.movingPlatforms.some(p => 
               Math.abs(p.x - platformX) < 150
          );
          
          if (!tooClose) {
               this.movingPlatforms.push({
                    x: platformX,
                    y: platformY,
                    width: platformWidth,
                    height: 15,
                    velocityY: (Math.random() - 0.5) * 3, // Slower movement for easier use
                    bounceRange: 50,
                    strategic: true, // Mark as strategically placed
                    dangerType: dangerType
               });
          }
     }
     
     spawnMonster() {
          // Only spawn one monster if it doesn't exist
          if (!this.monster) {
               // Spawn monster from the left side (behind the player)
               this.monster = {
                    x: -100, // Spawn further left (increased gap from 0 to -200)
                    y: this.ground - 80,
                    width: 100,
                    height: 380,
                    baseSpeed: 3.0, // Increased from 2.0 to 3.0
                    speed: 3.0,
                    frame: 0,
                    catchDistance: 100 // Increased from 80 to 100
               };
          }
     }
     
     generateClouds() {
          for (let i = 0; i < 5; i++) {
               this.clouds.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * 200 + 50,
                    width: Math.random() * 60 + 40,
                    height: Math.random() * 30 + 20,
                    speed: Math.random() * 0.5 + 0.2
               });
          }
     }
     
     generateBackgroundTrees() {
          for (let i = 0; i < 8; i++) {
               this.backgroundTrees.push({
                    x: Math.random() * this.canvas.width * 2,
                    y: this.ground - 80 - Math.random() * 40,
                    width: Math.random() * 40 + 60,
                    height: Math.random() * 60 + 100,
                    depth: Math.random() * 0.5 + 0.3, // For parallax effect
                    type: Math.floor(Math.random() * 3) // Different tree types
               });
          }
     }
     
     generateBackgroundWalls() {
          for (let i = 0; i < 6; i++) {
               this.backgroundWalls.push({
                    x: Math.random() * this.canvas.width * 2,
                    y: this.ground - 120 - Math.random() * 80,
                    width: Math.random() * 60 + 80,
                    height: Math.random() * 40 + 120,
                    depth: Math.random() * 0.4 + 0.2, // For parallax effect
                    type: Math.floor(Math.random() * 3) // Different snowy structures (0: igloo, 1: snow mountain, 2: pine forest)
               });
          }
     }
     
     generateSnowParticles() {
          // Generate snow particles for level 2
          for (let i = 0; i < 50; i++) {
               this.snowParticles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * 0.5, // Slow horizontal drift
                    vy: Math.random() * 1 + 0.5, // Falling speed
                    size: Math.random() * 2 + 1, // Particle size
                    opacity: Math.random() * 0.5 + 0.3 // Varying opacity
               });
          }
     }
     
     updateSnowParticles() {
          this.snowParticles.forEach(particle => {
               particle.x += particle.vx;
               particle.y += particle.vy;
               
               // Reset particle when it goes off screen
               if (particle.y > this.canvas.height) {
                    particle.y = -10;
                    particle.x = Math.random() * this.canvas.width;
               }
               if (particle.x < 0) particle.x = this.canvas.width;
               if (particle.x > this.canvas.width) particle.x = 0;
          });
     }
     
     drawSnowParticles() {
          this.snowParticles.forEach(particle => {
               this.ctx.fillStyle = `rgba(173, 216, 230, ${particle.opacity})`;
               this.ctx.beginPath();
               this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
               this.ctx.fill();
          });
     }
     
     updateObstacles() {
          // Update ground obstacles
          this.obstacles = this.obstacles.filter(obstacle => {
               obstacle.x -= this.gameSpeed;
               return obstacle.x + obstacle.width > 0;
          });
          
          // Update birds
          this.birds = this.birds.filter(bird => {
               bird.x -= this.gameSpeed;
               bird.frame += 0.3;
               if (bird.frame >= 4) bird.frame = 0;
               
               // Smooth flapping motion using time and wave offset
               const time = Date.now() * 0.003; // Slower wave motion
               bird.y = bird.initialY + Math.sin(time + bird.waveOffset) * 15; // Wave up and down
               
               return bird.x + bird.width > 0;
          });
          
          // Update spikes
          this.spikes = this.spikes.filter(spike => {
               spike.x -= this.gameSpeed;
               return spike.x + spike.width > 0;
          });
          
          // Update moving platforms
          this.movingPlatforms = this.movingPlatforms.filter(platform => {
               platform.x -= this.gameSpeed;
               platform.y += platform.velocityY;
               
               // Bounce within range
               if (platform.y <= this.ground - 150 || platform.y >= this.ground - 60) {
                    platform.velocityY *= -1;
               }
               
               return platform.x + platform.width > 0;
          });
          
          // Update gaps
          this.gaps = this.gaps.filter(gap => {
               gap.x -= this.gameSpeed;
               return gap.x + gap.width > 0;
          });
          
          // Clean up old dangerous areas that have scrolled off screen
          this.dangerousAreas = this.dangerousAreas.filter(area => {
               return area.x + area.width > -100;
          });
          
          // Update coins
          this.coins = this.coins.filter(coin => {
               coin.x -= this.gameSpeed;
               coin.frame += 0.3;
               if (coin.frame >= 8) coin.frame = 0;
               
               // Coin magnet effect
               if (this.magnetCoins && !coin.collected) {
                    const dx = this.player.x + this.player.width/2 - (coin.x + coin.width/2);
                    const dy = this.player.y + this.player.height/2 - (coin.y + coin.height/2);
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    
                    if (distance < 100) {
                         const attraction = 3;
                         coin.x += (dx / distance) * attraction;
                         coin.y += (dy / distance) * attraction;
                    }
               }
               
               return coin.x + coin.width > 0 && !coin.collected;
          });
          
          // Update power-ups
          this.powerUps = this.powerUps.filter(powerUp => {
               powerUp.x -= this.gameSpeed;
               powerUp.frame += 0.2;
               if (powerUp.frame >= 4) powerUp.frame = 0;
               return powerUp.x + powerUp.width > 0 && !powerUp.collected;
          });
          
          // Update fallen trees
          this.fallenTrees = this.fallenTrees.filter(tree => {
               tree.x -= this.gameSpeed;
               return tree.x + tree.width > 0;
          });
          
          // Update fire traps
          this.fireTraps = this.fireTraps.filter(trap => {
               trap.x -= this.gameSpeed;
               trap.timer--;
               
               // Activate fire trap periodically
               if (trap.timer <= 0) {
                    if (trap.type === 'boulder') {
                         // Boulder falls immediately when spawned
                         trap.falling = true;
                         trap.velocityY += 0.5; // Gravity
                         trap.y += trap.velocityY;
                         // Remove boulder after it falls off screen
                         if (trap.y > this.canvas.height) {
                              return false;
                         }
                    } else {
                         trap.active = !trap.active;
                         trap.timer = trap.active ? 60 : 90; // Active for 1s, inactive for 1.5s
                    }
               }
               
               if (trap.active && trap.type !== 'boulder') {
                    trap.frame += 0.5;
                    if (trap.frame >= 8) trap.frame = 0;
               }
               
               return trap.x + trap.width > 0;
          });
          
          // Update particles
          this.particles = this.particles.filter(particle => {
               particle.x += particle.vx;
               particle.y += particle.vy;
               particle.vy += 0.2; // Gravity
               particle.life--;
               return particle.life > 0;
          });
          
          // Update power-up timers
          if (this.invulnerableTimer > 0) {
               this.invulnerableTimer--;
               if (this.invulnerableTimer === 0) {
                    this.invulnerable = false;
               }
          }
          
          if (this.magnetTimer > 0) {
               this.magnetTimer--;
               if (this.magnetTimer === 0) {
                    this.magnetCoins = false;
               }
          }
          
          if (this.speedBoostTimer > 0) {
               this.speedBoostTimer--;
               if (this.speedBoostTimer === 0) {
                    this.speedBoost = false;
                    this.gameSpeed = this.baseGameSpeed;
               }
          }
          
          if (this.doubleJumpTimer > 0) {
               this.doubleJumpTimer--;
               if (this.doubleJumpTimer === 0) {
                    this.doubleJumpBoost = false;
               }
          }
          
          if (this.scoreMultiplierTimer > 0) {
               this.scoreMultiplierTimer--;
               if (this.scoreMultiplierTimer === 0) {
                    this.scoreMultiplier = false;
               }
          }
          
          if (this.slowMotionTimer > 0) {
               this.slowMotionTimer--;
               if (this.slowMotionTimer === 0) {
                    this.slowMotion = false;
                    this.gameSpeed = this.baseGameSpeed;
               }
          }
     }
     
     updateMonster() {
          if (!this.monster) return;
          
          // Calculate distance to player
          let distanceToPlayer = Math.abs(this.monster.x - this.player.x);
          
          // Monster gets progressively closer with each obstacle hit
          // Level 2 monsters are more aggressive - they get closer faster
          let hitCount = this.hitTimestamps ? this.hitTimestamps.length : 0;
          let baseDistance = 250; // Start with much more distance (increased from 150)
          let distanceReduction = 50; // Reduce distance by 50 pixels per hit (increased from 40)
          
          // Level 2 monsters close the distance much faster
          if (this.level === 2) {
               distanceReduction *= 1.5; // 75 pixels per hit instead of 50 in level 2
               baseDistance *= 0.8; // Start closer in level 2 (200 instead of 250)
          }
          
          let chaseDistance = Math.max(40, baseDistance - (hitCount * distanceReduction)); // Minimum distance increased from 20 to 40
          let isDeadly = hitCount >= 3;
          
          // Calculate ideal position (behind the player)
          let idealX = this.player.x - chaseDistance;
          let distanceToIdeal = this.monster.x - idealX;
          
          // Add a dead zone to prevent shaking (only move if significantly off position)
          let deadZone = 10; // pixels of tolerance
          
          // Move toward player to maintain chase distance
          if (distanceToIdeal > deadZone) {
               // Monster is too far to the right, move left
               this.monster.x -= this.monster.speed;
          } else if (distanceToIdeal < -deadZone) {
               // Monster is too far to the left, move right toward player
               this.monster.x += this.monster.speed;
          }
          // If within dead zone, don't move horizontally (prevents shaking)
          
          // Keep monster on screen - constrain position
          if (this.monster.x < 50) {
               this.monster.x = 50;
          }
          if (this.monster.x > this.canvas.width - this.monster.width - 50) {
               this.monster.x = this.canvas.width - this.monster.width - 50;
          }
          
          // Vertical following - gets closer with more hits
          let verticalDistance = Math.abs(this.monster.y - this.player.y);
          let verticalChaseDistance = Math.max(20, 50 - (hitCount * 10)); // Increased from 35 to 50 pixels, minimum increased from 10 to 20
          let verticalDeadZone = 5; // Add dead zone for vertical movement too
          
          if (this.monster.y > this.player.y + verticalChaseDistance + verticalDeadZone && this.monster.y > this.ground - 80) {
               this.monster.y -= 2;
          } else if (this.monster.y < this.player.y - verticalChaseDistance - verticalDeadZone && this.monster.y < this.ground - 80) {
               this.monster.y += 2;
          }
          
          // Monster speed increases progressively with each hit
          let baseSpeedMultiplier = 1.0 + (hitCount * 0.8); // Increased from 0.5 to 0.8 per hit
          if (this.slowdownTimer > 0) {
               // Additional speed boost when player is slowed
               this.monster.speed = this.monster.baseSpeed * baseSpeedMultiplier * 1.8; // Increased from 1.5 to 1.8
          } else {
               this.monster.speed = this.monster.baseSpeed * baseSpeedMultiplier;
          }
          
          // Level 2 monsters are faster overall
          if (this.level === 2) {
               this.monster.speed *= 1.3; // 30% faster in level 2
          }
          
          // Animation
          this.monster.frame += 0.3;
          if (this.monster.frame >= 4) this.monster.frame = 0;
          
          // Monster can only catch player after 2 obstacle hits in recent time (reduced from 3)
          // Level 2 monsters become deadly after fewer hits
          let deadlyHitThreshold = this.level === 2 ? 1 : 2; // Only 1 hit needed in level 2
          
          if (distanceToPlayer < this.monster.catchDistance && verticalDistance < 30) {
               // Only catch if player has hit enough obstacles recently (within 10 seconds)
               if (this.hitTimestamps && this.hitTimestamps.length >= deadlyHitThreshold) { // Reduced from 3 to 2
                    this.gameOver();
               }
               // If less than threshold hits, monster just follows but cannot catch
          }
     }
     
     updateClouds() {
          this.clouds.forEach(cloud => {
               cloud.x -= cloud.speed;
               if (cloud.x + cloud.width < 0) {
                    cloud.x = this.canvas.width;
                    cloud.y = Math.random() * 200 + 50;
               }
          });
     }
     
     updateBackgroundTrees() {
          this.backgroundTrees.forEach(tree => {
               tree.x -= this.gameSpeed * tree.depth; // Parallax effect based on depth
               if (tree.x + tree.width < 0) {
                    tree.x = this.canvas.width + Math.random() * 200;
                    tree.y = this.ground - 80 - Math.random() * 40;
               }
          });
     }
     
     updateBackgroundWalls() {
          this.backgroundWalls.forEach(wall => {
               // Much slower movement for true parallax background effect
               wall.x -= this.gameSpeed * wall.depth * 0.1; // Very slow movement
               if (wall.x + wall.width < 0) {
                    wall.x = this.canvas.width + Math.random() * 300;
                    wall.y = this.ground - 120 - Math.random() * 80;
               }
          });
     }
     
     checkCollisions() {
          // Skip damage if invulnerable
          const canTakeDamage = !this.invulnerable;
          
          // Check ground obstacle collisions
          if (canTakeDamage) {
               for (let i = this.obstacles.length - 1; i >= 0; i--) {
                    let obstacle = this.obstacles[i];
                    if (this.isColliding(this.player, obstacle)) {
                         this.hitObstacle();
                         this.obstacles.splice(i, 1);
                         return;
                    }
               }
               
               // Check bird collisions
               for (let i = this.birds.length - 1; i >= 0; i--) {
                    let bird = this.birds[i];
                    if (this.isColliding(this.player, bird)) {
                         this.hitObstacle();
                         this.birds.splice(i, 1);
                         return;
                    }
               }
               
               // Check spike collisions
               for (let i = this.spikes.length - 1; i >= 0; i--) {
                    let spike = this.spikes[i];
                    if (this.isColliding(this.player, spike)) {
                         this.hitObstacle();
                         this.spikes.splice(i, 1);
                         return;
                    }
               }
               
               // Check fallen tree collisions
               for (let i = this.fallenTrees.length - 1; i >= 0; i--) {
                    let tree = this.fallenTrees[i];
                    if (this.isColliding(this.player, tree)) {
                         // Can slide under tall trees
                         if (tree.canSlideUnder && this.player.sliding) {
                              continue; // No collision while sliding under
                         }
                         this.hitObstacle();
                         this.fallenTrees.splice(i, 1);
                         return;
                    }
               }
               
               // Check fire trap collisions (only when active)
               for (let i = this.fireTraps.length - 1; i >= 0; i--) {
                    let trap = this.fireTraps[i];
                    if (trap.active && this.isColliding(this.player, trap)) {
                         this.hitObstacle();
                         return; // Don't remove fire trap, it stays
                    }
               }
          }
          
          // Check gap collisions (always deadly, even with invulnerability)
          for (let gap of this.gaps) {
               if (this.player.x + this.player.width > gap.x && 
                   this.player.x < gap.x + gap.width &&
                   this.player.y + this.player.height >= gap.y) {
                    this.gameOver();
                    return;
               }
          }
          
          // Check coin collections
          for (let i = this.coins.length - 1; i >= 0; i--) {
               let coin = this.coins[i];
               if (!coin.collected && this.isColliding(this.player, coin)) {
                    coin.collected = true;
                    const coinValue = this.scoreMultiplier ? 20 : 10; // Double points with multiplier
                    this.score += coinValue; // Bonus points for coins
                    this.createCoinParticles(coin.x + coin.width/2, coin.y + coin.height/2);
                    this.playCoinSound();
                    this.coins.splice(i, 1);
               }
          }
          
          // Check power-up collections
          for (let i = this.powerUps.length - 1; i >= 0; i--) {
               let powerUp = this.powerUps[i];
               if (!powerUp.collected && this.isColliding(this.player, powerUp)) {
                    powerUp.collected = true;
                    this.activatePowerUp(powerUp.type);
                    this.createPowerUpParticles(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2);
                    this.playPowerUpSound();
                    this.powerUps.splice(i, 1);
               }
          }
          
          // Check moving platform collisions (these don't hurt, they help!)
          for (let platform of this.movingPlatforms) {
               if (this.player.velocityY > 0 && // Player is falling
                   this.player.x < platform.x + platform.width - 5 &&
                   this.player.x + this.player.width - 5 > platform.x &&
                   this.player.y + this.player.height > platform.y &&
                   this.player.y + this.player.height < platform.y + platform.height + 10) {
                    
                    // Land on platform
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.jumping = false;
                    this.player.doubleJumpUsed = false;
               }
          }
     }
     
     isColliding(rect1, rect2) {
          return rect1.x < rect2.x + rect2.width - 5 &&
                 rect1.x + rect1.width - 5 > rect2.x &&
                 rect1.y < rect2.y + rect2.height - 5 &&
                 rect1.y + rect1.height - 5 > rect2.y;
     }
     
     isCollidingWithCircle(rect, circle) {
          const distX = Math.abs(rect.x + rect.width/2 - circle.x);
          const distY = Math.abs(rect.y + rect.height/2 - circle.y);
          
          if (distX > (rect.width/2 + circle.radius)) return false;
          if (distY > (rect.height/2 + circle.radius)) return false;
          
          if (distX <= (rect.width/2)) return true;
          if (distY <= (rect.height/2)) return true;
          
          const dx = distX - rect.width/2;
          const dy = distY - rect.height/2;
          return (dx*dx + dy*dy <= (circle.radius*circle.radius));
     }
     
     activatePowerUp(type) {
          let durationMultiplier = this.level === 2 ? 0.6 : 1.0; // Power-ups last 40% less time in level 2
          
          switch(type) {
               case 'shield':
                    this.invulnerable = true;
                    this.invulnerableTimer = Math.floor(180 * durationMultiplier); // Reduced from 300 to 180 frames (3 seconds instead of 5)
                    break;
               case 'magnet':
                    this.magnetCoins = true;
                    this.magnetTimer = Math.floor(360 * durationMultiplier); // Reduced from 600 to 360 frames (6 seconds instead of 10)
                    break;
               case 'speed':
                    this.speedBoost = true;
                    this.speedBoostTimer = Math.floor(180 * durationMultiplier); // Reduced from 300 to 180 frames (3 seconds instead of 5)
                    this.gameSpeed = this.baseGameSpeed * (this.level === 2 ? 1.2 : 1.3); // Reduced multiplier from 1.5 to 1.3, further reduced to 1.2 in level 2
                    break;
               case 'doublejump':
                    this.doubleJumpBoost = true;
                    this.doubleJumpTimer = Math.floor(240 * durationMultiplier); // 4 seconds
                    break;
               case 'multiplier':
                    this.scoreMultiplier = true;
                    this.scoreMultiplierTimer = Math.floor(300 * durationMultiplier); // 5 seconds
                    break;
               case 'slowmotion':
                    this.slowMotion = true;
                    this.slowMotionTimer = Math.floor(180 * durationMultiplier); // 3 seconds
                    this.gameSpeed = this.baseGameSpeed * (this.level === 2 ? 0.7 : 0.6); // Slow down the game - less effective in level 2
                    break;
          }
     }
     
     createCoinParticles(x, y) {
          for (let i = 0; i < 6; i++) {
               this.particles.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8 - 2,
                    color: '#FFD700',
                    life: 30
               });
          }
     }
     
     createPowerUpParticles(x, y) {
          for (let i = 0; i < 8; i++) {
               this.particles.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10 - 3,
                    color: ['#FF6B6B', '#4ECDC4', '#45B7D1'][Math.floor(Math.random() * 3)],
                    life: 40
               });
          }
     }

     hitObstacle() {
          // Record the hit
          let currentTime = Date.now();
          this.hitTimestamps.push(currentTime);
          this.lastHitTime = currentTime; // Track the time of the last hit
          
          // Remove old timestamps (older than 10 seconds)
          this.hitTimestamps = this.hitTimestamps.filter(time => 
               currentTime - time < 10000
          );
          
          // Slow down the game
          this.gameSpeed = this.baseGameSpeed * 0.6; // Reduced slowdown from 0.5 to 0.6 (less slowdown)
          this.slowdownTimer = 120; // Reduced from 180 to 120 frames (2 seconds instead of 3)
          
          // After 3 hits, monster becomes deadly (can catch player)
          // No immediate game over - let the monster catch the player instead
          
          // Visual feedback
          this.showHitEffect();
          
          // Play hit sound
          this.playHitSound();
     }
     
     showHitEffect() {
          // Flash effect (implemented in draw method)
          this.hitFlash = 40; // Flash for about 0.7 seconds
     }
     
     updateGameSpeed() {
          // Gradually restore speed after hitting obstacle
          if (this.slowdownTimer > 0) {
               this.slowdownTimer--;
               if (this.slowdownTimer === 0) {
                    this.gameSpeed = this.baseGameSpeed;
               }
          }
     }
     
     updateHitTimestamps() {
          let currentTime = Date.now();
          
          // If 10 seconds have passed since the last hit, reset all hits
          if (this.lastHitTime > 0 && currentTime - this.lastHitTime >= 10000) {
               this.hitTimestamps = [];
               this.lastHitTime = 0;
          }
          
          // Also remove old timestamps (this was already in hitObstacle, but good to double-check)
          this.hitTimestamps = this.hitTimestamps.filter(time => 
               currentTime - time < 10000
          );
     }
     
     gameOver() {
          this.gameState = 'gameOver';
          if (this.score > this.highScore) {
               this.highScore = this.score;
               localStorage.setItem('highScore', this.highScore);
          }
          
          // Stop background music
          this.stopBackgroundMusic();
          
          // Play game over sound
          this.playGameOverSound();
          
          this.showGameOverScreen();
     }
     
     showGameOverScreen() {
          document.getElementById('finalScore').textContent = this.score;
          document.getElementById('finalHighScore').textContent = this.highScore;
          document.getElementById('gameOverScreen').classList.remove('hidden');
     }
     
     updateScore() {
          this.score++;
          document.getElementById('score').textContent = this.score;
          
          // Check for level progression
          if (this.score >= 150 && this.level === 1) {
               this.level = 2;
               // Update level display
               const levelElement = document.getElementById('level');
               if (levelElement) {
                    levelElement.textContent = this.level;
               }
               
               // Play level up sound
               this.playLevelUpSound();
               
               // Change background music to level 2
               this.startBackgroundMusic();
          }
          
          // Increase difficulty gradually with level-specific multipliers
          if (this.score % 75 === 0) {
               let speedIncrease = 0.5; // Base speed increase
               
               // Level 2 is significantly harder - triple the speed increase for more challenging temple environment
               if (this.level === 2) {
                    speedIncrease *= 3.0; // 1.5 instead of 0.5 for level 2 - much more challenging
               }
               
               this.baseGameSpeed += speedIncrease;
               if (this.slowdownTimer === 0) {
                    this.gameSpeed = this.baseGameSpeed;
               }
          }
     }
     
     updateHighScore() {
          document.getElementById('highScore').textContent = this.highScore;
     }
     
     drawPlayer() {
          const px = this.player.x;
          const py = this.player.y;
          const runCycle = Math.sin(this.player.runFrame * 2) * 2; // Slower running cycle
          const armSwing = Math.sin(this.player.runFrame * 1.8) * 8; // Slower arm swing, reduced magnitude
          const bobbing = this.player.sliding ? 0 : Math.abs(Math.sin(this.player.runFrame * 2)) * 1.5; // No bobbing while sliding
          
          // Define proper arm and leg cycles for natural movement
          const armCycle1 = Math.sin(this.player.runFrame * 1.8); // Slower arm movement
          const armCycle2 = Math.sin(this.player.runFrame * 1.8 + Math.PI); // Opposite arm
          const legCycle1 = Math.sin(this.player.runFrame * 2); // Slower leg movement
          const legCycle2 = Math.sin(this.player.runFrame * 2 + Math.PI); // Opposite leg
          
          // Adjust position for bobbing animation and sliding
          const adjustedY = py - bobbing;
          const slideRotation = this.player.sliding ? -0.3 : 0; // Tilt player when sliding
          
          // Draw realistic shadow (elliptical)
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          this.ctx.beginPath();
          this.ctx.ellipse(px + 20, this.ground + 2, 16, 4, 0, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Apply rotation for sliding effect
          if (this.player.sliding) {
               this.ctx.save();
               this.ctx.translate(px + this.player.width/2, adjustedY + this.player.height/2);
               this.ctx.rotate(slideRotation);
               this.ctx.translate(-this.player.width/2, -this.player.height/2);
          }
          
          // More realistic leg positioning and animation
          const legSwing1 = legCycle1 * 5; // Slower, less pronounced leg swing
          const legSwing2 = legCycle2 * 5;
          const kneeFlexion1 = Math.max(0, legCycle1 * 2.5); // Slower knee movement
          const kneeFlexion2 = Math.max(0, legCycle2 * 2.5);
          
          // Upper legs (thighs)
          this.ctx.fillStyle = '#1E3A8A'; // Dark blue pants
          this.ctx.beginPath();
          this.ctx.roundRect(px + 12 + legSwing1/2, adjustedY + 40, 6, 15 - kneeFlexion1, 3);
          this.ctx.fill();
          this.ctx.beginPath();
          this.ctx.roundRect(px + 22 + legSwing2/2, adjustedY + 40, 6, 15 - kneeFlexion2, 3);
          this.ctx.fill();
          
          // Lower legs (shins)
          this.ctx.fillStyle = '#1E40AF'; // Slightly different shade
          this.ctx.beginPath();
          this.ctx.roundRect(px + 12 + legSwing1, adjustedY + 50 - kneeFlexion1, 6, 12 + kneeFlexion1, 2);
          this.ctx.fill();
          this.ctx.beginPath();
          this.ctx.roundRect(px + 22 + legSwing2, adjustedY + 50 - kneeFlexion2, 6, 12 + kneeFlexion2, 2);
          this.ctx.fill();
          
          // Realistic torso with slight taper
          this.ctx.fillStyle = '#3B82F6'; // Blue shirt
          this.ctx.beginPath();
          this.ctx.roundRect(px + 10, adjustedY + 20, 20, 22, 4);
          this.ctx.fill();
          
          // Shirt collar
          this.ctx.fillStyle = '#1E40AF';
          this.ctx.beginPath();
          this.ctx.roundRect(px + 16, adjustedY + 20, 8, 4, 2);
          this.ctx.fill();
          
          // Upper arms - natural running motion (opposite to legs)
          const armSwing1 = armCycle1 * 8; // Slower, more natural arm swing
          const armSwing2 = armCycle2 * 8;
          const armAngle1 = armCycle1 * 0.25; // Slower, more subtle arm rotation
          const armAngle2 = armCycle2 * 0.25;
          const elbowBend1 = Math.abs(armCycle1) * 2; // Slower, less pronounced elbow flexion
          const elbowBend2 = Math.abs(armCycle2) * 2;
          
          this.ctx.fillStyle = '#FBBF24'; // More realistic skin tone
          
          // Left upper arm
          this.ctx.save();
          this.ctx.translate(px + 8, adjustedY + 22);
          this.ctx.rotate(armAngle1);
          this.ctx.fillRect(armSwing1/4, 0, 5, 12 - elbowBend1);
          this.ctx.restore();
          
          // Right upper arm  
          this.ctx.save();
          this.ctx.translate(px + 32, adjustedY + 22);
          this.ctx.rotate(armAngle2);
          this.ctx.fillRect(armSwing2/4, 0, 5, 12 - elbowBend2);
          this.ctx.restore();
          
          // Forearms - with natural bend
          this.ctx.fillStyle = '#F59E0B';
          
          // Left forearm
          this.ctx.save();
          this.ctx.translate(px + 8 + armSwing1/3, adjustedY + 30 - elbowBend1);
          this.ctx.rotate(armAngle1 * 1.5);
          this.ctx.fillRect(0, 0, 4, 10 + elbowBend1);
          this.ctx.restore();
          
          // Right forearm
          this.ctx.save();
          this.ctx.translate(px + 32 + armSwing2/3, adjustedY + 30 - elbowBend2);
          this.ctx.rotate(armAngle2 * 1.5);
          this.ctx.fillRect(0, 0, 4, 10 + elbowBend2);
          this.ctx.restore();
          
          // Hands - positioned naturally at end of forearms
          this.ctx.fillStyle = '#FBBF24';
          this.ctx.beginPath();
          this.ctx.arc(px + 9 + armSwing1/2, adjustedY + 40 + elbowBend1/2, 2.5, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.beginPath();
          this.ctx.arc(px + 33 + armSwing2/2, adjustedY + 40 + elbowBend2/2, 2.5, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Neck
          this.ctx.fillStyle = '#FBBF24';
          this.ctx.beginPath();
          this.ctx.roundRect(px + 17, adjustedY + 16, 6, 6, 3);
          this.ctx.fill();
          
          // Head with side profile proportions
          this.ctx.fillStyle = '#FBBF24'; // Skin tone
          this.ctx.beginPath();
          this.ctx.ellipse(px + 20, adjustedY + 10, 11, 13, 0, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Hair with texture (side profile)
          this.ctx.fillStyle = '#92400E'; // Brown hair
          this.ctx.beginPath();
          this.ctx.ellipse(px + 18, adjustedY + 4, 12, 9, 0, Math.PI * 0.8, Math.PI * 2.2);
          this.ctx.fill();
          
          // Hair strands for texture (adjusted for side view)
          this.ctx.strokeStyle = '#7C2D12';
          this.ctx.lineWidth = 1;
          for (let i = 0; i < 4; i++) {
               this.ctx.beginPath();
               this.ctx.moveTo(px + 11 + i * 4, adjustedY + 2);
               this.ctx.lineTo(px + 12 + i * 4, adjustedY + 8);
               this.ctx.stroke();
          }
          
          // Eyebrow (single, facing right)
          this.ctx.fillStyle = '#7C2D12';
          this.ctx.beginPath();
          this.ctx.ellipse(px + 24, adjustedY + 7, 4, 1.5, 0.1, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Eye (single, side profile)
          this.ctx.fillStyle = '#FFFFFF';
          this.ctx.beginPath();
          this.ctx.ellipse(px + 25, adjustedY + 9, 3.5, 2.5, 0, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Iris (side view)
          this.ctx.fillStyle = '#059669'; // Green eye
          this.ctx.beginPath();
          this.ctx.arc(px + 26, adjustedY + 9, 1.8, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Pupil
          this.ctx.fillStyle = '#000000';
          this.ctx.beginPath();
          this.ctx.arc(px + 26, adjustedY + 9, 1.2, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Eye shine/reflection
          this.ctx.fillStyle = '#FFFFFF';
          this.ctx.beginPath();
          this.ctx.arc(px + 26.5, adjustedY + 8.5, 0.6, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Nose (side profile - more prominent)
          this.ctx.fillStyle = '#F59E0B';
          this.ctx.beginPath();
          this.ctx.moveTo(px + 29, adjustedY + 10);
          this.ctx.lineTo(px + 32, adjustedY + 11);
          this.ctx.lineTo(px + 30, adjustedY + 13);
          this.ctx.lineTo(px + 28, adjustedY + 12);
          this.ctx.closePath();
          this.ctx.fill();
          
          // Nostril (side view)
          this.ctx.fillStyle = '#D97706';
          this.ctx.beginPath();
          this.ctx.arc(px + 30, adjustedY + 12, 0.8, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Mouth (side profile)
          this.ctx.fillStyle = '#DC2626';
          this.ctx.beginPath();
          this.ctx.ellipse(px + 28, adjustedY + 15, 2.5, 1.2, 0, 0, Math.PI);
          this.ctx.fill();
          
          // Lip line (side view)
          this.ctx.strokeStyle = '#B91C1C';
          this.ctx.lineWidth = 0.5;
          this.ctx.beginPath();
          this.ctx.arc(px + 28, adjustedY + 15, 2.5, 0, Math.PI);
          this.ctx.stroke();
          
          // Ear (visible from side)
          this.ctx.fillStyle = '#FBBF24';
          this.ctx.beginPath();
          this.ctx.ellipse(px + 10, adjustedY + 10, 3, 4, 0, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Inner ear detail
          this.ctx.fillStyle = '#F59E0B';
          this.ctx.beginPath();
          this.ctx.ellipse(px + 11, adjustedY + 10, 1.5, 2, 0, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Athletic shoes with natural foot positioning
          const footAngle1 = legCycle1 * 0.12; // Slower, more subtle foot angle
          const footAngle2 = legCycle2 * 0.12;
          const footLift1 = Math.max(0, -legCycle1 * 2); // Slower foot lift
          const footLift2 = Math.max(0, -legCycle2 * 2);
          
          this.ctx.fillStyle = '#1F2937'; // Dark gray shoes
          
          // Left shoe
          this.ctx.save();
          this.ctx.translate(px + 16 + legSwing1, adjustedY + 58 - footLift1);
          this.ctx.rotate(footAngle1);
          this.ctx.fillRect(-6, 0, 12, 7);
          this.ctx.restore();
          
          // Right shoe
          this.ctx.save();
          this.ctx.translate(px + 24 + legSwing2, adjustedY + 58 - footLift2);
          this.ctx.rotate(footAngle2);
          this.ctx.fillRect(-6, 0, 12, 7);
          this.ctx.restore();
          
          // Shoe laces
          this.ctx.strokeStyle = '#FFFFFF';
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 14 + legSwing1, adjustedY + 60 - footLift1);
          this.ctx.lineTo(px + 18 + legSwing1, adjustedY + 62 - footLift1);
          this.ctx.stroke();
          this.ctx.beginPath();
          this.ctx.moveTo(px + 22 + legSwing2, adjustedY + 60 - footLift2);
          this.ctx.lineTo(px + 26 + legSwing2, adjustedY + 62 - footLift2);
          this.ctx.stroke();
          
          // Shoe soles with natural positioning
          this.ctx.fillStyle = '#000000';
          
          // Left sole
          this.ctx.save();
          this.ctx.translate(px + 15 + legSwing1, adjustedY + 64 - footLift1);
          this.ctx.rotate(footAngle1);
          this.ctx.fillRect(-6, 0, 14, 2);
          this.ctx.restore();
          
          // Right sole
          this.ctx.save();
          this.ctx.translate(px + 23 + legSwing2, adjustedY + 64 - footLift2);
          this.ctx.rotate(footAngle2);
          this.ctx.fillRect(-6, 0, 14, 2);
          this.ctx.restore();
          
          // Restore transformation for sliding
          if (this.player.sliding) {
               this.ctx.restore();
               
               // Draw sliding dust effect
               this.ctx.fillStyle = 'rgba(139, 92, 246, 0.4)';
               for (let i = 0; i < 5; i++) {
                    this.ctx.beginPath();
                    this.ctx.arc(
                         px - i * 8 - Math.random() * 10,
                         adjustedY + this.player.height + Math.random() * 5,
                         2 + Math.random() * 3,
                         0, Math.PI * 2
                    );
                    this.ctx.fill();
               }
          }
          
          // Draw shield effect if invulnerable
          if (this.invulnerable) {
               const shieldPulse = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
               this.ctx.strokeStyle = `rgba(59, 130, 246, ${shieldPulse})`;
               this.ctx.lineWidth = 3;
               this.ctx.setLineDash([5, 5]);
               this.ctx.beginPath();
               this.ctx.ellipse(px + this.player.width/2, adjustedY + this.player.height/2, 
                               this.player.width/2 + 10, this.player.height/2 + 10, 0, 0, Math.PI * 2);
               this.ctx.stroke();
               this.ctx.setLineDash([]);
          }
          
          // Draw speed boost effect
          if (this.speedBoost) {
               for (let i = 0; i < 3; i++) {
                    this.ctx.fillStyle = `rgba(245, 158, 11, ${0.3 - i * 0.1})`;
                    this.ctx.beginPath();
                    this.ctx.arc(px - i * 15 - 10, adjustedY + this.player.height/2, 
                                3 - i, 0, Math.PI * 2);
                    this.ctx.fill();
               }
          }
     }
     
     drawObstacles() {
          // Draw gaps (level-based)
          this.gaps.forEach(gap => {
               // Gap shadow/depth
               this.ctx.fillStyle = '#1F2937';
               this.ctx.fillRect(gap.x, gap.y, gap.width, gap.height);
               
               if (this.level === 1) {
                    // Gap edges with dirt/moss
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(gap.x - 5, gap.y - 10, 5, 10);
                    this.ctx.fillRect(gap.x + gap.width, gap.y - 10, 5, 10);
                    
                    // Water/stream effect for forest theme
                    this.ctx.fillStyle = '#4682B4';
                    for (let i = 0; i < 3; i++) {
                         this.ctx.fillRect(gap.x + i * 20, gap.y - 8 + i * 3, 15, 2);
                    }
               } else if (this.level === 2) {
                    // Crevasse edges with jagged ice formations for visibility
                    this.ctx.fillStyle = '#00BFFF'; // Deep sky blue
                    this.ctx.fillRect(gap.x - 10, gap.y - 20, 10, 20);
                    this.ctx.fillRect(gap.x + gap.width, gap.y - 20, 10, 20);
                    
                    // Jagged ice edges - bright blue
                    this.ctx.strokeStyle = '#4169E1'; // Royal blue
                    this.ctx.lineWidth = 3;
                    // Left edge
                    this.ctx.beginPath();
                    this.ctx.moveTo(gap.x - 10, gap.y - 20);
                    this.ctx.lineTo(gap.x, gap.y - 15);
                    this.ctx.lineTo(gap.x - 8, gap.y - 10);
                    this.ctx.lineTo(gap.x, gap.y - 5);
                    this.ctx.lineTo(gap.x - 6, gap.y);
                    this.ctx.stroke();
                    
                    // Right edge
                    this.ctx.beginPath();
                    this.ctx.moveTo(gap.x + gap.width + 10, gap.y - 20);
                    this.ctx.lineTo(gap.x + gap.width, gap.y - 15);
                    this.ctx.lineTo(gap.x + gap.width + 8, gap.y - 10);
                    this.ctx.lineTo(gap.x + gap.width, gap.y - 5);
                    this.ctx.lineTo(gap.x + gap.width + 6, gap.y);
                    this.ctx.stroke();
                    
                    // Wind-blown snow effect - darker for contrast
                    this.ctx.fillStyle = '#F8F8FF';
                    for (let i = 0; i < 6; i++) {
                         this.ctx.fillRect(gap.x + i * 18, gap.y - 14 + i * 3, 12, 4);
                    }
                    
                    // Ice formations at edges - bright blue
                    this.ctx.fillStyle = '#4169E1'; // Royal blue
                    this.ctx.fillRect(gap.x - 8, gap.y - 10, 6, 8);
                    this.ctx.fillRect(gap.x + gap.width + 2, gap.y - 10, 6, 8);
                    
                    // Icicles hanging from crevasse edges - bright blue with white tips
                    this.ctx.fillStyle = '#00BFFF';
                    for (let i = 0; i < 4; i++) {
                         this.ctx.beginPath();
                         this.ctx.moveTo(gap.x - 6 + i * 3, gap.y - 10);
                         this.ctx.lineTo(gap.x - 6 + i * 3, gap.y - 18 - i * 4);
                         this.ctx.lineTo(gap.x - 4 + i * 3, gap.y - 10);
                         this.ctx.closePath();
                         this.ctx.fill();
                         
                         // White tips for contrast
                         this.ctx.fillStyle = '#FFFFFF';
                         this.ctx.beginPath();
                         this.ctx.moveTo(gap.x - 6 + i * 3, gap.y - 18 - i * 4);
                         this.ctx.lineTo(gap.x - 4 + i * 3, gap.y - 18 - i * 4);
                         this.ctx.lineTo(gap.x - 5 + i * 3, gap.y - 22 - i * 4);
                         this.ctx.closePath();
                         this.ctx.fill();
                         this.ctx.fillStyle = '#00BFFF'; // Reset color
                    }
               }
          });
          
          // Draw ground obstacles (level-based)
          this.obstacles.forEach(obstacle => {
               if (this.level === 1) {
                    if (obstacle.type === 'cactus') {
                         // Tree stump
                         this.ctx.fillStyle = '#8B4513'; // Brown trunk
                         this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                         
                         // Tree rings
                         this.ctx.strokeStyle = '#654321';
                         this.ctx.lineWidth = 1;
                         for (let i = 1; i < 4; i++) {
                              this.ctx.beginPath();
                              this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 
                                        obstacle.width/2 - i * 3, 0, Math.PI * 2);
                              this.ctx.stroke();
                         }
                         
                         // Moss on top
                         this.ctx.fillStyle = '#228B22';
                         this.ctx.fillRect(obstacle.x + 2, obstacle.y, obstacle.width - 4, 5);
                    } else {
                         // Boulder/rock
                         this.ctx.fillStyle = '#696969';
                         this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                         
                         // Rock texture
                         this.ctx.fillStyle = '#808080';
                         this.ctx.fillRect(obstacle.x + 3, obstacle.y + 3, obstacle.width - 6, obstacle.height - 6);
                         
                         // Moss patches
                         this.ctx.fillStyle = '#32CD32';
                         this.ctx.fillRect(obstacle.x, obstacle.y, 8, 3);
                         this.ctx.fillRect(obstacle.x + obstacle.width - 8, obstacle.y + obstacle.height - 3, 8, 3);
                    }
               } else if (this.level === 2) {
                    if (obstacle.type === 'snowman') {
                         // Snowman - soft obstacle with bright contrasting colors for visibility
                         // Base (bottom snowball) - keep white but add dark outline
                         this.ctx.fillStyle = '#FFFFFF';
                         this.ctx.beginPath();
                         this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height - 8, 12, 0, Math.PI * 2);
                         this.ctx.fill();
                         
                         // Dark outline for visibility
                         this.ctx.strokeStyle = '#FF0000'; // Bright red outline
                         this.ctx.lineWidth = 3;
                         this.ctx.beginPath();
                         this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height - 8, 12, 0, Math.PI * 2);
                         this.ctx.stroke();
                         
                         // Middle snowball
                         this.ctx.fillStyle = '#FFFFFF';
                         this.ctx.beginPath();
                         this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height - 20, 8, 0, Math.PI * 2);
                         this.ctx.fill();
                         
                         // Dark outline
                         this.ctx.strokeStyle = '#FF0000';
                         this.ctx.beginPath();
                         this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height - 20, 8, 0, Math.PI * 2);
                         this.ctx.stroke();
                         
                         // Head (top snowball)
                         this.ctx.fillStyle = '#FFFFFF';
                         this.ctx.beginPath();
                         this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height - 28, 6, 0, Math.PI * 2);
                         this.ctx.fill();
                         
                         // Dark outline
                         this.ctx.strokeStyle = '#FF0000';
                         this.ctx.beginPath();
                         this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height - 28, 6, 0, Math.PI * 2);
                         this.ctx.stroke();
                         
                         // Eyes - bright for contrast
                         this.ctx.fillStyle = '#000000';
                         this.ctx.beginPath();
                         this.ctx.arc(obstacle.x + obstacle.width/2 - 2, obstacle.y + obstacle.height - 30, 1, 0, Math.PI * 2);
                         this.ctx.arc(obstacle.x + obstacle.width/2 + 2, obstacle.y + obstacle.height - 30, 1, 0, Math.PI * 2);
                         this.ctx.fill();
                         
                         // Carrot nose - bright orange
                         this.ctx.fillStyle = '#FF4500';
                         this.ctx.beginPath();
                         this.ctx.moveTo(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height - 28);
                         this.ctx.lineTo(obstacle.x + obstacle.width/2 + 4, obstacle.y + obstacle.height - 27);
                         this.ctx.lineTo(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height - 26);
                         this.ctx.closePath();
                         this.ctx.fill();
                         
                         // Coal buttons - black
                         this.ctx.fillStyle = '#000000';
                         this.ctx.beginPath();
                         this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height - 18, 1.5, 0, Math.PI * 2);
                         this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height - 14, 1.5, 0, Math.PI * 2);
                         this.ctx.fill();
                    } else if (obstacle.type === 'ice_crystal') {
                         // Ice crystal - geometric obstacle with bright contrasting colors
                         this.ctx.fillStyle = '#00BFFF'; // Deep sky blue
                         
                         // Crystal base
                         this.ctx.beginPath();
                         this.ctx.moveTo(obstacle.x + obstacle.width/2, obstacle.y);
                         this.ctx.lineTo(obstacle.x + 5, obstacle.y + obstacle.height);
                         this.ctx.lineTo(obstacle.x + obstacle.width - 5, obstacle.y + obstacle.height);
                         this.ctx.closePath();
                         this.ctx.fill();
                         
                         // Dark outline for visibility
                         this.ctx.strokeStyle = '#000080'; // Dark blue outline
                         this.ctx.lineWidth = 3;
                         this.ctx.stroke();
                         
                         // Crystal facets - darker blue for contrast
                         this.ctx.fillStyle = '#4169E1'; // Royal blue
                         this.ctx.beginPath();
                         this.ctx.moveTo(obstacle.x + obstacle.width/2, obstacle.y + 5);
                         this.ctx.lineTo(obstacle.x + 12, obstacle.y + obstacle.height - 5);
                         this.ctx.lineTo(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height - 10);
                         this.ctx.lineTo(obstacle.x + obstacle.width - 12, obstacle.y + obstacle.height - 5);
                         this.ctx.closePath();
                         this.ctx.fill();
                         
                         // Dark outline for crystal facets
                         this.ctx.strokeStyle = '#000080';
                         this.ctx.lineWidth = 2;
                         this.ctx.stroke();
                         
                         // Ice shine effects - bright white with black outline
                         this.ctx.fillStyle = '#FFFFFF';
                         this.ctx.fillRect(obstacle.x + 8, obstacle.y + 8, obstacle.width - 16, 3);
                         this.ctx.strokeStyle = '#000000';
                         this.ctx.lineWidth = 1;
                         this.ctx.strokeRect(obstacle.x + 8, obstacle.y + 8, obstacle.width - 16, 3);
                         
                         this.ctx.fillRect(obstacle.x + obstacle.width/2 - 2, obstacle.y + 15, 4, 2);
                         this.ctx.strokeRect(obstacle.x + obstacle.width/2 - 2, obstacle.y + 15, 4, 2);
                         
                         // Crystal sparkle - bright contrasting colors
                         this.ctx.fillStyle = '#FF0000'; // Red sparkles for visibility
                         for (let i = 0; i < 5; i++) {
                              this.ctx.beginPath();
                              this.ctx.arc(obstacle.x + 8 + i * 4, obstacle.y + 20 + i * 3, 1.5, 0, Math.PI * 2);
                              this.ctx.fill();
                         }
                    }
               }
          });
          
          // Draw fallen trees (level-based)
          this.fallenTrees.forEach(tree => {
               if (this.level === 1) {
                    // Tree trunk
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(tree.x, tree.y + tree.height - 15, tree.width, 15);
                    
                    // Tree bark texture
                    this.ctx.strokeStyle = '#654321';
                    this.ctx.lineWidth = 2;
                    for (let i = 0; i < tree.width; i += 8) {
                         this.ctx.beginPath();
                         this.ctx.moveTo(tree.x + i, tree.y + tree.height - 15);
                         this.ctx.lineTo(tree.x + i + 4, tree.y + tree.height);
                         this.ctx.stroke();
                    }
                    
                    // Tree foliage
                    this.ctx.fillStyle = '#228B22';
                    this.ctx.beginPath();
                    this.ctx.ellipse(tree.x + tree.width * 0.2, tree.y + tree.height - 25, 20, 15, 0, 0, Math.PI * 2);
                    this.ctx.ellipse(tree.x + tree.width * 0.5, tree.y + tree.height - 30, 25, 18, 0, 0, Math.PI * 2);
                    this.ctx.ellipse(tree.x + tree.width * 0.8, tree.y + tree.height - 20, 18, 12, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Slide indicator for tall trees
                    if (tree.canSlideUnder) {
                         this.ctx.fillStyle = 'rgba(139, 92, 246, 0.7)';
                         this.ctx.fillRect(tree.x, tree.y + tree.height - 5, tree.width, 5);
                    }
               } else if (this.level === 2) {
                    // Pine tree - evergreen with snow, bright green for visibility
                    // Tree trunk
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(tree.x + tree.width * 0.4, tree.y + tree.height - 20, tree.width * 0.2, 20);
                    
                    // Tree bark texture
                    this.ctx.strokeStyle = '#654321';
                    this.ctx.lineWidth = 2;
                    for (let i = 0; i < tree.width * 0.2; i += 6) {
                         this.ctx.beginPath();
                         this.ctx.moveTo(tree.x + tree.width * 0.4 + i, tree.y + tree.height - 20);
                         this.ctx.lineTo(tree.x + tree.width * 0.4 + i + 3, tree.y + tree.height);
                         this.ctx.stroke();
                    }
                    
                    // Pine branches - bright green for contrast against snow
                    this.ctx.fillStyle = '#228B22'; // Forest green
                    // Bottom layer
                    this.ctx.beginPath();
                    this.ctx.moveTo(tree.x + tree.width * 0.5, tree.y + tree.height - 25);
                    this.ctx.lineTo(tree.x + tree.width * 0.15, tree.y + tree.height - 10);
                    this.ctx.lineTo(tree.x + tree.width * 0.85, tree.y + tree.height - 10);
                    this.ctx.closePath();
                    this.ctx.fill();
                    
                    // Middle layer
                    this.ctx.beginPath();
                    this.ctx.moveTo(tree.x + tree.width * 0.5, tree.y + tree.height - 35);
                    this.ctx.lineTo(tree.x + tree.width * 0.2, tree.y + tree.height - 20);
                    this.ctx.lineTo(tree.x + tree.width * 0.8, tree.y + tree.height - 20);
                    this.ctx.closePath();
                    this.ctx.fill();
                    
                    // Top layer
                    this.ctx.beginPath();
                    this.ctx.moveTo(tree.x + tree.width * 0.5, tree.y + tree.height - 45);
                    this.ctx.lineTo(tree.x + tree.width * 0.25, tree.y + tree.height - 30);
                    this.ctx.lineTo(tree.x + tree.width * 0.75, tree.y + tree.height - 30);
                    this.ctx.closePath();
                    this.ctx.fill();
                    
                    // Snow on branches - white for contrast
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.fillRect(tree.x + tree.width * 0.18, tree.y + tree.height - 12, tree.width * 0.64, 2);
                    this.ctx.fillRect(tree.x + tree.width * 0.22, tree.y + tree.height - 22, tree.width * 0.56, 2);
                    this.ctx.fillRect(tree.x + tree.width * 0.28, tree.y + tree.height - 32, tree.width * 0.44, 2);
                    
                    // Dark outline for visibility
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(tree.x + tree.width * 0.18, tree.y + tree.height - 12, tree.width * 0.64, 2);
                    this.ctx.strokeRect(tree.x + tree.width * 0.22, tree.y + tree.height - 22, tree.width * 0.56, 2);
                    this.ctx.strokeRect(tree.x + tree.width * 0.28, tree.y + tree.height - 32, tree.width * 0.44, 2);
                    
                    // Slide indicator for tall trees
                    if (tree.canSlideUnder) {
                         this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)'; // Red for visibility
                         this.ctx.fillRect(tree.x, tree.y + tree.height - 5, tree.width, 5);
                    }
               }
          });
          
          // Draw fire traps (level-based)
          this.fireTraps.forEach(trap => {
               if (this.level === 1) {
                    // Trap pit
                    this.ctx.fillStyle = '#2F2F2F';
                    this.ctx.fillRect(trap.x, trap.y + trap.height - 10, trap.width, 10);
                    
                    if (trap.active) {
                         // Spiked pit - wooden spikes
                         this.ctx.fillStyle = '#8B4513';
                         for (let i = 0; i < trap.width; i += 8) {
                              this.ctx.beginPath();
                              this.ctx.moveTo(trap.x + i, trap.y + trap.height);
                              this.ctx.lineTo(trap.x + i + 4, trap.y + trap.height - 20);
                              this.ctx.lineTo(trap.x + i + 8, trap.y + trap.height);
                              this.ctx.closePath();
                              this.ctx.fill();
                         }
                    } else {
                         // Inactive pit - covered with leaves
                         this.ctx.fillStyle = '#228B22';
                         this.ctx.fillRect(trap.x + 5, trap.y + trap.height - 5, trap.width - 10, 5);
                    }
               } else if (this.level === 2) {
                    if (trap.type === 'boulder') {
                         // Rolling boulder - dark gray with bright outline
                         this.ctx.fillStyle = '#696969';
                         this.ctx.beginPath();
                         this.ctx.arc(trap.x + trap.width/2, trap.y + trap.height/2, trap.width/2, 0, Math.PI * 2);
                         this.ctx.fill();
                         
                         // Bright outline for visibility
                         this.ctx.strokeStyle = '#FF0000';
                         this.ctx.lineWidth = 3;
                         this.ctx.beginPath();
                         this.ctx.arc(trap.x + trap.width/2, trap.y + trap.height/2, trap.width/2, 0, Math.PI * 2);
                         this.ctx.stroke();
                         
                         // Boulder texture
                         this.ctx.fillStyle = '#808080';
                         this.ctx.beginPath();
                         this.ctx.arc(trap.x + trap.width/2, trap.y + trap.height/2, trap.width/2 - 5, 0, Math.PI * 2);
                         this.ctx.fill();
                         
                         // Boulder highlights - bright for contrast
                         this.ctx.fillStyle = '#FFFFFF';
                         this.ctx.beginPath();
                         this.ctx.arc(trap.x + trap.width/2 - 8, trap.y + trap.height/2 - 8, 4, 0, Math.PI * 2);
                         this.ctx.fill();
                    } else {
                         // Avalanche - falling snow chunks with dark outlines and contrasting colors
                         this.ctx.fillStyle = '#F8F8FF'; // Slightly off-white
                         this.ctx.beginPath();
                         this.ctx.arc(trap.x + trap.width/2, trap.y + trap.height/2, trap.width/2, 0, Math.PI * 2);
                         this.ctx.fill();
                         
                         // Dark outline for visibility
                         this.ctx.strokeStyle = '#8B0000'; // Dark red outline
                         this.ctx.lineWidth = 4;
                         this.ctx.beginPath();
                         this.ctx.arc(trap.x + trap.width/2, trap.y + trap.height/2, trap.width/2, 0, Math.PI * 2);
                         this.ctx.stroke();
                         
                         // Snow texture with darker accents
                         this.ctx.fillStyle = '#E6F3FF'; // Light blue
                         this.ctx.beginPath();
                         this.ctx.arc(trap.x + trap.width/2, trap.y + trap.height/2, trap.width/2 - 5, 0, Math.PI * 2);
                         this.ctx.fill();
                         
                         // Ice chunks in snow - bright contrasting colors
                         this.ctx.fillStyle = '#FF0000'; // Red ice chunks for visibility
                         for (let i = 0; i < 3; i++) {
                              this.ctx.beginPath();
                              this.ctx.arc(trap.x + 10 + i * 10, trap.y + 15 + i * 5, 3, 0, Math.PI * 2);
                              this.ctx.fill();
                              
                              // Add black outline to ice chunks
                              this.ctx.strokeStyle = '#000000';
                              this.ctx.lineWidth = 1;
                              this.ctx.stroke();
                         }
                    }
               }
          });
          
          // Draw birds (forest birds)
          this.birds.forEach(bird => {
               const bx = bird.x;
               const by = bird.y;
               const wingFlap = Math.sin(bird.frame * 4) * 3;
               
               // Bird body - blue jay colors
               this.ctx.fillStyle = '#4169E1';
               this.ctx.beginPath();
               this.ctx.ellipse(bx + 17, by + 10, 12, 8, 0, 0, Math.PI * 2);
               this.ctx.fill();
               
               // Bird head
               this.ctx.fillStyle = '#000080';
               this.ctx.beginPath();
               this.ctx.arc(bx + 28, by + 8, 6, 0, Math.PI * 2);
               this.ctx.fill();
               
               // Beak
               this.ctx.fillStyle = '#FFD700';
               this.ctx.beginPath();
               this.ctx.moveTo(bx + 32, by + 8);
               this.ctx.lineTo(bx + 37, by + 6);
               this.ctx.lineTo(bx + 34, by + 10);
               this.ctx.closePath();
               this.ctx.fill();
               
               // Wings
               this.ctx.fillStyle = '#000080';
               this.ctx.beginPath();
               this.ctx.ellipse(bx + 10, by + 8 + wingFlap, 8, 4, -0.3, 0, Math.PI * 2);
               this.ctx.fill();
               this.ctx.beginPath();
               this.ctx.ellipse(bx + 24, by + 12 - wingFlap, 8, 4, 0.3, 0, Math.PI * 2);
               this.ctx.fill();
               
               // Eye
               this.ctx.fillStyle = '#000000';
               this.ctx.beginPath();
               this.ctx.arc(bx + 30, by + 6, 2, 0, Math.PI * 2);
               this.ctx.fill();
          });
          
          // Draw spikes (level-based)
          this.spikes.forEach(spike => {
               if (this.level === 1) {
                    this.ctx.fillStyle = '#228B22';
                    // Bush base
                    this.ctx.fillRect(spike.x, spike.y + spike.height - 5, spike.width, 5);
                    
                    // Thorns/branches
                    this.ctx.strokeStyle = '#8B4513';
                    this.ctx.lineWidth = 3;
                    for (let i = 0; i < spike.width; i += 6) {
                         this.ctx.beginPath();
                         this.ctx.moveTo(spike.x + i, spike.y + spike.height);
                         this.ctx.lineTo(spike.x + i + 3, spike.y + spike.height - 15);
                         this.ctx.stroke();
                         
                         // Thorn tips
                         this.ctx.fillStyle = '#DC143C';
                         this.ctx.beginPath();
                         this.ctx.arc(spike.x + i + 3, spike.y + spike.height - 15, 2, 0, Math.PI * 2);
                         this.ctx.fill();
                    }
               } else if (this.level === 2) {
                    // Icicles - hanging ice spikes with bright blue colors for visibility
                    this.ctx.fillStyle = '#00BFFF'; // Deep sky blue base
                    // Ice base
                    this.ctx.fillRect(spike.x + 3, spike.y + spike.height - 10, spike.width - 6, 10);
                    
                    // Icicles - bright blue with glow
                    this.ctx.strokeStyle = '#4169E1'; // Royal blue
                    this.ctx.lineWidth = 4;
                    this.ctx.shadowColor = '#4169E1';
                    this.ctx.shadowBlur = 6;
                    for (let i = 0; i < spike.width; i += 10) {
                         this.ctx.beginPath();
                         this.ctx.moveTo(spike.x + i + 5, spike.y + spike.height - 10);
                         this.ctx.lineTo(spike.x + i + 5, spike.y + spike.height - 35);
                         this.ctx.stroke();
                         
                         // Icicle tips with bright blue shine
                         this.ctx.fillStyle = '#00BFFF';
                         this.ctx.beginPath();
                         this.ctx.moveTo(spike.x + i + 3, spike.y + spike.height - 35);
                         this.ctx.lineTo(spike.x + i + 5, spike.y + spike.height - 40);
                         this.ctx.lineTo(spike.x + i + 7, spike.y + spike.height - 35);
                         this.ctx.closePath();
                         this.ctx.fill();
                         
                         // Ice reflection - bright white
                         this.ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
                         this.ctx.fillRect(spike.x + i + 4, spike.y + spike.height - 25, 2, 10);
                    }
                    this.ctx.shadowBlur = 0; // Reset shadow
               }
          });
          
          // Draw moving platforms (level-based)
          this.movingPlatforms.forEach(platform => {
               // Platform shadow
               this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
               this.ctx.fillRect(platform.x + 2, platform.y + 2, platform.width, platform.height);
               
               // Highlight strategic platforms with a glow effect
               if (platform.strategic) {
                    const pulseAlpha = 0.3 + Math.sin(Date.now() * 0.005) * 0.15;
                    this.ctx.shadowColor = '#4169E1';
                    this.ctx.shadowBlur = 15;
                    
                    // Helper indicator line showing the danger below
                    this.ctx.strokeStyle = `rgba(65, 105, 225, ${pulseAlpha})`;
                    this.ctx.lineWidth = 2;
                    this.ctx.setLineDash([5, 5]);
                    this.ctx.beginPath();
                    this.ctx.moveTo(platform.x + platform.width/2, platform.y + platform.height);
                    this.ctx.lineTo(platform.x + platform.width/2, this.ground);
                    this.ctx.stroke();
                    this.ctx.setLineDash([]);
               }
               
               if (this.level === 1) {
                    // Log platform
                    this.ctx.fillStyle = platform.strategic ? '#A0522D' : '#8B4513'; // Lighter brown for strategic
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    
                    // Reset shadow
                    this.ctx.shadowBlur = 0;
                    
                    // Log rings
                    this.ctx.strokeStyle = '#654321';
                    this.ctx.lineWidth = 1;
                    for (let i = 0; i < platform.width; i += 10) {
                         this.ctx.beginPath();
                         this.ctx.arc(platform.x + i + 5, platform.y + platform.height/2, 3, 0, Math.PI * 2);
                         this.ctx.stroke();
                    }
                    
                    // Moss on log - with special color for strategic platforms
                    this.ctx.fillStyle = platform.strategic ? '#00FF00' : '#32CD32'; // Brighter green for strategic
                    this.ctx.fillRect(platform.x, platform.y, platform.width, 3);
               } else if (this.level === 2) {
                    // Floating ice platform - bright blue with glowing effect
                    this.ctx.fillStyle = platform.strategic ? '#00BFFF' : '#4169E1'; // Deep sky blue for strategic, royal blue for normal
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    
                    // Bright outline for contrast
                    this.ctx.strokeStyle = '#FFFFFF';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
                    
                    // Reset shadow
                    this.ctx.shadowBlur = 0;
                    
                    // Floating ice pattern - glowing blue
                    this.ctx.strokeStyle = '#87CEEB';
                    this.ctx.lineWidth = 1;
                    for (let i = 0; i < platform.width; i += 25) {
                         this.ctx.strokeRect(platform.x + i, platform.y, 25, platform.height);
                    }
                    
                    // Ice texture with frost - bright white with glow effect
                    this.ctx.fillStyle = platform.strategic ? '#F0F8FF' : '#E6F3FF'; // Lighter blue instead of white
                    this.ctx.fillRect(platform.x, platform.y, platform.width, 5);
                    
                    // Ice shine/reflection - bright white with glow effect
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
                    this.ctx.fillRect(platform.x + 4, platform.y + 3, platform.width - 8, 2);
                    
                    // Add dark outline to shine for contrast
                    this.ctx.strokeStyle = '#000080';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(platform.x + 4, platform.y + 3, platform.width - 8, 2);
                    
                    // Floating ice particles effect
                    this.ctx.fillStyle = 'rgba(173, 216, 230, 0.6)';
                    for (let i = 0; i < 6; i++) {
                         this.ctx.beginPath();
                         this.ctx.arc(platform.x + 10 + i * 12, platform.y - 3, 1.5, 0, Math.PI * 2);
                         this.ctx.fill();
                    }
               }
               
               // Add help icon for strategic platforms
               if (platform.strategic) {
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.font = 'bold 12px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('!', platform.x + platform.width/2, platform.y - 5);
               }
          });
          
          // Draw coins
          this.coins.forEach(coin => {
               const rotation = coin.frame * 0.3;
               const cx = coin.x + coin.width/2;
               const cy = coin.y + coin.height/2;

               this.ctx.save();
               this.ctx.translate(cx, cy);
               this.ctx.rotate(rotation);

               // Coin shadow
               this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
               this.ctx.beginPath();
               this.ctx.arc(1, 1, 8, 0, Math.PI * 2);
               this.ctx.fill();

               // Coin body (gold)
               this.ctx.fillStyle = '#FFD700';
               this.ctx.beginPath();
               this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
               this.ctx.fill();

               // Coin edge (darker gold)
               this.ctx.strokeStyle = '#B8860B';
               this.ctx.lineWidth = 1;
               this.ctx.beginPath();
               this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
               this.ctx.stroke();

               // Coin shine/highlight
               this.ctx.fillStyle = '#FFF8DC';
               this.ctx.beginPath();
               this.ctx.arc(-2, -2, 3, 0, Math.PI * 2);
               this.ctx.fill();

               // Coin inner details (like a dollar sign or just a simple pattern)
               this.ctx.fillStyle = '#B8860B';
               this.ctx.font = 'bold 10px Arial';
               this.ctx.textAlign = 'center';
               this.ctx.fillText('$', 0, 3);

               this.ctx.restore();
          });
          
          // Draw power-ups (forest-themed)
          this.powerUps.forEach(powerUp => {
               const pulsation = 1 + Math.sin(powerUp.frame * 2) * 0.1;
               const px = powerUp.x + powerUp.width/2;
               const py = powerUp.y + powerUp.height/2;
               
               this.ctx.save();
               this.ctx.translate(px, py);
               this.ctx.scale(pulsation, pulsation);
               
               switch(powerUp.type) {
                    case 'shield':
                         // Leaf shield
                         this.ctx.fillStyle = '#228B22';
                         this.ctx.beginPath();
                         this.ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
                         this.ctx.fill();
                         
                         this.ctx.strokeStyle = '#32CD32';
                         this.ctx.lineWidth = 2;
                         this.ctx.beginPath();
                         this.ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
                         this.ctx.stroke();
                         break;
                         
                    case 'magnet':
                         // Vine magnet
                         this.ctx.strokeStyle = '#228B22';
                         this.ctx.lineWidth = 4;
                         this.ctx.beginPath();
                         this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
                         this.ctx.stroke();
                         
                         this.ctx.fillStyle = '#32CD32';
                         this.ctx.beginPath();
                         this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
                         this.ctx.fill();
                         break;
                         
                    case 'speed':
                         // Wind gust
                         this.ctx.fillStyle = '#87CEEB';
                         this.ctx.beginPath();
                         this.ctx.moveTo(-10, 0);
                         this.ctx.lineTo(10, -6);
                         this.ctx.lineTo(10, 6);
                         this.ctx.closePath();
                         this.ctx.fill();
                         break;
                         
                    case 'doublejump':
                         // Feather wings
                         this.ctx.fillStyle = '#FFFFFF';
                         this.ctx.beginPath();
                         this.ctx.ellipse(-8, -5, 6, 3, -0.3, 0, Math.PI * 2);
                         this.ctx.fill();
                         this.ctx.beginPath();
                         this.ctx.ellipse(8, -5, 6, 3, 0.3, 0, Math.PI * 2);
                         this.ctx.fill();
                         
                         this.ctx.strokeStyle = '#FFD700';
                         this.ctx.lineWidth = 2;
                         this.ctx.beginPath();
                         this.ctx.moveTo(-12, 0);
                         this.ctx.lineTo(12, 0);
                         this.ctx.stroke();
                         break;
                         
                    case 'multiplier':
                         // Star multiplier
                         this.ctx.fillStyle = '#FFD700';
                         this.ctx.beginPath();
                         for (let i = 0; i < 5; i++) {
                              const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                              const x = Math.cos(angle) * 10;
                              const y = Math.sin(angle) * 10;
                              if (i === 0) this.ctx.moveTo(x, y);
                              else this.ctx.lineTo(x, y);
                         }
                         this.ctx.closePath();
                         this.ctx.fill();
                         
                         this.ctx.fillStyle = '#FF4500';
                         this.ctx.font = '12px Arial';
                         this.ctx.textAlign = 'center';
                         this.ctx.fillText('2x', 0, 4);
                         break;
                         
                    case 'slowmotion':
                         // Clock/hourglass
                         this.ctx.strokeStyle = '#4169E1';
                         this.ctx.lineWidth = 2;
                         this.ctx.beginPath();
                         this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
                         this.ctx.stroke();
                         
                         this.ctx.beginPath();
                         this.ctx.moveTo(-4, -4);
                         this.ctx.lineTo(4, 4);
                         this.ctx.moveTo(4, -4);
                         this.ctx.lineTo(-4, 4);
                         this.ctx.stroke();
                         break;
               }
               
               this.ctx.restore();
          });
          
          // Draw particles
          this.particles.forEach(particle => {
               const alpha = particle.life / 40;
               this.ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
               this.ctx.beginPath();
               this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
               this.ctx.fill();
          });
     }
     
     drawMonster() {
          if (!this.monster) return;
          
          let monster = this.monster;
          let isDeadly = this.hitTimestamps && this.hitTimestamps.length >= 3;
          const mx = monster.x;
          const my = monster.y;
          const bounce = Math.sin(monster.frame * 1.5) * 6;
          const breathe = Math.sin(monster.frame * 0.8) * 3;
          
          // Draw monster shadow (bigger)
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          this.ctx.fillRect(mx - 4, this.ground - 3, monster.width + 8, 6);
          
          // Monster body - main torso with irregular shape (scaled up)
          if (this.level === 1) {
               // Temple monster - red/dark
               if (isDeadly) {
                    this.ctx.fillStyle = this.slowdownTimer > 0 ? '#1A0000' : '#2D1B1B';
               } else {
                    this.ctx.fillStyle = this.slowdownTimer > 0 ? '#4A1515' : '#7F2020';
               }
          } else if (this.level === 2) {
               // Snow monster - blue/ice
               if (isDeadly) {
                    this.ctx.fillStyle = this.slowdownTimer > 0 ? '#001122' : '#1E3A5F';
               } else {
                    this.ctx.fillStyle = this.slowdownTimer > 0 ? '#002244' : '#4169E1';
               }
          }
          
          // Main body (irregular shape) - scaled proportionally
          this.ctx.beginPath();
          this.ctx.moveTo(mx + 8, my + 25 + bounce);
          this.ctx.lineTo(mx + 52, my + 25 + bounce);
          this.ctx.lineTo(mx + 55, my + 55 + bounce);
          this.ctx.lineTo(mx + 48, my + 72 + bounce);
          this.ctx.lineTo(mx + 12, my + 72 + bounce);
          this.ctx.lineTo(mx + 5, my + 55 + bounce);
          this.ctx.closePath();
          this.ctx.fill();
          
          // Monster head (larger and more menacing) - side profile
          if (this.level === 1) {
               // Temple monster head
               if (isDeadly) {
                    this.ctx.fillStyle = this.slowdownTimer > 0 ? '#000000' : '#1A0A0A';
               } else {
                    this.ctx.fillStyle = this.slowdownTimer > 0 ? '#2D0000' : '#450A0A';
               }
          } else if (this.level === 2) {
               // Snow monster head - icy blue
               if (isDeadly) {
                    this.ctx.fillStyle = this.slowdownTimer > 0 ? '#000011' : '#0F1419';
               } else {
                    this.ctx.fillStyle = this.slowdownTimer > 0 ? '#001133' : '#1E2A3D';
               }
          }
          
          // Head shape (skull-like side profile) - scaled up
          this.ctx.beginPath();
          this.ctx.ellipse(mx + 32, my + 13 + bounce + breathe, 28, 19, 0, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Monster horns/spikes (facing right) - scaled up
          this.ctx.fillStyle = this.level === 1 ? (isDeadly ? '#800000' : '#600000') : (isDeadly ? '#0088AA' : '#00AACC');
          this.ctx.beginPath();
          this.ctx.moveTo(mx + 20, my + 3 + bounce);
          this.ctx.lineTo(mx + 24, my - 8 + bounce);
          this.ctx.lineTo(mx + 30, my + 5 + bounce);
          this.ctx.closePath();
          this.ctx.fill();
          
          this.ctx.beginPath();
          this.ctx.moveTo(mx + 35, my + 2 + bounce);
          this.ctx.lineTo(mx + 42, my - 6 + bounce);
          this.ctx.lineTo(mx + 48, my + 4 + bounce);
          this.ctx.closePath();
          this.ctx.fill();
          
          // Snout/muzzle (side profile)
          this.ctx.fillStyle = isDeadly ? '#1A0505' : '#3D0A0A';
          this.ctx.beginPath();
          this.ctx.ellipse(mx + 50, my + 18 + bounce + breathe, 12, 8, 0, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Monster arms/claws - scaled up
          this.ctx.fillStyle = this.level === 1 ? (isDeadly ? '#2D0505' : '#4A1010') : (isDeadly ? '#0A1A2A' : '#1E3A5F');
          const armSwing = Math.sin(monster.frame * 1.2) * 5;
          
          // Left arm
          this.ctx.beginPath();
          this.ctx.roundRect(mx + 3 + armSwing, my + 30 + bounce, 14, 32, 3);
          this.ctx.fill();
          
          // Right arm  
          this.ctx.beginPath();
          this.ctx.roundRect(mx + 43 - armSwing, my + 30 + bounce, 14, 32, 3);
          this.ctx.fill();
          
          // Claws - bigger and more menacing
          this.ctx.fillStyle = '#CCCCCC';
          this.ctx.fillRect(mx + 1 + armSwing, my + 58 + bounce, 5, 10);
          this.ctx.fillRect(mx + 7 + armSwing, my + 61 + bounce, 5, 7);
          this.ctx.fillRect(mx + 13 + armSwing, my + 59 + bounce, 5, 9);
          this.ctx.fillRect(mx + 50 - armSwing, my + 58 + bounce, 5, 10);
          this.ctx.fillRect(mx + 44 - armSwing, my + 61 + bounce, 5, 7);
          this.ctx.fillRect(mx + 38 - armSwing, my + 59 + bounce, 5, 9);
          
          // Monster legs - scaled up
          this.ctx.fillStyle = this.level === 1 ? (isDeadly ? '#1A0505' : '#3D0A0A') : (isDeadly ? '#0A1419' : '#1E2A3D');
          this.ctx.beginPath();
          this.ctx.roundRect(mx + 14, my + 67 + bounce, 13, 24, 3);
          this.ctx.fill();
          this.ctx.beginPath();
          this.ctx.roundRect(mx + 33, my + 67 + bounce, 13, 24, 3);
          this.ctx.fill();
          
          // Eye - glowing effect, single eye visible from side, scaled up
          if (this.level === 1) {
               if (isDeadly) {
                    // Deadly monster - bright glowing red eye
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.shadowColor = '#FF0000';
                    this.ctx.shadowBlur = 15;
               } else {
                    // Normal monster - yellow/orange eye
                    this.ctx.fillStyle = this.slowdownTimer > 0 ? '#FFD700' : '#FFA500';
                    this.ctx.shadowColor = this.slowdownTimer > 0 ? '#FFD700' : '#FFA500';
                    this.ctx.shadowBlur = 8;
               }
          } else if (this.level === 2) {
               if (isDeadly) {
                    // Deadly monster - bright glowing icy blue eye
                    this.ctx.fillStyle = '#00BFFF';
                    this.ctx.shadowColor = '#00BFFF';
                    this.ctx.shadowBlur = 15;
               } else {
                    // Normal monster - icy blue eye
                    this.ctx.fillStyle = this.slowdownTimer > 0 ? '#87CEEB' : '#4682B4';
                    this.ctx.shadowColor = this.slowdownTimer > 0 ? '#87CEEB' : '#4682B4';
                    this.ctx.shadowBlur = 8;
               }
          }
          
          // Single visible eye (side profile) - bigger and more menacing
          this.ctx.beginPath();
          this.ctx.arc(mx + 42, my + 10 + bounce + breathe, 8, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Eye pupil - bigger, slit-like for more menacing look
          this.ctx.shadowBlur = 0;
          this.ctx.fillStyle = '#000000';
          this.ctx.beginPath();
          this.ctx.ellipse(mx + 42, my + 10 + bounce + breathe, 2, 4, 0, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Eye reflection
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          this.ctx.beginPath();
          this.ctx.arc(mx + 43, my + 8 + bounce + breathe, 1.5, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Mouth/teeth - side profile, bigger and more menacing
          this.ctx.fillStyle = '#000000';
          this.ctx.beginPath();
          this.ctx.ellipse(mx + 50, my + 20 + bounce + breathe, 8, 4, 0, 0, Math.PI);
          this.ctx.fill();
          
          // Teeth - protruding from side profile
          this.ctx.fillStyle = '#FFFFFF';
          for (let i = 0; i < 4; i++) {
               this.ctx.beginPath();
               this.ctx.moveTo(mx + 44 + i * 4, my + 20 + bounce + breathe);
               this.ctx.lineTo(mx + 47 + i * 4, my + 14 + bounce + breathe);
               this.ctx.lineTo(mx + 46 + i * 4, my + 20 + bounce + breathe);
               this.ctx.closePath();
               this.ctx.fill();
          }
          
          // Large protruding fang
          this.ctx.beginPath();
          this.ctx.moveTo(mx + 52, my + 20 + bounce + breathe);
          this.ctx.lineTo(mx + 58, my + 12 + bounce + breathe);
          this.ctx.lineTo(mx + 54, my + 20 + bounce + breathe);
          this.ctx.closePath();
          this.ctx.fill();
          
          // Draw danger indicator when close
          let distanceToPlayer = Math.abs(monster.x - this.player.x);
          if (distanceToPlayer < 120) {
               if (isDeadly) {
                    // Deadly monster - bright red pulsing line
                    this.ctx.strokeStyle = '#FF0000';
                    this.ctx.lineWidth = 4;
                    this.ctx.setLineDash([6, 2]);
                    this.ctx.shadowColor = '#FF0000';
                    this.ctx.shadowBlur = 6;
               } else {
                    // Normal chasing - less threatening yellow/orange line
                    this.ctx.strokeStyle = this.slowdownTimer > 0 ? '#FFA500' : '#FFD700';
                    this.ctx.lineWidth = 2;
                    this.ctx.setLineDash([12, 8]);
                    this.ctx.shadowBlur = 2;
               }
               this.ctx.beginPath();
               this.ctx.moveTo(monster.x + monster.width/2, monster.y + 10);
               this.ctx.lineTo(this.player.x + this.player.width/2, this.player.y + 10);
               this.ctx.stroke();
               this.ctx.setLineDash([]);
               this.ctx.shadowBlur = 0;
          }
     }
     
     drawClouds() {
          this.clouds.forEach(cloud => {
               this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
               this.ctx.fillRect(cloud.x, cloud.y, cloud.width, cloud.height);
               this.ctx.fillRect(cloud.x + 10, cloud.y - 10, cloud.width - 20, cloud.height);
               this.ctx.fillRect(cloud.x + 15, cloud.y + 10, cloud.width - 30, cloud.height - 10);
          });
     }
     
     drawBackgroundTrees() {
          this.backgroundTrees.forEach(tree => {
               const alpha = tree.depth * 0.8 + 0.2; // Closer trees are more opaque
               const tx = tree.x;
               const ty = tree.y;
               
               // Tree trunk
               this.ctx.fillStyle = `rgba(101, 67, 33, ${alpha})`;
               this.ctx.fillRect(tx + tree.width * 0.4, ty + tree.height * 0.6, tree.width * 0.2, tree.height * 0.4);
               
               // Tree foliage based on type
               switch(tree.type) {
                    case 0: // Pine tree
                         this.ctx.fillStyle = `rgba(34, 139, 34, ${alpha})`;
                         this.ctx.beginPath();
                         this.ctx.moveTo(tx + tree.width * 0.5, ty);
                         this.ctx.lineTo(tx + tree.width * 0.2, ty + tree.height * 0.4);
                         this.ctx.lineTo(tx + tree.width * 0.8, ty + tree.height * 0.4);
                         this.ctx.closePath();
                         this.ctx.fill();
                         
                         this.ctx.beginPath();
                         this.ctx.moveTo(tx + tree.width * 0.5, ty + tree.height * 0.2);
                         this.ctx.lineTo(tx + tree.width * 0.15, ty + tree.height * 0.6);
                         this.ctx.lineTo(tx + tree.width * 0.85, ty + tree.height * 0.6);
                         this.ctx.closePath();
                         this.ctx.fill();
                         
                         this.ctx.beginPath();
                         this.ctx.moveTo(tx + tree.width * 0.5, ty + tree.height * 0.4);
                         this.ctx.lineTo(tx + tree.width * 0.1, ty + tree.height * 0.8);
                         this.ctx.lineTo(tx + tree.width * 0.9, ty + tree.height * 0.8);
                         this.ctx.closePath();
                         this.ctx.fill();
                         break;
                         
                    case 1: // Round tree
                         this.ctx.fillStyle = `rgba(34, 139, 34, ${alpha})`;
                         this.ctx.beginPath();
                         this.ctx.arc(tx + tree.width * 0.5, ty + tree.height * 0.3, tree.width * 0.4, 0, Math.PI * 2);
                         this.ctx.fill();
                         
                         this.ctx.beginPath();
                         this.ctx.arc(tx + tree.width * 0.3, ty + tree.height * 0.5, tree.width * 0.35, 0, Math.PI * 2);
                         this.ctx.fill();
                         
                         this.ctx.beginPath();
                         this.ctx.arc(tx + tree.width * 0.7, ty + tree.height * 0.5, tree.width * 0.35, 0, Math.PI * 2);
                         this.ctx.fill();
                         break;
                         
                    case 2: // Tall tree
                         this.ctx.fillStyle = `rgba(34, 139, 34, ${alpha})`;
                         this.ctx.beginPath();
                         this.ctx.ellipse(tx + tree.width * 0.5, ty + tree.height * 0.2, tree.width * 0.4, tree.height * 0.3, 0, 0, Math.PI * 2);
                         this.ctx.fill();
                         
                         this.ctx.beginPath();
                         this.ctx.ellipse(tx + tree.width * 0.5, ty + tree.height * 0.4, tree.width * 0.35, tree.height * 0.25, 0, 0, Math.PI * 2);
                         this.ctx.fill();
                         
                         this.ctx.beginPath();
                         this.ctx.ellipse(tx + tree.width * 0.5, ty + tree.height * 0.6, tree.width * 0.3, tree.height * 0.2, 0, 0, Math.PI * 2);
                         this.ctx.fill();
                         break;
               }
          });
     }
     
     drawBackgroundWalls() {
          this.backgroundWalls.forEach(wall => {
               const alpha = wall.depth * 0.7 + 0.3; // Closer walls are more opaque
               const wx = wall.x;
               const wy = wall.y;
               
               // Create multiple snowy structures instead of temple walls
               switch(wall.type) {
                    case 0: // Igloo
                         // Igloo dome
                         this.ctx.fillStyle = `rgba(240, 248, 255, ${alpha})`;
                         this.ctx.beginPath();
                         this.ctx.arc(wx + wall.width/2, wy + wall.height - 20, wall.width/2, Math.PI, 0);
                         this.ctx.fill();
                         
                         // Igloo entrance
                         this.ctx.fillStyle = `rgba(176, 224, 230, ${alpha * 0.8})`;
                         this.ctx.fillRect(wx + wall.width/2 - 15, wy + wall.height - 40, 30, 20);
                         
                         // Igloo blocks pattern
                         this.ctx.strokeStyle = `rgba(173, 216, 230, ${alpha})`;
                         this.ctx.lineWidth = 1;
                         for (let i = 0; i < 3; i++) {
                              this.ctx.beginPath();
                              this.ctx.arc(wx + wall.width/2, wy + wall.height - 20 - i * 15, wall.width/2 - i * 10, Math.PI, 0);
                              this.ctx.stroke();
                         }
                         
                         // Snow on top
                         this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                         this.ctx.fillRect(wx + wall.width/2 - 20, wy + wall.height - 50, 40, 10);
                         break;
                         
                    case 1: // Snow-covered mountain
                         // Mountain base
                         this.ctx.fillStyle = `rgba(169, 169, 169, ${alpha})`;
                         this.ctx.beginPath();
                         this.ctx.moveTo(wx, wy + wall.height);
                         this.ctx.lineTo(wx + wall.width/2, wy + wall.height - 60);
                         this.ctx.lineTo(wx + wall.width, wy + wall.height);
                         this.ctx.closePath();
                         this.ctx.fill();
                         
                         // Snow cap
                         this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                         this.ctx.beginPath();
                         this.ctx.moveTo(wx + wall.width/2 - 30, wy + wall.height - 60);
                         this.ctx.lineTo(wx + wall.width/2, wy + wall.height - 80);
                         this.ctx.lineTo(wx + wall.width/2 + 30, wy + wall.height - 60);
                         this.ctx.closePath();
                         this.ctx.fill();
                         
                         // Mountain texture
                         this.ctx.strokeStyle = `rgba(105, 105, 105, ${alpha})`;
                         this.ctx.lineWidth = 2;
                         this.ctx.beginPath();
                         this.ctx.moveTo(wx + 20, wy + wall.height - 20);
                         this.ctx.lineTo(wx + wall.width/2, wy + wall.height - 70);
                         this.ctx.lineTo(wx + wall.width - 20, wy + wall.height - 25);
                         this.ctx.stroke();
                         
                         // Ice crystals on mountain
                         this.ctx.fillStyle = `rgba(173, 216, 230, ${alpha * 0.7})`;
                         for (let i = 0; i < 5; i++) {
                              this.ctx.beginPath();
                              this.ctx.arc(wx + 30 + i * 15, wy + wall.height - 40 - i * 5, 2, 0, Math.PI * 2);
                              this.ctx.fill();
                         }
                         break;
                         
                    case 2: // Pine forest background
                         // Multiple pine trees
                         for (let i = 0; i < 3; i++) {
                              const treeX = wx + 20 + i * 25;
                              const treeY = wy + wall.height - 40;
                              
                              // Tree trunk
                              this.ctx.fillStyle = `rgba(101, 67, 33, ${alpha})`;
                              this.ctx.fillRect(treeX - 2, treeY, 4, 30);
                              
                              // Pine branches
                              this.ctx.fillStyle = `rgba(34, 139, 34, ${alpha})`;
                              this.ctx.beginPath();
                              this.ctx.moveTo(treeX, treeY - 5);
                              this.ctx.lineTo(treeX - 8, treeY + 5);
                              this.ctx.lineTo(treeX + 8, treeY + 5);
                              this.ctx.closePath();
                              this.ctx.fill();
                              
                              this.ctx.beginPath();
                              this.ctx.moveTo(treeX, treeY - 15);
                              this.ctx.lineTo(treeX - 6, treeY - 5);
                              this.ctx.lineTo(treeX + 6, treeY - 5);
                              this.ctx.closePath();
                              this.ctx.fill();
                              
                              // Snow on branches
                              this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                              this.ctx.fillRect(treeX - 5, treeY - 2, 10, 2);
                              this.ctx.fillRect(treeX - 4, treeY - 12, 8, 2);
                         }
                         break;
               }
               
               // Add torches on temple structures for atmosphere
               // Use deterministic decision based on wall properties to prevent random appearance/disappearance
               const torchPresenceSeed = Math.sin(wall.depth * 50 + wall.type * 25 + wall.width * 0.02) * 1000;
               if (Math.abs(torchPresenceSeed) % 1000 < 400) { // 40% chance for torches, but deterministic
                    // Use deterministic positioning based on stable wall properties (not wall.x which moves)
                    const torchSeed = Math.sin(wall.depth * 100 + wall.type * 50 + wall.width * 0.01) * 1000;
                    const torchX = wx + wall.width * (0.3 + (Math.abs(torchSeed) % 1000) / 1000 * 0.4);
                    const torchY = wy + wall.height * 0.6;
                    
                    // Torch holder
                    this.ctx.fillStyle = `rgba(101, 67, 33, ${alpha})`;
                    this.ctx.fillRect(torchX - 2, torchY, 4, 15);
                    
                    // Torch flame with flicker
                    const flicker = Math.sin(Date.now() * 0.01 + wall.depth * 10 + wall.type) * 0.3 + 0.7;
                    this.ctx.fillStyle = `rgba(255, 165, 0, ${alpha * 0.8 * flicker})`;
                    this.ctx.beginPath();
                    this.ctx.arc(torchX, torchY - 3, 3 * flicker, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Flame glow
                    this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.3 * flicker})`;
                    this.ctx.beginPath();
                    this.ctx.arc(torchX, torchY - 3, 6 * flicker, 0, Math.PI * 2);
                    this.ctx.fill();
               }
               
               // Add some mystical glow effects
               // Use deterministic decision based on wall properties to prevent random appearance/disappearance
               const glowPresenceSeed = Math.cos(wall.depth * 75 + wall.type * 30 + wall.width * 0.015) * 1000;
               if (Math.abs(glowPresenceSeed) % 1000 < 200) { // 20% chance for mystical effects, but deterministic
                    // Use deterministic positioning based on stable wall properties
                    const glowSeed = Math.cos(wall.depth * 200 + wall.type * 75 + wall.width * 0.005) * 1000;
                    const glowX = wx + wall.width * 0.5 + (Math.abs(glowSeed) % 200 - 100) * 0.5;
                    const glowY = wy + wall.height * 0.3;
                    
                    // Mystical energy glow
                    const glowGradient = this.ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 20);
                    glowGradient.addColorStop(0, `rgba(255, 215, 0, ${alpha * 0.6})`);
                    glowGradient.addColorStop(0.5, `rgba(255, 165, 0, ${alpha * 0.4})`);
                    glowGradient.addColorStop(1, `rgba(255, 215, 0, 0)`);
                    
                    this.ctx.fillStyle = glowGradient;
                    this.ctx.beginPath();
                    this.ctx.arc(glowX, glowY, 20, 0, Math.PI * 2);
                    this.ctx.fill();
               }
          });
     }
     
     drawGround() {
          if (this.level === 1) {
               // Forest ground - green with leaf litter
               this.ctx.fillStyle = '#228B22';
               this.ctx.fillRect(0, this.ground, this.canvas.width, this.canvas.height - this.ground);
               
               // Ground pattern - forest floor with leaves and dirt patches
               this.ctx.fillStyle = '#32CD32';
               for (let i = 0; i < this.canvas.width; i += 60) {
                    let offset = (i + this.score) % 120;
                    this.ctx.fillRect(offset, this.ground, 30, 8);
                    
                    // Add some leaf litter
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(offset + 5, this.ground + 2, 8, 3);
                    this.ctx.fillStyle = '#32CD32';
               }
          } else if (this.level === 2) {
               // Snowy ground - white snow with ice patches and drifts
               this.ctx.fillStyle = '#FFFFFF'; // Pure white snow
               this.ctx.fillRect(0, this.ground, this.canvas.width, this.canvas.height - this.ground);
               
               // Ice patches and snow drifts
               this.ctx.fillStyle = '#E6F3FF'; // Light blue ice
               for (let i = 0; i < this.canvas.width; i += 100) {
                    let offset = (i + this.score * 0.5) % 200;
                    // Ice patches
                    this.ctx.fillRect(offset, this.ground, 30, 4);
                    this.ctx.fillRect(offset + 60, this.ground + 2, 25, 3);
                    
                    // Snow drifts
                    this.ctx.fillStyle = '#F8F8FF'; // Slightly off-white snow drifts
                    this.ctx.beginPath();
                    this.ctx.ellipse(offset + 40, this.ground - 2, 20, 6, 0, 0, Math.PI);
                    this.ctx.fill();
                    
                    this.ctx.fillStyle = '#E6F3FF'; // Reset to ice color
               }
               
               // Add some frost/sparkle effects
               this.ctx.fillStyle = 'rgba(173, 216, 230, 0.8)';
               for (let i = 0; i < this.canvas.width; i += 80) {
                    let offset = (i + this.score * 0.3) % 160;
                    this.ctx.beginPath();
                    this.ctx.arc(offset + 20, this.ground + 5, 1, 0, Math.PI * 2);
                    this.ctx.arc(offset + 50, this.ground + 3, 0.8, 0, Math.PI * 2);
                    this.ctx.fill();
               }
          }
     }
     
     update() {
          if (this.gameState !== 'playing') return;
          
          this.updatePlayer();
          this.spawnObstacle();
          this.updateObstacles();
          this.updateMonster();
          this.updateClouds();
          this.updateBackgroundTrees();
          this.updateBackgroundWalls();
          this.updateSnowParticles(); // Update snow particles for level 2
          this.updateGameSpeed();
          this.checkCollisions();
          this.updateHitTimestamps(); // Check for hit reset
          this.updateUI();
          
          // Update score every few frames
          if (this.score % 3 === 0) {
               this.updateScore();
          }
     }
     
     updateUI() {
          // Update hit counter safely
          const hitCountElement = document.getElementById('obstacleHits');
          if (hitCountElement) {
               hitCountElement.textContent = this.hitTimestamps ? this.hitTimestamps.length : 0;
          }
          
          // Update slowdown indicator
          const slowdownIndicator = document.getElementById('slowdownIndicator');
          if (slowdownIndicator) {
               if (this.slowdownTimer > 0) {
                    slowdownIndicator.classList.remove('hidden');
               } else {
                    slowdownIndicator.classList.add('hidden');
               }
          }
          
          // Update double jump indicator
          const doubleJumpIndicator = document.getElementById('doubleJumpIndicator');
          if (doubleJumpIndicator) {
               if (this.player.jumping && !this.player.doubleJumpUsed) {
                    doubleJumpIndicator.classList.remove('hidden');
               } else {
                    doubleJumpIndicator.classList.add('hidden');
               }
          }
          
          // Update sliding indicator
          const slidingIndicator = document.getElementById('slidingIndicator');
          if (slidingIndicator) {
               if (this.player.sliding) {
                    slidingIndicator.classList.remove('hidden');
               } else {
                    slidingIndicator.classList.add('hidden');
               }
          }
          
          // Update power-up indicators
          const shieldIndicator = document.getElementById('shieldIndicator');
          if (shieldIndicator) {
               if (this.invulnerable) {
                    shieldIndicator.classList.remove('hidden');
               } else {
                    shieldIndicator.classList.add('hidden');
               }
          }
          
          const magnetIndicator = document.getElementById('magnetIndicator');
          if (magnetIndicator) {
               if (this.magnetCoins) {
                    magnetIndicator.classList.remove('hidden');
               } else {
                    magnetIndicator.classList.add('hidden');
               }
          }
          
          const speedIndicator = document.getElementById('speedIndicator');
          if (speedIndicator) {
               if (this.speedBoost) {
                    speedIndicator.classList.remove('hidden');
               } else {
                    speedIndicator.classList.add('hidden');
               }
          }
          
          const doubleJumpBoostIndicator = document.getElementById('doubleJumpBoostIndicator');
          if (doubleJumpBoostIndicator) {
               if (this.doubleJumpBoost) {
                    doubleJumpBoostIndicator.classList.remove('hidden');
               } else {
                    doubleJumpBoostIndicator.classList.add('hidden');
               }
          }
          
          const scoreMultiplierIndicator = document.getElementById('scoreMultiplierIndicator');
          if (scoreMultiplierIndicator) {
               if (this.scoreMultiplier) {
                    scoreMultiplierIndicator.classList.remove('hidden');
               } else {
                    scoreMultiplierIndicator.classList.add('hidden');
               }
          }
          
          const slowMotionIndicator = document.getElementById('slowMotionIndicator');
          if (slowMotionIndicator) {
               if (this.slowMotion) {
                    slowMotionIndicator.classList.remove('hidden');
               } else {
                    slowMotionIndicator.classList.add('hidden');
               }
          }
     }
     
     drawSun() {
          const sunX = this.canvas.width - 100; // Position sun on the right side
          const sunY = 80; // Position sun near the top
          const sunRadius = 45;
          
          // Add subtle pulsing animation
          const pulse = 1 + Math.sin(Date.now() * 0.002) * 0.05;
          const currentRadius = sunRadius * pulse;
          
          // Draw outer glow effect
          const glowGradient = this.ctx.createRadialGradient(
               sunX, sunY, currentRadius,
               sunX, sunY, currentRadius + 30
          );
          glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
          glowGradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.2)');
          glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
          
          this.ctx.fillStyle = glowGradient;
          this.ctx.beginPath();
          this.ctx.arc(sunX, sunY, currentRadius + 30, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Draw sun rays with varying lengths and glow
          this.ctx.shadowColor = '#FFD700';
          this.ctx.shadowBlur = 15;
          
          // Draw 12 rays with different lengths for more dynamic look
          for (let i = 0; i < 12; i++) {
               const angle = (i * Math.PI) / 6;
               const rayLength = 20 + Math.sin(i * 0.5) * 10; // Varying ray lengths
               const rayWidth = 2 + Math.sin(i * 0.7) * 1; // Varying ray widths
               
               const rayStartX = sunX + Math.cos(angle) * (currentRadius + 5);
               const rayStartY = sunY + Math.sin(angle) * (currentRadius + 5);
               const rayEndX = sunX + Math.cos(angle) * (currentRadius + rayLength);
               const rayEndY = sunY + Math.sin(angle) * (currentRadius + rayLength);
               
               // Create gradient for each ray
               const rayGradient = this.ctx.createLinearGradient(rayStartX, rayStartY, rayEndX, rayEndY);
               rayGradient.addColorStop(0, 'rgba(255, 215, 0, 0.9)');
               rayGradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
               
               this.ctx.strokeStyle = rayGradient;
               this.ctx.lineWidth = rayWidth;
               this.ctx.beginPath();
               this.ctx.moveTo(rayStartX, rayStartY);
               this.ctx.lineTo(rayEndX, rayEndY);
               this.ctx.stroke();
          }
          
          // Reset shadow
          this.ctx.shadowBlur = 0;
          
          // Draw sun body with enhanced gradient
          const sunGradient = this.ctx.createRadialGradient(
               sunX - currentRadius * 0.4, sunY - currentRadius * 0.4, 0,
               sunX, sunY, currentRadius
          );
          sunGradient.addColorStop(0, '#FFFFFF'); // Bright white center
          sunGradient.addColorStop(0.3, '#FFF8DC'); // Cream
          sunGradient.addColorStop(0.7, '#FFD700'); // Gold
          sunGradient.addColorStop(1, '#FF8C00'); // Dark orange at edges
          
          this.ctx.fillStyle = sunGradient;
          this.ctx.beginPath();
          this.ctx.arc(sunX, sunY, currentRadius, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Add sun surface details - more realistic texture
          this.ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
          
          // Larger sunspots with better positioning
          const spots = [
               { x: -12, y: -10, r: 8 },
               { x: 15, y: 8, r: 6 },
               { x: -8, y: 18, r: 5 },
               { x: 10, y: -15, r: 4 },
               { x: -18, y: 5, r: 3 }
          ];
          
          spots.forEach(spot => {
               this.ctx.beginPath();
               this.ctx.arc(sunX + spot.x, sunY + spot.y, spot.r, 0, Math.PI * 2);
               this.ctx.fill();
          });
          
          // Add some corona effect - small particles around the sun
          this.ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
          for (let i = 0; i < 8; i++) {
               const coronaAngle = (i * Math.PI) / 4 + Date.now() * 0.001;
               const coronaDistance = currentRadius + 15 + Math.sin(Date.now() * 0.003 + i) * 5;
               const coronaX = sunX + Math.cos(coronaAngle) * coronaDistance;
               const coronaY = sunY + Math.sin(coronaAngle) * coronaDistance;
               
               this.ctx.beginPath();
               this.ctx.arc(coronaX, coronaY, 2 + Math.sin(i * 0.5) * 1, 0, Math.PI * 2);
               this.ctx.fill();
          }
          
          // Add a subtle inner highlight
          const highlightGradient = this.ctx.createRadialGradient(
               sunX - currentRadius * 0.3, sunY - currentRadius * 0.3, 0,
               sunX - currentRadius * 0.3, sunY - currentRadius * 0.3, currentRadius * 0.6
          );
          highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
          highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          
          this.ctx.fillStyle = highlightGradient;
          this.ctx.beginPath();
          this.ctx.arc(sunX - currentRadius * 0.3, sunY - currentRadius * 0.3, currentRadius * 0.6, 0, Math.PI * 2);
          this.ctx.fill();
     }
     
     draw() {
          // Clear canvas with level-based background
          let gradient;
          if (this.level === 1) {
               // Forest theme - sky blue to green
               gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
               gradient.addColorStop(0, '#87CEEB');
               gradient.addColorStop(0.7, '#98FB98');
               gradient.addColorStop(1, '#228B22');
          } else if (this.level === 2) {
               // Snowy theme - winter sky blue to white
               gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
               gradient.addColorStop(0, '#E6F3FF'); // Light blue sky
               gradient.addColorStop(0.6, '#FFFFFF'); // White
               gradient.addColorStop(1, '#F8F8FF'); // Snow white ground
          }
          this.ctx.fillStyle = gradient;
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
          
          // Draw sun only in level 1
          if (this.level === 1) {
               this.drawSun();
          }
          
          // Hit flash effect
          if (this.hitFlash && this.hitFlash > 0) {
               this.ctx.fillStyle = `rgba(255, 0, 0, ${this.hitFlash / 60})`;
               this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
               this.hitFlash--;
          }
          
          // Draw clouds only in level 1
          if (this.level === 1) {
               this.drawClouds();
               this.drawBackgroundTrees();
          } else if (this.level === 2) {
               this.drawBackgroundWalls();
               this.drawSnowParticles(); // Draw snow particles for level 2
          }
          
          this.drawGround();
          this.drawObstacles();
          this.drawMonster();
          this.drawPlayer();
     }
     
     gameLoop() {
          this.update();
          this.draw();
          requestAnimationFrame(() => this.gameLoop());
     }
}

// Start the game when page loads
window.addEventListener('load', () => {
     new EndlessRunner();
});

// Handle window resize
window.addEventListener('resize', () => {
     const canvas = document.getElementById('gameCanvas');
     canvas.width = window.innerWidth;
     canvas.height = window.innerHeight;
});