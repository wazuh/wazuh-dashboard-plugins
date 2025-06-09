import React from 'react';
import { EuiButtonEmpty, EuiToolTip } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import useDataGridStatePersistenceManager from '../../data-grid/data-grid-state-persistence-manager/use-data-grid-state-persistence-manager';

interface RestoreStateColumnsButtonProps {
  dataGridStatePersistenceManager: ReturnType<
    typeof useDataGridStatePersistenceManager
  >;
}

const RestoreStateColumnsButton = (props: RestoreStateColumnsButtonProps) => {
  return (
    <EuiToolTip
      position='top'
      content={
        <FormattedMessage
          id='wz.discover.restoreState.tooltip'
          defaultMessage='This action will remove any column width and fields customization of the data grid.'
        />
      }
    >
      <EuiButtonEmpty
        iconType='refresh'
        size='xs'
        color='text'
        className='euiDataGrid__controlBtn'
        data-test-subj='dataGridColumnRestoreStateButton'
        onClick={props.dataGridStatePersistenceManager.clearStateColumns}
        disabled={
          props.dataGridStatePersistenceManager.isStateColumnsMatchingDefaults
        }
      >
        <FormattedMessage
          id='wz.discover.restoreState'
          defaultMessage='Restore state'
        />
      </EuiButtonEmpty>
    </EuiToolTip>
  );
};

export default RestoreStateColumnsButton;
