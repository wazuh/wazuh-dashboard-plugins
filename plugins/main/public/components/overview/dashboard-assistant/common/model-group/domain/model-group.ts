export class ModelGroup {
  constructor(
    private readonly id: string | null,
    private readonly name: string,
    private readonly description: string
  ) {}

  public static create(name: string, description: string): ModelGroup {
    return new ModelGroup(null, name, description);
  }

  public static fromResponse(id: string, name: string, description: string): ModelGroup {
    return new ModelGroup(id, name, description);
  }

  public getId(): string | null {
    return this.id;
  }

  public toApiPayload(): object {
    return {
      name: this.name,
      description: this.description
    };
  }
}