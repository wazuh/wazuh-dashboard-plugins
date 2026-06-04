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

export interface CaseData {
  status?: CaseStatus;
  comment?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  user?: { name?: string };
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
    const response = await GenericRequest.request('GET', '/elastic/security/current-user', {});
    return (response?.data?.username as string) ?? '';
  } catch {
    return '';
  }
}

/**
 * Fetches the current wazuh.case.* fields for a findings document.
 * Returns null when the document exists but has no case data yet.
 */
export async function getFindingsCase(
  index: string,
  docId: string,
): Promise<CaseData | null> {
  const response: { data?: { case?: CaseData | null } } = await GenericRequest.request(
    'GET',
    `/elastic/findings/case/${encodeURIComponent(index)}/${encodeURIComponent(docId)}`,
    {},
  );
  return (response?.data?.case ?? null);
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
): Promise<CaseData> {
  const response: { data: { case: CaseData } } = await GenericRequest.request(
    'POST',
    `/elastic/findings/case/${encodeURIComponent(index)}/${encodeURIComponent(docId)}`,
    payload,
  );
  return response?.data?.case;
}
