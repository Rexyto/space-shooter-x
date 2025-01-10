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
            engineParticles: []
        };
        
        this.enemies = [];
        this.particles = [];
        this.powerUps = [];
        this.stars = this.createStarfield();
        this.nebulas = this.createNebulas();
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameLoop = null;
        this.enemySpawnInterval = null;
        this.powerUpInterval = null;
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
    }

    resetGame() {
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 50;
        this.player.bullets = [];
        this.player.powerLevel = 1;
        this.player.shield = 100;
        this.player.isShieldActive = false;
        this.player.engineParticles = [];
        this.enemies = [];
        this.particles = [];
        this.powerUps = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.updateHUD();
    }

    spawnPowerUp() {
        const types = ['multishot', 'shield', 'life'];
        const powerUp = {
            x: Math.random() * (this.canvas.width - 30),
            y: -30,
            width: 30,
            height: 30,
            speed: 2,
            type: types[Math.floor(Math.random() * types.length)],
            angle: 0
        };
        this.powerUps.push(powerUp);
    }

    spawnEnemy() {
        const types = ['normal', 'fast', 'tank'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const enemyTypes = {
            normal: { width: 40, height: 40, speed: 2, health: 1, color: '#ff0000' },
            fast: { width: 30, height: 30, speed: 4, health: 1, color: '#ff00ff' },
            tank: { width: 50, height: 50, speed: 1, health: 3, color: '#ff8800' }
        };

        const enemyConfig = enemyTypes[type];
        const enemy = {
            x: Math.random() * (this.canvas.width - enemyConfig.width),
            y: -enemyConfig.height,
            ...enemyConfig,
            type,
            angle: 0
        };
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
    }

    updateEnemies() {
        this.enemies.forEach(enemy => {
            enemy.angle += 0.05;
        });

        this.enemies = this.enemies.filter(enemy => {
            enemy.y += enemy.speed;
            if (enemy.y > this.canvas.height) {
                this.lives--;
                this.updateHUD();
                return false;
            }
            return true;
        });
    }

    updatePowerUps() {
        this.powerUps.forEach(powerUp => {
            powerUp.angle += 0.05;
        });

        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.y += powerUp.speed;
            return powerUp.y < this.canvas.height;
        });
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
                    this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#ff0000');
                    this.updateHUD();
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

        // Dibujar balas
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
            }
            
            this.ctx.restore();
        });

        // Dibujar power-ups
        this.powerUps.forEach(powerUp => {
            this.ctx.save();
            this.ctx.translate(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
            this.ctx.rotate(powerUp.angle);

            const colors = {
                multishot: '#ffff00',
                shield: '#00ffff',
                life: '#00ff00'
            };
            
            // Dibujar el brillo exterior
            const gradient = this.ctx.createRadialGradient(0, 0, powerUp.width / 4, 0, 0, powerUp.width);
            gradient.addColorStop(0, colors[powerUp.type]);
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(-powerUp.width, -powerUp.height, powerUp.width * 2, powerUp.height * 2);

            // Dibujar el power-up
            this.ctx.fillStyle = colors[powerUp.type];
            if (powerUp.type === 'multishot') {
                // Símbolo de disparo triple
                this.ctx.beginPath();
                this.ctx.moveTo(-powerUp.width / 3, powerUp.height / 4);
                this.ctx.lineTo(0, -powerUp.height / 4);
                this.ctx.lineTo(powerUp.width / 3, powerUp.height / 4);
                this.ctx.closePath();
                this.ctx.fill();
            } else if (powerUp.type === 'shield') {
                // Símbolo de escudo
                this.ctx.beginPath();
                this.ctx.arc(0, 0, powerUp.width / 3, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (powerUp.type === 'life') {
                // Símbolo de vida (corazón)
                this.ctx.beginPath();
                this.ctx.moveTo(0, powerUp.height / 4);
                this.ctx.bezierCurveTo(
                    powerUp.width / 4, -powerUp.height / 4,
                    powerUp.width / 2, 0,
                    0, powerUp.height / 3
                );
                this.ctx.bezierCurveTo(
                    -powerUp.width / 2, 0,
                    -powerUp.width / 4, -powerUp.height / 4,
                    0, powerUp.height / 4
                );
                this.ctx.fill();
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
    }

    updateHUD() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
        document.getElementById('shield').style.width = `${this.player.shield}%`;
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

    gameOver() {
        this.isGameRunning = false;
        cancelAnimationFrame(this.gameLoop);
        clearInterval(this.enemySpawnInterval);
        clearInterval(this.powerUpInterval);
        this.saveHighScore();
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    showStartScreen() {
        this.isGameRunning = false;
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('controlsScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
}

// Inicializar el juego cuando se carga la página
window.addEventListener('load', () => {
    new Game();
});