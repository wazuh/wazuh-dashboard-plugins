# Auditing compliance requirements against a live indexer

Manual `curl` equivalents of what `audit-compliance-requirements.js` does, for
retrieving the real compliance codes directly from a Wazuh indexer without
running the script.

## Setup

```bash
export WAZUH_HOST="https://<indexer-host>"
export WAZUH_AUTH="admin:admin"
```

## 1. Sanity check / cluster info

```bash
curl -sk -u "$WAZUH_AUTH" "$WAZUH_HOST/" | jq
```

## 2. List indices (confirm the findings/rules indices exist)

```bash
curl -sk -u "$WAZUH_AUTH" "$WAZUH_HOST/_cat/indices?v"
```

## 3. Get unique compliance codes from findings (terms aggregation)

The real, populated field is `wazuh.rule.compliance.<framework_key>`. Example
for PCI DSS:

```bash
curl -sk -u "$WAZUH_AUTH" -X POST "$WAZUH_HOST/wazuh-findings-v5*/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "size": 0,
    "query": { "match_all": {} },
    "aggs": {
      "codes": {
        "terms": { "field": "wazuh.rule.compliance.pci_dss", "size": 5000 }
      }
    }
  }' | jq '.aggregations.codes.buckets'
```

Swap the field suffix for other frameworks: `gdpr`, `hipaa`, `nist_800_53`,
`nist_800_171`, `tsc`, `cmmc`, `fedramp`, `iso_27001`, `nis2`.

Loop over all frameworks at once:

```bash
for fw in pci_dss gdpr hipaa nist_800_53 nist_800_171 tsc cmmc fedramp iso_27001 nis2; do
  echo "=== $fw ==="
  curl -sk -u "$WAZUH_AUTH" -X POST "$WAZUH_HOST/wazuh-findings-v5*/_search" \
    -H 'Content-Type: application/json' \
    -d "{\"size\":0,\"query\":{\"match_all\":{}},\"aggs\":{\"codes\":{\"terms\":{\"field\":\"wazuh.rule.compliance.$fw\",\"size\":5000}}}}" \
    | jq -r '.aggregations.codes.buckets[] | "\(.key) (\(.doc_count))"'
done
```

## 4. Get unique compliance codes from rule content (scroll)

Since `compliance` isn't aggregatable in this index's mapping, you have to
scroll and read `_source` client-side:

```bash
# Open the scroll and grab the first page
RESPONSE=$(curl -sk -u "$WAZUH_AUTH" -X POST "$WAZUH_HOST/wazuh-threatintel-rules/_search?scroll=1m" \
  -H 'Content-Type: application/json' \
  -d '{ "size": 500, "query": { "match_all": {} }, "_source": true }')

SCROLL_ID=$(echo "$RESPONSE" | jq -r '._scroll_id')
echo "$RESPONSE" | jq -r '.hits.hits[]._source.wazuh.rule.compliance.pci_dss[]?' > /tmp/pci_codes.txt

# Page through the rest of the scroll
while true; do
  PAGE=$(curl -sk -u "$WAZUH_AUTH" -X POST "$WAZUH_HOST/_search/scroll" \
    -H 'Content-Type: application/json' \
    -d "{\"scroll\":\"1m\",\"scroll_id\":\"$SCROLL_ID\"}")
  HITS=$(echo "$PAGE" | jq '.hits.hits | length')
  [ "$HITS" -eq 0 ] && break
  echo "$PAGE" | jq -r '.hits.hits[]._source.wazuh.rule.compliance.pci_dss[]?' >> /tmp/pci_codes.txt
  SCROLL_ID=$(echo "$PAGE" | jq -r '._scroll_id')
done

# Clear the scroll context when done
curl -sk -u "$WAZUH_AUTH" -X DELETE "$WAZUH_HOST/_search/scroll" \
  -H 'Content-Type: application/json' \
  -d "{\"scroll_id\":\"$SCROLL_ID\"}"

# Unique codes found
sort -u /tmp/pci_codes.txt
```

Swap `.pci_dss` for `.gdpr`, `.hipaa`, `.nist_800_53`, `.nist_800_171`, `.tsc`,
`.cmmc`, `.fedramp`, `.iso_27001`, `.nis2` to pull other frameworks (or drop
the trailing key to dump the whole `compliance` object per rule instead).

## 4b. Why you can't aggregate the rules index instead of scrolling

It's tempting to replace the scroll in section 4 with a `terms` aggregation.
On most deployments this fails because `wazuh-threatintel-rules` has
`"dynamic": "false"` and `compliance` isn't in the explicit mapping — the data
lives in `_source` but was never indexed into a queryable field. Confirm this
first:

```bash
curl -sk -u "$WAZUH_AUTH" "$WAZUH_HOST/wazuh-threatintel-rules/_mapping" \
  | jq '.[].mappings.dynamic, (.[].mappings.properties.document.properties | keys)'
```

If `compliance` is absent, the following all fail to return real data:

```bash
# 1) Plain terms agg on the raw field — returns 0 buckets (field isn't indexed)
curl -sk -u "$WAZUH_AUTH" -X POST "$WAZUH_HOST/wazuh-threatintel-rules/_search" \
  -H 'Content-Type: application/json' \
  -d '{"size":0,"aggs":{"codes":{"terms":{"field":"wazuh.rule.compliance.pci_dss","size":5000}}}}'

# 2) Scripted terms agg reading _source — also 0 buckets; a terms-agg script
#    only has access to doc-values (doc[...]), not params._source
curl -sk -u "$WAZUH_AUTH" -X POST "$WAZUH_HOST/wazuh-threatintel-rules/_search" \
  -H 'Content-Type: application/json' \
  -d '{"size":0,"aggs":{"codes":{"terms":{"script":{"source":"params._source?.wazuh?.rule?.compliance?.pci_dss"},"size":5000}}}}'

# 3) Runtime field (search-time or index-mapping-time) — rejected outright on
#    some OpenSearch builds with a parsing_exception / mapper_parsing_exception
curl -sk -u "$WAZUH_AUTH" -X PUT "$WAZUH_HOST/wazuh-threatintel-rules/_mapping" \
  -H 'Content-Type: application/json' \
  -d '{"runtime":{"compliance_pci_dss":{"type":"keyword","script":{"source":"def list = params._source?.wazuh?.rule?.compliance?.pci_dss; if (list != null) { for (def v : list) { emit(v); } }"}}}}'
```

**Bottom line:** the aggregation syntax above is correct and _does_ work
against `wazuh-findings-v5*` (where `wazuh.rule.compliance.*` is a real mapped
field — see section 3). Against the rules index specifically, the scroll in
section 4 is the only reliable way to enumerate compliance codes unless the
index mapping is fixed to index `compliance` as a proper field.

## 5. Inspect a raw sample document

To double check field paths yourself against a live document:

```bash
curl -sk -u "$WAZUH_AUTH" -X POST "$WAZUH_HOST/wazuh-findings-v5*/_search?size=1" \
  -H 'Content-Type: application/json' \
  -d '{"query":{"exists":{"field":"wazuh.rule.compliance"}}}' \
  | jq '.hits.hits[0]._source.wazuh.rule.compliance'
```

## Simplest option

Instead of hand-rolling `curl`, just run the script this document accompanies:

```bash
node scripts/audit-compliance-requirements.js --host "$WAZUH_HOST" --username admin --password admin --size 5000
```
