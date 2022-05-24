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
import { ErrorHandler } from './index';

export class ResponseBaseError extends Error {
  constructor(error: Error | string) {
    super(ErrorHandler.extractMessage(error));
    this.name = this.constructor.name;
    if (error instanceof Error) {
      this.stack = error.stack;
    }
  }
}

export class ErrorFactory {
  static createError(error: Error | string): ResponseBaseError {
    return new ResponseBaseError(error);
  }

  static extractMessage(error: Error): string {
    return ErrorHandler.extractMessage(error);
  }
}
