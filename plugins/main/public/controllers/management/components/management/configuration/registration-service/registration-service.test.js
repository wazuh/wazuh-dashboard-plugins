/* eslint-disable camelcase -- fixtures reproduce the manager API's field
   names verbatim */
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WzRegistrationService } from './registration-service';

// Shape a current manager reports: boolean fields are
// native booleans, not the legacy 'yes'/'no' string dialect.
const nativeBooleanAuthConfig = {
  'auth-auth': {
    auth: {
      disabled: false,
      port: 1515,
      use_source_ip: false,
      purge: true,
      use_password: true,
      ciphers:
        'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256',
      ssl_verify_host: false,
      ssl_manager_cert: 'etc/certs/remoted.pem',
      ssl_manager_key: 'etc/certs/remoted-key.pem',
      ipv6: false,
      force: {
        enabled: true,
        key_mismatch: true,
        disconnected_time: {
          enabled: true,
          value: '1h',
        },
        after_registration_time: '1h',
      },
      ssl_agent_ca: '',
      ssl_auto_negotiate: false,
      remote_enrollment: true,
      legacy_enrollment: true,
      agents: {
        allow_higher_versions: false,
      },
    },
  },
};

// Legacy string dialect, as still reported by older managers / agent views.
const legacyStringAuthConfig = {
  'auth-auth': {
    auth: {
      disabled: 'no',
      port: '1515',
      use_source_ip: 'no',
      purge: 'yes',
      use_password: 'yes',
      force: {
        enabled: 'yes',
        key_mismatch: 'yes',
        disconnected_time: {
          enabled: 'yes',
          value: '1h',
        },
      },
      ssl_verify_host: 'no',
      ssl_auto_negotiate: 'no',
    },
  },
};

describe('WzRegistrationService', () => {
  const noop = () => {};

  it('renders the Service status as enabled when disabled=no (legacy dialect)', () => {
    const { getByDisplayValue } = render(
      <WzRegistrationService
        currentConfig={legacyStringAuthConfig}
        updateBadge={noop}
      />,
    );
    expect(getByDisplayValue('enabled')).toBeInTheDocument();
  });

  it('renders the Service status as enabled when disabled is a native false', () => {
    const { getByDisplayValue } = render(
      <WzRegistrationService
        currentConfig={nativeBooleanAuthConfig}
        updateBadge={noop}
      />,
    );
    // This is the silent-mislabel regression case: a native `false` must not
    // render 'disabled'.
    expect(getByDisplayValue('enabled')).toBeInTheDocument();
  });

  it('renders the boolean vocabulary fields as yes/no for native booleans', () => {
    const { getAllByDisplayValue } = render(
      <WzRegistrationService
        currentConfig={nativeBooleanAuthConfig}
        updateBadge={noop}
      />,
    );
    // use_source_ip=false, ssl_verify_host=false, ssl_auto_negotiate=false ->
    // 'no'; purge=true, use_password=true, force.enabled=true,
    // force.key_mismatch=true, force.disconnected_time.enabled=true -> 'yes'.
    expect(getAllByDisplayValue('no').length).toBeGreaterThanOrEqual(3);
    expect(getAllByDisplayValue('yes').length).toBeGreaterThanOrEqual(5);
  });

  it('keeps rendering the legacy yes/no dialect for the same fields', () => {
    const { getAllByDisplayValue } = render(
      <WzRegistrationService
        currentConfig={legacyStringAuthConfig}
        updateBadge={noop}
      />,
    );
    expect(getAllByDisplayValue('no').length).toBeGreaterThanOrEqual(3);
    expect(getAllByDisplayValue('yes').length).toBeGreaterThanOrEqual(4);
  });
});
