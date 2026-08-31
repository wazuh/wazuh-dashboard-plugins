import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CaseManagementTab } from './case-management-tab';
import {
  CaseData,
  getFindingsCase,
  updateDocumentCase,
} from './case-management-service';
import { UnsavedChangesGuardedFlyout } from '../../unsaved-changes-guard';

jest.mock('../../../../react-services/generic-request', () => ({
  GenericRequest: { request: jest.fn() },
}));

jest.mock('./case-management-service', () => ({
  ...jest.requireActual('./case-management-service'),
  getFindingsCase: jest.fn(),
  updateDocumentCase: jest.fn(),
  cleanDocumentCase: jest.fn(),
}));

jest.mock('../../../../react-services', () => ({
  formatUIDate: (date: string) => date,
}));

jest.mock('../../../../kibana-services', () => ({
  getToasts: () => ({ add: jest.fn() }),
}));

jest.mock('../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({ handleError: jest.fn() }),
}));

const documentRef = { _index: 'wazuh-findings-v5-security', _id: 'doc-1' };

const fullCase: CaseData = {
  title: 'a title',
  description: 'a description',
  status: 'active',
  severity: 'high',
  priority: 'urgent',
  tlp: 'TLP:AMBER',
  tags: ['one'],
  comments: [],
  created_at: '2026-06-30T08:00:00.000Z',
  updated_at: '2026-06-30T08:00:00.000Z',
  user: { name: 'admin' },
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CaseManagementTab required fields', () => {
  it('create: enables the save button only when status, title and severity are set', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: null,
      username: 'admin',
    });

    render(<CaseManagementTab document={documentRef} />);

    const createButton = await screen.findByRole('button', {
      name: 'Create case',
    });
    expect(screen.getByLabelText('Case title')).toHaveValue('Case_doc-1');
    expect(createButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Case status'), {
      target: { value: 'active' },
    });
    expect(createButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Case severity'), {
      target: { value: 'high' },
    });
    expect(createButton).toBeEnabled();

    fireEvent.change(screen.getByLabelText('Case title'), {
      target: { value: '   ' },
    });
    expect(createButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Case title'), {
      target: { value: 'my case' },
    });
    expect(createButton).toBeEnabled();
  });

  it('edit: keeps the save button disabled until dirty and while a required field is blank', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: fullCase,
      username: 'admin',
    });

    render(<CaseManagementTab document={documentRef} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));

    const updateButton = screen.getByRole('button', { name: 'Update case' });
    expect(updateButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Case severity'), {
      target: { value: 'critical' },
    });
    expect(updateButton).toBeEnabled();

    fireEvent.change(screen.getByLabelText('Case title'), {
      target: { value: '' },
    });
    expect(updateButton).toBeDisabled();
  });
});

describe('CaseManagementTab unsaved-changes guard', () => {
  const closeFlyout = () =>
    fireEvent.click(
      document.querySelector(
        '[data-test-subj="euiFlyoutCloseButton"]',
      ) as Element,
    );

  it('guards the flyout close while the form has unsaved changes', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: null,
      username: 'admin',
    });
    const onClose = jest.fn();
    render(
      <UnsavedChangesGuardedFlyout onClose={onClose}>
        <CaseManagementTab document={documentRef} />
      </UnsavedChangesGuardedFlyout>,
    );
    await screen.findByRole('button', { name: 'Create case' });

    // The auto-suggested title alone must not guard the close.
    closeFlyout();
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText('Case description'), {
      target: { value: 'a draft' },
    });
    closeFlyout();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Unsubmitted changes')).toBeInTheDocument();

    fireEvent.click(screen.getByText("No, don't do it"));
    expect(screen.getByLabelText('Case description')).toHaveValue('a draft');

    closeFlyout();
    fireEvent.click(screen.getByText('Yes, do it'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('guards while an inline comment edit is open', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: {
        ...fullCase,
        comments: [
          {
            author: 'admin',
            comment: 'first comment',
            created_at: '2026-06-30T09:00:00.000Z',
            updated_at: '2026-06-30T09:00:00.000Z',
          },
        ],
      },
      username: 'admin',
    });
    const onClose = jest.fn();
    render(
      <UnsavedChangesGuardedFlyout onClose={onClose}>
        <CaseManagementTab document={documentRef} />
      </UnsavedChangesGuardedFlyout>,
    );

    // The pencil is reachable straight from read mode.
    fireEvent.click(await screen.findByLabelText('Edit comment'));

    closeFlyout();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Unsubmitted changes')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Yes, do it'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('guards the flyout close while a comment draft is typed', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: fullCase,
      username: 'admin',
    });
    const onClose = jest.fn();
    render(
      <UnsavedChangesGuardedFlyout onClose={onClose}>
        <CaseManagementTab document={documentRef} />
      </UnsavedChangesGuardedFlyout>,
    );
    await screen.findByLabelText('New case comment');

    closeFlyout();
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText('New case comment'), {
      target: { value: 'a draft' },
    });
    closeFlyout();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Unsubmitted changes')).toBeInTheDocument();
  });
});

