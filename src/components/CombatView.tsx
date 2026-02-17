import { useState, useEffect } from 'react';
import type { GameState } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CombatLogTree } from './CombatLogTree';
import { 
  Cpu, MemoryStick, Zap, Heart, Shield, Coins, Swords, Skull, Sparkles, Wind,
  // 攻击图标
  Crosshair, Sword, HandMetal, Hammer, Pickaxe, Radio, ArrowRight, ScanLine, Droplets, Scissors, Target, Play, FastForward, Copy, GitCommit, Flag,
  // 防御图标
  ShieldPlus, ShieldCheck, Castle, Building2, AlertTriangle, RefreshCw, Bomb, Magnet, Users, CircleDot, Lock, FlipHorizontal, BatteryCharging, PlusCircle, Sprout, Calculator,
  // 技能图标
  Search, Scan, Brain, Eye, Battery, Power, Activity, Recycle, Trash2, ArrowLeftRight, Layers, Settings, Megaphone, Gem, Clock, Database, Crown, Map, Briefcase, Network, Bot, Terminal, Volume2, Award, Banknote,
  // 通用
  Flame, Feather, Lightbulb, MessageCircle, CloudRain, Footprints, BookOpen, User, Plane, Coffee, TrendingUp, Video, ShoppingBag, Theater, Smile, Meh, School, Link, Mic, Music, Cat, Bird, Sun as SunIcon, Trees, Gift, Wand2, Dice5, Shuffle, BookUser, ShieldAlert, Home, Skull as SkullIcon, Ban
} from 'lucide-react';
import { computeStats } from '@/data/hardware';
import { formatCardDescription } from '@/data/cards';

interface CombatViewProps {
  gameState: GameState;
  onPlayCard: (cardIndex: number, targetIndex?: number) => void;
  onEndTurn: () => void;
  onPlaySFX?: (type: 'attack' | 'shield' | 'cardPlay' | 'damage') => void;
}

// 角色动画状态
interface CharacterAnimation {
  state: 'idle' | 'jump' | 'shake' | 'attack' | 'hurt';
  timestamp: number;
}

