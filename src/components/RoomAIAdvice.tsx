/**
 * 房间内AI建议组件
 * 根据房间内的具体信息向玩家提供建议
 */

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  getShopReaction, 
  getRestReaction, 
  getEventReaction, 
  mockRoomReaction,
  isAIConfigured 
} from '@/systems/aiCharacterService';
import { isAIEnabled } from '@/systems/aiSettings';
import type { AIResponse } from '@/systems/aiCharacterPrompts';
import type { Character } from '@/types/game';
import { Lightbulb, X, Loader2 } from 'lucide-react';

interface RoomAIAdviceProps {
  character: Character;
  roomType: 'shop' | 'rest' | 'event' | 'challenge' | 'cardExchange';
  // 商店相关信息
  shopContext?: {
    money: number;
    items: Array<{ name: string; price: number; type: string }>;
  };
  // 休息区信息
  restContext?: {
    currentHealth: number;
    maxHealth: number;
    canRest: boolean;
  };
  // 事件信息
  eventContext?: {
    eventName: string;
    category: string;
  };
}

export function RoomAIAdvice({ character, roomType, shopContext, restContext, eventContext }: RoomAIAdviceProps) {
  const [reaction, setReaction] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchReaction = async () => {
      setIsLoading(true);
      try {
        let response: AIResponse;
        const useAI = isAIEnabled() && isAIConfigured();

        switch (roomType) {
          case 'shop':
            if (useAI && shopContext) {
              const itemTypes = shopContext.items.map(i => i.type);
              response = await getShopReaction(character.id, shopContext.money, itemTypes);
            } else {
              response = await mockRoomReaction(character.id, 'shop');
            }
            break;
          case 'rest':
            if (useAI && restContext) {
              response = await getRestReaction(character.id, restContext.currentHealth, restContext.maxHealth);
            } else {
              response = await mockRoomReaction(character.id, 'rest');
            }
            break;
          case 'event':
            if (useAI && eventContext) {
              response = await getEventReaction(
                character.id, 
                eventContext.eventName, 
                `一个${eventContext.category}类型的事件`,
                ['选项1', '选项2']
              );
            } else {
              response = await mockRoomReaction(character.id, 'event');
            }
            break;
          case 'challenge':
            response = await mockRoomReaction(character.id, 'treasure');
            break;
          case 'cardExchange':
            response = await mockRoomReaction(character.id, 'shop');
            break;
          default:
            response = {
              dialogue: '...这里是什么呢？',
              emotion: 'normal',
              thought: '观察一下周围的情况吧'
            };
        }

        setReaction(response);
      } catch (error) {
        console.error('获取AI建议失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReaction();
  }, [character.id, roomType, shopContext, restContext, eventContext]);

  if (!isVisible) return null;

  // 情绪表情
  const emotionEmojis: Record<string, string> = {
    normal: '',
    happy: '😊',
    worried: '😰',
    excited: '✨',
    serious: '😐',
    relaxed: '😌'
  };

  if (isCollapsed) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsCollapsed(false)}
        className="fixed bottom-4 left-4 z-30 border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
        style={{ borderColor: `${character.color}50` }}
      >
        <Lightbulb className="w-4 h-4 mr-2" />
        查看{character.name}的建议
      </Button>
    );
  }

  return (
    <Card 
      className="fixed bottom-4 left-4 z-30 max-w-sm w-full bg-slate-900/95 border-slate-700 shadow-xl"
      style={{ borderColor: `${character.color}40` }}
    >
      {/* 头部 */}
      <div 
        className="flex items-center justify-between p-3 border-b border-slate-700"
        style={{ backgroundColor: `${character.color}10` }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full overflow-hidden border-2"
            style={{ borderColor: character.color }}
          >
            <img
              src={character.portrait}
              alt={character.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = 
                  `<div class="w-full h-full flex items-center justify-center text-xs font-bold text-white" style="background-color: ${character.color}">${character.name[0]}</div>`;
              }}
            />
          </div>
          <div>
            <span className="text-sm font-bold text-white">{character.name}</span>
            {reaction?.emotion && (
              <span className="ml-1">{emotionEmojis[reaction.emotion]}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCollapsed(true)}
            className="text-slate-400 hover:text-white h-8 w-8 p-0"
          >
            <span className="text-xs">─</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsVisible(false)}
            className="text-slate-400 hover:text-white h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 内容 */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">思考中...</span>
          </div>
        ) : reaction ? (
          <div className="space-y-3">
            {/* 角色台词 */}
            <p className="text-slate-200 text-sm leading-relaxed">
              「{reaction.dialogue}」
            </p>
            
            {/* 建议 */}
            {reaction.thought && (
              <div className="pt-3 border-t border-slate-700">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-300 text-sm">{reaction.thought}</p>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
