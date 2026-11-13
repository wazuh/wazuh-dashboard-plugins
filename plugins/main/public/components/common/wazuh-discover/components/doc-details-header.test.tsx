import React from 'react';
import { render, screen } from '@testing-library/react';
import DocDetailsHeader from './doc-details-header';

jest.mock(
  '../../../../../../../src/plugins/opensearch_dashboards_react/public',
  () => ({
    RedirectAppLinks: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  }),
);

jest.mock('../../../../kibana-services', () => ({
  getCore: () => ({ application: {} }),
}));

jest.mock('../../../../react-services/navigation-service', () => ({
  getInstance: () => ({
    getUrlForApp: (app: string, { path }: { path: string }) =>
      `/app/${app}${path}`,
  }),
}));

describe('DocDetailsHeader', () => {
  beforeEach(() => {
    render(
      <DocDetailsHeader
        doc={{ _id: 'doc-1', _index: 'index-1' }}
        indexPattern={{ id: 'pattern-1' }}
      />,
    );
  });

  it('renders the default title', () => {
    expect(screen.getByRole('heading').textContent).toBe('Document Details');
  });

  it.each([
    ['View surrounding documents', '/app/discover#/context/pattern-1/doc-1'],
    ['View single document', '/app/discover#/doc/pattern-1/index-1?id=doc-1'],
  ])('links "%s" to %s in a new tab', (text, href) => {
    const link = screen.getByText(text).closest('a');

    expect(link?.getAttribute('href')).toBe(href);
    expect(link?.getAttribute('target')).toBe('_blank');
  });
});
