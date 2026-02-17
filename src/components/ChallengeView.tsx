import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Challenge } from '@/data/specialRooms';

interface ChallengeViewProps {
  challenge: Challenge;
  onAnswer: (correct: boolean) => void;
  onLeave: () => void;
}

export function ChallengeView({ challenge, onAnswer, onLeave }: ChallengeViewProps) {
  const [answered, setAnswered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSelect = (index: number) => {
    if (answered) return;
    
    setSelectedIndex(index);
    const correct = challenge.options[index].correct;
    setIsCorrect(correct);
    setAnswered(true);
    
    // 延迟一下再给奖励
    setTimeout(() => {
      onAnswer(correct);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4">
      <Card className="bg-slate-800/90 border-purple-500/50 p-6 max-w-lg w-full">
        {/* 标题 */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-purple-400 mb-2">🎯 {challenge.title}</h2>
          <p className="text-slate-400">{challenge.description}</p>
        </div>

        {/* 问题 */}
        <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
          <p className="text-white font-mono text-sm whitespace-pre-wrap">{challenge.question}</p>
        </div>

        {/* 选项 */}
        <div className="space-y-3 mb-6">
          {challenge.options.map((option, index) => {
            let buttonClass = "w-full text-left p-3 rounded-lg border transition-all ";
            
            if (!answered) {
              buttonClass += "border-slate-600 hover:border-purple-400 hover:bg-slate-700/50";
            } else {
              if (option.correct) {
                buttonClass += "border-green-500 bg-green-500/20";
              } else if (selectedIndex === index && !option.correct) {
                buttonClass += "border-red-500 bg-red-500/20";
              } else {
                buttonClass += "border-slate-600 opacity-50";
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={answered}
                className={buttonClass}
              >
                <div className="flex justify-between items-center">
                  <span className="text-white">{option.text}</span>
                  {answered && option.correct && (
                    <span className="text-green-400 text-sm">✓</span>
                  )}
                  {answered && selectedIndex === index && !option.correct && (
                    <span className="text-red-400 text-sm">✗</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 结果显示 */}
        {answered && (
          <div className={`text-center p-4 rounded-lg mb-4 ${
            isCorrect ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
          }`}>
            <p className={isCorrect ? 'text-green-400' : 'text-red-400'}>
              {isCorrect ? `回答正确！奖励: ${challenge.options[selectedIndex!].reward}` : '回答错误！'}
            </p>
          </div>
        )}

        {/* 离开按钮 */}
        <Button
          onClick={onLeave}
          variant="outline"
          className="w-full border-slate-600 text-slate-400 hover:bg-slate-700"
        >
          {answered ? '继续前进' : '离开'}
        </Button>
      </Card>
    </div>
  );
}
