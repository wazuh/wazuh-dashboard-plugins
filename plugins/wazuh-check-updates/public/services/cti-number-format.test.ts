jest.mock('../plugin-services', () => ({
  getCore: jest.fn(),
}));

import { getCore } from '../plugin-services';
import { formatCtiNumber } from './cti-number-format';

const mockedGetCore = getCore as jest.Mock;

const withSettings = (settings: Record<string, unknown>) =>
  mockedGetCore.mockReturnValue({
    uiSettings: { get: (key: string) => settings[key] },
  });

describe('formatCtiNumber', () => {
  beforeEach(() => mockedGetCore.mockReset());

  test('follows the number pattern of the advanced settings', () => {
    withSettings({
      'format:number:defaultPattern': '0.0,[000]',
      'format:number:defaultLocale': 'en',
    });

    expect(formatCtiNumber(952987)).toBe('952,987.00');
  });

  test('follows the default pattern', () => {
    withSettings({
      'format:number:defaultPattern': '0,0.[000]',
      'format:number:defaultLocale': 'en',
    });

    expect(formatCtiNumber(952987)).toBe('952,987');
  });

  test('follows the number locale of the advanced settings', () => {
    withSettings({
      'format:number:defaultPattern': '0,0.[000]',
      'format:number:defaultLocale': 'de',
    });

    // numeral's German locale groups thousands with a space.
    expect(formatCtiNumber(952987)).toBe('952 987');
  });

  test('falls back to the browser locale when the settings cannot be read', () => {
    mockedGetCore.mockImplementation(() => {
      throw new Error('Core was not set');
    });

    expect(formatCtiNumber(952987)).toBe(
      new Intl.NumberFormat().format(952987),
    );
  });
});
