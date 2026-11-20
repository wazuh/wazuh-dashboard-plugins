import React from 'react';
import { render } from 'enzyme';
import {
  fireEvent,
  render as rtlRender,
  screen,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentStatus } from './agent-status';
import { Agent } from '../endpoints-summary/types';
import { TAgentStatus } from '../../../common/services/wz_agent_status';
import {
  UI_COLOR_AGENT_STATUS,
  UI_DESCRIPTION_AGENT_STATUS,
  UI_LABEL_NAME_AGENT_STATUS,
  UI_ORDER_AGENT_STATUS,
} from '../../../common/constants';

jest.mock('../../react-services/time-service', () => ({
  formatUIDate: () => 'Jan 1, 2026 @ 10:00:00.000',
}));

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

  describe('Last seen in the info tip', () => {
    const lastKeepAlive = new Date(Date.now() - 12 * 60 * 1000).toISOString();

    test.each([
      ['disconnected', lastKeepAlive, true],
      ['disconnected', undefined, false],
      ['active', lastKeepAlive, false],
    ])(
      '%s with lastKeepAlive %s shows last seen: %s',
      async (status, date, shown) => {
        rtlRender(
          <AgentStatus
            status={status as any}
            agent={{ status_code: 3, lastKeepAlive: date } as any}
          />,
        );

        fireEvent.focus(screen.getByLabelText('Description'));
        await screen.findByText('Last change: Shutdown message received');
        const lastSeen = screen.queryByText('Last seen: 12 minutes ago');
        if (shown) {
          expect(lastSeen).toBeInTheDocument();
        } else {
          expect(lastSeen).toBeNull();
        }
      },
    );
  });

  describe('Last keep alive in the status tooltip', () => {
    const lastKeepAlive = new Date(Date.now() - 12 * 60 * 1000).toISOString();
    const lastKeepAliveValue = '12 minutes ago';
    // Status code 3 is a shutdown message, as the API reports it
    const buildAgent = (date?: string) => ({
      // eslint-disable-next-line camelcase
      status_code: 3,
      lastKeepAlive: date,
    });
    // The text of a tooltip line, whose value is split into a bold element
    const getTooltipLine = (value: string) =>
      screen.getByText(value, { selector: 'strong' }).closest('p')?.textContent;

    test.each([
      ['active', lastKeepAlive, true],
      ['disconnected', lastKeepAlive, true],
      ['active', undefined, false],
      ['never_connected', lastKeepAlive, false],
    ])('%s with lastKeepAlive %s shows it: %s', async (status, date, shown) => {
      rtlRender(
        <AgentStatus
          status={status as TAgentStatus}
          agent={buildAgent(date) as unknown as Agent}
          showLastKeepAlive
        />,
      );

      const label = UI_LABEL_NAME_AGENT_STATUS[status].toLowerCase();
      fireEvent.mouseOver(screen.getByText(label));
      await screen.findByText(label, { selector: 'strong' });
      expect(getTooltipLine(label)).toBe(`Connection status: ${label}`);
      if (shown) {
        expect(getTooltipLine(lastKeepAliveValue)).toBe(
          `Last keep alive: ${lastKeepAliveValue}`,
        );
        // The date goes on its own secondary line
        expect(screen.getByText('Jan 1, 2026 @ 10:00:00.000')).toHaveClass(
          'wz-agent-status-tooltip-date',
        );
      } else {
        expect(screen.queryByText(/Last keep alive/)).toBeNull();
        expect(screen.queryByText('Jan 1, 2026 @ 10:00:00.000')).toBeNull();
      }
    });

    test('does not repeat the last seen in the info tip', async () => {
      rtlRender(
        <AgentStatus
          status='disconnected'
          agent={buildAgent(lastKeepAlive) as unknown as Agent}
          showLastKeepAlive
        />,
      );

      fireEvent.focus(screen.getByLabelText('Description'));
      await screen.findByText('Last change: Shutdown message received');
      expect(screen.queryByText('Last seen: 12 minutes ago')).toBeNull();
    });

    test('is not shown without the showLastKeepAlive prop', async () => {
      rtlRender(
        <AgentStatus
          status='active'
          agent={buildAgent(lastKeepAlive) as unknown as Agent}
        />,
      );

      fireEvent.mouseOver(screen.getByText('active'));
      await waitFor(() =>
        expect(screen.getAllByText('active')).toHaveLength(2),
      );
      expect(screen.queryByText(/Connection status/)).toBeNull();
      expect(screen.queryByText(/Last keep alive/)).toBeNull();
    });
  });
});
