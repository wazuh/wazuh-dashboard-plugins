import fs from 'fs';
import path from 'path';

describe('Last modified files panel', () => {
  it.each([
    'overview/fim-overview-dashboard.ndjson',
    'pinned-agent/fim-pinned-agent-dashboard.ndjson',
  ])('names the modification time column in plain words in %s', file => {
    const { attributes } = fs
      .readFileSync(path.join(__dirname, file), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line))
      .find(({ id }) => id === 'last-modified-files');
    const { aggs } = JSON.parse(attributes.visState);

    expect(
      aggs.find(({ params }) => params?.field === 'file.mtime').params,
    ).toHaveProperty('customLabel', 'Last modified');
  });
});
