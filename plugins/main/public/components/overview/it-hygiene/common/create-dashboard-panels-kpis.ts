import { DASHBOARD_WIDTH_LIMIT } from './constants';
import { generateVisualization } from './create-new-visualization';
import { HEIGHT } from './saved-vis/constants';
import { DashboardByValueSavedVis } from '../../../../../common/dashboards/types';

export const buildDashboardKPIPanels = (
  savedVises: DashboardByValueSavedVis[],
) => {
  const WIDTH = DASHBOARD_WIDTH_LIMIT / savedVises.length;
  return savedVises.reduce((acc, savedVis, currentIndex) => {
    return {
      ...acc,
      ...generateVisualization({
        key: savedVis.id + currentIndex.toString(),
        width: WIDTH,
        height: HEIGHT,
        positionX: WIDTH * currentIndex,
        positionY: 0,
        savedVis,
      }),
    };
  }, {});
};
