/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MenuItemPosition, TopNavMenu, TopNavMenuItem } from './top-nav-menu';
import { render } from '@testing-library/react';

describe('TopNavMenu Component', () => {
  const mockedItems: TopNavMenuItem[] = [
    {
      id: 'foo',
      label: 'foo',
      description: 'foo',
      onClick: jest.fn(),
      testId: 'foo',
      position: MenuItemPosition.LEFT,
    },
    {
      id: 'bar',
      label: 'bar',
      description: 'bar',
      onClick: jest.fn(),
      testId: 'bar',
      position: MenuItemPosition.RIGHT,
    },
  ];
  it('should render correctly when not use updatedUX', () => {
    const { container } = render(
      <TopNavMenu items={mockedItems} useUpdatedUX={false} />,
    );
    expect(container).toMatchSnapshot();
  });
  it('should render correctly when use updatedUX', () => {
    const { container } = render(
      <TopNavMenu items={mockedItems} useUpdatedUX />,
    );
    expect(container).toMatchSnapshot();
  });

  it('does not trigger a unique-key console warning when an item defines renderWrapper', () => {
    const itemsWithWrapper: TopNavMenuItem[] = [
      ...mockedItems,
      {
        id: 'api-reference',
        label: 'API Reference',
        description: 'API Reference',
        onClick: jest.fn(),
        testId: 'apiReference',
        renderWrapper: ({ children, ['data-test-subj']: dataTestSubj }) => (
          <a data-test-subj={dataTestSubj} href='#'>
            {children}
          </a>
        ),
        position: MenuItemPosition.LEFT,
      },
    ];

    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(<TopNavMenu items={itemsWithWrapper} useUpdatedUX={false} />);

    const hasKeyWarning = consoleError.mock.calls.some(args =>
      args.some(
        arg => typeof arg === 'string' && arg.includes('unique "key" prop'),
      ),
    );
    expect(hasKeyWarning).toBe(false);

    consoleError.mockRestore();
  });
});
