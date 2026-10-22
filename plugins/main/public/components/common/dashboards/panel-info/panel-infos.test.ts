import { scaPanelInfos } from '../../../overview/sca/utils/result-definitions';
import { panelInfos } from './panel-infos';

describe('panelInfos', () => {
  it('aggregates the Configuration Assessment panel infos', () => {
    expect(panelInfos).toEqual(scaPanelInfos);
  });
});
