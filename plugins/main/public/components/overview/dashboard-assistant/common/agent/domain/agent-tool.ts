export class AgentTool {
  constructor(
    private readonly type: string,
    private readonly name?: string,
    private readonly parameters?: Record<string, any>
  ) {}

  public toObject(): object {
    const tool: any = { type: this.type };
    if (this.name) {
      tool.name = this.name;
    }
    if (this.parameters) {
      tool.parameters = this.parameters;
    }
    return tool;
  }
}