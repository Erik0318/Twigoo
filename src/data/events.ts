/**
 * 随机事件系统 - 重写版
 * 支持条件判断、多种效果类型、更好的策略性
 */

import type { GameState, Card } from '@/types/game';
import { curseCards, getRandomCards } from './cards';
import { getRandomHardware } from './hardware';

// ==================== 事件效果类型 ====================

export type EventEffectType = 
  | 'money'           // 金钱变化
  | 'health'          // 生命变化
  | 'maxHealth'       // 最大生命变化
  | 'card'            // 获得卡牌
  | 'removeCard'      // 移除卡牌
  | 'upgradeCard'     // 升级卡牌
  | 'curse'           // 获得诅咒
  | 'shield'          // 获得护盾（仅在事件中）
  | 'damageBonus'     // 永久伤害加成
  | 'drawBonus'       // 永久抽牌加成
  | 'enemyBuff'       // 敌人强化
  | 'skipReward'      // 跳过下次奖励
  | 'forceBoss'       // 强制Boss战
  | 'hardware'        // 获得硬件
  | 'special';        // 特殊效果

export interface EventEffect {
  type: EventEffectType;
  value: number;
  target?: string;    // 用于指定卡牌类型等
}

// ==================== 事件选项 ====================

export interface EventChoice {
  id: string;
  text: string;
  description?: string;  // 详细说明
  effects: EventEffect[];
  condition?: (state: GameState) => boolean;  // 可选条件
  conditionText?: string;  // 不满足条件时显示的提示
}

// ==================== 事件定义 ====================

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  category: 'benefit' | 'risk' | 'choice' | 'random' | 'shop';
  choices: EventChoice[];
}

// ==================== 工具函数 ====================

function removeRandomCard(state: GameState): Card | null {
  if (state.deck.length === 0) return null;
  const index = Math.floor(Math.random() * state.deck.length);
  return state.deck.splice(index, 1)[0];
}

// ==================== 事件列表 ====================

