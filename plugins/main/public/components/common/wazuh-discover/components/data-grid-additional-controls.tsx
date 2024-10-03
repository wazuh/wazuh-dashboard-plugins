import React from 'react';
import {
  EuiButtonEmpty,
  EuiFlexItem,
  EuiFlexGroup,
  EuiText,
} from '@elastic/eui';
import { HitsCounter } from '../../../../kibana-integrations/discover/application/components/hits_counter';
import { formatNumWithCommas } from '../../../../kibana-integrations/discover/application/helpers';
import { MAX_ENTRIES_PER_QUERY } from '../../data-grid/data-grid-service';
import { formatUIDate } from '../../../../react-services/time-service';

type tDiscoverDataGridAdditionalControlsProps = {
  totalHits: number;
  isExporting: boolean;
  onClickExportResults: () => void;
  maxEntriesPerQuery?: number;
  dateRange: TimeRange;
};

const DiscoverDataGridAdditionalControls = (
  props: tDiscoverDataGridAdditionalControlsProps,
) => {
  const {
    totalHits,
    isExporting,
    maxEntriesPerQuery = MAX_ENTRIES_PER_QUERY,
    onClickExportResults,
    dateRange,
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
                content: `The query results exceeded the limit of ${formatNumWithCommas(
                  maxEntriesPerQuery,
                )} hits. Please refine your search.`,
                iconType: 'iInCircle',
                position: 'top',
              }
            : undefined
        }
      />
      {dateRange ? (
        <EuiFlexGroup
          gutterSize='s'
          responsive={false}
          justifyContent='center'
          alignItems='center'
        >
          <EuiFlexItem grow={false}>
            <EuiText size='s'>
              {formatUIDate(dateRange?.from)} - {formatUIDate(dateRange?.to)}
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      ) : null}
      <EuiButtonEmpty
        disabled={totalHits === 0 || isExporting}
        size='xs'
        iconType='exportAction'
        color='primary'
        isLoading={isExporting}
        className='euiDataGrid__controlBtn'
        onClick={onHandleExportResults}
      >
        Export Formated
      </EuiButtonEmpty>
    </>
  );
};

export default DiscoverDataGridAdditionalControls;
