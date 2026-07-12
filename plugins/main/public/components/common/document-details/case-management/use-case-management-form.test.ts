import { renderHook, act, waitFor } from '@testing-library/react';
import {
  CaseFormState,
  caseFormReducer,
  createInitialState,
  isFormDirty,
  useCaseManagementForm,
} from './use-case-management-form';
import { CaseData } from './case-management-service';
import {
  cleanDocumentCase,
  getFindingsCase,
  updateDocumentCase,
} from './case-management-service';

jest.mock('./case-management-service', () => ({
  getFindingsCase: jest.fn(),
  updateDocumentCase: jest.fn(),
  cleanDocumentCase: jest.fn(),
}));

const mockToastAdd = jest.fn();
jest.mock('../../../../kibana-services', () => ({
  getToasts: () => ({ add: mockToastAdd }),
}));

const mockHandleError = jest.fn();
jest.mock('../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({ handleError: mockHandleError }),
}));

const EARLIER = '2026-06-30T08:00:00.000Z';
const LATER = '2026-07-01T12:00:00.000Z';

const fullCase: CaseData = {
  title: 'a title',
  description: 'a description',
  status: 'active',
  severity: 'high',
  priority: 'urgent',
  tlp: 'TLP:AMBER',
  tags: ['one', 'two'],
  comments: [
    {
      author: 'admin',
      comment: 'first',
      created_at: EARLIER,
      updated_at: EARLIER,
    },
  ],
  created_at: EARLIER,
  updated_at: EARLIER,
  user: { name: 'admin' },
};

