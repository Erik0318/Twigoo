import type { Floor, GameState, Room } from '@/types/game';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sword, ShoppingCart, HelpCircle, Coffee, Crown, Check, Skull, Lock, Layers, 
  Gem, RefreshCw, Sparkles, Star
} from 'lucide-react';

interface MapViewProps {
  floor: Floor;
  currentRoomId: string;
  onEnterRoom: (roomId: string) => void;
  onNextFloor: () => void;
  gameState: GameState;
  onShowHand: () => void;
  onOpenTalentTree?: () => void;
}

const roomIcons: Record<string, React.ReactNode> = {
  combat: <Sword className="w-5 h-5" />,
  elite: <Skull className="w-5 h-5" />,
  shop: <ShoppingCart className="w-5 h-5" />,
  event: <HelpCircle className="w-5 h-5" />,
  rest: <Coffee className="w-5 h-5" />,
  boss: <Crown className="w-5 h-5" />,
  challenge: <Sparkles className="w-5 h-5" />,
  treasure: <Gem className="w-5 h-5" />,
  cardExchange: <RefreshCw className="w-5 h-5" />
};

const roomColors: Record<string, string> = {
  combat: 'bg-red-500/20 border-red-500/50 text-red-400',
  elite: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
  shop: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
  event: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
  rest: 'bg-green-500/20 border-green-500/50 text-green-400',
  boss: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
  challenge: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400',
  treasure: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
  cardExchange: 'bg-pink-500/20 border-pink-500/50 text-pink-400'
};

const roomTypeNames: Record<string, string> = {
  combat: '战斗',
  elite: '精英',
  shop: '商店',
  event: '事件',
  rest: '休息',
  boss: 'Boss',
  challenge: '挑战',
  treasure: '宝藏',
  cardExchange: '换牌'
};

