import React from 'react';
import { EuiCodeEditor } from '@elastic/eui';

export const AssetViewer: React.FC<{ content: string }> = ({
  content,
}: {
  content: string;
}) => {
  return (
    <EuiCodeEditor
      readOnly={true}
      width='100%'
      height='250px'
      value={content}
      mode='yml'
      wrapEnabled
      aria-label='Asset viewer'
    />
  );
};
