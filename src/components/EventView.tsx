import { useState } from 'react';
import type { GameState } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { getRandomEvent } from '@/data/events';

interface EventViewProps {
  gameState: GameState;
  onLeave: () => void;
  onEffectApplied?: (message: string, description?: string) => void;
}

export function EventView({ gameState, onLeave, onEffectApplied }: EventViewProps) {
  const [event] = useState(() => getRandomEvent());
  const [hasChosen, setHasChosen] = useState(false);
  const [result, setResult] = useState('');

  const handleChoice = (choiceIndex: number) => {
    if (hasChosen) return;
    
    const choice = event.choices[choiceIndex];
    
    // 应用效果
    choice.effect(gameState);
    
    // 通知父组件效果已应用
    if (onEffectApplied && choice.text !== '离开') {
      onEffectApplied(choice.text, event.title);
    }
    
    setResult(choice.text);
    setHasChosen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-lg w-full">
        <Card className="bg-slate-800/80 border-slate-700 p-8">
          {/* 事件图标 */}
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500/30 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-purple-500/50">
            <Sparkles className="w-10 h-10 text-purple-400" />
          </div>

          {/* 事件标题 */}
          <h2 className="text-2xl font-bold text-white text-center mb-3">
            {event.title}
          </h2>
          
          {/* 事件描述 */}
          <p className="text-slate-400 text-center mb-8 leading-relaxed">
            {event.description}
          </p>

          {/* 结果提示 */}
          {hasChosen && result && (
            <div className="bg-gradient-to-r from-green-500/20 to-green-600/10 border border-green-500/50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 justify-center">
                <Check className="w-5 h-5 text-green-400" />
                <p className="text-green-400 text-center">{result}</p>
              </div>
            </div>
          )}

          {/* 选项按钮 */}
          <div className="space-y-3">
            {!hasChosen ? (
              event.choices.map((choice, index) => (
                <Button
                  key={index}
                  onClick={() => handleChoice(index)}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500 py-5 justify-between group transition-all"
                >
                  <span>{choice.text}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              ))
            ) : (
              <Button
                onClick={onLeave}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 py-6 text-lg"
              >
                继续
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
