import React from 'react';
import {
  EuiDataGrid
} from '@elastic/eui';
import './sticky-grid.scss';

import { StickyGridViewProps } from './types/sticky-data-grid.types';
import StickyColumns from './sticky-columns';

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
    rowCount,
    isFullScreen,
  } = stickyDataGridProps;

  const { dataGridMode } = dataGridProps;

  return (
    <div
      style={{
        position: isFullScreen ? 'static' : 'relative',
        marginBottom: 0
      }}
    >
      {dataGridMode === 'sticky' && (
        <StickyColumns
          stickyDataGridProps={stickyDataGridProps}
          dataGridProps={dataGridProps}
        />
      )}
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
