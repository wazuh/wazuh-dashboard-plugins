export class AgentMemory {
  constructor(
    private readonly type: string,
    private readonly windowSize?: number
  ) {}

  public toObject(): object {
    const memory: any = { type: this.type };
    if (this.windowSize !== undefined) {
      memory.window_size = this.windowSize;
    }
    return memory;
  }
}