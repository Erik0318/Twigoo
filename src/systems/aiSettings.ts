/**
 * AI设置管理
 * 控制AI功能的全局开关和调用频率
 */

// 从Settings组件导入loadSettings函数
const SETTINGS_KEY = 'bangdream_settings';

/**
 * 获取设置
 */
function loadSettings(): { aiEnabled: boolean; aiCombatInterval: number } {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    return { 
      aiEnabled: parsed.aiEnabled ?? true,
      aiCombatInterval: parsed.aiCombatInterval ?? 2
    };
  }
  return { aiEnabled: true, aiCombatInterval: 2 };
}

/**
 * 检查AI是否启用
 */
export function isAIEnabled(): boolean {
  try {
    const settings = loadSettings();
    return settings.aiEnabled;
  } catch {
    return true; // 默认开启
  }
}

/**
 * 获取AI战斗调用频率
 */
export function getAICombatInterval(): number {
  try {
    const settings = loadSettings();
    return settings.aiCombatInterval;
  } catch {
    return 2; // 默认每2回合
  }
}

/**
 * 设置AI开关
 */
export function setAIEnabled(enabled: boolean): void {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    const settings = saved ? JSON.parse(saved) : {};
    settings.aiEnabled = enabled;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // 忽略错误
  }
}
