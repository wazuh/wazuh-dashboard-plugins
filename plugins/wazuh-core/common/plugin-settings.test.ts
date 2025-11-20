import { PLUGIN_SETTINGS } from './constants';

describe('[settings] Input validation', () => {
  it.each`
    setting                            | value                                                                  | expectedValidation
    ${'alerts.sample.prefix'}          | ${'test'}                                                              | ${undefined}
    ${'alerts.sample.prefix'}          | ${''}                                                                  | ${'Value can not be empty.'}
    ${'alerts.sample.prefix'}          | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'alerts.sample.prefix'}          | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}          | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}          | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}          | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}          | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}          | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}          | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}          | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}          | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}          | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}          | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}          | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}          | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}          | ${'test*'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'configuration.ui_api_editable'} | ${true}                                                                | ${undefined}
    ${'configuration.ui_api_editable'} | ${0}                                                                   | ${'It should be a boolean. Allowed values: true or false.'}
    ${'customization.enabled'}         | ${true}                                                                | ${undefined}
    ${'customization.logo.app'}        | ${{ size: 124000, name: 'image.jpg' }}                                 | ${undefined}
    ${'customization.logo.app'}        | ${{ size: 124000, name: 'image.jpeg' }}                                | ${undefined}
    ${'customization.logo.app'}        | ${{ size: 124000, name: 'image.png' }}                                 | ${undefined}
    ${'customization.logo.app'}        | ${{ size: 124000, name: 'image.svg' }}                                 | ${undefined}
    ${'customization.logo.app'}        | ${{ size: 124000, name: 'image.txt' }}                                 | ${'File extension is invalid. Allowed file extensions: .jpeg, .jpg, .png, .svg.'}
    ${'customization.logo.app'}        | ${{ size: 1240000, name: 'image.txt' }}                                | ${'File size should be lower or equal than 1 MB.'}
    ${'enrollment.dns'}                | ${'test'}                                                              | ${undefined}
    ${'enrollment.dns'}                | ${''}                                                                  | ${undefined}
    ${'enrollment.dns'}                | ${'example.fqdn.valid'}                                                | ${undefined}
    ${'enrollment.dns'}                | ${'127.0.0.1'}                                                         | ${undefined}
    ${'enrollment.dns'}                | ${'2001:0db8:85a3:0000:0000:8a2e:0370:7334'}                           | ${undefined}
    ${'enrollment.dns'}                | ${'2001:db8:85a3::8a2e:370:7334'}                                      | ${'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6'}
    ${'enrollment.dns'}                | ${'2001:0db8:85a3:0000:0000:8a2e:0370:7334:KL12'}                      | ${'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6'}
    ${'enrollment.dns'}                | ${'example.'}                                                          | ${'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6'}
    ${'enrollment.dns'}                | ${'127.0.0.1'}                                                         | ${undefined}
    ${'ip.ignore'}                     | ${'["test"]'}                                                          | ${undefined}
    ${'ip.ignore'}                     | ${'["test*"]'}                                                         | ${undefined}
    ${'ip.ignore'}                     | ${'[""]'}                                                              | ${'Value can not be empty.'}
    ${'ip.ignore'}                     | ${'["test space"]'}                                                    | ${'No whitespaces allowed.'}
    ${'ip.ignore'}                     | ${true}                                                                | ${'Value is not a valid list.'}
    ${'ip.ignore'}                     | ${'["-test"]'}                                                         | ${"It can't start with: -, _, +, .."}
    ${'ip.ignore'}                     | ${'["_test"]'}                                                         | ${"It can't start with: -, _, +, .."}
    ${'ip.ignore'}                     | ${'["+test"]'}                                                         | ${"It can't start with: -, _, +, .."}
    ${'ip.ignore'}                     | ${'[".test"]'}                                                         | ${"It can't start with: -, _, +, .."}
    ${'ip.ignore'}                     | ${'["test\\""]'}                                                       | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                     | ${'["test/"]'}                                                         | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                     | ${'["test?"]'}                                                         | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                     | ${'["test"\']'}                                                        | ${"Value can't be parsed. There is some error."}
    ${'ip.ignore'}                     | ${'["test<"]'}                                                         | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                     | ${'["test>"]'}                                                         | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                     | ${'["test|"]'}                                                         | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                     | ${'["test,"]'}                                                         | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                     | ${'["test#"]'}                                                         | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                     | ${'["test", "test#"]'}                                                 | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.selector'}                   | ${true}                                                                | ${undefined}
    ${'ip.selector'}                   | ${''}                                                                  | ${'It should be a boolean. Allowed values: true or false.'}
    ${'pattern'}                       | ${'test'}                                                              | ${undefined}
    ${'pattern'}                       | ${'test*'}                                                             | ${undefined}
    ${'pattern'}                       | ${''}                                                                  | ${'Value can not be empty.'}
    ${'pattern'}                       | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'pattern'}                       | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'pattern'}                       | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'pattern'}                       | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'pattern'}                       | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'pattern'}                       | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                       | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                       | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                       | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                       | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                       | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                       | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                       | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                       | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'timeout'}                       | ${15000}                                                               | ${undefined}
    ${'timeout'}                       | ${1000}                                                                | ${'Value should be greater or equal than 1500.'}
    ${'timeout'}                       | ${''}                                                                  | ${'Value should be greater or equal than 1500.'}
    ${'timeout'}                       | ${'1.2'}                                                               | ${'Number should be an integer.'}
    ${'timeout'}                       | ${1.2}                                                                 | ${'Number should be an integer.'}
  `(
    '$setting | $value | $expectedValidation',
    ({ setting, value, expectedValidation }) => {
      // FIXME: use the plugins definition
      expect(PLUGIN_SETTINGS[setting].validateUIForm(value)).toBe(
        expectedValidation,
      );
    },
  );
});
