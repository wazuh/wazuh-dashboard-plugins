# Docker environment

## Containers
- Wazuh Manager with Filebeat (Cluster mode)
- OpenSearch
- Wazuh Agent

## Important
This environment requires an Active Directory server. This is hosted in a Windows Server.

For the builtin configuration you could use the Vagrant box which includes an Active Directory server: `cdaf/WindowsServerDC`.

Take in account the hostname/ip of the Active Directory server is used in the volume mounted as `/usr/share/opensearch/plugins/opensearch-security/securityconfig/config.yml`. You could need to ajust it to point to the AD server.

```rb
# -*- mode: ruby -*-
# vi: set ft=ruby :

winserver_ip = "172.18.1.2" # Static IP for the VM

Vagrant.configure("2") do |config|
  # config.ssh.insert_key = false # Uncomment this line if running Vagrant from WSL
  config.vm.box = "cdaf/WindowsServerDC"
  config.vm.network :private_network, ip: "#{winserver_ip}"
  config.vm.provider "virtualbox" do |pmv|
    pmv.name = "winserver"
    pmv.memory = 2048
    pmv.cpus = 2
  end
  config.vm.hostname = "winserver"
end
```

## Services

OpenSearch API: `https://CONTAINER_HOST_IP:9200`
Wazuh API: `https://CONTAINER_HOST_IP:55000`
Active Directory: `http://ACTIVE_DIRECTORY:389`

## How to use
| Command              | Description                            |
| -------------------- | -------------------------------------- |
| docker-compose up -d | Up environment                         |
| docker-compose stop  | Stop environment                       |
| docker-compose down  | Stop environment and remove containers |

## Connect OpenSearch

This environment doesn't provide of OpenSearch Dashboards. You need a OpenSearch Dashboards instance with the same version of OpenSearch.

Check the `config/opensearch_dashboards/opensearch_dashboards.yml` for a configuration example.

## Index data with Filebeat

Opensearch requires to enable the compatibility with Filebeat to the data can be indexed.

Set the OpenSearch setting `compatibility.override_main_response_version: true`. The environment sets the setting.

## Environment considerations
### Active Directory server 
Using the Vagrant box `cdaf/WindowsServerDC`

You can access to the server opening the VM in Virtualbox.

Credentials:
- `vagrant` user (`vagrant` password)
- `Administrator` user (`vagrant` password)

Manage the Active Directory configuration in `Windows start` > search for `Active Directory Users and Computers`. Here you can create users and groups.

The VM starts and stand in a screen which requires you push `CTRL + ALT + DELETE`. If you can't focus in the VM window, open the virual keyboard in `Input` > `Keyboard` > `Software Keyboard` and click in the `CTRL`, `ALT` and `DELETE` button, this simulates you push the combination keys and the VM screen will change to the password prompt where you could write.

The VM uses:
- keyboard layout: `ENG`
- system language: `ENG (New Zealand)`

If you need to change the keyboard layout, go to `Windows start` > `Configuration` > `Time & Language` > `Language` and add the keyboard layout.

### OpenSearch
The configuration files are based in the builtin configuration of the Active Directory server.

If the environment is correcly up, you can use the Active Directory users (`vagrant` and `Administrator`) to login in OpenSearch or OpenSearch Dashboards.

The `opensearch` container has a volume that defines the initial role mappings (`/usr/share/opensearch/plugins/opensearch-security/securityconfig/roles_mapping.yml`). In this file, there a configuration to map users with `Administrator` and `Administrators` backend roles to `all_access` OpenSearch role. The AD users `Administrator` and `vagrant` belongs to the `Administrators` group, so it means these users have the `all_access` OpenSearch role. You can modify the role mapping from OpenSearch/OpenSearch Dashboard. If you edit the volume mounted on `/usr/share/opensearch/plugins/opensearch-security/securityconfig/roles_mapping.yml`, the changes aren't updated due this file is only used for the initial configuration or you could reapply your initial connfiguration with the `securityadmin.sh` script.