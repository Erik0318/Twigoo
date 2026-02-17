/**
 * 计算机硬件系统 - 简化版
 * 只保留核心组件：CPU、主板、内存、显卡、电源
 */

// CPU插槽类型
export type CpuSocket = 'LGA1700' | 'AM5';

// 内存类型
export type RamType = 'DDR4' | 'DDR5';

// ==================== CPU 定义 ====================
export interface CPU {
  id: string;
  name: string;
  brand: 'Intel' | 'AMD';
  socket: CpuSocket;
  basePower: number;      // 基础算力（抽牌数）
  tdp: number;
  price: number;
  description: string;
}

export const cpus: CPU[] = [
  { id: 'i3_12100', name: 'Intel i3-12100', brand: 'Intel', socket: 'LGA1700', basePower: 3, tdp: 60, price: 100, description: '入门算力，抽3张牌' },
  { id: 'i5_12400', name: 'Intel i5-12400', brand: 'Intel', socket: 'LGA1700', basePower: 4, tdp: 65, price: 200, description: '主流算力，抽4张牌' },
  { id: 'i7_12700', name: 'Intel i7-12700', brand: 'Intel', socket: 'LGA1700', basePower: 5, tdp: 125, price: 350, description: '高端算力，抽5张牌' },
  { id: 'i9_12900', name: 'Intel i9-12900K', brand: 'Intel', socket: 'LGA1700', basePower: 6, tdp: 150, price: 550, description: '极致算力，抽6张牌' },
  { id: 'r5_7600', name: 'AMD Ryzen 5 7600', brand: 'AMD', socket: 'AM5', basePower: 4, tdp: 65, price: 220, description: '能效之选，抽4张牌' },
  { id: 'r7_7700', name: 'AMD Ryzen 7 7700', brand: 'AMD', socket: 'AM5', basePower: 5, tdp: 105, price: 380, description: '多核利器，抽5张牌' },
  { id: 'r9_7950', name: 'AMD Ryzen 9 7950X', brand: 'AMD', socket: 'AM5', basePower: 7, tdp: 170, price: 600, description: '工作站级，抽7张牌' },
];

// ==================== 主板 定义 ====================
export interface Motherboard {
  id: string;
  name: string;
  socket: CpuSocket;
  ramType: RamType;
  ramSlots: number;
  maxRam: number;        // 最大支持内存(GB)
  pcieSlots: number;     // 显卡插槽数
  price: number;
  description: string;
}

export const motherboards: Motherboard[] = [
  { id: 'h610', name: 'H610M', socket: 'LGA1700', ramType: 'DDR4', ramSlots: 2, maxRam: 32, pcieSlots: 1, price: 80, description: '入门主板，2内存槽' },
  { id: 'b660', name: 'B660', socket: 'LGA1700', ramType: 'DDR4', ramSlots: 4, maxRam: 64, pcieSlots: 2, price: 150, description: '主流主板，4内存槽' },
  { id: 'z690', name: 'Z690', socket: 'LGA1700', ramType: 'DDR5', ramSlots: 4, maxRam: 128, pcieSlots: 3, price: 300, description: '高端主板，DDR5' },
  { id: 'a620', name: 'A620', socket: 'AM5', ramType: 'DDR5', ramSlots: 2, maxRam: 64, pcieSlots: 1, price: 100, description: 'AMD入门，DDR5' },
  { id: 'b650', name: 'B650', socket: 'AM5', ramType: 'DDR5', ramSlots: 4, maxRam: 128, pcieSlots: 2, price: 200, description: 'AMD主流，超频支持' },
  { id: 'x670', name: 'X670E', socket: 'AM5', ramType: 'DDR5', ramSlots: 4, maxRam: 256, pcieSlots: 3, price: 450, description: 'AMD旗舰，极致扩展' },
];

// ==================== 内存条 定义 ====================
export interface RamStick {
  id: string;
  name: string;
  type: RamType;
  capacity: number;
  energy: number;        // 提供的能量（费用）
  price: number;
  description: string;
}

export const ramSticks: RamStick[] = [
  { id: 'ddr4_8', name: 'DDR4 8GB', type: 'DDR4', capacity: 8, energy: 2, price: 30, description: '基础内存，2点能量' },
  { id: 'ddr4_16', name: 'DDR4 16GB', type: 'DDR4', capacity: 16, energy: 3, price: 60, description: '主流内存，3点能量' },
  { id: 'ddr4_32', name: 'DDR4 32GB', type: 'DDR4', capacity: 32, energy: 4, price: 120, description: '大容量内存，4点能量' },
  { id: 'ddr5_16', name: 'DDR5 16GB', type: 'DDR5', capacity: 16, energy: 4, price: 80, description: '高速内存，4点能量' },
  { id: 'ddr5_32', name: 'DDR5 32GB', type: 'DDR5', capacity: 32, energy: 5, price: 150, description: '旗舰内存，5点能量' },
  { id: 'ddr5_64', name: 'DDR5 64GB', type: 'DDR5', capacity: 64, energy: 6, price: 300, description: '极致内存，6点能量' },
];

// ==================== 显卡 定义 ====================
export interface GPU {
  id: string;
  name: string;
  vram: number;
  damage: number;        // 额外伤害
  tdp: number;
  price: number;
  description: string;
}

