import React from 'react';
import { useRouterSearch } from '../hooks';

export const withRouterSearch = WrappedComponent => props => {
  const search = useRouterSearch();
  return <WrappedComponent {...props} search={search} />;
};
