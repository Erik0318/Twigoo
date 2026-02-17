import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { CardExchangeOption } from '@/data/specialRooms';
import { Coins, RefreshCw, Trash2, Sparkles } from 'lucide-react';

interface CardExchangeViewProps {
  options: CardExchangeOption[];
  currentMoney: number;
  onSelect: (option: CardExchangeOption) => void;
  onLeave: () => void;
}

export function CardExchangeView({ options, currentMoney, onSelect, onLeave }: CardExchangeViewProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'discard_draw': return <RefreshCw className="w-5 h-5" />;
      case 'upgrade': return <Sparkles className="w-5 h-5" />;
      case 'remove': return <Trash2 className="w-5 h-5" />;
      default: return <Coins className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center p-4">
      <Card className="bg-slate-800/90 border-blue-500/50 p-6 max-w-lg w-full">
        {/* 标题 */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-blue-400 mb-2">🔄 卡牌交易市场</h2>
          <p className="text-slate-400">用你不需要的卡换取更强的卡！</p>
        </div>

        {/* 当前金钱 */}
        <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-slate-700/50 rounded-lg">
          <Coins className="w-5 h-5 text-yellow-400" />
          <span className="text-white font-bold">{currentMoney}</span>
          <span className="text-slate-400">金钱</span>
        </div>

        {/* 选项列表 */}
        <div className="space-y-3 mb-6">
          {options.map((option) => {
            const canAfford = currentMoney >= option.cost;
            
            return (
              <button
                key={option.id}
                onClick={() => canAfford && onSelect(option)}
                disabled={!canAfford}
                className={`w-full p-4 rounded-lg border transition-all text-left ${
                  canAfford 
                    ? 'border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/10 cursor-pointer' 
                    : 'border-slate-600 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    canAfford ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-500'
                  }`}>
                    {getIcon(option.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold">{option.name}</h3>
                    <p className="text-slate-400 text-sm">{option.description}</p>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${canAfford ? 'text-yellow-400' : 'text-slate-500'}`}>
                      {option.cost}
                    </div>
                    <div className="text-xs text-slate-500">金钱</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 离开按钮 */}
        <Button
          onClick={onLeave}
          variant="outline"
          className="w-full border-slate-600 text-slate-400 hover:bg-slate-700"
        >
          离开
        </Button>
      </Card>
    </div>
  );
}
