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
  CaseComment,
  CaseData,
  CasePriority,
  CaseSeverity,
  CaseStatus,
  CaseTLP,
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
  title: string;
  description: string;
  severity: CaseSeverity | '';
  priority: CasePriority | '';
  tlp: CaseTLP | '';
  tags: EuiComboBoxOptionOption[];
  comments: CaseComment[];
  newComment: string;
  currentUsername: string | undefined;
  caseUsername: string | undefined;
  isLoadingCase: boolean;
  loadFailed: boolean;
  existingCreatedAt: string | undefined;
  existingUpdatedAt: string | undefined;
  isSaving: boolean;
  isCleaning: boolean;
  isSavingComment: boolean;
  isDirty: boolean;
  hasUnsavedChanges: boolean;
  isNewCase: boolean;
  setStatus: (status: CaseStatus) => void;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setSeverity: (severity: CaseSeverity | '') => void;
  setPriority: (priority: CasePriority | '') => void;
  setTlp: (tlp: CaseTLP | '') => void;
  setTags: (tags: EuiComboBoxOptionOption[]) => void;
  handleTagCreate: (value: string) => void;
  setNewComment: (comment: string) => void;
  handleCommentAdd: () => Promise<void>;
  handleCommentEditSave: (
    createdAt: string,
    comment: string,
  ) => Promise<boolean>;
  handleSave: () => Promise<void>;
  handleClean: () => Promise<void>;
  handleReset: () => void;
}

type CaseFormBaseline = {
  status: CaseStatus | undefined;
  title: string;
  description: string;
  severity: CaseSeverity | '';
  priority: CasePriority | '';
  tlp: CaseTLP | '';
  tags: string[];
};

export type CaseFormState = {
  status: CaseStatus | undefined;
  title: string;
  description: string;
  severity: CaseSeverity | '';
  priority: CasePriority | '';
  tlp: CaseTLP | '';
  tags: EuiComboBoxOptionOption[];
  comments: CaseComment[];
  newComment: string;
  currentUsername: string | undefined;
  caseUsername: string | undefined;
  isLoadingCase: boolean;
  loadFailed: boolean;
  existingCreatedAt: string | undefined;
  existingUpdatedAt: string | undefined;
  isSaving: boolean;
  isCleaning: boolean;
  isSavingComment: boolean;
  baseline: CaseFormBaseline;
};

export type CaseFormAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: { caseData: CaseData; username?: string } }
  | { type: 'LOAD_ERROR' }
  | { type: 'SET_STATUS'; payload: CaseStatus }
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  | { type: 'SET_SEVERITY'; payload: CaseSeverity | '' }
  | { type: 'SET_PRIORITY'; payload: CasePriority | '' }
  | { type: 'SET_TLP'; payload: CaseTLP | '' }
  | { type: 'SET_TAGS'; payload: EuiComboBoxOptionOption[] }
  | { type: 'ADD_TAG'; payload: string }
  | { type: 'SET_NEW_COMMENT'; payload: string }
  | { type: 'RESET' }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_END' }
  | { type: 'SAVE_SUCCESS'; payload: { caseData: CaseData; username?: string } }
  | { type: 'COMMENT_SAVE_START' }
  | { type: 'COMMENT_SAVE_END' }
  | {
      type: 'COMMENT_SAVE_SUCCESS';
      payload: { caseData: CaseData; username?: string };
    }
  | { type: 'CLEAN_START' }
  | { type: 'CLEAN_END' }
  | { type: 'CLEAN_SUCCESS'; payload: CaseData | null };

const tagsToOptions = (tagLabels: string[]): EuiComboBoxOptionOption[] =>
  tagLabels.map(label => ({ label }));

const baselineFromCase = (caseData: CaseData): CaseFormBaseline => ({
  status: caseData.status,
  title: caseData.title ?? '',
  description: caseData.description ?? '',
  severity: caseData.severity ?? '',
  priority: caseData.priority ?? '',
  tlp: caseData.tlp ?? '',
  tags: caseData.tags ?? [],
});

const stateFromCase = (
  state: CaseFormState,
  caseData: CaseData,
): CaseFormState => {
  const baseline = baselineFromCase(caseData);
  return {
    ...state,
    status: baseline.status,
    title: baseline.title,
    description: baseline.description,
    severity: baseline.severity,
    priority: baseline.priority,
    tlp: baseline.tlp,
    tags: tagsToOptions(baseline.tags),
    comments: caseData.comments ?? [],
    newComment: '',
    baseline,
  };
};

