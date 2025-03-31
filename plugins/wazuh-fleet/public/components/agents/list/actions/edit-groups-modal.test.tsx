import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getAgentManagement, getToasts } from '../../../../plugin-services';
import { EditAgentGroupsModal } from './edit-groups-modal';

// Mock the plugin services
jest.mock('../../../../plugin-services', () => ({
  getAgentManagement: jest.fn(),
  getToasts: jest.fn(),
}));

describe('EditAgentGroupsModal component', () => {
  const mockAgent = {
    agent: {
      id: '001',
      name: 'agent1',
      groups: ['default', 'test1'],
    },
  };
  const mockOnClose = jest.fn();
  const mockReloadAgents = jest.fn();
  const mockAddGroups = jest.fn().mockResolvedValue({});
  const mockRemoveGroups = jest.fn().mockResolvedValue({});
  const mockAddInfo = jest.fn();
  const mockAddDanger = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    (getAgentManagement as jest.Mock).mockReturnValue({
      addGroups: mockAddGroups,
      removeGroups: mockRemoveGroups,
    });

    (getToasts as jest.Mock).mockReturnValue({
      addInfo: mockAddInfo,
      addDanger: mockAddDanger,
    });
  });

  test('should return the component with save disabled', async () => {
    const { container, getByText, getByRole } = render(
      <EditAgentGroupsModal
        agent={mockAgent}
        onClose={() => {}}
        reloadAgents={() => {}}
      />,
    );

    expect(container).toMatchSnapshot();

    const agentName = getByText('agent1');

    expect(agentName).toBeInTheDocument();

    const saveButton = getByRole('button', { name: 'Save' });

    expect(saveButton).toBeInTheDocument();

    expect(saveButton).toBeDisabled();

    const cancelButton = getByRole('button', { name: 'Cancel' });

    expect(cancelButton).toBeInTheDocument();
  });

  test('should return the component', async () => {
    const { container, getByText, getByRole } = render(
      <EditAgentGroupsModal
        agent={mockAgent}
        onClose={() => {}}
        reloadAgents={() => {}}
      />,
    );

    expect(container).toMatchSnapshot();

    const agentName = getByText('agent1');

    expect(agentName).toBeInTheDocument();

    const saveButton = getByRole('button', { name: 'Save' });

    expect(saveButton).toBeInTheDocument();

    const cancelButton = getByRole('button', { name: 'Cancel' });

    expect(cancelButton).toBeInTheDocument();
  });

  test('should add a new group', async () => {
    const { getByText, getByRole } = render(
      <EditAgentGroupsModal
        agent={mockAgent}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );
    const selectedGroup = getByRole('textbox');

    expect(selectedGroup).toBeInTheDocument();

    // Add a new group

    fireEvent.change(selectedGroup, { target: { value: 'newgroup' } });
    fireEvent.keyDown(selectedGroup, { key: 'Enter', keyCode: 13 });

    // Verify the new group appears in the UI
    expect(getByText('newgroup')).toBeInTheDocument();

    const saveButton = getByRole('button', { name: 'Save' });

    expect(saveButton).toBeInTheDocument();
    expect(saveButton).not.toBeDisabled();

    // Click save button
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Verify the mocks were called
    expect(mockAddGroups).toHaveBeenCalledWith('001', ['newgroup']);
    expect(mockAddInfo).toHaveBeenCalledWith({
      title: 'Agent groups edited',
      text: 'Agent agent1 groups have been updated',
    });
    expect(mockReloadAgents).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should remove a group', async () => {
    const { getByTitle, getByRole } = render(
      <EditAgentGroupsModal
        agent={mockAgent}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );
    const removeButton = getByTitle(
      'Remove default from selection in this group',
    );
    const saveButton = getByRole('button', { name: 'Save' });

    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
    expect(removeButton).toBeInTheDocument();
    // Click remove button
    await act(async () => {
      fireEvent.click(removeButton);
    });

    expect(saveButton).not.toBeDisabled();

    // Click save button
    await act(async () => {
      fireEvent.click(saveButton);
    });
    // Verify the mocks were called
    expect(mockRemoveGroups).toHaveBeenCalledWith({
      agentId: '001',
      groupIds: ['default'],
    });
    expect(mockAddInfo).toHaveBeenCalledWith({
      title: 'Agent groups edited',
      text: 'Agent agent1 groups have been updated',
    });
    expect(mockReloadAgents).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should close modal when cancel button is clicked', async () => {
    const { getByRole } = render(
      <EditAgentGroupsModal
        agent={mockAgent}
        onClose={mockOnClose}
        reloadAgents={mockReloadAgents}
      />,
    );
    const cancelButton = getByRole('button', { name: 'Cancel' });

    expect(cancelButton).toBeInTheDocument();
    // Click cancel button
    await act(async () => {
      fireEvent.click(cancelButton);
    });
    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockReloadAgents).not.toHaveBeenCalled();
    expect(mockRemoveGroups).not.toHaveBeenCalled();
    expect(mockAddGroups).not.toHaveBeenCalled();
  });
});
