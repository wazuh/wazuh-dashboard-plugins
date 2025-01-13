import React, { useState, ChangeEvent } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import classNames from 'classnames';
import {
  EuiPopover,
  EuiPopoverTitle,
  EuiButtonEmpty,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSwitch,
  EuiDataGridColumn,
  EuiDataGridColumnVisibility,
  EuiToolTip,
  EuiIcon,
} from '@elastic/eui';

// Based on https://github.com/opensearch-project/oui/blob/1.8.1/src/components/datagrid/column_selector.tsx
// Only select visibility funcitonality
// Replace OuiI18n by FormattedMessage
export const DataGridVisibleColumnsSelector = ({
  availableColumns,
  columnVisibility,
}: {
  availableColumns: EuiDataGridColumn[];
  columnVisibility: EuiDataGridColumnVisibility;
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const maxAvailableColumns = 500;

  const { visibleColumns, setVisibleColumns } = columnVisibility;

  const searchValueLowerCase = searchValue.toLowerCase();

  const filteredColumns = searchValue
    ? availableColumns
        .filter(({ name }) => name.toLowerCase().includes(searchValueLowerCase))
        .slice(0, maxAvailableColumns)
    : availableColumns.slice(0, maxAvailableColumns);

  const controlBtnClasses = classNames('euiDataGrid__controlBtn', {
    // TODO: research if this is required
    // 'euiDataGrid__controlBtn--active':
    //   availableColumns.length - visibleColumns.length > 0,
  });

  const warningTooltip = (
    <EuiToolTip
      position='top'
      content={
        <FormattedMessage
          id='wz.discover.availableFields.warningTooltip'
          defaultMessage='The number of columns exceeds the limit of {maxAvailableColumns}. Only the first {maxAvailableColumns} columns are displayed but you can still search on all columns.'
          values={{ maxAvailableColumns }}
        />
      }
    >
      <EuiIcon
        className='wz-margin-left-4'
        type='iInCircle'
        aria-label='Info'
      />
    </EuiToolTip>
  );

  return (
    <EuiPopover
      data-test-subj='dataGridColumnSelectorPopover'
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      anchorPosition='downLeft'
      panelPaddingSize='s'
      panelClassName='euiDataGridColumnSelectorPopover'
      button={
        <EuiButtonEmpty
          iconType='listAdd'
          iconSide='left'
          size='xs'
          color='text'
          className={controlBtnClasses}
          data-test-subj='dataGridColumnSelectorButton'
          onClick={() => setIsOpen(!isOpen)}
        >
          <FormattedMessage
            id='wz.discover.availableFields'
            defaultMessage='{availableColumns} available fields'
            values={{ availableColumns: availableColumns?.length ?? 0 }}
          />
          {availableColumns.length > maxAvailableColumns && warningTooltip}
        </EuiButtonEmpty>
      }
    >
      <EuiPopoverTitle>
        <EuiFieldText
          fullWidth
          compressed
          placeholder='Search'
          aria-label='Search columns'
          value={searchValue}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSearchValue(e.currentTarget.value)
          }
        />
      </EuiPopoverTitle>
      <div className='euiDataGrid__controlScroll'>
        {filteredColumns.map(({ name, id }) => {
          return (
            <div key={id} className='ouiDataGridColumnSelector__item'>
              <EuiFlexGroup
                responsive={false}
                gutterSize='m'
                alignItems='center'
              >
                <EuiFlexItem>
                  <EuiSwitch
                    name={id}
                    label={name}
                    checked={visibleColumns.includes(id)}
                    compressed
                    className='euiSwitch--mini'
                    onChange={event => {
                      const {
                        target: { checked },
                      } = event;

                      let nextVisibleColumns;

                      if (checked) {
                        if (!visibleColumns.includes(id)) {
                          nextVisibleColumns = [...visibleColumns, id];
                        }
                      } else {
                        if (visibleColumns.includes(id)) {
                          nextVisibleColumns = visibleColumns.filter(
                            (visibleColumnId: string) => visibleColumnId !== id,
                          );
                        }
                      }
                      if (nextVisibleColumns) {
                        setVisibleColumns(nextVisibleColumns);
                      }
                    }}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </div>
          );
        })}
      </div>
    </EuiPopover>
  );
};
