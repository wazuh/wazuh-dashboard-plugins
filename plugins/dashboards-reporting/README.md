<img src="https://opensearch.org/assets/img/opensearch-logo-themed.svg" height="64px">

- [OpenSearch Dashboards Reports](#opensearch-dashboards-reporting)
- [Code Summary](#code-summary)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Setup](#setup-&-build)
- [Notifications Integration](#notifications-integration)
- [Troubleshooting](#troubleshooting)
- [Code of Conduct](#code-of-conduct)
- [Security](#security)
- [License](#license)
- [Copyright](#copyright)

# OpenSearch Dashboards Reports

OpenSearch Dashboards Reports allows ‘Report Owner’ (engineers, including but not limited to developers, DevOps, IT Engineer, and IT admin) export and share reports from OpenSearch Dashboards dashboards, saved search, alerts and visualizations. It helps automate the process of scheduling reports on an on-demand or a periodical basis (on cron schedules as well). Further, it also automates the process of exporting and sharing reports triggered for various alerts. The feature is present in the Dashboard, Discover, and Visualization tabs. We are currently working on integrating Dashboards Reports with Notifications to enable sharing functionality. After the support is introduced, scheduled reports can be sent to (shared with) self or various stakeholders within the organization. These stakeholders include but are not limited to, executives, managers, engineers (developers, DevOps, IT Engineer) in the form of pdf, hyperlinks, csv, excel via various channels such as email, Slack, and Amazon Chime. However, in order to export, schedule and share reports, report owners should have the necessary permissions as defined under Roles and Privileges.

## Code Summary

### Dashboard-Reports

|                          |                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Test and build           | [![Observability Dashboards CI][dashboard-reports-build-badge]][dashboard-reports-build-link]                      |
| Code coverage            | [![codecov][dashboard-reports-codecov-badge]][codecov-link]                                                        |
| Distribution build tests | [![cypress tests][cypress-test-badge]][cypress-test-link] [![cypress code][cypress-code-badge]][cypress-code-link] |

### Repository Checks

|              |                                                                 |
| ------------ | --------------------------------------------------------------- |
| DCO Checker  | [![Developer certificate of origin][dco-badge]][dco-badge-link] |
| Link Checker | [![Link Checker][link-check-badge]][link-check-link]            |

### Issues

|                                                                |
| -------------------------------------------------------------- |
| [![good first issues open][good-first-badge]][good-first-link] |
| [![features open][feature-badge]][feature-link]                |
| [![enhancements open][enhancement-badge]][enhancement-link]    |
| [![bugs open][bug-badge]][bug-link]                            |
| [![untriaged open][untriaged-badge]][untriaged-link]           |
| [![nolabel open][nolabel-badge]][nolabel-link]                 |

[dco-badge]: https://github.com/opensearch-project/dashboards-reporting/actions/workflows/dco.yml/badge.svg
[dco-badge-link]: https://github.com/opensearch-project/dashboards-reporting/actions/workflows/dco.yml
[link-check-badge]: https://github.com/opensearch-project/dashboards-reporting/actions/workflows/link-checker.yml/badge.svg
[link-check-link]: https://github.com/opensearch-project/dashboards-reporting/actions/workflows/link-checker.yml
[dashboard-reports-build-badge]: https://github.com/opensearch-project/dashboards-reporting/actions/workflows/dashboards-reports-test-and-build-workflow.yml/badge.svg
[dashboard-reports-build-link]: https://github.com/opensearch-project/dashboards-reporting/actions/workflows/dashboards-reports-test-and-build-workflow.yml
[dashboard-reports-codecov-badge]: https://codecov.io/gh/opensearch-project/dashboards-reporting/branch/main/graphs/badge.svg?flag=dashboards-reporting
[codecov-link]: https://codecov.io/gh/opensearch-project/dashboards-reporting
[cypress-test-badge]: https://img.shields.io/badge/Cypress%20tests-in%20progress-yellow
[cypress-test-link]: https://github.com/opensearch-project/opensearch-build/issues/1124
[cypress-code-badge]: https://img.shields.io/badge/Cypress%20code-blue
[cypress-code-link]: https://github.com/opensearch-project/dashboards-reporting/tree/main/dashboards-reporting/.cypress/integration
[bwc-tests-badge]: https://img.shields.io/badge/BWC%20tests-in%20progress-yellow
[bwc-tests-link]: https://github.com/opensearch-project/dashboards-reporting/pull/244/files
[good-first-badge]: https://img.shields.io/github/issues/opensearch-project/dashboards-reporting/good%20first%20issue.svg
[good-first-link]: https://github.com/opensearch-project/dashboards-reporting/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22+
[feature-badge]: https://img.shields.io/github/issues/opensearch-project/dashboards-reporting/feature%20request.svg
[feature-link]: https://github.com/opensearch-project/dashboards-reporting/issues?q=is%3Aopen+is%3Aissue+label%3A%22feature+request%22+
[bug-badge]: https://img.shields.io/github/issues/opensearch-project/dashboards-reporting/bug.svg
[bug-link]: https://github.com/opensearch-project/dashboards-reporting/issues?q=is%3Aopen+is%3Aissue+label%3Abug+
[enhancement-badge]: https://img.shields.io/github/issues/opensearch-project/dashboards-reporting/enhancement.svg
[enhancement-link]: https://github.com/opensearch-project/dashboards-reporting/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement+
[untriaged-badge]: https://img.shields.io/github/issues/opensearch-project/dashboards-reporting/untriaged.svg
[untriaged-link]: https://github.com/opensearch-project/dashboards-reporting/issues?q=is%3Aopen+is%3Aissue+label%3Auntriaged+
[nolabel-badge]: https://img.shields.io/github/issues-search/opensearch-project/dashboards-reporting?color=yellow&label=no%20label%20issues&query=is%3Aopen%20is%3Aissue%20no%3Alabel
[nolabel-link]: https://github.com/opensearch-project/dashboards-reporting/issues?q=is%3Aopen+is%3Aissue+no%3Alabel+

## Documentation & Forum

Please see our technical [documentation](https://opensearch.org/docs/dashboards/reporting/) to learn more about its features. For additional help with the plugin, including questions about opening an issue, try the OpenSearch [Forum](https://forum.opensearch.org/c/opensearch-dashboards/reports/51).

## Contributing

We welcome you to get involved in development, documentation, testing the OpenSearch Dashboards reports plugin. See our [CONTRIBUTING.md](./CONTRIBUTING.md) and join in.

## Setup & Build

Please see [developer guide](DEVELOPER_GUIDE.md).

## Notifications Integration

OpenSearch Dashboards Reports integration with [Notifications](https://github.com/opensearch-project/notifications) is currently in progress. Tracking [here](https://github.com/opensearch-project/dashboards-reports/issues/72)

## Code of Conduct

This project has adopted the [Amazon Open Source Code of Conduct](CODE_OF_CONDUCT.md). For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq), or contact [opensource-codeofconduct@amazon.com](mailto:opensource-codeofconduct@amazon.com) with any additional questions or comments.

## Security

If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/). Please do **not** create a public GitHub issue.

## License

See the [LICENSE](./LICENSE) file for our project's licensing. We will ask you to confirm the licensing of your contribution.

## Copyright

Copyright OpenSearch Contributors. See [NOTICE](NOTICE.txt) for details.