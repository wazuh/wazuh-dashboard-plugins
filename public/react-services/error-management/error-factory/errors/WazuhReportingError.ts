import { IWazuhErrorInfo, IWazuhErrorLogOpts } from '../../types';
import { HttpError } from './HttpError';

export class WazuhReportingError extends HttpError {
  logOptions: IWazuhErrorLogOpts;
  constructor(error: Error, info?: IWazuhErrorInfo) {
    super(error, info);
    this.logOptions = {
      error: {
        message: error.message,
        title: error.message,
        error: error,
      },
      level: 'ERROR',
      severity: 'BUSINESS',
      display: true,
      store: false,
    };
  }
}
