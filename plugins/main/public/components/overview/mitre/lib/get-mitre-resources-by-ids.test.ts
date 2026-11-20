import { WzRequest } from '../../../../react-services/wz-request';
import { chunkIds, getMitreResourcesByIds } from './get-mitre-resources-by-ids';

jest.mock('../../../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

const apiReq = WzRequest.apiReq as jest.Mock;

describe('chunkIds', () => {
  it('joins the ids and starts a new chunk once the limit is reached', () => {
    expect(chunkIds(['aaa', 'bbb', 'ccc'], 7)).toEqual(['aaa,bbb', 'ccc']);
  });
});

describe('getMitreResourcesByIds', () => {
  beforeEach(() => apiReq.mockReset());

  it('requests only the given ids', async () => {
    apiReq.mockResolvedValue({
      data: { data: { affected_items: [{ name: 'APT38' }] } },
    });

    await expect(
      getMitreResourcesByIds('groups', [
        'intrusion-set--1',
        'intrusion-set--2',
      ]),
    ).resolves.toEqual([{ name: 'APT38' }]);
    expect(apiReq).toHaveBeenCalledWith(
      'GET',
      '/mitre/groups?group_ids=intrusion-set--1,intrusion-set--2',
      {},
    );
  });

  it('keeps the resource name when it does not end in "s"', async () => {
    apiReq.mockResolvedValue({ data: { data: { affected_items: [] } } });

    await getMitreResourcesByIds('software', ['tool--1']);

    expect(apiReq).toHaveBeenCalledWith(
      'GET',
      '/mitre/software?software_ids=tool--1',
      {},
    );
  });

  it('makes no request without ids', async () => {
    await expect(getMitreResourcesByIds('groups', [])).resolves.toEqual([]);
    expect(apiReq).not.toHaveBeenCalled();
  });
});
