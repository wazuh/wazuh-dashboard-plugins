# CTI feed

## Overview

The **CTI feed** app gathers everything about the threat intelligence content that Wazuh Cyber
Threat Intelligence (CTI) delivers to the environment:

- The **subscription**: whether the environment is registered, the plan, and the registration
  flow.
- The **feed sync**: whether each feed is up to date, syncing, or failed.
- The **feed content**: how much content each feed has delivered.
- The **Update CTI content** action, which requests a sync now instead of waiting for the next
  automatic one.

Every installation receives the **Open feed**. Registering the environment with Wazuh Cyber
Threat Intelligence lets you manage it from the Wazuh Console and upgrade to the **Professional
feed**, which delivers vulnerabilities, IOCs and rules with no delay.

## Accessing the CTI feed app

Open the menu and go to **Threat intelligence > CTI feed**.

The app is available when `wazuh_check_updates.ctiRegistrationUiEnabled` is `true` in
`opensearch_dashboards.yml`. When it is `false`, the app is not registered. See
[Configuration](../configuration.md).

## Subscription

The **Subscription** panel shows the registration state of the environment:

| State                   | Meaning                                                                                     | Action                      |
| :---------------------- | :------------------------------------------------------------------------------------------ | :-------------------------- |
| **Not registered**      | The environment receives the Open feed. The panel compares the Open and Professional feeds. | **Register**                |
| **Activation pending**  | A registration started and waits for the activation in the Wazuh Console.                   | **View activation details** |
| **Registered**          | The environment is registered. The panel shows the plan name.                               | **View registration**       |
| **Registration failed** | The registration could not be completed. The environment keeps receiving the Open feed.     | **View details**            |

Each action opens the registration dialog, which walks through the activation with a user code.
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

## Feed content

The **Feed content** panel counts the content the feed delivered: rules, decoders,
integrations, KVDBs, indicators of compromise and vulnerabilities (CVEs). Content that users
create is not counted.

- Rules, decoders, integrations and KVDBs are counted in the `standard` space of Ruleset
  Management, through the same Security Analytics endpoints the Home page uses.
- Indicators of compromise are counted in the `wazuh-threatintel-enrichments*` indices.
- Vulnerabilities are the CVE records in the `.wazuh-threatintel-vulnerabilities*` indices.

A count shows **—** when it cannot be read, for example when the content is not synced yet or
the user lacks access to it. The counts refresh after a sync finishes, or on demand with the
refresh button.

## Updating the CTI content

Click **Update CTI content** to request a sync of the CTI content now.

- The request runs asynchronously. A notification confirms it was requested, and the **Feed
  sync** panel follows the sync as it runs.
- The button calls `POST /api/wazuh-check-updates/cti-feed/update` on the dashboard server, which
  forwards the request to `POST /_plugins/_content_manager/update` on the Wazuh indexer as the
  current user. The indexer privileges of that user decide whether the request is allowed.
