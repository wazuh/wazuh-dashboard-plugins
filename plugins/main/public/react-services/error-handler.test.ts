import { ErrorHandler } from './error-handler';

const mockAddDanger = jest.fn();
jest.mock('../kibana-services', () => ({
  getToasts: () => ({ addDanger: mockAddDanger, addWarning: jest.fn() }),
}));
jest.mock('../redux/store', () => ({ dispatch: jest.fn() }));
jest.mock('./check-daemons-status', () => ({ CheckDaemonsStatus: {} }));

const mockIsLoggingOut = jest.fn();
jest.mock('../services/request-handler', () => ({
  isLoggingOut: () => mockIsLoggingOut(),
}));

describe('ErrorHandler.handle', () => {
  beforeEach(() => {
    mockAddDanger.mockClear();
  });

  it('shows the error in a toast', () => {
    mockIsLoggingOut.mockReturnValue(false);

    ErrorHandler.handle('Server did not respond', 'Groups');

    expect(mockAddDanger).toHaveBeenCalledWith(
      'Groups. Server did not respond',
    );
  });

  it('does not show the error while logging out', () => {
    mockIsLoggingOut.mockReturnValue(true);

    ErrorHandler.handle('Server did not respond', 'Agents');

    expect(mockAddDanger).not.toHaveBeenCalled();
  });
});
