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
- The **catalogs** the feed delivers: the indicator catalog and the vulnerability catalog, which
  can be explored and searched by value or by id.

The app has three tabs: **Overview** (subscription, feed sync and feed content), **Indicators**
and **Vulnerabilities**. The open tab is kept in the URL (`?tab=indicators`), so a reload or a
shared link opens the same tab.

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

## Indicators

The **Indicators** tab explores the indicator catalog, read from the
`wazuh-threatintel-enrichments` alias. Each record is a known-malicious domain, URL, host:port
pair or file hash published by a named provider. A record is feed knowledge: it is not evidence
that the value was seen on an endpoint.

### Check an indicator

Enter a domain, URL, IP address, host:port pair or file hash to check whether the catalog holds
it. The value must match the indicator (`document.name`) exactly, ignoring case:

- An IP address also matches its host:port records (`124.198.132.174` matches
  `124.198.132.174:8080`), but never a different address that shares a prefix
  (`124.70.213.4` does not match `124.70.213.43:1010`).
- A URL also matches the domain record of its host name, and is matched with and without one
  trailing slash.
- A file hash matches the indicator value, not the hash of the record itself.

A value with no record is reported as **Not in this catalog**. This is not a verdict that the
value is safe: the catalog only holds what its providers reported. A CVE or TID id entered here
offers to open it in the **Vulnerabilities** tab.

### Indicator catalog

The panel summarizes the catalog with aggregations computed when the tab opens: total records,
records first seen in the last 30 days, providers, malware families, average confidence, the
records first seen per month over the last 18 months, and breakdowns by type, provider, malware
role and malware family. Select a value in a breakdown to browse its records.

### Browse indicators

The browser lists records newest first by first-seen date, 20 per page. Filter by type, by
the values selected in the breakdowns, or by the start of the indicator value (**Starts with**,
an anchored prefix, not a text search). Browsing reaches the newest 1,020 records of a filter;
narrow the filters to reach older ones. Select a record to see all its fields, and pivot to the
other records of its provider or malware family.

Indicator values are shown as text and are never rendered as links.

## Vulnerabilities

The **Vulnerabilities** tab explores the vulnerability catalog, read from the
`.wazuh-threatintel-vulnerabilities` alias. It holds the CVE records that vulnerability detection
scores installed packages against, and the translation rules (TID) that map the vendor and
product names a package reports to the names CVE records use. It is reference knowledge: it does
not say which endpoints are affected.

### Open a vulnerability record

Records are stored without being indexed, so only a full id finds one: `CVE-` followed by the
year and 4 to 7 digits, or `TID-` followed by digits. Text such as `log4j` or `critical` cannot
be searched, and the box says so instead of returning an empty result.

A CVE record shows its state, publication and update dates, assigner, the highest CVSS base
score with its version, the weaknesses (CWE) and the first affected products with a count of
the rest. **View the full record** opens the description, every score and who gave it, the full
list of affected products with their version ranges, the references and the stored JSON.
Only web (`http`, `https`) references are rendered as links.

### Newest records

The browser lists CVE and TID records by catalog offset, the most recently added first. The
newest records can be placeholders without a score or a description. Severity and score are read
from each record, so they cannot filter or sort the list.

## Permissions and errors

The Indicators and Vulnerabilities tabs read their indices as the signed-in user. Each section
fails on its own: when the user cannot read an index, the section names the index and the rest
of the page still renders. The two indices whose names start with a dot are hidden from index
patterns, so the user's role must grant read access to `.wazuh-threatintel-vulnerabilities*`
explicitly.

The tabs use these dashboard server routes, all under `/api/wazuh-check-updates/cti-feed/catalog`:

| Route                               | Purpose                                       |
| :---------------------------------- | :-------------------------------------------- |
| `GET /indicators/summary`           | Totals, breakdowns and the monthly histogram. |
| `POST /indicators/lookup` (`{ q }`) | Exact lookup of one value.                    |
| `POST /indicators/search`           | One page of the indicator browser.            |
| `GET /vulnerabilities/summary`      | Record counts by type.                        |
| `POST /vulnerabilities/search`      | One page of the newest CVE and TID records.   |
| `GET /vulnerabilities/record/{id}`  | One record by its full CVE or TID id.         |

Request bodies are validated: a page cannot go past offset 1,000, and lookup and filter values
have a maximum length.
