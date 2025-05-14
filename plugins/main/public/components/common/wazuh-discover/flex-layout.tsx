import React from 'react';
import './flex-layout.scss';
import classnames from 'classnames';

interface WzTableFlexGroupProps {
  gutterSize?: 'xs' | 's' | 'm' | 'l';
  children: any;
}

/**
 * Component to render a row but using display as table
 * @param param0
 * @returns
 */
export const WzTableFlexGroup = ({
  children,
  gutterSize = 'm',
}: WzTableFlexGroupProps) => {
  const gutterSizeClass = ['xs', 's', 'm', 'l'].includes(gutterSize)
    ? `wz-table-flex-row-gutter-size-${gutterSize}`
    : undefined;
  return (
    <div
      className={classnames(
        'wz-table-flex-row',
        'wz-table-flex-row-grow-height',
        gutterSizeClass,
      )}
    >
      {children}
    </div>
  );
};

/**
 * Component to render a item row but using display as table-cell.
 * Ensure to render a child, if you want to render multiple sibling components, then wrap them
 * in a div.
 * @param param0
 * @returns
 */
export const WzTableFlexItem = ({ children }) => {
  return <div className='wz-table-flex-item'>{children}</div>;
};
