/**
 * 重构后的卡牌系统执行器
 * 支持200+张卡牌的所有效果
 */

import type { Card, GameState } from '@/types/game';

// 游戏状态修饰器（用于临时状态）
export interface CombatModifiers {
  strength: number;        // 力量：伤害加成百分比
  dexterity: number;       // 敏捷：护盾加成百分比
  vulnerable: number;      // 易伤：受到伤害增加
  weak: number;           // 虚弱：造成伤害减少
  poison: number;         // 中毒：每回合失去生命
  nextAttackBonus: number; // 下次攻击加成
  nextAttackDouble: boolean; // 下次攻击双倍
  nextCardFree: number;   // 下N张牌免费
  noShieldDecay: boolean; // 护盾不衰减
}

// 初始化修饰器
export function createModifiers(): CombatModifiers {
  return {
    strength: 0,
    dexterity: 0,
    vulnerable: 0,
    weak: 0,
    poison: 0,
    nextAttackBonus: 0,
    nextAttackDouble: false,
    nextCardFree: 0,
    noShieldDecay: false,
  };
}

// 洗牌函数
export function shuffleDeck<T>(deck: T[]): T[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 抽牌函数
export function drawCards(state: GameState, count: number): void {
  const cardsToDraw = count + (state.nextTurnDrawBonus || 0);
  state.nextTurnDrawBonus = 0;
  
  for (let i = 0; i < cardsToDraw; i++) {
    if (state.hand.length >= 10) break;
    
    if (state.deck.length === 0) {
      if (state.discard.length === 0) break;
      state.deck = shuffleDeck(state.discard);
      state.discard = [];
    }
    
    if (state.deck.length > 0) {
      const card = state.deck.shift()!;
      state.hand.push(card);
    }
  }
}

// 检查卡牌是否可以打出
export function canPlayCard(state: GameState, card: Card, modifiers?: CombatModifiers): boolean {
  let actualCost = card.cost;
  
  // Rana角色特性：第一张攻击牌费用-1
  if (state.characters[0]?.id === 'rana' && 
      card.type === 'attack' && 
      state.cardsPlayedThisTurn === 0) {
    actualCost = Math.max(0, actualCost - 1);
  }
  
  // 下N张牌免费
  if (modifiers && modifiers.nextCardFree > 0) {
    actualCost = 0;
  }
  
  return state.currentCost >= actualCost;
}

// 获取卡牌实际费用
export function getActualCardCost(state: GameState, card: Card, modifiers?: CombatModifiers): number {
  let cost = card.cost;
  
  // Rana角色特性
  if (state.characters[0]?.id === 'rana' && 
      card.type === 'attack' && 
      state.cardsPlayedThisTurn === 0) {
    cost = Math.max(0, cost - 1);
  }
  
  // 下N张牌免费
  if (modifiers && modifiers.nextCardFree > 0) {
    return 0;
  }
  
  return cost;
}

// ==================== 卡牌效果执行器 ====================

export class CardEffectExecutor {
  state: GameState;
  modifiers: CombatModifiers;
  
  constructor(state: GameState, modifiers?: CombatModifiers) {
    this.state = state;
    this.modifiers = modifiers || createModifiers();
  }

  // 计算最终伤害（考虑所有加成）
  calculateDamage(baseDamage: number, isAttack: boolean = true): number {
    let damage = baseDamage;
    
    // 力量加成
    if (this.modifiers.strength > 0) {
      damage = Math.floor(damage * (1 + this.modifiers.strength * 0.25));
    }
    
    // 虚弱减成
    if (this.modifiers.weak > 0) {
      damage = Math.floor(damage * 0.75);
    }
    
    // 下次攻击加成
    if (isAttack && this.modifiers.nextAttackBonus > 0) {
      damage += this.modifiers.nextAttackBonus;
      this.modifiers.nextAttackBonus = 0;
    }
    
    // GPU伤害加成
    const gpuBonus = this.state.hardware.gpu?.damage || 0;
    damage += gpuBonus;
    
    return Math.max(0, damage);
  }

  // 计算最终护盾
  calculateShield(baseShield: number): number {
    let shield = baseShield;
    
    // 敏捷加成
    if (this.modifiers.dexterity > 0) {
      shield = Math.floor(shield * (1 + this.modifiers.dexterity * 0.25));
    }
    
    return shield;
  }

  // 造成伤害
  dealDamage(damage: number, targetIndex: number = 0, options: {
    ignoreShield?: boolean;
    isAOE?: boolean;
    repeat?: number;
  } = {}): void {
    const finalDamage = this.calculateDamage(damage);
    const targets = options.isAOE ? this.state.currentEnemies : [this.state.currentEnemies[targetIndex]];
    const times = options.repeat || 1;
    
    for (let t = 0; t < times; t++) {
      targets.forEach((enemy) => {
        if (!enemy || enemy.currentHealth <= 0) return;
        
        // 检查免疫
        if (enemy.id === 'nullPointer' && enemy.special === 'pointerImmune' && !options.isAOE) {
          console.log('空指针异常免疫指向性攻击！');
          return;
        }
        
        // 易伤加成
        let actualDamage = finalDamage;
        if (this.modifiers.vulnerable > 0) {
          actualDamage = Math.floor(actualDamage * 1.5);
        }
        
        // 检查护盾
        if (!options.ignoreShield && (enemy as any).shield > 0) {
          const shield = (enemy as any).shield;
          if (shield >= actualDamage) {
            (enemy as any).shield -= actualDamage;
            actualDamage = 0;
          } else {
            actualDamage -= shield;
            (enemy as any).shield = 0;
          }
        }
        
        enemy.currentHealth = Math.max(0, enemy.currentHealth - actualDamage);
      });
    }
  }

  // 获得护盾
  gainShield(amount: number): void {
    const finalShield = this.calculateShield(amount);
    this.state.tempShield += finalShield;
  }

  // 恢复生命
  heal(amount: number): void {
    const char = this.state.characters[this.state.activeCharacterIndex];
    if (char) {
      char.currentEnergy = Math.min(char.maxEnergy, char.currentEnergy + amount);
    }
  }

  // 获得金钱
  gainMoney(amount: number): void {
    this.state.money += amount;
  }

  // 施加状态
  applyStatus(status: keyof CombatModifiers, amount: number, target: 'self' | 'enemy' | 'all' = 'enemy'): void {
    if (target === 'self') {
      (this.modifiers[status] as number) += amount;
    } else if (target === 'enemy') {
      // 敌人状态存储在敌人对象上
      this.state.currentEnemies.forEach(enemy => {
        if (!enemy) return;
        if (!(enemy as any).modifiers) (enemy as any).modifiers = createModifiers();
        ((enemy as any).modifiers[status] as number) += amount;
      });
    }
  }

  // 抽牌
  draw(count: number): void {
    drawCards(this.state, count);
  }

  // 弃牌
  discard(count: number, random: boolean = false): void {
    for (let i = 0; i < count && this.state.hand.length > 0; i++) {
      const index = random ? Math.floor(Math.random() * this.state.hand.length) : 0;
      const card = this.state.hand.splice(index, 1)[0];
      this.state.discard.push(card);
    }
  }

  // 执行额外效果
  executeExtraEffect(extraEffect: string, baseValue: number): void {
    const effects = extraEffect.split('_');
    
    switch (effects[0]) {
      case 'draw':
        this.draw(parseInt(effects[1]));
        break;
      case 'shield':
        this.gainShield(parseInt(effects[1]));
        break;
      case 'heal':
        this.heal(parseInt(effects[1]));
        break;
      case 'energy':
        this.state.currentCost += parseInt(effects[1]);
        break;
      case 'crit': {
        // 暴击处理
        const chance = parseInt(effects[1]); // 50
        const bonusDamage = parseInt(effects[2]); // 15
        if (Math.random() * 100 < chance) {
          this.dealDamage(bonusDamage, 0);
        }
        break;
      }
      case 'execute': {
        // 处决
        const threshold = parseInt(effects[1]); // 30
        const enemy = this.state.currentEnemies[0];
        if (enemy && enemy.currentHealth / enemy.maxHealth * 100 < threshold) {
          enemy.currentHealth = 0;
        }
        break;
      }
      case 'repeat': {
        // 重复攻击
        if (effects[1] === 'per' && effects[2] === 'card') {
          const times = this.state.cardsPlayedThisTurn;
          for (let i = 0; i < times; i++) {
            this.dealDamage(baseValue, 0);
          }
        } else {
          const times = parseInt(effects[1]);
          for (let i = 1; i < times; i++) {
            this.dealDamage(baseValue, 0);
          }
        }
        break;
      }
      case 'next': {
        // 下次效果
        if (effects[1] === 'attack' && effects[2] === 'plus') {
          this.modifiers.nextAttackBonus += parseInt(effects[3]);
        } else if (effects[1] === 'attack' && effects[2] === 'double') {
          this.modifiers.nextAttackDouble = true;
        } else if (effects[1] === 'turn' && effects[2] === 'energy') {
          this.state.nextTurnCostPenalty = -parseInt(effects[3]);
        }
        break;
      }
      case 'apply': {
        // 施加状态
        const status = effects[1] as keyof CombatModifiers;
        const amount = parseInt(effects[2]);
        const target = effects[3] === 'all' ? 'all' : 'enemy';
        this.applyStatus(status, amount, target as any);
        break;
      }
      case 'all': {
        // 全体效果
        if (effects[1] === 'weak') {
          this.applyStatus('weak', parseInt(effects[2]), 'all');
        }
        break;
      }
      case 'exhaust':
        // 消耗标记
        break;
      case 'innate':
        // 固有标记
        break;
      default:
        console.log('未实现的效果:', extraEffect);
    }
  }

  // 执行完整卡牌效果
  executeCard(card: Card, targetIndex: number = 0): void {
    const { effect } = card;
    
    switch (effect.type) {
      case 'damage':
        this.dealDamage(effect.value, targetIndex, {
          ignoreShield: effect.extraEffect?.includes('ignore_shield'),
          isAOE: effect.target === 'all',
          repeat: effect.extraEffect?.includes('strike_twice') ? 2 : 
                  effect.extraEffect?.includes('strike_thrice') ? 3 : 1,
        });
        break;
        
      case 'shield':
        this.gainShield(effect.value);
        break;
        
      case 'draw':
        this.draw(effect.value);
        break;
        
      case 'heal':
        this.heal(effect.value);
        break;
        
      case 'money':
        this.gainMoney(effect.value);
        break;
        
      case 'special':
        // 特殊效果由 extraEffect 处理
        break;
    }
    
    // 执行额外效果
    if (effect.extraEffect) {
      this.executeExtraEffect(effect.extraEffect, effect.value);
    }
  }
}

// ==================== 便捷函数 ====================

// 卡牌颜色映射
export const cardTypeColors: Record<string, string> = {
  attack: 'bg-red-500',
  defense: 'bg-blue-500',
  skill: 'bg-green-500',
  special: 'bg-purple-500'
};

// 卡牌边框颜色
export const cardRarityBorders: Record<string, string> = {
  common: 'border-gray-400',
  rare: 'border-blue-400',
  epic: 'border-purple-400'
};

// 卡牌背景渐变
export const cardTypeGradients: Record<string, string> = {
  attack: 'from-red-500/20 to-red-600/10',
  defense: 'from-blue-500/20 to-blue-600/10',
  skill: 'from-green-500/20 to-green-600/10',
  special: 'from-purple-500/20 to-purple-600/10'
};

// 图标映射（用于动态导入）
export const iconMapping: Record<string, string> = {
  // 攻击图标
  'Crosshair': 'Crosshair',
  'Sword': 'Sword',
  'Fist': 'HandMetal',
  'Hammer': 'Hammer',
  'Pickaxe': 'Pickaxe',
  'Wind': 'Wind',
  'Tornado': 'Tornado',
  'Radio': 'Radio',
  'Zap': 'Zap',
  'ArrowRight': 'ArrowRight',
  'ScanLine': 'ScanLine',
  'Droplets': 'Droplets',
  'Scissors': 'Scissors',
  'Target': 'Target',
  'Play': 'Play',
  'FastForward': 'FastForward',
  'Copy': 'Copy',
  'GitCommit': 'GitCommit',
  'Skull': 'Skull',
  'Flag': 'Flag',
  // 防御图标
  'Shield': 'Shield',
  'ShieldPlus': 'ShieldPlus',
  'ShieldCheck': 'ShieldCheck',
  'Castle': 'Castle',
  'Building2': 'Building2',
  'AlertTriangle': 'AlertTriangle',
  'RefreshCw': 'RefreshCw',
  'Swords': 'Swords',
  'Bomb': 'Bomb',
  'Heart': 'Heart',
  'Magnet': 'Magnet',
  'Users': 'Users',
  'CircleDot': 'CircleDot',
  'Lock': 'Lock',
  'FlipHorizontal': 'FlipHorizontal',
  'BatteryCharging': 'BatteryCharging',
  // 技能图标
  'Search': 'Search',
  'Scan': 'Scan',
  'Brain': 'Brain',
  'Eye': 'Eye',
  'Battery': 'Battery',
  'Power': 'Power',
  'Activity': 'Activity',
  'Recycle': 'Recycle',
  'Trash2': 'Trash2',
  'ArrowLeftRight': 'ArrowLeftRight',
  'Layers': 'Layers',
  'Settings': 'Settings',
  'Megaphone': 'Megaphone',
  'Coins': 'Coins',
  'Gem': 'Gem',
  'Clock': 'Clock',
  'Database': 'Database',
  // 角色图标
  'Feather': 'Feather',
  'Lightbulb': 'Lightbulb',
  'MessageCircle': 'MessageCircle',
  'Sparkles': 'Sparkles',
  'CloudRain': 'CloudRain',
  'Footprints': 'Footprints',
  'Volume2': 'Volume2',
  'BookOpen': 'BookOpen',
  'User': 'User',
  'Guitar': 'Guitar',
  'Plane': 'Plane',
  'Coffee': 'Coffee',
  'Moon': 'Moon',
  'Flame': 'Flame',
  'Drum': 'Drum',
  'HandCoins': 'HandCoins',
  'TrendingUp': 'TrendingUp',
  'Video': 'Video',
  'ShoppingBag': 'ShoppingBag',
  'Mask': 'Mask',
  'Briefcase': 'Briefcase',
  'Award': 'Award',
  'Banknote': 'Banknote',
  'Cat': 'Cat',
  'Bird': 'Bird',
  'Sun': 'Sun',
  'Trees': 'Trees',
  'Gift': 'Gift',
  'Wand2': 'Wand2',
  'Dice5': 'Dice5',
  'Shuffle': 'Shuffle',
  'Theater': 'Theater',
  'Smile': 'Smile',
  'Meh': 'Meh',
  'School': 'School',
  'Link': 'Link',
  'Mic': 'Mic',
  'Music': 'Music',
};
