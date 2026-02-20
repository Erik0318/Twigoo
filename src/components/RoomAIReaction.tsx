import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { getRoomReaction, mockRoomReaction, isAIConfigured } from '@/systems/aiCharacterService';
import { isAIEnabled } from '@/systems/aiSettings';
import type { RoomInfo, AIResponse } from '@/systems/aiCharacterPrompts';
import type { Character } from '@/types/game';

interface RoomAIReactionProps {
  character: Character;
  room: RoomInfo;
  isVisible: boolean;
  onClose?: () => void;
}

export function RoomAIReaction({ character, room, isVisible, onClose }: RoomAIReactionProps) {
  const [reaction, setReaction] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setReaction(null);
      return;
    }

    const fetchReaction = async () => {
      setIsLoading(true);
      try {
        let response: AIResponse;
        
        if (isAIEnabled() && isAIConfigured()) {
          response = await getRoomReaction(character.id, room);
        } else {
          response = await mockRoomReaction(character.id, room.type);
        }
        
        setReaction(response);
      } catch (error) {
        console.error('获取房间反应失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReaction();
  }, [isVisible, character.id, room]);

  if (!isVisible) return null;

  // 房间类型对应的图标
  const roomEmojis: Record<string, string> = {
    combat: '⚔️',
    elite: '👹',
    boss: '👑',
    shop: '🏪',
    rest: '🏕️',
    event: '❓',
    treasure: '💎',
    challenge: '🎯'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
      <Card 
        className="max-w-sm w-full p-6 bg-slate-900 border-slate-700"
        style={{ borderColor: `${character.color}50` }}
      >
        {/* 房间信息 */}
        <div className="text-center mb-4">
          <span className="text-4xl">{roomEmojis[room.type] || '📍'}</span>
          <h3 className="text-lg font-bold text-white mt-2">{room.name}</h3>
          <p className="text-sm text-slate-400">第 {room.floor} 层</p>
        </div>

        {/* 角色反应 */}
        <div 
          className="p-4 rounded-xl mb-4"
          style={{ backgroundColor: `${character.color}15` }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2"
              style={{ borderColor: character.color }}
            >
              <img
                src={character.portrait}
                alt={character.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = 
                    `<div class="w-full h-full flex items-center justify-center text-lg font-bold text-white" style="background-color: ${character.color}">${character.name[0]}</div>`;
                }}
              />
            </div>
            <div>
              <p className="font-bold text-white">{character.name}</p>
              <p className="text-xs text-slate-400">{character.trait}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="h-12 flex items-center justify-center">
              <div className="animate-pulse text-slate-500">思考中...</div>
            </div>
          ) : reaction ? (
            <div>
              <p className="text-slate-200 leading-relaxed text-center">
                「{reaction.dialogue}」
              </p>
              {reaction.emotion && (
                <p className="text-center mt-2 text-xl">
                  {{
                    normal: '',
                    happy: '😊',
                    worried: '😰',
                    excited: '✨',
                    serious: '😐',
                    relaxed: '😌'
                  }[reaction.emotion]}
                </p>
              )}
            </div>
          ) : null}
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
        >
          继续
        </button>
      </Card>
    </div>
  );
}
