# Change Log

All notable changes to the Wazuh app project will be documented in this file.

## Wazuh v3.6.1 - Kibana v6.4.0 - Revision 411

### Added

-   Redesigned the _Overview > Integrity monitoring_ tab, using more meaningful visualizations for a better overall view of your agents' status ([#893](https://github.com/wazuh/wazuh-kibana-app/pull/893)).
-   Added a new table for the _Inventory_ tab: _Processes_ ([#895](https://github.com/wazuh/wazuh-kibana-app/pull/895)).
-   Improved error handling for tables. Now the table will show an error message if it wasn't able to fetch and load data ([#896](https://github.com/wazuh/wazuh-kibana-app/pull/896)).

### Changed

-   The app source code has been improved, following best practices and coding guidelines ([#892](https://github.com/wazuh/wazuh-kibana-app/pull/892)).
-   Included more app tests and prettifier for better code maintainability ([#883](https://github.com/wazuh/wazuh-kibana-app/pull/883) & [#885](https://github.com/wazuh/wazuh-kibana-app/pull/885)).

### Fixed

-   Fixed minor visual errors on some _GDPR_, _PCI DSS_ and _Vulnerabilities_ visualizations ([#894](https://github.com/wazuh/wazuh-kibana-app/pull/894)).

## Wazuh v3.6.1 - Kibana v6.4.0 - Revision 410

### Added

-   The _Inventory_ tab has been redesigned ([#873](https://github.com/wazuh/wazuh-kibana-app/pull/873)):
    -   Added new network interfaces and port tables.
    -   Improved design using metric information bars and intuitive status indicators.
-   Added refresh functionality to the _Settings > Logs_ tab ([#852](https://github.com/wazuh/wazuh-kibana-app/pull/852)):
    -   Now everytime the user opens the tab, the logs will be reloaded.
    -   A new button to force the update has been added on the top left corner of the logs table.
-   Added `tags` and `recursion_level` configuration options to _Management/Agent > Configuration_ tabs ([#850](https://github.com/wazuh/wazuh-kibana-app/pull/850)).
-   The _Kuery_ search syntax has been added again to the app ([#851](https://github.com/wazuh/wazuh-kibana-app/pull/851)).
-   Added a first batch of [_Mocha_](https://mochajs.org/) tests and other quality of code improvements to the app ([#859](https://github.com/wazuh/wazuh-kibana-app/pull/859)).
-   Now you can open specific rule details (the _Management > Ruleset_ tab) when clicking on the `rule.id` value on the _Discover_ tab ([#862](https://github.com/wazuh/wazuh-kibana-app/pull/862)).
-   Now you can click on the rule ID value on the _Management > Ruleset_ tab to search for related alerts on the _Discover_ tab ([#863](https://github.com/wazuh/wazuh-kibana-app/pull/863)).

### Changed

-   The index pattern known fields have been updated up to 567 ([#872](https://github.com/wazuh/wazuh-kibana-app/pull/872)).
-   Now the _Inventory_ tab will always be available for all agents, and a descriptive message will appear if the agent doesn't have `syscollector` enabled ([#879](https://github.com/wazuh/wazuh-kibana-app/pull/879)).

### Fixed

-   Fixed a bug where the _Inventory_ tab was unavailable if the user reloads the page while on the _Agents > Configuration_ tab ([#845](https://github.com/wazuh/wazuh-kibana-app/pull/845)).
-   Fixed some _Overview > VirusTotal_ visualizations ([#846](https://github.com/wazuh/wazuh-kibana-app/pull/846)).
-   Fixed a bug where the _Settings > Extensions_ tab wasn't being properly hidden when there's no API entries inserted ([#847](https://github.com/wazuh/wazuh-kibana-app/pull/847)).
-   Fixed a bug where the _Current API_ indicator on the top navbar wasn't being properly updated when the user deletes all the API entries ([#848](https://github.com/wazuh/wazuh-kibana-app/pull/848)).
-   Fixed a bug where the _Agents coverage_ metric were not displaying a proper value when the manager has 0 registered agents ([#849](https://github.com/wazuh/wazuh-kibana-app/pull/849)).
-   Fixed a bug where the `wazuh-basic` user role was able to update API entries (it should be forbidden) ([#853](https://github.com/wazuh/wazuh-kibana-app/pull/853)).
-   Fixed a bug where the visualizations had scroll bars on the PDF reports ([#870](https://github.com/wazuh/wazuh-kibana-app/pull/870)).
-   Fixed a bug on the _Dev tools_ tab where the user couldn't execute the first request block if there was blank lines above it ([#871](https://github.com/wazuh/wazuh-kibana-app/pull/871)).
-   Fixed a bug on pinned filters when opening tabs where the implicit filter was the same, making them stuck and unremovable from other tabs ([#878](https://github.com/wazuh/wazuh-kibana-app/pull/878)).

## Wazuh v3.6.1 - Kibana v6.4.0 - Revision 409

### Added

-   Support for Wazuh v3.6.1.

### Fixed

-   Fixed a bug on the _Dev tools_ tab ([b7c79f4](https://github.com/wazuh/wazuh-kibana-app/commit/b7c79f48f06cb49b12883ec9e9337da23b49976b)).

## Wazuh v3.6.1 - Kibana v6.3.2 - Revision 408

### Added

-   Support for Wazuh v3.6.1.

### Fixed

-   Fixed a bug on the _Dev tools_ tab ([4ca9ed5](https://github.com/wazuh/wazuh-kibana-app/commit/4ca9ed54f1b18e5d499d950e6ff0741946701988)).

## Wazuh v3.6.0 - Kibana v6.4.0 - Revision 407

### Added

-   Support for Wazuh v3.6.0.

## Wazuh v3.6.0 - Kibana v6.3.2 - Revision 406

### Added

-   Support for Wazuh v3.6.0.

## Wazuh v3.5.0 - Kibana v6.4.0 - Revision 405

### Added

-   Support for Elastic Stack v6.4.0 ([#813](https://github.com/wazuh/wazuh-kibana-app/pull/813)).

## Wazuh v3.5.0 - Kibana v6.3.2 - Revision 404

### Added

-   Added new options to `config.yml` to change shards and replicas settings for `wazuh-monitoring` indices ([#809](https://github.com/wazuh/wazuh-kibana-app/pull/809)).
-   Added more error messages for `wazuhapp.log` in case of failure when performing some crucial functions ([#812](https://github.com/wazuh/wazuh-kibana-app/pull/812)).
-   Now it's possible to change replicas settings for existing `.wazuh`, `.wazuh-version` and `wazuh-monitoring` indices on the `config.yml` file ([#817](https://github.com/wazuh/wazuh-kibana-app/pull/817)).

### Changed

-   App frontend code refactored and restructured ([#802](https://github.com/wazuh/wazuh-kibana-app/pull/802)).
-   Now the _Overview > Security events_ tab won't show anything if the only visualization with data is _Agents status_ ([#811](https://github.com/wazuh/wazuh-kibana-app/pull/811)).

### Fixed

-   Fixed a bug where the RAM status message appreared twice the first time you opened the app ([#807](https://github.com/wazuh/wazuh-kibana-app/pull/807)).
-   Fixed the app UI to make the app usable on Internet Explorer 11 ([#808](https://github.com/wazuh/wazuh-kibana-app/pull/808)).

## Wazuh v3.5.0 - Kibana v6.3.2 - Revision 403

### Added

-   The welcome tabs on _Overview_ and _Agents_ have been updated with a new name and description for the existing sections ([#788](https://github.com/wazuh/wazuh-kibana-app/pull/788)).
-   Now the app tables will auto-resize depending on the screen height ([#792](https://github.com/wazuh/wazuh-kibana-app/pull/792)).

### Changed

-   Now all the app filters on several tables will present the values in alphabetical order ([#787](https://github.com/wazuh/wazuh-kibana-app/pull/787)).

### Fixed

-   Fixed a bug on _Decoders_ where clicking on the decoder wouldn't open the detail view if the `Parent decoders` filter was enabled ([#782](https://github.com/wazuh/wazuh-kibana-app/pull/782)).
-   Fixed a bug on _Dev tools_ when the first line on the editor pane was empty or had a comment ([#790](https://github.com/wazuh/wazuh-kibana-app/pull/790)).
-   Fixed a bug where the app was throwing multiple warning messages the first time you open it ([#791](https://github.com/wazuh/wazuh-kibana-app/pull/791)).
-   Fixed a bug where clicking on a different tab from _Overview_ right after inserting the API credentials for the first time would always redirect to _Overview_ ([#791](https://github.com/wazuh/wazuh-kibana-app/pull/791)).
-   Fixed a bug where the user could have a browser cookie with a reference to a non-existing API entry on Elasticsearch ([#794](https://github.com/wazuh/wazuh-kibana-app/pull/794) & [#795](https://github.com/wazuh/wazuh-kibana-app/pull/795)).

### Removed

-   The cluster key has been removed from the API requests to `/manager/configuration` ([#796](https://github.com/wazuh/wazuh-kibana-app/pull/796)).

## Wazuh v3.5.0 - Kibana v6.3.1/v6.3.2 - Revision 402

### Added

-   Support for Wazuh v3.5.0.
-   Added new fields for _Vulnerability detector_ alerts ([#752](https://github.com/wazuh/wazuh-kibana-app/pull/752)).
-   Added multi table search for `wz-table` directive. Added two new log levels for _Management > Logs_ section ([#753](https://github.com/wazuh/wazuh-kibana-app/pull/753)).

## Wazuh v3.4.0 - Kibana v6.3.1/v6.3.2 - Revision 401

### Added

-   Added a few new fields for Kibana due to the new Wazuh _who-data_ feature ([#763](https://github.com/wazuh/wazuh-kibana-app/pull/763)).
-   Added XML/JSON viewer for each card under _Management > Configuration_ ([#764](https://github.com/wazuh/wazuh-kibana-app/pull/764)).

### Changed

-   Improved error handling for Dev tools. Also removed some unused dependencies from the _Dev tools_ tab ([#760](https://github.com/wazuh/wazuh-kibana-app/pull/760)).
-   Unified origin for tab descriptions. Reviewed some grammar typos ([#765](https://github.com/wazuh/wazuh-kibana-app/pull/765)).
-   Refactored agents autocomplete component. Removed unused/deprecated modules ([#766](https://github.com/wazuh/wazuh-kibana-app/pull/766)).
-   Simplified route resolves section ([#768](https://github.com/wazuh/wazuh-kibana-app/pull/768)).

### Fixed

-   Fixed missing cluster node filter for the visualization shown when looking for specific node under _Management > Monitoring_ section ([#758](https://github.com/wazuh/wazuh-kibana-app/pull/758)).
-   Fixed missing dependency injection for `wzMisc` factory ([#768](https://github.com/wazuh/wazuh-kibana-app/pull/768)).

### Removed

-   Removed `angular-aria`, `angular-md5`, `ansicolors`, `js-yaml`, `querystring` and `lodash` dependencies since Kibana includes all of them. Removed some unused images ([#768](https://github.com/wazuh/wazuh-kibana-app/pull/768)).

## Wazuh v3.4.0 - Kibana v6.3.1/v6.3.2 - Revision 400

### Added

-   Support for Wazuh v3.4.0.
-   Support for Elastic Stack v6.3.2.
-   Support for Kuery as accepted query language ([#742](https://github.com/wazuh/wazuh-kibana-app/pull/742)).
    -   This feature is experimental.
-   Added new _Who data_ fields from file integrity monitoring features ([#746](https://github.com/wazuh/wazuh-kibana-app/pull/746)).
-   Added tab in _Settings_ section where you can see the last logs from the Wazuh app server ([#723](https://github.com/wazuh/wazuh-kibana-app/pull/723)).

### Changed

-   Fully redesigned of the welcome screen along the different app sections ([#751](https://github.com/wazuh/wazuh-kibana-app/pull/751)).
-   Now any agent can go to the _Inventory_ tab regardless if it's enabled or not. The content will change properly according to the agent configuration ([#744](https://github.com/wazuh/wazuh-kibana-app/pull/744)).
-   Updated the `angular-material` dependency to `1.1.10` ([#743](https://github.com/wazuh/wazuh-kibana-app/pull/743)).
-   Any API entry is now removable regardless if it's the only one API entry ([#740](https://github.com/wazuh/wazuh-kibana-app/pull/740)).
-   Performance has been improved regarding to agents status, they are now being fetched using _distinct_ routes from the Wazuh API ([#738](https://github.com/wazuh/wazuh-kibana-app/pull/738)).
-   Improved the way we are parsing some Wazuh API errors regarding to version mismatching ([#735](https://github.com/wazuh/wazuh-kibana-app/pull/735)).

### Fixed

-   Fixed wrong filters being applied in _Ruleset > Rules_ and _Ruleset > Decoders_ sections when using Lucene like filters plus path filters ([#736](https://github.com/wazuh/wazuh-kibana-app/pull/736)).
-   Fixed the template checking from the healthcheck, now it allows to use custom index patterns ([#739](https://github.com/wazuh/wazuh-kibana-app/pull/739)).
-   Fixed infinite white screen from _Management > Monitoring_ when the Wazuh cluster is enabled but not running ([#741](https://github.com/wazuh/wazuh-kibana-app/pull/741)).

## Wazuh v3.3.0/v3.3.1 - Kibana v6.3.1 - Revision 399

### Added

-   Added a new Angular.js factory to store the Wazuh app configuration values. Also, this factory is being used by the pre-routes functions (resolves); this way we are sure about having the real configuration at any time. These pre-routes functions have been improved too ([#670](https://github.com/wazuh/wazuh-kibana-app/pull/670)).
-   Added extended information for reports from _Reporting_ feature ([#701](https://github.com/wazuh/wazuh-kibana-app/pull/701)).

### Changed

-   Tables have been improved. Now they are truncating long fields and adding a tooltip if needed ([#671](https://github.com/wazuh/wazuh-kibana-app/pull/671)).
-   Services have been improved ([#715](https://github.com/wazuh/wazuh-kibana-app/pull/715)).
-   CSV formatted files have been improved. Now they are showing a more human readable column names ([#717](https://github.com/wazuh/wazuh-kibana-app/pull/717), [#726](https://github.com/wazuh/wazuh-kibana-app/pull/726)).
-   Added/Modified some visualization titles ([#728](https://github.com/wazuh/wazuh-kibana-app/pull/728)).
-   Improved Discover perfomance when in background mode ([#719](https://github.com/wazuh/wazuh-kibana-app/pull/719)).
-   Reports from the _Reporting_ feature have been fulyl redesigned ([#701](https://github.com/wazuh/wazuh-kibana-app/pull/701)).

### Fixed

-   Fixed the top menu API indicator when checking the API connection and the manager/cluster information had been changed ([#668](https://github.com/wazuh/wazuh-kibana-app/pull/668)).
-   Fixed our logger module which was not writting logs the very first time Kibana is started neither after a log rotation ([#667](https://github.com/wazuh/wazuh-kibana-app/pull/667)).
-   Fixed a regular expression in the server side when parsing URLs before registering a new Wazuh API ([#690](https://github.com/wazuh/wazuh-kibana-app/pull/690)).
-   Fixed filters from specific visualization regarding to _File integrity_ section ([#694](https://github.com/wazuh/wazuh-kibana-app/pull/694)).
-   Fixed filters parsing when generating a report because it was not parsing negated filters as expected ([#696](https://github.com/wazuh/wazuh-kibana-app/pull/696)).
-   Fixed visualization counter from _OSCAP_ tab ([#722](https://github.com/wazuh/wazuh-kibana-app/pull/722)).

### Removed

-   Temporary removed CSV download from agent inventory section due to Wazuh API bug ([#727](https://github.com/wazuh/wazuh-kibana-app/pull/727)).

## Wazuh v3.3.0/v3.3.1 - Kibana v6.3.0 - Revision 398

### Added

-   Improvements for latest app redesign ([#652](https://github.com/wazuh/wazuh-kibana-app/pull/652)):
    -   The _Welcome_ tabs have been simplified, following a more Elastic design.
    -   Added again the `md-nav-bar` component with refined styles and limited to specific sections.
    -   The _Settings > Welcome_ tab has been removed. You can use the nav bar to switch tabs.
    -   Minor CSS adjustments and reordering.
-   Small app UI improvements ([#634](https://github.com/wazuh/wazuh-kibana-app/pull/634)):
    -   Added link to _Agents Preview_ on the _Agents_ tab breadcrumbs.
    -   Replaced the _Generate report_ button with a smaller one.
    -   Redesigned _Management > Ruleset_ `md-chips` to look similar to Kibana filter pills.
    -   Added agent information bar from _Agents > General_ to _Agents > Welcome_ too.
    -   Refactored flex layout on _Welcome_ tabs to fix a height visual bug.
    -   Removed duplicated loading rings on the _Agents_ tab.
-   Improvements for app tables ([#627](https://github.com/wazuh/wazuh-kibana-app/pull/627)):
    -   Now the current page will be highlighted.
    -   The gap has been fixed to the items per page value.
    -   If there are no more pages for _Next_ or _Prev_ buttons, they will be hidden.
-   Improvements for app health check ([#637](https://github.com/wazuh/wazuh-kibana-app/pull/637)):
    -   Improved design for the view.
    -   The checks have been placed on a table, showing the current status of each one.
-   Changes to our reporting feature ([#639](https://github.com/wazuh/wazuh-kibana-app/pull/639)):
    -   Now the generated reports will include tables for each section.
    -   Added a parser for getting Elasticsearch data table responses.
    -   The reporting feature is now a separated module, and the code has been refactored.
-   Improvements for app tables pagination ([#646](https://github.com/wazuh/wazuh-kibana-app/pull/646)).

### Changed

-   Now the `pretty` parameter on the _Dev tools_ tab will be ignored to avoid `Unexpected error` messages ([#624](https://github.com/wazuh/wazuh-kibana-app/pull/624)).
-   The `pdfkit` dependency has been replaced by `pdfmake` ([#639](https://github.com/wazuh/wazuh-kibana-app/pull/639)).
-   Changed some Kibana tables for performance improvements on the reporting feature ([#644](https://github.com/wazuh/wazuh-kibana-app/pull/644)).
-   Changed the method to refresh the list of known fields on the index pattern ([#650](https://github.com/wazuh/wazuh-kibana-app/pull/650)):
    -   Now when restarting Kibana, the app will update the fieldset preserving the custom user fields.

### Fixed

-   Fixed bug on _Agents CIS-CAT_ tab who wasn't loading the appropriate visualizations ([#626](https://github.com/wazuh/wazuh-kibana-app/pull/626)).
-   Fixed a bug where sometimes the index pattern could be `undefined` during the health check process, leading into a false error message when loading the app ([#640](https://github.com/wazuh/wazuh-kibana-app/pull/640)).
-   Fixed several bugs on the _Settings > API_ tab when removing, adding or editing new entries.

### Removed

-   Removed the app login system ([#636](https://github.com/wazuh/wazuh-kibana-app/pull/636)):
    -   This feature was unstable, experimental and untested for a long time. We'll provide much better RBAC capabilities in the future.
-   Removed the new Kuery language option on Discover app search bars.
    -   This feature will be restored in the future, after more Elastic v6.3.0 adaptations.

## Wazuh v3.3.0/v3.3.1 - Kibana v6.3.0 - Revision 397

### Added

-   Support for Elastic Stack v6.3.0 ([#579](https://github.com/wazuh/wazuh-kibana-app/pull/579) & [#612](https://github.com/wazuh/wazuh-kibana-app/pull/612) & [#615](https://github.com/wazuh/wazuh-kibana-app/pull/615)).
-   Brand-new Wazuh app redesign for the _Monitoring_ tab ([#581](https://github.com/wazuh/wazuh-kibana-app/pull/581)):
    -   Refactored and optimized UI for these tabs, using a breadcrumbs-based navigability.
    -   Used the same guidelines from the previous redesign for _Overview_ and _Agents_ tabs.
-   New tab for _Agents_ - _Inventory_ ([#582](https://github.com/wazuh/wazuh-kibana-app/pull/582)):
    -   Get information about the agent host, such as installed packages, motherboard, operating system, etc.
    -   This tab will appear if the agent has the [`syscollector`](https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/wodle-syscollector.html) wodle enabled.
-   Brand-new extension - _CIS-CAT Alerts_ ([#601](https://github.com/wazuh/wazuh-kibana-app/pull/601)):
    -   A new extension, disabled by default.
    -   Visualize alerts related to the CIS-CAT benchmarks on the _Overview_ and _Agents_ tabs.
    -   Get information about the last performed scan and its score.
-   Several improvements for the  _Dev tools_ tab ([#583](https://github.com/wazuh/wazuh-kibana-app/pull/583) & [#597](https://github.com/wazuh/wazuh-kibana-app/pull/597)):
    -   Now you can insert queries using inline parameters, just like in a web browser.
    -   You can combine inline parameters with JSON-like parameters.
    -   If you use the same parameter on both methods with different values, the inline parameter has precedence over the other one.
    -   The tab icon has been changed for a more appropriate one.
    -   The `Execute query` button is now always placed on the first line of the query block.
-   Refactoring for all app tables ([#582](https://github.com/wazuh/wazuh-kibana-app/pull/582)):
    -   Replaced the old `wz-table` directive with a new one, along with a new data factory.
    -   Now the tables are built with a pagination system.
    -   Much easier method for building tables for the app.
    -   Performance and stability improvements when fetching API data.
    -   Now you can see the total amount of items and the elapsed time.

### Changed

-   Moved some logic from the _Agents preview_ tab to the server, to avoid excessive client-side workload ([#586](https://github.com/wazuh/wazuh-kibana-app/pull/586)).
-   Changed the UI to use the same loading ring across all the app tabs ([#593](https://github.com/wazuh/wazuh-kibana-app/pull/593) & [#599](https://github.com/wazuh/wazuh-kibana-app/pull/599)).
-   Changed the _No results_ message across all the tabs with visualizations ([#599](https://github.com/wazuh/wazuh-kibana-app/pull/599)).

### Fixed

-   Fixed a bug on the _Settings/Extensions_ tab where enabling/disabling some extensions could make other ones to be disabled ([#591](https://github.com/wazuh/wazuh-kibana-app/pull/591)).

## Wazuh v3.3.0/v3.3.1 - Kibana v6.2.4 - Revision 396

### Added

-   Support for Wazuh v3.3.1.
-   Brand-new Wazuh app redesign for the _Settings_ tab ([#570](https://github.com/wazuh/wazuh-kibana-app/pull/570)):
    -   Refactored and optimized UI for these tabs, using a breadcrumbs-based navigability.
    -   Used the same guidelines from the previous redesign for _Overview_ and _Agents_ tabs.
-   Refactoring for _Overview_ and _Agents_ controllers ([#564](https://github.com/wazuh/wazuh-kibana-app/pull/564)):
    -   Reduced duplicated code by splitting it into separate files.
    -   Code optimization for a better performance and maintainability.
    -   Added new services to provide similar functionality between different app tabs.
-   Added `data.vulnerability.package.condition` to the list of known fields ([#566](https://github.com/wazuh/wazuh-kibana-app/pull/566)).

### Changed

-   The `wazuh-logs` and `wazuh-monitoring` folders have been moved to the Kibana's `optimize` directory in order to avoid some error messages when using the `kibana-plugin list` command ([#563](https://github.com/wazuh/wazuh-kibana-app/pull/563)).

### Fixed

-   Fixed a bug on the _Settings_ tab where updating an API entry with wrong credentials would corrupt the existing one ([#558](https://github.com/wazuh/wazuh-kibana-app/pull/558)).
-   Fixed a bug on the _Settings_ tab where removing an API entry while its edit form is opened would hide the `Add API` button unless the user reloads the tab ([#558](https://github.com/wazuh/wazuh-kibana-app/pull/558)).
-   Fixed some Audit visualizations on the _Overview_ and _Agents_ tabs that weren't using the same search query to show the results ([#572](https://github.com/wazuh/wazuh-kibana-app/pull/572)).
-   Fixed undefined variable error on the `wz-menu` directive ([#575](https://github.com/wazuh/wazuh-kibana-app/pull/575)).

## Wazuh v3.3.0 - Kibana v6.2.4 - Revision 395

### Fixed

-   Fixed a bug on the _Agent Configuration_ tab where the sync status was always `NOT SYNCHRONIZED` ([#569](https://github.com/wazuh/wazuh-kibana-app/pull/569)).

## Wazuh v3.3.0 - Kibana v6.2.4 - Revision 394

### Added

-   Support for Wazuh v3.3.0.
-   Updated some backend API calls to include the app version in the request header ([#560](https://github.com/wazuh/wazuh-kibana-app/pull/560)).

## Wazuh v3.2.4 - Kibana v6.2.4 - Revision 393

### Added

-   Brand-new Wazuh app redesign for _Overview_ and _Agents_ tabs ([#543](https://github.com/wazuh/wazuh-kibana-app/pull/543)):
    -   Updated UI for these tabs using breadcrumbs.
    -   New _Welcome_ screen, presenting all the tabs to the user, with useful links to our documentation.
    -   Overall design improved, adjusted font sizes and reduced HTML code.
    -   This base will allow the app to increase its functionality in the future.
    -   Removed the `md-nav-bar` component for a better user experience on small screens.
    -   Improved app performance removing some CSS effects from some components, such as buttons.
-   New filter for agent version on the _Agents Preview_ tab ([#537](https://github.com/wazuh/wazuh-kibana-app/pull/537)).
-   New filter for cluster node on the _Agents Preview_ tab ([#538](https://github.com/wazuh/wazuh-kibana-app/pull/538)).

### Changed

-   Now the report generation process will run in a parallel mode in the foreground ([#523](https://github.com/wazuh/wazuh-kibana-app/pull/523)).
-   Replaced the usage of `$rootScope` with two new factories, along with more controller improvements ([#525](https://github.com/wazuh/wazuh-kibana-app/pull/525)).
-   Now the _Extensions_ tab on _Settings_ won't edit the `.wazuh` index to modify the extensions configuration for all users ([#545](https://github.com/wazuh/wazuh-kibana-app/pull/545)).
    -   This allows each new user to always start with the base extensions configuration, and modify it to its needs storing the settings on a browser cookie.
-   Now the GDPR requirements description on its tab won't be loaded if the Wazuh API version is not v3.2.3 or higher ([#546](https://github.com/wazuh/wazuh-kibana-app/pull/546)).

### Fixed

-   Fixed a bug where the app crashes when attempting to download huge amounts of data as CSV format ([#521](https://github.com/wazuh/wazuh-kibana-app/pull/521)).
-   Fixed a bug on the Timelion visualizations from _Management/Monitoring_ which were not properly filtering and showing the cluster nodes information ([#530](https://github.com/wazuh/wazuh-kibana-app/pull/530)).
-   Fixed several bugs on the loading process when switching between tabs with or without visualizations in the _Overview_ and _Agents_ tab ([#531](https://github.com/wazuh/wazuh-kibana-app/pull/531) & [#533](https://github.com/wazuh/wazuh-kibana-app/pull/533)).
-   Fixed a bug on the `wazuh-monitoring` index feature when using multiple inserted APIs, along with several performance improvements ([#539](https://github.com/wazuh/wazuh-kibana-app/pull/539)).
-   Fixed a bug where the OS filter on the _Agents Preview_ tab would exclude the rest of filters instead of combining them ([#552](https://github.com/wazuh/wazuh-kibana-app/pull/552)).
-   Fixed a bug where the Extensions settings were restored every time the user opened the _Settings_ tab or pressed the _Set default manager_ button ([#555](https://github.com/wazuh/wazuh-kibana-app/pull/555) & [#556](https://github.com/wazuh/wazuh-kibana-app/pull/556)).

## Wazuh v3.2.3/v3.2.4 - Kibana v6.2.4 - Revision 392

### Added

-   Support for Wazuh v3.2.4.
-   New functionality - _Reporting_ ([#510](https://github.com/wazuh/wazuh-kibana-app/pull/510)):
    -   Generate PDF logs on the _Overview_ and _Agents_ tabs, with the new button next to _Panels_ and _Discover_.
    -   The report will contain the current visualizations from the tab where you generated it.
    -   List all your generated reports, download or deleted them at the new _Management/Reporting_ tab.
    -   **Warning:** If you leave the tab while generating a report, the process will be aborted.
-   Added warning/error messages about the total RAM on the server side ([#502](https://github.com/wazuh/wazuh-kibana-app/pull/502)):
    -   None of this messages will prevent the user from accessing the app, it's just a recommendation.
    -   If your server has less than 2GB of RAM, you'll get an error message when opening the app.
    -   If your server has between 2GB and 3GB of RAM, you'll get a warning message.
    -   If your server has more than 3GB of RAM, you won't get any kind of message.
-   Refactoring and added loading bar to _Manager Logs_ and _Groups_ tabs ([#505](https://github.com/wazuh/wazuh-kibana-app/pull/505)).
-   Added more Syscheck options to _Management/Agents_ configuration tabs ([#509](https://github.com/wazuh/wazuh-kibana-app/pull/509)).

### Fixed

-   Added more fields to the `known-fields.js` file to avoid warning messages on _Discover_ when using Filebeat for alerts forwarding ([#497](https://github.com/wazuh/wazuh-kibana-app/pull/497)).
-   Fixed a bug where clicking on the _Check connection_ button on the _Settings_ tab threw an error message although the API connected successfully ([#504](https://github.com/wazuh/wazuh-kibana-app/pull/504)).
-   Fixed a bug where the _Agents_ tab was not properly showing the total of agents due to the new Wazuh cluster implementation ([#517](https://github.com/wazuh/wazuh-kibana-app/pull/517)).

## Wazuh v3.2.3 - Kibana v6.2.4 - Revision 391

### Added

-   Support for Wazuh v3.2.3.
-   Brand-new extension - _GDPR Alerts_ ([#453](https://github.com/wazuh/wazuh-kibana-app/pull/453)):
    -   A new extension, enabled by default.
    -   Visualize alerts related to the GDPR compliance on the _Overview_ and _Agents_ tabs.
    -   The _Ruleset_ tab has been updated to include GDPR filters on the _Rules_ subtab.
-   Brand-new Management tab - _Monitoring_ ([#490](https://github.com/wazuh/wazuh-kibana-app/pull/490)):
    -   Visualize your Wazuh cluster, both master and clients.
        -   Get the current cluster configuration.
        -   Nodes listing, sorting, searching, etc.
    -   Get a more in-depth cluster status thanks to the newly added [_Timelion_](https://www.elastic.co/guide/en/kibana/current/timelion.html) visualizations.
    -   The Detail view gives you a summary of the node's healthcheck.
-   Brand-new tab - _Dev tools_ ([#449](https://github.com/wazuh/wazuh-kibana-app/pull/449)):
    -   Find it on the top navbar, next to _Discover_.
    -   Execute Wazuh API requests directly from the app.
    -   This tab uses your currently selected API from _Settings_.
    -   You can type different API requests on the input window, select one with the cursor, and click on the Play button to execute it.
    -   You can also type comments on the input window.
-   More improvements for the _Manager/Ruleset_ tab ([#446](https://github.com/wazuh/wazuh-kibana-app/pull/446)):
    -   A new colour palette for regex, order and rule description arguments.
    -   Added return to List view on Ruleset button while on Detail view.
    -   Fixed line height on all table headers.
    -   Removed unused, old code from Ruleset controllers.
-   Added option on `config.yml` to enable/disable the `wazuh-monitoring` index ([#441](https://github.com/wazuh/wazuh-kibana-app/pull/441)):
    -   Configure the frequency time to generate new indices.
    -   The default frequency time has been increased to 1 hour.
    -   When disabled, useful metrics will appear on _Overview/General_ replacing the _Agent status_ visualization.
-   Added CSV exporting button to the app ([#431](https://github.com/wazuh/wazuh-kibana-app/pull/431)):
    -   Implemented new logic to fetch data from the Wazuh API and download it in CSV format.
    -   Currently available for the _Ruleset_, _Logs_ and _Groups_ sections on the _Manager_ tab and also the _Agents_ tab.
-   More refactoring to the app backend ([#439](https://github.com/wazuh/wazuh-kibana-app/pull/439)):
    -   Standardized error output from the server side.
    -   Drastically reduced the error management logic on the client side.
    -   Applied the _Facade_ pattern when importing/exporting modules.
    -   Deleted unused/deprecated/useless methods both from server and client side.
    -   Some optimizations to variable type usages.
-   Refactoring to Kibana filters management ([#452](https://github.com/wazuh/wazuh-kibana-app/pull/452) & [#459](https://github.com/wazuh/wazuh-kibana-app/pull/459)):
    -   Added new class to build queries from the base query.
    -   The filter management is being done on controllers instead of the `discover` directive.
    -   Now we are emitting specific events whenever we are fetching data or communicating to the `discover` directive.
    -   The number of useless requests to fetch data has been reduced.
    -   The synchronization actions are working as expected regardless the amount of data and/or the number of machine resources.
    -   Fixed several bugs about filter usage and transition to different app tabs.
-   Added confirmation message when the user deletes an API entry on _Settings/API_ ([#428](https://github.com/wazuh/wazuh-kibana-app/pull/428)).
-   Added support for filters on the _Manager/Logs_ tab when realtime is enabled ([#433](https://github.com/wazuh/wazuh-kibana-app/pull/433)).
-   Added more filter options to the Detail view on _Manager/Ruleset_ ([#434](https://github.com/wazuh/wazuh-kibana-app/pull/434)).

### Changed

-   Changed OSCAP visualization to avoid clipping issues with large agent names ([#429](https://github.com/wazuh/wazuh-kibana-app/pull/429)).
-   Now the related Rules or Decoders sections on _Manager/Ruleset_ will remain hidden if there isn't any data to show or while it's loading ([#434](https://github.com/wazuh/wazuh-kibana-app/pull/434)).
-   Added a 200ms delay when fetching iterable data from the Wazuh API ([#445](https://github.com/wazuh/wazuh-kibana-app/pull/445) & [#450](https://github.com/wazuh/wazuh-kibana-app/pull/450)).
-   Fixed several bugs related to Wazuh API timeout/cancelled requests ([#445](https://github.com/wazuh/wazuh-kibana-app/pull/445)).
-   Added `ENOTFOUND`, `EHOSTUNREACH`, `EINVAL`, `EAI_AGAIN` options for API URL parameter checking ([#463](https://github.com/wazuh/wazuh-kibana-app/pull/463)).
-   Now the _Settings/Extensions_ subtab won't appear unless there's at least one API inserted ([#465](https://github.com/wazuh/wazuh-kibana-app/pull/465)).
-   Now the index pattern selector on _Settings/Pattern_ will also refresh the known fields when changing it ([#477](https://github.com/wazuh/wazuh-kibana-app/pull/477)).
-   Changed the _Manager_ tab into _Management_ ([#490](https://github.com/wazuh/wazuh-kibana-app/pull/490)).

### Fixed

-   Fixed a bug where toggling extensions after deleting an API entry could lead into an error message ([#465](https://github.com/wazuh/wazuh-kibana-app/pull/465)).
-   Fixed some performance bugs on the `dataHandler` service ([#442](https://github.com/wazuh/wazuh-kibana-app/pull/442) & [#486](https://github.com/wazuh/wazuh-kibana-app/pull/442)).
-   Fixed a bug when loading the _Agents preview_ tab on Safari web browser ([#447](https://github.com/wazuh/wazuh-kibana-app/pull/447)).
-   Fixed a bug where a new extension (enabled by default) appears disabled when updating the app ([#456](https://github.com/wazuh/wazuh-kibana-app/pull/456)).
-   Fixed a bug where pressing the Enter key on the _Discover's_ tab search bar wasn't working properly ([#488](https://github.com/wazuh/wazuh-kibana-app/pull/488)).

### Removed

-   Removed the `rison` dependency from the `package.json` file ([#452](https://github.com/wazuh/wazuh-kibana-app/pull/452)).
-   Removed unused Elasticsearch request to avoid problems when there's no API inserted ([#460](https://github.com/wazuh/wazuh-kibana-app/pull/460)).

## Wazuh v3.2.1/v3.2.2 - Kibana v6.2.4 - Revision 390

### Added

-   Support for Wazuh v3.2.2.
-   Refactoring on visualizations use and management ([#397](https://github.com/wazuh/wazuh-kibana-app/pull/397)):
    -   Visualizations are no longer stored on an index, they're built and loaded on demand when needed to render the interface.
    -   Refactoring on the whole app source code to use the _import/export_ paradigm.
    -   Removed old functions and variables from the old visualization management logic.
    -   Removed cron task to clean remaining visualizations since it's no longer needed.
    -   Some Kibana functions and modules have been overridden in order to make this refactoring work.
        -   This change is not intrusive in any case.
-   New redesign for the _Manager/Ruleset_ tab ([#420](https://github.com/wazuh/wazuh-kibana-app/pull/420)):
    -   Rules and decoders list now divided into two different sections: _List view_ and _Detail view_.
    -   Removed old expandable tables to move the rule/decoder information into a new space.
    -   Enable different filters on the detail view for a better search on the list view.
    -   New table for related rules or decoders.
    -   And finally, a bunch of minor design enhancements to the whole app.
-   Added a copyright notice to the whole app source code ([#395](https://github.com/wazuh/wazuh-kibana-app/pull/395)).
-   Updated `.gitignore` with the _Node_ template ([#395](https://github.com/wazuh/wazuh-kibana-app/pull/395)).
-   Added new module to the `package.json` file, [`rison`](https://www.npmjs.com/package/rison) ([#404](https://github.com/wazuh/wazuh-kibana-app/pull/404)).
-   Added the `errorHandler` service to the blank screen scenario ([#413](https://github.com/wazuh/wazuh-kibana-app/pull/413)):
    -   Now the exact error message will be shown to the user, instead of raw JSON content.
-   Added new option on the `config.yml` file to disable the new X-Pack RBAC capabilities to filter index-patterns ([#417](https://github.com/wazuh/wazuh-kibana-app/pull/417)).

### Changed

-   Small minor enhancements to the user interface ([#396](https://github.com/wazuh/wazuh-kibana-app/pull/396)):
    -   Reduced Wazuh app logo size.
    -   Changed buttons text to not use all-capitalized letters.
    -   Minor typos found in the HTML/CSS code have been fixed.
-   Now the app log stores the package revision ([#417](https://github.com/wazuh/wazuh-kibana-app/pull/417)).

### Fixed

-   Fixed bug where the _Agents_ tab didn't preserve the filters after reloading the page ([#404](https://github.com/wazuh/wazuh-kibana-app/pull/404)).
-   Fixed a bug when using X-Pack that sometimes threw an error of false _"Not enough privileges"_ scenario ([#415](https://github.com/wazuh/wazuh-kibana-app/pull/415)).
-   Fixed a bug where the Kibana Discover auto-refresh functionality was still working when viewing the _Agent configuration_ tab ([#419](https://github.com/wazuh/wazuh-kibana-app/pull/419)).

## Wazuh v3.2.1 - Kibana v6.2.4 - Revision 389

### Changed

-   Changed severity and verbosity to some log messages ([#412](https://github.com/wazuh/wazuh-kibana-app/pull/412)).

### Fixed

-   Fixed a bug when using the X-Pack plugin without security capabilities enabled ([#403](https://github.com/wazuh/wazuh-kibana-app/pull/403)).
-   Fixed a bug when the app was trying to create `wazuh-monitoring` indices without checking the existence of the proper template ([#412](https://github.com/wazuh/wazuh-kibana-app/pull/412)).

## Wazuh v3.2.1 - Kibana v6.2.4 - Revision 388

### Added

-   Support for Elastic Stack v6.2.4.
-   App server fully refactored ([#360](https://github.com/wazuh/wazuh-kibana-app/pull/360)):
    -   Added new classes, reduced the amount of code, removed unused functions, and several optimizations.
    -   Now the app follows a more ES6 code style on multiple modules.
    -   _Overview/Agents_ visualizations have been ordered into separated files and folders.
    -   Now the app can use the default index defined on the `/ect/kibana/kibana.yml` file.
    -   Better error handling for the visualizations directive.
    -   Added a cron job to delete remaining visualizations on the `.kibana` index if so.
    -   Also, we've added some changes when using the X-Pack plugin:
        -   Better management of users and roles in order to use the app capabilities.
        -   Prevents app loading if the currently logged user has no access to any index pattern.
-   Added the `errorHandler` service to the `dataHandler` factory ([#340](https://github.com/wazuh/wazuh-kibana-app/pull/340)).
-   Added Syscollector section to _Manager/Agents Configuration_ tabs ([#359](https://github.com/wazuh/wazuh-kibana-app/pull/359)).
-   Added `cluster.name` field to the `wazuh-monitoring` index ([#377](https://github.com/wazuh/wazuh-kibana-app/pull/377)).

### Changed

-   Increased the query size when fetching the index pattern list ([#339](https://github.com/wazuh/wazuh-kibana-app/pull/339)).
-   Changed active colour for all app tables ([#347](https://github.com/wazuh/wazuh-kibana-app/pull/347)).
-   Changed validation regex to accept URLs with non-numeric format ([#353](https://github.com/wazuh/wazuh-kibana-app/pull/353)).
-   Changed visualization removal cron task to avoid excessive log messages when there weren't removed visualizations ([#361](https://github.com/wazuh/wazuh-kibana-app/pull/361)).
-   Changed filters comparison for a safer access ([#383](https://github.com/wazuh/wazuh-kibana-app/pull/383)).
-   Removed some `server.log` messages to avoid performance errors ([#384](https://github.com/wazuh/wazuh-kibana-app/pull/384)).
-   Changed the way of handling the index patterns list ([#360](https://github.com/wazuh/wazuh-kibana-app/pull/360)).
-   Rewritten some false error-level logs to just information-level ones ([#360](https://github.com/wazuh/wazuh-kibana-app/pull/360)).
-   Changed some files from JSON to CommonJS for performance improvements ([#360](https://github.com/wazuh/wazuh-kibana-app/pull/360)).
-   Replaced some code on the `kibana-discover` directive with a much cleaner statement to avoid issues on the _Agents_ tab ([#394](https://github.com/wazuh/wazuh-kibana-app/pull/394)).

### Fixed

-   Fixed a bug where several `agent.id` filters were created at the same time when navigating between _Agents_ and _Groups_ with different selected agents ([#342](https://github.com/wazuh/wazuh-kibana-app/pull/342)).
-   Fixed logic on the index-pattern selector which wasn't showing the currently selected pattern the very first time a user opened the app ([#345](https://github.com/wazuh/wazuh-kibana-app/pull/345)).
-   Fixed a bug on the `errorHandler` service who was preventing a proper output of some Elastic-related backend error messages ([#346](https://github.com/wazuh/wazuh-kibana-app/pull/346)).
-   Fixed panels flickering in the _Settings_ tab ([#348](https://github.com/wazuh/wazuh-kibana-app/pull/348)).
-   Fixed a bug in the shards and replicas settings when the user sets the value to zero (0) ([#358](https://github.com/wazuh/wazuh-kibana-app/pull/358)).
-   Fixed several bugs related to the upgrade process from Wazuh 2.x to the new refactored server ([#363](https://github.com/wazuh/wazuh-kibana-app/pull/363)).
-   Fixed a bug in _Discover/Agents VirusTotal_ tabs to avoid conflicts with the `agent.name` field ([#379](https://github.com/wazuh/wazuh-kibana-app/pull/379)).
-   Fixed a bug on the implicit filter in _Discover/Agents PCI_ tabs ([#393](https://github.com/wazuh/wazuh-kibana-app/pull/393)).

### Removed

-   Removed clear API password on `checkPattern` response ([#339](https://github.com/wazuh/wazuh-kibana-app/pull/339)).
-   Removed old dashboard visualizations to reduce loading times ([#360](https://github.com/wazuh/wazuh-kibana-app/pull/360)).
-   Removed some unused dependencies due to the server refactoring ([#360](https://github.com/wazuh/wazuh-kibana-app/pull/360)).
-   Removed completely `metricService` from the app ([#389](https://github.com/wazuh/wazuh-kibana-app/pull/389)).

## Wazuh v3.2.1 - Kibana v6.2.2/v6.2.3 - Revision 387

### Added

-   New logging system ([#307](https://github.com/wazuh/wazuh-kibana-app/pull/307)):
    -   New module implemented to write app logs.
    -   Now a trace is stored every time the app is re/started.
    -   Currently, the `initialize.js` and `monitoring.js` files work with this system.
    -   Note: the logs will live under `/var/log/wazuh/wazuhapp.log` on Linux systems, on Windows systems they will live under `kibana/plugins/`. It rotates the log whenever it reaches 100MB.
-   Better cookies handling ([#308](https://github.com/wazuh/wazuh-kibana-app/pull/308)):
    -   New field on the `.wazuh-version` index to store the last time the Kibana server was restarted.
    -   This is used to check if the cookies have consistency with the current server status.
    -   Now the app is clever and takes decisions depending on new consistency checks.
-   New design for the _Agents/Configuration_ tab ([#310](https://github.com/wazuh/wazuh-kibana-app/pull/310)):
    -   The style is the same as the _Manager/Configuration_ tab.
    -   Added two more sections: CIS-CAT and Commands ([#315](https://github.com/wazuh/wazuh-kibana-app/pull/315)).
    -   Added a new card that will appear when there's no group configuration at all ([#323](https://github.com/wazuh/wazuh-kibana-app/pull/323)).
-   Added _"group"_ column on the agents list in _Agents_ ([#312](https://github.com/wazuh/wazuh-kibana-app/pull/312)):
    -   If you click on the group, it will redirect the user to the specified group in _Manager/Groups_.
-   New option for the `config.yml` file, `ip.selector` ([#313](https://github.com/wazuh/wazuh-kibana-app/pull/313)):
    -   Define if the app will show or not the index pattern selector on the top navbar.
    -   This setting is set to `true` by default.
-   More CSS cleanup and reordering ([#315](https://github.com/wazuh/wazuh-kibana-app/pull/315)):
    -   New `typography.less` file.
    -   New `layout.less` file.
    -   Removed `cleaned.less` file.
    -   Reordering and cleaning of existing CSS files, including removal of unused classes, renaming, and more.
    -   The _Settings_ tab has been refactored to correct some visual errors with some card components.
    -   Small refactoring to some components from _Manager/Ruleset_ ([#323](https://github.com/wazuh/wazuh-kibana-app/pull/323)).
-   New design for the top navbar ([#326](https://github.com/wazuh/wazuh-kibana-app/pull/326)):
    -   Cleaned and refactored code
    -   Revamped design, smaller and with minor details to follow the rest of Wazuh app guidelines.
-   New design for the wz-chip component to follow the new Wazuh app guidelines ([#323](https://github.com/wazuh/wazuh-kibana-app/pull/323)).
-   Added more descriptive error messages when the user inserts bad credentials on the _Add new API_ form in the _Settings_ tab ([#331](https://github.com/wazuh/wazuh-kibana-app/pull/331)).
-   Added a new CSS class to truncate overflowing text on tables and metric ribbons ([#332](https://github.com/wazuh/wazuh-kibana-app/pull/332)).
-   Support for Elastic Stack v6.2.2/v6.2.3.

### Changed

-   Improved the initialization system ([#317](https://github.com/wazuh/wazuh-kibana-app/pull/317)):
    -   Now the app will re-create the index-pattern if the user deletes the currently used by the Wazuh app.
    -   The fieldset is now automatically refreshed if the app detects mismatches.
    -   Now every index-pattern is dynamically formatted (for example, to enable the URLs in the _Vulnerabilities_ tab).
    -   Some code refactoring for a better handling of possible use cases.
    -   And the best thing, it's no longer needed to insert the sample alert!
-   Improvements and changes to index-patterns ([#320](https://github.com/wazuh/wazuh-kibana-app/pull/320) & [#333](https://github.com/wazuh/wazuh-kibana-app/pull/333)):
    -   Added a new route, `/get-list`, to fetch the index pattern list.
    -   Removed and changed several functions for a proper management of index-patterns.
    -   Improved the compatibility with user-created index-patterns, known to have unpredictable IDs.
    -   Now the app properly redirects to `/blank-screen` if the length of the index patterns list is 0.
    -   Ignored custom index patterns with auto-generated ID on the initialization process.
        -   Now it uses the value set on the `config.yml` file.
    -   If the index pattern is no longer available, the cookie will be overwritten.
-   Improvements to the monitoring module ([#322](https://github.com/wazuh/wazuh-kibana-app/pull/322)):
    -   Minor refactoring to the whole module.
    -   Now the `wazuh-monitoring` index pattern is regenerated if it's missing.
    -   And the best thing, it's no longer needed to insert the monitoring template!
-   Now the app health check system only checks if the API and app have the same `major.minor` version ([#311](https://github.com/wazuh/wazuh-kibana-app/pull/311)):
    -   Previously, the API and app had to be on the same `major.minor.patch` version.
-   Adjusted space between title and value in some cards showing Manager or Agent configurations ([#315](https://github.com/wazuh/wazuh-kibana-app/pull/315)).
-   Changed red and green colours to more saturated ones, following Kibana style ([#315](https://github.com/wazuh/wazuh-kibana-app/pull/315)).

### Fixed

-   Fixed bug in Firefox browser who was not properly showing the tables with the scroll pagination functionality ([#314](https://github.com/wazuh/wazuh-kibana-app/pull/314)).
-   Fixed bug where visualizations weren't being destroyed due to ongoing renderization processes ([#316](https://github.com/wazuh/wazuh-kibana-app/pull/316)).
-   Fixed several UI bugs for a better consistency and usability ([#318](https://github.com/wazuh/wazuh-kibana-app/pull/318)).
-   Fixed an error where the initial index-pattern was not loaded properly the very first time you enter the app ([#328](https://github.com/wazuh/wazuh-kibana-app/pull/328)).
-   Fixed an error message that appeared whenever the app was not able to found the `wazuh-monitoring` index pattern ([#328](https://github.com/wazuh/wazuh-kibana-app/pull/328)).

## Wazuh v3.2.1 - Kibana v6.2.2 - Revision 386

### Added

-   New design for the _Manager/Groups_ tab ([#295](https://github.com/wazuh/wazuh-kibana-app/pull/295)).
-   New design for the _Manager/Configuration_ tab ([#297](https://github.com/wazuh/wazuh-kibana-app/pull/297)).
-   New design of agents statistics for the _Agents_ tab ([#299](https://github.com/wazuh/wazuh-kibana-app/pull/299)).
-   Added information ribbon into _Overview/Agent SCAP_ tabs ([#303](https://github.com/wazuh/wazuh-kibana-app/pull/303)).
-   Added information ribbon into _Overview/Agent VirusTotal_ tabs ([#306](https://github.com/wazuh/wazuh-kibana-app/pull/306)).
-   Added information ribbon into _Overview AWS_ tab ([#306](https://github.com/wazuh/wazuh-kibana-app/pull/306)).

### Changed

-   Refactoring of HTML and CSS code throughout the whole Wazuh app ([#294](https://github.com/wazuh/wazuh-kibana-app/pull/294), [#302](https://github.com/wazuh/wazuh-kibana-app/pull/302) & [#305](https://github.com/wazuh/wazuh-kibana-app/pull/305)):
    -   A big milestone for the project was finally achieved with this refactoring.
    -   We've removed the Bootstrap dependency from the `package.json` file.
    -   We've removed and merged many duplicated rules.
    -   We've removed HTML and `angular-md` overriding rules. Now we have more own-made classes to avoid undesired results on the UI.
    -   Also, this update brings tons of minor bugfixes related to weird HTML code.
-   Wazuh app visualizations reviewed ([#301](https://github.com/wazuh/wazuh-kibana-app/pull/301)):
    -   The number of used buckets has been limited since most of the table visualizations were surpassing acceptable limits.
    -   Some visualizations have been checked to see if they make complete sense on what they mean to show to the user.
-   Modified some app components for better follow-up of Kibana guidelines ([#290](https://github.com/wazuh/wazuh-kibana-app/pull/290) & [#297](https://github.com/wazuh/wazuh-kibana-app/pull/297)).
    -   Also, some elements were modified on the _Discover_ tab in order to correct some mismatches.

### Fixed

-   Adjusted information ribbon in _Agents/General_ for large OS names ([#290](https://github.com/wazuh/wazuh-kibana-app/pull/290) & [#294](https://github.com/wazuh/wazuh-kibana-app/pull/294)).
-   Fixed unsafe array access on the visualization directive when going directly into _Manager/Ruleset/Decoders_ ([#293](https://github.com/wazuh/wazuh-kibana-app/pull/293)).
-   Fixed a bug where navigating between agents in the _Agents_ tab was generating duplicated `agent.id` implicit filters ([#296](https://github.com/wazuh/wazuh-kibana-app/pull/296)).
-   Fixed a bug where navigating between different tabs from _Overview_ or _Agents_ while being on the _Discover_ sub-tab was causing data loss in metric watchers ([#298](https://github.com/wazuh/wazuh-kibana-app/pull/298)).
-   Fixed incorrect visualization of the rule level on _Manager/Ruleset/Rules_ when the rule level is zero (0) ([#298](https://github.com/wazuh/wazuh-kibana-app/pull/298)).

### Removed

-   Removed almost every `md-tooltip` component from the whole app ([#305](https://github.com/wazuh/wazuh-kibana-app/pull/305)).
-   Removed unused images from the `img` folder ([#305](https://github.com/wazuh/wazuh-kibana-app/pull/305)).

## Wazuh v3.2.1 - Kibana v6.2.2 - Revision 385

### Added

-   Support for Wazuh v3.2.1.
-   Brand-new first redesign for the app user interface ([#278](https://github.com/wazuh/wazuh-kibana-app/pull/278)):
    -   This is the very first iteration of a _work-in-progress_ UX redesign for the Wazuh app.
    -   The overall interface has been refreshed, removing some unnecessary colours and shadow effects.
    -   The metric visualizations have been replaced by an information ribbon under the filter search bar, reducing the amount of space they occupied.
        -   A new service was implemented for a proper handling of the metric visualizations watchers ([#280](https://github.com/wazuh/wazuh-kibana-app/pull/280)).
    -   The rest of the app visualizations now have a new, more detailed card design.
-   New shards and replicas settings to the `config.yml` file ([#277](https://github.com/wazuh/wazuh-kibana-app/pull/277)):
    -   Now you can apply custom values to the shards and replicas for the `.wazuh` and `.wazuh-version` indices.
    -   This feature only works before the installation process. If you modify these settings after installing the app, they won't be applied at all.

### Changed

-   Now clicking again on the _Groups_ tab on _Manager_ will properly reload the tab and redirect to the beginning ([#274](https://github.com/wazuh/wazuh-kibana-app/pull/274)).
-   Now the visualizations only use the `vis-id` attribute for loading them ([#275](https://github.com/wazuh/wazuh-kibana-app/pull/275)).
-   The colours from the toast messages have been replaced to follow the Elastic 6 guidelines ([#286](https://github.com/wazuh/wazuh-kibana-app/pull/286)).

### Fixed

-   Fixed wrong data flow on _Agents/General_ when coming from and going to the _Groups_ tab ([#273](https://github.com/wazuh/wazuh-kibana-app/pull/273)).
-   Fixed sorting on tables, now they use the sorting functionality provided by the Wazuh API ([#274](https://github.com/wazuh/wazuh-kibana-app/pull/274)).
-   Fixed column width issues on some tables ([#274](https://github.com/wazuh/wazuh-kibana-app/pull/274)).
-   Fixed bug in the _Agent configuration_ JSON viewer who didn't properly show the full group configuration ([#276](https://github.com/wazuh/wazuh-kibana-app/pull/276)).
-   Fixed excessive loading time from some Audit visualizations ([#278](https://github.com/wazuh/wazuh-kibana-app/pull/278)).
-   Fixed Play/Pause button in timepicker's auto-refresh ([#281](https://github.com/wazuh/wazuh-kibana-app/pull/281)).
-   Fixed unusual scenario on visualization directive where sometimes there was duplicated implicit filters when doing a search ([#283](https://github.com/wazuh/wazuh-kibana-app/pull/283)).
-   Fixed some _Overview Audit_ visualizations who were not working properly ([#285](https://github.com/wazuh/wazuh-kibana-app/pull/285)).

### Removed

-   Deleted the `id` attribute from all the app visualizations ([#275](https://github.com/wazuh/wazuh-kibana-app/pull/275)).

## Wazuh v3.2.0 - Kibana v6.2.2 - Revision 384

### Added

-   New directives for the Wazuh app: `wz-table`, `wz-table-header` and `wz-search-bar` ([#263](https://github.com/wazuh/wazuh-kibana-app/pull/263)):
    -   Maintainable and reusable components for a better-structured app.
    -   Several files have been changed, renamed and moved to new folders, following _best practices_.
    -   The progress bar is now within its proper directive ([#266](https://github.com/wazuh/wazuh-kibana-app/pull/266)).
    -   Minor typos and refactoring changes to the new directives.
-   Support for Elastic Stack v6.2.2.

### Changed

-   App buttons have been refactored. Unified CSS and HTML for buttons, providing the same structure for them ([#269](https://github.com/wazuh/wazuh-kibana-app/pull/269)).
-   The API list on Settings now shows the latest inserted API at the beginning of the list ([#261](https://github.com/wazuh/wazuh-kibana-app/pull/261)).
-   The check for the currently applied pattern has been improved, providing clever handling of Elasticsearch errors ([#271](https://github.com/wazuh/wazuh-kibana-app/pull/271)).
-   Now on _Settings_, when the Add or Edit API form is active, if you press the other button, it will make the previous one disappear, getting a clearer interface ([#9df1e31](https://github.com/wazuh/wazuh-kibana-app/commit/9df1e317903edf01c81eba068da6d20a8a1ea7c2)).

### Fixed

-   Fixed visualizations directive to properly load the _Manager/Ruleset_ visualizations ([#262](https://github.com/wazuh/wazuh-kibana-app/pull/262)).
-   Fixed a bug where the classic extensions were not affected by the settings of the `config.yml` file ([#266](https://github.com/wazuh/wazuh-kibana-app/pull/266)).
-   Fixed minor CSS bugs from the conversion to directives to some components ([#266](https://github.com/wazuh/wazuh-kibana-app/pull/266)).
-   Fixed bug in the tables directive when accessing a member it doesn't exist ([#266](https://github.com/wazuh/wazuh-kibana-app/pull/266)).
-   Fixed browser console log error when clicking the Wazuh logo on the app ([#6647fbc](https://github.com/wazuh/wazuh-kibana-app/commit/6647fbc051c2bf69df7df6e247b2b2f46963f194)).

### Removed

-   Removed the `kbn-dis` directive from _Manager/Ruleset_ ([#262](https://github.com/wazuh/wazuh-kibana-app/pull/262)).
-   Removed the `filters.js` and `kibana_fields_file.json` files ([#263](https://github.com/wazuh/wazuh-kibana-app/pull/263)).
-   Removed the `implicitFilters` service ([#270](https://github.com/wazuh/wazuh-kibana-app/pull/270)).
-   Removed visualizations loading status trace from controllers and visualization directive ([#270](https://github.com/wazuh/wazuh-kibana-app/pull/270)).

## Wazuh v3.2.0 - Kibana v6.2.1 - Revision 383

### Added

-   Support for Wazuh 3.2.0.
-   Compatibility with Kibana 6.1.0 to Kibana 6.2.1.
-   New tab for vulnerability detector alerts.

### Changed

-   The app now shows the index pattern selector only if the list length is greater than 1.
    -   If it's exactly 1 shows the index pattern without a selector.
-   Now the index pattern selector only shows the compatible ones.
    -   It's no longer possible to select the `wazuh-monitoring` index pattern.
-   Updated Bootstrap to 3.3.7.
-   Improved filter propagation between Discover and the visualizations.
-   Replaced the login route name from /login to /wlogin to avoid conflict with X-Pack own login route.

### Fixed

-   Several CSS bugfixes for better compatibility with Kibana 6.2.1.
-   Some variables changed for adapting new Wazuh API requests.
-   Better error handling for some Elastic-related messages.
-   Fixed browser console error from top-menu directive.
-   Removed undesired md-divider from Manager/Logs.
-   Adjusted the width of a column in Manager/Logs to avoid overflow issues with the text.
-   Fixed a wrong situation with the visualizations when we refresh the Manager/Rules tab.

### Removed

-   Removed the `travis.yml` file.

## Wazuh v3.1.0 - Kibana v6.1.3 - Revision 380

### Added

-   Support for Wazuh 3.1.0.
-   Compatibility with Kibana 6.1.3.
-   New error handler for better app errors reporting.
-   A new extension for Amazon Web Services alerts.
-   A new extension for VirusTotal alerts.
-   New agent configuration tab:
    -   Visualize the current group configuration for the currently selected agent on the app.
    -   Navigate through the different tabs to see which configuration is being used.
    -   Check the synchronization status for the configuration.
    -   View the current group of the agent and click on it to go to the Groups tab.
-   New initial health check for checking some app components.
-   New YAML config file:
    -   Define the initial index pattern.
    -   Define specific checks for the healthcheck.
    -   Define the default extensions when adding new APIs.
-   New index pattern selector dropdown on the top navbar.
    -   The app will reload applying the new index pattern.
-   Added new icons for some sections of the app.

### Changed

-   New visualizations loader, with much better performance.
-   Improved reindex process for the .wazuh index when upgrading from a 2.x-5.x version.
-   Adding 365 days expiring time to the cookies.
-   Change default behaviour for the config file. Now everything is commented with default values.
    -   You need to edit the file, remove the comment mark and apply the desired value.
-   Completely redesigned the manager configuration tab.
-   Completely redesigned the groups tab.
-   App tables have now unified CSS classes.

### Fixed

-   Play real-time button has been fixed.
-   Preventing duplicate APIs from feeding the wazuh-monitoring index.
-   Fixing the check manager connection button.
-   Fixing the extensions settings so they are preserved over time.
-   Much more error handling messages in all the tabs.
-   Fixed OS filters in agents list.
-   Fixed autocomplete lists in the agents, rules and decoders list so they properly scroll.
-   Many styles bugfixes for the different browsers.
-   Reviewed and fixed some visualizations not showing accurate information.

### Removed

-   Removed index pattern configuration from the `package.json` file.
-   Removed unnecessary dependencies from the `package.json` file.

## Wazuh v3.0.0 - Kibana v6.1.0 - Revision 371

### Added

-   You can configure the initial index-pattern used by the plugin in the initialPattern variable of the app's package.json.
-   Auto `.wazuh` reindex from Wazuh 2.x - Kibana 5.x to Wazuh 3.x - Kibana 6.x.
    -   The API credentials will be automatically migrated to the new installation.
-   Dynamically changed the index-pattern used by going to the Settings -> Pattern tab.
    -   Wazuh alerts compatibility auto detection.
-   New loader for visualizations.
-   Better performance: now the tabs use the same Discover tab, only changing the current filters.
-   New Groups tab.
    -   Now you can check your group configuration (search its agents and configuration files).
-   The Logs tab has been improved.
    -   You can sort by field and the view has been improved.
-   Achieved a clearer interface with implicit filters per tab showed as unremovable chips.

### Changed

-   Dynamically creating .kibana index if necessary.
-   Better integration with Kibana Discover.
-   Visualizations loaded at initialization time.
-   New sync system to wait for Elasticsearch JS.
-   Decoupling selected API and pattern from backend and moved to the client side.

## Wazuh v2.1.0 - Kibana v5.6.1 - Revision 345

### Added

-   Loading icon while Wazuh loads the visualizations.
-   Add/Delete/Restart agents.
-   OS agent filter

### Changed

-   Using genericReq when possible.

## Wazuh v2.0.1 - Kibana v5.5.1 - Revision 339

### Changed

-   New index in Elasticsearch to save Wazuh set up configuration
-   Short URL's is now supported
-   A native base path from kibana.yml is now supported

### Fixed

-   Search bar across panels now support parenthesis grouping
-   Several CSS fixes for IE browser
