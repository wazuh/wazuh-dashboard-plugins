# Wazuh Check Updates Plugin

The **Wazuh Check Updates Plugin** is a extension for Wazuh that allows you to seamlessly query an external service to retrieve information about the latest available updates and their corresponding features. This dedicated plugin has been designed to work in conjunction with the primary Wazuh plugin, enhancing its capabilities to notify users whenever new updates become accessible. With a focus on modularity, the Check Updates Plugin provides various components to manage updates and notification preferences.

## Features

### 1. Notification of New Updates

The core functionality of the plugin is to notify users about the availability of new updates. It continuously queries an external service to check for updates and sends notifications to users when new updates are detected.

### 2. Deployment Status

Stay informed about the deployment status of updates. The plugin offers a component that allows you to easily view the status of updates.

### 3. Update Details

Get detailed information about the latest update, including links to release notes and updagrade guide, as well as the update description.

## Software and libraries used

- [OpenSearch](https://opensearch.org/)
- [Elastic UI Framework](https://eui.elastic.co/)
- [Node.js](https://nodejs.org)
- [React](https://reactjs.org)
