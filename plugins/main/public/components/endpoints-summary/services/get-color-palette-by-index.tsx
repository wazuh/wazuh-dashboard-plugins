import { euiPaletteColorBlind } from '@elastic/eui';

export function getColorPaletteByIndex(index: number) {
  const colorPalette = euiPaletteColorBlind({
    rotations: 9,
    direction: 'both',
    order: 'middle-out',
  });
  const validIndex =
    index < colorPalette.length ? index : index - colorPalette.length;
  return colorPalette[validIndex];
}
