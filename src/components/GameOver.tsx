import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, Skull, RotateCcw, Home } from 'lucide-react';

interface GameOverProps {
  isVictory: boolean;
  stats: {
    floorsCleared: number;
    enemiesDefeated: number;
    moneyEarned: number;
  };
  onRestart: () => void;
  onMenu: () => void;
}

export function GameOver({ isVictory, stats, onRestart, onMenu }: GameOverProps) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
      <Card className="bg-slate-800 p-8 max-w-md w-full text-center">
        {/* 图标 */}
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isVictory ? 'bg-yellow-500/20' : 'bg-red-500/20'
        }`}>
          {isVictory ? (
            <Trophy className="w-12 h-12 text-yellow-400" />
          ) : (
            <Skull className="w-12 h-12 text-red-400" />
          )}
        </div>

        {/* 标题 */}
        <h2 className={`text-4xl font-bold mb-2 ${
          isVictory ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {isVictory ? '胜利！' : '游戏结束'}
        </h2>
        
        <p className="text-slate-400 mb-6">
          {isVictory 
            ? '你成功击败了春日影的幽灵！' 
            : '你的角色过劳了，需要更多休息...'}
        </p>

        {/* 统计 */}
        <div className="bg-slate-900 rounded-lg p-4 mb-6">
          <h3 className="text-white font-bold mb-3">游戏统计</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-white">{stats.floorsCleared}</p>
              <p className="text-slate-500 text-xs">通关层数</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.enemiesDefeated}</p>
              <p className="text-slate-500 text-xs">击败敌人</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{stats.moneyEarned}</p>
              <p className="text-slate-500 text-xs">获得金钱</p>
            </div>
          </div>
        </div>

        {/* 按钮 */}
        <div className="space-y-3">
          <Button 
            onClick={onRestart}
            className="w-full bg-green-600 hover:bg-green-700 py-6"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            再来一局
          </Button>
          <Button 
            onClick={onMenu}
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Home className="w-5 h-5 mr-2" />
            返回主菜单
          </Button>
        </div>
      </Card>
    </div>
  );
}
