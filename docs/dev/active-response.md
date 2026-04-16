# Active responses

Active responses are a powerful feature of Wazuh that allow you to automate actions in response to specific events or conditions. They can be used to enhance security, improve incident response, and streamline operations.

## Repositories

- wazuh-dashboard-notifications: This plugin adds the **Active Responses** app into the **Explore** section of the Wazuh dashboard that allows users to manage the active responses.
- wazuh-dashboard-alerting: This plugin adds the ability to configure active response channels in alerting triggers when the monitor is a **Per document monitor**.
- wazuh-dashboard-plugins: This plugin adds the healtcheck task to create the index pattern related to active responses: `wazuh-active-responses*`.

### wazuh-dashboard-notifications

#### Add Active Responses app

Add the **Active Responses** (id: `active-responses` => `app/active-responses`) app into the **Explore** section of the Wazuh dashboard.

This allows users to manage the active responses, including creating, editing, and deleting active response configurations in a similar way to the existing notification channels.

The application definition is located in `public/active-responses/application.tsx`.

#### Exclude managed categories from Notifications

As the active responses and the usual notifications are notifications in the backend side, we used the notification channel categories to exclude the usual notifications from the managed categories, such as the active responses, in the notifications management UI.

The **Notification** app is adapted to exclude the managed categories, such as the **active-responses** category, this avoids they are listed in this app, so they can be managed in the related **Active Responses** app avoiding confusion for users.

See [Channel categories](#channel-categories) for more information about the concept of managed categories and how they are used to separate "other" notification channels from the usual notification channels.

#### Add the active responses as a new notification channel

##### Channel configuration

The active response channel configuration is similar to the existing notification channels, with some additional fields specific to active responses. The configuration is as follows:

```
{
  type: 'active_response';
  name: string;
  description: string;
  active_response?: {
    executable: string;
    extra_args: string;
    type: 'stateful' | 'stateless';
    stateful_timeout?: number; // only for stateful active response
    location: 'all' | 'defined-agent' | 'local';
    agent_id?: string; // only required when location is defined-agent
  }
}
```

The configuration of active response channels are stored in the same index as the notification channels (`.opensearch-notifications-config`) with a different `type` field (`active_response`) and the specific fields for active responses.

#### Notification channel categories

The notifications channels are split into categories:

- **notifications**: channels that send notifications to external services, such as email or Slack. They are the existing channels coming from OpenSearch Dashboards. They can be managed through the existing **Notification** app in the Wazuh dashboard.
- **active-responses**: channels that trigger active responses in Wazuh. They are a new channel type added by Wazuh and they are managed through the new **Active Responses** app in the Wazuh dashboard.

The concept of managed categories was added to separate the usual notifications channels from other that require a special behavior, such as the active responses. This allows us to manage the active responses in a separate app and avoid confusion for users when managing the notification channels.

Additional categories can be added in the future for other types of channels that require a dedicated app to be managed.

#### UI

The UI for managing active responses is similar to the existing **Notifications** app coming from OpenSearch Dashboards, with some additional adaptations. This was developed duplicating the existing components for notifications and adapting them for active responses.

The source code is located in:

- `public/pages/ActiveResponses`
- `public/pages/CreateChannelActiveResponse`
- `public/pages/MainActiveResponses`
- other files common in the repository.

This allows users to create, edit, delete, mute and unmute the active responses in a user-friendly way, similar to the existing **Notifications** app.

In the creation/edition form, some fields are shown or hidden depending on the configuration of the active response, such as the `stateful_timeout` field that is only shown when the active response is of type `stateful` or the `agent_id` field that is only shown when the location is `defined-agent`.

### wazuh-dashboard-alerting

#### Add active responses as a new action type in alerting triggers

The active responses can be added when using the **Per documento monitor** in the alerting configuration. In the triggers configuration, a new button **Add active response** allows users to select an active response channel.

The existing button was changed to **Add notification** to differentiate it from the new button for active responses. This allows users to add existing notifications channels. This uses the same concept to managed/unmanaged notification channels to separate the management.

#### UI

This was developed duplicating the existing components for notifications and adapting them for active responses.

In the active response action for the trigger of an alerting monitor, the user can select an active response channel from the existing ones, and select one of the existent active responses channels. Other fields that are configurable in the notification case, are hidden and defined with the values that allows to work the active response:

- `message_template.source`: `{{ctx.alerts.0.related_doc_ids}}` to send the related document id and index name. This is used by the Wazuh indexer alerting plugin to known the document that triggered the alert and get the necessary information to execute the active response. This has the format `document_id|index_name`, so the indexer can extract the document ID and index name to get the document that triggered the alert.
- `subject_template.source`: `Alerting Active Response action` as subject. This is not used but defined.
- `action_execution_policy.per_alert.actionable_alerts`: `[]` generate an active response by alert. This is used to generate an active response for each alert that is generated by the monitor, so the active response can be executed with the information of the alert (document) that triggered it.

## Active response execution flow

1. Create an active response channel in the **Active Responses** app with the desired configuration.
2. Create an alerting monitor with the **Per document monitor** type and add a trigger with an active response action that uses the created active response channel.
3. Run the active response "notification" in the Wazuh indexer side:
   3.1. Extract the document ID and index name from the received message: `document_id|index_name`.
   3.2. Get the document that triggered the alert using the extracted document ID and index name.
   3.3. Create a JSON with:

```ts
{
  "@timestamp": string; // timestamp when the active response "notification" is generated
  "event": {
    "doc_id": string; // the document ID that triggered the alert
    "index": string; // the index name of the document that triggered the alert
  },
  "wazuh": {
    "active_response": {
      "name": string; // the name of the active response channel that triggered the active response
      "type": 'active-response' // the type of the notification channel, used to differentiate the active responses from the usual notifications channels
      "executable": string; // the executable to run for the active response
      "extra_arguments": string | null; // the extra arguments to run for the active response
      "type": 'stateful' | 'stateless'; // the type of the active response
      "stateful_timeout": number; // only for stateful active response, the timeout for the active response
      "location": 'all' | 'defined-agent' | 'local'; // the location where the active response should be executed
      "agent_id": string | null; // only required when location is defined-agent, the agent ID where the active response should be executed
    }
    /* other wazuh allowed fields of the document, see notifications/notifications/src/main/kotlin/org/opensearch/notifications/send/SendMessageActionHelper.kt of wazuh-indexer-notifications plugin
    */
  }
}
```

3.4. Index as a new document in the `wazuh-active-responses` index.

4. The Wazuh manager runs scheduled monitor of the `wazuh-active-responses` index, when a new document is indexed, the manager sends a message to the destination that runs the active response depending on the configuration of the active response channel.

### wazuh-dashboard-plugins

#### Add healthcheck task to create the index pattern for active responses

The `wazuh-dashboard-plugins` plugin adds a healthcheck task that runs when the Wazuh dashboard starts to create the index pattern for active responses (`wazuh-active-responses*`) if it doesn't exist. This ensures that the index pattern is always available for users to use in the Wazuh dashboard.
