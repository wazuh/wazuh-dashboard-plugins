/* eslint-disable camelcase -- the manager API responses are snake_case */
import {
  isRestartingNotice,
  restartNodeSelected,
  saveFileCluster,
} from './wz-fetch';
import { WzRequest } from '../../../../../../react-services/wz-request';

jest.mock('../../../../../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

jest.mock('../../../../../../../common/utils', () => ({
  ...jest.requireActual('../../../../../../../common/utils'),
  delayAsPromise: jest.fn(() => Promise.resolve()),
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

describe('isRestartingNotice', () => {
  const runningDaemons = {
    'wazuh-manager-modulesd': { running: true },
    'wazuh-manager-db': { running: true },
    'wazuh-manager-clusterd': { running: true },
  };

  // validation, restart, local node info, daemons status
  const mockRestart = () =>
    WzRequest.apiReq
      .mockResolvedValueOnce({ status: 200 })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        data: { data: { affected_items: [{ node: 'node01' }] } },
      })
      .mockResolvedValueOnce({
        data: { data: { affected_items: [runningDaemons] } },
      });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('recognizes the notice shown while a node restarts', async () => {
    mockRestart();
    const updateWazuhNotReadyYet = jest.fn();

    await restartNodeSelected('node01', updateWazuhNotReadyYet);

    const notice = updateWazuhNotReadyYet.mock.calls[0][0];
    expect(notice).toBe('Restarting node01, please wait.');
    expect(isRestartingNotice(notice)).toBe(true);
    // Once the node is back, the notice is cleared.
    expect(updateWazuhNotReadyYet).toHaveBeenLastCalledWith('');
  });

  it('recognizes only the latest restart notice', async () => {
    mockRestart();
    mockRestart();
    const updateWazuhNotReadyYet = jest.fn();

    await restartNodeSelected('node01', updateWazuhNotReadyYet);
    await restartNodeSelected('node02', updateWazuhNotReadyYet);

    expect(isRestartingNotice('Restarting node02, please wait.')).toBe(true);
    expect(isRestartingNotice('Restarting node01, please wait.')).toBe(false);
  });

  it('does not recognize other callout states', () => {
    expect(isRestartingNotice('')).toBe(false);
    expect(isRestartingNotice(false)).toBe(false);
    expect(isRestartingNotice(undefined)).toBe(false);
    expect(isRestartingNotice('Server not ready yet.')).toBe(false);
    expect(isRestartingNotice('Server could not be recovered.')).toBe(false);
  });
});
