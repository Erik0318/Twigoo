import type { Card } from '@/types/game';
import { 
  allNewCards,
  newCommonCards, 
  newRareCards, 
  newEpicCards,
  newAttackCards,
  newDefenseCards,
  newSkillCards
} from './newCards';
import { 
  getCharacterInitialDeck,
  getRandomCharacterCard as getRandomCharCard
} from './characterCards';

// 导出所有卡牌
export const allCards: Card[] = allNewCards;
export const commonCards: Card[] = newCommonCards;
export const rareCards: Card[] = newRareCards;
export const epicCardsList: Card[] = newEpicCards;
export const curseCards: Card[] = [];

// 卡牌分类
export const allAttacks: Card[] = newAttackCards;
export const allDefenses: Card[] = newDefenseCards;
export const allSkills: Card[] = newSkillCards;

// 格式化卡牌描述（处理高亮标记）
export function formatCardDescription(description: string): string {
  return description
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-yellow-400">$1</strong>')
    .replace(/_(.+?)_/g, '<em class="text-blue-400">$1</em>');
}

// 获取卡牌价格
export function getCardPrice(card: Card): number {
  switch (card.rarity) {
    case 'common': return 25;
    case 'rare': return 50;
    case 'epic': return 100;
    default: return 25;
  }
}

// 导出角色专属卡相关
export { 
  characterCards, 
  getCharacterCards, 
  getCharacterInitialDeck,
  getRandomCharacterCard,
  tomoriCards,
  anonCards,
  ranaCards,
  soyoCards,
  takiCards
} from './characterCards';

// 初始牌组 - 使用角色专属版本
export function getInitialDeck(characterId: string): Card[] {
  return getCharacterInitialDeck(characterId);
}

// 战斗奖励卡牌
export function getCombatRewardCards(_floor: number, isElite: boolean, characterId?: string): Card[] {
  const rewardCards: Card[] = [];
  const count = 3;
  
  for (let i = 0; i < count; i++) {
    // 30%概率出现角色专属卡（如果有角色ID）
    if (characterId && Math.random() < 0.3) {
      const rarityRoll = Math.random();
      let rarity: 'common' | 'rare' | 'epic' = 'common';
      if (isElite) {
        if (rarityRoll < 0.4) rarity = 'rare';
        else if (rarityRoll < 0.1) rarity = 'epic';
      } else {
        if (rarityRoll < 0.2) rarity = 'rare';
        else if (rarityRoll < 0.05) rarity = 'epic';
      }
      const charCard = getRandomCharCard(characterId, rarity);
      if (charCard) {
        rewardCards.push(charCard);
        continue;
      }
    }
    
    const rarityRoll = Math.random();
    let pool = commonCards;
    
    if (isElite) {
      if (rarityRoll < 0.4) pool = rareCards;
      else if (rarityRoll < 0.1) pool = epicCardsList;
    } else {
      if (rarityRoll < 0.2) pool = rareCards;
      else if (rarityRoll < 0.05) pool = epicCardsList;
    }
    
    const randomCard = pool[Math.floor(Math.random() * pool.length)];
    if (randomCard) {
      rewardCards.push({ ...randomCard, id: `reward_${i}_${Date.now()}` });
    }
  }
  
  return rewardCards;
}

// 商店卡牌
export function getShopCards(): Card[] {
  const shopCards: Card[] = [];
  
  // 2张普通
  for (let i = 0; i < 2; i++) {
    const card = commonCards[Math.floor(Math.random() * commonCards.length)];
    if (card) shopCards.push({ ...card, id: `shop_common_${i}_${Date.now()}` });
  }
  
  // 1张稀有
  const rareCard = rareCards[Math.floor(Math.random() * rareCards.length)];
  if (rareCard) shopCards.push({ ...rareCard, id: `shop_rare_${Date.now()}` });
  
  return shopCards;
}

// 宝箱房卡牌
export function getTreasureCard(): Card {
  return epicCardsList[Math.floor(Math.random() * epicCardsList.length)];
}

// 获取单张指定稀有度的随机卡牌
export function getRandomCard(rarity: 'common' | 'rare' | 'epic'): Card {
  const pool = rarity === 'common' ? commonCards : rarity === 'rare' ? rareCards : epicCardsList;
  return pool[Math.floor(Math.random() * pool.length)];
}

// 获取多张随机卡牌（用于事件奖励）
export function getRandomCards(count: number, rarity?: 'common' | 'rare' | 'epic'): Card[] {
  const cards: Card[] = [];
  
  for (let i = 0; i < count; i++) {
    let pool = allCards;
    
    if (rarity) {
      pool = rarity === 'common' ? commonCards : rarity === 'rare' ? rareCards : epicCardsList;
    } else {
      // 默认按照一定概率分布
      const roll = Math.random();
      if (roll < 0.7) pool = commonCards;
      else if (roll < 0.95) pool = rareCards;
      else pool = epicCardsList;
    }
    
    const randomCard = pool[Math.floor(Math.random() * pool.length)];
    if (randomCard) {
      cards.push({ ...randomCard, id: `random_${Date.now()}_${i}` });
    }
  }
  
  return cards;
}
