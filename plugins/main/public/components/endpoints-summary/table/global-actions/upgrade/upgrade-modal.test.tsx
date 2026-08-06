import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UpgradeAgentsModal } from './upgrade-modal';
import { Agent } from '../../../types';
import { upgradeStatusState } from '../../../services/upgrade-status-state';
import { upgradeAgentsService } from '../../../services';

jest.mock('../../../services', () => ({
  getAgentsService: jest.fn(),
  upgradeAgentsService: jest.fn(),
}));

jest.mock('../../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: () => {},
  }),
}));

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
