import React, { useEffect, useState } from 'react';
import {
  EuiEmptyPrompt,
  EuiLoadingSpinner,
  EuiText,
} from '@elastic/eui';
import { DocumentViewTableAndJson } from '../../../common/wazuh-discover/components/document-view-table-and-json';
import { resolveOriginalFinding } from './active-responses-service';

type Resolution =
  | { type: 'loading' }
  | { type: 'found'; document: any; indexPattern: any }
  | { type: 'notFound' };

export const ActiveResponseFlyoutBody = ({ hit }: { hit: any }) => {
  const [resolution, setResolution] = useState<Resolution>({
    type: 'loading',
  });

  useEffect(() => {
    let cancelled = false;
    setResolution({ type: 'loading' });
    resolveOriginalFinding(hit).then(result => {
      if (!cancelled) {
        setResolution(
          result
            ? { type: 'found', document: result.document, indexPattern: result.indexPattern }
            : { type: 'notFound' },
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [hit]);

  if (resolution.type === 'loading') {
    return (
      <EuiEmptyPrompt
        icon={<EuiLoadingSpinner size='xl' />}
        title={<EuiText>Loading original finding...</EuiText>}
      />
    );
  }

  if (resolution.type === 'notFound') {
    return (
      <EuiEmptyPrompt
        iconType='search'
        title={<h3>No linked finding found</h3>}
        body={
          <EuiText size='s'>
            No finding linked to this active response was found.
          </EuiText>
        }
      />
    );
  }

  return (
    <DocumentViewTableAndJson
      document={resolution.document}
      indexPattern={resolution.indexPattern}
      filters={[]}
      setFilters={() => {}}
      showFilterButtons={false}
    />
  );
};
