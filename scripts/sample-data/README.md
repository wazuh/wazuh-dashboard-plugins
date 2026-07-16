# Sample data generator

This is a utility for generating sample data for Wazuh.

The code is based in a feature included in the Wazuh plugin for Wazuh dashboard.

A command line interface was created to use it.

## Requirements

- Node.js
- cURL and jq, only needed for the manual flow described in
  [Use case: dataset with no default index](#use-case-dataset-with-no-default-index)

## Usage

Use `--help` to show the full usage message, including all options and examples.

```sh
node cli.js [options]
```

## Datasets

There are two kinds of dataset, both used the same way from this CLI:

- **Synthesized** (e.g. `states-fim-files`, `metrics-agents`): generate fresh
  random documents on every call.
- **Pre-generated findings** (prefixed `findings-`, e.g. `findings-aws`): load
  documents from the dataset's `.json`/`.ndjson` files, adjust their
  timestamps and inject the manager/cluster params. `--count` cycles over the
  base documents.

To list the available datasets: `node cli.js --help`, or:

```sh
find ../../plugins/main/server/lib/sample-data/dataset -maxdepth 1 -type d -exec basename {} \;
```

### Default index per dataset

A dataset can declare a default index by exporting `DATASET_INDEX` from its
`main.js`. Every `findings-*` dataset declares one, always suffixed with
`-sample` (e.g. `wazuh-findings-v5-sample`, `wazuh-findings-v5-cloud-services-sample`)
so sample data never lands in the same index name a real deployment would
use. Synthesized datasets (`states-*`, `metrics-*`, `wazuh-events`) don't
declare a default index, so an index must be supplied explicitly.

For `bulk-api`/`insert` output, the index used per dataset is resolved as:

1. `--index <name>`, if given — overrides every dataset's default.
2. Otherwise, the dataset's own `DATASET_INDEX`.
3. If neither is available, that dataset fails validation before anything is generated.

### Index mapping (`template.json`)

Every dataset directory also has a `template.json` (an index template
document: `index_patterns`, `priority`, and a `template` with `settings` and
`mappings`). All `findings-*` datasets currently share the same
`template.json`. This is the mapping the index should be created with so
documents match what the Wazuh dashboard expects, instead of relying on
dynamic/auto-mapping.

## Options

Run `node cli.js --help` for the authoritative, up-to-date list of options,
available datasets and examples. In summary:

- `--dataset <name>` / `--all` / `--all-findings` — choose what to generate (mutually exclusive).
- `--count <number>` — documents per dataset (default: 100).
- `--format <ndjson|bulk-api>` — output format (default: `ndjson`).
- `--index <name>` — override the resolved index for every dataset (bulk-api only).
- `--output <file>` — write the result to a file instead of stdout.
- `--output insert` — generate, create missing indices from `template.json`,
  and insert directly into the indexer (see below). Forces `--format bulk-api`.
- `--param-cluster-name`, `--param-cluster-node` — override the generated `wazuh.cluster` fields.

## Use cases

### Use case: generate and insert directly (`--output insert`)

This is the simplest flow for any dataset that has a default index (all
`findings-*` datasets, or any dataset combined with `--index`). It requires
`SAMPLE_DATA_SERVER_ADDRESS`, `SAMPLE_DATA_USERNAME` and
`SAMPLE_DATA_USER_PASSWORD` environment variables (missing ones are prompted
for interactively).

```sh
export SAMPLE_DATA_SERVER_ADDRESS="https://localhost:9200"
export SAMPLE_DATA_USERNAME="admin"
export SAMPLE_DATA_USER_PASSWORD="admin"

node cli.js --dataset findings-sca --count 50 --output insert
# or for every findings dataset at once:
node cli.js --all-findings --output insert
```

For each target index, the CLI:

1. Checks whether the index already exists.
2. If it doesn't, creates it using the settings/mappings from the dataset's
   `template.json` (falling back to letting the indexer create it with
   dynamic mapping if the dataset has no `template.json`).
3. Inserts the generated documents using the Bulk API, in batches, logging
   every request/response (credentials redacted) to a file under `./logs`.

> Note: if you intend to browse the sample data in a Wazuh dashboard, make
> sure the cluster name field matches the value you are using. Add
> `--param-cluster-name VALUE` with the expected value.

### Use case: dataset with no default index

Datasets without a declared `DATASET_INDEX` (e.g. `states-inventory-hardware`)
still work with `--output insert` as long as you pass `--index`. If you'd
rather build the request yourself — for example to save the payload to a
file first and inspect or reuse it — you can reproduce the same steps
manually:

0. Define the variables to use in the steps:

```sh
export SAMPLE_DATA_DATASET_DIR="../../plugins/main/server/lib/sample-data/dataset"
export SAMPLE_DATA_DATASET_DIR_NAME="states-inventory-hardware"
export SAMPLE_DATA_INDEX_PATTERN_NAME="wazuh-states-inventory-hardware-sample"
export SAMPLE_DATA_USERNAME="admin"
export SAMPLE_DATA_USER_PASSWORD="admin"
export SAMPLE_DATA_SERVER_ADDRESS="https://localhost:9200"
```

where:

- SAMPLE_DATA_DATASET_DIR: is the path to the datasets directories.
- SAMPLE_DATA_DATASET_DIR_NAME: is the directory name of the dataset. To see the available datasets: `find $SAMPLE_DATA_DATASET_DIR/ -maxdepth 1 -type d -exec basename {} \;`
- SAMPLE_DATA_INDEX_PATTERN_NAME: is the index name. If the data will be indexed to be used by Wazuh dashboard, this could need a specific name according to your index pattern configuration for the dataset to use.
- SAMPLE_DATA_USERNAME: username with priviliegies to create the index
- SAMPLE_DATA_USER_PASSWORD: user's password
- SAMPLE_DATA_SERVER_ADDRESS: server address of the Wazuh indexer, Opensearch or Elasticsearch including the protocol and port

1. Generate the sample data:

```sh
node cli.js \
    --dataset $SAMPLE_DATA_DATASET_DIR_NAME \
    --format bulk-api \
    --index $SAMPLE_DATA_INDEX_PATTERN_NAME > output.ndjson
```

2. Create the index with the dataset's mapping, so it matches what the Wazuh
   dashboard (or any OpenSearch/Kibana dashboard) expects:

- Without authentication (HTTP):

```sh
jq 'del(.index_patterns, .priority) | .template' $SAMPLE_DATA_DATASET_DIR/$SAMPLE_DATA_DATASET_DIR_NAME/template.json | curl -X PUT -k "$SAMPLE_DATA_SERVER_ADDRESS/$SAMPLE_DATA_INDEX_PATTERN_NAME" -H "Content-Type: application/json" -d @-
```

- With authentication (HTTPS):

```sh
jq 'del(.index_patterns, .priority) | .template' $SAMPLE_DATA_DATASET_DIR/$SAMPLE_DATA_DATASET_DIR_NAME/template.json | curl -X PUT -k -u $SAMPLE_DATA_USERNAME:$SAMPLE_DATA_USER_PASSWORD "$SAMPLE_DATA_SERVER_ADDRESS/$SAMPLE_DATA_INDEX_PATTERN_NAME" -H "Content-Type: application/json" -d @-
```

3. Insert the data into the index, using the Bulk API:

- Without authentication (HTTP):

  ```sh
  curl $SAMPLE_DATA_SERVER_ADDRESS/_bulk -H "Content-Type: application/x-ndjson" --data-binary "@output.ndjson"
  ```

- With authentication (HTTPS):

  ```sh
  curl -k -u $SAMPLE_DATA_USERNAME:$SAMPLE_DATA_USER_PASSWORD $SAMPLE_DATA_SERVER_ADDRESS/_bulk -H "Content-Type: application/x-ndjson" --data-binary "@output.ndjson"
  ```
