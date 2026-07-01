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

// TODO: confirm exact enum literal values against backend contract (wazuh-indexer-plugins#1220).
export type CaseSeverity = string;
export type CasePriority = string;
export type CaseTLP = string;

export interface CaseComment {
  author?: string;
  comment?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CaseData {
  status?: CaseStatus;
  comment?: string;
  tags?: string[];
  title?: string;
  description?: string;
  severity?: CaseSeverity;
  priority?: CasePriority;
  tlp?: CaseTLP;
  comments?: CaseComment[];
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
 * Fetches the current wazuh.case.* fields for a findings document.
 * Returns null when the document exists but has no case data yet.
 */
export async function getFindingsCase(
  index: string,
  docId: string,
): Promise<CaseData | null> {
  const response: { data?: { case?: CaseData | null } } =
    await GenericRequest.request(
      'GET',
      `/indexer/findings/case/${encodeURIComponent(index)}/${encodeURIComponent(
        docId,
      )}`,
    );
  return response?.data?.case ?? null;
}

/**
 * Updates the case management fields of a findings document.
 *
 * POST /indexer/findings/case/<index>/<documentId>
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
    `/indexer/findings/case/${encodeURIComponent(index)}/${encodeURIComponent(
      docId,
    )}`,
    payload,
  );
  return response?.data?.case;
}

/**
 * Removes the case management fields from a findings document.
 */
export async function cleanDocumentCase(
  index: string,
  docId: string,
): Promise<CaseData | null> {
  const response: { data: { case: CaseData | null } } =
    await GenericRequest.request(
      'DELETE',
      `/indexer/findings/case/${encodeURIComponent(index)}/${encodeURIComponent(
        docId,
      )}`,
      {},
    );
  return response?.data?.case ?? null;
}
