/*
 * Wazuh app - Error Orchestrator factory
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { ErrorOrchestratorUI } from './error-orchestrator-ui';
import { ErrorOrchestratorBusiness } from './error-orchestrator-business';
import { ErrorOrchestratorCritical } from './error-orchestrator-critical';
import { ErrorOrchestrator, UI_ERROR_SEVERITIES, UIErrorSeverity } from './types';

export const errorOrchestratorFactory = (severity: UIErrorSeverity): ErrorOrchestrator => {
  switch (severity) {
    case UI_ERROR_SEVERITIES.UI:
      return new ErrorOrchestratorUI();
    case UI_ERROR_SEVERITIES.BUSINESS:
      return new ErrorOrchestratorBusiness();
    case UI_ERROR_SEVERITIES.CRITICAL:
      return new ErrorOrchestratorCritical();
    default:
      break;
  }
};