const loadedState = (caseData: CaseData, username = 'admin'): CaseFormState =>
  caseFormReducer(createInitialState(), {
    type: 'LOAD_SUCCESS',
    payload: { caseData, username },
  });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('caseFormReducer', () => {
  it('LOAD_SUCCESS maps every field and builds the baseline', () => {
    const state = loadedState(fullCase);

    expect(state).toMatchObject({
      status: 'active',
      title: 'a title',
      description: 'a description',
      severity: 'high',
      priority: 'urgent',
      tlp: 'TLP:AMBER',
      tags: [{ label: 'one' }, { label: 'two' }],
      comments: fullCase.comments,
      newComment: '',
      currentUsername: 'admin',
      caseUsername: 'admin',
      existingCreatedAt: EARLIER,
      existingUpdatedAt: EARLIER,
      isLoadingCase: false,
    });
    expect(isFormDirty(state)).toBe(false);
  });

  it('LOAD_ERROR flags the failure instead of presenting a new case', () => {
    const state = caseFormReducer(createInitialState(), {
      type: 'LOAD_ERROR',
    });

    expect(state.isLoadingCase).toBe(false);
    expect(state.loadFailed).toBe(true);
  });

  it('LOAD_SUCCESS falls back to empty values for an unset case', () => {
    const state = loadedState({});

    expect(state).toMatchObject({
      status: undefined,
      title: '',
      description: '',
      severity: '',
      priority: '',
      tlp: '',
      tags: [],
      comments: [],
    });
    expect(state.baseline.status).toBeUndefined();
  });

  it.each([
    ['SET_TITLE', 'new title'],
    ['SET_DESCRIPTION', 'new description'],
    ['SET_SEVERITY', 'critical'],
    ['SET_PRIORITY', 'low'],
    ['SET_TLP', 'TLP:RED'],
  ] as const)('%s marks the form dirty', (type, payload) => {
    const state = caseFormReducer(loadedState(fullCase), {
      type,
      payload,
    } as any);

    expect(isFormDirty(state)).toBe(true);
  });

  it('typing a new comment does not mark the form dirty', () => {
    const state = caseFormReducer(loadedState(fullCase), {
      type: 'SET_NEW_COMMENT',
      payload: 'a new note',
    });

    expect(isFormDirty(state)).toBe(false);
  });

  it('RESET restores scalars but keeps the comment draft', () => {
    let state = loadedState(fullCase);
    state = caseFormReducer(state, { type: 'SET_TITLE', payload: 'changed' });
    state = caseFormReducer(state, {
      type: 'SET_NEW_COMMENT',
      payload: 'draft',
    });

    state = caseFormReducer(state, { type: 'RESET' });

    expect(state.title).toBe('a title');
    expect(state.newComment).toBe('draft');
    expect(isFormDirty(state)).toBe(false);
  });

  it('SAVE_SUCCESS re-baselines, replaces comments and keeps the comment draft', () => {
    let state = loadedState(fullCase);
    state = caseFormReducer(state, {
      type: 'SET_NEW_COMMENT',
      payload: 'not submitted yet',
    });

    const savedCase: CaseData = {
      ...fullCase,
      updated_at: LATER,
      comments: [
        ...(fullCase.comments ?? []),
        {
          author: 'admin',
          comment: 'second',
          created_at: LATER,
          updated_at: LATER,
        },
      ],
    };
    state = caseFormReducer(state, {
      type: 'SAVE_SUCCESS',
      payload: { caseData: savedCase, username: 'admin' },
    });

    expect(state.comments).toHaveLength(2);
    expect(state.newComment).toBe('not submitted yet');
    expect(state.existingUpdatedAt).toBe(LATER);
    expect(isFormDirty(state)).toBe(false);
  });

  it('COMMENT_SAVE_START and COMMENT_SAVE_END toggle the flag', () => {
    let state = caseFormReducer(loadedState(fullCase), {
      type: 'COMMENT_SAVE_START',
    });
    expect(state.isSavingComment).toBe(true);

    state = caseFormReducer(state, { type: 'COMMENT_SAVE_END' });
    expect(state.isSavingComment).toBe(false);
  });

  it('COMMENT_SAVE_SUCCESS refreshes comments without touching form drafts', () => {
    let state = loadedState(fullCase);
    state = caseFormReducer(state, {
      type: 'SET_TITLE',
      payload: 'draft title',
    });
    state = caseFormReducer(state, { type: 'COMMENT_SAVE_START' });

    const savedCase: CaseData = {
      ...fullCase,
      updated_at: LATER,
      comments: [
        ...(fullCase.comments ?? []),
        {
          author: 'admin',
          comment: 'a note',
          created_at: LATER,
          updated_at: LATER,
        },
      ],
    };
    state = caseFormReducer(state, {
      type: 'COMMENT_SAVE_SUCCESS',
      payload: { caseData: savedCase, username: 'admin' },
    });

    expect(state.comments).toHaveLength(2);
    expect(state.existingUpdatedAt).toBe(LATER);
    expect(state.isSavingComment).toBe(false);
    // The unsaved form draft and its baseline must survive a comment save.
    expect(state.title).toBe('draft title');
    expect(state.baseline.title).toBe('a title');
    expect(isFormDirty(state)).toBe(true);
  });

  it('CLEAN_SUCCESS with null empties the form and makes the case new again', () => {
    const state = caseFormReducer(loadedState(fullCase), {
      type: 'CLEAN_SUCCESS',
      payload: null,
    });

    expect(state).toMatchObject({
      status: undefined,
      title: '',
      severity: '',
      comments: [],
    });
    expect(state.baseline.status).toBeUndefined();
    expect(state.currentUsername).toBe('admin');
  });
});

