# Wazuh Check Updates Plugin

**Wazuh Check Updates Plugin** is an extension for Wazuh that allows users to stay informed about new updates available. This plugin has been designed to work in conjunction with the main Wazuh plugin and has the following features.

## Features

### 1. Notification of New Updates

The main functionality of the plugin is to notify users about the availability of new updates. For this purpose, it exposes a component that is displayed in a bottom bar. In addition to notifying the user about new updates, it provides a link to redirect to the API Configuration page and gives the user the option to opt out of receiving further notifications of this kind.

Every time a page is loaded, the UpdatesNotification component is rendered. The component is responsible for querying the following:

1.  **User Preferences:** It retrieves information from the saved object containing user preferences to determine if the user has chosen to display more notifications about new updates and to obtain the latest updates that the user dismissed in a notification.

2.  **Available Updates:** It retrieves the available updates for each available API. To determine where to retrieve the information, it first checks the session storage for the key `checkUpdates`. If the value is `executed`, it then searches for available updates in a saved object; otherwise, it queries the Wazuh API and makes a request for each available API, finally saving the information in the saved object and setting the session storage `checkUpdates` to `executed`.

If the user had not chosen not to receive notifications of new updates and if the new updates are different from the last ones dismissed, then the component renders a bottom bar to notify that there are new updates.

### 2. Get available updates function

The plugin provides a function for fetching the available updates for each API. This function is utilized by the main plugin on the API Configuration page. This page presents a table listing the APIs, along with their respective versions and update statuses, both of which are obtained through the mentioned function.

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
