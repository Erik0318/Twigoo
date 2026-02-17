import type { Floor, Room, RoomType } from '@/types/game';

// 房间名称
const roomNames: Record<RoomType, string[]> = {
  combat: ['调试节点', '异常捕获点', '代码审查', '编译错误', '运行时崩溃', '逻辑错误'],
  elite: ['高危漏洞', '系统崩溃点', '核心转储区'],
  shop: ['硬件商店', '开源市场', '依赖仓库', '代码集市'],
  event: ['随机事件', '神秘代码', '遗留系统', '未定义行为'],
  rest: ['休息区', '调试咖啡', '代码重构室', '技术债务偿还'],
  boss: ['Boss房间', '核心崩溃点', '最终测试'],
  challenge: ['代码审计', '技术答辩', '算法挑战', '性能测试'],
  treasure: ['开源奖池', 'Star仓库', '赞助商', '代码捐赠'],
  cardExchange: ['卡牌交易市场', '构筑室', '牌组优化', '手牌交换']
};

// 楼层名称
const floorNames = [
  '初始化',           // 第0层 - 教程
  '调试控制台',       // 第1层
  '内存泄漏区',       // 第2层
  '依赖地狱',         // 第3层
  '遗留系统'          // 第4层 - 隐藏层
];

// 生成完整地图（4层）
export function generateMap(floorCount: number = 4): Floor[] {
  const floors: Floor[] = [];
  
  // 第0层：教程层
  floors.push(generateTutorialFloor());
  
  // 第1-3层：正常层
  for (let i = 1; i < floorCount; i++) {
    const floor = generateFloor(i);
    floors.push(floor);
  }
  
  return floors;
}

// 生成教程层
function generateTutorialFloor(): Floor {
  const rooms: Room[] = [];
  
  // 教学战斗
  rooms.push({
    id: '0',
    type: 'combat',
    name: '新手教程 #0-0',
    description: '学习基础战斗操作',
    cleared: false,
    connections: ['1']
  });
  
  // 强制休息
  rooms.push({
    id: '1',
    type: 'rest',
    name: '恢复站 #0-1',
    description: '恢复精力值',
    cleared: false,
    connections: ['2']
  });
  
  // 基础商店
  rooms.push({
    id: '2',
    type: 'shop',
    name: '新手商店 #0-2',
    description: '购买基础硬件升级',
    cleared: false,
    connections: []
  });
  
  return {
    id: 0,
    name: floorNames[0],
    rooms,
    currentRoomId: '0'
  };
}

