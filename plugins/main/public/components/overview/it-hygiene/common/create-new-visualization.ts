import { SavedVis } from './types';

export const generateVisualization = ({
  key,
  width,
  height,
  positionX,
  positionY,
  savedVis,
}: {
  key: string;
  /* MAX: 48 */
  width: number;
  height: number;
  positionX: number;
  positionY: number;
  savedVis: SavedVis;
}) => {
  if (width > 48) {
    throw new Error('Width cannot exceed 48');
  }

  return {
    [key]: {
      gridData: {
        w: width,
        h: height,
        x: positionX,
        y: positionY,
        i: key,
      },
      type: 'visualization',
      explicitInput: {
        id: key,
        savedVis,
      },
    },
  };
};
