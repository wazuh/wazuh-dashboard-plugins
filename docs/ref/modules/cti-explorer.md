# CTI Explorer

## Overview

The **CTI Explorer** app shows the threat intelligence content that Wazuh Cyber Threat
Intelligence (CTI) delivers to the Wazuh indexer, and lets you check a single value against it:

- The **indicators of compromise (IOCs)**: malicious domains, URLs, host:port pairs and file
  hashes. Malware detection matches events against them.
- The **vulnerability records**: CVE records and translation rules (TID). Vulnerability detection
  scores the installed packages against them.
- The **detection content**: the number of rules, decoders, integrations and KVDBs that the feed
  delivered to Ruleset Management.

The app shows feed knowledge only. A value listed in the catalog has not necessarily been seen on
an agent: to find the events that matched an IOC, hunt for it in **Threat Hunting**. The
[CTI feed](cti-feed.md) app reports whether each feed is in sync.

## Accessing the CTI Explorer app

Open the menu and go to **Threat intelligence > CTI Explorer**.

The app opens on the **Overview** tab. The URL keeps the open tab and the open record, so a reload
or a shared link opens the same view.

## Indices and permissions

| Index                                 | Content                                          | Read by                        |
| :------------------------------------ | :----------------------------------------------- | :----------------------------- |
| `wazuh-threatintel-enrichments*`      | One record per IOC and provider                  | **Overview** and **IOCs** tabs |
| `.wazuh-threatintel-vulnerabilities*` | CVE records and translation rules (hidden index) | **Vulnerabilities** tab        |

The dashboard server reads both indices as the signed-in user, so the user's index permissions
apply. When the user cannot read an index, the affected section names it and the rest of the page
keeps working. The detection content counts come from the Ruleset Management API, in the
`standard` space, as on the CTI feed page.

The routes of the dashboard server are:

| Route                                               | Purpose                                           |
| :-------------------------------------------------- | :------------------------------------------------ |
| `GET /api/cti-explorer/iocs/summary`                | IOC totals and breakdowns                         |
| `POST /api/cti-explorer/iocs/search`                | One page of IOCs, filtered and sorted             |
| `GET /api/cti-explorer/iocs/record/{id}`            | One IOC and the other records with the same value |
| `POST /api/cti-explorer/lookup`                     | Check one value against the catalogs              |
| `GET /api/cti-explorer/vulnerabilities/summary`     | Number of CVE and TID records                     |
| `POST /api/cti-explorer/vulnerabilities/search`     | One page of vulnerability records, newest first   |
| `GET /api/cti-explorer/vulnerabilities/record/{id}` | One vulnerability record by its full id           |

The routes validate their requests: a page size of at most 1,000 records, a page within the first
10,000 records, lookup values of at most 4,096 characters, filter values of at most 1,024
characters, record ids in the `CVE-YYYY-NNNN` or `TID-NNNN` form, severities among `low`,
`medium`, `high` and `critical`, and vulnerability sort fields among `offset` and
`document.cveMetadata.datePublished`.

## Overview

### Checking a value

Type a domain, URL, IP address, host:port pair, file hash or CVE id and click **Check**.

- The match is exact and ignores case. An IP address also finds its host:port records, and a URL
  also finds the domain of its host.
- Defanged values, such as `hxxps://example[.]com`, are accepted.
- A `CVE-…` or `TID-…` id is looked up in the vulnerabilities catalog and opens its record.
- A listed value shows the providers that reported it, its highest confidence, a link to the
  record and a **Hunt in Threat Hunting** link.
- A value that is not found is only absent from the catalog: it is not a verdict that the value is
  safe.

### Catalog summary

The tiles count the IOC records, the IOCs first seen in the last 30 days, the providers, the CVE
records and the translation rules. Each tile opens the matching list. Below them, the **IOC
catalog by type** panel breaks the IOCs down by type, and the **Detection content** line links to
the Ruleset Management pages.

## IOCs

The **IOC catalog** panel breaks the records down by type, provider, malware role, malware family,
tag and confidence. Select a value to list its records.

The **Browse IOCs** list pages and sorts on the server, by value, confidence, first seen or last
seen. Filter it by type, by the start of the value (ignoring case) and by the breakdown values.
The indexer pages through the first 10,000 matches only; narrow the filters to reach the other
records.

**Export CSV** downloads the records of the list, with its filters and sort order applied: the
full value, type, provider, publisher, malware family and role, confidence, dates (UTC, as stored),
tags, reference and record id. The file holds at most the first 10,000 records, or fewer when the
**Maximum rows in CSV reports** (`reports.csv.maxRows`) setting is lower.

Select a record to open its details: provider, publisher, confidence, dates, malware family, role
and aliases, tags and reference. The provider, family, role and tags filter the list. The other
records of the same value, from other providers, are listed below. Values are shown as text, never
as links, and only `http` and `https` references are linked.

## Vulnerabilities

The records of `.wazuh-threatintel-vulnerabilities*` are stored without being indexed: only their
type and offset are searchable. The tab therefore:

- Lists the records newest first, filtered by type (**CVE** or **Translation rules (TID)**). The
  newest 10,000 records can be paged through.
- Sorts the CVE records by **Published** (`document.cveMetadata.datePublished`), in either order.
  Records without a publication date sort last, as do all records of an index that does not map
  it as a date. Translation rules have no publication date, so the column does not sort them.
- Filters the CVE records by **Severity** (Low, Medium, High, Critical; several can be selected).
  A record matches a severity when any CVSS base score of its CNA container,
  `document.containers.cna.metrics.*.baseScore`, falls in that band of the CVSS v3.x and v4.0
  scale: Low 0.1 to 3.9, Medium 4.0 to 6.9, High 7.0 to 8.9, Critical 9.0 to 10.0, for every CVSS
  version. A record scored in two versions can match two severities, and the **Highest CVSS**
  column, which also reads the ADP containers, can show another band. The filter needs an index
  that maps these scores (as `half_float`); in an index without that mapping no record matches.
  Translation rules have no scores, so the filter is disabled for them.
- Opens any record by its full id, such as `CVE-2024-6387`. Free text cannot be searched.
- Exports the listed records, of the selected type, with **Export CSV**: id, type, highest CVSS
  score, severity and version, dates, assigner and state of the CVE records, and the actions and
  targets of the translation rules. The same limit as the IOC export applies.

A CVE record shows its state, dates, assigner, highest CVSS score, vendor ratings, weaknesses and
affected products, with tabs for every affected product and version range, every score and its
source, the references and the stored JSON. **Open in Vulnerability Detection** opens the
inventory of the agents affected by the CVE.

A translation rule shows its actions, the operating systems it applies to, the vendor and product
it matches, and what it translates them to.
