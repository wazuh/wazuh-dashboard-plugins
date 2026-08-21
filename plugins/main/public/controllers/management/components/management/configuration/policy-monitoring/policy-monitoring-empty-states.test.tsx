/* eslint-disable camelcase -- the fixtures reproduce the reported field
names verbatim. */
/*
 * The configuration is read from an index document that only carries the
 * modules the agent actually reported, so a module the agent does not run is
 * `undefined` rather than an empty section. These views used to be written
 * against the Server API, which answered for every section that was asked for,
 * and an undefined module left them rendering nothing at all.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import WzPolicyMonitoringGeneral from './policy-monitoring-general';
import WzPolicyMonitoringIgnored from './policy-monitoring-ignored';

jest.mock('../../../../../../kibana-services', () => ({
  getUiSettings: () => ({ get: () => false }),
}));

const NOT_PRESENT = /not present on the configuration file/i;

describe('Policy monitoring empty states', () => {
  describe('General', () => {
    it('reports the module as not configured when it did not report', () => {
      render(<WzPolicyMonitoringGeneral currentConfig={{}} />);

      screen.getByText(NOT_PRESENT);
    });

    it('reports it as not configured when the report has no rootcheck', () => {
      render(<WzPolicyMonitoringGeneral currentConfig={{ fim: {} }} />);

      screen.getByText(NOT_PRESENT);
    });

    it('renders the settings the agent reported', () => {
      render(
        <WzPolicyMonitoringGeneral
          currentConfig={{ fim: { rootcheck: { disabled: 'no' } } }}
        />,
      );

      screen.getByText('All settings');
      expect(screen.queryByText(NOT_PRESENT)).not.toBeInTheDocument();
    });
  });

  describe('Ignored', () => {
    it('reports the module as not configured when it did not report', () => {
      render(<WzPolicyMonitoringIgnored currentConfig={{}} />);

      screen.getByText(NOT_PRESENT);
    });

    it('reports it as not configured when nothing is ignored', () => {
      render(
        <WzPolicyMonitoringIgnored
          currentConfig={{ fim: { rootcheck: { disabled: 'no' } } }}
        />,
      );

      screen.getByText(NOT_PRESENT);
    });

    it('lists the ignored paths', () => {
      render(
        <WzPolicyMonitoringIgnored
          currentConfig={{
            fim: {
              rootcheck: { ignore: ['/var/lib/containerd', '/var/lib/docker'] },
            },
          }}
        />,
      );

      screen.getByText('/var/lib/containerd');
      screen.getByText('/var/lib/docker');
    });

    it('accepts a single ignored path reported as a bare value', () => {
      render(
        <WzPolicyMonitoringIgnored
          currentConfig={{ fim: { rootcheck: { ignore: '/var/lib/docker' } } }}
        />,
      );

      screen.getByText('/var/lib/docker');
    });

    it('lists the ignored sregex when only those are reported', () => {
      render(
        <WzPolicyMonitoringIgnored
          currentConfig={{
            fim: { rootcheck: { ignore_sregex: '.log$|.swp$' } },
          }}
        />,
      );

      screen.getByText('.log$|.swp$');
    });
  });
});
