// 游戏核心类型定义

// 硬件类型定义（与 data/hardware.ts 保持一致）
export type CpuSocket = 'LGA1700' | 'AM5';
export type RamType = 'DDR4' | 'DDR5';

export interface CPU {
  id: string;
  name: string;
  brand: 'Intel' | 'AMD';
  socket: CpuSocket;
  basePower: number;
  tdp: number;
  price: number;
  description: string;
}

export interface Motherboard {
  id: string;
  name: string;
  socket: CpuSocket;
  ramType: RamType;
  ramSlots: number;
  maxRam: number;
  pcieSlots: number;
  price: number;
  description: string;
}

export interface RamStick {
  id: string;
  name: string;
  type: RamType;
  capacity: number;
  energy: number;
  price: number;
  description: string;
}

export interface GPU {
  id: string;
  name: string;
  vram: number;
  damage: number;
  tdp: number;
  price: number;
  description: string;
}

export interface PSU {
  id: string;
  name: string;
  wattage: number;
  efficiency: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  price: number;
  description: string;
}

export interface HardwareInventory {
  motherboard: Motherboard | null;
  cpu: CPU | null;
  ramSticks: RamStick[];
  gpu: GPU | null;
  psu: PSU | null;
}

// 角色
export interface Character {
  id: string;
  name: string;
  maxEnergy: number;
  currentEnergy: number;
  trait: string;
  traitDescription: string;
  isActive: boolean;
  isExhausted: boolean;
  portrait: string;
  color: string;
}

// 卡牌类型
export type CardType = 'attack' | 'defense' | 'skill' | 'special' | 'curse';
export type CardRarity = 'common' | 'rare' | 'epic';

export interface Card {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  rarity: CardRarity;
  description: string;
  effect: CardEffect;
  characterId?: string;
  image?: string;
  icon?: string; // Lucide图标名称
}

// 卡牌效果
export interface CardEffect {
  type: 'damage' | 'shield' | 'draw' | 'heal' | 'money' | 'skill' | 'special';
  value: number;
  target?: 'enemy' | 'self' | 'all' | 'random';
  condition?: string;
  extraEffect?: string;
}

// 敌人
export interface Enemy {
  id: string;
  name: string;
  maxHealth: number;
  currentHealth: number;
  attack: number;
  special: string;
  specialDescription: string;
  image?: string;
  intent?: EnemyIntent;
  previousIntent?: EnemyIntent;  // 上回合的行动（公开信息）
  deathTriggered?: boolean; // 标记死亡效果是否已触发
  vulnerable?: number;      // 易伤层数
  weak?: number;           // 虚弱层数
  stunned?: number;        // 晕眩回合数
  poison?: number;         // 中毒层数
  intentRevealed?: boolean; // 意图是否已揭示
  
  // ===== 新增: 敌人状态 =====
  specialDisabled?: number;      // 特殊能力禁用回合数
  noShieldNext?: boolean;        // 下回合无法获得护盾
  attackLimited?: number;        // 攻击次数限制
  damageShare?: boolean;         // 伤害分担标记
  skipped?: boolean;             // 跳过回合标记
  mirrorShield?: number;         // 镜像护盾反弹值
}

// 敌人意图
export interface EnemyIntent {
  type: 'attack' | 'defense' | 'special';
  value: number;
  target?: string;
}

// 房间类型
export type RoomType = 'combat' | 'elite' | 'shop' | 'event' | 'rest' | 'boss' | 'challenge' | 'treasure' | 'cardExchange';

export interface Room {
  id: string;
  type: RoomType;
  name: string;
  description: string;
  enemies?: Enemy[];
  cleared: boolean;
  connections: string[];  // 可进入的房间ID列表
  tier?: number;          // 房间所在的列（用于UI展示分支）
}

// 地图层
export interface Floor {
  id: number;
  name: string;
  rooms: Room[];
  currentRoomId: string;
}

