import { DefaultFactory } from './default-factory';
import { OpenSearchDashboardsSecurityFactory } from './opensearch-dashboards-security-factory';

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
