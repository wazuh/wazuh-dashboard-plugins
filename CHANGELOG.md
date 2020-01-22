# Change Log

All notable changes to the Wazuh app project will be documented in this file.


## Wazuh v3.11.2 - Kibana v6.8.6, v7.3.2, v7.5.1 - Revision 852

### Added

- Support for Wazuh v3.11.2

### Changed

- Increased list filesize limit for the CDB-list [#1993](https://github.com/wazuh/wazuh-kibana-app/pull/1993)

### Fixed

- The xml validator now correctly handles the `--` string within comments [#1980](https://github.com/wazuh/wazuh-kibana-app/pull/1980)
- The AWS map visualization wasn't been loaded until the user interacts with it [dd31bd7](https://github.com/wazuh/wazuh-kibana-app/commit/dd31bd7a155354bc50fe0af22fca878607c8936a)


## Wazuh v3.11.1 - Kibana v6.8.6, v7.3.2, v7.5.1 - Revision 581

### Added
- Support for Wazuh v3.11.1.


## Wazuh v3.11.0 - Kibana v6.8.6, v7.3.2, v7.5.1 - Revision 580

### Added

- Support for Wazuh v3.11.0.
- Support for Kibana v7.5.1.
- The API credentials configuration has been moved from the .wazuh index to a wazuh.yml configuration file. Now the configuration of the API hosts is done from the file and not from the application. [#1465](https://github.com/wazuh/wazuh-kibana-app/issues/1465) [#1771](https://github.com/wazuh/wazuh-kibana-app/issues/1771).
- Upload ruleset files using a "drag and drop" component [#1770](https://github.com/wazuh/wazuh-kibana-app/issues/1770)
- Add logs for the reporting module [#1622](https://github.com/wazuh/wazuh-kibana-app/issues/1622).
- Extended the "Add new agent" guide [#1767](https://github.com/wazuh/wazuh-kibana-app/issues/1767).
- Add new table for windows hotfixes [#1932](https://github.com/wazuh/wazuh-kibana-app/pull/1932)

### Changed

- Removed Discover from top menu [#1699](https://github.com/wazuh/wazuh-kibana-app/issues/1699).
- Hide index pattern selector in case that only one exists [#1799](https://github.com/wazuh/wazuh-kibana-app/issues/1799).
- Remove visualizations legend [#1936](https://github.com/wazuh/wazuh-kibana-app/pull/1936)
- Normalize the field whodata in the group reporting [#1921](https://github.com/wazuh/wazuh-kibana-app/pull/1921)
- A message in the configuration view is ambiguous [#1870](https://github.com/wazuh/wazuh-kibana-app/issues/1870)
- Refactor syscheck table [#1941](https://github.com/wazuh/wazuh-kibana-app/pull/1941)

### Fixed

- Empty files now throws an error [#1806](https://github.com/wazuh/wazuh-kibana-app/issues/1806).
- Arguments for wazuh api requests are now validated [#1815](https://github.com/wazuh/wazuh-kibana-app/issues/1815).
- Fixed the way to check admin mode [#1838](https://github.com/wazuh/wazuh-kibana-app/issues/1838).
- Fixed error exporting as CSV the files into a group [#1833](https://github.com/wazuh/wazuh-kibana-app/issues/1833).
- Fixed XML validator false error for `<` [1882](https://github.com/wazuh/wazuh-kibana-app/issues/1882)
- Fixed "New file" editor doesn't allow saving twice [#1896](https://github.com/wazuh/wazuh-kibana-app/issues/1896)
- Fixed decoders files [#1929](https://github.com/wazuh/wazuh-kibana-app/pull/1929)
- Fixed registration guide [#1926](https://github.com/wazuh/wazuh-kibana-app/pull/1926)
- Fixed infinite load on Ciscat views [#1920](https://github.com/wazuh/wazuh-kibana-app/pull/1920), [#1916](https://github.com/wazuh/wazuh-kibana-app/pull/1916)
- Fixed missing fields in the Visualizations [#1913](https://github.com/wazuh/wazuh-kibana-app/pull/1913)
- Fixed Amazon S3 status is wrong in configuration section [#1864](https://github.com/wazuh/wazuh-kibana-app/issues/1864)
- Fixed hidden overflow in the fim configuration [#1887](https://github.com/wazuh/wazuh-kibana-app/pull/1887)
- Fixed Logo source fail after adding server.basePath [#1871](https://github.com/wazuh/wazuh-kibana-app/issues/1871)
- Fixed the documentation broken links [#1853](https://github.com/wazuh/wazuh-kibana-app/pull/1853)

## Wazuh v3.10.2 - Kibana v7.5.1 - Revision 556

### Added

- Support for Kibana v7.5.1


## Wazuh v3.10.2 - Kibana v7.5.0 - Revision 555

### Added

- Support for Kibana v7.5.0


## Wazuh v3.10.2 - Kibana v7.4.2 - Revision 549

### Added

- Support for Kibana v7.4.2


## Wazuh v3.10.2 - Kibana v7.4.1 - Revision 548

### Added

- Support for Kibana v7.4.1


## Wazuh v3.10.2 - Kibana v7.4.0 - Revision 547

### Added

- Support for Kibana v7.4.0
- Support for Wazuh v3.10.2.


## Wazuh v3.10.2 - Kibana v7.3.2 - Revision 546

### Added

- Support for Wazuh v3.10.2.


## Wazuh v3.10.1 - Kibana v7.3.2 - Revision 545

### Added

- Support for Wazuh v3.10.1.


## Wazuh v3.10.0 - Kibana v7.3.2 - Revision 543

### Added

- Support for Wazuh v3.10.0.
- Added an interactive guide for registering agents, things are now easier for the user, guiding it through the steps needed ending in a _copy & paste_ snippet for deploying his agent [#1468](https://github.com/wazuh/wazuh-kibana-app/issues/1468).
- Added new dashboards for the recently added regulatory compliance groups into the Wazuh core. They are HIPAA and NIST-800-53 [#1468](https://github.com/wazuh/wazuh-kibana-app/issues/1448), [#1638]( https://github.com/wazuh/wazuh-kibana-app/issues/1638).
- Make the app work under a custom Kibana space [#1234](https://github.com/wazuh/wazuh-kibana-app/issues/1234), [#1450](https://github.com/wazuh/wazuh-kibana-app/issues/1450).
- Added the ability to manage the app as a native plugin when using Kibana spaces, now you can safely hide/show the app depending on the selected space [#1601](https://github.com/wazuh/wazuh-kibana-app/issues/1601).
- Adapt the app the for Kibana dark mode [#1562](https://github.com/wazuh/wazuh-kibana-app/issues/1562).
- Added an alerts summary in _Overview > FIM_ panel [#1527](https://github.com/wazuh/wazuh-kibana-app/issues/1527).
- Export all the information of a Wazuh group and its related agents in a PDF document [#1341](https://github.com/wazuh/wazuh-kibana-app/issues/1341).
- Export the configuration of a certain agent as a PDF document. Supports granularity for exporting just certain sections of the configuration [#1340](https://github.com/wazuh/wazuh-kibana-app/issues/1340).


### Changed

- Reduced _Agents preview_ load time using the new API endpoint `/summary/agents` [#1687](https://github.com/wazuh/wazuh-kibana-app/pull/1687).
- Replaced most of the _md-nav-bar_ Angular.js components with React components using EUI [#1705](https://github.com/wazuh/wazuh-kibana-app/pull/1705).
- Replaced the requirements slider component with a new styled component [#1708](https://github.com/wazuh/wazuh-kibana-app/pull/1708).
- Soft deprecated the _.wazuh-version_ internal index, now the app dumps its content if applicable to a registry file, then the app removes that index. Further versions will hard deprecate this index [#1467](https://github.com/wazuh/wazuh-kibana-app/issues/1467). 
- Visualizations now don't fetch the documents _source_, also, they now use _size: 0_ for fetching [#1663](https://github.com/wazuh/wazuh-kibana-app/issues/1663).
- The app menu is now fixed on top of the view, it's not being hidden on every state change. Also, the Wazuh logo was placed in the top bar of Kibana UI [#1502](https://github.com/wazuh/wazuh-kibana-app/issues/1502).
- Improved _getTimestamp_ method not returning a promise object because it's no longer needed [014bc3a](https://github.com/wazuh/wazuh-kibana-app/commit/014b3aba0d2e9cda0c4d521f5f16faddc434a21e). Also improved main Discover listener for Wazuh not returning a promise object [bd82823](https://github.com/wazuh/wazuh-kibana-app/commit/bd8282391a402b8c567b32739cf914a0135d74bc).
- Replaced _Requirements over time_ visualizations in both PCI DSS and GDPR dashboards [35c539](https://github.com/wazuh/wazuh-kibana-app/commit/35c539eb328b3bded94aa7608f73f9cc51c235a6).
- Do not show a toaster when a visualization field was not known yet, instead, show it just in case the internal refreshing failed [19a2e7](https://github.com/wazuh/wazuh-kibana-app/commit/19a2e71006b38f6a64d3d1eb8a20b02b415d7e07).
- Minor optimizations for server logging [eb8e000](https://github.com/wazuh/wazuh-kibana-app/commit/eb8e00057dfea2dafef56319590ff832042c402d).

### Fixed

- Alerts search bar fixed for Kibana v7.3.1, queries were not being applied as expected [#1686](https://github.com/wazuh/wazuh-kibana-app/issues/1686).
- Hide attributes field from non-Windows agents in the FIM table [#1710](https://github.com/wazuh/wazuh-kibana-app/issues/1710).
- Fixed broken view in Management > Configuration > Amazon S3 > Buckets, some information was missing [#1675](https://github.com/wazuh/wazuh-kibana-app/issues/1675).
- Keep user's filters when switching from Discover to panel [#1685](https://github.com/wazuh/wazuh-kibana-app/issues/1685).
- Reduce load time and amount of data to be fetched in _Management > Cluster monitoring_ section avoiding possible timeouts [#1663](https://github.com/wazuh/wazuh-kibana-app/issues/1663).
- Restored _Remove column_ feature in Discover tabs [#1702](https://github.com/wazuh/wazuh-kibana-app/issues/1702).
- Apps using Kibana v7.3.1 had a bug once the user goes back from _Agent > FIM > Files_ to _Agent > FIM > dashboard_, filters disappear, now it's working properly [#1700](https://github.com/wazuh/wazuh-kibana-app/issues/1700).
- Fixed visual bug in _Management > Cluster monitoring_ and a button position [1e3b748](https://github.com/wazuh/wazuh-kibana-app/commit/1e3b748f11b43b2e7956b830269b6d046d74d12c).
- The app installation date was not being updated properly, now it's fixed [#1692](https://github.com/wazuh/wazuh-kibana-app/issues/1692).
- Fixed _Network interfaces_ table in Inventory section, the table was not paginating [#1474](https://github.com/wazuh/wazuh-kibana-app/issues/1474).
- Fixed APIs passwords are now obfuscated in server responses [adc3152](https://github.com/wazuh/wazuh-kibana-app/pull/1782/commits/adc31525e26b25e4cb62d81cbae70a8430728af5).


## Wazuh v3.9.5 - Kibana v6.8.2 / Kibana v7.2.1 / Kibana v7.3.0 - Revision 531

### Added

- Support for Wazuh v3.9.5

## Wazuh v3.9.4 - Kibana v6.8.1 / Kibana v6.8.2 / Kibana v7.2.0 / Kibana v7.2.1 / Kibana v7.3.0 - Revision 528

### Added

- Support for Wazuh v3.9.4
- Allow filtering by clicking a column in rules/decoders tables [0e2ddd7](https://github.com/wazuh/wazuh-kibana-app/pull/1615/commits/0e2ddd7b73f7f7975d02e97ed86ae8a0966472b4)
- Allow open file in rules table clicking on the file column [1af929d](https://github.com/wazuh/wazuh-kibana-app/pull/1615/commits/1af929d62f450f93c6733868bcb4057e16b7e279)

### Changed

- Improved app performance [#1640](https://github.com/wazuh/wazuh-kibana-app/pull/1640).
- Remove path filter from custom rules and decoders [895792e](https://github.com/wazuh/wazuh-kibana-app/pull/1615/commits/895792e6e6d9401b3293d5e16352b9abef515096)
- Show path column in rules and decoders [6f49816](https://github.com/wazuh/wazuh-kibana-app/pull/1615/commits/6f49816c71b5999d77bf9e3838443627c9be945d)
- Removed SCA overview dashboard [94ebbff](https://github.com/wazuh/wazuh-kibana-app/pull/1615/commits/94ebbff231cbfb6d793130e0b9ea855baa755a1c)
- Disabled last custom column removal [f1ef7de](https://github.com/wazuh/wazuh-kibana-app/pull/1615/commits/f1ef7de1a34bbe53a899596002e8153b95e7dc0e)
- Agents messages across sections unification [8fd7e36](https://github.com/wazuh/wazuh-kibana-app/pull/1615/commits/8fd7e36286fa9dfd03a797499af6ffbaa90b00e1)

### Fixed

- Fix check storeded apis [d6115d6](https://github.com/wazuh/wazuh-kibana-app/pull/1615/commits/d6115d6424c78f0cde2017b432a51b77186dd95a).
- Fix pci-dss console error [297080d](https://github.com/wazuh/wazuh-kibana-app/pull/1615/commits/297080d36efaea8f99b0cafd4c48845dad20495a)
- Fix error in reportingTable [85b7266](https://github.com/wazuh/wazuh-kibana-app/pull/1615/commits/85b72662cb4db44c443ed04f7c31fba57eefccaa)
- Fix filters budgets size [c7ac86a](https://github.com/wazuh/wazuh-kibana-app/pull/1615/commits/c7ac86acb3d5afaf1cf348fab09a2b8c5778a491)
- Fix missing permalink virustotal visualization [1b57529](https://github.com/wazuh/wazuh-kibana-app/pull/1615/commits/1b57529758fccdeb3ac0840e66a8aafbe4757a96)
- Improved wz-table performance [224bd6f](https://github.com/wazuh/wazuh-kibana-app/pull/1615/commits/224bd6f31235c81ba01755c3c1e120c3f86beafd)
- Fix inconsistent data between visualizations and tables in Overview Security Events [b12c600](https://github.com/wazuh/wazuh-kibana-app/pull/1615/commits/b12c600578d80d0715507dec4624a4ebc27ea573)
- Timezone applied in cluster status [a4f620d](https://github.com/wazuh/wazuh-kibana-app/pull/1615/commits/a4f620d398f5834a6d2945af892a462425ca3bec)
- Fixed Overview Security Events report when wazuh.monitoring is disabled [1c26da0](https://github.com/wazuh/wazuh-kibana-app/pull/1615/commits/1c26da05a0b6daf727e15c13b819111aa4e4e913)
- Fixes in APIs management [2143943](https://github.com/wazuh/wazuh-kibana-app/pull/1615/commits/2143943a5049cbb59bb8d6702b5a56cbe0d27a2a)
- Prevent duplicated visualization toast errors [786faf3](https://github.com/wazuh/wazuh-kibana-app/commit/786faf3e62d2cad13f512c0f873b36eca6e9787d)
- Fix not properly updated breadcrumb in ruleset section [9645903](https://github.com/wazuh/wazuh-kibana-app/commit/96459031cd4edbe047970bf0d22d0c099771879f)
- Fix badly dimensioned table in Integrity Monitoring section [9645903](https://github.com/wazuh/wazuh-kibana-app/commit/96459031cd4edbe047970bf0d22d0c099771879f)
- Fix implicit filters can be destroyed [9cf8578](https://github.com/wazuh/wazuh-kibana-app/commit/9cf85786f504f5d67edddeea6cfbf2ab577e799b)
- Windows agent dashboard doesn't show failure logon access. [d38d088](https://github.com/wazuh/wazuh-kibana-app/commit/d38d0881ac8e4294accde83d63108337b74cdd91) 
- Number of agents is not properly updated.  [f7cbbe5](https://github.com/wazuh/wazuh-kibana-app/commit/f7cbbe54394db825827715c3ad4370ac74317108) 
- Missing scrollbar on Firefox file viewer.  [df4e8f9](https://github.com/wazuh/wazuh-kibana-app/commit/df4e8f9305b35e9ee1473bed5f5d452dd3420567) 
- Agent search filter by name, lost when refreshing. [71b5274](https://github.com/wazuh/wazuh-kibana-app/commit/71b5274ccc332d8961a158587152f7badab28a95) 
- Alerts of level 12 cannot be displayed in the Summary table. [ec0e888](https://github.com/wazuh/wazuh-kibana-app/commit/ec0e8885d9f1306523afbc87de01a31f24e36309) 
- Restored query from search bar in visualizations. [439128f](https://github.com/wazuh/wazuh-kibana-app/commit/439128f0a1f65b649a9dcb81ab5804ca20f65763) 
- Fix Kibana filters loop in Firefox. [82f0f32](https://github.com/wazuh/wazuh-kibana-app/commit/82f0f32946d844ce96a28f0185f903e8e05c5589) 

## Wazuh v3.9.3 - Kibana v6.8.1 / v7.1.1 / v7.2.0 - Revision 523

### Added

- Support for Wazuh v3.9.3
- Support for Kibana v7.2.0 [#1556](https://github.com/wazuh/wazuh-kibana-app/pull/1556).

### Changed

- New design and several UI/UX changes [#1525](https://github.com/wazuh/wazuh-kibana-app/pull/1525).
- Improved error checking + syscollector performance [94d0a83](https://github.com/wazuh/wazuh-kibana-app/commit/94d0a83e43aa1d2d84ef6f87cbb76b9aefa085b3).
- Adapt Syscollector for MacOS agents [a4bf7ef](https://github.com/wazuh/wazuh-kibana-app/commit/a4bf7efc693a99b7565b5afcaa372155f15a4db9).
- Show last scan for syscollector [73f2056](https://github.com/wazuh/wazuh-kibana-app/commit/73f2056673bb289d472663397ba7097e49b7b93b).
- Extendend information for syscollector [#1585](https://github.com/wazuh/wazuh-kibana-app/issues/1585).

### Fixed

- Corrected width for agent stats [a998955](https://github.com/wazuh/wazuh-kibana-app/commit/a99895565a8854c55932ec94cffb08e1d0aa3da1).
- Fix height for the menu directive with Dynamic height [427d0f3](https://github.com/wazuh/wazuh-kibana-app/commit/427d0f3e9fa6c34287aa9e8557da99a51e0db40f).
- Fix wazuh-db and clusterd check [cddcef6](https://github.com/wazuh/wazuh-kibana-app/commit/cddcef630c5234dd6f6a495715743dfcfd4e4001).
- Fix AlertsStats when value is "0", it was showing "-" [07a3e10](https://github.com/wazuh/wazuh-kibana-app/commit/07a3e10c7f1e626ba75a55452b6c295d11fd657d).
- Fix syscollector state value [f8d3d0e](https://github.com/wazuh/wazuh-kibana-app/commit/f8d3d0eca44e67e26f79bc574495b1f4c8f751f2).
- Fix time offset for reporting table [2ef500b](https://github.com/wazuh/wazuh-kibana-app/commit/2ef500bb112e68bd4811b8e87ce8581d7c04d20f).
- Fix call to obtain GDPR requirements for specific agent [ccda846](https://github.com/wazuh/wazuh-kibana-app/commit/ccda8464b50be05bc5b3642f25f4972c8a7a2c03).
- Restore "rule.id" as a clickable field in visualizations [#1546](https://github.com/wazuh/wazuh-kibana-app/pull/1546).
- Fix timepicker in cluster monitoring [f7533ce](https://github.com/wazuh/wazuh-kibana-app/pull/1560/commits/f7533cecb6862abfb5c1d2173ec3e70ffc59804a).
- Fix several bugs [#1569](https://github.com/wazuh/wazuh-kibana-app/pull/1569).
- Fully removed "rule.id" as URL field [#1584](https://github.com/wazuh/wazuh-kibana-app/issues/1584).
- Fix filters for dashboards [#1583](https://github.com/wazuh/wazuh-kibana-app/issues/1583).
- Fix missing dependency [#1591](https://github.com/wazuh/wazuh-kibana-app/issues/1591).

## Wazuh v3.9.2 - Kibana v7.1.1 - Revision 510

### Added

- Support for Wazuh v3.9.2

### Changed

- Avoid showing more than one toaster for the same error message [7937003](https://github.com/wazuh/wazuh-kibana-app/commit/793700382798033203091d160773363323e05bb9).
- Restored "Alerts evolution - Top 5 agents" in Overview > Security events [f9305c0](https://github.com/wazuh/wazuh-kibana-app/commit/f9305c0c6acf4a31c41b1cc9684b87f79b27524f).

### Fixed

- Fix missing parameters in Dev Tools request [#1496](https://github.com/wazuh/wazuh-kibana-app/pull/1496).
- Fix "Invalid Date" for Safari and Internet Explorer [#1505](https://github.com/wazuh/wazuh-kibana-app/pull/1505).

## Wazuh v3.9.1 - Kibana v7.1.1 - Revision 509

### Added

- Support for Kibana v7.1.1
- Added overall metrics for Agents > Overview [#1479](https://github.com/wazuh/wazuh-kibana-app/pull/1479).

### Fixed

- Fixed missing dependency for Discover [43f5dd5](https://github.com/wazuh/wazuh-kibana-app/commit/43f5dd5f64065c618ba930b2a4087f0a9e706c0e).
- Fixed visualization for Agents > Overview [#1477](https://github.com/wazuh/wazuh-kibana-app/pull/1477). 
- Fixed SCA policy checks table [#1478](https://github.com/wazuh/wazuh-kibana-app/pull/1478).

## Wazuh v3.9.1 - Kibana v7.1.0 - Revision 508

### Added

- Support for Kibana v7.1.0

## Wazuh v3.9.1 - Kibana v6.8.0 - Revision 444

### Added

- Support for Wazuh v3.9.1
- Support for Kibana v6.8.0

### Fixed

- Fixed background color for some parts of the Discover directive [2dfc763](https://github.com/wazuh/wazuh-kibana-app/commit/2dfc763bfa1093fb419f118c2938f6b348562c69).
- Fixed cut values in non-resizable tables when the value is too large [cc4828f](https://github.com/wazuh/wazuh-kibana-app/commit/cc4828fbf50d4dab3dd4bb430617c1f2b13dac6a).
- Fixed handled but not shown error messages from rule editor [0aa0e17](https://github.com/wazuh/wazuh-kibana-app/commit/0aa0e17ac8678879e5066f8d83fd46f5d8edd86a).
- Minor typos corrected [fe11fb6](https://github.com/wazuh/wazuh-kibana-app/commit/fe11fb67e752368aedc89ec844ddf729eb8ad761).
- Minor fixes in agents configuration [1bc2175](https://github.com/wazuh/wazuh-kibana-app/commit/1bc217590438573e7267687655bb5939b5bb9fde).
- Fix Management > logs viewer scrolling [f458b2e](https://github.com/wazuh/wazuh-kibana-app/commit/f458b2e3294796f9cf00482b4da27984646c6398).

### Changed

- Kibana version shown in settings is now read from our package.json [c103d3e](https://github.com/wazuh/wazuh-kibana-app/commit/c103d3e782136106736c02039d28c4567b255aaa).
- Removed an old header from Settings [0197b8b](https://github.com/wazuh/wazuh-kibana-app/commit/0197b8b1abc195f275c8cd9893df84cd5569527b).
- Improved index pattern validation fields, replaced "full_log" with "rule.id" as part of the minimum required fields [dce0595](https://github.com/wazuh/wazuh-kibana-app/commit/dce059501cbd28f1294fd761da3e015e154747bc).
- Improve dynamic height for configuration editor [c318131](https://github.com/wazuh/wazuh-kibana-app/commit/c318131dfb6b5f01752593f2aa972b98c0655610).
- Add timezone for all dates shown in the app [4b8736f](https://github.com/wazuh/wazuh-kibana-app/commit/4b8736fb4e562c78505daaee042bcd798242c3f5).

## Wazuh v3.9.0 - Kibana v6.7.0 / v6.7.1 / v6.7.2 - Revision 441

### Added

- Support for Wazuh v3.9.0
- Support for Kibana v6.7.0 / v6.7.1 / v6.7.2
- Edit master and worker configuration ([#1215](https://github.com/wazuh/wazuh-kibana-app/pull/1215)).
- Edit local rules, local decoders and CDB lists ([#1212](https://github.com/wazuh/wazuh-kibana-app/pull/1212), [#1204](https://github.com/wazuh/wazuh-kibana-app/pull/1204), [#1196](https://github.com/wazuh/wazuh-kibana-app/pull/1196), [#1233](https://github.com/wazuh/wazuh-kibana-app/pull/1233), [#1304](https://github.com/wazuh/wazuh-kibana-app/pull/1304)).
- View no local rules/decoders XML files ([#1395](https://github.com/wazuh/wazuh-kibana-app/pull/1395))
- Dev Tools additions
  - Added hotkey `[shift] + [enter]` for sending query ([#1170](https://github.com/wazuh/wazuh-kibana-app/pull/1170)).
  - Added `Export JSON` button for the Dev Tools ([#1170](https://github.com/wazuh/wazuh-kibana-app/pull/1170)).
- Added refresh button for agents preview table ([#1169](https://github.com/wazuh/wazuh-kibana-app/pull/1169)).
- Added `configuration assessment` information in "Agent > Policy monitoring" ([#1227](https://github.com/wazuh/wazuh-kibana-app/pull/1227)).
- Added agents `configuration assessment` configuration section in "Agent > Configuration" ([1257](https://github.com/wazuh/wazuh-kibana-app/pull/1257))
- Restart master and worker nodes ([#1222](https://github.com/wazuh/wazuh-kibana-app/pull/1222)).
- Restart agents ([#1229](https://github.com/wazuh/wazuh-kibana-app/pull/1229)).
- Added support for more than one Wazuh monitoring pattern ([#1243](https://github.com/wazuh/wazuh-kibana-app/pull/1243))
- Added customizable interval for Wazuh monitoring indices creation ([#1243](https://github.com/wazuh/wazuh-kibana-app/pull/1243)).
- Expand visualizations ([#1246](https://github.com/wazuh/wazuh-kibana-app/pull/1246)).
- Added a dynamic table columns selector ([#1246](https://github.com/wazuh/wazuh-kibana-app/pull/1246)).
- Added resizable columns by dragging in tables ([d2bf8ee](https://github.com/wazuh/wazuh-kibana-app/commit/d2bf8ee9681ca5d6028325e165854b49214e86a3))
- Added a cron job for fetching missing fields of all valid index patterns, also merging dynamic fields every time an index pattern is refreshed by the app ([#1276](https://github.com/wazuh/wazuh-kibana-app/pull/1276)).
- Added auto-merging dynamic fields for Wazuh monitoring index patterns ([#1300](https://github.com/wazuh/wazuh-kibana-app/pull/1300))
- New server module, it's a job queue so we can add delayed jobs to be run in background, this iteration only accepts delayed Wazuh API calls ([#1283](https://github.com/wazuh/wazuh-kibana-app/pull/1283)).
- Added new way to view logs using a logs viewer ([#1292](https://github.com/wazuh/wazuh-kibana-app/pull/1292))
- Added new directive for registering agents from the UI, including instructions on "how to" ([#1321](https://github.com/wazuh/wazuh-kibana-app/pull/1321)).
- Added some Angular charts in Agents Preview and Agents SCA sections ([#1364](https://github.com/wazuh/wazuh-kibana-app/pull/1364))
- Added Docker listener settings in configuration views ([#1365](https://github.com/wazuh/wazuh-kibana-app/pull/1365))
- Added Docker dashboards for both Agents and Overview ([#1367](https://github.com/wazuh/wazuh-kibana-app/pull/1367))
- Improved app logger with debug level ([#1373](https://github.com/wazuh/wazuh-kibana-app/pull/1373))
- Introducing React components from the EUI framework

### Changed

- Escape XML special characters ([#1159](https://github.com/wazuh/wazuh-kibana-app/pull/1159)).
- Changed empty results message for Wazuh tables ([#1165](https://github.com/wazuh/wazuh-kibana-app/pull/1165)).
- Allowing the same query multiple times on the Dev Tools ([#1174](https://github.com/wazuh/wazuh-kibana-app/pull/1174))
- Refactor JSON/XML viewer for configuration tab ([#1173](https://github.com/wazuh/wazuh-kibana-app/pull/1173), [#1148](https://github.com/wazuh/wazuh-kibana-app/pull/1148)).
- Using full height for all containers when possible ([#1224](https://github.com/wazuh/wazuh-kibana-app/pull/1224)).
- Improved the way we are handling "back button" events ([#1207](https://github.com/wazuh/wazuh-kibana-app/pull/1207)).
- Changed some visualizations for FIM, GDPR, PCI, Vulnerability and Security Events ([#1206](https://github.com/wazuh/wazuh-kibana-app/pull/1206), [#1235](https://github.com/wazuh/wazuh-kibana-app/pull/1235), [#1293](https://github.com/wazuh/wazuh-kibana-app/pull/1293)).
- New design for agent header view ([#1186](https://github.com/wazuh/wazuh-kibana-app/pull/1186)).
- Not fetching data the very first time the Dev Tools are opened ([#1185](https://github.com/wazuh/wazuh-kibana-app/pull/1185)).
- Refresh all known fields for all valid index patterns if `kbn-vis` detects a broken index pattern ([ecd7c8f](https://github.com/wazuh/wazuh-kibana-app/commit/ecd7c8f98c187a350f81261d13b0d45dcec6dc5d)).
- Truncate texts and display a tooltip when they don't fit in a table cell ([7b56a87](https://github.com/wazuh/wazuh-kibana-app/commit/7b56a873f85dcba7e6838aeb2e40d9b4cf472576))
- Updated API autocomplete for Dev Tools ([#1218](https://github.com/wazuh/wazuh-kibana-app/pull/1218))
- Updated switches design to adapt it to Kibana's design ([#1253](https://github.com/wazuh/wazuh-kibana-app/pull/1253))
- Reduced the width of some table cells with little text, to give more space to the other columns ([#1263](https://github.com/wazuh/wazuh-kibana-app/pull/1263)).
- Redesign for Management > Status daemons list ([#1284](https://github.com/wazuh/wazuh-kibana-app/pull/1284)).
- Redesign for Management > Configuration, Agent > Configuration ([#1289](https://github.com/wazuh/wazuh-kibana-app/pull/1289)).
- Replaced Management > Logs table with a log viewer component ([#1292](https://github.com/wazuh/wazuh-kibana-app/pull/1292)).
- The agents list search bar now allows to switch between AND/OR operators ([#1291](https://github.com/wazuh/wazuh-kibana-app/pull/1291)).
- Improve audit dashboards ([#1374](https://github.com/wazuh/wazuh-kibana-app/pull/1374))
- Exclude agent "000" getting the last registered and the most active agents from the Wazuh API.([#1391](https://github.com/wazuh/wazuh-kibana-app/pull/1391))
- Reviewed Osquery dashboards ([#1394](https://github.com/wazuh/wazuh-kibana-app/pull/1394))
- Memory info is now a log ([#1400](https://github.com/wazuh/wazuh-kibana-app/pull/1400))
- Error toasters time is now 30000ms, warning/info are still 6000ms ([#1420](https://github.com/wazuh/wazuh-kibana-app/pull/1420))

### Fixed

- Properly handling long messages on notifier service, until now, they were using out of the card space, also we replaced some API messages with more meaningful messages ([#1168](https://github.com/wazuh/wazuh-kibana-app/pull/1168)).
- Adapted Wazuh icon for multiple browsers where it was gone ([#1208](https://github.com/wazuh/wazuh-kibana-app/pull/1208)).
- Do not fetch data from tables twice when resize window ([#1303](https://github.com/wazuh/wazuh-kibana-app/pull/1303)).
- Agent syncrhonization status is updated as we browse the configuration section ([#1305](https://github.com/wazuh/wazuh-kibana-app/pull/1305))
- Using the browser timezone for reporting documents ([#1311](https://github.com/wazuh/wazuh-kibana-app/pull/1311)).
- Wrong behaviors in the routing system when the basePath was set ([#1342](https://github.com/wazuh/wazuh-kibana-app/pull/1342))
- Do not show pagination for one-page tables ([196c5b7](https://github.com/wazuh/wazuh-kibana-app/pull/1362/commits/196c5b717583032798da7791fa4f90ec06397f68))
- Being redirected to Overview once a Kibana restart is performed ([#1378](https://github.com/wazuh/wazuh-kibana-app/pull/1378))
- Displaying the AWS services section of the aws-s3 wodle ([#1393](https://github.com/wazuh/wazuh-kibana-app/pull/1393))
- Show email configuration on the configuration on demand ([#1401](https://github.com/wazuh/wazuh-kibana-app/issues/1401))
- Show "Follow symbolic link" field in Integrity monitoring - Monitored configuration on demand ([0c9c9da](https://github.com/wazuh/wazuh-kibana-app/pull/1414/commits/0c9c9da3b951548761cd203db5ee5baa39afe26c))

## Wazuh v3.8.2 - Kibana v6.6.0 / v6.6.1 / v6.6.2 / v6.7.0 - Revision 419

### Added

- Support for Kibana v6.6.0 / v6.6.1 / v6.6.2 / v6.7.0

### Fixed

- Fixed AWS dashboard, newer JavaScript browser engines break the view due to Angular.js ([6e882fc](https://github.com/wazuh/wazuh-kibana-app/commit/6e882fc1d7efe6059e6140ff40b8a20d9c1fa51e)).
- Fixed AWS accounts visualization, using the right field now ([6e882fc](https://github.com/wazuh/wazuh-kibana-app/commit/6e882fc1d7efe6059e6140ff40b8a20d9c1fa51e)).

## Wazuh v3.8.2 - Kibana v6.5.4 - Revision 418

### Added

- Support for Wazuh v3.8.2

### Changed

- Close configuration editor only if it was successfully updated ([bc77c35](https://github.com/wazuh/wazuh-kibana-app/commit/bc77c35d8440a656d4704451ce857c9e1d36a438)).
- Replaced FIM Vega visualization with standard visualization ([554ee1c](https://github.com/wazuh/wazuh-kibana-app/commit/554ee1c4c4d75c76d82272075acf8bb62e7f9e27)).

## Wazuh v3.8.1 - Kibana v6.5.4 - Revision 417

### Added

- Support for Wazuh v3.8.1

### Changed

- Moved monitored/ignored Windows registry entries to "FIM > Monitored" and "FIM > Ignored" to avoid user confusion ([#1176](https://github.com/wazuh/wazuh-kibana-app/pull/1176)).
- Excluding managers from wazuh-monitoring indices ([#1177](https://github.com/wazuh/wazuh-kibana-app/pull/1177)).
- Escape `&` before sending group configuration ([d3aa56f](https://github.com/wazuh/wazuh-kibana-app/commit/d3aa56fa73478c60505e500db7d3a7df263081b5)).
- Improved `autoFormat` function before rendering group configuration ([f4f8144](https://github.com/wazuh/wazuh-kibana-app/commit/f4f8144eef8b93038fc897a9f16356e71029b844)).
- Now the group configuration editor doesn't exit after sending data to the Wazuh API ([5c1a3ef](https://github.com/wazuh/wazuh-kibana-app/commit/5c1a3ef9bd710a7befbed0709c4a7cf414f44f6b)).

### Fixed

- Fixed style for the error toaster for long URLs or long paths ([11b8084](https://github.com/wazuh/wazuh-kibana-app/commit/11b8084c75bbc5da36587ff31d1bc80a55fe4dfe)).

## Wazuh v3.8.0 - Kibana v6.5.4 - Revision 416

### Added

- Added group management features such as:
  - Edit the group configuration ([#1096](https://github.com/wazuh/wazuh-kibana-app/pull/1096)).
  - Add/remove groups to/from an agent ([#1096](https://github.com/wazuh/wazuh-kibana-app/pull/1096)).
  - Add/remove agents to/from a group ([#1096](https://github.com/wazuh/wazuh-kibana-app/pull/1096)).
  - Add/remove groups ([#1152](https://github.com/wazuh/wazuh-kibana-app/pull/1152)).
- New directive for tables that don't need external data sources ([#1067](https://github.com/wazuh/wazuh-kibana-app/pull/1067)).
- New search bar directive with interactive filters and suggestions ([#1058](https://github.com/wazuh/wazuh-kibana-app/pull/1058)).
- New server route `/elastic/alerts` for fetching alerts using custom parameters([#1056](https://github.com/wazuh/wazuh-kibana-app/pull/1056)).
- New table for an agent FIM monitored files, if the agent OS platform is Windows it will show two tables: files and registry ([#1032](https://github.com/wazuh/wazuh-kibana-app/pull/1032)).
- Added description to each setting under Settings > Configuration ([#1048](https://github.com/wazuh/wazuh-kibana-app/pull/1048)).
- Added a new setting to `config.yml` related to Wazuh monitoring and its index pattern ([#1095](https://github.com/wazuh/wazuh-kibana-app/pull/1095)).
- Resizable columns by dragging in Dev-tools ([#1102](https://github.com/wazuh/wazuh-kibana-app/pull/1102)).
- New feature to be able to edit config.yml file from the Settings > Configuration section view ([#1105](https://github.com/wazuh/wazuh-kibana-app/pull/1105)).
- Added a new table (network addresses) for agent inventory tab ([#1111](https://github.com/wazuh/wazuh-kibana-app/pull/1111)).
- Added `audit_key` (Who-data Audit keys) for configuration tab ([#1123](https://github.com/wazuh/wazuh-kibana-app/pull/1123)).
- Added new known fields for Kibana index pattern ([#1150](https://github.com/wazuh/wazuh-kibana-app/pull/1150)).

### Changed

- Changed Inventory tables. Now the app looks for the OS platform and it shows different tables depending on the OS platform. In addition the process state codes has been replaced to be more meaningful ([#1059](https://github.com/wazuh/wazuh-kibana-app/pull/1059)).
- Tiny rework for the AWS tab including.
- "Report" button is hidden on Discover panel ([#1047](https://github.com/wazuh/wazuh-kibana-app/pull/1047)).
- Visualizations, filters and Discover improved ([#1083](https://github.com/wazuh/wazuh-kibana-app/pull/1083)).
- Removed `popularizeField` function until https://github.com/elastic/kibana/issues/22426 is solved in order to avoid `Unable to write index pattern!` error on Discover tab ([#1085](https://github.com/wazuh/wazuh-kibana-app/pull/1085)).
- Improved Wazuh monitoring module ([#1094](https://github.com/wazuh/wazuh-kibana-app/pull/1094)).
- Added "Registered date" and "Last keep alive" in agents table allowing you to sort by these fields ([#1102](https://github.com/wazuh/wazuh-kibana-app/pull/1102)).
- Improved code quality in sections such as Ruleset > Rule and Decoder detail view simplify conditions ([#1102](https://github.com/wazuh/wazuh-kibana-app/pull/1102)).
- Replaced reporting success message ([#1102](https://github.com/wazuh/wazuh-kibana-app/pull/1102)).
- Reduced the default number of shards and the default number of replicas for the app indices ([#1113](https://github.com/wazuh/wazuh-kibana-app/pull/1113)).
- Refreshing index pattern known fields on health check controller ([#1119](https://github.com/wazuh/wazuh-kibana-app/pull/1119)).
- Less strict memory check ([786c764](https://github.com/wazuh/wazuh-kibana-app/commit/786c7642cd88083f9a77c57ed204488ecf5b710a)).
- Checking message origin in error handler ([dfec368](https://github.com/wazuh/wazuh-kibana-app/commit/dfec368d22a148b2e4437db92d71294900241961)).
- Dev tools is now showing the response as it is, like `curl` does ([#1137](https://github.com/wazuh/wazuh-kibana-app/pull/1137)).
- Removed `unknown` as valid node name ([#1149](https://github.com/wazuh/wazuh-kibana-app/pull/1149)).
- Removed `rule.id` direct filter from the rule set tables ([#1151](https://github.com/wazuh/wazuh-kibana-app/pull/1151))

### Fixed

- Restored X-Pack security logic for the .wazuh index, now it's not bypassing the X-Pack roles ([#1081](https://github.com/wazuh/wazuh-kibana-app/pull/1081))
- Avoid fetching twice the same data ([#1072](https://github.com/wazuh/wazuh-kibana-app/pull/1072), [#1061](https://github.com/wazuh/wazuh-kibana-app/pull/1061)).
- Wazuh logo adapted to low resolutions ([#1074](https://github.com/wazuh/wazuh-kibana-app/pull/1074)).
- Hide Audit, OpenSCAP tabs for non-linux agents. Fixed empty Windows events under Configuration > Log collection section. OSQuery logo has been standardized ([#1072](https://github.com/wazuh/wazuh-kibana-app/pull/1072), [#1076](https://github.com/wazuh/wazuh-kibana-app/pull/1076)).
- Fix empty values on _Overview > Security events_ when Wazuh monitoring is disabled ([#1091](https://github.com/wazuh/wazuh-kibana-app/pull/1091)).
- Fix overlapped play button in Dev-tools when the input box has a scrollbar ([#1102](https://github.com/wazuh/wazuh-kibana-app/pull/1102)).
- Fix Dev-tools behavior when parse json invalid blocks ([#1102](https://github.com/wazuh/wazuh-kibana-app/pull/1102)).
- Fixed Management > Monitoring tab frustration adding back buttons ([#1102](https://github.com/wazuh/wazuh-kibana-app/pull/1102)).
- Fix template checking when using more than one pattern ([#1104](https://github.com/wazuh/wazuh-kibana-app/pull/1104)).
- Fix infinite loop for Wazuh monitoring when the Wazuh API is not being able to give us all the agents ([5a26916](https://github.com/wazuh/wazuh-kibana-app/commit/5a2691642b40a34783d2eafb6ee24ae78b9af21a)), ([85005a1](https://github.com/wazuh/wazuh-kibana-app/commit/85005a184d4f1c3d339b7c895b5d2469f3b45171)).
- Fix rule details for `list` and `info` parameters ([#1149](https://github.com/wazuh/wazuh-kibana-app/pull/1149)).

## Wazuh v3.7.1 / v3.7.2 - Kibana v6.5.1 / v6.5.2 / v6.5.3 / v6.5.4 - Revision 415

### Added

- Support for Elastic stack v6.5.2 / v6.5.3 / v6.5.4.
- Support for Wazuh v3.7.1 / v3.7.2.
- Dev Tools module now autocompletes API endpoints ([#1030](https://github.com/wazuh/wazuh-kibana-app/pull/1030)).

### Changed

- Increased number of rows for syscollector tables ([#1033](https://github.com/wazuh/wazuh-kibana-app/pull/1033)).
- Modularized JSON/XML viewers for the configuration section ([#982](https://github.com/wazuh/wazuh-kibana-app/pull/982)).

### Fixed

- Added missing fields for syscollector network tables ([#1036](https://github.com/wazuh/wazuh-kibana-app/pull/1036)).
- Using the right API path when downloading CSV for decoders list ([#1045](https://github.com/wazuh/wazuh-kibana-app/pull/1045)).
- Including group field when downloading CSV for agents list ([#1044](https://github.com/wazuh/wazuh-kibana-app/pull/1044)).
- Preserve active tab in configuration section when refreshing the page ([#1037](https://github.com/wazuh/wazuh-kibana-app/pull/1037)).

## Wazuh v3.7.0 - Kibana v6.5.0 / v6.5.1 - Revision 414

### Added

- Support for Elastic Stack v6.5.0 / v6.5.1.
- Agent groups bar is now visible on the agent configuration section ([#1023](https://github.com/wazuh/wazuh-kibana-app/pull/1023)).
- Added a new setting for the `config.yml` file for enable/disable administrator mode ([#1019](https://github.com/wazuh/wazuh-kibana-app/pull/1019)).
  - This allows the user to perform PUT, POST, DELETE methods in our Dev Tools.

### Changed

- Refactored most front-end controllers ([#1023](https://github.com/wazuh/wazuh-kibana-app/pull/1023)).

## Wazuh v3.7.0 - Kibana v6.4.2 / v6.4.3 - Revision 413

### Added

- Support for Wazuh v3.7.0.
- Support for Elastic Stack v6.4.2 / v6.4.3.
- Brand-new interface for _Configuration_ (on both _Management_ and _Agents_ tabs) ([#914](https://github.com/wazuh/wazuh-kibana-app/pull/914)):
  - Now you can check current and real agent and manager configuration.
  - A new interface design, with more useful information and easy to understand descriptions.
  - New and more responsive JSON/XML viewers to show the configuration in raw mode.
- Brand-new extension - Osquery ([#938](https://github.com/wazuh/wazuh-kibana-app/pull/938)):
  - A new extension, disabled by default.
  - Check alerts from Wazuh's Osquery integration.
  - Check your current Osquery wodle configuration.
  - More improvements will come for this extension in the future.
- New option for Wazuh app configuration file - _Ignore index patterns_ ([#947](https://github.com/wazuh/wazuh-kibana-app/pull/947)):
  - Now the user can specify which index patterns can't be selected on the app using the new `ip.ignore` setting on the `config.yml` file.
  - The valid format is an array of strings which represents index patterns.
  - By default, this list is empty (all index patterns will be available if they use a compatible structure).
- Added a node selector for _Management > Status_ section when Wazuh cluster is enabled ([#976](https://github.com/wazuh/wazuh-kibana-app/pull/976)).
- Added quick access to _Configuration_ or _Discover_ panels for an agent on the agents list ([#939](https://github.com/wazuh/wazuh-kibana-app/pull/939)).
- Now you can click on an agent's ID on the _Discover_ panels to open its details page on the app ([#904](https://github.com/wazuh/wazuh-kibana-app/pull/904)).
- Redesigned the _Overview > Amazon AWS_ tab, using more meaningful visualizations for a better overall view of your agents' status ([#903](https://github.com/wazuh/wazuh-kibana-app/pull/903)).
- Redesigned the _Overview/Agents > Vulnerabilities_ tab, using more meaningful visualizations for a better overall view of your agents' status ([#954](https://github.com/wazuh/wazuh-kibana-app/pull/954)).
- Now everytime the user enters the _Settings_ tab, the API connection will be automatically checked ([#971](https://github.com/wazuh/wazuh-kibana-app/pull/971)).
- Added a node selector for _Management > Logs_ section when Wazuh cluster is enabled ([#980](https://github.com/wazuh/wazuh-kibana-app/pull/980)).
- Added a group selector for _Agents_ section ([#995](https://github.com/wazuh/wazuh-kibana-app/pull/995)).

### Changed

- Interface refactoring for the _Agents > Inventory data_ tab ([#924](https://github.com/wazuh/wazuh-kibana-app/pull/924)):
  - Now the tab won't be available if your agent doesn't have Syscollector enabled, and each card will be enabled or disabled depending on the current Syscollector scans configuration.
  - This will prevent situations where the user couldn't check the inventory although there was actual scan data to show on some sections.
- Added support for new multigroups feature ([#911](https://github.com/wazuh/wazuh-kibana-app/pull/911)):
  - Now the information bars on _Agents_ will show all the groups an agent belongs to.
- Now the result pane on the _Dev tools_ tab will show the error code coming from the Wazuh API ([#909](https://github.com/wazuh/wazuh-kibana-app/pull/909)).
- Changed some visualizations titles for _Overview/Agents > OpenSCAP_ tab ([#925](https://github.com/wazuh/wazuh-kibana-app/pull/925)).
- All backend routes have been renamed ([#932](https://github.com/wazuh/wazuh-kibana-app/pull/932)).
- Several improvements for Elasticsearch tests ([#933](https://github.com/wazuh/wazuh-kibana-app/pull/933)).
- Updated some strings and descriptions on the _Settings_ tab ([#934](https://github.com/wazuh/wazuh-kibana-app/pull/934)).
- Changed the date format on _Settings > Logs_ to make it more human-readable ([#944](https://github.com/wazuh/wazuh-kibana-app/pull/944)).
- Changed some labels to remove the "MD5 sum" expression, it will use "Checksum" instead ([#945](https://github.com/wazuh/wazuh-kibana-app/pull/945)).
- Added word wrapping class to group name in _Management > Groups > Group detail_ tab ([#945](https://github.com/wazuh/wazuh-kibana-app/pull/945)).
- The `wz-table` directive has been refactored ([#953](https://github.com/wazuh/wazuh-kibana-app/pull/953)).
- The `wz-table` directive now checks if a request is aborted ([#979](https://github.com/wazuh/wazuh-kibana-app/pull/979)).
- Several performance improvements ([#985](https://github.com/wazuh/wazuh-kibana-app/pull/985), [#997](https://github.com/wazuh/wazuh-kibana-app/pull/997), [#1000](https://github.com/wazuh/wazuh-kibana-app/pull/1000)).

### Fixed

- Several known fields for _Whodata_ functionality have been fixed ([#901](https://github.com/wazuh/wazuh-kibana-app/pull/901)).
- Fixed alignment bug with the _Add a filter +_ button on _Discover_ and _Agents_ tabs ([#912](https://github.com/wazuh/wazuh-kibana-app/pull/912)).
- Fixed a bug where the `Add API` form on _Settings_ didn't appear when pressing the button after editing an existing API entry ([#944](https://github.com/wazuh/wazuh-kibana-app/pull/944)).
- Fixed a bug on _Ruleset_ tab where the "Description" column was showing `0` if the rule doesn't have any description ([#948](https://github.com/wazuh/wazuh-kibana-app/pull/948)).
- Fixed wrong alignment on related Rules/Decoders tables from _Management > Ruleset_ tab ([#971](https://github.com/wazuh/wazuh-kibana-app/pull/971)).
- Fixed a bug where sometimes the error messages appeared duplicated ([#971](https://github.com/wazuh/wazuh-kibana-app/pull/971)).

### Removed

- On the _Management > Monitoring_ tab, the `Cluster enabled but not running` message won't appear as an error anymore ([#971](https://github.com/wazuh/wazuh-kibana-app/pull/971)).

## Wazuh v3.6.1 - Kibana v6.4.1 / v6.4.2 / v6.4.3 - Revision 412

### Added

- Support for Elastic Stack v6.4.1 / v6.4.2 / v6.4.3.

## Wazuh v3.6.1 - Kibana v6.4.0 - Revision 411

### Added

- Redesigned the _Overview > Integrity monitoring_ tab, using more meaningful visualizations for a better overall view of your agents' status ([#893](https://github.com/wazuh/wazuh-kibana-app/pull/893)).
- Added a new table for the _Inventory_ tab: _Processes_ ([#895](https://github.com/wazuh/wazuh-kibana-app/pull/895)).
- Improved error handling for tables. Now the table will show an error message if it wasn't able to fetch and load data ([#896](https://github.com/wazuh/wazuh-kibana-app/pull/896)).

### Changed

- The app source code has been improved, following best practices and coding guidelines ([#892](https://github.com/wazuh/wazuh-kibana-app/pull/892)).
- Included more app tests and prettifier for better code maintainability ([#883](https://github.com/wazuh/wazuh-kibana-app/pull/883) & [#885](https://github.com/wazuh/wazuh-kibana-app/pull/885)).

### Fixed

- Fixed minor visual errors on some _GDPR_, _PCI DSS_ and _Vulnerabilities_ visualizations ([#894](https://github.com/wazuh/wazuh-kibana-app/pull/894)).

## Wazuh v3.6.1 - Kibana v6.4.0 - Revision 410

### Added

- The _Inventory_ tab has been redesigned ([#873](https://github.com/wazuh/wazuh-kibana-app/pull/873)):
  - Added new network interfaces and port tables.
  - Improved design using metric information bars and intuitive status indicators.
- Added refresh functionality to the _Settings > Logs_ tab ([#852](https://github.com/wazuh/wazuh-kibana-app/pull/852)):
  - Now everytime the user opens the tab, the logs will be reloaded.
  - A new button to force the update has been added on the top left corner of the logs table.
- Added `tags` and `recursion_level` configuration options to _Management/Agent > Configuration_ tabs ([#850](https://github.com/wazuh/wazuh-kibana-app/pull/850)).
- The _Kuery_ search syntax has been added again to the app ([#851](https://github.com/wazuh/wazuh-kibana-app/pull/851)).
- Added a first batch of [_Mocha_](https://mochajs.org/) tests and other quality of code improvements to the app ([#859](https://github.com/wazuh/wazuh-kibana-app/pull/859)).
- Now you can open specific rule details (the _Management > Ruleset_ tab) when clicking on the `rule.id` value on the _Discover_ tab ([#862](https://github.com/wazuh/wazuh-kibana-app/pull/862)).
- Now you can click on the rule ID value on the _Management > Ruleset_ tab to search for related alerts on the _Discover_ tab ([#863](https://github.com/wazuh/wazuh-kibana-app/pull/863)).

### Changed

- The index pattern known fields have been updated up to 567 ([#872](https://github.com/wazuh/wazuh-kibana-app/pull/872)).
- Now the _Inventory_ tab will always be available for all agents, and a descriptive message will appear if the agent doesn't have `syscollector` enabled ([#879](https://github.com/wazuh/wazuh-kibana-app/pull/879)).

### Fixed

- Fixed a bug where the _Inventory_ tab was unavailable if the user reloads the page while on the _Agents > Configuration_ tab ([#845](https://github.com/wazuh/wazuh-kibana-app/pull/845)).
- Fixed some _Overview > VirusTotal_ visualizations ([#846](https://github.com/wazuh/wazuh-kibana-app/pull/846)).
- Fixed a bug where the _Settings > Extensions_ tab wasn't being properly hidden when there's no API entries inserted ([#847](https://github.com/wazuh/wazuh-kibana-app/pull/847)).
- Fixed a bug where the _Current API_ indicator on the top navbar wasn't being properly updated when the user deletes all the API entries ([#848](https://github.com/wazuh/wazuh-kibana-app/pull/848)).
- Fixed a bug where the _Agents coverage_ metric were not displaying a proper value when the manager has 0 registered agents ([#849](https://github.com/wazuh/wazuh-kibana-app/pull/849)).
- Fixed a bug where the `wazuh-basic` user role was able to update API entries (it should be forbidden) ([#853](https://github.com/wazuh/wazuh-kibana-app/pull/853)).
- Fixed a bug where the visualizations had scroll bars on the PDF reports ([#870](https://github.com/wazuh/wazuh-kibana-app/pull/870)).
- Fixed a bug on the _Dev tools_ tab where the user couldn't execute the first request block if there was blank lines above it ([#871](https://github.com/wazuh/wazuh-kibana-app/pull/871)).
- Fixed a bug on pinned filters when opening tabs where the implicit filter was the same, making them stuck and unremovable from other tabs ([#878](https://github.com/wazuh/wazuh-kibana-app/pull/878)).

## Wazuh v3.6.1 - Kibana v6.4.0 - Revision 409

### Added

- Support for Wazuh v3.6.1.

### Fixed

- Fixed a bug on the _Dev tools_ tab ([b7c79f4](https://github.com/wazuh/wazuh-kibana-app/commit/b7c79f48f06cb49b12883ec9e9337da23b49976b)).

## Wazuh v3.6.1 - Kibana v6.3.2 - Revision 408

### Added

- Support for Wazuh v3.6.1.

### Fixed

- Fixed a bug on the _Dev tools_ tab ([4ca9ed5](https://github.com/wazuh/wazuh-kibana-app/commit/4ca9ed54f1b18e5d499d950e6ff0741946701988)).

## Wazuh v3.6.0 - Kibana v6.4.0 - Revision 407

### Added

- Support for Wazuh v3.6.0.

## Wazuh v3.6.0 - Kibana v6.3.2 - Revision 406

### Added

- Support for Wazuh v3.6.0.

## Wazuh v3.5.0 - Kibana v6.4.0 - Revision 405

### Added

- Support for Elastic Stack v6.4.0 ([#813](https://github.com/wazuh/wazuh-kibana-app/pull/813)).

## Wazuh v3.5.0 - Kibana v6.3.2 - Revision 404

### Added

- Added new options to `config.yml` to change shards and replicas settings for `wazuh-monitoring` indices ([#809](https://github.com/wazuh/wazuh-kibana-app/pull/809)).
- Added more error messages for `wazuhapp.log` in case of failure when performing some crucial functions ([#812](https://github.com/wazuh/wazuh-kibana-app/pull/812)).
- Now it's possible to change replicas settings for existing `.wazuh`, `.wazuh-version` and `wazuh-monitoring` indices on the `config.yml` file ([#817](https://github.com/wazuh/wazuh-kibana-app/pull/817)).

### Changed

- App frontend code refactored and restructured ([#802](https://github.com/wazuh/wazuh-kibana-app/pull/802)).
- Now the _Overview > Security events_ tab won't show anything if the only visualization with data is _Agents status_ ([#811](https://github.com/wazuh/wazuh-kibana-app/pull/811)).

### Fixed

- Fixed a bug where the RAM status message appreared twice the first time you opened the app ([#807](https://github.com/wazuh/wazuh-kibana-app/pull/807)).
- Fixed the app UI to make the app usable on Internet Explorer 11 ([#808](https://github.com/wazuh/wazuh-kibana-app/pull/808)).

## Wazuh v3.5.0 - Kibana v6.3.2 - Revision 403

### Added

- The welcome tabs on _Overview_ and _Agents_ have been updated with a new name and description for the existing sections ([#788](https://github.com/wazuh/wazuh-kibana-app/pull/788)).
- Now the app tables will auto-resize depending on the screen height ([#792](https://github.com/wazuh/wazuh-kibana-app/pull/792)).

### Changed

- Now all the app filters on several tables will present the values in alphabetical order ([#787](https://github.com/wazuh/wazuh-kibana-app/pull/787)).

### Fixed

- Fixed a bug on _Decoders_ where clicking on the decoder wouldn't open the detail view if the `Parent decoders` filter was enabled ([#782](https://github.com/wazuh/wazuh-kibana-app/pull/782)).
- Fixed a bug on _Dev tools_ when the first line on the editor pane was empty or had a comment ([#790](https://github.com/wazuh/wazuh-kibana-app/pull/790)).
- Fixed a bug where the app was throwing multiple warning messages the first time you open it ([#791](https://github.com/wazuh/wazuh-kibana-app/pull/791)).
- Fixed a bug where clicking on a different tab from _Overview_ right after inserting the API credentials for the first time would always redirect to _Overview_ ([#791](https://github.com/wazuh/wazuh-kibana-app/pull/791)).
- Fixed a bug where the user could have a browser cookie with a reference to a non-existing API entry on Elasticsearch ([#794](https://github.com/wazuh/wazuh-kibana-app/pull/794) & [#795](https://github.com/wazuh/wazuh-kibana-app/pull/795)).

### Removed

- The cluster key has been removed from the API requests to `/manager/configuration` ([#796](https://github.com/wazuh/wazuh-kibana-app/pull/796)).

## Wazuh v3.5.0 - Kibana v6.3.1/v6.3.2 - Revision 402

### Added

- Support for Wazuh v3.5.0.
- Added new fields for _Vulnerability detector_ alerts ([#752](https://github.com/wazuh/wazuh-kibana-app/pull/752)).
- Added multi table search for `wz-table` directive. Added two new log levels for _Management > Logs_ section ([#753](https://github.com/wazuh/wazuh-kibana-app/pull/753)).

## Wazuh v3.4.0 - Kibana v6.3.1/v6.3.2 - Revision 401

### Added

- Added a few new fields for Kibana due to the new Wazuh _who-data_ feature ([#763](https://github.com/wazuh/wazuh-kibana-app/pull/763)).
- Added XML/JSON viewer for each card under _Management > Configuration_ ([#764](https://github.com/wazuh/wazuh-kibana-app/pull/764)).

### Changed

- Improved error handling for Dev tools. Also removed some unused dependencies from the _Dev tools_ tab ([#760](https://github.com/wazuh/wazuh-kibana-app/pull/760)).
- Unified origin for tab descriptions. Reviewed some grammar typos ([#765](https://github.com/wazuh/wazuh-kibana-app/pull/765)).
- Refactored agents autocomplete component. Removed unused/deprecated modules ([#766](https://github.com/wazuh/wazuh-kibana-app/pull/766)).
- Simplified route resolves section ([#768](https://github.com/wazuh/wazuh-kibana-app/pull/768)).

### Fixed

- Fixed missing cluster node filter for the visualization shown when looking for specific node under _Management > Monitoring_ section ([#758](https://github.com/wazuh/wazuh-kibana-app/pull/758)).
- Fixed missing dependency injection for `wzMisc` factory ([#768](https://github.com/wazuh/wazuh-kibana-app/pull/768)).

### Removed

- Removed `angular-aria`, `angular-md5`, `ansicolors`, `js-yaml`, `querystring` and `lodash` dependencies since Kibana includes all of them. Removed some unused images ([#768](https://github.com/wazuh/wazuh-kibana-app/pull/768)).

## Wazuh v3.4.0 - Kibana v6.3.1/v6.3.2 - Revision 400

### Added

- Support for Wazuh v3.4.0.
- Support for Elastic Stack v6.3.2.
- Support for Kuery as accepted query language ([#742](https://github.com/wazuh/wazuh-kibana-app/pull/742)).
  - This feature is experimental.
- Added new _Who data_ fields from file integrity monitoring features ([#746](https://github.com/wazuh/wazuh-kibana-app/pull/746)).
- Added tab in _Settings_ section where you can see the last logs from the Wazuh app server ([#723](https://github.com/wazuh/wazuh-kibana-app/pull/723)).

### Changed

- Fully redesigned of the welcome screen along the different app sections ([#751](https://github.com/wazuh/wazuh-kibana-app/pull/751)).
- Now any agent can go to the _Inventory_ tab regardless if it's enabled or not. The content will change properly according to the agent configuration ([#744](https://github.com/wazuh/wazuh-kibana-app/pull/744)).
- Updated the `angular-material` dependency to `1.1.10` ([#743](https://github.com/wazuh/wazuh-kibana-app/pull/743)).
- Any API entry is now removable regardless if it's the only one API entry ([#740](https://github.com/wazuh/wazuh-kibana-app/pull/740)).
- Performance has been improved regarding to agents status, they are now being fetched using _distinct_ routes from the Wazuh API ([#738](https://github.com/wazuh/wazuh-kibana-app/pull/738)).
- Improved the way we are parsing some Wazuh API errors regarding to version mismatching ([#735](https://github.com/wazuh/wazuh-kibana-app/pull/735)).

### Fixed

- Fixed wrong filters being applied in _Ruleset > Rules_ and _Ruleset > Decoders_ sections when using Lucene like filters plus path filters ([#736](https://github.com/wazuh/wazuh-kibana-app/pull/736)).
- Fixed the template checking from the healthcheck, now it allows to use custom index patterns ([#739](https://github.com/wazuh/wazuh-kibana-app/pull/739)).
- Fixed infinite white screen from _Management > Monitoring_ when the Wazuh cluster is enabled but not running ([#741](https://github.com/wazuh/wazuh-kibana-app/pull/741)).

## Wazuh v3.3.0/v3.3.1 - Kibana v6.3.1 - Revision 399

### Added

- Added a new Angular.js factory to store the Wazuh app configuration values. Also, this factory is being used by the pre-routes functions (resolves); this way we are sure about having the real configuration at any time. These pre-routes functions have been improved too ([#670](https://github.com/wazuh/wazuh-kibana-app/pull/670)).
- Added extended information for reports from _Reporting_ feature ([#701](https://github.com/wazuh/wazuh-kibana-app/pull/701)).

### Changed

- Tables have been improved. Now they are truncating long fields and adding a tooltip if needed ([#671](https://github.com/wazuh/wazuh-kibana-app/pull/671)).
- Services have been improved ([#715](https://github.com/wazuh/wazuh-kibana-app/pull/715)).
- CSV formatted files have been improved. Now they are showing a more human readable column names ([#717](https://github.com/wazuh/wazuh-kibana-app/pull/717), [#726](https://github.com/wazuh/wazuh-kibana-app/pull/726)).
- Added/Modified some visualization titles ([#728](https://github.com/wazuh/wazuh-kibana-app/pull/728)).
- Improved Discover perfomance when in background mode ([#719](https://github.com/wazuh/wazuh-kibana-app/pull/719)).
- Reports from the _Reporting_ feature have been fulyl redesigned ([#701](https://github.com/wazuh/wazuh-kibana-app/pull/701)).

### Fixed

- Fixed the top menu API indicator when checking the API connection and the manager/cluster information had been changed ([#668](https://github.com/wazuh/wazuh-kibana-app/pull/668)).
- Fixed our logger module which was not writting logs the very first time Kibana is started neither after a log rotation ([#667](https://github.com/wazuh/wazuh-kibana-app/pull/667)).
- Fixed a regular expression in the server side when parsing URLs before registering a new Wazuh API ([#690](https://github.com/wazuh/wazuh-kibana-app/pull/690)).
- Fixed filters from specific visualization regarding to _File integrity_ section ([#694](https://github.com/wazuh/wazuh-kibana-app/pull/694)).
- Fixed filters parsing when generating a report because it was not parsing negated filters as expected ([#696](https://github.com/wazuh/wazuh-kibana-app/pull/696)).
- Fixed visualization counter from _OSCAP_ tab ([#722](https://github.com/wazuh/wazuh-kibana-app/pull/722)).

### Removed

- Temporary removed CSV download from agent inventory section due to Wazuh API bug ([#727](https://github.com/wazuh/wazuh-kibana-app/pull/727)).

## Wazuh v3.3.0/v3.3.1 - Kibana v6.3.0 - Revision 398

### Added

- Improvements for latest app redesign ([#652](https://github.com/wazuh/wazuh-kibana-app/pull/652)):
  - The _Welcome_ tabs have been simplified, following a more Elastic design.
  - Added again the `md-nav-bar` component with refined styles and limited to specific sections.
  - The _Settings > Welcome_ tab has been removed. You can use the nav bar to switch tabs.
  - Minor CSS adjustments and reordering.
- Small app UI improvements ([#634](https://github.com/wazuh/wazuh-kibana-app/pull/634)):
  - Added link to _Agents Preview_ on the _Agents_ tab breadcrumbs.
  - Replaced the _Generate report_ button with a smaller one.
  - Redesigned _Management > Ruleset_ `md-chips` to look similar to Kibana filter pills.
  - Added agent information bar from _Agents > General_ to _Agents > Welcome_ too.
  - Refactored flex layout on _Welcome_ tabs to fix a height visual bug.
  - Removed duplicated loading rings on the _Agents_ tab.
- Improvements for app tables ([#627](https://github.com/wazuh/wazuh-kibana-app/pull/627)):
  - Now the current page will be highlighted.
  - The gap has been fixed to the items per page value.
  - If there are no more pages for _Next_ or _Prev_ buttons, they will be hidden.
- Improvements for app health check ([#637](https://github.com/wazuh/wazuh-kibana-app/pull/637)):
  - Improved design for the view.
  - The checks have been placed on a table, showing the current status of each one.
- Changes to our reporting feature ([#639](https://github.com/wazuh/wazuh-kibana-app/pull/639)):
  - Now the generated reports will include tables for each section.
  - Added a parser for getting Elasticsearch data table responses.
  - The reporting feature is now a separated module, and the code has been refactored.
- Improvements for app tables pagination ([#646](https://github.com/wazuh/wazuh-kibana-app/pull/646)).

### Changed

- Now the `pretty` parameter on the _Dev tools_ tab will be ignored to avoid `Unexpected error` messages ([#624](https://github.com/wazuh/wazuh-kibana-app/pull/624)).
- The `pdfkit` dependency has been replaced by `pdfmake` ([#639](https://github.com/wazuh/wazuh-kibana-app/pull/639)).
- Changed some Kibana tables for performance improvements on the reporting feature ([#644](https://github.com/wazuh/wazuh-kibana-app/pull/644)).
- Changed the method to refresh the list of known fields on the index pattern ([#650](https://github.com/wazuh/wazuh-kibana-app/pull/650)):
  - Now when restarting Kibana, the app will update the fieldset preserving the custom user fields.

### Fixed

- Fixed bug on _Agents CIS-CAT_ tab who wasn't loading the appropriate visualizations ([#626](https://github.com/wazuh/wazuh-kibana-app/pull/626)).
- Fixed a bug where sometimes the index pattern could be `undefined` during the health check process, leading into a false error message when loading the app ([#640](https://github.com/wazuh/wazuh-kibana-app/pull/640)).
- Fixed several bugs on the _Settings > API_ tab when removing, adding or editing new entries.

### Removed

- Removed the app login system ([#636](https://github.com/wazuh/wazuh-kibana-app/pull/636)):
  - This feature was unstable, experimental and untested for a long time. We'll provide much better RBAC capabilities in the future.
- Removed the new Kuery language option on Discover app search bars.
  - This feature will be restored in the future, after more Elastic v6.3.0 adaptations.

## Wazuh v3.3.0/v3.3.1 - Kibana v6.3.0 - Revision 397

### Added

- Support for Elastic Stack v6.3.0 ([#579](https://github.com/wazuh/wazuh-kibana-app/pull/579) & [#612](https://github.com/wazuh/wazuh-kibana-app/pull/612) & [#615](https://github.com/wazuh/wazuh-kibana-app/pull/615)).
- Brand-new Wazuh app redesign for the _Monitoring_ tab ([#581](https://github.com/wazuh/wazuh-kibana-app/pull/581)):
  - Refactored and optimized UI for these tabs, using a breadcrumbs-based navigability.
  - Used the same guidelines from the previous redesign for _Overview_ and _Agents_ tabs.
- New tab for _Agents_ - _Inventory_ ([#582](https://github.com/wazuh/wazuh-kibana-app/pull/582)):
  - Get information about the agent host, such as installed packages, motherboard, operating system, etc.
  - This tab will appear if the agent has the [`syscollector`](https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/wodle-syscollector.html) wodle enabled.
- Brand-new extension - _CIS-CAT Alerts_ ([#601](https://github.com/wazuh/wazuh-kibana-app/pull/601)):
  - A new extension, disabled by default.
  - Visualize alerts related to the CIS-CAT benchmarks on the _Overview_ and _Agents_ tabs.
  - Get information about the last performed scan and its score.
- Several improvements for the _Dev tools_ tab ([#583](https://github.com/wazuh/wazuh-kibana-app/pull/583) & [#597](https://github.com/wazuh/wazuh-kibana-app/pull/597)):
  - Now you can insert queries using inline parameters, just like in a web browser.
  - You can combine inline parameters with JSON-like parameters.
  - If you use the same parameter on both methods with different values, the inline parameter has precedence over the other one.
  - The tab icon has been changed for a more appropriate one.
  - The `Execute query` button is now always placed on the first line of the query block.
- Refactoring for all app tables ([#582](https://github.com/wazuh/wazuh-kibana-app/pull/582)):
  - Replaced the old `wz-table` directive with a new one, along with a new data factory.
  - Now the tables are built with a pagination system.
  - Much easier method for building tables for the app.
  - Performance and stability improvements when fetching API data.
  - Now you can see the total amount of items and the elapsed time.

### Changed

- Moved some logic from the _Agents preview_ tab to the server, to avoid excessive client-side workload ([#586](https://github.com/wazuh/wazuh-kibana-app/pull/586)).
- Changed the UI to use the same loading ring across all the app tabs ([#593](https://github.com/wazuh/wazuh-kibana-app/pull/593) & [#599](https://github.com/wazuh/wazuh-kibana-app/pull/599)).
- Changed the _No results_ message across all the tabs with visualizations ([#599](https://github.com/wazuh/wazuh-kibana-app/pull/599)).

### Fixed

- Fixed a bug on the _Settings/Extensions_ tab where enabling/disabling some extensions could make other ones to be disabled ([#591](https://github.com/wazuh/wazuh-kibana-app/pull/591)).

## Wazuh v3.3.0/v3.3.1 - Kibana v6.2.4 - Revision 396

### Added

- Support for Wazuh v3.3.1.
- Brand-new Wazuh app redesign for the _Settings_ tab ([#570](https://github.com/wazuh/wazuh-kibana-app/pull/570)):
  - Refactored and optimized UI for these tabs, using a breadcrumbs-based navigability.
  - Used the same guidelines from the previous redesign for _Overview_ and _Agents_ tabs.
- Refactoring for _Overview_ and _Agents_ controllers ([#564](https://github.com/wazuh/wazuh-kibana-app/pull/564)):
  - Reduced duplicated code by splitting it into separate files.
  - Code optimization for a better performance and maintainability.
  - Added new services to provide similar functionality between different app tabs.
- Added `data.vulnerability.package.condition` to the list of known fields ([#566](https://github.com/wazuh/wazuh-kibana-app/pull/566)).

### Changed

- The `wazuh-logs` and `wazuh-monitoring` folders have been moved to the Kibana's `optimize` directory in order to avoid some error messages when using the `kibana-plugin list` command ([#563](https://github.com/wazuh/wazuh-kibana-app/pull/563)).

### Fixed

- Fixed a bug on the _Settings_ tab where updating an API entry with wrong credentials would corrupt the existing one ([#558](https://github.com/wazuh/wazuh-kibana-app/pull/558)).
- Fixed a bug on the _Settings_ tab where removing an API entry while its edit form is opened would hide the `Add API` button unless the user reloads the tab ([#558](https://github.com/wazuh/wazuh-kibana-app/pull/558)).
- Fixed some Audit visualizations on the _Overview_ and _Agents_ tabs that weren't using the same search query to show the results ([#572](https://github.com/wazuh/wazuh-kibana-app/pull/572)).
- Fixed undefined variable error on the `wz-menu` directive ([#575](https://github.com/wazuh/wazuh-kibana-app/pull/575)).

## Wazuh v3.3.0 - Kibana v6.2.4 - Revision 395

### Fixed

- Fixed a bug on the _Agent Configuration_ tab where the sync status was always `NOT SYNCHRONIZED` ([#569](https://github.com/wazuh/wazuh-kibana-app/pull/569)).

## Wazuh v3.3.0 - Kibana v6.2.4 - Revision 394

### Added

- Support for Wazuh v3.3.0.
- Updated some backend API calls to include the app version in the request header ([#560](https://github.com/wazuh/wazuh-kibana-app/pull/560)).

## Wazuh v3.2.4 - Kibana v6.2.4 - Revision 393

### Added

- Brand-new Wazuh app redesign for _Overview_ and _Agents_ tabs ([#543](https://github.com/wazuh/wazuh-kibana-app/pull/543)):
  - Updated UI for these tabs using breadcrumbs.
  - New _Welcome_ screen, presenting all the tabs to the user, with useful links to our documentation.
  - Overall design improved, adjusted font sizes and reduced HTML code.
  - This base will allow the app to increase its functionality in the future.
  - Removed the `md-nav-bar` component for a better user experience on small screens.
  - Improved app performance removing some CSS effects from some components, such as buttons.
- New filter for agent version on the _Agents Preview_ tab ([#537](https://github.com/wazuh/wazuh-kibana-app/pull/537)).
- New filter for cluster node on the _Agents Preview_ tab ([#538](https://github.com/wazuh/wazuh-kibana-app/pull/538)).

### Changed

- Now the report generation process will run in a parallel mode in the foreground ([#523](https://github.com/wazuh/wazuh-kibana-app/pull/523)).
- Replaced the usage of `$rootScope` with two new factories, along with more controller improvements ([#525](https://github.com/wazuh/wazuh-kibana-app/pull/525)).
- Now the _Extensions_ tab on _Settings_ won't edit the `.wazuh` index to modify the extensions configuration for all users ([#545](https://github.com/wazuh/wazuh-kibana-app/pull/545)).
  - This allows each new user to always start with the base extensions configuration, and modify it to its needs storing the settings on a browser cookie.
- Now the GDPR requirements description on its tab won't be loaded if the Wazuh API version is not v3.2.3 or higher ([#546](https://github.com/wazuh/wazuh-kibana-app/pull/546)).

### Fixed

- Fixed a bug where the app crashes when attempting to download huge amounts of data as CSV format ([#521](https://github.com/wazuh/wazuh-kibana-app/pull/521)).
- Fixed a bug on the Timelion visualizations from _Management/Monitoring_ which were not properly filtering and showing the cluster nodes information ([#530](https://github.com/wazuh/wazuh-kibana-app/pull/530)).
- Fixed several bugs on the loading process when switching between tabs with or without visualizations in the _Overview_ and _Agents_ tab ([#531](https://github.com/wazuh/wazuh-kibana-app/pull/531) & [#533](https://github.com/wazuh/wazuh-kibana-app/pull/533)).
- Fixed a bug on the `wazuh-monitoring` index feature when using multiple inserted APIs, along with several performance improvements ([#539](https://github.com/wazuh/wazuh-kibana-app/pull/539)).
- Fixed a bug where the OS filter on the _Agents Preview_ tab would exclude the rest of filters instead of combining them ([#552](https://github.com/wazuh/wazuh-kibana-app/pull/552)).
- Fixed a bug where the Extensions settings were restored every time the user opened the _Settings_ tab or pressed the _Set default manager_ button ([#555](https://github.com/wazuh/wazuh-kibana-app/pull/555) & [#556](https://github.com/wazuh/wazuh-kibana-app/pull/556)).

## Wazuh v3.2.3/v3.2.4 - Kibana v6.2.4 - Revision 392

### Added

- Support for Wazuh v3.2.4.
- New functionality - _Reporting_ ([#510](https://github.com/wazuh/wazuh-kibana-app/pull/510)):
  - Generate PDF logs on the _Overview_ and _Agents_ tabs, with the new button next to _Panels_ and _Discover_.
  - The report will contain the current visualizations from the tab where you generated it.
  - List all your generated reports, download or deleted them at the new _Management/Reporting_ tab.
  - **Warning:** If you leave the tab while generating a report, the process will be aborted.
- Added warning/error messages about the total RAM on the server side ([#502](https://github.com/wazuh/wazuh-kibana-app/pull/502)):
  - None of this messages will prevent the user from accessing the app, it's just a recommendation.
  - If your server has less than 2GB of RAM, you'll get an error message when opening the app.
  - If your server has between 2GB and 3GB of RAM, you'll get a warning message.
  - If your server has more than 3GB of RAM, you won't get any kind of message.
- Refactoring and added loading bar to _Manager Logs_ and _Groups_ tabs ([#505](https://github.com/wazuh/wazuh-kibana-app/pull/505)).
- Added more Syscheck options to _Management/Agents_ configuration tabs ([#509](https://github.com/wazuh/wazuh-kibana-app/pull/509)).

### Fixed

- Added more fields to the `known-fields.js` file to avoid warning messages on _Discover_ when using Filebeat for alerts forwarding ([#497](https://github.com/wazuh/wazuh-kibana-app/pull/497)).
- Fixed a bug where clicking on the _Check connection_ button on the _Settings_ tab threw an error message although the API connected successfully ([#504](https://github.com/wazuh/wazuh-kibana-app/pull/504)).
- Fixed a bug where the _Agents_ tab was not properly showing the total of agents due to the new Wazuh cluster implementation ([#517](https://github.com/wazuh/wazuh-kibana-app/pull/517)).

## Wazuh v3.2.3 - Kibana v6.2.4 - Revision 391

### Added

- Support for Wazuh v3.2.3.
- Brand-new extension - _GDPR Alerts_ ([#453](https://github.com/wazuh/wazuh-kibana-app/pull/453)):
  - A new extension, enabled by default.
  - Visualize alerts related to the GDPR compliance on the _Overview_ and _Agents_ tabs.
  - The _Ruleset_ tab has been updated to include GDPR filters on the _Rules_ subtab.
- Brand-new Management tab - _Monitoring_ ([#490](https://github.com/wazuh/wazuh-kibana-app/pull/490)):
  - Visualize your Wazuh cluster, both master and clients.
    - Get the current cluster configuration.
    - Nodes listing, sorting, searching, etc.
  - Get a more in-depth cluster status thanks to the newly added [_Timelion_](https://www.elastic.co/guide/en/kibana/current/timelion.html) visualizations.
  - The Detail view gives you a summary of the node's healthcheck.
- Brand-new tab - _Dev tools_ ([#449](https://github.com/wazuh/wazuh-kibana-app/pull/449)):
  - Find it on the top navbar, next to _Discover_.
  - Execute Wazuh API requests directly from the app.
  - This tab uses your currently selected API from _Settings_.
  - You can type different API requests on the input window, select one with the cursor, and click on the Play button to execute it.
  - You can also type comments on the input window.
- More improvements for the _Manager/Ruleset_ tab ([#446](https://github.com/wazuh/wazuh-kibana-app/pull/446)):
  - A new colour palette for regex, order and rule description arguments.
  - Added return to List view on Ruleset button while on Detail view.
  - Fixed line height on all table headers.
  - Removed unused, old code from Ruleset controllers.
- Added option on `config.yml` to enable/disable the `wazuh-monitoring` index ([#441](https://github.com/wazuh/wazuh-kibana-app/pull/441)):
  - Configure the frequency time to generate new indices.
  - The default frequency time has been increased to 1 hour.
  - When disabled, useful metrics will appear on _Overview/General_ replacing the _Agent status_ visualization.
- Added CSV exporting button to the app ([#431](https://github.com/wazuh/wazuh-kibana-app/pull/431)):
  - Implemented new logic to fetch data from the Wazuh API and download it in CSV format.
  - Currently available for the _Ruleset_, _Logs_ and _Groups_ sections on the _Manager_ tab and also the _Agents_ tab.
- More refactoring to the app backend ([#439](https://github.com/wazuh/wazuh-kibana-app/pull/439)):
  - Standardized error output from the server side.
  - Drastically reduced the error management logic on the client side.
  - Applied the _Facade_ pattern when importing/exporting modules.
  - Deleted unused/deprecated/useless methods both from server and client side.
  - Some optimizations to variable type usages.
- Refactoring to Kibana filters management ([#452](https://github.com/wazuh/wazuh-kibana-app/pull/452) & [#459](https://github.com/wazuh/wazuh-kibana-app/pull/459)):
  - Added new class to build queries from the base query.
  - The filter management is being done on controllers instead of the `discover` directive.
  - Now we are emitting specific events whenever we are fetching data or communicating to the `discover` directive.
  - The number of useless requests to fetch data has been reduced.
  - The synchronization actions are working as expected regardless the amount of data and/or the number of machine resources.
  - Fixed several bugs about filter usage and transition to different app tabs.
- Added confirmation message when the user deletes an API entry on _Settings/API_ ([#428](https://github.com/wazuh/wazuh-kibana-app/pull/428)).
- Added support for filters on the _Manager/Logs_ tab when realtime is enabled ([#433](https://github.com/wazuh/wazuh-kibana-app/pull/433)).
- Added more filter options to the Detail view on _Manager/Ruleset_ ([#434](https://github.com/wazuh/wazuh-kibana-app/pull/434)).

### Changed

- Changed OSCAP visualization to avoid clipping issues with large agent names ([#429](https://github.com/wazuh/wazuh-kibana-app/pull/429)).
- Now the related Rules or Decoders sections on _Manager/Ruleset_ will remain hidden if there isn't any data to show or while it's loading ([#434](https://github.com/wazuh/wazuh-kibana-app/pull/434)).
- Added a 200ms delay when fetching iterable data from the Wazuh API ([#445](https://github.com/wazuh/wazuh-kibana-app/pull/445) & [#450](https://github.com/wazuh/wazuh-kibana-app/pull/450)).
- Fixed several bugs related to Wazuh API timeout/cancelled requests ([#445](https://github.com/wazuh/wazuh-kibana-app/pull/445)).
- Added `ENOTFOUND`, `EHOSTUNREACH`, `EINVAL`, `EAI_AGAIN` options for API URL parameter checking ([#463](https://github.com/wazuh/wazuh-kibana-app/pull/463)).
- Now the _Settings/Extensions_ subtab won't appear unless there's at least one API inserted ([#465](https://github.com/wazuh/wazuh-kibana-app/pull/465)).
- Now the index pattern selector on _Settings/Pattern_ will also refresh the known fields when changing it ([#477](https://github.com/wazuh/wazuh-kibana-app/pull/477)).
- Changed the _Manager_ tab into _Management_ ([#490](https://github.com/wazuh/wazuh-kibana-app/pull/490)).

### Fixed

- Fixed a bug where toggling extensions after deleting an API entry could lead into an error message ([#465](https://github.com/wazuh/wazuh-kibana-app/pull/465)).
- Fixed some performance bugs on the `dataHandler` service ([#442](https://github.com/wazuh/wazuh-kibana-app/pull/442) & [#486](https://github.com/wazuh/wazuh-kibana-app/pull/442)).
- Fixed a bug when loading the _Agents preview_ tab on Safari web browser ([#447](https://github.com/wazuh/wazuh-kibana-app/pull/447)).
- Fixed a bug where a new extension (enabled by default) appears disabled when updating the app ([#456](https://github.com/wazuh/wazuh-kibana-app/pull/456)).
- Fixed a bug where pressing the Enter key on the _Discover's_ tab search bar wasn't working properly ([#488](https://github.com/wazuh/wazuh-kibana-app/pull/488)).

### Removed

- Removed the `rison` dependency from the `package.json` file ([#452](https://github.com/wazuh/wazuh-kibana-app/pull/452)).
- Removed unused Elasticsearch request to avoid problems when there's no API inserted ([#460](https://github.com/wazuh/wazuh-kibana-app/pull/460)).

## Wazuh v3.2.1/v3.2.2 - Kibana v6.2.4 - Revision 390

### Added

- Support for Wazuh v3.2.2.
- Refactoring on visualizations use and management ([#397](https://github.com/wazuh/wazuh-kibana-app/pull/397)):
  - Visualizations are no longer stored on an index, they're built and loaded on demand when needed to render the interface.
  - Refactoring on the whole app source code to use the _import/export_ paradigm.
  - Removed old functions and variables from the old visualization management logic.
  - Removed cron task to clean remaining visualizations since it's no longer needed.
  - Some Kibana functions and modules have been overridden in order to make this refactoring work.
    - This change is not intrusive in any case.
- New redesign for the _Manager/Ruleset_ tab ([#420](https://github.com/wazuh/wazuh-kibana-app/pull/420)):
  - Rules and decoders list now divided into two different sections: _List view_ and _Detail view_.
  - Removed old expandable tables to move the rule/decoder information into a new space.
  - Enable different filters on the detail view for a better search on the list view.
  - New table for related rules or decoders.
  - And finally, a bunch of minor design enhancements to the whole app.
- Added a copyright notice to the whole app source code ([#395](https://github.com/wazuh/wazuh-kibana-app/pull/395)).
- Updated `.gitignore` with the _Node_ template ([#395](https://github.com/wazuh/wazuh-kibana-app/pull/395)).
- Added new module to the `package.json` file, [`rison`](https://www.npmjs.com/package/rison) ([#404](https://github.com/wazuh/wazuh-kibana-app/pull/404)).
- Added the `errorHandler` service to the blank screen scenario ([#413](https://github.com/wazuh/wazuh-kibana-app/pull/413)):
  - Now the exact error message will be shown to the user, instead of raw JSON content.
- Added new option on the `config.yml` file to disable the new X-Pack RBAC capabilities to filter index-patterns ([#417](https://github.com/wazuh/wazuh-kibana-app/pull/417)).

### Changed

- Small minor enhancements to the user interface ([#396](https://github.com/wazuh/wazuh-kibana-app/pull/396)):
  - Reduced Wazuh app logo size.
  - Changed buttons text to not use all-capitalized letters.
  - Minor typos found in the HTML/CSS code have been fixed.
- Now the app log stores the package revision ([#417](https://github.com/wazuh/wazuh-kibana-app/pull/417)).

### Fixed

- Fixed bug where the _Agents_ tab didn't preserve the filters after reloading the page ([#404](https://github.com/wazuh/wazuh-kibana-app/pull/404)).
- Fixed a bug when using X-Pack that sometimes threw an error of false _"Not enough privileges"_ scenario ([#415](https://github.com/wazuh/wazuh-kibana-app/pull/415)).
- Fixed a bug where the Kibana Discover auto-refresh functionality was still working when viewing the _Agent configuration_ tab ([#419](https://github.com/wazuh/wazuh-kibana-app/pull/419)).

## Wazuh v3.2.1 - Kibana v6.2.4 - Revision 389

### Changed

- Changed severity and verbosity to some log messages ([#412](https://github.com/wazuh/wazuh-kibana-app/pull/412)).

### Fixed

- Fixed a bug when using the X-Pack plugin without security capabilities enabled ([#403](https://github.com/wazuh/wazuh-kibana-app/pull/403)).
- Fixed a bug when the app was trying to create `wazuh-monitoring` indices without checking the existence of the proper template ([#412](https://github.com/wazuh/wazuh-kibana-app/pull/412)).

## Wazuh v3.2.1 - Kibana v6.2.4 - Revision 388

### Added

- Support for Elastic Stack v6.2.4.
- App server fully refactored ([#360](https://github.com/wazuh/wazuh-kibana-app/pull/360)):
  - Added new classes, reduced the amount of code, removed unused functions, and several optimizations.
  - Now the app follows a more ES6 code style on multiple modules.
  - _Overview/Agents_ visualizations have been ordered into separated files and folders.
  - Now the app can use the default index defined on the `/ect/kibana/kibana.yml` file.
  - Better error handling for the visualizations directive.
  - Added a cron job to delete remaining visualizations on the `.kibana` index if so.
  - Also, we've added some changes when using the X-Pack plugin:
    - Better management of users and roles in order to use the app capabilities.
    - Prevents app loading if the currently logged user has no access to any index pattern.
- Added the `errorHandler` service to the `dataHandler` factory ([#340](https://github.com/wazuh/wazuh-kibana-app/pull/340)).
- Added Syscollector section to _Manager/Agents Configuration_ tabs ([#359](https://github.com/wazuh/wazuh-kibana-app/pull/359)).
- Added `cluster.name` field to the `wazuh-monitoring` index ([#377](https://github.com/wazuh/wazuh-kibana-app/pull/377)).

### Changed

- Increased the query size when fetching the index pattern list ([#339](https://github.com/wazuh/wazuh-kibana-app/pull/339)).
- Changed active colour for all app tables ([#347](https://github.com/wazuh/wazuh-kibana-app/pull/347)).
- Changed validation regex to accept URLs with non-numeric format ([#353](https://github.com/wazuh/wazuh-kibana-app/pull/353)).
- Changed visualization removal cron task to avoid excessive log messages when there weren't removed visualizations ([#361](https://github.com/wazuh/wazuh-kibana-app/pull/361)).
- Changed filters comparison for a safer access ([#383](https://github.com/wazuh/wazuh-kibana-app/pull/383)).
- Removed some `server.log` messages to avoid performance errors ([#384](https://github.com/wazuh/wazuh-kibana-app/pull/384)).
- Changed the way of handling the index patterns list ([#360](https://github.com/wazuh/wazuh-kibana-app/pull/360)).
- Rewritten some false error-level logs to just information-level ones ([#360](https://github.com/wazuh/wazuh-kibana-app/pull/360)).
- Changed some files from JSON to CommonJS for performance improvements ([#360](https://github.com/wazuh/wazuh-kibana-app/pull/360)).
- Replaced some code on the `kibana-discover` directive with a much cleaner statement to avoid issues on the _Agents_ tab ([#394](https://github.com/wazuh/wazuh-kibana-app/pull/394)).

### Fixed

- Fixed a bug where several `agent.id` filters were created at the same time when navigating between _Agents_ and _Groups_ with different selected agents ([#342](https://github.com/wazuh/wazuh-kibana-app/pull/342)).
- Fixed logic on the index-pattern selector which wasn't showing the currently selected pattern the very first time a user opened the app ([#345](https://github.com/wazuh/wazuh-kibana-app/pull/345)).
- Fixed a bug on the `errorHandler` service who was preventing a proper output of some Elastic-related backend error messages ([#346](https://github.com/wazuh/wazuh-kibana-app/pull/346)).
- Fixed panels flickering in the _Settings_ tab ([#348](https://github.com/wazuh/wazuh-kibana-app/pull/348)).
- Fixed a bug in the shards and replicas settings when the user sets the value to zero (0) ([#358](https://github.com/wazuh/wazuh-kibana-app/pull/358)).
- Fixed several bugs related to the upgrade process from Wazuh 2.x to the new refactored server ([#363](https://github.com/wazuh/wazuh-kibana-app/pull/363)).
- Fixed a bug in _Discover/Agents VirusTotal_ tabs to avoid conflicts with the `agent.name` field ([#379](https://github.com/wazuh/wazuh-kibana-app/pull/379)).
- Fixed a bug on the implicit filter in _Discover/Agents PCI_ tabs ([#393](https://github.com/wazuh/wazuh-kibana-app/pull/393)).

### Removed

- Removed clear API password on `checkPattern` response ([#339](https://github.com/wazuh/wazuh-kibana-app/pull/339)).
- Removed old dashboard visualizations to reduce loading times ([#360](https://github.com/wazuh/wazuh-kibana-app/pull/360)).
- Removed some unused dependencies due to the server refactoring ([#360](https://github.com/wazuh/wazuh-kibana-app/pull/360)).
- Removed completely `metricService` from the app ([#389](https://github.com/wazuh/wazuh-kibana-app/pull/389)).

## Wazuh v3.2.1 - Kibana v6.2.2/v6.2.3 - Revision 387

### Added

- New logging system ([#307](https://github.com/wazuh/wazuh-kibana-app/pull/307)):
  - New module implemented to write app logs.
  - Now a trace is stored every time the app is re/started.
  - Currently, the `initialize.js` and `monitoring.js` files work with this system.
  - Note: the logs will live under `/var/log/wazuh/wazuhapp.log` on Linux systems, on Windows systems they will live under `kibana/plugins/`. It rotates the log whenever it reaches 100MB.
- Better cookies handling ([#308](https://github.com/wazuh/wazuh-kibana-app/pull/308)):
  - New field on the `.wazuh-version` index to store the last time the Kibana server was restarted.
  - This is used to check if the cookies have consistency with the current server status.
  - Now the app is clever and takes decisions depending on new consistency checks.
- New design for the _Agents/Configuration_ tab ([#310](https://github.com/wazuh/wazuh-kibana-app/pull/310)):
  - The style is the same as the _Manager/Configuration_ tab.
  - Added two more sections: CIS-CAT and Commands ([#315](https://github.com/wazuh/wazuh-kibana-app/pull/315)).
  - Added a new card that will appear when there's no group configuration at all ([#323](https://github.com/wazuh/wazuh-kibana-app/pull/323)).
- Added _"group"_ column on the agents list in _Agents_ ([#312](https://github.com/wazuh/wazuh-kibana-app/pull/312)):
  - If you click on the group, it will redirect the user to the specified group in _Manager/Groups_.
- New option for the `config.yml` file, `ip.selector` ([#313](https://github.com/wazuh/wazuh-kibana-app/pull/313)):
  - Define if the app will show or not the index pattern selector on the top navbar.
  - This setting is set to `true` by default.
- More CSS cleanup and reordering ([#315](https://github.com/wazuh/wazuh-kibana-app/pull/315)):
  - New `typography.less` file.
  - New `layout.less` file.
  - Removed `cleaned.less` file.
  - Reordering and cleaning of existing CSS files, including removal of unused classes, renaming, and more.
  - The _Settings_ tab has been refactored to correct some visual errors with some card components.
  - Small refactoring to some components from _Manager/Ruleset_ ([#323](https://github.com/wazuh/wazuh-kibana-app/pull/323)).
- New design for the top navbar ([#326](https://github.com/wazuh/wazuh-kibana-app/pull/326)):
  - Cleaned and refactored code
  - Revamped design, smaller and with minor details to follow the rest of Wazuh app guidelines.
- New design for the wz-chip component to follow the new Wazuh app guidelines ([#323](https://github.com/wazuh/wazuh-kibana-app/pull/323)).
- Added more descriptive error messages when the user inserts bad credentials on the _Add new API_ form in the _Settings_ tab ([#331](https://github.com/wazuh/wazuh-kibana-app/pull/331)).
- Added a new CSS class to truncate overflowing text on tables and metric ribbons ([#332](https://github.com/wazuh/wazuh-kibana-app/pull/332)).
- Support for Elastic Stack v6.2.2/v6.2.3.

### Changed

- Improved the initialization system ([#317](https://github.com/wazuh/wazuh-kibana-app/pull/317)):
  - Now the app will re-create the index-pattern if the user deletes the currently used by the Wazuh app.
  - The fieldset is now automatically refreshed if the app detects mismatches.
  - Now every index-pattern is dynamically formatted (for example, to enable the URLs in the _Vulnerabilities_ tab).
  - Some code refactoring for a better handling of possible use cases.
  - And the best thing, it's no longer needed to insert the sample alert!
- Improvements and changes to index-patterns ([#320](https://github.com/wazuh/wazuh-kibana-app/pull/320) & [#333](https://github.com/wazuh/wazuh-kibana-app/pull/333)):
  - Added a new route, `/get-list`, to fetch the index pattern list.
  - Removed and changed several functions for a proper management of index-patterns.
  - Improved the compatibility with user-created index-patterns, known to have unpredictable IDs.
  - Now the app properly redirects to `/blank-screen` if the length of the index patterns list is 0.
  - Ignored custom index patterns with auto-generated ID on the initialization process.
    - Now it uses the value set on the `config.yml` file.
  - If the index pattern is no longer available, the cookie will be overwritten.
- Improvements to the monitoring module ([#322](https://github.com/wazuh/wazuh-kibana-app/pull/322)):
  - Minor refactoring to the whole module.
  - Now the `wazuh-monitoring` index pattern is regenerated if it's missing.
  - And the best thing, it's no longer needed to insert the monitoring template!
- Now the app health check system only checks if the API and app have the same `major.minor` version ([#311](https://github.com/wazuh/wazuh-kibana-app/pull/311)):
  - Previously, the API and app had to be on the same `major.minor.patch` version.
- Adjusted space between title and value in some cards showing Manager or Agent configurations ([#315](https://github.com/wazuh/wazuh-kibana-app/pull/315)).
- Changed red and green colours to more saturated ones, following Kibana style ([#315](https://github.com/wazuh/wazuh-kibana-app/pull/315)).

### Fixed

- Fixed bug in Firefox browser who was not properly showing the tables with the scroll pagination functionality ([#314](https://github.com/wazuh/wazuh-kibana-app/pull/314)).
- Fixed bug where visualizations weren't being destroyed due to ongoing renderization processes ([#316](https://github.com/wazuh/wazuh-kibana-app/pull/316)).
- Fixed several UI bugs for a better consistency and usability ([#318](https://github.com/wazuh/wazuh-kibana-app/pull/318)).
- Fixed an error where the initial index-pattern was not loaded properly the very first time you enter the app ([#328](https://github.com/wazuh/wazuh-kibana-app/pull/328)).
- Fixed an error message that appeared whenever the app was not able to found the `wazuh-monitoring` index pattern ([#328](https://github.com/wazuh/wazuh-kibana-app/pull/328)).

## Wazuh v3.2.1 - Kibana v6.2.2 - Revision 386

### Added

- New design for the _Manager/Groups_ tab ([#295](https://github.com/wazuh/wazuh-kibana-app/pull/295)).
- New design for the _Manager/Configuration_ tab ([#297](https://github.com/wazuh/wazuh-kibana-app/pull/297)).
- New design of agents statistics for the _Agents_ tab ([#299](https://github.com/wazuh/wazuh-kibana-app/pull/299)).
- Added information ribbon into _Overview/Agent SCAP_ tabs ([#303](https://github.com/wazuh/wazuh-kibana-app/pull/303)).
- Added information ribbon into _Overview/Agent VirusTotal_ tabs ([#306](https://github.com/wazuh/wazuh-kibana-app/pull/306)).
- Added information ribbon into _Overview AWS_ tab ([#306](https://github.com/wazuh/wazuh-kibana-app/pull/306)).

### Changed

- Refactoring of HTML and CSS code throughout the whole Wazuh app ([#294](https://github.com/wazuh/wazuh-kibana-app/pull/294), [#302](https://github.com/wazuh/wazuh-kibana-app/pull/302) & [#305](https://github.com/wazuh/wazuh-kibana-app/pull/305)):
  - A big milestone for the project was finally achieved with this refactoring.
  - We've removed the Bootstrap dependency from the `package.json` file.
  - We've removed and merged many duplicated rules.
  - We've removed HTML and `angular-md` overriding rules. Now we have more own-made classes to avoid undesired results on the UI.
  - Also, this update brings tons of minor bugfixes related to weird HTML code.
- Wazuh app visualizations reviewed ([#301](https://github.com/wazuh/wazuh-kibana-app/pull/301)):
  - The number of used buckets has been limited since most of the table visualizations were surpassing acceptable limits.
  - Some visualizations have been checked to see if they make complete sense on what they mean to show to the user.
- Modified some app components for better follow-up of Kibana guidelines ([#290](https://github.com/wazuh/wazuh-kibana-app/pull/290) & [#297](https://github.com/wazuh/wazuh-kibana-app/pull/297)).
  - Also, some elements were modified on the _Discover_ tab in order to correct some mismatches.

### Fixed

- Adjusted information ribbon in _Agents/General_ for large OS names ([#290](https://github.com/wazuh/wazuh-kibana-app/pull/290) & [#294](https://github.com/wazuh/wazuh-kibana-app/pull/294)).
- Fixed unsafe array access on the visualization directive when going directly into _Manager/Ruleset/Decoders_ ([#293](https://github.com/wazuh/wazuh-kibana-app/pull/293)).
- Fixed a bug where navigating between agents in the _Agents_ tab was generating duplicated `agent.id` implicit filters ([#296](https://github.com/wazuh/wazuh-kibana-app/pull/296)).
- Fixed a bug where navigating between different tabs from _Overview_ or _Agents_ while being on the _Discover_ sub-tab was causing data loss in metric watchers ([#298](https://github.com/wazuh/wazuh-kibana-app/pull/298)).
- Fixed incorrect visualization of the rule level on _Manager/Ruleset/Rules_ when the rule level is zero (0) ([#298](https://github.com/wazuh/wazuh-kibana-app/pull/298)).

### Removed

- Removed almost every `md-tooltip` component from the whole app ([#305](https://github.com/wazuh/wazuh-kibana-app/pull/305)).
- Removed unused images from the `img` folder ([#305](https://github.com/wazuh/wazuh-kibana-app/pull/305)).

## Wazuh v3.2.1 - Kibana v6.2.2 - Revision 385

### Added

- Support for Wazuh v3.2.1.
- Brand-new first redesign for the app user interface ([#278](https://github.com/wazuh/wazuh-kibana-app/pull/278)):
  - This is the very first iteration of a _work-in-progress_ UX redesign for the Wazuh app.
  - The overall interface has been refreshed, removing some unnecessary colours and shadow effects.
  - The metric visualizations have been replaced by an information ribbon under the filter search bar, reducing the amount of space they occupied.
    - A new service was implemented for a proper handling of the metric visualizations watchers ([#280](https://github.com/wazuh/wazuh-kibana-app/pull/280)).
  - The rest of the app visualizations now have a new, more detailed card design.
- New shards and replicas settings to the `config.yml` file ([#277](https://github.com/wazuh/wazuh-kibana-app/pull/277)):
  - Now you can apply custom values to the shards and replicas for the `.wazuh` and `.wazuh-version` indices.
  - This feature only works before the installation process. If you modify these settings after installing the app, they won't be applied at all.

### Changed

- Now clicking again on the _Groups_ tab on _Manager_ will properly reload the tab and redirect to the beginning ([#274](https://github.com/wazuh/wazuh-kibana-app/pull/274)).
- Now the visualizations only use the `vis-id` attribute for loading them ([#275](https://github.com/wazuh/wazuh-kibana-app/pull/275)).
- The colours from the toast messages have been replaced to follow the Elastic 6 guidelines ([#286](https://github.com/wazuh/wazuh-kibana-app/pull/286)).

### Fixed

- Fixed wrong data flow on _Agents/General_ when coming from and going to the _Groups_ tab ([#273](https://github.com/wazuh/wazuh-kibana-app/pull/273)).
- Fixed sorting on tables, now they use the sorting functionality provided by the Wazuh API ([#274](https://github.com/wazuh/wazuh-kibana-app/pull/274)).
- Fixed column width issues on some tables ([#274](https://github.com/wazuh/wazuh-kibana-app/pull/274)).
- Fixed bug in the _Agent configuration_ JSON viewer who didn't properly show the full group configuration ([#276](https://github.com/wazuh/wazuh-kibana-app/pull/276)).
- Fixed excessive loading time from some Audit visualizations ([#278](https://github.com/wazuh/wazuh-kibana-app/pull/278)).
- Fixed Play/Pause button in timepicker's auto-refresh ([#281](https://github.com/wazuh/wazuh-kibana-app/pull/281)).
- Fixed unusual scenario on visualization directive where sometimes there was duplicated implicit filters when doing a search ([#283](https://github.com/wazuh/wazuh-kibana-app/pull/283)).
- Fixed some _Overview Audit_ visualizations who were not working properly ([#285](https://github.com/wazuh/wazuh-kibana-app/pull/285)).

### Removed

- Deleted the `id` attribute from all the app visualizations ([#275](https://github.com/wazuh/wazuh-kibana-app/pull/275)).

## Wazuh v3.2.0 - Kibana v6.2.2 - Revision 384

### Added

- New directives for the Wazuh app: `wz-table`, `wz-table-header` and `wz-search-bar` ([#263](https://github.com/wazuh/wazuh-kibana-app/pull/263)):
  - Maintainable and reusable components for a better-structured app.
  - Several files have been changed, renamed and moved to new folders, following _best practices_.
  - The progress bar is now within its proper directive ([#266](https://github.com/wazuh/wazuh-kibana-app/pull/266)).
  - Minor typos and refactoring changes to the new directives.
- Support for Elastic Stack v6.2.2.

### Changed

- App buttons have been refactored. Unified CSS and HTML for buttons, providing the same structure for them ([#269](https://github.com/wazuh/wazuh-kibana-app/pull/269)).
- The API list on Settings now shows the latest inserted API at the beginning of the list ([#261](https://github.com/wazuh/wazuh-kibana-app/pull/261)).
- The check for the currently applied pattern has been improved, providing clever handling of Elasticsearch errors ([#271](https://github.com/wazuh/wazuh-kibana-app/pull/271)).
- Now on _Settings_, when the Add or Edit API form is active, if you press the other button, it will make the previous one disappear, getting a clearer interface ([#9df1e31](https://github.com/wazuh/wazuh-kibana-app/commit/9df1e317903edf01c81eba068da6d20a8a1ea7c2)).

### Fixed

- Fixed visualizations directive to properly load the _Manager/Ruleset_ visualizations ([#262](https://github.com/wazuh/wazuh-kibana-app/pull/262)).
- Fixed a bug where the classic extensions were not affected by the settings of the `config.yml` file ([#266](https://github.com/wazuh/wazuh-kibana-app/pull/266)).
- Fixed minor CSS bugs from the conversion to directives to some components ([#266](https://github.com/wazuh/wazuh-kibana-app/pull/266)).
- Fixed bug in the tables directive when accessing a member it doesn't exist ([#266](https://github.com/wazuh/wazuh-kibana-app/pull/266)).
- Fixed browser console log error when clicking the Wazuh logo on the app ([#6647fbc](https://github.com/wazuh/wazuh-kibana-app/commit/6647fbc051c2bf69df7df6e247b2b2f46963f194)).

### Removed

- Removed the `kbn-dis` directive from _Manager/Ruleset_ ([#262](https://github.com/wazuh/wazuh-kibana-app/pull/262)).
- Removed the `filters.js` and `kibana_fields_file.json` files ([#263](https://github.com/wazuh/wazuh-kibana-app/pull/263)).
- Removed the `implicitFilters` service ([#270](https://github.com/wazuh/wazuh-kibana-app/pull/270)).
- Removed visualizations loading status trace from controllers and visualization directive ([#270](https://github.com/wazuh/wazuh-kibana-app/pull/270)).

## Wazuh v3.2.0 - Kibana v6.2.1 - Revision 383

### Added

- Support for Wazuh 3.2.0.
- Compatibility with Kibana 6.1.0 to Kibana 6.2.1.
- New tab for vulnerability detector alerts.

### Changed

- The app now shows the index pattern selector only if the list length is greater than 1.
  - If it's exactly 1 shows the index pattern without a selector.
- Now the index pattern selector only shows the compatible ones.
  - It's no longer possible to select the `wazuh-monitoring` index pattern.
- Updated Bootstrap to 3.3.7.
- Improved filter propagation between Discover and the visualizations.
- Replaced the login route name from /login to /wlogin to avoid conflict with X-Pack own login route.

### Fixed

- Several CSS bugfixes for better compatibility with Kibana 6.2.1.
- Some variables changed for adapting new Wazuh API requests.
- Better error handling for some Elastic-related messages.
- Fixed browser console error from top-menu directive.
- Removed undesired md-divider from Manager/Logs.
- Adjusted the width of a column in Manager/Logs to avoid overflow issues with the text.
- Fixed a wrong situation with the visualizations when we refresh the Manager/Rules tab.

### Removed

- Removed the `travis.yml` file.

## Wazuh v3.1.0 - Kibana v6.1.3 - Revision 380

### Added

- Support for Wazuh 3.1.0.
- Compatibility with Kibana 6.1.3.
- New error handler for better app errors reporting.
- A new extension for Amazon Web Services alerts.
- A new extension for VirusTotal alerts.
- New agent configuration tab:
  - Visualize the current group configuration for the currently selected agent on the app.
  - Navigate through the different tabs to see which configuration is being used.
  - Check the synchronization status for the configuration.
  - View the current group of the agent and click on it to go to the Groups tab.
- New initial health check for checking some app components.
- New YAML config file:
  - Define the initial index pattern.
  - Define specific checks for the healthcheck.
  - Define the default extensions when adding new APIs.
- New index pattern selector dropdown on the top navbar.
  - The app will reload applying the new index pattern.
- Added new icons for some sections of the app.

### Changed

- New visualizations loader, with much better performance.
- Improved reindex process for the .wazuh index when upgrading from a 2.x-5.x version.
- Adding 365 days expiring time to the cookies.
- Change default behaviour for the config file. Now everything is commented with default values.
  - You need to edit the file, remove the comment mark and apply the desired value.
- Completely redesigned the manager configuration tab.
- Completely redesigned the groups tab.
- App tables have now unified CSS classes.

### Fixed

- Play real-time button has been fixed.
- Preventing duplicate APIs from feeding the wazuh-monitoring index.
- Fixing the check manager connection button.
- Fixing the extensions settings so they are preserved over time.
- Much more error handling messages in all the tabs.
- Fixed OS filters in agents list.
- Fixed autocomplete lists in the agents, rules and decoders list so they properly scroll.
- Many styles bugfixes for the different browsers.
- Reviewed and fixed some visualizations not showing accurate information.

### Removed

- Removed index pattern configuration from the `package.json` file.
- Removed unnecessary dependencies from the `package.json` file.

## Wazuh v3.0.0 - Kibana v6.1.0 - Revision 371

### Added

- You can configure the initial index-pattern used by the plugin in the initialPattern variable of the app's package.json.
- Auto `.wazuh` reindex from Wazuh 2.x - Kibana 5.x to Wazuh 3.x - Kibana 6.x.
  - The API credentials will be automatically migrated to the new installation.
- Dynamically changed the index-pattern used by going to the Settings -> Pattern tab.
  - Wazuh alerts compatibility auto detection.
- New loader for visualizations.
- Better performance: now the tabs use the same Discover tab, only changing the current filters.
- New Groups tab.
  - Now you can check your group configuration (search its agents and configuration files).
- The Logs tab has been improved.
  - You can sort by field and the view has been improved.
- Achieved a clearer interface with implicit filters per tab showed as unremovable chips.

### Changed

- Dynamically creating .kibana index if necessary.
- Better integration with Kibana Discover.
- Visualizations loaded at initialization time.
- New sync system to wait for Elasticsearch JS.
- Decoupling selected API and pattern from backend and moved to the client side.

## Wazuh v2.1.0 - Kibana v5.6.1 - Revision 345

### Added

- Loading icon while Wazuh loads the visualizations.
- Add/Delete/Restart agents.
- OS agent filter

### Changed

- Using genericReq when possible.

## Wazuh v2.0.1 - Kibana v5.5.1 - Revision 339

### Changed

- New index in Elasticsearch to save Wazuh set up configuration
- Short URL's is now supported
- A native base path from kibana.yml is now supported

### Fixed

- Search bar across panels now support parenthesis grouping
- Several CSS fixes for IE browser
