import Phaser from 'phaser';
import { globalState } from '../state';
import { SFX, BGM, resumeAudio, initAudioContext } from '../audio';
import { loginAnonymously, loadGameData, saveGameData } from '../firebase';

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
        
        // 오디오 시스템 초기화 (Phaser의 컨텍스트 공유)
        if ((this.sound as any).context) {
            initAudioContext((this.sound as any).context);
        }

        // 익명 로그인 및 데이터 로드 (최초 1회)
        if (!globalState.uid) {
            loginAnonymously().then(user => {
                if (user) {
                    loadGameData().then(success => {
                        if (success) {
                            this.scene.restart(); // 데이터 로드 후 화면 갱신
                        }
                    });
                }
            });
        }
        
        // BGM 시작 (브라우저 정책에 따라 첫 클릭 시 활성화될 수 있음)
        BGM.playLobby();

        // 오디오 컨텍스트 재개 (사용자 제스처 대응)
        this.input.once('pointerdown', () => {
            resumeAudio();
        });
        
        // 배경 설정 (리사이즈 대응을 위해 넉넉하게 설정)
        this.bgFloor = this.add.tileSprite(cam.centerX, cam.centerY, cam.width * 4, cam.height * 4, 'wood_floor');
        this.bgDark = this.add.rectangle(cam.centerX, cam.centerY, cam.width * 4, cam.height * 4, 0x000000, 0.5);
        
        // 플레이어 캐릭터 프리뷰 (위치를 높임)
        this.lobbyPlayer = this.add.sprite(cam.centerX, cam.centerY - 240, 'yulmu');
        this.lobbyPlayer.setDisplaySize(160, 160); // 크기 약간 줄임 (180 -> 160)
        
        this.tweens.add({
            targets: this.lobbyPlayer,
            y: '-=15',
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // UI 컨테이너 (토스 스타일 대시보드)
        this.uiContainer = this.add.container(cam.centerX, cam.centerY + 50);
        
        // 메인 패널 (높이 대폭 축소: 420 -> 360)
        const panel = this.add.graphics();
        panel.fillStyle(0xffffff, 0.1);
        panel.fillRoundedRect(-200, -130, 400, 360, 24);
        panel.lineStyle(2, 0xffffff, 0.2);
        panel.strokeRoundedRect(-200, -130, 400, 360, 24);
        this.uiContainer.add(panel);

        // 로고 및 제목 (크기 축소: 30px -> 26px)
        const title = this.add.text(0, -95, '우당탕탕 냥냥펀치', {
            fontFamily: 'OngleipParkDahyeon',
            fontSize: '26px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.uiContainer.add(title);

        const coinInfo = this.add.text(0, -60, `보유 츄르 코인: 🪙 ${globalState.coins.toLocaleString()}`, {
            fontFamily: 'OngleipParkDahyeon',
            fontSize: '16px',
            color: '#FFD700'
        }).setOrigin(0.5);
        this.uiContainer.add(coinInfo);

        // 업그레이드 섹션 (간격 대폭 축소: 58 -> 48)
        const upgrades = [
            { key: 'hp', title: '체력 강화', icon: '❤️', color: '#FF5252' },
            { key: 'damage', title: '공격력 강화', icon: '⚔️', color: '#FF9800' },
            { key: 'speed', title: '이동속도', icon: '👟', color: '#4CAF50' },
            { key: 'magnet', title: '자석 범위', icon: '🧲', color: '#3182F6' }
        ];

        upgrades.forEach((u, i) => {
            const yPos = -10 + (i * 48);
            const lv = globalState.upgrades[u.key] || 0;
            const cost = (lv + 1) * 50;
            
            const row = this.add.container(0, yPos);
            row.add(this.add.text(-160, 0, `${u.icon} ${u.title}`, { fontFamily: 'OngleipParkDahyeon', fontSize: '15px', color: '#ffffff' }).setOrigin(0, 0.5));
            row.add(this.add.text(40, 0, `Lv.${lv}`, { fontFamily: 'OngleipParkDahyeon', fontSize: '15px', color: '#B0B8C1' }).setOrigin(0, 0.5));
            
            if (lv < 10) {
                const buyBtn = this.add.container(110, 0);
                const btnBg = this.add.graphics();
                btnBg.fillStyle(0x3182F6, 0.2).fillRoundedRect(0, -14, 60, 28, 8);
                const btnText = this.add.text(30, 0, `🪙${cost}`, { fontFamily: 'OngleipParkDahyeon', fontSize: '12px', color: '#3182F6', fontStyle: 'bold' }).setOrigin(0.5);
                buyBtn.add([btnBg, btnText]);
                
                const hit = this.add.rectangle(30, 0, 60, 28, 0, 0.01).setInteractive({ useHandCursor: true });
                hit.on('pointerdown', () => {
                    if (globalState.coins >= cost) {
                        globalState.coins -= cost;
                        globalState.upgrades[u.key] = (globalState.upgrades[u.key] || 0) + 1;
                        SFX.coin();
                        saveGameData();
                        this.scene.restart();
                    } else {
                        this.cameras.main.shake(100, 0.005);
                        SFX.hit();
                    }
                });
                buyBtn.add(hit); // 히트를 버튼 컨테이너 내부로 이동!
                row.add(buyBtn);
            } else {
                row.add(this.add.text(140, 0, `MAX`, { fontFamily: 'OngleipParkDahyeon', fontSize: '15px', color: '#3182F6', fontStyle: 'bold' }).setOrigin(0.5));
            }
            this.uiContainer.add(row);
        });

        // 하단 시작 버튼 (패널 안에 꽉 차지 않게 위치 조정: 280 -> 190)
        const startBtnGroup = this.add.container(0, 190);
        const startBtnBg = this.add.graphics().fillStyle(0x3182F6).fillRoundedRect(-160, -28, 320, 56, 16);
        const startText = this.add.text(0, 0, '게임 시작하기', {
            fontFamily: 'OngleipParkDahyeon',
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        startBtnGroup.add([startBtnBg, startText]);
        this.uiContainer.add(startBtnGroup);
        
        // 인터랙티브 시작 영역
        this.startHit = this.add.rectangle(0, 0, 320, 56, 0, 0.01).setInteractive({ useHandCursor: true });
        startBtnGroup.add(this.startHit); 

        this.startHit.on('pointerdown', () => { 
            this.tweens.add({ targets: startBtnGroup, scale: 0.95, duration: 100, yoyo: true });
            SFX.meow(); 
            this.scene.start('GameScene'); 
        });

        // 리사이즈 로직 및 초기 배치
        const updateLayout = () => {
            const w = this.cameras.main.width;
            const h = this.cameras.main.height;
            
            this.bgFloor.setPosition(w/2, h/2);
            this.bgDark.setPosition(w/2, h/2);
            
            // 더 공격적인 스케일 계산 (iPhone SE 등 초소형 기기 대응을 위해 기준 상향: 750 -> 850)
            const baseH = 850; 
            const scaleFactor = Math.min(1.2, Math.max(0.65, h / baseH)); 
            
            this.uiContainer.setScale(scaleFactor);
            this.uiContainer.setPosition(w/2, h/2 + (70 * scaleFactor));
            
            this.lobbyPlayer.setScale(scaleFactor);
            this.lobbyPlayer.setPosition(w/2, h/2 - (240 * scaleFactor));
        };
        
        updateLayout();
        this.scale.on('resize', updateLayout);
        this.events.once('shutdown', () => {
            this.scale.off('resize', updateLayout);
        });
    }
}
