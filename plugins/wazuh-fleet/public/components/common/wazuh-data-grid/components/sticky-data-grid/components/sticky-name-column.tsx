import React from 'react';
import { StickyNameColumnProps } from '../types/sticky-data-grid.types';

export const StickyNameColumn: React.FC<StickyNameColumnProps> = ({
  data,
  column,
  nameColumnWidth,
  renderCellValue,
  marginTop
}) => {
  return (
    <div
      className="sticky-column-wrapper name-column"
      style={{
        left: 68, // Width of checkbox + inspect columns
        top: marginTop,
        zIndex: 3,
        width: nameColumnWidth,
        minWidth: nameColumnWidth
      }}
    >
      {data.map((agent, i) => (
        <div
          key={i}
          className="sticky-cell name-cell"
          style={{
            width: nameColumnWidth,
            minWidth: nameColumnWidth,
            overflow: 'hidden',
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
};
