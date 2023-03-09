import re
import splunk_instrumentation.constants as constants


def host_from_uri(uri):
    match = re.findall(r'https?://([^:/]+)', uri)
    if match:
        return match[0]
    return None


def make_node(host, uri, roles, auth_method):
    return {
        'host': host,
        'uri': uri,
        'roles': roles,
        'authMethod': auth_method
    }


class NodeList(object):
    """
    Collecting the list of nodes in a deployment
    """

    def __init__(self, service, server_uri=constants.SPLUNKD_URI):
        self.nodes = []
        self.err_msgs = []
        self.service = service
        self.server_uri = server_uri

    def get_server_roles(self):
        return self.service.get_json('/services/server/info')['entry'][0]['content']['server_roles']

    def get_server_conf_cluster_master_uris(self):
        """
        This method is used to read cluster master stanzas from server.conf .
        :return: the cluster master uris from server.conf cm stanzas if there is one or more, [] otherwise
        """
        cm_uris = []
        server_conf_dict = {}
        server_conf_resp = self.service.get_json('/services/configs/conf-server')

        # Add all stanzas in server conf to a dict for later use
        for stanza in server_conf_resp['entry']:
            server_conf_dict[stanza['name']] = stanza

        if 'clustering' in server_conf_dict:
            # Bug SPL-203589, telemetry info is incorrect when search head has 2 indexer cluster connected
            # /services/configs/conf-server changed, we need parse the CM info from the new field
            key_in_content = 'master_uri'
            if not key_in_content in server_conf_dict['clustering']['content'] or not server_conf_dict['clustering']['content'][key_in_content]:
                key_in_content = 'manager_uri'
            cm_stanza_names = server_conf_dict['clustering']['content'][key_in_content].split(',')

            if isinstance(cm_stanza_names, list) and len(cm_stanza_names) > 0:
                for stanza_name in cm_stanza_names:
                    if stanza_name in server_conf_dict:
                        cm_uris.append(server_conf_dict[stanza_name]['content'][key_in_content])

        return cm_uris

    def is_search_head(self):
        return 'search_head' in self.get_server_roles()

    def is_shc_enabled(self):
        try:
            shc_config = self.service.get_json('/services/shcluster/config')
            return not shc_config['entry'][0]['content']['disabled']
        except Exception:
            # May fail if user doesn't have list_search_head_clustering capabilty
            return False

    def append_self(self):
        """
        Adds the local node to the node list result
        """
        if self.is_search_head():
            role = 'search head'
        else:
            role = 'single instance'

        self.nodes.append(make_node(host=host_from_uri(self.server_uri),
                                    uri=self.server_uri,
                                    roles=[role],
                                    auth_method=role))

    def append_shc_members(self):
        """
        Adds SHC members to the node list result
        """
        try:
            shc_member_entries = self.service.get_json('/services/shcluster/member/members', count=-1)['entry']

            # print SHC_members_info
            for member in shc_member_entries:
                roles = ['SHC member']
                if member['content']['is_captain']:
                    roles.append('SHC captain')
                uri = member['content']['mgmt_uri']
                self.nodes.append(make_node(host=host_from_uri(uri),
                                            uri=uri,
                                            roles=roles,
                                            auth_method='search head'))
        except Exception:
            self.err_msgs.append('Could not locate any search head cluster members in this deployment')

    def append_cluster_master(self):
        """
        Adds cluster master to the node list result.
        """
        try:
            cluster_master_info = self.service.get_json('/services/cluster/config')['entry'][0]['content']

            if cluster_master_info['disabled']:
                return None

            def append_nodes(host_uri):
                self.nodes.append(make_node(host=host_from_uri(host_uri),
                                            uri=host_uri,
                                            roles=['cluster master'],
                                            auth_method='cluster master'))

            # If there is more than 1 CM, this output is a '?', so check if valid uri
            if re.match(r'https?://[^:/]+', cluster_master_info['master_uri']):
                uri = cluster_master_info['master_uri']
                append_nodes(uri)
            else:
                # Fetch cm uri's from server.conf
                cluster_master_uris = self.get_server_conf_cluster_master_uris()

                if cluster_master_uris:
                    for uri in cluster_master_uris:
                        append_nodes(uri)

        except Exception:
            self.err_msgs.append('Failed to locate a Cluster Master in this deployment')

    def append_search_peers(self):
        """
        Adds search peers to the node list result
        """
        try:
            search_peer_entries = self.service.get_json('/services/search/distributed/peers', count=-1)['entry']
            for peer in search_peer_entries:

                uri = "{scheme}://{host_port}".format(
                    scheme=('https' if peer['content']['is_https'] else 'http'),
                    host_port=peer['name']
                )
                roles = []
                for role in peer['content']['server_roles']:
                    clean_role_name = role.replace('_', ' ')
                    roles.append(clean_role_name)

                if not roles:
                    roles = ['indexer']

                host = peer['content']['host']
                if not host:
                    host = host_from_uri(uri) or uri

                self.nodes.append(make_node(host=host,
                                            uri=uri,
                                            roles=roles,
                                            auth_method='indexer'))
        except Exception:
            self.err_msgs.append('Failed to locate any search peers/indexers in this deployment')

    # # MVP does not support license master
    # def append_license_master(self):
    #     try:
    #         license_master_info = self.service.get('/services/licenser/localslave', output_mode='json')
    #         uri = json.loads(license_master_info.get('body').read())['entry'][0]['content']['master_uri']
    #         license_master = {'host': re.findall(r'https?://([^:/]+)', uri)[0],
    #                           'uri': uri,
    #                           'roles': ['license master'],
    #                           auth_token: 'license master'}
    #         self.nodes.append(license_master)
    #     except Exception as ex:
    #         self.err_msgs.append('Failed to locate a License Master in this deployment')

    def fetch_nodes(self):
        """
        Gets the License master, SHC Captain, SHC members, Cluster master and
        indexers/search peers
        :return: dictionary containing the list of nodes in a deployment
        """

        self.nodes = []
        self.err_msgs = []

        # Get the search heads
        if self.is_shc_enabled():
            self.append_shc_members()
        elif self.is_search_head():
            self.append_self()

        # Get the Cluster Master
        self.append_cluster_master()

        # Get the search peers or indexers
        self.append_search_peers()

        if len(self.nodes) == 0:
            self.append_self()

        return {'nodes': self.nodes, 'errors': self.err_msgs}


