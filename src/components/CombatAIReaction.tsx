import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCombatReaction, mockCombatReaction, isAIConfigured } from '@/systems/aiCharacterService';
import { isAIEnabled } from '@/systems/aiSettings';
import type { CombatStatus, AIResponse } from '@/systems/aiCharacterPrompts';
import type { Character } from '@/types/game';
import { Sparkles, Shield, Swords, Heart, X, ChevronDown } from 'lucide-react';

interface CombatAIReactionProps {
  character: Character;
  combatStatus: CombatStatus;
  turn: number; // 回合数变化时触发
  onAdvice?: (advice: string) => void;
}

export function CombatAIReaction({ character, combatStatus, turn, onAdvice }: CombatAIReactionProps) {
  const [reaction, setReaction] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showThought, setShowThought] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 回合变化时获取AI反应
  useEffect(() => {
    if (turn <= 0) return;
    
    const fetchReaction = async () => {
      setIsLoading(true);
      try {
        let response: AIResponse;
        
        if (isAIEnabled() && isAIConfigured()) {
          response = await getCombatReaction(character.id, combatStatus);
        } else {
          // 使用模拟回复
          response = await mockCombatReaction(character.id);
        }
        
        setReaction(response);
        setShowThought(false); // 新回合重置展开状态
        
        // 如果有建议，传递给父组件
        if (response.thought && onAdvice) {
          onAdvice(response.thought);
        }
      } catch (error) {
        console.error('获取AI反应失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReaction();
  }, [turn, character.id]);

  if (!isVisible) return null;

  // 情绪对应的表情
  const emotionEmojis: Record<string, string> = {
    normal: '',
    happy: '😊',
    worried: '😰',
    excited: '✨',
    serious: '😐',
    relaxed: '😌'
  };

  // 建议类型对应的图标
  const adviceIcons: Record<string, React.ReactNode> = {
    aggressive: <Swords className="w-4 h-4 text-red-400" />,
    defensive: <Shield className="w-4 h-4 text-blue-400" />,
    balanced: <Sparkles className="w-4 h-4 text-yellow-400" />,
    special: <Heart className="w-4 h-4 text-pink-400" />
  };

  // 最小化状态 - 只显示一个小按钮
  if (isCollapsed) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsCollapsed(false)}
        className="fixed bottom-4 left-4 z-30 border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
        style={{ borderColor: `${character.color}50` }}
      >
        {reaction?.adviceType && (
          <span className="mr-2">{adviceIcons[reaction.adviceType]}</span>
        )}
        <span>{character.name}的战况分析</span>
        {reaction?.emotion && (
          <span className="ml-1">{emotionEmojis[reaction.emotion]}</span>
        )}
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
        className="flex items-center justify-between p-3 border-b border-slate-700 cursor-pointer"
        style={{ backgroundColor: `${character.color}10` }}
        onClick={() => setShowThought(!showThought)}
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{character.name}</span>
            {reaction?.emotion && (
              <span className="text-sm">{emotionEmojis[reaction.emotion]}</span>
            )}
            {reaction?.adviceType && (
              <span className="ml-1">{adviceIcons[reaction.adviceType]}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(true);
            }}
            className="text-slate-400 hover:text-white h-8 w-8 p-0"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
            }}
            className="text-slate-400 hover:text-white h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 内容 */}
      <div className="p-4" onClick={() => setShowThought(!showThought)}>
        {isLoading ? (
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2 animate-pulse"
              style={{ borderColor: character.color }}
            >
              <div className="w-full h-full bg-slate-700" />
            </div>
            <div className="flex-1">
              <div className="h-4 bg-slate-700 rounded w-3/4 animate-pulse"></div>
            </div>
          </div>
        ) : reaction ? (
          <div className="space-y-3">
            {/* 台词 */}
            <p className="text-sm text-slate-200 leading-relaxed">
              「{reaction.dialogue}」
            </p>
            
            {/* 内心独白（点击展开） */}
            {showThought && reaction.thought && (
              <div className="pt-3 border-t border-slate-700">
                <p className="text-xs text-slate-400 italic">
                  💭 {reaction.thought}
                </p>
              </div>
            )}
            
            {/* 提示文字 */}
            {reaction.thought && !showThought && (
              <p className="text-xs text-slate-500 text-center">
                点击查看建议
              </p>
            )}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
