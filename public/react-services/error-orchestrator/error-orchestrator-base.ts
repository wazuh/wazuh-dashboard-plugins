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

import loglevel from 'loglevel';
import { GenericRequest } from '../../react-services/generic-request';
import { ErrorOrchestrator, UIErrorLog } from './types';

export class ErrorOrchestratorBase implements ErrorOrchestrator {
  public loadErrorLog(errorLog: UIErrorLog) {
    if (errorLog.display) this.displayError(errorLog);
    if (errorLog.store) this.storeError(errorLog);
  }

  public displayError(errorLog: UIErrorLog) {
    throw new Error('Should be implemented!');
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
