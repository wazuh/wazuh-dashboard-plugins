import React, { useMemo } from 'react';
import { EuiCodeBlock } from '@elastic/eui';

export const JSONViewer: React.FC<{ data: any }> = ({ data }) => {
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
