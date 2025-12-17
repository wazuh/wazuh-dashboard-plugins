import React, { useMemo } from 'react';
import { EuiCodeBlock } from '@elastic/eui';

export const JSONViewer: React.FC<{ data: any }> = ({ data }) => {
  /* Memoize the JSON string to avoid unnecessary recalculations
    when the component re-renders.
    The memoization could depend on data, but the current usage of this
    component gets new data object (similar to the previos prop) on each render.
  */
  const jsonString = useMemo(() => JSON.stringify(data, null, 2), []);

  return (
    <EuiCodeBlock
      aria-label={'JSON'}
      language='json'
      isCopyable
      paddingSize='s'
    >
      {jsonString}
    </EuiCodeBlock>
  );
};
