import React, { memo, forwardRef } from 'react';
import { StickyCheckboxColumnProps } from '../types/sticky-data-grid.types';

const StableCheckboxRow = memo(({ index, renderCheckboxRow }: {
  index: number,
  renderCheckboxRow: (props: any) => React.ReactNode
}) => {
  return (
    <div className="sticky-cell checkbox-cell">
      {renderCheckboxRow({
        visibleRowIndex: index,
        rowIndex: index
      })}
    </div>
  );
});

export const StickyCheckboxColumn = memo(forwardRef<HTMLDivElement, StickyCheckboxColumnProps>(({
  maxRows,
  renderCheckboxRow,
  style
}, ref) => {
  const rowIndices = Array.from({ length: maxRows }, (_, i) => i);

  return (
    <div
      className="sticky-column-wrapper with-scroll sync-scroll"
      style={style}
      ref={ref}
    >
      {rowIndices.map(index => (
        <StableCheckboxRow
          key={index}
          index={index}
          renderCheckboxRow={renderCheckboxRow}
        />
      ))}
    </div>
  );
}));
