import Phaser from 'phaser';
import LobbyScene from './scenes/LobbyScene';
import GameScene from './scenes/GameScene';

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: 'game-container',
    width: '100%',
    height: '100%',
  },
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
