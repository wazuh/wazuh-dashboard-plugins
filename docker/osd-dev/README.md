# Wazuh development with Wazuh Stack

## Requirements

- vm.max_map_count=262144

  To modify the vm.max_map_count, you can run this command:
  `sudo sysctl -w vm.max_map_count=262144`

- jq

  To install jq, you can run this command:

  - In Debian/Ubuntu os:
    `sudo apt-get install jq`
  - In RedHat/CentOS:
    `sudo yum install jq`
  - In Arch:
    `sudo pacman -Sy --noconfirm jq`
  - In MAC:
    `brew install jq`

## Usage

Use always the provided script to bring up or down the development
environment. For example:

```bash
./dev.sh [-o <os_version>] [-d <osd_version>] [-a <agents_up>] <wazuh_app_src> <action> [<mode>] [<server_version>]
```

### Parameters

- -o <os_version> : (Optional) Specifies the OpenSearch version. If not provided, it's obtained from plugins/wazuh-core/package.json .
- -d <osd_version> : (Optional) Specifies the OpenSearch Dashboards version. If not provided, it's obtained from plugins/wazuh-core/package.json .
- -a <agents_up> : (Optional) Relevant when using server-local mode. Specifies agent deployment:
  - rpm : Deploys an RPM-based agent.
  - deb : Deploys a DEB-based agent.
  - without : Deploys no agents.
  - If this option is not used with server-local mode (or an empty string is provided), the default agent configuration for the server-local profile is used ( 2 agents, one RPM-based and one DEB-based ).
- <wazuh_app_src> : (Required) Absolute path to the Wazuh Dashboard plugins source code (e.g., /absolute/path/to/wazuh-dashboard-plugins ). The script checks that the path is absolute.
- <action> : (Required) The action to perform:
  - up : Brings up the environment.
  - down : Stops the environment and removes volumes.
  - stop : Stops the services.
  - start : Starts previously stopped services.
- <mode> : (Optional) Specifies the deployment mode. Can be one of:
  - saml : Deploys a SAML-enabled environment with KeyCloak IDP.
    - Note for SAML : You need to add idp to your hosts file ( /etc/hosts on Linux/macOS, C:\Windows\System32\drivers\etc\hosts on Windows) pointing to 127.0.0.1 . Also, based on previous configurations, KeyCloak IDP might need to be started with the --no-base-path option.
    ```
    # Example entry in /etc/hosts
    127.0.0.1 idp
    ```
  - server : Deploys an environment with a real Wazuh server. Requires <server_version> .
  - server-local : Deploys an environment with a local Wazuh server package. Requires <server_version> (which will be used as IMAGE_TAG ).
    - **Important for `server-local` mode**: You must place the Wazuh manager installation packages (`.deb` file) in a folder named `manager` within the `wazuh-dashboard-plugins/docker/osd-dev/` directory. Similarly, any Wazuh agent installation packages (`.rpm` or/and `.deb` files) should be placed in a folder named `agents` within the same directory. These packages will be used to build the local server and agent images.
  - If omitted, a standard development environment is deployed (profile standard ).
- <server_version> : (Optional) Required if <mode> is server or server-local .
  - For server mode: Specifies the Wazuh release version (e.g., 4.7.2 ) to be used for the WAZUH_STACK variable.
  - For server-local mode: Specifies the image tag (e.g., my-custom-image ) for the local server build, to be used for the IMAGE_TAG variable.

### Examples

Standard environment:

```
./dev.sh /absolute/path/to/wazuh-dashboard-plugins up
```

With specific OpenSearch/OSD versions:

```
./dev.sh -o 2.11.0 -d 2.11.0 /absolute/path/to/wazuh-dashboard-plugins up
```

SAML-enabled environment:

```
./dev.sh /absolute/path/to/wazuh-dashboard-plugins up saml
```

Environment with a real Wazuh server:

```
./dev.sh /absolute/path/to/wazuh-dashboard-plugins up server 4.7.2
```

Environment with a local Wazuh server build and DEB agent:

```
./dev.sh -a deb /absolute/path/to/wazuh-dashboard-plugins up server-local my-custom-tag
```

Environment with a local Wazuh server build and no agents:

```
./dev.sh -a without /absolute/path/to/wazuh-dashboard-plugins up server-local my-custom-tag
```

Important Note about Plugin Version:

The script will not select the appropriate version of the wazuh-dashboard-plugins to use, so be sure to check out the appropriate version before bringing up the environment!

### UI Credentials

The default user and password to access the UI at https://0.0.0.0:5601/ are:

```
admin:admin
```

## Notes

`Wazuh Indexer` and `Wazuh Dashboard` are both a redistribution of a
version of the OpenSearch Stack. We will only create environments for
the versions of OpenSearch which will be included into a Wazuh
version.

We must use official `Wazuh Indexer` and `Wazuh Dashboard` images for
testing!

This environment will start a working deployment with:

- Imposter - a mock server.
- Elasticsearch-exporter - Elasticsearch metrics to Prometheus adapter.
- OpenSearch single-node cluster.
- OpenSearch Dashboards development environment.
  The OpenSearch Dashboards development environment includes an already
  bootstrapped Kibana, with all the node modules precompiled and ready to
  use in a development session.
