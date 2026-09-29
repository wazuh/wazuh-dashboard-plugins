import React from 'react';
import { mount } from 'enzyme';
import { ApplyResultView } from './apply-result';

describe('ApplyResultView', () => {
  it('shows a dismissible banner with the caller-composed title and the failed ids/reasons inline, with no click needed', () => {
    const onDismiss = jest.fn();
    const wrapper = mount(
      <ApplyResultView
        status='complete'
        title='Applied 1 of 3 changes — 2 failed, see below'
        hasFailures
        errorAgents={[{ error: { code: 1, message: 'boom' }, id: ['2', '3'] }]}
        onDismiss={onDismiss}
      />,
    );

    expect(wrapper.text()).toContain('Applied 1 of 3 changes');
    expect(wrapper.text()).toContain('boom');
    expect(wrapper.text()).toContain('2, 3');

    wrapper
      .find('button[data-test-subj="applyResultDismiss"]')
      .simulate('click');
    expect(onDismiss).toHaveBeenCalled();
  });

  it('does not paginate the failures table — the API groups every failed agent under one message per reason', () => {
    const wrapper = mount(
      <ApplyResultView
        status='complete'
        title='Applied 0 of 2 changes — 2 failed, see below'
        hasFailures
        errorAgents={[
          {
            error: {
              code: 1745,
              message:
                "Agent only belongs to 'default' and it cannot be unassigned from this group.",
            },
            id: ['001', '002'],
          },
        ]}
        onDismiss={jest.fn()}
      />,
    );

    expect(wrapper.text()).toContain('001, 002');
    expect(wrapper.find('.euiPagination').length).toBe(0);
    expect(wrapper.text()).not.toContain('Rows per page');
  });

  it('does not render the failures table on an all-success result', () => {
    const wrapper = mount(
      <ApplyResultView
        status='complete'
        title='Applied 2 of 2 changes'
        hasFailures={false}
        onDismiss={jest.fn()}
      />,
    );

    expect(wrapper.text()).toContain('Applied 2 of 2 changes');
    expect(wrapper.find('.euiInMemoryTable').length).toBe(0);
  });

  it('renders a non-dismissible loading indicator while the request is in flight', () => {
    const onDismiss = jest.fn();
    const wrapper = mount(
      <ApplyResultView
        status='loading'
        title=''
        hasFailures={false}
        onDismiss={onDismiss}
      />,
    );

    expect(
      wrapper.find('button[data-test-subj="applyResultDismiss"]').length,
    ).toBe(0);
  });
});
