#!/bin/bash

# Check if Wazuh Kibana app branch is set
if [ -z ${1+x} ]; then
    echo "Wazuh Kibana app branch is not set. Leaving";
    exit 1;
fi

PACKAGE_NAME="${2:-wazuh}.zip"
echo "Cloning Wazuh Kibana app branch: $1"

mkdir /app \
    && cd /app \
    && curl -L https://github.com/wazuh/wazuh-kibana-app/tarball/$1 | tar xz \
    && cd "$(ls | grep wazuh)" \
    && npm install -y \
    && npm run build \
    && mv build/"$(ls build | grep wazuh)" /build/$PACKAGE_NAME

echo "Build finished in /build/$PACKAGE_NAME"