describe('CaseManagementTab standalone comments', () => {
  it('adds a comment from read mode with its own submit button', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: fullCase,
      username: 'admin',
    });
    (updateDocumentCase as jest.Mock).mockResolvedValue({
      case: {
        ...fullCase,
        comments: [
          {
            author: 'admin',
            comment: 'a note',
            created_at: '2026-07-01T12:00:00.000Z',
            updated_at: '2026-07-01T12:00:00.000Z',
          },
        ],
      },
      username: 'admin',
    });

    render(<CaseManagementTab document={documentRef} />);

    const addButton = await screen.findByRole('button', {
      name: 'Add comment',
    });
    expect(screen.getByText('No comments yet.')).toBeInTheDocument();
    expect(addButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('New case comment'), {
      target: { value: '  a note  ' },
    });
    expect(addButton).toBeEnabled();

    fireEvent.click(addButton);

    await waitFor(() =>
      expect(updateDocumentCase).toHaveBeenCalledWith(
        'wazuh-findings-v5-security',
        'doc-1',
        { newComment: 'a note' },
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('New case comment')).toHaveValue(''),
    );
    expect(screen.getByText('a note')).toBeInTheDocument();
  });

  it('shows the creation date, and an "Edited" tooltip with the edit date, only for edited comments', async () => {
    const notEdited = {
      author: 'admin',
      comment: 'not edited',
      created_at: '2026-06-30T09:00:00.000Z',
      updated_at: '2026-06-30T09:00:00.000Z',
    };
    const edited = {
      author: 'admin',
      comment: 'edited comment',
      created_at: '2026-06-30T10:00:00.000Z',
      updated_at: '2026-07-01T12:00:00.000Z',
    };
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: { ...fullCase, comments: [notEdited, edited] },
      username: 'admin',
    });

    render(<CaseManagementTab document={documentRef} />);

    expect(await screen.findByText('not edited')).toBeInTheDocument();
    expect(screen.getByText(notEdited.created_at)).toBeInTheDocument();

    // Only the edited comment shows the "Edited" indicator, and it always
    // displays the creation date, not the edit date. The date text node is
    // followed by a sibling " - Edited" node, so match as a substring.
    expect(
      screen.getByText(edited.created_at, { exact: false }),
    ).toBeInTheDocument();
    expect(screen.queryByText(edited.updated_at)).not.toBeInTheDocument();

    const editedLabel = screen.getByText('Edited');
    expect(editedLabel.tagName.toLowerCase()).toBe('em');

    fireEvent.mouseOver(editedLabel);
    expect(await screen.findByText(edited.updated_at)).toBeInTheDocument();
  });

  it('shows the edit pencil only for own comments and persists the edit', async () => {
    const mine = {
      author: 'admin',
      comment: 'mine',
      created_at: '2026-06-30T09:00:00.000Z',
      updated_at: '2026-06-30T09:00:00.000Z',
    };
    const theirs = {
      author: 'someone-else',
      comment: 'theirs',
      created_at: '2026-06-30T10:00:00.000Z',
      updated_at: '2026-06-30T10:00:00.000Z',
    };
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: { ...fullCase, comments: [mine, theirs] },
      username: 'admin',
    });
    (updateDocumentCase as jest.Mock).mockResolvedValue({
      case: {
        ...fullCase,
        comments: [
          {
            ...mine,
            comment: 'mine edited',
            updated_at: '2026-07-01T12:00:00.000Z',
          },
          theirs,
        ],
      },
      username: 'admin',
    });

    render(<CaseManagementTab document={documentRef} />);

    // Only the own comment gets a pencil, straight from read mode.
    const pencils = await screen.findAllByLabelText('Edit comment');
    expect(pencils).toHaveLength(1);

    fireEvent.click(pencils[0]);
    fireEvent.change(screen.getByLabelText('Edit comment text'), {
      target: { value: 'mine edited' },
    });
    fireEvent.click(screen.getByLabelText('Save comment'));

    await waitFor(() =>
      expect(updateDocumentCase).toHaveBeenCalledWith(
        'wazuh-findings-v5-security',
        'doc-1',
        {
          editedComments: [
            { created_at: mine.created_at, comment: 'mine edited' },
          ],
        },
      ),
    );
    expect(await screen.findByText('mine edited')).toBeInTheDocument();
  });

  it('does not render the comments section for a new case', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: null,
      username: 'admin',
    });

    render(<CaseManagementTab document={documentRef} />);

    await screen.findByRole('button', { name: 'Create case' });
    expect(screen.queryByLabelText('New case comment')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Add comment' }),
    ).not.toBeInTheDocument();
  });
});
