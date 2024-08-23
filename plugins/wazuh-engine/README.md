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

### 2. User Preferences

The saved objects of type "wazuh-check-updates-user-preferences" store user preferences related to available updates. These objects store whether the user prefers not to receive notifications for new updates and the latest updates that the user dismissed when closing the notification. There can be one object of this type for each user.

## Software and libraries used

- [OpenSearch](https://opensearch.org/)

- [Elastic UI Framework](https://eui.elastic.co/)

- [Node.js](https://nodejs.org)

- [React](https://reactjs.org)
