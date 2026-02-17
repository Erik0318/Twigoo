/**
 * 敌人数据定义 - V2重新平衡版
 * 参考新的卡牌数值模型（基础攻击10-12点）
 * 
 * 数值设计：
 * - 普通战斗（1-2个敌人）：单个敌人30-50 HP
 * - 精英战斗（1个强敌）：60-100 HP
 * - Boss战：150-300 HP
 * 
 * 攻击设计：
 * - 普通敌人：6-10点伤害
 * - 精英：10-15点伤害
 * - Boss：12-20点伤害，多段攻击
 */

import type { Enemy, EnemyIntent } from '@/types/game';

// ==================== Floor 1: 调试控制台 (难度1) ====================
export const floor1Enemies: Enemy[] = [
  {
    id: 'syntaxError',
    name: '语法错误',
    maxHealth: 30,
    currentHealth: 30,
    attack: 6,
    special: 'none',
    specialDescription: '无特殊能力',
    image: '/enemies/syntaxError.png'
  },
  {
    id: 'warning',
    name: '编译警告',
    maxHealth: 25,
    currentHealth: 25,
    attack: 5,
    special: 'weak',
    specialDescription: '攻击时施加1层虚弱（玩家下回合伤害-25%）',
    image: '/enemies/warning.png'
  },
  {
    id: 'consoleLog',
    name: '调试日志',
    maxHealth: 35,
    currentHealth: 35,
    attack: 4,
    special: 'shield',
    specialDescription: '每2回合获得8点护盾',
    image: '/enemies/consoleLog.png'
  },
  {
    id: 'comment',
    name: '遗留注释',
    maxHealth: 28,
    currentHealth: 28,
    attack: 7,
    special: 'heal',
    specialDescription: '每3回合恢复10点生命',
    image: '/enemies/comment.png'
  }
];

// ==================== Floor 2: 类型系统 (难度2) ====================
export const floor2Enemies: Enemy[] = [
  {
    id: 'typeMismatch',
    name: '类型不匹配',
    maxHealth: 40,
    currentHealth: 40,
    attack: 8,
    special: 'vulnerable',
    specialDescription: '攻击施加2层易伤（受到伤害+50%）',
    image: '/enemies/typeMismatch.png'
  },
  {
    id: 'nullPointer',
    name: '空指针异常',
    maxHealth: 35,
    currentHealth: 35,
    attack: 10,
    special: 'pointerImmune',
    specialDescription: '免疫下1次攻击，每3回合重置',
    image: '/enemies/nullPointer.png'
  },
  {
    id: 'indexOutOfBounds',
    name: '数组越界',
    maxHealth: 38,
    currentHealth: 38,
    attack: 6,
    special: 'multiStrike',
    specialDescription: '每3回合进行3段攻击（每次6点）',
    image: '/enemies/indexOutOfBounds.png'
  },
  {
    id: 'castException',
    name: '类型转换异常',
    maxHealth: 42,
    currentHealth: 42,
    attack: 7,
    special: 'transform',
    specialDescription: '生命值<50%时攻击+3',
    image: '/enemies/castException.png'
  }
];

// ==================== Floor 3: 内存管理 (难度3) ====================
export const floor3Enemies: Enemy[] = [
  {
    id: 'memoryLeak',
    name: '内存泄漏',
    maxHealth: 50,
    currentHealth: 50,
    attack: 8,
    special: 'growth',
    specialDescription: '每回合最大生命+3，攻击+1',
    image: '/enemies/memoryLeak.png'
  },
  {
    id: 'stackOverflow',
    name: '栈溢出',
    maxHealth: 45,
    currentHealth: 45,
    attack: 6,
    special: 'rampage',
    specialDescription: '攻击每回合+1，无上限',
    image: '/enemies/stackOverflow.png'
  },
  {
    id: 'segmentationFault',
    name: '段错误',
    maxHealth: 48,
    currentHealth: 48,
    attack: 12,
    special: 'recoil',
    specialDescription: '攻击时自身失去3点生命',
    image: '/enemies/segmentationFault.png'
  },
  {
    id: 'garbageCollector',
    name: '垃圾回收器',
    maxHealth: 55,
    currentHealth: 55,
    attack: 5,
    special: 'cleanse',
    specialDescription: '每2回合清除所有负面效果并恢复15点生命',
    image: '/enemies/garbageCollector.png'
  }
];

// ==================== Floor 4: 并发问题 (难度4) ====================
export const floor4Enemies: Enemy[] = [
  {
    id: 'deadlock',
    name: '死锁',
    maxHealth: 60,
    currentHealth: 60,
    attack: 8,
    special: 'stun',
    specialDescription: '每3回合晕眩玩家1回合（无法出牌）',
    image: '/enemies/deadlock.png'
  },
  {
    id: 'raceCondition',
    name: '竞态条件',
    maxHealth: 50,
    currentHealth: 50,
    attack: 9,
    special: 'quick',
    specialDescription: '首回合行动两次',
    image: '/enemies/raceCondition.png'
  },
  {
    id: 'liveLock',
    name: '活锁',
    maxHealth: 52,
    currentHealth: 52,
    attack: 7,
    special: 'dodge',
    specialDescription: '50%几率闪避攻击',
    image: '/enemies/liveLock.png'
  },
  {
    id: 'threadStarvation',
    name: '线程饥饿',
    maxHealth: 45,
    currentHealth: 45,
    attack: 10,
    special: 'drain',
    specialDescription: '攻击时玩家失去1点最大能量',
    image: '/enemies/threadStarvation.png'
  }
];

