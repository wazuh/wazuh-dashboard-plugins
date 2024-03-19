import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useGetGroups } from '../../../hooks';
import { EditAgentsGroupsModal } from './edit-groups-modal';
import { Agent } from '../../../types';

jest.mock('../../../services', () => ({
  addAgentsToGroupService: jest.fn(),
  getAgentsService: jest.fn(),
  removeAgentsFromGroupService: jest.fn(),
}));

jest.mock('../../../hooks', () => ({
  useGetGroups: jest.fn(),
}));

jest.mock('../../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: () => {},
  }),
}));

describe('EditAgentsGroupsModal component', () => {
  test('should return the component with save disabled', async () => {
    (useGetGroups as jest.Mock).mockReturnValue({
      isLoading: true,
    });

    const { container, getByText, getByRole } = render(
      <EditAgentsGroupsModal
        selectedAgents={[
          {
            id: '001',
            name: 'agent1',
            group: ['default'],
          } as Agent,
        ]}
        allAgentsSelected={false}
        filters={{}}
        onClose={() => {}}
        reloadAgents={() => {}}
        addOrRemove='add'
      />,
    );

    expect(container).toMatchSnapshot();

    const agentCount = getByText('1');
    expect(agentCount).toBeInTheDocument();

    const saveButton = getByRole('button', { name: 'Save' });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    const cancelButton = getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toBeInTheDocument();
  });

  test('should select a new group', async () => {
    (useGetGroups as jest.Mock).mockReturnValue({
      isLoading: false,
      groups: ['default', 'group1', 'group2'],
    });

    const { getByText, getAllByText, getByRole } = render(
      <EditAgentsGroupsModal
        selectedAgents={[
          {
            id: '001',
            name: 'agent1',
            group: ['default'],
          } as Agent,
        ]}
        allAgentsSelected={false}
        filters={{}}
        onClose={() => {}}
        reloadAgents={() => {}}
        addOrRemove='add'
      />,
    );

    const saveButton = getByRole('button', { name: 'Save' });
    expect(saveButton).toBeInTheDocument();

    const select = getAllByText('Select groups to add')[0];
    expect(select).toBeInTheDocument();

    act(() => {
      fireEvent.click(select);
    });

    await waitFor(() => expect(getByText('group1')).toBeInTheDocument());

    act(() => {
      fireEvent.click(getByText('group1'));
      fireEvent.click(saveButton);
    });
  });
});
