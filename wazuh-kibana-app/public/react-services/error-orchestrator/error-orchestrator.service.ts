/*
 * Wazuh app - Error Orchestrator service
 * Copyright (C) 2015-2022 Wazuh, Inc.
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

  /**
   * HandlerError static method
   * @param {UIErrorLog} uiErrorLog
   */
  static handleError({
    context,
    level,
    severity,
    display = true,
    store = false,
    error,
  }: UIErrorLog) {
    const uiErrorLog = { context, level, severity, display, store, error };
    const errorOrchestrator: ErrorOrchestrator = errorOrchestratorFactory(uiErrorLog.severity);
    errorOrchestrator.loadErrorLog(uiErrorLog);
  }
}
