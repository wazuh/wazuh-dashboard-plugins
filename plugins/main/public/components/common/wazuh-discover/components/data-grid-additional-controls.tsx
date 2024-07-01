import React from 'react';
import { EuiButtonEmpty } from '@elastic/eui';
import { HitsCounter } from '../../../../kibana-integrations/discover/application/components/hits_counter';
import { formatNumWithCommas } from '../../../../kibana-integrations/discover/application/helpers';
import { MAX_ENTRIES_PER_QUERY } from '../../data-grid/data-grid-service';

type tDiscoverDataGridAdditionalControlsProps = {
  totalHits: number;
  isExporting: boolean;
  onClickExportResults: () => void;
  maxEntriesPerQuery?: number;
};


const DiscoverDataGridAdditionalControls = (props: tDiscoverDataGridAdditionalControlsProps) => {
  const {
    totalHits,
    isExporting,
    maxEntriesPerQuery = MAX_ENTRIES_PER_QUERY,
    onClickExportResults,
  } = props;

  const onHandleExportResults = () => {
    onClickExportResults && onClickExportResults();
  };

  return (
    <>
      <HitsCounter
        hits={totalHits}
        showResetButton={false}
        tooltip={
          totalHits && totalHits > maxEntriesPerQuery
            ? {
              ariaLabel: 'Warning',
              content: `The query results has exceeded the limit of ${formatNumWithCommas(
                maxEntriesPerQuery
              )} hits. To provide a better experience the table only shows the first ${formatNumWithCommas(
                maxEntriesPerQuery
              )} hits.`,
              iconType: 'alert',
              position: 'top',
            }
            : undefined
        }
      />
      <EuiButtonEmpty
        disabled={totalHits === 0 || isExporting}
        size="xs"
        iconType="exportAction"
        color="primary"
        isLoading={isExporting}
        className="euiDataGrid__controlBtn"
        onClick={onHandleExportResults}
      >
        Export Formated
      </EuiButtonEmpty>
    </>
  );
};

export default DiscoverDataGridAdditionalControls;
