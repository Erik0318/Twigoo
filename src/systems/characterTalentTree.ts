/**
 * 角色天赋树系统 - 每个角色2条路径，每条路径3个天赋
 */

import type { GameState } from '@/types/game';

// 天赋ID定义
export type TalentId = 
  // Tomori - 诗人之路(抽牌)
  | 'tomori_a1' | 'tomori_a2' | 'tomori_a3'
  // Tomori - 呐喊之路(输出)
  | 'tomori_b1' | 'tomori_b2' | 'tomori_b3'
  // Anon - 金钱之路
  | 'anon_a1' | 'anon_a2' | 'anon_a3'
  // Anon - 社交之路
  | 'anon_b1' | 'anon_b2' | 'anon_b3'
  // Rana - 随机之路
  | 'rana_a1' | 'rana_a2' | 'rana_a3'
  // Rana - 暴击之路
  | 'rana_b1' | 'rana_b2' | 'rana_b3'
  // Soyo - 护盾之路
  | 'soyo_a1' | 'soyo_a2' | 'soyo_a3'
  // Soyo - 控制之路
  | 'soyo_b1' | 'soyo_b2' | 'soyo_b3'
  // Taki - 连击之路
  | 'taki_a1' | 'taki_a2' | 'taki_a3'
  // Taki - 节奏之路
  | 'taki_b1' | 'taki_b2' | 'taki_b3';

// 单个天赋定义
export interface Talent {
  id: TalentId;
  name: string;
  description: string;
  maxLevel: number;
}

// 天赋路径
export interface TalentPath {
  name: string;
  description: string;
  talents: Talent[];
}

// 角色天赋树状态
export interface CharacterTalentTreeState {
  characterId: string;
  availablePoints: number;
  unlockedTalents: TalentId[];
}

// 所有角色天赋树定义
export const characterTalentTrees: Record<string, { pathA: TalentPath; pathB: TalentPath }> = {
  // Tomori - 诗人(抽牌/过牌) + 呐喊(输出/爆发)
  tomori: {
    pathA: {
      name: '诗人之路',
      description: '抽牌与过牌',
      talents: [
        { id: 'tomori_a1', name: '灵感迸发', description: '战斗开始时抽1张牌', maxLevel: 1 },
        { id: 'tomori_a2', name: '诗歌循环', description: '每回合抽牌+1', maxLevel: 1 },
        { id: 'tomori_a3', name: '无尽诗篇', description: '手牌上限+2', maxLevel: 1 },
      ],
    },
    pathB: {
      name: '呐喊之路',
      description: '输出与爆发',
      talents: [
        { id: 'tomori_b1', name: '内心呐喊', description: '攻击伤害+2', maxLevel: 1 },
        { id: 'tomori_b2', name: '情感爆发', description: '每回合首次攻击伤害翻倍', maxLevel: 1 },
        { id: 'tomori_b3', name: '灵魂咆哮', description: '战斗开始时获得2力量', maxLevel: 1 },
      ],
    },
  },
  
  // Anon - 金钱(商店/经济) + 社交(随机/支援)
  anon: {
    pathA: {
      name: '金钱之路',
      description: '商店与经济',
      talents: [
        { id: 'anon_a1', name: '讨价还价', description: '商店价格-20%', maxLevel: 1 },
        { id: 'anon_a2', name: '商业头脑', description: '战斗奖励+50%', maxLevel: 1 },
        { id: 'anon_a3', name: '投资理财', description: '每层开始时获得20金钱', maxLevel: 1 },
      ],
    },
    pathB: {
      name: '社交之路',
      description: '随机与支援',
      talents: [
        { id: 'anon_b1', name: '社牛体质', description: '随机事件额外选项+1', maxLevel: 1 },
        { id: 'anon_b2', name: '人脉广泛', description: '战斗中有20%几率召唤支援', maxLevel: 1 },
        { id: 'anon_b3', name: '乐天派', description: '负面事件影响-50%', maxLevel: 1 },
      ],
    },
  },
  
  // Rana - 随机(混沌) + 暴击(高伤)
  rana: {
    pathA: {
      name: '随机之路',
      description: '混沌与意外',
      talents: [
        { id: 'rana_a1', name: '即兴演奏', description: '每回合随机获得1能量或抽1牌', maxLevel: 1 },
        { id: 'rana_a2', name: '音痴模式', description: '有25%几率攻击造成3倍伤害', maxLevel: 1 },
        { id: 'rana_a3', name: '喵星人运气', description: '随机效果必定正面', maxLevel: 1 },
      ],
    },
    pathB: {
      name: '暴击之路',
      description: '精准与爆发',
      talents: [
        { id: 'rana_b1', name: '找準节拍', description: '暴击率+15%', maxLevel: 1 },
        { id: 'rana_b2', name: '致命一击', description: '暴击伤害+50%', maxLevel: 1 },
        { id: 'rana_b3', name: '吉他solo', description: '每3次攻击必定暴击', maxLevel: 1 },
      ],
    },
  },
  
  // Soyo - 护盾(防御) + 控制(减益)
  soyo: {
    pathA: {
      name: '护盾之路',
      description: '防御与保护',
      talents: [
        { id: 'soyo_a1', name: '坚不可摧', description: '护盾获取+25%', maxLevel: 1 },
        { id: 'soyo_a2', name: '护盾反弹', description: '护盾破碎时对敌人造成等量伤害', maxLevel: 1 },
        { id: 'soyo_a3', name: '守护之心', description: '战斗开始时获得15护盾', maxLevel: 1 },
      ],
    },
    pathB: {
      name: '控制之路',
      description: '减益与操控',
      talents: [
        { id: 'soyo_b1', name: '冷静分析', description: '敌人虚弱效果+1回合', maxLevel: 1 },
        { id: 'soyo_b2', name: '心理压制', description: '每回合首次攻击附加1层虚弱', maxLevel: 1 },
        { id: 'soyo_b3', name: '优雅从容', description: '受到攻击时有30%几率获得1点能量', maxLevel: 1 },
      ],
    },
  },
  
  // Taki - 连击(多次攻击) + 节奏(节奏感)
  taki: {
    pathA: {
      name: '连击之路',
      description: '多次攻击',
      talents: [
        { id: 'taki_a1', name: '快速连击', description: '每回合第3次攻击额外造成3伤害', maxLevel: 1 },
        { id: 'taki_a2', name: '不停歇', description: '每使用3张牌抽1张牌', maxLevel: 1 },
        { id: 'taki_a3', name: '鼓手节奏', description: '连击伤害每层+1', maxLevel: 1 },
      ],
    },
    pathB: {
      name: '节奏之路',
      description: '节奏与韵律',
      talents: [
        { id: 'taki_b1', name: '找準拍子', description: '战斗开始时获得1层节奏', maxLevel: 1 },
        { id: 'taki_b2', name: '渐进加速', description: '每回合伤害+10%(上限50%)', maxLevel: 1 },
        { id: 'taki_b3', name: '终章高潮', description: '敌人生命低于25%时伤害+50%', maxLevel: 1 },
      ],
    },
  },
};

