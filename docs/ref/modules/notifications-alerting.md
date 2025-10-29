# Notifications and Alerting (Health Check)

This page explains how the Health Check service integrates with the Notifications and Alerting Dashboards plugins to help you bootstrap notification channels and sample monitors. It also outlines the steps to finalize the configuration so notifications can be delivered.

Note: Health Check runs tasks that operate using the dashboard internal user. Actions that create saved objects (channels, monitors) occur in the `Global` tenant.

## Requirements

- Notifications Dashboards plugin available to manage channels.
- Alerting Dashboards plugin available to create and manage monitors.
- Health Check enabled and the corresponding checks enabled (see examples below).

If a required plugin is not present, the corresponding task is skipped and a debug message is logged by the server.

## Default notification channels created

When the Notifications Dashboards plugin is available, the Health Check verifies that the default channels exist and creates them if they do not. These channels are created disabled so you can safely configure credentials first:

- Slack Channel: expects a Slack Incoming Webhook URL.
- PagerDuty Channel: sends Events v2 to `https://events.pagerduty.com/v2/enqueue` (set the Integration Key in the `X-Routing-Key` header).
- Jira Channel: creates issues via the REST API (set `Authorization: Basic base64(email:api_token)` and your Jira URL).
- Shuffle Channel: posts to a Shuffle webhook (set the workflow webhook URL).

## Sample Alerting monitors created

When the Alerting Dashboards plugin is available, the Health Check also attempts to create sample monitors that target the default channels above. These monitors are created disabled and use a minimal query-level definition over the Wazuh alerts index pattern (`wazuh-alerts-*`).

- Monitor names created: `Sample: Slack`, `Sample: PagerDuty`, `Sample: Jira`, `Sample: Shuffle`.
- If a corresponding notification channel is not found, the monitor is created without actions so you can add the action later after configuring the channel.
- You can review them under `Explore > Alerting > Monitors`.

## Finalize configuration

Follow these steps to complete the setup and enable notifications:

1. Configure and enable a default Notifications channel

   - Navigate to `Explore > Notifications > Channels` and open one of the created defaults: Slack Channel, PagerDuty Channel, Jira Channel, or Shuffle Channel.
   - Provide credentials/endpoint:
     - Slack: paste your Slack Incoming Webhook URL.
     - PagerDuty: keep the default URL and set your Integration Key in the `X-Routing-Key` header.
     - Jira: set your Jira Cloud/Server REST URL and `Authorization: Basic base64(email:api_token)`.
     - Shuffle: paste your Shuffle workflow Webhook URL.
   - Save and enable the channel.
   - Optional: send a test message from the Notifications UI to validate connectivity.

2. Connect and enable the sample Alerting monitors

   - Go to `Explore > Alerting > Monitors` and open the corresponding `Sample: <Channel>` monitor.
   - If the monitor was created without actions, add a “Send notification” action and select your configured channel. If the action exists, verify it points to the correct channel.
   - Adjust the message template/subject if needed, then enable the monitor.

3. Re-run the health check
   - Open `Dashboard management > Health Check` and run the checks. The related checks should turn green once channels and monitors are enabled and reachable.

## Enable only notifications-related checks

To run only the notifications-related checks via configuration:

```yml
healthcheck.checks_enabled: 'notification-channel'
```
