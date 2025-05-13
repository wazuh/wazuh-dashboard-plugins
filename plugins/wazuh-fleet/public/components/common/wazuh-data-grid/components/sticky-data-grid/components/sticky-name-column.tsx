import React, { forwardRef } from 'react';
import { StickyNameColumnProps } from '../types/sticky-data-grid.types';

export const StickyNameColumn = forwardRef<HTMLDivElement, StickyNameColumnProps>(({
  data,
  column,
  nameColumnWidth,
  renderCellValue,
  style
}, ref) => {
  return (
    <div
      className="sticky-column-wrapper with-scroll sync-scroll name-column"
      style={{
        left: 68, // Width of checkbox + inspect columns
        width: nameColumnWidth,
        minWidth: nameColumnWidth,
        ...style
      }}
      ref={ref}
    >
      {data.map((agent, i) => (
        <div
          key={i}
          className="sticky-cell name-cell"
          style={{
            width: nameColumnWidth,
            minWidth: nameColumnWidth,
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          <div
            style={{
              color: '#006BB4',
              cursor: 'pointer',
              width: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {renderCellValue({ rowIndex: i, columnId: column.id })}
          </div>
        </div>
      ))}
    </div>
  );
});
