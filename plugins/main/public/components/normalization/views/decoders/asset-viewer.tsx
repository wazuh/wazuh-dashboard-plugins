import React from 'react';
import { EuiCodeEditor } from '@elastic/eui';

export const AssetViewer: React.FC<{
  content: string;
  height?: number;
  minusHeight?: number;
}> = ({ content, height, minusHeight = 200 }) => {
  return (
    <EuiCodeEditor
      readOnly={true}
      width='100%'
      value={content}
      mode='yml'
      wrapEnabled
      aria-label='Asset viewer'
      height={height || `calc(100vh - ${minusHeight}px)`}
    />
  );
};
