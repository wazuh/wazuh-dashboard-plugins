jest.mock('../plugin-services', () => ({
  getCore: jest.fn(),
}));

import { fetchCtiRegistrationPermission } from './cti-registration-permission';
import { getCore } from '../plugin-services';
import { routes } from '../../common/constants';

const mockHttpGet = jest.fn();

describe('fetchCtiRegistrationPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCore as jest.Mock).mockReturnValue({ http: { get: mockHttpGet } });
  });

  test('requests the permission route', async () => {
    mockHttpGet.mockResolvedValue({
      accessAllowed: true,
      missingPrivileges: [],
    });

    await fetchCtiRegistrationPermission();

    expect(mockHttpGet).toHaveBeenCalledWith(
      routes.ctiRegistrationPermission,
      undefined,
    );
  });

  test('passes a denial through with its missing privileges', async () => {
    mockHttpGet.mockResolvedValue({
      accessAllowed: false,
      missingPrivileges: ['cluster:admin/content_manager/subscription/create'],
    });

    await expect(fetchCtiRegistrationPermission()).resolves.toEqual({
      accessAllowed: false,
      missingPrivileges: ['cluster:admin/content_manager/subscription/create'],
    });
  });

  test('keeps missingPrivileges an array of strings', async () => {
    mockHttpGet.mockResolvedValue({
      accessAllowed: false,
      missingPrivileges: 'not-an-array',
    });

    await expect(fetchCtiRegistrationPermission()).resolves.toEqual({
      accessAllowed: false,
      missingPrivileges: [],
    });
  });

  test.each([
    ['an unreadable body', {}],
    ['a null body', null],
  ])('fails open on %s', async (_label, body) => {
    mockHttpGet.mockResolvedValue(body);

    await expect(fetchCtiRegistrationPermission()).resolves.toEqual({
      accessAllowed: true,
      missingPrivileges: [],
    });
  });

  test('fails open when the request rejects', async () => {
    mockHttpGet.mockRejectedValue(new Error('network down'));

    await expect(fetchCtiRegistrationPermission()).resolves.toEqual({
      accessAllowed: true,
      missingPrivileges: [],
    });
  });
});

describe('fetchCtiRegistrationPermission for clear', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCore as jest.Mock).mockReturnValue({ http: { get: mockHttpGet } });
  });

  test('asks for the clear action', async () => {
    mockHttpGet.mockResolvedValue({
      accessAllowed: true,
      missingPrivileges: [],
    });

    await expect(fetchCtiRegistrationPermission('clear')).resolves.toEqual({
      accessAllowed: true,
      missingPrivileges: [],
    });
    expect(mockHttpGet).toHaveBeenCalledWith(routes.ctiRegistrationPermission, {
      query: { action: 'clear' },
    });
  });

  test('fails closed on an unreadable body', async () => {
    mockHttpGet.mockResolvedValue({});

    await expect(fetchCtiRegistrationPermission('clear')).resolves.toEqual({
      accessAllowed: false,
      missingPrivileges: [],
    });
  });

  test('fails closed when the request rejects', async () => {
    mockHttpGet.mockRejectedValue(new Error('network down'));

    await expect(fetchCtiRegistrationPermission('clear')).resolves.toEqual({
      accessAllowed: false,
      missingPrivileges: [],
    });
  });
});
