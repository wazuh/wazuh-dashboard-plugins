# Description
This Docker image builds the Wazuh Kibana app using a NodeJS 8.14.0 base image.
It can build images pre Kibana 7.10.x.

# Steps:
## 1. Build the Docker image
docker build . -t wazuh-kibana-app-builder

## 2. Create a target directory where place the builds
mkdir /build

## 3. Build an Wazuh Kibana app
docker run --rm -v `pwd`/build:/build wazuh-kibana-app-builder <WAZUH_KIBANA_APP_BRANCH/TAG> [WAZUH_APP_PACKAGE_NAME]

Notes:
    - replace <WAZUH_KIBANA_APP_BRANCH/TAG> by a repository branch or tag
    - app build is under `/build` container directory
    - use a volume to map host:container directory

# Examples:
docker run --rm wazuh-kibana-app-builder 4.0-7.9

docker run --rm wazuh-kibana-app-builder 4.0-7.9 wazuh-test-app