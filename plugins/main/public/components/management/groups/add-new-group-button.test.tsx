import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { AddNewGroupButton } from './add-new-group-button';

const mockSaveGroup = jest.fn();
const mockAddToast = jest.fn();
const mockHandleError = jest.fn();

jest.mock(
  '../../../controllers/management/components/management/groups/utils/groups-handler',
  () => ({
    __esModule: true,
    default: {
      saveGroup: (...args: unknown[]) => mockSaveGroup(...args),
    },
  }),
);

jest.mock('../../../kibana-services', () => ({
  getToasts: () => ({ add: mockAddToast }),
}));

jest.mock('../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({ handleError: mockHandleError }),
}));

/* RBAC runs through react-redux selectors; answer them as granted instead of
standing up a store. */
jest.mock('../../common/hooks/useUserPermissions', () => ({
  useUserPermissionsRequirements: () => [false, {}],
}));

jest.mock('../../common/hooks/use-user-is-admin', () => ({
  useUserPermissionsIsAdminRequirements: () => [null, {}],
}));

const NAME_LABEL = 'Introduce the group name';

const openPopover = () =>
  fireEvent.click(screen.getByText('Add new group').closest('button')!);

const nameInput = () => screen.getByLabelText(NAME_LABEL);

const saveButton = () =>
  screen.getByText('Save new group').closest('button') as HTMLButtonElement;

describe('AddNewGroupButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveGroup.mockResolvedValue({});
  });

  it('only shows the form once the button is clicked', () => {
    render(<AddNewGroupButton />);
    expect(screen.queryByLabelText(NAME_LABEL)).not.toBeInTheDocument();
    openPopover();
    expect(nameInput()).toBeInTheDocument();
  });

  it('cannot be saved until the name holds something', () => {
    render(<AddNewGroupButton />);
    openPopover();
    expect(saveButton()).toBeDisabled();
    fireEvent.change(nameInput(), { target: { value: 'team-a' } });
    expect(saveButton()).toBeEnabled();
  });

  it('drops the spaces typed into the name', () => {
    render(<AddNewGroupButton />);
    openPopover();
    fireEvent.change(nameInput(), { target: { value: 'team a b' } });
    expect(nameInput()).toHaveValue('teamab');
  });

  it('creates the group, reports it and closes the form', async () => {
    const onGroupCreated = jest.fn();
    render(<AddNewGroupButton onGroupCreated={onGroupCreated} />);
    openPopover();
    fireEvent.change(nameInput(), { target: { value: 'team-a' } });
    fireEvent.click(saveButton());

    await waitFor(() => expect(mockSaveGroup).toHaveBeenCalledWith('team-a'));
    await waitFor(() => expect(onGroupCreated).toHaveBeenCalledWith('team-a'));
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({ color: 'success' }),
    );
    await waitFor(() =>
      expect(screen.queryByLabelText(NAME_LABEL)).not.toBeInTheDocument(),
    );
  });

  it('keeps the form open and reports the error when the server rejects it', async () => {
    mockSaveGroup.mockRejectedValue(new Error('Group already exists'));
    const onGroupCreated = jest.fn();
    render(<AddNewGroupButton onGroupCreated={onGroupCreated} />);
    openPopover();
    fireEvent.change(nameInput(), { target: { value: 'default' } });
    fireEvent.click(saveButton());

    await waitFor(() => expect(mockHandleError).toHaveBeenCalled());
    expect(onGroupCreated).not.toHaveBeenCalled();
    expect(nameInput()).toHaveValue('default');
  });
});
