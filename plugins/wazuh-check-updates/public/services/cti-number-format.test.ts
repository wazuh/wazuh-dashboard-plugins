jest.mock('../plugin-services', () => ({
  getCore: jest.fn(),
}));

import { getCore } from '../plugin-services';
import { formatCtiNumber } from './cti-number-format';

const mockedGetCore = getCore as jest.Mock;

describe('formatCtiNumber', () => {
  test('reads the number format from the advanced settings', () => {
    const get = jest.fn(
      (key: string) =>
        ({
          'format:number:defaultPattern': '0,0.[000]',
          'format:number:defaultLocale': 'de',
        }[key]),
    );
    mockedGetCore.mockReturnValue({ uiSettings: { get } });

    expect(formatCtiNumber(952987)).toBe('952 987');
    expect(get).toHaveBeenCalledWith('format:number:defaultPattern');
  });

  test('falls back to the browser locale before the core is set', () => {
    mockedGetCore.mockImplementation(() => {
      throw new Error('Core was not set');
    });

    expect(formatCtiNumber(952987)).toBe(
      new Intl.NumberFormat().format(952987),
    );
  });
});
