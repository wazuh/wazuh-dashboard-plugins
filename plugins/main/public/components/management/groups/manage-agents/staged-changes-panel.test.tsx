import React from 'react';
import { mount } from 'enzyme';
import { StagedChangesPanel } from './staged-changes-panel';

describe('StagedChangesPanel', () => {
  it('shows a placeholder and disables both buttons when nothing is staged', () => {
    const wrapper = mount(
      <StagedChangesPanel
        adds={[]}
        removes={[]}
        memberTotal={0}
        onUnstage={jest.fn()}
        onDiscardAll={jest.fn()}
        onApply={jest.fn()}
      />,
    );

    expect(wrapper.text()).toContain('Nothing staged yet');
    expect(
      wrapper
        .find('button[data-test-subj="discardAllButton"]')
        .prop('disabled'),
    ).toBe(true);
    expect(
      wrapper
        .find('button[data-test-subj="applyChangesButton"]')
        .prop('disabled'),
    ).toBe(true);
  });

  it('lists staged adds and removes individually, each with its own unstage control', () => {
    const onUnstage = jest.fn();
    const wrapper = mount(
      <StagedChangesPanel
        adds={[{ id: '014', name: 'srv-web-014.corp' }]}
        removes={[{ id: '001', name: 'wazuh.agent.deb.local' }]}
        memberTotal={5}
        onUnstage={onUnstage}
        onDiscardAll={jest.fn()}
        onApply={jest.fn()}
      />,
    );

    expect(wrapper.text()).toContain('Adding 1');
    expect(wrapper.text()).toContain('srv-web-014.corp');
    expect(wrapper.text()).toContain('Removing 1');
    expect(wrapper.text()).toContain('wazuh.agent.deb.local');
    expect(wrapper.text()).not.toContain('leave this group with no agents');

    wrapper.find('button[data-test-subj="unstage-014"]').simulate('click');
    expect(onUnstage).toHaveBeenCalledWith('014');
  });

  it('warns when every current member of the group is staged for removal', () => {
    const wrapper = mount(
      <StagedChangesPanel
        adds={[]}
        removes={[
          { id: '001', name: 'wazuh.agent.deb.local' },
          { id: '002', name: 'wazuh.agent.rpm.local' },
        ]}
        memberTotal={2}
        onUnstage={jest.fn()}
        onDiscardAll={jest.fn()}
        onApply={jest.fn()}
      />,
    );

    expect(wrapper.text()).toContain(
      'Applying these changes will leave this group with no agents.',
    );
  });

  it('does not warn when memberTotal is 0 (e.g. still loading), even with removes staged', () => {
    const wrapper = mount(
      <StagedChangesPanel
        adds={[]}
        removes={[{ id: '001', name: 'wazuh.agent.deb.local' }]}
        memberTotal={0}
        onUnstage={jest.fn()}
        onDiscardAll={jest.fn()}
        onApply={jest.fn()}
      />,
    );

    expect(wrapper.text()).not.toContain('leave this group with no agents');
  });

  it('warns exactly at the boundary where removes equal memberTotal, not before', () => {
    const props = (removeCount: number, memberTotal: number) => ({
      adds: [],
      removes: Array.from({ length: removeCount }, (_, i) => ({
        id: `${i}`,
        name: `agent-${i}`,
      })),
      memberTotal,
      onUnstage: jest.fn(),
      onDiscardAll: jest.fn(),
      onApply: jest.fn(),
    });

    // 2 of 3 members staged: the group still has 1 left, no warning.
    const under = mount(<StagedChangesPanel {...props(2, 3)} />);
    expect(under.text()).not.toContain('leave this group with no agents');

    // 3 of 3 members staged: the group would be emptied, warning shown.
    const exact = mount(<StagedChangesPanel {...props(3, 3)} />);
    expect(exact.text()).toContain('leave this group with no agents');
  });

  it('does not warn when staged adds offset all staged removes', () => {
    // 14 of 14 members staged for removal, but 1 add in the same batch:
    // the group ends up with 1 agent, not 0.
    const wrapper = mount(
      <StagedChangesPanel
        adds={[{ id: '099', name: 'new-agent' }]}
        removes={Array.from({ length: 14 }, (_, i) => ({
          id: `${i}`,
          name: `agent-${i}`,
        }))}
        memberTotal={14}
        onUnstage={jest.fn()}
        onDiscardAll={jest.fn()}
        onApply={jest.fn()}
      />,
    );

    expect(wrapper.text()).not.toContain('leave this group with no agents');
  });

  it('re-evaluates the warning purely from the latest memberTotal prop on every render (no internal caching)', () => {
    const removes = [
      { id: '001', name: 'a' },
      { id: '002', name: 'b' },
    ];
    const baseProps = {
      adds: [],
      removes,
      onUnstage: jest.fn(),
      onDiscardAll: jest.fn(),
      onApply: jest.fn(),
    };

    // Stale total (hasn't caught up with 3 already-successful removals
    // elsewhere in the group): 5 members "on paper", 2 staged — no warning
    // even though the group's real current total is only 2.
    const wrapper = mount(
      <StagedChangesPanel {...baseProps} memberTotal={5} />,
    );
    expect(wrapper.text()).not.toContain('leave this group with no agents');

    // Once the hook's refetch resolves and memberTotal prop updates to the
    // real current total (2), the same `removes` now correctly warns.
    wrapper.setProps({ memberTotal: 2 });
    expect(wrapper.text()).toContain('leave this group with no agents');
  });

  it('enables Apply with the total staged count and calls onApply', () => {
    const onApply = jest.fn();
    const wrapper = mount(
      <StagedChangesPanel
        adds={[
          { id: '014', name: 'a' },
          { id: '027', name: 'b' },
        ]}
        removes={[{ id: '001', name: 'c' }]}
        memberTotal={5}
        onUnstage={jest.fn()}
        onDiscardAll={jest.fn()}
        onApply={onApply}
      />,
    );

    const applyButton = wrapper.find(
      'button[data-test-subj="applyChangesButton"]',
    );
    expect(applyButton.prop('disabled')).toBe(false);
    expect(applyButton.text()).toContain('3');

    applyButton.simulate('click');
    expect(onApply).toHaveBeenCalled();
  });

  it('calls onDiscardAll when Discard all is clicked', () => {
    const onDiscardAll = jest.fn();
    const wrapper = mount(
      <StagedChangesPanel
        adds={[{ id: '014', name: 'a' }]}
        removes={[]}
        memberTotal={0}
        onUnstage={jest.fn()}
        onDiscardAll={onDiscardAll}
        onApply={jest.fn()}
      />,
    );

    wrapper.find('button[data-test-subj="discardAllButton"]').simulate('click');
    expect(onDiscardAll).toHaveBeenCalled();
  });
});