// 游戏状态
export interface GameState {
  hardware: HardwareInventory;
  characters: Character[];
  activeCharacterIndex: number;
  deck: Card[];
  hand: Card[];
  discard: Card[];
  money: number;
  currentCost: number;
  maxCost: number;
  currentEnemies: Enemy[];
  currentFloor: number;
  currentRoom: Room | null;
  turn: number;
  isPlayerTurn: boolean;
  tempShield: number;
  nextTurnDrawBonus: number;
  nextTurnCostPenalty: number;
  gamePhase: 'menu' | 'character_select' | 'map' | 'combat' | 'shop' | 'event' | 'rest' | 'game_over' | 'victory' | 'tutorial' | 'challenge' | 'cardExchange' | 'reward' | 'talent_tree';
  floors: Floor[];
  // 新增状态
  cardsPlayedThisTurn: number;
  shopVisitedThisFloor: boolean;
  hasUsedRecursion: boolean;
  tutorialCompleted: boolean;
  // 战斗临时状态
  energyBonusNext?: number;      // 下张牌费用减少
  nextAttackBonus?: number;      // 下张攻击牌伤害加成
  handSizeBonus?: number;        // 手牌上限加成
  artifact?: number;             // 神器层数
  combat?: any;                  // 当前战斗引用
  // 额外效果状态
  retaliate?: number;            // 反击伤害
  immuneDebuff?: number;         // 免疫负面效果回合数
  damageReductionNext?: number;  // 下次受伤减伤
  // 玩家debuff状态
  playerWeak?: number;           // 虚弱层数（伤害-25%每层）
  playerVulnerable?: number;     // 易伤层数（受伤+50%每层）
  playerStunned?: number;        // 晕眩回合数
  playerPoison?: number;         // 中毒层数（每回合扣血）
  playerDecay?: number;          // 过时层数（手牌费用+1每层）
  // 卡牌效果状态
  permanentDrawBonus?: number;   // 永久抽牌加成
  nextCardCostMinus?: number;    // 下张牌费用减少
  next2AttacksBonus?: number;   // 下2张攻击牌伤害加成
  allAttacksBonus?: number;      // 本回合所有攻击牌伤害加成
  zeroAttackBonus?: number;      // 0费攻击伤害加成
  skillUsedThisTurn?: boolean;   // 本回合使用了技能
  attackAgainNext?: number;     // 下回合再次攻击标记
  costMinusThisTurn?: number;    // 本回合费用减少
  shield8Next?: number;          // 下回合获得护盾
  nextDraw1Next?: number;        // 下回合抽牌
  allShield5Next?: number;       // 下回合友军护盾
  undamagedThisTurn?: boolean;   // 本回合未受伤
  nextTurnSkip?: boolean;        // 跳过下回合
  permanentDamageBonus?: number; // 永久伤害加成
  regenAmount?: number;          // 再生效果
  nextTurnShield5?: number;      // 下回合护盾
  nextTurnShield8?: number;      // 下回合护盾
  nextDrawPlus1?: number;       // 下回合抽牌加成
  circuitBreak?: number;        // 熔断免疫
  shieldNoDecay?: boolean;      // 护盾不消失
  noShieldNextTurn?: boolean;   // 下回合无法护盾
  limitAttack1Next?: boolean;   // 下回合限制攻击1次
  // 事件相关状态
  skipNextReward?: boolean;     // 跳过下一场战斗奖励
  forceBossNow?: boolean;       // 离开事件后立刻进入Boss战
  enemyHpBuffFights?: number;   // 接下来N场战斗敌人生命+50%
  // 新增卡牌效果状态
  revealEnemyIntent?: boolean;    // 显示敌人意图
  
  // ===== 临时效果传递（用于executeCardEffect）=====
  tempNext2AttacksBonus?: number;   // 本次攻击应用的下2次攻击加成
  tempZeroAttackBonus?: number;     // 本次攻击应用的0费攻击加成

  rewardCards?: Card[];           // 战斗奖励卡牌
  draw2IfKill?: boolean;         // 击杀敌人后抽2张
  nextCardDouble?: boolean;       // 下张卡牌双倍
  nextSkillDouble?: boolean;     // 下张技能双倍
  invulnerable2?: number;        // 无敌层数
  reflect50?: boolean;            // 反弹50%伤害
  scryCount?: number;             // 预言次数
  scryCards?: Card[];            // 预言看到的卡
  allCardsRepeat?: boolean;       // 所有卡牌双倍
  unlimitedCards?: boolean;        // 无限出牌
  handCostZero?: boolean;         // 手牌费用为0
  freeCardNext?: string;           // 下张免费卡牌ID
  drawnFreeAndDouble?: boolean;    // 抽到的牌免费且双倍
  
