/* eslint-disable camelcase -- the manager API responses are snake_case */
import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RemoveAgentsModal } from './remove-modal';
import { Agent } from '../../../types';
import { removeAgentsService } from '../../../services/remove-agents';
import store from '../../../../../redux/store';
import { updateCurrentAgentData } from '../../../../../redux/actions/appStateActions';

jest.mock('../../../services', () => ({
  getAgentsService: jest.fn(),
  removeAgentsService: jest.fn(),
}));

jest.mock('../../../services/remove-agents', () => ({
  removeAgentsService: jest.fn(),
}));

jest.mock('../../../../../react-services', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

jest.mock('../../../../../react-services/navigation-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getPathname: () => '/agents-preview',
      getParams: () => new URLSearchParams(),
      renewURL: jest.fn(),
    }),
  },
}));

jest.mock('../../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: () => {},
  }),
}));

describe('RemoveAgentsModal component', () => {
  test('should return the component', async () => {
    const { container, getByText, getByRole } = render(
      <RemoveAgentsModal
        selectedAgents={[
          {
            id: '001',
            name: 'agent1',
          } as Agent,
        ]}
        allAgentsSelected={false}
        filters={{}}
        onClose={() => {}}
        reloadAgents={() => {}}
      />,
    );

    expect(container).toMatchSnapshot();

    const agentCount = getByText('1');
    expect(agentCount).toBeInTheDocument();

    const saveButton = getByRole('button', { name: 'Remove' });
    expect(saveButton).toBeInTheDocument();

    const cancelButton = getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toBeInTheDocument();
  });

  test('should click remove button', async () => {
    const { container, getByText, getByRole } = render(
      <RemoveAgentsModal
        selectedAgents={[
          {
            id: '001',
            name: 'agent1',
          } as Agent,
        ]}
        allAgentsSelected={false}
        filters={{}}
        onClose={() => {}}
        reloadAgents={() => {}}
      />,
    );

    const saveButton = getByRole('button', { name: 'Remove' });
    expect(saveButton).toBeInTheDocument();

    act(() => {
      fireEvent.click(saveButton);
    });

    await waitFor(() =>
      expect(getByText('Retrieve agents data')).toBeInTheDocument(),
    );
    expect(getByText('Apply agents removal')).toBeInTheDocument();
  });

  describe('pinned agent', () => {
    const mockRemoveAgentsService = removeAgentsService as jest.Mock;

    const getPinnedAgent = () =>
      store.getState().appStateReducers.currentAgentData;

    const removeAgents = async (selectedAgents: Agent[]) => {
      const reloadAgents = jest.fn();
      const { getByRole } = render(
        <RemoveAgentsModal
          selectedAgents={selectedAgents}
          allAgentsSelected={false}
          filters={{}}
          onClose={() => {}}
          reloadAgents={reloadAgents}
        />,
      );

      fireEvent.click(getByRole('button', { name: 'Remove' }));

      await waitFor(() => expect(reloadAgents).toHaveBeenCalled());
    };

    beforeEach(() => {
      jest.clearAllMocks();
      store.dispatch(updateCurrentAgentData({ id: '001', name: 'agent1' }));
    });

    test('should unpin the pinned agent when it is removed', async () => {
      mockRemoveAgentsService.mockResolvedValue({
        data: {
          data: {
            affected_items: ['001', '002'],
            failed_items: [],
            total_failed_items: 0,
          },
        },
      });

      await removeAgents([
        { id: '001', name: 'agent1' } as Agent,
        { id: '002', name: 'agent2' } as Agent,
      ]);

      expect(mockRemoveAgentsService).toHaveBeenCalledWith({
        agentIds: ['001', '002'],
      });
      expect(getPinnedAgent()).toEqual({});
    });

    test('should keep the pinned agent when it is not removed', async () => {
      mockRemoveAgentsService.mockResolvedValue({
        data: {
          data: {
            affected_items: ['002'],
            failed_items: [{ id: ['001'], error: { message: 'Error' } }],
            total_failed_items: 1,
          },
        },
      });

      await removeAgents([
        { id: '001', name: 'agent1' } as Agent,
        { id: '002', name: 'agent2' } as Agent,
      ]);

      expect(getPinnedAgent()).toEqual({ id: '001', name: 'agent1' });
    });
  });
});
