/**
 * 角色专属卡牌系统
 * 每个角色6张专属卡：2攻击 + 2防御 + 2技能
 * 稀有度：3普通 + 2稀有 + 1史诗
 */

import type { Card } from '@/types/game';

// ==================== 高松灯 (诗人/抽牌流) ====================
export const tomoriCards: Card[] = [
  // 攻击牌
  {
    id: 'tomori_strike_1',
    name: '「詠み人知らず」',
    cost: 1,
    type: 'attack',
    rarity: 'common',
    description: '造成5点伤害。手牌中每有1张牌，伤害+1（最多+3）',
    effect: { type: 'damage', value: 5, target: 'enemy', extraEffect: 'damage_per_hand_card_1' },
    characterId: 'tomori',
    icon: 'Feather'
  },
  {
    id: 'tomori_strike_2',
    name: '「迷子の石」',
    cost: 2,
    type: 'attack',
    rarity: 'rare',
    description: '造成8点伤害。抽到这张牌时抽1张牌',
    effect: { type: 'damage', value: 8, target: 'enemy', extraEffect: 'draw_on_draw_1' },
    characterId: 'tomori',
    icon: 'Gem'
  },
  // 防御牌
  {
    id: 'tomori_defend_1',
    name: '「一生バンド」',
    cost: 1,
    type: 'defense',
    rarity: 'common',
    description: '获得6点护盾。下回合抽牌+1',
    effect: { type: 'shield', value: 6, extraEffect: 'next_turn_draw_1' },
    characterId: 'tomori',
    icon: 'Heart'
  },
  {
    id: 'tomori_defend_2',
    name: '「雨に告ぐ」',
    cost: 1,
    type: 'defense',
    rarity: 'rare',
    description: '获得5点护盾，抽2张牌',
    effect: { type: 'shield', value: 5, extraEffect: 'draw_2' },
    characterId: 'tomori',
    icon: 'CloudRain'
  },
  // 技能牌
  {
    id: 'tomori_skill_1',
    name: '「詩を思いついた」',
    cost: 0,
    type: 'skill',
    rarity: 'common',
    description: '抽1张牌，如果是攻击牌则伤害+2',
    effect: { type: 'skill', value: 1, extraEffect: 'draw_1_attack_bonus_2' },
    characterId: 'tomori',
    icon: 'Lightbulb'
  },
  {
    id: 'tomori_skill_2',
    name: '「わたしの声」',
    cost: 2,
    type: 'skill',
    rarity: 'epic',
    description: '抽4张牌，本回合手牌上限+4。消耗。',
    effect: { type: 'skill', value: 4, extraEffect: 'draw_4_hand_size_plus_4_exhaust' },
    characterId: 'tomori',
    icon: 'Mic'
  }
];

// ==================== 千早爱音 (社交/金钱流) ====================
export const anonCards: Card[] = [
  // 攻击牌
  {
    id: 'anon_strike_1',
    name: '「あのちゃん登場」',
    cost: 1,
    type: 'attack',
    rarity: 'common',
    description: '造成5点伤害。获得5金钱',
    effect: { type: 'damage', value: 5, target: 'enemy', extraEffect: 'gain_money_5' },
    characterId: 'anon',
    icon: 'Sparkles'
  },
  {
    id: 'anon_strike_2',
    name: '「SNS拡散」',
    cost: 1,
    type: 'attack',
    rarity: 'rare',
    description: '造成7点伤害。击杀敌人时额外获得20金钱',
    effect: { type: 'damage', value: 7, target: 'enemy', extraEffect: 'kill_bonus_money_20' },
    characterId: 'anon',
    icon: 'Share2'
  },
  // 防御牌
  {
    id: 'anon_defend_1',
    name: '「フォロワーの声援」',
    cost: 1,
    type: 'defense',
    rarity: 'common',
    description: '获得5点护盾。获得5金钱',
    effect: { type: 'shield', value: 5, extraEffect: 'gain_money_5' },
    characterId: 'anon',
    icon: 'Users'
  },
  {
    id: 'anon_defend_2',
    name: '「見せてやる！」',
    cost: 0,
    type: 'defense',
    rarity: 'rare',
    description: '支付5金钱，获得8点护盾',
    effect: { type: 'shield', value: 8, extraEffect: 'pay_money_5' },
    characterId: 'anon',
    icon: 'Eye'
  },
  // 技能牌
  {
    id: 'anon_skill_1',
    name: '「フォローしてね」',
    cost: 0,
    type: 'skill',
    rarity: 'common',
    description: '获得10金钱，弃1张随机手牌',
    effect: { type: 'skill', value: 0, extraEffect: 'gain_money_10_discard_1' },
    characterId: 'anon',
    icon: 'AtSign'
  },
  {
    id: 'anon_skill_2',
    name: '「インフルエンサー」',
    cost: 1,
    type: 'skill',
    rarity: 'epic',
    description: '获得30金钱，将1张随机卡加入手牌（本回合0费）',
    effect: { type: 'skill', value: 0, extraEffect: 'gain_money_30_create_temp_card' },
    characterId: 'anon',
    icon: 'Crown'
  }
];