// 生成普通层 - 分支选路版本
function generateFloor(floorNumber: number): Floor {
  // 每层分为4-5列（tiers），每列2-4个房间
  const tierCount = 4 + Math.min(2, floorNumber); // 层数越多，列数越多
  const roomsPerTier: number[] = [];
  
  // 计算每列房间数：起点和终点1个，中间2-4个随机
  for (let t = 0; t < tierCount; t++) {
    if (t === 0) {
      roomsPerTier.push(1); // 起点列1个
    } else if (t === tierCount - 1) {
      roomsPerTier.push(1); // 终点列（Boss）1个
    } else {
      roomsPerTier.push(Math.floor(Math.random() * 3) + 2); // 中间列2-4个
    }
  }
  
  // 为每列分配房间类型配额
  const tierTypes: RoomType[][] = [];
  
  // 第0列：起点（战斗或事件）
  tierTypes.push([floorNumber % 2 === 0 ? 'combat' : 'event']);
  
  // 中间列：混合类型
  const midTiers = tierCount - 2;
  for (let t = 0; t < midTiers; t++) {
    const types: RoomType[] = [];
    const roomCount = roomsPerTier[t + 1];
    
    // 按配额分配
    let eliteAssigned = 0, shopAssigned = 0, restAssigned = 0, challengeAssigned = 0, treasureAssigned = 0;
    const maxElite = 1, maxShop = 2, maxRest = 1, maxChallenge = 1, maxTreasure = 1;
    
    for (let i = 0; i < roomCount; i++) {
      let type: RoomType;
      const rand = Math.random();
      
      if (rand < 0.35) {
        type = 'combat';
      } else if (rand < 0.50 && shopAssigned < maxShop) {
        type = 'shop';
        shopAssigned++;
      } else if (rand < 0.60 && eliteAssigned < maxElite) {
        type = 'elite';
        eliteAssigned++;
      } else if (rand < 0.70 && restAssigned < maxRest) {
        type = 'rest';
        restAssigned++;
      } else if (rand < 0.80 && challengeAssigned < maxChallenge) {
        type = 'challenge';
        challengeAssigned++;
      } else if (rand < 0.90 && treasureAssigned < maxTreasure) {
        type = 'treasure';
        treasureAssigned++;
      } else if (rand < 0.95) {
        type = 'cardExchange';
      } else {
        type = 'event';
      }
      types.push(type);
    }
    tierTypes.push(types);
  }
  
  // 最后一列：Boss
  tierTypes.push(['boss']);
  
  // 创建房间并分配tier
  const rooms: Room[] = [];
  let globalIndex = 0;
  
  for (let t = 0; t < tierCount; t++) {
    const tierRoomTypes = tierTypes[t];
    for (let i = 0; i < tierRoomTypes.length; i++) {
      const roomId = `${t}-${i}`;
      const type = tierRoomTypes[i];
      const names = roomNames[type];
      const name = names[Math.floor(Math.random() * names.length)];
      
      rooms.push({
        id: roomId,
        type,
        name: `${name} #${floorNumber}-${t}-${i}`,
        description: getRoomDescription(type),
        cleared: false,
        connections: [],
        tier: t
      });
      globalIndex++;
    }
  }
  
  // 设置连接关系（分支选路）
  for (let t = 0; t < tierCount - 1; t++) {
    const currentTierRooms = rooms.filter(r => r.tier === t);
    const nextTierRooms = rooms.filter(r => r.tier === t + 1);
    
    if (currentTierRooms.length === 0 || nextTierRooms.length === 0) continue;
    
    // 每个当前房间至少连到下一个随机房间
    for (const currentRoom of currentTierRooms) {
      // 连接到至少1个下一列房间
      const target1 = nextTierRooms[Math.floor(Math.random() * nextTierRooms.length)];
      currentRoom.connections.push(target1.id);
      
      // 40%概率额外连接到另一个下一列房间（形成分支）
      if (nextTierRooms.length > 1 && Math.random() < 0.4) {
        let target2: Room;
        do {
          target2 = nextTierRooms[Math.floor(Math.random() * nextTierRooms.length)];
        } while (target2.id === target1.id);
        currentRoom.connections.push(target2.id);
      }
    }
    
    // 确保倒数第二列所有房间都连到Boss（tierCount-1）
    if (t === tierCount - 2) {
      const bossRoom = nextTierRooms.find(r => r.type === 'boss');
      if (bossRoom) {
        for (const currentRoom of currentTierRooms) {
          if (!currentRoom.connections.includes(bossRoom.id)) {
            currentRoom.connections.push(bossRoom.id);
          }
        }
      }
    }
  }
  
  // 确保起点房间为当前房间
  const startRoom = rooms.find(r => r.tier === 0);
  
  return {
    id: floorNumber,
    name: floorNames[floorNumber] || `第${floorNumber}层`,
    rooms,
    currentRoomId: startRoom?.id || '0-0'
  };
}

// 获取房间描述
function getRoomDescription(type: RoomType): string {
  const descriptions: Record<RoomType, string> = {
    combat: '遭遇普通敌人，准备战斗！',
    elite: '高危敌人！高风险高回报',
    shop: '购买硬件升级或新卡牌',
    event: '随机事件，可能获得奖励或遭遇风险',
    rest: '恢复角色精力值或升级卡牌',
    boss: '强大的Boss等待挑战',
    challenge: '技术挑战！通过考验获得奖励',
    treasure: '发现宝藏！随机获得奖励',
    cardExchange: '牌组优化！用不需要的卡换取新卡'
  };
  return descriptions[type];
}

// 检查是否可以进入房间（仅允许进入当前房间连接的目标房间）
export function canEnterRoom(room: Room, currentRoomId: string, floor: Floor): boolean {
  const currentRoom = floor.rooms.find(r => r.id === currentRoomId);
  if (!currentRoom) return false;
  
  // 仅允许进入当前房间所连接的目标房间
  return currentRoom.connections.includes(room.id);
}

// 获取房间奖励倍数
export function getRoomRewardMultiplier(roomType: RoomType): number {
  switch (roomType) {
    case 'combat': return 1;
    case 'elite': return 2.5;
    case 'boss': return 5;
    default: return 0;
  }
}
