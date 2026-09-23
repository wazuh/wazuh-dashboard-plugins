import { IWazuhErrorInfo, IWazuhErrorLogOpts } from '../../types';
import WazuhError from './WazuhError';
import { i18n } from '@osd/i18n';

export class HttpError extends WazuhError {
  logOptions: IWazuhErrorLogOpts;
  constructor(error: Error, info?: IWazuhErrorInfo) {
    super(error, info);
    this.logOptions = {
      error: {
        message: `[${this.constructor.name}]: ${error.message}`,
        title: i18n.translate('wazuh.core.errorHandler.httpErrorTitle', {
          defaultMessage: 'An error has occurred',
        }),
        error: error,
      },
      level: 'ERROR',
      severity: 'BUSINESS',
      display: true,
      store: false,
    };
  }
}