import { getAgentVersion } from './wz-agent';

describe('getAgentVersion', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['v4.14.5', { major: 4, minor: 14, patch: 5, raw: '4.14.5' }],
    ['5.0.0', { major: 5, minor: 0, patch: 0, raw: '5.0.0' }],
    ['Wazuh v5.1.2', { major: 5, minor: 1, patch: 2, raw: '5.1.2' }],
  ])('parses version %s', (input, expected) => {
    expect(getAgentVersion(input)).toEqual(expected);
  });
});