export function CombatView({ gameState, onPlayCard, onEndTurn, onPlaySFX }: CombatViewProps) {
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<number>(0);
  const [damageNumbers, setDamageNumbers] = useState<{[key: string]: number}>({});
  const [charAnim, setCharAnim] = useState<CharacterAnimation>({ state: 'idle', timestamp: Date.now() });
  const [showCombatLog, setShowCombatLog] = useState(false);

  const character = gameState.characters[0];
  const stats = computeStats(gameState.hardware);

  // 自动播放空闲动画
  useEffect(() => {
    const interval = setInterval(() => {
      setCharAnim(prev => {
        if (Date.now() - prev.timestamp > 2000) {
          // 2秒后回到空闲状态
          return { state: 'idle', timestamp: Date.now() };
        }
        return prev;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // 触发角色动画
  const triggerAnimation = (anim: CharacterAnimation['state']) => {
    setCharAnim({ state: anim, timestamp: Date.now() });
  };

  // 显示伤害数字
  const showDamage = (enemyId: string, damage: number) => {
    setDamageNumbers(prev => ({ ...prev, [enemyId]: damage }));
    setTimeout(() => {
      setDamageNumbers(prev => {
        const newState = { ...prev };
        delete newState[enemyId];
        return newState;
      });
    }, 1000);
  };

  const handleCardClick = (index: number) => {
    const card = gameState.hand[index];
    if (!card) return;

    let actualCost = card.cost;
    if (character.id === 'rana' && card.type === 'attack' && gameState.cardsPlayedThisTurn === 0) {
      actualCost = Math.max(0, actualCost - 1);
    }

    if (gameState.currentCost < actualCost) {
      return;
    }

    if (selectedCardIndex === index) {
      // 确定目标
      const targetIdx = card.effect.target === 'all' ? 0 : selectedTarget;
      
      // 记录敌人血量变化
      const targetEnemy = gameState.currentEnemies[targetIdx];
      const oldHealth = targetEnemy?.currentHealth || 0;
      
      // 触发对应动画
      if (card.type === 'attack') {
        triggerAnimation('attack');
      } else if (card.type === 'defense') {
        triggerAnimation('jump');
      } else {
        triggerAnimation('shake');
      }
      
      onPlayCard(index, targetIdx);
      
      // 播放音效
      if (card.type === 'attack') {
        onPlaySFX?.('attack');
      } else if (card.type === 'defense') {
        onPlaySFX?.('shield');
      } else {
        onPlaySFX?.('cardPlay');
      }
      
      // 显示伤害数字
      if (card.effect.type === 'damage' && targetEnemy && targetEnemy.currentHealth > 0) {
        const newHealth = Math.max(0, targetEnemy.currentHealth - card.effect.value);
        const damage = oldHealth - newHealth;
        if (damage > 0) {
          showDamage(targetEnemy.id, damage);
        }
      }
      
      setSelectedCardIndex(null);
    } else {
      setSelectedCardIndex(index);
      // 选中卡牌时轻微晃动
      triggerAnimation('shake');
    }
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

  const getCardTypeIcon = (type: string) => {
    switch (type) {
      case 'attack': return <Swords className="w-4 h-4 text-red-400" />;
      case 'defense': return <Shield className="w-4 h-4 text-blue-400" />;
      case 'skill': return <Zap className="w-4 h-4 text-green-400" />;
      case 'special': return <Sparkles className="w-4 h-4 text-purple-400" />;
      default: return null;
    }
  };

  // 卡牌图标映射
  const iconMap: Record<string, React.ReactNode> = {
    // 攻击图标
    'Crosshair': <Crosshair className="w-5 h-5 text-red-400" />,
    'Sword': <Sword className="w-5 h-5 text-red-400" />,
    'Fist': <HandMetal className="w-5 h-5 text-red-400" />,
    'Hammer': <Hammer className="w-5 h-5 text-red-400" />,
    'Pickaxe': <Pickaxe className="w-5 h-5 text-red-400" />,
    'Wind': <Wind className="w-5 h-5 text-red-400" />,
    'Tornado': <Wind className="w-5 h-5 text-red-400" />,
    'Radio': <Radio className="w-5 h-5 text-red-400" />,
    'Zap': <Zap className="w-5 h-5 text-red-400" />,
    'ArrowRight': <ArrowRight className="w-5 h-5 text-red-400" />,
    'ScanLine': <ScanLine className="w-5 h-5 text-red-400" />,
    'Droplets': <Droplets className="w-5 h-5 text-red-400" />,
    'Scissors': <Scissors className="w-5 h-5 text-red-400" />,
    'Target': <Target className="w-5 h-5 text-red-400" />,
    'Play': <Play className="w-5 h-5 text-red-400" />,
    'FastForward': <FastForward className="w-5 h-5 text-red-400" />,
    'Copy': <Copy className="w-5 h-5 text-red-400" />,
    'GitCommit': <GitCommit className="w-5 h-5 text-red-400" />,
    'Skull': <Skull className="w-5 h-5 text-red-400" />,
    'Flag': <Flag className="w-5 h-5 text-red-400" />,
    'Flame': <Flame className="w-5 h-5 text-red-400" />,
    'Fan': <Wind className="w-5 h-5 text-red-400" />,
    'Gauge': <Activity className="w-5 h-5 text-red-400" />,
    'ArrowUpFromLine': <ArrowRight className="w-5 h-5 text-red-400" style={{transform: 'rotate(-90deg)'}} />,
    'Cross': <Crosshair className="w-5 h-5 text-red-400" />,
    'AlertOctagon': <AlertTriangle className="w-5 h-5 text-red-400" />,
    'Library': <BookUser className="w-5 h-5 text-red-400" />,
    'Trash': <Trash2 className="w-5 h-5 text-red-400" />,
    'Cannon': <Target className="w-5 h-5 text-red-400" />,
    'Bomb': <Bomb className="w-5 h-5 text-red-400" />,
    
    // 防御图标
    'Shield': <Shield className="w-5 h-5 text-blue-400" />,
    'ShieldPlus': <ShieldPlus className="w-5 h-5 text-blue-400" />,
    'ShieldCheck': <ShieldCheck className="w-5 h-5 text-blue-400" />,
    'Castle': <Castle className="w-5 h-5 text-blue-400" />,
    'Building2': <Building2 className="w-5 h-5 text-blue-400" />,
    'AlertTriangle': <AlertTriangle className="w-5 h-5 text-blue-400" />,
    'RefreshCw': <RefreshCw className="w-5 h-5 text-blue-400" />,
    'Swords': <Swords className="w-5 h-5 text-blue-400" />,
    'Heart': <Heart className="w-5 h-5 text-blue-400" />,
    'Magnet': <Magnet className="w-5 h-5 text-blue-400" />,
    'Users': <Users className="w-5 h-5 text-blue-400" />,
    'CircleDot': <CircleDot className="w-5 h-5 text-blue-400" />,
    'Lock': <Lock className="w-5 h-5 text-blue-400" />,
    'FlipHorizontal': <FlipHorizontal className="w-5 h-5 text-blue-400" />,
    'BatteryCharging': <BatteryCharging className="w-5 h-5 text-blue-400" />,
    'PlusCircle': <PlusCircle className="w-5 h-5 text-blue-400" />,
    'Sprout': <Sprout className="w-5 h-5 text-blue-400" />,
    'Sun': <SunIcon className="w-5 h-5 text-blue-400" />,
    'Home': <Home className="w-5 h-5 text-blue-400" />,
    'Fence': <Shield className="w-5 h-5 text-blue-400" />,
    'Calculator': <Calculator className="w-5 h-5 text-blue-400" />,
    'ShieldEllipsis': <Shield className="w-5 h-5 text-blue-400" />,
    'Timer': <Clock className="w-5 h-5 text-blue-400" />,
    'Flower2': <Sprout className="w-5 h-5 text-blue-400" />,
    'Scale': <Activity className="w-5 h-5 text-blue-400" />,
    'Ghost': <Sparkles className="w-5 h-5 text-blue-400" />,
    'PauseCircle': <CircleDot className="w-5 h-5 text-blue-400" />,
    'CloudFog': <Wind className="w-5 h-5 text-blue-400" />,
    'ShieldAlert': <ShieldAlert className="w-5 h-5 text-blue-400" />,
    'Disc': <CircleDot className="w-5 h-5 text-blue-400" />,
    'CloudRain': <CloudRain className="w-5 h-5 text-blue-400" />,
    'Aegis': <ShieldPlus className="w-5 h-5 text-blue-400" />,
    
    // 技能图标
    'Search': <Search className="w-5 h-5 text-green-400" />,
    'Scan': <Scan className="w-5 h-5 text-green-400" />,
    'Brain': <Brain className="w-5 h-5 text-green-400" />,
    'Eye': <Eye className="w-5 h-5 text-green-400" />,
    'Battery': <Battery className="w-5 h-5 text-green-400" />,
    'Power': <Power className="w-5 h-5 text-green-400" />,
    'Activity': <Activity className="w-5 h-5 text-green-400" />,
    'Recycle': <Recycle className="w-5 h-5 text-green-400" />,
    'Trash2': <Trash2 className="w-5 h-5 text-green-400" />,
    'ArrowLeftRight': <ArrowLeftRight className="w-5 h-5 text-green-400" />,
    'Layers': <Layers className="w-5 h-5 text-green-400" />,
    'Settings': <Settings className="w-5 h-5 text-green-400" />,
    'Megaphone': <Megaphone className="w-5 h-5 text-green-400" />,
    'Coins': <Coins className="w-5 h-5 text-green-400" />,
    'Gem': <Gem className="w-5 h-5 text-green-400" />,
    'Clock': <Clock className="w-5 h-5 text-green-400" />,
    'Database': <Database className="w-5 h-5 text-green-400" />,
    'Crown': <Crown className="w-5 h-5 text-green-400" />,
    'Telescope': <Scan className="w-5 h-5 text-green-400" />,
    'Map': <Map className="w-5 h-5 text-green-400" />,
    'Briefcase': <Briefcase className="w-5 h-5 text-green-400" />,
    'Network': <Network className="w-5 h-5 text-green-400" />,
    'Bot': <Bot className="w-5 h-5 text-green-400" />,
    'Terminal': <Terminal className="w-5 h-5 text-green-400" />,
    'Lightbulb': <Lightbulb className="w-5 h-5 text-green-400" />,
    'HeartPulse': <Heart className="w-5 h-5 text-green-400" />,
    'Thermometer': <Activity className="w-5 h-5 text-green-400" />,
    'Biohazard': <Skull className="w-5 h-5 text-green-400" />,
    'Dumbbell': <Activity className="w-5 h-5 text-green-400" />,
    'Shovel': <Pickaxe className="w-5 h-5 text-green-400" />,
    'Clover': <Sparkles className="w-5 h-5 text-green-400" />,
    
    // 角色专属
    'Feather': <Feather className="w-5 h-5 text-purple-400" />,
    'MessageCircle': <MessageCircle className="w-5 h-5 text-purple-400" />,
    'Footprints': <Footprints className="w-5 h-5 text-purple-400" />,
    'BookOpen': <BookOpen className="w-5 h-5 text-purple-400" />,
    'User': <User className="w-5 h-5 text-purple-400" />,
    'Plane': <Plane className="w-5 h-5 text-purple-400" />,
    'Drum': <Volume2 className="w-5 h-5 text-purple-400" />,
    'TrendingUp': <TrendingUp className="w-5 h-5 text-purple-400" />,
    'Video': <Video className="w-5 h-5 text-purple-400" />,
    'ShoppingBag': <ShoppingBag className="w-5 h-5 text-purple-400" />,
    'Mask': <Theater className="w-5 h-5 text-purple-400" />,
    'Award': <Award className="w-5 h-5 text-purple-400" />,
    'Banknote': <Banknote className="w-5 h-5 text-purple-400" />,
    'Cat': <Cat className="w-5 h-5 text-purple-400" />,
    'Bird': <Bird className="w-5 h-5 text-purple-400" />,
    'SunIcon': <SunIcon className="w-5 h-5 text-purple-400" />,
    'Trees': <Trees className="w-5 h-5 text-purple-400" />,
    'Gift': <Gift className="w-5 h-5 text-purple-400" />,
    'Wand2': <Wand2 className="w-5 h-5 text-purple-400" />,
    'Dice5': <Dice5 className="w-5 h-5 text-purple-400" />,
    'Shuffle': <Shuffle className="w-5 h-5 text-purple-400" />,
    'Theater': <Theater className="w-5 h-5 text-purple-400" />,
    'Smile': <Smile className="w-5 h-5 text-purple-400" />,
    'Meh': <Meh className="w-5 h-5 text-purple-400" />,
    'School': <School className="w-5 h-5 text-purple-400" />,
    'Link': <Link className="w-5 h-5 text-purple-400" />,
    'Mic': <Mic className="w-5 h-5 text-purple-400" />,
    'Music': <Music className="w-5 h-5 text-purple-400" />,
    'Coffee': <Coffee className="w-5 h-5 text-purple-400" />,
  };

  const getCardIcon = (iconName: string | undefined) => {
    if (!iconName) return getCardTypeIcon('attack');
    return iconMap[iconName] || <Sparkles className="w-5 h-5 text-slate-400" />;
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'epic': return 'ring-1 ring-purple-400/50';
      case 'rare': return 'ring-1 ring-blue-400/50';
      default: return '';
    }
  };

  // 获取房间类型标签
  const getRoomTypeBadge = () => {
    const roomType = gameState.currentRoom?.type;
    if (roomType === 'elite') return <Badge className="bg-purple-500 text-white text-xs">精英</Badge>;
    if (roomType === 'boss') return <Badge className="bg-red-500 text-white text-xs">BOSS</Badge>;
    return null;
  };

  // 获取角色动画样式
  const getCharacterAnimStyle = () => {
    switch (charAnim.state) {
      case 'jump':
        return 'transform -translate-y-4 transition-transform duration-200';
      case 'shake':
        return 'animate-pulse';
      case 'attack':
        return 'transform translate-x-2 transition-transform duration-150';
      case 'hurt':
        return 'transform -translate-x-1 opacity-80';
      case 'idle':
      default:
        return 'animate-bounce-subtle';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* 添加动画样式 */}
      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
        @keyframes card-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-2px) rotate(0.5deg); }
          75% { transform: translateY(-2px) rotate(-0.5deg); }
        }
        .card-float {
          animation: card-float 3s ease-in-out infinite;
        }
        @keyframes card-selected {
          0%, 100% { transform: translateY(-8px) scale(1.02); }
          50% { transform: translateY(-12px) scale(1.05); }
        }
        .card-selected {
          animation: card-selected 0.5s ease-in-out infinite;
          box-shadow: 0 0 20px rgba(250, 204, 21, 0.4);
        }
      `}</style>

      {/* 顶部状态栏 */}
      <div className="flex flex-wrap justify-between items-start gap-4 p-4">
        {/* 角色状态 */}
        <Card className="bg-slate-800/80 border-slate-700 p-3 flex items-center gap-3">
          {/* 角色立绘 */}
          <div 
            className={`w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden border-2 ${getCharacterAnimStyle()}`}
            style={{ borderColor: character.color }}
          >
            <img 
              src={character.portrait} 
              alt={character.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `<span class="text-xl font-bold text-white">${character.name[0]}</span>`;
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-bold">{character.name}</p>
              {getRoomTypeBadge()}
            </div>
            <div className="flex items-center gap-3 text-sm mt-1">
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-white">{character.currentEnergy}/{character.maxEnergy}</span>
              </div>
              {gameState.tempShield > 0 && (
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400">{gameState.tempShield}</span>
                </div>
              )}
            </div>
            {/* 精力条 */}
            <div className="w-32 h-1.5 bg-slate-700 rounded-full mt-1.5">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all"
                style={{ width: `${(character.currentEnergy / character.maxEnergy) * 100}%` }}
              />
            </div>
          </div>
        </Card>

        {/* 角色状态效果 */}
        <Card className="bg-slate-800/80 border-slate-700 p-3">
          <div className="text-xs text-slate-400 mb-2">状态</div>
          <div className="flex gap-2 flex-wrap">
            {/* 增益效果 */}
            {gameState.artifact && gameState.artifact > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded-lg" title={`神器: 免疫${gameState.artifact}层负面效果`}>
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 text-xs font-bold">{gameState.artifact}</span>
              </div>
            )}
            {gameState.immuneDebuff && gameState.immuneDebuff > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-lg" title={`免疫负面效果${gameState.immuneDebuff}回合`}>
                <Ban className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-xs font-bold">{gameState.immuneDebuff}</span>
              </div>
            )}
            {gameState.retaliate && gameState.retaliate > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 rounded-lg" title={`反击: 受到伤害时反弹${gameState.retaliate}点`}>
                <Swords className="w-4 h-4 text-orange-400" />
                <span className="text-orange-400 text-xs font-bold">{gameState.retaliate}</span>
              </div>
            )}
            {gameState.nextAttackBonus && gameState.nextAttackBonus > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-lg" title={`下次攻击+${gameState.nextAttackBonus}伤害`}>
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-xs font-bold">+{gameState.nextAttackBonus}</span>
              </div>
            )}
            {gameState.permanentDrawBonus && gameState.permanentDrawBonus > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-cyan-500/20 rounded-lg" title={`每回合抽牌+${gameState.permanentDrawBonus}`}>
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 text-xs font-bold">+{gameState.permanentDrawBonus}</span>
              </div>
            )}
            {gameState.nextTurnDrawBonus && gameState.nextTurnDrawBonus > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded-lg" title={`下回合抽牌+${gameState.nextTurnDrawBonus}`}>
                <Layers className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-xs font-bold">+{gameState.nextTurnDrawBonus}</span>
              </div>
            )}
            {/* 减益效果 */}
            {gameState.playerWeak && gameState.playerWeak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-slate-500/20 rounded-lg" title={`虚弱: 伤害-25%每层`}>
                <Feather className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400 text-xs font-bold">{gameState.playerWeak}</span>
              </div>
            )}
            {gameState.playerVulnerable && gameState.playerVulnerable > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-lg" title={`易伤: 受伤+50%每层`}>
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-xs font-bold">{gameState.playerVulnerable}</span>
              </div>
            )}
            {gameState.playerPoison && gameState.playerPoison > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-600/20 rounded-lg" title={`中毒: 每回合扣${gameState.playerPoison}生命`}>
                <SkullIcon className="w-4 h-4 text-green-500" />
                <span className="text-green-500 text-xs font-bold">{gameState.playerPoison}</span>
              </div>
            )}
            {gameState.playerStunned && gameState.playerStunned > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-600/20 rounded-lg" title={`晕眩: 无法行动`}>
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-500 text-xs font-bold">{gameState.playerStunned}</span>
              </div>
            )}
            {gameState.damageReductionNext && gameState.damageReductionNext > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded-lg" title={`受伤-${gameState.damageReductionNext}`}>
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-xs font-bold">-{gameState.damageReductionNext}</span>
              </div>
            )}
            {/* 无状态时显示提示 */}
            {(!gameState.artifact && !gameState.immuneDebuff && !gameState.retaliate && 
              !gameState.nextAttackBonus && !gameState.permanentDrawBonus && !gameState.nextTurnDrawBonus &&
              !gameState.playerWeak && !gameState.playerVulnerable && !gameState.playerPoison && !gameState.playerStunned &&
              !gameState.damageReductionNext) && (
              <span className="text-slate-500 text-xs">无</span>
            )}
          </div>
        </Card>

        {/* 硬件状态 */}
        <Card className="bg-slate-800/80 border-slate-700 p-3 flex gap-4 flex-wrap">
          <div className="flex items-center gap-2" title={gameState.hardware.cpu?.name || '未安装'}>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">算力</p>
              <p className="text-white font-bold">{stats.drawPower}</p>
            </div>
          </div>
          <div className="flex items-center gap-2" title={`${gameState.hardware.ramSticks.reduce((sum: number, ram: {energy: number}) => sum + ram.energy, 0)}能量`}>
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <MemoryStick className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">内存</p>
              <p className="text-white font-bold">{gameState.currentCost}/{gameState.maxCost}</p>
            </div>
          </div>
          {/* 线程已移除 */}
          {stats.gpuBonus > 0 && (
            <div className="flex items-center gap-2" title={gameState.hardware.gpu?.name}>
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Wind className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">显卡</p>
                <p className="text-white font-bold">+{stats.gpuBonus}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Coins className="w-4 h-4 text-yellow-500" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">金钱</p>
              <p className="text-white font-bold">{gameState.money}</p>
            </div>
          </div>
        </Card>

        {/* 回合信息 */}
        <Card className="bg-slate-800/80 border-slate-700 p-3">
          <p className="text-slate-400 text-xs mb-1">回合</p>
          <p className="text-white font-bold text-lg">{gameState.turn}</p>
          <Badge className="bg-blue-500 text-white text-xs mt-1">玩家回合</Badge>
        </Card>

      </div>

      {/* 敌人区域 - 使用flex-1自动填充剩余空间 */}
      <div className="flex-1 flex items-center justify-center gap-4 px-4 pb-4 flex-wrap">
        {gameState.currentEnemies.map((enemy, index) => (
          enemy.currentHealth <= 0 ? null : (
          <Card
            key={`${enemy.id}_${index}_${enemy.currentHealth}`}
            className={`w-48 p-4 cursor-pointer transition-all border-2 relative ${
              selectedTarget === index 
                ? 'border-red-400 bg-slate-800 shadow-lg shadow-red-500/20' 
                : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-600'
            }`}
            onClick={() => setSelectedTarget(index)}
          >
            {/* 伤害数字 */}
            {damageNumbers[enemy.id] && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-2xl font-bold text-red-500 animate-bounce">
                -{damageNumbers[enemy.id]}
              </div>
            )}
            
            <div className="text-center mb-3">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-600 rounded-xl mx-auto mb-2 flex items-center justify-center">
                {enemy.id === 'springShadow' || enemy.id === 'crychic' ? (
                  <Skull className="w-8 h-8 text-purple-400" />
                ) : (
                  <Swords className="w-8 h-8 text-red-400" />
                )}
              </div>
              <p className="text-white font-bold">{enemy.name}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">HP</span>
                <span className="text-white">{enemy.currentHealth}/{enemy.maxHealth}</span>
              </div>
              <Progress 
                value={(enemy.currentHealth / enemy.maxHealth) * 100} 
                className="h-2 bg-slate-700"
              />
              {/* 敌人护盾显示 */}
              {(enemy as any).shield > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <Shield className="w-3 h-3 text-blue-400" />
                  <span className="text-blue-400">{(enemy as any).shield}</span>
                </div>
              )}
              {/* 敌人状态效果 */}
              <div className="flex gap-1 mt-2 flex-wrap justify-center">
                {(enemy as any).weak > 0 && (
                  <span className="px-1.5 py-0.5 bg-slate-500/20 rounded text-xs" title="虚弱: 伤害-25%">
                    <Feather className="w-3 h-3 inline text-slate-400" />
                    <span className="text-slate-400 ml-0.5">{(enemy as any).weak}</span>
                  </span>
                )}
                {(enemy as any).vulnerable > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500/20 rounded text-xs" title="易伤: 受伤+50%">
                    <AlertTriangle className="w-3 h-3 inline text-red-400" />
                    <span className="text-red-400 ml-0.5">{(enemy as any).vulnerable}</span>
                  </span>
                )}
                {(enemy as any).poison > 0 && (
                  <span className="px-1.5 py-0.5 bg-green-600/20 rounded text-xs" title="中毒">
                    <SkullIcon className="w-3 h-3 inline text-green-500" />
                    <span className="text-green-500 ml-0.5">{(enemy as any).poison}</span>
                  </span>
                )}
                {(enemy as any).stunned > 0 && (
                  <span className="px-1.5 py-0.5 bg-yellow-600/20 rounded text-xs" title="晕眩">
                    <Clock className="w-3 h-3 inline text-yellow-500" />
                    <span className="text-yellow-500 ml-0.5">{(enemy as any).stunned}</span>
                  </span>
                )}
              </div>
            </div>

            {/* 敌人意图显示 */}
            <div className="mt-3 space-y-1">
              {/* 上回合行动（公开信息） */}
              {enemy.previousIntent && (
                <div className="text-center">
                  <Badge variant="outline" className="text-xs border-slate-500/50 text-slate-400">
                    上回合: {enemy.previousIntent.type === 'attack' ? `⚔️ 攻击 ${enemy.previousIntent.value}` : 
                     enemy.previousIntent.type === 'defense' ? '🛡️ 防御' : '✨ 特殊'}
                  </Badge>
                </div>
              )}
              {/* 下回合意图 - 默认隐藏，揭示后显示 */}
              {enemy.intent && (
                <div className="text-center">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${(enemy as any).intentRevealed 
                      ? 'border-red-500/50 text-red-400' 
                      : 'border-slate-600/50 text-slate-500'}`}
                  >
                    下回合: {(enemy as any).intentRevealed 
                      ? (enemy.intent.type === 'attack' ? `⚔️ 攻击 ${enemy.intent.value}` : 
                         enemy.intent.type === 'defense' ? '🛡️ 防御' : '✨ 特殊')
                      : '??? 未知'}
                  </Badge>
                </div>
              )}
            </div>

            <p className="text-slate-500 text-xs mt-2 text-center line-clamp-2">{enemy.specialDescription}</p>
          </Card>
          )
        ))}
      </div>

      {/* 角色立绘区域 - 手牌上方 */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          {/* 角色立绘 */}
          <div 
            className={`w-24 h-32 rounded-xl overflow-hidden border-3 shadow-lg transition-all duration-200 ${getCharacterAnimStyle()}`}
            style={{ borderColor: character.color, borderWidth: '3px' }}
          >
            <img 
              src={character.portrait} 
              alt={character.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-slate-800"><span class="text-2xl font-bold text-white">${character.name[0]}</span></div>`;
              }}
            />
          </div>
          
          {/* 角色名字标签 */}
          <div 
            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold whitespace-nowrap"
            style={{ backgroundColor: character.color, color: 'white' }}
          >
            {character.name}
          </div>

          {/* 特效光环 */}
          <div 
            className="absolute inset-0 rounded-xl opacity-30 pointer-events-none"
            style={{ 
              boxShadow: `0 0 30px ${character.color}`,
            }}
          />
        </div>
      </div>

      {/* 手牌区域 - 固定在底部 */}
      <div className="bg-slate-900/90 border-t border-slate-700 p-4">
        <div className="flex justify-center gap-3 flex-wrap max-w-6xl mx-auto mb-4">
          {gameState.hand.map((card, index) => {
            let actualCost = card.cost;
            if (character.id === 'rana' && card.type === 'attack' && gameState.cardsPlayedThisTurn === 0) {
              actualCost = Math.max(0, actualCost - 1);
            }
            const canAfford = gameState.currentCost >= actualCost;
            const canPlay = canAfford;

            return (
              <Card
                key={`${card.id}-${index}`}
                className={`w-36 p-3 cursor-pointer transition-all border-2 card-float ${
                  selectedCardIndex === index
                    ? 'card-selected border-yellow-400'
                    : canPlay
                    ? 'hover:transform hover:-translate-y-2 hover:border-slate-500 hover:shadow-lg'
                    : 'opacity-50'
                } ${getCardColor(card.type)} ${getRarityBorder(card.rarity)}`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => handleCardClick(index)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    canAfford ? 'bg-slate-700' : 'bg-red-500/30'
                  }`}>
                    <span className={`text-sm font-bold ${canAfford ? 'text-white' : 'text-red-400'}`}>
                      {actualCost}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center">
                    {getCardIcon(card.icon)}
                  </div>
                </div>
                <p className="text-white font-bold text-sm mb-1 truncate">{card.name}</p>
                <p 
                  className="text-slate-300 text-xs leading-tight line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: formatCardDescription(card.description) }}
                />
                <div className="mt-2 flex justify-center gap-1">
                  {card.rarity === 'epic' && (
                    <span className="text-xs text-purple-400">✨ 史诗</span>
                  )}
                  {card.rarity === 'rare' && (
                    <span className="text-xs text-blue-400">💎 稀有</span>
                  )}
                  {card.rarity === 'common' && (
                    <span className="text-xs text-slate-500">⚪ 普通</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* 结束回合按钮 */}
        <div className="flex justify-center">
          <Button 
            onClick={() => {
              triggerAnimation('shake');
              onEndTurn();
            }}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500 px-10 py-4 text-lg transition-all hover:scale-105"
          >
            结束回合
          </Button>
        </div>
      </div>

      {/* 战斗日志树 */}
      <CombatLogTree 
        gameState={gameState} 
        isOpen={showCombatLog}
        onToggle={() => setShowCombatLog(!showCombatLog)}
      />
    </div>
  );
}