if __name__ == '__main__':
    '''
    This file can be run as a standalone CLI script for debugging.

    There are a few reasons you might do this:

    - To quickly iterate on the endpoint when the target splunk is
      on a remote host.

    - To easily use printf/pdb/ipdb for debugging local or remote
      splunks, without having to jump through hoops to setup a remote
      debugger connection to the endpoint process that splunkd
      spawns, or redirect error logs, etc.

    Usage:

      # CD to ensure python load path is setup correctly
      cd path/to/app_splunk_instrumentation/splunk_instrumentation/bin

      # Use splunk's python so the splunk libs are on the load path too
      splunk cmd python -m splunk_instrumentation.deployment_node_list

      # Alternatively, with a remote splunk
      splunk cmd python -m splunk_instrumentation.deployment_node_list https://remote_splunk:8089

    Example:

      $ splunk cmd python -m splunk_instrumentation.deployment_node_list
      {'errors': ['Could not locate any search head cluster members in this deployment',
                  'Failed to locate a Cluster Master in this deployment'],
       'nodes': [{'authMethod': 'indexer',
                  'host': u'9ac296fad4e8',
                  'roles': [u'indexer', u'license_master', u'search_peer'],
                  'uri': 'https://localhost:8090'}]}
    '''

    import sys
    from splunk_instrumentation.splunkd import Splunkd
    from splunk_instrumentation.cli_token import get_token
    from pprint import pprint

    if len(sys.argv) > 1:
        splunk_uri = sys.argv[1]
    else:
        splunk_uri = 'https://localhost:8089'

    service = Splunkd(server_uri=splunk_uri, token=get_token(splunk_uri))

    node_list = NodeList(service)
    pprint(node_list.fetch_nodes())
