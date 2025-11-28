import React, { useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { EuiSearchBar } from '@elastic/eui';

interface SearchBarProps {
  defaultQuery?: string;
  schema: any;
  onChange: (e) => void;
  [key: string]: any;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onChange,
  schema,
  filters,
  defaultQuery = EuiSearchBar.Query.MATCH_ALL,
}) => {
  return (
    <EuiSearchBar
      defaultQuery={defaultQuery}
      box={{
        placeholder: 'Search',
        incremental: false,
        schema,
      }}
      onChange={({ query }) => {
        onChange(query);
      }}
      filters={filters}
      compressed={true}
    />
  );
};

export const withInitialQueryFromURL = (Component: React.FC) => {
  return props => {
    const location = useLocation();
    const history = useHistory();
    const [query, setQuery] = React.useState<string | null | undefined>(
      undefined,
    );

    useEffect(() => {
      const params = new URLSearchParams(location.search);
      const q = params.get('query');
      if (q) {
        setQuery(q);
        params.delete('query');
        history.replace({
          pathname: location.pathname,
          search: params.toString(),
        });
      } else {
        setQuery(null);
      }
    }, []);
    return query !== undefined ? (
      <Component {...props} initialQuery={query} />
    ) : null;
  };
};
