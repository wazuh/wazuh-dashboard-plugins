import { ErrorService } from './error-service';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';

jest.mock('../../../../../react-services/common-services', () => ({
  getErrorOrchestrator: jest.fn(),
}));

const {
  getErrorOrchestrator,
} = require('../../../../../react-services/common-services');

describe('ErrorService', () => {
  const service = new ErrorService();
  const handleError = jest.fn();

  beforeEach(() => {
    handleError.mockReset();
    (getErrorOrchestrator as jest.Mock).mockReturnValue({ handleError });
  });

  it('composes default payload (levels and severity) with message string', () => {
    service.log({ context: 'ctx', message: 'msg' });

    expect(handleError).toHaveBeenCalledTimes(1);
    const payload = handleError.mock.calls[0][0];
    expect(payload).toMatchObject({
      context: 'ctx',
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.UI,
      error: { message: 'msg' },
    });
  });

  it('uses explicit title and extracts message from Error', () => {
    const err = new Error('boom');
    service.log({ context: 'c', title: 'T', message: err, error: err });

    const payload = handleError.mock.calls[0][0];
    expect(payload.error.title).toBe('T');
    expect(payload.error.message).toBe('boom');
  });

  it('uses custom level and severity if provided', () => {
    service.log({
      context: 'c',
      message: 'm',
      level: UI_LOGGER_LEVELS.WARNING as any,
      severity: UI_ERROR_SEVERITIES.BUSINESS as any,
    });
    const payload = handleError.mock.calls[0][0];
    expect(payload.level).toBe(UI_LOGGER_LEVELS.WARNING);
    expect(payload.severity).toBe(UI_ERROR_SEVERITIES.BUSINESS);
  });
});
