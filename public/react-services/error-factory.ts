/*
 * Wazuh app - Error handler service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { ErrorHandler } from './error-handler';

// error
// message
// statusCode
// statusText
// error-orchestrator-ui.ts:30 [request body.id]: expected value of type [string] but got [undefined] Error: Request failed with status code 400
class ResponseError extends Error {
  constructor(message: string) {
    super(message);
    // Because we are extending built in class
    Object.setPrototypeOf(this, ResponseError.prototype);
    this.name = this.constructor.name;
  }
}

export class ErrorFactory {
  /**
   * Create an new error instance receiving an error instance or a string
   * Paste error stack in new error
   * @param error
   * @returns Error instance
   */
  public static createError(error: Error | string | unknown): Error {
    const errorMessage = ErrorHandler.extractMessage(error);
    // if receive another ResponseError instance, return it, not create a new one
    if (ErrorFactory.isResponseError(error, errorMessage)) {
      return error as Error;
    }

    return ErrorFactory.errorCreator(ResponseError, errorMessage);
  }

  /**
   * Validate if is necessary to create a new error instance or return the same received
   * @param error
   * @param errorMessage
   * @returns
   */
  private static isResponseError(error: Error | string | unknown, errorMessage: string): boolean {
    return error instanceof ResponseError && error.message === errorMessage;
  }

  /**
   * Create an new error instance receiving a Error Type and message
   * @param errorType Error instance to create
   * @param message
   * @returns Error instance depending type received
   */

  private static errorCreator<T extends ResponseError>(
    ErrorType: { new (message: string): T },
    message: string
  ): ResponseError {
    return new ErrorType(message);
  }
}
