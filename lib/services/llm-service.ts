export interface LLMRequest {
  question: string;
  context: string;
  systemPrompt: string;
  temperature?: number;
  model?: string;
}

export interface LLMResponse {
  answer: string;
  model: string;
  usageTokens?: number;
}

export interface ILLMService {
  chat(request: LLMRequest): Promise<LLMResponse>;
}

class OpenAILLMService implements ILLMService {
  private apiKey: string;
  private defaultModel: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.defaultModel = model;
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    try {
      const model = request.model || this.defaultModel;
      const temperature = request.temperature ?? 0.7;

      const systemPrompt = `${request.systemPrompt}

CONTEXT:
${request.context}`;

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature,
          max_tokens: 2048,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: request.question,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const answer = data.choices[0].message.content || '';

      return {
        answer,
        model,
        usageTokens:
          (data.usage?.prompt_tokens || 0) +
          (data.usage?.completion_tokens || 0),
      };
    } catch (error) {
      console.error('Error calling OpenAI LLM:', error);
      throw error;
    }
  }
}

// Singleton instance
let llmService: ILLMService | null = null;

export function getLLMService(): ILLMService {
  const provider = process.env.LLM_PROVIDER || 'openai';
  const apiKey = process.env.LLM_API_KEY;

  if (!apiKey) {
    throw new Error(`LLM_API_KEY is not set`);
  }

  if (provider === 'openai') {
    const model = process.env.LLM_MODEL || 'gpt-4o-mini';
    return new OpenAILLMService(apiKey, model);
  } else {
    throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

export function getLLMServiceInstance(): ILLMService {
  if (!llmService) {
    llmService = getLLMService();
  }
  return llmService;
}
