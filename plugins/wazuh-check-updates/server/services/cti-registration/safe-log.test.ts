import { getWazuhCheckUpdatesServices } from '../../plugin-services';
import { safeLog } from './safe-log';

jest.mock('../../plugin-services', () => ({
  getWazuhCheckUpdatesServices: jest.fn(),
}));

const mockedGetServices = getWazuhCheckUpdatesServices as jest.Mock;

describe('safeLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each(['error', 'warn'] as const)('logs at the %s level', level => {
    const logger = { error: jest.fn(), warn: jest.fn() };
    mockedGetServices.mockReturnValue({ logger });

    safeLog(level, 'something happened');

    expect(logger[level]).toHaveBeenCalledWith('something happened');
  });

  test('does not throw when the plugin services are unavailable', () => {
    mockedGetServices.mockImplementation(() => {
      throw new Error('WazuhCheckUpdatesServices was not set.');
    });

    expect(() => safeLog('error', 'something happened')).not.toThrow();
  });
});
