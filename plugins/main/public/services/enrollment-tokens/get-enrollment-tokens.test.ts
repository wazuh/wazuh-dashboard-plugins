/* eslint-disable camelcase -- the Wazuh Server API listing is snake_case */
import { getEnrollmentTokens } from './get-enrollment-tokens';
import { ENROLLMENT_TOKENS_ENDPOINT } from './constants';
import { WzRequest } from '../../react-services/wz-request';

jest.mock('../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

const apiReq = WzRequest.apiReq as jest.Mock;

describe('getEnrollmentTokens', () => {
  beforeEach(() => {
    apiReq.mockReset();
  });

  it('returns the listed tokens and how many there are in total', async () => {
    const token = {
      id: 'AAECAwQFBgcICQoLDA0ODw',
      address: 'manager.example.com',
      created: '2026-09-08T17:12:40+00:00',
      expires: '2026-09-09T05:12:40+00:00',
      max_uses: 50,
      uses: 3,
      revoked: false,
      credential: true,
      description: 'Web tier rollout',
    };

    apiReq.mockResolvedValue({
      data: { data: { affected_items: [token], total_affected_items: 1 } },
    });

    await expect(getEnrollmentTokens()).resolves.toEqual({
      tokens: [token],
      total: 1,
    });
  });

  it('asks for the page and the order the table is on', async () => {
    apiReq.mockResolvedValue({ data: { data: {} } });

    await getEnrollmentTokens(20, 10, '-created');

    expect(apiReq).toHaveBeenCalledWith('GET', ENROLLMENT_TOKENS_ENDPOINT, {
      params: { offset: 20, limit: 10, sort: '-created' },
    });
  });

  it('leaves the sort out when the table has none', async () => {
    apiReq.mockResolvedValue({ data: { data: {} } });

    await getEnrollmentTokens(0, 10);

    expect(apiReq).toHaveBeenCalledWith('GET', ENROLLMENT_TOKENS_ENDPOINT, {
      params: { offset: 0, limit: 10 },
    });
  });

  it('reads an answer carrying no items as an empty listing', async () => {
    apiReq.mockResolvedValue({ data: { data: {} } });

    await expect(getEnrollmentTokens()).resolves.toEqual({
      tokens: [],
      total: 0,
    });
  });
});
