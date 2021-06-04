/*
 * Wazuh app - Error Orchestrator factory
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { ErrorOrchestrator, UIErrorSeverities, UIErrorSeverity } from '../../../common/constants';
import { ErrorOrchestratorUI } from './error-orchestrator-ui';
import { ErrorOrchestratorBusiness } from './error-orchestrator-business';
import { ErrorOrchestratorCritical } from './error-orchestrator-critical';

export const errorOrchestratorFactory = (severity: UIErrorSeverity): ErrorOrchestrator => {
  switch (severity) {
    case UIErrorSeverities.UI:
      return new ErrorOrchestratorUI();
    case UIErrorSeverities.BUSINESS:
      return new ErrorOrchestratorBusiness();
    case UIErrorSeverities.CRITICAL:
      return new ErrorOrchestratorCritical();
    default:
      break;
  }
};
