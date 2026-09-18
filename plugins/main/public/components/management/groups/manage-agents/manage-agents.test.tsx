import React from 'react';
import { mount } from 'enzyme';
import { act } from '@testing-library/react';
import { ManageAgents, searchBarWQL } from './manage-agents';
import {
  addAgentsToGroupService,
  removeAgentsFromGroupService,
} from '../../../endpoints-summary/services';
import { useGroupMemberIds } from './use-group-member-ids';
import { WzRequest } from '../../../../react-services/wz-request';
import { manageAgentsColumns } from './columns';

jest.mock('../../../endpoints-summary/services', () => ({
  addAgentsToGroupService: jest.fn(),
  removeAgentsFromGroupService: jest.fn(),
}));

jest.mock('./use-group-member-ids', () => ({
  useGroupMemberIds: jest.fn(),
}));

jest.mock('../../../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

// Agent 2 is a member; agent 1 is not. Shared so the useGroupMemberIds
// mock and the TableWzAPI mock's own group filter agree on membership.
let mockAgents = [
  { id: '1', name: 'a1' },
  { id: '2', name: 'a2' },
];
const mockMemberIds = new Set(['2']);

// Mocked TableWzAPI: filters to mockMemberIds when `filters.q` is set,
// re-fires `onDataChange` on `reload`/`filters.q` changes, and keeps
// checked state locally exposed via `setSelection` (a real ref method,
// not a controlled prop, in this OUI version).
jest.mock('../../../common/tables', () => {
  const ReactLib = require('react');
  const TableWzAPI = ReactLib.forwardRef((props: any, ref: any) => {
    const filteredToMembers = !!props.filters?.q;
    const rows = filteredToMembers
      ? mockAgents.filter(a => mockMemberIds.has(a.id))
      : mockAgents;
    const [checked, setChecked] = ReactLib.useState<Record<string, boolean>>(
      {},
    );
    const selection = props.tableProps?.selection;
    // Real EuiBasicTable's `setSelection` also re-invokes `onSelectionChange`.
    ReactLib.useImperativeHandle(ref, () => ({
      setSelection: (items: { id: string }[]) => {
        const next: Record<string, boolean> = {};
        items.forEach(item => {
          next[item.id] = true;
        });
        setChecked(next);
        if (selection?.onSelectionChange) {
          selection.onSelectionChange(items);
        }
      },
    }));
    ReactLib.useEffect(() => {
      if (props.onDataChange) {
        props.onDataChange({ items: [...rows], totalItems: rows.length });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.reload, props.filters?.q]);
    const toggle = (agent: { id: string; name: string }) => {
      setChecked(prev => {
        const next = { ...prev, [agent.id]: !prev[agent.id] };
        if (selection?.onSelectionChange) {
          selection.onSelectionChange(rows.filter(a => next[a.id]));
        }
        return next;
      });
    };
    // Mirrors EuiBasicTable's own onPageChange: clearSelection()
    // (onSelectionChange([])) then the page-change callback fire
    // synchronously, in that order, BEFORE the new page is fetched.
    const goToOtherPage = () => {
      if (selection?.onSelectionChange) {
        selection.onSelectionChange([]);
      }
      props.onPageOrSortChange?.();
      const otherPageRows = [{ id: '3', name: 'a3' }];
      if (props.onDataChange) {
        props.onDataChange({
          items: otherPageRows,
          totalItems: otherPageRows.length,
        });
      }
    };
    return (
      <div>
        {props.title ? <h1>{`${props.title} (${rows.length})`}</h1> : null}
        {props.addOnTitle}
        {rows.length === 0 ? <div>No items found</div> : null}
        {rows.map(agent => (
          <input
            key={agent.id}
            type='checkbox'
            data-test-subj={`checkbox-${agent.id}`}
            checked={!!checked[agent.id]}
            disabled={
              selection?.selectable ? !selection.selectable(agent) : false
            }
            onChange={() => toggle(agent)}
          />
        ))}
        <button data-test-subj='simulatePageChange' onClick={goToOtherPage}>
          Simulate page change
        </button>
      </div>
    );
  });
  TableWzAPI.displayName = 'TableWzAPI';
  return { TableWzAPI };
});

// applyChanges can await up to two service calls sequentially, and a
// single act() only reliably flushes one round of pending microtasks, so
// this polls with its own act() per tick until the text shows up.
const waitForApplyText = async (wrapper: any, expectedText: string) => {
  for (let i = 0; i < 20; i++) {
    wrapper.update();
    if (wrapper.text().includes(expectedText)) {
      return;
    }
    // eslint-disable-next-line no-await-in-loop
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }
  wrapper.update();
};

describe('ManageAgents container (staged diff over a single table, with a "show only members" filter toggle)', () => {
  beforeEach(() => {
    mockAgents = [
      { id: '1', name: 'a1' },
      { id: '2', name: 'a2' },
    ];
    (useGroupMemberIds as jest.Mock).mockReturnValue({
      memberIds: new Set(['2']), // agent 2 is a member, agent 1 is not
      memberTotal: 1,
      isLoading: false,
    });
    (addAgentsToGroupService as jest.Mock).mockReset();
    (removeAgentsFromGroupService as jest.Mock).mockReset();
  });

  it('checking a non-member row stages it for add; applying calls addAgentsToGroupService', async () => {
    (addAgentsToGroupService as jest.Mock).mockResolvedValue({
      data: {
        data: {
          affected_items: ['1'],
          failed_items: [],
          total_failed_items: 0,
        },
      },
    });

    const wrapper = mount(
      <ManageAgents
        currentGroup={{ name: 'group1' }}
        cancelButton={jest.fn()}
      />,
    );

    await act(async () => {
      wrapper.find('input[data-test-subj="checkbox-1"]').simulate('change');
    });
    wrapper.update();
    expect(wrapper.text()).toContain('Adding 1');

    await act(async () => {
      wrapper
        .find('button[data-test-subj="applyChangesButton"]')
        .simulate('click');
    });
    await waitForApplyText(wrapper, 'Applied 1 of 1 change(s)');

    expect(addAgentsToGroupService).toHaveBeenCalledWith(
      expect.objectContaining({ agentIds: ['1'], groupId: 'group1' }),
    );
    expect(removeAgentsFromGroupService).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('checking a member row stages it for removal; applying calls removeAgentsFromGroupService', async () => {
    (removeAgentsFromGroupService as jest.Mock).mockResolvedValue({
      data: {
        data: {
          affected_items: ['2'],
          failed_items: [],
          total_failed_items: 0,
        },
      },
    });

    const wrapper = mount(
      <ManageAgents
        currentGroup={{ name: 'group1' }}
        cancelButton={jest.fn()}
      />,
    );

    await act(async () => {
      wrapper.find('input[data-test-subj="checkbox-2"]').simulate('change');
    });
    wrapper.update();
    expect(wrapper.text()).toContain('Removing 1');

    await act(async () => {
      wrapper
        .find('button[data-test-subj="applyChangesButton"]')
        .simulate('click');
    });
    await waitForApplyText(wrapper, 'Applied 1 of 1 change(s)');

    expect(removeAgentsFromGroupService).toHaveBeenCalledWith(
      expect.objectContaining({ agentIds: ['2'], groupId: 'group1' }),
    );
    expect(addAgentsToGroupService).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('clicking Discard all unchecks the checkbox for every staged row', async () => {
    const wrapper = mount(
      <ManageAgents
        currentGroup={{ name: 'group1' }}
        cancelButton={jest.fn()}
      />,
    );

    await act(async () => {
      wrapper.find('input[data-test-subj="checkbox-1"]').simulate('change');
    });
    wrapper.update();
    expect(
      wrapper.find('input[data-test-subj="checkbox-1"]').prop('checked'),
    ).toBe(true);

    await act(async () => {
      wrapper
        .find('button[data-test-subj="discardAllButton"]')
        .simulate('click');
    });
    wrapper.update();

    expect(
      wrapper.find('input[data-test-subj="checkbox-1"]').prop('checked'),
    ).toBe(false);
    wrapper.unmount();
  });

  it('unstaging a single row from the panel unchecks its checkbox', async () => {
    const wrapper = mount(
      <ManageAgents
        currentGroup={{ name: 'group1' }}
        cancelButton={jest.fn()}
      />,
    );

    await act(async () => {
      wrapper.find('input[data-test-subj="checkbox-1"]').simulate('change');
    });
    wrapper.update();
    expect(
      wrapper.find('input[data-test-subj="checkbox-1"]').prop('checked'),
    ).toBe(true);

    await act(async () => {
      wrapper.find('button[data-test-subj="unstage-1"]').simulate('click');
    });
    wrapper.update();

    expect(
      wrapper.find('input[data-test-subj="checkbox-1"]').prop('checked'),
    ).toBe(false);
    wrapper.unmount();
  });

  it('survives a page change: a staged row that scrolls off the current page is not un-staged by the table auto-pruning its own selection', async () => {
    const wrapper = mount(
      <ManageAgents
        currentGroup={{ name: 'group1' }}
        cancelButton={jest.fn()}
      />,
    );

    await act(async () => {
      wrapper.find('input[data-test-subj="checkbox-1"]').simulate('change');
    });
    wrapper.update();
    expect(wrapper.text()).toContain('Adding 1');

    await act(async () => {
      wrapper
        .find('button[data-test-subj="simulatePageChange"]')
        .simulate('click');
    });
    wrapper.update();

    expect(wrapper.text()).toContain('Adding 1');
    wrapper.unmount();
  });

  it('unchecking a staged row un-stages it', async () => {
    const wrapper = mount(
      <ManageAgents
        currentGroup={{ name: 'group1' }}
        cancelButton={jest.fn()}
      />,
    );

    await act(async () => {
      wrapper.find('input[data-test-subj="checkbox-1"]').simulate('change');
    });
    wrapper.update();
    expect(wrapper.text()).toContain('Adding 1');

    await act(async () => {
      wrapper.find('input[data-test-subj="checkbox-1"]').simulate('change');
    });
    wrapper.update();
    expect(wrapper.text()).toContain('Nothing staged yet');

    await act(async () => {
      wrapper.unmount();
    });
  });

  it('checking both a non-member and a member row and applying calls both services and shows a combined result', async () => {
    (addAgentsToGroupService as jest.Mock).mockResolvedValue({
      data: {
        data: {
          affected_items: ['1'],
          failed_items: [],
          total_failed_items: 0,
        },
      },
    });
    (removeAgentsFromGroupService as jest.Mock).mockResolvedValue({
      data: {
        data: {
          affected_items: ['2'],
          failed_items: [],
          total_failed_items: 0,
        },
      },
    });

    const wrapper = mount(
      <ManageAgents
        currentGroup={{ name: 'group1' }}
        cancelButton={jest.fn()}
      />,
    );

    await act(async () => {
      wrapper.find('input[data-test-subj="checkbox-1"]').simulate('change');
    });
    await act(async () => {
      wrapper.find('input[data-test-subj="checkbox-2"]').simulate('change');
    });
    wrapper.update();

    await act(async () => {
      wrapper
        .find('button[data-test-subj="applyChangesButton"]')
        .simulate('click');
    });
    await waitForApplyText(wrapper, 'Applied 2 of 2 change(s)');

    expect(addAgentsToGroupService).toHaveBeenCalledWith(
      expect.objectContaining({ agentIds: ['1'] }),
    );
    expect(removeAgentsFromGroupService).toHaveBeenCalledWith(
      expect.objectContaining({ agentIds: ['2'] }),
    );
    expect(wrapper.text()).toContain('Applied 2 of 2 change(s)');
    wrapper.unmount();
  });

  it('dismissing the apply result banner clears it while the table and panel stay rendered', async () => {
    (addAgentsToGroupService as jest.Mock).mockResolvedValue({
      data: {
        data: {
          affected_items: ['1'],
          failed_items: [],
          total_failed_items: 0,
        },
      },
    });

    const wrapper = mount(
      <ManageAgents
        currentGroup={{ name: 'group1' }}
        cancelButton={jest.fn()}
      />,
    );

    await act(async () => {
      wrapper.find('input[data-test-subj="checkbox-1"]').simulate('change');
    });
    await act(async () => {
      wrapper
        .find('button[data-test-subj="applyChangesButton"]')
        .simulate('click');
    });
    await waitForApplyText(wrapper, 'Applied 1 of 1 change(s)');
    expect(wrapper.text()).toContain('Applied 1 of 1 change(s)');

    wrapper
      .find('button[data-test-subj="applyResultDismiss"]')
      .simulate('click');
    wrapper.update();

    expect(wrapper.text()).not.toContain('Applied 1 of 1 change(s)');
    expect(wrapper.text()).toContain('Pending changes');
    wrapper.unmount();
  });

  it('unchecks the checkbox for a row that succeeded, but keeps it checked for one that failed', async () => {
    // Agent 1 (add) succeeds; agent 2 (remove) fails.
    (addAgentsToGroupService as jest.Mock).mockResolvedValue({
      data: {
        data: {
          affected_items: ['1'],
          failed_items: [],
          total_failed_items: 0,
        },
      },
    });
    (removeAgentsFromGroupService as jest.Mock).mockResolvedValue({
      data: {
        data: {
          affected_items: [],
          failed_items: [{ error: { code: 1, message: 'boom' }, id: ['2'] }],
          total_failed_items: 1,
        },
      },
    });

    const wrapper = mount(
      <ManageAgents
        currentGroup={{ name: 'group1' }}
        cancelButton={jest.fn()}
      />,
    );

    await act(async () => {
      wrapper.find('input[data-test-subj="checkbox-1"]').simulate('change');
    });
    await act(async () => {
      wrapper.find('input[data-test-subj="checkbox-2"]').simulate('change');
    });
    wrapper.update();
    expect(
      wrapper.find('input[data-test-subj="checkbox-1"]').prop('checked'),
    ).toBe(true);
    expect(
      wrapper.find('input[data-test-subj="checkbox-2"]').prop('checked'),
    ).toBe(true);

    await act(async () => {
      wrapper
        .find('button[data-test-subj="applyChangesButton"]')
        .simulate('click');
    });
    await waitForApplyText(wrapper, '1 failed');

    expect(
      wrapper.find('input[data-test-subj="checkbox-1"]').prop('checked'),
    ).toBe(false);
    expect(
      wrapper.find('input[data-test-subj="checkbox-2"]').prop('checked'),
    ).toBe(true);
    wrapper.unmount();
  });

  it('does not falsely suppress or force the "group left with no agents" warning based on a stale memberTotal after a partial apply', async () => {
    // Both agents are members (memberTotal 2). Stage both for removal;
    // agent 1 succeeds, agent 2 fails. The mock keeps memberTotal static
    // at 2 through the apply to model useGroupMemberIds not having
    // refetched yet.
    (useGroupMemberIds as jest.Mock).mockReturnValue({
      memberIds: new Set(['1', '2']),
      memberTotal: 2,
      isLoading: false,
    });
    (removeAgentsFromGroupService as jest.Mock).mockResolvedValue({
      data: {
        data: {
          affected_items: ['1'],
          failed_items: [{ error: { code: 1, message: 'boom' }, id: ['2'] }],
          total_failed_items: 1,
        },
      },
    });

    const wrapper = mount(
      <ManageAgents
        currentGroup={{ name: 'group1' }}
        cancelButton={jest.fn()}
      />,
    );

    await act(async () => {
      wrapper.find('input[data-test-subj="checkbox-1"]').simulate('change');
    });
    await act(async () => {
      wrapper.find('input[data-test-subj="checkbox-2"]').simulate('change');
    });
    await act(async () => {
      wrapper
        .find('button[data-test-subj="applyChangesButton"]')
        .simulate('click');
    });
    await waitForApplyText(wrapper, '1 failed');

    // Stale memberTotal (2): only agent 2 remains staged (1 of 2), so no
    // warning yet, even though the group's real total is already 1.
    expect(wrapper.text()).not.toContain('leave this group with no agents');

    // Once the hook reports the real current total (1), the same staged
    // state must immediately reflect the correct warning.
    (useGroupMemberIds as jest.Mock).mockReturnValue({
      memberIds: new Set(['2']),
      memberTotal: 1,
      isLoading: false,
    });
    await act(async () => {
      wrapper.setProps({});
    });
    wrapper.update();

    expect(wrapper.text()).toContain('leave this group with no agents');
    wrapper.unmount();
  });

  it('disables every row checkbox while group membership is still loading', () => {
    (useGroupMemberIds as jest.Mock).mockReturnValue({
      memberIds: new Set(),
      memberTotal: 0,
      isLoading: true,
    });

    const wrapper = mount(
      <ManageAgents
        currentGroup={{ name: 'group1' }}
        cancelButton={jest.fn()}
      />,
    );

    expect(
      wrapper.find('input[data-test-subj="checkbox-1"]').prop('disabled'),
    ).toBe(true);
    expect(wrapper.text()).toContain('Nothing staged yet');
    wrapper.unmount();
  });

  it('toggling "Show only members" filters the table down to real members via the same q=group=<name> filter', () => {
    const wrapper = mount(
      <ManageAgents
        currentGroup={{ name: 'group1' }}
        cancelButton={jest.fn()}
      />,
    );

    expect(wrapper.text()).toContain('All agents (2)');
    expect(wrapper.find('input[data-test-subj="checkbox-1"]').length).toBe(1);
    expect(wrapper.find('input[data-test-subj="checkbox-2"]').length).toBe(1);
    expect(wrapper.find('TableWzAPI').prop('filters')).toEqual({});

    act(() => {
      wrapper
        .find('button[data-test-subj="showMembersOnlySwitch"]')
        .simulate('click');
    });
    wrapper.update();

    expect(wrapper.text()).toContain('Members (1)');
    // Agent 1 (not a member) drops out of view; agent 2 (member) stays.
    expect(wrapper.find('input[data-test-subj="checkbox-1"]').length).toBe(0);
    expect(wrapper.find('input[data-test-subj="checkbox-2"]').length).toBe(1);
    expect(wrapper.find('TableWzAPI').prop('filters')).toEqual({
      q: 'group=group1',
    });

    act(() => {
      wrapper
        .find('button[data-test-subj="showMembersOnlySwitch"]')
        .simulate('click');
    });
    wrapper.update();

    expect(wrapper.text()).toContain('All agents (2)');
    expect(wrapper.find('input[data-test-subj="checkbox-1"]').length).toBe(1);
    wrapper.unmount();
  });

  it('omits the Membership column while filtered to members only, since every visible row is already a member', () => {
    const wrapper = mount(
      <ManageAgents
        currentGroup={{ name: 'group1' }}
        cancelButton={jest.fn()}
      />,
    );

    const columnsBefore = wrapper.find('TableWzAPI').prop('tableColumns') as {
      field: string;
    }[];
    expect(columnsBefore.some(c => c.field === '_membership')).toBe(true);

    act(() => {
      wrapper
        .find('button[data-test-subj="showMembersOnlySwitch"]')
        .simulate('click');
    });
    wrapper.update();

    const columnsAfter = wrapper.find('TableWzAPI').prop('tableColumns') as {
      field: string;
    }[];
    expect(columnsAfter.some(c => c.field === '_membership')).toBe(false);
    wrapper.unmount();
  });

  it('keeps a staged entry alive while its row is filtered out of view by the members-only toggle, and re-shows it checked when toggled back', () => {
    const wrapper = mount(
      <ManageAgents
        currentGroup={{ name: 'group1' }}
        cancelButton={jest.fn()}
      />,
    );

    // Stage agent 1 (a non-member) for add while showing all agents.
    act(() => {
      wrapper.find('input[data-test-subj="checkbox-1"]').simulate('change');
    });
    wrapper.update();
    expect(wrapper.text()).toContain('Adding 1');

    // Switch to members-only: agent 1's row disappears from the table,
    // but the staged 'add' entry itself must survive in the panel.
    act(() => {
      wrapper
        .find('button[data-test-subj="showMembersOnlySwitch"]')
        .simulate('click');
    });
    wrapper.update();
    expect(wrapper.find('input[data-test-subj="checkbox-1"]').length).toBe(0);
    expect(wrapper.text()).toContain('Adding 1');

    // Switch back: agent 1 reappears, still checked.
    act(() => {
      wrapper
        .find('button[data-test-subj="showMembersOnlySwitch"]')
        .simulate('click');
    });
    wrapper.update();
    expect(
      wrapper.find('input[data-test-subj="checkbox-1"]').prop('checked'),
    ).toBe(true);
    wrapper.unmount();
  });

  it('renders an empty state with no error when the members-only filter matches zero agents', () => {
    // The mock filters `mockAgents` by the constant `mockMemberIds`, not
    // by useGroupMemberIds, so an empty member set needs its own fixture.
    mockAgents = [];
    (useGroupMemberIds as jest.Mock).mockReturnValue({
      memberIds: new Set(),
      memberTotal: 0,
      isLoading: false,
    });

    const wrapper = mount(
      <ManageAgents
        currentGroup={{ name: 'group1' }}
        cancelButton={jest.fn()}
      />,
    );

    act(() => {
      wrapper
        .find('button[data-test-subj="showMembersOnlySwitch"]')
        .simulate('click');
    });
    wrapper.update();

    expect(wrapper.text()).toContain('Members (0)');
    expect(wrapper.text()).toContain('No items found');
    wrapper.unmount();
  });
});

describe('manage-agents searchBarWQL', () => {
  beforeEach(() => {
    (WzRequest.apiReq as jest.Mock).mockReset();
  });

  it('declares a field suggestion for every searchable column, so WQL validation never hits an undefined suggestions.field', () => {
    // wql.tsx's run() calls suggestions.field() unconditionally to
    // validate any field name the user types; a column added to
    // manageAgentsColumns() with searchable:true but no matching entry
    // here throws instead of failing validation gracefully.
    const searchableFields = manageAgentsColumns()
      .filter(c => c.searchable)
      .map(c => c.field);
    const declaredFields = searchBarWQL.suggestions.field().map(s => s.label);

    searchableFields.forEach(field => {
      expect(declaredFields).toContain(field);
    });
  });

  it('resolves status value suggestions locally, with no server request', async () => {
    const result = await searchBarWQL.suggestions.value('', {
      field: 'status',
    });
    expect(result.length).toBeGreaterThan(0);
    expect(WzRequest.apiReq).not.toHaveBeenCalled();
  });

  it('flattens and dedupes group value suggestions from /agents', async () => {
    (WzRequest.apiReq as jest.Mock).mockResolvedValue({
      data: {
        data: {
          affected_items: [
            { group: ['mock-alpha', 'default'] },
            { group: ['mock-alpha'] },
          ],
        },
      },
    });

    const result = await searchBarWQL.suggestions.value('', {
      field: 'group',
    });

    expect(WzRequest.apiReq).toHaveBeenCalledWith(
      'GET',
      '/agents',
      expect.objectContaining({
        params: expect.objectContaining({ select: 'group' }),
      }),
    );
    expect(result).toEqual([{ label: 'default' }, { label: 'mock-alpha' }]);
  });

  it('resolves id/name value suggestions from the matching /agents field', async () => {
    (WzRequest.apiReq as jest.Mock).mockResolvedValue({
      data: { data: { affected_items: [{ name: 'a1' }, { name: 'a2' }] } },
    });

    const result = await searchBarWQL.suggestions.value('a', {
      field: 'name',
    });

    expect(WzRequest.apiReq).toHaveBeenCalledWith(
      'GET',
      '/agents',
      expect.objectContaining({
        params: expect.objectContaining({ select: 'name', q: 'name~a' }),
      }),
    );
    expect(result).toEqual([{ label: 'a1' }, { label: 'a2' }]);
  });
});
