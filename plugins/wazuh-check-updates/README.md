# Wazuh Check Updates Plugin

**Wazuh Check Updates Plugin** is an extension for Wazuh that allows users to stay informed about new updates available. This plugin has been designed to work in conjunction with the main Wazuh plugin and has the following features.

## Features

### 1. Notification of New Updates

The main functionality of the plugin is to notify users about the availability of new updates. For this purpose, it exposes a component that is displayed in a bottom bar. In addition to notifying the user about new updates, it provides a link to redirect to the API Configuration page and gives the user the option to opt out of receiving further notifications of this kind.

Every time a page is loaded, the UpdatesNotification component is rendered. The component is responsible for querying the following:

1.  **User Preferences:** It retrieves information from the saved object containing user preferences to determine if the user has chosen to display more notifications about new updates and to obtain the latest updates that the user dismissed in a notification.

2.  **Available Updates:** It retrieves the available updates for each available API. To determine where to retrieve the information, it first checks the session storage for the key `checkUpdates`. If the value is `executed`, it then searches for available updates in a saved object; otherwise, it queries the Wazuh API and makes a request for each available API, finally saving the information in the saved object and setting the session storage `checkUpdates` to `executed`.
    The endpoint has two parameters:
    `query_api`: Determines whether the Check Updates plugin retrieves data from the Wazuh API or from a saved object.
    `force_query`: When `query_api` is set to true, it determines whether the Wazuh API internally obtains the data or fetches it from the CTI Service.

If the user had not chosen not to receive notifications of new updates and if the new updates are different from the last ones dismissed, then the component renders a bottom bar to notify that there are new updates.

### 2. Get available updates function

The plugin provides a function for fetching the available updates for each API. This function is utilized by the main plugin on the API Configuration page. This page presents a table listing the APIs, along with their respective versions and update statuses, both of which are obtained through the mentioned function.

### 3. CTI registration

The plugin registers the environment with Wazuh Cyber Threat Intelligence (CTI) through the OAuth
2.0 device authorization grant, then hands the resulting subscription to the content manager of
the Wazuh indexer (`/_plugins/_content_manager/subscription`). The registration UI is enabled by
`wazuh_check_updates.ctiRegistrationUiEnabled` and has two entry points:

- The registration modal (`ModalCti`), opened from the CTI feed app. `useCtiRegistrationModal`
  holds its open state and cancels a pending activation when the modal closes.
- The `CtiUpsellNotification` bottom bar, exposed in the start contract and rendered by the main
  plugin while the environment is not registered. Its **Register now** button opens the CTI feed
  app with the registration modal already open (location state `openRegistration`). The bar can be
  turned off with `wazuh_check_updates.ctiUpsellEnabled`.

The routes of the registration flow live under `/api/wazuh-check-updates/cti-registration/`.

### 4. CTI feed app

The plugin registers the **CTI feed** app (`cti-feed`) in the **Threat intelligence** category,
in both the classic navigation (`wz-category-threat-intelligence`) and the new navigation
(`wazuh-threat-intelligence`). The category ids are duplicated in `common/cti-feed.ts` and must
match the main plugin's own, which is what places the app next to the main plugin's Threat
intelligence apps. The app is registered only when `ctiRegistrationUiEnabled` is `true`.

The app has three panels and one action:

- **Subscription**: the registration state, the plan name, and the registration modal.
- **Feed sync**: the sync state of each feed, read from the `.wazuh-cti-consumers` index
  (`GET /api/wazuh-check-updates/cti-registration/consumers`). The state rules live in
  `public/services/cti-consumer-sync-state.ts` and are shared with the consumers accordion of the
  registration modal. The panel polls while a feed is syncing and for a minute after an update
  request.
- **Feed content**: counts of the content the feed delivered. Rules, decoders, integrations and
  KVDBs come from the Security Analytics `_search` routes, limited to the `standard` space. IOCs
  and CVEs come from `GET /api/wazuh-check-updates/cti-feed/indicators`, which counts
  `wazuh-threatintel-enrichments*` and the `CVE` documents of `.wazuh-threatintel-vulnerabilities*`
  as the current user.
- **Update CTI content**: `POST /api/wazuh-check-updates/cti-feed/update` forwards the request to
  `POST /_plugins/_content_manager/update` as the current user, so that user's indexer privileges
  decide whether it is allowed.

## Use cases

### User logs in

