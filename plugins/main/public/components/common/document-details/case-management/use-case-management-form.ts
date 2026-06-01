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

import { useCallback, useEffect, useReducer } from 'react';
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
  getCurrentDashboardUsername,
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

type CaseFormBaseline = {
  status: CaseStatus | undefined;
  comment: string;
  tags: string[];
};

type CaseFormState = {
  status: CaseStatus | undefined;
  comment: string;
  tags: EuiComboBoxOptionOption[];
  currentUsername: string;
  isLoadingUser: boolean;
  existingCreatedAt: string | number | undefined;
  existingUpdatedAt: string | number | undefined;
  isSaving: boolean;
  baseline: CaseFormBaseline;
};

type DocumentCaseValues = {
  status: CaseStatus | undefined;
  comment: string;
  tags: string[];
  userName: string;
  createdAt: string | number | undefined;
  updatedAt: string | number | undefined;
};

type CaseFormAction =
  | { type: 'LOAD_DOCUMENT'; payload: DocumentCaseValues }
  | { type: 'SET_DASHBOARD_USER'; payload: string }
  | { type: 'SET_LOADING_USER'; payload: boolean }
  | { type: 'SET_STATUS'; payload: CaseStatus }
  | { type: 'SET_COMMENT'; payload: string }
  | { type: 'SET_TAGS'; payload: EuiComboBoxOptionOption[] }
  | { type: 'ADD_TAG'; payload: string }
  | { type: 'RESET' }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_END' }
  | {
      type: 'SAVE_SUCCESS';
      payload: {
        status: CaseStatus;
        comment: string;
        tags: string[];
        createdAt: string | number;
        updatedAt: string | number;
      };
    };

const tagsToOptions = (tagLabels: string[]): EuiComboBoxOptionOption[] =>
  tagLabels.map(label => ({ label }));

const createInitialState = (): CaseFormState => ({
  status: undefined,
  comment: '',
  tags: [],
  currentUsername: '',
  isLoadingUser: true,
  existingCreatedAt: undefined,
  existingUpdatedAt: undefined,
  isSaving: false,
  baseline: { status: undefined, comment: '', tags: [] },
});

function caseFormReducer(state: CaseFormState, action: CaseFormAction): CaseFormState {
  switch (action.type) {
    case 'LOAD_DOCUMENT': {
      const { status, comment, tags, userName, createdAt, updatedAt } = action.payload;
      const baseline: CaseFormBaseline = { status, comment, tags };
      return {
        ...state,
        status,
        comment,
        tags: tagsToOptions(tags),
        baseline,
        existingCreatedAt: createdAt,
        existingUpdatedAt: updatedAt,
        currentUsername: userName,
        isLoadingUser: !userName,
        isSaving: false,
      };
    }
    case 'SET_DASHBOARD_USER':
      return {
        ...state,
        currentUsername: action.payload,
        isLoadingUser: false,
      };
    case 'SET_LOADING_USER':
      return { ...state, isLoadingUser: action.payload };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_COMMENT':
      return { ...state, comment: action.payload };
    case 'SET_TAGS':
      return { ...state, tags: action.payload };
    case 'ADD_TAG': {
      const trimmed = action.payload.trim();
      if (!trimmed) return state;
      return { ...state, tags: [...state.tags, { label: trimmed }] };
    }
    case 'RESET':
      return {
        ...state,
        status: state.baseline.status,
        comment: state.baseline.comment,
        tags: tagsToOptions(state.baseline.tags),
      };
    case 'SAVE_START':
      return { ...state, isSaving: true };
    case 'SAVE_END':
      return { ...state, isSaving: false };
    case 'SAVE_SUCCESS': {
      const { status, comment, tags, createdAt, updatedAt } = action.payload;
      return {
        ...state,
        status,
        comment,
        tags: tagsToOptions(tags),
        baseline: { status, comment, tags },
        existingCreatedAt: state.existingCreatedAt ?? createdAt,
        existingUpdatedAt: updatedAt,
        isSaving: false,
      };
    }
    default:
      return state;
  }
}

