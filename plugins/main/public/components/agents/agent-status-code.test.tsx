import React from 'react';
import { render } from 'enzyme';
import { AgentStatusCode } from './agent-status-code';
import { AGENT_STATUS_CODE } from '../../../common/constants';

interface StatusCodeAgent {
  STATUS_CODE: number;
  COLOR: string;
  STATUS_DESCRIPTION: string;
}

describe('AgentStatus component', () => {
  test.each(
    AGENT_STATUS_CODE.map(statusCode => ({
      STATUS_CODE: statusCode.STATUS_CODE,
      COLOR: statusCode.COLOR,
      STATUS_DESCRIPTION: statusCode.STATUS_DESCRIPTION,
    })),
  )(
    'Renders status code indicator with the its color and the text - %j',
    (input: StatusCodeAgent) => {
      const wrapper = render(
        <AgentStatusCode statusCode={input.STATUS_CODE} />,
      );

      expect(wrapper).toMatchSnapshot();
      expect(wrapper.find('svg').prop('class')).toContain(
        `euiIcon--${input.COLOR}`,
      );
      expect(wrapper[1].children[0].data).toEqual(input.STATUS_DESCRIPTION);
    },
  );
});
