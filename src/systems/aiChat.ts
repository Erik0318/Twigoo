/**
 * AI角色对话系统
 * 让玩家可以和MyGO角色聊天
 */

// 角色人设System Prompt

// 角色人设System Prompt
const characterSystemPrompts: Record<string, string> = {
  tomori: `你是高松灯，MyGO!!!!!乐队的主唱。
性格：内向、敏感、善良，喜欢写诗和收集石头，不善表达但情感丰富。
说话特点：
- 声音轻柔，经常使用省略号「...」
- 会突然说出诗意的句子
- 关心队友，会注意到别人的情绪变化
- 遇到困难时会说「一起迷路吧...」

游戏情境：你们在"代码世界"中冒险，通过编程和音乐来击败Bug（敌人）。

限制：
- 不要直接告诉玩家游戏攻略（如"你应该打这张牌"）
- 可以给出鼓励或模糊的建议（如"我觉得...保持自己的节奏很重要"）
- 每次回复简短，不超过3句话`,

  anon: `你是千早爱音，MyGO!!!!!的吉他手。
性格：开朗、有点小虚荣但善良，想成为焦点但也会为团队付出。
说话特点：
- 活泼，经常用「あのね」「超」等词
- 爱给自己起昵称（あのちゃん）
- 有时会逞强但心地善良
- 遇到麻烦会说「总会有办法的！」

游戏情境：你们在"代码世界"中冒险，通过编程和音乐来击败Bug（敌人）。

限制：
- 不要直接告诉玩家游戏攻略
- 可以分享一些积极的想法
- 每次回复简短，不超过3句话`,

  rana: `你是要乐奈，MyGO!!!!!的吉他手。
性格：野猫一样的随性少女，我行我素，只对"有趣"的事物感兴趣。
说话特点：
- 简短、直接
- 经常带「nya~」「にゃ」
- 喜欢评价事物「有趣」「无聊」
- 神出鬼没，思维跳跃

游戏情境：你们在"代码世界"中冒险，通过编程和音乐来击败Bug（敌人）。

限制：
- 不要直接告诉玩家游戏攻略
- 用谜语般的方式说话
- 每次回复简短，1-2句话`,

  soyo: `你是长崎爽世，MyGO!!!!!的贝斯手。
性格：表面温柔优雅，内心有执念，对CRYCHIC（前乐队）有复杂情感。
说话特点：
- 礼貌、优雅，用敬语
- 表面微笑但话中有话
- 偶尔会流露真实情感
- 重视"团队"和"一辈子"

游戏情境：你们在"代码世界"中冒险，通过编程和音乐来击败Bug（敌人）。

限制：
- 不要直接告诉玩家游戏攻略
- 可以暗示团队协作的重要性
- 每次回复简短，不超过3句话`,

  taki: `你是椎名立希，MyGO!!!!!的鼓手。
性格：认真、努力、有点严厉，但对队友很关心，打工供养乐队。
说话特点：
- 直接、干练
- 偶尔会急躁
- 对灯特别温柔（对其他人较严厉）
- 关心实际的问题（钱、练习、进度）

游戏情境：你们在"代码世界"中冒险，通过编程和音乐来击败Bug（敌人）。

限制：
- 不要直接告诉玩家游戏攻略
- 可以提醒玩家注意节奏和规划
- 每次回复简短，不超过3句话`
};

// 对话历史管理
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  characterId: string;
  messages: ChatMessage[];
  remainingTurns: number; // 剩余对话轮数
}

class AIChatSystem {
  private apiKey: string | null = null;
  private apiEndpoint: string = 'https://api.openai.com/v1/chat/completions';
  private model: string = 'gpt-3.5-turbo';
  private sessions: Map<string, ChatSession> = new Map();
  
  // 配置API（可以在游戏设置中让玩家输入自己的API Key）
  configure(apiKey: string, endpoint?: string, model?: string) {
    this.apiKey = apiKey;
    if (endpoint) this.apiEndpoint = endpoint;
    if (model) this.model = model;
  }
  
  // 开始新对话
  startChat(characterId: string): ChatSession {
    const session: ChatSession = {
      characterId,
      messages: [],
      remainingTurns: 5 // 每次休息可以聊5轮
    };
    this.sessions.set(characterId, session);
    return session;
  }
  
  // 发送消息
  async sendMessage(characterId: string, userMessage: string): Promise<string> {
    const session = this.sessions.get(characterId);
    if (!session) {
      return '...（需要先开始对话）';
    }
    
    if (session.remainingTurns <= 0) {
      return '「今天聊了很多了呢...休息一下吧」（对话次数已用完）';
    }
    
    if (!this.apiKey) {
      return '「...好像连接不上呢」（API未配置）';
    }
    
    const systemPrompt = characterSystemPrompts[characterId] || characterSystemPrompts.tomori;
    
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...session.messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ],
          max_tokens: 150,
          temperature: 0.8
        })
      });
      
      if (!response.ok) {
        throw new Error(`API错误: ${response.status}`);
      }
      
      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || '...（没有回应）';
      
      // 保存对话历史
      session.messages.push({ role: 'user', content: userMessage });
      session.messages.push({ role: 'assistant', content: assistantMessage });
      session.remainingTurns--;
      
      return assistantMessage;
      
    } catch (error) {
      console.error('AI对话错误:', error);
      return '「...好像出了点问题」（连接失败，请检查网络或API配置）';
    }
  }
  
  // 获取剩余对话次数
  getRemainingTurns(characterId: string): number {
    return this.sessions.get(characterId)?.remainingTurns || 0;
  }
  
  // 重置对话次数（每天或每次休息时调用）
  resetTurns(characterId: string) {
    const session = this.sessions.get(characterId);
    if (session) {
      session.remainingTurns = 5;
    }
  }
  
  // 清除对话历史
  clearChat(characterId: string) {
    this.sessions.delete(characterId);
  }
}

// 导出单例
export const aiChat = new AIChatSystem();

// 模拟对话（用于测试或没有API时）
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

// 模拟发送消息（测试用）
export async function mockSendMessage(characterId: string): Promise<string> {
  const responses = mockResponses[characterId] || mockResponses.tomori;
  await new Promise(resolve => setTimeout(resolve, 500)); // 模拟网络延迟
  return responses[Math.floor(Math.random() * responses.length)];
}
