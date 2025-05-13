import React from 'react';
import {
  EuiDataGrid
} from '@elastic/eui';
import { StickyNameHeader } from './components/sticky-name-header';
import { StickyCheckboxColumn } from './components/sticky-checkbox-column';
import './sticky-grid.scss';

import { StickyInspectColumn } from './components/sticky-inspect-column';
import { StickyNameColumn } from './components/sticky-name-column';
import { StickyActionsColumn } from './components/sticky-actions-column';
import { StickyGridViewProps } from './types/sticky-data-grid.types';

/**
 * @component StickyDataGrid
 * @description Component that combines an EuiDataGrid with sticky columns to improve user experience
 * @param {StickyGridViewProps} props - Component props
 * @returns {React.ReactElement} Rendered StickyDataGrid component
 */
const StickyDataGrid: React.FC<StickyGridViewProps> = ({
  dataGridProps,
  stickyDataGridProps,
  toolbarVisibility,
}) => {

  const {
    gridRef,
    actionPopoverOpen,
    toggleActionPopover,
    nameColumnWidth,
    dataGridControlsHeight,
    rowSizes,
    agentsRows,
    onClickInspectDoc,
    actionsColumn,
    rowCount,
    actionsColumnRight,
    isFullScreen,
    checkboxColumnRef,
    inspectColumnRef,
    nameColumnRef,
    actionsColumnRef,
    getStickyColumnStyle
  } = stickyDataGridProps;

  const { columns, renderCellValue, sorting } = dataGridProps;

  const renderCheckboxRow = dataGridProps.leadingControlColumns.find((column) => column.id === 'checkbox')?.rowStickyCellRender;
  const columnName = columns?.[0];

  const stickyColumnStyle = getStickyColumnStyle?.();

  return (
    <div
      style={{
        position: isFullScreen ? 'static' : 'relative',
        marginBottom: 0
      }}
    >
      {/* STICKY COMPONENTS - Left side columns */}
      {columns.length > 0 && renderCheckboxRow && (
        <StickyCheckboxColumn
          maxRows={agentsRows.length}
          renderCheckboxRow={renderCheckboxRow}
          style={stickyColumnStyle}
          ref={checkboxColumnRef}
        />
      )}

      {/* STICKY COMPONENTS - Inspect column */}
      <StickyInspectColumn
        data={agentsRows}
        onClickInspectDoc={onClickInspectDoc}
        style={stickyColumnStyle}
        ref={inspectColumnRef}
      />

      {/* STICKY COMPONENTS - Name column header */}
      <StickyNameHeader
        column={columnName}
        marginTop={dataGridControlsHeight}
        rowSizes={rowSizes}
        nameColumnWidth={nameColumnWidth}
        sorting={sorting}
      />

      {/* STICKY COMPONENTS - Name column data */}
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

      {/* STICKY COMPONENTS - Actions column (right side) */}
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

      {/* ELASTIC UI COMPONENT - Main data grid */}
      <div ref={gridRef} className="sticky-grid-container">
        <EuiDataGrid
          rowCount={rowCount}
          toolbarVisibility={toolbarVisibility}
          {...dataGridProps}
        />
      </div>
    </div>
  );
};

export default StickyDataGrid;
