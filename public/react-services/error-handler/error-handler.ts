import { ErrorFactory } from '../error-factory';
import { WazuhApiError, ElasticApiError, ElasticError, WazuhReportingError } from './errors';
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

export default class ErrorHandler {
  /**
   *
   * @param error
   */
  static handleError(error) {
    // define error type
    const errorParsed = this.returnError(error);
    // send error to error orchestrator
    this.showError(errorParsed);
  }

  /**
   *
   * @param error
   * @returns
   */
  static returnError(error) {
    const errorType = this.getErrorType(error);
    if (errorType) return ErrorFactory.createError(error, errorType);
    return error;
  }

  /**
   *
   * @param error
   * @returns
   */
  private static getErrorType(error: Error | string): typeof WazuhApiError | null {
    // if have error code
    // if not have error code but have status code
    if (this.isString(error)) return Error;
    if (this.isWazuhApiError(error)) return WazuhApiError;
    return null;
  }

  /**
   *
   * @param errorCode
   * @returns
   */
  private static getErrorTypeByErrorCode(errorCode: number) {
    switch (true) {
      case errorCode >= 2000:
        return ElasticApiError;
      case errorCode >= 3000:
        return WazuhApiError;
      case errorCode >= 4000:
        return ElasticError;
      case errorCode >= 5000:
        return WazuhReportingError;
      default:
        return Error;
    }
  }

  static isString(error: Error | string): boolean {
    return typeof error === 'string';
  }

  /**
   *
   * @param error
   * @returns
   */
  static isWazuhApiError(error): boolean {
    if (
      error.response?.data?.error &&
      error.response?.data?.statusCode &&
      error.response?.data?.message
    ) {
      return true;
    }

    return false;
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
      console.log('is WazuhApiError');
    }

    if (error.name === 'TypeError') {
      console.log('is TypeError');
    }

    if (error.name === 'Error') {
      console.log('is Error');
    }

    ErrorOrchestratorService.handleError(errorOrchestratorOptions);
  }
}
