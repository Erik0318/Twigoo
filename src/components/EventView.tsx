import { useState, useCallback } from 'react';
import type { GameState, GameEvent } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  AlertTriangle,
  Shield,
  HelpCircle,
  ShoppingBag,
  X
} from 'lucide-react';
import { 
  getEventForProgress, 
  applyEventEffects, 
  handleSpecialEffect,
  type EventChoice 
} from '@/data/events';
import { RoomAIAdvice } from './RoomAIAdvice';

interface EventViewProps {
  gameState: GameState;
  onLeave: () => void;
  onApplyEffects: (effects: EventResult) => void;
}

export interface EventResult {
  money?: number;
  health?: number;
  maxHealth?: number;
  cards?: number;
  removeCards?: number;
  upgradeCards?: number;
  curses?: number;
  damageBonus?: number;
  drawBonus?: number;
  enemyBuff?: number;
  skipReward?: boolean;
  messages: string[];
}

// 事件图标映射
const eventIcons: Record<GameEvent['category'], React.ReactNode> = {
  benefit: <Shield className="w-10 h-10 text-green-400" />,
  risk: <AlertTriangle className="w-10 h-10 text-red-400" />,
  choice: <HelpCircle className="w-10 h-10 text-blue-400" />,
  random: <Sparkles className="w-10 h-10 text-purple-400" />,
  shop: <ShoppingBag className="w-10 h-10 text-yellow-400" />
};

// 事件颜色映射
const eventColors: Record<GameEvent['category'], string> = {
  benefit: 'from-green-500/30 to-green-600/20 border-green-500/50',
  risk: 'from-red-500/30 to-red-600/20 border-red-500/50',
  choice: 'from-blue-500/30 to-blue-600/20 border-blue-500/50',
  random: 'from-purple-500/30 to-purple-600/20 border-purple-500/50',
  shop: 'from-yellow-500/30 to-yellow-600/20 border-yellow-500/50'
};

