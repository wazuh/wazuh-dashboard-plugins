import React, { useState, forwardRef } from 'react';
import { EuiBasicTable, EuiBasicTableProps, EuiButtonIcon } from '@elastic/eui';
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
function getItemWithExpandableId(items, id, isExpandableRowOnClickId: string) {
  return items.find(
    item =>
      expandableItemGetId(item, isExpandableRowOnClickId) ===
      _expandableItemGetId(id),
  );
}

function expandableItemGetId(item, isExpandableRowOnClickId: string) {
  return String(get(item, isExpandableRowOnClickId));
}

export type WzBasicTableManageExpandedItemsProps = EuiBasicTableProps & {
  isExpandableRowOnClickId?: string;
  expandableRowButtonSide: 'left' | ' right';
  ExpandableRowContent: any;
};
/* This is a wrapped of EuiBasicTable that manages the expanded row and resets the expanded rows
visibility if any item changed. */
export const WzBasicTableManageExpandedItems: React.FunctionComponent<WzBasicTableManageExpandedItemsProps> =
  forwardRef(
    (
      {
        rowProps,
        isExpandableRowOnClickId,
        ExpandableRowContent,
        expandableRowButtonSide = 'right',
        columns,
        ...props
      }: WzBasicTableManageExpandedItemsProps,
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
          const id = String(get(item, isExpandableRowOnClickId)); // Ensure this is a string
          const newState = { ...state };
          if (newState[id]) {
            delete newState[id];
          } else {
            newState[id] = true;
          }
          return newState;
        });
      };

      const enhancedRowProps = rowProps
        ? decorateRowProps(rowProps, {
            expandOnClick:
              isExpandableRowOnClickId &&
              ((onClick, item) => {
                return (...args) => {
                  toggleExpandedRow(item);
                  onClick?.(...args);
                };
              }),
          })
        : rowProps;

      const itemIdToExpandedRowMap =
        expandableRows &&
        ExpandableRowContent &&
        Object.fromEntries(
          Object.keys(expandableRows)
            .map(key => {
              const item = getItemWithExpandableId(
                props.items,
                key,
                isExpandableRowOnClickId,
              );
              return [key, <ExpandableRowContent item={item} />];
            })
            .filter(([_, render]) => render), // Ensure there is a render
        );

      const isExpandable = Boolean(isExpandableRowOnClickId);
      const enhancedTableColumns = isExpandable
        ? [
            ...(expandableRowButtonSide === 'left'
              ? [
                  {
                    // align: 'left',
                    width: '40px',
                    isExpander: true,
                    render: item => {
                      const id = _expandableItemGetId(
                        get(item, isExpandableRowOnClickId),
                      );
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
                    align: 'right',
                    width: '40px',
                    isExpander: true,
                    render: item => {
                      const id = _expandableItemGetId(
                        get(item, isExpandableRowOnClickId),
                      );
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
          itemId={isExpandableRowOnClickId}
          columns={enhancedTableColumns}
          {...props}
        />
      );
    },
  );
