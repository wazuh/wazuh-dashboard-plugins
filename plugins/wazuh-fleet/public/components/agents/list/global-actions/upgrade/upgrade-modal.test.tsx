import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getAgentManagement } from '../../../../../plugin-services';
import { getAgents } from '../common/get-agents';
import { getOptionsToUpgrade } from '../../utils/selector-version-upgrade';
import { UpgradeAgentsModal } from './upgrade-modal';

// Mock the plugin services and utilities
jest.mock('../../../../../plugin-services', () => ({
  getAgentManagement: jest.fn(),
}));

jest.mock('../common/get-agents', () => ({
  getAgents: jest.fn(),
}));

jest.mock('../../utils/selector-version-upgrade', () => ({
  getOptionsToUpgrade: jest.fn(),
}));

// Mock the result component
jest.mock('./result', () => ({
  UpgradeAgentsModalResult: () => (
    <div data-testid='result-component'>Result Component</div>
  ),
}));

describe('UpgradeAgentsModal component', () => {
  const mockSelectedAgents = [
    {
      _source: {
        agent: {
          id: '001',
          name: 'agent1',
          version: '4.3.0',
        },
      },
      _id: 'agent1',
    },
    {
      _source: {
        agent: {
          id: '002',
          name: 'agent2',
          version: '4.3.0',
        },
      },
      _id: 'agent2',
    },
  ];
  const mockParams = { q: 'status=active' };
  const mockOnClose = jest.fn();
  const mockReloadAgents = jest.fn();
  const mockUpgrade = jest.fn();
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

    // Mock successful API response
    mockUpgrade.mockResolvedValue({
      data: {
        data: {
          affected_items: ['001', '002'],
          failed_items: [],
          total_failed_items: 0,
        },
        message: 'Success',
      },
    });

    (getAgents as jest.Mock).mockResolvedValue(mockSelectedAgents);

    // Properly resolve the getOptionsToUpgrade promise
    (getOptionsToUpgrade as jest.Mock).mockResolvedValue(mockVersionOptions);
  });

  test('should render the modal with form elements', async () => {
    // Wrap the render in act to handle initial state updates
    let renderResult;

    await act(async () => {
      renderResult = render(
        <UpgradeAgentsModal
          selectedAgents={mockSelectedAgents}
          allAgentsSelected={false}
          params={mockParams}
          onClose={mockOnClose}
          reloadAgents={mockReloadAgents}
        />,
      );
    });

    const { getByText, getByRole } = renderResult;

    // Check modal title
    expect(getByText('Upgrade agents')).toBeInTheDocument();

    // Check form elements
    expect(getByText('Selected agents')).toBeInTheDocument();
    expect(getByText('2')).toBeInTheDocument(); // Number of selected agents
    expect(getByText('Version to upgrade')).toBeInTheDocument();

    // No need to wait for options to load since we've already waited with act
    expect(getOptionsToUpgrade).toHaveBeenCalled();

    // Check buttons
    expect(getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(getByRole('button', { name: 'Upgrade' })).toBeInTheDocument();
    expect(getByRole('button', { name: 'Upgrade' })).toBeDisabled(); // Upgrade should be disabled initially
  });

  test('should show warning when allAgentsSelected is true', async () => {
    // Wrap the render in act
    let renderResult;

    await act(async () => {
      renderResult = render(
        <UpgradeAgentsModal
          selectedAgents={mockSelectedAgents}
          allAgentsSelected={true}
          params={mockParams}
          onClose={mockOnClose}
          reloadAgents={mockReloadAgents}
        />,
      );
    });

    const { getByText, queryByText } = renderResult;

    // Warning should be shown
    expect(
      getByText(
        /The changes will be applied to all agents that match the filters/,
      ),
    ).toBeInTheDocument();

    // Selected agents count should not be shown
    expect(queryByText('Selected agents')).not.toBeInTheDocument();
  });

  test('should enable upgrade button when version is selected', async () => {
    // Wrap the render in act
    let renderResult;

    await act(async () => {
      renderResult = render(
        <UpgradeAgentsModal
          selectedAgents={mockSelectedAgents}
          allAgentsSelected={false}
          params={mockParams}
          onClose={mockOnClose}
          reloadAgents={mockReloadAgents}
        />,
      );
    });

    const { getByRole } = renderResult;
    const upgradeButton = getByRole('button', { name: 'Upgrade' });

    expect(upgradeButton).toBeDisabled();

    // Select a version
    const versionSelect = getByRole('combobox');

    await act(async () => {
      fireEvent.change(versionSelect, { target: { value: '4.4.0' } });
    });

    // Upgrade button should be enabled
    expect(upgradeButton).not.toBeDisabled();
  });

  test('should call upgrade API when upgrade button is clicked', async () => {
    let renderResult;

    await act(async () => {
      renderResult = render(
        <UpgradeAgentsModal
          selectedAgents={mockSelectedAgents}
          allAgentsSelected={false}
          params={mockParams}
          onClose={mockOnClose}
          reloadAgents={mockReloadAgents}
        />,
      );
    });

    const { getByRole, getByTestId } = renderResult;
    // Select a version
    const versionSelect = getByRole('combobox');

    await act(async () => {
      fireEvent.change(versionSelect, { target: { value: '4.4.0' } });
    });

    // Click upgrade button
    await act(async () => {
      fireEvent.click(getByRole('button', { name: 'Upgrade' }));
    });

    // Verify API call
    expect(mockUpgrade).toHaveBeenCalledWith({
      agentIds: ['agent1', 'agent2'],
      version: '4.4.0',
    });

    // Verify result component is shown
    expect(getByTestId('result-component')).toBeInTheDocument();

    // Verify reloadAgents was called
    expect(mockReloadAgents).toHaveBeenCalled();
  });

  test('should handle API errors correctly', async () => {
    // Make the API call fail
    mockUpgrade.mockRejectedValueOnce({ message: 'Upgrade failed' });

    let renderResult;

    await act(async () => {
      renderResult = render(
        <UpgradeAgentsModal
          selectedAgents={mockSelectedAgents}
          allAgentsSelected={false}
          params={mockParams}
          onClose={mockOnClose}
          reloadAgents={mockReloadAgents}
        />,
      );
    });

    const { getByRole, getByTestId } = renderResult;
    // Select a version
    const versionSelect = getByRole('combobox');

    await act(async () => {
      fireEvent.change(versionSelect, { target: { value: '4.4.0' } });
    });

    // Click upgrade button
    await act(async () => {
      fireEvent.click(getByRole('button', { name: 'Upgrade' }));
    });

    // Verify result component is shown with error
    expect(getByTestId('result-component')).toBeInTheDocument();

    // Verify reloadAgents was still called
    expect(mockReloadAgents).toHaveBeenCalled();
  });

  test('should close modal when close button is clicked after results', async () => {
    let renderResult;

    await act(async () => {
      renderResult = render(
        <UpgradeAgentsModal
          selectedAgents={mockSelectedAgents}
          allAgentsSelected={false}
          params={mockParams}
          onClose={mockOnClose}
          reloadAgents={mockReloadAgents}
        />,
      );
    });

    const { getByRole, getByTestId } = renderResult;
    // Select a version
    const versionSelect = getByRole('combobox');

    await act(async () => {
      fireEvent.change(versionSelect, { target: { value: '4.4.0' } });
    });

    // Click upgrade button to show results
    await act(async () => {
      fireEvent.click(getByRole('button', { name: 'Upgrade' }));
    });

    // Verify result component is shown
    expect(getByTestId('result-component')).toBeInTheDocument();

    // Click close button
    fireEvent.click(getByRole('button', { name: 'Close' }));

    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should close modal when cancel button is clicked', async () => {
    let renderResult;

    await act(async () => {
      renderResult = render(
        <UpgradeAgentsModal
          selectedAgents={mockSelectedAgents}
          allAgentsSelected={false}
          params={mockParams}
          onClose={mockOnClose}
          reloadAgents={mockReloadAgents}
        />,
      );
    });

    const { getByRole } = renderResult;

    // Click cancel button
    fireEvent.click(getByRole('button', { name: 'Cancel' }));

    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });
});