export const events: GameEvent[] = [
  // ===== 增益事件 =====
  {
    id: 'rest_stop',
    title: '「调试咖啡」',
    category: 'benefit',
    description: '你发现了一家安静的咖啡馆，可以稍作休息。',
    choices: [
      {
        id: 'rest_heal',
        text: '喝杯咖啡恢复状态',
        description: '恢复20点精力',
        effects: [{ type: 'health', value: 20 }]
      },
      {
        id: 'rest_draw',
        text: '阅读技术博客',
        description: '永久抽牌+1',
        effects: [{ type: 'drawBonus', value: 1 }]
      },
      {
        id: 'rest_leave',
        text: '继续赶路',
        description: '无事发生',
        effects: []
      }
    ]
  },
  {
    id: 'open_source_contribution',
    title: '「开源贡献」',
    category: 'benefit',
    description: '你修复了一个开源项目的Bug，社区想要回报你。',
    choices: [
      {
        id: 'contrib_money',
        text: '接受赞助',
        description: '获得40金钱',
        effects: [{ type: 'money', value: 40 }]
      },
      {
        id: 'contrib_card',
        text: '获得社区奖励卡牌',
        description: '获得2张随机卡牌（可能包含稀有卡）',
        effects: [{ type: 'card', value: 2 }]
      },
      {
        id: 'contrib_leave',
        text: '婉拒好意',
        description: '无事发生',
        effects: []
      }
    ]
  },
  {
    id: 'legacy_code_cleanup',
    title: '「重构遗留代码」',
    category: 'benefit',
    description: '你发现了一段可以优化的旧代码。',
    choices: [
      {
        id: 'cleanup_remove',
        text: '删除无用代码',
        description: '从牌组中移除1张卡',
        effects: [{ type: 'removeCard', value: 1 }]
      },
      {
        id: 'cleanup_upgrade',
        text: '优化核心函数',
        description: '升级1张卡牌（伤害+2）',
        effects: [{ type: 'upgradeCard', value: 2 }]
      },
      {
        id: 'cleanup_leave',
        text: '如果它能跑就别动它',
        description: '无事发生',
        effects: []
      }
    ]
  },

  // ===== 风险事件 =====
  {
    id: 'production_bug',
    title: '「生产环境Bug」',
    category: 'risk',
    description: '糟了！线上出现了一个严重Bug，需要紧急处理。',
    choices: [
      {
        id: 'bug_fix',
        text: '熬夜修复',
        description: '失去15精力，但获得30金钱加班费',
        effects: [
          { type: 'health', value: -15 },
          { type: 'money', value: 30 }
        ]
      },
      {
        id: 'bug_hotfix',
        text: '打临时补丁',
        description: '获得1张诅咒卡，但立即解决',
        effects: [{ type: 'curse', value: 1 }]
      },
      {
        id: 'bug_ignore',
        text: '装作没看见',
        description: '下2场战斗敌人生命+50%（技术债爆发）',
        effects: [{ type: 'enemyBuff', value: 2 }]
      }
    ]
  },
  {
    id: 'dependency_hell',
    title: '「依赖地狱」',
    category: 'risk',
    description: 'npm install 陷入了无尽的依赖冲突...',
    choices: [
      {
        id: 'dep_fix',
        text: '手动解决冲突',
        description: '失去10精力',
        effects: [{ type: 'health', value: -10 }]
      },
      {
        id: 'dep_rmrf',
        text: '删除 node_modules 重装',
        description: '失去20金钱（流量费），移除1张卡',
        effects: [
          { type: 'money', value: -20 },
          { type: 'removeCard', value: 1 }
        ]
      },
      {
        id: 'dep_yolo',
        text: '--force 强行安装',
        description: '获得2张诅咒卡',
        effects: [{ type: 'curse', value: 2 }]
      }
    ]
  },
  {
    id: 'server_crash',
    title: '「服务器崩溃」',
    category: 'risk',
    description: '服务器在凌晨3点宕机了，PagerDuty在尖叫。',
    choices: [
      {
        id: 'crash_fix',
        text: '立即上线修复',
        description: '失去20精力，获得50金钱',
        effects: [
          { type: 'health', value: -20 },
          { type: 'money', value: 50 }
        ]
      },
      {
        id: 'crash_restart',
        text: '重启试试',
        description: '失去10精力，跳过下一场战斗奖励',
        effects: [
          { type: 'health', value: -10 },
          { type: 'skipReward', value: 1 }
        ]
      }
    ]
  },

  // ===== 选择事件 =====
  {
    id: 'startup_offer',
    title: '「创业公司邀约」',
    category: 'choice',
    description: '一家初创公司想挖你，给你股票期权。',
    choices: [
      {
        id: 'startup_join',
        text: '加入创业',
        description: '失去30金钱（机会成本），获得2张稀有卡，敌人强化3场',
        effects: [
          { type: 'money', value: -30 },
          { type: 'card', value: 2 },
          { type: 'enemyBuff', value: 3 }
        ]
      },
      {
        id: 'stay_safe',
        text: '继续打工',
        description: '获得20金钱',
        effects: [{ type: 'money', value: 20 }]
      }
    ]
  },
  {
    id: 'technical_debt',
    title: '「技术债偿还」',
    category: 'choice',
    description: '项目积累了太多技术债，是时候做出选择了。',
    choices: [
      {
        id: 'debt_pay',
        text: '全面重构',
        description: '失去20精力，移除2张卡，伤害永久+1',
        effects: [
          { type: 'health', value: -20 },
          { type: 'removeCard', value: 2 },
          { type: 'damageBonus', value: 1 }
        ]
      },
      {
        id: 'debt_accumulate',
        text: '继续堆积',
        description: '获得50金钱，获得2张诅咒卡',
        effects: [
          { type: 'money', value: 50 },
          { type: 'curse', value: 2 }
        ]
      }
    ]
  },
  {
    id: 'code_review',
    title: '「Code Review」',
    category: 'choice',
    description: '资深工程师 review 了你的代码。',
    choices: [
      {
        id: 'review_accept',
        text: '虚心接受建议',
        description: '升级2张卡牌',
        effects: [{ type: 'upgradeCard', value: 2 }]
      },
      {
        id: 'review_argue',
        text: ' arguing in comments ',
        description: '获得1张诅咒卡，但保留当前代码',
        effects: [{ type: 'curse', value: 1 }]
      },
      {
        id: 'review_ignore',
        text: '直接合并',
        description: '无事发生，但下1场战斗敌人强化',
        effects: [{ type: 'enemyBuff', value: 1 }]
      }
    ]
  },

  // ===== 随机事件 =====
  {
    id: 'lucky_find',
    title: '「意外发现」',
    category: 'random',
    description: '你在旧代码中发现了一个隐藏的彩蛋。',
    choices: [
      {
        id: 'lucky_open',
        text: '查看彩蛋',
        description: '随机获得以下之一：30金钱/1张稀有卡/恢复15精力',
        effects: [{ type: 'special', value: 1 }]  // 特殊处理
      },
      {
        id: 'lucky_leave',
        text: '不碰为妙',
        description: '无事发生',
        effects: []
      }
    ]
  },
  {
    id: 'mystery_box',
    title: '「神秘包裹」',
    category: 'random',
    description: '门口有一个来历不明的包裹，上面写着「给开发者」。',
    choices: [
      {
        id: 'box_open',
        text: '打开看看',
        description: '50%获得好奖励，50%获得诅咒',
        effects: [{ type: 'special', value: 2 }]
      },
      {
        id: 'box_leave',
        text: '扔掉',
        description: '无事发生',
        effects: []
      }
    ]
  },
  {
    id: 'rubber_duck',
    title: '「小黄鸭调试法」',
    category: 'random',
    description: '你对着小黄鸭解释代码，突然灵光一闪。',
    choices: [
      {
        id: 'duck_talk',
        text: '继续思考',
        description: '抽3张卡，弃掉1张',
        effects: [{ type: 'special', value: 3 }]
      },
      {
        id: 'duck_leave',
        text: '算了，去喝杯水',
        description: '恢复5精力',
        effects: [{ type: 'health', value: 5 }]
      }
    ]
  },

  // ===== 商店事件 =====
  {
    id: 'black_market',
    title: '「黑市交易」',
    category: 'shop',
    description: '你遇到了一个神秘的硬件贩子。',
    choices: [
      {
        id: 'market_buy',
        text: '购买来路不明的硬件',
        description: '花费50金钱，获得随机硬件',
        condition: (state) => state.money >= 50,
        conditionText: '需要50金钱',
        effects: [
          { type: 'money', value: -50 },
          { type: 'hardware', value: 1 }
        ]
      },
      {
        id: 'market_steal',
        text: '偷走硬件',
        description: '获得随机硬件，但获得1张诅咒卡',
        effects: [
          { type: 'hardware', value: 1 },
          { type: 'curse', value: 1 }
        ]
      },
      {
        id: 'market_leave',
        text: '离开',
        description: '无事发生',
        effects: []
      }
    ]
  },
  {
    id: 'fire_sale',
    title: '「清仓大甩卖」',
    category: 'shop',
    description: '一家硬件店即将关门，所有商品打折出售。',
    choices: [
      {
        id: 'sale_buy_card',
        text: '购买打折卡牌（30金钱）',
        description: '获得3张随机卡牌',
        condition: (state) => state.money >= 30,
        conditionText: '需要30金钱',
        effects: [
          { type: 'money', value: -30 },
          { type: 'card', value: 3 }
        ]
      },
      {
        id: 'sale_buy_remove',
        text: '购买删除服务（40金钱）',
        description: '移除1张卡',
        condition: (state) => state.money >= 40,
        conditionText: '需要40金钱',
        effects: [
          { type: 'money', value: -40 },
          { type: 'removeCard', value: 1 }
        ]
      },
      {
        id: 'sale_leave',
        text: '看看就好',
        description: '无事发生',
        effects: []
      }
    ]
  },

  // ===== MyGO主题事件 =====
  {
    id: 'haruhikage',
    title: '「为什么要演奏春日影」',
    category: 'choice',
    description: '前队友突然出现，质问你为什么要演奏那首歌...',
    choices: [
      {
        id: 'haru_explain',
        text: '解释清楚',
        description: '失去10精力，但获得1张强力角色卡',
        effects: [
          { type: 'health', value: -10 },
          { type: 'card', value: 1 }
        ]
      },
      {
        id: 'haru_run',
        text: '转身逃跑',
        description: '跳过这个事件，无事发生',
        effects: []
      },
      {
        id: 'haru_play',
        text: '继续演奏',
        description: '伤害永久+2，但敌人永久强化',
        effects: [
          { type: 'damageBonus', value: 2 },
          { type: 'enemyBuff', value: 99 }
        ]
      }
    ]
  },
  {
    id: 'mygo_formation',
    title: '「组一辈子乐队」',
    category: 'benefit',
    description: '队员们聚在一起，讨论乐队的未来。',
    choices: [
      {
        id: 'mygo_commit',
        text: '约定一辈子',
        description: '最大精力+5，失去10金钱（请队员喝饮料）',
        effects: [
          { type: 'maxHealth', value: 5 },
          { type: 'money', value: -10 }
        ]
      },
      {
        id: 'mygo_practice',
        text: '加练3小时',
        description: '升级1张卡牌',
        effects: [{ type: 'upgradeCard', value: 1 }]
      },
      {
        id: 'mygo_leave',
        text: '今天先解散',
        description: '恢复10精力',
        effects: [{ type: 'health', value: 10 }]
      }
    ]
  },
  {
    id: 'anon_social',
    title: '「爱音的社交网络」',
    category: 'benefit',
    description: '爱音想帮你宣传项目，吸引更多关注。',
    choices: [
      {
        id: 'anon_promote',
        text: '让她帮忙',
        description: '获得30金钱，敌人强化1场（被大佬关注压力增大）',
        effects: [
          { type: 'money', value: 30 },
          { type: 'enemyBuff', value: 1 }
        ]
      },
      {
        id: 'anon_decline',
        text: '低调开发',
        description: '获得1张稀有卡',
        effects: [{ type: 'card', value: 1 }]
      }
    ]
  },

  // ===== 程序梗事件 =====
  {
    id: 'stackoverflow_copy',
    title: '「StackOverflow 复制粘贴」',
    category: 'risk',
    description: '你从StackOverflow复制了一段看起来不错的代码。',
    choices: [
      {
        id: 'so_test',
        text: '先测试一下',
        description: '失去5精力，但确认代码安全',
        effects: [{ type: 'health', value: -5 }]
      },
      {
        id: 'so_direct',
        text: '直接上生产',
        description: '获得1张卡，50%概率获得1张诅咒',
        effects: [{ type: 'special', value: 4 }]
      },
      {
        id: 'so_read',
        text: '认真理解代码',
        description: '升级1张卡牌',
        effects: [{ type: 'upgradeCard', value: 1 }]
      }
    ]
  },
  {
    id: 'it_works_why',
    title: '「它能跑就别动」',
    category: 'random',
    description: '你发现了一段你不理解但似乎能工作的代码。',
    choices: [
      {
        id: 'it_works_leave',
        text: '别碰它',
        description: '无事发生',
        effects: []
      },
      {
        id: 'it_works_refactor',
        text: '重构它',
        description: '50%升级2张卡，50%获得2张诅咒',
        effects: [{ type: 'special', value: 5 }]
      }
    ]
  },
  {
    id: 'commented_code',
    title: '「注释掉的代码」',
    category: 'random',
    description: '你发现了大量被注释掉的旧代码。',
    choices: [
      {
        id: 'comment_delete',
        text: '删除它们',
        description: '移除2张卡',
        effects: [{ type: 'removeCard', value: 2 }]
      },
      {
        id: 'comment_restore',
        text: '恢复它们',
        description: '获得2张卡（可能包含诅咒）',
        effects: [{ type: 'card', value: 2 }]
      },
      {
        id: 'comment_leave',
        text: '保持原样',
        description: '无事发生，但下1场战斗敌人强化（代码臃肿）',
        effects: [{ type: 'enemyBuff', value: 1 }]
      }
    ]
  },

  // ===== 高风险高回报事件 =====
  {
    id: 'all_nighter',
    title: '「通宵加班」',
    category: 'risk',
    description: '项目deadline临近，要不要通宵赶工？',
    choices: [
      {
        id: 'all_night_yes',
        text: '通宵肝代码',
        description: '失去30精力，获得2张稀有卡，伤害+1',
        effects: [
          { type: 'health', value: -30 },
          { type: 'card', value: 2 },
          { type: 'damageBonus', value: 1 }
        ]
      },
      {
        id: 'all_night_no',
        text: '身体要紧，明天再说',
        description: '恢复10精力，跳过下一场战斗奖励',
        effects: [
          { type: 'health', value: 10 },
          { type: 'skipReward', value: 1 }
        ]
      }
    ]
  },
  {
    id: 'deploy_friday',
    title: '「周五部署」',
    category: 'risk',
    description: '今天是周五下午5点，有人提议部署新版本...',
    choices: [
      {
        id: 'friday_yolo',
        text: '周五部署！',
        description: '70%获得100金钱，30%失去20精力+敌人强化2场',
        effects: [{ type: 'special', value: 6 }]
      },
      {
        id: 'friday_no',
        text: '等周一再说',
        description: '无事发生',
        effects: []
      }
    ]
  },
  {
    id: 'demo_gods',
    title: '「演示之神」',
    category: 'random',
    description: '要给客户演示产品了，求演示之神保佑！',
    choices: [
      {
        id: 'demo_pray',
        text: '祈祷',
        description: '60%获得80金钱，40%跳过下次奖励',
        effects: [{ type: 'special', value: 7 }]
      },
      {
        id: 'demo_backup',
        text: '准备录像备份',
        description: '获得30金钱（稳妥的收入）',
        effects: [{ type: 'money', value: 30 }]
      }
    ]
  }
];

