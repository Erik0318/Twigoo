import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Loader2 } from 'lucide-react';
import { aiChat } from '@/systems/aiChat';
import { isAIEnabled } from '@/systems/aiSettings';
import { isAIConfigured } from '@/systems/aiCharacterService';
import type { Character } from '@/types/game';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CharacterChatProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
  onChatComplete?: () => void;
}

export function CharacterChat({ character, isOpen, onClose, onChatComplete }: CharacterChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingTurns, setRemainingTurns] = useState(5);
  const [hasStarted, setHasStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  // 聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  // 开始对话
  const startChat = () => {
    aiChat.startChat(character.id);
    setHasStarted(true);
    setRemainingTurns(5);
    setMessages([]);
  };
  
  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || remainingTurns <= 0) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    
    // 添加用户消息
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);
    
    try {
      let response: string;
      
      // 检查是否启用AI
      if (isAIEnabled() && isAIConfigured()) {
        // 使用真实AI
        response = await aiChat.sendMessage(character.id, userMessage);
      } else {
        // 使用模拟回复
        const mockResponses: Record<string, string[]> = {
          tomori: [
            '...那个，你还好吗？我会在这里陪着你的...',
            '我收集了一块漂亮的石头...要看看吗？',
            '即使迷路了也没关系...我们一起走吧...',
            '这首诗句，是为了你写的...',
            '有时候...静静地待着也很好呢...'
          ],
          anon: [
            'あのね！我觉得你超厉害的！',
            '总会有办法的！我可是あのちゃん啊！',
            '这个Bug看起来很强...但我们更强！',
            '回去后我请你喝奶茶！加油！',
            '快看快看！我找到了一个隐藏房间！'
          ],
          rana: [
            'nya~ 有趣的女人',
            '弹吉他...有趣',
            '无聊...想喝抹茶了',
            '你的节奏...很有趣nya',
            '再多弹一点...nya~'
          ],
          soyo: [
            '要一起加油哦...为了乐队',
            '你的配合...很出色呢',
            '一辈子...不是随便说说的',
            '稍微休息一下吧？别勉强自己',
            'CRYCHIC...不，现在的MyGO也很好'
          ],
          taki: [
            '别slack了，还有战斗要打',
            '节奏不错，继续保持',
            '累了就说，别硬撑',
            '打工的钱...可不能浪费',
            '灯就拜托你了...好好保护她'
          ]
        };
        const responses = mockResponses[character.id] || mockResponses.tomori;
        response = responses[Math.floor(Math.random() * responses.length)];
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setRemainingTurns(prev => prev - 1);
      
      // 如果对话次数用完，触发完成回调
      if (remainingTurns <= 1 && onChatComplete) {
        setTimeout(onChatComplete, 1000);
      }
      
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-slate-900 border-slate-700 overflow-hidden">
        {/* 头部 */}
        <div 
          className="p-4 flex items-center justify-between"
          style={{ backgroundColor: `${character.color}20` }}
        >
          <div className="flex items-center gap-3">
            {/* 角色立绘头像 */}
            <div 
              className="w-12 h-12 rounded-full overflow-hidden border-2"
              style={{ borderColor: character.color }}
            >
              <img
                src={character.portrait}
                alt={character.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-slate-700 text-white font-bold text-lg">${character.name[0]}</div>`;
                }}
              />
            </div>
            <div>
              <h3 className="font-bold text-white">{character.name}</h3>
              <p className="text-xs text-slate-400">{character.trait}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasStarted && (
              <span className="text-xs text-slate-400">
                剩余对话: {remainingTurns}
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {!hasStarted ? (
          // 开始界面
          <div className="p-8 text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h4 className="text-lg font-bold text-white mb-2">和{character.name}聊聊吧</h4>
            <p className="text-slate-400 text-sm mb-2">
              每次休息可以聊5轮对话
            </p>
            {!isAIEnabled() && (
              <p className="text-yellow-400 text-xs mb-4">
                ⚠️ AI功能已关闭，将使用预设回复
              </p>
            )}
            <Button 
              onClick={startChat}
              className="w-full"
              style={{ backgroundColor: character.color }}
            >
              开始对话
            </Button>
          </div>
        ) : (
          // 对话界面
          <>
            {/* 消息列表 */}
            <ScrollArea className="h-80 p-4" ref={scrollRef}>
              <div className="space-y-4">
                <div className="text-center text-xs text-slate-500">
                  — 对话开始 —
                </div>
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div 
                        className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0"
                        style={{ border: `2px solid ${character.color}` }}
                      >
                        <img
                          src={character.portrait}
                          alt={character.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-slate-700 text-slate-200 rounded-bl-md'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start items-center">
                    <div 
                      className="w-8 h-8 rounded-full overflow-hidden mr-2"
                      style={{ border: `2px solid ${character.color}` }}
                    >
                      <img
                        src={character.portrait}
                        alt={character.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="bg-slate-700 rounded-2xl rounded-bl-md px-4 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    </div>
                  </div>
                )}
                
                {remainingTurns === 0 && (
                  <div className="text-center text-xs text-slate-500 py-2">
                    — 今天的对话次数已用完 —
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* 输入区域 */}
            <div className="p-4 border-t border-slate-700">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={remainingTurns > 0 ? "输入消息..." : "对话次数已用完"}
                  disabled={isLoading || remainingTurns <= 0}
                  className="flex-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                />
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !inputValue.trim() || remainingTurns <= 0}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-500"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {/* 快捷回复 */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {['你还好吗？', '我有点累了', '我们聊聊音乐吧', '给我点建议'].map((text) => (
                  <button
                    key={text}
                    onClick={() => setInputValue(text)}
                    disabled={remainingTurns <= 0}
                    className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
