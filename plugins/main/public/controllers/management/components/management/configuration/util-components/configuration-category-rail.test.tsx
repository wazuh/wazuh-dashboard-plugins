import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import WzConfigurationCategoryRail from './configuration-category-rail';

describe('WzConfigurationCategoryRail', () => {
  const groups = [
    {
      title: 'Main configurations',
      categories: [
        {
          id: 'global-configuration',
          title: 'Global Configuration',
          entriesCount: 3,
        },
        { id: 'cluster', title: 'Cluster', entriesCount: 1 },
      ],
    },
  ];

  it('renders every category with its title and entries count', () => {
    render(
      <WzConfigurationCategoryRail
        groups={groups}
        selectedCategoryId={null}
        onSelectCategory={jest.fn()}
      />,
    );

    expect(screen.getByText('Main configurations')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Global Configuration/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cluster/ })).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('marks the selected category as current and calls back on click', () => {
    const onSelectCategory = jest.fn();
    render(
      <WzConfigurationCategoryRail
        groups={groups}
        selectedCategoryId='cluster'
        onSelectCategory={onSelectCategory}
      />,
    );

    const clusterButton = screen.getByRole('button', { name: /Cluster/ });
    expect(clusterButton).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('button', { name: /Global Configuration/ }),
    ).not.toHaveAttribute('aria-current');

    fireEvent.click(
      screen.getByRole('button', { name: /Global Configuration/ }),
    );

    expect(onSelectCategory).toHaveBeenCalledWith('global-configuration');
  });
});
