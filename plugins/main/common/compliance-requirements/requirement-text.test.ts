/*
 * Wazuh app - Tests for the compliance requirement text composition
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { getRequirementLabel, getRequirementName } from './requirement-text';

describe('getRequirementLabel', () => {
  it('joins the identifier and the title', () => {
    expect(
      getRequirementLabel('3.1.10', {
        title: 'Session Lock',
        description:
          'Use session lock with pattern-hiding displays to prevent access and viewing of data after a period of inactivity.',
        category: 'Access Control',
      }),
    ).toBe('3.1.10 - Session Lock');
  });

  it('falls back to the description when the requirement has no title', () => {
    expect(
      getRequirementLabel('21.2.b', {
        description: 'Incident handling',
        category:
          'CHAPTER IV - CYBERSECURITY RISK-MANAGEMENT MEASURES AND REPORTING OBLIGATIONS',
      }),
    ).toBe('21.2.b - Incident handling');
  });

  it('returns the identifier alone for an unknown requirement', () => {
    expect(getRequirementLabel('9.9.9', undefined)).toBe('9.9.9');
  });
});

describe('getRequirementName', () => {
  it('prefers the title over the description', () => {
    expect(
      getRequirementName({
        title: 'Session Lock',
        description: 'Use session lock with pattern-hiding displays.',
        category: 'Access Control',
      }),
    ).toBe('Session Lock');
  });

  it('returns an empty string for an unknown requirement', () => {
    expect(getRequirementName(undefined)).toBe('');
  });
});