1.  The user logs in.
2.  The main Wazuh plugin is loaded and renders the UpdatesNotification component from the Check Updates plugin.
3.  The `UpdatesNotification` component checks the user's preferences (stored in a saved object) to determine if the user has dismissed notifications about new updates. If the user has dismissed them, the component returns nothing; otherwise, it proceeds to the next steps.
4.  The UpdatesNotification component checks the `checkUpdates` value in the browser's session storage to determine if a query about available updates from the Wazuh Server API has already been executed. Since the user has just logged in, this value will not exist in the session storage.
5.  The component makes a request to the Check Updates plugin API with the `query_api` parameter set to true and `force_query` set to false. The `checkUpdates` value in the session storage is updated to `true`.
6.  The updates are stored in a saved object for future reference.
7.  It's possible that the user has dismissed specific updates. In such cases, the dismissed updates are compared with the updates retrieved from the API. If they match, the component returns nothing; otherwise, it proceeds to the next steps.
8.  The component displays a bottom bar to notify the user of the availability of new updates.
9.  The user can access the details of the updates by clicking a link in the bottom bar, which takes them to the API Configuration page.
10. The user can also dismiss the updates and choose whether they no longer wish to receive this type of notification.

### User goes to API Configuration page

1. The user goes to the API Configuration page.
2. The APIs table is rendered, which retrieves the available updates stored in the saved object. The table includes, among other things, the `Version` and `Updates status` columns:

- **Version column:** Indicates the current version of the server. If the endpoint's response to query available updates returns an error, the version is not displayed.
- **Updates status column:** Indicates the server's status regarding available updates, which can be in one of four states:
  - **Up to date:** The server is up to date with the latest available version.
  - **Available updates:** There are updates available. In this case, you can view the details of the available updates by clicking an icon, and a Flyout will open with the details.
  - **Checking updates disabled:** The server has the service for checking updates disabled.
  - **Error checking updates:** An error occurred when trying to query the Wazuh Server API. In this case, a tooltip will display the error message.

3. The user has the option to force a direct request for available updates to the Wazuh Server API instead of querying them in the saved object. To do this, they can click the "Check updates" button. If there are any changes when retrieving the information, the results will be reflected in the table.
4. The user can also modify their preferences (stored in a saved object) regarding whether they want to continue receiving notifications about new updates.

## Data Storage

The data managed by the plugin is stored and queried in saved objects. There are two types of saved objects.

### 1. Available Updates

The saved object of type "wazuh-check-updates-available-updates" stores the available updates for each API and the last date when a request was made to the Wazuh API to fetch the data. There is a single object of this type for the entire application, shared among all users.

Because this record is global and shared, the version check that populates it runs with the **dashboard internal user** (`asInternalUser`), not the requesting user. This keeps the result independent of each caller's cluster permissions: any authenticated user can trigger the check without failing it, overwriting the shared record with an error, or exposing their identity through a stored error message. See [Indexer permission requirement](#indexer-permission-requirement).

### 2. User Preferences

The saved objects of type "wazuh-check-updates-user-preferences" store user preferences related to available updates. These objects store whether the user prefers not to receive notifications for new updates and the latest updates that the user dismissed when closing the notification. There can be one object of this type for each user.

## Indexer permission requirement

The available-updates check queries the Wazuh indexer content-manager endpoint
`GET /_plugins/_content_manager/version/check`. This request is issued with the
dashboard **internal user** (the user configured as `opensearch.username` in
`opensearch_dashboards.yml`, `kibanaserver` by default) via `asInternalUser`, so
the write to the shared saved object never depends on the permissions of the user
whose session triggered it.

For the check to succeed, that internal user must be allowed to run the cluster
action:

```
cluster:monitor/content_manager/version/check
```

In the packaged Wazuh indexer configuration, `kibanaserver` holds this action
through the built-in `kibana_server` role, whose `cluster_monitor` action group
covers `cluster:monitor/*`. If the internal user lacks this permission, the
endpoint responds with `403` and the available-updates status is reported as an
error.

A failed check is returned only to the caller that triggered it and is not
persisted, so the saved object keeps the last _successful_ result and its
`last_check_date_dashboard`.

> **Note for non-default deployments:** if you change the dashboard internal user,
> use a custom indexer security configuration, or remove the `kibana_server` role
> mapping, make sure a role mapped to that user grants
> `cluster:monitor/content_manager/version/check` (directly or through the
> `plugin:content_manager/version/check` action group).

## Software and libraries used

- [OpenSearch](https://opensearch.org/)

- [Elastic UI Framework](https://eui.elastic.co/)

- [Node.js](https://nodejs.org)

- [React](https://reactjs.org)