/**
 * Reads a nested dotted key (e.g. `"wazuh.case.status"`) from a flat _source
 * object that may store it either flattened or truly nested.
 */
export function readSourceField<T = unknown>(
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

function extractCaseValuesFromDocument(
  document: CaseManagementFormDocument,
): DocumentCaseValues {
  const source = document._source;
  return {
    status: readSourceField<CaseStatus>(source, 'wazuh.case.status'),
    comment: readSourceField<string>(source, 'wazuh.case.comment') ?? '',
    tags: readSourceField<string[]>(source, 'wazuh.case.tags') ?? [],
    userName: readSourceField<string>(source, 'wazuh.case.user.name') ?? '',
    createdAt: readSourceField<string | number>(source, 'wazuh.case.created_at'),
    updatedAt: readSourceField<string | number>(source, 'wazuh.case.updated_at'),
  };
}

function isFormDirty(state: CaseFormState): boolean {
  const { baseline, status, comment, tags } = state;
  return (
    status !== baseline.status ||
    comment !== baseline.comment ||
    tags.map(t => t.label).join(',') !== baseline.tags.join(',')
  );
}

export function useCaseManagementForm(
  document: CaseManagementFormDocument,
): UseCaseManagementFormReturn {
  const documentKey = `${document._index}:${document._id}`;
  const [state, dispatch] = useReducer(caseFormReducer, undefined, createInitialState);

  const isNewCase = state.baseline.status === undefined;
  const isDirty = isFormDirty(state);

  useEffect(() => {
    dispatch({
      type: 'LOAD_DOCUMENT',
      payload: extractCaseValuesFromDocument(document),
    });
  }, [documentKey, document._source]);

  useEffect(() => {
    const { userName } = extractCaseValuesFromDocument(document);
    if (userName) {
      return;
    }

    let cancelled = false;
    dispatch({ type: 'SET_LOADING_USER', payload: true });
    getCurrentDashboardUsername()
      .then(username => {
        if (!cancelled) {
          dispatch({ type: 'SET_DASHBOARD_USER', payload: username });
        }
      })
      .catch(() => {
        if (!cancelled) {
          dispatch({ type: 'SET_LOADING_USER', payload: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [documentKey, document._source]);

  const setStatus = useCallback(
    (status: CaseStatus) => dispatch({ type: 'SET_STATUS', payload: status }),
    [],
  );
  const setComment = useCallback(
    (comment: string) => dispatch({ type: 'SET_COMMENT', payload: comment }),
    [],
  );
  const setTags = useCallback(
    (tags: EuiComboBoxOptionOption[]) => dispatch({ type: 'SET_TAGS', payload: tags }),
    [],
  );

  const handleTagCreate = useCallback((searchValue: string) => {
    dispatch({ type: 'ADD_TAG', payload: searchValue });
  }, []);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const handleSave = useCallback(async () => {
    if (!state.status) {
      getToasts().add({
        color: 'warning',
        title: 'Status is required',
        toastLifeTimeMs: 3000,
      });
      return;
    }

    const trimmedComment = state.comment.trim();
    const tagLabels = state.tags.map(t => t.label).filter(Boolean);

    dispatch({ type: 'SAVE_START' });
    try {
      const payload: UpdateCasePayload = {
        status: state.status,
        comment: trimmedComment || undefined,
        tags: tagLabels,
      };
      await updateDocumentCase(document._index, document._id, payload);

      const now = Date.now();
      dispatch({
        type: 'SAVE_SUCCESS',
        payload: {
          status: state.status,
          comment: trimmedComment,
          tags: tagLabels,
          createdAt: now,
          updatedAt: now,
        },
      });

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
      dispatch({ type: 'SAVE_END' });
    }
  }, [document._index, document._id, state.status, state.comment, state.tags, isNewCase]);

  return {
    status: state.status,
    comment: state.comment,
    tags: state.tags,
    currentUsername: state.currentUsername,
    isLoadingUser: state.isLoadingUser,
    existingCreatedAt: state.existingCreatedAt,
    existingUpdatedAt: state.existingUpdatedAt,
    isSaving: state.isSaving,
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
