/* eslint-disable camelcase -- Wazuh Server API response fixtures use snake_case */
import * as RegisterAgentService from './register-agent-services';

jest.mock('../../../../react-services', () => ({
  ...(jest.requireActual('../../../../react-services') as object),
  WzRequest: () => ({
    apiReq: jest.fn(),
  }),
}));

describe('resolveRegistrationPassword', () => {
  it('reads a native boolean as the server reports it since 5.0.0', () => {
    expect(
      RegisterAgentService.resolveRegistrationPassword({
        auth: { use_password: true },
        'authd.pass': 'a-password',
      }),
    ).toEqual({ needsPassword: true, password: 'a-password' });
  });

  it('keeps reading the legacy yes/no dialect', () => {
    expect(
      RegisterAgentService.resolveRegistrationPassword({
        auth: { use_password: 'yes' },
        'authd.pass': 'a-password',
      }),
    ).toEqual({ needsPassword: true, password: 'a-password' });
  });

  it('needs no password when the server says so in either dialect', () => {
    expect(
      RegisterAgentService.resolveRegistrationPassword({
        auth: { use_password: false },
        'authd.pass': 'a-password',
      }),
    ).toEqual({ needsPassword: false, password: '' });
    expect(
      RegisterAgentService.resolveRegistrationPassword({
        auth: { use_password: 'no' },
      }),
    ).toEqual({ needsPassword: false, password: '' });
  });

  it('still needs a password when the configuration does not expose it', () => {
    expect(
      RegisterAgentService.resolveRegistrationPassword({
        auth: { use_password: true },
      }),
    ).toEqual({ needsPassword: true, password: '' });
  });

  it('needs no password when the auth configuration could not be read', () => {
    expect(RegisterAgentService.resolveRegistrationPassword()).toEqual({
      needsPassword: false,
      password: '',
    });
    expect(RegisterAgentService.resolveRegistrationPassword({})).toEqual({
      needsPassword: false,
      password: '',
    });
  });
});

describe('parseRegisterAgentFormValues', () => {
  const osOptions = [
    {
      icon: '',
      title: 'LINUX',
      hr: true,
      architecture: ['DEB amd64'],
    },
  ] as any;

  const formValues = [
    { name: 'operatingSystemSelection', value: 'DEB amd64' },
    { name: 'serverAddress', value: '1.1.1.1' },
    { name: 'serverPort', value: '' },
    { name: 'serverPath', value: '' },
    { name: 'agentName', value: 'agent1' },
    { name: 'agentGroups', value: [] },
  ] as any;

  /* The switch and the CA path are ordinary optional parameters, so they reach
  the command generator through the same passthrough as the other fields. */
  it('forwards the SSL verification switch as a boolean', () => {
    const result = RegisterAgentService.parseRegisterAgentFormValues(
      [...formValues, { name: 'sslVerification', value: false }],
      osOptions,
    );
    expect(result.optionalParams.sslVerification).toBe(false);
  });

  it('forwards the manager CA path', () => {
    const result = RegisterAgentService.parseRegisterAgentFormValues(
      [
        ...formValues,
        { name: 'sslVerification', value: true },
        { name: 'managerCa', value: '/var/ossec/etc/manager-ca.pem' },
      ],
      osOptions,
    );
    expect(result.optionalParams.sslVerification).toBe(true);
    expect(result.optionalParams.managerCa).toBe(
      '/var/ossec/etc/manager-ca.pem',
    );
  });
});

describe('parseRegisterAgentFormValues - CA and verification interaction', () => {
  const osOptions = [
    {
      icon: '',
      title: 'LINUX',
      hr: true,
      architecture: ['DEB amd64'],
    },
  ] as any;

  const baseValues = [
    { name: 'operatingSystemSelection', value: 'DEB amd64' },
    { name: 'serverAddress', value: '1.1.1.1' },
    { name: 'serverPort', value: '' },
    { name: 'serverPath', value: '' },
    { name: 'agentName', value: '' },
    { name: 'agentGroups', value: [] },
  ] as any;

  /* Otherwise turning the switch off after typing a path would emit both
  SSL_VERIFICATION='none' and the CA, a command that supplies a CA and then
  refuses to use it. */
  it('drops the CA when verification is disabled', () => {
    const result = RegisterAgentService.parseRegisterAgentFormValues(
      [
        ...baseValues,
        { name: 'sslVerification', value: false },
        { name: 'managerCa', value: '/var/ossec/etc/manager-ca.pem' },
      ],
      osOptions,
    );
    expect(result.optionalParams.managerCa).toBe('');
  });

  it('keeps the CA when verification is enabled', () => {
    const result = RegisterAgentService.parseRegisterAgentFormValues(
      [
        ...baseValues,
        { name: 'sslVerification', value: true },
        { name: 'managerCa', value: '/var/ossec/etc/manager-ca.pem' },
      ],
      osOptions,
    );
    expect(result.optionalParams.managerCa).toBe(
      '/var/ossec/etc/manager-ca.pem',
    );
  });
});
