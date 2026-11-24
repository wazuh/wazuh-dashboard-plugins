import { DefaultFactory } from './default-factory';
import { OpenSearchDashboardsSecurityFactory } from './opensearch-dashboards-security-factory';
import {
  HttpAuth,
  OpenSearchDashboardsRequest,
} from 'opensearch-dashboards/server';
import { ELASTIC_NAME } from '../../../../common/constants';

describe('security factories authContextFields', () => {
  it('lists the keys of the default authentication context', async () => {
    const factory = new DefaultFactory();
    const { authContext } = await factory.getCurrentUser({} as any);

    expect(factory.authContextFields).toEqual(Object.keys(authContext));
  });

  it('lists the keys of the security plugin account', async () => {
    const factory = new OpenSearchDashboardsSecurityFactory();

    expect(factory.authContextFields).toEqual(
      expect.arrayContaining([
        'user_name',
        'backend_roles',
        'roles',
        'custom_attribute_names',
      ]),
    );
  });

  it.each([
    ['default', () => new DefaultFactory()],
    ['security plugin', () => new OpenSearchDashboardsSecurityFactory()],
  ])('sorts alphabetically the fields of the %s factory', (_name, create) => {
    const { authContextFields } = create();

    expect(authContextFields).toEqual([...authContextFields].sort());
  });
});

describe('security factories getRequestUsername', () => {
  const request = {} as OpenSearchDashboardsRequest;
  const createFactory = (authState: unknown) => {
    const auth: Pick<HttpAuth, 'get'> = {
      get: jest.fn().mockReturnValue(authState),
    };
    return { auth, factory: new OpenSearchDashboardsSecurityFactory(auth) };
  };

  it('returns the default user without the security plugin', () => {
    expect(new DefaultFactory().getRequestUsername()).toBe(ELASTIC_NAME);
  });

  it('reads the user of the authentication state of the request', () => {
    const { auth, factory } = createFactory({
      status: 'authenticated',
      // eslint-disable-next-line camelcase -- field of the security plugin authinfo API
      state: { authInfo: { user_name: 'readonly' } },
    });

    expect(factory.getRequestUsername(request)).toBe('readonly');
    expect(auth.get).toHaveBeenCalledWith(request);
  });

  it.each([
    ['without authentication state', { status: 'unknown', state: undefined }],
    ['without the user in the state', { status: 'authenticated', state: {} }],
  ])('returns undefined %s', (_name, authState) => {
    const { factory } = createFactory(authState);

    expect(factory.getRequestUsername(request)).toBeUndefined();
  });

  it('returns undefined without the authentication service', () => {
    expect(
      new OpenSearchDashboardsSecurityFactory().getRequestUsername(request),
    ).toBeUndefined();
  });
});
