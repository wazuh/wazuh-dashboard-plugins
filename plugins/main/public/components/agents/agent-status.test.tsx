import React from 'react';
import { render } from 'enzyme';
import { fireEvent, render as rtlRender, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentStatus } from './agent-status';
import {
  UI_COLOR_AGENT_STATUS,
  UI_DESCRIPTION_AGENT_STATUS,
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
      expect(wrapper.find('[data-euiicon-type="dot"]').attr()).toHaveProperty(
        'color',
        input.color,
      );
      expect(wrapper.find('.hide-agent-status').text()).toEqual(
        input.label.toLowerCase(),
      );
    },
  );

  test.each(UI_ORDER_AGENT_STATUS)(
    'Explains the %s status in the focusable info tip',
    async status => {
      rtlRender(<AgentStatus status={status} agent={{ status_code: 3 }} />);

      fireEvent.focus(screen.getByLabelText('Description'));
      expect(
        await screen.findByText(UI_DESCRIPTION_AGENT_STATUS[status]),
      ).toBeInTheDocument();
      const lastChange = screen.queryByText(
        'Last change: Shutdown message received',
      );
      if (status === 'never_connected') {
        expect(lastChange).toBeNull();
      } else {
        expect(lastChange).toBeInTheDocument();
      }
    },
  );
});