  // ===== 新增: 连携与位置系统 =====
  cardsPlayedThisTurnTypes?: ('attack' | 'defense' | 'skill' | 'curse')[];  // 本回合出牌类型记录
  lastTurnCardTypes?: ('attack' | 'defense' | 'skill' | 'curse')[];        // 上回合出牌类型记录
  cardPositions?: { [cardId: string]: number };  // 卡牌在手牌中的位置(0=最左)
  
  // ===== 新增: 埋伏/延迟系统 =====
  ambushEffects?: AmbushEffect[];  // 埋伏效果队列
  dotEffects?: DotEffect[];        // 持续伤害效果
  delayedEffects?: DelayedEffect[]; // 延迟触发效果
  delayedCards?: Card[]; // 延迟到下回合的卡牌
  
  // ===== 新增: 动态费用系统 =====
  dynamicCostModifiers?: { [cardId: string]: number };  // 动态费用修正
  
  // ===== 新增: 战斗追踪状态 =====
  healthLostThisTurn?: number;     // 本回合失去的生命
  healthLostLastTurn?: number;     // 上回合失去的生命
  discardCountThisTurn?: number;   // 本回合弃牌数
  cardsDiscardedThisCombat?: number; // 本战斗弃牌总数
  enemiesKilledThisTurn?: number;  // 本回合击杀数
  damageDealtThisTurn?: number;    // 本回合造成伤害
  
  // ===== 新增: 下回合效果 =====
  nextTurnDamage?: number;         // 下回合开始时受到伤害
  nextTurnShield?: number;         // 下回合开始时获得护盾
  nextTurnEffects?: NextTurnEffect[];  // 下回合触发的其他效果
  
  // ===== 新增: 特殊计数器 =====
  duplicateCardPlayedThisTurn?: { [cardName: string]: number };  // 本回合打出同名卡次数
  strikeCount?: number;            // 多段攻击计数
  
  // ===== 新增: 卡牌效果状态 =====
  drawIfNotKill?: boolean;         // 未击杀抽牌标记
  killEnergy2?: boolean;           // 击杀获得2能量标记
  circuitBreak12?: boolean;        // 熔断器12阈值
  circuitBreakThreshold?: number;  // 熔断器阈值
  mirrorShield?: number;           // 镜像护盾反弹值
  damageShareEnemies?: boolean;    // 伤害分担标记
  cheatDeath15?: boolean;          // 免死恢复至15标记
  next2CardsDouble?: number;       // 下2张牌双倍
  noDefenseThisTurn?: boolean;     // 本回合无法打出防御牌
  allCardsCostZero?: boolean;      // 所有卡牌费用为0
  endCombatDamage?: number;        // 战斗结束时受到的伤害（诅咒牌）
  
  // 战斗记录
  combatLog?: CombatLogEntry[];
  
  // ===== 新增: 灵感选择系统 =====
  inspiration?: InspirationState;
  
  // ===== 新增: 天赋系统 =====
  talentPoints?: number;                    // 当前可用天赋点
  totalTalentPoints?: number;               // 总共获得的天赋点
  unlockedTalents?: string[];               // 已解锁的天赋ID列表
  talentEffects?: {                         // 天赋效果累积
    drawBonus?: number;                     // 抽牌加成
    damageBonus?: number;                   // 伤害加成
    shieldBonus?: number;                   // 护盾加成
    maxHealthBonus?: number;                // 最大生命加成
    maxEnergyBonus?: number;                // 最大能量加成
    startShield?: number;                   // 战斗开始护盾
    healPerTurn?: number;                   // 每回合恢复生命
    moneyMultiplier?: number;               // 金钱获取倍率
    handSizeBonus?: number;                 // 手牌上限加成
    // 特殊效果标记
    lowHpDamageBonus?: boolean;             // 低血量伤害加成
    criticalHpDoubleDamage?: boolean;       // 危急血量双倍伤害
    shopDiscount?: number;                  // 商店折扣
    randomDamageBonus?: number;             // 随机伤害加成
    firstAttackCostMinus?: boolean;         // 首攻减费
    attackDoubleChance?: number;            // 攻击双倍几率
    shieldPierce?: number;                  // 护盾穿透
    comboBonus?: number;                    // 连击加成
    cardPlayEnergy?: boolean;               // 出牌回能
    lowDeckDoubleDamage?: boolean;          // 牌库少时双倍伤害
    damageReduction?: number;               // 伤害减免
    cheatDeath?: boolean;                   // 免死效果
    extraStrike?: number;                   // 额外连击
    killExtraTurn?: boolean;                // 击杀额外回合
    shieldOverheal?: boolean;               // 护盾转生命
    emergencyHealAndEnergy?: boolean;       // 危急回血回能
    critRate?: number;                      // 暴击率
    critDamage?: number;                    // 暴击伤害加成(%)
  };
  
