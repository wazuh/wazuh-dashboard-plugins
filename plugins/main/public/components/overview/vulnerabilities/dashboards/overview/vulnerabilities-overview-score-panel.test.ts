import fs from 'fs';
import path from 'path';

const DEFINITION = path.resolve(
  __dirname,
  '../../../../../../common/dashboards/dashboard-definitions/overview/vulnerabilities/overview/vulnerabilities-overview-dashboard-tab.ndjson',
);

describe('vulnerabilities overview dashboard definition', () => {
  it('excludes entries under evaluation from the score panel', () => {
    const visualization = fs
      .readFileSync(DEFINITION, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line))
      .find(({ id }) => id === 'most_detected_vulnerabilities');

    const searchSource = JSON.parse(
      visualization.attributes.kibanaSavedObjectMeta.searchSourceJSON,
    );

    expect(searchSource.query).toEqual({
      language: 'kuery',
      query: 'not vulnerability.under_evaluation:true',
    });
  });
});
