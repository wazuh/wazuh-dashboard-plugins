const getFilters = filters => {
  if (!filters) {
    return {};
  }
  const { default: defaultFilters, ...restFilters } = filters;
  return Object.keys(restFilters).length ? restFilters : defaultFilters;
};

export const fetchServerTableDataCreator =
  fetchData =>
  async ({ pagination, sorting, fetchContext }) => {
    const { pageIndex, pageSize } = pagination;
    const { field, direction } = sorting.sort;
    const params = {
      ...getFilters(fetchContext.filters),
      offset: pageIndex * pageSize,
      limit: pageSize,
      sort: `${direction === 'asc' ? '+' : '-'}${field}`,
    };

    const response = await fetchData(
      fetchContext.method,
      fetchContext.endpoint,
      {
        params,
      },
    );
    return {
      items: response?.data?.data?.affected_items,
      totalItems: response?.data?.data?.total_affected_items,
    };
  };
