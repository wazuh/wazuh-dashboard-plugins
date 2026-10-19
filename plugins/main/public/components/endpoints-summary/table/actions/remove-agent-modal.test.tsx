/* eslint-disable camelcase -- the manager API responses are snake_case */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RemoveAgentModal } from './remove-agent-modal';
import { removeAgentService } from '../../services/remove-agent';
import store from '../../../../redux/store';
import { updateCurrentAgentData } from '../../../../redux/actions/appStateActions';

jest.mock('../../services/remove-agent', () => ({
  removeAgentService: jest.fn(),
}));

jest.mock('../../../../react-services', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

jest.mock('../../../../react-services/navigation-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getPathname: () => '/agents-preview',
      getParams: () => new URLSearchParams(),
      renewURL: jest.fn(),
    }),
  },
}));

jest.mock('../../../../kibana-services', () => ({
  ...jest.requireActual('../../../../kibana-services'),
  getToasts: () => ({ add: jest.fn() }),
}));

jest.mock('../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: () => {},
  }),
}));

const mockRemoveAgentService = removeAgentService as jest.Mock;

const getPinnedAgent = () => store.getState().appStateReducers.currentAgentData;

const removeAgent = async (agent: { id: string; name: string }) => {
  const reloadAgents = jest.fn();
  const { getByRole } = render(
    <RemoveAgentModal
      agent={agent}
      onClose={() => {}}
      reloadAgents={reloadAgents}
    />,
  );

  fireEvent.click(getByRole('button', { name: 'Remove' }));

  await waitFor(() => expect(reloadAgents).toHaveBeenCalled());
};

describe('RemoveAgentModal component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store.dispatch(updateCurrentAgentData({ id: '001', name: 'agent1' }));
  });

  test('should unpin the pinned agent when it is removed', async () => {
    mockRemoveAgentService.mockResolvedValue({
      data: { data: { affected_items: ['001'] } },
    });

    await removeAgent({ id: '001', name: 'agent1' });

    expect(mockRemoveAgentService).toHaveBeenCalledWith('001');
    expect(getPinnedAgent()).toEqual({});
  });

  test('should keep the pinned agent when another agent is removed', async () => {
    mockRemoveAgentService.mockResolvedValue({
      data: { data: { affected_items: ['002'] } },
    });

    await removeAgent({ id: '002', name: 'agent2' });

    expect(getPinnedAgent()).toEqual({ id: '001', name: 'agent1' });
  });

  test('should keep the pinned agent when the removal fails', async () => {
    mockRemoveAgentService.mockResolvedValue({
      data: { data: { affected_items: [] } },
    });

    await removeAgent({ id: '001', name: 'agent1' });

    expect(getPinnedAgent()).toEqual({ id: '001', name: 'agent1' });
  });
});