// ==================== 事件处理器 ====================

export interface EventResult {
  success: boolean;
  message: string;
  effects: EventEffect[];
}

/**
 * 处理特殊事件效果
 */
export function handleSpecialEffect(
  effectValue: number,
  state: GameState
): { effects: EventEffect[]; message: string } {
  switch (effectValue) {
    case 1: { // 幸运彩蛋
      const roll = Math.random();
      if (roll < 0.33) {
        return {
          effects: [{ type: 'money', value: 30 }],
          message: '彩蛋里有一份小奖金！获得30金钱'
        };
      } else if (roll < 0.66) {
        const rareCards = getRandomCards(1, 'rare');
        state.deck.push(...rareCards);
        return {
          effects: [],
          message: '发现了一张稀有卡牌！'
        };
      } else {
        return {
          effects: [{ type: 'health', value: 15 }],
          message: '彩蛋是一瓶能量饮料！恢复15精力'
        };
      }
    }
    case 2: { // 神秘包裹
      if (Math.random() < 0.5) {
        const rareCards = getRandomCards(1, 'rare');
        state.deck.push(...rareCards);
        return {
          effects: [{ type: 'money', value: 20 }],
          message: '包裹里是一些有用的工具和现金！获得1张稀有卡和20金钱'
        };
      } else {
        if (curseCards[0]) {
          state.deck.push({ ...curseCards[0] });
        }
        return {
          effects: [{ type: 'health', value: -10 }],
          message: '包裹爆炸了！失去10精力，获得1张诅咒'
        };
      }
    }
    case 3: { // 小黄鸭调试
      // 这里简化处理，实际应该抽卡然后让玩家选择弃牌
      return {
        effects: [{ type: 'health', value: 5 }],
        message: '你理清思路，精神焕发！恢复5精力'
      };
    }
    case 4: { // StackOverflow复制粘贴
      const cards = getRandomCards(1);
      state.deck.push(...cards);
      if (Math.random() < 0.5 && curseCards[0]) {
        state.deck.push({ ...curseCards[0] });
        return {
          effects: [],
          message: '获得1张卡，但有Bug！也获得1张诅咒'
        };
      }
      return {
        effects: [],
        message: '代码居然能用！获得1张卡'
      };
    }
    case 5: { // 重构
      if (Math.random() < 0.5) {
        return {
          effects: [{ type: 'upgradeCard', value: 2 }],
          message: '重构非常成功！升级2张卡牌'
        };
      } else {
        return {
          effects: [{ type: 'curse', value: 2 }],
          message: '重构引入了更多Bug！获得2张诅咒'
        };
      }
    }
    case 6: { // 周五部署
      if (Math.random() < 0.7) {
        return {
          effects: [{ type: 'money', value: 100 }],
          message: '部署顺利！获得100金钱'
        };
      } else {
        return {
          effects: [
            { type: 'health', value: -20 },
            { type: 'enemyBuff', value: 2 }
          ],
          message: '出大事了！失去20精力，敌人强化2场'
        };
      }
    }
    case 7: { // 演示之神
      if (Math.random() < 0.6) {
        return {
          effects: [{ type: 'money', value: 80 }],
          message: '演示完美！客户很满意，获得80金钱'
        };
      } else {
        return {
          effects: [{ type: 'skipReward', value: 1 }],
          message: '演示时出了Bug...跳过下次奖励'
        };
      }
    }
    default:
      return {
        effects: [],
        message: '无事发生'
      };
  }
}

