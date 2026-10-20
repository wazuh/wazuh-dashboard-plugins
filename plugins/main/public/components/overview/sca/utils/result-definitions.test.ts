import fs from 'fs';
import path from 'path';
import { getScaResultDefinitions, scaPanelInfos } from './result-definitions';

const DASHBOARD_NDJSON = path.resolve(
  __dirname,
  '../../../../../common/dashboards/dashboard-definitions/overview/sca/overview/sca-overview-dashboard.ndjson',
);

describe('scaPanelInfos', () => {
  it('targets panels that exist in the Configuration Assessment dashboard', () => {
    const dashboard = fs
      .readFileSync(DASHBOARD_NDJSON, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line))
      .find(({ type }) => type === 'dashboard');
    const panelIds = dashboard.references.map(({ id }) => id);

    scaPanelInfos.forEach(({ savedObjectId }) =>
      expect(panelIds).toContain(savedObjectId),
    );
  });

  it('shares the Score definition with the About flyout', () => {
    const scorePanel = scaPanelInfos.find(
      ({ savedObjectId }) => savedObjectId === 'check_score',
    );

    expect(scorePanel?.getContent()).toBe(
      getScaResultDefinitions()[3].description,
    );
  });
});
