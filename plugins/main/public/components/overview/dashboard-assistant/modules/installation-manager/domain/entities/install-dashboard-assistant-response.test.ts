import { InstallDashboardAssistantResponse } from './install-dashboard-assistant-response';
import { InstallationProgress } from './installation-progress';

describe('InstallDashboardAssistantResponse', () => {
  it('success() should create a successful response with agentId and progress', () => {
    const progress = new InstallationProgress();
    const res = InstallDashboardAssistantResponse.success(
      'agent-123',
      progress,
    );

    expect(res.success).toBe(true);
    expect(res.message).toBe('Installation completed successfully');
    expect(res.progress).toBe(progress);
    expect(res.data?.agentId).toBe('agent-123');
    expect(res.error).toBeUndefined();
  });

  it('failure() should create a failed response with error and progress', () => {
    const progress = new InstallationProgress();
    const error = 'Something went wrong';
    const res = InstallDashboardAssistantResponse.failure(error, progress);

    expect(res.success).toBe(false);
    expect(res.message).toBe(error);
    expect(res.progress).toBe(progress);
    expect(res.error).toBe(error);
    expect(res.data?.agentId).toBeUndefined();
  });

  it('inProgress() should create an in-progress response with progress', () => {
    const progress = new InstallationProgress();
    const res = InstallDashboardAssistantResponse.inProgress(progress);

    expect(res.success).toBe(false);
    expect(res.message).toBe('Installation in progress');
    expect(res.progress).toBe(progress);
    expect(res.error).toBeUndefined();
    expect(res.data?.agentId).toBeUndefined();
  });

  it('start() should create a start response with a new InstallationProgress', () => {
    const res = InstallDashboardAssistantResponse.start();

    expect(res.success).toBe(false);
    expect(res.message).toBe('Installation started');
    expect(res.progress).toBeInstanceOf(InstallationProgress);
    expect(res.error).toBeUndefined();
    expect(res.data?.agentId).toBeUndefined();
  });
});
