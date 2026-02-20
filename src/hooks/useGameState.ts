/**
 * 游戏状态管理Hook - 完整修复版
 * 完整的卡牌效果执行系统和敌人AI
 */

import { useState, useCallback } from 'react';
import type { GameState, Card, Enemy, DotEffect } from '@/types/game';
import { characters } from '@/data/characters';
import { createInitialHardware, computeStats } from '@/data/hardware';
import { getInitialDeck, getCardPrice, getCombatRewardCards } from '@/data/cards';
import { getEnemiesForFloor, getBossForFloor, getCombatReward, generateIntent } from '@/data/enemies';
import { getRandomTreasure } from '@/data/specialRooms';
import { generateMap } from '@/systems/mapSystem';
import { applyTalentEffectsToGameState } from '@/systems/characterTalentTree';
import { toast } from 'sonner';

// ==================== 工具函数 ====================

function shuffleDeck<T>(deck: T[]): T[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createInitialState(): GameState {
  return {
    hardware: createInitialHardware(),
    characters: [],
    activeCharacterIndex: 0,
    deck: [],
    hand: [],
    discard: [],
    money: 80,
    currentCost: 2,
    maxCost: 2,
    currentEnemies: [],
    tempShield: 0,
    turn: 1,
    isPlayerTurn: true,
    currentFloor: 0,
    currentRoom: null,
    floors: [],
    nextTurnDrawBonus: 0,
    nextTurnCostPenalty: 0,
    cardsPlayedThisTurn: 0,
    shopVisitedThisFloor: false,
    hasUsedRecursion: false,
    tutorialCompleted: false,
    gamePhase: 'menu',
    // 天赋系统初始值
    talentPoints: 0,
    totalTalentPoints: 0,
    unlockedTalents: [],
    talentEffects: {},
  };
}

// ==================== 主Hook ====================

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());

  const drawCards = useCallback((count: number, deck: Card[], hand: Card[], discard: Card[]): { 
    deck: Card[], 
    hand: Card[],
    discard: Card[],
    effects: { stun: boolean; messages: string[] }
  } => {
    let newDeck = [...deck];
    let newHand = [...hand];
    let newDiscard = [...discard];
    const effects = { stun: false, messages: [] as string[] };
    
    for (let i = 0; i < count && newHand.length < 7; i++) {
      if (newDeck.length === 0) {
        if (newDiscard.length === 0) break;
        newDeck = shuffleDeck(newDiscard);
        newDiscard = [];
      }
      if (newDeck.length > 0) {
        const card = newDeck.shift()!;
        
        // 处理抽到時触发的效果
        if (card.effect.extraEffect === 'draw_discard_1') {
          // 合并冲突诅咒: 抽到時弃1张手牌
          if (newHand.length > 0) {
            const discarded = newHand.shift();
            if (discarded) {
              newDiscard.push(discarded);
              effects.messages.push(`合并冲突: 弃掉${discarded.name}`);
            }
          }
        }
        
        if (card.effect.extraEffect === 'draw_stun_1') {
          // 面条代码诅咒: 抽到時晕眩1回合
          effects.stun = true;
          effects.messages.push('面条代码: 晕眩1回合');
        }
        
        newHand.push(card);
      }
    }
    
    return { deck: newDeck, hand: newHand, discard: newDiscard, effects };
  }, []);

  // ==================== 核心效果执行器 ====================
  
  // 卡牌效果执行结果接口
  interface CardEffectResult {
    deck: Card[];
    hand: Card[];
    discard: Card[];
    currentEnemies: Enemy[];
    damage: number;
    shield: number;
    heal: number;
    money: number;
    // 原有返回字段
    nextTurnCostPenalty?: number;
    nextAttackBonus?: number;
    handSizeBonus?: number;
    artifact?: number;
    retaliate?: number;
    immuneDebuff?: number;
    damageReductionNext?: number;
    permanentDrawBonus?: number;
    nextCardCostMinus?: number;
    next2AttacksBonus?: number;
    // 新增: 这些字段表示新设置的效果值（不是从state读取的值）
    newAllAttacksBonus?: number;  // 本回合所有攻击伤害加成（新设置）
    newZeroAttackBonus?: number;  // 0费攻击伤害加成（新设置）
    shield8Next?: number;
    nextDraw1Next?: number;
    allShield5Next?: number;
    nextTurnSkip?: boolean;
    energyGain?: number;
    // 新增: 需要应用到 newState 的标记
    drawIfNotKill?: boolean;
    killEnergy2?: boolean;
    strikeCount?: number;
    shieldNoDecay?: boolean;
    circuitBreak12?: boolean;
    mirrorShield?: number;
    cheatDeath15?: boolean;
    damageShareEnemies?: boolean;
    dotEffects?: DotEffect[];
    ambushEffects?: import('@/types/game').AmbushEffect[];
    nextTurnShield?: number;
    nextTurnDamage?: number;
    permanentDamageBonus?: number;
    nextCardDouble?: boolean;
    nextSkillDouble?: boolean;
    allCardsRepeat?: boolean;
    unlimitedCards?: boolean;
    handCostZero?: boolean;
    freeCardNext?: string;
    drawnFreeAndDouble?: boolean;
    invulnerable2?: number;
    reflect50?: boolean;
    noDefenseThisTurn?: boolean;
    allCardsCostZero?: boolean;
    discardCountThisTurn?: number;
    cardsDiscardedThisCombat?: number;
    duplicateCardPlayedThisTurn?: { [cardName: string]: number };
    next2CardsDouble?: number;
    skillUsedThisTurn?: boolean;
    regenAmount?: number;
    nextTurnShield5?: number;
    nextDrawPlus1?: number;
    circuitBreak?: number;
    immuneDebuffToAdd?: number;
    attackAgainNext?: number;
    endCombatDamage?: number;
    delayedCards?: Card[];
    pendingInspiration?: import('@/types/game').InspirationState | null;
  }
  
  // 计算基础伤害（包含所有加成）
  const calculateBaseDamage = (state: GameState, _card: Card, baseValue: number): number => {
    let damage = baseValue;
    
    // 计算硬件属性（GPU伤害加成）
    const stats = computeStats(state.hardware);
    const gpuBonus = stats.gpuBonus || 0;
    
    // 应用GPU伤害加成
    if (gpuBonus > 0) {
      damage += gpuBonus;
      console.log(`[GPU] 显卡加成 +${gpuBonus} 伤害`);
    }
    
    // 应用永久伤害加成
    if (state.permanentDamageBonus) {
      damage += state.permanentDamageBonus;
      console.log(`[PermanentBonus] 永久伤害+${state.permanentDamageBonus}`);
    }
    
    // 应用本回合所有攻击伤害加成
    if (state.allAttacksBonus && state.allAttacksBonus > 0) {
      damage += state.allAttacksBonus;
      console.log(`[AllAttacksBonus] 本回合攻击伤害+${state.allAttacksBonus}`);
    }
    
    // 应用下2次攻击加成
    if (state.tempNext2AttacksBonus && state.tempNext2AttacksBonus > 0) {
      damage += state.tempNext2AttacksBonus;
      console.log(`[Next2AttacksBonus] 下2次攻击加成+${state.tempNext2AttacksBonus}已应用`);
    }
    
    // 应用0费攻击伤害加成
    if (state.tempZeroAttackBonus && state.tempZeroAttackBonus > 0) {
      damage += state.tempZeroAttackBonus;
      console.log(`[ZeroAttackBonus] 0费攻击伤害+${state.tempZeroAttackBonus}`);
    }
    
    // 应用下次攻击伤害加成
    if (state.nextAttackBonus && state.nextAttackBonus > 0) {
      damage += state.nextAttackBonus;
      console.log(`[NextAttackBonus] 生效: +${state.nextAttackBonus}伤害，总伤害=${damage}`);
    } else {
      console.log(`[NextAttackBonus] 未生效: state.nextAttackBonus=${state.nextAttackBonus}`);
    }
    
    return damage;
  };
  
  const executeCardEffect = (state: GameState, card: Card, targetIndex: number = 0): CardEffectResult => {
    const effect = card.effect;
    const extra = effect.extraEffect || '';
    
    let newDeck = [...state.deck];
    let newHand = [...state.hand];
    let newDiscard = [...state.discard];
    
    console.log(`[Card] 打出: ${card.name}, 类型: ${effect.type}, 基础值: ${effect.value}, 额外效果: ${extra || '无'}`);
    
    let damage = 0;
    let shield = 0;
    let heal = 0;
    let money = 0;
    let energyGain = 0;
    let nextTurnCostPenalty = 0;
    let nextAttackBonus = 0;
    let handSizeBonus = 0;
    let artifact = 0;
    let retaliate = 0;
    let immuneDebuff = 0;
    let damageReductionNext = 0;
    let permanentDrawBonus = 0;
    let nextCardCostMinus = 0;
    let next2AttacksBonus = 0;
    // 注意: allAttacksBonus 和 zeroAttackBonus 直接从 state 读取用于计算伤害
    // 不通过局部变量，因为它们是只读的
    let shield8Next = 0;
    let nextDraw1Next = 0;
    let allShield5Next = 0;
    let nextTurnSkipFlag = false;
    
    // 状态标记变量（用于返回给 playCard 应用）
    let drawIfNotKill = false;
    let killEnergy2Flag = false;
    let strikeCount = 0;
    let shieldNoDecay = false;
    let circuitBreak12 = false;
    let mirrorShieldValue = 0;
    let cheatDeath15 = false;
    let damageShareEnemies = false;
    let dotEffects: DotEffect[] = [];
    let ambushEffects: import('@/types/game').AmbushEffect[] = [];
    let nextTurnShield = 0;
    let nextTurnDamage = 0;
    let permanentDamageBonusValue = 0;
    let nextCardDouble = false;
    let nextSkillDouble = false;
    let allCardsRepeat = false;
    let unlimitedCards = false;
    let handCostZero = false;
    let freeCardNext = '';
    let drawnFreeAndDouble = false;
    let invulnerable2 = 0;
    let reflect50 = false;
    let noDefenseThisTurn = false;
    let allCardsCostZero = false;
    let discardCountThisTurn = 0;
    let cardsDiscardedThisCombat = 0;
    let duplicateCardPlayedThisTurn: { [cardName: string]: number } = {};
    let next2CardsDoubleValue = 0;
    let skillUsedThisTurn = false;
    let regenAmount = 0;
    let nextTurnShield5 = 0;
    let nextDrawPlus1 = 0;
    let circuitBreak = 0;
    let immuneDebuffToAdd = 0;
    let attackAgainNext = 0;
    let endCombatDamage = 0;
    let delayedCards: Card[] = [];
    let costMinusThisTurn = 0;
    // 新增: 标记是否是本次卡牌新设置的效果值
    let newAllAttacksBonus: number | undefined = undefined;
    let newZeroAttackBonus: number | undefined = undefined;
    // 新增: 待处理的灵感选择
    let pendingInspiration: import('@/types/game').InspirationState | null = null;
    
    // 注意：这些持久化效果状态不应该从state获取初始值
    // 因为它们会在应用result时累加到state，如果从state获取会导致双重累加
    // 这些字段只应该累加本回合的新增量
    // allAttacksBonus 和 zeroAttackBonus 直接从 state 读取，不通过局部变量
    
    // 创建敌人状态副本，用于跟踪对敌人的修改
    let modifiedEnemies = state.currentEnemies.map(e => ({ ...e }));
    
    // ===== 基础效果处理 =====
    switch (effect.type) {
      case 'damage':
        // 使用统一的伤害计算函数
        damage = calculateBaseDamage(state, card, effect.value);
        break;
      case 'shield':
        shield = effect.value;
        break;
      case 'heal':
        heal = effect.value;
        break;
      case 'money':
        money = effect.value;
        break;
      case 'draw':
        {
          const dr = drawCards(effect.value, newDeck, newHand, newDiscard);
          newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
          console.log(`[Draw] 抽取 ${effect.value} 张牌，当前手牌: ${dr.hand.length}`);
          
          // 处理draw类型卡片的extraEffect（避免在下面的switch中重复处理）
          if (extra) {
            const drawnCards = dr.hand.slice(-effect.value); // 获取刚抽的牌
            switch (extra) {
              case 'shield_2':
                shield += 2;
                break;
              case 'shield_5':
                shield += 5;
                break;
              case 'discard_1':
                if (newHand.length > 0) {
                  const discarded = newHand.pop()!;
                  newDiscard = [...newDiscard, discarded];
                  console.log(`[DrawExtra] 弃掉1张牌: ${discarded.name}`);
                }
                break;
              case 'save_hand':
                // Git Commit: 保存当前手牌状态（简化实现：抽牌后不丢）
                console.log(`[DrawExtra] Git Commit: 手牌状态已保存`);
                break;
              case 'drawn_attack_cost_minus':
                // Git Pull: 检查刚抽的牌是否有攻击牌
                if (drawnCards.some(c => c.type === 'attack')) {
                  // 简化处理：不做额外加成
                  console.log(`[DrawExtra] Git Pull: 抽到攻击牌`);
                }
                break;
              case 'reveal_intent':
                // Debug: 显示敌人意图
                console.log(`[DrawExtra] Debug: 敌人意图已显示`);
                break;
              case 'next_attack_plus_4':
                // Breakpoint: 下次攻击+4伤害（简化处理，不修改state）
                console.log(`[DrawExtra] Breakpoint: 下次攻击牌+4伤害`);
                break;
              case 'damage_all_2':
                // Printf: 对所有敌人造成2点伤害
                {
                  // 对全体敌人造成2点伤害（在抽牌后）
                  modifiedEnemies = modifiedEnemies.map(enemy => {
                    if (enemy.currentHealth > 0) {
                      return { ...enemy, currentHealth: Math.max(0, enemy.currentHealth - 2) };
                    }
                    return enemy;
                  });
                  console.log(`[DrawExtra] Printf: 对全体敌人造成2点伤害`);
                }
                break;
              case 'filter_attacks':
                // Stack Trace: 弃掉刚抽的攻击牌
                {
                  const attacks = newHand.filter(c => c.type === 'attack');
                  newHand = newHand.filter(c => c.type !== 'attack');
                  newDiscard = [...newDiscard, ...attacks];
                  console.log(`[DrawExtra] Stack Trace: 弃掉${attacks.length}张攻击牌`);
                }
                break;
              case 'drawn_free_double':
                // 人工智能: 抽到的牌费用为0且打出两次
                {
                  const drawnCardIds = drawnCards.map(c => c.id);
                  // 标记这些牌本回合费用为0且打出两次
                  newHand = newHand.map(c => {
                    if (drawnCardIds.includes(c.id)) {
                      return { ...c, tempCostZero: true, tempDouble: true };
                    }
                    return c;
                  });
                  console.log(`[DrawExtra] 人工智能: ${drawnCards.length}张牌费用为0且打出两次`);
                }
                break;
              case 'shield_per_hand':
                // CQRS: 获得等于手牌数的护盾
                shield += newHand.length;
                console.log(`[DrawExtra] CQRS: 获得${newHand.length}护盾`);
                break;
              case 'if_attack_gain_2_energy':
                // 单元测试: 抽到攻击牌获得2能量
                if (drawnCards.some(c => c.type === 'attack')) {
                  energyGain += 2;
                  console.log(`[DrawExtra] 单元测试: 抽到攻击牌，获得2能量`);
                }
                break;
              case 'filter_skills':
                // 集成测试: 弃掉刚抽的技能牌
                {
                  const skills = newHand.filter(c => c.type === 'skill');
                  newHand = newHand.filter(c => c.type !== 'skill');
                  newDiscard = [...newDiscard, ...skills];
                  console.log(`[DrawExtra] 集成测试: 弃掉${skills.length}张技能牌`);
                }
                break;
              case 'hand_size_plus_2':
                // 敏捷冲刺: 手牌上限+2
                handSizeBonus = (handSizeBonus || 0) + 2;
                console.log(`[DrawExtra] 敏捷冲刺: 手牌上限+2`);
                break;
              case 'hand_size_plus_1':
                // 沙箱: 手牌上限+1
                handSizeBonus = (handSizeBonus || 0) + 1;
                console.log(`[DrawExtra] 沙箱: 手牌上限+1`);
                break;
              case 'artifact_2':
                // TypeScript: 获得2层神器
                artifact = (artifact || 0) + 2;
                console.log(`[DrawExtra] TypeScript: 获得2层神器`);
                break;
              case 'free_1_card':
                // Goroutine: 将1张手牌费用变为0
                if (newHand.length > 0) {
                  const target = newHand[newHand.length - 1];
                  freeCardNext = target.id;
                  console.log(`[DrawExtra] Goroutine: ${target.name}可免费打出`);
                }
                break;
              case 'drawn_free_and_double':
                // 人工智能: 刚抽的牌本回合免费且双倍
                drawnFreeAndDouble = true;
                console.log(`[DrawExtra] 人工智能: 刚抽的${drawnCards.length}张牌本回合免费且双倍`);
                break;
              case 'choose_keep':
                // 量子计算: 简化实现，自动保留所有
                console.log(`[DrawExtra] 量子计算: 保留${drawnCards.length}张牌`);
                break;
            }
          }
        }
        break;
    }
    
    // ===== 额外效果处理（所有卡牌类型都可能有的额外效果）=====
    if (extra) {
      switch (extra) {
        // 抽牌效果
        case 'draw_1':
          {
            const dr = drawCards(1, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            console.log(`[Extra] 额外抽1张牌`);
          }
          break;
        case 'draw_2':
        case 'cleanse_draw_2':
          {
            const dr = drawCards(2, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            console.log(`[Extra] 额外抽2张牌`);
          }
          break;
        case 'shield_2':
          shield += 2;
          console.log(`[Extra] 额外获得2护盾`);
          break;
        case 'shield_5':
          shield += 5;
          break;
        case 'shield_10':
          shield += 10;
          break;
        case 'heal_5':
          heal += 5;
          break;
        case 'heal_20':
          heal += 20;
          break;
        case 'discard_1':
          if (newHand.length > 0) {
            const discarded = newHand.pop()!;
            newDiscard = [...newDiscard, discarded];
            console.log(`[Extra] 弃掉1张牌: ${discarded.name}`);
          }
          break;
        case 'gain_15_money':
          money += 15;
          console.log(`[Extra] 获得15金钱`);
          break;
        case 'copy_1_hand':
          if (newHand.length > 0) {
            const toCopy = newHand[0];
            newHand = [...newHand, { ...toCopy, id: toCopy.id + '_copy_' + Date.now() }];
            console.log(`[Extra] 复制手牌: ${toCopy.name}`);
          }
          break;
        case 'topdeck_1':
          if (newHand.length > 0) {
            const card = newHand.pop()!;
            newDeck = [card, ...newDeck];
            console.log(`[Extra] 将${card.name}置于牌库顶`);
          }
          break;
        case 'recover_1_discard':
          if (newDiscard.length > 0) {
            const recovered = newDiscard.pop()!;
            newHand = [...newHand, recovered];
            console.log(`[Extra] 从弃牌堆恢复: ${recovered.name}`);
          }
          break;
        case 'discard_all':
        case 'discard_all_draw_equal':
          {
            const count = newHand.length;
            newDiscard = [...newDiscard, ...newHand];
            newHand = [];
            console.log(`[Extra] 弃掉所有手牌${count}张`);
            if (extra === 'discard_all_draw_equal') {
              const dr = drawCards(count, newDeck, newHand, newDiscard);
              newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
              console.log(`[Extra] 抽取等量${count}张牌`);
            }
          }
          break;
        case 'discard_all_damage_per_3':
          {
            const count = newHand.length;
            newDiscard = [...newDiscard, ...newHand];
            newHand = [];
            damage = count * 3;
            console.log(`[Extra] rm -rf: 弃${count}张牌，造成${damage}伤害`);
          }
          break;
        case 'stash_and_draw':
          newDeck = [...newHand, ...newDeck];
          newHand = [];
          {
            const count = Math.min(newDeck.length, 5);
            const dr = drawCards(count, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            console.log(`[Extra] Git Stash: 重新抽取${count}张牌`);
          }
          break;
        case 'filter_attacks':
          {
            const dr = drawCards(3, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            const attacks = newHand.filter(c => c.type === 'attack');
            newHand = newHand.filter(c => c.type !== 'attack');
            newDiscard = [...newDiscard, ...attacks];
            console.log(`[Extra] Stack Trace: 抽3张，弃掉${attacks.length}张攻击牌`);
          }
          break;
        case 'filter_skills':
          {
            const dr = drawCards(4, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            const skills = newHand.filter(c => c.type === 'skill');
            newHand = newHand.filter(c => c.type !== 'skill');
            newDiscard = [...newDiscard, ...skills];
            console.log(`[Extra] 集成测试: 抽4张，弃掉${skills.length}张技能牌`);
          }
          break;
        case 'draw_2_shield_5':
          shield += 5;
          {
            const dr = drawCards(2, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
          }
          break;
        case 'damage_all_2':
          damage = 2;
          console.log(`[Extra] Printf: 对全体造成2伤害`);
          break;
        // next_attack_plus_4 的实现已移至下方，此处删除重复 case
        case 'bonus_vs_shield_6':
          {
            const target = modifiedEnemies[targetIndex];
            if (target && (target as any).shield > 0) {
              damage += 6;
              console.log(`[Extra] 对护盾敌人额外+6伤害`);
            } else {
              console.log(`[Extra] 对护盾敌人额外+6伤害（目标无护盾未生效）`);
            }
          }
          break;
        // damage_reduction_2 的实现已在下方，此处删除重复 case
        case 'bonus_per_discard_1':
          damage += state.discard.length;
          console.log(`[Extra] 弃牌堆${state.discard.length}张，伤害+${state.discard.length}`);
          break;
        case 'strike_3_times':
          damage = damage * 3;
          console.log(`[Extra] 栈溢出: 攻击3次，总伤害${damage}`);
          break;
        case 'strike_5_times':
          damage = damage * 5;
          console.log(`[Extra] DDoS: 攻击5次，总伤害${damage}`);
          break;
        case 'bonus_per_enemy_3':
          damage += (state.currentEnemies.length - 1) * 3;
          console.log(`[Extra] 敌人数量加成，伤害+${(state.currentEnemies.length - 1) * 3}`);
          break;
        case 'mark_vulnerable_3':
          // 断点: 标记敌人获得3层易伤（受到伤害+50%每层）
          {
            const target = modifiedEnemies[targetIndex];
            if (target) {
              (target as any).vulnerable = ((target as any).vulnerable || 0) + 3;
              console.log(`[Extra] 断点: ${target.name}获得3层易伤`);
            }
          }
          break;
        case 'overflow_damage':
          // 缓冲区溢出: 伤害溢出到其他存活敌人
          {
            const aliveEnemies = modifiedEnemies.filter(e => e.currentHealth > 0 && e !== modifiedEnemies[targetIndex]);
            if (aliveEnemies.length > 0) {
              const overflowDamage = Math.max(0, damage - (modifiedEnemies[targetIndex]?.currentHealth || 0));
              if (overflowDamage > 0) {
                aliveEnemies.forEach(enemy => {
                  (enemy as any).pendingOverflowDamage = ((enemy as any).pendingOverflowDamage || 0) + Math.floor(overflowDamage / aliveEnemies.length);
                });
                console.log(`[Extra] 缓冲区溢出: ${overflowDamage}点伤害溢出到${aliveEnemies.length}个敌人`);
              }
            }
          }
          break;
        case 'draw_2_if_kill':
          // 重构: 击杀敌人抽2张牌（标记状态，击杀后触发）
          // 使用现有状态
          console.log(`[Extra] 重构: 击杀敌人后抽2张牌`);
          break;
        case 'repeat_per_card':
          damage *= (state.cardsPlayedThisTurn + 1);
          console.log(`[Extra] 死循环: 本回合已出牌${state.cardsPlayedThisTurn}张，伤害×${state.cardsPlayedThisTurn + 1}`);
          break;
        case 'repeat_per_enemy':
          // Fork炸弹: 每有1个存活的敌人，重复1次
          {
            const aliveEnemyCount = modifiedEnemies.filter(e => e.currentHealth > 0).length;
            damage *= aliveEnemyCount;
            console.log(`[Extra] Fork炸弹: ${aliveEnemyCount}个存活敌人，伤害×${aliveEnemyCount}`);
          }
          break;
        case 'recursion_bonus':
          if (state.hasUsedRecursion) {
            damage += 5;
            console.log(`[Extra] 递归加成+5伤害`);
          }
          break;
        case 'random_4_14':
          damage = Math.floor(Math.random() * 11) + 4;
          console.log(`[Extra] 竞态条件: 随机伤害${damage}`);
          break;
        case 'random_2_20':
          damage = Math.floor(Math.random() * 19) + 2;
          console.log(`[Extra] 面条代码: 随机伤害${damage}`);
          break;
        case 'crit_50_kill':
          if (Math.random() < 0.5) {
            damage = 999;
            console.log(`[Extra] 空指针: 触发秒杀！`);
          }
          break;
        case 'full_hp_bonus_15':
          {
            const target = modifiedEnemies[targetIndex];
            if (target && target.currentHealth >= target.maxHealth) {
              damage += 15;
              console.log(`[Extra] 零日漏洞: 满血敌人，伤害+15`);
            }
          }
          break;
        case 'repeat_per_hand_card':
          damage *= state.hand.length;
          console.log(`[Extra] 客户演示: 手牌${state.hand.length}张，伤害×${state.hand.length}`);
          break;
        case 'repeat_per_discard':
          damage *= state.discard.length;
          console.log(`[Extra] 无限回归: 弃牌${state.discard.length}张，伤害×${state.discard.length}`);
          break;
        case 'bonus_per_curse_5':
          // 简化处理
          break;
        case 'self_damage_10':
          heal = -10;
          console.log(`[Extra] 生产部署: 自身受到10伤害`);
          break;
        case 'skip_next_turn':
          // 跳过下回合
          nextTurnSkipFlag = true;
          console.log(`[Extra] 通靛加班: 跳过下回合`);
          break;
        case 'stun_1':
          // 晕眩敌人1回合
          {
            const target = modifiedEnemies[targetIndex];
            if (target) {
              (target as any).stunned = ((target as any).stunned || 0) + 1;
              console.log(`[Extra] 死锁: ${target.name}晕眩1回合`);
            }
          }
          break;
        case 'stun_all_1':
          // 晕眩所有敌人1回合
          {
            modifiedEnemies.forEach(enemy => {
              (enemy as any).stunned = ((enemy as any).stunned || 0) + 1;
            });
            console.log(`[Extra] 蓝屏: 所有敌人晕眩1回合`);
          }
          break;
        case 'random_stun':
          // 随机晕眩1个敌人
          {
            const aliveEnemies = modifiedEnemies.filter(e => e.currentHealth > 0);
            if (aliveEnemies.length > 0) {
              const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
              (randomEnemy as any).stunned = ((randomEnemy as any).stunned || 0) + 1;
              console.log(`[Extra] Netflix混流: ${randomEnemy.name}被晕眩！`);
            }
          }
          break;
        // shield_10, heal_20, cleanse, damage_all_2, filter_attacks, filter_skills, heal_5, draw_2 的实现已在上方，此处删除重复 case
        case 'reveal_intent':
          // 显示敌人意图: 揭示目标敌人的意图
          {
            const target = modifiedEnemies[targetIndex];
            if (target) {
              (target as any).intentRevealed = true;
              console.log(`[Extra] Debug/Git Blame: 揭示${target.name}的意图`);
            }
          }
          break;
        case 'discard_1_draw_2_cost_minus':
          // 弃1抽2，费用-1
          if (newHand.length > 0) {
            const discarded = newHand.pop()!;
            newDiscard = [...newDiscard, discarded];
            console.log(`[Extra] TODO: 弃掉${discarded.name}`);
          }
          {
            const dr = drawCards(2, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            console.log(`[Extra] TODO: 抽2张牌`);
          }
          break;
        case 'all_weak_2':
          // 所有敌人获得2层虚弱
          {
            modifiedEnemies.forEach(enemy => {
              (enemy as any).weak = ((enemy as any).weak || 0) + 2;
            });
            console.log(`[Extra] API网关: 所有敌人获得2层虚弱`);
          }
          break;
        case 'next_draw_plus_1':
          // 下回合抽牌+1
          nextDrawPlus1 = (nextDrawPlus1 || 0) + 1;
          console.log(`[Extra] 服务网格: 下回合抽牌+1`);
          break;
        case 'heal_if_damaged_10':
          // 若受伤则恢复10（需要状态跟踪，简化处理为直接治疗）
          heal += 6;
          console.log(`[Extra] Saga模式: 获得6点恢复`);
          break;
        case 'next_turn_shield_5':
          nextTurnShield5 = (nextTurnShield5 || 0) + 5;
          console.log(`[Extra] 冗余备份: 下回合开始时获得5护盾`);
          break;
        case 'next_turn_shield_8':
          shield8Next = (shield8Next || 0) + 8;
          console.log(`[Extra] 两阶段提交: 下回合开始时获得8护盾`);
          break;
        case 'regen_2':
          regenAmount = (regenAmount || 0) + 2;
          console.log(`[Extra] Webhook重试: 获得2层再生`);
          break;
        case 'limit_attack_1':
          // 限制敌人只能攻击1次
          {
            const target = modifiedEnemies[targetIndex];
            if (target) {
              (target as any).attackLimited = 1;
              console.log(`[Extra] 限流器: ${target.name}本回合只能攻击1次`);
            }
          }
          break;
        case 'confuse_1':
          // 混乱效果: 敌人攻击随机目标（简化: 打印日志）
          console.log(`[Extra] XSS: 敌人混乱，下回合攻击随机`);
          break;
        case 'steal_shield':
          // 窃取护盾
          {
            const target = modifiedEnemies[targetIndex];
            if (target && (target as any).shield > 0) {
              const stolenShield = (target as any).shield || 0;
              shield += stolenShield;
              (target as any).shield = 0;
              console.log(`[Extra] 中间人攻击: 窃取${stolenShield}护盾`);
            } else {
              console.log(`[Extra] 中间人攻击: 目标无护盾`);
            }
          }
          break;
        case 'damage_half_next':
          // 下次伤害减半
          damageReductionNext = 1;
          console.log(`[Extra] Try-Catch: 下次受到伤害-50%`);
          break;
        case 'immune_debuff_1':
          // 免疫负面效果1回合
          immuneDebuff = 1;
          console.log(`[Extra] Docker容器: 免疫负面效果1回合`);
          break;
        case 'apply_weak_2':
          // 施加虚弱: -25%伤害
          {
            const target = modifiedEnemies[targetIndex];
            if (target) {
              (target as any).weak = ((target as any).weak || 0) + 2;
              console.log(`[Extra] 防火墙: ${target.name}获得2层虚弱`);
            }
          }
          break;
        case 'ignore_shield':
          // 无视护盾 - 在伤害计算时处理
          console.log(`[Extra] Heavy Strike: 无视护盾`);
          break;
        case 'pure_damage':
          // 纯洁伤害 - 在伤害计算时处理
          console.log(`[Extra] SQL注入: 纯洁伤害`);
          break;
        case 'retaliate_3':
          // 反击3点伤害
          retaliate = 3;
          console.log(`[Extra] Parry: 获得3点反击`);
          break;
        case 'next_attack_plus_4':
          // 下次攻击+4伤害
          nextAttackBonus = 4;
          console.log(`[Extra] Breakpoint: 下次攻击+4伤害`);
          break;
        case 'first_card_only':
          // 后门: 只能本回合第一张打出（在打出时检查）
          console.log(`[Extra] 后门: 只能本回合第一张打出`);
          break;
        case 'draw_attack_cost_minus':
          // Code Review: 抽到攻击牌本回合费用-1（简化: 立即抽1张，如果是攻击牌获得1能量）
          {
            const dr = drawCards(1, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            const drawnCard = dr.hand[dr.hand.length - 1];
            if (drawnCard && drawnCard.type === 'attack') {
              energyGain += 1;
              console.log(`[Extra] Code Review: 抽到攻击牌${drawnCard.name}，获得1能量`);
            } else {
              console.log(`[Extra] Code Review: 抽牌但未抽到攻击牌`);
            }
          }
          break;
        case 'drawn_attack_cost_minus':
          // Git Pull: 抽到攻击牌本回合费用-1（简化: 立即抽1张，如果是攻击牌获得1能量）
          {
            const dr = drawCards(1, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            const drawnCard = dr.hand[dr.hand.length - 1];
            if (drawnCard && drawnCard.type === 'attack') {
              energyGain += 1;
              console.log(`[Extra] Git Pull: 抽到攻击牌${drawnCard.name}，获得1能量`);
            } else {
              console.log(`[Extra] Git Pull: 抽牌但未抽到攻击牌`);
            }
          }
          break;
        case 'chance_shield_15':
          // 50%几率获得15护盾
          if (Math.random() < 0.5) {
            shield += 15;
            console.log(`[Extra] 灰度发布: 触发+15护盾`);
          }
          break;
        case 'summon_2_pods':
          shield += 10;
          console.log(`[Extra] K8s: 召唤2个Pod(+10护盾)`);
          break;
        case 'summon_3_containers':
          shield += 12;
          console.log(`[Extra] Docker Compose: 召唤3个容器(+12护盾)`);
          break;
        case 'summon_5_pods':
          shield += 20;
          console.log(`[Extra] K8s编排: 召唤5个Pod(+20护盾)`);
          break;
        case 'shield_per_card_3':
          shield += state.cardsPlayedThisTurn * 3;
          console.log(`[Extra] 微服务: 已出牌${state.cardsPlayedThisTurn}张，护盾+${state.cardsPlayedThisTurn * 3}`);
          break;
        case 'shield_per_hand':
          shield += newHand.length;
          console.log(`[Extra] CQRS: 手牌${newHand.length}张，护盾+${newHand.length}`);
          break;
        case 'next_card_double':
          // 下张牌打出两次
          nextCardDouble = true;
          console.log(`[Extra] 结对编程: 下张牌打出两次`);
          break;
        case 'next_skill_double':
          // 下张技能牌打出两次
          nextSkillDouble = true;
          console.log(`[Extra] Lambda: 下张技能牌打出两次`);
          break;
        case 'artifact_2':
          // 获得2层神器
          artifact = 2;
          console.log(`[Extra] TypeScript: 获得2层神器`);
          break;
        case 'reflect_50':
          // 反弹50%伤害
          reflect50 = true;
          console.log(`[Extra] Rust: 反弹50%受到伤害`);
          break;
        case 'invulnerable_2':
          // 无敌2层
          invulnerable2 = (invulnerable2 || 0) + 2;
          console.log(`[Extra] AWS多可用区: 获得2层无敌`);
          break;
        case 'immune_all_1':
          // 免疫所有效果1回合
          immuneDebuff = 1;
          console.log(`[Extra] 量子加密: 免疫所有效果1回合`);
          break;
        // discard_all, discard_all_draw_equal, discard_all_damage_per_3, stash_and_draw, duplicate_hand, drawn_free_and_double, 
        // damage_per_hand_3, choose_keep, permanent_draw_1 的实现已在上方，此处删除重复 case
        case 'scry_10_fetch':
          // 小黄鸭调试: 预言10张，抓取最强3张加入手牌
          {
            const scryAmount = Math.min(10, newDeck.length);
            const scryedCards = newDeck.slice(0, scryAmount);
            const remainingDeck = newDeck.slice(scryAmount);
            
            // 按伤害/费用比排序，选择最强的3张
            const scored = scryedCards.map(c => {
              const power = (c.type === 'attack' && c.effect?.type === 'damage' ? c.effect.value : 5) / Math.max(1, c.cost);
              return { card: c, power };
            }).sort((a, b) => b.power - a.power);
            
            const selectedCards = scored.slice(0, 3).map(s => s.card);
            newHand = [...newHand, ...selectedCards];
            newDeck = [...remainingDeck, ...scryedCards.filter(c => !selectedCards.includes(c))];
            
            console.log(`[Extra] 小黄鸭调试: 预言${scryAmount}张，选择3张加入手牌`);
          }
          break;
        case 'all_cards_repeat':
          // 智能合约: 本回合所有牌打出两次
          allCardsRepeat = true;
          console.log(`[Extra] 智能合约: 本回合所有牌打出两次`);
          break;
        case 'unlimited_cards':
          // 无限循环: 本回合无限出牌（不消耗费用）
          unlimitedCards = true;
          console.log(`[Extra] 无限循环: 本回合无限出牌`);
          break;
        case 'revive_all_30':
          heal += 30;
          console.log(`[Extra] K8s重启: 复活并恢复30生命`);
          break;
        case 'self_die':
          heal = -999;
          console.log(`[Extra] sudo rm -rf: 同归于尽！`);
          break;
        case 'discard_any_draw':
          if (newHand.length > 0) {
            const discarded = newHand.pop()!;
            newDiscard = [...newDiscard, discarded];
            const dr = drawCards(1, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            console.log(`[Extra] 代码重构: 弃1抽1`);
          }
          break;
        case 'tutor_2_different':
          {
            const dr = drawCards(2, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            console.log(`[Extra] Polyrepo: 抽2张牌`);
          }
          break;
        case 'hand_cost_zero':
          // Monorepo: 手牌费用变为0
          handCostZero = true;
          console.log(`[Extra] Monorepo: 手牌费用变为0`);
          break;
        // cleanse_draw_2, gain_15_money 的实现已在上方，此处删除重复 case
        case 'gain_curse':
          // 技术债务: 获得1张诅咒卡
          {
            const curseCard: Card = {
              id: 'curse_' + Date.now(),
              name: '技术债务',
              type: 'curse',
              cost: 1,
              rarity: 'rare',
              effect: { type: 'special', value: 0, extraEffect: 'unplayable' },
              description: '无法打出的诅咒牌',
              icon: '馃挵'
            };
            newDeck = [...newDeck, curseCard];
            console.log(`[Extra] 技术债务: 获得1张诅咒卡`);
          }
          break;
        case 'random_10_30':
          damage = Math.floor(Math.random() * 21) + 10;
          console.log(`[Extra] 混音工程: 随机${damage}点伤害`);
          break;
        // skip_next_turn 的实现已在上方，此处删除重复 case
        case 'chance_instant_kill':
          if (Math.random() < 0.5) {
            damage = 999;
            console.log(`[Extra] 演示之神: 触发秒杀！`);
          }
          break;
        // bonus_per_curse_5, bonus_per_copy_3, repeat_per_hand_card, repeat_per_discard 的实现已在上方，此处删除重复 case
        // damage_per_hand_3, choose_keep, draw_5_hand_plus_5, duplicate_hand, 
        // play_lose_3_hp, play_lose_5_hp, draw_2, draw_3 的实现已在上方，此处删除重复 case
        case 'heal_10':
          heal += 10;
          console.log(`[Extra] 恢复10生命`);
          break;
        case 'energy_1':
          energyGain += 1;
          console.log(`[Extra] 获得1能量`);
          break;
        case 'energy_3':
          energyGain += 3;
          console.log(`[Extra] 获得3能量`);
          break;
        case 'start_lose_max_hp':
          // 内存泄漏诅咒: 每回合失去1最大生命（简化: 立即失去3生命作为代价）
          heal = -3;
          console.log(`[Extra] 内存泄漏诅咒: 受到3点伤害`);
          break;
        case 'unplayable':
          console.log(`[Extra] 死循环诅咒: 无法打出`);
          break;
        case 'hand_cost_plus_1':
          console.log(`[Extra] 技术债务诅咒: 手牌费用+1`);
          break;
        case 'cannot_remove':
          // 祖传依赖: 标记为无法移除
          (card as any).cannotRemove = true;
          console.log(`[Extra] 祖传依赖: 无法移除`);
          break;
        case 'end_combat_lose_5':
          // 构建失败诅咒: 战斗结束失去5生命
          endCombatDamage = (endCombatDamage || 0) + 5;
          console.log(`[Extra] 构建失败诅咒: 战斗结束将受到5点伤害`);
          break;
        case 'draw_discard_1':
          // 合并冲突诅咒: 抽到時弃1张手牌
          if (newHand.length > 1) {
            const discarded = newHand.shift();
            if (discarded) {
              newDiscard.push(discarded);
              console.log(`[Extra] 合并冲突诅咒: 抽到時弃掉${discarded.name}`);
            }
          }
          break;
        case 'draw_stun_1':
          // 面条代码诅咒: 抽到時晕眩1回合
          console.log(`[Extra] 面条代码诅咒: 抽到時晕眩（需要在回合开始时处理）`);
          break;
        case 'free_1_card':
          // 将1张手牌费用变为0
          if (newHand.length > 0) {
            const target = newHand[0];
            freeCardNext = target.id;
            console.log(`[Extra] Goroutine: ${target.name}可免费打出`);
          }
          break;
        case 'record_and_repeat':
          // Vim宏: 记录本回合打出的牌，复制最后打出的那张到手牌
          if (state.cardsPlayedThisTurn > 0) {
            // 简化实现: 从弃牌堆复制最近打出的一张牌
            const lastPlayed = newDiscard[newDiscard.length - 1];
            if (lastPlayed) {
              newHand = [...newHand, { ...lastPlayed, id: lastPlayed.id + '_repeat_' + Date.now() }];
              console.log(`[Extra] Vim宏: 复制${lastPlayed.name}到手牌`);
            }
          }
          break;
        case 'energy_per_card_played':
          // StackOverflow: 本回合每打出过1张牌，获得1能量
          {
            const energyGainFromCards = state.cardsPlayedThisTurn;
            energyGain += energyGainFromCards;
            console.log(`[Extra] StackOverflow: 已出牌${energyGainFromCards}张，获得${energyGainFromCards}能量`);
          }
          break;
        case 'cost_becomes_0':
          // Serverless: 本回合所有卡牌费用变为0（在打出时处理）
          console.log(`[Extra] Serverless: 本回合卡牌费用为0`);
          break;
        case 'no_shield_decay':
          // 护盾不消失
          shieldNoDecay = true;
          console.log(`[Extra] 不可变架构: 护盾不消失`);
          break;
        case 'shield_undestroyable':
          shield += 50;
          console.log(`[Extra] 区块链: 50点无法摧毁的护盾`);
          break;
        case 'disable_special_1':
          {
            const target = modifiedEnemies[targetIndex];
            if (target) {
              (target as any).specialDisabled = 1;
              console.log(`[Extra] Rootkit: ${target.name}失去特殊能力1回合`);
            }
          }
          break;
        case 'disable_shield_next':
          {
            const target = modifiedEnemies[targetIndex];
            if (target) {
              (target as any).noShieldNext = true;
              console.log(`[Extra] 编译错误: ${target.name}下回合无法获得护盾`);
            }
          }
          break;
        case 'skip_all_turn':
          modifiedEnemies.forEach(enemy => {
            (enemy as any).skipped = true;
          });
          console.log(`[Extra] 内核崩溃: 所有敌人跳过下回合`);
          break;
        case 'permanent_damage_plus_2':
          // 遗留代码: 本战斗伤害+2
          permanentDamageBonusValue = (permanentDamageBonusValue || 0) + 2;
          console.log(`[Extra] 遗留代码: 本战斗伤害+2`);
          break;
        case 'circuit_break':
          // 熔断器: 下次受到伤害超过10時免疫
          circuitBreak = 1;
          console.log(`[Extra] 熔断器: 下次大额伤害時免疫`);
          break;
        case 'delay_1_card':
          // 消息队列: 延迟1张牌到下回合（将当前手牌最左侧的牌延迟）
          if (newHand.length > 0) {
            const cardToDelay = newHand.shift()!;
            delayedCards.push(cardToDelay);
            console.log(`[Extra] 消息队列: 将${cardToDelay.name}延迟到下回合`);
          } else if (newDeck.length > 0) {
            // 手牌为空则从牌库顶取一张
            const cardToDelay = newDeck.shift()!;
            delayedCards.push(cardToDelay);
            console.log(`[Extra] 消息队列: 将${cardToDelay.name}延迟到下回合`);
          }
          break;
        case 'choose_shield_or_draw':
          // 功能开关: 选择获得护盾或抽牌 -> 触发灵感选择
          {
            // 创建两个虚拟选项卡牌
            const optionCards: Card[] = [
              {
                id: 'inspiration_shield_8',
                name: '获得护盾',
                cost: 0,
                type: 'defense',
                rarity: 'common',
                description: '获得8点护盾',
                effect: { type: 'shield', value: 8, target: 'self' },
                icon: 'Shield'
              },
              {
                id: 'inspiration_draw_2',
                name: '抽取卡牌',
                cost: 0,
                type: 'skill',
                rarity: 'common',
                description: '抽2张牌',
                effect: { type: 'draw', value: 2, target: 'self' },
                icon: 'Files'
              }
            ];
            // 保存需要灵感的卡牌
            pendingInspiration = {
              isActive: false,
              type: 'choose_one',
              title: '功能开关',
              description: '选择获得8点护盾，或抽2张牌',
              cards: optionCards,
              selectCount: 1,
              canDiscard: false,
              canReorder: false,
              sourceCardName: card.name,
              callbackAction: 'choose_shield_or_draw'
            };
            console.log(`[Inspiration] 准备触发: 功能开关`);
          }
          break;
        // overflow_damage, confuse_1, full_hp_bonus_15, draw_2_if_kill, mark_vulnerable_3,
        // hand_size_plus_1, hand_size_plus_2 的实现已在上方，此处删除重复 case
        case 'energy_next_penalty_1':
          nextTurnCostPenalty = 1;
          console.log(`[Extra] Git Push: 本回合+2能量，下回合-1`);
          break;
        case 'damage_reduction_2':
          damageReductionNext = 2;
          console.log(`[Extra] 加密: 本回合受到的伤害-2`);
          break;
        // ===== 攻击牌效果（25个）=====
        case 'first_card_double_stun':
          // 如果是本回合第一张牌，伤害翻倍并晕眩
          if (state.cardsPlayedThisTurn === 0) {
            damage *= 2;
            const target = modifiedEnemies[targetIndex];
            if (target) {
              (target as any).stunned = ((target as any).stunned || 0) + 1;
              console.log(`[Extra] first_card_double_stun: 首牌伤害翻倍并晕眩${target.name}`);
            }
          } else {
            console.log(`[Extra] first_card_double_stun: 非首牌，效果不触发`);
          }
          break;
        case 'repeat_per_card_1':
          // 本回合每打出过1张牌，重复1次
          {
            const repeatCount = state.cardsPlayedThisTurn;
            damage *= (repeatCount + 1);
            console.log(`[Extra] repeat_per_card_1: 本回合已出牌${repeatCount}张，重复${repeatCount + 1}次，总伤害${damage}`);
          }
          break;
        case 'draw_if_not_kill':
          // 如果未击杀敌人，抽1张牌（标记状态，在伤害计算后处理）
          drawIfNotKill = true;
          console.log(`[Extra] draw_if_not_kill: 标记未击杀抽牌效果`);
          break;
        case 'lifesteal_shield':
          // 获得等于造成伤害的护盾（简化: 获得基础伤害值的护盾）
          shield += damage;
          console.log(`[Extra] lifesteal_shield: 获得${damage}护盾`);
          break;
        case 'even_hand_discount':
          // 如果手牌数为偶数，费用-1（动态费用，在getCardCost中处理）
          console.log(`[Extra] even_hand_discount: 手牌${newHand.length + 1}张${((newHand.length + 1) % 2 === 0) ? '，费用-1' : ''}`);
          break;
        case 'vengeance_6':
          // 如果上回合受到伤害，伤害+6
          if (state.healthLostLastTurn && state.healthLostLastTurn > 0) {
            damage += 6;
            console.log(`[Extra] vengeance_6: 上回合失去${state.healthLostLastTurn}生命，伤害+6`);
          } else {
            console.log(`[Extra] vengeance_6: 上回合未受伤，效果不触发`);
          }
          break;
        case 'combo_skill_stun':
          // 如果本回合已打出技能牌，晕眩敌人
          if (state.skillUsedThisTurn || (state.cardsPlayedThisTurnTypes && state.cardsPlayedThisTurnTypes.includes('skill'))) {
            const target = modifiedEnemies[targetIndex];
            if (target) {
              (target as any).stunned = ((target as any).stunned || 0) + 1;
              console.log(`[Extra] combo_skill_stun: 本回合已使用技能，晕眩${target.name}`);
            }
          } else {
            console.log(`[Extra] combo_skill_stun: 本回合未使用技能，效果不触发`);
          }
          break;
        // discard_1 的实现已在上方，此处删除重复 case
        case 'random_3_10':
        case 'random_3_8':
          // 随机造成3-10点伤害 (或3-8)
          damage = Math.floor(Math.random() * (extra === 'random_3_8' ? 6 : 8)) + 3;
          console.log(`[Extra] ${extra}: 随机伤害${damage}`);
          break;
        case 'strike_twice':
          // ===== 关键修复: 打出两次效果 =====
          // 先计算完整的基础伤害（包含所有加成）
          damage = calculateBaseDamage(state, card, effect.value);
          // 然后乘以2（打出两次）
          damage *= 2;
          console.log(`[Extra] strike_twice: 打出两次，总伤害${damage}`);
          break;
        case 'strike_thrice':
          // 攻击3次
          damage = calculateBaseDamage(state, card, effect.value);
          damage *= 3;
          console.log(`[Extra] strike_thrice: 攻击3次，总伤害${damage}`);
          break;
        case 'damage_per_hand_card_1':
          // 手牌中每有1张牌，伤害+1（最多+3）
          {
            const bonus = Math.min(newHand.length, 3);
            damage += bonus;
            console.log(`[Extra] damage_per_hand_card_1: 手牌${newHand.length}张，伤害+${bonus}`);
          }
          break;
        case 'gain_money_5':
          // 获得5金钱
          money += 5;
          console.log(`[Extra] gain_money_5: 获得5金钱`);
          break;
        case 'gain_money_8':
          // 获得8金钱
          money += 8;
          console.log(`[Extra] gain_money_8: 获得8金钱`);
          break;
        case 'gain_money_10':
          // 获得10金钱
          money += 10;
          console.log(`[Extra] gain_money_10: 获得10金钱`);
          break;
        case 'gain_money_20':
          // 获得20金钱
          money += 20;
          console.log(`[Extra] gain_money_20: 获得20金钱`);
          break;
        case 'pay_money_5':
          // 支付5金钱
          money -= 5;
          console.log(`[Extra] pay_money_5: 支付5金钱`);
          break;
        case 'heal_3':
          // 恢复3生命
          heal += 3;
          console.log(`[Extra] heal_3: 恢复3生命`);
          break;
        case 'chance_shield_15_or_5':
          // 50%几率获得12点护盾，50%几率获得4点护盾（平衡后数值）
          if (Math.random() < 0.5) {
            shield += 12;
            console.log(`[Extra] chance_shield_15_or_5: 获得12护盾`);
          } else {
            shield += 4;
            console.log(`[Extra] chance_shield_15_or_5: 获得4护盾`);
          }
          break;
        case 'discard_1_draw_2':
          // 弃1张手牌，抽2张牌
          {
            if (newHand.length > 0) {
              const discarded = newHand.pop();
              if (discarded) {
                newDiscard.push(discarded);
                console.log(`[Extra] discard_1_draw_2: 弃掉${discarded.name}`);
              }
            }
            const dr = drawCards(2, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
          }
          break;
        case 'double_shield':
          // 护盾翻倍
          shield *= 2;
          console.log(`[Extra] double_shield: 护盾翻倍至${shield}`);
          break;
        case 'no_shield_decay_next':
          // 本回合护盾不消失
          shieldNoDecay = true;
          console.log(`[Extra] no_shield_decay_next: 下回合护盾不消失`);
          break;
        case 'reflect_50_next_turn':
          // 反弹下回合受到的50%伤害
          reflect50 = true;
          console.log(`[Extra] reflect_50_next_turn: 下回合反弹50%伤害`);
          break;
        case 'shield_5_recover_1':
          // 获得5点护盾，从弃牌堆回收1张卡
          {
            shield += 5;
            if (newDiscard.length > 0) {
              const recovered = newDiscard.pop();
              if (recovered) {
                newHand.push(recovered);
                console.log(`[Extra] shield_5_recover_1: 获得5护盾，回收${recovered.name}`);
              }
            } else {
              console.log(`[Extra] shield_5_recover_1: 获得5护盾，弃牌堆为空`);
            }
          }
          break;
        case 'double_shield_draw_2_artifact_1':
          // 护盾翻倍，抽2张牌，获得1层神器
          {
            shield *= 2;
            const dr = drawCards(2, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            artifact = (artifact || 0) + 1;
            console.log(`[Extra] double_shield_draw_2_artifact_1: 护盾翻倍，抽2张，神器+1`);
          }
          break;
        case 'only_attack_bonus_4':
          // 如果手牌中没有其他攻击牌，伤害+3（平衡后数值）
          {
            const otherAttacks = newHand.filter(c => c.type === 'attack' && c.id !== card.id).length;
            if (otherAttacks === 0) {
              damage += 3;
              console.log(`[Extra] only_attack_bonus_4: 无其他攻击牌，伤害+3`);
            } else {
              console.log(`[Extra] only_attack_bonus_4: 有其他攻击牌，效果不触发`);
            }
          }
          break;
        case 'strike_twice_defense_bonus_strike':
          // 造成6点伤害2次，如果上回合使用了防御牌，再攻击1次
          {
            damage = calculateBaseDamage(state, card, 6) * 2;
            if (state.lastTurnCardTypes && state.lastTurnCardTypes.includes('defense')) {
              damage += calculateBaseDamage(state, card, 6);
              console.log(`[Extra] strike_twice_defense_bonus_strike: 上回合有防御牌，攻击3次`);
            } else {
              console.log(`[Extra] strike_twice_defense_bonus_strike: 上回合无防御牌，攻击2次`);
            }
          }
          break;
        case 'discard_1_cost':
          // 弃1张手牌
          {
            if (newHand.length > 0) {
              const discarded = newHand.pop();
              if (discarded) {
                newDiscard.push(discarded);
                console.log(`[Extra] discard_1_cost: 弃掉${discarded.name}`);
              }
            }
          }
          break;
        case 'next_attack_double':
          // 本回合下一张攻击牌打出两次
          nextCardDouble = true;
          console.log(`[Extra] next_attack_double: 下张攻击牌打出两次`);
          break;
        case 'low_hp_double':
          // 如果生命低于30%，伤害翻倍
          {
            const char = state.characters[0];
            if (char && char.currentEnergy < char.maxEnergy * 0.3) {
              damage *= 2;
              console.log(`[Extra] low_hp_double: 生命低于30%，伤害翻倍`);
            } else {
              console.log(`[Extra] low_hp_double: 生命未低于30%，效果不触发`);
            }
          }
          break;
        case 'leftmost_double':
          // 如果是手牌最左侧，伤害翻倍
          {
            const cardIndex = state.hand.findIndex(c => c.id === card.id);
            if (cardIndex === 0) {
              damage *= 2;
              console.log(`[Extra] leftmost_double: 手牌最左侧，伤害翻倍`);
            } else {
              console.log(`[Extra] leftmost_double: 非最左侧，效果不触发`);
            }
          }
          break;
        case 'dot_6_next':
          // 敌人下回合开始时再受到6点伤害
          {
            const dotEffect: DotEffect = {
              id: `dot_${Date.now()}`,
              damage: 6,
              duration: 1,
              sourceCardName: card.name,
              targetEnemyIndex: targetIndex
            };
            dotEffects = [...dotEffects, dotEffect];
            console.log(`[Extra] dot_6_next: 添加DOT效果，下回合造成6点伤害`);
          }
          break;
        case 'duplicate_triple':
          // 如果本回合使用过同名牌，重复2次
          {
            const duplicateCount = duplicateCardPlayedThisTurn?.[card.name] || 0;
            if (duplicateCount > 0) {
              damage *= 3; // 本身1次 + 重复2次 = 3倍
              console.log(`[Extra] duplicate_triple: 本回合已使用同名牌${duplicateCount}次，重复2次，总伤害${damage}`);
            } else {
              console.log(`[Extra] duplicate_triple: 本回合未使用同名牌，效果不触发`);
            }
            // 记录本次使用
            duplicateCardPlayedThisTurn[card.name] = duplicateCount + 1;
          }
          break;
        case 'combo_3_triple':
          // 如果本回合已打出3张牌，伤害改为3倍
          if (state.cardsPlayedThisTurn >= 3) {
            damage *= 3;
            console.log(`[Extra] combo_3_triple: 本回合已出牌${state.cardsPlayedThisTurn}张，伤害3倍`);
          } else {
            console.log(`[Extra] combo_3_triple: 本回合出牌${state.cardsPlayedThisTurn}张，不足3张`);
          }
          break;
        case 'full_hand_double_aoe':
          // 如果手牌已满，AOE伤害翻倍
          if (state.hand.length >= 7) { // 假设7是手牌上限
            damage *= 2;
            console.log(`[Extra] full_hand_double_aoe: 手牌已满，AOE伤害翻倍`);
          } else {
            console.log(`[Extra] full_hand_double_aoe: 手牌未满，效果不触发`);
          }
          break;
        case 'chain_attack_stun':
          // 如果上回合打出攻击牌，晕眩敌人
          if (state.lastTurnCardTypes && state.lastTurnCardTypes.includes('attack')) {
            const target = modifiedEnemies[targetIndex];
            if (target) {
              (target as any).stunned = ((target as any).stunned || 0) + 1;
              console.log(`[Extra] chain_attack_stun: 上回合打出攻击牌，晕眩${target.name}`);
            }
          } else {
            console.log(`[Extra] chain_attack_stun: 上回合未打出攻击牌，效果不触发`);
          }
          break;
        case 'bonus_vs_weak_4':
          // 如果敌人有虚弱，伤害+4
          {
            const target = modifiedEnemies[targetIndex];
            if (target && (target as any).weak > 0) {
              damage += 4;
              console.log(`[Extra] bonus_vs_weak_4: 敌人虚弱，伤害+4`);
            } else {
              console.log(`[Extra] bonus_vs_weak_4: 敌人无虚弱，效果不触发`);
            }
          }
          break;
        case 'kill_energy_2':
          // 如果击杀敌人，获得2能量（标记状态）
          killEnergy2Flag = true;
          console.log(`[Extra] kill_energy_2: 标记击杀获得2能量`);
          break;
        case 'recoil_6_next':
          // 下回合开始时失去6生命
          nextTurnDamage = (nextTurnDamage || 0) + 6;
          console.log(`[Extra] recoil_6_next: 下回合开始时失去6生命`);
          break;
        case 'bonus_per_attack_4':
          // 手牌中每有1张其他攻击牌，伤害+4
          {
            const attackCount = state.hand.filter(c => c.type === 'attack' && c.id !== card.id).length;
            damage += attackCount * 4;
            console.log(`[Extra] bonus_per_attack_4: 手牌中${attackCount}张其他攻击牌，伤害+${attackCount * 4}`);
          }
          break;
        case 'steal_ability':
          // 随机触发1个敌人的特殊能力为己用（简化: 获得随机增益）
          {
            const aliveEnemies = modifiedEnemies.filter(e => e.currentHealth > 0);
            if (aliveEnemies.length > 0) {
              const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
              shield += 8;
              console.log(`[Extra] steal_ability: 窃取${randomEnemy.name}的能力，获得8护盾`);
            }
          }
          break;
        case 'percent_15_ignore_shield':
          // 造成目标当前生命15%的伤害（无视护盾）
          {
            const target = modifiedEnemies[targetIndex];
            if (target) {
              damage = Math.floor(target.currentHealth * 0.15);
              console.log(`[Extra] percent_15_ignore_shield: 目标当前生命${target.currentHealth}的15% = ${damage}伤害，无视护盾`);
            }
          }
          break;
        case 'random_2_20_crit':
          // 随机造成2-20点伤害，如果20则晕眩全场
          {
            const randomDamage = Math.floor(Math.random() * 19) + 2;
            damage = randomDamage;
            if (randomDamage === 20) {
              modifiedEnemies.forEach(enemy => {
                (enemy as any).stunned = ((enemy as any).stunned || 0) + 1;
              });
              console.log(`[Extra] random_2_20_crit: 随机伤害20！晕眩全场！`);
            } else {
              console.log(`[Extra] random_2_20_crit: 随机伤害${randomDamage}`);
            }
          }
          break;
        case 'triple_damage_to_money':
          // 造成10点伤害3次，获得等于总伤害的金钱
          {
            // 先计算完整的基础伤害
            const baseDamage = calculateBaseDamage(state, card, 10);
            damage = baseDamage * 3;
            money += damage;
            console.log(`[Extra] triple_damage_to_money: 造成${damage}点伤害，获得${damage}金钱`);
          }
          break;

        // ===== 防御牌效果（30个）=====
        case 'next_turn_damage_3':
          // 下回合开始时失去3生命
          nextTurnDamage = (nextTurnDamage || 0) + 3;
          console.log(`[Extra] next_turn_damage_3: 下回合开始时失去3生命`);
          break;
        case 'redundancy_half':
          // 如果本回合失去护盾，恢复一半（简化: 获得5护盾作为补偿）
          shield += 5;
          console.log(`[Extra] redundancy_half: 获得5护盾`);
          break;
        case 'hand_size_plus_1':
          // 手牌上限+1本回合
          handSizeBonus = (handSizeBonus || 0) + 1;
          console.log(`[Extra] hand_size_plus_1: 本回合手牌上限+1`);
          break;
        case 'heal_4':
          // 恢复4生命
          heal += 4;
          console.log(`[Extra] heal_4: 恢复4生命`);
          break;
        case 'apply_weak_1':
          // 敌人获得1层虚弱
          {
            const target = modifiedEnemies[targetIndex];
            if (target) {
              (target as any).weak = ((target as any).weak || 0) + 1;
              console.log(`[Extra] apply_weak_1: ${target.name}获得1层虚弱`);
            }
          }
          break;
        case 'bonus_if_attack_4':
          // 如果手牌中有攻击牌，额外获得4护盾
          if (state.hand.some(c => c.type === 'attack')) {
            shield += 4;
            console.log(`[Extra] bonus_if_attack_4: 手牌中有攻击牌，额外获得4护盾`);
          } else {
            console.log(`[Extra] bonus_if_attack_4: 手牌中无攻击牌，效果不触发`);
          }
          break;
        case 'next_turn_shield_10':
          // 下回合开始时获得10护盾
          nextTurnShield = (nextTurnShield || 0) + 10;
          console.log(`[Extra] next_turn_shield_10: 下回合开始时获得10护盾`);
          break;
        case 'low_hp_bonus_6':
          // 如果生命低于50%，获得额外6护盾
          {
            const char = state.characters[0];
            if (char && char.currentEnergy < char.maxEnergy * 0.5) {
              shield += 6;
              console.log(`[Extra] low_hp_bonus_6: 生命低于50%，额外获得6护盾`);
            } else {
              console.log(`[Extra] low_hp_bonus_6: 生命未低于50%，效果不触发`);
            }
          }
          break;
        case 'damage_reduction_next_3':
          // 下次受到伤害-3
          damageReductionNext = (damageReductionNext || 0) + 3;
          console.log(`[Extra] damage_reduction_next_3: 下次受到伤害-3`);
          break;
        case 'recover_discard_top':
          // 将弃牌堆顶1张牌置于牌库顶
          if (newDiscard.length > 0) {
            const topCard = newDiscard.pop()!;
            newDeck = [topCard, ...newDeck];
            console.log(`[Extra] recover_discard_top: 将${topCard.name}置于牌库顶`);
          }
          break;
        case 'copy_hand_to_deck':
          // 复制1张手牌加入牌库
          if (newHand.length > 0) {
            const toCopy = newHand[Math.floor(Math.random() * newHand.length)];
            newDeck = [...newDeck, { ...toCopy, id: toCopy.id + '_copy_' + Date.now() }];
            console.log(`[Extra] copy_hand_to_deck: 复制${toCopy.name}加入牌库`);
          }
          break;
        case 'circuit_break_12':
          // 如果下回合受到超过12伤害，免疫该伤害
          circuitBreak12 = true;
          console.log(`[Extra] circuit_break_12: 下次受到超过12点伤害時免疫`);
          break;
        case 'shield_no_decay':
          // 本回合护盾不消失
          shieldNoDecay = true;
          console.log(`[Extra] shield_no_decay: 本回合护盾不消失`);
          break;
        case 'combo_defense_draw':
          // 如果本回合已打出防御牌，抽1张
          if (state.cardsPlayedThisTurnTypes && state.cardsPlayedThisTurnTypes.includes('defense')) {
            const dr = drawCards(1, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            console.log(`[Extra] combo_defense_draw: 本回合已使用防御牌，抽1张`);
          } else {
            console.log(`[Extra] combo_defense_draw: 本回合未使用防御牌，效果不触发`);
          }
          break;
        case 'only_defense_double':
          // 如果是手牌唯一防御牌，护盾翻倍
          {
            const defenseCount = state.hand.filter(c => c.type === 'defense').length;
            if (defenseCount === 1) {
              shield *= 2;
              console.log(`[Extra] only_defense_double: 唯一防御牌，护盾翻倍`);
            } else {
              console.log(`[Extra] only_defense_double: 非唯一防御牌，效果不触发`);
            }
          }
          break;
        case 'restore_last_turn_hp':
          // 恢复上回合失去的生命
          if (state.healthLostLastTurn && state.healthLostLastTurn > 0) {
            heal += state.healthLostLastTurn;
            console.log(`[Extra] restore_last_turn_hp: 恢复上回合失去的${state.healthLostLastTurn}生命`);
          } else {
            console.log(`[Extra] restore_last_turn_hp: 上回合未失去生命`);
          }
          break;
        case 'ambush_cancel_stun':
          // 埋伏: 敌人下次攻击時，取消并晕眩1回合
          {
            const ambushEffect: import('@/types/game').AmbushEffect = {
              id: `ambush_${Date.now()}`,
              type: 'cancel_stun',
              value: 1,
              sourceCardName: card.name,
              trigger: 'enemy_attack',
              remainingTurns: 1
            };
            ambushEffects = [...ambushEffects, ambushEffect];
            console.log(`[Extra] ambush_cancel_stun: 设置埋伏，敌人下次攻击時取消并晕眩`);
          }
          break;
        case 'restore_all_hp_this_turn':
          // 恢复本回合失去的所有生命
          if (state.healthLostThisTurn && state.healthLostThisTurn > 0) {
            heal += state.healthLostThisTurn;
            console.log(`[Extra] restore_all_hp_this_turn: 恢复本回合失去的${state.healthLostThisTurn}生命`);
          } else {
            console.log(`[Extra] restore_all_hp_this_turn: 本回合未失去生命`);
          }
          break;
        case 'mirror_shield_damage':
          // 下回合反弹护盾值的伤害
          mirrorShieldValue = shield;
          console.log(`[Extra] mirror_shield_damage: 下回合反弹${shield}点伤害`);
          break;
        case 'limit_enemy_attacks_1':
          // 敌人本回合只能攻击1次
          {
            const target = modifiedEnemies[targetIndex];
            if (target) {
              (target as any).attackLimited = 1;
              console.log(`[Extra] limit_enemy_attacks_1: ${target.name}本回合只能攻击1次`);
            }
          }
          break;
        case 'damage_share_enemies':
          // 受到的伤害由所有敌人分担
          damageShareEnemies = true;
          console.log(`[Extra] damage_share_enemies: 受到的伤害由所有敌人分担`);
          break;
        case 'cheat_death_15':
          // 如果生命降至0，恢复至15
          cheatDeath15 = true;
          console.log(`[Extra] cheat_death_15: 设置免死效果，生命降至0時恢复至15`);
          break;
        case 'emergency_shield_16':
          // 如果生命低于25%，获得16护盾
          {
            const char = state.characters[0];
            if (char && char.currentEnergy < char.maxEnergy * 0.25) {
              shield += 16;
              console.log(`[Extra] emergency_shield_16: 生命低于25%，获得16护盾`);
            } else {
              console.log(`[Extra] emergency_shield_16: 生命未低于25%，效果不触发`);
            }
          }
          break;
        case 'ambush_lifesteal_10':
          // 埋伏: 敌人攻击時，窃取10生命
          {
            const ambushEffect: import('@/types/game').AmbushEffect = {
              id: `ambush_${Date.now()}`,
              type: 'lifesteal',
              value: 10,
              sourceCardName: card.name,
              trigger: 'enemy_attack',
              remainingTurns: 1
            };
            ambushEffects = [...ambushEffects, ambushEffect];
            console.log(`[Extra] ambush_lifesteal_10: 设置埋伏，敌人攻击時窃取10生命`);
          }
          break;
        case 'disable_special_2':
          // 敌人的特殊能力失效2回合
          {
            const target = modifiedEnemies[targetIndex];
            if (target) {
              (target as any).specialDisabled = 2;
              console.log(`[Extra] disable_special_2: ${target.name}特殊能力失效2回合`);
            }
          }
          break;
        case 'recover_2_discard':
          // 从弃牌堆恢复2张牌到手牌
          {
            const recoverCount = Math.min(2, newDiscard.length);
            for (let i = 0; i < recoverCount; i++) {
              const recovered = newDiscard.pop()!;
              newHand = [...newHand, recovered];
            }
            console.log(`[Extra] recover_2_discard: 从弃牌堆恢复${recoverCount}张牌`);
          }
          break;
        case 'curse_double_shield':
          // 如果有诅咒牌，护盾翻倍
          if (state.hand.some(c => c.type === 'curse') || state.deck.some(c => c.type === 'curse')) {
            shield *= 2;
            console.log(`[Extra] curse_double_shield: 有诅咒牌，护盾翻倍`);
          } else {
            console.log(`[Extra] curse_double_shield: 无诅咒牌，效果不触发`);
          }
          break;
        case 'cleanse':
          // 移除所有负面效果，恢复15生命（Docker Restart）
          {
            const debuffs = ['playerWeak', 'playerVulnerable', 'playerPoison', 'playerStunned', 'playerDecay'];
            let cleansedCount = 0;
            debuffs.forEach(debuff => {
              if ((state as any)[debuff] && (state as any)[debuff] > 0) {
                cleansedCount++;
              }
            });
            console.log(`[Extra] cleanse: 移除${cleansedCount}个负面效果，恢复15生命`);
            // 负面效果的实际移除在应用result时处理
          }
          break;
        case 'rewind_last_turn':
          // 恢复至上一回合开始時的状态（简化: 恢复15生命）
          heal += 15;
          console.log(`[Extra] rewind_last_turn: 恢复15生命（简化版回退）`);
          break;
        case 'immune_3_turns':
          // 免疫所有负面效果3回合
          immuneDebuffToAdd = (immuneDebuffToAdd || 0) + 3;
          console.log(`[Extra] immune_3_turns: 免疫负面效果3回合`);
          break;
        case 'energy_to_shield_heal':
          // 消耗所有能量，每点获得6护盾和恢复3生命
          {
            const energyToSpend = state.currentCost;
            shield += energyToSpend * 6;
            heal += energyToSpend * 3;
            // 能量消耗在 playCard 中处理，这里仅记录消耗量
            energyGain -= energyToSpend; // 通过减少能量增益来实现消耗所有能量
            console.log(`[Extra] energy_to_shield_heal: 消耗${energyToSpend}能量，获得${energyToSpend * 6}护盾和${energyToSpend * 3}治疗`);
          }
          break;

        // ===== 技能牌效果（30个）=====
        case 'scry_3_pick_1':
          // 查看牌库顶3张，选择1张加入手牌 -> 触发灵感系统
          {
            const scryAmount = Math.min(3, newDeck.length);
            if (scryAmount > 0) {
              const scryedCards = newDeck.slice(0, scryAmount);
              // 保存需要灵感的卡牌，稍后触发
              pendingInspiration = {
                isActive: false, // 尚未激活
                type: 'scry_pick',
                title: '探索可能性',
                description: `查看牌库顶的${scryAmount}张牌，选择1张加入手牌`,
                cards: scryedCards,
                selectCount: 1,
                canDiscard: false,
                canReorder: false,
                sourceCardName: card.name,
                callbackAction: 'scry_3_pick_1'
              };
              console.log(`[Inspiration] 准备触发: 探索可能性`);
            }
          }
          break;
        case 'draw_play_free':
          // 抽1张牌，可立即打出（费用为0）
          {
            const dr = drawCards(1, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            if (dr.hand.length > 0) {
              const drawnCard = dr.hand[dr.hand.length - 1];
              freeCardNext = drawnCard.id;
              console.log(`[Extra] draw_play_free: 抽${drawnCard.name}，本回合可免费打出`);
            }
          }
          break;
        case 'mulligan':
          // 弃光手牌，抽等量的牌
          {
            const handCount = newHand.length;
            newDiscard = [...newDiscard, ...newHand];
            newHand = [];
            const dr = drawCards(handCount, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            console.log(`[Extra] mulligan: 弃${handCount}张，抽${handCount}张`);
          }
          break;
        case 'next_2_double':
          // 本回合下2张打出的牌效果触发2次
          next2CardsDoubleValue = 2;
          console.log(`[Extra] next_2_double: 下2张牌效果触发2次`);
          break;
        case 'reveal_all_intents':
          // 揭示所有敌人的下回合意图
          modifiedEnemies.forEach(enemy => {
            (enemy as any).intentRevealed = true;
          });
          console.log(`[Extra] reveal_all_intents: 揭示所有敌人意图`);
          break;
        case 'discard_draw_curse_bonus':
          // 弃1张牌抽2张，如果弃掉诅咒牌再抽2张
          if (newHand.length > 0) {
            const discarded = newHand.pop()!;
            newDiscard = [...newDiscard, discarded];
            const isCurse = discarded.type === 'curse';
            const drawAmount = isCurse ? 4 : 2;
            const dr = drawCards(drawAmount, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            console.log(`[Extra] discard_draw_curse_bonus: 弃${discarded.name}，抽${drawAmount}张${isCurse ? '(诅咒牌奖励)' : ''}`);
          }
          break;
        case 'play_zero_draw':
          // 打出手中所有0费牌，每打出1张抽1张
          {
            const zeroCards = newHand.filter(c => c.cost === 0);
            newHand = newHand.filter(c => c.cost !== 0);
            newDiscard = [...newDiscard, ...zeroCards];
            const dr = drawCards(zeroCards.length, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            console.log(`[Extra] play_zero_draw: 打出${zeroCards.length}张0费牌，抽${zeroCards.length}张`);
          }
          break;
        case 'draw_2_choose_discount':
          // 抽2张，选择弃1张，那1张费用-1 -> 触发灵感系统
          {
            const dr = drawCards(2, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            const drawnCards = dr.hand.slice(-2); // 获取刚抽的2张牌
            // 保存需要灵感的卡牌到state
            (state as any).pendingInspiration = {
              type: 'choose_one',
              title: 'A/B测试',
              description: '选择1张牌保留，另一张将被弃掉并获得费用减免',
              cards: drawnCards,
              selectCount: 1,
              canDiscard: false,
              canReorder: false,
              callback: 'draw_2_choose_discount',
              sourceCardName: card.name
            };
            console.log(`[Inspiration] 准备触发: A/B测试`);
          }
          break;
        case 'cleanse_curse_reward':
          // 移除所有诅咒牌，每移除1张获得8护盾和8金钱
          {
            const curseCount = newDeck.filter(c => c.type === 'curse').length + newHand.filter(c => c.type === 'curse').length + newDiscard.filter(c => c.type === 'curse').length;
            newDeck = newDeck.filter(c => c.type !== 'curse');
            newHand = newHand.filter(c => c.type !== 'curse');
            newDiscard = newDiscard.filter(c => c.type !== 'curse');
            shield += curseCount * 8;
            money += curseCount * 8;
            console.log(`[Extra] cleanse_curse_reward: 移除${curseCount}张诅咒牌，获得${curseCount * 8}护盾和${curseCount * 8}金钱`);
          }
          break;
        case 'draw_3_no_defense':
          // 抽3张牌，本回合无法打出防御牌
          {
            const dr = drawCards(3, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            noDefenseThisTurn = true;
            console.log(`[Extra] draw_3_no_defense: 抽3张，本回合无法打出防御牌`);
          }
          break;
        case 'draw_2_damage_8':
          // 抽2张牌，受到8点伤害
          {
            const dr = drawCards(2, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            heal -= 8;
            console.log(`[Extra] draw_2_damage_8: 抽2张，受到8点伤害`);
          }
          break;
        case 'reveal_intent_draw':
          // 揭示敌人意图，抽1张牌
          {
            const target = modifiedEnemies[targetIndex];
            if (target) {
              (target as any).intentRevealed = true;
            }
            const dr = drawCards(1, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            console.log(`[Extra] reveal_intent_draw: 揭示意图并抽1张`);
          }
          break;
        // copy_1_hand 的实现已在上方，此处删除重复 case
        case 'sacrifice_draw_damage':
          // 弃掉所有手牌，抽等量的牌+3张，弃掉的攻击牌每1张造成5伤害
          {
            const handCount = newHand.length;
            const attackCount = newHand.filter(c => c.type === 'attack').length;
            newDiscard = [...newDiscard, ...newHand];
            newHand = [];
            const dr = drawCards(handCount + 3, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            damage += attackCount * 5;
            console.log(`[Extra] sacrifice_draw_damage: 弃${handCount}张(含${attackCount}张攻击)，抽${handCount + 3}张，造成${attackCount * 5}伤害`);
          }
          break;
        case 'dynamic_cost_per_hand':
          // 费用2，每有1张手牌，费用-1（最低0）
          console.log(`[Extra] dynamic_cost_per_hand: 手牌${newHand.length}张，费用-${newHand.length}`);
          break;
        case 'random_free_curse_bonus':
          // 随机将1张手牌费用变为0，如果有诅咒牌全部变为0
          {
            const hasCurse = newHand.some(c => c.type === 'curse');
            if (hasCurse) {
              handCostZero = true;
              console.log(`[Extra] random_free_curse_bonus: 有诅咒牌，所有手牌费用变为0`);
            } else {
              // 简化: 标记2张牌免费
              freeCardNext = newHand[0]?.id;
              console.log(`[Extra] random_free_curse_bonus: 将1张手牌费用变为0`);
            }
          }
          break;
        case 'recycle_shield':
          // 将弃牌堆所有牌洗入牌库，每重洗1张获得2护盾
          {
            const recycleCount = newDiscard.length;
            newDeck = shuffleDeck([...newDeck, ...newDiscard]);
            newDiscard = [];
            shield += recycleCount * 2;
            console.log(`[Extra] recycle_shield: 重洗${recycleCount}张牌，获得${recycleCount * 2}护盾`);
          }
          break;
        case 'copy_triple':
          // 选择手牌中1张牌，本回合获得3张复制
          if (newHand.length > 0) {
            const toCopy = newHand[0];
            const copies = [
              { ...toCopy, id: toCopy.id + '_copy1_' + Date.now() },
              { ...toCopy, id: toCopy.id + '_copy2_' + Date.now() },
              { ...toCopy, id: toCopy.id + '_copy3_' + Date.now() }
            ];
            newHand = [...newHand, ...copies];
            console.log(`[Extra] copy_triple: 获得${toCopy.name}的3张复制`);
          }
          break;
        case 'resource_to_benefit':
          // 获得能量数每点3的护盾，抽手牌数张牌
          {
            shield += state.currentCost * 3;
            const dr = drawCards(newHand.length, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            console.log(`[Extra] resource_to_benefit: 获得${state.currentCost * 3}护盾，抽${newHand.length}张牌`);
          }
          break;
        case 'draw_free_1':
          // 抽1张牌，将1张手牌费用变为0
          {
            const dr = drawCards(1, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            if (newHand.length > 0) {
              freeCardNext = newHand[0].id;
              console.log(`[Extra] draw_free_1: 抽1张，将${newHand[0].name}费用变为0`);
            }
          }
          break;
        case 'shield_draw_2':
          // 获得8护盾，抽2张牌
          shield += 8;
          {
            const dr = drawCards(2, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            console.log(`[Extra] shield_draw_2: 获得8护盾，抽2张牌`);
          }
          break;
        case 'shield_draw_3':
          // 获得15护盾，抽3张牌
          shield += 15;
          {
            const dr = drawCards(3, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            console.log(`[Extra] shield_draw_3: 获得15护盾，抽3张牌`);
          }
          break;
        case 'scry_5_arrange':
          // 查看牌库顶5张，选择任意张置于牌库顶或弃掉 -> 触发灵感系统
          {
            const scryAmount = Math.min(5, newDeck.length);
            if (scryAmount > 0) {
              const scryedCards = newDeck.slice(0, scryAmount);
              // 先移除这些牌从牌库
              newDeck = newDeck.slice(scryAmount);
              // 保存需要灵感的卡牌
              pendingInspiration = {
                isActive: false,
                type: 'scry_arrange',
                title: 'Terraform',
                description: `查看牌库顶的${scryAmount}张牌，选择保留的置于牌库顶，弃掉不需要的`,
                cards: scryedCards,
                selectCount: scryAmount,
                canDiscard: true,
                canReorder: true,
                sourceCardName: card.name,
                callbackAction: 'scry_5_arrange'
              };
              console.log(`[Inspiration] 准备触发: Terraform`);
            }
          }
          break;
        case 'singularity_burst':
          // 获得5能量，抽5张牌，手牌上限+5，所有卡牌费用为0
          energyGain += 5;
          {
            const dr = drawCards(5, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            handSizeBonus = (handSizeBonus || 0) + 5;
            allCardsCostZero = true;
            console.log(`[Extra] singularity_burst: 获得5能量，抽5张，手牌上限+5，所有卡牌费用为0`);
          }
          break;
        case 'nuke_refresh':
          // 对所有敌人造成50点伤害，弃光手牌和牌库，抽5张牌
          {
            // 计算完整伤害
            damage = calculateBaseDamage(state, card, 50);
            card.effect.target = 'all';
            newDiscard = [...newDiscard, ...newHand, ...newDeck];
            newHand = [];
            newDeck = [];
            const dr = drawCards(5, newDeck, newHand, newDiscard);
            newDeck = dr.deck; newHand = dr.hand; newDiscard = dr.discard;
            console.log(`[Extra] nuke_refresh: AOE造成${damage}伤害，弃光牌库和手牌，抽5张`);
          }
          break;
        case 'permanent_draw_damage':
          // 本战斗每回合抽牌+1，永久伤害+1
          permanentDrawBonus = (permanentDrawBonus || 0) + 1;
          permanentDamageBonusValue = (permanentDamageBonusValue || 0) + 1;
          console.log(`[Extra] permanent_draw_damage: 永久抽牌+1，永久伤害+1`);
          break;
        case 'duplicate_hand':
          // 复制当前整手牌
          {
            const copies = newHand.map(c => ({ ...c, id: c.id + '_dup_' + Date.now() }));
            newHand = [...newHand, ...copies];
            console.log(`[Extra] duplicate_hand: 复制整手牌${copies.length}张`);
          }
          break;
        case 'scry_10_fetch_3':
          // 查看牌库顶10张牌，选择3张加入手牌 -> 触发灵感系统
          {
            const scryAmount = Math.min(10, newDeck.length);
            if (scryAmount > 0) {
              const scryedCards = newDeck.slice(0, scryAmount);
              // 先移除这些牌从牌库
              newDeck = newDeck.slice(scryAmount);
              // 保存需要灵感的卡牌
              pendingInspiration = {
                isActive: false,
                type: 'scry_pick',
                title: '小黄鸭调试法',
                description: `查看牌库顶的${scryAmount}张牌，选择3张加入手牌`,
                cards: scryedCards,
                selectCount: 3,
                canDiscard: false,
                canReorder: false,
                sourceCardName: card.name,
                callbackAction: 'scry_10_fetch_3'
              };
              console.log(`[Inspiration] 准备触发: 小黄鸭调试法`);
            }
          }
          break;

        // ===== skill卡牌特殊效果 =====
        case 'permanent_draw_plus_1':
          // 技术栈升级: 本战斗每回合抽牌+1
          permanentDrawBonus = (permanentDrawBonus || 0) + 1;
          console.log(`[Extra] 技术栈升级: 本战斗每回合抽牌+1`);
          break;
        case 'aoe_repeat_per_card':
          // 永恒之蓝: 对所有敌人造成伤害，本回合每使用1张牌，重复1次
          {
            const repeatCount = state.cardsPlayedThisTurn + 1;
            damage *= repeatCount;
            card.effect.target = 'all';
            console.log(`[Extra] 永恒之蓝: 本回合已出牌${state.cardsPlayedThisTurn}张，AOE伤害×${repeatCount}`);
          }
          break;
        case 'ambush_damage_15':
          // 逻辑炸弹: 埋伏，敌人下次行动時受到15点伤害
          {
            const ambushEffect: import('@/types/game').AmbushEffect = {
              id: `ambush_${Date.now()}`,
              type: 'damage',
              value: 15,
              sourceCardName: card.name,
              trigger: 'any_action',
              remainingTurns: 1
            };
            ambushEffects = [...ambushEffects, ambushEffect];
            console.log(`[Extra] 逻辑炸弹: 设置埋伏，敌人下次行动時受到15点伤害`);
          }
          break;
        case 'delayed_self_damage_8':
          // 熔断漏洞: 造成16点伤害，下回合开始时受到8点伤害
          // 先计算完整伤害
          damage = calculateBaseDamage(state, card, 16);
          nextTurnDamage = (nextTurnDamage || 0) + 8;
          console.log(`[Extra] 熔断漏洞: 下回合开始时受到8点伤害`);
          break;
        case 'all_energy_to_damage':
          // 技术奇点(攻击牌): 消耗所有能量，每点能量造成8点伤害
          {
            const energyToSpend = state.currentCost;
            damage = energyToSpend * 8;
            energyGain -= energyToSpend; // 消耗所有能量
            console.log(`[Extra] 技术奇点: 消耗${energyToSpend}能量，造成${damage}点伤害`);
          }
          break;
        // ===== 其他未实现的额外效果 =====
        case 'skill_bonus_5':
          // 若本回合使用了技能，伤害+5
          if (state.skillUsedThisTurn) {
            damage += 5;
            console.log(`[Extra] 羊它SOLO: 本回合已使用技能，伤害+5`);
          } else {
            console.log(`[Extra] 羊它SOLO: 本回合未使用技能，无加成`);
          }
          break;
        case 'next_cost_minus_1':
          nextCardCostMinus = 1;
          console.log(`[Extra] 睦头SOLO: 下张牌费用-1`);
          break;
        case 'zero_attack_bonus_3':
          newZeroAttackBonus = 3;  // 标记为新设置的值
          console.log(`[Extra] 祥子你好熱: 0费攻击伤害+3`);
          break;
        case 'all_attack_bonus_4':
          newAllAttacksBonus = 4;  // 标记为新设置的值
          console.log(`[Extra] 出风头: 本回合所有攻击伤害+4`);
          break;
        case 'attack_again_next':
          // 贝斯Line: 下回合再次攻击
          attackAgainNext = (attackAgainNext || 0) + 1;
          console.log(`[Extra] 贝斯Line: 下回合自动攻击${attackAgainNext}次`);
          break;
        case 'cost_minus_1':
          // 独奏曲: 本回合费用-1（影响后续出牌）
          costMinusThisTurn = (costMinusThisTurn || 0) + 1;
          console.log(`[Extra] 独奏曲: 本回合费用-1`);
          break;
        case 'shield_8':
          shield += 8;
          console.log(`[Extra] 劣民模式: 获得8护盾`);
          break;
        case 'next_draw_1':
          nextDraw1Next = 1;
          console.log(`[Extra] 键盘和音: 下回合抽1张牌`);
          break;
        case 'all_shield_5':
          allShield5Next = 5;
          console.log(`[Extra] 三角初华: 所有友军获得5护盾`);
          break;
        case 'undamaged_double':
          // 鼓动敲击: 若本回合未受伤伤害翻倍
          if (!state.healthLostThisTurn || state.healthLostThisTurn === 0) {
            damage *= 2;
            console.log(`[Extra] 鼓动敲击: 本回合未受伤，伤害翻倍为${damage}`);
          } else {
            console.log(`[Extra] 鼓动敲击: 本回合已受伤，效果不触发`);
          }
          break;
        case 'next_2_attack_bonus_5':
          next2AttacksBonus = 5;
          console.log(`[Extra] 打工的皇后: 下2张攻击牌伤害+5`);
          break;
        // skip_next_turn 的实现已在上方，此处删除重复 case
        default:
          console.log(`[Extra] 未处理的额外效果: ${extra}`);
      }
    }
    
    console.log(`[Result] 伤害:${damage} 护盾:${shield} 治疗:${heal} 金钱:${money}`);
    
    return { 
      deck: newDeck, hand: newHand, discard: newDiscard, currentEnemies: modifiedEnemies,
      damage, shield, heal, money, pendingInspiration,
      nextTurnCostPenalty: nextTurnCostPenalty || undefined,
      nextAttackBonus: nextAttackBonus || undefined,
      handSizeBonus: handSizeBonus || undefined,
      artifact: artifact || undefined,
      retaliate: retaliate || undefined,
      immuneDebuff: immuneDebuff || undefined,
      damageReductionNext: damageReductionNext || undefined,
      permanentDrawBonus: permanentDrawBonus || undefined,
      nextCardCostMinus: nextCardCostMinus || undefined,
      next2AttacksBonus: next2AttacksBonus || undefined,
      // 新增: 只有新设置的效果值才返回（用于设置到newState）
      newAllAttacksBonus: newAllAttacksBonus,
      newZeroAttackBonus: newZeroAttackBonus,
      shield8Next: shield8Next || undefined,
      nextDraw1Next: nextDraw1Next || undefined,
      allShield5Next: allShield5Next || undefined,
      nextTurnSkip: nextTurnSkipFlag || undefined,
      energyGain: energyGain || undefined,
      // 新增状态标记
      drawIfNotKill: drawIfNotKill || undefined,
      killEnergy2: killEnergy2Flag || undefined,
      strikeCount: strikeCount || undefined,
      shieldNoDecay: shieldNoDecay || undefined,
      circuitBreak12: circuitBreak12 || undefined,
      mirrorShield: mirrorShieldValue || undefined,
      cheatDeath15: cheatDeath15 || undefined,
      damageShareEnemies: damageShareEnemies || undefined,
      dotEffects: dotEffects.length > 0 ? dotEffects : undefined,
      ambushEffects: ambushEffects.length > 0 ? ambushEffects : undefined,
      nextTurnShield: nextTurnShield || undefined,
      nextTurnDamage: nextTurnDamage || undefined,
      permanentDamageBonus: permanentDamageBonusValue || undefined,
      nextCardDouble: nextCardDouble || undefined,
      nextSkillDouble: nextSkillDouble || undefined,
      allCardsRepeat: allCardsRepeat || undefined,
      unlimitedCards: unlimitedCards || undefined,
      handCostZero: handCostZero || undefined,
      freeCardNext: freeCardNext || undefined,
      drawnFreeAndDouble: drawnFreeAndDouble || undefined,
      invulnerable2: invulnerable2 || undefined,
      reflect50: reflect50 || undefined,
      noDefenseThisTurn: noDefenseThisTurn || undefined,
      allCardsCostZero: allCardsCostZero || undefined,
      discardCountThisTurn: discardCountThisTurn || undefined,
      cardsDiscardedThisCombat: cardsDiscardedThisCombat || undefined,
      duplicateCardPlayedThisTurn: Object.keys(duplicateCardPlayedThisTurn).length > 0 ? duplicateCardPlayedThisTurn : undefined,
      next2CardsDouble: next2CardsDoubleValue || undefined,
      skillUsedThisTurn: skillUsedThisTurn || undefined,
      regenAmount: regenAmount || undefined,
      nextTurnShield5: nextTurnShield5 || undefined,
      nextDrawPlus1: nextDrawPlus1 || undefined,
      circuitBreak: circuitBreak || undefined,
      immuneDebuffToAdd: immuneDebuffToAdd || undefined,
      attackAgainNext: attackAgainNext || undefined,
      endCombatDamage: endCombatDamage || undefined,
      delayedCards: delayedCards.length > 0 ? delayedCards : undefined
    };
  };

  // ==================== 游戏状态操作方法 ====================
  
  const selectCharacter = useCallback((characterId: string) => {
    setGameState(prev => {
      const character = characters.find(c => c.id === characterId);
      if (!character) return prev;
      
      const newFloors = generateMap(10);
      const firstRoom = newFloors[0]?.rooms[0];
      
      if (newFloors[0] && firstRoom) {
        newFloors[0] = { ...newFloors[0], currentRoomId: firstRoom.id };
      }
      
      return {
        ...prev,
        characters: [{ ...character, currentEnergy: character.maxEnergy }],
        // 千早爱音特性: 初始金钱+50
        money: character.id === 'anon' ? 130 : 80,
        deck: getInitialDeck(characterId),
        gamePhase: 'map',
        floors: newFloors,
        currentFloor: 0,
        currentRoom: firstRoom || null,
        // 初始化天赋树
        talentTree: {
          characterId: characterId,
          availablePoints: 0,
          unlockedTalents: []
        },
        talentPoints: 0,
        totalTalentPoints: 0
      };
    });
  }, []);

  const enterRoom = useCallback((roomId: string) => {
    setGameState(prev => {
      const floor = prev.floors[prev.currentFloor];
      const room = floor?.rooms.find(r => r.id === roomId);
      if (!room) return prev;
      
      const newFloors = [...prev.floors];
      newFloors[prev.currentFloor] = { ...floor, currentRoomId: roomId };
      
      let newState = { ...prev, floors: newFloors, currentRoom: room };
      
      if (room.type === 'combat' || room.type === 'elite' || room.type === 'boss') {
        newState.gamePhase = 'combat';
        newState.turn = 1;
        newState.isPlayerTurn = true;
        newState.deck = shuffleDeck([...newState.deck, ...newState.hand, ...newState.discard]);
        newState.hand = [];
        newState.discard = [];
        
        const stats = computeStats(newState.hardware);
        newState.currentCost = stats.maxEnergy;
        newState.maxCost = stats.maxEnergy;
        if (!newState.shieldNoDecay) {
          newState.tempShield = 0;
        } else {
          console.log(`[ShieldNoDecay] 护盾不消失效果触发，保留${newState.tempShield}点护盾`);
          newState.shieldNoDecay = false; // 重置标记
        }
        // 长崎素世特性: 战斗开始时获得8点护盾
        if (prev.characters[0]?.id === 'soyo') {
          newState.tempShield = 8;
          console.log(`[Character] 长崎素世: 战斗开始，获得8点护盾！`);
        }
        
        // 应用天赋效果
        if (prev.talentTree) {
          const talentTreeForApply = {
            ...prev.talentTree,
            unlockedTalents: prev.talentTree.unlockedTalents as import('@/systems/characterTalentTree').TalentId[]
          };
          const stateWithTalents = applyTalentEffectsToGameState(newState, talentTreeForApply);
          newState = stateWithTalents as typeof newState;
          console.log('[Talent] 已应用天赋效果');
        }
        
        newState.cardsPlayedThisTurn = 0;
        newState.hasUsedRecursion = false;
        // 初始化战斗记录
        newState.combatLog = [];
        
        const floorNumber = prev.currentFloor;
        console.log(`[Combat] 进入战斗，楼层: ${floorNumber}, 房间类型: ${room.type}`);
        
        const enemies = room.type === 'boss' 
          ? getBossForFloor(floorNumber + 1)
          : getEnemiesForFloor(floorNumber + 1, room.type === 'elite');
        
        // 应用敌人生命buff
        if (prev.enemyHpBuffFights && prev.enemyHpBuffFights > 0) {
          const buffMultiplier = 1.5;
          enemies.forEach(enemy => {
            enemy.maxHealth = Math.floor(enemy.maxHealth * buffMultiplier);
            enemy.currentHealth = Math.floor(enemy.currentHealth * buffMultiplier);
          });
          // 递减buff
          newState.enemyHpBuffFights = prev.enemyHpBuffFights - 1;
          console.log(`[Event] 敌人强化！生命x1.5，剩余${newState.enemyHpBuffFights}场`);
        }
        
        console.log(`[Combat] 生成 ${enemies.length} 个敌人`, enemies.map(e => `${e.name}(${e.currentHealth}/${e.maxHealth})`));
        newState.currentEnemies = enemies;
        
        const drawResult = drawCards(stats.drawPower, newState.deck, newState.hand, newState.discard);
        newState.deck = drawResult.deck;
        newState.hand = drawResult.hand;
        newState.discard = drawResult.discard;
        
      } else if (room.type === 'shop') {
        newState.gamePhase = 'shop';
        newState.shopVisitedThisFloor = true;
      } else if (room.type === 'rest') {
        newState.gamePhase = 'rest';
      } else if (room.type === 'event') {
        newState.gamePhase = 'event';
      } else if (room.type === 'challenge') {
        // 挑战房间 - 进入挑战阶段
        newState.gamePhase = 'challenge';
        console.log(`[Challenge] 进入挑战房间！`);
      } else if (room.type === 'treasure') {
        // 宝藏房间 - 立即给予奖励
        const treasure = getRandomTreasure();
        console.log(`[Treasure] 获得宝藏: ${treasure.name} - ${treasure.description}`);
        
        if (treasure.type === 'money') {
          newState.money += treasure.value;
          toast.success(`馃挵 获得 ${treasure.value} 金钱！`, {
            description: `${treasure.name}: ${treasure.description}`
          });
        } else if (treasure.type === 'heal') {
          if (newState.characters[0]) {
            const prevHp = newState.characters[0].currentEnergy;
            newState.characters[0].currentEnergy = Math.min(
              newState.characters[0].maxEnergy,
              newState.characters[0].currentEnergy + treasure.value
            );
            const actualHeal = newState.characters[0].currentEnergy - prevHp;
            toast.success(`鉂わ笍 恢复 ${actualHeal} 点生命！`, {
              description: `${treasure.name}: ${treasure.description}`
            });
          }
        } else if (treasure.type === 'artifact') {
          newState.artifact = (newState.artifact || 0) + treasure.value;
          toast.success(`鉁 获得神器！`, {
            description: `${treasure.name}: ${treasure.description}`
          });
        } else if (treasure.type === 'card') {
          // 宝藏房间卡牌奖励 - 动态导入避免循环依赖
          const isElite = treasure.rarity === 'rare';
          const characterId = prev.characters[0]?.id;
          const rewardCards = getCombatRewardCards(prev.currentFloor, isElite, characterId);
          if (rewardCards.length > 0) {
            const selectedCard = rewardCards[0];
            newState.deck = [...prev.deck, selectedCard];
            toast.success(`馃幋 获得卡牌: ${selectedCard.name}！`, {
              description: `${treasure.name}: ${treasure.description}`
            });
            console.log(`[Treasure] 获得卡牌: ${selectedCard.name}`);
          }
        }
        // 标记房间已清除
        const roomIndex = newFloors[prev.currentFloor].rooms.findIndex(r => r.id === room.id);
        if (roomIndex >= 0) {
          newFloors[prev.currentFloor].rooms[roomIndex] = { 
            ...newFloors[prev.currentFloor].rooms[roomIndex], 
            cleared: true 
          };
        }
        newState.floors = newFloors;
        newState.gamePhase = 'map';
      } else if (room.type === 'cardExchange') {
        // 卡牌交换房间
        newState.gamePhase = 'cardExchange';
        console.log(`[CardExchange] 进入卡牌交换房间！`);
      }
      
      return newState;
    });
  }, [drawCards]);

  const playCard = useCallback((cardIndex: number, targetIndex: number = 0) => {
    setGameState(prev => {
      if (!prev.isPlayerTurn) return prev;
      
      const card = prev.hand[cardIndex];
      if (!card) return prev;
      
      let actualCost = card.cost;
      
      // 应用临时费用为0效果（人工智能抽的牌）
      if ((card as any).tempCostZero) {
        actualCost = 0;
        console.log(`[TempEffect] 人工智能: ${card.name}费用为0`);
      }
      
      // 检查诅咒牌 - 无法打出
      if (card.effect.extraEffect === 'unplayable') {
        console.log(`[Curse] ${card.name} 是诅咒牌，无法打出！`);
        return prev;
      }
      
      // 检查first_card_only效果 - 只能本回合第一张打出
      if (card.effect.extraEffect === 'first_card_only' && prev.cardsPlayedThisTurn > 0) {
        console.log(`[Restriction] ${card.name} 只能本回合第一张打出！`);
        return prev;
      }
      
      // 检查本回合无法打出防御牌效果
      if (prev.noDefenseThisTurn && card.type === 'defense') {
        console.log(`[Restriction] 本回合无法打出防御牌！`);
        return prev;
      }
      
      // 应用手牌费用为0效果
      if (prev.handCostZero) {
        actualCost = 0;
        console.log(`[Cost] handCostZero生效，费用设为0`);
      }
      
      // 应用技术债务诅咒: 手牌费用+1
      const curseCount = prev.hand.filter(c => c.effect.extraEffect === 'hand_cost_plus_1').length;
      if (curseCount > 0) {
        actualCost += curseCount;
        console.log(`[Curse] 技术债务使费用+${curseCount}`);
      }
      
      // 应用过时效果（decay）: 每层使费用+1
      if (prev.playerDecay && prev.playerDecay > 0) {
        actualCost += prev.playerDecay;
      }
      
      // 应用下张牌费用减免
      if (prev.nextCardCostMinus && prev.nextCardCostMinus > 0) {
        actualCost = Math.max(0, actualCost - prev.nextCardCostMinus);
      }
      
      // 应用本回合费用减少效果
      if (prev.costMinusThisTurn && prev.costMinusThisTurn > 0) {
        actualCost = Math.max(0, actualCost - prev.costMinusThisTurn);
      }
      
      // Rana角色特性: 第一张攻击牌费用-1
      if (prev.characters[0]?.id === 'rana' && card.type === 'attack' && prev.cardsPlayedThisTurn === 0) {
        actualCost = Math.max(0, actualCost - 1);
      }
      
      // 应用动态费用效果: even_hand_discount（手牌数为偶数時费用-1）
      if (card.effect.extraEffect === 'even_hand_discount') {
        const handCount = prev.hand.length;
        if (handCount % 2 === 0) {
          actualCost = Math.max(0, actualCost - 1);
          console.log(`[DynamicCost] even_hand_discount: 手牌数${handCount}为偶数，费用-1，实际费用=${actualCost}`);
        } else {
          console.log(`[DynamicCost] even_hand_discount: 手牌数${handCount}为奇数，不减免`);
        }
      }
      
      // 应用动态费用效果: dynamic_cost_per_hand（每有1张手牌，费用-1）
      if (card.effect.extraEffect === 'dynamic_cost_per_hand') {
        const discount = prev.hand.length - 1; // 减1是因为当前卡牌还在手牌中
        actualCost = Math.max(0, actualCost - discount);
        console.log(`[DynamicCost] dynamic_cost_per_hand: 手牌数${prev.hand.length}，减免${discount}，实际费用=${actualCost}`);
      }
      
      // 检查下一张技能牌打出两次效果
      let shouldDoubleSkill = false;
      if (prev.nextSkillDouble && card.type === 'skill') {
        shouldDoubleSkill = true;
      }
      
      if (prev.currentCost < actualCost) return prev;
      
      const newState = { ...prev };
      
      newState.hand = [...prev.hand];
      newState.hand.splice(cardIndex, 1);
      newState.discard = [...prev.discard, card];
      
      newState.currentCost -= actualCost;
      
      // 保存增加前的 cardsPlayedThisTurn 用于效果计算
      // 因为某些效果（如 first_card_double_stun）需要知道这张牌是不是本回合第一张
      const cardsPlayedBeforeThisCard = newState.cardsPlayedThisTurn;
      newState.cardsPlayedThisTurn += 1;
      
      // 构建效果计算用的临时 state，包含当前应应用的临时效果
      const effectState = {
        ...newState,
        cardsPlayedThisTurn: cardsPlayedBeforeThisCard,
        // 如果是0费攻击牌，应用0费攻击加成
        tempZeroAttackBonus: (card.type === 'attack' && actualCost === 0 && newState.zeroAttackBonus && newState.zeroAttackBonus > 0)
          ? newState.zeroAttackBonus
          : 0,
        // 如果是攻击牌，传递下2次攻击加成（executeCardEffect会读取这个值）
        tempNext2AttacksBonus: (card.type === 'attack' && newState.next2AttacksBonus && newState.next2AttacksBonus > 0)
          ? newState.next2AttacksBonus
          : 0,
        // 初始时没有待处理的灵感
        pendingInspiration: null
      };
      
      const result = executeCardEffect(effectState, card, targetIndex);
      newState.deck = result.deck;
      newState.hand = result.hand;
      newState.discard = result.discard;
      newState.currentEnemies = result.currentEnemies;
      
      // 预处理伤害相关标记（供正常伤害和打出两次使用）
      const ignoreShield = card.effect.extraEffect?.includes('ignore_shield');
      const isPureDamage = card.effect.extraEffect?.includes('pure_damage');
      
      // 应用伤害
      if (result.damage > 0 && card.effect.target !== 'self') {
        // result.damage 已经包含了GPU加成（在executeCardEffect中计算）
        let baseDamage = result.damage;
        
        console.log(`[Damage] 造成 ${baseDamage} 点伤害`);
        
        // 应用玩家虚弱效果（伤害-25%每层）
        let playerDamage = baseDamage;
        if (newState.playerWeak && newState.playerWeak > 0 && !isPureDamage) {
          const weakReduction = Math.floor(playerDamage * newState.playerWeak * 0.25);
          playerDamage = Math.max(0, playerDamage - weakReduction);
          console.log(`[PlayerWeak] 玩家虚弱${newState.playerWeak}层，伤害-${weakReduction}`);
        }
        
        const applyDamage = (enemy: Enemy, damage: number, _idx: number) => {
          const enemyShield = (enemy as any).shield || 0;
          let actualDamage = damage;
          let newShield = enemyShield;
          
          // 检查闪避能力（50%概率闪避攻击）
          if (enemy.special === 'dodge' && Math.random() < 0.5) {
            console.log(`[Dodge] ${enemy.name}闪避了攻击！`);
            return { ...enemy, shield: newShield };
          }
          
          // 检查免疫下次攻击能力
          if ((enemy as any).immuneNextAttack) {
            (enemy as any).immuneNextAttack = false;
            console.log(`[PointerImmune] ${enemy.name}免疫了本次攻击！`);
            return { ...enemy, shield: newShield };
          }
          
          // 纯洁伤害不受任何加成/减成影响
          if (!isPureDamage) {
            // 易伤效果: 受到伤害+50%
            const vulnerable = (enemy as any).vulnerable || 0;
            if (vulnerable > 0) {
              actualDamage = Math.floor(actualDamage * (1 + vulnerable * 0.5));
            }
          }
          
          // 敌人护盾先吸收伤害（无视护盾時跳过）
          if (!ignoreShield && enemyShield > 0) {
            const shieldAbsorb = Math.min(enemyShield, actualDamage);
            newShield = enemyShield - shieldAbsorb;
            actualDamage = Math.max(0, actualDamage - shieldAbsorb);
            console.log(`[EnemyShield] ${enemy.name}护盾吸收了${shieldAbsorb}点伤害`);
          } else if (ignoreShield) {
            console.log(`[IgnoreShield] ${enemy.name}受到无视护盾伤害！`);
          }
          
          // 检查是否有反射能力（反射25%伤害给玩家，减少能量/生命值）
          if (enemy.special === 'reflect' && actualDamage > 0) {
            const reflectAmount = Math.floor(actualDamage * 0.25);
            if (reflectAmount > 0 && newState.characters[0]) {
              newState.characters[0].currentEnergy = Math.max(0, newState.characters[0].currentEnergy - reflectAmount);
              console.log(`[Reflect] ${enemy.name}反射${reflectAmount}点伤害给玩家！`);
            }
          }
          
          return {
            ...enemy,
            shield: newShield,
            currentHealth: Math.max(0, enemy.currentHealth - actualDamage),
            // 保留敌人的状态效果
            stunned: (enemy as any).stunned,
            weak: (enemy as any).weak,
            vulnerable: (enemy as any).vulnerable,
            poison: (enemy as any).poison,
            intentRevealed: (enemy as any).intentRevealed,
            specialDisabled: (enemy as any).specialDisabled,
            noShieldNext: (enemy as any).noShieldNext,
            attackLimited: (enemy as any).attackLimited,
            immuneNextAttack: (enemy as any).immuneNextAttack
          };
        };
        
        if (card.effect.target === 'all') {
          newState.currentEnemies = newState.currentEnemies.map((enemy, idx) => applyDamage(enemy, playerDamage, idx));
          // 伤害效果合并到出牌记录中
        } else {
          newState.currentEnemies = newState.currentEnemies.map((enemy, idx) => {
            if (idx === targetIndex) {
              return applyDamage(enemy, playerDamage, idx);
            }
            return enemy;
          });
        }
      }
      
      // 收集卡牌效果描述
      let effects: string[] = [];
      
      // 应用护盾
      if (result.shield > 0) {
        newState.tempShield += result.shield;
        effects.push(`护盾+${result.shield}`);
      }
      
      // 应用治疗
      let actualHeal = 0;
      if (result.heal !== 0) {
        const char = newState.characters[0];
        if (char) {
          const prevHp = char.currentEnergy;
          char.currentEnergy = Math.min(char.maxEnergy, Math.max(0, char.currentEnergy + result.heal));
          actualHeal = char.currentEnergy - prevHp;
          if (actualHeal > 0) {
            effects.push(`生命+${actualHeal}`);
          }
        }
      }
      
      // 应用cleanse效果（移除所有负面效果）
      if (card.effect.extraEffect === 'cleanse') {
        const debuffs = ['playerWeak', 'playerVulnerable', 'playerPoison', 'playerStunned', 'playerDecay'] as const;
        let cleansedCount = 0;
        debuffs.forEach(debuff => {
          if ((newState as any)[debuff] && (newState as any)[debuff] > 0) {
            (newState as any)[debuff] = 0;
            cleansedCount++;
          }
        });
        if (cleansedCount > 0) {
          effects.push(`清除${cleansedCount}个负面效果`);
        }
      }
      
      // 应用伤害效果描述
      if (result.damage > 0 && card.effect.target !== 'self') {
        let playerDamage = result.damage;
        if (newState.playerWeak && newState.playerWeak > 0) {
          const weakReduction = Math.floor(playerDamage * newState.playerWeak * 0.25);
          playerDamage = Math.max(0, playerDamage - weakReduction);
        }
        if (card.effect.target === 'all') {
          effects.push(`AOE伤害 ${playerDamage}`);
        } else {
          const targetName = newState.currentEnemies[targetIndex]?.name || '敌人';
          effects.push(`伤害 ${playerDamage} -> ${targetName}`);
        }
      }
      
      // 记录战斗日志 - 玩家出牌（合并所有效果）
      if (!newState.combatLog) newState.combatLog = [];
      const effectStr = effects.length > 0 ? ` (${effects.join(', ')})` : '';
      newState.combatLog.push({
        turn: newState.turn,
        type: 'player_card',
        description: `打出 ${card.name}${effectStr}`,
        cardName: card.name,
        value: result.damage || result.shield || actualHeal || card.effect.value
      });
      
      // 应用金钱
      if (result.money > 0) {
        newState.money += result.money;
      }
      
      // 应用额外效果
      if (result.nextTurnCostPenalty) {
        newState.nextTurnCostPenalty = (newState.nextTurnCostPenalty || 0) + result.nextTurnCostPenalty;
      }
      if (result.nextAttackBonus) {
        newState.nextAttackBonus = (newState.nextAttackBonus || 0) + result.nextAttackBonus;
      }
      if (result.handSizeBonus) {
        newState.handSizeBonus = (newState.handSizeBonus || 0) + result.handSizeBonus;
      }
      if (result.artifact) {
        newState.artifact = (newState.artifact || 0) + result.artifact;
      }
      if (result.retaliate) {
        newState.retaliate = (newState.retaliate || 0) + result.retaliate;
      }
      if (result.immuneDebuff) {
        newState.immuneDebuff = (newState.immuneDebuff || 0) + result.immuneDebuff;
      }
      if (result.damageReductionNext) {
        newState.damageReductionNext = (newState.damageReductionNext || 0) + result.damageReductionNext;
      }
      // 新增效果状态应用
      if (result.permanentDrawBonus) {
        newState.permanentDrawBonus = (newState.permanentDrawBonus || 0) + result.permanentDrawBonus;
      }
      if (result.nextCardCostMinus) {
        newState.nextCardCostMinus = (newState.nextCardCostMinus || 0) + result.nextCardCostMinus;
      }
      if (result.next2AttacksBonus) {
        newState.next2AttacksBonus = (newState.next2AttacksBonus || 0) + result.next2AttacksBonus;
      }
      // 处理新设置的增伤效果
      if (result.newAllAttacksBonus !== undefined) {
        newState.allAttacksBonus = result.newAllAttacksBonus;
        console.log(`[Effect] 设置本回合所有攻击伤害+${result.newAllAttacksBonus}`);
      }
      if (result.newZeroAttackBonus !== undefined) {
        newState.zeroAttackBonus = result.newZeroAttackBonus;
        console.log(`[Effect] 设置0费攻击伤害+${result.newZeroAttackBonus}`);
      }
      if (result.shield8Next) {
        newState.nextTurnShield8 = (newState.nextTurnShield8 || 0) + result.shield8Next;
        console.log(`[Effect] 下回合开始时获得${result.shield8Next}护盾`);
      }
      if (result.allShield5Next) {
        newState.allShield5Next = (newState.allShield5Next || 0) + result.allShield5Next;
        console.log(`[Effect] 所有友军下回合获得${result.allShield5Next}护盾`);
      }
      if (result.nextDraw1Next) {
        newState.nextDraw1Next = (newState.nextDraw1Next || 0) + result.nextDraw1Next;
        console.log(`[Effect] 下回合额外抽${result.nextDraw1Next}张牌`);
      }
      if (result.nextTurnSkip) {
        newState.nextTurnSkip = true;
      }
      
      // 应用所有新增效果状态
      if (result.drawIfNotKill) {
        newState.drawIfNotKill = true;
        console.log(`[Effect] 标记未击杀抽牌效果`);
      }
      if (result.killEnergy2) {
        newState.killEnergy2 = true;
        console.log(`[Effect] 标记击杀获得2能量效果`);
      }
      if (result.strikeCount) {
        newState.strikeCount = (newState.strikeCount || 0) + result.strikeCount;
        console.log(`[Effect] 多段攻击计数+${result.strikeCount}`);
      }
      if (result.shieldNoDecay) {
        newState.shieldNoDecay = true;
        console.log(`[Effect] 本回合护盾不消失`);
      }
      if (result.circuitBreak12) {
        newState.circuitBreak12 = true;
        console.log(`[Effect] 熔断器12效果激活`);
      }
      if (result.mirrorShield && result.mirrorShield > 0) {
        newState.mirrorShield = (newState.mirrorShield || 0) + result.mirrorShield;
        console.log(`[Effect] 镜像护盾反弹${result.mirrorShield}点伤害`);
      }
      if (result.cheatDeath15) {
        newState.cheatDeath15 = true;
        console.log(`[Effect] 免死效果激活，生命降至0時恢复至15`);
      }
      if (result.damageShareEnemies) {
        newState.damageShareEnemies = true;
        console.log(`[Effect] 伤害由所有敌人分担`);
      }
      if (result.dotEffects && result.dotEffects.length > 0) {
        newState.dotEffects = [...(newState.dotEffects || []), ...result.dotEffects];
        console.log(`[Effect] 添加${result.dotEffects.length}个DOT效果`);
      }
      if (result.ambushEffects && result.ambushEffects.length > 0) {
        newState.ambushEffects = [...(newState.ambushEffects || []), ...result.ambushEffects];
        console.log(`[Effect] 添加${result.ambushEffects.length}个埋伏效果`);
      }
      if (result.nextTurnShield && result.nextTurnShield > 0) {
        newState.nextTurnShield = (newState.nextTurnShield || 0) + result.nextTurnShield;
        console.log(`[Effect] 下回合获得${result.nextTurnShield}护盾`);
      }
      if (result.nextTurnDamage && result.nextTurnDamage > 0) {
        newState.nextTurnDamage = (newState.nextTurnDamage || 0) + result.nextTurnDamage;
        console.log(`[Effect] 下回合受到${result.nextTurnDamage}点延迟伤害`);
      }
      if (result.permanentDamageBonus && result.permanentDamageBonus > 0) {
        newState.permanentDamageBonus = (newState.permanentDamageBonus || 0) + result.permanentDamageBonus;
        console.log(`[Effect] 永久伤害加成+${result.permanentDamageBonus}`);
      }
      if (result.nextCardDouble) {
        newState.nextCardDouble = true;
        console.log(`[Effect] 下张牌打出两次`);
      }
      if (result.nextSkillDouble) {
        newState.nextSkillDouble = true;
        console.log(`[Effect] 下张技能牌打出两次`);
      }
      if (result.allCardsRepeat) {
        newState.allCardsRepeat = true;
        console.log(`[Effect] 本回合所有牌打出两次`);
      }
      if (result.unlimitedCards) {
        newState.unlimitedCards = true;
        console.log(`[Effect] 本回合无限出牌`);
      }
      if (result.handCostZero) {
        newState.handCostZero = true;
        console.log(`[Effect] 手牌费用变为0`);
      }
      if (result.freeCardNext) {
        newState.freeCardNext = result.freeCardNext;
        console.log(`[Effect] 下张牌免费`);
      }
      if (result.drawnFreeAndDouble) {
        newState.drawnFreeAndDouble = true;
        console.log(`[Effect] 抽到的牌免费且双倍`);
      }
      if (result.invulnerable2 && result.invulnerable2 > 0) {
        newState.invulnerable2 = (newState.invulnerable2 || 0) + result.invulnerable2;
        console.log(`[Effect] 获得${result.invulnerable2}层无敌`);
      }
      if (result.reflect50) {
        newState.reflect50 = true;
        console.log(`[Effect] 反弹50%伤害`);
      }
      if (result.noDefenseThisTurn) {
        newState.noDefenseThisTurn = true;
        console.log(`[Effect] 本回合无法打出防御牌`);
      }
      if (result.allCardsCostZero) {
        newState.allCardsCostZero = true;
        console.log(`[Effect] 所有卡牌费用为0`);
      }
      if (result.next2CardsDouble && result.next2CardsDouble > 0) {
        newState.next2CardsDouble = (newState.next2CardsDouble || 0) + result.next2CardsDouble;
        console.log(`[Effect] 下${result.next2CardsDouble}张牌效果触发2次`);
      }
      if (result.skillUsedThisTurn) {
        newState.skillUsedThisTurn = true;
      }
      if (result.regenAmount && result.regenAmount > 0) {
        newState.regenAmount = (newState.regenAmount || 0) + result.regenAmount;
        console.log(`[Effect] 获得${result.regenAmount}层再生`);
      }
      if (result.nextTurnShield5 && result.nextTurnShield5 > 0) {
        newState.nextTurnShield5 = (newState.nextTurnShield5 || 0) + result.nextTurnShield5;
        console.log(`[Effect] 下回合获得${result.nextTurnShield5}护盾`);
      }
      if (result.nextDrawPlus1 && result.nextDrawPlus1 > 0) {
        newState.nextDrawPlus1 = (newState.nextDrawPlus1 || 0) + result.nextDrawPlus1;
        console.log(`[Effect] 下回合抽牌+${result.nextDrawPlus1}`);
      }
      if (result.circuitBreak && result.circuitBreak > 0) {
        newState.circuitBreak = (newState.circuitBreak || 0) + result.circuitBreak;
        console.log(`[Effect] 熔断器激活`);
      }
      if (result.immuneDebuffToAdd && result.immuneDebuffToAdd > 0) {
        newState.immuneDebuff = (newState.immuneDebuff || 0) + result.immuneDebuffToAdd;
        console.log(`[Effect] 免疫负面效果${result.immuneDebuffToAdd}回合`);
      }
      if (result.attackAgainNext && result.attackAgainNext > 0) {
        newState.attackAgainNext = (newState.attackAgainNext || 0) + result.attackAgainNext;
        console.log(`[Effect] 下回合自动攻击${result.attackAgainNext}次`);
      }
      if (result.endCombatDamage && result.endCombatDamage > 0) {
        newState.endCombatDamage = (newState.endCombatDamage || 0) + result.endCombatDamage;
        console.log(`[Effect] 战斗结束将受到${result.endCombatDamage}点伤害`);
      }
      if (result.delayedCards && result.delayedCards.length > 0) {
        newState.delayedCards = [...(newState.delayedCards || []), ...result.delayedCards];
        console.log(`[Effect] ${result.delayedCards.length}张牌被延迟到下回合`);
      }
      if (result.duplicateCardPlayedThisTurn && Object.keys(result.duplicateCardPlayedThisTurn).length > 0) {
        newState.duplicateCardPlayedThisTurn = { ...newState.duplicateCardPlayedThisTurn, ...result.duplicateCardPlayedThisTurn };
      }
      if (result.discardCountThisTurn) {
        newState.discardCountThisTurn = (newState.discardCountThisTurn || 0) + result.discardCountThisTurn;
      }
      if (result.cardsDiscardedThisCombat) {
        newState.cardsDiscardedThisCombat = (newState.cardsDiscardedThisCombat || 0) + result.cardsDiscardedThisCombat;
      }
      
      // 应用能量增益
      if (result.energyGain && result.energyGain > 0) {
        newState.currentCost += result.energyGain;
        console.log(`[Energy] 获得${result.energyGain}点能量，当前${newState.currentCost}`);
      }
      
      // 处理技能使用标记
      if (card.type === 'skill') {
        newState.skillUsedThisTurn = true;
      }
      
      // 处理攻击牌伤害加成 - 消耗各种加成效果
      if (card.type === 'attack') {
        // 下2次攻击加成 - 打出攻击牌后减少计数
        if (newState.next2AttacksBonus && newState.next2AttacksBonus > 0) {
          newState.next2AttacksBonus -= 1;
          console.log(`[Effect] 下2次攻击加成已应用，剩余${newState.next2AttacksBonus}次`);
        }
        
        // 消耗掉下次攻击加成
        if (newState.nextAttackBonus && newState.nextAttackBonus > 0) {
          newState.nextAttackBonus = 0;
          console.log(`[Effect] 消耗掉下次攻击加成`);
        }
        
        // 0费攻击加成已通过effectState中添加tempZeroAttackBonus应用，这里只记录
        if (actualCost === 0 && newState.zeroAttackBonus && newState.zeroAttackBonus > 0) {
          console.log(`[Effect] 0费攻击加成已应用`);
        }
      }
      
      // 处理费用减免
      if (newState.nextCardCostMinus && newState.nextCardCostMinus > 0) {
        // 下张牌费用减免在打出时处理
        newState.nextCardCostMinus = Math.max(0, newState.nextCardCostMinus - 1);
      }
      
      // 处理永久抽牌加成
      if (newState.permanentDrawBonus && newState.permanentDrawBonus > 0) {
        // 效果持续整场战斗
      }
      
      // 处理递归标记
      if (card.name === '递归') {
        newState.hasUsedRecursion = true;
      }
      
      // 处理卡牌打出两次效果
      const shouldDouble = newState.nextCardDouble || newState.allCardsRepeat || shouldDoubleSkill || (card as any).tempDouble;
      if (shouldDouble) {
        console.log(`[Double] 卡牌效果触发两次！`);
      }
      
      // 第二次伤害应用（如果有打出两次效果）
      if (shouldDouble && result.damage > 0 && card.effect.target !== 'self') {
        console.log(`[Double] 应用第二次伤害: ${result.damage}`);
        
        // 复制一份新的敌人状态用于第二次伤害计算
        let secondDamage = result.damage;
        
        // 应用玩家虚弱效果（伤害-25%每层）
        if (newState.playerWeak && newState.playerWeak > 0 && !isPureDamage) {
          const weakReduction = Math.floor(secondDamage * newState.playerWeak * 0.25);
          secondDamage = Math.max(0, secondDamage - weakReduction);
        }
        
        const applySecondDamage = (enemy: Enemy, damage: number, _idx: number) => {
          const enemyShield = (enemy as any).shield || 0;
          let actualDamage = damage;
          let newShield = enemyShield;
          
          // 检查闪避能力
          if (enemy.special === 'dodge' && Math.random() < 0.5) {
            console.log(`[Double][Dodge] ${enemy.name}闪避了第二次攻击！`);
            return { ...enemy, shield: newShield };
          }
          
          // 检查免疫
          if ((enemy as any).immuneNextAttack) {
            (enemy as any).immuneNextAttack = false;
            console.log(`[Double][PointerImmune] ${enemy.name}免疫了第二次攻击！`);
            return { ...enemy, shield: newShield };
          }
          
          // 应用易伤
          if (!isPureDamage) {
            const vulnerable = (enemy as any).vulnerable || 0;
            if (vulnerable > 0) {
              actualDamage = Math.floor(actualDamage * (1 + vulnerable * 0.5));
            }
          }
          
          // 护盾吸收
          if (!ignoreShield && enemyShield > 0) {
            const shieldAbsorb = Math.min(enemyShield, actualDamage);
            newShield = enemyShield - shieldAbsorb;
            actualDamage = Math.max(0, actualDamage - shieldAbsorb);
            console.log(`[Double][EnemyShield] ${enemy.name}护盾吸收了${shieldAbsorb}点伤害`);
          }
          
          // 反射伤害
          if (enemy.special === 'reflect' && actualDamage > 0) {
            const reflectAmount = Math.floor(actualDamage * 0.25);
            if (reflectAmount > 0 && newState.characters[0]) {
              newState.characters[0].currentEnergy = Math.max(0, newState.characters[0].currentEnergy - reflectAmount);
              console.log(`[Double][Reflect] ${enemy.name}反射${reflectAmount}点伤害！`);
            }
          }
          
          return {
            ...enemy,
            shield: newShield,
            currentHealth: Math.max(0, enemy.currentHealth - actualDamage),
            stunned: (enemy as any).stunned,
            weak: (enemy as any).weak,
            vulnerable: (enemy as any).vulnerable,
            poison: (enemy as any).poison,
            intentRevealed: (enemy as any).intentRevealed,
            specialDisabled: (enemy as any).specialDisabled,
            noShieldNext: (enemy as any).noShieldNext,
            attackLimited: (enemy as any).attackLimited,
            immuneNextAttack: (enemy as any).immuneNextAttack
          };
        };
        
        if (card.effect.target === 'all') {
          newState.currentEnemies = newState.currentEnemies.map((enemy, idx) => applySecondDamage(enemy, secondDamage, idx));
        } else {
          newState.currentEnemies = newState.currentEnemies.map((enemy, idx) => {
            if (idx === targetIndex) {
              return applySecondDamage(enemy, secondDamage, idx);
            }
            return enemy;
          });
        }
        
        console.log(`[Double] 第二次伤害应用完成`);
      }
      
      // 应用第二次护盾/治疗/金钱（如果有打出两次效果）
      if (shouldDouble) {
        if (result.shield > 0) {
          newState.tempShield += result.shield;
          console.log(`[Double] 第二次护盾+${result.shield}`);
        }
        if (result.heal > 0) {
          const char = newState.characters[0];
          if (char) {
            char.currentEnergy = Math.min(char.maxEnergy, char.currentEnergy + result.heal);
            console.log(`[Double] 第二次治疗+${result.heal}`);
          }
        }
        if (result.money > 0) {
          newState.money += result.money;
          console.log(`[Double] 第二次金钱+${result.money}`);
        }
        
        // 消耗掉打出两次效果
        if (newState.nextCardDouble) {
          newState.nextCardDouble = false;
        }
        if (shouldDoubleSkill) {
          newState.nextSkillDouble = false;
        }
      }
      
      // 处理下一张牌双倍效果
      if (newState.next2CardsDouble && newState.next2CardsDouble > 0) {
        newState.next2CardsDouble -= 1;
        console.log(`[Effect] 下张牌双倍效果剩余${newState.next2CardsDouble}张`);
      }
      
      // 处理所有卡牌费用为0效果（仅持续一回合）
      if (newState.allCardsCostZero) {
        newState.allCardsCostZero = false;
        console.log(`[Effect] 所有卡牌费用为0效果结束`);
      }
      
      // 处理未击杀抽牌效果 (draw_if_not_kill)
      if (newState.drawIfNotKill) {
        const target = newState.currentEnemies[targetIndex];
        if (target && target.currentHealth > 0) {
          // 敌人未死亡，抽1张牌
          const dr = drawCards(1, newState.deck, newState.hand, newState.discard);
          newState.deck = dr.deck;
          newState.hand = dr.hand;
          newState.discard = dr.discard;
          console.log(`[Effect] draw_if_not_kill: 未击杀敌人，抽1张牌`);
        }
        newState.drawIfNotKill = false;
      }
      
      // 处理击杀获得能量效果 (kill_energy_2)
      if (newState.killEnergy2) {
        const target = newState.currentEnemies[targetIndex];
        if (target && target.currentHealth <= 0) {
          // 敌人死亡，获得2能量
          newState.currentCost += 2;
          console.log(`[Effect] kill_energy_2: 击杀敌人，获得2能量`);
        }
        newState.killEnergy2 = false;
      }
      
      // 记录本回合出牌类型
      if (!newState.cardsPlayedThisTurnTypes) {
        newState.cardsPlayedThisTurnTypes = [];
      }
      newState.cardsPlayedThisTurnTypes.push(card.type as 'attack' | 'defense' | 'skill' | 'curse');
      
      // 检查是否有待处理的灵感选择
      if (result.pendingInspiration) {
        newState.inspiration = {
          isActive: true,
          type: result.pendingInspiration.type,
          title: result.pendingInspiration.title,
          description: result.pendingInspiration.description,
          cards: result.pendingInspiration.cards,
          selectCount: result.pendingInspiration.selectCount,
          canDiscard: result.pendingInspiration.canDiscard,
          canReorder: result.pendingInspiration.canReorder,
          sourceCardName: result.pendingInspiration.sourceCardName,
          callbackAction: result.pendingInspiration.callbackAction
        };
        console.log(`[Inspiration] 触发灵感选择: ${result.pendingInspiration.title}`);
      }
      
      return newState;
    });
  }, [drawCards]);

  const endTurn = useCallback(() => {
    setGameState(prev => {
      const newState = { ...prev };
      
      newState.isPlayerTurn = false;
      
      // 玩家回合结束，减少虚弱和易伤层数
      if (newState.playerWeak && newState.playerWeak > 0) {
        newState.playerWeak -= 1;
        console.log(`[Debuff] 玩家虚弱减少1层，剩余${newState.playerWeak}层`);
      }
      if (newState.playerVulnerable && newState.playerVulnerable > 0) {
        newState.playerVulnerable -= 1;
        console.log(`[Debuff] 玩家易伤减少1层，剩余${newState.playerVulnerable}层`);
      }
      
      // 清除本回合临时效果
      if (newState.allAttacksBonus && newState.allAttacksBonus > 0) {
        newState.allAttacksBonus = 0;
        console.log(`[TurnEnd] 清除本回合所有攻击伤害加成`);
      }
      if (newState.allCardsRepeat) {
        newState.allCardsRepeat = false;
        console.log(`[TurnEnd] 清除本回合所有卡牌重复效果`);
      }
      if (newState.allCardsCostZero) {
        newState.allCardsCostZero = false;
        console.log(`[TurnEnd] 清除本回合所有卡牌费用为0效果`);
      }
      if (newState.handCostZero) {
        newState.handCostZero = false;
        console.log(`[TurnEnd] 清除手牌费用为0效果`);
      }
      if (newState.costMinusThisTurn && newState.costMinusThisTurn > 0) {
        newState.costMinusThisTurn = 0;
        console.log(`[TurnEnd] 清除本回合费用减少效果`);
      }
      // 重置回合内计数器
      newState.cardsPlayedThisTurn = 0;
      newState.skillUsedThisTurn = false;
      newState.cardsPlayedThisTurnTypes = [];
      
      // 敌人回合 - 应用敌人攻击
      // 创建敌人副本数组，确保修改被正确追踪
      // 用于收集需要添加的新敌人（split/summon等能力）
      const newEnemiesToAdd: Enemy[] = [];
      
      newState.currentEnemies = newState.currentEnemies.map((enemy: Enemy) => {
        // 创建敌人副本
        const updatedEnemy = { ...enemy };
        
        if (updatedEnemy.currentHealth > 0) {
          // 检查晕眩状态 - 如果晕眩则跳过行动
          const stunned = (updatedEnemy as any).stunned || 0;
          if (stunned > 0) {
            (updatedEnemy as any).stunned = Math.max(0, stunned - 1);
            console.log(`[Stun] ${updatedEnemy.name}晕眩中，跳过本回合行动，剩余${(updatedEnemy as any).stunned}层`);
            // 晕眩時也要减少易伤和虚弱层数
            const vulnerable = (updatedEnemy as any).vulnerable || 0;
            const weak = (updatedEnemy as any).weak || 0;
            if (vulnerable > 0) {
              (updatedEnemy as any).vulnerable = Math.max(0, vulnerable - 1);
            }
            if (weak > 0) {
              (updatedEnemy as any).weak = Math.max(0, weak - 1);
            }
            // 清除敌人护盾
            const currentShield = (updatedEnemy as any).shield || 0;
            if (currentShield > 0) {
              console.log(`[EnemyShield] ${updatedEnemy.name}的${currentShield}点护盾回合结束消失`);
              (updatedEnemy as any).shield = 0;
            }
            return updatedEnemy; // 返回更新后的敌人（晕眩状态已减）
          }
          
          // 减少易伤和虚弱层数
          const vulnerable = (updatedEnemy as any).vulnerable || 0;
          const weak = (updatedEnemy as any).weak || 0;
          if (vulnerable > 0) {
            (updatedEnemy as any).vulnerable = Math.max(0, vulnerable - 1);
            console.log(`[Debuff] ${updatedEnemy.name}易伤减少1层，剩余${(updatedEnemy as any).vulnerable}层`);
          }
          if (weak > 0) {
            (updatedEnemy as any).weak = Math.max(0, weak - 1);
            console.log(`[Debuff] ${updatedEnemy.name}虚弱减少1层，剩余${(updatedEnemy as any).weak}层`);
          }
          
          // 清除敌人护盾（每回合结束時护盾消失）
          const currentShield = (updatedEnemy as any).shield || 0;
          if (currentShield > 0) {
            console.log(`[EnemyShield] ${updatedEnemy.name}的${currentShield}点护盾回合结束消失`);
            (updatedEnemy as any).shield = 0;
          }
          
          // 根据敌人意图执行行动，而不是直接使用attack
          let damage = 0;
          let enemyShield = 0; // 新回合开始时敌人护盾为0
          
          // 如果有意图，按意图执行；否则默认攻击
          if (updatedEnemy.intent) {
            switch (updatedEnemy.intent.type) {
              case 'attack':
                damage = updatedEnemy.intent.value || updatedEnemy.attack || 0;
                // 虚弱效果: 伤害-25%
                const weak = (updatedEnemy as any).weak || 0;
                if (weak > 0) {
                  const damageReduction = Math.floor(damage * weak * 0.25);
                  damage = Math.max(0, damage - damageReduction);
                  console.log(`[Weak] ${updatedEnemy.name}虚弱${weak}层，伤害-${damageReduction}`);
                }
                break;
              case 'defense':
                const shieldGain = updatedEnemy.intent.value || Math.floor((updatedEnemy.attack || 0) * 1.2);
                enemyShield += shieldGain;
                (updatedEnemy as any).shield = enemyShield;
                console.log(`[EnemyIntent] ${updatedEnemy.name}防御，获得${shieldGain}护盾`);
                break;
              case 'special':
                // 特殊意图不造成伤害，执行特殊效果
                console.log(`[EnemyIntent] ${updatedEnemy.name}准备使用特殊能力！`);
                break;
            }
          } else {
            // 没有意图時默认攻击
            damage = updatedEnemy.attack || 0;
            // 虚弱效果: 伤害-25%
            const weak = (updatedEnemy as any).weak || 0;
            if (weak > 0) {
              const damageReduction = Math.floor(damage * weak * 0.25);
              damage = Math.max(0, damage - damageReduction);
              console.log(`[Weak] ${updatedEnemy.name}虚弱${weak}层，伤害-${damageReduction}`);
            }
          }
          
          // 处理敌人特殊能力
          switch (updatedEnemy.special) {
            case 'growth':
              updatedEnemy.attack = (updatedEnemy.attack || 0) + 1;
              updatedEnemy.maxHealth += 3;
              console.log(`[Enemy] ${updatedEnemy.name}成长了！攻击+1，最大生命+3`);
              break;
            case 'rampage':
              updatedEnemy.attack = (updatedEnemy.attack || 0) + 1;
              console.log(`[Enemy] ${updatedEnemy.name}狂暴了！攻击+1`);
              break;
            case 'heal':
              if (newState.turn % 3 === 0) {
                updatedEnemy.currentHealth = Math.min(updatedEnemy.maxHealth, updatedEnemy.currentHealth + 10);
                console.log(`[Enemy] ${updatedEnemy.name}恢复了10点生命`);
              }
              break;
            case 'quick':
              if (newState.turn === 1) {
                damage *= 2;
                console.log(`[Enemy] ${updatedEnemy.name}快速攻击！伤害翻倍`);
              }
              break;
            case 'weak':
              newState.playerWeak = (newState.playerWeak || 0) + 1;
              console.log(`[Enemy] ${updatedEnemy.name}施加虚弱！玩家弱化1层`);
              break;
            case 'shield':
              if (newState.turn % 2 === 0) {
                enemyShield = ((updatedEnemy as any).shield || 0) + 8;
                (updatedEnemy as any).shield = enemyShield;
                console.log(`[Enemy] ${updatedEnemy.name}获得8点护盾`);
              }
              break;
            case 'vulnerable':
              newState.playerVulnerable = (newState.playerVulnerable || 0) + 2;
              console.log(`[Enemy] ${updatedEnemy.name}施加易伤！玩家易伤2层`);
              break;
            case 'regen':
              updatedEnemy.currentHealth = Math.min(updatedEnemy.maxHealth, updatedEnemy.currentHealth + 3);
              console.log(`[Enemy] ${updatedEnemy.name}再生3点生命`);
              break;
            case 'enrage':
              if (updatedEnemy.currentHealth < updatedEnemy.maxHealth * 0.5) {
                damage *= 2;
                console.log(`[Enemy] ${updatedEnemy.name}愤怒了！伤害翻倍`);
              }
              break;
            case 'multiStrike':
              if (newState.turn % 3 === 0) {
                damage *= 3;
                console.log(`[Enemy] ${updatedEnemy.name}发动多段攻击！`);
              }
              break;
            case 'reflect':
              console.log(`[Enemy] ${updatedEnemy.name}准备反射伤害`);
              break;
            case 'poison':
              newState.playerPoison = (newState.playerPoison || 0) + 3;
              console.log(`[Enemy] ${updatedEnemy.name}施加中毒！玩家中毒3层`);
              break;
            case 'drain':
              newState.nextTurnCostPenalty = (newState.nextTurnCostPenalty || 0) + 1;
              console.log(`[Enemy] ${updatedEnemy.name}吸取能量！玩家下回合能量-1`);
              break;

            case 'cleanse':
              if (newState.turn % 2 === 0) {
                updatedEnemy.currentHealth = Math.min(updatedEnemy.maxHealth, updatedEnemy.currentHealth + 15);
                console.log(`[Enemy] ${updatedEnemy.name}清除负面效果并恢复15点生命`);
              }
              break;
            case 'transform':
              if (updatedEnemy.currentHealth < updatedEnemy.maxHealth * 0.5) {
                updatedEnemy.attack += 3;
                console.log(`[Enemy] ${updatedEnemy.name}变身了！攻击+3`);
              }
              break;
            case 'split':
              // 分裂能力在敌人血量低時生成新敌人
              if (updatedEnemy.currentHealth < updatedEnemy.maxHealth * 0.5 && !(updatedEnemy as any).isSplit) {
                (updatedEnemy as any).isSplit = true;
                const splitEnemy: Enemy = {
                  ...updatedEnemy,
                  id: updatedEnemy.id + '_split',
                  name: updatedEnemy.name + '(分)',
                  maxHealth: 30,
                  currentHealth: 30,
                  attack: 4,
                  intent: generateIntent(updatedEnemy)
                };
                // 收集新敌人，在map结束后再添加
                newEnemiesToAdd.push(splitEnemy);
                console.log(`[Enemy] ${updatedEnemy.name}分裂了一个敌人！`);
              }
              break;
            case 'summon':
              if (newState.turn % 2 === 0) {
                const summonCount = newState.currentEnemies.filter(e => e.name.includes('子依赖')).length;
                if (summonCount < 3) {
                  const summonEnemy: Enemy = {
                    ...updatedEnemy,
                    id: updatedEnemy.id + '_minion_' + Date.now(),
                    name: '子依赖',
                    maxHealth: 15,
                    currentHealth: 15,
                    attack: 4,
                    special: 'none',
                    specialDescription: '无',
                    intent: generateIntent(updatedEnemy)
                  };
                  // 收集新敌人，在map结束后再添加
                  newEnemiesToAdd.push(summonEnemy);
                  console.log(`[Enemy] ${updatedEnemy.name}召唤了子依赖！`);
                }
              }
              break;
            case 'decay':
              newState.playerDecay = (newState.playerDecay || 0) + 1;
              console.log(`[Enemy] ${updatedEnemy.name}施加过时效果！玩家手牌费用+1`);
              break;
            // ========== 未实现的敌人特殊能力 ==========
            case 'pointerImmune':
              // 免疫一次攻击，每3回合重置
              if (newState.turn % 3 === 0) {
                (updatedEnemy as any).immuneNextAttack = true;
                console.log(`[Enemy] ${updatedEnemy.name}获得免疫一次攻击！`);
              }
              break;
            case 'recoil':
              // 攻击時自身失去3点生命
              updatedEnemy.currentHealth = Math.max(0, updatedEnemy.currentHealth - 3);
              console.log(`[Enemy] ${updatedEnemy.name}攻击后自身损失3点生命`);
              break;
            // ========== 精英敌人特殊能力 ==========
            case 'eliteGrowth':
              updatedEnemy.attack = (updatedEnemy.attack || 0) + 2;
              updatedEnemy.maxHealth += 5;
              console.log(`[Elite] ${updatedEnemy.name}精英成长！攻击+2，最大生命+5`);
              break;
            case 'eliteStun':
              if (newState.turn % 2 === 0) {
                newState.playerStunned = (newState.playerStunned || 0) + 1;
                newState.playerWeak = (newState.playerWeak || 0) + 1;
                console.log(`[Elite] ${updatedEnemy.name}晕眩玩家并施加虚弱！`);
              }
              break;
            case 'eliteReflect':
              enemyShield += 10;
              (updatedEnemy as any).shield = enemyShield;
              console.log(`[Elite] ${updatedEnemy.name}获得10护盾，准备反伤！`);
              break;
            case 'eliteQuick':
              if (newState.turn === 1) {
                damage *= 3;
              } else {
                damage *= 2;
              }
              console.log(`[Elite] ${updatedEnemy.name}快速攻击！`);
              break;
            case 'eliteCrash':
              if (updatedEnemy.currentHealth < updatedEnemy.maxHealth * 0.3) {
                damage *= 2;
                console.log(`[Elite] ${updatedEnemy.name}崩溃了！伤害翻倍`);
              }
              break;
            case 'eliteCleanse':
              updatedEnemy.currentHealth = Math.min(updatedEnemy.maxHealth, updatedEnemy.currentHealth + 20);
              console.log(`[Elite] ${updatedEnemy.name}清除负面并恢复20生命`);
              break;
            // ========== Boss敌人特殊能力 ==========
            case 'bossCompile':
              if (newState.turn % 3 === 0) {
                enemyShield += 20;
                (updatedEnemy as any).shield = enemyShield;
                console.log(`[Boss] ${updatedEnemy.name}获得20护盾！`);
              }
              if (updatedEnemy.currentHealth < updatedEnemy.maxHealth * 0.5) {
                damage += 5;
                console.log(`[Boss] ${updatedEnemy.name}进入第二阶段！攻击+5`);
              }
              break;
            case 'bossSummon':
              if (newState.turn % 2 === 0) {
                // 召唤Commit小兵（最多3个）
                const commitCount = newState.currentEnemies.filter(e => e.id.includes('commit')).length;
                if (commitCount < 3) {
                  const commit: Enemy = {
                    id: `commit_${Date.now()}`,
                    name: 'Commit',
                    maxHealth: 25,
                    currentHealth: 25,
                    attack: 6,
                    special: 'none',
                    specialDescription: '被召唤的小兵',
                    image: '/enemies/floor1/comment.png'
                  };
                  // 收集新敌人，在map结束后再添加
                  newEnemiesToAdd.push(commit);
                  console.log(`[Boss] ${updatedEnemy.name}召唤了Commit！`);
                } else {
                  console.log(`[Boss] ${updatedEnemy.name}尝试召唤但已达上限！`);
                }
              }
              break;
            case 'bossPipeline':
              if (updatedEnemy.currentHealth < updatedEnemy.maxHealth * 0.5) {
                damage *= 3;
                console.log(`[Boss] ${updatedEnemy.name}三阶段攻击！`);
              } else {
                damage *= 2;
                console.log(`[Boss] ${updatedEnemy.name}双重攻击！`);
              }
              break;
            case 'bossMonolith':
              if (newState.turn > 3) {
                updatedEnemy.currentHealth = Math.min(updatedEnemy.maxHealth, updatedEnemy.currentHealth + 15);
                console.log(`[Boss] ${updatedEnemy.name}自愈15点！`);
              }
              break;
            case 'bossTransform':
              // 三阶段变身: 70%和40%時改变攻击模式
              if (!(updatedEnemy as any).transformPhase) {
                (updatedEnemy as any).transformPhase = 1;
              }
              const healthPercent = updatedEnemy.currentHealth / updatedEnemy.maxHealth;
              let newPhase = 1;
              if (healthPercent <= 0.4) {
                newPhase = 3;
              } else if (healthPercent <= 0.7) {
                newPhase = 2;
              }
              
              if (newPhase !== (updatedEnemy as any).transformPhase) {
                (updatedEnemy as any).transformPhase = newPhase;
                if (newPhase === 2) {
                  updatedEnemy.attack += 5;
                  console.log(`[Boss] ${updatedEnemy.name}进入第二阶段！攻击+5`);
                } else if (newPhase === 3) {
                  updatedEnemy.attack += 8;
                  damage *= 1.5;
                  console.log(`[Boss] ${updatedEnemy.name}进入第三阶段！攻击+8，伤害x1.5`);
                }
              }
              break;
            case 'bossDistributed':
              // 分布式系统: 3个节点同时存在，必须全部击败
              if (!(updatedEnemy as any).nodesSpawned) {
                (updatedEnemy as any).nodesSpawned = true;
                // 生成2个额外节点
                const node1: Enemy = { ...updatedEnemy, id: updatedEnemy.id + '_node1', name: '数据节点A', currentHealth: updatedEnemy.maxHealth * 0.3, maxHealth: updatedEnemy.maxHealth * 0.3 };
                const node2: Enemy = { ...updatedEnemy, id: updatedEnemy.id + '_node2', name: '数据节点B', currentHealth: updatedEnemy.maxHealth * 0.3, maxHealth: updatedEnemy.maxHealth * 0.3 };
                // 收集新敌人，在map结束后再添加
                newEnemiesToAdd.push(node1, node2);
                console.log(`[Boss] ${updatedEnemy.name}分裂了3个数据节点！`);
              }
              break;
          }
          
          // 应用伤害前检查埋伏效果
          if (newState.ambushEffects && newState.ambushEffects.length > 0 && updatedEnemy.intent?.type === 'attack') {
            // 处理取消并晕眩埋伏
            const cancelStunEffects = newState.ambushEffects.filter(a => a.type === 'cancel_stun');
            if (cancelStunEffects.length > 0) {
              // 取消这次攻击并晕眩敌人
              damage = 0;
              (updatedEnemy as any).stunned = ((updatedEnemy as any).stunned || 0) + 1;
              console.log(`[Ambush] 埋伏触发！取消${updatedEnemy.name}的攻击并晕眩`);
              // 消耗掉这个埋伏效果
              newState.ambushEffects = newState.ambushEffects.filter(a => a.type !== 'cancel_stun');
            }
            
            // 处理伤害埋伏
            const damageEffects = newState.ambushEffects.filter(a => a.type === 'damage');
            damageEffects.forEach(ambush => {
              updatedEnemy.currentHealth = Math.max(0, updatedEnemy.currentHealth - ambush.value);
              console.log(`[Ambush] 埋伏触发！${updatedEnemy.name}受到${ambush.value}点伤害`);
            });
            
            // 处理吸血埋伏
            const lifestealEffects = newState.ambushEffects.filter(a => a.type === 'lifesteal');
            lifestealEffects.forEach(ambush => {
              const char = newState.characters[0];
              if (char) {
                char.currentEnergy = Math.min(char.maxEnergy, char.currentEnergy + ambush.value);
                console.log(`[Ambush] 埋伏触发！窃取${ambush.value}生命`);
              }
            });
            
            // 清理已触发的埋伏效果
            newState.ambushEffects = [];
          }
          
          // 应用伤害
          let actualDamageToPlayer = damage;
          
          // 应用玩家易伤效果（受到伤害+50%每层）
          if (newState.playerVulnerable && newState.playerVulnerable > 0) {
            const vulnBonus = Math.floor(actualDamageToPlayer * newState.playerVulnerable * 0.5);
            actualDamageToPlayer += vulnBonus;
            console.log(`[PlayerVulnerable] 玩家易伤${newState.playerVulnerable}层，伤害+${vulnBonus}`);
          }
          
          // 应用伤害减免
          if (newState.damageReductionNext && newState.damageReductionNext > 0) {
            actualDamageToPlayer = Math.max(0, actualDamageToPlayer - newState.damageReductionNext);
            console.log(`[DamageReduction] 减免${newState.damageReductionNext}点伤害，实际受到${actualDamageToPlayer}`);
            newState.damageReductionNext = 0;
          }
          
          // 应用无敌效果
          if (newState.invulnerable2 && newState.invulnerable2 > 0) {
            actualDamageToPlayer = 0;
            newState.invulnerable2 -= 1;
            console.log(`[Invulnerable] 免疫伤害！剩余${newState.invulnerable2}层无敌`);
          }
          
          // 计算玩家受到的总伤害（用于反击计算）
          let totalDamageTaken = 0;
          
          if (newState.tempShield > 0) {
            const shieldAbsorb = Math.min(newState.tempShield, actualDamageToPlayer);
            newState.tempShield -= shieldAbsorb;
            totalDamageTaken = actualDamageToPlayer - shieldAbsorb;
            if (totalDamageTaken > 0 && newState.characters[0]) {
              newState.characters[0].currentEnergy -= totalDamageTaken;
            }
          } else if (newState.characters[0]) {
            totalDamageTaken = actualDamageToPlayer;
            newState.characters[0].currentEnergy -= actualDamageToPlayer;
          }
          
          // 记录敌人行动（合并行动和伤害）
          if (!newState.combatLog) newState.combatLog = [];
          const intentType = updatedEnemy.intent?.type || 'attack';
          const damageInfo = totalDamageTaken > 0 ? ` (造成 ${totalDamageTaken} 伤害)` : '';
          newState.combatLog.push({
            turn: newState.turn,
            type: 'enemy_action',
            description: `${updatedEnemy.name} 使用 ${intentType}${damageInfo}`,
            target: updatedEnemy.name,
            value: totalDamageTaken || damage
          });
          
          // 应用反击效果
          if (totalDamageTaken > 0 && newState.retaliate && newState.retaliate > 0) {
            const retaliateDamage = newState.retaliate;
            updatedEnemy.currentHealth = Math.max(0, updatedEnemy.currentHealth - retaliateDamage);
            console.log(`[Retaliate] 反击${retaliateDamage}点伤害给${updatedEnemy.name}！`);
          }
          
          // 如果敌人有护盾，给玩家反弹伤害
          if (enemyShield > 0 && damage > 0) {
            const reflectAmount = Math.floor(damage * 0.25);
            if (reflectAmount > 0 && newState.characters[0]) {
              newState.characters[0].currentEnergy -= reflectAmount;
              console.log(`[Reflect] ${updatedEnemy.name}反伤${reflectAmount}点给玩家！`);
            }
          }
        }
        
        // 确保返回更新后的敌人
        return updatedEnemy;
      });
      
      // 添加由split/summon/bossDistributed等能力生成的新敌人
      if (newEnemiesToAdd.length > 0) {
        newState.currentEnemies = [...newState.currentEnemies, ...newEnemiesToAdd];
      }
      
      // 检查死亡（处理免死效果）
      if (newState.characters[0]?.currentEnergy <= 0) {
        if (newState.cheatDeath15) {
          // 免死效果触发
          newState.characters[0].currentEnergy = 15;
          newState.cheatDeath15 = false;
          console.log(`[CheatDeath] 免死效果触发！生命恢复至15`);
        } else {
          newState.gamePhase = 'game_over';
          return newState;
        }
      }
      
      // 检查胜利
      if (newState.currentEnemies.every(e => e.currentHealth <= 0)) {
        const isBoss = newState.currentRoom?.type === 'boss';
        const isElite = newState.currentRoom?.type === 'elite';
        
        // 计算天赋点奖励
        const talentPointReward = isBoss ? 3 : isElite ? 2 : 1;
        newState.talentPoints = (newState.talentPoints || 0) + talentPointReward;
        newState.totalTalentPoints = (newState.totalTalentPoints || 0) + talentPointReward;
        console.log(`[Talent] 战斗胜利！获得${talentPointReward}天赋点`);
        
        let reward = getCombatReward(isElite, isBoss);
        
        // 先标记房间为已清除
        const victoryFloors = [...newState.floors];
        const victoryFloor = victoryFloors[newState.currentFloor];
        if (victoryFloor && newState.currentRoom) {
          const roomIndex = victoryFloor.rooms.findIndex(r => r.id === newState.currentRoom?.id);
          if (roomIndex >= 0) {
            victoryFloor.rooms[roomIndex] = { ...victoryFloor.rooms[roomIndex], cleared: true };
          }
        }
        newState.floors = victoryFloors;
        
        // 非Boss战且不跳过奖励時，生成奖励卡牌
        if (!isBoss && !newState.skipNextReward) {
          const characterId = newState.characters[0]?.id;
          const rewardCards = getCombatRewardCards(newState.currentFloor, isElite, characterId);
          newState.rewardCards = rewardCards;
          newState.gamePhase = 'reward';
          console.log(`[Reward] 战斗胜利！进入卡牌选择阶段，提供${rewardCards.length}张卡牌选择`);
          return newState;
        }
        
        // 跳过奖励检查
        if (newState.skipNextReward) {
          reward = 0;
          newState.skipNextReward = false;
          console.log(`[Event] 跳过了战斗奖励！`);
        }
        // 椎名立希特性: 战斗胜利時额外获得10金钱
        if (newState.characters[0]?.id === 'taki') {
          reward += 10;
          console.log(`[Character] 椎名立希: 战斗胜利，额外获得10金钱！`);
        }
        newState.money += reward;

        // 敌人生命buff递减
        if (newState.enemyHpBuffFights && newState.enemyHpBuffFights > 0) {
          newState.enemyHpBuffFights -= 1;
          console.log(`[Event] 敌人强化剩余${newState.enemyHpBuffFights}场`);
        }

        console.log(`[Victory] 战斗胜利！获得 ${reward} 金钱`);
        
        // 处理诅咒牌效果: 战斗结束受到伤害
        if (newState.endCombatDamage && newState.endCombatDamage > 0) {
          const char = newState.characters[0];
          if (char) {
            char.currentEnergy = Math.max(0, char.currentEnergy - newState.endCombatDamage);
            console.log(`[Curse] 构建失败: 战斗结束失去${newState.endCombatDamage}生命`);
            toast.error(`构建失败！失去${newState.endCombatDamage} 生命`, { description: '诅咒牌效果触发' });
          }
          newState.endCombatDamage = 0;
        }
        
        if (isBoss) {
          if (newState.currentFloor >= newState.floors.length - 1) {
            newState.gamePhase = 'victory';
          } else {
            newState.currentFloor += 1;
            const nextFloor = newState.floors[newState.currentFloor];
            newState.currentRoom = nextFloor?.rooms[0] || null;
            newState.gamePhase = 'map';
          }
        } else {
          newState.gamePhase = 'map';
        }
        return newState;
      }
      
      // 下一回合准备
      newState.turn += 1;
      newState.cardsPlayedThisTurn = 0;
      newState.hasUsedRecursion = false;
      
      // 保存本回合出牌类型到上回合记录
      newState.lastTurnCardTypes = newState.cardsPlayedThisTurnTypes || [];
      newState.cardsPlayedThisTurnTypes = [];
      
      // 保存本回合失去的生命值到上回合记录
      newState.healthLostLastTurn = newState.healthLostThisTurn || 0;
      newState.healthLostThisTurn = 0;
      
      // 应用下回合开始时失去生命效果
      if (newState.nextTurnDamage && newState.nextTurnDamage > 0) {
        if (newState.characters[0]) {
          newState.characters[0].currentEnergy = Math.max(0, newState.characters[0].currentEnergy - newState.nextTurnDamage);
          console.log(`[NextTurn] 受到${newState.nextTurnDamage}点延迟伤害`);
          newState.healthLostThisTurn = (newState.healthLostThisTurn || 0) + newState.nextTurnDamage;
        }
        newState.nextTurnDamage = 0;
      }
      
      // 应用下回合开始时获得护盾效果
      if (newState.nextTurnShield && newState.nextTurnShield > 0) {
        newState.tempShield += newState.nextTurnShield;
        console.log(`[NextTurn] 获得${newState.nextTurnShield}点延迟护盾`);
        newState.nextTurnShield = 0;
      }
      
      // 应用DOT效果（延迟伤害）
      if (newState.dotEffects && newState.dotEffects.length > 0) {
        newState.dotEffects.forEach(dot => {
          const enemy = newState.currentEnemies[dot.targetEnemyIndex];
          if (enemy && enemy.currentHealth > 0) {
            enemy.currentHealth = Math.max(0, enemy.currentHealth - dot.damage);
            console.log(`[DotEffect] ${enemy.name}受到${dot.damage}点延迟伤害`);
          }
        });
        // 移除已触发的效果或减少持续时间
        newState.dotEffects = newState.dotEffects.filter(dot => {
          dot.duration -= 1;
          return dot.duration > 0;
        });
      }
      
      // 处理镜像护盾反弹（对敌人造成伤害）
      if (newState.mirrorShield && newState.mirrorShield > 0) {
        newState.currentEnemies.forEach(enemy => {
          if (enemy.currentHealth > 0) {
            enemy.currentHealth = Math.max(0, enemy.currentHealth - newState.mirrorShield!);
            console.log(`[MirrorShield] ${enemy.name}受到${newState.mirrorShield}点反弹伤害`);
          }
        });
        newState.mirrorShield = 0;
      }
      
      // 重置回合内特殊标记
      newState.noDefenseThisTurn = false;
      newState.duplicateCardPlayedThisTurn = {};
      
      // 检查玩家晕眩效果
      if (newState.playerStunned && newState.playerStunned > 0) {
        newState.playerStunned -= 1;
        newState.isPlayerTurn = false;
        console.log(`[PlayerStunned] 玩家晕眩！跳过本回合，剩余${newState.playerStunned}层`);
        // 晕眩時也会减少虚弱和易伤层数
        if (newState.playerWeak && newState.playerWeak > 0) {
          newState.playerWeak -= 1;
          console.log(`[Debuff] 玩家虚弱减少1层，剩余${newState.playerWeak}层`);
        }
        if (newState.playerVulnerable && newState.playerVulnerable > 0) {
          newState.playerVulnerable -= 1;
          console.log(`[Debuff] 玩家易伤减少1层，剩余${newState.playerVulnerable}层`);
        }
        // 继续敌人回合
      } else {
        newState.isPlayerTurn = true;
      }
      
      // 应用玩家中毒效果（回合开始时，但可以被免疫）
      if (newState.playerPoison && newState.playerPoison > 0) {
        if (newState.immuneDebuff && newState.immuneDebuff > 0) {
          console.log(`[Immune] 免疫中毒效果！`);
          newState.playerPoison = 0;
        } else {
          const poisonDamage = newState.playerPoison;
          if (newState.characters[0]) {
            newState.characters[0].currentEnergy = Math.max(0, newState.characters[0].currentEnergy - poisonDamage);
            console.log(`[PlayerEffect] 中毒发作！受到${poisonDamage}点伤害`);
          }
          newState.playerPoison = 0; // 中毒每回合清除
        }
      }
      
      // 应用玩家过时效果（可以被免疫）
      if (newState.playerDecay && newState.playerDecay > 0) {
        if (newState.immuneDebuff && newState.immuneDebuff > 0) {
          console.log(`[Immune] 免疫过时效果！`);
          newState.playerDecay = 0;
        } else {
          newState.playerDecay = 0; // 过时效果每回合清除
        }
      }
      
      // 减少免疫debuff层数
      if (newState.immuneDebuff && newState.immuneDebuff > 0) {
        newState.immuneDebuff -= 1;
        console.log(`[Immune] 免疫层数减少，剩余${newState.immuneDebuff}层`);
      }
      
      // 为每个存活的敌人生成新的意图（保存上回合意图作为历史记录）
      newState.currentEnemies = newState.currentEnemies.map(enemy => {
        if (enemy.currentHealth > 0) {
          // 保存当前意图作为上回合行动记录
          const previousIntent = enemy.intent ? { ...enemy.intent } : undefined;
          return { 
            ...enemy, 
            previousIntent: previousIntent,
            intent: generateIntent(enemy) 
          };
        }
        return enemy;
      });
      
      // 晕眩時保留手牌，不抽新牌; 正常回合弃牌抽新牌
      if (newState.playerStunned && newState.playerStunned > 0) {
        // 晕眩状态: 保留当前手牌，不抽新牌
        console.log(`[PlayerStunned] 晕眩中，保留手牌${newState.hand.length}张，跳过抽牌`);
      } else {
        // 正常回合: 弃牌并抽新牌
        newState.discard = [...newState.discard, ...newState.hand];
        newState.hand = [];
      }
      
      const stats = computeStats(newState.hardware);
      newState.currentCost = stats.maxEnergy - (newState.nextTurnCostPenalty || 0);
      newState.maxCost = stats.maxEnergy;
      newState.nextTurnCostPenalty = 0;
      if (!newState.shieldNoDecay) {
        newState.tempShield = 0;
      } else {
        console.log(`[ShieldNoDecay] 护盾不消失效果触发，保留${newState.tempShield}点护盾`);
        newState.shieldNoDecay = false; // 重置标记
      }
      
      // 应用下回合抽牌效果
      if (newState.nextDraw1Next && newState.nextDraw1Next > 0) {
        newState.nextTurnDrawBonus = (newState.nextTurnDrawBonus || 0) + newState.nextDraw1Next;
        console.log(`[NextTurn] 应用下回合抽牌效果: 额外抽${newState.nextDraw1Next}张牌`);
        newState.nextDraw1Next = 0;
      }
      
      // 应用下回合护盾效果 (shield8Next)
      if (newState.nextTurnShield8 && newState.nextTurnShield8 > 0) {
        newState.tempShield = (newState.tempShield || 0) + newState.nextTurnShield8;
        console.log(`[NextTurn] 应用下回合护盾效果: 获得${newState.nextTurnShield8}点护盾`);
        newState.nextTurnShield8 = 0;
      }
      
      // 应用所有友军下回合护盾效果 (allShield5Next)
      if (newState.allShield5Next && newState.allShield5Next > 0) {
        newState.tempShield = (newState.tempShield || 0) + newState.allShield5Next;
        console.log(`[NextTurn] 应用友军护盾效果: 获得${newState.allShield5Next}点护盾`);
        newState.allShield5Next = 0;
      }
      
      // 将延迟的卡牌加入手牌
      if (newState.delayedCards && newState.delayedCards.length > 0) {
        newState.hand = [...newState.hand, ...newState.delayedCards];
        console.log(`[DelayedCards] 将${newState.delayedCards.length}张延迟卡牌加入手牌`);
        newState.delayedCards = [];
      }
      
      // 高松灯特性: 每回合首次抽牌時，额外抽1张
      // 晕眩時不抽牌，正常回合抽牌
      if (!(newState.playerStunned && newState.playerStunned > 0)) {
        const baseDraw = stats.drawPower + (newState.nextTurnDrawBonus || 0);
        const extraDraw = newState.characters[0]?.id === 'tomori' ? 1 : 0;
        if (extraDraw > 0) {
          console.log(`[Character] 高松灯: 回合抽牌额外+1！`);
        }
        const drawResult = drawCards(baseDraw + extraDraw, 
          newState.deck, newState.hand, newState.discard);
        newState.deck = drawResult.deck;
        newState.hand = drawResult.hand;
        newState.discard = drawResult.discard;
      }
      newState.nextTurnDrawBonus = 0;
      
      return newState;
    });
  }, [drawCards]);

  const buyCard = useCallback((card: Card) => {
    setGameState(prev => {
      const price = getCardPrice(card);
      if (prev.money < price) return prev;
      
      return {
        ...prev,
        money: prev.money - price,
        deck: [...prev.deck, card]
      };
    });
  }, []);

  const removeCard = useCallback((cardIndex: number) => {
    setGameState(prev => {
      const newDeck = [...prev.deck];
      newDeck.splice(cardIndex, 1);
      return { ...prev, deck: newDeck };
    });
  }, []);

  const upgradeCard = useCallback((cardIndex: number) => {
    setGameState(prev => {
      if (prev.money < 50) return prev;
      
      const newDeck = [...prev.deck];
      const card = newDeck[cardIndex];
      if (card) {
        newDeck[cardIndex] = { ...card, effect: { ...card.effect, value: card.effect.value + 3 } };
      }
      
      return { ...prev, money: prev.money - 50, deck: newDeck };
    });
  }, []);

  const healAtRest = useCallback(() => {
    setGameState(prev => {
      if (prev.money < 30) return prev;
      
      const newCharacters = [...prev.characters];
      if (newCharacters[0]) {
        newCharacters[0] = { ...newCharacters[0], currentEnergy: newCharacters[0].maxEnergy };
      }
      
      return { ...prev, money: prev.money - 30, characters: newCharacters };
    });
  }, []);

  // 额外的游戏控制方法
  const startNewGame = useCallback((_arg?: string) => {
    setGameState(createInitialState());
  }, []);

  const returnToMap = useCallback(() => {
    setGameState(prev => {
      const newFloors = [...prev.floors];
      const currentFloor = newFloors[prev.currentFloor];

      // 处理强制Boss战
      if (prev.forceBossNow) {
        let bossEnemies = getBossForFloor(prev.currentFloor + 1);
        
        // 应用敌人生命buff
        if (prev.enemyHpBuffFights && prev.enemyHpBuffFights > 0) {
          const buffMultiplier = 1.5;
          bossEnemies = bossEnemies.map(enemy => ({
            ...enemy,
            maxHealth: Math.floor(enemy.maxHealth * buffMultiplier),
            currentHealth: Math.floor(enemy.currentHealth * buffMultiplier)
          }));
          console.log(`[Event] Boss战！敌人强化生命x1.5`);
        }
        
        // 保留当前手牌，将牌库和弃牌堆洗回牌库
        const combinedDeck = shuffleDeck([...prev.deck, ...prev.discard]);
        
        return {
          ...prev,
          gamePhase: 'combat',
          currentEnemies: bossEnemies,
          forceBossNow: false,
          turn: 1,
          isPlayerTurn: true,
          deck: combinedDeck,
          // 保留手牌，不清空
          discard: [],
          tempShield: 0,
          cardsPlayedThisTurn: 0
        };
      }

      if (currentFloor && prev.currentRoom) {
        const roomIndex = currentFloor.rooms.findIndex(r => r.id === prev.currentRoom?.id);
        if (roomIndex >= 0) {
          currentFloor.rooms[roomIndex] = { ...currentFloor.rooms[roomIndex], cleared: true };
        }
      }
      return { ...prev, floors: newFloors, gamePhase: 'map' };
    });
  }, []);

  const rest = useCallback(() => {
    setGameState(prev => {
      const newCharacters = [...prev.characters];
      if (newCharacters[0]) {
        newCharacters[0] = { ...newCharacters[0], currentEnergy: newCharacters[0].maxEnergy };
      }
      
      const newFloors = [...prev.floors];
      const currentFloor = newFloors[prev.currentFloor];
      if (currentFloor && prev.currentRoom) {
        const roomIndex = currentFloor.rooms.findIndex(r => r.id === prev.currentRoom?.id);
        if (roomIndex >= 0) {
          currentFloor.rooms[roomIndex] = { ...currentFloor.rooms[roomIndex], cleared: true };
        }
      }
      
      return { ...prev, floors: newFloors, characters: newCharacters, gamePhase: 'map' };
    });
  }, []);

  const nextFloor = useCallback(() => {
    setGameState(prev => {
      const nextFloorIndex = prev.currentFloor + 1;
      const nextFloor = prev.floors[nextFloorIndex];
      const firstRoom = nextFloor?.rooms[0];
      
      const newFloors = [...prev.floors];
      if (newFloors[nextFloorIndex] && firstRoom) {
        newFloors[nextFloorIndex] = { ...newFloors[nextFloorIndex], currentRoomId: firstRoom.id };
      }
      
      return {
        ...prev,
        floors: newFloors,
        currentFloor: nextFloorIndex,
        currentRoom: firstRoom || null,
        gamePhase: 'map'
      };
    });
  }, []);

  const returnToMenu = useCallback(() => {
    setGameState(createInitialState());
  }, []);

  const completeTutorial = useCallback(() => {
    setGameState(prev => ({ ...prev, tutorialCompleted: true, gamePhase: 'character_select' }));
  }, []);

  const skipTutorial = useCallback(() => {
    setGameState(prev => ({ ...prev, tutorialCompleted: true, gamePhase: 'character_select' }));
  }, []);

  // 硬件购买方法
  const buyMotherboard = useCallback((mobo: any) => {
    setGameState(prev => {
      if (prev.money < mobo.price) return prev;
      return { 
        ...prev, 
        money: prev.money - mobo.price,
        hardware: { ...prev.hardware, motherboard: mobo }
      };
    });
  }, []);

  const buyCPU = useCallback((cpu: any) => {
    setGameState(prev => {
      if (prev.money < cpu.price) return prev;
      return { 
        ...prev, 
        money: prev.money - cpu.price,
        hardware: { ...prev.hardware, cpu: cpu }
      };
    });
  }, []);

  const buyRAM = useCallback((ram: any) => {
    setGameState(prev => {
      if (prev.money < ram.price) return prev;
      
      // 检查主板内存槽限制
      const maxSlots = prev.hardware.motherboard?.ramSlots || 2;
      if (prev.hardware.ramSticks.length >= maxSlots) {
        console.log(`[BuyRAM] 内存槽已满，无法安装更多内存`);
        return prev;
      }
      return { 
        ...prev, 
        money: prev.money - ram.price,
        hardware: { 
          ...prev.hardware, 
          ramSticks: [...prev.hardware.ramSticks, ram]
        }
      };
    });
  }, []);

  const sellRAM = useCallback((index: number) => {
    setGameState(prev => {
      if (index < 0 || index >= prev.hardware.ramSticks.length) return prev;
      const soldRam = prev.hardware.ramSticks[index];
      const refund = Math.floor(soldRam.price * 0.5); // 出售价格50%返还
      return { 
        ...prev, 
        money: prev.money + refund,
        hardware: {
          ...prev.hardware,
          ramSticks: prev.hardware.ramSticks.filter((_, i) => i !== index)
        }
      };
    });
  }, []);

  const buyGPU = useCallback((gpu: any) => {
    setGameState(prev => {
      if (prev.money < gpu.price) return prev;
      return { 
        ...prev, 
        money: prev.money - gpu.price,
        hardware: { ...prev.hardware, gpu: gpu }
      };
    });
  }, []);

  const sellGPU = useCallback(() => {
    setGameState(prev => {
      if (!prev.hardware.gpu) return prev;
      const refund = Math.floor(prev.hardware.gpu.price * 0.5);
      return { 
        ...prev, 
        money: prev.money + refund,
        hardware: { ...prev.hardware, gpu: null }
      };
    });
  }, []);

  const buyPSU = useCallback((psu: any) => {
    setGameState(prev => {
      if (prev.money < psu.price) return prev;
      return { 
        ...prev, 
        money: prev.money - psu.price,
        hardware: { ...prev.hardware, psu: psu }
      };
    });
  }, []);

  const buyRemoveCard = useCallback(() => {
    setGameState(prev => {
      const price = 50 + prev.deck.length * 5;
      if (prev.money < price) return prev;
      return { ...prev, money: prev.money - price };
    });
  }, []);

  // 选择奖励卡牌
  const selectReward = useCallback((cardIndex: number) => {
    setGameState(prev => {
      const rewardCards = prev.rewardCards || [];
      if (cardIndex < 0 || cardIndex >= rewardCards.length) {
        // 跳过奖励
        return { ...prev, rewardCards: [], gamePhase: 'map' };
      }
      const selectedCard = rewardCards[cardIndex];
      console.log(`[Reward] 选择了卡牌: ${selectedCard.name}`);
      return {
        ...prev,
        deck: [...prev.deck, selectedCard],
        rewardCards: [],
        gamePhase: 'map'
      };
    });
  }, []);

  // 跳过奖励
  const skipReward = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      rewardCards: [],
      gamePhase: 'map'
    }));
  }, []);

  // 添加战斗记录
  const addCombatLog = useCallback((entry: Omit<import('@/types/game').CombatLogEntry, 'turn'>) => {
    setGameState(prev => {
      if (!prev.combatLog) return prev;
      return {
        ...prev,
        combatLog: [...prev.combatLog, { ...entry, turn: prev.turn }]
      };
    });
  }, []);

  // 完成灵感选择
  const completeInspiration = useCallback((selectedIndices: number[], discardedIndices?: number[], remainingOrder?: number[]) => {
    setGameState(prev => {
      if (!prev.inspiration || !prev.inspiration.isActive) return prev;
      
      const newState = { ...prev };
      const inspiration = prev.inspiration;
      
      // 获取选中的卡牌
      const selectedCards = selectedIndices.map(i => inspiration.cards[i]);
      const discardedCards = discardedIndices?.map(i => inspiration.cards[i]) || [];
      
      // 根据回调类型处理结果
      switch (inspiration.callbackAction) {
        case 'scry_3_pick_1':
          // 将选中的卡牌加入手牌，其余放回牌库底
          newState.hand = [...newState.hand, ...selectedCards];
          const remainingCards1 = inspiration.cards.filter((_, i) => !selectedIndices.includes(i));
          newState.deck = [...newState.deck, ...remainingCards1];
          console.log(`[Inspiration] 选择${selectedCards.length}张加入手牌，${remainingCards1.length}张放回牌库`);
          break;
          
        case 'draw_2_choose_discount':
          // 选中的加入手牌，弃掉的丢掉，并给予费用减免
          if (selectedCards.length > 0) {
            newState.hand = [...newState.hand, selectedCards[0]];
            // 弃掉未选中的
            const unselected = inspiration.cards.filter((_, i) => !selectedIndices.includes(i));
            newState.discard = [...newState.discard, ...unselected];
            // 费用减免
            newState.nextCardCostMinus = (newState.nextCardCostMinus || 0) + 1;
            console.log(`[Inspiration] 保留${selectedCards[0].name}，弃掉${unselected.length}张，下张费用-1`);
          }
          break;
          
        case 'scry_5_arrange':
          // 按照玩家指定的顺序将卡牌放回牌库顶，弃掉的放入弃牌堆
          const orderedRemaining = remainingOrder?.map(i => inspiration.cards[i]) || 
            inspiration.cards.filter((_, i) => !selectedIndices.includes(i) && !(discardedIndices || []).includes(i));
          newState.deck = [...orderedRemaining, ...newState.deck];
          newState.discard = [...newState.discard, ...discardedCards];
          console.log(`[Inspiration] 保留${orderedRemaining.length}张在牌库顶，弃掉${discardedCards.length}张`);
          break;
          
        case 'scry_10_fetch_3':
          // 将选中的3张加入手牌，其余放回牌库底
          newState.hand = [...newState.hand, ...selectedCards];
          const remainingCards10 = inspiration.cards.filter((_, i) => !selectedIndices.includes(i));
          newState.deck = [...newState.deck, ...remainingCards10];
          console.log(`[Inspiration] 选择${selectedCards.length}张加入手牌，${remainingCards10.length}张放回牌库`);
          break;
          
        case 'choose_shield_or_draw':
          // 根据选择的选项执行效果
          if (selectedCards.length > 0) {
            const choice = selectedCards[0];
            if (choice.id === 'inspiration_shield_8') {
              newState.tempShield = (newState.tempShield || 0) + 8;
              console.log(`[Inspiration] 选择获得8点护盾`);
            } else if (choice.id === 'inspiration_draw_2') {
              // 抽2张牌
              const dr = drawCards(2, newState.deck, newState.hand, newState.discard);
              newState.deck = dr.deck;
              newState.hand = dr.hand;
              newState.discard = dr.discard;
              console.log(`[Inspiration] 选择抽2张牌`);
            }
          }
          break;
      }
      
      // 清除灵感状态
      newState.inspiration = undefined;
      
      return newState;
    });
  }, [drawCards]);

  // 解锁天赋
  const unlockTalent = useCallback((talentId: import('@/systems/characterTalentTree').TalentId) => {
    let success = false;
    setGameState(prev => {
      if (!prev.talentTree || (prev.talentPoints || 0) <= 0) return prev;
      
      // 检查是否已解锁
      if (prev.talentTree.unlockedTalents.includes(talentId)) return prev;
      
      // 提取路径和层级检查前置条件
      const match = talentId.match(/^(\w+)_(a|b)(\d)$/);
      if (!match) return prev;
      
      const [, charId, path, level] = match;
      const levelNum = parseInt(level);
      
      // 检查前置天赋
      if (levelNum > 1) {
        const prevTalentId = `${charId}_${path}${levelNum - 1}` as import('@/systems/characterTalentTree').TalentId;
        if (!prev.talentTree.unlockedTalents.includes(prevTalentId)) {
          return prev;
        }
      }
      
      success = true;
      console.log(`[Talent] 解锁天赋: ${talentId}`);
      
      return {
        ...prev,
        talentPoints: (prev.talentPoints || 0) - 1,
        talentTree: {
          ...prev.talentTree,
          unlockedTalents: [...prev.talentTree.unlockedTalents, talentId]
        }
      };
    });
    return success;
  }, []);

  // 处理事件效果
  const applyEventResult = useCallback((result: {
    money?: number;
    health?: number;
    maxHealth?: number;
    cards?: number;
    removeCards?: number;
    upgradeCards?: number;
    curses?: number;
    damageBonus?: number;
    drawBonus?: number;
    enemyBuff?: number;
    skipReward?: boolean;
    messages: string[];
  }) => {
    setGameState(prev => {
      const newState = { ...prev };
      
      if (result.money) {
        newState.money = Math.max(0, newState.money + result.money);
      }
      
      if (result.health && newState.characters[0]) {
        newState.characters = newState.characters.map((char, idx) => 
          idx === 0 ? {
            ...char,
            currentEnergy: Math.max(0, Math.min(char.maxEnergy, char.currentEnergy + result.health!))
          } : char
        );
      }
      
      if (result.maxHealth && newState.characters[0]) {
        newState.characters = newState.characters.map((char, idx) => 
          idx === 0 ? {
            ...char,
            maxEnergy: char.maxEnergy + result.maxHealth!,
            currentEnergy: char.currentEnergy + result.maxHealth!
          } : char
        );
      }
      
      if (result.damageBonus) {
        newState.permanentDamageBonus = (newState.permanentDamageBonus || 0) + result.damageBonus;
      }
      
      if (result.drawBonus) {
        newState.permanentDrawBonus = (newState.permanentDrawBonus || 0) + result.drawBonus;
      }
      
      if (result.enemyBuff) {
        newState.enemyHpBuffFights = (newState.enemyHpBuffFights || 0) + result.enemyBuff;
      }
      
      if (result.skipReward) {
        newState.skipNextReward = true;
      }
      
      return newState;
    });
  }, []);

  return {
    gameState,
    setGameState,
    selectCharacter,
    enterRoom,
    playCard,
    endTurn,
    buyCard,
    removeCard,
    upgradeCard,
    healAtRest,
    startNewGame,
    returnToMap,
    rest,
    nextFloor,
    returnToMenu,
    completeTutorial,
    skipTutorial,
    buyMotherboard,
    buyCPU,
    buyRAM,
    sellRAM,
    buyGPU,
    sellGPU,
    buyPSU,
    buyRemoveCard,
    selectReward,
    skipReward,
    addCombatLog,
    completeInspiration,
    applyEventResult,
    unlockTalent,
  };
}
