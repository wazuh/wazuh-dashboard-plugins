/*
 * Wazuh app - Component to get and set common services.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */
import { ErrorService } from './error-orchestrator/error-orchestrator.service';
import { createGetterSetter } from '../utils/create-getter-setter';

export const [getErrorOrchestrator, setErrorOrchestrator] =
  createGetterSetter<ErrorService>('ErrorOrchestratorService');
