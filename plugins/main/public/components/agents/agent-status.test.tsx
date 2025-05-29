import React from 'react';
import { render } from 'enzyme';
import { AgentStatus } from './agent-status';
import {
  UI_COLOR_AGENT_STATUS,
  UI_LABEL_NAME_AGENT_STATUS,
  UI_ORDER_AGENT_STATUS,
} from '../../../common/constants';

describe('AgentStatus component', () => {
  test.each(
    UI_ORDER_AGENT_STATUS.map((status, index) => ({
      status,
      color: UI_COLOR_AGENT_STATUS[status],
      label: UI_LABEL_NAME_AGENT_STATUS[status],
      agent: { status_code: index },
    })),
  )(
    'Renders status indicator with the its color and the label in lower case - %j',
    input => {
      const wrapper = render(
        <AgentStatus status={input.status} agent={input.agent} />,
      );

      expect(wrapper).toMatchSnapshot();
      expect(wrapper.find('span').eq(1).attr()).toHaveProperty(
        'color',
        input.color,
      );
      expect(wrapper.find('.hide-agent-status').text()).toEqual(
        input.label.toLowerCase(),
      );
    },
  );
});
