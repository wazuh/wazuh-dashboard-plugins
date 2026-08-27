/*
 * Wazuh app - Agent manager endpoint tests.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { composeAgentEndpoint } from './agent-endpoint';

describe('composeAgentEndpoint', () => {
  it('joins every component that was filled in', () => {
    expect(
      composeAgentEndpoint({
        address: '192.168.0.60',
        port: '1517',
        path: '/wazuh-manager/',
      }),
    ).toBe('192.168.0.60:1517/wazuh-manager/');
  });

  it('leaves out the components that were left empty', () => {
    expect(composeAgentEndpoint({ address: '192.168.0.60' })).toBe(
      '192.168.0.60',
    );
    expect(
      composeAgentEndpoint({ address: '192.168.0.60', port: '', path: '' }),
    ).toBe('192.168.0.60');
  });

  it('writes the path from the root when the leading slash is missing', () => {
    expect(
      composeAgentEndpoint({
        address: 'wazuh.manager',
        path: 'wazuh-manager/',
      }),
    ).toBe('wazuh.manager/wazuh-manager/');
  });

  it('returns an empty string without an address', () => {
    expect(composeAgentEndpoint({ address: '', port: '1517' })).toBe('');
  });
});
