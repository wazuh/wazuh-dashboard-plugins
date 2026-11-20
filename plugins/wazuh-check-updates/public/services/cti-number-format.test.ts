jest.mock('../plugin-services', () => ({
  getFieldFormats: jest.fn(),
}));

import { NumberFormat } from '../../../../src/plugins/data/common';
import { getFieldFormats } from '../plugin-services';
import { formatCtiNumber } from './cti-number-format';

const mockedGetFieldFormats = getFieldFormats as jest.Mock;

describe('formatCtiNumber', () => {
  test('formats with the number format of the data plugin', () => {
    const settings: Record<string, unknown> = {
      'format:number:defaultPattern': '0,0.[000]',
      'format:number:defaultLocale': 'de',
    };
    const getInstance = jest.fn(
      () => new NumberFormat({}, (key: string) => settings[key]),
    );
    mockedGetFieldFormats.mockReturnValue({ getInstance });

    expect(formatCtiNumber(952987)).toBe('952 987');
    expect(getInstance).toHaveBeenCalledWith('number');
  });

  test('falls back to the browser locale before the data plugin starts', () => {
    mockedGetFieldFormats.mockImplementation(() => {
      throw new Error('FieldFormats was not set');
    });

    expect(formatCtiNumber(952987)).toBe(
      new Intl.NumberFormat().format(952987),
    );
  });
});
