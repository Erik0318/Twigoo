import type { Character } from '@/types/game';

export const characters: Character[] = [
  {
    id: 'tomori',
    name: '高松灯',
    maxEnergy: 60,
    currentEnergy: 60,
    trait: '迷路的诗人',
    traitDescription: '每回合首次抽牌时，额外抽1张',
    isActive: true,
    isExhausted: false,
    portrait: '/characters/tomori.png',
    color: '#8B9DC3'
  },
  {
    id: 'anon',
    name: '千早爱音',
    maxEnergy: 55,
    currentEnergy: 55,
    trait: '社交网络',
    traitDescription: '进入商店时，商品价格降低20%，初始金钱+50',
    isActive: false,
    isExhausted: false,
    portrait: '/characters/anon.png',
    color: '#FFB6C1'
  },
  {
    id: 'rana',
    name: '要乐奈',
    maxEnergy: 50,
    currentEnergy: 50,
    trait: '野性的直觉',
    traitDescription: '每回合第一张卡牌费用-1',
    isActive: false,
    isExhausted: false,
    portrait: '/characters/rana.png',
    color: '#98D8C8'
  },
  {
    id: 'soyo',
    name: '长崎爽世',
    maxEnergy: 70,
    currentEnergy: 70,
    trait: '过去的执念',
    traitDescription: '战斗开始时，获得8点护盾',
    isActive: false,
    isExhausted: false,
    portrait: '/characters/soyo.png',
    color: '#DDA0DD'
  },
  {
    id: 'taki',
    name: '椎名立希',
    maxEnergy: 55,
    currentEnergy: 55,
    trait: '打工狂人',
    traitDescription: '战斗胜利时额外获得10金钱',
    isActive: true,
    isExhausted: false,
    portrait: '/characters/taki.png',
    color: '#708090'
  }
];

// 获取可用角色（Demo版本）
export function getAvailableCharacters(): Character[] {
  return characters.filter(c => c.id === 'tomori' || c.id === 'taki');
}

// 注意：新的硬件系统在 data/hardware.ts 中定义
// 使用 createInitialHardware() 获取初始硬件配置
