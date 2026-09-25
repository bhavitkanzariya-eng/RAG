export interface IEmbeddingService {
  embedText(text: string): Promise<number[]>;
  embedTexts(texts: string[]): Promise<number[][]>;
}

class OpenAIEmbeddingService implements IEmbeddingService {
  private apiKey: string;
  private model: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor(apiKey: string, model: string = 'text-embedding-3-small') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const embeddings = await this.embedTexts([text]);
      return embeddings[0];
    } catch (error) {
      console.error('Error embedding text:', error);
      throw error;
    }
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch(`${this.baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: texts,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.map((item: { embedding: number[] }) => item.embedding);
    } catch (error) {
      console.error('Error embedding texts:', error);
      throw error;
    }
  }
}

// Singleton instance
let embeddingService: IEmbeddingService | null = null;

export function getEmbeddingService(): IEmbeddingService {
  const apiKey = process.env.EMBEDDING_API_KEY;
  const model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

  if (!apiKey) {
    throw new Error('EMBEDDING_API_KEY is not set');
  }

  return new OpenAIEmbeddingService(apiKey, model);
}

export function getEmbeddingServiceInstance(): IEmbeddingService {
  if (!embeddingService) {
    embeddingService = getEmbeddingService();
  }
  return embeddingService;
}
