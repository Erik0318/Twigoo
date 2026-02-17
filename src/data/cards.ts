/**
 * 卡牌系统 - 120张全新精品卡牌
 * MyGO名场面台词 + 程序梗命名
 */

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

// ==================== 导出所有卡牌（仅新卡牌系统）====================

export const allCards: Card[] = allNewCards;
export const commonCards: Card[] = newCommonCards;
export const rareCards: Card[] = newRareCards;
export const epicCardsList: Card[] = newEpicCards;
export const curseCards: Card[] = [];

// 按类型分类
export const allAttacks: Card[] = newAttackCards;
export const allDefenses: Card[] = newDefenseCards;
export const allSkills: Card[] = newSkillCards;

// ==================== 卡牌描述颜色标识工具 ====================

/**
 * 为卡牌描述添加颜色标识
 * 伤害 - 红色 | 护盾 - 蓝色 | 治疗/生命 - 绿色 | 能量 - 黄色 | 抽牌 - 紫色 | 负面 - 灰色
 */
export function formatCardDescription(description: string): string {
  if (!description) return '';
  
  let formatted = description;
  
  // 伤害数值 (造成X点伤害) - 红色
  formatted = formatted.replace(/造成(\s*)(\d+)(\s*)点(\s*)伤害/g, 
    '造成<span class="text-red-400 font-bold">$2</span>点<span class="text-red-400">伤害</span>');
  formatted = formatted.replace(/(\d+)(\s*)点(\s*)伤害/g, 
    '<span class="text-red-400 font-bold">$1</span>点<span class="text-red-400">伤害</span>');
  
  // 护盾数值 - 蓝色
  formatted = formatted.replace(/(\d+)(\s*)点?护盾/g, 
    '<span class="text-blue-400 font-bold">$1</span><span class="text-blue-400">护盾</span>');
  
  // 治疗/恢复数值 - 绿色
  formatted = formatted.replace(/恢复(\s*)(\d+)(\s*)生命/g, 
    '恢复<span class="text-green-400 font-bold">$2</span><span class="text-green-400">生命</span>');
  formatted = formatted.replace(/(\d+)生命/g, 
    '<span class="text-green-400 font-bold">$1</span><span class="text-green-400">生命</span>');
  
  // 能量数值 - 黄色
  formatted = formatted.replace(/获得(\s*)(\d+)(\s*)能量/g, 
    '获得<span class="text-yellow-400 font-bold">$2</span><span class="text-yellow-400">能量</span>');
  formatted = formatted.replace(/(\d+)能量/g, 
    '<span class="text-yellow-400 font-bold">$1</span><span class="text-yellow-400">能量</span>');
  
  // 抽牌数值 - 紫色
  formatted = formatted.replace(/抽(\s*)(\d+)(\s*)张/g, 
    '抽<span class="text-purple-400 font-bold">$2</span><span class="text-purple-400">张</span>');
  formatted = formatted.replace(/(\d+)张牌/g, 
    '<span class="text-purple-400 font-bold">$1</span><span class="text-purple-400">张牌</span>');
  
  // 负面效果关键词 - 灰色
  formatted = formatted.replace(/晕眩|虚弱|易伤|中毒|诅咒|无法打出|弃掉|跳过|无法|禁止|失效|消耗|自损|失去/g,
    (match) => `<span class="text-slate-400">${match}</span>`);
  
  // 正面效果关键词 - 金色/橙色
  formatted = formatted.replace(/翻倍|免费|费用为0|费用-1|费用-2/g,
    (match) => `<span class="text-amber-400">${match}</span>`);
  
  return formatted;
}

// ==================== 卡牌价格 ====================

export function getCardPrice(card: Card): number {
  return card.rarity === 'common' ? 50 : card.rarity === 'rare' ? 100 : 200;
}

// ==================== 角色专属卡牌 ====================