export const createInitialState = (): CaseFormState => ({
  status: undefined,
  title: '',
  description: '',
  severity: '',
  priority: '',
  tlp: '',
  tags: [],
  comments: [],
  newComment: '',
  currentUsername: undefined,
  caseUsername: undefined,
  isLoadingCase: true,
  loadFailed: false,
  existingCreatedAt: undefined,
  existingUpdatedAt: undefined,
  isSaving: false,
  isCleaning: false,
  isSavingComment: false,
  baseline: {
    status: undefined,
    title: '',
    description: '',
    severity: '',
    priority: '',
    tlp: '',
    tags: [],
  },
});

export function caseFormReducer(
  state: CaseFormState,
  action: CaseFormAction,
): CaseFormState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...createInitialState(), isLoadingCase: true };

    case 'LOAD_SUCCESS': {
      const { caseData, username } = action.payload;
      return {
        ...stateFromCase(state, caseData),
        isLoadingCase: false,
        existingCreatedAt: caseData.created_at,
        existingUpdatedAt: caseData.updated_at,
        caseUsername: caseData.user?.name,
        currentUsername: username ?? state.currentUsername,
        isSaving: false,
        isCleaning: false,
      };
    }

    case 'LOAD_ERROR':
      // The case may exist but could not be read: rendering the "create
      // case" form here would let a save blank the existing case.
      return { ...state, isLoadingCase: false, loadFailed: true };

    case 'SET_STATUS':
      return { ...state, status: action.payload };

    case 'SET_TITLE':
      return { ...state, title: action.payload };

    case 'SET_DESCRIPTION':
      return { ...state, description: action.payload };

    case 'SET_SEVERITY':
      return { ...state, severity: action.payload };

    case 'SET_PRIORITY':
      return { ...state, priority: action.payload };

    case 'SET_TLP':
      return { ...state, tlp: action.payload };

    case 'SET_TAGS':
      return { ...state, tags: action.payload };

    case 'ADD_TAG': {
      const trimmed = action.payload.trim();
      if (!trimmed) {
        return state;
      }
      return { ...state, tags: [...state.tags, { label: trimmed }] };
    }

    case 'SET_NEW_COMMENT':
      return { ...state, newComment: action.payload };

    case 'RESET':
      return {
        ...state,
        status: state.baseline.status,
        title: state.baseline.title,
        description: state.baseline.description,
        severity: state.baseline.severity,
        priority: state.baseline.priority,
        tlp: state.baseline.tlp,
        tags: tagsToOptions(state.baseline.tags),
      };

    case 'SAVE_START':
      return { ...state, isSaving: true };

    case 'SAVE_END':
      return { ...state, isSaving: false };

    case 'SAVE_SUCCESS': {
      const { caseData, username } = action.payload;
      return {
        ...stateFromCase(state, caseData),
        // The comment composer is independent of the form: a form save must
        // not wipe a typed-but-unsubmitted comment draft.
        newComment: state.newComment,
        existingCreatedAt: state.existingCreatedAt ?? caseData.created_at,
        existingUpdatedAt: caseData.updated_at,
        caseUsername: caseData.user?.name ?? state.caseUsername,
        currentUsername: username ?? state.currentUsername,
        isSaving: false,
      };
    }

    case 'COMMENT_SAVE_START':
      return { ...state, isSavingComment: true };

    case 'COMMENT_SAVE_END':
      return { ...state, isSavingComment: false };

    case 'COMMENT_SAVE_SUCCESS': {
      const { caseData, username } = action.payload;
      // Comments persist on their own: refresh only the comment thread and
      // the case metadata so unsaved form drafts (and their baseline) are
      // never clobbered by a comment save.
      return {
        ...state,
        comments: caseData.comments ?? state.comments,
        existingCreatedAt: state.existingCreatedAt ?? caseData.created_at,
        existingUpdatedAt: caseData.updated_at ?? state.existingUpdatedAt,
        caseUsername: caseData.user?.name ?? state.caseUsername,
        currentUsername: username ?? state.currentUsername,
        isSavingComment: false,
      };
    }

    case 'CLEAN_START':
      return { ...state, isCleaning: true };

    case 'CLEAN_END':
      return { ...state, isCleaning: false };

    case 'CLEAN_SUCCESS': {
      const caseData = action.payload ?? {};
      return {
        ...stateFromCase(state, caseData),
        existingCreatedAt: caseData.created_at,
        existingUpdatedAt: caseData.updated_at,
        caseUsername: caseData.user?.name,
        isCleaning: false,
      };
    }

    default:
      return state;
  }
}

