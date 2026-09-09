/* eslint-disable camelcase -- Wazuh Server API request bodies use snake_case */
import {
  buildEnrollmentTokenRequestBody,
  createEnrollmentToken,
  ENROLLMENT_TOKENS_ENDPOINT,
} from './enrollment-token-service';
import { WzRequest } from '../../../../react-services/wz-request';

jest.mock('../../../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

const apiReq = WzRequest.apiReq as jest.Mock;

describe('buildEnrollmentTokenRequestBody', () => {
  it('sends only the address when nothing else was filled', () => {
    expect(
      buildEnrollmentTokenRequestBody({ address: 'manager.example.com' }),
    ).toEqual({
      address: 'manager.example.com',
    });
  });

  it('omits the optionals left empty so the server applies its defaults', () => {
    expect(
      buildEnrollmentTokenRequestBody({
        address: 'manager.example.com',
        port: '',
        prefix: '  ',
        ttl: '',
        maxUses: '',
      }),
    ).toEqual({ address: 'manager.example.com' });
  });

  it('sends the port and the number of enrollments as integers', () => {
    expect(
      buildEnrollmentTokenRequestBody({
        address: 'manager.example.com',
        port: '1517',
        prefix: '/wazuh-manager',
        ttl: '12h',
        maxUses: '50',
      }),
    ).toEqual({
      address: 'manager.example.com',
      port: 1517,
      prefix: '/wazuh-manager',
      ttl: '12h',
      max_uses: 50,
    });
  });

  it('keeps a zero number of enrollments, which means unlimited', () => {
    expect(
      buildEnrollmentTokenRequestBody({
        address: 'manager.example.com',
        maxUses: '0',
      }),
    ).toEqual({ address: 'manager.example.com', max_uses: 0 });
  });
});

describe('createEnrollmentToken', () => {
  beforeEach(() => {
    apiReq.mockReset();
  });

  it('returns the minted token', async () => {
    const token = {
      token: 'eyJ2ZXIiOjEs',
      id: 'AAECAwQFBgcICQoLDA0ODw',
      address: 'manager.example.com',
      expires: '2026-10-09T05:12:40+00:00',
    };
    apiReq.mockResolvedValue({ data: { data: token } });

    await expect(
      createEnrollmentToken({ address: 'manager.example.com', ttl: '12h' }),
    ).resolves.toEqual(token);
    expect(apiReq).toHaveBeenCalledWith('POST', ENROLLMENT_TOKENS_ENDPOINT, {
      address: 'manager.example.com',
      ttl: '12h',
    });
  });

  it('propagates the message the server answered with', async () => {
    apiReq.mockRejectedValue(
      new Error(
        "Address 'other.example.com' is not covered by the listener certificate",
      ),
    );

    await expect(
      createEnrollmentToken({ address: 'other.example.com' }),
    ).rejects.toThrow(
      "Address 'other.example.com' is not covered by the listener certificate",
    );
  });

  it('fails when the response carries no token', async () => {
    apiReq.mockResolvedValue({ data: { data: {}, message: 'Nothing minted' } });

    await expect(
      createEnrollmentToken({ address: 'manager.example.com' }),
    ).rejects.toThrow('Nothing minted');
  });
});
