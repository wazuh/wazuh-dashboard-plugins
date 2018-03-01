# Change Log
All notable changes to the Wazuh app project will be documented in this file.

## Wazuh v3.2.1 - Kibana v6.2.2 - Revision 385
### Added
- Support for **Wazuh v3.2.1**.
- **Brand-new first redesign for the app user interface** ([#278](https://github.com/wazuh/wazuh-kibana-app/pull/278)):
  - This is the **very first iteration** of a *work-in-progress* **UX redesign** for the Wazuh app.
  - The overall interface has been refreshed, **removing some unnecessary colors and shadow effects**.
  - The metric visualizations have been **replaced by an information ribbon** under the filter search bar, reducing the amount of space they occupied.
    - A new service was implemented for a proper handling of the metric visualizations watchers ([#280](https://github.com/wazuh/wazuh-kibana-app/pull/280)).
  - The rest of the app visualizations now have a **new, more detailed card design**.
- New **shards and replicas settings** to the `config.yml` file ([#277](https://github.com/wazuh/wazuh-kibana-app/pull/277)):
  - Now you can apply **custom values** to the shards and replicas for the `.wazuh` and `.wazuh-version` indices.
  - **Warning**: This feature only works before the installation process. If you modify this settings after installing the app, they won't be applied at all.

### Changed
- Now clicking again on the *Groups* tab on *Manager* will properly reload the tab and redirect to the beginning ([#274](https://github.com/wazuh/wazuh-kibana-app/pull/274)).
- Now the visualizations only use the `vis-id` attribute for loading them ([#275](https://github.com/wazuh/wazuh-kibana-app/pull/275)).

### Fixed
- Fixed wrong data flow on *Agents/General* when coming from and going to the *Groups* tab ([#273](https://github.com/wazuh/wazuh-kibana-app/pull/273)).
- Fixed sorting on tables, now they use the sorting functionality provided by the Wazuh API ([#274](https://github.com/wazuh/wazuh-kibana-app/pull/274)).
- Fixed column width issues on some tables ([#274](https://github.com/wazuh/wazuh-kibana-app/pull/274)).
- Fixed bug on the *Agent configuration* JSON viewer who didn't properly show the full group configuration ([#276](https://github.com/wazuh/wazuh-kibana-app/pull/276)).
- Fixed excesive loading time from some Audit visualizations ([#278](https://github.com/wazuh/wazuh-kibana-app/pull/278)).

### Removed
- Deleted the `id` attribute from all the app visualizations ([#275](https://github.com/wazuh/wazuh-kibana-app/pull/275)).

## Wazuh v3.2.0 - Kibana v6.2.2 - Revision 384
### Added
- **New directives** for the Wazuh app: `wz-table`, `wz-table-header` and `wz-search-bar` ([#263](https://github.com/wazuh/wazuh-kibana-app/pull/263)):
  - Maintainable and reusable components for a better structured app.
  - Several files have been changed, renamed and moved to new folders, following *best practices*.
  - The progress bar is now within its proper directive ([#266](https://github.com/wazuh/wazuh-kibana-app/pull/266)).
  - Minor typos and refactoring changes for the new directives.
- Support for **Elastic Stack v6.2.2**.

### Changed
- **App buttons have been refactored**. Unified CSS and HTML for buttons, providing the same structure for them ([#269](https://github.com/wazuh/wazuh-kibana-app/pull/269)).
- The API list on Settings now shows the latest inserted API at the beggining of the list ([#261](https://github.com/wazuh/wazuh-kibana-app/pull/261)).
- The check for the currently applied pattern has been improved, providing clever handling of Elasticsearch errors ([#271](https://github.com/wazuh/wazuh-kibana-app/pull/271)).
- Now on *Settings*, when the Add or Edit API form is active, if you press the other button, it will make the previous one disappear, getting a clearer interface ([#9df1e31](https://github.com/wazuh/wazuh-kibana-app/commit/9df1e317903edf01c81eba068da6d20a8a1ea7c2)).

### Fixed
- Fixed visualizations directive to properly load the *Manager/Ruleset* visualizations ([#262](https://github.com/wazuh/wazuh-kibana-app/pull/262)).
- Fixed a bug where the classic extensions were not affected by the settings of the `config.yml` file ([#266](https://github.com/wazuh/wazuh-kibana-app/pull/266)).
- Fixed minor CSS bugs from the conversion to directives to some components ([#266](https://github.com/wazuh/wazuh-kibana-app/pull/266)).
- Fixed bug on the tables directive when accessing a member it doesn't exists ([#266](https://github.com/wazuh/wazuh-kibana-app/pull/266)).
- Fixed browser console log error when clicking the Wazuh logo on the app ([#6647fbc](https://github.com/wazuh/wazuh-kibana-app/commit/6647fbc051c2bf69df7df6e247b2b2f46963f194)).

### Removed
- Removed the `kbn-dis` directive from *Manager/Ruleset* ([#262](https://github.com/wazuh/wazuh-kibana-app/pull/262)).
- Removed the `filters.js` and `kibana_fields_file.json` files ([#263](https://github.com/wazuh/wazuh-kibana-app/pull/263)).
- Removed the `implicitFilters` service ([#270](https://github.com/wazuh/wazuh-kibana-app/pull/270)).
- Removed visualizations loading status trace from controllers and visualization directive ([#270](https://github.com/wazuh/wazuh-kibana-app/pull/270)).

## [v3.2.0]
### Added
- Support for **Wazuh 3.2.0**.
- Compatibility with **Kibana 6.1.0** to **Kibana 6.2.1**.
- New tab for **vulnerability detector** alerts.

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
