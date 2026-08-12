import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import WzPolicyMonitoringSCA from './policy-monitoring-sca';

jest.mock('../../../../../../kibana-services', () => ({
  getUiSettings: () => ({ get: () => false }),
}));

const withSca = sca => ({ sca });

describe('WzPolicyMonitoringSCA', () => {
  it('lists every reported policy', () => {
    render(
      <WzPolicyMonitoringSCA
        currentConfig={withSca({
          enabled: 'yes',
          policies: [
            { policy: '/var/ossec/ruleset/sca/cis_ubuntu24-04.yml' },
            { policy: '/var/ossec/ruleset/sca/custom_hardening.yml' },
          ],
        })}
      />,
    );

    screen.getByText('/var/ossec/ruleset/sca/cis_ubuntu24-04.yml');
    screen.getByText('/var/ossec/ruleset/sca/custom_hardening.yml');
  });

  it('accepts a policy reported as a bare path', () => {
    render(
      <WzPolicyMonitoringSCA
        currentConfig={withSca({
          enabled: 'yes',
          policies: ['/var/ossec/ruleset/sca/cis_ubuntu24-04.yml'],
        })}
      />,
    );

    screen.getByText('/var/ossec/ruleset/sca/cis_ubuntu24-04.yml');
  });

  it('renders the settings without a policy list when none is enabled', () => {
    render(
      <WzPolicyMonitoringSCA currentConfig={withSca({ enabled: 'yes' })} />,
    );

    expect(screen.queryByText('Policies')).not.toBeInTheDocument();
  });

  it('reports SCA as not configured when the module is absent', () => {
    render(<WzPolicyMonitoringSCA currentConfig={{}} />);

    screen.getByText(/not present on the configuration file/i);
  });
});
