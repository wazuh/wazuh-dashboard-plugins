import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentsTableGlobalActions } from './global-actions';
import { Agent } from '../../types';

jest.mock('../../../common/permissions/element', () => ({
  WzElementPermissions: ({ children }) => <div>{children}</div>,
}));

describe('AgentsTableGlobalActions component', () => {
  test('should return the component', async () => {
    const { container, getByText } = render(
      <AgentsTableGlobalActions
        selectedAgents={[{ id: '001', name: 'agent1' } as Agent]}
        allAgentsSelected={false}
        allAgentsCount={3}
        filters={{}}
        allowEditGroups={true}
        reloadAgents={() => {}}
        setIsUpgradeTasksModalVisible={() => {}}
        setIsUpgradePanelClosed={() => {}}
        allowUpgrade={true}
        allowGetTasks={true}
      />,
    );

    expect(container).toMatchSnapshot();

    const option = getByText('More');
    expect(option).toBeInTheDocument();
  });

  test('should show options on click', async () => {
    const { getByText } = render(
      <AgentsTableGlobalActions
        selectedAgents={[{ id: '001', name: 'agent1' } as Agent]}
        allAgentsSelected={false}
        allAgentsCount={3}
        filters={{}}
        allowEditGroups={true}
        reloadAgents={() => {}}
        setIsUpgradeTasksModalVisible={() => {}}
        setIsUpgradePanelClosed={() => {}}
        allowUpgrade={true}
        allowGetTasks={true}
      />,
    );

    const option = getByText('More');
    expect(option).toBeInTheDocument();

    act(() => {
      fireEvent.click(option);
    });

    await waitFor(() =>
      expect(getByText('Add groups to agents (1)')).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(getByText('Remove groups from agents (1)')).toBeInTheDocument(),
    );
  });
});
