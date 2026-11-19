import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UpgradeAgentsModal } from './upgrade-modal';
import { Agent } from '../../../types';
import { upgradeStatusState } from '../../../services/upgrade-status-state';
import { getWazuhAPIVersion, upgradeAgentsService } from '../../../services';
import { UPGRADE_ERROR_TOAST_LIFETIME_MS } from '../../upgrade-dialog-info';

const mockHandleError = jest.fn();

jest.mock('../../../services', () => ({
  getAgentsService: jest.fn(),
  getWazuhAPIVersion: jest.fn(),
  upgradeAgentsService: jest.fn(),
}));

jest.mock('../../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: (...args) => mockHandleError(...args),
  }),
}));

beforeEach(() => {
  mockHandleError.mockClear();
  (getWazuhAPIVersion as jest.Mock).mockResolvedValue('5.0.0');
});

describe('UpgradeAgentsModal component', () => {
  test('should return the component', async () => {
    const { container, getByText, getByRole } = render(
      <UpgradeAgentsModal
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

    const saveButton = getByRole('button', { name: 'Upgrade' });
    expect(saveButton).toBeInTheDocument();

    const cancelButton = getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toBeInTheDocument();
  });

  test('should click upgrade button', async () => {
    const { container, getByText, getByRole } = render(
      <UpgradeAgentsModal
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

    const saveButton = getByRole('button', { name: 'Upgrade' });
    expect(saveButton).toBeInTheDocument();

    act(() => {
      fireEvent.click(saveButton);
    });

    await waitFor(() =>
      expect(getByText('Retrieve agents data')).toBeInTheDocument(),
    );
    expect(getByText('Upgrade status')).toBeInTheDocument();
  });

  describe('target version and 4.x note', () => {
    const renderModal = (selectedAgents: Agent[], allAgentsSelected = false) =>
      render(
        <UpgradeAgentsModal
          selectedAgents={selectedAgents}
          allAgentsSelected={allAgentsSelected}
          filters={{}}
          onClose={() => {}}
          reloadAgents={() => {}}
        />,
      );

    test('shows the target version', async () => {
      const { findByText } = renderModal([
        { id: '001', name: 'agent1', version: 'v5.0.0' } as Agent,
      ]);

      expect(
        await findByText('The agents will be upgraded to version 5.0.0.'),
      ).toBeInTheDocument();
    });

    test('shows the 4.x note when a selected agent is 4.x', async () => {
      const { findByText } = renderModal([
        { id: '001', name: 'agent1', version: 'v5.0.0' } as Agent,
        { id: '002', name: 'agent2', version: 'v4.14.0' } as Agent,
      ]);

      expect(
        await findByText(/start the upgrade within the next 15 minutes/),
      ).toBeInTheDocument();
    });

    test('shows the 4.x note when all agents are selected', async () => {
      const { findByText } = renderModal([], true);

      expect(
        await findByText(/start the upgrade within the next 15 minutes/),
      ).toBeInTheDocument();
    });

    test('hides the 4.x note when no selected agent is 4.x', async () => {
      const { findByText, queryByText } = renderModal([
        { id: '001', name: 'agent1', version: 'v5.0.0' } as Agent,
      ]);

      await findByText('The agents will be upgraded to version 5.0.0.');
      expect(
        queryByText(/start the upgrade within the next 15 minutes/),
      ).not.toBeInTheDocument();
    });

    test('keeps the error toast until dismissed and names the repository', async () => {
      (upgradeAgentsService as jest.Mock).mockRejectedValue({
        response: {
          data: {
            message: 'The repository is not reachable',
            detail: 'Cannot reach https://packages.example.com/5.x',
          },
        },
      });
      const { getByRole } = renderModal([
        { id: '001', name: 'agent1', version: '5.0.0' } as Agent,
      ]);

      act(() => {
        fireEvent.click(getByRole('button', { name: 'Upgrade' }));
      });

      await waitFor(() => expect(mockHandleError).toHaveBeenCalledTimes(1));
      expect(mockHandleError).toHaveBeenCalledWith(
        expect.objectContaining({
          toastLifeTimeMs: UPGRADE_ERROR_TOAST_LIFETIME_MS,
          error: expect.objectContaining({
            message:
              'The repository is not reachable Repository: https://packages.example.com/5.x',
          }),
        }),
      );
    });
  });

  describe('with the manager response documented in issue #8856 (plain agent id strings)', () => {
    afterEach(() => {
      upgradeStatusState.reset();
    });

    test('tracks the upgrade using the returned agent id', async () => {
      (upgradeAgentsService as jest.Mock).mockResolvedValue({
        data: {
          data: {
            affected_items: ['001'],
            failed_items: [],
            total_failed_items: 0,
          },
          message: 'All upgrade tasks were created',
        },
      });

      const { getByRole } = render(
        <UpgradeAgentsModal
          selectedAgents={[
            { id: '001', name: 'agent1', version: '4.5.0' } as Agent,
          ]}
          allAgentsSelected={false}
          filters={{}}
          onClose={() => {}}
          reloadAgents={() => {}}
        />,
      );

      act(() => {
        fireEvent.click(getByRole('button', { name: 'Upgrade' }));
      });

      await waitFor(() => expect(upgradeStatusState.hasPending()).toBe(true));
      expect(upgradeStatusState.getPendingAgents()).toEqual([
        expect.objectContaining({ id: '001', version: '4.5.0' }),
      ]);
    });

    test('renders the agent id in the result table', async () => {
      (upgradeAgentsService as jest.Mock).mockResolvedValue({
        data: {
          data: {
            affected_items: ['001'],
            failed_items: [],
            total_failed_items: 0,
          },
          message: 'All upgrade tasks were created',
        },
      });

      const { getByRole, getByText, getAllByText } = render(
        <UpgradeAgentsModal
          selectedAgents={[
            { id: '001', name: 'agent1', version: '4.5.0' } as Agent,
          ]}
          allAgentsSelected={false}
          filters={{}}
          onClose={() => {}}
          reloadAgents={() => {}}
        />,
      );

      act(() => {
        fireEvent.click(getByRole('button', { name: 'Upgrade' }));
      });

      await waitFor(() =>
        expect(getByText('Agents queued for upgrade (1)')).toBeInTheDocument(),
      );
      fireEvent.click(getByText('Agents queued for upgrade (1)'));

      expect(getAllByText('001').length).toBeGreaterThan(0);
    });
  });
});
