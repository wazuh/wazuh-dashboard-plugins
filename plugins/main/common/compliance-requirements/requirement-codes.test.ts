/*
 * Wazuh app - Tests for the compliance requirement codes
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { getRequirementCodes } from './requirement-codes';
import { hipaaRequirementsAliases } from './hipaa-requirements';

describe('getRequirementCodes', () => {
  it('returns the requirement alone when no alias names it', () => {
    expect(getRequirementCodes('164.312(b)', {})).toEqual(['164.312(b)']);
  });

  it('adds every alias of the requirement', () => {
    expect(
      getRequirementCodes('164.312(e)(1)', hipaaRequirementsAliases),
    ).toEqual(['164.312(e)(1)', '164.312.e', '164.312.e.1']);
  });

  it('ignores aliases of other requirements', () => {
    expect(
      getRequirementCodes('164.312(a)(1)', hipaaRequirementsAliases),
    ).toEqual(['164.312(a)(1)', '164.312.a.1']);
  });

  it('tolerates a framework with no aliases', () => {
    expect(getRequirementCodes('CC1.1')).toEqual(['CC1.1']);
  });
});
