/**
 * 特殊房间数据 - 融合程序梗和MyGO元素
 */

// ==================== 挑战房间题目 ====================
export interface Challenge {
  id: string;
  title: string;
  description: string;
  question: string;
  options: { text: string; correct: boolean; reward: string }[];
}

export const challenges: Challenge[] = [
  {
    id: 'algorithm_quiz',
    title: '算法挑战',
    description: '解决一个算法问题！',
    question: '快速排序的平均时间复杂度是？',
    options: [
      { text: 'O(n)', correct: false, reward: '获得10金钱' },
      { text: 'O(n log n)', correct: true, reward: '获得1张稀有攻击牌' },
      { text: 'O(n²)', correct: false, reward: '获得5金钱' },
      { text: 'O(1)', correct: false, reward: '获得3金钱' }
    ]
  },
  {
    id: 'git_quiz',
    title: 'Git面试',
    description: '回答Git相关问题！',
    question: '如何撤销最近一次的commit？',
    options: [
      { text: 'git undo', correct: false, reward: '获得5金钱' },
      { text: 'git reset HEAD~1', correct: true, reward: '获得2张随机卡牌' },
      { text: 'git delete', correct: false, reward: '获得3金钱' },
      { text: 'git revert', correct: false, reward: '获得8金钱' }
    ]
  },
  {
    id: 'debug_challenge',
    title: 'Debug挑战',
    description: '找出bug所在！',
    question: '这段代码输出什么？\nfor(var i=0;i<3;i++){\n  setTimeout(()=>console.log(i),100)\n}',
    options: [
      { text: '0 1 2', correct: false, reward: '获得8金钱' },
      { text: '3 3 3', correct: true, reward: '获得1张稀有技能牌' },
      { text: '1 2 3', correct: false, reward: '获得5金钱' },
      { text: 'undefined', correct: false, reward: '获得3金钱' }
    ]
  },
  {
    id: 'band_quiz',
    title: 'MyGO问答',
    description: '关于乐队的问题！',
    question: '「吉他」在MyGO乐队中担任什么位置？',
    options: [
      { text: '主唱', correct: false, reward: '获得5金钱' },
      { text: '吉他手', correct: true, reward: '获得1张专属卡牌' },
      { text: '贝斯', correct: false, reward: '获得5金钱' },
      { text: '鼓手', correct: false, reward: '获得5金钱' }
    ]
  },
  {
    id: 'code_review',
    title: 'Code Review',
    description: '审查这段代码！',
    question: '这段代码有什么问题？\nfunction sum(a,b){ return a+b; }',
    options: [
      { text: '没有类型标注', correct: false, reward: '获得8金钱' },
      { text: '没有问题', correct: true, reward: '获得15金钱和1张防御牌' },
      { text: '变量未声明', correct: false, reward: '获得3金钱' },
      { text: '语法错误', correct: false, reward: '获得5金钱' }
    ]
  },
  {
    id: 'performance_test',
    title: '性能测试',
    description: '优化这段代码！',
    question: '哪个操作更低效？',
    options: [
      { text: '数组push', correct: false, reward: '获得8金钱' },
      { text: '字符串拼接', correct: true, reward: '获得1张稀有攻击牌' },
      { text: '对象查询', correct: false, reward: '获得5金钱' },
      { text: 'Map查找', correct: false, reward: '获得5金钱' }
    ]
  }
];

// ==================== 宝藏房间奖励 ====================
export interface TreasureReward {
  id: string;
  name: string;
  description: string;
  type: 'money' | 'card' | 'heal' | 'artifact';
  value: number;
  rarity?: 'common' | 'rare' | 'epic';
}

export const treasureRewards: TreasureReward[] = [
  // 金钱奖励
  { id: 'small_money', name: '小费', description: '获得20金钱', type: 'money', value: 20 },
  { id: 'medium_money', name: '开源赞助', description: '获得50金钱', type: 'money', value: 50 },
  { id: 'big_money', name: '投资人', description: '获得100金钱', type: 'money', value: 100 },
  
  // 回复奖励
  { id: 'small_heal', name: '能量饮料', description: '恢复15精力', type: 'heal', value: 15 },
  { id: 'big_heal', name: '特效药', description: '恢复30精力', type: 'heal', value: 30 },
  
  // 神器
  { id: 'artifact', name: '神器', description: '获得1层神器（永久力量+1）', type: 'artifact', value: 1 },
  
  // 卡牌奖励（在游戏逻辑中动态生成）
];

// ==================== 卡牌交换选项 ====================
export interface CardExchangeOption {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'discard_draw' | 'upgrade' | 'remove' | 'add_specific';
  value: number;
}

export const cardExchangeOptions: CardExchangeOption[] = [
  { 
    id: 'discard_2_draw_2', 
    name: '牌组重组', 
    description: '弃2张牌，抽2张新牌', 
    cost: 15, 
    type: 'discard_draw', 
    value: 2 
  },
  { 
    id: 'discard_3_draw_3', 
    name: '大规模重构', 
    description: '弃3张牌，抽3张新牌', 
    cost: 25, 
    type: 'discard_draw', 
    value: 3 
  },
  { 
    id: 'upgrade_random', 
    name: '卡牌升级', 
    description: '随机升级1张卡牌（+3效果）', 
    cost: 40, 
    type: 'upgrade', 
    value: 1 
  },
  { 
    id: 'remove_card', 
    name: '删除卡牌', 
    description: '从牌组中删除1张卡', 
    cost: 35, 
    type: 'remove', 
    value: 1 
  },
];

// ==================== 随机事件触发器 ====================
export function getRandomChallenge(): Challenge {
  return challenges[Math.floor(Math.random() * challenges.length)];
}

export function getRandomTreasure(): TreasureReward {
  const rand = Math.random();
  // 40%金钱，30%回复，20%卡牌，10%神器
  if (rand < 0.4) {
    const moneyRewards = treasureRewards.filter(t => t.type === 'money');
    return moneyRewards[Math.floor(Math.random() * moneyRewards.length)];
  } else if (rand < 0.7) {
    const healRewards = treasureRewards.filter(t => t.type === 'heal');
    return healRewards[Math.floor(Math.random() * healRewards.length)];
  } else if (rand < 0.9) {
    // 卡牌奖励
    return { 
      id: 'random_card', 
      name: '随机卡牌', 
      description: '获得1张随机卡牌', 
      type: 'card', 
      value: 1,
      rarity: Math.random() < 0.3 ? 'rare' : 'common'
    };
  } else {
    return treasureRewards.find(t => t.type === 'artifact')!;
  }
}

export function getRandomExchangeOptions(): CardExchangeOption[] {
  // 随机返回2-3个选项
  const count = Math.floor(Math.random() * 2) + 2;
  const shuffled = [...cardExchangeOptions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
