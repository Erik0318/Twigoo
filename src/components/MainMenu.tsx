import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Terminal, Code2, Music, Sparkles, Cpu, Heart, Zap, Play, Settings, LogOut } from 'lucide-react';
import { Settings as SettingsPanel } from './Settings';

interface MainMenuProps {
  onStartGame: () => void;
  onPlayBGM?: () => void;
  onVolumeChange?: (bgmVolume: number, sfxVolume: number) => void;
}

export function MainMenu({ onStartGame, onPlayBGM, onVolumeChange }: MainMenuProps) {
  const [showSettings, setShowSettings] = useState(false);
  // 尝试播放BGM
  useEffect(() => {
    const handleInteraction = () => {
      onPlayBGM?.();
      document.removeEventListener('click', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);
    return () => document.removeEventListener('click', handleInteraction);
  }, [onPlayBGM]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* 背景网格 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
        {/* 代码装饰 */}
        <div className="absolute top-10 left-10 text-green-400 font-mono text-xs animate-pulse">
          {'{'} "band": "MyGO!!!!!", "status": "coding" {'}'}
        </div>
        <div className="absolute top-20 right-16 text-blue-400 font-mono text-xs">
          const dream = await fetch('tomorrow');
        </div>
        <div className="absolute bottom-32 left-20 text-purple-400 font-mono text-xs">
          while (alive) {'{'} code(); dream(); {'}'}
        </div>
        <div className="absolute bottom-20 right-24 text-cyan-400 font-mono text-xs">
          import {'{'} courage, hope {'}'} from 'life';
        </div>
        <div className="absolute top-1/3 left-5 text-pink-400 font-mono text-xs">
          console.log("一生バンド！");
        </div>
        <div className="absolute top-1/2 right-8 text-yellow-400 font-mono text-xs">
          git commit -m "迷子でもいい"
        </div>
        
        {/* 渐变光晕 */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
        
        {/* 浮动粒子 */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-400/50 rounded-full animate-bounce" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-blue-400/50 rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-purple-400/50 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-cyan-400/50 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* 主内容区 */}
      <div className="z-10 flex flex-col items-center">
        {/* Logo区域 - 带背景卡片 */}
        <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-sm p-8 mb-8">
          {/* 游戏徽标 */}
          <div className="mb-6">
            <img 
              src="/logo.png" 
              alt="BanG Dream! Our Codes"
              className="w-64 h-auto drop-shadow-2xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>

          {/* 副标题 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-green-400" />
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-blue-400" />
              </div>
              <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <Music className="w-5 h-5 text-pink-400" />
              </div>
            </div>
            <p className="text-xl text-slate-300 font-mono mb-2">MyGO!!!!!程序员物语</p>
            <p className="text-sm text-slate-500">硬件管理 × 角色增益 × 肉鸽闯关</p>
          </div>
        </Card>
        
        {/* 特色标签 */}
        <div className="mb-10 flex gap-2 justify-center flex-wrap">
          <Card className="bg-slate-800/60 border-slate-700 px-3 py-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-300 text-sm">60张卡牌</span>
          </Card>
          <Card className="bg-slate-800/60 border-slate-700 px-3 py-2 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 text-sm">18种敌人</span>
          </Card>
          <Card className="bg-slate-800/60 border-slate-700 px-3 py-2 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400" />
            <span className="text-slate-300 text-sm">5个角色</span>
          </Card>
          <Card className="bg-slate-800/60 border-slate-700 px-3 py-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-slate-300 text-sm">4层关卡</span>
          </Card>
        </div>

        {/* 按钮组 */}
        <div className="flex flex-col gap-3 w-64">
          <Button 
            onClick={onStartGame}
            className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-mono py-6 text-lg shadow-lg shadow-green-500/20 transition-all hover:scale-105 hover:shadow-green-500/30"
          >
            <Play className="w-5 h-5 mr-2" />
            开始游戏
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowSettings(true)}
            className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white font-mono py-5 transition-all hover:scale-105"
          >
            <Settings className="w-5 h-5 mr-2" />
            设置
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.close()}
            className="border-slate-600 text-slate-300 hover:bg-red-900/30 hover:text-red-400 hover:border-red-500/50 font-mono py-5 transition-all hover:scale-105"
          >
            <LogOut className="w-5 h-5 mr-2" />
            退出
          </Button>
        </div>

        {/* 设置面板 */}
        <SettingsPanel 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)}
          onVolumeChange={onVolumeChange}
        />
      </div>

      {/* 版本信息 */}
      <div className="absolute bottom-4 text-slate-600 text-xs font-mono">
        v4.0 | 2026.02.12 | 平衡性重置版 | Bang Dream! Our Codes
      </div>
    </div>
  );
}
