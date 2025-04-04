import React from 'react';
import {
  EuiButtonEmpty,
  EuiFlexItem,
  EuiFlexGroup,
  EuiText,
  EuiDataGridColumn,
  EuiDataGridColumnVisibility,
} from '@elastic/eui';
import { MAX_ENTRIES_PER_QUERY } from '../../data-grid/data-grid-service';
// Remove unused import
// import { formatUIDate } from '../../../../utils/time-service';
import { HitsCounter } from './hits-counter';
import { formatNumWithCommas } from './helpers';
import { DataGridVisibleColumnsSelector } from './visible-columns-selector';
import SelectedItemsControls from './selected-items-controls';

interface DiscoverDataGridAdditionalControlsProps {
  totalHits: number;
  onClickExportResults: () => void;
  maxEntriesPerQuery?: number;
  dateRange: TimeRange;
  columnsAvailable: EuiDataGridColumn[];
  columnVisibility: EuiDataGridColumnVisibility;
  selectedRows: Set<any>;
  isExporting: boolean;
}

const DiscoverDataGridAdditionalControls = (
  props: DiscoverDataGridAdditionalControlsProps,
) => {
  const {
    totalHits,
    selectedRows,
    isExporting,
    maxEntriesPerQuery = MAX_ENTRIES_PER_QUERY,
    onClickExportResults,
    dateRange,
    columnsAvailable,
    columnVisibility,
  } = props;

  const onHandleExportResults = () => {
    if (onClickExportResults) {
      onClickExportResults();
    }
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
                  maxEntriesPerQuery,
                )} hits. To provide a better experience the table only shows the first ${formatNumWithCommas(
                  maxEntriesPerQuery,
                )} hits.`,
                iconType: 'alert',
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
              {/* formatUIDate(dateRange?.from)} - {formatUIDate(dateRange?.to)*/}
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      ) : null}
      <SelectedItemsControls selectedItems={selectedRows} />
      <EuiButtonEmpty
        disabled={totalHits === 0 || isExporting}
        size='xs'
        iconType='exportAction'
        color='text'
        isLoading={isExporting}
        className='euiDataGrid__controlBtn'
        onClick={onHandleExportResults}
      >
        Export Formated
      </EuiButtonEmpty>
      <DataGridVisibleColumnsSelector
        availableColumns={columnsAvailable}
        columnVisibility={columnVisibility}
      />
    </>
  );
};

export default DiscoverDataGridAdditionalControls;
