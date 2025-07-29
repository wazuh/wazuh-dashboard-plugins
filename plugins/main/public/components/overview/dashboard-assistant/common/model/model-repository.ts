import { IModelRepository } from './domain/types';
import { Model } from './domain/model';
import { IHttpClient } from '../installation-manager/domain/types';

export class ModelRepository implements IModelRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async create(model: Model): Promise<string> {
    const response = await this.httpClient.post(
      '/_plugins/_ml/models/_register',
      model.toApiPayload()
    ) as { model_id: string };
    return response.model_id;
  }

  public async findById(id: string): Promise<Model | null> {
    try {
      const response = await this.httpClient.get(`/_plugins/_ml/models/${id}`);
      return Model.fromResponse(response);
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  public async getAll(): Promise<Model[]> {
    // Mock data for demonstration
    const mockModels = [
      {
        model_id: 'anthropic-claude-1',
        name: 'Anthropic Claude',
        version: 'claude-3-5-sonnet-20241022',
        model_group_id: 'group-1',
        connector_id: 'connector-1',
        description: 'Advanced AI model for complex reasoning and analysis',
        status: 'active',
        created_at: '2024-01-15T10:30:00Z',
        api_url: 'https://api.anthropic.com/v1/messages'
      },
      {
        model_id: 'amazon-titan-2',
        name: 'Amazon Titan',
        version: 'amazon.titan-text-express-v1',
        model_group_id: 'group-2',
        connector_id: 'connector-2',
        description: 'High-performance text generation model',
        status: 'active',
        created_at: '2024-01-10T14:20:00Z',
        api_url: 'https://bedrock-runtime.us-east-1.amazonaws.com'
      },
      {
        model_id: 'deepseek-3',
        name: 'Deepseek',
        version: 'deepseek-chat',
        model_group_id: 'group-3',
        connector_id: 'connector-3',
        description: 'Efficient model for chat and conversation',
        status: 'inactive',
        created_at: '2024-01-08T09:15:00Z',
        api_url: 'https://api.deepseek.com/v1/chat/completions'
      },
      {
        model_id: 'openai-gpt-4',
        name: 'OpenAI GPT',
        version: 'gpt-4-turbo',
        model_group_id: 'group-4',
        connector_id: 'connector-4',
        description: 'Latest GPT model with enhanced capabilities',
        status: 'error',
        created_at: '2024-01-01T16:45:00Z',
        api_url: 'https://api.openai.com/v1/chat/completions'
      }
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return mockModels.map(modelData => Model.fromResponse(modelData));
  }

  public async update(id: string, model: Model): Promise<void> {
    await this.httpClient.put(
      `/_plugins/_ml/models/${id}`,
      model.toApiPayload()
    );
  }

  public async delete(id: string): Promise<void> {
    await this.httpClient.delete(`/_plugins/_ml/models/${id}`);
  }

  public async testConnection(modelId: string): Promise<boolean> {
    try {
      await this.httpClient.post(
        `/_plugins/_ml/models/${modelId}/_predict`,
        {
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Hello!' }
          ]
        }
      );
      return true;
    } catch (error) {
      return false;
    }
  }
}