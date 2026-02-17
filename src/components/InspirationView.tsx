/**
 * 灵感选择系统 - 让玩家自主选择卡牌
 * 取代原来的自动选择逻辑
 */

import { useState } from 'react';
import type { GameState, Card, InspirationResult } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card as CardUI } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, Check, X, ArrowUp, ArrowDown, Trash2,
  Brain
} from 'lucide-react';
import { formatCardDescription } from '@/data/cards';

interface InspirationViewProps {
  gameState: GameState;
  onComplete: (result: InspirationResult) => void;
  onCancel?: () => void;
}

export function InspirationView({ gameState, onComplete, onCancel }: InspirationViewProps) {
  const inspiration = gameState.inspiration;
  
  if (!inspiration || !inspiration.isActive) return null;

  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [discardedIndices, setDiscardedIndices] = useState<number[]>([]);
  const [cardOrder, setCardOrder] = useState<number[]>(
    inspiration.cards.map((_, i) => i)
  );

  const toggleSelection = (index: number) => {
    const actualIndex = cardOrder[index];
    
    if (selectedIndices.includes(actualIndex)) {
      // 取消选择
      setSelectedIndices(selectedIndices.filter(i => i !== actualIndex));
    } else if (selectedIndices.length < inspiration.selectCount) {
      // 添加选择
      setSelectedIndices([...selectedIndices, actualIndex]);
    }
  };

  const toggleDiscard = (index: number) => {
    if (!inspiration.canDiscard) return;
    
    const actualIndex = cardOrder[index];
    
    if (discardedIndices.includes(actualIndex)) {
      setDiscardedIndices(discardedIndices.filter(i => i !== actualIndex));
    } else {
      setDiscardedIndices([...discardedIndices, actualIndex]);
    }
  };

  const moveCard = (displayIndex: number, direction: 'up' | 'down') => {
    if (!inspiration.canReorder) return;
    
    const newOrder = [...cardOrder];
    if (direction === 'up' && displayIndex > 0) {
      [newOrder[displayIndex], newOrder[displayIndex - 1]] = [newOrder[displayIndex - 1], newOrder[displayIndex]];
    } else if (direction === 'down' && displayIndex < newOrder.length - 1) {
      [newOrder[displayIndex], newOrder[displayIndex + 1]] = [newOrder[displayIndex + 1], newOrder[displayIndex]];
    }
    setCardOrder(newOrder);
  };

  const handleConfirm = () => {
    const selectedCards: Card[] = [];
    const discardedCards: Card[] = [];
    const remainingCards: Card[] = [];

    // 根据选择状态分类卡牌
    cardOrder.forEach((originalIndex) => {
      const card = inspiration.cards[originalIndex];
      
      if (selectedIndices.includes(originalIndex)) {
        selectedCards.push(card);
      } else if (discardedIndices.includes(originalIndex)) {
        discardedCards.push(card);
      } else {
        remainingCards.push(card);
      }
    });

    onComplete({
      selectedCards,
      discardedCards: inspiration.canDiscard ? discardedCards : undefined,
      remainingCards: inspiration.canReorder ? remainingCards : undefined
    });
  };

  const getCardColor = (type: string) => {
    switch (type) {
      case 'attack': return 'border-red-500/60 bg-gradient-to-br from-red-500/20 to-red-600/10';
      case 'defense': return 'border-blue-500/60 bg-gradient-to-br from-blue-500/20 to-blue-600/10';
      case 'skill': return 'border-green-500/60 bg-gradient-to-br from-green-500/20 to-green-600/10';
      case 'special': return 'border-purple-500/60 bg-gradient-to-br from-purple-500/20 to-purple-600/10';
      default: return 'border-slate-500/60 bg-slate-500/10';
    }
  };

  const isSelected = (index: number) => {
    const actualIndex = cardOrder[index];
    return selectedIndices.includes(actualIndex);
  };

  const isDiscarded = (index: number) => {
    const actualIndex = cardOrder[index];
    return discardedIndices.includes(actualIndex);
  };

  const minSelected = inspiration.minSelect ?? inspiration.selectCount;
  const canConfirm = selectedIndices.length >= minSelected && 
                     selectedIndices.length <= inspiration.selectCount;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="max-w-5xl w-full">
        {/* 标题区域 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-purple-500/30 border-2 border-purple-400 flex items-center justify-center animate-pulse">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">{inspiration.title}</h2>
          </div>
          <p className="text-slate-300">{inspiration.description}</p>
          <div className="flex justify-center gap-4 mt-3 text-sm">
            <Badge className="bg-purple-500/20 text-purple-300">
              需要选择: {inspiration.selectCount}张
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-300">
              已选择: {selectedIndices.length}张
            </Badge>
            {inspiration.canDiscard && (
              <Badge className="bg-red-500/20 text-red-300">
                已弃掉: {discardedIndices.length}张
              </Badge>
            )}
          </div>
        </div>

        {/* 卡牌展示区域 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          {cardOrder.map((cardIndex, displayIndex) => {
            const card = inspiration.cards[cardIndex];
            const selected = isSelected(displayIndex);
            const discarded = isDiscarded(displayIndex);
            
            return (
              <div key={`${card.id}-${displayIndex}`} className="relative group">
                {/* 顺序指示器 */}
                {inspiration.canReorder && (
                  <div className="absolute -top-3 -left-3 z-10">
                    <Badge className="bg-slate-700 text-white text-xs">
                      #{displayIndex + 1}
                    </Badge>
                  </div>
                )}
                
                <CardUI 
                  className={`p-3 cursor-pointer transition-all border-2 ${getCardColor(card.type)} ${
                    selected 
                      ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-500/30 transform -translate-y-2' 
                      : discarded
                        ? 'opacity-40 border-red-500/30'
                        : 'hover:transform hover:-translate-y-1 hover:shadow-lg'
                  }`}
                  onClick={() => !discarded && toggleSelection(displayIndex)}
                >
                  {/* 费用和类型 */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{card.cost}</span>
                    </div>
                    <div className="flex gap-1">
                      {card.type === 'attack' && <Sparkles className="w-4 h-4 text-red-400" />}
                      {card.type === 'defense' && <Sparkles className="w-4 h-4 text-blue-400" />}
                      {card.type === 'skill' && <Sparkles className="w-4 h-4 text-green-400" />}
                    </div>
                  </div>
                  
                  {/* 卡牌名称 */}
                  <p className="text-white font-bold text-sm mb-1 truncate">{card.name}</p>
                  
                  {/* 卡牌描述 */}
                  <p 
                    className="text-slate-300 text-xs leading-tight line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: formatCardDescription(card.description) }}
                  />
                  
                  {/* 选中标记 */}
                  {selected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-black" />
                    </div>
                  )}
                  
                  {/* 弃掉标记 */}
                  {discarded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-red-500/80 px-3 py-1 rounded text-white text-sm font-bold">
                        弃掉
                      </div>
                    </div>
                  )}
                </CardUI>

                {/* 操作按钮 */}
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* 重新排序按钮 */}
                  {inspiration.canReorder && displayIndex > 0 && (
                    <button
                      onClick={() => moveCard(displayIndex, 'up')}
                      className="w-7 h-7 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
                    >
                      <ArrowUp className="w-4 h-4 text-white" />
                    </button>
                  )}
                  {inspiration.canReorder && displayIndex < cardOrder.length - 1 && (
                    <button
                      onClick={() => moveCard(displayIndex, 'down')}
                      className="w-7 h-7 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
                    >
                      <ArrowDown className="w-4 h-4 text-white" />
                    </button>
                  )}
                  {/* 弃牌按钮 */}
                  {inspiration.canDiscard && !selected && (
                    <button
                      onClick={() => toggleDiscard(displayIndex)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        discarded 
                          ? 'bg-green-600 hover:bg-green-500' 
                          : 'bg-red-600 hover:bg-red-500'
                      }`}
                    >
                      {discarded ? <Check className="w-4 h-4 text-white" /> : <Trash2 className="w-4 h-4 text-white" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-center gap-4">
          {onCancel && (
            <Button 
              onClick={onCancel}
              variant="outline"
              className="border-slate-600 text-slate-400 hover:bg-slate-800 px-6"
            >
              <X className="w-4 h-4 mr-2" />
              取消
            </Button>
          )}
          <Button 
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 disabled:from-slate-700 disabled:to-slate-600 px-8"
          >
            <Check className="w-4 h-4 mr-2" />
            确认选择 ({selectedIndices.length}/{inspiration.selectCount})
          </Button>
        </div>

        {/* 提示信息 */}
        <div className="text-center mt-4 text-slate-500 text-sm">
          <p>💡 点击卡牌选择，{inspiration.canDiscard && '点击垃圾桶图标弃牌，'}{inspiration.canReorder && '使用箭头调整顺序，'}选好后点击确认</p>
        </div>
      </div>
    </div>
  );
}