// 获取角色天赋树
export function getTalentTreeByCharacterId(characterId: string): { pathA: TalentPath; pathB: TalentPath } | null {
  return characterTalentTrees[characterId] || null;
}

// 检查天赋是否解锁
export function isTalentUnlocked(talentTree: CharacterTalentTreeState, talentId: TalentId): boolean {
  return talentTree.unlockedTalents.includes(talentId);
}

// 解锁天赋
export function unlockTalent(talentTree: CharacterTalentTreeState, talentId: TalentId): boolean {
  // 检查是否有可用点数
  if (talentTree.availablePoints <= 0) {
    return false;
  }
  
  // 检查是否已经解锁
  if (talentTree.unlockedTalents.includes(talentId)) {
    return false;
  }
  
  // 检查前置条件：第一条路径需要顺序解锁，第二条路径第一条可直接解锁
  const tree = characterTalentTrees[talentTree.characterId];
  if (!tree) return false;
  
  // 提取路径和层级
  const match = talentId.match(/^(\w+)_(a|b)(\d)$/);
  if (!match) return false;
  
  const [, charId, path, level] = match;
  const levelNum = parseInt(level);
  
  // 路径A需要顺序解锁 (a2需要a1, a3需要a2)
  // 路径B第一张可直接解锁，后续需要顺序
  if (path === 'a' && levelNum > 1) {
    const prevTalent = `${charId}_a${levelNum - 1}` as TalentId;
    if (!talentTree.unlockedTalents.includes(prevTalent)) {
      return false;
    }
  } else if (path === 'b' && levelNum > 1) {
    const prevTalent = `${charId}_b${levelNum - 1}` as TalentId;
    if (!talentTree.unlockedTalents.includes(prevTalent)) {
      return false;
    }
  }
  
  // 解锁天赋
  talentTree.unlockedTalents.push(talentId);
  talentTree.availablePoints -= 1;
  
  return true;
}

