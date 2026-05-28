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
import { WzRequest } from '../../../../react-services/wz-request';

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
 * Retrieves the current Wazuh API user name by calling /security/users/me.
 * Returns an empty string if the request fails.
 */
export async function getCurrentApiUsername(): Promise<string> {
  try {
    const response = await WzRequest.apiReq('GET', '/security/users/me', {});
    return (response?.data?.data?.affected_items?.[0]?.username as string) ?? '';
  } catch {
    return '';
  }
}

/**
 * Updates the case management fields of a findings document.
 *
 * TODO: This stub will be replaced once the Wazuh Dashboard endpoint is
 * implemented (related: wazuh-indexer-plugins#1220).
 *
 * The endpoint is expected to:
 *   POST /internal/wazuh/case/<index>/<documentId>
 *   Body: { status, comment, tags }
 *
 * The backend is responsible for:
 *  - Setting wazuh.case.user.name to the logged-in user.
 *  - Setting wazuh.case.created_at on first write.
 *  - Updating wazuh.case.updated_at on every write.
 *
 * @param index   - Index where the document lives (e.g. wazuh-findings-v5-security-000001)
 * @param docId   - OpenSearch document _id
 * @param payload - Editable case fields
 */
export async function updateDocumentCase(
  index: string,
  docId: string,
  payload: UpdateCasePayload,
): Promise<void> {
  // TODO: replace with real endpoint path when the backend is ready.
  await GenericRequest.request(
    'POST',
    `/internal/wazuh/case/${encodeURIComponent(index)}/${encodeURIComponent(docId)}`,
    payload,
  );
}
