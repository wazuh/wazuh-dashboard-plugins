import React from 'react';
import { render, act } from '@testing-library/react';
import { AgentStats } from './agent-stats';
import { queryDataTestAttr } from '../../../../test/public/query-attr';
import { CSS } from '../../../../test/utils/CSS';

jest.mock('../../../react-services', () => ({
  WzRequest: {
    apiReq: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('AgentStats', () => {
  it('should not render agent info ribbon', async () => {
    await act(async () => {
      const { container } = render(<AgentStats agent={{ id: '000' }} />);

      const agentInfoRibbon = container.querySelector(
        queryDataTestAttr('agent-info'),
      );
      expect(agentInfoRibbon).toBeFalsy();
    });
  });

  it('should render stats info ribbon', async () => {
    await act(async () => {
      const { container } = render(<AgentStats agent={{ id: '000' }} />);

      expect(
        container.querySelector(queryDataTestAttr('ribbon-item-status')),
      ).toBeTruthy();

      expect(
        container.querySelector(
          queryDataTestAttr('ribbon-item-buffer_enabled'),
        ),
      ).toBeTruthy();

      expect(
        container.querySelector(queryDataTestAttr('ribbon-item-msg_buffer')),
      ).toBeTruthy();

      expect(
        container.querySelector(queryDataTestAttr('ribbon-item-msg_count')),
      ).toBeTruthy();

      expect(
        container.querySelector(queryDataTestAttr('ribbon-item-msg_sent')),
      ).toBeTruthy();

      expect(
        container.querySelector(queryDataTestAttr('ribbon-item-last_ack')),
      ).toBeTruthy();

      expect(
        container.querySelector(
          queryDataTestAttr('ribbon-item-last_keepalive'),
        ),
      ).toBeTruthy();

      expect(
        container.querySelectorAll(
          queryDataTestAttr('ribbon-item-', CSS.Attribute.Substring),
        ).length,
      ).toHaveLength(7);
    });
  });
});
