import { AgentLLM } from './agent-llm';
import { AgentMemory } from './agent-memory';
import { AgentTool } from './agent-tool';

export class Agent {
  constructor(
    private readonly id: string | null,
    private readonly name: string,
    private readonly type: string,
    private readonly description: string,
    private readonly llm: AgentLLM,
    private readonly memory: AgentMemory,
    private readonly tools: AgentTool[]
  ) {}

  public static create(config: {
    name: string;
    description: string;
    modelId: string;
  }): Agent {
    const llm = new AgentLLM(config.modelId, {
      max_iteration: 5,
      stop_when_no_tool_found: true
    });

    const memory = new AgentMemory('conversation_summary', 10);

    const tools = [
      new AgentTool('MLModelTool', 'MLModelTool', {
        model_id: config.modelId,
        prompt: 'Answer the question: ${parameters.question}'
      }),
      new AgentTool('WazuhAlertSearchTool', 'WazuhAlertSearchTool', {
        input: '${parameters.question}'
      })
    ];

    return new Agent(
      null,
      config.name,
      'conversational',
      config.description,
      llm,
      memory,
      tools
    );
  }

  public getId(): string | null {
    return this.id;
  }

  public toApiPayload(): object {
    return {
      name: this.name,
      type: this.type,
      description: this.description,
      llm: this.llm.toObject(),
      memory: this.memory.toObject(),
      tools: this.tools.map(tool => tool.toObject())
    };
  }
}