import { i18n } from '@osd/i18n';
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
  dataGridStatePersistenceManager: ReturnType<
    typeof useDataGridStatePersistenceManager
  >;
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
    dataGridStatePersistenceManager,
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
                ariaLabel: i18n.translate(
                  'wazuh.common.wazuhDiscover.hitsLimitInfoAriaLabel',
                  { defaultMessage: 'Info' },
                ),
                content: i18n.translate(
                  'wazuh.common.wazuhDiscover.hitsLimitRefineTooltip',
                  {
                    defaultMessage:
                      'The query results exceeded the limit of {maxEntries} hits. Please refine your search.',
                    values: {
                      maxEntries: formatNumWithCommas(maxEntriesPerQuery),
                    },
                  },
                ),
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
        {i18n.translate('wazuh.common.wazuhDiscover.exportFormattedButton', {
          defaultMessage: 'Export Formatted',
        })}
      </EuiButtonEmpty>

      <RestoreStateColumnsButton
        dataGridStatePersistenceManager={dataGridStatePersistenceManager}
      />

      <DataGridVisibleColumnsSelector
        availableColumns={columnsAvailable}
        columnVisibility={columnVisibility}
      />
    </>
  );
};

export default DiscoverDataGridAdditionalControls;
