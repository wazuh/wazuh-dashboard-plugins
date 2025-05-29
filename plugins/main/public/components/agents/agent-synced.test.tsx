import React from 'react';
import { render } from 'enzyme';
import { AGENT_SYNCED_STATUS } from '../../../common/constants';
import { AgentSynced } from './agent-synced';

describe('AgentStatus component', () => {
  test('Should render well when the state is synced', () => {
    const wrapper = render(<AgentSynced synced={AGENT_SYNCED_STATUS.SYNCED} />);

    expect(wrapper).toMatchSnapshot();
    expect(wrapper.find('span').attr('color')).toContain('success');
    expect(wrapper[1].children[0].data).toEqual(AGENT_SYNCED_STATUS.SYNCED);
  });

  test('should render well when the state is not synced', () => {
    const wrapper = render(
      <AgentSynced synced={AGENT_SYNCED_STATUS.NOT_SYNCED} />,
    );

    expect(wrapper).toMatchSnapshot();
    expect(wrapper.find('span').attr('color')).toContain('subdued');
    expect(wrapper[1].children[0].data).toEqual(AGENT_SYNCED_STATUS.NOT_SYNCED);
  });
});
