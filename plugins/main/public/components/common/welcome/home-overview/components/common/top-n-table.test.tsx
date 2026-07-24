import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopNTable } from './top-n-table';

const items = [
  { key: 'Ubuntu 24.04.2 LTS', count: 2 },
  { key: 'macOS 26.2', count: 35682 },
];

describe('TopNTable', () => {
  it('supports a custom key renderer for clickable rows', () => {
    const onClick = jest.fn();
    render(
      <TopNTable
        items={items}
        keyColumnName='Technique'
        renderKey={item => <a onClick={() => onClick(item.key)}>{item.key}</a>}
      />,
    );
    fireEvent.click(screen.getAllByText('macOS 26.2')[0]);
    expect(onClick).toHaveBeenCalledWith('macOS 26.2');
  });

  it('renders a custom noItemsMessage instead of the OUI default when empty', () => {
    render(
      <TopNTable
        items={[]}
        keyColumnName='Operating system'
        noItemsMessage='No operating systems found'
      />,
    );
    expect(
      screen.getAllByText('No operating systems found').length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText('No items found')).not.toBeInTheDocument();
  });
});
