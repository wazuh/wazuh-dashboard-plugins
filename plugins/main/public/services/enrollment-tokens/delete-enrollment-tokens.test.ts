/* eslint-disable camelcase -- the Wazuh Server API responses are snake_case */
import {
  purgeEnrollmentTokens,
  revokeEnrollmentToken,
} from './delete-enrollment-tokens';
import { ENROLLMENT_TOKENS_ENDPOINT } from './constants';
import { WzRequest } from '../../react-services/wz-request';

jest.mock('../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

const apiReq = WzRequest.apiReq as jest.Mock;

describe('revokeEnrollmentToken', () => {
  beforeEach(() => {
    apiReq.mockReset();
  });

  it('revokes the token by its id and returns what was affected', async () => {
    apiReq.mockResolvedValue({
      data: {
        data: {
          affected_items: ['AAECAwQFBgcICQoLDA0ODw'],
          failed_items: [],
        },
      },
    });

    await expect(
      revokeEnrollmentToken('AAECAwQFBgcICQoLDA0ODw'),
    ).resolves.toEqual(['AAECAwQFBgcICQoLDA0ODw']);
    expect(apiReq).toHaveBeenCalledWith(
      'DELETE',
      `${ENROLLMENT_TOKENS_ENDPOINT}/AAECAwQFBgcICQoLDA0ODw`,
      {},
    );
  });

  /* The API answers a partial failure with a 200, so a token that was not
  revoked would otherwise be reported to the operator as revoked. */
  it('fails with the reason the API gave for a failed item', async () => {
    apiReq.mockResolvedValue({
      data: {
        data: {
          affected_items: [],
          failed_items: [{ error: { message: 'Token does not exist' } }],
        },
      },
    });

    await expect(revokeEnrollmentToken('missing')).rejects.toThrow(
      'Token does not exist',
    );
  });
});

describe('purgeEnrollmentTokens', () => {
  beforeEach(() => {
    apiReq.mockReset();
  });

  it('purges the dead tokens by default', async () => {
    apiReq.mockResolvedValue({ data: { data: { affected_items: [] } } });

    await purgeEnrollmentTokens();

    expect(apiReq).toHaveBeenCalledWith('DELETE', ENROLLMENT_TOKENS_ENDPOINT, {
      params: { status: 'dead' },
    });
  });

  it('purges every token when asked to', async () => {
    apiReq.mockResolvedValue({
      data: { data: { affected_items: ['9-hPuHF4TgWl2WBjPP0lqQ'] } },
    });

    await expect(purgeEnrollmentTokens('all')).resolves.toEqual([
      '9-hPuHF4TgWl2WBjPP0lqQ',
    ]);
    expect(apiReq).toHaveBeenCalledWith('DELETE', ENROLLMENT_TOKENS_ENDPOINT, {
      params: { status: 'all' },
    });
  });
});