/**
 * 应用事件效果到游戏状态
 * 返回一个描述变化的对象，供UI显示
 */
export function applyEventEffects(
  effects: EventEffect[],
  state: GameState,
  floor: number
): { success: boolean; messages: string[] } {
  const messages: string[] = [];
  
  for (const effect of effects) {
    switch (effect.type) {
      case 'money':
        state.money = Math.max(0, state.money + effect.value);
        if (effect.value > 0) messages.push(`获得 ${effect.value} 金钱`);
        else if (effect.value < 0) messages.push(`失去 ${Math.abs(effect.value)} 金钱`);
        break;
        
      case 'health':
        if (state.characters[0]) {
          const prevHealth = state.characters[0].currentEnergy;
          state.characters[0].currentEnergy = Math.max(
            0,
            Math.min(
              state.characters[0].maxEnergy,
              state.characters[0].currentEnergy + effect.value
            )
          );
          const actualChange = state.characters[0].currentEnergy - prevHealth;
          if (actualChange > 0) messages.push(`恢复 ${actualChange} 精力`);
          else if (actualChange < 0) messages.push(`失去 ${Math.abs(actualChange)} 精力`);
        }
        break;
        
      case 'maxHealth':
        if (state.characters[0]) {
          state.characters[0].maxEnergy += effect.value;
          state.characters[0].currentEnergy += effect.value;
          messages.push(`最大精力 +${effect.value}`);
        }
        break;
        
      case 'card':
        const newCards = getRandomCards(effect.value);
        state.deck.push(...newCards);
        messages.push(`获得 ${effect.value} 张卡牌`);
        break;
        
      case 'removeCard':
        for (let i = 0; i < effect.value; i++) {
          const removed = removeRandomCard(state);
          if (removed) {
            messages.push(`移除卡牌：${removed.name}`);
          }
        }
        break;
        
      case 'upgradeCard': {
        // 升级牌组中的随机卡牌
        let upgraded = 0;
        for (let i = 0; i < effect.value && state.deck.length > 0; i++) {
          const idx = Math.floor(Math.random() * state.deck.length);
          const card = state.deck[idx];
          if (card.effect.type === 'damage') {
            card.effect.value += 2;
            upgraded++;
          }
        }
        if (upgraded > 0) messages.push(`升级了 ${upgraded} 张攻击卡牌`);
        break;
      }
        
      case 'curse':
        for (let i = 0; i < effect.value; i++) {
          if (curseCards[0]) {
            state.deck.push({ ...curseCards[0], id: `curse_${Date.now()}_${i}` });
          }
        }
        messages.push(`获得 ${effect.value} 张诅咒卡`);
        break;
        
      case 'damageBonus':
        state.permanentDamageBonus = (state.permanentDamageBonus || 0) + effect.value;
        messages.push(`永久伤害 +${effect.value}`);
        break;
        
      case 'drawBonus':
        state.permanentDrawBonus = (state.permanentDrawBonus || 0) + effect.value;
        messages.push(`永久抽牌 +${effect.value}`);
        break;
        
      case 'enemyBuff':
        if (effect.value >= 99) {
          state.enemyHpBuffFights = 999;  // 永久强化
          messages.push('敌人永久强化！');
        } else {
          state.enemyHpBuffFights = (state.enemyHpBuffFights || 0) + effect.value;
          messages.push(`接下来 ${effect.value} 场战斗敌人强化`);
        }
        break;
        
      case 'skipReward':
        state.skipNextReward = true;
        messages.push('跳过下一场战斗奖励');
        break;
        
      case 'hardware': {
        const hardware = getRandomHardware(floor);
        // 这里简化处理，实际应该通过专门的硬件添加函数
        messages.push(`获得硬件：${(hardware as any).name || '未知硬件'}`);
        break;
      }
        
      case 'special':
        // 特殊效果在调用方处理
        break;
    }
  }
  
  return { success: true, messages };
}

