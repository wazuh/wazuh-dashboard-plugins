/*
 * Wazuh app - Case management exports
 * Copyright (C) 2015-2025 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export { CaseManagementTab } from './case-management-tab';
export { caseManagementDocumentDetailsTabs } from './case-management-document-details-tabs';
export { useCaseManagementForm } from './use-case-management-form';
export type {
  CaseManagementFormDocument,
  UseCaseManagementFormReturn,
} from './use-case-management-form';
export type {
  CaseManagementFields,
  CaseStatus,
  UpdateCasePayload,
} from './case-management-service';