// 计算天赋效果的累积值
export function calculateTalentEffects(talentTree: CharacterTalentTreeState) {
  const effects = {
    drawBonus: 0,
    damageBonus: 0,
    shieldBonus: 0,
    energyBonus: 0,
    maxHealthBonus: 0,
    startShield: 0,
    startEnergy: 0,
    startDraw: 0,
    startStrength: 0,
    critRate: 0,
    critDamage: 0,
    moneyBonus: 0,
    shopDiscount: 0,
  };
  
  for (const talentId of talentTree.unlockedTalents) {
    switch (talentId) {
      // Tomori
      case 'tomori_a1': effects.startDraw += 1; break;
      case 'tomori_a2': effects.drawBonus += 1; break;
      case 'tomori_a3': /* 手牌上限在UI处理 */ break;
      case 'tomori_b1': effects.damageBonus += 2; break;
      case 'tomori_b2': /* 每回合首次攻击翻倍在战斗逻辑处理 */ break;
      case 'tomori_b3': effects.startStrength += 2; break;
      
      // Anon
      case 'anon_a1': effects.shopDiscount += 20; break;
      case 'anon_a2': effects.moneyBonus += 50; break;
      case 'anon_a3': /* 每层开始获得金钱在地图推进时处理 */ break;
      case 'anon_b1': /* 事件额外选项在事件系统处理 */ break;
      case 'anon_b2': /* 支援召唤在战斗系统处理 */ break;
      case 'anon_b3': /* 负面事件减免在事件系统处理 */ break;
      
      // Rana
      case 'rana_a1': /* 即兴演奏在回合开始时处理 */ break;
      case 'rana_a2': /* 音痴模式在攻击时处理 */ break;
      case 'rana_a3': /* 运气效果在随机效果处理 */ break;
      case 'rana_b1': effects.critRate += 15; break;
      case 'rana_b2': effects.critDamage += 50; break;
      case 'rana_b3': /* 必定暴击在攻击计数处理 */ break;
      
      // Soyo
      case 'soyo_a1': effects.shieldBonus += 25; break;
      case 'soyo_a2': /* 护盾反弹在护盾破碎时处理 */ break;
      case 'soyo_a3': effects.startShield += 15; break;
      case 'soyo_b1': /* 虚弱回合在debuff处理 */ break;
      case 'soyo_b2': /* 攻击附加虚弱在攻击时处理 */ break;
      case 'soyo_b3': /* 受击回能在受击时处理 */ break;
      
      // Taki
      case 'taki_a1': /* 第3次攻击额外伤害在攻击计数处理 */ break;
      case 'taki_a2': /* 用3张牌抽1张在出牌计数处理 */ break;
      case 'taki_a3': /* 连击伤害加成在连击buff处理 */ break;
      case 'taki_b1': /* 节奏层数在战斗开始时处理 */ break;
      case 'taki_b2': /* 渐进加速在回合结束时处理 */ break;
      case 'taki_b3': /* 残血增伤在伤害计算时处理 */ break;
    }
  }
  
  return effects;
}

// 应用天赋效果到游戏状态（战斗开始时调用）
export function applyTalentEffectsToGameState(
  gameState: GameState,
  talentTree: CharacterTalentTreeState
): GameState {
  const newState = { ...gameState };
  const effects = calculateTalentEffects(talentTree);
  
  // 初始化 talentEffects 对象
  if (!newState.talentEffects) {
    newState.talentEffects = {};
  }
  
  // 应用数值效果到 talentEffects
  newState.talentEffects.drawBonus = (newState.talentEffects.drawBonus || 0) + effects.drawBonus;
  newState.talentEffects.damageBonus = (newState.talentEffects.damageBonus || 0) + effects.damageBonus;
  newState.talentEffects.shieldBonus = (newState.talentEffects.shieldBonus || 0) + effects.shieldBonus;
  newState.talentEffects.maxHealthBonus = (newState.talentEffects.maxHealthBonus || 0) + effects.maxHealthBonus;
  newState.talentEffects.shopDiscount = (newState.talentEffects.shopDiscount || 0) + effects.shopDiscount;
  
  // 应用战斗状态效果（直接设置到GameState顶层）
  if (effects.startShield > 0) {
    newState.tempShield = (newState.tempShield || 0) + effects.startShield;
  }
  if (effects.startStrength > 0) {
    newState.startStrength = (newState.startStrength || 0) + effects.startStrength;
  }
  if (effects.critRate > 0) {
    newState.critRate = (newState.critRate || 0) + effects.critRate;
  }
  if (effects.critDamage > 0) {
    newState.critDamage = (newState.critDamage || 0) + effects.critDamage;
  }
  if (effects.drawBonus > 0) {
    // 抽牌加成应用到 permanentDrawBonus
    newState.permanentDrawBonus = (newState.permanentDrawBonus || 0) + effects.drawBonus;
  }
  
  // 记录完整天赋效果用于后续处理
  newState.talentEffects = { ...newState.talentEffects, ...effects };
  
  return newState;
}
