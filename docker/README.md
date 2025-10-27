# Frontend development environments

Install [Docker Desktop][0] as per its instructions (make sure that the docker compose version is 2.20.2 or higher), available for Windows, Mac
and Linux (Ubuntu, Debian & Fedora).
This ensures that the development experience between Linux, Mac and Windows is as
similar as possible.

> IMPORTANT: be methodic during the installation of Docker Desktop, and proceed
> step by step as described in their documentation. Make sure that your system
> meets the system requirements before installing Docker Desktop, and read any
> post-installation note, specially on Linux: [Differences between
> Docker Desktop for Linux and Docker Engine](https://docs.docker.com/desktop/install/linux-install/#differences-between-docker-desktop-for-linux-and-docker-engine)

In general, the environment consist of:

- Lightweight monitoring stack based on [Grafana][1], [Loki][2] and [Prometheus][3].
- Dockerized development environments.
- Release and pre-release Docker images for testing.

## Pre-requisites

1.  Create the `devel` network:

    ```bash
    docker network create devel
    ```

2.  Create the `mon` network:

    ```bash
    docker network create mon
    ```

3.  Install the Docker driver Loki, from [Grafana][1], used to read logs from
    the containers:

    ```bash
    docker plugin install grafana/loki-docker-driver:latest --alias loki --grant-all-permissions
    ```

4.  Assign resources to [Docker Desktop][0]. The requirements for the
    environments are:

    - 8 GB of RAM (minimum)
    - 4 cores

    The more resources the better ☺

5.  Save the paths to your plugin repositories as environment variables, so you can reference them easily when running the scripts.

        Our development workflow consists of a hybrid model: this repository contains some plugins (currently `main`, `wazuh-core`, `wazuh-check-updates`) while other plugins live in independent external Git repositories (e.g. `wazuh-dashboard-reporting`, `wazuh-security-dashboards-plugin`, etc.). The Docker helper scripts therefore support BOTH layouts:

        - Single checkout (all plugins under one root folder)
        - Multiple separate checkouts (each plugin cloned in its own folder anywhere in your filesystem)

    You can tell the scripts where your repositories are in two ways:

    1. Provide a base path ( `<default_repo_root>` argument ) so the script auto-detects INTERNAL repositories (`main`, `wazuh-core`, `wazuh-check-updates`) under `<base>`, `<base>/plugins`, or `<base>/<repo>`. If you omit a base path it will attempt to infer it (two levels up) when running from inside this repo.
    2. Use one or more `-r <repo>=<absolute_path>` flags ONLY for EXTERNAL plugin repositories that are not part of this repository. Internal plugins do NOT require `-r` and will be picked up automatically.

    Supported internal repository keys today: `main`, `wazuh-core`, `wazuh-check-updates`. External repositories you pass with `-r` will be dynamically mounted into the `osd` container via an auto-generated `dev.override.generated.yml` compose file (ignored by git). Adding a new internal repo requires extending the script.

        Quick example (adding an external plugin):
        ```bash
        ./dev.sh -o 2.11.0 -d 2.11.0 \
            -r wazuh-dashboard-reporting=$WZ_REPORTING up
        ```

    If you omit `<default_repo_root>` you no longer need to pass `-r` for the internal repos when you execute the script from this repository (auto-detection will infer the root). You only use `-r` for external plugins. If you pass `<default_repo_root>` you can still override one or more specific external paths with `-r`.

        (Note: The model is hybrid: some plugins live here and others will always be in separate repositories. For external ones use `-r repo_name=/absolute/path`.)

    For a single checkout that contains all plugins:

    ```bash
    # ./bashrc
    export WZ_HOME=~/path/to/wazuh-dashboard-plugins/plugins
    ```

    If you keep external plugins in separate repositories, export helpers for them so invoking `-r` is easy:

    ```bash
    export WZ_REPORTING=~/path/to/wazuh-dashboard-reporting
    export WZ_SECURITY=~/path/to/wazuh-security-dashboards-plugin
    ```

    Save and re-login or restart your terminal to apply the changes. Test that the variables have been set with:

    ```bash
    echo $WZ_HOME
    echo $WZ_REPORTING
    echo $WZ_SECURITY
    ```

6.  Set up user permissions

    The Docker volumes will be created by the internal Docker user, making them
    read-only. To prevent this, a new group named `docker-desktop` and GUID 100999
    needs to be created, then added to your user and the source code folder:

    ```bash
    sudo groupadd -g 100999 docker-desktop
    sudo useradd -u 100999 -g 100999 -M docker-desktop
    sudo chown -R $USER:docker-desktop $WZ_HOME  # or each individual repository path
    sudo usermod -aG docker-desktop $USER
    ```

## Understanding Docker contexts

Before we begin starting Docker containers, we need to understand the
differences between Docker Engine and Docker Desktop, more precisely, that the
use different contexts.

Carefully read these two sections of the Docker documentation:

- [Differences between Docker Desktop for Linux and Docker Engine](https://docs.docker.com/desktop/install/linux-install/#differences-between-docker-desktop-for-linux-and-docker-engine)
- [Switch between Docker Desktop and Docker Engine](https://docs.docker.com/desktop/install/linux-install/#context)

Docker Desktop will change to its context automatically at start, so be sure
that any existing Docker container using the default context is **stopped**
before starting Docker Desktop and any of the environments in this folder.

## Starting up the environments

Choose any of the [environments](#environments) available and use the `sh` script
to up the environment. Each script will guide you on how to use it, reporting
which parameters it needs, and the accepted values for each of them.

To see the usage of each script, just run it with no parameters.

Before starting the environment, check that the plugin is in the desired branch
(4.x-7.16, 4.x-wzd, ...).

Example:

> This brings up a Dev environment for OpenSearch `1.2.4` and opensearch-dashboards `1.2.0`, with the `wazuh-dashboard-plugins` development branch set up at `$WZ_HOME`

Multi-repository (external plugins mounted via `-r`):

```bash
./dev.sh -o 1.2.4 -d 1.2.0 \
    -r wazuh-dashboard-reporting=$WZ_REPORTING \
    -r wazuh-security-dashboards-plugin=$WZ_SECURITY up
```

Only external repositories (recommended minimal form when running inside this repo):

```bash
# Example adding two hypothetical external plugins
./dev.sh -o 1.2.4 -d 1.2.0 \
    -r wazuh-dashboard-reporting=$WZ_REPORTING \
    -r wazuh-security-dashboards-plugin=$WZ_SECURITY up
```

Single checkout (auto-detect internal plugins under a common root):

```bash
./dev.sh -o 1.2.4 -d 1.2.0 $WZ_HOME up
```

Auto-detection (inside repo, omitting root and flags for internal plugins):

```bash
./dev.sh -o 1.2.4 -d 1.2.0 up
```

Once the containers are up, **attach a shell to the development container**,
move to the `kbn\plugins\wazuh` and run `yarn` to install the dependencies of
the project. After that, move back to the root folder of the platform and run
`yarn start` to start the App.

The dependencies of the platform (Kibana \ OSD) are already installed, but it
might take a while to optimize all the bundles. We might include the cache in the
image in the future.

## Logging

Docker can write the container logs into a [Grafana Loki][2] instance using
the appropriate driver.

The environments are designed to use this driver, to work with them,
install the driver as described on the step 3 of [Prerequisites](#pre-requisites).

## Images

We use official Docker images whenever possible. To develop our
applications we have generated Docker images to develop applications
for Kibana and OpenSearch Dashboards.

These images can be downloaded from the [quay.io/wazuh][4] registry.

If you want to build an image, we recommend using a NPM cache server,
so the download of node modules from the network only happens once
while developing the image.

To start the NPM cache server:

```bash
cd cache
docker compose up -d
cd ..
```

To setup the credentials (**this only has to be done once**):

1. Login to Quay.io and navigate to User Settings.
2. Click on `CLI Password: Generate Encrypted Password`
3. In the new window that opens, click on `Docker Configuration` and follow the steps.

To build an image, use the docker build command like:

Use the `--build-arg` flag to specify the version of Node and the version of
the platform. The version of Node to use is defined in the `.nvmrc` file. Use
the Node version defined in that file for the target platform version, as the
version of Node might be increased between platform's versions.

For example, to build the image for OpenSearch Dashboards `2.6.0`:

```bash
cd images
docker build --build-arg NODE_VERSION=14.20.1 --build-arg OPENSEARCH_VERSION=2.6.0 -t quay.io/wazuh/osd-dev:2.6.0 -f osd-dev.Dockerfile .
cd ..
```

Push the image to Quay:

```bash
docker push quay.io/wazuh/image-name:version
```

If you're creating a new image, copy one of the ones already present
in the directory, and adapt it to the new version.

## [Imposter-cli](https://github.com/gatehill/imposter-cli)

### Prerequisites

You must have a [JVM](https://github.com/gatehill/imposter-cli/blob/main/docs/jvm_engine.md) installed.

### Install

If you have Homebrew installed:

```
brew tap gatehill/imposter
brew install imposter
```

Or, use this one liner (macOS and Linux only):

```
curl -L https://raw.githubusercontent.com/gatehill/imposter-cli/main/install/install_imposter.sh | bash -
```

### Use

```
imposter up -t jvm -p 8088
```

## Environments

### **mon** - monitoring environment

Folder: [mon/](./mon/)

This will bring up a [Grafana](https://grafana.com/) stack to collect
logs and metrics from the containers. Also, this will create the `mon`
network, which will be needed by the other environments.

If you don't want to bring up this environment, be sure to create the
`mon` network as it is required by other docker compose and scripts.

### **osd-dev** - OpenSearch Dashboards development environment

Folder: [osd-dev](./osd-dev/)

This will bring up a development environment for Wazuh using the given
OpenSearch and OpenSearch-Dashboards versions.

### **knb-dev** - Kibana 7.X & Kibana 8.X development environment

Folder: [kbn-dev](./kbn-dev/)

This will bring up a development environment for Wazuh using the
Kibana development container versions of the 7 series and 8 series.

### Wazuh 4.3.X testing environment with Elastic Stack

Folder: [wazuh-4.3-es](./wazuh-4.3-es)

Within this folder, there are two scripts:

- `rel.sh` brings up released versions
- `pre.sh` brings up unreleased versions

### Wazuh 4.3.X testing environment with wazuh-dashboard and wazuh-indexer

Folder: [wazuh-4.3-wz](./wazuh-4.3-wz)

Within this folder, there are two scripts:

- `rel.sh` brings up released versions
- `pre.sh` brings up unreleased versions

### Wazuh 4.2.X testing environment with Elastic Stack

Folder: [wazuh-4.2-es](./wazuh-4.2-es)

### Wazuh 4.2.X testing environment with OpenDistro

Folder: [wazuh-4.2-od](./wazuh-4.2-od)

### Wazuh 3.13.X testing environment with Elastic Stack

Folder: [wazuh-3.13.X-es](./wazuh-3.13.X-es)

### Wazuh 3.13.X testing environment with OpenDistro

Folder: [wazuh-3.13.X-od](./wazuh-3.13.X-od)

## Troubleshooting

1. Error pulling Docker image from Quay.io

```
error getting credentials - err: exit status 1, out: `error getting credentials - err: exit status 1, out: `no usernames for quay.io``
```

**Solution:** pull the image manually from [Quay][4] and try again.

2. `security_exception: action [indices:admin/settings/update] is unauthorized for user`

**Solution:** setup the permissions for the app as described [here][5].

[0]: https://docs.docker.com/get-docker/ 'Docker Desktop'
[1]: https://grafana.com/ 'Grafana'
[2]: https://grafana.com/oss/loki/ 'Loki'
[3]: https://prometheus.io/docs/visualization/grafana/ 'Prometheus'
[4]: https://quay.io/organization/wazuh 'quay.io/wazuh'
[5]: https://github.com/wazuh/wazuh-dashboard-plugins/issues/3872#issuecomment-1305507626 'App permissions'