export const gpus: GPU[] = [
  { id: 'gtx1650', name: 'GTX 1650', vram: 4, damage: 1, tdp: 75, price: 150, description: '入门显卡，伤害+1' },
  { id: 'rtx3060', name: 'RTX 3060', vram: 12, damage: 2, tdp: 170, price: 350, description: '主流显卡，伤害+2' },
  { id: 'rtx4070', name: 'RTX 4070', vram: 12, damage: 3, tdp: 200, price: 600, description: '高端显卡，伤害+3' },
  { id: 'rtx4090', name: 'RTX 4090', vram: 24, damage: 5, tdp: 450, price: 1200, description: '旗舰显卡，伤害+5' },
  { id: 'rx6600', name: 'RX 6600', vram: 8, damage: 2, tdp: 132, price: 280, description: 'AMD主流，伤害+2' },
  { id: 'rx7900', name: 'RX 7900 XTX', vram: 24, damage: 4, tdp: 355, price: 900, description: 'AMD旗舰，伤害+4' },
];

// ==================== 电源 定义 ====================
export interface PSU {
  id: string;
  name: string;
  wattage: number;
  efficiency: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  price: number;
  description: string;
}

export const psus: PSU[] = [
  { id: 'psu_450', name: '450W 铜牌', wattage: 450, efficiency: 'Bronze', price: 50, description: '入门电源' },
  { id: 'psu_550', name: '550W 铜牌', wattage: 550, efficiency: 'Bronze', price: 70, description: '主流电源' },
  { id: 'psu_650', name: '650W 金牌', wattage: 650, efficiency: 'Gold', price: 100, description: '高效电源' },
  { id: 'psu_750', name: '750W 金牌', wattage: 750, efficiency: 'Gold', price: 130, description: '高端电源' },
  { id: 'psu_850', name: '850W 白金', wattage: 850, efficiency: 'Platinum', price: 180, description: '旗舰电源' },
  { id: 'psu_1000', name: '1000W 白金', wattage: 1000, efficiency: 'Platinum', price: 250, description: '工作站电源' },
];

// ==================== 硬件库存 ====================
export interface HardwareInventory {
  motherboard: Motherboard | null;
  cpu: CPU | null;
  ramSticks: RamStick[];
  gpu: GPU | null;
  psu: PSU | null;
}

// 初始硬件配置
export function createInitialHardware(): HardwareInventory {
  return {
    motherboard: motherboards[0],
    cpu: cpus[0],
    ramSticks: [ramSticks[0]],
    gpu: null,
    psu: psus[1],
  };
}

// ==================== 计算属性 ====================
export interface ComputedStats {
  drawPower: number;
  maxEnergy: number;
  gpuBonus: number;
}

export function computeStats(inventory: HardwareInventory): ComputedStats {
  return {
    drawPower: inventory.cpu?.basePower || 3,
    maxEnergy: inventory.ramSticks.reduce((sum, ram) => sum + ram.energy, 2),
    gpuBonus: inventory.gpu?.damage || 0,
  };
}

// ==================== 兼容性检查 ====================
export interface CompatibilityIssue {
  component: string;
  issue: string;
  severity: 'error' | 'warning';
}

export function checkCompatibility(inventory: HardwareInventory): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  
  if (!inventory.motherboard) {
    issues.push({ component: '主板', issue: '未安装主板', severity: 'error' });
    return issues;
  }
  
  // CPU兼容性
  if (inventory.cpu && inventory.cpu.socket !== inventory.motherboard.socket) {
    issues.push({
      component: 'CPU',
      issue: `CPU插槽 ${inventory.cpu.socket} 与主板不兼容`,
      severity: 'error'
    });
  }
  
  // 内存兼容性
  inventory.ramSticks.forEach((ram, index) => {
    if (ram.type !== inventory.motherboard!.ramType) {
      issues.push({
        component: '内存',
        issue: `内存条 #${index + 1} 类型不匹配`,
        severity: 'error'
      });
    }
  });
  
  // 内存插槽数量
  if (inventory.ramSticks.length > inventory.motherboard.ramSlots) {
    issues.push({
      component: '内存',
      issue: `内存条数量超过主板插槽`,
      severity: 'error'
    });
  }
  
  // 功耗检查
  if (inventory.psu) {
    let totalTdp = 0;
    if (inventory.cpu) totalTdp += inventory.cpu.tdp;
    if (inventory.gpu) totalTdp += inventory.gpu.tdp;
    
    if (inventory.psu.wattage < totalTdp * 1.2) {
      issues.push({
        component: '电源',
        issue: `电源功率可能不足`,
        severity: 'warning'
      });
    }
  }
  
  return issues;
}

// ==================== 商店可用物品 ====================
export function getShopHardware(floor: number): {
  cpus: CPU[];
  motherboards: Motherboard[];
  ramSticks: RamStick[];
  gpus: GPU[];
  psus: PSU[];
} {
  // 根据楼层解锁更高级的硬件
  const cpuTiers = floor <= 1 ? cpus.slice(0, 3) : 
                   floor <= 3 ? cpus.slice(0, 5) : cpus;
  
  const gpuTiers = floor <= 1 ? gpus.slice(0, 2) :
                   floor <= 3 ? gpus.slice(0, 4) : gpus;
  
  return {
    cpus: cpuTiers,
    motherboards: motherboards,
    ramSticks: ramSticks,
    gpus: gpuTiers,
    psus: psus,
  };
}

// 获取随机单个硬件
export function getRandomHardware(floor: number): CPU | Motherboard | RamStick | GPU | PSU {
  const shop = getShopHardware(floor);
  const allHardware = [
    ...shop.cpus,
    ...shop.motherboards,
    ...shop.ramSticks,
    ...shop.gpus,
    ...shop.psus,
  ];
  return allHardware[Math.floor(Math.random() * allHardware.length)];
}
