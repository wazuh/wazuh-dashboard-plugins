import {
  cleanDocumentCase,
  getFindingsCase,
  updateDocumentCase,
} from './case-management-service';
import { GenericRequest } from '../../../../react-services/generic-request';

jest.mock('../../../../react-services/generic-request', () => ({
  GenericRequest: { request: jest.fn() },
}));

const mockRequest = GenericRequest.request as jest.Mock;

beforeEach(() => {
  mockRequest.mockReset();
});

describe('getFindingsCase', () => {
  it('GETs the encoded route and returns the case and username', async () => {
    mockRequest.mockResolvedValue({
      data: { case: { status: 'active' }, username: 'admin' },
    });

    const result = await getFindingsCase('.ds-wazuh/findings', 'doc/1');

    expect(mockRequest).toHaveBeenCalledWith(
      'GET',
      '/indexer/findings/case/.ds-wazuh%2Ffindings/doc%2F1',
    );
    expect(result).toEqual({ case: { status: 'active' }, username: 'admin' });
  });

  it('maps a missing case to null', async () => {
    mockRequest.mockResolvedValue({ data: { case: null, username: 'admin' } });

    expect(await getFindingsCase('index', 'doc')).toEqual({
      case: null,
      username: 'admin',
    });
  });
});

describe('updateDocumentCase', () => {
  it('POSTs the payload verbatim and returns the saved case and username', async () => {
    const payload = {
      status: 'active' as const,
      tags: ['a'],
      title: 't',
      description: 'd',
      severity: 'high' as const,
      priority: '' as const,
      tlp: 'TLP:GREEN' as const,
      newComment: 'note',
      editedComments: [
        { created_at: '2026-06-30T08:00:00.000Z', comment: 'edited' },
      ],
    };
    mockRequest.mockResolvedValue({
      data: { case: { status: 'active' }, username: 'admin' },
    });

    const result = await updateDocumentCase('index', 'doc', payload);

    expect(mockRequest).toHaveBeenCalledWith(
      'POST',
      '/indexer/findings/case/index/doc',
      payload,
    );
    expect(result).toEqual({ case: { status: 'active' }, username: 'admin' });
  });
});

describe('cleanDocumentCase', () => {
  it('DELETEs the route and maps the null case', async () => {
    mockRequest.mockResolvedValue({ data: { case: null } });

    expect(await cleanDocumentCase('index', 'doc')).toBeNull();
    expect(mockRequest).toHaveBeenCalledWith(
      'DELETE',
      '/indexer/findings/case/index/doc',
      {},
    );
  });
});
