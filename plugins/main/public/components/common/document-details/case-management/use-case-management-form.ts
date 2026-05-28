/*
 * Wazuh app - Hook that manages form state and actions for case management
 * Copyright (C) 2015-2025 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { EuiComboBoxOptionOption } from '@elastic/eui';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { getToasts } from '../../../../kibana-services';
import {
  CaseStatus,
  UpdateCasePayload,
  getCurrentApiUsername,
  updateDocumentCase,
} from './case-management-service';

export interface CaseManagementFormDocument {
  _index: string;
  _id: string;
  _source?: Record<string, unknown>;
}

export interface UseCaseManagementFormReturn {
  status: CaseStatus | undefined;
  comment: string;
  tags: EuiComboBoxOptionOption[];
  currentUsername: string;
  isLoadingUser: boolean;
  existingCreatedAt: string | number | undefined;
  existingUpdatedAt: string | number | undefined;
  isSaving: boolean;
  isDirty: boolean;
  isNewCase: boolean;
  setStatus: (status: CaseStatus) => void;
  setComment: (comment: string) => void;
  setTags: (tags: EuiComboBoxOptionOption[]) => void;
  handleTagCreate: (value: string) => void;
  handleSave: () => Promise<void>;
  handleReset: () => void;
}

/**
 * Reads a nested dotted key (e.g. `"wazuh.case.status"`) from a flat _source
 * object that may store it either flattened or truly nested.
 */
function readSourceField<T = unknown>(
  source: Record<string, unknown> | undefined,
  dotKey: string,
): T | undefined {
  if (!source) return undefined;
  if (Object.prototype.hasOwnProperty.call(source, dotKey)) {
    return source[dotKey] as T;
  }
  const parts = dotKey.split('.');
  let current: unknown = source;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current as T | undefined;
}

export function useCaseManagementForm(
  document: CaseManagementFormDocument,
): UseCaseManagementFormReturn {
  const source = document._source;

  // ── Extract existing values from the document ──────────────────────────
  const existingStatus = readSourceField<CaseStatus>(source, 'wazuh.case.status');
  const existingComment = readSourceField<string>(source, 'wazuh.case.comment') ?? '';
  const existingTags = readSourceField<string[]>(source, 'wazuh.case.tags') ?? [];
  const existingUserName = readSourceField<string>(source, 'wazuh.case.user.name') ?? '';
  const existingCreatedAt = readSourceField<string | number>(source, 'wazuh.case.created_at');
  const existingUpdatedAt = readSourceField<string | number>(source, 'wazuh.case.updated_at');

  const isNewCase = !existingStatus;

  // ── Capture initial form values once (used for dirty detection) ─────────
  const initialRef = useRef({
    status: existingStatus,
    comment: existingComment,
    tags: existingTags,
  });

  // ── Form state ─────────────────────────────────────────────────────────
  const [status, setStatus] = useState<CaseStatus | undefined>(existingStatus);
  const [comment, setComment] = useState<string>(existingComment);
  const [tags, setTags] = useState<EuiComboBoxOptionOption[]>(
    existingTags.map(t => ({ label: t })),
  );
  const [currentUsername, setCurrentUsername] = useState<string>(existingUserName);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(!existingUserName);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // ── Dirty check — no fallbacks, compare against initial captured values ─
  const isDirty =
    status !== initialRef.current.status ||
    comment !== initialRef.current.comment ||
    tags.map(t => t.label).join(',') !== initialRef.current.tags.join(',');

  // ── Load current user name if the document doesn't have one yet ─────────
  useEffect(() => {
    if (existingUserName) return;
    let cancelled = false;
    setIsLoadingUser(true);
    getCurrentApiUsername()
      .then(username => {
        if (!cancelled) setCurrentUsername(username);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingUser(false);
      });
    return () => {
      cancelled = true;
    };
  }, [existingUserName]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleTagCreate = useCallback((searchValue: string) => {
    const trimmed = searchValue.trim();
    if (!trimmed) return;
    setTags(prev => [...prev, { label: trimmed }]);
  }, []);

  const handleReset = useCallback(() => {
    setStatus(initialRef.current.status);
    setComment(initialRef.current.comment);
    setTags(initialRef.current.tags.map(t => ({ label: t })));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const payload: UpdateCasePayload = {
        status,
        comment: comment.trim() || undefined,
        tags: tags.map(t => t.label).filter(Boolean),
      };
      await updateDocumentCase(document._index, document._id, payload);
      getToasts().add({
        color: 'success',
        title: isNewCase ? 'Case created' : 'Case updated',
        toastLifeTimeMs: 3000,
      });
    } catch (error: unknown) {
      const options: UIErrorLog = {
        context: 'CaseManagementTab.handleSave',
        level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
        severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
        store: true,
        error: {
          error,
          message:
            error instanceof Error ? error.message : 'Could not save case data',
          title: 'Case management error',
        },
      };
      getErrorOrchestrator().handleError(options);
    } finally {
      setIsSaving(false);
    }
  }, [document._index, document._id, status, comment, tags, isNewCase]);

  return {
    status,
    comment,
    tags,
    currentUsername,
    isLoadingUser,
    existingCreatedAt,
    existingUpdatedAt,
    isSaving,
    isDirty,
    isNewCase,
    setStatus,
    setComment,
    setTags,
    handleTagCreate,
    handleSave,
    handleReset,
  };
}
