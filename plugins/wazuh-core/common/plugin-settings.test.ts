import { validate as validateNodeCronInterval } from 'node-cron';
import { PLUGIN_SETTINGS } from './constants';

function validateCronStatisticsInterval(value) {
  return validateNodeCronInterval(value) ? undefined : 'Interval is not valid.';
}

describe.skip('[settings] Input validation', () => {
  it.each`
    setting                            | value                                             | expectedValidation
    ${'alerts.sample.prefix'}          | ${'test'}                                         | ${undefined}
    ${'alerts.sample.prefix'}          | ${''}                                             | ${'Value can not be empty.'}
    ${'alerts.sample.prefix'}          | ${'test space'}                                   | ${'No whitespaces allowed.'}
    ${'alerts.sample.prefix'}          | ${'-test'}                                        | ${"It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}          | ${'_test'}                                        | ${"It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}          | ${'+test'}                                        | ${"It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}          | ${'.test'}                                        | ${"It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}          | ${'test\\'}                                       | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #, *.`}
    ${'alerts.sample.prefix'}          | ${'test/'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #, *.`}
    ${'alerts.sample.prefix'}          | ${'test?'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #, *.`}
    ${'alerts.sample.prefix'}          | ${'test"'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #, *.`}
    ${'alerts.sample.prefix'}          | ${'test<'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #, *.`}
    ${'alerts.sample.prefix'}          | ${'test>'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #, *.`}
    ${'alerts.sample.prefix'}          | ${'test|'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #, *.`}
    ${'alerts.sample.prefix'}          | ${'test,'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #, *.`}
    ${'alerts.sample.prefix'}          | ${'test#'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #, *.`}
    ${'alerts.sample.prefix'}          | ${'test*'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #, *.`}
    ${'configuration.ui_api_editable'} | ${true}                                           | ${undefined}
    ${'configuration.ui_api_editable'} | ${0}                                              | ${'It should be a boolean. Allowed values: true or false.'}
    ${'enrollment.dns'}                | ${'test'}                                         | ${undefined}
    ${'enrollment.dns'}                | ${''}                                             | ${undefined}
    ${'enrollment.dns'}                | ${'example.fqdn.valid'}                           | ${undefined}
    ${'enrollment.dns'}                | ${'127.0.0.1'}                                    | ${undefined}
    ${'enrollment.dns'}                | ${'2001:0db8:85a3:0000:0000:8a2e:0370:7334'}      | ${undefined}
    ${'enrollment.dns'}                | ${'2001:db8:85a3::8a2e:370:7334'}                 | ${'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6'}
    ${'enrollment.dns'}                | ${'2001:0db8:85a3:0000:0000:8a2e:0370:7334:KL12'} | ${'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6'}
    ${'enrollment.dns'}                | ${'example.'}                                     | ${'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6'}
    ${'enrollment.dns'}                | ${'127.0.0.1'}                                    | ${undefined}
    ${'enrollment.password'}           | ${'test'}                                         | ${undefined}
    ${'enrollment.password'}           | ${''}                                             | ${'Value can not be empty.'}
    ${'enrollment.password'}           | ${'test space'}                                   | ${undefined}
    ${'ip.ignore'}                     | ${'["test"]'}                                     | ${undefined}
    ${'ip.ignore'}                     | ${'["test*"]'}                                    | ${undefined}
    ${'ip.ignore'}                     | ${'[""]'}                                         | ${'Value can not be empty.'}
    ${'ip.ignore'}                     | ${'["test space"]'}                               | ${'No whitespaces allowed.'}
    ${'ip.ignore'}                     | ${true}                                           | ${'Value is not a valid list.'}
    ${'ip.ignore'}                     | ${'["-test"]'}                                    | ${"It can't start with: -, _, +, .."}
    ${'ip.ignore'}                     | ${'["_test"]'}                                    | ${"It can't start with: -, _, +, .."}
    ${'ip.ignore'}                     | ${'["+test"]'}                                    | ${"It can't start with: -, _, +, .."}
    ${'ip.ignore'}                     | ${'[".test"]'}                                    | ${"It can't start with: -, _, +, .."}
    ${'ip.ignore'}                     | ${String.raw`["test\""]`}                         | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'ip.ignore'}                     | ${'["test/"]'}                                    | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'ip.ignore'}                     | ${'["test?"]'}                                    | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'ip.ignore'}                     | ${'["test"\']'}                                   | ${"Value can't be parsed. There is some error."}
    ${'ip.ignore'}                     | ${'["test<"]'}                                    | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'ip.ignore'}                     | ${'["test>"]'}                                    | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'ip.ignore'}                     | ${'["test|"]'}                                    | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'ip.ignore'}                     | ${'["test,"]'}                                    | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'ip.ignore'}                     | ${'["test#"]'}                                    | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'ip.ignore'}                     | ${'["test", "test#"]'}                            | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'ip.selector'}                   | ${true}                                           | ${undefined}
    ${'ip.selector'}                   | ${''}                                             | ${'It should be a boolean. Allowed values: true or false.'}
    ${'pattern'}                       | ${'test'}                                         | ${undefined}
    ${'pattern'}                       | ${'test*'}                                        | ${undefined}
    ${'pattern'}                       | ${''}                                             | ${'Value can not be empty.'}
    ${'pattern'}                       | ${'test space'}                                   | ${'No whitespaces allowed.'}
    ${'pattern'}                       | ${'-test'}                                        | ${"It can't start with: -, _, +, .."}
    ${'pattern'}                       | ${'_test'}                                        | ${"It can't start with: -, _, +, .."}
    ${'pattern'}                       | ${'+test'}                                        | ${"It can't start with: -, _, +, .."}
    ${'pattern'}                       | ${'.test'}                                        | ${"It can't start with: -, _, +, .."}
    ${'pattern'}                       | ${'test\\'}                                       | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'pattern'}                       | ${'test/'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'pattern'}                       | ${'test?'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'pattern'}                       | ${'test"'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'pattern'}                       | ${'test<'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'pattern'}                       | ${'test>'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'pattern'}                       | ${'test|'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'pattern'}                       | ${'test,'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'pattern'}                       | ${'test#'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'timeout'}                       | ${15000}                                          | ${undefined}
    ${'timeout'}                       | ${1000}                                           | ${'Value should be greater or equal than 1500.'}
    ${'timeout'}                       | ${''}                                             | ${'Value should be greater or equal than 1500.'}
    ${'timeout'}                       | ${'1.2'}                                          | ${'Number should be an integer.'}
    ${'timeout'}                       | ${1.2}                                            | ${'Number should be an integer.'}
    ${'vulnerabilities.pattern'}       | ${'test'}                                         | ${undefined}
    ${'vulnerabilities.pattern'}       | ${'test*'}                                        | ${undefined}
    ${'vulnerabilities.pattern'}       | ${''}                                             | ${'Value can not be empty.'}
    ${'vulnerabilities.pattern'}       | ${'-test'}                                        | ${"It can't start with: -, _, +, .."}
    ${'vulnerabilities.pattern'}       | ${'_test'}                                        | ${"It can't start with: -, _, +, .."}
    ${'vulnerabilities.pattern'}       | ${'+test'}                                        | ${"It can't start with: -, _, +, .."}
    ${'vulnerabilities.pattern'}       | ${'.test'}                                        | ${"It can't start with: -, _, +, .."}
    ${'vulnerabilities.pattern'}       | ${'test\\'}                                       | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'vulnerabilities.pattern'}       | ${'test/'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'vulnerabilities.pattern'}       | ${'test?'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'vulnerabilities.pattern'}       | ${'test"'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'vulnerabilities.pattern'}       | ${'test<'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'vulnerabilities.pattern'}       | ${'test>'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'vulnerabilities.pattern'}       | ${'test|'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'vulnerabilities.pattern'}       | ${'test,'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
    ${'vulnerabilities.pattern'}       | ${'test#'}                                        | ${String.raw`It can't contain invalid characters: \, /, ?, ", <, >, |, ,, #.`}
  `(
    '$setting | $value | $expectedValidation',
    ({ setting, value, expectedValidation }) => {
      // FIXME: use the plugins definition

      if (expectedValidation === undefined) {
        expect(PLUGIN_SETTINGS[setting].validate(value)).toBeUndefined();
      } else {
        expect(PLUGIN_SETTINGS[setting].validate(value)).not.toBeUndefined();
      }
    },
  );
});
