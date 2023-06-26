# Wazuh alerts generator

This is an utility to generate sample data related to Wazuh alerts.

The code is based in a feature included in the Wazuh plugin for Kibana or Wazuh dashboard.

A command line interface was created to use it.

## Requirements

- NodeJS

## Usage

```sh
node cli.js [options]
```

- Help

```sh
node cli.js --help
```

- Examples:

```sh
node cli.js --examples
```

## Usage with Docker

### Develop

If want to use Docker to develop:

1. Create a container with:

```sh
docker run -itd --rm --name wazuh-alerts-generator -w "/home/node/app" -v "$(pwd):/home/node/app" node:14.15-alpine3.13
```

2. Access to the container with:

```sh
docker exec -it wazuh-alerts-generator sh
```

### Use

Generic command:

```
docker run --rm -w "/home/node/app" -v "$(pwd):/home/node/app" node:14.15-alpine3.13 node cli.js <options>
```

Replace the `<options>` placeholder.

See the help:

```sh
docker run --rm -w "/home/node/app" -v "$(pwd):/home/node/app" node:14.15-alpine3.13 node cli.js --help
```

See the examples:

```sh
docker run --rm -w "/home/node/app" -v "$(pwd):/home/node/app" node:14.15-alpine3.13 node cli.js --examples
```

Use case example:

- Generate alerts for all the modules formatted to Bulk API of Elasticsearch or OpenSearch, pointing the documents to `wazuh-alerts-4.x-sample` index and save to `output.ndjson` file

```sh
docker run --rm -w "/home/node/app" -v "$(pwd):/home/node/app" node:14.15-alpine3.13 node cli.js --all-modules --format bulk-api --index wazuh-alerts-4.x-sample > output.ndjson
```

# Use cases

## How to create sample data and index to an existent Elasticsearch, OpenSearch or Wazuh indexer instance

1. Generate the sample data using Wazuh alerts generator with the `bulk-api` format and save the output to a file:
```sh
node cli.js --format bulk-api <options> > output.json
```
where `<options>` is the rest of options

2. Index the data through the Bulk API to Elasticsearch, OpenSearch or Wazuh indexer instance
- Server doesn't need authentication and it is served in http:
```sh
curl <server_address>/_bulk -H "Content-Type: application/x-ndjson" --data-binary "@output.ndjson"
```

- Server needs authentication and it is served in https:
```sh
curl -k -u <username>:<password> <server_address>/_bulk -H "Content-Type: application/x-ndjson" --data-binary "@output.ndjson"
```

Replace the placeholders.