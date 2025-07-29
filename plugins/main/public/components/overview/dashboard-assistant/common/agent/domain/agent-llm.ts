export class AgentLLM {
  constructor(
    private readonly modelId: string,
    private readonly parameters: Record<string, any>
  ) {}

  public toObject(): object {
    return {
      model_id: this.modelId,
      parameters: this.parameters
    };
  }
}