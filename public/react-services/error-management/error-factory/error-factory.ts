/*
 * Wazuh app - Error factory class
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import {
  IWazuhError,
  IWazuhErrorConstructor,
} from '../types';
import { IErrorOpts } from '../types';

// error
// message
// statusCode
// statusText
// error-orchestrator-ui.ts:30 [request body.id]: expected value of type [string] but got [undefined] Error: Request failed with status code 400

export class ErrorFactory {
  /**
   * Create an new error instance receiving an error instance or a string
   * Paste error stack in new error
   * @param error
   * @param ErrorType
   * @param message
   * @returns Error instance
   */
  public static create(
    ErrorType: IWazuhErrorConstructor,
    opts: IErrorOpts,
  ): Error | IWazuhError {
    return ErrorFactory.errorCreator(ErrorType, opts);
  }

  /**
   * Create an new error instance receiving a Error Type and message
   * @param errorType Error instance to create
   * @param message
   * @returns Error instance depending type received
   */

  private static errorCreator(
    ErrorType: IWazuhErrorConstructor,
    opts: IErrorOpts,
  ): IWazuhError {
    return new ErrorType(opts?.error, opts?.message, opts?.code);
  }
}
