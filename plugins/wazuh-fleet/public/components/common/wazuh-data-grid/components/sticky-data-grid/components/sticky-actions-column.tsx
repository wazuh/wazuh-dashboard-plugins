import React from 'react';
import { EuiButtonIcon, EuiPopover, EuiIcon } from '@elastic/eui';
import { StickyActionsColumnProps } from '../types/sticky-data-grid.types';


export const StickyActionsColumn: React.FC<StickyActionsColumnProps> = ({
  data,
  actionsColumn,
  toggleActionPopover,
  actionPopoverOpen,
  marginTop
}) => {
  return (
    <div
      className="sticky-column-wrapper actions-wrapper"
      style={{
        top: marginTop
      }}
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
};
