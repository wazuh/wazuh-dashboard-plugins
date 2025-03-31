import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditAgentsGroupsModalResult } from './result';
import { RESULT_TYPE } from './edit-groups-modal';
import { EditActionGroups } from './types';

describe('EditAgentsGroupsModalResult component', () => {
  const mockAgents = [
    {
      _id: 'agent1',
      agent: {
        id: '001',
        name: 'agent1',
        groups: ['default'],
      },
    },
    {
      _id: 'agent2',
      agent: {
        id: '002',
        name: 'agent2',
        groups: ['default'],
      },
    },
  ];
  const mockGroups = ['group1', 'group2'];

  test('should render loading state correctly', () => {
    const { getByText } = render(
      <EditAgentsGroupsModalResult
        editAction={EditActionGroups.ADD}
        finalAgents={[]}
        getAgentsStatus='loading'
        saveChangesStatus='loading'
        documentResults={[]}
        groups={mockGroups}
      />,
    );

    // Check step titles
    expect(getByText('Retrieve agents data')).toBeInTheDocument();
    expect(getByText('Add groups')).toBeInTheDocument();

    // In loading state, no agent data should be shown
    expect(screen.queryByText('Agents details')).not.toBeInTheDocument();
  });

  test('should render error state for agent retrieval', () => {
    const mockError = new Error('Failed to get agents');
    const { getByText } = render(
      <EditAgentsGroupsModalResult
        editAction={EditActionGroups.ADD}
        finalAgents={[]}
        getAgentsStatus='danger'
        getAgentsError={mockError}
        saveChangesStatus='loading'
        documentResults={[]}
        groups={mockGroups}
      />,
    );

    // Check error message
    expect(getByText('Could not get agents data')).toBeInTheDocument();
    expect(getByText('Failed to get agents')).toBeInTheDocument();
  });

  test('should render agents accordion when agents are loaded', () => {
    const { getByText } = render(
      <EditAgentsGroupsModalResult
        editAction={EditActionGroups.ADD}
        finalAgents={mockAgents}
        getAgentsStatus='complete'
        saveChangesStatus='loading'
        documentResults={[]}
        groups={mockGroups}
      />,
    );

    // Check agents accordion
    expect(getByText('Agents details (2)')).toBeInTheDocument();

    // In loading state for save changes, agents should show loading spinners
    expect(getByText('agent1', { ignore: 'span' })).toBeInTheDocument();
    expect(getByText('agent2', { ignore: 'span' })).toBeInTheDocument();
  });

  test('should render success state for adding groups', () => {
    const mockDocumentResults = [
      {
        documentId: 'agent1',
        result: RESULT_TYPE.SUCCESS,
      },
      {
        documentId: 'agent2',
        result: RESULT_TYPE.SUCCESS,
      },
    ];
    const { getByText } = render(
      <EditAgentsGroupsModalResult
        editAction={EditActionGroups.ADD}
        finalAgents={mockAgents}
        getAgentsStatus='complete'
        saveChangesStatus='complete'
        documentResults={mockDocumentResults}
        groups={mockGroups}
      />,
    );

    // Check success messages
    expect(getByText('agent1 (group1, group2 added)')).toBeInTheDocument();
    expect(getByText('agent2 (group1, group2 added)')).toBeInTheDocument();
  });

  test('should render success state for removing groups', () => {
    const mockDocumentResults = [
      {
        documentId: 'agent1',
        result: RESULT_TYPE.SUCCESS,
      },
      {
        documentId: 'agent2',
        result: RESULT_TYPE.SUCCESS,
      },
    ];
    const { getByText } = render(
      <EditAgentsGroupsModalResult
        editAction={EditActionGroups.REMOVE}
        finalAgents={mockAgents}
        getAgentsStatus='complete'
        saveChangesStatus='complete'
        documentResults={mockDocumentResults}
        groups={mockGroups}
      />,
    );

    // Check success messages with "removed" text
    expect(getByText('agent1 (group1, group2 removed)')).toBeInTheDocument();
    expect(getByText('agent2 (group1, group2 removed)')).toBeInTheDocument();

    // Check that the title is "Remove groups" instead of "Add groups"
    expect(getByText('Remove groups')).toBeInTheDocument();
  });

  test('should render error state for some agents', () => {
    const mockDocumentResults = [
      {
        documentId: 'agent1',
        result: RESULT_TYPE.SUCCESS,
      },
      {
        documentId: 'agent2',
        result: RESULT_TYPE.ERROR,
        successAgents: ['003'], // Some agents succeeded
      },
    ];
    const { getByText } = render(
      <EditAgentsGroupsModalResult
        editAction={EditActionGroups.ADD}
        finalAgents={mockAgents}
        getAgentsStatus='complete'
        saveChangesStatus='complete'
        documentResults={mockDocumentResults}
        groups={mockGroups}
      />,
    );

    // Check success message for agent1
    expect(getByText('agent1 (group1, group2 added)')).toBeInTheDocument();

    // Check error message for agent2
    expect(
      getByText('agent2 (no group1, group2 have been added)'),
    ).toBeInTheDocument();

    // Check that some agents succeeded
    expect(getByText('Success agents (1)')).toBeInTheDocument();
  });

  test('should render error state for all agents', () => {
    const mockDocumentResults = [
      {
        documentId: 'agent1',
        result: RESULT_TYPE.ERROR,
      },
      {
        documentId: 'agent2',
        result: RESULT_TYPE.ERROR,
      },
    ];
    const { getByText, queryByText } = render(
      <EditAgentsGroupsModalResult
        editAction={EditActionGroups.ADD}
        finalAgents={mockAgents}
        getAgentsStatus='complete'
        saveChangesStatus='danger'
        documentResults={mockDocumentResults}
        groups={mockGroups}
      />,
    );

    // Check error messages
    expect(
      getByText('agent1 (no group1, group2 have been added)'),
    ).toBeInTheDocument();
    expect(
      getByText('agent2 (no group1, group2 have been added)'),
    ).toBeInTheDocument();

    // No success agents
    expect(queryByText('Success agents')).not.toBeInTheDocument();
  });

  test('should not render agent results when agent retrieval fails', () => {
    const mockError = new Error('Failed to get agents');
    const mockDocumentResults = [
      {
        documentId: 'agent1',
        result: RESULT_TYPE.SUCCESS,
      },
    ];
    const { queryByText } = render(
      <EditAgentsGroupsModalResult
        editAction={EditActionGroups.ADD}
        finalAgents={[]}
        getAgentsStatus='danger'
        getAgentsError={mockError}
        saveChangesStatus='complete'
        documentResults={mockDocumentResults}
        groups={mockGroups}
      />,
    );

    // No agent results should be shown
    expect(
      queryByText('agent1 (group1, group2 added)'),
    ).not.toBeInTheDocument();
  });
});
