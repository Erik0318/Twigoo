import { useState } from 'react';
import type { GameState } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, SkipForward, Swords, Shield, Zap, 
  Heart, Cpu, MemoryStick, X
} from 'lucide-react';

interface TutorialViewProps {
  gameState: GameState;
  onComplete: () => void;
  onSkip: () => void;
}

interface TutorialStep {
  id: number;
  title: string;
  content: string;
  highlight?: 'card' | 'enemy' | 'stats' | 'hardware' | 'endTurn';
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: '欢迎来到调试深渊',
    content: '我是你的向导。在这个世界里，你需要通过编写代码（打出卡牌）来击败BUG（敌人）。',
  },
  {
    id: 2,
    title: '基础战斗',
    content: '这是攻击卡牌（红色），可以对敌人造成伤害。点击卡牌选择它，再点击一次即可打出！',
    highlight: 'card',
  },
  {
    id: 3,
    title: '保护自己',
    content: '这是防御卡牌（蓝色），可以获得护盾抵挡敌人的攻击。护盾在回合结束时会消失。',
    highlight: 'card',
  },
  {
    id: 4,
    title: '技能卡牌',
    content: '技能卡牌（绿色）有各种特殊效果，比如抽牌、恢复精力等。合理运用它们！',
    highlight: 'card',
  },
  {
    id: 5,
    title: '精力系统',
    content: '左上角显示你的精力（生命值）。当精力降到0时，你会被"编译错误"击败。',
    highlight: 'stats',
  },
  {
    id: 6,
    title: '内存与算力',
    content: '内存（费用）决定每回合能打出多少张卡牌。算力决定每回合抽牌数量。',
    highlight: 'hardware',
  },
  {
    id: 7,
    title: '敌人意图',
    content: '敌人头上的标记显示它们下回合的行动。红色是攻击，注意规划你的防御！',
    highlight: 'enemy',
  },
  {
    id: 8,
    title: '结束回合',
    content: '打完卡牌后，点击"结束回合"按钮。敌人会开始行动，然后进入你的下一回合。',
    highlight: 'endTurn',
  },
  {
    id: 9,
    title: '准备好了吗？',
    content: '击败所有敌人，收集金钱升级你的硬件配置！祝你调试顺利！',
  },
];

export function TutorialView({ gameState, onComplete, onSkip }: TutorialViewProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showDemoCard, setShowDemoCard] = useState(false);
  
  const character = gameState.characters[0];
  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
      // 特定步骤显示演示卡牌
      if (step.highlight === 'card' && currentStep >= 1 && currentStep <= 3) {
        setShowDemoCard(true);
      } else {
        setShowDemoCard(false);
      }
    }
  };

  // 演示卡牌
  const demoCards = [
    { type: 'attack', name: 'printf()', cost: 0, desc: '造成1点伤害，抽1张牌', color: 'border-red-500/60 bg-gradient-to-br from-red-500/20 to-red-600/10', icon: <Swords className="w-4 h-4 text-red-400" /> },
    { type: 'defense', name: 'helloWorld()', cost: 0, desc: '获得2点护盾', color: 'border-blue-500/60 bg-gradient-to-br from-blue-500/20 to-blue-600/10', icon: <Shield className="w-4 h-4 text-blue-400" /> },
    { type: 'skill', name: 'debug()', cost: 1, desc: '查看敌人意图', color: 'border-green-500/60 bg-gradient-to-br from-green-500/20 to-green-600/10', icon: <Zap className="w-4 h-4 text-green-400" /> },
  ];

  const currentDemoCard = demoCards[currentStep - 1] || demoCards[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl w-full flex gap-8 items-center">
        {/* 角色立绘区域 */}
        <div className="flex-shrink-0 relative">
          {/* 角色立绘 */}
          <div 
            className="w-48 h-64 rounded-2xl flex items-end justify-center overflow-hidden border-4 relative"
            style={{ borderColor: character.color }}
          >
            <img 
              src={character.portrait} 
              alt={character.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center bg-slate-800">
                    <span class="text-4xl font-bold text-white">${character.name[0]}</span>
                  </div>
                `;
              }}
            />
            
            {/* 角色名称标签 */}
            <div 
              className="absolute bottom-0 left-0 right-0 py-2 px-4 text-center"
              style={{ backgroundColor: `${character.color}CC` }}
            >
              <p className="text-white font-bold">{character.name}</p>
            </div>
          </div>

          {/* 对话框装饰 */}
          <div className="absolute -right-4 top-1/2 transform -translate-y-1/2">
            <div className="w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-slate-800" />
          </div>

          {/* 动画效果 - 角色轻微浮动 */}
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
            .character-float {
              animation: float 3s ease-in-out infinite;
            }
          `}</style>
          <div className="character-float absolute inset-0 pointer-events-none" />
        </div>

        {/* 对话框内容 */}
        <div className="flex-1">
          <Card className="bg-slate-800/95 border-slate-600 p-6 relative">
            {/* 关闭/跳过按钮 */}
            <button 
              onClick={onSkip}
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 步骤指示器 */}
            <div className="flex items-center gap-2 mb-4">
              {tutorialSteps.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStep ? 'w-8 bg-cyan-400' :
                    idx < currentStep ? 'w-4 bg-cyan-600' : 'w-4 bg-slate-600'
                  }`}
                />
              ))}
            </div>

            {/* 标题 */}
            <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
              {step.title}
            </h2>

            {/* 内容 */}
            <p className="text-slate-300 text-lg leading-relaxed mb-6">
              {step.content}
            </p>

            {/* 演示卡牌 */}
            {showDemoCard && currentStep >= 1 && currentStep <= 3 && (
              <div className="mb-6 flex justify-center">
                <Card className={`w-40 p-3 border-2 ${currentDemoCard.color} transform hover:scale-105 transition-transform`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{currentDemoCard.cost}</span>
                    </div>
                    {currentDemoCard.icon}
                  </div>
                  <p className="text-white font-bold text-sm mb-1">{currentDemoCard.name}</p>
                  <p className="text-slate-400 text-xs">{currentDemoCard.desc}</p>
                </Card>
              </div>
            )}

            {/* 高亮提示图标 */}
            {step.highlight && (
              <div className="flex justify-center gap-4 mb-6">
                {step.highlight === 'stats' && <Heart className="w-8 h-8 text-red-400 animate-pulse" />}
                {step.highlight === 'hardware' && (
                  <>
                    <Cpu className="w-8 h-8 text-cyan-400 animate-pulse" />
                    <MemoryStick className="w-8 h-8 text-green-400 animate-pulse" />
                  </>
                )}
                {step.highlight === 'enemy' && <Swords className="w-8 h-8 text-red-400 animate-pulse" />}
                {step.highlight === 'endTurn' && (
                  <Badge className="bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2">
                    结束回合
                  </Badge>
                )}
              </div>
            )}

            {/* 按钮区域 */}
            <div className="flex justify-between items-center">
              <Button 
                variant="ghost" 
                onClick={onSkip}
                className="text-slate-500 hover:text-slate-300"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                跳过教程
              </Button>

              <Button 
                onClick={handleNext}
                className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 px-8"
              >
                {isLastStep ? '开始战斗！' : '下一步'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>

          {/* 页码提示 */}
          <p className="text-center text-slate-500 text-sm mt-3">
            {currentStep + 1} / {tutorialSteps.length}
          </p>
        </div>
      </div>
    </div>
  );
}
