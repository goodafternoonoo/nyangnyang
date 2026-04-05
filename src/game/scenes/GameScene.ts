// @ts-nocheck
import Phaser from 'phaser';
import { globalState } from '../state';
import { SFX, resumeAudio } from '../audio';
import { saveGameData } from '../firebase';
        let player, cursors, keys, enemies, bosses, gems, boxes, yarns, fishbones, hairballs, punches, coins;
        let timerText, levelText, hpBarFill, hpText, expBarFill, coinTextUI;
        let skillIconsGroup, stats;
        let isPaused, elapsedSeconds, joystickBase, joystickThumb, isDragging = false, joystickVector = new Phaser.Math.Vector2(0, 0);
        let playerShadow, currentScene, game;
        export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
            
            create() {
                currentScene = this;
                initGameState();

                this.physics.world.setBounds(0, 0, 3000, 3000);
                this.add.tileSprite(1500, 1500, 3000, 3000, 'wood_floor').setDepth(0);
                for (let i = 0; i < 70; i++) this.add.image(Phaser.Math.Between(50, 2950), Phaser.Math.Between(50, 2950), 'stain').setDepth(1);

                playerShadow = this.add.ellipse(1500, 1525, 40, 15, 0x000000, 0.3).setDepth(9);
                player = this.physics.add.sprite(1500, 1500, 'yulmu').setDepth(10);
                player.body.setSize(24, 24).setOffset(13, 16);
                player.setCollideWorldBounds(true);

                this.cameras.main.startFollow(player).setBounds(0, 0, 3000, 3000);

                setupGroups(this);
                setupUI(this);
                setupInput(this);

                this.time.addEvent({ delay: 1000, callback: handleGameTick, callbackScope: this, loop: true });
                this.physics.add.overlap(player, gems, collectGem, null, this);
                this.physics.add.overlap(player, coins, collectCoin, null, this);
                this.physics.add.overlap(player, boxes, collectBox, null, this);
                this.physics.add.collider(player, enemies, takeDamage, null, this);
                this.physics.add.collider(player, bosses, takeDamage, null, this);
                this.physics.add.overlap(enemies, [yarns, fishbones, hairballs], hitByWeapon, null, this);
                this.physics.add.overlap(bosses, [yarns, fishbones, hairballs], hitByWeapon, null, this);

                updateUI();
            }
            update(time: number, delta: number) {
                if (stats.hp <= 0 || isPaused) return;
                handlePlayerMovement(time);
                handleEnemyMovement(this, time);
                handleWeapons(this, time, delta); // 🐛 delta 값을 사용하도록 수정됨
                handleItems(this);
                updateUI();
            }
        }

        function initGameState() {
            let hpLv = globalState.upgrades.hp, spdLv = globalState.upgrades.speed, dmgLv = globalState.upgrades.damage, magLv = globalState.upgrades.magnet;
            let baseMaxHp = 100 + (hpLv * 10), baseSpeed = 160 + (spdLv * 10), baseDmg = 30 + (dmgLv * 5), baseMagnet = 160 + (magLv * 20);

            stats = {
                hp: baseMaxHp, maxHp: baseMaxHp, exp: 0, level: 1, speed: baseSpeed,
                attackRange: 140, attackDamage: baseDmg, attackCooldown: 850, attackScale: 1,
                yarnCount: 0, yarnDamage: 22, magnetRange: baseMagnet, expMultiplier: 1.0, defense: 0, hpRegen: 0, knockbackMult: 1.0,
                fishBoneCount: 0, fishBoneDamage: 35, hairballLevel: 0, hairballDamage: 25,
                skills: { punch: 1, aspeed: 0, yarn: 0, fishbone: 0, hairball: 0, magnet: 0, regen: 0, defense: 0, exp: 0 },
                isPunchEvo: false, isYarnEvo: false, isHairballEvo: false, bossSpawns: [], coinCount: 0,
                timers: { punch: 0, hairball: 0, fishbone: 0 } // 🐛 시간 점프(Time Jump) 버그 수정을 위한 내부 타이머
            }
            isPaused = false; elapsedSeconds = 0;
            isDragging = false; joystickVector.set(0, 0);
        }

        function setupGroups(scene) {
            enemies = scene.physics.add.group(); bosses = scene.physics.add.group(); gems = scene.physics.add.group();
            coins = scene.physics.add.group(); boxes = scene.physics.add.group(); yarns = scene.physics.add.group();
            fishbones = scene.physics.add.group(); hairballs = scene.physics.add.group(); punches = scene.add.group();
        }

        function setupUI(scene) {
            scene.add.graphics().setScrollFactor(0).setDepth(100).fillStyle(0x000000, 0.5).fillRoundedRect(10, 10, 220, 155, 12);
            timerText = scene.add.text(25, 22, '⏱ 00:00', { fontFamily: 'OngleipParkDahyeon', fontSize: '20px', fill: '#fff' }).setScrollFactor(0).setDepth(101);
            levelText = scene.add.text(140, 22, 'Lv.1', { fontFamily: 'OngleipParkDahyeon', fontSize: '20px', fill: '#FFD700' }).setScrollFactor(0).setDepth(101);
            coinTextUI = scene.add.text(25, 48, '🪙 0', { fontFamily: 'OngleipParkDahyeon', fontSize: '18px', fill: '#FFD700' }).setScrollFactor(0).setDepth(101);
            scene.add.graphics().setScrollFactor(0).setDepth(100).fillStyle(0x000000, 0.6).fillRoundedRect(20, 75, 190, 18, 9).fillRoundedRect(20, 100, 190, 8, 4);
            hpBarFill = scene.add.graphics().setScrollFactor(0).setDepth(101); expBarFill = scene.add.graphics().setScrollFactor(0).setDepth(101);
            hpText = scene.add.text(115, 84, '100 / 100', { fontFamily: 'OngleipParkDahyeon', fontSize: '13px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
            skillIconsGroup = scene.add.group();
        }

        function setupInput(scene) {
            cursors = scene.input.keyboard.createCursorKeys(); keys = scene.input.keyboard.addKeys('W,A,S,D');
            joystickBase = scene.add.circle(0, 0, 60, 0x000000, 0.3).setScrollFactor(0).setDepth(99).setVisible(false);
            joystickThumb = scene.add.circle(0, 0, 30, 0xffffff, 0.5).setScrollFactor(0).setDepth(99).setVisible(false);
            scene.input.on('pointerdown', p => { resumeAudio(); if (isPaused) return; isDragging = true; joystickBase.setPosition(p.x, p.y).setVisible(true); joystickThumb.setPosition(p.x, p.y).setVisible(true); });
            scene.input.on('pointermove', p => { if (isPaused) return; if (isDragging) { let a = Phaser.Math.Angle.Between(joystickBase.x, joystickBase.y, p.x, p.y); let d = Math.min(60, Phaser.Math.Distance.Between(joystickBase.x, joystickBase.y, p.x, p.y)); joystickThumb.x = joystickBase.x + Math.cos(a) * d; joystickThumb.y = joystickBase.y + Math.sin(a) * d; joystickVector.set(Math.cos(a), Math.sin(a)); } });
            scene.input.on('pointerup', () => { if (isPaused) return; isDragging = false; joystickBase.setVisible(false); joystickThumb.setVisible(false); joystickVector.set(0, 0); });

            // 🐛 모바일 화면 밖 이탈(Stuck) 방지 이벤트 추가
            scene.input.on('pointerupoutside', () => { if (isPaused) return; isDragging = false; joystickBase.setVisible(false); joystickThumb.setVisible(false); joystickVector.set(0, 0); });
        }

        function handleGameTick() {
            if (isPaused || stats.hp <= 0) return; // 타이머도 일시정지 상태 확인
            elapsedSeconds++; stats.hp = Math.min(stats.maxHp, stats.hp + stats.hpRegen);
            let curMin = Math.floor(elapsedSeconds / 60);
            if (curMin > 0 && elapsedSeconds % 60 === 0 && !stats.bossSpawns.includes(curMin)) { stats.bossSpawns.push(curMin); spawnBoss(curMin); }
            spawnEnemy(); updateUI();
        }

        function handlePlayerMovement(time) {
            player.setVelocity(0); let mx = 0, my = 0;
            if (cursors.left.isDown || keys.A.isDown) mx = -1; else if (cursors.right.isDown || keys.D.isDown) mx = 1;
            if (cursors.up.isDown || keys.W.isDown) my = -1; else if (cursors.down.isDown || keys.S.isDown) my = 1;
            if (isDragging) player.setVelocity(joystickVector.x * stats.speed, joystickVector.y * stats.speed);
            else if (mx !== 0 || my !== 0) { let v = new Phaser.Math.Vector2(mx, my).normalize(); player.setVelocity(v.x * stats.speed, v.y * stats.speed); }
            player.setFlipX(player.body.velocity.x < 0);
            if (playerShadow) { playerShadow.x = player.x; playerShadow.y = player.y + 26; }
            if (player.body.velocity.length() > 0) player.setRotation(Math.sin(time / 80) * 0.15); else player.setRotation(0);
        }

        function handleEnemyMovement(scene, time) {
            enemies.getChildren().forEach((e, i) => { if (e.active) { if (time > (e.knockbackUntil || 0)) scene.physics.moveToObject(e, player, e.baseSpeed || 60); e.setFlipX(e.body.velocity.x < 0); e.setRotation(Math.sin(time / 100 + i) * 0.15); } });
            bosses.getChildren().forEach((b, i) => { if (b.active) { if (time > (b.knockbackUntil || 0)) scene.physics.moveToObject(b, player, b.baseSpeed || 50); b.setFlipX(b.body.velocity.x < 0); b.setRotation(Math.sin(time / 50) * 0.1); } });
        }

        function handleWeapons(scene, time, delta) {
            // 🐛 레벨업 창 닫을 때 무기 폭주(Time Jump)를 막기 위해 절대 시간이 아닌 Delta(프레임시간) 누적 사용
            stats.timers.punch += delta;
            stats.timers.hairball += delta;
            stats.timers.fishbone += delta;

            if (stats.timers.punch >= stats.attackCooldown) {
                performNyangPunch(scene);
                stats.timers.punch = 0;
            }
            if ((stats.skills.hairball > 0 || stats.skills.hairball === "MAX") && stats.timers.hairball >= 1300) {
                fireHairball(scene);
                stats.timers.hairball = 0;
            }
            if ((stats.skills.fishbone > 0 || stats.skills.fishbone === "MAX") && stats.timers.fishbone >= 2600) {
                fireFishBone(scene);
                stats.timers.fishbone = 0;
            }

            if (stats.skills.yarn > 0 || stats.skills.yarn === "MAX") {
                yarns.getChildren().forEach((y, i) => {
                    let a = (time * (stats.isYarnEvo ? 0.007 : 0.0035)) + ((Math.PI * 2 / stats.yarnCount) * i);
                    let rad = stats.isYarnEvo ? 140 : 95;
                    y.x = player.x + Math.cos(a) * rad; y.y = player.y + Math.sin(a) * rad;
                    y.rotation += 0.007 * delta;
                });
            }

            fishbones.getChildren().forEach(fb => {
                if (!fb.active) return;
                if (!fb.isReturning) {
                    if (fb.life > 0) fb.life -= delta; else { fb.isReturning = true; fb.body.velocity.set(0); }
                } else {
                    scene.physics.moveToObject(fb, player, 480);
                    if (Phaser.Math.Distance.Between(fb.x, fb.y, player.x, player.y) < 30) fb.disableBody(true, true);
                }
                fb.rotation += 0.015 * delta;
            });
        }

        function handleItems(scene) {
            gems.getChildren().forEach(g => { if (g.active && Phaser.Math.Distance.Between(player.x, player.y, g.x, g.y) < stats.magnetRange) scene.physics.moveToObject(g, player, 480); });
            coins.getChildren().forEach(c => { if (c.active && Phaser.Math.Distance.Between(player.x, player.y, c.x, c.y) < stats.magnetRange) scene.physics.moveToObject(c, player, 480); });
        }

        function performNyangPunch(scene) {
            let target = getNearestEnemy(stats.attackRange);
            if (target) {
                let angle = Phaser.Math.Angle.Between(player.x, player.y, target.x, target.y);
                let px = player.x + Math.cos(angle) * 55, py = player.y + Math.sin(angle) * 55;
                let key = stats.isPunchEvo ? 'punch_evo' : 'punch';

                let p = punches.get(px, py, key);
                if (p) {
                    scene.tweens.killTweensOf(p);
                    p.setActive(true).setVisible(true).setPosition(px, py).setTexture(key).setRotation(angle + Math.PI / 2).setScale(stats.attackScale).setAlpha(1);
                    scene.tweens.add({ targets: p, scale: stats.attackScale + 0.6, alpha: 0, duration: 250, onComplete: () => p.setActive(false).setVisible(false) });

                    if (stats.isPunchEvo) {
                        SFX.evoPunch();
                        let all = enemies.getChildren().concat(bosses.getChildren());
                        all.forEach(e => { if (e.active && Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < 110) applyDamage(e, stats.attackDamage * 1.6); });
                    } else {
                        SFX.punch();
                        applyDamage(target, stats.attackDamage);
                    }
                }
            }
        }

        function getNearestEnemy(range) {
            let nearest = null; let minDist = range;
            let all = enemies.getChildren().concat(bosses.getChildren());
            all.forEach(e => { if (!e.active) return; let d = Phaser.Math.Distance.Between(player.x, player.y, e.x, e.y); if (d < minDist) { minDist = d; nearest = e; } });
            return nearest;
        }

        function fireHairball(scene) {
            let target = getNearestEnemy(650);
            if (target) {
                let count = stats.isHairballEvo ? 3 : 1;
                for (let i = 0; i < count; i++) { scene.time.delayedCall(i * 150, () => { let ct = getNearestEnemy(650); if (!ct) return; let hb = hairballs.get(player.x, player.y, 'hairball'); if (hb) { hb.setActive(true).setVisible(true).enableBody(true, player.x, player.y, true, true); scene.physics.moveToObject(hb, ct, 580); hb.damage = stats.hairballDamage; } }); }
            }
        }

        function fireFishBone(scene) {
            for (let i = 0; i < stats.fishBoneCount; i++) { let angle = (Math.PI * 2 / stats.fishBoneCount) * i + elapsedSeconds; let fb = fishbones.get(player.x, player.y, 'fishbone'); if (fb) { fb.setActive(true).setVisible(true).enableBody(true, player.x, player.y, true, true); fb.body.velocity.set(Math.cos(angle) * 380, Math.sin(angle) * 380); fb.isReturning = false; fb.life = 1300; fb.damage = stats.fishBoneDamage; } }
        }

        function applyDamage(enemy, damage) {
            if (!enemy.active) return; enemy.hp -= damage; enemy.setTint(0xff0000); enemy.scene.time.delayedCall(100, () => { if (enemy.active) enemy.clearTint(); });
            let ang = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
            let kb = (enemy.isBoss ? 20 : 300) * stats.knockbackMult; enemy.setVelocity(Math.cos(ang) * kb, Math.sin(ang) * kb); enemy.knockbackUntil = enemy.scene.time.now + (enemy.isBoss ? 50 : 200);
            showDamageText(enemy.scene, enemy.x, enemy.y, Math.floor(damage));
            if (enemy.hp <= 0) { if (enemy.isBoss) { let box = boxes.get(enemy.x, enemy.y, 'treasure_box'); if (box) box.setActive(true).setVisible(true).enableBody(true, enemy.x, enemy.y, true, true); for (let i = 0; i < 15; i++) { let cx = enemy.x + Phaser.Math.Between(-50, 50), cy = enemy.y + Phaser.Math.Between(-50, 50); let c = coins.get(cx, cy, 'coin'); if (c) c.setActive(true).setVisible(true).enableBody(true, cx, cy, true, true); } } else { if (Math.random() < 0.15) { let c = coins.get(enemy.x, enemy.y, 'coin'); if (c) c.setActive(true).setVisible(true).enableBody(true, enemy.x, enemy.y, true, true); } else { let g = gems.get(enemy.x, enemy.y, 'gem'); if (g) g.setActive(true).setVisible(true).enableBody(true, enemy.x, enemy.y, true, true); } } enemy.disableBody(true, true); }
        }

        function hitByWeapon(enemy, weapon) { if (!enemy.active || !weapon.active) return; let dmg = weapon.damage || stats.yarnDamage; let wType = weapon.texture.key; if (wType === 'hairball') { weapon.disableBody(true, true); SFX.punch(); } else { enemy.lastHitTimes = enemy.lastHitTimes || {}; if (enemy.lastHitTimes[wType] && weapon.scene.time.now < enemy.lastHitTimes[wType] + 300) return; enemy.lastHitTimes[wType] = weapon.scene.time.now; SFX.hit(); } applyDamage(enemy, dmg); }

        function spawnBoss(waveMin) {
            SFX.alarm(); let cam = currentScene.cameras.main;
            let t = currentScene.add.text(cam.scrollX + cam.centerX, cam.scrollY + cam.centerY - 150, '🚨 거대 로봇 청소기 접근 중! 🚨', { fontFamily: 'OngleipParkDahyeon', fontSize: '48px', fill: '#ff0000', stroke: '#fff', strokeThickness: 6 }).setOrigin(0.5).setDepth(300);
            currentScene.tweens.add({ targets: t, alpha: 0, yoyo: true, repeat: 3, duration: 300, onComplete: () => t.destroy() });
            let ang = Phaser.Math.FloatBetween(0, Math.PI * 2), sx = player.x + Math.cos(ang) * 800, sy = player.y + Math.sin(ang) * 800;
            let boss = bosses.get(sx, sy, 'boss_vacuum');
            if (boss) { boss.setActive(true).setVisible(true).enableBody(true, sx, sy, true, true).setTexture('boss_vacuum').clearTint(); boss.isBoss = true; boss.hp = 1500 * waveMin; boss.baseSpeed = 75 + (waveMin * 5); boss.body.setSize(80, 80).setOffset(10, 10); }
        }

        function collectBox(p, box) { box.disableBody(true, true); SFX.box(); enemies.getChildren().forEach(e => { if (e.active) applyDamage(e, e.hp + 9999); }); stats.exp += (stats.level * 55) * 3; checkLvl(p.scene); updateUI(); }
        function collectGem(p, g) { g.disableBody(true, true); SFX.gem(); stats.exp += (12 * stats.expMultiplier); checkLvl(p.scene); updateUI(); }
        function collectCoin(p, c) { c.disableBody(true, true); SFX.coin(); stats.coinCount++; updateUI(); }
        function checkLvl(scene) { let n = stats.level * 55; if (stats.exp >= n) { stats.exp -= n; stats.level++; showLevelUpUI(scene); return true; } return false; }

        function spawnEnemy() {
            if (enemies.countActive(true) >= 200) return; let wave = Math.floor(elapsedSeconds / 30), pool = ['dust']; if (wave >= 1) pool.push('furball'); if (wave >= 2) pool.push('toy');
            for (let i = 0; i < 1 + Math.floor(wave / 2); i++) { let ang = Phaser.Math.FloatBetween(0, Math.PI * 2), sx = player.x + Math.cos(ang) * 650, sy = player.y + Math.sin(ang) * 650; let key = Phaser.Math.RND.pick(pool); let e = enemies.get(sx, sy, key); if (e) { e.setActive(true).setVisible(true).enableBody(true, sx, sy, true, true).setTexture(key).clearTint().body.setVelocity(0, 0); let bHp = (key === 'toy' ? 120 : (key === 'furball' ? 18 : 30)); e.hp = bHp * (1 + wave * 0.25); e.baseSpeed = (key === 'furball' ? 110 : (key === 'toy' ? 40 : 65)) + wave * 4; e.setDepth(9); } }
        }

        function updateUI() {
            let m = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0'), s = (elapsedSeconds % 60).toString().padStart(2, '0');
            timerText.setText(`⏱ ${m}:${s}`); levelText.setText(`Lv.${stats.level}`); coinTextUI.setText(`🪙 ${stats.coinCount}`);
            hpText.setText(`${Math.floor(stats.hp)} / ${stats.maxHp}`);
            hpBarFill.clear().fillStyle(stats.hp / stats.maxHp > 0.3 ? 0x00E676 : 0xFF5252).fillRoundedRect(20, 75, 190 * (stats.hp / stats.maxHp), 18, 9);
            expBarFill.clear().fillStyle(0x00BCD4).fillRoundedRect(20, 100, 190 * (stats.exp / (stats.level * 55)), 8, 4);
            skillIconsGroup.clear(true, true);
            let active = Object.entries(stats.skills).filter(([k, v]) => v > 0 || v === "MAX");
            active.forEach(([k, v], i) => { let iconMap = { punch: '🐾', yarn: '🧶', fishbone: '🦴', hairball: '🔮', aspeed: '⚡', magnet: '🧲', regen: '🧼', defense: '🥫', exp: '💡' }; let dv = v === "MAX" ? "★" : v; let t = currentScene.add.text(25 + (i * 38), 125, `${iconMap[k] || '❓'}${dv}`, { fontFamily: 'OngleipParkDahyeon', fontSize: '15px', fill: '#fff' }).setScrollFactor(0).setDepth(101); skillIconsGroup.add(t); });
        }

        function showDamageText(s, x, y, d) { let t = s.add.text(x, y - 20, d, { fontFamily: 'OngleipParkDahyeon', fontSize: '22px', fill: '#ff0000', stroke: '#fff', strokeThickness: 4 }).setDepth(12); s.tweens.add({ targets: t, y: y - 65, alpha: 0, duration: 600, onComplete: () => t.destroy() }); }
        function takeDamage(p, e) { if (p.isInvincible) return; SFX.hit(); let dmg = e.isBoss ? 40 : 12; stats.hp -= Math.max(1, dmg - stats.defense); p.isInvincible = true; p.setTint(0xff0000); if (stats.hp <= 0) { p.scene.physics.pause(); isPaused = true; showGameOverUI(p.scene); } p.scene.time.delayedCall(500, () => { p.isInvincible = false; p.clearTint(); }); }

        function showGameOverUI(scene) {
            isDragging = false; joystickBase.setVisible(false); joystickThumb.setVisible(false); joystickVector.set(0, 0);

            let cam = scene.cameras.main;
            let container = scene.add.container(cam.centerX, cam.centerY).setDepth(300).setScrollFactor(0);
            let bg = scene.add.rectangle(0, 0, cam.width, cam.height, 0, 0.85);
            let t1 = scene.add.text(0, -80, '집사야 나 졸려...', { fontFamily: 'OngleipParkDahyeon', fontSize: '64px', fill: '#ff0000' }).setOrigin(0.5);
            let t2 = scene.add.text(0, 0, `획득한 츄르 코인: +🪙 ${stats.coinCount}`, { fontFamily: 'OngleipParkDahyeon', fontSize: '24px', fill: '#FFD700' }).setOrigin(0.5);
            let btn = scene.add.text(0, 80, '로비로 이동', { fontFamily: 'OngleipParkDahyeon', fontSize: '32px', fill: '#fff', backgroundColor: '#FF6B6B', padding: { x: 24, y: 12 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            
            container.add([bg, t1, t2, btn]);

            let resizeEvent = (gameSize) => {
                container.setPosition(gameSize.width / 2, gameSize.height / 2);
                bg.setSize(gameSize.width, gameSize.height);
            }
            scene.scale.on('resize', resizeEvent);

            btn.on('pointerdown', () => {
                globalState.coins += stats.coinCount;
                saveGameData(); // 💾 로비로 돌아갈 때 획득한 코인 클라우드에 영구 저장
                scene.scale.off('resize', resizeEvent);
                scene.scene.start('LobbyScene');
            });
        }

        // --- 레벨업 UI ---
        function showLevelUpUI(scene) {
            isPaused = true; scene.physics.pause(); SFX.levelUp();

            isDragging = false; joystickBase.setVisible(false); joystickThumb.setVisible(false); joystickVector.set(0, 0);

            let cam = scene.cameras.main;
            let mainContainer = scene.add.container(cam.centerX, cam.centerY).setDepth(200).setScrollFactor(0);
            
            let bg = scene.add.rectangle(0, 0, cam.width, cam.height, 0x000000, 0.75).setInteractive().setScrollFactor(0);
            let title = scene.add.text(0, -230, '🐾 레벨 업! 능력을 고르라냥 🐾', { fontFamily: 'OngleipParkDahyeon', fontSize: '32px', fill: '#FFD700', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
            mainContainer.add([bg, title]);

            let opts = getAvailableSkills();
            opts.forEach((opt, idx) => {
                let cur = opt.isConsumable ? 0 : (stats.skills[opt.key] || 0);
                let evo = !opt.isConsumable && cur >= 5 && opt.evo;
                let cardY = -60 + (idx * 115);
                let container = scene.add.container(0, cardY);
                let cardBg = scene.add.graphics().fillStyle(evo ? 0x4a3a10 : 0x2A2A35).fillRoundedRect(-180, -50, 360, 100, 16).lineStyle(4, evo ? 0xFFD700 : opt.color).strokeRoundedRect(-180, -50, 360, 100, 16);
                
                let label = opt.isConsumable ? opt.title : (evo ? `[최종진화] ${opt.evo}` : `${opt.title} (Lv.${cur}->${cur + 1})`);
                container.add([cardBg, scene.add.text(-100, -20, label, { fontFamily: 'OngleipParkDahyeon', fontSize: '22px', fill: evo ? '#FFD700' : '#fff' }).setOrigin(0, 0.5), scene.add.text(-100, 15, evo ? '궁극의 힘을 해방합니다!' : opt.desc, { fontFamily: 'OngleipParkDahyeon', fontSize: '15px', fill: '#ccc', wordWrap: { width: 260 } }).setOrigin(0, 0.5), scene.add.text(-140, 0, opt.icon, { fontSize: '45px' }).setOrigin(0.5)]);
                
                mainContainer.add(container);

                // 상위 컨테이너에 종속되지 않고 동일한 좌표계를 쓰는 가장 확실한 투명 버튼
                let hit = scene.add.rectangle(0, cardY, 360, 100, 0x000000, 0.01)
                    .setInteractive({ useHandCursor: true })
                    .setScrollFactor(0);
                mainContainer.add(hit);

                hit.on('pointerdown', () => {
                    if (evo) SFX.evo(); else SFX.meow();
                    applySkill(scene, opt.key, evo, opt.isConsumable);
                    scene.scale.off('resize', resizeEvent);
                    mainContainer.destroy();

                    if (!checkLvl(scene)) {
                        isPaused = false;
                        scene.physics.resume();
                    }
                    updateUI();
                });
            });

            let resizeEvent = (gameSize) => {
                mainContainer.setPosition(gameSize.width / 2, gameSize.height / 2);
                bg.setSize(gameSize.width, gameSize.height);
            }
            scene.scale.on('resize', resizeEvent);
        }

        function applySkill(scene, key, isEvo, isConsumable) {
            if (isConsumable) { if (key === 'hp_max') { stats.maxHp += 30; stats.hp = stats.maxHp; } if (key === 'hp_heal') { stats.hp = Math.min(stats.maxHp, stats.hp + 50); } return; }
            if (isEvo) {
                stats.skills[key] = "MAX";
                switch (key) {
                    case 'punch': stats.isPunchEvo = true; break;
                    case 'aspeed': stats.attackCooldown *= 0.5; break;
                    // 🐛 털실 진화 시 데미지 증폭 밸런스 패치
                    case 'yarn': stats.isYarnEvo = true; stats.yarnDamage *= 2.5; yarns.getChildren().forEach(y => y.setTexture('yarn_evo')); break;
                    case 'fishbone': stats.fishBoneDamage *= 2.8; stats.fishBoneCount += 3; break;
                    case 'hairball': stats.isHairballEvo = true; break;
                    case 'magnet': stats.magnetRange += 300; break;
                    case 'regen': stats.hpRegen += 4; break;
                    case 'defense': stats.defense += 8; break;
                    case 'exp': stats.expMultiplier += 1.0; break;
                } return;
            }
            stats.skills[key]++;
            switch (key) { case 'punch': stats.attackDamage += 10; break; case 'aspeed': stats.attackCooldown *= 0.85; break; case 'yarn': stats.yarnCount++; yarns.clear(true, true); for (let i = 0; i < stats.yarnCount; i++) yarns.add(scene.physics.add.sprite(player.x, player.y, stats.isYarnEvo ? 'yarn_evo' : 'yarn').setDepth(11)); break; case 'fishbone': stats.fishBoneCount++; break; case 'hairball': stats.hairballLevel++; stats.hairballDamage += 15; break; case 'magnet': stats.magnetRange += 80; break; case 'regen': stats.hpRegen += 1; break; case 'defense': stats.defense += 3; break; case 'exp': stats.expMultiplier += 0.2; break; }
        }

        function getAvailableSkills() {
            let active = 0; for (let k in stats.skills) { if (stats.skills[k] > 0 || stats.skills[k] === "MAX") active++; }
            let pool = [{ key: 'punch', title: '강력한 앞발', desc: '냥냥펀치 데미지 +10', icon: '🐾', color: 0xFF5252, evo: '황금 대왕 펀치' }, { key: 'aspeed', title: '분노의 발길질', desc: '공격 속도 +15%', icon: '⚡', color: 0xFFEB3B, evo: '빛의 발길질' }, { key: 'yarn', title: '털실 소환', desc: '회전하는 털실 +1', icon: '🧶', color: 0xFF69B4, evo: '블랙홀 가시 털실' }, { key: 'fishbone', title: '생선 가시', desc: '관통하는 부메랑 +1', icon: '🦴', color: 0xE0E0E0, evo: '고대 거대 고래뼈' }, { key: 'hairball', title: '마법 털뭉치', desc: '유도탄 데미지 +15', icon: '🔮', color: 0x03A9F4, evo: '융단 폭격 털뭉치' }, { key: 'magnet', title: '캣닢 레이더', desc: '아이템 획득 범위 +80', icon: '🧲', color: 0x4CAF50, evo: '초대형 캣닢 블랙홀' }, { key: 'regen', title: '그루밍', desc: '초당 체력 회복량 +1', icon: '🧼', color: 0xB3E5FC, evo: '무아지경 그루밍' }, { key: 'defense', title: '튼튼한 참치캔', desc: '받는 피해 -3', icon: '🥫', color: 0xB0BEC5, evo: '티타늄 참치캔' }, { key: 'exp', title: '호기심 가득', desc: '경험치 획득량 +20%', icon: '💡', color: 0xFFD700, evo: '우주적 깨달음' }];
            let cons = [{ key: 'hp_max', title: '특제 연어 츄르', desc: '최대 체력 +30 및 전체 회복', icon: '🐟', color: 0x00E676, isConsumable: true }, { key: 'hp_heal', title: '바삭바삭 스낵', desc: '현재 체력을 50 회복합니다.', icon: '🍗', color: 0xFF9800, isConsumable: true }];
            let avail = pool.filter(o => { let lv = stats.skills[o.key]; return lv !== "MAX" && (lv > 0 || active < 5); });
            return Phaser.Utils.Array.Shuffle(avail.concat(cons)).slice(0, 3);
        }

        // ---------------------------------------------------------
        // 엔진 시작 및 데이터 로드
        // ---------------------------------------------------------