// ==================== Floor 5: 依赖地狱 (难度5) ====================
export const floor5Enemies: Enemy[] = [
  {
    id: 'circularDependency',
    name: '循环依赖',
    maxHealth: 70,
    currentHealth: 70,
    attack: 9,
    special: 'reflect',
    specialDescription: '受到攻击时反伤25%',
    image: '/enemies/circularDependency.png'
  },
  {
    id: 'versionConflict',
    name: '版本冲突',
    maxHealth: 65,
    currentHealth: 65,
    attack: 8,
    special: 'split',
    specialDescription: '生命值<50%时分裂为2个（各30HP）',
    image: '/enemies/versionConflict.png'
  },
  {
    id: 'deprecatedAPI',
    name: '废弃API',
    maxHealth: 55,
    currentHealth: 55,
    attack: 11,
    special: 'decay',
    specialDescription: '每回合对玩家施加"过时"（手牌费用+1）',
    image: '/enemies/deprecatedAPI.png'
  },
  {
    id: 'npmInstall',
    name: '无尽依赖',
    maxHealth: 40,
    currentHealth: 40,
    attack: 5,
    special: 'summon',
    specialDescription: '每2回合召唤1个子依赖（15HP，4攻击）',
    image: '/enemies/npmInstall.png'
  }
];

// ==================== 精英敌人 ====================
export const eliteEnemies: Enemy[] = [
  {
    id: 'elite_memoryLeak',
    name: '巨型内存泄漏',
    maxHealth: 80,
    currentHealth: 80,
    attack: 10,
    special: 'eliteGrowth',
    specialDescription: '每回合攻击+2，生命上限+5',
    image: '/enemies/elite/memoryLeak.png'
  },
  {
    id: 'elite_deadlock',
    name: '系统死锁',
    maxHealth: 90,
    currentHealth: 90,
    attack: 12,
    special: 'eliteStun',
    specialDescription: '每2回合晕眩1回合，攻击施加虚弱',
    image: '/enemies/elite/deadlock.png'
  },
  {
    id: 'elite_circularDependency',
    name: '恶性循环依赖',
    maxHealth: 85,
    currentHealth: 85,
    attack: 11,
    special: 'eliteReflect',
    specialDescription: '反伤50%，每回合获得10护盾',
    image: '/enemies/elite/circularDependency.png'
  },
  {
    id: 'elite_raceCondition',
    name: '临界竞态',
    maxHealth: 75,
    currentHealth: 75,
    attack: 15,
    special: 'eliteQuick',
    specialDescription: '每回合行动两次，首回合三次',
    image: '/enemies/elite/raceCondition.png'
  },
  {
    id: 'elite_segmentationFault',
    name: '内核崩溃',
    maxHealth: 95,
    currentHealth: 95,
    attack: 18,
    special: 'eliteCrash',
    specialDescription: '生命值<30%时攻击翻倍',
    image: '/enemies/elite/segmentationFault.png'
  },
  {
    id: 'elite_garbageCollector',
    name: '强制GC',
    maxHealth: 100,
    currentHealth: 100,
    attack: 8,
    special: 'eliteCleanse',
    specialDescription: '每回合清除负面效果，恢复20生命',
    image: '/enemies/elite/garbageCollector.png'
  }
];

// ==================== Boss敌人 ====================
export const bossEnemies: Enemy[] = [
  {
    id: 'boss_compiler',
    name: '编译器本体',
    maxHealth: 150,
    currentHealth: 150,
    attack: 12,
    special: 'bossCompile',
    specialDescription: '阶段1：每3回合获得20护盾；阶段2（<50%HP）：攻击+5',
    image: '/enemies/boss/compiler.png'
  },
  {
    id: 'boss_repository',
    name: '代码仓库',
    maxHealth: 180,
    currentHealth: 180,
    attack: 10,
    special: 'bossSummon',
    specialDescription: '每2回合召唤Commit（25HP，6攻击），最多3个',
    image: '/enemies/boss/repository.png'
  },
  {
    id: 'boss_ci_cd',
    name: 'CI/CD流水线',
    maxHealth: 200,
    currentHealth: 200,
    attack: 15,
    special: 'bossPipeline',
    specialDescription: '每回合进行2次行动，生命值<50%时3次',
    image: '/enemies/boss/ci_cd.png'
  },
  {
    id: 'boss_legacyMonolith',
    name: '遗留单体架构',
    maxHealth: 250,
    currentHealth: 250,
    attack: 8,
    special: 'bossMonolith',
    specialDescription: '免疫前3回合伤害；每回合自愈15点',
    image: '/enemies/boss/legacyMonolith.png'
  },
  {
    id: 'boss_distributedSystem',
    name: '分布式系统',
    maxHealth: 120,
    currentHealth: 120,
    attack: 14,
    special: 'bossDistributed',
    specialDescription: '同时与3个节点战斗，必须全部击败',
    image: '/enemies/boss/distributedSystem.png'
  },
  {
    id: 'boss_springShadow',
    name: '春日影',
    maxHealth: 300,
    currentHealth: 300,
    attack: 16,
    special: 'bossTransform',
    specialDescription: '3个阶段：70%和40%时变身，攻击模式改变',
    image: '/enemies/boss/springShadow.png'
  }
];

