export class ConnectorCredential {
  constructor(private readonly openAI_key: string) {}

  public get openAIKey(): string {
    return this.openAI_key;
  }

  public toObject(): object {
    return {
      openAI_key: this.openAI_key,
    };
  }
}
