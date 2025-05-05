import React, { memo } from 'react';
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

export const StickyCheckboxColumn: React.FC<StickyCheckboxColumnProps> = memo(({
  maxRows,
  marginTop,
  renderCheckboxRow
}) => {
  const rowIndices = Array.from({ length: maxRows }, (_, i) => i);

  return (
    <div
      className="sticky-column-wrapper"
      style={{
        top: marginTop,
      }}
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
});
