import { getDockerListener } from './use-docker-listener';

const report = (content: Record<string, unknown>) => ({
  content,
  modules: Object.keys(content),
});

describe('getDockerListener', () => {
  it('is not reported when the agent has no report', () => {
    expect(getDockerListener(null)).toEqual({ status: 'not-reported' });
  });

  it.each([[{ fim: {} }], [{ docker: { disabled: 'no' } }]])(
    'is not configured without a docker-listener section',
    content => {
      expect(getDockerListener(report(content))).toEqual({
        status: 'not-configured',
      });
    },
  );

  it('is enabled when the docker-listener section is not disabled', () => {
    expect(
      getDockerListener(
        report({
          'docker-listener': {
            disabled: 'no',
            interval: 60,
            // eslint-disable-next-line camelcase -- field name as the agent reports it
            run_on_start: 'yes',
            attempts: 5,
          },
        }),
      ),
    ).toEqual({ status: 'enabled' });
  });

  it('is disabled when the docker-listener section is turned off', () => {
    expect(
      getDockerListener(report({ 'docker-listener': { disabled: 'yes' } })),
    ).toEqual({ status: 'disabled' });
  });
});
