import React from 'react';
import { EuiFlexItem, EuiCodeBlock, EuiTabbedContent } from '@elastic/eui';
import { IndexPattern } from '../../../../../../../../src/plugins/data/common';
import DocViewer from '../../doc-viewer/doc-viewer';
import { useDocViewer } from '../../doc-viewer';
import { onFilterCellActions } from "../../data-grid";
import { FILTER_OPERATOR } from "../../data-source";

export const DocumentViewTableAndJson = ({
  document,
  indexPattern,
  renderFields,
  filters,
  setFilters,
}) => {
  const docViewerProps = useDocViewer({
    doc: document,
    indexPattern: indexPattern as IndexPattern,
  });

  const onFilterHandler = (field: string, operation: FILTER_OPERATOR, value?: any) => {
    const onFilter = onFilterCellActions(indexPattern.id, filters, setFilters);
    onFilter(field, operation, value);
  };

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
                onFilter={onFilterHandler}
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
