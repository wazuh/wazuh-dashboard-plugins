/*
 * See policy-monitoring-empty-states.test.tsx: the configuration comes from an
 * index document that only carries the modules the agent reported, so an
 * absent module is `undefined` rather than an empty section.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import WzConfigurationIntegrityMonitoring from './integrity-monitoring';

jest.mock('../../../../../../kibana-services', () => ({
  getUiSettings: () => ({ get: () => false }),
}));

// The HOC pulls in the Server API client, which this view no longer uses.
jest.mock('../util-hocs/wz-config', () => () => Component => {
  const WithoutConfig = props => <Component {...props} />;
  return WithoutConfig;
});

const NOT_PRESENT = /not present on the configuration file/i;

// The view reports whether the module is enabled to the section header.
const renderView = (currentConfig: Record<string, unknown>) =>
  render(
    <WzConfigurationIntegrityMonitoring
      currentConfig={currentConfig}
      updateBadge={jest.fn()}
    />,
  );

describe('WzConfigurationIntegrityMonitoring', () => {
  it('reports the module as not configured when it did not report', () => {
    renderView({});

    screen.getByText(NOT_PRESENT);
  });

  it('reports it as not configured when the report has no syscheck', () => {
    renderView({ fim: {} });

    screen.getByText(NOT_PRESENT);
  });

  it('renders the tabs when the agent reported syscheck', () => {
    renderView({ fim: { syscheck: { disabled: 'no' } } });

    screen.getByRole('tab', { name: 'General' });
    screen.getByRole('tab', { name: 'Synchronization' });
    expect(screen.queryByText(NOT_PRESENT)).not.toBeInTheDocument();
  });
});

describe('WzConfigurationIntegrityMonitoring badge', () => {
  const badgeFor = (currentConfig: Record<string, unknown>) => {
    const updateBadge = jest.fn();
    render(
      <WzConfigurationIntegrityMonitoring
        currentConfig={currentConfig}
        updateBadge={updateBadge}
      />,
    );
    return updateBadge.mock.calls[0][0];
  };

  it('is enabled when the agent reported syscheck as not disabled', () => {
    expect(badgeFor({ fim: { syscheck: { disabled: 'no' } } })).toBe(true);
  });

  it('is disabled when the agent reported syscheck as disabled', () => {
    expect(badgeFor({ fim: { syscheck: { disabled: 'yes' } } })).toBe(false);
  });

  /* Saying "disabled" for a module that simply has not reported yet states
  something the report does not say. */
  it('says nothing when the module did not report', () => {
    expect(badgeFor({})).toBeUndefined();
  });

  it('says nothing when the report carries no disabled setting', () => {
    expect(badgeFor({ fim: { syscheck: {} } })).toBeUndefined();
  });
});
