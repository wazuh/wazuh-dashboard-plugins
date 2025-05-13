import React, { forwardRef } from 'react';
import { EuiButtonIcon } from '@elastic/eui';
import { StickyInspectColumnProps } from '../types/sticky-data-grid.types';

export const StickyInspectColumn = forwardRef<HTMLDivElement, StickyInspectColumnProps>(({
  data,
  onClickInspectDoc,
  style
}, ref) => {
  return (
    <div
      className="sticky-column-wrapper with-scroll sync-scroll"
      style={{
        left: 32, // Width of checkbox column
        ...style
      }}
      ref={ref}
    >
      {data.map((agent, i) => (
        <div key={i} className="sticky-cell inspect-cell">
          <EuiButtonIcon
            aria-label={`Inspect row ${i}`}
            iconType="inspect"
            onClick={() => onClickInspectDoc(agent)}
            size="s"
          />
        </div>
      ))}
    </div>
  );
});
