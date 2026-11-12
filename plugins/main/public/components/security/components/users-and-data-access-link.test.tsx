import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { getCore } from '../../../kibana-services';
import { UsersAndDataAccessLink } from './users-and-data-access-link';

jest.mock('../../../kibana-services', () => ({ getCore: jest.fn() }));

const navigateToApp = jest.fn();

const mockRegisteredApps = (appIds: string[]) => {
  (getCore as jest.Mock).mockReturnValue({
    application: {
      applications$: new BehaviorSubject(
        new Map(appIds.map(id => [id, { id }])),
      ),
      getUrlForApp: (appId: string) => `/app/${appId}`,
      navigateToApp,
    },
  });
};

describe('UsersAndDataAccessLink', () => {
  beforeEach(() => navigateToApp.mockClear());

  it('opens the indexer security app, where the sign-in accounts live', () => {
    mockRegisteredApps(['security-dashboards-plugin']);
    render(<UsersAndDataAccessLink />);

    const link = screen.getByRole('link', { name: 'Users and data access' });
    expect(link).toHaveAttribute('href', '/app/security-dashboards-plugin');
    fireEvent.click(link);
    expect(navigateToApp).toHaveBeenCalledWith('security-dashboards-plugin');
  });

  it('shows the name without a link when the user cannot open that app', () => {
    mockRegisteredApps([]);
    render(<UsersAndDataAccessLink />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Users and data access')).toBeInTheDocument();
  });
});
