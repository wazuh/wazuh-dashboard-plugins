import { IWazuhErrorInfo, IWazuhErrorLogOpts } from '../../types';
import { HttpError } from './HttpError';

export class IndexerApiError extends HttpError {
  constructor(error: Error, info?: IWazuhErrorInfo) {
    super(error, info);
  }
}
