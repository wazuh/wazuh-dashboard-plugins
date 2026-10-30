import { ErrorOrchestratorService } from './error-orchestrator.service';
import { ErrorOrchestratorCritical } from './error-orchestrator-critical';
import { UIErrorLog } from './types';

const mockIsLoggingOut = jest.fn();
jest.mock('../../services/request-handler', () => ({
  isLoggingOut: () => mockIsLoggingOut(),
}));

const errorLog: UIErrorLog = {
  context: 'unitTest',
  level: 'ERROR',
  severity: 'CRITICAL',
  error: {
    error: 'error',
    message: 'Disable request',
    title: 'Error',
  },
};

describe('ErrorOrchestratorService.handleError', () => {
  let displayError: jest.SpyInstance;

  beforeEach(() => {
    displayError = jest
      .spyOn(ErrorOrchestratorCritical.prototype, 'displayError')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('displays the error', () => {
    mockIsLoggingOut.mockReturnValue(false);

    ErrorOrchestratorService.handleError(errorLog);

    expect(displayError).toHaveBeenCalledTimes(1);
  });

  it('does not display the error while logging out', () => {
    mockIsLoggingOut.mockReturnValue(true);

    ErrorOrchestratorService.handleError(errorLog);

    expect(displayError).not.toHaveBeenCalled();
  });
});
