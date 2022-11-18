# Frontend development environments

Install [Docker Desktop][0] as per its instructions, available for Windows, Mac 
and Linux (Ubuntu, Debian & Fedora).
This ensures that the development experience between Linux, Mac and Windows is as
similar as possible.

> IMPORTANT: be methodic during the installation of Docker Desktop, and proceed
step by step as described in their documentation. Make sure that your system
meets the system requirements before installing Docker Desktop, and read any 
post-installation note, specially on Linux: [Differences between 
Docker Desktop for Linux and Docker Engine](https://docs.docker.com/desktop/install/linux-install/#differences-between-docker-desktop-for-linux-and-docker-engine)

In general, the environment consist of:

- Lightweight monitoring stack based on [Grafana][1], [Loki][2] and [Prometheus][3].
- Dockerized development environments.
- Release and pre-release Docker images for testing.

## Pre-requisites

> **IMPORTANT**: you will need 2 copies of the Wazuh Kibana App repository, one 
> for the Docker environments, and other one for the plugin source code in the
> required branch (`4.x-7.16`, `4.x-wzd`, ...). Our recommendation is:
> 
>  - **wazuh-kibana-docker** : on the master branch.
>  - **wazuh-kibana-app**    : on any development branch. This one will be used 
>                              as source code and mounted as volume in the 
>                              platform's container.
>
> In future releases, the containers (`4.5`) and higher, we expect that every 
> development branch will contain this folder and this duplication won't be
> necessary anymore.

 1. Create the `devel` network:

    ```bash
    docker network create devel
    ```

 2. Create the `mon` network:

    ```bash
    docker network create mon
    ```

 3. Install the Docker driver Loki, from [Grafana][1], used to read logs from 
 the containers:

    ```bash
    docker plugin install grafana/loki-docker-driver:latest --alias loki --grant-all-permissions
    ```
 4. Assign resources to [Docker Desktop][0]. The requirements for the 
 environments are:
    - 8 GB of RAM (minimum)
    - 4 cores

    The more resources the better ☺
 
 5. Save the path to the Wazuh App code as an environment variable, by exporting
 this path on your `.bashrc`, `.zhsrc` or similar.

    ```bash
    # ./bashrc
    export WZ_HOME=~/your/path/to/wazuh_kibana_app
    ```
    Save and re-login or restart your terminal to apply the changes. Test that the variable has been set with:

    ```bash
    echo $WZ_HOME
    ```

 6. Set up user permissions

    The Docker volumes will be created by the internal Docker user, making them
    read-only. To prevent this, a new group named `docker-desktop` and GUID 100999 
    needs to be created, then added to your user and the source code folder:

    ```bash
    sudo groupadd -g 100999 docker-desktop
    sudo useradd -u 100999 -g 100999 -M docker-desktop
    sudo chown -R $USER:docker-desktop $WZ_HOME
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

This brings up a Dev environment for OpenSearch `1.2.4` and opensearch-dashboards 
`1.2.0`, with the `wazuh-kibana-app` development branch set up at 
`$WZ_HOME`:

```bash
./dev.sh 1.2.4 1.2.0 $WZ_HOME up
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

To setup the crendentials (**this only has to be done once**):

1. Login to Quay.io and navigate to User Settings.
2. Click on `CLI Password: Generate Encrypted Password`
3. In the new window that opens, click on `Docker Configuration` and follow the steps.


To build an image, use the docker build command like:

```bash
cd images
docker build -t quay.io/wazuh/image-name:version -f image-name-version.Dockerfile .
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








[0]: <https://docs.docker.com/get-docker/> "Docker Desktop"
[1]: <https://grafana.com/> "Grafana"
[2]: <https://grafana.com/oss/loki/> "Loki"
[3]: <https://prometheus.io/docs/visualization/grafana/> "Prometheus"
[4]: <https://quay.io/organization/wazuh> "quay.io/wazuh"
[5]: <https://github.com/wazuh/wazuh-kibana-app/issues/3872#issuecomment-1305507626> "App permissions"