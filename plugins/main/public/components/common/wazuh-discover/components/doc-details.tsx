import { i18n } from '@osd/i18n';
import React from 'react';
import { useDocViewer } from '../../doc-viewer';
import DocViewer from '../../doc-viewer/doc-viewer';
import {
  Filter,
  IndexPattern,
} from '../../../../../../../src/plugins/data/common';
import { EuiCodeBlock, EuiFlexGroup, EuiTabbedContent } from '@elastic/eui';

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

  return (
    <EuiFlexGroup direction='column' style={{ width: '100%' }}>
      <EuiTabbedContent
        tabs={[
          {
            id: 'table',
            name: i18n.translate('wazuh.common.wazuhDiscover.tableTab', {
              defaultMessage: 'Table',
            }),
            content: (
              <>
                <DocViewer
                  {...docViewerProps}
                  filters={filters}
                  setFilters={setFilters}
                />
              </>
            ),
          },
          {
            id: 'json',
            name: i18n.translate('wazuh.common.wazuhDiscover.jsonTab', {
              defaultMessage: 'JSON',
            }),
            content: (
              <EuiCodeBlock
                aria-label={i18n.translate(
                  'wazuh.common.wazuhDiscover.jsonCodeBlockAriaLabel',
                  { defaultMessage: 'Document details' },
                )}
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
