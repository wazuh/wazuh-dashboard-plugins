import React from 'react';
import { EuiEmptyPrompt } from '@elastic/eui';

export const NoResultsData = (props: { query: { text: string } }) => {
  const { query } = props;

  return (
    <EuiEmptyPrompt
      iconType='database'
      title={<h2>No results found</h2>}
      body={
        <>
          <p>
            No results found for the search with the value &apos;{query.text}
            &apos;.
          </p>
        </>
      }
    />
  );
};
