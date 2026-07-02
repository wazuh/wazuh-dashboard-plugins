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

export type CaseSeverity =
  | 'INFORMATIONAL'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export type CasePriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export type CaseTLP = 'TLP:RED' | 'TLP:AMBER' | 'TLP:GREEN' | 'TLP:CLEAR';

export const MAX_CASE_COMMENTS = 20;

export interface CaseComment {
  author?: string;
  comment?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CaseData {
  title?: string;
  description?: string;
  status?: CaseStatus;
  severity?: CaseSeverity;
  priority?: CasePriority;
  tlp?: CaseTLP;
  tags?: string[];
  comments?: CaseComment[];
  /** Legacy single-comment field: no longer written nor displayed. */
  comment?: string;
  created_at?: string;
  updated_at?: string;
  user?: { name?: string };
}

export interface UpdateCaseEditedComment {
  created_at: string;
  comment: string;
}

export interface UpdateCasePayload {
  status?: CaseStatus;
  tags?: string[];
  title?: string;
  description?: string;
  severity?: CaseSeverity | '';
  priority?: CasePriority | '';
  tlp?: CaseTLP | '';
  newComment?: string;
  editedComments?: UpdateCaseEditedComment[];
}

export interface CaseApiResponse {
  case: CaseData | null;
  username?: string;
}

/**
 * Fetches the current wazuh.case.* fields for a findings document, along
 * with the logged-in username (used to mark own comments as editable).
 * `case` is null when the document exists but has no case data yet.
 */
export async function getFindingsCase(
  index: string,
  docId: string,
): Promise<CaseApiResponse> {
  const response: { data?: { case?: CaseData | null; username?: string } } =
    await GenericRequest.request(
      'GET',
      `/indexer/findings/case/${encodeURIComponent(index)}/${encodeURIComponent(
        docId,
      )}`,
    );
  return {
    case: response?.data?.case ?? null,
    username: response?.data?.username ?? undefined,
  };
}

/**
 * Updates the case management fields of a findings document.
 *
 * POST /indexer/findings/case/<index>/<documentId>
 * Body: { status, tags, title, description, severity, priority, tlp,
 *         newComment, editedComments }
 *
 * The backend sets wazuh.case.user.name and the case/comment timestamps,
 * assigns the logged-in user as the author of the new comment, only allows
 * editing own comments, and enforces the maximum of MAX_CASE_COMMENTS
 * comments. The response carries the full resulting case.
 */
export async function updateDocumentCase(
  index: string,
  docId: string,
  payload: UpdateCasePayload,
): Promise<CaseApiResponse> {
  const response: { data: { case: CaseData; username?: string } } =
    await GenericRequest.request(
      'POST',
      `/indexer/findings/case/${encodeURIComponent(index)}/${encodeURIComponent(
        docId,
      )}`,
      payload,
    );
  return {
    case: response?.data?.case,
    username: response?.data?.username ?? undefined,
  };
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
