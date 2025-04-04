import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getAgentManagement } from '../../../../../plugin-services';
import { getAgents } from '../common/get-agents';
import { EditAgentsGroupsModal, RESULT_TYPE } from './edit-groups-modal';
import { EditActionGroups } from './types';

// Mock the plugin services and utilities
jest.mock('../../../../../plugin-services', () => ({
  getAgentManagement: jest.fn(),
}));

jest.mock('../common/get-agents', () => ({
  getAgents: jest.fn(),
}));

// Mock the result component
jest.mock('./result', () => ({
  EditAgentsGroupsModalResult: () => (
    <div data-testid='result-component'>Result Component</div>
  ),
}));

describe('EditAgentsGroupsModal component', () => {
  const mockSelectedAgents = [
    {
      _source: {
        agent: {
          id: '001',
          name: 'agent1',
          groups: ['default'],
        },
      },
      _id: 'agent1',
    },
    {
      _id: 'agent2',
      _source: {
        agent: {
          id: '002',
          name: 'agent2',
          groups: ['default'],
        },
      },
    },
  ];
  const mockParams = { q: 'status=active' };
  const mockOnClose = jest.fn();
  const mockReloadAgents = jest.fn();
  const mockAddGroups = jest.fn();
  const mockRemoveGroups = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    (getAgentManagement as jest.Mock).mockReturnValue({
      addGroups: mockAddGroups,
      removeGroups: mockRemoveGroups,
    });

    // Mock successful API responses
    mockAddGroups.mockResolvedValue({
      data: {
        affected_items: ['001'],
        failed_items: [],
        total_failed_items: 0,
      },
      error: 0,
      message: 'Success',
    });

    mockRemoveGroups.mockResolvedValue({
      data: {
        affected_items: ['001'],
        failed_items: [],
        total_failed_items: 0,
      },
      error: 0,
      message: 'Success',
    });

    (getAgents as jest.Mock).mockResolvedValue(mockSelectedAgents);
  });

  test('should render the add groups modal correctly', () => {
    const { getByText, queryByText, getByLabelText, getByRole } = render(
      <EditAgentsGroupsModal
        selectedAgents={mockSelectedAgents}
        allAgentsSelected={false}
        params={mockParams}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
        editAction={EditActionGroups.ADD}
      />,
    );

    // Check modal title
    expect(getByText('Add groups to agents')).toBeInTheDocument();

    // Check form elements
    expect(getByText('Selected agents')).toBeInTheDocument();
    expect(getByLabelText('Select groups to add')).toBeInTheDocument();
    // Number of selected agents
    expect(getByText('2')).toBeInTheDocument();

    // Warning should not be shown when allAgentsSelected is false
    expect(
      queryByText(/The changes will be applied to all agents/),
    ).not.toBeInTheDocument();

    const cancelButton = getByRole('button', { name: 'Cancel' });

    expect(cancelButton).toBeInTheDocument();

    const saveButton = getByRole('button', { name: 'Save' });

    expect(saveButton).toBeInTheDocument();
    // Save button should be disabled initially
    expect(saveButton).toBeDisabled();
  });

  test('should render the remove groups modal correctly', () => {
    const { getByText, getByLabelText, queryByText, getByRole } = render(
      <EditAgentsGroupsModal
        selectedAgents={mockSelectedAgents}
        allAgentsSelected={false}
        params={mockParams}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
        editAction={EditActionGroups.REMOVE}
      />,
    );

    // Check modal title
    expect(getByText('Remove groups from agents')).toBeInTheDocument();

    // Check form elements
    expect(getByLabelText('Select groups to remove')).toBeInTheDocument();

    // Warning should not be shown when allAgentsSelected is false
    expect(
      queryByText(/The changes will be applied to all agents/),
    ).not.toBeInTheDocument();

    const cancelButton = getByRole('button', { name: 'Cancel' });

    expect(cancelButton).toBeInTheDocument();

    const saveButton = getByRole('button', { name: 'Save' });

    expect(saveButton).toBeInTheDocument();
    // Save button should be disabled initially
    expect(saveButton).toBeDisabled();
  });

  test('should show warning when allAgentsSelected is true', () => {
    const { getByText, queryByText } = render(
      <EditAgentsGroupsModal
        selectedAgents={mockSelectedAgents}
        allAgentsSelected={true}
        params={mockParams}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
        editAction={EditActionGroups.ADD}
      />,
    );

    // Warning should be shown
    expect(
      getByText(/The changes will be applied to all agents/),
    ).toBeInTheDocument();

    // Selected agents count should not be shown
    expect(queryByText('Selected agents')).not.toBeInTheDocument();
  });

  test('should enable save button when groups are selected', async () => {
    const { getByRole } = render(
      <EditAgentsGroupsModal
        selectedAgents={mockSelectedAgents}
        allAgentsSelected={false}
        params={mockParams}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
        editAction={EditActionGroups.ADD}
      />,
    );
    const saveButton = getByRole('button', { name: 'Save' });

    // Save button should be disabled initially as no groups are selected
    expect(saveButton).toBeDisabled();

    // Add a group
    const comboBox = getByRole('textbox');

    fireEvent.change(comboBox, { target: { value: 'newgroup' } });
    fireEvent.keyDown(comboBox, { key: 'Enter', code: 'Enter' });

    // Save button should be enabled
    expect(saveButton).not.toBeDisabled();
  });

  test('should call addGroups when adding groups and save is clicked', async () => {
    const { getByText, getByRole, getByTestId } = render(
      <EditAgentsGroupsModal
        selectedAgents={mockSelectedAgents}
        allAgentsSelected={false}
        params={mockParams}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
        editAction={EditActionGroups.ADD}
      />,
    );
    // Add a group
    const comboBox = getByRole('textbox');

    fireEvent.change(comboBox, { target: { value: 'newgroup' } });
    fireEvent.keyDown(comboBox, { key: 'Enter', code: 'Enter' });

    // Click save button
    const saveButton = getByText('Save');

    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Verify API calls
    await waitFor(() => {
      expect(mockAddGroups).toHaveBeenCalledWith('agent1', ['newgroup']);
      expect(mockAddGroups).toHaveBeenCalledWith('agent2', ['newgroup']);
    });

    // Verify result component is shown
    await waitFor(() => {
      expect(getByTestId('result-component')).toBeInTheDocument();
    });

    // Verify reloadAgents was called
    expect(mockReloadAgents).toHaveBeenCalled();
  });

  test('should call removeGroups when removing groups and save is clicked', async () => {
    const { getByText, getByRole, getByTestId } = render(
      <EditAgentsGroupsModal
        selectedAgents={mockSelectedAgents}
        allAgentsSelected={false}
        params={mockParams}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
        editAction={EditActionGroups.REMOVE}
      />,
    );
    // Add a group to remove
    const comboBox = getByRole('textbox');

    fireEvent.change(comboBox, { target: { value: 'default' } });
    fireEvent.keyDown(comboBox, { key: 'Enter', code: 'Enter' });

    // Click save button
    const saveButton = getByText('Save');

    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Verify API calls
    await waitFor(() => {
      expect(mockRemoveGroups).toHaveBeenCalledWith('agent1', ['default']);
      expect(mockRemoveGroups).toHaveBeenCalledWith('agent2', ['default']);
    });

    // Verify result component is shown
    await waitFor(() => {
      expect(getByTestId('result-component')).toBeInTheDocument();
    });

    // Verify reloadAgents was called
    expect(mockReloadAgents).toHaveBeenCalled();
  });

  test('should handle API errors correctly', async () => {
    // Make the API call fail
    mockAddGroups.mockRejectedValueOnce(new Error('API error'));

    const { getByText, getByRole, getByTestId } = render(
      <EditAgentsGroupsModal
        selectedAgents={mockSelectedAgents}
        allAgentsSelected={false}
        params={mockParams}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
        editAction={EditActionGroups.ADD}
      />,
    );
    // Add a group
    const comboBox = getByRole('textbox');

    fireEvent.change(comboBox, { target: { value: 'newgroup' } });
    fireEvent.keyDown(comboBox, { key: 'Enter', code: 'Enter' });

    // Click save button
    const saveButton = getByText('Save');

    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Verify result component is shown with error
    await waitFor(() => {
      expect(getByTestId('result-component')).toBeInTheDocument();
    });

    // Verify reloadAgents was still called
    expect(mockReloadAgents).toHaveBeenCalled();
  });

  test('should close modal when close button is clicked', async () => {
    const { getByText, getByRole, getByTestId } = render(
      <EditAgentsGroupsModal
        selectedAgents={mockSelectedAgents}
        allAgentsSelected={false}
        params={mockParams}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
        editAction={EditActionGroups.ADD}
      />,
    );
    // Add a group
    const comboBox = getByRole('textbox');

    fireEvent.change(comboBox, { target: { value: 'newgroup' } });
    fireEvent.keyDown(comboBox, { key: 'Enter', code: 'Enter' });

    // Click save button to show results
    const saveButton = getByText('Save');

    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Verify result component is shown
    await waitFor(() => {
      expect(getByTestId('result-component')).toBeInTheDocument();
    });

    // Click close button
    const closeButton = getByText('Close');

    fireEvent.click(closeButton);

    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should close modal when cancel button is clicked', () => {
    const { getByRole } = render(
      <EditAgentsGroupsModal
        selectedAgents={mockSelectedAgents}
        allAgentsSelected={false}
        params={mockParams}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
        editAction={EditActionGroups.ADD}
      />,
    );
    // Click cancel button
    const cancelButton = getByRole('button', { name: 'Cancel' });

    fireEvent.click(cancelButton);

    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });
});
