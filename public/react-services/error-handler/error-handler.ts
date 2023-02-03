import { ErrorFactory } from '../error-factory';
import {
  WazuhApiError,
  ElasticApiError,
  ElasticError,
  WazuhReportingError,
} from './errors';
import { UIErrorLog } from '../error-orchestrator/types';
import { ErrorOrchestratorService } from '../error-orchestrator/error-orchestrator.service';

/**
 * Error codes: code
 * wazuh-api-elastic 20XX
 * wazuh-api         30XX
 * wazuh-elastic     40XX
 * wazuh-reporting   50XX
 * unknown           1000
 */

// statusCode = http status code
// 200 = OK
// 201 = Created
// 202 = Accepted
// 204 = No Content
// 400 = Bad Request
// 401 = unauthorized
// 403 = forbidden
// 404 = not found
// 405 = method not allowed
// 500 = internal server error
// 501 = not implemented

interface iErrorType {}

export default class ErrorHandler {
  /**
   * Receives an error and create a new error instance then treat the error
   * @param error
   */
  static handleError(error: Error | string) {
    const errorParsed = this.returnError(error);
    this.showError(errorParsed);
  }

  /**
   * Receives an error and create a new error instance depending on the error type defined or not
   *
   * @param error
   * @returns
   */
  static returnError(error: Error | string) {
    const errorType = this.getErrorType(error);
    if (errorType) return ErrorFactory.createError(error, errorType);
    return error;
  }

  /**
   * Reveives an error and return a new error instance depending on the error type
   *
   * @param error
   * @returns
   */
  private static getErrorType(
    error: Error | string,
  ) {
    if (this.isString(error)) return Error;
    if(error?.code){
      return this.getErrorTypeByErrorCode(error?.code);
    }
    return error;
  }

  /**
   * Depending on the error code, return the error type
   *
   * @param errorCode
   * @returns
   */
  private static getErrorTypeByErrorCode(errorCode: number) {
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
        return Error;
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
   *
   * @param error
   */
  private static showError(error: Error) {
    const errorOrchestratorOptions: UIErrorLog = {
      context: '',
      level: 'ERROR',
      severity: 'CRITICAL',
      display: true,
      error: {
        error: error,
        message: error.message,
        title: error.name,
      },
      store: true,
    };

    if (error.name === 'WazuhApiError') {
      // we can define severity, display, and some options by status error code
      //console.log('is WazuhApiError');
    }

    if (error.name === 'TypeError') {
      //console.log('is TypeError');
    }

    if (error.name === 'Error') {
      //console.log('is Error');
    }

    ErrorOrchestratorService.handleError(errorOrchestratorOptions);
  }
}
