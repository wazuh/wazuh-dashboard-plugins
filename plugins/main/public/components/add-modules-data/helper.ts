import {
  amazonWebServices,
  microsoftGraphAPI,
  docker,
  fileIntegrityMonitoring,
  github,
  googleCloud,
  mitreAttack,
  office365,
  vulnerabilityDetection,
} from '../../utils/applications';

export const sampleSecurityInformationApplication = [
  fileIntegrityMonitoring.title,
  amazonWebServices.title,
  office365.title,
  googleCloud.title,
  github.title,
  microsoftGraphAPI.title,
  'authorization',
  'ssh',
  'web',
].join(', ');

export const sampleThreatDetectionApplication = [
  vulnerabilityDetection.title,
  docker.title,
  mitreAttack.title,
].join(', ');

export const sampleMalwareDetection = ['malware', 'VirusTotal', 'YARA'].join(
  ', ',
);

export const sampleFileIntegrityMonitoring = ['files', 'registries'].join(', ');

export const sampleSecurityConfigurationAssessment = [
  'states of SCA',
  'checks',
  'policies',
].join(', ');

export const sampleInventory = [
  'groups',
  'hardware',
  'hotfixes',
  'interfaces',
  'networks',
  'packages',
  'ports',
  'processes',
  'protocols',
  'system',
  'users',
  'services',
  'browser extensions',
].join(', ');

/**
 * Creates an object by pairing each entry of the keys array with the value
 * at the same index in the values array (similar to lodash's zipObject).
 *
 * Each key in the keys array becomes an own enumerable property on the
 * resulting plain object. If a key does not have a corresponding value
 * (because the values array is shorter), its value will be set to undefined.
 * Surplus values (when values is longer than keys) are ignored.
 *
 * @param keys - Array of property names to use as object keys. Defaults to [].
 * @param values - Array of values to associate with each key. Defaults to [].
 * @returns A new object mapping each key to its corresponding value (or undefined).
 *
 * @example
 * const result = zipObject(['id', 'name'], [7, 'Alice']);
 * // result => { id: 7, name: 'Alice' }
 *
 * @example
 * // Missing values become undefined
 * zipObject(['a', 'b', 'c'], [1]) // => { a: 1, b: undefined, c: undefined }
 *
 * @example
 * // Extra values are ignored
 * zipObject(['a'], [1, 2]) // => { a: 1 }
 *
 * @remarks
 * Time complexity: O(n) where n = keys.length.
 * Does not mutate the input arrays.
 */
export const zipObject = (keys: any[] = [], values: any[] = []) => {
  return keys.reduce((accumulator, key, index) => {
    accumulator[key] = values[index];
    return accumulator;
  }, {});
};

export const DeepPromiseResolver = async function (
  obj: Record<string, any>,
): Promise<Record<string, any>> {
  const keys = Object.keys(obj);
  return Promise.all(
    keys.map(key => {
      const value: Record<string, any> | Promise<any> = obj[key];
      // Promise.resolve(value) !== value should work, but !value.then always works
      if (typeof value === 'object' && !value.then) {
        return DeepPromiseResolver(value);
      }
      return value;
    }),
  ).then(result => zipObject(keys, result));
};
