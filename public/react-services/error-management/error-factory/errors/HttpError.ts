import { IWazuhErrorInfo, IWazuhErrorLogOpts } from '../../types';
import WazuhError from './WazuhError';

export class HttpError extends WazuhError {
  logOptions: IWazuhErrorLogOpts;
  constructor(error: Error, info?: IWazuhErrorInfo) {
    super(error, info);
    this.logOptions = {
      error: {
        message: `[${this.constructor.name}]: ${error.message}`,
        title: `Unexpected ${this.constructor.name}: ${error.message}`,
        error: error,
      },
      level: 'ERROR',
      severity: 'BUSINESS',
      display: true,
      store: false,
    };
  }
}