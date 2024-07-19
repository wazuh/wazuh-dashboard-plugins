import React, { useState } from 'react';
import { useDocViewer } from '../../doc-viewer';
import DocViewer from '../../doc-viewer/doc-viewer';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import { EuiCodeBlock, EuiFlexGroup, EuiTabbedContent } from '@elastic/eui';

const DocDetails = ({ doc, item, indexPattern }) => {
  const docViewerProps = useDocViewer({
    doc,
    indexPattern: indexPattern as IndexPattern,
  });

  return (
    <EuiFlexGroup direction="column" style={{ width: '100%' }}>
      <EuiTabbedContent
        tabs={[
          {
            id: 'table',
            name: 'Table',
            content: (
              <>
                <DocViewer {...docViewerProps} />
              </>
            ),
          },
          {
            id: 'json',
            name: 'JSON',
            content: (
              <EuiCodeBlock
                aria-label={'Document details'}
                language="json"
                isCopyable
                paddingSize="s"
              >
                {JSON.stringify(item, null, 2)}
              </EuiCodeBlock>
            ),
          },
        ]}
      />
    </EuiFlexGroup>
  );
};

export default DocDetails;
