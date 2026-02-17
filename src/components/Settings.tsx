/**
 * 游戏设置组件
 * 提供音量调节、动画速度、游戏教程等功能
 * 设置数据持久化存储在localStorage中
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { 
  Volume2, 
  VolumeX, 
  Music, 
  Gamepad2, 
  ArrowLeft, 
  Monitor,
  BookOpen,
  HelpCircle,
  Cpu,
  Heart,
  Zap,
  Shield,
  Sword
} from 'lucide-react';

// ==================== 接口定义 ====================

interface SettingsProps {
  isOpen: boolean;                              // 是否显示设置面板
  onClose: () => void;                          // 关闭回调
  onVolumeChange?: (bgmVolume: number, sfxVolume: number) => void; // 音量变化回调
}

// ==================== 设置数据管理 ====================

/**
 * 默认设置
 */
const defaultSettings = {
  bgmVolume: 0.3,           // BGM音量 (0-1)
  sfxVolume: 0.5,           // 音效音量 (0-1)
  animationSpeed: 1,        // 动画速度 (0.5=慢速, 1=正常, 2=快速)
  showDamageNumbers: true   // 是否显示伤害数字
};

/**
 * 从localStorage读取设置
 */
function loadSettings() {
  const saved = localStorage.getItem('bangdream_settings');
  if (saved) {
    return { ...defaultSettings, ...JSON.parse(saved) };
  }
  return defaultSettings;
}

/**
 * 保存设置到localStorage
 */
function saveSettings(settings: any) {
  localStorage.setItem('bangdream_settings', JSON.stringify(settings));
}

// ==================== 游戏教程内容 ====================

/**
 * 游戏教程数据
 */
const gameTutorial = {
  // 基础玩法
  basics: {
    title: '基础玩法',
    icon: <BookOpen className="w-5 h-5 text-blue-400" />,
    content: [
      '【目标】击败所有敌人，通关4层地图，最终战胜Boss',
      '【战斗】每回合抽牌 → 打出卡牌 → 结束回合 → 敌人行动',
      '【胜利】敌人生命归零即可获胜，获得金钱奖励',
      '【失败】角色精力归零则游戏结束'
    ]
  },
  // 资源系统
  resources: {
    title: '资源系统',
    icon: <Zap className="w-5 h-5 text-yellow-400" />,
    content: [
      '【精力】角色的生命值，受攻击会减少',
      '【费用(内存)】打出卡牌需要消耗费用，每回合恢复',
      '【行动点】每回合可打出卡牌的数量上限',
      '【金钱】用于在商店购买卡牌和升级硬件'
    ]
  },
  // 卡牌系统
  cards: {
    title: '卡牌系统',
    icon: <Sword className="w-5 h-5 text-red-400" />,
    content: [
      '【牌库】所有可抽的卡牌，战斗开始时洗牌',
      '【手牌】当前可打出的卡牌，上限10张',
      '【弃牌堆】已打出的卡牌，牌库空时洗回牌库',
      '【卡牌类型】攻击(红色)、防御(蓝色)、技能(绿色)',
      '【抽牌循环】牌库空时，弃牌堆自动洗牌进入牌库'
    ]
  },
  // 硬件系统
  hardware: {
    title: '硬件系统',
    icon: <Cpu className="w-5 h-5 text-cyan-400" />,
    content: [
      '【CPU】决定每回合抽牌数量',
      '【内存】决定每回合可用费用',
      '【线程】决定每回合行动点数量',
      '【存储】决定牌库容量上限',
      '【升级】在商店花费金钱升级硬件'
    ]
  },
  // 战斗技巧
  combat: {
    title: '战斗技巧',
    icon: <Shield className="w-5 h-5 text-green-400" />,
    content: [
      '【护盾】临时护盾在回合结束时消失，优先吸收伤害',
      '【敌人意图】敌人头上显示下回合行动（攻击/防御/特殊）',
      '【特殊敌人】空指针30%闪避、死锁需要2张卡才能伤害',
      '【Boss战】每3层出现Boss，击败后进入下一层',
      '【休息区】可恢复50%精力，合理规划路线'
    ]
  },
  // 角色特质
  characters: {
    title: '角色特质',
    icon: <Heart className="w-5 h-5 text-pink-400" />,
    content: [
      '【高松灯】战斗开始获得1张诗歌牌（0费抽1护盾1）',
      '【椎名立希】回合结束获得1金钱，商店价格正常',
      '【千早爱音】商店所有商品价格-20%',
      '【要乐奈】每回合首张攻击牌费用-1',
      '【长崎爽世】战斗开始时根据已损失精力获得护盾'
    ]
  }
};

// ==================== 主组件 ====================

