import type { Character } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Coffee, Heart, ArrowLeft, Sparkles } from 'lucide-react';

interface RestViewProps {
  character: Character;
  onRest: () => void;
  onLeave: () => void;
}

export function RestView({ character, onRest, onLeave }: RestViewProps) {
  const canRest = character.currentEnergy < character.maxEnergy;
  const energyPercent = (character.currentEnergy / character.maxEnergy) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <Card className="bg-slate-800/80 border-slate-700 p-8 text-center">
          {/* 休息图标 */}
          <div className="w-24 h-24 bg-gradient-to-br from-green-500/30 to-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-500/50">
            <Coffee className="w-12 h-12 text-green-400" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">休息区</h2>
          <p className="text-slate-400 mb-8">
            在这里休息一下，恢复精力值
          </p>

          {/* 角色信息 */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div 
              className="w-16 h-16 rounded-xl overflow-hidden border-2"
              style={{ borderColor: character.color }}
            >
              <img 
                src={character.portrait} 
                alt={character.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `<span class="text-2xl font-bold text-white flex items-center justify-center h-full">${character.name[0]}</span>`;
                }}
              />
            </div>
            <div className="text-left">
              <p className="text-white font-bold">{character.name}</p>
              <p className="text-slate-400 text-sm">{character.trait}</p>
            </div>
          </div>

          {/* 精力条 */}
          <div className="bg-slate-900/80 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-400" />
                <span className="text-white text-lg font-bold">
                  {character.currentEnergy} / {character.maxEnergy}
                </span>
              </div>
              <span className="text-slate-400 text-sm">{Math.round(energyPercent)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-500 to-red-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${energyPercent}%` }}
              />
            </div>
            {canRest && (
              <p className="text-green-400 text-sm mt-2 flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4" />
                休息后可恢复 {Math.min(10, character.maxEnergy - character.currentEnergy)} 点精力
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={onRest}
              disabled={!canRest}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:opacity-50 disabled:from-slate-700 disabled:to-slate-600 py-6 text-lg"
            >
              <Coffee className="w-5 h-5 mr-2" />
              {canRest ? '休息 (+10 精力)' : '精力已满'}
            </Button>
            
            <Button
              onClick={onLeave}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white py-5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              离开
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
