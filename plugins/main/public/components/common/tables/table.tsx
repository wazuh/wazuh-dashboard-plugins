import React, { useState, forwardRef } from 'react';
import { EuiBasicTable, EuiBasicTableProps, EuiButtonIcon } from '@elastic/eui';
import { RIGHT_ALIGNMENT, LEFT_ALIGNMENT } from '@elastic/eui/lib/services';
import { get } from 'lodash';
import { useEffectEnsureComponentMounted } from '../hooks';

function decorateRowProps(
  fn,
  options: { expandOnClick: (onClick: Function, ...args: any[]) => Function },
) {
  return (item, index) => {
    const result = fn(item, index);

    if (options.expandOnClick) {
      result.onClick = options.expandOnClick(result.onClick, item, index);
    }
    return result;
  };
}

function _expandableItemGetId(id: any): string {
  return String(id);
}
function getItemWithExpandableId(items, id, itemId: string) {
  return items.find(
    item => expandableItemGetId(item, itemId) === _expandableItemGetId(id),
  );
}

function expandableItemGetId(item, itemId: string) {
  return String(get(item, itemId));
}

export type TableBasicManageExpandedItemsProps = EuiBasicTableProps & {
  itemId?: string;
  expandableRowButtonSide: 'left' | 'right';
  ExpandableRowContent: any;
  expandRowOnClick: boolean;
};
/* This is a wrapped of EuiBasicTable that manages the expanded row and resets the expanded rows
visibility if any item changed. */
export const TableBasicManageExpandedItems: React.FunctionComponent<TableBasicManageExpandedItemsProps> =
  forwardRef(
    (
      {
        rowProps,
        itemId,
        ExpandableRowContent,
        expandableRowButtonSide = 'right',
        expandRowOnClick = false,
        columns,
        ...props
      }: TableBasicManageExpandedItemsProps,
      ref,
    ) => {
      const [expandableRows, setExpandableRows] = useState({});

      // Reset the expanded row visibility if any item changed.
      useEffectEnsureComponentMounted(
        () => setExpandableRows({}),
        [props.items],
      );

      const toggleExpandedRow = item => {
        setExpandableRows(state => {
          const id = String(get(item, itemId)); // Ensure this is a string
          const newState = { ...state };
          if (newState[id]) {
            delete newState[id];
          } else {
            newState[id] = true;
          }
          return newState;
        });
      };

      const internalRowProps = rowProps || (expandRowOnClick && (() => ({})));

      const enhancedRowProps = internalRowProps
        ? decorateRowProps(internalRowProps, {
            expandOnClick:
              expandRowOnClick &&
              ((onClick, item) => {
                return (...args) => {
                  toggleExpandedRow(item);
                  onClick?.(...args);
                };
              }),
          })
        : internalRowProps;

      const itemIdToExpandedRowMap =
        expandableRows &&
        ExpandableRowContent &&
        Object.fromEntries(
          Object.keys(expandableRows)
            .map(key => {
              const item = getItemWithExpandableId(props.items, key, itemId);
              return [key, <ExpandableRowContent item={item} />];
            })
            .filter(([_, render]) => render), // Ensure there is a render
        );

      const isExpandable = Boolean(itemId);
      const enhancedTableColumns = isExpandable
        ? [
            ...(expandableRowButtonSide === 'left'
              ? [
                  {
                    // align: 'left',
                    width: '40px',
                    isExpander: true,
                    render: item => {
                      const id = _expandableItemGetId(get(item, itemId));
                      const isExpanded = expandableRows[id];
                      return (
                        <EuiButtonIcon
                          onClick={event => {
                            event.stopPropagation(); /* This avoids the double execution of toggleExpandedRow
                    causing the expanded row does not change its display state. */
                            toggleExpandedRow(item);
                          }}
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          iconType={isExpanded ? 'arrowUp' : 'arrowDown'}
                        />
                      );
                    },
                  },
                ]
              : []),
            ...columns,
            ...(expandableRowButtonSide !== 'left'
              ? [
                  {
                    align: RIGHT_ALIGNMENT,
                    width: '40px',
                    isExpander: true,
                    render: item => {
                      const id = _expandableItemGetId(get(item, itemId));
                      const isExpanded = expandableRows[id];
                      return (
                        <EuiButtonIcon
                          onClick={event => {
                            event.stopPropagation(); /* This avoids the double execution of toggleExpandedRow
                    causing the expanded row does not change its display state. */
                            toggleExpandedRow(item);
                          }}
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          iconType={isExpanded ? 'arrowUp' : 'arrowDown'}
                        />
                      );
                    },
                  },
                ]
              : []),
          ]
        : columns;

      return (
        <EuiBasicTable
          ref={ref}
          rowProps={enhancedRowProps}
          isExpandable={isExpandable}
          itemIdToExpandedRowMap={isExpandable && itemIdToExpandedRowMap}
          itemId={itemId}
          columns={enhancedTableColumns}
          {...props}
        />
      );
    },
  );
