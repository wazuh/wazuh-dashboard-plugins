import { IWazuhErrorInfo, IWazuhErrorLogOpts } from '../../types';
import WazuhError from './WazuhError';

export class WarningError extends WazuhError {
  logOptions: IWazuhErrorLogOpts;
  constructor(error: Error, info?: IWazuhErrorInfo) {
    super(error, info);
    this.logOptions = {
      error: {
        message: `[${this.constructor.name}]: ${error.message}`,
        title: `An warning has occurred`,
        error: error,
      },
      level: 'WARNING',
      severity: 'BUSINESS',
      display: true,
      store: false,
    };
  }
}
