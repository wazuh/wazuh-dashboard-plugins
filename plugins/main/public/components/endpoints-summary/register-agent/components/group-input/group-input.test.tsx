import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import GroupInput from './group-input';

/* Stub the button: its RBAC selectors and API call are not what this tests. */
jest.mock('../../../../management/groups/add-new-group-button', () => ({
  AddNewGroupButton: ({
    onGroupCreated,
  }: {
    onGroupCreated: (groupName: string) => void;
  }) => (
    <button type='button' onClick={() => onGroupCreated('team-a')}>
      Add new group
    </button>
  ),
}));

const options = { groups: [{ label: 'default', id: 'default' }] };

const createGroup = () => fireEvent.click(screen.getByText('Add new group'));

describe('GroupInput', () => {
  it('warns when the server returned no groups', () => {
    render(
      <GroupInput value={[]} options={{ groups: [] }} onChange={() => {}} />,
    );
    expect(screen.getByTestId('group-input-callout')).toBeInTheDocument();
  });

  it('selects the group it creates', async () => {
    const onChange = jest.fn();
    render(<GroupInput value={[]} options={options} onChange={onChange} />);
    createGroup();

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({
        target: { value: [{ label: 'team-a', id: 'team-a' }] },
      }),
    );
  });

  it('keeps the groups already selected', async () => {
    const onChange = jest.fn();
    render(
      <GroupInput
        value={[{ label: 'default', id: 'default' }]}
        options={options}
        onChange={onChange}
      />,
    );
    createGroup();

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({
        target: {
          value: [
            { label: 'default', id: 'default' },
            { label: 'team-a', id: 'team-a' },
          ],
        },
      }),
    );
  });

  it('does not select a group twice', async () => {
    const onChange = jest.fn();
    const onGroupCreated = jest.fn();
    render(
      <GroupInput
        value={[{ label: 'team-a', id: 'team-a' }]}
        options={options}
        onChange={onChange}
        onGroupCreated={onGroupCreated}
      />,
    );
    createGroup();

    await waitFor(() => expect(onGroupCreated).toHaveBeenCalledWith('team-a'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
