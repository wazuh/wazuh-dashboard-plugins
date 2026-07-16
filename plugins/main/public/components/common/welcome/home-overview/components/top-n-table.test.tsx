import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopNTable } from './top-n-table';

const items = [
  { key: 'Ubuntu 24.04.2 LTS', count: 2 },
  { key: 'macOS 26.2', count: 35682 },
];

describe('TopNTable', () => {
  it('renders the key column name and rows with comma-formatted counts', () => {
    render(<TopNTable items={items} keyColumnName='Operating system' />);
    // EuiBasicTable renders desktop + mobile cells, so text can appear twice.
    expect(screen.getAllByText('Operating system').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ubuntu 24.04.2 LTS').length).toBeGreaterThan(0);
    // formatUINumber uses en-US grouping
    expect(screen.getAllByText('35,682').length).toBeGreaterThan(0);
  });

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
});
