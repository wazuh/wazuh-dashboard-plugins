import { IWazuhErrorInfo, IWazuhErrorLogOpts } from '../../types';
import { HttpError } from './HttpError';

export class WazuhReportingError extends HttpError {
  constructor(error: Error, info?: IWazuhErrorInfo) {
    super(error, info);
  }
}
