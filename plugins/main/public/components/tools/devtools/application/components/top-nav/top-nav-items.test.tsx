/*
 * Tests for top-nav items rendering, ensuring the API Reference
 * button exposes an href so browsers show the URL on hover.
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { TopNavMenu } from './top-nav-menu';
import { getTopNavConfig } from './get-top-nav';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

describe('top-nav items', () => {
  const items = getTopNavConfig({ onClickExport: jest.fn() });

  it('renders API Reference as an anchor with href in legacy UX', () => {
    const { container } = render(
      <TopNavMenu items={items} />,
    );

    const apiRef = container.querySelector(
      '[data-test-subj="consoleApiReferenceButton"]',
    ) as HTMLAnchorElement | null;

    expect(apiRef).toBeTruthy();
    // Should be an <a> with proper attributes so the URL shows on hover
    expect(apiRef?.getAttribute('href')).toBe(
      webDocumentationLink('user-manual/api/reference.html'),
    );
    expect(apiRef).toHaveAttribute('target', '_blank');
    expect(apiRef).toHaveAttribute('rel');
    expect(apiRef?.getAttribute('rel') || '').toContain('noopener');
    expect(apiRef?.getAttribute('rel') || '').toContain('noreferrer');
  });

  it('renders API Reference as an anchor with href in updated UX', () => {
    const { container } = render(
      <TopNavMenu items={items} useUpdatedUX={true} />,
    );
    const apiRef = container.querySelector(
      '[data-test-subj="consoleApiReferenceButton"]',
    ) as HTMLAnchorElement | null;

    expect(apiRef).toBeTruthy();
    // Should be an <a> with proper attributes so the URL shows on hover
    expect(apiRef?.getAttribute('href')).toBe(
      webDocumentationLink('user-manual/api/reference.html'),
    );
    expect(apiRef).toHaveAttribute('target', '_blank');
    expect(apiRef).toHaveAttribute('rel');
    expect(apiRef?.getAttribute('rel') || '').toContain('noopener');
    expect(apiRef?.getAttribute('rel') || '').toContain('noreferrer');
  });
});