export function Settings({ isOpen, onClose, onVolumeChange }: SettingsProps) {
  // 设置状态
  const [settings, setSettings] = useState(loadSettings());
  // 当前显示的子页面: 'main' | 'tutorial'
  const [currentPage, setCurrentPage] = useState<'main' | 'tutorial'>('main');

  /**
   * 设置变化时保存到localStorage并通知父组件
   */
  useEffect(() => {
    saveSettings(settings);
    onVolumeChange?.(settings.bgmVolume, settings.sfxVolume);
  }, [settings, onVolumeChange]);

  // ---------- 事件处理 ----------

  const handleBgmVolumeChange = (value: number[]) => {
    setSettings((prev: any) => ({ ...prev, bgmVolume: value[0] }));
  };

  const handleSfxVolumeChange = (value: number[]) => {
    setSettings((prev: any) => ({ ...prev, sfxVolume: value[0] }));
  };

  const handleAnimationSpeedChange = (value: number[]) => {
    setSettings((prev: any) => ({ ...prev, animationSpeed: value[0] }));
  };

  const handleToggleDamageNumbers = () => {
    setSettings((prev: any) => ({ ...prev, showDamageNumbers: !prev.showDamageNumbers }));
  };

  const handleReset = () => {
    setSettings(defaultSettings);
  };

  // ---------- 渲染辅助函数 ----------

  /**
   * 渲染教程页面
   */
  const renderTutorial = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="flex items-center gap-2 mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setCurrentPage('main')}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>
        <h3 className="text-lg font-bold text-white">游戏教程</h3>
      </div>

      {Object.values(gameTutorial).map((section, index) => (
        <Card key={index} className="bg-slate-800/60 border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            {section.icon}
            <h4 className="font-bold text-white">{section.title}</h4>
          </div>
          <ul className="space-y-2">
            {section.content.map((line, lineIndex) => (
              <li key={lineIndex} className="text-sm text-slate-300 pl-2 border-l-2 border-slate-600">
                {line}
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );

  /**
   * 渲染主设置页面
   */
  const renderMainSettings = () => (
    <div className="space-y-6">
      {/* BGM音量 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-pink-400" />
            <span className="text-slate-300 text-sm">背景音乐音量</span>
          </div>
          <span className="text-slate-400 text-sm">{Math.round(settings.bgmVolume * 100)}%</span>
        </div>
        <Slider
          value={[settings.bgmVolume]}
          onValueChange={handleBgmVolumeChange}
          max={1}
          step={0.05}
          className="w-full"
        />
      </div>

      {/* 音效音量 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {settings.sfxVolume > 0 ? (
              <Volume2 className="w-4 h-4 text-green-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
            <span className="text-slate-300 text-sm">音效音量</span>
          </div>
          <span className="text-slate-400 text-sm">{Math.round(settings.sfxVolume * 100)}%</span>
        </div>
        <Slider
          value={[settings.sfxVolume]}
          onValueChange={handleSfxVolumeChange}
          max={1}
          step={0.05}
          className="w-full"
        />
      </div>

      {/* 动画速度 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-blue-400" />
            <span className="text-slate-300 text-sm">动画速度</span>
          </div>
          <span className="text-slate-400 text-sm">
            {settings.animationSpeed === 0.5 ? '慢速' : settings.animationSpeed === 1 ? '正常' : '快速'}
          </span>
        </div>
        <Slider
          value={[settings.animationSpeed]}
          onValueChange={handleAnimationSpeedChange}
          min={0.5}
          max={2}
          step={0.5}
          className="w-full"
        />
      </div>

      {/* 显示伤害数字 */}
      <Button
        variant="outline"
        onClick={handleToggleDamageNumbers}
        className={`w-full justify-between ${
          settings.showDamageNumbers 
            ? 'border-green-500/50 text-green-400' 
            : 'border-slate-600 text-slate-400'
        }`}
      >
        <span>显示伤害数字</span>
        <span>{settings.showDamageNumbers ? '开启' : '关闭'}</span>
      </Button>

      {/* 游戏教程按钮 */}
      <Button
        variant="outline"
        onClick={() => setCurrentPage('tutorial')}
        className="w-full border-indigo-500/50 text-indigo-400 hover:bg-indigo-900/30 hover:text-indigo-300"
      >
        <HelpCircle className="w-4 h-4 mr-2" />
        游戏教程
      </Button>

      {/* 重置按钮 */}
      <Button
        variant="outline"
        onClick={handleReset}
        className="w-full border-slate-600 text-slate-400 hover:text-slate-300 hover:bg-slate-800"
      >
        恢复默认设置
      </Button>
    </div>
  );

  // ---------- 主渲染 ----------
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-slate-900/95 border-slate-700 p-6">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {currentPage === 'main' ? '游戏设置' : '游戏教程'}
            </h2>
          </div>
          {currentPage === 'main' && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* 内容区域 */}
        {currentPage === 'main' ? renderMainSettings() : renderTutorial()}
      </Card>
    </div>
  );
}

// 导出设置获取函数供外部使用
export { loadSettings };
