import managedFilters from './managed-filters';

describe('IT Hygiene packages managed filters', () => {
  it('labels the package.vendor filter as vendor or maintainer', () => {
    const vendorFilter = managedFilters.find(
      ({ key }) => key === 'package.vendor',
    );

    expect(vendorFilter?.placeholder).toBe('Vendor or maintainer');
  });
});
