export interface IErrorOpts {
  error: Error;
  message: string;
  code?: number;
}

export interface IWazuhError extends IErrorOpts, Error  {
    error: Error;
    message: string;
    code?: number;
    handleError(): void;
}

export interface IWazuhErrorConstructor {
    new(error: Error, message: string, code?: number): IWazuhError;
}