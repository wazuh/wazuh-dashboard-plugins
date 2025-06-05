import React from 'react';
import {
  EuiButtonEmpty,
  EuiFlexItem,
  EuiFlexGroup,
  EuiText,
  EuiDataGridColumn,
  EuiDataGridColumnVisibility,
} from '@elastic/eui';
import { HitsCounter } from '../../../../kibana-integrations/discover/application/components/hits_counter';
import { formatNumWithCommas } from '../../../../kibana-integrations/discover/application/helpers';
import { MAX_ENTRIES_PER_QUERY } from '../../data-grid/data-grid-service';
import { formatUIDate } from '../../../../react-services/time-service';
import { DataGridVisibleColumnsSelector } from './visible-columns-selector';
import RestoreStateColumnsButton from './restore-state-columns';
import useDataGridStatePersistenceManager from '../../data-grid/data-grid-state-persistence-manager/use-data-grid-state-persistence-manager';

type tDiscoverDataGridAdditionalControlsProps = {
  totalHits: number;
  isExporting: boolean;
  onClickExportResults: () => void;
  maxEntriesPerQuery?: number;
  dateRange: TimeRange;
  columnsAvailable: EuiDataGridColumn[];
  columnVisibility: EuiDataGridColumnVisibility;
  dataGridStateManager: ReturnType<typeof useDataGridStatePersistenceManager>;
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
    columnsAvailable,
    columnVisibility,
    dataGridStateManager,
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
                ariaLabel: 'Info',
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
        color='text'
        isLoading={isExporting}
        className='euiDataGrid__controlBtn'
        onClick={onHandleExportResults}
      >
        Export Formatted
      </EuiButtonEmpty>

      <RestoreStateColumnsButton dataGridStateManager={dataGridStateManager} />

      <DataGridVisibleColumnsSelector
        availableColumns={columnsAvailable}
        columnVisibility={columnVisibility}
      />
    </>
  );
};

export default DiscoverDataGridAdditionalControls;
