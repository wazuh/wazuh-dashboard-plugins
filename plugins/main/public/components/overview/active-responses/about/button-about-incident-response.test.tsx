import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { ButtonAboutIncidentResponse } from './button-about-incident-response';

const mockApplications$ = new BehaviorSubject<ReadonlyMap<string, unknown>>(
  new Map(),
);

jest.mock('../../../../kibana-services', () => ({
  getCore: () => ({
    application: {
      applications$: mockApplications$,
      getUrlForApp: (appId: string, options?: { path?: string }) =>
        `/app/${appId}${options?.path ?? ''}`,
      navigateToApp: jest.fn(),
    },
  }),
}));
jest.mock(
  '../../../../../../../src/plugins/opensearch_dashboards_react/public',
  () => ({
    RedirectAppLinks: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  }),
);
jest.mock('../../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));
jest.mock('../../../common/welcome/home-overview/utils/navigation', () => ({
  getCreateActiveResponseUrl: () =>
    '/app/active-responses#/create-active-response',
  isActiveResponsesRegistered: (applications: ReadonlyMap<string, unknown>) =>
    applications.has('active-responses'),
}));

const openFlyout = () => {
  render(<ButtonAboutIncidentResponse />);
  fireEvent.click(
    screen.getByRole('button', { name: 'About Incident Response' }),
  );
};

describe('ButtonAboutIncidentResponse', () => {
  it('explains active responses and their terms, and links to the docs', () => {
    mockApplications$.next(new Map());
    openFlyout();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(
      'An active response is an automatic action',
    );
    expect(dialog).toHaveTextContent('Location');
    expect(dialog).toHaveTextContent(
      'Other values are a specific agent (defined-agent) or every agent (all).',
    );
    expect(dialog).not.toHaveTextContent('server');
    expect(dialog).toHaveTextContent('stateless');
    ['executable', 'location', 'type'].forEach(field =>
      expect(dialog).toHaveTextContent(`wazuh.active_response.${field}`),
    );
    expect(screen.getByRole('link', { name: /documentation/ })).toHaveAttribute(
      'href',
      'https://docs.example/user-manual/capabilities/active-response/index.html',
    );
  });

  it('links to the create form when the Active Responses app is registered', () => {
    mockApplications$.next(new Map([['active-responses', {}]]));
    openFlyout();

    expect(
      screen.getByRole('link', { name: 'Create active response' }),
    ).toHaveAttribute('href', '/app/active-responses#/create-active-response');
  });

  it('hides the create link when the Active Responses app is not registered', () => {
    mockApplications$.next(new Map());
    openFlyout();

    expect(
      screen.queryByRole('link', { name: 'Create active response' }),
    ).not.toBeInTheDocument();
  });
});
