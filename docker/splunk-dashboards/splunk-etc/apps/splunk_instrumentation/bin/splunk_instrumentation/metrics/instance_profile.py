"""InstanceProfile class."""

from builtins import object
from splunk_instrumentation.report import report
from splunk_instrumentation.splunklib import data as spldata
from splunk_instrumentation.constants import SPLUNKRC, VISIBILITY_FIELDS_BY_NAME
from splunk_instrumentation.indexing.query_runner import QueryRunner
from splunk_instrumentation.telemetry_conf_service import TelemetryConfService
from splunk_instrumentation.server_info_service import ServerInfoService
from splunk_instrumentation.deployment_id_manager import DeploymentIdManager
from splunk_instrumentation.service_bundle import ServiceBundle
from splunk_instrumentation.salt_manager import SaltManager


class InstanceProfile(object):
    """InstanceProfile.

    This class will retrieve the instance's information.

    self.server_info = server information will be stored here
    self.visibility  = visibility information will be stored here
    """

    def __init__(self, splunkrc=SPLUNKRC, telemetryConfService=None, serverInfoService=None):
        """Constructor.
        It grabs a query_runner object according to the splunkrc params provided:
            - If splunkrc is a dictionary, it will instantiates a new QueryRuner object.
            - If given other object type, it will do Dependency Injection on query_runner
        """
        splunkrc = (splunkrc or SPLUNKRC)
        if type(splunkrc) is dict:
            self.query_runner = QueryRunner(splunkrc)
        else:
            self.query_runner = splunkrc

        self.profile = {}
        self.service = self.query_runner._splunkd.service

        if not telemetryConfService:
            self.telemetry_conf_service = TelemetryConfService(self.service)
        else:
            self.telemetry_conf_service = telemetryConfService

        if not serverInfoService:
            self.server_info_service = ServerInfoService(self.service)
        else:
            self.server_info_service = serverInfoService

        self.telemetry_conf_service.fetch()
        self.server_info_service.fetch()

        self.service_bundle = ServiceBundle(self.service,
                                            telemetry_conf_service=self.telemetry_conf_service,
                                            server_info_service=self.server_info_service)

        self.salt_manager = SaltManager(self.service_bundle)

        self.deployment_id_manager = DeploymentIdManager(
            self.service,
            telemetry_conf_service=self.telemetry_conf_service,
            server_info_service=self.server_info_service)

        self.roles = {role: True for role in self.server_info['server_roles']}

        # gets cluster info from endpoint
        self._load_json({"end_point": "cluster/config/config", "name": "cluster_config"})

        # Valid values: (master | slave | searchhead | disabled)
        # Note that for a searchhead (with SHC or not) the value will be 'disabled' (rather than 'searchhead')
        # if there is no indexer clustering.
        # If call fails set cluster_mode to disabled.
        self.profile['cluster_mode'] = self._nested_get(self.profile, 'cluster_config.entry.content.mode', 'disabled')

        # gets search captain info from endpoint. noProxy is required so that it fails when instance is not the captain
        self._load_json({"end_point": "shcluster/captain/info", "name": "captain_info"}, noProxy=True, default={})

        # if captain/info returns a value it is captain  : overwrites server roles
        # this is failing so removing for the time being
        # self.roles['shc_captain'] = bool(self.profile.get('captain_info'))

        # if mode is not disabled then add in_cluster to roles   : overwrites server roles
        # Note: 'in_cluster' doesn't mean 'in a cluster', it means 'in a deployment that has indexer clustering'.
        self.roles['in_cluster'] = not self.profile.get('cluster_mode') == 'disabled'
        #   overwrites server roles
        self.roles['cluster_master'] = self.profile.get('cluster_mode') == 'master'

        # determines if the current node has lead_role
        self.roles['lead_node'] = self.eval_instance()

        self._get_visibility()

    def eval_instance(self):
        req_list = [
            {
                "requirements": ['indexer', '!search_peer', '!cluster_slave',
                                 '!shc_member', '!cluster_master',
                                 '!shc_captain', '!cluster_search_head'],
                "label": "Single",
                "result": True
            },

            {
                "requirements": ['cluster_master'],
                "label": "Cluster Master",
                "result": True
            },
            {
                "requirements": ['!cluster_master', 'in_cluster'],
                "label": "Cluster Member not Cluster Master",
                "result": False
            },
            # assume we are already not a cluster member from the above requirements
            {
                "requirements": ['shc_captain'],
                "label": "Search Captain in a non cluster",
                "result": True
            },
            {
                "requirements": ['!cluster_master', 'search_head', '!search_peer',
                                 '!in_cluster', '!cluster_slave', '!shc_member'],
                "label": "Single Search Head",
                "result": True
            },
        ]

        for req in req_list:
            result = evaluate_roles(self.roles, req["requirements"])

            if result:
                report.report("instance.type", req["label"])
                return req["result"]
            else:
                report.report("instance.type", None)

    def opt_in_is_up_to_date(self):
        return self.telemetry_conf_service.opt_in_is_up_to_date()

    @property
    def server_info(self):
        return self.server_info_service.content

    @property
    def server_is_cloud(self):
        return int(self.telemetry_conf_service.content.get('onCloudInstance') or 0)

    def retry_transaction(self):
        self.telemetry_conf_service.retry_cluster_master_sync_transaction()

    def sync_deployment_id(self):
        self.deployment_id_manager.sync_deployment_id()

    def sync_salt(self):
        self.salt_manager.sync_with_cluster()

    def get_deployment_id(self):
        return self.deployment_id_manager.get_deployment_id()

    def _get_visibility(self):
        self.visibility = []
        for name, field in VISIBILITY_FIELDS_BY_NAME.items():
            if int(self.telemetry_conf_service.content.get(field) or 0):
                self.visibility.append(name)

        if not self.opt_in_is_up_to_date():
            self.visibility = ['license'] if 'license' in self.visibility else []

        self.visibility.sort()

    def _nested_get(self, dic, path, default=0, separator='.'):
        """NestedGet.
        default path separator is .
        default value is 0
        """
        keys = path.split(separator)
        for key in keys[:-1]:
            dic = dic.setdefault(key, {})

        if type(dic) is dict:
            return default
        return dic.get(keys[-1])

    def _load_json(self, endpoint, noProxy=False, default={}):
        '''
        calls endpoint['end_point'] and assigns the results to `self.profile[end_point['name']]`
        :param endpoint:
        :return:
        '''
        try:
            path = self._construct_path(endpoint, noProxy)
            payload = self.service.http.request(path,
                                                {'method': 'GET',
                                                 'headers': self.service._auth_headers}).get('body')

            if payload:
                result = (spldata.load(payload.read()))
                self.profile[endpoint['name']] = result['feed']
        # often if license does not permit this call it will return a 402 as exception
        except Exception:
            self.profile[endpoint['name']] = default
            return False

        return True

    def _construct_path(self, endpoint, noProxy):
        path = self.service.authority \
               + self.service._abspath(endpoint["end_point"], owner=self.query_runner._splunkd.namespace['owner'],
                                       app=self.query_runner._splunkd.namespace['app'])
        if (noProxy):
            path += "?noProxy=true"
        return path


def get_instance_profile(splunkrc=None, telemetryConfService=None, serverInfoService=None):
    get_instance_profile.instance = get_instance_profile.instance or InstanceProfile(
        splunkrc, telemetryConfService, serverInfoService)
    return get_instance_profile.instance


def evaluate_roles(roles, rules):
    for reqi in rules:
        if (reqi[0] == "!"):
            reqi = reqi.replace("!", "")
            if roles.get(reqi):
                return False
        elif not roles.get(reqi):
            return False
    return True


def is_lead_node(roles):
    return 'lead_node' in roles and roles['lead_node'] is True


get_instance_profile.instance = None
