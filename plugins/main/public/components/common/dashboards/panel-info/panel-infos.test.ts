import { malwareDetectionPanelInfos } from '../../../overview/malware-detection/dashboard/panel-infos';
import { scaPanelInfos } from '../../../overview/sca/utils/result-definitions';
import { panelInfos } from './panel-infos';

describe('panelInfos', () => {
  it('aggregates the module panel infos, each saved object once', () => {
    const ids = panelInfos.map(({ savedObjectId }) => savedObjectId);

    expect(panelInfos).toEqual([
      ...scaPanelInfos,
      ...malwareDetectionPanelInfos,
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
