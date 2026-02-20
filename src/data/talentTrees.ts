/**
 * 角色天赋树系统
 * 每个角色2条路线，每条路线3个天赋
 * 战斗中击败敌人获得天赋点
 */

export interface Talent {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number; // 天赋点消耗
  effect: {
    type: 'drawBonus' | 'damageBonus' | 'shieldBonus' | 'maxHealth' | 'maxEnergy' | 'startShield' | 'healPerTurn' | 'moneyBonus' | 'special';
    value: number;
    target?: string;
  };
}

export interface TalentBranch {
  id: string;
  name: string;
  description: string;
  icon: string;
  talents: Talent[];
}

export interface TalentTree {
  characterId: string;
  branches: [TalentBranch, TalentBranch]; // 两条路线
}

// ==================== 高松灯 - 诗人/迷路 ====================
export const tomoriTalents: TalentTree = {
  characterId: 'tomori',
  branches: [
    {
      id: 'poet',
      name: '诗人之路',
      description: '通过抽牌和观察找到战斗的节奏',
      icon: 'Feather',
      talents: [
        {
          id: 'tomori_poet_1',
          name: '收集石头',
          description: '战斗开始时额外抽1张牌',
          icon: 'Gem',
          cost: 1,
          effect: { type: 'drawBonus', value: 1 }
        },
        {
          id: 'tomori_poet_2',
          name: '写下诗句',
          description: '每回合抽牌数+1',
          icon: 'Pen',
          cost: 2,
          effect: { type: 'drawBonus', value: 1 }
        },
        {
          id: 'tomori_poet_3',
          name: '诗的力量',
          description: '战斗开始时获得8护盾',
          icon: 'Scroll',
          cost: 3,
          effect: { type: 'startShield', value: 8 }
        }
      ]
    },
    {
      id: 'lost',
      name: '迷路之人',
      description: '在迷茫中坚持，越危险越强大',
      icon: 'Compass',
      talents: [
        {
          id: 'tomori_lost_1',
          name: '一起迷路吧',
          description: '生命值低于50%时，伤害+2',
          icon: 'Map',
          cost: 1,
          effect: { type: 'special', value: 2, target: 'lowHpDamageBonus' }
        },
        {
          id: 'tomori_lost_2',
          name: '迷失的坚强',
          description: '最大生命值+10',
          icon: 'Heart',
          cost: 2,
          effect: { type: 'maxHealth', value: 10 }
        },
        {
          id: 'tomori_lost_3',
          name: '永远的歌声',
          description: '生命值低于25%时，所有伤害翻倍',
          icon: 'Mic',
          cost: 3,
          effect: { type: 'special', value: 2, target: 'criticalHpDoubleDamage' }
        }
      ]
    }
  ]
};

// ==================== 千早爱音 - 社交/赚钱 ====================
export const anonTalents: TalentTree = {
  characterId: 'anon',
  branches: [
    {
      id: 'social',
      name: '社交达人',
      description: '用金钱和人脉解决问题',
      icon: 'Users',
      talents: [
        {
          id: 'anon_social_1',
          name: '粉丝应援',
          description: '战斗获得金钱+20%',
          icon: 'Coins',
          cost: 1,
          effect: { type: 'moneyBonus', value: 0.2 }
        },
        {
          id: 'anon_social_2',
          name: '网红效应',
          description: '商店价格-15%',
          icon: 'TrendingUp',
          cost: 2,
          effect: { type: 'special', value: 0.85, target: 'shopDiscount' }
        },
        {
          id: 'anon_social_3',
          name: '绝对C位',
          description: '手牌上限+2',
          icon: 'Crown',
          cost: 3,
          effect: { type: 'special', value: 2, target: 'handSizeBonus' }
        }
      ]
    },
    {
      id: 'chaos',
      name: '混沌之力',
      description: '总会有办法的！随机应变',
      icon: 'Dices',
      talents: [
        {
          id: 'anon_chaos_1',
          name: '临时抱佛脚',
          description: '战斗开始时随机获得3-6点护盾',
          icon: 'Shuffle',
          cost: 1,
          effect: { type: 'startShield', value: 4 }
        },
        {
          id: 'anon_chaos_2',
          name: '出风头',
          description: '随机伤害牌范围+2',
          icon: 'Sparkles',
          cost: 2,
          effect: { type: 'special', value: 2, target: 'randomDamageBonus' }
        },
        {
          id: 'anon_chaos_3',
          name: '总会有办法的',
          description: '生命值低于30%时，恢复5生命并获得2能量',
          icon: 'Wand2',
          cost: 3,
          effect: { type: 'special', value: 5, target: 'emergencyHealAndEnergy' }
        }
      ]
    }
  ]
};

