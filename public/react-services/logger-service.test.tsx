import { ILoggerOptions, logError } from './logger-service';
import loglevel from 'loglevel';

jest.mock('loglevel');
jest.mock('../kibana-services', () => ({
  getToasts: () => ({ add: () => {} }),
}));

describe('Wazuh logger service', () => {
  describe('Login service test error', () => {
    it('Should use only service of login without toast', () => {
      const options: ILoggerOptions = {
        context: 'unitTest',
        level: 'ERROR',
        severity: 'UI',
        display: false,
        store: true,
        error: {
          name: 'error name test',
          message: 'message test',
          stack: 'jest testing',
        },
      };

      logError('unit test error message', options);

      expect(loglevel.error).toHaveBeenCalledTimes(1);
    });

    it('Should use only service of login and toast', () => {
      const options: ILoggerOptions = {
        context: 'unitTest',
        level: 'ERROR',
        severity: 'UI',
        display: true,
        store: true,
        error: {
          name: 'error name test',
          message: 'message test',
          stack: 'jest testing',
        },
      };

      logError('unit test error message', options);

      expect(loglevel.error).toHaveBeenCalledTimes(2);
    });
  });
});
