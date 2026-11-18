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

    // A whole number shows no decimals; a fraction keeps them.
    expect(formatCtiNumber(952987)).toBe('952,987');
    expect(formatCtiNumber(1.5)).toBe('1.50');
  });

  test('drops zero decimals with the separator of the configured locale', () => {
    withSettings({
      'format:number:defaultPattern': '0,0.00',
      'format:number:defaultLocale': 'de',
    });

    expect(formatCtiNumber(952987)).toBe('952 987');
    expect(formatCtiNumber(2.5)).toBe('2,50');
  });

  test('keeps the suffix of an abbreviated whole number', () => {
    withSettings({
      'format:number:defaultPattern': '0.0a',
      'format:number:defaultLocale': 'en',
    });

    expect(formatCtiNumber(953000)).toBe('953k');
    expect(formatCtiNumber(952987)).toBe('953k');
    expect(formatCtiNumber(1250)).toBe('1.3k');
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
