import React from 'react';
import { render } from 'enzyme';
import { AgentStats } from './agent-stats';
import { queryDataTestAttr } from '../../../../test/public/query-attr';

const AGENT = {
  id: '10101',
};

describe('AgentStats', () => {
  it('should render agent info', () => {
    const { container } = render(<AgentStats agent={AGENT} />);

    expect(
      container.querySelector(queryDataTestAttr('agent-info')),
    ).toBeTruthy();
  });
});
