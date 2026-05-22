# Migrating Mail Forwarding and Reporting to Dashboard Notifications

In previous Wazuh versions (4.x), email alerts and reporting were configured directly in the Wazuh manager's `ossec.conf` file using the `<email_alerts>`, `<reports>`, and related global SMTP configuration blocks.

Starting with Wazuh 5.0, these backend mail forwarding capabilities have been removed from the manager. Mail forwarding and scheduled reporting must now be configured directly through the Wazuh Dashboard using the **Notifications**, **Alerting**, and **Reporting** capabilities.

> **Note:** There is no automatic upgrade tooling to migrate your existing 4.x email configurations. You must manually recreate your alerting and reporting logic in the Wazuh Dashboard. Use the mapping tables below to identify which 5.x feature corresponds to each element in your `ossec.conf`.

## Configuration mapping (4.x -> 5.x)

The following table maps each `ossec.conf` element from 4.x to the corresponding feature in the Wazuh 5.x Dashboard. Entries use the form `section.element` - for example, `global.smtp_server` refers to `<global><smtp_server>` in your `ossec.conf`.

> See the [ossec.conf reference](#ossecconf-reference) below for the full XML context of each section.

### Email alerts mapping

| 4.x `ossec.conf`        | 5.x Dashboard                                    | Guide                                          |
| ----------------------- | ------------------------------------------------ | ---------------------------------------------- |
| `global.smtp_server`    | Notifications > Email Senders (SMTP host/port)   | [Step 1](#1-creating-an-email-sender)          |
| `global.email_from`     | Notifications > Email Senders (outbound address) | [Step 1](#1-creating-an-email-sender)          |
| `email_alerts.email_to` | Notifications > Email Recipient Groups           | [Step 2](#2-creating-an-email-recipient-group) |

### Reports mapping

| 4.x `ossec.conf`   | 5.x Dashboard                                            | Guide                                     |
| ------------------ | -------------------------------------------------------- | ----------------------------------------- |
| `reports.title`    | Reporting > Report Definition > Name                     | [Step 5](#5-recreating-scheduled-reports) |
| `reports.email_to` | Reporting > Report Definition > Notification > Channels  | [Step 5](#5-recreating-scheduled-reports) |
| `reports.showlogs` | Reporting > Report Definition > (include details toggle) | [Step 5](#5-recreating-scheduled-reports) |

> Filters like `reports.group`, `reports.rule`, `reports.level`, `reports.srcip`, `reports.location`, and `reports.user` were used in 4.x to scope the report content. In 5.x, this is achieved by selecting the appropriate source dashboard or visualization - the filtering is inherent to the source, not configured on the report definition itself.

## ossec.conf reference

Below are the typical 4.x configuration blocks you may have in your `ossec.conf`. Use them as a reference when following the migration steps.

```xml
<global>
  <smtp_server>mail.example.com</smtp_server>
  <email_from>wazuh@example.com</email_from>
</global>

<alerts>
  <email_alert_level>10</email_alert_level>
</alerts>

<email_alerts>
  <email_to>security@example.com</email_to>
  <level>12</level>
  <group>sshd,</group>
  <do_not_delay/>
</email_alerts>

<reports>
  <title>Daily Vulnerability Report</title>
  <group>vulnerability-detector,</group>
  <level>10</level>
  <email_to>security@example.com</email_to>
  <showlogs>yes</showlogs>
</reports>
```

## Migration steps

### Prerequisites

Before proceeding, make sure you have:

- Wazuh 5.0 fully deployed (indexer, manager, dashboard)
- Access to the Wazuh Dashboard as an administrator
- SMTP server credentials or Amazon SES configuration
- Recipient email addresses ready

> These steps must be followed **in order**, as each step depends on resources created in the previous one.

## 1. Creating an Email Sender

Before creating an email channel, you must set up an outbound email server by creating a sender. You can choose to configure either an SMTP or an Amazon SES sender.

1. Open the Wazuh Dashboard and navigate to the **Notifications** plugin.
2. Go to **Email senders**.

![Email Senders](../../img/email-reporting/create-email-sender.png)

### Option A: Creating an SMTP Sender

1. Click **Create SMTP sender**.
2. Provide a **Name** for the sender (e.g., `wazuh-security-smtp-sender`).
3. Enter the **Outbound email address** (e.g., `noreply@wazuh.local`).
4. Specify the **Host** (e.g., `mailpit`) and **Port** (e.g., `1025`).
5. Select the **Encryption method** (e.g., `None`).
   > **Note:** SSL/TLS or STARTTLS is recommended for security. To use either one, you must enter each sender account's credentials into the OpenSearch keystore using the CLI.
6. Click **Create** to save the sender.

![Creating an SMTP Sender](../../img/email-reporting/create-smtp-sender-with-data.png)

### Option B: Creating an Amazon SES Sender

1. Click **Create SES sender**.
2. Provide a **Name** for the sender.
3. Enter the **Outbound email address**.
4. Specify your **AWS region** and **Role ARN**.
5. Click **Create** to save the sender.

![Creating an SES Sender](../../img/email-reporting/create-ses-sender-with-data.png)

## 2. Creating an Email Recipient Group

To easily manage multiple destination email addresses, you can configure an Email Recipient Group.

1. In the **Notifications** plugin, go to **Email recipient groups**.

![Recipient Groups](../../img/email-reporting/create-recipient-group-base.png)

2. Click **Create recipient group**.
3. Enter a **Name** for the group (e.g., `wazuh-security-recipients`).
4. (Optional) Provide a **Description** explaining the purpose of this group (e.g., `Recipients of scheduled security reports and alerts.`).
5. In the **Emails** field, type or select one or more email addresses (e.g., `wazuh-security-recipients@test.com`).

![Creating an Email Recipient Group](../../img/email-reporting/create-recipient-group-with-data.png)

6. Click **Create** to save the recipient group.

![Listed recipient groups](../../img/email-reporting/listed-recipient-group.png)

## 3. Setting up an Email Notification Channel

With your sender and recipient group created, you can now set up the Notification Channel.

1. In the **Notifications** plugin, go to **Channels** and click **Create channel**.

![Channels section](../../img/email-reporting/create-channel-base.png)

2. Enter a **Name** for the channel (e.g., `wazuh-security-mail-channel`).
3. (Optional) Provide a **Description** clarifying the purpose of this channel (e.g., `Email channel used to deliver Wazuh security alerts, findings, and incident notifications.`)
4. Under **Configurations**, select **Email** as the **Channel type**.
5. Choose your **Sender type** (e.g., **SMTP sender**).
6. In the **SMTP sender** field, select the sender you created in [Step 1](#1-creating-an-email-sender) (e.g., `wazuh-security-smtp-sender`).
7. Under **Default recipients**, select the recipient group you created in [Step 2](#2-creating-an-email-recipient-group) (e.g., `wazuh-security-recipients`).

![Setting up an Email Notification Channel](../../img/email-reporting/create-channel-with-data.png)

8. (Optional) Click **Send test message** to verify your configuration.
9. Click **Create** to save the channel.

![Listed Channels](../../img/email-reporting/listed-channel.png)

## 4. Recreating Email Alerts with Monitors

In 4.x, alerts were triggered by rule severity, groups, or specific rule IDs via `<email_alerts>`. In 5.0, you create Monitors using the Alerting plugin. A Monitor evaluates findings against a query, and when the trigger condition is met, executes an action - for example, sending an email through your notification channel.

### 4.1. Creating a Monitor

Create a **monitor** in the **Alerting plugin** according to your needs (for example, a **per-document monitor** to trigger on individual matching documents). Define a query that selects the findings you want to alert on and set the checking schedule. The image below shows an example configured for SSH root login events.

![Recreating Email Alerts with Monitors](../../img/email-reporting/create-monitor-with-data-one.png)
![Configuring query](../../img/email-reporting/create-monitor-with-data-two.png)

### 4.2. Configuring Triggers and Actions

Once the monitor is created, add a trigger and configure the action to use your notification channel. This is the key migration step - it connects the monitor to the email channel you created earlier.

1. Add a trigger with a name, severity level and trigger condition.

![Configuring Triggers](../../img/email-reporting/create-monitor-with-data-trigger.png)

2. Under **Actions**, click **Add notification** and configure:
   - **Channel**: Select the email channel you created in [Step 3](#3-setting-up-an-email-notification-channel)
   - **Message subject**: e.g., `SSH Root Connection`
   - **Message**: Customize the body using Mustache templates or plain text
   - **Action configuration**: `Per execution` or `Per alert`

![Configuring Triggers and Actions](../../img/email-reporting/create-monitor-with-data-action.png)

3. Click **Create** to save the monitor.

### 4.3. Testing the Monitor

1. Trigger the condition by generating an event that matches your query.
2. Verify the alert appears in the **Alerting** plugin under the **Alerts** tab.
3. Confirm the email notification is received in the recipient's inbox.

![Alert tab](../../img/email-reporting/alert-tab.png)
![Received email](../../img/email-reporting/mail-received.png)

<details>
<summary>Example: recreating an `sshd` rule from 4.x</summary>

If your 4.x `ossec.conf` had a block like:

```xml
<email_alerts>
  <email_to>security@example.com</email_to>
  <level>12</level>
  <group>sshd,</group>
  <do_not_delay/>
</email_alerts>
```

You can recreate it with the following monitor configuration:

**Monitor:**

- **Name**: `SSH root login`
- **Type**: Per document monitor
- **Schedule**: Every 1 minute
- **Index pattern**: `wazuh-findings-v5-system-activity`
- **Query**: `wazuh.rule.title` is `SSH root login via password authentication`

**Trigger:**

- **Name**: `SSH-trigger`
- **Severity**: `1 (Highest)`

**Action:**

- **Channel**: Your email channel from [Step 3](#3-setting-up-an-email-notification-channel)
- **Subject**: `SSH Root Connection`
- **Configuration**: Per execution

</details>

## 5. Recreating Scheduled Reports

If you previously used the `<reports>` block in `ossec.conf` to generate daily or weekly summaries, you can replicate this behavior using the Reporting plugin. Create a report definition configured to your needs, then set up email notification to deliver it through your channel. The images below show a daily vulnerability report as an example.

1. Navigate to the **Reporting** plugin in the Wazuh Dashboard.

![Reporting page](../../img/email-reporting/reporting-base.png)

2. Click **Create report definition**.
3. Under **Report settings**, configure the following according to your needs (example values shown in the images):
   - **Name**: e.g., `Vulnerability Detection Daily Report`
   - **Report source**: Select **Dashboard** and pick the dashboard to export
   - **Time range**: e.g., `Last 24 hours`
   - **File format**: e.g., `PDF`
4. Under **Report trigger**, select **On demand** or set a schedule.

![Configuring Report Data](../../img/email-reporting/create-report-definition-with-data-one.png)

5. In **Notification settings**:
   - Check the **Send notification when report is available** option.
   - **Channels**: Select the Email channel you created in [Step 3](#3-setting-up-an-email-notification-channel).
   - **Notification subject**: e.g., `Vulnerability Detection Report`
6. Configure your notification message using the text editor or use the default template.

![Configuring Report Schedule and Notifications](../../img/email-reporting/create-report-definition-with-data-two.png)

7. Click **Create** to save the report definition.
8. After creating the report definition, the application will open a new browser tab with the report being generated.

![Report being generated](../../img/email-reporting/report-being-generated.png)

### 5.1. Viewing Generated Reports

1. Once the report is generated (either on-demand or by schedule), it will be listed in the **Reporting** plugin.

![Report list](../../img/email-reporting/listed-report-and-report-definition.png)

2. The email with the custom format and report link will be delivered to the recipients.

![Report Email Received](../../img/email-reporting/received-mail-final.png)

By completing this migration, you have moved from a static, file-based notification system to a fully dynamic, dashboard-driven approach. The Wazuh 5.0 notification stack - built on top of the **Notifications**, **Alerting**, and **Reporting** plugins - gives your security team real-time alerting with fine-grained query control, reusable channel and recipient configurations, and rich HTML email templates with direct report links. Unlike the rigid `ossec.conf` approach, this setup can be updated, tested, and extended without restarting any backend service.
