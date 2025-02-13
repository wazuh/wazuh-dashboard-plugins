# ApplicationService

Below is a simple explanation of each relevant method in the `ApplicationService` class, and how they’re used in the sample plugin.

---

## Methods

### `modifyAppGroupMount(app: App)`

It prepares and registers the mounting process for an application group, ensuring that navigation links become visible and a startup event is triggered when the group mounts.

---

### `modifySubAppMount(app: App)`

It adjusts the lifecycle of sub-applications so that their navigation links are properly shown when the app is mounted and hidden when unmounted.

---

### `onAppStartup(core: CoreStart)`

This method is typically called during the plugin’s `start` phase to ensure that, when an application or group starts, the UI reflects the correct navigation state and the user is redirected accordingly.

---

### `registerSearchCommand({ id, navGroups }: SetupParams)`

This command integrates global search functionality so that users can search within the pages provided by the registered app groups.

---

### `setup({ id, navGroups }: SetupParams)`

This method is invoked by the plugin’s setup routine (as seen in the sample `AnalysisPlugin`), initializing the navigation groups, their associated applications, and the search command.

---

## How It’s Used in a Plugin

The sample `AnalysisPlugin` demonstrates how `ApplicationService` integrates into the plugin lifecycle:

- **In the `setup` method:**

  - The plugin defines an array of navigation groups (e.g., `EndpointSecurityNavGroup`, `ThreatIntelligenceNavGroup`, etc.).
  - Each navigation group must be implemented as an object that implements the `Group` interface. [See the `Group` interface for more details.](types.ts)
  - It calls `plugins.wazuhCore.applicationService.setup({ ... })` to register all navigation groups and their sub-applications with the core system.

- **In the `onAppStartup` method:**
  - The plugin calls `plugins.wazuhCore.applicationService.onAppStartup(core)` to subscribe to startup events. This ensures that when an app group is started, the UI will update the active navigation group and automatically navigate to the first available app in that group.

---

The `ApplicationService` class centralizes the registration and lifecycle management of navigation groups and their associated applications. It provides mechanisms to:

- **Modify Mount/Unmount Behavior:**
  By injecting `beforeMount` and `cleanup` operations into the app’s lifecycle, it ensures the UI is updated correctly when apps are mounted or unmounted.

- **Register Navigation Groups and Apps:**
  It organizes both app groups and sub-applications, ensuring they are properly integrated into the Chrome navigation and application registry.

- **Handle Navigation Startup:**
  It listens for startup events and automatically navigates the user to the first available application in the active navigation group.

- **Integrate Global Search:**
  It registers a search command that allows users to search within the pages of the registered app groups.
