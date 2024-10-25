import React from 'react';
import { render, act } from '@testing-library/react';
import { AgentStats } from './agent-stats';
import { queryDataTestAttr } from '../../../../test/public/query-attr';

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
});
