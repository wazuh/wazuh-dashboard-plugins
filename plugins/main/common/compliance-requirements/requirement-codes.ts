/*
 * Wazuh app - Codes of a regulatory compliance requirement
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/**
 * Every value a finding can carry for a requirement: the requirement itself,
 * in the notation of its standard, and the Wazuh ruleset compliance tags
 * aliased to it.
 * @param requirement identifier of the requirement
 * @param aliases alias map of the framework, as its definition file exports it
 * @returns the requirement followed by its aliases
 */
export function getRequirementCodes(
  requirement: string,
  aliases: Record<string, string> = {},
): string[] {
  return [
    requirement,
    ...Object.entries(aliases)
      .filter(([, target]) => target === requirement)
      .map(([alias]) => alias),
  ];
}