export function EventView({ gameState, onLeave, onApplyEffects }: EventViewProps) {
  // 根据当前楼层获取合适的事件
  const maxFloors = gameState.floors.length;
  const [event] = useState(() => 
    getEventForProgress(gameState.currentFloor, maxFloors)
  );
  const [hasChosen, setHasChosen] = useState(false);
  const [result, setResult] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChoice = useCallback((choice: EventChoice) => {
    if (hasChosen || isProcessing) return;
    setIsProcessing(true);

    const resultMessages: string[] = [];
    const eventResult: EventResult = { messages: [] };

    // 处理特殊效果
    const specialEffect = choice.effects.find(e => e.type === 'special');
    if (specialEffect) {
      const { effects, message } = handleSpecialEffect(specialEffect.value, gameState);
      resultMessages.push(message);
      // 将特殊效果转换为普通效果继续处理
      choice.effects = choice.effects.filter(e => e.type !== 'special');
      choice.effects.push(...effects);
    }

    // 应用普通效果
    const { messages } = applyEventEffects(choice.effects, gameState, gameState.currentFloor);
    resultMessages.push(...messages);

    // 构建返回结果
    choice.effects.forEach(effect => {
      switch (effect.type) {
        case 'money':
          eventResult.money = (eventResult.money || 0) + effect.value;
          break;
        case 'health':
          eventResult.health = (eventResult.health || 0) + effect.value;
          break;
        case 'maxHealth':
          eventResult.maxHealth = (eventResult.maxHealth || 0) + effect.value;
          break;
        case 'card':
          eventResult.cards = (eventResult.cards || 0) + effect.value;
          break;
        case 'removeCard':
          eventResult.removeCards = (eventResult.removeCards || 0) + effect.value;
          break;
        case 'upgradeCard':
          eventResult.upgradeCards = (eventResult.upgradeCards || 0) + effect.value;
          break;
        case 'curse':
          eventResult.curses = (eventResult.curses || 0) + effect.value;
          break;
        case 'damageBonus':
          eventResult.damageBonus = (eventResult.damageBonus || 0) + effect.value;
          break;
        case 'drawBonus':
          eventResult.drawBonus = (eventResult.drawBonus || 0) + effect.value;
          break;
        case 'enemyBuff':
          eventResult.enemyBuff = (eventResult.enemyBuff || 0) + effect.value;
          break;
        case 'skipReward':
          eventResult.skipReward = true;
          break;
      }
    });

    eventResult.messages = resultMessages;
    onApplyEffects(eventResult);
    
    setResult(resultMessages.length > 0 ? resultMessages : ['已选择：' + choice.text]);
    setHasChosen(true);
    setIsProcessing(false);
  }, [hasChosen, isProcessing, gameState, onApplyEffects]);

  // 检查选项是否可用
  const isChoiceAvailable = (choice: EventChoice): boolean => {
    if (!choice.condition) return true;
    return choice.condition(gameState);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <Card className="bg-slate-800/90 border-slate-700 p-6 shadow-2xl">
          {/* 事件图标 */}
          <div className={`w-20 h-20 bg-gradient-to-br ${eventColors[event.category]} rounded-full flex items-center justify-center mx-auto mb-5 border-2`}>
            {eventIcons[event.category]}
          </div>

          {/* 分类标签 */}
          <div className="flex justify-center mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium
              ${event.category === 'benefit' ? 'bg-green-500/20 text-green-400' :
                event.category === 'risk' ? 'bg-red-500/20 text-red-400' :
                event.category === 'choice' ? 'bg-blue-500/20 text-blue-400' :
                event.category === 'shop' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-purple-500/20 text-purple-400'}`}>
              {event.category === 'benefit' ? '增益' :
               event.category === 'risk' ? '风险' :
               event.category === 'choice' ? '抉择' :
               event.category === 'shop' ? '商店' : '随机'}
            </span>
          </div>

          {/* 事件标题 */}
          <h2 className="text-2xl font-bold text-white text-center mb-3">
            {event.title}
          </h2>
          
          {/* 事件描述 */}
          <p className="text-slate-400 text-center mb-6 leading-relaxed">
            {event.description}
          </p>

          {/* 结果提示 */}
          {hasChosen && result.length > 0 && (
            <div className="bg-gradient-to-r from-green-500/20 to-green-600/10 border border-green-500/50 rounded-xl p-4 mb-5">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {result.map((msg, idx) => (
                    <p key={idx} className="text-green-400 text-sm">{msg}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 选项按钮 */}
          <div className="space-y-3">
            {!hasChosen ? (
              event.choices.map((choice, index) => {
                const available = isChoiceAvailable(choice);
                return (
                  <Button
                    key={index}
                    onClick={() => handleChoice(choice)}
                    disabled={!available || isProcessing}
                    variant="outline"
                    className={`w-full py-4 justify-between group transition-all text-left
                      ${available 
                        ? 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500' 
                        : 'border-slate-700 text-slate-600 cursor-not-allowed opacity-60'}`}
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <span className={available ? 'text-white' : 'text-slate-500'}>
                        {choice.text}
                      </span>
                      {choice.description && (
                        <span className="text-xs text-slate-500">
                          {choice.description}
                        </span>
                      )}
                      {!available && choice.conditionText && (
                        <span className="text-xs text-red-400 flex items-center gap-1">
                          <X className="w-3 h-3" />
                          {choice.conditionText}
                        </span>
                      )}
                    </div>
                    {available && (
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    )}
                  </Button>
                );
              })
            ) : (
              <Button
                onClick={onLeave}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 py-6 text-lg"
              >
                继续旅程
              </Button>
            )}
          </div>
        </Card>
      </div>
      
      {/* AI角色建议 */}
      {gameState.characters[0] && !hasChosen && (
        <RoomAIAdvice
          character={gameState.characters[0]}
          roomType="event"
          eventContext={{
            eventName: event.title,
            category: event.category
          }}
        />
      )}
    </div>
  );
}