// ==================== 要乐奈 (野猫/随机流) ====================
export const ranaCards: Card[] = [
  // 攻击牌
  {
    id: 'rana_strike_1',
    name: '「Nyaa~」',
    cost: 0,
    type: 'attack',
    rarity: 'common',
    description: '造成3-8点随机伤害',
    effect: { type: 'damage', value: 0, target: 'enemy', extraEffect: 'random_3_8' },
    characterId: 'rana',
    icon: 'Cat'
  },
  {
    id: 'rana_strike_2',
    name: '「野良猫の爪」',
    cost: 1,
    type: 'attack',
    rarity: 'rare',
    description: '造成3点伤害3次',
    effect: { type: 'damage', value: 3, target: 'enemy', extraEffect: 'strike_thrice' },
    characterId: 'rana',
    icon: 'Swords'
  },
  // 防御牌
  {
    id: 'rana_defend_1',
    name: '「抹茶休憩」',
    cost: 1,
    type: 'defense',
    rarity: 'common',
    description: '获得4点护盾，恢复3精力',
    effect: { type: 'shield', value: 4, extraEffect: 'heal_3' },
    characterId: 'rana',
    icon: 'Coffee'
  },
  {
    id: 'rana_defend_2',
    name: '「気まぐれ回避」',
    cost: 0,
    type: 'defense',
    rarity: 'rare',
    description: '50%几率获得12点护盾，50%几率获得4点护盾',
    effect: { type: 'shield', value: 0, extraEffect: 'chance_shield_15_or_5' },
    characterId: 'rana',
    icon: 'Shuffle'
  },
  // 技能牌
  {
    id: 'rana_skill_1',
    name: '「適当に弾く」',
    cost: 0,
    type: 'skill',
    rarity: 'common',
    description: '弃1张手牌，抽2张牌',
    effect: { type: 'skill', value: 0, extraEffect: 'discard_1_draw_2' },
    characterId: 'rana',
    icon: 'Music'
  },
  {
    id: 'rana_skill_2',
    name: '「自由奔放」',
    cost: 1,
    type: 'skill',
    rarity: 'epic',
    description: '将手牌替换为3张随机卡牌（0费），本回合无限出牌',
    effect: { type: 'skill', value: 0, extraEffect: 'replace_hand_3_random_unlimited' },
    characterId: 'rana',
    icon: 'Wand2'
  }
];

// ==================== 长崎爽世 (防御/护盾流) ====================
export const soyoCards: Card[] = [
  // 攻击牌
  {
    id: 'soyo_strike_1',
    name: '「微笑みの裏」',
    cost: 1,
    type: 'attack',
    rarity: 'common',
    description: '造成5点伤害。获得等于伤害的护盾',
    effect: { type: 'damage', value: 5, target: 'enemy', extraEffect: 'lifesteal_shield' },
    characterId: 'soyo',
    icon: 'Smile'
  },
  {
    id: 'soyo_strike_2',
    name: '「CRYCHICへの想い」',
    cost: 2,
    type: 'attack',
    rarity: 'rare',
    description: '造成8点伤害。护盾翻倍',
    effect: { type: 'damage', value: 8, target: 'enemy', extraEffect: 'double_shield' },
    characterId: 'soyo',
    icon: 'Ghost'
  },
  // 防御牌
  {
    id: 'soyo_defend_1',
    name: '「お母様の教え」',
    cost: 1,
    type: 'defense',
    rarity: 'common',
    description: '获得8点护盾。可以保留到下回合',
    effect: { type: 'shield', value: 8, extraEffect: 'no_shield_decay_next' },
    characterId: 'soyo',
    icon: 'BookOpen'
  },
  {
    id: 'soyo_defend_2',
    name: '「仮面の微笑」',
    cost: 1,
    type: 'defense',
    rarity: 'rare',
    description: '获得6点护盾，反弹下回合受到的50%伤害',
    effect: { type: 'shield', value: 6, extraEffect: 'reflect_50_next_turn' },
    characterId: 'soyo',
    icon: 'Mask'
  },
  // 技能牌
  {
    id: 'soyo_skill_1',
    name: '「復縁工作」',
    cost: 1,
    type: 'skill',
    rarity: 'common',
    description: '获得4点护盾，从弃牌堆回收1张卡到手牌',
    effect: { type: 'skill', value: 0, extraEffect: 'shield_5_recover_1' },
    characterId: 'soyo',
    icon: 'GitPullRequest'
  },
  {
    id: 'soyo_skill_2',
    name: '「もう一度、バンドを」',
    cost: 2,
    type: 'skill',
    rarity: 'epic',
    description: '护盾翻倍，抽2张牌，获得1层神器',
    effect: { type: 'skill', value: 0, extraEffect: 'double_shield_draw_2_artifact_1' },
    characterId: 'soyo',
    icon: 'Crown'
  }
];

