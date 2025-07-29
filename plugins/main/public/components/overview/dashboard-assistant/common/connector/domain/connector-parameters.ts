export class ConnectorParameters {
  constructor(
    private readonly endpoint: string,
    private readonly model: string,
    private readonly messages: Array<{ role: string; content: string }>,
  ) {}

  public toObject(): object {
    return {
      endpoint: this.endpoint,
      model: this.model,
      messages: this.messages,
    };
  }
}
