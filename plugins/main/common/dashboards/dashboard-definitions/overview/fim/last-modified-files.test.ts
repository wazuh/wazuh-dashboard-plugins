/*
 * Wazuh app - Tests for the Last modified files panel of the FIM dashboards
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

const readSavedObjects = (definitionPath: string) =>
  fs
    .readFileSync(path.join(__dirname, definitionPath), 'utf8')
    .split(/\r?\n/)
    .filter(line => line.trim())
    .map(line => JSON.parse(line));

interface Aggregation {
  schema: string;
  params: { field?: string; customLabel?: string };
}

describe.each([
  'overview/fim-overview-dashboard.ndjson',
  'pinned-agent/fim-pinned-agent-dashboard.ndjson',
])('Last modified files panel of %s', definitionPath => {
  const visualization = readSavedObjects(definitionPath).find(
    savedObject => savedObject.id === 'last-modified-files',
  );
  const { aggs }: { aggs: Aggregation[] } = JSON.parse(
    visualization.attributes.visState,
  );

  it('names the modification time column in plain words', () => {
    expect(
      aggs.find(agg => agg.params?.field === 'file.mtime')?.params.customLabel,
    ).toBe('Last modified');
  });

  it('keeps the file path and size columns', () => {
    expect(
      aggs
        .filter(agg => agg.schema === 'bucket')
        .map(agg => agg.params.customLabel),
    ).toEqual(['Last modified files', 'File size']);
  });
});
