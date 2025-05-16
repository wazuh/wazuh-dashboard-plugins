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
  EuiDragDropContext,
  EuiDroppable,
  EuiDraggable,
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
  const filteredColumns = (
    searchValue
      ? availableColumns.filter(({ name, displayAsText }) => {
          const displayName = displayAsText || name;
          return displayName.toLowerCase().includes(searchValueLowerCase);
        })
      : availableColumns
  ).slice(0, maxAvailableColumns);

  // Sort filtered columns according to the current order of visibleColumns
  const orderedFilteredColumns = [...filteredColumns].sort((a, b) => {
    const aIndex = visibleColumns.indexOf(a.id);
    const bIndex = visibleColumns.indexOf(b.id);

    // If both columns are in visibleColumns, sort by position
    if (aIndex >= 0 && bIndex >= 0) {
      return aIndex - bIndex;
    }

    // If only one column is in visibleColumns, put it first
    if (aIndex >= 0) return -1;
    if (bIndex >= 0) return 1;

    // If neither is in visibleColumns, maintain original order
    return 0;
  });

  const controlBtnClasses = classNames('euiDataGrid__controlBtn', {
    // TODO: research if this is required
    // 'euiDataGrid__controlBtn--active':
    //   availableColumns.length - visibleColumns.length > 0,
  });

  // Handle reordering event
  const onDragEnd = ({ source, destination }) => {
    if (!destination) {
      return;
    }

    const sourceIdx = source.index;
    const destinationIdx = destination.index;

    if (sourceIdx === destinationIdx) {
      return;
    }

    const reorderedVisibleColumns = [...visibleColumns];

    // Get the ID of the column being moved
    const movedColumnId = orderedFilteredColumns[sourceIdx].id;

    // If the column is not in visible columns, do nothing
    if (!visibleColumns.includes(movedColumnId)) {
      return;
    }

    const currentIndex = reorderedVisibleColumns.indexOf(movedColumnId);

    // Calculate new index based on destination
    let newIndex = currentIndex;

    // Determine direction of movement
    if (sourceIdx < destinationIdx) {
      // Moving downward
      const targetColumnId = orderedFilteredColumns[destinationIdx].id;
      if (visibleColumns.includes(targetColumnId)) {
        newIndex = visibleColumns.indexOf(targetColumnId);
      } else {
        // If destination is not in visible columns, move to end
        newIndex = visibleColumns.length - 1;
      }
    } else {
      // Moving upward
      const targetColumnId = orderedFilteredColumns[destinationIdx].id;
      if (visibleColumns.includes(targetColumnId)) {
        newIndex = visibleColumns.indexOf(targetColumnId);
      } else {
        // If destination is not in visible columns, move to start
        newIndex = 0;
      }
    }

    // Remove column from current position
    reorderedVisibleColumns.splice(currentIndex, 1);

    // Insert column in new position
    reorderedVisibleColumns.splice(newIndex, 0, movedColumnId);

    // Update visible columns
    setVisibleColumns(reorderedVisibleColumns);
  };

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
          {availableColumns.length > maxAvailableColumns && (
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
          )}
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
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setSearchValue(event.currentTarget.value)
          }
        />
      </EuiPopoverTitle>
      <div className='euiDataGrid__controlScroll'>
        <EuiDragDropContext onDragEnd={onDragEnd}>
          <EuiDroppable droppableId="columnsList">
            {orderedFilteredColumns.map(({ name, displayAsText, id }, index) => (
              <EuiDraggable key={id} index={index} draggableId={id} customDragHandle={true}>
                {(provided) => (
                  <div className='euiDataGridColumnSelector__item'>
                    <EuiFlexGroup responsive={false} gutterSize='m' alignItems='center'>
                      {/* Switch to enable/disable column */}
                      <EuiFlexItem>
                        <EuiSwitch
                          name={id}
                          label={displayAsText || name}
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

                      {/* Sort icon */}
                      <EuiFlexItem grow={false}>
                        <div
                          {...provided.dragHandleProps}
                          style={{
                            cursor: visibleColumns.includes(id) ? 'grab' : 'default',
                            visibility: visibleColumns.includes(id) ? 'visible' : 'hidden',
                            width: '16px'
                          }}
                        >
                          <EuiIcon type="grab" color="subdued" />
                        </div>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </div>
                )}
              </EuiDraggable>
            ))}
          </EuiDroppable>
        </EuiDragDropContext>
      </div>
    </EuiPopover>
  );
};
