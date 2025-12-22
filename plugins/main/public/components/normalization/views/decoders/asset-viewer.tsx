import React from 'react';
import { EuiCodeBlock } from '@elastic/eui';

export const AssetViewer: React.FC<{
  content: string;
  height?: number;
  minusHeight?: number;
}> = ({ content, height, minusHeight = 200 }) => {
  return (
    <EuiCodeBlock
      aria-label='Asset viewer'
      language='yml'
      isCopyable
      paddingSize='s'
      overflowHeight={height || `calc(100vh - ${minusHeight}px)`}
      width='100%'
    >
      {content}
    </EuiCodeBlock>
  );
};
