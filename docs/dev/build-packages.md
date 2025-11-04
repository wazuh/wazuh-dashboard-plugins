# How to generate a package

## Step by step

This section shows how to build the DEB or RPM Wazuh dashboard package locally using NVM and Yarn.

Requirements:

Ensure that these dependencies are installed on the system.

- **Docker**: refer to the [Docker installation guide](https://docs.docker.com/engine/install/)
- **nvm (node version manager)**: refer to the [NVM installation guide](https://github.com/nvm-sh/nvm#installing-and-updating)
- **yarn v1.22.22 (node version manager)**: refer to the [Yarn installation guide](https://classic.yarnpkg.com/en/docs/install/)
- **Utilities**. Ensure that the following are installed:
  - `zip`
  - `unzip`
  - `gzip`
  - `brotli`
  - `curl`
  - `jq`

### Generating zip packages

To use the `build-packages.sh` script, you first need to generate the packages from these repositories:

- `wazuh-dashboard`
- `wazuh-security-dashboards-plugin`
- `wazuh-dashboard-plugins`
- `wazuh-dashboard-reporting`
- `wazuh-dashboard-security-analytics`

Follow the steps below to build the packages:

1. Clone the [wazuh-dashboard](https://github.com/wazuh/wazuh-dashboard) repository, navigate to the `wazuh-dashboard/` directory, and build the application:

> Replace the `GIT_REF` by the Wazuh dashboard branch or tag in the `wazuh-dashboard` repository, e.g. `v5.0.0`.

```bash
GIT_REF=<REPLACE_PLACEHOLDER>
git clone -b $GIT_REF https://github.com/wazuh/wazuh-dashboard.git && cd wazuh-dashboard/
nvm install $(cat .nvmrc)
nvm use $(cat .nvmrc)
yarn osd bootstrap
yarn build-platform --linux --skip-os-packages --release
```

> Note: for `arm` architecture uses `--linux-arm` instead of `--linux`.

2. Clone the [wazuh-security-dashboards-plugin](https://github.com/wazuh/wazuh-security-dashboards-plugin.git) repository in the `wazuh-dashboard/plugins` folder and build the plugin:

> Run the following commands while in the `wazuh-dashboard/` directory.
> Replace the `GIT_REF` by the branch or tag for the security plugin, e.g. `v5.0.0`.

```bash
cd plugins/
git clone -b $GIT_REF https://github.com/wazuh/wazuh-security-dashboards-plugin.git
cd wazuh-security-dashboards-plugin/
yarn
yarn build
```

3. Clone the [wazuh-dashboard-plugins](https://github.com/wazuh/wazuh-dashboard-plugins.git) repository in the `wazuh-dashboard/plugins` folder, move into the `wazuh-dashboard-plugins/` folder, and build the plugins:

> The yarn build command requires an entry specifying the OpenSearch Dashboard version. This version can be obtained from the `package.json` file of the plugin.
> Replace the `GIT_REF` by the branch or tag for the Wazuh dashboard plugins, e.g. `v5.0.0`.

```bash
GIT_REF=<REPLACE_PLACEHOLDER>
cd ../
git clone -b $GIT_REF https://github.com/wazuh/wazuh-dashboard-plugins.git
cd wazuh-dashboard-plugins/
nvm install $(cat .nvmrc)
nvm use $(cat .nvmrc)
cp -r plugins/* ../
cd ../main
yarn
GIT_REF=$GIT_REF OPENSEARCH_DASHBOARDS_VERSION=$(jq -r .pluginPlatform.version package.json) yarn build
cd ../wazuh-core/
yarn
OPENSEARCH_DASHBOARDS_VERSION=$(jq -r .pluginPlatform.version package.json) yarn build
cd ../wazuh-check-updates/
yarn
OPENSEARCH_DASHBOARDS_VERSION=$(jq -r .pluginPlatform.version package.json) yarn build
```

4. Clone the [wazuh-dashboard-reporting](https://github.com/wazuh/wazuh-dashboard-reporting.git) repository in the `wazuh-dashboard/plugins` folder, move into the `wazuh-dashboard-reporting/` folder, and build the plugin:

> The yarn build command requires an entry specifying the OpenSearch Dashboard version. This version can be obtained from the `package.json` file of the plugin.
> Replace the `GIT_REF` by the branch or tag for the Wazuh reporting plugin, e.g. `v5.0.0`.

```bash
GIT_REF=<REPLACE_PLACEHOLDER>
cd ../
git clone -b $GIT_REF https://github.com/wazuh/wazuh-dashboard-reporting.git
cd wazuh-dashboard-reporting/
yarn
yarn build
```

5. Clone the [wazuh-dashboard-security-analytics](https://github.com/wazuh/wazuh-dashboard-security-analytics.git) repository in the `wazuh-dashboard/plugins` folder, move into the `wazuh-dashboard-security-analytics/` folder, and build the plugin:

> The yarn build command requires an entry specifying the OpenSearch Dashboard version. This version can be obtained from the `package.json` file of the plugin.
> Replace the `GIT_REF` by the branch or tag for the Wazuh security analytics plugin, e.g. `v5.0.0`.

```bash
GIT_REF=<REPLACE_PLACEHOLDER>
cd ../
git clone -b $GIT_REF https://github.com/wazuh/wazuh-dashboard-security-analytics.git
cd wazuh-dashboard-security-analytics/
yarn
yarn build
```

6. Zip the packages and move them to the packages folder

```bash
cd ../../../
mkdir packages
cd packages
WZD_ZIPPED_PACKAGES_DIR=$(pwd)
zip -r -j ./dashboard-package.zip ../wazuh-dashboard/target/opensearch-dashboards-3.*.*-linux-x64.tar.gz
zip -r -j ./security-package.zip ../wazuh-dashboard/plugins/wazuh-security-dashboards-plugin/build/security-dashboards-3.*.*.0.zip
zip -r -j ./reporting-package.zip ../wazuh-dashboard/plugins/wazuh-dashboard-reporting/build/reportsDashboards-3.*.*.zip
zip -r -j ./security-analytics-package.zip ../wazuh-dashboard/plugins/wazuh-dashboard-security-analytics/build/security-analytics-dashboards-3.*.*.0.zip
zip -r -j ./wazuh-package.zip ../wazuh-dashboard/plugins/wazuh-check-updates/build/wazuhCheckUpdates-3.*.*.zip ../wazuh-dashboard/plugins/main/build/wazuh-3.*.*.zip ../wazuh-dashboard/plugins/wazuh-core/build/wazuhCore-3.*.*.zip
ls
```

After completing the previous steps, you will have three packages in the packages folder:

- `dashboard-package.zip`
- `reporting-package.zip`
- `security-analytics-package.zip`
- `security-package.zip`
- `wazuh-package.zip`

7. Run the `build-packages.sh` script in the `dev-tools/build-packages/` folder of the `wazuh-dashboard` repository. The script requires the following parameters:

- `-c`, `--commit-sha`: Commit SHA identifier for the build (see [Generating commit SHA](#generating-commit-sha) below).
- `-r`: Revision of the package.
- `--deb` or `--rpm`: Distribution of the package.
- `-a`: Path to the `wazuh-package.zip`.
- `-b`: Path to the `dashboard-package.zip`.
- `-r`: Path to the `reporting-package.zip`.
- `-s`: Path to the `security-package.zip`.
- `-sa`: Path to the `security-analytics-package.zip`.

```bash
cd ../wazuh-dashboard/dev-tools/build-packages/
./build-packages.sh --commit-sha <COMMIT_SHA> -r <REVISION> --<DISTRIBUTION> -b file://$WZD_ZIPPED_PACKAGES_DIR/dashboard-package.zip -a file://$WZD_ZIPPED_PACKAGES_DIR/wazuh-package.zip -rp file://$WZD_ZIPPED_PACKAGES_DIR/reporting-package.zip -s file://$WZD_ZIPPED_PACKAGES_DIR/security-package.zip  -sa file://$WZD_ZIPPED_PACKAGES_DIR/security-analytics-package.zip
```

Replace the placeholders as shown in the example below.

```bash
$ cd ../wazuh-dashboard/dev-tools/build-packages/
./build-packages.sh --commit-sha f05d58cce5-ec559ea-7aa1b2c86-8f60762-ff51705 -r 1 --deb -b file://$WZD_ZIPPED_PACKAGES_DIR/dashboard-package.zip -a file://$WZD_ZIPPED_PACKAGES_DIR/wazuh-package.zip -rp file://$WZD_ZIPPED_PACKAGES_DIR/reporting-package.zip -s file://$WZD_ZIPPED_PACKAGES_DIR/security-package.zip  -sa file://$WZD_ZIPPED_PACKAGES_DIR/security-analytics-package.zip
```

The script generates the package in the `output` folder of the same directory where it is located. To see the generated package, run the command: `ls output`.

### Generating commit SHA

1. Run the following command in each relevant repository to obtain individual SHAs. Ensure you are on the correct branch in each repository.

```bash
git rev-parse --short HEAD
```

| Repository                         | SHA variable                  |
| ---------------------------------- | ----------------------------- |
| wazuh-dashboard                    | DASHBOARD_COMMIT_SHA          |
| wazuh-dashboard-plugins            | PLUGINS_COMMIT_SHA            |
| wazuh-security-dashboards-plugin   | SECURITY_COMMIT_SHA           |
| wazuh-dashboard-reporting          | REPORTING_COMMIT_SHA          |
| wazuh-dashboard-security-analytics | SECURITY_ANALYTICS_COMMIT_SHA |

2. Concatenate individual SHAs in the following format. The resulting commit SHA is used for package versioning and build tracking.

```
<DASHBOARD_COMMIT_SHA>-<PLUGINS_COMMIT_SHA>-<SECURITY_COMMIT_SHA>-<REPORTING_COMMIT_SHA>-<SECURITY_ANALYTICS_COMMIT_SHA>
```

Example:

```
0c1f888bb4-46d76ffe0-ec559ea-8f60762-ff51705
```

```bash
cd wazuh-dashboard
DASHBOARD_COMMIT_SHA=$(git rev-parse --short HEAD)
PLUGINS_COMMIT_SHA=$(git -C plugins/wazuh-security-dashboards-plugin rev-parse --short HEAD)
SECURITY_COMMIT_SHA=$(git -C plugins/wazuh-dashboard-plugins rev-parse --short HEAD)
REPORTING_COMMIT_SHA=$(git -C plugins/wazuh-dashboard-reporting rev-parse --short HEAD)
SECURITY_ANALYTICS_COMMIT_SHA=$(git -C plugins/wazuh-dashboard-security-analytics rev-parse --short HEAD)
ALL_COMMIT_SHAS="$DASHBOARD_COMMIT_SHA-$PLUGINS_COMMIT_SHA-$SECURITY_COMMIT_SHA-$REPORTING_COMMIT_SHA-$SECURITY_ANALYTICS_COMMIT_SHA"
echo $ALL_COMMIT_SHAS
```

## Build with Docker image

With this option, you can create an image that has the package in `tar.gz` format, and then, if desired you can use the created package to generate the `deb` or `rpm` file.

Requirements:

Ensure that these dependencies are installed on the system.

- **Docker**: refer to [Docker installation guide](https://docs.docker.com/engine/install/).
- **Internet connection** to download the Docker images for the first time.
- **Utilities**: ensure the following are available:
  - `jq`
  - `curl`

### Building the Wazuh dashboard package using Docker

1. Clone the [wazuh-dashboard](https://github.com/wazuh/wazuh-dashboard) repository, navigate to the `wazuh-dashboard/dev-tools/build-packages/base-packages-to-base` directory, and build the application.

```bash
WAZUH_DASHBOARDS_BRANCH=<REPLACE_PLACEHOLDER>
git clone -b $WAZUH_DASHBOARDS_BRANCH https://github.com/wazuh/wazuh-dashboard.git
cd wazuh-dashboard/dev-tools/build-packages/base-packages-to-base/
```

2. Build the Docker image with the following parameters:

   - `NODE_VERSION`: Node version to use in the `.nvmrc` file.
   - `WAZUH_DASHBOARDS_BRANCH`: Branch of the Wazuh dashboards repository.
   - `WAZUH_DASHBOARDS_PLUGINS`: Branch of the Wazuh dashboards Plugins repository.
   - `WAZUH_SECURITY_DASHBOARDS_PLUGIN_BRANCH`: Branch of the Wazuh Security Dashboards Plugin repository.
   - `WAZUH_REPORTING_DASHBOARDS_PLUGIN_BRANCH`: Branch of the Wazuh reporting plugin repository.
   - `WAZUH_SECURITY_ANALYTICS_DASHBOARDS_PLUGIN_BRANCH`: Branch of the Wazuh Security Dashboards Plugin repository.
   - `OPENSEARCH_DASHBOARDS_VERSION`: Version of the OpenSearch Dashboards. You can find the version in the `package.json` file of the Wazuh dashboards repository.
   - `-t`: Tag of the image.

```bash
WAZUH_DASHBOARDS_BRANCH='<REPLACE_PLACEHOLDER>' && \
WAZUH_DASHBOARDS_PLUGINS='<REPLACE_PLACEHOLDER>' && \
WAZUH_SECURITY_DASHBOARDS_PLUGIN_BRANCH='<REPLACE_PLACEHOLDER>' && \
WAZUH_SECURITY_ANALYTICS_DASHBOARDS_PLUGIN_BRANCH='<REPLACE_PLACEHOLDER>' && \
WAZUH_REPORTING_DASHBOARDS_PLUGIN_BRANCH='<REPLACE_PLACEHOLDER>' && \
bash run-docker-compose.sh \
    --base $WAZUH_DASHBOARDS_BRANCH \
    --app $WAZUH_DASHBOARDS_PLUGINS \
    --reporting $WAZUH_REPORTING_DASHBOARDS_PLUGIN_BRANCH \
    --security $WAZUH_SECURITY_DASHBOARDS_PLUGIN_BRANCH \
    --securityAnalytics $WAZUH_SECURITY_ANALYTICS_DASHBOARDS_PLUGIN_BRANCH \
    --node-version 20.18.3
```

> Note: for `arm` package adds the `--arm` option.

The packages will be stored in `wazuh-dashboard/dev-tools/build-packages/base-packages-to-base/packages` directory.

3. Generate the system package

3.1 Prepare the `.zip` files

Create a `.zip` files with the generated packages:

```bash
cd ..
WZD_ZIPPED_PACKAGES_DIR="$(pwd)/zipped_packages"
mkdir -p "$WZD_ZIPPED_PACKAGES_DIR"
zip -r -j "$WZD_ZIPPED_PACKAGES_DIR/dashboard-package.zip" base-packages-to-base/packages/wazuh-dashboard/opensearch-dashboards-3.*.*-linux-x64.tar.gz
zip -r -j "$WZD_ZIPPED_PACKAGES_DIR/security-package.zip" base-packages-to-base/packages/wazuh-security-dashboards-plugin/security-dashboards-3.*.*.0.zip
zip -r -j "$WZD_ZIPPED_PACKAGES_DIR/reporting-package.zip" base-packages-to-base/packages/wazuh-dashboards-reporting/reportsDashboards-3.*.*.zip
zip -r -j "$WZD_ZIPPED_PACKAGES_DIR/security-analytics-package.zip" base-packages-to-base/packages/wazuh-security-analytics-plugin/security-analytics-dashboards-3.*.*.0.zip
zip -r -j "$WZD_ZIPPED_PACKAGES_DIR/wazuh-dashboard-plugins-package.zip" base-packages-to-base/packages/wazuh-dashboard-plugins/wazuhCheckUpdates-3.*.*.zip base-packages-to-base/packages/wazuh-dashboard-plugins/wazuh-3.*.*.zip base-packages-to-base/packages/wazuh-dashboard-plugins/wazuhCore-3.*.*.zip
```

3.2 Build the system package

Replace the file path to the generated packages in the previous step.

```bash
bash build-packages.sh \
    -a file://$WZD_ZIPPED_PACKAGES_DIR/wazuh-dashboard-plugins-package.zip \
    -b file://$WZD_ZIPPED_PACKAGES_DIR/dashboard-package.zip \
    -s file://$WZD_ZIPPED_PACKAGES_DIR/security-package.zip \
    -rp file://$WZD_ZIPPED_PACKAGES_DIR/reporting-package.zip \
    -sa file://$WZD_ZIPPED_PACKAGES_DIR/security-analytics-package.zip \
    --revision 2 --deb --silent
```

Use one of to define the distribution:

- `--deb`: build the .deb package
- `--rpm`: build the .rpm package

Use `--arm` for ARM64 architecture. By default, this is `AMD64`.

The output package will be stored at `wazuh-dashboard/dev-tools/build-packages/output`.
