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
  CaseData,
  CaseStatus,
  UpdateCasePayload,
  cleanDocumentCase,
  getFindingsCase,
  updateDocumentCase,
} from './case-management-service';

export interface CaseManagementFormDocument {
  _index: string;
  _id: string;
}

export interface UseCaseManagementFormReturn {
  status: CaseStatus | undefined;
  comment: string;
  tags: EuiComboBoxOptionOption[];
  caseUsername: string | undefined;
  isLoadingCase: boolean;
  existingCreatedAt: string | undefined;
  existingUpdatedAt: string | undefined;
  isSaving: boolean;
  isCleaning: boolean;
  isDirty: boolean;
  isNewCase: boolean;
  setStatus: (status: CaseStatus) => void;
  setComment: (comment: string) => void;
  setTags: (tags: EuiComboBoxOptionOption[]) => void;
  handleTagCreate: (value: string) => void;
  handleSave: () => Promise<void>;
  handleClean: () => Promise<void>;
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
  caseUsername: string | undefined;
  isLoadingCase: boolean;
  existingCreatedAt: string | undefined;
  existingUpdatedAt: string | undefined;
  isSaving: boolean;
  isCleaning: boolean;
  baseline: CaseFormBaseline;
};

type CaseFormAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: CaseData }
  | { type: 'LOAD_ERROR' }
  | { type: 'SET_STATUS'; payload: CaseStatus }
  | { type: 'SET_COMMENT'; payload: string }
  | { type: 'SET_TAGS'; payload: EuiComboBoxOptionOption[] }
  | { type: 'ADD_TAG'; payload: string }
  | { type: 'RESET' }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_END' }
  | { type: 'SAVE_SUCCESS'; payload: CaseData }
  | { type: 'CLEAN_START' }
  | { type: 'CLEAN_END' }
  | { type: 'CLEAN_SUCCESS'; payload: CaseData | null };

const tagsToOptions = (tagLabels: string[]): EuiComboBoxOptionOption[] =>
  tagLabels.map(label => ({ label }));

const createInitialState = (): CaseFormState => ({
  status: undefined,
  comment: '',
  tags: [],
  caseUsername: undefined,
  isLoadingCase: true,
  existingCreatedAt: undefined,
  existingUpdatedAt: undefined,
  isSaving: false,
  isCleaning: false,
  baseline: { status: undefined, comment: '', tags: [] },
});