export function isFormDirty(state: CaseFormState): boolean {
  const { baseline } = state;
  return (
    state.status !== baseline.status ||
    state.title !== baseline.title ||
    state.description !== baseline.description ||
    state.severity !== baseline.severity ||
    state.priority !== baseline.priority ||
    state.tlp !== baseline.tlp ||
    state.tags.map(t => t.label).join(',') !== baseline.tags.join(',')
  );
}

export function useCaseManagementForm(
  document: CaseManagementFormDocument,
  onSaveSuccess?: (caseData: CaseData | null) => void,
  onCommentSaveSuccess?: (caseData: CaseData | null) => void,
): UseCaseManagementFormReturn {
  const [state, dispatch] = useReducer(
    caseFormReducer,
    undefined,
    createInitialState,
  );

  const isNewCase = state.baseline.status === undefined;
  const isDirty = isFormDirty(state);
  const titleIsAutoSuggestion =
    isNewCase &&
    !state.baseline.title &&
    state.title === `Case_${document._id}`;
  const hasUnsavedChanges =
    (titleIsAutoSuggestion
      ? isFormDirty({ ...state, title: state.baseline.title })
      : isDirty) ||
    // The comment composer is not form state, but a typed draft would still
    // be lost on close: it must keep triggering the unsaved-changes guard.
    state.newComment.trim() !== '';
  const isSaving = state.isSaving;
  const isCleaning = state.isCleaning;
  const isSavingComment = state.isSavingComment;

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'LOAD_START' });

    (async () => {
      try {
        const { case: caseData, username } = await getFindingsCase(
          document._index,
          document._id,
        );
        if (!cancelled) {
          dispatch({
            type: 'LOAD_SUCCESS',
            payload: { caseData: caseData ?? {}, username },
          });
          if (!caseData?.status && !caseData?.title) {
            dispatch({ type: 'SET_TITLE', payload: `Case_${document._id}` });
          }
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
  const setTitle = useCallback(
    (title: string) => dispatch({ type: 'SET_TITLE', payload: title }),
    [],
  );
  const setDescription = useCallback(
    (description: string) =>
      dispatch({ type: 'SET_DESCRIPTION', payload: description }),
    [],
  );
  const setSeverity = useCallback(
    (severity: CaseSeverity | '') =>
      dispatch({ type: 'SET_SEVERITY', payload: severity }),
    [],
  );
  const setPriority = useCallback(
    (priority: CasePriority | '') =>
      dispatch({ type: 'SET_PRIORITY', payload: priority }),
    [],
  );
  const setTlp = useCallback(
    (tlp: CaseTLP | '') => dispatch({ type: 'SET_TLP', payload: tlp }),
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
  const setNewComment = useCallback(
    (comment: string) =>
      dispatch({ type: 'SET_NEW_COMMENT', payload: comment }),
    [],
  );
  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
    if (!state.baseline.status && !state.baseline.title) {
      dispatch({ type: 'SET_TITLE', payload: `Case_${document._id}` });
    }
  }, [state.baseline.status, state.baseline.title, document._id]);

  const handleSave = useCallback(async () => {
    if (isSaving || isCleaning || isSavingComment) {
      return;
    }

    const missingRequiredField = [
      ['Status', state.status],
      ['Title', state.title.trim()],
      ['Severity', state.severity],
    ].find(([, value]) => !value)?.[0];
    if (missingRequiredField) {
      getToasts().add({
        color: 'warning',
        title: `${missingRequiredField} is required`,
        toastLifeTimeMs: 3000,
      });
      return;
    }

    const tagLabels = state.tags.map(t => t.label).filter(Boolean);

    dispatch({ type: 'SAVE_START' });
    try {
      const { baseline } = state;
      // The new wazuh.case fields are only sent when the user changed them:
      // on a findings index without the new mappings (dynamic strict) any
      // unmapped key is rejected, so a status-only save must keep working.
      const payload: UpdateCasePayload = {
        status: state.status,
        tags: tagLabels,
        ...(state.title !== baseline.title
          ? { title: state.title.trim() }
          : {}),
        ...(state.description !== baseline.description
          ? { description: state.description.trim() }
          : {}),
        ...(state.severity !== baseline.severity
          ? { severity: state.severity }
          : {}),
        ...(state.priority !== baseline.priority
          ? { priority: state.priority }
          : {}),
        ...(state.tlp !== baseline.tlp ? { tlp: state.tlp } : {}),
      };
      const { case: savedCase, username } = await updateDocumentCase(
        document._index,
        document._id,
        payload,
      );

      dispatch({
        type: 'SAVE_SUCCESS',
        payload: { caseData: savedCase ?? {}, username },
      });
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
    isSavingComment,
    state.status,
    state.title,
    state.description,
    state.severity,
    state.priority,
    state.tlp,
    state.baseline,
    state.tags,
    isNewCase,
    onSaveSuccess,
  ]);

  const handleClean = useCallback(async () => {
    if (isSaving || isCleaning || isSavingComment || isNewCase) {
      return;
    }

    dispatch({ type: 'CLEAN_START' });
    try {
      const cleanedCase = await cleanDocumentCase(
        document._index,
        document._id,
      );
      dispatch({ type: 'CLEAN_SUCCESS', payload: cleanedCase });
      if (!cleanedCase?.status && !cleanedCase?.title) {
        dispatch({ type: 'SET_TITLE', payload: `Case_${document._id}` });
      }
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
    isSavingComment,
    isNewCase,
    onSaveSuccess,
  ]);

  // Comments persist on their own submit: the server appends/edits them from
  // a partial payload and stamps author and timestamps, so the form fields
  // never travel with a comment save.
  const submitComment = useCallback(
    async (
      payload: UpdateCasePayload,
      successTitle: string,
      context: string,
    ): Promise<boolean> => {
      // The server update is an unguarded read-modify-write of wazuh.case:
      // never run two writes from this client at the same time.
      if (isSaving || isCleaning || isSavingComment) {
        return false;
      }

      dispatch({ type: 'COMMENT_SAVE_START' });
      try {
        const { case: savedCase, username } = await updateDocumentCase(
          document._index,
          document._id,
          payload,
        );
        dispatch({
          type: 'COMMENT_SAVE_SUCCESS',
          payload: { caseData: savedCase ?? {}, username },
        });
        onCommentSaveSuccess?.(savedCase);
        getToasts().add({
          color: 'success',
          title: successTitle,
          toastLifeTimeMs: 3000,
        });
        return true;
      } catch (error: unknown) {
        const options: UIErrorLog = {
          context,
          level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
          severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
          store: true,
          error: {
            error,
            message:
              error instanceof Error
                ? error.message
                : 'Could not save the comment',
            title: 'Case management error',
          },
        };
        getErrorOrchestrator().handleError(options);
        dispatch({ type: 'COMMENT_SAVE_END' });
        return false;
      }
    },
    [
      document._index,
      document._id,
      isSaving,
      isCleaning,
      isSavingComment,
      onCommentSaveSuccess,
    ],
  );

  const handleCommentAdd = useCallback(async () => {
    const trimmed = state.newComment.trim();
    // A comment-only save on a caseless document would create a partial case
    // without the required fields: comments start after the case exists.
    if (!trimmed || isNewCase) {
      return;
    }
    const saved = await submitComment(
      { newComment: trimmed },
      'Comment added',
      'CaseManagementTab.handleCommentAdd',
    );
    if (saved) {
      dispatch({ type: 'SET_NEW_COMMENT', payload: '' });
    }
  }, [state.newComment, isNewCase, submitComment]);

  const handleCommentEditSave = useCallback(
    async (createdAt: string, comment: string): Promise<boolean> => {
      const trimmed = comment.trim();
      if (!trimmed) {
        // Comments cannot be blanked out (no deletion supported).
        return false;
      }
      const original = state.comments.find(c => c.created_at === createdAt);
      if (!original) {
        return false;
      }
      if (trimmed === original.comment) {
        // Unchanged text: nothing to persist, the editor can just close.
        return true;
      }
      return submitComment(
        { editedComments: [{ created_at: createdAt, comment: trimmed }] },
        'Comment updated',
        'CaseManagementTab.handleCommentEditSave',
      );
    },
    [state.comments, submitComment],
  );

  return {
    status: state.status,
    title: state.title,
    description: state.description,
    severity: state.severity,
    priority: state.priority,
    tlp: state.tlp,
    tags: state.tags,
    comments: state.comments,
    newComment: state.newComment,
    currentUsername: state.currentUsername,
    caseUsername: state.caseUsername,
    isLoadingCase: state.isLoadingCase,
    loadFailed: state.loadFailed,
    existingCreatedAt: state.existingCreatedAt,
    existingUpdatedAt: state.existingUpdatedAt,
    isSaving,
    isCleaning,
    isSavingComment,
    isDirty,
    hasUnsavedChanges,
    isNewCase,
    setStatus,
    setTitle,
    setDescription,
    setSeverity,
    setPriority,
    setTlp,
    setTags,
    handleTagCreate,
    setNewComment,
    handleCommentAdd,
    handleCommentEditSave,
    handleSave,
    handleClean,
    handleReset,
  };
}
