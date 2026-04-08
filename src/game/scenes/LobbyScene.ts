import Phaser from 'phaser';
import { globalState } from '../state';
import { SFX } from '../audio';

export default class LobbyScene extends Phaser.Scene {
    private bgFloor!: Phaser.GameObjects.TileSprite;
    private bgDark!: Phaser.GameObjects.Rectangle;
    private lobbyPlayer!: Phaser.GameObjects.Sprite;
    private uiContainer!: Phaser.GameObjects.Container;
    private startHit!: Phaser.GameObjects.Rectangle;

    constructor() {
        super('LobbyScene');
    }

    preload() {
        // 모든 게임 에셋 로드 (중앙 집중 관리)
        this.load.image('wood_floor', 'assets/floor.png');
        this.load.image('yulmu', 'assets/player.png');
        this.load.image('monster_dust', 'assets/monster_dust.png');
        this.load.image('furball', 'assets/furball.png');
        this.load.image('toy', 'assets/toy.png');
        this.load.image('boss_vacuum', 'assets/boss_vacuum.png');
        this.load.image('coin', 'assets/coin.png');
        this.load.image('gem', 'assets/gem.png');
        this.load.image('treasure_box', 'assets/treasure_box.png');
        this.load.image('punch', 'assets/punch.png');
        this.load.image('punch_evo', 'assets/punch_evo.png');
        this.load.image('yarn', 'assets/yarn.png');
        this.load.image('yarn_evo', 'assets/yarn_evo.png');
        this.load.image('fishbone', 'assets/fishbone.png');
        this.load.image('hairball', 'assets/hairball.png');
    }

    create() {
        const cam = this.cameras.main;
        
        // 배경 설정
        this.bgFloor = this.add.tileSprite(cam.centerX, cam.centerY, cam.width * 2, cam.height * 2, 'wood_floor');
        this.bgDark = this.add.rectangle(cam.centerX, cam.centerY, cam.width * 2, cam.height * 2, 0x000000, 0.5);
        
        // 플레이어 캐릭터 프리뷰
        this.lobbyPlayer = this.add.sprite(cam.centerX, cam.centerY - 180, 'yulmu');
        this.lobbyPlayer.setDisplaySize(180, 180);
        this.tweens.add({
            targets: this.lobbyPlayer,
            y: cam.centerY - 200,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // UI 컨테이너 (토스 스타일 대시보드)
        this.uiContainer = this.add.container(cam.centerX, cam.centerY + 50);
        
        // 메인 패널 (글래스모피즘)
        const panel = this.add.graphics();
        panel.fillStyle(0xffffff, 0.1);
        panel.fillRoundedRect(-220, -150, 440, 450, 32);
        panel.lineStyle(2, 0xffffff, 0.2);
        panel.strokeRoundedRect(-220, -150, 440, 450, 32);
        this.uiContainer.add(panel);

        // 로고 및 제목
        const title = this.add.text(0, -110, '우당탕탕 냥냥펀치', {
            fontFamily: 'OngleipParkDahyeon',
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.uiContainer.add(title);

        const coinInfo = this.add.text(0, -65, `보유 츄르 코인: 🪙 ${globalState.coins.toLocaleString()}`, {
            fontFamily: 'OngleipParkDahyeon',
            fontSize: '20px',
            color: '#FFD700'
        }).setOrigin(0.5);
        this.uiContainer.add(coinInfo);

        // 업그레이드 섹션
        const upgrades = [
            { key: 'hp', title: '체력 강화', icon: '❤️', color: '#FF5252' },
            { key: 'damage', title: '공격력 강화', icon: '⚔️', color: '#FF9800' },
            { key: 'speed', title: '이동속도', icon: '👟', color: '#4CAF50' },
            { key: 'magnet', title: '자석 범위', icon: '🧲', color: '#3182F6' }
        ];

        upgrades.forEach((u, i) => {
            const yPos = 10 + (i * 65);
            const lv = globalState.upgrades[u.key];
            const cost = (lv + 1) * 50;
            
            // 업그레이드 항목 라인
            const row = this.add.container(0, yPos);
            row.add(this.add.text(-180, 0, `${u.icon} ${u.title}`, { fontFamily: 'OngleipParkDahyeon', fontSize: '18px', color: '#ffffff' }).setOrigin(0, 0.5));
            row.add(this.add.text(40, 0, `Lv.${lv}`, { fontFamily: 'OngleipParkDahyeon', fontSize: '18px', color: '#B0B8C1' }).setOrigin(0, 0.5));
            
            if (lv < 10) {
                const buyBtn = this.add.container(130, 0);
                const btnBg = this.add.graphics();
                btnBg.fillStyle(0x3182F6, 0.2).fillRoundedRect(0, -18, 75, 36, 10);
                const btnText = this.add.text(37.5, 0, `🪙${cost}`, { fontFamily: 'OngleipParkDahyeon', fontSize: '14px', color: '#3182F6', fontStyle: 'bold' }).setOrigin(0.5);
                buyBtn.add([btnBg, btnText]);
                
                const hit = this.add.rectangle(130 + 37.5, yPos, 75, 36, 0, 0.01).setInteractive({ useHandCursor: true });
                hit.on('pointerdown', () => {
                    if (globalState.coins >= cost) {
                        globalState.coins -= cost;
                        globalState.upgrades[u.key]++;
                        SFX.coin();
                        this.scene.restart();
                    } else {
                        this.cameras.main.shake(100, 0.005);
                        SFX.hit();
                    }
                });
                row.add(buyBtn);
            } else {
                row.add(this.add.text(147.5, 0, `MAX`, { fontFamily: 'OngleipParkDahyeon', fontSize: '18px', color: '#3182F6', fontStyle: 'bold' }).setOrigin(0.5));
            }
            this.uiContainer.add(row);
        });

        // 하단 시작 버튼
        const startBtnGroup = this.add.container(0, 310);
        const startBtnBg = this.add.graphics().fillStyle(0x3182F6).fillRoundedRect(-180, -35, 360, 70, 24);
        const startText = this.add.text(0, 0, '게임 시작하기', {
            fontFamily: 'OngleipParkDahyeon',
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        startBtnGroup.add([startBtnBg, startText]);
        this.uiContainer.add(startBtnGroup);
        
        this.startHit = this.add.rectangle(cam.centerX, cam.centerY + 360, 360, 70, 0, 0).setInteractive({ useHandCursor: true });
        this.startHit.on('pointerdown', () => { 
            this.tweens.add({ targets: startBtnGroup, scale: 0.95, duration: 100, yoyo: true });
            SFX.meow(); 
            this.scene.start('GameScene'); 
        });

        // 리사이즈 로직
        const onResize = (gameSize: Phaser.Structs.Size) => {
            const w = gameSize.width, h = gameSize.height;
            if (this.bgFloor) this.bgFloor.setPosition(w/2, h/2);
            if (this.bgDark) this.bgDark.setPosition(w/2, h/2);
            if (this.uiContainer) this.uiContainer.setPosition(w/2, h/2 + 50);
            if (this.lobbyPlayer) this.lobbyPlayer.setPosition(w/2, h/2 - 190);
            if (this.startHit) this.startHit.setPosition(w/2, h/2 + 360);
        };
        
        this.scale.on('resize', onResize);
        this.events.once('shutdown', () => {
            this.scale.off('resize', onResize);
        });
    }
}
