export const upgradeConfig = [
  { key: 'hp', title: '최대 체력 증가', baseCost: 50, maxLv: 10, effect: '+10' },
  { key: 'speed', title: '이동 속도 증가', baseCost: 50, maxLv: 5, effect: '+10' },
  { key: 'damage', title: '기본 데미지 증가', baseCost: 100, maxLv: 10, effect: '+5' },
  { key: 'magnet', title: '자석 범위 증가', baseCost: 80, maxLv: 5, effect: '+20' }
];

export const globalState = {
  coins: 0,
  upgrades: { hp: 0, speed: 0, damage: 0, magnet: 0 } as Record<string, number>
};