  // 战斗中的天赋相关状态
  critRate?: number;                        // 当前暴击率
  critDamage?: number;                      // 当前暴击伤害加成
  startStrength?: number;                   // 战斗开始获得的力量
  
  // 天赋树状态
  talentTree?: {
    characterId: string;
    availablePoints: number;
    unlockedTalents: string[];
  };
}

// 战斗记录条目
export interface CombatLogEntry {
  turn: number;
  type: 'player_card' | 'enemy_action' | 'damage' | 'player_damage' | 'heal' | 'shield' | 'status';
  description: string;
  cardName?: string;
  target?: string;
  value?: number;
}

// ===== 新增: 埋伏效果 =====
export interface AmbushEffect {
  id: string;
  type: 'damage' | 'cancel_stun' | 'lifesteal' | 'disable_ability';
  value: number;
  sourceCardName: string;
  trigger: 'enemy_attack' | 'enemy_defend' | 'enemy_special' | 'any_action';
  remainingTurns: number;
}

// ===== 新增: 持续伤害效果 =====
export interface DotEffect {
  id: string;
  damage: number;
  duration: number;
  sourceCardName: string;
  targetEnemyIndex: number;
}

// ===== 新增: 延迟效果 =====
export interface DelayedEffect {
  id: string;
  type: 'self_damage' | 'heal' | 'shield' | 'draw';
  value: number;
  triggerTurn: number;  // 在第几回合触发(相对当前回合)
  sourceCardName: string;
}

// ===== 新增: 下回合效果 =====
export interface NextTurnEffect {
  type: 'damage' | 'heal' | 'shield' | 'draw' | 'energy' | 'status';
  value: number;
  sourceCardName: string;
}

// 商店商品
export interface ShopItem {
  id: string;
  type: 'hardware' | 'card' | 'service';
  name: string;
  description: string;
  price: number;
  item?: Partial<HardwareInventory> | Card;
}

// 事件
export interface GameEvent {
  id: string;
  title: string;
  description: string;
  category: 'benefit' | 'risk' | 'choice' | 'random' | 'shop';
  choices: EventChoice[];
}

export interface EventChoice {
  id: string;
  text: string;
  description?: string;
  effects: EventEffect[];
  condition?: (state: GameState) => boolean;
  conditionText?: string;
}

export interface EventEffect {
  type: 'money' | 'health' | 'maxHealth' | 'card' | 'removeCard' | 'upgradeCard' | 
        'curse' | 'shield' | 'damageBonus' | 'drawBonus' | 'enemyBuff' | 
        'skipReward' | 'forceBoss' | 'hardware' | 'special';
  value: number;
  target?: string;
}

// 游戏配置
export interface GameConfig {
  initialMoney: number;
  initialHardware: HardwareInventory;
  maxFloors: number;
  cardsPerReward: number;
}

// ===== 新增: 灵感选择系统 =====

// 灵感选择类型
export type InspirationType = 
  | 'scry_pick'      // 查看并选择
  | 'scry_arrange'   // 查看并安排顺序/弃牌
  | 'choose_one'     // 多选一
  | 'choose_split';  // 选择分割（如弃一部分留一部分）

// 灵感选择状态
export interface InspirationState {
  isActive: boolean;           // 是否正在进行灵感选择
  type: InspirationType;       // 选择类型
  title: string;              // 标题
  description: string;        // 描述
  cards: Card[];              // 可供选择的卡牌
  selectCount: number;        // 需要选择的数量
  minSelect?: number;         // 最少选择数量
  canDiscard?: boolean;       // 是否可以弃掉卡牌
  canReorder?: boolean;       // 是否可以重新排序
  sourceCardName: string;     // 触发此灵感的卡牌名称
  callbackAction?: string;    // 选择完成后的回调动作标识
}

// 灵感选择结果
export interface InspirationResult {
  selectedCards: Card[];      // 选中的卡牌
  discardedCards?: Card[];    // 弃掉的卡牌（如果有）
  remainingCards?: Card[];    // 剩余放回牌库的卡牌（按顺序）
}
