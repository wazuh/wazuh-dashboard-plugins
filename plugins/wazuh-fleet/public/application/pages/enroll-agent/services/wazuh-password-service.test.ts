/* eslint-disable unicorn/prefer-string-raw */
import {
  scapeSpecialCharsForLinux,
  scapeSpecialCharsForMacOS,
  scapeSpecialCharsForWindows,
} from './wazuh-password-service';

describe('Wazuh Password Service', () => {
  // NOTE:
  //   The password constant must be written as it comes from the backend
  //   The expectedPassword variable must be written taking into account how the \ will be escaped
  describe('For Linux shell', () => {
    it.each`
      passwordFromAPI                               | expectedScapedPassword
      ${"password'with'special'characters"}         | ${"password'\"'\"'with'\"'\"'special'\"'\"'characters"}
      ${'password"with"doublequ\'sds\\"es'}         | ${'password"with"doublequ\'"\'"\'sds\\"es'}
      ${'password"with"doubleq\\\'usds\\"es'}       | ${'password"with"doubleq\\\\\'"\'"\'usds\\"es'}
      ${'password"with"doubleq\\\\\'usds\\"es'}     | ${'password"with"doubleq\\\\\'"\'"\'usds\\"es'}
      ${'password"with"doubleq\\\\\'\\usds\\"\\es'} | ${'password"with"doubleq\\\\\'"\'"\'\\\\usds\\"\\\\es'}
    `(
      ' should return password received with scaped characters: $passwordFromAPI | $scapedPassword | $expectedScapedPassword',
      ({ passwordFromAPI, expectedScapedPassword }) => {
        const passwordScaped = scapeSpecialCharsForLinux(passwordFromAPI);

        /* log to compare passwords
        console.log(
          'PASSWORD REAL: ',
          passwordFromAPI,
          '\nPASSWORD BACKEND: ',
          JSON.stringify(passwordFromAPI),
          '\nRESULT PASSWORD SCAPED REAL IN COMMAND: ',
          passwordScaped,
          '\nPASSWORD SCAPED REAL IN COMMAND EXPECTED: ',
          expectedScapedPassword
        );*/
        expect(passwordScaped).toEqual(expectedScapedPassword);
      },
    );
  });

  describe('For Windows shell', () => {
    it.each`
      passwordFromAPI                               | expectedScapedPassword
      ${"password'with'special'characters"}         | ${"password'\"'\"'with'\"'\"'special'\"'\"'characters"}
      ${'password"with"doublequ\'sds\\"es'}         | ${'password"with"doublequ\'"\'"\'sds\\"es'}
      ${'password"with"doubleq\\\'usds\\"es'}       | ${'password"with"doubleq\\\'"\'"\'usds\\"es'}
      ${'password"with"doubleq\\\\\'usds\\"es'}     | ${'password"with"doubleq\\\\\'"\'"\'usds\\"es'}
      ${'password"with"doubleq\\\\\'\\usds\\"\\es'} | ${'password"with"doubleq\\\\\'"\'"\'\\usds\\"\\es'}
    `(
      ' should return password received with scaped characters: $passwordFromAPI | $scapedPassword | $expectedScapedPassword',
      ({ passwordFromAPI, expectedScapedPassword }) => {
        const passwordScaped = scapeSpecialCharsForWindows(passwordFromAPI);

        /* log to compare passwords
        console.log(
          'PASSWORD REAL: ',
          passwordFromAPI,
          '\nPASSWORD BACKEND: ',
          JSON.stringify(passwordFromAPI),
          '\nRESULT PASSWORD SCAPED REAL IN COMMAND: ',
          passwordScaped,
          '\nPASSWORD SCAPED REAL IN COMMAND EXPECTED: ',
          expectedScapedPassword
        );*/
        expect(passwordScaped).toEqual(expectedScapedPassword);
      },
    );
  });

  describe('For macOS shell', () => {
    it.each`
      passwordFromAPI                               | expectedScapedPassword
      ${"password'with'special'characters"}         | ${"password'with'special'characters"}
      ${'password"with"doublequ\'sds\\"es'}         | ${'password"with"doublequ\'sds\\"es'}
      ${'password"with"doubleq\\\'usds\\"es'}       | ${'password"with"doubleq\\\'"\'"\'usds\\"es'}
      ${'password"with"doubleq\\\\\'usds\\"es'}     | ${'password"with"doubleq\\\\\'"\'"\'usds\\"es'}
      ${'password"with"doubleq\\\\\'\\usds\\"\\es'} | ${'password"with"doubleq\\\\\'"\'"\'\\usds\\"\\es'}
    `(
      ' should return password received with scaped characters: $passwordFromAPI | $scapedPassword | $expectedScapedPassword',
      ({ passwordFromAPI, expectedScapedPassword }) => {
        const passwordScaped = scapeSpecialCharsForMacOS(passwordFromAPI);

        /* log to compare passwords
      console.log(
        'PASSWORD REAL: ',
        passwordFromAPI,
        '\nPASSWORD BACKEND: ',
        JSON.stringify(passwordFromAPI),
        '\nRESULT PASSWORD SCAPED REAL IN COMMAND: ',
        passwordScaped,
        '\nPASSWORD SCAPED REAL IN COMMAND EXPECTED: ',
        expectedScapedPassword
      );*/
        expect(passwordScaped).toEqual(expectedScapedPassword);
      },
    );
  });
});