// ==================== 获取事件 ====================

export function getRandomEvent(): GameEvent {
  return events[Math.floor(Math.random() * events.length)];
}

export function getRandomEventByCategory(category: GameEvent['category']): GameEvent {
  const categoryEvents = events.filter(e => e.category === category);
  if (categoryEvents.length === 0) return getRandomEvent();
  return categoryEvents[Math.floor(Math.random() * categoryEvents.length)];
}

/**
 * 根据游戏进度获取合适的事件
 * 早期倾向于增益事件，后期增加风险事件
 */
export function getEventForProgress(floor: number, maxFloors: number): GameEvent {
  const progress = floor / maxFloors;
  const rand = Math.random();
  
  // 根据进度调整事件类型概率
  if (progress < 0.3) {
    // 前期：更多增益
    if (rand < 0.5) return getRandomEventByCategory('benefit');
    if (rand < 0.8) return getRandomEventByCategory('shop');
    return getRandomEvent();
  } else if (progress < 0.7) {
    // 中期：平衡
    if (rand < 0.3) return getRandomEventByCategory('benefit');
    if (rand < 0.5) return getRandomEventByCategory('choice');
    if (rand < 0.7) return getRandomEventByCategory('shop');
    return getRandomEvent();
  } else {
    // 后期：更多风险
    if (rand < 0.2) return getRandomEventByCategory('benefit');
    if (rand < 0.4) return getRandomEventByCategory('risk');
    if (rand < 0.6) return getRandomEventByCategory('choice');
    return getRandomEvent();
  }
}
