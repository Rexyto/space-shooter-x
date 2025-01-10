class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Mejorado el diseño del jugador
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 60,
            height: 60,
            speed: 6,
            bullets: [],
            powerLevel: 1,
            shield: 100,
            isShieldActive: false,
            engineParticles: [],
            survivalTime: 0
        };
        
        this.enemies = [];
        this.particles = [];
        this.powerUps = [];
        this.bosses = [];
        this.stars = this.createStarfield();
        this.nebulas = this.createNebulas();
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameLoop = null;
        this.enemySpawnInterval = null;
        this.powerUpInterval = null;
        this.survivalTimer = null;
        this.isGameRunning = false;
        
        this.setupEventListeners();
        this.showStartScreen();
        this.loadHighScore();
    }

    createStarfield() {
        const stars = [];
        for (let i = 0; i < 200; i++) {
            stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 2 + 1,
                brightness: Math.random() * 0.5 + 0.5
            });
        }
        return stars;
    }

    createNebulas() {
        const nebulas = [];
        const colors = ['#ff00ff33', '#00ffff33', '#ffff0033'];
        for (let i = 0; i < 5; i++) {
            nebulas.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 200 + 100,
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: 0.2
            });
        }
        return nebulas;
    }

    createEngineParticle() {
        const offset = Math.random() * 20 - 10;
        return {
            x: this.player.x + this.player.width / 2 + offset,
            y: this.player.y + this.player.height,
            vx: offset * 0.1,
            vy: Math.random() * 2 + 2,
            life: 30,
            color: Math.random() > 0.5 ? '#ff4400' : '#ffaa00'
        };
    }

    setupEventListeners() {
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.startGame());
        document.getElementById('controlsButton').addEventListener('click', () => this.showControls());
        document.getElementById('backButton').addEventListener('click', () => this.hideControls());
        
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'KeyS') this.toggleShield();
            if (e.code === 'Escape' && !this.isGameRunning) this.hideControls();
        });
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }

    showControls() {
        document.getElementById('controlsScreen').classList.remove('hidden');
        document.getElementById('startScreen').classList.add('hidden');
    }

    hideControls() {
        document.getElementById('controlsScreen').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden');
    }

    toggleShield() {
        if (this.player.shield > 30) {
            this.player.isShieldActive = !this.player.isShieldActive;
            if (this.player.isShieldActive) {
                this.createShieldEffect();
            }
        }
    }

    createShieldEffect() {
        if (this.player.isShieldActive && this.player.shield > 0) {
            this.player.shield -= 0.5;
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i + Date.now() * 0.003;
                const particle = {
                    x: this.player.x + this.player.width / 2 + Math.cos(angle) * 40,
                    y: this.player.y + this.player.height / 2 + Math.sin(angle) * 40,
                    vx: Math.cos(angle) * 0.5,
                    vy: Math.sin(angle) * 0.5,
                    life: 20,
                    color: '#00ffff'
                };
                this.particles.push(particle);
            }
            requestAnimationFrame(() => this.createShieldEffect());
        }
    }

    startGame() {
        this.isGameRunning = true;
        this.resetGame();
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('controlsScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        this.gameLoop = requestAnimationFrame(() => this.update());
        this.enemySpawnInterval = setInterval(() => this.spawnEnemy(), 1000 - (this.level * 50));
        this.powerUpInterval = setInterval(() => this.spawnPowerUp(), 10000);
        this.survivalTimer = setInterval(() => {
            this.player.survivalTime++;
        }, 1000);
    }

    resetGame() {
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 50;
        this.player.bullets = [];
        this.player.powerLevel = 1;
        this.player.shield = 100;
        this.player.isShieldActive = false;
        this.player.engineParticles = [];
        this.player.survivalTime = 0;
        this.enemies = [];
        this.particles = [];
        this.powerUps = [];
        this.bosses = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.updateHUD();
    }

    spawnPowerUp() {
        const types = ['multishot', 'shield', 'life', 'timeSlow', 'explosion', 'rapidFire', 'invulnerability'];
        const powerUp = {
            x: Math.random() * (this.canvas.width - 30),
            y: -30,
            width: 30,
            height: 30,
            speed: 2,
            type: types[Math.floor(Math.random() * types.length)],
            angle: 0,
            glow: 0.5 + Math.sin(Date.now() * 0.005) * 0.2
        };
        this.powerUps.push(powerUp);
    }

    spawnEnemy() {
        const types = ['normal', 'fast', 'tank', 'shooter', 'bomber', 'laser'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const enemyTypes = {
            normal: { width: 40, height: 40, speed: 2, health: 1, color: '#ff0000' },
            fast: { width: 30, height: 30, speed: 4, health: 1, color: '#ff00ff' },
            tank: { width: 50, height: 50, speed: 1, health: 3, color: '#ff8800' },
            shooter: { width: 45, height: 45, speed: 1.5, health: 2, color: '#ff4400', shootInterval: 2000 },
            bomber: { width: 55, height: 55, speed: 1, health: 2, color: '#880088' },
            laser: { width: 40, height: 50, speed: 1, health: 2, color: '#ff0066', chargeTime: 60, chargeCounter: 0 }
        };

        const enemyConfig = enemyTypes[type];
        const enemy = {
            x: Math.random() * (this.canvas.width - enemyConfig.width),
            y: -enemyConfig.height,
            ...enemyConfig,
            type,
            angle: 0,
            bullets: []
        };

        // Configuración específica por tipo
        if (type === 'shooter') {
            enemy.lastShot = Date.now();
        } else if (type === 'laser') {
            enemy.isCharging = false;
        }

        this.enemies.push(enemy);
    }

    shoot() {
        if (!this.keys['Space_last']) {
            const bulletConfigs = {
                1: [{ offsetX: 0, offsetY: 0 }],
                2: [{ offsetX: -15, offsetY: 0 }, { offsetX: 15, offsetY: 0 }],
                3: [{ offsetX: -20, offsetY: 0 }, { offsetX: 0, offsetY: -15 }, { offsetX: 20, offsetY: 0 }]
            };

            bulletConfigs[this.player.powerLevel].forEach(config => {
                const bullet = {
                    x: this.player.x + this.player.width / 2 - 2 + config.offsetX,
                    y: this.player.y + config.offsetY,
                    width: 4,
                    height: 15,
                    speed: 10,
                    color: '#00ffff'
                };
                this.player.bullets.push(bullet);
                
                // Efecto de disparo
                this.createExplosion(bullet.x, bullet.y, '#00ffff', 5, 0.5);
            });
        }
        this.keys['Space_last'] = true;
    }

    update() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.updateBackground();
        this.handleInput();
        this.updateBullets();
        this.updateEnemies();
        this.updatePowerUps();
        this.updateParticles();
        this.updateEngineParticles();
        this.checkCollisions();
        this.draw();
        
        if (this.lives > 0) {
            this.gameLoop = requestAnimationFrame(() => this.update());
        } else {
            this.gameOver();
        }
    }

    updateBackground() {
        // Actualizar estrellas
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        });

        // Actualizar nebulosas
        this.nebulas.forEach(nebula => {
            nebula.y += nebula.speed;
            if (nebula.y > this.canvas.height + nebula.size) {
                nebula.y = -nebula.size;
                nebula.x = Math.random() * this.canvas.width;
            }
        });
    }

    handleInput() {
        if (this.keys['ArrowLeft']) this.player.x = Math.max(0, this.player.x - this.player.speed);
        if (this.keys['ArrowRight']) this.player.x = Math.min(this.canvas.width - this.player.width, this.player.x + this.player.speed);
        if (this.keys['Space']) this.shoot();
        if (!this.keys['Space']) this.keys['Space_last'] = false;

        // Añadir partículas del motor
        if (Math.random() > 0.5) {
            this.player.engineParticles.push(this.createEngineParticle());
        }
    }

    updateBullets() {
        this.player.bullets = this.player.bullets.filter(bullet => {
            bullet.y -= bullet.speed;
            return bullet.y > -bullet.height;
        });

        // Actualizar balas de enemigos
        this.enemies.forEach(enemy => {
            if (enemy.bullets) {
                enemy.bullets = enemy.bullets.filter(bullet => {
                    if (bullet.hasExploded) {
                        bullet.explodeRadius += 2;
                        bullet.life--;
                        return bullet.life > 0;
                    } else {
                        bullet.y += bullet.speed;
                        return bullet.y < this.canvas.height;
                    }
                });
            }
        });
    }

    updateEnemies() {
        this.enemies.forEach(enemy => {
            enemy.y += enemy.speed;
            enemy.angle += 0.05;
    
            // Comportamiento específico por tipo
            switch (enemy.type) {
                case 'shooter':
                    if (Date.now() - enemy.lastShot > enemy.shootInterval) {
                        this.enemyShoot(enemy);
                        enemy.lastShot = Date.now();
                    }
                    break;
                case 'bomber':
                    if (Math.random() < 0.02) {
                        this.dropBomb(enemy);
                    }
                    break;
                case 'laser':
                    if (!enemy.isCharging) {
                        enemy.chargeCounter++;
                        if (enemy.chargeCounter >= enemy.chargeTime) {
                            this.fireLaser(enemy);
                            enemy.chargeCounter = 0;
                        }
                    }
                    break;
            }
        });
    
        // Filtrar enemigos que salen de la pantalla sin penalización
        this.enemies = this.enemies.filter(enemy => enemy.y <= this.canvas.height);
    }

    enemyShoot(enemy) {
        const bullet = {
            x: enemy.x + enemy.width / 2 - 2,
            y: enemy.y + enemy.height,
            width: 4,
            height: 10,
            speed: 5,
            color: enemy.color
        };
        enemy.bullets.push(bullet);
    }

    dropBomb(enemy) {
        const bomb = {
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height,
            width: 8,
            height: 8,
            speed: 3,
            color: enemy.color,
            hasExploded: false,
            explodeRadius: 0,
            life: 30
        };
        enemy.bullets.push(bomb);
    }

    fireLaser(enemy) {
        const laser = {
            x: enemy.x + enemy.width / 2 - 2,
            y: enemy.y + enemy.height,
            width: 4,
            height: this.canvas.height,
            alpha: 1,
            life: 30
        };
        enemy.bullets.push(laser);
        enemy.isCharging = true;
        setTimeout(() => {
            enemy.isCharging = false;
        }, 1000);
    }

    updatePowerUps() {
        this.powerUps.forEach(powerUp => {
            powerUp.y += powerUp.speed;
            powerUp.angle += 0.05;
            powerUp.glow = 0.5 + Math.sin(Date.now() * 0.005) * 0.2;
        });

        this.powerUps = this.powerUps.filter(powerUp => powerUp.y < this.canvas.height);
    }

    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            return particle.life > 0;
        });
    }

    updateEngineParticles() {
        this.player.engineParticles = this.player.engineParticles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            return particle.life > 0;
        });
    }

    createExplosion(x, y, color = '#ffff00', count = 20, speed = 2) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed * (1 + Math.random()),
                vy: Math.sin(angle) * speed * (1 + Math.random()),
                life: 50,
                color: color
            };
            this.particles.push(particle);
        }
    }

    checkCollisions() {
        // Colisiones bala-enemigo
        this.player.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.checkCollision(bullet, enemy)) {
                    this.player.bullets.splice(bulletIndex, 1);
                    enemy.health--;
                    
                    if (enemy.health <= 0) {
                        this.enemies.splice(enemyIndex, 1);
                        this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                        this.score += 100 * this.level;
                        
                        if (this.score > 0 && this.score % 1000 === 0) {
                            this.level++;
                        }
                        
                        this.updateHUD();
                    }
                }
            });
        });

        // Colisiones jugador-powerup
        this.powerUps.forEach((powerUp, index) => {
            if (this.checkCollision(this.player, powerUp)) {
                switch (powerUp.type) {
                    case 'multishot':
                        this.player.powerLevel = Math.min(3, this.player.powerLevel + 1);
                        break;
                    case 'shield':
                        this.player.shield = Math.min(100, this.player.shield + 50);
                        break;
                    case 'life':
                        this.lives++;
                        break;
                    case 'timeSlow':
                        // Implementar ralentización del tiempo
                        break;
                    case 'explosion':
                        this.createExplosion(this.player.x + this.player.width / 2, 
                                          this.player.y, '#ff0000', 30, 3);
                        break;
                    case 'rapidFire':
                        // Implementar disparo rápido
                        break;
                    case 'invulnerability':
                        // Implementar invulnerabilidad
                        break;
                }
                this.powerUps.splice(index, 1);
                this.createExplosion(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, '#00ff00');
                this.updateHUD();
            }
        });

        // Colisiones jugador-enemigo si el escudo no está activo
        if (!this.player.isShieldActive) {
            this.enemies.forEach((enemy, index) => {
                if (this.checkCollision(this.player, enemy)) {
                    this.enemies.splice(index, 1);
                    this.lives--;
                    this.createExplosion(this.player.x + this.player.width / 2, 
                                       this.player.y + this.player.height / 2, '#ff0000');
                    this.updateHUD();
                }
            });

            // Colisiones jugador-balas enemigas
            this.enemies.forEach(enemy => {
                if (enemy.bullets) {
                    enemy.bullets.forEach((bullet, bulletIndex) => {
                        if (!bullet.hasExploded && this.checkCollision(this.player, bullet)) {
                            if (bullet.alpha !== undefined) {
                                // Es un láser
                                this.lives--;
                            } else {
                                // Es una bala normal o bomba
                                bullet.hasExploded = true;
                                bullet.explodeRadius = 0;
                            }
                            this.createExplosion(this.player.x + this.player.width / 2, 
                                               this.player.y + this.player.height / 2, '#ff0000');
                            this.updateHUD();
                        }
                    });
                }
            });
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

 draw() {
        // Dibujar fondo
        this.ctx.fillStyle = '#000033';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dibujar nebulosas
        this.nebulas.forEach(nebula => {
            const gradient = this.ctx.createRadialGradient(
                nebula.x, nebula.y, 0,
                nebula.x, nebula.y, nebula.size
            );
            gradient.addColorStop(0, nebula.color);
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                nebula.x - nebula.size,
                nebula.y - nebula.size,
                nebula.size * 2,
                nebula.size * 2
            );
        });

        // Dibujar estrellas
        this.stars.forEach(star => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });

        // Dibujar partículas del motor
        this.player.engineParticles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 30;
            this.ctx.fillRect(particle.x, particle.y, 3, 3);
        });
        this.ctx.globalAlpha = 1;

        // Dibujar jugador
        this.ctx.save();
        this.ctx.translate(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
        
        // Cuerpo principal
        this.ctx.fillStyle = '#00ff00';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -this.player.height / 2);
        this.ctx.lineTo(this.player.width / 2, this.player.height / 2);
        this.ctx.lineTo(-this.player.width / 2, this.player.height / 2);
        this.ctx.closePath();
        this.ctx.fill();

        // Detalles
        this.ctx.fillStyle = '#00aa00';
        this.ctx.fillRect(-this.player.width / 4, 0, this.player.width / 2, this.player.height / 3);
        
        this.ctx.restore();

        // Dibujar escudo si está activo
        if (this.player.isShieldActive) {
            this.ctx.strokeStyle = '#00ffff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2,
                45,
                0,
                Math.PI * 2
            );
            this.ctx.stroke();

            // Efecto de brillo del escudo
            this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2,
                50,
                0,
                Math.PI * 2
            );
            this.ctx.stroke();
        }

        // Dibujar balas del jugador
        this.player.bullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.color;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            
            // Efecto de brillo
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            this.ctx.fillRect(bullet.x - 2, bullet.y, bullet.width + 4, bullet.height);
        });

        // Dibujar enemigos
        this.enemies.forEach(enemy => {
            this.ctx.save();
            this.ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            this.ctx.rotate(enemy.angle);
            
            this.ctx.fillStyle = enemy.color;
            if (enemy.type === 'normal') {
                // Enemigo normal - Hexágono
                this.ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 / 6) * i;
                    const x = Math.cos(angle) * enemy.width / 2;
                    const y = Math.sin(angle) * enemy.height / 2;
                    if (i === 0) this.ctx.moveTo(x, y);
                    else this.ctx.lineTo(x, y);
                }
                this.ctx.closePath();
                this.ctx.fill();
            } else if (enemy.type === 'fast') {
                // Enemigo rápido - Diamante
                this.ctx.beginPath();
                this.ctx.moveTo(0, -enemy.height / 2);
                this.ctx.lineTo(enemy.width / 2, 0);
                this.ctx.lineTo(0, enemy.height / 2);
                this.ctx.lineTo(-enemy.width / 2, 0);
                this.ctx.closePath();
                this.ctx.fill();
            } else if (enemy.type === 'tank') {
                // Enemigo tanque - Octágono
                this.ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    const x = Math.cos(angle) * enemy.width / 2;
                    const y = Math.sin(angle) * enemy.height / 2;
                    if (i === 0) this.ctx.moveTo(x, y);
                    else this.ctx.lineTo(x, y);
                }
                this.ctx.closePath();
                this.ctx.fill();

                // Detalles del tanque
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, enemy.width / 4, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (enemy.type === 'shooter') {
                // Enemigo shooter - Diseño circular con núcleo brillante
                this.ctx.fillStyle = enemy.color;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, enemy.width / 2, 0, Math.PI * 2);
                this.ctx.fill();

                // Núcleo brillante
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, enemy.width / 3 + 5, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (enemy.type === 'bomber') {
                // Enemigo bombardero - Diseño hexagonal con núcleo
                this.ctx.fillStyle = enemy.color;

                // Cuerpo exterior
                this.ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 / 6) * i;
                    const x = Math.cos(angle) * enemy.width / 2;
                    const y = Math.sin(angle) * enemy.height / 2;
                    if (i === 0) this.ctx.moveTo(x, y);
                    else this.ctx.lineTo(x, y);
                }
                this.ctx.closePath();
                this.ctx.fill();

                // Núcleo pulsante
                const pulseSize = 1 + Math.sin(Date.now() * 0.01) * 0.2;
                this.ctx.fillStyle = 'rgba(255, 0, 255, 0.6)';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, enemy.width / 4 * pulseSize, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (enemy.type === 'laser') {
                // Enemigo láser - Diseño triangular con cristal de energía
                this.ctx.fillStyle = enemy.color;

                // Cuerpo triangular
                this.ctx.beginPath();
                this.ctx.moveTo(0, -enemy.height / 2);
                this.ctx.lineTo(enemy.width / 2, enemy.height / 2);
                this.ctx.lineTo(-enemy.width / 2, enemy.height / 2);
                this.ctx.closePath();
                this.ctx.fill();

                // Cristal de energía
                const chargeProgress = enemy.chargeCounter / enemy.chargeTime;
                this.ctx.fillStyle = `rgba(255, ${255 * (1 - chargeProgress)}, 0, 0.8)`;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, enemy.width / 3 * (0.5 + chargeProgress * 0.5), 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();

// Dibujar balas de enemigos
if (enemy.bullets) {
    enemy.bullets.forEach(bullet => {
        if (bullet.hasExploded) {
            // Dibujar explosión de bomba
            const gradient = this.ctx.createRadialGradient(
                bullet.x, bullet.y, 0,
                bullet.x, bullet.y, bullet.explodeRadius
            );
            gradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.explodeRadius, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (bullet.alpha !== undefined) {
            // Dibujar láser
            const gradient = this.ctx.createLinearGradient(
                bullet.x, bullet.y,
                bullet.x, bullet.y + bullet.height
            );
            gradient.addColorStop(0, `rgba(255, 0, 0, ${bullet.alpha})`);
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        } else {
            // Dibujar bala normal
            this.ctx.fillStyle = bullet.color;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    });
}
        });

        // Dibujar power-ups
        this.powerUps.forEach(powerUp => {
            this.ctx.save();
            this.ctx.translate(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
            this.ctx.rotate(powerUp.angle);

            // Efecto de brillo
            this.ctx.fillStyle = `rgba(255, 255, 255, ${powerUp.glow})`;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, powerUp.width / 1.5, 0, Math.PI * 2);
            this.ctx.fill();

            // Icono según el tipo
            this.ctx.fillStyle = '#00ff00';
            switch (powerUp.type) {
                case 'multishot':
                    this.drawMultishotIcon();
                    break;
                case 'shield':
                    this.drawShieldIcon();
                    break;
                case 'life':
                    this.drawLifeIcon();
                    break;
                case 'timeSlow':
                    this.drawTimeSlowIcon();
                    break;
                case 'explosion':
                    this.drawExplosionIcon();
                    break;
                case 'rapidFire':
                    this.drawRapidFireIcon();
                    break;
                case 'invulnerability':
                    this.drawInvulnerabilityIcon();
                    break;
            }

            this.ctx.restore();
        });

        // Dibujar partículas
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 50;
            this.ctx.fillRect(particle.x, particle.y, 3, 3);
        });
        this.ctx.globalAlpha = 1;

        // Dibujar HUD
        this.drawHUD();
    }

    drawMultishotIcon() {
        // Tres líneas divergentes
        this.ctx.beginPath();
        this.ctx.moveTo(0, 10);
        this.ctx.lineTo(-10, -10);
        this.ctx.moveTo(0, 10);
        this.ctx.lineTo(0, -10);
        this.ctx.moveTo(0, 10);
        this.ctx.lineTo(10, -10);
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    drawShieldIcon() {
        // Escudo
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 10, -Math.PI * 0.8, Math.PI * 0.8);
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    drawLifeIcon() {
        // Corazón
        this.ctx.beginPath();
        this.ctx.moveTo(0, 5);
        this.ctx.quadraticCurveTo(-10, -5, 0, -10);
        this.ctx.quadraticCurveTo(10, -5, 0, 5);
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fill();
    }

    drawTimeSlowIcon() {
        // Reloj
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, -7);
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(5, 0);
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawExplosionIcon() {
        // Explosión
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(
                Math.cos(angle) * 10,
                Math.sin(angle) * 10
            );
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    drawRapidFireIcon() {
        // Flechas rápidas
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(-5, -8 + i * 8);
            this.ctx.lineTo(5, -8 + i * 8);
            this.ctx.lineTo(0, -4 + i * 8);
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fill();
        }
    }

    drawInvulnerabilityIcon() {
        // Estrella
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
            const x = Math.cos(angle) * 10;
            const y = Math.sin(angle) * 10;
            if (i === 0) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fill();
    }

    drawHUD() {
        // Fondo del HUD
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(10, 10, 200, 100);

        // Información del jugador
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        this.ctx.fillText(`Level: ${this.level}`, 20, 50);
        this.ctx.fillText(`Lives: ${this.lives}`, 20, 70);

        // Barra de escudo
        this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        this.ctx.fillRect(20, 80, 100, 10);
        this.ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        this.ctx.fillRect(20, 80, this.player.shield, 10);

        // Tiempo de supervivencia
        const minutes = Math.floor(this.player.survivalTime / 60);
        const seconds = this.player.survivalTime % 60;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(
            `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`,
            20, 100
        );
    }

    gameOver() {
        this.isGameRunning = false;
        cancelAnimationFrame(this.gameLoop);
        clearInterval(this.enemySpawnInterval);
        clearInterval(this.powerUpInterval);
        clearInterval(this.survivalTimer);
        this.saveHighScore();
        
        // Mostrar pantalla de game over
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('survivalTime').textContent =
            `${Math.floor(this.player.survivalTime / 60)}:${(this.player.survivalTime % 60).toString().padStart(2, '0')}`;
        document.getElementById('highScore').textContent = Math.max(this.score, localStorage.getItem('highScore') || 0);
    }

    showStartScreen() {
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }

    loadHighScore() {
        const highScore = localStorage.getItem('highScore') || 0;
        document.getElementById('highScore').textContent = highScore;
    }

    saveHighScore() {
        const currentHighScore = localStorage.getItem('highScore') || 0;
        if (this.score > currentHighScore) {
            localStorage.setItem('highScore', this.score);
            document.getElementById('highScore').textContent = this.score;
        }
    }

    updateHUD() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('shield').style.width = `${this.player.shield}%`;
        document.getElementById('highScore').textContent = Math.max(this.score, localStorage.getItem('highScore') || 0);
    }
}


// Exportar la clase Game
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});