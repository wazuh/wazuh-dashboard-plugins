/*
 * Wazuh app - Error Orchestrator base
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import { UI_LOGGER_LEVELS } from '../../../common/constants';

const winstonLevelDict = {
  [UI_LOGGER_LEVELS.ERROR]: 'error',
  [UI_LOGGER_LEVELS.WARNING]: 'warn',
  [UI_LOGGER_LEVELS.INFO]: 'info',
};

export class ErrorOrchestratorBase implements ErrorOrchestrator {
  public loadErrorLog(errorLog: UIErrorLog) {
    if (errorLog.display) this.displayError(errorLog);
    if (errorLog.store) this.storeError(errorLog);
  }

  public displayError(errorLog: UIErrorLog) {
    throw new Error('Should be implemented!');
  }

  private async storeError(errorLog: UIErrorLog) {
    const getLocation = () => {
      return errorLog?.context || errorLog.error?.error?.stack instanceof String || 'No context';
    }

    try {
      const winstonLevel = winstonLevelDict[errorLog.level.toLowerCase()] || 'error';

      await GenericRequest.request('POST', `/utils/logs/ui`, {
        message: errorLog?.error?.message || 'No message',
        level: winstonLevel,
        location: getLocation(),
      });
    } catch (error) {
      loglevel.error('Failed on request [POST /utils/logs/ui]', error);
    }
  }
}
