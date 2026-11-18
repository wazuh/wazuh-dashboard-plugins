# CTI feed

## Overview

The **CTI feed** app gathers everything about the threat intelligence content that Wazuh Cyber
Threat Intelligence (CTI) delivers to the environment:

- The **subscription**: whether the environment is registered, the plan, and the registration
  flow.
- The **feed sync**: whether each feed is up to date, syncing, or failed, and how much content
  each feed has delivered.
- The **Update CTI content** action, which requests a sync now instead of waiting for the next
  automatic one.

Every installation receives the **Open feed**. Registering the environment with Wazuh Cyber
Threat Intelligence lets you manage it from the Wazuh Console and upgrade to the **Professional
feed**, which delivers new vulnerabilities, IOCs and rules faster.

## Accessing the CTI feed app

Open the menu and go to **Threat intelligence > CTI feed**.

The app is always available. `wazuh_check_updates.ctiRegistrationUiEnabled` in
`opensearch_dashboards.yml` only decides whether the bottom bar that invites users to register is
shown. See [Configuration](../configuration.md).

## Subscription

The **Subscription** panel shows the registration state of the environment:

| State                   | Meaning                                                                                                                | Action                      |
| :---------------------- | :--------------------------------------------------------------------------------------------------------------------- | :-------------------------- |
| **Not registered**      | The environment receives the Open feed. The panel compares the Open and Professional feeds.                            | **Register**                |
| **Activation pending**  | A registration started and waits for the activation in the Wazuh Console.                                              | **View activation details** |
| **Registered**          | The environment is registered. The panel shows the plan, the environment and its subscription, and compares the plans. | **Manage in Wazuh Console** |
| **Registration failed** | The registration could not be completed. The environment keeps receiving the Open feed.                                | **View details**            |

**Manage in Wazuh Console** opens the Deployments page of the console in a new tab. The other
actions open the registration dialog, which walks through the activation with a user code.
The bar at the bottom of the interface that invites users to register opens this app with the
registration dialog already open.

## Feed sync

The **Feed sync** panel summarizes the sync state of the feeds and lists each one:

- **Ruleset**: rules, decoders, integrations and KVDBs.
- **Indicators of compromise**: malicious domains, URLs, connections and file hashes.
- **Vulnerabilities**: CVE records used by vulnerability detection.

Each feed shows one of these states:

| State                | Meaning                                                                 |
| :------------------- | :---------------------------------------------------------------------- |
| **Up to date**       | The feed holds all the content the CTI service offers.                  |
| **Update available** | The CTI service has new content that the next sync brings in.           |
| **Syncing**          | The indexer is downloading content. A progress bar shows how far it is. |
| **Sync failed**      | The last sync failed. Detection keeps using the content already synced. |

The state comes from the `.wazuh-cti-consumers` index of the Wazuh indexer. While a feed is
syncing, the panel refreshes itself every few seconds.

### What each feed delivered

Under each feed, a line counts the content it delivered to the environment. Content that users
create is not counted.

- **Ruleset**: rules, decoders, integrations and KVDBs, counted in the `standard` space of
  Ruleset Management, through the same Security Analytics endpoints the Home page uses.
- **Indicators of compromise**: the IOCs in the `wazuh-threatintel-enrichments*` indices.
- **Vulnerabilities**: the CVE records in the `.wazuh-threatintel-vulnerabilities*` indices.

Each count links to the page that lists that content: the Ruleset Management page on the
`standard` space, or the matching tab of the [CTI Explorer](cti-explorer.md) app.

A count shows **—** when it cannot be read, for example when the content is not synced yet or
the user lacks access to it. The counts refresh after a sync finishes, or on demand with the
refresh button of the **Feed sync** panel.
