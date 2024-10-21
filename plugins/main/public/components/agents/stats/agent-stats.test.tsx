import React from 'react';
import { render } from 'enzyme';
import { AgentStats } from './agent-stats';

const AGENT = {
  id: '10101',
};

describe('AgentStats', () => {
  it('should render agent info', () => {
    const wrapper = render(<AgentStats agent={AGENT} />);

    const agentInfo = wrapper.find('[data-test-subj="agent-info"]').html();

    expect(agentInfo).toBeTruthy();
  });
});
