import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getAgentManagement } from '../../../../plugin-services';
import { EditAgentNameModal } from './edit-name-agent-modal';

// Mock the plugin services
jest.mock('../../../../plugin-services', () => ({
  getAgentManagement: jest.fn(),
}));

describe('EditAgentNameModal component', () => {
  const mockAgent = {
    agent: {
      id: '001',
      name: 'agent1',
    },
  };
  const mockOnClose = jest.fn();
  const mockReloadAgents = jest.fn();
  const mockEditName = jest.fn().mockResolvedValue({});

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    (getAgentManagement as jest.Mock).mockReturnValue({
      editName: mockEditName,
    });
  });

  test('should render the component with agent information', () => {
    const { getByText, getByRole, getByPlaceholderText } = render(
      <EditAgentNameModal
        agent={mockAgent}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );

    // Check agent information is displayed
    expect(getByText('001')).toBeInTheDocument();
    expect(getByText('agent1')).toBeInTheDocument();

    // Check modal title
    expect(getByText('Edit agent name')).toBeInTheDocument();

    // Check input field
    const inputField = getByPlaceholderText('Type a new agent name');

    expect(inputField).toBeInTheDocument();

    // Check buttons
    const cancelButton = getByRole('button', { name: 'Cancel' });

    expect(cancelButton).toBeInTheDocument();

    const saveButton = getByRole('button', { name: 'Save' });

    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled(); // Initially disabled as no new name is entered
  });

  test('should validate input and enable save button with valid name', async () => {
    const { getByPlaceholderText, getByRole } = render(
      <EditAgentNameModal
        agent={mockAgent}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );
    const inputField = getByPlaceholderText('Type a new agent name');
    const saveButton = getByRole('button', { name: 'Save' });

    // Initially save button should be disabled
    expect(saveButton).toBeDisabled();

    // Enter a valid name (different from current and meets length requirements)
    await act(async () => {
      fireEvent.change(inputField, { target: { value: 'new-agent-name' } });
    });

    // Save button should be enabled
    expect(saveButton).not.toBeDisabled();
  });

  test('should show error when name is too short', async () => {
    const { getByPlaceholderText, getByText } = render(
      <EditAgentNameModal
        agent={mockAgent}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );
    const inputField = getByPlaceholderText('Type a new agent name');

    // Enter a name that's too short
    await act(async () => {
      fireEvent.change(inputField, { target: { value: 'ab' } });
    });

    // Error message should be displayed
    expect(
      getByText('Agent name must be at least 3 characters long'),
    ).toBeInTheDocument();
  });

  test('should show error when name is too long', async () => {
    const { getByPlaceholderText, getByText } = render(
      <EditAgentNameModal
        agent={mockAgent}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );
    const inputField = getByPlaceholderText('Type a new agent name');

    // Enter a name that's too long
    await act(async () => {
      fireEvent.change(inputField, { target: { value: 'a'.repeat(51) } });
    });

    // Error message should be displayed
    expect(
      getByText('Agent name cannot exceed 50 characters'),
    ).toBeInTheDocument();
  });

  test('should show error when name is the same as current name', async () => {
    const { getByPlaceholderText, getByText } = render(
      <EditAgentNameModal
        agent={mockAgent}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );
    const inputField = getByPlaceholderText('Type a new agent name');

    // Enter the same name as current
    await act(async () => {
      fireEvent.change(inputField, { target: { value: 'agent1' } });
    });

    // Error message should be displayed
    expect(
      getByText('New agent name cannot be the same as the current one'),
    ).toBeInTheDocument();
  });

  test('should call editName API when save button is clicked', async () => {
    const { getByPlaceholderText, getByRole } = render(
      <EditAgentNameModal
        agent={mockAgent}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );
    const inputField = getByPlaceholderText('Type a new agent name');
    const saveButton = getByRole('button', { name: 'Save' });

    // Enter a valid name
    await act(async () => {
      fireEvent.change(inputField, { target: { value: 'new-agent-name' } });
    });

    // Click save button
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Verify API call
    expect(mockEditName).toHaveBeenCalledWith('001', 'new-agent-name');
    expect(mockReloadAgents).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should call editName API when Enter key is pressed with valid name', async () => {
    const { getByPlaceholderText } = render(
      <EditAgentNameModal
        agent={mockAgent}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );
    const inputField = getByPlaceholderText('Type a new agent name');

    // Enter a valid name
    await act(async () => {
      fireEvent.change(inputField, { target: { value: 'new-agent-name' } });
    });

    // Press Enter key
    await act(async () => {
      fireEvent.keyDown(inputField, { key: 'Enter', code: 'Enter' });
    });

    // Verify API call
    expect(mockEditName).toHaveBeenCalledWith('001', 'new-agent-name');
    expect(mockReloadAgents).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should not call editName API when Enter key is pressed with invalid name', async () => {
    const { getByPlaceholderText } = render(
      <EditAgentNameModal
        agent={mockAgent}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );
    const inputField = getByPlaceholderText('Type a new agent name');

    // Enter an invalid name (too short)
    await act(async () => {
      fireEvent.change(inputField, { target: { value: 'ab' } });
    });

    // Press Enter key
    await act(async () => {
      fireEvent.keyDown(inputField, { key: 'Enter', code: 'Enter' });
    });

    // Verify API call was not made
    expect(mockEditName).not.toHaveBeenCalled();
    expect(mockReloadAgents).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('should handle API error when editName fails', async () => {
    // Make the API call fail
    mockEditName.mockRejectedValueOnce(new Error('Edit name failed'));

    const { getByPlaceholderText, getByRole } = render(
      <EditAgentNameModal
        agent={mockAgent}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );
    const inputField = getByPlaceholderText('Type a new agent name');
    const saveButton = getByRole('button', { name: 'Save' });

    // Enter a valid name
    await act(async () => {
      fireEvent.change(inputField, { target: { value: 'new-agent-name' } });
    });

    // Click save button
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Verify error handling
    expect(mockEditName).toHaveBeenCalledWith('001', 'new-agent-name');
    expect(mockReloadAgents).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('should close modal when cancel button is clicked', () => {
    const { getByRole } = render(
      <EditAgentNameModal
        agent={mockAgent}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );
    // Click cancel button
    const cancelButton = getByRole('button', { name: 'Cancel' });

    fireEvent.click(cancelButton);

    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });
});
