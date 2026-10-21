import { malwareDetectionPanelInfos } from '../../../overview/malware-detection/dashboard/panel-infos';
import { scaPanelInfos } from '../../../overview/sca/utils/result-definitions';
import { panelInfos } from './panel-infos';

describe('panelInfos', () => {
  it('aggregates the Configuration Assessment panel infos', () => {
    expect(panelInfos).toEqual(expect.arrayContaining(scaPanelInfos));
  });

  it('aggregates the Malware Detection panel infos', () => {
    expect(panelInfos).toEqual(
      expect.arrayContaining(malwareDetectionPanelInfos),
    );
  });

  it('declares each saved object once', () => {
    const ids = panelInfos.map(({ savedObjectId }) => savedObjectId);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
