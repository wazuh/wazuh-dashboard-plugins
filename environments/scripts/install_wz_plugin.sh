#!/bin/bash
#: Title : Install Wazuh Plugin
#: Date : 2021-08-05
#: Author : "Matias Ezequiel Moreno" <matiasmoreno876@gmail.com>
#: Version : 1.0
#: Description : Install the Wazuh application in the Kibana container (cluster)
#:
#: Options :
#: $1 [Type of installation] [basic xpack odfe osfe]
#: $2 [Package name into 'packages' folder] [wazuh_kibana-4.1.5_7.10.2-1.zip]
#: $3 [Absolute path to the docker-compose.yml file]
#:
#: Example:
#: sh install_wz_plugin.sh osfe wazuh-4.3.0-1.2.0-rc2.zip /Users/matiasezequielmoreno/Documents/proyectos/wazuh-app-environments/templates_opensearch_prod/opensearch-wz_cluster-agent/docker-compose.yml
#: Uninstall
#: docker exec es_odfe-wz_cluster-agent_kibana_1 bin/kibana-plugin remove wazuh

help() {
    echo
    echo "Usage: $0 [Type of installation] [Package name into 'packages' folder] [Absolute path to the docker-compose.yml file]"
    echo "Type of installation: basic, xpack, odfe, osfe"
    echo
    echo "Example:"
    echo "sh install_wz_plugin.sh osfe wazuh-4.3.0-1.2.0-rc2.zip /Users/matiasezequielmoreno/Documents/proyectos/wazuh-app-environments/templates_opensearch_prod/opensearch-wz_cluster-agent/docker-compose.yml"
    echo
    echo "Uninstall"
    echo "docker exec es_odfe-wz_cluster-agent_kibana_1 bin/kibana-plugin remove wazuh"
    echo
    exit $1
}

install_wz_plugin() {
    docker exec $NAME_CONTAINER_DASHBOARD $PATH_TO_INSTALL_PLUGIN install file:///packages/$2
    docker-compose -f $3 restart $NAME_SERVICE_DASHBOARD
    echo "CONTINUE AFTER 50 SECONDS ..."
    sleep 50
}

config_wz_plugin() {
    # Get ip of manager
    IP_CONTAINER_MANAGER=$(docker exec $NAME_SERVICE_MANAGER hostname -i)
    # Replace ip in wazuh.yml
    docker exec $NAME_CONTAINER_DASHBOARD sed -i -e "s/url: https:\/\/localhost/url: https:\/\/$IP_CONTAINER_MANAGER/g" ./data/wazuh/config/wazuh.yml
    docker exec $NAME_CONTAINER_DASHBOARD cat ./data/wazuh/config/wazuh.yml
}

main() {

    case $1 in
    "basic")
        echo "Installing Wazuh plugin for Kibana in Basic mode environment..."
        NAME_SERVICE_DASHBOARD=kibana
        NAME_CONTAINER_DASHBOARD=es_basic-wz_cluster-agent_kibana_1
        NAME_SERVICE_MANAGER=es_basic-wz_cluster-agent_wazuh-manager-master_1
        PATH_TO_INSTALL_PLUGIN=bin/kibana-plugin
        install_wz_plugin $@
        config_wz_plugin $@
        exit 1
        ;;
    "xpack")
        echo "Installing Wazuh plugin for Kibana in X-Pack mode environment..."
        NAME_SERVICE_DASHBOARD=kibana
        NAME_CONTAINER_DASHBOARD=es_xpack-wz_cluster-agent_kibana_1
        NAME_SERVICE_MANAGER=es_xpack-wz_cluster-agent_wazuh-manager-master_1
        PATH_TO_INSTALL_PLUGIN=bin/kibana-plugin
        install_wz_plugin $@
        config_wz_plugin $@
        exit 1
        ;;
    "odfe")
        echo "Installing Wazuh plugin for Opendistro (ODFE) environment..."
        NAME_SERVICE_DASHBOARD=kibana
        NAME_CONTAINER_DASHBOARD=es_odfe-wz_cluster-agent_kibana_1
        NAME_SERVICE_MANAGER=es_odfe-wz_cluster-agent_wazuh-manager-master_1
        PATH_TO_INSTALL_PLUGIN=bin/kibana-plugin
        install_wz_plugin $@
        config_wz_plugin $@
        exit 1
        ;;
    "osfe")
        echo "Installing Wazuh plugin for Opensearch (OSFE) environment..."
        NAME_SERVICE_DASHBOARD=opensearch_dashboards
        NAME_CONTAINER_DASHBOARD=opensearch-wz_cluster-agent_opensearch_dashboards_1
        NAME_SERVICE_MANAGER=opensearch-wz_cluster-agent_wazuh-manager-master_1
        PATH_TO_INSTALL_PLUGIN=bin/opensearch-dashboards-plugin
        install_wz_plugin $@
        config_wz_plugin $@
        exit 1
        ;;
    "-h" | "--help")
        help 0
        ;;
    *)
        help 0
        ;;
    esac

}

main $@
