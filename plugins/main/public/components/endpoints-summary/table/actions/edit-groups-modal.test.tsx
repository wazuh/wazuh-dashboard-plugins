import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditAgentGroupsModal } from './edit-groups-modal';
import { useGetGroups } from '../../hooks';

jest.mock('../../services', () => ({
  addAgentToGroupService: jest.fn(),
  removeAgentFromGroupsService: jest.fn(),
}));

jest.mock('../../hooks', () => ({
  useGetGroups: jest.fn(),
}));

jest.mock('../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: () => {},
  }),
}));

describe('EditAgentGroupsModal component', () => {
  test('should return the component with save disabled', async () => {
    (useGetGroups as jest.Mock).mockReturnValue({
      isLoading: true,
    });

    const { container, getByText, getByRole } = render(
      <EditAgentGroupsModal
        agent={{
          id: '001',
          name: 'agent1',
          group: ['default'],
        }}
        onClose={() => {}}
        reloadAgents={() => {}}
      />,
    );

    expect(container).toMatchSnapshot();

    const agentName = getByText('agent1');
    expect(agentName).toBeInTheDocument();

    const saveButton = getByRole('button', { name: 'Save' });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    const cancelButton = getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toBeInTheDocument();
  });

  test('should return the component', async () => {
    (useGetGroups as jest.Mock).mockReturnValue({
      isLoading: false,
      groups: ['default', 'group1', 'group2'],
    });

    const { container, getByText, getByRole } = render(
      <EditAgentGroupsModal
        agent={{
          id: '001',
          name: 'agent1',
          group: ['default'],
        }}
        onClose={() => {}}
        reloadAgents={() => {}}
      />,
    );

    expect(container).toMatchSnapshot();

    const agentName = getByText('agent1');
    expect(agentName).toBeInTheDocument();

    const saveButton = getByRole('button', { name: 'Save' });
    expect(saveButton).toBeInTheDocument();

    const cancelButton = getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toBeInTheDocument();
  });

  test('should select a new group', async () => {
    (useGetGroups as jest.Mock).mockReturnValue({
      isLoading: false,
      groups: ['default', 'group1', 'group2'],
    });

    const { getByText, getByRole } = render(
      <EditAgentGroupsModal
        agent={{
          id: '001',
          name: 'agent1',
          group: ['default'],
        }}
        onClose={() => {}}
        reloadAgents={() => {}}
      />,
    );

    const saveButton = getByRole('button', { name: 'Save' });
    expect(saveButton).toBeInTheDocument();

    const selectedGroup = getByText('default');
    expect(selectedGroup).toBeInTheDocument();

    act(() => {
      fireEvent.click(selectedGroup);
    });

    await waitFor(() => expect(getByText('group1')).toBeInTheDocument());

    act(() => {
      fireEvent.click(getByText('group1'));
      fireEvent.click(saveButton);
    });
  });
});
