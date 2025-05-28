import React from 'react';
import { StickyNameHeader } from './components/sticky-name-header';
import { StickyCheckboxColumn } from './components/sticky-checkbox-column';
import { StickyInspectColumn } from './components/sticky-inspect-column';
import { StickyNameColumn } from './components/sticky-name-column';
import { StickyActionsColumn } from './components/sticky-actions-column';
import { StickyGridViewProps } from './types/sticky-data-grid.types';
import './sticky-grid.scss';

const StickyColumns: React.FC<StickyGridViewProps> = ({
  stickyDataGridProps,
  dataGridProps
}) => {
  const {
    actionPopoverOpen,
    toggleActionPopover,
    nameColumnWidth,
    dataGridControlsHeight,
    rowSizes,
    agentsRows,
    onClickInspectDoc,
    actionsColumn,
    actionsColumnRight,
    checkboxColumnRef,
    inspectColumnRef,
    nameColumnRef,
    actionsColumnRef,
    getStickyColumnStyle
  } = stickyDataGridProps;

  const { columns, renderCellValue, sorting } = dataGridProps;

  const renderCheckboxRow = dataGridProps.leadingControlColumns.find((column) => column.id === 'checkbox-sticky')?.rowStickyCellRender;
  const columnName = columns?.[0];

  const stickyColumnStyle = getStickyColumnStyle?.();

  return (
    <>
      {columns.length > 0 && renderCheckboxRow && (
        <StickyCheckboxColumn
          maxRows={agentsRows?.length}
          renderCheckboxRow={renderCheckboxRow}
          style={stickyColumnStyle}
          ref={checkboxColumnRef}
        />
      )}
      <StickyInspectColumn
        data={agentsRows}
        onClickInspectDoc={onClickInspectDoc}
        style={stickyColumnStyle}
        ref={inspectColumnRef}
      />
      <StickyNameHeader
        column={columnName}
        marginTop={dataGridControlsHeight}
        rowSizes={rowSizes}
        nameColumnWidth={nameColumnWidth}
        sorting={sorting}
      />
      {columns.length > 0 && (
        <StickyNameColumn
          data={agentsRows}
          column={columnName}
          nameColumnWidth={nameColumnWidth}
          renderCellValue={renderCellValue}
          style={stickyColumnStyle}
          ref={nameColumnRef}
        />
      )}
      <StickyActionsColumn
        data={agentsRows}
        actionsColumn={actionsColumn}
        toggleActionPopover={toggleActionPopover}
        actionPopoverOpen={actionPopoverOpen}
        style={{
          ...stickyColumnStyle,
          right: actionsColumnRight
        }}
        ref={actionsColumnRef}
      />
    </>
  );
};

export default StickyColumns;