// ==================== 椎名立希 (连击/节奏流) ====================
export const takiCards: Card[] = [
  // 攻击牌
  {
    id: 'taki_strike_1',
    name: '「夜勤明けの一撃」',
    cost: 1,
    type: 'attack',
    rarity: 'common',
    description: '造成6点伤害。如果手牌中没有其他攻击牌，伤害+3',
    effect: { type: 'damage', value: 6, target: 'enemy', extraEffect: 'only_attack_bonus_4' },
    characterId: 'taki',
    icon: 'Moon'
  },
  {
    id: 'taki_strike_2',
    name: '「ドラムソロ」',
    cost: 2,
    type: 'attack',
    rarity: 'rare',
    description: '造成5点伤害2次。如果上回合使用了防御牌，再攻击1次',
    effect: { type: 'damage', value: 5, target: 'enemy', extraEffect: 'strike_twice_defense_bonus_strike' },
    characterId: 'taki',
    icon: 'Drum'
  },
  // 防御牌
  {
    id: 'taki_defend_1',
    name: '「バイトの経験」',
    cost: 1,
    type: 'defense',
    rarity: 'common',
    description: '获得5点护盾，获得8金钱',
    effect: { type: 'shield', value: 5, extraEffect: 'gain_money_8' },
    characterId: 'taki',
    icon: 'Briefcase'
  },
  {
    id: 'taki_defend_2',
    name: '「作曲の集中」',
    cost: 0,
    type: 'defense',
    rarity: 'rare',
    description: '弃1张手牌，获得10点护盾',
    effect: { type: 'shield', value: 10, extraEffect: 'discard_1_cost' },
    characterId: 'taki',
    icon: 'Headphones'
  },
  // 技能牌
  {
    id: 'taki_skill_1',
    name: '「リズム管理」',
    cost: 0,
    type: 'skill',
    rarity: 'common',
    description: '本回合下一张攻击牌打出两次',
    effect: { type: 'skill', value: 0, extraEffect: 'next_attack_double' },
    characterId: 'taki',
    icon: 'Activity'
  },
  {
    id: 'taki_skill_2',
    name: '「燈の詩に込める」',
    cost: 1,
    type: 'skill',
    rarity: 'epic',
    description: '抽3张牌。本回合每打出1张牌，伤害+1',
    effect: { type: 'skill', value: 0, extraEffect: 'draw_3_damage_per_card_1' },
    characterId: 'taki',
    icon: 'Flame'
  }
];

// ==================== 导出 ====================
export const characterCards: Record<string, Card[]> = {
  'tomori': tomoriCards,
  'anon': anonCards,
  'rana': ranaCards,
  'soyo': soyoCards,
  'taki': takiCards
};

// 获取角色专属卡牌
export function getCharacterCards(characterId: string): Card[] {
  return characterCards[characterId] || [];
}

// 获取角色的初始牌组（包含3张专属卡）
export function getCharacterInitialDeck(characterId: string): Card[] {
  const baseCards: Card[] = [];
  
  // 基础卡牌（所有角色通用）
  // 4张普通攻击
  for (let i = 0; i < 4; i++) {
    baseCards.push({
      id: `base_strike_${i}`,
      name: '普通攻击',
      cost: 1,
      type: 'attack',
      rarity: 'common',
      description: '造成6点伤害',
      effect: { type: 'damage', value: 6, target: 'enemy' },
      icon: 'Sword'
    });
  }
  
  // 4张普通防御
  for (let i = 0; i < 4; i++) {
    baseCards.push({
      id: `base_defend_${i}`,
      name: '普通防御',
      cost: 1,
      type: 'defense',
      rarity: 'common',
      description: '获得5点护盾',
      effect: { type: 'shield', value: 5 },
      icon: 'Shield'
    });
  }
  
  // 2张专属卡
  const exclusiveCards = getCharacterCards(characterId).slice(0, 2);
  
  return [...baseCards, ...exclusiveCards];
}

// 在卡牌奖励中获得角色专属卡的概率
export function getRandomCharacterCard(characterId: string, rarity?: 'common' | 'rare' | 'epic'): Card | null {
  const cards = getCharacterCards(characterId);
  if (cards.length === 0) return null;
  
  if (rarity) {
    const filtered = cards.filter(c => c.rarity === rarity);
    if (filtered.length > 0) {
      return { ...filtered[Math.floor(Math.random() * filtered.length)], id: `reward_${Date.now()}` };
    }
  }
  
  const randomCard = cards[Math.floor(Math.random() * cards.length)];
  return { ...randomCard, id: `reward_${Date.now()}` };
}
