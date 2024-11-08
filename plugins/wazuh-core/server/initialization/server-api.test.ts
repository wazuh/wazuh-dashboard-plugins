import { checkAppServerCompatibility } from './server-api';

describe('checkAppServerCompatibility', () => {
  it.each`
    appVersion | serverAPIVersion | result
    ${'5.0.0'} | ${'5.0.0'}       | ${true}
    ${'5.0.0'} | ${'5.0.1'}       | ${true}
    ${'5.0.0'} | ${'5.0.10'}      | ${true}
    ${'5.0.0'} | ${'5.0.100'}     | ${true}
    ${'5.0.0'} | ${'4.9.1'}       | ${false}
    ${'5.0.0'} | ${'4.9.10'}      | ${false}
    ${'5.0.0'} | ${'4.9.100'}     | ${false}
    ${'5.0.0'} | ${'4.0.1'}       | ${false}
    ${'5.0.0'} | ${'4.0.10'}      | ${false}
    ${'5.0.0'} | ${'4.0.100'}     | ${false}
    ${'5.0.0'} | ${'4.10.1'}      | ${false}
    ${'5.0.0'} | ${'4.10.10'}     | ${false}
    ${'5.0.0'} | ${'4.10.100'}    | ${false}
  `(
    `appVersion: $appVersion, serverAPIVersion: $serverAPIVersion, result: $result`,
    ({ appVersion, serverAPIVersion, result }) => {
      expect(checkAppServerCompatibility(appVersion, serverAPIVersion)).toBe(
        result,
      );
    },
  );
});
