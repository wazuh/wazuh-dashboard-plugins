import React from 'react';
import { render } from '@testing-library/react';

const AGENT_000 = '000';
const AGENT_001 = '001';

export function shouldRenderTableWithCorrectEndpointForAgent(
  mocked: jest.Mock,
  Component: React.ComponentType<{
    agent: { id: string };
    soPlatform?: string;
  }>,
  endpoint: string,
  soPlatform: string = 'linux',
) {
  const { rerender } = render(
    <Component agent={{ id: AGENT_000 }} soPlatform={soPlatform} />,
  );

  expect(mocked.mock.calls[0][0].endpoint).toContain(
    `/syscollector/${AGENT_000}/${endpoint}`,
  );

  mocked.mockClear();

  rerender(<Component agent={{ id: AGENT_001 }} soPlatform={soPlatform} />);

  expect(mocked.mock.calls[0][0].endpoint).toContain(
    `/syscollector/${AGENT_001}/${endpoint}`,
  );
}

export function shouldFetchDataForGivenAgentId(
  mocked: jest.Mock,
  Component: React.ComponentType<{
    agent: { id: string };
    soPlatform?: string;
  }>,
  endpoint: string,
  soPlatform: string = 'linux',
) {
  const { rerender } = render(
    <Component agent={{ id: AGENT_000 }} soPlatform={soPlatform} />,
  );

  expect(mocked.mock.calls[0][0]).toEqual('GET');
  expect(mocked.mock.calls[0][1]).toEqual(
    `/syscollector/${AGENT_000}/${endpoint}`,
  );

  mocked.mockClear();

  rerender(<Component agent={{ id: AGENT_001 }} soPlatform={soPlatform} />);

  expect(mocked.mock.calls[0][0]).toEqual('GET');
  expect(mocked.mock.calls[0][1]).toEqual(
    `/syscollector/${AGENT_001}/${endpoint}`,
  );
}
