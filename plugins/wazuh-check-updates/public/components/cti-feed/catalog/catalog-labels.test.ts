import {
  getFamilyLabel,
  getIndicatorTypeLabel,
  getProviderLabel,
  getRoleLabel,
} from './catalog-labels';
import { summarizeAffected } from './vulnerability-details';

describe('catalog labels', () => {
  test.each([
    ['js.clearfake', 'Clearfake'],
    ['win.cobalt_strike', 'Cobalt Strike'],
    ['elf.mirai', 'Mirai'],
    ['unknown_loader', 'Unknown Loader'],
    ['AsyncRAT', 'AsyncRAT'],
  ])('labels the family %p as %p', (family, label) => {
    expect(getFamilyLabel(family)).toBe(label);
  });

  test('labels the stored keywords', () => {
    expect(getIndicatorTypeLabel('connection')).toBe('Host:port');
    expect(getIndicatorTypeLabel('hash_sha256')).toBe('SHA-256');
    expect(getProviderLabel('eset-malware-ioc')).toBe('ESET');
    expect(getRoleLabel('botnet_cc')).toBe('Botnet C2');
  });

  test('keeps a value the feed adds later readable', () => {
    expect(getIndicatorTypeLabel('hash_sha512')).toBe('Hash sha512');
    expect(getProviderLabel('new-provider')).toBe('New provider');
    expect(getRoleLabel('')).toBe('');
  });
});

describe('summarizeAffected', () => {
  const product = (vendor: string, name: string, source = 'cna') => ({
    vendor,
    product: name,
    platforms: [],
    versions: [],
    source,
  });

  test('names a few distinct CNA products and counts the rest', () => {
    expect(
      summarizeAffected([
        product('apache', 'log4j'),
        product('apache', 'log4j'),
        product('apple', 'xcode'),
        product('bentley', 'synchro'),
        product('cisco', 'webex'),
        product('cisco', 'ucs'),
        product('canonical', 'liblog4j2-java', 'canonical'),
      ]),
    ).toEqual({
      preview: [
        'apache / log4j',
        'apple / xcode',
        'bentley / synchro',
        'cisco / webex',
      ],
      total: 5,
    });
  });

  test('falls back to ADP products when the CNA lists none', () => {
    expect(
      summarizeAffected([product('debian', 'log4j', 'debian')]).preview,
    ).toEqual(['debian / log4j']);
  });
});
