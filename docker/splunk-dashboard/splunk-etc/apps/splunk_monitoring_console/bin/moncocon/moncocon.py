import splunk
import splunk.rest as rest

import logging
import os
import sys
import json
import time
from urllib.parse import quote_plus
from pathlib import Path

class MoCoConException(Exception):
    pass


class Moncocon():
    """Splunk Monitoring Console distributed mode automatic configuration

    This code will configure MC to distributed mode IFF there are distributed
    search peers configured. Changes are written to the etc/system/local/distsearch.conf,
    splunk_monitoring_console/local/{app,splunk_monitoring_console_assets}.conf

    In general, the steps taken are
    1. Look up peers at /services/search/distributed/peers
    2. Configure the UI by uploading the default.distributed.xml file to the
    MC nav/xml endpoint
    3. Derive a search group name (i.e., dmc_group_indexer) from the system
    role for a every peer
    4. Add those hosts to the right search groups
    5. Change app.conf settings
    6. Reload the splunk_monitoring_console app

    """
    def __init__(self, session_key=None):
        self.session_key = session_key
        self.SHC_CONFIG_ENDPOINT = '/services/shcluster/config?output_mode=json'
        self.DISABLE_DMC_APP_CONF_ENDPOINT = '/services/apps/local/splunk_monitoring_console/disable?output_mode=json'
        self.MC_ASSETS_CONF = "/servicesNS/nobody/splunk_monitoring_console/configs/conf-splunk_monitoring_console_assets/settings?output_mode=json"
        self.MC_APP_CONF_ENDPOINT = '/servicesNS/nobody/splunk_monitoring_console/configs/conf-app/install?output_mode=json'

        self._first_run = False
        self.search_groups_to_hosts_file = ".search_groups_to_hosts"
        self.lockdir = ".lock"

    def sessionKey(self):
        return self.session_key


    def _log_debug(self, msg):
        log_message = "splunk_monitoring_console auto config - " + msg
        logging.debug(log_message)

    def _log_error(self, msg):
        log_message = "splunk_monitoring_console auto config - " + msg
        logging.error(log_message)

    def _log_info(self, msg):
        log_message = "splunk_monitoring_console auto config - " + msg
        logging.info(log_message)


    def getDefaultDistributed(self):
        """Retrieve the contents of
        /servicesNS/nobody/splunk_monitoring_console/data/ui/nav/default.distributed
        """
        self._log_debug("getDefaultDistributed running")

        # get XML nav
        (response, default_distributed_content) = rest.simpleRequest(
            "/servicesNS/nobody/splunk_monitoring_console/data/ui/nav/default.distributed",
            getargs={
                "output_mode": "json"
            },
            sessionKey=self.sessionKey()
        )

        return default_distributed_content


    def postSettingsToMC(self):
        """set disabled=0 for distribued mode, add configuredPeers entry into
        splunk_monitoring_console_assets.conf
        """

        self._log_debug("postSettingsToMC")

        peers = self.get_peers()
        configuredPeers = []

        for peer in peers["entry"]:
            configuredPeers.append(peer["name"])

        _configuredPeers = ",".join(configuredPeers)

        (response, content) = rest.simpleRequest(
            "/servicesNS/nobody/splunk_monitoring_console/configs/conf-splunk_monitoring_console_assets/settings",
            postargs={
                'disabled': 0,
                "eai:appName": "splunk_monitoring_console",
                "eai:userName": "nobody",
                "configuredPeers": _configuredPeers
            },
            method='POST',
            sessionKey=self.sessionKey()
        )
        return content


    def postIsInstalledToApp(self):
        """Set `is_configured=1` in the `[install]` stanza of `app.conf`
        """

        self._log_debug("postIsInstalledToApp")

        (response, content) = rest.simpleRequest(
            "/servicesNS/nobody/splunk_monitoring_console/configs/conf-app/install",
            postargs={'is_configured': 1},
            method='POST',
            sessionKey=self.sessionKey()
        )

        return content


    def triggerBuildAssetsSavedSearch(self):
        """dispatch saved search that will create the assets.csv"""

        self._log_debug("triggerBuildAssetsSavedSearch")

        try:
            (response, content) = rest.simpleRequest(
                "/servicesNS/nobody/splunk_monitoring_console/saved/searches/DMC%20Asset%20-%20Build%20Full/dispatch",
                method="POST",
                postargs={
                    "trigger_actions": 1,
                },
                sessionKey=self.sessionKey()
            )
        except splunk.SplunkdConnectionException as e:
            logging.error("MC Auto Config - Cannot dispatch search: " + sys.exc_info()[0])

        return content


    def disableStandaloneSearch(self):
        """disable the saved search used for standalone instances' assets.csv"""

        self._log_debug("disableStandaloneSearch")

        (response, content) = rest.simpleRequest(
            "/servicesNS/nobody/splunk_monitoring_console/saved/searches/DMC+Asset+-+Build+Standalone+Asset+Table",
            method="POST",
            postargs={"disabled": 1},
            sessionKey=self.sessionKey()
        )


    def postDistributedAsDefault(self, default_distributed_content):
        """Post the distributed NAV xml to the default menu nav
        """

        self._log_debug("postDistributedAsDefault")

        default_distributed_content = json.loads(default_distributed_content)
        (response, content) = rest.simpleRequest(
            "/servicesNS/nobody/splunk_monitoring_console/data/ui/nav/default",
            method="POST",
            postargs={"eai:data": default_distributed_content["entry"][0]["content"]["eai:data"]},
            sessionKey=self.sessionKey()
        )


    def get_peers(self):
        """download all distribured search peers
        """

        self._log_debug("get_peers")

        (response, content) = rest.simpleRequest(
            "/services/search/distributed/peers",
            method="GET",
            getargs={ "output_mode": "json" },
            sessionKey=self.sessionKey()
        )

        content = json.loads(content)
        return content

    def check_for_peers(self):
        """
        There exists a possibility in a race condition between the search peer
        list and when this code runs. To get around this, we use an exponential
        backoff for listening for peers to calculate an interval to sleep.
        """
        peers_detected = False
        peers = None
        for i in range(3):
            peers = self.get_peers()
            if 'entry' in peers.keys():
                if len(peers['entry']) == 0:
                    sleep_time = (2 ** i) * 10
                    # this will cause a sleep of 10 seconds, 20 seconds, and then
                    # 40 seconds. Some machines will not be ready in fewer seconds.
                    self._log_info("no search peers detected, trying again in " + str(sleep_time) + " seconds")
                    time.sleep(sleep_time)
                else:
                    peers_detected = True
                    break

        if not peers_detected:
            self._log_error("no search peers could be found after 3 attempts, will try again later.")
            return None

        return peers

    def _role_and_host_to_groups(self, roles, host, search_groups_to_hosts):
        """
        Given a host and it's server_roles derive it's correct search group

        returns a dictionary host -> [ search group list ]
        """
        for role in roles:

            if role == "cluster_search_head":
                role = "search_head"

            search_group = "dmc_group_" + role
            stanza = "distributedSearch:" + search_group
            hosts = search_groups_to_hosts.get(stanza, [])

            if host not in hosts:
                hosts.append(host)

            search_groups_to_hosts[stanza] = hosts

        return search_groups_to_hosts

    def _add_self_to_groups(self, search_groups_to_hosts):
        self._log_debug("_add_self_to_groups")

        try:
            (response, content) = rest.simpleRequest(
                "/services/server/info/server-info",
                method="GET",
                getargs={ "output_mode": "json" },
                sessionKey=self.sessionKey()
            )
        except splunk.SplunkdConnectionException as e:
            self._log_error("cannot connect: " + str(e))

        content = json.loads(content)

        roles = content["entry"][0]['content']['server_roles']
        host = "localhost:localhost"

        search_groups_to_hosts = self._role_and_host_to_groups(roles, host, search_groups_to_hosts)

        return search_groups_to_hosts

    def _build_search_groups(self, peers):
        """Create a mapping of searchgroups and hosts and then upload those
        mappings to splunk via editing the distributed search group end points

        Returns: dict(str-> [])
        i.e.:
            "distributedSearch:dmc_group_indexer" -> ['192.168.86.29:9001',
                '192.168.86.29:9011']
        """

        self._log_debug("_build_search_groups")

        search_groups_to_hosts = dict()

        for peer in peers['entry']:
            roles = peer['content']['server_roles']
            host = peer["name"]

            search_groups_to_hosts = self._role_and_host_to_groups(roles, host, search_groups_to_hosts)


        search_groups_to_hosts = self._add_self_to_groups(search_groups_to_hosts)

        return search_groups_to_hosts

    def _save_search_group_to_hosts_data(self, search_groups_to_hosts):
        self._log_debug("_save_search_group_to_hosts_data")

        try:
            fp = Path(__file__).resolve().parent / self.search_groups_to_hosts_file
            search_groups_to_hosts_file = fp
            search_groups_to_hosts_file.write_text(json.dumps(search_groups_to_hosts))
        except OSError as e:
            self._log_error("could not saved current searchgroup state: " + str(e))

    def _open_search_group_to_hosts_data(self):
        fp = None
        try:
            fp = Path(__file__).resolve().parent / self.search_groups_to_hosts_file
        except OSError as e:
            self._log_error("could not load search_group_to_hosts file")

        return fp

    def _has_search_groups_changed(self, search_groups_to_hosts):
        """
        we load up the .search_group_to_hosts file located in moncocon directory

        if we find changes from the groups we have been passsed differe from the
        contents of that file, then return True

        if we find no changes, return False
        """
        self._log_debug("_has_search_groups_changed")

        changes_detected = False

        saved_search_groups_to_hosts = None
        try:
            search_groups_to_hosts_file = self._open_search_group_to_hosts_data();
            saved_search_groups_to_hosts = search_groups_to_hosts_file.read_text()
        except FileNotFoundError as e:
            saved_search_groups_to_hosts = None
            self._first_run = True

        if saved_search_groups_to_hosts is None:
            self._save_search_group_to_hosts_data(search_groups_to_hosts)
            return True

        saved_groups_json = json.loads(saved_search_groups_to_hosts)

        for saved_host in saved_groups_json.keys():
            if saved_host not in search_groups_to_hosts.keys():
                changes_detected = True
                break
            saved_members = saved_groups_json[saved_host]
            current_members = search_groups_to_hosts[saved_host]
            if sorted(current_members) != sorted(saved_members):
                changes_detected = True
                break

        if changes_detected:
            self._save_search_group_to_hosts_data(search_groups_to_hosts)
            self._log_info("search group change detected")

        return changes_detected

    def _edit_distributed_groups(self, search_groups_to_hosts):
        """create/edit the member list of the every search group"""

        self._log_debug("_edit_distributed_groups")

        for stanza in search_groups_to_hosts.keys():
            servers = search_groups_to_hosts[stanza]

            stanza_postfix = stanza.split(":")[1]

            postargs = {"member": servers}
            if stanza == "distributedSearch:dmc_group_indexer":
                postargs["default"] = "true"

            try:
                (resp, content) = rest.simpleRequest(
                    "/services/search/distributed/groups/" + stanza_postfix + "/edit",
                    method="POST",
                    postargs=postargs,
                    sessionKey=self.sessionKey()
                )
            except splunk.ResourceNotFound:
                postargs['name'] = stanza_postfix
                (resp, cont) = rest.simpleRequest(
                    "/services/search/distributed/groups/",
                    method="POST",
                    postargs=postargs,
                    sessionKey=self.sessionKey()
                )


    def _reload_monitoring_console_app(self):
        """after we edit splunk_monitoring_console_assets.conf and app.conf we
        will need reload the changes into the app itself."""

        self._log_debug("_reload_monitoring_console_app")

        (resp, content) = rest.simpleRequest(
            "/servicesNS/admin/system/apps/local/splunk_monitoring_console/_reload",
            method="POST",
            sessionKey=self.sessionKey()
        )

        return content

    def _configure_ui(self):
        """configure UI conditioned on a flag passed into MonCoCon"""
        self._log_debug("_configure_ui")

        default_distributed_content = self.getDefaultDistributed()

        post_install = self.postIsInstalledToApp()

        self.disableStandaloneSearch()

        self.postDistributedAsDefault(default_distributed_content)


    def _is_this_a_shc_instance(self):
        """Test if we are a SHC instance"""

        self._log_debug("_is_this_a_shc_instance")

        try:
            (shc_response, shc_content) = rest.simpleRequest(self.SHC_CONFIG_ENDPOINT, self.sessionKey())
        except Exception as e:
            self._log_error("cannot connect to instance for SHC test: " + str(e))
            return None

        shc_config = json.loads(shc_content)
        mode = shc_config['entry'][0]['content']['mode']
        if mode == 'enabled':
            return True
        else:
            return False

    def is_auto_mc_config_enabled(self):
        """Check if we the Splunk Monitoring console auto config it self is
        enabled"""

        self._log_debug("is_auto_mc_config_enabled")

        try:
            (req_response, req_content) = rest.simpleRequest(self.MC_ASSETS_CONF, self.sessionKey())
        except Exception as e:
            self._log_error("cannot connect to instance for mc_auto_config test: " + str(e))
            return None

        mc_assets_conf = json.loads(req_content)
        are_we_enabled = mc_assets_conf['entry'][0]['content']['mc_auto_config']
        if are_we_enabled == 'enabled':
            return True
        else:
            return False


    def detect_and_set_distributed_mode(self, configure_ui=True):
        """Auto Configure the MC into distributed mode

        This class first will:
            - detect if we are configured to run
            - detect if we are a SHC member or not
        If we pass those checks we will
            - upload nav/UI changes
            - update configs
            - create search groups if they don't exist
            - upload list of search groups for every distributed search peer
            - reload the SMC app
        """
        self._log_debug("detect_and_set_distributed_mode")

        if not self.is_auto_mc_config_enabled():
            self._log_debug("mc_auto_config set to not run")
            return

        if self._is_this_a_shc_instance():
            self._log_debug("SHC is enabled so we are not running")
            return

        peers = self.check_for_peers()
        if peers is None:
            return

        search_groups_to_hosts = self._build_search_groups(peers)

        if self._has_search_groups_changed(search_groups_to_hosts):

            if configure_ui is True:
                self._configure_ui()

            settings_response = self.postSettingsToMC()

            self._reload_monitoring_console_app()

            self._edit_distributed_groups(search_groups_to_hosts)

            started_asset_build = self.triggerBuildAssetsSavedSearch()

        return
