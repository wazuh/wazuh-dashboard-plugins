import React from 'react';
import { EuiFlexItem, EuiCodeBlock, EuiTabbedContent } from '@elastic/eui';
import {
  IndexPattern,
  Filter,
} from '../../../../../../../src/plugins/data/common';
import DocViewer from '../../doc-viewer/doc-viewer';
import { useDocViewer } from '../../doc-viewer';

interface DocumentViewTableAndJsonProps {
  document: any;
  indexPattern: IndexPattern;
  renderFields?: any;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
  onFilter?: () => void;
}

export const DocumentViewTableAndJson = ({
  document,
  indexPattern,
  renderFields,
  filters,
  setFilters,
  onFilter,
}: DocumentViewTableAndJsonProps) => {
  const docViewerProps = useDocViewer({
    doc: document,
    indexPattern: indexPattern as IndexPattern,
  });

  return (
    <EuiFlexItem>
      <EuiTabbedContent
        tabs={[
          {
            id: 'table',
            name: 'Table',
            content: (
              <DocViewer
                {...docViewerProps}
                renderFields={renderFields}
                filters={filters}
                setFilters={setFilters}
                onFilter={onFilter}
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
        ]}
      />
    </EuiFlexItem>
  );
};
