/**
 * AI角色服务
 * 处理战斗和局外的AI交互
 * 优化版本：减少tokens消耗
 */

import type { CombatStatus, RoomInfo, AIResponse, SceneType } from './aiCharacterPrompts';
import { getFullSystemPromptFixed } from './aiCharacterPrompts';

// AI配置
interface AIConfig {
  apiEndpoint: string;
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

// 默认配置（可以通过配置文件或设置界面修改）
let globalConfig: AIConfig = {
  apiEndpoint: '', // 用户需要提供
  apiKey: '',      // 用户需要提供
  model: 'gpt-3.5-turbo',
  maxTokens: 100,  // 减少token输出
  temperature: 0.7 // 稍微降低随机性
};

// 配置AI
export function configureAI(config: Partial<AIConfig>) {
  globalConfig = { ...globalConfig, ...config };
  console.log('[AI] 配置已更新:', { ...globalConfig, apiKey: '***' });
}

// 检查是否已配置
export function isAIConfigured(): boolean {
  return !!globalConfig.apiEndpoint && !!globalConfig.apiKey;
}

// ==================== 缓存机制 ====================

interface CacheEntry {
  response: AIResponse;
  timestamp: number;
}

// 简单的内存缓存
const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

// 生成缓存key
function getCacheKey(characterId: string, scene: string, content: string): string {
  // 简化内容用于缓存key（去掉空格和换行）
  const simplified = content.replace(/\s+/g, '').slice(0, 100);
  return `${characterId}:${scene}:${simplified}`;
}

// 获取缓存
function getCache(key: string): AIResponse | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    responseCache.delete(key);
    return null;
  }
  return entry.response;
}

// 设置缓存
function setCache(key: string, response: AIResponse): void {
  responseCache.set(key, { response, timestamp: Date.now() });
}

// ==================== 智能调用控制 ====================

// 战斗调用频率控制
let combatCallInterval = 2; // 默认每2回合调用一次
let lastCombatKey = '';

// 初始化时读取设置
function initCombatInterval() {
  try {
    const saved = localStorage.getItem('bangdream_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      if (settings.aiCombatInterval) {
        combatCallInterval = settings.aiCombatInterval;
        console.log('[AI] 战斗调用频率设置为:', combatCallInterval);
      }
    }
  } catch {
    // 使用默认值
  }
}
initCombatInterval();

// 设置战斗调用频率（可以在设置中调整）
export function setCombatCallInterval(interval: number): void {
  combatCallInterval = Math.max(1, interval);
}

// 是否应该跳过这次战斗调用
function shouldSkipCombatCall(turn: number, status: CombatStatus): boolean {
  // 关键回合必触发：第1回合、玩家血量<30%、有敌人血量<30%
  const isCritical = turn === 1 || 
    status.playerHealth / status.playerMaxHealth < 0.3 ||
    status.enemies.some(e => e.health / e.maxHealth < 0.3);
  
  if (isCritical) return false;
  
  // 按频率跳过
  return turn % combatCallInterval !== 0;
}

// 简化战斗状态，减少tokens但保留关键信息
function simplifyCombatStatus(status: CombatStatus): string {
  const playerHpPercent = Math.round((status.playerHealth / status.playerMaxHealth) * 100);
  const energyInfo = `${status.playerEnergy}/${status.playerMaxEnergy}`;
  
  // 手牌构成
  const handCards = status.handCards?.slice(0, 5).join(',') || `${status.handSize}张`;
  const handComp = `${status.handAttackCount}攻${status.handDefenseCount}防${status.handSkillCount}技`;
  
  // 手牌详细信息（用于AI做出更好的决策）
  let handDetails = '';
  if (status.handCardDetails && status.handCardDetails.length > 0) {
    handDetails = '|手牌详情:' + status.handCardDetails.slice(0, 5).map(c => {
      let info = `${c.name}(费${c.cost}`;
      if (c.type === 'attack' && c.damage) info += `伤${c.damage}`;
      if (c.type === 'defense' && c.shield) info += `盾${c.shield}`;
      info += ')';
      return info;
    }).join(',');
  }
  
  // 计算敌人总威胁（用于评估）
  const totalEnemyAttack = status.enemies.reduce((sum, e) => sum + (e.attack || 0), 0);
  
  // 敌人状态（包含攻击力和护盾）
  const enemySummaries = status.enemies.map(e => {
    const hpPercent = Math.round((e.health / e.maxHealth) * 100);
    const shieldStr = e.shield > 0 ? `盾${e.shield}` : '无盾';
    return `${e.name}${hpPercent}%攻${e.attack || '?'}${shieldStr}`;
  }).join('; ');
  
  // 硬件信息
  const hwInfo = `抽${status.hardware?.cpuDraw || '?'}能量${status.hardware?.ramEnergy || '?'}`;
  
  // 状态
  const buffs = status.playerBuffs?.join(',') || '无';
  const debuffs = status.playerDebuffs?.join(',') || '无';
  
  // 威胁评估
  const threatInfo = status.playerShield < totalEnemyAttack ? `危险(盾${status.playerShield}<敌攻${totalEnemyAttack})` : '安全';
  
  return `第${status.turn}回合|${playerHpPercent}%HP${status.playerShield>0?`有${status.playerShield}盾`:''}|${energyInfo}费|手牌[${handCards}](${handComp})${handDetails}|${hwInfo}|敌人:${enemySummaries}|威胁:${threatInfo}|增益:${buffs}|减益:${debuffs}`;
}

