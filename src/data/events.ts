import type { GameState } from '@/types/game';
import { curseCards, getCharacterCards } from './cards';

export interface EventChoice {
  text: string;
  effect: (state: GameState) => void;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  choices: EventChoice[];
}

// 12个事件
export const events: GameEvent[] = [
  {
    id: 'lostIsOk',
    title: '「迷子でもいい」',
    description: '即使迷路也没关系，重要的是继续前进。',
    choices: [
      {
        text: '获得50金钱，获得1张诅咒卡',
        effect: (state) => {
          state.money += 50;
          state.deck.push({ ...curseCards[0] });
        }
      },
      {
        text: '离开',
        effect: () => {}
      }
    ]
  },
  {
    id: 'lifeBand',
    title: '「一生バンドやろう」',
    description: '让我们组一辈子的乐队吧！',
    choices: [
      {
        text: '失去5精力，所有角色伤害永久+1',
        effect: (state) => {
          state.characters[0].currentEnergy -= 5;
          state.permanentDamageBonus = (state.permanentDamageBonus || 0) + 1;
        }
      },
      {
        text: '离开',
        effect: () => {}
      }
    ]
  },
  {
    id: 'poemIdea',
    title: '「詩を思いついた」',
    description: '灵感突然涌现，你想写下这首诗。',
    choices: [
      {
        text: '获得1张灯的专属卡（随机）',
        effect: (state) => {
          const tomoriCards = getCharacterCards('tomori');
          const randomCard = tomoriCards[Math.floor(Math.random() * tomoriCards.length)];
          state.deck.push({ ...randomCard });
        }
      },
      {
        text: '离开',
        effect: () => {}
      }
    ]
  },
  {
    id: 'beHappy',
    title: '「お幸せに」',
    description: '祝你幸福...',
    choices: [
      {
        text: '失去10金钱，移除卡组中1张卡',
        effect: (state) => {
          state.money = Math.max(0, state.money - 10);
          if (state.deck.length > 0) {
            state.deck.splice(Math.floor(Math.random() * state.deck.length), 1);
          }
        }
      },
      {
        text: '离开',
        effect: () => {}
      }
    ]
  },
  {
    id: 'whySpring',
    title: '「なんで春」',
    description: '为什么要演奏春日影！',
    choices: [
      {
        text: '恢复10精力，跳过下一场战斗奖励',
        effect: (state) => {
          state.characters[0].currentEnergy = Math.min(
            state.characters[0].maxEnergy,
            state.characters[0].currentEnergy + 10
          );
          state.skipNextReward = true;
        }
      },
      {
        text: '离开',
        effect: () => {}
      }
    ]
  },
  {
    id: 'myVoice',
    title: '「わたしの声」',
    description: '我的声音，能传达到吗？',
    choices: [
      {
        text: '查看牌库，选择1张卡加入手牌',
        effect: (state) => {
          if (state.deck.length > 0) {
            const card = state.deck.pop()!;
            state.hand.push(card);
          }
        }
      },
      {
        text: '离开',
        effect: () => {}
      }
    ]
  },
  {
    id: 'curtainCall',
    title: '「カーテンコール」',
    description: '谢幕时刻，掌声响起。',
    choices: [
      {
        text: '失去当前所有手牌，获得30护盾',
        effect: (state) => {
          state.discard.push(...state.hand);
          state.hand = [];
          state.tempShield += 30;
        }
      },
      {
        text: '离开',
        effect: () => {}
      }
    ]
  },
  {
    id: 'returnAll',
    title: '「返すよ、全部」',
    description: '全部还给你！',
    choices: [
      {
        text: '立即获得30金钱，直接进入Boss战',
        effect: (state) => {
          state.money += 30;
          state.forceBossNow = true;
        }
      },
      {
        text: '离开',
        effect: () => {}
      }
    ]
  },
  {
    id: 'noNeedToPush',
    title: '「無理しなくていいよ」',
    description: '不用勉强自己也可以的。',
    choices: [
      {
        text: '恢复全部精力，失去20金钱',
        effect: (state) => {
          state.characters[0].currentEnergy = state.characters[0].maxEnergy;
          state.money = Math.max(0, state.money - 20);
        }
      },
      {
        text: '离开',
        effect: () => {}
      }
    ]
  },
  {
    id: 'doWell',
    title: '「上手くやれよ」',
    description: '要好好干啊。',
    choices: [
      {
        text: '升级1张手牌（伤害+1）',
        effect: (state) => {
          if (state.hand.length > 0) {
            const card = state.hand[0];
            if (card.effect.type === 'damage') {
              card.effect.value += 1;
            }
          }
        }
      },
      {
        text: '离开',
        effect: () => {}
      }
    ]
  },
  {
    id: 'grew',
    title: '「のびたわ」',
    description: '我成长了呢。',
    choices: [
      {
        text: '获得2点最大精力（永久）',
        effect: (state) => {
          state.characters[0].maxEnergy += 2;
          state.characters[0].currentEnergy += 2;
        }
      },
      {
        text: '离开',
        effect: () => {}
      }
    ]
  },
  {
    id: 'followingYou',
    title: '「ついてるよ」',
    description: '我会跟着你的。',
    choices: [
      {
        text: '获得100金钱，但下3场战斗敌人生命+50%',
        effect: (state) => {
          state.money += 100;
          state.enemyHpBuffFights = 3;
        }
      },
      {
        text: '离开',
        effect: () => {}
      }
    ]
  },
  // 程序梗事件
  {
    id: 'segfault',
    title: 'Segmentation Fault',
    description: '你的程序崩溃了！',
    choices: [
      {
        text: '丢弃手牌，失去10能量',
        effect: (state) => {
          state.discard.push(...state.hand);
          state.hand = [];
          state.characters[0].currentEnergy -= 10;
        }
      },
      {
        text: '离开',
        effect: () => {}
      }
    ]
  },
  {
    id: 'gitMerge',
    title: 'Merge Conflict',
    description: 'Git合并冲突！',
    choices: [
      {
        text: '获得50金钱和1张诅咒卡',
        effect: (state) => {
          state.money += 50;
          if (curseCards[0]) state.deck.push({ ...curseCards[0] });
        }
      },
      { text: '离开', effect: () => {} }
    ]
  },
  {
    id: 'stackOverflow',
    title: 'Stack Overflow',
    description: '你遇到热心程序员！',
    choices: [
      {
        text: '随机获得1张卡',
        effect: (state) => {
          if (state.deck.length > 0) {
            const idx = Math.floor(Math.random() * state.deck.length);
            state.hand.push(state.deck.splice(idx, 1)[0]);
          }
        }
      },
      { text: '离开', effect: () => {} }
    ]
  },
  {
    id: 'infiniteLoop',
    title: 'Infinite Loop',
    description: '代码陷入死循环！',
    choices: [
      {
        text: '下3次战斗每回合抽牌+1',
        effect: (state) => { state.nextTurnDrawBonus = (state.nextTurnDrawBonus || 0) + 3; }
      },
      { text: '离开', effect: () => {} }
    ]
  },
  // MyGO梗事件
  {
    id: 'haruhikari',
    title: '「春日影」',
    description: '这就是春日影！',
    choices: [
      {
        text: '获得1张灯的卡，敌人强化2场',
        effect: (state) => {
          state.enemyHpBuffFights = (state.enemyHpBuffFights || 0) + 2;
          const tomoriCards = getCharacterCards('tomori');
          if (tomoriCards.length > 0) {
            state.deck.push({ ...tomoriCards[Math.floor(Math.random() * tomoriCards.length)], id: 'new_' + Date.now() });
          }
        }
      },
      { text: '离开', effect: () => {} }
    ]
  },
  {
    id: 'anonymous',
    title: '「 anonymous 」',
    description: '爱音：想出风头！',
    choices: [
      {
        text: '获得100金钱，伤害+3',
        effect: (state) => {
          state.money += 100;
          state.permanentDamageBonus = (state.permanentDamageBonus || 0) + 3;
        }
      },
      { text: '离开', effect: () => {} }
    ]
  },
  {
    id: 'soyo',
    title: '「呜噫」',
    description: '爽世在哭泣...',
    choices: [
      {
        text: '恢复满能量，获得8护盾',
        effect: (state) => {
          state.characters[0].currentEnergy = state.characters[0].maxEnergy;
          state.tempShield = (state.tempShield || 0) + 8;
        }
      },
      { text: '离开', effect: () => {} }
    ]
  },
  {
    id: 'ran',
    title: '「rana nyaa」',
    description: '乐奈：喵~姐姐~！',
    choices: [
      {
        text: '获得1张专属卡，攻击+10',
        effect: (state) => {
          const ranaCards = getCharacterCards('rana');
          if (ranaCards.length > 0) state.deck.push({ ...ranaCards[0], id: 'new_' + Date.now() });
          state.nextAttackBonus = (state.nextAttackBonus || 0) + 10;
        }
      },
      { text: '离开', effect: () => {} }
    ]
  }
];

// 获取随机事件
export function getRandomEvent(): GameEvent {
  return events[Math.floor(Math.random() * events.length)];
}
