import { i18n } from '@osd/i18n';
import React, { useEffect, useState } from 'react';
import {
  EuiEmptyPrompt,
  EuiLoadingSpinner,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import DocViewer from '../../../common/doc-viewer/doc-viewer';
import { useDocViewer } from '../../../common/doc-viewer';
import { resolveOriginalFinding } from './active-responses-service';

type Resolution =
  | { type: 'loading' }
  | { type: 'found'; document: any; indexPattern: any }
  | { type: 'notFound' };

const SourceFindingTable = ({
  document,
  indexPattern,
}: {
  document: any;
  indexPattern: any;
}) => {
  const docWithId = {
    ...document,
    _source: { _id: document._id, ...document._source },
  };
  const docViewerProps = useDocViewer({ doc: docWithId, indexPattern });
  return (
    <DocViewer
      {...docViewerProps}
      filters={[]}
      setFilters={() => {}}
      showFilterButtons={false}
    />
  );
};

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
            ? {
                type: 'found',
                document: result.document,
                indexPattern: result.indexPattern,
              }
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
        title={
          <EuiText>
            {i18n.translate(
              'wazuh.activeResponses.sourceFindingFlyout.loadingTitle',
              {
                defaultMessage: 'Loading original finding...',
              },
            )}
          </EuiText>
        }
      />
    );
  }

  if (resolution.type === 'notFound') {
    return (
      <>
        <EuiSpacer size='l' />
        <EuiEmptyPrompt
          iconType='search'
          title={
            <h3>
              {i18n.translate(
                'wazuh.activeResponses.sourceFindingFlyout.notFoundTitle',
                {
                  defaultMessage: 'Missing source finding',
                },
              )}
            </h3>
          }
          body={
            <EuiText size='s'>
              {i18n.translate(
                'wazuh.activeResponses.sourceFindingFlyout.notFoundDescription',
                {
                  defaultMessage:
                    'The source finding for this active response could not be found. It may have been deleted from its index.',
                },
              )}
            </EuiText>
          }
        />
      </>
    );
  }

  return (
    <SourceFindingTable
      document={resolution.document}
      indexPattern={resolution.indexPattern}
    />
  );
};
