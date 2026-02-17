/**
 * 战斗奖励选择界面
 * 玩家从3张卡牌中选择1张加入牌组
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Card as CardType } from '@/types/game';
import { Badge } from '@/components/ui/badge';
import { Shield, Zap, Heart, Sword } from 'lucide-react';
import { formatCardDescription } from '@/data/cards';

interface RewardViewProps {
  cards: CardType[];
  onSelect: (cardIndex: number) => void;
  onSkip: () => void;
}

export function RewardView({ cards, onSelect, onSkip }: RewardViewProps) {
  // 获取卡牌颜色
  const getCardColor = (type: string) => {
    switch (type) {
      case 'attack':
        return 'from-red-900/80 to-red-700/60 border-red-500/50';
      case 'defense':
        return 'from-blue-900/80 to-blue-700/60 border-blue-500/50';
      case 'skill':
        return 'from-purple-900/80 to-purple-700/60 border-purple-500/50';
      case 'special':
        return 'from-amber-900/80 to-amber-700/60 border-amber-500/50';
      case 'curse':
        return 'from-slate-900/80 to-slate-800/60 border-slate-600/50';
      default:
        return 'from-slate-800/80 to-slate-700/60 border-slate-500/50';
    }
  };

  // 获取卡牌类型图标
  const getCardIcon = (type: string) => {
    switch (type) {
      case 'attack':
        return <Sword className="w-5 h-5" />;
      case 'defense':
        return <Shield className="w-5 h-5" />;
      case 'skill':
        return <Zap className="w-5 h-5" />;
      case 'special':
        return <Heart className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  // 获取稀有度颜色
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-slate-500';
      case 'rare':
        return 'bg-blue-500';
      case 'epic':
        return 'bg-purple-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-amber-900/20 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* 标题 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-amber-400 mb-2">战斗胜利!</h1>
        <p className="text-slate-400">选择一张卡牌加入你的牌组</p>
      </div>

      {/* 卡牌选择区域 */}
      <div className="flex flex-wrap justify-center gap-6 mb-8">
        {cards.map((card, index) => (
          <Card
            key={`${card.id}-${index}`}
            className={`
              w-48 h-72 bg-gradient-to-br ${getCardColor(card.type)}
              border-2 hover:border-amber-400 cursor-pointer
              transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20
              flex flex-col p-3
            `}
            onClick={() => onSelect(index)}
          >
            {/* 稀有度标识 */}
            <div className={`w-8 h-2 rounded-full ${getRarityColor(card.rarity)} mb-2`} />

            {/* 卡牌图标 */}
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-lg bg-black/30 flex items-center justify-center text-white">
                {getCardIcon(card.type)}
              </div>
            </div>

            {/* 卡牌名称 */}
            <h3 className="text-white font-bold text-center text-sm mb-2 truncate">
              {card.name}
            </h3>

            {/* 卡牌费用 */}
            <div className="flex justify-center mb-2">
              <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                费用: {card.cost}
              </Badge>
            </div>

            {/* 卡牌效果 */}
            <p 
              className="text-slate-300 text-xs text-center flex-1 line-clamp-4"
              dangerouslySetInnerHTML={{ __html: formatCardDescription(card.description) }}
            />

            {/* 类型标识 */}
            <div className="mt-2 text-center">
              <Badge className={`text-xs ${getRarityColor(card.rarity)} text-white`}>
                {card.type}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* 跳过按钮 */}
      <Button
        variant="outline"
        onClick={onSkip}
        className="border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-white"
      >
        跳过本次奖励
      </Button>

      {/* 提示 */}
      <p className="text-slate-500 text-sm mt-4">
        点击卡牌将其加入牌组
      </p>
    </div>
  );
}