// ==================== 导出 ====================

export const allEnemies: Enemy[] = [
  ...floor1Enemies,
  ...floor2Enemies,
  ...floor3Enemies,
  ...floor4Enemies,
  ...floor5Enemies
];

export const allElites: Enemy[] = eliteEnemies;
export const allBosses: Enemy[] = bossEnemies;

/**
 * 生成敌人意图
 */
export function generateIntent(enemy: Enemy): EnemyIntent {
  const rand = Math.random();
  
  // 70%攻击, 20%防御, 10%特殊
  if (rand < 0.7) {
    return { type: 'attack', value: enemy.attack };
  } else if (rand < 0.9) {
    return { type: 'defense', value: Math.floor(enemy.attack * 1.2) };
  } else {
    return { type: 'special', value: 0 };
  }
}

/**
 * 获取敌人副本
 */
export function getEnemyCopy(enemyId: string): Enemy {
  const enemy = [...allEnemies, ...allElites, ...allBosses].find(e => e.id === enemyId);
  if (!enemy) {
    console.warn(`Enemy not found: ${enemyId}, using fallback`);
    return { ...floor1Enemies[0], currentHealth: floor1Enemies[0].maxHealth };
  }
  
  return {
    ...enemy,
    currentHealth: enemy.maxHealth,
    intent: generateIntent(enemy)
  };
}

/**
 * 根据层数获取敌人
 */
export function getEnemiesForFloor(floorNumber: number, isElite: boolean = false): Enemy[] {
  if (isElite) {
    // 精英敌人 - 根据层数选择
    const availableElites = allElites.slice(0, Math.min(floorNumber + 1, allElites.length));
    const elite = availableElites[Math.floor(Math.random() * availableElites.length)];
    return [getEnemyCopy(elite.id)];
  }
  
  // 根据层数选择敌人池
  let enemyPool: Enemy[] = [];
  switch (floorNumber) {
    case 0:
    case 1:
      enemyPool = floor1Enemies;
      break;
    case 2:
      enemyPool = [...floor1Enemies, ...floor2Enemies];
      break;
    case 3:
      enemyPool = floor2Enemies;
      break;
    case 4:
      enemyPool = [...floor2Enemies, ...floor3Enemies];
      break;
    case 5:
      enemyPool = floor3Enemies;
      break;
    case 6:
      enemyPool = [...floor3Enemies, ...floor4Enemies];
      break;
    case 7:
      enemyPool = floor4Enemies;
      break;
    case 8:
      enemyPool = [...floor4Enemies, ...floor5Enemies];
      break;
    case 9:
      enemyPool = floor5Enemies;
      break;
    default:
      enemyPool = floor5Enemies;
  }
  
  // 决定敌人数目（简单层1个，困难层2个）
  const enemyCount = floorNumber <= 2 || Math.random() < 0.4 ? 1 : 2;
  const selected: Enemy[] = [];
  
  for (let i = 0; i < enemyCount; i++) {
    const randomEnemy = enemyPool[Math.floor(Math.random() * enemyPool.length)];
    selected.push(getEnemyCopy(randomEnemy.id));
  }
  
  return selected;
}

/**
 * 获取Boss
 */
export function getBossForFloor(floorNumber: number): Enemy[] {
  const bossIndex = Math.min(Math.floor((floorNumber - 1) / 2), allBosses.length - 1);
  const boss = allBosses[bossIndex];
  if (boss) {
    return [getEnemyCopy(boss.id)];
  }
  return [getEnemyCopy('boss_compiler')];
}

/**
 * 获取战斗奖励
 */
export function getCombatReward(isElite: boolean = false, isBoss: boolean = false): number {
  if (isBoss) return 100 + Math.floor(Math.random() * 51);  // 100-150
  if (isElite) return 40 + Math.floor(Math.random() * 21);  // 40-60
  return 15 + Math.floor(Math.random() * 16);  // 15-30
}

/**
 * 获取地图层数配置
 */
export const floorConfig = {
  totalFloors: 10,
  bossesAt: [3, 6, 9, 10],  // Boss层
  elitesPerAct: 2,  // 每个区域精英数量
  
  // 各层名称
  floorNames: [
    '调试控制台',      // 1
    'IDE环境',        // 2
    '类型系统',       // 3
    '编译阶段',       // 4 (Boss)
    '内存管理',       // 5
    '并发处理',       // 6
    '网络请求',       // 7 (Boss)
    '依赖解析',       // 8
    '生产环境',       // 9
    '终极部署',       // 10 (Boss)
  ]
};
