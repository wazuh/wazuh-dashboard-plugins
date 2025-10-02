# Wazuh development with Wazuh Stack

## Requirements

- vm.max_map_count=262144

  To modify the vm.max_map_count, you can run this command:
  `sudo sysctl -w vm.max_map_count=262144`

- jq

  To install jq, you can run this command:

  - In Debian/Ubuntu:
    `sudo apt-get install jq`
  - In RedHat/CentOS:
    `sudo yum install jq`
  - In Arch:
    `sudo pacman -Sy --noconfirm jq`
  - In macOS:
    `brew install jq`

## Usage

Always use the provided script to bring up or down the development environment. For example:

```bash
./dev.sh [-o <os_version>] [-d <osd_version>] [-a <agents_up>] [-r <repo>=<absolute_path> ...] [<default_repo_root>] <action> [<mode>] [<server_version>]
```

### Parameters

- -o <os_version> : (Optional) Specifies the OpenSearch version. If not provided, it's obtained from plugins/wazuh-core/package.json .
- -d <osd_version> : (Optional) Specifies the OpenSearch Dashboards version. If not provided, it's obtained from plugins/wazuh-core/package.json .
- -a <agents_up> : (Optional) Relevant when using server-local mode. Specifies agent deployment:
  - rpm : Deploys an RPM-based agent.
  - deb : Deploys a DEB-based agent.
  - without : Deploys no agents.
  - If this option is not used with server-local mode (or an empty string is provided), the default agent configuration for the server-local profile is used ( 2 agents, one RPM-based and one DEB-based ).
- -r <repo>=<path> : (Optional, repeatable) ONLY for external plugin repositories that are not stored inside this repository.
  - Internal repositories (`main`, `wazuh-core`, `wazuh-check-updates`) are auto-detected under a provided `<default_repo_root>`, under `<root>/plugins/`, or (when omitted) by inferring the repo root when the script is executed from within this repository.
  - External repositories passed with `-r` are dynamically added as volumes to the `osd` service via an auto-generated `dev.override.generated.yml` (git-ignored).
  - Paths MUST be absolute.
- <default_repo_root> : (Optional) Absolute path used as the base location for repositories. When provided, the script tries (in order) `<default_repo_root>/<repo>`, `<default_repo_root>/plugins/<repo>`, or `<default_repo_root>` if it itself matches the repo name.
- <action> : (Required) The action to perform:
  - up : Brings up the environment.
  - down : Stops the environment and removes volumes.
  - stop : Stops the services.
  - start : Starts previously stopped services.
- <mode> : (Optional) Specifies the deployment mode. Can be one of:
  - saml : Deploys a SAML-enabled environment with KeyCloak IDP.
    - Note for SAML : You need to add idp to your hosts file ( /etc/hosts on Linux/macOS, C:\Windows\System32\drivers\etc\hosts on Windows) pointing to 127.0.0.1 . Also, based on previous configurations, KeyCloak IDP might need to be started with the --no-base-path option.
    ```
    # Example entry in /etc/hosts
    127.0.0.1 idp
    ```
  - server : Deploys an environment with a real Wazuh server. Requires <server_version> .
  - server-local : Deploys an environment with a local Wazuh server package. Requires <server_version> (which will be used as IMAGE_TAG ).
    - **Important for `server-local` mode**: You must place the Wazuh manager installation packages (`.deb` file) in a folder named `manager` within the `wazuh-dashboard-plugins/docker/osd-dev/` directory. Similarly, any Wazuh agent installation packages (`.rpm` or/and `.deb` files) should be placed in a folder named `agents` within the same directory. These packages will be used to build the local server and agent images.
  - If omitted, a standard development environment is deployed (profile standard ).
- <server_version> : (Optional) Required if <mode> is server or server-local .
  - For server mode: Specifies the Wazuh release version (e.g., 4.7.2 ) to be used for the WAZUH_STACK variable.
  - For server-local mode: Specifies the image tag (e.g., my-custom-image ) for the local server build, to be used for the IMAGE_TAG variable.

If `<default_repo_root>` is omitted and you invoke the script from inside this repository, internal repositories are auto-detected. You only need `-r` for external plugins. You can still mix approaches: specify a `<default_repo_root>` and override one or more external repositories with `-r` if they live elsewhere.

Multi-repository context explanation:

The model is intentionally hybrid: this repository ships several core plugins, while other plugins live (and will continue to live) in their own, permanent external Git repositories. There is no plan to merge everything into a monorepo. For external plugins just point the script to their absolute paths. Example layout for external plugins:

```
~/dev/wazuh-dashboard-reporting
~/dev/wazuh-security-dashboards-plugin
```

Launch using explicit mappings for external plugins:

```bash
./dev.sh -r wazuh-dashboard-reporting=~/dev/wazuh-dashboard-reporting -r wazuh-security-dashboards-plugin=~/dev/wazuh-security-dashboards-plugin up
```

Or, with a single root checkout containing `plugins/`:

```bash
./dev.sh /absolute/path/to/wazuh-dashboard-plugins/plugins up
```

Note: The model is hybrid: some plugins are here and others will always be external. For external ones, specify them with `-r repo=/absolute/path`.

### Examples

Standard environment (single repository checkout):

```sh
./dev.sh /absolute/path/to/wazuh-dashboard-plugins/plugins up
```

Standard environment with extra external plugins:

```sh
./dev.sh -r wazuh-dashboard-reporting=/workspace/wazuh-dashboard-reporting -r wazuh-security-dashboards-plugin=/workspace/wazuh-security-dashboards-plugin up
```

Standard environment (auto-detect internal plugins when called from inside repo root):

```sh
./dev.sh up
```

With specific OpenSearch/OSD versions:

```sh
./dev.sh -o 2.11.0 -d 2.11.0 /absolute/path/to/wazuh-dashboard-plugins/plugins up
```

SAML-enabled environment:

```sh
./dev.sh /absolute/path/to/wazuh-dashboard-plugins/plugins up saml
```

Environment with a real Wazuh server:

```sh
./dev.sh /absolute/path/to/wazuh-dashboard-plugins/plugins up server 4.7.2
```

Environment with a local Wazuh server build and DEB agent:

```sh
./dev.sh -a deb /absolute/path/to/wazuh-dashboard-plugins/plugins up server-local my-custom-tag
```

Environment with a local Wazuh server build and no agents:

```sh
./dev.sh -a without /absolute/path/to/wazuh-dashboard-plugins/plugins up server-local my-custom-tag
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
