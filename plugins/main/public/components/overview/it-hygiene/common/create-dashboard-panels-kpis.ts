import { MAX_WIDTH_DASHBOARD } from './constants';
import { generateVisualization } from './create-new-visualization';
import { HEIGHT } from './saved-vis/constants';
import { SavedVis } from './types';

export const createDashboardPanelsKPIs = (savedVises: SavedVis[]) => {
  const WIDTH = MAX_WIDTH_DASHBOARD / savedVises.length;
  return savedVises.reduce((acc, savedVis, currentIndex) => {
    return {
      ...acc,
      ...generateVisualization({
        key: currentIndex.toString(),
        width: WIDTH,
        height: HEIGHT,
        positionX: WIDTH * currentIndex,
        positionY: 0,
        savedVis,
      }),
    };
  }, {});
};
