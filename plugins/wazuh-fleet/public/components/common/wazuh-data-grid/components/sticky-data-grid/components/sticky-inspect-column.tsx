import React from 'react';
import { EuiButtonIcon } from '@elastic/eui';
import { StickyInspectColumnProps } from '../types/sticky-data-grid.types';

export const StickyInspectColumn: React.FC<StickyInspectColumnProps> = ({
  data,
  onClickInspectDoc,
  marginTop
}) => {
  return (
    <div
      className="sticky-column-wrapper"
      style={{
        left: 32, // Width of checkbox column
        top: marginTop,
        zIndex: 3
      }}
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
};
