import React from 'react';
import { EuiCodeEditor } from '@elastic/eui';
import { withGuardAsync } from '../../hocs';

export const FileViewer = ({ content }: { content: string }) => {
  return (
    <EuiCodeEditor
      theme='textmate'
      width='100%'
      height={'calc(100vh - 270px)'}
      value={content}
      mode='yml'
      isReadOnly={true}
      wrapEnabled
      aria-label='Asset viewer'
    />
  );
};

export const FileViewerFetchContent = withGuardAsync(
  props => {
    try {
      // TODO: fetch asset content
      // const data = await props.fetch();
      return {
        ok: false,
        data: {
          content: '',
        },
      };
    } catch (error) {
      return {
        ok: true,
        data: {
          error,
        },
      };
    }
  },
  () => null,
)(FileViewer);
