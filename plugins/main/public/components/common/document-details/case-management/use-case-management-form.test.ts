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
      editedComments: {},
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

  it('typing only a new comment marks the form dirty', () => {
    const state = caseFormReducer(loadedState(fullCase), {
      type: 'SET_NEW_COMMENT',
      payload: 'a new note',
    });

    expect(isFormDirty(state)).toBe(true);
  });

  it('a whitespace-only new comment does not mark the form dirty', () => {
    const state = caseFormReducer(loadedState(fullCase), {
      type: 'SET_NEW_COMMENT',
      payload: '   ',
    });

    expect(isFormDirty(state)).toBe(false);
  });

  it('SET_COMMENT_EDIT registers a pending edit and marks dirty', () => {
    const state = caseFormReducer(loadedState(fullCase), {
      type: 'SET_COMMENT_EDIT',
      payload: { createdAt: EARLIER, comment: 'edited text' },
    });

    expect(state.editedComments).toEqual({ [EARLIER]: 'edited text' });
    expect(isFormDirty(state)).toBe(true);
  });

  it('re-applying the original text drops the pending edit', () => {
    let state = caseFormReducer(loadedState(fullCase), {
      type: 'SET_COMMENT_EDIT',
      payload: { createdAt: EARLIER, comment: 'edited text' },
    });
    state = caseFormReducer(state, {
      type: 'SET_COMMENT_EDIT',
      payload: { createdAt: EARLIER, comment: 'first' },
    });

    expect(state.editedComments).toEqual({});
    expect(isFormDirty(state)).toBe(false);
  });

  it('ignores empty comment edits and edits of unknown comments', () => {
    const loaded = loadedState(fullCase);

    expect(
      caseFormReducer(loaded, {
        type: 'SET_COMMENT_EDIT',
        payload: { createdAt: EARLIER, comment: '   ' },
      }).editedComments,
    ).toEqual({});
    expect(
      caseFormReducer(loaded, {
        type: 'SET_COMMENT_EDIT',
        payload: { createdAt: 'does-not-exist', comment: 'x' },
      }).editedComments,
    ).toEqual({});
  });

  it('DISCARD_COMMENT_EDIT removes the pending edit', () => {
    let state = caseFormReducer(loadedState(fullCase), {
      type: 'SET_COMMENT_EDIT',
      payload: { createdAt: EARLIER, comment: 'edited text' },
    });
    state = caseFormReducer(state, {
      type: 'DISCARD_COMMENT_EDIT',
      payload: { createdAt: EARLIER },
    });

    expect(state.editedComments).toEqual({});
  });

  it('RESET restores scalars and clears comment drafts', () => {
    let state = loadedState(fullCase);
    state = caseFormReducer(state, { type: 'SET_TITLE', payload: 'changed' });
    state = caseFormReducer(state, {
      type: 'SET_NEW_COMMENT',
      payload: 'draft',
    });
    state = caseFormReducer(state, {
      type: 'SET_COMMENT_EDIT',
      payload: { createdAt: EARLIER, comment: 'edited' },
    });

    state = caseFormReducer(state, { type: 'RESET' });

    expect(state.title).toBe('a title');
    expect(state.newComment).toBe('');
    expect(state.editedComments).toEqual({});
    expect(isFormDirty(state)).toBe(false);
  });

  it('SAVE_SUCCESS re-baselines and replaces comments', () => {
    let state = loadedState(fullCase);
    state = caseFormReducer(state, {
      type: 'SET_NEW_COMMENT',
      payload: 'to append',
    });

    const savedCase: CaseData = {
      ...fullCase,
      updated_at: LATER,
      comments: [
        ...(fullCase.comments ?? []),
        {
          author: 'admin',
          comment: 'to append',
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
    expect(state.newComment).toBe('');
    expect(state.existingUpdatedAt).toBe(LATER);
    expect(isFormDirty(state)).toBe(false);
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
      result.current.setNewComment('  a note  ');
      result.current.applyCommentEdit(EARLIER, 'first edited');
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
        newComment: 'a note',
        editedComments: [{ created_at: EARLIER, comment: 'first edited' }],
      },
    );
    expect(onSaveSuccess).toHaveBeenCalledWith(savedCase);
    expect(result.current.isDirty).toBe(false);
    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Case updated' }),
    );
  });

  it('omits newComment and editedComments when there are none', async () => {
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
    });
    await act(async () => {
      await result.current.handleSave();
    });

    const payload = (updateDocumentCase as jest.Mock).mock.calls[0][2];
    expect(payload).not.toHaveProperty('newComment');
    expect(payload).not.toHaveProperty('editedComments');
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
