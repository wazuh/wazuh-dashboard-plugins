import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getAgentManagement, getToasts } from '../../../../plugin-services';
import { getOptionsToUpgrade } from '../utils/selector-version-upgrade';
import { UpgradeAgentModal } from './upgrade-agent-modal';

// Mock the plugin services and utilities
jest.mock('../../../../plugin-services', () => ({
  getAgentManagement: jest.fn(),
  getToasts: jest.fn(),
}));

jest.mock('../utils/selector-version-upgrade', () => ({
  getOptionsToUpgrade: jest.fn(),
}));

describe('UpgradeAgentModal component', () => {
  const mockAgent = {
    agent: {
      id: '001',
      name: 'agent1',
      version: '4.3.0',
      host: {
        os: {
          name: 'ubuntu',
          platform: 'linux',
        },
      },
    },
  };
  const mockAgentUnsupportedPlatform = {
    agent: {
      id: '002',
      name: 'agent2',
      version: '4.3.0',
      host: {
        os: {
          name: 'unknown-linux',
          platform: 'linux',
        },
      },
    },
  };
  const mockOnClose = jest.fn();
  const mockReloadAgents = jest.fn();
  const mockUpgrade = jest.fn().mockResolvedValue({});
  const mockAddInfo = jest.fn();
  const mockAddDanger = jest.fn();
  const mockVersionOptions = [
    { value: '4.4.0', text: 'Wazuh v4.4.0' },
    { value: '4.5.0', text: 'Wazuh v4.5.0' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    (getAgentManagement as jest.Mock).mockReturnValue({
      upgrade: mockUpgrade,
    });

    (getToasts as jest.Mock).mockReturnValue({
      addInfo: mockAddInfo,
      addDanger: mockAddDanger,
    });

    (getOptionsToUpgrade as jest.Mock).mockResolvedValue(mockVersionOptions);
  });

  test('should render the component with agent information', async () => {
    const { getByText, getByRole } = render(
      <UpgradeAgentModal
        agent={mockAgent}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );

    // Wait for version options to load
    await waitFor(() => {
      expect(getOptionsToUpgrade).toHaveBeenCalled();
    });

    // Check agent information is displayed
    expect(getByText('001')).toBeInTheDocument();
    expect(getByText('agent1')).toBeInTheDocument();
    expect(getByText('4.3.0')).toBeInTheDocument();
    expect(getByText('ubuntu')).toBeInTheDocument();

    // Check modal title
    expect(getByText('Upgrade agent')).toBeInTheDocument();

    // Check buttons
    const cancelButton = getByRole('button', { name: 'Cancel' });

    expect(cancelButton).toBeInTheDocument();

    const upgradeButton = getByRole('button', { name: 'Upgrade' });

    expect(upgradeButton).toBeInTheDocument();
  });

  test('should show package selector for unsupported platforms', async () => {
    const { getByText } = render(
      <UpgradeAgentModal
        agent={mockAgentUnsupportedPlatform}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );

    // Wait for version options to load
    await waitFor(() => {
      expect(getOptionsToUpgrade).toHaveBeenCalled();
    });

    // Check package type selector is displayed
    expect(getByText('Package type')).toBeInTheDocument();
  });

  test('should not show package selector for supported platforms', async () => {
    const { queryByText } = render(
      <UpgradeAgentModal
        agent={mockAgent}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );

    // Wait for version options to load
    await waitFor(() => {
      expect(getOptionsToUpgrade).toHaveBeenCalled();
    });

    // Check package type selector is not displayed
    expect(queryByText('Package type')).not.toBeInTheDocument();
  });

  test('should call upgrade API when upgrade button is clicked', async () => {
    const { getByRole, getAllByRole } = render(
      <UpgradeAgentModal
        agent={mockAgent}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );

    // Wait for version options to load
    await waitFor(() => {
      expect(getOptionsToUpgrade).toHaveBeenCalled();
    });

    // Select a version to upgrade
    const versionSelect = getAllByRole('combobox')[0];

    await act(async () => {
      fireEvent.change(versionSelect, { target: { value: '4.4.0' } });
    });

    // Click upgrade button
    const upgradeButton = getByRole('button', { name: 'Upgrade' });

    await act(async () => {
      fireEvent.click(upgradeButton);
    });

    // Verify API call
    expect(mockUpgrade).toHaveBeenCalledWith('001', '4.4.0');
    expect(mockAddInfo).toHaveBeenCalledWith({
      title: 'Upgrade agent',
      text: 'Upgrade task in progress',
    });
    expect(mockReloadAgents).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should handle API error when upgrade fails', async () => {
    // Make the API call fail
    mockUpgrade.mockRejectedValueOnce(new Error('Upgrade failed'));

    const { getByRole, getAllByRole } = render(
      <UpgradeAgentModal
        agent={mockAgent}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );

    // Wait for version options to load
    await waitFor(() => {
      expect(getOptionsToUpgrade).toHaveBeenCalled();
    });

    // Select a version to upgrade
    const versionSelect = getAllByRole('combobox')[0];

    await act(async () => {
      fireEvent.change(versionSelect, { target: { value: '4.4.0' } });
    });

    // Click upgrade button
    const upgradeButton = getByRole('button', { name: 'Upgrade' });

    await act(async () => {
      fireEvent.click(upgradeButton);
    });

    // Verify error handling
    expect(mockUpgrade).toHaveBeenCalledWith('001', '4.4.0');
    expect(mockAddDanger).toHaveBeenCalledWith({
      title: 'Upgrade agent',
      text: 'Upgrade failed',
    });
    expect(mockReloadAgents).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should close modal when cancel button is clicked', async () => {
    const { getByRole } = render(
      <UpgradeAgentModal
        agent={mockAgent}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );

    // Wait for version options to load
    await waitFor(() => {
      expect(getOptionsToUpgrade).toHaveBeenCalled();
    });

    // Click cancel button
    const cancelButton = getByRole('button', { name: 'Cancel' });

    fireEvent.click(cancelButton);

    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockReloadAgents).not.toHaveBeenCalled();
  });

  test('should select package type for unsupported platform', async () => {
    const { getByRole, getAllByRole } = render(
      <UpgradeAgentModal
        agent={mockAgentUnsupportedPlatform}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );

    // Wait for version options to load
    await waitFor(() => {
      expect(getOptionsToUpgrade).toHaveBeenCalled();
    });

    // Select a version to upgrade
    const versionSelect = getAllByRole('combobox')[0];

    await act(async () => {
      fireEvent.change(versionSelect, { target: { value: '4.4.0' } });
    });

    // Select a package type
    const packageTypeSelect = getAllByRole('combobox')[1];

    await act(async () => {
      fireEvent.change(packageTypeSelect, { target: { value: 'deb' } });
    });

    // Click upgrade button
    const upgradeButton = getByRole('button', { name: 'Upgrade' });

    await act(async () => {
      fireEvent.click(upgradeButton);
    });

    // Verify API call
    expect(mockUpgrade).toHaveBeenCalledWith('002', '4.4.0');
  });
});
