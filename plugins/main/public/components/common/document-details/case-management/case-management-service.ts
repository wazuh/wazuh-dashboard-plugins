/*
 * Wazuh app - Case management service for findings documents
 * Copyright (C) 2015-2025 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { GenericRequest } from '../../../../react-services/generic-request';

export type CaseStatus =
  | 'ACTIVE'
  | 'ACKNOWLEDGED'
  | 'COMPLETED'
  | 'ERROR'
  | 'DELETED'
  | 'AUDIT';

export interface CaseManagementFields {
  /** Current user - set by the backend */
  'wazuh.case.user.name'?: string;
  /** Case status */
  'wazuh.case.status'?: CaseStatus;
  /** Creation timestamp - set by the backend */
  'wazuh.case.created_at'?: string;
  /** Last update timestamp - set by the backend */
  'wazuh.case.updated_at'?: string;
  /** Free-text comment */
  'wazuh.case.comment'?: string;
  /** Custom user-defined tags */
  'wazuh.case.tags'?: string[];
}

export interface UpdateCasePayload {
  status?: CaseStatus;
  comment?: string;
  tags?: string[];
}

/**
 * Retrieves the OpenSearch Dashboards logged-in user (not the Wazuh API user).
 */
export async function getCurrentDashboardUsername(): Promise<string> {
  try {
    const response = await GenericRequest.request(
      'GET',
      '/elastic/security/current-user',
      {},
    );
    return (response?.data?.username as string) ?? '';
  } catch {
    return '';
  }
}

/**
 * Updates the case management fields of a findings document.
 *
 * POST /elastic/findings/case/<index>/<documentId>
 * Body: { status, comment, tags }
 *
 * The backend sets wazuh.case.user.name, created_at and updated_at.
 */
export async function updateDocumentCase(
  index: string,
  docId: string,
  payload: UpdateCasePayload,
): Promise<void> {
  await GenericRequest.request(
    'POST',
    `/elastic/findings/case/${encodeURIComponent(index)}/${encodeURIComponent(docId)}`,
    payload,
  );
}
