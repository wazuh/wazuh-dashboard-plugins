import { ErrorFactory } from '../error-factory/error-factory';
import {
  ElasticApiError,
  ElasticError,
  WazuhReportingError,
  WazuhApiError,
} from '../error-factory/errors';
import { IWazuhError, IWazuhErrorConstructor } from '../types';
import WazuhError from '../error-factory/errors/WazuhError';
// error orchestrator
import { UIErrorLog } from '../../error-orchestrator/types';
import { ErrorOrchestratorService } from '../../error-orchestrator/error-orchestrator.service';

export class ErrorHandler {
  /**
   * Receives an error and create return a new error instance then treat the error
   * @param error
   */
  static handleError(error: Error): Error | IWazuhError {
    if(!error){
      throw Error('Error must be defined');
    }
    const errorCreated = this.createError(error);
    this.logError(errorCreated);
    return errorCreated;
  }

  /**
   * Receives an error and create a new error instance depending on the error type defined or not
   *
   * @param error
   * @returns
   */
  static createError(error: Error | string): IWazuhError | Error {
    if(!error){
      throw Error('Error must be defined');
    }
    if(typeof error === 'string') return new Error(error);
    const errorType = this.getErrorType(error);
    if (errorType) return ErrorFactory.create(errorType, { error, message: error.message });
    return error;
  }

  /**
   * Reveives an error and return a new error instance depending on the error type
   *
   * @param error
   * @returns
   */
  private static getErrorType(
    //error: string | Error | AxiosError | OpenSearchDashboardsResponse, // ToDo: Get error types
    error: Error | any
  ): IWazuhErrorConstructor | null {
    let errorType = null;
    if(this.isWazuhApiError(error)){
      errorType = this.getErrorTypeByErrorCode(error?.response?.data?.code, error?.response?.data?.message);
    }else{
      errorType = this.getErrorTypeByErrorCode(error.message, error?.code);
    }
    return errorType;
  }

  /**
   * Depending on the error code, return the error type
   *
   * @param errorCode
   * @returns
   */
  private static getErrorTypeByErrorCode(errorResponseCode: number, message: string): IWazuhErrorConstructor | null {
    let errorCode = errorResponseCode;
    if(!errorResponseCode && message){
      let errorCodeFromMessage: string | number = message.split('-')[0].trim();
      if(!errorCodeFromMessage) return null;
      errorCode = Number(errorCodeFromMessage);
    }

    switch (true) {
      case errorCode >= 2000 && errorCode < 3000:
        return ElasticApiError;
      case errorCode >= 3000 && errorCode < 4000:
        return WazuhApiError;
      case errorCode >= 4000 && errorCode < 5000:
        return ElasticError;
      case errorCode >= 5000  && errorCode < 6000:
        return WazuhReportingError;
      default:
        return null;
    }
  }

  /**
   * Check if the parameter received is a string
   * @param error
   */
  static isString(error: Error | string): boolean {
    return typeof error === 'string';
  }

  /**
   * Check if the error received is a WazuhApiError
   * @param error
   * @returns
   */
  static isWazuhApiError(error: any): boolean {
    // put the correct type -- not any type
    return error.response?.data?.error &&
      error.response?.data?.statusCode &&
      error.response?.data?.message
      ? true
      : false;
  }

  /**
   * This method log the error depending on the error type and the log options defined in the error class
   * @param error
   */
  private static logError(error: Error | IWazuhError) {
    if(error instanceof WazuhError){
      const errorLog: UIErrorLog = {
        ...error.logOptions,
      };
      ErrorOrchestratorService.handleError(errorLog);
    }else{
      // this is a generic error treatment
      // this condition is for the native error classes
      const errorLog: UIErrorLog = {
        error: {
          message: error.message,
          title: error.message,
          error: error,
        },
        level: 'ERROR',
        severity: 'UI',
        display: false,
        store: false,
      };
      ErrorOrchestratorService.handleError(errorLog);
    }
  }
}
