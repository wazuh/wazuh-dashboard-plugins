/*
 * Wazuh app - Error Orchestrator for business implementation
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { ErrorOrchestratorBase } from './error-orchestrator-base';
import { UIErrorLog } from './types';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { getToasts } from '../../kibana-services';
import { ErrorToastOptions } from 'kibana/public';

export class ErrorOrchestratorBusiness extends ErrorOrchestratorBase {
  public displayError(errorLog: UIErrorLog) {
    const toast = {
      error: errorLog.error,
      title: errorLog.error.title,
      message: errorLog.error.message,
      toastLifeTimeMs: 3000,
    };

    switch (errorLog.level) {
      case UI_LOGGER_LEVELS.INFO:
        getToasts().addInfo(errorLog.error.error, toast as ErrorToastOptions);
        break;
      case UI_LOGGER_LEVELS.WARNING:
        getToasts().addWarning(errorLog.error.error, toast as ErrorToastOptions);
        break;
      case UI_LOGGER_LEVELS.ERROR:
        const toastError = { ...toast, toastMessage: errorLog.error.message };
        getToasts().addError(errorLog.error.error, toastError as ErrorToastOptions);
        break;
      default:
        console.log('No error level', errorLog.error.message, errorLog.error.error);
    }
  }
}
