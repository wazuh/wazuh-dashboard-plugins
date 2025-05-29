# Sample data generator

This is a utility for generating sample data for Wazuh.

The code is based in a feature included in the Wazuh plugin for Wazuh dashboard.

A command line interface was created to use it.

## Requirements

- Node.js

## Usage

Use `--help` or `--examples` to show the help or examples, respectively.

```sh
node cli.js [options]
```

## Use cases

Generate sample data for the `states-inventory-hardware` index, using
the Bulk API format and save the output to a file.

Requirements:

- jq
- cURL

0. Define the variable to use in the steps:

```sh
export SAMPLE_DATA_DATASET_DIR="../../plugins/main/server/lib/sample-data/dataset"
export SAMPLE_DATA_DATASET_DIR_NAME="states-inventory-hardware"
export SAMPLE_DATA_INDEX_PATTERN_NAME="wazuh-states-inventory-hardware-sample-data"
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

1. Generate the sample data

```sh
node cli.js \
    --dataset $SAMPLE_DATA_DATASET_DIR_NAME \
    --format bulk-api \
    --index $SAMPLE_DATA_INDEX_PATTERN_NAME > output.ndjson
```

> Note: if you pretend to use the sample data in a Wazuh dashboard, you should do the cluster name field matches with the value that you are using. Add the flag `--param-cluster-name VALUE` and/or `--param-manager-name VALUE` replacing the `VALUE` with the expected values.

2. Optional. If you pretend to use the data in the Wazuh dashboard or some dashboard for OpenSearch or Kibana you could need the index has a specific mappings.

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
