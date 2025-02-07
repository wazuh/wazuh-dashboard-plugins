import React from 'react';
import { EuiFlexItem, EuiCodeBlock, EuiTabbedContent } from '@elastic/eui';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import DocViewer from './doc-viewer/doc-viewer';
import { useDocViewer } from './doc-viewer';

interface Props {
  document: any;
  indexPattern: any;
  renderFields?: any;
  extraTabs?: any;
  tableProps?: any;
}

export const DocumentViewTableAndJson = ({
  document,
  indexPattern,
  renderFields,
  extraTabs = [],
  tableProps = {},
}: Props) => {
  const docViewerProps = useDocViewer({
    doc: document,
    indexPattern: indexPattern as IndexPattern,
  });

  const renderExtraTabs = tabs => {
    if (!tabs) {
      return [];
    }

    return (
      typeof tabs === 'function' ? tabs({ document, indexPattern }) : tabs
    ).map(({ id, name, content: Content }) => ({
      id,
      name,
      content: (
        <Content
          {...docViewerProps}
          document={document}
          indexPattern={indexPattern}
        />
      ),
    }));
  };

  return (
    <EuiFlexItem>
      <EuiTabbedContent
        tabs={[
          ...renderExtraTabs(extraTabs.pre),
          {
            id: 'table',
            name: 'Table',
            content: (
              <DocViewer
                {...docViewerProps}
                renderFields={renderFields}
                {...tableProps}
              />
            ),
          },
          {
            id: 'json',
            name: 'JSON',
            content: (
              <EuiCodeBlock
                aria-label={'Document details'}
                language='json'
                isCopyable
                paddingSize='s'
              >
                {JSON.stringify(document, null, 2)}
              </EuiCodeBlock>
            ),
          },
          ...renderExtraTabs(extraTabs.post),
        ]}
      />
    </EuiFlexItem>
  );
};