function caseFormReducer(
  state: CaseFormState,
  action: CaseFormAction,
): CaseFormState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...createInitialState(), isLoadingCase: true };

    case 'LOAD_SUCCESS': {
      const {
        status,
        comment,
        tags,
        created_at: createdAt,
        updated_at: updatedAt,
        user,
      } = action.payload;
      const resolvedTags = tags ?? [];
      const baseline: CaseFormBaseline = {
        status,
        comment: comment ?? '',
        tags: resolvedTags,
      };
      return {
        ...state,
        isLoadingCase: false,
        status,
        comment: comment ?? '',
        tags: tagsToOptions(resolvedTags),
        baseline,
        existingCreatedAt: createdAt,
        existingUpdatedAt: updatedAt,
        caseUsername: user?.name,
        isSaving: false,
        isCleaning: false,
      };
    }

    case 'LOAD_ERROR':
      return { ...state, isLoadingCase: false };

    case 'SET_STATUS':
      return { ...state, status: action.payload };

    case 'SET_COMMENT':
      return { ...state, comment: action.payload };

    case 'SET_TAGS':
      return { ...state, tags: action.payload };

    case 'ADD_TAG': {
      const trimmed = action.payload.trim();
      if (!trimmed) {
        return state;
      }
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
      const {
        status,
        comment,
        tags,
        created_at: createdAt,
        updated_at: updatedAt,
        user,
      } = action.payload;
      const resolvedTags = tags ?? [];
      return {
        ...state,
        status,
        comment: comment ?? '',
        tags: tagsToOptions(resolvedTags),
        baseline: { status, comment: comment ?? '', tags: resolvedTags },
        existingCreatedAt: state.existingCreatedAt ?? createdAt,
        existingUpdatedAt: updatedAt,
        caseUsername: user?.name ?? state.caseUsername,
        isSaving: false,
      };
    }

    case 'CLEAN_START':
      return { ...state, isCleaning: true };

    case 'CLEAN_END':
      return { ...state, isCleaning: false };

    case 'CLEAN_SUCCESS': {
      const {
        status,
        comment,
        tags,
        created_at: createdAt,
        updated_at: updatedAt,
        user,
      } = action.payload ?? {};
      const resolvedTags = tags ?? [];
      return {
        ...state,
        status,
        comment: comment ?? '',
        tags: tagsToOptions(resolvedTags),
        baseline: { status, comment: comment ?? '', tags: resolvedTags },
        existingCreatedAt: createdAt,
        existingUpdatedAt: updatedAt,
        caseUsername: user?.name,
        isCleaning: false,
      };
    }

    default:
      return state;
  }
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
  onSaveSuccess?: (caseData: CaseData | null) => void,
): UseCaseManagementFormReturn {
  const [state, dispatch] = useReducer(
    caseFormReducer,
    undefined,
    createInitialState,
  );

  const isNewCase = state.baseline.status === undefined;
  const isDirty = isFormDirty(state);
  const isSaving = state.isSaving;
  const isCleaning = state.isCleaning;

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'LOAD_START' });

    (async () => {
      try {
        const caseData = await getFindingsCase(document._index, document._id);
        if (!cancelled) {
          dispatch({ type: 'LOAD_SUCCESS', payload: caseData ?? {} });
        }
      } catch {
        if (!cancelled) {
          dispatch({ type: 'LOAD_ERROR' });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [document._index, document._id]);

  const setStatus = useCallback(
    (status: CaseStatus) => dispatch({ type: 'SET_STATUS', payload: status }),
    [],
  );
  const setComment = useCallback(
    (comment: string) => dispatch({ type: 'SET_COMMENT', payload: comment }),
    [],
  );
  const setTags = useCallback(
    (tags: EuiComboBoxOptionOption[]) =>
      dispatch({ type: 'SET_TAGS', payload: tags }),
    [],
  );
  const handleTagCreate = useCallback((searchValue: string) => {
    dispatch({ type: 'ADD_TAG', payload: searchValue });
  }, []);
  const handleReset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const handleSave = useCallback(async () => {
    if (isSaving || isCleaning) {
      return;
    }

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
      const savedCase = await updateDocumentCase(
        document._index,
        document._id,
        payload,
      );

      dispatch({ type: 'SAVE_SUCCESS', payload: savedCase });
      onSaveSuccess?.(savedCase);
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
  }, [
    document._index,
    document._id,
    isSaving,
    isCleaning,
    state.status,
    state.comment,
    state.tags,
    isNewCase,
    onSaveSuccess,
  ]);

  const handleClean = useCallback(async () => {
    if (isSaving || isCleaning || isNewCase) {
      return;
    }

    dispatch({ type: 'CLEAN_START' });
    try {
      const cleanedCase = await cleanDocumentCase(
        document._index,
        document._id,
      );
      dispatch({ type: 'CLEAN_SUCCESS', payload: cleanedCase });
      onSaveSuccess?.(cleanedCase);
      getToasts().add({
        color: 'success',
        title: 'Case cleaned',
        toastLifeTimeMs: 3000,
      });
    } catch (error: unknown) {
      const options: UIErrorLog = {
        context: 'CaseManagementTab.handleClean',
        level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
        severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
        store: true,
        error: {
          error,
          message:
            error instanceof Error
              ? error.message
              : 'Could not clean case data',
          title: 'Case management error',
        },
      };
      getErrorOrchestrator().handleError(options);
      dispatch({ type: 'CLEAN_END' });
    }
  }, [
    document._index,
    document._id,
    isSaving,
    isCleaning,
    isNewCase,
    onSaveSuccess,
  ]);

  return {
    status: state.status,
    comment: state.comment,
    tags: state.tags,
    caseUsername: state.caseUsername,
    isLoadingCase: state.isLoadingCase,
    existingCreatedAt: state.existingCreatedAt,
    existingUpdatedAt: state.existingUpdatedAt,
    isSaving,
    isCleaning,
    isDirty,
    isNewCase,
    setStatus,
    setComment,
    setTags,
    handleTagCreate,
    handleSave,
    handleClean,
    handleReset,
  };
}
