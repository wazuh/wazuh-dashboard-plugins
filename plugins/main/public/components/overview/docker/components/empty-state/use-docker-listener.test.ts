import { getDockerListener } from './use-docker-listener';

const report = (content: Record<string, unknown>) => ({
  content,
  modules: Object.keys(content),
});

describe('getDockerListener', () => {
  it('is not reported when the agent has no report', () => {
    expect(getDockerListener(null)).toEqual({ status: 'not-reported' });
  });

  it('is not configured when the report has no Docker section', () => {
    expect(getDockerListener(report({ fim: {} }))).toEqual({
      status: 'not-configured',
    });
  });

  it('is enabled when the Docker section is not disabled', () => {
    expect(getDockerListener(report({ docker: { disabled: 'no' } }))).toEqual({
      status: 'enabled',
    });
  });

  it.each([
    [{ 'docker-listener': { disabled: 'yes' } }],
    [{ docker: { 'docker-listener': { disabled: 'yes' } } }],
  ])('is disabled when the listener is turned off', content => {
    expect(getDockerListener(report(content))).toEqual({ status: 'disabled' });
  });
});
