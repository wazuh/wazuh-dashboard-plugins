import { IModelRepository } from './domain/types';
import { Model } from './domain/model';

export class ModelRepositoryMock implements IModelRepository {
  private mockModels: Model[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    const mockData = [
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

    this.mockModels = mockData.map(modelData => Model.fromResponse(modelData));
  }

  public async create(model: Model): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newId = `model_${Date.now()}`;
    const newModel = Model.fromResponse({
      model_id: newId,
      name: model.getName(),
      version: model.getVersion(),
      model_group_id: 'group-new',
      connector_id: 'connector-new',
      description: model.getDescription(),
      status: 'active',
      created_at: new Date().toISOString(),
      api_url: 'https://api.example.com'
    });
    
    this.mockModels.push(newModel);
    return newId;
  }

  public async findById(id: string): Promise<Model | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const model = this.mockModels.find(m => m.getId() === id);
    return model || null;
  }

  public async getAll(): Promise<Model[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [...this.mockModels];
  }

  public async update(id: string, model: Model): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = this.mockModels.findIndex(m => m.getId() === id);
    if (index === -1) {
      throw new Error(`Model with id ${id} not found`);
    }
  }

  public async delete(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = this.mockModels.findIndex(m => m.getId() === id);
    if (index === -1) {
      throw new Error(`Model with id ${id} not found`);
    }
    
    this.mockModels.splice(index, 1);
  }

  public async testConnection(modelId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const model = this.mockModels.find(m => m.getId() === modelId);
    if (!model) {
      throw new Error(`Model with id ${modelId} not found`);
    }
    
    return model.getStatus() === 'active';
  }
}