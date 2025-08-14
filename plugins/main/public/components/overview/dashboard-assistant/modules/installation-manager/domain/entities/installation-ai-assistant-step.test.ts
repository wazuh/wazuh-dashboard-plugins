import { InstallationAIAssistantStep } from './installation-ai-assistant-step';

class TestStep extends InstallationAIAssistantStep {
  private successMsg: string;
  private failureMsg: string;
  public received: { request?: any; context?: any } = {};

  constructor(name: string, successMsg = 'success', failureMsg = 'failure') {
    super({ name });
    this.successMsg = successMsg;
    this.failureMsg = failureMsg;
  }

  async execute(request: any, context: any): Promise<void> {
    this.received.request = request;
    this.received.context = context;
  }

  getSuccessMessage(): string {
    return this.successMsg;
  }

  getFailureMessage(): string {
    return this.failureMsg;
  }
}

describe('InstallationAIAssistantStep', () => {
  it('getName returns the provided name', () => {
    const step = new TestStep('MyStep');
    expect(step.getName()).toBe('MyStep');
  });

  it('execute receives the provided request and context', async () => {
    const step = new TestStep('ExecuteStep');
    const request = { foo: 'bar' } as any;
    const context = { baz: 'qux' } as any;

    await step.execute(request, context);

    expect(step.received.request).toBe(request);
    expect(step.received.context).toBe(context);
  });

  it('returns custom success and failure messages', () => {
    const step = new TestStep('MsgStep', 'ok success', 'bad failure');
    expect(step.getSuccessMessage()).toBe('ok success');
    expect(step.getFailureMessage()).toBe('bad failure');
  });
});
