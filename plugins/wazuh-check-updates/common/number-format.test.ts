// The number format the `data` plugin hands out through its start contract.
import { NumberFormat } from '../../../src/plugins/data/common';
import { formatNumberWithSettings } from './number-format';

let getUiSetting: (key: string) => unknown = () => undefined;

const withSettings = (settings: Record<string, unknown>) => {
  getUiSetting = (key: string) => settings[key];
};

const format = (value: number) =>
  formatNumberWithSettings(
    value,
    () => new NumberFormat({}, key => getUiSetting(key)),
  );

describe('formatNumberWithSettings', () => {
  test('follows the number pattern of the advanced settings', () => {
    withSettings({
      'format:number:defaultPattern': '0.0,[000]',
      'format:number:defaultLocale': 'en',
    });

    // A whole number shows no decimals; a fraction keeps them.
    expect(format(952987)).toBe('952,987');
    expect(format(1.5)).toBe('1.50');
  });

  test('drops zero decimals with the separator of the configured locale', () => {
    withSettings({
      'format:number:defaultPattern': '0,0.00',
      'format:number:defaultLocale': 'de',
    });

    expect(format(952987)).toBe('952 987');
    expect(format(2.5)).toBe('2,50');
  });

  test('keeps the suffix of an abbreviated whole number', () => {
    withSettings({
      'format:number:defaultPattern': '0.0a',
      'format:number:defaultLocale': 'en',
    });

    expect(format(953000)).toBe('953k');
    expect(format(952987)).toBe('953k');
    expect(format(1250)).toBe('1.3k');
  });

  test('follows the default pattern', () => {
    withSettings({
      'format:number:defaultPattern': '0,0.[000]',
      'format:number:defaultLocale': 'en',
    });

    expect(format(952987)).toBe('952,987');
  });

  test('follows the number locale of the advanced settings', () => {
    withSettings({
      'format:number:defaultPattern': '0,0.[000]',
      'format:number:defaultLocale': 'de',
    });

    // numeral's German locale groups thousands with a space.
    expect(format(952987)).toBe('952 987');
  });

  test('falls back to the browser locale when the settings cannot be read', () => {
    getUiSetting = () => {
      throw new Error('Core was not set');
    };

    expect(format(952987)).toBe(new Intl.NumberFormat().format(952987));
  });

  test('falls back to the browser locale without a number format', () => {
    expect(
      formatNumberWithSettings(952987, () => {
        throw new Error('FieldFormats was not set');
      }),
    ).toBe(new Intl.NumberFormat().format(952987));
  });
});
