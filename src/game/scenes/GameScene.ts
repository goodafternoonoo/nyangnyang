// @ts-nocheck
import Phaser from 'phaser';
import { globalState } from '../state';
import { SFX, resumeAudio } from '../audio';
import { saveGameData } from '../firebase';

export default class GameScene extends Phaser.Scene {
    private player: Phaser.Physics.Arcade.Sprite;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private keys: any;
    private enemies: Phaser.Physics.Arcade.Group;
    private bosses: Phaser.Physics.Arcade.Group;
    private gems: Phaser.Physics.Arcade.Group;
    private boxes: Phaser.Physics.Arcade.Group;
    private yarns: Phaser.Physics.Arcade.Group;
    private fishbones: Phaser.Physics.Arcade.Group;
    private hairballs: Phaser.Physics.Arcade.Group;
    private punches: Phaser.GameObjects.Group;
    private coins: Phaser.Physics.Arcade.Group;

    private timerText: Phaser.GameObjects.Text;
    private levelText: Phaser.GameObjects.Text;
    private hpBarFill: Phaser.GameObjects.Graphics;
    private hpText: Phaser.GameObjects.Text;
    private expBarFill: Phaser.GameObjects.Graphics;
    private coinTextUI: Phaser.GameObjects.Text;
    private skillIconsGroup: Phaser.GameObjects.Group;
    private hudContainer!: Phaser.GameObjects.Container;

    private stats: any;
    private isPaused: boolean = false;
    private elapsedSeconds: number = 0;
    private joystickBase: Phaser.GameObjects.Arc;
    private joystickThumb: Phaser.GameObjects.Arc;
    private isDragging: boolean = false;
    private joystickVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
    private playerShadow: Phaser.GameObjects.Ellipse;

    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.initGameState();

        this.physics.world.setBounds(0, 0, 3000, 3000);
        this.add.tileSprite(1500, 1500, 3000, 3000, 'wood_floor').setDepth(0);

        this.playerShadow = this.add.ellipse(1500, 1525, 40, 15, 0x000000, 0.3).setDepth(9);
        this.player = this.physics.add.sprite(1500, 1500, 'yulmu').setDepth(10);
        this.player.setDisplaySize(60, 60);
        this.player.setCollideWorldBounds(true);

        this.cameras.main.startFollow(this.player).setBounds(0, 0, 3000, 3000);

        this.setupGroups();
        this.setupUI();
        this.setupInput();

