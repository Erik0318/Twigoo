/**
 * AI角色对话配置文件
 * 在此填写您的API信息
 */

import { configureAI } from '@/systems/aiCharacterService';

// ==================== API配置 ====================

// 方式1：OpenAI官方（需要海外支付方式）
// export const AI_CONFIG = {
//   apiEndpoint: 'https://api.openai.com/v1/chat/completions',
//   apiKey: 'sk-your-openai-api-key-here',
//   model: 'gpt-3.5-turbo'
// };

// 方式2：Moonshot AI（国内可用，免费额度 generous）
// 官网：https://platform.moonshot.cn/
// export const AI_CONFIG = {
//   apiEndpoint: 'https://api.moonshot.cn/v1/chat/completions',
//   apiKey: 'sk-your-moonshot-api-key-here',
//   model: 'moonshot-v1-8k' // 或 'moonshot-v1-32k'
// };

// 方式3：阿里云通义千问
// 官网：https://dashscope.aliyun.com/
// export const AI_CONFIG = {
//   apiEndpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
//   apiKey: 'sk-your-dashscope-api-key-here',
//   model: 'qwen-turbo' // 或 'qwen-plus', 'qwen-max'
// };

// 方式4：百度文心一言
// 官网：https://cloud.baidu.com/product/wenxinworkshop
// export const AI_CONFIG = {
//   apiEndpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
//   apiKey: 'your-baidu-api-key',
//   model: 'ernie-bot-turbo'
// };

// 方式5：DeepSeek（性价比高）✅ 已配置
// 官网：https://platform.deepseek.com/
export const AI_CONFIG = {
  apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
  apiKey: 'sk-6f207d5a0de1461ab4aa2127a6a67b5b',
  model: 'deepseek-chat',
  maxTokens: 150,
  temperature: 0.8
};

// ==================== 初始化 ====================
// 如果配置了API，自动初始化
if (AI_CONFIG.apiEndpoint && AI_CONFIG.apiKey) {
  configureAI(AI_CONFIG);
  console.log('[AI] DeepSeek 已配置，使用真实AI模式');
} else {
  console.log('[AI] 未配置API，使用模拟模式');
}

// ==================== 使用说明 ====================
/*
1. 选择上方的API提供商，取消对应配置的注释
2. 填入你的API Key
3. 保存文件，刷新游戏
4. 角色就会使用真实AI回复了

推荐的免费/低成本方案：
- Moonshot AI：注册送15元额度，足够玩很久
- DeepSeek：价格便宜，效果接近GPT-3.5
- 通义千问：阿里云，有免费额度

注意：
- 不要将包含真实API Key的文件提交到git
- 可以在 .gitignore 中添加 src/config/ai.config.ts
*/
