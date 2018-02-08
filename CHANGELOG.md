# Change Log
All notable changes to the Wazuh App project will be documented in this file.

## [v3.2.0]
### Added
- Support for **Wazuh 3.2.0**.
- Compatibility with **Kibana 6.2.0**.
- New tab for **vulnerability detector** alerts.

### Changed
- Updated Bootstrap to 3.3.7.

### Fixed
- Several CSS bugfixes for better compatibility with Kibana 6.2.0.
- Some variables changed for adapting new Wazuh API requests.

## [v3.1.0]
### Added
- Support for **Wazuh 3.1.0**.
- Compatibility with **Kibana 6.1.3**.
- New error handler for better app errors reporting.
- New extension for **Amazon Web Services** alerts.
- New extension for **VirusTotal** alerts.
- New **agent configuration** tab:
  - Visualize the current group configuration for the currently selected agent on the App.
  - Navigate through the different tabs to see which configuration is being used.
  - Check the synchronization status for the configuration.
  - View the current group of the agent and click on it to go to the Groups tab.
- New **initial healthcheck** for cheking some app components.
- New **YAML config file**:
  - Define the initial index pattern.
  - Define specific checks for the healthcheck.
  - Define the default extensions when adding new APIs.
- New **index pattern selector dropdown** on the top navbar.
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
- Play realtime button has been fixed.
- Preventing duplicate APIs from feeding the wazuh-monitoring index.
- Fixing the check manager connection button.
- Fixing the extensions settings so they are preserved over time.
- Many more error handling messages in all the tabs.
- Fixed OS filters in agents list.
- Fixed autocomplete lists in the agents, rules and decoders list so they properly scroll.
- Many style fixes for the different browsers.
- Reviewed and fixed some visualizations not showing accurate information.

### Removed
- Removed index pattern configuration from the `package.json` file.
- Removed unnecessary dependencies from the `package.json` file.

## [v3.0.0]
### Added
- You can **configure the initial index-pattern** used by the plugin in the initialPattern variable of the app's package.json.
- Auto `.wazuh` reindex from Wazuh 2.x - Kibana 5.x to Wazuh 3.x - Kibana 6.x.
  - The API credentials will be automatically migrated to the new installation.
- Dynamically changed the index-pattern used by going to the **Settings -> Pattern** tab.
  - Wazuh alerts compatibility auto detection.
- New loader for visualizations.
- Better performance: now the tabs use the same Discover tab, only changing the current filters.
- New **Groups** tab.
  - Now you can check your groups configuration (search its agents and configuration files).
- The **Logs** tab has been improved.
  - You can sort by field and the view has been improved.
- Achieved a clearer interface with implicit filters per tab showed as unremovable chips.

### Changed
- Dynamically creating .kibana index if necessary.
- Better integration with Kibana Discover.
- Visualizations loaded at initialization time.
- New sync system to wait for Elasticsearch JS.
- Decoupling selected API and pattern from backend and moved to client side.

## [v2.1.0]

## Added
- Loading icon while Wazuh loads the visualizations.
- Add/Delete/Restart agents.
- OS agent filter

### Changed
- Using genericReq when possible.

## [v2.0.1]

### Changed
- New index in Elasticsearch to save Wazuh set up configuration
- Short URL's is now supported
- Native base path from kibana.yml is now supported

### Fixed
- Searchbar across panels now support parenthesis groupping
- Several CSS fixes for IE browser
