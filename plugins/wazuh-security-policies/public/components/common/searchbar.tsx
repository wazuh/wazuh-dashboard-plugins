import React from 'react';
import { EuiCallOut, EuiSearchBar, EuiSearchBarProps } from '@elastic/eui';

const initialQuery = EuiSearchBar.Query.MATCH_ALL;

export const SearchBar = (props: EuiSearchBarProps) => {
  const { schema, filters, onChange, error } = props;

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