export const characterCards: Record<string, Card[]> = {
  tomori: [
    { id: 'guitar_solo', name: '吉他SOLO', cost: 2, type: 'attack', rarity: 'rare', description: '造成15点伤害。如果本回合使用过技能，伤害+10', effect: { type: 'damage', value: 15, target: 'enemy', extraEffect: 'skill_bonus_10' }, icon: 'Music' },
    { id: 'improvise', name: '即兴演奏', cost: 1, type: 'skill', rarity: 'rare', description: '抽2张牌，本回合手牌上限+2', effect: { type: 'draw', value: 2, target: 'self', extraEffect: 'hand_size_plus_2' }, icon: 'Music2' },
    { id: 'rhythm_sync', name: '全员诗超绊', cost: 2, type: 'attack', rarity: 'rare', description: '对所有敌人造成12点伤害，获得10护盾', effect: { type: 'damage', value: 12, target: 'all', extraEffect: 'shield_10' }, icon: 'Metronome' },
  ],
  anon: [
    { id: 'crazy_solo', name: '疯狂SOLO', cost: 1, type: 'attack', rarity: 'rare', description: '造成10点伤害，本回合下一张牌费用-2', effect: { type: 'damage', value: 10, target: 'enemy', extraEffect: 'next_cost_minus_2' }, icon: 'Zap' },
    { id: 'improv_accompaniment', name: '即兴伴奏', cost: 0, type: 'skill', rarity: 'rare', description: '抽1张牌，0费攻击伤害+5', effect: { type: 'draw', value: 1, target: 'self', extraEffect: 'zero_attack_bonus_5' }, icon: 'Mic' },
    { id: 'stage_presence', name: '舞台魅力', cost: 1, type: 'skill', rarity: 'rare', description: '本回合所有攻击牌伤害+6', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'all_attack_bonus_6' }, icon: 'Star' },
  ],
  rana: [
    { id: 'bass_line', name: '贝斯Line', cost: 1, type: 'attack', rarity: 'rare', description: '造成8点伤害，获得等量护盾', effect: { type: 'damage', value: 8, target: 'enemy', extraEffect: 'lifesteal_shield' }, icon: 'Music' },
    { id: 'melody_solo', name: '旋律独奏', cost: 0, type: 'skill', rarity: 'rare', description: '抽2张牌，本回合费用-1', effect: { type: 'draw', value: 2, target: 'self', extraEffect: 'cost_minus_1' }, icon: 'Music2' },
    { id: 'sound_wave', name: '音波冲击', cost: 2, type: 'attack', rarity: 'rare', description: '对所有敌人造成8点伤害，手牌上限+2本回合', effect: { type: 'damage', value: 8, target: 'all', extraEffect: 'hand_size_plus_2' }, icon: 'Waves' },
  ],
  soyo: [
    { id: 'keyboard_harmony', name: '键盘和音', cost: 1, type: 'defense', rarity: 'rare', description: '获得12护盾，复制1张手牌', effect: { type: 'shield', value: 12, target: 'self', extraEffect: 'copy_hand_1' }, icon: 'Piano' },
    { id: 'healing_melody', name: '治愈旋律', cost: 2, type: 'skill', rarity: 'rare', description: '恢复20生命，移除所有负面效果', effect: { type: 'heal', value: 20, target: 'self', extraEffect: 'cleanse_all' }, icon: 'Heart' },
    { id: 'chorus', name: '合唱', cost: 2, type: 'skill', rarity: 'rare', description: '抽4张牌，弃掉其中的攻击牌', effect: { type: 'draw', value: 4, target: 'self', extraEffect: 'filter_attacks' }, icon: 'Users' },
  ],
  taki: [
    { id: 'drum_beat', name: '鼓点', cost: 1, type: 'attack', rarity: 'rare', description: '造成9点伤害。如果是手牌最后一张，造成18点', effect: { type: 'damage', value: 9, target: 'enemy', extraEffect: 'last_card_double' }, icon: 'Drum' },
    { id: 'rhythm_mastery', name: '节奏掌控', cost: 1, type: 'skill', rarity: 'rare', description: '下3张攻击牌伤害+4', effect: { type: 'special', value: 0, target: 'self', extraEffect: 'next_3_attack_bonus_4' }, icon: 'Timer' },
    { id: 'intense_drum_solo', name: '激烈鼓独奏', cost: 2, type: 'attack', rarity: 'rare', description: '造成15点伤害，晕眩1回合', effect: { type: 'damage', value: 15, target: 'enemy', extraEffect: 'stun_1' }, icon: 'Flame' },
  ],
};

export function getCharacterCards(characterId: string): Card[] {
  return characterCards[characterId] || [];
}

// ==================== 获取初始牌库 ====================

export function getInitialDeck(characterId: string): Card[] {
  const deck: Card[] = [];
  
  // 基础攻击牌
  const strikes = allAttacks.filter(c => c.rarity === 'common').slice(0, 4);
  deck.push(...strikes.map(c => ({ ...c, id: c.id + '_0' })));
  
  // 基础防御牌
  const defends = allDefenses.filter(c => c.rarity === 'common').slice(0, 4);
  deck.push(...defends.map(c => ({ ...c, id: c.id + '_0' })));
  
  // 基础技能牌
  const draws = allSkills.filter(c => c.rarity === 'common').slice(0, 2);
  deck.push(...draws.map(c => ({ ...c, id: c.id + '_0' })));
  
  // 角色专属卡牌
  const charCards = getCharacterCards(characterId);
  deck.push(...charCards.map(c => ({ ...c, id: c.id + '_char' })));
  
  return deck;
}

// ==================== 卡牌奖励 ====================

export function getCombatRewardCards(_floor: number, isElite: boolean): Card[] {
  const cards: Card[] = [];
  const pool = isElite ? [...rareCards, ...epicCardsList] : commonCards;
  
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  cards.push(...shuffled.slice(0, 3));
  
  return cards;
}

// ==================== 商店卡牌 ====================

export function getShopCards(): Card[] {
  const cards: Card[] = [];
  
  const commonPool = commonCards.sort(() => Math.random() - 0.5).slice(0, 4);
  const rarePool = rareCards.sort(() => Math.random() - 0.5).slice(0, 2);
  
  cards.push(...commonPool, ...rarePool);
  
  return cards;
}

// ==================== 事件/宝藏卡牌 ====================

export function getTreasureCard(): Card {
  return epicCardsList[Math.floor(Math.random() * epicCardsList.length)];
}

export function getRandomCard(rarity: 'common' | 'rare' | 'epic'): Card {
  const pool = rarity === 'common' ? commonCards : rarity === 'rare' ? rareCards : epicCardsList;
  return pool[Math.floor(Math.random() * pool.length)];
}
