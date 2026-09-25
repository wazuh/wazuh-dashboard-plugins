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
import { getRequirementText } from './requirement-text';

describe('getRequirementText', () => {
  it('joins the title and the description when both exist', () => {
    expect(
      getRequirementText({
        title: 'Security of processing',
        description: 'Implement appropriate technical measures.',
      }),
    ).toBe(
      'Security of processing - Implement appropriate technical measures.',
    );
  });

  it('returns the title alone when the framework publishes no description', () => {
    expect(getRequirementText({ title: 'Account Management' })).toBe(
      'Account Management',
    );
  });

  it('returns the title alone when the description is empty', () => {
    expect(
      getRequirementText({ title: 'Account Management', description: '' }),
    ).toBe('Account Management');
  });

  it('returns an empty string for an unknown requirement', () => {
    expect(getRequirementText(undefined)).toBe('');
  });
});
