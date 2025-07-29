export class ConnectorAction {
  constructor(
    private readonly actionType: string,
    private readonly method: string,
    private readonly url: string,
    private readonly headers: Record<string, string>,
    private readonly requestBody: string,
  ) {}

  public toObject(): object {
    return {
      action_type: this.actionType,
      method: this.method,
      url: this.url,
      headers: this.headers,
      request_body: this.requestBody,
    };
  }
}
