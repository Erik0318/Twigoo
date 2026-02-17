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

// 角色立绘背景映射
const characterIllustrations: Record<string, string> = {
  tomori: '/characters/tomoribb.png',
  anon: '/characters/anonbb.png',
  rana: '/characters/ranabb.png',
  soyo: '/characters/soyobb.png',
  taki: '/characters/takibb.png',
};

export function CharacterSelect({ onSelect, onBack }: CharacterSelectProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // 所有5个角色都可用
  const availableCharacters = characters;

  const selectedCharacter = availableCharacters.find(c => c.id === selectedId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-8 relative overflow-hidden">
      {/* 版本号 */}
      <div className="absolute top-4 right-4 z-10">
        <Badge 
          variant="outline" 
          className="text-xs bg-slate-900/80 border-slate-600 text-slate-400 font-mono"
        >
          α1 版本
        </Badge>
      </div>

      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-green-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
      </div>

      {/* 返回按钮 */}
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="text-slate-400 hover:text-white mb-6 relative z-10"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回
      </Button>

      <div className="max-w-6xl mx-auto relative z-10">
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
                  {/* 角色头像 */}
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

          {/* 角色详情 - 带立绘背景 */}
          <div className="relative bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden min-h-[500px]">
            {/* 立绘背景 */}
            {selectedCharacter && characterIllustrations[selectedCharacter.id] && (
              <div className="absolute inset-0 z-0">
                <img 
                  src={characterIllustrations[selectedCharacter.id]} 
                  alt={`${selectedCharacter.name} 立绘`}
                  className="w-full h-full object-cover opacity-30"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                {/* 渐变遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-transparent to-slate-900/60" />
              </div>
            )}
            
            {/* 默认背景（未选择角色时） */}
            {!selectedCharacter && (
              <div className="absolute inset-0 z-0">
                <img 
                  src="/characters/code.png" 
                  alt="代码背景"
                  className="w-full h-full object-cover opacity-20"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/90 to-slate-900/70" />
              </div>
            )}

            {/* 内容 */}
            <div className="relative z-10 p-6 h-full">
              {selectedCharacter ? (
                <div className="flex flex-col h-full">
                  {/* 角色头像 */}
                  <div 
                    className="w-24 h-24 rounded-xl mx-auto mb-4 flex items-center justify-center overflow-hidden border-2 shadow-lg"
                    style={{ borderColor: selectedCharacter.color, boxShadow: `0 0 20px ${selectedCharacter.color}40` }}
                  >
                    <img 
                      src={selectedCharacter.portrait} 
                      alt={selectedCharacter.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<span class="text-3xl font-bold text-white flex items-center justify-center h-full">${selectedCharacter.name[0]}</span>`;
                      }}
                    />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white text-center mb-1 drop-shadow-lg">
                    {selectedCharacter.name}
                  </h3>
                  <p 
                    className="text-center mb-4 font-medium drop-shadow-md"
                    style={{ color: selectedCharacter.color }}
                  >
                    {selectedCharacter.trait}
                  </p>
                  
                  <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 mb-6 border border-slate-700/50">
                    <p className="text-slate-200 text-sm leading-relaxed text-center">
                      {selectedCharacter.traitDescription}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 text-center border border-slate-700/50">
                      <p className="text-slate-400 text-xs mb-1">最大精力</p>
                      <div className="flex items-center justify-center gap-1">
                        <Heart className="w-4 h-4 text-red-400" />
                        <p className="text-white font-bold text-xl">{selectedCharacter.maxEnergy}</p>
                      </div>
                    </div>
                    <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 text-center border border-slate-700/50">
                      <p className="text-slate-400 text-xs mb-1">专属卡牌</p>
                      <div className="flex items-center justify-center gap-1">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <p className="text-white font-bold text-xl">6张</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <Button 
                      onClick={() => onSelect(selectedCharacter.id)}
                      className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white py-6 text-lg shadow-lg shadow-green-500/20"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      选择 {selectedCharacter.name}
                    </Button>
                  </div>
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
    </div>
  );
}
