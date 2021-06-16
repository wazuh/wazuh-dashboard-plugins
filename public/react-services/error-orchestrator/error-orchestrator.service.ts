/*
 * Wazuh app - Error Orchestrator service
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { errorOrchestratorFactory } from './error-orchestrator.factory';
import { ErrorOrchestrator, UIErrorLog } from './types';

export class ErrorOrchestratorService {
  public constructor() {}

  static handleError(uiErrorLog: UIErrorLog) {
    const errorOrchestrator: ErrorOrchestrator = errorOrchestratorFactory(uiErrorLog.severity);
    errorOrchestrator.loadErrorLog(uiErrorLog);
  }
}
