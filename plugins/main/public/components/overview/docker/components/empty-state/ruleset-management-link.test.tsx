import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { BehaviorSubject } from 'rxjs';
import { getCore } from '../../../../../kibana-services';
import {
  RulesetManagementLink,
  useRulesetManagementApplication,
} from './ruleset-management-link';

jest.mock('../../../../../kibana-services', () => ({ getCore: jest.fn() }));

const navigateToApp = jest.fn();

const mockRegisteredApps = (ids: string[]) =>
  (getCore as jest.Mock).mockReturnValue({
    application: {
      applications$: new BehaviorSubject(new Map(ids.map(id => [id, { id }]))),
      getUrlForApp: (id: string) => `/app/${id}`,
      navigateToApp,
    },
  });

const Link = () => {
  const application = useRulesetManagementApplication();

  return application ? (
    <RulesetManagementLink application={application} />
  ) : null;
};

const renderLink = () =>
  render(
    <I18nProvider>
      <Link />
    </I18nProvider>,
  );

describe('RulesetManagementLink', () => {
  beforeEach(() => jest.clearAllMocks());

  it('links to Ruleset management > Overview when the app is registered', () => {
    mockRegisteredApps(['sa-integrations']);
    renderLink();

    const link = screen.getByRole('link', {
      name: 'Ruleset management > Overview',
    });
    expect(link).toHaveAttribute('href', '/app/sa-integrations');

    fireEvent.click(link);
    expect(navigateToApp).toHaveBeenCalledWith('sa-integrations');
  });

  it('renders nothing when the app is not registered', () => {
    mockRegisteredApps(['rules']);
    renderLink();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
