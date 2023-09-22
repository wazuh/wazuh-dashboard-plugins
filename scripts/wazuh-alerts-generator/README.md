# Wazuh alerts generator

This is a utility for generating sample Wazuh security alerts. 

The code is based in a feature included in the Wazuh plugin for Wazuh dashboard.

A command line interface was created to use it.

## Requirements

- Node.js or Docker

## Usage

Use `--help` or `--examples` to show the help or examples, respectively.

```sh
node cli.js [options]
```

### Usage with Docker

If you want to use Docker, use this command to create and access the container:


```sh
docker run -it --rm \
    --name wazuh-alerts-generator \
    --workdir "/home/node/app" \
    --volume "$(pwd):/home/node/app" \
    node:lts-alpine /bin/sh
```

Then, use the command line interface as usual: `node cli.js --help`.

You can also run the tool directly with Docker:

```sh
docker run --rm \
    --workdir "/home/node/app" \
    --volume "$(pwd):/home/node/app" \
    node:lts-alpine node cli.js <options>
```

Replace `<options>` with valid CLI options.

- Show the help:

    ```sh
    docker run --rm \
        --workdir "/home/node/app" \
        --volume "$(pwd):/home/node/app" \
        node:lts-alpine node cli.js --help
    ```

- Show the examples:

    ```sh
    docker run --rm \
        --workdir "/home/node/app" \
        --volume "$(pwd):/home/node/app" \
        node:lts-alpine node cli.js --examples
    ```

## Use cases

Generate sample alerts for all modules, for the `wazuh-alerts-4.x-sample` index, using 
the Bulk API format and save the output to a file:

```sh
docker run --rm -w "/home/node/app" -v "$(pwd):/home/node/app" node:lts-alpine \
    node cli.js \
    --all-modules \
    --format bulk-api \
    --index wazuh-alerts-4.x-sample > output.ndjson
```

Insert the data into the index, using the Bulk API:

- Without authentication (HTTP):
    ```sh
    curl <server_address>/_bulk -H "Content-Type: application/x-ndjson" --data-binary "@output.ndjson"
    ```

- With authentication (HTTPS):
    ```sh
    curl -k -u <username>:<password> <server_address>/_bulk -H "Content-Type: application/x-ndjson" --data-binary "@output.ndjson"
    ```

Replace the placeholders.