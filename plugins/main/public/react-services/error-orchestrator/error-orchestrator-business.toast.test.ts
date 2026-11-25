import { UIErrorLog } from './types';
import { ErrorOrchestratorBusiness } from './error-orchestrator-business';

const mockAddError = jest.fn();

jest.mock('../../kibana-services', () => ({
  getToasts: () => ({ addError: mockAddError }),
  getCookies: () => ({ get: () => 'test' }),
  setCookies: jest.fn(),
}));

const buildLog = (extra: Partial<UIErrorLog> = {}): UIErrorLog => ({
  context: 'unitTest',
  level: 'ERROR',
  severity: 'BUSINESS',
  display: true,
  error: { error: new Error('boom'), message: 'boom', title: 'Title' },
  ...extra,
});

describe('ErrorOrchestratorBusiness toast lifetime', () => {
  beforeEach(() => mockAddError.mockClear());

  it('keeps the default lifetime of 3000 ms', () => {
    new ErrorOrchestratorBusiness().loadErrorLog(buildLog());

    expect(mockAddError.mock.calls[0][1].toastLifeTimeMs).toBe(3000);
  });

  it('uses the lifetime of the error log when it is set', () => {
    new ErrorOrchestratorBusiness().loadErrorLog(
      buildLog({ toastLifeTimeMs: 86400000 }),
    );

    expect(mockAddError.mock.calls[0][1].toastLifeTimeMs).toBe(86400000);
  });
});