export function MapView({ floor, currentRoomId, onEnterRoom, onNextFloor, gameState, onShowHand, onOpenTalentTree }: MapViewProps) {
  const talentPoints = gameState.talentPoints || 0;
  const hasTalentPoints = talentPoints > 0;
  // 获取当前房间
  const currentRoom = floor.rooms.find(r => r.id === currentRoomId);
  const allCleared = floor.rooms.every(r => r.cleared);

  // 按tier分组房间
  const roomsByTier = floor.rooms.reduce<Record<number, Room[]>>((acc, room) => {
    const tier = room.tier ?? 0;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(room);
    return acc;
  }, {});
  
  const tiers = Object.keys(roomsByTier).map(Number).sort((a, b) => a - b);

  // 获取可进入的房间
  const getNextRooms = (): Room[] => {
    if (!currentRoom) return [];
    return floor.rooms.filter(r => currentRoom.connections.includes(r.id));
  };
  const nextRooms = getNextRooms();

  // 获取当前房间的tier
  const currentTier = currentRoom?.tier ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 overflow-x-auto">
      <div className="min-w-max">
        {/* 楼层标题 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 rounded-full mb-4">
            <span className="text-slate-400 text-sm">当前位置</span>
            <span className="text-white font-bold">第 {floor.id} 层 - {floor.name}</span>
          </div>
          {/* 进度条 */}
          <div className="flex justify-center gap-1">
            {tiers.map((t) => (
              <div 
                key={t} 
                className={`h-1.5 rounded-full transition-all ${
                  t < currentTier ? 'bg-green-500 w-8' : 
                  t === currentTier ? 'bg-blue-500 w-12' : 'bg-slate-700 w-6'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 查看手牌按钮和天赋树按钮 */}
        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          <Button 
            onClick={onShowHand}
            variant="outline"
            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
          >
            <Layers className="w-4 h-4 mr-2" />
            查看卡牌 (手牌:{gameState.hand.length} 牌库:{gameState.deck.length} 弃牌:{gameState.discard.length})
          </Button>
          
          {onOpenTalentTree && (
            <Button 
              onClick={onOpenTalentTree}
              variant="outline"
              className={`relative ${
                hasTalentPoints 
                  ? 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 animate-pulse' 
                  : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <Star className="w-4 h-4 mr-2" />
              天赋树
              {hasTalentPoints && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-slate-900 text-xs font-bold rounded-full">
                  {talentPoints}点
                </span>
              )}
            </Button>
          )}
        </div>

        {/* 分支地图 - 横向列布局 */}
        <div className="flex justify-center gap-4 px-4">
          {tiers.map((tier) => {
            const tierRooms = roomsByTier[tier] || [];
            const isCurrentTier = tier === currentTier;
            const isNextTier = tier === currentTier + 1;
            const isPastTier = tier < currentTier;
            
            return (
              <div key={tier} className="flex flex-col gap-3 min-w-[200px]">
                {/* 列标题 */}
                <div className="text-center mb-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isCurrentTier ? 'bg-blue-500/30 text-blue-400' :
                    isNextTier ? 'bg-yellow-500/30 text-yellow-400' :
                    isPastTier ? 'bg-green-500/30 text-green-400' :
                    'bg-slate-700/50 text-slate-500'
                  }`}>
                    {isPastTier ? '✓' : isCurrentTier ? '当前' : isNextTier ? '可选' : `第${tier + 1}列`}
                  </span>
                </div>
                
                {/* 房间卡片 */}
                {tierRooms.map((room) => {
                  const isCurrent = room.id === currentRoomId;
                  const isCleared = room.cleared;
                  const isNext = nextRooms.some(n => n.id === room.id);
                  const canEnter = isCurrent || (isNext && currentRoom?.cleared);
                  
                  return (
                    <Card
                      key={room.id}
                      className={`p-3 transition-all cursor-pointer ${
                        isCurrent 
                          ? 'ring-2 ring-blue-400 bg-slate-800 shadow-lg shadow-blue-500/20' 
                          : isCleared
                            ? 'bg-slate-800/50 opacity-60'
                            : canEnter
                              ? 'bg-slate-800 hover:bg-slate-700 border-yellow-500/30'
                              : 'bg-slate-800/30 opacity-40 cursor-not-allowed'
                      }`}
                      onClick={() => canEnter && onEnterRoom(room.id)}
                    >
                      <div className="flex items-center gap-3">
                        {/* 房间图标 */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isCleared 
                            ? 'bg-green-500/20 text-green-400' 
                            : isCurrent
                              ? 'bg-blue-500/20 text-blue-400'
                              : roomColors[room.type]
                        }`}>
                          {isCleared ? <Check className="w-5 h-5" /> : 
                           !canEnter && !isCurrent ? <Lock className="w-4 h-4 text-slate-500" /> :
                           roomIcons[room.type]}
                        </div>
                        
                        {/* 房间信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-white text-sm font-medium truncate">{room.name.split(' #')[0]}</span>
                          </div>
                          <Badge 
                            className={`text-xs ${
                              room.type === 'elite' ? 'bg-purple-500' :
                              room.type === 'boss' ? 'bg-red-500' :
                              room.type === 'shop' ? 'bg-yellow-500' :
                              'bg-slate-600'
                            }`}
                          >
                            {roomTypeNames[room.type]}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* 状态标签 */}
                      <div className="mt-2 text-center">
                        {isCurrent && (
                          <span className="text-blue-400 text-xs">当前</span>
                        )}
                        {isCleared && !isCurrent && (
                          <span className="text-green-400 text-xs">已完成</span>
                        )}
                        {isNext && !isCleared && (
                          <span className="text-yellow-400 text-xs">点击进入</span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* 下一层按钮 */}
        {allCleared && (
          <div className="text-center mt-8">
            <Button 
              onClick={onNextFloor}
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-10 py-6 text-lg shadow-lg shadow-green-500/20"
            >
              {floor.id >= 3 ? '🎉 通关游戏' : '→ 进入下一层'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
