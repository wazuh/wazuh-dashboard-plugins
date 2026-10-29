/*
 * Wazuh app - Tests for the dashboard definitions
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import fs from 'fs';
import path from 'path';

const findDefinitionFiles = (directory: string): string[] =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return findDefinitionFiles(entryPath);
    }

    return entry.name.endsWith('.ndjson') ? [entryPath] : [];
  });

const visualizations = findDefinitionFiles(__dirname).flatMap(file =>
  fs
    .readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter(line => line.trim())
    .map(line => JSON.parse(line))
    .filter(({ type }) => type === 'visualization'),
);

describe('Dashboard definitions', () => {
  it('finds the visualizations', () => {
    expect(visualizations.length).toBeGreaterThan(0);
  });

  // A document carrying several values of a field (e.g. several compliance
  // requirements) falls in one bucket per value, so splitting twice by that
  // field counts it once per value inside each of its buckets.
  it.each(visualizations.map(({ id, attributes }) => [id, attributes]))(
    'visualization %s splits by each terms field once',
    (_id, attributes) => {
      const { aggs } = JSON.parse(attributes.visState);
      const termsFields = aggs
        .filter(
          (agg: { type: string; enabled?: boolean }) =>
            agg.type === 'terms' && agg.enabled !== false,
        )
        .map((agg: { params: { field: string } }) => agg.params.field);

      expect(termsFields).toEqual([...new Set(termsFields)]);
    },
  );
});
