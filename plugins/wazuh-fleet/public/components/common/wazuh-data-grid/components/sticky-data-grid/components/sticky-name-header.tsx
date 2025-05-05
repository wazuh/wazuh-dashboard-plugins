import React, { useState } from 'react';
import {
  EuiPopover,
  EuiIcon,
  EuiContextMenuItem,
  EuiContextMenuPanel,
} from '@elastic/eui';
import { StickyNameHeaderProps } from '../types/sticky-data-grid.types';


export const StickyNameHeader: React.FC<StickyNameHeaderProps> = ({
  column,
  marginTop,
  nameColumnWidth,
  sorting,
  rowSizes
}) => {
  const [isNameHeaderPopoverOpen, setIsNameHeaderPopoverOpen] = useState(false);

  const nameColumnMenuItems = [
    <EuiContextMenuItem
      key="sortAsc"
      icon="sortUp"
      onClick={() => {
        if (sorting?.onSort) {
          sorting.onSort([{ id: column?.id, direction: 'asc' }]);
        }
        setIsNameHeaderPopoverOpen(false);
      }}
    >
      Sort A-Z
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="sortDesc"
      icon="sortDown"
      onClick={() => {
        if (sorting?.onSort) {
          sorting.onSort([{ id: column?.id, direction: 'desc' }]);
        }
        setIsNameHeaderPopoverOpen(false);
      }}
    >
      Sort Z-A
    </EuiContextMenuItem>
  ];

  return (
    <>
      {column && (
        <div
          className="sticky-header-name"
          style={{
            height: rowSizes.headerRowHeight,
            left: rowSizes.dataRowHeight * 2, // Width of checkbox + inspect column
            top: marginTop,
            width: nameColumnWidth,
            minWidth: nameColumnWidth,
          }}
          onClick={() => setIsNameHeaderPopoverOpen(!isNameHeaderPopoverOpen)}
        >
          <EuiPopover
            size="s"
            button={
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: nameColumnWidth - 20,
                }}
              >
                <span>{column?.displayAsText || column?.id}</span>
                <EuiIcon type="arrowDown" size="s" color="subdued" />
              </div>
            }
            isOpen={isNameHeaderPopoverOpen}
            closePopover={() => setIsNameHeaderPopoverOpen(false)}
            panelPaddingSize="none"
            anchorPosition="downLeft"
          >
            <EuiContextMenuPanel
              size="s"
              items={nameColumnMenuItems}
            />
          </EuiPopover>
        </div>
      )}
    </>
  );
};
