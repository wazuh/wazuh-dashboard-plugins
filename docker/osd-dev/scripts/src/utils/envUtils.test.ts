import { toRepositoryEnvVar, applyEnvironmentVariables, envOrDefault } from './envUtils';

describe('utils/envUtils', () => {
  it('toRepositoryEnvVar normalizes repo names', () => {
    expect(toRepositoryEnvVar('main')).toBe('REPO_MAIN');
    expect(toRepositoryEnvVar('wazuh-core')).toBe('REPO_WAZUH_CORE');
    expect(toRepositoryEnvVar('plugin.with.dots')).toBe('REPO_PLUGIN_WITH_DOTS');
  });

  it('applyEnvironmentVariables sets process.env entries', () => {
    const before = process.env.TEST_ENV_ABC;
    applyEnvironmentVariables(new Map<string, string>([[
      'TEST_ENV_ABC',
      'value',
    ]]));
    expect(process.env.TEST_ENV_ABC).toBe('value');
    if (before !== undefined) {
      process.env.TEST_ENV_ABC = before;
    } else {
      delete process.env.TEST_ENV_ABC;
    }
  });

  it('envOrDefault returns fallback when unset', () => {
    delete (process.env as Record<string, string | undefined>)['MAYBE_SET'];
    expect(envOrDefault('MAYBE_SET', 'fallback')).toBe('fallback');
    process.env.MAYBE_SET = 'present';
    expect(envOrDefault('MAYBE_SET', 'fallback')).toBe('present');
  });
});