        this.time.addEvent({ delay: 1000, callback: this.handleGameTick, callbackScope: this, loop: true });
        this.physics.add.overlap(this.player, this.gems, this.collectGem, null, this);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.boxes, this.collectBox, null, this);
        this.physics.add.collider(this.player, this.enemies, this.takeDamage, null, this);
        this.physics.add.collider(this.player, this.bosses, this.takeDamage, null, this);
        this.physics.add.overlap(this.enemies, [this.yarns, this.fishbones, this.hairballs], this.hitByWeapon, null, this);
        this.physics.add.overlap(this.bosses, [this.yarns, this.fishbones, this.hairballs], this.hitByWeapon, null, this);

        this.updateUI();

        // 셧다운 시 리스너 정리
        this.events.once('shutdown', () => {
            this.input.removeAllListeners();
            this.scale.removeAllListeners();
        });
    }

    update(time: number, delta: number) {
        if (this.stats.hp <= 0 || this.isPaused) return;
        this.handlePlayerMovement(time);
        this.handleEnemyMovement(time);
        this.handleWeapons(time, delta);
        this.handleItems();
        this.updateUI();
    }

    private initGameState() {
        let hpLv = globalState.upgrades.hp, spdLv = globalState.upgrades.speed, dmgLv = globalState.upgrades.damage, magLv = globalState.upgrades.magnet;
        let baseMaxHp = 100 + (hpLv * 10), baseSpeed = 160 + (spdLv * 10), baseDmg = 30 + (dmgLv * 5), baseMagnet = 160 + (magLv * 20);

        this.stats = {
            hp: baseMaxHp, maxHp: baseMaxHp, exp: 0, level: 1, speed: baseSpeed,
            attackRange: 140, attackDamage: baseDmg, attackCooldown: 850, attackScale: 1,
            yarnCount: 0, yarnDamage: 22, magnetRange: baseMagnet, expMultiplier: 1.0, defense: 0, hpRegen: 0, knockbackMult: 1.0,
            fishBoneCount: 0, fishBoneDamage: 35, hairballLevel: 0, hairballDamage: 25,
            skills: { punch: 1, aspeed: 0, yarn: 0, fishbone: 0, hairball: 0, magnet: 0, regen: 0, defense: 0, exp: 0 },
            isPunchEvo: false, isYarnEvo: false, isHairballEvo: false, bossSpawns: [], coinCount: 0,
            timers: { punch: 0, hairball: 0, fishbone: 0 }
        }
        this.isPaused = false;
        this.elapsedSeconds = 0;
        this.isDragging = false;
        this.joystickVector.set(0, 0);
    }

    private setupGroups() {
        this.enemies = this.physics.add.group();
        this.bosses = this.physics.add.group();
        this.gems = this.physics.add.group();
        this.coins = this.physics.add.group();
        this.boxes = this.physics.add.group();
        this.yarns = this.physics.add.group();
        this.fishbones = this.physics.add.group();
        this.hairballs = this.physics.add.group();
        this.punches = this.add.group();
    }

    private setupUI() {
        this.hudContainer = this.add.container(16, 16).setScrollFactor(0).setDepth(100);
        let hudBg = this.add.graphics();
        hudBg.fillStyle(0xffffff, 0.1).fillRoundedRect(0, 0, 210, 150, 24);
        hudBg.lineStyle(2, 0xffffff, 0.2).strokeRoundedRect(0, 0, 210, 150, 24);
        this.hudContainer.add(hudBg);

        this.timerText = this.add.text(16, 16, '00:00', { fontFamily: 'OngleipParkDahyeon', fontSize: '24px', color: '#ffffff', fontStyle: 'bold' });
        this.levelText = this.add.text(130, 18, 'Lv.1', { fontFamily: 'OngleipParkDahyeon', fontSize: '18px', color: '#3182F6', fontStyle: 'bold' });
        this.coinTextUI = this.add.text(16, 46, '🪙 0', { fontFamily: 'OngleipParkDahyeon', fontSize: '18px', color: '#FFD700' });
        
        this.hudContainer.add([this.timerText, this.levelText, this.coinTextUI]);

        this.hudContainer.add(this.add.text(16, 74, '에너지', { fontFamily: 'OngleipParkDahyeon', fontSize: '12px', color: '#B0B8C1' }));
        let hpBg = this.add.graphics().fillStyle(0x000000, 0.2).fillRoundedRect(16, 89, 178, 12, 6);
        this.hpBarFill = this.add.graphics();
        this.hpText = this.add.text(105, 95, '100 / 100', { fontFamily: 'OngleipParkDahyeon', fontSize: '11px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        this.hudContainer.add([hpBg, this.hpBarFill, this.hpText]);

        this.hudContainer.add(this.add.text(16, 114, '경험치', { fontFamily: 'OngleipParkDahyeon', fontSize: '10px', color: '#B0B8C1' }));
        let expBg = this.add.graphics().fillStyle(0x000000, 0.2).fillRoundedRect(16, 128, 178, 4, 2);
        this.expBarFill = this.add.graphics();
        this.hudContainer.add([expBg, this.expBarFill]);

        this.skillIconsGroup = this.add.group();
    }

    private setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D');
        this.joystickBase = this.add.circle(0, 0, 60, 0x000000, 0.3).setScrollFactor(0).setDepth(99).setVisible(false);
        this.joystickThumb = this.add.circle(0, 0, 30, 0xffffff, 0.5).setScrollFactor(0).setDepth(99).setVisible(false);
        
        this.input.on('pointerdown', p => { 
            resumeAudio(); 
            if (this.isPaused) return; 
            this.isDragging = true; 
            this.joystickBase.setPosition(p.x, p.y).setVisible(true); 
            this.joystickThumb.setPosition(p.x, p.y).setVisible(true); 
        });
        this.input.on('pointermove', p => { 
            if (this.isPaused) return; 
            if (this.isDragging) { 
                let a = Phaser.Math.Angle.Between(this.joystickBase.x, this.joystickBase.y, p.x, p.y); 
                let d = Math.min(60, Phaser.Math.Distance.Between(this.joystickBase.x, this.joystickBase.y, p.x, p.y)); 
                this.joystickThumb.x = this.joystickBase.x + Math.cos(a) * d; 
                this.joystickThumb.y = this.joystickBase.y + Math.sin(a) * d; 
                this.joystickVector.set(Math.cos(a), Math.sin(a)); 
            } 
        });
        this.input.on('pointerup', () => { 
            this.isDragging = false; 
            this.joystickBase.setVisible(false); 
            this.joystickThumb.setVisible(false); 
            this.joystickVector.set(0, 0); 
        });
    }

    private handleGameTick() {
        if (this.isPaused || this.stats.hp <= 0) return;
        this.elapsedSeconds++;
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + this.stats.hpRegen);
        let curMin = Math.floor(this.elapsedSeconds / 60);
        if (curMin > 0 && this.elapsedSeconds % 60 === 0 && !this.stats.bossSpawns.includes(curMin)) {
            this.stats.bossSpawns.push(curMin);
            this.spawnBoss(curMin);
        }
        this.spawnEnemy();
        this.updateUI();
    }

    private handlePlayerMovement(time: number) {
        this.player.setVelocity(0);
        let mx = 0, my = 0;
        if (this.cursors.left.isDown || this.keys.A.isDown) mx = -1; else if (this.cursors.right.isDown || this.keys.D.isDown) mx = 1;
        if (this.cursors.up.isDown || this.keys.W.isDown) my = -1; else if (this.cursors.down.isDown || this.keys.S.isDown) my = 1;
        
        if (this.isDragging) {
            this.player.setVelocity(this.joystickVector.x * this.stats.speed, this.joystickVector.y * this.stats.speed);
        } else if (mx !== 0 || my !== 0) {
            let v = new Phaser.Math.Vector2(mx, my).normalize();
            this.player.setVelocity(v.x * this.stats.speed, v.y * this.stats.speed);
        }
        
        this.player.setFlipX(this.player.body.velocity.x < 0);
        if (this.playerShadow) { this.playerShadow.x = this.player.x; this.playerShadow.y = this.player.y + 26; }
        if (this.player.body.velocity.length() > 0) this.player.setRotation(Math.sin(time / 80) * 0.15); else this.player.setRotation(0);
    }

    private handleEnemyMovement(time: number) {
        this.enemies.getChildren().forEach((e: any, i) => { if (e.active) { if (time > (e.knockbackUntil || 0)) this.physics.moveToObject(e, this.player, e.baseSpeed || 60); e.setFlipX(e.body.velocity.x < 0); e.setRotation(Math.sin(time / 100 + i) * 0.15); } });
        this.bosses.getChildren().forEach((b: any, i) => { if (b.active) { if (time > (b.knockbackUntil || 0)) this.physics.moveToObject(b, this.player, b.baseSpeed || 50); b.setFlipX(b.body.velocity.x < 0); b.setRotation(Math.sin(time / 50) * 0.1); } });
    }

    private handleWeapons(time: number, delta: number) {
        this.stats.timers.punch += delta;
        this.stats.timers.hairball += delta;
        this.stats.timers.fishbone += delta;

        if (this.stats.timers.punch >= this.stats.attackCooldown) {
            this.performNyangPunch();
            this.stats.timers.punch = 0;
        }
        if ((this.stats.skills.hairball > 0 || this.stats.skills.hairball === "MAX") && this.stats.timers.hairball >= 1300) {
            this.fireHairball();
            this.stats.timers.hairball = 0;
        }
        if ((this.stats.skills.fishbone > 0 || this.stats.skills.fishbone === "MAX") && this.stats.timers.fishbone >= 2600) {
            this.fireFishBone();
            this.stats.timers.fishbone = 0;
        }

        if (this.stats.skills.yarn > 0 || this.stats.skills.yarn === "MAX") {
            this.yarns.getChildren().forEach((y: any, i) => {
                let a = (time * (this.stats.isYarnEvo ? 0.007 : 0.0035)) + ((Math.PI * 2 / this.stats.yarnCount) * i);
                let rad = this.stats.isYarnEvo ? 140 : 95;
                y.x = this.player.x + Math.cos(a) * rad; y.y = this.player.y + Math.sin(a) * rad;
                y.rotation += 0.007 * delta;
            });
        }

        this.fishbones.getChildren().forEach((fb: any) => {
            if (!fb.active) return;
            if (!fb.isReturning) {
                if (fb.life > 0) fb.life -= delta; else { fb.isReturning = true; fb.body.velocity.set(0); }
            } else {
                this.physics.moveToObject(fb, this.player, 480);
                if (Phaser.Math.Distance.Between(fb.x, fb.y, this.player.x, this.player.y) < 30) fb.disableBody(true, true);
            }
            fb.rotation += 0.015 * delta;
        });
    }

    private handleItems() {
        this.gems.getChildren().forEach((g: any) => { 
            if (g.active) {
                let d = Phaser.Math.Distance.Between(this.player.x, this.player.y, g.x, g.y);
                if (d < 35) this.collectGem(this.player, g);
                else if (d < this.stats.magnetRange) this.physics.moveToObject(g, this.player, 480); 
            }
        });
        this.coins.getChildren().forEach((c: any) => { 
            if (c.active) {
                let d = Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y);
                if (d < 35) this.collectCoin(this.player, c);
                else if (d < this.stats.magnetRange) this.physics.moveToObject(c, this.player, 480); 
            }
        });
        this.boxes.getChildren().forEach((b: any) => {
            if (b.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y) < 45) {
                this.collectBox(this.player, b);
            }
        });
    }

    private performNyangPunch() {
        let target = this.getNearestEnemy(this.stats.attackRange);
        if (target) {
            let angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
            let px = this.player.x + Math.cos(angle) * 55, py = this.player.y + Math.sin(angle) * 55;
            let key = this.stats.isPunchEvo ? 'punch_evo' : 'punch';

            let p = this.punches.get(px, py, key);
            if (p) {
                // ⚠️ 핵심: 이전 트윈 중단 및 초기화
                this.tweens.killTweensOf(p);
                p.setActive(true).setVisible(true).setPosition(px, py).setTexture(key);
                p.setRotation(angle + Math.PI / 2);
                p.setAlpha(1);
                p.setDisplaySize(90 * this.stats.attackScale, 90 * this.stats.attackScale);
                
                this.tweens.add({ 
                    targets: p, 
                    displayHeight: 130 * this.stats.attackScale, 
                    displayWidth: 130 * this.stats.attackScale, 
                    alpha: 0, 
                    duration: 150, 
                    ease: 'Back.easeOut',
                    onComplete: () => p.setActive(false).setVisible(false) 
                });

                if (this.stats.isPunchEvo) {
                    SFX.evoPunch();
                    let all = this.enemies.getChildren().concat(this.bosses.getChildren());
                    all.forEach((e: any) => { if (e.active && Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < 110) this.applyDamage(e, this.stats.attackDamage * 1.6); });
                } else {
                    SFX.punch();
                    this.applyDamage(target, this.stats.attackDamage);
                }
            }
        }
    }

    private getNearestEnemy(range: number) {
        let nearest = null; let minDist = range;
        let all = this.enemies.getChildren().concat(this.bosses.getChildren());
        all.forEach((e: any) => { if (!e.active) return; let d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y); if (d < minDist) { minDist = d; nearest = e; } });
        return nearest;
    }

    private fireHairball() {
        let target = this.getNearestEnemy(650);
        if (target) {
            let count = this.stats.isHairballEvo ? 3 : 1;
            for (let i = 0; i < count; i++) { 
                this.time.delayedCall(i * 150, () => { 
                    let ct = this.getNearestEnemy(650); 
                    if (!ct) return; 
                    let hb = this.hairballs.get(this.player.x, this.player.y, 'hairball'); 
                    if (hb) { 
                        hb.setActive(true).setVisible(true).enableBody(true, this.player.x, this.player.y, true, true); 
                        hb.setDisplaySize(35, 35);
                        this.physics.moveToObject(hb, ct, 580); 
                        hb.damage = this.stats.hairballDamage; 
                    } 
                }); 
            }
        }
    }

    private fireFishBone() {
        for (let i = 0; i < this.stats.fishBoneCount; i++) { 
            let angle = (Math.PI * 2 / this.stats.fishBoneCount) * i + this.elapsedSeconds; 
            let fb = this.fishbones.get(this.player.x, this.player.y, 'fishbone'); 
            if (fb) { 
                fb.setActive(true).setVisible(true).enableBody(true, this.player.x, this.player.y, true, true); 
                fb.setDisplaySize(45, 45);
                fb.body.velocity.set(Math.cos(angle) * 380, Math.sin(angle) * 380); 
                fb.isReturning = false; 
                fb.life = 1300; 
                fb.damage = this.stats.fishBoneDamage; 
            } 
        }
    }

    private applyDamage(enemy: any, damage: number) {
        if (!enemy.active) return; enemy.hp -= damage; enemy.setTint(0xff0000); 
        this.time.delayedCall(100, () => { if (enemy.active) enemy.clearTint(); });
        let ang = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        let kb = (enemy.isBoss ? 20 : 300) * this.stats.knockbackMult; 
        enemy.setVelocity(Math.cos(ang) * kb, Math.sin(ang) * kb); 
        enemy.knockbackUntil = this.time.now + (enemy.isBoss ? 50 : 200);
        this.showDamageText(enemy.x, enemy.y, Math.floor(damage));
        
        if (damage > 50 || enemy.isBoss) this.cameras.main.shake(80, 0.003);

        if (enemy.hp <= 0) { 
            if (enemy.isBoss) { 
                let box = this.boxes.get(enemy.x, enemy.y, 'treasure_box'); 
                if (box) { box.setActive(true).setVisible(true).enableBody(true, enemy.x, enemy.y, true, true); box.setDisplaySize(80, 80); }
                for (let i = 0; i < 15; i++) { 
                    let cx = enemy.x + Phaser.Math.Between(-50, 50), cy = enemy.y + Phaser.Math.Between(-50, 50); 
                    let c = this.coins.get(cx, cy, 'coin'); if (c) { c.setActive(true).setVisible(true).enableBody(true, cx, cy, true, true); c.setDisplaySize(35, 35); }
                } 
            } else { 
                if (Math.random() < 0.15) { 
                    let c = this.coins.get(enemy.x, enemy.y, 'coin'); if (c) { c.setActive(true).setVisible(true).enableBody(true, enemy.x, enemy.y, true, true); c.setDisplaySize(35, 35); }
                } else { 
                    let g = this.gems.get(enemy.x, enemy.y, 'gem'); if (g) { g.setActive(true).setVisible(true).enableBody(true, enemy.x, enemy.y, true, true); g.setDisplaySize(30, 30); }
                } 
            } 
            enemy.disableBody(true, true); 
        } 
    }

    private hitByWeapon(enemy: any, weapon: any) { 
        if (!enemy.active || !weapon.active) return; 
        let dmg = weapon.damage || this.stats.yarnDamage; 
        let wType = weapon.texture.key; 
        if (wType === 'hairball') { weapon.disableBody(true, true); SFX.punch(); } 
        else { 
            enemy.lastHitTimes = enemy.lastHitTimes || {}; 
            if (enemy.lastHitTimes[wType] && this.time.now < enemy.lastHitTimes[wType] + 300) return; 
            enemy.lastHitTimes[wType] = this.time.now; SFX.hit(); 
        } 
        this.applyDamage(enemy, dmg); 
    }

    private spawnBoss(waveMin: number) {
        SFX.alarm(); let cam = this.cameras.main;
        let t = this.add.text(cam.scrollX + cam.centerX, cam.scrollY + cam.centerY - 150, '🚨 거대 로봇 청소기 접근 중! 🚨', { fontFamily: 'OngleipParkDahyeon', fontSize: '48px', color: '#ff0000', stroke: '#fff', strokeThickness: 6 }).setOrigin(0.5).setDepth(300);
        this.tweens.add({ targets: t, alpha: 0, yoyo: true, repeat: 3, duration: 300, onComplete: () => t.destroy() });
        let ang = Phaser.Math.FloatBetween(0, Math.PI * 2), sx = this.player.x + Math.cos(ang) * 800, sy = this.player.y + Math.sin(ang) * 800;
        let boss = this.bosses.get(sx, sy, 'boss_vacuum');
        if (boss) { 
            boss.setActive(true).setVisible(true).enableBody(true, sx, sy, true, true).setTexture('boss_vacuum').clearTint(); 
            boss.setDisplaySize(180, 180); boss.isBoss = true; boss.hp = 1500 * waveMin; boss.baseSpeed = 75 + (waveMin * 5); 
        }
    }

    private collectBox(p: any, box: any) { box.disableBody(true, true); SFX.box(); this.enemies.getChildren().forEach((e: any) => { if (e.active) this.applyDamage(e, e.hp + 9999); }); this.stats.exp += (this.stats.level * 55) * 3; this.checkLvl(); this.updateUI(); }
    private collectGem(p: any, g: any) { g.disableBody(true, true); SFX.gem(); this.stats.exp += (12 * this.stats.expMultiplier); this.checkLvl(); this.updateUI(); }
    private collectCoin(p: any, c: any) { c.disableBody(true, true); SFX.coin(); this.stats.coinCount++; this.updateUI(); }
    private checkLvl() { let n = this.stats.level * 55; if (this.stats.exp >= n) { this.stats.exp -= n; this.stats.level++; this.showLevelUpUI(); return true; } return false; }

    private spawnEnemy() {
        if (this.enemies.countActive(true) >= 200) return; let wave = Math.floor(this.elapsedSeconds / 30), pool = ['monster_dust']; if (wave >= 1) pool.push('furball'); if (wave >= 2) pool.push('toy');
        for (let i = 0; i < 1 + Math.floor(wave / 2); i++) { 
            let ang = Phaser.Math.FloatBetween(0, Math.PI * 2), sx = this.player.x + Math.cos(ang) * 650, sy = this.player.y + Math.sin(ang) * 650; 
            let key = Phaser.Math.RND.pick(pool); 
            let e = this.enemies.get(sx, sy, key); 
            if (e) { 
                e.setActive(true).setVisible(true).enableBody(true, sx, sy, true, true).setTexture(key).clearTint().body.setVelocity(0, 0); 
                e.setDisplaySize(50, 50);
                let bHp = (key === 'toy' ? 120 : (key === 'furball' ? 18 : 30)); e.hp = bHp * (1 + wave * 0.25); e.baseSpeed = (key === 'furball' ? 110 : (key === 'toy' ? 40 : 65)) + wave * 4; e.setDepth(9); 
            } 
        }
    }

    private updateUI() {
        if (!this.timerText) return;
        let m = Math.floor(this.elapsedSeconds / 60).toString().padStart(2, '0'), s = (this.elapsedSeconds % 60).toString().padStart(2, '0');
        this.timerText.setText(`${m}:${s}`); this.levelText.setText(`Lv.${this.stats.level}`); this.coinTextUI.setText(`🪙 ${this.stats.coinCount.toLocaleString()}`);
        this.hpText.setText(`${Math.floor(this.stats.hp)} / ${this.stats.maxHp}`);
        
        let ratio = Math.max(0, this.stats.hp / this.stats.maxHp);
        this.hpBarFill.clear().fillStyle(ratio > 0.3 ? 0x00D97E : 0xFF5252).fillRoundedRect(16, 89, 178 * ratio, 12, 6);
        
        let expRatio = Math.max(0, this.stats.exp / (this.stats.level * 55));
        this.expBarFill.clear().fillStyle(0x3182F6).fillRoundedRect(16, 128, 178 * expRatio, 4, 2);
        
        this.skillIconsGroup.clear(true, true);
        let active = Object.entries(this.stats.skills).filter(([k, v]) => v > 0 || v === "MAX");
        active.forEach(([k, v], i) => { 
            let iconMap = { punch: '🐾', yarn: '🧶', fishbone: '🦴', hairball: '🔮', aspeed: '⚡', magnet: '🧲', regen: '🧼', defense: '🥫', exp: '💡' }; 
            let dv = v === "MAX" ? "★" : v; 
            let t = this.add.text(32 + (i * 38), 175, `${iconMap[k] || '❓'}${dv}`, { fontFamily: 'OngleipParkDahyeon', fontSize: '16px', color: '#fff' }).setScrollFactor(0).setDepth(101); 
            this.skillIconsGroup.add(t); 
        });
    }

    private showDamageText(x: number, y: number, d: number) { 
        let t = this.add.text(x, y - 20, d, { fontFamily: 'OngleipParkDahyeon', fontSize: '24px', color: '#ffeb3b', stroke: '#000', strokeThickness: 4 }).setDepth(12); 
        this.tweens.add({ targets: t, y: y - 65, alpha: 0, duration: 600, onComplete: () => t.destroy() }); 
    }
    
    private takeDamage(p: any, e: any) { 
        if (p.isInvincible) return; 
        SFX.hit(); 
        let dmg = e.isBoss ? 40 : 12; 
        this.stats.hp -= Math.max(1, dmg - this.stats.defense); 
        p.isInvincible = true; p.setTint(0xff0000); 
        this.cameras.main.shake(150, 0.015);
        if (this.stats.hp <= 0) { this.physics.pause(); this.isPaused = true; this.showGameOverUI(); } 
        this.time.delayedCall(500, () => { p.isInvincible = false; p.clearTint(); }); 
    }

    private showGameOverUI() {
        this.isDragging = false; this.joystickBase.setVisible(false); this.joystickThumb.setVisible(false);
        let cam = this.cameras.main;
        let container = this.add.container(cam.centerX, cam.centerY).setDepth(300).setScrollFactor(0);
        let bg = this.add.rectangle(0, 0, cam.width, cam.height, 0x000000, 0.75).setInteractive();
        let panel = this.add.graphics().fillStyle(0xffffff, 0.15).fillRoundedRect(-200, -150, 400, 300, 24).lineStyle(2, 0xffffff, 0.3).strokeRoundedRect(-200, -150, 400, 300, 24);
        let t1 = this.add.text(0, -90, '💀 게임 오버 💀', { fontFamily: 'OngleipParkDahyeon', fontSize: '42px', color: '#FF5252' }).setOrigin(0.5);
        let t2 = this.add.text(0, -30, `생존 시간: ${Math.floor(this.elapsedSeconds / 60)}분 ${this.elapsedSeconds % 60}초\n도달 레벨: Lv.${this.stats.level}`, { fontFamily: 'OngleipParkDahyeon', fontSize: '22px', color: '#fff', align: 'center' }).setOrigin(0.5);
        let t3 = this.add.text(0, 30, `획득한 츄르 코인: +🪙 ${this.stats.coinCount}`, { fontFamily: 'OngleipParkDahyeon', fontSize: '24px', color: '#FFD700' }).setOrigin(0.5);
        let btnBg = this.add.graphics().fillStyle(0x3182F6).fillRoundedRect(-120, 70, 240, 56, 16);
        let btnText = this.add.text(0, 98, '로비로 돌아가기', { fontFamily: 'OngleipParkDahyeon', fontSize: '24px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        container.add([bg, panel, t1, t2, t3, btnBg, btnText]);

        const btnZone = this.add.rectangle(cam.centerX, cam.centerY + 98, 240, 56, 0, 0.01)
            .setOrigin(0.5).setDepth(1001).setScrollFactor(0).setInteractive({ useHandCursor: true });

        const onResize = (gs: { width: number, height: number }) => { 
            if (container.active) {
                container.setPosition(gs.width / 2, gs.height / 2); 
                bg.setSize(gs.width, gs.height); 
                btnZone.setPosition(gs.width / 2, gs.height / 2 + 98);
            }
        };
        this.scale.on('resize', onResize);
        
        this.events.once('shutdown', () => {
            this.scale.off('resize', onResize);
            if (btnZone) btnZone.destroy();
        });
        
        btnZone.on('pointerdown', () => { 
            globalState.coins += this.stats.coinCount; saveGameData(); 
            this.scale.off('resize', onResize);
            btnZone.destroy();
            this.scene.start('LobbyScene'); 
        });
    }

    private showLevelUpUI() {
        this.isPaused = true; this.physics.pause(); SFX.levelUp();
        this.isDragging = false; this.joystickBase.setVisible(false); this.joystickThumb.setVisible(false);
        let cam = this.cameras.main;
        let main = this.add.container(cam.centerX, cam.centerY).setDepth(2000).setScrollFactor(0);
        let bg = this.add.rectangle(0, 0, cam.width, cam.height, 0x000000, 0.75).setInteractive();
        let title = this.add.text(0, -230, '🐾 레벨 업! 능력을 고르라냥 🐾', { fontFamily: 'OngleipParkDahyeon', fontSize: '36px', color: '#FFD700' }).setOrigin(0.5);
        main.add([bg, title]);

        let hitZones: Phaser.GameObjects.Rectangle[] = [];

        const onResize = (gs: { width: number, height: number }) => { 
            if (main.active) {
                main.setPosition(gs.width / 2, gs.height / 2); 
                bg.setSize(gs.width, gs.height); 
                hitZones.forEach((hz, i) => {
                    hz.setPosition(gs.width / 2, gs.height / 2 + (-70 + i * 125));
                });
            }
        };
        this.scale.on('resize', onResize);

        this.events.once('shutdown', () => {
            this.scale.off('resize', onResize);
            hitZones.forEach(hz => hz.destroy());
        });

        let opts = this.getAvailableSkills();
        opts.forEach((opt, idx) => {
            let cur = opt.isConsumable ? 0 : (this.stats.skills[opt.key] || 0);
            let evo = !opt.isConsumable && cur >= 5 && opt.evo;
            let cardY = -70 + (idx * 125);
            let cBg = this.add.graphics().fillStyle(evo ? 0xffa000 : 0x000000, 0.5).fillRoundedRect(-190, -55, 380, 110, 20).lineStyle(2, evo ? 0xFFD700 : 0xffffff, 0.4).strokeRoundedRect(-190, -55, 380, 110, 20);
            let label = opt.isConsumable ? opt.title : (evo ? `[최종진화] ${opt.evo}` : `${opt.title} (Lv.${cur}->${cur + 1})`);
            let card = this.add.container(0, cardY, [cBg, this.add.text(-105, -25, label, { fontFamily: 'OngleipParkDahyeon', fontSize: '24px', color: '#fff' }).setOrigin(0, 0.5), this.add.text(-105, 15, evo ? '궁극의 힘을 해방합니다!' : opt.desc, { fontFamily: 'OngleipParkDahyeon', fontSize: '16px', color: '#eee', wordWrap: { width: 280 } }).setOrigin(0, 0.5), this.add.text(-145, 0, opt.icon, { fontSize: '48px' }).setOrigin(0.5)]);
            main.add(card);
            
            let hit = this.add.rectangle(cam.centerX, cam.centerY + cardY, 380, 110, 0, 0.01)
                .setDepth(2001).setScrollFactor(0).setInteractive({ useHandCursor: true });
            hitZones.push(hit);

            hit.on('pointerdown', () => { 
                if (evo) SFX.evo(); else SFX.meow(); 
                this.applySkill(opt.key, evo, opt.isConsumable); 
                this.scale.off('resize', onResize); 
                hitZones.forEach(hz => hz.destroy());
                main.destroy(); 
                if (!this.checkLvl()) { this.isPaused = false; this.physics.resume(); } 
                this.updateUI(); 
            });
        });
    }

    private applySkill(key: string, isEvo: boolean, isConsumable: boolean) {
        if (isConsumable) { if (key === 'hp_max') { this.stats.maxHp += 30; this.stats.hp = this.stats.maxHp; } if (key === 'hp_heal') { this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 50); } return; }
        if (this.stats.skills[key] === "MAX") return;
        if (isEvo) {
            this.stats.skills[key] = "MAX";
            switch (key) {
                case 'punch': this.stats.isPunchEvo = true; break;
                case 'aspeed': this.stats.attackCooldown *= 0.5; break;
                case 'yarn': this.stats.isYarnEvo = true; this.stats.yarnDamage *= 2.5; this.yarns.getChildren().forEach((y: any) => y.setTexture('yarn_evo')); break;
                case 'fishbone': this.stats.fishBoneDamage *= 2.8; this.stats.fishBoneCount += 3; break;
                case 'hairball': this.stats.isHairballEvo = true; break;
                case 'magnet': this.stats.magnetRange += 300; break;
                case 'regen': this.stats.hpRegen += 4; break;
                case 'defense': this.stats.defense += 8; break;
                case 'exp': this.stats.expMultiplier += 1.0; break;
            } return;
        }
        this.stats.skills[key]++;
        switch (key) { case 'punch': this.stats.attackDamage += 10; break; case 'aspeed': this.stats.attackCooldown *= 0.85; break; case 'yarn': this.stats.yarnCount++; this.yarns.clear(true, true); for (let i = 0; i < this.stats.yarnCount; i++) this.yarns.add(this.physics.add.sprite(this.player.x, this.player.y, this.stats.isYarnEvo ? 'yarn_evo' : 'yarn').setDepth(11).setDisplaySize(35, 35)); break; case 'fishbone': this.stats.fishBoneCount++; break; case 'hairball': this.stats.hairballLevel++; this.stats.hairballDamage += 15; break; case 'magnet': this.stats.magnetRange += 80; break; case 'regen': this.stats.hpRegen += 1; break; case 'defense': this.stats.defense += 3; break; case 'exp': this.stats.expMultiplier += 0.2; break; }
    }

    private getAvailableSkills() {
        let active = 0; for (let k in this.stats.skills) { if (this.stats.skills[k] > 0 || this.stats.skills[k] === "MAX") active++; }
        let pool = [{ key: 'punch', title: '강력한 앞발', desc: '냥냥펀치 데미지 +10', icon: '🐾', evo: '황금 대왕 펀치' }, { key: 'aspeed', title: '분노의 발길질', desc: '공격 속도 +15%', icon: '⚡', evo: '빛의 발길질' }, { key: 'yarn', title: '털실 소환', desc: '회전하는 털실 +1', icon: '🧶', evo: '블랙홀 가시 털실' }, { key: 'fishbone', title: '생선 가시', desc: '관통하는 부메랑 +1', icon: '🦴', evo: '고대 거대 고래뼈' }, { key: 'hairball', title: '마법 털뭉치', desc: '유도탄 데미지 +15', icon: '🔮', evo: '융단 폭격 털뭉치' }, { key: 'magnet', title: '캣닢 레이더', desc: '아이템 획득 범위 +80', icon: '🧲', evo: '초대형 캣닢 블랙홀' }, { key: 'regen', title: '그루밍', desc: '초당 체력 회복량 +1', icon: '🧼', evo: '무아지경 그루밍' }, { key: 'defense', title: '튼튼한 참치캔', desc: '받는 피해 -3', icon: '🥫', evo: '티타늄 참치캔' }, { key: 'exp', title: '호기심 가득', desc: '경험치 획득량 +20%', icon: '💡', evo: '우주적 깨달음' }];
        let cons = [{ key: 'hp_max', title: '특제 연어 츄르', desc: '최대 체력 +30 및 전체 회복', icon: '🐟', isConsumable: true }, { key: 'hp_heal', title: '바삭바삭 스낵', desc: '체력 50 회복', icon: '🍗', isConsumable: true }];
        let avail = pool.filter(o => { let lv = this.stats.skills[o.key]; return lv !== "MAX" && (lv > 0 || active < 5); });
        return Phaser.Utils.Array.Shuffle(avail.concat(cons)).slice(0, 3);
    }
}
