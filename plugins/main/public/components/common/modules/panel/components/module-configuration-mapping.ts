/*
 * Wazuh app - Shared mapping helpers for agent module configuration panels
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export interface EntityConfiguration {
  entity: string;
  name: string;
  configuration: Record<string, unknown>;
}

export const mapModuleContentToRenderProperties = (
  content: Record<string, unknown> | undefined | null,
  moduleId: string,
  entity: string,
  name = '',
): EntityConfiguration | null => {
  const configuration = content?.[moduleId];

  return configuration && typeof configuration === 'object'
    ? { entity, name, configuration: configuration as Record<string, unknown> }
    : null;
};

export const toApiAuthEntries = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) {
    return value.filter(entry => entry && typeof entry === 'object') as Record<
      string,
      unknown
    >[];
  }

  return value && typeof value === 'object'
    ? [value as Record<string, unknown>]
    : [];
};

export const toListEntries = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  return value === undefined || value === null || value === '' ? [] : [value];
};
