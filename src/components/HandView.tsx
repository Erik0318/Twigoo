import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Shield, Zap, Sparkles, Layers } from 'lucide-react';
import type { GameState } from '@/types/game';
import { formatCardDescription } from '@/data/cards';

interface HandViewProps {
  gameState: GameState;
  onClose: () => void;
}

export function HandView({ gameState, onClose }: HandViewProps) {
  // 合并所有卡牌：手牌 + 牌库 + 弃牌堆
  const allCards = [
    ...gameState.hand.map(c => ({ ...c, location: 'hand' })),
    ...gameState.deck.map(c => ({ ...c, location: 'deck' })),
    ...gameState.discard.map(c => ({ ...c, location: 'discard' }))
  ];

  const getCardColor = (type: string) => {
    switch (type) {
      case 'attack': return 'border-red-500/50 bg-red-500/10';
      case 'defense': return 'border-blue-500/50 bg-blue-500/10';
      case 'skill': return 'border-green-500/50 bg-green-500/10';
      case 'special': return 'border-purple-500/50 bg-purple-500/10';
      default: return 'border-slate-500/50 bg-slate-500/10';
    }
  };

  const getCardIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Sword': return <Sparkles className="w-5 h-5 text-red-400" />;
      case 'Shield': return <Shield className="w-5 h-5 text-blue-400" />;
      case 'Zap': return <Zap className="w-5 h-5 text-yellow-400" />;
      default: return <Sparkles className="w-5 h-5 text-slate-400" />;
    }
  };

  const getLocationBadge = (location: string) => {
    switch (location) {
      case 'hand': return <span className="text-xs text-yellow-400">手牌</span>;
      case 'deck': return <span className="text-xs text-blue-400">牌库</span>;
      case 'discard': return <span className="text-xs text-slate-400">弃牌</span>;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="bg-slate-900 border-slate-700 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">我的牌组</h2>
            <span className="text-slate-400 text-sm">共 {allCards.length} 张卡牌</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </Button>
        </div>

        {/* 卡牌统计 */}
        <div className="flex gap-4 px-4 py-2 bg-slate-800/50 text-sm">
          <div className="flex items-center gap-1">
            <Layers className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400">手牌: {gameState.hand.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-blue-400">牌库: {gameState.deck.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">弃牌: {gameState.discard.length}</span>
          </div>
        </div>

        {/* 卡牌列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {allCards.length === 0 ? (
            <div className="text-center text-slate-500 py-10">
              暂无卡牌
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {allCards.map((card: any, index) => (
                <Card
                  key={`${card.id}-${index}`}
                  className={`p-3 cursor-pointer transition-all hover:scale-105 ${getCardColor(card.type)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{card.cost}</span>
                    </div>
                    <div className="w-6 h-6 rounded bg-slate-800/50 flex items-center justify-center">
                      {getCardIcon(card.icon)}
                    </div>
                  </div>
                  <p className="text-white font-bold text-sm mb-1 truncate">{card.name}</p>
                  <p 
                    className="text-slate-300 text-xs leading-tight"
                    dangerouslySetInnerHTML={{ __html: formatCardDescription(card.description) }}
                  />
                  <div className="mt-2 flex justify-between items-center">
                    <span className={`text-xs ${
                      card.rarity === 'epic' ? 'text-purple-400' :
                      card.rarity === 'rare' ? 'text-blue-400' :
                      'text-slate-500'
                    }`}>
                      {card.rarity === 'epic' && '✨ 史诗'}
                      {card.rarity === 'rare' && '💎 稀有'}
                      {card.rarity === 'common' && '⚪ 普通'}
                    </span>
                    {getLocationBadge(card.location)}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 统计信息 */}
        <div className="p-4 border-t border-slate-700 text-center text-slate-400 text-sm">
          共 {allCards.length} 张卡牌
        </div>
      </Card>
    </div>
  );
}
