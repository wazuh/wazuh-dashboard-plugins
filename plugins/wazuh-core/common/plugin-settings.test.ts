import { PLUGIN_SETTINGS } from './constants';
import { validate as validateNodeCronInterval } from 'node-cron';

function validateCronStatisticsInterval(value) {
  return validateNodeCronInterval(value) ? undefined : 'Interval is not valid.';
}

describe('[settings] Input validation', () => {
  it.each`
    setting                                        | value                                                                  | expectedValidation
    ${'alerts.sample.prefix'}                      | ${'test'}                                                              | ${undefined}
    ${'alerts.sample.prefix'}                      | ${''}                                                                  | ${'Value can not be empty.'}
    ${'alerts.sample.prefix'}                      | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'alerts.sample.prefix'}                      | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}                      | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}                      | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}                      | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'alerts.sample.prefix'}                      | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}                      | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}                      | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}                      | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}                      | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}                      | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}                      | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}                      | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}                      | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'alerts.sample.prefix'}                      | ${'test*'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'checks.api'}                                | ${true}                                                                | ${undefined}
    ${'checks.api'}                                | ${0}                                                                   | ${'It should be a boolean. Allowed values: true or false.'}
    ${'checks.fields'}                             | ${true}                                                                | ${undefined}
    ${'checks.fields'}                             | ${0}                                                                   | ${'It should be a boolean. Allowed values: true or false.'}
    ${'checks.maxBuckets'}                         | ${true}                                                                | ${undefined}
    ${'checks.maxBuckets'}                         | ${0}                                                                   | ${'It should be a boolean. Allowed values: true or false.'}
    ${'checks.pattern'}                            | ${true}                                                                | ${undefined}
    ${'checks.pattern'}                            | ${0}                                                                   | ${'It should be a boolean. Allowed values: true or false.'}
    ${'checks.setup'}                              | ${true}                                                                | ${undefined}
    ${'checks.setup'}                              | ${0}                                                                   | ${'It should be a boolean. Allowed values: true or false.'}
    ${'checks.template'}                           | ${true}                                                                | ${undefined}
    ${'checks.template'}                           | ${0}                                                                   | ${'It should be a boolean. Allowed values: true or false.'}
    ${'configuration.ui_api_editable'}             | ${true}                                                                | ${undefined}
    ${'configuration.ui_api_editable'}             | ${0}                                                                   | ${'It should be a boolean. Allowed values: true or false.'}
    ${'checks.timeFilter'}                         | ${true}                                                                | ${undefined}
    ${'checks.timeFilter'}                         | ${0}                                                                   | ${'It should be a boolean. Allowed values: true or false.'}
    ${'cron.prefix'}                               | ${'test'}                                                              | ${undefined}
    ${'cron.prefix'}                               | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'cron.prefix'}                               | ${''}                                                                  | ${'Value can not be empty.'}
    ${'cron.prefix'}                               | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'cron.prefix'}                               | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'cron.prefix'}                               | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'cron.prefix'}                               | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'cron.prefix'}                               | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.prefix'}                               | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.prefix'}                               | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.prefix'}                               | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.prefix'}                               | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.prefix'}                               | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.prefix'}                               | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.prefix'}                               | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.prefix'}                               | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.prefix'}                               | ${'test*'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.apis'}                      | ${'["test"]'}                                                          | ${undefined}
    ${'cron.statistics.apis'}                      | ${'["test "]'}                                                         | ${'No whitespaces allowed.'}
    ${'cron.statistics.apis'}                      | ${'[""]'}                                                              | ${'Value can not be empty.'}
    ${'cron.statistics.apis'}                      | ${'["test", 4]'}                                                       | ${'Value is not a string.'}
    ${'cron.statistics.apis'}                      | ${'test space'}                                                        | ${"Value can't be parsed. There is some error."}
    ${'cron.statistics.apis'}                      | ${true}                                                                | ${'Value is not a valid list.'}
    ${'cron.statistics.index.creation'}            | ${'h'}                                                                 | ${undefined}
    ${'cron.statistics.index.creation'}            | ${'d'}                                                                 | ${undefined}
    ${'cron.statistics.index.creation'}            | ${'w'}                                                                 | ${undefined}
    ${'cron.statistics.index.creation'}            | ${'m'}                                                                 | ${undefined}
    ${'cron.statistics.index.creation'}            | ${'test'}                                                              | ${'Invalid value. Allowed values: h, d, w, m.'}
    ${'cron.statistics.index.name'}                | ${'test'}                                                              | ${undefined}
    ${'cron.statistics.index.name'}                | ${''}                                                                  | ${'Value can not be empty.'}
    ${'cron.statistics.index.name'}                | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'cron.statistics.index.name'}                | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'cron.statistics.index.name'}                | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'cron.statistics.index.name'}                | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'cron.statistics.index.name'}                | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'cron.statistics.index.name'}                | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.name'}                | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.name'}                | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.name'}                | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.name'}                | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.name'}                | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.name'}                | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.name'}                | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.name'}                | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.name'}                | ${'test*'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'cron.statistics.index.replicas'}            | ${0}                                                                   | ${undefined}
    ${'cron.statistics.index.replicas'}            | ${-1}                                                                  | ${'Value should be greater or equal than 0.'}
    ${'cron.statistics.index.replicas'}            | ${'1.2'}                                                               | ${'Number should be an integer.'}
    ${'cron.statistics.index.replicas'}            | ${1.2}                                                                 | ${'Number should be an integer.'}
    ${'cron.statistics.index.shards'}              | ${1}                                                                   | ${undefined}
    ${'cron.statistics.index.shards'}              | ${-1}                                                                  | ${'Value should be greater or equal than 1.'}
    ${'cron.statistics.index.shards'}              | ${'1.2'}                                                               | ${'Number should be an integer.'}
    ${'cron.statistics.index.shards'}              | ${1.2}                                                                 | ${'Number should be an integer.'}
    ${'cron.statistics.interval'}                  | ${'0 */5 * * * *'}                                                     | ${undefined}
    ${'cron.statistics.interval'}                  | ${'0 */5 * * *'}                                                       | ${undefined}
    ${'cron.statistics.interval'}                  | ${'custom'}                                                            | ${'Interval is not valid.'}
    ${'cron.statistics.interval'}                  | ${true}                                                                | ${'Interval is not valid.'}
    ${'cron.statistics.status'}                    | ${true}                                                                | ${undefined}
    ${'cron.statistics.status'}                    | ${0}                                                                   | ${'It should be a boolean. Allowed values: true or false.'}
    ${'customization.enabled'}                     | ${true}                                                                | ${undefined}
    ${'customization.logo.app'}                    | ${{ size: 124000, name: 'image.jpg' }}                                 | ${undefined}
    ${'customization.logo.app'}                    | ${{ size: 124000, name: 'image.jpeg' }}                                | ${undefined}
    ${'customization.logo.app'}                    | ${{ size: 124000, name: 'image.png' }}                                 | ${undefined}
    ${'customization.logo.app'}                    | ${{ size: 124000, name: 'image.svg' }}                                 | ${undefined}
    ${'customization.logo.app'}                    | ${{ size: 124000, name: 'image.txt' }}                                 | ${'File extension is invalid. Allowed file extensions: .jpeg, .jpg, .png, .svg.'}
    ${'customization.logo.app'}                    | ${{ size: 1240000, name: 'image.txt' }}                                | ${'File size should be lower or equal than 1 MB.'}
    ${'customization.logo.healthcheck'}            | ${{ size: 124000, name: 'image.jpg' }}                                 | ${undefined}
    ${'customization.logo.healthcheck'}            | ${{ size: 124000, name: 'image.jpeg' }}                                | ${undefined}
    ${'customization.logo.healthcheck'}            | ${{ size: 124000, name: 'image.png' }}                                 | ${undefined}
    ${'customization.logo.healthcheck'}            | ${{ size: 124000, name: 'image.svg' }}                                 | ${undefined}
    ${'customization.logo.healthcheck'}            | ${{ size: 124000, name: 'image.txt' }}                                 | ${'File extension is invalid. Allowed file extensions: .jpeg, .jpg, .png, .svg.'}
    ${'customization.logo.healthcheck'}            | ${{ size: 1240000, name: 'image.txt' }}                                | ${'File size should be lower or equal than 1 MB.'}
    ${'customization.logo.reports'}                | ${{ size: 124000, name: 'image.jpg' }}                                 | ${undefined}
    ${'customization.logo.reports'}                | ${{ size: 124000, name: 'image.jpeg' }}                                | ${undefined}
    ${'customization.logo.reports'}                | ${{ size: 124000, name: 'image.png' }}                                 | ${undefined}
    ${'customization.logo.reports'}                | ${{ size: 124000, name: 'image.svg' }}                                 | ${'File extension is invalid. Allowed file extensions: .jpeg, .jpg, .png.'}
    ${'customization.logo.reports'}                | ${{ size: 124000, name: 'image.txt' }}                                 | ${'File extension is invalid. Allowed file extensions: .jpeg, .jpg, .png.'}
    ${'customization.logo.reports'}                | ${{ size: 1240000, name: 'image.txt' }}                                | ${'File size should be lower or equal than 1 MB.'}
    ${'customization.reports.footer'}              | ${'Test'}                                                              | ${undefined}
    ${'customization.reports.footer'}              | ${'Test\nTest'}                                                        | ${undefined}
    ${'customization.reports.footer'}              | ${'Test\nTest\nTest\nTest\nTest'}                                      | ${'The string should have less or equal to 2 line/s.'}
    ${'customization.reports.footer'}              | ${'Line with 30 characters       \nTest'}                              | ${undefined}
    ${'customization.reports.footer'}              | ${'Testing maximum length of a line of more than 50 characters\nTest'} | ${'The maximum length of a line is 50 characters.'}
    ${'customization.reports.header'}              | ${'Test'}                                                              | ${undefined}
    ${'customization.reports.header'}              | ${'Test\nTest'}                                                        | ${undefined}
    ${'customization.reports.header'}              | ${'Test\nTest\nTest\nTest\nTest'}                                      | ${'The string should have less or equal to 3 line/s.'}
    ${'customization.reports.header'}              | ${'Line with 20 charact\nTest'}                                        | ${undefined}
    ${'customization.reports.header'}              | ${'Testing maximum length of a line of 40 characters\nTest'}           | ${'The maximum length of a line is 40 characters.'}
    ${'enrollment.dns'}                            | ${'test'}                                                              | ${undefined}
    ${'enrollment.dns'}                            | ${''}                                                                  | ${undefined}
    ${'enrollment.dns'}                            | ${'example.fqdn.valid'}                                                | ${undefined}
    ${'enrollment.dns'}                            | ${'127.0.0.1'}                                                         | ${undefined}
    ${'enrollment.dns'}                            | ${'2001:0db8:85a3:0000:0000:8a2e:0370:7334'}                           | ${undefined}
    ${'enrollment.dns'}                            | ${'2001:db8:85a3::8a2e:370:7334'}                                      | ${'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6'}
    ${'enrollment.dns'}                            | ${'2001:0db8:85a3:0000:0000:8a2e:0370:7334:KL12'}                      | ${'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6'}
    ${'enrollment.dns'}                            | ${'example.'}                                                          | ${'It should be a valid hostname, FQDN, IPv4 or uncompressed IPv6'}
    ${'enrollment.dns'}                            | ${'127.0.0.1'}                                                         | ${undefined}
    ${'enrollment.password'}                       | ${'test'}                                                              | ${undefined}
    ${'enrollment.password'}                       | ${''}                                                                  | ${'Value can not be empty.'}
    ${'enrollment.password'}                       | ${'test space'}                                                        | ${undefined}
    ${'fim_files.pattern'}                         | ${'test'}                                                              | ${undefined}
    ${'fim_files.pattern'}                         | ${'test*'}                                                             | ${undefined}
    ${'fim_files.pattern'}                         | ${''}                                                                  | ${'Value can not be empty.'}
    ${'fim_files.pattern'}                         | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'fim_files.pattern'}                         | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'fim_files.pattern'}                         | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'fim_files.pattern'}                         | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'fim_files.pattern'}                         | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'fim_files.pattern'}                         | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim_files.pattern'}                         | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim_files.pattern'}                         | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim_files.pattern'}                         | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim_files.pattern'}                         | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim_files.pattern'}                         | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim_files.pattern'}                         | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim_files.pattern'}                         | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim_files.pattern'}                         | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim_registries.pattern'}                    | ${'test'}                                                              | ${undefined}
    ${'fim_registries.pattern'}                    | ${'test*'}                                                             | ${undefined}
    ${'fim_registries.pattern'}                    | ${''}                                                                  | ${'Value can not be empty.'}
    ${'fim_registries.pattern'}                    | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'fim_registries.pattern'}                    | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'fim_registries.pattern'}                    | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'fim_registries.pattern'}                    | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'fim_registries.pattern'}                    | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'fim_registries.pattern'}                    | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim_registries.pattern'}                    | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim_registries.pattern'}                    | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim_registries.pattern'}                    | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim_registries.pattern'}                    | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim_registries.pattern'}                    | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim_registries.pattern'}                    | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim_registries.pattern'}                    | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim_registries.pattern'}                    | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'fim_registries.sample.prefix'}              | ${'test'}                                                              | ${undefined}
    ${'fim_registries.sample.prefix'}              | ${''}                                                                  | ${'Value can not be empty.'}
    ${'fim_registries.sample.prefix'}              | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'fim_registries.sample.prefix'}              | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'fim_registries.sample.prefix'}              | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'fim_registries.sample.prefix'}              | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'fim_registries.sample.prefix'}              | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'fim_registries.sample.prefix'}              | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'fim_registries.sample.prefix'}              | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'fim_registries.sample.prefix'}              | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'fim_registries.sample.prefix'}              | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'fim_registries.sample.prefix'}              | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'fim_registries.sample.prefix'}              | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'fim_registries.sample.prefix'}              | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'fim_registries.sample.prefix'}              | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'fim_registries.sample.prefix'}              | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'fim_registries.sample.prefix'}              | ${'test*'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'fim_files.sample.prefix'}                   | ${'test'}                                                              | ${undefined}
    ${'fim_files.sample.prefix'}                   | ${''}                                                                  | ${'Value can not be empty.'}
    ${'fim_files.sample.prefix'}                   | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'fim_files.sample.prefix'}                   | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'fim_files.sample.prefix'}                   | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'fim_files.sample.prefix'}                   | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'fim_files.sample.prefix'}                   | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'fim_files.sample.prefix'}                   | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'fim_files.sample.prefix'}                   | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'fim_files.sample.prefix'}                   | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'fim_files.sample.prefix'}                   | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'fim_files.sample.prefix'}                   | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'fim_files.sample.prefix'}                   | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'fim_files.sample.prefix'}                   | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'fim_files.sample.prefix'}                   | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'fim_files.sample.prefix'}                   | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'fim_files.sample.prefix'}                   | ${'test*'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'ip.ignore'}                                 | ${'["test"]'}                                                          | ${undefined}
    ${'ip.ignore'}                                 | ${'["test*"]'}                                                         | ${undefined}
    ${'ip.ignore'}                                 | ${'[""]'}                                                              | ${'Value can not be empty.'}
    ${'ip.ignore'}                                 | ${'["test space"]'}                                                    | ${'No whitespaces allowed.'}
    ${'ip.ignore'}                                 | ${true}                                                                | ${'Value is not a valid list.'}
    ${'ip.ignore'}                                 | ${'["-test"]'}                                                         | ${"It can't start with: -, _, +, .."}
    ${'ip.ignore'}                                 | ${'["_test"]'}                                                         | ${"It can't start with: -, _, +, .."}
    ${'ip.ignore'}                                 | ${'["+test"]'}                                                         | ${"It can't start with: -, _, +, .."}
    ${'ip.ignore'}                                 | ${'[".test"]'}                                                         | ${"It can't start with: -, _, +, .."}
    ${'ip.ignore'}                                 | ${'["test\\""]'}                                                       | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                                 | ${'["test/"]'}                                                         | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                                 | ${'["test?"]'}                                                         | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                                 | ${'["test"\']'}                                                        | ${"Value can't be parsed. There is some error."}
    ${'ip.ignore'}                                 | ${'["test<"]'}                                                         | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                                 | ${'["test>"]'}                                                         | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                                 | ${'["test|"]'}                                                         | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                                 | ${'["test,"]'}                                                         | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                                 | ${'["test#"]'}                                                         | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.ignore'}                                 | ${'["test", "test#"]'}                                                 | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'ip.selector'}                               | ${true}                                                                | ${undefined}
    ${'ip.selector'}                               | ${''}                                                                  | ${'It should be a boolean. Allowed values: true or false.'}
    ${'pattern'}                                   | ${'test'}                                                              | ${undefined}
    ${'pattern'}                                   | ${'test*'}                                                             | ${undefined}
    ${'pattern'}                                   | ${''}                                                                  | ${'Value can not be empty.'}
    ${'pattern'}                                   | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'pattern'}                                   | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'pattern'}                                   | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'pattern'}                                   | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'pattern'}                                   | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'pattern'}                                   | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                                   | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                                   | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                                   | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                                   | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                                   | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                                   | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                                   | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'pattern'}                                   | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory.pattern'}                  | ${'test'}                                                              | ${undefined}
    ${'system_inventory.pattern'}                  | ${'test*'}                                                             | ${undefined}
    ${'system_inventory.pattern'}                  | ${''}                                                                  | ${'Value can not be empty.'}
    ${'system_inventory.pattern'}                  | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'system_inventory.pattern'}                  | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory.pattern'}                  | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory.pattern'}                  | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory.pattern'}                  | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory.pattern'}                  | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory.pattern'}                  | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory.pattern'}                  | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory.pattern'}                  | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory.pattern'}                  | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory.pattern'}                  | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory.pattern'}                  | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory.pattern'}                  | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory.pattern'}                  | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hardware.pattern'}         | ${'test'}                                                              | ${undefined}
    ${'system_inventory_hardware.pattern'}         | ${'test*'}                                                             | ${undefined}
    ${'system_inventory_hardware.pattern'}         | ${''}                                                                  | ${'Value can not be empty.'}
    ${'system_inventory_hardware.pattern'}         | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'system_inventory_hardware.pattern'}         | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_hardware.pattern'}         | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_hardware.pattern'}         | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_hardware.pattern'}         | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_hardware.pattern'}         | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hardware.pattern'}         | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hardware.pattern'}         | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hardware.pattern'}         | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hardware.pattern'}         | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hardware.pattern'}         | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hardware.pattern'}         | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hardware.pattern'}         | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hardware.pattern'}         | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hotfixes.pattern'}         | ${'test'}                                                              | ${undefined}
    ${'system_inventory_hotfixes.pattern'}         | ${'test*'}                                                             | ${undefined}
    ${'system_inventory_hotfixes.pattern'}         | ${''}                                                                  | ${'Value can not be empty.'}
    ${'system_inventory_hotfixes.pattern'}         | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'system_inventory_hotfixes.pattern'}         | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_hotfixes.pattern'}         | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_hotfixes.pattern'}         | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_hotfixes.pattern'}         | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_hotfixes.pattern'}         | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hotfixes.pattern'}         | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hotfixes.pattern'}         | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hotfixes.pattern'}         | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hotfixes.pattern'}         | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hotfixes.pattern'}         | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hotfixes.pattern'}         | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hotfixes.pattern'}         | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hotfixes.pattern'}         | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_interfaces.pattern'}       | ${'test'}                                                              | ${undefined}
    ${'system_inventory_interfaces.pattern'}       | ${'test*'}                                                             | ${undefined}
    ${'system_inventory_interfaces.pattern'}       | ${''}                                                                  | ${'Value can not be empty.'}
    ${'system_inventory_interfaces.pattern'}       | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'system_inventory_interfaces.pattern'}       | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_interfaces.pattern'}       | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_interfaces.pattern'}       | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_interfaces.pattern'}       | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_interfaces.pattern'}       | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_interfaces.pattern'}       | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_interfaces.pattern'}       | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_interfaces.pattern'}       | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_interfaces.pattern'}       | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_interfaces.pattern'}       | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_interfaces.pattern'}       | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_interfaces.pattern'}       | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_interfaces.pattern'}       | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_networks.pattern'}         | ${'test'}                                                              | ${undefined}
    ${'system_inventory_networks.pattern'}         | ${'test*'}                                                             | ${undefined}
    ${'system_inventory_networks.pattern'}         | ${''}                                                                  | ${'Value can not be empty.'}
    ${'system_inventory_networks.pattern'}         | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'system_inventory_networks.pattern'}         | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_networks.pattern'}         | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_networks.pattern'}         | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_networks.pattern'}         | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_networks.pattern'}         | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_networks.pattern'}         | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_networks.pattern'}         | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_networks.pattern'}         | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_networks.pattern'}         | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_networks.pattern'}         | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_networks.pattern'}         | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_networks.pattern'}         | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_networks.pattern'}         | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_packages.pattern'}         | ${'test'}                                                              | ${undefined}
    ${'system_inventory_packages.pattern'}         | ${'test*'}                                                             | ${undefined}
    ${'system_inventory_packages.pattern'}         | ${''}                                                                  | ${'Value can not be empty.'}
    ${'system_inventory_packages.pattern'}         | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'system_inventory_packages.pattern'}         | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_packages.pattern'}         | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_packages.pattern'}         | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_packages.pattern'}         | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_packages.pattern'}         | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_packages.pattern'}         | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_packages.pattern'}         | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_packages.pattern'}         | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_packages.pattern'}         | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_packages.pattern'}         | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_packages.pattern'}         | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_packages.pattern'}         | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_packages.pattern'}         | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_ports.pattern'}            | ${'test'}                                                              | ${undefined}
    ${'system_inventory_ports.pattern'}            | ${'test*'}                                                             | ${undefined}
    ${'system_inventory_ports.pattern'}            | ${''}                                                                  | ${'Value can not be empty.'}
    ${'system_inventory_ports.pattern'}            | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'system_inventory_ports.pattern'}            | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_ports.pattern'}            | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_ports.pattern'}            | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_ports.pattern'}            | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_ports.pattern'}            | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_ports.pattern'}            | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_ports.pattern'}            | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_ports.pattern'}            | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_ports.pattern'}            | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_ports.pattern'}            | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_ports.pattern'}            | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_ports.pattern'}            | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_ports.pattern'}            | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_processes.pattern'}        | ${'test'}                                                              | ${undefined}
    ${'system_inventory_processes.pattern'}        | ${'test*'}                                                             | ${undefined}
    ${'system_inventory_processes.pattern'}        | ${''}                                                                  | ${'Value can not be empty.'}
    ${'system_inventory_processes.pattern'}        | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'system_inventory_processes.pattern'}        | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_processes.pattern'}        | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_processes.pattern'}        | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_processes.pattern'}        | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_processes.pattern'}        | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_processes.pattern'}        | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_processes.pattern'}        | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_processes.pattern'}        | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_processes.pattern'}        | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_processes.pattern'}        | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_processes.pattern'}        | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_processes.pattern'}        | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_processes.pattern'}        | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_protocols.pattern'}        | ${'test'}                                                              | ${undefined}
    ${'system_inventory_protocols.pattern'}        | ${'test*'}                                                             | ${undefined}
    ${'system_inventory_protocols.pattern'}        | ${''}                                                                  | ${'Value can not be empty.'}
    ${'system_inventory_protocols.pattern'}        | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'system_inventory_protocols.pattern'}        | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_protocols.pattern'}        | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_protocols.pattern'}        | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_protocols.pattern'}        | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_protocols.pattern'}        | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_protocols.pattern'}        | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_protocols.pattern'}        | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_protocols.pattern'}        | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_protocols.pattern'}        | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_protocols.pattern'}        | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_protocols.pattern'}        | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_protocols.pattern'}        | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_protocols.pattern'}        | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_system.pattern'}           | ${'test'}                                                              | ${undefined}
    ${'system_inventory_system.pattern'}           | ${'test*'}                                                             | ${undefined}
    ${'system_inventory_system.pattern'}           | ${''}                                                                  | ${'Value can not be empty.'}
    ${'system_inventory_system.pattern'}           | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'system_inventory_system.pattern'}           | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_system.pattern'}           | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_system.pattern'}           | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_system.pattern'}           | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_system.pattern'}           | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_system.pattern'}           | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_system.pattern'}           | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_system.pattern'}           | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_system.pattern'}           | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_system.pattern'}           | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_system.pattern'}           | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_system.pattern'}           | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_system.pattern'}           | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'system_inventory_hardware.sample.prefix'}   | ${'test'}                                                              | ${undefined}
    ${'system_inventory_hardware.sample.prefix'}   | ${''}                                                                  | ${'Value can not be empty.'}
    ${'system_inventory_hardware.sample.prefix'}   | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'system_inventory_hardware.sample.prefix'}   | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_hardware.sample.prefix'}   | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_hardware.sample.prefix'}   | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_hardware.sample.prefix'}   | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_hardware.sample.prefix'}   | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_hardware.sample.prefix'}   | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_hardware.sample.prefix'}   | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_hardware.sample.prefix'}   | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_hardware.sample.prefix'}   | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_hardware.sample.prefix'}   | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_hardware.sample.prefix'}   | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_hardware.sample.prefix'}   | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_hardware.sample.prefix'}   | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_hardware.sample.prefix'}   | ${'test*'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_hotfixes.sample.prefix'}   | ${'test'}                                                              | ${undefined}
    ${'system_inventory_hotfixes.sample.prefix'}   | ${''}                                                                  | ${'Value can not be empty.'}
    ${'system_inventory_hotfixes.sample.prefix'}   | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'system_inventory_hotfixes.sample.prefix'}   | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_hotfixes.sample.prefix'}   | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_hotfixes.sample.prefix'}   | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_hotfixes.sample.prefix'}   | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_hotfixes.sample.prefix'}   | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_hotfixes.sample.prefix'}   | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_hotfixes.sample.prefix'}   | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_hotfixes.sample.prefix'}   | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_hotfixes.sample.prefix'}   | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_hotfixes.sample.prefix'}   | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_hotfixes.sample.prefix'}   | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_hotfixes.sample.prefix'}   | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_hotfixes.sample.prefix'}   | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_hotfixes.sample.prefix'}   | ${'test*'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_interfaces.sample.prefix'} | ${'test'}                                                              | ${undefined}
    ${'system_inventory_interfaces.sample.prefix'} | ${''}                                                                  | ${'Value can not be empty.'}
    ${'system_inventory_interfaces.sample.prefix'} | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'system_inventory_interfaces.sample.prefix'} | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_interfaces.sample.prefix'} | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_interfaces.sample.prefix'} | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_interfaces.sample.prefix'} | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_interfaces.sample.prefix'} | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_interfaces.sample.prefix'} | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_interfaces.sample.prefix'} | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_interfaces.sample.prefix'} | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_interfaces.sample.prefix'} | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_interfaces.sample.prefix'} | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_interfaces.sample.prefix'} | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_interfaces.sample.prefix'} | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_interfaces.sample.prefix'} | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_interfaces.sample.prefix'} | ${'test*'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_networks.sample.prefix'}   | ${'test'}                                                              | ${undefined}
    ${'system_inventory_networks.sample.prefix'}   | ${''}                                                                  | ${'Value can not be empty.'}
    ${'system_inventory_networks.sample.prefix'}   | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'system_inventory_networks.sample.prefix'}   | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_networks.sample.prefix'}   | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_networks.sample.prefix'}   | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_networks.sample.prefix'}   | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_networks.sample.prefix'}   | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_networks.sample.prefix'}   | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_networks.sample.prefix'}   | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_networks.sample.prefix'}   | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_networks.sample.prefix'}   | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_networks.sample.prefix'}   | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_networks.sample.prefix'}   | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_networks.sample.prefix'}   | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_networks.sample.prefix'}   | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_networks.sample.prefix'}   | ${'test*'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_packages.sample.prefix'}   | ${'test'}                                                              | ${undefined}
    ${'system_inventory_packages.sample.prefix'}   | ${''}                                                                  | ${'Value can not be empty.'}
    ${'system_inventory_packages.sample.prefix'}   | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'system_inventory_packages.sample.prefix'}   | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_packages.sample.prefix'}   | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_packages.sample.prefix'}   | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_packages.sample.prefix'}   | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_packages.sample.prefix'}   | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_packages.sample.prefix'}   | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_packages.sample.prefix'}   | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_packages.sample.prefix'}   | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_packages.sample.prefix'}   | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_packages.sample.prefix'}   | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_packages.sample.prefix'}   | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_packages.sample.prefix'}   | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_packages.sample.prefix'}   | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_packages.sample.prefix'}   | ${'test*'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_ports.sample.prefix'}      | ${'test'}                                                              | ${undefined}
    ${'system_inventory_ports.sample.prefix'}      | ${''}                                                                  | ${'Value can not be empty.'}
    ${'system_inventory_ports.sample.prefix'}      | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'system_inventory_ports.sample.prefix'}      | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_ports.sample.prefix'}      | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_ports.sample.prefix'}      | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_ports.sample.prefix'}      | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_ports.sample.prefix'}      | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_ports.sample.prefix'}      | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_ports.sample.prefix'}      | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_ports.sample.prefix'}      | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_ports.sample.prefix'}      | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_ports.sample.prefix'}      | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_ports.sample.prefix'}      | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_ports.sample.prefix'}      | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_ports.sample.prefix'}      | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_ports.sample.prefix'}      | ${'test*'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_processes.sample.prefix'}  | ${'test'}                                                              | ${undefined}
    ${'system_inventory_processes.sample.prefix'}  | ${''}                                                                  | ${'Value can not be empty.'}
    ${'system_inventory_processes.sample.prefix'}  | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'system_inventory_processes.sample.prefix'}  | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_processes.sample.prefix'}  | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_processes.sample.prefix'}  | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_processes.sample.prefix'}  | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_processes.sample.prefix'}  | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_processes.sample.prefix'}  | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_processes.sample.prefix'}  | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_processes.sample.prefix'}  | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_processes.sample.prefix'}  | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_processes.sample.prefix'}  | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_processes.sample.prefix'}  | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_processes.sample.prefix'}  | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_processes.sample.prefix'}  | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_processes.sample.prefix'}  | ${'test*'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_protocols.sample.prefix'}  | ${'test'}                                                              | ${undefined}
    ${'system_inventory_protocols.sample.prefix'}  | ${''}                                                                  | ${'Value can not be empty.'}
    ${'system_inventory_protocols.sample.prefix'}  | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'system_inventory_protocols.sample.prefix'}  | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_protocols.sample.prefix'}  | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_protocols.sample.prefix'}  | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_protocols.sample.prefix'}  | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_protocols.sample.prefix'}  | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_protocols.sample.prefix'}  | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_protocols.sample.prefix'}  | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_protocols.sample.prefix'}  | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_protocols.sample.prefix'}  | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_protocols.sample.prefix'}  | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_protocols.sample.prefix'}  | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_protocols.sample.prefix'}  | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_protocols.sample.prefix'}  | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_protocols.sample.prefix'}  | ${'test*'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_system.sample.prefix'}     | ${'test'}                                                              | ${undefined}
    ${'system_inventory_system.sample.prefix'}     | ${''}                                                                  | ${'Value can not be empty.'}
    ${'system_inventory_system.sample.prefix'}     | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'system_inventory_system.sample.prefix'}     | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_system.sample.prefix'}     | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_system.sample.prefix'}     | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_system.sample.prefix'}     | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'system_inventory_system.sample.prefix'}     | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_system.sample.prefix'}     | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_system.sample.prefix'}     | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_system.sample.prefix'}     | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_system.sample.prefix'}     | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_system.sample.prefix'}     | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_system.sample.prefix'}     | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_system.sample.prefix'}     | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_system.sample.prefix'}     | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'system_inventory_system.sample.prefix'}     | ${'test*'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'timeout'}                                   | ${15000}                                                               | ${undefined}
    ${'timeout'}                                   | ${1000}                                                                | ${'Value should be greater or equal than 1500.'}
    ${'timeout'}                                   | ${''}                                                                  | ${'Value should be greater or equal than 1500.'}
    ${'timeout'}                                   | ${'1.2'}                                                               | ${'Number should be an integer.'}
    ${'timeout'}                                   | ${1.2}                                                                 | ${'Number should be an integer.'}
    ${'wazuh.monitoring.creation'}                 | ${'h'}                                                                 | ${undefined}
    ${'wazuh.monitoring.creation'}                 | ${'d'}                                                                 | ${undefined}
    ${'wazuh.monitoring.creation'}                 | ${'w'}                                                                 | ${undefined}
    ${'wazuh.monitoring.creation'}                 | ${'m'}                                                                 | ${undefined}
    ${'wazuh.monitoring.creation'}                 | ${'test'}                                                              | ${'Invalid value. Allowed values: h, d, w, m.'}
    ${'wazuh.monitoring.enabled'}                  | ${true}                                                                | ${undefined}
    ${'wazuh.monitoring.frequency'}                | ${100}                                                                 | ${undefined}
    ${'wazuh.monitoring.frequency'}                | ${40}                                                                  | ${'Value should be greater or equal than 60.'}
    ${'wazuh.monitoring.frequency'}                | ${'1.2'}                                                               | ${'Number should be an integer.'}
    ${'wazuh.monitoring.frequency'}                | ${1.2}                                                                 | ${'Number should be an integer.'}
    ${'wazuh.monitoring.pattern'}                  | ${'test'}                                                              | ${undefined}
    ${'wazuh.monitoring.pattern'}                  | ${'test*'}                                                             | ${undefined}
    ${'wazuh.monitoring.pattern'}                  | ${''}                                                                  | ${'Value can not be empty.'}
    ${'wazuh.monitoring.pattern'}                  | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'wazuh.monitoring.pattern'}                  | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'wazuh.monitoring.pattern'}                  | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'wazuh.monitoring.pattern'}                  | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'wazuh.monitoring.pattern'}                  | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'wazuh.monitoring.pattern'}                  | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'wazuh.monitoring.pattern'}                  | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'wazuh.monitoring.pattern'}                  | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'wazuh.monitoring.pattern'}                  | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'wazuh.monitoring.pattern'}                  | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'wazuh.monitoring.pattern'}                  | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'wazuh.monitoring.pattern'}                  | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'wazuh.monitoring.pattern'}                  | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'wazuh.monitoring.replicas'}                 | ${0}                                                                   | ${undefined}
    ${'wazuh.monitoring.replicas'}                 | ${-1}                                                                  | ${'Value should be greater or equal than 0.'}
    ${'wazuh.monitoring.replicas'}                 | ${'1.2'}                                                               | ${'Number should be an integer.'}
    ${'wazuh.monitoring.replicas'}                 | ${1.2}                                                                 | ${'Number should be an integer.'}
    ${'wazuh.monitoring.shards'}                   | ${1}                                                                   | ${undefined}
    ${'wazuh.monitoring.shards'}                   | ${-1}                                                                  | ${'Value should be greater or equal than 1.'}
    ${'wazuh.monitoring.shards'}                   | ${'1.2'}                                                               | ${'Number should be an integer.'}
    ${'wazuh.monitoring.shards'}                   | ${1.2}                                                                 | ${'Number should be an integer.'}
    ${'vulnerabilities.pattern'}                   | ${'test'}                                                              | ${undefined}
    ${'vulnerabilities.pattern'}                   | ${'test*'}                                                             | ${undefined}
    ${'vulnerabilities.pattern'}                   | ${''}                                                                  | ${'Value can not be empty.'}
    ${'vulnerabilities.pattern'}                   | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'vulnerabilities.pattern'}                   | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'vulnerabilities.pattern'}                   | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'vulnerabilities.pattern'}                   | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'vulnerabilities.pattern'}                   | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'vulnerabilities.pattern'}                   | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'vulnerabilities.pattern'}                   | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'vulnerabilities.pattern'}                   | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'vulnerabilities.pattern'}                   | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'vulnerabilities.pattern'}                   | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'vulnerabilities.pattern'}                   | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'vulnerabilities.pattern'}                   | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'vulnerabilities.pattern'}                   | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #.'}
    ${'vulnerabilities.sample.prefix'}             | ${'test'}                                                              | ${undefined}
    ${'vulnerabilities.sample.prefix'}             | ${''}                                                                  | ${'Value can not be empty.'}
    ${'vulnerabilities.sample.prefix'}             | ${'test space'}                                                        | ${'No whitespaces allowed.'}
    ${'vulnerabilities.sample.prefix'}             | ${'-test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'vulnerabilities.sample.prefix'}             | ${'_test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'vulnerabilities.sample.prefix'}             | ${'+test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'vulnerabilities.sample.prefix'}             | ${'.test'}                                                             | ${"It can't start with: -, _, +, .."}
    ${'vulnerabilities.sample.prefix'}             | ${'test\\'}                                                            | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'vulnerabilities.sample.prefix'}             | ${'test/'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'vulnerabilities.sample.prefix'}             | ${'test?'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'vulnerabilities.sample.prefix'}             | ${'test"'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'vulnerabilities.sample.prefix'}             | ${'test<'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'vulnerabilities.sample.prefix'}             | ${'test>'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'vulnerabilities.sample.prefix'}             | ${'test|'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'vulnerabilities.sample.prefix'}             | ${'test,'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'vulnerabilities.sample.prefix'}             | ${'test#'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
    ${'vulnerabilities.sample.prefix'}             | ${'test*'}                                                             | ${'It can\'t contain invalid characters: \\, /, ?, ", <, >, |, ,, #, *.'}
  `(
    '$setting | $value | $expectedValidation',
    ({ setting, value, expectedValidation }) => {
      // FIXME: use the plugins definition
      if (setting === 'cron.statistics.interval') {
        expect(validateCronStatisticsInterval(value)).toBe(expectedValidation);
      } else {
        expect(PLUGIN_SETTINGS[setting].validateUIForm(value)).toBe(
          expectedValidation,
        );
      }
    },
  );
});
