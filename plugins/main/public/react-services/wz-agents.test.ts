/*
 * Wazuh app - React test for wz-agents
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { getAgentOSType, hasAgentSupportModule } from './wz-agents';
import { WAZUH_AGENTS_OS_TYPE } from '../../common/constants';

describe('getAgentOSType', () => {
  it('should return OTHERS when no agent is provided', () => {
    expect(getAgentOSType()).toBe(WAZUH_AGENTS_OS_TYPE.OTHERS);
  });

  it('should return OTHERS when the agent has no os data', () => {
    expect(getAgentOSType({})).toBe(WAZUH_AGENTS_OS_TYPE.OTHERS);
  });

  it('should return LINUX when os.type includes "linux"', () => {
    expect(getAgentOSType({ os: { type: 'Linux' } })).toBe(
      WAZUH_AGENTS_OS_TYPE.LINUX,
    );
  });

  it('should return WINDOWS when os.platform is "windows"', () => {
    expect(getAgentOSType({ os: { platform: 'windows' } })).toBe(
      WAZUH_AGENTS_OS_TYPE.WINDOWS,
    );
  });

  it('should return WINDOWS when os.type is "windows"', () => {
    expect(getAgentOSType({ os: { type: 'windows' } })).toBe(
      WAZUH_AGENTS_OS_TYPE.WINDOWS,
    );
  });

  it('should return SUNOS when os.platform is "sunos"', () => {
    expect(getAgentOSType({ os: { platform: 'sunos' } })).toBe(
      WAZUH_AGENTS_OS_TYPE.SUNOS,
    );
  });

  it('should return DARWIN when os.platform is "darwin"', () => {
    expect(getAgentOSType({ os: { platform: 'darwin' } })).toBe(
      WAZUH_AGENTS_OS_TYPE.DARWIN,
    );
  });

  it('should return OTHERS when os.platform and os.type are unknown', () => {
    expect(getAgentOSType({ os: { platform: 'unknown' } })).toBe(
      WAZUH_AGENTS_OS_TYPE.OTHERS,
    );
  });
});

describe('hasAgentSupportModule', () => {
  it('should return false when the module is unsupported for the agent OS', () => {
    const agent = { os: { platform: 'sunos' } };
    expect(hasAgentSupportModule(agent, 'vulnerability-detection')).toBe(false);
  });

  it('should return true when the module is supported for the agent OS', () => {
    const agent = { os: { type: 'linux' } };
    expect(hasAgentSupportModule(agent, 'vulnerability-detection')).toBe(true);
  });
});
