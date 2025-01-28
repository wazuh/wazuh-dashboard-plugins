import React, { useState } from 'react';
import {
  EuiCallOut,
  EuiSearchBar,
  EuiSearchBarProps,
  Query,
} from '@elastic/eui';

const initialQuery = EuiSearchBar.Query.MATCH_ALL;

export const SearchBar = (props: EuiSearchBarProps) => {
  const { schema, filters, setQuery } = props;
  const [error, setError] = useState(null);

  const onChange = ({ query, error }: { query: Query; error: Error }) => {
    if (error) {
      setError(error);
    } else {
      setError(null);
      setQuery(query);
    }
  };

  const renderError = () => {
    if (!error) {
      return;
    }

    return (
      <>
        <EuiCallOut
          iconType='faceSad'
          color='danger'
          title={`Invalid search: ${error.message}`}
        />
      </>
    );
  };

  return (
    <>
      <div style={{ margin: '20px 0' }}>
        <EuiSearchBar
          defaultQuery={initialQuery}
          box={{
            placeholder: 'Search...',
            schema,
            incremental: true,
          }}
          filters={filters}
          onChange={onChange}
          compressed
        />
      </div>
      {renderError()}
    </>
  );
};