describe('useCaseManagementForm', () => {
  const documentRef = { _index: 'wazuh-findings-v5-security', _id: 'doc-1' };

  it('loads the case on mount and exposes its fields', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: fullCase,
      username: 'admin',
    });

    const { result } = renderHook(() => useCaseManagementForm(documentRef));

    await waitFor(() => expect(result.current.isLoadingCase).toBe(false));

    expect(getFindingsCase).toHaveBeenCalledWith(
      'wazuh-findings-v5-security',
      'doc-1',
    );
    expect(result.current.title).toBe('a title');
    expect(result.current.comments).toHaveLength(1);
    expect(result.current.currentUsername).toBe('admin');
    expect(result.current.isNewCase).toBe(false);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('prefills the title with Case_<document id> for a new case and sends it on create', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: null,
      username: 'admin',
    });
    (updateDocumentCase as jest.Mock).mockResolvedValue({
      case: { status: 'active', title: 'Case_doc-1', severity: 'low' },
      username: 'admin',
    });

    const { result } = renderHook(() => useCaseManagementForm(documentRef));
    await waitFor(() => expect(result.current.isLoadingCase).toBe(false));

    expect(result.current.title).toBe('Case_doc-1');
    expect(result.current.isNewCase).toBe(true);
    // The suggested title makes the form dirty, but it is not a user edit:
    // it must not count as unsaved changes.
    expect(result.current.isDirty).toBe(true);
    expect(result.current.hasUnsavedChanges).toBe(false);

    act(() => {
      result.current.setTitle('custom');
    });
    expect(result.current.hasUnsavedChanges).toBe(true);
    act(() => {
      result.current.handleReset();
    });
    expect(result.current.title).toBe('Case_doc-1');
    expect(result.current.hasUnsavedChanges).toBe(false);

    act(() => {
      result.current.setStatus('active');
      result.current.setSeverity('low');
    });
    expect(result.current.hasUnsavedChanges).toBe(true);
    await act(async () => {
      await result.current.handleSave();
    });

    expect(updateDocumentCase).toHaveBeenCalledWith(
      'wazuh-findings-v5-security',
      'doc-1',
      expect.objectContaining({ title: 'Case_doc-1' }),
    );
  });

  it('requires a status before saving', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: null,
      username: 'admin',
    });

    const { result } = renderHook(() => useCaseManagementForm(documentRef));
    await waitFor(() => expect(result.current.isLoadingCase).toBe(false));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Status is required' }),
    );
    expect(updateDocumentCase).not.toHaveBeenCalled();
  });

  it('requires a title and a severity before saving', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: null,
      username: 'admin',
    });

    const { result } = renderHook(() => useCaseManagementForm(documentRef));
    await waitFor(() => expect(result.current.isLoadingCase).toBe(false));

    act(() => {
      result.current.setStatus('active');
      result.current.setTitle('   ');
    });
    await act(async () => {
      await result.current.handleSave();
    });
    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Title is required' }),
    );

    act(() => {
      result.current.setTitle('a case');
    });
    await act(async () => {
      await result.current.handleSave();
    });
    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Severity is required' }),
    );
    expect(updateDocumentCase).not.toHaveBeenCalled();
  });

  it('builds the exact payload on save and re-baselines', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: fullCase,
      username: 'admin',
    });
    const savedCase: CaseData = { ...fullCase, updated_at: LATER };
    (updateDocumentCase as jest.Mock).mockResolvedValue({
      case: savedCase,
      username: 'admin',
    });
    const onSaveSuccess = jest.fn();

    const { result } = renderHook(() =>
      useCaseManagementForm(documentRef, onSaveSuccess),
    );
    await waitFor(() => expect(result.current.isLoadingCase).toBe(false));

    act(() => {
      result.current.setTitle('  edited title  ');
      result.current.setSeverity('critical');
    });

    await act(async () => {
      await result.current.handleSave();
    });

    // Unchanged scalars (description, priority, tlp) are omitted so a save
    // against an index without the new mappings keeps working.
    expect(updateDocumentCase).toHaveBeenCalledWith(
      'wazuh-findings-v5-security',
      'doc-1',
      {
        status: 'active',
        tags: ['one', 'two'],
        title: 'edited title',
        severity: 'critical',
      },
    );
    expect(onSaveSuccess).toHaveBeenCalledWith(savedCase);
    expect(result.current.isDirty).toBe(false);
    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Case updated' }),
    );
  });

  it('never sends comment fields on a form save', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: fullCase,
      username: 'admin',
    });
    (updateDocumentCase as jest.Mock).mockResolvedValue({
      case: fullCase,
      username: 'admin',
    });

    const { result } = renderHook(() => useCaseManagementForm(documentRef));
    await waitFor(() => expect(result.current.isLoadingCase).toBe(false));

    act(() => {
      result.current.setTitle('another title');
      // A typed comment draft belongs to the composer, not to the form.
      result.current.setNewComment('a typed draft');
    });
    await act(async () => {
      await result.current.handleSave();
    });

    const payload = (updateDocumentCase as jest.Mock).mock.calls[0][2];
    expect(payload).not.toHaveProperty('newComment');
    expect(payload).not.toHaveProperty('editedComments');
    expect(result.current.newComment).toBe('a typed draft');
  });

  it('a typed comment counts as unsaved changes but not as form dirty', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: fullCase,
      username: 'admin',
    });

    const { result } = renderHook(() => useCaseManagementForm(documentRef));
    await waitFor(() => expect(result.current.isLoadingCase).toBe(false));

    act(() => {
      result.current.setNewComment('a note');
    });

    expect(result.current.isDirty).toBe(false);
    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('adds a comment through its own submit without touching the form', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: fullCase,
      username: 'admin',
    });
    const savedCase: CaseData = {
      ...fullCase,
      updated_at: LATER,
      comments: [
        ...(fullCase.comments ?? []),
        {
          author: 'admin',
          comment: 'a note',
          created_at: LATER,
          updated_at: LATER,
        },
      ],
    };
    (updateDocumentCase as jest.Mock).mockResolvedValue({
      case: savedCase,
      username: 'admin',
    });
    const onSaveSuccess = jest.fn();
    const onCommentSaveSuccess = jest.fn();

    const { result } = renderHook(() =>
      useCaseManagementForm(documentRef, onSaveSuccess, onCommentSaveSuccess),
    );
    await waitFor(() => expect(result.current.isLoadingCase).toBe(false));

    act(() => {
      result.current.setTitle('draft title');
      result.current.setNewComment('  a note  ');
    });
    await act(async () => {
      await result.current.handleCommentAdd();
    });

    expect(updateDocumentCase).toHaveBeenCalledWith(
      'wazuh-findings-v5-security',
      'doc-1',
      { newComment: 'a note' },
    );
    expect(result.current.comments).toHaveLength(2);
    expect(result.current.newComment).toBe('');
    // The unsaved form draft must survive the comment save.
    expect(result.current.title).toBe('draft title');
    expect(result.current.isDirty).toBe(true);
    expect(onCommentSaveSuccess).toHaveBeenCalledWith(savedCase);
    expect(onSaveSuccess).not.toHaveBeenCalled();
    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Comment added' }),
    );
  });

  it('handleCommentAdd ignores a whitespace-only comment', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: fullCase,
      username: 'admin',
    });

    const { result } = renderHook(() => useCaseManagementForm(documentRef));
    await waitFor(() => expect(result.current.isLoadingCase).toBe(false));

    act(() => {
      result.current.setNewComment('   ');
    });
    await act(async () => {
      await result.current.handleCommentAdd();
    });

    expect(updateDocumentCase).not.toHaveBeenCalled();
  });

  it('keeps the comment draft and reports the error when adding fails', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: fullCase,
      username: 'admin',
    });
    (updateDocumentCase as jest.Mock).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useCaseManagementForm(documentRef));
    await waitFor(() => expect(result.current.isLoadingCase).toBe(false));

    act(() => {
      result.current.setNewComment('a note');
    });
    await act(async () => {
      await result.current.handleCommentAdd();
    });

    expect(mockHandleError).toHaveBeenCalled();
    expect(result.current.isSavingComment).toBe(false);
    expect(result.current.newComment).toBe('a note');
  });

  it('persists an inline comment edit immediately', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: fullCase,
      username: 'admin',
    });
    const savedCase: CaseData = {
      ...fullCase,
      updated_at: LATER,
      comments: [
        {
          author: 'admin',
          comment: 'first edited',
          created_at: EARLIER,
          updated_at: LATER,
        },
      ],
    };
    (updateDocumentCase as jest.Mock).mockResolvedValue({
      case: savedCase,
      username: 'admin',
    });

    const { result } = renderHook(() => useCaseManagementForm(documentRef));
    await waitFor(() => expect(result.current.isLoadingCase).toBe(false));

    let saved = false;
    await act(async () => {
      saved = await result.current.handleCommentEditSave(
        EARLIER,
        '  first edited  ',
      );
    });

    expect(saved).toBe(true);
    expect(updateDocumentCase).toHaveBeenCalledWith(
      'wazuh-findings-v5-security',
      'doc-1',
      { editedComments: [{ created_at: EARLIER, comment: 'first edited' }] },
    );
    expect(result.current.comments[0].comment).toBe('first edited');
    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Comment updated' }),
    );
  });

  it('handleCommentEditSave skips the request when the text is unchanged', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: fullCase,
      username: 'admin',
    });

    const { result } = renderHook(() => useCaseManagementForm(documentRef));
    await waitFor(() => expect(result.current.isLoadingCase).toBe(false));

    let saved = false;
    await act(async () => {
      saved = await result.current.handleCommentEditSave(EARLIER, 'first');
    });

    expect(saved).toBe(true);
    expect(updateDocumentCase).not.toHaveBeenCalled();
  });

  it('handleCommentEditSave rejects blank edits and unknown comments', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: fullCase,
      username: 'admin',
    });

    const { result } = renderHook(() => useCaseManagementForm(documentRef));
    await waitFor(() => expect(result.current.isLoadingCase).toBe(false));

    let saved = true;
    await act(async () => {
      saved = await result.current.handleCommentEditSave(EARLIER, '   ');
    });
    expect(saved).toBe(false);

    await act(async () => {
      saved = await result.current.handleCommentEditSave('does-not-exist', 'x');
    });
    expect(saved).toBe(false);
    expect(updateDocumentCase).not.toHaveBeenCalled();
  });

  it('sends none of the new schema fields on a status-only change', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: {
        status: 'active',
        tags: ['one'],
        title: 'a title',
        severity: 'low',
      },
      username: 'admin',
    });
    (updateDocumentCase as jest.Mock).mockResolvedValue({
      case: { status: 'completed', tags: ['one'] },
      username: 'admin',
    });

    const { result } = renderHook(() => useCaseManagementForm(documentRef));
    await waitFor(() => expect(result.current.isLoadingCase).toBe(false));

    act(() => {
      result.current.setStatus('completed');
    });
    await act(async () => {
      await result.current.handleSave();
    });

    expect(updateDocumentCase).toHaveBeenCalledWith(
      'wazuh-findings-v5-security',
      'doc-1',
      { status: 'completed', tags: ['one'] },
    );
  });

  it('reports save errors through the error orchestrator', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: fullCase,
      username: 'admin',
    });
    (updateDocumentCase as jest.Mock).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useCaseManagementForm(documentRef));
    await waitFor(() => expect(result.current.isLoadingCase).toBe(false));

    act(() => {
      result.current.setTitle('changed');
    });
    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockHandleError).toHaveBeenCalled();
    expect(result.current.isSaving).toBe(false);
  });

  it('cleans the case and notifies the host', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: fullCase,
      username: 'admin',
    });
    (cleanDocumentCase as jest.Mock).mockResolvedValue(null);
    const onSaveSuccess = jest.fn();

    const { result } = renderHook(() =>
      useCaseManagementForm(documentRef, onSaveSuccess),
    );
    await waitFor(() => expect(result.current.isLoadingCase).toBe(false));

    await act(async () => {
      await result.current.handleClean();
    });

    expect(cleanDocumentCase).toHaveBeenCalledWith(
      'wazuh-findings-v5-security',
      'doc-1',
    );
    expect(onSaveSuccess).toHaveBeenCalledWith(null);
    expect(result.current.isNewCase).toBe(true);
  });
});
