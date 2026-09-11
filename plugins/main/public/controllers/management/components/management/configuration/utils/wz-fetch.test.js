import { saveFileCluster } from './wz-fetch';
import { WzRequest } from '../../../../../../react-services/wz-request';

jest.mock('../../../../../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

/* Characterization of the only live manager-save path, before removing the
dead `saveNodeConfiguration`/`saveConfiguration`/`getXML`/`getJSON` exports. */
describe('saveFileCluster', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends the raw text with origin=raw, then validates', async () => {
    WzRequest.apiReq
      .mockResolvedValueOnce({}) // PUT .../configuration
      .mockResolvedValueOnce({ data: { data: { status: 'OK' } } }); // GET validation

    await saveFileCluster('<wazuh_config></wazuh_config>', 'node01');

    expect(WzRequest.apiReq).toHaveBeenNthCalledWith(
      1,
      'PUT',
      '/cluster/node01/configuration',
      { body: '<wazuh_config></wazuh_config>', origin: 'raw' },
    );
    expect(WzRequest.apiReq).toHaveBeenNthCalledWith(
      2,
      'GET',
      '/cluster/configuration/validation',
      {},
    );
  });

  it('rejects with the validation error details when the manager reports invalid config', async () => {
    WzRequest.apiReq.mockResolvedValueOnce({}).mockResolvedValueOnce({
      data: {
        data: { status: 'FAIL', details: [{ path: 'wazuh_config' }] },
      },
    });

    await expect(
      saveFileCluster('<wazuh_config></wazuh_config>', 'node01'),
    ).rejects.toEqual({
      status: 'FAIL',
      details: [{ path: 'wazuh_config' }],
    });
  });

  it('propagates a failure from the PUT request', async () => {
    WzRequest.apiReq.mockRejectedValueOnce(new Error('network error'));

    await expect(
      saveFileCluster('<wazuh_config></wazuh_config>', 'node01'),
    ).rejects.toThrow('network error');
  });
});
