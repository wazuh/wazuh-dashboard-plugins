# Attach an active response to a monitor trigger

An active response only runs when an Alerting trigger invokes it. This walkthrough connects the `block-ip-10min` active response (created in [Create an active response](./create.md)) to a Per document monitor that detects SSH brute-force attempts.

**Prerequisites:** the `block-ip-10min` active response exists and has `Status = Active`.

---

## Step 1: Open Alerting and create a monitor

Navigate to **Alerting → Monitors → Create monitor**. If no monitors exist yet, the Alerts tab looks like this:

![Alerting - Alerts empty state](images/08-alerting-alerts-empty.png)

---

## Step 2: Select **Per document monitor**

In the **Monitor type** selector, choose **Per document monitor**. This is mandatory: any other monitor type (Per query, Per bucket, Per cluster metrics, Composite) will hide the **Add active response** button in the trigger step.

![Monitor type - Per document monitor](images/09-monitor-type-per-document.png)

Give the monitor a name and pick a **Schedule** (for example, `By interval`, every `1` minute).

---

## Step 3: Configure the data source

Under **Select data**, pick the findings index that holds the events to watch. For this SSH brute-force use case, select `wazuh-findings-v5-access-management*` — the access-management findings index, which carries authentication events such as failed SSH logins. Other findings indices (`wazuh-findings-v5-security*`, `wazuh-findings-v5-network-activity*`, etc.) cover different categories; pick the one that matches the rules driving your active response.

![Select data - Index picker](images/10-monitor-select-index.png)

---

## Step 4: Define the query

In the **Query** section, describe the conditions that the incoming alerts must meet. For this SSH brute-force use case, target the built-in Wazuh rule that flags repeated failed SSH logins (`rule.id: 5712` — _"sshd: brute force trying to get access to the system"_). Add a **Query name** (required) and fill in the condition:

- **Field** — `rule.id`
- **Operator** — `is`
- **Search term** — `5712`

![Query - Filled query and performance preview](images/11-monitor-query-filled.png)

> **Tip:** use **Preview query and performance** to confirm the query returns the expected document shape before moving on.

> **See also:** for guidance on generating a triggering event in a lab environment (simulating SSH brute-force attempts to produce `rule.id: 5712` alerts), see the equivalent 4.x walkthrough — [Blocking SSH brute force](https://documentation.wazuh.com/current/user-manual/capabilities/active-response/ar-use-cases/blocking-ssh-brute-force.html). Only the event-generation portion is reusable; the active response wiring on 5.x lives in the dashboard, as described in this guide.

---

## Step 5: Add a trigger with an active response action

Click **Add trigger**. In the trigger editor, scroll to the **Actions** section: two buttons are available — **Add notification** (generic notifications) and **Add active response** (active responses).

![Trigger - Add notification vs Add active response](images/12-trigger-two-buttons.png)

Click **Add active response**. The action exposes:

- A required **Action name** (letters, numbers, and special characters only).
- An **Active response** selector with the placeholder `Select active response to execute`.
- A **Manage active responses** button that opens the Active Responses view in a new tab.

![Trigger - Active Response action](images/13-trigger-ar-action.png)

Open the **Active response** dropdown and pick the one created earlier. The dropdown only lists active responses and labels them with the `[Active response]` prefix.

![Trigger - Active response selector open](images/14-trigger-ar-selector-open.png)

> **Important:** if the action has nothing selected in the **Active response** field, Alerting blocks the save with a validation error. Always confirm an active response is selected before saving.

---

## Step 6: Save the monitor

Save the monitor. The overview page summarizes the configuration, the triggers, the history, and any alerts produced so far.

![Monitor detail - Overview](images/15-monitor-detail.png)

The action automatically wires the triggering alert to the active response, so there is nothing else to configure on the trigger side.

> **Note:** a single trigger can contain several **Add active response** actions. Each one produces an independent execution record in **Discover** and runs separately.
