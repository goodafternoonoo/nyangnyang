// @ts-nocheck
import Phaser from 'phaser';
import { globalState, upgradeConfig } from '../state';
import { saveGameData } from '../firebase';
import { SFX } from '../audio';

export default class LobbyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LobbyScene' });
    }

    preload() {
        if (this.textures.exists('wood_floor')) return;

        let wood = this.make.graphics({ x: 0, y: 0, add: false });
        wood.fillStyle(0x795548).fillRect(0, 0, 100, 100).lineStyle(3, 0x5D4037).strokeRect(0, 0, 100, 100);
        wood.lineStyle(2, 0x6D4C41, 0.8).lineBetween(33, 0, 33, 100).lineBetween(66, 0, 66, 100);
        wood.fillStyle(0x3E2723).fillCircle(16, 10, 2).fillCircle(16, 90, 2).fillCircle(84, 10, 2).fillCircle(84, 90, 2);
        wood.generateTexture('wood_floor', 100, 100);

        let stain = this.make.graphics({ x: 0, y: 0, add: false });
        stain.fillStyle(0x4E342E, 0.2).fillEllipse(30, 30, 30, 20);
        stain.generateTexture('stain', 60, 60);

        let cat = this.make.graphics({ x: 0, y: 0, add: false });
        cat.fillStyle(0x000000, 0.3).fillEllipse(25, 48, 30, 10);
        cat.lineStyle(5, 0x8D5524, 1);
        cat.beginPath().moveTo(25, 38).lineTo(42, 35).lineTo(48, 22).strokePath();
        cat.fillStyle(0x8D5524).fillTriangle(8, 18, 20, 2, 28, 18).fillTriangle(42, 18, 30, 2, 22, 18);
        cat.fillStyle(0xF8BBD0).fillTriangle(12, 16, 20, 6, 26, 16).fillTriangle(38, 16, 30, 6, 24, 16);
        cat.fillStyle(0xC17753).fillEllipse(25, 30, 38, 32);
        cat.fillStyle(0xE6A57A).fillEllipse(25, 34, 20, 18);
        cat.fillStyle(0x212121).fillCircle(17, 26, 3.5).fillCircle(33, 26, 3.5);
        cat.fillStyle(0xFFFFFF).fillCircle(18, 24, 1.5).fillCircle(34, 24, 1.5);
        cat.fillStyle(0xFF77A9).fillTriangle(23, 31, 27, 31, 25, 33.5);
        cat.lineStyle(1.5, 0x5D4037, 1).beginPath().moveTo(25, 33.5).lineTo(21, 36).moveTo(25, 33.5).lineTo(29, 36).strokePath();
        cat.lineStyle(1, 0xFFFFFF, 0.8).beginPath().moveTo(15, 32).lineTo(2, 30).moveTo(15, 34).lineTo(4, 35).moveTo(35, 32).lineTo(48, 30).moveTo(35, 34).lineTo(46, 35).strokePath();
        cat.generateTexture('yulmu', 50, 50);

        let dust = this.make.graphics({ x: 0, y: 0, add: false });
        dust.fillStyle(0x78909C);
        for (let i = 0; i < 8; i++) { let a = (Math.PI / 4) * i; dust.fillCircle(24 + Math.cos(a) * 10, 26 + Math.sin(a) * 10, 10); }
        dust.fillCircle(24, 26, 14);
        dust.lineStyle(3, 0x212121, 1).beginPath().moveTo(16, 22).lineTo(20, 25).lineTo(16, 28).strokePath().beginPath().moveTo(32, 22).lineTo(28, 25).lineTo(32, 28).strokePath();
        dust.generateTexture('dust', 48, 48);

        let fur = this.make.graphics({ x: 0, y: 0, add: false });
        fur.fillStyle(0x37474F);
        for (let i = 0; i < 12; i++) { let a = (Math.PI / 6) * i; fur.fillTriangle(24, 26, 24 + Math.cos(a - 0.2) * 18, 26 + Math.sin(a - 0.2) * 18, 24 + Math.cos(a + 0.2) * 18, 26 + Math.sin(a + 0.2) * 18); }
        fur.fillCircle(24, 26, 14);
        fur.fillStyle(0xFFEE58).fillCircle(18, 24, 3).fillCircle(30, 24, 3);
        fur.generateTexture('furball', 48, 48);

        let toy = this.make.graphics({ x: 0, y: 0, add: false });
        toy.fillStyle(0x8D6E63).fillRoundedRect(16, 14, 24, 28, 4);
        toy.fillStyle(0x212121).fillRect(20, 20, 16, 8);
        toy.fillStyle(0xFF5252).fillCircle(24, 24, 2.5).fillCircle(32, 24, 2.5);
        toy.fillStyle(0x9E9E9E).fillRect(40, 24, 6, 4).fillCircle(46, 26, 4);
        toy.generateTexture('toy', 56, 56);

        let vacuum = this.make.graphics({ x: 0, y: 0, add: false });
        vacuum.fillStyle(0x1F1F1F).fillCircle(50, 50, 45);
        vacuum.lineStyle(6, 0x424242).strokeCircle(50, 50, 42);
        vacuum.fillStyle(0x424242).fillCircle(50, 50, 25);
        vacuum.fillStyle(0xFF3D00).fillCircle(50, 30, 6);
        vacuum.fillStyle(0x00E676).fillRect(35, 65, 30, 6);
        vacuum.generateTexture('boss_vacuum', 100, 100);

        let box = this.make.graphics({ x: 0, y: 0, add: false });
        box.fillStyle(0x8D6E63).fillRect(10, 15, 40, 30);
        box.fillStyle(0x795548).fillRect(10, 10, 40, 15);
        box.fillStyle(0xFFCC80).fillRect(26, 10, 8, 35);
        box.generateTexture('treasure_box', 60, 60);

        let punch = this.make.graphics({ x: 0, y: 0, add: false });
        punch.fillStyle(0xFFFFFF).fillCircle(24, 28, 10).fillCircle(12, 14, 4).fillCircle(20, 10, 4).fillCircle(28, 10, 4).fillCircle(36, 14, 4);
        punch.generateTexture('punch', 48, 48);

        let gPunch = this.make.graphics({ x: 0, y: 0, add: false });
        gPunch.fillStyle(0xFFFFFF).fillCircle(40, 45, 18).fillCircle(20, 25, 7).fillCircle(33, 18, 7).fillCircle(47, 18, 7).fillCircle(60, 25, 7);
        gPunch.generateTexture('punch_evo', 80, 80);

        this.make.graphics({ x: 0, y: 0, add: false }).fillStyle(0x00BFA5).beginPath().moveTo(12, 2).lineTo(22, 12).lineTo(12, 22).lineTo(2, 12).fillPath().generateTexture('gem', 24, 24);

        let coinG = this.make.graphics({ x: 0, y: 0, add: false });
        coinG.fillStyle(0xFFD700).fillCircle(12, 12, 10).fillStyle(0xFFA000).fillCircle(12, 12, 6);
        coinG.generateTexture('coin', 24, 24);

        this.make.graphics({ x: 0, y: 0, add: false }).fillStyle(0xE91E63).fillCircle(20, 20, 16).generateTexture('yarn', 40, 40);
        this.make.graphics({ x: 0, y: 0, add: false }).fillStyle(0x212121).fillCircle(25, 25, 22).generateTexture('yarn_evo', 50, 50);
        this.make.graphics({ x: 0, y: 0, add: false }).lineStyle(3, 0xffffff).lineBetween(5, 15, 35, 15).lineBetween(10, 5, 10, 25).lineBetween(20, 5, 20, 25).lineBetween(30, 5, 30, 25).generateTexture('fishbone', 50, 30);
        this.make.graphics({ x: 0, y: 0, add: false }).fillStyle(0x03A9F4).fillCircle(16, 16, 16).generateTexture('hairball', 32, 32);
    }

    create() {
        let cam = this.cameras.main;
        let bgFloor = this.add.tileSprite(cam.centerX, cam.centerY, 3000, 3000, 'wood_floor');
        let bgDark = this.add.rectangle(cam.centerX, cam.centerY, 3000, 3000, 0x000000, 0.75);

        let uiContainer = this.add.container(cam.centerX, cam.centerY);

        uiContainer.add(this.add.text(0, -250, '우당탕탕 냥냥펀치', { fontFamily: 'OngleipParkDahyeon', fontSize: '64px', fill: '#FFD700', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5));
        
        let coinText = this.add.text(0, -180, `보유 츄르 코인: 🪙 ${globalState.coins}`, { fontFamily: 'OngleipParkDahyeon', fontSize: '28px', fill: '#fff' }).setOrigin(0.5);
        uiContainer.add(coinText);

        upgradeConfig.forEach((upg, index) => {
            let curLv = globalState.upgrades[upg.key] || 0;
            let cost = Math.floor(upg.baseCost * Math.pow(1.5, curLv));
            let isMax = curLv >= upg.maxLv;
            let yPos = -80 + (index * 65);

            uiContainer.add(this.add.graphics().fillStyle(0x2A2A35).fillRoundedRect(-210, yPos - 25, 420, 50, 10).lineStyle(2, 0x4a4a5a).strokeRoundedRect(-210, yPos - 25, 420, 50, 10));
            uiContainer.add(this.add.text(-190, yPos, `${upg.title} (Lv.${curLv}/${upg.maxLv})`, { fontFamily: 'OngleipParkDahyeon', fontSize: '20px', fill: '#fff' }).setOrigin(0, 0.5));
            uiContainer.add(this.add.text(-10, yPos, `효과: ${upg.effect}`, { fontFamily: 'OngleipParkDahyeon', fontSize: '15px', fill: '#ccc' }).setOrigin(0, 0.5));

            if (!isMax) {
                let canAfford = globalState.coins >= cost;
                uiContainer.add(this.add.graphics().fillStyle(canAfford ? 0x00E676 : 0x555555).fillRoundedRect(110, yPos - 18, 80, 36, 8));
                let costText = this.add.text(150, yPos, `🪙 ${cost}`, { fontFamily: 'OngleipParkDahyeon', fontSize: '18px', fill: '#fff' }).setOrigin(0.5);
                uiContainer.add(costText);
                let hitArea = this.add.rectangle(150, yPos, 80, 36, 0, 0).setInteractive({ useHandCursor: true });
                uiContainer.add(hitArea);
                hitArea.on('pointerdown', () => {
                    if (globalState.coins >= cost) {
                        globalState.coins -= cost;
                        globalState.upgrades[upg.key] = curLv + 1;
                        SFX.buy();
                        // Firebase 사용여부는 user 객체 ID 통해 넘겨야하지만 여기서는 일단 임시 uid 혹은 서버 로직에 의존
                        saveGameData('local-or-anon');
                        this.scene.restart();
                    } else {
                        SFX.hit();
                    }
                });
            } else {
                uiContainer.add(this.add.text(150, yPos, `MAX`, { fontFamily: 'OngleipParkDahyeon', fontSize: '22px', fill: '#FFD700' }).setOrigin(0.5));
            }
        });

        let btn = this.add.text(0, 230, '게임 시작', { fontFamily: 'OngleipParkDahyeon', fontSize: '32px', fill: '#fff', backgroundColor: '#FF4081', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        uiContainer.add(btn);
        btn.on('pointerdown', () => { SFX.meow(); this.scene.start('GameScene'); });

        this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
            let w = gameSize.width, h = gameSize.height;
            bgFloor.setPosition(w/2, h/2);
            bgDark.setPosition(w/2, h/2);
            uiContainer.setPosition(w/2, h/2);
        }, this);
    }
}
