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
      onChange={({ query, queryText }) => {
        onChange({ query, queryText });
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
        history.replace({
          pathname: location.pathname,
          search: params.toString(),
        });
      } else {
        setQuery(null);
      }
    }, [location.search]);

    const syncQueryURL = (query: string) => {
      const params = new URLSearchParams(location.search);
      if (query) {
        params.set('query', query);
      } else {
        params.delete('query');
      }
      history.push({
        pathname: location.pathname,
        search: params.toString(),
      });
    };
    return query !== undefined ? (
      <Component {...props} initialQuery={query} syncQueryURL={syncQueryURL} />
    ) : null;
  };
};
