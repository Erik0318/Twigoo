/**
 * 应用程序主组件
 * 负责管理游戏流程、场景切换、音效播放
 * 根据gamePhase渲染不同的游戏界面
 */

import { useGameState } from '@/hooks/useGameState';
import { useAudio } from '@/hooks/useAudio';
import { MainMenu } from '@/components/MainMenu';
import { CharacterSelect } from '@/components/CharacterSelect';
import { MapView } from '@/components/MapView';
import { CombatView } from '@/components/CombatView';
import { PCShopView } from '@/components/PCShopView';
import { RestView } from '@/components/RestView';
import { EventView } from '@/components/EventView';
import { ChallengeView } from '@/components/ChallengeView';
import { CardExchangeView } from '@/components/CardExchangeView';
import { RewardView } from '@/components/RewardView';
import { HandView } from '@/components/HandView';
import { getRandomChallenge, getRandomExchangeOptions } from '@/data/specialRooms';
import { getCombatRewardCards } from '@/data/cards';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { GameOver } from '@/components/GameOver';
import { TutorialView } from '@/components/TutorialView';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Gift, Sparkles, Trash2, RefreshCw, Swords, Shield, Zap } from 'lucide-react';

function App() {
  // ==================== 游戏状态管理 ====================
  const [showHandView, setShowHandView] = useState(false);
  const {
    gameState,           // 当前游戏状态
    setGameState,        // 设置游戏状态
    startNewGame,        // 开始新游戏
    selectCharacter,     // 选择角色
    enterRoom,           // 进入房间
    returnToMap,         // 返回地图
    playCard,            // 打出卡牌
    endTurn,             // 结束回合
    // 硬件购买函数
    buyMotherboard,
    buyCPU,
    buyRAM,
    sellRAM,
    buyGPU,
    sellGPU,
    buyPSU,
    buyCard,             // 购买卡牌
    buyRemoveCard,
    rest,                // 休息
    nextFloor,           // 下一层
    returnToMenu,        // 返回主菜单
    completeTutorial,    // 完成教程
    skipTutorial,         // 跳过教程
    selectReward,        // 选择奖励卡牌
    skipReward,           // 跳过奖励
    completeInspiration, // 完成灵感选择
  } = useGameState();

  // ==================== 音频管理 ====================
  const { playBGM, stopBGM, playSFX, updateVolumes } = useAudio();
  
  // 使用ref追踪当前BGM类型，避免重复播放
  const currentBgmRef = useRef<string | null>(null);

  /**
   * 根据游戏阶段播放对应BGM
   * 使用ref确保同类型BGM不会重复从头播放
   */
  useEffect(() => {
    let bgmType: 'menu' | 'combat' | 'boss' | null = null;
    
    switch (gameState.gamePhase) {
      case 'menu':
      case 'character_select':
      case 'map':
        bgmType = 'menu';
        break;
      case 'combat':
        // Boss战使用特殊BGM
        if (gameState.currentRoom?.type === 'boss') {
          bgmType = 'boss';
        } else {
          bgmType = 'combat';
        }
        break;
      case 'shop':
      case 'rest':
      case 'event':
        // 这些场景保持当前BGM不变
        bgmType = currentBgmRef.current as 'menu' | 'combat' | 'boss' || 'menu';
        break;
    }
    
    // 只有BGM类型变化时才播放新BGM
    if (bgmType && bgmType !== currentBgmRef.current) {
      playBGM(bgmType);
      currentBgmRef.current = bgmType;
    }
  }, [gameState.gamePhase, gameState.currentRoom?.type, playBGM]);

  // ==================== 事件处理函数 ====================

  /**
   * 开始游戏 - 进入角色选择界面
   */
  const handleStartGame = useCallback(() => {
    // 重置游戏状态并进入角色选择
    startNewGame();
    setGameState(prev => ({ ...prev, gamePhase: 'character_select' }));
  }, [startNewGame, setGameState]);

  /**
   * 返回主菜单
   */
  const handleBackToMenu = useCallback(() => {
    stopBGM();
    currentBgmRef.current = null;
    returnToMenu();
  }, [returnToMenu, stopBGM]);

  /**
   * 选择角色
   */
  const handleSelectCharacter = useCallback((characterId: string) => {
    playSFX('buttonClick');
    selectCharacter(characterId);
  }, [selectCharacter, playSFX]);

  /**
   * 进入房间
   */
  const handleEnterRoom = useCallback((roomId: string) => {
    playSFX('buttonClick');
    enterRoom(roomId);
  }, [enterRoom, playSFX]);

  /**
   * 进入下一层
   */
  const handleNextFloor = useCallback(() => {
    playSFX('buttonClick');
    nextFloor();
  }, [nextFloor, playSFX]);

  /**
   * 离开商店/休息区/事件 - 返回地图
   */
  const handleLeave = useCallback(() => {
    playSFX('buttonClick');
    returnToMap();
  }, [returnToMap, playSFX]);

  /**
   * 选择奖励卡牌 - 带提示
   */
  const handleSelectReward = useCallback((cardIndex: number) => {
    const rewardCards = gameState.rewardCards || [];
    if (cardIndex >= 0 && cardIndex < rewardCards.length) {
      const selectedCard = rewardCards[cardIndex];
      const icon = selectedCard.type === 'attack' ? <Swords className="w-4 h-4" /> :
                   selectedCard.type === 'defense' ? <Shield className="w-4 h-4" /> :
                   <Zap className="w-4 h-4" />;
      
      toast.success(
        <div className="flex items-center gap-2">
          {icon}
          <span>获得卡牌: <strong>{selectedCard.name}</strong></span>
        </div>,
        { description: `${selectedCard.description}` }
      );
      playSFX('buttonClick');
    }
    selectReward(cardIndex);
  }, [selectReward, gameState.rewardCards, playSFX]);

  /**
   * 跳过奖励 - 带提示
   */
  const handleSkipReward = useCallback(() => {
    toast.info('跳过了本次奖励');
    skipReward();
  }, [skipReward]);

  /**
   * 硬件购买处理函数
   */
  const handleBuyMotherboard = useCallback((mobo: any) => {
    playSFX('money');
    buyMotherboard(mobo);
    toast.success(`🛒 购买成功！`, { description: `主板: ${mobo.name}` });
  }, [buyMotherboard, playSFX]);

  const handleBuyCPU = useCallback((cpu: any) => {
    playSFX('money');
    buyCPU(cpu);
    toast.success(`🛒 购买成功！`, { description: `CPU: ${cpu.name}` });
  }, [buyCPU, playSFX]);

  const handleBuyRAM = useCallback((ram: any) => {
    playSFX('money');
    buyRAM(ram);
    toast.success(`🛒 购买成功！`, { description: `内存: ${ram.name}` });
  }, [buyRAM, playSFX]);

  const handleSellRAM = useCallback((index: number) => {
    playSFX('money');
    sellRAM(index);
    toast.success(`💰 出售成功！`);
  }, [sellRAM, playSFX]);

  const handleBuyGPU = useCallback((gpu: any) => {
    playSFX('money');
    buyGPU(gpu);
    toast.success(`🛒 购买成功！`, { description: `显卡: ${gpu.name}` });
  }, [buyGPU, playSFX]);

  const handleSellGPU = useCallback(() => {
    playSFX('money');
    sellGPU();
    toast.success(`💰 出售成功！`);
  }, [sellGPU, playSFX]);

  const handleBuyPSU = useCallback((psu: any) => {
    playSFX('money');
    buyPSU(psu);
    toast.success(`🛒 购买成功！`, { description: `电源: ${psu.name}` });
  }, [buyPSU, playSFX]);

  /**
   * 完成新手教程
   */
  const handleCompleteTutorial = useCallback(() => {
    playSFX('buttonClick');
    completeTutorial();
  }, [completeTutorial, playSFX]);

  /**
   * 跳过新手教程
   */
  const handleSkipTutorial = useCallback(() => {
    playSFX('buttonClick');
    skipTutorial();
  }, [skipTutorial, playSFX]);

  /**
   * 购买卡牌
   */
  const handleBuyCard = useCallback((card: any) => {
    playSFX('money');
    buyCard(card);
    toast.success(`🛒 购买成功！`, {
      description: `获得卡牌: ${card.name}`
    });
  }, [buyCard, playSFX]);

  /**
   * 购买删卡服务
   */
  const handleBuyRemoveCard = useCallback(() => {
    playSFX('buttonClick');
    buyRemoveCard();
    toast.success(`🗑️ 删卡服务已使用`);
  }, [buyRemoveCard, playSFX]);

  /**
   * 休息
   */
  const handleRest = useCallback(() => {
    playSFX('heal');
    rest();
  }, [rest, playSFX]);

  /**
   * 处理音量变化
   */
  const handleVolumeChange = useCallback((bgmVolume: number, sfxVolume: number) => {
    updateVolumes(bgmVolume, sfxVolume);
  }, [updateVolumes]);

  // ==================== 场景渲染 ====================

  /**
   * 根据游戏阶段渲染对应界面
   */
  const renderCurrentView = () => {
    switch (gameState.gamePhase) {
      // ---------- 主菜单 ----------
      case 'menu':
        return (
          <MainMenu 
            onStartGame={handleStartGame} 
            onPlayBGM={() => playBGM('menu')} 
            onVolumeChange={handleVolumeChange}
          />
        );
      
      // ---------- 角色选择 ----------
      case 'character_select':
        return (
          <CharacterSelect 
            onSelect={handleSelectCharacter}
            onBack={handleBackToMenu}
          />
        );
      
      // ---------- 地图 ----------
      case 'map': {
        const currentFloor = gameState.floors[gameState.currentFloor];
        if (!currentFloor) {
          return (
            <MainMenu 
              onStartGame={handleStartGame} 
              onPlayBGM={() => playBGM('menu')} 
              onVolumeChange={handleVolumeChange}
            />
          );
        }
        return (
          <MapView
            floor={currentFloor}
            currentRoomId={currentFloor.currentRoomId}
            onEnterRoom={handleEnterRoom}
            onNextFloor={handleNextFloor}
            gameState={gameState}
            onShowHand={() => setShowHandView(true)}
          />
        );
      }
      
      // ---------- 新手教程 ----------
      case 'tutorial':
        return (
          <TutorialView
            gameState={gameState}
            onComplete={handleCompleteTutorial}
            onSkip={handleSkipTutorial}
          />
        );
      
      // ---------- 战斗 ----------
      case 'combat':
        return (
          <CombatView
            gameState={gameState}
            onPlayCard={playCard}
            onEndTurn={endTurn}
            onPlaySFX={playSFX}
            onCompleteInspiration={completeInspiration}
          />
        );
      
      // ---------- 商店 ----------
      case 'shop':
        return (
          <PCShopView
            gameState={gameState}
            onBuyMotherboard={handleBuyMotherboard}
            onBuyCPU={handleBuyCPU}
            onBuyRAM={handleBuyRAM}
            onSellRAM={handleSellRAM}
            onBuyGPU={handleBuyGPU}
            onSellGPU={handleSellGPU}
            onBuyPSU={handleBuyPSU}
            onBuyCard={handleBuyCard}
            onBuyRemoveCard={handleBuyRemoveCard}
            onLeave={handleLeave}
          />
        );
      
      // ---------- 休息区 ----------
      case 'rest':
        return (
          <RestView
            character={gameState.characters[0]}
            onRest={handleRest}
            onLeave={handleLeave}
          />
        );
      
      // ---------- 事件 ----------
      case 'event':
        return (
          <EventView
            gameState={gameState}
            onLeave={handleLeave}
            onEffectApplied={(message, title) => {
              toast.success(`🎭 事件结果`, {
                description: `${title}: ${message}`
              });
            }}
          />
        );
      
      // ---------- 挑战房间 ----------
      case 'challenge':
        return (
          <ChallengeView
            challenge={getRandomChallenge()}
            onAnswer={(correct) => {
              if (correct) {
                const reward = Math.floor(Math.random() * 50) + 20;
                setGameState(prev => ({ ...prev, money: prev.money + reward }));
                toast.success(`🎉 回答正确！获得 ${reward} 金钱！`, {
                  description: '你的编程知识很扎实！'
                });
              } else {
                toast.error('❌ 回答错误', {
                  description: '下次再接再厉！'
                });
              }
              handleLeave();
            }}
            onLeave={handleLeave}
          />
        );
      
      // ---------- 卡牌交换房间 ----------
      case 'cardExchange':
        return (
          <CardExchangeView
            options={getRandomExchangeOptions()}
            currentMoney={gameState.money}
            onSelect={(option) => {
              if (gameState.money >= option.cost) {
                playSFX('buttonClick');
                setGameState(prev => {
                  let newState = { ...prev, money: prev.money - option.cost };
                  
                  switch (option.type) {
                    case 'discard_draw': {
                      // 弃牌并抽牌 - 从牌库移除指定数量的牌，然后添加等量新牌
                      const discardCount = option.value;
                      const newDeck = [...prev.deck];
                      const discarded = newDeck.splice(0, Math.min(discardCount, newDeck.length));
                      
                      // 添加等量随机新牌
                      const newCards = getCombatRewardCards(prev.currentFloor, false);
                      for (let i = 0; i < discarded.length && i < newCards.length; i++) {
                        newDeck.push(newCards[i]);
                      }
                      
                      toast.success(
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-blue-400" />
                          <span>牌组重组完成</span>
                        </div>,
                        { description: `弃置 ${discarded.length} 张牌，获得 ${Math.min(discarded.length, newCards.length)} 张新牌` }
                      );
                      
                      newState.deck = newDeck;
                      break;
                    }
                    case 'upgrade': {
                      // 随机升级卡牌
                      if (prev.deck.length > 0) {
                        const randomIndex = Math.floor(Math.random() * prev.deck.length);
                        const card = prev.deck[randomIndex];
                        if (card && card.effect) {
                          newState.deck = prev.deck.map((c, i) => 
                            i === randomIndex ? { ...c, effect: { ...c.effect, value: c.effect.value + 3 } } : c
                          );
                          
                          toast.success(
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-400" />
                              <span>卡牌升级成功</span>
                            </div>,
                            { description: `${card.name} 效果 +3` }
                          );
                        }
                      }
                      break;
                    }
                    case 'remove': {
                      // 删除卡牌 - 随机删除一张牌
                      if (prev.deck.length > 0) {
                        const removeIndex = Math.floor(Math.random() * prev.deck.length);
                        const removedCard = prev.deck[removeIndex];
                        newState.deck = prev.deck.filter((_, i) => i !== removeIndex);
                        
                        toast.success(
                          <div className="flex items-center gap-2">
                            <Trash2 className="w-4 h-4 text-red-400" />
                            <span>已删除卡牌</span>
                          </div>,
                          { description: `${removedCard.name} 已从牌组移除` }
                        );
                      }
                      break;
                    }
                    case 'add_specific': {
                      // 添加特定稀有度的卡牌
                      const rewardCards = getCombatRewardCards(prev.currentFloor + 2, true); // 更高层数 = 更好奖励
                      if (rewardCards.length > 0) {
                        const selectedCard = rewardCards[0];
                        newState.deck = [...prev.deck, selectedCard];
                        
                        toast.success(
                          <div className="flex items-center gap-2">
                            <Gift className="w-4 h-4 text-green-400" />
                            <span>获得新卡牌</span>
                          </div>,
                          { description: `${selectedCard.name} 已加入牌组` }
                        );
                      }
                      break;
                    }
                  }
                  
                  return newState;
                });
              }
            }}
            onLeave={handleLeave}
          />
        );
      
      // ---------- 奖励选择 ----------
      case 'reward':
        return (
          <RewardView
            cards={gameState.rewardCards || []}
            onSelect={handleSelectReward}
            onSkip={handleSkipReward}
          />
        );
      
      // ---------- 游戏结束 ----------
      case 'game_over':
        return (
          <GameOver
            isVictory={false}
            stats={{
              floorsCleared: gameState.currentFloor,
              enemiesDefeated: 0,
              moneyEarned: gameState.money
            }}
            onRestart={handleBackToMenu}
            onMenu={handleBackToMenu}
          />
        );
      
      // ---------- 胜利 ----------
      case 'victory':
        return (
          <GameOver
            isVictory={true}
            stats={{
              floorsCleared: 4,
              enemiesDefeated: 10,
              moneyEarned: gameState.money
            }}
            onRestart={handleBackToMenu}
            onMenu={handleBackToMenu}
          />
        );
      
      // ---------- 默认 ----------
      default:
        return (
          <MainMenu 
            onStartGame={handleStartGame} 
            onPlayBGM={() => playBGM('menu')} 
            onVolumeChange={handleVolumeChange}
          />
        );
    }
  };

  // ==================== 主渲染 ====================
  return (
    <div className="min-h-screen bg-slate-900">
      {renderCurrentView()}
      {showHandView && (
        <HandView 
          gameState={gameState} 
          onClose={() => setShowHandView(false)} 
        />
      )}
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}

export default App;
