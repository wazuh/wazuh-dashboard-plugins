import React, { useState } from 'react';
import { useDocViewer } from '../../doc-viewer';
import DocViewer from '../../doc-viewer/doc-viewer';
import {
  Filter,
  IndexPattern,
} from '../../../../../../../src/plugins/data/common';
import { EuiCodeBlock, EuiFlexGroup, EuiTabbedContent } from '@elastic/eui';
import { onFilterCellActions } from '../../data-grid';
import { FILTER_OPERATOR } from '../../data-source';

interface DocDetailsProps {
  doc: any;
  item: any;
  indexPattern: IndexPattern;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
}

const DocDetails = ({
  doc,
  item,
  indexPattern,
  filters,
  setFilters,
}: DocDetailsProps) => {
  const docViewerProps = useDocViewer({
    doc,
    indexPattern: indexPattern as IndexPattern,
  });

  const onFilterHandler = (
    field: string,
    operation: FILTER_OPERATOR,
    value?: any,
  ) => {
    const onFilter = onFilterCellActions(
      indexPattern.id as string,
      filters,
      setFilters,
    );
    onFilter(field, operation, value);
  };

  return (
    <EuiFlexGroup direction='column' style={{ width: '100%' }}>
      <EuiTabbedContent
        tabs={[
          {
            id: 'table',
            name: 'Table',
            content: (
              <>
                <DocViewer {...docViewerProps} onFilter={onFilterHandler} />
              </>
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
