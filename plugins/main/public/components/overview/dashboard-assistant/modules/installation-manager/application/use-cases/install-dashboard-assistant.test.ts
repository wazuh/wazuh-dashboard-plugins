import { installDashboardAssistantUseCase } from './install-dashboard-assistant';

describe('installDashboardAssistantUseCase', () => {
  it('returns success with data when orchestrator resolves', async () => {
    const data = { agentId: 'agent-1', modelId: 'model-1' };
    const execute = jest.fn().mockResolvedValue({ data });
    const orchestrator = { execute } as any;

    const useCase = installDashboardAssistantUseCase(orchestrator);
    const request = { any: 'payload' } as any;

    const res = await useCase(request);

    expect(execute).toHaveBeenCalledWith(request);
    expect(res.success).toBe(true);
    expect(typeof res.message).toBe('string');
    expect(res.message).toBeTruthy();
    expect(res.data).toEqual(data);
  });

  it('returns failure with error message when orchestrator throws Error', async () => {
    const execute = jest.fn().mockRejectedValue(new Error('boom'));
    const orchestrator = { execute } as any;

    const useCase = installDashboardAssistantUseCase(orchestrator);
    const res = await useCase({} as any);

    expect(res.success).toBe(false);
    expect(res.message).toContain('boom');
  });

  it('returns failure with fallback message when orchestrator throws non-Error', async () => {
    const execute = jest.fn().mockRejectedValue('bad');
    const orchestrator = { execute } as any;

    const useCase = installDashboardAssistantUseCase(orchestrator);
    const res = await useCase({} as any);

    expect(res.success).toBe(false);
    expect(typeof res.message).toBe('string');
    expect(res.message.length).toBeGreaterThan(0);
  });
});