// 发送请求到AI
async function callAI(characterId: string, scene: SceneType, userContent: string, skipCache = false): Promise<AIResponse> {
  if (!isAIConfigured()) {
    throw new Error('AI未配置');
  }

  // 检查缓存
  const cacheKey = getCacheKey(characterId, scene, userContent);
  if (!skipCache) {
    const cached = getCache(cacheKey);
    if (cached) {
      console.log('[AI] 使用缓存响应');
      return cached;
    }
  }

  const systemPrompt = getFullSystemPromptFixed(characterId, scene);

  try {
    const response = await fetch(globalConfig.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${globalConfig.apiKey}`
      },
      body: JSON.stringify({
        model: globalConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        max_tokens: globalConfig.maxTokens,
        temperature: globalConfig.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    // 尝试解析JSON
    try {
      // 有时候模型会返回markdown代码块，需要提取
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                       content.match(/{[\s\S]*}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      const parsed = JSON.parse(jsonStr);
      
      const result: AIResponse = {
        dialogue: parsed.dialogue || '...',
        thought: parsed.thought,
        emotion: parsed.emotion || 'normal',
        adviceType: parsed.adviceType
      };
      
      // 缓存结果
      setCache(cacheKey, result);
      
      return result;
    } catch (e) {
      // 解析失败，返回原文作为dialogue
      const result: AIResponse = {
        dialogue: content.slice(0, 50), // 限制长度
        emotion: 'normal'
      };
      setCache(cacheKey, result);
      return result;
    }
  } catch (error) {
    console.error('[AI] 调用失败:', error);
    throw error;
  }
}

// ==================== 战斗场景 ====================

export async function getCombatReaction(
  characterId: string,
  status: CombatStatus
): Promise<AIResponse> {
  
  // 检查是否应该跳过这次调用
  if (shouldSkipCombatCall(status.turn, status)) {
    console.log('[AI] 跳过战斗调用 - 回合', status.turn);
    // 返回上一次的响应，或默认响应
    const cached = getCache(lastCombatKey);
    if (cached) return cached;
    return mockCombatReaction(characterId);
  }
  
  // 简化状态描述，减少tokens
  const simplifiedStatus = simplifyCombatStatus(status);
  
  const content = `战斗:${simplifiedStatus}`;
  
  const response = await callAI(characterId, 'combat', content);
  lastCombatKey = getCacheKey(characterId, 'combat', content);
  return response;
}

// ==================== 房间场景 ====================

export async function getRoomReaction(
  characterId: string,
  room: RoomInfo
): Promise<AIResponse> {
  // 简化房间信息
  const content = `房间:${room.type},${room.name},F${room.floor}`;
  return callAI(characterId, 'room_enter', content);
}

// ==================== 事件场景 ====================

export async function getEventReaction(
  characterId: string,
  eventTitle: string,
  _eventDescription: string,
  choices: string[]
): Promise<AIResponse> {
  // 简化事件信息
  const content = `事件:${eventTitle}|${choices.length}选项`;
  return callAI(characterId, 'event', content);
}

// ==================== 商店场景 ====================

export async function getShopReaction(
  characterId: string,
  money: number,
  itemTypes: string[]
): Promise<AIResponse> {
  // 简化商店信息
  const content = `商店:${money}金,${itemTypes.join(',')}`;
  return callAI(characterId, 'shop', content);
}

// ==================== 休息场景 ====================

export async function getRestReaction(
  characterId: string,
  health: number,
  maxHealth: number
): Promise<AIResponse> {
  // 简化休息信息
  const hpPercent = Math.round((health / maxHealth) * 100);
  const content = `休息:HP${hpPercent}%`;
  return callAI(characterId, 'rest', content);
}

// ==================== 模拟回复（测试用/跳过调用时） ====================

const mockCombatResponses: Record<string, AIResponse[]> = {
  'tomori': [
    { dialogue: '对面要过来了...小心一点比较好...', emotion: 'worried', thought: '敌人下回合可能要攻击，建议防御', adviceType: 'defensive' },
    { dialogue: '就是现在...一鼓作气...', emotion: 'serious', thought: '可以击败敌人', adviceType: 'aggressive' },
    { dialogue: '你还撑得住吗...？', emotion: 'worried', adviceType: 'defensive' },
    { dialogue: '一起...迷路吧...', emotion: 'relaxed', adviceType: 'balanced' }
  ],
  'anon': [
    { dialogue: '总会有办法的！あのちゃん相信你能行！', emotion: 'excited', adviceType: 'aggressive' },
    { dialogue: '这个敌人看起来很强...但是あのちゃん不会输的！', emotion: 'worried', adviceType: 'balanced' },
    { dialogue: '就是现在！出风头的时候到了！', emotion: 'excited', adviceType: 'aggressive' }
  ],
  'rana': [
    { dialogue: '有趣nya~', emotion: 'excited', adviceType: 'aggressive' },
    { dialogue: '无聊...快点解决nya', emotion: 'normal', adviceType: 'aggressive' },
    { dialogue: '危险nya...小心点', emotion: 'worried', adviceType: 'defensive' }
  ],
  'soyo': [
    { dialogue: '请冷静一点，稳扎稳打比较好', emotion: 'serious', adviceType: 'defensive' },
    { dialogue: '就是现在，一口气解决吧', emotion: 'serious', adviceType: 'aggressive' },
    { dialogue: '记得我们是一辈子的乐队，不要勉强', emotion: 'worried', adviceType: 'defensive' }
  ],
  'taki': [
    { dialogue: '保持节奏，不要乱', emotion: 'serious', adviceType: 'balanced' },
    { dialogue: '就是现在，combo！', emotion: 'excited', adviceType: 'aggressive' },
    { dialogue: '灯...不，队友有危险，注意防御', emotion: 'worried', adviceType: 'defensive' }
  ]
};

// 模拟调用（不消耗API）
export async function mockCombatReaction(characterId: string): Promise<AIResponse> {
  const responses = mockCombatResponses[characterId] || mockCombatResponses.tomori;
  await new Promise(r => setTimeout(r, 300));
  return responses[Math.floor(Math.random() * responses.length)];
}

export async function mockRoomReaction(_characterId: string, roomType: string): Promise<AIResponse> {
  const responses: Record<string, AIResponse> = {
    'combat': { dialogue: '又要战斗了吗...我会加油的...', emotion: 'serious' },
    'elite': { dialogue: '这个敌人...看起来很强...', emotion: 'worried' },
    'boss': { dialogue: '就是这里了...一起上吧！', emotion: 'serious' },
    'shop': { dialogue: '可以休息一下了吗nya~', emotion: 'relaxed' },
    'rest': { dialogue: '终于能休息了...', emotion: 'relaxed' },
    'event': { dialogue: '这是什么...？', emotion: 'normal' },
    'treasure': { dialogue: '有宝藏nya！', emotion: 'excited' }
  };
  await new Promise(r => setTimeout(r, 200));
  return responses[roomType] || { dialogue: '...', emotion: 'normal' };
}

// ==================== 设置和导出 ====================

// 获取当前战斗调用频率
export function getCombatCallInterval(): number {
  return combatCallInterval;
}

// 导出配置供外部使用
export { globalConfig as aiConfig };
