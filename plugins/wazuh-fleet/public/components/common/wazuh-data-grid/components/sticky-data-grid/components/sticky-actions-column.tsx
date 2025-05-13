import React, { forwardRef } from 'react';
import { EuiButtonIcon, EuiPopover, EuiIcon } from '@elastic/eui';
import { StickyActionsColumnProps } from '../types/sticky-data-grid.types';

export const StickyActionsColumn = forwardRef<HTMLDivElement, StickyActionsColumnProps>(({
  data,
  actionsColumn,
  toggleActionPopover,
  actionPopoverOpen,
  style,
}, ref) => {
  return (
    <div
      className="sticky-column-wrapper with-scroll sync-scroll actions-wrapper"
      style={style}
      ref={ref}
    >
      {data.map((agent, i) => (
        <div key={i} className="sticky-cell actions-cell">
          <EuiPopover
            button={
              <EuiButtonIcon
                aria-label={`Actions for row ${i}`}
                iconType="boxesHorizontal"
                onClick={() => toggleActionPopover(i)}
                size="s"
              />
            }
            isOpen={actionPopoverOpen === i}
            closePopover={() => toggleActionPopover(i)}
            panelPaddingSize="none"
            anchorPosition="upCenter"
          >
            <div className="actions-popover-panel">
              <div className="actions-popover-header">Actions</div>
              <div className="actions-popover-content">
                {actionsColumn.map((action, index) => (
                  <div
                    key={index}
                    className="actions-popover-item"
                    onClick={() => {
                      action.onClick(null, agent);
                      toggleActionPopover(i);
                    }}
                  >
                    <EuiIcon type={action.icon} />
                    <span>{action.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </EuiPopover>
        </div>
      ))}
    </div>
  );
});
