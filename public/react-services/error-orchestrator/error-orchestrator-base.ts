/*
 * Wazuh app - Error Orchestrator base
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { ErrorToastOptions } from 'kibana/public';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { getToasts } from '../../kibana-services';
import loglevel from 'loglevel';
import { GenericRequest } from '../../react-services/generic-request';
import { ErrorOrchestrator, UIErrorLog } from './types';

export class ErrorOrchestratorBase implements ErrorOrchestrator {
  public loadErrorLog(errorLog: UIErrorLog) {
    if (errorLog.display) this.displayError(errorLog);
    if (errorLog.store) this.storeError(errorLog).then(loglevel.info);
  }

  public displayError(errorLog: UIErrorLog) {
    const toast = {
      title: errorLog.error.title,
      toastMessage: errorLog.error.message,
      toastLifeTimeMs: 3000,
    };

    getToasts().addError(errorLog.error.error, toast as ErrorToastOptions);
  }

  public loglevelError(errorLog: UIErrorLog) {
    switch (errorLog.level) {
      case UI_LOGGER_LEVELS.INFO:
        loglevel.info(errorLog.error.message, errorLog.error.error);
        break;
      case UI_LOGGER_LEVELS.WARNING:
        loglevel.warn(errorLog.error.message, errorLog.error.error);
        break;
      case UI_LOGGER_LEVELS.ERROR:
        loglevel.error(errorLog.error.message, errorLog.error.error);
        break;
      default:
        console.log('No error level', errorLog.error.message, errorLog.error.error);
    }
  }

  private async storeError(errorLog: UIErrorLog) {
    try {
      await GenericRequest.request('POST', `/utils/logs/ui`, {
        body: {
          message: errorLog.error.message,
          level: errorLog.level,
          location: errorLog.location,
        },
      });
    } catch (error) {
      loglevel.error('Failed on request [POST /utils/logs/ui]', error);
    }
  }
}
