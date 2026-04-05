import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameConfig } from '../game/config';

export default function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    document.fonts.ready.then(() => {
      if (!gameRef.current) {
        gameRef.current = new Phaser.Game(GameConfig);
      }
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return <div id="game-container" />;
}
