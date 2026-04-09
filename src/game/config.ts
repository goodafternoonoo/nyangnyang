import Phaser from 'phaser';
import LobbyScene from './scenes/LobbyScene';
import GameScene from './scenes/GameScene';

export const GameConfig: any = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: 'game-container',
    width: '100%',
    height: '100%',
    autoRound: true,
  },
  render: {
    pixelArt: false,
    antialias: true,
    antialiasGL: true,
    roundPixels: true,
    powerPreference: 'high-performance',
  },
  resolution: Math.max(window.devicePixelRatio || 1, 2),
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false,
    },
  },
  scene: [LobbyScene, GameScene],
  backgroundColor: '#8B5A2B',
};
