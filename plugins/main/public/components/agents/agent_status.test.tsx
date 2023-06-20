import React from 'react';
import { mount } from 'enzyme';
import { AgentStatus } from './agent_status';
import { API_NAME_AGENT_STATUS, UI_COLOR_AGENT_STATUS, UI_LABEL_NAME_AGENT_STATUS, UI_ORDER_AGENT_STATUS } from '../../../common/constants';

describe('AgentStatus component', () => {
  test.each(UI_ORDER_AGENT_STATUS.map(status => ({ status, color: UI_COLOR_AGENT_STATUS[status], label: UI_LABEL_NAME_AGENT_STATUS[status] })))('Renders status indicator with the its color and the label in lower case - %j', (input) => {
    const wrapper = mount(<AgentStatus status={input.status} />);
    expect(wrapper.find('svg').prop('style')).toHaveProperty('color', input.color);
    expect(wrapper.find('.euiFlexGroup > span.euiFlexItem.euiFlexItem--flexGrowZero').text()).toEqual(input.label.toLowerCase())
  });

  it(`Renders status indicator with the its color and a custom label - status: ${API_NAME_AGENT_STATUS.ACTIVE}`, () => {
    const label = 'custom_agent';
    const wrapper = mount(<AgentStatus status={API_NAME_AGENT_STATUS.ACTIVE}>{label}</AgentStatus>);
    expect(wrapper.find('svg').prop('style')).toHaveProperty('color', UI_COLOR_AGENT_STATUS[API_NAME_AGENT_STATUS.ACTIVE]);
    expect(wrapper.find('.euiFlexGroup > span.euiFlexItem.euiFlexItem--flexGrowZero').text()).toEqual(label);
  });
});