// ==================== 要乐奈 - 野猫/吉他 ====================
export const ranaTalents: TalentTree = {
  characterId: 'rana',
  branches: [
    {
      id: 'cat',
      name: '野猫本能',
      description: '灵活多变，出其不意',
      icon: 'Cat',
      talents: [
        {
          id: 'rana_cat_1',
          name: '猫之优雅',
          description: '每回合第一张攻击牌费用-1',
          icon: 'Wind',
          cost: 1,
          effect: { type: 'special', value: 1, target: 'firstAttackCostMinus' }
        },
        {
          id: 'rana_cat_2',
          name: '九条命',
          description: '最大生命值+8，每回合恢复1生命',
          icon: 'Heart',
          cost: 2,
          effect: { type: 'healPerTurn', value: 1 }
        },
        {
          id: 'rana_cat_3',
          name: '野猫乱舞',
          description: '攻击牌有25%几率打出两次',
          icon: 'Swords',
          cost: 3,
          effect: { type: 'special', value: 0.25, target: 'attackDoubleChance' }
        }
      ]
    },
    {
      id: 'guitar',
      name: '吉他之魂',
      description: '用音乐撕裂敌人',
      icon: 'Music',
      talents: [
        {
          id: 'rana_guitar_1',
          name: '即兴演奏',
          description: '所有攻击伤害+2',
          icon: 'Zap',
          cost: 1,
          effect: { type: 'damageBonus', value: 2 }
        },
        {
          id: 'rana_guitar_2',
          name: '狂乱扫弦',
          description: '连击数+1（打出两次效果多一次）',
          icon: 'Flame',
          cost: 2,
          effect: { type: 'special', value: 1, target: 'extraStrike' }
        },
        {
          id: 'rana_guitar_3',
          name: '有趣的女人',
          description: '击败敌人时获得一个额外回合',
          icon: 'Star',
          cost: 3,
          effect: { type: 'special', value: 1, target: 'killExtraTurn' }
        }
      ]
    }
  ]
};

// ==================== 长崎爽世 - 防御/羁绊 ====================
export const soyoTalents: TalentTree = {
  characterId: 'soyo',
  branches: [
    {
      id: 'defense',
      name: '铁壁防御',
      description: '坚不可摧的护盾',
      icon: 'Shield',
      talents: [
        {
          id: 'soyo_defense_1',
          name: '优雅姿态',
          description: '所有护盾效果+2',
          icon: 'Sparkles',
          cost: 1,
          effect: { type: 'shieldBonus', value: 2 }
        },
        {
          id: 'soyo_defense_2',
          name: '母亲的教诲',
          description: '战斗开始时获得12护盾',
          icon: 'BookOpen',
          cost: 2,
          effect: { type: 'startShield', value: 12 }
        },
        {
          id: 'soyo_defense_3',
          name: '绝对防御',
          description: '护盾上限+20，超出部分转化为生命',
          icon: 'ShieldCheck',
          cost: 3,
          effect: { type: 'special', value: 20, target: 'shieldOverheal' }
        }
      ]
    },
    {
      id: 'bond',
      name: '羁绊之力',
      description: '为了团队，为了CRYCHIC',
      icon: 'Heart',
      talents: [
        {
          id: 'soyo_bond_1',
          name: '一生乐队',
          description: '最大能量+1',
          icon: 'Battery',
          cost: 1,
          effect: { type: 'maxEnergy', value: 1 }
        },
        {
          id: 'soyo_bond_2',
          name: '回忆守护',
          description: '受到的伤害-1（最低1）',
          icon: 'Clock',
          cost: 2,
          effect: { type: 'special', value: 1, target: 'damageReduction' }
        },
        {
          id: 'soyo_bond_3',
          name: '无法割舍',
          description: '生命值降至0时，保留1生命并恢复20护盾（每场战斗1次）',
          icon: 'Ghost',
          cost: 3,
          effect: { type: 'special', value: 1, target: 'cheatDeath' }
        }
      ]
    }
  ]
};

// ==================== 椎名立希 - 节奏/鼓手 ====================
export const takiTalents: TalentTree = {
  characterId: 'taki',
  branches: [
    {
      id: 'rhythm',
      name: '完美节奏',
      description: '精准规划，掌控全局',
      icon: 'Activity',
      talents: [
        {
          id: 'taki_rhythm_1',
          name: '数拍子',
          description: '每回合多抽1张牌，但手牌上限-1',
          icon: 'Timer',
          cost: 1,
          effect: { type: 'drawBonus', value: 1 }
        },
        {
          id: 'taki_rhythm_2',
          name: '保持节奏',
          description: '连续打出同类型牌时，第三张效果+50%',
          icon: 'GitCommit',
          cost: 2,
          effect: { type: 'special', value: 0.5, target: 'comboBonus' }
        },
        {
          id: 'taki_rhythm_3',
          name: '精准打击',
          description: '所有攻击无视敌人25%护盾',
          icon: 'Crosshair',
          cost: 3,
          effect: { type: 'special', value: 0.25, target: 'shieldPierce' }
        }
      ]
    },
    {
      id: 'drum',
      name: '鼓点狂潮',
      description: '用鼓点击溃敌人',
      icon: 'Drum',
      talents: [
        {
          id: 'taki_drum_1',
          name: '基础节奏',
          description: '所有攻击伤害+1，连击牌额外+1',
          icon: 'Zap',
          cost: 1,
          effect: { type: 'damageBonus', value: 1 }
        },
        {
          id: 'taki_drum_2',
          name: '鼓点加速',
          description: '打出3张牌后，获得1能量',
          icon: 'FastForward',
          cost: 2,
          effect: { type: 'special', value: 1, target: 'cardPlayEnergy' }
        },
        {
          id: 'taki_drum_3',
          name: '终章独奏',
          description: '牌库少于5张时，所有伤害翻倍',
          icon: 'Flame',
          cost: 3,
          effect: { type: 'special', value: 2, target: 'lowDeckDoubleDamage' }
        }
      ]
    }
  ]
};

// 所有天赋树导出
export const allTalentTrees: Record<string, TalentTree> = {
  tomori: tomoriTalents,
  anon: anonTalents,
  rana: ranaTalents,
  soyo: soyoTalents,
  taki: takiTalents
};

// 获取角色天赋树
export function getTalentTree(characterId: string): TalentTree | undefined {
  return allTalentTrees[characterId];
}

// 获取天赋总消耗（用于显示）
export function getTotalTalentCost(tree: TalentTree): number {
  return tree.branches.reduce((sum, branch) => 
    sum + branch.talents.reduce((tSum, t) => tSum + t.cost, 0), 0);
}
