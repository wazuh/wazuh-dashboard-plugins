import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UpgradeAgentModal } from './upgrade-agent-modal';
import { getWazuhAPIVersion, upgradeAgentService } from '../../services';
import { UPGRADE_ERROR_TOAST_LIFETIME_MS } from '../upgrade-dialog-info';

const mockHandleError = jest.fn();

jest.mock('../../services', () => ({
  upgradeAgentService: jest.fn(),
  getWazuhAPIVersion: jest.fn(),
}));

jest.mock('../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: (...args) => mockHandleError(...args),
  }),
}));

const buildAgent = (version: string) => ({
  id: '001',
  name: 'agent1',
  version,
  group: ['default'],
  os: { name: 'Ubuntu', uname: 'Linux', platform: 'ubuntu' },
});

beforeEach(() => {
  mockHandleError.mockClear();
  (getWazuhAPIVersion as jest.Mock).mockResolvedValue('5.0.0');
});

describe('UpgradeAgentModal component', () => {
  test('should return the component', async () => {
    const { container, getByText, getByRole } = render(
      <UpgradeAgentModal
        agent={{
          id: '001',
          name: 'agent1',
          version: 'v4.8.0',
          group: ['default'],
          os: { name: 'Ubuntu', uname: 'Linux', platform: 'ubuntu' },
        }}
        onClose={() => {}}
        reloadAgents={() => {}}
      />,
    );

    expect(container).toMatchSnapshot();

    const agentId = getByText('001');
    expect(agentId).toBeInTheDocument();

    const agentName = getByText('agent1');
    expect(agentName).toBeInTheDocument();

    const agentVersion = getByText('v4.8.0');
    expect(agentVersion).toBeInTheDocument();

    const os = getByText('Ubuntu');
    expect(os).toBeInTheDocument();

    const saveButton = getByRole('button', { name: 'Upgrade' });
    expect(saveButton).toBeInTheDocument();

    const cancelButton = getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toBeInTheDocument();
  });

  test('should send to upgrade', async () => {
    const { getByRole } = render(
      <UpgradeAgentModal
        agent={{
          id: '001',
          name: 'agent1',
          version: 'v4.8.0',
          group: ['default'],
          os: { name: 'Ubuntu', uname: 'Linux', platform: 'ubuntu' },
        }}
        onClose={() => {}}
        reloadAgents={() => {}}
      />,
    );

    const saveButton = getByRole('button', { name: 'Upgrade' });
    expect(saveButton).toBeInTheDocument();

    act(() => {
      fireEvent.click(saveButton);
    });
  });

  test('should show the target version', async () => {
    const { findByText } = render(
      <UpgradeAgentModal
        agent={buildAgent('v5.0.0')}
        onClose={() => {}}
        reloadAgents={() => {}}
      />,
    );

    expect(
      await findByText('The agents will be upgraded to version 5.0.0.'),
    ).toBeInTheDocument();
  });

  test('should show the 4.x note only for a 4.x agent', async () => {
    const legacy = render(
      <UpgradeAgentModal
        agent={buildAgent('v4.14.0')}
        onClose={() => {}}
        reloadAgents={() => {}}
      />,
    );
    expect(
      await legacy.findByText(/can take up to 15 minutes to start the upgrade/),
    ).toBeInTheDocument();
    legacy.unmount();

    const current = render(
      <UpgradeAgentModal
        agent={buildAgent('v5.0.0')}
        onClose={() => {}}
        reloadAgents={() => {}}
      />,
    );
    await current.findByText('The agents will be upgraded to version 5.0.0.');
    expect(
      current.queryByText(/can take up to 15 minutes to start the upgrade/),
    ).not.toBeInTheDocument();
  });

  test('should keep the error toast until dismissed', async () => {
    (upgradeAgentService as jest.Mock).mockRejectedValue({
      response: {
        data: {
          message:
            'Could not upgrade agent: No upgrade task was created (1822) - The repository is not reachable',
        },
      },
    });
    const { getByRole } = render(
      <UpgradeAgentModal
        agent={buildAgent('v5.0.0')}
        onClose={() => {}}
        reloadAgents={() => {}}
      />,
    );

    act(() => {
      fireEvent.click(getByRole('button', { name: 'Upgrade' }));
    });

    await waitFor(() => expect(mockHandleError).toHaveBeenCalledTimes(1));
    expect(mockHandleError).toHaveBeenCalledWith(
      expect.objectContaining({
        toastLifeTimeMs: UPGRADE_ERROR_TOAST_LIFETIME_MS,
        error: expect.objectContaining({
          message: expect.stringContaining(
            'No upgrade task was created (1822) - The repository is not reachable',
          ),
        }),
      }),
    );
  });
});
