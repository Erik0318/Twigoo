import { useState } from 'react';
import type { GameState } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Cpu, MemoryStick, Zap, Box, Coins, 
  ShoppingCart, ArrowLeft, Trash2, Monitor
} from 'lucide-react';
import { getCardPrice, commonCards, rareCards, formatCardDescription } from '@/data/cards';
import { getRandomHardware, type CPU, type Motherboard, type RamStick, type GPU, type PSU } from '@/data/hardware';
import { RoomAIAdvice } from './RoomAIAdvice';

interface PCShopViewProps {
  gameState: GameState;
  onBuyMotherboard: (mobo: Motherboard) => void;
  onBuyCPU: (cpu: CPU) => void;
  onBuyRAM: (ram: RamStick) => void;
  onSellRAM: (index: number) => void;
  onBuyGPU: (gpu: GPU) => void;
  onSellGPU: () => void;
  onBuyPSU: (psu: PSU) => void;
  onBuyCard: (card: any) => void;
  onBuyRemoveCard: () => void;
  onLeave: () => void;
}

export function PCShopView({ 
  gameState, 
  onBuyMotherboard, onBuyCPU, onBuyRAM,
  onBuyGPU, onBuyPSU,
  onBuyCard, onBuyRemoveCard, onLeave 
}: PCShopViewProps) {
  
  // 生成商店物品 - 1个硬件 + 3张卡牌
  const [shopHardware] = useState(() => getRandomHardware(gameState.currentFloor));
  
  // 生成3张卡牌：2张普通 + 1张稀有，附带购买状态
  const [shopCards, setShopCards] = useState(() => {
    const cards = [];
    // 2张普通卡（不重复）
    const usedCommonIndices = new Set<number>();
    while (cards.length < 2) {
      const idx = Math.floor(Math.random() * commonCards.length);
      if (!usedCommonIndices.has(idx)) {
        usedCommonIndices.add(idx);
        cards.push({ ...commonCards[idx], shopId: `common-${idx}` });
      }
    }
    // 1张稀有卡
    const rareIdx = Math.floor(Math.random() * rareCards.length);
    cards.push({ ...rareCards[rareIdx], shopId: `rare-${rareIdx}` });
    return cards.map(c => ({ ...c, purchased: false }));
  });
  
  // 处理购买卡牌
  const handleBuyCard = (card: any, index: number) => {
    onBuyCard(card);
    setShopCards(prev => prev.map((c, i) => i === index ? { ...c, purchased: true } : c));
  };

  const priceMultiplier = gameState.characters[0]?.id === 'anon' ? 0.8 : 1;
  
  // 删卡服务价格
  const removeCardPrice = Math.floor((50 + gameState.deck.length * 5) * priceMultiplier);

  const getCardColor = (type: string) => {
    switch (type) {
      case 'attack': return 'border-red-500/50 bg-gradient-to-br from-red-500/10 to-red-600/5';
      case 'defense': return 'border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-blue-600/5';
      case 'skill': return 'border-green-500/50 bg-gradient-to-br from-green-500/10 to-green-600/5';
      default: return 'border-slate-500/50 bg-slate-500/10';
    }
  };

  // 渲染单个硬件
  const renderHardware = () => {
    const hw = shopHardware;
    const isCPU = 'basePower' in hw;
    const isMotherboard = 'ramSlots' in hw && !('basePower' in hw);
    const isRAM = 'energy' in hw;
    const isGPU = 'vram' in hw;
    const isPSU = 'wattage' in hw;

    return (
      <Card className="bg-slate-800/80 border-slate-700 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isCPU && <Cpu className="w-5 h-5 text-cyan-400" />}
              {isMotherboard && <Box className="w-5 h-5 text-blue-400" />}
              {isRAM && <MemoryStick className="w-5 h-5 text-green-400" />}
              {isGPU && <Zap className="w-5 h-5 text-purple-400" />}
              {isPSU && <Zap className="w-5 h-5 text-yellow-400" />}
              <h3 className="text-white font-bold">{hw.name}</h3>
            </div>
            <p className="text-slate-400 text-sm">{hw.description}</p>
            
            {isCPU && (
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">算力: {(hw as CPU).basePower}</Badge>
                <Badge variant="outline">{(hw as CPU).socket}</Badge>
              </div>
            )}
            {isMotherboard && (
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{(hw as Motherboard).ramSlots}内存槽</Badge>
                <Badge variant="outline">{(hw as Motherboard).ramType}</Badge>
              </div>
            )}
            {isRAM && (
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">能量: +{(hw as RamStick).energy}</Badge>
                <Badge variant="outline">{(hw as RamStick).type}</Badge>
              </div>
            )}
            {isGPU && (
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">伤害: +{(hw as GPU).damage}</Badge>
                <Badge variant="outline">{(hw as GPU).vram}GB显存</Badge>
              </div>
            )}
            {isPSU && (
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{(hw as PSU).wattage}W</Badge>
                <Badge variant="outline">{(hw as PSU).efficiency}</Badge>
              </div>
            )}
          </div>
          <Button
            onClick={() => {
              if (isCPU) onBuyCPU(hw as CPU);
              else if (isMotherboard) onBuyMotherboard(hw as Motherboard);
              else if (isRAM) onBuyRAM(hw as RamStick);
              else if (isGPU) onBuyGPU(hw as GPU);
              else if (isPSU) onBuyPSU(hw as PSU);
            }}
            disabled={gameState.money < Math.floor(hw.price * priceMultiplier)}
            className="bg-gradient-to-r from-green-600 to-green-500"
          >
            <Coins className="w-4 h-4 mr-1" />
            {Math.floor(hw.price * priceMultiplier)}
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white font-mono flex items-center gap-2">
              <ShoppingCart className="w-8 h-8 text-yellow-400" />
              PC硬件商店
            </h2>
            <p className="text-slate-400 mt-1">升级你的战斗工作站</p>
          </div>
          <div className="flex items-center gap-4">
            <Card className="bg-slate-800/80 border-slate-700 px-4 py-2 flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-white font-bold text-lg">{gameState.money}</span>
            </Card>
            <Button onClick={onLeave} variant="outline" className="border-slate-600 hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              离开
            </Button>
          </div>
        </div>

        {/* 当前配置 */}
        <Card className="bg-slate-800/80 border-slate-700 p-4 mb-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-cyan-400" />
            当前配置
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-slate-400 text-xs">CPU</div>
              <div className="text-white text-sm truncate">{gameState.hardware.cpu?.name || '无'}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-slate-400 text-xs">主板</div>
              <div className="text-white text-sm truncate">{gameState.hardware.motherboard?.name || '无'}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-slate-400 text-xs">内存</div>
              <div className="text-white text-sm">{gameState.hardware.ramSticks.reduce((a: number, b: {energy: number}) => a + b.energy, 0)}能量</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-slate-400 text-xs">显卡</div>
              <div className="text-white text-sm">{gameState.hardware.gpu?.name || '核显'}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-slate-400 text-xs">电源</div>
              <div className="text-white text-sm">{gameState.hardware.psu?.name || '无'}</div>
            </div>
          </div>
        </Card>

        {/* 今日特供硬件 */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            今日特供硬件
          </h3>
          {renderHardware()}
        </div>

        {/* 卡牌商店 */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-green-400" />
            卡牌商店
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {shopCards.map((card, index) => {
              const price = Math.floor(getCardPrice(card) * priceMultiplier);
              const canAfford = gameState.money >= price;
              const isPurchased = (card as any).purchased;
              
              return (
                <Card key={`${card.id}-${index}`} className={`p-4 ${getCardColor(card.type)} border ${isPurchased ? 'opacity-50' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                      <span className="text-white font-bold">{card.cost}</span>
                    </div>
                    <Badge variant="outline" className={
                      card.rarity === 'rare' ? 'text-blue-400 border-blue-400' : 'text-gray-400 border-gray-400'
                    }>
                      {card.rarity}
                    </Badge>
                  </div>
                  <p className="text-white font-bold mb-1">{card.name}</p>
                  <p 
                    className="text-slate-300 text-xs mb-3"
                    dangerouslySetInnerHTML={{ __html: formatCardDescription(card.description) }}
                  />
                  <Button
                    onClick={() => handleBuyCard(card, index)}
                    disabled={!canAfford || isPurchased}
                    className="w-full bg-gradient-to-r from-green-600 to-green-500 disabled:opacity-50"
                    size="sm"
                  >
                    <Coins className="w-4 h-4 mr-1" />
                    {isPurchased ? '已购买' : price}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 删卡服务 */}
        <Card className="bg-slate-800/80 border-slate-700 p-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Trash2 className="w-7 h-7 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">删除卡牌</h3>
              <p className="text-slate-400 text-sm">从牌库中移除1张卡牌</p>
              <p className="text-slate-500 text-xs mt-1">牌库需大于5张</p>
            </div>
            <Button
              onClick={onBuyRemoveCard}
              disabled={gameState.money < removeCardPrice || gameState.deck.length <= 5}
              className="bg-gradient-to-r from-red-600 to-red-500 disabled:opacity-50"
            >
              <Coins className="w-4 h-4 mr-1" />
              {removeCardPrice}
            </Button>
          </div>
        </Card>
      </div>
      
      {/* AI角色建议 */}
      {gameState.characters[0] && (
        <RoomAIAdvice
          character={gameState.characters[0]}
          roomType="shop"
          shopContext={{
            money: gameState.money,
            items: [
              { name: shopHardware.name, price: Math.floor(shopHardware.price * priceMultiplier), type: 'hardware' },
              ...shopCards.filter(c => !(c as any).purchased).map(c => ({
                name: c.name,
                price: Math.floor(getCardPrice(c) * priceMultiplier),
                type: 'card'
              })),
              { name: '删卡服务', price: removeCardPrice, type: 'service' }
            ]
          }}
        />
      )}
    </div>
  );
}
