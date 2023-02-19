import { UIErrorLog } from '../error-orchestrator/types';

export interface IWazuhErrorLogOpts extends Omit<UIErrorLog,'context'> {}
export interface IErrorOpts {
  error: Error;
  message: string;
  code?: number;
}

export interface IWazuhError extends Error, IErrorOpts {
  error: Error;
  message: string;
  code?: number;
  logOptions: IWazuhErrorLogOpts;
}

export interface IWazuhErrorConstructor {
  new (error: Error, info: IWazuhErrorInfo): IWazuhError;
}

export interface IWazuhErrorInfo {
  message: string;
  code?: number;
}
