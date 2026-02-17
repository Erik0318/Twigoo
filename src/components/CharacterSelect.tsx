import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Zap, Sparkles } from 'lucide-react';
import { characters } from '@/data/characters';

interface CharacterSelectProps {
  onSelect: (characterId: string) => void;
  onBack: () => void;
}

export function CharacterSelect({ onSelect, onBack }: CharacterSelectProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // 所有5个角色都可用
  const availableCharacters = characters;

  const selectedCharacter = availableCharacters.find(c => c.id === selectedId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* 返回按钮 */}
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回
      </Button>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2 font-mono">选择程序员</h2>
          <p className="text-slate-400">选择你的初始角色，每个角色有独特的特质和专属卡牌</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 角色列表 */}
          <div className="space-y-3">
            {availableCharacters.map((character) => (
              <Card
                key={character.id}
                className={`cursor-pointer transition-all border-2 ${
                  selectedId === character.id 
                    ? 'border-green-500 bg-slate-800 shadow-lg shadow-green-500/20' 
                    : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-600'
                }`}
                onClick={() => setSelectedId(character.id)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  {/* 角色立绘 */}
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden border-2"
                    style={{ borderColor: character.color }}
                  >
                    <img 
                      src={character.portrait} 
                      alt={character.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<span class="text-2xl font-bold text-white flex items-center justify-center h-full">${character.name[0]}</span>`;
                      }}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white">{character.name}</h3>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: character.color, color: character.color }}
                      >
                        {character.trait}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-red-400" />
                        {character.maxEnergy}
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        6张专属卡
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 角色详情 */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6">
            {selectedCharacter ? (
              <div>
                <div 
                  className="w-32 h-32 rounded-xl mx-auto mb-6 flex items-center justify-center overflow-hidden border-2"
                  style={{ borderColor: selectedCharacter.color }}
                >
                  <img 
                    src={selectedCharacter.portrait} 
                    alt={selectedCharacter.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `<span class="text-4xl font-bold text-white flex items-center justify-center h-full">${selectedCharacter.name[0]}</span>`;
                    }}
                  />
                </div>
                
                <h3 className="text-2xl font-bold text-white text-center mb-1">
                  {selectedCharacter.name}
                </h3>
                <p 
                  className="text-center mb-4 font-medium"
                  style={{ color: selectedCharacter.color }}
                >
                  {selectedCharacter.trait}
                </p>
                
                <div className="bg-slate-900/80 rounded-xl p-4 mb-6">
                  <p className="text-slate-300 text-sm leading-relaxed text-center">
                    {selectedCharacter.traitDescription}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-900/60 rounded-xl p-4 text-center">
                    <p className="text-slate-500 text-xs mb-1">最大精力</p>
                    <div className="flex items-center justify-center gap-1">
                      <Heart className="w-4 h-4 text-red-400" />
                      <p className="text-white font-bold text-xl">{selectedCharacter.maxEnergy}</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-4 text-center">
                    <p className="text-slate-500 text-xs mb-1">专属卡牌</p>
                    <div className="flex items-center justify-center gap-1">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      <p className="text-white font-bold text-xl">6张</p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => onSelect(selectedCharacter.id)}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white py-6 text-lg"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  选择 {selectedCharacter.name}
                </Button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20">
                <Sparkles className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">选择一个角色查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
