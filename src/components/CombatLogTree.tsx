/**
 * 战斗日志树状组件 - /tree 风格
 * 类似文件系统目录树，展示战斗历史
 */

import { useRef, useEffect, useState } from 'react';
import type { GameState, CombatLogEntry } from '@/types/game';
import { Terminal, X, Bug, GitCommit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CombatLogTreeProps {
  gameState: GameState;
  isOpen: boolean;
  onToggle: () => void;
}

// 树状节点类型
interface TreeNode {
  id: string;
  type: 'turn' | 'player' | 'enemy' | 'system';
  content: string;
  details?: string;
  value?: number;
  children: TreeNode[];
  timestamp: number;
}

// 程序梗风格的文件扩展名映射
const getFileExtension = (type: string) => {
  const extensions: Record<string, string> = {
    player_card: '.atk',
    enemy_action: '.atk',
    damage: '.dmg',
    player_damage: '.dmg',
    shield: '.def',
    heal: '.heal',
    status: '.status',
    special: '.exe',
  };
  return extensions[type] || '.log';
};

// 程序梗风格的目录名
const getDirectoryName = (turn: number, isPlayer: boolean) => {
  const prefixes = ['root', 'home', 'var', 'tmp', 'usr', 'bin', 'dev'];
  const prefix = prefixes[turn % prefixes.length];
  return `${prefix}/turn_${turn}_${isPlayer ? 'user' : 'kernel'}`;
};

// 程序梗风格的操作描述
const getOperationName = (entry: CombatLogEntry) => {
  const operations: Record<string, string> = {
    'player_card': 'execute',
    'enemy_action': 'process',
    'damage': 'calc_damage',
    'player_damage': 'calc_damage',
    'heal': 'restore_hp',
    'shield': 'allocate_buffer',
    'status': 'syscall',
  };
  return operations[entry.type] || 'unknown_op';
};

// 去重日志：基于描述和回合数去重
const deduplicateLogs = (logs: CombatLogEntry[]): CombatLogEntry[] => {
  const seen = new Set<string>();
  return logs.filter(log => {
    const key = `${log.turn}-${log.type}-${log.description}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function CombatLogTree({ gameState, isOpen, onToggle }: CombatLogTreeProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  // 去重后的日志
  const uniqueLogs = deduplicateLogs(gameState.combatLog || []);

  // 日志变化时标记需要滚动
  useEffect(() => {
    if (isOpen && uniqueLogs.length > 0) {
      setShouldScroll(true);
    }
  }, [uniqueLogs.length, isOpen]);

  // 在渲染后执行滚动
  useEffect(() => {
    if (shouldScroll && viewportRef.current) {
      const viewport = viewportRef.current;
      viewport.scrollTop = viewport.scrollHeight;
      setShouldScroll(false);
    }
  }, [shouldScroll]);

  // 将战斗日志转换为树状结构
  const buildTree = (): TreeNode[] => {
    const turnMap = new Map<number, TreeNode>();

    uniqueLogs.forEach((log, index) => {
      const turn = log.turn;
      
      // 创建或获取回合节点
      if (!turnMap.has(turn)) {
        turnMap.set(turn, {
          id: `turn-${turn}`,
          type: 'turn',
          content: getDirectoryName(turn, true),
          details: `Round ${turn}`,
          children: [],
          timestamp: index,
        });
      }

      const turnNode = turnMap.get(turn)!;
      
      // 玩家行动：打出卡牌
      const isPlayer = log.type === 'player_card';
      
      // 创建行动节点
      const actionNode: TreeNode = {
        id: `action-${index}`,
        type: isPlayer ? 'player' : 'enemy',
        content: `${getOperationName(log)}${getFileExtension(log.type)}`,
        details: log.description,
        value: log.value,
        children: [],
        timestamp: index,
      };

      turnNode.children.push(actionNode);
    });

    return Array.from(turnMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  };

  const tree = buildTree();

  // 渲染树节点
  const renderNode = (node: TreeNode, depth: number = 0, isLast: boolean = true, prefixes: string[] = []) => {
    const indent = prefixes.join('');
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';

    // 根据类型获取颜色
    const getNodeStyle = () => {
      switch (node.type) {
        case 'turn':
          return 'text-cyan-400 font-bold';
        case 'player':
          return 'text-green-400';
        case 'enemy':
          return 'text-red-400';
        default:
          return 'text-slate-300';
      }
    };

    // 获取图标
    const getNodeIcon = () => {
      switch (node.type) {
        case 'turn':
          return '📁';
        case 'player':
          return '⚔️';
        case 'enemy':
          return '👾';
        default:
          return '📄';
      }
    };

    return (
      <div key={node.id} className="font-mono text-sm">
        <div 
          className={`hover:bg-slate-800/50 px-1 py-0.5 rounded cursor-default group ${getNodeStyle()}`}
          title={node.details}
        >
          <span className="text-slate-600 select-none">{indent}{connector}</span>
          <span className="mr-1">{getNodeIcon()}</span>
          <span>{node.content}</span>
          {node.value && node.value > 0 && (
            <Badge variant="outline" className="ml-2 text-xs h-4 px-1 border-slate-600 text-slate-400">
              {node.value}
            </Badge>
          )}
        </div>
        {node.children.map((child, idx) => 
          renderNode(child, depth + 1, idx === node.children.length - 1, [...prefixes, childPrefix])
        )}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 bg-slate-900/90 border-cyan-500/50 text-cyan-400 hover:bg-slate-800 hover:text-cyan-300 font-mono"
      >
        <Terminal className="w-4 h-4 mr-2" />
        $ tree /var/log/combat
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 h-[500px] bg-slate-950/95 border-cyan-500/30 shadow-2xl shadow-cyan-500/10 flex flex-col">
      {/* 标题栏 - 终端风格 */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-sm text-cyan-400">
            user@mygo-battle:~$ tree /var/log/combat
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 hover:bg-red-500/20" onClick={onToggle}>
            <X className="w-4 h-4 text-slate-400" />
          </Button>
        </div>
      </div>

      {/* 系统信息 */}
      <div className="px-3 py-1.5 bg-slate-900/40 border-b border-slate-800 text-xs font-mono text-slate-500 flex justify-between">
        <span>PID: {gameState.turn}</span>
        <span>TURN: {gameState.isPlayerTurn ? 'USER' : 'KERNEL'}</span>
        <span>HP: {gameState.characters[0]?.currentEnergy}/{gameState.characters[0]?.maxEnergy}</span>
      </div>

      {/* 树状内容 */}
      <ScrollArea className="flex-1">
        <div ref={viewportRef} className="p-3 h-full overflow-y-auto">
          {/* 根目录 */}
          <div className="font-mono text-sm text-cyan-400 mb-2">
            📂 /var/log/combat/
          </div>
          
          {tree.length === 0 ? (
            <div className="font-mono text-sm text-slate-500 pl-4">
              └── <span className="text-slate-600">(empty - waiting for input...)</span>
            </div>
          ) : (
            tree.map((node, idx) => renderNode(node, 0, idx === tree.length - 1))
          )}

          {/* 提示符 */}
          <div className="font-mono text-sm text-green-400 mt-4 animate-pulse">
            <span className="text-cyan-400">user@mygo-battle</span>
            <span className="text-slate-400">:</span>
            <span className="text-blue-400">~</span>
            <span className="text-slate-400">$</span>
            <span className="ml-1">_</span>
          </div>
        </div>
      </ScrollArea>

      {/* 底部状态栏 */}
      <div className="px-3 py-1.5 bg-slate-900/80 border-t border-cyan-500/20 text-xs font-mono">
        <div className="flex justify-between text-slate-500">
          <span>
            <Bug className="w-3 h-3 inline mr-1" />
            {uniqueLogs.length} events
          </span>
          <span>
            <GitCommit className="w-3 h-3 inline mr-1" />
            turn {gameState.turn}
          </span>
        </div>
      </div>
    </Card>
  );
}
