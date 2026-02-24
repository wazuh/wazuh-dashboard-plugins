# External integrations

This guide covers how to integrate external APIs and services with the Wazuh dashboard for enhanced alerting, incident management, and threat intelligence capabilities.

## Overview

The Wazuh dashboard supports integration with:

- **Slack** - Team communication and notifications
- **PagerDuty** - Incident management and on-call alerting
- **Shuffle** - Security orchestration and workflow automation
- **Maltiverse** - Threat intelligence and IoC enrichment

Notification integrations (Slack, PagerDuty, Shuffle) use OpenSearch Dashboards Notifications and Alerting plugins, while Maltiverse is configured at the Wazuh manager level.

---

## Slack integration

Slack integration enables real-time security alerts and notifications to be sent to Slack channels.

### Prerequisites

- Slack workspace with admin permissions
- Wazuh dashboard with Notifications plugin enabled

### Step 1: Create a Slack incoming webhook

1. Go to https://api.slack.com/apps
2. Click **Create New App** > **From scratch**
3. Enter app name (e.g., "Wazuh Alerts") and select your workspace
4. In the app settings, go to **Incoming Webhooks** and activate it
5. Click **Add New Webhook to Workspace**
6. Select the target channel for alerts (e.g., `#security-alerts`)
7. Copy the webhook URL (format: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`)

### Step 2: Configure Slack in Wazuh dashboard

1. Open the Wazuh dashboard and navigate to **☰ Menu > Explore > Notifications > Channels**
2. Click **Create channel**
3. Configure the channel:
   - **Name**: `Slack Security Alerts`
   - **Type**: Select **Slack**
   - **Webhook URL**: Paste the webhook URL from Step 1
   - **Description**: (optional) `Security alerts to #security-alerts channel`
4. Click **Create**
5. Toggle the channel to **Unmuted** and **Enabled**

### Step 3: Create a monitor for Slack alerts

1. Navigate to **☰ Menu > Explore > Alerting > Monitors**
2. Click **Create monitor**
3. Configure the monitor:
   - **Monitor name**: `High Priority Security Events`
   - **Data source**: Select your Wazuh indices pattern
   - **Query**: Define conditions (e.g., `rule.level >= 12` for high-severity alerts)
   - **Trigger conditions**: Set thresholds for alerting
4. In the **Notifications** section:
   - Select your Slack channel
   - Customize the message template with alert details
5. Click **Create**

### Step 4: Test the integration

1. In the Channels list, select your Slack channel
2. Click **Send test message**
3. Verify the test message appears in your Slack channel
4. Generate a test alert that matches your monitor conditions
5. Confirm the alert is delivered to Slack

### Slack message customization

Customize alert messages with Mustache templates:

```
🚨 *Wazuh Security Alert*
*Severity*: {{ctx.trigger.severity}}
*Rule ID*: {{ctx.trigger.rule_id}}
*Description*: {{ctx.trigger.rule_description}}
*Agent*: {{ctx.trigger.agent_name}}
*Time*: {{ctx.trigger.timestamp}}
```

### Troubleshooting

- **Messages not appearing**: Verify webhook URL is correct and the app has permissions
- **Channel muted**: Ensure the channel is set to Unmuted and Enabled
- **Monitor not triggering**: Check monitor query syntax and data source availability

---

## PagerDuty integration

PagerDuty integration enables automatic incident creation and on-call alerting for critical security events.

### Prerequisites

- PagerDuty account with service configuration access
- Wazuh dashboard with Notifications plugin enabled

### Step 1: Create a PagerDuty integration

1. Log in to https://app.pagerduty.com
2. Navigate to **Services > Service Directory**
3. Select an existing service or click **+ New Service**
4. For a new service:
   - **Name**: `Wazuh Security Monitoring`
   - **Escalation Policy**: Select or create an escalation policy
   - **Integration Type**: Select **Events API v2**
5. Click **Add Service** or **Add Integration**
6. Copy the **Integration Key** (32-character string)

### Step 2: Configure PagerDuty in Wazuh dashboard

1. Navigate to **☰ Menu > Explore > Notifications > Channels**
2. Click **Create channel**
3. Configure the channel:
   - **Name**: `PagerDuty Critical Incidents`
   - **Type**: Select **PagerDuty**
   - **Integration Key**: Paste the integration key from Step 1
   - **Description**: (optional) `Critical security incidents to on-call team`
4. Click **Create**
5. Toggle the channel to **Unmuted** and **Enabled**

### Step 3: Create monitors for incident creation

1. Navigate to **☰ Menu > Explore > Alerting > Monitors**
2. Click **Create monitor**
3. Configure for critical events:
   - **Monitor name**: `Critical Security Incidents`
   - **Query**: `rule.level >= 14 OR rule.groups: "authentication_failed" OR rule.groups: "exploit_attempt"`
   - **Trigger conditions**: Immediate alerting for matches
4. In **Notifications**:
   - Select your PagerDuty channel
   - Set **Severity**: High or Critical
5. Click **Create**

### Step 4: Test incident creation

1. In the Channels list, select your PagerDuty channel
2. Click **Send test message**
3. Log in to PagerDuty and verify a test incident was created
4. Acknowledge and resolve the test incident

### PagerDuty incident details

Customize incident payload with contextual information:

- **Summary**: Alert title with key identifiers
- **Severity**: Map Wazuh rule levels to PagerDuty severities
- **Custom Details**: Include agent info, rule ID, full description
- **Deduplication Key**: Prevent duplicate incidents for the same event

### Troubleshooting

- **Incidents not created**: Verify integration key is correct and service is active
- **Duplicate incidents**: Configure deduplication keys properly
- **Wrong escalation policy**: Update service settings in PagerDuty

---

## Shuffle integration

Shuffle is a security orchestration platform that automates response workflows for security events.

### Prerequisites

- Shuffle account (cloud or self-hosted)
- Wazuh dashboard with Notifications plugin enabled

### Step 1: Create a Shuffle webhook

1. Log in to https://shuffler.io (or your self-hosted instance)
2. Navigate to **Workflows**
3. Create a new workflow or select an existing one
4. Add a **Webhook** trigger node:
   - Click **+ Add Node** > **Trigger** > **Webhook**
   - Name: `Wazuh Security Events`
5. Copy the webhook URL (format: `https://shuffler.io/api/v1/hooks/webhook_<id>`)
6. Configure workflow actions (e.g., enrich data, send to SIEM, create tickets)

### Step 2: Configure Shuffle in Wazuh dashboard

1. Navigate to **☰ Menu > Explore > Notifications > Channels**
2. Click **Create channel**
3. Configure the channel:
   - **Name**: `Shuffle Automation Workflow`
   - **Type**: Select **Webhook** (custom webhook URL)
   - **Webhook URL**: Paste the Shuffle webhook URL
   - **Method**: POST
   - **Headers**: (optional) Add authentication headers if required
   - **Description**: (optional) `Automated response workflows`
4. Click **Create**
5. Toggle the channel to **Unmuted** and **Enabled**

### Step 3: Create monitors for automated responses

1. Navigate to **☰ Menu > Explore > Alerting > Monitors**
2. Click **Create monitor**
3. Configure for events requiring automation:
   - **Monitor name**: `Malware Detection Workflow`
   - **Query**: `rule.groups: "malware" OR rule.groups: "rootcheck"`
   - **Trigger conditions**: Match any event
4. In **Notifications**:
   - Select your Shuffle channel
   - Include relevant event data in payload
5. Click **Create**

### Step 4: Test the integration

1. In the Channels list, select your Shuffle channel
2. Click **Send test message**
3. In Shuffle, check the workflow execution history
4. Verify the webhook received the payload
5. Validate workflow actions executed correctly

### Shuffle workflow examples

Common security automation workflows:

- **Malware response**: Isolate endpoint, collect forensics, notify SOC
- **Brute force detection**: Block IP, update firewall rules, alert admin
- **Vulnerability detection**: Create ticket, assign to patching team, track remediation
- **Compliance alerts**: Log to GRC system, notify compliance officer

### Troubleshooting

- **Workflow not triggering**: Verify webhook URL is correct and workflow is active
- **Payload format errors**: Check Shuffle expected schema matches notification payload
- **Authentication failures**: Ensure webhook headers include required authentication

---

## Maltiverse integration

Maltiverse provides threat intelligence and Indicator of Compromise (IoC) enrichment for security events.

### Prerequisites

- Maltiverse account with API access
- Wazuh manager with ossec.conf configuration access
- Root or sudo privileges on Wazuh manager host

### Step 1: Create Maltiverse API key

1. Register or log in to https://maltiverse.com/
2. Navigate to **Settings > API Keys** or **Account > API Access**
3. Click **Create API Key** or **Generate Key**
4. Enter a name (e.g., "Wazuh Integration")
5. Copy the API key (format: `mt-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
6. Set appropriate rate limits and permissions

### Step 2: Configure Maltiverse in Wazuh manager

1. SSH to the Wazuh manager server

2. Edit the Wazuh manager configuration:

   ```bash
   sudo nano /var/ossec/etc/ossec.conf
   ```

3. Add the Maltiverse integration block inside `<ossec_config>`:

   ```xml
   <integration>
     <name>maltiverse</name>
     <api_key>mt-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</api_key>
     <hook_url>https://api.maltiverse.com/v2</hook_url>
     <level>3</level>
     <alert_format>json</alert_format>
     <options>
       <file_sha1>yes</file_sha1>
       <file_md5>yes</file_md5>
       <ip_address>yes</ip_address>
       <hostname>yes</hostname>
       <url>yes</url>
     </options>
   </integration>
   ```

4. Configuration parameters:

   - **api_key**: Your Maltiverse API key
   - **level**: Minimum alert level to trigger enrichment (default: 3)
   - **options**: IoC types to enrich (file hashes, IPs, domains, URLs)

5. Save the file and exit

### Step 3: Restart Wazuh manager

1. Restart the Wazuh manager service:

   **Systemd:**

   ```bash
   sudo systemctl restart wazuh-manager
   ```

   **SysV init:**

   ```bash
   sudo service wazuh-manager restart
   ```

2. Verify the service started successfully:

   ```bash
   sudo systemctl status wazuh-manager
   ```

3. Check logs for integration initialization:

   ```bash
   sudo tail -f /var/ossec/logs/ossec.log | grep -i maltiverse
   ```

   Look for:

   ```
   INFO: Integration 'maltiverse' enabled
   ```

### Step 4: Validate enriched alerts in dashboard

1. Open the Wazuh dashboard
2. Navigate to **Threat Hunting > Events** or **Security Events**
3. Look for alerts with IoCs (file hashes, IP addresses, domains)
4. Click on an enriched alert to view details
5. Verify Maltiverse enrichment data appears:
   - **Threat classification**: malware, phishing, C2
   - **Blacklist status**: Listed in threat feeds
   - **Historical data**: First seen, last seen dates
   - **Related campaigns**: Associated threat actors or campaigns

### Step 5: Create custom dashboards for threat intel

1. Navigate to **☰ Menu > Dashboard Management > Dashboards**
2. Create visualizations for:
   - Top malicious IPs by country
   - File hash reputation distribution
   - Threat intel alerts over time
   - Malware families detected
3. Add filters for `integration: maltiverse` to show enriched data

### Maltiverse enrichment examples

Example alert with Maltiverse enrichment:

```json
{
  "rule": {
    "level": 12,
    "description": "Malicious file hash detected"
  },
  "data": {
    "file_sha1": "a1b2c3d4e5f6...",
    "maltiverse": {
      "classification": "malware",
      "type": "trojan",
      "blacklist": ["blocklist.de", "abuse.ch"],
      "score": 95,
      "first_seen": "2025-01-15T10:30:00Z"
    }
  }
}
```

### Troubleshooting

- **No enrichment data**: Verify API key is valid and has not expired
- **Rate limit errors**: Check Maltiverse account limits and adjust alert levels
- **Integration not loading**: Check ossec.log for configuration errors
- **Invalid IoCs**: Ensure alert data contains properly formatted file hashes or IPs

### Rate limiting and optimization

To avoid rate limit issues:

- Set `<level>` to 7+ to enrich only medium/high severity alerts
- Limit enrichment to specific IoC types relevant to your environment
- Monitor API usage in Maltiverse dashboard
- Consider caching enriched IoCs locally (future enhancement)

---

## Integration health monitoring

Monitor the health and performance of external integrations:

1. **Check notification channels**:

   - Navigate to **☰ Menu > Explore > Notifications > Channels**
   - Verify all channels show **Enabled** and **Unmuted**
   - Use **Send test message** periodically

2. **Review monitor status**:

   - Navigate to **☰ Menu > Explore > Alerting > Monitors**
   - Check for failed monitors or error states
   - Review trigger history

3. **Audit integration logs**:

   - Wazuh manager: `/var/ossec/logs/integrations.log`
   - OpenSearch Dashboards: `/var/log/wazuh-dashboard/opensearch_dashboards.log`

4. **Performance metrics**:
   - Alert delivery latency
   - Failed notification attempts
   - API rate limit usage (Maltiverse)

---

## Best practices

### Security

- **API keys**: Store securely, rotate regularly, use least privilege
- **Webhook URLs**: Keep private, use HTTPS only, validate signatures where supported
- **Access control**: Restrict who can create/modify channels and monitors

### Reliability

- **Test regularly**: Send test messages weekly to verify integrations
- **Monitor failures**: Set up alerts for failed notifications
- **Redundancy**: Use multiple channels for critical alerts

### Performance

- **Alert volume**: Balance between visibility and noise
- **Rate limits**: Monitor API usage to avoid throttling
- **Deduplication**: Prevent duplicate notifications for the same event

---

## Additional resources

- [Notifications and Alerting module](modules/notifications-alerting.md)
- [Health Check module](modules/healthcheck.md)
- Official integrations documentation:
  - Slack API: https://api.slack.com/messaging/webhooks
  - PagerDuty: https://developer.pagerduty.com/docs/ZG9jOjExMDI5NTgw-events-api-v2-overview
  - Shuffle: https://shuffler.io/docs/workflows
  - Maltiverse: https://maltiverse.com/documentation
