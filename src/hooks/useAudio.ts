/**
 * 音频管理Hook
 * 负责背景音乐(BGM)和音效(SFX)的播放、音量控制
 * 支持音量设置的持久化存储(localStorage)
 */

import { useRef, useCallback, useState } from 'react';

// ==================== 音效文件映射 ====================
// 所有音效文件路径，用于playSFX函数调用
const soundEffects = {
  // UI音效
  buttonClick: '/audio/Enigma_哔哩哔哩_bilibili.mp3',  // 按钮点击
  cardPlay: '/audio/movement_哔哩哔哩_bilibili.mp3',    // 打出卡牌
  cardDraw: '/audio/Research_哔哩哔哩_bilibili.mp3',    // 抽牌
  
  // 战斗音效
  attack: '/audio/Eagle Claws_哔哩哔哩_bilibili.mp3',   // 攻击
  damage: '/audio/Carpet Bombing_哔哩哔哩_bilibili.mp3', // 受到伤害
  shield: '/audio/Lamp_哔哩哔哩_bilibili.mp3',          // 获得护盾
  enemyDeath: '/audio/Last Rites_哔哩哔哩_bilibili.mp3', // 敌人死亡
  
  // 系统音效
  victory: '/audio/Final Push_哔哩哔哩_bilibili.mp3',   // 胜利
  defeat: '/audio/Lurking Danger_哔哩哔哩_bilibili.mp3', // 失败
  money: '/audio/Biplanes_哔哩哔哩_bilibili.mp3',       // 获得金钱
  heal: '/audio/Reinforcements_哔哩哔哩_bilibili.mp3',   // 恢复精力
};

// ==================== 背景音乐配置 ====================
// 不同场景使用不同的BGM文件
const bgm = {
  menu: '/audio/bgm.mp3',    // 主菜单/地图 - 迷路日々
  combat: '/audio/bgm2.mp3', // 战斗场景 - 用户提供的BGM
  boss: '/audio/bgm3.mp3',   // Boss战 - 用户提供的BGM
};

// BGM播放状态（全局，用于保持播放连续性）
let globalBgmAudio: HTMLAudioElement | null = null;
let globalBgmType: string | null = null;

/**
 * 从localStorage读取音量设置
 * @returns {Object} 包含bgmVolume和sfxVolume的对象
 */
function loadVolumeSettings() {
  const saved = localStorage.getItem('bangdream_settings');
  if (saved) {
    const settings = JSON.parse(saved);
    return {
      bgmVolume: settings.bgmVolume ?? 0.3,
      sfxVolume: settings.sfxVolume ?? 0.5
    };
  }
  return { bgmVolume: 0.3, sfxVolume: 0.5 };
}

/**
 * useAudio Hook
 * 提供音频播放、音量控制功能
 */
export function useAudio() {
  // 使用ref追踪音效实例，用于停止重复播放
  const sfxRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  // 音量状态
  const [volumes, setVolumes] = useState(loadVolumeSettings());

  /**
   * 更新音量设置
   * @param bgmVolume 背景音乐音量 (0-1)
   * @param sfxVolume 音效音量 (0-1)
   */
  const updateVolumes = useCallback((bgmVolume: number, sfxVolume: number) => {
    setVolumes({ bgmVolume, sfxVolume });
    // 实时更新当前播放的BGM音量
    if (globalBgmAudio) {
      globalBgmAudio.volume = bgmVolume;
    }
  }, []);

  /**
   * 播放背景音乐
   * 关键特性：同类型BGM切换时保持播放进度，不从头开始
   * @param type BGM类型: 'menu' | 'combat' | 'boss'
   */
  const playBGM = useCallback((type: 'menu' | 'combat' | 'boss') => {
    // 如果正在播放同类型的BGM，不做任何操作（保持播放进度）
    if (globalBgmType === type && globalBgmAudio && !globalBgmAudio.paused) {
      return;
    }
    
    // 停止当前BGM
    if (globalBgmAudio) {
      globalBgmAudio.pause();
    }
    
    // 创建新的BGM音频
    const audio = new Audio(bgm[type]);
    audio.loop = true;
    audio.volume = volumes.bgmVolume;
    
    // 用户交互后播放
    const playAudio = () => {
      audio.play().catch(() => {
        // 自动播放被阻止，等待用户交互
      });
    };
    
    playAudio();
    
    // 更新全局BGM状态
    globalBgmAudio = audio;
    globalBgmType = type;
    
    return () => {
      audio.pause();
    };
  }, [volumes.bgmVolume]);

  /**
   * 停止背景音乐
   */
  const stopBGM = useCallback(() => {
    if (globalBgmAudio) {
      globalBgmAudio.pause();
      globalBgmAudio.currentTime = 0;
      globalBgmAudio = null;
      globalBgmType = null;
    }
  }, []);

  /**
   * 播放音效（一次性播放，不循环）
   * @param type 音效类型，对应soundEffects中的键
   */
  const playSFX = useCallback((type: keyof typeof soundEffects) => {
    // 如果音量为0，跳过播放
    if (volumes.sfxVolume <= 0) return;

    const audio = new Audio(soundEffects[type]);
    audio.volume = volumes.sfxVolume;
    audio.loop = false; // 确保不循环
    
    // 检查是否已经有同类型的音效在播放，如果有则停止旧音效
    const existingAudio = sfxRefs.current.get(type);
    if (existingAudio) {
      existingAudio.pause();
      existingAudio.currentTime = 0;
    }
    
    audio.play().catch(() => {
      // 播放失败（可能是浏览器自动播放策略）
    });
    
    sfxRefs.current.set(type, audio);
    
    // 播放完成后清理引用
    audio.onended = () => {
      sfxRefs.current.delete(type);
    };
  }, [volumes.sfxVolume]);

  return {
    playBGM,      // 播放背景音乐
    stopBGM,      // 停止背景音乐
    playSFX,      // 播放音效
    updateVolumes,// 更新音量
    volumes       // 当前音量设置
  };
}
