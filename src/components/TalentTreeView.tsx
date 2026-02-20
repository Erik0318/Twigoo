/**
 * 天赋树界面 - 角色天赋选择系统
 */
import { useState, useMemo } from 'react';
import type { Character, GameState } from '@/types/game';
import type { TalentId, TalentPath } from '@/systems/characterTalentTree';
import { characterTalentTrees, calculateTalentEffects } from '@/systems/characterTalentTree';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, ArrowLeft, Lock, Check, Star, 
  Zap, Shield, Sword, Heart, Coins, Target, Brain
} from 'lucide-react';
import { toast } from 'sonner';

interface TalentTreeViewProps {
  character: Character;
  gameState: GameState;
  onUnlockTalent: (talentId: TalentId) => boolean;
  onLeave: () => void;
}

// 路径图标映射
const pathIcons: Record<string, React.ReactNode> = {
  '诗人之路': <Brain className="w-5 h-5" />,
  '呐喊之路': <Sword className="w-5 h-5" />,
  '金钱之路': <Coins className="w-5 h-5" />,
  '社交之路': <Heart className="w-5 h-5" />,
  '随机之路': <Sparkles className="w-5 h-5" />,
  '暴击之路': <Target className="w-5 h-5" />,
  '护盾之路': <Shield className="w-5 h-5" />,
  '控制之路': <Brain className="w-5 h-5" />,
  '连击之路': <Zap className="w-5 h-5" />,
  '节奏之路': <Target className="w-5 h-5" />,
};

// 路径颜色映射
const pathColors: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  '诗人之路': { 
    bg: 'bg-blue-500/20', 
    border: 'border-blue-500/50', 
    text: 'text-blue-400',
    gradient: 'from-blue-600 to-blue-400'
  },
  '呐喊之路': { 
    bg: 'bg-red-500/20', 
    border: 'border-red-500/50', 
    text: 'text-red-400',
    gradient: 'from-red-600 to-red-400'
  },
  '金钱之路': { 
    bg: 'bg-yellow-500/20', 
    border: 'border-yellow-500/50', 
    text: 'text-yellow-400',
    gradient: 'from-yellow-600 to-yellow-400'
  },
  '社交之路': { 
    bg: 'bg-pink-500/20', 
    border: 'border-pink-500/50', 
    text: 'text-pink-400',
    gradient: 'from-pink-600 to-pink-400'
  },
  '随机之路': { 
    bg: 'bg-purple-500/20', 
    border: 'border-purple-500/50', 
    text: 'text-purple-400',
    gradient: 'from-purple-600 to-purple-400'
  },
  '暴击之路': { 
    bg: 'bg-orange-500/20', 
    border: 'border-orange-500/50', 
    text: 'text-orange-400',
    gradient: 'from-orange-600 to-orange-400'
  },
  '护盾之路': { 
    bg: 'bg-cyan-500/20', 
    border: 'border-cyan-500/50', 
    text: 'text-cyan-400',
    gradient: 'from-cyan-600 to-cyan-400'
  },
  '控制之路': { 
    bg: 'bg-indigo-500/20', 
    border: 'border-indigo-500/50', 
    text: 'text-indigo-400',
    gradient: 'from-indigo-600 to-indigo-400'
  },
  '连击之路': { 
    bg: 'bg-green-500/20', 
    border: 'border-green-500/50', 
    text: 'text-green-400',
    gradient: 'from-green-600 to-green-400'
  },
  '节奏之路': { 
    bg: 'bg-emerald-500/20', 
    border: 'border-emerald-500/50', 
    text: 'text-emerald-400',
    gradient: 'from-emerald-600 to-emerald-400'
  },
};

export function TalentTreeView({ character, gameState, onUnlockTalent, onLeave }: TalentTreeViewProps) {
  const [selectedPath, setSelectedPath] = useState<'A' | 'B' | null>(null);
  
  const talentTree = gameState.talentTree;
  const availablePoints = gameState.talentPoints || 0;
  const totalPoints = gameState.totalTalentPoints || 0;
  
  const treeData = useMemo(() => {
    return characterTalentTrees[character.id];
  }, [character.id]);
  
  const unlockedTalents = useMemo(() => {
    return new Set(talentTree?.unlockedTalents || []);
  }, [talentTree?.unlockedTalents]);
  
  const talentEffects = useMemo(() => {
    if (!talentTree) return null;
    // 转换类型以匹配函数签名
    const treeForCalc = {
      ...talentTree,
      unlockedTalents: talentTree.unlockedTalents as TalentId[]
    };
    return calculateTalentEffects(treeForCalc);
  }, [talentTree]);

  const handleUnlockTalent = (talentId: TalentId) => {
    if (availablePoints <= 0) {
      toast.error('天赋点不足', { description: '继续战斗获得更多天赋点' });
      return;
    }
    
    const success = onUnlockTalent(talentId);
    if (success) {
      toast.success('天赋解锁成功！', { description: '新能力已激活' });
    } else {
      toast.error('无法解锁此天赋', { description: '可能需要先解锁前置天赋' });
    }
  };

  const renderTalentNode = (
    talent: { id: TalentId; name: string; description: string; maxLevel: number },
    path: TalentPath,
    index: number,
    isPathB: boolean
  ) => {
    const isUnlocked = unlockedTalents.has(talent.id);
    const colors = pathColors[path.name] || pathColors['诗人之路'];
    
    // 检查是否可以解锁
    let canUnlock = false;
    if (!isUnlocked && availablePoints > 0) {
      // 第一个天赋可以直接解锁（如果是路径B）或者需要检查路径A
      if (index === 0) {
        if (isPathB) {
          // 路径B的第一个天赋可以直接解锁
          canUnlock = true;
        } else {
          // 路径A的第一个天赋也可以直接解锁
          canUnlock = true;
        }
      } else {
        // 检查前置天赋是否已解锁
        const prevTalentId = talent.id.replace(/\d$/, String(index)) as TalentId;
        canUnlock = unlockedTalents.has(prevTalentId);
      }
    }
    
    // 检查是否有前置依赖未满足（用于视觉提示）
    const hasPrevLocked = index > 0 && !unlockedTalents.has(talent.id.replace(/\d$/, String(index)) as TalentId);
    
    return (
      <div key={talent.id} className="relative">
        {/* 连接线 */}
        {index > 0 && (
          <div className={`absolute -top-4 left-1/2 w-0.5 h-4 -translate-x-1/2 ${
            isUnlocked ? `bg-gradient-to-b ${colors.gradient}` : 'bg-slate-700'
          }`} />
        )}
        
        <div
          onClick={() => canUnlock && handleUnlockTalent(talent.id)}
          className={`
            relative p-4 rounded-xl border-2 transition-all duration-300
            ${isUnlocked 
              ? `${colors.bg} ${colors.border} ${colors.text} shadow-lg` 
              : canUnlock
                ? 'bg-slate-800/80 border-yellow-500/50 cursor-pointer hover:bg-slate-700/80 hover:border-yellow-400/70 hover:shadow-lg hover:shadow-yellow-500/10'
                : hasPrevLocked
                  ? 'bg-slate-900/50 border-slate-800 opacity-50'
                  : 'bg-slate-800/50 border-slate-700 opacity-70'
            }
          `}
        >
          {/* 状态图标 */}
          <div className="absolute -top-2 -right-2">
            {isUnlocked ? (
              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg`}>
                <Check className="w-4 h-4 text-white" />
              </div>
            ) : canUnlock ? (
              <div className="w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center animate-pulse">
                <Star className="w-3 h-3 text-yellow-400" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Lock className="w-3 h-3 text-slate-500" />
              </div>
            )}
          </div>
          
          {/* 天赋信息 */}
          <div className="text-center">
            <h4 className={`font-bold text-sm mb-1 ${isUnlocked ? colors.text : 'text-slate-300'}`}>
              {talent.name}
            </h4>
            <p className={`text-xs ${isUnlocked ? 'text-slate-300' : 'text-slate-500'}`}>
              {talent.description}
            </p>
          </div>
          
          {/* 可解锁提示 */}
          {canUnlock && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full pt-2">
              <span className="text-xs text-yellow-400 whitespace-nowrap">点击解锁 (-1点数)</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPathColumn = (pathKey: 'A' | 'B') => {
    const pathData = pathKey === 'A' ? treeData?.pathA : treeData?.pathB;
    if (!pathData) return null;
    
    const colors = pathColors[pathData.name] || pathColors['诗人之路'];
    const isSelected = selectedPath === pathKey;
    
    return (
      <div 
        className={`
          flex-1 min-w-[280px] max-w-[350px] transition-all duration-300
          ${isSelected ? 'scale-105 z-10' : 'hover:scale-[1.02]'}
        `}
        onClick={() => setSelectedPath(pathKey)}
      >
        <Card className={`
          h-full bg-slate-900/80 border-2 overflow-hidden
          ${isSelected ? colors.border : 'border-slate-700'}
        `}>
          {/* 路径头部 */}
          <div className={`
            p-4 border-b ${isSelected ? colors.border : 'border-slate-700'}
            ${colors.bg}
          `}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${colors.bg} ${colors.text} border ${colors.border}`}>
                {pathIcons[pathData.name] || <Star className="w-5 h-5" />}
              </div>
              <div>
                <h3 className={`font-bold ${colors.text}`}>{pathData.name}</h3>
                <p className="text-xs text-slate-400">{pathData.description}</p>
              </div>
            </div>
          </div>
          
          {/* 天赋节点 */}
          <div className="p-6 space-y-6">
            {pathData.talents.map((talent, index) => 
              renderTalentNode(talent, pathData, index, pathKey === 'B')
            )}
          </div>
        </Card>
      </div>
    );
  };

  if (!treeData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800/80 border-slate-700 p-8 text-center">
          <p className="text-slate-400">暂无天赋数据</p>
          <Button onClick={onLeave} className="mt-4">返回</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 overflow-auto">
      <div className="max-w-5xl mx-auto">
        {/* 头部信息 */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={onLeave} 
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          
          {/* 天赋点显示 */}
          <div className="flex items-center gap-4">
            <Card className="bg-slate-800/80 border-slate-700 px-4 py-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <span className="text-slate-400 text-sm">可用天赋点:</span>
                <span className="text-yellow-400 font-bold text-xl">{availablePoints}</span>
              </div>
            </Card>
            <Card className="bg-slate-800/80 border-slate-700 px-4 py-2">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-400" />
                <span className="text-slate-400 text-sm">总计获得:</span>
                <span className="text-purple-400 font-bold">{totalPoints}</span>
              </div>
            </Card>
          </div>
        </div>
        
        {/* 角色信息 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 mb-4">
            <div 
              className="w-20 h-20 rounded-2xl overflow-hidden border-3 shadow-xl"
              style={{ borderColor: character.color }}
            >
              <img 
                src={character.portrait} 
                alt={character.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `<span class="text-3xl font-bold text-white flex items-center justify-center h-full bg-slate-800">${character.name[0]}</span>`;
                }}
              />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-white">{character.name}的天赋树</h1>
              <p className="text-slate-400">{character.trait}</p>
            </div>
          </div>
          
          {/* 已激活效果预览 */}
          {talentEffects && (
            <div className="flex flex-wrap justify-center gap-2">
              {talentEffects.drawBonus > 0 && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  +{talentEffects.drawBonus} 抽牌
                </Badge>
              )}
              {talentEffects.damageBonus > 0 && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  +{talentEffects.damageBonus} 伤害
                </Badge>
              )}
              {talentEffects.shieldBonus > 0 && (
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  +{talentEffects.shieldBonus}% 护盾
                </Badge>
              )}
              {talentEffects.critRate > 0 && (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  +{talentEffects.critRate}% 暴击
                </Badge>
              )}
              {talentEffects.shopDiscount > 0 && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  -{talentEffects.shopDiscount}% 商店价格
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {/* 两条路径 */}
        <div className="flex justify-center gap-6 mb-8">
          {renderPathColumn('A')}
          {renderPathColumn('B')}
        </div>
        
        {/* 底部提示 */}
        <div className="text-center text-slate-500 text-sm">
          <p>💡 提示: 击败敌人获得天赋点，解锁天赋获得永久加成</p>
          <p className="mt-1">普通战斗+1点 | 精英战斗+2点 | Boss战斗+3点</p>
        </div>
      </div>
    </div>
  );
}
